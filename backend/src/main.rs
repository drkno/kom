use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
};
use chrono::{DateTime, FixedOffset};
use dotenvy::dotenv;
use influxdb2::{Client, models::Query as InfluxQuery, FromDataPoint};
use serde::{Deserialize, Serialize};
use std::{env, sync::Arc};
use thiserror::Error;
use tracing_subscriber::EnvFilter;
use tower_http::services::ServeDir;
use tokio::signal;

#[derive(Clone)]
struct ServerState {
    client: Client,
    bucket: String,
}

#[derive(Debug, Error)]
enum ApiError {
    #[error("Influx query failed: {0}")]
    Influx(#[from] influxdb2::RequestError),

    #[error("Unexpected error: {0}")]
    Other(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        println!("API error: {}", self);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": self.to_string() })),
        )
        .into_response()
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, FromDataPoint)]
struct HourRecord {
    time: DateTime<FixedOffset>,
    tempc: f64,
    tempinc: f64,
    humidity: f64,
    humidityin: f64,
    windspeedkph: f64,
    windgustkph: f64,
    winddir: String,
    rainratemm: f64,
    totalrainmm: f64,
    uv: f64,
}

impl Default for HourRecord {
    fn default() -> Self {
        Self {
            time: chrono::prelude::DateTime::from_timestamp(0_i64, 0_u32).unwrap().with_timezone(&FixedOffset::east_opt(0).unwrap()),
            tempc: 0_f64,
            tempinc: 0_f64,
            humidity: 0_f64,
            humidityin: 0_f64,
            windspeedkph: 0_f64,
            windgustkph: 0_f64,
            winddir: "".to_string(),
            rainratemm: 0_f64,
            totalrainmm: 0_f64,
            uv: 0_f64,
        }
    }
}

fn build_hourly_flux(bucket: &str, hours: i64) -> String {
    format!(
        r#"from(bucket: "{bucket}")
  |> range(start: -{hours}h)
  |> filter(fn: (r) => r._measurement == "weather")
  |> filter(fn: (r) =>
    r._field == "tempc" or r._field == "tempinc" or r._field == "humidity" or r._field == "humidityin" or
    r._field == "windspeedkph" or r._field == "windgustkph" or r._field == "winddir" or r._field == "rainratemm" or
    r._field == "totalrainmm" or r._field == "uv")
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
  |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
  |> sort(columns:["_time"])
  |> rename(columns: {{_measurement: "_field", submitted_by: "_value"}})
"#
    )
}

fn build_range_flux(bucket: &str, start: &str, end: &str) -> String {
    format!(
        r#"from(bucket: "{bucket}")
  |> range(start: time(v: "{start}"), stop: time(v: "{end}"))
  |> filter(fn: (r) => r._measurement == "weather")
  |> filter(fn: (r) =>
    r._field == "tempc" or r._field == "tempinc" or r._field == "humidity" or r._field == "humidityin" or
    r._field == "windspeedkph" or r._field == "windgustkph" or r._field == "winddir" or r._field == "rainratemm" or
    r._field == "totalrainmm" or r._field == "uv")
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
  |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
  |> sort(columns:["_time"])
  |> rename(columns: {{_measurement: "_field", submitted_by: "_value"}})
"#
    )
}

async fn query_flux(state: &Arc<ServerState>, flux: &str) -> Result<Vec<HourRecord>, ApiError> {
    let query = InfluxQuery::new(flux.to_owned());
    let result = state
        .client
        .query::<HourRecord>(Some(query))
        .await;

    match result {
        Ok(value) => Ok(value),
        Err(err) => Err(ApiError::Influx(err)),
    }
}

#[derive(Deserialize)]
struct RangeParams {
    start: String,
    end: String,
}

async fn past(
    State(state): State<Arc<ServerState>>,
    Query(params): Query<RangeParams>,
) -> Result<Json<Vec<HourRecord>>, ApiError> {
    let flux = build_range_flux(&state.bucket, &params.start, &params.end);
    let data = query_flux(&state, &flux).await?;
    Ok(Json(data))
}

async fn today(State(state): State<Arc<ServerState>>) -> Result<Json<serde_json::Value>, ApiError> {
    let flux = build_hourly_flux(&state.bucket, 1);
    let mut data = query_flux(&state, &flux).await?;
    data.sort_by_key(|r| r.time);
    if let Some(latest) = data.last() {
        Ok(Json(serde_json::to_value(latest).unwrap()))
    } else {
        Err(ApiError::Other("No data".into()))
    }
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let influx_url = env::var("INFLUX_URL").expect("INFLUX_URL not set");
    let influx_token = env::var("INFLUX_TOKEN").expect("INFLUX_TOKEN not set");
    let bucket = env::var("INFLUX_BUCKET").expect("INFLUX_BUCKET not set");
    let org = env::var("INFLUX_ORG").unwrap_or_else(|_| "default".into());
    let host_name = env::var("HOSTNAME").unwrap_or_else(|_| "0.0.0.0".into());
    let port_number = env::var("PORTNUMBER").unwrap_or_else(|_| "5000".into());
    let binding_address = format!("{host_name}:{port_number}");

    println!("Connecting to InfluxDB server={} org={} bucket={}", influx_url, org, bucket);
    let client = Client::new(influx_url, org, influx_token);
    let state = Arc::new(ServerState {
        client,
        bucket,
    });

    println!("Starting server on {}", binding_address);
    let static_files = ServeDir::new("frontend");
    let router = Router::new()
        .route("/api/past", get(past))
        .route("/api/today", get(today))
        .fallback_service(static_files)
        .with_state(state);
    let listener = tokio::net::TcpListener::bind(binding_address).await.unwrap();
    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown_signal())
        .await.unwrap();
}

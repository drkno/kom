mod flux;
mod types;

use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
};
use chrono::{DateTime, Local, NaiveTime};
use clap::Parser;
use dotenvy::dotenv_override;
use influxdb2::Client;
use serde::Deserialize;
use std::sync::Arc;
use sunrise::{Coordinates, SolarDay, SolarEvent};
use thiserror::Error;
use tokio::signal;
use tower_http::services::{ServeDir, ServeFile};
use tracing_subscriber::EnvFilter;

use crate::ApiError::Other;
use crate::flux::{build_monthly_flux, build_range_flux, query_flux, query_flux_month_records};
use crate::types::{HourRecordWithDerivedTypes, TodayDataWithDerivedTypes};

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Config {
    /// Latitude
    #[arg(long, env = "LAT")]
    lat: f64,

    /// Longitude
    #[arg(long, env = "LONG")]
    long: f64,

    /// InfluxDB URL
    #[arg(long, env = "INFLUX_URL")]
    influx_url: String,

    /// InfluxDB Token
    #[arg(long, env = "INFLUX_TOKEN")]
    influx_token: String,

    /// InfluxDB Bucket
    #[arg(long, env = "INFLUX_BUCKET")]
    influx_bucket: String,

    /// InfluxDB Organization
    #[arg(long, env = "INFLUX_ORG", default_value = "default")]
    influx_org: String,

    /// Hostname to bind to
    #[arg(long, env = "HOSTNAME", default_value = "0.0.0.0")]
    host_name: String,

    /// Port number to bind to
    #[arg(long, env = "PORTNUMBER", default_value = "5000")]
    port_number: String,
}

#[derive(Clone)]
struct ServerState {
    client: Client,
    bucket: String,
    coordinates: Coordinates,
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

fn feels_like_temperature(tempc: f64, humidity: f64, windspeedkph: f64) -> f64 {
    // Australian Apparent Temperature (BOM)
    // Ref: http://www.bom.gov.au/info/thermal_comfort/
    // AT = Ta + 0.33×e − 0.70×ws − 4.00
    // Ta = Dry bulb temperature (°C)
    // e = Water vapour pressure (hPa)
    // ws = Wind speed (m/s) at an elevation of 10 meters

    let ta = tempc;
    let ws_ms = windspeedkph / 3.6;

    // Vapour Pressure (hPa) using Magnus formula approximation
    // e = (rh / 100) * 6.105 * exp((17.27 * Ta) / (237.7 + Ta))
    let e = (humidity / 100.0) * 6.105 * ((17.27 * ta) / (237.7 + ta)).exp();

    ta + (0.33 * e) - (0.70 * ws_ms) - 4.00
}

#[derive(Deserialize)]
struct RangeParams {
    start: String,
    end: String,
}

fn validate_range_params(params: &RangeParams) -> bool {
    let start = DateTime::parse_from_rfc3339(&params.start);

    if let Err(_parse_error) = start {
        return false;
    }

    let end = DateTime::parse_from_rfc3339(&params.end);
    if let Err(_parse_error) = end {
        return false;
    }

    if end.unwrap().lt(&start.unwrap()) {
        return false;
    }

    true
}

async fn past(
    State(state): State<Arc<ServerState>>,
    Query(params): Query<RangeParams>,
) -> Result<Json<Vec<HourRecordWithDerivedTypes>>, ApiError> {
    if !validate_range_params(&params) {
        return Err(Other("Invalid range".to_string()));
    }

    let flux = build_range_flux(&state.bucket, &params.start, &params.end);
    let mut data = query_flux(&state, &flux).await?;
    data.sort_by_key(|r| r.time);

    let mut last_total_rain = data.first().unwrap().totalrainmm.max(0_f64);
    let mut result: Vec<HourRecordWithDerivedTypes> = Vec::new();
    for datum in data {
        let next_total_rain = datum.totalrainmm.max(0_f64);
        let delta = (next_total_rain - last_total_rain).max(0_f64);
        last_total_rain = next_total_rain;

        let mut result_datum = HourRecordWithDerivedTypes::from(datum);
        result_datum.totalrainmm = delta;
        result_datum.feelslike = feels_like_temperature(
            result_datum.tempc,
            result_datum.humidity,
            result_datum.windspeedkph,
        );
        result_datum.feelslikein =
            feels_like_temperature(result_datum.tempinc, result_datum.humidityin, 0_f64);
        result.push(result_datum);
    }
    result.remove(0);

    Ok(Json(result))
}

async fn today(State(state): State<Arc<ServerState>>) -> Result<Json<serde_json::Value>, ApiError> {
    let end = Local::now();
    let start = end
        .with_time(NaiveTime::from_hms_opt(0, 0, 0).unwrap())
        .unwrap();
    let flux = build_range_flux(&state.bucket, &start.to_rfc3339(), &end.to_rfc3339());
    let mut data = query_flux(&state, &flux).await?;
    data.sort_by_key(|r| r.time);

    let last = data.last().unwrap();
    let mut result = TodayDataWithDerivedTypes::default();

    result.time = last.time;
    result.tempc = last.tempc;
    result.tempinc = last.tempinc;
    result.humidity = last.humidity;
    result.humidityin = last.humidityin;
    result.windspeedkph = last.windspeedkph;
    result.windgustkph = last.windgustkph;
    result.winddir = last.winddir.clone();
    result.rainratemm = last.rainratemm;
    result.totalrainmm = last.totalrainmm - data.first().unwrap().totalrainmm;
    result.uv = last.uv;
    let solar_day = SolarDay::new(state.coordinates, Local::now().date_naive());
    result.sunrise = solar_day
        .event_time(SolarEvent::Sunrise)
        .with_timezone(&Local)
        .to_rfc3339();
    result.sunset = solar_day
        .event_time(SolarEvent::Sunset)
        .with_timezone(&Local)
        .to_rfc3339();
    result.solarradiation = last.solarradiation;
    result.feelslike = feels_like_temperature(result.tempc, result.humidity, result.windspeedkph);
    result.feelslikein = feels_like_temperature(result.tempinc, result.humidityin, 0_f64);
    for datum in data {
        result.mintemp = result.mintemp.min(datum.tempc);
        result.maxtemp = result.maxtemp.max(datum.tempc);
        result.mintempin = result.mintempin.min(datum.tempinc);
        result.maxtempin = result.maxtempin.max(datum.tempinc);
        result.maxuv = result.maxuv.max(datum.uv);
    }

    Ok(Json(serde_json::to_value(result).unwrap()))
}

async fn monthly(
    State(state): State<Arc<ServerState>>,
    Query(params): Query<RangeParams>,
) -> Result<Json<serde_json::Value>, ApiError> {
    if !validate_range_params(&params) {
        return Err(Other("Invalid range".to_string()));
    }

    let flux = build_monthly_flux(&state.bucket, &params.start, &params.end);
    let mut data = query_flux_month_records(&state, &flux).await?;
    data.sort_by_key(|r| r.time);

    Ok(Json(serde_json::to_value(data).unwrap()))
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
    dotenv_override().ok();
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let config = Config::parse();

    let coordinates = Coordinates::new(config.lat, config.long).unwrap();

    let binding_address = format!("{}:{}", config.host_name, config.port_number);

    println!(
        "Connecting to InfluxDB server={} org={} bucket={}",
        config.influx_url, config.influx_org, config.influx_bucket
    );
    let client = Client::new(config.influx_url, config.influx_org, config.influx_token);
    let state = Arc::new(ServerState {
        client,
        bucket: config.influx_bucket,
        coordinates,
    });

    println!("Starting server on {}", binding_address);
    let static_files = ServeDir::new("frontend").fallback(ServeFile::new("frontend/index.html"));
    let router = Router::new()
        .route("/api/past", get(past))
        .route("/api/today", get(today))
        .route("/api/monthly", get(monthly))
        .fallback_service(static_files)
        .with_state(state);
    let listener = tokio::net::TcpListener::bind(binding_address)
        .await
        .unwrap();
    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}

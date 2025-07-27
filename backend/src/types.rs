use axum::{
    extract::{Query, State}, http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json,
    Router,
};
use chrono::{DateTime, FixedOffset, Local, NaiveTime, TimeDelta};
use dotenvy::dotenv;
use influxdb2::{models::Query as InfluxQuery, Client, FromDataPoint};
use serde::{Deserialize, Serialize};
use std::{env, sync::Arc};
use sunrise::{Coordinates, SolarDay, SolarEvent};
use thiserror::Error;
use tokio::signal;
use tower_http::services::ServeDir;
use tracing_subscriber::EnvFilter;
use crate::ApiError::Other;

#[derive(Debug, Serialize, Deserialize, Clone, FromDataPoint)]
struct HourRecord {
    time: DateTime<FixedOffset>,
    tempc: f64,
    tempinc: f64,
    humidity: f64,
    humidityin: f64,
    windspeedkph: f64,
    windgustkph: f64,
    winddir: f64,
    rainratemm: f64,
    totalrainmm: f64,
    uv: f64,
    solarradiation: f64,
    feelslike: f64,
    feelslikein: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TodayData {
    time: DateTime<FixedOffset>,
    tempc: f64,
    tempinc: f64,
    humidity: f64,
    humidityin: f64,
    windspeedkph: f64,
    windgustkph: f64,
    winddir: f64,
    rainratemm: f64,
    totalrainmm: f64,
    uv: f64,
    mintemp: f64,
    maxtemp: f64,
    mintempin: f64,
    maxtempin: f64,
    sunrise: String,
    sunset: String,
    maxuv: f64,
    solarradiation: f64,
    feelslike: f64,
    feelslikein: f64,
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
            winddir: 0_f64,
            rainratemm: 0_f64,
            totalrainmm: 0_f64,
            uv: 0_f64,
            solarradiation: f64::MIN,
            feelslike: 0_f64,
            feelslikein: 0_f64,
        }
    }
}

impl Default for TodayData {
    fn default() -> Self {
        Self {
            time: chrono::prelude::DateTime::from_timestamp(0_i64, 0_u32).unwrap().with_timezone(&FixedOffset::east_opt(0).unwrap()),
            tempc: 0_f64,
            tempinc: 0_f64,
            humidity: 0_f64,
            humidityin: 0_f64,
            windspeedkph: 0_f64,
            windgustkph: 0_f64,
            winddir: 0_f64,
            rainratemm: 0_f64,
            totalrainmm: 0_f64,
            uv: 0_f64,
            mintemp: f64::MAX,
            maxtemp: f64::MIN,
            mintempin: f64::MAX,
            maxtempin: f64::MIN,
            sunrise: "".to_string(),
            sunset: "".to_string(),
            maxuv: f64::MIN,
            solarradiation: f64::MIN,
            feelslike: 0_f64,
            feelslikein: 0_f64,
        }
    }
}

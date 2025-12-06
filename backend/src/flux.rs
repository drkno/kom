use crate::types::{HourRecordFlux, MonthRecordFlux};
use std::sync::Arc;
use crate::{ApiError, ServerState};
use influxdb2::models::Query as InfluxQuery;


pub(crate) fn build_range_flux(bucket: &str, start: &str, end: &str) -> String {
    format!(
        r#"from(bucket: "{bucket}")
|> range(start: time(v: "{start}"), stop: time(v: "{end}"))
|> filter(fn: (r) => r._measurement == "weather")
|> filter(fn: (r) =>
r._field == "tempc" or r._field == "tempinc" or r._field == "humidity" or r._field == "humidityin" or
r._field == "windspeedkph" or r._field == "windgustkph" or r._field == "winddir" or r._field == "rainratemm" or
r._field == "totalrainmm" or r._field == "uv" or r._field == "solarradiation")
|> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
|> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
|> sort(columns:["_time"])
|> rename(columns: {{_measurement: "_field", submitted_by: "_value"}})
"#
    )
}

pub(crate) async fn query_flux(state: &Arc<ServerState>, flux: &str) -> Result<Vec<HourRecordFlux>, ApiError> {
    let query = InfluxQuery::new(flux.to_owned());
    let result = state
        .client
        .query::<HourRecordFlux>(Some(query))
        .await;

    match result {
        Ok(value) => Ok(value),
        Err(err) => Err(ApiError::Influx(err)),
    }
}

pub(crate) fn build_monthly_flux(bucket: &str, start: &str, end: &str) -> String {
    format!(r#"maximums = from(bucket: "{bucket}")
|> range(start: time(v: "{start}"), stop: time(v: "{end}"))
|> filter(fn: (r) => r._measurement == "weather")
|> filter(fn: (r) =>
r._field == "tempc" or r._field == "tempinc" or r._field == "humidity" or r._field == "humidityin" or
r._field == "uv" or r._field == "solarradiation")
|> aggregateWindow(every: 1mo, fn: max, createEmpty: false, timeSrc: "_start")
|> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
|> sort(columns:["_time"])
|> drop(columns: ["_model", "_field", "_start", "_stop", "_value", "_measurement", "submitted_by"])

mean_maximums = from(bucket: "{bucket}")
|> range(start: time(v: "{start}"), stop: time(v: "{end}"))
|> filter(fn: (r) => r._measurement == "weather")
|> filter(fn: (r) =>
r._field == "tempc" or r._field == "tempinc" or r._field == "humidity" or r._field == "humidityin" or
r._field == "uv" or r._field == "solarradiation")
|> aggregateWindow(every: 1d, fn: max, createEmpty: false, timeSrc: "_start")
|> aggregateWindow(every: 1mo, fn: mean, createEmpty: false, timeSrc: "_start")
|> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
|> sort(columns:["_time"])
|> drop(columns: ["_model", "_field", "_start", "_stop", "_value", "_measurement", "submitted_by"])

averages = from(bucket: "{bucket}")
|> range(start: time(v: "{start}"), stop: time(v: "{end}"))
|> filter(fn: (r) => r._measurement == "weather")
|> filter(fn: (r) =>
r._field == "tempc" or r._field == "tempinc" or r._field == "humidity" or r._field == "humidityin" or
r._field == "solarradiation")
|> aggregateWindow(every: 1mo, fn: mean, createEmpty: false, timeSrc: "_start")
|> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
|> sort(columns:["_time"])
|> drop(columns: ["_model", "_field", "_start", "_stop", "_value", "_measurement", "submitted_by"])

mean_minimums = from(bucket: "{bucket}")
|> range(start: time(v: "{start}"), stop: time(v: "{end}"))
|> filter(fn: (r) => r._measurement == "weather")
|> filter(fn: (r) =>
r._field == "tempc" or r._field == "tempinc" or r._field == "humidity" or r._field == "humidityin" or
r._field == "solarradiation")
|> aggregateWindow(every: 1d, fn: min, createEmpty: false, timeSrc: "_start")
|> aggregateWindow(every: 1mo, fn: mean, createEmpty: false, timeSrc: "_start")
|> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
|> sort(columns:["_time"])
|> drop(columns: ["_model", "_field", "_start", "_stop", "_value", "_measurement", "submitted_by"])

minimums = from(bucket: "{bucket}")
|> range(start: time(v: "{start}"), stop: time(v: "{end}"))
|> filter(fn: (r) => r._measurement == "weather")
|> filter(fn: (r) =>
r._field == "tempc" or r._field == "tempinc" or r._field == "humidity" or r._field == "humidityin" or
r._field == "solarradiation")
|> aggregateWindow(every: 1mo, fn: min, createEmpty: false, timeSrc: "_start")
|> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
|> sort(columns:["_time"])
|> drop(columns: ["_model", "_field", "_start", "_stop", "_value", "submitted_by"])

rainy_days = from(bucket: "{bucket}")
|> range(start: time(v: "{start}"), stop: time(v: "{end}"))
|> filter(fn: (r) => r._measurement == "weather")
|> filter(fn: (r) => r._field == "totalrainmm")
|> aggregateWindow(every: 1d, fn: last, timeSrc: "_start")
|> map(fn: (r) => ({{ r with _value: if exists r._value then r._value else 0.0 }}))
|> difference(nonNegative: true, initialZero: true)

total_rain = rainy_days
|> aggregateWindow(every: 1mo, fn: sum, createEmpty: false, timeSrc: "_start")
|> rename(columns: {{ _value: "totalrainmm" }})
|> drop(columns: ["_model", "_field", "_start", "_stop", "_value", "_measurement", "submitted_by", "model"])

rainy_days_count = rainy_days
|> map(fn: (r) => ({{ r with _value: if r._value > 0 then 1 else 0 }}))
|> aggregateWindow(every: 1mo, fn: sum, createEmpty: false, timeSrc: "_start")
|> rename(columns: {{ _value: "raindayscount" }})
|> drop(columns: ["model", "_field", "_start", "_stop", "_value", "_measurement", "submitted_by"])

rain = join(
    tables: {{left: total_rain, right: rainy_days_count}},
    on: ["_time"],
    method: "inner"
)

max_mmax = join(
  tables: {{absolute: maximums, mean: mean_maximums}},
  on: ["_time"],
  method: "inner"
)

min_mmin = join(
  tables: {{absolute: minimums, mean: mean_minimums}},
  on: ["_time"],
  method: "inner"
)

min_max = join(
  tables: {{min: min_mmin, max: max_mmax}},
  on: ["_time"],
  method: "inner"
)

max_and_avgs = join(
  tables: {{abs: min_max, avg: averages}},
  on: ["_time"],
  method: "inner"
)

all_stats = join(
    tables: {{left: max_and_avgs, right: rain}},
    on: ["_time"],
    method: "inner"
)

all_stats
  |> sort(columns: ["_time"])
  |> rename(columns: {{_measurement: "_field", model: "_value"}})
    "#)
}


pub(crate) async fn query_flux_month_records(state: &Arc<ServerState>, flux: &str) -> Result<Vec<MonthRecordFlux>, ApiError> {
    let query = InfluxQuery::new(flux.to_owned());
    let result = state
        .client
        .query::<MonthRecordFlux>(Some(query))
        .await;

    match result {
        Ok(value) => Ok(value),
        Err(err) => Err(ApiError::Influx(err)),
    }
}
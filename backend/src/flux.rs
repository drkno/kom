use crate::types::{HourRecordFlux};
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
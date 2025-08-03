use chrono::{DateTime, FixedOffset};
use influxdb2::FromDataPoint;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, FromDataPoint)]
pub(crate) struct HourRecordFlux {
    pub(crate) time: DateTime<FixedOffset>,
    pub(crate) tempc: f64,
    pub(crate) tempinc: f64,
    pub(crate) humidity: f64,
    pub(crate) humidityin: f64,
    pub(crate) windspeedkph: f64,
    pub(crate) windgustkph: f64,
    pub(crate) winddir: f64,
    pub(crate) rainratemm: f64,
    pub(crate) totalrainmm: f64,
    pub(crate) uv: f64,
    pub(crate) solarradiation: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct HourRecordWithDerivedTypes {
    pub(crate) time: DateTime<FixedOffset>,
    pub(crate) tempc: f64,
    pub(crate) tempinc: f64,
    pub(crate) humidity: f64,
    pub(crate) humidityin: f64,
    pub(crate) windspeedkph: f64,
    pub(crate) windgustkph: f64,
    pub(crate) winddir: f64,
    pub(crate) rainratemm: f64,
    pub(crate) totalrainmm: f64,
    pub(crate) uv: f64,
    pub(crate) solarradiation: f64,
    pub(crate) feelslike: f64,
    pub(crate) feelslikein: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromDataPoint)]
pub(crate) struct TodayDataFlux {
    pub(crate) time: DateTime<FixedOffset>,
    pub(crate) tempc: f64,
    pub(crate) tempinc: f64,
    pub(crate) humidity: f64,
    pub(crate) humidityin: f64,
    pub(crate) windspeedkph: f64,
    pub(crate) windgustkph: f64,
    pub(crate) winddir: f64,
    pub(crate) rainratemm: f64,
    pub(crate) totalrainmm: f64,
    pub(crate) uv: f64,
    pub(crate) mintemp: f64,
    pub(crate) maxtemp: f64,
    pub(crate) mintempin: f64,
    pub(crate) maxtempin: f64,
    pub(crate) solarradiation: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct TodayDataWithDerivedTypes {
    pub(crate) time: DateTime<FixedOffset>,
    pub(crate) tempc: f64,
    pub(crate) tempinc: f64,
    pub(crate) humidity: f64,
    pub(crate) humidityin: f64,
    pub(crate) windspeedkph: f64,
    pub(crate) windgustkph: f64,
    pub(crate) winddir: f64,
    pub(crate) rainratemm: f64,
    pub(crate) totalrainmm: f64,
    pub(crate) uv: f64,
    pub(crate) mintemp: f64,
    pub(crate) maxtemp: f64,
    pub(crate) mintempin: f64,
    pub(crate) maxtempin: f64,
    pub(crate) sunrise: String,
    pub(crate) sunset: String,
    pub(crate) maxuv: f64,
    pub(crate) solarradiation: f64,
    pub(crate) feelslike: f64,
    pub(crate) feelslikein: f64,
}

impl Default for HourRecordFlux {
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
        }
    }
}

impl Default for HourRecordWithDerivedTypes {
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
            feelslike: f64::MIN,
            feelslikein: f64::MIN,
        }
    }
}

impl From<HourRecordFlux> for HourRecordWithDerivedTypes {
    fn from(flux_record: HourRecordFlux) -> HourRecordWithDerivedTypes {
        let mut new_record = HourRecordWithDerivedTypes::default();
        new_record.time = flux_record.time;
        new_record.tempc = flux_record.tempc;
        new_record.tempinc = flux_record.tempinc;
        new_record.humidity = flux_record.humidity;
        new_record.humidityin = flux_record.humidityin;
        new_record.windspeedkph = flux_record.windspeedkph;
        new_record.windgustkph = flux_record.windgustkph;
        new_record.winddir = flux_record.winddir;
        new_record.rainratemm = flux_record.rainratemm;
        new_record.totalrainmm = flux_record.totalrainmm;
        new_record.uv = flux_record.uv;
        new_record.solarradiation = flux_record.solarradiation;
        new_record
    }
}

impl Default for TodayDataFlux {
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
            solarradiation: f64::MIN,
        }
    }
}

impl Default for TodayDataWithDerivedTypes {
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
            feelslike: f64::MIN,
            feelslikein: f64::MIN,
        }
    }
}

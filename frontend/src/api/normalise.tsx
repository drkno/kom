import type { HourRecord, TodayData, MonthRecord } from "./types";

export const normaliseTodayData = (todayData: TodayData): TodayData => {
    return Object.assign({}, normaliseHourRecord(todayData), {
        mintemp: round(1, todayData.mintemp),
        maxtemp: round(1, todayData.maxtemp),
        mintempin: round(1, todayData.mintempin),
        maxtempin: round(1, todayData.maxtempin),
        sunrise: todayData.sunrise,
        sunset: todayData.sunset,
        maxuv: round(1, todayData.maxuv),
    });
}

export const normaliseHourRecord = (hourRecord: HourRecord): HourRecord => {
    return {
        time: hourRecord.time,
        tempc: round(1, hourRecord.tempc),
        tempinc: round(1, hourRecord.tempinc),
        humidity: round(1, hourRecord.humidity),
        humidityin: round(1, hourRecord.humidityin),
        windspeedkph: round(1, hourRecord.windspeedkph),
        windgustkph: round(1, hourRecord.windgustkph),
        winddir: hourRecord.winddir,
        rainratemm: round(2, hourRecord.rainratemm),
        totalrainmm: round(2, hourRecord.totalrainmm),
        uv: round(1, hourRecord.uv),
        feelslike: round(1, hourRecord.feelslike),
        feelslikein: round(1, hourRecord.feelslikein),
    };
};

export const normaliseMonthRecord = (monthRecord: MonthRecord): MonthRecord => {
    return {
        time: monthRecord.time,
        humidity: round(1, monthRecord.humidity)!,
        humidity_absolute_max: round(1, monthRecord.humidity_absolute_max)!,
        humidity_absolute_min: round(1, monthRecord.humidity_absolute_min)!,
        humidity_mean_max: round(1, monthRecord.humidity_mean_max)!,
        humidity_mean_min: round(1, monthRecord.humidity_mean_min)!,
        humidityin: round(1, monthRecord.humidityin)!,
        humidityin_absolute_max: round(1, monthRecord.humidityin_absolute_max)!,
        humidityin_absolute_min: round(1, monthRecord.humidityin_absolute_min)!,
        humidityin_mean_max: round(1, monthRecord.humidityin_mean_max)!,
        humidityin_mean_min: round(1, monthRecord.humidityin_mean_min)!,
        solarradiation: round(1, monthRecord.solarradiation)!,
        solarradiation_absolute_max: round(1, monthRecord.solarradiation_absolute_max)!,
        solarradiation_absolute_min: round(1, monthRecord.solarradiation_absolute_min)!,
        solarradiation_mean_max: round(1, monthRecord.solarradiation_mean_max)!,
        solarradiation_mean_min: round(1, monthRecord.solarradiation_mean_min)!,
        tempc: round(1, monthRecord.tempc)!,
        tempc_absolute_max: round(1, monthRecord.tempc_absolute_max)!,
        tempc_absolute_min: round(1, monthRecord.tempc_absolute_min)!,
        tempc_mean_max: round(1, monthRecord.tempc_mean_max)!,
        tempc_mean_min: round(1, monthRecord.tempc_mean_min)!,
        tempinc: round(1, monthRecord.tempinc)!,
        tempinc_absolute_max: round(1, monthRecord.tempinc_absolute_max)!,
        tempinc_absolute_min: round(1, monthRecord.tempinc_absolute_min)!,
        tempinc_mean_max: round(1, monthRecord.tempinc_mean_max)!,
        tempinc_mean_min: round(1, monthRecord.tempinc_mean_min)!,
        totalrainmm: round(1, monthRecord.totalrainmm)!,
        uv_absolute: round(1, monthRecord.uv_absolute)!,
        uv_mean: round(1, monthRecord.uv_mean)!,
        raindayscount: round(1, monthRecord.raindayscount)!,
    };
};

const round = (places: number, value?: number) => {
    if (value === void(0) || value === null) {
        return;
    }
    return +value.toFixed(places);
};

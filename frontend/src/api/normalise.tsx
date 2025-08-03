import type { HourRecord, TodayData } from "./types";

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

const round = (places: number, value?: number) => {
    if (value === void(0) || value === null) {
        return;
    }
    return +value.toFixed(places);
};

export interface HourRecord {
  time: string; // ISO string
  tempc?: number;
  tempinc?: number;
  humidity?: number;
  humidityin?: number;
  windspeedkph?: number;
  windgustkph?: number;
  winddir?: number;
  rainratemm?: number;
  totalrainmm?: number;
  uv?: number;
  solarradiation?: number;
  feelslike?: number;
  feelslikein?: number;
}

export interface TodayData extends HourRecord {
  mintemp?: number;
  maxtemp?: number;
  mintempin?: number;
  maxtempin?: number;
  sunrise?: string;
  sunset?: string;
  maxuv?: number;
}

export interface MonthRecord {
  time: string,
  humidity: number,
  humidity_absolute_max: number,
  humidity_absolute_min: number,
  humidity_mean_max: number,
  humidity_mean_min: number,
  humidityin: number,
  humidityin_absolute_max: number,
  humidityin_absolute_min: number,
  humidityin_mean_max: number,
  humidityin_mean_min: number,
  solarradiation: number,
  solarradiation_absolute_max: number,
  solarradiation_absolute_min: number,
  solarradiation_mean_max: number,
  solarradiation_mean_min: number,
  tempc: number,
  tempc_absolute_max: number,
  tempc_absolute_min: number,
  tempc_mean_max: number,
  tempc_mean_min: number,
  tempinc: number,
  tempinc_absolute_max: number,
  tempinc_absolute_min: number,
  tempinc_mean_max: number,
  tempinc_mean_min: number,
  totalrainmm: number,
  uv_absolute: number,
  uv_mean: number,
  raindayscount: number,
}

export type LoadingOrValue<T> = {
    loading: true;
} | {
    loading: false;
    value: T;
}

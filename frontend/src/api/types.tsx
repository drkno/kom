export interface HourRecord {
  time: string; // ISO string
  tempc?: number;
  tempinc?: number;
  humidity?: number;
  humidityin?: number;
  windspeedkph?: number;
  windgustkph?: number;
  winddir?: string;
  rainratemm?: number;
  totalrainmm?: number;
  uv?: number;
  solarradiation?: number;
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

export type LoadingOrValue<T> = {
    loading: true;
} | {
    loading: false;
    value: T;
}

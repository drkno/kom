export interface HourRecord {
  _time: string; // ISO string
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
}

export interface TodayData extends HourRecord {
  minTemp?: number;
  maxTemp?: number;
  minTempIn?: number;
  maxTempIn?: number;
  sunrise?: string;
  sunset?: string;
  maxUV?: number;
}

export type LoadingOrValue<T> = {
    loading: true;
} | {
    loading: false;
    value: T;
}

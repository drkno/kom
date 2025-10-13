import { Temporal } from 'temporal-polyfill';
import type { LoadingOrValue, MonthRecord } from './types.tsx';
import useApi from './useApi.tsx';
import { normaliseMonthRecord } from './normalise.tsx';

const mockValuesForTesting: MonthRecord[] = [
    {
    "humidity": 80.3242433964282,
    "humidity_absolute_max": 97,
    "humidity_absolute_min": 26,
    "humidity_mean_max": 93.1666666666667,
    "humidity_mean_min": 51.1666666666667,
    "humidityin": 64.9376537268741,
    "humidityin_absolute_max": 80,
    "humidityin_absolute_min": 52,
    "humidityin_mean_max": 72.5,
    "humidityin_mean_min": 60,
    "solarradiation": 146.950643781414,
    "solarradiation_absolute_max": 1390.68,
    "solarradiation_absolute_min": 0,
    "solarradiation_mean_max": 990.096666666667,
    "solarradiation_mean_min": 0,
    "tempc": 24.5072719495244,
    "tempc_absolute_max": 44.5,
    "tempc_absolute_min": 20.1,
    "tempc_mean_max": 33.0833333333333,
    "tempc_mean_min": 21.3,
    "tempinc": 26.5229173350442,
    "tempinc_absolute_max": 29.3,
    "tempinc_absolute_min": 23.7,
    "tempinc_mean_max": 27.7166666666667,
    "tempinc_mean_min": 24.6333333333333,
    "time": "2025-02-01T00:00:00Z",
    "totalrainmm": 9.57614768473896,
    "uv_absolute": 13,
    "uv_mean": 9.16666666666667,
    "raindayscount": 11,
  },
  {
    "humidity": 74.1748902284736,
    "humidity_absolute_max": 99,
    "humidity_absolute_min": 22,
    "humidity_mean_max": 89,
    "humidity_mean_min": 45.5,
    "humidityin": 60.9322021284513,
    "humidityin_absolute_max": 80,
    "humidityin_absolute_min": 29,
    "humidityin_mean_max": 67.3214285714286,
    "humidityin_mean_min": 52.5,
    "solarradiation": 169.312801716652,
    "solarradiation_absolute_max": 1604.07,
    "solarradiation_absolute_min": 0,
    "solarradiation_mean_max": 1105.86678571429,
    "solarradiation_mean_min": 0,
    "tempc": 24.6367964079282,
    "tempc_absolute_max": 39.9,
    "tempc_absolute_min": 16.6,
    "tempc_mean_max": 33.2,
    "tempc_mean_min": 20.6214285714286,
    "tempinc": 26.6128798590954,
    "tempinc_absolute_max": 30.1,
    "tempinc_absolute_min": 23.7,
    "tempinc_mean_max": 28.125,
    "tempinc_mean_min": 25.0035714285714,
    "time": "2025-03-01T00:00:00Z",
    "totalrainmm": 61.0991741807757,
    "uv_absolute": 15,
    "uv_mean": 10.25,
    "raindayscount": 11,
  }
];

const loadMonthlyDataForRange = async (start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime): Promise<MonthRecord[]> => {
    const url = new URL('/api/monthly', window.location.origin);
    url.searchParams.set('start', start.toString({ timeZoneName: 'never' }));
    url.searchParams.set('end', end.toString({ timeZoneName: 'never' }));
    const res = await fetch(url.toString());
    return (await res.json())
        .map(normaliseMonthRecord);
};

const usePastApi = (valuesFrom: Temporal.ZonedDateTime, valuesTo: Temporal.ZonedDateTime): LoadingOrValue<MonthRecord[]> =>
    useApi(
        { start: valuesFrom, end: valuesTo },
        [],
        mockValuesForTesting,
        async ({ start, end }) => loadMonthlyDataForRange(start, end));

export default usePastApi;

import type { Temporal } from 'temporal-polyfill';
import type { LoadingOrValue, HourRecord } from './types.tsx';
import useApi from './useApi.tsx';

const mockValuesForTesting: HourRecord[] = [
    {
        _time: '2023-10-01T00:00:00Z',
        tempc: 20.1,
        tempinc: 33,
        humidity: 12.3,
        humidityin: 84.5,
        windspeedkph: 12.6,
        windgustkph: 13.6,
        winddir: 'W',
        rainratemm: 2,
        totalrainmm: 2,
        uv: 5
    },
    {
        _time: '2023-10-01T01:00:00Z',
        tempc: 19.8,
        tempinc: 32,
        humidity: 13.0,
        humidityin: 85.0,
        windspeedkph: 11.0,
        windgustkph: 12.0,
        winddir: 'NW',
        rainratemm: 1,
        totalrainmm: 3,
        uv: 4
    }
];

const loadPastDataForRange = async (start: Temporal.Instant, end: Temporal.Instant): Promise<HourRecord[]> => {
    const url = new URL('/api/past', window.location.origin);
    url.searchParams.set('start', start.toString());
    url.searchParams.set('end', end.toString());
    const res = await fetch(url.toString());
    return await res.json();
};

const usePastApi = (valuesFrom: Temporal.Instant, valuesTo: Temporal.Instant): LoadingOrValue<HourRecord[]> =>
    useApi(
        { start: valuesFrom, end: valuesTo },
        [],
        mockValuesForTesting,
        async ({ start, end }) => loadPastDataForRange(start, end));

export default usePastApi;

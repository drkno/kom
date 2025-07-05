import type { LoadingOrValue, HourRecord } from './types.tsx';
import useApi from './useApi.tsx';

const mockValuesForTesting: HourRecord = {
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
};

const loadHourly = async (): Promise<HourRecord> => {
    const response = await fetch('/api/hourly?hours=12');
    return await response.json();
};

const useHourlyApi = (): LoadingOrValue<HourRecord> => useApi({}, null, mockValuesForTesting, loadHourly);

export default useHourlyApi;
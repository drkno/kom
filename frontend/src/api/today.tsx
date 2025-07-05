import type { LoadingOrValue, TodayData } from './types.tsx';
import useApi from './useApi.tsx';

const mockValuesForTesting: TodayData = {
  _time: new Date().toISOString(),
  tempc: 20,
  tempinc: 22,
  humidity: 50,
  humidityin: 55,
  windspeedkph: 10,
  windgustkph: 15,
  winddir: 'N',
  rainratemm: 0,
  totalrainmm: 0,
  uv: 4,
  minTemp: 18,
  maxTemp: 22,
  minTempIn: 19,
  maxTempIn: 23,
  sunrise: '06:00',
  sunset: '18:00',
  maxUV: 6
};

const loadToday = async(): Promise<TodayData> => {
    const response = await fetch('/api/today');
    return await response.json();
};

const useTodayApi = (): LoadingOrValue<TodayData> => useApi({}, null, mockValuesForTesting, loadToday);

export default useTodayApi;

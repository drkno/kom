import { normaliseTodayData } from './normalise.tsx';
import type { LoadingOrValue, TodayData } from './types.tsx';
import useApi from './useApi.tsx';

const mockValuesForTesting: TodayData = {
  time: new Date().toISOString(),
  tempc: 20,
  tempinc: 22,
  humidity: 50,
  humidityin: 55,
  windspeedkph: 10,
  windgustkph: 15,
  winddir: 0.0,
  rainratemm: 0,
  totalrainmm: 0,
  uv: 4,
  mintemp: 18,
  maxtemp: 22,
  mintempin: 19,
  maxtempin: 23,
  sunrise: '06:00',
  sunset: '18:00',
  maxuv: 6,
  feelslike: 21,
  feelslikein: 24
};

const loadToday = async(): Promise<TodayData> => {
    const response = await fetch('/api/today');
    return normaliseTodayData(await response.json());
};

const useTodayApi = (): LoadingOrValue<TodayData> => useApi({}, null, mockValuesForTesting, loadToday);

export default useTodayApi;

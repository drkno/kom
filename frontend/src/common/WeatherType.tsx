import React from 'react';
import SunnyIcon from '@mui/icons-material/Sunny';
import CloudIcon from '@mui/icons-material/Cloud';
import CloudySnowingIcon from '@mui/icons-material/CloudySnowing';
import NightlightIcon from '@mui/icons-material/Nightlight';
import type { HourRecord, TodayData } from '../api';
import { isNight } from '../util/derive';

export type WeatherType = 'Clear' | 'Mostly Clear' | 'Overcast' | 'Rain';

const getWeatherType = (rain: number, solarradiation: number, hour: number): WeatherType => {
    let weatherType: WeatherType = 'Mostly Clear';
    if (rain > 0) {
        weatherType = 'Rain';
    }
    else if (isNight(hour)) {
        weatherType = 'Clear';
    }
    else if (solarradiation < 100) {
        weatherType = 'Overcast';
    }
    else {
        weatherType = 'Mostly Clear';
    }
    return weatherType;
};

export const WeatherName: React.FC<{ record: HourRecord | TodayData, hour: number }> = ({ record, hour }) => {
    const rain = record.rainratemm || 0;
    const solarradiation = record.solarradiation || 0;
    const weatherType = getWeatherType(rain, solarradiation, hour);
    return (<span>{weatherType}</span>);
};


export const WeatherIcon: React.FC<{ record: HourRecord | TodayData, hour: number, size: 'large' | 'medium' | 'small' }> = ({ record, hour, size }) => {
    const rain = record.rainratemm || 0;
    const solarradiation = record.solarradiation || 0;
    const weatherType = getWeatherType(rain, solarradiation, hour);
    switch (weatherType) {
        case 'Clear':
            return <NightlightIcon fontSize={size} />;
        case 'Mostly Clear':
            return <SunnyIcon fontSize={size} />;
        case 'Overcast':
            return <CloudIcon fontSize={size} />;
        case 'Rain':
            return <CloudySnowingIcon fontSize={size} />;
        default:
            return null;
    }
};

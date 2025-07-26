import React from 'react';
import {
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import TemperatureCard from './TemperatureCard';
import OverviewCard, { type WeatherType } from './OverviewCard';
import Loading from '../common/Loading.tsx';
import { feelsLike } from '../util';
import { loadToday } from '../api';
import { Temporal } from 'temporal-polyfill';

const CurrentCard: React.FC = () => {
    const loadTodayResult = loadToday();
    if (loadTodayResult.loading) {
        return <Loading />;
    }
    const todayData = loadTodayResult.value;

    const hour = Temporal.Now.zonedDateTimeISO().hour;
    let weatherType: WeatherType = 'Mostly Clear';
    if (todayData.totalrainmm && todayData.totalrainmm > 0) {
        weatherType = 'Rain';
    } else if (hour <= 6 || hour >= 18) {
        weatherType = 'Clear';
    } else if (todayData.solarradiation && todayData.solarradiation < 100) {
        weatherType = 'Overcast';
    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Grid container spacing={2}>
                    <TemperatureCard
                        title="Outdoor"
                        temp={todayData.tempc}
                        feels={feelsLike(todayData.tempc, todayData.humidity)}
                        min={todayData.mintemp}
                        max={todayData.maxtemp}
                    />
                    <OverviewCard
                        weatherType={weatherType}
                        rain={todayData.totalrainmm}
                    />
                    <TemperatureCard
                        title="Indoor"
                        temp={todayData.tempinc}
                        feels={feelsLike(todayData.tempinc, todayData.humidityin)}
                        min={todayData.mintempin}
                        max={todayData.maxtempin}
                        style={{ textAlign: 'right' }}
                    />
                </Grid>
            </CardContent>
        </Card>
    );
};

export default CurrentCard;

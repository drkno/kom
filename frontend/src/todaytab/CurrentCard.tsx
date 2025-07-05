import React from 'react';
import {
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import TemperatureCard from './TemperatureCard';
import Loading from '../common/Loading.tsx';
import { feelsLike } from '../util';
import { loadToday } from '../api';

const CurrentCard: React.FC = () => {
    const loadTodayResult = loadToday();
    if (loadTodayResult.loading) {
        return <Loading />;
    }
    const todayData = loadTodayResult.value;

    return (
        <Card variant="outlined">
            <CardContent>
                <Grid container spacing={2}>
                    <TemperatureCard
                        title="Outdoor"
                        temp={todayData.tempc}
                        feels={feelsLike(todayData.tempc, todayData.humidity)}
                        min={todayData.minTemp}
                        max={todayData.maxTemp}
                    />
                    <TemperatureCard
                        title="Indoor"
                        temp={todayData.tempinc}
                        feels={feelsLike(todayData.tempinc, todayData.humidityin)}
                        min={todayData.minTempIn}
                        max={todayData.maxTempIn}
                        style={{ textAlign: 'right' }}
                    />
                </Grid>
            </CardContent>
        </Card>
    );
};

export default CurrentCard;

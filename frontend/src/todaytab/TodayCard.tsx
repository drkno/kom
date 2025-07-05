import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography
} from '@mui/material';
import Loading from '../common/Loading.tsx';
import { loadToday } from '../api';
import { dewPoint } from '../util';

const TodayCard: React.FC = () => {
    const loadTodayResult = loadToday();
    if (loadTodayResult.loading) {
        return <Loading />;
    }
    const todayData = loadTodayResult.value;

    return (
        <Card variant="outlined">
            <CardContent>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Current Weather
                        </Typography>
                        <Typography variant="body2">
                            Wind: {todayData.windspeedkph ?? '--'} kph {todayData.winddir ?? ''}
                        </Typography>
                        <Typography variant="body2">Humidity: {todayData.humidity ?? '--'}%</Typography>
                        <Typography variant="body2">Dew Point: {dewPoint(todayData.tempc, todayData.humidity)}°C</Typography>
                        <Typography variant="body2">Rain since midnight: {todayData.totalrainmm ?? '--'} mm</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Sun & UV
                        </Typography>
                        <Typography variant="body2">Sunrise: {todayData.sunrise ?? '--'}</Typography>
                        <Typography variant="body2">Sunset: {todayData.sunset ?? '--'}</Typography>
                        <Typography variant="body2">Max UV: {todayData.maxUV ?? '--'}</Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default TodayCard;

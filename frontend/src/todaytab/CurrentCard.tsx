import React from 'react';
import {
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import TemperatureCard from './TemperatureCard';
import OverviewCard from './OverviewCard';
import Loading from '../common/Loading.tsx';
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
                        feels={todayData.feelslike}
                        min={todayData.mintemp}
                        max={todayData.maxtemp}
                        sx={{ textAlign: { xs: 'center', md: 'left' } }}
                    />
                    <OverviewCard todayData={todayData} />
                    <TemperatureCard
                        title="Indoor"
                        temp={todayData.tempinc}
                        feels={todayData.feelslikein}
                        min={todayData.mintempin}
                        max={todayData.maxtempin}
                        sx={{ textAlign: { xs: 'center', md: 'right' } }}
                    />
                </Grid>
            </CardContent>
        </Card>
    );
};

export default CurrentCard;

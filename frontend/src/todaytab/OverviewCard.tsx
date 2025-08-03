import React from 'react';
import {
    Grid,
    Typography,
} from '@mui/material';
import { WeatherIcon, WeatherName } from '../common/WeatherType.tsx';
import type { TodayData } from '../api/types.tsx';
import { Temporal } from 'temporal-polyfill';

const TemperatureCard: React.FC<{ todayData: TodayData }> = ({
    todayData,
}) => {
    const hour = Temporal.Now.instant().toZonedDateTimeISO('Australia/Sydney').hour;
    return (
        <Grid size={{ xs: 12, md: 4 }} fontStyle={{textAlign: 'center'}}>
            <WeatherIcon record={todayData} hour={hour} size='large' />
            <Typography variant="h4" gutterBottom>
                <WeatherName record={todayData} hour={hour} />
            </Typography>
            <Typography variant="h5" gutterBottom>
                {todayData.totalrainmm != null && todayData.totalrainmm > 0 ? `${todayData.totalrainmm}mm rain` : 'No rain'}
            </Typography>
        </Grid>
    );
};

export default TemperatureCard;
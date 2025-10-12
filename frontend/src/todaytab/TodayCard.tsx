import React from 'react';
import {
    Card,
    CardContent,
    Divider,
    Grid,
    Typography
} from '@mui/material';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import SunnySnowingIcon from '@mui/icons-material/SunnySnowing';
import Loading from '../common/Loading.tsx';
import { WindDirectionArrow, WindDirectionName } from '../common/WindDirection.tsx';
import { loadToday } from '../api';
import { dewPoint } from '../util';
import UvIndex from '../common/UvIndex.tsx';
import InlineIcon from '../common/InlineIcon.tsx';
import { Temporal } from 'temporal-polyfill';

const toTimeString = (value?: string): string => {
    if (!value) {
        return '--';
    }
    return Temporal.PlainDateTime.from(value).toPlainTime().toString({smallestUnit: 'minute'});
};

const NumberOrDefault: React.FC<{value?: number, defaultValue: string}> = ({value, defaultValue}) => {
    if (value === void(0) || value === null) {
        return (<span>{defaultValue}</span>);
    }
    return (<span>{value}</span>);
};

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
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Current Weather
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}
                        sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                        <Typography variant="body1">
                            <b><NumberOrDefault value={todayData.windspeedkph} defaultValue='--' /> kph <WindDirectionArrow direction={todayData.winddir} /><WindDirectionName direction={todayData.winddir} /></b>&nbsp;&nbsp;Wind
                        </Typography>
                        <Typography variant="body1">
                            <b><NumberOrDefault value={todayData.totalrainmm} defaultValue='--' /> mm</b>&nbsp;&nbsp;Rain since midnight
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}
                        sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography variant="body1">
                            <b><NumberOrDefault value={todayData.humidity} defaultValue='--' />%</b>&nbsp;&nbsp;Outdoor Humidity
                        </Typography>
                        <Typography variant="body1">
                            <b><NumberOrDefault value={todayData.humidityin} defaultValue='--' />%</b>&nbsp;&nbsp;Indoor Humidity
                        </Typography>
                        <Typography variant="body1">
                            <b>{dewPoint(todayData.tempc, todayData.humidity)}°C</b>&nbsp;&nbsp;Dew Point
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Divider />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Sun & UV
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                        <Typography variant="body1">
                            <InlineIcon><WbTwilightIcon /></InlineIcon>&nbsp;
                            <b>{toTimeString(todayData.sunrise)}</b>&nbsp;&nbsp;Sunrise
                        </Typography>
                        <Typography variant="body1">
                            <InlineIcon><SunnySnowingIcon /></InlineIcon>&nbsp;
                            <b>{toTimeString(todayData.sunset)}</b>&nbsp;&nbsp;Sunset
                        </Typography>
                        <Typography variant="body1">
                            <b><UvIndex uv={todayData.maxuv} describe /></b>&nbsp;&nbsp;Max UV Index
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default TodayCard;

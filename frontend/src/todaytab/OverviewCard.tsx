import React, { type CSSProperties } from 'react';
import {
    Grid,
    Typography,
} from '@mui/material';
import SunnyIcon from '@mui/icons-material/Sunny';
import CloudIcon from '@mui/icons-material/Cloud';
import CloudySnowingIcon from '@mui/icons-material/CloudySnowing';
import NightlightIcon from '@mui/icons-material/Nightlight';

export type WeatherType = 'Clear' | 'Mostly Clear' | 'Overcast' | 'Rain';

const WeatherIcon: React.FC<{ type: WeatherType }> = ({ type }) => {
    switch (type) {
        case 'Clear':
            return <NightlightIcon fontSize='large' />;
        case 'Mostly Clear':
            return <SunnyIcon fontSize='large' />;
        case 'Overcast':
            return <CloudIcon fontSize='large' />;
        case 'Rain':
            return <CloudySnowingIcon fontSize='large' />;
        default:
            return null;
    }
}

const TemperatureCard: React.FC<{ weatherType: WeatherType; rain?: number; style?: CSSProperties }> = ({
    weatherType, rain, style,
}) => (
    <Grid size={{ xs: 12, md: 4 }} fontStyle={{textAlign: 'center'}} style={style}>
        <WeatherIcon type={weatherType} />
        <Typography variant="h4" gutterBottom>
            {weatherType}
        </Typography>
        <Typography variant="h5" gutterBottom>
            {rain != null && rain > 0 ? `${rain.toFixed(2)}mm rain` : 'No rain'}
        </Typography>
    </Grid>
);

export default TemperatureCard;
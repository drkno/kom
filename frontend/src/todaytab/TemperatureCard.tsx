import React, { type CSSProperties } from 'react';
import {
    Grid,
    Typography,
} from '@mui/material';

const TemperatureCard: React.FC<{ title: string; temp?: number; feels?: string; min?: number; max?: number, style?: CSSProperties }> = ({
    title,
    temp,
    feels,
    min,
    max,
    style,
}) => (
    <Grid size={{ xs: 12, md: 6 }} style={style}>
        <Typography variant="subtitle2" gutterBottom>
            {title}
        </Typography>
        <Typography variant="h3" component="div">
            {temp != null ? `${temp.toFixed(1)}°C` : '--'}
        </Typography>
        <Typography color="text.secondary" variant="body2">
            Feels like {feels}°C
        </Typography>
        <Typography color="text.secondary" variant="caption">
            Min {min ?? '--'}° | Max {max ?? '--'}°
        </Typography>
    </Grid>
);

export default TemperatureCard;
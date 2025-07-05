import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { Temporal } from 'temporal-polyfill'

import CurrentCard from './CurrentCard.tsx';
import TodayCard from './TodayCard.tsx';
import HourlyTable from '../common/HourlyTable.tsx';

const TodayTab: React.FC = () => {
    const endTime = Temporal.Now.instant();
    const startTime = endTime.subtract({ hours: 12 });
    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <CurrentCard />
            <TodayCard />
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Last 12 Hours
                    </Typography>
                    <HourlyTable start={startTime} end={endTime} />
                </CardContent>
            </Card>
        </Box>
    );
};

export default TodayTab;

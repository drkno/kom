import React, { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    TextField,
} from '@mui/material';
import { Temporal } from 'temporal-polyfill'
import HourlyTable from '../common/HourlyTable.tsx';

const toInstant = (oldValue: Temporal.Instant, value: string): Temporal.Instant => {
    try {
        return Temporal.PlainDateTime.from(value).toZonedDateTime(Temporal.Now.timeZoneId()).toInstant();
    } catch(e) {
        return oldValue;
    }
};

const toFormatString = (instant: Temporal.Instant): string => {
    const {
        year, month, day, hour, minute, second
    } = instant.toZonedDateTimeISO(Temporal.Now.timeZoneId());
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
};

const PastTab: React.FC = () => {
    const [range, setRange] = useState({
        start: Temporal.Now.instant().subtract({ hours: 24 }),
        end: Temporal.Now.instant(),
    });

    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <Card variant="outlined">
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                            <TextField
                                type="datetime-local"
                                label="Start"
                                size="small"
                                value={toFormatString(range.start)}
                                onChange={(e) => setRange((r) => ({ ...r, start: toInstant(r.start, e.target.value) }))}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                type="datetime-local"
                                label="End"
                                size="small"
                                value={toFormatString(range.end)}
                                onChange={(e) => setRange((r) => ({ ...r, end: toInstant(r.end, e.target.value) }))}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Selected Period (1h buckets)
                    </Typography>
                    <HourlyTable start={range.start} end={range.end} />
                </CardContent>
            </Card>
        </Box>
    );
};

export default PastTab;

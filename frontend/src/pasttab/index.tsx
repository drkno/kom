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
    } catch {
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
    // Committed range (drives the table)
    const [range, setRange] = useState({
        start: Temporal.Now.instant().subtract({ hours: 24 }),
        end: Temporal.Now.instant(),
    });

    // Local editing state
    const [editRange, setEditRange] = useState(range);

    const isValid = Temporal.Instant.compare(editRange.start, editRange.end) <= 0;

    const handleApply = () => {
        if (isValid) {
            setRange(editRange);
        }
    };

    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <Card variant="outlined">
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField
                                type="datetime-local"
                                label="Start"
                                size="small"
                                fullWidth
                                error={!isValid}
                                InputLabelProps={{ shrink: true }}
                                value={toFormatString(editRange.start)}
                                onChange={(e) => setEditRange((r) => ({ ...r, start: toInstant(r.start, e.target.value) }))}
                                onClick={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    if (target.showPicker) target.showPicker();
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField
                                type="datetime-local"
                                label="End"
                                size="small"
                                fullWidth
                                error={!isValid}
                                InputLabelProps={{ shrink: true }}
                                value={toFormatString(editRange.end)}
                                onChange={(e) => setEditRange((r) => ({ ...r, end: toInstant(r.end, e.target.value) }))}
                                onClick={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    if (target.showPicker) target.showPicker();
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }} display="flex" justifyContent="flex-end">
                            <Box sx={{ width: '100%' }}>
                                <button
                                    onClick={handleApply}
                                    disabled={!isValid}
                                    style={{
                                        width: '100%',
                                        padding: '8px 16px',
                                        backgroundColor: isValid ? '#1976d2' : '#e0e0e0',
                                        color: isValid ? 'white' : '#9e9e9e',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isValid ? 'pointer' : 'not-allowed',
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        fontWeight: 500,
                                        boxShadow: isValid ? '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)' : 'none'
                                    }}
                                >
                                    {isValid ? 'Apply' : 'Invalid'}
                                </button>
                            </Box>
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

import React, { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    TextField,
    Table,
    TableHead,
    TableRow,
    TableBody,
    TableContainer,
    TableCell
} from '@mui/material';
import { Temporal } from 'temporal-polyfill';
import { loadMonthlyDataForRange } from '../api';
import Loading from '../common/Loading';
import type { MonthRecord } from '../api/types';
import ColourTableCell from './ColourTableCell';

interface YearRange {
    start: number;
    end: number;
}

const toDate = (date: string) => Temporal.PlainDateTime.from(date).toZonedDateTime(Temporal.Now.timeZoneId());

const StatsTab: React.FC = () => {
    const currentYear = Temporal.Now.instant().toZonedDateTimeISO(Temporal.Now.timeZoneId()).toPlainDate().year;

    // Committed state (drives data)
    const [yearRange, setYearRange] = useState<YearRange>({
        start: currentYear,
        end: currentYear,
    });

    // Local editing state
    const [editYearRange, setEditYearRange] = useState<YearRange>(yearRange);

    const isValid = editYearRange.start <= editYearRange.end;

    const handleApply = () => {
        if (isValid) {
            setYearRange(editYearRange);
        }
    };

    const monthlyDataResult = loadMonthlyDataForRange(toDate(yearRange.start + '-01-01T00:00:00'), toDate(yearRange.end + '-12-31T23:59:59'));
    if (monthlyDataResult.loading) {
        return <Loading />;
    }
    const months = monthlyDataResult.value;

    const monthsByYear: Record<number, MonthRecord[]> = {};
    if (months && months.length > 0) {
        for (const month of months) {
            const year = Temporal.PlainDateTime.from(month.time.substr(0, month.time.length - 1)).year;
            if (!monthsByYear[year]) {
                monthsByYear[year] = [];
            }
            monthsByYear[year].push(month);
        }
    }

    const rangeStart = Math.max(yearRange.start, 2024);
    const rangeEnd = Math.min(yearRange.end, currentYear);

    // Filter year list to only those in the range (visuals)
    const yearsDisplay = Array.from({ length: (rangeEnd - rangeStart + 1) }, (_, index) => rangeStart + index);

    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <Card variant="outlined">
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField
                                type="number"
                                label="Start Year"
                                size="small"
                                fullWidth
                                error={!isValid}
                                value={editYearRange.start}
                                onChange={(e) => setEditYearRange(r => ({ ...r, start: parseInt(e.target.value) || 0 }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField
                                type="number"
                                label="End Year"
                                size="small"
                                fullWidth
                                error={!isValid}
                                value={editYearRange.end}
                                onChange={(e) => setEditYearRange(r => ({ ...r, end: parseInt(e.target.value) || 0 }))}
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
            {
                (!months || months.length === 0)
                    ? <Typography>No data</Typography>
                    : yearsDisplay.map(year => (<YearlyStatsTable key={year} year={year} data={monthsByYear[year]} />))
            }
        </Box>
    );
};

const YearlyStatsTable: React.FC<{ year: number, data: MonthRecord[] }> = ({ year, data }) => {
    if (!data || data.length === 0) {
        return (
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {year}
                    </Typography>
                    <Typography gutterBottom>
                        No data is available for {year}.
                    </Typography>
                </CardContent>
            </Card>);
    }

    data.sort((a, b) => {

        const monthA = Temporal.PlainDateTime.from(a.time.substr(0, a.time.length - 1)).month;
        const monthB = Temporal.PlainDateTime.from(b.time.substr(0, b.time.length - 1)).month;
        return monthA - monthB;
    });
    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {year}
                </Typography>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Month</TableCell>
                                {
                                    data.map(month => (
                                        <TableCell key={month.time} style={{ textAlign: 'center' }}>
                                            <MonthName month={month.time} />
                                        </TableCell>
                                    ))
                                }
                                <TableCell>Whole Year</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>Record High</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='temp'>
                                            {month.tempc_absolute_max}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='temp'>
                                    {max(data.map(m => m.tempc_absolute_max))}
                                </ColourTableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Mean Maximum</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='temp'>
                                            {month.tempc_mean_max}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='temp'>
                                    {mean(data.map(m => m.tempc_mean_max))}
                                </ColourTableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Daily Mean</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='temp'>
                                            {month.tempc}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='temp'>
                                    {mean(data.map(m => m.tempc))}
                                </ColourTableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Mean Minimum</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='temp'>
                                            {month.tempc_mean_min}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='temp'>
                                    {mean(data.map(m => m.tempc_mean_min))}
                                </ColourTableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Record Low</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='temp'>
                                            {month.tempc_absolute_min}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='temp'>
                                    {min(data.map(m => m.tempc_absolute_min))}
                                </ColourTableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Total Rainfall</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='rain'>
                                            {month.totalrainmm}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='rain'>
                                    {sum(data.map(m => m.totalrainmm))}
                                </ColourTableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Rainy Days</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='days'>
                                            {month.raindayscount}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='days'>
                                    {sum(data.map(m => m.raindayscount))}
                                </ColourTableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Average Daily Max Humidity</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='humidity'>
                                            {month.humidity_mean_max}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='humidity'>
                                    {mean(data.map(m => m.humidity_mean_max))}
                                </ColourTableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Average Daily Min Humidity</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='humidity'>
                                            {month.humidity_absolute_min}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='humidity'>
                                    {mean(data.map(m => m.humidity_absolute_min))}
                                </ColourTableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Max UV Index</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='uv'>
                                            {month.uv_absolute}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='uv'>
                                    {max(data.map(m => m.uv_absolute))}
                                </ColourTableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Average Max UV Index</TableCell>
                                {
                                    data.map(month => (
                                        <ColourTableCell key={month.time} type='uv'>
                                            {month.uv_mean}
                                        </ColourTableCell>
                                    ))
                                }
                                <ColourTableCell type='uv'>
                                    {mean(data.map(m => m.uv_mean))}
                                </ColourTableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

const sum = (values: number[]) => {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((a, b) => a + b, 0);
};

const mean = (values: number[]) => {
    if (values.length === 0) {
        return 0;
    }
    return sum(values) / values.length;
};

const max = (values: number[]) => {
    if (values.length === 0) {
        return 0;
    }
    return Math.max(...values);
};

const min = (values: number[]) => {
    if (values.length === 0) {
        return 0;
    }
    return Math.min(...values);
};

const MonthName: React.FC<{ month: string }> = ({ month }) => {
    switch (Temporal.PlainDateTime.from(month.substr(0, month.length - 1)).month) {
        case 1: return <span>Jan</span>;
        case 2: return <span>Feb</span>;
        case 3: return <span>March</span>;
        case 4: return <span>April</span>;
        case 5: return <span>May</span>;
        case 6: return <span>June</span>;
        case 7: return <span>July</span>;
        case 8: return <span>Aug</span>;
        case 9: return <span>Sept</span>;
        case 10: return <span>Oct</span>;
        case 11: return <span>Nov</span>;
        case 12: return <span>Dec</span>;
        default: return <span>?</span>;
    };
};

export default StatsTab;

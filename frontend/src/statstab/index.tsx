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
    const [yearRange, setYearRange] = useState<YearRange>({
        start: currentYear,
        end: currentYear,
    });


    const monthlyDataResult = loadMonthlyDataForRange(toDate(yearRange.start + '-01-01T00:00:00'), toDate(yearRange.end + '-12-31T23:59:59'));
    if (monthlyDataResult.loading) {
        return <Loading />;
    }
    const months = monthlyDataResult.value;

    if (!months.length || months.length === 0) {
        return (<Typography>No data</Typography>);
    }

    const monthsByYear: Record<number, MonthRecord[]> = {};
    for (let month of months) {
        const year = Temporal.PlainDateTime.from(month.time.substr(0, month.time.length - 1)).year;
        if (!monthsByYear[year]) {
            monthsByYear[year] = [];
        }
        monthsByYear[year].push(month);
    }

    const getUpdatedRange = (oldRange: YearRange, newStart: number | string, newEnd: number | string) => {
        const newStartNum = typeof (newStart) === 'number' ? newStart : parseInt(newStart);
        const newEndNum = typeof (newEnd) === 'number' ? newEnd : parseInt(newEnd);
        if (isNaN(newStartNum) || isNaN(newEndNum) || newStartNum > newEndNum || newEndNum > currentYear) {
            return oldRange;
        }
        return Object.assign({}, oldRange, {
            start: newStartNum,
            end: newEndNum
        });
    };

    const rangeStart = Math.max(yearRange.start, 2024);
    const rangeEnd = Math.min(yearRange.end, currentYear);

    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <Card variant="outlined">
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                            <TextField
                                type="text"
                                label="Start Year"
                                size="small"
                                value={yearRange.start}
                                onChange={(e) => setYearRange(getUpdatedRange(yearRange, e.target.value, yearRange.end))}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                type="text"
                                label="End Year"
                                size="small"
                                value={yearRange.end}
                                onChange={(e) => setYearRange(getUpdatedRange(yearRange, yearRange.start, e.target.value))}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            {
                Array.from({ length: (rangeEnd - rangeStart + 1) }, (_, index) => rangeStart + index)
                    .map(year => (<YearlyStatsTable key={year} year={year} data={monthsByYear[year]} />))
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

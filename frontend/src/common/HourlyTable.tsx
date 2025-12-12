import React, { useState, type CSSProperties } from 'react';
import {
    Chip,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableBody,
    TableContainer,
    TableCell,
    Box,
    type TableCellProps
} from '@mui/material';
import { Temporal } from 'temporal-polyfill';

import { dewPoint, isNight } from '../util';
import type { HourRecord } from '../api';

import { loadPastDataForRange } from '../api';
import Loading from '../common/Loading';
import UvIndex from './UvIndex';
import { WindDirectionArrow, WindDirectionName } from './WindDirection';
import { WeatherIcon } from './WeatherType';
import { AreaPlot, ChartContainer, ChartsTooltip, LinePlot } from '@mui/x-charts';


interface DayHourBuckets {
    [day: string]: HourRecord[];
}

const toDate = (iso: string) => Temporal.Instant.from(iso).toZonedDateTimeISO(Temporal.Now.timeZoneId()).toPlainDateTime();
const toDay = (iso: string): string => toDate(iso).toPlainDate().toString();
const toHour = (iso: string): number => toDate(iso).hour;

const HourlyTable: React.FC<{ start: Temporal.Instant, end: Temporal.Instant, supportsNow?: boolean }> = ({ start, end, supportsNow = false }) => {
    const [filter, setFilter] = useState('all');
    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    const hourlyDataResult = loadPastDataForRange(start, end);

    const rows = React.useMemo(() => {
        if (hourlyDataResult.loading) return [];
        return hourlyDataResult.value;
    }, [hourlyDataResult]);

    const { dayBuckets, sortedDays } = React.useMemo(() => {
        if (!rows.length) return { dayBuckets: {}, sortedDays: [] };

        const buckets: DayHourBuckets = rows.reduce((acc: DayHourBuckets, row: HourRecord) => {
            const day = toDay(row.time);
            const dayData = acc[day] || [];
            dayData.push(row);
            // Optimization: Avoid sorting every push if possible, or sort once at end. 
            // Here we assume data might be out of order so we keep sorting.
            dayData.sort((a, b) => toHour(a.time) - toHour(b.time));
            acc[day] = dayData;
            return acc;
        }, {});

        const sorted = Object.keys(buckets).sort(Temporal.PlainDate.compare);
        return { dayBuckets: buckets, sortedDays: sorted };
    }, [rows]);

    const monthChunks = React.useMemo(() => {
        if (rows.length <= 500) {
            return [{ key: 'all', hours: rows, colSpan: rows.length }];
        }

        const groups: { [key: string]: string[] } = {};
        sortedDays.forEach(day => {
            // day is YYYY-MM-DD
            const month = day.substring(0, 7);
            if (!groups[month]) groups[month] = [];
            groups[month].push(day);
        });

        const chunks = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])).map(([key, days]) => {
            const chunkHours = days.flatMap(d => dayBuckets[d]);
            return { key, hours: chunkHours, colSpan: chunkHours.length };
        });

        // Add continuity: Append the first hour of the next chunk to the current chunk
        for (let i = 0; i < chunks.length - 1; i++) {
            const nextChunk = chunks[i + 1];
            if (nextChunk.hours.length > 0) {
                // We create a new array to avoid mutating the original grouped data if referenced elsewhere,
                // though strictly flatMap created new arrays above, so mutation is safe-ish, but let's be clean.
                chunks[i].hours = [...chunks[i].hours, nextChunk.hours[0]];
            }
        }

        return chunks;
    }, [sortedDays, dayBuckets, rows]);

    const renderGraphCells = (renderGraph: (hours: HourRecord[]) => React.ReactNode) => (
        monthChunks.map(chunk => (
            <TableCell key={chunk.key} colSpan={chunk.colSpan} style={{ padding: 0, borderBottom: 'none' }}>
                <LazyGraphWrapper>
                    {renderGraph(chunk.hours)}
                </LazyGraphWrapper>
            </TableCell>
        ))
    );

    // Scroll to "Now" on mount or when data loads
    React.useEffect(() => {
        if (!hourlyDataResult.loading && tableContainerRef.current) {
            const nowElement = document.getElementById('now-column');
            if (nowElement) {
                nowElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [hourlyDataResult.loading, sortedDays]);

    if (hourlyDataResult.loading) {
        return <Loading />;
    }

    if (!rows.length || rows.length === 0) {
        return (<Typography>No data</Typography>);
    }

    // Performance: Downsample data for charts if too many points.
    // We strictly want to avoid rendering 8000+ SVG nodes.
    // We don't hide the charts anymore, just reduce their resolution.

    const forEachDay = (callback: (hours: HourRecord[], day: string) => React.ReactNode): React.ReactNode[] =>
        sortedDays.flatMap((day) => callback(dayBuckets[day], day));

    const forEachHour = (callback: (hour: HourRecord, dayHour: number, day: string, isLast: boolean) => React.ReactNode): React.ReactNode[] =>
        sortedDays.flatMap((day, dayIndex) =>
            dayBuckets[day].map((hour, hourIndex) =>
                callback(
                    hour,
                    toHour(hour.time),
                    day,
                    dayIndex === sortedDays.length - 1 && hourIndex === dayBuckets[day].length - 1)));

    return (
        <>
            <Filter filter={filter} setFilter={setFilter} />
            <br />
            <br />
            <TableContainer ref={tableContainerRef}>
                <Table size="small"> {/* Use small size for better density */}
                    <TableHead>
                        <TableRow>
                            {
                                forEachDay((hours, day) => (
                                    <DayTableCell key={day} dayIndex={0} colSpan={hours.length} header>
                                        <Typography variant="subtitle1"><b>{day}</b></Typography>
                                    </DayTableCell>
                                ))
                            }
                        </TableRow>
                        <TableRow>
                            {
                                forEachHour((hour, dayIndex, _unusedDay, isLast) => {
                                    const isNow = isLast && supportsNow;
                                    return (
                                        <DayTableCell key={hour.time} dayIndex={dayIndex} id={isNow ? "now-column" : undefined}>
                                            <Typography variant="subtitle1"
                                                noWrap
                                                component="span"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    fontWeight: 900,
                                                    letterSpacing: '.1rem',
                                                }}>

                                                {isNow ? 'Now' : `${dayIndex}:00`}
                                            </Typography>
                                        </DayTableCell>
                                    )
                                })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <ApplyFilter expectedFilter='all' actualFilter={filter}>
                            <TableRow>
                                {
                                    forEachHour((hour, dayIndex) => (
                                        <DayTableCell key={hour.time} dayIndex={dayIndex} style={{ borderBottom: 'none' }}>
                                            <WeatherIcon record={hour} hour={dayIndex} size='medium' />
                                        </DayTableCell>
                                    ))
                                }
                            </TableRow>
                            <TableRow>
                                {
                                    renderGraphCells(hours => <DayGraph hours={hours} />)
                                }
                            </TableRow>
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='outside' actualFilter={filter}>
                            <OutdoorTemperatureRows rows={rows} forEachDay={forEachDay} forEachHour={forEachHour} filter={filter} renderGraphCells={renderGraphCells} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='inside' actualFilter={filter}>
                            <IndoorTemperatureRows rows={rows} forEachDay={forEachDay} forEachHour={forEachHour} filter={filter} renderGraphCells={renderGraphCells} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='rain' actualFilter={filter}>
                            <RainRows rows={rows} forEachDay={forEachDay} forEachHour={forEachHour} filter={filter} renderGraphCells={renderGraphCells} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='wind' actualFilter={filter}>
                            <WindRows rows={rows} forEachDay={forEachDay} forEachHour={forEachHour} filter={filter} renderGraphCells={renderGraphCells} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='other' actualFilter={filter}>
                            <OtherRows rows={rows} forEachDay={forEachDay} forEachHour={forEachHour} filter={filter} renderGraphCells={renderGraphCells} />
                        </ApplyFilter>
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

interface DayTableCellProps extends TableCellProps {
    dayIndex: number;
    header?: boolean;
}

const DayTableCell: React.FC<DayTableCellProps> = ({ dayIndex, children, header = false, ...props }) => {
    const styles: CSSProperties = { ...(props.style || {}) };
    if (dayIndex === 0) {
        styles.borderLeft = '1px solid black';
    }

    if (isNight(dayIndex) && !props.colSpan) {
        styles.backgroundColor = '#a9a9a933';
    }

    if (header) {
        styles.backgroundColor = '#1976d20f';
    }
    else {
        styles.textAlign = 'center';
        styles.justifyContent = 'center';
    }

    styles.margin = 'auto';
    styles.whiteSpace = 'nowrap';
    styles.minWidth = '35px'; // Reduced from 50px for density
    styles.padding = '4px';  // Reduced padding

    return (
        <TableCell align="center" style={styles} {...props}>
            {children}
        </TableCell>
    );
};

const Filter: React.FC<{ filter: string, setFilter: (value: string) => void }> = ({ filter, setFilter }) => {
    const variant = (expectedValue: string) => filter === expectedValue ? 'filled' : 'outlined';
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label='Show All' color='primary' variant={variant('all')} onClick={() => setFilter('all')} />
            <Chip label='Outdoor temperature' color='primary' variant={variant('outside')} onClick={() => setFilter('outside')} />
            <Chip label='Indoor temperature' color='primary' variant={variant('inside')} onClick={() => setFilter('inside')} />
            <Chip label='Rain' color='primary' variant={variant('rain')} onClick={() => setFilter('rain')} />
            <Chip label='Wind' color='primary' variant={variant('wind')} onClick={() => setFilter('wind')} />
            <Chip label='Humidity and UV' color='primary' variant={variant('other')} onClick={() => setFilter('other')} />
        </Box>
    );
};

const ApplyFilter: React.FC<{ expectedFilter: string, actualFilter: string, children: React.ReactNode, skipAll?: boolean }> = ({ expectedFilter, actualFilter, children, skipAll }) => {
    if (expectedFilter !== actualFilter && (skipAll || actualFilter !== 'all')) {
        return;
    }
    return children;
}

interface TableFragment {
    rows: HourRecord[];
    forEachHour: (callback: (hour: HourRecord, dayIndex: number, day: string, isLast: boolean) => React.ReactNode) => React.ReactNode[];
    forEachDay: (callback: (hours: HourRecord[], day: string) => React.ReactNode) => React.ReactNode[];
    renderGraphCells: (renderGraph: (hours: HourRecord[]) => React.ReactNode) => React.ReactNode[];
    filter: string;
};

const LazyGraphWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    React.useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 10);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) {
        return <div style={{ width: '100%', height: 100 }} />;
    }
    return <>{children}</>;
};

const useDownsampledData = (hours: HourRecord[], maxPoints = 500) => {
    return React.useMemo(() => {
        if (hours.length <= maxPoints) return hours;
        const step = Math.ceil(hours.length / maxPoints);
        const filtered = hours.filter((_, i) => i % step === 0);

        // Ensure the very last point is always included to maintain continuity with the next graph
        const last = hours[hours.length - 1];
        if (filtered.length > 0 && filtered[filtered.length - 1] !== last) {
            filtered.push(last);
        }
        return filtered;
    }, [hours, maxPoints]);
};

const OutdoorTemperatureRows: React.FC<TableFragment> = ({ forEachDay, forEachHour, filter, renderGraphCells }) => (
    <>
        <ApplyFilter expectedFilter='outside' actualFilter={filter} skipAll>
            <TableRow>
                {
                    forEachHour((hour, dayIndex) => (
                        <DayTableCell key={hour.time} dayIndex={dayIndex} style={{ borderBottom: 'none' }}>
                            <WeatherIcon record={hour} hour={dayIndex} size='medium' />
                        </DayTableCell>
                    ))
                }
            </TableRow>
            <TableRow>
                {
                    renderGraphCells(hours => <OutsideGraph hours={hours} />)
                }
            </TableRow>
        </ApplyFilter>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        <Typography variant="body2">{hour.tempc} °C</Typography>
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachDay((hours, day) => (
                    <DayTableCell key={day} dayIndex={0} colSpan={hours.length} style={{ padding: 0 }} header>
                        <Typography variant="subtitle2"
                            noWrap
                            component="span"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 300,
                                letterSpacing: '.1rem',
                            }}>
                            Feels like
                        </Typography>
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        <Typography variant="body2">{hour.feelslike} °C</Typography>
                    </DayTableCell>
                ))
            }
        </TableRow>
    </>
);

const IndoorTemperatureRows: React.FC<TableFragment> = ({ forEachDay, forEachHour, filter, renderGraphCells }) => (
    <>
        <ApplyFilter expectedFilter='all' actualFilter={filter}>
            <TableRow>
                {
                    forEachDay((hours, day) => (
                        <DayTableCell key={day} dayIndex={0} colSpan={hours.length} header>
                            <Typography variant="subtitle2"
                                noWrap
                                component="span"
                                sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 900,
                                    letterSpacing: '.1rem',
                                }}>
                                — INSIDE —
                            </Typography>
                        </DayTableCell>
                    ))
                }
            </TableRow>
        </ApplyFilter>
        <ApplyFilter expectedFilter='inside' actualFilter={filter} skipAll>
            <TableRow>
                {
                    renderGraphCells(hours => <InsideGraph hours={hours} />)
                }
            </TableRow>
        </ApplyFilter>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        {hour.tempinc} °C
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachDay((hours, day) => (
                    <DayTableCell key={day} dayIndex={0} colSpan={hours.length} style={{ padding: 0 }} header>
                        <Typography variant="subtitle2"
                            noWrap
                            component="span"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 300,
                                letterSpacing: '.1rem',
                            }}>
                            Feels like
                        </Typography>
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        {hour.feelslikein} °C
                    </DayTableCell>
                ))
            }
        </TableRow>
    </>
);

const RainRows: React.FC<TableFragment> = ({ forEachDay, forEachHour, filter, renderGraphCells }) => (
    <>
        <ApplyFilter expectedFilter='all' actualFilter={filter}>
            <TableRow>
                {
                    forEachDay((hours, day) => (
                        <DayTableCell key={day} dayIndex={0} colSpan={hours.length} header>
                            <Typography variant="subtitle2"
                                noWrap
                                component="span"
                                sx={{
                                    fontFamily: 'monospace',
                                    fontWeight: 900,
                                    letterSpacing: '.1rem',
                                }}>
                                — RAIN —
                            </Typography>
                        </DayTableCell>
                    ))
                }
            </TableRow>
        </ApplyFilter>
        <ApplyFilter expectedFilter='rain' actualFilter={filter} skipAll>
            <TableRow>
                {
                    renderGraphCells(hours => <RainGraph hours={hours} />)
                }
            </TableRow>
        </ApplyFilter>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        {hour.totalrainmm} mm
                    </DayTableCell>
                ))
            }
        </TableRow>
    </>
);

const WindRows: React.FC<TableFragment> = ({ forEachDay, forEachHour }) => (
    <>
        <TableRow>
            {
                forEachDay((hours, day) => (
                    <DayTableCell key={day} dayIndex={0} colSpan={hours.length} header>
                        <Typography variant="subtitle2"
                            noWrap
                            component="span"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 900,
                                letterSpacing: '.1rem',
                            }}>
                            — WIND —
                        </Typography>
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        <WindDirectionArrow direction={hour.winddir} />&nbsp;<WindDirectionName direction={hour.winddir} />
                        <br />
                        {hour.windspeedkph} kph
                        <br />
                        {hour.windgustkph} kph Gusts
                    </DayTableCell>
                ))
            }
        </TableRow>
    </>
);

const OtherRows: React.FC<TableFragment> = ({ forEachDay, forEachHour }) => (
    <>
        <TableRow>
            {
                forEachDay((hours, day) => (
                    <DayTableCell key={day} dayIndex={0} colSpan={hours.length} header>
                        <Typography variant="subtitle2"
                            noWrap
                            component="span"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 900,
                                letterSpacing: '.1rem',
                            }}>
                            — HUMIDITY OUTSIDE —
                        </Typography>
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        {hour.humidity} %
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachDay((hours, day) => (
                    <DayTableCell key={day} dayIndex={0} colSpan={hours.length} header>
                        <Typography variant="subtitle2"
                            noWrap
                            component="span"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 900,
                                letterSpacing: '.1rem',
                            }}>
                            — HUMIDITY INSIDE —
                        </Typography>
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        {hour.humidityin} %
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachDay((hours, day) => (
                    <DayTableCell key={day} dayIndex={0} colSpan={hours.length} header>
                        <Typography variant="subtitle2"
                            noWrap
                            component="span"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 900,
                                letterSpacing: '.1rem',
                            }}>
                            — DEW POINT —
                        </Typography>
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        {dewPoint(hour.tempc, hour.humidity)} °C
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachDay((hours, day) => (
                    <DayTableCell key={day} dayIndex={0} colSpan={hours.length} header>
                        <Typography variant="subtitle2"
                            noWrap
                            component="span"
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 900,
                                letterSpacing: '.1rem',
                            }}>
                            — UV INDEX —
                        </Typography>
                    </DayTableCell>
                ))
            }
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        <UvIndex uv={hour.uv} />
                    </DayTableCell>
                ))
            }
        </TableRow>
    </>
);

const DayGraph: React.FC<{ hours: HourRecord[] }> = ({ hours }) => {
    const data = useDownsampledData(hours);
    const rainData = data.map(hour => hour.totalrainmm || 0);
    const tempData = data.map(hour => hour.tempc || 0);
    const labels = data.map(hour => hour.time);
    return (
        <div style={{ width: '100%', height: 100, display: 'inline-block' }}>
            <ChartContainer
                margin={{
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                }}
                series={[
                    {
                        data: rainData,
                        type: 'line',
                        area: true,
                        stack: 'rain',
                        yAxisId: 'rain',
                        color: '#1976d2',
                        label: 'Rain (mm)',
                    },
                    {
                        data: tempData,
                        type: 'line',
                        area: false,
                        stack: 'temperature',
                        yAxisId: 'temp',
                        color: '#ed6c02',
                        label: 'Temperature (°C)',
                        showMark: true,
                        shape: 'triangle',
                    }
                ]}
                xAxis={[
                    {
                        scaleType: 'point',
                        data: labels,
                        position: 'none',
                    }
                ]}
                yAxis={[
                    {
                        id: 'rain',
                        position: 'none',
                        min: 0,
                        max: rainData.length === 0 ? 50 : Math.max(1, ...rainData),
                    },
                    {
                        id: 'temp',
                        position: 'none',
                        min: tempData.length === 0 ? 0 : Math.min(...tempData),
                        max: tempData.length === 0 ? 30 : Math.max(1, ...tempData),
                    },
                ]}>
                <AreaPlot />
                <LinePlot />
                <ChartsTooltip />
            </ChartContainer>
        </div>
    );
};

const OutsideGraph: React.FC<{ hours: HourRecord[] }> = ({ hours }) => {
    const data = useDownsampledData(hours);
    const tempData = data.map(hour => hour.tempc || 0);
    const tempFeelsLikeData = data.map(hour => hour.feelslike || 0);
    const labels = data.map(hour => hour.time);
    return (
        <div style={{ width: '100%', height: 100, display: 'inline-block' }}>
            <ChartContainer
                margin={{
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                }}
                series={[
                    {
                        data: tempData,
                        type: 'line',
                        area: false,
                        stack: 'temperature',
                        yAxisId: 'temp',
                        color: '#ed6c02',
                        label: 'Temperature (°C)',
                        showMark: true,
                        shape: 'triangle',
                    },
                    {
                        data: tempFeelsLikeData,
                        type: 'line',
                        area: false,
                        stack: 'feelslike',
                        yAxisId: 'temp',
                        color: '#ff0000',
                        label: 'Feels Like (°C)',
                        showMark: true,
                        shape: 'triangle',
                    }
                ]}
                xAxis={[
                    {
                        scaleType: 'point',
                        data: labels,
                        position: 'none',
                    }
                ]}
                yAxis={[
                    {
                        id: 'temp',
                        position: 'none',
                        min: tempData.length + tempFeelsLikeData.length === 0 ? 0 : Math.min(...tempData, ...tempFeelsLikeData),
                        max: tempData.length + tempFeelsLikeData.length === 0 ? 30 : Math.max(1, ...tempData, ...tempFeelsLikeData)
                    },
                ]}>
                <LinePlot />
                <LinePlot />
                <ChartsTooltip />
            </ChartContainer>
        </div>
    );
};

const InsideGraph: React.FC<{ hours: HourRecord[] }> = ({ hours }) => {
    const data = useDownsampledData(hours);
    const tempData = data.map(hour => hour.tempinc || 0);
    const tempFeelsLikeData = data.map(hour => hour.feelslikein || 0);
    const labels = data.map(hour => hour.time);
    return (
        <div style={{ width: '100%', height: 100, display: 'inline-block' }}>
            <ChartContainer
                margin={{
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                }}
                series={[
                    {
                        data: tempData,
                        type: 'line',
                        area: false,
                        stack: 'temperature',
                        yAxisId: 'temp',
                        color: '#ed6c02',
                        label: 'Temperature (°C)',
                        showMark: true,
                        shape: 'triangle',
                    },
                    {
                        data: tempFeelsLikeData,
                        type: 'line',
                        area: false,
                        stack: 'feelslike',
                        yAxisId: 'temp',
                        color: '#ff0000',
                        label: 'Feels Like (°C)',
                        showMark: true,
                        shape: 'triangle',
                    }
                ]}
                xAxis={[
                    {
                        scaleType: 'point',
                        data: labels,
                        position: 'none',
                    }
                ]}
                yAxis={[
                    {
                        id: 'temp',
                        position: 'none',
                        min: tempData.length + tempFeelsLikeData.length === 0 ? 0 : Math.min(...tempData, ...tempFeelsLikeData),
                        max: tempData.length + tempFeelsLikeData.length === 0 ? 0 : Math.max(1, ...tempData, ...tempFeelsLikeData),
                    },
                ]}>
                <LinePlot />
                <LinePlot />
                <ChartsTooltip />
            </ChartContainer>
        </div>
    );
};


const RainGraph: React.FC<{ hours: HourRecord[] }> = ({ hours }) => {
    const data = useDownsampledData(hours);
    const rainData = data.map(hour => hour.totalrainmm || 0);
    const rainRateData = data.map(hour => hour.rainratemm || 0);
    const labels = data.map(hour => hour.time);
    return (
        <div style={{ width: '100%', height: 100, display: 'inline-block' }}>
            <ChartContainer
                margin={{
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                }}
                series={[
                    {
                        data: rainData,
                        type: 'line',
                        area: true,
                        stack: 'raintotal',
                        yAxisId: 'raintotal',
                        color: '#1976d2',
                        label: 'Rain (mm)',
                    },
                    {
                        data: rainRateData,
                        type: 'line',
                        area: false,
                        stack: 'rainrate',
                        yAxisId: 'rainrate',
                        color: '#ed6c02',
                        label: 'Rain rate (mm/hr)',
                        showMark: true,
                        shape: 'triangle',
                    }
                ]}
                xAxis={[
                    {
                        scaleType: 'point',
                        data: labels,
                        position: 'none',
                    }
                ]}
                yAxis={[
                    {
                        id: 'raintotal',
                        position: 'none',
                        min: 0,
                        max: rainData.length === 0 ? 50 : Math.max(1, ...rainData)
                    },
                    {
                        id: 'rainrate',
                        position: 'none',
                        min: Math.min(...rainRateData),
                        max: rainRateData.length === 0 ? 50 : Math.max(1, ...rainRateData)
                    },
                ]}>
                <AreaPlot />
                <LinePlot />
                <ChartsTooltip />
            </ChartContainer>
        </div>
    );
};

export default HourlyTable;

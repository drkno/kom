import { useState, type CSSProperties } from 'react';
import {
    Chip,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableBody,
    TableContainer,
    TableCell,
    type TableCellProps} from '@mui/material';
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
    const hourlyDataResult = loadPastDataForRange(start, end);
    if (hourlyDataResult.loading) {
        return <Loading />;
    }
    const rows = hourlyDataResult.value;

    if (!rows.length || rows.length === 0) {
        return (<Typography>No data</Typography>);
    }

    const dayBuckets: DayHourBuckets = rows.reduce((acc: DayHourBuckets, row: HourRecord) => {
        const day = toDay(row.time);
        const dayData = acc[day] || [];
        dayData.push(row);
        dayData.sort((a, b) => toHour(a.time) - toHour(b.time));
        acc[day] = dayData;
        return acc;
    }, {});

    const sortedDays = Object.keys(dayBuckets)
        .sort(Temporal.PlainDate.compare);


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
            <TableContainer>
                <Table>
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
                                forEachHour((hour, dayIndex, _unusedDay, isLast) => (
                                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                                        <Typography variant="subtitle1"
                                            noWrap
                                            component="span"
                                            sx={{
                                                fontFamily: 'monospace',
                                                fontWeight: 900,
                                                letterSpacing: '.1rem',
                                            }}>

                                            {isLast && supportsNow ? 'Now' : `${dayIndex}:00`}
                                        </Typography>
                                    </DayTableCell>
                                ))}
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
                                <TableCell colSpan={rows.length} style={{ padding: 0, borderBottom: 'none' }}>
                                    <DayGraph hours={rows} />
                                </TableCell>
                            </TableRow>
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='outside' actualFilter={filter}>
                            <OutdoorTemperatureRows rows={rows} forEachDay={forEachDay} forEachHour={forEachHour} filter={filter} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='inside' actualFilter={filter}>
                            <IndoorTemperatureRows rows={rows} forEachDay={forEachDay} forEachHour={forEachHour} filter={filter} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='rain' actualFilter={filter}>
                            <RainRows rows={rows} forEachDay={forEachDay} forEachHour={forEachHour} filter={filter} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='wind' actualFilter={filter}>
                            <WindRows rows={rows} forEachDay={forEachDay} forEachHour={forEachHour} filter={filter} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='other' actualFilter={filter}>
                            <OtherRows rows={rows} forEachDay={forEachDay} forEachHour={forEachHour} filter={filter} />
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
    const styles: CSSProperties = props.style || {};
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
    styles.minWidth = '50px';

    return (
        <TableCell align="center" style={styles} {...props}>
            {children}
        </TableCell>
    );
};

const Filter: React.FC<{ filter: string, setFilter: (value: string) => void }> = ({ filter, setFilter }) => {
    const variant = (expectedValue: string) => filter === expectedValue ? 'filled' : 'outlined';
    return (
        <>
            <Chip label='Show All' color='primary' variant={variant('all')} onClick={() => setFilter('all')} />
            &nbsp;
            <Chip label='Outdoor temperature' color='primary' variant={variant('outside')} onClick={() => setFilter('outside')} />
            &nbsp;
            <Chip label='Indoor temperature' color='primary' variant={variant('inside')} onClick={() => setFilter('inside')} />
            &nbsp;
            <Chip label='Rain' color='primary' variant={variant('rain')} onClick={() => setFilter('rain')} />
            &nbsp;
            <Chip label='Wind' color='primary' variant={variant('wind')} onClick={() => setFilter('wind')} />
            &nbsp;
            <Chip label='Humidity and UV' color='primary' variant={variant('other')} onClick={() => setFilter('other')} />
        </>
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
    filter: string;
};

const OutdoorTemperatureRows: React.FC<TableFragment> = ({ rows, forEachDay, forEachHour, filter }) => (
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
                <TableCell colSpan={rows.length} style={{ padding: 0, borderBottom: 'none' }}>
                    <OutsideGraph hours={rows} />
                </TableCell>
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

const IndoorTemperatureRows: React.FC<TableFragment> = ({ rows, forEachDay, forEachHour, filter }) => (
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
                <TableCell colSpan={rows.length} style={{ padding: 0, borderBottom: 'none' }}>
                    <InsideGraph hours={rows} />
                </TableCell>
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

const RainRows: React.FC<TableFragment> = ({ rows, forEachDay, forEachHour, filter }) => (
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
                <TableCell colSpan={rows.length} style={{ padding: 0, borderBottom: 'none' }}>
                    <RainGraph hours={rows} />
                </TableCell>
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
    const rainData = hours.map(hour => hour.totalrainmm || 0);
    const tempData = hours.map(hour => hour.tempc || 0);
    const labels = hours.map(hour => hour.time);
    return (
        <div style={{ width: '100%', height: 100, display: 'inline-block', paddingLeft: 40, paddingRight: 50 }}>
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
                        max: Math.max(...rainData),
                    },
                    {
                        id: 'temp',
                        position: 'none',
                        min: Math.min(...tempData),
                        max: Math.max(...tempData),
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
    const tempData = hours.map(hour => hour.tempc || 0);
    const tempFeelsLikeData = hours.map(hour => hour.feelslike || 0);
    const labels = hours.map(hour => hour.time);
    return (
        <div style={{ width: '100%', height: 100, display: 'inline-block', paddingLeft: 40, paddingRight: 50 }}>
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
                        min: Math.min(...tempData, ...tempFeelsLikeData),
                        max: Math.max(...tempData, ...tempFeelsLikeData),
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
    const tempData = hours.map(hour => hour.tempinc || 0);
    const tempFeelsLikeData = hours.map(hour => hour.feelslikein || 0);
    const labels = hours.map(hour => hour.time);
    return (
        <div style={{ width: '100%', height: 100, display: 'inline-block', paddingLeft: 40, paddingRight: 50 }}>
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
                        min: Math.min(...tempData, ...tempFeelsLikeData),
                        max: Math.max(...tempData, ...tempFeelsLikeData),
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
    const rainData = hours.map(hour => hour.totalrainmm || 0);
    const rainRateData = hours.map(hour => hour.rainratemm || 0);
    const labels = hours.map(hour => hour.time);
    return (
        <div style={{ width: '100%', height: 100, display: 'inline-block', paddingLeft: 40, paddingRight: 50 }}>
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
                        max: Math.max(...rainData),
                    },
                    {
                        id: 'rainrate',
                        position: 'none',
                        min: Math.min(...rainRateData),
                        max: Math.max(...rainRateData),
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

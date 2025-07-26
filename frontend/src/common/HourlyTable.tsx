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
    type TableCellProps
} from '@mui/material';
import { Temporal } from 'temporal-polyfill';

import { feelsLike, dewPoint } from '../util';
import type { HourRecord } from '../api';

import { loadPastDataForRange } from '../api';
import Loading from '../common/Loading';
import UvIndex from './UvIndex';
import WindDirection from './WindDirection';

interface DayHourBuckets {
    [day: string]: HourRecord[];
}

const toDate = (iso: string) => Temporal.Instant.from(iso).toZonedDateTimeISO(Temporal.Now.timeZoneId()).toPlainDateTime();
const toDay = (iso: string): string => toDate(iso).toPlainDate().toString();
const toHour = (iso: string): number => toDate(iso).hour;

const HourlyTable: React.FC<{ start: Temporal.Instant, end: Temporal.Instant }> = ({ start, end }) => {
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


    const forEachHour = (callback: (hour: HourRecord, dayIndex: number, day: string) => React.ReactNode): React.ReactNode[] =>
        sortedDays.flatMap((day) =>
            dayBuckets[day].map((hour, dayIndex) => callback(hour, dayIndex, day)));

    return (
        <>
            <Filter filter={filter} setFilter={setFilter} />
            <br />
            <br />
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            {sortedDays.map((day) => (
                                <DayTableCell key={day} dayIndex={0} colSpan={dayBuckets[day].length}>
                                    <Typography variant="subtitle1"><b>{day}</b></Typography>
                                </DayTableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            {
                                forEachHour((hour, dayIndex) => (
                                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                                        <Typography variant="subtitle1">{toHour(hour.time)}:00</Typography>
                                    </DayTableCell>
                                ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <ApplyFilter expectedFilter='outside' actualFilter={filter}>
                            <OutdoorTemperatureRows rows={rows} forEachHour={forEachHour} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='inside' actualFilter={filter}>
                            <IndoorTemperatureRows rows={rows} forEachHour={forEachHour} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='rain' actualFilter={filter}>
                            <RainRows rows={rows} forEachHour={forEachHour} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='wind' actualFilter={filter}>
                            <WindRows rows={rows} forEachHour={forEachHour} />
                        </ApplyFilter>
                        <ApplyFilter expectedFilter='other' actualFilter={filter}>
                            <OtherRows rows={rows} forEachHour={forEachHour} />
                        </ApplyFilter>
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

interface DayTableCellProps extends TableCellProps {
    dayIndex: number;
}

const DayTableCell: React.FC<DayTableCellProps> = ({ dayIndex, children, ...props }) => {
    const styles: CSSProperties = {};
    if (dayIndex === 0) {
        styles.borderLeft = '1px solid black';
    }
    return (
        <TableCell style={styles} {...props}>
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

const ApplyFilter: React.FC<{ expectedFilter: string, actualFilter: string, children: React.ReactNode }> = ({ expectedFilter, actualFilter, children }) => {
    if (expectedFilter !== actualFilter && actualFilter !== 'all') {
        return;
    }
    return children;
}

interface TableFragment {
    rows: HourRecord[];
    forEachHour: (callback: (hour: HourRecord, dayIndex: number, day: string) => React.ReactNode) => React.ReactNode[];
};

const OutdoorTemperatureRows: React.FC<TableFragment> = ({ rows, forEachHour }) => (
    <>
        <TableRow>
            {/* Icon */}
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        <Typography variant="body2">{hour.tempc} °C</Typography>
                    </DayTableCell>
                ))
            }
            {/* Graph */}
        </TableRow>
        <TableRow>
            <DayTableCell dayIndex={0} colSpan={rows.length}>
                <Typography variant="subtitle2">Feels like</Typography>
            </DayTableCell>
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        <Typography variant="body2">{feelsLike(hour.tempc, hour.humidity)} °C</Typography>
                    </DayTableCell>
                ))
            }
        </TableRow>
    </>
);

const IndoorTemperatureRows: React.FC<TableFragment> = ({ rows, forEachHour }) => (
    <>
        <TableRow>
            <DayTableCell dayIndex={0} colSpan={rows.length}>
                <Typography variant="subtitle2">Inside</Typography>
            </DayTableCell>
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        {hour.tempinc} °C
                    </DayTableCell>
                ))
            }
            {/* Graph */}
        </TableRow>
        <TableRow>
            <DayTableCell dayIndex={0} colSpan={rows.length}>
                <Typography variant="subtitle2">Feels like</Typography>
            </DayTableCell>
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        {feelsLike(hour.tempinc, hour.humidityin)} °C
                    </DayTableCell>
                ))
            }
        </TableRow>
    </>
);

const RainRows: React.FC<TableFragment> = ({ rows, forEachHour }) => (
    <>
        <TableRow>
            <DayTableCell dayIndex={0} colSpan={rows.length}>
                <Typography variant="subtitle2">Rain</Typography>
            </DayTableCell>
        </TableRow>
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

const WindRows: React.FC<TableFragment> = ({ rows, forEachHour }) => (
    <>
        <TableRow>
            <DayTableCell dayIndex={0} colSpan={rows.length}>
                <Typography variant="subtitle2">Wind</Typography>
            </DayTableCell>
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        <WindDirection direction={hour.winddir || ''} />
                        {hour.winddir}
                        {hour.windspeedkph} kph
                        {hour.windgustkph} kph Gusts
                    </DayTableCell>
                ))
            }
        </TableRow>
    </>
);

const OtherRows: React.FC<TableFragment> = ({ rows, forEachHour }) => (
    <>
        <TableRow>
            <DayTableCell dayIndex={0} colSpan={rows.length}>
                <Typography variant="subtitle2">Humidity Outside</Typography>
            </DayTableCell>
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
            <DayTableCell dayIndex={0} colSpan={rows.length}>
                <Typography variant="subtitle2">Humidity Inside</Typography>
            </DayTableCell>
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
            <DayTableCell dayIndex={0} colSpan={rows.length}>
                <Typography variant="subtitle2">Dew point</Typography>
            </DayTableCell>
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
            <DayTableCell dayIndex={0} colSpan={rows.length}>
                <Typography variant="subtitle2">UV Index</Typography>
            </DayTableCell>
        </TableRow>
        <TableRow>
            {
                forEachHour((hour, dayIndex) => (
                    <DayTableCell key={hour.time} dayIndex={dayIndex}>
                        <UvIndex uv={hour.uv || -1} />
                    </DayTableCell>
                ))
            }
        </TableRow>
    </>
);

export default HourlyTable;

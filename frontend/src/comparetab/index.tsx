import React, { useMemo, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    Stack,
    Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import { LineChart, useXScale, useYScale, useDrawingArea } from '@mui/x-charts';
import { Temporal } from 'temporal-polyfill';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { loadPastDataForRange } from '../api';
import type { HourRecord } from '../api';
import Loading from '../common/Loading';

interface Metric {
    key: keyof HourRecord;
    label: string;
    unit: string;
    color: string;
    decimalPlaces: number;
}

// Inspired by https://interconnected.org/home/2026/08/26/yesterday:
// today is the solid line, the comparison day is dashed, and what
// actually matters is the gap between them "right now".
const METRICS: Metric[] = [
    { key: 'tempc', label: 'Outdoor Temp', unit: '°C', color: '#ed6c02', decimalPlaces: 1 },
    { key: 'feelslike', label: 'Feels Like', unit: '°C', color: '#d32f2f', decimalPlaces: 1 },
    { key: 'humidity', label: 'Humidity', unit: '%', color: '#1976d2', decimalPlaces: 0 },
    { key: 'windspeedkph', label: 'Wind Speed', unit: ' kph', color: '#2e7d32', decimalPlaces: 0 },
    { key: 'rainratemm', label: 'Rain Rate', unit: ' mm/h', color: '#0288d1', decimalPlaces: 1 },
    { key: 'uv', label: 'UV Index', unit: '', color: '#9c27b0', decimalPlaces: 0 },
    { key: 'solarradiation', label: 'Solar Radiation', unit: ' W/m²', color: '#f9a825', decimalPlaces: 0 },
];

const COMPARISON_LINE_COLOR = '#88929b';
const WARM_ARROW_COLOR = '#ef5350';
const COOL_ARROW_COLOR = '#42a5f5';

const zone = Temporal.Now.timeZoneId();

const toHourOfDay = (iso: string): number =>
    Temporal.Instant.from(iso).toZonedDateTimeISO(zone).hour;

// Bucket hourly records into a fixed 24-length array indexed by hour-of-day,
// so any day can be overlaid against any other day regardless of calendar date.
const toHourlyArray = (records: HourRecord[], key: keyof HourRecord): (number | null)[] => {
    const hours: (number | null)[] = new Array(24).fill(null);
    for (const record of records) {
        const value = record[key];
        if (typeof value === 'number') {
            hours[toHourOfDay(record.time)] = value;
        }
    }
    return hours;
};

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
});

const formatDayLabel = (date: Temporal.PlainDate): string => {
    const yesterday = Temporal.Now.plainDateISO().subtract({ days: 1 });
    if (date.equals(yesterday)) {
        return 'Yesterday';
    }
    if (date.equals(Temporal.Now.plainDateISO())) {
        return 'Today';
    }
    return dayjs(date.toString()).format('ddd D MMM');
};

const lastValueAndHour = (hours: (number | null)[]): { hour: number, value: number } | null => {
    for (let hour = hours.length - 1; hour >= 0; hour--) {
        if (hours[hour] !== null) {
            return { hour, value: hours[hour]! };
        }
    }
    return null;
};

interface DataSegment {
    startHour: number;
    values: number[];
}

const getContinuousSegments = (data: (number | null)[]): DataSegment[] => {
    const segments: DataSegment[] = [];
    let current: { startHour: number; values: number[] } | null = null;
    for (let h = 0; h < data.length; h++) {
        const v = data[h];
        if (v !== null && typeof v === 'number') {
            if (!current) {
                current = { startHour: h, values: [v] };
            } else {
                current.values.push(v);
            }
        } else if (current) {
            segments.push(current);
            current = null;
        }
    }
    if (current) {
        segments.push(current);
    }
    return segments;
};

const buildMonotoneSpline = (startHour: number, values: number[]) => {
    const n = values.length;
    if (n === 0) return () => null;
    if (n === 1) {
        return (h: number) => (Math.abs(h - startHour) < 1e-4 ? values[0] : null);
    }

    const secants: number[] = new Array(n - 1);
    for (let i = 0; i < n - 1; i++) {
        secants[i] = values[i + 1] - values[i];
    }

    const slopes: number[] = new Array(n).fill(0);
    for (let i = 1; i < n - 1; i++) {
        const s0 = secants[i - 1];
        const s1 = secants[i];
        if (s0 * s1 <= 0) {
            slopes[i] = 0;
        } else {
            const p = 0.5 * (s0 + s1);
            slopes[i] = (Math.sign(s0) + Math.sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p));
        }
    }

    slopes[0] = (3 * secants[0] - (n > 2 ? slopes[1] : secants[0])) / 2;
    if (secants[0] * slopes[0] <= 0) slopes[0] = 0;
    else if (Math.abs(slopes[0]) > 3 * Math.abs(secants[0])) slopes[0] = 3 * secants[0];

    slopes[n - 1] = (3 * secants[n - 2] - (n > 2 ? slopes[n - 2] : secants[n - 2])) / 2;
    if (secants[n - 2] * slopes[n - 1] <= 0) slopes[n - 1] = 0;
    else if (Math.abs(slopes[n - 1]) > 3 * Math.abs(secants[n - 2])) slopes[n - 1] = 3 * secants[n - 2];

    return (h: number): number | null => {
        if (h < startHour || h > startHour + n - 1) {
            return null;
        }
        if (h === startHour + n - 1) {
            return values[n - 1];
        }
        const i = Math.floor(h - startHour);
        if (i < 0 || i >= n - 1) return null;
        const t = (h - startHour) - i;
        const t2 = t * t;
        const t3 = t2 * t;

        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;

        return (
            h00 * values[i] +
            h10 * slopes[i] +
            h01 * values[i + 1] +
            h11 * slopes[i + 1]
        );
    };
};

const buildContinuousEvaluator = (data: (number | null)[]) => {
    const segments = getContinuousSegments(data);
    const interpolators = segments.map(seg => ({
        start: seg.startHour,
        end: seg.startHour + seg.values.length - 1,
        eval: buildMonotoneSpline(seg.startHour, seg.values),
    }));

    return (h: number): number | null => {
        for (const item of interpolators) {
            if (h >= item.start && h <= item.end) {
                return item.eval(h);
            }
        }
        return null;
    };
};

interface DifferenceArrowsProps {
    today: (number | null)[];
    comparison: (number | null)[];
}

const DifferenceArrows: React.FC<DifferenceArrowsProps> = ({ today, comparison }) => {
    const xScale = useXScale('hour') as ((val: string) => number | undefined) & { step?: () => number };
    const yScale = useYScale() as ((val: number) => number | undefined);
    const drawingArea = useDrawingArea();

    const evalToday = useMemo(() => buildContinuousEvaluator(today), [today]);
    const evalComp = useMemo(() => buildContinuousEvaluator(comparison), [comparison]);

    if (!xScale || !yScale || !drawingArea) {
        return null;
    }

    const stepPx = typeof xScale.step === 'function'
        ? xScale.step()
        : drawingArea.width / 23;

    // Subdivide each hour to achieve approximately 16-18px arrow spacing
    const subSteps = Math.max(1, Math.min(4, Math.round(stepPx / 16)));
    const dt = 1 / subSteps;

    const getX = (h: number): number => {
        const h0 = Math.floor(h);
        const frac = h - h0;
        if (h0 >= 23) {
            return xScale(HOUR_LABELS[23]) ?? (drawingArea.left + drawingArea.width);
        }
        const x0 = xScale(HOUR_LABELS[h0]) ?? (drawingArea.left + (h0 / 23) * drawingArea.width);
        const x1 = xScale(HOUR_LABELS[h0 + 1]) ?? (drawingArea.left + ((h0 + 1) / 23) * drawingArea.width);
        return x0 + frac * (x1 - x0);
    };

    const arrows: React.ReactNode[] = [];
    const totalSteps = 23 * subSteps;

    for (let step = 0; step <= totalSteps; step++) {
        const h = step * dt;
        const todayVal = evalToday(h);
        const compVal = evalComp(h);

        if (todayVal === null || compVal === null) {
            continue;
        }

        const yToday = yScale(todayVal);
        const yComp = yScale(compVal);

        if (yToday === undefined || yComp === undefined) {
            continue;
        }

        const diffPx = Math.abs(yToday - yComp);
        // Minimum pixel height threshold to render a clean arrow and avoid clutter at crossings
        if (diffPx < 7) {
            continue;
        }

        const x = getX(h);
        const isWarmer = todayVal > compVal;
        const color = isWarmer ? WARM_ARROW_COLOR : COOL_ARROW_COLOR;

        if (isWarmer) {
            // Today is higher (smaller Y in SVG coords). Arrow points UP from comparison to today.
            arrows.push(
                <g key={`arrow-${step}`}>
                    <line
                        x1={x}
                        y1={yComp}
                        x2={x}
                        y2={yToday + 1}
                        stroke={color}
                        strokeWidth={1.3}
                        opacity={0.85}
                    />
                    <path
                        d={`M ${x - 3} ${yToday + 4.5} L ${x} ${yToday} L ${x + 3} ${yToday + 4.5}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.9}
                    />
                </g>
            );
        } else {
            // Today is lower (larger Y in SVG coords). Arrow points DOWN from comparison to today.
            arrows.push(
                <g key={`arrow-${step}`}>
                    <line
                        x1={x}
                        y1={yComp}
                        x2={x}
                        y2={yToday - 1}
                        stroke={color}
                        strokeWidth={1.3}
                        opacity={0.85}
                    />
                    <path
                        d={`M ${x - 3} ${yToday - 4.5} L ${x} ${yToday} L ${x + 3} ${yToday - 4.5}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.9}
                    />
                </g>
            );
        }
    }

    return (
        <g className="difference-arrows" style={{ pointerEvents: 'none' }}>
            {arrows}
        </g>
    );
};

const MetricToggle: React.FC<{ metric: Metric, selected: boolean, onToggle: () => void }> = ({ metric, selected, onToggle }) => (
    <Chip
        label={metric.label}
        color="primary"
        variant={selected ? 'filled' : 'outlined'}
        onClick={onToggle}
    />
);

const DeltaSummary: React.FC<{ metric: Metric, today: (number | null)[], comparison: (number | null)[], comparisonLabel: string }> = ({ metric, today, comparison, comparisonLabel }) => {
    const current = lastValueAndHour(today);
    if (!current) {
        return null;
    }
    const comparisonValue = comparison[current.hour];
    if (comparisonValue === null) {
        return (
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Now: {current.value.toFixed(metric.decimalPlaces)}{metric.unit}
            </Typography>
        );
    }

    const delta = current.value - comparisonValue;
    const rounded = Math.abs(delta).toFixed(metric.decimalPlaces);
    let icon = <RemoveIcon fontSize="small" color="disabled" />;
    if (delta > 0) icon = <ArrowUpwardIcon fontSize="small" sx={{ color: WARM_ARROW_COLOR }} />;
    if (delta < 0) icon = <ArrowDownwardIcon fontSize="small" sx={{ color: COOL_ARROW_COLOR }} />;

    return (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
                Now: {current.value.toFixed(metric.decimalPlaces)}{metric.unit} · {comparisonLabel} at this time: {comparisonValue.toFixed(metric.decimalPlaces)}{metric.unit}
            </Typography>
            {icon}
            <Typography variant="body2">
                {rounded}{metric.unit}
            </Typography>
        </Stack>
    );
};

const MetricChart: React.FC<{ metric: Metric, today: (number | null)[], comparison: (number | null)[], comparisonLabel: string }> = ({ metric, today, comparison, comparisonLabel }) => {
    const valueFormatter = (value: number | null) =>
        value !== null ? `${value.toFixed(metric.decimalPlaces)}${metric.unit}` : '';

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {metric.label}
                </Typography>
                <DeltaSummary metric={metric} today={today} comparison={comparison} comparisonLabel={comparisonLabel} />
                <LineChart
                    height={260}
                    xAxis={[{
                        id: 'hour',
                        data: HOUR_LABELS,
                        scaleType: 'point',
                        label: 'Hour of day',
                    }]}
                    series={[
                        {
                            id: 'today',
                            data: today,
                            label: 'Today',
                            color: metric.color,
                            showMark: false,
                            connectNulls: false,
                            valueFormatter,
                        },
                        {
                            id: 'comparison',
                            data: comparison,
                            label: comparisonLabel,
                            color: COMPARISON_LINE_COLOR,
                            showMark: false,
                            connectNulls: false,
                            valueFormatter,
                        },
                    ]}
                    sx={{
                        '& .MuiLineElement-series-today': {
                            strokeWidth: 2.5,
                        },
                        '& .MuiLineElement-series-comparison': {
                            strokeDasharray: '6 4',
                            strokeWidth: 2,
                            opacity: 0.85,
                        },
                    }}
                >
                    <DifferenceArrows today={today} comparison={comparison} />
                </LineChart>
            </CardContent>
        </Card>
    );
};

const CompareTab: React.FC = () => {
    const [comparisonDate, setComparisonDate] = useState(() => Temporal.Now.plainDateISO().subtract({ days: 1 }));
    const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(() => new Set(['tempc', 'feelslike']));

    const toggleMetric = (key: string) => {
        setSelectedMetrics(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    // Snapshot "now" once per mount rather than recomputing it every render -
    // a fresh Temporal.Instant() every render never value-equals the last one
    // useApi fetched for, which would otherwise leave it stuck loading forever.
    const { todayStart, now } = useMemo(() => {
        const instant = Temporal.Now.instant();
        const start = instant.toZonedDateTimeISO(zone)
            .with({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .toInstant();
        return { todayStart: start, now: instant };
    }, []);

    const { comparisonStart, comparisonEnd } = useMemo(() => {
        const start = comparisonDate.toZonedDateTime({ timeZone: zone, plainTime: '00:00' }).toInstant();
        return { comparisonStart: start, comparisonEnd: start.add({ hours: 24 }) };
    }, [comparisonDate]);

    const todayResult = loadPastDataForRange(todayStart, now);
    const comparisonResult = loadPastDataForRange(comparisonStart, comparisonEnd);

    const comparisonLabel = useMemo(() => formatDayLabel(comparisonDate), [comparisonDate]);

    if (todayResult.loading || comparisonResult.loading) {
        return <Loading />;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card variant="outlined">
                <CardContent>
                    <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                                <DatePicker
                                    label="Compare today to"
                                    value={dayjs(comparisonDate.toString())}
                                    format="DD/MM/YYYY"
                                    maxDate={dayjs()}
                                    onChange={(newValue) => {
                                        if (newValue) {
                                            setComparisonDate(Temporal.PlainDate.from(newValue.format('YYYY-MM-DD')));
                                        }
                                    }}
                                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {METRICS.map(metric => (
                                    <MetricToggle
                                        key={metric.key}
                                        metric={metric}
                                        selected={selectedMetrics.has(metric.key)}
                                        onToggle={() => toggleMetric(metric.key)}
                                    />
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {
                selectedMetrics.size === 0
                    ? <Typography>Select at least one value to compare.</Typography>
                    : METRICS.filter(metric => selectedMetrics.has(metric.key)).map(metric => (
                        <MetricChart
                            key={metric.key}
                            metric={metric}
                            today={toHourlyArray(todayResult.value, metric.key)}
                            comparison={toHourlyArray(comparisonResult.value, metric.key)}
                            comparisonLabel={comparisonLabel}
                        />
                    ))
            }
        </Box>
    );
};

export default CompareTab;

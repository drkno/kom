import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@mui/material';
import { Temporal } from 'temporal-polyfill';

import { feelsLike, dewPoint } from '../util';
import type { HourRecord } from '../api';

import { loadPastDataForRange } from '../api';
import Loading from '../common/Loading';

const hourLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour12: false, hour: 'numeric' });

const HourlyTable: React.FC<{ start: Temporal.Instant, end: Temporal.Instant }> = ({ start, end }) => {
    const hourlyDataResult = loadPastDataForRange(start, end);
    if (hourlyDataResult.loading) {
        return <Loading />;
    }
    const rows = hourlyDataResult.value;

    if (!rows.length) return <Typography>No data</Typography>;
    const cols = rows.slice(-12); // last 12 hrs
    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            {cols.map((c) => (
              <TableCell align="center" key={`h-${c._time}`}>{hourLabel(c._time)}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { label: 'Temp (°C)', get: (r: HourRecord) => r.tempc?.toFixed(0) ?? '-' },
            { label: 'Feels (°C)', get: (r: HourRecord) => feelsLike(r.tempc, r.humidity) },
            { label: 'Rain (mm)', get: (r: HourRecord) => r.rainratemm?.toFixed(1) ?? '-' },
            {
              label: 'Wind (kph)',
              get: (r: HourRecord) => `${r.winddir ?? ''} ${r.windspeedkph?.toFixed(0) ?? '-'}`,
            },
            { label: 'Gust (kph)', get: (r: HourRecord) => r.windgustkph?.toFixed(0) ?? '-' },
            { label: 'Humidity (%)', get: (r: HourRecord) => r.humidity?.toFixed(0) ?? '-' },
            { label: 'Dew (°C)', get: (r: HourRecord) => dewPoint(r.tempc, r.humidity) },
            { label: 'UV', get: (r: HourRecord) => r.uv?.toFixed(0) ?? '-' },
          ].map((row) => (
            <TableRow key={row.label}>
              <TableCell>{row.label}</TableCell>
              {cols.map((c) => (
                <TableCell align="center" key={row.label + c._time}>
                  {row.get(c)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

export default HourlyTable;

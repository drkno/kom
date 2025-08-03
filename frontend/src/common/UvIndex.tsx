import React from 'react';
import CircleIcon from '@mui/icons-material/Circle';
import InlineIcon from './InlineIcon';

const UvIndex: React.FC<{ uv?: number, describe?: boolean }> = ({ uv, describe }) => {
    if (uv === void(0) || uv === null || isNaN(uv)) {
        uv = 0;
    }
    let colour: 'inherit' | 'action' | 'disabled' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'disabled';
    let description = '--';

    if (uv === void(0) || uv === null || uv < 0 || isNaN(uv)) {
        colour = 'disabled';
        description = '--';
    } else if (uv < 3) {
        colour = 'success';
        description = 'Low';
    } else if (uv < 6) {
        colour = 'warning';
        description = 'Moderate';
    } else if (uv < 8) {
        colour = 'error';
        description = 'High';
    } else if (uv < 11) {
        colour = 'error';
        description = 'Very High';
    } else {
        colour = 'error';
        description = 'Extreme';
    }

    return (
        <>
            <InlineIcon><CircleIcon color={colour} /></InlineIcon> {describe ? `${uv} (${description})` : uv}
        </>
    );
};

export default UvIndex;

import React, { type CSSProperties } from 'react';
import NavigationIcon from '@mui/icons-material/Navigation';
import InlineIcon from './InlineIcon';

export const WindDirectionArrow: React.FC<{ direction?: number }> = ({ direction }) => {
    // The Navigation icon points "up" by default, which we treat as the
    // direction wind is blowing FROM (meteorological convention, matches
    // WindDirectionName below). Add 180deg so the arrow instead points
    // in the direction the wind is flowing TO.
    const directionStyle: CSSProperties = {
        transform: `rotate(${((direction || 0) + 180) % 360}deg)`
    };

    return (
        <InlineIcon>
            <NavigationIcon style={directionStyle} />
        </InlineIcon>
    );
};

export const WindDirectionName: React.FC<{ direction?: number }> = ({ direction }) => {
    if (direction === void(0) || direction === null) {
        direction = 0;
    }
    direction = direction % 360;
    let directionName: string;
    if (direction >= 337.5 || direction < 22.5) directionName = 'N';
    else if (direction >= 22.5 && direction < 67.5) directionName = 'NE';
    else if (direction >= 67.5 && direction < 112.5) directionName = 'E';
    else if (direction >= 112.5 && direction < 157.5) directionName = 'SE';
    else if (direction >= 157.5 && direction < 202.5) directionName = 'S';
    else if (direction >= 202.5 && direction < 247.5) directionName = 'SW';
    else if (direction >= 247.5 && direction < 292.5) directionName = 'W';
    else if (direction >= 292.5 && direction < 337.5) directionName = 'NW';
    else directionName = '--';

    return (<span>{directionName}</span>);
};

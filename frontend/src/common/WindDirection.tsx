import React, { type CSSProperties } from 'react';
import NavigationIcon from '@mui/icons-material/Navigation';
import InlineIcon from './InlineIcon';

const WindDirection: React.FC<{ direction: string }> = ({ direction }) => {
    let angle = 0;
    switch (direction) {
        case 'N':
            angle = 0;
            break;
        case 'NE':
            angle = 45;
            break;
        case 'E':
            angle = 90;
            break;
        case 'SE':
            angle = 135;
            break;
        case 'S':
            angle = 180;
            break;
        case 'SW':
            angle = 225;
            break;
        case 'W':
            angle = 270;
            break;
        case 'NW':
            angle = 315;
            break;
    }

    const directionStyle: CSSProperties = {
        transform: `rotate(${angle}deg)`
    };

    return (
        <InlineIcon>
            <NavigationIcon style={directionStyle} />
        </InlineIcon>
    );
};

export default WindDirection;

import React from 'react';
import { Box, ThemeProvider, createTheme, useColorScheme } from '@mui/material';
import { getTimeOfDayPeriod, type TimeOfDayPeriod } from '../util';

const GRADIENTS: Record<TimeOfDayPeriod, { light: string; dark: string }> = {
    dawn: {
        light: 'linear-gradient(135deg, #ff8a65 0%, #7986cb 100%)',
        dark: 'linear-gradient(135deg, #7a3b23 0%, #2c3475 100%)',
    },
    day: {
        light: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        dark: 'linear-gradient(135deg, #0d3b66 0%, #14508c 100%)',
    },
    dusk: {
        light: 'linear-gradient(135deg, #7e57c2 0%, #ff7043 100%)',
        dark: 'linear-gradient(135deg, #3d2a63 0%, #7a3b23 100%)',
    },
    night: {
        light: 'linear-gradient(135deg, #0d1b3e 0%, #1a237e 100%)',
        dark: 'linear-gradient(135deg, #05091c 0%, #10163a 100%)',
    },
};

// The banner always renders with light-on-dark text, like a printed
// colour band, regardless of the site's light/dark toggle - only the
// gradient's hue (time of day) and saturation (light vs dark mode)
// change. This keeps text contrast guaranteed without having to touch
// every child component's Typography colours individually.
const bannerTheme = createTheme({ palette: { mode: 'dark' } });

// Deliberately a plain Box rather than Card/Paper: Paper applies its own
// dark-mode elevation overlay (a translucent backgroundImage layered on
// top for shading) which fought with our own gradient and only showed
// through part of the card's width/height. Box has no such baggage, so
// the gradient we set is the only background in play.
const TimeOfDayBanner: React.FC<React.PropsWithChildren<{ sunrise?: string; sunset?: string }>> = ({ sunrise, sunset, children }) => {
    const { mode, systemMode } = useColorScheme();
    const resolvedMode = mode === 'system' ? systemMode : mode;
    const period = getTimeOfDayPeriod(sunrise, sunset);
    const background = GRADIENTS[period][resolvedMode === 'dark' ? 'dark' : 'light'];

    return (
        <ThemeProvider theme={bannerTheme}>
            <Box
                sx={{
                    background,
                    transition: 'background 1.5s ease',
                    width: '100%',
                    boxSizing: 'border-box',
                    borderRadius: 1,
                    p: 2,
                    color: 'text.primary',
                }}
            >
                {children}
            </Box>
        </ThemeProvider>
    );
};

export default TimeOfDayBanner;

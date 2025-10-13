import React, { useState } from 'react';
import {
    Box,
    Container,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SunnyIcon from '@mui/icons-material/Sunny';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import TodayTab from './todaytab';
import PastTab from './pasttab';
import StatsTab from './statstab';

const BoxContainer: React.FC<React.PropsWithChildren> = ({ children }) => (
    <Container maxWidth="xl" disableGutters>
        <Box sx={{
            fontFamily: 'Roboto, sans-serif', p: {
                xs: 0,
                md: 2
            },
            mx: 'auto'
        }}>
            {children}
        </Box>
    </Container>
);

const TabTag: React.FC<{ tab: number }> = ({ tab }) => {
    switch (tab) {
        case 0: return <TodayTab />;
        case 1: return <PastTab />;
        case 2: return <StatsTab />;
        default: return null;
    }
};

const ContentSection: React.FC = () => {
    const [tab, setTab] = useState(0);
    const location = 'Crows Nest';
    return (
        <BoxContainer>
            <Typography variant='h3' gutterBottom sx={{ display: { xs: 'none', md: 'block' } }}>
                {location}
            </Typography>
            <Typography variant='h2' gutterBottom sx={{
                display: { xs: 'block', md: 'none' },
                textAlign: 'center',
                paddingTop: 2
            }}>
                {location}
            </Typography>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="inherit" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Today" icon={<SunnyIcon />} iconPosition="start" />
                <Tab label="Past" icon={<AccessTimeIcon />} iconPosition="start" />
                <Tab label="Stats" icon={<QueryStatsIcon />} iconPosition="start" />
            </Tabs>

            <TabTag tab={tab} />
        </BoxContainer>
    );
};

export default ContentSection;

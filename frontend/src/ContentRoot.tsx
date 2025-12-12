import React from 'react';
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
import { Routes, Route, Link, useMatch } from 'react-router';
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

const TabTag: React.FC = () => {
    return (
        <Routes>
            <Route index element={<TodayTab />} />
            <Route path="/past" element={<PastTab />} />
            <Route path="/stats" element={<StatsTab />} />
        </Routes>
    );
};

const useTabIndex = (): number => {
    const past = useMatch('/past');
    const stats = useMatch('/stats');
    if (past) return 1;
    if (stats) return 2;
    return 0;
};

const ContentSection: React.FC = () => {
    const tab = useTabIndex();
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

            <Tabs value={tab} indicatorColor="primary" textColor="inherit" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Today" icon={<SunnyIcon />} iconPosition="start" component={Link} to='/' />
                <Tab label="Past" icon={<AccessTimeIcon />} iconPosition="start" component={Link} to='/past' />
                <Tab label="Stats" icon={<QueryStatsIcon />} iconPosition="start" component={Link} to='/stats' />
            </Tabs>

            <TabTag />
        </BoxContainer>
    );
};

export default ContentSection;

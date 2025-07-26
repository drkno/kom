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
import TodayTab from './todaytab';
import PastTab from './pasttab';

const BoxContainer: React.FC<React.PropsWithChildren> = ({ children }) => (
    <Container maxWidth="xl">
        <Box sx={{ fontFamily: 'Roboto, sans-serif', p: 2, mx: 'auto' }}>
            {children}
        </Box>
    </Container>
);

const TabTag: React.FC<{ tab: number }> = ({ tab }) => {
    switch (tab) {
        case 0: return <TodayTab />;
        case 1: return <PastTab />;
        default: return null;
    }
};

const ContentSection: React.FC = () => {
    const [tab, setTab] = useState(0);
    return (
        <BoxContainer>
            <Typography variant='h3' gutterBottom>
                Sydney - Crows Nest
            </Typography>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="inherit" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Today" icon={<SunnyIcon />} iconPosition="start" />
                <Tab label="Past" icon={<AccessTimeIcon />} iconPosition="start" />
            </Tabs>

            <TabTag tab={tab} />
        </BoxContainer>
    );
};

export default ContentSection;

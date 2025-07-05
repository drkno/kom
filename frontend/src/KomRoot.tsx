import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import TodayTab from './todaytab';
import PastTab from './pasttab';

const TabTag: React.FC<{ tab: number }> = ({ tab }) => {
  switch (tab) {
    case 0: return <TodayTab />;
    case 1: return <PastTab />;
    default: return null;
  }
};

const KomRoot: React.FC = () => {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ fontFamily: 'Roboto, sans-serif', p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="inherit" variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider'}}>
        <Tab label="Today" icon={<WbSunnyIcon />} iconPosition="start" />
        <Tab label="Past" icon={<AccessTimeIcon />} iconPosition="start" />
      </Tabs>

      <TabTag tab={tab} />
    </Box>
  );
};

export default KomRoot;

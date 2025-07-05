import React from 'react';
import {
  Box,
  CircularProgress,
} from '@mui/material';

const Loading: React.FC = () => (
  <Box display="flex" justifyContent="center" p={3}>
    <CircularProgress />
  </Box>
);

export default Loading;

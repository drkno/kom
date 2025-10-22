import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { } from '@mui/x-charts/themeAugmentation';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import KomRoot from './KomRoot.tsx'

const theme = createTheme({
    colorSchemes: {
        light: true,
        dark: true,
    }
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <CssBaseline />
                <KomRoot />
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>,
);

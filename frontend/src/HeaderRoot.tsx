import React from 'react';
import {
    AppBar,
    Box,
    Button,
    Container,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import SunnyIcon from '@mui/icons-material/Sunny';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const KoMTitle: React.FC = () => (
    <Typography variant="h6"
        noWrap
        component="div"
        sx={{
            mr: 2,
            display: { md: 'flex' },
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '.1rem',
            color: 'inherit',
            textDecoration: 'none',
        }}>
        The Knox of Meteorology
    </Typography>
);

const DarkModeToggle: React.FC = () => {
    const { mode, setMode } = useColorScheme();

    const toggleDarkMode = () => {
        setMode(mode === 'light' ? 'dark' : 'light');
    };

    return (
        <IconButton color='inherit' aria-label='Toggle dark mode' onClick={toggleDarkMode}>
            {mode === 'light' ? <SunnyIcon /> : <BedtimeIcon />}
        </IconButton>
    );
};

const ToolbarMenu: React.FC<{ buttonText: string, children: React.ReactNode }> = ({ buttonText, children }) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    return (
        <>
            <Button
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                color='inherit'
                variant="text"
                disableElevation
                onClick={handleClick}
                endIcon={<KeyboardArrowDownIcon />}>
                {buttonText}
            </Button>
            <Menu
                elevation={0}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                slotProps={{}}>
                {children}
            </Menu>
        </>
    );
};

const HeaderRoot: React.FC = () => {
    return (
        <AppBar position='sticky'>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ textAlign: 'left' }}>
                    <KoMTitle />
                    <Box sx={{ flexGrow: 1 }}>
                    </Box>
                    <Box sx={{ flexGrow: 0 }}>
                        <ToolbarMenu buttonText='Observatory'>
                            <MenuItem>
                                Sydney - Crows Nest
                            </MenuItem>
                        </ToolbarMenu>
                        <DarkModeToggle />
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default HeaderRoot;

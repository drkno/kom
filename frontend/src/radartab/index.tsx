import React, { useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, IconButton, Slider, Stack, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Loading from '../common/Loading.tsx';

interface RadarManifest {
    background: string;
    overlays: string[];
    frames: string[];
}

const REFRESH_INTERVAL_MS = 3 * 60 * 1000;
const PLAYBACK_INTERVAL_MS = 600;

const imageUrl = (name: string): string => `/api/radar/image/${encodeURIComponent(name)}`;

// IDR713.T.202609182304.png -> "23:04"
const formatFrameLabel = (name: string): string => {
    const match = name.match(/\.T\.(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})\.png$/);
    return match ? `${match[4]}:${match[5]}` : name;
};

const layerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
};

const RadarTab: React.FC = () => {
    const [manifest, setManifest] = useState<RadarManifest | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [frameIndex, setFrameIndex] = useState(0);
    const [playing, setPlaying] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch('/api/radar');
                if (!res.ok) {
                    throw new Error('Radar unavailable');
                }
                const data: RadarManifest = await res.json();
                if (!cancelled) {
                    setManifest(data);
                    setError(null);
                }
            } catch {
                if (!cancelled) {
                    setError('Rain radar is temporarily unavailable.');
                }
            }
        };

        (async () => {
            await load();
        })();
        const interval = setInterval(load, REFRESH_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!playing || !manifest || manifest.frames.length === 0) {
            return;
        }
        const timer = setInterval(() => {
            setFrameIndex(i => (i + 1) % manifest.frames.length);
        }, PLAYBACK_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [playing, manifest]);

    if (error) {
        return <Alert severity="warning">{error}</Alert>;
    }
    if (!manifest) {
        return <Loading />;
    }

    const topography = manifest.overlays.find(o => o === 'topography');
    const locations = manifest.overlays.find(o => o === 'locations');
    // Derived rather than synced via an effect: frameIndex keeps ticking
    // (playback or manual scrub) and we just wrap it to whatever the
    // latest manifest's frame count happens to be.
    const safeIndex = manifest.frames.length > 0 ? frameIndex % manifest.frames.length : 0;
    const currentFrame = manifest.frames[safeIndex];

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Rain Radar
                </Typography>
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1 / 1',
                        maxWidth: 512,
                        mx: 'auto',
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: '#0a0a0a',
                    }}
                >
                    <img src={imageUrl(manifest.background)} alt="" style={layerStyle} />
                    {topography && <img src={imageUrl(topography)} alt="" style={layerStyle} />}
                    {currentFrame && <img src={imageUrl(currentFrame)} alt="Radar" style={layerStyle} />}
                    {locations && <img src={imageUrl(locations)} alt="" style={layerStyle} />}
                </Box>

                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 2 }}>
                    <IconButton onClick={() => setPlaying(p => !p)} size="small">
                        {playing ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <Slider
                        value={safeIndex}
                        min={0}
                        max={Math.max(manifest.frames.length - 1, 0)}
                        step={1}
                        onChange={(_, value) => {
                            setPlaying(false);
                            setFrameIndex(value as number);
                        }}
                        valueLabelDisplay="auto"
                        valueLabelFormat={value => formatFrameLabel(manifest.frames[value])}
                        sx={{ flexGrow: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 48 }}>
                        {currentFrame ? formatFrameLabel(currentFrame) : ''}
                    </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                    Sydney (Terrey Hills) 128km radar - Bureau of Meteorology
                </Typography>
            </CardContent>
        </Card>
    );
};

export default RadarTab;

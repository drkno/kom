import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const proxyTarget = env.PROXY_URL || env.VITE_PROXY_URL || process.env.PROXY_URL || process.env.VITE_PROXY_URL || 'http://localhost:5000';

    return {
        build: {
            outDir: 'build',
        },
        plugins: [react()],
        server: {
            proxy: {
                '/api': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
            },
        },
        preview: {
            proxy: {
                '/api': {
                    target: proxyTarget,
                    changeOrigin: true,
                },
            },
        },
    };
});

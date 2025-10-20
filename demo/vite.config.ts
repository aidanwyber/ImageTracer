import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const demoRoot = resolve(__dirname);

export default defineConfig({
        root: demoRoot,
        publicDir: resolve(__dirname, 'public'),
        build: {
                outDir: resolve(__dirname, 'dist'),
                emptyOutDir: true,
                rollupOptions: {
                        input: resolve(__dirname, 'index.html'),
                },
        },
        server: {
                open: true,
                fs: {
                        allow: [resolve(__dirname, '..')],
                },
        },
});

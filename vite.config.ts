import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const isAppDeployBuild = Boolean(process.env.APPDEPLOY_VITE_OUT_DIR);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: isAppDeployBuild
      ? {}
      : {
          '@appdeploy/client': fileURLToPath(
            new URL('./src/appdeployClient.local.ts', import.meta.url)
          ),
        },
  },
  base: './',
  build: {
    outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
    sourcemap:
      process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
    rollupOptions: {
      maxParallelFileOps: 128,
    },
  },
});

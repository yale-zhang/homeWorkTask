
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file (not strictly necessary here) — Vite exposes variables via import.meta.env.
  // Use variables prefixed with `VITE_` (e.g. VITE_API_KEY) in the client.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Only allow VITE_ prefixed envs in the client; keep build output settings intact.
    envPrefix: 'VITE_',
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: './index.html'
        }
      }
    }
  };
});

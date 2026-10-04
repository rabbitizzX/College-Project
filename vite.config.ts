import path from 'path';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import { parseCsv, processSurvey } from './src/data';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT ?? '5173';
const port = Number(rawPort);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || '/';

const surveyCsvPath = path.resolve(import.meta.dirname, 'data', 'responses.csv');
const surveyModuleId = 'virtual:digital-saathi-survey-summary';
const resolvedSurveyModuleId = `\0${surveyModuleId}`;

const surveySummaryPlugin: Plugin = {
  name: 'digital-saathi-survey-summary',
  resolveId(id) {
    return id === surveyModuleId ? resolvedSurveyModuleId : undefined;
  },
  load(id) {
    if (id !== resolvedSurveyModuleId) return undefined;
    const records = parseCsv(readFileSync(surveyCsvPath, 'utf8'));
    if (records.length < 2) {
      throw new Error(`Survey CSV has no response rows: ${surveyCsvPath}`);
    }
    const summary = processSurvey(records.slice(1));
    if (summary.total === 0) {
      throw new Error(`Survey CSV contains no valid participant responses: ${surveyCsvPath}`);
    }
    // Only aggregated results enter the browser bundle; individual survey rows stay private.
    return `export default ${JSON.stringify(summary)};`;
  },
  configureServer(server: ViteDevServer) {
    server.watcher.add(surveyCsvPath);
    server.watcher.on('change', changedPath => {
      if (path.resolve(changedPath) !== surveyCsvPath) return;
      const module = server.moduleGraph.getModuleById(resolvedSurveyModuleId);
      if (module) server.moduleGraph.invalidateModule(module);
      server.ws.send({ type: 'full-reload' });
    });
  },
};

export default defineConfig({
  base: basePath,
  plugins: [
    surveySummaryPlugin,
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

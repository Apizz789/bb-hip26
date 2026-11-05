// Bundles the app into dist/ as a single IIFE so dist/index.html also works from file://.
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

await build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  format: 'iife',
  target: ['es2022', 'chrome110', 'safari16'],
  jsx: 'automatic',
  outfile: 'dist/app.js',
  sourcemap: false,
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  logLevel: 'info',
});

writeFileSync('dist/index.html', readFileSync('index.html', 'utf8'));
cpSync('public', 'dist', { recursive: true, errorOnExist: false, force: true });
console.log('Built dist/ (open dist/index.html or run npm run dev)');

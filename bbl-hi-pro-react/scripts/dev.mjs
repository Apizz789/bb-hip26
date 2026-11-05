// Dev server with rebuild on change. Writes to .dev/ (never dist/, which holds the production build)
// and serves it on http://localhost:5173
import { context } from 'esbuild';
import { cpSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';

mkdirSync('.dev', { recursive: true });
writeFileSync('.dev/index.html', readFileSync('index.html', 'utf8'));
cpSync('public', '.dev', { recursive: true, force: true });

const ctx = await context({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  format: 'iife',
  jsx: 'automatic',
  outfile: '.dev/app.js',
  sourcemap: true,
  define: { 'process.env.NODE_ENV': '"development"' },
  logLevel: 'info',
});
await ctx.watch();
const { port } = await ctx.serve({ servedir: '.dev', port: 5173 });
console.log(`Dev server: http://localhost:${port}`);

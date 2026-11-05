// Runs every E2E suite against dist/index.html (build first: npm run build).
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const suites = ['p1.e2e.cjs', 'p2.e2e.cjs', 'p3.e2e.cjs', 'p4.e2e.cjs', 'route-focus.e2e.cjs', 'features.e2e.cjs', 'features-more.e2e.cjs', 'journeys.e2e.cjs', 'interactions.e2e.cjs', 'a11y-dom.e2e.cjs', 'a11y-behaviour.e2e.cjs', 'responsive.e2e.cjs'];
let failed = 0;
for (const s of suites) {
  const r = spawnSync(process.execPath, [join(here, s)], { stdio: 'inherit', timeout: 170000 });
  const ok = r.status === 0;
  console.log(`\n[${ok ? 'PASS' : 'FAIL'}] ${s}`);
  if (!ok) failed++;
}
console.log(`\n${suites.length - failed}/${suites.length} suites passed`);
process.exit(failed ? 1 : 0);

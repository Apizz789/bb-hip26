// Captures prototype and React screenshots at 390/430/768/1000/1440 px (reduced motion, DPR 1).
// Usage: node tests/visual/capture.cjs <outDir>. Prototype path: PROTO_FILE env (default ../preview_p4.html next to project).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const out = process.argv[2] || path.resolve(__dirname, '../../.visual-out');
const proto = process.env.PROTO_FILE || path.resolve(__dirname, '../../../preview_p4.html');
const react = path.resolve(__dirname, '../../dist/index.html');
const targets = { proto: 'file://' + proto, react: 'file://' + react };
const widths = [390, 430, 768, 1000, 1440];
const routes = ['home', 'services', 'wellness', 'goals', 'contact', 'playground'];
(async () => {
  const browser = await chromium.launch();
  for (const [name, base] of Object.entries(targets)) {
    fs.mkdirSync(path.join(out, name), { recursive: true });
    for (const w of widths) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(base);
      await page.waitForTimeout(600);
      for (const r of routes) {
        await page.evaluate(h => { location.hash = h; }, r);
        await page.waitForTimeout(900);
        await page.evaluate(() => document.querySelectorAll('.reveal').forEach(el => { el.style.animation = 'none'; el.style.opacity = '1'; el.style.transform = 'none'; }));
        await page.waitForTimeout(150);
        await page.screenshot({ path: path.join(out, name, `${r}_${w}.png`), fullPage: true });
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log('captured to ' + out);
})().catch(e => { console.error(e); process.exit(1); });

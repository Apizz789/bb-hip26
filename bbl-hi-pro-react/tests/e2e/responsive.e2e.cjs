// Responsive checks on the React build: no horizontal page overflow on any route at common widths (320 px is the
// 400% zoom reflow width for a 1280 px desktop), and the mobile bottom navigation only below the desktop breakpoint.
const { runSuite, goRoute, splashGone } = require('./helpers.cjs');

const ROUTES = ['home', 'services', 'svc-documents', 'svc-appointment', 'svc-tracking', 'svc-overview', 'wellness', 'goals', 'playground', 'contact', 'brand'];
const WIDTHS = [320, 390, 430, 768, 1000, 1440];

runSuite('responsive (overflow and navigation by width)', async ({ check, newPage }) => {
  for (const w of WIDTHS) {
    const p = await newPage({ viewport: { width: w, height: 860 } });
    await splashGone(p);
    const overflowRoutes = [];
    for (const r of ROUTES) {
      await goRoute(p, r);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (over > 1) overflowRoutes.push(`${r}(+${over}px)`);
    }
    check(`${w}px: no horizontal page overflow on any route`, overflowRoutes.length === 0, overflowRoutes.join(', '));

    const bottomNav = await p.evaluate(() => { const b = document.querySelector('.bottom-nav'); return !!b && getComputedStyle(b).display !== 'none'; });
    const expectBottom = w < 960;
    check(`${w}px: bottom navigation ${expectBottom ? 'shown' : 'hidden'} at this width`, bottomNav === expectBottom,
      `bottomNav=${bottomNav}`);
    await p.close();
  }
});

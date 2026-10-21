import { chromium } from 'playwright';
const U = process.argv[2] || 'http://localhost:18080';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium' });
for (const [w, h, mob] of [[1366, 860, false], [390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob }); const pg = await ctx.newPage();
  await pg.goto(U + '/'); await pg.waitForTimeout(2500);
  const r = await pg.evaluate(() => { const bt = document.querySelector('#bootPower .powerbtn'), s = bt.querySelector('svg'); const a = bt.getBoundingClientRect(), c = s.getBoundingClientRect(); return { btn: [a.left, a.top, a.width, a.height], svg: [c.left, c.top, c.width, c.height] }; });
  const pts = { centre: [r.svg[0] + r.svg[2] / 2, r.svg[1] + r.svg[3] / 2], symbolStroke: [r.svg[0] + r.svg[2] / 2, r.svg[1] + r.svg[3] * 0.2], edge: [r.btn[0] + 4, r.btn[1] + 4] };
  for (const [k, [x, y]] of Object.entries(pts)) {
    const info = await pg.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return { tag: e && (e.tagName + '.' + (e.className.baseVal ?? e.className)), inBtn: !!(e && e.closest && e.closest('.powerbtn')), cursor: e && getComputedStyle(e).cursor }; }, [x, y]);
    console.log(w, k, JSON.stringify(info));
  }
  // really click the middle of the symbol
  await pg.mouse.click(pts.symbolStroke[0], pts.symbolStroke[1]); await pg.waitForTimeout(800);
  console.log(w, 'after clicking the symbol: powered on =', await pg.evaluate(() => document.querySelector('#bootPower').classList.contains('on')));
  await ctx.close();
}
await b.close();

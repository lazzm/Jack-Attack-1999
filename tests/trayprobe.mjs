import { chromium } from 'playwright';
const U = process.argv[2] || 'http://localhost:18080';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium' });
for (const [w, h] of [[1366, 860], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const pg = await ctx.newPage();
  await pg.goto(U + '/?noboot'); await pg.waitForTimeout(4000);
  await pg.evaluate(() => { const bt = [...document.querySelectorAll('button')].find(b => /guest/i.test(b.textContent) && b.offsetParent); if (bt) bt.click(); });
  await pg.waitForTimeout(8000);
  const items = await pg.evaluate(() => [...document.querySelectorAll('#tray > *')].filter(e => e.offsetParent).map(e => (e.id || e.className.split(' ')[0]) + ' | ' + (e.title || e.getAttribute('aria-label') || e.textContent).slice(0, 50)));
  console.log(w, items.length, '\n  ' + items.join('\n  '));
  await pg.screenshot({ path: `tray-${w}.png`, clip: w > 500 ? { x: 900, y: 820, width: 466, height: 40 } : { x: 0, y: 804, width: 390, height: 40 } });
  await ctx.close();
}
await b.close();

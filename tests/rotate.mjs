import { chromium } from 'playwright';
const U = process.argv[2] || 'http://localhost:18080';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium' }); const errs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message));
await pg.goto(U + '/?noboot'); await pg.waitForTimeout(4000);
await pg.evaluate(() => { const bt = [...document.querySelectorAll('button')].find(b => /guest/i.test(b.textContent) && b.offsetParent); if (bt) bt.click(); }); await pg.waitForTimeout(6000);
await pg.evaluate(() => { document.querySelectorAll('.msgbox .btn').forEach(b => b.click()); Apps.run('notepad'); Apps.run('calc'); }); await pg.waitForTimeout(1200);
const rects = tag => pg.evaluate(t => { const vw = innerWidth, vh = innerHeight; const out = [t + ' vp ' + vw + 'x' + vh];
  for (const el of [document.getElementById('browser'), ...document.querySelectorAll('.appwin')]) { if (!el || getComputedStyle(el).display === 'none' || el.classList.contains('min')) continue; const r = el.getBoundingClientRect(); out.push(`  ${el.id || el.getAttribute('aria-label')}: x${Math.round(r.left)} y${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}${r.right > vw + 1 || r.left < -1 ? '  <-- OFF SCREEN SIDEWAYS' : ''}${r.bottom > vh + 1 ? '  <-- TOO TALL' : ''}`); }
  return out.join('\n'); }, tag);
console.log(await rects('portrait'));
await pg.setViewportSize({ width: 844, height: 390 }); await pg.waitForTimeout(1500);
console.log(await rects('landscape'));
// in landscape, move + resize the browser like a person would (the title bar drag works above 760px wide)
const tb = await pg.$('#brTitleBar'); if (tb) { const r = await tb.boundingBox(); await pg.mouse.move(r.x + 100, r.y + 8); await pg.mouse.down(); await pg.mouse.move(r.x + 160, r.y + 30, { steps: 5 }); await pg.mouse.up(); }
await pg.waitForTimeout(500); console.log(await rects('landscape after drag'));
await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(1500);
console.log(await rects('portrait again'));
await pg.screenshot({ path: 'rot-back.png' });
console.log('errors', errs); await b.close();

import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium' }); const errs = [];
const ctx = await b.newContext({ viewport: { width: 1366, height: 860 } }); const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(e.message));
await pg.goto('http://localhost:18080/?noboot'); await pg.waitForTimeout(4000);
await pg.evaluate(() => { const bt = [...document.querySelectorAll('button')].find(b => /guest/i.test(b.textContent) && b.offsetParent); if (bt) bt.click(); }); await pg.waitForTimeout(5000);
const egg = () => pg.evaluate(() => !!document.querySelector('#tray .ff-traygc'));
console.log('fresh egg', await egg(), 'has', await pg.evaluate(() => Setup.has('grotchi')));
await pg.evaluate(() => { const S = JSON.parse(localStorage.getItem('jhp_setup')); S.add.grotchi = Date.now(); localStorage.setItem('jhp_setup', JSON.stringify(S)); });
await pg.reload(); await pg.waitForTimeout(6000); console.log('after reload egg', await egg(), await pg.evaluate(() => [Setup.has('grotchi'), localStorage.getItem('jhp_setup'), !!document.getElementById('tray'), typeof Apps]));
// a hungry pet: nag icon only when installed
await pg.evaluate(() => { const t = Date.now() - 10 * 3600000; localStorage.setItem('jhp_fun_grotchi', JSON.stringify({ born: t, fed: t, played: t, cleaned: t, gen: 1 })); });
await pg.evaluate(() => { const S = JSON.parse(localStorage.getItem('jhp_setup')); S.add.grotchi = Date.now(); localStorage.setItem('jhp_setup', JSON.stringify(S)); });
await pg.reload(); await pg.waitForTimeout(9000); console.log('hungry+installed nag', await pg.evaluate(() => !!document.querySelector('#tray .fam-nag')));
await pg.evaluate(() => { const S = JSON.parse(localStorage.getItem('jhp_setup')); delete S.add.grotchi; localStorage.setItem('jhp_setup', JSON.stringify(S)); });
await pg.reload(); await pg.waitForTimeout(9000); console.log('hungry+uninstalled nag', await pg.evaluate(() => !!document.querySelector('#tray .fam-nag')), 'egg', await egg());
console.log('errors', errs); await b.close();

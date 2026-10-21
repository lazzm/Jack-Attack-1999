import { chromium } from 'playwright';
const s = process.argv[2] || 'd';
const V = { d: [1366, 860], p: [390, 844] };
const [w, h] = V[s];
const b = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: s === 'p', hasTouch: s === 'p' });
await ctx.addInitScript(() => { try { if (sessionStorage.getItem('__fake49')) { localStorage.setItem('jhp_last', String(Date.now() - 49 * 3600e3)); sessionStorage.removeItem('__fake49'); } } catch (e) {} });
const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CE ' + m.text()); });
const scene = () => pg.evaluate(() => { const p = document.getElementById('bootPower'); return !!p && p.isConnected && !p.hidden && getComputedStyle(p).display !== 'none'; });
const press = async () => { await pg.waitForSelector('.powerbtn', { state: 'visible' }); await pg.waitForTimeout(700); const bb = await pg.locator('.powerbtn').boundingBox(); await pg.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); };
const booted = async () => { await pg.waitForSelector('.logon [data-c]', { timeout: 40000 }).then(() => pg.click('.logon [data-c]')).catch(() => console.log('  (no logon box)')); await pg.evaluate(() => window.BootDone); await pg.waitForTimeout(1200); };
const state = () => pg.evaluate(() => ({ mode: window.JHPBoot, sec: window.IE && IE.current, wins: [...document.querySelectorAll('.appwin')].map(e => e.getAttribute('aria-label') + '@' + e.style.left + ',' + e.style.top), logon: !!document.querySelector('.logon'), boot: !!document.getElementById('boot') }));
// A: first visit
await pg.goto('http://localhost:18080/'); await pg.waitForTimeout(900);
console.log('A first visit: scene', await scene(), JSON.stringify(await state()));
await press(); await booted();
await pg.evaluate(() => { IE.go('reviews'); Apps.open('calc'); Apps.open('winver'); });
await pg.waitForTimeout(600);
await pg.evaluate(() => { [...document.querySelectorAll('.appwin')].forEach((el, i) => { el.style.left = (40 + i * 150) + 'px'; el.style.top = (90 + i * 40) + 'px'; }); });
// B: refresh within 48 h: wakes straight back
await pg.reload(); await pg.waitForTimeout(250);
console.log('B refresh: scene', await scene(), 'html.pc-wake', await pg.evaluate(() => document.documentElement.classList.contains('pc-wake')));
await pg.screenshot({ path: `m-${s}-wake0.png` });
await pg.waitForTimeout(2200);
console.log('B after 2.4s', JSON.stringify(await state()));
await pg.screenshot({ path: `m-${s}-wake1.png` });
// C: away 49 hours: switched off, full boot, fresh
await pg.evaluate(() => sessionStorage.setItem('__fake49', '1')); // (the clock jumps 49 hours: set before the page's own scripts run)
await pg.reload(); await pg.waitForTimeout(900);
console.log('C 49h later: scene', await scene(), JSON.stringify(await state()));
await press(); await booted();
console.log('C after boot', JSON.stringify(await state()));
// D: the bug repro: Shut Down, then F5, must stay switched off
await pg.evaluate(() => document.getElementById('startBtn').click()); await pg.waitForTimeout(300); await pg.evaluate(() => document.getElementById('smShutdown').click()); await pg.waitForTimeout(300);
await pg.evaluate(() => { const r = document.querySelector('input[name=sd][value=off]'); r.checked = true; r.form.requestSubmit(); });
console.log('D jhp_off right after submit', await pg.evaluate(() => localStorage.getItem('jhp_off')));
await pg.waitForEvent('load', { timeout: 15000 }); await pg.waitForTimeout(800);
console.log('D after shut down: scene', await scene(), JSON.stringify(await state()));
await pg.keyboard.press('F5').catch(() => {}); await pg.reload(); await pg.waitForTimeout(900);
console.log('D after F5: scene', await scene(), JSON.stringify(await state()));
await pg.reload(); await pg.waitForTimeout(900);
console.log('D after 2nd F5: scene', await scene());
await press(); await booted();
console.log('D after power: off flag', await pg.evaluate(() => localStorage.getItem('jhp_off')), JSON.stringify(await state()));
await pg.reload(); await pg.waitForTimeout(2500);
console.log('E refresh after that: woke', JSON.stringify(await state()));
console.log(s, errs);
await b.close();

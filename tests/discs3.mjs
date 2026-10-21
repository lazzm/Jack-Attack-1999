import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const errs = [];
const p = await (await browser.newContext({ viewport: { width: 1366, height: 860 } })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('c: ' + m.text()); });
await p.goto(process.argv[2] + '/?noboot&allsoft'); await p.waitForTimeout(4000);
await p.evaluate(() => { document.querySelectorAll('.msgbox .btn').forEach(b=>b.click()); document.querySelectorAll('.appwin [data-w=close]').forEach(b=>b.click()); });
const ids = await p.evaluate(() => (Array.isArray(Discs.BOXES) ? Discs.BOXES.map(b => b.id) : Object.keys(Discs.BOXES)).filter(Boolean));
console.log('boxes', ids.join(' '));
for (const id of ids.filter(i => /park|city|squig|rts|boss|keepa/.test(i))) {
  await p.evaluate(i => Discs.play(i), id);
  for (let i = 0; i < 30; i++) { await p.waitForTimeout(600); await p.evaluate(() => { const b = [...document.querySelectorAll('.msgbox .btn, .appwin .btn, .appwin button')].find(b => /^(OK|Next >|Finish|Yes|Install|Continue|Play|I Agree|Install & Play)$/i.test(b.textContent.trim()) && b.offsetParent); b && b.click(); }); }
  await p.waitForTimeout(2500); await p.screenshot({ path: `shots/dg-${id}.png` });
  await p.evaluate(() => document.querySelectorAll('.appwin [data-w=close]').forEach(b => b.click()));
}
console.log(errs.join('\n') || 'no errors'); await browser.close();

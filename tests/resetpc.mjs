import { chromium } from 'playwright';
const errors = [], res = [];
const ok = (n, c, x) => res.push((c ? 'PASS ' : 'FAIL ') + n + (x ? ' :: ' + x : ''));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const RUN = Date.now().toString(36).slice(-5), PW = 'secret99';
async function fresh(tag) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('[' + tag + '] ' + e.message));
  await page.goto('http://localhost:18080/?noboot');
  await page.waitForFunction(() => window.Net && Net.me && Net.me.id && window.JackLogon && window.Roam, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.evaluate(() => { const c = document.querySelector('.logon button[type=button]'); if (c) c.click(); });
  return page;
}
const logon = async (page, name) => { await page.evaluate(() => { JackLogon.show(); }); await page.waitForSelector('#jlUser'); await page.fill('#jlUser', name); await page.fill('#jlPass', PW); await page.press('#jlPass', 'Enter'); };
const U = 'rs' + RUN;
const p = await fresh('a');
await p.evaluate(() => { localStorage.setItem('jhp_files_docs', JSON.stringify({ 'mine.txt': { text: 'hi', date: '19/10/99' } })); });
await logon(p, U);
await p.waitForTimeout(9000);
// install everything + make a file, then sync
const before = await p.evaluate(async () => { const S = JSON.parse(localStorage.getItem('jhp_setup')); S.add = S.add || {}; ['spider','reversi','jackamp','pinball','ski','chess'].forEach(id => S.add[id] = Date.now()); localStorage.setItem('jhp_setup', JSON.stringify(S)); await Roam.syncNow(); return Object.keys(S.add).length; });
ok('installed extra programs', before >= 6, before);
await p.waitForTimeout(2000);
const r = await fetch('http://localhost:18080/admin/reset-pc?name=' + U, { method: 'POST', headers: { 'X-Admin-Token': 'testtoken' } }).then(r => r.text());
ok('admin reset', /fresh PC/.test(r), r.trim());
await p.waitForEvent('load', { timeout: 15000 }).catch(() => {});
await p.waitForFunction(() => window.Net && Net.me && Net.me.member, null, { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(3000);
const after = await p.evaluate(() => ({ setup: localStorage.getItem('jhp_setup'), docs: localStorage.getItem('jhp_files_docs'), member: Net.me.member, nick: Net.me.nick }));
ok('open window reloaded into a fresh PC', after.setup && !/spider/.test(after.setup), after.setup);
ok('files gone', !after.docs || !/mine\.txt/.test(after.docs), after.docs);
ok('still logged on', !!after.member, after.nick);
// a second computer gets the fresh PC too
const q = await fresh('b'); await logon(q, U);
await q.waitForEvent('load', { timeout: 15000 }).catch(() => {}); await q.waitForTimeout(4000);
const q1 = await q.evaluate(() => localStorage.getItem('jhp_setup'));
ok('second computer fresh too', !/spider/.test(q1 || ''), q1);
console.log(res.join('\n')); console.log('errors', errors);
await browser.close();

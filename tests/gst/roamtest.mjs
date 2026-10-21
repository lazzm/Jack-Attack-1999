// a guest's stuff going up to JackNet: on sign-up, and when logging on to an existing account (keep / use saved)
import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/tmp/claude-1000/-home-jackm/acf34d18-dce6-4034-9475-8fd25412d781/scratchpad/g/roam';
fs.mkdirSync(OUT, { recursive: true });
const errors = [], res = [];
const ok = (n, c, x) => res.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' :: ' + x : ''}`);
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const RUN = Date.now().toString(36).slice(-5), PW = 'secret99';
async function fresh(tag, w = 1366, h = 860) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag}] pageerror ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${tag}] console ${m.text()}`); });
  await page.goto('http://localhost:18080/?noboot');
  await page.waitForFunction(() => window.Net && Net.me && Net.me.id && window.JackLogon && window.Roam, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.evaluate(() => { const c = document.querySelector('.logon button[type=button]'); if (c) c.click(); });
  return page;
}
const makeStuff = (page, tag) => page.evaluate(t => {
  const docs = JSON.parse(localStorage.getItem('jhp_files_docs') || '{}'); docs[t + '.txt'] = { text: 'made by a guest ' + t, date: '16/10/99' }; localStorage.setItem('jhp_files_docs', JSON.stringify(docs));
  const s = JSON.parse(localStorage.getItem('jhp_secrets') || '{}'); s['test.' + t] = Date.now(); s['test2.' + t] = Date.now(); s['test3.' + t] = Date.now(); localStorage.setItem('jhp_secrets', JSON.stringify(s));
}, tag);
const logon = async (page, name) => { await page.evaluate(() => { JackLogon.show(); }); await page.waitForSelector('#jlUser'); await page.fill('#jlUser', name); await page.fill('#jlPass', PW); await page.press('#jlPass', 'Enter'); };
const docs = page => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('jhp_files_docs') || '{}')));

// 1. a guest makes things, then signs up: the copy box, then it's on the server
const U1 = 'rm' + RUN + 'a';
let p = await fresh('signup');
await makeStuff(p, 'g1');
await logon(p, U1);
await p.waitForSelector('[aria-label="Copying to JackNet"]', { timeout: 8000 }).then(() => ok('sign-up: copy box shows', true)).catch(() => ok('sign-up: copy box shows', false));
await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}/1-copying.png` });
await p.waitForFunction(() => /Done!/.test((document.querySelector('.rm-h') || {}).textContent || ''), null, { timeout: 15000 }).then(() => ok('sign-up: copy finished', true)).catch(() => ok('sign-up: copy finished', false));
await p.screenshot({ path: `${OUT}/1-done.png` });
await p.context().close();
let q = await fresh('second-pc');
await logon(q, U1);
await q.waitForEvent('load', { timeout: 15000 }).catch(() => {}); // profile comes down, page reloads
await q.waitForFunction(() => window.Net && Net.me && Net.me.member, null, { timeout: 15000 }).catch(() => {});
await q.waitForTimeout(1500);
ok('sign-up: the guest file is on another computer', (await docs(q)).includes('g1.txt'), (await docs(q)).join(','));
ok('sign-up: no keep/use question on a clean PC', !(await q.$('[aria-label="JackNet - Your Profile"]')));
await q.context().close();

// 2. another guest makes things, then logs on to that EXISTING account: asked; Keep merges
p = await fresh('keep');
await makeStuff(p, 'g2');
await logon(p, U1);
await p.waitForSelector('[aria-label="JackNet - Your Profile"]', { timeout: 10000 }).then(() => ok('existing: asked which to keep', true)).catch(() => ok('existing: asked which to keep', false));
await p.screenshot({ path: `${OUT}/2-choose.png` });
await p.evaluate(() => document.querySelector('[aria-label="JackNet - Your Profile"] [data-k]').click());
await p.waitForSelector('[aria-label="Copying to JackNet"]', { timeout: 8000 }).then(() => ok('keep: copy box', true)).catch(() => ok('keep: copy box', false));
await p.waitForEvent('load', { timeout: 20000 }).catch(() => {});
await p.waitForFunction(() => window.Net && Net.me && Net.me.member, null, { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(1500);
const merged = await docs(p);
ok('keep: both the saved file and the guest file', merged.includes('g1.txt') && merged.includes('g2.txt'), merged.join(','));
await p.context().close();
q = await fresh('third-pc');
await logon(q, U1);
await q.waitForEvent('load', { timeout: 15000 }).catch(() => {});
await q.waitForFunction(() => window.Net && Net.me && Net.me.member, null, { timeout: 15000 }).catch(() => {});
await q.waitForTimeout(1500);
ok('keep: merged profile reached the server', (await docs(q)).includes('g2.txt'), (await docs(q)).join(','));
await q.context().close();

// 3. Use saved: the member's profile comes down; the guest's things wait on the PC and come back at Log Off
p = await fresh('use');
await makeStuff(p, 'g3');
await logon(p, U1);
await p.waitForSelector('[aria-label="JackNet - Your Profile"]', { timeout: 10000 }).catch(() => {});
await p.evaluate(() => document.querySelector('[aria-label="JackNet - Your Profile"] [data-u]').click());
await p.waitForEvent('load', { timeout: 15000 }).catch(() => {});
await p.waitForFunction(() => window.Net && Net.me && Net.me.member, null, { timeout: 15000 }).catch(() => {});
await p.waitForTimeout(1200);
const used = await docs(p);
ok('use saved: profile files, not the guest file', used.includes('g1.txt') && !used.includes('g3.txt'), used.join(','));
ok('use saved: guest copy kept on the PC', await p.evaluate(() => !!localStorage.getItem('jhp_roam_guest')));
await p.evaluate(() => Roam.logoff());
ok('use saved: Log Off gives the guest file back', (await docs(p)).includes('g3.txt'), (await docs(p)).join(','));
await p.context().close();

console.log(res.join('\n')); console.log('errors', errors.length, errors.join('\n'));
await browser.close();

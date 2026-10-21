// every members-only action as a guest (box, nothing posted), forged as a guest (server refuses), and as a member (works)
import { chromium } from 'playwright';
import fs from 'fs';
const BASE = 'http://localhost:18080/?noboot';
const OUT = process.argv[2] || '/tmp/claude-1000/-home-jackm/acf34d18-dce6-4034-9475-8fd25412d781/scratchpad/g/gates';
fs.mkdirSync(OUT, { recursive: true });
const errors = [], results = [];
const ok = (name, cond, extra) => { results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' :: ' + extra : ''}`); };
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const RUN = Date.now().toString(36).slice(-5), MEM = 'gm' + RUN, PW = 'secret99';

async function mk(tag, member) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag}] pageerror ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${tag}] console ${m.text()}`); });
  await page.goto(BASE);
  await page.waitForFunction(() => window.Net && Net.me && Net.me.id && window.Guest && window.JackLogon, null, { timeout: 15000 });
  await page.waitForTimeout(500);
  const c = await page.$('.logon button[type=button]'); if (c && await c.isVisible()) await c.click();
  if (member) {
    await page.evaluate(() => { JackLogon.show(); });
    await page.fill('#jlUser', member); await page.fill('#jlPass', PW); await page.press('#jlPass', 'Enter');
    await page.waitForFunction(() => Net.me.member, null, { timeout: 10000 });
    await page.waitForTimeout(5000); // roaming may reload the page
    await page.waitForFunction(() => window.Net && Net.me && Net.me.member && window.Guest, null, { timeout: 15000 });
  }
  await page.waitForTimeout(1200);
  return page;
}
const box = page => page.evaluate(() => { const w = [...document.querySelectorAll('.gst-win')].find(e => e.isConnected); return w ? w.querySelector('.gst-what').textContent : null; });
const closeBox = page => page.evaluate(() => document.querySelectorAll('.gst-win [data-n]').forEach(b => b.click()));
async function expectBox(page, name, fn, want) {
  await closeBox(page);
  try { await fn(); } catch (e) { ok(name, false, 'script ' + e.message.split('\n')[0]); return; }
  await page.waitForTimeout(700);
  const w = await box(page);
  ok(name, !!w && (!want || w === want), 'box: ' + w);
  await closeBox(page);
}
const clk = (page, sel) => page.evaluate(s => document.querySelector(s).click(), sel);
const closeApps = page => page.evaluate(() => document.querySelectorAll('.appwin [data-w=close]').forEach(b => b.click()));
const showBrowser = page => page.evaluate(() => { document.getElementById('browser').classList.remove('min'); });

// ---------------------------------------------------------------- B, a member, is online so IM has somebody to talk to
const B = await mk('member', MEM);
const bNick = await B.evaluate(() => Net.me.nick);
await B.evaluate(() => { window.__got = []; Net.onRelay('social.im', d => window.__got.push(d)); Net.on('kvPush', m => window.__got.push(m.k)); });

// ---------------------------------------------------------------- A, a guest
const A = await mk('guest');
const aNick = await A.evaluate(() => Net.me.nick);
ok('guest nick', /^Guest\d+/.test(aNick), aNick);
ok('start menu shows guest nick', await A.evaluate(() => document.getElementById('smLogoffLbl').textContent) === `Log Off ${aNick}...`);
ok('Uh-Oh! window not auto-opened for a guest', await A.evaluate(() => ![...document.querySelectorAll('.appwin')].some(w => /^Uh-Oh!/.test(w.getAttribute('aria-label') || ''))));

// forums
await showBrowser(A);
await A.evaluate(() => IE.go('forums', 'click')); await A.waitForSelector('.fboard', { timeout: 8000 }).catch(() => {});
await A.evaluate(() => document.querySelector('.fboard').click()); await A.waitForSelector('[data-fnewtopic]', { timeout: 8000 });
await A.screenshot({ path: `${OUT}/a-board.png` });
await expectBox(A, 'forum New Topic (guest)', () => clk(A, '[data-fnewtopic]'), 'Posting on the forums');
await A.screenshot({ path: `${OUT}/a-board-box.png` });
const topicLink = await A.$('.ftopic');
if (topicLink) {
  await topicLink.click(); await A.waitForSelector('#freply', { timeout: 8000 });
  await A.fill('#freply textarea', 'guest trying to post ' + RUN);
  await A.screenshot({ path: `${OUT}/a-reply.png` });
  await expectBox(A, 'forum reply (guest)', () => clk(A, '#freply button[type=submit]'), 'Posting on the forums');
}
// profile edit + shout
await expectBox(A, 'edit profile (guest)', () => A.evaluate(() => Community.editProfile()), 'Having your own JackNet profile');
await A.evaluate(n => Community.openProfile(n), bNick); await A.waitForSelector('.shoutform', { timeout: 8000 });
await A.fill('.shoutform input', 'hi from a guest');
await expectBox(A, 'shout-out (guest)', () => clk(A, '.shoutform button'), 'Leaving shout-outs');
await A.screenshot({ path: `${OUT}/a-profile.png` });
// pen pals
await A.evaluate(() => IE.go('penpals', 'click')); await A.waitForTimeout(800);
const pp = await A.$('#ppMsg');
if (pp) { await A.fill('#ppMsg', 'looking for ork pals ' + RUN); await expectBox(A, 'pen pals (guest)', () => A.evaluate(() => document.getElementById('ppMsg').form.requestSubmit()), 'Pinning a note on the Pen Pals board'); }
else ok('pen pals form found', false);
// Uh-Oh!
await expectBox(A, 'Uh-Oh! add contact (guest)', () => A.evaluate(n => Social.addContact(n), bNick), 'Keeping an Uh-Oh! contact list');
await A.evaluate(n => UhOh.message(n), bNick); await A.waitForTimeout(800);
await A.evaluate(() => { const ta = [...document.querySelectorAll('.so-imta')].pop(); ta.value = 'hello from guest'; ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
await A.waitForTimeout(700);
ok('Uh-Oh! send (guest) box', await box(A) === 'Sending Uh-Oh! messages', await box(A));
await A.screenshot({ path: `${OUT}/a-uhoh.png` });
await closeBox(A);
// bottle
await expectBox(A, 'message in a bottle (guest)', () => A.evaluate(() => Social.CAPSULE.throwBottle()), 'Throwing a message in a bottle');
// IRC
await A.evaluate(() => Social.irc()); await A.waitForTimeout(2500);
const ircOk = await A.evaluate(() => !!document.querySelector('.ir-in, .ir-input, input[aria-label*="message" i]'));
results.push('info irc input found: ' + ircOk);
await closeApps(A);
// arcade high score backstop (jacktris/squig style direct send)
await expectBox(A, 'high score send (guest)', () => A.evaluate(() => Net.send({ t: 'score', g: 'snake', n: 'GST', s: 5 })), 'The High Score table');
ok('guest score kept locally', await A.evaluate(() => { try { return JSON.parse(localStorage.getItem('jhp_guest_scores')).snake.length > 0; } catch (e) { return false; } }));
// Teef backstop
await expectBox(A, 'teef buy (guest)', () => A.evaluate(() => Net.send({ t: 'ecBuy', id: 'misc.goldtoof' })), 'Spending Teef');
// GrotBay
await A.evaluate(() => IE.navigate('http://www.grotbay.webcom/item/pogs.html')); await A.waitForTimeout(1500);
if (await A.$('.gb-amt')) { await A.fill('.gb-amt', '99'); await expectBox(A, 'GrotBay bid (guest)', () => A.evaluate(() => document.querySelector('.gb-bid').requestSubmit()), 'Bidding on GrotBay'); await A.screenshot({ path: `${OUT}/a-bay.png` }); }
else ok('GrotBay item page', false);
await A.evaluate(() => IE.navigate('http://www.grotbay.webcom/sell.html')); await A.waitForTimeout(1500);
const sellTa = await A.$('.es-gb textarea');
if (sellTa) { await sellTa.fill('FOR SALE one guest ' + RUN); const inp = await A.$('.es-gb input[type=text]'); if (inp) await inp.fill('Guesty'); await expectBox(A, 'GrotBay sell (guest)', () => A.evaluate(() => document.querySelector('.es-gb form').requestSubmit()), 'Selling on GrotBay'); await A.screenshot({ path: `${OUT}/a-sell.png` }); }
else ok('GrotBay sell form', false);
// Shareware Shack
await A.evaluate(() => IE.navigate('http://www.sharewareshack.netz/')); await A.waitForTimeout(1500);
const soft = await A.$('a[href*="/soft/"]');
if (soft) { await soft.click(); await A.waitForTimeout(1500); }
if (await A.$('.ssk-rate button')) { await expectBox(A, 'Shack rating (guest)', () => clk(A, '.ssk-rate button[data-r="5"]'), 'Rating programs on the Shareware Shack'); await A.screenshot({ path: `${OUT}/a-shack.png` }); }
else ok('Shack rate buttons', false);
// Homepagez publish
await A.evaluate(() => Apps.open('hpz.builder')); await A.waitForSelector('.hpzb-pub', { timeout: 10000 }).catch(() => {});
if (await A.$('.hpzb-pub')) await expectBox(A, 'Homepagez publish (guest)', () => clk(A, '.hpzb-pub'), 'Publishing a homepage'); else ok('PageBuilder publish button', false);
await A.evaluate(() => document.querySelectorAll('.appwin [data-w=close]').forEach(b => b.click()));
// Start menu padlocks
await clk(A, '#startBtn'); await A.waitForTimeout(300); await clk(A, '[data-sm=programs]'); await A.waitForTimeout(300);
await A.evaluate(() => { const b = [...document.querySelectorAll('.menu button')].find(x => /JackNet Hangout/.test(x.textContent)); if (b) b.click(); });
await A.waitForTimeout(400);
ok('Start menu padlock on Message in a Bottle', await A.evaluate(() => { const b = [...document.querySelectorAll('.menu button')].find(x => /Message in a Bottle/.test(x.textContent)); return !!(b && b.querySelector('.gst-pad')); }));
await A.screenshot({ path: `${OUT}/a-startmenu.png` });
await A.keyboard.press('Escape'); await A.evaluate(() => { IE.closeMenus(); document.getElementById('startMenu').classList.remove('open'); });

await B.waitForTimeout(800);
const bGot = await B.evaluate(() => window.__got);
ok('member B received nothing from the guest', !bGot.some(x => (x && x.k === 'm') || x === 'site.penpals' || /^eras\.bay/.test(x)), JSON.stringify(bGot));

// ---------------------------------------------------------------- forged requests from a guest socket: the server must refuse
const forged = await A.evaluate(async ({ bNick, RUN }) => {
  const ws = new WebSocket((location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws');
  const msgs = []; ws.onmessage = e => { try { msgs.push(JSON.parse(e.data)); } catch (x) {} };
  await new Promise(r => { ws.onopen = r; });
  ws.send(JSON.stringify({ t: 'hello', cid: 'forge' + RUN }));
  await new Promise(r => setTimeout(r, 600));
  const S = o => ws.send(JSON.stringify(o));
  const bId = ((msgs.find(m => m.t === 'online') || {}).online || []).find(o => o.nick === bNick);
  const tag = 'forged' + RUN;
  S({ t: 'fNew', board: 'general', title: tag, body: tag });
  S({ t: 'saveProfile', p: { bio: tag } });
  S({ t: 'shout', name: bNick, text: tag });
  S({ t: 'score', g: 'snake', n: 'FRG', s: 3 });
  S({ t: 'kvPush', k: 'site.penpals', text: tag });
  S({ t: 'kvPush', k: 'eras.bay.pogs', text: '9|500' });
  S({ t: 'kvPush', k: 'eras.bay.sell', text: tag });
  S({ t: 'kvPut', k: 'ss.rt.forgetest', f: 'abc', v: '5' });
  S({ t: 'kvPush', k: 'social.bottles', text: tag });
  S({ t: 'kvPut', k: 'social.irctopic', f: 'orks', v: 'x|' + tag });
  if (bId) { S({ t: 'relay', to: bId.id, ch: 'social.im', d: { k: 'm', t: tag } }); S({ t: 'relay', to: bId.id, ch: 'social.irc', d: { k: 'm', c: '#orks', t: tag } }); }
  S({ t: 'pmSend', to: bNick, kind: 'msg', text: tag });
  S({ t: 'ecBuy', id: 'misc.goldtoof' }); S({ t: 'ecClaim', i: 3 }); S({ t: 'ecTicket', n: [1, 2, 3, 4, 5, 6] });
  S({ t: 'kvGet', k: ['site.penpals', 'eras.bay.pogs', 'eras.bay.sell', 'ss.rt.forgetest', 'social.bottles', 'social.irctopic'], rid: 77 });
  S({ t: 'fTopics', board: 'general' });
  await new Promise(r => setTimeout(r, 1500));
  ws.close();
  const kv = (msgs.find(m => m.t === 'kv' && m.rid === 77) || {}).vals || {};
  const has = v => JSON.stringify(v || '').includes(tag);
  return {
    bOnline: !!bId,
    errs: msgs.filter(m => m.t === 'err' || m.t === 'pmSent' || (m.t === 'ecErr')).map(m => m.msg || m.err || m.t),
    topic: ((msgs.find(m => m.t === 'fTopics') || {}).list || []).some(t => t.title === tag),
    kvLeak: Object.entries(kv).filter(([k, v]) => has(v) || (k === 'ss.rt.forgetest' && v && v.abc) || (k === 'eras.bay.pogs' && JSON.stringify(v || '').includes('"9|500"'))).map(([k]) => k),
    posted: msgs.some(m => m.t === 'fPosted' || m.t === 'profileSaved' || m.t === 'loginOk'),
    scores: msgs.some(m => m.t === 'scores' && m.list.some(e => e.n === 'FRG')),
  };
}, { bNick, RUN });
results.push('info forged: ' + JSON.stringify(forged));
ok('server refused forged forum topic', !forged.topic);
ok('server refused forged kv writes', forged.kvLeak.length === 0, forged.kvLeak.join(','));
ok('server refused forged profile/post', !forged.posted);
ok('server refused forged score', !forged.scores);
await B.waitForTimeout(600);
const bGot2 = await B.evaluate(() => window.__got);
ok('member B got no forged IM', !bGot2.some(x => x && x.k === 'm'), JSON.stringify(bGot2));

// ---------------------------------------------------------------- the same things as a member: they work
await showBrowser(B);
await B.evaluate(() => IE.go('forums', 'click')); await B.waitForSelector('.fboard', { timeout: 8000 });
await B.evaluate(() => document.querySelector('.fboard').click()); await B.waitForSelector('[data-fnewtopic]');
await clk(B, '[data-fnewtopic]'); await B.waitForSelector('#fnew', { timeout: 5000 });
ok('member: no box for New Topic', !(await box(B)));
await B.fill('#fnew input', 'member topic ' + RUN); await B.fill('#fnew textarea', 'hello ' + RUN);
const posted = B.waitForEvent('websocket').catch(() => {});
await B.evaluate(() => { window.__posted = false; Net.on('fPosted', () => { window.__posted = true; }); document.getElementById('fnew').requestSubmit(); });
await B.waitForTimeout(1500);
ok('member: forum topic posted', await B.evaluate(() => window.__posted));
await B.evaluate(() => { window.__kv = []; Net.kv.watch('site.penpals', e => window.__kv.push(e)); Net.kv.watch('ss.rt.membertest', e => window.__kv.push(e)); });
await B.evaluate(r => Net.kv.push('site.penpals', 'member pen pal ' + r), RUN);
await B.evaluate(() => Net.kv.put('ss.rt.membertest', 'me', '4'));
await B.waitForTimeout(800);
ok('member: kv members-only writes go through', (await B.evaluate(() => window.__kv.length)) >= 2);
await B.evaluate(() => { window.__sc = null; Net.on('scores', m => { window.__sc = m; }); Net.send({ t: 'score', g: 'snake', n: 'MEM', s: 99999 }); });
await B.waitForTimeout(800);
ok('member: score accepted', await B.evaluate(() => !!(window.__sc && window.__sc.list.some(e => e.n === 'MEM'))));
// member sends IM to the guest: arrives
await A.evaluate(() => { window.__im = []; Net.onRelay('social.im', d => window.__im.push(d)); });
await B.evaluate(n => UhOh.message(n), aNick); await B.waitForTimeout(800);
await B.evaluate(() => { const ta = [...document.querySelectorAll('.so-imta')].pop(); ta.value = 'hi guest'; ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
await B.waitForTimeout(1000);
ok('member: Uh-Oh! message delivered', await A.evaluate(() => window.__im.some(d => d.k === 'm')));
ok('member: no members-only box ever', !(await box(B)));
// Guest.need runs straight away for a member
ok('member: Guest.need runs then()', await B.evaluate(() => { let ran = false; const r = Guest.need('x', () => { ran = true; }); return r && ran; }));

// ---------------------------------------------------------------- joining from the members-only box carries on with what you were doing
await closeBox(A);
await A.evaluate(() => IE.go('forums', 'click')); await A.waitForTimeout(800);
await A.evaluate(() => document.querySelector('.fboard').click()); await A.waitForSelector('[data-fnewtopic]');
await clk(A, '[data-fnewtopic]'); await A.waitForTimeout(600);
await clk(A, '.gst-win [data-j]'); await A.waitForSelector('#jlUser', { timeout: 5000 });
await A.screenshot({ path: `${OUT}/a-join-logon.png` });
await A.fill('#jlUser', 'gj' + RUN); await A.fill('#jlPass', PW); await A.press('#jlPass', 'Enter');
await A.waitForFunction(() => Net.me.member, null, { timeout: 10000 }).catch(() => {});
await A.waitForTimeout(1500);
ok('joined from the box: now a member', await A.evaluate(() => Net.me.member));
ok('joined from the box: New Topic form opened', await A.evaluate(() => !!document.getElementById('fnew')));
ok('secret gst.join found', await A.evaluate(() => !!Apps.found['gst.join']));
ok('Start menu label follows the new name', await A.evaluate(() => document.getElementById('smLogoffLbl').textContent === `Log Off ${Net.me.nick}...`));
await A.screenshot({ path: `${OUT}/a-after-join.png` });

fs.writeFileSync(`${OUT}/results.txt`, results.join('\n') + '\n\nERRORS\n' + errors.join('\n'));
console.log(results.join('\n')); console.log('errors', errors.length); errors.slice(0, 20).forEach(e => console.log(e));
await browser.close();

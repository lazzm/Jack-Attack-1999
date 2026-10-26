/* Run ONLY against the main agent's disposable localhost server. Does not start a server.
 * Bounded invocation: cd tests && timeout 240s node sms-private-browser.mjs http://localhost:18479
 * Creates two dummy accounts; writes only their private numbers, contacts and SMS.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { roomFixture } from './room-fixture.mjs';
const WebSocket = createRequire(import.meta.url)('../app/node_modules/ws');
const base = process.argv[2] || 'http://localhost:18479';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Disposable localhost only');
const run = Date.now().toString(36), name = 'Phone' + run, peerName = 'Mate' + run, pass = 'Temporary-1999';
const clients = [];
async function socket(token = '') {
  const ws = new WebSocket(base.replace(/^http/, 'ws') + '/ws', { origin: base }), messages = [];
  clients.push(ws); ws.on('message', d => messages.push(JSON.parse(d)));
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  const send = m => ws.send(JSON.stringify(m));
  async function get(t, predicate = () => true) {
    for (let i = 0; i < 200; i++) { const j = messages.findIndex(m => m.t === t && predicate(m)); if (j >= 0) return messages.splice(j, 1)[0]; await new Promise(r => setTimeout(r, 25)); }
    throw Error('Missing packet ' + t);
  }
  send({ t: 'hello', cid: 'phone-test-' + Math.random(), token }); await get('welcome');
  return { ws, messages, send, get };
}
const { browser, page, errors, until } = await roomFixture(base, { account: name, password: pass });
try {
  const peer = await socket(), witness = await socket();
  peer.send({ t: 'login', name: peerName, pass, signup: true }); const peerLogin = await peer.get('loginOk');
  peer.send({ t: 'smsPhoneGet', ref: 'peer' }); const peerPhone = await peer.get('smsPhone');
  assert.match(peerPhone.number, /^1999\d{16}$/);
  await page.evaluate(async () => {
    window.smsAudit = [];
    for (const t of ['smsPhone', 'smsContactResult', 'smsNew', 'smsSent', 'smsDelivered', 'online', 'members']) Net.on(t, m => smsAudit.push(m));
    await Apps.load('js/family-phone.js');
    HouseMobile.use();
  });
  await until(() => FamilyPhone.isOpen() && smsAudit.some(m => m.t === 'smsPhone' && m.ok));
  const ownPhone = await page.evaluate(() => smsAudit.find(m => m.t === 'smsPhone' && m.ok));
  assert.match(ownPhone.number, /^1999\d{16}$/); assert.notEqual(ownPhone.number, peerPhone.number);
  const press = async (...keys) => page.evaluate(keys => { for (const k of keys) FamilyPhone.press(k); }, keys);
  if (await page.evaluate(() => !!FamilyPhone.state().pop)) await press('sel');
  await press('sel', 'sel', '5');
  assert.equal(await page.evaluate(() => FamilyPhone.state().id), 'myNumber');
  await page.screenshot({ path: 'shots/phone-private-number-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'shots/phone-private-number-narrow.png' });
  await page.setViewportSize({ width: 1366, height: 860 });
  // Manual add, edit and deletion use the handset's real keyboard handler.
  async function typePhone(text) {
    await page.evaluate(text => { const el = document.querySelector('.tb-ph').closest('.win') || document.querySelector('.tb-ph').parentElement; for (const key of text) el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); }, text);
  }
  // Focus typing on the phone's actual window rather than intercepting house controls.
  await page.evaluate(() => { document.querySelector('.tb-ph')?.parentElement?.closest('[tabindex]')?.focus(); });
  await press('c', '4', 'sel');
  await typePhone('My friend'); await press('sel'); await typePhone(peerPhone.number); await press('sel');
  await until(() => smsAudit.some(m => m.t === 'smsContactResult' && m.ok && m.contacts.some(c => c.name === 'My friend')));
  await press('sel'); await press('down', 'sel', 'down', 'down', 'sel');
  await typePhone('!'); await press('sel', 'sel');
  await until(() => smsAudit.some(m => m.t === 'smsContactResult' && m.ok && m.contacts.some(c => c.name === 'My friend!')));
  await press('sel');
  await page.screenshot({ path: 'shots/phone-private-phonebook-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'shots/phone-private-phonebook-narrow.png' });
  await page.setViewportSize({ width: 1366, height: 860 });
  await page.evaluate(() => { window.smsContactCount = smsAudit.filter(m => m.t === 'smsContactResult').length; });
  await press('sel', 'down', 'down', 'down', 'sel', 'down', 'sel');
  await until(() => smsAudit.filter(m => m.t === 'smsContactResult').length > window.smsContactCount);
  assert.deepEqual(await page.evaluate(() => smsAudit.filter(m => m.t === 'smsContactResult' && m.ok).at(-1).contacts), []);
  // No public name or member-number address paths survive.
  for (const to of [name, String((await page.evaluate(() => Net.me.no)))]) {
    peer.send({ t: 'smsSend', to, text: 'discovery must fail', ref: 'deny' }); assert.equal((await peer.get('smsSent')).ok, false);
  }
  peer.send({ t: 'smsSend', to: ownPhone.number, text: 'Private shared-number test', ref: 'private' });
  assert.equal((await peer.get('smsSent')).ok, true);
  await until(() => smsAudit.some(m => m.t === 'smsNew' && m.item.text === 'Private shared-number test'));
  assert.equal(await page.evaluate(() => Family.sms().inbox.find(m => m.text === 'Private shared-number test').fromPhone), peerPhone.number);
  assert(!witness.messages.some(m => m.t === 'smsPhone' || m.t === 'smsNew' || JSON.stringify(m).includes(peerPhone.number) || JSON.stringify(m).includes(ownPhone.number)), 'Unauthenticated observer saw a private number');
  // Restore private number/phonebook on a fresh token socket without allocating another number.
  const resumed = await socket(peerLogin.token); resumed.send({ t: 'smsPhoneGet', ref: 'again' }); assert.equal((await resumed.get('smsPhone')).number, peerPhone.number);
  const states = await page.evaluate(() => ({ standing: House.P.seat, mode: House.mode }));
  await page.keyboard.press('q');
  await until(() => House.mode === 'walk' && !House.focused);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await until(() => AccountGate.allowed && House.live && !document.querySelector('.hs-loading,#houseEntry'));
  assert.equal(await page.evaluate(() => House.P.seat), states.standing);
  assert.equal(await page.evaluate(() => House.mode), 'walk');
  await page.evaluate(async () => { await Apps.load('js/family-phone.js'); window.smsAfterRefresh = null; Net.on('smsPhone', m => { if (m.ok) smsAfterRefresh = m; }); HouseMobile.use(); });
  await until(() => !!window.smsAfterRefresh);
  assert.equal(await page.evaluate(() => smsAfterRefresh.number), ownPhone.number);
  assert.deepEqual(await page.evaluate(() => smsAfterRefresh.contacts), []);
  assert.equal(await page.evaluate(() => Family.sms().inbox.find(m => m.text === 'Private shared-number test').fromPhone), peerPhone.number);
  assert.deepEqual(errors, []);
  console.log('PRIVATE PHONE BROWSER PASS: My number and manual phonebook desktop/narrow screenshots; add/edit/delete, private SMS, name/member rejection, observer isolation, token stability, standing refresh and reply receipts.');
} finally { for (const ws of clients) ws.terminate(); await browser.close(); }

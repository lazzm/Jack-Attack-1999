// Production carry, shelf eligibility and bin contents on disposable data; no live target accepted.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, rm} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const root = fileURLToPath(new URL('../', import.meta.url)), shots = root + 'tests/shots/carry-arms/';
const data = await mkdtemp('/tmp/jhp-carry-arms-');
const port = await new Promise(resolve => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => resolve(p)); }); });
let log = '', f;
const server = spawn(process.execPath, ['server.js'], {cwd: root + 'app', env: {...process.env, PORT: String(port), DATA_DIR: data, ADMIN_TOKEN: 'testtoken'}, stdio: ['ignore', 'pipe', 'pipe']});
for (const stream of [server.stdout, server.stderr]) stream.on('data', d => log += d);
async function stop() { await f?.browser.close(); if (server.exitCode === null) { server.kill(); await new Promise(resolve => server.once('exit', resolve)); } await rm(data, {recursive: true, force: true}); }
const timer = setTimeout(() => void stop().finally(() => process.exit(1)), 900000);
try {
  await mkdir(shots, {recursive: true});
  const base = 'http://localhost:' + port;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r => setTimeout(r, 150)); }
  const account = 'Carry' + Date.now().toString(36), password = 'Throwaway-1999';
  assert((await fetch(base + '/admin/register', {method: 'POST', headers: {'x-admin-token': 'testtoken', 'content-type': 'application/json'}, body: JSON.stringify({name: account, pass: password})})).ok);
  f = await roomFixture(base, {account, password, signup: false, touch: true});
  const {page, until, view, errors} = f;
  await page.evaluate(async () => { await Room.ensureHouse(); await Chores.load(); await Chores.part('bedroom'); HouseFamily?.debug.hide(true); });
  await until(() => !!House.THINGS['ch.binbag']);
  await page.evaluate(() => { for (const t of Object.values(House.THINGS)) if (t.id.startsWith('ch.m.')) { t.at.hide = true; House.place(t); } });
  assert(!await page.evaluate(() => House.grab('ch.binbag')), 'An untied bag came out of the bin');
  const touch = await page.context().newCDPSession(page);
  const shot = name => page.screenshot({path: shots + name + '.png'});
  const aim = async (eye, target, lvl = 'U') => { await view(eye, target, {level: lvl}); await page.evaluate(() => House._.setMode('walk')); await page.waitForTimeout(500); };
  const filledCase = await page.evaluate(() => Object.values(House.THINGS).find(t => t.kind === 'console-case' && !t.at.hide)?.id);
  assert(filledCase, 'Fixture has no real game case');
  for (const id of [filledCase, 'mug', 'bin']) {
    await aim([30, -55, 150], [30, -55, -30]);
    assert(await page.evaluate(id => { const t = House.THINGS[id]; window.__real = t.obj; window.__scale = t.obj.scale.clone(); return House.grab(id); }, id));
    await page.waitForTimeout(1700);
    assert(await page.evaluate(id => { const t = House.THINGS[id]; return t.obj === window.__real && t.obj.scale.distanceTo(window.__scale) < .00001; }, id), id + ' changed model or physical scale');
    assert(await page.evaluate(() => [...document.querySelectorAll('.st-marker[data-state="edge"] .st-marker-label')].every(el => getComputedStyle(el).display === 'none')), 'An off-screen label is painted over the held item');
    await shot('hold-' + id.replaceAll('.', '-'));
    for (const [width, height] of [[390, 844], [844, 390], [768, 1024], [1024, 768]]) {
      await page.setViewportSize({width, height});
      if (!await page.evaluate(() => GameInput.touch)) {
        await touch.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{id: 1, x: 70, y: height - 150}]});
        await touch.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{id: 1, x: 70, y: height - 185}]});
        await page.waitForTimeout(100);
        await touch.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
      }
      await page.waitForTimeout(700);
      assert.equal(await page.evaluate(() => House.held()), id, 'Input/rotation dropped the held object');
      assert(!await page.evaluate(() => !!document.querySelector('.ht-coach:not(.bye)')), 'Delayed tutorial covers a held object');
      assert(await page.evaluate(() => __real.scale.distanceTo(__scale) < .00001), 'Resize changed held size');
      assert(await page.evaluate(() => { const r = document.querySelector('.hs-hold').getBoundingClientRect(); return r.bottom < innerHeight / 2; }), 'Touch caption covers the held object');
      await shot(`hold-${id.replaceAll('.', '-')}-${width}x${height}`);
    }
    await page.setViewportSize({width: 1366, height: 860});
    if (id === 'bin') {
      const state = await page.evaluate(() => { const H = House, b = H.THINGS['ch.binbag'], t = H.THINGS.bin; return {attached: b.obj.parent === t.obj, body: H.physics.body(b.id).active, scale: t.obj.scale.x, targets: H.root.getObjectByName('accepting-slot-glows')?.visible}; });
      assert(state.attached && !state.body, 'Bin contents detached or have a competing body: ' + JSON.stringify(state));
      assert(!state.targets, 'A bin lights game slots');
    }
    await page.keyboard.press('q'); await until(() => !House.held()); await page.waitForTimeout(800);
  }
  const rack = await page.evaluate(id => House.THINGS[id].home, filledCase);
  await aim([-220, -55, 35], [rack.x, rack.y - 6, -36]);
  // Shelf availability is independent of where the crosshair currently points. The glow is a shallow shelf light.
  assert(await page.evaluate(id => House.grab(id), filledCase)); await page.waitForTimeout(700);
  const shelf = await page.evaluate(id => { const H = House, t = H.THINGS[id], slots = Object.values(H.SNAPS).filter(s => s.id.startsWith('media.slot.') && s.accepts(t.kind, t)); return {count: slots.length, shallow: slots.every(s => s.box[1] < 1), glow: H.root.getObjectByName('accepting-slot-glows')?.visible}; }, filledCase);
  assert(shelf.count > 0 && shelf.shallow && shelf.glow, 'Eligible shelf slots must glow without fake boxes: ' + JSON.stringify(shelf));
  await shot('accepting-shelf-slots');
  assert(await page.evaluate(() => { House.putBack(); House.grab('bin'); return !House.root.getObjectByName('accepting-slot-glows')?.visible; }), 'Rapid case-to-bin switch retained game-slot previews');
  await page.waitForTimeout(500);
  assert(!await page.evaluate(() => House.root.getObjectByName('accepting-slot-glows')?.visible), 'Bin still lights game slots after a frame');
  await page.keyboard.press('q'); await until(() => !House.held()); await page.waitForTimeout(700);
  // Move the complete bin, save, and refresh. Its bag and note stay with it; then the tied bag can be removed alone.
  await page.evaluate(() => { const t = House.THINGS.bin; t.at = {room: 'bedroom', x: 80, y: 73, z: 190, ry: 45}; House.place(t); House.emit('rest', 'bin'); House.saveThings(true); House.saveWalkState(); });
  await page.waitForTimeout(1000); await aim([0, -55, 220], [80, 40, 190]); await shot('bin-moved');
  await page.reload({waitUntil: 'domcontentloaded'});
  await until(() => AccountGate.allowed && House.live && !!House.THINGS['ch.binbag'] && !document.querySelector('.hs-loading,#houseEntry'));
  assert(await page.evaluate(() => { const b = House.THINGS.bin, bag = House.THINGS['ch.binbag']; return Math.abs(b.at.x - 80) < 2 && bag.obj.parent === b.obj; }), 'Bin or contents changed on refresh');
  await shot('bin-refreshed');
  // Tie through the actual chore interaction; finish its animation, take the real bag, and return it.
  await page.evaluate(() => House.act('ch.binbag')); await until(() => ChoreKit.has('bin', 'tie'));
  assert(await page.evaluate(() => House.grab('ch.binbag'))); await page.waitForTimeout(900);
  assert(await page.evaluate(() => House.THINGS['ch.binbag'].obj.parent !== House.THINGS.bin.obj && House.held() === 'ch.binbag'), 'Tied bag did not detach');
  await shot('bag-removed'); await page.keyboard.press('q'); await until(() => !House.held()); await page.waitForTimeout(900);
  assert(await page.evaluate(() => House.THINGS['ch.binbag'].obj.parent === House.THINGS.bin.obj), 'Returned bag did not go back into the moved bin');
  await shot('bag-returned');
  assert(await page.evaluate(() => House.grab('ch.binbag'))); await page.waitForTimeout(500);
  await page.reload({waitUntil: 'domcontentloaded'});
  await until(() => AccountGate.allowed && House.live && !!House.THINGS['ch.binbag'] && !document.querySelector('.hs-loading,#houseEntry'));
  assert(await page.evaluate(() => House.THINGS['ch.binbag'].obj.parent === House.THINGS.bin.obj && !House.held()), 'Refresh while holding the bag did not return it to its bin');
  console.log('Bag refresh state', await page.evaluate(() => { const t = House.THINGS['ch.binbag']; return {st: t.st, at: t.at, front: t.front, visible: t.obj.visible, layer: t.obj.layers.mask, children: t.obj.children.map(c => ({visible:c.visible,layer:c.layers.mask})), tie:ChoreKit.has('bin','tie'), gone:ChoreKit.has('bin','bag')}; }));
  assert(await page.evaluate(() => { const b = House.THINGS['ch.binbag'], bin = House.THINGS.bin; return b.obj.visible && b.obj.layers.mask === (b.front ? 2 : 1) && Math.abs(bin.at.x - 80) < 2; }), 'Bag return/refresh hid its mesh or shoved the bin');
  await shot('bag-carried-refresh'); assert.deepEqual(errors, []); assert(!/mod failed to load/i.test(log));
  console.log('PASS carry-arms: real models/scales, resize, eligible shallow glows, bin attachments, refresh, tie/remove/return; no browser errors');
} finally { clearTimeout(timer); await stop(); }

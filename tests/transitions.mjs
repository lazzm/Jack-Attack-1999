// Transitions regression: every "enter/leave something" moment forward, back, interrupted midway and refreshed
// midway, captured as slow-motion frame sequences with per-frame camera/handheld traces.
//   node transitions.mjs                 starts its own throwaway server (free port), disposable data under /tmp
//   node transitions.mjs http://localhost:PORT [--tag=before]   uses a running throwaway server
// Writes tests/shots/transitions/<tag>/<scenario>-sheet.jpg (+ a few full frames) and timing.json.
// Asserts: no camera path through geometry, no black frames, no pops (velocity spikes) in camera or Game Lad,
// queued inputs applied, exact return poses, timing within targets, no console errors.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
import {insertCase} from './case-actions.mjs';
import {installSlowmo, slowmo, startTrace, stopTrace, captureFrames, contactSheet, saveFrames, analyse, motion} from './transition-kit.mjs';

const args = process.argv.slice(2), tag = args.find(a => a.startsWith('--tag='))?.slice(6) || 'after';
const only = args.find(a => a.startsWith('--only='))?.slice(7)?.split(',');
const SLOW = +process.env.SLOW || 0.04; // game time runs 25x slower while capturing
const root = fileURLToPath(new URL('../', import.meta.url)), shots = fileURLToPath(new URL(`shots/transitions/${tag}/`, import.meta.url));
let base = args.find(a => /^https?:/.test(a)), server, data;
async function freePort() { return new Promise((res, rej) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); s.on('error', rej); }); }
if (!base) {
  const port = await freePort(); data = await mkdtemp(os.tmpdir() + '/jhp-transitions-');
  server = spawn(process.execPath, ['server.js'], { cwd: root + 'app', env: { ...process.env, PORT: String(port), DATA_DIR: data, ADMIN_TOKEN: 'testtoken' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; server.stdout.on('data', d => log += d); server.stderr.on('data', d => log += d);
  for (let i = 0; i < 100 && !/online at/.test(log); i++) await new Promise(r => setTimeout(r, 200));
  if (/mod failed to load/.test(log)) throw Error('server: mod failed to load');
  base = `http://localhost:${port}`;
}
async function cleanup() { if (server && server.exitCode === null) server.kill('SIGTERM'); if (data) await rm(data, { recursive: true, force: true }); }
process.once('SIGINT', async () => { await cleanup(); process.exit(1); });

const account = 'Trans' + Date.now().toString(36), password = 'Throwaway-1999';
const reg = await fetch(base + '/admin/register', { method: 'POST', headers: { 'X-Admin-Token': 'testtoken', 'Content-Type': 'application/json' }, body: JSON.stringify({ name: account, pass: password }) });
assert(reg.ok, 'admin register ' + reg.status);
await mkdir(shots, { recursive: true });
const fx = await roomFixture(base, { account, password, signup: false, width: 1100, height: 700, onPage: installSlowmo });
const { page: p, browser, errors, until } = fx;
p.setDefaultTimeout(60000);
const results = [], timing = {};
const GB_PROBE = `()=>{const t=House.THINGS.gb,o=t.obj;return{gx:o.position.x,gy:o.position.y,gz:o.position.z,gst:t.st,zm:House.P.zm||1,tv:!!window.RoomTV?.open_,lock:!!window.RoomTV?.lockIn?.(),full:!!document.querySelector('.rm-tvv.rm-lockin'),moving:document.documentElement.classList.contains('hs-moving'),tools:window.__trace.vis('.rm-tvv .rm-tools')}}`;

async function settle() { await until(() => !House.gliding && !House.motion?.moving && ['walk', 'focus', 'monitor', 'inspect'].includes(House.mode)); await p.waitForTimeout(250); }
async function aimAt(target, from, spot) {
  await fx.view(from, target); await p.evaluate(() => House._.setMode('walk')); await p.waitForTimeout(400);
  // the eye eases up to the standing height from wherever the view put it: let it get there before anything is picked up
  for (let i = 0, y = NaN; i < 40; i++) { const ny = await p.evaluate(() => House.P.y); if (Math.abs(ny - y) < 0.02) break; y = ny; await p.waitForTimeout(150); }
  // the walk may nudge the eye clear of furniture: re-aim from where it actually ended up
  // (and wait for the eye height to settle, so the crosshair really is on the target before F)
  for (let i = 0; i < 8; i++) {
    await p.evaluate(([tx, ty, tz]) => { const P = House.P; P.rx = Math.atan2(-(ty - P.y), Math.hypot(tx - P.x, tz - P.z)) * 180 / Math.PI; P.ry = Math.atan2(tx - P.x, -(tz - P.z)) * 180 / Math.PI; House.dirty(); }, target);
    await p.waitForTimeout(450);
    if (!spot) return;
    if (await p.evaluate(id => House.pick(innerWidth / 2, innerHeight / 2)?.spot === id, spot)) return;
  }
  throw Error('could not aim at ' + spot);
}
async function gbWorld() { return p.evaluate(() => { const o = House.THINGS.gb.obj; return [o.position.x, o.position.y, o.position.z]; }); }
const worldOf = id => p.evaluate(id => { const v = new House.T.Vector3(); House.THINGS[id].obj.getWorldPosition(v); return [v.x, -v.y, v.z]; }, id);
async function aimGB() { const [x, y, z] = await worldOf('gb'); await aimAt([x, y - 1.5, z], [x + 5, y - 45, z + 55], 'gb'); }
const pose = () => p.evaluate(() => ({ x: House.P.x, y: House.P.y, z: House.P.z, rx: House.P.rx, ry: House.P.ry, zm: House.P.zm || 1 }));

// Camera segments between consecutive frames must not cross any visible room surface.
async function throughGeometry(frames) {
  return p.evaluate(fr => {
    const T = House.T, ray = new T.Raycaster(), a = new T.Vector3(), b = new T.Vector3(), hits = [];
    const ok = o => { for (let x = o; x; x = x.parent) { if (!x.visible || x.userData?.thing || x.userData?.noPick) return false; } return true; };
    const roots = Object.values(House.ROOMS).map(r => r.group).filter(g => g.visible);
    for (let i = 1; i < fr.length; i++) {
      a.set(fr[i - 1].x, -fr[i - 1].y, fr[i - 1].z); b.set(fr[i].x, -fr[i].y, fr[i].z); const len = a.distanceTo(b); if (len < 0.05) continue;
      ray.set(a, b.clone().sub(a).normalize()); ray.far = len;
      const h = ray.intersectObjects(roots, true).find(h => ok(h.object) && h.object.isMesh && !h.object.material?.transparent);
      if (h) hits.push({ i, t: fr[i].t, obj: h.object.name || h.object.type, d: h.distance });
    }
    return hits;
  }, frames.map(f => ({ t: f.t, x: f.x, y: f.y, z: f.z })));
}
// Pops: a frame whose speed spikes against both neighbours, or a dead stop from speed. Speeds in cm (or deg) per 16.7 ms.
function popsIn(tr, keys, label, { floor = 1.2 } = {}) {
  const fr = tr.filter((f, i) => i === 0 || f.t - tr[i - 1].t > 0.4);
  const steps = motion(fr, { fields: keys.pos || [], angles: keys.ang || [] }).map(s => ({ t: s.t, v: Math.max(s.v, s.w) * 16.7 }));
  const bad = [];
  for (let i = 1; i < steps.length - 1; i++) {
    const v = steps[i].v, n = Math.max(steps[i - 1].v, steps[i + 1].v);
    if (v > floor && v > 2.6 * n + 0.4) bad.push({ label, t: Math.round(steps[i].t), v: +v.toFixed(2), neigh: +n.toFixed(2) });
    const pv = steps[i - 1].v; if (pv > 2.5 && v < pv * 0.15 && steps[i + 1].v < pv * 0.15) bad.push({ label, t: Math.round(steps[i].t), stop: +pv.toFixed(2) });
  }
  return { bad, peak: Math.max(0, ...steps.map(s => s.v)) };
}
function moveSpan(tr, keys) { // first and last frame in which anything moved
  let a = null, b = null;
  for (let i = 1; i < tr.length; i++) { const d = Math.max(...keys.map(k => Math.abs((tr[i][k] ?? 0) - (tr[i - 1][k] ?? 0)))); if (d > 0.03 && tr[i].t >= 0) { if (a == null) a = Math.max(0, tr[i - 1].t); b = tr[i].t; } }
  return a == null ? 0 : b - a;
}
async function capture(name, act, { ms = 1400, regions = {}, black = true, target, probe = GB_PROBE, after } = {}) {
  await startTrace(p, probe);
  await slowmo(p, SLOW);
  const t0 = await p.evaluate(() => performance.now());
  await act();
  const frames = await captureFrames(p, ms, { quality: 72 });
  await slowmo(p, 1);
  if (after) await after();
  const tr = await stopTrace(p);
  for (const f of tr.frames) f.t -= t0;
  for (const e of tr.events) e.t -= t0;
  const tEnd = frames.at(-1)?.t ?? ms; tr.frames = tr.frames.filter(f => f.t <= tEnd + 20);
  const pick = frames.filter((_, i) => i % Math.max(1, Math.ceil(frames.length / 40)) === 0);
  await contactSheet(browser, pick, `${shots}${name}-sheet.jpg`, { label: `${name} (${tag}) - ${frames.length} frames over ${Math.round(frames.at(-1)?.t || 0)} ms game time` });
  await saveFrames(frames.filter((_, i) => i % Math.max(1, Math.ceil(frames.length / 8)) === 0), `${shots}${name}`);
  const lockedHandheld = name.startsWith('gb-lock');
  // Native 10:9 plus its controller legitimately leaves dark fullscreen margins.
  // The central LCD remains lit throughout this stationary grow/shrink. Also
  // sample bare purple casing below it after the room fade: an opaque extra
  // bezel rectangle must never cover the physical controls during the shrink.
  const stats = await analyse(browser, frames, { regions:{...regions,...(lockedHandheld?{lcd:[.45,.30,.55,.44],casing:[.49,.73,.51,.76]}:{})} });
  const blackFrames = black ? stats.map((s, i) => ({ i, t: Math.round(frames[i].t), mean: s.mean, black: s.black, lcd:s.reg.lcd?.mean,casing:s.reg.casing?.mean })).filter(s => s.mean < 9 || s.black > 0.7 && (!lockedHandheld || s.lcd < 18) || name==='gb-lockout'&&s.t>=200&&s.t<=450&&s.casing<8) : [];
  await writeFile(`${shots}${name}-trace.json`, JSON.stringify(tr.frames)); // (per-frame camera/handheld trace, for diagnosing a failure)
  const cam = popsIn(tr.frames, { pos: ['x', 'y', 'z'], ang: ['rx', 'ry'] }, 'camera');
  const gb = popsIn(tr.frames.filter(f => f.gx != null), { pos: ['gx', 'gy', 'gz'] }, 'gamelad');
  const geo = await throughGeometry(tr.frames);
  const span = moveSpan(tr.frames, ['x', 'y', 'z', 'rx', 'ry', 'gx', 'gy', 'gz']);
  const out = { name, frames: frames.length, traced: tr.frames.length, span: Math.round(span), target, blackFrames, pops: [...cam.bad, ...gb.bad], peak: { camera: +cam.peak.toFixed(2), gamelad: +gb.peak.toFixed(2) }, geometry: geo, events: tr.events.filter(e => e.type !== 'keydown' || true).map(e => ({ t: Math.round(e.t), type: e.type, key: e.key, name: e.name })), trace: tr.frames, stats };
  timing[name] = { span: out.span, target, frames: out.frames, peakCam: out.peak.camera, peakGB: out.peak.gamelad, pops: out.pops.length, black: blackFrames.length, geometry: geo.length };
  console.log(`  ${name}: ${frames.length} frames, motion ${out.span} ms (target ${target ?? '-'}), pops ${out.pops.length}, black ${blackFrames.length}, through-geometry ${geo.length}`);
  return out;
}
function clean(out, { pops = true } = {}) {
  assert.deepEqual(out.blackFrames, [], out.name + ': black frames');
  assert.deepEqual(out.geometry, [], out.name + ': camera passed through geometry');
  if (pops) assert.deepEqual(out.pops, [], out.name + ': pops');
  if (out.target) assert(out.span <= out.target, `${out.name}: took ${out.span} ms, target ${out.target}`);
}
const near = (a, b, e, what) => { for (const k of ['x', 'y', 'z', 'rx', 'ry']) assert(Math.abs(a[k] - b[k]) < e, `${what}: ${k} ${a[k]} vs ${b[k]}`); };
async function scenario(name, fn) {
  if (only && !only.some(o => name.startsWith(o))) return;
  const t = Date.now();
  try { await fn(); results.push([name, true]); console.log(`PASS ${name} (${Math.round((Date.now() - t) / 1000)} s)`); }
  catch (e) { results.push([name, false]); console.log(`FAIL ${name}: ${String(e.message).slice(0, 400)}`); await p.screenshot({ path: `${shots}${name}-FAIL.jpg`, type: 'jpeg' }).catch(() => {}); await p.keyboard.press('Escape').catch(() => {}); await p.evaluate(() => { HousePause?.close?.(); if (window.RoomTV?.open_) RoomTV.close(true); if (House.focused) House.unfocus(true); }).catch(() => {}); await p.waitForTimeout(1500); }
}
const GBREG = { centre: [.38, .3, .62, .7] };
const hasMotion = await p.evaluate(() => !!House.motion);

try {
  await insertCase(fx,'media.box.gb.blocks','console.gb');
  await until(()=>RoomTV?._dbg()?.st==='game'&&!House.gliding&&!HouseCases.busy);
  await p.keyboard.press('q');await until(()=>!RoomTV.open_&&!House.gliding&&House.mode==='walk');
  await p.evaluate(() => { Sound.effectsOn = true; });
  await scenario('gb-desk', async () => {
    await aimGB(); const start = await pose(), home = await p.evaluate(() => ({ ...House.THINGS.gb.at }));
    const enter = await capture('gb-desk-enter', () => p.keyboard.press('f'), { ms: 1300, target: 1000, regions: GBREG });
    await until(() => RoomTV?.open_ && House.mode === 'focus'); await settle();
    clean(enter);
    // the screen is up and lit by the time the controls arrive
    const lastStats = enter.stats.at(-1).reg.centre; assert(lastStats.mean > 25, 'Game Lad screen dark after arriving: ' + lastStats.mean);
    if (hasMotion) { const s = enter.trace.find(f => f.tv), settleT = enter.trace.find(f => !f.moving && f.t > 50)?.t; assert(s && settleT && s.t <= settleT, 'screen should power on before the camera settles'); }
    const lock = await capture('gb-lockin', () => p.keyboard.press('t'), { ms: 650, target: hasMotion ? 500 : undefined });
    assert(await p.evaluate(() => RoomTV.lockIn()), 'LOCK IN on'); clean(lock);
    const unlock = await capture('gb-lockout', () => p.keyboard.press('t'), { ms: 650 });
    assert(!await p.evaluate(() => RoomTV.lockIn()), 'LOCK IN off'); clean(unlock);
    await p.waitForTimeout(300);
    const back = await capture('gb-desk-back', () => p.keyboard.press('q'), { ms: 1300, target: 1000, regions: GBREG });
    await until(() => House.mode === 'walk' && House.THINGS.gb.st === 'rest'); await settle();
    clean(back);
    near(await pose(), start, 0.6, 'camera returns to where it started');
    const at = await p.evaluate(() => House.THINGS.gb.at); for (const k of ['x', 'y', 'z']) assert(Math.abs(at[k] - home[k]) < 0.05, 'Game Lad home ' + k);
    Object.assign(timing['gb-desk-enter'], { sounds: enter.events.filter(e => e.type === 'sound').map(e => `${e.t}:${e.name}`) });
  });
  await scenario('gb-interrupt', async () => {
    await aimGB(); const start = await pose(), home = await p.evaluate(() => ({ ...House.THINGS.gb.at }));
    const out = await capture('gb-interrupt', async () => { await p.keyboard.press("f"); await p.waitForTimeout(Math.round(0.32 / SLOW * 1000)); await p.keyboard.press("q"); }, { ms: 1500 });
    await until(() => House.mode === 'walk' && House.THINGS.gb.st === 'rest'); await settle();
    clean(out); near(await pose(), start, 0.6, 'interrupted raise returns to start');
    const at = await p.evaluate(() => House.THINGS.gb.at); for (const k of ['x', 'y', 'z']) assert(Math.abs(at[k] - home[k]) < 0.05, 'Game Lad home after interrupt ' + k);
    assert(!await p.evaluate(() => RoomTV?.open_), 'no console view left open');
  });
  await scenario('gb-queued-lock', async () => {
    await aimGB();
    await p.keyboard.press('f'); await p.waitForTimeout(150); await p.keyboard.press('t');
    await until(() => window.RoomTV?.open_ && House.mode === 'focus');
    await p.waitForTimeout(900);
    assert(await p.evaluate(() => RoomTV.lockIn()), 'T pressed during the raise must LOCK IN once the screen is up');
    // Q straight out of LOCK IN: the screen shrinks back into the glass first, then the camera leans out
    const out = await capture('gb-lock-q', () => p.keyboard.press('q'), { ms: 1500 });
    await until(() => House.mode === 'walk' && House.THINGS.gb.st === 'rest'); await settle(); clean(out);
    const shrinkEnd = out.trace.find(f => !f.full)?.t ?? 0, camStart = out.trace.find(f => Math.abs(f.rx - out.trace[0].rx) > 0.05)?.t ?? 1e9;
    assert(camStart >= shrinkEnd, `camera moved (${camStart} ms) before LOCK IN had shrunk back (${shrinkEnd} ms)`);
  });
  await scenario('gb-held', async () => {
    await aimGB(); await p.keyboard.press('e'); await until(() => House.held() === 'gb'); await p.waitForTimeout(900);
    const handRel = await p.evaluate(() => { const o = House.THINGS.gb.obj.position, P = House.P; return [o.x - P.x, o.y - P.y, o.z - P.z]; });
    const enter = await capture('gb-held-enter', () => p.keyboard.press('f'), { ms: 1300, target: 1000 });
    await until(() => RoomTV?.open_ && House.mode === 'focus'); await settle(); clean(enter);
    const back = await capture('gb-held-back', () => p.keyboard.press('q'), { ms: 1300, target: 1000 });
    await until(() => House.mode === 'walk' && House.held() === 'gb'); await settle(); clean(back);
    const rel = await p.evaluate(() => { const o = House.THINGS.gb.obj.position, P = House.P; return [o.x - P.x, o.y - P.y, o.z - P.z]; });
    assert(Math.hypot(...rel.map((v, i) => v - handRel[i])) < 3, 'Game Lad back in the hand pose: ' + JSON.stringify([rel, handRel]));
    await p.keyboard.press('q'); await until(() => !House.held() && House.THINGS.gb.st === 'rest'); await settle();
  });
  await scenario('gb-refresh-mid', async () => {
    await aimGB(); await p.keyboard.press('f'); await p.waitForTimeout(330);
    await p.reload({ waitUntil: 'domcontentloaded' });
    await until(() => window.AccountGate?.allowed && window.House?.live && !document.querySelector('.hs-loading,#houseEntry'));
    await p.waitForTimeout(2500); await settle();
    const st = await p.evaluate(() => ({ mode: House.mode, gb: House.THINGS.gb.st, tv: !!window.RoomTV?.open_ }));
    assert(['walk', 'focus', 'monitor'].includes(st.mode) && ['rest', 'play'].includes(st.gb), 'state after refresh mid-raise ' + JSON.stringify(st));
    const shot = await p.screenshot({ type: 'jpeg' }); const [s] = await analyse(browser, [{ buf: shot }]); assert(s.mean > 12, 'black after refresh');
    await p.screenshot({ path: `${shots}gb-refresh-mid.jpg`, type: 'jpeg' });
    if (st.tv || st.mode === 'focus') { await p.keyboard.press('q'); await until(() => House.mode === 'walk'); await settle(); }
  });
  await scenario('inspect', async () => {
    const [x, y, z] = await worldOf('cube');
    let aimed = false;
    for (const [dx, dy, dz] of [[0, -42, 45], [-25, -45, 50], [40, -50, 60], [10, -35, 35]]) { try { await aimAt([x, y - 3, z], [x + dx, y + dy, z + dz], 'cube'); aimed = true; break; } catch (e) {} }
    assert(aimed, 'could not aim at the puzzle cube');
    const probe = `()=>{const o=House.THINGS.cube.obj;return{gx:o.position.x,gy:o.position.y,gz:o.position.z,gst:House.THINGS.cube.st,panel:window.__trace.vis('.hs-inspection')}}`;
    const enter = await capture('inspect-enter', () => p.keyboard.press('f'), { ms: 700, probe });
    await until(() => House.mode === 'inspect'); clean(enter);
    { const fr = enter.trace.filter(f => f.gx != null), last = fr.at(-1), landed = fr.find(f => Math.hypot(f.gx - last.gx, f.gy - last.gy, f.gz - last.gz) < 0.05)?.t ?? 1e9;
      timing['inspect-enter'].span = Math.round(landed); assert(landed < 520, 'close-up should land within ~0.5 s: ' + landed); }
    const back = await capture('inspect-back', () => p.keyboard.press('q'), { ms: 700, probe });
    await until(() => House.mode === 'walk'); clean(back, { pops: false });
    await p.waitForTimeout(400); await p.keyboard.press('q'); await until(() => !House.held()); await settle();
  });
  await scenario('pc-sit-stand', async () => {
    await aimAt([-15, -24, 0], [40, -55, 155]);
    const sit = await capture('pc-sit', () => p.keyboard.press('f'), { ms: 1500, target: 1150, probe: '()=>({})' });
    await until(() => House.mode === 'monitor' && !House.gliding && window.DesktopSurface?.ready?.()); clean(sit);
    await p.waitForTimeout(500); await p.evaluate(() => document.activeElement?.blur());
    const lock = await capture('pc-lockin', () => p.keyboard.press('t'), { ms: 650, probe: '()=>({})' });
    assert(await p.evaluate(() => House.desktopDisplay()), 'PC LOCK IN'); clean(lock, { pops: false });
    const unlock = await capture('pc-lockout', () => p.keyboard.press('t'), { ms: 650, probe: '()=>({})' });
    assert(!await p.evaluate(() => House.desktopDisplay()), 'PC LOCK IN off'); clean(unlock, { pops: false });
    await p.waitForTimeout(400);
    const stand = await capture('pc-stand', async () => { await p.keyboard.press('q'); await p.waitForTimeout(400); await p.keyboard.down('w'); }, { ms: 1700, probe: '()=>({W:[House.W.x,House.W.z]})', after: async () => { await p.waitForTimeout(500); } });
    const moved = stand.trace.at(-1).W, settled = stand.trace.find(f => f.mode === 'walk' && f.t > 1000)?.W;
    await p.keyboard.up('w'); await settle();
    clean(stand, { pops: false });
    assert(settled && Math.hypot(moved[0] - settled[0], moved[1] - settled[1]) > 3, 'W held through standing up must walk once the camera lands');
  });
  await scenario('menu-mid', async () => {
    await aimGB(); await p.keyboard.press('f'); await p.waitForTimeout(250); await p.keyboard.press('Escape');
    await until(() => HousePause.open); await p.waitForTimeout(800); await p.keyboard.press('Escape'); await until(() => !HousePause.open);
    await until(() => window.RoomTV?.open_ && House.mode === 'focus'); await settle();
    await p.keyboard.press('q'); await until(() => House.mode === 'walk' && House.THINGS.gb.st === 'rest'); await settle();
  });
  assert.deepEqual(errors.filter(e => !/WebGL|GPU stall|ReadPixels/.test(e)), [], 'console errors');
  results.push(['console-errors', true]);
} catch (e) { results.push(['runner', false]); console.log('FAIL runner:', e.message); }
finally {
  await writeFile(`${shots}timing.json`, JSON.stringify(timing, null, 1));
  await browser.close(); await cleanup();
}
const failed = results.filter(r => !r[1]);
console.log(`SUMMARY ${results.length - failed.length}/${results.length} passed (${tag}); shots in tests/shots/transitions/${tag}/`);
process.exit(failed.length ? 1 : 0);

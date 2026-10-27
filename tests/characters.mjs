// The family in the house (js/np-rig.js, js/np-nav.js, js/np-life.js): routines on the 1999 clock (including the
// owner's clock override), a long simulated day that never walks through a wall or a shut door and never loiters in a
// doorway, doors opened and shut behind them, talking (F) with real script lines, Mom giving and taking in jobs without
// paying anything herself, bumping into them, stepping aside, refresh keeping everyone in place, planted feet, the draw
// call cost, and the story's first in-person scene (Mom gives the first jobs). Screenshots: tests/shots/characters/.
// Starts and stops its own server on a free port with throwaway data, like smoke.mjs.
//   node characters.mjs [--only=routines|day|talk|bump|refresh|feet|draws|story|shots] [--keep]
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, rm} from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const shots = fileURLToPath(new URL('shots/characters/', import.meta.url));
const args = process.argv.slice(2), only = args.find(a => a.startsWith('--only='))?.slice(7);
const SCALE = +process.env.SMOKE_SCALE || Math.max(1, Math.min(4, Math.round(os.loadavg()[0] / os.cpus().length * 13) / 10));
const pass = 'Throwaway-1999', results = [];
let server, data, base;
const freePort = () => new Promise((res, rej) => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); s.on('error', rej); });
async function startServer() {
  data = await mkdtemp(os.tmpdir() + '/jhp-characters-'); const port = await freePort();
  server = spawn(process.execPath, ['server.js'], { cwd: root + 'app', env: { ...process.env, PORT: String(port), DATA_DIR: data, ADMIN_TOKEN: 'testtoken' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; server.stdout.on('data', d => { log += d; }); server.stderr.on('data', d => { log += d; });
  base = 'http://localhost:' + port;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base + '/robots.txt')).ok) break; } catch (e) {} await new Promise(r => setTimeout(r, 200)); }
  server.log = () => log;
}
async function stopServer() {
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(r => { server.once('exit', r); setTimeout(r, 2000); }); }
  if (data) await rm(data, { recursive: true, force: true });
}
for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, async () => { await stopServer(); process.exit(130); });
async function register(name) { const r = await fetch(base + '/admin/register', { method: 'POST', headers: { 'x-admin-token': 'testtoken', 'content-type': 'application/json' }, body: JSON.stringify({ name, pass }) }); assert.equal(r.status, 200, 'register ' + name); }
async function check(name, fn) {
  if (only && only !== name) return;
  const t0 = Date.now();
  try { await fn(); results.push([name, true]); console.log(`PASS ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
  catch (e) { results.push([name, false]); console.log(`FAIL ${name}: ${String(e.stack || e).split('\n').slice(0, 4).join(' | ')}`); }
}
async function house(opts) {
  const f = await roomFixture(base, Object.assign({ hour: 14, timeoutScale: SCALE }, opts));
  for (let i = 0; i < 120 * SCALE && !(await f.page.evaluate(() => !!window.HouseFamily?.ready)); i++) await f.page.waitForTimeout(500);
  assert(await f.page.evaluate(() => !!window.HouseFamily?.ready), 'The family never arrived');
  return f;
}
async function veteran(opts) { const name = 'Fam' + Date.now().toString(36); await register(name); return house(Object.assign({ account: name, password: pass, signup: false }, opts)); }
const shot = (page, name) => page.screenshot({ path: shots + name + '.png' });
// Put the camera somewhere (house coords, y down) looking at a point, standing (walk mode)
async function look(page, eye, target, lvl) {
  await page.evaluate(({ eye, target, lvl }) => {
    House.hush(); House.setWalkFrom({ x: eye[0], y: eye[1], z: eye[2], lvl, seat: 0 });
    const [x, y, z] = eye, [tx, ty, tz] = target;
    Object.assign(House.P, { x, y, z, rx: Math.atan2(-(ty - y), Math.hypot(tx - x, tz - z)) * 180 / Math.PI, ry: Math.atan2(tx - x, -(tz - z)) * 180 / Math.PI, seat: 0, lvl });
    House._.setMode('walk'); House.dirty();
  }, { eye, target, lvl });
  await page.waitForTimeout(400 * SCALE);
}

await mkdir(shots, { recursive: true });
await startServer();
const watchdog = setTimeout(async () => { console.log('FAIL runner: total timeout'); await stopServer(); process.exit(1); }, 1500000 * SCALE);
try {
  // ---------------------------------------------------------------- routines on the clock (and the owner's override)
  await check('routines', async () => {
    const { browser, page, errors } = await veteran();
    try {
      const at = (md, dow, t) => page.evaluate(({ md, dow, t }) => { const F = HouseFamily; F.debug.clock({ md, dow, t }); F.debug.sim(150, 0.1); return F.debug.dump(); }, { md, dow, t });
      const by = d => Object.fromEntries(d.map(c => [c.id, c]));
      // Tuesday 12 October 1999: a school day and a work day
      let d = by(await at(1012, 2, 10.6));
      assert(d.mom.present && d.mom.room === 'garden', 'Mom in the garden at 10:36 on a weekday: ' + JSON.stringify(d.mom));
      assert(!d.dad.present, 'Dad is at work'); assert(!d.sister.present, 'The sister is at school');
      d = by(await at(1012, 2, 16));
      assert(d.sister.present && d.sister.room === 'lounge', 'Home from school by four: ' + JSON.stringify(d.sister));
      assert(!d.dad.present, 'Dad still at work at four');
      d = by(await at(1012, 2, 18.1));
      assert(d.dad.present && d.dad.outfit === 'home', 'Dad home after 17:30 with his tie loosened: ' + JSON.stringify(d.dad));
      // Saturday 16 October: Dad washes the car in his weekend clothes
      d = by(await at(1016, 6, 10.6));
      assert(d.dad.present && d.dad.spot === 'carwash' && d.dad.room === 'drive', 'Dad washing the car on Saturday: ' + JSON.stringify(d.dad));
      assert(d.sister.present, 'No school on Saturday');
      // the middle of the night: everyone has gone to bed
      d = by(await at(1016, 6, 23.9));
      assert(!d.mom.present && !d.dad.present && !d.sister.present, 'Everyone in bed at midnight: ' + JSON.stringify(d));
      await page.evaluate(() => HouseFamily.debug.clock(null));
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
    // the owner's clock override drives the same routines
    await register('Jack');
    const f = await house({ account: 'Jack', password: pass, signup: false });
    try {
      await f.until(() => window.OwnerTools?.allowed);
      await f.page.evaluate(() => Net.send({ t: 'ownerAction', rid: 'np-1', action: 'clock', date: '1999-10-16', hour: 10 }));
      await f.until(() => OwnerTools.clock?.date === '1999-10-16');
      await f.page.evaluate(() => { window.auditHour = 10; }); // (the fixture pins Date#getHours; the override's hour comes through it)
      assert.equal(await f.page.evaluate(() => HouseFamily.debug.scheduled('dad').raw), 'carwash', 'Owner clock: Saturday 10:00 is car-washing time');
      await f.page.evaluate(() => Net.send({ t: 'ownerAction', rid: 'np-2', action: 'clock', date: '1999-10-12', hour: 11 }));
      await f.until(() => OwnerTools.clock?.date === '1999-10-12');
      await f.page.evaluate(() => { window.auditHour = 11; });
      assert.equal(await f.page.evaluate(() => HouseFamily.debug.scheduled('dad').raw), 'away:work', 'Owner clock: Tuesday 11:00 Dad is at work');
      await f.page.evaluate(() => Net.send({ t: 'ownerAction', rid: 'np-3', action: 'clock', clear: true }));
      assert.deepEqual(f.errors, []);
    } finally { await f.browser.close(); }
  });

  // ---------------------------------------------------------------- a long simulated day: walls, doors, doorways
  await check('day', async () => {
    const { browser, page, errors } = await veteran();
    try {
      const r = await page.evaluate(() => {
        const F = HouseFamily, H = House, NV = NPCNav, out = { bad: [], dwell: {}, stuck: {}, opened: 0, shut: 0, min: 99, ticks: 0 };
        H.on('door', (id, open) => { if (open) out.opened++; else out.shut++; });
        const dw = {}, prev = {};
        const check = d => {
          out.ticks++;
          for (const c of d) {
            if (!c.present) continue;
            const st = F.chars[c.id], k = st.cur?.k || prev[c.id] || null; prev[c.id] = k;
            const seatMove = ['line', 'sit', 'stand'].includes(k) || k === 'face' && !!st.goal?.spot?.seat || c.seated || c.sitting; // (seats are stepped into off the walkable floor)
            const flight = NV.onFlight(c.x, c.z) && c.x > 352 && c.x < 392;
            if (!seatMove && !flight) {
              const cl = NV.clear(c.lvl, c.x, c.z); out.min = Math.min(out.min, cl);
              const shut = Object.values(H.DOORS).find(D => !D.open && !D.always && D.closedBounds && D.rooms.some(r => H.ROOMS[r].lvl === c.lvl) && c.x > D.closedBounds.x0 - 8 && c.x < D.closedBounds.x1 + 8 && c.z > D.closedBounds.z0 - 8 && c.z < D.closedBounds.z1 + 8);
              if ((cl < 18 || shut) && out.bad.length < 20) out.bad.push([c.id, c.x, c.z, c.lvl, k, Math.round(cl), shut?.id || null]);
            }
            if (k === 'route' && Math.abs(c.v) < 5) { st.__stuck = (st.__stuck || 0) + 0.1; if (st.__stuck > 5 && st.__stuck < 5.11 && st.cur) { out.why = out.why || []; out.why.push([c.id, Math.round(c.x), Math.round(c.z), st.cur.why, st.cur.s | 0, st.cur.r && st.cur.r.len | 0, st.cur.r && st.cur.r.doors.map(q => q.id + ':' + (q.s0 | 0) + ':' + H.DOORS[q.id].open).join(' '), JSON.stringify(st.cur.to)]); } if (st.__stuck > (out.stuck[c.id] || 0)) { out.stuck[c.id] = st.__stuck; out.stuckAt = out.stuckAt || {}; const cu = st.cur || {}; out.stuckAt[c.id] = [c.x, c.z, c.lvl, c.goal, F.debug.want(c.id), st.hold, st.talking, st.present, st.cur ? st.cur.k : 'nocur', st.plan.map(p => p.k).join('>'), st.hold, st.talking, cu.s, cu.r && cu.r.len, cu.r && cu.r.doors.map(d => d.id + ':' + Math.round(d.s0) + ':' + H.DOORS[d.id].open).join(' '), cu.blocked, cu.why, d.filter(o => o.present && o.id !== c.id).map(o => o.id + '@' + Math.round(o.x) + ',' + Math.round(o.z)).join(' '), Math.round(H.W.x) + ',' + Math.round(H.W.z) + H.W.lvl]; } } else st.__stuck = 0;
            let inDoor = null;
            for (const D of Object.values(H.DOORS)) { const b = D.closedBounds; if (b && !D.always && c.x > b.x0 - 25 && c.x < b.x1 + 25 && c.z > b.z0 - 25 && c.z < b.z1 + 25 && D.rooms.some(r => H.ROOMS[r].lvl === c.lvl)) inDoor = D.id; }
            if (inDoor && Math.abs(c.v) < 5) { dw[c.id] = (dw[c.id] || 0) + 0.1; if (dw[c.id] > (out.dwell[c.id] || 0)) { out.dwell[c.id] = dw[c.id]; out.where = out.where || {}; out.where[c.id] = [inDoor, c.x, c.z, k, c.goal]; } } else dw[c.id] = 0;
          }
        };
        const days = [[1012, 2], [1016, 6], [1017, 0]];
        for (const [md, dow] of days) for (let t = 6; t <= 23.75; t += 0.25) { F.debug.clock({ md, dow, t }); F.debug.sim(36, 0.1, check); }
        F.debug.clock(null);
        return out;
      });
      console.log(`  day: ${r.ticks} person-ticks, min clearance ${r.min.toFixed(1)} cm, doors opened ${r.opened} / shut ${r.shut}, doorway dwell ${JSON.stringify(r.dwell)}, longest wait ${JSON.stringify(r.stuck)} ${JSON.stringify(r.stuckAt || {})} WHY ${JSON.stringify(r.why || [])} ${JSON.stringify(r.where || {})}`);
      assert.deepEqual(r.bad, [], 'Walked into a wall, furniture or a shut door: ' + JSON.stringify(r.bad));
      assert(r.opened >= 3 && r.shut >= 2, 'Doors opened and shut behind them');
      for (const [id, s] of Object.entries(r.stuck)) assert(s < 12, id + ' stood stuck on the way for ' + s.toFixed(1) + ' s');
      for (const [id, s] of Object.entries(r.dwell)) assert(s < 3, id + ' stood in a doorway for ' + s.toFixed(1) + ' s');
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // ---------------------------------------------------------------- talking, giving jobs, taking them in (and paying nothing)
  await check('talk', async () => {
    const { browser, page, errors } = await veteran();
    try {
      await page.evaluate(async () => { await Chores.load(); await Chores.part('kitchen'); const F = HouseFamily; F.debug.clock({ md: 1012, dow: 2, t: 14.5 }); F.debug.go('mom', 'sink'); F.debug.place('mom', 'sink'); F.debug.sim(3, 0.1); });
      await look(page, [-60, 353 - 128, 175], [-80, 353 - 150, 36], 'G');
      await page.evaluate(() => { window.__sent = []; const s = Net.send; Net.send = m => { __sent.push(m.t); return s(m); }; });
      await page.keyboard.press('f');
      await page.waitForFunction(() => !!HouseFamily.debug.speech.cur, null, { timeout: 15000 * SCALE });
      const said = await page.evaluate(() => { const c = HouseFamily.debug.speech.cur; return { id: c.lineId, line: NPCLines[c.lineId][1], who: c.c.id, person: c.person, note: document.querySelector('.hs-note.on')?.textContent || '', talking: HouseFamily.chars.mom.rig.talking }; });
      assert.equal(said.who, 'mom'); assert(said.person, 'Said in person'); assert(said.talking, 'Her lips move');
      assert(said.note.includes(said.line.slice(0, 20)), 'Subtitle shows the scripted line: ' + said.note);
      assert(/^chore\.\w+\.give$|^chore\.allfour$|^bark\.mom\./.test(said.id), 'Mom hands out a job (or praise): ' + said.id);
      await page.waitForTimeout(700); await shot(page, 'mom-talk-kitchen');
      // (people v2: the mouth is painted; talking swaps the mouth frames in the face atlas)
      const mouth = await page.evaluate(async () => { const r = HouseFamily.chars.mom.rig, s = [], f = new Set(); for (let i = 0; i < 12; i++) { s.push(r.st.mouth); f.add(r.face.mouth); await new Promise(q => setTimeout(q, 90)); } return { s, frames: [...f] }; });
      assert(Math.max(...mouth.s) - Math.min(...mouth.s) > 0.2 && mouth.frames.length > 1, 'Mouth moves while talking: ' + mouth.s.map(v => v.toFixed(2)).join(',') + ' frames ' + mouth.frames);
      // handing a job in: Mom says the job's done line and her rating, in person
      const handed = await page.evaluate(() => HouseFamily.handIn('washup', { sc: 97 }));
      assert(handed, 'Mom takes the washing-up in herself');
      await page.waitForFunction(() => HouseFamily.debug.speech.q.some(q => q.lineId === 'chore.washup.done') || HouseFamily.debug.speech.cur?.lineId === 'chore.washup.done', null, { timeout: 30000 * SCALE });
      const sent = await page.evaluate(() => __sent);
      assert(!sent.some(t => /^(ch|ec|hs|gr)/.test(t)), 'Talking never pays or starts a job by itself: ' + sent.join(','));
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // ---------------------------------------------------------------- solid people; stepping aside; never blocking a doorway
  await check('bump', async () => {
    const { browser, page, errors } = await veteran();
    try {
      await page.evaluate(() => { const F = HouseFamily; F.debug.clock({ md: 1012, dow: 2, t: 14.5 }); F.debug.go('mom', 'hallStairs'); F.debug.place('mom', 'hallStairs'); F.debug.sim(2, 0.1); });
      // stand in front of her and walk straight at her
      await look(page, [246, 353 - 128, 460], [246, 353 - 140, 560], 'G');
      const start = await page.evaluate(() => { const m = HouseFamily.chars.mom; return { x: m.x, z: m.z }; });
      await page.keyboard.down('w'); await page.waitForTimeout(2200 * SCALE);
      const mid = await page.evaluate(() => { const m = HouseFamily.chars.mom; return { d: Math.hypot(House.W.x - m.x, House.W.z - m.z) }; });
      let moved = 0; // (she steps aside, then goes back to her spot once I'm past: measure the furthest she went)
      for (let i = 0; i < 14; i++) { await page.waitForTimeout(250 * SCALE); const m = await page.evaluate(() => { const m = HouseFamily.chars.mom; return { x: m.x, z: m.z }; }); moved = Math.max(moved, Math.hypot(m.x - start.x, m.z - start.z)); }
      await page.keyboard.up('w');
      const end = { x: start.x + moved, z: start.z };
      assert(mid.d >= 30, 'Walked through Mom: ' + mid.d.toFixed(1));
      assert(Math.hypot(end.x - start.x, end.z - start.z) > 30, 'Mom stepped aside to let me past');
      await shot(page, 'mom-step-aside');
      // block the lounge doorway; Mom wants to go through it. She waits outside it, then goes round/through once it's clear.
      const r = await page.evaluate(() => {
        const F = HouseFamily, H = House;
        H.setWalkFrom({ x: 200, y: 353 - 128, z: 520, lvl: 'G', seat: 0 }); F.debug.go('mom', 'phone'); F.debug.place('mom', 'hallYoyo');
        const D = H.DOORS.lounge.closedBounds, out = { inDoor: 0, minD: 999 };
        F.debug.sim(25, 0.1, d => { const m = d.find(c => c.id === 'mom'); out.minD = Math.min(out.minD, Math.hypot(m.x - H.W.x, m.z - H.W.z)); if (m.x > D.x0 - 25 && m.x < D.x1 + 25 && m.z > D.z0 - 25 && m.z < D.z1 + 25 && Math.abs(m.v) < 5) out.inDoor += 0.1; });
        H.setWalkFrom({ x: 300, y: 353 - 128, z: 300, lvl: 'G', seat: 0 });
        F.debug.sim(60, 0.1); out.after = F.debug.dump().find(c => c.id === 'mom'); return out;
      });
      assert(r.minD >= 38, 'Mom walked into me in the doorway: ' + r.minD.toFixed(1));
      assert(r.inDoor < 3, 'Mom loitered in the doorway: ' + r.inDoor.toFixed(1) + ' s');
      assert(r.after.room === 'lounge' && r.after.step === 'act', 'Mom got to the phone once I moved: ' + JSON.stringify(r.after));
      await page.evaluate(() => { HouseFamily.debug.go('mom', null); HouseFamily.debug.clock(null); });
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // ---------------------------------------------------------------- refresh keeps everyone where they were
  await check('refresh', async () => {
    const { browser, page, until, errors } = await veteran();
    try {
      await page.evaluate(() => HouseFamily.debug.sim(30, 0.1));
      const before = await page.evaluate(() => { HouseFamily.debug.save(); House.saveWalkState(); return HouseFamily.debug.dump(); });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 * SCALE });
      await until(() => window.HouseFamily?.ready);
      const after = await page.evaluate(() => HouseFamily.debug.dump());
      for (const b of before) {
        const a = after.find(c => c.id === b.id);
        assert.equal(a.present, b.present, b.id + ' presence changed on refresh');
        if (b.present) assert(Math.hypot(a.x - b.x, a.z - b.z) < 80 && a.lvl === b.lvl, b.id + ' jumped on refresh: ' + JSON.stringify([b, a]));
        if (b.present) assert.equal(a.seated, b.seated, b.id + ' stood up/sat down on refresh');
      }
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // ---------------------------------------------------------------- planted feet: a stance foot never slides
  await check('feet', async () => {
    const { browser, page, errors } = await veteran();
    try {
      const r = await page.evaluate(() => {
        const out = {};
        for (const kind of ['mom', 'dad', 'sister']) {
          const rig = NPCRig.create(kind, {}), T = THREE, g = new T.Group(); g.scale.y = -1; g.add(rig.group); rig.floor = () => 0;
          let z = 0; rig.teleport(0, 0, 0, 0); let worst = 0, n = 0; const plant = [null, null], v = new T.Vector3();
          for (let i = 0; i < 360; i++) {
            const dt = 1 / 60, speed = rig.S.speed; z += speed * dt; rig.root(0, 0, z, 0, i < 330 ? speed : 0); rig.update(dt, true); g.updateMatrixWorld(true);
            for (const [k, sd] of [[0, 'L'], [1, 'R']]) {
              const f = rig.st.feet[k]; rig.bones['foot' + sd].getWorldPosition(v);
              if (f.stance > 0.15 && f.stance < 0.65 && i > 40) { if (!plant[k]) plant[k] = v.clone(); else { worst = Math.max(worst, v.distanceTo(plant[k])); n++; } } else plant[k] = null;
            }
          }
          out[kind] = { worst, n }; rig.dispose();
        }
        return out;
      });
      for (const [k, v] of Object.entries(r)) { assert(v.n > 50, k + ' never planted a foot'); assert(v.worst < 1.5, k + ' foot slid ' + v.worst.toFixed(2) + ' cm'); }
      console.log('  feet: ' + Object.entries(r).map(([k, v]) => k + ' max slide ' + v.worst.toFixed(2) + ' cm').join(', '));
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // ---------------------------------------------------------------- what they cost to draw
  await check('draws', async () => {
    const { browser, page, errors } = await veteran({ tier: 'low' });
    try {
      await page.evaluate(() => { const F = HouseFamily; F.debug.clock({ md: 1012, dow: 2, t: 18.1 }); for (const [id, s] of [['mom', 'hob'], ['dad', 'kmug2'], ['sister', 'kmug3']]) { F.debug.go(id, s); F.debug.place(id, s); } F.debug.sim(4, 0.1); });
      await look(page, [150, 353 - 140, 260], [-30, 353 - 100, 60], 'G');
      const measure = () => page.evaluate(async () => { House.dirty(); await new Promise(r => setTimeout(r, 300)); return window.__jhpDebug().renderer; });
      const withFam = await measure();
      await page.evaluate(() => HouseFamily.debug.hide(true));
      const without = await measure();
      await page.evaluate(() => HouseFamily.debug.hide(false));
      const extra = withFam.calls - without.calls, tris = withFam.triangles - without.triangles;
      console.log(`  draws: kitchen at tea time ${withFam.calls} calls with the family, ${without.calls} without (+${extra}); +${tris} triangles (low tier)`);
      assert(extra <= 6, 'Each person costs at most two draw calls: +' + extra);
      assert(tris <= 3 * 3200, 'Triangle budget (people v2: about 3k each on Low, docs/PEOPLE.md): +' + tris);
      await shot(page, 'kitchen-tea-low');
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // ---------------------------------------------------------------- the story: Mom comes up and gives the first jobs in person
  await check('story', async () => {
    const { browser, page, until, errors } = await house({ account: 'Story' + Date.now().toString(36), password: pass, opening: true });
    try {
      await until(() => !!st.getState() && !!House.THINGS['st.diary']);
      assert.equal(await page.evaluate(() => st.current().id), 'lad');
      await page.evaluate(() => { House._.setMode('walk'); House.interact('gb'); });
      await until(() => window.RoomTV?.open_);
      await page.evaluate(() => RoomTV.playPhysical('gb.blocks'));
      await until(() => RoomTV._dbg()?.st === 'game'); await page.keyboard.press('Enter'); await page.keyboard.press('ArrowLeft');
      await until(() => !!st.getState()?.done.lad);
      await page.keyboard.press('q'); await until(() => House.mode === 'walk' && !House.gliding);
      assert.equal(await page.evaluate(() => st.current().id), 'meetmom', 'Next: talk to Mom');
      // Mom walks up to the bedroom door (fast-forwarded), says hello in person
      await page.evaluate(() => HouseFamily.debug.sim(90, 0.1));
      const mom = await page.evaluate(() => HouseFamily.debug.dump().find(c => c.id === 'mom'));
      assert(mom.present && mom.room === 'bedroom' && mom.spot === 'bedDoorMom', 'Mom at my door: ' + JSON.stringify(mom));
      await look(page, [60, 73 - 128, 175], [178, 73 - 150, 196], 'U');
      await page.waitForTimeout(800); await shot(page, 'story-mom-at-door');
      await page.keyboard.press('f');
      await until(() => HouseFamily.debug.speech.cur?.lineId === 'c1.mom.give' || HouseFamily.debug.speech.q.some(q => q.lineId === 'c1.mom.give'));
      await page.waitForTimeout(1200); await shot(page, 'story-mom-gives-jobs');
      for (let i = 0; i < 160 && !(await page.evaluate(() => !!st.getState()?.done.meetmom)); i++) await page.waitForTimeout(250);
      assert(await page.evaluate(() => !!st.getState()?.done.meetmom), 'Talking to Mom completes the step');
      assert.equal(await page.evaluate(() => st.current().id), 'tidy');
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // ---------------------------------------------------------------- portraits: idle, walking and talking, several angles
  await check('shots', async () => {
    const { browser, page, errors } = await veteran({ tier: 'high' });
    try {
      await page.evaluate(() => { const F = HouseFamily; F.debug.clock({ md: 1012, dow: 2, t: 18.1 }); F.debug.go('mom', 'hallStairs'); F.debug.place('mom', 'hallStairs'); F.debug.go('dad', 'carStory'); F.debug.place('dad', 'carStory'); F.debug.go('sister', 'hallYoyo'); F.debug.place('sister', 'hallYoyo'); F.debug.sim(3, 0.1); });
      const G = 353;
      const views = {
        mom: [[[250, G - 128, 420], [246, G - 148, 560]], [[320, G - 128, 680], [246, G - 148, 560]], [[296, G - 138, 470], [246, G - 150, 560]]],
        sister: [[[262, G - 128, 560], [266, G - 113, 430]], [[300, G - 128, 300], [266, G - 113, 430]], [[222, G - 123, 330], [266, G - 113, 430]]],
        dad: [[[300, G - 128, 690], [318, G - 153, 800]], [[200, G - 128, 900], [318, G - 153, 800]], [[255, G - 138, 735], [318, G - 158, 800]]],
      };
      for (const [id, vs] of Object.entries(views)) for (const [i, [eye, tgt]] of vs.entries()) { await look(page, eye, tgt, 'G'); await page.waitForTimeout(500); await shot(page, `${id}-idle-${i + 1}`); }
      // walking: the sister crosses the hall to the lounge; three frames
      await page.evaluate(() => HouseFamily.debug.go('sister', 'floorTV'));
      await look(page, [300, G - 140, 300], [250, G - 100, 470], 'G');
      for (let i = 1; i <= 3; i++) { await page.waitForTimeout(700); await shot(page, `sister-walk-${i}`); }
      await page.evaluate(() => HouseFamily.debug.go('mom', 'phone'));
      await look(page, [320, G - 140, 640], [246, G - 110, 560], 'G');
      for (let i = 1; i <= 3; i++) { await page.waitForTimeout(600); await shot(page, `mom-walk-${i}`); }
      // talking: Dad by the car
      await look(page, [318, G - 128, 740], [318, G - 150, 800], 'G');
      await page.evaluate(() => HouseFamily.talk('dad'));
      for (let i = 1; i <= 2; i++) { await page.waitForTimeout(900); await shot(page, `dad-talk-${i}`); }
      await page.evaluate(() => { for (const id of ['mom', 'dad', 'sister']) HouseFamily.debug.go(id, null); HouseFamily.debug.clock(null); });
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });
} finally {
  clearTimeout(watchdog);
  const log = server?.log?.() || '';
  await stopServer();
  if (/mod failed to load/i.test(log)) { console.log('FAIL server: a mod failed to load'); results.push(['server', false]); }
  const ok = results.filter(r => r[1]).length;
  console.log(`SUMMARY ${ok}/${results.length} passed${only ? ' (only ' + only + ')' : ''}; shots in tests/shots/characters/`);
  process.exitCode = ok === results.length && results.length ? 0 : 1;
}

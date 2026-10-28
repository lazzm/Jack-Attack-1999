// The family in the house (js/np-rig.js, js/np-nav.js, js/np-life.js): routines on the 1999 clock (including the
// owner's clock override), a long simulated day that never walks through a wall or a shut door and never loiters in a
// doorway, doors opened and shut behind them, talking (F) with real script lines, Mom giving and taking in jobs without
// paying anything herself, bumping into them, stepping aside, refresh keeping everyone in place, planted feet, the draw
// call cost, and the story's first in-person scene (Mom gives the first jobs). Screenshots: tests/shots/characters/.
// Starts and stops its own server on a free port with throwaway data, like smoke.mjs.
//   node characters.mjs [--only=routines,day,talk,bump,refresh,feet,draws,story,entrance,interrupt,loop,space,budget,hips,hip-motion,shots] [--keep]
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, rm} from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
let EYE = 128;
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
  if (only && !only.split(',').includes(name)) return;
  const t0 = Date.now();
  try { await fn(); results.push([name, true]); console.log(`PASS ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
  catch (e) { results.push([name, false]); console.log(`FAIL ${name}: ${String(e.stack || e).split('\n').slice(0, 4).join(' | ')}`); }
}
async function house(opts) {
  const f = await roomFixture(base, Object.assign({ hour: 14, timeoutScale: SCALE }, opts));
  EYE = await f.page.evaluate(() => House.STAND || 128); // (the live standing eye height)
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
        const F = HouseFamily, H = House, NV = NPCNav, out = { bad: [], overlaps: [], dwell: {}, stuck: {}, opened: 0, shut: 0, min: 99, ticks: 0 };
        H.on('door', (id, open) => { if (open) out.opened++; else out.shut++; });
        const dw = {}, prev = {};
        const check = d => {
          out.ticks++;
          for(let i=0;i<d.length;i++)for(let j=i+1;j<d.length;j++){
            const a=d[i],b=d[j];if(!a.present||!b.present||a.lvl!==b.lvl||[a,b].some(c=>c.seated||c.sitting||c.step==='line'))continue;
            const gap=({mom:22,dad:25,sister:18})[a.id]+({mom:22,dad:25,sister:18})[b.id],distance=Math.hypot(a.x-b.x,a.z-b.z);
            if(distance<gap-1&&out.overlaps.length<12)out.overlaps.push([a.id,b.id,distance,a.x,a.z,b.x,b.z,a.step,b.step]);
          }
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
            if (k === 'route' && Math.abs(c.v) < 5) { st.__stuck = (st.__stuck || 0) + 0.1; if (st.__stuck > 5 && st.__stuck < 5.11 && st.cur) { out.why = out.why || []; out.why.push([c.id, Math.round(c.x), Math.round(c.z), st.cur.why, st.cur.s | 0, st.cur.r && st.cur.r.len | 0, st.cur.r && st.cur.r.doors.map(q => q.id + ':' + (q.s0 | 0) + ':' + H.DOORS[q.id].open).join(' '), JSON.stringify(st.cur.to),d.filter(o=>o.id!==c.id&&o.present).map(o=>({id:o.id,x:o.x,z:o.z,v:o.v,cur:F.chars[o.id].cur?.k,goal:F.chars[o.id].goal?.key,aside:F.chars[o.id].aside,asideFor:F.chars[o.id].asideFor?.id,hit:F.chars[o.id].cur?.hit}))]); } if (st.__stuck > (out.stuck[c.id] || 0)) { out.stuck[c.id] = st.__stuck; out.stuckAt = out.stuckAt || {}; const cu = st.cur || {}; out.stuckAt[c.id] = [c.x, c.z, c.lvl, c.goal, F.debug.want(c.id), st.hold, st.talking, st.present, st.cur ? st.cur.k : 'nocur', st.plan.map(p => p.k).join('>'), st.hold, st.talking, cu.s, cu.r && cu.r.len, cu.r && cu.r.doors.map(d => d.id + ':' + Math.round(d.s0) + ':' + H.DOORS[d.id].open).join(' '), cu.blocked, cu.why, d.filter(o => o.present && o.id !== c.id).map(o => o.id + '@' + Math.round(o.x) + ',' + Math.round(o.z)).join(' '), Math.round(H.W.x) + ',' + Math.round(H.W.z) + H.W.lvl, d.filter(o=>o.present&&o.id!==c.id).map(o=>({id:o.id,cur:F.chars[o.id].cur?.k,goal:F.chars[o.id].goal?.key,aside:F.chars[o.id].aside,asideFor:F.chars[o.id].asideFor?.id,v:o.v}))]; } } else st.__stuck = 0;
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
      console.log(`  day: ${r.ticks} simulation ticks, min clearance ${r.min.toFixed(1)} cm, doors opened ${r.opened} / shut ${r.shut}, doorway dwell ${JSON.stringify(r.dwell)}, longest wait ${JSON.stringify(r.stuck)} ${JSON.stringify(r.stuckAt || {})} WHY ${JSON.stringify(r.why || [])} ${JSON.stringify(r.where || {})}`);
      assert.deepEqual(r.overlaps, [], 'Routine bodies overlapped: '+JSON.stringify(r.overlaps));
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
      await look(page, [-60, 353 - EYE, 175], [-80, 353 - 150, 36], 'G');
      await page.evaluate(() => { window.__sent = []; const s = Net.send; Net.send = m => { __sent.push(m.t); return s(m); }; });
      await page.keyboard.press('f');
      // (read it in the same moment it's seen: under heavy load the line can finish between two round trips)
      const said = await (await page.waitForFunction(() => { const c = HouseFamily.debug.speech.cur; return c && { id: c.lineId, line: NPCLines[c.lineId][1], who: c.c.id, person: c.person, note: (window.NPCBubble?.live || []).find(b => b.key === 'mom')?.text || document.querySelector('.hs-note.on')?.textContent || '', talking: HouseFamily.chars.mom.rig.talking }; }, null, { timeout: 15000 * SCALE })).jsonValue();
      assert.equal(said.who, 'mom'); assert(said.person, 'Said in person'); assert(said.talking, 'Her lips move');
      assert(said.note.includes(said.line.slice(0, 20)), 'Her speech bubble (or the subtitle box) shows the scripted line: ' + said.note);
      assert(/^chore\.\w+\.give$|^chore\.allfour$|^bark\.mom\./.test(said.id), 'Mom hands out a job (or praise): ' + said.id);
      // (people v2: the mouth is painted; talking swaps the mouth frames in the face atlas)
      const mouth = await page.evaluate(async () => { const r = HouseFamily.chars.mom.rig, s = [], f = new Set(); for (let i = 0; i < 12; i++) { s.push(r.st.mouth); f.add(r.face.mouth); await new Promise(q => setTimeout(q, 90)); } return { s, frames: [...f] }; });
      assert(Math.max(...mouth.s) - Math.min(...mouth.s) > 0.2 && mouth.frames.length > 1, 'Mouth moves while talking: ' + mouth.s.map(v => v.toFixed(2)).join(',') + ' frames ' + mouth.frames);
      await page.waitForTimeout(700); await shot(page, 'mom-talk-kitchen');
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
      await look(page, [246, 353 - EYE, 460], [246, 353 - 140, 560], 'G');
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
        H.setWalkFrom({ x: 200, y: 353 - (H.STAND || 128), z: 520, lvl: 'G', seat: 0 }); F.debug.go('mom', 'phone'); F.debug.place('mom', 'hallYoyo');
        const D = H.DOORS.lounge.closedBounds, out = { inDoor: 0, minD: 999 };
        F.debug.sim(25, 0.1, d => { const m = d.find(c => c.id === 'mom'); out.minD = Math.min(out.minD, Math.hypot(m.x - H.W.x, m.z - H.W.z)); if (m.x > D.x0 - 25 && m.x < D.x1 + 25 && m.z > D.z0 - 25 && m.z < D.z1 + 25 && Math.abs(m.v) < 5) out.inDoor += 0.1; });
        H.setWalkFrom({ x: 300, y: 353 - (H.STAND || 128), z: 300, lvl: 'G', seat: 0 });
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
      const perPerson = await page.evaluate(() => Object.fromEntries(Object.entries(HouseFamily.chars).map(([id, c]) => [id, c.rig.tris+(c.rig.shadow.geometry.index?.count||c.rig.shadow.geometry.attributes.position.count)/3])));
      console.log('  per-person Low triangles: ' + JSON.stringify(perPerson));
      for (const [id, count] of Object.entries(perPerson)) assert(count <= 3000, id + ' exceeds the Low/Potato 3k triangle budget: ' + count);
      console.log(`  draws: kitchen at tea time ${withFam.calls} calls with the family, ${without.calls} without (+${extra}); +${tris} triangles (low tier)`);
      assert(extra <= 6, 'Each person costs at most two draw calls: +' + extra);
      assert(tris <= 3 * 3000, 'Triangle budget (people v2: about 3k each on Low, docs/PEOPLE.md): +' + tris);
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
      await look(page, [60, 73 - EYE, 175], [178, 73 - 150, 196], 'U');
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

  // ---------------------------------------------------------------- Mom's entrance: behind the shut door, knock, door opens, she walks in
  // Never visible before the door opens; the door opens before she's in the room; you're held in your room meanwhile.
  await check('entrance', async () => {
    const { browser, page, until, errors } = await house({ account: 'Enter' + Date.now().toString(36), password: pass, opening: true });
    try {
      await until(() => !!st.getState() && !!House.THINGS['st.diary']);
      await page.evaluate(() => { House._.setMode('walk'); House.interact('gb'); });
      await until(() => window.RoomTV?.open_);
      await page.evaluate(() => RoomTV.playPhysical('gb.blocks'));
      await until(() => RoomTV._dbg()?.st === 'game'); await page.keyboard.press('Enter'); await page.keyboard.press('ArrowLeft');
      await until(() => !!st.getState()?.done.lad);
      await page.keyboard.press('q'); await until(() => House.mode === 'walk' && !House.gliding);
      // stand in the room looking at the door
      await look(page, [-30, 73 - EYE, 190], [240, 73 - 115, 190], 'U');
      assert.equal(await page.evaluate(() => House.DOORS.bedroom.open), false, 'The bedroom door starts shut');
      await page.evaluate(() => { const F = HouseFamily, m = F.chars.mom; window.__ent = []; window.__entT = setInterval(() => { const e = F.debug.entrance().mom; window.__ent.push({ seen: F.debug.seen('mom'), door: House.DOORS.bedroom.open, phase: e?.phase || null, inRoom: m.present && m.lvl === 'U' && m.x < 238 && m.z < 252 }); }, 50); });
      const log = [], t0 = Date.now(); let held = null, n = 0;
      while (Date.now() - t0 < 120000 * SCALE) {
        const f = await page.evaluate(() => { const F = HouseFamily, m = F.chars.mom, e = F.debug.entrance().mom; return { seen: F.debug.seen('mom'), door: House.DOORS.bedroom.open, phase: e?.phase || null, present: m.present, x: m.x, z: m.z, lvl: m.lvl, room: m.room, spot: m.goal?.spotKey || null, step: m.cur?.k || null, held: F.doorHeld(), blocks: F.blocks(250, 190, 'U') }; });
        log.push(f);
        if (held === null && (f.phase === 'come' || f.phase === 'knock')) held = f.held && f.blocks;
        if (n < 6 && (f.phase === 'knock' || f.phase === 'enter')) await shot(page, 'entrance-' + (++n)); // (a frame strip of the entrance)
        if (f.spot === 'bedDoorMom' && f.step === 'act') break;
        await page.waitForTimeout(120);
      }
      await page.waitForTimeout(900); await shot(page, 'entrance-4');
      const rec = await page.evaluate(() => { clearInterval(window.__entT); return window.__ent; });
      log.length = 0; log.push(...rec);
      const first = log.findIndex(f => f.seen), opened = log.findIndex(f => f.door), inRoom = log.findIndex(f => f.inRoom);
      console.log(`  entrance: ${log.length} samples; first seen #${first}, door opened #${opened}, in the room #${inRoom}; phases ${[...new Set(log.map(f => f.phase))].join('>')}`);
      assert(opened >= 0 && inRoom >= 0, 'Mom came in: ' + JSON.stringify(log.slice(-3)));
      assert(log.every(f => !f.seen || f.door), 'Mom was visible before the door opened: ' + JSON.stringify(log.find(f => f.seen && !f.door)));
      assert(opened < inRoom, 'The door opened before she came in');
      assert(held === true, 'The doorway is held (and the door) while Mom comes up');
      await page.waitForTimeout(3500);
      assert.equal(await page.evaluate(() => HouseFamily.doorHeld()), false, 'Released once she has arrived and spoken');
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // ---------------------------------------------------------------- talking to them in the middle of every job they do
  // They stop, turn (feet and all) to face you, keep one-handed things, put two-handed things down, then go back to it.
  await check('interrupt', async () => {
    const { browser, page, errors } = await veteran();
    try {
      const acts = await page.evaluate(() => HouseFamily.debug.acts());
      const bad = []; let n = 0;
      for (const [id, list] of Object.entries(acts)) for (const ka of list) {
        const [spot, act] = ka.split(':');
        const r = await page.evaluate(({ id, spot, act }) => {
          const F = HouseFamily, H = House, c = F.chars[id];
          F.debug.clock({ md: 1016, dow: 6, t: 14 }); for (const o of ['mom', 'dad', 'sister']) if (o !== id) F.debug.go(o, null);
          F.debug.go(id, spot, act || undefined); F.debug.place(id, spot); F.debug.sim(5, 0.1);
          // where the player stands: 1.4 m away on clear floor, in front of them if possible
          const h = c.seated ? c.seated.face * Math.PI / 180 : c.h, cand = [];
          for (let i = 0; i < 12; i++) { const a = h + i * Math.PI / 6 * (i % 2 ? 1 : -1) * Math.ceil(i / 2) / Math.max(1, Math.ceil(i / 2)); cand.push([c.x + Math.sin(h + (i ? (i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI / 6 : 0)) * 140, c.z + Math.cos(h + (i ? (i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI / 6 : 0)) * 140]); void a; }
          const ok = ([x, z]) => { if (NPCNav.clear(c.lvl, x, z) < NPCNav.NEED) return false; const r = NPCNav.route({ lvl: c.lvl, x: c.x, z: c.z }, { lvl: c.lvl, x, z }); return !!r && r.len < 230 && !r.doors.length; }; // (in the same room: walkable and a short walk away)
          for (const d of [110, 90]) for (let i = 0; i < 12; i++) { const a = h + (i ? (i % 2 ? 1 : -1) * Math.ceil(i / 2) * Math.PI / 6 : 0); cand.push([c.x + Math.sin(a) * d, c.z + Math.cos(a) * d]); }
          const p = cand.find(ok) || cand[0];
          const y = H.LV[c.lvl] - 150;
          H.hush(); H.setWalkFrom({ x: p[0], y, z: p[1], lvl: c.lvl, seat: 0 });
          Object.assign(H.P, { x: p[0], y, z: p[1], rx: -8, ry: Math.atan2(c.x - p[0], -(c.z - p[1])) * 180 / Math.PI, seat: 0, lvl: c.lvl }); H._.setMode('walk'); H.dirty();
          return { p, seated: !!c.seated, act: c.rig.st.action };
        }, { id, spot, act });
        await page.waitForTimeout(500);
        // Test each pose with a fresh line; cooldown/history behavior has its own regressions.
        await page.evaluate(id => { HouseFamily.chars[id].said = {}; HouseFamily.talk(id); }, id);
        await page.waitForTimeout(2200);
        const m = await page.evaluate(({ id }) => {
          const c = HouseFamily.chars[id], rig = c.rig, W = new THREE.Vector3(), pl = House.W;
          const want = Math.atan2(pl.x - c.x, pl.z - c.z), off = Math.abs(((want - c.h) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI) * 180 / Math.PI;
          const ch = rig.bones.chest.getWorldPosition(new THREE.Vector3()), hands = ['handL', 'handR'].map(b => rig.bones[b].getWorldPosition(W).distanceTo(ch));
          const feet = rig.st.feet.map(f => Math.abs(f.y - (rig.st.y)));
          return { off, seated: !!c.seated, hold: c.hold, engage: rig.st.engage, hands, feet, lvl: c.lvl };
        }, { id });
        await shot(page, `talk-${id}-${spot}-${act || 'idle'}`); n++;
        const S = await page.evaluate(id => HouseFamily.chars[id].rig.S.H, id);
        const why = [];
        if (!m.engage) why.push('not engaged');
        if (!m.seated && m.off > 30) why.push('facing ' + m.off.toFixed(0) + ' deg away');
        if (!m.seated && (Math.min(...m.feet) > 2 || Math.max(...m.feet) > 12)) why.push('feet off the floor ' + m.feet.map(v => v.toFixed(1))); // (one foot may be mid-step as they turn to you)
        if (m.hands.some(v => v > S * 0.42)) why.push('hands far from the body ' + m.hands.map(v => v.toFixed(0)));
        if (why.length) bad.push(id + ' ' + spot + ':' + (act || '') + ': ' + why.join(', '));
        await page.evaluate(id => { const F = HouseFamily, c = F.chars[id], sp = F.debug.speech; sp.q.length = 0; sp.cur = null; c.hold = 0; c.talking = false; c.rig.hush(); }, id);
      }
      console.log(`  interrupt: talked to them during ${n} jobs`);
      // personal space: you can't walk right up into Mom's face; talk to her from too close (in the open hall) and she
      // steps back half a pace, then goes back to her spot afterwards
      const ps = await page.evaluate(() => {
        const F = HouseFamily, H = House, c = F.chars.mom; F.debug.go('mom', 'hallStairs'); F.debug.place('mom', 'hallStairs'); F.debug.sim(4, 0.1);
        const home = { x: c.x, z: c.z }, px = c.x, pz = c.z + 52, y = H.LV[c.lvl] - 150;
        H.hush(); H.setWalkFrom({ x: px, y, z: pz, lvl: c.lvl, seat: 0 }); Object.assign(H.P, { x: px, y, z: pz, rx: -8, ry: 180, seat: 0, lvl: c.lvl }); H._.setMode('walk');
        return { home, blocked: F.blocks(c.x, c.z + 45, c.lvl), close: Math.hypot(H.W.x - c.x, H.W.z - c.z) };
      });
      assert(ps.blocked, 'Personal space: you can\'t step in to 45 cm from Mom');
      await page.evaluate(() => HouseFamily.talk('mom')); await page.waitForTimeout(2500);
      const [back, dbg] = await page.evaluate(() => { const c = HouseFamily.chars.mom; return [Math.hypot(House.W.x - c.x, House.W.z - c.z), JSON.stringify({ hold: c.hold, bo: c.backoff, bh: c.backHome, x: c.x, z: c.z, w: [House.W.x, House.W.z], cl: NPCNav.clear(c.lvl, c.x, c.z), cur: c.cur?.k })]; });
      await shot(page, 'talk-too-close');
      assert(back > ps.close + 15, 'She stepped back half a pace when talked to from too close: ' + ps.close.toFixed(0) + ' -> ' + back.toFixed(0) + ' ' + dbg);
      await page.evaluate(() => { const F = HouseFamily, c = F.chars.mom, sp = F.debug.speech; sp.q.length = 0; sp.cur = null; c.hold = 0.01; c.talking = false; c.rig.hush(); });
      await page.waitForTimeout(3500);
      const ret = await page.evaluate(h => { const c = HouseFamily.chars.mom; return Math.hypot(c.x - h.x, c.z - h.z); }, ps.home);
      assert(ret < 8, 'Back on her spot afterwards: ' + ret.toFixed(1));
      assert.deepEqual(bad, [], 'Talking mid-job: ' + bad.join(' | '));
      await page.evaluate(() => { for (const id of ['mom', 'dad', 'sister']) HouseFamily.debug.go(id, null); HouseFamily.debug.clock(null); });
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // ---------------------------------------------------------------- R104: Dad coming up to Jack's room while you stand by the door
  // (owner, 28 October: Dad parked in the open doorway repeating the same joke; Mom repeating too). Scene lines play once,
  // no line repeats within a minute however often you press F, nobody idles in the doorway, you can walk out in 10 s.
  await check('loop', async () => {
    const { browser, page, errors } = await veteran();
    try {
      await page.evaluate(() => { const F = HouseFamily; F.debug.clock({ md: 1012, dow: 2, t: 18.1 }); F.debug.go('mom', 'hob'); F.debug.place('mom', 'hob'); F.debug.go('sister', 'sofaR'); F.debug.place('sister', 'sofaR'); F.debug.sim(2, 0.1); });
      await look(page, [212, 73 - 128, 186], [100, 73 - 130, 186], 'U');
      await page.evaluate(() => { const S = HouseFamily.debug.speech; let last = null; window.__said = []; window.__sayT = setInterval(() => { const c = S.cur; if (c && c !== last) { last = c; window.__said.push({ who: c.c.id, id: c.lineId, t: Date.now() }); } }, 60); });
      await page.evaluate(() => HouseFamily.debug.scene('dad', 'bedDad'));
      const t0 = Date.now();
      while (Date.now() - t0 < 45000 * SCALE) { // (pressing F at him every few seconds, the way you would to get past)
        await page.waitForTimeout(2500);
        await page.evaluate(() => { const d = HouseFamily.chars.dad; if (d.present && d.lvl === 'U' && Math.hypot(d.x - House.W.x, d.z - House.W.z) < 260) HouseFamily.talk('dad'); });
      }
      const said = await page.evaluate(() => { clearInterval(window.__sayT); return window.__said; });
      const rep = said.filter((a, i) => said.some((b, j) => j < i && b.who === a.who && b.id === a.id && a.t - b.t < 60000));
      const dad = await page.evaluate(() => { const d = HouseFamily.chars.dad, b = House.DOORS.bedroom.closedBounds; return { x: d.x, z: d.z, lvl: d.lvl, inDoor: d.x > b.x0 - 12 && d.x < b.x1 + 12 && d.z > b.z0 - 12 && d.z < b.z1 + 12, held: HouseFamily.doorHeld(), hold: d.hold, step: d.cur?.k, goal: d.goal?.key, entrance: HouseFamily.debug.entrance().dad, door: House.DOORS.bedroom.open }; });
      console.log('  Dad scene state: ' + JSON.stringify(dad));
      console.log(`  loop: ${said.length} lines (${said.map(s => s.who + ':' + s.id).join(', ')}); Dad at ${Math.round(dad.x)},${Math.round(dad.z)} in the doorway: ${dad.inDoor}`);
      await shot(page, 'loop-dad-in-room');
      await look(page, [-40, 73 - 128, 120], [dad.x, 73 - 140, dad.z], 'U');
      await shot(page, 'loop-dad-oblique');
      for (const [width, height] of [[390, 844], [844, 390], [768, 1024], [1024, 768]]) {
        await page.setViewportSize({ width, height }); await page.waitForTimeout(350);
        await shot(page, `loop-dad-${width}x${height}`);
      }
      await page.setViewportSize({ width: 1366, height: 860 });
      assert.deepEqual(rep.map(r => r.who + ':' + r.id), [], 'A line repeated within a minute');
      assert(!dad.inDoor, 'Dad is not standing about in the doorway: ' + JSON.stringify(dad));
      assert(!dad.held, 'Nothing holds you in');
      // walk out of the room onto the landing
      await look(page, [212, 73 - 128, 186], [330, 73 - 128, 186], 'U');
      await page.keyboard.down('w'); let out = false;
      for (let i = 0; i < 40 && !out; i++) { await page.waitForTimeout(250); out = await page.evaluate(() => House.W.x > 262); }
      await page.keyboard.up('w');
      assert(out, 'You can walk out of your room within 10 s: ' + JSON.stringify(await page.evaluate(() => [House.W.x, House.W.z])));
      await look(page, [-40, 73 - 128, 120], [-160, 73 - 128, 120], 'U');
      await page.evaluate(() => HouseFamily.debug.sim(30, 0.1));
      const arrived = await page.evaluate(() => HouseFamily.debug.dump().find(c => c.id === 'dad'));
      assert(arrived.room === 'bedroom' && arrived.step === 'act', 'Dad completes his entrance once you give him room: ' + JSON.stringify(arrived));
      await look(page, [-40, 73 - 128, 205], [arrived.x, 73 - 140, arrived.z], 'U');
      await shot(page, 'loop-dad-arrived');
      await page.evaluate(() => { HouseFamily.debug.scene('dad', null); for (const id of ['mom', 'dad', 'sister']) HouseFamily.debug.go(id, null); HouseFamily.debug.clock(null); });
      assert.deepEqual(errors, []);
    } finally { await browser.close(); }
  });

  // ---------------------------------------------------------------- R99: people passing each other in the kitchen and hall
  await check('space', async () => {
    const { browser, page, errors } = await veteran();
    try {
      const r = await page.evaluate(() => {
        const F = HouseFamily, radii = {mom:22,dad:25,sister:18}, out = {min:999, overlaps:[], stuck:0, arrivals:[]};
        F.debug.clock({md:1012,dow:2,t:18.1});
        for (const [id, spot] of [['mom','hob'],['sister','kmug2'],['dad','gardenLook']]) { F.debug.go(id,spot); F.debug.place(id,spot); }
        F.debug.sim(3,.1);
        const sample = states => {
          const present = states.filter(c => c.present);
          for(let i=0;i<present.length;i++)for(let j=i+1;j<present.length;j++){
            const a=present[i],b=present[j];if(a.lvl!==b.lvl)continue;
            const distance=Math.hypot(a.x-b.x,a.z-b.z),need=radii[a.id]+radii[b.id];
            out.min=Math.min(out.min,distance-need);
            if(distance<need-1&&out.overlaps.length<12)out.overlaps.push([a.id,b.id,distance,need, out.phase, ...[a,b].map(c=>({state:c,route:F.chars[c.id].cur&&{k:F.chars[c.id].cur.k,s:F.chars[c.id].cur.s,hit:F.chars[c.id].cur.hit,why:F.chars[c.id].cur.why}}))]);
          }
          for(const c of present){const live=F.chars[c.id];live.__wait=c.step==='route'&&c.v<5?(live.__wait||0)+.1:0;if(live.__wait>out.stuck){out.stuck=live.__wait;out.stuckAt={id:c.id,phase:out.phase,hit:live.cur?.hit,states};}}
        };
        out.phase='kitchen-out';F.debug.go('dad','hallPost');F.debug.sim(75,.1,sample);out.arrivals.push(F.debug.dump().find(c=>c.id==='dad'));
        out.phase='kitchen-back';F.debug.go('dad','gardenLook');F.debug.go('sister','kmug1');F.debug.sim(75,.1,sample);out.arrivals.push(F.debug.dump().find(c=>c.id==='dad'));
        for(const [id,spot]of [['dad','hallPost'],['sister','hallYoyo']]){F.debug.go(id,spot);F.debug.place(id,spot);}F.debug.sim(2,.1);
        out.phase='hall-cross';F.debug.go('dad','hallYoyo');F.debug.go('sister','hallPost');F.debug.sim(90,.1,sample);
        out.arrivals.push(...F.debug.dump().filter(c=>c.id!=='mom'));
        return out;
      });
      console.log('  personal space: '+JSON.stringify(r));
      assert.deepEqual(r.overlaps,[],'Family bodies overlapped');
      assert(r.stuck<12,'Person-person avoidance left someone waiting: '+r.stuck);
      assert(r.arrivals.every((c,i)=>c.step==='act'&&c.goal===['debug.hallPost','debug.gardenLook','debug.hallYoyo','debug.hallPost'][i]),'Someone never reached their destination: '+JSON.stringify(r.arrivals));
      await look(page,[300,353-128,500],[250,353-100,420],'G');await shot(page,'space-hall-after');
      assert.deepEqual(errors,[]);
    } finally { await browser.close(); }
  });

  await check('budget', async () => {
    const {browser,page,errors}=await veteran();
    try {
      const counts=await page.evaluate(()=>{
        const out={};
        for(const tier of ['low','potato'])for(const kind of Object.keys(NPCRig.OUTFITS))for(const outfit of NPCRig.OUTFITS[kind]){
          const rig=NPCRig.create(kind,{tier,outfit});
          for(const near of [true,false]){rig.update(.1,near);const g=rig.shadow.geometry;out[[tier,kind,outfit,near?'near':'far'].join('.')]=rig.tris+(g.index?.count||g.attributes.position.count)/3;}
          rig.dispose();
        }
        return out;
      });
      console.log('  Low/Potato outfit triangles: '+JSON.stringify(counts));
      for(const[id,n]of Object.entries(counts))assert(n<=3000,id+' exceeds the 3k budget: '+n);
      assert.deepEqual(errors,[]);
    } finally {await browser.close();}
  });

  // ---------------------------------------------------------------- R102: actual production rigs, all four sides and close hip views
  await check('hips', async () => {
    const { browser, page, view, errors } = await veteran({tier:'high'});
    try {
      await page.evaluate(() => { HouseFamily.debug.hide(true); House.buildRoom(House.ROOMS.garden); });
      const fullView = async (eye,target) => { await view(eye,target,{level:'G'}); await page.evaluate(()=>{House.P.zm=(House.P.zm||1)*Math.tan(House.camera.fov*Math.PI/360)/Math.tan(Math.PI/6);House.dirty();});await page.waitForTimeout(250); };
      for(const id of ['mom','dad','sister']){
        const height=await page.evaluate(id=>{
          window.__hipProbe?.dispose();const rig=window.__hipProbe=NPCRig.create(id,{tier:'high',outfit:id==='dad'?'home':undefined});
          House.ROOMS.garden.group.add(rig.group);rig.floor=()=>353;rig.teleport(-70,353,-330,0);for(let i=0;i<30;i++)rig.update(1/60,true);House.dirty();return rig.S.hip;
        },id);
        for(const [name,a]of (process.env.HIP_SIZES_ONLY ? [] : [['front',0],['right',Math.PI/2],['back',Math.PI],['left',-Math.PI/2]])){
          await fullView([-70+Math.sin(a)*180,353-90,-330+Math.cos(a)*180],[-70,353-90,-330]);
          await shot(page,'hips-'+id+'-'+name);
        }
        await page.evaluate(()=>{House.P.zm=1;House.dirty();});
        for(const [name,a]of (process.env.HIP_SIZES_ONLY ? [] : [['front',0],['side',Math.PI/2],['back',Math.PI]])){
          await view([-70+Math.sin(a)*95,353-height,-330+Math.cos(a)*95],[-70,353-height,-330],{level:'G'});
          await shot(page,'hips-'+id+'-close-'+name);
        }
        for(const [w,h]of [[390,844],[844,390],[768,1024],[1024,768]]){
          await page.setViewportSize({width:w,height:h});await fullView([-70,353-90,-150],[-70,353-90,-330]);await shot(page,`hips-${id}-${w}x${h}`);
        }
        await page.setViewportSize({width:1366,height:860});
      }
      await page.evaluate(()=>window.__hipProbe.dispose());
      assert.deepEqual(errors,[]);
    } finally { await browser.close(); }
  });

  // Close clothing checks through the production walk cycle and seated blend.
  await check('hip-motion', async () => {
    const {browser,page,view,errors}=await veteran({tier:'high'});
    try {
      await page.evaluate(()=>{HouseFamily.debug.hide(true);House.buildRoom(House.ROOMS.garden);});
      for(const id of ['mom','dad','sister']){
        await page.evaluate(id=>{
          window.__hipProbe?.dispose();const r=window.__hipProbe=NPCRig.create(id,{tier:'high',outfit:id==='dad'?'home':undefined});
          House.ROOMS.garden.group.add(r.group);r.floor=()=>353;r.teleport(-70,353,-330,0);r.update(.1,true);window.__hipFrame=0;
        },id);
        for(const phase of [15,30]){
          const h=await page.evaluate(phase=>{
            const r=window.__hipProbe;for(;window.__hipFrame<phase;window.__hipFrame++){const z=-330+(window.__hipFrame+1)*r.S.speed/60;r.root(-70,353,z,0,r.S.speed);r.update(1/60,true);}House.dirty();return{y:353-r.S.hip,z:r.st.z};
          },phase);
          for(const[name,a]of [['front',0],['side',Math.PI/2]]){
            await view([-70+Math.sin(a)*110,h.y,h.z+Math.cos(a)*110],[-70,h.y,h.z],{level:'G'});await shot(page,`hips-walk-${id}-${phase}-${name}`);
          }
        }
        const h=await page.evaluate(()=>{
          const r=window.__hipProbe,q=HouseFamily.debug.spots.sofaL.seat;r.teleport(-70,353,-330,0);r.set({seat:{h:q.h,back:q.back,knee:q.knee,table:q.table}});for(let i=0;i<90;i++)r.update(1/60,true);House.dirty();r.group.updateWorldMatrix(true,true);const hands=['L','R'].map(side=>r.group.worldToLocal(r.bones['hand'+side].getWorldPosition(new THREE.Vector3())).x);return {y:353-q.h-18,hands};
        });
        assert(h.hands[0]>0&&h.hands[1]<0,id+' crossed hands over the lap: '+h.hands);
        for(const[name,a]of [['front',0],['side',Math.PI/2]]){
          await view([-70+Math.sin(a)*130,h.y,-330+Math.cos(a)*130],[-70,h.y,-330],{level:'G'});await shot(page,`hips-seat-${id}-${name}`);
        }
      }
      await page.evaluate(()=>window.__hipProbe.dispose());assert.deepEqual(errors,[]);
    }finally{await browser.close();}
  });

  // ---------------------------------------------------------------- portraits: idle, walking and talking, several angles
  await check('shots', async () => {
    const { browser, page, errors } = await veteran({ tier: 'high' });
    try {
      await page.evaluate(() => { const F = HouseFamily; F.debug.clock({ md: 1012, dow: 2, t: 18.1 }); F.debug.go('mom', 'hallStairs'); F.debug.place('mom', 'hallStairs'); F.debug.go('dad', 'carStory'); F.debug.place('dad', 'carStory'); F.debug.go('sister', 'hallYoyo'); F.debug.place('sister', 'hallYoyo'); F.debug.sim(3, 0.1); });
      const G = 353;
      const views = {
        mom: [[[250, G - EYE, 420], [246, G - 148, 560]], [[320, G - EYE, 680], [246, G - 148, 560]], [[296, G - 138, 470], [246, G - 150, 560]]],
        sister: [[[262, G - EYE, 560], [266, G - 113, 430]], [[300, G - EYE, 300], [266, G - 113, 430]], [[222, G - 123, 330], [266, G - 113, 430]]],
        dad: [[[300, G - EYE, 690], [318, G - 153, 800]], [[200, G - EYE, 900], [318, G - 153, 800]], [[255, G - 138, 735], [318, G - 158, 800]]],
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
      await look(page, [318, G - EYE, 740], [318, G - 150, 800], 'G');
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

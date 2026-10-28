// Exploratory QA playtest: node tests/qa-play.mjs [--quick] [--keep] [--only=name,name]
// Starts its own server on a free port with a fresh /tmp data directory (never production data), registers a veteran account
// (full room) and signs up a brand-new player (story chapter 1), and plays the house like a person: real E/F/Q/X presses at
// real aim points. Checks:
//   carry-matrix   every carryable thing: pick it up (E), put it on a surface (bed: middle/head/edge/foot, desk, sills,
//                  shelves, chest, bedside table, beanbag, chair, floors, kitchen counter/table, stairs = refused, car boot),
//                  pick it up again, walk away, Q returns it: it rests on a real support, visible and pickable
//   refresh        after a reload every placed thing is still where it was, visible and reachable
//   openables      every door/drawer/cupboard/boot opens and shuts with F while carrying, without dropping it
//   readers        magazine, diary, comic, catalogue, Game Lad: open from where they lie and from the hand, close with Q
//                  and with Esc: nothing left floating
//   rooms          walk every room (no errors, never inside a wall), talk to every family member who is home
//   plate          the toast plate on the duvet (including the former cat spot) stays visible and can always be picked up
//   watering       the watering can chore played like a new player (prompts, pour, progress)
//   story-odd      a new player does chapter 1 out of order (dishes first, refresh mid-way, the Game Lad last)
//   world-sweep    nothing below a floor, inside a wall, hidden in furniture or hanging in the air (any time, both accounts)
// --quick (the gate): a subset of things and surfaces. Screenshots: tests/shots/qa-play/ (fail-*.png on failure).
import assert from 'node:assert/strict';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const root = fileURLToPath(new URL('../', import.meta.url)), dir = root + 'tests/shots/qa-play/';
const SCALE=+process.env.QA_SCALE||Math.max(1,Math.min(4,os.loadavg()[0]/os.cpus().length*1.3));
const QUICK = process.argv.includes('--quick'), ONLY = (process.argv.find(a => a.startsWith('--only='))?.slice(7) || '').split(',').filter(Boolean);
let server, data, fixture, log = '';
const results = [], found = [];
async function cleanup() { if (fixture) await fixture.browser.close().catch(() => {}); if (server?.exitCode === null && server.signalCode === null) { const end = once(server, 'exit'); server.kill('SIGTERM'); await end; } if (data) await rm(data, {recursive: true, force: true}); }
for (const sig of ['SIGTERM', 'SIGINT']) process.once(sig, () => void cleanup().finally(() => process.exit(1)));
const watchdog = setTimeout(() => { console.error('QA play timed out'); void cleanup().finally(() => process.exit(1)); }, (QUICK ? 15 : 30) * 60000 * SCALE);
async function check(name, fn) {
  if (ONLY.length && !ONLY.includes(name)) return;
  const t0 = Date.now();
  try { await fn(); results.push([name, true]); console.log(`PASS ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`); }
  catch (e) { results.push([name, false]); console.log(`FAIL ${name}: ${String(e.stack || e).split('\n').slice(0, 4).join(' | ')}`); try { await fixture.page.screenshot({path: dir + 'fail-' + name + '.png'}); } catch (_) {} }
}
// soft assertions: collect every problem of a sweep, then fail once with all of them
function problems() { const list = []; return {add: (m, shot) => { list.push(m); console.log('  ! ' + m); if (shot) shot(); }, list, done(what) { assert(list.length === 0, list.length + ' ' + what + ' problem(s): ' + list.slice(0, 12).join(' || ')); }}; }

// ---------------------------------------------------------------- in-page helpers (installed after every load)
const helpers = () => {
  const H = House;
  window.__qa = {
    // the support under a resting thing (physics' view), and whether it is visible, reachable and pickable
    state(id) {
      const t = H.THINGS[id]; if (!t) return {missing: true};
      const a = t.at, r = H.ROOMS[a.room], out = {id, st: t.st, room: a.room, x: +a.x.toFixed(1), y: +a.y.toFixed(2), z: +a.z.toFixed(1), hide: !!a.hide, vis: !!t.obj.visible, held: H.held() === id};
      if (r) out.floor = H.LV[r.lvl];
      out.lost = H.lostWhy ? H.lostWhy(t) : null;
      if (t.st === 'rest' && !a.hide && H.physics.world) { const b = H.physics.body(id); if (b) { const s = H.physics.world.supportUnder(b, a.y - 0.5); out.support = +s.y.toFixed(2); out.gap = +(s.y - a.y).toFixed(2); } }
      let o = t.obj; for (; o; o = o.parent) if (!o.visible) break; out.drawn = !o || o === H.root || o === H.scene;
      return out;
    },
    // Real surface points for props whose origin lies in a hole/gap (paired
    // cutlery, handles, hollow crockery). E must still hit a visible triangle.
    targets(id) {
      const t=H.THINGS[id],out=[],inv=new H.T.Matrix4().copy(H.root.matrixWorld).invert();t.obj.updateWorldMatrix(true,true);
      t.obj.traverseVisible(o=>{if(out.length>=12||!o.isMesh||o.userData.contactShadow||o.userData.noPick||![].concat(o.material).some(m=>m.visible))return;const g=o.geometry,p=g?.attributes.position;if(!p)return;const index=g.index,n=index?index.count:p.count,m=new H.T.Matrix4().multiplyMatrices(inv,o.matrixWorld);
        for(const start of [0,Math.floor(n/6)*3]){if(start+2>=n)continue;const q=new H.T.Vector3();for(let k=0;k<3;k++)q.add(new H.T.Vector3().fromBufferAttribute(p,index?index.getX(start+k):start+k));q.multiplyScalar(1/3).applyMatrix4(m);out.push({x:q.x,y:q.y,z:q.z})}
      });return out;
    },
    // a standing point near (x, z) from which the crosshair lands on it (and on the thing tid, if given)
    stand(x, y, z, lvl, tid, avoid) {
      H.root.updateMatrixWorld(true);
      const eye = H.LV[lvl] - (H.STAND || 128);
      const ok = (sx, sz) => { if (!H._.cellOk(lvl, sx, sz)) return false; for (const dx of [-8, 8]) for (const dz of [-8, 8]) if (!H._.cellOk(lvl, sx + dx, sz + dz)) return false; return true; };
      this.why = [];
      for (const d of [75, 60, 95, 115, 50, 140, 40, 170]) for (let k = 0; k < 16; k++) {
        const ang = (k * 22.5 + (avoid || 0)) * Math.PI / 180, sx = x + Math.sin(ang) * d, sz = z + Math.cos(ang) * d;
        if (!ok(sx, sz)) continue;
        H.setWalkFrom({x: sx, y: eye, z: sz, lvl, seat: 0}); H.W.vx = H.W.vz = 0;
        Object.assign(H.P, {x: sx, y: eye, z: sz, rx: Math.atan2(-(y - eye), Math.hypot(x - sx, z - sz)) * 180 / Math.PI, ry: Math.atan2(x - sx, -(z - sz)) * 180 / Math.PI});
        H.visCalc();
        const heldObj = H.held() && H.THINGS[H.held()].obj;
        const hit = H.pick(innerWidth / 2, innerHeight / 2, {skip: m => { for (let o = m; o; o = o.parent) if (o === heldObj || o.userData.noPick) return true; return false; }, far: 400});
        if (this.why.length < 6) this.why.push(hit ? [Math.round(sx), Math.round(sz), hit.spot || hit.obj.name || '?', Math.round(hit.p.x), Math.round(hit.p.y), Math.round(hit.p.z)].join(' ') : 'none');
        if (!hit) continue;
        if (tid) { let mine = hit.spot === tid; if (!mine) for (let o = hit.obj; o; o = o.parent) if (o === H.THINGS[tid].obj) { mine = true; break; } if (!mine) continue; }
        else if (Math.hypot(hit.p.x - x, hit.p.z - z) > 14 || Math.abs(hit.p.y - y) > 12) continue;
        return {x: sx, z: sz, d, hit: hit.spot};
      }
      return null;
    },
    // a free point near (x, z) on the same surface: nothing else resting within reach of the carried thing's footprint
    free(room, x, y, z, id) {
      const me = H.THINGS[id] || {hx: 10, hz: 10}, R = Math.max(me.hx, me.hz);
      for (let d = 0; d <= 45; d += 7.5) for (let k = 0; k < (d ? 8 : 1); k++) {
        const px = x + Math.sin(k * 0.785) * d, pz = z + Math.cos(k * 0.785) * d;
        if (Object.values(H.THINGS).some(t => t !== me && t.at.room === room && !t.at.hide && ['rest', 'snap'].includes(t.st) && Math.abs(t.at.y - y) < 25 && Math.hypot(t.at.x - px, t.at.z - pz) < R + Math.max(t.hx, t.hz) + 4)) continue;
        return {x: px, z: pz};
      }
      return {x, z};
    },
    // a clear patch of floor in a room (no thing within r cm)
    clear(room, r = 40) {
      const R = H.ROOMS[room], fy = H.LV[R.lvl];
      for (const a of R.area) for (let x = a[0] + 30; x < a[2] - 30; x += 15) for (let z = a[1] + 30; z < a[3] - 30; z += 15) {
        // A floor patch needs its own clearance and a reachable standing point,
        // not a 120 cm walking circle (the furnished bedroom has none).
        if (!H._.cellOk(R.lvl, x, z)) continue;
        if (Object.values(H.THINGS).some(t => t.at.room === room && !t.at.hide && ['rest','snap'].includes(t.st) && Math.abs(t.at.y-fy)<5 && Math.hypot(t.at.x - x, t.at.z - z) < r + Math.max(t.hx, t.hz))) continue;
        if (!this.stand(x, fy, z, R.lvl)) continue;
        return {x, y: fy, z};
      }
      return null;
    },
    // every thing at rest that is drawn somewhere nobody could see or reach it
    sweep() {
      const bad = [];
      for (const id in H.THINGS) {
        const t = H.THINGS[id]; if (t.st !== 'rest' || t.at.hide || !H.ROOMS[t.at.room]?.built) continue;
        const s = this.state(id);
        if (s.lost) bad.push(id + ': ' + s.lost + ' ' + JSON.stringify([s.room, s.x, s.y, s.z]));
        else if (s.y > s.floor + 0.5) bad.push(id + ': below the floor ' + s.y);
        else if (s.gap > 1.5 && !(t.home && Math.hypot(t.at.x - t.home.x, t.at.y - t.home.y, t.at.z - t.home.z) < 1)) bad.push(id + ': hanging ' + s.gap.toFixed(1) + ' cm above its support at ' + JSON.stringify([s.room, s.x, s.y, s.z]));
      }
      return bad;
    },
  };
};

try {
  await mkdir(dir, {recursive: true}); data = await mkdtemp('/tmp/jhp-qa-play-');
  const port = await new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
  server = spawn(process.execPath, ['server.js'], {cwd: root + 'app', env: {...process.env, PORT: String(port), DATA_DIR: data, ADMIN_TOKEN: 'testtoken'}, stdio: ['ignore', 'pipe', 'pipe']});
  for (const out of [server.stdout, server.stderr]) out.on('data', c => log += c);
  for (let i = 0; i < 300 && !log.includes(`online at :${port}`) && server.exitCode === null; i++) await new Promise(r => setTimeout(r, 100));
  assert(log.includes(`online at :${port}`), 'Server did not start: ' + log.slice(-800));
  const base = `http://127.0.0.1:${port}`, password = 'Throwaway-1999', veteran = 'Qavet' + Date.now().toString(36);
  assert((await fetch(base + '/admin/register', {method: 'POST', headers: {'X-Admin-Token': 'testtoken', 'Content-Type': 'application/json'}, body: JSON.stringify({name: veteran, pass: password})})).ok);
  fixture = await roomFixture(base, {account: veteran, password, signup: false,timeoutScale:SCALE});
  let {page: p, errors, until} = fixture;p.setDefaultTimeout(30000*SCALE);
  const shot = name => p.screenshot({path: dir + name + '.png',timeout:60000*SCALE}).catch(() => {});
  const ready = async () => {
    await p.evaluate(helpers);
    await p.evaluate(async () => { await Room.ensureHouse(); for (const id of ['landing', 'hall', 'kitchen', 'lounge', 'drive']) if (House.ROOMS[id]) House.buildRoom(House.ROOMS[id]); await Chores.load(); for (const a of ['bedroom', 'kitchen', 'lounge', 'drive']) await Chores.part(a).catch(() => {}); });
    await until(() => window.HouseRooms?.ready && !!House.physics.world);
    await until(() => House.physics.awake === 0);
  };
  await ready();
  const state = id => p.evaluate(id => __qa.state(id), id);
  const settleAll = () => until(() => House.physics.awake === 0 && !House.held() || House.physics.awake === 0);
  async function standAt(x, y, z, lvl, tid, avoid) { const s = await p.evaluate(a => __qa.stand(...a), [x, y, z, lvl, tid || null, avoid || 0]); if (s) await p.evaluate(() => { House._.setMode('walk'); House.dirty(); }); await p.waitForTimeout(250); return s; }
  async function pickUp(id) { // like a player: stand where you can see it, aim at it, press E
    if (await p.evaluate(id => House.held() === id, id)) return true;
    const t = await state(id); if (t.missing || t.hide) return false;
    const lvl = await p.evaluate(r => House.ROOMS[r].lvl, t.room);
    let s = await standAt(t.x, t.y - 1, t.z, lvl, id);
    if(!s)for(const q of await p.evaluate(id=>__qa.targets(id),id)){s=await standAt(q.x,q.y,q.z,lvl,id);if(s)break;}
    if (!s) { if (process.env.QA_DEBUG) console.log('  unreachable ' + id + ' ' + JSON.stringify(t) + ' hits: ' + JSON.stringify(await p.evaluate(a => { const H = House, out = []; for (const d of [75, 95]) for (let k = 0; k < 16; k += 4) { const ang = k * 22.5 * Math.PI / 180, sx = a.x + Math.sin(ang) * d, sz = a.z + Math.cos(ang) * d; if (!H._.cellOk(a.lvl, sx, sz)) { out.push('x'); continue; } const eye = H.LV[a.lvl] - 128; H.setWalkFrom({x: sx, y: eye, z: sz, lvl: a.lvl, seat: 0}); Object.assign(H.P, {x: sx, y: eye, z: sz, rx: Math.atan2(-(a.y - eye), Math.hypot(a.x - sx, a.z - sz)) * 180 / Math.PI, ry: Math.atan2(a.x - sx, -(a.z - sz)) * 180 / Math.PI}); H.visCalc(); const h = H.pick(innerWidth / 2, innerHeight / 2, {far: 400}); out.push(h ? (h.spot || h.obj.name || h.obj.type) + '@' + [h.p.x, h.p.y, h.p.z].map(Math.round) : 'none'); } return out; }, {...t, lvl}))); return 'unreachable'; }
    await p.keyboard.press('e');
    for (let i = 0; i < 20 && !await p.evaluate(id => House.held() === id, id); i++) await p.waitForTimeout(100);
    return p.evaluate(id => House.held() === id, id);
  }
  // ---------------------------------------------------------------- the surfaces to try (computed from the rooms themselves)
  const surfaces = await p.evaluate(() => {
    const H = House, out = [];
    const add = (name, room, x, y, z, expect = 'ok') => { const r = H.ROOMS[room]; if (r) out.push({name, room, lvl: r.lvl, x, y, z, expect}); };
    // the bed: middle, head, side, foot and the former cat spot (now clear).
    add('bed-middle', 'bedroom', 185, 30, 20); add('bed-head', 'bedroom', 195, 30, -15); add('bed-edge', 'bedroom', 158, 30, 40); add('bed-foot', 'bedroom', 215, 30, 125);
    add('bed-former-cat-spot', 'bedroom', 206, 30, 72); // Gubbinz now sleeps on the cat tree.
    add('desk', 'bedroom', 50, 0, -25); add('bedside', 'bedroom', 122, 21.6, -40); add('chest', 'bedroom', -258, -9, 222); add('tv-cabinet', 'bedroom', -175, 27.4, -30);
    add('windowsill', 'bedroom', 0, H.ROOMS.bedroom.supports.find(s => s.z0 < -60 && s.y < 0 && s.x1 - s.x0 > 100)?.y ?? -30, -58);
    add('bedroom-floor', 'bedroom', -60, 73, 190); add('landing-floor', 'landing', 290, 73, 400);
    const st = H._.grids.stairs.find(s => s.x0 > 300); if (st) add('stairs', 'landing', (st.x0 + st.x1) / 2, st.y((st.x0 + st.x1) / 2, 275), 275, 'refuse');
    const GY = H.LV.G;
    add('kitchen-counter', 'kitchen', 50, GY - 93, -30); add('kitchen-table', 'kitchen', -60, GY - 76, 170); add('kitchen-floor', 'kitchen', 60, GY, 120);
    add('lounge-floor', 'lounge', 0, GY, 560); add('hall-floor', 'hall', 370, GY, 690);
    const bb = H.THINGS.beanbag; if (bb && !bb.at.hide) add('beanbag', bb.at.room, bb.at.x, bb.at.y - bb.h, bb.at.z);
    const c = H.ROOMS.drive?.carFrame; if (c) add('car-boot', 'drive', c.x, GY - 25 * c.s, c.z - 157 * c.s);
    return out;
  });
  console.log('Surfaces: ' + surfaces.map(s => s.name).join(', '));

  // ---------------------------------------------------------------- the toast plate on the bed (the owner's bug)
  await check('plate', async () => {
    const P = problems(), id = 'ch.m.plate';
    await p.evaluate(id => { const t = House.THINGS[id], c = __qa.clear('bedroom', Math.max(t.hx,t.hz)+2); if(!c)throw Error('No reachable floor patch for the toast plate'); t.canGrab = null; House.SPOTS[id].off = false; t.at = {room: 'bedroom', x: c.x, y: 73, z: c.z, ry: 0}; t.st = 'rest'; House.place(t); }, id);
    for (const s of surfaces.filter(s => s.name.startsWith('bed'))) {
      const got = await pickUp(id); if (got !== true) { P.add('could not pick the plate up before ' + s.name + ': ' + got); continue; }
      const f = s.expect === 'refuse' ? s : await p.evaluate(a => __qa.free(...a), [s.room, s.x, s.y, s.z, id]);
      const at = await standAt(f.x, s.y, f.z, 'U');
      if (!at) { P.add('no place to stand to aim at ' + s.name); continue; }
      const g = await p.evaluate(() => { const g = House.ghost(); return g && {ok: g.ok, why: g.why, x: +g.x.toFixed(1), y: +g.y.toFixed(1), z: +g.z.toFixed(1), W: [Math.round(House.W.x), Math.round(House.W.z)]}; });
      if (process.env.QA_DEBUG) console.log('  ghost on ' + s.name + ': ' + JSON.stringify(g) + ' stand ' + JSON.stringify(at));
      await p.keyboard.press('e'); await p.waitForTimeout(700); await settleAll();
      const st = await state(id);
      if (s.expect === 'refuse') { if (!st.held) P.add('the plate was put down under the cat (' + JSON.stringify(g) + ')', () => shot('plate-under-cat')); continue; }
      if (st.held) { P.add('E refused the plate on ' + s.name + ' (' + JSON.stringify(g) + ')'); continue; }
      // visible from a player's eye and pickable: stand somewhere else and aim at it
      await shot('plate-' + s.name);
      const back = await pickUp(id);
      if (back !== true) P.add('placed on ' + s.name + ' it cannot be picked up again (' + back + ') ' + JSON.stringify(st), () => shot('plate-lost-' + s.name));
      else { await p.keyboard.press('q'); await p.waitForTimeout(600); }
    }
    if (await p.evaluate(id => House.held() === id, id)) { await p.keyboard.press('q'); await p.waitForTimeout(500); }
    // and the plate's glaze is white on the carpet, not grey: its contact shadow lies under it
    const c = await p.evaluate(id => { const t = House.THINGS[id], c = __qa.clear('bedroom', Math.max(t.hx,t.hz)+2); if(!c)throw Error('No reachable floor patch for the toast plate'); t.at = {room: 'bedroom', x: c.x, y: 73, z: c.z, ry: 0}; t.st = 'rest'; House.place(t); return c; }, id);
    await fixture.view([c.x, 20, c.z + 40], [c.x, 73, c.z]); await shot('plate-floor');
    // the well, a little off-centre (between the crusts): sampled from the rendered frame
    const grey = await p.evaluate(async id => { const t = House.THINGS[id]; const c = House.toScreen(t.at.x + 4.5, t.at.y - 0.6, t.at.z - 3.5); House.ren.render(House.scene, House.camera); const url = House.ren.domElement.toDataURL(); const img = new Image(); await new Promise(r => { img.onload = r; img.src = url; }); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0); const k = img.width / innerWidth; return [...g.getImageData(Math.round(c.x * k), Math.round(c.y * k), 1, 1).data]; }, id).catch(e => (console.log('  (pixel read failed: ' + e.message + ')'), null));
    if (grey) { console.log('  plate well colour on the carpet: ' + grey.slice(0, 3)); if (Math.min(...grey.slice(0, 3)) < 150) P.add('the plate looks grey on the floor: ' + grey.slice(0, 3)); }
    await p.evaluate(id => { const t = House.THINGS[id]; t.at = {...t.home}; House.place(t); }, id);
    P.done('plate');
  });

  // ---------------------------------------------------------------- every carryable thing, every surface, Q back
  const things = await p.evaluate(() => Object.keys(House.THINGS).filter(id => { const t = House.THINGS[id]; const r = House.ROOMS[t.at.room]; return r?.built && ['rest', 'snap'].includes(t.st) && !t.at.hide && !(t.physics?.drag || t.drag) && !(t.canGrab && !t.canGrab()) && !House.SPOTS[id]?.off; }));
  const pickThings = QUICK ? things.filter((_, i) => i % Math.ceil(things.length / 10) === 0) : things;
  console.log(`Carryable things: ${things.length} (testing ${pickThings.length})`);
  const placed = {};
  await check('carry-matrix', async () => {
    const P = problems(); let n = 0;
    const tries = QUICK ? surfaces.filter(s => ['bed-middle', 'bed-head', 'desk', 'stairs', 'kitchen-counter', 'bedroom-floor', 'car-boot', 'windowsill'].includes(s.name)) : surfaces;
    for (const id of pickThings) {
      const label = await p.evaluate(id => { const l = House.THINGS[id].label; return typeof l === 'function' ? l() : l; }, id);
      const t0 = await state(id);
      const got = await pickUp(id);
      if (got !== true) { if (got === 'unreachable') console.log('  (harness could not find a line of sight to ' + id + ' (' + label + ') where it lies: ' + JSON.stringify([t0.room, t0.x, t0.y, t0.z]) + ')'); else if (!(await p.evaluate(id => House.THINGS[id].st === 'snap', id))) P.add(id + ' (' + label + ') E did not pick it up ' + JSON.stringify(t0)); continue; }
      // a surface for it (round-robin), and the stairs for every fifth thing
      const s = tries[n++ % tries.length];
      const lvlNow = await p.evaluate(() => House.W.lvl);
      if (s.lvl !== lvlNow && QUICK) { /* carry it there for real only in the full run */ }
      if (s.name === 'car-boot') await p.evaluate(() => { const b = House.ROOMS.drive.carBoot; if (!b.open) b.toggle(); });
      const f = s.expect === 'refuse' ? s : await p.evaluate(a => __qa.free(...a), [s.room, s.x, s.y, s.z, id]);
      const at = await standAt(f.x, s.y, f.z, s.lvl);
      if (!at && s.expect !== 'refuse') { console.log('  (skipped ' + s.name + ' for ' + id + ': no clear line of sight; saw ' + (await p.evaluate(() => __qa.why.slice(0, 2).join(' | '))) + ')'); await p.keyboard.press('q'); continue; }
      if (!at) { P.add('nowhere to stand to aim at ' + s.name + ' ' + JSON.stringify(f) + ' saw: ' + (await p.evaluate(() => __qa.why.join(' | ')))); await p.keyboard.press('q'); continue; }
      const g = await p.evaluate(() => { const g = House.ghost(); return g && {ok: g.ok, why: g.why, y: +g.y.toFixed(1), snap: g.snap && g.snap.id}; });
      await p.keyboard.press('e'); await p.waitForTimeout(500); await settleAll();
      let st = await state(id);
      if (s.expect === 'refuse') { if (!st.held && !g?.snap) P.add(id + ' was put down on the ' + s.name + ' ' + JSON.stringify(st), () => shot('refuse-' + s.name + '-' + id)); }
      else if (st.held) { if (!['solid', 'body', 'floor', 'path', 'player'].some(w => String(g?.why).startsWith(w))) P.add(id + ' refused on ' + s.name + ': ' + JSON.stringify(g)); }
      else {
        if (st.st === 'rest' && (st.lost || st.gap > 1.5 || !st.drawn || !st.vis)) P.add(id + ' on ' + s.name + ' is not resting visibly: ' + JSON.stringify(st), () => shot('lost-' + s.name + '-' + id));
        if (st.st === 'rest') placed[id] = st;
        // pick it up again from where it lies
        const again = await pickUp(id);
        if (again !== true && st.st === 'rest') P.add(id + ' put on ' + s.name + ' cannot be picked up again (' + again + ')', () => shot('nopick-' + s.name + '-' + id));
      }
      // Q: walk away (another standing point), then Q puts it back where it came from: resting on something, pickable
      if (await p.evaluate(id => House.held() === id, id)) {
        await standAt(t0.x + 120, t0.y, t0.z + 40, await p.evaluate(r => House.ROOMS[r].lvl, t0.room));
        await p.keyboard.press('q'); await p.waitForTimeout(600); await settleAll();
        st = await state(id);
        if (st.held) P.add(id + ' Q did not return it');
        else if (st.st === 'rest' && (Math.abs(st.gap) > 1 && !(Math.hypot(st.x - t0.x, st.y - t0.y, st.z - t0.z) < 1 && Math.abs((t0.gap ?? 0) - st.gap) < 0.5) || !st.vis)) P.add(id + ' after Q is floating/hidden: ' + JSON.stringify(st) + ' was ' + JSON.stringify(t0), () => shot('q-float-' + id));
        delete placed[id];
      }
    }
    // a few things left on the surfaces for the refresh check
    for (const [i, s] of surfaces.filter(s => s.expect === 'ok').slice(0, QUICK ? 4 : 10).entries()) {
      const id = pickThings[(i * 3 + 1) % pickThings.length];
      if ((await pickUp(id)) !== true) continue;
      if (!await standAt(s.x, s.y, s.z, s.lvl)) { await p.keyboard.press('q'); continue; }
      await p.keyboard.press('e'); await p.waitForTimeout(500); await settleAll();
      const st = await state(id); if (st.held) { await p.keyboard.press('q'); await p.waitForTimeout(400); continue; }
      if (st.st === 'rest') placed[id] = st;
    }
    P.done('carry');
  });

  await check('world-sweep', async () => { const bad = await p.evaluate(() => __qa.sweep()); assert.deepEqual(bad, [], 'Things out of reach'); });

  await check('refresh', async () => {
    const P = problems();
    await p.evaluate(() => { House.saveThings(true); House.saveWalkState(); });
    await p.waitForTimeout(800);
    await p.reload({waitUntil: 'domcontentloaded'});
    await until(() => window.House?.live && House.mode === 'walk' && !document.querySelector('.hs-loading,#houseEntry'));
    await ready();
    for (const [id, was] of Object.entries(placed)) {
      const st = await state(id);
      if (st.missing) { P.add(id + ' missing after refresh'); continue; }
      if (st.room !== was.room || Math.hypot(st.x - was.x, st.y - was.y, st.z - was.z) > 1.5) P.add(id + ' moved on refresh: ' + JSON.stringify([was.room, was.x, was.y, was.z]) + ' -> ' + JSON.stringify([st.room, st.x, st.y, st.z]));
      if (st.hide || !st.vis || st.lost) P.add(id + ' not reachable after refresh: ' + JSON.stringify(st));
      const got = await pickUp(id); if (got !== true) P.add(id + ' cannot be picked up after refresh (' + got + ')'); else { await p.keyboard.press('q'); await p.waitForTimeout(400); }
    }
    const bad = await p.evaluate(() => __qa.sweep()); for (const b of bad) P.add('after refresh: ' + b);
    P.done('refresh');
  });

  await check('openables', async () => {
    const P = problems();
    const carry = pickThings.find(id => !/^ch\.|st\./.test(id)) || pickThings[0];
    const list = await p.evaluate(() => [...Object.keys(House.OPEN).map(id => ({id, kind: 'open'})), ...Object.keys(House.DOORS).filter(id => House.DOORS[id].pivot && !House.DOORS[id].always).map(id => ({id, kind: 'door'}))].filter(o => { const s = House.SPOTS[o.kind === 'door' ? (House.SPOTS[o.id] ? o.id : 'door') : o.id]; return true; }));
    for (const o of QUICK ? list.slice(0, 8) : list) {
      if ((await pickUp(carry)) !== true) { P.add('could not carry ' + carry); break; }
      const tgt = await p.evaluate(o => {
        const H = House, obj = o.kind === 'door' ? H.DOORS[o.id].pivot : (H.OPEN[o.id].pick || H.OPEN[o.id].pivot);
        if (!obj) return null; const b = new H.T.Box3().setFromObject(obj), c = b.getCenter(new H.T.Vector3());
        const room = o.kind === 'door' ? H.DOORS[o.id].rooms[0] : (Object.values(H.ROOMS).find(r => r.group && (() => { let f = false; obj.traverseAncestors(a => { if (a === r.group) f = true; }); return f; })())?.id);
        const r = H.ROOMS[room]; if (!r) return null;
        return {x: c.x, y: -c.y, z: c.z, lvl: r.lvl, before: o.kind === 'door' ? H.DOORS[o.id].open : H.OPEN[o.id].open};
      }, o);
      if (!tgt) continue;
      let ok = false;
      for (const avoid of [0, 11, 33]) {
        const s = await p.evaluate(a => __qa.stand(...a), [tgt.x, tgt.y, tgt.z, tgt.lvl, null, avoid]).catch(() => null);
        if (!s) continue;
        await p.evaluate(() => { House._.setMode('walk'); House.hush(); }); await p.waitForTimeout(250);
        await p.keyboard.press('f'); await p.waitForTimeout(900);
        const now = await p.evaluate(o => o.kind === 'door' ? House.DOORS[o.id].open : House.OPEN[o.id].open, o);
        if (now !== tgt.before) { ok = true; await p.keyboard.press('f'); await p.waitForTimeout(900); break; }
      }
      const still = await p.evaluate(id => House.held() === id, carry);
      if (!ok) console.log('  (could not work ' + o.kind + ' ' + o.id + ' with F from a standing point)');
      if (ok && !still) { const why = await p.evaluate(id => ({st: House.THINGS[id].st, mode: House.mode, note: document.querySelector('.hs-note.on')?.textContent?.slice(0, 80) || '', inspect: !!document.querySelector('.hs-inspection')}), carry); if (why.st === 'inspect' || why.note || why.inspect || why.mode !== 'walk') console.log('  (' + o.id + ' opened a note/close-up, which sets things down: ' + JSON.stringify(why) + ')'); else P.add('working ' + o.id + ' dropped what you were carrying ' + JSON.stringify(why)); }
      await p.evaluate(() => { House.endInspect(); House.hush(); });
    }
    if (await p.evaluate(() => !!House.held())) { await p.keyboard.press('q'); await p.waitForTimeout(500); }
    P.done('openables');
  });

  await check('readers', async () => {
    const P = problems();
    const readers = await p.evaluate(() => Object.keys(House.THINGS).filter(id => { const t = House.THINGS[id]; return t.use && ['rest', 'snap'].includes(t.st) && !t.at.hide && House.ROOMS[t.at.room]?.built && (window.Magazines?.bindings?.has(id) || /diary|catalogue|comic|mag|gb$|vpet|phone/.test(id)); }));
    console.log('  readers: ' + readers.join(', '));
    for (const id of QUICK ? readers.slice(0, 4) : readers) for (const how of ['q', 'Escape']) for (const from of ['rest', 'hand']) {
      const t0 = await state(id);
      if (from === 'hand') { if ((await pickUp(id)) !== true) continue; }
      else { const lvl = await p.evaluate(r => House.ROOMS[r].lvl, t0.room); if (!await standAt(t0.x, t0.y - 1, t0.z, lvl, id)) continue; }
      await p.keyboard.press('f'); await p.waitForTimeout(1200);
      const open = await p.evaluate(() => House.mode === 'inspect' || !!window.Magazines?.reading || !!window.RoomTV?.open_);
      if (!open) { await p.evaluate(() => { House.hush(); }); if (from === 'hand') { await p.keyboard.press('q'); await p.waitForTimeout(500); } continue; }
      if (how === 'Escape') { await p.keyboard.press('Escape'); await p.waitForTimeout(400); const menu = await p.evaluate(() => !!window.HousePause?.open); if (menu) { await p.keyboard.press('Escape'); await p.waitForTimeout(300); } await p.keyboard.press('q'); }
      else await p.keyboard.press('q');
      await p.waitForTimeout(1200);
      if (await p.evaluate(() => House.mode === 'inspect' || !!window.RoomTV?.open_)) { await p.keyboard.press('q'); await p.waitForTimeout(1000); }
      let st = await state(id);
      if (from === 'hand' && st.held) { await p.keyboard.press('q'); await p.waitForTimeout(700); st = await state(id); }
      await settleAll(); st = await state(id);
      if (st.held && from === 'rest') P.add(id + ' read where it lay, closed with ' + how + ': still in your hands');
      else if (st.st === 'held' && !st.held) P.add(id + ' closed with ' + how + ' is stuck mid-air (st held, nobody holding it) ' + JSON.stringify(st), () => shot('reader-float-' + id));
      else if (st.st === 'rest' && (Math.abs(st.gap) > 1 || !st.vis)) P.add(id + ' closed with ' + how + ' (' + from + ') is floating/hidden ' + JSON.stringify(st), () => shot('reader-float-' + id));
      else if (!['rest', 'snap', 'held'].includes(st.st)) P.add(id + ' closed with ' + how + ' left in state ' + st.st);
      if (await p.evaluate(() => !!House.held())) { await p.keyboard.press('q'); await p.waitForTimeout(500); }
    }
    P.done('readers');
  });

  await check('rooms', async () => {
    const P = problems();
    const rooms = await p.evaluate(() => Object.values(House.ROOMS).filter(r => r.built && r.area?.length).map(r => { const a = r.area.reduce((b, q) => (q[2] - q[0]) * (q[3] - q[1]) > (b[2] - b[0]) * (b[3] - b[1]) ? q : b); return {id: r.id, lvl: r.lvl, x: (a[0] + a[2]) / 2, z: (a[1] + a[3]) / 2}; }));
    for (const r of rooms) {
      const s = await p.evaluate(r => { for (let d = 0; d < 260; d += 10) for (let k = 0; k < 8; k++) { const x = r.x + Math.sin(k * 0.785) * d, z = r.z + Math.cos(k * 0.785) * d; if (House._.cellOk(r.lvl, x, z)) { House.setWalkFrom({x, y: House.LV[r.lvl] - 128, z, lvl: r.lvl, seat: 0}); House._.setMode('walk'); House.visCalc(); return {x, z}; } } return null; }, r);
      if (!s) { P.add('no walkable floor found in ' + r.id); continue; }
      for (const key of ['w', 'd', 's', 'a']) { await p.keyboard.down(key); await p.waitForTimeout(QUICK ? 400 : 900); await p.keyboard.up(key); }
      const w = await p.evaluate(() => ({x: House.W.x, z: House.W.z, lvl: House.W.lvl, ok: House._.cellOk(House.W.lvl, House.W.x, House.W.z) || !!House._.floorAt(House.W.x, House.W.z, House.W.lvl, House.LV[House.W.lvl], 128)}));
      if (!w.ok) P.add('walking in ' + r.id + ' ended inside something: ' + JSON.stringify(w), () => shot('room-stuck-' + r.id));
      await shot('room-' + r.id);
    }
    // the family: talk (F) to everyone who is in the house
    const fam = await p.evaluate(() => window.HouseFamily ? Object.values(HouseFamily.chars).filter(c => c.present !== false && House.ROOMS[c.room || '']?.built !== false).map(c => ({id: c.id, x: c.x, z: c.z, lvl: c.lvl, present: c.present})) : []);
    console.log('  family: ' + fam.map(c => c.id + (c.present ? '' : '(away)')).join(', '));
    for (const c of fam.filter(c => c.present)) {
      const s = await standAt(c.x, (await p.evaluate(l => House.LV[l], c.lvl)) - 100, c.z, c.lvl, null);
      if (!s) { console.log('  (no line of sight to ' + c.id + ')'); continue; }
      await p.keyboard.press('f'); await p.waitForTimeout(1500);
      const said = await p.evaluate(() => HouseFamily.debug?.speech?.cur ? HouseFamily.debug.speech.cur.c.id : null);
      if (!said) console.log('  (' + c.id + ' did not answer F; may be busy)');
      await shot('talk-' + c.id); await p.evaluate(() => House.hush());
    }
    P.done('rooms');
  });

  await check('veteran-errors', async () => { assert.deepEqual(errors, [], 'Browser errors (veteran)'); });
  await fixture.browser.close(); fixture = null;

  // ---------------------------------------------------------------- a brand-new player: chapter 1 in odd orders
  const fresh = 'Qanew' + Date.now().toString(36);
  fixture = await roomFixture(base, {account: fresh, password, opening: true,timeoutScale:SCALE});
  ({page: p, errors, until} = fixture);p.setDefaultTimeout(30000*SCALE);
  await check('story-odd', async () => {
    const P = problems();
    await until(() => !!window.st?.getState() && !!House.THINGS['st.diary']);
    await ready();
    const cur = () => p.evaluate(() => st.current()?.id);
    console.log('  first step: ' + await cur());
    // dishes and clothes before the Game Lad: carry the plate/mug/bowl down to the sink, clothes in the basket
    const mess = await p.evaluate(() => Object.keys(House.THINGS).filter(id => id.startsWith('ch.m.') && !House.THINGS[id].at.hide && House.THINGS[id].st === 'rest'));
    console.log('  today\'s mess: ' + mess.join(', '));
    for (const id of mess.slice(0, QUICK ? 3 : 9)) {
      const kind = await p.evaluate(id => House.THINGS[id].kind, id);
      const snap = {'mess.dish': 'ch.s.sink', 'mess.clothes': 'ch.s.basket', 'mess.rubbish': 'ch.s.bin', 'mess.mag': 'ch.s.mags', 'mess.cd': 'ch.s.rack'}[kind];
      if ((await pickUp(id)) !== true) { P.add('new player cannot pick up ' + id); continue; }
      const s = await p.evaluate(sn => { const s = House.SNAPS[sn]; return s && {x: s.x, y: s.y, z: s.z, lvl: House.ROOMS[s.room].lvl}; }, snap);
      if (!s) { P.add('no slot ' + snap); await p.keyboard.press('q'); continue; }
      await standAt(s.x, s.y, s.z, s.lvl);
      await p.keyboard.press('e'); await p.waitForTimeout(900);
      const st = await state(id);
      if (st.held) { P.add(id + ' would not go into ' + snap + ' ' + JSON.stringify(await p.evaluate(() => { const g = House.ghost(); return g && {ok: g.ok, why: g.why, snap: g.snap?.id}; }))); await p.keyboard.press('q'); await p.waitForTimeout(400); }
      if (id === mess[1]) { // refresh half-way through the room
        await p.evaluate(() => { House.saveThings(true); House.saveWalkState(); }); await p.waitForTimeout(600);
        await p.reload({waitUntil: 'domcontentloaded'}); await until(() => window.House?.live && House.mode === 'walk' && !document.querySelector('.hs-loading,#houseEntry')); await ready();
      }
    }
    const bad = await p.evaluate(() => __qa.sweep()); for (const b of bad) P.add('new player: ' + b);
    // then the Game Lad, last
    await p.evaluate(() => { House._.setMode('walk'); House.interact('gb'); }); await p.waitForTimeout(1500);
    await p.keyboard.press('q'); await p.waitForTimeout(800); if (await p.evaluate(() => !!window.RoomTV?.open_)) { await p.keyboard.press('q'); await p.waitForTimeout(800); }
    console.log('  story now: ' + await cur() + ' done: ' + Object.keys(await p.evaluate(() => st.getState().done)).join(','));
    await shot('story-odd');
    P.done('story-odd');
  });

  await check('watering', async () => {
    // the plant chore, played like a new player: can it be found, what does it say, does pouring work
    await p.evaluate(helpers);
    const info = await p.evaluate(async () => { await Chores.load(); for (const a of ['bedroom', 'kitchen', 'lounge']) await Chores.part(a).catch(() => {}); const can = Object.keys(House.THINGS).find(id => /water|can/i.test(id) && /water/i.test(String(typeof House.THINGS[id].label === 'function' ? House.THINGS[id].label() : House.THINGS[id].label))); return {can, at: can && {...House.THINGS[can].at}, plants: Object.keys(House.SPOTS).filter(id => /plant|leaf/i.test(id))}; });
    console.log('  watering: ' + JSON.stringify(info));
    assert(info.can, 'No watering can in the house');
    assert((await pickUp(info.can)) === true, 'Cannot pick up the watering can');
    const hud = () => p.evaluate(() => ({keys: document.querySelector('.hs-hkeys')?.innerText || '', tip: document.querySelector('.hs-tip.carry')?.textContent || ''}));
    // aimed at the carpet: the prompt says where to aim; aimed at the plant: it says it will water it, and the plant glows
    const c = await p.evaluate(() => __qa.clear('bedroom', 20)); await standAt(c.x, c.y, c.z, 'U'); await p.waitForTimeout(600);
    const away = await hud(); console.log('  aiming at the carpet: ' + JSON.stringify(away));
    assert.match(away.keys, /aim at the plant/i, 'The can should say where to aim');
    const pot = {x: 170, y: -24, z: -52};
    assert(await standAt(pot.x, pot.y, pot.z, 'U'), 'Nowhere to stand to aim at the plant');
    await p.waitForTimeout(700);
    const at = await hud(); console.log('  aiming at the plant: ' + JSON.stringify(at));
    assert.match(at.keys, /Water Gran's plant/, 'Aiming at the plant should offer to water it');
    const glow = await p.evaluate(() => { let e = 0; House.ROOMS.bedroom.group.traverse(o => { if (o.isMesh && o.userData.e0 && o.material.emissive) e = Math.max(e, o.material.emissive.g - o.userData.e0.g); }); return e; });
    assert(glow > 0.02, 'The thirsty plant should glow while you carry the can: ' + glow);
    await shot('watering-aim');
    // Sample real rendered frames: a single WebDriver read 500 ms later can
    // arrive after this 1.5-second animation on a software-rendered host.
    await p.evaluate(()=>{window.__qaWaterPeak=0;window.__qaWaterFrames=[];const start=performance.now();(function track(){const roll=House.THINGS['ch.can'].holdRoll||0;__qaWaterPeak=Math.max(__qaWaterPeak,roll);__qaWaterFrames.push([Math.round(performance.now()-start),Math.round(roll)]);if(performance.now()-start<8000||House.anims.has('ch.can.tilt'))requestAnimationFrame(track)})();});
    await p.keyboard.press('f'); await until(()=>ChoreKit.has('plant','water')&&!House.anims.has('ch.can.tilt'));
    const tilt=await p.evaluate(()=>__qaWaterPeak);console.log('  watering tilt frames',await p.evaluate(()=>__qaWaterFrames));await shot('watering-pour');
    assert(tilt > 10, 'The can should visibly tip up while it pours: ' + tilt);
    await until(() => ChoreKit.has('plant', 'water'));
    await p.waitForTimeout(1500); await shot('watering-done');
    assert.match((await hud()).keys, /F Pour\b/, 'After watering the prompt is plain again');
    await p.keyboard.press('q'); await p.waitForTimeout(500);
  });

  await check('new-errors', async () => { assert.deepEqual(errors, [], 'Browser errors (new player)'); assert(!/mod failed to load/.test(log), 'Server reported a module failure'); });
} catch (e) { console.log('FAIL setup: ' + (e.stack || e)); results.push(['setup', false]); try { await fixture?.page.screenshot({path: dir + 'fail-setup.png'}); } catch (_) {} }
finally {
  clearTimeout(watchdog);
  await writeFile(dir + 'report.json', JSON.stringify({quick: QUICK, results, found}, null, 2)).catch(() => {});
  await cleanup();
  const failed = results.filter(r => !r[1]);
  console.log(`QA PLAY ${failed.length ? 'FAIL' : 'PASS'}: ${results.length - failed.length}/${results.length} checks${QUICK ? ' (quick)' : ''}; shots in tests/shots/qa-play/`);
  process.exit(failed.length ? 1 : 0);
}

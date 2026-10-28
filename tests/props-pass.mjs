// Props pass review shots: node tests/props-pass.mjs http://localhost:PORT [out-subdir] [--tier=low|high] [--phone]
// Uses an existing throwaway server (never production data). Registers a throwaway account, lays the tidy-up clothes
// and rubbish out on the bedroom floor (close-up and standing distance), then carries clothes to the washing basket,
// rubbish to the bin and a magazine to the bookcase slots so the target glow can be reviewed.
// Shots: tests/shots/props-pass/<out-subdir>/. Exit code 0 = every step ran without browser errors.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {roomFixture} from './room-fixture.mjs';
const base = process.argv[2], sub = process.argv.find((a, i) => i > 2 && !a.startsWith('--')) || 'after';
const tier = process.argv.find(a => a.startsWith('--tier='))?.slice(7) || 'low', phone = process.argv.includes('--phone');
assert(base, 'Usage: node tests/props-pass.mjs http://localhost:PORT [out] [--tier=low|high] [--phone]');
const dir = fileURLToPath(new URL('./shots/props-pass/' + sub + '/', import.meta.url));
await mkdir(dir, {recursive: true});
const account = 'Props' + Date.now().toString(36), password = 'Throwaway-1999';
assert((await fetch(base + '/admin/register', {method: 'POST', headers: {'X-Admin-Token': 'testtoken', 'Content-Type': 'application/json'}, body: JSON.stringify({name: account, pass: password})})).ok);
const fx = await roomFixture(base, {account, password, signup: false, tier, ...(phone ? {width: 390, height: 844, touch: true} : {})});
const {page: p, errors, view, until} = fx;
const tag = (phone ? 'phone-' : '') + tier;
const shot = async name => { await p.waitForTimeout(500); await p.screenshot({path: dir + tag + '-' + name + '.png'}); console.log('shot', tag + '-' + name); };
try {
  await p.evaluate(async () => { await Chores.load(); await Chores.part('bedroom'); });
  await until(() => !!House.SNAPS['ch.s.basket'] && !!House.THINGS['ch.m.socks']);
  const FY = 73;
  // every clothes / rubbish model on the floor in two rows
  const lay = await p.evaluate(FY => {
    const ids = Object.keys(House.THINGS).filter(k => /^ch\.m\./.test(k) && /mess\.(clothes|rubbish)/.test(House.THINGS[k].kind));
    if (House.THINGS['ch.pjs']) ids.push('ch.pjs');
    if (House.THINGS['hw.paper']) ids.push('hw.paper');
    const clothes = ids.filter(k => House.THINGS[k].kind === 'mess.clothes' || k === 'ch.pjs'), rub = ids.filter(k => !clothes.includes(k));
    const put = (k, x, z, ry) => { const t = House.THINGS[k]; t.canGrab = null; if (House.held() === k) House.putBack(); const r = House.ROOMS.bedroom; if (t.obj.parent !== r.things) r.things.add(t.obj); t.st = 'rest'; t.snap = null; t.at = {room: 'bedroom', x, y: FY, z, ry, hide: false}; House.place(t); };
    clothes.forEach((k, i) => put(k, -75 + i * 25, 150, (i * 37) % 60 - 30));
    rub.forEach((k, i) => put(k, -60 + i * 19, 185, (i * 53) % 70 - 35));
    House.dirty(); return {clothes, rub};
  }, FY);
  console.log('laid out', JSON.stringify(lay));
  await p.waitForTimeout(1200);
  await view([10, FY - 34, 95], [10, FY - 2, 165]); await shot('01-clothes-close');
  await view([10, FY - 30, 245], [10, FY - 2, 175]); await shot('02-rubbish-close');
  await view([10, FY - 150, 70], [10, FY, 175]); await shot('03-floor-distance');
  await view([-40, FY - 22, 205], [-40, FY - 2, 178]); await shot('04-rubbish-macro');
  await view([-20, FY - 22, 125], [-20, FY - 2, 152]); await shot('05-clothes-macro');
  // carrying: socks to the washing basket
  const look = (x, z, tx, ty, tz) => p.evaluate(({x, z, tx, ty, tz}) => { House.hush(); House.cancelGlide(true); const y = House.LV.U - 128; House.setWalkFrom({x, y, z, lvl: 'U', seat: 0}); House.W.vx = House.W.vz = 0; Object.assign(House.P, {x, z, y, rx: Math.atan2(-(ty - y), Math.hypot(tx - x, tz - z)) * 180 / Math.PI, ry: Math.atan2(tx - x, -(tz - z)) * 180 / Math.PI}); House._.setMode('walk'); House.dirty(); }, {x, z, tx, ty, tz});
  const carry = async id => { await p.evaluate(id => { if (House.held()) House.putBack(); House.THINGS[id].canGrab = null; House.grab(id); }, id); await until(() => !!House.held()); await p.waitForTimeout(400); };
  const g = () => p.evaluate(() => { const g = House.ghost(); return g && {ok: g.ok, why: g.why, snap: g.snap && g.snap.id}; });
  await carry('ch.m.socks');
  await look(100, 150, 110, 30, 222); await p.waitForTimeout(900); console.log('basket ghost', JSON.stringify(await g())); await shot('10-carry-basket-gold');
  await look(30, 120, 110, 40, 222); await p.waitForTimeout(900); console.log('basket aside', JSON.stringify(await g())); await shot('11-carry-basket-glow');
  await look(-70, 95, 30, 73, 105); await p.waitForTimeout(900); console.log('floor ghost', JSON.stringify(await g())); await shot('12-ghost-green');
  // rubbish to the bin
  await carry('ch.m.crisps');
  await look(-80, 10, -118, 45, -42); await p.waitForTimeout(900); console.log('bin ghost', JSON.stringify(await g())); await shot('13-carry-bin');
  await look(-40, 40, -118, 50, -42); await p.waitForTimeout(900); await shot('14-carry-bin-aside');
  // a magazine to the bookcase slots
  const rs = await p.evaluate(() => { const s = House.SNAPS['reading.slot.3'], r = House.ROOMS.bedroom; return s && {x: s.x, y: s.y, z: s.z, room: Object.fromEntries(Object.entries(r).filter(([k, v]) => typeof v === 'number'))}; });
  console.log('reading slot', JSON.stringify(rs));
  if (rs && await p.evaluate(() => !!House.THINGS['ch.m.mag1'])) {
    await carry('ch.m.mag1');
    await look(rs.x + 10, rs.z - 125, rs.x, rs.y - 10, rs.z); await p.waitForTimeout(900); console.log('shelf ghost', JSON.stringify(await g())); await shot('15-carry-shelf');
    await look(rs.x + 70, rs.z - 120, rs.x, rs.y, rs.z); await p.waitForTimeout(900); await shot('16-carry-shelf-aside');
  }
  await p.evaluate(() => { if (House.held()) House.putBack(); });
  // the football, a fresh crisp packet and today's crushed one, side by side
  await p.evaluate(FY => {
    const r = House.ROOMS.bedroom, put = (k, x, z, ry) => { const t = House.THINGS[k]; if (!t) return; t.canGrab = null; t.st = 'rest'; t.snap = null; t.at = {room: 'bedroom', x, y: FY, z, ry, hide: false}; House.place(t); };
    put('football', -42, 118, 0); put('ch.m.crisps', 14, 122, 20);
    const full = ChoreKit.MESS_MODELS.crispsFull(); full.position.set(-12, FY - 0.12, 120); full.rotation.y = -0.3; r.group.add(full); window.__full = full; House.dirty();
  }, FY);
  await p.waitForTimeout(800);
  await view([-12, FY - 30, 78], [-12, FY - 4, 120]); await shot('06-ball-crisps-close');
  await view([-12, FY - 140, 20], [-12, FY, 120]); await shot('07-ball-crisps-floor');
  // kick the ball: it must roll (its panels turn with it)
  const roll = await p.evaluate(async () => { const t = House.THINGS.football, q0 = t.spin.quaternion.clone(), x0 = t.at.x, z0 = t.at.z, b = House.physics.body('football'); b.vx = 420; b.vz = 60; House.physics.wake('football'); await new Promise(r => setTimeout(r, 2500)); return {angle: q0.angleTo(t.spin.quaternion), moved: Math.hypot(t.at.x - x0, t.at.z - z0)}; });
  console.log('ball roll', JSON.stringify(roll)); assert(roll.moved > 3 && roll.angle > 0.2, 'The football should turn by distance / radius as it rolls: ' + JSON.stringify(roll));
  // the cat tree and the cat's poses
  const cat = await p.evaluate(() => { const c = House.SPOTS.cat.obj, t = c.userData.tree; return {top: t.top, den: t.den, x: c.position.x, y: c.position.y, z: c.position.z}; });
  console.log('cat', JSON.stringify(cat));
  const catAt = (pos, pose, ry) => p.evaluate(({pos, pose, ry}) => { const c = House.SPOTS.cat.obj; c.position.set(pos.x, pos.y, pos.z); c.rotation.y = ry * Math.PI / 180; c.userData.pose(pose, 400); House.dirty(); }, {pos, pose, ry});
  await catAt(cat.top, 'sit', -110); await view([-10, FY - 150, 110], [-94, FY - 55, 224]); await shot('20-cat-tree');
  await view([-55, FY - 122, 165], [-90, FY - 108, 218]); await shot('21-cat-top-sit');
  await catAt(cat.top, 'sleep', -110); await shot('22-cat-top-sleep');
  await catAt(cat.den, 'sleep', -90); await view([-86, FY - 24, 160], [-88, FY - 12, 218]); await shot('23-cat-den');
  await view([-160, FY - 140, 120], [-94, FY - 50, 224]); await shot('24-cat-tree-side');
  for (const [k, pose] of ['sit', 'stretch', 'walk', 'eat', 'sleep'].entries()) { await catAt({x: -40, y: FY, z: 150}, pose, -90); await view([-40, FY - 32, 95], [-40, FY - 12, 150]); await shot('3' + k + '-cat-' + pose); }
  const tri = await p.evaluate(() => { const out = {}; const objs = Object.fromEntries(Object.keys(House.THINGS).filter(k => /^ch\.m\.|^ch\.pjs$|^hw\.paper$|^football$/.test(k)).map(k => [k, House.THINGS[k].obj])); objs.cat = House.SPOTS.cat.obj; objs.crispsFull = window.__full;
    for (const [k, obj] of Object.entries(objs)) { let n = 0, d = 0; obj.traverse(o => { if (o.isMesh && o.geometry) { const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; d++; } }); out[k] = [Math.round(n), d]; } return out; });
  console.log('triangles/draws', JSON.stringify(tri));
  assert.deepEqual(errors, [], 'browser errors');
  console.log('OK');
} finally { await fx.browser.close(); }

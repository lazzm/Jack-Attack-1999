/* np-life: Mom, Dad and the little sister living their 1999 day in the house (desktop house only). They follow daily
 * routines on the in-game clock (OwnerTools' clock override drives them too), walk the house through real doorways and
 * down the stairs (js/np-nav.js), open doors, step aside for you, sit, read the paper, wash up, watch telly and play;
 * look at you when you're close, and talk: F on a person plays real lines from docs/SCRIPT.md (js/np-lines.js, with the
 * voice ids of tools/audio/voice-lines.json) through st.say. Mom gives and takes in her daily jobs (js/ch-core.js pays,
 * exactly as before); story steps that a person speaks are given in person when they're there (js/st-engine.js asks).
 *   HouseFamily.talk(id)  .say(id, lineId)  .present(id)  .near(id, cm)  .storyLine(stepId)
 *   .handIn(choreId, msg)  .blocks(x, z, lvl)  .mute(who)  .debug.{clock, sim, dump, place}
 * State that must survive a refresh (where everyone is) is kept for a few minutes in localStorage; the story and the
 * jobs stay on the server. Nothing here pays anything. */
(function () {
  'use strict';
  const H = window.House, NR = window.NPCRig, NV = window.NPCNav, L = window.NPCLines;
  const coarse = (() => { try { return matchMedia('(hover:none) and (pointer:coarse)').matches; } catch (e) { return false; } })();
  const noop = () => false;
  const OFF = { enabled: false, active: false, present: noop, near: noop, storyLine: noop, handIn: noop, blocks: noop, mute: noop, say: noop, talk: noop, chars: {} };
  if (window.HouseFamily) return;
  if (!H || !H.ok || !NR || !NV || !L || coarse || window.PCOnly?.desktopOnly) { window.HouseFamily = OFF; return; }
  const T = H.T, D2R = Math.PI / 180, TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const angd = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const nowMs = () => performance.now();
  const ls = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const sisName = () => { try { return window.Cast ? Cast.n('sister') : 'My sister'; } catch (e) { return 'My sister'; } };
  const member = () => window.Net?.me?.member ? String(window.Net.me.nick || '').toLowerCase() : '';

  // ================================================================ the 1999 clock (the owner's override included)
  const HOLS = [[101, 104], [215, 219], [329, 416], [503, 503], [531, 604], [722, 907], [1025, 1029], [1218, 1231]];
  const BANK = [101, 402, 405, 503, 531, 830, 1227, 1228];
  let dbgClock = null;
  function mk(md, dow, t) {
    const weekend = dow === 0 || dow === 6, bank = BANK.includes(md), hol = HOLS.some(([a, b]) => md >= a && md <= b);
    return { md, dow, t, weekend, bank, school: !weekend && !bank && !hol, work: !weekend && !bank };
  }
  function clock() {
    if (dbgClock) return mk(dbgClock.md, dbgClock.dow, dbgClock.t);
    const O = window.OwnerTools, d = (O && O.now && O.now()) || new Date();
    let m = d.getMonth() + 1, day = d.getDate();
    if (!(O && O.clock)) { try { const t = Desk.today99(); m = t.m; day = t.d; } catch (e) {} }
    const dow = new Date(1999, m - 1, m === 2 && day === 29 ? 28 : day).getDay();
    return mk(m * 100 + day, dow, d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600);
  }

  // ================================================================ places in the house (house coords: cm, y down; face: 0 = +z, 90 = +x)
  const seat = o => Object.assign({ h: 45, back: true }, o);
  const SPOT = {
    // kitchen
    sink: { lvl: 'G', x: -80, z: 36, face: 180, act: 'washup', look: [-80, 260, -20] },
    hob: { lvl: 'G', x: -10, z: 36, face: 180, act: 'cook' },
    kettle: { lvl: 'G', x: -192, z: 38, face: 175, act: 'mug' },
    // (a cuppa somewhere out of the way: never in the strip in front of the worktop, never in the doorway's path)
    kmug1: { lvl: 'G', x: -205, z: 105, face: 60, act: 'mug' },
    kmug2: { lvl: 'G', x: 140, z: 92, face: -100, act: 'mug' },
    kmug3: { lvl: 'G', x: 132, z: 262, face: -120, act: 'mug' },
    // lounge
    sofaL: { lvl: 'G', act: 'telly', seat: seat({ x: -113.7, z: 563, face: 180, stand: [-113.7, 506], approach: [-143.7, 461] }) },
    sofaR: { lvl: 'G', act: 'telly', seat: seat({ x: -6.3, z: 563, face: 180, stand: [-6.3, 506], approach: [-143.7, 461], via: [[-134, 503]] }) }, // (sidle along between the coffee table and the sofa)
    armchair: { lvl: 'G', act: 'paper', seat: seat({ x: 115.3, z: 432.8, face: -118, stand: [80, 414], approach: [10, 386] }) }, // (straight in from the front)
    floorTV: { lvl: 'G', act: 'telly', seat: { x: -172, z: 401, face: 119, h: 1, floor: true, back: false, knee: 24, stand: [-172, 401], approach: [-172, 401] } },
    phone: { lvl: 'G', x: 117, z: 611, face: 90, act: 'phone' },
    // hall, landing
    hallYoyo: { lvl: 'G', x: 238, z: 420, face: 40, act: 'yoyo' }, // (by the wall: the hall stays passable)
    hallStairs: { lvl: 'G', x: 258, z: 626, face: 70 }, // (watching you on the stairs, clear of the lounge door and the stair foot)
    hallPost: { lvl: 'G', x: 262, z: 610, face: 160 },
    landingSis: { lvl: 'U', x: 290, z: 335, face: 150 },
    // garden, drive
    gardenWater: { lvl: 'G', x: -108, z: -455, face: -90, act: 'water' },
    gardenLook: { lvl: 'G', x: 10, z: -300, face: 200 },
    gardenYoyo: { lvl: 'G', x: 40, z: -215, face: 160, act: 'yoyo' },
    carwash: { lvl: 'G', x: 362, z: 1000, face: 90, act: 'carwash' }, // beside Dad's car (House.ROOMS.drive.carFrame), off the path
    carStory: { lvl: 'G', x: 364, z: 812, face: 200 }, // by the boot (js/hs-house.js CAR), off the path to the gate
    // Jack's room (story visits)
    bedDoorMom: { lvl: 'U', x: 178, z: 196, face: -95 },
    bedDad: { lvl: 'U', x: 168, z: 126, face: -110 },
    bedDoorSis: { lvl: 'U', x: 196, z: 204, face: -90 },
    // ways out (they disappear through these when nobody's looking)
    parents: { lvl: 'G', x: 0, z: 0, exit: true }, // filled in below
  };
  const EXIT = { parents: { lvl: 'U', x: 290, z: 662, face: 0 }, sisRoom: { lvl: 'U', x: 284, z: 490, face: -90 }, car: { lvl: 'G', x: 362, z: 1080, face: 90 }, street: { lvl: 'G', x: 290, z: 1336, face: 180 } }; // (street: out of the front gate, on the pavement)
  delete SPOT.parents;
  const MUG = ['kmug1', 'kmug2', 'kmug3'];

  // ================================================================ daily routines: [from hour, spot(:action) or [choices], ...]
  const ROUTINE = {
    mom: {
      week: [[0, 'away:bed'], [6.5, 'kettle'], [7, 'hob'], [8.4, 'sink'], [9.2, ['sofaL:magazine', 'kettle']], [10.3, 'gardenWater'], [11.3, 'kettle'], [12, 'hob'], [12.8, 'sink'], [13.2, ['sofaL:telly', 'sofaL:magazine']], [14, 'phone'], [14.4, ['gardenWater', 'sofaL:magazine']], [15.3, 'kettle'], [15.6, 'sink'], [16.5, 'hob'], [18.2, 'sink'], [19, 'sofaL:telly'], [21, 'sofaL:magazine'], [22.5, 'away:bed']],
      sat: [[0, 'away:bed'], [7.5, 'kettle'], [8, 'hob'], [9.3, 'sink'], [10, 'gardenWater'], [11.5, 'kettle'], [12, 'hob'], [13, 'sofaL:magazine'], [14.5, 'phone'], [15, 'gardenWater'], [16.5, 'hob'], [18.2, 'sink'], [19, 'sofaL:telly'], [23, 'away:bed']],
      sun: [[0, 'away:bed'], [8, 'kettle'], [8.5, 'sofaL:magazine'], [10.5, 'hob'], [13.5, 'sink'], [14.2, 'sofaL:telly'], [16.5, 'gardenWater'], [17.5, 'kettle'], [18, 'hob'], [19, 'sofaL:telly'], [22.5, 'away:bed']],
    },
    dad: {
      week: [[0, 'away:bed'], [6.75, 'mug'], [7.8, 'away:work'], [17.5, 'armchair:paper'], [18, 'mug'], [18.6, 'armchair:remote'], [20, 'armchair:telly'], [22.75, 'away:bed']],
      home: [[0, 'away:bed'], [7.5, 'mug'], [8.5, 'armchair:paper'], [11, 'gardenLook'], [12, 'mug'], [13, 'armchair:telly'], [16, 'gardenLook'], [17, 'armchair:paper'], [18, 'mug'], [18.6, 'armchair:remote'], [20, 'armchair:telly'], [22.75, 'away:bed']],
      sat: [[0, 'away:bed'], [8, 'mug'], [9, 'armchair:paper'], [10, 'carwash'], [12, 'mug'], [12.5, 'armchair:telly'], [15, 'gardenLook'], [16, 'armchair:paper'], [18, 'mug'], [18.6, 'armchair:telly'], [23, 'away:bed']],
      sun: [[0, 'away:bed'], [8.5, 'mug'], [9, 'armchair:paper'], [11, 'gardenLook'], [12, 'mug'], [13.5, 'armchair:doze'], [15.5, 'gardenLook'], [16.5, 'armchair:telly'], [22.5, 'away:bed']],
    },
    sister: {
      school: [[0, 'away:bed'], [7, 'mug'], [8.33, 'away:school'], [15.67, 'sofaR:telly'], [17, ['hallYoyo', 'gardenYoyo']], [17.75, 'sofaR:telly'], [18.5, 'sofaR:telly'], [20, 'away:bed']],
      off: [[0, 'away:bed'], [8, 'sofaR:telly'], [10.5, 'gardenYoyo'], [12, 'mug'], [12.5, 'sofaR:telly'], [14, 'hallYoyo'], [15, 'gardenYoyo'], [16.5, 'sofaR:telly'], [17.75, 'sofaR:telly'], [20.5, 'away:bed']],
    },
  };
  const AWAY_EXIT = { bed: { mom: 'parents', dad: 'parents', sister: 'sisRoom' }, work: { dad: 'car' }, school: { sister: 'street' } };
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function routineFor(id, clk) {
    const R = ROUTINE[id];
    if (id === 'mom') return clk.dow === 6 ? R.sat : clk.dow === 0 ? R.sun : R.week;
    if (id === 'dad') { if (dadHomeDay() === clk.md && clk.work) return R.home; return clk.dow === 6 || (clk.bank && clk.dow !== 0) ? R.sat : clk.dow === 0 ? R.sun : R.week; }
    return clk.school ? R.school : R.off;
  }
  const dadHomeDay = () => ls.get('jhp_np_dadhome') || 0;
  function scheduled(id, clk) {
    const R = routineFor(id, clk); let e = R[0], i = 0;
    for (let k = 0; k < R.length; k++) if (R[k][0] <= clk.t) { e = R[k]; i = k; }
    let v = e[1]; if (Array.isArray(v)) v = v[Math.floor(hash(id + clk.md + ':' + i) * v.length)];
    return { key: v + '@' + i, raw: v };
  }

  // ================================================================ the people
  const chars = [], C = {};
  function makeChar(id) {
    const c = { id, rig: null, present: false, x: 0, z: 0, lvl: 'G', h: 0, v: 0, room: null, goal: null, plan: [], cur: null, seated: null, hold: 0, sitT: 0,
      opened: new Set(), blockedT: 0, asideT: 0, aside: null, pushT: 0, lastBark: 0, lastBarkId: '', talking: false, said: {}, arrivedAt: 0, speed: { mom: 98, dad: 104, sister: 96 }[id] };
    chars.push(c); C[id] = c; return c;
  }
  ['mom', 'dad', 'sister'].forEach(makeChar);
  const label = c => c.id === 'mom' ? 'Mom' : c.id === 'dad' ? 'Dad' : sisName();

  function build(c) {
    if (c.rig) return;
    const clk = clock();
    c.rig = NR.create(c.id, { tier: window.HouseQ === 'low' ? 'low' : 'std', outfit: outfitFor(c.id, clk) });
    c.rig.floor = (x, z) => NV.floor(c.lvl, x, z);
    H.spot('np.' + c.id, { label: () => label(c) + ' <i><span><kbd>F</kbd> Talk</span></i>', obj: c.rig.proxy, range: 260, act: () => talk(c.id) });
  }
  function outfitFor(id, clk) {
    if (id !== 'dad') return null;
    if (!clk.work || dadHomeDay() === clk.md) return clk.weekend || clk.bank ? 'weekend' : 'home';
    return clk.t < 12 ? 'work' : 'home';
  }
  function roomAt(x, z, lvl) {
    let best = null, ba = 1e12;
    for (const id in H.ROOMS) { const r = H.ROOMS[id]; if (r.lvl !== lvl || !r.area.some(a => x >= a[0] && x <= a[2] && z >= a[1] && z <= a[3])) continue; const a = r.area.reduce((n, q) => n + (q[2] - q[0]) * (q[3] - q[1]), 0); if (a < ba) { ba = a; best = r; } }
    return best;
  }
  function placeRig(c) {
    if (!c.rig) return;
    const r = roomAt(c.x, c.z, c.lvl) || H.ROOMS[c.room];
    if (r && c.room !== r.id) { c.room = r.id; H.buildRoom(r); }
    const g = c.rig.group, parent = H.ROOMS[c.room]?.group;
    if (parent && g.parent !== parent) parent.add(g);
    const y = NV.onFlight(c.x, c.z) && c.x > 340 ? NV.ramp(c.z) : H.LV[c.lvl];
    c.rig.root(c.x, y, c.z, c.h, c.v);
    g.visible = c.present && !hideAll;
  }
  function spawn(c, at, h) {
    build(c);
    const o = outfitFor(c.id, clock()); if (o) c.rig.setOutfit(o);
    c.present = true; c.x = at.x; c.z = at.z; c.lvl = at.lvl; c.h = h ?? ((at.face || 0) * D2R); c.v = 0; c.seated = null; c.plan = []; c.cur = null; c.goal = null; c.room = null;
    c.rig.set({ seat: null, action: null, look: null, props: {} }); c.rig.st.sitK = 0;
    placeRig(c); c.rig.teleport(c.x, c.rig.st.y, c.z, c.h); c.rig.group.visible = true;
  }
  function vanish(c) { c.present = false; c.plan = []; c.cur = null; c.seated = null; if (c.rig) { c.rig.group.visible = false; c.rig.hush(); } }

  // ================================================================ what each of them wants to be doing now
  let directives = {}, hideAll = false; const manual = {}; // (tests: debug.go sends someone somewhere)
  function target(c, clk) {
    if (c.aside) return { key: 'aside', spot: c.aside, look: 'player' }; // (letting you past comes first)
    const d = directives[c.id];
    if (d) return d;
    const sch = scheduled(c.id, clk);
    if (sch.raw.startsWith('away:')) { const why = sch.raw.slice(5); return { key: sch.key, away: why, exit: AWAY_EXIT[why][c.id] }; }
    const [name, act] = sch.raw.split(':');
    let key = name;
    if (name === 'mug') key = MUG.find(k => !taken(k, c)) || MUG[0];
    return { key: sch.key + ':' + key, spot: SPOT[key], spotKey: key, act: act || SPOT[key]?.act || null };
  }
  function taken(spotKey, me) { return chars.some(o => o !== me && o.present && o.goal && o.goal.spotKey === spotKey); }

  // ---------------------------------------------------------------- planning: a goal becomes a list of steps
  function setGoal(c, g) {
    c.goal = g; c.plan = []; c.cur = null;
    const P = c.plan;
    if (c.seated) { P.push({ k: 'stand', seat: c.seated }); }
    if (g.away) { const e = EXIT[g.exit]; P.push({ k: 'route', to: e }, { k: 'face', h: e.face * D2R }, { k: 'vanish' }); return; }
    const s = g.spot; if (!s) return;
    if (s.seat) {
      const q = s.seat;
      const ap = approachOf(q, s.lvl);
      P.push({ k: 'route', to: { lvl: s.lvl, x: ap.x, z: ap.z } });
      for (const v of q.via || []) P.push({ k: 'line', to: { x: v[0], z: v[1] } });
      if (Math.hypot(ap.x - q.stand[0], ap.z - q.stand[1]) > 1) P.push({ k: 'line', to: { x: q.stand[0], z: q.stand[1] } });
      P.push({ k: 'face', h: q.face * D2R }, { k: 'sit', seat: q }, { k: 'act' });
    } else P.push({ k: 'route', to: s, yielding: g.key === 'aside' }, { k: 'face', h: (s.face || 0) * D2R }, { k: 'act' }); // (getting out of your way is never blocked by you)
  }
  // where to step off the walkable floor to reach a seat (the nearest point with full clearance)
  // where to step off the walkable floor for a seat: its approach (snapped to full clearance if need be)
  function approachOf(q, lvl) { if (!q.ap) q.ap = NV.clear(lvl, q.approach[0], q.approach[1]) >= NV.NEED ? { x: q.approach[0], z: q.approach[1] } : (NV.snap(lvl, q.approach[0], q.approach[1], 40) || { x: q.approach[0], z: q.approach[1] }); return q.ap; }
  function routeFrom(c, to, avoid) {
    return NV.route({ lvl: c.lvl, x: c.x, z: c.z }, to, avoid ? { avoid } : undefined);
  }

  // ---------------------------------------------------------------- doing the steps
  const player = () => ({ x: H.W.x, z: H.W.z, lvl: H.W.lvl });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const sameFloor = (c, p) => c.lvl === p.lvl || (NV.onFlight(c.x, c.z) && NV.onFlight(p.x, p.z));
  function doorZone(x, z, lvl, pad) { for (const d of Object.values(H.DOORS)) { const b = d.closedBounds; if (b && !d.always && d.rooms.some(id => H.ROOMS[id]?.lvl === lvl) && x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad) return d.id; } return null; }
  function ahead(c, r, s, squeeze) { // something in the way along the route: the player or another (moving or stood) person
    const p = player(), list = [];
    if (H.live && H.mode === 'walk' && sameFloor(c, p)) list.push({ x: p.x, z: p.z, who: 'player' });
    for (const o of chars) if (o !== c && o.present && (o.lvl === c.lvl || NV.onFlight(o.x, o.z))) list.push({ x: o.x, z: o.z, who: o.id, o });
    if (!list.length) return null;
    let hit = null;
    for (let d = 10; d <= 110; d += 10) {
      const q = NV.at(r, s + d); if (s + d > r.len + 5) break;
      for (const b of list) { const k = Math.hypot(q.x - b.x, q.z - b.z); if (k < (b.who === 'player' ? 44 : b.o && b.o.v < 5 ? (squeeze ? 17 : 25) : 30) && (!hit || d < hit.d)) hit = { d, b }; } // (family squeeze past each other, behind someone busy at the worktop; you get more room)
      if (hit) break;
    }
    return hit;
  }
  function doorOpen(id) { const d = H.DOORS[id]; return !d || d.always || (d.open && (d.ang > 0.82 || simMode)); }
  function step(c, dt, clk) {
    if (!c.cur) { c.cur = c.plan.shift() || null; if (c.cur) c.cur.t = 0; }
    const s = c.cur; if (!s) return;
    s.t += dt;
    if (c.hold > 0) { c.hold -= dt; c.v = 0; faceToward(c, player(), dt); return; }
    if (s.k === 'route') {
      if (!s.r) { s.r = routeFrom(c, s.to, s.avoid); s.s = 0; if (!s.r) { s.fail = (s.fail || 0) + 1; if (s.fail > 3) { c.x = s.to.x; c.z = s.to.z; c.lvl = s.to.lvl; c.cur = null; } return; } }
      follow(c, s, dt);
    } else if (s.k === 'line') {
      const d = Math.hypot(s.to.x - c.x, s.to.z - c.z); const v = Math.min(55, d * 3 + 5);
      const want = Math.atan2(s.to.x - c.x, s.to.z - c.z); if (d > 3) c.h += clamp(angd(c.h, want), -3 * dt, 3 * dt);
      if (d < 1) { c.cur = null; c.v = 0; } else { const k = Math.min(1, v * dt / d); c.x += (s.to.x - c.x) * k; c.z += (s.to.z - c.z) * k; c.v = v; }
    } else if (s.k === 'face') {
      c.v = 0; const d = angd(c.h, s.h); c.h += clamp(d, -3.2 * dt, 3.2 * dt);
      if (Math.abs(d) < 0.04 || s.t > 2.5) { c.h = s.h; c.cur = null; }
    } else if (s.k === 'sit') {
      const q = s.seat;
      if (!s.from) { s.from = { x: c.x, z: c.z }; c.rig?.set({ seat: { h: q.h, back: q.back, knee: q.knee, table: q.table } }); }
      const k = smooth(clamp(s.t / 1.1, 0, 1)); c.x = lerp(s.from.x, q.x, k); c.z = lerp(s.from.z, q.z, k); c.v = 0; c.h = q.face * D2R;
      if (s.t > 1.15) { c.seated = q; c.cur = null; }
    } else if (s.k === 'stand') {
      const q = s.seat;
      if (!s.started) { s.started = true; c.rig?.set({ seat: null, action: null, props: {} }); }
      const k = smooth(clamp(s.t / 0.95, 0, 1)); c.x = lerp(q.x, q.stand[0], k); c.z = lerp(q.z, q.stand[1], k); c.v = 0;
      if (s.t > 1.0) { c.seated = null; c.cur = null; const ap = approachOf(q, c.lvl), back = (q.via || []).slice().reverse().map(v => ({ k: 'line', to: { x: v[0], z: v[1] } })); if (Math.hypot(ap.x - q.stand[0], ap.z - q.stand[1]) > 1) back.push({ k: 'line', to: { x: ap.x, z: ap.z } }); c.plan.unshift(...back); }
    } else if (s.k === 'act') {
      c.v = 0;
      if (!s.arrived) { s.arrived = true; c.arrivedAt = nowMs(); arrive(c); }
      if (!c.seated && c.goal?.spot && Math.abs(angd(c.h, (c.goal.spot.face || 0) * D2R)) > 0.05 && !lookingAtPlayer(c)) c.h += clamp(angd(c.h, (c.goal.spot.face || 0) * D2R), -2 * dt, 2 * dt);
      stepAside(c, dt);
    } else if (s.k === 'yield') {
      c.v = 0; faceToward(c, s.o, dt);
      if (s.t > 6 || !s.o.present || s.o.cur?.k !== 'route' || s.t > 0.8 && Math.hypot(s.o.x - c.x, s.o.z - c.z) > 110) c.cur = null;
    } else if (s.k === 'vanish') {
      c.v = 0;
      if (!seen(c) || s.t > 90) vanish(c);
    }
  }
  function follow(c, s, dt) {
    const r = s.r;
    let stop = r.len;
    // doors: stop short, reach, open, go
    const d = r.doors.find(q => q.s1 + 25 > s.s);
    if (d && !doorOpen(d.id) && s.s < d.s0 + 5) {
      stop = Math.min(stop, d.s0 - 50);
      if (s.s >= d.s0 - 56 && c.v < 25) {
        if (!s.reach) { s.reach = 1e-6; c.rig?.set({ action: 'reach' }); }
        s.reach += dt;
        if (s.reach > 0.4 && !H.DOORS[d.id].open) { H.setDoor(d.id, true); c.opened.add(d.id); }
      }
    } else if (s.reach) { s.reach = 0; c.rig?.set({ action: travelAction(c) }); }
    // people in the way
    const hit = s.yielding ? null : ahead(c, r, s.s, s.squeeze);
    s.hit = hit ? hit.b.who + '@' + Math.round(hit.d) : null;
    if (hit) {
      stop = Math.min(stop, s.s + Math.max(0, hit.d - 50));
      if (c.v < 8) s.blocked = (s.blocked || 0) + dt;
      // two of them face to face in a narrow bit: the younger one steps into the side and lets the other by
      const o = hit.b.o;
      if (o && o.cur?.k === 'route' && prio(c) < prio(o) && s.blocked > 0.3 && !s.yielded) {
        const p = NV.at(r, s.s), nx = Math.cos(p.h), nz = -Math.sin(p.h);
        for (const dd of [55, 70, 90, 110]) for (const side of [1, -1]) {
          const x = c.x + nx * dd * side, z = c.z + nz * dd * side;
          if (NV.clear(c.lvl, x, z) < NV.NEED + 1 || Math.hypot(x - o.x, z - o.z) < 60) continue;
          s.yielded = true; s.r = null; s.s = 0; s.blocked = 0;
          c.plan.unshift({ k: 'route', to: { lvl: c.lvl, x, z }, yielding: true }, { k: 'yield', o }, s); c.cur = null; return;
        }
        // no room to the side: back up the way we came and let them through
        const back = s.s > 100 ? NV.at(r, s.s - 130) : { x: c.x - Math.sin(c.h) * 110, z: c.z - Math.cos(c.h) * 110, lvl: c.lvl };
        if (NV.clear(back.lvl, back.x, back.z) >= NV.NEED && Math.hypot(back.x - o.x, back.z - o.z) > 90) {
          s.yielded = true; s.r = null; s.s = 0; s.blocked = 0;
          c.plan.unshift({ k: 'route', to: { lvl: back.lvl, x: back.x, z: back.z }, yielding: true }, { k: 'yield', o }, s); c.cur = null; return;
        }
      }
      const waitFor = hit.b.who === 'player' ? 2.2 : hit.b.o && hit.b.o.v < 5 ? 0.5 : prio(c) < prio(hit.b.o) ? 1.2 : 2.5;
      if (s.blocked > waitFor) { // go round them
        // go round everyone nearby at once (avoiding just the one in front makes them ping-pong between two people)
        s.blocked = 0; const pl = player(), near = [];
        if (H.live && H.mode === 'walk' && sameFloor(c, pl) && dist(c, pl) < 320) near.push({ x: pl.x, z: pl.z, r: 48 });
        for (const q of chars) if (q !== c && q.present && q.lvl === c.lvl && dist(c, q) < 320) near.push({ x: q.x, z: q.z, r: q.v < 5 ? 27 : 33 });
        let avoid = near.map(q => Object.assign(q, { r: Math.max(18, Math.min(q.r, Math.hypot(c.x - q.x, c.z - q.z) - 6)) }));
        let nr = NV.route({ lvl: c.lvl, x: c.x, z: c.z }, s.to, { avoid });
        if (!nr) { // a tight spot (behind Mom at the sink): squeeze past people who are busy, closer than we'd like
          avoid = avoid.map(q => q.r <= 27 ? Object.assign({}, q, { r: 19 }) : q);
          nr = NV.route({ lvl: c.lvl, x: c.x, z: c.z }, s.to, { avoid });
          if (nr) s.squeeze = true;
        }
        if (nr) { s.r = nr; s.s = 0; s.avoid = avoid; return; }
        // nowhere to go: don't stand in a doorway
        const dz = doorZone(c.x, c.z, c.lvl, 30);
        if (dz) { const back = NV.at(r, Math.max(0, s.s - 90)); c.plan.unshift({ k: 'route', to: { lvl: back.lvl, x: back.x, z: back.z } }, Object.assign({}, s, { r: null, t: 0, blocked: 0 })); c.cur = null; return; }
      }
    } else s.blocked = Math.max(0, (s.blocked || 0) - dt * 0.5);
    // never stuck for good: if someone's camped in the only way through and nobody's watching, slip past
    const left = stop - s.s, onFlight = NV.at(r, s.s).stairs;
    s.waited = c.v < 5 && r.len - s.s > 1 ? (s.waited || 0) + dt : 0;
    s.why = hit ? 'person:' + hit.b.who : stop < r.len ? 'door' : left <= 0.5 ? 'end' : 'slow'; // (debug: why they're waiting)
    if (s.waited > 4 && !hit && !s.replanned) { s.replanned = true; s.r = null; s.waited = 0; return; } // (no progress and nobody in the way: plan again from here)
    if (s.waited > 20 && !seen(c)) { s.s = r.len - 0.4; s.waited = 0; }
    const vmax = c.speed * (onFlight ? 0.72 : 1), want = left <= 0.5 ? 0 : Math.min(vmax, Math.sqrt(2 * 150 * left));
    c.v += clamp(want - c.v, -300 * dt, 170 * dt); if (c.v < 0) c.v = 0;
    s.s = Math.min(stop < s.s ? s.s : stop, s.s + c.v * dt);
    const p = NV.at(r, s.s), q = NV.at(r, Math.min(r.len, s.s + 28));
    c.x = p.x; c.z = p.z; c.lvl = p.lvl;
    if (r.len - s.s > 2) { const want2 = Math.atan2(q.x - p.x, q.z - p.z); if (Math.hypot(q.x - p.x, q.z - p.z) > 1) c.h += clamp(angd(c.h, want2), -4.5 * dt, 4.5 * dt); }
    // shut doors behind (only ones we opened; never in someone's face)
    for (const id of [...c.opened]) {
      const dd = r.doors.find(q2 => q2.id === id);
      if (!dd || s.s > dd.s1 + 75) {
        c.opened.delete(id);
        const D = H.DOORS[id], b = D?.closedBounds; if (!D || !b) continue;
        const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, pl = player();
        const busy = Math.hypot(pl.x - cx, pl.z - cz) < 260 || chars.some(o => o !== c && o.present && Math.hypot(o.x - cx, o.z - cz) < 150);
        if (!busy && D.open) H.setDoor(id, false);
      }
    }
    if (s.s >= r.len - 0.5) { c.cur = null; c.v = Math.min(c.v, 20); }
  }
  const prio = c => ({ mom: 3, dad: 2, sister: 1 })[c.id];
  const travelAction = c => c.goal?.away && c.goal.away !== 'bed' ? 'leave' : null;
  function faceToward(c, p, dt) { if (c.seated) return; const want = Math.atan2(p.x - c.x, p.z - c.z); c.h += clamp(angd(c.h, want), -3.5 * dt, 3.5 * dt); }
  function lookingAtPlayer(c) { return c.hold > 0 || c.talking; }
  // at the spot: the action, the props
  function arrive(c) {
    const g = c.goal; if (!c.rig || !g) return;
    let act = g.act || g.spot?.act || null;
    c.rig.set({ action: act, props: {} });
    if (g.onArrive) { const f = g.onArrive; g.onArrive = null; f(c); }
  }
  // stepping aside when you're trying to get past
  function stepAside(c, dt) {
    if (c.seated || c.goal?.key === 'aside' && c.aside) {
      if (c.aside && dist(c, player()) > 170) { c.asideT += dt; if (c.asideT > 3) { c.aside = null; c.asideT = 0; } } else c.asideT = 0;
      return;
    }
    if (nowMs() - c.pushT > 600) { c.pushN = 0; return; }
    if ((c.pushN || 0) < 6) return;
    c.pushN = 0;
    const p = player(), dx = c.x - p.x, dz = c.z - p.z, L0 = Math.hypot(dx, dz) || 1, nx = -dz / L0, nz = dx / L0;
    const opts = [];
    for (const dd of [45, 60, 75]) for (const sg of [1, -1]) opts.push({ lvl: c.lvl, x: c.x + nx * dd * sg + dx / L0 * 15, z: c.z + nz * dd * sg + dz / L0 * 15 });
    for (let i = opts.length - 1; i >= 0; i--) { const o = opts[i]; if (NV.clear(o.lvl, o.x, o.z) < NV.NEED || doorZone(o.x, o.z, o.lvl, 40)) opts.splice(i, 1); }
    opts.sort((a, b) => NV.clear(b.lvl, b.x, b.z) - NV.clear(a.lvl, a.x, a.z));
    if (opts[0]) { c.aside = Object.assign(opts[0], { face: Math.atan2(p.x - opts[0].x, p.z - opts[0].z) / D2R }); c.asideT = 0; c.goal = null; }
  }

  // ================================================================ seeing and hearing
  const frustum = new T.Frustum(), pm = new T.Matrix4(), sph = new T.Sphere(), wp = new T.Vector3();
  function seen(c) {
    if (!c.present || !c.rig || !H.live) return false;
    const r = H.ROOMS[c.room]; if (!r || !r.group.visible) return false;
    if (H.mode !== 'walk' && H.mode !== 'focus' && H.mode !== 'glide') return false;
    H.camera.updateMatrixWorld(); pm.multiplyMatrices(H.camera.projectionMatrix, H.camera.matrixWorldInverse); frustum.setFromProjectionMatrix(pm);
    c.rig.group.getWorldPosition(wp); wp.y += 80; sph.set(wp, 110);
    return frustum.intersectsSphere(sph);
  }
  const inEarshot = (c, cm) => c.present && H.live && sameFloor(c, player()) && dist(c, player()) < (cm || 650) && !!H.ROOMS[c.room]?.group.visible;

  // ================================================================ speech: one line at a time, in person or shouted
  const speech = { q: [], cur: null, until: 0, last: 0 };
  const words = t => String(t).split(/\s+/).length;
  const lineMs = t => clamp(900 + words(t) * 340, 2300, 7600);
  function say(id, lineId, o) {
    o = o || {}; const c = C[id], l = L[lineId]; if (!c || !l) return false;
    const person = c.present && (o.force || inEarshot(c, o.range));
    const shout = !person && (l[2] === 'downstairs' || o.call);
    if (!person && !shout) return false;
    if (o.once) { const k = 'np.once.' + member() + '.' + lineId; if (ls.get(k)) return false; ls.set(k, 1); }
    speech.q.push({ c, lineId, person, text: l[1], then: o.then, prio: o.prio || 0, talk: !!o.talk });
    if (o.prio) speech.q.sort((a, b) => b.prio - a.prio);
    return true;
  }
  function speechTick() {
    const t = nowMs();
    if (speech.cur && t < speech.until) return;
    if (speech.cur) { const f = speech.cur.then; speech.cur.c.talking = speech.q.some(q => q.c === speech.cur.c); speech.cur = null; if (f) try { f(); } catch (e) { console.error(e); } }
    const n = speech.q.shift(); if (!n) return;
    const ms = lineMs(n.text);
    const who = n.person ? label(n.c) : label(n.c) + (n.c.lvl !== H.W.lvl ? (n.c.lvl === 'G' ? ' (downstairs)' : ' (upstairs)') : ' (in the ' + (n.c.room || 'house') + ')');
    try { window.st?.say(n.lineId, who, n.text, ms); } catch (e) { console.error(e); }
    if (n.person && n.c.rig) { n.c.rig.talk(ms - 300, n.text); n.c.talking = true; }
    speech.cur = n; speech.until = t + ms + 280; speech.last = t;
  }
  function skip() { if (speech.cur) speech.until = 0; }

  // ================================================================ talking (F)
  const momGive = () => {
    const K = window.ChoreKit; if (!K) return null;
    const list = K.list().filter(id => !K.done(id) && L['chore.' + id + '.give'] && K.avail(id));
    return list[0] || null;
  };
  const pendingHand = {};
  function talk(id) {
    const c = C[id]; if (!c || !c.present) return;
    if (speech.cur && speech.cur.c === c && speech.cur.talk) { skip(); return; } // F again: on to the next line
    if (speech.q.some(q => q.c === c && q.talk)) return;
    if (speech.cur && speech.cur.c === c) skip(); // (cut short whatever they were saying to themselves)
    const lines = talkLines(c);
    c.hold = 99;
    lines.forEach((l, i) => say(id, typeof l === 'string' ? l : l.id, { force: true, prio: 5, talk: true, then: () => { if (typeof l !== 'string' && l.then) l.then(); if (i === lines.length - 1) c.hold = 1.5; } }));
  }
  function talkLines(c) {
    const s = window.st?.getState?.(), cur = window.st?.current?.()?.id, story = s && !s.flags.veteran;
    if (c.id === 'mom') {
      if (story && cur === 'meetmom') return ['c1.mom.give', { id: 'c1.mom.give2', then: () => { window.st.event('meetmom'); say('mom', 'c1.mom.leave', { force: true }); } }];
      if (pendingHand.mom) { const p = pendingHand.mom; delete pendingHand.mom; return [p.done].concat(p.rate ? [p.rate] : []); }
      if (story && s.ch === 1 && ['tidy', 'bed', 'bin'].includes(cur)) return [{ tidy: 'chore.tidy.give', bed: 'c1.bed.give', bin: 'c1.bin.give' }[cur]];
      const g = momGive(); if (g) { try { window.ChoreKit.chip?.(g); } catch (e) {} return ['chore.' + g + '.give']; }
      const K = window.ChoreKit; if (K && K.list().length && K.list().every(id => K.done(id))) return [pick(['chore.allfour', 'bark.mom.react.praise'], c)];
      return [pick(barkPool(c, clock(), true) || ['bark.mom.react.praise'], c)];
    }
    if (c.id === 'dad') {
      if (story && s.ch === 1 && ['dad', 'boot'].includes(cur)) return s.done.boot ? ['c1.dad.brief'] : ['c1.dad.story', 'c1.dad.offer', 'c1.dad.yes', 'c1.dad.boot'];
      if (story && s.ch === 1 && /^part\./.test(cur)) return ['c1.dad.brief'];
      if (story && s.ch === 1 && /^lead\./.test(cur)) return [cur === 'lead.power' ? 'c1.lead.dad' : 'c1.lead.dad.power'];
      if (story && s.ch === 1 && cur === 'power') return ['c1.power.dad'];
      if (story && s.ch >= 2) { const k = 'np.pocket.' + member(); if (!ls.get(k)) { ls.set(k, 1); return ['c2.pocket.dad', 'c2.pocket.dad2', 'c2.pocket.dad3', 'c2.pocket.dad4']; } }
      const clk = clock(); if (clk.dow === 6 && window.ChoreKit && !window.ChoreKit.done('car') && clk.t > 9 && clk.t < 17) return ['chore.weekly.give', 'c2.bigjob.give'];
      return [pick(barkPool(c, clk, true) || ['bark.dad.react.joke'], c)];
    }
    return [pick(barkPool(c, clock(), true) || ['bark.sis.react.console', 'bark.sis.react.drawing', 'bark.sis.react.peek'], c)];
  }
  function pick(list, c) { const L2 = list.filter(id => L[id] && id !== c.lastBarkId); const id = (L2.length ? L2 : list)[Math.floor(Math.random() * (L2.length || list.length))]; c.lastBarkId = id; return id; }
  const eyes = () => ({ x: H.P.x, y: H.P.y, z: H.P.z });

  // ================================================================ barks: the house talking to itself
  function barkPool(c, clk, talking) {
    const t = clk.t, room = c.room, p = player(), pr = H.here, act = c.goal?.act || c.goal?.spot?.act, pool = [];
    const add = (cond, ids) => { if (cond) pool.push(...ids); };
    if (c.id === 'mom') {
      add(t >= 17.5 && t < 18.5 && room === 'kitchen', pr === 'kitchen' ? ['bark.mom.tea4', 'bark.mom.tea5'] : ['bark.mom.tea1', 'bark.mom.tea2']);
      add(clk.school && t >= 7 && t < 8.5, pr === 'bedroom' || pr === 'landing' ? ['bark.mom.school1'] : ['bark.mom.school2', 'bark.mom.school3']);
      add(clk.dow === 6 && t >= 7.5 && t < 10.5 && room === 'kitchen', ['bark.mom.wknd1']);
      add(clk.dow === 0 && t >= 8 && t < 12.5, ['bark.mom.wknd2']);
      add(act === 'washup', ['bark.mom.mess4']);
      add(room === 'lounge', ['bark.mom.mess3', 'bark.mom.tv2']);
      add(room === 'hall', ['bark.mom.mess2']);
      add(t >= 21 && t < 21.5, ['bark.mom.bed1']); add(t >= 21.5 && t < 22, ['bark.mom.bed2']); add(t >= 22 && t < 22.5, ['bark.mom.bed3']);
      add(t >= 12 && t < 17 && window.ChoreKit && window.ChoreKit.list().some(id => !window.ChoreKit.done(id)), ['bark.mom.react.nag']);
      add(act === 'phone', ['bark.mom.line1', 'bark.mom.line2']);
      if (talking) add(true, ['bark.mom.react.praise']);
    } else if (c.id === 'dad') {
      add(t >= 17.5 && t < 18.5 && (room === 'kitchen' || room === 'lounge'), ['bark.dad.tea1', 'bark.dad.tea2', 'bark.dad.tea3']);
      add(clk.work && t >= 6.7 && t < 7.8, ['bark.dad.school1']);
      add(clk.dow === 6, ['bark.dad.wknd1', 'bark.dad.wknd3']); add(clk.dow === 0 && room === 'lounge', ['bark.dad.wknd2']);
      add(room === 'lounge' && (act === 'telly' || act === 'remote'), ['bark.dad.tv1', 'bark.dad.tv2', 'bark.dad.tv3']);
      add(room === 'lounge', ['bark.dad.mess2']); add(room === 'hall', ['bark.dad.mess1', 'bark.dad.line3']);
      add(room === 'garden', ['bark.dad.react.garden', 'bark.dad.react.gnome']);
      add(t >= 21.5 && t < 22.5, ['bark.dad.bed1']);
      add(H.mode === 'monitor' && t >= 22, ['bark.dad.bed2']);
      add(true, ['bark.dad.react.joke']);
    } else {
      add(t >= 17.5 && t < 18.5 && (room === 'kitchen' || room === 'lounge'), ['bark.sis.tea1', 'bark.sis.tea2']);
      add(clk.school && t >= 7 && t < 8.4, ['bark.sis.school1', 'bark.sis.school2']);
      add(clk.dow === 6 && t < 12, ['bark.sis.wknd1']); add(clk.dow === 0, ['bark.sis.wknd2']);
      add(room === 'lounge' && act === 'telly', ['bark.sis.tv1', 'bark.sis.tv2']);
      add(room === 'hall', ['bark.sis.react.lounge', 'bark.sis.mess2']);
      add(t >= 20 && t < 21, ['bark.sis.bed1', 'bark.sis.bed2']);
      add(true, ['bark.sis.react.peek', 'bark.sis.react.drawing', 'bark.sis.react.console']);
    }
    return pool.length ? pool : null;
  }
  let barkAt = nowMs() + 25000;
  function barks(clk) {
    const t = nowMs();
    if (t < barkAt || speech.cur || speech.q.length || t - speech.last < 25000 || H.mode !== 'walk' || H.paused || document.querySelector('.hs-voice.on,.hs-call.on')) return;
    barkAt = t + 30000 + Math.random() * 40000;
    const cands = chars.filter(c => c.present && !c.talking && c.cur && (c.cur.k === 'act' || c.cur.k === 'route'));
    for (const c of cands.sort(() => Math.random() - 0.5)) {
      const pool = barkPool(c, clk, false); if (!pool) continue;
      const near = inEarshot(c, 600);
      const ok = pool.filter(id => L[id] && (near ? L[id][2] !== 'downstairs' : L[id][2] === 'downstairs' && c.lvl !== player().lvl) && (c.said[id] || 0) < t - 15 * 60000);
      if (!ok.length) continue;
      const id = pick(ok, c); c.said[id] = t;
      if (say(c.id, id, near ? {} : { call: true })) return;
    }
  }

  // ================================================================ the story, in person
  let lastStep = null, visit = null;
  const storyOn = () => { const s = window.st?.getState?.(); return !!(s && !s.flags.veteran); };
  function storyDirectives() {
    const out = {}; if (!storyOn()) return out;
    const s = window.st.getState(), cur = window.st.current()?.id; if (s.ch !== 1 || !cur) return out;
    if (cur === 'meetmom') out.mom = { key: 'story.momdoor', spot: SPOT.bedDoorMom, spotKey: 'bedDoorMom', onArrive: () => say('mom', 'c1.mom.up', { prio: 4, force: true }) };
    else if (visit && visit.until > nowMs()) out[visit.id] = visit.d;
    else if (['tidy', 'bed', 'bin'].includes(cur)) out.mom = { key: 'story.momsink', spot: SPOT.sink, spotKey: 'sink' };
    else if (/^part\./.test(cur)) out.mom = { key: 'story.momhall', spot: SPOT.hallStairs, spotKey: 'hallStairs' };
    if (['dad', 'boot'].includes(cur) || /^part\./.test(cur)) out.dad = { key: 'story.dadcar', spot: SPOT.carStory, spotKey: 'carStory', force: true };
    if (/^lead\./.test(cur) || ['power', 'install', 'pc'].includes(cur)) out.dad = { key: 'story.dadroom', spot: SPOT.bedDad, spotKey: 'bedDad', force: true, onArrive: () => { if (window.st.current()?.id === 'lead.power') say('dad', 'c1.lead.dad', { prio: 4, force: true }); } };
    if (/^part\./.test(cur) && home('sister')) out.sister = { key: 'story.sislanding', spot: SPOT.landingSis, spotKey: 'landingSis' };
    if (cur === 'lad' && sisCameo) out.sister = sisCameo;
    return out;
  }
  const home = id => { const sch = scheduled(id, clock()); return !sch.raw.startsWith('away:'); };
  // A story step a person speaks has just started. True = it's being said in person (js/st-engine.js then says nothing).
  function storyLine(stepId) {
    if (!ready) return false;
    const s = window.st?.getState?.(); if (!s || s.flags.veteran) return false;
    if (stepId === 'meetmom') return true; // Mom's on her way up
    if (stepId === 'bed') { visit = { id: 'mom', until: nowMs() + 90000, d: { key: 'story.momvisit', spot: SPOT.bedDoorMom, spotKey: 'bedDoorMom', onArrive: () => { say('mom', 'c1.tidy.done', { force: true, prio: 4 }); say('mom', 'c1.bed.give', { force: true, prio: 4, then: () => { if (visit) visit.until = nowMs() + 6000; } }); } } }; return true; }
    if (stepId === 'bin') { if (inEarshot(C.mom, 700)) { say('mom', 'c1.bed.done', { force: true, prio: 4 }); say('mom', 'c1.bin.give', { force: true, prio: 4 }); if (visit) visit.until = nowMs() + 8000; } else { say('mom', 'c1.bed.done', { call: true, prio: 4 }); say('mom', 'c1.bin.give', { call: true, prio: 4 }); } return true; }
    if (stepId === 'dad') { say('mom', 'c1.bin.done', inEarshot(C.mom) ? { force: true, prio: 4 } : { call: true, prio: 4 }); say('mom', 'c1.car.engine', inEarshot(C.mom) ? { force: true, prio: 4 } : { call: true, prio: 4 }); ls.set('jhp_np_dadhome', clock().md); return true; }
    if (stepId === 'part.monitor') { if (inEarshot(C.dad, 900)) { say('dad', 'c1.tower.done', { force: true, prio: 3 }); return true; } return false; }
    if (stepId === 'lead.power') return C.dad.present; // he says it when he arrives in the room
    if (stepId === 'pc') { if (C.dad.present) { say('dad', 'c1.install.done', { force: true, prio: 4 }); say('dad', 'c1.logon.dad', { force: true, prio: 4 }); if (inEarshot(C.mom, 900)) say('mom', 'c1.logon.mom', { prio: 3 }); if (inEarshot(C.sister, 900)) say('sister', 'c1.logon.sis', { prio: 3 }); return true; } return false; }
    return false;
  }
  function stepChanged(cur, prev, s) {
    if (!cur) return;
    if (cur === 'boot' && prev === 'dad') say('dad', 'c1.dad.hello', { prio: 3, range: 900 });
    if (prev === 'boot') say('dad', 'c1.dad.brief', { prio: 3, range: 1000 });
    if (prev === 'lead.power') say('dad', 'c1.lead.dad.power', { prio: 3, force: C.dad.present });
    if (cur === 'power' && C.dad.present) say('dad', 'c1.power.dad', { prio: 3, force: true });
    if (prev === 'power' && C.dad.present) say('dad', 'c1.power.boot', { prio: 3, force: true });
    if (cur === 'install' && C.dad.present) say('dad', 'c1.floppy.dad', { prio: 2, force: true });
    if (s.ch === 2) {
      if (prev === 'order') { if (!say('dad', 'c2.order.dad', { range: 700 })) say('mom', 'c2.order.mom', { range: 700 }); }
      if (cur === 'unbox') { if (home('sister')) say('sister', 'c2.post.sis', { call: true }); say('mom', 'c2.post.mom', { call: true }); }
      if (prev === 'unbox') { say('dad', 'c2.unbox.dad', { range: 600 }); say('sister', 'c2.unbox.sis', { range: 600 }); }
      if (cur === 'connect') say('dad', 'c2.connect.dad', { range: 700 });
      if (prev === 'connect') say('dad', 'c2.connect.done', { range: 700 });
      if (prev === 'play') { say('sister', 'c2.play.sis', { range: 700 }); say('mom', 'c2.play.mom', { range: 700 }); }
    }
  }
  // carrying the computer past them on the way up
  let sisCameo = null;
  function carryReactions() {
    const held = H.held(); if (!held || !storyOn()) return;
    const p = player();
    if (/^st\.pc\./.test(held)) {
      if (C.mom.present && C.mom.goal?.spotKey === 'hallStairs' && dist(C.mom, p) < 260 && sameFloor(C.mom, p)) say('mom', C.mom.said['c1.mom.carry'] ? 'c1.mom.carry2' : 'c1.mom.carry', { prio: 2, range: 400 }) && (C.mom.said[C.mom.said['c1.mom.carry'] ? 'c1.mom.carry2' : 'c1.mom.carry'] = nowMs());
      if (C.sister.present && C.sister.goal?.spotKey === 'landingSis' && dist(C.sister, p) < 240 && sameFloor(C.sister, p) && !C.sister.said['c1.sis.stairs']) { C.sister.said['c1.sis.stairs'] = nowMs(); say('sister', 'c1.sis.stairs', { prio: 2 }); say('sister', 'c1.sis.stairs2', { prio: 2 }); }
    }
  }
  function onGrab(id) {
    if (!storyOn()) return;
    const m = { 'st.pc.tower': 'c1.tower.pick', 'st.pc.monitor': 'c1.mon.pick', 'st.pc.keys': 'c1.keys.pick', 'st.pc.speakers': 'c1.speak.pick' }[id];
    if (m && !C.dad.said[m]) { C.dad.said[m] = nowMs(); say('dad', m, { prio: 3, range: 700 }); }
    if (/^(md|ps|n64|dc)$/.test(id) && window.st.current()?.id === 'carry' && !C.mom.said['c2.carry.mom'] && inEarshot(C.mom, 500)) { C.mom.said['c2.carry.mom'] = nowMs(); say('mom', 'c2.carry.mom', { prio: 2 }); }
  }
  // the sister bursts in while the Game Lad is on (only if she's home)
  function gameLadCameo() {
    if (!storyOn() || window.st.current()?.id !== 'lad' || sisCameo || !home('sister')) return;
    const v = window.RoomTV?._dbg?.(); if (!(v && v.st === 'game' && v.con === 'gb')) return;
    const k = 'np.cameo.' + member(); if (ls.get(k)) return; ls.set(k, 1);
    sisCameo = { key: 'story.siscameo', spot: SPOT.bedDoorSis, spotKey: 'bedDoorSis', onArrive: () => {
      say('sister', 'c1.lad.sis.in', { force: true, prio: 4 }); say('sister', 'c1.lad.sis.no', { force: true, prio: 4, then: () => { sisCameo = null; say('sister', 'c1.lad.sis.out', { force: true, prio: 4 }); } });
    } };
  }

  // ================================================================ chores: Mom hands the jobs out and takes them in
  const RATE = sc => sc >= 95 ? ['chore.rate.95a', 'chore.rate.95b', 'chore.rate.95c'] : sc >= 85 ? ['chore.rate.85a', 'chore.rate.85b', 'chore.rate.85c'] : sc >= 70 ? ['chore.rate.70a', 'chore.rate.70b', 'chore.rate.70c'] : ['chore.rate.0a', 'chore.rate.0b'];
  // A job just finished and the server has paid (or not). Mom says so in person when she's there. True = handled.
  function handIn(id, m) {
    if (!ready || !C.mom.present || m.bad) return false;
    const done = 'chore.' + id + '.done', rate = m.sc ? pick(RATE(m.sc), C.mom) : null;
    if (!L[done]) return false;
    if (inEarshot(C.mom, 650)) { say('mom', done, { force: true, prio: 3 }); if (rate) say('mom', rate, { force: true, prio: 3 }); if (m.bonusPence > 0) say('mom', 'chore.allfour', { force: true, prio: 2 }); return true; }
    pendingHand.mom = { done, rate }; return false;
  }

  // ================================================================ you and them: bumping, looking, being looked at
  // The stairs and the two corridors are one person wide: there (the flight, its head and foot, the hall beside the
  // stairs, the landing corridor) nobody is ever solid to you; you squeeze past them, the way you do on real stairs, so
  // the family can never stand between you and the way up or down or along the hall.
  const SQUEEZE = [{ x0: 322, x1: 412, z0: 196, z1: 664 }, { lvl: 'G', x0: 205, x1: 330, z0: 240, z1: 600 }, { lvl: 'U', x0: 250, x1: 330, z0: 250, z1: 700 }];
  const squeeze = (x, z, lvl) => SQUEEZE.some(q => (!q.lvl || q.lvl === lvl) && x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1);
  function blocks(x, z, lvl) {
    if (!ready) return false;
    if (squeeze(x, z, lvl)) return false;
    for (const c of chars) {
      if (!c.present || !(c.lvl === lvl || NV.onFlight(c.x, c.z))) continue;
      const r = c.seated ? 34 : 36, d1 = Math.hypot(x - c.x, z - c.z);
      if (d1 < r && d1 < Math.hypot(H.W.x - c.x, H.W.z - c.z) - 0.01) { c.pushT = nowMs(); c.pushN = (c.pushN || 0) + 1; return true; }
    }
    return false;
  }
  // Who you're up against (for the walking controller's slide: you walk round people instead of stopping dead).
  function blocker(x, z, lvl, skin) {
    if (!ready || squeeze(x, z, lvl)) return null;
    for (const c of chars) {
      if (!c.present || !(c.lvl === lvl || NV.onFlight(c.x, c.z))) continue;
      const r = c.seated ? 34 : 36; if (Math.hypot(x - c.x, z - c.z) < r + (skin || 0)) return { x: c.x, z: c.z, r };
    }
    return null;
  }
  function looks(c) {
    if (!c.rig) return;
    const p = player(), d = dist(c, p);
    let look = null;
    if (c.present && sameFloor(c, p) && (c.talking || c.hold > 0 || d < 330)) {
      const fwd = Math.atan2(p.x - c.x, p.z - c.z), off = Math.abs(angd(c.seated ? c.seated.face * D2R : c.h, fwd));
      if (c.talking || c.hold > 0 || off < 1.7) look = eyes();
    }
    c.rig.set({ look });
  }

  // ================================================================ the loop
  let ready = false, lastT = 0, lastFrame = 0, simMode = false;
  const visible = c => c.present && c.rig && H.ROOMS[c.room]?.group.visible;
  function tick(dt) {
    const clk = clock();
    directives = Object.assign(storyDirectives(), manual);
    for (const c of chars) {
      const want = target(c, clk);
      if (!c.present) { maybeSpawn(c, want, clk); continue; }
      if (!c.goal || want.key !== c.goal.key) { if (!c.talking && c.hold <= 0) setGoal(c, want); }
      step(c, dt, clk);
      placeRig(c);
    }
    outfits();
    if (simMode) return;
    speechTick(); barks(clk); carryReactions(); gameLadCameo();
    for (const c of chars) looks(c);
    if (nowMs() - savedAt > 2000) save();
  }
  // Dad changes after work (and into his weekend jumper) when nobody's watching
  let outfitAt = 0;
  function outfits() {
    if (!simMode && nowMs() - outfitAt < 8000) return; outfitAt = nowMs();
    const clk = clock();
    for (const c of chars) { const o = outfitFor(c.id, clk); if (o && c.rig && c.rig.outfit !== o && (!c.present || !seen(c))) c.rig.setOutfit(o); }
  }
  function maybeSpawn(c, want, clk, instant) {
    if (want.away) return;
    const s = want.spot; if (!s) return;
    // arriving: through the front door from the car (Dad) or the street (the sister), or out of their room in the morning
    const sch = scheduled(c.id, clk), R = routineFor(c.id, clk); let from = null;
    const prev = R.filter(e => e[0] <= clk.t).slice(-2, -1)[0];
    const fromWhy = prev && typeof prev[1] === 'string' && prev[1].startsWith('away:') ? prev[1].slice(5) : 'bed';
    const ex = EXIT[(AWAY_EXIT[fromWhy] || AWAY_EXIT.bed)[c.id] || AWAY_EXIT.bed[c.id]];
    void sch;
    if (want.force && c.id === 'dad') from = EXIT.car;
    from = from || ex;
    // straight to the spot if nobody would see it happen (a refresh, a long time away)
    const fresh = !!instant;
    if (fresh && !s.seat) { spawn(c, s); c.goal = want; c.plan = [{ k: 'face', h: (s.face || 0) * D2R }, { k: 'act' }]; return; }
    if (fresh && s.seat) { const q = s.seat; spawn(c, { lvl: s.lvl, x: q.x, z: q.z, face: q.face }); c.goal = want; c.seated = q; c.rig.set({ seat: { h: q.h, back: q.back, knee: q.knee, table: q.table } }); c.rig.st.sitK = 1; c.plan = [{ k: 'act' }]; return; }
    spawn(c, from); setGoal(c, want);
  }
  // after a refresh: everyone where they were (if it's recent), otherwise where the clock says
  const SKEY = () => 'jhp_np_v1.' + (member() || 'guest');
  let savedAt = 0;
  function save() {
    savedAt = nowMs(); if (simMode) return;
    const o = { t: Date.now(), c: {} };
    for (const c of chars) o.c[c.id] = c.present ? { p: 1, x: Math.round(c.x), z: Math.round(c.z), lvl: c.lvl, h: +c.h.toFixed(2), g: c.goal?.key || null, seat: c.seated ? SPOT_OF(c.seated) : null } : { p: 0 };
    ls.set(SKEY(), o);
  }
  const SPOT_OF = q => Object.keys(SPOT).find(k => SPOT[k].seat === q) || null;
  function restore() {
    const o = ls.get(SKEY()), clk = clock();
    for (const c of chars) {
      const want = target(c, clk), sv = o && Date.now() - o.t < 10 * 60000 ? o.c[c.id] : null;
      if (sv && sv.p && !want.away && sv.g === want.key) { // carry on exactly where they were
        if (sv.seat && SPOT[sv.seat]?.seat) { const q = SPOT[sv.seat].seat; spawn(c, { lvl: SPOT[sv.seat].lvl, x: q.x, z: q.z, face: q.face }); c.goal = want; c.seated = q; c.rig.set({ seat: { h: q.h, back: q.back, knee: q.knee, table: q.table } }); c.rig.st.sitK = 1; c.plan = [{ k: 'act' }]; }
        else { spawn(c, { lvl: sv.lvl, x: sv.x, z: sv.z }, sv.h); c.goal = null; }
        continue;
      }
      if (sv && sv.p && !want.away) { spawn(c, { lvl: sv.lvl, x: sv.x, z: sv.z }, sv.h); c.goal = null; continue; } // then walk on to where the clock says
      if (!want.away) maybeSpawn(c, want, clk, true);
    }
  }

  function frame(now, dt) {
    if (!ready || !H.live) return false;
    if (still()) { tick(Math.min(dt || 0.016, 0.1)); return false; }
    lastFrame = now; tick(Math.min(dt || 0.016, 0.1));
    let need = false;
    for (const c of chars) {
      if (!visible(c)) continue;
      const d = Math.hypot(H.P.x - c.x, H.P.z - c.z);
      c.rig.update(dt || 0.016, d < 700);
      need = true;
    }
    return need && H.mode !== 'monitor';
  }
  // While you're looking at a screen or a close-up the family holds still (no redraws for them on weak devices).
  const still = () => ['focus', 'inspect', 'monitor', 'pcboot', 'shutdown'].includes(H.mode);
  function kick() { if (ready && H.live && !H.anims.has('np') && !still() && chars.some(visible)) H.anims.set('np', frame); }
  setInterval(() => {
    if (!ready || !H.live || document.hidden) return;
    const now = nowMs();
    if (H.anims.has('np') && now - lastFrame < 300) return;
    const dt = Math.min(0.25, (now - (lastT || now)) / 1000); lastT = now;
    tick(dt);
    // the far or hidden view: still pose them now and then (cheap), and wake the full-rate loop when they come into view
    let any = false;
    if (!still()) for (const c of chars) if (visible(c)) { c.rig.update(dt, false); any = true; }
    if (any) { H.dirty(); kick(); }
  }, 200);

  // ================================================================ start up (after the rest of the house exists)
  async function start() {
    if (ready) return;
    try { await window.Room?.ensureHouse?.(); } catch (e) { return; }
    for (const id in H.ROOMS) H.buildRoom(H.ROOMS[id]);
    await new Promise(r => setTimeout(r, 50));
    NV.rebuild();
    for (const c of chars) { build(c); await new Promise(r => setTimeout(r, 30)); }
    ready = true;
    restore();
    for (const c of chars) placeRig(c);
    kick(); H.dirty();
    window.st?.onChange?.(s => {
      const cur = window.st.current()?.id || null; if (cur !== lastStep) { const prev = lastStep; lastStep = cur; if (prev !== null && s && !s.flags.veteran) stepChanged(cur, prev, s); }
    });
    lastStep = window.st?.current?.()?.id || null;
    H.on('grab', onGrab);
    H.on('room', () => kick());
    H.on('door', () => kick());
    H.on('mode', () => kick());
    addEventListener('ownerclock', () => { for (const c of chars) { c.goal = null; } });
    // the very first morning: Mom calls up the stairs
    if (storyOn() && window.st.current()?.id === 'lad' && !Object.keys(window.st.getState().done).length) setTimeout(() => { say('mom', 'c1.wake.mom.call', { call: true, once: true, prio: 1 }); }, 7000);
  }
  function boot() {
    if (ready) return;
    if (!H.live || !window.AccountGate?.allowed || document.querySelector('.hs-loading,#houseEntry')) { setTimeout(boot, 1000); return; }
    setTimeout(start, 2500);
  }
  boot();

  // ================================================================ the API
  window.HouseFamily = {
    enabled: true, get active() { return ready; }, get ready() { return ready; }, chars: C,
    present: id => !!C[id]?.present, near: (id, cm) => !!C[id] && inEarshot(C[id], cm || 400),
    talk, say: (id, line, o) => say(id, line, o), storyLine, handIn, blocks, blocker,
    // hs-life's random shouts give way to the people who are really there (and Dad can't shout from work)
    mute: who => { if (!ready) return false; const w = String(who).toLowerCase(); if (w.startsWith('dad')) return true; if (w.startsWith('mom')) return true; return false; },
    debug: {
      clock(v) { dbgClock = v || null; for (const c of chars) c.goal = null; },
      sim(seconds, dt, check) { // fast-forward the routines without drawing (tests)
        const was = simMode; simMode = true; const out = [];
        try { for (let t = 0; t < seconds; t += dt) { tick(dt); if (check) { const r = check(this.dump(), t); if (r) out.push(r); } } } finally { simMode = was; }
        return out;
      },
      dump() { return chars.map(c => ({ id: c.id, present: c.present, x: +c.x.toFixed(1), z: +c.z.toFixed(1), lvl: c.lvl, h: +c.h.toFixed(3), v: +c.v.toFixed(1), room: c.room, goal: c.goal?.key || null, spot: c.goal?.spotKey || null, step: c.cur?.k || null, seated: !!c.seated, sitting: !!(c.cur && (c.cur.k === 'sit' || c.cur.k === 'stand')), outfit: c.rig?.outfit || null, talking: !!c.talking })); },
      want: id => target(C[id], clock()).key,
      hide(v) { hideAll = !!v; for (const c of chars) placeRig(c); H.dirty(); },
      go(id, spotKey) { if (!spotKey) delete manual[id]; else { const s = SPOT[spotKey] || EXIT[spotKey]; manual[id] = s && { key: 'debug.' + spotKey, spot: s, spotKey, act: s.act }; } },
      place(id, spotKey) { const c = C[id], s = SPOT[spotKey]; if (!c || !s) return false; spawn(c, s.seat ? { lvl: s.lvl, x: s.seat.stand[0], z: s.seat.stand[1] } : s); c.goal = null; return true; },
      spots: SPOT, exits: EXIT, approachOf, routines: ROUTINE, scheduled: (id, v) => scheduled(id, v ? mk(v.md, v.dow, v.t) : clock()), save, restore, speech, frame,
    },
  };
})();

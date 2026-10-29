/* np-life: Mom, Dad and the little sister living their 1999 day in the house (desktop and touch house). They follow daily
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
  const noop = () => false;
  const OFF = { enabled: false, active: false, present: noop, near: noop, storyLine: noop, handIn: noop, blocks: noop, mute: noop, say: noop, talk: noop, chars: {} };
  if (window.HouseFamily) return;
  if (!H || !H.ok || !NR || !NV || !L || window.PCOnly?.desktopOnly) { window.HouseFamily = OFF; return; }
  const CAR = H.FRONT.CAR;
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
    sofaL: { lvl: 'G', act: 'telly', seat: seat({ x: -110.4, z: 608, face: 180, stand: [-110.4, 551], approach: [-110.4, 521] }) }, // (in from the way between the coffee table and the sofa)
    sofaR: { lvl: 'G', act: 'telly', seat: seat({ x: -9.6, z: 608, face: 180, stand: [-9.6, 551], approach: [-9.6, 521] }) },
    armchair: { lvl: 'G', act: 'paper', seat: seat({ x: 141.6, z: 402, face: -110, stand: [104.1, 388.3], approach: [30.8, 370.3] }) }, // (straight in from the front)
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
    carwash: { lvl: 'G', x: CAR.x-126, z: CAR.z, face: 90, act: 'carwash' }, // beside Dad's car (House.ROOMS.drive.carFrame), off the path
    carStory: { lvl: 'G', x: CAR.x-124, z: CAR.z-188, face: 200 }, // by the boot (js/hs-house.js CAR), off the path to the gate
    // Jack's room (story visits)
    bedDoorMom: { lvl: 'U', x: 178, z: 196, face: -95 },
    bedDad: { lvl: 'U', x: 168, z: 126, face: -110 },
    bedDoorSis: { lvl: 'U', x: 196, z: 204, face: -90 },
    // ways out (they disappear through these when nobody's looking)
    parents: { lvl: 'G', x: 0, z: 0, exit: true }, // filled in below
  };
  const EXIT = { parents: { lvl: 'U', x: 290, z: 662, face: 0 }, sisRoom: { lvl: 'U', x: 284, z: 490, face: -90 }, car: { lvl: 'G', x: CAR.x-126, z: CAR.z+80, face: 90 }, street: { lvl: 'G', x: 290, z: H.FRONT.FZ+36, face: 180 } }; // (street: out of the front gate, on the pavement)
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
    c.rig = NR.create(c.id, { tier: window.HouseQ === 'low' || window.HouseQ === 'potato' ? window.HouseQ : 'std', outfit: outfitFor(c.id, clk) });
    c.rig.floor = (x, z) => NV.floor(c.lvl, x, z);
    H.spot('np.' + c.id, { label: () => 'Talk to ' + label(c), obj: c.rig.proxy, range: 260, act: () => talk(c.id) });
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
  function target(c, clk, resume) {
    if (c.aside && !resume) return { key: 'aside', spot: c.aside, look: 'player' }; // (letting you past comes first)
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
    c.goal = g; c.plan = []; c.cur = null; c.backHome = null; c.backoff = null;
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
  const bodyRadius = c => ({ dad: 25, mom: 22, sister: 18 })[c.id] || 20;
  const bodyGap = (a, b) => bodyRadius(a) + bodyRadius(b);
  const peopleAvoid = c => chars.filter(o => o !== c && o.present && o.lvl === c.lvl).map(o => ({x:o.x,z:o.z,r:Math.max(18,Math.min(bodyGap(c,o)+8,dist(c,o)-1))}));
  function ahead(c, r, s, ignorePlayer) { // something in the way along the route: the player or another (moving or stood) person
    const p = player(), list = [];
    if (!ignorePlayer && H.live && H.mode === 'walk' && sameFloor(c, p)) list.push({ x: p.x, z: p.z, who: 'player' });
    for (const o of chars) if (o !== c && o.present && (o.lvl === c.lvl || NV.onFlight(o.x, o.z))) list.push({ x: o.x, z: o.z, who: o.id, o });
    if (!list.length) return null;
    let hit = null;
    for (let d = 10; d <= 110; d += 10) {
      const q = NV.at(r, s + d); if (s + d > r.len + 5) break;
      for (const b of list) { const k = Math.hypot(q.x - b.x, q.z - b.z), gap = b.who === 'player' ? 44 : bodyGap(c, b.o), current = Math.hypot(c.x - b.x, c.z - b.z); if (current < gap && k > current + 1) continue; if (k < gap && (!hit || d < hit.d)) hit = { d, b }; } // (the buffer must exceed the ten-centimetre sample spacing, so a blocked walker stops)
      if (hit) break;
    }
    return hit;
  }
  function doorOpen(id) { const d = H.DOORS[id]; return !d || d.always || (d.open && (d.ang > 0.82 || simMode)); }
  function step(c, dt, clk) {
    if (!c.cur) { c.cur = c.plan.shift() || null; if (c.cur) c.cur.t = 0; }
    const s = c.cur;
    if (s) s.t += dt;
    if (c.hold > 0) {
      if (c.hold > 2 && speech.cur?.c !== c && !speech.q.some(q => q.c === c)) c.hold = 1.5; // (nothing left to say: never stand there forever)
      c.hold -= dt; c.v = 0; faceToward(c, player(), dt);
      if (c.hold <= 0 && c.backHome) { c.backoff = null; if (c.cur) c.plan.unshift(c.cur); c.cur = { k: 'line', to: c.backHome, t: 0 }; c.backHome = null; return; } // (and back to what they were doing)
      if (c.backoff) { const bx = c.backoff.x - c.x, bz = c.backoff.z - c.z, bd = Math.hypot(bx, bz), k = Math.min(1, 55 * dt / (bd || 1)); if (bd < 1) c.backoff = null; else { c.x += bx * k; c.z += bz * k; c.v = 30; } } // (half a pace back, still facing you)
      return;
    }
    if (!s) return;
    if (s.k === 'route') {
      if (!s.r) {
        const avoid = s.yielding ? peopleAvoid(c) : null;
        s.r = routeFrom(c, s.to, avoid); s.s = 0;
        if (!s.r) {
          if (s.yielding) { c.aside = c.asideFor = null; c.goal = c.cur = null; c.plan = []; return; }
          s.fail = (s.fail || 0) + 1;
          if (s.fail > 3 && !chars.some(o => o !== c && o.present && o.lvl === s.to.lvl && Math.hypot(o.x-s.to.x,o.z-s.to.z)<bodyGap(c,o))) { c.x = s.to.x; c.z = s.to.z; c.lvl = s.to.lvl; c.cur = null; }
          return;
        }
      }
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
      if (!c.seated && !c.aside && s.t > 0.5 && doorZone(c.x, c.z, c.lvl, 12)) { c.pushT = nowMs(); c.pushN = 6; } // (never stand about in a doorway)
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
    const hit = ahead(c, r, s.s, s.yielding);
    s.hit = hit ? hit.b.who + '@' + Math.round(hit.d) : null;
    if (hit) {
      stop = Math.min(stop, s.s + Math.max(0, hit.d - (hit.b.who === 'player' ? 50 : 12)));
      if (c.v < 8) s.blocked = (s.blocked || 0) + dt;
      const o = hit.b.o;
      if (o && s.blocked > 0.3 && (prio(c) < prio(o) && !c.aside || c.asideFor === o)) {
        c.pushT = nowMs(); c.pushN = 6; c.pushFrom = { x: o.x, z: o.z, lvl: o.lvl }; c.asideFor = o;
        stepAside(c, dt);
        if (c.goal === null && c.aside) { c.cur = null; c.plan = []; return; }
      }
      const waitFor = hit.b.who === 'player' ? 2.2 : hit.b.o && hit.b.o.v < 5 ? 0.5 : prio(c) < prio(hit.b.o) ? 1.2 : 2.5;
      if (s.blocked > waitFor) { // go round them
        // go round everyone nearby at once (avoiding just the one in front makes them ping-pong between two people)
        s.blocked = 0; const pl = player(), near = [];
        if (H.live && H.mode === 'walk' && sameFloor(c, pl) && dist(c, pl) < 320) near.push({ x: pl.x, z: pl.z, r: 48 });
        for (const q of chars) if (q !== c && q.present && q.lvl === c.lvl && dist(c, q) < 320) near.push({ x: q.x, z: q.z, r: bodyGap(c, q) + 8 });
        let avoid = near.map(q => Object.assign(q, { r: Math.max(18, Math.min(q.r, Math.hypot(c.x - q.x, c.z - q.z) - 1)) }));
        let nr = NV.route({ lvl: c.lvl, x: c.x, z: c.z }, s.to, { avoid });
        if (o && o.cur?.k === 'act' && !o.seated && !o.talking && o.hold <= 0) {
          // Ask a standing person for room instead of routing through their body.
          o.pushT = nowMs(); o.pushN = 6; o.pushFrom = { x: c.x, z: c.z, lvl: c.lvl }; o.asideFor = c;
        }
        if (nr) { s.r = nr; s.s = 0; return; }
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
    if (s.waited > 20 && !seen(c) && !chars.some(o => o !== c && o.present && o.lvl === s.to.lvl && Math.hypot(o.x - s.to.x, o.z - s.to.z) < bodyGap(c, o))) { s.s = r.len - 0.4; s.waited = 0; }
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
    if (c.seated) return;
    if (c.goal?.key === 'aside' && c.aside && !((c.pushN || 0) >= 6 && nowMs() - c.pushT <= 600)) {
      const o = c.asideFor, released = o ? !o.present || dist(c, o) > 90 || o.cur?.k !== 'route' : dist(c, player()) > 170;
      c.asideT = released ? c.asideT + dt : 0;
      if (c.asideT > 3) {
        let room = true;
        if (o?.present && dist(c, o) <= 90) {
          const g = target(c, clock(), true), to = g.away ? EXIT[g.exit] : g.spot?.seat ? Object.assign({lvl:g.spot.lvl},approachOf(g.spot.seat,g.spot.lvl)) : g.spot;
          room = to && !chars.some(q => q !== c && q.present && q.lvl === to.lvl && Math.hypot(to.x-q.x,to.z-q.z)<bodyGap(c,q)) && NV.route({lvl:c.lvl,x:c.x,z:c.z},to,{avoid:peopleAvoid(c)});
        }
        if (room) { c.aside = c.asideFor = null; }
        c.asideT = 0;
      }
      return;
    }
    if (nowMs() - c.pushT > 600) { c.pushN = 0; c.pushFrom = null; return; }
    if ((c.pushN || 0) < 6) return;
    c.pushN = 0;
    const p = c.pushFrom || player(); c.pushFrom = null;
    const dx = c.x - p.x, dz = c.z - p.z, L0 = Math.hypot(dx, dz) || 1, route = c.asideFor?.cur;
    const heading = route?.r ? NV.at(route.r, Math.min(route.r.len, route.s + 20)).h : null;
    const nx = heading === null ? -dz / L0 : Math.cos(heading), nz = heading === null ? dx / L0 : -Math.sin(heading);
    const opts = [];
    for (const dd of (c.asideFor ? [55, 70, 90, 110] : [45, 60, 75])) for (const sg of [1, -1]) opts.push({ lvl: c.lvl, x: c.x + nx * dd * sg + dx / L0 * 15, z: c.z + nz * dd * sg + dz / L0 * 15 });
    if (c.asideFor) for (const dd of [55, 80, 110, 140, 180, 240, 300]) for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) opts.push({ lvl: c.lvl, x: c.x + Math.sin(a) * dd, z: c.z + Math.cos(a) * dd });
    for (let i = opts.length - 1; i >= 0; i--) { const o = opts[i]; if (NV.clear(o.lvl, o.x, o.z) < NV.NEED || doorZone(o.x, o.z, o.lvl, 40) || chars.some(q => q !== c && q.present && q.lvl === c.lvl && Math.hypot(o.x - q.x, o.z - q.z) < bodyGap(c, q))) opts.splice(i, 1); }
    if (route?.r) for (let i = opts.length - 1; i >= 0; i--) {
      for (let d = 0; d <= 200; d += 20) { const q = NV.at(route.r, Math.min(route.r.len, route.s + d)); if (Math.hypot(opts[i].x - q.x, opts[i].z - q.z) < bodyGap(c, c.asideFor) + 6) { opts.splice(i, 1); break; } }
    }
    opts.sort((a, b) => c.asideFor ? Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z) : NV.clear(b.lvl, b.x, b.z) - NV.clear(a.lvl, a.x, a.z));
    const avoid = peopleAvoid(c);
    const choice = c.asideFor ? opts.find(q => NV.route({lvl:c.lvl,x:c.x,z:c.z},q,{avoid})) : opts[0];
    if (choice) { c.aside = Object.assign(choice, { face: Math.atan2(p.x - choice.x, p.z - choice.z) / D2R }); c.asideT = 0; c.goal = null; }
    else if (c.asideFor) {
      // A queue can block its own retreat: ask the trailing person to make room first, without creating a request cycle.
      const behind = chars.filter(q => q !== c && q !== c.asideFor && q.present && q.lvl === c.lvl && !q.seated && !q.talking && q.hold <= 0 && dist(c,q) < 160 && (q.x-c.x)*dx+(q.z-c.z)*dz > L0*12 && !(q.aside && q.asideFor === c)).sort((a,b)=>dist(c,a)-dist(c,b)).find(q=>{
        const visited=new Set();for(let w=c;w&&!visited.has(w);w=w.asideFor){if(w===q)return false;visited.add(w)}return true;
      });
      if (behind) { behind.pushT=nowMs(); behind.pushN=6; behind.pushFrom={x:c.x,z:c.z,lvl:c.lvl}; behind.asideFor=c; }
    }
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
  const speech = { q: [], cur: null, until: 0, hard: 0, last: 0, voice: null, bub: null };
  const words = t => String(t).split(/\s+/).length;
  const lineMs = t => clamp(900 + words(t) * 340, 2300, 7600);
  function say(id, lineId, o) {
    o = o || {}; const c = C[id], l = L[lineId]; if (!c || !l) return false;
    const person = c.present && (o.force || inEarshot(c, o.range));
    const shout = !person && (l[2] === 'downstairs' || o.call);
    if (!person && !shout) return false;
    if (o.once) { const k = 'np.once.' + member() + '.' + lineId; if (ls.get(k)) return false; ls.set(k, 1); }
    // never the same line again within a minute (unless you asked for a story instruction again)
    if (!o.again && c.said[lineId] && nowMs() - c.said[lineId] < 60000) return false;
    // a scripted story line that plays by itself plays once per story step (saved: a refresh doesn't replay it)
    if (/^c\d\./.test(lineId) && !o.talk) { const step = window.st?.current?.()?.id || '-', k = 'np.step.' + member() + '.' + step + '.' + lineId; if (ls.get(k)) return false; ls.set(k, 1); }
    c.said[lineId] = nowMs();
    speech.q.push({ c, lineId, person, text: l[1], then: o.then, prio: o.prio || 0, talk: !!o.talk });
    if (o.prio) speech.q.sort((a, b) => b.prio - a.prio);
    try { window.st?.prefetch?.(lineId); } catch (e) {}
    return true;
  }
  // Where a speaker is for their speech bubble (js/np-bubble.js) and their recorded voice (js/st-voice.js, positional)
  // (in your room, or just through a doorway: further rooms are behind walls, so their balloons go to the screen edge)
  const seenBy = c => c.present && !!c.rig?.group.visible && !!H.ROOMS[c.room]?.group.visible && sameFloor(c, player()) && (c.room === H.here || dist(c, player()) < 450);
  const anchorOf = c => ({ top: v => c.rig.headTop(v), mouth: v => c.rig.mouthWorld(v), seen: () => seenBy(c), where: v => c.rig.headTop(v) });
  let V3 = null;
  function speechTick() {
    const t = nowMs();
    if (speech.freeze) return; // (tests: hold the current line for a screenshot)
    // (a recording that started late runs to its end, within reason)
    if (speech.cur && (t < speech.until || (speech.voice && !speech.voice.ended && speech.voice.started && t < speech.hard))) return;
    if (speech.cur) {
      if (speech.voice && !speech.voice.ended) speech.voice.stop(); // (F again: on to the next line)
      if (speech.bub) { const b = speech.bub, next = speech.q[0]; if (next && next.c === speech.cur.c) b.close(true); else setTimeout(() => b.close(), next ? 1600 : 450); } // (a reply: the last line stays up a moment, like a comic panel)
      if (speech.cur.c.rig && speech.voice) speech.cur.c.rig.hush();
      speech.voice = speech.bub = null;
      const f = speech.cur.then; speech.cur.c.talking = speech.q.some(q => q.c === speech.cur.c); speech.cur = null; if (f) try { f(); } catch (e) { console.error(e); }
    }
    const n0 = speech.q[0]; if (!n0) return;
    const rec = window.Sound?.voicesOn && window.st?.voiceInfo?.(n0.lineId);
    if (rec && !window.st.voiceReady?.(n0.lineId)) { // (give the recording a moment to arrive, so the words and the voice start together)
      if (!n0.waitFrom) { n0.waitFrom = t; try { window.st.prefetch(n0.lineId); } catch (e) {} }
      if (t - n0.waitFrom < 4000) return;
    }
    const n = speech.q.shift();
    const ms = rec ? clamp(rec.dur * 1000 + 450, 1500, 14000) : lineMs(n.text);
    const place = n.person ? '' : n.c.lvl !== H.W.lvl ? (n.c.lvl === 'G' ? '(downstairs)' : '(upstairs)') : '(in the ' + (n.c.room || 'house') + ')';
    const who = label(n.c) + (place ? ' ' + place : '');
    const c = n.c, here = c.present && !!c.rig, anchor = here ? anchorOf(c) : null;
    const bubble = !!(anchor && window.NPCBubble?.ok());
    if (!V3 && window.THREE) V3 = new THREE.Vector3();
    let voice = null;
    try {
      voice = window.st?.say(n.lineId, who, n.text, ms, { bubble, fx: L[n.lineId]?.[2],
        pos: here && V3 ? () => c.rig.mouthWorld(V3) : null, through: here ? () => !seenBy(c) : null, gain: here ? 1 : 0.7 }) || null;
    } catch (e) { console.error(e); }
    if (bubble) speech.bub = window.NPCBubble.show({ key: c.id, who: label(c), place, text: n.text, ms, anchor, voice, shout: !n.person });
    if (here) c.rig.talk(ms - 300, n.text, voice);
    if (voice) voice.onstart = h => { // (a slow connection: the line lasts as long as the recording, from when it really starts)
      if (speech.voice !== h) return; const end = nowMs() + h.dur * 1000;
      speech.until = Math.max(speech.until, end + 400); speech.hard = Math.max(speech.hard, end + 1500);
      if (here) c.rig.talk(end - nowMs(), n.text, h);
    };
    if (n.person) c.talking = true;
    speech.cur = n; speech.voice = voice; speech.until = t + ms + 280; speech.hard = t + ms + 3500; speech.last = t;
  }
  function skip() { if (speech.cur) { speech.until = 0; speech.hard = 0; } }

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
    const p = player(), d = dist(c, p);
    if (!c.seated && d < 82 && sameFloor(c, p)) { // (half a pace back if there's room: never into the worktop)
      const a0 = Math.atan2(c.x - p.x, c.z - p.z); c.backoff = null;
      for (const da of [0, 0.5, -0.5, 0.9, -0.9]) {
        const a = a0 + da, step = 32, tx = c.x + Math.sin(a) * step, tz = c.z + Math.cos(a) * step;
        if (Math.hypot(tx - p.x, tz - p.z) < d + 14 || NV.clear(c.lvl, tx, tz) < Math.min(NV.NEED - 4, NV.clear(c.lvl, c.x, c.z) - 1)) continue; // (as much room as where she stands: fine by a worktop)
        c.backoff = { x: tx, z: tz }; c.backHome = c.backHome || { x: c.x, z: c.z }; break;
      }
    }
    const fresh = lines.filter(l => { const lid = typeof l === 'string' ? l : l.id; return /^c\d\./.test(lid) || !(c.said[lid] && nowMs() - c.said[lid] < 60000); });
    if (!fresh.length) { c.hold = 1.2; return; } // (nothing new to say: they just turn to you)
    fresh.forEach((l, i) => say(id, typeof l === 'string' ? l : l.id, { force: true, prio: 5, talk: true, again: true, then: () => { if (typeof l !== 'string' && l.then) l.then(); if (i === fresh.length - 1) c.hold = 1.5; } }));
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
      const ok = pool.filter(id => L[id] && (near ? L[id][2] !== 'downstairs' : L[id][2] === 'downstairs' && c.lvl !== player().lvl) && (!c.said[id] || c.said[id] < t - 15 * 60000));
      if (!ok.length) continue;
      const id = pick(ok, c);
      if (say(c.id, id, near ? {} : { call: true })) return;
    }
  }

  // ================================================================ the story, in person
  let lastStep = null, visit = null;
  const storyOn = () => { const s = window.st?.getState?.(); return !!(s && !s.flags.veteran); };
  function storyDirectives() {
    const out = {}; if (!storyOn()) return out;
    const s = window.st.getState(), cur = window.st.current()?.id; if (s.ch !== 1 || !cur) return out;
    if (cur === 'meetmom') out.mom = entrance('mom', { key: 'story.momdoor', spot: SPOT.bedDoorMom, spotKey: 'bedDoorMom', onArrive: () => say('mom', 'c1.mom.up', { prio: 4, force: true }) }, { hold: true });
    else if (visit && visit.until > nowMs()) out[visit.id] = entrance(visit.id, visit.d);
    else if (['tidy', 'bed', 'bin'].includes(cur)) out.mom = { key: 'story.momsink', spot: SPOT.sink, spotKey: 'sink' };
    else if (/^part\./.test(cur)) out.mom = { key: 'story.momhall', spot: SPOT.hallStairs, spotKey: 'hallStairs' };
    if (['dad', 'boot'].includes(cur) || /^part\./.test(cur)) out.dad = { key: 'story.dadcar', spot: SPOT.carStory, spotKey: 'carStory', force: true };
    if (/^lead\./.test(cur) || ['power', 'install', 'pc'].includes(cur)) out.dad = entrance('dad', { key: 'story.dadroom', spot: SPOT.bedDad, spotKey: 'bedDad', force: true, onArrive: () => { if (window.st.current()?.id === 'lead.power') say('dad', 'c1.lead.dad', { prio: 4, force: true }); } });
    if (/^part\./.test(cur) && home('sister')) out.sister = { key: 'story.sislanding', spot: SPOT.landingSis, spotKey: 'landingSis' };
    if (cur === 'lad' && sisCameo) out.sister = entrance('sister', sisCameo, { burst: true });
    for (const id in ent) if (!out[id] && !sceneDbg[id]) delete ent[id];
    return out;
  }
  // ---------------------------------------------------------------- coming into Jack's room: never popping in
  // Whoever comes to Jack's room is first got onto the landing outside the shut door, out of sight (or walks there if
  // you can see them), then knocks (the sister just bursts in), the door opens and they walk in. For Mom's first visit
  // the doorway is softly held from your side until she's in and has spoken (you can't open the door or walk out).
  const STAGE = { mom: { lvl: 'U', x: 292, z: 190, face: -90 }, dad: { lvl: 'U', x: 296, z: 172, face: -90 }, sister: { lvl: 'U', x: 292, z: 205, face: -90 } };
  const ent = {}, sceneDbg = {};
  const inBedroom = c => c.present && c.lvl === 'U' && c.x < 238 && c.z < 252;
  function entrance(id, d, o) {
    const c = C[id]; let e = ent[id];
    if (!e || e.key !== d.key) e = ent[id] = { key: d.key, phase: inBedroom(c) ? 'in' : 'come', started: nowMs(), el: 0, o: o || {}, inEl: -1 };
    if (e.phase === 'in' || e.phase === 'enter') return d;
    return { key: d.key + ':stage', spot: STAGE[id], spotKey: 'stage.' + id, force: d.force, onArrive: () => { if (e.phase === 'come') { e.phase = 'knock'; e.el = 0; } } };
  }
  function entranceTick(dt) {
    for (const id in ent) {
      const e = ent[id], c = C[id]; e.el += dt; e.age = (e.age || 0) + dt;
      if (e.phase === 'enter' && e.inEl < 0 && inBedroom(c)) e.inEl = 0; else if (e.inEl >= 0) e.inEl += dt;
      if (e.phase === 'come' && (!c.present || c.goal?.key === e.key + ':stage' && c.cur?.k === 'route') && !seenNow(c) && !seenAt(STAGE[id])) {
        // get them onto the landing behind the door where nobody can see it happen
        spawn(c, STAGE[id]); c.goal = null;
      }
      if (e.phase === 'knock') {
        if (!e.knocked) { e.knocked = 1; if (!e.o.burst && !H.DOORS.bedroom?.open && !simMode) knockSfx(); }
        if (e.el > (e.o.burst ? 0.25 : 1.4)) { if (H.DOORS.bedroom && !H.DOORS.bedroom.open) { H.setDoor('bedroom', true); e.doorAt = Date.now(); } e.phase = 'enter'; }
      }
    }
  }
  function knockSfx() { const sf = H.sfx; if (!sf?.tone) return; for (let i = 0; i < 3; i++) { sf.tone(96, 0.09, 'sine', 0.15, i * 0.22, 54); sf.noise(0.05, 0.08, 700, i * 0.22, 'lowpass', 900); } }
  const seenNow = c => c.present && seen(c);
  // would a person standing here be on screen?
  function seenAt(at) {
    if (!H.live || !at) return false;
    const r = roomAt(at.x, at.z, at.lvl); if (!r || !r.group.visible) return false;
    H.camera.updateMatrixWorld(); pm.multiplyMatrices(H.camera.projectionMatrix, H.camera.matrixWorldInverse); frustum.setFromProjectionMatrix(pm);
    r.group.localToWorld(wp.set(at.x, H.LV[at.lvl], at.z)); wp.y += 80; sph.set(wp, 110);
    return frustum.intersectsSphere(sph);
  }
  // Mom's first visit: hold the doorway from the bedroom side until she's in and has said hello
  function doorHeld() {
    const e = ent.mom; if (!e || !e.o.hold || ((e.age || 0) >= 10 || nowMs() - e.started >= 10000)) return false; // (a safety net: never longer than 10 s, even at a low frame rate)
    if (e.phase !== 'in' && e.phase !== 'enter') return true;
    return e.inEl < 2.5;
  }
  let heldHintAt = 0;
  function heldHint() { if (nowMs() - heldHintAt > 4000) { heldHintAt = nowMs(); H.ui?.say?.('Hang on', 'Mom\'s coming up the stairs...', 2600); } }
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
      // each carry remark once (it used to repeat "carry2" every time you passed her)
      const next = !C.mom.said['c1.mom.carry'] ? 'c1.mom.carry' : !C.mom.said['c1.mom.carry2'] ? 'c1.mom.carry2' : null;
      if (next && C.mom.present && C.mom.goal?.spotKey === 'hallStairs' && dist(C.mom, p) < 260 && sameFloor(C.mom, p)) say('mom', next, { prio: 2, range: 400 });
      if (C.sister.present && C.sister.goal?.spotKey === 'landingSis' && dist(C.sister, p) < 240 && sameFloor(C.sister, p) && !C.sister.said['c1.sis.stairs']) { say('sister', 'c1.sis.stairs', { prio: 2 }); say('sister', 'c1.sis.stairs2', { prio: 2 }); }
    }
  }
  function onGrab(id) {
    if (!storyOn()) return;
    const m = { 'st.pc.tower': 'c1.tower.pick', 'st.pc.monitor': 'c1.mon.pick', 'st.pc.keys': 'c1.keys.pick', 'st.pc.speakers': 'c1.speak.pick' }[id];
    if (m && !C.dad.said[m]) { say('dad', m, { prio: 3, range: 700 }); }
    if (/^(md|ps|n64|dc)$/.test(id) && window.st.current()?.id === 'carry' && !C.mom.said['c2.carry.mom'] && inEarshot(C.mom, 500)) { say('mom', 'c2.carry.mom', { prio: 2 }); }
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
    if (lvl === 'U' && doorHeld() && x > 222 && x < 270 && z > 140 && z < 240 && H.W.x < 236) { heldHint(); return true; } // (never traps: only stops you walking out of your room)
    if (squeeze(x, z, lvl)) return false;
    for (const c of chars) {
      if (!c.present || !(c.lvl === lvl || NV.onFlight(c.x, c.z)) || doorZone(c.x, c.z, c.lvl, 20)) continue; // (in a doorway you squeeze past: nobody can block you in)
      const r = space(c), d1 = Math.hypot(x - c.x, z - c.z);
      if (d1 < r && d1 < Math.hypot(H.W.x - c.x, H.W.z - c.z) - 0.01) { c.pushFrom = null; c.asideFor = null; c.pushT = nowMs(); c.pushN = (c.pushN || 0) + 1; return true; }
    }
    return false;
  }
  // Who you're up against (for the walking controller's slide: you walk round people instead of stopping dead).
  // personal space: you can't get your face right into theirs (about 65 cm standing, less by a chair)
  const space = c => c.seated ? 50 : 64;
  function blocker(x, z, lvl, skin) {
    if (!ready || squeeze(x, z, lvl)) return null;
    for (const c of chars) {
      if (!c.present || !(c.lvl === lvl || NV.onFlight(c.x, c.z)) || doorZone(c.x, c.z, c.lvl, 20)) continue;
      const r = space(c); if (Math.hypot(x - c.x, z - c.z) < r + (skin || 0)) return { x: c.x, z: c.z, r };
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
    c.rig.set({ look, engage: c.present && c.hold > 0 });
  }

  // ================================================================ the loop
  let ready = false, lastT = 0, lastFrame = 0, simMode = false;
  const visible = c => c.present && c.rig && H.ROOMS[c.room]?.group.visible;
  function tick(dt) {
    const clk = clock();
    directives = Object.assign(storyDirectives(), manual);
    for (const id in sceneDbg) directives[id] = entrance(id, sceneDbg[id]);
    entranceTick(dt);
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
    if (seenAt(from)) return; // (never appear where you can see it: wait until you look away)
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
    kick(); if (!still()) H.dirty(); // (a close-up redraws on its own when you leave it)
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
    talk, say: (id, line, o) => say(id, line, o), storyLine, handIn, blocks, blocker, doorHeld, heldHint,
    // hs-life's random shouts give way to the people who are really there (and Dad can't shout from work)
    mute: who => { if (!ready) return false; const w = String(who).toLowerCase(); if (w.startsWith('dad')) return true; if (w.startsWith('mom')) return true; return false; },
    debug: {
      clock(v) { dbgClock = v || null; for (const c of chars) c.goal = null; },
      sim(seconds, dt, check) { // fast-forward the routines without drawing (tests)
        const was = simMode; simMode = true; const out = [];
        try { for (let t = 0; t < seconds; t += dt) { tick(dt); if (check) { const r = check(this.dump(), t); if (r) out.push(r); } } } finally { simMode = was; }
        return out;
      },
      entrance: () => JSON.parse(JSON.stringify(ent)), seenAt, seen: id => seen(C[id]),
      dump() { return chars.map(c => ({ id: c.id, present: c.present, x: +c.x.toFixed(1), z: +c.z.toFixed(1), lvl: c.lvl, h: +c.h.toFixed(3), v: +c.v.toFixed(1), room: c.room, goal: c.goal?.key || null, spot: c.goal?.spotKey || null, step: c.cur?.k || null, seated: !!c.seated, sitting: !!(c.cur && (c.cur.k === 'sit' || c.cur.k === 'stand')), outfit: c.rig?.outfit || null, talking: !!c.talking })); },
      want: id => target(C[id], clock()).key,
      hide(v) { hideAll = !!v; for (const c of chars) placeRig(c); H.dirty(); },
      scene(id, spotKey) { if (!spotKey) { delete sceneDbg[id]; return; } sceneDbg[id] = { key: 'debug.scene.' + spotKey, spot: SPOT[spotKey], spotKey }; }, // (tests: a scripted entrance into Jack's room)
      go(id, spotKey, act) { if (!spotKey) delete manual[id]; else { const s = SPOT[spotKey] || EXIT[spotKey]; manual[id] = s && { key: 'debug.' + spotKey + (act ? ':' + act : ''), spot: s, spotKey, act: act || s.act }; } },
      acts: () => { const o = {}; for (const id of ['mom', 'dad', 'sister']) { const set = new Set(); for (const R of Object.values(ROUTINE[id])) for (const e of R) for (const v of [].concat(e[1])) { if (v.startsWith('away:')) continue; const [k, a] = v.split(':'); const key = k === 'mug' ? 'kmug1' : k; if (SPOT[key]) set.add(key + ':' + (a || SPOT[key].act || '')); } o[id] = [...set]; } return o; },
      place(id, spotKey) { const c = C[id], s = SPOT[spotKey]; if (!c || !s) return false; spawn(c, s.seat ? { lvl: s.lvl, x: s.seat.stand[0], z: s.seat.stand[1] } : s); c.goal = null; return true; },
      spots: SPOT, exits: EXIT, approachOf, anchor: id => C[id] && C[id].rig ? anchorOf(C[id]) : null, routines: ROUTINE, scheduled: (id, v) => scheduled(id, v ? mk(v.md, v.dow, v.t) : clock()), save, restore, speech, frame,
    },
  };
})();

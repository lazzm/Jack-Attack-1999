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
  // What this player has heard, kept per account across refreshes, all year round: the family work through
  // everything they could say before repeating any of it, and the same line never comes back soon.
  let heard = null, heardFor = null;
  const heardMap = () => { const k = 'np.heard.' + (member() || 'guest'); if (heardFor !== k) { heardFor = k; heard = ls.get(k) || {}; } return heard; };
  const heardAt = id => +heardMap()[id] || 0;
  function hear(id) {
    const m = heardMap(); m[id] = Date.now();
    const ids = Object.keys(m); if (ids.length > 600) ids.sort((a, b) => m[a] - m[b]).slice(0, ids.length - 500).forEach(k => delete m[k]);
    ls.set(heardFor, m);
  }
  // Least recently heard first; never-heard lines are picked at random among themselves.
  function freshest(list, key = x => x, avoid) {
    const L2 = list.filter(x => key(x) !== avoid), use = L2.length ? L2 : list; if (!use.length) return undefined;
    const t = Math.min(...use.map(x => heardAt(key(x)))), tier = use.filter(x => heardAt(key(x)) <= t + 1000);
    return tier[Math.floor(Math.random() * tier.length)];
  }

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
    sink: { lvl: 'G', x: -80, z: -84, face: 180, act: 'washup', look: [-80, 260, -140] },
    hob: { lvl: 'G', x: -10, z: -84, face: 180, act: 'cook' },
    kettle: { lvl: 'G', x: -192, z: -82, face: 175, act: 'mug' },
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
    gardenWater: { lvl: 'G', x: -80, z: -700, face: -90, act: 'water' },
    gardenLook: { lvl: 'G', x: 10, z: -850, face: 200 },
    gardenYoyo: { lvl: 'G', x: 40, z: -540, face: 160, act: 'yoyo' },
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
  // A child's shorter thighs need the front of the cushion and dangling feet.
  // Keep the adult anchors (and the sofa itself) exactly where they are.
  for(const key of ['sofaL','sofaR'])SPOT[key].childSeat={...SPOT[key].seat,z:590,back:false,footH:24};
  const seatFor = (c, spot) => c.id==='sister' && spot.childSeat || spot.seat;
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
  let conversationUI = false;
  function conversationHud() {
    const on = chars.some(c => c.present && c.hold > 0);
    if (on !== conversationUI) { conversationUI = on; H.ui?.el?.classList?.toggle('np-conversation', on); }
  }
  function talkLabel(c) {
    if (speech.q.some(n=>n.c===c && n.talk)) return label(c) + ' is busy';
    if (speech.cur?.c === c && speech.cur.talk) return label(c) + (speech.cur.gesture ? ' is listening' : ' is busy');
    return 'Talk to ' + label(c) + (c.talking || speech.cur?.c === c ? ' (speaking)' : '');
  }

  function build(c) {
    if (c.rig) return;
    const clk = clock();
    c.rig = NR.create(c.id, { tier: window.HouseQ === 'low' || window.HouseQ === 'potato' ? window.HouseQ : 'std', outfit: outfitFor(c.id, clk) });
    c.speed = c.rig.S.speed; // Personality speeds share the rig; route/braking safety stays here.
    c.rig.floor = (x, z) => {
      // The navigation grid is a body ramp. Feet contact the solid 25 cm
      // treads / 20 cm risers built by hs-house, across the floor-level seam.
      // Test the person's floor first so the space below the flight stays below.
      if (NV.onFlight(c.x, c.z) && (c.lvl === 'U' ? c.z < 440 : c.z > 410) && NV.onFlight(x, z)) {
        const step = clamp(Math.floor((z - NV.STAIR.z0) / 25) + 1, 0, 14);
        return H.LV.U + step * 20;
      }
      return NV.floor(c.lvl, x, z);
    };
    // Read the real hinge frame only during a reach. No navigation changes.
    const handle = new T.Vector3(), otherHandle = new T.Vector3(), contact = { x: 0, y: 0, z: 0 };
    c.rig.contact = () => {
      const d = H.DOORS[c.reachDoor], anchors = d?.pivot?.userData.handles;
      if (!anchors || d.ang > (c.id === 'sister' ? 0.03 : 0.09) || !c.present) { c.reachDoor = null; return null; }
      d.pivot.updateWorldMatrix(true, false);
      handle.fromArray(anchors[0]); d.pivot.localToWorld(handle);
      otherHandle.fromArray(anchors[1]); d.pivot.localToWorld(otherHandle);
      const swap = Math.hypot(otherHandle.x - c.x, otherHandle.z - c.z) < Math.hypot(handle.x - c.x, handle.z - c.z);
      contact.yaw = Math.atan2((swap ? 1 : -1) * (handle.x - otherHandle.x), (swap ? 1 : -1) * (handle.z - otherHandle.z));
      if (swap) handle.copy(otherHandle);
      contact.x = handle.x; contact.y = -handle.y; contact.z = handle.z;
      return contact;
    };
    H.spot('np.' + c.id, { label: () => talkLabel(c), hideTip: () => c.hold > 0 || speech.cur?.c === c && speech.cur.talk || speech.q.length > 0 && speech.q.some(n => n.c === c && n.talk), obj: c.rig.proxy, range: 260, act: () => talk(c.id) });
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
    // The flight passes ABOVE the cupboard's ground-floor rectangle. The
    // route's floor tag changes halfway up; neither tag identifies its render
    // owner. Keep the whole flight in the open stair/hall portal, including
    // during a conversation or an avoidance stop. A person below it stays in
    // the cupboard (the same height test as the tread contact callback).
    const flight = NV.onFlight(c.x, c.z) && (c.lvl === 'U' ? c.z < 440 : c.z > 410);
    let r = (flight ? H.ROOMS[c.lvl === 'U' ? 'landing' : 'hall'] : roomAt(c.x, c.z, c.lvl)) || H.ROOMS[c.room];
    // A restored/initial pose can be in the few centimetres occupied by a
    // doorway reveal, outside both floor rectangles. Give it the nearest room
    // on this floor instead of retaining an unrelated hidden parent. Otherwise
    // its coarse off-screen timer becomes a visible jump at the next jamb.
    if (!r) {
      let nearest = (NV.NEED || 25.5) ** 2;
      for (const id in H.ROOMS) { const q = H.ROOMS[id]; if (q.lvl !== c.lvl) continue;
        for (const a of q.area || []) { const dx = Math.max(a[0] - c.x, 0, c.x - a[2]), dz = Math.max(a[1] - c.z, 0, c.z - a[3]), d = dx * dx + dz * dz;
          if (d < nearest) { nearest = d; r = q; }
        }
      }
    }
    if (r && c.room !== r.id) { c.room = r.id; H.buildRoom(r); }
    // Keep the logical floor/room for dialogue and sound. Only the render
    // ancestry shares the hall's flight; both ends form one open air volume.
    const g = c.rig.group, room = (flight ? H.ROOMS.hall : H.ROOMS[c.room])?.group;
    const parked=c.rig.st?.readingParked,readingRoom=H.ROOMS[c.rig.st?.readingRoom||'lounge']?.group;
    const person=c.present&&!!room?.visible,reading=parked&&!!readingRoom?.visible;
    // The laid-down page remains in the original skinned draw. If its owner
    // is in a culled room, draw just that page from the house root; never
    // resurrect the hidden person or add a separate prop draw.
    const parent=parked&&!person&&reading?H.root:room;
    if (parent && g.parent !== parent) parent.add(g);
    const y = flight ? NV.ramp(c.z) : H.LV[c.lvl];
    // A tight shuffle uses the rig's planted-foot adjustment steps. Its back
    // stays against the wall; a forward walk cycle would put toes into it.
    c.rig.root(c.x, y, c.z, c.h, c.aside?.narrow || c.backoff ? 0 : c.v);
    c.rig.presence?.(parked?person:c.present,reading);
    c.rig.syncReading?.();
    g.visible = (c.present||reading) && !hideAll;
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
    const seasonal = window.Bonfire?.familyGoal?.(c.id); if (seasonal) return seasonal;
    const sch = scheduled(c.id, clk);
    if (sch.raw.startsWith('away:')) { const why = sch.raw.slice(5); return { key: sch.key, away: why, exit: AWAY_EXIT[why][c.id] }; }
    const [name, act] = sch.raw.split(':');
    let key = name;
    if (name === 'mug') key = MUG.find(k => !taken(k, c)) || MUG[0];
    return { key: sch.key + ':' + key, spot: SPOT[key], spotKey: key, act: act || SPOT[key]?.act || null };
  }
  function taken(spotKey, me) { return chars.some(o => o !== me && o.present && o.goal && o.goal.spotKey === spotKey); }

  // ---------------------------------------------------------------- planning: a goal becomes a list of steps
  const seatPose = (c, q) => {
    // Read original upholstery contacts without changing any family route/anchor.
    const surface=(H.ROOMS.lounge?.peopleSeats||[]).find(s=>Math.hypot(s.x-q.x,s.z-q.z)<24);
    const child=c.id==='sister',perch=child&&surface?.id==='armchair';
    return {h:q.h,back:q.back,knee:q.knee,table:q.table,footH:q.footH??(perch?20:undefined),hipForward:q.hipForward??(perch?16:child||q.floor?undefined:10),footForward:q.footForward??(perch?46:child||q.floor?undefined:54),x:q.x,z:q.z,face:q.face,support:q.support||surface?.support};
  };
  function setGoal(c, g) {
    if (c.cur?.k === 'sit' && c.cur.from) c.seated = c.cur.seat;
    c.goal = g; c.plan = []; c.cur = null; c.backHome = null; c.backoff = null;
    const P = c.plan;
    if (c.seated) { P.push({ k: 'stand', seat: c.seated }); }
    if (g.away) { const e = EXIT[g.exit]; P.push({ k: 'route', to: e }, { k: 'face', h: e.face * D2R }, { k: 'vanish' }); return; }
    const s = g.spot; if (!s) return;
    if (s.seat) {
      const q = seatFor(c, s);
      const ap = approachOf(q, s.lvl);
      P.push({ k: 'route', to: { lvl: s.lvl, x: ap.x, z: ap.z } });
      for (const v of q.via || []) P.push({ k: 'line', to: { x: v[0], z: v[1] } });
      if (Math.hypot(ap.x - q.stand[0], ap.z - q.stand[1]) > 1) P.push({ k: 'line', to: { x: q.stand[0], z: q.stand[1] } });
      P.push({ k: 'face', h: q.face * D2R }, { k: 'sit', seat: q }, { k: 'act' });
    } else {
      if (g.key === 'aside' && s.narrow) P.push({k:'face',h:s.face*D2R});
      P.push({ k: 'route', to: s, yielding: g.key === 'aside' }, { k: 'face', h: (s.face || 0) * D2R }, { k: 'act' });
    } // (getting out of your way is never blocked by you)
  }
  // where to step off the walkable floor to reach a seat (the nearest point with full clearance)
  // where to step off the walkable floor for a seat: its approach (snapped to full clearance if need be)
  function approachOf(q, lvl) { if (!q.ap) q.ap = NV.clear(lvl, q.approach[0], q.approach[1]) >= NV.NEED ? { x: q.approach[0], z: q.approach[1] } : (NV.snap(lvl, q.approach[0], q.approach[1], 40) || { x: q.approach[0], z: q.approach[1] }); return q.ap; }
  function routeFrom(c, to, avoid) {
    const reserve=window.Bonfire?.familySpace?.()||0,p=player();if(reserve&&sameFloor(c,p)){avoid=(avoid||[]).concat({x:p.x,z:p.z,r:Math.max(18,Math.min(reserve+8,dist(c,p)-2))});}
    const from={lvl:c.lvl,x:c.x,z:c.z},flight=NV.onFlight(c.x,c.z);
    const prefix=[Object.assign({stairs:flight},from)];
    let start=from;
    if(flight){
      if(NV.onFlight(to.x,to.z))return measuredRoute([prefix[0],{...to,stairs:true}]);
      // Resume from a tread, never from the cupboard's navigation cell below.
      const exit={lvl:to.lvl,x:NV.STAIR.x,z:to.lvl==='U'?NV.STAIR.top:NV.STAIR.bottom};
      prefix.push({lvl:c.lvl,x:NV.STAIR.x,z:c.z,stairs:true},{...exit,stairs:true});start=exit;
    }
    const r=NV.route(start,to,avoid?{avoid}:undefined);if(!r)return null;
    const first=r.pts[0],gap=Math.hypot(first.x-c.x,first.z-c.z);
    if(!flight&&gap<0.1)return r;
    if(!flight&&gap>40)return r;
    // A sideways shuffle may finish closer to a wall than a walking route.
    // Walk the short lead-in back out; snapping to its first cell would jump.
    const joined=measuredRoute(prefix.concat(r.pts));
    const offset=joined.len-r.len;joined.doors=r.doors.map(d=>({...d,s0:d.s0+offset,s1:d.s1+offset}));return joined;
  }
  function measuredRoute(points){
    const pts=[];let len=0;
    for(const p of points){const last=pts[pts.length-1],d=last?Math.hypot(p.x-last.x,p.z-last.z):0;if(last&&d<.01)continue;len+=d;pts.push({...p,s:len});}
    return {pts,len,doors:[]};
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
      for (const b of list) { const k = Math.hypot(q.x - b.x, q.z - b.z), gap = b.who === 'player' ? (window.Bonfire?.familySpace?.()||44) : bodyGap(c, b.o), current = Math.hypot(c.x - b.x, c.z - b.z); if (current < gap && k > current + 1) continue; if (k < gap && (!hit || d < hit.d)) hit = { d, b }; } // (the buffer must exceed the ten-centimetre sample spacing, so a blocked walker stops)
      if (hit) break;
    }
    return hit;
  }
  function doorOpen(id) { const d = H.DOORS[id]; return !d || d.always || (d.open && (d.ang > 0.82 || simMode)); }
  function step(c, dt, clk) {
    if (!c.cur) { c.cur = c.plan.shift() || null; if (c.cur) c.cur.t = 0; }
    const s = c.cur;
    if (s) s.t += dt;
    if (c.hold > 0 && !(c.goal?.key === 'aside' && c.pass && nowMs() < c.pass.until)) {
      if (c.hold > 2 && speech.cur?.c !== c && !speech.q.some(q => q.c === c)) c.hold = 1.5; // (nothing left to say: never stand there forever)
      c.hold -= dt; c.v = 0;
      const show=c.goal?.key?.startsWith('bf.')?window.Bonfire?.familyLook?.():null;
      faceToward(c,show&&!displaySpeaking(c)?show:player(),dt);
      if (c.hold <= 0 && c.backHome) { c.backoff = null; if (c.cur) c.plan.unshift(c.cur); c.cur = { k: 'line', to: c.backHome, t: 0 }; c.backHome = null; return; } // (and back to what they were doing)
      if (c.backoff) { const bx = c.backoff.x - c.x, bz = c.backoff.z - c.z, bd = Math.hypot(bx, bz), k = Math.min(1, 55 * dt / (bd || 1)); if (bd < 1) c.backoff = null; else { c.x += bx * k; c.z += bz * k; c.v = 30; } } // (half a pace back, still facing you)
      return;
    }
    if (!s) return;
    if (s.k === 'route') {
      if (!s.r) {
        const avoid = s.yielding || c.resumeAvoid ? peopleAvoid(c) : null;
        s.r = s.yielding && c.aside?.route || routeFrom(c, s.to, avoid); s.s = 0;
        // Resume around the body we just yielded to. Going straight back onto
        // the cached centre line can meet the same standing person forever.
        if (!s.r && c.resumeAvoid && !s.yielding) s.r = routeFrom(c, s.to);
        if (s.r && !s.yielding) c.resumeAvoid = false;
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
      if (!s.from) { s.from = { x: c.x, z: c.z }; c.rig?.set({ seat: seatPose(c, q) }); }
      const k = smooth(clamp(s.t / 0.7, 0, 1)); c.x = lerp(s.from.x, q.x, k); c.z = lerp(s.from.z, q.z, k); c.v = 0; c.h = q.face * D2R;
      if (s.t > 1.15) { c.seated = q; c.cur = null; }
    } else if (s.k === 'stand') {
      const q = s.seat;
      if(!s.started&&!c.rig.prepareReading(c.room)){
        s.t=0;c.v=0;
        if(simMode||!visible(c))c.rig.update(dt,false);
        return;
      }
      if (!s.started) { s.from = { x: c.x, z: c.z }; s.started = true; c.rig?.set({ seat: null, action: null, props: {} }); }
      const k = smooth(clamp((s.t-0.12) / 0.83, 0, 1)); c.x = lerp(s.from.x, q.stand[0], k); c.z = lerp(s.from.z, q.stand[1], k); c.v = 0;
      if (s.t > 1.0) { c.seated = null; c.cur = null; const ap = approachOf(q, c.lvl), back = (q.via || []).slice().reverse().map(v => ({ k: 'line', to: { x: v[0], z: v[1] } })); if (Math.hypot(ap.x - q.stand[0], ap.z - q.stand[1]) > 1) back.push({ k: 'line', to: { x: ap.x, z: ap.z } }); c.plan.unshift(...back); }
    } else if (s.k === 'act') {
      c.v = 0;
      if (!s.arrived) { s.arrived = true; c.arrivedAt = nowMs(); arrive(c); }
      const listening = listenerTurn(c, dt);
      if (!listening && !c.seated && c.goal?.spot && Math.abs(angd(c.h, (c.goal.spot.face || 0) * D2R)) > 0.05 && !lookingAtPlayer(c)) c.h += clamp(angd(c.h, (c.goal.spot.face || 0) * D2R), -2 * dt, 2 * dt);
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
        if (!s.reach) { c.reachDoor = d.id; s.reach = 1e-6; c.rig?.set({ action: 'reach' }); }
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
      // An aside is still a walk: somebody else can block its escape route.
      // Re-choose the aside for that blocker too, rather than waiting for the
      // original person while a second walker waits for us (kitchen deadlock).
      if (o && s.blocked > 0.3 && (prio(c) < prio(o) || c.asideFor === o)) {
        c.pushT = nowMs(); c.pushN = 6; c.pushFrom = { x: o.x, z: o.z, lvl: o.lvl }; c.asideFor = o;
        stepAside(c, dt);
        if (c.goal === null && c.aside) { c.cur = null; c.plan = []; return; }
      }
      const waitFor = hit.b.who === 'player' ? 2.2 : hit.b.o && hit.b.o.v < 5 ? 0.5 : prio(c) < prio(hit.b.o) ? 1.2 : 2.5;
      if (s.blocked > waitFor) { // go round them
        // go round everyone nearby at once (avoiding just the one in front makes them ping-pong between two people)
        s.blocked = 0; const pl = player(), near = [];
        if (H.live && H.mode === 'walk' && sameFloor(c, pl) && dist(c, pl) < 320) near.push({ x: pl.x, z: pl.z, r: (window.Bonfire?.familySpace?.()||44)+4 });
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
    const vmax = s.yielding ? 65 : c.speed * (onFlight ? 0.72 : 1), want = left <= 0.5 ? 0 : Math.min(vmax, Math.sqrt(2 * 150 * left));
    c.v += clamp(want - c.v, -300 * dt, 170 * dt); if (c.v < 0) c.v = 0;
    const nextS=Math.min(stop < s.s ? s.s : stop, s.s + c.v * dt),next=NV.at(r,nextS),pl=player();
    // The player can move after an aside was planned. Yielding removes the
    // social buffer, never the head clearance: wait rather than walk into them.
    if(s.yielding&&sameFloor(c,pl)&&Math.hypot(next.x-pl.x,next.z-pl.z)<26&&Math.hypot(next.x-pl.x,next.z-pl.z)<dist(c,pl)-.01){c.v=0;return;}
    s.s = nextS;
    const p = NV.at(r, s.s), q = NV.at(r, Math.min(r.len, s.s + 28));
    c.x = p.x; c.z = p.z; c.lvl = p.lvl;
    if (r.len - s.s > 2 && !(s.yielding && c.aside?.narrow)) { const want2 = Math.atan2(q.x - p.x, q.z - p.z); if (Math.hypot(q.x - p.x, q.z - p.z) > 1) c.h += clamp(angd(c.h, want2), -4.5 * dt, 4.5 * dt); }
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
  function faceToward(c, p, dt) { if (c.seated || c.aside?.narrow || /^(washup|cook|water)$/.test(c.rig?.st.action||'')) return; const want = Math.atan2(p.x - c.x, p.z - c.z); c.h += clamp(angd(c.h, want), -3.5 * dt, 3.5 * dt); }
  // Listening is presentation only: no route, position, dialogue or random draw
  // changes. A wide group gets small turns with a pause between them. The rig's
  // existing exclusive support-foot solve lifts one shoe while the other stays.
  function listenerTurn(c, dt) {
    const other = c.listenTo, now = nowMs();
    if (c.seated || c.hold || c.talking || c.aside || c.pass && now < c.pass.until || c.goal?.key?.startsWith('bf.') || /^(washup|cook|wipe|water|carwash|phone|draw)$/.test(c.rig?.st.action||'') || NV.onFlight(c.x,c.z) || !other?.present || now >= c.listenUntil || other.room !== c.room || !sameFloor(c,other) || dist(c,other) >= 330) { c.listenPivot = null; return false; }
    let pivot = c.listenPivot;
    if (!pivot || pivot.other !== other) pivot = c.listenPivot = { other, at: now + 320, to: c.h, until: 0 };
    if (now < pivot.at) return true;
    if (now >= pivot.until) {
      const off = angd(c.h,Math.atan2(other.x-c.x,other.z-c.z));
      if (Math.abs(off) < .60) return true;
      pivot.to = c.h + clamp(off-Math.sign(off)*.28,-.44,.44); pivot.until = now + 800;
    }
    c.h += clamp(angd(c.h,pivot.to),-.8*dt,.8*dt);
    return true;
  }
  function displaySpeaking(c) { return speech.cur?.c === c && !!c.rig?.talking; }
  function lookingAtPlayer(c) { return c.goal?.key?.startsWith('bf.') ? displaySpeaking(c) : c.hold > 0 || c.talking; }
  // at the spot: the action, the props
  function arrive(c) {
    const g = c.goal; if (!c.rig || !g) return;
    let act = g.act || g.spot?.act || null;
    c.rig.set({ action: act, props: {} });
    if (g.onArrive) { const f = g.onArrive; g.onArrive = null; f(c); }
  }
  // stepping aside when you're trying to get past
  function stepAside(c, dt) {
    function asideClear(c, q) {
      // The navigation field under the flight describes the cupboard below it.
      // A short shuffle on a tread uses the real strings instead, at stair height.
      if (NV.onFlight?.(c.x,c.z) && NV.onFlight(q.x,q.z)) {
        const s=H._.grids.stairs[0];
        return Math.min(q.x-s.x0,s.x1-q.x);
      }
      return NV.clear(q.lvl,q.x,q.z);
    }
    function asideRoute(c, q, avoid) {
      const stairs=NV.onFlight?.(c.x,c.z)&&NV.onFlight(q.x,q.z),need=c.pass?16:NV.NEED;
      if (!stairs && asideClear(c,q)>=NV.NEED) {
        const r=NV.route({lvl:c.lvl,x:c.x,z:c.z},q,{avoid}),end=r?.pts?.[r.pts.length-1];
        const start=r?.pts?.[0];
        if(r&&(!start||Math.hypot(start.x-c.x,start.z-c.z)<1)&&(!end||Math.hypot(end.x-q.x,end.z-q.z)<1))return r;
      }
      const len=Math.hypot(q.x-c.x,q.z-c.z);
      let narrow=false;
      for(let d=0;d<=len;d+=3){
        const t=len?d/len:0,p={x:lerp(c.x,q.x,t),z:lerp(c.z,q.z,t),lvl:c.lvl},door=doorZone(p.x,p.z,c.lvl,0);
        if(asideClear(c,p)<NV.NEED)narrow=true;
        if(door&&!doorOpen(door)||asideClear(c,p)<need||avoid.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<o.r))return null;
      }
      // This short exact segment is checked every 3 cm. Unlike a full walking
      // route it can use a sideways body's depth, without snapping its endpoint.
      return {len,doors:[],narrow,pts:[{x:c.x,z:c.z,lvl:c.lvl,s:0,stairs},{x:q.x,z:q.z,lvl:c.lvl,s:len,stairs}]};
    }

    if (c.seated) return;
    // Make room at the sink before a stationary player has to push into Mom.
    // Reuse the normal checked aside route and its return-to-work behaviour.
    const sinkGuest = c.id === 'mom' && c.goal?.spot === SPOT.sink && c.cur?.k === 'act' && !dialogueHeld(c) && sameFloor(c, player()) && dist(c, player()) < 90;
    if (sinkGuest) { c.pushT = nowMs(); c.pushN = 6; c.pushFrom = null; c.asideFor = null; }
    if (c.goal?.key === 'aside' && c.aside && !((c.pushN || 0) >= 6 && nowMs() - c.pushT <= 600)) {
      const o = c.asideFor, released = o ? !o.present || dist(c, o) > 90 || o.cur?.k !== 'route' : !sameFloor(c,player()) || dist(c, player()) > 170;
      c.asideT = released ? c.asideT + dt : 0;
      if (c.asideT > 3) {
        let room = true;
        if (o?.present && dist(c, o) <= 90) {
          const g = target(c, clock(), true), to = g.away ? EXIT[g.exit] : g.spot?.seat ? Object.assign({lvl:g.spot.lvl},approachOf(g.spot.seat,g.spot.lvl)) : g.spot;
          room = to && !chars.some(q => q !== c && q.present && q.lvl === to.lvl && Math.hypot(to.x-q.x,to.z-q.z)<bodyGap(c,q)) && NV.route({lvl:c.lvl,x:c.x,z:c.z},to,{avoid:peopleAvoid(c)});
        }
        if (room) { c.aside = c.asideFor = null; c.pass = null; c.resumeAvoid = true; }
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
    for (const dd of (c.asideFor ? [55, 70, 90, 110] : [45, 60, 75, 30, 20, 12])) for (const sg of [1, -1]) {const forward=c.pass&&dd<=30?0:15;opts.push({ lvl: c.lvl, x: c.x + nx * dd * sg + dx / L0 * forward, z: c.z + nz * dd * sg + dz / L0 * forward });}
    // A doorway or furniture corner may have room behind a shoulder rather
    // than directly beside it. Back out into that room instead of pinning the
    // player against the jamb. Every candidate still needs a checked route.
    if (c.pass && !c.asideFor && !NV.onFlight?.(c.x,c.z)) for (const dd of [45,60,75,90]) for(let a=0;a<TAU;a+=Math.PI/4) opts.push({lvl:c.lvl,x:c.x+Math.sin(a)*dd,z:c.z+Math.cos(a)*dd});
    if (c.asideFor) for (const dd of [55, 80, 110, 140, 180, 240, 300]) for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) opts.push({ lvl: c.lvl, x: c.x + Math.sin(a) * dd, z: c.z + Math.cos(a) * dd });
    for (let i = opts.length - 1; i >= 0; i--) { const o = opts[i]; if (sinkGuest && Math.hypot(o.x-p.x,o.z-p.z)<100 || NV.onFlight?.(c.x,c.z)&&!NV.onFlight(o.x,o.z) || (NV.onFlight ? asideClear(c,o) : NV.clear(o.lvl,o.x,o.z)) < (c.pass?16:NV.NEED) || !c.pass && doorZone(o.x, o.z, o.lvl, 40) || chars.some(q => q !== c && q.present && q.lvl === c.lvl && Math.hypot(o.x - q.x, o.z - q.z) < bodyGap(c, q))) opts.splice(i, 1); }
    if (route?.r) for (let i = opts.length - 1; i >= 0; i--) {
      for (let d = 0; d <= 200; d += 20) { const q = NV.at(route.r, Math.min(route.r.len, route.s + d)); if (Math.hypot(opts[i].x - q.x, opts[i].z - q.z) < bodyGap(c, c.asideFor) + 6) { opts.splice(i, 1); break; } }
    }
    // Prefer a full shuffle, then the small wall/rail shuffle when a corridor
    // cannot hold two full bodies. Keep the player's chosen passing side free.
    const score = q => c.pass && nowMs() < c.pass.until ? Math.min(45,-(q.x-c.x)*c.pass.nx*c.pass.side-(q.z-c.z)*c.pass.nz*c.pass.side)-Math.hypot(q.x-c.x,q.z-c.z)*.01 : NV.clear(q.lvl,q.x,q.z);
    opts.sort((a, b) => c.asideFor ? Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z) : score(b)-score(a));
    const avoid = peopleAvoid(c);
    if(c.pass)avoid.push({x:p.x,z:p.z,r:Math.max(1,Math.min(30,dist(c,p)-1))});
    let checked;
    const choice = opts.find(q => (checked=asideRoute(c,q,avoid)));
    if (choice) choice.route=checked;
    if (choice) {
      const narrow=c.pass&&(checked.narrow||asideClear(c,choice)<NV.NEED);
      c.aside = Object.assign(choice, {narrow,face:(narrow?Math.atan2(c.pass.nx*c.pass.side,c.pass.nz*c.pass.side):Math.atan2(p.x-choice.x,p.z-choice.z))/D2R});
      c.asideT = 0; c.goal = null;
    }
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
    const parent = H.ROOMS[c.room]?.group || c.rig.group.parent; if (!parent?.visible) return false;
    if (H.mode !== 'walk' && H.mode !== 'focus' && H.mode !== 'glide') return false;
    H.camera.updateMatrixWorld(); pm.multiplyMatrices(H.camera.projectionMatrix, H.camera.matrixWorldInverse); frustum.setFromProjectionMatrix(pm);
    c.rig.group.getWorldPosition(wp); wp.y += 80; sph.set(wp, 110);
    return frustum.intersectsSphere(sph);
  }
  const inEarshot = (c, cm) => c.present && H.live && sameFloor(c, player()) && dist(c, player()) < (cm || 650) && !!(H.ROOMS[c.room]?.group || c.rig?.group?.parent)?.visible;

  // ================================================================ speech: one line at a time, in person or shouted
  const speech = { q: [], cur: null, until: 0, hard: 0, last: 0, voice: null, bub: null };
  const words = t => String(t).split(/\s+/).length;
  const lineMs = t => clamp(900 + words(t) * 340, 2300, 7600);
  function say(id, lineId, o) {
    // Unrecorded script variants use st.say's existing subtitle/bubble fallback.
    // Give them their own ids so an older, differently worded clip never plays.
    o = o || {}; const c = C[id], l = L[lineId] || (o.text ? [id, o.text] : null); if (!c || !l || !lineValid(c,lineId,o.displayText||l[1],o.context,o.requested || o.talk) || o.valid && !o.valid()) return false;
    const person = c.present && (o.force || inEarshot(c, o.range));
    const shout = !person && (l[2] === 'downstairs' || o.call);
    if (!person && !shout) return false;
    if (o.once) { const k = 'np.once.' + member() + '.' + (o.onceId || lineId); if (ls.get(k)) return false; ls.set(k, 1); }
    // never the same line again within a minute (unless you asked for a story instruction again)
    if (!o.resume && !o.again && c.said[lineId] && nowMs() - c.said[lineId] < 60000) return false;
    // Shouts, chores and seasonal lines arrive with `again`; even so, the very same line stays quiet for a while.
    if (!o.resume && o.again && !o.talk && !o.must && !/^c\d\./.test(lineId) && Date.now() - heardAt(lineId) < 150000) return false;
    // a scripted story line that plays by itself plays once per story step (saved: a refresh doesn't replay it)
    if (!o.resume && /^c\d\./.test(lineId) && !o.talk) { const step = window.st?.current?.()?.id || '-', k = 'np.step.' + member() + '.' + step + '.' + lineId; if (ls.get(k)) return false; ls.set(k, 1); }
    c.said[lineId] = nowMs(); hear(lineId);
    speech.q.push({ c, lineId, person, text: o.displayText||l[1], callout:o.callout, legacyShout:!!o.legacyShout, then: o.then, prio: o.prio || 0, talk: !!o.talk, requested:!!o.requested, gesture:!!o.gesture || dialogue()[lineId]?.kind === 'gesture', valid:o.valid, context:o.context });
    if (o.prio) speech.q.sort((a, b) => b.prio - a.prio);
    save();
    try { window.st?.prefetch?.(lineId,o); } catch (e) {}
    return true;
  }
  // Where a speaker is for their speech bubble (js/np-bubble.js) and their recorded voice (js/st-voice.js, positional)
  // (in your room, or just through a doorway: further rooms are behind walls, so their balloons go to the screen edge)
  const seenBy = c => c.present && !!c.rig?.group.visible && !!(H.ROOMS[c.room]?.group || c.rig.group.parent)?.visible && sameFloor(c, player()) && (c.room === H.here || dist(c, player()) < 450);
  const anchorOf = c => ({ top: v => c.rig.headTop(v), mouth: v => c.rig.mouthWorld(v), seen: () => seenBy(c), where: v => c.rig.headTop(v) });
  let V3 = null, voiceDirection = null;
  function speechTick() {
    const t = nowMs();
    if (speech.freeze) return; // (tests: hold the current line for a screenshot)
    if (!speech.cur && window.st?.voiceBusy) return;
    // (a recording that started late runs to its end, within reason)
    if (speech.cur && (t < speech.until || (speech.voice && !speech.voice.ended && speech.voice.started && t < speech.hard))) return;
    if (speech.cur) {
      if (speech.voice && !speech.voice.ended) speech.voice.stop(); // (F again: on to the next line)
      // Presentation remembers only a delivered nearby turn. This never
      // chooses, queues, repeats or consumes a line, and cannot lock the player.
      speech.previous={c:speech.cur.c,at:t,delivered:speech.cur.person&&(!speech.voice||speech.voice.started&&speech.voice.ended&&!speech.voice.cancelled)};
      if (speech.bub) { const b = speech.bub, next = speech.q[0]; if (next && next.c === speech.cur.c) b.close(true); else setTimeout(() => b.close(), next ? 1600 : 450); } // let the last speaker's comic panel linger through a reply
      if (speech.cur.c.rig && speech.voice) speech.cur.c.rig.hush();
      speech.voice = speech.bub = null;
      const f = speech.cur.then; speech.cur.c.talking = speech.q.some(q => q.c === speech.cur.c); speech.cur = null; save(); if (f) try { f(); } catch (e) { console.error(e); }
    }
    while (speech.q.length && (!lineValid(speech.q[0].c,speech.q[0].lineId,speech.q[0].text,speech.q[0].context,speech.q[0].requested || speech.q[0].talk) || speech.q[0].valid && !speech.q[0].valid())) {
      const stale = speech.q.shift(); stale.c.talking = false; stale.c.hold = 0; if(stale.talk && stale.c.present) acknowledge(stale.c); save();
    }
    const n0 = speech.q[0]; if (!n0) return;
    const welcome=n0.context?.kind==='welcome';
    // The first greeting needn't wait for the two startup instruction cards.
    // Its off-screen bubble uses the existing layout's keep-out rectangles.
    const busyNote=document.querySelector('.rm-note.on,.hs-voice.on,.hs-call.on');
    if (busyNote && (!welcome || document.querySelector('.hs-voice.on,.hs-call.on') || [...document.querySelectorAll('.rm-note.on')].some(n=>!['Have a look round','My room'].includes(n.querySelector('b')?.textContent)))) return;
    n0.base = n0.base || n0.text; // (lines with no script entry bring their own words)
    n0.text = window.st?.voiceText?.(n0.lineId, n0.base,n0) || n0.base;
    // Loading a reply's recording must not erase the conversational hand-off.
    // Capture its delivered predecessor when the already-selected turn is
    // ready to begin waiting, without changing queue/history/selection rules.
    if(!n0.familyPreviousChecked){n0.familyPreviousChecked=true;n0.familyPrevious=speech.previous&&t-speech.previous.at<2200?speech.previous:null;}
    const rec = window.Sound?.voicesOn && window.st?.voiceInfo?.(n0.lineId,n0);
    if (!welcome && rec && !window.st.voiceReady?.(n0.lineId,n0)) { // (the first welcome shows its name promptly even while audio is loading)
      if (!n0.waitFrom) { n0.waitFrom = t; try { window.st.prefetch(n0.lineId,n0); } catch (e) {} }
      if (t - n0.waitFrom < 4000) return;
    }
    const n = speech.q.shift();
    const ms = rec ? clamp(rec.dur * 1000 + 450, 1500, 14000) : lineMs(n.text);
    const previous=n.familyPrevious,reply=previous?.c;
    n.c.turnTo=null;
    if(previous?.delivered&&reply!==n.c&&reply?.present&&n.person&&!n.talk&&!n.c.hold&&reply.room===n.c.room&&sameFloor(n.c,reply)&&dist(n.c,reply)<330){
      n.c.turnTo=reply;n.c.turnUntil=t+ms+1500;n.c.rig?.replyTo?.(reply.rig);
    }
    const place = n.person ? '' : n.c.lvl !== H.W.lvl ? (n.c.lvl === 'G' ? '(downstairs)' : '(upstairs)') : '(in the ' + (n.c.room || 'house') + ')';
    const who = label(n.c) + (place ? ' ' + place : '');
    const c = n.c, here = c.present && !!c.rig, anchor = here ? anchorOf(c) : null;
    const bubble = !!((anchor || welcome) && window.NPCBubble?.ok());
    if (!V3 && window.THREE) { V3 = new THREE.Vector3(); voiceDirection = new THREE.Vector3(); }
    let voice = null;
    try {
      voice = window.st?.say(n.lineId, who, n.text, ms, { bubble, callout:n.callout, fx: L[n.lineId]?.[2], audio:!n.gesture,
        pos: c.rig && V3 ? () => c.rig.mouthWorld(V3) : null,
        dir: c.rig && voiceDirection ? () => c.rig.bones.head.getWorldDirection(voiceDirection) : null,
        through: () => window.Sound?.occlusion ? Sound.occlusion(c.room) : !sameFloor(c,player())||c.room!==H.here, gain: here ? 1 : 0.7 }) || null;
    } catch (e) { console.error(e); }
    if(!voice&&n.legacyShout)window.HouseLife?.shoutSound?.(n.text);
    if (bubble) speech.bub = window.NPCBubble.show({ key: c.id, who: label(c), place, text: n.text, ms, anchor, voice:welcome&&!voice?.started?null:voice, shout: !n.person });
    // Ordinary chats have an authored expression, including quoted warnings
    // and jokes about chores. Their words alone do not make a reprimand.
    const direction = window.NPCDialogue?.[n.lineId]?.mood || window.VoiceDirections?.[n.lineId];
    if (here && !n.gesture) c.rig.talk(ms - 300, n.text, voice, direction, n.lineId);
    if (here && n.gesture) c.rig.acknowledge(/smile/i.test(n.text)?'smile':'nod');
    if (voice) voice.onstart = h => { // (a slow connection: the line lasts as long as the recording, from when it really starts)
      if (speech.voice !== h) return; const end = nowMs() + h.dur * 1000;
      speech.until = Math.max(speech.until, end + 400); speech.hard = Math.max(speech.hard, end + 1500);
      if(c.turnTo)c.turnUntil=end+1500;
      if (here) c.rig.talk(end - nowMs(), n.text, h, direction, n.lineId);
    };
    if (n.person) c.talking = true;
    speech.cur = n; speech.voice = voice; speech.until = t + ms + 280; speech.hard = t + ms + 3500; speech.last = t;
    save(); // Make even an immediate refresh resume this line, before the periodic profile save.
  }

  // ================================================================ talking (F)
  const momGive = () => {
    const K = window.ChoreKit; if (!K) return null;
    const list = K.list().filter(id => !K.done(id) && L['chore.' + id + '.give'] && K.avail(id));
    return list[0] || null;
  };
  const pendingHand = {};
  function talk(id) {
    const c = C[id]; if (!c || !c.present) return;
    if (speech.cur && speech.cur.c === c && speech.cur.talk) return; // Repeated F never chops a spoken sentence.
    if (speech.q.some(q => q.c === c && q.talk)) return;
    // A fresh conversation stops even a shuffle already in progress. Only
    // new walking intent may release this hold; an earlier encounter cannot.
    c.pass = null; c.pushN = 0; c.pushFrom = null;
    // Let a passing remark finish before starting the conversation.
    if (window.Bonfire?.talk?.(id)) { c.hold = 3; if(!speech.q.some(n=>n.c===c) && speech.cur?.c!==c && !window.st?.voiceBusy) acknowledge(c); return; }
    const lines = talkLines(c);
    c.hold = 99; conversationHud();
    const p = player(), d = dist(c, p);
    H.frameConversation?.(() => c.rig.eyeWorld(conversationFace), () => c.present && c.hold > 0, 'np.' + c.id);
    if (!c.seated && d < 82 && sameFloor(c, p)) { // (half a pace back if there's room: never into the worktop)
      const a0 = Math.atan2(c.x - p.x, c.z - p.z); c.backoff = null;
      for (const da of [0, 0.5, -0.5, 0.9, -0.9]) {
        const a = a0 + da, step = 32, tx = c.x + Math.sin(a) * step, tz = c.z + Math.cos(a) * step;
        if (Math.hypot(tx - p.x, tz - p.z) < d + 14 || NV.clear(c.lvl, tx, tz) < Math.min(NV.NEED - 4, NV.clear(c.lvl, c.x, c.z) - 1)) continue; // (as much room as where she stands: fine by a worktop)
        c.backoff = { x: tx, z: tz }; c.backHome = c.backHome || { x: c.x, z: c.z }; break;
      }
    }
    const fresh = lines.filter(l => { const lid = typeof l === 'string' ? l : l?.id; return !!lid && (/^c\d\./.test(lid) || !(c.said[lid] && nowMs() - c.said[lid] < 60000) && Date.now() - heardAt(lid) > 90000); });
    if (!fresh.length) { acknowledge(c); return; }
    fresh.forEach((l, i) => say(id, typeof l === 'string' ? l : l.id, { force: true, prio: 5, talk: true, again: true, then: () => { if (typeof l !== 'string' && l.then) l.then(); if (i === fresh.length - 1) c.hold = 1.5; } }));
  }
  function talkLines(c) {
    const s = window.st?.getState?.(), cur = window.st?.current?.()?.id, story = s && !s.flags.veteran;
    if (c.id === 'mom') {
      if (story && cur === 'meetmom') return ['c1.mom.give', { id: 'c1.mom.give2', then: () => { window.st.event('meetmom'); say('mom', 'c1.mom.leave', { force: true }); } }];
      if (pendingHand.mom) { const p = pendingHand.mom; delete pendingHand.mom; return [p.done].concat(p.rate ? [p.rate] : []); }
      if (story && s.ch === 1 && ['tidy', 'bed', 'bin'].includes(cur)) return jobReply(c,cur);
      const g = momGive(); if (g) { try { window.ChoreKit.chip?.(g); } catch (e) {} return jobReply(c,g); }
      const K = window.ChoreKit; if (K && K.list().length && K.list().every(id => K.done(id))) return [pick(['chore.allfour', 'bark.mom.react.praise'].concat(barkPool(c,clock(),true)||[]), c)];
      return [pick(barkPool(c, clock(), true) || ['bark.mom.react.praise'], c)];
    }
    if (c.id === 'dad') {
      if (story && s.ch === 1 && ['dad', 'boot'].includes(cur)) return s.done.boot || heardAt('c1.dad.story') ? ['c1.dad.brief'] : ['c1.dad.story', 'c1.dad.offer', 'c1.dad.yes', 'c1.dad.boot'];
      if (story && s.ch === 1 && /^part\./.test(cur)) return ['c1.dad.brief'];
      if (story && s.ch === 1 && /^lead\./.test(cur)) return [cur === 'lead.power' ? 'c1.lead.dad' : 'c1.lead.dad.power'];
      if (story && s.ch === 1 && cur === 'power') return ['c1.power.dad'];
      if (story && s.ch >= 2) { const k = 'np.pocket.' + member(); if (!ls.get(k)) { ls.set(k, 1); return ['c2.pocket.dad', 'c2.pocket.dad2', 'c2.pocket.dad3', 'c2.pocket.dad4']; } }
      const clk = clock();
      return [pick(barkPool(c, clk, true) || ['bark.dad.react.joke'], c)];
    }
    return [pick(barkPool(c, clock(), true) || ['bark.sis.react.console', 'bark.sis.react.drawing'], c)];
  }
  function pick(list, c) { const L2 = list.filter(id => L[id] && !recent(id) && !speech.q.some(n=>n.lineId===id)); const id = freshest(L2, x => x, c.lastBarkId); if (id) c.lastBarkId = id; return id; }
  // Authored conditions are data, never expressions. Re-evaluate before delivery
  // as well as selection: a queued line must still describe the world now.
  const dialogue = () => window.NPCDialogue || {};
  const periodOf = t => t < 6 ? 'night' : t < 12 ? 'morning' : t < 18 ? 'afternoon' : 'evening';
  function dialogueFits(c, when = {}, clk = clock()) {
    const K = window.ChoreKit, s = window.st?.getState?.(), month = Math.floor(clk.md / 100);
    const season = month === 12 || month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'autumn';
    const forecast = window.TTXData?.weather?.[month - 1] || '';
    const weather = /rain|shower|drizzle|wet|damp/i.test(forecast) ? 'wet' : /cold|frost|snow/i.test(forecast) ? 'cold' : /warm|hot/i.test(forecast) ? 'warm' : '';
    return (!when.period || periodOf(clk.t) === when.period) && (when.dow === undefined || clk.dow === when.dow) &&
      (!when.room || c.room === when.room) && (!when.season || season === when.season) && (!when.weather || weather === when.weather) &&
      (!when.job || !!K?.avail(when.job) && (K.list().includes(when.job) || window.st?.current?.()?.id === when.job) && !K.done(when.job)) && (!when.jobDone || !!K?.done(when.jobDone)) &&
      (!when.console || !!window.PM?.owns?.('hardware.' + when.console)) && (!when.chapter || (when.chapter === 1 ? s?.ch === 1 && !s.flags?.veteran : s?.ch >= when.chapter || s?.flags?.veteran));
  }
  function dialoguePool(c, kind = 'talk', clk = clock()) {
    return Object.entries(dialogue()).filter(([,d]) => d.speaker === c.id && d.kind === kind && dialogueFits(c,d.when,clk)).map(([id]) => id);
  }
  const recent = id => Date.now() - heardAt(id) < 24 * 60 * 60000;
  function jobReply(c, job) {
    const entries = Object.entries(dialogue()).filter(([,d]) => d.speaker === c.id && d.when.job === job && dialogueFits(c,d.when));
    const give = entries.filter(([,d]) => d.kind === 'give').map(([id]) => id);
    const storyGive = {bed:'c1.bed.give',bin:'c1.bin.give'}[job];
    const introduced = heardAt('chore.' + job + '.give') || give.some(id => heardAt(id)) || storyGive && ls.get('np.step.' + member() + '.' + (window.st?.current?.()?.id||'-') + '.' + storyGive);
    const reminders = entries.filter(([,d]) => d.kind === 'remind').map(([id]) => id);
    if (!introduced) return [pick(give,c)];
    // A question about an unfinished job first earns a brief reminder. Once
    // those are familiar, allow ordinary conversation instead of nagging again.
    return [pick(reminders,c) || pick(barkPool(c,clock(),true) || [],c)];
  }
  function lineValid(c, id, text, context, requested) {
    // Requested/story/phone speech describes the conversation, not an ambient
    // guess about the room. Only unsolicited lines inherit ambient eligibility.
    if (requested) return true;
    const d = dialogue()[id];
    if (d && !dialogueFits(c,d.when)) return false;
    if (id === 'chore.allfour' && !window.ChoreKit?.list?.().every(k=>window.ChoreKit.done(k))) return false;
    if (/^bark\./.test(id) && !(barkPool(c,clock(),true)||[]).includes(id)) return false;
    if (context?.kind === 'seasonPhase') return !!window.Season?.active?.().some(x=>x.e.id===context.event && x.phase===context.phase);
    if (context?.kind === 'bonfireStage') return window.Bonfire?._?.stageAt?.() === context.stage;
    if (context?.kind === 'tvQuiet') return !!window.HouseLife?.quiet?.() && !!window.HouseTelly?.on && window.HouseTelly.volume >= 8;
    if (context?.kind === 'moment') return !!window.HouseLife?.momentValid?.(context.text);
    if (context?.kind === 'choreNag') return !!window.ChoreKit?.list?.().some(k=>!window.ChoreKit.done(k)) && (!context.pc || H.mode === 'monitor');
    return true;
  }
  function acknowledge(c) {
    const id = freshest(dialoguePool(c,'gesture'));
    if (id) say(c.id,id,{force:true,talk:true,again:true,gesture:true,prio:5,then:()=>{c.hold=1.5;}});
    c.hold = 2;
  }

  const eyes = () => ({ x: H.P.x, y: H.P.y, z: H.P.z });
  const conversationFace = new T.Vector3();

  // ================================================================ barks: the house talking to itself
  function barkPool(c, clk, talking) {
    const t = clk.t, room = c.room, p = player(), pr = H.here, act = c.goal?.act || c.goal?.spot?.act, pool = [];
    const tv = window.HouseTelly, K = window.ChoreKit;
    const date = new Date(1999,Math.floor(clk.md/100)-1,clk.md%100+1), tomorrow = mk((date.getMonth()+1)*100+date.getDate(),date.getDay(),8);
    const add = (cond, ids) => { if (cond) pool.push(...ids); };
    if (c.id === 'mom') {
      add(t >= 17.5 && t < 18.5 && room === 'kitchen', pr === 'kitchen' ? ['bark.mom.tea4'] : ['bark.mom.tea1', 'bark.mom.tea2']);
      add(clk.school && t >= 7 && t < 8.5, pr === 'bedroom' || pr === 'landing' ? ['bark.mom.school1'] : ['bark.mom.school2', 'bark.mom.school3']);
      add(clk.dow === 6 && t >= 7.5 && t < 10.5 && room === 'kitchen', ['bark.mom.wknd1']);
      add(clk.dow === 0 && t >= 8 && t < 12.5, ['bark.mom.wknd2']);
      add(act === 'washup', ['bark.mom.mess4']);
      add(room === 'lounge', ['bark.mom.mess3']); add(room === 'lounge' && tv?.on, ['bark.mom.tv2']);
      add(room === 'hall', ['bark.mom.mess2']);
      add(t >= 21 && t < 21.5, ['bark.mom.bed1']); add(t >= 21.5 && t < 22 && tomorrow.school, ['bark.mom.bed2']); add(t >= 22 && t < 22.5 && H.mode === 'monitor', ['bark.mom.bed3']);
      add(t >= 12 && t < 17 && window.ChoreKit && window.ChoreKit.list().includes('washup') && !window.ChoreKit.done('washup'), ['bark.mom.react.nag']);
      add(act === 'phone', ['bark.mom.line1', 'bark.mom.line2']);
      if (talking) add(!!K && K.list().some(id=>K.done(id)), ['bark.mom.react.praise']);
    } else if (c.id === 'dad') {
      add(t >= 17.5 && t < 18.5 && (room === 'kitchen' || room === 'lounge'), ['bark.dad.tea1']);
      add(t >= 17.5 && t < 18.5 && room === 'kitchen' && !!K?.has?.('table','sauce'), ['bark.dad.tea2']);
      add(clk.work && t >= 6.7 && t < 7.8, ['bark.dad.school1']);
      add(clk.dow === 6, ['bark.dad.wknd1', 'bark.dad.wknd3']); add(clk.dow === 0 && room === 'lounge', ['bark.dad.wknd2']);
      add(room === 'lounge' && tv?.on && (act === 'telly' || act === 'remote'), ['bark.dad.tv2']);
      add(room === 'lounge' && tv?.on && tv.st?.text, ['bark.dad.tv3']);
      add(room === 'lounge' && c.seated, ['bark.dad.mess2']); add(room === 'hall', ['bark.dad.mess1', 'bark.dad.line3']);
      add(room === 'garden', ['bark.dad.react.garden', 'bark.dad.react.gnome']);
      add(t >= 21.5 && t < 22.5, ['bark.dad.bed1']);
      add(H.mode === 'monitor' && t >= 22, ['bark.dad.bed2']);
      add(true, ['bark.dad.react.joke']);
    } else {
      add(t >= 17.5 && t < 18.5 && (room === 'kitchen' || room === 'lounge'), ['bark.sis.tea1', 'bark.sis.tea2']);
      add(clk.school && t >= 7 && t < 8.4, ['bark.sis.school1', 'bark.sis.school2']);
      add(clk.dow === 6 && t >= 7 && t < 12, ['bark.sis.wknd1']); add(clk.dow === 0, ['bark.sis.wknd2']);
      add(room === 'lounge' && act === 'telly' && tv?.on, ['bark.sis.tv1', 'bark.sis.tv2']);
      add(room === 'hall', ['bark.sis.react.lounge', 'bark.sis.mess2']);
      add(t >= 20 && t < 21, ['bark.sis.bed1', 'bark.sis.bed2']);
      add(!c.seated, ['bark.sis.react.peek']);
      add(true, ['bark.sis.react.drawing', 'bark.sis.react.console']);
    }
    pool.push(...dialoguePool(c,'talk',clk));
    return pool.length ? pool : null;
  }
  let barkAt = nowMs() + 25000;
  function barks(clk) {
    const t = nowMs();
    if (window.Bonfire?.familyLook?.()) return; // (nobody asks about the landing light while the fireworks are going)
    if (t < barkAt || speech.cur || speech.q.length || t - speech.last < 25000 || H.mode !== 'walk' || H.paused || document.querySelector('.hs-voice.on,.hs-call.on')) return;
    barkAt = t + 30000 + Math.random() * 40000;
    const cands = chars.filter(c => c.present && !c.talking && c.cur && (c.cur.k === 'act' || c.cur.k === 'route'));
    for (const c of cands.sort(() => Math.random() - 0.5)) {
      const pool = barkPool(c, clk, false); if (!pool) continue;
      const near = inEarshot(c, 600);
      const ok = pool.filter(id => L[id] && (near ? L[id][2] !== 'downstairs' : L[id][2] === 'downstairs' && c.lvl !== player().lvl) && (!c.said[id] || c.said[id] < t - 15 * 60000) && !recent(id));
      if (!ok.length) continue;
      const id = pick(ok, c);
      if (say(c.id, id, near ? {} : { call: true })) return;
    }
  }

  // ================================================================ the story, in person
  let lastStep = null, visit = null;
  const storyOn = () => { const s = window.st?.getState?.(); return !!(s && !s.flags.veteran); };
  const firstBeat = () => storyOn() && window.st.current()?.id === 'lad' && !Object.keys(window.st.getState().done).length;
  function openingCall() {
    if (!firstBeat()) return false;
    const t = clock().t, id = 'c1.wake.mom.call', o = { call: true, once: true, onceId: id, prio: 1 };
    if (t >= 6 && t < 12) return say('mom', id, o);
    if (t >= 12 && t < 18) return say('mom', id + '.day', Object.assign(o, { text: "The afternoon's going by! One quick game, then come and see me!" }));
    if (t >= 18 && t < 22) return say('mom', id + '.evening', Object.assign(o, { text: "Evening already! Come and see me before it gets too late!" }));
    return say('mom', id + '.night', Object.assign(o, { text: "Still awake? Keep it down, it's late. Come and see me when you're ready." }));
  }
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
  // Social distance belongs to the family's route planner, never to the
  // player's body. Even on Bonfire evening there is only a small physical core.
  const space = c => c.seated ? 24 : 26;
  const NO_BLOCKERS = Object.freeze([]);
  function bodyNear(c, lvl) {
    if (!c.present || !(c.lvl === lvl || NV.onFlight(c.x, c.z) && NV.onFlight(H.W.x, H.W.z))) return false;
    // Match placeRig's actual feet, rather than treating every cupboard X/Z
    // as the flight above it. A crouched head below someone's feet cannot
    // touch them through the solid soffit, even within the old 110 cm band.
    const feet = NV.floor(c.lvl, c.x, c.z);
    const head = H.W.fy - (H.W.eyeNow ?? H.W.eye ?? H.STAND ?? 143);
    return Math.abs(feet - H.W.fy) < 110 && feet >= head;
  }
  function blocks(x, z, lvl) {
    if (!ready) return false;
    if (lvl === 'U' && doorHeld() && x > 222 && x < 270 && z > 140 && z < 240 && H.W.x < 236) { heldHint(); return true; }
    for (const c of chars) {
      const r=space(c);
      if(!c.present||Math.abs(x-c.x)>=r||Math.abs(z-c.z)>=r)continue;
      if (!bodyNear(c,lvl)) continue;
      const d = Math.hypot(x-c.x,z-c.z), old = Math.hypot(H.W.x-c.x,H.W.z-c.z);
      // A person coming to stand over an old pose must never pin it in place.
      if (d < space(c) && d < old - 0.00001) return true;
    }
    return false;
  }
  function blockers(x, z, lvl, skin) {
    if (!ready) return NO_BLOCKERS;
    let out = null;
    for (const c of chars) {
      const dx=x-c.x,dz=z-c.z,r=space(c),reach=r+(skin||0);
      if(!c.present||Math.abs(dx)>=reach||Math.abs(dz)>=reach||dx*dx+dz*dz>=reach*reach)continue;
      if (!bodyNear(c,lvl)) continue;
      (out||(out=[])).push({x:c.x,z:c.z,r});
    }
    return out || NO_BLOCKERS;
  }
  function blocker(x,z,lvl,skin) { return blockers(x,z,lvl,skin)[0] || null; }

  // Called each walking step with actual keyboard/stick intent, before
  // collision removes the forward velocity. No searches for distant people;
  // a nearby person's checked aside is requested at most once a second.
  function passage(dx,dz,dt,canStand) {
    if (!ready) return {dx,dz};
    const len = Math.hypot(dx,dz);
    if (len < 0.001) return {dx,dz};
    const ux=dx/len, uz=dz/len, nx=-uz, nz=ux, now=nowMs();
    let steer=null, nearest=Infinity;
    for (const c of chars) {
      if(!c.present||Math.abs(c.x-H.W.x)>185||Math.abs(c.z-H.W.z)>185)continue;
      if (!bodyNear(c,H.W.lvl)) continue;
      const cx=c.x-H.W.x, cz=c.z-H.W.z, along=cx*ux+cz*uz, cross=cx*nx+cz*nz, r=space(c);
      if (along < -r || along > 155 || Math.abs(cross)>r+30) continue;
      if (!c.pass || now>c.pass.until) {
        // Choose once for the encounter. Room for the player's feet wins;
        // ties use the side already nearest, rather than changing each frame.
        const sideScore = side => {
          const x=c.x+nx*(r+5)*side,z=c.z+nz*(r+5)*side;
          return (canStand(x,z,NV.onFlight(c.x,c.z)?NV.ramp(c.z):H.LV[c.lvl])?1000:0)+NV.clear(c.lvl,x,z);
        };
        const left=sideScore(1),right=sideScore(-1);
        c.pass={nx,nz,side:left===right?(cross>0?-1:1):left>right?1:-1,until:now+1400};
      }
      c.pass.until=now+1400;
      if (!c.seated && !c.aside && now>(c.yieldAt||0)) {
        c.yieldAt=now+1000; c.pushT=now; c.pushN=6;
        c.pushFrom={x:H.W.x,z:H.W.z,lvl:H.W.lvl}; c.asideFor=null;
      }
      if (along<95 && along> -3 && Math.abs(cross)<r+7 && along<nearest) {steer=c;nearest=along;}
    }
    if (steer) {
      const c=steer,p=c.pass;
      // Aim beside the body before contact. A fixed encounter side plus the
      // ordinary contact-plane solver prevents head-on stalls and X/Z jitter.
      const lateral=(c.x-H.W.x)*p.nx+(c.z-H.W.z)*p.nz+p.side*(space(c)+5);
      const bend=clamp(lateral/Math.max(20,nearest),-1.5,1.5);
      const k=len/Math.hypot(1,bend);
      const sx=(ux+p.nx*bend)*k,sz=(uz+p.nz*bend)*k;
      if (canStand(H.W.x+sx,H.W.z+sz,H.W.fy)) return {dx:sx,dz:sz};
    }
    return {dx,dz};
  }
  function looks(c) {
    if (!c.rig) return;
    const p = player(), d = dist(c, p);
    // A display keeps their attention; the existing speaking animation glances
    // at you, then returns to the show. No new animation loop or route changes.
    const show = c.goal?.key?.startsWith('bf.') ? window.Bonfire?.familyLook?.() : null;
    const speaking = !!show && displaySpeaking(c);
    let look = show || null;
    if ((!show || speaking) && c.present && sameFloor(c, p) && (c.talking || c.hold > 0 || d < 330)) {
      const fwd = Math.atan2(p.x - c.x, p.z - c.z), off = Math.abs(angd(c.seated ? c.seated.face * D2R : c.h, fwd));
      if (speaking || c.talking || c.hold > 0 || off < 1.7) look = eyes();
    }
    const speaker=speech.cur?.c, listening=c.present&&speaker&&speaker!==c&&speaker.present&&speaker.room===c.room&&sameFloor(c,speaker)&&dist(c,speaker)<330;
    // Keep the last addressee through the short silence between queue turns.
    // Do not swing back to the player for one frame between every sentence.
    if (listening) { c.listenTo = speaker; c.listenUntil = nowMs() + 850; c.wasListening = true; }
    else if (c.wasListening) { c.listenUntil = nowMs() + 850; c.wasListening = false; }
    const last = c.listenTo, heldListen = !c.talking && !c.hold && last?.present && nowMs() < c.listenUntil && last.room === c.room && sameFloor(c,last) && dist(c,last) < 330;
    const listenerTarget = listening ? speaker : heldListen ? last : null;
    if(listenerTarget&&!c.hold&&!show)look=listenerTarget.rig.eyeWorld(c.listenEye||(c.listenEye=new T.Vector3()));
    const addressee=c.turnTo;
    if(!show&&!c.hold&&speaker===c&&addressee?.present&&nowMs()<c.turnUntil&&addressee.room===c.room&&sameFloor(c,addressee)&&dist(c,addressee)<330)look=addressee.rig.eyeWorld(c.turnEye||(c.turnEye=new T.Vector3()));
    c.rig.set({ look, listen: listenerTarget?listenerTarget.rig:null, engage: c.present && c.hold > 0 });
  }

  // ================================================================ the loop
  let ready = false, lastT = 0, lastFrame = 0, simMode = false;
  const visible = c => c.present && c.rig && (c.rig.st?.readingParked ? c.rig.st.personVisible : (c.rig.group?.parent || H.ROOMS[c.room]?.group)?.visible);
  function dialogueHeld(c) {
    if (c.pass && nowMs() < c.pass.until) return false; // walking away releases the pose, never the spoken line
    if (c.goal?.key === 'aside' && !c.aside && c.hold <= 0) return false; // the player left; a passing line may finish back at work
    if (c.hold > 0) return true;
    const line = speech.cur;
    // A passing line must not strand a cleared avoidance goal.
    // Explicit conversations and Chapter 1 instructions keep their pose hold.
    if (!c.goal && !c.aside && line?.c === c && !line.talk && !line.requested && !/^c\d\.|^st\.opening\./.test(line.lineId)) return false;
    // A passing remark can continue while its speaker steps out of the way.
    // It is not a conversation lock, and must not leave a yielded goal null.
    return !!(c.talking && line?.c === c && (line.talk || !/^bark\./.test(line.lineId)));
  }
  function tick(dt) {
    const clk = clock();
    directives = Object.assign(storyDirectives(), manual);
    for (const id in sceneDbg) directives[id] = entrance(id, sceneDbg[id]);
    entranceTick(dt);
    for (const c of chars) {
      if (c.present && c.pass && nowMs() < c.pass.until) stepAside(c, dt);
      const want = target(c, clk);
      if (!c.present) { maybeSpawn(c, want, clk); if(c.rig?.st.readingParked)placeRig(c); continue; }
      if ((!c.goal || want.key !== c.goal.key) && !dialogueHeld(c)) setGoal(c, want);
      step(c, dt, clk);
      placeRig(c);
    }
    H.ROOMS.drive?.car?.update();
    outfits();
    if (simMode) return;
    speechTick(); barks(clk); carryReactions(); gameLadCameo();
    for (const c of chars) looks(c);
    conversationHud();
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
    if (fresh && s.seat) { const q = seatFor(c, s); spawn(c, { lvl: s.lvl, x: q.x, z: q.z, face: q.face }); c.goal = want; c.seated = q; c.rig.set({ seat: seatPose(c, q) }); c.rig.st.sitK = 1; c.plan = [{ k: 'act' }]; return; }
    if (seenAt(from)) return; // (never appear where you can see it: wait until you look away)
    spawn(c, from); setGoal(c, want);
  }
  // after a refresh: everyone where they were (if it's recent), otherwise where the clock says
  const SKEY = () => 'jhp_np_v1.' + (member() || 'guest');
  let savedAt = 0;
  function save() {
    savedAt = nowMs(); if (simMode) return;
    const o = { pv:10, t: Date.now(), c: {} };
    for (const c of chars) o.c[c.id] = c.present ? { p: 1, x: Math.round(c.x), z: Math.round(c.z), lvl: c.lvl, h: +c.h.toFixed(2), g: c.goal?.key || null, reading: c.rig?.readingState, seat: c.seated ? SPOT_OF(c.seated) : null, pose: ['sit', 'stand'].includes(c.cur?.k) ? { motion:3, started:!!c.cur.started, x:c.x, z:c.z, k: c.cur.k, seat: SPOT_OF(c.cur.seat), t: c.cur.t, from: c.cur.from, blend: c.rig.st.sitK, feet: c.rig.st.feet.map(f => ({ x: f.x, y: f.y, z: f.z, yaw: f.yaw })) } : null } : { p: 0, reading:c.rig?.readingState };
    // Resume the spoken exchange as well as the people. Functions are rebuilt from
    // the current story's talkLines; no reward or story event is replayed on load.
    o.conversation = {step:window.st?.current?.()?.id || null,lines:[speech.cur,...speech.q].filter(n=>n && (n!==speech.cur || !speech.voice?.ended && n.context?.kind!=='welcome')).slice(0,24).map(n=>({id:n.c.id,line:n.lineId,text:n.base||n.text,talk:n.talk,requested:n.requested,callout:n.callout,legacyShout:n.legacyShout,context:n.context}))};
    ls.set(SKEY(), o);
  }
  const SPOT_OF = q => Object.keys(SPOT).find(k => SPOT[k].seat === q || SPOT[k].childSeat === q) || null;
  function restore() {
    const o = ls.get(SKEY()), clk = clock();
    if(o && (o.pv||0)<10)for(const sv of Object.values(o.c||{}))if(sv.p&&sv.lvl==='G'){
      if(sv.z< -56&&sv.z> -240&&sv.x<215)sv.z-=120;
      else if(sv.x<83&&sv.z>=16&&sv.z<=65)sv.z-=120;
    }
    for (const c of chars) {
      const want = target(c, clk), sv = o && Date.now() - o.t < 10 * 60000 ? o.c[c.id] : null;
      if(sv?.reading&&!sv.p&&want.away){c.rig.restoreReading(sv.reading);c.rig.st.readingStow=false;c.rig.st.readingParked=true;placeRig(c);c.rig.update(0,false);continue;}
      if (sv && sv.p && !want.away && sv.g === want.key) { // carry on exactly where they were
        if (sv.pose && SPOT[sv.pose.seat]?.seat && ['sit', 'stand'].includes(sv.pose.k)) {
          const p = sv.pose, q = seatFor(c, SPOT[p.seat]);
          spawn(c, { lvl: sv.lvl, x: Number.isFinite(p.x)?p.x:sv.x, z: Number.isFinite(p.z)?p.z:sv.z }, sv.h); c.goal = want;
          c.rig.set({ seat: seatPose(c, q) }); c.rig.st.sitK = clamp(+p.blend || 0, 0, 1);
          if (p.k === 'stand') { c.seated = q; setGoal(c, want); c.plan.shift(); if(p.started!==false)c.rig.set({ seat: null }); }
          else c.plan = [{ k: 'act' }];
          // Older saved phases used the previous root curves; retain their
          // position by converting phase time, without moving a saved anchor.
          const phase=p.motion===3?+p.t:p.k==='sit'?(+p.t||0)*0.7/1.1:0.12+(+p.t||0)*0.83/0.95;
          c.cur = { k: p.k, seat: q, t: clamp(phase || 0, 0, 1.2), from: p.from || { x: sv.x, z: sv.z }, started: p.k === 'stand' && p.started!==false };
          c.rig.restoreReading(sv.reading);
          if (Array.isArray(p.feet) && p.feet.length === 2) p.feet.forEach((f, i) => { if (['x', 'y', 'z', 'yaw'].every(k => Number.isFinite(f[k]))) Object.assign(c.rig.st.feet[i], f); });
          c.rig.update(0, true); continue;
        }
        if (sv.seat && SPOT[sv.seat]?.seat) { const q = seatFor(c, SPOT[sv.seat]); spawn(c, { lvl: SPOT[sv.seat].lvl, x: q.x, z: q.z, face: q.face }); c.goal = want; c.seated = q; c.rig.set({ seat: seatPose(c, q) }); c.rig.st.sitK = 1; c.plan = [{ k: 'act' }]; c.rig.restoreReading(sv.reading); }
        else { spawn(c, { lvl: sv.lvl, x: sv.x, z: sv.z }, sv.h); c.goal = null; c.rig.restoreReading(sv.reading); }
        continue;
      }
      if (sv && sv.p && !want.away) { spawn(c, { lvl: sv.lvl, x: sv.x, z: sv.z }, sv.h); c.goal = null; c.rig.restoreReading(sv.reading); continue; } // then walk on to where the clock says
      if (!want.away) {maybeSpawn(c, want, clk, true);if(sv?.reading)c.rig.restoreReading(sv.reading);}
    }
    const conversation=o&&Date.now()-o.t<10*60000&&o.conversation;
    if(conversation && Array.isArray(conversation.lines)) {
      const lines=conversation.lines.filter(n=>C[n.id]&&typeof n.line==='string'&&typeof n.text==='string'&&(conversation.step===(window.st?.current?.()?.id||null)||!/^c\d\.|^st\.opening\./.test(n.line)));
      const queued = new Set([speech.cur,...speech.q].filter(Boolean).map(n=>n.c.id+':'+n.lineId));
      lines.forEach((n,i)=>{
        const key=n.id+':'+n.line; if(queued.has(key))return; queued.add(key);
        const c=C[n.id],script=/^c\d\./.test(n.line)&&n.talk!==false&&talkLines(c).find(l=>(typeof l==='string'?l:l?.id)===n.line);
        c.hold=99;
        say(n.id,n.line,{text:n.text,displayText:n.text,callout:n.callout,legacyShout:n.legacyShout,context:n.context,requested:n.requested,force:true,call:true,again:true,resume:true,talk:n.talk!==false,prio:5,then:()=>{if(script&&typeof script!=='string')script.then?.();if(i===lines.length-1)c.hold=1.5;}});
      });
    }
  }
  addEventListener('pagehide',()=>{if(ready)save();});
  document.addEventListener('visibilitychange',()=>{if(ready&&document.hidden)save();});

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
    if (!H.live || document.hidden) return;
    // Shouting from downstairs needs no rig. Deliver the first welcome while
    // the rest of the house/people are still being built on a slow device.
    if (!ready) { if (window.AccountGate?.allowed && (speech.cur?.context?.kind==='welcome' || speech.q[0]?.context?.kind==='welcome')) speechTick(); return; }
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
  function storyHome() {
    const s=window.st?.getState?.()||window.StorySnapshot,clk=clock();
    // The hand-me-down keeps Dad home even on a resumed weekday. The spoken
    // arrival cue is once-only, so it cannot be the only source of this state.
    if(s?.ch===1&&!s.flags.veteran&&s.done.bin&&dadHomeDay()!==clk.md)ls.set('jhp_np_dadhome',clk.md);
  }
  async function start() {
    if (ready) return;
    try { await window.Room?.ensureHouse?.(); } catch (e) { return; }
    storyHome();
    directives = Object.assign(storyDirectives(), manual);
    for (const id in H.ROOMS) H.buildRoom(H.ROOMS[id]);
    await new Promise(r => setTimeout(r, 50));
    NV.rebuild();
    for (const c of chars) { build(c); await new Promise(r => setTimeout(r, 30)); }
    ready = true;
    restore();
    for (const c of chars) placeRig(c);
    kick(); if (!still()) H.dirty(); // (a close-up redraws on its own when you leave it)
    window.st?.onChange?.(s => {
      storyHome();
      const cur = window.st.current()?.id || null; if (cur !== lastStep) { const prev = lastStep; lastStep = cur; if (prev !== null && s && !s.flags.veteran) stepChanged(cur, prev, s); }
    });
    lastStep = window.st?.current?.()?.id || null;
    H.on('grab', onGrab);
    H.on('room', () => kick());
    H.on('door', () => kick());
    H.on('mode', () => kick());
    addEventListener('ownerclock', () => { for (const c of chars) { c.goal = null; } });
    // Mom calls up at the start, using the in-game hour when she actually speaks.
    // Recheck after the delay: early/out-of-order progress must not get a stale call.
    if (firstBeat()) setTimeout(openingCall, 7000);
  }
  function boot() {
    if (ready) return;
    if (!H.live || !window.AccountGate?.allowed || document.querySelector('.hs-loading,#houseEntry')) { setTimeout(boot, 1000); return; }
    setTimeout(start, 2500);
  }
  boot();

  // ================================================================ the API
  window.HouseFamily = {
    // Other house speech (hs-life moments, chore shouts) picks through the same memory and marks what it chose.
    freshest: (list, key = x => x) => { const x = freshest(list.filter(v=>!recent(key(v))), key); if (x !== undefined) hear(key(x)); return x; }, heardAt,
    enabled: true, get active() { return ready; }, get ready() { return ready; }, chars: C,
    get speaking() { return !!speech.cur || speech.q.length > 0; },
    // Bedtime keeps the car at home; work follows the real routine and story/home-day exceptions.
    get carAway() {
      const s=window.st?.getState?.()||window.StorySnapshot;
      // AccountGate can receive the authoritative snapshot before st-engine is
      // loaded. An unknown story must not send the hand-me-down away to work.
      const openingHome=s?.ch===1&&!s.flags?.veteran&&s.done?.bin;
      return !!s&&!openingHome&&!C.dad.present&&scheduled('dad',clock()).raw==='away:work'&&!storyDirectives().dad&&!manual.dad&&!sceneDbg.dad;
    },
    present: id => !!C[id]?.present, near: (id, cm) => !!C[id] && inEarshot(C[id], cm || 400),
    talk, say: (id, line, o={}) => say(id, line, {...o,requested:o?.requested ?? !o?.context}), speak: (id, line, text, o={}) => (speech.cur?.c?.id===id&&speech.cur.lineId===line)||speech.q.some(n=>n.c.id===id&&n.lineId===line)||say(id, line, { text, displayText:text, callout:o.callout, legacyShout:!!o.legacyShout, force: true, call: true, again: true, prio: 4, requested:o.requested ?? !o.context, valid:o.valid, context:o.context }), storyLine, handIn, blocks, blocker, blockers, passage, doorHeld, heldHint,
    // hs-life's random shouts give way to the people who are really there (and Dad can't shout from work)
    mute: who => { if (!ready) return false; const w = String(who).toLowerCase(); if (w.startsWith('dad')) return true; if (w.startsWith('mom')) return true; return false; },
    debug: {
      openingCall,
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

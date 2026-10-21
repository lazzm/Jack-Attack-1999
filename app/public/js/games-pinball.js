/* Space Jack Pinball for JackOS 98 (lazy loaded by apps-games.js).
 * A tilted 3D-ish table drawn on canvas with real ball physics: two flippers, a plunger, pop bumpers, slingshots,
 * a pod-race ramp, orbits, drop targets, stand-ups, a warp saucer, missions, ranks, multiball, a dot-matrix display,
 * TILT, cheat codes and its own music. All original art and code. */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;
  const TW = 420, TH = 800, R = 11, CX = 197, G_ACC = 1150, VMAX = 3600;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ================================================================ 5x7 dot-matrix font
  const F = {
    A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [28, 18, 17, 17, 17, 18, 28],
    E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
    I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
    M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
    Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
    U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
    Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
    0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14], 4: [2, 6, 10, 18, 31, 2, 2],
    5: [31, 16, 30, 1, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], 8: [14, 17, 17, 14, 17, 17, 14], 9: [14, 17, 17, 15, 1, 2, 12],
    ' ': [0, 0, 0, 0, 0, 0, 0], '!': [4, 4, 4, 4, 4, 0, 4], '?': [14, 17, 1, 2, 4, 0, 4], '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8],
    ':': [0, 12, 12, 0, 12, 12, 0], '-': [0, 0, 0, 31, 0, 0, 0], "'": [4, 4, 8, 0, 0, 0, 0], '/': [1, 1, 2, 4, 8, 16, 16], '%': [24, 25, 2, 4, 8, 19, 3],
    '+': [0, 4, 4, 31, 4, 4, 0], '=': [0, 0, 31, 0, 31, 0, 0], '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8], '*': [0, 4, 21, 14, 21, 4, 0],
    '&': [12, 18, 20, 8, 21, 18, 13], '<': [2, 4, 8, 16, 8, 4, 2], '>': [8, 4, 2, 1, 2, 4, 8], '#': [10, 31, 10, 10, 10, 31, 10],
  };
  const DW = 128, DH = 32;
  function textW(s, sx) { return s.length * 6 * sx - sx; }

  // ================================================================ table geometry (table units, y grows towards the player)
  const walls = [], posts = [], sensors = [];
  const seg = (ax, ay, bx, by, o) => { const w = Object.assign({ ax, ay, bx, by, e: 0.42, h: 14, kind: 'wall' }, o || {}); const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); w.len = L; w.dx = dx / L; w.dy = dy / L; walls.push(w); return w; };
  const path = (pts, o) => { for (let i = 0; i < pts.length - 1; i++) seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], o); };
  const post = (x, y, r, o) => { const p = Object.assign({ x, y, r, e: 0.45, h: 14, kind: 'post' }, o || {}); posts.push(p); return p; };
  const M = x => 2 * CX - x; // mirror left/right

  // outer shell: left wall, top arch, right wall of the plunger lane
  const arc = []; for (let i = 0; i <= 40; i++) { const a = Math.PI + Math.PI * i / 40; arc.push([210 + Math.cos(a) * 192, 210 + Math.sin(a) * 192]); }
  path([[18, 810], [18, 210], ...arc.slice(1), [402, 790]], { h: 18, kind: 'outer' });
  seg(376, 790, 402, 790, { h: 6, kind: 'floor' });
  // plunger lane inner wall (also the playfield's right wall) and the one-way gate at the top of the lane
  seg(376, 810, 376, 266, { h: 16 }); post(376, 264, 4, { h: 16 });
  const gate = seg(376, 264, 402, 238, { oneway: [-0.7071, -0.7071], h: 6, kind: 'gate', e: 0.3 });
  // orbit guides
  seg(52, 470, 52, 268, { h: 14 }); post(52, 266, 4); post(52, 472, 4);
  seg(342, 470, 342, 268, { h: 14 }); post(342, 266, 4); post(342, 472, 4);
  // top rollover lanes
  const LANES = [146, 180, 214, 248];
  [129, 163, 197, 231, 265].forEach(x => { seg(x, 70, x, 98, { h: 10, e: 0.35 }); post(x, 69, 3.5, { h: 10 }); post(x, 99, 3.5, { h: 10 }); }); // tops kept 27+ units below the arch so a ball can never wedge there
  // ramp entrance channel
  seg(268, 300, 268, 352, { h: 12 }); post(268, 352, 4, { h: 12 });
  seg(312, 300, 312, 352, { h: 12 }); post(312, 352, 4, { h: 12 });
  // lower playfield: inlane guides, slingshots (mirrored)
  for (const side of [0, 1]) {
    const X = side ? M : (x => x);
    path([[X(46), 560], [X(46), 632], [X(137), 692]], { h: 14 }); post(X(46), 558, 4);
    // slingshot triangle: kept 30+ units clear of the inlane guide so the inlane never pinches shut
    const k = seg(X(84), 566, X(114), 636, { kind: 'sling', side, e: 0.5, h: 12 });
    if (side) { [k.ax, k.ay, k.bx, k.by] = [k.bx, k.by, k.ax, k.ay]; k.dx = -k.dx; k.dy = -k.dy; }
    seg(X(84), 566, X(84), 618, { h: 12 }); seg(X(84), 618, X(114), 636, { h: 12 });
    post(X(84), 566, 4, { h: 12 }); post(X(84), 618, 4, { h: 12 }); post(X(114), 636, 4, { h: 12 });
  }
  const slings = walls.filter(w => w.kind === 'sling');
  // drop targets (left bank, face right) and stand-up "fighters" (right side, face left)
  const DROPS = [330, 362, 394].map((y, i) => ({ i, y, seg: seg(58, y - 13, 58, y + 13, { kind: 'drop', oneway: [1, 0], e: 0.3, h: 12, idx: i }) }));
  const STANDS = [384, 408, 432, 456].map((y, i) => ({ i, y, seg: seg(336, y - 10, 336, y + 10, { kind: 'stand', oneway: [-1, 0], e: 0.45, h: 12, idx: i }) }));
  // pop bumpers
  const BUMPERS = [[155, 172], [239, 172], [197, 236]].map(([x, y], i) => post(x, y, 21, { kind: 'bumper', idx: i, h: 18 }));
  const SAUCER = { x: 197, y: 420 };
  const FLIP = [{ px: 132, py: 700, rest: 0.55, up: -0.42, side: 0 }, { px: 262, py: 700, rest: Math.PI - 0.55, up: Math.PI + 0.42, side: 1 }];
  FLIP.forEach(f => { f.a = f.rest; f.w = 0; f.on = false; f.L = 55; f.r1 = 9.5; f.r2 = 5; });
  const PLX = 389, PLY = 772; // plunger tip at rest
  const plungerSeg = seg(376, PLY, 402, PLY, { kind: 'plunger', e: 0.05, h: 0 });
  // the pod-race ramp: a 3D path (x, y, z)
  const RAMP = [[290, 300, 0], [291, 250, 8], [290, 180, 20], [276, 118, 30], [244, 74, 36], [197, 56, 38], [148, 66, 38], [112, 98, 36], [92, 150, 32], [86, 220, 26], [88, 320, 19], [82, 420, 12], [70, 500, 6], [63, 545, 1], [62, 560, 0]];
  const rampLen = []; { let L = 0; rampLen.push(0); for (let i = 1; i < RAMP.length; i++) { L += Math.hypot(RAMP[i][0] - RAMP[i - 1][0], RAMP[i][1] - RAMP[i - 1][1], RAMP[i][2] - RAMP[i - 1][2]); rampLen.push(L); } }
  const RAMP_L = rampLen[rampLen.length - 1];
  function rampAt(s) {
    let i = 1; while (i < RAMP.length - 1 && rampLen[i] < s) i++;
    const a = RAMP[i - 1], b = RAMP[i], f = clamp((s - rampLen[i - 1]) / (rampLen[i] - rampLen[i - 1]), 0, 1);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, (b[2] - a[2]) / (rampLen[i] - rampLen[i - 1]), (b[0] - a[0]), (b[1] - a[1])];
  }

  // merge collinear neighbouring wall pieces (no seams to snag on) and give every wall a bounding box for quick rejection
  for (let i = 0; i < walls.length - 1; i++) {
    const a = walls[i], b = walls[i + 1];
    if (a.kind !== b.kind || !/^(wall|outer)$/.test(a.kind) || a.oneway || b.oneway || a.h !== b.h || a.e !== b.e) continue;
    if (Math.hypot(a.bx - b.ax, a.by - b.ay) > 1e-6 || Math.abs(a.dx * b.dy - a.dy * b.dx) > 1e-9 || a.dx * b.dx + a.dy * b.dy < 0) continue;
    a.bx = b.bx; a.by = b.by; a.len = Math.hypot(a.bx - a.ax, a.by - a.ay); walls.splice(i + 1, 1); i--;
  }
  walls.forEach(w => { w.minx = Math.min(w.ax, w.bx); w.maxx = Math.max(w.ax, w.bx); w.miny = Math.min(w.ay, w.by); w.maxy = Math.max(w.ay, w.by); });

  // lamps (inserts) in table space
  const LAMPS = {};
  const lamp = (id, x, y, r, col, shape, label) => { LAMPS[id] = { id, x, y, r, col, shape: shape || 'circle', label: label || '', on: 0, blink: 0 }; };
  LANES.forEach((x, i) => lamp('lane' + i, x, 82, 9, '#ffd400', 'circle', 'JACK'[i]));
  DROPS.forEach(d => lamp('drop' + d.i, 76, d.y, 5, '#ff3030'));
  STANDS.forEach(s => lamp('stand' + s.i, 318, s.y, 5, '#30d0ff'));
  lamp('ramp', 290, 372, 11, '#ff8a00', 'arrow');
  lamp('lorbit', 35, 448, 9, '#7cff3a', 'arrow');
  lamp('rorbit', 359, 448, 9, '#7cff3a', 'arrow');
  lamp('warp', 197, 466, 12, '#ff40ff', 'arrow');
  lamp('xball', 150, 470, 7, '#ff3030', 'circle', 'X');
  lamp('podlit', 244, 470, 7, '#ff8a00', 'circle', 'P');
  for (let i = 0; i < 5; i++) { const a = Math.PI * (0.92 + i * 0.29); lamp('mis' + i, CX + Math.cos(a) * 62, 578 + Math.sin(a) * 62 * 0.9, 6, ['#ffd400', '#ff8a00', '#30d0ff', '#ff3030', '#ff40ff'][i]); }
  [2, 3, 4, 5].forEach((m, i) => lamp('mult' + m, 156 + i * 27.3, 650 + Math.abs(i - 1.5) * -4 + 6, 8, '#ffd400', 'circle', m + 'X'));
  lamp('again', CX, 690, 8, '#ff3030', 'circle', '');
  lamp('lin', 62, 604, 5, '#ffffff'); lamp('rin', M(62), 604, 5, '#ffffff');
  lamp('lout', 32, 604, 5, '#ff3030'); lamp('rout', M(32), 604, 5, '#ff3030');

  // ================================================================ themes
  const THEMES = {
    space: { name: 'Deep Space', bg0: '#0a0a32', bg1: '#24106a', neb: ['rgba(120,40,200,.35)', 'rgba(20,120,220,.30)', 'rgba(220,40,120,.22)'], wall: [70, 90, 190], rail: '#c8d0ff', apron: '#20204a', accent: '#ffd400', planet: ['#ff9a3a', '#a03a10'] },
    mars: { name: 'Red Planet', bg0: '#2a0806', bg1: '#6a1a0a', neb: ['rgba(255,90,20,.30)', 'rgba(255,200,60,.18)', 'rgba(120,10,40,.30)'], wall: [170, 70, 40], rail: '#ffd0b0', apron: '#3a0a06', accent: '#ffe040', planet: ['#d0e0ff', '#3050a0'] },
    desert: { name: 'Pod Race Desert', bg0: '#6a3c10', bg1: '#d08a3a', neb: ['rgba(255,220,140,.35)', 'rgba(255,160,60,.25)', 'rgba(140,80,20,.25)'], wall: [150, 110, 60], rail: '#fff0c8', apron: '#4a2a0a', accent: '#ffe040', planet: ['#ffffff', '#c0c0d0'] },
  };

  // ================================================================ the music (original tunes)
  if (window.Sound && Sound.addTune) {
    Sound.addTune('jg_pinball', { step: 0.15, hats: true,
      lead: [69, 0, 72, 76, 74, 72, 69, 0, 67, 0, 71, 74, 72, 71, 67, 0, 65, 0, 69, 72, 71, 69, 65, 64, 64, -1, 68, 71, 76, -1, 0, 0,
        69, 72, 76, 81, 79, 76, 72, 76, 74, 0, 71, 74, 79, -1, 77, 76, 77, 0, 74, 72, 74, 72, 71, 69, 71, -1, 68, 64, 69, -1, 0, 0],
      bass: [45, 45, 57, 45, 43, 43, 55, 43, 41, 41, 53, 41, 40, 40, 52, 40, 45, 45, 57, 45, 43, 43, 55, 43, 38, 38, 50, 38, 40, 40, 52, 40] });
    Sound.addTune('jg_pinball2', { step: 0.11, hats: true,
      lead: [76, 79, 83, 79, 76, 79, 83, 88, 74, 77, 81, 77, 74, 77, 81, 86, 72, 76, 79, 76, 72, 76, 79, 84, 71, 74, 79, 74, 83, -1, 81, 79,
        76, 0, 76, 79, 81, 0, 79, 76, 74, 0, 74, 77, 79, 0, 77, 74, 72, 76, 79, 84, 83, 79, 76, 72, 71, -1, 74, -1, 76, -1, 0, 0],
      bass: [40, 52, 40, 52, 38, 50, 38, 50, 36, 48, 36, 48, 43, 55, 43, 55, 40, 52, 40, 52, 38, 50, 38, 50, 36, 48, 43, 55, 40, 40, 52, 52] });
  }

  const MISSIONS = [
    { id: 'squig', name: 'ALIEN HUNT', goal: 'KNOCK DOWN 3 ALIEN TARGETS', need: 3, val: 75000 },
    { id: 'pod', name: 'POD RACE', goal: 'SHOOT THE RAMP 3 LAPS IN 45 SEC', need: 3, val: 150000, time: 45 },
    { id: 'rocks', name: 'ASTEROID FIELD', goal: 'HIT THE BUMPERS 20 TIMES', need: 20, val: 100000 },
    { id: 'battle', name: 'SPACE BATTLE', goal: 'HIT ALL 4 SAUCER FIGHTERS', need: 4, val: 200000 },
    { id: 'hyper', name: 'HYPERSPACE', goal: 'SHOOT BOTH ORBITS', need: 2, val: 300000 },
  ];
  const RANKS = ['SPACE CADET', 'DECK HAND', 'GUNNER', 'PILOT', 'ACE', 'SQUADRON LEADER', 'SPACE ADMIRAL'];

  JG.mod('pinball', G => {
    const host = G.host, w = G.w;
    let muted = false;
    const sfx = n => { if (!muted) G.sfx(n); }, note = (f, d, t) => { if (!muted) G.note(f, d, t); };
    G.fit();
    let opts = Object.assign({ music: true, theme: 'space', balls: 3, save: true }, G.store.get('opts', {}));
    const saveOpts = () => G.store.set('opts', opts);
    const scores = G.scores({ title: 'Space Jack Pinball High Scores', max: 2e9, seed: [['JACK', 1500000], ['DAVE', 750000], [Cast.t('COUSIN {cousin.NAME}'), 500000], ['PODJACK', 250000], ['GUBBINZ', 1000]] });
    const L = { portrait: false };
    const C = G.canvas(host, layout);
    const cv = C.cv, ctx = C.c;
    G.focusEl = cv;

    // ---------------------------------------------------------------- state
    let S = null; // game state
    let balls = [];
    const fx = { flash: 0, shake: 0, warp: 0, stars: [] };
    function newGame() {
      S = { score: 0, ball: 1, state: 'plunger', mission: 0, mprog: 0, mdone: false, missionsDone: 0, rank: 0, cycle: 1, timer: 0,
        drops: [1, 1, 1], stands: [0, 0, 0, 0], lanes: [0, 0, 0, 0], laneDone: 0, mult: 1, bonus: 0, xball: false, again: 0,
        tilt: 0, tilted: false, warn: 0, save: 0, saveUsed: false, skill: 0, skillT: 0, laps: 0, podT: 0, orbitL: -9, orbitR: -9,
        paused: false, over: false, cheat: '', konami: [], gubbinz: S && S.gubbinz, saucerT: 0, plunge: 0, launched: false, extraBalls: 0, hits: 0, firstLane: true, pulling: false, lastMsg: 0 };
      DROPS.forEach(d => { d.seg.dead = false; }); balls = []; serve();
      msgs.length = 0; say('PLAYER 1', 1.6); say(MISSIONS[0].name, 2.4, true); say('LAUNCH THE BALL!', 2);
      lampsFromState(); G.music(opts.music ? 'jg_pinball' : '');
      G.status && 0;
    }
    function serve() {
      balls.push({ x: PLX, y: PLY - R - 0.5, vx: 0, vy: 0, z: 0, mode: 'table', id: Math.random(), sens: {}, trail: [] });
      S.state = 'plunger'; S.launched = false; S.firstLane = true; S.skill = (Math.random() * 4) | 0;
    }
    function addBall(auto) { // multiball: drop one in the plunger lane and fire it
      const b = { x: PLX, y: PLY - R - 0.5, vx: 0, vy: auto ? -2100 - Math.random() * 300 : 0, z: 0, mode: 'table', id: Math.random(), sens: {}, trail: [] };
      balls.push(b);
    }

    // ---------------------------------------------------------------- messages for the dot-matrix display
    const msgs = []; // {t, dur, big}
    let msgT = 0;
    function say(t, dur, big) { msgs.push({ t: String(t).toUpperCase(), dur: dur || 2, big: !!big }); if (msgs.length > 6) msgs.splice(1, msgs.length - 6); }
    function sayNow(t, dur, big) { msgs.length = 0; msgT = 0; say(t, dur, big); }

    // ---------------------------------------------------------------- scoring + rules
    function add(pts) { if (!S || S.tilted || S.over) return; const before = S.score; S.score += pts; S.bonus += Math.round(pts * 0.05);
      if (before < 1e6 && S.score >= 1e6) { G.secret('games.pb.million'); sayNow('A MILLION RUPEES!', 2.5, true); sfx('solve'); } }
    const mis = () => MISSIONS[S.mission % MISSIONS.length];
    function progress(id, n) {
      if (!S || S.tilted) return;
      const m = mis(); if (S.mdone || m.id !== id) return;
      S.mprog = Math.min(m.need, S.mprog + (n || 1));
      if (S.mprog >= m.need) {
        S.mdone = true; add(m.val * S.cycle);
        sayNow(m.name + ' COMPLETE!', 2.2, true); say('SHOOT THE WARP HOLE!', 2.5);
        sfx('solve'); fx.flash = 0.6;
        if (m.id === 'pod') G.secret('games.pb.pod');
        if (m.id === 'rocks' && !S.xball) { S.xball = true; say('EXTRA BALL LIT', 2); }
      } else if (m.id !== 'rocks' || S.mprog % 5 === 0) say(`${m.name} ${S.mprog}/${m.need}`, 1.4);
    }
    function warp() { // the saucer: when a mission is done, cash it in and start the next one
      if (S.tilted) return 1.2;
      if (S.xball && !S.xballGot) { S.xballGot = true; S.extraBalls++; S.again = 1; sayNow('EXTRA BALL!', 2.5, true); sfx('waaagh'); return 2.2; }
      if (!S.mdone) { add(15000); say('WARP HOLE 15,000', 1.4); return 1.0; }
      const m = mis(); S.missionsDone++; S.rank = Math.min(RANKS.length - 1, S.rank + 1);
      add(50000 * S.cycle);
      if (m.id === 'hyper') { // the big one
        add(1000000); fx.warp = 3.2; G.secret('games.pb.warp'); sayNow('HYPERSPACE JUMP!', 3, true); say('PUNCH IT, CADET!', 3); say('+1,000,000', 2, true);
        S.cycle++; sfx('solve'); setTimeout(() => sfx('waaagh'), 400);
      } else { sayNow('WARP! RANK UP', 1.8, true); say(RANKS[S.rank], 2, true); sfx('join'); }
      S.mission++; S.mprog = 0; S.mdone = false; S.laps = 0; S.podT = 0;
      if (mis().id === 'squig') { S.drops = [1, 1, 1]; DROPS.forEach(d => { d.seg.dead = false; }); }
      if (mis().id === 'battle') S.stands = [0, 0, 0, 0];
      say('NEW MISSION: ' + mis().name, 2.4); say(mis().goal, 3);
      return m.id === 'hyper' ? 3.2 : 1.6;
    }
    function laneHit(i) {
      if (S.state === 'plunger' || !S.launched) return;
      if (S.firstLane) { S.firstLane = false; if (i === S.skill) { add(50000); sayNow('SKILL SHOT 50,000', 2, true); sfx('solve'); } }
      add(2500);
      if (!S.lanes[i]) { S.lanes[i] = 1; note(880 + i * 110, 0.08, 'square'); }
      if (S.lanes.every(Boolean)) {
        S.lanes = [0, 0, 0, 0]; S.laneDone++;
        if (S.mult < 5) { S.mult++; say(`BONUS ${S.mult}X`, 1.6, true); }
        add(25000);
        if (S.laneDone % 2 === 0) multiball('JACK ROCKET!'); else say('JACK AGAIN FOR MULTIBALL', 2);
      }
    }
    function multiball(why) {
      const n = balls.filter(b => b.mode !== 'gone').length;
      if (n >= 3) { add(100000); say('JACKPOT 100,000', 2, true); return; }
      sayNow(why || 'MULTIBALL!', 1.6, true); say('MULTIBALL!', 2.5, true);
      G.secret('games.pb.multi'); sfx('waaagh'); fx.flash = 0.8;
      if (S.sim) { for (let k = n; k < 3; k++) addBall(true); } else for (let k = n; k < 3; k++) G.timeout(() => { if (S && !S.over) addBall(true); }, 400 + (k - n) * 900);
      if (opts.music) G.music('jg_pinball2');
    }
    function drainCheck() {
      if (S.sim) { if (!balls.some(b => b.mode !== 'gone')) { S.simDrains++; serve(); } return; }
      const live = balls.filter(b => b.mode !== 'gone');
      if (live.length) { if (live.length === 1 && G._tune === 'jg_pinball2' && opts.music) G.music('jg_pinball'); return; }
      if (S.save > 0 && !S.tilted) { S.save = 0; sayNow('BALL SAVED!', 2, true); sfx('pet'); balls = []; addBall(true); S.launched = true; return; }
      endOfBall();
    }
    function endOfBall() {
      S.state = 'bonus'; balls = [];
      const b = S.tilted ? 0 : (S.bonus + S.missionsDone * 25000) * S.mult;
      if (S.tilted) sayNow('TILT - NO BONUS', 2.4, true); else { sayNow('BONUS', 1, true); say(`${JG.fmt(S.bonus + S.missionsDone * 25000)} X ${S.mult}`, 1.6); say(JG.fmt(b), 1.4, true); }
      add(b);
      sfx('uhoh');
      G.timeout(() => {
        if (!S || S.over) return;
        S.tilted = false; S.tilt = 0; S.bonus = 0; S.mult = 1; S.lanes = [0, 0, 0, 0];
        if (S.extraBalls > 0) { S.extraBalls--; S.again = 0; sayNow('SHOOT AGAIN!', 2, true); serve(); return; }
        if (S.ball >= opts.balls) return gameOver();
        S.ball++; sayNow('BALL ' + S.ball, 1.8, true); serve();
      }, S.tilted ? 2600 : 3800);
    }
    function gameOver() {
      S.over = true; S.state = 'over'; G.stopMusic();
      sayNow('GAME OVER', 3, true); say('SCORE ' + JG.fmt(S.score), 3); say('PRESS F2 FOR A NEW GAME', 60);
      sfx('shutdown');
      if (sv && !S._mp) sv.clear();
      const sc = S.score;
      if (race && race.active) { race.progress(1, JG.fmt(sc)); race.done({ ok: true, score: sc }); return; }
      G.timeout(() => { if (sc > 0) scores.submit(sc); }, 1200);
    }

    // ---------------------------------------------------------------- physics
    // ---------------------------------------------------------------- physics core
    // Fixed 1/480 s steps, split further whenever the ball or a flipper tip would move more than a third of the ball's
    // radius. Each step finds every overlap (ball vs wall capsule, post circle, rotating flipper capsule), resolves the
    // deepest one first (push out along the normal by the full overlap + a hair, reflect only the normal velocity with
    // restitution, a touch of tangential friction), and repeats up to 3 times.
    const H_STEP = 1 / 480, EPS = 0.02, CT = { pen: 0, nx: 0, ny: 0, svx: 0, svy: 0, e: 0, mu: 0, type: '', obj: null };
    function segContact(b, s, best) {
      if (s.dead || b.x < s.minx - R || b.x > s.maxx + R || b.y < s.miny - R || b.y > s.maxy + R) return;
      const px = b.x - s.ax, py = b.y - s.ay;
      let t = px * s.dx + py * s.dy; t = t < 0 ? 0 : t > s.len ? s.len : t;
      let nx = px - s.dx * t, ny = py - s.dy * t; const d2 = nx * nx + ny * ny;
      if (d2 >= R * R) return;
      const d = Math.sqrt(d2);
      if (s.oneway) { // solid from one side only (gate, targets): ignore balls behind it or already leaving
        const sd = px * s.oneway[0] + py * s.oneway[1];
        if (sd < 0 || b.vx * s.oneway[0] + b.vy * s.oneway[1] > 0) return;
        nx = s.oneway[0]; ny = s.oneway[1];
      } else if (d < 1e-6) { nx = -s.dy; ny = s.dx; } else { nx /= d; ny /= d; }
      const pen = R - d;
      if (pen > best.pen) { best.pen = pen; best.nx = nx; best.ny = ny; best.svx = best.svy = 0; best.e = s.e; best.mu = 0.012; best.type = 'seg'; best.obj = s; }
    }
    function postContact(b, p, best) {
      const dx = b.x - p.x, dy = b.y - p.y, rr = R + p.r;
      if (dx > rr || dx < -rr || dy > rr || dy < -rr) return;
      const d2 = dx * dx + dy * dy; if (d2 >= rr * rr) return;
      const d = Math.sqrt(d2), pen = rr - d;
      if (pen > best.pen) { best.pen = pen; if (d < 1e-6) { best.nx = 0; best.ny = -1; } else { best.nx = dx / d; best.ny = dy / d; } best.svx = best.svy = 0; best.e = p.e; best.mu = 0.01; best.type = 'post'; best.obj = p; }
    }
    function flipperContact(b, f, best) {
      const ux = Math.cos(f.a), uy = Math.sin(f.a);
      let t = (b.x - f.px) * ux + (b.y - f.py) * uy; t = t < 0 ? 0 : t > f.L ? f.L : t;
      const qx = f.px + ux * t, qy = f.py + uy * t, rad = f.r1 + (f.r2 - f.r1) * t / f.L, rr = R + rad;
      let nx = b.x - qx, ny = b.y - qy; const d2 = nx * nx + ny * ny;
      if (d2 >= rr * rr) return;
      const d = Math.sqrt(d2);
      if (d < 1e-6) { nx = uy; ny = -ux; if (ny > 0) { nx = -nx; ny = -ny; } } else { nx /= d; ny /= d; } // dead centre: always out the top
      const pen = rr - d;
      if (pen > best.pen) {
        const cx = qx + nx * rad - f.px, cy = qy + ny * rad - f.py; // the flipper surface moves at w x r
        best.pen = pen; best.nx = nx; best.ny = ny; best.svx = -f.w * cy; best.svy = f.w * cx; best.e = 0.3; best.mu = 0.02; best.type = 'flip'; best.obj = f;
      }
    }
    function deepest(b) {
      CT.pen = 0; CT.obj = null;
      for (let i = 0; i < walls.length; i++) segContact(b, walls[i], CT);
      for (let i = 0; i < posts.length; i++) postContact(b, posts[i], CT);
      flipperContact(b, FLIP[0], CT); flipperContact(b, FLIP[1], CT);
      return CT.obj ? CT : null;
    }
    function resolve(b, c, first) {
      const nx = c.nx, ny = c.ny;
      b.x += nx * (c.pen + EPS); b.y += ny * (c.pen + EPS);
      const rvx = b.vx - c.svx, rvy = b.vy - c.svy, vn = rvx * nx + rvy * ny;
      if (vn >= 0) return;
      if (c.type === 'post' && c.obj.kind === 'bumper') {
        const p = c.obj;
        if (!S.tilted && first) {
          const kick = Math.max(720, -vn * 0.7);
          b.vx += (kick - vn) * nx; b.vy += (kick - vn) * ny;
          p.flash = 0.18; add(1000 * (S.mission % 5 === 2 ? 2 : 1)); progress('rocks'); S.hits++;
          note(520 + p.idx * 130, 0.05, 'square'); fx.shake = Math.max(fx.shake, 0.06);
        } else { b.vx -= 1.5 * vn * nx; b.vy -= 1.5 * vn * ny; }
        return;
      }
      const e = -vn < 40 ? 0 : c.e; // no micro-bounces when rolling along something
      b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
      const tvx = rvx - vn * nx, tvy = rvy - vn * ny; b.vx -= tvx * c.mu; b.vy -= tvy * c.mu;
      if (!first) return;
      if (c.type === 'seg') hitWall(b, c.obj, -vn, nx, ny);
      else if (c.type === 'post') { if (-vn > 250) note(200, 0.03, 'triangle'); }
      else if (-vn > 600) note(90, 0.04, 'square');
    }
    function hitWall(b, s, speed, nx, ny) {
      if (s.kind === 'sling') {
        if (speed > 70 && !S.tilted) { b.vx += nx * 640; b.vy += ny * 640; s.flash = 0.15; add(100); sfx('thud'); }
      } else if (s.kind === 'drop') {
        s.dead = true; S.drops[s.idx] = 0; add(5000); progress('squig'); note(330, 0.1, 'sawtooth'); sfx('turn');
        if (S.drops.every(x => !x)) { add(25000); say('ALIEN BANK 25,000', 1.6); G.timeout(() => { if (!S || mis().id === 'squig' && !S.mdone) return; S.drops = [1, 1, 1]; DROPS.forEach(d => { d.seg.dead = false; }); }, 3500); if (mis().id === 'squig' && !S.mdone) { /* progress already counted */ } }
      } else if (s.kind === 'stand') {
        if (speed > 60) { s.flash = 0.25; add(3000); if (!S.stands[s.idx]) { S.stands[s.idx] = 1; progress('battle'); } note(1200, 0.05, 'square'); if (S.stands.every(Boolean) && mis().id !== 'battle') { S.stands = [0, 0, 0, 0]; add(20000); say('FIGHTERS 20,000', 1.4); } }
      } else if (speed > 320) note(140 + Math.random() * 30, 0.03, 'triangle');
    }
    function onRaisedFlipper(b) { for (const f of FLIP) { if (!f.on) continue; const tx = f.px + Math.cos(f.a) * f.L, ty = f.py + Math.sin(f.a) * f.L, dx = tx - f.px, dy = ty - f.py; let t = ((b.x - f.px) * dx + (b.y - f.py) * dy) / (dx * dx + dy * dy); t = clamp(t, 0, 1); if (Math.hypot(b.x - f.px - dx * t, b.y - f.py - dy * t) < R + f.r1 + 6) return true; } return false; }
    function stepBall(b, h) {
      if (b.mode === 'ramp') {
        const [, , , slope] = rampAt(b.s);
        b.sp += (-slope * 2600 - 20) * h; if (b.sp < 260) b.sp = 260;
        b.s += b.sp * h;
        const p = rampAt(Math.min(b.s, RAMP_L)); b.x = p[0]; b.y = p[1]; b.z = p[2];
        if (b.s >= RAMP_L) { const L = Math.hypot(p[4], p[5]) || 1; b.mode = 'table'; b.z = 0; b.vx = p[4] / L * b.sp * 0.7; b.vy = Math.max(200, p[5] / L * b.sp * 0.7); rampDone(); }
        return;
      }
      if (b.mode === 'saucer') { b.st -= h; b.x += (SAUCER.x - b.x) * 0.02; b.y += (SAUCER.y - b.y) * 0.02; if (b.st <= 0) { b.mode = 'table'; b.x = SAUCER.x; b.y = SAUCER.y + 4; const dir = Math.random() < 0.5 ? -1 : 1; b.vx = dir * (150 + Math.random() * 80); b.vy = 520; b.cool = 0.5; sfx('thud'); } return; }
      b.vy += G_ACC * h;
      const sp = Math.hypot(b.vx, b.vy); if (sp > VMAX) { b.vx *= VMAX / sp; b.vy *= VMAX / sp; }
      const damp = 1 - 0.12 * h; b.vx *= damp; b.vy *= damp;
      const oy = b.y;
      b.x += b.vx * h; b.y += b.vy * h;
      for (let it = 0; it < 3; it++) { const c = deepest(b); if (!c) break; resolve(b, c, it === 0); }
      // ramp entrance: a fast ball going up the channel climbs on; a slow one rolls back
      if (b.x > 270 && b.x < 310 && oy >= 300 && b.y < 300) {
        if (b.vy < -420 && !S.tilted) { b.mode = 'ramp'; b.s = 0; b.sp = Math.min(1500, -b.vy * 0.95); sfx('zap'); }
        else { b.y = 300 + 0.5; b.vy = Math.abs(b.vy) * 0.25; }
      }
      // warp saucer
      if (b.cool > 0) b.cool -= h;
      else if (Math.hypot(b.x - SAUCER.x, b.y - SAUCER.y) < 11 && Math.hypot(b.vx, b.vy) < 1500) { b.mode = 'saucer'; b.vx = b.vy = 0; b.st = warp(); sfx('boing'); }
      // sensors: top lanes, orbits, inlanes/outlanes
      sense(b, 'lane', b.y > 66 && b.y < 98, () => { const i = LANES.findIndex(x => Math.abs(b.x - x) < 14); if (i >= 0) laneHit(i); });
      sense(b, 'lorb', b.x < 52 && b.y > 300 && b.y < 330, () => { if (b.vy < 0) orbit(0); });
      sense(b, 'rorb', b.x > 342 && b.x < 376 && b.y > 300 && b.y < 330, () => { if (b.vy < 0) orbit(1); });
      sense(b, 'lin', b.x > 46 && b.x < 84 && b.y > 590 && b.y < 620, () => { add(1000); LAMPS.lin.blink = 0.6; });
      sense(b, 'rin', b.x < M(46) && b.x > M(84) && b.y > 590 && b.y < 620, () => { add(1000); LAMPS.rin.blink = 0.6; });
      sense(b, 'lout', b.x < 46 && b.y > 590 && b.y < 620, () => { add(3000); LAMPS.lout.blink = 0.8; sfx('uhoh'); });
      sense(b, 'rout', b.x > M(46) && b.x < 376 && b.y > 590 && b.y < 620, () => { add(3000); LAMPS.rout.blink = 0.8; sfx('uhoh'); });
      sense(b, 'lane0', b.x > 376 && b.y < 240, () => { if (!S.launched) { S.launched = true; S.state = 'play'; if (opts.save) S.save = 8; } });
      if (b.y > TH + 20) b.mode = 'gone';
    }
    // anti-stuck watchdog: a ball that crawls for 2.5 s somewhere it shouldn't gets a "ball search" (bumpers fire and it gets a
    // gentle random kick); after 6 s, or if it ever leaves the table or goes NaN, it is put back in the plunger lane.
    function watchdog(b, h) {
      if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.vx) || !isFinite(b.vy) || b.x < -4 || b.x > TW + 4 || b.y < -50) { if (!S.noSearch) rescue(b); return; }
      // "stuck" = hasn't left a 12-unit circle (so a ball rattling in a wedge counts too)
      if (S.noSearch || b.mode !== 'table' || (b.x > 376 && b.y > PLY - 40) || onRaisedFlipper(b) || b.ax == null || Math.abs(b.x - b.ax) + Math.abs(b.y - b.ay) > 12) { b.ax = b.x; b.ay = b.y; b.slowT = 0; b.searchN = 0; return; }
      b.slowT = (b.slowT || 0) + h;
      if (b.slowT > 6) rescue(b);
      else if (b.slowT > 2.5 + (b.searchN || 0) * 1.2) {
        b.searchN = (b.searchN || 0) + 1; S.searches = (S.searches || 0) + 1;
        b.vx += (Math.random() - 0.5) * 300; b.vy -= 200 + Math.random() * 200;
        BUMPERS.forEach(p => { p.flash = 0.18; }); slings.forEach(s2 => { s2.flash = 0.15; }); sfx('thud');
        if (!S.sim) say('BALL SEARCH', 1);
      }
    }
    function rescue(b) {
      S.ejects = (S.ejects || 0) + 1;
      b.mode = 'table'; b.z = 0; b.x = PLX; b.y = PLY - R - 0.5; b.vx = 0; b.vy = 0; b.slowT = 0; b.searchN = 0; b.ax = null;
      if (balls.some(o => o !== b && o.mode !== 'gone') || S.launched) b.vy = -(2000 + Math.random() * 400); // auto-launch
      if (!S.sim) { sayNow('BALL SEARCH', 1.6, true); sfx('zap'); }
    }
    function sense(b, k, inside, fn) { if (inside) { if (!b.sens[k]) { b.sens[k] = 1; fn(); } } else b.sens[k] = 0; }
    function orbit(side) {
      const now = performance.now() / 1000;
      add(10000); sfx('zap'); LAMPS[side ? 'rorbit' : 'lorbit'].blink = 0.8;
      if (side === 0) S.orbitL = now; else S.orbitR = now;
      if (Math.abs(S.orbitL - S.orbitR) < 3) { add(40000); say('LOOP 40,000', 1.4); S.orbitL = S.orbitR = -9; }
      if (mis().id === 'hyper' && !S.mdone) { S.hyp = S.hyp || [0, 0]; S.hyp[side] = 1; S.mprog = S.hyp[0] + S.hyp[1] - 1; progress('hyper'); if (S.mdone) S.hyp = null; }
      else say('ORBIT 10,000', 1);
    }
    function rampDone() {
      add(25000); sfx('join');
      if (mis().id === 'pod' && !S.mdone) {
        if (!S.podT) S.podT = MISSIONS[1].time;
        S.laps++; say(`LAP ${S.laps} OF 3!`, 1.4, true); progress('pod');
        if (S.mdone) S.podT = 0;
      } else say('POD RAMP 25,000', 1.2);
    }
    function ballBall() {
      for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], c = balls[j]; if (a.mode !== 'table' || c.mode !== 'table') continue;
        let nx = c.x - a.x, ny = c.y - a.y; const d2 = nx * nx + ny * ny; if (d2 >= 4 * R * R || d2 === 0) continue;
        const d = Math.sqrt(d2); nx /= d; ny /= d; const o = (2 * R - d) / 2;
        a.x -= nx * o; a.y -= ny * o; c.x += nx * o; c.y += ny * o;
        const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny; if (rv > 0) continue;
        const imp = -rv * 0.95; a.vx -= imp * nx; a.vy -= imp * ny; c.vx += imp * nx; c.vy += imp * ny;
      }
    }
    let acc = 0;
    function physics(dt) {
      acc = Math.min(acc + dt, 0.1);
      while (acc >= H_STEP) {
        acc -= H_STEP;
        // split the step if anything would move more than a third of the ball radius
        let fastest = 0;
        for (const b of balls) if (b.mode === 'table') fastest = Math.max(fastest, Math.abs(b.vx) + Math.abs(b.vy));
        fastest = Math.max(fastest, 24 * 60); // flipper tips move up to ~24 rad/s * 60 units
        const n = Math.max(1, Math.ceil(fastest * H_STEP / (R / 3))), h = H_STEP / n;
        for (let k = 0; k < n; k++) {
          for (const f of FLIP) {
            const on = f.on && !S.tilted && !S.over;
            const target = on ? f.up : f.rest, dir = Math.sign(target - f.a), spd = on ? 24 : 13;
            if (Math.abs(target - f.a) <= spd * h) { f.a = target; f.w = 0; } else { f.w = dir * spd; f.a += f.w * h; }
          }
          for (const b of balls) if (b.mode !== 'gone') { stepBall(b, h); if (b.mode !== 'gone') watchdog(b, h); }
          if (balls.length > 1) ballBall();
        }
      }
      const before = balls.length;
      balls = balls.filter(b => b.mode !== 'gone');
      if (balls.length < before && S.state !== 'bonus' && !S.over) drainCheck();
    }

    // ---------------------------------------------------------------- controls
    let pull = 0, pulling = false;
    function flip(side, on) {
      if (!S || S.over || S.paused) return;
      const f = FLIP[side]; if (f.on === on) return; f.on = on;
      if (on && !S.tilted) { sfx('turn'); if (S.lanes && S.launched) { // lane change: rotate lit top lanes
        const l = S.lanes; S.lanes = side ? [l[3], l[0], l[1], l[2]] : [l[1], l[2], l[3], l[0]]; } }
    }
    function plunger(on) {
      if (!S || S.over || S.paused) return;
      if (on) { pulling = true; return; }
      if (!pulling) return; pulling = false;
      const b = balls.find(b => b.x > 376 && b.y > PLY - R - 6 && b.mode === 'table');
      if (b) { b.vy = -(1250 + pull * 1550); sfx('boing'); }
      pull = 0;
    }
    function nudge(dx, dy) {
      if (!S || S.over || S.paused || S.state === 'bonus') return;
      if (S.tilted) return;
      for (const b of balls) if (b.mode === 'table') { b.vx += dx * 160; b.vy += dy * 160; }
      fx.shake = 0.18; fx.sx = dx; fx.sy = dy; sfx('thud');
      S.tilt += 1;
      if (S.tilt > 3.2) { S.tilted = true; FLIP.forEach(f => { f.on = false; }); sayNow('TILT', 4, true); sfx('beep'); G.secret('games.pb.tilt'); }
      else if (S.tilt > 2.1) { say('DANGER!', 1.2, true); sfx('beep'); }
    }
    const CHEATS = { gubbinz: () => { S.gubbinz = !S.gubbinz; sayNow(S.gubbinz ? 'GUBBINZ BALL!' : 'NORMAL BALL', 2, true); }, dakka: () => multiball('MORE BALLS!'), rupees: () => { add(1000000); sayNow('SHINY RUPEES!', 2, true); }, teef: () => { add(1000000); sayNow('SHINY RUPEES!', 2, true); }, waaagh: () => { S.extraBalls++; S.again = 1; sayNow('WAAAGH! EXTRA BALL', 2, true); sfx('waaagh'); } };
    const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    function typed(ev) {
      if (!S || S.over) return;
      S.konami.push(ev.key.length === 1 ? ev.key.toLowerCase() : ev.key); if (S.konami.length > 10) S.konami.shift();
      if (S.konami.join() === KONAMI.join()) { S.konami = []; S.extraBalls += 3; S.again = 1; sayNow('30 LIVES! (WELL, 3)', 2.5, true); sfx('solve'); G.secret('games.pb.konami'); }
      if (ev.key.length !== 1 || !/[a-z]/i.test(ev.key)) return;
      S.cheat = (S.cheat + ev.key.toLowerCase()).slice(-12);
      for (const k in CHEATS) if (S.cheat.endsWith(k)) { S.cheat = ''; CHEATS[k](); G.secret('games.pb.cheat'); sfx('pet'); }
    }
    function pause(on) {
      if (!S || S.over) return;
      S.paused = on == null ? !S.paused : on;
      FLIP.forEach(f => { f.on = false; }); pulling = false;
      if (S.paused) G.stopMusic(); else G.music(opts.music ? (balls.length > 1 ? 'jg_pinball2' : 'jg_pinball') : '');
    }
    const resumeKey = () => { if (S && S.paused && G.active()) { pause(false); return true; } return false; };
    G.keys = {
      down(ev) {
        const k = ev.key;
        if (k === 'F3') { pause(); return true; }
        if (k === 'F8') { debugOn = !debugOn; return true; }
        if (k === 'F4') { w.el.classList.toggle('maxwin'); window.dispatchEvent(new Event('resize')); return true; }
        if (ev.repeat && !/^Arrow/.test(k)) return true;
        if (S && S.paused) { if (!/^F\d/.test(k)) resumeKey(); return true; }
        typed(ev);
        if (k === 'z' || k === 'Z' || k === 'ArrowLeft' || (k === 'Shift' && ev.location === 1)) { flip(0, true); return true; }
        if (k === '/' || k === '?' || k === 'ArrowRight' || (k === 'Shift' && ev.location === 2)) { flip(1, true); return true; }
        if (k === ' ' || k === 'Enter' || k === 'ArrowDown') { plunger(true); return true; }
        if (k === 'x' || k === 'X') { nudge(1, 0); return true; }
        if (k === '.' || k === '>') { nudge(-1, 0); return true; }
        if (k === 'ArrowUp') { nudge(0, -0.6); return true; }
        return false;
      },
      up(ev) {
        const k = ev.key;
        if (k === 'z' || k === 'Z' || k === 'ArrowLeft' || (k === 'Shift' && ev.location === 1)) { flip(0, false); return true; }
        if (k === '/' || k === '?' || k === 'ArrowRight' || (k === 'Shift' && ev.location === 2)) { flip(1, false); return true; }
        if (k === ' ' || k === 'Enter' || k === 'ArrowDown') { plunger(false); return true; }
        return false;
      },
    };
    // mouse / touch: left half = left flipper, right half = right flipper; hold on the right while the ball waits = plunger
    const touches = new Map();
    G.on(cv, 'pointerdown', ev => {
      ev.preventDefault(); G.focus();
      if (!S) return;
      if (S.paused) { resumeKey(); return; }
      if (S.over) return;
      const r = cv.getBoundingClientRect(), x = ev.clientX - r.left;
      if (L.panel && x > L.panel.x && !L.portrait) return;
      const side = x < (L.portrait ? C.W / 2 : L.cx) ? 0 : 1;
      touches.set(ev.pointerId, side);
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
      if (side === 1 && S.state === 'plunger' && balls.some(b => b.x > 376 && b.y > PLY - 30)) plunger(true);
      flip(side, true);
    });
    const up = ev => { if (!touches.has(ev.pointerId)) return; const side = touches.get(ev.pointerId); touches.delete(ev.pointerId); if (![...touches.values()].includes(side)) flip(side, false); if (side === 1) plunger(false); };
    G.on(cv, 'pointerup', up); G.on(cv, 'pointercancel', up);
    G.on(cv, 'contextmenu', ev => ev.preventDefault());
    G.onActive = a => { if (!a && S && !S.over && !S.paused) pause(true); };

    // ---------------------------------------------------------------- layout + projection
    function layout(W, H) {
      L.portrait = W < H * 0.95;
      const k = 0.42;
      let box, panel;
      if (L.portrait) {
        const ph = Math.min(118, Math.max(84, H * 0.15));
        panel = { x: 0, y: 0, w: W, h: ph };
        box = { x: 0, y: ph, w: W, h: H - ph };
      } else {
        const pw = Math.min(250, Math.max(170, W * 0.33));
        panel = { x: W - pw, y: 0, w: pw, h: H };
        box = { x: 0, y: 0, w: W - pw, h: H };
      }
      // fit the trapezoid: bottom width Wb, foreshortened height
      const topPad = 16, botPad = 6;
      let comp = 0.74;
      let Wb = Math.min(box.w * 0.96, (box.h - topPad - botPad) / (TH / TW * comp));
      if (L.portrait) { Wb = Math.min(box.w * 0.98, (box.h - topPad - botPad) / (TH / TW * 0.62)); comp = clamp((box.h - topPad - botPad) / (TH / TW * Wb), 0.62, 0.86); }
      const sc = Wb / TW, yb = box.y + box.h - botPad, yt = yb - TH * sc * comp;
      Object.assign(L, { box, panel, k, sc, yb, yt, cx: box.x + box.w / 2, Hc: (yb - yt) / (1 - 1 / (1 + k)) });
      L.hz = yb - L.Hc;
      L.dirty = true;
    }
    function P(x, y, z) { // table -> screen
      const t = y / TH, s = 1 / (1 + L.k * (1 - t));
      return [L.cx + (x - TW / 2 - 7) * L.sc * s, L.hz + L.Hc * s - (z || 0) * L.sc * s * 0.85, s];
    }
    const ys = (y, r) => (P(0, y + r)[1] - P(0, y - r)[1]) / 2; // vertical radius of a flat circle

    // ---------------------------------------------------------------- static art: painted flat, then projected
    let bgCv = null, fgCv = null;
    function paintFlat() {
      const th = THEMES[opts.theme] || THEMES.space;
      const fs = clamp(L.sc * C.dpr * 1.15, 1, 3);
      const fc = document.createElement('canvas'); fc.width = Math.round(TW * fs); fc.height = Math.round(TH * fs);
      const c = fc.getContext('2d'); c.scale(fs, fs);
      // playfield paint
      const g = c.createLinearGradient(0, 0, 0, TH); g.addColorStop(0, th.bg0); g.addColorStop(1, th.bg1); c.fillStyle = g; c.fillRect(0, 0, TW, TH);
      const rnd = JG.rng(1999 + opts.theme.length);
      for (let i = 0; i < 9; i++) { const x = rnd() * TW, y = rnd() * TH, r = 60 + rnd() * 140, rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, th.neb[i % 3]); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(x - r, y - r, r * 2, r * 2); }
      if (opts.theme === 'desert') { // dunes and canyon stripes
        for (let i = 0; i < 7; i++) { c.fillStyle = `rgba(${120 + i * 12},${70 + i * 8},${20 + i * 4},.35)`; c.beginPath(); c.moveTo(0, 120 + i * 100); for (let x = 0; x <= TW; x += 20) c.lineTo(x, 120 + i * 100 + Math.sin(x / 50 + i) * 18); c.lineTo(TW, TH); c.lineTo(0, TH); c.fill(); }
      } else for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; const s = rnd() < 0.1 ? 1.6 : 0.8; c.fillRect(rnd() * TW, rnd() * TH, s, s); }
      // planet / suns
      if (opts.theme === 'desert') { for (const [x, y, r] of [[300, 150, 26], [340, 175, 16]]) { const pg = c.createRadialGradient(x, y, 2, x, y, r * 2); pg.addColorStop(0, '#fff'); pg.addColorStop(0.35, 'rgba(255,240,180,.9)'); pg.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = pg; c.beginPath(); c.arc(x, y, r * 2, 0, TAU); c.fill(); } }
      else { const pg = c.createRadialGradient(80, 150, 6, 96, 168, 58); pg.addColorStop(0, th.planet[0]); pg.addColorStop(1, th.planet[1]); c.fillStyle = pg; c.beginPath(); c.arc(100, 170, 46, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; c.beginPath(); c.ellipse(100, 170, 74, 14, -0.3, 0, TAU); c.stroke(); }
      // lane guides painted lines
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; c.setLineDash([6, 6]);
      c.beginPath(); c.moveTo(35, 470); c.lineTo(35, 270); c.moveTo(359, 470); c.lineTo(359, 270); c.stroke(); c.setLineDash([]);
      // ramp channel floor
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(268, 300, 44, 52);
      // space cadet portrait in the middle (helmet + goggles)
      grotPilot(c, CX, 572, 40, th);
      // warp saucer ring
      const sg = c.createRadialGradient(SAUCER.x, SAUCER.y, 2, SAUCER.x, SAUCER.y, 26); sg.addColorStop(0, '#000'); sg.addColorStop(0.45, '#000'); sg.addColorStop(0.5, '#ff40ff'); sg.addColorStop(0.75, 'rgba(120,0,160,.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = sg; c.beginPath(); c.arc(SAUCER.x, SAUCER.y, 26, 0, TAU); c.fill();
      c.fillStyle = '#000'; c.beginPath(); c.arc(SAUCER.x, SAUCER.y, 12, 0, TAU); c.fill();
      label(c, 'WARP', SAUCER.x, SAUCER.y + 36, 9, '#ff9aff');
      label(c, 'POD RACE', 290, 395, 8, '#ffb060');
      label(c, 'ALIENS', 82, 300, 8, '#ff8080', -Math.PI / 2 * 0);
      label(c, 'FIGHTERS', 316, 476, 8, '#80e0ff');
      label(c, 'ORBIT', 35, 490, 7, '#b0ff80'); label(c, 'ORBIT', 359, 490, 7, '#b0ff80');
      // unlit lamps
      for (const id in LAMPS) drawLamp(c, LAMPS[id], 0.22);
      // slingshot fills
      for (const s of [0, 1]) { const X = s ? M : (x => x); c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.moveTo(X(84), 566); c.lineTo(X(84), 618); c.lineTo(X(114), 636); c.closePath(); c.fill(); }
      // outlane/inlane floor marks + flipper area
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(18, 560, 28, 240); c.fillRect(M(46), 560, 28, 240);
      // plunger lane
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(376, 230, 26, 570);
      for (let y = 300; y < 760; y += 40) { c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(384, y + 10); c.lineTo(389, y); c.lineTo(394, y + 10); c.fill(); }
      return fc;
    }
    function label(c, t, x, y, size, col, rot) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.font = `bold ${size}px Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillText(t, 0.8, 0.8); c.fillStyle = col; c.fillText(t, 0, 0); c.restore(); }
    function grotPilot(c, x, y, r, th) { // the space cadet portrait (helmet, goggles, big grin)
      c.save(); c.translate(x, y); c.lineJoin = 'round';
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(0, 0, r + 6, 0, TAU); c.fill();
      c.strokeStyle = th.accent; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r + 4, 0, TAU); c.stroke();
      c.save(); c.beginPath(); c.arc(0, 0, r + 3, 0, TAU); c.clip();
      // orange flight suit with a collar ring and badge
      c.strokeStyle = '#123'; c.lineWidth = 1.5;
      c.fillStyle = '#e8701a'; c.beginPath(); c.ellipse(0, r * 1.05, r * 0.95, r * 0.5, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#c0c8d4'; c.beginPath(); c.ellipse(0, r * 0.62, r * 0.42, r * 0.12, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = th.accent; c.beginPath(); c.arc(-r * 0.5, r * 0.82, r * 0.1, 0, TAU); c.fill(); c.stroke();
      c.restore();
      c.strokeStyle = '#123'; c.lineWidth = 1.5;
      // face
      const fg = c.createLinearGradient(-r * 0.4, -r * 0.2, r * 0.4, r * 0.5); fg.addColorStop(0, '#ffe0c4'); fg.addColorStop(1, '#d89a70');
      c.fillStyle = fg; c.beginPath(); c.ellipse(0, r * 0.1, r * 0.4, r * 0.46, 0, 0, TAU); c.fill(); c.stroke();
      // grin, freckles, nose
      c.fillStyle = '#7a1010'; c.beginPath(); c.moveTo(-r * 0.2, r * 0.27); c.quadraticCurveTo(0, r * 0.5, r * 0.2, r * 0.27); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.fillRect(-r * 0.14, r * 0.28, r * 0.28, r * 0.06);
      c.fillStyle = '#c87a50'; for (const [fx, fy] of [[-0.26, 0.16], [-0.2, 0.2], [0.22, 0.17], [0.27, 0.21]]) { c.beginPath(); c.arc(fx * r, fy * r, r * 0.025, 0, TAU); c.fill(); }
      c.beginPath(); c.arc(0, r * 0.16, r * 0.05, 0, Math.PI); c.stroke();
      // white helmet with a red stripe and ear discs
      const hg = c.createRadialGradient(-r * 0.3, -r * 0.6, 2, 0, -r * 0.2, r * 0.8); hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.6, '#dfe6ee'); hg.addColorStop(1, '#8a96a6');
      c.fillStyle = hg; c.beginPath(); c.moveTo(-r * 0.55, r * 0.15); c.bezierCurveTo(-r * 0.62, -r * 0.75, r * 0.62, -r * 0.75, r * 0.55, r * 0.15); c.quadraticCurveTo(r * 0.44, -r * 0.18, 0, -r * 0.2); c.quadraticCurveTo(-r * 0.44, -r * 0.18, -r * 0.55, r * 0.15); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#d01818'; c.beginPath(); c.moveTo(-r * 0.08, -r * 0.62); c.lineTo(r * 0.08, -r * 0.62); c.lineTo(r * 0.07, -r * 0.2); c.lineTo(-r * 0.07, -r * 0.2); c.closePath(); c.fill();
      for (const s of [-1, 1]) { c.fillStyle = '#9aa6b6'; c.beginPath(); c.arc(s * r * 0.55, r * 0.05, r * 0.13, 0, TAU); c.fill(); c.stroke(); c.fillStyle = th.accent; c.beginPath(); c.arc(s * r * 0.55, r * 0.05, r * 0.05, 0, TAU); c.fill(); }
      // goggles on a leather strap
      c.fillStyle = '#4a3020'; c.fillRect(-r * 0.56, -r * 0.13, r * 1.12, r * 0.14);
      for (const s of [-1, 1]) {
        c.fillStyle = '#c8a040'; c.beginPath(); c.arc(s * r * 0.2, -r * 0.06, r * 0.19, 0, TAU); c.fill(); c.stroke();
        const lg = c.createRadialGradient(s * r * 0.2 - r * 0.06, -r * 0.12, 1, s * r * 0.2, -r * 0.06, r * 0.14); lg.addColorStop(0, '#fff8c0'); lg.addColorStop(1, '#ffa000');
        c.fillStyle = lg; c.beginPath(); c.arc(s * r * 0.2, -r * 0.06, r * 0.13, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#000'; c.beginPath(); c.arc(s * r * 0.2 + r * 0.02, -r * 0.04, r * 0.05, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(s * r * 0.2 - r * 0.05, -r * 0.12, r * 0.035, 0, TAU); c.fill();
      }
      // helmet bubble
      c.strokeStyle = 'rgba(200,240,255,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(0, -r * 0.02, r * 0.82, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-r * 0.32, -r * 0.55, r * 0.18, r * 0.08, -0.6, 0, TAU); c.fill();
      c.restore();
    }
    function drawLamp(c, lp, a) { // flat (table space) lamp insert
      c.save(); c.translate(lp.x, lp.y); c.globalAlpha = a;
      c.fillStyle = lp.col; c.strokeStyle = 'rgba(0,0,0,.8)'; c.lineWidth = 1.2;
      c.beginPath();
      if (lp.shape === 'arrow') { const r = lp.r; c.moveTo(0, -r * 1.3); c.lineTo(r, -r * 0.1); c.lineTo(r * 0.45, -r * 0.1); c.lineTo(r * 0.45, r); c.lineTo(-r * 0.45, r); c.lineTo(-r * 0.45, -r * 0.1); c.lineTo(-r, -r * 0.1); c.closePath(); }
      else c.arc(0, 0, lp.r, 0, TAU);
      c.fill(); c.globalAlpha = 1; c.stroke();
      if (lp.label) { c.fillStyle = a > 0.5 ? '#000' : 'rgba(255,255,255,.75)'; c.font = `bold ${lp.r * (lp.label.length > 1 ? 0.95 : 1.25)}px Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(lp.label, 0, 0.5); }
      c.restore();
    }
    function project(src, dst) { // slice the flat art onto the trapezoid, one screen row at a time
      const d = dst.getContext('2d'), dpr = C.dpr, fs = src.height / TH;
      const y0 = Math.floor(L.yt * dpr), y1 = Math.ceil(L.yb * dpr);
      for (let Y = y0; Y < y1; Y++) {
        const sy = (Y + 0.5) / dpr, s = (sy - L.hz) / L.Hc, t = 1 - (1 / s - 1) / L.k;
        if (t < 0 || t > 1) continue;
        const srcY = Math.min(src.height - 1, t * TH * fs);
        const xl = L.cx + (-TW / 2 - 7) * L.sc * s, ww = TW * L.sc * s;
        d.drawImage(src, 0, srcY, src.width, 1, xl * dpr, Y, ww * dpr, 1.6);
      }
    }
    function wall3d(d, s, th) {
      const h = s.h; if (!h || s.kind === 'drop' || s.kind === 'stand' || s.kind === 'plunger') return;
      const a0 = P(s.ax, s.ay, 0), b0 = P(s.bx, s.by, 0), a1 = P(s.ax, s.ay, h), b1 = P(s.bx, s.by, h);
      const nx = -s.dy, ny = s.dx, lit = 0.55 + 0.45 * Math.max(0, -(nx * 0.4 + ny * 0.9));
      const [r, g, b] = s.kind === 'sling' ? [230, 230, 230] : s.kind === 'gate' ? [200, 200, 210] : th.wall;
      d.fillStyle = `rgb(${r * lit | 0},${g * lit | 0},${b * lit | 0})`;
      d.beginPath(); d.moveTo(a0[0], a0[1]); d.lineTo(b0[0], b0[1]); d.lineTo(b1[0], b1[1]); d.lineTo(a1[0], a1[1]); d.closePath(); d.fill();
      d.strokeStyle = s.kind === 'sling' ? '#fff' : th.rail; d.lineWidth = Math.max(1, 2 * L.sc); d.beginPath(); d.moveTo(a1[0], a1[1]); d.lineTo(b1[0], b1[1]); d.stroke();
    }
    function cyl(d, x, y, r, h, side, top, rim) { // a vertical cylinder (posts, bumper bodies)
      const p0 = P(x, y, 0), p1 = P(x, y, h), rx = Math.max(0.1, r * L.sc * p0[2]), ry = Math.max(0.1, ys(y, r));
      d.fillStyle = side; d.beginPath(); d.ellipse(p0[0], p0[1], rx, ry, 0, 0, Math.PI); d.lineTo(p1[0] - rx, p1[1]); d.ellipse(p1[0], p1[1], rx, ry, 0, Math.PI, 0, true); d.closePath(); d.fill();
      d.fillStyle = top; d.beginPath(); d.ellipse(p1[0], p1[1], rx, ry, 0, 0, TAU); d.fill();
      if (rim) { d.strokeStyle = rim; d.lineWidth = Math.max(1, L.sc * 1.5); d.stroke(); }
    }
    function renderStatic() {
      const th = THEMES[opts.theme] || THEMES.space, dpr = C.dpr;
      bgCv = bgCv || document.createElement('canvas'); fgCv = fgCv || document.createElement('canvas');
      for (const c of [bgCv, fgCv]) { c.width = cv.width; c.height = cv.height; }
      const flat = paintFlat();
      const d = bgCv.getContext('2d');
      // cabinet surround
      d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cg = d.createLinearGradient(0, 0, L.box.w, 0); cg.addColorStop(0, '#111'); cg.addColorStop(0.5, '#2a2a3a'); cg.addColorStop(1, '#111');
      d.fillStyle = cg; d.fillRect(L.box.x, L.box.y, L.box.w, L.box.h);
      // the table's wooden side rails (outside the trapezoid)
      const tl = P(0, 0), tr = P(TW, 0), bl = P(0, TH), br = P(TW, TH);
      d.fillStyle = '#4a2a14'; d.beginPath(); d.moveTo(tl[0] - 8, tl[1] - 6); d.lineTo(tr[0] + 8, tr[1] - 6); d.lineTo(br[0] + 12, br[1] + 4); d.lineTo(bl[0] - 12, bl[1] + 4); d.closePath(); d.fill();
      d.strokeStyle = '#8a5a2a'; d.lineWidth = 2; d.stroke();
      d.setTransform(1, 0, 0, 1, 0, 0);
      project(flat, bgCv);
      d.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 3D walls, far ones first
      const ws = walls.slice().sort((a, b) => Math.max(a.ay, a.by) - Math.max(b.ay, b.by));
      for (const s of ws) wall3d(d, s, th);
      for (const p of posts) if (p.kind !== 'bumper') cyl(d, p.x, p.y, p.r, p.h, '#888', '#ddd', null);
      // foreground: apron + the plastic ramp
      const f = fgCv.getContext('2d'); f.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRamp(f, th);
      drawApron(f, th);
      L.dirty = false;
    }
    function drawRamp(f, th) {
      const pts = []; for (let s = 0; s <= RAMP_L; s += 6) pts.push(rampAt(s));
      const side = (p, off, z) => { const L2 = Math.hypot(p[4], p[5]) || 1, nx = -p[5] / L2, ny = p[4] / L2; return P(p[0] + nx * off, p[1] + ny * off, p[2] + z); };
      // supports
      f.strokeStyle = 'rgba(180,190,210,.8)'; f.lineWidth = Math.max(1, 2 * L.sc);
      for (let i = 4; i < pts.length - 4; i += 9) { const p = pts[i]; if (p[2] < 6) continue; for (const o of [-14, 14]) { const a = side(p, o, 0), b = side(p, o, -p[2]); f.beginPath(); f.moveTo(a[0], a[1]); f.lineTo(b[0], b[1]); f.stroke(); } }
      // floor
      f.fillStyle = opts.theme === 'desert' ? 'rgba(255,200,120,.30)' : 'rgba(140,200,255,.28)';
      f.beginPath(); pts.forEach((p, i) => { const q = side(p, -14, 0); i ? f.lineTo(q[0], q[1]) : f.moveTo(q[0], q[1]); }); for (let i = pts.length - 1; i >= 0; i--) { const q = side(pts[i], 14, 0); f.lineTo(q[0], q[1]); } f.closePath(); f.fill();
      // rails
      for (const o of [-14, 14]) for (const [z, col, lw] of [[0, 'rgba(255,255,255,.35)', 1.2], [7, th.rail, 2.2]]) { f.strokeStyle = col; f.lineWidth = Math.max(1, lw * L.sc); f.beginPath(); pts.forEach((p, i) => { const q = side(p, o, z); i ? f.lineTo(q[0], q[1]) : f.moveTo(q[0], q[1]); }); f.stroke(); }
      // chequered start line
      const a = side(pts[2], -14, 0), b = side(pts[2], 14, 0);
      f.strokeStyle = '#fff'; f.setLineDash([3, 3]); f.lineWidth = Math.max(2, 3 * L.sc); f.beginPath(); f.moveTo(a[0], a[1]); f.lineTo(b[0], b[1]); f.stroke(); f.setLineDash([]);
    }
    function drawApron(f, th) {
      // the metal apron covering the bottom of the table, with the drain gap between the flippers
      const yA = 742;
      const pts = [[18, yA + 30], [18, TH], [376, TH], [376, yA + 30], [M(124), 708], [M(150), 760], [150, 760], [124, 708]];
      const sp = pts.map(([x, y]) => P(x, y, 10));
      const g = f.createLinearGradient(0, sp[0][1], 0, sp[1][1]); g.addColorStop(0, '#9aa0b8'); g.addColorStop(0.2, th.apron); g.addColorStop(1, '#000');
      f.fillStyle = g; f.beginPath(); sp.forEach((p, i) => i ? f.lineTo(p[0], p[1]) : f.moveTo(p[0], p[1])); f.closePath(); f.fill();
      f.strokeStyle = th.rail; f.lineWidth = 1.5; f.stroke();
      const c = P(CX, 784, 10);
      f.save(); f.translate(c[0], c[1]); f.scale(L.sc * c[2], L.sc * c[2] * 0.8);
      f.font = 'bold 15px Impact, "Arial Black", sans-serif'; f.textAlign = 'center'; f.textBaseline = 'middle';
      f.fillStyle = '#000'; f.fillText('SPACE JACK', 1.5, 1.5); f.fillStyle = th.accent; f.fillText('SPACE JACK', 0, 0);
      f.restore();
      // plunger housing cover
      const a = P(376, 790, 10), b = P(402, 790, 10), c2 = P(402, TH, 10), d2 = P(376, TH, 10);
      f.fillStyle = '#222'; f.beginPath(); f.moveTo(a[0], a[1]); f.lineTo(b[0], b[1]); f.lineTo(c2[0], c2[1]); f.lineTo(d2[0], d2[1]); f.fill();
    }

    // ---------------------------------------------------------------- per-frame drawing
    let tNow = 0;
    function draw() {
      if (L.dirty || !bgCv) renderStatic();
      const th = THEMES[opts.theme] || THEMES.space, dpr = C.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      let ox = 0, oy = 0;
      if (fx.shake > 0) { ox = (fx.sx || (Math.random() - 0.5)) * fx.shake * 30 * dpr; oy = (fx.sy || (Math.random() - 0.5)) * fx.shake * 20 * dpr; }
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(bgCv, ox, oy);
      ctx.setTransform(dpr, 0, 0, dpr, ox / 1, oy / 1);
      ctx.translate(0, 0);
      // lamps
      ctx.globalCompositeOperation = 'lighter';
      for (const id in LAMPS) { const lp = LAMPS[id]; const v = lp.blink > 0 ? (Math.sin(tNow * 25) > 0 ? 1 : 0.2) : lp.on; if (v > 0.05) lampGlow(lp, v); }
      ctx.globalCompositeOperation = 'source-over';
      // slingshot flashes
      for (const s of slings) if (s.flash > 0) { const a = P(s.ax, s.ay, 12), b = P(s.bx, s.by, 12); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4 * L.sc; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.shadowBlur = 0; }
      // targets
      for (const d of DROPS) if (!d.seg.dead) box3d(d.seg.ax - 4, d.seg.ay, 6, 26, 14, '#d02020', '#ff6060');
      for (const s of STANDS) box3d(s.seg.ax, s.seg.ay, 5, 20, 13, s.seg.flash > 0 ? '#ffffff' : S && S.stands[s.i] ? '#30d0ff' : '#1a6a9a', '#a0f0ff');
      // bumpers
      for (const b of BUMPERS) {
        const lit = b.flash > 0;
        cyl(ctx, b.x, b.y, b.r, 10, '#333', lit ? '#fff' : '#ddd', null);
        cyl(ctx, b.x, b.y, b.r * 0.82, 18, lit ? '#ffd400' : '#c03030', lit ? '#fff7a0' : (opts.theme === 'desert' ? '#ff9a2a' : '#ff4040'), '#000');
        const p = P(b.x, b.y, 19); ctx.fillStyle = lit ? '#fff' : '#ffd400'; ctx.beginPath(); ctx.ellipse(p[0], p[1], b.r * 0.35 * L.sc * p[2], ys(b.y, b.r * 0.35), 0, 0, TAU); ctx.fill();
        if (lit) { ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], b.r * 2.2 * L.sc); gl.addColorStop(0, 'rgba(255,240,120,.7)'); gl.addColorStop(1, 'rgba(255,240,120,0)'); ctx.fillStyle = gl; ctx.fillRect(p[0] - 60, p[1] - 60, 120, 120); ctx.globalCompositeOperation = 'source-over'; }
      }
      // saucer: a held ball glows
      // balls on the table (with shadows)
      for (const b of balls) if (b.mode !== 'ramp') drawBall(b);
      // flippers
      for (const f of FLIP) drawFlipper(f, th);
      // plunger
      drawPlunger();
      // foreground: ramp + apron, then balls on the ramp
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(fgCv, ox, oy); ctx.setTransform(dpr, 0, 0, dpr, ox, oy);
      for (const b of balls) if (b.mode === 'ramp') drawBall(b);
      if (debugOn) drawDebug();
      // pod race countdown on the table
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (fx.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${fx.flash * 0.35})`; ctx.fillRect(L.box.x, L.box.y, L.box.w, L.box.h); }
      if (fx.warp > 0) drawWarp();
      if (S && S.tilted) { ctx.fillStyle = 'rgba(80,0,0,.25)'; ctx.fillRect(L.box.x, L.box.y, L.box.w, L.box.h); }
      drawPanel(th);
      if (S && S.paused) drawPaused();
    }
    // F8: draw every collision shape the physics uses, projected onto the table (for auditing the geometry)
    let debugOn = false;
    function drawDebug() {
      const ln = (ax, ay, bx, by, col, wdt) => { const a = P(ax, ay, 0), b = P(bx, by, 0); ctx.strokeStyle = col; ctx.lineWidth = wdt || 1.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
      const ring = (x, y, r, col) => { ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU, p = P(x + Math.cos(a) * r, y + Math.sin(a) * r, 0); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); };
      for (const w2 of walls) {
        if (w2.dead) { ln(w2.ax, w2.ay, w2.bx, w2.by, 'rgba(255,0,0,.3)', 1); continue; }
        ln(w2.ax, w2.ay, w2.bx, w2.by, w2.oneway ? '#ffff00' : w2.kind === 'sling' ? '#ffffff' : '#ff3030', 2);
        if (w2.oneway) { const mx = (w2.ax + w2.bx) / 2, my = (w2.ay + w2.by) / 2; ln(mx, my, mx + w2.oneway[0] * 8, my + w2.oneway[1] * 8, '#ffff00', 1); }
        ring(w2.ax, w2.ay, 1.5, '#ff8080');
      }
      for (const p of posts) ring(p.x, p.y, p.r, p.kind === 'bumper' ? '#ff40ff' : '#00ffff');
      for (const f of FLIP) { const ux = Math.cos(f.a), uy = Math.sin(f.a); ring(f.px, f.py, f.r1, '#40ff40'); ring(f.px + ux * f.L, f.py + uy * f.L, f.r2, '#40ff40'); ln(f.px - uy * f.r1, f.py + ux * f.r1, f.px + ux * f.L - uy * f.r2, f.py + uy * f.L + ux * f.r2, '#40ff40'); ln(f.px + uy * f.r1, f.py - ux * f.r1, f.px + ux * f.L + uy * f.r2, f.py + uy * f.L - ux * f.r2, '#40ff40'); }
      ctx.strokeStyle = '#ff00ff'; ctx.setLineDash([4, 3]); ctx.beginPath(); for (let q = 0; q <= RAMP_L; q += 8) { const r2 = rampAt(q), p = P(r2[0], r2[1], r2[2]); q ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); ctx.setLineDash([]);
      ring(SAUCER.x, SAUCER.y, 11, '#ffffff'); ln(270, 300, 310, 300, '#ff8000', 2);
      for (const b of balls) ring(b.x, b.y, R, '#ffffff');
      ctx.fillStyle = '#fff'; ctx.font = '11px Tahoma, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`DEBUG: ${walls.length} walls, ${posts.length} posts (F8 to hide)`, L.box.x + 6, L.box.y + 14);
    }
    function lampGlow(lp, v) {
      const p = P(lp.x, lp.y, 0), rx = lp.r * L.sc * p[2], ry = ys(lp.y, lp.r);
      ctx.globalAlpha = v;
      ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(rx / lp.r, ry / lp.r);
      ctx.globalCompositeOperation = 'source-over';
      drawLamp(ctx, Object.assign({}, lp, { x: 0, y: 0 }), 1);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, lp.r * 2.2); g.addColorStop(0, lp.col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = v * 0.6; ctx.fillStyle = g; ctx.fillRect(-lp.r * 2.2, -lp.r * 2.2, lp.r * 4.4, lp.r * 4.4);
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function box3d(x, y0, wdt, len, h, side, top) { // a little block standing on the table (targets)
      const ya = y0, yb2 = y0 + len, xa = x, xb = x + wdt;
      const q = (X, Y, Z) => P(X, Y, Z);
      const quad = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); };
      quad([q(xa, yb2, 0), q(xb, yb2, 0), q(xb, yb2, h), q(xa, yb2, h)], side);
      quad([q(xa, ya, h), q(xb, ya, h), q(xb, yb2, h), q(xa, yb2, h)], top);
      quad([q(xa, ya, 0), q(xa, yb2, 0), q(xa, yb2, h), q(xa, ya, h)], side);
    }
    function drawBall(b) {
      const p = P(b.x, b.y, b.z + R), r = R * L.sc * p[2];
      if (b.mode !== 'ramp' || b.z < 2) { const s = P(b.x + 3, b.y + 2, 0); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(s[0], s[1], r, ys(b.y, R) * 0.9, 0, 0, TAU); ctx.fill(); }
      else { const s = P(b.x, b.y, 0); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(s[0], s[1], r * 0.8, ys(b.y, R) * 0.7, 0, 0, TAU); ctx.fill(); }
      if (b.mode === 'saucer') { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(tNow * 20); }
      if (S && S.gubbinz) { drawGrotBall(p[0], p[1], r); ctx.globalAlpha = 1; return; }
      const g = ctx.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.4, r * 0.1, p[0], p[1], r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#d8dce8'); g.addColorStop(0.75, '#6a7088'); g.addColorStop(1, '#22242e');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(p[0], p[1] + r * 0.45, r * 0.5, r * 0.18, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    function drawGrotBall(x, y, r) {
      ctx.fillStyle = '#5aac2c'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * r * 0.5, y - r * 0.2); ctx.lineTo(x + s * r * 1.5, y - r * 0.7); ctx.lineTo(x + s * r * 0.6, y + r * 0.3); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e10600'; ctx.fillRect(x - r * 0.45, y - r * 0.3, r * 0.3, r * 0.3); ctx.fillRect(x + r * 0.15, y - r * 0.3, r * 0.3, r * 0.3);
      ctx.fillStyle = '#fff'; ctx.fillRect(x - r * 0.4, y + r * 0.25, r * 0.8, r * 0.2);
    }
    function drawFlipper(f, th) {
      const pts = [], tx = Math.cos(f.a), ty = Math.sin(f.a), nx = -ty, ny = tx;
      for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 + Math.PI * i / 8; pts.push([f.px + (Math.cos(a) * tx - Math.sin(a) * -ty) * 0 + (tx * Math.cos(a) + nx * Math.sin(a)) * f.r1, f.py + (ty * Math.cos(a) + ny * Math.sin(a)) * f.r1]); }
      const ex = f.px + tx * f.L, ey = f.py + ty * f.L;
      for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + Math.PI * i / 8; pts.push([ex + (tx * Math.cos(a) + nx * Math.sin(a)) * f.r2, ey + (ty * Math.cos(a) + ny * Math.sin(a)) * f.r2]); }
      const H = 10, dead = S && S.tilted;
      for (let z = 0; z <= H; z += 2.5) {
        ctx.fillStyle = z < H ? (dead ? '#555' : '#9a1010') : (dead ? '#999' : '#f4f4f4');
        ctx.beginPath(); pts.forEach(([x, y], i) => { const p = P(x, y, z); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = dead ? '#777' : '#e10600'; ctx.lineWidth = Math.max(1.5, 3 * L.sc); ctx.stroke();
      const pv = P(f.px, f.py, H + 0.5); ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.ellipse(pv[0], pv[1], 3 * L.sc, 2.2 * L.sc, 0, 0, TAU); ctx.fill();
    }
    function drawPlunger() {
      const py = PLY + pull * 26;
      const a = P(380, py, 4), b = P(398, py, 4), c = P(398, 790, 4), d = P(380, 790, 4);
      ctx.fillStyle = '#c0c0c8'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.fill();
      ctx.fillStyle = '#e10600'; const t = P(389, py, 6); ctx.beginPath(); ctx.ellipse(t[0], t[1], 9 * L.sc, 3 * L.sc, 0, 0, TAU); ctx.fill();
    }
    function drawWarp() {
      const a = Math.min(1, fx.warp), cx = L.cx, cy = (L.yt + L.yb) / 2;
      ctx.fillStyle = `rgba(0,0,30,${0.75 * a})`; ctx.fillRect(L.box.x, L.box.y, L.box.w, L.box.h);
      ctx.strokeStyle = `rgba(200,230,255,${a})`; ctx.lineWidth = 1.5;
      const k = (3.2 - fx.warp) * 2;
      for (let i = 0; i < 80; i++) { const an = i * 2.399, r0 = ((i * 37) % 100) / 100 * 40 + k * 60 % 200, r1 = r0 + 20 + k * 40; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); ctx.stroke(); }
    }
    function drawPaused() {
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(L.box.x, L.box.y, L.box.w, L.box.h);
      ctx.fillStyle = '#ffd400'; ctx.font = 'bold 22px Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const y = (L.yt + L.yb) / 2; ctx.fillText('PAUSED', L.cx, y - 14);
      ctx.fillStyle = '#fff'; ctx.font = '12px Tahoma, sans-serif'; ctx.fillText(G.phone() ? 'Click the table to carry on' : 'Press F3, a key or click to carry on', L.cx, y + 12);
    }

    // ---------------------------------------------------------------- the score panel + dot-matrix display
    const dmd = document.createElement('canvas'); dmd.width = DW; dmd.height = DH;
    const dctx = dmd.getContext('2d'), dimg = dctx.createImageData(DW, DH), dbuf = new Uint8Array(DW * DH);
    let gridCv = null, gridKey = '';
    function dText(s, x, y, sx, sy, v) {
      sx = sx || 1; sy = sy || 1; v = v || 255;
      for (let i = 0; i < s.length; i++) {
        const gph = F[s[i]] || F['?'];
        for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (gph[r] & (16 >> c)) for (let a = 0; a < sx; a++) for (let b = 0; b < sy; b++) { const X = x + i * 6 * sx + c * sx + a, Y = y + r * sy + b; if (X >= 0 && X < DW && Y >= 0 && Y < DH) dbuf[Y * DW + X] = v; }
      }
    }
    const dCenter = (s, y, sx, sy, v) => dText(s, Math.round((DW - textW(s, sx || 1)) / 2), y, sx, sy, v);
    function renderDMD(dt) {
      dbuf.fill(0);
      if (!S) { dCenter('SPACE JACK', 4, 1, 2); dCenter('PINBALL', 20, 1, 1); }
      else {
        let m = msgs[0];
        if (m) { msgT += dt; if (msgT > m.dur) { msgs.shift(); msgT = 0; m = msgs[0]; } }
        const sc = JG.fmt(S.score);
        if (m && m.big) {
          const sx = textW(m.t, 2) <= DW ? 2 : 1, on = Math.floor(msgT * 6) % 2 === 0 || msgT > 0.8;
          if (on) dCenter(m.t, sx === 2 ? 2 : 6, sx, sx === 2 ? 2 : 2);
          dCenter(sc, 24, 1, 1, 140);
        } else {
          dCenter(sc, 1, textW(sc, 2) <= DW ? 2 : 1, 2);
          const line = m ? m.t : (S.paused ? 'PAUSED' : S.state === 'plunger' ? (G.phone() ? 'CLICK AND HOLD RIGHT SIDE TO LAUNCH' : 'HOLD SPACE TO LAUNCH') : mis().name + (S.mdone ? ' - WARP LIT' : ` ${S.mprog}/${mis().need}`));
          const wpx = textW(line, 1);
          if (wpx <= DW) dCenter(line, 22, 1, 1, 200);
          else { const off = Math.floor((tNow * 30) % (wpx + DW)); dText(line, DW - off, 22, 1, 1, 200); }
        }
      }
      const th = THEMES[opts.theme] || THEMES.space;
      const [cr, cg, cb] = opts.theme === 'space' ? [255, 140, 20] : opts.theme === 'mars' ? [255, 190, 40] : [120, 255, 80];
      const d = dimg.data;
      for (let i = 0; i < DW * DH; i++) { const v = dbuf[i] / 255, o = i * 4; d[o] = 22 + cr * v * 0.92; d[o + 1] = 10 + cg * v * 0.92; d[o + 2] = 6 + cb * v * 0.92; d[o + 3] = 255; }
      dctx.putImageData(dimg, 0, 0);
      return th;
    }
    function drawPanel(th) {
      const p = L.panel; if (!p) return;
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      // metal backbox
      const g = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0); g.addColorStop(0, '#1a1a2a'); g.addColorStop(0.5, '#34344a'); g.addColorStop(1, '#1a1a2a');
      ctx.fillStyle = g; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
      let dx, dy, pitch, infoY;
      if (L.portrait) {
        pitch = Math.max(1.5, Math.min(2.6, (p.w - 16) / DW, (p.h - 26) / DH));
        dx = p.x + (p.w - DW * pitch) / 2; dy = p.y + 5;
        infoY = dy + DH * pitch + 4;
      } else {
        // logo
        const ly = p.y + 14;
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.font = `bold ${Math.round(p.w / 7.2)}px Bangers, Impact, sans-serif`;
        const lg = ctx.createLinearGradient(0, ly, 0, ly + p.w / 7); lg.addColorStop(0, '#fff7a0'); lg.addColorStop(0.5, th.accent); lg.addColorStop(1, '#ff6a00');
        ctx.fillStyle = '#000'; ctx.fillText('SPACE JACK', p.x + p.w / 2 + 2, ly + 2); ctx.fillStyle = lg; ctx.fillText('SPACE JACK', p.x + p.w / 2, ly);
        ctx.font = `bold ${Math.round(p.w / 11)}px Bangers, Impact, sans-serif`; ctx.fillStyle = '#7cff3a'; ctx.fillText('P I N B A L L', p.x + p.w / 2, ly + p.w / 6.4);
        ctx.restore();
        pitch = (p.w - 20) / DW; dx = p.x + 10; dy = ly + p.w / 6.4 + p.w / 9 + 10;
        infoY = dy + DH * pitch + 12;
      }
      // DMD
      const dW = DW * pitch, dH = DH * pitch;
      ctx.fillStyle = '#000'; ctx.fillRect(dx - 4, dy - 4, dW + 8, dH + 8);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(dmd, dx, dy, dW, dH); ctx.imageSmoothingEnabled = true;
      const key = pitch + '|' + C.dpr;
      if (gridKey !== key) { gridKey = key; gridCv = makeGrid(pitch); }
      ctx.drawImage(gridCv, dx, dy, dW, dH);
      // info lines
      ctx.fillStyle = '#c8c8e0'; ctx.font = `${L.portrait ? 11 : 12}px Tahoma, sans-serif`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      if (!S) return;
      const rows = L.portrait
        ? [[`BALL ${S.ball}/${opts.balls}${S.extraBalls ? ' +' + S.extraBalls : ''}   ${RANKS[S.rank]}   ${mis().name}${S.podT > 0 ? ' ' + Math.ceil(S.podT) + 's' : ''}`]]
        : [['BALL', `${S.ball} of ${opts.balls}${S.extraBalls ? ' (+' + S.extraBalls + ')' : ''}`], ['PLAYER', '1'], ['RANK', RANKS[S.rank]], ['BONUS', `${JG.fmt(S.bonus)} x${S.mult}`], ['MISSION', mis().name], ['', S.mdone ? 'Shoot the WARP hole!' : mis().goal.toLowerCase().replace(/^./, c => c.toUpperCase())], ...(S.podT > 0 ? [['TIME', Math.ceil(S.podT) + ' sec']] : [])];
      if (L.portrait) { ctx.textAlign = 'center'; ctx.fillText(rows[0][0], p.x + p.w / 2, infoY); ctx.textAlign = 'left'; return; }
      let y = infoY; const lx = p.x + 12, vx = p.x + 74, maxW = p.w - 84;
      for (const [k, v] of rows) {
        ctx.fillStyle = '#8888b0'; ctx.fillText(k, lx, y);
        ctx.fillStyle = '#fff'; y = wrap(v, vx, y, maxW, 15) + 4;
      }
      y += 6;
      ctx.fillStyle = '#8888b0'; ctx.fillText('MISSIONS', lx, y); y += 16;
      MISSIONS.forEach((m, i) => { const done = i < S.mission % 5 || (S.cycle > 1 && i >= S.mission % 5 && false), cur = i === S.mission % 5; ctx.fillStyle = cur ? '#ffd400' : done ? '#7cff3a' : '#666680'; ctx.fillText((done ? '✔ ' : cur ? '▶ ' : '· ') + m.name, lx + 4, y); y += 15; });
      if (y < p.h - 60) { ctx.fillStyle = '#666680'; ctx.font = '11px Tahoma, sans-serif'; y = Math.max(y + 8, p.h - 58); for (const t of G.phone() ? ['Click left/right for flippers', 'Click and hold right to launch'] : ['Z  /  : flippers', 'Space : plunger', 'X  .  ↑ : nudge', 'F3 : pause']) { ctx.fillText(t, lx, y); y += 13; } }
    }
    function wrap(text, x, y, maxW, lh) {
      const words = String(text).split(' '); let line = '';
      for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = wd; } else line = t; }
      if (line) { ctx.fillText(line, x, y); y += lh; }
      return y;
    }
    function makeGrid(pitch) {
      const c = document.createElement('canvas'), dpr = C.dpr; c.width = Math.round(DW * pitch * dpr); c.height = Math.round(DH * pitch * dpr);
      const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'destination-out';
      const pp = c.width / DW, rad = pp * 0.4;
      for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) { g.beginPath(); g.arc((x + 0.5) * pp, (y + 0.5) * pp, rad, 0, TAU); g.fill(); }
      return c;
    }

    // ---------------------------------------------------------------- lamps from the rules state
    function lampsFromState() {
      if (!S) return;
      const T = tNow, blink = Math.sin(T * 8) > 0 ? 1 : 0.15, off = S.tilted;
      LANES.forEach((x, i) => { LAMPS['lane' + i].on = off ? 0 : S.lanes[i] ? 1 : (S.state === 'plunger' && i === S.skill ? blink : 0); });
      DROPS.forEach(d => { LAMPS['drop' + d.i].on = off ? 0 : d.seg.dead ? 1 : (mis().id === 'squig' && !S.mdone ? blink * 0.6 : 0); });
      STANDS.forEach(s => { LAMPS['stand' + s.i].on = off ? 0 : S.stands[s.i] ? 1 : (mis().id === 'battle' && !S.mdone ? blink * 0.6 : 0); });
      LAMPS.ramp.on = off ? 0 : mis().id === 'pod' && !S.mdone ? blink : 0.15;
      LAMPS.podlit.on = off ? 0 : mis().id === 'pod' ? 1 : 0;
      LAMPS.warp.on = off ? 0 : S.mdone || (S.xball && !S.xballGot) ? blink : 0;
      LAMPS.lorbit.on = off ? 0 : mis().id === 'hyper' && !S.mdone && !(S.hyp && S.hyp[0]) ? blink : 0;
      LAMPS.rorbit.on = off ? 0 : mis().id === 'hyper' && !S.mdone && !(S.hyp && S.hyp[1]) ? blink : 0;
      LAMPS.xball.on = off ? 0 : S.xball && !S.xballGot ? blink : 0;
      for (let i = 0; i < 5; i++) LAMPS['mis' + i].on = off ? 0 : i < S.mission % 5 ? 1 : i === S.mission % 5 ? blink * 0.7 : 0;
      [2, 3, 4, 5].forEach(m => { LAMPS['mult' + m].on = off ? 0 : S.mult >= m ? 1 : 0; });
      LAMPS.again.on = off ? 0 : S.save > 0 ? blink : S.extraBalls > 0 ? 1 : 0;
      for (const id of ['lin', 'rin', 'lout', 'rout']) LAMPS[id].on = 0;
    }

    // ---------------------------------------------------------------- main loop
    G.loop((dt, active) => {
      if (!S || w.el.style.display === 'none') return;
      if (!L.box) layout(C.W, C.H);
      tNow += dt;
      if (!S.paused && !S.over && fx.warp <= 0) {
        if (pulling) pull = Math.min(1, pull + dt * 1.1); else pull = Math.max(0, pull - dt * 8);
        if (S.state !== 'bonus') physics(dt);
        if (S.save > 0) S.save -= dt;
        S.tilt = Math.max(0, S.tilt - dt * 0.55);
        if (S.podT > 0) { S.podT -= dt; if (S.podT <= 0) { S.podT = 0; if (mis().id === 'pod' && !S.mdone) { S.laps = 0; S.mprog = 0; sayNow('POD CRASHED!', 2, true); say('SHOOT THE RAMP TO RESTART', 2); sfx('uhoh'); } } }
      } else if (S.over) physics(dt * 0.0);
      if (fx.warp > 0) fx.warp -= dt;
      fx.flash = Math.max(0, fx.flash - dt * 2); fx.shake = Math.max(0, fx.shake - dt); if (fx.shake === 0) fx.sx = fx.sy = 0;
      for (const b of BUMPERS) if (b.flash > 0) b.flash -= dt;
      for (const s of walls) if (s.flash > 0) s.flash -= dt;
      for (const id in LAMPS) if (LAMPS[id].blink > 0) LAMPS[id].blink -= dt;
      lampsFromState();
      renderDMD(S.paused ? 0 : dt);
      draw();
    });

    // ---------------------------------------------------------------- menus + dialogs
    // online score attack (mp.js): everybody plays the same number of balls at once, live scores in the strip, highest wins
    let race = null, ballsWas = null;
    G.newGame = () => { if (race && race.active) { Desk.toast('Space Jack Pinball', "You're in a score attack! Play it out.", 2500); return; } if (sv) sv.clear(); newGame(); G.focus(); };
    if (window.MP) {
      race = MP.hook('games.pinball', w, {
        start(seed, o, R, preview) { if (ballsWas == null) ballsWas = opts.balls; opts.balls = [3, 5].includes(o && o.balls) ? o.balls : 3; newGame(); if (preview) S.paused = true; G.focus(); },
        stop() { if (ballsWas != null) { opts.balls = ballsWas; ballsWas = null; } },
        ended() { if (ballsWas != null) { opts.balls = ballsWas; ballsWas = null; } },
      });
      G.interval(() => { if (race.active && S && !S.over) race.progress(Math.min(0.99, (S.ball - 1) / Math.max(1, opts.balls)), JG.fmt(S.score)); }, 800);
    }
    function optionsDlg() {
      const d = G.dialog('Options', `<div class="jgopts"><div class="group"><span class="lg">Table</span>${Object.entries(THEMES).map(([k, t]) => `<label><input type="radio" name="th" value="${k}"${opts.theme === k ? ' checked' : ''}> ${t.name}</label>`).join('')}</div>
        <div class="group"><span class="lg">Balls per game</span>${[3, 5].map(n => `<label><input type="radio" name="nb" value="${n}"${opts.balls === n ? ' checked' : ''}> ${n} balls</label>`).join('')}</div></div>
        <label><input type="checkbox" name="mu"${opts.music ? ' checked' : ''}> Music (needs Sound on)</label><label><input type="checkbox" name="sv"${opts.save ? ' checked' : ''}> Ball saver at the start of each ball</label>`,
      [['OK', f => { const th = f.querySelector('input[name=th]:checked').value; const nb = +f.querySelector('input[name=nb]:checked').value; const ch = th !== opts.theme; opts.theme = th; opts.balls = nb; opts.music = f.querySelector('[name=mu]').checked; opts.save = f.querySelector('[name=sv]').checked; saveOpts(); if (ch) L.dirty = true; G.music(opts.music && S && !S.over && !S.paused ? 'jg_pinball' : ''); }], ['Cancel']], { w: 330 });
      return d;
    }
    function controlsDlg() {
      G.msg('Player Controls', 'Left flipper:  Z  (or Left Shift / Left arrow)\nRight flipper:  /  (or Right Shift / Right arrow)\nPlunger:  hold Space, let go to launch\nNudge left / right / up:  X  /  .  /  Up arrow\nPause:  F3      Full screen:  F4      New game:  F2\n\nWith the mouse: click the left or right half of the table for the flippers. Click and hold the right half to pull the plunger.', 'info');
    }
    G.helpKey = () => help();
    function help() {
      G.help([
        ['Welcome', 'Space Jack Pinball puts you in the pilot seat as a very small space cadet with a very big ball.\n\nScore points by hitting bumpers, targets, ramps and orbits. Finish missions to rank up, and shoot the WARP hole to cash them in.'],
        ['Controls', '- Z: left flipper\n- / (slash): right flipper\n- Space: hold to pull the plunger back, let go to launch\n- X, full stop and Up arrow: nudge the table\n- F2 new game, F3 pause, F4 full screen\n\nWith the mouse, click the left or right side of the table for the flippers, and click and hold the right side to launch the ball.'],
        ['Missions', '- ALIEN HUNT: knock down the three alien drop targets\n- POD RACE: shoot the pod ramp three times before the timer runs out\n- ASTEROID FIELD: hit the pop bumpers 20 times (lights EXTRA BALL)\n- SPACE BATTLE: hit all four saucer fighter targets\n- HYPERSPACE: shoot the left AND right orbits\n\nWhen a mission is complete the WARP hole flashes. Shoot it to rank up and start the next mission. Complete Hyperspace for a very big bonus.'],
        ['Lanes & Multiball', 'Roll through the four J-A-C-K lanes at the top to light them. The flippers move the lit lanes along, so you can line up the dark ones.\n\nLight all four to raise the bonus multiplier. Do it twice for JACK ROCKET MULTIBALL.\n\nA lane that flashes while the ball is in the plunger is the SKILL SHOT.'],
        ['Tilt', 'You can nudge the table to save a ball. Nudge too much and the machine TILTS: the flippers go dead and you lose your bonus. The DANGER warning is your only warning.'],
        ['Ranks', RANKS.join(', ') + '.\n\nNobody has ever made Space Admiral. Well, Jack has. Once. Dave was not there to see it.'],
      ]);
    }
    G.menu([
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: G.newGame },
        ...(window.MP ? [MP.menuItem('race.pinball', { balls: opts.balls })] : []),
        { label: 'Launch Ball', key: 'Space', dis: !S || S.state !== 'plunger', act: () => { pulling = true; pull = 0.85; plunger(false); } },
        { label: S && S.paused ? 'Resume Game' : 'Pause/Resume Game', key: 'F3', dis: !S || S.over, act: () => pause() }, '-',
        { label: 'High Scores...', act: () => scores.show() },
        { label: 'Demo', dis: true }, '-',
        { label: 'Exit', act: () => w.close() },
      ]],
      ['Options', () => [
        { label: 'Full Screen', key: 'F4', chk: w.el.classList.contains('maxwin'), act: () => { w.el.classList.toggle('maxwin'); window.dispatchEvent(new Event('resize')); } },
        { label: 'Music', chk: opts.music, act: () => { opts.music = !opts.music; saveOpts(); G.music(opts.music && S && !S.over ? 'jg_pinball' : ''); if (opts.music && !(window.Sound && Sound.on)) Desk.toast('Space Jack Pinball', 'Turn the sound on (the speaker in the system tray) to hear the music.'); } },
        { label: 'Table', sub: Object.entries(THEMES).map(([k, t]) => ({ label: t.name, rad: opts.theme === k, act: () => { opts.theme = k; saveOpts(); L.dirty = true; } })) },
        { label: 'Options...', act: optionsDlg },
        { label: 'Player Controls...', act: controlsDlg },
      ]],
      ['Help', () => [
        { label: 'Help Topics', key: 'F1', act: help }, '-',
        { label: 'About Space Jack Pinball', act: () => G.about({ ver: 'Version 1.02 (Table: ' + (THEMES[opts.theme] || THEMES.space).name + ')', blurb: 'A full-tilt pinball table for JackOS 98. Real ball physics! Three flippers! (Two flippers.)', credits: [['Table design', 'Jack'], ['Programming', 'Jack'], ['Ball physics', 'Jack + a physics book'], ['Pod ramp idea', 'Dave'], ['Music', Cast.t('Cousin {cousin} (keyboard demo button)')], ['Space cadet', 'Gubbinz (in a helmet)'], ['Ball testing', 'Gubbinz (ate 3 balls)'], ['Space consultant', 'Jack\'s poster of the planets'], ['Tea', 'Mom'], ['No thanks to', 'The dog, for the power cable'], ['Special thanks', 'Everyone at JACK ATTACK! Online']] }) },
      ]],
    ]);

    // ---------------------------------------------------------------- automated test harness: fires balls with random plunger
    // strengths and flipper timing for N simulated seconds, and reports any spot where a ball stays slow or escapes the table.
    G.simRun = o => {
      o = Object.assign({ seconds: 300, seed: 1, search: false, nudge: true }, o || {});
      const rnd = JG.rng(o.seed), savedRandom = Math.random, savedSecret = G.secret; Math.random = rnd; G.secret = () => {};
      muted = true; newGame(); S.sim = true; S.simDrains = 0; S.noSearch = !o.search; msgs.length = 0;
      const rep = { seconds: o.seconds, launches: 0, drains: 0, stuck: [], escapes: [], nan: 0, searches: 0, ejects: 0, maxSpeed: 0 };
      const hold = [0, 0], slow = new Map();
      const dt = 1 / 60;
      try {
        for (let t = 0; t < o.seconds; t += dt) {
          // autopilot: plunge, then flip when a ball comes near a flipper (with random timing)
          const waiting = balls.find(b => b.mode === 'table' && b.x > 376 && b.y > PLY - R - 6 && Math.hypot(b.vx, b.vy) < 5);
          if (waiting && !pulling) { pulling = true; S.simPull = 0.15 + rnd() * 0.85; }
          if (pulling && pull >= (S.simPull || 1)) { plunger(false); rep.launches++; }
          for (const side of [0, 1]) {
            if (hold[side] > 0) { hold[side] -= dt; if (hold[side] <= 0) flip(side, false); continue; }
            const near = balls.some(b => b.mode === 'table' && b.y > 630 && b.y < 735 && (side ? b.x > CX : b.x < CX));
            if ((near && rnd() < 0.12) || rnd() < 0.004) { flip(side, true); hold[side] = 0.08 + rnd() * 0.35; }
          }
          if (o.nudge && rnd() < 0.003) nudge(rnd() < 0.5 ? 1 : -1, rnd() < 0.3 ? -0.6 : 0);
          if (pulling) pull = Math.min(1, pull + dt * 1.1);
          if (S.tilted) { S.tilted = false; S.tilt = 0; }
          physics(dt);
          S.state = 'play';
          for (const b of balls) {
            const sp = Math.hypot(b.vx, b.vy);
            if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(sp)) { rep.nan++; continue; }
            rep.maxSpeed = Math.max(rep.maxSpeed, sp);
            if (b.x < -2 || b.x > TW + 2 || b.y < -30) { rep.escapes.push([Math.round(b.x), Math.round(b.y), +t.toFixed(1)]); b.mode = 'gone'; }
            const legit = b.mode !== 'table' || (b.x > 376 && b.y > PLY - 40) || onRaisedFlipper(b);
            let a = slow.get(b);
            if (legit || !a || Math.abs(b.x - a.x) + Math.abs(b.y - a.y) > 12) slow.set(b, a = { x: b.x, y: b.y, t: 0 });
            else { a.t += dt; if (a.t >= 2 && !a.hit) { a.hit = 1; rep.stuck.push([Math.round(b.x), Math.round(b.y), +t.toFixed(1)]); b.mode = 'gone'; } }
          }
        }
      } finally { Math.random = savedRandom; G.secret = savedSecret; muted = false; }
      rep.balls = rep.launches; rep.drains = S.simDrains; rep.searches = S.searches || 0; rep.ejects = S.ejects || 0; rep.score = S.score;
      newGame();
      return rep;
    };
    // ---------------------------------------------------------------- saved game (js/gamesave.js): a refresh or a closed window
    // carries on where you were: score, ball number, missions, lanes, targets... The ball you were on starts again at the
    // plunger, paused. Score attacks (online) are never saved.
    const sv = G.saver(() => {
      if (!S || S.sim) return undefined;
      if (race && race.active) S._mp = true;
      if (S._mp) return undefined;
      if (S.over) return null;
      return { nb: opts.balls, S: Object.assign({}, S, { paused: true, pulling: false, plunge: 0 }) };
    }, { v: 1, live: true, every: 5000 });
    function resumeSaved(d) {
      if (!d || !d.S || d.S.over || d.S._mp) return false;
      try {
        if ([3, 5].includes(d.nb)) opts.balls = d.nb;
        S = Object.assign({}, d.S, { paused: true, pulling: false, plunge: 0, launched: false, sim: false, cheat: '', konami: [] });
        if (S.state === 'bonus') { // it drained just before: the next ball, like the bonus count would have done
          S.tilted = false; S.tilt = 0; S.bonus = 0; S.mult = 1; S.lanes = [0, 0, 0, 0];
          if (S.extraBalls > 0) { S.extraBalls--; S.again = 0; } else if (S.ball >= opts.balls) return false; else S.ball++;
        }
        DROPS.forEach(dd => { dd.seg.dead = !!S.drops && S.drops[dd.seg.idx] === 0; });
        balls = []; serve();
        msgs.length = 0; say('WELCOME BACK!', 2, true); say('BALL ' + S.ball + ' - ' + JG.fmt(S.score), 2.4); say('PRESS ANY KEY TO CARRY ON', 60);
        lampsFromState();
        return true;
      } catch (e) { return false; }
    }
    G.dbgBalls = () => balls; G.dbgDebug = v => { debugOn = v; }; G.dbgPhysics = dt => physics(dt); G.dbgS = () => S;
    G.dbg = () => ({ score: S.score, ball: S.ball, state: S.state, balls: balls.map(b => [b.x | 0, b.y | 0, b.mode]), paused: S.paused, over: S.over, extra: S.extraBalls, mission: S.mission, tilt: S.tilt });
    if (!resumeSaved(sv && sv.load())) { if (sv) sv.clear(); newGame(); }
  });
})();

/* pcgames-jaquake: JAQUAKE (JAQUAKE.EXE), a rusty gothic-industrial first-person shooter, shareware episode 1:
 * "The Rusty Dimension" (3 maps). Tin robots, slime blobs, a few grots and squigs, and the Giga-Blob all go POOF into
 * smoke and stars. Drop-down console with the ` key, Quake-style status bar with a face that gets crosser, keys, doors,
 * lifts, secrets, rocket-jumping.
 * Written from scratch for jacklm.com (no id Software code, maps, art or sounds; this is a parody). */
(function () {
  'use strict';
  const E = PCG.engine, T = E.T, Grid = E.Grid, font = E.font, sfx = E.sfx, clamp = E.clamp;
  const VERSION = '1.06';
  const ROWS = {
    e1m1: [
      "####################################",
      "####################################",
      "##......m.###a;b,,,,,,,,,,,uuuuc####",
      "##.......t###;$;,o,,,,,,,,ouguuu####",
      "##t.......####?#,,,,,,,,,,,uuuuu####",
      "##...P....;;D;;;,,,%%,,,%%,uuuTu####",
      "##........;;D;;;,,,%%,,,%%,uuuuu####",
      "##t.......######,,,,,,,,,,,uuuuu####",
      "##.h....ct######,,,,,,q,,,,uuguu####",
      "##........######t,,,,,,,%%,uuuuu####",
      "##############$r,,,%%,,,%%,uuunu####",
      "##############RFEC,%%,,,,,,uuuuu####",
      "################,,,,,,h,,,,uguuu####",
      "################,q,,,123456uuuut####",
      "################,,,,,123456uuuuu####",
      "################,,,,,,,,,,,uuuuu####",
      "##################DD################",
      "##################ii################",
      "##################jj################",
      "##################ee################",
      "##eeeeee#####eeeeeee##eeeeeeeene####",
      "##eeeege#####egeeeee##eeqeeqeoee####",
      "##teeeee#####eeUeeeeeeeeeeeeeeee####",
      "##eeeeee#####ssssssssseessssssss####",
      "##eXXeee#####ssssssssseessssssss####",
      "##eXXeem#####eeeqeeeeeeeeeeeeeee####",
      "##eeeeeeeeeeYeeeeeeeeeceee##vvvv####",
      "##eeeeeeeeeeYeee##eeeeeeee##vhvv####",
      "##teeeee#####eee##eeeeeeeeeLvvkv####",
      "##eeehge#####eeoeeeeeeeeegeevvvv####",
      "##eeeeee#####eeeeeeeeeeeeeeevvvv####",
      "####################################",
    ],
    e1m2: [
      "########################################",
      "########################################",
      "####,,,,o,,,,,,,,,######################",
      "####,Kg,,,,,,q,,,,#######uuuuuuuuruuuuu#",
      "####,,%%,,%%,,,12345uuuuYukuuuguuuuuuhu#",
      "#.t#,,%%,,%%,,,12345uuuuYuuuuuuuuuuuuuu#",
      "#X.Zc,,,,,,,,,,,,,##################uuu#",
      "#X.Z,,,,,G,,,,,,,,##################guu#",
      "#..#,,%%,,%%,,h,,,##################uuu#",
      "####,,%%,,%%,,,,,,##################uuu#",
      "####q,,,,,,,g,n,,,##################ugu#",
      "####,,,,o,,,,,,,,,#%H%##############uuu#",
      "###################z$N##############uuu#",
      "####################y###############uuu#",
      "##wwwwwwwwwwwwwwwwwwwwww############tut#",
      "##wwwwwwwwwwwwwwwwwwwwww############uuu#",
      "##ww********************############uuu#",
      "##ww*******g****44g44a**#%%%%%%%%%%%%L##",
      "##ww**q***J*****444444**#.o...........##",
      "##ww*****m**%%**22******#....##...##g.##",
      "##ww********%%**********D.............##",
      "##ww***%%***********g***D...m..T.g..on##",
      "##ww***%%*********%%****#.............##",
      "##ww***********q**%%****#....##...##..##",
      "##ww******q*************#..q........g.##",
      "##ww**********h*******c*#%%%%%%?%%%%%%##",
      "##ww********************######.$r#######",
      "#####DD#######################A.r#######",
      "##........##############################",
      "##t...m..t##############################",
      "##........##############################",
      "##...P....##############################",
      "##.n....c.##############################",
      "##........##############################",
      "########################################",
      "########################################",
    ],
    e1m3: [
      "##################################",
      "################.XX.##############",
      "################....##############",
      "#################QQ###############",
      "##c*************m**************a##",
      "##*%%*****q******22******q***%%*##",
      "##*%%************22**********%%*##",
      "##*******llllllll44llllllll*****##",
      "##*h*****llllllll44llllllll***h*##",
      "##p******llll4444444444llll****p##",
      "##**2222244444%%4444444444422222##",
      "##**2222244444444444444444422222##",
      "##*******llll4444B44444llll*****##",
      "##*******llll4444444%%4llll*****##",
      "##*r*****llll4444444444llll***n*##",
      "##*******llllllll44llllllll*****##",
      "##*%%****llllllll44llllllll**%%*##",
      "##*%%*****q******22******q***%%*##",
      "##O**************22************p##",
      "####DD############################",
      "####;;#;;#########################",
      "####;;?$W#########################",
      "####;;#;;#########################",
      "####;;############################",
      "##...m..##########################",
      "##t...Vt##########################",
      "##..P...##########################",
      "##.c..h.##########################",
      "##......##########################",
      "##################################",
      "##################################",
    ],
  };
  const BLURB = { e1m1: 'Something has gone very wrong at the Rusty Slipgate. Find the exit slipgate. Mind the slime.', e1m2: 'Tin robots have moved into Jackstone Keep. Two keys, one moat, one lift and a lot of clanking.', e1m3: 'Something VERY big and VERY wobbly is snoring at the bottom of the Blob Pit.' };
  const TIPS = ['Rocket jump: look down, jump and fire Rocket Jack at the same time.', 'Shoot walls that look a bit different. Some of them move.', 'Water is safe. Slime is not. Lava is REALLY not.', 'The Boomstick fires seven pellets: get close for the full POOF.', 'Robots clank. Imps giggle. Blobs go "blorp". Listen out!', 'Press ` to open the console. Type help. (Not that one, the other one.)', 'Lost? The exit is usually behind the biggest door.', 'Options > Customize controls lets you move the keys about.', 'Try MULTIPLAYER on the main menu: deathmatch and co-op on JackNet.', 'Baddies wave their arms about before they shoot. That is your cue to side-step.', 'Hold SPACE to keep hopping. Hop and turn at the same time to go faster.', 'Hold TAB to see how many monsters and secrets are left.', 'Never, ever use the Zapper in the bath.', 'If one baddie hits another by mistake, they fall out. Let them.', 'Grenades bounce. Rockets do not. Pick the right one for corners.'];
  const MAPS = {
    e1m1: { title: 'The Rusty Slipgate', look: { wall: 'jqplate', pillar: 'jqpillar', metal: 'jqtech', floor: 'jqflag' }, next: 'e1m2', amb: [0.3, 0.26, 0.22], dc: 8, uc: 8, base: { '14,10': 'F', '15,10': 'F', '14,11': 'F' },
      msgs: ['Welcome to JAQUAKE! WASD to move, mouse to look, click to shoot.|SPACE jumps (hold it to keep hopping). 1-8 picks a gun. TAB shows the score.', 'The slipgate is in here.|Step into it to leave this rusty dump.'] },
    e1m2: { title: 'Jackstone Keep', look: { wall: 'jqblock', pillar: 'rune', floor: 'jqflag' }, swap: { grot: 'robot', squig: 'blob', biggrot: 'bigrobot' }, next: 'e1m3', amb: [0.28, 0.26, 0.24], dc: 8, uc: 6, base: { '20,11': 'x', '21,12': 'z' },
      msgs: ['Jackstone Keep. Tin robots have moved in.|They did not ask first.', 'The moat looks deep.|Something glints down there...', 'The lift is in the far corner.|Stand on it and it goes up.'] },
    e1m3: { title: 'The Blob Pit', look: { pillar: 'jqpillar', metal: 'jqtech' }, swap: { squig: 'blob' }, next: null, amb: [0.3, 0.22, 0.18], dc: 4, uc: 6, boss: true, base: { '17,3': '.', '18,3': '.' },
      msgs: ['The Blob Pit.|Something VERY big and VERY wobbly is snoring in there.', 'The exit is sealed shut.|It opens when the big one goes POOF.'] },
  };
  // the legend (cells); entity and door letters sit on whatever floor is around them
  function legend(md) {
    const L = {
      '#': { s: 1, wt: 'brick' }, '%': { s: 1, wt: 'metal' }, '&': { s: 1, wt: 'rune' },
      '.': { f: 0, c: 4, ft: 'floor', ct: 'ceil' }, ';': { f: 0, c: 3, ft: 'floor', ct: 'ceil', wt: 'brick2' }, ',': { f: 0, c: md.dc, ft: 'floor', ct: 'ceil' },
      '*': { f: 0, c: 9, sky: true, ft: 'floor' }, u: { f: 3, c: md.uc, ft: 'rust', st: 'metal' },
      e: { f: -1.5, c: 3, ft: 'rust', ct: 'ceil', wt: 'brick2' }, i: { f: -0.5, c: 3, ft: 'rust' }, j: { f: -1, c: 3, ft: 'rust' }, v: { f: 1.5, c: 4, ft: 'metal', st: 'rust' },
      s: { f: -1.5, c: 3, liq: 'slime', depth: 1 }, l: { f: 0, c: 10, sky: true, liq: 'lava', depth: 1 }, w: { f: 0, c: 9, sky: true, liq: 'water', depth: 2.2 },
      y: { f: 0, c: -0.2, liq: 'water', depth: 2.2, ft: 'rust' }, z: { f: 0, c: 2.5, liq: 'water', depth: 2.2, ct: 'rune' }, x: { f: 0.25, c: 2.5, ft: 'rune' },
      C: { f: 1, c: md.dc, ft: 'crate', st: 'crate' }, E: { f: 2, c: md.dc, ft: 'crate', st: 'crate' }, F: { f: 3, c: 5.5, ft: 'rune', ct: 'rune', wt: 'rune' },
    };
    for (let d = 1; d <= 9; d++) L[d] = { f: d * 0.5, c: Math.max(md.dc, d * 0.5 + 3), ft: 'floor', st: 'brick2' };
    if (md.boss) { L[4] = { f: 2, c: 10, sky: true, ft: 'rune', st: 'rune' }; L[2] = { f: 1, c: 10, sky: true, ft: 'rune', st: 'rune' }; L['*'].c = 10; L['*'].ft = 'rust'; }
    return L;
  }
  const ENT = { P: 'start', t: 'torch', o: 'lamp', m: 'msg', $: 'secret', g: 'grot', G: 'biggrot', q: 'squig', B: 'boss', h: 'health', H: 'mega', a: 'armour1', A: 'armour2', c: 'shells', n: 'teef', r: 'rokkits', k: 'silverkey', K: 'goldkey', T: 'teefgun', R: 'launcher', W: 'waaagh', b: 'boom2', N: 'srivet', J: 'grenade', V: 'zapper', p: 'cells', O: 'star', U: 'wellies' };
  const DYN = { D: 'door', Y: 'silver', Z: 'gold', Q: 'bossdoor', '?': 'secretdoor', L: 'lift', X: 'exit' };
  // turn the painted rows into plain cells + an entity list
  function prep(id) {
    const md = MAPS[id], rows = ROWS[id].map(r => [...r]), L = legend(md), ents = [], dyns = [];
    const H = rows.length, W = rows[0].length, special = ch => ENT[ch] || DYN[ch];
    const floorish = ch => ch && !special(ch) && L[ch] && !L[ch].s;
    const orig = rows.map(r => r.slice());
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const ch = orig[j][i]; if (!special(ch)) continue;
      let base = md.base && md.base[i + ',' + j];
      if (!base) {
        const count = {}, look = (di, dj) => { const r = orig[j + dj]; const c = r && r[i + di]; if (floorish(c)) count[c] = (count[c] || 0) + 1; };
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => look(a, b));
        if (!Object.keys(count).length) [[1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].forEach(([a, b]) => look(a, b));
        const ks = Object.keys(count);
        if (DYN[ch] === 'lift') base = ks.sort((a, b) => L[a].f - L[b].f)[0];
        else base = ks.sort((a, b) => count[b] - count[a])[0];
      }
      rows[j][i] = base || '.';
      if (ENT[ch]) ents.push({ e: ENT[ch], i, j }); else dyns.push({ k: DYN[ch], i, j, ch });
    }
    const M = Grid.parse({ rows: rows.map(r => r.join('')), legend: L });
    // dress the walls: the map's own wall texture, an iron pillar every few cells along every run, tech panels for metal
    const lk = md.look || {};
    for (const c of M.cells) {
      if (!c.s) continue;
      if (c.wt === 'brick' && lk.wall) c.wt = lk.wall;
      if (c.wt === 'metal' && lk.metal) c.wt = lk.metal;
      if (lk.pillar && (c.ch === '#') && (c.i + c.j) % 4 === 0) c.wt = lk.pillar;
    }
    if (lk.floor) for (const c of M.cells) if (!c.s && c.ft === 'floor' && c.ch !== '.') c.ft = lk.floor;
    ents.forEach(e => { const c = M.cell(e.i, e.j); e.x = (e.i + 0.5) * M.S; e.z = (e.j + 0.5) * M.S; e.y = c.f; e.c = c; });
    dyns.forEach(d => { d.c = M.cell(d.i, d.j); });
    return { M, ents, dyns, md };
  }

  // the arsenal, keys 1-8 like the real thing: rate = seconds between shots, use = ammo per shot, dmg per pellet/rivet/zap
  // (pcgames-arena.js has the JackNet deathmatch copy of the first four: keep their rates in step)
  const WEAP = [
    { n: 'Jackhammer', s: 'JH', ammo: null, rate: 0.32, dmg: 25 },
    { n: 'Boomstick', s: 'BS', ammo: 'shells', rate: 0.4, dmg: 5, pel: 7, sx: 0.09, sy: 0.06 },
    { n: 'Double Boomstick', s: 'DB', ammo: 'shells', use: 2, rate: 0.62, dmg: 5, pel: 14, sx: 0.16, sy: 0.08 },
    { n: 'Rivet Gun', s: 'RG', ammo: 'teef', rate: 0.08, dmg: 9 },
    { n: 'Super Rivet Gun', s: 'SR', ammo: 'teef', use: 2, rate: 0.08, dmg: 18 },
    { n: 'Grenade Jack', s: 'GJ', ammo: 'rokkits', rate: 0.5, dmg: 100 },
    { n: 'Rocket Jack', s: 'RJ', ammo: 'rokkits', rate: 0.6, dmg: 100 },
    { n: 'Zapper', s: 'ZP', ammo: 'cells', rate: 0.1, dmg: 20 },
  ];
  const NWEAP = WEAP.length, SWAP = 0.12; // weapon switch: down and up again in an eighth of a second
  const AMMO = { shells: 100, teef: 200, rokkits: 50, cells: 100 }; // how much you can carry
  const SKILL = ['EASY', 'NORMAL', 'HARD', 'NIGHTMARE'];
  // how the baddies play at each skill. NORMAL (the default) is meant for somebody who has never played one of these before.
  //  react: from first spotting you to their first shot  wind: the tell (arm up, a beep) before each shot  cool: x time between
  //  attacks  turn: how fast they can turn (no instant about-turns)  err: aim wobble (radians, grows with range and strafing)
  //  lead: aim ahead of you  slots: how many may be shooting at you at once  pspd: x bolt speed  dmg: x damage to you
  //  move: x running speed  pain: chance a hit interrupts their shot  hp: x the Giga-Blob's health
  const AI = { react: [1.5, 1.05, 0.65, 0.35], wind: [0.65, 0.5, 0.34, 0.22], cool: [1.7, 1.35, 1.0, 0.75], turn: [2.0, 3.0, 4.6, 7.0], err: [0.16, 0.11, 0.065, 0.035],
    lead: [0, 0, 0.45, 0.85], slots: [1, 2, 3, 8], pspd: [0.72, 0.82, 1, 1.15], dmg: [0.45, 0.65, 1, 1.25], move: [0.8, 0.9, 1.05, 1.2], pain: [0.85, 0.65, 0.4, 0.15], hp: [0.7, 0.85, 1.15, 1.4] };
  const MON = {
    grot: { hp: 30, r: 0.35, h: 1.25, speed: 3.6, range: 24, dmg: 6, cool: 1.6, kind: 'shoot', bolt: 'fire', name: 'an imp' },
    biggrot: { hp: 220, r: 0.6, h: 2.3, speed: 2.6, range: 26, dmg: 30, cool: 2.4, kind: 'rokkit', name: 'a Big Imp' },
    robot: { hp: 40, r: 0.4, h: 1.5, speed: 3.2, range: 26, dmg: 7, cool: 1.8, kind: 'shoot', bolt: 'laser', name: 'a tin robot' },
    bigrobot: { hp: 240, r: 0.6, h: 2.6, speed: 2.4, range: 26, dmg: 30, cool: 2.4, kind: 'rokkit', name: 'a Big Robot' },
    blob: { hp: 45, r: 0.45, h: 0.9, speed: 5.6, range: 1.7, dmg: 9, cool: 0.9, kind: 'bite', name: 'a slime blob' },
    squig: { hp: 40, r: 0.45, h: 0.95, speed: 6.2, range: 1.7, dmg: 9, cool: 0.9, kind: 'bite', name: 'a chomper' },
    boss: { hp: 1600, r: 1.9, h: 4.2, speed: 1.6, range: 40, dmg: 22, cool: 2.2, kind: 'boss', name: 'the Giga-Blob' },
  };

  // ================================================================ JAQUAKE's own wall textures (drawn here, added to the engine's set by name)
  // riveted plates, iron pillars, tech panels with light strips, big stone blocks, flagstones: the 1996 look, all procedural
  (function () {
    const C = (r, g, b) => `rgb(${r | 0},${g | 0},${b | 0})`, sh = (c, k) => c.map(v => Math.max(0, Math.min(255, v * k)));
    const noise = (r, n) => { const g = []; for (let i = 0; i < n * n; i++) g.push(r()); return (x, y) => { x = ((x % n) + n) % n; y = ((y % n) + n) % n; const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, a = g[yi * n + xi], b = g[yi * n + (xi + 1) % n], c = g[((yi + 1) % n) * n + xi], d = g[((yi + 1) % n) * n + (xi + 1) % n], sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; }; };
    const fbm = (r, S) => { const a = noise(r, 4), b = noise(r, 8), c = noise(r, 16); return (x, y) => a(x / S * 4, y / S * 4) * 0.55 + b(x / S * 8, y / S * 8) * 0.3 + c(x / S * 16, y / S * 16) * 0.15; };
    const field = (x, S, fn) => { const img = x.getImageData(0, 0, S, S), d = img.data; for (let y = 0; y < S; y++) for (let i = 0; i < S; i++) { const k = (y * S + i) * 4, c = fn(i, y, [d[k], d[k + 1], d[k + 2]]); if (c) { d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255; } } x.putImageData(img, 0, 0); };
    const bev = (x, a, b, w, h, c, k1, k2) => { x.fillStyle = C(...c); x.fillRect(a, b, w, h); x.fillStyle = C(...sh(c, k1 || 1.3)); x.fillRect(a, b, w, 1); x.fillRect(a, b, 1, h); x.fillStyle = C(...sh(c, k2 || 0.55)); x.fillRect(a, b + h - 1, w, 1); x.fillRect(a + w - 1, b, 1, h); };
    const rivet = (x, a, b, c) => { x.fillStyle = C(...sh(c, 1.5)); x.fillRect(a, b, 2, 2); x.fillStyle = C(...sh(c, 0.4)); x.fillRect(a + 1, b + 1, 2, 2); x.fillStyle = C(...c); x.fillRect(a + 1, b + 1, 1, 1); };
    const drips = (x, S, r, n, c) => { for (let k = 0; k < n; k++) { const a = r() * S | 0, b = r() * S | 0, l = 3 + r() * 12 | 0; x.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.2 + r() * 0.3})`; x.fillRect(a, b, 1, l); } };
    const T = E.TEX;
    // riveted metal plates, two to a texture, rust running down from the rivets
    T.jqplate = (x, S, r) => { const n = fbm(r, S); for (let j = 0; j < 2; j++) bev(x, 0, j * 32, S, 32, sh([98, 82, 64], 0.9 + r() * 0.2), 1.35, 0.5); field(x, S, (i, j, c) => sh(c, 0.72 + n(i, j) * 0.5)); for (let j = 0; j < 2; j++) for (let k = 0; k < 8; k++) { rivet(x, 3 + k * 8, j * 32 + 3, [150, 118, 82]); rivet(x, 3 + k * 8, j * 32 + 27, [150, 118, 82]); } drips(x, S, r, 22, [120, 50, 12]); };
    // an iron pillar with brass bands (put every few cells along a wall: it gives the rooms a rhythm)
    T.jqpillar = (x, S, r) => { x.fillStyle = C(46, 40, 34); x.fillRect(0, 0, S, S); for (let i = 8; i < S - 8; i++) { const k = 0.45 + Math.sin((i - 8) / (S - 16) * Math.PI) * 0.75; x.fillStyle = C(...sh([108, 96, 84], k)); x.fillRect(i, 0, 1, S); } x.fillStyle = C(30, 26, 22); x.fillRect(20, 0, 1, S); x.fillRect(43, 0, 1, S); for (const y of [2, 30, 58]) { bev(x, 6, y, S - 12, 5, [170, 128, 48], 1.4, 0.45); } const n = fbm(r, S); field(x, S, (i, j, c) => sh(c, 0.8 + n(i, j) * 0.35)); drips(x, S, r, 8, [110, 46, 10]); };
    // a dark tech panel with a strip light and a vent (the slipgate base)
    T.jqtech = (x, S, r) => { bev(x, 0, 0, S, S, [72, 70, 66], 1.3, 0.5); bev(x, 4, 4, S - 8, 18, [56, 56, 54], 0.6, 1.4); x.fillStyle = C(255, 226, 150); x.fillRect(6, 10, S - 12, 5); x.fillStyle = C(255, 250, 220); x.fillRect(6, 11, S - 12, 2); for (let k = 0; k < 6; k++) { x.fillStyle = C(34, 34, 32); x.fillRect(10, 34 + k * 4, S - 20, 2); } bev(x, 4, S - 10, S - 8, 6, [120, 92, 40], 1.4, 0.5); for (const a of [6, S - 9]) rivet(x, a, 26, [140, 140, 136]); const n = fbm(r, S); field(x, S, (i, j, c) => sh(c, 0.82 + n(i, j) * 0.3)); };
    // big stone blocks, chipped, in rows of different lengths (the castle)
    T.jqblock = (x, S, r) => { x.fillStyle = C(36, 32, 28); x.fillRect(0, 0, S, S); for (let y = 0; y < S; y += 16) { let a = -(r() * 16 | 0); while (a < S) { const w = 16 + (r() * 3 | 0) * 8, c = sh([118, 108, 92], 0.78 + r() * 0.36); bev(x, a + 1, y + 1, w - 1, 15, c, 1.25, 0.6); if (a + w > S) bev(x, a + 1 - S, y + 1, w - 1, 15, c, 1.25, 0.6); a += w; } } const n = fbm(r, S); field(x, S, (i, j, c) => sh(c, 0.74 + n(i, j) * 0.5)); for (let k = 0; k < 14; k++) { x.fillStyle = C(46, 40, 34); x.fillRect(r() * S | 0, r() * S | 0, 2, 1); } };
    // flagstones for the floors
    T.jqflag = (x, S, r) => { x.fillStyle = C(30, 28, 24); x.fillRect(0, 0, S, S); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const o = j ? 16 : 0, c = sh([100, 92, 80], 0.8 + r() * 0.3); bev(x, i * 32 + o + 1, j * 32 + 1, 31, 31, c, 1.2, 0.6); if (i * 32 + o + 32 > S) bev(x, i * 32 + o + 1 - S, j * 32 + 1, 31, 31, c, 1.2, 0.6); } const n = fbm(r, S); field(x, S, (i, j, c) => sh(c, 0.7 + n(i, j) * 0.55)); };
  })();

  // ================================================================ art: view models, monsters, pickups, the status bar and Jack's face
  // ---------------------------------------------------------------- view models (the gun in your hands)
  // jqVM(ctx) gives the four JackNet deathmatch guns (Jackhammer, Boomstick, Rivet Gun, Rocket Jack: pcgames-jrt.js uses them);
  // jqVM(ctx, true) gives all eight, in key order 1-8. They sit in the middle at the bottom of the screen, like they did then.
  const ONLINE_W = [0, 1, 3, 6];
  const VMTILT = [0.15, 0.2, 0.2, 0.26, 0.26, 0.24, 0.24, 0.26];
  function jqVM(ctx, all) {
    const VM = [], iron = 0x3a3834, steel = 0x5e5c58, wood = 0x5a321a, dark = 0x1e1c1a, brass = 0x8a6a1a, copper = 0x9a5a2a;
    const spinner = (y, z, r, n, len, w, col) => { const L = [['spin', 0.01, 0.01, 0.01, 0, y, z, dark, null, [0, 0, 0]]]; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; L.push(['sb' + k, w, w, len, Math.cos(a) * r, Math.sin(a) * r, 0, k % 2 ? steel : 0x7a7872, 'spin']); } return L; };
    const B = [
      // 1 Jackhammer: a pneumatic hammer with brass bands and a chisel
      () => [['h', 0.08, 0.08, 0.42, 0, -0.02, 0.1, 0x6a3a1a], ['body', 0.16, 0.16, 0.26, 0, 0.02, -0.19, 0x5a5650], ['b1', 0.17, 0.035, 0.17, 0, 0.02, -0.1, 0x9a7020], ['b2', 0.17, 0.035, 0.17, 0, 0.02, -0.27, 0x9a7020], ['ch', 0.06, 0.06, 0.2, 0, 0.02, -0.41, 0x8a8a90], ['tip', 0.035, 0.035, 0.05, 0, 0.02, -0.53, 0xb0b0b8], ['trig', 0.03, 0.05, 0.04, 0, -0.07, 0.02, dark], ['hose', 0.04, 0.04, 0.2, 0.06, -0.05, 0.22, 0x2a2a2a]],
      // 2 Boomstick: one fat barrel over a pump, a wooden stock, a brass bead to aim with
      () => [['stock', 0.11, 0.13, 0.3, 0, -0.06, 0.17, wood], ['rec', 0.13, 0.12, 0.2, 0, -0.005, -0.04, iron], ['bar', 0.075, 0.075, 0.62, 0, 0.035, -0.43, steel], ['tube', 0.055, 0.05, 0.5, 0, -0.035, -0.38, dark], ['pump', 0.1, 0.075, 0.17, 0, -0.04, -0.36, wood], ['band', 0.085, 0.085, 0.03, 0, 0.035, -0.7, iron], ['bead', 0.02, 0.025, 0.02, 0, 0.08, -0.71, brass], ['bore', 0.04, 0.04, 0.01, 0, 0.035, -0.745, 0x000000]],
      // 3 Double Boomstick: two short fat barrels side by side and a brass hinge
      () => [['stock', 0.13, 0.13, 0.28, 0, -0.06, 0.17, wood], ['rec', 0.17, 0.12, 0.16, 0, -0.01, -0.03, iron], ['hinge', 0.18, 0.04, 0.04, 0, -0.03, -0.12, brass], ['b1', 0.075, 0.075, 0.5, -0.04, 0.025, -0.37, steel], ['b2', 0.075, 0.075, 0.5, 0.04, 0.025, -0.37, steel], ['rib', 0.03, 0.02, 0.48, 0, 0.07, -0.36, dark], ['fore', 0.15, 0.06, 0.2, 0, -0.04, -0.26, wood], ['m1', 0.05, 0.05, 0.01, -0.04, 0.025, -0.625, 0x000000], ['m2', 0.05, 0.05, 0.01, 0.04, 0.025, -0.625, 0x000000], ['bead', 0.02, 0.022, 0.02, 0, 0.085, -0.6, brass]],
      // 4 Rivet Gun: a drum of hot rivets and four little barrels that spin
      () => [['body', 0.16, 0.14, 0.36, 0, -0.01, -0.02, 0x4a3a28], ['drum', 0.1, 0.17, 0.17, 0, 0.11, -0.02, 0x5a5a60], ['cap', 0.11, 0.04, 0.18, 0, 0.2, -0.02, iron], ['grip', 0.06, 0.12, 0.08, 0, -0.12, 0.1, dark], ['warn', 0.165, 0.04, 0.1, 0, 0.02, 0.08, 0x9a7a08], ['ring', 0.15, 0.15, 0.04, 0, 0, -0.22, brass]].concat(spinner(0, -0.38, 0.045, 4, 0.3, 0.04)),
      // 5 Super Rivet Gun: a big box, a hopper of rivets on top and a fat spinning cluster
      () => [['body', 0.22, 0.17, 0.4, 0, -0.01, -0.02, 0x3a3a40], ['hop', 0.12, 0.12, 0.2, 0, 0.14, 0.02, 0x6a4a2a], ['riv', 0.08, 0.03, 0.16, 0, 0.215, 0.02, 0xc0c0c8], ['grip', 0.07, 0.13, 0.09, 0, -0.14, 0.12, dark], ['ring', 0.2, 0.2, 0.05, 0, 0, -0.24, brass], ['ring2', 0.19, 0.19, 0.03, 0, 0, -0.5, iron], ['stripe', 0.225, 0.04, 0.1, 0, 0.04, 0.1, 0xb02a1a]].concat(spinner(0, -0.4, 0.065, 6, 0.32, 0.045)),
      // 6 Grenade Jack: a short fat tube with a six-shot drum, painted army green
      () => [['stock', 0.1, 0.12, 0.26, 0, -0.06, 0.18, wood], ['drum', 0.2, 0.2, 0.16, 0, 0, -0.06, 0x3a4a22], ['d1', 0.21, 0.04, 0.17, 0, 0.05, -0.06, dark], ['d2', 0.21, 0.04, 0.17, 0, -0.05, -0.06, dark], ['tube', 0.15, 0.15, 0.36, 0, 0.01, -0.32, 0x4a5a2a], ['lip', 0.17, 0.17, 0.04, 0, 0.01, -0.5, iron], ['bore', 0.1, 0.1, 0.01, 0, 0.01, -0.525, 0x000000], ['sight', 0.03, 0.06, 0.06, 0, 0.11, -0.4, iron], ['grip', 0.06, 0.12, 0.08, 0, -0.13, -0.02, dark]],
      // 7 Rocket Jack: a launcher tube with Jack's face on a sticker and a rocket peeking out
      () => [['tube', 0.18, 0.18, 0.62, 0, 0, -0.15, 0x2e3a1a], ['ring', 0.21, 0.21, 0.06, 0, 0, -0.47, dark], ['rear', 0.2, 0.2, 0.05, 0, 0, 0.15, dark], ['nose', 0.1, 0.1, 0.06, 0, 0, -0.475, 0x8a1c0c], ['grip', 0.06, 0.12, 0.08, 0, -0.14, -0.05, dark], ['sight', 0.04, 0.07, 0.1, 0.08, 0.12, -0.1, iron], ['face', 0.01, 0.1, 0.1, -0.095, 0.01, -0.2, 0xb08040], ['hair', 0.012, 0.03, 0.1, -0.096, 0.055, -0.2, 0x4a2a0a], ['band', 0.19, 0.19, 0.03, 0, 0, -0.32, brass]],
      // 8 Zapper: a coil box with two copper prongs and a glowing blue tip
      () => [['box', 0.2, 0.16, 0.34, 0, -0.02, -0.02, 0x3a3e48], ['coil1', 0.17, 0.17, 0.03, 0, 0.0, -0.22, copper], ['coil2', 0.17, 0.17, 0.03, 0, 0.0, -0.27, copper], ['coil3', 0.17, 0.17, 0.03, 0, 0.0, -0.32, copper], ['core', 0.08, 0.08, 0.2, 0, 0, -0.27, 0x2a2a30], ['p1', 0.03, 0.03, 0.22, -0.05, 0.03, -0.44, copper], ['p2', 0.03, 0.03, 0.22, 0.05, 0.03, -0.44, copper], ['grip', 0.06, 0.12, 0.08, 0, -0.13, 0.08, dark], ['dial', 0.06, 0.04, 0.01, 0.04, 0.06, 0.155, 0x40e0ff]],
    ];
    const want = all ? [0, 1, 2, 3, 4, 5, 6, 7] : ONLINE_W;
    want.forEach((k, i) => {
      const m = E.model(ctx, B[k]());
      // tip the gun up a little so you look along it, not at the back of it (baked in, so the deathmatch client gets it too)
      const tilt = new E.T.Group(); [...m.children].forEach(c => tilt.add(c)); tilt.rotation.x = VMTILT[k]; m.add(tilt);
      if (k === 7) { const glow = E.model(ctx, [['g', 0.07, 0.07, 0.07, 0, 0.03, -0.56, 0x80d8ff], ['g2', 0.04, 0.04, 0.1, 0, 0.03, -0.56, 0xffffff]], { full: 1.4 }); tilt.add(glow); m.parts.glow = glow; }
      m.visible = false; m.scale.setScalar(0.42); ctx.wscene.add(m); VM[all ? k : i] = m;
    });
    return VM;
  }

  // ---------------------------------------------------------------- models for things in the world
  function grotModel(ctx, big) { // imps: little red horned gremlins (the Big Imp is purple with big horns)
    const sk = big ? 0x8a2a9a : 0xd0402a, dk = big ? 0x5a1a6a : 0x902418, horn = 0xf4e8c0, k = big ? 1.8 : 1;
    const m = E.model(ctx, [
      ['body', 0.42 * k, 0.42 * k, 0.28 * k, 0, 0.62 * k, 0, sk], ['belly', 0.26 * k, 0.24 * k, 0.04 * k, 0, 0.6 * k, -0.15 * k, 0xf0a070],
      ['pants', 0.44 * k, 0.12 * k, 0.3 * k, 0, 0.44 * k, 0, 0x2a2030],
      ['ll', 0.13 * k, 0.4 * k, 0.13 * k, -0.11 * k, 0.4 * k, 0, dk, null, [0, -0.2 * k, 0]], ['rl', 0.13 * k, 0.4 * k, 0.13 * k, 0.11 * k, 0.4 * k, 0, dk, null, [0, -0.2 * k, 0]],
      ['la', 0.11 * k, 0.36 * k, 0.11 * k, -0.27 * k, 0.8 * k, 0, sk, null, [0, -0.16 * k, 0]], ['ra', 0.11 * k, 0.36 * k, 0.11 * k, 0.27 * k, 0.8 * k, 0, sk, null, [0, -0.16 * k, -0.08 * k]],
      ['gun', 0.08 * k, 0.1 * k, 0.34 * k, 0, -0.3 * k, -0.15 * k, big ? 0x5a5a6a : 0x404040, 'ra'],
      ['tail', 0.05 * k, 0.05 * k, 0.34 * k, 0, 0.5 * k, 0.28 * k, dk], ['tip', 0.12 * k, 0.12 * k, 0.06 * k, 0, 0.54 * k, 0.46 * k, dk],
      ['head', 0.38 * k, 0.34 * k, 0.36 * k, 0, 1.03 * k, 0, sk], ['ear1', 0.14 * k, 0.1 * k, 0.05 * k, -0.24 * k, 1.06 * k, 0, sk], ['ear2', 0.14 * k, 0.1 * k, 0.05 * k, 0.24 * k, 1.06 * k, 0, sk],
      ['h1', 0.07 * k, (big ? 0.3 : 0.18) * k, 0.07 * k, -0.12 * k, (big ? 1.34 : 1.28) * k, 0, horn], ['h2', 0.07 * k, (big ? 0.3 : 0.18) * k, 0.07 * k, 0.12 * k, (big ? 1.34 : 1.28) * k, 0, horn],
      ['nose', 0.07 * k, 0.07 * k, 0.08 * k, 0, 1.0 * k, -0.2 * k, dk], ['grin', 0.2 * k, 0.04 * k, 0.02 * k, 0, 0.92 * k, -0.19 * k, 0xffffff],
      ['e1', 0.08 * k, 0.06 * k, 0.02 * k, -0.09 * k, 1.1 * k, -0.19 * k, 0xffe040], ['e2', 0.08 * k, 0.06 * k, 0.02 * k, 0.09 * k, 1.1 * k, -0.19 * k, 0xffe040],
    ]);
    return m;
  }
  function robotModel(ctx, big) {
    const k = big ? 1.7 : 1, m = 0x8a9098, d = 0x4a5058;
    return E.model(ctx, [
      ['body', 0.5 * k, 0.5 * k, 0.34 * k, 0, 0.78 * k, 0, m], ['dial', 0.2 * k, 0.14 * k, 0.04 * k, 0, 0.84 * k, -0.18 * k, 0x40e060],
      ['ll', 0.14 * k, 0.5 * k, 0.14 * k, -0.13 * k, 0.5 * k, 0, d, null, [0, -0.24 * k, 0]], ['rl', 0.14 * k, 0.5 * k, 0.14 * k, 0.13 * k, 0.5 * k, 0, d, null, [0, -0.24 * k, 0]],
      ['la', 0.12 * k, 0.44 * k, 0.12 * k, -0.33 * k, 0.96 * k, 0, d, null, [0, -0.2 * k, 0]], ['ra', 0.12 * k, 0.44 * k, 0.12 * k, 0.33 * k, 0.96 * k, 0, d, null, [0, -0.2 * k, -0.08 * k]],
      ['gun', 0.1 * k, 0.1 * k, 0.36 * k, 0, -0.34 * k, -0.15 * k, big ? 0x5a6a3a : 0x30a0e0, 'ra'],
      ['head', 0.36 * k, 0.3 * k, 0.32 * k, 0, 1.2 * k, 0, m], ['eye', 0.28 * k, 0.07 * k, 0.03 * k, 0, 1.22 * k, -0.17 * k, 0xff3010],
      ['ant', 0.03 * k, 0.24 * k, 0.03 * k, 0.1 * k, 1.46 * k, 0, d], ['bulb', 0.07 * k, 0.07 * k, 0.07 * k, 0.1 * k, 1.6 * k, 0, 0xffd040],
    ]);
  }
  function squigModel(ctx, boss, blob) {
    const k = boss ? 4 : 1, col = boss ? 0x40b030 : blob ? 0x5ac840 : 0x6a3ad8, foot = blob || boss ? 0xf08a20 : 0x3a1a8a, eye = blob || boss ? 0xffe060 : 0xffffff;
    const parts = [
      ['body', 0.9 * k, 0.75 * k, 0.9 * k, 0, 0.5 * k, 0, col], ['mouth', 0.72 * k, 0.28 * k, 0.05 * k, 0, 0.38 * k, -0.45 * k, 0x300808],
      ['f1', 0.24 * k, 0.16 * k, 0.32 * k, -0.24 * k, 0.08 * k, -0.06 * k, foot], ['f2', 0.24 * k, 0.16 * k, 0.32 * k, 0.24 * k, 0.08 * k, -0.06 * k, foot],
      ['e1', 0.16 * k, 0.16 * k, 0.1 * k, -0.2 * k, 0.86 * k, -0.34 * k, eye], ['e2', 0.16 * k, 0.16 * k, 0.1 * k, 0.2 * k, 0.86 * k, -0.34 * k, eye],
      ['p1', 0.06 * k, 0.06 * k, 0.04 * k, -0.2 * k, 0.86 * k, -0.4 * k, 0x000000], ['p2', 0.06 * k, 0.06 * k, 0.04 * k, 0.2 * k, 0.86 * k, -0.4 * k, 0x000000],
    ];
    for (let t = 0; t < 5; t++) parts.push(['t' + t, 0.08 * k, 0.1 * k, 0.04 * k, (-0.28 + t * 0.14) * k, 0.48 * k, -0.47 * k, 0xfffff0], ['b' + t, 0.08 * k, 0.1 * k, 0.04 * k, (-0.28 + t * 0.14) * k, 0.28 * k, -0.47 * k, 0xfffff0]);
    if (boss) parts.push(['h1', 0.16, 1.2, 0.16, -1.2, 3.3, 0, 0x2a7a20], ['h2', 0.16, 1.2, 0.16, 1.2, 3.3, 0, 0x2a7a20], ['b1', 0.4, 0.4, 0.4, -1.2, 3.95, 0, 0xffd040], ['b2', 0.4, 0.4, 0.4, 1.2, 3.95, 0, 0xffd040], ['cr', 1.4, 0.4, 1.0, 0, 3.15, 0, 0xffc020]);
    return E.model(ctx, parts);
  }
  function jqItemModel(ctx, e) {
    const M = {
      health: [['b', 0.5, 0.36, 0.4, 0, 0.18, 0, 0xe8e8e0], ['c1', 0.32, 0.1, 0.42, 0, 0.18, 0, 0x2aac2a], ['c2', 0.1, 0.32, 0.42, 0, 0.18, 0, 0x2aac2a]],
      mega: [['b', 0.5, 0.5, 0.5, 0, 0.45, 0, 0x4060ff], ['c', 0.3, 0.3, 0.3, 0, 0.45, 0, 0xc0e0ff]],
      armour1: [['b', 0.5, 0.55, 0.22, 0, 0.35, 0, 0x2a9a2a], ['s1', 0.16, 0.18, 0.24, -0.2, 0.6, 0, 0x2a9a2a], ['s2', 0.16, 0.18, 0.24, 0.2, 0.6, 0, 0x2a9a2a]],
      armour2: [['b', 0.5, 0.55, 0.22, 0, 0.35, 0, 0xd8b020], ['s1', 0.16, 0.18, 0.24, -0.2, 0.6, 0, 0xd8b020], ['s2', 0.16, 0.18, 0.24, 0.2, 0.6, 0, 0xd8b020]],
      shells: [['b', 0.44, 0.24, 0.3, 0, 0.12, 0, 0xb02a1a], ['l', 0.46, 0.06, 0.32, 0, 0.2, 0, 0xd8b040]],
      teef: [['b', 0.44, 0.3, 0.34, 0, 0.15, 0, 0x6a4a2a], ['t1', 0.08, 0.1, 0.36, -0.12, 0.34, 0, 0xb8b8c0], ['t2', 0.08, 0.1, 0.36, 0.0, 0.34, 0, 0xb8b8c0], ['t3', 0.08, 0.1, 0.36, 0.12, 0.34, 0, 0xb8b8c0]],
      rokkits: [['b', 0.44, 0.3, 0.44, 0, 0.15, 0, 0x5a6a3a], ['s', 0.14, 0.34, 0.14, 0, 0.46, 0, 0xc0c0c8], ['t', 0.14, 0.12, 0.14, 0, 0.68, 0, 0xe8381b]],
      silverkey: [['r', 0.3, 0.3, 0.06, 0, 0.75, 0, 0xd0d4e0], ['s', 0.08, 0.5, 0.06, 0, 0.4, 0, 0xd0d4e0], ['t', 0.16, 0.08, 0.06, 0.08, 0.22, 0, 0xd0d4e0]],
      goldkey: [['r', 0.3, 0.3, 0.06, 0, 0.75, 0, 0xffd040], ['s', 0.08, 0.5, 0.06, 0, 0.4, 0, 0xffd040], ['t', 0.16, 0.08, 0.06, 0.08, 0.22, 0, 0xffd040]],
      teefgun: [['b', 0.2, 0.18, 0.6, 0, 0.3, 0, 0x6a5038], ['d', 0.26, 0.08, 0.26, 0, 0.42, 0, 0xd8d0b0]],
      launcher: [['b', 0.24, 0.24, 0.8, 0, 0.3, 0, 0x5a6a3a], ['s', 0.18, 0.18, 0.12, 0, 0.3, -0.42, 0xe8381b]],
      waaagh: [['b', 0.5, 0.5, 0.5, 0, 0.6, 0, 0x8a2ad8], ['w', 0.3, 0.3, 0.52, 0, 0.6, 0, 0xd8a0ff]],
      boom2: [['s', 0.12, 0.12, 0.3, 0, 0.3, 0.3, 0x5a321a], ['b1', 0.08, 0.08, 0.55, -0.045, 0.32, -0.12, 0x6a6a70], ['b2', 0.08, 0.08, 0.55, 0.045, 0.32, -0.12, 0x6a6a70], ['h', 0.2, 0.05, 0.06, 0, 0.27, 0.12, 0xa08020]],
      srivet: [['b', 0.26, 0.2, 0.5, 0, 0.32, 0.05, 0x3a3a40], ['c', 0.16, 0.16, 0.36, 0, 0.32, -0.36, 0x8a8a90], ['h', 0.12, 0.1, 0.16, 0, 0.46, 0.05, 0x6a4a2a], ['r', 0.27, 0.05, 0.12, 0, 0.36, 0.16, 0xb02a1a]],
      grenade: [['d', 0.24, 0.24, 0.2, 0, 0.32, 0.05, 0x3a4a22], ['t', 0.18, 0.18, 0.44, 0, 0.33, -0.27, 0x4a5a2a], ['s', 0.12, 0.12, 0.26, 0, 0.27, 0.3, 0x5a321a]],
      zapper: [['b', 0.24, 0.2, 0.4, 0, 0.32, 0.08, 0x3a3e48], ['c', 0.2, 0.2, 0.18, 0, 0.32, -0.2, 0x9a5a2a], ['p1', 0.04, 0.04, 0.26, -0.06, 0.36, -0.42, 0x9a5a2a], ['p2', 0.04, 0.04, 0.26, 0.06, 0.36, -0.42, 0x9a5a2a], ['g', 0.08, 0.08, 0.08, 0, 0.36, -0.56, 0x80d8ff]],
      cells: [['b', 0.46, 0.3, 0.32, 0, 0.15, 0, 0x2a3a5a], ['l', 0.3, 0.12, 0.34, 0, 0.17, 0, 0x60d0ff], ['t1', 0.06, 0.08, 0.06, -0.14, 0.34, 0, 0xd0d0d0], ['t2', 0.06, 0.08, 0.06, 0.14, 0.34, 0, 0xd0d0d0]],
      star: [['a', 0.6, 0.16, 0.12, 0, 0.75, 0, 0xffd040], ['b', 0.16, 0.6, 0.12, 0, 0.75, 0, 0xffd040], ['c', 0.36, 0.36, 0.13, 0, 0.75, 0, 0xfff0a0], ['d', 0.14, 0.14, 0.15, 0, 0.75, 0, 0xffffff]],
      wellies: [['l', 0.16, 0.42, 0.16, -0.12, 0.25, 0, 0x2a9a2a], ['r', 0.16, 0.42, 0.16, 0.12, 0.25, 0, 0x2a9a2a], ['lf', 0.16, 0.1, 0.3, -0.12, 0.05, -0.07, 0x2a9a2a], ['rf', 0.16, 0.1, 0.3, 0.12, 0.05, -0.07, 0x2a9a2a], ['t1', 0.17, 0.05, 0.17, -0.12, 0.44, 0, 0xffe040], ['t2', 0.17, 0.05, 0.17, 0.12, 0.44, 0, 0xffe040]],
    }[e];
    return E.model(ctx, M, { full: e === 'mega' || e === 'waaagh' || e === 'star' || /key/.test(e) ? 0.9 : 0 });
  }
  // a flame sprite for torches (two flickering boxes, fullbright)
  // a wall torch: an iron bracket, a stick and a flame that flickers by itself
  function jqFlame(ctx, x, y, z) {
    const m = E.model(ctx, [['s', 0.1, 0.4, 0.1, 0, -0.34, 0, 0x4a2a10], ['br', 0.2, 0.06, 0.2, 0, -0.14, 0, 0x2a2622], ['cup', 0.16, 0.12, 0.16, 0, -0.08, 0, 0x3a3430], ['f', 0.01, 0.01, 0.01, 0, -0.04, 0, 0xc85010, null, [0, 0, 0]],
      ['a', 0.26, 0.42, 0.26, 0, 0.19, 0, 0xd85a10, 'f'], ['b', 0.17, 0.36, 0.17, 0, 0.24, 0, 0xe89a20, 'f'], ['c', 0.08, 0.2, 0.08, 0, 0.18, 0, 0xfff0a0, 'f'], ['d', 0.1, 0.16, 0.1, 0.06, 0.46, 0.04, 0xd85a10, 'f']], { full: 1.25 });
    m.position.set(x, y, z); ctx.scene.add(m);
    const f = m.parts.f, seed = x * 7.1 + z * 3.3, part = m.parts.a;
    // a soft glow round the flame (the torch light itself is baked into the walls and flickers with them)
    if (!ctx._jqGlow) { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 1, 16, 16, 16); gr.addColorStop(0, 'rgba(255,200,110,.75)'); gr.addColorStop(0.4, 'rgba(255,130,40,.28)'); gr.addColorStop(1, 'rgba(255,90,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); const t = new E.T.CanvasTexture(c); ctx.bag.push(t); ctx._jqGlow = t; }
    const gm = new E.T.SpriteMaterial({ map: ctx._jqGlow, transparent: true, depthWrite: false, blending: E.T.AdditiveBlending }); (ctx.mbag || ctx.bag).push(gm);
    const halo = new E.T.Sprite(gm); halo.position.set(0, 0.24, 0); halo.scale.set(1.5, 1.7, 1); m.add(halo);
    if (f && part) part.onBeforeRender = () => { const t = performance.now() / 1000 + seed; const k = 0.85 + 0.18 * Math.sin(t * 13.3) + 0.12 * Math.sin(t * 29.1 + 1.7); f.scale.set(1 + 0.1 * Math.sin(t * 17.7), k, 1 + 0.1 * Math.cos(t * 15.1)); f.rotation.y = t * 0.7; gm.opacity = 0.75 + 0.25 * k; };
    return m;
  }


  // ---------------------------------------------------------------- the status bar art (shared with JAQUAKE deathmatch)
  let BAR = null;
  function jqBar() {
    if (BAR) return BAR;
    const bar = BAR = document.createElement('canvas'); bar.width = 320; bar.height = 44;
    (function () { const x = bar.getContext('2d'), r = E.rng(5); E.TEX.metal(x, 64, r); const img = x.getImageData(0, 0, 64, 64); E.quantize(img); x.putImageData(img, 0, 0); for (let i = 64; i < 320; i += 64) x.drawImage(bar, 0, 0, 64, 44, i, 0, 64, 44); x.fillStyle = 'rgba(20,10,0,.45)'; x.fillRect(0, 0, 320, 44);
      // the inventory row is a darker recessed strip; the main row has three sunken wells (armour, face + health, ammo)
      x.fillStyle = 'rgba(0,0,0,.32)'; x.fillRect(0, 0, 320, 16); x.fillStyle = '#6a4a2a'; x.fillRect(0, 16, 320, 1); x.fillStyle = '#1a1008'; x.fillRect(0, 17, 320, 1);
      for (const [a, w] of [[2, 102], [106, 104], [212, 106]]) { x.fillStyle = 'rgba(0,0,0,.26)'; x.fillRect(a, 19, w, 24); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(a, 19, w, 1); x.fillRect(a, 19, 1, 24); x.fillStyle = 'rgba(255,200,140,.16)'; x.fillRect(a, 42, w, 1); x.fillRect(a + w - 1, 19, 1, 24); }
    })();
    return bar;
  }
  // the big status bar numbers: chunky stamped-metal digits (each pixel of the 5x7 font becomes a bevelled 3x3 block)
  const BIGA = {};
  function bigAtlas(red) {
    const key = red ? 'r' : 'g'; if (BIGA[key]) return BIGA[key];
    const cv = document.createElement('canvas'); cv.width = 10 * 18 + 1; cv.height = 25; const x = cv.getContext('2d');
    const tmp = document.createElement('canvas'); tmp.width = 6; tmp.height = 8; const tx = tmp.getContext('2d');
    const top = red ? [255, 140, 100] : [255, 232, 150], bot = red ? [160, 24, 12] : [178, 98, 26], mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
    for (let d = 0; d < 10; d++) {
      tx.clearRect(0, 0, 6, 8); font.draw(tx, String(d), 0, 0, '#fff', 1); const px = tx.getImageData(0, 0, 6, 8).data;
      for (const pass of [0, 1]) for (let py = 0; py < 8; py++) for (let qx = 0; qx < 6; qx++) {
        if (px[(py * 6 + qx) * 4 + 3] < 128) continue; const X = d * 18 + qx * 3, Y = py * 3;
        if (!pass) { x.fillStyle = 'rgba(16,6,0,.9)'; x.fillRect(X + 1, Y + 1, 3, 3); continue; }
        const c = mix(top, bot, py / 6), on = (a, b) => a >= 0 && a < 6 && b >= 0 && b < 8 && px[(b * 6 + a) * 4 + 3] >= 128; x.fillStyle = rgb(c); x.fillRect(X, Y, 3, 3);
        if (!on(qx, py - 1)) { x.fillStyle = rgb(mix(c, [255, 255, 255], 0.4)); x.fillRect(X, Y, 3, 1); } if (!on(qx - 1, py)) { x.fillStyle = rgb(mix(c, [255, 255, 255], 0.22)); x.fillRect(X, Y, 1, 3); }
        if (!on(qx, py + 1)) { x.fillStyle = rgb(mix(c, [0, 0, 0], 0.45)); x.fillRect(X, Y + 2, 3, 1); } if (!on(qx + 1, py)) { x.fillStyle = rgb(mix(c, [0, 0, 0], 0.3)); x.fillRect(X + 2, Y, 1, 3); }
      }
    }
    return BIGA[key] = cv;
  }
  // a little picture of each gun for the inventory strip (20 x 9 pixels)
  function wIcon(g, k, x, y, lit) {
    const R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); }, m = lit ? '#e8e0d0' : '#8a8478', d = lit ? '#8a6a3a' : '#5a4a3a', h = lit ? '#ffd860' : '#8a7040';
    if (k === 0) { R(2, 2, 10, 4, m); R(12, 3, 6, 2, d); R(4, 1, 2, 6, h); R(8, 1, 2, 6, h); }
    else if (k === 1) { R(1, 4, 6, 3, d); R(7, 3, 12, 2, m); R(9, 5, 5, 2, d); }
    else if (k === 2) { R(1, 4, 5, 3, d); R(6, 2, 12, 2, m); R(6, 4, 12, 2, m); R(5, 3, 2, 3, h); }
    else if (k === 3) { R(2, 3, 8, 4, d); R(4, 1, 4, 2, m); R(10, 3, 8, 1, m); R(10, 5, 8, 1, m); }
    else if (k === 4) { R(1, 2, 9, 6, d); R(3, 0, 5, 2, m); R(10, 2, 8, 1, m); R(10, 4, 9, 1, m); R(10, 6, 8, 1, m); R(2, 4, 8, 1, '#b02a1a'); }
    else if (k === 5) { R(1, 4, 5, 3, d); R(6, 2, 5, 6, '#4a5a2a'); R(11, 3, 7, 4, lit ? '#6a7a3a' : '#4a5a2a'); }
    else if (k === 6) { R(1, 2, 18, 5, lit ? '#4a5a2a' : '#3a4422'); R(17, 3, 2, 3, '#e8381b'); R(5, 7, 2, 2, d); R(7, 2, 1, 5, h); }
    else if (k === 7) { R(1, 2, 8, 6, '#3a3e48'); R(9, 2, 4, 6, '#9a5a2a'); R(13, 3, 5, 1, '#9a5a2a'); R(13, 6, 5, 1, '#9a5a2a'); R(17, 4, 2, 2, lit ? '#a0f0ff' : '#5a8a9a'); }
  }
  // P: { hp, dead, god, ouch (until t), quad (until t), look } plus faceT/lookN, which face() keeps for itself; t = game time
  function jqFace(g, x, y, P, t) {
    const G = { t };
    // Jack's face: brown hair, gets crosser as health drops; looks about; shades in god mode
    const hp = P.hp, tier = P.dead ? 5 : hp > 80 ? 0 : hp > 60 ? 1 : hp > 40 ? 2 : hp > 20 ? 3 : 4;
    if (G.t > (P.faceT || 0)) { P.faceT = G.t + 0.8 + Math.random() * 1.6; P.lookN = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1); }
    const look = P.ouch > G.t ? P.look || 0 : P.lookN || 0;
    const R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); };
    const skin = tier >= 4 ? '#e8a080' : '#f0c090';
    R(4, 3, 16, 19, skin); R(3, 6, 1, 12, skin); R(20, 6, 1, 12, skin);
    R(3, 1, 18, 5, '#6a3a12'); R(2, 3, 3, 6, '#6a3a12'); R(19, 3, 3, 5, '#6a3a12'); R(7, 0, 8, 2, '#7a4a1a'); R(9, 5, 6, 1, '#6a3a12');
    if (P.god) { R(5, 9, 6, 3, '#101010'); R(13, 9, 6, 3, '#101010'); R(11, 9, 2, 1, '#101010'); R(6, 9, 2, 1, '#606060'); }
    else if (P.dead) { R(6, 10, 4, 1, '#000'); R(14, 10, 4, 1, '#000'); R(7, 9, 1, 3, '#000'); R(15, 9, 1, 3, '#000'); }
    else if (P.ouch > G.t) { R(6, 10, 4, 1, '#000'); R(14, 10, 4, 1, '#000'); }
    else { R(6, 9, 4, 3, '#fff'); R(14, 9, 4, 3, '#fff'); R(7 + look, 10, 2, 2, '#204080'); R(15 + look, 10, 2, 2, '#204080'); }
    // brows: flat -> cross -> very cross
    const bc = '#5a2a0a';
    if (tier === 0) { R(6, 7, 4, 1, bc); R(14, 7, 4, 1, bc); }
    else if (tier === 1) { R(6, 7, 4, 1, bc); R(14, 7, 4, 1, bc); R(9, 8, 1, 1, bc); R(14, 8, 1, 1, bc); }
    else { R(6, 6, 2, 1, bc); R(8, 7, 2, 1, bc); R(10, 8, 1, 1, bc); R(16, 6, 2, 1, bc); R(14, 7, 2, 1, bc); R(13, 8, 1, 1, bc); }
    R(11, 12, 2, 4, tier >= 3 ? '#d88060' : '#e0a878');
    // mouth
    if (P.quad > G.t) { R(8, 17, 8, 3, '#fff'); R(8, 17, 8, 1, '#a02020'); R(9, 18, 1, 2, '#ddd'); R(12, 18, 1, 2, '#ddd'); R(14, 18, 1, 2, '#ddd'); }
    else if (P.dead) { R(9, 18, 6, 2, '#602010'); }
    else if (P.ouch > G.t) { R(10, 17, 4, 3, '#401010'); }
    else if (tier === 0) { R(8, 17, 8, 1, '#802020'); R(7, 16, 1, 1, '#802020'); R(16, 16, 1, 1, '#802020'); }
    else if (tier <= 2) R(8, 18, 8, 1, '#802020');
    else { R(8, 18, 8, 2, '#fff'); R(8, 18, 8, 1, '#802020'); R(8, 19, 8, 1, '#802020'); }
    if (tier >= 3) { R(15, 13, 4, 2, '#f0e0c0'); R(16, 13, 2, 2, '#c0a080'); } // a plaster
    if (tier >= 4) { R(5, 14, 2, 1, '#c03020'); }
  }
  function jqBig(g, n, x, y, col) {
    const s = String(Math.min(999, Math.max(0, Math.round(n)))).padStart(3, ' '), A = bigAtlas(/^#f[0-9a-f]4|ff4030|ff6040/i.test(col || '') || col === 'red');
    for (let i = 0; i < 3; i++) { const d = s.charCodeAt(i) - 48; if (d >= 0 && d <= 9) g.drawImage(A, d * 18, 0, 18, 25, Math.round(x + i * 18), Math.round(y), 18, 25); }
  }
  function jqIcon(g, kind, x, y, P) {
    const R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); };
    if (kind === 'armour') { const c = P.at === 2 ? '#d8b020' : P.at === 1 ? '#2a9a2a' : '#5a4a3a'; R(3, 3, 18, 14, c); R(1, 3, 4, 6, c); R(19, 3, 4, 6, c); R(9, 3, 6, 4, '#2a1a0a'); R(5, 17, 14, 4, c); R(4, 4, 1, 12, '#fff8'); }
    else if (kind === 'shells') { for (let k = 0; k < 3; k++) { R(3 + k * 7, 4, 5, 13, '#b02a1a'); R(3 + k * 7, 15, 5, 4, '#d8b040'); } }
    else if (kind === 'teef') { for (let k = 0; k < 4; k++) { R(2 + k * 5, 4, 4, 3, '#d0d0d8'); R(3 + k * 5, 7, 2, 11, '#9a9aa8'); } }
    else if (kind === 'rokkits') { for (let k = 0; k < 2; k++) { R(4 + k * 9, 6, 6, 12, '#c0c0c8'); R(4 + k * 9, 2, 6, 4, '#e8381b'); R(3 + k * 9, 16, 8, 4, '#5a6a3a'); } }
    else if (kind === 'choppa') { R(10, 2, 3, 20, '#7a4a22'); R(4, 3, 8, 8, '#c0c0c8'); R(5, 4, 6, 1, '#fff'); R(12, 5, 4, 4, '#c0c0c8'); }
    else if (kind === 'cells') { for (let k = 0; k < 2; k++) { R(3 + k * 10, 5, 8, 15, '#2a3a5a'); R(4 + k * 10, 8, 6, 9, '#60d0ff'); R(5 + k * 10, 3, 4, 2, '#d0d0d0'); R(5 + k * 10, 9, 2, 5, '#c0f0ff'); } }
  }
  // where each gun sits (added to the usual spot: they are all centred, like they were then) and where its muzzle flash goes,
  // in view-model space. VMOFF8/MUZ8 are the eight single-player guns; VMOFF/MUZ are the four JackNet deathmatch ones.
  const VMOFF8 = [[0.02, -0.03, 0], [-0.1, -0.05, -0.04], [-0.1, -0.05, -0.03], [-0.1, -0.07, -0.04], [-0.1, -0.075, -0.04], [-0.1, -0.07, -0.03], [-0.1, -0.07, -0.03], [-0.1, -0.07, -0.04]];
  // the muzzle of each gun in its own model space [y, z]; the flash position follows from the offset, the tilt and the scale
  const MUZL = [null, [0.035, -0.75], [0.025, -0.63], [0, -0.53], [0, -0.56], [0.01, -0.53], [0, -0.5], [0.03, -0.57]];
  const MUZ8 = MUZL.map((m, k) => { if (!m) return null; const t = VMTILT[k], vo = VMOFF8[k], y = m[0] * Math.cos(t) - m[1] * Math.sin(t), z = m[0] * Math.sin(t) + m[1] * Math.cos(t); return [0.1 + vo[0], -0.115 + vo[1] + y * 0.42, -0.24 + vo[2] + z * 0.42]; });
  const VMOFF = ONLINE_W.map(k => VMOFF8[k]), MUZ = ONLINE_W.map(k => MUZ8[k]);
  PCG.jqArt = { VMOFF, MUZ, VMOFF8, MUZ8, jqVM, grotModel, robotModel, squigModel, jqItemModel, jqFlame, jqBar, jqFace, jqBig, jqIcon, wIcon };

  // ---------------------------------------------------------------- JAQUAKE's own sound effects (synthesised, original; silent unless SFX is on)
  let QV = 1; const v = x => x * QV;
  const QS = {
    sg() { E.noise(0.3, v(0.55), 2200, 0, 'lowpass', 260); E.tone(110, 0.14, 'square', v(0.22), 0, 45); E.noise(0.05, v(0.3), 5000, 0, 'highpass'); E.noise(0.06, v(0.12), 1400, 0.24, 'bandpass'); E.noise(0.05, v(0.1), 1100, 0.31, 'bandpass'); },
    ssg() { E.noise(0.5, v(0.75), 1500, 0, 'lowpass', 140); E.tone(68, 0.28, 'square', v(0.26), 0, 28); E.noise(0.08, v(0.38), 5000, 0, 'highpass'); E.noise(0.06, v(0.12), 900, 0.4, 'bandpass'); },
    nail() { E.tone(1500 + Math.random() * 300, 0.03, 'square', v(0.06), 0, 700); E.noise(0.04, v(0.16), 3500, 0, 'bandpass'); },
    nail2() { E.tone(950 + Math.random() * 200, 0.045, 'square', v(0.08), 0, 380); E.noise(0.05, v(0.24), 2400, 0, 'bandpass'); },
    gren() { E.noise(0.16, v(0.36), 800, 0, 'lowpass', 200); E.tone(240, 0.1, 'triangle', v(0.16), 0, 90); },
    bounce() { E.tone(360 + Math.random() * 80, 0.06, 'triangle', v(0.13), 0, 250); },
    zap() { E.tone(70 + Math.random() * 20, 0.12, 'sawtooth', v(0.09), 0, 110); E.noise(0.1, v(0.16), 4200, 0, 'highpass'); E.tone(2200 + Math.random() * 900, 0.04, 'square', v(0.035)); },
    fizz() { E.noise(0.9, v(0.4), 6000, 0, 'highpass', 900); E.tone(60, 0.9, 'sawtooth', v(0.15), 0, 40); [0, 0.15, 0.3].forEach(t => E.tone(3000, 0.05, 'square', v(0.06), t)); },
    tellimp() { E.tone(1250, 0.07, 'square', v(0.06), 0, 1800); E.tone(1050, 0.08, 'square', v(0.05), 0.09, 1500); },
    tellbot() { E.tone(1480, 0.05, 'square', v(0.06)); E.tone(1480, 0.05, 'square', v(0.06), 0.1); },
    laser() { E.tone(1900, 0.16, 'sawtooth', v(0.07), 0, 300); },
    fireball() { E.noise(0.28, v(0.2), 900, 0, 'bandpass', 260); E.tone(180, 0.15, 'triangle', v(0.06), 0, 90); },
    whiff() { E.noise(0.14, v(0.14), 1300, 0, 'bandpass', 380); },
    thunk() { E.tone(150, 0.08, 'square', v(0.12), 0, 80); E.noise(0.05, v(0.15), 1500); },
    swap() { E.tone(520, 0.03, 'square', v(0.05)); E.noise(0.05, v(0.1), 1800, 0.02, 'bandpass'); },
    ting() { E.tone(2100, 0.12, 'triangle', v(0.08)); },
    quadfire() { E.tone(220, 0.25, 'sawtooth', v(0.05), 0, 110); },
    tick() { E.tone(880, 0.025, 'square', v(0.06)); },
    star() { [523, 659, 784, 1047, 1319].forEach((f, i) => E.tone(f, 0.18, 'triangle', v(0.14), i * 0.06)); },
    splash() { E.noise(0.35, v(0.25), 1200, 0, 'lowpass', 300); },
    hum() { E.tone(55, 0.5, 'sawtooth', v(0.04), 0, 50); },
  };
  const qLast = {};
  let QL = null; // the listener (the player), for "further away = quieter"
  function qs(name, gap, at) {
    if (!window.Sound || !Sound.on || !QS[name]) return;
    const now = performance.now(); if (qLast[name] && now - qLast[name] < (gap || 30)) return; qLast[name] = now;
    QV = at && QL ? clamp(1.3 - Math.hypot(at[0] - QL[0], at[2] - QL[2]) / 22, 0.15, 1) : 1;
    try { QS[name](); } catch (e) {} QV = 1;
  }

  // ================================================================ the game
  PCG.jaquake = function (w, host, arg, env) {
    const store = Apps.store, cfg = Object.assign({ name: (window.Net && Net.me && Net.me.nick) || 'Player', sens: 1, fov: 90, res: 200, invert: false, skill: 1, got: 1 }, store.get('jhp_fps', {}));
    const save = () => store.set('jhp_fps', cfg);
    const ctx = E.makeCtx(host, { base: cfg.res, band: 16, px: true, fov: cfg.fov, far: 140, fogC: [0.07, 0.05, 0.03], fogD: 0.018 });
    if (!ctx) { host.innerHTML = '<div class="pcg-ov">JAQUAKE needs a 3D card (WebGL). Your PC said no.</div>'; return { close() {} }; }
    const touch = E.isTouch();
    const G = { ctx, map: null, state: 'title', con: false, conLines: [], conIn: '', conHist: [], conPos: -1, menu: null, cp: null, msgs: [], t: 0, closed: false };
    const P = { p: [0, 0, 0], v: [0, 0, 0], r: 0.4, h: 1.75, yaw: 0, pitch: 0, hp: 100, ar: 0, at: 0, wb: 3, cur: 1, ammo: { shells: 25, teef: 0, rokkits: 0, cells: 0 }, keys: {}, quad: 0, inv: 0, suit: 0, god: false, noclip: false, notarget: false, ground: false, dead: false, cool: 0, hurtT: 0, faceT: 0, look: 0, bob: 0, eye: 1.5, sy: 0 };
    G.P = P;
    let world = null, FX = null, ents = [], mons = [], items = [], projs = [], doors = [], lifts = [], trig = [], lightC = {};
    const say = (s, ms) => { G.msgs.push({ s, t: G.t + (ms || 3) }); if (G.msgs.length > 4) G.msgs.shift(); con(s); };
    const center = (s, ms) => { G.cp = { s, t: G.t + (ms || 3) }; con(s.replace(/\|/g, ' ')); };
    function con(s) { String(s).split('\n').forEach(l => G.conLines.push(l)); if (G.conLines.length > 200) G.conLines.splice(0, G.conLines.length - 200); }
    con(`JAQUAKE v${VERSION} (shareware)`); con('Jackware Software, 1999. Episode 1: The Rusty Dimension'); con('8 megs of RAM detected. VGA 320x200. Sound Blaster at A220 I5 D1'); con('Type "help" for a list of commands.'); con('');

    // view models, monsters and pickups are drawn by the module-level art (shared with the deathmatch client)
    const VM = [];
    function buildVM() { jqVM(ctx, true).forEach((m, i) => { VM[i] = m; }); }
    const bar = jqBar(), face = (g, x, y) => jqFace(g, x, y, P, G.t), big = jqBig, icon = (g, kind, x, y) => jqIcon(g, kind, x, y, P);

    // ---------------------------------------------------------------- loading a map
    function lightAt(x, y, z) {
      const k = Math.floor(x) + ',' + Math.floor(y) + ',' + Math.floor(z);
      return lightC[k] || (lightC[k] = world.lightAt(x, y, z, null, null, null, true));
    }
    function load(id, keep, demo) {
      if (!MAPS[id]) { con(`map ${id} not found`); return; }
      if (G.loading) { G.pending = [id, keep, demo]; return; }
      const ov = demo ? null : E.loading(host, { style: 'jq', head: 'LOADING', title: `${id.toUpperCase()}: ${MAPS[id].title}`, blurb: BLURB[id], tip: TIPS[Math.floor(Math.random() * TIPS.length)] });
      G.loading = true;
      setTimeout(() => {
        if (G.closed) return;
        try { build(id, keep, demo); } catch (e) { console.error(e); con('Error loading map: ' + e.message); }
        if (ov) ov.done(); G.loading = false;
        if (G.pending) { const q = G.pending; G.pending = null; load(q[0], q[1], q[2]); }
      }, demo ? 30 : 60);
    }
    // the attract mode: behind the title menu a demo plays, a camera wandering through one of the maps (like the old days)
    function startDemo() { if (G.closed || G.loading) return; const ids = Object.keys(MAPS); G.demoN = ((G.demoN == null ? Math.floor(Math.random() * ids.length) : G.demoN + 1)) % ids.length; load(ids[G.demoN], false, true); }
    function demoPath(M) {
      const st = ents.find(e => e.e === 'start'); if (!st) return null;
      const keep = doors.map(d => d.c.c); doors.forEach(d => { if (d.k !== 'secretdoor') d.c.c = d.top; });
      const f = E.flow(M, st.i, st.j);
      doors.forEach((d, i) => { d.c.c = keep[i]; });
      let best = -1, bi = 0; for (let k = 0; k < f.dist.length; k++) if (f.dist[k] > best) { best = f.dist[k]; bi = k; }
      const pts = []; let i = bi % M.w, j = (bi / M.w) | 0;
      for (let n = 0; n < 500; n++) { pts.push([i, j]); const nx = f.next(i, j); if (!nx) break; i = nx[0]; j = nx[1]; }
      pts.reverse();
      return pts.length > 4 ? pts.map(([a, b]) => [(a + 0.5) * M.S, M.cell(a, b).f, (b + 0.5) * M.S]) : null;
    }
    function build(id, keep, demo) {
      ctx.clearMap(); lightC = {};
      const { M, ents: E0, dyns, md } = prep(id);
      G.map = { id, M, md, kills: 0, mons: 0, secrets: 0, nsec: 0, t0: G.t, msgN: 0 };
      // lights: torches, lamps, glowing liquids, the sky
      const lights = [];
      E0.forEach(e => {
        if (e.e === 'torch') { const off = wallSide(M, e); lights.push({ x: off[0], y: e.y + 2.3, z: off[2], c: [1.0, 0.62, 0.28], i: 1.8, rad: 10, flick: true }); e.fl = off; }
        if (e.e === 'lamp') lights.push({ x: e.x, y: e.c.c - 0.4, z: e.z, c: [0.95, 0.9, 0.75], i: 1.5, rad: 12 });
      });
      const seen = {};
      M.cells.forEach(c => {
        const key = (k, d) => Math.floor(c.i / d) + ',' + Math.floor(c.j / d) + k;
        if (c.liq === 'lava' && !seen[key('l', 3)]) { seen[key('l', 3)] = 1; lights.push({ x: (c.i + 1) * M.S, y: c.lv + 0.6, z: (c.j + 1) * M.S, c: [1, 0.45, 0.12], i: 1.2, rad: 8 }); }
        if (c.liq === 'slime' && !seen[key('s', 3)]) { seen[key('s', 3)] = 1; lights.push({ x: (c.i + 1) * M.S, y: c.lv + 0.5, z: (c.j + 1) * M.S, c: [0.4, 0.9, 0.3], i: 0.7, rad: 6 }); }
        if (c.sky && !c.liq && !seen[key('k', 4)]) { seen[key('k', 4)] = 1; lights.push({ x: (c.i + 1.5) * M.S, y: c.c - 1, z: (c.j + 1.5) * M.S, c: [0.7, 0.62, 0.8], i: 0.65, rad: 10 }); }
      });
      dyns.filter(d => d.k === 'exit').forEach(d => lights.push({ x: (d.i + 0.5) * M.S, y: d.c.f + 1, z: (d.j + 0.5) * M.S, c: [0.6, 0.35, 1], i: 1.2, rad: 6, flick: true }));
      // doors and lifts get their open shape for the static build
      dyns.forEach(d => { if (d.k === 'lift') d.c.x = Object.assign({}, d.c.x, { dyn: 'lift' }); if (d.k === 'exit') { d.c.liq = 'tele'; d.c.lv = d.c.f + 0.03; } });
      world = E.buildWorld(ctx, M, { lights, amb: md.amb.map(v => v * 0.78), // darker corners, brighter pools of light: more contrast, like the old lightmaps
         full: ['light'], shadows: !touch, sub: touch ? 2 : 1 });
      FX = E.fx(ctx, touch ? 600 : 1500);
      ents = E0; mons = []; items = []; projs = []; doors = []; lifts = []; trig = [];
      // dynamic bits
      dyns.forEach(d => {
        const c = d.c, x0 = d.i * M.S, z0 = d.j * M.S;
        if (d.k === 'lift') {
          let hi = c.f; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const n = M.cell(d.i + a, d.j + b); if (!n.s && n.f > hi && n.f - c.f < 6) hi = n.f; });
          const mesh = E.boxMesh(ctx, M, lightAt, 'metal', x0 + 0.02, c.f - 0.4, z0 + 0.02, x0 + M.S - 0.02, c.f, z0 + M.S - 0.02);
          lifts.push({ c, lo: c.f, hi, y: c.f, dir: 0, wait: 0, occ: false, mesh });
        } else if (d.k === 'exit') {
          trig.push({ k: 'exit', i: d.i, j: d.j });
        } else {
          const tx = { door: 'door', silver: 'silver', gold: 'gold', bossdoor: 'emblem', secretdoor: neighbourWall(M, d) }[d.k];
          const top = c.c, mesh = E.boxMesh(ctx, M, lightAt, tx, x0 + 0.01, c.f, z0 + 0.01, x0 + M.S - 0.01, top, z0 + M.S - 0.01);
          doors.push({ k: d.k, c, f: c.f, top, open: 0, want: 0, stay: 0, mesh, h: top - c.f });
          c.c = c.f; // closed
        }
      });
      // neighbouring door cells of the same kind move together
      doors.forEach(d => { d.group = d.group || [d]; doors.forEach(o => { if (o !== d && o.k === d.k && Math.abs(o.c.i - d.c.i) + Math.abs(o.c.j - d.c.j) === 1 && o.group !== d.group) { const g = d.group.concat(o.group || [o]); g.forEach(x => { x.group = g; }); } }); });
      // entities
      E0.forEach(e => {
        if (e.e === 'start') { P.p = [e.x, e.y, e.z]; P.yaw = startYaw(M, e); }
        else if (e.e === 'torch') { jqFlame(ctx, e.fl[0], e.y + 2.15, e.fl[2]); }
        else if (e.e === 'lamp') { E.boxMesh(ctx, M, lightAt, 'light', e.x - 0.35, e.c.c - 0.12, e.z - 0.35, e.x + 0.35, e.c.c, e.z + 0.35, { mat: E.worldMat(ctx, E.tex(ctx, 'light'), { full: 1.3 }) }); }
        else if (e.e === 'msg') trig.push({ k: 'msg', i: e.i, j: e.j, n: G.map.msgN++ });
        else if (e.e === 'secret') { trig.push({ k: 'secret', i: e.i, j: e.j }); G.map.nsec++; }
        else if (MON[e.e]) { if (cfg.skill === 0 && e.e === 'grot' && (e.i + e.j) % 3 === 0) return; const sw = md.swap && md.swap[e.e]; spawnMon(sw && (e.e !== 'grot' || (e.i + e.j) % 2) ? sw : e.e, e.x, e.y, e.z); }
        else { const m = jqItemModel(ctx, e.e); m.position.set(e.x, e.y, e.z); ctx.scene.add(m); E.setLight(m, lightAt(e.x, e.y + 0.5, e.z)); items.push({ e: e.e, p: [e.x, e.y, e.z], m, ph: Math.random() * 6 }); }
      });
      if (cfg.skill >= 2) ents.filter(e => e.e === 'grot').slice(0, 3).forEach(e => spawnMon(md.swap && md.swap.squig || 'squig', e.x + 0.6, e.y, e.z + 0.6));
      G.map.mons = mons.length;
      if (!keep) resetPlayer(); else { P.dead = false; P.v = [0, 0, 0]; P.keys = {}; P.quad = 0; P.inv = 0; P.suit = 0; }
      P.ground = false; P.sy = 0;
      ctx.uHurt.value = 0;
      // the Zapper's beam: a jagged line, redrawn every frame while you hold the trigger
      const bg = new E.T.BufferGeometry(); bg.setAttribute('position', new E.T.BufferAttribute(new Float32Array(30), 3));
      const bm = new E.T.LineBasicMaterial({ color: 0xc8f4ff }); ctx.mbag.push(bm); G.beam = new E.T.Line(bg, bm); G.beam.visible = false; G.beam.frustumCulled = false; ctx.scene.add(G.beam);
      G.dl = []; G.zap = null; G.shake = 0;
      if (id === 'e1m3') bossTalk = 0;
      if (demo) { // a demo behind the menu: no saving, no messages, every door unlocked
        G.state = 'demo'; P.keys = { s: true, g: true }; G.demo = { pts: demoPath(M), s: 0, yaw: P.yaw, pitch: 0, t0: G.t };
        if (!G.menu) { G.menu = MENU.main(); G.menu.sel = 0; }
        return;
      }
      G.state = 'play'; G.menu = null; G.demo = null;
      FX.spray(P.p[0], P.p[1] + 1, P.p[2], 40, [0.75, 0.5, 1], 5, 0.7, 0); flashAt(P.p[0], P.p[1] + 1.2, P.p[2], [0.6, 0.4, 1], 6, 0.5); sfx('tele');
      con(`\nMAP ${id.toUpperCase()}: ${md.title}`);
      center(`${id.toUpperCase()}: ${md.title}`, 3);
      cfg.got = Math.max(cfg.got || 1, +id.slice(-1)); save();
      ckSave(id);
    }
    // saved game (js/gamesave.js): the map you are on, the skill, and what you were carrying when you walked into it, so a
    // refresh or a closed window starts that map again with your kit (like a Quake save at the start of the level)
    function ckSave(id) { if (Apps.saveGame) Apps.saveGame('pcgames.jaquake', { map: id, skill: cfg.skill, P: { hp: P.hp, ar: P.ar, at: P.at, wb: P.wb, cur: P.cur, ammo: Object.assign({}, P.ammo), w8: 1 } }, { v: 1 }); }
    function wallSide(M, e) { for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (M.cell(e.i + a, e.j + b).s) return [e.x + a * 0.85, 0, e.z + b * 0.85]; return [e.x, 0, e.z]; }
    function neighbourWall(M, d) { for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const n = M.cell(d.i + a, d.j + b); if (n.s && n.wt) return n.wt; } return 'brick'; }
    function startYaw(M, e) { let best = 0, bd = -1; for (let k = 0; k < 4; k++) { const yaw = k * Math.PI / 2, f = E.fwd(yaw, 0); let d = 0; while (d < 30 && !M.at(e.x + f[0] * d, e.z + f[2] * d).s) d += 0.5; if (d > bd) { bd = d; best = yaw; } } return best; }
    function resetPlayer() { Object.assign(P, { hp: 100, ar: 0, at: 0, wb: 3, cur: 1, ammo: { shells: 25, teef: 0, rokkits: 0, cells: 0 }, keys: {}, quad: 0, inv: 0, suit: 0, dead: false, v: [0, 0, 0], cool: 0 }); }

    // ---------------------------------------------------------------- monsters
    const sk = () => clamp(cfg.skill | 0, 0, 3);
    const angDiff = a => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    function spawnMon(kind, x, y, z) {
      const S = MON[kind], m = kind === 'squig' || kind === 'blob' || kind === 'boss' ? squigModel(ctx, kind === 'boss', kind === 'blob') : /robot/.test(kind) ? robotModel(ctx, kind === 'bigrobot') : grotModel(ctx, kind === 'biggrot');
      m.position.set(x, y, z); ctx.scene.add(m);
      const o = { kind, S, m, p: [x, y, z], v: [0, 0, 0], r: S.r, h: S.h, hp: S.hp * (kind === 'boss' ? AI.hp[sk()] : 1), yaw: Math.random() * 6, awake: false, cool: 1 + Math.random(), anim: Math.random() * 6, flash: 0, ground: true, think: 0, summon: 6, react: 0, atk: null, still: 0, foe: null };
      mons.push(o); return o;
    }
    let flowF = null, flowAt = '', flowT = 0, bossTalk = 0;
    // The baddies, 1996 style but gentler: they notice you, take a moment, turn to face you (they can't spin on the spot),
    // stop, wind up (an arm goes up, a beep or a giggle), then let fly with something you can SEE coming and side-step.
    // Only a couple may shoot at you at once on the easier skills, a hit can put them off their shot, and if one of them
    // hits another by accident they fall out and fight each other.
    function updMons(dt) {
      const M = G.map.M, pc = M.at(P.p[0], P.p[2]), key = pc.i + ',' + pc.j, s = sk();
      if (key !== flowAt && G.t > flowT) { flowAt = key; flowT = G.t + 0.4; flowF = E.flow(M, pc.i, pc.j); }
      const spd = AI.move[s];
      let busy = 0; for (const o of mons) if (!o.dead && o.atk && o.atk.who === P && o.S.kind !== 'bite') busy++;
      for (const o of mons) {
        if (o.dead) continue;
        if (o.foe && (o.foe.dead || G.t > o.foeT)) o.foe = null;
        const T = o.foe || P, tp = T.p, dx = tp[0] - o.p[0], dz = tp[2] - o.p[2], dist = Math.hypot(dx, dz) || 0.001;
        const pd = T === P ? dist : Math.hypot(P.p[0] - o.p[0], P.p[2] - o.p[2]);
        if (pd > 45 && !o.awake) continue;
        o.think -= dt; o.cool -= dt; o.anim += dt; o.flash = Math.max(0, o.flash - dt * 4);
        const eyeY = o.p[1] + o.h * 0.8;
        if (o.think <= 0) {
          o.think = 0.2 + Math.random() * 0.15;
          o.see = T === P ? !P.dead && !P.notarget && dist < 40 && M.los(o.p[0], eyeY, o.p[2], P.p[0], P.p[1] + 1.5, P.p[2], 0.3)
            : M.los(o.p[0], eyeY, o.p[2], tp[0], tp[1] + T.h * 0.6, tp[2], 0.3);
          if (o.see && !o.awake) wake(o);
        }
        if (!o.awake) { animMon(o, 0, dt); place(o); continue; }
        // where to go (they stand still while winding up a shot, and for a moment after it)
        let wx = 0, wz = 0;
        const stand = (o.atk && o.S.kind !== 'bite') || G.t < o.still;
        const want = o.S.kind === 'shoot' ? 7 : o.S.kind === 'rokkit' ? 9 : o.S.kind === 'boss' ? 6 : 0.8;
        if (stand) { /* planted */ }
        else if (o.see && dist > want) { wx = dx / dist; wz = dz / dist; }
        else if (o.see && o.S.kind === 'shoot') { o.strafe = o.strafe || (Math.random() < 0.5 ? 1 : -1); if (Math.random() < 0.01) o.strafe *= -1; wx = -dz / dist * o.strafe * 0.6; wz = dx / dist * o.strafe * 0.6; }
        else if (!o.see && T === P && flowF && !P.dead) {
          const c = M.at(o.p[0], o.p[2]), n = flowF.next(c.i, c.j);
          if (n) { const tx = (n[0] + 0.5) * M.S - o.p[0], tz = (n[1] + 0.5) * M.S - o.p[2], l = Math.hypot(tx, tz) || 1; wx = tx / l; wz = tz / l; }
        } else if (!o.see && T !== P) { wx = dx / dist; wz = dz / dist; }
        if (o.kind === 'boss') { wx *= 0.6; wz *= 0.6; }
        const b = { p: o.p, v: o.v, r: o.r, h: o.h, ground: o.ground, jumpHeld: false };
        E.move(M, b, [wx, wz], (o.kind === 'squig' || o.kind === 'blob') && o.ground && !stand && Math.random() < 0.02, dt, { speed: o.S.speed * spd * (o.kind === 'boss' && o.hp < o.S.hp * 0.5 ? 1.6 : 1), accel: 8, fric: 6, grav: 20, jump: 5, air: 0.6 });
        o.ground = b.ground;
        if (o.kind === 'boss') { const c = M.at(o.p[0], o.p[2]); if (c.liq === 'lava' || o.p[1] < 1.5) { o.p[0] += (17.9 * 2 - o.p[0]) * 0.1; o.p[2] += (12.5 * 2 - o.p[2]) * 0.1; o.p[1] = 2; } }
        const lc = M.at(o.p[0], o.p[2]); if (lc.liq && o.p[1] < lc.lv - 0.3 && o.kind !== 'boss') hurtMon(o, (lc.liq === 'lava' ? 30 : 5) * dt, null);
        // turning: a limited speed, so no instant about-turns
        let wantYaw = o.yaw;
        if (o.see || dist < 3) wantYaw = Math.atan2(-dx, -dz); else if (wx || wz) wantYaw = Math.atan2(-wx, -wz);
        const tr = (o.kind === 'boss' ? 1.4 : AI.turn[s] * (o.S.kind === 'bite' ? 1.6 : 1)) * dt;
        o.yaw += clamp(angDiff(wantYaw - o.yaw), -tr, tr);
        const facing = Math.abs(angDiff(Math.atan2(-dx, -dz) - o.yaw)) < 0.45;
        // attack: the tell, then the shot
        if (o.atk) { if (G.t >= o.atk.t) { const a = o.atk; o.atk = null; release(o, a); } }
        else if (o.see && o.cool <= 0 && G.t > o.react && facing && !(T === P && P.dead)) {
          const bite = o.S.kind === 'bite';
          if (bite ? dist < o.S.range + 0.7 : dist < o.S.range) {
            if (T !== P || bite || o.kind === 'boss' || busy < AI.slots[s]) { startAtk(o, T); if (T === P && !bite) busy++; }
            else o.cool = 0.3 + Math.random() * 0.4; // somebody else is having a go: wait your turn
          }
        }
        animMon(o, Math.hypot(o.v[0], o.v[2]), dt);
        place(o);
      }
    }
    function wake(o) {
      if (o.awake) return; o.awake = true; o.cool = 0; o.react = G.t + AI.react[sk()] * (0.75 + Math.random() * 0.5);
      sfx(o.S.kind === 'bite' ? 'squig' : o.kind === 'boss' ? 'roar' : /robot/.test(o.kind) ? 'clang' : 'grot', 200);
      if (o.kind === 'boss') center('The GIGA-BLOB wakes up!|It looks hungry. And wobbly. And cross.', 3);
      // baddies shout to their mates (who take a little longer to get going)
      for (const n of mons) if (!n.awake && !n.dead && Math.hypot(n.p[0] - o.p[0], n.p[2] - o.p[2]) < 8) { n.awake = true; n.cool = 0; n.react = G.t + AI.react[sk()] * (1 + Math.random() * 0.6); }
    }
    function startAtk(o, T) {
      const s = sk(), bite = o.S.kind === 'bite', wind = bite ? 0.3 * AI.wind[s] / 0.5 : o.kind === 'boss' ? 0.45 : AI.wind[s] * (o.S.kind === 'rokkit' ? 1.4 : 1);
      o.atk = { t: G.t + wind, who: T }; o.fireT = wind + 0.15;
      if (bite) { o.biteT = wind; return; }
      if (o.kind !== 'boss') qs(/robot/.test(o.kind) ? 'tellbot' : 'tellimp', 80, o.p);
    }
    function release(o, a) {
      const S = o.S, T = a.who, s = sk();
      if (T.dead || o.dead) { o.cool = 0.5; return; }
      const dx = T.p[0] - o.p[0], dz = T.p[2] - o.p[2], dist = Math.hypot(dx, dz);
      if (S.kind === 'bite') { // the chomp lands only if you are still there
        o.biteT = 0.25; o.cool = S.cool * AI.cool[s]; o.still = G.t + 0.4;
        if (dist < S.range + (T.r || 0.4) && Math.abs(T.p[1] - o.p[1]) < 1.6) { if (T === P) damage(S.dmg, o.p, o); else hurtMon(T, S.dmg, o); sfx('squig', 100); }
        else qs('whiff', 100, o.p);
        return;
      }
      const ex = o.p[0] - Math.sin(o.yaw) * (o.r + 0.15), ey = o.p[1] + o.h * 0.75, ez = o.p[2] - Math.cos(o.yaw) * (o.r + 0.15);
      if (S.kind === 'shoot') {
        o.cool = (S.cool + Math.random() * 0.8) * AI.cool[s]; o.still = G.t + 0.3;
        const sp = PROJ[S.bolt].speed * AI.pspd[s];
        shoot(S.bolt, [ex, ey, ez], aimAt(T, ex, ey, ez, sp), o, S.dmg, sp); qs(S.bolt === 'laser' ? 'laser' : 'fireball', 60, o.p);
        FX.spray(ex, ey, ez, 4, S.bolt === 'laser' ? [0.5, 0.9, 1] : [1, 0.6, 0.2], 2, 0.15, 0); flashAt(ex, ey, ez, S.bolt === 'laser' ? [0.3, 0.7, 1] : [1, 0.5, 0.15], 5, 0.1);
        return;
      }
      if (S.kind === 'rokkit') { o.cool = (S.cool + Math.random()) * AI.cool[s]; o.still = G.t + 0.45; const sp = 15 * AI.pspd[s]; shoot('rokkit', [ex, ey, ez], aimAt(T, ex, ey, ez, sp), o, 30, sp); sfx('launch'); return; }
      if (S.kind === 'boss') {
        o.cool = ((o.hp < o.S.hp * 0.5 ? 1.3 : S.cool) + Math.random() * 0.6) * (0.6 + AI.cool[s] * 0.4);
        const r = Math.random();
        if (dist < 7) { // STOMP
          o.v[1] = 6; o.stomp = 0.6; sfx('roar', 300);
        } else if (r < 0.25 && mons.filter(m => m.kind === 'blob' && !m.dead).length < [3, 4, 6, 7][s]) {
          const b2 = spawnMon('blob', o.p[0] + (Math.random() - 0.5) * 3, o.p[1] + 1, o.p[2] + (Math.random() - 0.5) * 3); b2.awake = true; b2.react = G.t + 0.8; FX.poof(b2.p[0], b2.p[1], b2.p[2]); sfx('squig'); G.map.mons++;
          if (bossTalk++ % 3 === 0) center('The Giga-Blob wobbles out a baby blob!', 2);
        } else { const sp = 13 * AI.pspd[s]; for (let k = -1; k <= 1; k++) { const d = aimAt(T, ex, o.p[1] + 2.5, ez, sp); const an = k * 0.18; shoot('spit', [ex, o.p[1] + 2.5, ez], [d[0] * Math.cos(an) - d[2] * Math.sin(an), d[1] + 0.25, d[0] * Math.sin(an) + d[2] * Math.cos(an)], o, S.dmg, sp); } sfx('squig', 50); }
      }
    }
    // where a baddie aims: at you (or its enemy), maybe a bit ahead of you on the harder skills, with a wobble that gets worse
    // the further away you are and the faster you are running across its view
    function aimAt(T, x, y, z, speed) {
      const s = sk(), tv = T.v || [0, 0, 0], th = T === P ? 1.0 : T.h * 0.5;
      let tx = T.p[0], ty = T.p[1] + th, tz = T.p[2];
      const d0 = Math.hypot(tx - x, ty - y, tz - z) || 1, tof = d0 / (speed || 15), ld = AI.lead[s];
      tx += tv[0] * tof * ld; tz += tv[2] * tof * ld;
      const lat = Math.abs((tv[0] * (z - tz) + tv[2] * (tx - x)) / d0);
      const err = AI.err[s] * (1 + d0 / 30) * (1 + lat / 6), rnd = () => Math.random() + Math.random() - 1;
      const yaw = Math.atan2(tx - x, tz - z) + rnd() * err, pitch = Math.atan2(ty - y, Math.hypot(tx - x, tz - z)) + rnd() * err * 0.5;
      return [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    }
    function animMon(o, sp, dt) {
      const m = o.m, P_ = m.parts, k = Math.min(1, sp / 3), s = Math.sin(o.anim * 10) * 0.7 * k;
      if (P_.ll) {
        P_.ll.rotation.x = s; P_.rl.rotation.x = -s; P_.la.rotation.x = -s * 0.6;
        // the tell: the gun arm swings up (and wobbles) before a shot
        P_.ra.rotation.x = o.atk ? -1.55 + Math.sin(G.t * 30) * 0.06 : o.fireT > 0 ? -1.5 : (o.see ? -0.9 : s * 0.6); o.fireT = (o.fireT || 0) - dt;
        P_.head.rotation.y = o.awake ? 0 : Math.sin(o.anim * 0.8) * 0.5;
        if (P_.eye) P_.eye.scale.y = o.atk ? 1.8 : 1;
      } else {
        const hop = Math.abs(Math.sin(o.anim * (o.kind === 'boss' ? 3 : 9))) * (o.kind === 'boss' ? 0.4 : 0.35) * (o.kind === 'boss' ? 1 : k + 0.2);
        P_.body.position.y = (o.kind === 'boss' ? 2 : 0.5) + hop; P_.mouth.scale.y = o.biteT > 0 ? 2.2 : 1; o.biteT = (o.biteT || 0) - dt;
      }
      if (o.stomp > 0) { o.stomp -= dt; if (o.stomp <= 0 && o.ground) { FX.boom(o.p[0], o.p[1] + 0.3, o.p[2]); flashAt(o.p[0], o.p[1] + 1, o.p[2], [1, 0.6, 0.2], 9, 0.3); sfx('boom'); const d = Math.hypot(P.p[0] - o.p[0], P.p[2] - o.p[2]); if (d < 8 && P.ground) { damage(15 * (1 - d / 8) + 5, o.p, o); P.v[1] = 6; P.v[0] += (P.p[0] - o.p[0]) / d * 8; P.v[2] += (P.p[2] - o.p[2]) / d * 8; } } }
    }
    function place(o) { o.m.position.set(o.p[0], o.p[1], o.p[2]); o.m.rotation.y = o.yaw; const l = lightAt(o.p[0], o.p[1] + 1, o.p[2]); const f = (1 + o.flash * 2) * 1.5, fk = ctx.uFlick.value; o.m.mat.uniforms.lmul.value.set((l[0] + l[3] * fk) * f + 0.15, (l[1] + l[4] * fk) * f + 0.15, (l[2] + l[5] * fk) * f + 0.15); }
    // the player's own hits: a hit marker on the crosshair and a little tick
    function hitMon(o, dmg, from) { if (o.dead) return; G.hitT = G.t + 0.16; sfx('hit', 60); hurtMon(o, dmg, from || P); }
    function hurtMon(o, dmg, from) {
      if (o.dead) return;
      o.hp -= dmg; o.flash = 1; if (!o.awake) wake(o);
      // a monster that gets hit by another one turns on it (they never did get on)
      const mon = from && from !== P && from.S && from !== o;
      if (mon && from.kind !== o.kind && o.kind !== 'boss' && from.kind !== 'boss' && !from.dead) { if (o.foe !== from) { o.foe = from; o.atk = null; } o.foeT = G.t + 8; }
      if (o.hp > 0) {
        // pain: a good hit can put them off their shot
        if (dmg > 4 && o.atk && o.kind !== 'boss' && Math.random() < AI.pain[sk()]) { o.atk = null; o.cool = Math.max(o.cool, 0.35); o.still = G.t + 0.25; }
        if (dmg > 3 && Math.random() < 0.5) sfx(o.S.kind === 'bite' ? 'squig' : o.kind === 'boss' ? 'roar' : /robot/.test(o.kind) ? 'clang' : 'grot', 150);
        return;
      }
      o.dead = true; o.m.visible = false; G.map.kills++;
      const big = o.kind === 'boss' || /^big/.test(o.kind);
      FX.poof(o.p[0], o.p[1] + o.h * 0.4, o.p[2], big); sfx('poof');
      if (mon && from.kind !== 'boss') { if (!G.infight) { G.infight = true; say(`${cap(from.S.name)} poofed ${o.S.name}! They never did get on.`); } Apps.secret('fps.infight'); }
      if (o.kind === 'boss') bossDead(o);
    }
    const cap = s => s.replace(/^\w/, c => c.toUpperCase());
    function bossDead(o) {
      for (let k = 0; k < 6; k++) setTimeout(() => { if (FX) { FX.boom(o.p[0] + (Math.random() - 0.5) * 4, o.p[1] + Math.random() * 4, o.p[2] + (Math.random() - 0.5) * 4); flashAt(o.p[0], o.p[1] + 2, o.p[2], [1, 0.7, 0.3], 14, 0.3); } sfx('boom', 0); }, k * 220);
      mons.forEach(m => { if (!m.dead && m.kind === 'blob') hurtMon(m, 999); });
      center('The GIGA-BLOB went POOF!|The exit has opened.', 5);
      doors.forEach(d => { if (d.k === 'bossdoor') d.want = 1; });
      Apps.secret('fps.boss');
    }

    // ---------------------------------------------------------------- weapons, projectiles, damage
    const inLiquid = () => { const c = G.map.M.at(P.p[0], P.p[2]); return c.liq && P.p[1] + 1.2 < c.lv ? c.liq : null; };
    const hasAmmo = w => !WEAP[w].ammo || P.ammo[WEAP[w].ammo] >= (WEAP[w].use || 1);
    function fire() {
      const k = P.cur, wp = WEAP[k], use = wp.use || 1;
      if (P.cool > 0 || P.dead || P.swap > 0.05) return;
      if (wp.ammo && P.ammo[wp.ammo] < use) {
        // the double guns drop down to the single ones on their last round
        if (use > 1 && P.ammo[wp.ammo] > 0 && (P.wb & (1 << (k - 1)))) { P.cur = k - 1; P.swap = SWAP; return; }
        sfx('empty', 250); autoSwitch(); return;
      }
      P.cool = wp.rate; P.kick = 1; P.lastFire = G.t;
      if (wp.ammo) P.ammo[wp.ammo] -= use;
      const eye = [P.p[0], P.p[1] + P.eye, P.p[2]], d = E.fwd(P.yaw, P.pitch), q = P.quad > G.t ? 4 : 1;
      noise(eye);
      if (k > 0 && k !== 7 && muz) { const mz = MUZ8[k], vk2 = G.vmK || [1, 1], vy = (-0.115 + VMOFF8[k][1]); muz.fire(mz[0], vy * vk2[1] + (mz[1] - vy) * vk2[0], -0.24 + VMOFF8[k][2] + (mz[2] + 0.24 - VMOFF8[k][2]) * vk2[0], [0, 0.15, 0.2, 0.09, 0.12, 0.13, 0.17][k] * vk2[0], q > 1 ? [0.8, 0.6, 1] : [1, 1, 1]); G.mflash = 0.06; flashAt(eye[0] + d[0], eye[1] + d[1], eye[2] + d[2], q > 1 ? [0.6, 0.4, 1] : [1, 0.8, 0.45], k === 3 || k === 4 ? 5 : 7, 0.07); }
      if (q > 1) qs('quadfire', 120);
      if (k === 0) {
        sfx('choppa');
        const h = E.rayEnts(eye, d, 2.2, mons.filter(m => !m.dead));
        if (h) { hitMon(h.e, wp.dmg * q); FX.spray(eye[0] + d[0] * h.t, eye[1] + d[1] * h.t, eye[2] + d[2] * h.t, 6, [1, 1, 0.9], 3, 0.3); sfx('clang'); }
        else { const wl = G.map.M.ray(eye[0], eye[1], eye[2], d[0], d[1], d[2], 2.2); if (wl) { FX.spray(eye[0] + d[0] * wl, eye[1] + d[1] * wl, eye[2] + d[2] * wl, 5, [1, 0.9, 0.5], 2.5, 0.25); qs('thunk', 80); shotWall(eye[0] + d[0] * (wl + 0.1), eye[1] + d[1] * (wl + 0.1), eye[2] + d[2] * (wl + 0.1)); } }
        return;
      }
      if (k === 1 || k === 2) { qs(k === 2 ? 'ssg' : 'sg'); pellets(eye, d, wp.pel, wp.sx, wp.sy, wp.dmg * q); P.punch = k === 2 ? 0.05 : 0.03; return; }
      if (k === 3 || k === 4) {
        qs(k === 4 ? 'nail2' : 'nail', 40); P.alt = !P.alt; P.spin = 1;
        const side = P.alt ? -0.08 : 0.08, o = [eye[0] + d[0] * 0.5 + side * Math.cos(P.yaw), eye[1] - 0.15, eye[2] + d[2] * 0.5 - side * Math.sin(P.yaw)];
        shoot(k === 4 ? 'teef2' : 'teef', o, d, P, wp.dmg * q); P.punch = 0.008; return;
      }
      if (k === 5) { qs('gren'); const gd = E.fwd(P.yaw, Math.min(1.4, P.pitch + 0.14)); shoot('gren', [eye[0] + d[0] * 0.5, eye[1] - 0.2, eye[2] + d[2] * 0.5], gd, P, wp.dmg * q); P.punch = 0.04; return; }
      if (k === 6) { sfx('launch'); shoot('rokkit', [eye[0] + d[0] * 0.6, eye[1] - 0.2, eye[2] + d[2] * 0.6], d, P, wp.dmg * q); P.punch = 0.05; return; }
      if (k === 7) zap(eye, d, wp.dmg * q);
    }
    // the Boomsticks: a handful of pellets each, added up per baddie so one blast is one big hit
    function pellets(o, d, n, sx, sy, dmg) {
      const M = G.map.M, live = mons.filter(m => !m.dead), acc = new Map();
      for (let k = 0; k < n; k++) {
        const s = [d[0] + (Math.random() - 0.5) * sx, d[1] + (Math.random() - 0.5) * sy, d[2] + (Math.random() - 0.5) * sx], l = Math.hypot(s[0], s[1], s[2]); s[0] /= l; s[1] /= l; s[2] /= l;
        const wall = M.ray(o[0], o[1], o[2], s[0], s[1], s[2], 80) || 80, h = E.rayEnts(o, s, wall, live);
        if (h) { acc.set(h.e, (acc.get(h.e) || 0) + dmg); FX.spray(o[0] + s[0] * h.t, o[1] + s[1] * h.t, o[2] + s[2] * h.t, 2, [1, 1, 0.85], 2.5, 0.3); continue; }
        const x = o[0] + s[0] * wall, y = o[1] + s[1] * wall, z = o[2] + s[2] * wall;
        if (k % 2 === 0) FX.spray(x - s[0] * 0.05, y - s[1] * 0.05, z - s[2] * 0.05, 2, [0.6, 0.55, 0.45], 2, 0.3);
        shotWall(x + s[0] * 0.1, y + s[1] * 0.1, z + s[2] * 0.1);
      }
      for (const [m, dd] of acc) hitMon(m, dd);
    }
    // the Zapper: a crackling beam (and never, ever use it in the bath)
    function zap(o, d, dmg) {
      const M = G.map.M, wet = inLiquid();
      if (wet === 'water' || wet === 'slime') {
        const n = P.ammo.cells + 1; P.ammo.cells = 0; qs('fizz');
        for (const m of mons) { if (m.dead) continue; const mc = M.at(m.p[0], m.p[2]); if (mc.liq && m.p[1] < mc.lv && Math.hypot(m.p[0] - P.p[0], m.p[2] - P.p[2]) < 14) hitMon(m, n * 6); }
        for (let k = 0; k < 4; k++) FX.spray(P.p[0], P.p[1] + 1, P.p[2], 25, [0.6, 0.9, 1], 9, 0.5, 0);
        flashAt(P.p[0], P.p[1] + 1, P.p[2], [0.5, 0.8, 1], 14, 0.4);
        center('FZZZT! Never use a Zapper in the bath.|Your hair is standing on end.', 3); Apps.secret('fps.fizz');
        damage(Math.min(40, 5 + n), null, { S: { name: 'their own Zapper. In the bath' } });
        return;
      }
      const wall = M.ray(o[0], o[1], o[2], d[0], d[1], d[2], 24) || 24, h = E.rayEnts(o, d, wall, mons.filter(m => !m.dead));
      const len = h ? h.t : wall, end = [o[0] + d[0] * len, o[1] + d[1] * len, o[2] + d[2] * len];
      if (h) hitMon(h.e, dmg); else if (Math.random() < 0.5) FX.spray(end[0] - d[0] * 0.1, end[1] - d[1] * 0.1, end[2] - d[2] * 0.1, 3, [0.7, 0.9, 1], 3, 0.25);
      G.zap = { end, t: 0.12 }; qs('zap', 95); flashAt(end[0] - d[0] * 0.5, end[1], end[2] - d[2] * 0.5, [0.4, 0.7, 1], 8, 0.12);
    }
    // auto-fire for the on-screen sticks: shoot when a monster is right in the crosshair, with a gentle nudge onto it
    function autoAim(dt) {
      const d = E.fwd(P.yaw, P.pitch), o = [P.p[0], P.p[1] + P.eye, P.p[2]], M = G.map.M; let best = null, ba = 0.17;
      const reach = P.cur === 0 ? 2.2 : P.cur === 7 ? 24 : 40;
      for (const m of mons) { if (m.dead || !m.awake) continue; const tx = m.p[0] - o[0], ty = m.p[1] + m.h * 0.55 - o[1], tz = m.p[2] - o[2], l = Math.hypot(tx, ty, tz); if (l > reach) continue; const a = Math.acos(clamp((tx * d[0] + ty * d[1] + tz * d[2]) / l, -1, 1)); if (a < ba && M.los(o[0], o[1], o[2], m.p[0], m.p[1] + m.h * 0.55, m.p[2], 0.3)) { ba = a; best = { tx, ty, tz, l }; } }
      if (!best) return false;
      const wy = Math.atan2(-best.tx, -best.tz), wp = Math.atan2(best.ty, Math.hypot(best.tx, best.tz)), dy = angDiff(wy - P.yaw);
      P.yaw += clamp(dy, -1.2 * dt, 1.2 * dt); P.pitch += clamp(wp - P.pitch, -0.8 * dt, 0.8 * dt);
      // don't blow yourself up: no rockets or grenades at point blank
      if ((P.cur === 5 || P.cur === 6) && best.l < 4) return false;
      return ba < 0.1;
    }
    function noise(at) { for (const o of mons) if (!o.awake && !o.dead && Math.hypot(o.p[0] - at[0], o.p[2] - at[2]) < 14) wake(o); }
    function shotWall(x, y, z) { const c = G.map.M.at(x, z); const dr = doors.find(q => q.c === c); if (dr && dr.k === 'secretdoor' && !dr.want) { dr.want = 1; dr.stay = 1e9; sfx('door'); } }
    // bolts and things that fly. glow: lit up and lights the walls as it goes
    const PROJ = {
      teef: { speed: 50, grav: 0, life: 3, size: [0.06, 0.06, 0.32], col: 0xfffff0, splash: 0 },
      teef2: { speed: 50, grav: 0, life: 3, size: [0.1, 0.1, 0.42], col: 0xffe0a0, splash: 0 },
      rokkit: { speed: 26, grav: 0, life: 6, size: [0.22, 0.22, 0.34], col: 0xe8381b, splash: 3.8, glow: [1, 0.55, 0.2] },
      gren: { speed: 17, grav: 16, life: 2.4, size: [0.2, 0.2, 0.24], col: 0x4a5a2a, splash: 3.6, bounce: 1 },
      spit: { speed: 13, grav: 9, life: 5, size: [0.5, 0.5, 0.5], col: 0x80c020, splash: 2.6, glow: [0.4, 0.9, 0.2] },
      fire: { speed: 12.5, grav: 0, life: 4, size: [0.16, 0.16, 0.16], col: 0xff8a20, splash: 0, glow: [1, 0.5, 0.15], full: 1 },
      laser: { speed: 17, grav: 0, life: 4, size: [0.08, 0.08, 0.6], col: 0x70e8ff, splash: 0, glow: [0.3, 0.75, 1], full: 1 },
    };
    function shoot(kind, o, d, owner, dmg, speed) {
      const S = PROJ[kind], sp = speed || S.speed;
      const extra = kind === 'rokkit' ? [['f', 0.36, 0.04, 0.12, 0, 0, 0.12, 0x5a6a3a], ['e', 0.06, 0.06, 0.02, 0, 0.06, -0.17, 0xffffff]] : kind === 'gren' ? [['b', 0.24, 0.05, 0.05, 0, 0.06, 0, 0x2a2a1a], ['p', 0.05, 0.08, 0.05, 0, 0.13, 0, 0xc0c0c0]] : kind === 'fire' ? [['c', 0.1, 0.1, 0.1, 0, 0, 0, 0xffe080]] : [];
      const m = E.model(ctx, [['a', S.size[0], S.size[1], S.size[2], 0, 0, 0, S.col]].concat(extra), { full: S.full ? 1.3 : 0.8 });
      m.position.set(o[0], o[1], o[2]); m.lookAt(o[0] - d[0], o[1] - d[1], o[2] - d[2]); ctx.scene.add(m);
      projs.push({ kind, S, p: o.slice(), v: [d[0] * sp, d[1] * sp, d[2] * sp], owner, dmg, life: S.life, m, t: 0 });
    }
    function updProjs(dt) {
      const M = G.map.M;
      for (const pr of projs) {
        if (pr.dead) continue;
        pr.life -= dt; pr.t += dt; pr.v[1] -= pr.S.grav * dt;
        const st = Math.max(1, Math.ceil(Math.hypot(pr.v[0], pr.v[1], pr.v[2]) * dt / 0.3));
        let hit = null;
        for (let k = 0; k < st && !hit; k++) {
          const nx = pr.p[0] + pr.v[0] * dt / st, ny = pr.p[1] + pr.v[1] * dt / st, nz = pr.p[2] + pr.v[2] * dt / st;
          const targets = pr.owner === P ? mons : (pr.owner && pr.owner.kind === 'boss' ? [P] : [P].concat(mons.filter(m => m !== pr.owner)));
          for (const t of targets) { if (t.dead) continue; const pad = pr.kind === 'fire' || pr.kind === 'spit' ? 0.2 : 0.12; if (Math.abs(t.p[0] - nx) < (t.r || 0.4) + pad && Math.abs(t.p[2] - nz) < (t.r || 0.4) + pad && ny > t.p[1] - 0.1 && ny < t.p[1] + (t.h || 1.7)) { hit = t; break; } }
          if (!hit && !Grid.open(M, nx, ny, nz)) {
            if (pr.S.bounce) { // grenades bounce off whatever they hit, and roll to a stop
              const sp0 = Math.hypot(pr.v[0], pr.v[1], pr.v[2]);
              if (!Grid.open(M, nx, pr.p[1], pr.p[2])) pr.v[0] *= -0.55;
              if (!Grid.open(M, pr.p[0], ny, pr.p[2])) { pr.v[1] *= -0.45; pr.v[0] *= 0.7; pr.v[2] *= 0.7; if (Math.abs(pr.v[1]) < 1.3) pr.v[1] = 0; }
              if (!Grid.open(M, pr.p[0], pr.p[1], nz)) pr.v[2] *= -0.55;
              if (sp0 > 3) qs('bounce', 90, pr.p);
              break;
            }
            hit = 'wall'; if (pr.owner === P) shotWall(nx, ny, nz);
          }
          if (!hit) { pr.p[0] = nx; pr.p[1] = ny; pr.p[2] = nz; }
        }
        if (hit || pr.life <= 0) {
          pr.dead = true; ctx.scene.remove(pr.m); pr.m.traverse(x => x.geometry && x.geometry.dispose());
          if (pr.S.splash) explode(pr.p, pr.S.splash, pr.dmg, pr.owner, hit !== 'wall' ? hit : null);
          else if (hit && hit !== 'wall') { if (hit === P) damage(pr.dmg, pr.p, pr.owner); else if (pr.owner === P) hitMon(hit, pr.dmg); else hurtMon(hit, pr.dmg, pr.owner); FX.spray(pr.p[0], pr.p[1], pr.p[2], 3, [1, 1, 0.9], 2, 0.3); }
          else FX.spray(pr.p[0] - pr.v[0] * 0.01, pr.p[1], pr.p[2] - pr.v[2] * 0.01, pr.S.glow ? 6 : 3, pr.S.glow || [0.9, 0.85, 0.7], 2, 0.3);
          continue;
        }
        pr.m.position.set(pr.p[0], pr.p[1], pr.p[2]);
        if (pr.S.bounce) { pr.m.rotation.x += dt * 9; pr.m.rotation.z += dt * 5; if (Math.random() < 0.4) FX.emit(pr.p[0], pr.p[1] + 0.1, pr.p[2], 0, 0.6, 0, [0.6, 0.6, 0.55], 0.5, -1); }
        if (pr.kind === 'rokkit' && Math.random() < 0.7) FX.emit(pr.p[0], pr.p[1], pr.p[2], (Math.random() - 0.5), 0.5, (Math.random() - 0.5), [0.7, 0.65, 0.6], 0.6, -1);
        if (pr.kind === 'spit') FX.emit(pr.p[0], pr.p[1], pr.p[2], 0, 0, 0, [0.5, 0.9, 0.2], 0.4, 2);
        if (pr.kind === 'fire') { pr.m.rotation.x += dt * 11; pr.m.rotation.y += dt * 7; if (Math.random() < 0.6) FX.flash(pr.p[0], pr.p[1], pr.p[2], 0.45 + Math.random() * 0.2, [1, 0.55 + Math.random() * 0.3, 0.15]); }
        if (pr.kind === 'fire' && Math.random() < 0.8) FX.emit(pr.p[0], pr.p[1], pr.p[2], (Math.random() - 0.5) * 0.6, 0.4, (Math.random() - 0.5) * 0.6, [1, 0.5 + Math.random() * 0.3, 0.1], 0.35, -1);
        if (pr.kind === 'laser' && Math.random() < 0.5) FX.emit(pr.p[0], pr.p[1], pr.p[2], 0, 0, 0, [0.5, 0.9, 1], 0.2, 0);
      }
      projs = projs.filter(p => !p.dead);
    }
    function explode(at, rad, dmg, owner, direct) {
      FX.boom(at[0], at[1], at[2]); sfx('boom', 40); noise(at); flashAt(at[0], at[1] + 0.3, at[2], [1, 0.62, 0.25], 11, 0.32);
      if (Math.hypot(P.p[0] - at[0], P.p[2] - at[2]) < 9) G.shake = Math.max(G.shake || 0, 0.35 * (1 - Math.hypot(P.p[0] - at[0], P.p[2] - at[2]) / 9));
      for (const o of mons) {
        if (o.dead || (o === owner && owner !== P)) continue;
        const d = Math.hypot(o.p[0] - at[0], o.p[1] + o.h / 2 - at[1], o.p[2] - at[2]);
        const hm = owner === P ? hitMon : hurtMon;
        if (o === direct) hm(o, dmg, owner); else if (d < rad + o.r) hm(o, dmg * (1 - d / (rad + o.r)) * 0.8, owner);
      }
      const d = Math.hypot(P.p[0] - at[0], P.p[1] + 0.9 - at[1], P.p[2] - at[2]);
      if (d < rad + 0.4 && !P.dead) {
        const k = 1 - d / (rad + 0.4);
        // the rocket jump: your own blast throws you up into the air
        const push = (owner === P ? 13 : 8) * k, nx = (P.p[0] - at[0]) / (d || 1), ny = (P.p[1] + 0.9 - at[1]) / (d || 1), nz = (P.p[2] - at[2]) / (d || 1);
        P.v[0] += nx * push; P.v[1] += Math.max(0.4, ny) * push * 1.1; P.v[2] += nz * push; P.ground = false;
        if (owner === P) { P.sj = { y: P.p[1], t: G.t }; }
        damage(dmg * k * (owner === P ? 0.45 : 0.8), at, owner, true);
      }
    }
    function damage(n, from, by, splash) {
      if (P.dead || n <= 0) return;
      if (P.god) { P.hurtT = 0.1; return; }
      if (P.inv > G.t) { qs('ting', 200); return; } // the Lucky Star: nothing gets through
      const s = sk();
      if (by && by.S && by.kind) n *= AI.dmg[s]; else if (s === 0) n *= 0.5; // baddies hit softer on the easy skills
      const absorb = P.at === 2 ? 0.6 : P.at === 1 ? 0.3 : 0, a = Math.min(P.ar, n * absorb);
      P.ar -= a; P.hp -= n - a; P.hurtT = Math.min(0.6, 0.15 + n / 50); P.ouch = G.t + 0.4; if (P.ar <= 0) { P.ar = 0; P.at = 0; }
      if (from) { const dx = from[0] - P.p[0], dz = from[2] - P.p[2]; P.look = Math.sign(Math.sin(Math.atan2(-dx, -dz) - P.yaw)); if (Math.hypot(dx, dz) > 0.3) G.hurtDirs = (G.hurtDirs || []).filter(h => h.t > G.t).concat([{ a: Math.atan2(-dx, -dz), t: G.t + 1.1, k: Math.min(1, n / 25 + 0.35) }]).slice(-4); }
      sfx('hurt', 150); G.shake = Math.max(G.shake || 0, Math.min(0.25, n / 80));
      if (P.hp <= 0) die(by);
    }
    function die(by) {
      P.dead = true; P.hp = 0; P.deadT = G.t;
      const who = by && by.S ? by.S.name : by === P ? 'your own rocket' : 'something';
      con(`${cfg.name} was poofed by ${who}`); center(`You got POOFED by ${who}!|Click or press SPACE to try again.`, 99);
      sfx('die');
    }
    // out of ammo: pick the best gun that still has some, like the real thing (never the explosive ones, never the Zapper underwater)
    function autoSwitch() { const wet = inLiquid(); for (const w of [7, 4, 2, 3, 1, 0]) { if (w === 7 && wet) continue; if ((P.wb & (1 << w)) && hasAmmo(w)) { if (P.cur !== w) { P.cur = w; P.swap = SWAP; } return; } } }
    function selectW(w) { if (w < 0 || w >= NWEAP || !(P.wb & (1 << w))) return; if (!hasAmmo(w)) { say('Not enough ammo.'); sfx('empty', 200); return; } if (P.cur !== w) { P.cur = w; P.swap = SWAP; qs('swap', 60); } }
    function cycleW(dir) { for (let k = 1; k <= NWEAP; k++) { const n = (P.cur + dir * k + NWEAP * 2) % NWEAP; if ((P.wb & (1 << n)) && hasAmmo(n)) { selectW(n); return; } } }

    // ---------------------------------------------------------------- items, doors, lifts, triggers
    function pickups() {
      for (const it of items) {
        if (it.got) continue;
        if (Math.hypot(it.p[0] - P.p[0], it.p[2] - P.p[2]) > 0.95 || Math.abs(it.p[1] - P.p[1]) > 1.4) continue;
        const e = it.e, A = P.ammo; let ok = true, msg = '', snd = 'pickup';
        const ammo = (k, n) => { if (A[k] >= AMMO[k]) return false; A[k] = Math.min(AMMO[k], A[k] + n); return true; };
        const gun = (w, k, n, name) => { const had = P.wb & (1 << w); P.wb |= 1 << w; A[k] = Math.min(AMMO[k], A[k] + n); msg = `You got the ${name}!`; snd = 'weapon'; if (!had) { selectW(w); G.newW = { w, t: G.t + 1.2 }; } };
        if (e === 'health') { if (P.hp >= 100) ok = false; else { P.hp = Math.min(100, P.hp + 15); msg = 'You receive 15 health (a pork pie)'; snd = 'health'; } }
        else if (e === 'mega') { P.hp = Math.min(200, P.hp + 100); msg = 'MEGA PIE! +100 health'; snd = 'health'; }
        else if (e === 'armour1') { if (P.at >= 1 && P.ar >= 100) ok = false; else { P.ar = Math.max(P.ar, 100); P.at = Math.max(P.at, 1); msg = 'You got the Green Tin Armour'; } }
        else if (e === 'armour2') { P.ar = Math.max(P.ar, 150); P.at = 2; msg = 'You got the Yellow Scrap Armour'; }
        else if (e === 'shells') { ok = ammo('shells', 20); msg = 'You got 20 shells'; }
        else if (e === 'teef') { ok = ammo('teef', 30); msg = 'You got 30 rivets'; }
        else if (e === 'rokkits') { ok = ammo('rokkits', 5); msg = 'You got 5 rockets'; }
        else if (e === 'cells') { ok = ammo('cells', 15); msg = 'You got 15 zap cells'; }
        else if (e === 'silverkey' || e === 'goldkey') { P.keys[e[0]] = true; msg = `You got the ${e === 'silverkey' ? 'silver' : 'gold'} key`; snd = 'key'; }
        else if (e === 'boom2') gun(2, 'shells', 5, 'DOUBLE BOOMSTICK');
        else if (e === 'teefgun') gun(3, 'teef', 30, 'RIVET GUN');
        else if (e === 'srivet') gun(4, 'teef', 30, 'SUPER RIVET GUN');
        else if (e === 'grenade') gun(5, 'rokkits', 5, 'GRENADE JACK');
        else if (e === 'launcher') gun(6, 'rokkits', 5, 'ROCKET JACK');
        else if (e === 'zapper') gun(7, 'cells', 15, 'ZAPPER');
        else if (e === 'waaagh') { P.quad = G.t + 30; msg = 'QUAD JACK! Everything you hit gets hit four times as hard!'; snd = 'big'; }
        else if (e === 'star') { P.inv = G.t + 30; msg = 'LUCKY STAR! Nothing can hurt you for 30 seconds!'; snd = '*star'; }
        else if (e === 'wellies') { P.suit = G.t + 30; msg = 'MOM\'S WELLIES! Slime-proof for 30 seconds. Wipe your feet.'; snd = '*star'; }
        if (!ok) continue;
        it.got = true; it.m.visible = false; say(msg); G.flashT = 0.15;
        if (snd[0] === '*') qs(snd.slice(1)); else sfx(snd);
        FX.spray(it.p[0], it.p[1] + 0.4, it.p[2], 6, [1, 0.95, 0.6], 2, 0.35, 0);
      }
    }
    function updDoors(dt) {
      const M = G.map.M;
      for (const d of doors) {
        const cx = (d.c.i + 0.5) * M.S, cz = (d.c.j + 0.5) * M.S, near = Math.hypot(P.p[0] - cx, P.p[2] - cz) < 3.2 && !P.dead;
        if (near && d.k !== 'secretdoor' && d.k !== 'bossdoor') {
          const need = d.k === 'silver' ? 's' : d.k === 'gold' ? 'g' : '';
          if (need && !P.keys[need]) { if (!d.nagT || G.t > d.nagT) { center(`You need the ${need === 's' ? 'silver' : 'gold'} key`, 2); d.nagT = G.t + 3; sfx('talk'); } }
          else { if (!d.want) sfx('door', 300); d.want = 1; d.stay = need ? 1e9 : G.t + 3; }
        }
        if (d.k === 'door' && d.want && G.t > d.stay && !near && !mons.some(o => !o.dead && M.at(o.p[0], o.p[2]) === d.c)) d.want = 0;
        if (d.want && d.group) d.group.forEach(o => { if (!o.want) { o.want = d.want; o.stay = d.stay; } else o.stay = Math.max(o.stay, d.stay); });
        const sp = d.k === 'secretdoor' ? 0.5 : 1.4;
        d.open += clamp(d.want - d.open, -sp * dt, sp * dt);
        const bottom = d.f + d.open * (d.h - 0.1);
        d.c.c = d.open > 0.001 ? bottom : d.f;
        d.mesh.position.y = bottom + d.h / 2;
        d.mesh.visible = d.open < 0.999;
        // monsters open plain doors too
        if (d.k === 'door' && !d.want) for (const o of mons) if (o.awake && !o.dead && Math.hypot(o.p[0] - cx, o.p[2] - cz) < 2.6) { d.want = 1; d.stay = G.t + 3; break; }
      }
      for (const L of lifts) {
        const occ = !P.dead && P.ground && G.map.M.at(P.p[0], P.p[2]) === L.c;
        if (occ && !L.occ && L.dir === 0) { L.dir = L.y <= L.lo + 0.01 ? 1 : -1; L.wait = 0.4; sfx('lift', 500); }
        if (!occ && L.dir === 0 && L.y > L.lo + 0.01) { L.idle = (L.idle || 0) + dt; if (L.idle > 3) { L.dir = -1; L.wait = 0; sfx('lift', 500); } } else L.idle = 0;
        L.occ = occ;
        if (L.wait > 0) L.wait -= dt;
        else if (L.dir) { L.y += L.dir * 2.2 * dt; if (L.y >= L.hi) { L.y = L.hi; L.dir = 0; } if (L.y <= L.lo) { L.y = L.lo; L.dir = 0; } }
        L.c.f = L.y; L.mesh.position.y = L.y - 0.2;
      }
    }
    function triggers() {
      const M = G.map.M, c = M.at(P.p[0], P.p[2]);
      for (const t of trig) {
        if (t.done || c.i !== t.i || c.j !== t.j) continue;
        if (t.k === 'msg') { t.done = true; center(G.map.md.msgs[t.n] || '...', 5); sfx('talk'); }
        else if (t.k === 'secret') { t.done = true; G.map.secrets++; center('You found a secret area!', 3); sfx('secret'); foundSecret(); }
        else if (t.k === 'exit' && P.p[1] < c.f + 0.6) { endMap(); return; }
      }
    }
    function foundSecret() {
      // remember which secret cells were found per map so "all secrets" works across sessions
      const key = 'jhp_fps_sec'; const s = store.get(key, {}); trig.filter(t => t.k === 'secret' && t.done).forEach(t => { s[G.map.id + '@' + t.i + ',' + t.j] = 1; }); store.set(key, s);
      const total = Object.keys(ROWS).reduce((n, id) => n + ROWS[id].join('').split('$').length - 1, 0);
      if (Object.keys(s).length >= total) Apps.secret('fps.secrets');
    }
    function endMap() {
      const m = G.map, tm = Math.floor(G.t - m.t0);
      G.state = 'inter'; G.inter = { kills: m.kills, mons: m.mons, sec: m.secrets, nsec: m.nsec, time: `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}`, id: m.id, t: G.t };
      sfx('tele'); input.unlock();
    }

    // ---------------------------------------------------------------- the console
    const CMDS = {
      help: () => con('Commands: god, noclip, notarget, give all, impulse 9, map <e1m1|e1m2|e1m3>, kill, name <you>, fov <50-130>,\nsensitivity <0.2-5>, skill <0-3>, r_res <150-400>, r_dynamic, invert, clear, version, echo <text>, quit\nPGUP / PGDN scroll this console.'),
      cmdlist: () => CMDS.help(),
      god: () => { P.god = !P.god; con(P.god ? 'godmode ON' : 'godmode OFF'); },
      noclip: () => { P.noclip = !P.noclip; con(P.noclip ? 'noclip ON' : 'noclip OFF'); },
      notarget: () => { P.notarget = !P.notarget; con(P.notarget ? 'notarget ON' : 'notarget OFF'); },
      fly: () => CMDS.noclip(),
      give: a => { if (/all|^$/.test(a || '')) { P.wb = 255; P.ammo = Object.assign({}, AMMO); P.keys = { s: true, g: true }; P.ar = 200; P.at = 2; con('You got everything. Cheater.'); } else con('give all'); },
      impulse: a => { if (a === '9') CMDS.give('all'); else if (a === '255') { P.quad = G.t + 30; con('QUAD JACK!'); } else con('impulse ' + a + ': nothing happens'); },
      map: a => { if (!a) { con('maps: ' + Object.keys(MAPS).map(k => k + ' (' + MAPS[k].title + ')').join(', ')); return; } if (!MAPS[a]) { con(`Can't find maps/${a}.bsp`); return; } G.con = false; load(a); },
      kill: () => { if (!P.dead && G.state === 'play') { P.hp = 0; die(P); con(cfg.name + ' suicides'); } },
      name: a => { if (!a) { con('"name" is "' + cfg.name + '"'); return; } cfg.name = a.replace(/[^\w \-!.?']/g, '').slice(0, 16) || 'Player'; save(); con('name changed to ' + cfg.name); },
      fov: a => { const v = +a; if (!a) { con('"fov" is "' + cfg.fov + '"'); return; } if (v >= 50 && v <= 130) { cfg.fov = v; ctx.fovH = v; ctx.resize(); save(); con('fov ' + v); } else con('fov must be 50 to 130'); },
      sensitivity: a => { const v = +a; if (!a) { con('"sensitivity" is "' + cfg.sens + '"'); return; } if (v >= 0.2 && v <= 5) { cfg.sens = v; save(); } else con('0.2 to 5, please'); },
      skill: a => { const v = +a; if (a === '' || a == null) { con('skill is ' + cfg.skill + ' (' + SKILL[cfg.skill] + ')'); return; } if (v >= 0 && v <= 3) { cfg.skill = v | 0; save(); con('skill will be ' + SKILL[cfg.skill] + ' (restart the map)'); } },
      r_res: a => { const v = +a; if (v >= 150 && v <= 480) { cfg.res = v; ctx.res = v; ctx.resize(); save(); con('r_res ' + v + ' lines'); } else con('"r_res" is "' + ctx.res + '" (150 to 480)'); },
      vid_mode: a => CMDS.r_res(a === '0' ? '200' : a === '1' ? '240' : a === '2' ? '400' : a),
      invert: () => { cfg.invert = !cfg.invert; save(); con('invert mouse ' + (cfg.invert ? 'ON' : 'OFF')); },
      clear: () => { G.conLines = []; },
      version: () => con(`JAQUAKE v${VERSION} (shareware) built Mar 17 1999. Jackware Software.\nCode by Jack (age 15) and his brain. Maps by Jack. Testing by Callum (he says he found 4 bugs, he found 1).`),
      echo: a => con(a || ''),
      quit: () => quit(),
      exit: () => quit(),
      iddqd: () => wrong(), idkfa: () => wrong(), idclip: () => wrong(),
      bind: () => con('Keys are fixed. Jack\'s dad said so.'),
      connect: () => con('No multiplayer in the shareware version. Try JACKREAL TOURNAMENT for that (Start > Programs > Games).'),
      callum: () => con('CALLUM.EXE: "My PC is a 450 MHz, overclocked to 504. It does 90 fps on this. Yours does about 12."'),
      dave: () => con('Dave says: "Is it on the ULTRA 64? No? Then I\'m not interested." (He is very interested.)'),
      luke: () => con('Luke says: "This would be better with a Rumble Pak."'),
      timerefresh: () => con('3.4 seconds (128 frames). Your PC is fine. Callum\'s is faster.'),
      sv_gravity: a => con('sv_gravity is locked in single player. Try Space Station Jack in JRT for low gravity.'),
      r_speeds: () => { G.speeds = !G.speeds; },
      r_dynamic: () => { cfg.dl = cfg.dl === false; save(); con('dynamic lights ' + (cfg.dl === false ? 'OFF' : 'ON')); },
      cl_bob: () => { cfg.bob = cfg.bob === false; save(); con('view bob ' + (cfg.bob === false ? 'OFF' : 'ON')); },
      rocketjump: () => con('Point down, jump, fire Rocket Jack. Mind your health.'),
    };
    function wrong() { con('Wrong game, mate! This isn\'t that one. But fine...'); P.god = true; con('godmode ON'); Apps.secret('fps.iddqd'); sfx('secret'); }
    function run(line) {
      con(']' + line);
      const [c0, ...rest] = line.trim().split(/\s+/), c = (c0 || '').toLowerCase(), a = rest.join(' ');
      if (!c) return;
      if (CMDS[c]) CMDS[c](a); else con(`Unknown command "${c0}"`);
    }
    function conKey(ev) {
      const k = ev.key;
      if (k === 'Enter') { const l = G.conIn; G.conIn = ''; if (l.trim()) { G.conHist.unshift(l); G.conHist = G.conHist.slice(0, 30); } G.conPos = -1; run(l); }
      else if (k === 'Backspace') G.conIn = G.conIn.slice(0, -1);
      else if (k === 'ArrowUp') { G.conPos = Math.min(G.conHist.length - 1, G.conPos + 1); G.conIn = G.conHist[G.conPos] || ''; }
      else if (k === 'ArrowDown') { G.conPos = Math.max(-1, G.conPos - 1); G.conIn = G.conPos >= 0 ? G.conHist[G.conPos] : ''; }
      else if (k === 'PageUp') G.conScroll = (G.conScroll || 0) + 6;
      else if (k === 'PageDown') G.conScroll = Math.max(0, (G.conScroll || 0) - 6);
      else if (k === 'Tab') { const m = Object.keys(CMDS).filter(x => x.startsWith(G.conIn.toLowerCase())); if (m.length === 1) G.conIn = m[0] + ' '; else if (m.length) con(m.join('  ')); }
      else if (k.length === 1 && G.conIn.length < 60) G.conIn += k;
    }

    // ---------------------------------------------------------------- menus (drawn on the HUD canvas, mouse/keys/taps)
    // items: [label, action, disabled, colour]. Labels with ': ' are "setting: value" rows (drawn in two columns).
    const onOff = b => b ? 'ON' : 'OFF';
    const MENU = {
      main: () => ({ title: 'JAQUAKE', main: true, items: [G.map && G.state === 'play' ? ['Back to Game', resume, false, '#ffe8a0'] : null, ['Single Player', () => { G.menu = MENU.skill(); }], ['PLAY ONLINE NOW', () => toMP('quick'), false, 'green'], ['Multiplayer', () => { G.menu = MENU.mp(); }], ['Options', () => { G.menu = MENU.opts(); }], ['Help / Ordering', () => { G.menu = MENU.help(); }], ['Quit', quit]].filter(Boolean) }),
      mp: () => ({ title: 'MULTIPLAYER', text: ['Deathmatch and co-op on JackNet.', 'The [JackNet] servers are on 24/7: if', 'nobody is about, bots play with you.'], items: [['PLAY ONLINE NOW', () => toMP('quick'), false, 'green'], ['Co-op vs the monsters', () => toMP('coop')], ['Find a server', () => toMP('browser')], ['Practice deathmatch (bots)', () => toMP('practice')], ['Rankings', () => toMP('top')], ['Back', () => { G.menu = MENU.main(); }]] }),
      skill: () => { const m = { title: 'CHOOSE SKILL', text: ['NORMAL is just right if you are new.', 'NIGHTMARE is for Callum.'], items: SKILL.map((s, i) => [s, () => { cfg.skill = i; save(); G.menu = MENU.episode(); }]).concat([['Back', () => { G.menu = MENU.main(); }]]) }; m.sel = clamp(cfg.skill | 0, 0, 3); return m; },
      episode: () => ({ title: 'EPISODE 1', text: [`SKILL: ${SKILL[cfg.skill | 0]}`], items: Object.keys(MAPS).map((k, i) => [`${k.toUpperCase()}: ${MAPS[k].title}`, () => { if (i + 1 > (cfg.got || 1)) { sfx('talk'); return; } load(k); grab(); }, i + 1 > (cfg.got || 1)]).concat([['Episode 2 (registered only)', () => { G.menu = MENU.order(); }, true], ['Back', () => { G.menu = MENU.skill(); }]]) }),
      opts: () => ({ title: 'OPTIONS', small: true, text: window.Sound && Sound.on ? null : ['(SOUND IS SWITCHED OFF IN JACKOS)'], items: [[`Mouse speed: ${cfg.sens.toFixed(1)}`, () => { cfg.sens = cfg.sens >= 3 ? 0.4 : +(cfg.sens + 0.2).toFixed(1); save(); G.menu = MENU.opts(); }], [`Invert mouse: ${cfg.invert ? 'YES' : 'NO'}`, () => { cfg.invert = !cfg.invert; save(); G.menu = MENU.opts(); }],
        [`Screen size: ${ctx.res} lines`, () => { const L = [150, 200, 240, 300, 400]; cfg.res = L[(L.indexOf(ctx.res) + 1) % L.length] || 200; ctx.res = cfg.res; ctx.resize(); save(); G.menu = MENU.opts(); }], [`Field of view: ${cfg.fov}`, () => { cfg.fov = cfg.fov >= 120 ? 75 : cfg.fov + 15; ctx.fovH = cfg.fov; ctx.resize(); save(); G.menu = MENU.opts(); }],
        [`Weapon bob: ${onOff(cfg.bob !== false)}`, () => { cfg.bob = cfg.bob === false; save(); G.menu = MENU.opts(); }], [`Crosshair: ${onOff(cfg.xhair !== false)}`, () => { cfg.xhair = cfg.xhair === false; save(); G.menu = MENU.opts(); }],
        [`Dynamic lights: ${onOff(cfg.dl !== false)}`, () => { cfg.dl = cfg.dl === false; save(); G.menu = MENU.opts(); }], [`Always run: ${onOff(cfg.run !== false)}`, () => { cfg.run = cfg.run === false; save(); G.menu = MENU.opts(); }],
        [`Auto-fire (sticks): ${cfg.autofire === false || (cfg.autofire == null && !touch) ? 'OFF' : 'ON'}`, () => { cfg.autofire = !(cfg.autofire === true || (cfg.autofire == null && touch)); save(); G.menu = MENU.opts(); }], ['Customize controls', () => { G.menu = MENU.keys(); }],
        [`Menu music: ${onOff(cfg.music !== false)}`, () => { cfg.music = cfg.music === false; save(); G.menu = MENU.opts(); }], [`Sound: ${window.Sound && Sound.on ? 'ON' : 'OFF'}`, () => { if (window.Sound) Sound.on = !Sound.on; G.menu = MENU.opts(); }], ['Back', () => { G.menu = MENU.main(); }]] }),
      keys: () => ({ title: 'CONTROLS', small: true, text: [G.keyWait ? `PRESS A KEY FOR: ${(E.ACT.find(a => a[0] === G.keyWait) || [, ''])[1].toUpperCase()}` : 'PICK ONE, THEN PRESS THE NEW KEY.', 'WEAPONS ARE 1-8 AND THE MOUSE WHEEL.'], items: E.ACT.map(([k, n]) => [`${n}: ${binds.label(k)}`, () => { G.keyWait = k; G.menu = MENU.keys(); }]).concat([['Reset to defaults', () => { binds.reset(); cfg.keys = binds.save(); save(); G.menu = MENU.keys(); }], ['Back', () => { G.keyWait = null; G.menu = MENU.opts(); }]]) }),
      help: () => ({ title: 'HELP', small: true, text: ['MOVE: W A S D or arrows. JUMP: space', '(hold it to keep hopping). LOOK: mouse.', 'SHOOT: left click or CTRL. GUNS: 1-8, wheel.', 'SCORES: hold TAB. CONSOLE: the ` key.', 'ROCKET JUMP: aim down, jump, fire Rocket', 'Jack. You fly. It hurts a bit.', 'SECRETS: shoot walls that look a bit odd.', 'NEVER use the Zapper in the bath.', 'Shareware! Copy it for all your mates.'], items: [['Ordering info', () => { G.menu = MENU.order(); }], ['Back', () => { G.menu = MENU.main(); }]] }),
      order: () => ({ title: 'ORDER JAQUAKE', small: true, text: ['Episodes 2-4 are in the full version:', '"Robot Fortress", "The Rivet Mines" and', '"Jack\'s Revenge". 28 more maps!', '', 'Send a cheque or postal order for', '£19.99 to JACKWARE SOFTWARE,', 'PO Box 1999. Allow 28 days for', 'delivery (on 1 CD-ROM, or 9 floppies).', 'Ask your Mom first.'], items: [['Back', () => { G.menu = MENU.main(); }]] }),
    };
    function openMenu() { if (G.state === 'inter') return; G.menu = MENU.main(); G.menu.sel = 0; input.unlock(); }
    function resume() { G.menu = null; if (G.state === 'title') G.state = 'play'; grab(); }
    function grab() { if (touch) return; G.ignoreFire = G.t + 0.3; try { const p = host.requestPointerLock && host.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} host.focus(); }
    function menuAct(i) { const it = G.menu.items[i]; if (!it || it[2]) { sfx('talk'); return; } sfx('menu'); it[1](); if (G.menu) G.menu.sel = G.menu.sel || 0; }
    // MULTIPLAYER: hand the window over to the JackNet deathmatch client (pcgames-jrt.js in its rusty clothes)
    function toMP(go) { if (!env || !env.toMP || !PCG.jqNet) { sfx('talk'); return; } env.toMP({ go }); }
    function quit() {
      if (G.quitting) return; G.quitting = true; input.unlock(); loopH.stop();
      const d = document.createElement('div'); d.className = 'pcg-ov'; d.style.cssText = 'background:#0000a8;color:#fff;font:13px "Courier New",monospace;align-items:stretch;justify-content:flex-start;padding:10px;white-space:pre;overflow:auto';
      d.textContent = `         JAQUAKE v${VERSION} SHAREWARE - The Rusty Dimension\n\n Thanks for playing! This is the shareware version, so copy it for\n your mates, put it on a magazine cover disc, upload it to a BBS.\n\n      THE FULL VERSION HAS:  * 3 more episodes   * 28 more maps\n                             * the Rivet Mines   * Robot Fortress\n\n Order it from Jackware Software, PO Box 1999. £19.99 + 50p p&p.\n\n Programming ..... Jack          Maps .......... Jack\n Testing ......... Callum, JackK, Luke, Dave (Dave cried once)\n Music ........... none (Jack's keyboard is broken)\n\n                 C:\\GAMES\\JAQUAKE>_`;
      host.appendChild(d); setTimeout(() => w.close(), 2600);
    }

    // ---------------------------------------------------------------- input wiring
    const binds = E.bindings(cfg.keys);
    const input = E.input(host, {
      typing: () => !!(G.con || G.keyWait),
      onKey(ev) {
        if (G.keyWait) { if (ev.code !== 'Escape') { binds.set(G.keyWait, ev.code); cfg.keys = binds.save(); save(); } G.keyWait = null; G.menu = MENU.keys(); sfx('menu'); return false; }
        if (ev.code === 'Backquote' || ev.key === '`' || ev.key === '¬') { G.con = !G.con; G.conScroll = 0; if (G.con) input.unlock(); else if (G.state === 'play' && !G.menu) grab(); return false; }
        if (G.con) { if (ev.key === 'Escape') { G.con = false; if (G.state === 'play' && !G.menu) grab(); return false; } conKey(ev); return false; }
        if (G.menu) {
          const n = G.menu.items.length;
          if (ev.key === 'ArrowDown') { do { G.menu.sel = ((G.menu.sel || 0) + 1) % n; } while (G.menu.items[G.menu.sel][2] && n > 1 && G.menu.sel !== 0); }
          else if (ev.key === 'ArrowUp') G.menu.sel = ((G.menu.sel || 0) - 1 + n) % n;
          else if (ev.key === 'Enter' || ev.key === ' ') menuAct(G.menu.sel || 0);
          else if (ev.key === 'Escape') { if (G.map && G.state === 'play' && G.menu.main) resume(); else G.menu = MENU.main(); }
          sfx('menu'); return false;
        }
        if (G.state === 'inter' && (ev.key === ' ' || ev.key === 'Enter')) { interNext(); return false; }
        if (G.state === 'end' && (ev.key === ' ' || ev.key === 'Enter' || ev.key === 'Escape') && G.t - G.endT > 3) { G.state = 'title'; G.map = null; G.menu = MENU.main(); startDemo(); return false; }
        if (ev.key === 'Escape') { openMenu(); return false; }
        return true;
      },
      onLock(on) { if (!on && G.state === 'play' && !G.menu && !G.con && !G.quitting && !touch) openMenu(); },
      canLock: () => !G.menu && !G.con && G.state === 'play' && !touch,
      binds,
    });
    host.addEventListener('pointerdown', ev => {
      const r = host.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * ctx.rw, y = (ev.clientY - r.top) / r.height * ctx.rh;
      G.ignoreFire = G.t + 0.3;
      if (G.keyWait) { if (ev.pointerType !== 'touch') { binds.set(G.keyWait, 'Mouse' + ev.button); cfg.keys = binds.save(); save(); } G.keyWait = null; G.menu = MENU.keys(); return; }
      if (G.con && y > G.conY) { G.con = false; return; }
      if (G.state === 'end') { if (G.t - G.endT > 3) { G.state = 'title'; G.map = null; G.menu = MENU.main(); startDemo(); } return; }
      if (G.menu) { const i = menuHit(x, y); if (i >= 0) menuAct(i); return; }
      if (G.state === 'inter') { interNext(); return; }
      if (P.dead && G.t - P.deadT > 1) { load(G.map.id); return; }
    }, true);
    // the intermission: a click first finishes the count-up, the next one moves on
    function interNext() { const I = G.inter; if (!I) return; if (G.t - I.t < 2.6) { I.t = G.t - 2.6; return; } nextMap(); }
    function nextMap() { const nx = MAPS[G.inter.id].next; if (nx) { load(nx, true); grab(); } else { G.state = 'end'; G.endT = G.t; if (Apps.clearGame) Apps.clearGame('pcgames.jaquake'); } }
    if (touch) input.touchUI([
      { label: 'FIRE', hold: 'fire', style: { right: '24px', bottom: '150px' } },
      { label: 'JUMP', hold: 'jump', style: { right: '100px', bottom: '140px' }, sm: true },
      { label: 'GUN', tap: () => cycleW(1), style: { left: '24px', bottom: '150px' }, sm: true },
      { label: 'MENU', tap: () => { if (G.menu) resume(); else openMenu(); }, style: { right: '8px', top: '8px' }, sm: true },
      { label: 'TAB', tap: () => { G.tabT = G.t + 3; }, style: { left: '8px', top: '8px' }, sm: true },
    ]);

    // ---------------------------------------------------------------- dynamic lights: flashes, rockets, explosions and the Zapper light up the walls
    G.dl = [];
    function flashAt(x, y, z, c, rad, life) { if (!G.dl) G.dl = []; G.dl.push({ p: [x, y, z], c, rad, life, t: life }); if (G.dl.length > 24) G.dl.shift(); }
    function updLights(dt) {
      const L = [], cam = ctx.camera.position;
      G.dl = (G.dl || []).filter(l => (l.t -= dt) > 0);
      if (cfg.dl !== false) {
        for (const l of G.dl) L.push([l.p, l.c, l.rad, l.t / l.life]);
        for (const pr of projs) if (pr.S.glow && !pr.dead) L.push([pr.p, pr.S.glow, pr.kind === 'rokkit' ? 6.5 : 4.5, 0.85]);
        if (G.zap && G.zap.t > 0) L.push([G.zap.end, [0.45, 0.75, 1], 7, 1]);
        if (P.quad > G.t && !P.dead) L.push([[P.p[0], P.p[1] + 1.4, P.p[2]], [0.35, 0.22, 0.85], 5, 0.8]);
        if (P.inv > G.t && !P.dead) L.push([[P.p[0], P.p[1] + 1.4, P.p[2]], [0.8, 0.6, 0.15], 5, 0.8]);
        for (const it of items) if (!it.got && (it.e === 'waaagh' || it.e === 'star' || it.e === 'mega')) L.push([[it.p[0], it.p[1] + 0.6, it.p[2]], it.e === 'waaagh' ? [0.5, 0.2, 0.9] : it.e === 'star' ? [0.9, 0.7, 0.1] : [0.2, 0.35, 1], 4, 0.45 + 0.1 * Math.sin(G.t * 4)]);
      }
      const score = l => l[3] * l[2] / (1 + Math.hypot(l[0][0] - cam.x, l[0][1] - cam.y, l[0][2] - cam.z));
      L.sort((a, b) => score(b) - score(a));
      for (let i = 0; i < 3; i++) { const l = L[i]; if (l) { ctx.uDlp.value[i].set(l[0][0], l[0][1], l[0][2], l[2]); ctx.uDlc.value[i].set(l[1][0] * l[3] * 1.4, l[1][1] * l[3] * 1.4, l[1][2] * l[3] * 1.4); } else ctx.uDlp.value[i].w = 0; }
    }

    // ---------------------------------------------------------------- the frame
    function step(dt) {
      G.t += dt; ctx.uTime.value = G.t;
      const fl = 0.82 + 0.1 * Math.sin(G.t * 13.1) + 0.08 * Math.sin(G.t * 31.7 + 1.3); ctx.uFlick.value = fl;
      const playing = G.state === 'play' && G.map && !G.menu && !G.con && !G.loading;
      if (input.touch) { input.showTouch(playing); input.touchBottom(Math.round(44 * ctx.scale)); }
      if (playing) tick(dt); else input.pressed.length = 0;
      if ((G.state === 'title' || G.state === 'demo') && !G.menu && !G.loading) { G.menu = MENU.main(); }
      if (G.state === 'title' && !G.map && !G.loading && !G.demoTried) { G.demoTried = true; startDemo(); }
      E.music('jaquake', (G.state === 'demo' || G.state === 'title') && !!G.menu && cfg.music !== false && !G.quitting);
      QL = P.p;
      // the console slides down and up
      const conTo = G.con ? Math.round(ctx.rh * 0.5) : 0; G.conY = G.conY || 0;
      G.conY = G.conY < conTo ? Math.min(conTo, G.conY + ctx.rh * 2.6 * dt) : Math.max(conTo, G.conY - ctx.rh * 2.6 * dt);
      if (G.map && !G.loading) {
        if (G.state === 'demo') demoCam(dt);
        else if (G.state === 'inter') { P.yaw += dt * 0.12; P.pitch += (-0.12 - P.pitch) * Math.min(1, dt * 2); }
        P.sy = (P.sy || 0) * Math.pow(0.0001, dt); // smooth stair steps
        const demoOrInter = G.state !== 'play';
        const bob = P.ground && !P.dead && !demoOrInter ? Math.sin(P.bob) * Math.min(1, Math.hypot(P.v[0], P.v[2]) / 7) * 0.06 : 0;
        const eye = P.dead ? 0.35 : P.eye;
        P.land = Math.max(0, (P.land || 0) - dt * 0.9);
        G.shake = Math.max(0, (G.shake || 0) - dt * 1.2); P.punch = Math.max(0, (P.punch || 0) - dt * 0.35);
        const sh = G.shake > 0 && cfg.bob !== false ? G.shake : 0, sx = (Math.random() - 0.5) * sh * 0.12, sy = (Math.random() - 0.5) * sh * 0.12;
        ctx.camera.position.set(P.p[0], P.p[1] + (demoOrInter ? 0 : eye + bob * (cfg.bob === false ? 0.3 : 1) - P.sy - Math.sin(Math.min(1, P.land / 0.2) * Math.PI) * P.land * 0.6), P.p[2]);
        if (G.state === 'demo' && G.demo) ctx.camera.position.y = G.demo.y;
        if (G.state === 'inter') ctx.camera.position.y = P.p[1] + 1.6;
        const wet = G.state === 'play' && P.p[1] + eye < G.map.M.at(P.p[0], P.p[2]).lv && G.map.M.at(P.p[0], P.p[2]).liq;
        ctx.camera.rotation.set(P.pitch + P.punch + sy, P.yaw + sx, P.dead ? 0.4 : ((P.roll || 0) * (cfg.bob === false ? 0.3 : 1) + (wet ? Math.sin(G.t * 2.1) * 0.025 : 0)));
        ctx.uHurt.value = Math.max(0, (P.hurtT || 0));
        P.hurtT = Math.max(0, (P.hurtT || 0) - dt * 1.5);
        // the gun: centred, bobbing as you walk, kicking when it fires, dipping when you swap
        VM.forEach((m, i) => { m.visible = i === P.cur && !P.dead && G.state === 'play'; });
        const vm = VM[P.cur];
        if (vm) {
          P.kick = Math.max(0, (P.kick || 0) - dt * (P.cur === 3 || P.cur === 4 || P.cur === 7 ? 14 : 6)); P.swap = Math.max(0, (P.swap || 0) - dt);
          const sp = Math.min(1, Math.hypot(P.v[0], P.v[2]) / 7), s = Math.sin(P.bob * 0.5) * 0.02 * sp, sb = s * (cfg.bob === false ? 0.3 : 1), vo = VMOFF8[P.cur];
          const kz = [0.02, 0.05, 0.07, 0.012, 0.016, 0.05, 0.06, 0.008][P.cur], kr = [-0.9, 0.18, 0.26, 0.03, 0.04, 0.2, 0.15, 0.02][P.cur];
          const jit = (P.cur === 7 && G.zap && G.zap.t > 0) ? (Math.random() - 0.5) * 0.006 : 0;
          // tall narrow screens (phones held upright): a smaller gun, kept down at the bottom edge
          const vt = Math.tan(ctx.wcam.fov * Math.PI / 360), fk = clamp(vt * ctx.wcam.aspect / 0.83, 0.5, 1), vk = Math.max(1, vt / 0.52); G.vmK = [fk, vk];
          vm.scale.setScalar(0.42 * fk);
          vm.position.set(0.1 + sb + vo[0] + jit, (-0.115 + vo[1]) * vk + Math.abs(sb) * 0.5 - (P.swap / SWAP) * 0.12 - (P.land || 0) * 0.25 + jit, -0.24 + vo[2] + P.kick * kz);
          vm.rotation.set(P.kick * kr, 0, (P.roll || 0) * 2);
          if (vm.parts.spin) { P.spinV = Math.max(0, (P.spinV || 0) + ((G.t - (P.lastFire || -9) < 0.15 && (P.cur === 3 || P.cur === 4)) ? 30 : -14) * dt); P.spinV = Math.min(P.spinV, 22); vm.parts.spin.rotation.z += P.spinV * dt; }
          if (vm.parts.glow) vm.parts.glow.visible = P.ammo.cells > 0;
          const l = lightAt(P.p[0], P.p[1] + 1.4, P.p[2]); vm.mat.uniforms.lmul.value.set(Math.max(0.75, (l[0] + l[3] * fl) * 1.4), Math.max(0.7, (l[1] + l[4] * fl) * 1.4), Math.max(0.65, (l[2] + l[5] * fl) * 1.4)).multiplyScalar((P.quad > G.t ? 1.5 : 1) * (G.mflash > 0 ? 1.45 : 1) * (G.zap && G.zap.t > 0 ? 1.3 : 1));
        }
        if (G.mflash > 0) G.mflash -= dt; muz.update(dt);
        zapBeam(dt);
        updLights(dt);
        FX.update(dt);
        ctx.render();
      } else { ctx.renderer.setViewport(0, 0, ctx.rw, ctx.rh); ctx.renderer.clear(); }
      hud(dt);
    }
    function zapBeam(dt) {
      if (!G.beam) return;
      if (!G.zap || G.zap.t <= 0 || P.dead || G.state !== 'play') { G.beam.visible = false; return; }
      G.zap.t -= dt;
      const d = E.fwd(P.yaw, P.pitch), o = [P.p[0] + d[0] * 0.55 + Math.cos(P.yaw) * 0.04, P.p[1] + P.eye - 0.2 + d[1] * 0.55, P.p[2] + d[2] * 0.55 - Math.sin(P.yaw) * 0.04], e = G.zap.end;
      const a = G.beam.geometry.attributes.position, n = 10;
      for (let k = 0; k < n; k++) { const t = k / (n - 1), j = k === 0 || k === n - 1 ? 0 : 0.18; a.setXYZ(k, o[0] + (e[0] - o[0]) * t + (Math.random() - 0.5) * j, o[1] + (e[1] - o[1]) * t + (Math.random() - 0.5) * j, o[2] + (e[2] - o[2]) * t + (Math.random() - 0.5) * j); }
      a.needsUpdate = true; G.beam.visible = true;
    }
    // the demo camera: walks the route from the start to the far end of the map, looking where it is going, doors swinging open
    function demoCam(dt) {
      const D = G.demo; if (!D || !D.pts) { if (D && G.t - D.t0 > 20) startDemo(); return; }
      D.s += dt * 3.4; const pts = D.pts, i = Math.min(pts.length - 2, Math.floor(D.s / 2)), f = clamp(D.s / 2 - i, 0, 1);
      if (D.s / 2 >= pts.length - 1 || G.t - D.t0 > 75) { G.demo = null; startDemo(); return; }
      const a = pts[i], b = pts[i + 1], x = a[0] + (b[0] - a[0]) * f, z = a[2] + (b[2] - a[2]) * f, fl = Math.max(a[1], b[1]);
      const ahead = pts[Math.min(pts.length - 1, i + 3)], wy = Math.atan2(-(ahead[0] - x), -(ahead[2] - z));
      D.yaw = (D.yaw == null ? wy : D.yaw + clamp(angDiff(wy - D.yaw), -1.2 * dt, 1.2 * dt));
      D.y = D.y == null ? fl + 1.6 : D.y + (fl + 1.6 - D.y) * Math.min(1, dt * 3);
      P.p = [x, fl, z]; P.yaw = D.yaw; P.pitch = Math.sin(G.t * 0.3) * 0.06 - 0.03; P.v = [0, 0, 0];
      updDoors(dt);
      for (const o of mons) if (!o.dead) { o.anim += dt; animMon(o, 0, dt); place(o); }
      for (const it of items) if (!it.got) { it.m.rotation.y = G.t * 1.5 + it.ph; it.m.position.y = it.p[1] + 0.1 + Math.sin(G.t * 2 + it.ph) * 0.08; }
    }
    function tick(dt) {
      const M = G.map.M;
      if (P.dead) { if ((input.act('fire') || input.act('jump')) && G.t - P.deadT > 1.2 && !(G.ignoreFire > G.t)) load(G.map.id); updMons(dt); updProjs(dt); updDoors(dt); return; }
      // look
      const [mx, my] = input.consume(), sens = 0.0022 * cfg.sens;
      P.yaw -= mx * sens; P.pitch -= my * sens * (cfg.invert ? -1 : 1);
      if (input.touch) { P.yaw -= input.lk[0] * 2.6 * dt; P.pitch -= input.lk[1] * 1.8 * dt; }
      if (input.act('turnl')) P.yaw += 2.4 * dt; if (input.act('turnr')) P.yaw -= 2.4 * dt;
      if (input.keys.PageUp) P.pitch += 1.5 * dt; if (input.keys.PageDown) P.pitch -= 1.5 * dt;
      P.pitch = clamp(P.pitch, -1.45, 1.45);
      // move: Quake-ish ground friction and air control, so strafe-jumping and bunny hopping (hold jump) both work
      let f = (input.act('fwd') ? 1 : 0) - (input.act('back') ? 1 : 0), s = (input.act('right') ? 1 : 0) - (input.act('left') ? 1 : 0);
      if (input.touch) { f -= input.mv[1]; s += input.mv[0]; }
      const walk = cfg.run === false ? !(input.keys.ShiftLeft || input.keys.ShiftRight) : (input.keys.ShiftLeft || input.keys.ShiftRight);
      const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
      let wx = -sy * f + cy * s, wz = -cy * f - sy * s;
      const cell = M.at(P.p[0], P.p[2]);
      const wasSwim = P.swim; P.swim = cell.liq && P.p[1] < cell.lv - 0.7;
      if (P.swim && !wasSwim && P.v[1] < -3) { qs('splash', 200); FX.spray(P.p[0], cell.lv, P.p[2], 14, cell.liq === 'lava' ? [1, 0.5, 0.1] : cell.liq === 'slime' ? [0.4, 0.9, 0.3] : [0.6, 0.7, 0.9], 4, 0.6); }
      const b = { p: P.p, v: P.v, r: P.r, h: P.swim ? 1.1 : P.h, ground: P.ground, jumpHeld: P.jh, swim: P.swim, stepUp: 0 };
      const jump = input.act('jump');
      const fw = E.fwd(P.yaw, P.pitch);
      E.move(M, b, P.noclip ? [wx, wz, fw[1] * f] : [wx, wz], jump, dt, { speed: (P.swim ? 4.5 : 8) * (walk ? 0.55 : 1), accel: 10, air: 0.75, fric: 6, grav: 20, jump: 7.3, noclip: P.noclip, autoHop: true });
      // jumping out of water onto a ledge
      if (P.swim && b.bumped && jump && P.p[1] > cell.lv - 1.6) { P.v[1] = 6.5; }
      if (b.stepUp) P.sy += b.stepUp;
      if (b.landed && b.landed > 4) { sfx('land', 100); P.land = Math.min(0.2, b.landed / 70); if (b.landed > 17) damage((b.landed - 17) * 2.5, null, null); }
      const hsp = Math.hypot(P.v[0], P.v[2]);
      if (b.ground && hsp > 2.5 && !P.swim) { P.stepT = (P.stepT || 0) - hsp * dt; if (P.stepT <= 0) { P.stepT = 2.4; sfx('step', 150); } }
      P.roll = (P.roll || 0) + ((Math.max(-1, Math.min(1, s)) * -0.015) - (P.roll || 0)) * Math.min(1, dt * 8);
      if (b.jumped || (P.ground && !b.ground && P.v[1] > 3)) sfx('jump', 300);
      P.ground = b.ground; P.jh = b.jumpHeld;
      if (P.ground) P.bob += Math.hypot(P.v[0], P.v[2]) * dt * 1.6;
      // rocket-jump detection (secret)
      if (P.sj && G.t - P.sj.t < 2) { if (P.p[1] - P.sj.y > 2.4) { P.sj = null; Apps.secret('fps.squigjump'); center('ROCKET JUMP! Wheee!', 2); } } else P.sj = null;
      // liquids hurt (Mom's Wellies keep the slime out)
      if (cell.liq === 'lava' && P.p[1] < cell.lv) { P.lavaT = (P.lavaT || 0) - dt; if (P.lavaT <= 0) { P.lavaT = 0.4; damage(10, null, { S: { name: 'lava. Lava is hot' } }); } }
      if (cell.liq === 'slime' && P.p[1] < cell.lv && !(P.suit > G.t)) { P.slimeT = (P.slimeT || 0) - dt; if (P.slimeT <= 0) { P.slimeT = 0.8; damage(4, null, { S: { name: 'toxic slime' } }); } }
      if (P.p[1] < -30) { P.hp = 0; die({ S: { name: 'the bottomless pit' } }); }
      // weapons
      P.cool -= dt;
      for (let k = 0; k < NWEAP; k++) if (input.take('Digit' + (k + 1)) || input.take('Numpad' + (k + 1))) selectW(k);
      if (input.hit('next')) input.wheel += 1; if (input.hit('prev')) input.wheel -= 1;
      if (input.wheel) { const d = Math.sign(input.wheel); input.wheel = 0; cycleW(d); }
      if (input.act('fire') && !(G.ignoreFire > G.t)) fire();
      else if (input.touch && (cfg.autofire === true || cfg.autofire == null) && autoAim(dt)) fire();
      if (P.hp > 100 && Math.floor(G.t) !== Math.floor(G.t - dt)) P.hp--; // mega health wears off
      // power-ups running out: a warning blip in the last three seconds, like the real thing
      for (const k of ['quad', 'inv', 'suit']) { const left = P[k] - G.t; if (left > 0 && left < 3 && Math.floor(left * 2) !== Math.floor((left + dt) * 2)) qs('tick', 100); if (left <= 0 && left > -dt * 1.5) say({ quad: 'Quad Jack is wearing off', inv: 'The Lucky Star fades', suit: 'Mom wants her wellies back' }[k]); }
      updMons(dt); updProjs(dt); updDoors(dt); pickups(); triggers();
      input.pressed.length = 0;
      // items spin and bob
      for (const it of items) if (!it.got) { it.m.rotation.y = G.t * 1.5 + it.ph; it.m.position.y = it.p[1] + 0.1 + Math.sin(G.t * 2 + it.ph) * 0.08; }
    }

    // ---------------------------------------------------------------- the HUD: status bar, face, messages, console
    function hud(dt) {
      const g = ctx.hctx, W = ctx.rw, H = ctx.rh;
      g.clearRect(0, 0, W, H);
      if (G.map && G.state === 'play') {
        const bx = Math.round((W - 320) / 2), by = H - 44; ctx.setBottom(44);
        if (W > 320) { g.fillStyle = '#1a1008'; g.fillRect(0, by, W, 44); for (let x = bx - 320; x > -320; x -= 320) g.drawImage(bar, x, by); for (let x = bx + 320; x < W; x += 320) g.drawImage(bar, x, by); }
        g.drawImage(bar, bx, by);
        // the inventory strip: seven guns (the Jackhammer is always with you), the four ammo counts, the keys
        for (let k = 1; k < NWEAP; k++) {
          const x = bx + 2 + (k - 1) * 22, has = P.wb & (1 << k), on = P.cur === k, nw = G.newW && G.newW.w === k && G.newW.t > G.t && Math.floor(G.t * 8) % 2;
          E.box2d(g, x, by + 2, 21, 13, on ? '#6a4a22' : nw ? '#8a6a2a' : '#22160a', on ? '#e8c890' : '#4a3a2a', '#0a0400');
          if (has) wIcon(g, k, x + 1, by + 4, on || nw);
          else { g.fillStyle = '#3a2a1a'; g.fillRect(x + 9, by + 8, 3, 1); }
        }
        const AMK = [['shells', '#d8b040'], ['teef', '#c0c0c8'], ['rokkits', '#e8381b'], ['cells', '#60d0ff']];
        AMK.forEach(([k, c], i) => { const x = bx + 158 + i * 30, n = P.ammo[k] | 0; g.fillStyle = c; g.fillRect(x, by + 5, 3, 7); g.fillStyle = '#000'; g.fillRect(x + 1, by + 12, 3, 1); font.draw(g, String(n).padStart(3, ' '), x + 5, by + 4, n <= 0 ? '#5a4a3a' : WEAP[P.cur].ammo === k ? '#fff' : '#e8b84c'); });
        if (P.keys.s) { g.fillStyle = '#d0d4e0'; g.fillRect(bx + 282, by + 4, 6, 8); g.fillRect(bx + 288, by + 7, 6, 2); g.fillRect(bx + 292, by + 9, 2, 2); }
        if (P.keys.g) { g.fillStyle = '#ffd040'; g.fillRect(bx + 298, by + 4, 6, 8); g.fillRect(bx + 304, by + 7, 6, 2); g.fillRect(bx + 308, by + 9, 2, 2); }
        // main bar: armour, face + health, ammo for the gun in your hand
        icon(g, 'armour', bx + 6, by + 19);
        big(g, P.ar, bx + 32, by + 19, '#e8b84c');
        face(g, bx + 112, by + 19);
        big(g, P.hp, bx + 138, by + 19, P.hp <= 25 ? '#ff4030' : '#e8b84c');
        const wp = WEAP[P.cur];
        if (wp.ammo) { icon(g, wp.ammo, bx + 216, by + 19); big(g, P.ammo[wp.ammo], bx + 244, by + 19, P.ammo[wp.ammo] <= 5 ? '#ff4030' : '#e8b84c'); } else icon(g, 'choppa', bx + 216, by + 19);
        // power-ups (top right, over the view)
        const pw = [['QUAD', P.quad, '#d8a0ff'], ['STAR', P.inv, '#ffd040'], ['WELLIES', P.suit, '#80e060']].filter(x => x[1] > G.t);
        pw.forEach(([n, t, c], i) => { const s2 = `${n} ${Math.ceil(t - G.t)}`; font.draw(g, s2, W - 4 - font.width(s2), by - 11 - i * 9, t - G.t < 3 && Math.floor(G.t * 6) % 2 ? '#fff' : c, 1, '#000'); });
        // crosshair, hit marker, where it hurt
        const cx = W >> 1, cy = by >> 1;
        if (!P.dead && !input.touch && cfg.xhair !== false) { g.fillStyle = G.hitT > G.t ? '#ff8040' : '#ffffffa0'; g.fillRect(cx - 3, cy, 2, 1); g.fillRect(cx + 2, cy, 2, 1); g.fillRect(cx, cy - 3, 1, 2); g.fillRect(cx, cy + 2, 1, 2); }
        if (!P.dead && input.touch) { g.strokeStyle = 'rgba(255,220,160,.6)'; g.lineWidth = 1; g.strokeRect(cx - 3.5, cy - 3.5, 7, 7); }
        if (G.hitT > G.t) { g.fillStyle = '#fff'; for (const [a, b2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.fillRect(cx + a * 4 - (a < 0 ? 1 : 0), cy + b2 * 4 - (b2 < 0 ? 1 : 0), 1, 1); g.fillRect(cx + a * 5 - (a < 0 ? 1 : 0), cy + b2 * 5 - (b2 < 0 ? 1 : 0), 1, 1); } }
        G.hurtDirs = (G.hurtDirs || []).filter(h => h.t > G.t);
        for (const h of G.hurtDirs) { const a = -Math.PI / 2 - (h.a - P.yaw), kk = Math.min(1, (h.t - G.t) / 0.6) * h.k; g.strokeStyle = `rgba(255,40,20,${0.8 * kk})`; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, Math.min(40, by * 0.3), a - 0.35, a + 0.35); g.stroke(); }
        // tints: a pickup flash, the power-ups, and being under water / slime / lava
        if (G.flashT > 0) { G.flashT -= dt; g.fillStyle = 'rgba(255,220,120,.18)'; g.fillRect(0, 0, W, by); }
        if (P.quad > G.t) { g.fillStyle = 'rgba(120,40,200,.16)'; g.fillRect(0, 0, W, by); }
        if (P.inv > G.t) { g.fillStyle = 'rgba(255,200,40,.13)'; g.fillRect(0, 0, W, by); }
        if (P.suit > G.t) { g.fillStyle = 'rgba(60,200,60,.1)'; g.fillRect(0, 0, W, by); }
        const ec = G.map.M.at(P.p[0], P.p[2]);
        if (ec.liq && P.p[1] + P.eye < ec.lv && !P.dead) { g.fillStyle = { water: 'rgba(40,70,160,.32)', slime: 'rgba(40,160,30,.38)', lava: 'rgba(255,70,0,.5)', tele: 'rgba(120,60,200,.3)' }[ec.liq] || 'rgba(0,0,0,.2)'; g.fillRect(0, 0, W, by); }
        // messages (top left) and centre print
        G.msgs = G.msgs.filter(m => m.t > G.t);
        const top = input.touch ? Math.ceil(56 / ctx.scale) : 2;
        G.msgs.forEach((m, i) => font.draw(g, m.s, 2, top + i * 9, '#fff', 1, '#000'));
        if (G.cp && G.cp.t > G.t && !G.menu) G.cp.s.split('|').forEach((l, i, a) => font.center(g, l, W / 2, by / 2 - 30 - (a.length - 1) * 5 + i * 10, '#ffe8a0', 1, '#000'));
        if (G.speeds) font.draw(g, `${Math.round(1 / Math.max(dt, 0.001))} FPS  ${mons.filter(m => !m.dead).length} MON`, W - 90, 2, '#8f8');
        // hold TAB: how am I doing on this map?
        if (input.act('scores') || G.tabT > G.t) tabInfo(g, W, by);
      } else if (G.map) ctx.setBottom(0);
      if (G.state === 'inter') drawInter(g, W, H);
      if (G.state === 'end') drawEnd(g, W, H);
      if (G.menu) drawMenu(g, W, H);
      if (G.conY > 0.5) drawCon(g, W, H, Math.round(G.conY));
      if (!G.map && !G.menu) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
    }
    function tabInfo(g, W, by) {
      const m = G.map, tm = Math.floor(G.t - m.t0), bw = 228, bh = 52, x = Math.round((W - bw) / 2), y = by - bh - 6;
      g.fillStyle = 'rgba(20,12,4,.82)'; g.fillRect(x, y, bw, bh); E.box2d(g, x, y, bw, bh, 'rgba(0,0,0,0)', '#a8784a', '#100800');
      font.center(g, `${m.id.toUpperCase()}: ${m.md.title}`, W / 2, y + 5, '#ffe8a0', 1, '#000');
      font.draw(g, `MONSTERS ${String(m.kills).padStart(3, ' ')}/${m.mons}`, x + 8, y + 19, '#e8b84c'); font.draw(g, `SECRETS ${m.secrets}/${m.nsec}`, x + 130, y + 19, '#e8b84c');
      font.draw(g, `TIME ${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}`, x + 8, y + 31, '#e8b84c'); font.draw(g, `SKILL ${SKILL[sk()]}`, x + 130, y + 31, '#e8b84c');
      font.center(g, cfg.name, W / 2, y + 42, '#c8a878');
    }
    // the intermission: COMPLETED, then the time, the kills and the secrets counted up with a tick each
    function drawInter(g, W, H) {
      const I = G.inter, cx = W / 2, e = G.t - I.t;
      g.fillStyle = 'rgba(24,14,6,.6)'; g.fillRect(0, 0, W, H);
      const k = W >= 300 ? 3 : 2; carve(g, 'COMPLETED', cx - font.width('COMPLETED', k) / 2, 10, k, 'rust');
      font.center(g, `${I.id.toUpperCase()}: ${MAPS[I.id].title}`, cx, 14 + 8 * k, '#fff', 1, '#000');
      const rows = [['TIME', I.time, 0.4], ['KILLS', `${Math.min(I.kills, Math.floor(Math.max(0, e - 0.9) * Math.max(8, I.kills * 1.2)))}/${I.mons}`, 0.9], ['SECRETS', `${e > 1.9 ? I.sec : 0}/${I.nsec}`, 1.9]];
      const y0 = Math.max(46, H / 2 - 40);
      rows.forEach(([n, val, at], i) => { if (e < at) return; carve(g, n, cx - 10 - font.width(n, 2), y0 + i * 24, 2, 'stone'); carve(g, val, cx + 10, y0 + i * 24, 2, 'gold'); });
      const kc = Math.min(I.kills, Math.floor(Math.max(0, e - 0.9) * Math.max(8, I.kills * 1.2))); if (kc !== I.lastK) { I.lastK = kc; if (kc > 0) qs('tick', 30); }
      if (e > 1.9 && !I.secT) { I.secT = 1; if (I.nsec) qs(I.sec === I.nsec ? 'star' : 'tick'); }
      if (e > 2.6) {
        const all = I.kills >= I.mons && I.sec >= I.nsec, perfect = all && I.mons > 0;
        if (perfect) font.center(g, 'EVERYTHING POOFED, EVERY SECRET FOUND!', cx, y0 + 76, '#80ff80', 1, '#000');
        font.center(g, MAPS[I.id].next ? 'CLICK OR PRESS SPACE FOR THE NEXT MAP' : 'CLICK OR PRESS SPACE', cx, H - 16, Math.floor(G.t * 2) % 2 ? '#fff' : '#e8b84c', 1, '#000');
      }
    }
    function drawEnd(g, W, H) {
      g.fillStyle = '#2a1a0a'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 44) for (let x = 0; x < W; x += 320) g.drawImage(bar, x, y); g.fillStyle = 'rgba(30,16,4,.7)'; g.fillRect(0, 0, W, H);
      const L = ['', 'The Giga-Blob has gone POOF in a', 'big cloud of smoke and about a million stars.', 'The tin robots of Jackstone Keep rust in peace.', 'Jack\'s Mom says well done, now tidy', 'your room.', '', 'But the Robot Fortress still waits,', 'and its gates are bigger and rustier...', '', 'THE ADVENTURE CONTINUES IN THE FULL VERSION.', 'Ask your Mom for £19.99. It is nearly Christmas.'];
      carve(g, 'CONGRATULATIONS', W / 2 - font.width('CONGRATULATIONS', 2) / 2, 8, 2, 'gold');
      const n = Math.min(L.join('').length, Math.floor((G.t - G.endT) * 25)); let used = 0;
      L.forEach((l, i) => { const show = l.slice(0, Math.max(0, n - used)); used += l.length; font.center(g, show, W / 2, 22 + i * 11, '#ffe8c0', 1, '#000'); });
      if (G.t - G.endT > 3) font.center(g, 'CLICK OR PRESS SPACE', W / 2, H - 12, '#e8b84c', 1, '#000');
    }
    // carved text: every pixel of the 5x7 font becomes a little bevelled block, light on top and dark underneath, like letters
    // chiselled into the rusty metal. Palettes: stone, gold, rust, green, dim
    const CARVE = {}, CPAL = { stone: [[238, 220, 180], [140, 98, 56]], gold: [[255, 244, 190], [214, 140, 40]], rust: [[244, 178, 112], [150, 66, 26]], green: [[190, 255, 150], [44, 150, 34]], dim: [[130, 112, 92], [74, 60, 44]] };
    function carveGlyph(ch, k, pal) {
      const key = pal + k + ch; if (CARVE[key]) return CARVE[key];
      const t = document.createElement('canvas'); t.width = 6; t.height = 8; const tx = t.getContext('2d'); font.draw(tx, ch, 0, 0, '#fff', 1); const px = tx.getImageData(0, 0, 6, 8).data;
      const cv = document.createElement('canvas'); cv.width = 6 * k + 1; cv.height = 8 * k + 1; const x = cv.getContext('2d'), [top, bot] = CPAL[pal] || CPAL.stone;
      const mix = (a, b, f) => `rgb(${a.map((v2, i) => Math.round(v2 + (b[i] - v2) * f)).join(',')})`, sh = Math.max(1, k >> 1);
      for (const pass of [0, 1]) for (let py = 0; py < 8; py++) for (let qx = 0; qx < 6; qx++) {
        if (px[(py * 6 + qx) * 4 + 3] < 128) continue; const X = qx * k, Y = py * k;
        if (!pass) { x.fillStyle = 'rgba(10,4,0,.85)'; x.fillRect(X + sh, Y + sh, k, k); continue; }
        const f = py / 6, on = (a, b) => a >= 0 && a < 6 && b >= 0 && b < 8 && px[(b * 6 + a) * 4 + 3] >= 128, base = top.map((v2, i) => v2 + (bot[i] - v2) * f);
        x.fillStyle = mix(top, bot, f); x.fillRect(X, Y, k, k);
        if (k >= 2) { if (!on(qx, py - 1)) { x.fillStyle = mix(base, [255, 255, 255], 0.4); x.fillRect(X, Y, k, 1); } if (!on(qx - 1, py)) { x.fillStyle = mix(base, [255, 255, 255], 0.2); x.fillRect(X, Y, 1, k); } if (!on(qx, py + 1)) { x.fillStyle = mix(base, [0, 0, 0], 0.5); x.fillRect(X, Y + k - 1, k, 1); } if (!on(qx + 1, py)) { x.fillStyle = mix(base, [0, 0, 0], 0.3); x.fillRect(X + k - 1, Y, 1, k); } }
      }
      return CARVE[key] = cv;
    }
    function carve(g, s, x, y, k, pal) { s = String(s).toUpperCase(); x = Math.round(x); y = Math.round(y); for (let i = 0; i < s.length; i++) if (s[i] !== ' ') g.drawImage(carveGlyph(s[i], k, pal), x + i * 6 * k, y); }
    let menuBoxes = [];
    function drawMenu(g, W, H) {
      if (!G.map) { g.fillStyle = '#1a1008'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 44) for (let x = 0; x < W; x += 320) g.drawImage(bar, x, y); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, W, H); }
      else { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,0,.62)'); gr.addColorStop(0.5, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
      const m = G.menu, cx = W / 2, n = m.items.length;
      menuBoxes = [];
      let y;
      if (m.main) {
        // the logo: big carved rusty letters between two spinning emblems
        const k = W >= 300 && H >= 170 ? 4 : 3; y = 6;
        const tw = font.width('JAQUAKE', k), er = Math.round(4 * k);
        carve(g, 'JAQUAKE', cx - tw / 2, y, k, 'rust');
        g.fillStyle = '#fffff0'; g.fillRect(Math.round(cx - tw / 2 + 2 * k), y + 7 * k, 2, Math.max(2, k)); // the rivet on the J
        if (W > tw + er * 4 + 8) { emblem(g, cx - tw / 2 - er - 8, y + 3.5 * k, er, G.t); emblem(g, cx + tw / 2 + er + 6, y + 3.5 * k, er, G.t + 1.57); }
        const sub = W >= 300 ? 'EPISODE 1: THE RUSTY DIMENSION - SHAREWARE ' + VERSION : 'SHAREWARE ' + VERSION;
        font.center(g, sub, cx, y + 8 * k + 3, '#e8b84c', 1, '#000');
        y += 8 * k + 16;
      } else {
        // sub-menus: a title plate up top, like the old ones
        const k = W >= 300 ? 2 : 2, tw = font.width(m.title, k) + 20, tx = Math.round(cx - tw / 2);
        E.box2d(g, tx, 5, tw, 8 * k + 8, 'rgba(40,24,10,.92)', '#a8784a', '#100800'); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(tx + 2, 7, tw - 4, 1);
        carve(g, m.title, tx + 10, 9, k, 'rust');
        for (const rx of [tx + 3, tx + tw - 5]) { g.fillStyle = '#c8a070'; g.fillRect(rx, 9, 2, 2); g.fillRect(rx, 8 * k + 7, 2, 2); }
        y = 8 * k + 20;
        // the vertical plaque down the left-hand side
        if (W >= 300 && H >= 170) { const px = Math.max(4, Math.round(cx - 160)), ph = Math.min(H - 16, 7 * 18 + 12); for (let yy = 0; yy < ph; yy += 44) g.drawImage(bar, 0, 0, 26, Math.min(44, ph - yy), px, 8 + yy, 26, Math.min(44, ph - yy)); E.box2d(g, px, 8, 26, ph, 'rgba(0,0,0,.25)', '#a8784a', '#100800'); [...'JAQUAKE'].forEach((c, i) => carve(g, c, px + 7, 14 + i * 18, 2, 'rust')); }
      }
      if (m.text) { m.text.forEach((l, i) => font.center(g, l, cx, y + i * 10, '#ffe8c0', 1, '#000')); y += m.text.length * 10 + 6; }
      const room = H - y - (G.map ? 6 : 14);
      const maxw = Math.max(...m.items.map(it => font.width(it[0], 2)));
      const bigk = !m.small && maxw <= W - 70 && n * 19 <= room ? 2 : 1;
      const rh = bigk === 2 ? Math.min(21, Math.floor(room / n)) : Math.max(10, Math.min(13, Math.floor(room / Math.max(1, n))));
      const lx = Math.round(cx - maxw / 2 * (bigk === 2 ? 1 : 0.5)) + (bigk === 2 && !m.main ? 8 : 0);
      m.items.forEach((it, i) => {
        const sel = (m.sel || 0) === i, yy = y + i * rh, txt = it[0];
        if (bigk === 2) {
          const pal = it[2] ? 'dim' : sel ? 'gold' : it[3] === 'green' ? 'green' : 'stone';
          carve(g, txt, lx, yy, 2, pal); menuBoxes.push([lx - 18, yy - 2, font.width(txt, 2) + 20, rh - 1]);
          if (sel) emblem(g, lx - 11, yy + 7, 7, G.t * 1.6);
        } else {
          const two = txt.indexOf(': '), col = it[2] ? '#7a6a5a' : sel ? '#fff' : it[3] === 'green' ? '#7cff60' : it[3] || '#e8b84c';
          let x0, wd;
          if (two > 0 && m.small) { const a = txt.slice(0, two), b = txt.slice(two + 2); font.draw(g, a, cx - 4 - font.width(a), yy, col, 1, '#000'); font.draw(g, b, cx + 6, yy, sel ? '#fff' : '#ffe8c0', 1, '#000'); x0 = cx - 4 - font.width(a); wd = font.width(a) + 10 + font.width(b); }
          else { font.center(g, txt, cx, yy, col, 1, '#000'); x0 = cx - font.width(txt) / 2; wd = font.width(txt); }
          menuBoxes.push([x0 - 12, yy - 2, wd + 16, rh - 1]);
          if (sel) emblem(g, x0 - 8, yy + 3.5, 4, G.t * 1.6);
        }
      });
      if (!G.map || (m.main && G.state === 'demo')) { if (H - (y + n * rh) > 12) font.center(g, W >= 340 ? '(C) 1999 JACKWARE SOFTWARE. NOT AFFILIATED WITH ANYBODY.' : '(C) 1999 JACKWARE SOFTWARE', cx, H - 10, '#8a6a4a', 1, '#000'); }
    }
    // a rusty emblem that spins like a coin (the classic spinning logo, drawn in 2D: squash it, darken the edge)
    let EMB = null;
    function emblem(g, x, y, r, t) {
      if (!EMB) { EMB = document.createElement('canvas'); EMB.width = EMB.height = 32; const e = EMB.getContext('2d');
        e.fillStyle = '#100500'; e.beginPath(); e.arc(16, 16, 15.5, 0, 7); e.fill(); e.fillStyle = '#a8582a'; e.beginPath(); e.arc(16, 16, 14, 0, 7); e.fill();
        e.fillStyle = '#4a2a12'; e.beginPath(); e.arc(16, 16, 11, 0, 7); e.fill();
        for (let a = 0; a < 8; a++) { e.fillStyle = '#c87a3a'; e.fillRect(16 + Math.cos(a * 0.785) * 12.5 - 1, 16 + Math.sin(a * 0.785) * 12.5 - 1, 2, 2); }
        e.fillStyle = '#d88848'; e.fillRect(17, 7, 6, 13); e.fillRect(11, 20, 12, 4); e.fillRect(9, 17, 5, 5); e.fillStyle = '#ffb070'; e.fillRect(17, 7, 6, 2); e.fillStyle = '#fffff0'; e.fillRect(10, 22, 2, 3);
        const img = e.getImageData(0, 0, 32, 32); E.quantize(img); e.putImageData(img, 0, 0); }
      const c = Math.cos(t * 2.2), wd = Math.max(1, Math.abs(c) * r * 2);
      g.save(); g.imageSmoothingEnabled = false; g.drawImage(EMB, Math.round(x - wd / 2), Math.round(y - r), Math.round(wd), r * 2);
      if (Math.abs(c) < 0.98) { g.globalAlpha = (1 - Math.abs(c)) * 0.7; g.fillStyle = c < 0 ? '#1a0a00' : '#000'; g.fillRect(Math.round(x - wd / 2), Math.round(y - r), Math.round(wd), r * 2); }
      g.restore();
    }
    function menuHit(x, y) { for (let i = 0; i < menuBoxes.length; i++) { const [a, b, w2, h2] = menuBoxes[i]; if (x >= a - 4 && x <= a + w2 + 4 && y >= b - 1 && y <= b + h2 + 1) { G.menu.sel = i; return i; } } return -1; }
    // the console: drops down over the top half, the big carved name faded into the metal, the version in the corner
    function drawCon(g, W, H, ch) {
      g.save(); g.beginPath(); g.rect(0, 0, W, ch); g.clip();
      for (let y = ch - 44 * Math.ceil(ch / 44); y < ch; y += 44) for (let x = 0; x < W; x += 320) g.drawImage(bar, x, y);
      g.fillStyle = 'rgba(20,10,4,.55)'; g.fillRect(0, 0, W, ch);
      g.globalAlpha = 0.18; const k = W >= 300 ? 5 : 3; carve(g, 'JAQUAKE', W / 2 - font.width('JAQUAKE', k) / 2, ch / 2 - 4 * k - 4, k, 'rust'); g.globalAlpha = 1;
      const rows = Math.floor((ch - 14) / 8), lines = [];
      G.conLines.forEach(l => { const max = Math.floor((W - 4) / 6); for (let i = 0; i < Math.max(1, l.length); i += max) lines.push(l.slice(i, i + max)); });
      const sc = clamp(G.conScroll || 0, 0, Math.max(0, lines.length - rows)); G.conScroll = sc;
      lines.slice(Math.max(0, lines.length - rows - sc), lines.length - sc).forEach((l, i, a) => font.draw(g, l, 2, ch - 12 - (a.length - i) * 8, '#e8c890'));
      if (sc) font.draw(g, '^ ^ ^ ^ ^ ^', 2, ch - 12, '#a8582a');
      else font.draw(g, ']' + G.conIn + (Math.floor(G.t * 3) % 2 ? '_' : ''), 2, ch - 10, '#fff');
      font.draw(g, 'V' + VERSION, W - 40, ch - 10, '#a8582a');
      g.restore(); g.fillStyle = '#a8582a'; g.fillRect(0, ch, W, 2); g.fillStyle = '#1a0a00'; g.fillRect(0, ch + 2, W, 1);
    }

    // ---------------------------------------------------------------- start up and clean up
    buildVM(); // (before the dynamic lights are switched on: the gun in your hands is lit its own way)
    ctx.uDlp = { value: [0, 0, 0].map(() => new E.T.Vector4(0, 0, 0, 0)) }; ctx.uDlc = { value: [0, 0, 0].map(() => new E.T.Vector3(0, 0, 0)) };
    const muz = E.muzzle(ctx);
    ctx.mbag = [];
    const loopH = E.loop(w, step);
    const onResize = () => ctx.resize();
    window.addEventListener('resize', onResize);
    const ro = window.ResizeObserver ? new ResizeObserver(onResize) : null; if (ro) ro.observe(host);
    const saved = !(arg && MAPS[arg]) && Apps.loadGame ? Apps.loadGame('pcgames.jaquake', 1) : null;
    if (arg && MAPS[arg]) load(arg);
    else if (saved && MAPS[saved.map] && saved.P && saved.P.hp > 0) { // carry on: that map again, with your kit, waiting behind the menu
      if (saved.skill >= 0 && saved.skill <= 3) cfg.skill = saved.skill;
      const k = saved.P; let wb = (k.wb | 0) || 3, cur = k.cur | 0;
      if (!k.w8) { const MAPW = [0, 1, 3, 6]; let nb = 0; MAPW.forEach((n, o) => { if (wb & (1 << o)) nb |= 1 << n; }); wb = nb || 3; cur = MAPW[cur] || 1; } // a save from before the eight-gun update
      Object.assign(P, { hp: Math.min(200, k.hp), ar: k.ar | 0, at: k.at | 0, wb, cur: cur < NWEAP && (wb & (1 << cur)) ? cur : 1, ammo: Object.assign({ shells: 25, teef: 0, rokkits: 0, cells: 0 }, k.ammo) });
      load(saved.map, true); // (the map builds a moment later, then the menu comes up over it)
      const wait = (n) => { if (G.closed) return; if (G.map && G.map.id === saved.map && G.state === 'play') { G.menu = MENU.main(); G.menu.sel = 0; G.menu.text = [`SAVED GAME: ${saved.map.toUpperCase()} - PICK BACK TO GAME TO CARRY ON`]; center(`SAVED GAME: ${saved.map.toUpperCase()}|Pick Back to Game to carry on`, 5); } else if (n < 100) setTimeout(() => wait(n + 1), 50); };
      setTimeout(() => wait(0), 60);
    } else { G.menu = MENU.main(); }
    G.close = () => { if (G.closed) return; G.closed = true; E.music('jaquake', false); loopH.stop(); input.dispose(); window.removeEventListener('resize', onResize); if (ro) ro.disconnect(); ctx.dispose(); };
    G.cmd = run; G.VM = VM; G.lightAt = (x, y, z) => lightAt(x, y, z); G.dbg = { mons: () => mons, doors: () => doors, lifts: () => lifts, items: () => items, trig: () => trig, projs: () => projs, AI }; // for testing
    PCG.live = PCG.live || {}; PCG.live.jaquake = G;
    return G;
  };
})();

/* WARP WOMBAT (PlayStation, in Jack's room): the whole disc now. Wally the wombat runs INTO the screen (and, on BOULDER BOLT,
 * towards it with a giant boulder behind him) through five levels picked from a stone WARP ROOM: JUNGLE ROLLERS, RAPID
 * RIVER, TEMPLE TUMBLE, BOULDER BOLT and SNOW WAY OUT, plus two boss fights (TINY TUSK the warthog, then DOCTOR DINGO in his
 * hover pod). Crates: plain, ? (lots of mangoes), bounce, iron spring, steel, BOOM (jump on it: 3-2-1; spin it: right now),
 * ZAP (touch it and it goes off), checkpoint, extra life and the TIKI crate (a mask that takes a hit for you; three of them
 * and you can't be touched for a bit). Smash every crate on a level for its GEM; beat a level, then race it again in TIME
 * TRIAL (press spin on its pad) for a sapphire, gold or platinum RELIC. 100 mangoes = an extra life.
 * PlayStation look on purpose: wobbly snapped vertices and wonky affine textures (rm-3d does those), chunky 32-pixel
 * textures, Gouraud vertex lighting, a dithered fade into the fog. Wally is built from merged low-poly parts with proper
 * run / jump / spin / idle / dance animation; the crates and mangoes are instanced (one draw call per kind).
 * Every go is one level (or boss): the tally, then the score card; "Play again" goes straight back to the WARP ROOM, and the
 * save (K.save, key rm.ps.run) keeps your lives, mangoes, gems, relics and which pads are open.
 * Score rules (rm-cat.js ps.run: max 40000, 200 a second): every score sent is clamped to both.
 * Secrets: rm.run.box (smash every crate on a level), rm.run.dingo (beat Doctor Dingo), rm.run.relic (a platinum relic).
 * Everything (Wally, the levels, the tunes) is original and drawn in code. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const NEWSECRETS = [
    ['rm.run.dingo', 'Doggone It', 'Beat the mad scientist at the end of Warp Wombat.'],
    ['rm.run.relic', 'Speed Wombat', 'Win the shiniest relic there is in a Warp Wombat time trial.'],
  ];
  try { if (window.Apps && Apps.defineSecret) for (const [id, n, hint] of NEWSECRETS) if (!(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, hint); } catch (e) {}
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  const hexRGB = c => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
  const mt2 = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(Math.floor((s % 1) * 100)).padStart(2, '0')}`;
  const mt1 = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function prng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ================================================================ tunes (16th-note steps, MIDI numbers; all original)
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function N(str) { const out = []; for (const t of str.trim().split(/\s+/)) { if (t === '|') continue; if (t === '.') out.push(0); else if (t === '-') out.push(-1); else { const m = /^([a-g])([#b]?)(\d)$/.exec(t); if (!m) { out.push(0); continue; } out.push(12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)); } } return out; }
  const SONGS = {
    title: { bpm: 132, wave: 'square', bassWave: 'triangle', vol: 0.045,
      lead: N(`c5 . e5 . g5 . e5 . | a5 . g5 . e5 . c5 . | d5 . f5 . a5 . f5 . | g5 - - - . . . . |
               c5 . e5 . g5 . c6 . | b5 . a5 . g5 . e5 . | f5 . e5 . d5 . b4 . | c5 - - - . . . . `),
      bass: N(`c3 . g2 . c3 . g2 . | a2 . e2 . a2 . e2 . | d3 . a2 . d3 . a2 . | g2 . d2 . g2 . b2 . |
               c3 . g2 . c3 . g2 . | e2 . b2 . e2 . b2 . | f2 . c3 . g2 . d3 . | c3 . g2 . c3 . . . `),
      drums: 'o.x.oxx.o.x.oxxx' },
    hub: { bpm: 100, wave: 'triangle', bassWave: 'sine', vol: 0.055,
      lead: N(`e5 . . g5 . . a5 . | g5 . e5 . d5 . . . | c5 . . e5 . . g5 . | e5 - - - . . . . |
               d5 . . f5 . . a5 . | g5 . f5 . e5 . . . | d5 . e5 . c5 . a4 . | c5 - - - . . . . `),
      bass: N(`c3 . . . g2 . . . | a2 . . . e2 . . . | f2 . . . c3 . . . | g2 . . . g2 . . . `),
      drums: 'o...x...o...x.x.' },
    jungle: { bpm: 138, wave: 'square', bassWave: 'triangle', vol: 0.04,
      lead: N(`a4 . c5 . d5 . e5 . | g5 . e5 . d5 c5 a4 . | g4 . a4 . c5 . d5 . | e5 - - - d5 . c5 . |
               a4 . c5 . d5 . e5 . | g5 . a5 . g5 e5 d5 . | c5 . d5 . e5 . d5 c5 | a4 - - - . . . . `),
      bass: N(`a2 . a2 e3 . a2 . e3 | g2 . g2 d3 . g2 . d3 | f2 . f2 c3 . f2 . c3 | e2 . e2 b2 . e2 g#2 . `),
      drums: 'o.xxo.x.o.xxoxx.' },
    river: { bpm: 126, wave: 'triangle', bassWave: 'triangle', vol: 0.055,
      lead: N(`g5 . e5 . c5 . e5 . | g5 . a5 . g5 . . . | f5 . d5 . b4 . d5 . | f5 . g5 . f5 . . . |
               e5 . c5 . a4 . c5 . | e5 . f5 . e5 . d5 . | c5 . d5 . e5 . g5 . | c6 - - - . . . . `),
      bass: N(`c3 . e3 . g3 . e3 . | c3 . e3 . g3 . e3 . | g2 . b2 . d3 . b2 . | g2 . b2 . d3 . b2 . |
               a2 . c3 . e3 . c3 . | f2 . a2 . c3 . a2 . | g2 . b2 . d3 . f3 . | c3 . g2 . c3 . . . `),
      drums: 'o..xo.x.o..xo.xx' },
    temple: { bpm: 116, wave: 'square', bassWave: 'triangle', vol: 0.04,
      lead: N(`d5 . . f5 e5 . d5 . | c#5 . d5 . a4 . . . | d5 . . f5 e5 . g5 . | f5 - e5 - d5 . . . |
               a5 . . g5 f5 . e5 . | f5 . e5 . d5 . c#5 . | d5 . e5 . f5 . e5 . | d5 - - - . . . . `),
      bass: N(`d2 . d2 . a2 . d2 . | a1 . a1 . e2 . a1 . | bb1 . bb1 . f2 . bb1 . | a1 . a1 . c#2 . e2 . `),
      drums: 'o..xo.x.o..xox.x' },
    chase: { bpm: 168, wave: 'square', bassWave: 'sawtooth', vol: 0.035,
      lead: N(`e5 . e5 . g5 . e5 . | d5 . d5 . c5 . b4 . | e5 . e5 . g5 . a5 . | b5 - - - a5 . g5 . |
               e5 . g5 . a5 . b5 . | c6 . b5 . a5 . g5 . | f#5 . g5 . a5 . f#5 . | e5 - - - . . . . `),
      bass: N(`e2 e3 e2 e3 e2 e3 e2 e3 | d2 d3 d2 d3 d2 d3 d2 d3 | c2 c3 c2 c3 c2 c3 c2 c3 | b1 b2 b1 b2 b1 b2 d#2 b2 `),
      drums: 'oxxxoxxxoxxxoxox' },
    snow: { bpm: 112, wave: 'triangle', bassWave: 'sine', vol: 0.055,
      lead: N(`b5 . . . g5 . . . | a5 . . . f#5 . . . | g5 . . . e5 . . . | f#5 - - - . . . . |
               e5 . f#5 . g5 . a5 . | b5 . a5 . g5 . f#5 . | e5 . d5 . e5 . f#5 . | e5 - - - . . . . `),
      bass: N(`e2 . . . b2 . . . | d2 . . . a2 . . . | c2 . . . g2 . . . | b1 . . . f#2 . . . `),
      drums: 'o.......x...o.x.' },
    boss: { bpm: 152, wave: 'sawtooth', bassWave: 'square', vol: 0.032,
      lead: N(`a4 . a4 c5 . a4 e5 . | d#5 . d5 . c5 . a4 . | a4 . a4 c5 . a4 e5 . | f5 - - - e5 . d#5 . |
               a5 . g5 . f5 . e5 . | d5 . c5 . b4 . g#4 . | a4 . c5 . e5 . a5 . | g#5 - - - . . . . `),
      bass: N(`a1 a2 a1 a2 a1 a2 a1 a2 | f1 f2 f1 f2 f1 f2 f1 f2 | d1 d2 d1 d2 d1 d2 d1 d2 | e1 e2 e1 e2 e1 e2 g#1 e2 `),
      drums: 'o.xxo.xxo.xxoxox' },
  };

  // ================================================================ the levels: one row per 2 metres, five lanes, read from the start
  //  ground: . path   (space) pit   w water   x crumbly   i ice   B bridge planks   j fire jet   m moving platform (over a pit)
  //          L log (over water: rides side to side)   l lily pad (sinks if you stand still)
  //  crates: c plain   2 two stacked   q ? crate   b bounce   s iron spring   n steel   t BOOM   z ZAP   k checkpoint   1 life   a TIKI
  //  things: f mango   F mango up high   r rock   e crab   h hedgehog (spin it!)   p penguin   u turtle (jump on it)   g warp pad (the end)
  const LEVELS = [
    { id: 'jungle', name: 'JUNGLE ROLLERS', theme: 'jungle', song: 'jungle', gem: 0xff3a3a, sky: [0x5aa8e8, 0xc8e8f8], fog: [0xa8d0e0, 18, 62], tt: [36, 43, 54], rows: [
      '.....', '.....', '..f..', '..f..', '..a..', '.....', '.f.f.', '.....', 'c...c', '..e..', '.....', '..q..', '.....', 'f.2.f',
      '.. ..', '.. ..', '.....', '.fff.', '.....', '..b..', '..F..', '.....', 'r.c.r', '.....', '..k..', '.....', '.e...', '.....',
      '...e.', '.....', 'ff.ff', '.....', '.   .', '.   .', '.....', '..c..', '.ccc.', '..c..', '.....', 'f.t.f', '..c..', '.....',
      '  .  ', '  f  ', '  .  ', '.....', '..h..', '.....', '..q..', '.....', 'r...r', '.f.f.', '.....', '..k..', '.....', '     ',
      '  m  ', '     ', '.....', '.fff.', '.....', 'c.e.c', '.....', '.ns..', '.FF..', '.....', '.t.t.', '..c..', '.....', '.. ..',
      'f. .f', '.. ..', '.....', '..q..', '.u...', '1....', '.....', 'ccccc', '.....', '..f..', '.h.f.', '.....', '..g..', '.....', '.....'] },
    { id: 'river', name: 'RAPID RIVER', theme: 'river', song: 'river', gem: 0x3a8aff, sky: [0x6ab0f0, 0xe0f0ff], fog: [0xb8d8f0, 18, 64], tt: [40, 48, 60], rows: [
      '.....', '.....', '..f..', '.f.f.', '..c..', '.....', 'c...c', '..e..', '.....', '..a..', '.....', 'wwBww', 'wwBww', 'wwfww',
      'wwBww', '.....', '.q.q.', '.....', 'wlwlw', 'lwlwl', 'wlwlw', '.....', '..k..', '.....', 'wwLww', '.....', '..f..', '.e.e.',
      '.....', '2...2', '.....', 'wwLww', 'wwLww', '.....', '.fff.', '..b..', '..F..', '.....', 'BBBBB', 'BhBBB', 'BBBBB', 'BBfBB',
      'BBBBB', '.....', 'c.t.c', '.....', '..k..', '.....', 'wwwww', 'wwLww', 'wwwww', '.....', '.u.u.', '.....', 'ww.ww', 'ww.ww',
      'wwfww', 'ww.ww', '.....', '.z.z.', '..c..', '.....', 'lwlwl', 'wlwlw', 'lwlwl', '.....', '.ns..', '.FF..', '.....', '..q..',
      '.....', '..k..', '.....', 'wwLww', '.....', 'wwLww', '.....', 'f.e.f', '.....', '....1', 'ccccc', '.....', '..f..', '.....',
      '..g..', '.....', '.....'] },
    { id: 'temple', name: 'TEMPLE TUMBLE', theme: 'temple', song: 'temple', gem: 0x3aff6a, sky: [0xd88a5a, 0xf8d8a8], fog: [0xd8a880, 14, 52], tt: [42, 50, 62], rows: [
      '.....', '.....', '..f..', 'r...r', '..c..', '.....', '  .  ', '  f  ', '  .  ', '.....', '.h.h.', '.....', '..q..', '.....',
      '.j.j.', '.....', '.c.c.', '.....', '..k..', '.....', '     ', '  m  ', '     ', '     ', '  m  ', '     ', '.....', '.fff.',
      '.....', 'r.e.r', '.....', '..a..', 'xxxxx', 'xxfxx', 'xxxxx', '.....', '.ttt.', '..c..', '.c.c.', '.....', '  .  ', '  .  ',
      '  c  ', '  .  ', '.....', '..k..', '.....', 'j.j.j', '.....', 'h...h', '.....', '..q..', '.....', '. . .', '. . .', '.....',
      'ccccc', '.....', '.z.z.', '..e..', '.....', '.ns..', '.FF..', '.....', 'xx.xx', 'x...x', 'xx.xx', '.....', '..b..', '..F..',
      '.....', '..k..', '.....', '.j.j.', '.....', 'f.t.f', '.....', '     ', '  m  ', '     ', '.....', '.h.e.', '.....', '1.q..',
      '.....', '.c.c.', '.....', '..g..', '.....', '.....'] },
    { id: 'chase', name: 'BOULDER BOLT', theme: 'chase', song: 'chase', gem: 0xc05aff, chase: true, sky: [0xe8a060, 0xf8e0b0], fog: [0xe0b890, 16, 56], tt: [30, 35, 43], rows: [
      '.....', '.....', '.....', '..f..', '..f..', '.....', '.c.c.', '.....', 'r...r', '..f..', '.....', '.. ..', '.....', '.f.f.',
      '..c..', '.....', '.r.r.', '.....', 'f...f', '.....', '..a..', '.....', '. . .', '.....', '.fff.', '.....', 'r.c.r', '.....',
      '..k..', '.....', '.....', '  .  ', '  .  ', '.....', '.c.c.', '.....', '.r.r.', '..f..', '.....', '.. ..', '.. ..', '.....',
      '.f.f.', '.....', 'r...r', '..c..', '.....', '.. ..', '.....', 'f.c.f', '.....', '.r.r.', '.....', '..k..', '.....', '. . .', '.....', '.fff.', '.....', 'c.r.c',
      '.....', '..c..', '.....', '.. ..', '.....', '.f.f.', '.....', 'r.q.r', '.....', '.....',
      'ccccc', '.....', '.e...', '...e.', '.....', 'r...r', '.f.f.', '.....', '..k..', '.....', '. . .', '.....', '.c.q.', '.....',
      'r.r.r', '.....', '.fff.', '.....', '..1..', '.....', '.. ..', '.....', '.c.c.', '.....', '..g..', '.....', '.....'] },
    { id: 'snow', name: 'SNOW WAY OUT', theme: 'snow', song: 'snow', gem: 0xffe03a, sky: [0x8ab0d8, 0xf0f4f8], fog: [0xe8eef4, 14, 54], tt: [44, 52, 65], rows: [
      '.....', '.....', '..f..', '.f.f.', '..c..', '.....', 'iiiii', 'iifii', 'iiiii', '.....', '..p..', '.....', '.q.a.', '.....',
      'i. .i', 'i. .i', '.....', '.fff.', '.....', 'c.p.c', '.....', '..k..', '.....', '     ', '  m  ', '     ', '.....', '2...2',
      '.....', 'iiiii', 'ipiii', 'iiiii', 'iiifi', '.....', '.ns..', '.FF..', '.....', '.t.t.', '..c..', '.....', 'xxxxx', 'xxfxx',
      'xxxxx', '.....', '..k..', '.....', '.. ..', '.. ..', '.....', '.u.u.', '.....', 'iiiii', 'iizii', 'iiiii', '.....', '..b..',
      '..F..', '.....', '.p.p.', '.....', '  .  ', '  f  ', '  .  ', '.....', '..q..', '.....', '..k..', '.....', 'ccccc', '.....',
      '     ', '  m  ', '     ', '.....', '.e.h.', '.....', 'iiiii', 'i1iii', 'iiiii', '.....', '..c..', '.....', '..g..', '.....', '.....'] },
  ];
  const BOSSES = [
    { id: 'tusk', name: 'TINY TUSK', song: 'boss', sky: [0x8a5a3a, 0xe8b880], fog: [0xc89a70, 20, 60], hp: 3 },
    { id: 'dingo', name: 'DOCTOR DINGO', song: 'boss', sky: [0x1a1a3a, 0x5a4a8a], fog: [0x3a3060, 20, 60], hp: 3 },
  ];
  // the warp room: seven pads round the back wall (what opens what)
  const PADS = [
    { k: 'L', i: 0, need: [] }, { k: 'L', i: 1, need: ['L0'] }, { k: 'L', i: 2, need: ['L1'] }, { k: 'B', i: 0, need: ['L0', 'L1', 'L2'] },
    { k: 'L', i: 3, need: ['B0'] }, { k: 'L', i: 4, need: ['L3'] }, { k: 'B', i: 1, need: ['L3', 'L4'] },
  ];
  const TS = 2; // a tile is 2 m

  // ================================================================ merging: every static thing in a level is merged by material
  // (world-space UVs so textures tile the same size everywhere; a baked top-to-bottom shade in the vertex colours)
  function Builder(T) {
    const parts = {};
    const V = new T.Vector3(), Nn = new T.Vector3(), M = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), S = new T.Vector3(), P = new T.Vector3(), NM = new T.Matrix3();
    const unitBox = new T.BoxGeometry(1, 1, 1).toNonIndexed();
    const cache = {};
    const G = (k, mk) => cache[k] || (cache[k] = mk().toNonIndexed());
    function push(key, geo, x, y, z, sx, sy, sz, col, o) {
      o = o || {};
      E.set(o.rx || 0, o.ry || 0, o.rz || 0); Q.setFromEuler(E); S.set(sx, sy, sz); P.set(x, y, z); M.compose(P, Q, S); NM.getNormalMatrix(M);
      const L = parts[key] || (parts[key] = { pos: [], nor: [], col: [], uv: [] });
      const pa = geo.attributes.position, na = geo.attributes.normal, ua = geo.attributes.uv;
      const [r, g, b] = hexRGB(col == null ? 0xffffff : col), lo = o.lo == null ? 0.62 : o.lo, hi = o.hi == null ? 1.04 : o.hi, ts = o.ts || 2;
      for (let i = 0; i < pa.count; i++) {
        const ly = pa.getY(i);
        V.set(pa.getX(i), ly, pa.getZ(i)).applyMatrix4(M); Nn.set(na.getX(i), na.getY(i), na.getZ(i)).applyMatrix3(NM).normalize();
        L.pos.push(V.x, V.y, V.z); L.nor.push(Nn.x, Nn.y, Nn.z);
        let k = lerp(lo, hi, clamp(ly + 0.5, 0, 1)); if (o.flatTop && Nn.y > 0.7) k = hi;
        if (o.jit) k *= 1 - o.jit * (((Math.sin(V.x * 12.9898 + V.z * 78.233 + V.y * 37.719) * 43758.5453) % 1 + 1) % 1);
        let rr = r, gg = g, bb = b; if (o.top != null && Nn.y > 0.6) { const t2 = hexRGB(o.top); rr = t2[0]; gg = t2[1]; bb = t2[2]; }
        L.col.push(rr * k, gg * k, bb * k);
        const ax = Math.abs(Nn.x), ay = Math.abs(Nn.y), az = Math.abs(Nn.z);
        if (o.uv === 'own') L.uv.push(ua ? ua.getX(i) * (o.us || 1) : 0, ua ? ua.getY(i) * (o.vs || 1) : 0);
        else if (ay >= ax && ay >= az) L.uv.push(V.x / ts, V.z / ts);
        else if (ax >= az) L.uv.push(V.z / ts, V.y / ts);
        else L.uv.push(V.x / ts, V.y / ts);
      }
    }
    const B = {
      box(key, x, y, z, w, h, d, col, o) { push(key, unitBox, x, y + h / 2, z, w, h, d, col, o); return B; },
      // centred shapes (for models)
      cbox(key, x, y, z, w, h, d, col, o) { push(key, unitBox, x, y, z, w, h, d, col, o); return B; },
      ball(key, x, y, z, r, col, o, seg) { const s = seg || 8; push(key, G('b' + s, () => new T.SphereGeometry(0.5, s, Math.max(4, s * 0.7 | 0))), x, y, z, r * 2 * ((o && o.sx) || 1), r * 2 * ((o && o.sy) || 1), r * 2 * ((o && o.sz) || 1), col, Object.assign({ lo: 0.82, hi: 1.05 }, o)); return B; },
      cyl(key, x, y, z, r, h, col, o, seg, r2) { const s = seg || 8; push(key, G('c' + s + '_' + (r2 == null ? 1 : r2), () => new T.CylinderGeometry(0.5 * (r2 == null ? 1 : r2), 0.5, 1, s)), x, y, z, r * 2, h, r * 2, col, o); return B; },
      cone(key, x, y, z, r, h, col, o, seg) { const s = seg || 6; push(key, G('k' + s, () => new T.ConeGeometry(0.5, 1, s)), x, y, z, r * 2, h, r * 2, col, o); return B; },
      card(key, x, y, z, w, h, ry, col) { push(key, G('p', () => new T.PlaneGeometry(1, 1)), x, y + h / 2, z, w, h, 1, col, { ry, uv: 'own', lo: 0.85, hi: 1 }); return B; },
      geo(key, g, x, y, z, s, col, o) { push(key, g.index ? g.toNonIndexed() : g, x, y, z, s, s, s, col, o); return B; },
      empty() { return !Object.keys(parts).length; },
      build(root, mats, opt) {
        const out = [];
        for (const key of Object.keys(parts)) {
          const L = parts[key]; if (!L.pos.length || !mats[key]) continue;
          const g = new T.BufferGeometry();
          g.setAttribute('position', new T.Float32BufferAttribute(L.pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(L.nor, 3));
          g.setAttribute('color', new T.Float32BufferAttribute(L.col, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(L.uv, 2));
          g.computeBoundingSphere();
          const m = new T.Mesh(g, mats[key]); m.userData.key = key; if (opt && opt.noCull) m.frustumCulled = false; root.add(m); out.push(m);
        }
        return out;
      },
      geometry(key) { const L = parts[key]; const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(L.pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(L.nor, 3)); g.setAttribute('color', new T.Float32BufferAttribute(L.col, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(L.uv, 2)); g.computeBoundingSphere(); return g; },
      dispose() { unitBox.dispose(); for (const k in cache) cache[k].dispose(); },
    };
    return B;
  }

  // ================================================================ PlayStation textures: 32 pixels, chunky, ordered-dithered
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function paintTex(T3, rnd) {
    const dith = (g, w, h, c1, c2, f) => { const A = hexRGB(c1), Bc = hexRGB(c2); const id = g.getImageData(0, 0, w, h), d = id.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = f(x, y) * 16 > BAYER[(y & 3) * 4 + (x & 3)] ? 1 : 0, C = k ? Bc : A, i = (y * w + x) * 4; d[i] = C[0] * 255; d[i + 1] = C[1] * 255; d[i + 2] = C[2] * 255; d[i + 3] = 255; } g.putImageData(id, 0, 0); };
    const sp = (g, w, h, n, cols, sw, sh) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(rnd() * w | 0, rnd() * h | 0, sw || 1 + (rnd() * 2 | 0), sh || 1 + (rnd() * 2 | 0)); } };
    const crate = (base, dark, light, mark) => T3.tex(32, 32, g => {
      g.fillStyle = base; g.fillRect(0, 0, 32, 32);
      for (let y = 4; y < 28; y += 6) { g.fillStyle = dark; g.fillRect(4, y, 24, 1); g.fillStyle = light; g.fillRect(4, y + 1, 24, 1); }
      g.fillStyle = dark; g.fillRect(0, 0, 32, 4); g.fillRect(0, 28, 32, 4); g.fillRect(0, 0, 4, 32); g.fillRect(28, 0, 4, 32);
      g.fillStyle = light; g.fillRect(1, 1, 30, 1); g.fillRect(1, 1, 1, 30);
      g.fillStyle = '#c8c0a8'; for (const [x, y] of [[1, 1], [27, 1], [1, 27], [27, 27]]) { g.fillRect(x, y, 4, 4); g.fillStyle = '#5a5040'; g.fillRect(x + 1, y + 1, 1, 1); g.fillStyle = '#c8c0a8'; }
      if (mark) mark(g);
    });
    const glyph = (s, col, px) => g => { g.font = `bold ${px || 20}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2a1408'; g.fillText(s, 17, 18); g.fillStyle = col; g.fillText(s, 16, 17); };
    const arrow = col => g => { g.fillStyle = '#2a1408'; g.beginPath(); g.moveTo(17, 6); g.lineTo(27, 17); g.lineTo(21, 17); g.lineTo(21, 27); g.lineTo(13, 27); g.lineTo(13, 17); g.lineTo(7, 17); g.closePath(); g.fill(); g.fillStyle = col; g.beginPath(); g.moveTo(16, 5); g.lineTo(26, 16); g.lineTo(20, 16); g.lineTo(20, 26); g.lineTo(12, 26); g.lineTo(12, 16); g.lineTo(6, 16); g.closePath(); g.fill(); };
    const metal = (mark) => T3.tex(32, 32, g => { g.fillStyle = '#8a8e96'; g.fillRect(0, 0, 32, 32); sp(g, 32, 32, 60, ['#7a7e86', '#9aa0a8']); g.fillStyle = '#4a4e56'; g.fillRect(0, 0, 32, 3); g.fillRect(0, 29, 32, 3); g.fillRect(0, 0, 3, 32); g.fillRect(29, 0, 3, 32); g.fillStyle = '#c8ccd4'; for (const [x, y] of [[5, 5], [26, 5], [5, 26], [26, 26]]) g.fillRect(x, y, 2, 2); if (mark) mark(g); });
    const X = {
      crate: crate('#c8843a', '#6a3a14', '#e8a858', g => { g.strokeStyle = '#6a3a14'; g.lineWidth = 3; g.beginPath(); g.moveTo(5, 5); g.lineTo(27, 27); g.stroke(); g.strokeStyle = '#e8a858'; g.lineWidth = 1; g.beginPath(); g.moveTo(5, 4); g.lineTo(28, 27); g.stroke(); }),
      q: crate('#c8843a', '#6a3a14', '#e8a858', glyph('?', '#ffe060', 24)),
      b: crate('#b87430', '#5a2a0a', '#d89448', g => { g.fillStyle = '#3a3a40'; g.fillRect(0, 10, 32, 3); g.fillRect(0, 19, 32, 3); arrow('#ffe060')(g); }),
      s: metal(arrow('#e8e8f0')),
      n: metal(g => { g.strokeStyle = '#5a5e66'; g.lineWidth = 3; g.beginPath(); g.moveTo(4, 4); g.lineTo(28, 28); g.moveTo(28, 4); g.lineTo(4, 28); g.stroke(); }),
      t: T3.tex(32, 32, g => { g.fillStyle = '#d8401a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#7a1a08'; g.fillRect(0, 0, 32, 3); g.fillRect(0, 29, 32, 3); g.fillRect(0, 0, 3, 32); g.fillRect(29, 0, 3, 32); g.fillStyle = '#ffd040'; g.fillRect(3, 11, 26, 10); g.font = 'bold 9px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#5a0a00'; g.fillText('BOOM', 16, 16.5); }),
      z: T3.tex(32, 32, g => { g.fillStyle = '#3ad04a'; g.fillRect(0, 0, 32, 32); sp(g, 32, 32, 40, ['#5aff6a', '#2aa03a']); g.fillStyle = '#1a6a2a'; g.fillRect(0, 0, 32, 3); g.fillRect(0, 29, 32, 3); g.fillRect(0, 0, 3, 32); g.fillRect(29, 0, 3, 32); g.fillStyle = '#ffff9a'; g.beginPath(); g.moveTo(19, 4); g.lineTo(9, 18); g.lineTo(15, 18); g.lineTo(12, 28); g.lineTo(23, 13); g.lineTo(17, 13); g.closePath(); g.fill(); }),
      k: crate('#3a7ad0', '#1a3a7a', '#7ab0f0', g => { g.fillStyle = '#fff'; g.fillRect(10, 7, 3, 19); g.fillStyle = '#ffd040'; g.fillRect(13, 7, 11, 8); g.fillStyle = '#d02a1a'; g.fillRect(13, 11, 11, 2); }),
      1: crate('#c8843a', '#6a3a14', '#e8a858', g => { g.fillStyle = '#7a4a24'; g.beginPath(); g.arc(16, 17, 8, 0, TAU); g.fill(); g.beginPath(); g.arc(9, 10, 3, 0, TAU); g.arc(23, 10, 3, 0, TAU); g.fill(); g.fillStyle = '#e8c898'; g.beginPath(); g.arc(16, 20, 4.5, 0, TAU); g.fill(); g.fillStyle = '#1a0a04'; g.fillRect(12, 14, 2, 3); g.fillRect(18, 14, 2, 3); g.fillRect(14, 18, 4, 2); }),
      a: crate('#c8843a', '#6a3a14', '#e8a858', g => { g.fillStyle = '#8a4a1a'; g.fillRect(10, 7, 12, 19); g.fillStyle = '#ffd040'; g.fillRect(12, 11, 3, 3); g.fillRect(17, 11, 3, 3); g.fillStyle = '#fff'; g.fillRect(13, 19, 6, 2); g.fillStyle = '#3aa03a'; g.fillRect(9, 3, 3, 6); g.fillRect(14, 2, 3, 6); g.fillStyle = '#d02a1a'; g.fillRect(19, 3, 3, 6); }),
      // the ground
      path: T3.tex(32, 32, g => dith(g, 32, 32, 0x8a6236, 0xa87a46, (x, y) => 0.5 + 0.35 * Math.sin(x * 0.7 + Math.sin(y * 0.5) * 2) * Math.cos(y * 0.4))),
      grass: T3.tex(32, 32, g => { dith(g, 32, 32, 0x3a7a22, 0x5aa032, (x, y) => 0.5 + 0.4 * Math.sin(x * 1.3 + y * 0.6) * Math.sin(y * 0.9)); sp(g, 32, 32, 30, ['#7ac040', '#2a5a18'], 1, 2); }),
      plank: T3.tex(32, 32, g => { for (let y = 0; y < 32; y += 8) { g.fillStyle = (y / 8) % 2 ? '#9a6a3a' : '#8a5a30'; g.fillRect(0, y, 32, 8); g.fillStyle = '#4a2a10'; g.fillRect(0, y + 7, 32, 1); g.fillStyle = '#3a2410'; g.fillRect(3 + (y % 16), y + 3, 2, 2); g.fillRect(25 - (y % 16), y + 3, 2, 2); } }),
      stone: T3.tex(32, 32, g => { dith(g, 32, 32, 0x8a8270, 0x9e967e, (x, y) => 0.5 + 0.3 * Math.sin(x * 0.9) * Math.cos(y * 1.1)); g.fillStyle = '#4a4436'; for (let y = 0; y < 32; y += 8) { g.fillRect(0, y, 32, 1); for (let x = (y / 8 % 2) * 8; x < 32; x += 16) g.fillRect(x, y, 1, 8); } g.fillStyle = 'rgba(60,120,40,.7)'; for (let i = 0; i < 8; i++) g.fillRect(rnd() * 32 | 0, rnd() * 32 | 0, 3, 2); }),
      carve: T3.tex(32, 32, g => { g.fillStyle = '#8a7a5a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#5a4a32'; g.fillRect(6, 8, 7, 5); g.fillRect(19, 8, 7, 5); g.fillRect(12, 16, 8, 4); g.fillRect(8, 23, 16, 4); g.fillStyle = '#b8a880'; g.fillRect(6, 7, 7, 1); g.fillRect(19, 7, 7, 1); g.fillRect(8, 22, 16, 1); g.fillStyle = '#4a3a26'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32); }),
      sand: T3.tex(32, 32, g => { dith(g, 32, 32, 0xb8643a, 0xd8844a, (x, y) => 0.5 + 0.4 * Math.sin(y * 0.8 + Math.sin(x * 0.3) * 3)); }),
      cliff: T3.tex(32, 32, g => { dith(g, 32, 32, 0x8a4a2a, 0xa85a32, (x, y) => 0.5 + 0.45 * Math.sin(y * 1.6 + x * 0.2)); g.fillStyle = '#5a2a14'; for (let i = 0; i < 6; i++) g.fillRect(0, rnd() * 32 | 0, 32, 1); }),
      rock: T3.tex(32, 32, g => { dith(g, 32, 32, 0x6a6a62, 0x8a8a7e, (x, y) => 0.5 + 0.4 * Math.sin(x * 0.8 + y * 1.2) * Math.cos(x * 0.3)); sp(g, 32, 32, 20, ['#4a4a44', '#a0a094'], 2, 1); }),
      snow: T3.tex(32, 32, g => { dith(g, 32, 32, 0xdce6f0, 0xf8fbff, (x, y) => 0.55 + 0.35 * Math.sin(x * 0.6 + y * 0.4)); }),
      ice: T3.tex(32, 32, g => { dith(g, 32, 32, 0x8ac8f0, 0xc8ecff, (x, y) => 0.5 + 0.45 * Math.sin((x + y) * 0.5)); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(4, 26, 10, 1); g.fillRect(18, 8, 9, 1); g.fillRect(6, 4, 1, 6); }),
      crack: T3.tex(32, 32, g => { dith(g, 32, 32, 0x7a7262, 0x948a76, (x, y) => 0.5 + 0.3 * Math.sin(x * 0.9) * Math.cos(y * 1.1)); g.strokeStyle = '#2a2418'; g.lineWidth = 1; g.beginPath(); g.moveTo(3, 4); g.lineTo(12, 14); g.lineTo(9, 22); g.lineTo(16, 30); g.moveTo(12, 14); g.lineTo(26, 11); g.lineTo(29, 3); g.moveTo(20, 13); g.lineTo(24, 26); g.stroke(); }),
      water: T3.tex(32, 32, g => { dith(g, 32, 32, 0x1a5a9a, 0x2a7ac0, (x, y) => 0.5 + 0.45 * Math.sin(x * 0.4 + Math.sin(y * 0.6) * 2)); g.fillStyle = '#a8d8ff'; for (let i = 0; i < 10; i++) g.fillRect(rnd() * 28 | 0, rnd() * 32 | 0, 4, 1); }),
      bark: T3.tex(16, 32, g => { g.fillStyle = '#6a4424'; g.fillRect(0, 0, 16, 32); g.fillStyle = '#4a2c14'; for (let x = 1; x < 16; x += 4) g.fillRect(x, 0, 1, 32); g.fillStyle = '#8a5a30'; for (let i = 0; i < 10; i++) g.fillRect(rnd() * 16 | 0, rnd() * 32 | 0, 2, 1); }),
      leaf: T3.tex(32, 32, g => { dith(g, 32, 32, 0x1e6a1a, 0x3a9a2a, (x, y) => 0.5 + 0.45 * Math.sin(x * 1.1) * Math.sin(y * 1.3)); sp(g, 32, 32, 20, ['#6ac040', '#14501a'], 2, 2); }),
      pine: T3.tex(32, 32, g => { dith(g, 32, 32, 0x1a4a2a, 0x2a6a3a, (x, y) => 0.5 + 0.4 * Math.sin(x * 1.5 + y)); g.fillStyle = '#f0f6ff'; for (let i = 0; i < 18; i++) g.fillRect(rnd() * 30 | 0, rnd() * 32 | 0, 3, 1); }),
      lily: T3.tex(32, 32, g => { g.fillStyle = '#2a7a2a'; g.beginPath(); g.arc(16, 16, 15, 0.3, TAU - 0.1); g.lineTo(16, 16); g.fill(); g.strokeStyle = '#5ab04a'; g.beginPath(); for (let a = 0.5; a < 6; a += 0.8) { g.moveTo(16, 16); g.lineTo(16 + Math.cos(a) * 13, 16 + Math.sin(a) * 13); } g.stroke(); g.fillStyle = '#ff8ac8'; g.fillRect(19, 9, 4, 4); }),
      hub: T3.tex(32, 32, g => { dith(g, 32, 32, 0x6a6a7a, 0x82829a, (x, y) => 0.5 + 0.3 * Math.sin(x * 0.7) * Math.cos(y * 0.9)); g.fillStyle = '#3a3a4a'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32); g.fillRect(0, 16, 32, 1); g.fillRect(16, 0, 1, 32); }),
      metalw: metal(null),
    };
    return X;
  }

  // ================================================================ Wally the wombat: low-poly parts, each one merged mesh
  // bones: hips (shorts + tummy + chest + bandana), head, arms, legs (thigh + foot). Front is +z.
  const FUR = 0x8e603e, CREAM = 0xf0cc98, DARK = 0x2a1810, SHOE = 0xd8261a, SHORTS = 0x2a5ad8;
  function wombatModel(T, mat) {
    const root = new T.Group(), body = new T.Group(); root.add(body);
    const part = (fn, parent, px, py, pz) => { const B = Builder(T); fn(B); const g = new T.Group(); g.position.set(px, py, pz); B.build(g, { w: mat }); B.dispose(); parent.add(g); return g; };
    const hips = part(B => {
      B.ball('w', 0, 0.02, 0, 0.36, SHORTS, { sx: 1.05, sy: 0.72, sz: 0.95 }, 10); B.cyl('w', 0, 0.17, 0, 0.36, 0.06, 0x1a3a9a, {}, 12); // shorts + a waistband
      B.ball('w', 0, 0.3, 0, 0.37, FUR, { sx: 1.14, sy: 1.04, sz: 0.95 }, 10); B.ball('w', 0, 0.27, 0.16, 0.27, CREAM, { sx: 1.05, sy: 1.12, sz: 0.62 }, 10);
      B.cyl('w', 0, 0.55, 0.0, 0.26, 0.09, 0x2a8ad0, {}, 10); B.ball('w', 0, 0.55, -0.27, 0.07, 0x2a8ad0, {}, 6); B.cbox('w', -0.05, 0.47, -0.3, 0.06, 0.16, 0.03, 0x2a8ad0, { rz: 0.4 }); B.cbox('w', 0.05, 0.46, -0.3, 0.06, 0.18, 0.03, 0x2a8ad0, { rz: -0.4 });
      B.ball('w', 0, 0.06, -0.33, 0.08, FUR, {}, 6); // a stubby tail
    }, body, 0, 0.43, 0);
    const head = part(B => {
      B.ball('w', 0, 0.24, 0, 0.37, FUR, { sx: 1.2, sy: 0.84, sz: 1.0 }, 10);
      B.ball('w', 0, 0.11, 0.24, 0.24, CREAM, { sx: 1.45, sy: 0.72, sz: 0.85 }, 10);
      B.ball('w', 0, 0.2, 0.44, 0.12, DARK, { sx: 1.45, sy: 0.7, sz: 0.7 }, 8); B.cbox('w', -0.05, 0.17, 0.515, 0.035, 0.025, 0.02, 0x000000); B.cbox('w', 0.05, 0.17, 0.515, 0.035, 0.025, 0.02, 0x000000); B.cbox('w', -0.05, 0.235, 0.5, 0.05, 0.018, 0.02, 0x8a7a70);
      for (const s of [-1, 1]) {
        B.ball('w', s * 0.14, 0.36, 0.27, 0.09, 0xffffff, { sy: 1.3, sz: 0.6 }, 8); B.ball('w', s * 0.125, 0.35, 0.315, 0.045, 0x0a0a0a, { sy: 1.3, sz: 0.5 }, 6); B.ball('w', s * 0.115, 0.375, 0.335, 0.014, 0xffffff, {}, 4);
        B.cbox('w', s * 0.14, 0.48, 0.28, 0.13, 0.035, 0.04, 0x4a2a14, { rz: s * 0.28 });
        B.cone('w', s * 0.3, 0.5, -0.08, 0.09, 0.2, FUR, { rz: -s * 0.55, sz: 0.6 }, 6); B.cone('w', s * 0.3, 0.49, -0.05, 0.05, 0.13, 0xc87a7a, { rz: -s * 0.55 }, 5);
      }
      B.cbox('w', 0, 0.02, 0.39, 0.2, 0.035, 0.03, 0x5a1a10, { rx: 0.2 }); B.cbox('w', 0, 0.035, 0.405, 0.08, 0.045, 0.02, 0xffffff); // the grin and the buck teeth
      B.cbox('w', 0, 0.42, -0.2, 0.05, 0.12, 0.08, FUR, { rx: -0.5 }); // a tuft
    }, hips, 0, 0.6, 0.02);
    const arm = s => part(B => { B.ball('w', 0, -0.13, 0, 0.1, FUR, { sy: 1.8 }, 8); B.ball('w', 0, -0.31, 0.03, 0.11, CREAM, { sx: 1.05, sz: 0.9 }, 8); B.cbox('w', s * 0.05, -0.36, 0.08, 0.04, 0.06, 0.06, CREAM); }, hips, s * 0.33, 0.45, 0);
    const leg = s => part(B => { B.ball('w', 0, -0.13, 0, 0.13, FUR, { sy: 1.35 }, 8); B.ball('w', 0, -0.31, 0.09, 0.15, SHOE, { sx: 1.05, sy: 0.62, sz: 1.6 }, 8); B.cbox('w', 0, -0.38, 0.09, 0.27, 0.06, 0.48, 0xf0f0f0); B.cbox('w', 0, -0.26, 0.15, 0.12, 0.03, 0.16, 0xffffff, { rx: -0.3 }); }, hips, s * 0.18, -0.06, 0);
    const armL = arm(-1), armR = arm(1), legL = leg(-1), legR = leg(1);
    return { root, body, hips, head, armL, armR, legL, legR };
  }
  // pose Wally: k = { run (0..1), ph (run phase), air (-1 falling .. 1 rising), spin, idle t, dance, hurt }
  const HIPY = 0.43;
  function poseWombat(w, k) {
    const ph = k.ph, run = k.run, air = k.air;
    w.legL.rotation.set(0, 0, 0); w.legR.rotation.set(0, 0, 0); w.armL.rotation.set(0, 0, 0); w.armR.rotation.set(0, 0, 0); w.head.rotation.set(0, 0, 0); w.hips.rotation.set(0, 0, 0);
    w.hips.position.y = HIPY;
    if (k.onGround) {
      w.legL.rotation.x = -Math.sin(ph) * 0.95 * run; w.legR.rotation.x = Math.sin(ph) * 0.95 * run;
      w.armL.rotation.x = Math.sin(ph) * 1.0 * run; w.armR.rotation.x = -Math.sin(ph) * 1.0 * run; w.armL.rotation.z = -0.2 * run; w.armR.rotation.z = 0.2 * run;
      w.hips.position.y = HIPY + Math.abs(Math.sin(ph)) * 0.08 * run; w.hips.rotation.x = 0.22 * run; w.head.rotation.x = -0.15 * run; w.hips.rotation.y = Math.sin(ph) * 0.15 * run;
      if (run < 0.15) { const t = k.t; w.hips.position.y += Math.sin(t * 2.4) * 0.012; w.head.rotation.y = Math.sin(t * 0.7) * 0.35 * (Math.sin(t * 0.23) > 0.3 ? 1 : 0); w.armL.rotation.z = -0.12 - Math.sin(t * 2.4) * 0.04; w.armR.rotation.z = 0.12 + Math.sin(t * 2.4) * 0.04; }
    } else {
      w.legL.rotation.x = air > 0 ? -0.9 : -0.3; w.legR.rotation.x = air > 0 ? 0.3 : -0.6; w.armL.rotation.x = air > 0 ? -2.6 : -1.6; w.armR.rotation.x = air > 0 ? -2.6 : -1.9; w.armL.rotation.z = -0.5; w.armR.rotation.z = 0.5;
      if (air < 0) { w.armL.rotation.x += Math.sin(k.t * 22) * 0.4; w.armR.rotation.x -= Math.sin(k.t * 22) * 0.4; }
      w.hips.position.y = HIPY + 0.05; w.head.rotation.x = air > 0 ? -0.25 : 0.15;
    }
    if (k.spin > 0) { w.armL.rotation.z = -1.4; w.armR.rotation.z = 1.4; w.armL.rotation.x = 0; w.armR.rotation.x = 0; w.legL.rotation.z = -0.25; w.legR.rotation.z = 0.25; }
    if (k.dance) { const t = k.t; w.armL.rotation.set(-2.6 + Math.sin(t * 9) * 0.5, 0, -0.4); w.armR.rotation.set(-2.6 - Math.sin(t * 9) * 0.5, 0, 0.4); w.hips.position.y = HIPY + Math.abs(Math.sin(t * 9)) * 0.18; w.hips.rotation.z = Math.sin(t * 4.5) * 0.2; w.head.rotation.z = -Math.sin(t * 4.5) * 0.25; w.legL.rotation.x = Math.sin(t * 9) * 0.5; w.legR.rotation.x = -Math.sin(t * 9) * 0.5; }
  }

  // ================================================================ the baddies and things (each one a merged mesh or two)
  function makeModels(T, mat) {
    const one = (fn) => { const B = Builder(T); fn(B); const g = B.geometry('w'); B.dispose(); return g; };
    const M = {};
    M.crab = one(B => { B.ball('w', 0, 0.35, 0, 0.45, 0xe8441a, { sx: 1.2, sy: 0.55, sz: 0.85 }, 10); B.ball('w', 0, 0.3, 0.12, 0.3, 0xf8a070, { sx: 1.2, sy: 0.4, sz: 0.6 }, 8);
      for (const s of [-1, 1]) { B.cyl('w', s * 0.14, 0.62, 0.18, 0.025, 0.22, 0xe8441a); B.ball('w', s * 0.14, 0.76, 0.2, 0.08, 0xffffff, {}, 6); B.ball('w', s * 0.14, 0.77, 0.27, 0.035, 0x0a0a0a, {}, 4);
        for (let i = 0; i < 3; i++) B.cbox('w', s * (0.5 + i * 0.02), 0.18, -0.15 + i * 0.16, 0.36, 0.06, 0.06, 0xc8341a, { rz: s * 0.6 }); } });
    M.claws = one(B => { for (const s of [-1, 1]) { B.cbox('w', s * 0.5, 0.42, 0.3, 0.1, 0.1, 0.3, 0xe8441a, { ry: -s * 0.5 }); B.ball('w', s * 0.62, 0.48, 0.5, 0.17, 0xff5a2a, { sy: 0.8 }, 8); B.cone('w', s * 0.66, 0.55, 0.66, 0.06, 0.2, 0xffe0c0, { rx: 1.3 }, 5); } });
    M.hog = one(B => { B.ball('w', 0, 0.38, 0, 0.42, 0x6a4a30, { sx: 1, sy: 0.8, sz: 1.1 }, 10); B.ball('w', 0, 0.32, 0.36, 0.2, 0xe8c8a0, { sx: 1, sy: 0.8, sz: 1.1 }, 8); B.ball('w', 0, 0.36, 0.56, 0.06, 0x1a1a1a, {}, 6);
      for (const s of [-1, 1]) { B.ball('w', s * 0.1, 0.44, 0.44, 0.045, 0x0a0a0a, {}, 4); B.ball('w', s * 0.15, 0.04, 0.2, 0.08, 0x3a2a1a, {}, 5); B.ball('w', s * 0.15, 0.04, -0.2, 0.08, 0x3a2a1a, {}, 5); }
      for (let i = 0; i < 16; i++) { const a = (i % 4) / 3 * 2.4 - 1.2, b = (i >> 2) / 3 * 1.8 - 1.0; const x = Math.sin(a) * 0.36, y = 0.45 + Math.cos(a) * 0.3 * Math.cos(b), z = Math.sin(b) * 0.35 - 0.08; B.cone('w', x, y + 0.12, z, 0.07, 0.36, i % 2 ? 0xf0e8d0 : 0xc8b898, { rz: -a * 0.9, rx: -b * 0.6 - 0.3 }, 4); } });
    M.peng = one(B => { B.ball('w', 0, 0.5, 0, 0.36, 0x1a1a2a, { sy: 1.35 }, 10); B.ball('w', 0, 0.45, 0.14, 0.27, 0xf8f8f8, { sy: 1.4, sz: 0.7 }, 8); B.ball('w', 0, 0.98, 0.02, 0.24, 0x1a1a2a, {}, 8);
      B.cone('w', 0, 0.94, 0.28, 0.07, 0.2, 0xf0a020, { rx: Math.PI / 2 }, 5); for (const s of [-1, 1]) { B.ball('w', s * 0.09, 1.02, 0.19, 0.05, 0xffffff, {}, 5); B.ball('w', s * 0.085, 1.02, 0.225, 0.025, 0x0a0a0a, {}, 4); B.cbox('w', s * 0.35, 0.55, 0, 0.06, 0.4, 0.18, 0x1a1a2a, { rz: s * 0.4 }); B.cbox('w', s * 0.12, 0.03, 0.08, 0.14, 0.05, 0.22, 0xf0a020); }
      B.cyl('w', 0, 1.16, 0, 0.2, 0.08, 0xd02a2a, {}, 8); B.ball('w', 0, 1.24, 0, 0.07, 0xffffff, {}, 5); });
    M.turtle = one(B => { B.ball('w', 0, 0.3, 0, 0.5, 0x2a8a3a, { sy: 0.6 }, 10); B.cyl('w', 0, 0.12, 0, 0.5, 0.12, 0xe8d090, {}, 10);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.ball('w', Math.cos(a) * 0.28, 0.42, Math.sin(a) * 0.28, 0.12, 0x5ab04a, { sy: 0.4 }, 6); } B.ball('w', 0, 0.5, 0, 0.13, 0x5ab04a, { sy: 0.5 }, 6);
      B.ball('w', 0, 0.28, 0.55, 0.16, 0x9ad070, {}, 8); for (const s of [-1, 1]) { B.ball('w', s * 0.07, 0.34, 0.66, 0.035, 0x0a0a0a, {}, 4); B.ball('w', s * 0.35, 0.08, 0.3, 0.1, 0x9ad070, { sy: 0.6 }, 5); B.ball('w', s * 0.35, 0.08, -0.3, 0.1, 0x9ad070, { sy: 0.6 }, 5); } });
    M.mango = one(B => { B.ball('w', 0, 0, 0, 0.22, 0xffa01a, { sy: 1.15, sz: 0.9 }, 8); B.ball('w', 0.05, 0.06, 0.1, 0.13, 0xff7a2a, { sz: 0.45 }, 6); B.cbox('w', 0.04, 0.27, 0, 0.03, 0.1, 0.03, 0x5a3a1a); B.cbox('w', 0.1, 0.27, 0, 0.14, 0.03, 0.08, 0x3ab02a, { rz: 0.4 }); });
    M.gem = one(B => { B.geo('w', new T.OctahedronGeometry(0.5, 0), 0, 0, 0, 1, 0xffffff, { lo: 0.9, hi: 1.1 }); });
    M.mask = one(B => { B.cbox('w', 0, 0, 0, 0.36, 0.5, 0.1, 0x8a4a1a); B.cbox('w', 0, 0.05, 0.06, 0.3, 0.12, 0.04, 0x5a2a0a); for (const s of [-1, 1]) B.cbox('w', s * 0.08, 0.06, 0.09, 0.07, 0.07, 0.03, 0xffd040); B.cbox('w', 0, -0.13, 0.08, 0.18, 0.06, 0.03, 0xffffff);
      B.cbox('w', -0.12, 0.33, 0, 0.05, 0.22, 0.03, 0x3ab02a, { rz: 0.3 }); B.cbox('w', 0, 0.36, 0, 0.05, 0.26, 0.03, 0xd02a1a); B.cbox('w', 0.12, 0.33, 0, 0.05, 0.22, 0.03, 0x3a7ad0, { rz: -0.3 }); });
    // TINY TUSK: a big warthog (body + head in one, four legs separate so he can gallop)
    M.tusk = one(B => { B.ball('w', 0, 1.0, 0, 0.85, 0x7a5a48, { sx: 1, sy: 0.85, sz: 1.35 }, 12); B.ball('w', 0, 1.2, 0.1, 0.7, 0x8a6a56, { sx: 0.95, sy: 0.75, sz: 1.1 }, 10);
      for (let i = 0; i < 8; i++) B.cone('w', 0, 1.82 - i * 0.02, 0.6 - i * 0.22, 0.12, 0.45, 0x2a1a10, { rx: -0.5 }, 4);
      B.ball('w', 0, 1.0, 1.05, 0.55, 0x8a6a56, { sx: 1, sy: 0.9, sz: 1 }, 10); B.cyl('w', 0, 0.86, 1.55, 0.26, 0.24, 0xd89a8a, { rx: Math.PI / 2 }, 10); for (const s of [-1, 1]) { B.ball('w', s * 0.08, 0.87, 1.68, 0.05, 0x3a1a1a, {}, 4); B.cone('w', s * 0.3, 1.0, 1.5, 0.08, 0.5, 0xfff8e0, { rx: -0.6, rz: s * 0.3 }, 5); B.ball('w', s * 0.24, 1.25, 1.42, 0.08, 0xffd040, {}, 5); B.ball('w', s * 0.24, 1.25, 1.48, 0.04, 0x0a0a0a, {}, 4); B.cbox('w', s * 0.24, 1.38, 1.38, 0.18, 0.05, 0.06, 0x2a1a10, { rz: -s * 0.35 }); B.ball('w', s * 0.42, 1.48, 0.8, 0.16, 0x7a5a48, { sy: 1.3, sz: 0.5 }, 6); }
      B.cyl('w', 0, 1.1, -1.15, 0.03, 0.5, 0x2a1a10, { rx: -0.8 }); B.ball('w', 0, 1.4, -1.32, 0.08, 0x2a1a10, {}, 5); });
    M.tleg = one(B => { B.cyl('w', 0, -0.35, 0, 0.15, 0.7, 0x6a4a3a, {}, 6); B.cyl('w', 0, -0.72, 0.03, 0.17, 0.12, 0x2a1a10, {}, 6); });
    // DOCTOR DINGO in his hover pod
    M.pod = one(B => { B.ball('w', 0, 0, 0, 1.1, 0x9aa0b0, { sy: 0.45 }, 12); B.cyl('w', 0, 0.1, 0, 1.15, 0.16, 0xd0a020, {}, 14); B.cyl('w', 0, -0.48, 0, 0.45, 0.3, 0x4a4e5a, {}, 10, 1.3);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.ball('w', Math.cos(a) * 0.98, 0.08, Math.sin(a) * 0.98, 0.08, i % 2 ? 0xff3a2a : 0x3aff6a, {}, 5); } });
    M.dingo = one(B => { B.ball('w', 0, 0.35, 0, 0.42, 0xf0f0f0, { sy: 1.0 }, 10); B.cbox('w', 0, 0.38, 0.38, 0.1, 0.3, 0.04, 0xd02a2a);
      B.ball('w', 0, 0.95, 0, 0.32, 0xd8903a, { sy: 0.95 }, 10); B.ball('w', 0, 0.86, 0.28, 0.17, 0xf0d0a0, { sz: 1.4, sy: 0.75 }, 8); B.ball('w', 0, 0.9, 0.5, 0.06, 0x1a1a1a, {}, 5);
      for (const s of [-1, 1]) { B.cone('w', s * 0.2, 1.3, -0.02, 0.1, 0.32, 0xd8903a, { rz: -s * 0.25 }, 4); B.cyl('w', s * 0.12, 1.02, 0.27, 0.08, 0.06, 0x3ad0ff, { rx: Math.PI / 2 }, 8); B.cyl('w', s * 0.12, 1.02, 0.24, 0.1, 0.05, 0x3a3a3a, { rx: Math.PI / 2 }, 8); B.ball('w', s * 0.4, 0.45, 0.15, 0.1, 0xf0f0f0, { sy: 2 }, 6); }
      B.cbox('w', 0, 1.05, 0.12, 0.62, 0.04, 0.4, 0x3a3a3a); B.cbox('w', 0, 0.74, 0.36, 0.16, 0.03, 0.03, 0x5a1a10); });
    M.boulder = one(B => { B.geo('w', new T.IcosahedronGeometry(2.4, 1), 0, 0, 0, 1, 0x8a7a68, { lo: 0.7, hi: 1.1, jit: 0.25 }); for (let i = 0; i < 7; i++) { const a = i * 2.4, b = i * 1.3; B.ball('w', Math.cos(a) * Math.cos(b) * 2.15, Math.sin(b) * 2.15, Math.sin(a) * Math.cos(b) * 2.15, 0.5, 0x4a7a2a, { jit: 0.2 }, 5); } });
    M.ball = one(B => { B.ball('w', 0, 0, 0, 0.35, 0x8affff, {}, 8); });
    M.snowman = null;
    return M;
  }

  // ================================================================ the disc
  TV.game('ps.run', {
    three: true,
    buttons: ['a', 'x'],
    help: 'Move: arrows. Jump: Z. Spin: X or C. Pause: Enter.',
    make(K) {
      const T3 = K.three({ fov: 62, far: 170 }), T = T3.T, cam = T3.cam, scene = T3.scene, hud = K.hud, F = K.font, W = K.W, H = K.H;
      const lit = T3.lights({ amb: 0.8, sun: 0.75, dir: [0.4, 1, 0.6], groundCol: 0x5a4a30 });
      const TX = paintTex(T3, prng(7));
      const MAT = {}; for (const k of Object.keys(TX)) MAT[k] = T3.mat({ map: TX[k], vcol: true });
      MAT.plain = T3.mat({ vcol: true }); MAT.glow = T3.mat({ vcol: true, lit: false });
      MAT.water = T3.mat({ map: TX.water, vcol: true, lit: false }); MAT.ice = T3.mat({ map: TX.ice, vcol: true, emissive: 0x203040 });
      MAT.leafA = MAT.leaf; MAT.pineA = MAT.pine;
      const charMat = T3.mat({ vcol: true });
      const glowMat = T3.mat({ vcol: true, lit: false });
      const W0 = wombatModel(T, charMat); scene.add(W0.root);
      const MOD = makeModels(T, charMat);
      // the spin whirl, the shadow blob, the mask that follows you
      const whirl = new T.Mesh(T3.keep(new T.ConeGeometry(0.85, 1.4, 7, 1, true)), T3.mat({ color: 0xf8e0a0, lit: false, transparent: true, opacity: 0.4, side: T.DoubleSide })); whirl.rotation.x = Math.PI; whirl.position.y = 0.75; whirl.visible = false; W0.root.add(whirl);
      const shTex = T3.tex(32, 32, g => { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x - 15.5, y - 15.5) / 15; if (d < 1 && (d < 0.7 || (x + y) % 2)) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x, y, 1, 1); } } });
      const shM = T3.mat({ map: shTex, transparent: true, lit: false }); shM.depthWrite = false;
      const shadow = new T.Mesh(T3.keep(new T.PlaneGeometry(1.2, 1.2)), shM); shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
      const maskM = new T.Mesh(MOD.mask, charMat); maskM.visible = false; scene.add(maskM);

      // ---------------------------------------------------------------- the save (new on this disc: only ever added to)
      const SV = (() => { let s = null; try { s = K.load(); } catch (e) {} if (!s || typeof s !== 'object') s = {};
        s.lives = s.lives > 0 ? s.lives | 0 : 4; s.mangoes = s.mangoes | 0; s.done = s.done || {}; s.gems = s.gems || {}; s.relic = s.relic || {}; s.best = s.best || {}; s.bestT = s.bestT || {};
        s.opt = Object.assign({ music: 1, shake: 1 }, s.opt || {}); s.top = Array.isArray(s.top) ? s.top : []; return s; })();
      const save = () => { try { K.save(SV); } catch (e) {} };
      const padOpen = p => p.need.every(n => SV.done[n]);
      const keyOf = p => p.k + p.i;

      // ---------------------------------------------------------------- sound
      const S = K.sfx;
      const snd = {
        jump() { S.tone(330, 0.12, 'square', 0.07, 0, 680); }, land() { S.noise(0.06, 0.06, 600); },
        spin() { S.noise(0.32, 0.12, 2400, 0, 'bandpass', 700); }, crate() { S.noise(0.16, 0.18, 1600); S.tone(150, 0.1, 'square', 0.07); },
        bounce(n) { S.tone(420 + n * 70, 0.08, 'square', 0.07); }, spring() { S.tone(300, 0.25, 'triangle', 0.09, 0, 1200); },
        steel() { S.tone(900, 0.05, 'square', 0.05); S.tone(1300, 0.08, 'triangle', 0.04, 0.02); },
        mango(i) { S.tone(880 + (i % 4) * 110, 0.05, 'square', 0.045); }, life() { S.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.75]], { bpm: 320, vol: 0.09 }); },
        fuse() { S.tone(880, 0.07, 'square', 0.07); }, boom() { S.noise(0.7, 0.32, 900, 0, 'lowpass', 70); S.tone(80, 0.4, 'sawtooth', 0.1, 0, 30); },
        zap() { S.noise(0.5, 0.25, 4000, 0, 'highpass'); S.tone(1200, 0.4, 'sawtooth', 0.08, 0, 100); },
        kill() { S.tone(300, 0.15, 'square', 0.08, 0, 900); }, check() { S.seq([[79, 0.25], [84, 0.5]], { bpm: 300, vol: 0.08 }); },
        die() { S.seq([[67, 0.5], [63, 0.5], [60, 1]], { bpm: 220, vol: 0.09, wave: 'triangle' }); }, splash() { S.noise(0.5, 0.2, 1200, 0, 'bandpass', 300); },
        mask() { S.seq([[67, 0.25], [71, 0.25], [74, 0.25], [79, 0.5]], { bpm: 400, vol: 0.08, wave: 'triangle' }); }, maskHit() { S.tone(520, 0.2, 'triangle', 0.09, 0, 200); },
        crumble() { S.noise(0.3, 0.1, 500); }, flame() { S.noise(0.25, 0.05, 900, 0, 'bandpass'); },
        move() { S.tone(700, 0.03, 'square', 0.05); }, ok() { S.tone(880, 0.05, 'square', 0.06); S.tone(1320, 0.07, 'square', 0.06, 0.05); }, back() { S.tone(500, 0.05, 'square', 0.05, 0, 300); }, no() { S.tone(160, 0.15, 'square', 0.07); },
        warp() { S.tone(200, 0.8, 'sine', 0.1, 0, 1600); S.noise(0.8, 0.05, 3000, 0, 'highpass'); },
        win() { S.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.5], [79, 0.25], [84, 1]], { bpm: 260, vol: 0.09 }); },
        gem() { S.seq([[84, 0.25], [88, 0.25], [91, 0.25], [96, 1]], { bpm: 300, vol: 0.08, wave: 'triangle' }); },
        snort() { S.noise(0.4, 0.15, 400, 0, 'lowpass', 120); }, squeal() { S.tone(900, 0.3, 'sawtooth', 0.08, 0, 1500); }, thud() { S.noise(0.4, 0.3, 300, 0, 'lowpass', 60); },
        throwB() { S.tone(600, 0.3, 'sine', 0.06, 0, 200); }, laugh() { S.seq([[70, 0.25], [67, 0.25], [70, 0.25], [67, 0.25], [63, 0.5]], { bpm: 420, vol: 0.07, wave: 'sawtooth' }); },
      };
      let song = null; const music = n => { song = n; K.music(n && SV.opt.music ? SONGS[n] : null); };

      // ---------------------------------------------------------------- particles (one Points draw for the lot) + falling snow
      const NP = 240, pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3), pV = new Float32Array(NP * 3), pL = new Float32Array(NP); let pN = 0;
      for (let i = 0; i < NP; i++) pPos[i * 3 + 1] = -999;
      const pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(pPos, 3)); pG.setAttribute('color', new T.BufferAttribute(pCol, 3)); pG.boundingSphere = new T.Sphere(new T.Vector3(), 1e6);
      const pM = new T.PointsMaterial({ size: 0.22, vertexColors: true }); const parts = new T.Points(pG, pM); parts.frustumCulled = false; scene.add(parts);
      function burst(x, y, z, col, n, sp, life, up) { const [r, g, b] = hexRGB(col); for (let k = 0; k < n; k++) { const i = pN = (pN + 1) % NP; pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pV[i * 3] = (Math.random() - 0.5) * sp; pV[i * 3 + 1] = Math.random() * sp * 0.7 + (up == null ? 2 : up); pV[i * 3 + 2] = (Math.random() - 0.5) * sp; const v = 0.75 + Math.random() * 0.35; pCol[i * 3] = r * v; pCol[i * 3 + 1] = g * v; pCol[i * 3 + 2] = b * v; pL[i] = (life || 0.7) * (0.6 + Math.random() * 0.6); } }
      const snowP = { on: false };
      function stepParts(dt) {
        for (let i = 0; i < NP; i++) { if (pL[i] <= 0) continue; pL[i] -= dt; if (pL[i] <= 0) { pPos[i * 3 + 1] = -999; continue; } pV[i * 3 + 1] -= (pV[i * 3 + 1] > -1.2 && pCol[i * 3 + 2] > 0.95 && pCol[i * 3] > 0.95 ? 1 : 16) * dt; pPos[i * 3] += pV[i * 3] * dt; pPos[i * 3 + 1] += pV[i * 3 + 1] * dt; pPos[i * 3 + 2] += pV[i * 3 + 2] * dt; }
        if (snowP.on && Math.random() < 0.7) { const i = pN = (pN + 1) % NP; const cz = cam.position.z; pPos[i * 3] = cam.position.x + (Math.random() - 0.5) * 24; pPos[i * 3 + 1] = 7 + Math.random() * 3; pPos[i * 3 + 2] = cz - Math.random() * 26 * (LV && LV.L && LV.L.chase ? -1 : 1); pV[i * 3] = 0.4; pV[i * 3 + 1] = -1.2; pV[i * 3 + 2] = 0; pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 1; pL[i] = 6; }
        pG.attributes.position.needsUpdate = true; pG.attributes.color.needsUpdate = true;
      }
      function clearParts() { for (let i = 0; i < NP; i++) { pL[i] = 0; pPos[i * 3 + 1] = -999; } pG.attributes.position.needsUpdate = true; }

      // ---------------------------------------------------------------- the world (a level, a boss arena or the warp room)
      let WD = null; // { root, kind, ... }
      const dummy = new T.Object3D();
      function clearWorld() { if (!WD) return; scene.remove(WD.root); WD.root.traverse(o => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); }); WD = null; snowP.on = false; clearParts(); }
      function setLook(sky, fog) { scene.fog.color.setHex(fog[0]); scene.fog.near = fog[1]; scene.fog.far = fog[2]; scene.background = new T.Color(fog[0]); paintSky(sky[0], sky[1]); }
      const skyG = new T.SphereGeometry(140, 12, 8), skyCol = new Float32Array(skyG.attributes.position.count * 3); skyG.setAttribute('color', new T.BufferAttribute(skyCol, 3));
      const skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false }); const sky = new T.Mesh(skyG, skyM); sky.renderOrder = -10; scene.add(sky);
      function paintSky(top, hor) { const P = skyG.attributes.position, A = hexRGB(top), B2 = hexRGB(hor); for (let i = 0; i < P.count; i++) { const y = P.getY(i) / 140, k = y > 0 ? Math.pow(y, 0.6) : 0; for (let c = 0; c < 3; c++) skyCol[i * 3 + c] = lerp(B2[c], A[c], k); } skyG.attributes.color.needsUpdate = true; }
      // instanced crates and mangoes: one draw call per kind
      const CRATE_KINDS = ['crate', 'q', 'b', 's', 'n', 't', 'z', 'k', '1', 'a'];
      const crateGeo = T3.keep(new T.BoxGeometry(1, 1, 1));
      const crateMat = {}; for (const k of CRATE_KINDS) crateMat[k] = T3.mat({ map: TX[k], emissive: k === 'z' ? 0x1a5a1a : k === 't' ? 0x3a0a00 : 0x000000 });
      function instanced(geo, mat, n, root) { const m = new T.InstancedMesh(geo, mat, Math.max(1, n)); m.count = n; m.userData.shared = true; m.frustumCulled = false; root.add(m); return m; }
      const setInst = (im, i, x, y, z, s, ry, rx, sx, sy) => { dummy.position.set(x, y, z); dummy.rotation.set(rx || 0, ry || 0, 0); dummy.scale.set((sx || 1) * s, (sy || 1) * s, s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); im.instanceMatrix.needsUpdate = true; };

      // ---- a level
      const cxOf = (L, r) => L.chase ? Math.sin(r * 0.07) * 2.5 : Math.sin(r * 0.09) * 3 + Math.sin(r * 0.031) * 4;
      function buildLevel(li) {
        clearWorld();
        const L = LEVELS[li], rows = L.rows, root = new T.Group(); scene.add(root);
        const r = prng(99 + li * 31), B = Builder(T), th = L.theme;
        const w = { kind: 'level', L, li, root, rows, crates: [], fruit: [], foes: [], rocks: [], plats: [], tiles: [], jets: [], goal: rows.length - 1, total: 0, cx: rr => cxOf(L, rr) };
        setLook(L.sky, L.fog); snowP.on = th === 'snow';
        lit.hemi.intensity = th === 'temple' ? 0.75 : 0.85; lit.sun.intensity = 0.75; lit.hemi.groundColor.setHex(th === 'snow' ? 0x8a9ab0 : 0x5a4a30);
        const gTex = th === 'jungle' ? 'path' : th === 'river' ? 'path' : th === 'temple' ? 'stone' : th === 'chase' ? 'sand' : 'snow';
        const sideTex = th === 'jungle' ? 'grass' : th === 'river' ? 'grass' : th === 'temple' ? 'stone' : th === 'chase' ? 'cliff' : 'snow';
        const crateList = { crate: [], q: [], b: [], s: [], n: [], t: [], z: [], k: [], 1: [], a: [] };
        const addCrate = (x, y, z, k, row) => { const kk = k === 'c' || k === '2' ? 'crate' : k; const c = { x, y, z, k: kk, r: row, alive: true, hits: 0, fuse: -1, idx: crateList[kk].length, sq: 0 }; crateList[kk].push(c); w.crates.push(c); if (kk !== 'n' && kk !== 's') w.total++; return c; };
        for (let rI = 0; rI < rows.length; rI++) {
          const z = -rI * TS, ox = w.cx(rI), row = rows[rI];
          for (let c = 0; c < 5; c++) {
            const ch = row[c] || '.', x = ox + (c - 2) * TS, chk = (rI + c) % 2;
            const solidG = '.cqbsntzk12afFreuhpgrj'.includes(ch);
            if (solidG || ch === 'B' || ch === 'i') {
              const key = ch === 'B' ? 'plank' : ch === 'i' ? 'ice' : gTex;
              B.box(key, x, -3, z, TS, 3, TS, chk ? 0xffffff : 0xe4dccc, { ts: 2, flatTop: true, lo: 0.45 });
              if (ch === 'B') for (const s of [-1, 1]) if (c === (s < 0 ? 0 : 4) || row[c + s] !== 'B') { B.box('plank', x + s * 0.95, 0, z, 0.12, 0.7, 0.12, 0x6a4a2a); B.box('plank', x + s * 0.95, 0.62, z, 0.08, 0.08, TS, 0xc8a060); }
            }
            if (ch === 'x') { const g = new T.Mesh(T3.keep(new T.BoxGeometry(TS * 0.98, 0.6, TS * 0.98)), MAT.crack); g.position.set(x, -0.3, z); root.add(g); w.tiles.push({ k: 'x', x, z, r: rI, c, mesh: g, t: 0, st: 0, y: 0 }); }
            if (ch === 'l') { const g = new T.Mesh(T3.keep(new T.CylinderGeometry(0.95, 0.95, 0.12, 10)), MAT.lily); g.position.set(x, -0.08, z); root.add(g); w.tiles.push({ k: 'l', x, z, r: rI, c, mesh: g, t: 0, st: 0, y: 0 }); }
            if (ch === 'j') { const fl = new T.Mesh(T3.keep(new T.CylinderGeometry(0.15, 0.55, 2.6, 6, 1, true)), T3.mat({ color: 0xffa020, lit: false, transparent: true, opacity: 0.85 })); fl.position.set(x, 1.3, z); root.add(fl); B.cyl('rock', x, 0.08, z, 0.45, 0.16, 0x3a3028); w.jets.push({ x, z, r: rI, mesh: fl, ph: (rI * 0.37 + c * 0.6) % 2.4 }); }
            if (ch === 'c' || ch === 'q' || ch === 'b' || ch === 's' || ch === 'n' || ch === 't' || ch === 'z' || ch === 'k' || ch === '1' || ch === 'a') addCrate(x, 0, z, ch, rI);
            if (ch === '2') { addCrate(x, 0, z, 'c', rI); addCrate(x, 1, z, 'c', rI); }
            if (ch === 'f' || ch === 'F') w.fruit.push({ x, y: ch === 'F' ? 3.2 : 0.7, z, got: false });
            if ('ehpu'.includes(ch)) w.foes.push({ k: ch, x, z, r: rI, ox, ax: x, ph: r() * 6, alive: true, vy: 0, dead: 0, y: 0, flip: 0 });
            if (ch === 'r') { const s = 0.9 + r() * 0.3; B.ball(th === 'snow' ? 'snow' : 'rock', x, 0.55, z, 0.95 * s, 0xc0b8a8, { sy: 0.85, jit: 0.15 }, 7); w.rocks.push({ x, z, top: 1.25 }); }
            if (ch === 'm' || ch === 'L') { const isLog = ch === 'L'; const p = new T.Mesh(T3.keep(isLog ? new T.CylinderGeometry(0.5, 0.5, 3.6, 8) : new T.BoxGeometry(1.9, 0.4, 1.9)), isLog ? MAT.bark : MAT[gTex === 'snow' ? 'ice' : 'stone']); if (isLog) p.rotation.z = Math.PI / 2; root.add(p); w.plats.push({ r: rI, z, ox, mesh: p, x: ox, ph: r() * 6, log: isLog, w: isLog ? 1.8 : 0.95 }); }
            if (ch === 'g') w.goal = rI;
          }
          // what's either side: banks, walls, trees...
          const edgeL = ox - 5 * TS / 2, edgeR = ox + 5 * TS / 2;
          const hasL = row[0] !== ' ' && row[0] !== 'w' && row[0] !== 'm', hasR = row[4] !== ' ' && row[4] !== 'w' && row[4] !== 'm';
          for (const s of [-1, 1]) {
            const ex = s < 0 ? edgeL : edgeR, has = s < 0 ? hasL : hasR;
            if (th === 'jungle') {
              if (has) B.box('grass', ex + s * 3, -3, z, 6, 3.4, TS, 0xffffff, { ts: 2, lo: 0.5 });
              if (rI % 2 === 0) { const h = 5 + r() * 4, tx = ex + s * (2.4 + r() * 3); B.cyl('bark', tx, h / 2 - 0.2, z, 0.35 + r() * 0.15, h, 0xffffff, { ts: 1 }, 6); B.ball('leaf', tx, h + 0.6, z, 2 + r() * 0.8, 0xffffff, { sy: 0.6, ts: 1.5 }, 7); B.ball('leaf', tx - s * 1.2, h - 0.3, z + 0.8, 1.3, 0xd8f0c8, { sy: 0.6, ts: 1.5 }, 6); }
              else { B.cone('leaf', ex + s * 1.2, 0.8, z, 0.9 + r() * 0.4, 1.4, 0xb8e8a0, { ts: 1 }, 5); if (r() < 0.4) B.ball('plain', ex + s * 0.6, 0.6, z + 0.6, 0.22, [0xff3a8a, 0xffd03a, 0xff6a2a][r() * 3 | 0], {}, 5); }
              if (rI % 9 === 4) B.ball('rock', ex + s * 1.4, 0.5, z, 1.1, 0xb0a890, { sy: 0.7, jit: 0.2 }, 6);
            } else if (th === 'river') {
              if (has) B.box('grass', ex + s * 1.2, -3, z, 2.4, 3.1, TS, 0xffffff, { ts: 2, lo: 0.5 });
              if (rI % 3 === 0) { B.cyl('plain', ex + s * (1.2 + r()), 0.6, z + r(), 0.05, 1.2 + r(), 0x6a8a3a, {}, 4); B.cyl('plain', ex + s * (1.5 + r()), 0.5, z, 0.05, 1, 0x7a9a4a, {}, 4); B.ball('plain', ex + s * 1.4, 1.1, z, 0.08, 0x5a3a1a, { sy: 2.4 }, 4); }
              if (rI % 4 === 1) { const h = 6 + r() * 3, tx = ex + s * (4 + r() * 3); B.cyl('bark', tx, h / 2 - 0.4, z, 0.4, h, 0xffffff, { ts: 1 }, 6); B.ball('leaf', tx, h + 0.4, z, 2.4, 0xc8f0b0, { sy: 0.55 }, 7); }
              if (rI % 7 === 3) B.ball('rock', ex + s * 0.8, -0.2, z, 0.9, 0xa8a090, { sy: 0.6, jit: 0.2 }, 6);
            } else if (th === 'temple') {
              B.box('stone', ex + s * 0.6, -3, z, 1.2, 3.6, TS, 0xd8d0c0, { ts: 2 });
              if (rI % 4 === 0) { B.box('stone', ex + s * 1.8, 0, z, 1.4, 6.5, 1.4, 0xc8c0b0, { ts: 2 }); B.box('stone', ex + s * 1.8, 6.5, z, 1.8, 0.5, 1.8, 0xb8b0a0); }
              else B.box(rI % 4 === 2 ? 'carve' : 'stone', ex + s * 1.9, 0, z, 1, 5, TS, 0xe8e0d0, { ts: rI % 4 === 2 ? 2.5 : 2, uv: rI % 4 === 2 ? undefined : undefined });
              if (rI % 8 === 2) { B.cyl('rock', ex - s * 0.1, 0.6, z, 0.12, 1.2, 0x5a4a3a, {}, 5); B.ball('glow', ex - s * 0.1, 1.35, z, 0.22, 0xffb030, { sy: 1.5 }, 6); }
              if (rI % 12 === 6) B.box('stone', ox, 7, z, 13, 1.2, 1.6, 0xb8b0a0, { ts: 2 });
            } else if (th === 'chase') {
              B.box('cliff', ex + s * 3, -3, z, 6, 3.6 + (rI % 3) * 0.8 + r() * 2.5, TS + 0.2, 0xffffff, { ts: 3, lo: 0.6, jit: 0.15 });
              if (rI % 3 === 0) B.box('cliff', ex + s * 5, 0, z, 3, 6 + r() * 6, TS + 0.4, 0xe8d0c0, { ts: 3, jit: 0.2 });
              if (rI % 6 === 2) { B.cyl('plain', ex + s * 0.9, 0.7, z, 0.18, 1.4, 0x3a8a3a, {}, 6); B.cyl('plain', ex + s * 0.9 + s * 0.3, 1, z, 0.08, 0.5, 0x3a8a3a, { rz: s * 1.2 }, 5); }
            } else {
              if (has) B.box('snow', ex + s * 3, -3, z, 6, 3.3 + (rI % 4 === 0 ? 0.4 : 0), TS, 0xffffff, { ts: 2, lo: 0.6 });
              if (rI % 2 === 0) { const h = 3 + r() * 3, tx = ex + s * (1.6 + r() * 4); B.cyl('bark', tx, 0.4, z, 0.15, 0.8, 0xffffff, {}, 5); for (let k = 0; k < 3; k++) B.cone('pine', tx, 0.8 + k * h * 0.28 + h * 0.18, z, (1.3 - k * 0.32) * (h / 4.5), h * 0.42, 0xffffff, { ts: 1 }, 6); B.cone('snow', tx, 0.8 + h * 0.92, z, 0.3 * h / 4.5, h * 0.18, 0xffffff, {}, 6); }
              if (rI % 7 === 5) B.box('ice', ex + s * 2.5, 0, z, 1.6, 2.5 + r() * 2, 1.6, 0xd8f0ff, { ry: r() });
            }
          }
          if (th === 'river') B.box('water', ox, -0.62, z, 60, 0.2, TS, rI % 2 ? 0xffffff : 0xe8f4ff, { ts: 4, flatTop: true });
          if (th === 'temple' && rI % 2) B.box('stone', ox, -3.2, z, 10, 0.2, TS, 0x5a5048);
        }
        // the far end: a stone arch round the warp pad
        const gz = -w.goal * TS, gx = w.cx(w.goal), archK = th === 'snow' ? 'ice' : th === 'chase' ? 'cliff' : 'stone';
        B.box(archK, gx - 4.6, 0, gz - 1, 1.4, 5, 1.4, 0xd8d0c0); B.box(archK, gx + 4.6, 0, gz - 1, 1.4, 5, 1.4, 0xd8d0c0); B.box(archK, gx, 5, gz - 1, 10.6, 1.2, 1.6, 0xc8c0b0);
        B.box('stone', gx, -3, gz - TS * 2, TS * 5, 3, TS * 2, 0xd8d0c0, { ts: 2, flatTop: true });
        const abyss = th === 'river' ? 0x1a4a7a : th === 'snow' ? 0x9ab0c8 : th === 'chase' ? 0x4a2010 : 0x1a2a10;
        B.box('glow', 0, -12, -rows.length, 120, 0.2, rows.length * TS + 80, abyss);
        w.meshes = B.build(root, MAT); B.dispose();
        // the warp pad
        const pad = new T.Mesh(T3.keep(new T.CylinderGeometry(1.4, 1.5, 0.25, 12)), T3.mat({ color: 0x7af0ff, lit: false, transparent: true, opacity: 0.85 })); pad.position.set(gx, 0.13, gz); root.add(pad); w.warp = pad;
        const ring = new T.Mesh(T3.keep(new T.TorusGeometry(1.5, 0.12, 6, 14)), T3.mat({ color: 0xffffff, lit: false })); ring.rotation.x = Math.PI / 2; ring.position.set(gx, 0.3, gz); root.add(ring); w.ring = ring;
        // the instanced things
        w.inst = {}; for (const k of CRATE_KINDS) { const list = crateList[k]; if (!list.length) continue; const im = instanced(crateGeo, crateMat[k], list.length, root); w.inst[k] = im; for (const c of list) setInst(im, c.idx, c.x, c.y + 0.5, c.z, 0.98); }
        w.mango = instanced(MOD.mango, charMat, w.fruit.length, root); w.fruit.forEach((f, i) => { f.i = i; setInst(w.mango, i, f.x, f.y, f.z, 1.6); });
        for (const f of w.foes) { const g = new T.Group(); const body = new T.Mesh(f.k === 'e' ? MOD.crab : f.k === 'h' ? MOD.hog : f.k === 'p' ? MOD.peng : MOD.turtle, charMat); body.userData.shared = true; g.add(body); if (f.k === 'e') { const cl = new T.Mesh(MOD.claws, charMat); cl.userData.shared = true; g.add(cl); f.claws = cl; } f.body = body; f.g = g; g.position.set(f.x, 0, f.z); root.add(g); }
        if (L.chase) { const b = new T.Mesh(MOD.boulder, MAT.rock); b.userData.shared = true; root.add(b); w.boulder = { mesh: b, z: 9, sp: 5.2, roll: 0 }; }
        WD = w; return w;
      }

      // ---- the warp room
      const padPos = i => { const a = (-72 + i * 24) * Math.PI / 180; return [Math.sin(a) * 9, -Math.cos(a) * 9 - 1]; };
      const padName = p => p.k === 'L' ? LEVELS[p.i].name : BOSSES[p.i].name;
      function signTex(p) {
        const open = padOpen(p), k = keyOf(p);
        return T3.tex(64, 32, g => {
          g.fillStyle = open ? (p.k === 'B' ? '#5a1a2a' : '#1a2a5a') : '#2a2a2a'; g.fillRect(0, 0, 64, 32); g.fillStyle = open ? '#ffd040' : '#6a6a6a'; g.fillRect(0, 0, 64, 2); g.fillRect(0, 30, 64, 2);
          g.font = 'bold 9px Arial'; g.textAlign = 'center'; g.fillStyle = open ? '#ffffff' : '#8a8a8a';
          const words = padName(p).split(' '); g.fillText(open ? words[0] : 'LOCKED', 32, 13); if (open) g.fillText(words.slice(1).join(' '), 32, 24);
          if (SV.done[k]) { g.fillStyle = '#3aff6a'; g.fillRect(56, 3, 5, 5); }
        });
      }
      function buildHub() {
        clearWorld();
        const root = new T.Group(); scene.add(root); const B = Builder(T), r = prng(5);
        setLook([0x2a2a6a, 0xa87ab8], [0x6a5a8a, 30, 90]); lit.hemi.intensity = 0.9; lit.hemi.groundColor.setHex(0x3a3048);
        B.cyl('hub', 0, -0.5, 0, 13, 1, 0xffffff, { ts: 2, flatTop: true }, 24); B.cyl('hub', 0, -0.02, 0, 4, 0.06, 0xb8b0d8, {}, 16);
        for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, x = Math.sin(a) * 13.4, z = -Math.cos(a) * 13.4; if (z > 6) continue; B.box('stone', x, 0, z, 3.2, 5 + (i % 2) * 0.8, 1.2, 0xc8c0d8, { ry: -a, ts: 2 }); }
        for (let i = 0; i < 8; i++) { const a = (-84 + i * 24) * Math.PI / 180, x = Math.sin(a) * 11, z = -Math.cos(a) * 11 - 1; B.cyl('stone', x, 3, z, 0.55, 6, 0xd8d0e8, { ts: 2 }, 8); B.box('stone', x, 6, z, 1.5, 0.5, 1.5, 0xb8b0c8); B.ball('glow', x, 6.6, z, 0.28, 0xffc060, {}, 6); }
        for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; B.cone('plain', Math.sin(a) * 16, 0, -Math.cos(a) * 16, 2.5, 7 + r() * 5, 0x2a2a4a, {}, 5); }
        const pads = [];
        PADS.forEach((p, i) => {
          const [x, z] = padPos(i), open = padOpen(p), col = p.k === 'B' ? 0xff4a6a : LEVELS[p.i].gem;
          B.cyl('stone', x, 0.15, z, 1.4, 0.3, 0xb8b0c8, {}, 12);
          const top = new T.Mesh(T3.keep(new T.CylinderGeometry(1.15, 1.15, 0.08, 14)), T3.mat({ color: open ? col : 0x3a3a3a, lit: false, transparent: true, opacity: open ? 0.85 : 1 })); top.position.set(x, 0.32, z); root.add(top);
          const sign = new T.Mesh(T3.keep(new T.PlaneGeometry(3, 1.5)), T3.mat({ map: signTex(p), lit: false })); sign.position.set(x * 1.08, 2.6, z * 1.08 - 0.08); sign.lookAt(0, 2.6, 4); root.add(sign);
          B.box('stone', x * 1.08 - 0.06, 0, z * 1.08, 0.12, 2.0, 0.12, 0x8a8298);
          const gem = new T.Mesh(MOD.gem, T3.mat({ color: col, emissive: col, lit: true })); gem.userData.shared = true; gem.scale.setScalar(0.45); gem.position.set(x - 0.6, 1.4, z); gem.visible = p.k === 'L' && !!SV.gems['L' + p.i]; root.add(gem);
          const rel = new T.Mesh(T3.keep(new T.CylinderGeometry(0.18, 0.28, 0.5, 6)), T3.mat({ color: [0, 0x3a6aff, 0xffd040, 0xe8f0ff][SV.relic['L' + p.i] | 0] || 0x3a6aff, emissive: 0x202020 })); rel.position.set(x + 0.6, 1.4, z); rel.visible = p.k === 'L' && !!SV.relic['L' + p.i]; root.add(rel);
          pads.push({ p, x, z, open, top, gem, rel, col });
        });
        B.build(root, MAT); B.dispose();
        WD = { kind: 'hub', root, pads };
      }
      // ---- the boss arenas
      function buildBoss(bi) {
        clearWorld();
        const Bd = BOSSES[bi], root = new T.Group(); scene.add(root); const B = Builder(T), r = prng(17 + bi);
        setLook(Bd.sky, Bd.fog); lit.hemi.intensity = 0.9;
        const R = 10;
        if (bi === 0) {
          B.cyl('sand', 0, -1, 0, R + 0.5, 1, 0xffffff, { ts: 2, flatTop: true }, 24);
          for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; B.ball('rock', Math.cos(a) * (R + 1.2), 0.8, Math.sin(a) * (R + 1.2), 1.4 + r() * 0.6, 0xc8a890, { sy: 1.2 + r() * 0.6, jit: 0.2 }, 6); }
          for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.2; B.box('cliff', Math.cos(a) * 18, 0, Math.sin(a) * 18, 5, 8 + r() * 8, 5, 0xffffff, { ry: a, ts: 3 }); }
          for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.cyl('bark', Math.cos(a) * 14, 3, Math.sin(a) * 14, 0.4, 6, 0xffffff, {}, 6); B.ball('leaf', Math.cos(a) * 14, 6.5, Math.sin(a) * 14, 2.6, 0xffffff, { sy: 0.6 }, 7); }
        } else {
          B.cyl('metalw', 0, -1, 0, R + 0.5, 1, 0xb8c0d0, { ts: 2, flatTop: true }, 24); B.cyl('glow', 0, 0.01, 0, 2, 0.02, 0x3affd0, {}, 16);
          for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, x = Math.cos(a) * (R + 0.6), z = Math.sin(a) * (R + 0.6); B.box('metalw', x, 0, z, 1, 3 + (i % 2) * 2, 1, 0x8a90a0, { ry: -a }); B.ball('glow', x, 3.4 + (i % 2) * 2, z, 0.3, i % 2 ? 0xff3a6a : 0x3affd0, {}, 6); }
          for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3; B.box('metalw', Math.cos(a) * 17, 0, Math.sin(a) * 17, 4, 10 + r() * 6, 4, 0x5a6070, { ry: a }); B.box('glow', Math.cos(a) * 15, 4 + r() * 4, Math.sin(a) * 15, 0.3, 1.5, 0.3, 0x3a8aff, { ry: a }); }
        }
        B.build(root, MAT); B.dispose();
        const w = { kind: 'boss', bi, root, R, hp: Bd.hp, st: 'intro', t: 0, balls: [], zaps: [], rocks: [] };
        if (bi === 0) {
          const g = new T.Group(); const body = new T.Mesh(MOD.tusk, charMat); body.userData.shared = true; g.add(body);
          const legs = [[-0.5, 0.7], [0.5, 0.7], [-0.5, -0.7], [0.5, -0.7]].map(([x, z]) => { const l = new T.Mesh(MOD.tleg, charMat); l.userData.shared = true; l.position.set(x, 0.8, z); g.add(l); return l; });
          g.position.set(0, 0, -6); root.add(g); w.boss = { g, body, legs, x: 0, z: -6, yaw: 0, st: 'walk', t: 0, vx: 0, vz: 0, stun: 0, inv: 0 };
          const stars = new T.Group(); for (let i = 0; i < 4; i++) { const s = new T.Mesh(T3.keep(new T.OctahedronGeometry(0.16, 0)), T3.mat({ color: 0xffe040, lit: false })); stars.add(s); } g.add(stars); stars.position.y = 2.4; w.stars = stars;
        } else {
          const g = new T.Group(); const pod = new T.Mesh(MOD.pod, charMat); pod.userData.shared = true; g.add(pod); const dg = new T.Mesh(MOD.dingo, charMat); dg.userData.shared = true; dg.position.y = 0.05; g.add(dg);
          const dome = new T.Mesh(T3.keep(new T.SphereGeometry(0.85, 10, 6, 0, TAU, 0, Math.PI / 2)), T3.mat({ color: 0xa8e8ff, transparent: true, opacity: 0.3, lit: false })); dome.position.y = 0.25; g.add(dome);
          g.position.set(0, 4, -5); root.add(g); w.boss = { g, pod, dg, x: 0, z: -5, y: 4, a: 0, st: 'fly', t: 0, throws: 0, inv: 0 };
        }
        WD = w; return w;
      }

      // ================================================================ playing
      let mode = 'title', mt = 0, LV = null, P = null, paused = false, psel = 0, msg = '', msgT = 0, msgSub = '', flash = 0, shake = 0;
      const DBG = { auto: false, god: false };
      function say(t, sub, life) { msg = t; msgSub = sub || ''; msgT = life || 1.6; }
      function newP(x, y, z, face) { return { x, y, z, vx: 0, vz: 0, vy: 0, face: face == null ? Math.PI : face, ground: true, spin: 0, spinCool: 0, inv: 1.2, coy: 0, buf: 0, ph: 0, onPlat: null, stand: 0 }; }
      const rowAt = z => Math.round(-z / TS);
      function tileAt(x, z) { const w = WD; const r = rowAt(z); if (r < 0) return r < -2 ? null : '.'; if (r >= w.rows.length) return r > w.rows.length + 1 ? null : (Math.abs(x - w.cx(w.goal)) < 5 ? '.' : null); const c = Math.round((x - w.cx(r)) / TS + 2); if (c < 0 || c > 4) return null; return w.rows[r][c] || '.'; }
      const GROUND = '.cqbsntzk12afFreuhpgjBi';
      function floorAt(x, z) {
        const w = WD; let f = -Infinity;
        if (w.kind === 'level') {
          const t = tileAt(x, z);
          if (t && GROUND.includes(t)) f = 0;
          if (t === 'x' || t === 'l') { const tl = w.tiles.find(q => Math.abs(q.x - x) < TS / 2 + 0.01 && Math.abs(q.z - z) < TS / 2 + 0.01); if (tl && tl.st < 2) f = t === 'l' ? tl.y : 0; }
          for (const p of w.plats) if (Math.abs(p.z - z) < 1.05 && Math.abs(p.x - x) < p.w) f = Math.max(f, 0.02);
          for (const k of w.rocks) if (Math.abs(k.x - x) < 0.9 && Math.abs(k.z - z) < 0.9) f = Math.max(f, k.top);
          for (const c of w.crates) if (c.alive && c.k === 'n' && Math.abs(c.x - x) < 0.8 && Math.abs(c.z - z) < 0.8) f = Math.max(f, c.y + 1);
          for (const fo of w.foes) if (fo.alive && fo.k === 'u' && fo.flip && Math.abs(fo.x - x) < 0.8 && Math.abs(fo.z - z) < 0.8) f = Math.max(f, 0.5);
        } else if (w.kind === 'hub') { if (Math.hypot(x, z) < 12.5) f = 0; for (const p of w.pads) if (Math.hypot(p.x - x, p.z - z) < 1.4) f = 0.3; }
        else { if (Math.hypot(x, z) < w.R + 0.4) f = 0; }
        return f;
      }
      // ---- starting things
      function startLevel(li, tt, demo) {
        buildLevel(li); P = newP(WD.cx(0), 0, 0); LV = { kind: 'level', li, L: LEVELS[li], tt: !!tt, demo: !!demo, t: 0, crates: 0, fruit: 0, kills: 0, score: 0, cp: 0, deadT: 0, done: null, endT: 0, mask: 0, invT: 0, deaths: 0, started: 0 };
        mode = 'level'; mt = 0; paused = false; maskM.visible = false;
        music(demo ? 'title' : LEVELS[li].song); if (!demo) say(LEVELS[li].name, tt ? 'TIME TRIAL!' : '', 2.4);
        camFollow(0, true);
      }
      function startBoss(bi) {
        buildBoss(bi); P = newP(0, 0, 6); LV = { kind: 'boss', bi, t: 0, score: 0, fruit: 0, crates: 0, kills: 0, deadT: 0, done: null, endT: 0, mask: 0, invT: 0, deaths: 0 };
        mode = 'boss'; mt = 0; paused = false; maskM.visible = false; music('boss'); say(BOSSES[bi].name, bi ? 'JUMP ON THE POD WHEN IT LANDS' : 'MAKE HIM CHARGE THE ROCKS', 3);
        camFollow(0, true);
      }
      function goHub(fromPad) {
        buildHub(); const pi = fromPad == null ? -1 : fromPad; const pp = pi >= 0 ? padPos(pi) : [0, 4];
        P = newP(pi >= 0 ? pp[0] * 0.7 : 0, 0, pi >= 0 ? pp[1] * 0.7 : 4, Math.PI); LV = { kind: 'hub', t: 0, pad: -1, deadT: 0, mask: 0, invT: 0 };
        mode = 'hub'; mt = 0; paused = false; maskM.visible = false; music('hub'); camFollow(0, true);
      }
      // ---- score bits
      function addFruit(n) {
        for (let i = 0; i < n; i++) { snd.mango(LV.fruit + i); }
        LV.fruit += n; LV.score += n * 10; SV.mangoes += n;
        while (SV.mangoes >= 100) { SV.mangoes -= 100; if (!LV.tt) { SV.lives = Math.min(99, SV.lives + 1); say('EXTRA LIFE!', '', 1.4); snd.life(); } }
      }
      function hideCrate(c) { c.alive = false; const im = WD.inst[c.k]; if (im) setInst(im, c.idx, 0, -50, 0, 0.001); }
      function smash(c, how) {
        if (!c.alive || c.k === 'n') return false;
        if (c.k === 's') { return false; }
        if (c.k === 'z') { boom(c); return true; }
        if (c.k === 't') { if (how === 'jump' || how === 'head') { if (c.fuse < 0) { c.fuse = 3; snd.fuse(); } return true; } boom(c); return true; }
        if (c.k === 'b' && how === 'jump') { c.hits++; addFruit(1); snd.bounce(c.hits); c.sq = 0.25; if (c.hits < 5) return true; }
        hideCrate(c); LV.crates++; LV.score += 50; snd.crate();
        burst(c.x, c.y + 0.5, c.z, 0xc88a3a, 10, 6, 0.7); burst(c.x, c.y + 0.5, c.z, 0x6a3a14, 4, 5, 0.6);
        if (c.k === 'crate') addFruit(c.y > 0 ? 2 : 1 + (Math.random() < 0.5 ? 1 : 0));
        else if (c.k === 'q') { addFruit(5 + (Math.random() * 5 | 0)); burst(c.x, c.y + 0.8, c.z, 0xffa01a, 8, 4, 0.6); }
        else if (c.k === 'b') addFruit(2);
        else if (c.k === 'k') { LV.cp = c.r; LV.cpX = c.x; say('CHECKPOINT!', '', 1.2); snd.check(); burst(c.x, 1, c.z, 0x7ab0f0, 12, 5, 0.8); }
        else if (c.k === '1') { if (!LV.tt) SV.lives = Math.min(99, SV.lives + 1); say('EXTRA LIFE!', '', 1.4); snd.life(); }
        else if (c.k === 'a') { LV.mask = Math.min(3, LV.mask + 1); snd.mask(); say(LV.mask >= 3 ? 'TIKI POWER!' : 'TIKI MASK!', LV.mask >= 3 ? 'NOTHING CAN TOUCH YOU' : '', 1.4); if (LV.mask >= 3) LV.invT = 8; }
        return true;
      }
      function boom(c) {
        if (!c.alive) return; hideCrate(c); LV.crates++; LV.score += 50;
        const zap = c.k === 'z'; burst(c.x, c.y + 0.6, c.z, zap ? 0x6aff6a : 0xffb020, 22, 10, 0.8); burst(c.x, c.y + 0.6, c.z, zap ? 0xffffff : 0xd02a1a, 10, 8, 0.6); flash = 0.25; shake = Math.max(shake, 0.4);
        zap ? snd.zap() : snd.boom();
        for (const o of WD.crates) if (o.alive && o !== c && Math.hypot(o.x - c.x, o.z - c.z) < 2.6 && Math.abs(o.y - c.y) < 2.5) { if (o.k === 't' || o.k === 'z') setTimeout(() => { if (LV && WD && WD.crates.includes(o)) boom(o); }, 140); else if (o.k !== 'n' && o.k !== 's') smash(o, 'boom'); }
        for (const f of WD.foes) if (f.alive && Math.hypot(f.x - c.x, f.z - c.z) < 2.6) kill(f);
        if (P && Math.hypot(P.x - c.x, P.z - c.z) < 2.3 && Math.abs(P.y - c.y) < 2) hurt(zap ? 'ZAPPED!' : 'BOOM!');
      }
      function kill(f) { if (!f.alive) return; f.alive = false; f.vy = 7; f.dead = 1.2; LV.kills++; LV.score += 100; snd.kill(); burst(f.x, 0.5, f.z, 0xffffff, 6, 4, 0.5); }
      function hurt(why) {
        if (!P || LV.deadT > 0 || LV.done || DBG.god) return;
        if (LV.invT > 0 || P.inv > 0) return;
        if (LV.demo) return;
        if (LV.mask > 0) { LV.mask--; P.inv = 1.6; snd.maskHit(); burst(P.x, P.y + 1, P.z, 0xffd040, 10, 5, 0.6); return; }
        die(why);
      }
      function die(why) {
        if (LV.deadT > 0 || LV.done) return;
        if (LV.demo) { respawn(); return; }
        LV.deadT = 1.8; say(why || 'OUCH!', '', 1.6); LV.deaths++; LV.mask = 0; LV.invT = 0;
        if (!LV.tt) SV.lives--;
        snd.die(); burst(P.x, P.y + 0.6, P.z, 0x9a6438, 14, 6, 0.8); shake = 0.3;
      }
      function respawn() {
        if (LV.kind === 'level') {
          const r = LV.cp; P = newP(LV.cpX != null && r ? LV.cpX : WD.cx(r), 0, -r * TS, Math.PI);
          if (LV.L.chase) P.face = 0;
          for (const t of WD.tiles) { t.st = 0; t.t = 0; t.y = 0; t.mesh.position.y = t.k === 'l' ? -0.08 : -0.3; t.mesh.visible = true; t.mesh.rotation.set(0, 0, 0); }
          if (WD.boulder) { WD.boulder.z = -r * TS + 10; WD.boulder.wait = 1.4; }
        } else { P = newP(0, 0, 6); resetBoss(); }
        P.inv = 1.6; camFollow(0, true);
      }
      function resetBoss() { const w = WD, b = w.boss; w.hp = BOSSES[w.bi].hp; b.st = w.bi ? 'fly' : 'walk'; b.t = 0; b.inv = 0; if (w.bi === 0) { b.x = 0; b.z = -6; } else { b.a = 0; b.throws = 0; b.y = 4; } for (const z of w.zaps) w.root.remove(z.mesh); w.zaps.length = 0; for (const q of w.balls) w.root.remove(q.mesh); w.balls.length = 0; for (const q of w.rocks) w.root.remove(q.mesh); w.rocks.length = 0; }

      // ---- the camera
      const camP = new T.Vector3(0, 4, 6), camL = new T.Vector3();
      function camFollow(dt, snap) {
        let want, look;
        if (mode === 'level' || (mode === 'tally' && LV && LV.kind === 'level')) {
          const w = WD, rc = w.cx(rowAt(P.z)), yy = Math.max(P.y, 0);
          if (LV.L.chase) { want = new T.Vector3(P.x * 0.7 + rc * 0.3, 4.3 + yy * 0.4, P.z - 7.4); look = new T.Vector3(P.x * 0.8 + rc * 0.2, 0.6 + yy * 0.3, P.z + 2.5); }
          else { want = new T.Vector3(P.x * 0.75 + rc * 0.25, yy * 0.5 + 3.4, P.z + 5.8); look = new T.Vector3(P.x * 0.8 + w.cx(rowAt(P.z) + 3) * 0.2, yy * 0.4 + 0.7, P.z - 5); }
          if (mode === 'tally') { const a = mt * 0.5; want = new T.Vector3(P.x + Math.sin(a) * 4.5, 2.4, P.z + Math.cos(a) * 4.5); look = new T.Vector3(P.x, 0.9, P.z); }
        } else if (mode === 'hub') { want = new T.Vector3(P.x * 0.55, 6.2, P.z * 0.5 + 9.5); look = new T.Vector3(P.x * 0.7, 0.6, P.z * 0.7 - 3); }
        else { want = new T.Vector3(P.x * 0.45, 8.2, P.z * 0.45 + 10.5); look = new T.Vector3(P.x * 0.55, 0.4, P.z * 0.5 - 1.5); if (mode === 'tally') { const a = mt * 0.5; want = new T.Vector3(P.x + Math.sin(a) * 5, 2.6, P.z + Math.cos(a) * 5); look = new T.Vector3(P.x, 0.9, P.z); } }
        if (snap) camP.copy(want); else camP.lerp(want, Math.min(1, dt * 5));
        camL.lerp(look, snap ? 1 : Math.min(1, dt * 8)); if (snap) camL.copy(look);
        cam.position.copy(camP); if (shake > 0 && SV.opt.shake) { cam.position.x += (Math.random() - 0.5) * shake * 0.5; cam.position.y += (Math.random() - 0.5) * shake * 0.5; }
        cam.lookAt(camL);
      }

      // ---- Wally moves (shared by levels, the warp room and the bosses)
      function movePlayer(dt) {
        const w = WD, lvl = w.kind === 'level', chase = lvl && LV.L.chase;
        let s = K.stick(), mx = s.x, mz = s.y;
        if (LV.demo || DBG.auto) { const a = autopilot(); mx = a[0]; mz = a[1]; }
        if (chase && !(LV.demo || DBG.auto)) { mx = -mx; mz = -mz; }
        const tile = lvl ? tileAt(P.x, P.z) : '.', ice = tile === 'i' && P.ground;
        const top = 6.2, acc = P.ground ? (ice ? 5 : 40) : 22;
        P.vx += (mx * top - P.vx) * Math.min(1, acc * dt / top); P.vz += (mz * top - P.vz) * Math.min(1, acc * dt / top);
        if (P.spin > 0) { P.vx *= 0.97; P.vz *= 0.97; }
        if (Math.abs(mx) + Math.abs(mz) > 0.1) P.face = Math.atan2(mx, mz);
        if (P.coy > 0) P.coy -= dt; if (P.buf > 0) P.buf -= dt; if (P.inv > 0) P.inv -= dt; if (P.spinCool > 0) P.spinCool -= dt;
        const jumpP = LV.demo || DBG.auto ? P.wantJump : K.pressed('a'), jumpH = LV.demo || DBG.auto ? P.holdJump : K.held('a');
        if (jumpP) P.buf = 0.12;
        if (P.buf > 0 && (P.ground || P.coy > 0)) { P.vy = 9.3; P.ground = false; P.coy = 0; P.buf = 0; snd.jump(); P.onPlat = null; }
        if (!jumpH && P.vy > 3) P.vy -= 40 * dt;
        const spinP = LV.demo || DBG.auto ? P.wantSpin : (K.pressed('x') || K.pressed('b'));
        if (spinP && P.spinCool <= 0) { P.spin = 0.45; P.spinCool = 0.62; snd.spin(); }
        if (P.spin > 0) P.spin -= dt;
        P.wantJump = P.wantSpin = false;
        // riding a platform or a log
        if (lvl && P.ground) for (const p of w.plats) if (Math.abs(p.z - P.z) < 1.05 && Math.abs(p.x - P.x) < p.w) P.x += p.dx || 0;
        const ox = P.x, oz = P.z, oy = P.y;
        P.x += P.vx * dt; P.z += P.vz * dt;
        if (lvl) {
          const t = tileAt(P.x, P.z); if (t === null) { const tz = tileAt(ox, P.z); if (tz === null) { P.z = oz; P.vz = 0; } else { P.x = ox; P.vx = 0; } }
          if (P.z > 1.2) { P.z = 1.2; P.vz = 0; }
        } else if (w.kind === 'hub') { const d = Math.hypot(P.x, P.z); if (d > 11.6) { P.x *= 11.6 / d; P.z *= 11.6 / d; } }
        else { const d = Math.hypot(P.x, P.z); if (d > w.R - 0.5) { P.x *= (w.R - 0.5) / d; P.z *= (w.R - 0.5) / d; } }
        // crates and rocks are solid from the side
        if (lvl) {
          for (const c of w.crates) {
            if (!c.alive || Math.abs(c.z - P.z) > 1.4) continue;
            const dx = P.x - c.x, dz = P.z - c.z;
            if (Math.abs(dx) < 0.82 && Math.abs(dz) < 0.82 && P.y < c.y + 0.95 && P.y + 1.15 > c.y + 0.05) {
              if (c.k === 'z') { boom(c); continue; }
              if (P.spin > 0 && c.k !== 'n' && c.k !== 's') { if (c.k === 't') boom(c); else smash(c, 'spin'); continue; }
              if (P.vy > 0 && oy + 1.15 <= c.y + 0.1) { if (c.k !== 'n' && c.k !== 's') smash(c, 'head'); P.vy = -1; P.y = c.y - 1.16; continue; }
              if (Math.abs(dx) > Math.abs(dz)) P.x = c.x + Math.sign(dx) * 0.82; else P.z = c.z + Math.sign(dz) * 0.82;
            }
          }
          for (const k of w.rocks) { const dx = P.x - k.x, dz = P.z - k.z; if (Math.abs(dx) < 1.05 && Math.abs(dz) < 1.05 && P.y < k.top - 0.05) { if (Math.abs(dx) > Math.abs(dz)) P.x = k.x + Math.sign(dx) * 1.05; else P.z = k.z + Math.sign(dz) * 1.05; } }
        }
        // gravity, and landing on crates (smash and bounce)
        P.vy -= 26 * dt; P.y += P.vy * dt;
        if (lvl && P.vy < 0) for (const c of w.crates) {
          if (!c.alive || c.k === 'n') continue;
          if (Math.abs(P.x - c.x) < 0.78 && Math.abs(P.z - c.z) < 0.78 && oy >= c.y + 0.92 && P.y < c.y + 1) {
            P.y = c.y + 1; P.ground = false;
            if (c.k === 's') { P.vy = 14.5; snd.spring(); c.sq = 0.3; }
            else if (c.k === 'z') { boom(c); P.vy = 8; }
            else { smash(c, 'jump'); P.vy = c.k === 'b' ? (jumpH ? 11.5 : 9.5) : jumpH ? 10.5 : 8.5; }
            break;
          }
        }
        if (lvl && P.vy < 0) for (const f of w.foes) if (f.alive && f.k === 'u' && f.flip && Math.abs(P.x - f.x) < 0.8 && Math.abs(P.z - f.z) < 0.8 && oy >= 0.45 && P.y < 0.55) { P.vy = 12.5; P.y = 0.55; snd.spring(); f.sq = 0.3; }
        const fl = floorAt(P.x, P.z);
        if (P.y <= fl && oy >= fl - 0.35) { if (!P.ground && P.vy < -7) { burst(P.x, fl, P.z, 0xb09060, 4, 2.5, 0.4, 0.5); snd.land(); } P.y = fl; P.vy = 0; P.ground = true; P.coy = 0.1; }
        else { if (P.ground) P.coy = 0.1; P.ground = false; }
      }
      // the attract-mode Wally: runs on, jumps the gaps, spins the crates and baddies
      function autopilot() {
        const w = WD; if (w.kind !== 'level') return [0, 0];
        const r = rowAt(P.z), dirz = -1;
        const lanes = [0, 1, 2, 3, 4]; let best = 2, bs = -1e9;
        const ok = (rr, c) => { const row = w.rows[rr]; if (!row) return true; const ch = row[c]; return ch && ch !== ' ' && ch !== 'w' && ch !== 'r' && ch !== 'x' && ch !== 'j'; };
        for (const c of lanes) { let sc = -Math.abs((P.x - w.cx(r)) / TS + 2 - c) * 0.6; for (let k = 1; k <= 3; k++) if (!ok(r + k, c)) sc -= 3 / k; if (sc > bs) { bs = sc; best = c; } }
        const tx = w.cx(r + 1) + (best - 2) * TS, mx = clamp((tx - P.x) * 0.8, -1, 1);
        const ahead = tileAt(P.x, P.z - 1.6), ahead2 = tileAt(P.x, P.z - 2.6);
        if (P.ground && ((ahead === ' ' || ahead === 'w' || ahead === 'm' || ahead === 'L' || ahead === 'l') || (ahead2 === ' ' && ahead !== '.'))) { P.wantJump = true; }
        P.holdJump = !P.ground && P.vy > 0;
        for (const c of w.crates) if (c.alive && c.k !== 'n' && c.k !== 'z' && c.k !== 't' && Math.abs(c.x - P.x) < 1 && c.z < P.z && P.z - c.z < 1.6) P.wantSpin = true;
        for (const f of w.foes) if (f.alive && Math.abs(f.x - P.x) < 1.2 && f.z < P.z + 0.5 && P.z - f.z < 1.8) P.wantSpin = true;
        for (const c of w.crates) if (c.alive && (c.k === 'z' || c.k === 't' || c.k === 'n' || c.k === 's') && Math.abs(c.x - P.x) < 1 && c.z < P.z && P.z - c.z < 2) { P.wantJump = P.ground; }
        return [mx, dirz];
      }

      // ---- a level's moving parts
      function levelStep(dt) {
        const w = WD, t = LV.t;
        for (const p of w.plats) { p.ph += dt * (p.log ? 0.9 : 1.2); const nx = p.ox + Math.sin(p.ph) * (p.log ? 2.6 : 3); p.dx = nx - p.x; p.x = nx; p.mesh.position.set(p.x, p.log ? -0.45 : -0.2, p.z); if (p.log) p.mesh.rotation.x += p.dx * 1.2; }
        for (const f of w.foes) {
          if (!f.alive) { if (f.dead > 0) { f.dead -= dt; f.vy -= 18 * dt; f.y += f.vy * dt; f.g.position.y = f.y; f.g.rotation.x += dt * 12; f.z -= dt * 6 * (LV.L.chase ? -1 : 1); f.g.position.z = f.z; if (f.dead <= 0) f.g.visible = false; } continue; }
          const sp = f.k === 'p' ? 1.7 : f.k === 'e' ? 1.4 : f.k === 'u' ? 0.6 : 0.9;
          if (!(f.k === 'u' && f.flip)) { f.ph += dt * sp; const nx = f.ax + Math.sin(f.ph) * (f.k === 'p' ? 3.4 : 2.6); const lo = w.cx(f.r) - 4.2, hi = w.cx(f.r) + 4.2; f.x = clamp(nx, lo, hi); }
          f.g.position.set(f.x, f.y, f.z); const dir = Math.cos(f.ph);
          if (f.k === 'e') { f.g.rotation.y = 0; f.claws.position.y = Math.abs(Math.sin(t * 9)) * 0.12; f.body.position.y = Math.abs(Math.sin(t * 14)) * 0.04; }
          else if (f.k === 'p') { f.g.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; f.body.rotation.z = Math.sin(t * 10) * 0.18; }
          else if (f.k === 'h') { f.g.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; f.body.position.y = Math.abs(Math.sin(t * 8)) * 0.05; }
          else if (f.k === 'u') { if (f.flip) { f.body.rotation.z = Math.PI; f.body.position.y = 0.62; f.flip -= dt; if (f.flip <= 0) { f.flip = 0; f.body.rotation.z = 0; f.body.position.y = 0; } } else f.g.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
          if (f.sq > 0) { f.sq -= dt; f.g.scale.set(1 + f.sq, 1 - f.sq, 1 + f.sq); } else f.g.scale.set(1, 1, 1);
          f.g.visible = Math.abs(f.z - P.z) < 60;
          // touching Wally
          if (LV.deadT <= 0 && Math.abs(P.x - f.x) < 0.85 && Math.abs(P.z - f.z) < 0.85 && P.y < 1.1) {
            if (P.spin > 0) kill(f);
            else if (P.vy < 0 && P.y > 0.3) { if (f.k === 'h') hurt('PRICKLY!'); else if (f.k === 'u') { if (!f.flip) { f.flip = 6; LV.score += 50; } P.vy = 11; snd.spring(); } else { kill(f); P.vy = 9; } }
            else if (!(f.k === 'u' && f.flip)) hurt(f.k === 'h' ? 'PRICKLY!' : f.k === 'p' ? 'SLAPPED!' : f.k === 'u' ? 'SNAPPED!' : 'PINCHED!');
          }
        }
        // BOOM fuses, crate squash, ZAP jitter
        for (const c of w.crates) {
          if (!c.alive) continue; const im = w.inst[c.k]; if (!im) continue;
          if (c.k === 't' && c.fuse > 0) { const b4 = Math.ceil(c.fuse); c.fuse -= dt; if (Math.ceil(c.fuse) !== b4 && c.fuse > 0) snd.fuse(); setInst(im, c.idx, c.x, c.y + 0.5, c.z, 0.98 + (Math.ceil(c.fuse * 4) % 2) * 0.1); if (c.fuse <= 0) boom(c); continue; }
          if (c.k === 'z' && Math.abs(c.z - P.z) < 30) { const j = Math.sin(t * 25 + c.x) > 0.6 ? 0.08 : 0; setInst(im, c.idx, c.x, c.y + 0.5 + j, c.z, 0.98, j * 2); continue; }
          if (c.sq > 0) { c.sq -= dt; setInst(im, c.idx, c.x, c.y + 0.5 - c.sq * 0.5, c.z, 0.98, 0, 0, 1 + c.sq, 1 - c.sq * 1.5); if (c.sq <= 0) setInst(im, c.idx, c.x, c.y + 0.5, c.z, 0.98); }
        }
        // mangoes spin and bob; pick them up
        for (const f of w.fruit) { if (f.got || Math.abs(f.z - P.z) > 50) continue; setInst(w.mango, f.i, f.x, f.y + Math.sin(t * 3 + f.z) * 0.1, f.z, 1.6, t * 3 + f.x); if (LV.deadT <= 0 && Math.hypot(P.x - f.x, P.z - f.z) < 0.85 && Math.abs(P.y + 0.6 - f.y) < 1.1) { f.got = true; setInst(w.mango, f.i, 0, -50, 0, 0.001); addFruit(1); burst(f.x, f.y, f.z, 0xffd040, 4, 2, 0.3); } }
        // crumbly floor, lily pads, fire jets
        for (const tl of w.tiles) {
          const on = P.ground && LV.deadT <= 0 && Math.abs(P.x - tl.x) < TS / 2 && Math.abs(P.z - tl.z) < TS / 2;
          if (tl.k === 'x') { if (tl.st === 0 && on) { tl.st = 1; tl.t = 0; snd.crumble(); } if (tl.st === 1) { tl.t += dt; tl.mesh.position.x = tl.x + (Math.random() - 0.5) * 0.08; if (tl.t > 0.6) { tl.st = 2; tl.t = 0; burst(tl.x, 0, tl.z, 0x8a8270, 8, 3, 0.5); } } if (tl.st === 2) { tl.t += dt; tl.mesh.position.y = -0.3 - tl.t * tl.t * 9; tl.mesh.rotation.x += dt; if (tl.t > 1.5) tl.mesh.visible = false; } }
          else { if (tl.st === 0 && on) { tl.t += dt; if (tl.t > 0.75) { tl.st = 1; tl.t = 0; } } else if (tl.st === 0) tl.t = Math.max(0, tl.t - dt); if (tl.st === 1) { tl.t += dt; tl.y = -tl.t * 0.9; if (tl.y < -0.5) { tl.st = 2; tl.t = 0; snd.splash(); } } if (tl.st === 2) { tl.t += dt; tl.y = -0.6; if (tl.t > 2) { tl.st = 0; tl.t = 0; tl.y = 0; } } tl.mesh.position.y = -0.08 + tl.y + (tl.st === 0 && tl.t > 0 ? Math.sin(t * 20) * 0.03 : 0); }
        }
        for (const j of w.jets) { const c = (t + j.ph) % 2.4, on = c < 0.95, warm = c > 2.0; j.mesh.visible = on || warm; j.mesh.scale.set(on ? 1 : 0.4, on ? 0.8 + Math.random() * 0.3 : 0.15, on ? 1 : 0.4); j.mesh.position.y = on ? 1.3 : 0.25; if (on && c < 0.05 && Math.abs(j.z - P.z) < 16) snd.flame(); if (on && LV.deadT <= 0 && Math.abs(P.x - j.x) < 0.75 && Math.abs(P.z - j.z) < 0.75 && P.y < 2.2) hurt('TOASTED!'); }
        // the boulder
        const bo = w.boulder;
        if (bo && !LV.done) {
          if (bo.wait > 0) bo.wait -= dt; else if (LV.t > 1.6) { const gap = bo.z - P.z; bo.sp = gap > 14 ? 9 : gap > 9 ? 6.4 : 5.5; bo.z -= bo.sp * dt; }
          const br = rowAt(bo.z); bo.mesh.position.set(w.cx(Math.max(0, br)), 2.3, bo.z); bo.mesh.rotation.x -= bo.sp * dt / 2.4;
          const gap = bo.z - P.z; if (gap < 7) shake = Math.max(shake, (7 - gap) * 0.04);
          for (const c of w.crates) if (c.alive && Math.abs(c.z - bo.z) < 2 && c.k !== 'n' && c.k !== 's') { hideCrate(c); burst(c.x, 0.5, c.z, 0xc88a3a, 6, 5, 0.5); }
          if (gap < 2.3 && P.y < 4 && LV.deadT <= 0) { LV.mask = 0; LV.invT = 0; P.inv = 0; die('SQUASHED!'); }
          if (K.frame % 20 === 0 && gap < 20) S.noise(0.35, 0.08 + Math.max(0, 12 - gap) * 0.01, 200, 0, 'lowpass', 60);
        }
        w.warp.rotation.y += dt * 2; w.ring.position.y = 0.3 + Math.abs(Math.sin(t * 2)) * 1.6; w.ring.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
        // falling, the end
        if (P.y < -6 && LV.deadT <= 0) { const tt = tileAt(P.x, P.z); if (tt === 'w' || LV.L.theme === 'river') snd.splash(); die(tt === 'w' || LV.L.theme === 'river' ? 'SPLASH!' : 'WHOOPS!'); }
        if (rowAt(P.z) >= w.goal && Math.abs(P.x - w.cx(w.goal)) < 2.4 && P.y < 2 && LV.deadT <= 0) levelDone();
      }
      // ---- the bosses
      function bossStep(dt) {
        const w = WD, b = w.boss, t = LV.t; b.t += dt; if (b.inv > 0) b.inv -= dt;
        const dx = P.x - b.x, dz = P.z - b.z, dist = Math.hypot(dx, dz);
        if (w.bi === 0) { // TINY TUSK
          const fast = 1 + (BOSSES[0].hp - w.hp) * 0.25;
          if (b.st === 'walk') { const a = Math.atan2(dx, dz); b.yaw = a; const sp = 2.2 * fast; b.x += Math.sin(a) * sp * dt; b.z += Math.cos(a) * sp * dt; if (b.t > 1.5 / fast) { b.st = 'snort'; b.t = 0; snd.snort(); } }
          else if (b.st === 'snort') { b.yaw = Math.atan2(dx, dz); if (K.frame % 6 === 0) burst(b.x - Math.sin(b.yaw) * 0.6, 0.1, b.z - Math.cos(b.yaw) * 0.6, 0xc8a070, 2, 2, 0.4, 0.5); if (b.t > 0.9) { b.st = 'charge'; b.t = 0; b.cx = Math.sin(b.yaw); b.cz = Math.cos(b.yaw); snd.snort(); } }
          else if (b.st === 'charge') { const sp = 12 * fast; b.x += b.cx * sp * dt; b.z += b.cz * sp * dt; if (K.frame % 3 === 0) burst(b.x, 0.2, b.z, 0xc8a070, 2, 3, 0.4, 0.5); if (Math.hypot(b.x, b.z) > w.R - 1.4) { const d = Math.hypot(b.x, b.z); b.x *= (w.R - 1.4) / d; b.z *= (w.R - 1.4) / d; b.st = 'stun'; b.t = 0; snd.thud(); shake = 0.6; burst(b.x + b.cx, 1.2, b.z + b.cz, 0xa89070, 16, 6, 0.8); if (w.hp < BOSSES[0].hp) for (let i = 0; i < 2 + (BOSSES[0].hp - w.hp); i++) dropRock(); } }
          else if (b.st === 'stun') { if (b.t > 2.8) { b.st = 'walk'; b.t = 0; } }
          else if (b.st === 'hurt') { if (b.t > 0.9) { b.st = 'walk'; b.t = 0; } }
          else if (b.st === 'down') { b.g.rotation.z = Math.min(Math.PI / 2, b.t * 3); if (b.t > 2.4 && !LV.done) levelDone(); }
          b.g.position.set(b.x, 0, b.z); b.g.rotation.y = b.yaw;
          const gal = b.st === 'charge' ? 18 : b.st === 'walk' ? 8 : 0; b.legs.forEach((l, i) => { l.rotation.x = gal ? Math.sin(t * gal + (i % 2 ? 0 : Math.PI) + (i > 1 ? 1 : 0)) * 0.7 : 0; });
          b.body.rotation.x = b.st === 'snort' ? Math.sin(b.t * 20) * 0.06 + 0.12 : b.st === 'charge' ? 0.15 : 0; b.body.position.y = b.st === 'stun' ? -0.15 : 0;
          w.stars.visible = b.st === 'stun'; w.stars.children.forEach((s, i) => { const a = t * 4 + i / 4 * TAU; s.position.set(Math.cos(a) * 0.8, Math.sin(t * 6 + i) * 0.1, 1.0 + Math.sin(a) * 0.8); });
          b.body.visible = b.inv <= 0 || (K.frame >> 2) % 2 === 0;
          // touching him: on his back while he's dizzy = a hit; otherwise ouch (and he's solid)
          if (b.st !== 'down' && LV.deadT <= 0) {
            const top = 2.05;
            if (b.st === 'stun' && P.vy < 0 && P.y > 1.3 && P.y < top + 0.3 && dist < 1.6) { w.hp--; b.st = w.hp > 0 ? 'hurt' : 'down'; b.t = 0; b.inv = 0.9; P.vy = 13; P.y = top; snd.squeal(); LV.score += 1000; burst(b.x, 2, b.z, 0xffe040, 14, 6, 0.6); shake = 0.3; say(w.hp > 0 ? 'OOF!' : 'GOT HIM!', w.hp > 0 ? w.hp + ' MORE' : '', 1.2); }
            else if (dist < 1.7 && P.y < 1.9) { if (b.st === 'stun' || b.st === 'hurt') { const k = 1.7 / Math.max(0.01, dist); P.x = b.x + dx * k; P.z = b.z + dz * k; } else hurt('GORED!'); }
          }
        } else { // DOCTOR DINGO
          const phase = BOSSES[1].hp - w.hp;
          if (b.st === 'fly') { b.a += dt * (0.55 + phase * 0.2); b.x = Math.cos(b.a) * 5.5; b.z = Math.sin(b.a) * 5.5 - 1; b.y = 4 + Math.sin(t * 2) * 0.3; if (b.t > 1.7 - phase * 0.3) { b.t = 0; throwBall(); b.throws++; if (b.throws >= 4 + phase) { b.st = 'drop'; b.t = 0; b.throws = 0; snd.laugh(); } } }
          else if (b.st === 'drop') { b.x += (P.x - b.x) * dt * 2; b.z += (P.z - b.z - 0.5) * dt * 2; if (b.t > 1.1 && !b.dropped) { b.dropped = 1; for (let i = 0; i < 2 + phase; i++) dropZap(); } if (b.t > 1.8) { b.st = 'land'; b.t = 0; b.dropped = 0; } }
          else if (b.st === 'land') { b.y = lerp(b.y, 0.55, Math.min(1, dt * 4)); if (b.t > 1) { b.st = 'dizzy'; b.t = 0; snd.thud(); shake = 0.4; burst(b.x, 0.3, b.z, 0xc8c8d8, 12, 5, 0.6); } }
          else if (b.st === 'dizzy') { b.y = 0.55; if (K.frame % 8 === 0) burst(b.x + (Math.random() - 0.5), 1.6, b.z, 0x8a8a8a, 1, 1, 1, 1.5); if (b.t > 3.2 - phase * 0.4) { b.st = 'rise'; b.t = 0; } }
          else if (b.st === 'hurt') { b.y += dt * 2; if (b.t > 0.9) { b.st = 'rise'; b.t = 0; } }
          else if (b.st === 'rise') { b.y = lerp(b.y, 4, Math.min(1, dt * 3)); if (b.t > 1.2) { b.st = 'fly'; b.t = 0; b.a = Math.atan2(b.z + 1, b.x); for (const z of w.zaps) { boomZap(z, true); } } }
          else if (b.st === 'down') { b.y += dt * 1.5; b.g.rotation.y += dt * 12; b.g.rotation.z = 0.5; if (K.frame % 4 === 0) burst(b.x, b.y, b.z, 0xff8a2a, 3, 4, 0.5); if (b.t > 2.6 && !LV.done) levelDone(); }
          b.g.position.set(b.x, b.y, b.z); if (b.st !== 'down') b.g.rotation.y = Math.atan2(P.x - b.x, P.z - b.z);
          b.dg.rotation.z = b.st === 'dizzy' ? Math.sin(t * 10) * 0.3 : 0; b.pod.visible = b.inv <= 0 || (K.frame >> 2) % 2 === 0;
          if (b.st === 'dizzy' && P.vy < 0 && P.y > 0.9 && P.y < 1.9 && Math.hypot(P.x - b.x, P.z - b.z) < 1.4 && LV.deadT <= 0) { w.hp--; b.st = w.hp > 0 ? 'hurt' : 'down'; b.t = 0; b.inv = 1; P.vy = 13; snd.squeal(); LV.score += 1000; burst(b.x, 1.4, b.z, 0x8affff, 16, 6, 0.6); shake = 0.3; say(w.hp > 0 ? 'BONK!' : 'GOT HIM!', w.hp > 0 ? w.hp + ' MORE' : '', 1.2); }
          else if ((b.st === 'dizzy' || b.st === 'land') && Math.hypot(P.x - b.x, P.z - b.z) < 1.4 && P.y < 1.0) { const k = 1.4 / Math.max(0.01, Math.hypot(P.x - b.x, P.z - b.z)); P.x = b.x + (P.x - b.x) * k; P.z = b.z + (P.z - b.z) * k; }
          for (let i = w.balls.length - 1; i >= 0; i--) { const q = w.balls[i]; q.t += dt; const k = q.t / q.dur; q.mesh.position.set(lerp(q.x0, q.tx, k), lerp(q.y0, 0.3, k) + Math.sin(k * Math.PI) * 3, lerp(q.z0, q.tz, k)); q.mark.scale.setScalar(0.5 + k * 0.6); if (k >= 1) { burst(q.tx, 0.4, q.tz, 0x8affff, 14, 6, 0.5); snd.zap(); if (Math.hypot(P.x - q.tx, P.z - q.tz) < 1.3 && P.y < 1.4) hurt('ZAPPED!'); w.root.remove(q.mesh); w.root.remove(q.mark); w.balls.splice(i, 1); } }
          for (let i = w.zaps.length - 1; i >= 0; i--) { const z = w.zaps[i]; if (z.y > 0.5) { z.vy -= 20 * dt; z.y = Math.max(0.5, z.y + z.vy * dt); } z.mesh.position.set(z.x, z.y + (Math.sin(t * 25 + i) > 0.6 ? 0.06 : 0), z.z); if (Math.abs(P.x - z.x) < 0.85 && Math.abs(P.z - z.z) < 0.85 && P.y < z.y + 0.5) boomZap(z); }
        }
        for (let i = w.rocks.length - 1; i >= 0; i--) { const q = w.rocks[i]; q.y -= dt * (6 + (1.6 - q.y * 0.05)) * 2; q.mesh.position.set(q.x, Math.max(0.5, q.y), q.z); q.mark.scale.setScalar(clamp(1.4 - q.y / 14, 0.3, 1.4)); if (q.y <= 0.5) { burst(q.x, 0.5, q.z, 0x9a8a78, 12, 6, 0.6); snd.thud(); if (Math.hypot(P.x - q.x, P.z - q.z) < 1.2 && P.y < 1.5) hurt('BONK!'); w.root.remove(q.mesh); w.root.remove(q.mark); w.rocks.splice(i, 1); } }
      }
      const markGeo = T3.keep(new T.RingGeometry(0.5, 0.8, 12)), markMat = T3.mat({ color: 0xff3a2a, lit: false, transparent: true, opacity: 0.7, side: T.DoubleSide });
      function marker(x, z) { const m = new T.Mesh(markGeo, markMat); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.05, z); WD.root.add(m); return m; }
      function dropRock() { const w = WD; const x = clamp(P.x + (Math.random() - 0.5) * 6, -7, 7), z = clamp(P.z + (Math.random() - 0.5) * 6, -7, 7); const m = new T.Mesh(MOD.boulder, MAT.rock); m.userData.shared = true; m.scale.setScalar(0.25); w.root.add(m); w.rocks.push({ x, z, y: 12 + Math.random() * 6, mesh: m, mark: marker(x, z) }); }
      function throwBall() { const w = WD, b = w.boss; const tx = clamp(P.x + P.vx * 0.5, -8, 8), tz = clamp(P.z + P.vz * 0.5, -8, 8); const m = new T.Mesh(MOD.ball, glowMat); m.userData.shared = true; w.root.add(m); w.balls.push({ x0: b.x, y0: b.y, z0: b.z, tx, tz, t: 0, dur: 1.15, mesh: m, mark: marker(tx, tz) }); snd.throwB(); }
      function dropZap() { const w = WD, b = WD.boss; const x = clamp(P.x + (Math.random() - 0.5) * 5, -7.5, 7.5), z = clamp(P.z + (Math.random() - 0.5) * 5, -7.5, 7.5); const im = new T.Mesh(crateGeo, crateMat.z); w.root.add(im); w.zaps.push({ x, z, y: b.y, vy: 0, mesh: im }); }
      function boomZap(z, quiet) { const w = WD; const i = w.zaps.indexOf(z); if (i < 0) return; w.zaps.splice(i, 1); w.root.remove(z.mesh); burst(z.x, 0.6, z.z, 0x6aff6a, quiet ? 8 : 18, 8, 0.6); if (!quiet) { snd.zap(); flash = 0.2; if (Math.hypot(P.x - z.x, P.z - z.z) < 2 && P.y < 1.6) hurt('ZAPPED!'); } }

      // ---- the end of a go
      const scoreCap = s => Math.max(0, Math.min(s, 40000, Math.floor(195 * (K.t + 2))));
      let TL = null; // the tally
      function levelDone() {
        if (LV.done) return; if (LV.demo) { goTitle(); return; } LV.done = 'win'; LV.endT = 0; music(null); snd.win();
        const lvl = LV.kind === 'level', k = lvl ? 'L' + LV.li : 'B' + LV.bi;
        const rows = [], bonus = [];
        let gem = false, relic = 0;
        if (lvl) {
          const w = WD; rows.push(['MANGOES', LV.fruit], ['CRATES', LV.crates + ' / ' + w.total], ['BADDIES', LV.kills], ['TIME', mt2(LV.t)]);
          if (!LV.tt) { bonus.push(['LEVEL BONUS', 1000]); LV.score += 1000; const tb = Math.max(0, Math.round((LV.L.tt[2] + 15 - LV.t) * 15)); if (tb) { bonus.push(['TIME BONUS', tb]); LV.score += tb; } if (LV.crates >= w.total) { gem = true; bonus.push(['ALL CRATES: GEM!', 1500]); LV.score += 1500; if (!LV.demo) K.secret('rm.run.box'); if (!SV.gems[k]) SV.gems[k] = 1; } }
          else { relic = LV.t <= LV.L.tt[0] ? 3 : LV.t <= LV.L.tt[1] ? 2 : LV.t <= LV.L.tt[2] ? 1 : 0; if (relic) { const rb = [0, 1000, 2000, 3000][relic]; bonus.push([['', 'SAPPHIRE', 'GOLD', 'PLATINUM'][relic] + ' RELIC', rb]); LV.score += rb; SV.relic[k] = Math.max(SV.relic[k] | 0, relic); if (relic === 3) K.secret('rm.run.relic'); } else bonus.push(['NO RELIC THIS TIME', 0]); if (!SV.bestT[k] || LV.t < SV.bestT[k]) SV.bestT[k] = Math.round(LV.t * 100) / 100; }
        } else {
          rows.push(['BOSS', BOSSES[LV.bi].name], ['TIME', mt2(LV.t)]); bonus.push(['BOSS BEATEN', 3000]); LV.score += 3000; const tb = Math.max(0, Math.round((90 - LV.t) * 20)); if (tb) { bonus.push(['TIME BONUS', tb]); LV.score += tb; }
          if (LV.bi === 1) K.secret('rm.run.dingo');
        }
        const first = !SV.done[k]; if (!LV.demo) SV.done[k] = 1;
        const total = LV.score, send = scoreCap(total);
        SV.best[k] = Math.max(SV.best[k] | 0, total); SV.top.push({ s: total, m: lvl ? LEVELS[LV.li].name : BOSSES[LV.bi].name }); SV.top.sort((a, b) => b.s - a.s); SV.top.length = Math.min(8, SV.top.length);
        SV.back = Date.now(); SV.lastPad = PADS.findIndex(p => keyOf(p) === k); SV.started = 1; save();
        TL = { win: true, rows, bonus, total, send, gem, relic, first, k, end: !lvl && LV.bi === 1, tt: LV.tt };
        mode = 'tally'; mt = 0; maskM.visible = false;
      }
      function gameOver() {
        LV.done = 'over'; music(null);
        const total = LV.score, send = scoreCap(total); SV.lives = 4; SV.back = Date.now(); SV.started = 1; save();
        TL = { win: false, rows: [['MANGOES', LV.fruit], ['CRATES', LV.crates]], bonus: [], total, send, k: '' };
        mode = 'tally'; mt = 0;
      }

      // ---- Wally on screen
      const shTmp = new T.Vector3();
      function drawWally(dt) {
        const sp = Math.hypot(P.vx, P.vz);
        P.ph += dt * sp * 2.6;
        W0.root.position.set(P.x, P.y, P.z);
        let d = wrapA(P.face - W0.body.rotation.y);
        if (P.spin > 0) W0.body.rotation.y += dt * 30; else W0.body.rotation.y += d * Math.min(1, dt * 14);
        whirl.visible = P.spin > 0; whirl.rotation.y += dt * 24;
        poseWombat(W0, { ph: P.ph, run: P.ground ? Math.min(1, sp / 4.5) : 0, air: P.vy > 0 ? 1 : -1, onGround: P.ground, spin: P.spin, t: K.t, dance: mode === 'tally' && TL && TL.win });
        const squash = P.ground ? 1 : 1.07; W0.body.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
        const fl = floorAt(P.x, P.z); shadow.visible = fl > -1 && LV.deadT <= 0; shadow.position.set(P.x, (fl > -1 ? fl : 0) + 0.03, P.z); const s = Math.max(0.35, 1 - (P.y - fl) * 0.1); shadow.scale.set(s, s, 1);
        const blink = (LV.invT > 0 && LV.invT < 2) || P.inv > 0;
        W0.root.visible = LV.deadT > 0 ? (LV.deadT > 1 && (LV.deadT * 10 | 0) % 2 === 0) : (!blink || (K.frame >> 2) % 2 === 0);
        if (LV.deadT > 0) { W0.body.rotation.y += dt * 8; W0.body.scale.set(1.2, 0.6, 1.2); }
        // the tiki mask bobs about next to you (glows when it's at full power)
        maskM.visible = (LV.mask > 0 || LV.invT > 0) && LV.deadT <= 0 && mode !== 'tally';
        if (maskM.visible) { const a = K.t * (LV.invT > 0 ? 6 : 1.8); maskM.position.set(P.x + Math.cos(a) * (LV.invT > 0 ? 0.6 : 0.9), P.y + 1.5 + Math.sin(K.t * 3) * 0.12, P.z + Math.sin(a) * (LV.invT > 0 ? 0.6 : 0.5)); maskM.rotation.y = Math.atan2(cam.position.x - maskM.position.x, cam.position.z - maskM.position.z); maskM.scale.setScalar(LV.mask >= 2 || LV.invT > 0 ? 1.35 : 1); if (LV.invT > 0 && K.frame % 3 === 0) burst(P.x + (Math.random() - 0.5), P.y + Math.random() * 1.4, P.z, [0xffd040, 0x3aff6a, 0xff3a6a][K.frame % 3], 1, 1, 0.4, 0); }
      }
      // ---- the per-mode steps
      function playStep(dt) {
        LV.t += dt; if (msgT > 0) msgT -= dt; if (flash > 0) flash -= dt; if (shake > 0) shake = Math.max(0, shake - dt * 1.5); if (LV.invT > 0) LV.invT -= dt;
        stepParts(dt);
        if (WD.kind === 'level') levelStep(dt); else bossStep(dt);
        if (LV.done) { drawWally(dt); camFollow(dt); return; }
        if (LV.deadT > 0) {
          LV.deadT -= dt;
          if (LV.deadT <= 0) { if (SV.lives < 0 && !LV.tt) { SV.lives = 0; return gameOver(); } respawn(); }
          drawWally(dt); camFollow(dt); return;
        }
        movePlayer(dt);
        if (WD.kind === 'boss' && P.y < -6) die('WHOOPS!');
        drawWally(dt); camFollow(dt);
        if (LV.demo && LV.t > 26) goTitle();
      }
      function hubStep(dt) {
        LV.t += dt; stepParts(dt); if (msgT > 0) msgT -= dt;
        // standing on a pad?
        let on = -1; WD.pads.forEach((p, i) => { if (Math.hypot(P.x - p.x, P.z - p.z) < 1.25) on = i; p.top.rotation.y += dt; p.gem.rotation.y += dt * 2; p.rel.rotation.y += dt * 2; p.top.material.opacity = p.open ? 0.65 + Math.sin(K.t * 4 + i) * 0.2 : 1; });
        if (on !== LV.pad) { LV.pad = on; if (on >= 0) snd.move(); }
        if (on >= 0 && P.ground) {
          const pd = WD.pads[on], k = keyOf(pd.p);
          if (K.pressed('a')) { if (!pd.open) { snd.no(); say('LOCKED', 'FINISH THE OTHERS FIRST', 1.4); } else { snd.warp(); warpTo = { pad: on, tt: false, t: 0 }; } }
          else if ((K.pressed('x') || K.pressed('b')) && pd.p.k === 'L' && SV.done[k]) { snd.warp(); warpTo = { pad: on, tt: true, t: 0 }; }
        }
        if (warpTo) { warpTo.t += dt; W0.body.rotation.y += dt * 20; W0.root.position.y = P.y + warpTo.t * 3; burst(P.x, P.y + Math.random() * 2, P.z, 0x8affff, 2, 2, 0.5, 2); camFollow(dt); if (warpTo.t > 0.9) { const pd = WD.pads[warpTo.pad].p, tt = warpTo.tt; warpTo = null; if (pd.k === 'L') startLevel(pd.i, tt); else startBoss(pd.i); } return; }
        movePlayer(dt); drawWally(dt); camFollow(dt);
      }
      let warpTo = null;
      // ---- menus, the title, attract
      let sel = 0, page = 0, fromAttract = false, confirmNew = false;
      function goTitle() {
        mode = 'title'; mt = 0; paused = false; fromAttract = false; confirmNew = false;
        buildLevel(0); P = newP(WD.cx(2), 0, -4); P.face = 0; LV = { kind: 'title', t: 0, deadT: 0, mask: 0, invT: 0, demo: true }; music('title');
      }
      const MENU = () => [SV.started ? 'CONTINUE' : null, 'NEW GAME', 'HIGH SCORES', 'OPTIONS', 'HOW TO PLAY'].filter(Boolean);
      const press = () => K.pressed('a') || K.pressed('start');
      function titleCam(dt) { const a = K.t * 0.25; cam.position.set(P.x + Math.sin(a) * 4.2, 1.6 + Math.sin(K.t * 0.4) * 0.3, P.z + Math.cos(a) * 4.2); cam.lookAt(P.x, 0.9, P.z); P.ph += 0; poseWombat(W0, { ph: 0, run: 0, air: 0, onGround: true, spin: 0, t: K.t, dance: false }); W0.root.position.set(P.x, 0, P.z); W0.body.rotation.y = Math.atan2(cam.position.x - P.x, cam.position.z - P.z) * 0.6; W0.root.visible = true; whirl.visible = false; shadow.visible = true; shadow.position.set(P.x, 0.03, P.z); shadow.scale.set(1, 1, 1); }
      function menuStep(dt) {
        if (WD && WD.kind === 'level') { LV.t += dt; levelStepLite(dt); }
        titleCam(dt); stepParts(dt);
        const up = K.pressed('up'), dn = K.pressed('down'), back = K.pressed('b') || K.pressed('x');
        if (mode === 'title') { if (press()) { snd.ok(); mode = 'menu'; mt = 0; sel = 0; return; } if (mt > 10) { mode = 'scores'; mt = 0; fromAttract = true; } return; }
        if (mode === 'scores') { if (fromAttract) { if (K.any()) { goTitle(); return; } if (mt > 6) { startLevel(0, false, true); } return; } if (back || press()) { snd.back(); mode = 'menu'; mt = 0; } return; }
        if (mode === 'menu') {
          const L = MENU();
          if (confirmNew) { if (K.pressed('a')) { snd.ok(); confirmNew = false; for (const k of ['done', 'gems', 'relic', 'best', 'bestT']) SV[k] = {}; SV.lives = 4; SV.mangoes = 0; SV.started = 1; save(); goHub(); } else if (back || K.pressed('start')) { snd.back(); confirmNew = false; } return; }
          if (up) { sel = (sel + L.length - 1) % L.length; snd.move(); } if (dn) { sel = (sel + 1) % L.length; snd.move(); }
          if (back) { snd.back(); goTitle(); return; }
          if (press()) { const it = L[sel]; snd.ok(); if (it === 'CONTINUE') goHub(); else if (it === 'NEW GAME') { if (SV.started) confirmNew = true; else { SV.started = 1; save(); goHub(); } } else if (it === 'HIGH SCORES') { mode = 'scores'; mt = 0; fromAttract = false; } else if (it === 'OPTIONS') { mode = 'options'; sel = 0; } else { mode = 'howto'; page = 0; } }
          return;
        }
        if (mode === 'options') { if (up || dn) { sel = 1 - sel; snd.move(); } if (back) { snd.back(); mode = 'menu'; sel = 0; save(); return; } if (press() || K.pressed('left') || K.pressed('right')) { snd.ok(); if (sel === 0) { SV.opt.music = SV.opt.music ? 0 : 1; music('title'); } else SV.opt.shake = SV.opt.shake ? 0 : 1; save(); } return; }
        if (mode === 'howto') { if (back) { snd.back(); mode = 'menu'; return; } if (press() || K.pressed('left') || K.pressed('right')) { snd.move(); page = (page + 1) % 3; } return; }
      }
      function levelStepLite(dt) { const w = WD; for (const f of w.fruit) if (!f.got && Math.abs(f.z - P.z) < 40) setInst(w.mango, f.i, f.x, f.y + Math.sin(K.t * 3 + f.z) * 0.1, f.z, 1.6, K.t * 3 + f.x); for (const f of w.foes) { if (f.claws) f.claws.position.y = Math.abs(Math.sin(K.t * 9)) * 0.12; } }
      function pauseItems() { return mode === 'hub' ? ['RESUME', 'MUSIC: ' + (SV.opt.music ? 'ON' : 'OFF'), 'QUIT TO TITLE'] : ['RESUME', 'RESTART', 'BACK TO THE WARP ROOM', 'MUSIC: ' + (SV.opt.music ? 'ON' : 'OFF')]; }
      function pauseStep() {
        const L = pauseItems();
        if (K.pressed('up')) { psel = (psel + L.length - 1) % L.length; snd.move(); } if (K.pressed('down')) { psel = (psel + 1) % L.length; snd.move(); }
        if (K.pressed('start')) { paused = false; music(curSong()); return; }
        if (K.pressed('a')) { const it = L[psel]; snd.ok();
          if (it === 'RESUME') { paused = false; music(curSong()); }
          else if (it === 'RESTART') { paused = false; if (LV.kind === 'level') startLevel(LV.li, LV.tt); else startBoss(LV.bi); }
          else if (it === 'BACK TO THE WARP ROOM') { paused = false; const k = LV.kind === 'level' ? 'L' + LV.li : 'B' + LV.bi; save(); goHub(PADS.findIndex(p => keyOf(p) === k)); }
          else if (it === 'QUIT TO TITLE') { paused = false; save(); goTitle(); }
          else { SV.opt.music = SV.opt.music ? 0 : 1; save(); } }
      }
      const curSong = () => mode === 'hub' ? 'hub' : LV.kind === 'level' ? LEVELS[LV.li].song : 'boss';
      function tallyStep(dt) {
        stepParts(dt); if (LV.kind === 'level' || LV.kind === 'boss') { if (WD.kind === 'level') levelStepLite(dt); drawWally(dt); camFollow(dt); }
        if (mt > 1.6 && (K.pressed('start') || K.pressed('a'))) {
          if (LV.demo) { goTitle(); return; }
          mode = 'sent'; const T2 = TL;
          if (T2.end) { mode = 'credits'; mt = 0; music('title'); return; }
          K.over(T2.send, { title: T2.win ? (LV.kind === 'boss' ? 'BOSS BEATEN!' : LV.tt ? 'TIME TRIAL' : 'LEVEL CLEAR!') : 'GAME OVER', text: T2.win ? (LV.kind === 'level' ? LEVELS[LV.li].name + (T2.gem ? ' + GEM' : '') + (T2.relic ? ' + RELIC' : '') : BOSSES[LV.bi].name) : 'BACK TO THE WARP ROOM WITH 4 LIVES' });
        }
      }

      // ================================================================ the 2D layer
      const DITH = (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const b = BAYER[(y & 3) * 4 + (x & 3)]; if (b < 6) { g.fillStyle = b % 2 ? '#000' : '#fff'; g.fillRect(x, y, 1, 1); } } return c; })();
      const LOGO = (() => { const c = document.createElement('canvas'); c.width = 640; c.height = 150; const g = c.getContext('2d'); g.save(); g.translate(320, 92); g.transform(1, 0, -0.15, 1, 0, 0); g.font = 'italic 900 78px "Arial Black",Arial,sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round';
        g.lineWidth = 16; g.strokeStyle = '#3a1400'; g.strokeText('WARP WOMBAT', 0, 0); g.lineWidth = 7; g.strokeStyle = '#ffffff'; g.strokeText('WARP WOMBAT', 0, 0);
        const gr = g.createLinearGradient(0, -60, 0, 8); gr.addColorStop(0, '#fff07a'); gr.addColorStop(0.5, '#ffa01a'); gr.addColorStop(0.52, '#e8600a'); gr.addColorStop(1, '#ffc040'); g.fillStyle = gr; g.fillText('WARP WOMBAT', 0, 0); g.restore();
        g.fillStyle = '#2a8ad0'; g.fillRect(170, 112, 300, 26); g.font = 'bold 18px Arial'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('THE MARSUPIAL OF MAYHEM', 320, 131); return c; })();
      const MATES = (() => { const c = id => { try { return window.Cast && Cast.first ? Cast.first(id) : null; } catch (e) { return null; } }; return [['DAVE', 9600, 'RAPID RIVER'], ['LUKE', 8800, 'JUNGLE ROLLERS'], ['CALLUM', 7400, 'TEMPLE TUMBLE'], ['JACKK', 6900, 'BOULDER BOLT'], [String(c('cousin') || 'KIM').toUpperCase(), 6200, 'TINY TUSK'], [String(c('kidPoke') || 'TOM').toUpperCase(), 5100, 'JUNGLE ROLLERS']]; })();
      const myName = () => { try { return (window.Net && Net.me && Net.me.member && Net.me.nick) ? String(Net.me.nick).toUpperCase().slice(0, 10) : 'YOU'; } catch (e) { return 'YOU'; } };
      const sh = (s, x, y, c, k) => F.center(hud, s, x, y, c || '#fff', k || 1, '#2a1000');
      function box(g, x, y, w, h, col) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 3, y + 3, w, h); g.fillStyle = col || '#1a2a6a'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, y, w, 2); g.strokeStyle = '#ffd040'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2); }
      function mangoIcon(g, x, y) { g.fillStyle = '#3a1800'; g.beginPath(); g.ellipse(x + 1, y + 1, 6, 7, 0, 0, TAU); g.fill(); g.fillStyle = '#ffa01a'; g.beginPath(); g.ellipse(x, y, 6, 7, 0, 0, TAU); g.fill(); g.fillStyle = '#ff4a2a'; g.beginPath(); g.ellipse(x + 2, y + 1, 3, 4, 0, 0, TAU); g.fill(); g.fillStyle = '#3ab02a'; g.fillRect(x, y - 10, 5, 3); }
      function headIcon(g, x, y) { g.fillStyle = '#3a1800'; g.beginPath(); g.arc(x + 1, y + 1, 7, 0, TAU); g.fill(); g.fillStyle = '#9a6438'; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.arc(x - 6, y - 6, 3, 0, TAU); g.arc(x + 6, y - 6, 3, 0, TAU); g.fill(); g.fillStyle = '#f0cc98'; g.beginPath(); g.ellipse(x, y + 3, 4.5, 3, 0, 0, TAU); g.fill(); g.fillStyle = '#1a0a04'; g.fillRect(x - 2, y + 1, 4, 2); g.fillRect(x - 4, y - 3, 2, 2); g.fillRect(x + 2, y - 3, 2, 2); }
      function crateIcon(g, x, y) { g.fillStyle = '#6a3a14'; g.fillRect(x - 6, y - 6, 12, 12); g.fillStyle = '#c8843a'; g.fillRect(x - 4, y - 4, 8, 8); g.fillStyle = '#6a3a14'; g.fillRect(x - 4, y - 1, 8, 2); }
      function drawHud() {
        const g = hud; g.globalAlpha = 0.06; g.drawImage(DITH, 0, 0); g.globalAlpha = 1;
        if (mode === 'title' || mode === 'menu' || mode === 'options' || mode === 'howto' || mode === 'scores' || mode === 'credits') return drawMenus(g);
        if (mode === 'hub') return drawHubHud(g);
        if (mode === 'tally' || mode === 'sent') return drawTally(g);
        // in a level or a boss fight
        mangoIcon(g, 14, 15); F.draw(g, String(LV.fruit), 24, 11, '#fff', 2, '#2a1000');
        headIcon(g, W - 40, 15); F.draw(g, LV.tt ? '--' : String(Math.max(0, SV.lives)), W - 28, 11, '#fff', 2, '#2a1000');
        if (LV.kind === 'level') { crateIcon(g, 14, H - 15); F.draw(g, LV.crates + '/' + WD.total, 24, H - 19, LV.crates >= WD.total ? '#7affa0' : '#fff', 1, '#2a1000'); }
        if (LV.tt || LV.kind === 'boss') sh(mt2(LV.t), W / 2, 8, LV.tt ? '#8affff' : '#fff', LV.tt ? 2 : 1);
        if (LV.kind === 'boss') { const hp = WD.hp, max = BOSSES[WD.bi].hp; sh(BOSSES[WD.bi].name, W / 2, 20, '#ffb0a0'); for (let i = 0; i < max; i++) { g.fillStyle = '#2a0a0a'; g.fillRect(W / 2 - max * 9 + i * 18, 31, 15, 7); g.fillStyle = i < hp ? '#ff3a2a' : '#4a2a2a'; g.fillRect(W / 2 - max * 9 + i * 18 + 1, 32, 13, 5); } }
        if (LV.mask > 0) for (let i = 0; i < LV.mask; i++) { g.fillStyle = '#8a4a1a'; g.fillRect(W - 60 + i * 9, 26, 7, 10); g.fillStyle = '#ffd040'; g.fillRect(W - 59 + i * 9, 29, 2, 2); g.fillRect(W - 56 + i * 9, 29, 2, 2); }
        if (LV.kind === 'level' && LV.L.chase && WD.boulder) { const gap = WD.boulder.z - P.z; if (gap < 9 && (K.frame >> 3) % 2) sh('RUN!', W / 2, H - 30, '#ff6a3a', 2); const t = tileAt(P.x, P.z - 2.2), t2 = tileAt(P.x, P.z - 4.2); if ((t === ' ' || t2 === ' ') && P.ground) sh('JUMP!', W / 2, H - 50, '#ffe040', 1); }
        if (msgT > 0) { const k = msg.length > 11 ? 2 : 3; sh(msg, W / 2, 62, '#ffe040', k); if (msgSub) sh(msgSub, W / 2, 62 + k * 9, '#ffffff', 1); }
        if (flash > 0) { g.fillStyle = `rgba(255,230,140,${flash * 2})`; g.fillRect(0, 0, W, H); }
        if (LV.demo) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, H - 22, W, 14); sh((K.frame >> 5) % 2 ? 'DEMO - PRESS START' : 'WARP WOMBAT', W / 2, H - 19, '#ffe040'); }
        if (paused) drawPause(g);
      }
      function drawPause(g) { g.fillStyle = 'rgba(0,0,30,.6)'; g.fillRect(0, 0, W, H); const L = pauseItems(); box(g, 70, 64, 180, 30 + L.length * 16); sh('PAUSED', W / 2, 72, '#ffe040', 2); L.forEach((s, i) => sh((psel === i ? '> ' : '') + s + (psel === i ? ' <' : ''), W / 2, 96 + i * 16, psel === i ? '#ffe040' : '#ffffff')); }
      function drawHubHud(g) {
        mangoIcon(g, 14, 15); F.draw(g, String(SV.mangoes), 24, 11, '#fff', 2, '#2a1000'); headIcon(g, W - 40, 15); F.draw(g, String(SV.lives), W - 28, 11, '#fff', 2, '#2a1000');
        const gems = Object.keys(SV.gems).length, rel = Object.keys(SV.relic).length; sh('WARP ROOM', W / 2, 8, '#ffe040'); sh('GEMS ' + gems + '/5  RELICS ' + rel + '/5', W / 2, 18, '#c8e8ff');
        if (LV.pad >= 0 && !warpTo) {
          const pd = WD.pads[LV.pad], p = pd.p, k = keyOf(p); box(g, 40, H - 62, W - 80, 52, pd.open ? (p.k === 'B' ? '#5a1a2a' : '#1a2a6a') : '#2a2a2a');
          sh(pd.open ? padName(p) : 'LOCKED', W / 2, H - 56, '#ffe040', 1);
          if (!pd.open) sh('FINISH ' + p.need.map(n => n[0] === 'L' ? LEVELS[+n[1]].name : BOSSES[+n[1]].name).filter((n, i, a) => !SV.done[p.need[i]]).slice(0, 2).join(' + '), W / 2, H - 44, '#ddd');
          else if (p.k === 'L') { sh((SV.done[k] ? 'DONE' : 'NOT DONE YET') + (SV.gems[k] ? '  GEM!' : '') + (SV.relic[k] ? '  ' + ['', 'SAPPHIRE', 'GOLD', 'PLATINUM'][SV.relic[k]] : ''), W / 2, H - 44, '#ddd'); sh(K.label('a') + ' PLAY' + (SV.done[k] ? '   ' + K.label('x') + ' TIME TRIAL' + (SV.bestT[k] ? ' (' + mt2(SV.bestT[k]) + ')' : '') : ''), W / 2, H - 30, '#ffffff'); }
          else sh((SV.done[k] ? 'BEATEN!  ' : '') + K.label('a') + ' FIGHT', W / 2, H - 38, '#ffffff');
        } else if (!warpTo) sh('WALK ONTO A PAD', W / 2, H - 16, '#c8c8e8');
        if (msgT > 0) sh(msg, W / 2, 70, '#ffe040', 2);
        if (paused) drawPause(g);
      }
      function drawTally(g) {
        if (!TL) return; g.fillStyle = 'rgba(0,0,40,.45)'; g.fillRect(0, 0, W, H);
        box(g, 30, 22, W - 60, H - 44, TL.win ? '#1a2a6a' : '#4a1a1a');
        sh(TL.win ? (LV.kind === 'boss' ? BOSSES[LV.bi].name + ' BEATEN!' : (LV.tt ? 'TIME TRIAL' : LEVELS[LV.li].name)) : 'GAME OVER', W / 2, 30, '#ffe040', LV.kind === 'boss' || !TL.win ? 2 : 1);
        const L = TL.rows.concat(TL.bonus); L.forEach(([a, b], i) => { if (mt > 0.2 + i * 0.18) { F.draw(g, a, 48, 52 + i * 13, '#fff', 1, '#000'); F.draw(g, String(b), W - 48 - F.width(String(b)), 52 + i * 13, '#7affd0', 1, '#000'); } });
        const ty = 52 + L.length * 13 + 6; if (mt > 0.3 + L.length * 0.18) { g.fillStyle = '#ffd040'; g.fillRect(48, ty - 3, W - 96, 1); F.draw(g, 'SCORE', 48, ty + 2, '#ffe040', 1, '#000'); F.draw(g, String(TL.total), W - 48 - F.width(String(TL.total)) * 2, ty, '#ffe040', 2, '#000'); }
        if (TL.gem && mt > 1.2) { const x = W - 70, y = 52; g.save(); g.translate(x, y); g.rotate(K.t); g.fillStyle = '#' + LEVELS[LV.li].gem.toString(16).padStart(6, '0'); g.beginPath(); g.moveTo(0, -9); g.lineTo(8, 0); g.lineTo(0, 9); g.lineTo(-8, 0); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-2, -5, 3, 3); g.restore(); }
        if (!TL.win) sh('YOU KEEP YOUR GEMS AND RELICS', W / 2, H - 52, '#ffd0d0');
        if (mt > 1.6 && mode === 'tally' && (K.t * 2 | 0) % 2) sh('PRESS START', W / 2, H - 36, '#ffffff');
      }
      function drawMenus(g) {
        if (mode === 'credits') { g.fillStyle = 'rgba(0,0,20,.7)'; g.fillRect(0, 0, W, H); const L = ['THE END!', '', 'DOCTOR DINGO HAS GONE BACK TO', 'HIS LAB TO SULK, AND WALLY IS', 'HOME IN TIME FOR TEA.', '', 'WARP WOMBAT', 'MARSUPIAL DOG SOFTWARE 1999', '', 'THANKS FOR PLAYING!']; L.forEach((s, i) => sh(s, W / 2, 30 + i * 14 - Math.max(0, mt - 6) * 6, i === 0 ? '#ffe040' : '#ffffff', i === 0 ? 2 : 1)); if (mt > 3 && (K.t * 2 | 0) % 2) sh('PRESS START', W / 2, H - 20, '#ffe040'); return; }
        g.drawImage(LOGO, 10, 8, 300, 70);
        if (mode === 'title') { if ((K.t * 2 | 0) % 2) sh('PRESS START', W / 2, 168, '#ffffff'); sh('HI SCORE ' + Math.max(K.best, SV.top[0] ? SV.top[0].s : 0), W / 2, 184, '#ffe040'); sh('(C) 1999 MARSUPIAL DOG SOFTWARE', W / 2, H - 14, '#ddd'); return; }
        if (mode === 'menu') { const L = MENU(); box(g, 92, 90, 136, 24 + L.length * 16); L.forEach((s, i) => sh((sel === i ? '> ' : '') + s + (sel === i ? ' <' : ''), W / 2, 100 + i * 16, sel === i ? '#ffe040' : '#ffffff')); if (confirmNew) { box(g, 40, 100, W - 80, 50, '#5a1a1a'); sh('START AGAIN FROM SCRATCH?', W / 2, 110, '#ffffff'); sh(K.label('a') + ' YES    START NO', W / 2, 130, '#ffe040'); } return; }
        if (mode === 'scores') { box(g, 40, 80, W - 80, 140); sh('BEST WOMBATS', W / 2, 86, '#ffe040'); const L = MATES.map(([n, s, m]) => ({ n, s, m, mate: 1 })).concat(SV.top.slice(0, 5).map(t => ({ n: myName(), s: t.s, m: t.m }))).sort((a, b) => b.s - a.s).slice(0, 8); L.forEach((x, i) => { const y = 100 + i * 14; F.draw(g, (i + 1) + '. ' + x.n, 52, y, x.mate ? '#fff' : '#ffe040', 1, '#000'); F.draw(g, x.m.slice(0, 14), 136, y, '#a8c8ff', 1, '#000'); F.draw(g, String(x.s), W - 52 - F.width(String(x.s)), y, x.mate ? '#fff' : '#ffe040', 1, '#000'); }); return; }
        if (mode === 'options') { box(g, 70, 96, 180, 60); [['MUSIC', SV.opt.music ? 'ON' : 'OFF'], ['SCREEN SHAKE', SV.opt.shake ? 'ON' : 'OFF']].forEach(([a, b], i) => sh((sel === i ? '> ' : '') + a + ': ' + b, W / 2, 108 + i * 18, sel === i ? '#ffe040' : '#ffffff')); return; }
        if (mode === 'howto') {
          box(g, 18, 80, W - 36, 148);
          const P3 = [[['MOVE', 'ARROWS / STICK'], ['JUMP', 'Z KEY OR ' + K.label('a')], ['SPIN', 'X KEY OR ' + K.label('x')], ['PAUSE', 'ENTER OR START'], ['', ''], ['', 'JUMP ON CRATES OR SPIN INTO THEM'], ['', 'TO SMASH THEM. 100 MANGOES = A LIFE.']],
            [['BOOM', 'JUMP ON IT: 3 SECONDS. SPIN IT: NOW!'], ['ZAP', 'GREEN. DO NOT TOUCH. AT ALL.'], ['TIKI', 'A MASK THAT TAKES A HIT FOR YOU'], ['IRON', 'THE ARROW ONES ARE SPRINGS'], ['FLAG', 'A CHECKPOINT'], ['', 'SPIKY HEDGEHOGS: SPIN, DON\'T JUMP!'], ['', '']],
            [['GEMS', 'SMASH EVERY CRATE ON A LEVEL'], ['RELICS', 'BEAT A LEVEL, THEN PRESS ' + K.label('x')], ['', 'ON ITS PAD FOR A TIME TRIAL'], ['BOSSES', 'OPEN WHEN YOU FINISH THE LEVELS'], ['', 'BEFORE THEM IN THE WARP ROOM'], ['', 'THE GAME SAVES IN THE WARP ROOM'], ['', '']]][page];
          sh('HOW TO PLAY ' + (page + 1) + '/3', W / 2, 86, '#ffe040'); P3.forEach(([a, b], i) => { F.draw(g, a, 28, 102 + i * 16, '#ffe040', 1, '#000'); F.draw(g, b, 76, 102 + i * 16, '#ffffff', 1, '#000'); });
        }
      }

      // ================================================================ start up
      if (SV.back && Date.now() - SV.back < 20 * 60000) { const lp = SV.lastPad; delete SV.back; save(); goHub(lp == null ? -1 : lp); }
      else goTitle();
      window.__runDbg = { DBG, get mode() { return mode; }, get LV() { return LV; }, get P() { return P; }, get WD() { return WD; }, get SV() { return SV; }, W0, MOD,
        level(i, tt) { startLevel(i, tt); }, boss(i) { startBoss(i); }, hub() { goHub(); }, warp(r) { P.z = -r * TS; P.x = WD.cx(r); P.y = 1; }, win() { levelDone(); } };
      // ---- a console-only model viewer: __runDbg.view('wally'|'crab'|'hog'|'peng'|'turtle'|'mango'|'mask'|'tusk'|'pod'|'boulder'|crate kind, angleDeg, dist, height, 'idle'|'run'|'jump'|'spin'|'dance')
      let VIEW = null;
      function viewStep(dt) {
        const V = VIEW; V.t += dt; const a = V.ang * Math.PI / 180, o = V.at;
        if (V.what === 'wally') { W0.root.visible = true; W0.root.position.set(o.x, 0, o.z); W0.body.rotation.y = 0; W0.body.scale.set(1, 1, 1); poseWombat(W0, { ph: V.t * 9, run: V.pose === 'run' ? 1 : 0, air: V.pose === 'jump' ? 1 : -1, onGround: V.pose !== 'jump', spin: V.pose === 'spin' ? 1 : 0, t: V.t, dance: V.pose === 'dance' }); }
        else { W0.root.visible = false; if (V.obj) V.obj.position.set(o.x, V.y0 || 0, o.z); }
        shadow.visible = false; maskM.visible = false;
        cam.position.set(o.x + Math.sin(a) * V.dist, V.h, o.z + Math.cos(a) * V.dist); cam.lookAt(o.x, V.look, o.z);
      }
      window.__runDbg.view = (what, ang, dist, h, pose) => {
        if (VIEW && VIEW.obj) WD.root.remove(VIEW.obj);
        if (!WD || WD.kind !== 'level') goTitle();
        mode = 'view'; const at = { x: WD.cx(2), z: -4 }; let obj = null, y0 = 0, look = 0.6;
        if (what === 'tusk') { obj = new T.Group(); obj.add(new T.Mesh(MOD.tusk, charMat)); [[-0.5, 0.7], [0.5, 0.7], [-0.5, -0.7], [0.5, -0.7]].forEach(([x, z]) => { const l = new T.Mesh(MOD.tleg, charMat); l.position.set(x, 0.8, z); obj.add(l); }); look = 1; }
        else if (what === 'pod') { obj = new T.Group(); obj.add(new T.Mesh(MOD.pod, charMat)); const dg = new T.Mesh(MOD.dingo, charMat); dg.position.y = 0.05; obj.add(dg); y0 = 1; look = 1.4; }
        else if (CRATE_KINDS.includes(what)) { obj = new T.Mesh(crateGeo, crateMat[what]); y0 = 0.5; look = 0.5; }
        else if (what !== 'wally') { obj = new T.Mesh(MOD[what], what === 'boulder' ? MAT.rock : charMat); if (what === 'mango' || what === 'mask') { y0 = 0.7; obj.scale.setScalar(what === 'mango' ? 1.6 : 1); look = 0.7; } if (what === 'boulder') { y0 = 2.4; look = 2; } }
        if (obj) { obj.traverse(m => { m.userData.shared = true; }); WD.root.add(obj); }
        if (WD.mango) WD.mango.visible = false; for (const k in WD.inst) WD.inst[k].visible = false; for (const f of WD.foes) f.g.visible = false;
        VIEW = { what, obj, at, y0, look, ang: ang || 0, dist: dist || 3, h: h == null ? 1.2 : h, pose: pose || 'idle', t: 0 };
      };
      return {
        update(dt) {
          mt += dt; if (mode === 'view') { viewStep(dt); return; }
          if (mode === 'level' || mode === 'boss') {
            if (LV.demo && (K.any() || K.pressed('start'))) { goTitle(); return; }
            if (paused) return pauseStep();
            if (K.pressed('start') && !LV.done && !LV.demo) { paused = true; psel = 0; K.music(null); snd.ok(); return; }
            return playStep(dt);
          }
          if (mode === 'hub') { if (paused) return pauseStep(); if (K.pressed('start') && !warpTo) { paused = true; psel = 0; K.music(null); snd.ok(); return; } return hubStep(dt); }
          if (mode === 'tally') return tallyStep(dt);
          if (mode === 'credits') { if (mt > 3 && (K.pressed('start') || K.pressed('a'))) { mode = 'sent'; K.over(TL.send, { title: 'YOU WIN!', text: 'DOCTOR DINGO IS BEATEN' }); } return; }
          if (mode === 'sent') return;
          menuStep(dt);
        },
        draw() { sky.position.copy(cam.position); T3.render(); hud.clearRect(0, 0, W, H); if (mode !== 'view') drawHud(); },
        end() { try { clearWorld(); skyG.dispose(); pG.dispose(); for (const k in MOD) if (MOD[k]) MOD[k].dispose(); } catch (e) {} },
      };
    },
  });
})();

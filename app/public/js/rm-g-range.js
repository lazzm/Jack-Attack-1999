/* SECRET AGENT 64: TARGET RANGE (N64, in Jack's room). The whole cartridge now, not just the shooting range from the made-up
 * 1999 spy game: seven missions picked off a dossier-style mission select (FIRING RANGE, THE DAM, THE BUNKER, THE ARMOURED
 * TRAIN, BOMB DEFUSE, SNIPER RIDGE and, once the rest are done, STATUE PARK where Doctor Klaxon is waiting), three
 * difficulties (AGENT, SECRET AGENT, DOUBLE-O AGENT), four guns with their own feel (PK-9 pistol, PK-9 silenced, KR-64 auto
 * rifle with a 2x sight, SR-7 sniper rifle with a proper zooming scope), reloads and spare ammo, headshot and accuracy
 * bonuses, bronze/silver/gold medals, and cheats you unlock with golds (PAINTBALL MODE, BIG HEADS, INFINITE AMMO ...).
 * The missions are "on rails": you move from position to position, the henchmen pop up from cover, step out of doorways
 * and run in, and they shoot back (a red ! means one is about to). Workers, scientists and passengers are NOT targets.
 * Aim with the stick / arrows (it nudges onto targets: AUTO-AIM in OPTIONS) or the mouse; fire A (Z / click), reload B (X),
 * aim/zoom R (E, held), swap gun L (Q), pause START (Enter).
 * N64 look: thick fog, smooth blurry textures, Gouraud shading baked into vertex colours, chunky low-poly henchmen that are
 * all skinned on the CPU into ONE mesh (so a room full of them is a single draw call), the level itself merged by material.
 * Every go is one mission: the debrief, then the score card; "Play again" goes straight back to the mission select.
 * Score rules (rm-cat.js n64.range: max 60000, 600 a second): every score sent is clamped to both.
 * Save (K.save, key rm.n64.range): the old { best:[a,b,c] } still loads; new fields: m (medals + bests per mission and
 *   difficulty), open (missions unlocked), ch (cheats switched on), got (cheats unlocked), opt (options), top (your best runs).
 * Secrets: rm.range.gold (the FIRING RANGE with every target and no civilians), rm.range.hat (knock three hats off in a row),
 *   rm.range.klaxon (beat Doctor Klaxon). Everything here (art, models, tunes) is made up and drawn in code. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const GID = 'n64.range';
  const NEWSECRETS = [
    ['rm.range.hat', 'Hat Trick', 'Knock three hats off in a row in Goldenballs.'],
    ['rm.range.klaxon', 'Klaxon Silenced', 'Find out who is behind it all in Goldenballs, and stop him.'],
  ];
  try { if (window.Apps && Apps.defineSecret) for (const [id, n, hint] of NEWSECRETS) if (!(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, hint); } catch (e) {}

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const D2R = Math.PI / 180;
  const mmss = s => { s = Math.max(0, s); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
  const hexRGB = c => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
  const css = (c, k) => { const [r, g, b] = hexRGB(c); k = k == null ? 1 : k; return `rgb(${clamp(r * k * 255, 0, 255) | 0},${clamp(g * k * 255, 0, 255) | 0},${clamp(b * k * 255, 0, 255) | 0})`; };
  function prng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ================================================================ music (all original): 16th-note steps, MIDI numbers
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function N(str) { const out = []; for (const t of str.trim().split(/\s+/)) { if (t === '|') continue; if (t === '.') out.push(0); else if (t === '-') out.push(-1); else { const m = /^([a-g])([#b]?)(\d)$/.exec(t); if (!m) { out.push(0); continue; } out.push(12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)); } } return out; }
  const SONGS = {
    // the title: a twangy minor surf line over a walking bass (A minor, nothing like anybody's theme tune)
    title: { bpm: 126, wave: 'square', bassWave: 'triangle', vol: 0.045,
      lead: N(`a4 . . c5 e5 . d5 c5 | d5 . e5 . a4 . . . | g4 . . b4 d5 . c5 b4 | c5 . d5 . e5 - - . |
               a4 . . c5 e5 . g5 f5 | e5 . d5 . c5 . b4 . | a4 . c5 . b4 . g#4 . | a4 - - - . . . . |
               e5 . e5 . f5 e5 d5 . | c5 . d5 . e5 . . . | d5 . d5 . e5 d5 c5 . | b4 . c5 . d5 . . . |
               c5 . e5 . a5 . g5 . | f5 . e5 . d5 . c5 . | b4 . . d5 c5 . b4 . | a4 - - - - - . . `),
      bass: N(`a2 . a2 e3 a2 . g2 . | a2 . a2 e3 c3 . b2 . | g2 . g2 d3 g2 . f2 . | e2 . e2 b2 e3 . e2 . |
               a2 . a2 e3 a2 . g2 . | f2 . f2 c3 f2 . e2 . | d2 . d2 a2 e2 . e2 . | a2 . e2 . a2 . . . |
               c3 . c3 g3 c3 . b2 . | a2 . a2 e3 a2 . g2 . | f2 . f2 c3 f2 . e2 . | e2 . e2 b2 e2 . g#2 . |
               a2 . a2 e3 a2 . c3 . | d3 . d3 a2 d3 . f2 . | e2 . e2 b2 e2 . e2 . | a2 . e2 . a2 . . . `),
      drums: 'o.x.o.xxo.x.o.x.o.x.o.xxo.x.oxx.' },
    // the mission select: quiet, ticking, a bit sneaky
    menu: { bpm: 104, wave: 'triangle', bassWave: 'triangle', vol: 0.05,
      lead: N(`e5 . . . . . b4 . | c5 . . . b4 . a4 . | e5 . . . . . b4 . | d5 . c5 . b4 . . . |
               e5 . . . . . g5 . | f5 . e5 . d5 . . . | c5 . d5 . b4 . g4 . | a4 - - - . . . . `),
      bass: N(`a2 . . . e3 . . . | f2 . . . c3 . . . | a2 . . . e3 . . . | g2 . . . d3 . . . |
               c3 . . . g3 . . . | d3 . . . a2 . . . | e2 . . . b2 . . . | a2 . . . e2 . . . `),
      drums: 'x...x...x...x.x.' },
    // out on the dam / the statue park: driving, heroic
    action: { bpm: 150, wave: 'square', bassWave: 'sawtooth', vol: 0.04,
      lead: N(`d5 . d5 . f5 . d5 . | g5 . f5 . d5 . c5 . | d5 . d5 . f5 . a5 . | g5 - - - f5 . e5 . |
               d5 . d5 . f5 . d5 . | g5 . a5 . bb5 . a5 . | g5 . f5 . e5 . c5 . | d5 - - - . . . . |
               a5 . . . g5 . f5 . | g5 . . . f5 . e5 . | f5 . . . e5 . d5 . | e5 . c5 . a4 . . . |
               bb4 . d5 . f5 . bb5 . | a5 . . . g5 . e5 . | f5 . e5 . d5 . c#5 . | d5 - - - - - . . `),
      bass: N(`d2 d3 d2 d3 d2 d3 c3 d3 | d2 d3 d2 d3 a2 c3 d3 . | bb1 bb2 bb1 bb2 bb1 bb2 a2 bb2 | c2 c3 c2 c3 a1 a2 c#3 . `),
      drums: 'o.x.o.xxo.x.oxx.' },
    // the bunker and the sniper ridge: slow and creepy
    sneak: { bpm: 96, wave: 'triangle', bassWave: 'sine', vol: 0.055,
      lead: N(`. . . . e5 . . . | f5 . . . e5 . . . | . . . . b4 . . . | c5 . . . b4 - - . |
               . . . . e5 . . . | g5 . . . f5 . . . | e5 . d5 . c5 . b4 . | a4 - - - - - - . `),
      bass: N(`a1 . . . a1 . . . | a1 . . . a1 . . . | f1 . . . f1 . . . | e1 . . . e1 . . . `),
      drums: 'o.......x.......' },
    // the armoured train: clickety-clack
    train: { bpm: 140, wave: 'square', bassWave: 'triangle', vol: 0.04,
      lead: N(`e5 . g5 . e5 . . b4 | c5 . . . b4 . a4 . | e5 . g5 . e5 . . b5 | a5 . . . g5 . . . |
               f#5 . . e5 d5 . . . | e5 . . d5 b4 . . . | c5 . b4 . a4 . g4 . | a4 . b4 . e4 . . . `),
      bass: N(`e2 . e3 . e2 . e3 . | a2 . a3 . a2 . a3 . | e2 . e3 . e2 . e3 . | c2 . c3 . d2 . d3 . |
               b1 . b2 . b1 . b2 . | e2 . e3 . e2 . e3 . | a1 . a2 . b1 . b2 . | e2 . e3 . e2 . b1 . `),
      drums: 'oxx.oxx.oxx.oxxx' },
    // the bomb: a ticking clock
    bomb: { bpm: 168, wave: 'square', bassWave: 'square', vol: 0.035,
      lead: N(`a5 . . . a5 . . . | a5 . . . g#5 . . . | a5 . . . a5 . . . | c6 . . . b5 . g#5 . |
               a5 . e5 . a5 . e5 . | bb5 . e5 . bb5 . e5 . | a5 . e5 . g#5 . e5 . | a5 - - - . . . . `),
      bass: N(`a1 a1 . a1 a1 . a1 . | bb1 bb1 . bb1 bb1 . bb1 . | a1 a1 . a1 a1 . a1 . | e1 e1 . e1 g#1 . e1 . `),
      drums: 'x.x.x.x.x.x.x.x.' },
    // the range: cheerful army band
    range: { bpm: 120, wave: 'square', bassWave: 'triangle', vol: 0.04,
      lead: N(`c5 . c5 . g4 . c5 . | e5 . c5 . g4 . . . | d5 . d5 . b4 . d5 . | f5 . d5 . b4 . . . |
               e5 . e5 . c5 . e5 . | g5 . e5 . c5 . . . | f5 . d5 . b4 . g4 . | c5 - - - . . . . `),
      bass: N(`c3 . g2 . c3 . g2 . | c3 . g2 . c3 . g2 . | g2 . d2 . g2 . d2 . | g2 . d2 . g2 . b2 . |
               c3 . g2 . c3 . g2 . | a2 . e2 . a2 . e2 . | f2 . g2 . g2 . b2 . | c3 . g2 . c3 . . . `),
      drums: 'o.x.o.x.o.x.o.xx' },
    boss: { bpm: 158, wave: 'sawtooth', bassWave: 'square', vol: 0.032,
      lead: N(`e5 . e5 g5 . e5 bb5 . | a5 . g5 . e5 . . . | e5 . e5 g5 . e5 bb5 . | b5 - - - a5 . g5 . |
               e5 . e5 g5 . e5 bb5 . | a5 . g5 . e5 . d5 . | e5 . g5 . f#5 . d#5 . | e5 - - - - - . . `),
      bass: N(`e1 e2 e1 e2 g1 g2 bb1 bb2 | a1 a2 a1 a2 g1 g2 e1 e2 | e1 e2 e1 e2 g1 g2 bb1 bb2 | b1 b2 b1 b2 b1 b2 b1 b2 `),
      drums: 'o.xxo.x.o.xxoxox' },
  };

  // ================================================================ the guns
  //  dmg: hits it takes off (a henchman has 2-3), rate: seconds between shots, auto: hold to fire, zoom: how far R zooms
  //  spread: how wobbly unaimed shots are (screen units), loud: wakes everyone up, kick: recoil
  const GUNS = {
    pk9: { n: 'PK-9 PISTOL', mag: 7, res: 84, dmg: 1, rate: 0.2, rel: 1.05, zoom: 1.5, spread: 0.012, loud: 1, kick: 1, col: 0x2a2a30 },
    sil: { n: 'PK-9 SILENCED', mag: 7, res: 77, dmg: 1, rate: 0.24, rel: 1.15, zoom: 1.5, spread: 0.01, loud: 0, kick: 0.6, col: 0x22262a },
    kr: { n: 'KR-64 AUTO RIFLE', mag: 30, res: 180, dmg: 1, rate: 0.085, rel: 1.6, zoom: 2, spread: 0.03, loud: 1, kick: 0.45, auto: true, col: 0x3a3428 },
    sr: { n: 'SR-7 SNIPER RIFLE', mag: 5, res: 40, dmg: 4, rate: 0.75, rel: 1.9, zoom: 8, spread: 0.06, loud: 1, kick: 1.6, scope: true, col: 0x2e3a2a },
  };
  const DIFFS = ['AGENT', 'SECRET AGENT', 'DOUBLE-O AGENT'];
  const DK = [ // per difficulty: henchman health bonus, the warning before they shoot, how often they hit, damage, score multiplier
    { hp: 0, warn: 1.4, acc: 0.24, dmg: 5, mul: 1, shooters: 1 },
    { hp: 1, warn: 1.05, acc: 0.34, dmg: 7, mul: 1.4, shooters: 2 },
    { hp: 1, warn: 0.8, acc: 0.46, dmg: 9, mul: 1.8, shooters: 3 },
  ];
  const CHEATS = [ // unlocked by a gold medal (any difficulty) on mission i; fun ones don't cost you medals
    { id: 'paint', n: 'PAINTBALL MODE', fun: true },
    { id: 'heads', n: 'BIG HEADS', fun: true },
    { id: 'ammo', n: 'INFINITE AMMO' },
    { id: 'turbo', n: 'TURBO MODE' },
    { id: 'disco', n: 'DISCO MODE', fun: true },
    { id: 'gold', n: 'GOLDEN GUN' },
    { id: 'arms', n: 'LONG ARMS', fun: true },
  ];

  // ================================================================ the level builder: everything static is merged by material
  // Boxes and cylinders get world-space (triplanar) UVs, so every texture tiles at the same size everywhere, and a baked
  // top-to-bottom shade in the vertex colours (the N64 look: Gouraud plus a bit of fake ambient occlusion).
  function Builder(T) {
    const parts = {};
    const V = new T.Vector3(), Nn = new T.Vector3(), M = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), S = new T.Vector3(), P = new T.Vector3(), NM = new T.Matrix3();
    const unitBox = new T.BoxGeometry(1, 1, 1).toNonIndexed();
    const cyls = {}, cones = {}, balls = {};
    const cylG = seg => cyls[seg] || (cyls[seg] = new T.CylinderGeometry(0.5, 0.5, 1, seg).toNonIndexed());
    const coneG = seg => cones[seg] || (cones[seg] = new T.ConeGeometry(0.5, 1, seg).toNonIndexed());
    const ballG = seg => balls[seg] || (balls[seg] = new T.SphereGeometry(0.5, seg, Math.max(3, seg * 0.6 | 0)).toNonIndexed());
    function push(key, geo, x, y, z, sx, sy, sz, col, o) {
      o = o || {};
      E.set(o.rx || 0, o.ry || 0, o.rz || 0); Q.setFromEuler(E); S.set(sx, sy, sz); P.set(x, y, z); M.compose(P, Q, S); NM.getNormalMatrix(M);
      const L = parts[key] || (parts[key] = { pos: [], nor: [], col: [], uv: [] });
      const pa = geo.attributes.position, na = geo.attributes.normal;
      const [r, g, b] = hexRGB(col == null ? 0xffffff : col), lo = o.lo == null ? 0.62 : o.lo, hi = o.hi == null ? 1.04 : o.hi, ts = o.ts || 2;
      const flat = o.flatTop;
      for (let i = 0; i < pa.count; i++) {
        const ly = pa.getY(i);
        V.set(pa.getX(i), ly, pa.getZ(i)).applyMatrix4(M); Nn.set(na.getX(i), na.getY(i), na.getZ(i)).applyMatrix3(NM).normalize();
        L.pos.push(V.x, V.y, V.z); L.nor.push(Nn.x, Nn.y, Nn.z);
        let k = lerp(lo, hi, clamp(ly + 0.5, 0, 1)); if (flat && Nn.y > 0.7) k = hi; if (o.shade) k *= o.shade;
        if (o.jit) k *= 1 - o.jit * ((Math.sin(V.x * 12.9898 + V.z * 78.233 + V.y * 37.719) * 43758.5453) % 1 + 1) % 1;
        L.col.push(r * k, g * k, b * k);
        const ax = Math.abs(Nn.x), ay = Math.abs(Nn.y), az = Math.abs(Nn.z);
        if (o.uv === 'own') L.uv.push(geo.attributes.uv ? geo.attributes.uv.getX(i) * (o.us || 1) : 0, geo.attributes.uv ? geo.attributes.uv.getY(i) * (o.vs || 1) : 0);
        else if (ay >= ax && ay >= az) L.uv.push(V.x / ts, V.z / ts);
        else if (ax >= az) L.uv.push(V.z / ts, V.y / ts);
        else L.uv.push(V.x / ts, V.y / ts);
      }
    }
    const B = {
      // y is the BOTTOM of the box (easier to lay out)
      box(key, x, y, z, w, h, d, col, o) { push(key, unitBox, x, y + h / 2, z, w, h, d, col, o); return B; },
      cyl(key, x, y, z, r, h, col, seg, o) { push(key, cylG(seg || 8), x, y + h / 2, z, r * 2, h, r * 2, col, o); return B; },
      cone(key, x, y, z, r, h, col, seg, o) { push(key, coneG(seg || 8), x, y + h / 2, z, r * 2, h, r * 2, col, o); return B; },
      ball(key, x, y, z, r, col, seg, o) { push(key, ballG(seg || 8), x, y, z, r * 2, r * 2, r * 2, col, Object.assign({ lo: 0.8, hi: 1.05 }, o)); return B; },
      geo(key, g, x, y, z, sx, sy, sz, col, o) { push(key, g.index ? g.toNonIndexed() : g, x, y, z, sx, sy, sz, col, o); return B; },
      // a flat card with its own 0..1 UVs (trees, signs): two crossed for a tree
      card(key, x, y, z, w, h, ry, col) { const g = new T.PlaneGeometry(1, 1).toNonIndexed(); push(key, g, x, y + h / 2, z, w, h, 1, col, { ry, uv: 'own', lo: 0.8, hi: 1 }); g.dispose(); return B; },
      tree(x, z, h, col) { const w = h * 0.55; B.card('leaf', x, 0, z, w, h, 0, col); B.card('leaf', x, 0, z, w, h, Math.PI / 2, col); return B; },
      // walls with a doorway (a hole w x h at the middle) along x or z
      wallX(key, x0, x1, y, z, h, th, col, door, o) { // a wall from x0 to x1 at z
        if (!door) return B.box(key, (x0 + x1) / 2, y, z, x1 - x0, h, th, col, o);
        const [dc, dw, dh] = door; B.box(key, (x0 + dc - dw / 2) / 2, y, z, dc - dw / 2 - x0, h, th, col, o); B.box(key, (dc + dw / 2 + x1) / 2, y, z, x1 - dc - dw / 2, h, th, col, o); B.box(key, dc, y + dh, z, dw, h - dh, th, col, o); return B;
      },
      wallZ(key, z0, z1, y, x, h, th, col, door, o) {
        if (!door) return B.box(key, x, y, (z0 + z1) / 2, th, h, z1 - z0, col, o);
        const [dc, dw, dh] = door; B.box(key, x, y, (z0 + dc - dw / 2) / 2, th, h, dc - dw / 2 - z0, col, o); B.box(key, x, y, (dc + dw / 2 + z1) / 2, th, h, z1 - dc - dw / 2, col, o); B.box(key, x, y + dh, dc, th, h - dh, dw, col, o); return B;
      },
      // the result: one mesh per material key
      build(root, mats) {
        const out = [];
        for (const key of Object.keys(parts)) {
          const L = parts[key]; if (!L.pos.length || !mats[key]) continue;
          const g = new T.BufferGeometry();
          g.setAttribute('position', new T.Float32BufferAttribute(L.pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(L.nor, 3));
          g.setAttribute('color', new T.Float32BufferAttribute(L.col, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(L.uv, 2));
          g.computeBoundingSphere(); g.computeBoundingBox();
          const m = new T.Mesh(g, mats[key]); m.userData.key = key; root.add(m); out.push(m);
        }
        return out;
      },
      dispose() { unitBox.dispose(); for (const o of [cyls, cones, balls]) for (const k in o) o[k].dispose(); },
    };
    return B;
  }

  // ================================================================ the textures (painted once per go; N64: smooth and blurry)
  function paintTextures(T3, rnd) {
    const sp = (g, w, h, n, cols, sw, sh) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(rnd() * w | 0, rnd() * h | 0, sw || 1 + (rnd() * 2 | 0), sh || 1 + (rnd() * 2 | 0)); } };
    const T = {
      conc: T3.tex(64, 64, (g, w, h) => { g.fillStyle = '#b4b0a6'; g.fillRect(0, 0, w, h); sp(g, w, h, 600, ['#a8a49a', '#c0bcb2', '#9c988e', '#bab6ac']); g.fillStyle = 'rgba(70,64,56,.25)'; g.fillRect(0, 31, w, 2); g.fillRect(31, 0, 2, h); for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(60,55,50,.12)'; g.fillRect(rnd() * w | 0, 0, 2 + rnd() * 4, h); } }),
      metal: T3.tex(64, 64, (g, w, h) => { g.fillStyle = '#8a9096'; g.fillRect(0, 0, w, h); sp(g, w, h, 300, ['#7e848a', '#969ca2']); g.fillStyle = '#5a6066'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); g.fillStyle = '#b0b6bc'; g.fillRect(0, 2, w, 1); for (const [x, y] of [[6, 6], [58, 6], [6, 58], [58, 58]]) { g.fillStyle = '#4a5056'; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = '#c8ccd0'; g.fillRect(x - 1, y - 1, 1, 1); } }),
      grate: T3.tex(32, 32, (g, w, h) => { g.fillStyle = '#3a3e42'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a8086'; for (let i = 0; i < w; i += 4) { g.fillRect(i, 0, 2, h); } g.fillStyle = '#5a6066'; for (let j = 0; j < h; j += 8) g.fillRect(0, j, w, 2); }),
      crate: T3.tex(32, 32, (g, w, h) => { g.fillStyle = '#a07040'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { g.fillStyle = y % 8 ? '#946638' : '#a8784a'; g.fillRect(0, y, w, 1); } g.fillStyle = '#6a4422'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h); g.strokeStyle = '#6a4422'; g.lineWidth = 3; g.beginPath(); g.moveTo(3, 3); g.lineTo(w - 3, h - 3); g.stroke(); }),
      ammo: T3.tex(32, 32, (g, w, h) => { g.fillStyle = '#4a5a32'; g.fillRect(0, 0, w, h); sp(g, w, h, 80, ['#526438', '#40502a']); g.fillStyle = '#2a361c'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillStyle = '#e8d890'; g.fillRect(6, 13, 20, 6); g.fillStyle = '#4a5a32'; for (let i = 0; i < 4; i++) g.fillRect(8 + i * 5, 14, 2, 4); }),
      brick: T3.tex(64, 32, (g, w, h) => { g.fillStyle = '#6a5a50'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = ((y / 8) % 2) * 8 - 8; x < w; x += 16) { g.fillStyle = ['#8a4a36', '#7a4230', '#94523c', '#843f2c'][(x + y * 3 + 64) % 4]; g.fillRect(x + 1, y + 1, 14, 6); } }),
      grass: T3.tex(64, 64, (g, w, h) => { g.fillStyle = '#4a7a2c'; g.fillRect(0, 0, w, h); sp(g, w, h, 900, ['#5a8a34', '#426e26', '#66983c', '#3a6222'], 1, 2); }),
      dirt: T3.tex(64, 64, (g, w, h) => { g.fillStyle = '#8a6a44'; g.fillRect(0, 0, w, h); sp(g, w, h, 700, ['#a8885a', '#6a4a2a', '#b89a6a', '#5e4026']); sp(g, w, h, 60, ['#c8b898', '#4a3420'], 2, 2); }),
      snow: T3.tex(64, 64, (g, w, h) => { g.fillStyle = '#e8eef4'; g.fillRect(0, 0, w, h); sp(g, w, h, 500, ['#d8e0ea', '#f4f8fc', '#cad4e0']); }),
      rock: T3.tex(64, 64, (g, w, h) => { g.fillStyle = '#7a766c'; g.fillRect(0, 0, w, h); sp(g, w, h, 500, ['#8a867a', '#6a665c', '#5e5a52', '#949084'], 3, 2); g.strokeStyle = 'rgba(40,36,30,.5)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.stroke(); } }),
      water: T3.tex(64, 64, (g, w, h) => { g.fillStyle = '#2a5a7a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { g.fillStyle = ['#3a7a9a', '#4a8aaa', '#1e4a66'][i % 3]; g.fillRect(rnd() * w | 0, rnd() * h | 0, 4 + rnd() * 8 | 0, 1); } }),
      wood: T3.tex(32, 64, (g, w, h) => { g.fillStyle = '#7a5530'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { g.fillStyle = '#5a3a1e'; g.fillRect(x, 0, 1, h); } for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(40,24,10,.3)'; g.fillRect(rnd() * w | 0, rnd() * h | 0, 1, 6 + rnd() * 10); } }),
      panel: T3.tex(64, 64, (g, w, h) => { g.fillStyle = '#7a8a6a'; g.fillRect(0, 0, w, h); sp(g, w, h, 200, ['#728262', '#82927a']); g.fillStyle = '#4a5a42'; g.fillRect(0, 0, w, 2); g.fillRect(0, 31, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(31, 0, 2, h); g.fillStyle = '#9aaa8a'; g.fillRect(2, 2, 29, 1); g.fillRect(33, 33, 29, 1); }),
      tile: T3.tex(32, 32, (g, w, h) => { g.fillStyle = '#5a5e58'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { g.fillStyle = (x + y) % 32 ? '#6e7268' : '#62665e'; g.fillRect(x + 1, y + 1, 14, 14); } }),
      carpet: T3.tex(32, 32, (g, w, h) => { g.fillStyle = '#6a1a22'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { g.fillStyle = (x / 8 + y / 8) % 2 ? '#7a2a2a' : '#5a1418'; g.fillRect(x + 2, y + 2, 4, 4); } }),
      leaf: T3.tex(64, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#4a321a'; g.fillRect(29, 90, 6, 38); for (let i = 0; i < 5; i++) { const y = 8 + i * 18, ww = 10 + i * 6; g.fillStyle = ['#1e4a1a', '#2a5e22', '#245420', '#327028', '#2a6424'][i]; g.beginPath(); g.moveTo(32, y - 6); g.lineTo(32 - ww, y + 26); g.lineTo(32 + ww, y + 26); g.fill(); g.fillStyle = 'rgba(120,180,90,.25)'; g.beginPath(); g.moveTo(32, y - 6); g.lineTo(32 - ww * 0.5, y + 16); g.lineTo(32, y + 14); g.fill(); } }),
      sign: T3.tex(64, 32, (g, w, h) => { g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#c01a1a'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 4, w, 4); g.fillStyle = '#1a1a1a'; g.font = 'bold 13px Arial'; g.textAlign = 'center'; g.fillText('DANGER', w / 2, 21); }),
      lamp: T3.tex(16, 16, (g, w, h) => { const gr = g.createRadialGradient(8, 8, 1, 8, 8, 8); gr.addColorStop(0, '#fffbe8'); gr.addColorStop(1, '#f0e0a0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
      window: T3.tex(64, 32, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#a8c8e8'); gr.addColorStop(1, '#e8f0f8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(10, 0); g.lineTo(26, 0); g.lineTo(12, h); g.lineTo(0, h); g.fill(); }),
      screen: T3.tex(32, 32, (g, w, h) => { g.fillStyle = '#0a1a0e'; g.fillRect(0, 0, w, h); g.fillStyle = '#3aff6a'; for (let y = 3; y < h - 2; y += 4) g.fillRect(3, y, 4 + rnd() * 22 | 0, 2); }),
      seat: T3.tex(32, 32, (g, w, h) => { g.fillStyle = '#2a3a6a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.fillStyle = i % 2 ? '#34467a' : '#22305a'; g.fillRect(rnd() * w | 0, rnd() * h | 0, 2, 2); } g.fillStyle = '#c8a028'; for (let y = 4; y < h; y += 10) g.fillRect(0, y, w, 1); }),
      statue: T3.tex(64, 64, (g, w, h) => { g.fillStyle = '#8a9a7a'; g.fillRect(0, 0, w, h); sp(g, w, h, 600, ['#7a8a6a', '#9aaa8a', '#6a7a5e', '#5a7a5a'], 3, 3); }),
    };
    return T;
  }

  // ================================================================ the henchmen: boxy people skinned on the CPU into one mesh
  // Bones: 0 root (feet), 1 hips, 2 torso, 3 head, 4 upper arm L, 5 forearm L, 6 upper arm R, 7 forearm R, 8 thigh L,
  // 9 shin L, 10 thigh R, 11 shin R, 12 hat. A box: [bone, cx, cy, cz, w, h, d, colour, tag, rx]. Front is +z.
  const BONES = [[-1, 0, 0, 0], [0, 0, 0.94, 0], [1, 0, 0.06, 0], [2, 0, 0.56, 0], [2, -0.25, 0.5, 0], [4, 0, -0.3, 0], [2, 0.25, 0.5, 0], [6, 0, -0.3, 0], [1, -0.1, -0.02, 0], [8, 0, -0.45, 0], [1, 0.1, -0.02, 0], [10, 0, -0.45, 0], [3, 0, 0.27, 0]];
  const MAXBOX = 46, VPB = 24;
  const STYLES = {
    // olive fatigues, a beret
    soldier: { skin: 0xf0c098, top: 0x6a8a3a, legs: 0x52683a, boots: 0x1a1a14, belt: 0xc0a060, hat: 'beret', hatc: 0x9a1a1a, gun: 'rifle', hair: 0x3a2a1a },
    // grey bunker guard in a helmet
    guard: { skin: 0xe8b890, top: 0x8a94a4, legs: 0x5a6270, boots: 0x18181a, belt: 0x1a1a1a, hat: 'helmet', hatc: 0x3a4248, gun: 'pistol', hair: 0x2a2018 },
    // a navy trench coat on the train
    navy: { skin: 0xf0c098, top: 0x34509a, legs: 0x223062, boots: 0x101010, belt: 0x0a0a0a, hat: 'cap', hatc: 0x1a2240, gun: 'rifle', hair: 0x4a3018 },
    // a white parka and a fur hat on the ridge
    snow: { skin: 0xe8b890, top: 0xd8dde4, legs: 0xc0c6ce, boots: 0x3a3a3a, belt: 0x5a5a5a, hat: 'fur', hatc: 0x6a4a2a, gun: 'rifle', hair: 0x3a2a1a },
    // Doctor Klaxon: purple suit, bald, a monocle
    boss: { skin: 0xf0c098, top: 0x5a2a7a, legs: 0x3a1a52, boots: 0x101010, belt: 0xd0a020, hat: 'none', hatc: 0, gun: 'pistol', hair: 0xf0c098, tie: 0xd01a1a, mono: true },
    // the people you must NOT shoot
    worker: { skin: 0xd8a070, top: 0xe8781a, legs: 0x3a5a9a, boots: 0x4a3018, belt: 0xd8d8d8, hat: 'hard', hatc: 0xf0d020, gun: '', hair: 0x2a1a0a, civ: true },
    sci: { skin: 0xf0c8a0, top: 0xf2f2ee, legs: 0x4a4a52, boots: 0x2a2a2a, belt: 0xe0e0e0, hat: 'none', hatc: 0, gun: '', hair: 0x9a9a9a, civ: true, specs: true },
    pass: { skin: 0xe0b088, top: 0x7a5a3a, legs: 0x5a4430, boots: 0x2a1a10, belt: 0x3a2a1a, hat: 'trilby', hatc: 0x4a3a2a, gun: '', hair: 0x5a3a1a, civ: true },
    parka: { skin: 0xe8b890, top: 0xc8281e, legs: 0x2a2a3a, boots: 0x2a2a2a, belt: 0x1a1a1a, hat: 'fur', hatc: 0x8a6a4a, gun: '', hair: 0x3a2a1a, civ: true },
  };
  function charBoxes(st) {
    const L = [], S = st;
    const b = (bone, cx, cy, cz, w, h, d, c, tag, rx) => L.push([bone, cx, cy, cz, w, h, d, c, tag || 'body', rx || 0]);
    // hips + belt
    b(1, 0, -0.04, 0, 0.36, 0.2, 0.22, S.legs); b(1, 0, 0.08, 0, 0.38, 0.06, 0.24, S.belt);
    // torso: chest, collar, pockets (or a tie and lapels for the boss / a coat for the scientist)
    const dk = c => ((((c >> 16) & 255) * 0.72) << 16) | ((((c >> 8) & 255) * 0.72) << 8) | ((c & 255) * 0.72);
    b(2, 0, 0.27, 0, 0.46, 0.5, 0.26, S.top); b(2, 0, 0.53, 0, 0.22, 0.06, 0.22, S.top, 'body'); b(2, 0, 0.58, 0.01, 0.11, 0.08, 0.11, S.skin, 'head');
    b(2, -0.24, 0.47, 0, 0.13, 0.12, 0.26, dk(S.top), 'body'); b(2, 0.24, 0.47, 0, 0.13, 0.12, 0.26, dk(S.top), 'body');
    if (S.hat === 'beret') { b(2, 0, 0.3, -0.18, 0.32, 0.34, 0.1, dk(S.top)); b(2, -0.12, 0.27, 0.133, 0.05, 0.46, 0.02, S.belt); b(2, 0.12, 0.27, 0.133, 0.05, 0.46, 0.02, S.belt); }
    if (S.hat === 'helmet') { b(2, 0, 0.3, 0.02, 0.48, 0.3, 0.27, dk(S.top)); b(1, 0.17, 0.02, 0.1, 0.07, 0.12, 0.06, 0x1a1a1a); }
    if (S.hat === 'cap') { for (let i = 0; i < 3; i++) { b(2, -0.07, 0.4 - i * 0.12, 0.135, 0.03, 0.03, 0.02, 0xd0a020); b(2, 0.07, 0.4 - i * 0.12, 0.135, 0.03, 0.03, 0.02, 0xd0a020); } b(1, 0, -0.18, -0.06, 0.4, 0.28, 0.16, S.top); }
    if (S.hat === 'fur' && !S.civ) { b(2, 0, 0.3, -0.18, 0.3, 0.3, 0.1, 0x8a8e92); }
    if (S.hat === 'hard') { b(2, 0, 0.36, 0.0, 0.47, 0.05, 0.27, 0xe8e840); b(2, 0, 0.18, 0.0, 0.47, 0.05, 0.27, 0xe8e840); }
    if (S.tie) { b(2, 0, 0.3, 0.135, 0.06, 0.34, 0.02, S.tie); b(2, -0.08, 0.38, 0.132, 0.06, 0.2, 0.02, 0xe8e8e8); b(2, 0.08, 0.38, 0.132, 0.06, 0.2, 0.02, 0xe8e8e8); }
    else if (S.civ && S.top === 0xf2f2ee) { b(2, 0, 0.36, 0.133, 0.1, 0.28, 0.02, 0x8aa0c8); b(2, 0, -0.02, 0, 0.46, 0.3, 0.27, S.top); }
    else { b(2, -0.11, 0.33, 0.135, 0.1, 0.09, 0.02, S.belt === 0xd8d8d8 ? 0xd0d0d0 : (S.top & 0xfefefe) >> 1); b(2, 0.11, 0.33, 0.135, 0.1, 0.09, 0.02, (S.top & 0xfefefe) >> 1); }
    // head: face, hair, eyes, brows, nose, mouth
    b(3, 0, 0.14, 0, 0.27, 0.29, 0.26, S.skin, 'head'); b(3, -0.145, 0.14, -0.01, 0.03, 0.08, 0.06, S.skin, 'head'); b(3, 0.145, 0.14, -0.01, 0.03, 0.08, 0.06, S.skin, 'head'); b(3, 0, 0.26, -0.02, 0.285, 0.06, 0.285, S.hair, 'head'); b(3, 0, 0.17, -0.115, 0.28, 0.2, 0.06, S.hair, 'head');
    b(3, -0.06, 0.17, 0.133, 0.045, 0.035, 0.012, 0x101010, 'head'); b(3, 0.06, 0.17, 0.133, 0.045, 0.035, 0.012, 0x101010, 'head');
    b(3, -0.06, 0.205, 0.134, 0.06, 0.018, 0.012, S.hair === S.skin ? 0x5a4030 : S.hair, 'head'); b(3, 0.06, 0.205, 0.134, 0.06, 0.018, 0.012, S.hair === S.skin ? 0x5a4030 : S.hair, 'head');
    b(3, 0, 0.13, 0.142, 0.045, 0.06, 0.04, S.skin, 'head'); b(3, 0, 0.065, 0.134, 0.08, 0.02, 0.012, 0x7a2a2a, 'head');
    if (S.specs) { b(3, -0.06, 0.17, 0.141, 0.08, 0.06, 0.008, 0xc8e8f0, 'head'); b(3, 0.06, 0.17, 0.141, 0.08, 0.06, 0.008, 0xc8e8f0, 'head'); b(3, 0, 0.185, 0.143, 0.2, 0.012, 0.008, 0x222222, 'head'); }
    if (S.mono) { b(3, 0.06, 0.17, 0.141, 0.07, 0.07, 0.01, 0xf0d040, 'head'); b(3, 0, 0.095, 0.144, 0.14, 0.03, 0.02, 0x3a2a1a, 'head'); b(3, 0, 0.27, 0, 0.275, 0.02, 0.265, 0xe0b088, 'head'); }
    // arms (upper, fore, hand) - the right hand holds the gun
    for (const [u, f] of [[4, 5], [6, 7]]) { b(u, 0, -0.15, 0, 0.13, 0.32, 0.13, S.top, 'limb'); b(f, 0, -0.14, 0, 0.12, 0.3, 0.12, S.top, 'limb'); b(f, 0, -0.33, 0, 0.1, 0.1, 0.1, S.civ ? S.skin : 0x1a1a1a, 'limb'); }
    if (S.gun === 'pistol') { b(7, 0, -0.42, 0.03, 0.06, 0.2, 0.1, 0x1a1a1e, 'gun'); b(7, 0, -0.36, -0.04, 0.05, 0.06, 0.08, 0x1a1a1e, 'gun'); }
    if (S.gun === 'rifle') { b(7, 0, -0.5, 0.02, 0.07, 0.6, 0.11, 0x2a2420, 'gun'); b(7, 0, -0.3, 0.07, 0.05, 0.12, 0.1, 0x5a3a20, 'gun'); b(7, 0, -0.62, 0.08, 0.04, 0.1, 0.04, 0x1a1a1a, 'gun'); }
    // legs (thigh, shin, boot)
    for (const [t, s] of [[8, 9], [10, 11]]) { b(t, 0, -0.22, 0, 0.16, 0.46, 0.18, S.legs, 'limb'); b(s, 0, -0.2, 0, 0.14, 0.42, 0.16, S.legs, 'limb'); b(s, 0, -0.43, 0.04, 0.16, 0.1, 0.27, S.boots, 'limb'); }
    // the hat (it can come off)
    if (S.hat === 'beret') { b(12, 0.02, 0.0, -0.01, 0.29, 0.07, 0.29, S.hatc, 'hat'); b(12, 0.09, 0.04, 0, 0.12, 0.05, 0.2, S.hatc, 'hat'); }
    if (S.hat === 'helmet') { b(12, 0, 0.02, 0, 0.32, 0.13, 0.32, S.hatc, 'hat'); b(12, 0, -0.04, 0.02, 0.36, 0.03, 0.36, S.hatc, 'hat'); }
    if (S.hat === 'cap') { b(12, 0, 0.02, 0, 0.29, 0.1, 0.29, S.hatc, 'hat'); b(12, 0, -0.02, 0.17, 0.22, 0.02, 0.1, 0x111111, 'hat'); b(12, 0, 0.03, 0.146, 0.06, 0.05, 0.01, 0xd0a020, 'hat'); }
    if (S.hat === 'fur') { b(12, 0, 0.04, 0, 0.32, 0.16, 0.32, S.hatc, 'hat'); b(12, 0, -0.02, 0, 0.34, 0.06, 0.34, (S.hatc & 0xfefefe) >> 1 | 0x202020, 'hat'); }
    if (S.hat === 'hard') { b(12, 0, 0.03, 0, 0.3, 0.12, 0.3, S.hatc, 'hat'); b(12, 0, -0.03, 0.04, 0.34, 0.02, 0.38, S.hatc, 'hat'); }
    if (S.hat === 'trilby') { b(12, 0, 0.04, 0, 0.26, 0.12, 0.26, S.hatc, 'hat'); b(12, 0, -0.02, 0, 0.4, 0.02, 0.4, S.hatc, 'hat'); b(12, 0, 0.0, 0, 0.27, 0.03, 0.27, 0x1a1a1a, 'hat'); }
    return L.slice(0, MAXBOX);
  }
  // the batch: N slots, each MAXBOX boxes of 24 vertices, all in ONE mesh
  function Crowd(T, mat, slots) {
    const nB = slots * MAXBOX, nV = nB * VPB;
    const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), col = new Float32Array(nV * 3), idx = new Uint32Array(nB * 36);
    const cube = new T.BoxGeometry(1, 1, 1), cp = cube.attributes.position.array, cn = cube.attributes.normal.array, ci = cube.index.array;
    for (let b = 0; b < nB; b++) for (let i = 0; i < 36; i++) idx[b * 36 + i] = ci[i] + b * VPB;
    const geo = new T.BufferGeometry();
    const pA = new T.BufferAttribute(pos, 3), nA = new T.BufferAttribute(nor, 3), cA = new T.BufferAttribute(col, 3);
    pA.setUsage(T.DynamicDrawUsage); nA.setUsage(T.DynamicDrawUsage);
    geo.setAttribute('position', pA); geo.setAttribute('normal', nA); geo.setAttribute('color', cA); geo.setIndex(new T.BufferAttribute(idx, 1));
    geo.boundingSphere = new T.Sphere(new T.Vector3(), 1e6);
    const mesh = new T.Mesh(geo, mat); mesh.frustumCulled = false;
    cube.dispose();
    const free = []; for (let i = slots - 1; i >= 0; i--) free.push(i);
    const bw = []; for (let i = 0; i < BONES.length; i++) bw.push(new T.Matrix4());
    const tmp = new T.Matrix4(), tq = new T.Quaternion(), te = new T.Euler(0, 0, 0, 'YXZ'), tv = new T.Vector3(), ts = new T.Vector3(1, 1, 1), bm = new T.Matrix4();
    const C = {
      mesh,
      take(boxes) { // a slot for these boxes (or null if the crowd is full)
        if (!free.length) return null; const s = free.pop();
        for (let k = 0; k < MAXBOX; k++) { const B = boxes[k]; const [r, g, b] = B ? hexRGB(B[7]) : [0, 0, 0]; for (let v = 0; v < VPB; v++) { const o = ((s * MAXBOX + k) * VPB + v) * 3, up = cp[v * 3 + 1] > 0 ? 1.05 : 0.7; col[o] = r * up; col[o + 1] = g * up; col[o + 2] = b * up; } }
        cA.needsUpdate = true; return s;
      },
      give(s) { if (s == null) return; free.push(s); pos.fill(0, s * MAXBOX * VPB * 3, (s + 1) * MAXBOX * VPB * 3); C.dirty = true; },
      // pose: rot[i] = [rx, ry, rz] per bone, plus root position/yaw/scale; heads/arms scaled for the cheats; the box matrices
      // are kept for the hit test
      pose(s, ch) {
        const R = ch.rot, mats = ch.mats || (ch.mats = ch.boxes.map(() => new T.Matrix4()));
        for (let i = 0; i < BONES.length; i++) {
          const [par, px, py, pz] = BONES[i];
          if (i === 0) { te.set(ch.rx || 0, ch.yaw, ch.rz || 0); tq.setFromEuler(te); tv.set(ch.x, ch.y, ch.z); ts.set(ch.sc || 1, ch.sc || 1, ch.sc || 1); bw[0].compose(tv, tq, ts); if (R[0]) { te.set(R[0][0], 0, R[0][2]); tq.setFromEuler(te); tmp.makeRotationFromQuaternion(tq); bw[0].multiply(tmp); } continue; }
          const r = R[i] || [0, 0, 0]; te.set(r[0], r[1], r[2]);
          if (i === 12 && ch.hatFly) { bw[12].copy(ch.hatFly.m); continue; }
          tq.setFromEuler(te); tv.set(px, py + (i === 1 ? (ch.hipY || 0) : 0), pz);
          const k = (i === 3 && ch.bigHead) ? ch.bigHead : (i === 5 || i === 7) && ch.longArm ? ch.longArm : 1;
          ts.set(k, k, k); if ((i === 5 || i === 7) && ch.longArm) ts.set(1, k, 1);
          tmp.compose(tv, tq, ts); bw[i].multiplyMatrices(bw[par], tmp);
        }
        if (!ch.hatFly) ch.hatM = bw[12].clone();
        const boxes = ch.boxes;
        for (let k = 0; k < MAXBOX; k++) {
          const base = (s * MAXBOX + k) * VPB * 3, B = boxes[k];
          if (!B || (B[8] === 'hat' && ch.hatGone)) { pos.fill(0, base, base + VPB * 3); continue; }
          te.set(B[9], 0, 0); tq.setFromEuler(te); tv.set(B[1], B[2], B[3]); ts.set(B[4], B[5], B[6]);
          bm.compose(tv, tq, ts); bm.premultiply(bw[B[0]]); mats[k].copy(bm);
          const e = bm.elements, iw = 1 / (B[4] * B[4]), ih = 1 / (B[5] * B[5]), id = 1 / (B[6] * B[6]);
          for (let v = 0; v < VPB; v++) {
            const x = cp[v * 3], y = cp[v * 3 + 1], z = cp[v * 3 + 2], o = base + v * 3;
            pos[o] = e[0] * x + e[4] * y + e[8] * z + e[12]; pos[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; pos[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
            const nx = cn[v * 3] * iw, ny = cn[v * 3 + 1] * ih, nz = cn[v * 3 + 2] * id;
            let a = e[0] * nx + e[4] * ny + e[8] * nz, bq = e[1] * nx + e[5] * ny + e[9] * nz, c = e[2] * nx + e[6] * ny + e[10] * nz; const l = Math.hypot(a, bq, c) || 1;
            nor[o] = a / l; nor[o + 1] = bq / l; nor[o + 2] = c / l;
          }
        }
        C.dirty = true;
      },
      flush() { if (C.dirty) { pA.needsUpdate = true; nA.needsUpdate = true; C.dirty = false; } },
      dispose() { geo.dispose(); },
    };
    return C;
  }
  // a ray against a box (the inverse of its matrix takes the ray into the unit cube): the distance, or -1
  const _inv = { m: null };
  function rayBox(T, m, o, d) {
    const inv = _inv.m || (_inv.m = new T.Matrix4()); inv.copy(m).invert();
    const e = inv.elements;
    const ox = e[0] * o.x + e[4] * o.y + e[8] * o.z + e[12], oy = e[1] * o.x + e[5] * o.y + e[9] * o.z + e[13], oz = e[2] * o.x + e[6] * o.y + e[10] * o.z + e[14];
    const dx = e[0] * d.x + e[4] * d.y + e[8] * d.z, dy = e[1] * d.x + e[5] * d.y + e[9] * d.z, dz = e[2] * d.x + e[6] * d.y + e[10] * d.z;
    let t0 = -Infinity, t1 = Infinity;
    for (const [oo, dd] of [[ox, dx], [oy, dy], [oz, dz]]) {
      if (Math.abs(dd) < 1e-9) { if (oo < -0.5 || oo > 0.5) return -1; continue; }
      let a = (-0.5 - oo) / dd, b = (0.5 - oo) / dd; if (a > b) { const t = a; a = b; b = t; }
      if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) return -1;
    }
    if (t1 < 0) return -1;
    return t0 > 0 ? t0 : 0; // (in units of d: d is a unit vector in world space, and the matrices keep distance along the ray)
  }

  // ================================================================ the missions
  // A stop: p [x, z] (eyes 1.65 m up, or y), yaw/span (degrees: where you look, how far you can pan), walk (seconds to get
  // there), spawns. A spawn: [time, kind, x, z, how, opts]
  //   kind g: a henchman (how: stand | pop (ducks behind cover) | peek (steps out sideways, opts.dx) | run (opts.from) | patrol (opts.to))
  //        c: somebody you must NOT shoot (runs from opts.from to x,z, or cowers: how 'cower')
  //        card: a range target (how: goon | civ | bull; opts.stay, opts.mv)     boss: Doctor Klaxon (opts.pts: cover spots)
  //        ammo / armour: a box to shoot for a pick-up
  //   opts.d: only from this difficulty up. opts.y: standing up high. opts.hp: tougher.
  // Stops end when every henchman is down (range: when every target has gone; ridge: when enough are down).
  function rangeCards(rnd, phase) {
    const L = [], n = [16, 14, 11][phase], civs = [3, 3, 2][phase], dur = [26, 28, 34][phase];
    let civLeft = civs;
    for (let i = 0; i < n + civs; i++) {
      const t = 1.2 + i * (dur / (n + civs)) + rnd() * 0.8;
      const civ = i > 2 && civLeft > 0 && rnd() < civLeft / (n + civs - i + 1) * 1.8; if (civ) civLeft--;
      const z = phase === 0 ? [10, 14, 18, 22, 26][rnd() * 5 | 0] : phase === 1 ? 14 + rnd() * 18 : 50 + rnd() * 80;
      const x = (rnd() * 2 - 1) * Math.min(phase === 2 ? 30 : 10, z * 0.55);
      L.push([t, 'card', x, -z, civ ? 'civ' : phase === 0 && rnd() < 0.25 ? 'bull' : 'goon', { stay: phase === 2 ? 5 : phase === 1 ? 4.2 : 2.4 + rnd() * 0.8, mv: phase === 1 ? [Math.min(3 + rnd() * 4, z * 0.3), 0.8 + rnd() * 1.3, rnd() * 6] : null }]);
    }
    return L;
  }
  const MISSIONS = [
    // ---------------------------------------------------------------- 1. the firing range
    { id: 'range', n: 'FIRING RANGE', place: 'TRAINING GROUND, SOMEWHERE GREEN', kind: 'range', music: 'range', guns: ['pk9', 'kr', 'sr'],
      brief: ['WELCOME TO THE RANGE, AGENT.', 'POP THE CARDBOARD HENCHMEN BEFORE THEY', 'FLIP DOWN. THE BLUE ONES ARE CIVILIANS:', 'LEAVE THEM ALONE. BULLSEYES SCORE EXTRA.'],
      obj: ['POP-UPS WITH THE PISTOL', 'MOVING TARGETS', 'LONG RANGE WITH THE SCOPE (HOLD R)'], par: 100, medal: [5200, 7600],
      sky: { top: 0x4a78c8, hor: 0xc8d8f0, fog: 0xb0c4e0, near: 40, far: 260, sun: 0.75, amb: 0.8, dir: [0.4, 1, 0.6], hs: 0xdde8ff, hg: 0x5a6a3a },
      build(B, X) {
        B.box('grass', 0, -1, -110, 300, 1, 300, 0xffffff, { ts: 4, flatTop: true });
        for (let i = 0; i < 10; i++) B.box('grass', -20 + i * 4 + 2, -0.99, -70, 4, 1, 140, i % 2 ? 0xffffff : 0xd0e0b8, { ts: 4, flatTop: true });
        for (const x of [-9, 0, 9]) B.box('dirt', x, -0.985, -18, 2.2, 1, 22, 0xffffff, { ts: 3, flatTop: true });
        B.box('dirt', 0, 0, -150, 150, 8, 12, 0xc0a080, { ts: 4 }); B.box('grass', 0, 8, -150, 150, 0.6, 12, 0xffffff, { ts: 4 });
        for (const x of [-18, 18]) B.box('dirt', x, 0, -70, 2, 2.2, 140, 0xa08860, { ts: 3 });
        // the booth: sandbags, a counter, posts and a roof
        B.box('crate', 0, 0, -1.25, 8, 1.05, 0.7, 0xe0d0a0, { ts: 1 }); B.box('wood', 0, 1.05, -1.25, 8.2, 0.08, 0.9, 0x8a5a30);
        for (const x of [-4.2, 4.2]) B.box('wood', x, 0, -1.4, 0.35, 3.3, 0.35, 0x8a6038); B.box('wood', 0, 3.3, -0.6, 9.2, 0.25, 3.2, 0x7a5030);
        for (const x of [-4.2, 4.2]) B.box('wood', x, 0, 1.5, 0.35, 3.3, 0.35, 0x8a6038);
        // lane posts and distance boards, target rails
        for (const d of [10, 25, 50, 100]) for (const x of [-14, 14]) { B.box('metal', x, 0, -d, 0.15, 1, 0.15, 0x666666); B.box('sign', x, 1, -d, 2.4, 1.1, 0.1, 0xffffff, { ts: 2.4 }); X.label(x, 1.55, -d + 0.06, d + 'M'); }
        for (let z = 12; z <= 34; z += 11) B.box('metal', 0, 0, -z - 0.6, 24, 0.12, 0.12, 0x7a7a7a);
        // a watch tower and a hut, flags, trees and hills
        B.box('wood', -34, 0, -95, 3, 12, 3, 0x8a6038); B.box('wood', -34, 12, -95, 5, 0.6, 5, 0x7a5030); B.box('wood', -34, 12.6, -95, 5.2, 0.15, 0.2, 0x5a3a20);
        B.box('brick', 26, 0, -30, 8, 3.2, 6, 0xffffff); B.box('metal', 26, 3.2, -30, 8.6, 0.3, 6.6, 0x6a4a3a);
        for (const z of [-40, -80, -120]) { B.cyl('metal', -22, 0, z, 0.08, 6, 0xaaaaaa, 6); B.box('plain', -21.3, 5, z, 1.4, 0.9, 0.05, 0xd01a1a); }
        const r = X.rnd; for (let i = 0; i < 40; i++) { const s = i % 2 ? 1 : -1; B.tree(s * (24 + r() * 60), -10 - r() * 160, 6 + r() * 6, 0xffffff); }
        X.mount(260, 18, 30, 0x6a8a5a);
      },
      stops: [
        { p: [0, 0], yaw: 0, span: 30, walk: 0, gun: 'pk9', phase: 'POP-UPS', spawns: 'range0' },
        { p: [0, 0], yaw: 0, span: 30, walk: 0, gun: 'kr', phase: 'MOVING TARGETS', spawns: 'range1' },
        { p: [0, 0], yaw: 0, span: 34, walk: 0, gun: 'sr', phase: 'LONG RANGE', spawns: 'range2' },
      ] },
    // ---------------------------------------------------------------- 2. the dam
    { id: 'dam', n: 'THE DAM', place: 'A VERY BIG WALL OF CONCRETE', kind: 'rail', music: 'action', guns: ['pk9', 'sil', 'kr'], style: 'soldier', civ: 'worker',
      brief: ['THE ENEMY HAS TAKEN OVER THE DAM.', 'FIGHT YOUR WAY ALONG THE TOP TO THE GATE', 'HOUSE AT THE FAR END. THE WORKERS IN', 'ORANGE ARE ON OUR SIDE: DO NOT HIT THEM.'],
      obj: ['CLEAR THE DAM WALKWAY', 'REACH THE GATE HOUSE', 'DO NOT HIT THE WORKERS'], par: 120, medal: [4200, 6400],
      sky: { top: 0x2a3a7a, hor: 0xf0a878, fog: 0xc8a090, near: 30, far: 190, sun: 0.8, amb: 0.8, dir: [0.4, 0.7, 0.8], hs: 0xffd8c0, hg: 0x5a5a6a, sunCol: 0xffd8b0 },
      build(B, X) {
        const L = 175, zc = -75;
        B.box('conc', 0, -1, zc, 9, 1, L, 0xd8d4c8, { ts: 3, flatTop: true });
        for (let z = 5; z > -160; z -= 6) B.box('plain', 0, 0.005, z, 0.25, 0.02, 3, 0xe8c040);
        for (const s of [-1, 1]) { B.box('conc', s * 4.65, -1, zc, 0.6, 2.1, L, 0xc8c4b8, { ts: 2 }); for (let z = 8; z > -165; z -= 7) B.box('conc', s * 4.65, 1.1, z, 0.75, 0.25, 0.75, 0xb8b4a8); }
        // the dam face on the right: a 90 metre drop, buttresses, a spillway; the valley floor far below
        B.box('conc', 7, -95, zc, 4, 94, L, 0xb8b4a8, { ts: 6 });
        for (let z = 5; z > -160; z -= 18) B.box('conc', 10, -95, z, 3, 94, 3, 0xa8a498, { ts: 6 });
        B.box('grass', 60, -96, zc, 120, 1, 400, 0x8aa070, { ts: 8 });
        // the reservoir on the left
        X.water(-150, -3.2, zc, 290, 400);
        B.box('conc', -5.2, -4, zc, 0.5, 3, L, 0x8a8a80, { ts: 2 });
        // lamps along the right
        for (let z = -6; z > -160; z -= 20) { B.cyl('metal', 4.2, 1.1, z, 0.08, 4.4, 0x5a5e62, 6); B.box('metal', 3.7, 5.4, z, 1.1, 0.12, 0.25, 0x5a5e62); B.box('glow', 3.3, 5.2, z, 0.5, 0.2, 0.3, 0xffe8a0); }
        // cover: crate stacks, barrels, a pillbox, a hut, a truck
        const crate = (x, z, n) => { for (let i = 0; i < n; i++) B.box('crate', x + (i % 2) * 0.1, i * 1.1, z, 1.1, 1.1, 1.1, 0xffffff, { ts: 1.1 }); };
        crate(-2.5, -18, 1); crate(-1.4, -18, 1); crate(2.8, -20, 1); crate(3.9, -20.2, 2); crate(-3, -70, 1); crate(-1.9, -70.2, 1); crate(-4, -71, 2); crate(2.6, -98, 1);
        for (const [x, z] of [[3, -62], [3.5, -63], [2.4, -63.2]]) B.cyl('metal', x, 0, z, 0.4, 1.0, 0xb02a1a, 8);
        B.box('conc', -2.6, 0, -55, 2.6, 0.9, 1.6, 0xa8a498); B.box('conc', -2.6, 0.9, -55, 2.8, 0.2, 1.8, 0x989488);
        // the hut (door faces you)
        B.wallX('brick', -4.3, -0.8, 0, -31, 3, 0.2, 0xffffff, [-2.5, 1.2, 2.2]); B.box('brick', -4.3, 0, -36, 0.2, 3, 5, 0xffffff); B.box('brick', -0.9, 0, -36, 0.2, 3, 5, 0xffffff);
        B.box('brick', -2.55, 0, -38.4, 3.6, 3, 0.2, 0xffffff); B.box('metal', -2.55, 3, -34.7, 4, 0.25, 7.6, 0x5a3a2a); B.box('plain', -2.5, 0, -31.2, 1.2, 2.2, 0.05, 0x1a1a1a);
        B.box('window', -1.2, 1.4, -30.88, 0.7, 0.6, 0.05, 0xffffff, { uv: 'own' });
        // two guard towers on the right edge
        for (const z of [-48, -112]) { for (const [a, b] of [[4.6, -1], [7.4, -1], [4.6, 1], [7.4, 1]]) B.box('metal', a, 0, z + b * 1.4, 0.2, 5, 0.2, 0x6a6e72); B.box('grate', 6, 5, z, 3.6, 0.2, 3.6, 0xffffff, { ts: 1 }); B.box('metal', 6, 6.1, z - 1.8, 3.6, 0.9, 0.08, 0x6a6e72); B.box('metal', 6, 8.2, z, 4, 0.2, 4, 0x4a4e52); for (const [a, b] of [[4.3, -1], [7.7, -1], [4.3, 1], [7.7, 1]]) B.box('metal', a, 5.2, z + b * 1.8, 0.1, 3, 0.1, 0x5a5e62); }
        // the truck
        B.box('plain', -1.6, 0.7, -100, 2.4, 1.2, 5.6, 0x4a5a32); B.box('plain', -1.6, 1.9, -101, 2.3, 1.7, 3.6, 0x5a6a3e, { lo: 0.8 }); B.box('plain', -1.6, 1.9, -97.8, 2.3, 1.5, 1.6, 0x4a5a32);
        B.box('window', -1.6, 2.5, -97.0, 2.0, 0.7, 0.05, 0xffffff, { uv: 'own' });
        for (const [x, z] of [[-2.85, -98], [-0.35, -98], [-2.85, -102], [-0.35, -102]]) B.cyl('plain', x, 0.33, z, 0.5, 0.35, 0x1a1a1a, 10, { rz: Math.PI / 2, ts: 1 });
        // the gate house at the end, with a door in the middle and a flat roof you can stand on
        B.wallX('brick', -4.4, 4.4, 0, -140, 4.4, 0.4, 0xffffff, [0, 2, 2.6]); B.box('brick', -4.4, 0, -145, 0.4, 4.4, 10, 0xffffff); B.box('brick', 4.4, 0, -145, 0.4, 4.4, 10, 0xffffff);
        B.box('conc', 0, 4.4, -145, 9.6, 0.3, 10.4, 0x9a968a); B.box('conc', 0, 4.7, -140.1, 9.6, 0.8, 0.3, 0x9a968a); B.box('plain', 0, 0, -140.3, 2, 2.6, 0.05, 0x1a1a1a);
        B.box('sign', 2.6, 2.6, -139.75, 1.6, 0.8, 0.05, 0xffffff, { uv: 'own' });
        // the radio mast behind it
        for (let y = 0; y < 30; y += 3) { B.box('metal', 0, 4.7 + y, -150, 0.12, 3, 0.12, 0xb02a1a); B.box('metal', 0, 4.7 + y + 1.5, -150, 1.6 - y * 0.04, 0.1, 0.1, 0xd8d8d8); }
        B.box('glow', 0, 35, -150, 0.5, 0.5, 0.5, 0xff3a2a);
        X.mount(300, 24, 60, 0x5a6a7a);
      },
      stops: [
        { p: [0, -5], yaw: 0, span: 32, walk: 0, spawns: [[0.8, 'g', -2, -19.4, 'pop'], [1.6, 'g', 2.8, -21.4, 'pop'], [3.2, 'g', -1.2, -27, 'run', { from: [-2.5, -35] }], [2.2, 'c', 3.2, -13, 'civ', { from: [-3.3, -13] }], [5, 'g', 0.5, -30, 'run', { from: [0.5, -50], d: 1 }], [6, 'ammo', 3.8, -12, '']] },
        { p: [0, -34], yaw: 0, span: 34, walk: 4.5, spawns: [[0.4, 'g', 6, -48, 'stand', { y: 5.2 }], [1.2, 'g', -2.6, -56.6, 'pop'], [2.2, 'g', -1, -46, 'run', { from: [-1, -62] }], [3, 'g', 1.5, -50, 'run', { from: [1.5, -64], d: 2 }], [1.8, 'c', -3.2, -40, 'cower']] },
        { p: [0, -56], yaw: 0, span: 34, walk: 3.5, spawns: [[0.5, 'g', 3, -64.5, 'pop'], [1.2, 'g', -3, -71.6, 'pop'], [2.4, 'g', -0.8, -76, 'run', { from: [-0.8, -92] }], [3.6, 'g', 1.2, -78, 'run', { from: [1.2, -95], d: 1 }], [2, 'c', 3.3, -61, 'civ', { from: [-3.3, -61] }], [4, 'armour', -3.6, -62, '']] },
        { p: [0, -92], yaw: 0, span: 36, walk: 5, spawns: [[0.5, 'g', 6, -112, 'stand', { y: 5.2 }], [1, 'g', 0.5, -104, 'peek', { dx: -2.1 }], [1.8, 'g', 2.6, -99.6, 'pop'], [3, 'g', 0.8, -108, 'run', { from: [0.8, -125] }], [4.2, 'g', -3.5, -104, 'peek', { dx: 1.9, d: 1 }]] },
        { p: [0, -125], yaw: 0, span: 34, walk: 5, spawns: [[0.5, 'g', -2.5, -139.6, 'stand', { y: 5.1 }], [1, 'g', 0, -137, 'run', { from: [0, -144] }], [1.5, 'g', 2.5, -139.6, 'stand', { y: 5.1 }], [3, 'g', -1.4, -134, 'run', { from: [0, -144] }], [4.5, 'g', 1.4, -133, 'run', { from: [0, -144], d: 1 }], [5.5, 'g', 0, -136, 'run', { from: [0, -144], d: 2, hp: 2 }]] },
      ] },
    // ---------------------------------------------------------------- 3. the bunker
    { id: 'bunker', n: 'THE BUNKER', place: 'UNDER A HILL, BEHIND A VERY THICK DOOR', kind: 'rail', music: 'sneak', guns: ['sil', 'pk9', 'kr'], style: 'guard', civ: 'sci',
      brief: ['WE NEED THE PLANS IN THE CONTROL ROOM.', 'GET IN, GET THROUGH THE STORE ROOM AND', 'OUT OF THE BLAST DOOR. THE SCIENTISTS', 'ARE HARMLESS. THE SILENCER KEEPS IT QUIET.'],
      obj: ['GET THROUGH THE CONTROL ROOM', 'CLEAR THE STORE ROOM', 'REACH THE BLAST DOOR'], par: 130, medal: [4400, 6600],
      sky: { top: 0x1a2a22, hor: 0x2a3a32, fog: 0x1e2a24, near: 8, far: 60, sun: 0.45, amb: 0.95, dir: [0.2, 1, 0.4], hs: 0xd8f0e0, hg: 0x2a2a24 },
      build(B, X) {
        const WALL = 0xffffff, H = 3.2;
        const room = (x0, x1, z0, z1, h, doorsF, doorsB) => { // a box room: floor, ceiling, side walls; front/back walls have doorways
          B.box('tile', (x0 + x1) / 2, -0.2, (z0 + z1) / 2, x1 - x0, 0.2, z0 - z1, 0xffffff, { ts: 2, flatTop: true });
          B.box('conc', (x0 + x1) / 2, h, (z0 + z1) / 2, x1 - x0, 0.3, z0 - z1, 0x9a9a92, { ts: 3 });
          B.box('panel', x0 - 0.15, 0, (z0 + z1) / 2, 0.3, h, z0 - z1, WALL, { ts: 3.2 }); B.box('panel', x1 + 0.15, 0, (z0 + z1) / 2, 0.3, h, z0 - z1, WALL, { ts: 3.2 });
          if (doorsF !== false) B.wallX('panel', x0 - 0.3, x1 + 0.3, 0, z0, h, 0.3, WALL, doorsF, { ts: 3.2 });
          if (doorsB !== false) B.wallX('panel', x0 - 0.3, x1 + 0.3, 0, z1, h, 0.3, WALL, doorsB, { ts: 3.2 });
          for (let z = z0 - 2.5; z > z1; z -= 5) B.box('glow', (x0 + x1) / 2, h - 0.08, z, Math.min(3, x1 - x0 - 1), 0.08, 0.4, 0xe8fff0);
          B.box('plain', x0 + 0.02, 0, (z0 + z1) / 2, 0.06, 0.25, z0 - z1, 0x2a2e2a); B.box('plain', x1 - 0.02, 0, (z0 + z1) / 2, 0.06, 0.25, z0 - z1, 0x2a2e2a);
        };
        room(-2, 2, 4, -20, H, false, false);
        B.wallX('panel', -2.3, 2.3, 0, 4.2, H, 0.3, WALL); // behind you
        B.wallZ('panel', -20, 4, 0, -2.15, H, 0.3, WALL, [-10, 1.2, 2.2]); // (a side door on the left)
        room(-5, -2.3, -8.6, -11.4, H, false, false); B.box('plain', -2.2, 0, -10, 0.05, 2.2, 1.2, 0x0e120e);
        room(-8, 8, -20, -38, 3.8, [0, 2.4, 2.6], [0, 2.4, 2.6]);
        // the control room: consoles round the walls, a desk in the middle, two pillars, a big map screen
        for (const [x, z, ry] of [[-7, -24, 0], [-7, -28, 0], [-7, -32, 0], [7, -24, 0], [7, -28, 0], [7, -32, 0]]) { B.box('metal', x, 0, z, 1.4, 1.1, 2.6, 0x8a9a8a, { ry }); B.box('screen', x + (x < 0 ? 0.3 : -0.3), 1.1, z, 0.2, 0.8, 2.2, 0xffffff, { uv: 'own', ry: x < 0 ? -Math.PI / 2 : Math.PI / 2 }); }
        B.box('metal', 0, 0, -30, 4, 1.05, 1.6, 0x7a8a7a); B.box('screen', 0, 1.05, -30.5, 3, 0.7, 0.1, 0xffffff, { uv: 'own' });
        for (const x of [-4, 4]) B.box('conc', x, 0, -27, 1.2, 3.8, 1.2, 0x9a9a92);
        B.box('screen', 0, 1.2, -37.8, 6, 2.2, 0.1, 0x9affb0, { uv: 'own' });
        room(-2, 2, -38, -58, H, false, false);
        B.wallZ('panel', -58, -38, 0, 2.15, H, 0.3, WALL, [-48, 1.2, 2.2]); B.wallZ('panel', -58, -38, 0, -2.15, H, 0.3, WALL);
        room(2.3, 5, -46.6, -49.4, H, false, false); B.box('plain', 2.2, 0, -48, 0.05, 2.2, 1.2, 0x0e120e);
        for (let z = -39; z > -58; z -= 2) B.box('metal', -1.6, 2.7, z, 0.25, 0.25, 2, 0xb0a070); // pipes
        B.cyl('metal', 1.5, 2.8, -48, 0.15, 0.1, 0xa02a1a, 8, { rx: Math.PI / 2 });
        room(-10, 10, -58, -84, 6, [0, 2.4, 2.6], [0, 2.4, 2.6]);
        // the store room: stacks of crates, a catwalk along the back with steps
        const st = (x, z, n, w) => { for (let i = 0; i < n; i++) B.box(i === n - 1 && w ? 'ammo' : 'crate', x, i * 1.2, z, 1.2, 1.2, 1.2, 0xffffff, { ts: 1.2 }); };
        st(-6, -64, 1); st(-7.3, -64, 3); st(-4.8, -64, 2); st(5.5, -66, 1); st(6.8, -66, 3, 1); st(4.3, -66.2, 1); st(-2.4, -70, 1); st(2.2, -73, 1); st(3.4, -73, 2); st(-6.5, -76, 1); st(-7.8, -76, 2); st(6.5, -77, 3);
        B.box('grate', 0, 3.5, -82.2, 19.6, 0.15, 3, 0xffffff, { ts: 1 }); B.box('metal', 0, 4.3, -80.75, 19.6, 0.08, 0.08, 0xc0a020); for (let x = -9; x <= 9; x += 2) B.box('metal', x, 3.6, -80.75, 0.08, 0.75, 0.08, 0xc0a020);
        for (const x of [-9, 9]) for (let i = 0; i < 6; i++) B.box('metal', x, i * 0.58, -78.5 - i * 0.5, 1.6, 0.12, 0.5, 0x7a7e82);
        room(-2, 2, -84, -100, H, false, false);
        B.wallZ('panel', -100, -84, 0, -2.15, H, 0.3, WALL); B.wallZ('panel', -100, -84, 0, 2.15, H, 0.3, WALL);
        // the blast door (open a crack), striped
        B.box('metal', -1.3, 0, -100, 1.6, H, 0.6, 0xd0b020); B.box('metal', 1.3, 0, -100, 1.6, H, 0.6, 0xd0b020);
        for (let y = 0.2; y < H; y += 0.6) for (const x of [-1.3, 1.3]) B.box('plain', x, y, -99.68, 1.6, 0.22, 0.05, 0x1a1a1a, { rz: 0.5 });
        B.box('glow', 0, 0, -104, 2, H, 0.1, 0xb8e0ff); room(-2, 2, -100, -106, H, false, false);
        // red warning lights
        for (const z of [-19.8, -37.8, -57.8, -83.8]) B.box('glow', 2.6, 2.6, z + (z < -50 ? -0.2 : 0.2), 0.3, 0.3, 0.1, 0xff3020);
      },
      stops: [
        { p: [0, 2], yaw: 0, span: 22, walk: 0, spawns: [[0.8, 'g', -1, -10, 'peek', { dx: -2.6 }], [2, 'g', 0.6, -19, 'run', { from: [0.6, -30] }], [1.4, 'c', 6, -33, 'civ', { from: [-6, -33] }], [3.6, 'g', -0.7, -18, 'run', { from: [-0.7, -30], d: 1 }]] },
        { p: [0, -17], yaw: 0, span: 40, walk: 4.5, spawns: [[0.5, 'g', -2.9, -28, 'peek', { dx: -1.1 }], [1.2, 'g', 5.3, -28.2, 'peek', { dx: -1.3 }], [1.8, 'g', 0, -31.6, 'pop'], [2.8, 'g', -6, -34, 'run', { from: [0, -40] }], [2.2, 'c', -6.4, -24.2, 'cower'], [4, 'g', 6, -34, 'run', { from: [0, -40], d: 1 }], [5, 'armour', 6.5, -29.6, '']] },
        { p: [0, -40], yaw: 0, span: 22, walk: 6, spawns: [[0.6, 'g', 1, -48, 'peek', { dx: 2.6 }], [1.5, 'g', -0.6, -55, 'run', { from: [-0.6, -64] }], [3, 'g', 0.8, -56, 'run', { from: [0.8, -66] }], [4, 'g', 1, -48, 'peek', { dx: 2.6, d: 1 }]] },
        { p: [0, -60], yaw: 0, span: 46, walk: 5, spawns: [[0.5, 'g', -6, -65.4, 'pop'], [1.2, 'g', 5.5, -67.4, 'pop'], [1.8, 'g', -3, -82, 'stand', { y: 3.65 }], [2.4, 'g', 3.5, -82, 'stand', { y: 3.65 }], [3.2, 'g', 2.2, -74.4, 'pop'], [3.8, 'c', 8, -71, 'civ', { from: [-8, -71] }], [4.5, 'g', -6.5, -77.4, 'pop', { d: 1 }], [5, 'g', 0, -80, 'run', { from: [0, -90], d: 2 }], [2, 'ammo', -2.4, -70, '']] },
        { p: [0, -86], yaw: 0, span: 22, walk: 5, spawns: [[0.5, 'g', -0.5, -97, 'run', { from: [-0.2, -104] }], [1.5, 'g', 0.6, -95, 'run', { from: [0.2, -104] }], [3, 'g', 0, -98, 'run', { from: [0, -104], hp: 2 }], [4, 'g', -0.6, -96, 'run', { from: [0, -104], d: 1 }]] },
      ] },
    // ---------------------------------------------------------------- 4. the armoured train
    { id: 'train', n: 'THE ARMOURED TRAIN', place: 'THE NIGHT MAIL, DOING 90', kind: 'rail', music: 'train', guns: ['pk9', 'kr', 'sil'], style: 'navy', civ: 'pass', train: true,
      brief: ['THE BAD GUYS HAVE HIJACKED THE TRAIN.', 'WORK YOUR WAY UP TO THE FRONT CARRIAGE', 'AND PULL THE BRAKE (SHOOT THE RED LEVER).', 'MIND THE PASSENGERS.'],
      obj: ['CLEAR FOUR CARRIAGES', 'SHOOT THE BRAKE LEVER', 'DO NOT HIT THE PASSENGERS'], par: 110, medal: [4000, 6200],
      sky: { top: 0x182a5a, hor: 0x8a7aa8, fog: 0x6a6a8a, near: 18, far: 120, sun: 0.55, amb: 0.85, dir: [0.5, 1, 0.2], hs: 0xe0e0ff, hg: 0x3a3028 },
      build(B, X) {
        // four carriages, each 18 m, along -z
        for (let c = 0; c < 4; c++) {
          const z0 = 10 - c * 19, z1 = z0 - 18, zc = (z0 + z1) / 2;
          B.box(c === 0 ? 'carpet' : 'wood', 0, -0.2, zc, 3.4, 0.2, 18, 0xffffff, { ts: 1.5, flatTop: true });
          B.box('metal', 0, 2.5, zc, 3.8, 0.3, 18, 0x4a4e5a, { ts: 3 });
          for (const s of [-1, 1]) {
            B.box('wood', s * 1.85, 0, zc, 0.2, 0.95, 18, 0x9a6a3a, { ts: 1.5 }); B.box('wood', s * 1.85, 1.95, zc, 0.2, 0.55, 18, 0x9a6a3a, { ts: 1.5 });
            for (let z = z0 - 1; z >= z1; z -= 2.5) B.box('wood', s * 1.85, 0.95, z, 0.2, 1, 0.35, 0x7a4a2a);
            B.box('metal', s * 2.0, -1.2, zc, 0.15, 3.75, 18, 0x3a4048, { ts: 3 });
          }
          B.box('metal', 0, -1.2, zc, 3.8, 1, 18, 0x2a2e34); for (const z of [z0 - 3, z1 + 3]) for (const s of [-1, 1]) B.cyl('plain', s * 1.4, -1.3, z, 0.45, 0.2, 0x1a1a1a, 10, { rz: Math.PI / 2 });
          B.wallX('wood', -1.95, 1.95, 0, z1, 2.5, 0.2, 0x8a5a32, [0, 1.1, 2.1]);
          if (c === 0) B.wallX('wood', -1.95, 1.95, 0, z0, 2.5, 0.2, 0x8a5a32);
          for (let z = z0 - 2; z > z1 + 1; z -= 4) B.box('glow', 0, 2.42, z, 0.6, 0.08, 0.4, 0xfff0c0);
          if (c === 0 || c === 2) for (let z = z0 - 2.5; z > z1 + 2; z -= 2.6) for (const s of [-1, 1]) { B.box('seat', s * 1.15, 0, z, 1.1, 0.5, 0.9, 0xffffff, { ts: 1 }); B.box('seat', s * 1.15, 0.5, z - 0.38, 1.1, 0.9, 0.15, 0xffffff, { ts: 1 }); }
          if (c === 1 || c === 3) { const stk = (x, z, n) => { for (let i = 0; i < n; i++) B.box(i === n - 1 && c === 1 && x > 0 ? 'ammo' : 'crate', x, i * 0.9, z, 0.9, 0.9, 0.9, 0xffffff, { ts: 0.9 }); }; stk(-1.2, zc + 4, 1); stk(1.2, zc + 1, 1); stk(-1.2, zc - 3, 1); stk(1.2, zc - 6, 2); }
          B.box('plain', 0, 0, z1 - 0.5, 1.2, 0.05, 1.2, 0x2a2a2a); // the gangway plate
        }
        // the brake lever at the front of carriage 4
        B.box('metal', 0, 0, -66.6, 1.2, 1, 0.4, 0x5a5a5a); X.lever(0, 1, -66.55);
        // the world outside, which rushes past: ground strip, trees, telegraph poles
        X.scenery();
        X.mount(320, 30, 50, 0x3a3a5a);
      },
      stops: [
        { p: [0, 8], yaw: 0, span: 18, walk: 0, spawns: [[0.6, 'g', 0.3, -6.5, 'run', { from: [0, -9.5] }], [1.4, 'c', -1.1, 2, 'cower'], [2.2, 'g', -0.6, -4, 'run', { from: [0, -9.5] }], [2.8, 'c', 1.1, -1.5, 'cower'], [3.6, 'g', 0.4, -5, 'run', { from: [0, -9.5], d: 1 }]] },
        { p: [0, -11], yaw: 0, span: 18, walk: 5, spawns: [[0.5, 'g', -1.2, -16.6, 'pop'], [1.3, 'g', 1.2, -19.6, 'pop'], [2.4, 'g', 0, -26, 'run', { from: [0, -28.5] }], [3.2, 'g', -1.2, -22.6, 'pop', { d: 1 }], [1, 'ammo', 1.2, -19, '']] },
        { p: [0, -30], yaw: 0, span: 18, walk: 5, spawns: [[0.5, 'g', 0.2, -42, 'run', { from: [0, -47.5] }], [1.2, 'c', 1.1, -33, 'cower'], [1.8, 'g', -0.5, -38, 'run', { from: [0, -47.5] }], [3, 'g', 0.6, -40, 'run', { from: [0, -47.5] }], [3.5, 'c', -1.1, -41, 'cower'], [4.4, 'g', 0, -44, 'run', { from: [0, -47.5], d: 2 }]] },
        { p: [0, -49], yaw: 0, span: 18, walk: 5, lever: true, spawns: [[0.5, 'g', -1.2, -54.6, 'pop'], [1.2, 'g', 1.2, -57.6, 'pop'], [2.4, 'g', -1.2, -60.6, 'pop'], [3.6, 'g', 0, -64, 'stand', { hp: 2 }], [4.2, 'g', 0.6, -63, 'stand', { d: 1 }]] },
      ] },
    // ---------------------------------------------------------------- 5. bomb defuse
    { id: 'bomb', n: 'BOMB DEFUSE', place: 'A WAREHOUSE BY THE DOCKS. TICK TOCK.', kind: 'rail', music: 'bomb', guns: ['sil', 'kr'], style: 'guard', civ: 'sci', bomb: true,
      brief: ['THEY HAVE PLANTED A BOMB IN THE WAREHOUSE', 'AND STARTED THE CLOCK. GET TO IT, THEN', 'SHOOT THE WIRE THAT MATCHES THE LIGHT,', 'THREE TIMES. THE WRONG WIRE COSTS TIME!'],
      obj: ['REACH THE BOMB BEFORE 0:00', 'CUT THE RIGHT WIRES', 'DO NOT HIT THE SCIENTISTS'], par: 0, medal: [4200, 6400],
      sky: { top: 0x0a0a18, hor: 0x1a1a2a, fog: 0x14141e, near: 10, far: 75, sun: 0.4, amb: 0.9, dir: [0.3, 1, 0.5], hs: 0xc8c8ff, hg: 0x2a2020 },
      build(B, X) {
        B.box('conc', 0, -0.3, -35, 30, 0.3, 78, 0xa8a8a0, { ts: 3, flatTop: true });
        B.box('metal', 0, 9, -35, 30, 0.4, 78, 0x4a4a52, { ts: 4 });
        for (const s of [-1, 1]) B.box('metal', s * 15.2, 0, -35, 0.4, 9, 78, 0x8a8a92, { ts: 4 });
        B.box('metal', 0, 0, 4.2, 30, 9, 0.4, 0x8a8a92, { ts: 4 });
        for (let z = 0; z > -70; z -= 7) for (const s of [-1, 1]) B.box('metal', s * 14.8, 0, z, 0.5, 9, 0.5, 0x5a5a62);
        for (let z = -2; z > -70; z -= 7) B.box('metal', 0, 8.6, z, 29, 0.4, 0.4, 0x5a5a62);
        // shipping containers
        const box = (x, z, col, rot, up) => { B.box('metal', x, up ? 2.6 : 0, z, rot ? 6 : 2.5, 2.6, rot ? 2.5 : 6, col, { ts: 1.3, jit: 0.08 }); };
        box(-10, -10, 0x2a6aa8); box(-10, -10, 0xb84a2a, false, true); box(10, -14, 0x3a8a3a); box(-4, -16, 0xb8a02a, true); box(8, -30, 0x8a2a2a, true); box(-9, -34, 0x2a6aa8); box(-9, -34, 0x6a6a6a, false, true); box(3, -38, 0x3a8a3a);
        box(10, -46, 0xb84a2a); box(-6, -48, 0x8a2a2a, true);
        // catwalks down both sides
        for (const s of [-1, 1]) { B.box('grate', s * 13.2, 4, -32, 3, 0.15, 62, 0xffffff, { ts: 1 }); B.box('metal', s * 11.75, 4.9, -32, 0.08, 0.08, 62, 0xd0b020); for (let z = 0; z > -64; z -= 3) B.box('metal', s * 11.75, 4.1, z, 0.08, 0.8, 0.08, 0xd0b020); }
        // the bomb room at the end: a wall with a doorway, a table, the bomb (its wires are separate so they can be cut)
        B.wallX('metal', -15, 15, 0, -58, 9, 0.4, 0x7a7a82, [0, 3, 3.2]);
        B.box('wood', 0, 0, -65, 2.4, 0.9, 1.4, 0x7a5030); X.bomb(0, 0.9, -65);
        // pallets and barrels
        for (const [x, z] of [[4, -6], [-13, -22], [13, -36], [-3, -52], [12, -54]]) { B.box('wood', x, 0, z, 1.4, 0.15, 1.4, 0x9a7a4a); B.cyl('metal', x - 0.3, 0.15, z, 0.35, 1, 0x3a5a9a, 8); B.cyl('metal', x + 0.35, 0.15, z + 0.2, 0.35, 1, 0x3a5a9a, 8); }
        // lights
        for (let z = -4; z > -60; z -= 10) { B.box('glow', -6, 8.5, z, 0.8, 0.12, 2, 0xfff0d0); B.box('glow', 6, 8.5, z, 0.8, 0.12, 2, 0xfff0d0); }
        X.beacon(-14.6, 6, -20); X.beacon(14.6, 6, -40); X.beacon(0, 7.6, -57.7);
      },
      stops: [
        { p: [0, 1], yaw: 0, span: 40, walk: 0, spawns: [[0.6, 'g', -4, -17.6, 'peek', { dx: -3.4 }], [1.4, 'g', 7.9, -17.6, 'peek', { dx: 2.1 }], [2, 'g', -12.5, -24, 'stand', { y: 4.1 }], [3, 'g', 2, -22, 'run', { from: [2, -36] }], [2.4, 'c', 6, -8, 'civ', { from: [-2, -8] }], [4, 'g', 12.5, -26, 'stand', { y: 4.1, d: 1 }], [2, 'ammo', 3.8, -5.6, '']] },
        { p: [0, -20], yaw: 0, span: 40, walk: 4.5, spawns: [[0.5, 'g', 5.4, -30.4, 'peek', { dx: 3.4 }], [1.2, 'g', -7.0, -37.6, 'peek', { dx: -2.1 }], [2, 'g', 12.5, -40, 'stand', { y: 4.1 }], [2.8, 'g', 5.0, -41.6, 'peek', { dx: -2 }], [3.6, 'g', -1, -44, 'run', { from: [-1, -56] }], [4.5, 'g', -12.5, -42, 'stand', { y: 4.1, d: 1 }]] },
        { p: [0, -40], yaw: 0, span: 40, walk: 4.5, spawns: [[0.5, 'g', 7.9, -50, 'peek', { dx: 2.1 }], [1, 'g', -2.4, -50.4, 'peek', { dx: -3.6 }], [2, 'g', -3, -53, 'pop'], [2.6, 'c', 6, -54, 'civ', { from: [-6, -55] }], [3.4, 'g', 0, -57, 'run', { from: [0, -63] }], [4.2, 'g', 12, -54.6, 'pop', { d: 1 }], [3, 'armour', 2.8, -45, '']] },
        { p: [0, -56], yaw: 0, span: 30, walk: 3.5, bombStop: true, spawns: [[0.4, 'g', -2.2, -64, 'run', { from: [-5, -68] }], [1, 'g', 2.4, -63, 'run', { from: [5, -68] }], [2.4, 'g', 0, -67.5, 'stand', { d: 1 }]] },
      ] },
    // ---------------------------------------------------------------- 6. sniper ridge
    { id: 'ridge', n: 'SNIPER RIDGE', place: 'A FROZEN BASE, A LONG WAY DOWN', kind: 'sniper', music: 'sneak', guns: ['sr', 'sil'], style: 'snow', civ: 'parka',
      brief: ['THE BASE IN THE VALLEY IS FULL OF LOOKOUTS.', 'TAKE THEM OUT FROM UP HERE WITH THE SR-7', '(HOLD R TO ZOOM). OUR MAN IN THE RED', 'PARKA IS DOWN THERE TOO. DO NOT HIT HIM.'],
      obj: ['TAKE OUT THE LOOKOUTS', 'BEFORE THE CLOCK RUNS OUT', 'MISSES MAKE A NOISE: THEY MIGHT HEAR YOU'], par: 0, medal: [3800, 6000],
      sky: { top: 0x6a8ab8, hor: 0xdde6f0, fog: 0xd8e2ec, near: 50, far: 230, sun: 0.7, amb: 0.85, dir: [0.4, 1, 0.3], hs: 0xffffff, hg: 0x8a9aaa },
      build(B, X) {
        B.box('snow', 0, -1, -80, 400, 1, 400, 0xffffff, { ts: 6, flatTop: true });
        // the ridge you lie on: rocks in the foreground
        B.box('rock', 0, 0, 10, 30, 6.2, 14, 0xd8dce4, { ts: 3 }); B.box('snow', 0, 6.2, 11, 30, 0.3, 12, 0xffffff, { ts: 3 });
        for (const [x, z, s] of [[-5, 3, 2.6], [5, 3.4, 2], [-12, 4, 3.5], [12, 4, 3], [0, 3.2, 1.2]]) B.ball('rock', x, 5.6, z, s, 0xc8ccd4, 7, { lo: 0.7 });
        // the base: huts, a tower, fuel tanks, a radar dish, fences, roads
        B.box('dirt', 0, -0.98, -80, 6, 1, 120, 0xd0c0b0, { ts: 4, flatTop: true }); B.box('dirt', 0, -0.97, -90, 90, 1, 6, 0xd0c0b0, { ts: 4, flatTop: true });
        const hut = (x, z, w, d, ry) => { B.box('metal', x, 0, z, w, 3, d, 0x7a8a6a, { ry, ts: 2 }); B.box('snow', x, 3, z, w + 0.6, 0.5, d + 0.6, 0xffffff, { ry }); B.box('plain', x, 0, z + (d / 2 + 0.02) * Math.cos(ry || 0), 1.2, 2.2, 0.05, 0x2a2a2a, { ry }); };
        hut(-20, -60, 14, 6); hut(22, -62, 12, 6); hut(-26, -100, 10, 8); hut(24, -104, 14, 7);
        B.box('conc', 0, 0, -122, 6, 14, 6, 0xb8bcc4); B.box('window', 0, 10, -118.95, 5, 2.4, 0.1, 0xffffff, { uv: 'own' }); B.box('snow', 0, 14, -122, 6.8, 0.6, 6.8, 0xffffff);
        for (const x of [-12, -7]) { B.cyl('metal', x, 0, -130, 2.2, 5, 0xc8c8c0, 12); B.ball('metal', x, 5, -130, 2.2, 0xc8c8c0, 10); }
        B.cyl('metal', 14, 0, -135, 0.3, 8, 0x8a8a8a, 6); B.cone('metal', 14, 7.5, -135, 4, 2, 0xd8d8d8, 12, { rx: -0.7 });
        for (let x = -45; x <= 45; x += 3) B.box('plain', x, 0, -40, 0.12, 1.6, 0.12, 0x5a4a3a); B.box('plain', 0, 1.2, -40, 90, 0.05, 0.05, 0x3a3a3a); B.box('plain', 0, 0.6, -40, 90, 0.05, 0.05, 0x3a3a3a);
        // watch towers
        for (const [x, z] of [[-34, -70], [34, -78], [-14, -96], [16, -116]]) { for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box('wood', x + a * 1.3, 0, z + b * 1.3, 0.25, 6, 0.25, 0x6a4a2a); B.box('wood', x, 6, z, 3.4, 0.25, 3.4, 0x7a5a3a); B.box('wood', x, 6.25, z + 1.6, 3.4, 0.9, 0.1, 0x6a4a2a); B.box('snow', x, 8.6, z, 3.8, 0.4, 3.8, 0xffffff); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box('wood', x + a * 1.6, 6.2, z + b * 1.6, 0.12, 2.4, 0.12, 0x5a3a1a); }
        // trucks
        B.box('plain', 4, 0.4, -72, 2.2, 1.4, 5, 0x4a5a3a); B.box('snow', 4, 1.8, -72, 2.2, 0.2, 5, 0xffffff); B.box('plain', -4, 0.4, -110, 2.2, 1.4, 5, 0x4a5a3a);
        const r = X.rnd; for (let i = 0; i < 46; i++) { const x = (r() * 2 - 1) * 110, z = -30 - r() * 160; if (Math.abs(x) < 50 && z > -140 && z < -35) continue; B.tree(x, z, 7 + r() * 7, 0xe0f0ff); }
        X.mount(330, 70, 110, 0xe8eef8, 'snow');
      },
      stops: [
        { p: [0, 6], y: 7.6, yaw: 0, span: 56, pitchLo: -18, walk: 0, spawns: [
          [0.5, 'g', -20, -55, 'patrol', { to: [-8, -55] }], [0.5, 'g', 22, -57, 'patrol', { to: [10, -57] }], [0.5, 'g', -34, -70, 'stand', { y: 6.3 }], [0.5, 'g', 34, -78, 'stand', { y: 6.3 }],
          [1, 'g', 2, -80, 'patrol', { to: [2, -60] }], [1, 'g', -14, -96, 'stand', { y: 6.3 }], [1.5, 'g', 16, -116, 'stand', { y: 6.3 }], [2, 'g', -20, -90, 'patrol', { to: [20, -90] }],
          [2, 'g', -2, -126, 'patrol', { to: [-2, -100] }], [2.5, 'g', 24, -96, 'patrol', { to: [24, -82] }], [3, 'g', -26, -94, 'patrol', { to: [-36, -94] }], [3, 'g', 0, -118.5, 'stand', { y: 10 }],
          [3, 'g', 10, -128, 'patrol', { to: [-4, -128] }], [3.5, 'g', -10, -76, 'patrol', { to: [-10, -64] }], [4, 'c', 6, -64, 'patrol', { to: [6, -100] }]] },
      ] },
    // ---------------------------------------------------------------- 7. statue park (the last one)
    { id: 'park', n: 'STATUE PARK', place: 'THE BIG FINISH, AFTER DARK', kind: 'rail', music: 'boss', guns: ['pk9', 'kr', 'sil'], style: 'soldier', civ: 'worker', boss: true,
      brief: ['IT WAS DOCTOR KLAXON ALL ALONG.', 'HE IS HIDING AMONG THE OLD STATUES WITH', 'THE LAST OF HIS HENCHMEN. FIND HIM AND', 'STOP HIM. THEN WE CAN ALL GO HOME FOR TEA.'],
      obj: ['GET INTO THE PARK', 'STOP DOCTOR KLAXON', 'TEA'], par: 140, medal: [5200, 7800],
      sky: { top: 0x0a1028, hor: 0x2a3a5a, fog: 0x1a2236, near: 14, far: 110, sun: 0.4, amb: 0.85, dir: [-0.4, 1, 0.6], hs: 0xb8c8ff, hg: 0x1a2a1a },
      build(B, X) {
        B.box('grass', 0, -1, -40, 220, 1, 220, 0x9aa0b0, { ts: 4, flatTop: true });
        B.box('dirt', 0, -0.98, -30, 5, 1, 70, 0xb0a0a0, { ts: 3, flatTop: true }); B.box('dirt', 0, -0.97, -40, 36, 1, 30, 0xb0a0a0, { ts: 3, flatTop: true });
        // a giant fallen head
        B.box('statue', -9, 0, -30, 6, 5, 5, 0xffffff, { ry: 0.5, ts: 2.5 }); B.box('statue', -9, 0, -30, 6.4, 1.4, 5.4, 0xc8d0c0, { ry: 0.5 });
        B.box('statue', -7.6, 2.4, -27.9, 1.2, 0.6, 0.6, 0x5a6a5a, { ry: 0.5 }); B.box('statue', -10.1, 2.4, -27.6, 1.2, 0.6, 0.6, 0x5a6a5a, { ry: 0.5 }); B.box('statue', -8.6, 1.2, -27.4, 1.8, 0.5, 0.6, 0x4a5a4a, { ry: 0.5 });
        // a giant hand reaching up
        B.box('statue', 10, 0, -34, 2.6, 6, 2.6, 0xffffff, { ts: 2.5 }); B.box('statue', 10, 6, -34, 3.6, 2.4, 2, 0xffffff); for (let i = 0; i < 4; i++) B.box('statue', 8.8 + i * 0.8, 8.4, -34, 0.6, 2 + (i === 1 || i === 2 ? 0.6 : 0), 0.7, 0xffffff); B.box('statue', 12.3, 6.8, -34, 0.6, 1.6, 0.7, 0xffffff, { rz: -0.6 });
        // plinths with stern statues on top
        const statue = (x, z, ry) => { B.box('conc', x, 0, z, 3, 2.4, 3, 0x8a8a90, { ts: 2 }); B.box('statue', x, 2.4, z, 1.4, 3, 0.9, 0xffffff, { ry }); B.box('statue', x, 5.4, z, 0.9, 1, 0.9, 0xffffff, { ry }); B.box('statue', x - 0.9, 3.6, z, 0.45, 1.8, 0.5, 0xffffff, { ry, rz: 0.15 }); B.box('statue', x + 0.9, 4.6, z, 0.45, 2, 0.5, 0xffffff, { ry, rz: -2.6 }); };
        statue(-4, -44, 0.2); statue(5, -48, -0.3); statue(-14, -50, 0.4); statue(15, -52, -0.2); statue(0, -60, 0);
        // a broken ring of columns
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, x = Math.cos(a) * 16, z = -42 + Math.sin(a) * 16; if (z > -30) continue; B.cyl('conc', x, 0, z, 0.6, 3 + (i % 3) * 1.5, 0xa8a8ae, 8); }
        // lamps and benches
        for (const [x, z] of [[-3, -8], [3, -16], [-3, -24], [3, -32], [-16, -38], [16, -40]]) { B.cyl('metal', x, 0, z, 0.08, 3.6, 0x2a2a2a, 6); B.box('glow', x, 3.6, z, 0.45, 0.5, 0.45, 0xfff0b0); }
        for (const [x, z] of [[-3.2, -12], [3.2, -20]]) { B.box('wood', x, 0.45, z, 0.6, 0.1, 2, 0x7a5030); B.box('wood', x + Math.sign(x) * 0.3, 0.55, z, 0.08, 0.6, 2, 0x7a5030); }
        // hedges round the edge
        for (let x = -30; x <= 30; x += 3) B.box('plain', x, 0, -72, 3, 2.4, 2, 0x1e3a1e, { jit: 0.2 });
        for (let z = 6; z > -72; z -= 3) for (const s of [-1, 1]) B.box('plain', s * 30, 0, z, 2, 2.4, 3, 0x1e3a1e, { jit: 0.2 });
        const r = X.rnd; for (let i = 0; i < 30; i++) { const s = i % 2 ? 1 : -1; B.tree(s * (20 + r() * 40), 10 - r() * 100, 8 + r() * 6, 0x8090a0); }
        X.mount(280, 20, 40, 0x1a2a3a);
      },
      stops: [
        { p: [0, 6], yaw: 0, span: 36, walk: 0, spawns: [[0.6, 'g', -7, -27, 'peek', { dx: -2.6 }], [1.4, 'g', 9.8, -32.4, 'peek', { dx: 2.2 }], [2.2, 'g', -1, -22, 'run', { from: [-1, -40] }], [3.2, 'g', 2.2, -20, 'run', { from: [2, -40] }], [4.2, 'g', 0, -24, 'run', { from: [0, -42], d: 1 }], [2, 'ammo', -3.4, -11.2, '']] },
        { p: [0, -22], yaw: 0, span: 46, walk: 6, boss: true, spawns: [[0.5, 'boss', -4, -42, '', { pts: [[-4, -42], [5, -46], [-13.5, -48], [0, -58], [14.5, -50]] }], [2, 'g', 7.1, -48, 'peek', { dx: -2.1 }], [3, 'g', -11.9, -50, 'peek', { dx: -2.1 }], [4, 'armour', 3.2, -28, '']] },
      ] },
  ];

  // ================================================================ the cartridge
  TV.game(GID, {
    three: true, stick: true, buttons: ['a', 'b', 'l', 'r'],
    help: 'Aim: arrows or the mouse. Fire: Z or click. Reload: X. Aim / zoom: hold E. Swap gun: Q. Pause: Enter.',
    make(K) {
      const T3 = K.three({ fogCol: 0xc8a090, fogNear: 30, fogFar: 190, fov: 60, far: 700 }), T = T3.T, cam = T3.cam, ren = T3.ren, scene = T3.scene, hud = K.hud, F = K.font, W = K.W, H = K.H;
      const TX = paintTextures(T3, prng(64));
      const M8 = (o) => T3.mat(Object.assign({ vcol: true }, o));
      const leafM = M8({ map: TX.leaf, side: T.DoubleSide }); leafM.alphaTest = 0.5;
      const waterTex = TX.water;
      const MAT = {
        conc: M8({ map: TX.conc }), metal: M8({ map: TX.metal }), grate: M8({ map: TX.grate }), crate: M8({ map: TX.crate }), ammo: M8({ map: TX.ammo }), brick: M8({ map: TX.brick }),
        grass: M8({ map: TX.grass }), dirt: M8({ map: TX.dirt }), snow: M8({ map: TX.snow }), rock: M8({ map: TX.rock }), water: M8({ map: waterTex }), wood: M8({ map: TX.wood }),
        panel: M8({ map: TX.panel }), tile: M8({ map: TX.tile }), carpet: M8({ map: TX.carpet }), leaf: leafM, sign: M8({ map: TX.sign }), window: M8({ map: TX.window, lit: false }),
        screen: M8({ map: TX.screen, lit: false }), seat: M8({ map: TX.seat }), statue: M8({ map: TX.statue }), plain: M8({}), glow: M8({ lit: false }),
        mount: M8({ fog: false, flat: true }),
      };
      const crowdMat = M8({ emissive: 0x262626 });
      const crowd = Crowd(T, crowdMat, 12); scene.add(crowd.mesh);
      const lit = T3.lights({ amb: 0.8, sun: 0.7 });
      const flashL = new T.PointLight(0xffd080, 0, 14); scene.add(flashL);

      // ---------------------------------------------------------------- the save (the old {best:[a,b,c]} still loads)
      const SV = (() => { let s = null; try { s = K.load(); } catch (e) {} if (!s || typeof s !== 'object') s = {};
        s.best = Array.isArray(s.best) ? s.best : [0, 0, 0]; s.m = (s.m && typeof s.m === 'object') ? s.m : {}; s.open = Math.max(1, Math.min(MISSIONS.length, s.open | 0));
        if ((s.best[0] | 0) + (s.best[1] | 0) + (s.best[2] | 0) > 0) s.open = Math.max(s.open, 2); // (played the old range: the dam is open)
        s.ch = (s.ch && typeof s.ch === 'object') ? s.ch : {}; s.got = (s.got && typeof s.got === 'object') ? s.got : {};
        s.opt = Object.assign({ music: 1, aim: 1, assist: 1, shake: 1 }, s.opt || {}); s.top = Array.isArray(s.top) ? s.top : []; return s; })();
      const save = () => { try { K.save(SV); } catch (e) {} };
      const MS = id => SV.m[id] || (SV.m[id] = { s: [0, 0, 0], md: [0, 0, 0], ok: [0, 0, 0] });
      const cheat = id => !!(SV.ch[id] && SV.got[id]);

      // ---------------------------------------------------------------- sound
      const S = K.sfx;
      const snd = {
        pk9() { S.noise(0.16, 0.32, 2200, 0, 'lowpass', 300); S.tone(150, 0.1, 'square', 0.1, 0, 60); },
        sil() { S.noise(0.07, 0.14, 1400, 0, 'bandpass', 500); S.tone(320, 0.04, 'triangle', 0.05, 0, 140); },
        kr() { S.noise(0.09, 0.26, 2600, 0, 'lowpass', 500); S.tone(120, 0.06, 'square', 0.08, 0, 70); },
        sr() { S.noise(0.5, 0.4, 3000, 0, 'lowpass', 120); S.tone(90, 0.3, 'sawtooth', 0.1, 0, 35); S.noise(0.6, 0.06, 900, 0.18, 'lowpass', 200); },
        empty() { S.tone(1500, 0.02, 'square', 0.06); },
        reload() { S.tone(300, 0.05, 'square', 0.07, 0.25); S.noise(0.04, 0.1, 3000, 0.3, 'highpass'); S.tone(520, 0.05, 'square', 0.07, 0.8); },
        swap() { S.tone(600, 0.04, 'square', 0.05); S.tone(800, 0.04, 'square', 0.05, 0.06); },
        hit() { S.tone(420, 0.12, 'square', 0.08, 0.02, 160); },
        head() { S.tone(1320, 0.06, 'square', 0.08, 0.02); S.tone(1760, 0.08, 'square', 0.07, 0.08); },
        hat() { S.tone(900, 0.2, 'triangle', 0.08, 0.02, 1800); },
        civ() { S.tone(330, 0.18, 'sawtooth', 0.09); S.tone(262, 0.3, 'sawtooth', 0.09, 0.18); },
        thud() { S.noise(0.2, 0.14, 500, 0, 'lowpass', 80); },
        enemy(d) { const v = clamp(0.18 - d * 0.003, 0.03, 0.18); S.noise(0.14, v, 1600, 0, 'lowpass', 300); },
        hurt() { S.tone(200, 0.2, 'sawtooth', 0.12, 0, 90); S.noise(0.15, 0.12, 800); },
        ric() { S.tone(2400 + Math.random() * 1500, 0.12, 'sine', 0.03, 0.03, 900); },
        move() { S.tone(700, 0.03, 'square', 0.05); }, ok() { S.tone(880, 0.05, 'square', 0.06); S.tone(1320, 0.07, 'square', 0.06, 0.05); }, back() { S.tone(500, 0.05, 'square', 0.05, 0, 300); },
        no() { S.tone(160, 0.15, 'square', 0.07); },
        card() { S.noise(0.08, 0.06, 700); },
        pick() { S.seq([[76, 0.25], [83, 0.25]], { bpm: 480, vol: 0.08 }); },
        win() { S.seq([[67, 0.5], [72, 0.5], [76, 0.5], [79, 1], [76, 0.5], [79, 2]], { bpm: 220, vol: 0.09 }); },
        fail() { S.seq([[64, 1], [63, 1], [62, 1], [61, 3]], { bpm: 180, vol: 0.09, wave: 'triangle' }); },
        medal() { S.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 1]], { bpm: 360, vol: 0.09 }); },
        beep() { S.tone(1760, 0.05, 'square', 0.05); },
        boom() { S.noise(1.4, 0.45, 900, 0, 'lowpass', 40); S.tone(60, 1, 'sawtooth', 0.14, 0, 25); },
        alarm() { S.tone(660, 0.25, 'square', 0.06, 0, 880); S.tone(880, 0.25, 'square', 0.06, 0.25, 660); },
        brake() { S.noise(2.2, 0.16, 4000, 0, 'bandpass', 1500); },
      };
      let song = null;
      const music = name => { song = name; K.music(name && SV.opt.music ? SONGS[name] : null); };

      // ---------------------------------------------------------------- the sky dome, particles, bullet holes
      const skyG = new T.SphereGeometry(450, 16, 12), skyCol = new Float32Array(skyG.attributes.position.count * 3); skyG.setAttribute('color', new T.BufferAttribute(skyCol, 3));
      const skyM = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false });
      const sky = new T.Mesh(skyG, skyM); sky.renderOrder = -10; scene.add(sky);
      function paintSky(top, hor) {
        const P = skyG.attributes.position, A = hexRGB(top), B2 = hexRGB(hor);
        for (let i = 0; i < P.count; i++) { const y = P.getY(i) / 450, k = y > 0 ? Math.pow(y, 0.55) : 0; const kk = y < 0 ? 0.75 : 1; for (let c = 0; c < 3; c++) skyCol[i * 3 + c] = lerp(B2[c], A[c], k) * kk; }
        skyG.attributes.color.needsUpdate = true;
      }
      const NP = 220, pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3), pV = new Float32Array(NP * 3), pL = new Float32Array(NP); let pN = 0;
      const pG = new T.BufferGeometry(); pG.setAttribute('position', new T.BufferAttribute(pPos, 3)); pG.setAttribute('color', new T.BufferAttribute(pCol, 3)); pG.boundingSphere = new T.Sphere(new T.Vector3(), 1e6);
      const pM = new T.PointsMaterial({ size: 0.16, vertexColors: true, sizeAttenuation: true });
      const parts = new T.Points(pG, pM); parts.frustumCulled = false; scene.add(parts);
      for (let i = 0; i < NP; i++) pPos[i * 3 + 1] = -9999;
      function puff(x, y, z, col, n, sp, up, life) { const [r, g, b] = hexRGB(col); for (let k = 0; k < n; k++) { const i = pN = (pN + 1) % NP; pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pV[i * 3] = (Math.random() - 0.5) * sp; pV[i * 3 + 1] = Math.random() * sp * 0.6 + (up || 0); pV[i * 3 + 2] = (Math.random() - 0.5) * sp; const v = 0.8 + Math.random() * 0.3; pCol[i * 3] = r * v; pCol[i * 3 + 1] = g * v; pCol[i * 3 + 2] = b * v; pL[i] = (life || 0.6) * (0.6 + Math.random() * 0.6); } }
      function stepParts(dt) { for (let i = 0; i < NP; i++) { if (pL[i] <= 0) continue; pL[i] -= dt; if (pL[i] <= 0) { pPos[i * 3 + 1] = -9999; continue; } pV[i * 3 + 1] -= 9 * dt; pPos[i * 3] += pV[i * 3] * dt; pPos[i * 3 + 1] += pV[i * 3 + 1] * dt; pPos[i * 3 + 2] += pV[i * 3 + 2] * dt; } pG.attributes.position.needsUpdate = true; pG.attributes.color.needsUpdate = true; }
      const NH = 90, hPos = new Float32Array(NH * 3), hCol = new Float32Array(NH * 3); let hN = 0; for (let i = 0; i < NH; i++) hPos[i * 3 + 1] = -9999;
      const hG = new T.BufferGeometry(); hG.setAttribute('position', new T.BufferAttribute(hPos, 3)); hG.setAttribute('color', new T.BufferAttribute(hCol, 3)); hG.boundingSphere = new T.Sphere(new T.Vector3(), 1e6);
      const hM = new T.PointsMaterial({ size: 0.09, vertexColors: true, sizeAttenuation: true });
      const holes = new T.Points(hG, hM); holes.frustumCulled = false; scene.add(holes);
      const PAINT = [0xff2a8a, 0xffd200, 0x1ad0ff, 0x5aff3a, 0xff7a1a, 0xb05aff];
      function hole(p, n, col) { const i = hN = (hN + 1) % NH; hPos[i * 3] = p.x + n.x * 0.02; hPos[i * 3 + 1] = p.y + n.y * 0.02; hPos[i * 3 + 2] = p.z + n.z * 0.02; const [r, g, b] = hexRGB(col); hCol[i * 3] = r; hCol[i * 3 + 1] = g; hCol[i * 3 + 2] = b; hG.attributes.position.needsUpdate = true; hG.attributes.color.needsUpdate = true; }
      function clearHoles() { for (let i = 0; i < NH; i++) hPos[i * 3 + 1] = -9999; hG.attributes.position.needsUpdate = true; for (let i = 0; i < NP; i++) { pL[i] = 0; pPos[i * 3 + 1] = -9999; } }

      // ---------------------------------------------------------------- the gun in your hand (its own little scene, drawn on top)
      const gunScene = new T.Scene(), gunCam = new T.PerspectiveCamera(50, W / H, 0.05, 10);
      gunScene.add(new T.HemisphereLight(0xffffff, 0x505060, 1.0)); const gunSun = new T.DirectionalLight(0xffffff, 0.9); gunSun.position.set(-0.4, 1, 0.6); gunScene.add(gunSun);
      const gunMat = M8({ fog: false }), flashMat = T3.mat({ color: 0xffe080, lit: false, fog: false, transparent: true, opacity: 0.95 });
      function gunGeo(id) {
        const B = Builder(T), gold = cheat('gold'), c = gold ? 0xd8a820 : GUNS[id].col, c2 = gold ? 0xf0c840 : 0x4a4a52, wood = gold ? 0xc89a20 : 0x6a4426;
        const glove = 0x1e1e22, cuff = 0x2a3550;
        if (id === 'pk9' || id === 'sil') {
          B.box('g', 0, -0.035, -0.12, 0.05, 0.06, 0.26, c, { lo: 0.6 }); B.box('g', 0, 0.025, -0.12, 0.045, 0.012, 0.25, c2);
          for (let i = 0; i < 5; i++) B.box('g', 0, -0.005, -0.02 + i * 0.012, 0.052, 0.035, 0.004, 0x101014); B.box('g', 0, 0.03, -0.235, 0.012, 0.014, 0.012, 0x101010); B.box('g', 0, 0.03, -0.01, 0.03, 0.014, 0.012, 0x101010);
          B.box('g', 0, -0.075, -0.1, 0.012, 0.02, 0.07, 0x1a1a1e); B.box('g', 0, -0.06, -0.27, 0.03, 0.03, 0.02, 0x0a0a0a);
          B.box('g', 0, -0.13, -0.03, 0.045, 0.11, 0.06, wood, { rx: 0.25 }); B.box('g', 0, -0.07, -0.08, 0.012, 0.035, 0.05, c);
          if (id === 'sil') B.cyl('g', 0, -0.11, -0.33, 0.026, 0.2, 0x1a1a1e, 10, { rx: Math.PI / 2 });
          B.box('g', 0, -0.15, -0.035, 0.068, 0.1, 0.085, glove); B.box('g', 0.035, -0.085, -0.075, 0.018, 0.03, 0.08, glove); B.box('g', -0.01, -0.1, -0.12, 0.05, 0.022, 0.035, glove);
          B.box('g', 0, -0.2, 0.06, 0.085, 0.09, 0.2, cuff, { rx: 0.35 }); B.box('g', 0, -0.17, 0.0, 0.075, 0.02, 0.06, 0xd8d8d8, { rx: 0.35 });
        } else if (id === 'kr') {
          B.box('g', 0, -0.03, -0.18, 0.06, 0.08, 0.5, c); B.box('g', 0, 0.02, -0.5, 0.025, 0.025, 0.24, 0x1a1a1a); B.box('g', 0, -0.13, -0.24, 0.04, 0.12, 0.06, 0x1a1a1a, { rx: -0.2 }); B.box('g', 0, -0.2, -0.27, 0.04, 0.09, 0.06, 0x1a1a1a, { rx: -0.55 }); B.box('g', 0, 0.05, -0.2, 0.016, 0.03, 0.16, 0x2a2a2a); B.box('g', 0, 0.01, -0.64, 0.035, 0.035, 0.05, 0x101010);
          B.box('g', 0, -0.04, 0.12, 0.05, 0.1, 0.2, wood); B.box('g', 0, -0.09, -0.36, 0.06, 0.05, 0.16, wood); B.box('g', 0, 0.035, -0.12, 0.02, 0.03, 0.08, 0x1a1a1a);
          B.box('g', 0, -0.12, -0.02, 0.085, 0.09, 0.12, glove); B.box('g', 0, -0.15, 0.1, 0.09, 0.1, 0.2, cuff); B.box('g', -0.02, -0.1, -0.36, 0.08, 0.06, 0.1, glove);
        } else {
          B.box('g', 0, -0.03, -0.2, 0.05, 0.06, 0.62, c); B.cyl('g', 0, 0.05 - 0.19, -0.16, 0.028, 0.38, 0x1a1a1a, 10, { rx: Math.PI / 2 }); B.cyl('g', 0, 0.05 - 0.025, -0.35, 0.038, 0.05, 0x1a1a1a, 10, { rx: Math.PI / 2 }); B.cyl('g', 0, 0.05 - 0.025, 0.03, 0.034, 0.05, 0x1a1a1a, 10, { rx: Math.PI / 2 }); B.cyl('g', 0, 0.05 - 0.004, -0.378, 0.03, 0.008, 0x6aa0d0, 10, { rx: Math.PI / 2 });
          B.box('g', 0, 0.0, -0.16, 0.03, 0.05, 0.03, 0x2a2a2a); B.box('g', 0, 0.0, -0.05, 0.03, 0.05, 0.03, 0x2a2a2a); B.box('g', 0.05, -0.01, 0.0, 0.06, 0.015, 0.015, 0x3a3a3a);
          B.box('g', 0, -0.06, 0.12, 0.055, 0.12, 0.26, wood); B.box('g', 0, -0.07, -0.34, 0.055, 0.05, 0.3, wood); B.box('g', 0, 0.0, -0.58, 0.02, 0.02, 0.16, 0x1a1a1a);
          B.box('g', 0, -0.12, 0.0, 0.085, 0.09, 0.12, glove); B.box('g', 0, -0.15, 0.12, 0.09, 0.1, 0.2, cuff);
        }
        const root = new T.Group(); B.build(root, { g: gunMat }); B.dispose();
        const tip = new T.Group(); tip.position.set(0, id === 'sr' ? -0.01 : id === 'kr' ? 0.02 : -0.01, id === 'sr' ? -0.68 : id === 'kr' ? -0.64 : id === 'sil' ? -0.45 : -0.27); root.add(tip);
        const fl = new T.Mesh(T3.keep(new T.OctahedronGeometry(0.06, 0)), flashMat); fl.scale.set(1, 1, 2.2); fl.visible = false; tip.add(fl);
        return { root, fl };
      }
      const gunHold = new T.Group(); gunHold.scale.setScalar(0.82); gunScene.add(gunHold);
      let gunModel = null, gunModelId = '';
      function setGunModel(id) { if (gunModelId === id && gunModel) return; if (gunModel) { gunHold.remove(gunModel.root); gunModel.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } gunModel = gunGeo(id); gunModelId = id; gunHold.add(gunModel.root); }

      // ---------------------------------------------------------------- loading a mission's scene
      let SC = null; // { mi, root, meshes, dyn: [], targets: [], lever, bomb, scen }
      const labelCache = {};
      function labelTex(s) { if (labelCache[s]) return labelCache[s]; return labelCache[s] = T3.tex(32, 16, (g, w, h) => { g.fillStyle = '#eee'; g.fillRect(0, 0, w, h); g.fillStyle = '#c01a1a'; g.fillRect(0, 0, w, 3); g.fillStyle = '#111'; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.fillText(s, w / 2, 13); }); }
      function loadScene(mi) {
        if (SC && SC.mi === mi) return;
        unloadScene();
        const M = MISSIONS[mi], sk = M.sky, root = new T.Group(); scene.add(root);
        const B = Builder(T), dyn = [], specials = [], r = prng(1999 + mi * 77);
        const X = {
          rnd: r,
          label(x, y, z, s) { const m = new T.Mesh(T3.keep(new T.PlaneGeometry(2.2, 1)), T3.mat({ map: labelTex(s) })); m.position.set(x, y, z); root.add(m); },
          water(x, y, z, w, d) { B.box('water', x, y - 1, z, w, 1, d, 0xb0c8d8, { ts: 6, flatTop: true }); dyn.push(dt => { waterTex.offset.x += dt * 0.02; waterTex.offset.y += dt * 0.012; }); },
          mount(rad, hmin, hmax, col, key) {
            const c = hexRGB(col), f = hexRGB(sk.fog), mc = ((lerp(c[0], f[0], 0.45) * 255) << 16) | ((lerp(c[1], f[1], 0.45) * 255) << 8) | (lerp(c[2], f[2], 0.45) * 255);
            for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + r() * 0.2, h = hmin + r() * (hmax - hmin), rr = rad * (0.9 + r() * 0.2); B.cone('mount', Math.cos(a) * rr, -2, -60 + Math.sin(a) * rr, h * (1.1 + r() * 0.8), h, mc, 5, { ry: r() * 3, lo: 0.75, hi: 1.1 }); if (key === 'snow' || h > hmin + (hmax - hmin) * 0.6) B.cone('mount', Math.cos(a) * rr, -2 + h * 0.62, -60 + Math.sin(a) * rr, h * (1.1 + r() * 0.8) * 0.36, h * 0.38, 0xf4f8ff, 5, { ry: r() * 3 }); }
          },
          lever(x, y, z) { const g = new T.Group(); g.position.set(x, y, z); root.add(g); const arm = new T.Mesh(T3.keep(new T.BoxGeometry(0.14, 0.9, 0.14)), T3.mat({ color: 0xd01a1a })); arm.geometry.translate(0, 0.45, 0); arm.rotation.x = -0.5; g.add(arm); const knob = new T.Mesh(T3.keep(new T.SphereGeometry(0.13, 8, 6)), T3.mat({ color: 0xf0f0f0 })); knob.position.y = 0.95; arm.add(knob); SC_tmp.lever = { g, arm, pulled: false }; specials.push(arm, knob); arm.userData.special = 'lever'; knob.userData.special = 'lever'; },
          bomb(x, y, z) {
            const g = new T.Group(); g.position.set(x, y, z); root.add(g);
            const body = new T.Mesh(T3.keep(new T.BoxGeometry(1.6, 0.7, 0.8)), T3.mat({ color: 0x3a3a40 })); body.position.y = 0.35; g.add(body);
            for (const s of [-1, 1]) { const t = new T.Mesh(T3.keep(new T.CylinderGeometry(0.22, 0.22, 1.4, 10)), T3.mat({ color: 0x8a2a1a })); t.rotation.z = Math.PI / 2; t.position.set(0, 0.3, s * 0.2 - 0.05); g.add(t); }
            const dispC = document.createElement('canvas'); dispC.width = 64; dispC.height = 24; const dispT = new T.CanvasTexture(dispC); dispT.magFilter = T.LinearFilter; dispT.minFilter = T.LinearFilter; dispT.generateMipmaps = false;
            const disp = new T.Mesh(T3.keep(new T.PlaneGeometry(0.7, 0.26)), T3.mat({ map: dispT, lit: false })); disp.position.set(0, 0.8, 0.35); disp.rotation.x = -0.5; g.add(disp);
            const lamp = new T.Mesh(T3.keep(new T.SphereGeometry(0.11, 8, 6)), T3.mat({ color: 0x444444, lit: false })); lamp.position.set(0.62, 0.82, 0.25); g.add(lamp);
            const cols = [0xd01a1a, 0x1a4ad0, 0xe8c81a, 0x1aa03a], wires = [];
            for (let i = 0; i < 4; i++) { const w = new T.Mesh(T3.keep(new T.BoxGeometry(1.3, 0.07, 0.07)), T3.mat({ color: cols[i] })); w.position.set(0, 0.52 - i * 0.11, 0.43); w.rotation.z = (i % 2 ? 1 : -1) * 0.06; g.add(w); w.userData.special = 'wire'; w.userData.wire = i; wires.push(w); specials.push(w); }
            SC_tmp.bomb = { g, dispC, dispT, lamp, wires, cols, last: '' };
          },
          beacon(x, y, z) { const m = new T.Mesh(T3.keep(new T.CylinderGeometry(0.2, 0.25, 0.35, 8)), T3.mat({ color: 0xff2010, lit: false })); m.position.set(x, y, z); root.add(m); const beam = new T.Mesh(T3.keep(new T.BoxGeometry(5, 0.3, 0.3)), T3.mat({ color: 0xff3020, lit: false, transparent: true, opacity: 0.22 })); beam.geometry.translate(2.5, 0, 0); m.add(beam); dyn.push((dt, t) => { beam.rotation.y = t * 4; m.material.color.setHex((t * 2 | 0) % 2 ? 0xff2010 : 0x801008); }); },
          scenery() {
            const SB = Builder(T), rr = prng(77);
            SB.box('grass', 0, -2.4, -60, 160, 0.4, 120, 0x8a9a7a, { ts: 4, flatTop: true }); SB.box('dirt', 0, -2.05, -60, 6, 0.3, 120, 0x9a8a7a, { ts: 2, flatTop: true });
            for (let z = 0; z > -120; z -= 2) SB.box('wood', 0, -1.85, z, 4.4, 0.18, 0.4, 0x5a4030);
            for (let z = 0; z > -120; z -= 12) SB.cyl('wood', 7, -2.2, z, 0.12, 7, 0x6a4a2a, 6);
            for (let i = 0; i < 26; i++) { const s = i % 2 ? 1 : -1, x = s * (9 + rr() * 50), z = -rr() * 120; SB.card('leaf', x, -2.2, z, 5, 9 + rr() * 5, rr() * 3, 0xa0b0c0); }
            const mk = () => { const g = new T.Group(); SB.build(g, MAT); root.add(g); return g; };
            const a = mk(), b = mk(); SB.dispose(); a.position.z = 30; b.position.z = 150;
            SC_tmp.scen = { a, b, v: 26 };
            dyn.push(dt => { const s = SC.scen; for (const g of [s.a, s.b]) { g.position.z += s.v * dt; if (g.position.z > 150) g.position.z -= 240; } });
          },
        };
        const SC_tmp = { mi, root, dyn, specials, M };
        M.build(B, X);
        SC_tmp.meshes = B.build(root, MAT); B.dispose();
        SC = SC_tmp;
        // the lights, fog and sky for this place
        scene.fog.color.setHex(sk.fog); scene.fog.near = sk.near; scene.fog.far = sk.far; scene.background = new T.Color(sk.fog);
        paintSky(sk.top, sk.hor);
        lit.hemi.color.setHex(sk.hs); lit.hemi.groundColor.setHex(sk.hg); lit.hemi.intensity = sk.amb; lit.sun.color.setHex(sk.sunCol || 0xffffff); lit.sun.intensity = sk.sun; lit.sun.position.set(sk.dir[0], sk.dir[1], sk.dir[2]);
        waterTex.offset.set(0, 0);
      }
      function unloadScene() {
        if (!SC) return;
        scene.remove(SC.root);
        SC.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
        SC = null;
      }

      // ================================================================ a mission in progress
      let G = null; const DBG = { auto: false, draws: 0, fps: 0, ft: 0 };
      const ray = new T.Raycaster(), v2 = new T.Vector2(), v3 = new T.Vector3(), v3b = new T.Vector3();
      let aimX = 0, aimY = 0, mouse = false, clicked = false, holdT = 0;
      const pops = []; // floating score text [x, y (screen 0..1), text, colour, life]
      function popTxt(sx, sy, s, c, life) { pops.push({ x: sx, y: sy, s, c: c || '#fff', t: life || 1 }); if (pops.length > 8) pops.shift(); }
      let shake = 0, hurtFlash = 0, hurtSide = 0, banner = null;
      function say(t, sub, life, col) { banner = { t, sub: sub || '', life: life || 2.2, age: 0, col: col || '#ffd84a' }; }
      function startMission(mi, d, demo) {
        loadScene(mi); clearHoles();
        const M = MISSIONS[mi];
        if (G) for (const e of G.ents) if (e.slot != null) crowd.give(e.slot);
        if (G && G.cards) for (const c of G.cards) disposeCard(c);
        if (G && G.picks) for (const p of G.picks) { SC && SC.root.remove(p.mesh); }
        G = { mi, M, d, demo: !!demo, si: -1, stopT: 0, move: null, ents: [], cards: [], picks: [], spawned: [], t: 0, score: 0, shots: 0, hits: 0, heads: 0, kills: 0, civHit: 0, hats: 0, hatRow: 0, bodies: 0,
          hp: 100, armour: 0, guns: {}, gun: M.guns[0], fireCD: 0, rel: 0, swapT: 0, zoom: 1, aimK: 0, yawOff: 0, pitch: 0, kick: 0, bob: 0, done: null, endT: 0, flashT: 0,
          bombT: M.bomb ? [125, 105, 90][d] : 0, defuse: null, alarm: 0, alarmOn: false, need: M.kind === 'sniper' ? [8, 10, 12][d] : 0, clock: M.kind === 'sniper' ? [170, 150, 135][d] : 0,
          cardsHit: 0, cardsAll: 0, rangeOk: true, bossE: null, sway: 0, turbo: cheat('turbo') ? 1.6 : 1, lever: false, trainV: 26 };
        for (const id of M.guns) G.guns[id] = { mag: GUNS[id].mag, res: GUNS[id].res };
        aimX = aimY = 0; pops.length = 0; banner = null; shake = 0; hurtFlash = 0;
        if (SC.lever) { SC.lever.pulled = false; SC.lever.arm.rotation.x = -0.5; }
        if (SC.scen) SC.scen.v = 26;
        if (SC.bomb) { for (const w of SC.bomb.wires) w.visible = true; SC.bomb.lamp.material.color.setHex(0x444444); }
        setGunModel(G.gun);
        nextStop(true);
        music(demo ? 'title' : M.music);
        if (!demo) say(M.n, DIFFS[d], 2.6);
      }
      // ---- the stops (moving on rails)
      const stopPos = (st, out) => out.set(st.p[0], st.y || 1.65, st.p[1]);
      function nextStop(first) {
        const M = G.M; G.si++;
        if (G.si >= M.stops.length) return missionDone();
        const st = M.stops[G.si];
        if (first || !st.walk) { stopPos(st, cam.position); G.move = null; G.yawOff = 0; G.pitch = 0; }
        else G.move = { from: cam.position.clone(), to: stopPos(st, new T.Vector3()), t: 0, dur: st.walk / G.turbo, yaw0: G.yawOff + (M.stops[G.si - 1] ? M.stops[G.si - 1].yaw : 0) * D2R };
        G.stopT = 0; G.spawned = [];
        let list = st.spawns; if (typeof list === 'string') list = rangeCards(prng(Date.now() & 0xffff), +list.slice(5));
        G.plan = list.filter(s => !(s[5] && s[5].d > G.d)).map(s => ({ s, done: false }));
        if (st.gun && G.guns[st.gun]) { swapTo(st.gun, true); }
        if (st.phase && G.si > 0) say('PHASE ' + (G.si + 1), st.phase, 2.2); else if (st.phase) say(st.phase, 'PHASE 1', 2.2);
        for (const e of G.ents) if (e.k === 'c' && e.st === 'cower') e.leave = true;
      }
      function stopClear() {
        if (!G.plan || G.plan.some(p => !p.done)) return false;
        const M = G.M, st = M.stops[G.si];
        if (M.kind === 'range') return G.cards.every(c => c.st === 'gone');
        if (M.kind === 'sniper') return G.kills >= G.need;
        if (G.ents.some(e => (e.k === 'g' || e.k === 'boss') && e.st !== 'down' && !e.surrender && e.si === G.si)) return false;
        if (st.lever) return G.lever;
        if (st.bombStop) return false;
        return true;
      }
      // ---- spawning
      function spawn(p) {
        const [, kind, x, z, how, o0] = p.s, o = o0 || {};
        if (kind === 'card') return spawnCard(x, z, how, o);
        if (kind === 'ammo' || kind === 'armour') return spawnPick(kind, x, z);
        const style = kind === 'boss' ? 'boss' : kind === 'c' ? G.M.civ : (o.style || G.M.style);
        const boxes = charBoxes(STYLES[style]);
        const slot = crowd.take(boxes); if (slot == null) return false;
        const from = o.from || (how === 'peek' ? [x + (o.dx || 2), z] : [x, z]);
        const e = { k: kind, how, slot, st: 'enter', t: 0, x: from[0], z: from[1], y: o.y || 0, hx: from[0], hz: from[1], tx: x, tz: z, to: o.to, hp: kind === 'boss' ? 14 + G.d * 5 : (o.hp || 2) + DK[G.d].hp - (G.M.kind === 'sniper' ? 1 : 0), maxHp: 0, si: G.si,
          aim: 0, crouch: how === 'pop' ? 1 : 0, warn: DK[G.d].warn * (0.8 + Math.random() * 0.5), burst: 0, fireT: 0, flinch: 0, ph: Math.random() * 6, hid: 0, fall: 0, pts: o.pts, pi: 0, cycles: 0,
          ch: { boxes, rot: BONES.map(() => [0, 0, 0]), x: from[0], y: o.y || 0, z: from[1], yaw: 0, bigHead: cheat('heads') ? 2.1 : 0, longArm: cheat('arms') ? 2.2 : 0, sc: kind === 'boss' ? 1.12 : 1 } };
        e.maxHp = e.hp;
        if (kind === 'c') { e.st = how === 'cower' ? 'cower' : how === 'patrol' ? 'patrol' : 'run'; if (how === 'civ') { e.x = e.ch.x = o.from[0]; e.z = e.ch.z = o.from[1]; } if (how === 'patrol') { e.ax = x; e.az = z; } }
        if (kind === 'g' && how === 'patrol') { e.st = 'patrol'; e.ax = x; e.az = z; }
        if (kind === 'boss') { G.bossE = e; e.st = 'brun'; e.x = e.ch.x = o.pts[0][0]; e.z = e.ch.z = o.pts[0][1] - 4; say('DOCTOR KLAXON!', 'STOP HIM!', 2.6, '#ff8a6a'); }
        G.ents.push(e); return true;
      }
      // the range's cardboard targets: their own canvas each (so the bullet holes stay on them)
      const cardGeo = T3.keep(new T.PlaneGeometry(1.4, 2.4)); cardGeo.translate(0, 1.2, 0);
      const bullGeo = T3.keep(new T.PlaneGeometry(1.8, 2.2)); bullGeo.translate(0, 1.1, 0);
      function cardArt(g, w, h, kind) {
        g.clearRect(0, 0, w, h);
        if (kind === 'bull') { g.fillStyle = '#7a5530'; g.fillRect(w / 2 - 2, h * 0.75, 4, h * 0.25); [['#fff', 30], ['#c01a1a', 25], ['#fff', 19], ['#c01a1a', 13], ['#ffd200', 7]].forEach(([c, r]) => { g.fillStyle = c; g.beginPath(); g.arc(w / 2, h * 0.42, r, 0, TAU); g.fill(); }); return; }
        const civ = kind === 'civ';
        g.fillStyle = '#c8b090'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8a080'; for (let y = 4; y < h; y += 8) g.fillRect(0, y, w, 1);
        g.fillStyle = civ ? '#3a6ad0' : '#2a2a2a'; g.fillRect(w * 0.18, h * 0.38, w * 0.64, h * 0.62); g.fillRect(w * 0.06, h * 0.4, w * 0.14, h * 0.4); g.fillRect(w * 0.8, h * 0.4, w * 0.14, h * 0.4);
        g.fillStyle = '#f0c8a0'; g.beginPath(); g.arc(w / 2, h * 0.22, w * 0.19, 0, TAU); g.fill();
        if (civ) { g.fillStyle = '#c8c8c8'; g.beginPath(); g.arc(w / 2, h * 0.13, w * 0.2, Math.PI, 0); g.fill(); g.fillStyle = '#e0a0c0'; g.fillRect(w * 0.62, h * 0.6, w * 0.3, h * 0.24); g.fillStyle = '#111'; g.fillRect(w * 0.42, h * 0.2, 3, 3); g.fillRect(w * 0.55, h * 0.2, 3, 3); g.fillStyle = '#a03030'; g.fillRect(w * 0.42, h * 0.28, w * 0.16, 2); g.fillStyle = '#fff'; g.font = 'bold 8px Arial'; g.textAlign = 'center'; g.fillText('DON\'T', w / 2, h * 0.58); g.fillText('SHOOT', w / 2, h * 0.68); }
        else { g.fillStyle = '#111'; g.fillRect(w * 0.3, h * 0.17, w * 0.4, h * 0.06); g.fillStyle = '#222'; g.beginPath(); g.arc(w / 2, h * 0.1, w * 0.19, Math.PI, 0); g.fill(); g.fillStyle = '#ffd200'; g.beginPath(); g.arc(w / 2, h * 0.58, 7, 0, TAU); g.fill(); g.fillStyle = '#c01a1a'; g.beginPath(); g.arc(w / 2, h * 0.58, 3.5, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(w * 0.4, h * 0.29, w * 0.2, 2); g.fillStyle = '#3a3a3a'; g.fillRect(w * 0.82, h * 0.5, w * 0.16, h * 0.06); }
        g.strokeStyle = '#8a7050'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
      }
      function spawnCard(x, z, kind, o) {
        const cv = document.createElement('canvas'); cv.width = 48; cv.height = 80; const g = cv.getContext('2d'); cardArt(g, 48, 80, kind);
        const tx = new T.CanvasTexture(cv); tx.magFilter = T.LinearFilter; tx.minFilter = T.LinearFilter; tx.generateMipmaps = false;
        const m = new T.MeshLambertMaterial({ map: tx, side: T.DoubleSide, transparent: kind === 'bull' }); if (kind === 'bull') m.alphaTest = 0.5;
        const mesh = new T.Mesh(kind === 'bull' ? bullGeo : cardGeo, m); const sc = -z > 60 ? 1.7 : 1; mesh.scale.set(sc, sc, sc);
        mesh.position.set(x, 0, z); mesh.rotation.x = -Math.PI / 2; mesh.visible = false; SC.root.add(mesh);
        const c = { mesh, cv, g, tx, m, kind, x0: x, z, st: 'rise', up: 0, left: o.stay, mv: o.mv, hit: false };
        G.cards.push(c); if (kind !== 'civ') G.cardsAll++; snd.card(); return true;
      }
      function disposeCard(c) { if (c.mesh.parent) c.mesh.parent.remove(c.mesh); c.tx.dispose(); c.m.dispose(); }
      function spawnPick(kind, x, z) {
        const mesh = new T.Mesh(T3.keep(new T.BoxGeometry(0.55, 0.4, 0.4)), T3.mat({ map: kind === 'ammo' ? TX.ammo : null, color: kind === 'ammo' ? 0xffffff : 0x2a5ad0, emissive: kind === 'ammo' ? 0x101808 : 0x0a1a40 }));
        mesh.position.set(x, 0.2 + (z < -50 && G.M.id === 'bunker' && x === -2.4 ? 1.2 : 0), z); SC.root.add(mesh); G.picks.push({ kind, mesh, got: false }); return true;
      }
      // ---- the guns
      const gunNow = () => GUNS[G.gun];
      function swapTo(id, quiet) { if (!G.guns[id]) return; if (G.gun !== id) { G.gun = id; G.swapT = quiet ? 0 : 0.45; G.rel = 0; if (!quiet) snd.swap(); } setGunModel(id); G.zoom = 1; }
      function cycleGun() { const L = G.M.guns.filter(id => G.guns[id]); const i = L.indexOf(G.gun); swapTo(L[(i + 1) % L.length]); popTxt(0.5, 0.78, GUNS[G.gun].n, '#9ad0ff', 1.4); }
      function reload() { const g = G.guns[G.gun], gd = gunNow(); if (G.rel > 0 || g.mag >= gd.mag || (g.res <= 0 && !cheat('ammo'))) return; G.rel = gd.rel; snd.reload(); }
      function finishReload() { const g = G.guns[G.gun], gd = gunNow(); const need = gd.mag - g.mag; if (cheat('ammo')) { g.mag = gd.mag; return; } const take = Math.min(need, g.res); g.mag += take; g.res -= take; }
      function fire() {
        const g = G.guns[G.gun], gd = gunNow();
        if (G.rel > 0 || G.fireCD > 0 || G.swapT > 0) return;
        if (g.mag <= 0) { snd.empty(); G.fireCD = 0.25; if (g.res > 0 || cheat('ammo')) reload(); else if (!pops.some(p => p.s.startsWith('NO AMMO'))) popTxt(0.5, 0.7, 'NO AMMO! SWAP GUN (' + K.label('l') + ')', '#ff6a5a', 1.4); return; }
        g.mag--; G.shots++; G.fireCD = gd.rate; G.kick = gd.kick; G.flashT = 0.05; flashL.intensity = gd.loud ? 1.2 : 0.4; flashL.position.copy(cam.position);
        if (G.gun === 'pk9') snd.pk9(); else if (G.gun === 'sil') snd.sil(); else if (G.gun === 'kr') snd.kr(); else snd.sr();
        if (G.M.kind === 'sniper' && gd.loud) { G.alarm += 0.07; }
        if (SV.opt.shake && gd.kick > 1) shake = Math.max(shake, 0.15);
        const aimed = G.zoom > 1.2, scoped = gd.scope && aimed;
        const sp = (aimed ? gd.spread * 0.12 : gd.spread) * (G.move ? 1.6 : 1) * (G.gun === 'kr' && K.held('a') ? 1.6 : 1);
        const ax = aimed ? 0 : aimX, ay = aimed ? 0 : aimY;
        v2.set(ax + (Math.random() - 0.5) * sp * 2, -(ay + (Math.random() - 0.5) * sp * 2)); ray.setFromCamera(v2, cam); ray.far = 600;
        shoot(ray.ray.origin, ray.ray.direction, gd);
        if (scoped) { /* (the scope stays where it is) */ }
      }
      // what the bullet hits: henchmen and people (box by box), range cards, special things, the level itself
      function shoot(o, d, gd) {
        let best = Infinity, hitE = null, hitBox = null, hitCard = null, hitSpecial = null, wp = null, wn = null;
        for (const e of G.ents) {
          if (e.st === 'down' || e.slot == null || e.hid > 0.85 || !e.ch.mats) continue;
          for (let k = 0; k < e.ch.boxes.length; k++) { const B = e.ch.boxes[k]; if (B[8] === 'hat' && e.ch.hatGone) continue; const t = rayBox(T, e.ch.mats[k], o, d); if (t >= 0 && t < best) { best = t; hitE = e; hitBox = B; } }
        }
        const live = G.cards.filter(c => c.st === 'up' || c.st === 'rise');
        if (live.length) { const L = ray.intersectObjects(live.map(c => c.mesh)); if (L.length && L[0].distance < best) { best = L[0].distance; hitE = null; hitCard = [live.find(c => c.mesh === L[0].object), L[0]]; } }
        const sp = SC.specials.filter(m => m.visible); const pk = G.picks.filter(p => !p.got).map(p => p.mesh);
        const LS = ray.intersectObjects(sp.concat(pk)); if (LS.length && LS[0].distance < best) { best = LS[0].distance; hitE = null; hitCard = null; hitSpecial = LS[0]; }
        const LW = ray.intersectObjects(SC.meshes.filter(m => m.userData.key !== 'leaf' && m.userData.key !== 'mount')); if (LW.length && LW[0].distance < best) { best = LW[0].distance; hitE = null; hitCard = null; hitSpecial = null; wp = LW[0].point; wn = LW[0].face ? LW[0].face.normal : v3b.set(0, 1, 0); }
        const paint = cheat('paint'), pc = PAINT[G.shots % PAINT.length];
        if (hitE) return hitPerson(hitE, hitBox, o.clone().addScaledVector(d, best), gd, paint, pc);
        if (hitCard) return hitRangeCard(hitCard[0], hitCard[1], paint, pc);
        if (hitSpecial) return hitThing(hitSpecial.object, hitSpecial.point);
        G.hatRow = 0;
        if (wp) {
          const n = v3b.copy(wn).transformDirection(LW[0].object.matrixWorld);
          hole(wp, n, paint ? pc : 0x141008); puff(wp.x, wp.y, wp.z, paint ? pc : 0xc8c0b0, paint ? 7 : 4, paint ? 3 : 1.6, 0.5, 0.4); if (!paint && Math.random() < 0.35) snd.ric();
          if (G.M.kind === 'sniper') for (const e of G.ents) if (e.k === 'g' && e.st !== 'down' && Math.hypot(e.x - wp.x, e.z - wp.z) < 7) { G.alarm += 0.3; e.spook = 1.5; break; }
        }
      }
      function scr(x, y, z) { v3.set(x, y, z).project(cam); return [(v3.x + 1) / 2, (1 - v3.y) / 2, v3.z < 1]; }
      function hitPerson(e, B, p, gd, paint, pc) {
        const tag = B[8], d = DK[G.d];
        puff(p.x, p.y, p.z, paint ? pc : tag === 'hat' ? 0xffffff : 0xffe8a0, paint ? 10 : 5, 2.4, 0.6, 0.5);
        if (paint) hole(p, v3b.set(0, 0, 1), pc);
        const [sx, sy] = scr(p.x, p.y, p.z);
        if (e.k === 'c') { G.hits++; G.civHit++; e.hp = 0; down(e, false); G.score -= 500; popTxt(sx, sy, 'CIVILIAN! -500', '#ff5a5a', 1.6); snd.civ(); G.hatRow = 0; if (SV.opt.shake) shake = 0.25; return; }
        G.hits++;
        if (tag === 'hat') { knockHat(e, p); G.score += 50; popTxt(sx, sy, 'HAT! +50', '#9ad0ff', 1); return; }
        const gold = cheat('gold');
        let dmg = gold ? 99 : gd.dmg; const head = tag === 'head'; if (head) dmg *= 3;
        e.hp -= dmg; snd.hit(); G.hatRow = head ? G.hatRow : 0;
        if (e.hp <= 0) {
          G.kills++; let pts = 100 + (e.k === 'boss' ? 2000 : 0); if (head) { pts += 150; G.heads++; knockHat(e, p); snd.head(); }
          G.score += pts; popTxt(sx, sy, (head ? 'HEADSHOT! ' : '') + '+' + pts, head ? '#ffd84a' : '#fff', 1.1);
          down(e, true);
          if (G.M.kind === 'sniper') for (const o2 of G.ents) if (o2 !== e && o2.k === 'g' && o2.st !== 'down' && Math.hypot(o2.x - e.x, o2.z - e.z) < 12 && !gd.scope) { G.alarm += 0.15; o2.spook = 1; }
          if (G.M.kind === 'sniper') popTxt(0.5, 0.2, 'LOOKOUTS ' + G.kills + ' / ' + G.need, '#9ad0ff', 1.2);
        } else {
          G.score += 10; e.flinch = 0.3; e.warn = Math.max(e.warn, 0.55); popTxt(sx, sy, '+10', '#ddd', 0.6);
          if (e.k === 'boss') { const third = e.maxHp / 3; if (!e.wave1 && e.hp < third * 2) { e.wave1 = 1; reinforce(2); } if (!e.wave2 && e.hp < third) { e.wave2 = 1; reinforce(3); } }
        }
      }
      function knockHat(e, p) {
        if (e.ch.hatGone || e.ch.hatFly || !e.ch.boxes.some(b => b[8] === 'hat')) return;
        e.ch.hatFly = { m: (e.ch.hatM || new T.Matrix4()).clone(), vx: (Math.random() - 0.5) * 2, vy: 4.5, vz: -1.5 - Math.random(), sp: 8 + Math.random() * 6, t: 0 };
        G.hats++; G.hatRow++; snd.hat();
        if (G.hatRow >= 3 && !G.demo) { K.secret('rm.range.hat'); popTxt(0.5, 0.3, 'HAT TRICK!', '#ffd84a', 1.6); G.hatRow = 0; }
      }
      function reinforce(n) { const pts = G.bossE ? G.bossE.pts : [[0, -40]]; for (let i = 0; i < n; i++) { const pt = pts[(i * 2 + 1) % pts.length]; G.plan.push({ s: [0, 'g', pt[0] + (i - 1) * 1.6, pt[1] + 3, 'run', { from: [pt[0], pt[1] - 6] }], done: false }); } G.stopT = Math.min(G.stopT, 0); say('MORE HENCHMEN!', '', 1.4, '#ff8a6a'); }
      function hitRangeCard(c, h, paint, pc) {
        const uv = h.uv; if (paint) { c.g.fillStyle = css(pc); for (let i = 0; i < 7; i++) { c.g.beginPath(); c.g.arc(uv.x * 48 + (i ? (Math.random() - 0.5) * 12 : 0), (1 - uv.y) * 80 + (i ? (Math.random() - 0.5) * 12 : 0), i ? 1.5 + Math.random() * 2 : 5, 0, TAU); c.g.fill(); } }
        else { c.g.fillStyle = '#1a1208'; c.g.beginPath(); c.g.arc(uv.x * 48, (1 - uv.y) * 80, 2.2, 0, TAU); c.g.fill(); c.g.fillStyle = 'rgba(255,255,255,.4)'; c.g.fillRect(uv.x * 48 - 1, (1 - uv.y) * 80 - 3, 2, 1); }
        c.tx.needsUpdate = true; puff(h.point.x, h.point.y, h.point.z, paint ? pc : 0xd8c8a0, 4, 1.4, 0.4, 0.4);
        if (c.hit) return; c.hit = true; c.st = 'fall'; G.hits++;
        const [sx, sy] = scr(h.point.x, h.point.y, h.point.z);
        if (c.kind === 'civ') { G.civHit++; G.rangeOk = false; G.score -= 500; popTxt(sx, sy, 'CIVILIAN! -500', '#ff5a5a', 1.4); snd.civ(); return; }
        G.cardsHit++; G.kills++;
        const cx = 0.5, cy = c.kind === 'bull' ? 0.58 : 0.42, dd = Math.hypot(uv.x - cx, (uv.y - cy) * 1.6), bull = dd < 0.12;
        const pts = Math.round((100 + (bull ? 150 : 0)) * (1 + -c.z / 100)); if (bull) G.heads++;
        G.score += pts; popTxt(sx, sy, (bull ? 'BULLSEYE! ' : '') + '+' + pts, bull ? '#ffd84a' : '#fff', 1);
        S.tone(bull ? 1400 : 900, 0.06, 'square', 0.08, 0.05);
      }
      function hitThing(obj, p) {
        G.hits++; puff(p.x, p.y, p.z, 0xffe080, 8, 3, 1, 0.5);
        const pk = G.picks.find(q => q.mesh === obj);
        if (pk) { pk.got = true; pk.mesh.visible = false; snd.pick(); const [sx, sy] = scr(p.x, p.y, p.z);
          if (pk.kind === 'ammo') { for (const id in G.guns) G.guns[id].res += GUNS[id].mag * 2; popTxt(sx, sy, 'AMMO!', '#9aff9a', 1.2); } else { G.armour = Math.min(100, G.armour + 50); popTxt(sx, sy, 'BODY ARMOUR!', '#7ab0ff', 1.2); } return; }
        const sp = obj.userData.special;
        if (sp === 'lever' && SC.lever && !SC.lever.pulled) { SC.lever.pulled = true; G.lever = true; snd.brake(); say('BRAKES ON!', 'THE TRAIN IS STOPPING', 2.4); G.score += 1000; }
        if (sp === 'wire' && G.defuse && G.defuse.st === 'cut') {
          const i = obj.userData.wire, D = G.defuse;
          if (i === D.seq[D.i]) { obj.visible = false; D.i++; snd.ok(); G.score += 400; popTxt(0.5, 0.35, 'SNIP! +400', '#9aff9a', 1); if (D.i >= D.seq.length) { D.st = 'safe'; say('BOMB DEFUSED!', 'PHEW', 2.6, '#9aff9a'); snd.win(); G.endT = 2.4; } else D.lt = 0; }
          else { G.bombT -= 15; snd.no(); popTxt(0.5, 0.35, 'WRONG WIRE! -15 SECONDS', '#ff5a5a', 1.4); if (SV.opt.shake) shake = 0.3; }
        }
      }
      function down(e, kill) {
        e.st = 'down'; e.t = 0; e.fall = 0; e.aim = 0; if (!kill) e.faint = 1;
        puff(e.x, e.y + 1, e.z, 0xd8d0c0, 6, 2, 0.5, 0.6);
        if (e.k === 'boss') { G.score += 0; say('KLAXON IS DOWN!', 'GOT HIM!', 3, '#ffd84a'); for (const o of G.ents) if (o.k === 'g' && o.st !== 'down') { o.surrender = 1; } }
      }
      // ---- the henchmen think
      function playerHit(e) {
        if (G.demo || G.done) return;
        const dist = Math.hypot(e.x - cam.position.x, e.z - cam.position.z), d = DK[G.d];
        let acc = d.acc * (dist > 25 ? 0.7 : 1) * (G.M.kind === 'sniper' ? 0.4 : 1) * (G.move ? 0.6 : 1) * (e.k === 'boss' ? 1.2 : 1);
        snd.enemy(dist);
        const [sx, , on] = scr(e.x, e.y + 1.4, e.z);
        const gl = e.ch.mats && e.ch.mats[e.ch.boxes.findIndex(b => b[8] === 'gun')]; if (gl) { v3.setFromMatrixPosition(gl); puff(v3.x, v3.y, v3.z, 0xfff0a0, 3, 1, 0, 0.12); }
        if (Math.random() > acc) { if (Math.random() < 0.4) snd.ric(); return; }
        let dmg = d.dmg * (e.k === 'boss' ? 1.5 : 1);
        if (G.armour > 0) { const a = Math.min(G.armour, dmg * 0.8); G.armour -= a; dmg -= a; }
        G.hp -= dmg; hurtFlash = 0.5; hurtSide = !on ? 0 : sx < 0.35 ? -1 : sx > 0.65 ? 1 : 0; snd.hurt(); if (SV.opt.shake) shake = Math.max(shake, 0.22);
        if (G.hp <= 0) { G.hp = 0; missionFail('YOU WERE HIT ONE TIME TOO MANY'); }
      }
      function updEnt(e, dt) {
        const c = e.ch, R = c.rot; e.t += dt;
        const camX = cam.position.x, camZ = cam.position.z, face = Math.atan2(camX - e.x, camZ - e.z), sp = G.turbo;
        let moving = 0, sideways = 0;
        const go = (tx, tz, speed) => { const dx = tx - e.x, dz = tz - e.z, l = Math.hypot(dx, dz); if (l < 0.05) return true; const s = Math.min(l, speed * dt * sp); e.x += dx / l * s; e.z += dz / l * s; e.dir = Math.atan2(dx, dz); moving = speed; return l < 0.06; };
        if (e.flinch > 0) e.flinch -= dt;
        if (e.spook > 0) e.spook -= dt;
        let wantYaw = face;
        if (e.k === 'c') {
          if (e.st === 'run') { const fr = G.M.stops[e.si].spawns.find ? null : null; if (go(e.tx, e.tz, 3.6)) { e.st = 'gone'; } wantYaw = e.dir; }
          else if (e.st === 'patrol') { const tgt = e.back ? [e.ax, e.az] : e.to; if (go(tgt[0], tgt[1], 1.3)) e.back = !e.back; wantYaw = e.dir; }
          else if (e.st === 'cower') { if (e.leave && e.t > 0.5) { e.st = 'gone'; } }
        } else if (e.st === 'enter') {
          if (e.k === 'g' && e.how === 'pop') { e.crouch = Math.max(0, e.crouch - dt * 3.2 * sp); if (e.crouch <= 0) e.st = 'aim'; }
          else if (e.how === 'peek') { const back = e.x !== e.tx || e.z !== e.tz; if (go(e.tx, e.tz, 3)) e.st = 'aim'; sideways = back ? 1 : 0; wantYaw = face; }
          else if (e.how === 'run') { if (go(e.tx, e.tz, 4.4)) e.st = 'aim'; else wantYaw = e.dir; }
          else e.st = 'aim';
          e.hid = e.how === 'pop' ? e.crouch : 0;
        } else if (e.st === 'patrol') {
          const tgt = e.back ? [e.ax, e.az] : e.to; if (go(tgt[0], tgt[1], G.alarmOn ? 3.2 : 1.2)) e.back = !e.back; wantYaw = e.dir;
          if (G.alarmOn && e.t > 1 && Math.random() < dt * 0.4) { e.st = 'aim'; e.warn = DK[G.d].warn * 1.4; }
        } else if (e.st === 'aim') {
          if (e.surrender) { e.aim = Math.max(0, e.aim - dt * 3); }
          else if (G.M.kind === 'sniper' && !G.alarmOn && e.how === 'stand') { e.aim = Math.max(0, e.aim - dt * 3); e.look = (e.look || 0) + dt; wantYaw = face + Math.sin(e.look * 0.6) * 1.5 + 1.2; }
          else {
            e.aim = Math.min(1, e.aim + dt * 4); if (e.flinch <= 0 && !G.move && (e.warn < DK[G.d].warn * 0.7 || G.ents.filter(o => o.st === 'fire' || (o.st === 'aim' && o.warn < DK[o.d0 == null ? G.d : G.d].warn * 0.7)).length < DK[G.d].shooters + 1)) e.warn -= dt * sp;
            if (e.warn <= 0) { e.st = 'fire'; e.burst = 1 + (G.d > 0 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0); e.fireT = 0; }
          }
        } else if (e.st === 'fire') {
          e.fireT -= dt * sp;
          if (e.fireT <= 0 && e.flinch <= 0) { playerHit(e); e.burst--; e.fireT = 0.17; e.recoil = 0.12; }
          if (e.burst <= 0) { e.cycles++;
            if (e.k === 'boss') { e.st = 'brun'; e.pi = (e.pi + 1) % e.pts.length; }
            else if (e.how === 'pop' || e.how === 'peek') { e.st = 'hide'; e.hideT = 0.9 + Math.random() * 1.1; }
            else { e.st = 'aim'; e.warn = DK[G.d].warn * (1 + Math.random() * 0.5); }
          }
        } else if (e.st === 'hide') {
          if (e.how === 'pop') { e.crouch = Math.min(1, e.crouch + dt * 4 * sp); e.hid = e.crouch; }
          else { const hx = e.hx, hz = e.hz; go(hx, hz, 3); sideways = 1; e.hid = Math.min(1, Math.hypot(e.x - e.tx, e.z - e.tz) / Math.max(0.5, Math.hypot(hx - e.tx, hz - e.tz))); }
          e.aim = Math.max(0, e.aim - dt * 5); e.hideT -= dt * sp;
          if (e.hideT <= 0) { e.st = 'enter'; e.warn = DK[G.d].warn * (0.7 + Math.random() * 0.4); }
        } else if (e.st === 'brun') { // the boss dashes to his next bit of cover
          const p = e.pts[e.pi]; if (go(p[0], p[1], 5)) { e.st = 'aim'; e.warn = DK[G.d].warn * 0.9; } else wantYaw = e.dir;
          e.hid = 0;
        } else if (e.st === 'down') {
          e.fall = Math.min(1, e.fall + dt * 2.6); e.aim = 0; e.hid = 1;
          if (e.fall >= 1 && !e.thud) { e.thud = 1; snd.thud(); puff(e.x, e.y + 0.1, e.z, 0xb0a890, 6, 2, 0.4, 0.5); }
          if (e.t > 3.2) c.y = e.y - (e.t - 3.2) * 0.6;
          if (e.t > 4.4) { e.st = 'gone'; }
        }
        if (e.st !== 'down' && e.st !== 'gone') { let dy = wrapA(wantYaw - c.yaw); c.yaw += dy * Math.min(1, dt * 10); }
        c.x = e.x; c.z = e.z; if (e.st !== 'down') c.y = e.y;
        // ---- the pose
        for (const r of R) { r[0] = r[1] = r[2] = 0; }
        e.ph += dt * (moving ? moving * 2.3 : 1.5);
        const ph = e.ph, run = moving > 0 ? Math.min(1, moving / 3) : 0;
        const cr = e.k === 'c' && e.st === 'cower' ? 1 : e.crouch || 0;
        // legs: run cycle or crouch
        R[8][0] = -Math.sin(ph) * 0.75 * run - cr * 1.45; R[10][0] = Math.sin(ph) * 0.75 * run - cr * 1.45;
        R[9][0] = Math.max(0, Math.sin(ph + 1.2)) * 1.1 * run + cr * 1.5; R[11][0] = Math.max(0, -Math.sin(ph + 1.2)) * 1.1 * run + cr * 1.5;
        if (sideways && e.st !== 'down') { R[8][2] = Math.sin(ph * 1.4) * 0.3; R[10][2] = -Math.sin(ph * 1.4) * 0.3; }
        c.hipY = -cr * 0.46 + Math.abs(Math.sin(ph)) * 0.05 * run + Math.sin(e.t * 2) * 0.008;
        R[2][0] = cr * 0.25 + run * 0.12 - (e.flinch > 0 ? e.flinch * 1.1 : 0); R[3][0] = -(e.flinch > 0 ? e.flinch : 0);
        // arms: swinging, aiming, panicking, surrendering
        const aimK = e.aim || 0;
        R[4][0] = lerp(Math.sin(ph) * 0.6 * run, -1.32, aimK); R[4][2] = lerp(-0.08, 0.5, aimK); R[5][0] = lerp(-0.3 * run - 0.1, -0.15, aimK);
        R[6][0] = lerp(-Math.sin(ph) * 0.6 * run, -1.5 + (e.recoil > 0 ? -e.recoil * 2 : 0), aimK); R[6][2] = lerp(0.08, -0.12, aimK); R[7][0] = lerp(-0.3 * run - 0.1, 0, aimK);
        if (e.recoil > 0) e.recoil -= dt;
        if (e.k === 'c' || e.surrender) { const wav = Math.sin(e.t * 14) * 0.25; R[4][0] = -2.9 + wav; R[6][0] = -2.9 - wav; R[4][2] = 0.2; R[6][2] = -0.2; R[5][0] = -0.3; R[7][0] = -0.3; if (cr) { R[5][0] = -1.6; R[7][0] = -1.6; R[3][0] = 0.4; } }
        if (e.k === 'boss' && e.st === 'aim' && e.warn > 0.7) { R[4][0] = -2.2; R[5][0] = -0.9; R[3][2] = Math.sin(e.t * 6) * 0.2; } // (shaking his fist)
        // falling over backwards (or fainting)
        if (e.st === 'down') { const f = ease(e.fall); R[0][0] = -1.52 * f; R[4][0] = -2.6 * f; R[6][0] = -2.4 * f; R[8][0] = -0.3 * f; R[10][0] = -0.1 * f; R[3][0] = -0.3 * f; c.hipY = -0.02 * f; }
        // the hat that came off
        if (c.hatFly) { const h = c.hatFly; h.t += dt; h.vy -= 12 * dt; v3.setFromMatrixPosition(h.m); v3.x += h.vx * dt; v3.y += h.vy * dt; v3.z += h.vz * dt; if (v3.y < (e.y || 0) + 0.05) { v3.y = (e.y || 0) + 0.05; h.vy = 0; h.vx *= 0.8; h.vz *= 0.8; h.sp *= 0.8; } const rot = new T.Matrix4().makeRotationX(h.sp * dt).multiply(new T.Matrix4().makeRotationZ(h.sp * dt * 0.6)); h.m.multiply(rot); h.m.setPosition(v3); if (h.t > 3) { c.hatGone = true; } }
      }
      function updCard(c, dt) {
        if (c.st === 'rise') { c.up = Math.min(1, c.up + dt * 5); if (c.up >= 1) c.st = 'up'; }
        else if (c.st === 'up') { c.left -= dt * G.turbo; if (c.left <= 0) { c.st = 'fall'; if (c.kind !== 'civ') G.rangeOk = false; } }
        else if (c.st === 'fall') { c.up = Math.max(0, c.up - dt * (c.hit ? 7 : 4)); if (c.up <= 0) { c.st = 'gone'; c.mesh.visible = false; } }
        if (c.mv && (c.st === 'up' || c.st === 'rise')) c.mesh.position.x = c.x0 + Math.sin(G.stopT * c.mv[1] + c.mv[2]) * c.mv[0];
        c.mesh.rotation.x = -Math.PI / 2 * (1 - c.up); c.mesh.visible = c.up > 0.02;
      }
      // ---- the end of a mission
      function missionDone() {
        if (G.done) return;
        G.done = 'win'; G.endT = Math.max(G.endT, 1.2); music(null);
        if (!G.demo) { snd.win(); say('MISSION COMPLETE', G.M.n, 3, '#9aff9a'); }
      }
      function missionFail(why) {
        if (G.done) return;
        G.done = 'fail'; G.why = why; G.endT = 2.2; music(null); snd.fail(); say('MISSION FAILED', why, 3, '#ff6a5a');
      }

      // ================================================================ the play step
      cam.rotation.order = 'YXZ';
      const top = hud.canvas;
      const onMove = ev => { const r = top.getBoundingClientRect(); if (!r.width) return; const nx = clamp((ev.clientX - r.left) / r.width * 2 - 1, -1, 1), ny = clamp((ev.clientY - r.top) / r.height * 2 - 1, -1, 1); if (ev.pointerType === 'mouse') { mouse = true; mpos[0] = nx; mpos[1] = ny; } };
      const onDown = ev => { if (ev.pointerType !== 'mouse') return; onMove(ev); if (ev.button === 2) return; clicked = true; mdown = true; };
      const onUp = ev => { if (ev.pointerType === 'mouse') mdown = false; };
      const mpos = [0, 0]; let mdown = false;
      top.addEventListener('pointermove', onMove); top.addEventListener('pointerdown', onDown); window.addEventListener('pointerup', onUp);
      const fovNow = () => 60 / (G ? G.zoom : 1);
      function aimTargets() { // the screen spots the auto-aim likes: chests and heads of henchmen, the middle of a card
        const L = [];
        for (const e of G.ents) if ((e.k === 'g' || e.k === 'boss') && e.st !== 'down' && e.st !== 'gone' && e.hid < 0.5 && !e.surrender) { const hy = (e.ch.y || 0) + (e.crouch ? 1.2 : 1.35) * (e.ch.sc || 1); const [x, y, on] = scr(e.x, hy, e.z); if (on) L.push([x * 2 - 1, y * 2 - 1, e]); }
        for (const c of G.cards) if (c.st === 'up' && c.kind !== 'civ') { const [x, y, on] = scr(c.mesh.position.x, 1.2 * c.mesh.scale.y, c.z); if (on) L.push([x * 2 - 1, y * 2 - 1, c]); }
        if (G.defuse && G.defuse.st === 'cut') { const w = SC.bomb.wires[G.defuse.seq[G.defuse.i]]; v3.setFromMatrixPosition(w.matrixWorld); const [x, y] = scr(v3.x, v3.y, v3.z); L.push([x * 2 - 1, y * 2 - 1, w]); }
        return L;
      }
      function steer(dt) {
        const gd = gunNow(), s = K.stick(), mag = Math.hypot(s.x, s.y), wantZoom = K.held('r') && !G.move;
        const aimSp = [1.05, 1.5, 2.1][SV.opt.aim | 0];
        if (mag > 0.08) mouse = false;
        // R: aim down the sight (the scope zooms in further the longer you hold it)
        if (wantZoom && G.zoom <= 1.01) { // (look where the crosshair was)
          const vf = 60 * D2R / 2, hf = Math.atan(Math.tan(vf) * W / H);
          G.yawOff -= Math.atan(aimX * Math.tan(hf)); G.pitch -= Math.atan(aimY * Math.tan(vf)); aimX = aimY = 0;
        }
        const zt = wantZoom ? (gd.scope ? Math.min(gd.zoom, Math.max(2, G.zoom + dt * 5)) : gd.zoom) : 1;
        G.zoom += (zt - G.zoom) * Math.min(1, dt * (gd.scope && wantZoom ? 4 : 12)); if (!wantZoom && G.zoom < 1.02) G.zoom = 1;
        const st = G.M.stops[G.si], span = (st ? st.span : 30) * D2R, plo = G.defuse ? -0.9 : (st && st.pitchLo != null ? st.pitchLo : -16) * D2R;
        if (G.zoom > 1.05) {
          let tx = s.x, ty = s.y; if (mouse) { tx = Math.abs(mpos[0]) > 0.1 ? mpos[0] : 0; ty = Math.abs(mpos[1]) > 0.1 ? mpos[1] : 0; }
          const k = (0.35 + 0.65 * Math.pow(Math.min(1, Math.hypot(tx, ty)), 1.5)) * 1.1 / G.zoom;
          G.yawOff -= tx * dt * k * aimSp * 0.9; G.pitch -= ty * dt * k * aimSp * 0.65;
        } else if (mouse) { aimX += (mpos[0] - aimX) * Math.min(1, dt * 30); aimY += (mpos[1] - aimY) * Math.min(1, dt * 30); }
        else {
          holdT = mag > 0.1 ? holdT + dt : 0;
          let sp = aimSp * (0.3 + 0.7 * Math.pow(Math.min(1, mag), 1.6)) * (holdT > 0.35 ? 1.3 : 1);
          if (SV.opt.assist && !G.move) { // stick-friendly: slow down over a target, then a gentle pull onto it
            let best = null, bd = 0.16; for (const t of aimTargets()) { const dd = Math.hypot(t[0] - aimX, (t[1] - aimY) * 0.75); if (dd < bd) { bd = dd; best = t; } }
            if (best) { if (mag > 0.1) sp *= 0.55; else { aimX += (best[0] - aimX) * Math.min(1, dt * 3); aimY += (best[1] - aimY) * Math.min(1, dt * 3); } }
          }
          aimX = clamp(aimX + s.x * dt * sp, -1, 1); aimY = clamp(aimY + s.y * dt * sp, -1, 1);
        }
        // the crosshair at the edge turns your head (like the real thing)
        if (G.zoom <= 1.05) { if (Math.abs(aimX) > 0.74) G.yawOff -= Math.sign(aimX) * (Math.abs(aimX) - 0.74) / 0.26 * dt * 1.5; if (Math.abs(aimY) > 0.7) G.pitch -= Math.sign(aimY) * (Math.abs(aimY) - 0.7) / 0.3 * dt * 0.9; }
        G.yawOff = clamp(G.yawOff, -span, span); G.pitch = clamp(G.pitch, plo, 0.32);
      }
      function autopilot(dt) { // the attract-mode agent
        const L = aimTargets(); let best = null, bd = 9; for (const t of L) { const dd = Math.hypot(t[0] - aimX, t[1] - aimY); if (dd < bd) { bd = dd; best = t; } }
        if (best) { aimX += clamp(best[0] - aimX, -dt * 1.6, dt * 1.6); aimY += clamp(best[1] - aimY, -dt * 1.6, dt * 1.6); if (bd < 0.04 && G.fireCD <= 0 && Math.random() < 0.3) fire(); }
        else { aimX *= 1 - dt; aimY += (0.05 - aimY) * dt; }
        const g = G.guns[G.gun]; if (g.mag <= 0 && G.rel <= 0) { if (g.res > 0 || cheat('ammo')) reload(); else if (G.swapT <= 0) cycleGun(); }
      }
      function camUpdate(dt) {
        const M = G.M, st = M.stops[Math.max(0, G.si)];
        let yaw = st.yaw * D2R + G.yawOff, roll = 0;
        if (G.move) {
          const mv = G.move; mv.t += dt; const k = ease(mv.t / mv.dur);
          cam.position.lerpVectors(mv.from, mv.to, k); cam.position.y += Math.abs(Math.sin(mv.t * 7)) * 0.06; G.bob += dt;
          yaw = lerp(mv.yaw0, st.yaw * D2R, k); G.pitch *= 1 - Math.min(1, dt * 3); aimX *= 1 - Math.min(1, dt * 3); aimY *= 1 - Math.min(1, dt * 3);
          if (mv.pitchTo != null) G.pitch = lerp(mv.pitch0, mv.pitchTo, k);
          if (mv.t >= mv.dur) { G.move = null; G.yawOff = yaw - st.yaw * D2R; if (mv.then) mv.then(); }
        }
        if (M.train) roll = Math.sin(G.t * 1.7) * 0.012 * (SC.scen ? SC.scen.v / 26 : 0) + (Math.random() < 0.01 ? 0.01 : 0);
        let sx = 0, sy = 0; if (shake > 0) { sx = (Math.random() - 0.5) * shake * 0.12; sy = (Math.random() - 0.5) * shake * 0.12; }
        cam.rotation.set(G.pitch + sy + G.kick * 0.012, yaw + sx, roll);
        cam.fov = fovNow(); cam.updateProjectionMatrix();
      }
      let clearT = 0;
      function playUpdate(dt) {
        const M = G.M;
        if (G.done) { G.endT -= dt; if (G.endT <= 0) { if (G.demo) return goTitle(); return toDebrief(); } }
        else G.t += dt;
        // the gun
        const gd = gunNow(), gs = G.guns[G.gun];
        G.fireCD = Math.max(0, G.fireCD - dt); G.kick = Math.max(0, G.kick - dt * 6); G.flashT -= dt; if (G.flashT <= 0) flashL.intensity = 0;
        if (G.swapT > 0) G.swapT -= dt;
        if (G.rel > 0) { G.rel -= dt; if (G.rel <= 0) finishReload(); }
        if (!G.done) {
          if (G.demo || DBG.auto) autopilot(dt);
          else {
            steer(dt);
            const trig = K.pressed('a') || clicked || (gd.auto && (K.held('a') || mdown));
            if (trig && !G.move) fire();
            if (K.pressed('b')) reload();
            if (K.pressed('l') && !G.move) cycleGun();
            if (gs.mag <= 0 && G.rel <= 0 && (gs.res > 0 || cheat('ammo')) && G.fireCD <= 0) reload();
          }
        }
        clicked = false;
        camUpdate(dt);
        // the stop's script
        if (!G.move) G.stopT += dt;
        if (G.plan && !G.move) for (const p of G.plan) if (!p.done && G.stopT >= p.s[0]) { if (spawn(p) !== false) p.done = true; }
        for (const e of G.ents) updEnt(e, dt);
        for (let i = G.ents.length - 1; i >= 0; i--) { const e = G.ents[i]; if (e.st === 'gone') { crowd.give(e.slot); G.ents.splice(i, 1); } }
        for (const c of G.cards) updCard(c, dt);
        for (const p of G.picks) if (!p.got) p.mesh.rotation.y += dt * 1.5;
        // special rules
        if (M.bomb && !G.done) {
          if (!(G.defuse && G.defuse.st === 'safe')) { const before = Math.ceil(G.bombT); G.bombT -= dt; if (Math.ceil(G.bombT) !== before && G.bombT < 11) snd.beep(); }
          if (G.bombT <= 0) { G.bombT = 0; const b = SC.bomb.g.position; for (let i = 0; i < 4; i++) puff(b.x + (Math.random() - 0.5) * 3, 1 + Math.random() * 2, b.z + (Math.random() - 0.5) * 3, [0xffd040, 0xff7020, 0x3a3a3a][i % 3], 30, 9, 3, 1.2); snd.boom(); shake = 0.8; hurtFlash = 1; missionFail('THE BOMB WENT OFF'); }
          drawBomb();
        }
        if (M.kind === 'sniper' && !G.done) {
          G.clock -= dt; if (G.clock <= 0) { G.clock = 0; missionFail('OUT OF TIME'); }
          if (!G.alarmOn) { G.alarm = Math.max(0, G.alarm - dt * 0.03); if (G.alarm >= 1) { G.alarmOn = true; say('ALARM!', 'THEY KNOW YOU ARE UP THERE', 2.4, '#ff6a5a'); } }
          else if ((G.t * 0.8 | 0) !== ((G.t - dt) * 0.8 | 0)) snd.alarm();
        }
        if (M.train && SC.scen && G.lever) { SC.scen.v = Math.max(0, SC.scen.v - dt * 9); }
        // the defuse
        const D = G.defuse;
        if (D) {
          if (D.st === 'cut') { D.lt += dt; const on = (D.lt * 3 | 0) % 2 === 0; SC.bomb.lamp.material.color.setHex(on ? SC.bomb.cols[D.seq[D.i]] : 0x222222); }
          if (D.st === 'safe') { SC.bomb.lamp.material.color.setHex(0x3aff6a); D.t = (D.t || 0) + dt; if (D.t > 2.2) missionDone(); }
        }
        for (const d2 of SC.dyn) d2(dt, G.t);
        // on to the next position?
        if (!G.done && !G.move && G.si < M.stops.length) {
          const st = M.stops[G.si];
          if (st.bombStop && !D && G.plan.every(p => p.done) && !G.ents.some(e => e.k === 'g' && e.st !== 'down')) {
            G.defuse = { st: 'walk', seq: [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, 3), i: 0, lt: 0 };
            G.move = { from: cam.position.clone(), to: new T.Vector3(0, 1.85, -62.4), t: 0, dur: 2, yaw0: st.yaw * D2R + G.yawOff, pitch0: G.pitch, pitchTo: -0.62, then: () => { G.defuse.st = 'cut'; say('CUT THE WIRES!', 'SHOOT THE ONE THAT MATCHES THE LIGHT', 2.6); } };
            G.yawOff = 0;
          }
          if (stopClear()) { clearT += dt; if (clearT > (M.kind === 'range' ? 1.4 : 0.9)) { clearT = 0; if (G.si + 1 < M.stops.length) { if (M.kind !== 'range') say('AREA CLEAR', 'MOVING ON', 1.3, '#9aff9a'); } nextStop(); } }
          else clearT = 0;
        }
        // the crowd
        for (const e of G.ents) crowd.pose(e.slot, e.ch);
        crowd.flush();
        stepParts(dt);
        if (shake > 0) shake = Math.max(0, shake - dt * 1.6);
        if (hurtFlash > 0) hurtFlash -= dt;
        // the gun model: sway, bob, recoil, reload, swap
        const gm = gunHold; const rl = G.rel > 0 ? Math.sin(clamp(1 - G.rel / gd.rel, 0, 1) * Math.PI) : 0, sw = G.swapT > 0 ? Math.sin(G.swapT / 0.45 * Math.PI) : 0;
        const bob = G.move ? Math.sin(G.bob * 7) : 0;
        gm.position.set(0.19 + aimX * 0.05 + bob * 0.01, -0.155 - aimY * 0.04 - rl * 0.12 - sw * 0.25 + Math.abs(bob) * 0.012, -0.4 + G.kick * 0.035);
        gm.rotation.set(-aimY * 0.32 + G.kick * 0.1 + rl * 0.9 + 0.04, 0.17 - aimX * 0.42, rl * 0.4 + bob * 0.02 - 0.06);
        gm.visible = !(gd.scope && G.zoom > 1.6) && !G.done;
        if (gunModel) { gunModel.fl.visible = G.flashT > 0; gunModel.fl.rotation.z = Math.random() * 3; }
        if (cheat('disco')) { const h = (G.t * 0.25) % 1; lit.hemi.color.setHSL(h, 0.8, 0.6); scene.fog.color.setHSL((h + 0.5) % 1, 0.6, 0.4); }
        if (G.demo && G.t > 30) goTitle();
      }
      function drawBomb() {
        const b = SC.bomb; if (!b) return; const s = mmss(G.bombT) + '.' + Math.floor((G.bombT % 1) * 10); if (s === b.last) return; b.last = s;
        const g = b.dispC.getContext('2d'); g.fillStyle = '#100404'; g.fillRect(0, 0, 64, 24); g.fillStyle = G.bombT < 10 && (G.t * 4 | 0) % 2 ? '#ff8060' : '#ff3020'; g.font = 'bold 18px monospace'; g.textAlign = 'center'; g.fillText(s, 32, 19); b.dispT.needsUpdate = true;
      }

      // ================================================================ the debrief (and the score the server checks)
      let DB = null;
      const MEDAL = ['NONE', 'BRONZE', 'SILVER', 'GOLD'], MCOL = ['#6a6a6a', '#c87a3a', '#c8ccd8', '#f0c030'];
      const blocking = () => CHEATS.some(c => !c.fun && cheat(c.id));
      function toDebrief() {
        const M = G.M, win = G.done === 'win', d = G.d, mul = DK[d].mul, acc = G.shots ? G.hits / G.shots : 0;
        const rows = [['TIME', mmss(G.t)], ['SHOTS FIRED', G.shots], ['ACCURACY', Math.round(acc * 100) + '%'], [M.kind === 'range' ? 'TARGETS' : 'TAKEN OUT', M.kind === 'range' ? G.cardsHit + ' / ' + G.cardsAll : G.kills], [M.kind === 'range' ? 'BULLSEYES' : 'HEADSHOTS', G.heads]];
        if (G.hats) rows.push(['HATS KNOCKED OFF', G.hats]);
        rows.push([M.civ === 'worker' ? 'WORKERS HIT' : M.civ === 'pass' ? 'PASSENGERS HIT' : M.civ === 'parka' ? 'OUR MAN HIT' : 'CIVILIANS HIT', G.civHit]);
        let raw = Math.max(0, G.score); const bonus = [];
        if (win) {
          const accB = Math.round(acc * 1500), timeB = M.bomb ? Math.round(G.bombT * 25) : M.kind === 'sniper' ? Math.round(G.clock * 15) : Math.max(0, Math.round((M.par - G.t) * 12));
          const hpB = M.kind === 'range' ? 0 : Math.round(G.hp * 6 + G.armour * 2), civB = G.civHit ? 0 : 500;
          bonus.push(['ACCURACY BONUS', accB], [M.bomb ? 'TIME LEFT BONUS' : 'TIME BONUS', timeB], ['HEALTH BONUS', hpB], ['CLEAN HANDS BONUS', civB]);
          raw += accB + timeB + hpB + civB;
        } else raw = Math.round(raw * 0.5);
        const total = Math.round(raw * mul);
        let medal = win ? (raw >= M.medal[1] && !G.civHit ? 3 : raw >= M.medal[0] ? 2 : 1) : 0;
        const noMedal = medal && blocking(); if (noMedal) medal = 0;
        const ms = MS(M.id); const pb = total > (ms.s[d] | 0);
        ms.s[d] = Math.max(ms.s[d] | 0, total); ms.md[d] = Math.max(ms.md[d] | 0, medal); if (win) ms.ok[d] = 1;
        let newMission = '', newCheat = '', newDiff = '';
        if (win && G.mi + 1 < MISSIONS.length && SV.open < G.mi + 2) { SV.open = G.mi + 2; newMission = MISSIONS[G.mi + 1].n; }
        if (win && d < 2 && !(ms.ok[d + 1])) newDiff = DIFFS[d + 1];
        const CH = CHEATS[G.mi]; if (medal === 3 && CH && !SV.got[CH.id]) { SV.got[CH.id] = 1; newCheat = CH.n; }
        if (win && M.kind === 'range' && G.rangeOk && !G.civHit && G.cardsHit >= G.cardsAll) K.secret('rm.range.gold');
        if (win && M.boss) K.secret('rm.range.klaxon');
        SV.top.push({ s: total, m: M.n, d }); SV.top.sort((a, b) => b.s - a.s); SV.top.length = Math.min(SV.top.length, 8);
        if (M.kind === 'range') SV.best[0] = Math.max(SV.best[0] | 0, total);
        SV.back = Date.now(); SV.last = G.mi; save();
        const send = Math.max(0, Math.min(total, 60000, Math.floor(590 * (K.t + 2))));
        DB = { win, rows, bonus, raw, total, send, medal, noMedal, newMission, newCheat, newDiff, pb, why: G.why || '', M, d };
        for (const e of G.ents) crowd.give(e.slot); G.ents.length = 0; crowd.flush();
        mode = 'debrief'; mt = 0; music(win ? 'menu' : null); if (medal) setTimeout(() => { if (mode === 'debrief') snd.medal(); }, 1600);
      }

      // ================================================================ menus, the title, attract mode
      let mode = 'title', mt = 0, sel = 0, msel = 0, dsel = 0, psel = 0, paused = false, page = 0, fromAttract = false, code = [], flyT = 0, flyMi = 1, hover = 0;
      function goTitle() {
        if (G) { for (const e of G.ents) crowd.give(e.slot); for (const c of G.cards) disposeCard(c); G = null; crowd.flush(); }
        mode = 'title'; mt = 0; paused = false; fromAttract = false;
        flyMi = [1, 2, 3, 6, 5][(Math.random() * Math.min(5, SV.open)) | 0] || 1; if (flyMi >= SV.open) flyMi = 1; loadScene(flyMi); flyT = 0;
        music('title');
      }
      function flyCam(dt) { // a slow fly-through of the loaded place for the menus
        if (!SC) return; const M = MISSIONS[SC.mi], L = M.stops; flyT += dt * 0.05;
        const n = L.length, f = (flyT % 1) * Math.max(1, n - 1), i = Math.min(n - 1, f | 0), j = Math.min(n - 1, i + 1), k = ease(f - i);
        const a = L[i], b = L[j]; cam.position.set(lerp(a.p[0], b.p[0], k) + Math.sin(flyT * 9) * 1.2, (a.y || 1.65) + 1.4 + Math.sin(flyT * 5) * 0.6, lerp(a.p[1], b.p[1], k));
        cam.rotation.set(-0.06, lerp(a.yaw, b.yaw, k) * D2R + Math.sin(flyT * 7) * 0.35, 0); cam.fov = 60; cam.updateProjectionMatrix();
        for (const d2 of SC.dyn) d2(dt, K.t);
      }
      const press = () => K.pressed('a') || K.pressed('start') || (clicked && !(clicked = false));
      const MAIN = ['MISSIONS', 'CHEATS', 'TOP AGENTS', 'OPTIONS', 'HOW TO PLAY'];
      const unlocked = i => i < SV.open;
      const diffOpen = (mi, d) => d === 0 || !!MS(MISSIONS[mi].id).ok[d - 1];
      function updMenus(dt) {
        flyCam(dt); stepParts(dt);
        const up = K.pressed('up'), dn = K.pressed('down'), lf = K.pressed('left'), rt = K.pressed('right'), back = K.pressed('b');
        if (mode === 'title') {
          for (const b of ['l', 'r']) if (K.pressed(b)) { code.push(b); code = code.slice(-6); if (code.join('') === 'llrrlr') { SV.got.paint = 1; SV.ch.paint = !SV.ch.paint; save(); snd.medal(); popTxt(0.5, 0.62, SV.ch.paint ? 'PAINTBALL MODE ON!' : 'PAINTBALL MODE OFF', '#ff5aa8', 2); } }
          if (press()) { snd.ok(); mode = 'main'; mt = 0; sel = 0; return; }
          if (mt > 10) { mode = 'top'; mt = 0; fromAttract = true; }
          return;
        }
        if (mode === 'top') { if (fromAttract) { if (K.any() || clicked) { clicked = false; goTitle(); return; } if (mt > 6) { startMission(1, 0, true); mode = 'play'; } return; } if (back || press()) { snd.back(); mode = 'main'; mt = 0; } return; }
        if (mode === 'main') {
          if (up) { sel = (sel + MAIN.length - 1) % MAIN.length; snd.move(); } if (dn) { sel = (sel + 1) % MAIN.length; snd.move(); }
          if (back) { snd.back(); goTitle(); return; }
          if (press()) { snd.ok(); mt = 0; if (sel === 0) { mode = 'missions'; msel = Math.min(SV.open - 1, msel); hover = 0; music('menu'); } else if (sel === 1) { mode = 'cheats'; sel = 0; } else if (sel === 2) { mode = 'top'; fromAttract = false; } else if (sel === 3) { mode = 'options'; sel = 0; } else { mode = 'howto'; page = 0; } }
          return;
        }
        if (mode === 'missions') {
          if (up) { msel = (msel + MISSIONS.length - 1) % MISSIONS.length; snd.move(); hover = 0; } if (dn) { msel = (msel + 1) % MISSIONS.length; snd.move(); hover = 0; }
          hover += dt; if (hover > 0.45 && unlocked(msel) && (!SC || SC.mi !== msel)) { loadScene(msel); flyT = 0; }
          if (back) { snd.back(); mode = 'main'; sel = 0; music('title'); return; }
          if (press()) { if (!unlocked(msel)) { snd.no(); return; } snd.ok(); loadScene(msel); mode = 'diff'; mt = 0; dsel = 0; for (let d = 2; d >= 0; d--) if (diffOpen(msel, d) && !MS(MISSIONS[msel].id).ok[d]) { dsel = d; break; } }
          return;
        }
        if (mode === 'diff') {
          if (up) { dsel = (dsel + 2) % 3; snd.move(); } if (dn) { dsel = (dsel + 1) % 3; snd.move(); }
          if (back) { snd.back(); mode = 'missions'; return; }
          if (press()) { if (!diffOpen(msel, dsel)) { snd.no(); return; } snd.ok(); mode = 'brief'; mt = 0; }
          return;
        }
        if (mode === 'brief') {
          if (back) { snd.back(); mode = 'diff'; return; }
          if (mt > 0.3 && press()) { snd.ok(); startMission(msel, dsel, false); mode = 'play'; mt = 0; }
          return;
        }
        if (mode === 'cheats') {
          if (up) { sel = (sel + CHEATS.length - 1) % CHEATS.length; snd.move(); } if (dn) { sel = (sel + 1) % CHEATS.length; snd.move(); }
          if (back) { snd.back(); mode = 'main'; sel = 1; save(); return; }
          if (press() || lf || rt) { const c = CHEATS[sel]; if (!SV.got[c.id]) { snd.no(); return; } SV.ch[c.id] = !SV.ch[c.id]; snd.ok(); save(); }
          return;
        }
        if (mode === 'options') {
          const n = 4; if (up) { sel = (sel + n - 1) % n; snd.move(); } if (dn) { sel = (sel + 1) % n; snd.move(); }
          if (back) { snd.back(); mode = 'main'; sel = 3; save(); return; }
          if (press() || lf || rt) {
            const dir = lf ? -1 : 1; snd.ok();
            if (sel === 0) { SV.opt.music = SV.opt.music ? 0 : 1; music(song || 'title'); }
            if (sel === 1) SV.opt.aim = ((SV.opt.aim | 0) + dir + 3) % 3;
            if (sel === 2) SV.opt.assist = SV.opt.assist ? 0 : 1;
            if (sel === 3) SV.opt.shake = SV.opt.shake ? 0 : 1;
            save();
          }
          return;
        }
        if (mode === 'howto') {
          if (back) { snd.back(); mode = 'main'; sel = 4; return; }
          if (press() || lf || rt) { snd.move(); page = (page + (lf ? 1 : 1)) % 2; }
          return;
        }
        if (mode === 'debrief') {
          if (mt > 1.5 && press()) { mode = 'sent'; K.over(DB.send, { title: DB.win ? 'MISSION COMPLETE' : 'MISSION FAILED', text: `${DB.M.n} - ${DIFFS[DB.d]}${DB.medal ? ' - ' + MEDAL[DB.medal] + ' MEDAL' : ''}` }); }
          return;
        }
      }
      function updPause() {
        const L = pauseItems();
        if (K.pressed('up')) { psel = (psel + L.length - 1) % L.length; snd.move(); } if (K.pressed('down')) { psel = (psel + 1) % L.length; snd.move(); }
        if (K.pressed('start') || K.pressed('b')) { paused = false; music(G.M.music); return; }
        if (K.pressed('a') || (clicked && !(clicked = false))) {
          const it = L[psel]; snd.ok();
          if (it === 'RESUME') { paused = false; music(G.M.music); }
          else if (it === 'RESTART MISSION') { paused = false; startMission(G.mi, G.d, false); }
          else if (it === 'ABORT MISSION') { paused = false; const mi = G.mi; for (const e of G.ents) crowd.give(e.slot); for (const c of G.cards) disposeCard(c); G = null; crowd.flush(); mode = 'missions'; msel = mi; music('menu'); }
          else { SV.opt.music = SV.opt.music ? 0 : 1; save(); }
        }
      }
      const pauseItems = () => ['RESUME', 'RESTART MISSION', 'ABORT MISSION', 'MUSIC: ' + (SV.opt.music ? 'ON' : 'OFF')];

      // ================================================================ drawing the 2D layer
      const LOGO = (() => { const c = document.createElement('canvas'); c.width = 640; c.height = 170; const g = c.getContext('2d');
        g.save(); g.translate(14, 0); g.transform(1, 0, -0.18, 1, 0, 0);
        g.font = '900 58px "Arial Black",Arial,sans-serif'; g.textBaseline = 'alphabetic';
        g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#0a0a12'; g.strokeText('GOLDENBALLS', 30, 86);
        const gr = g.createLinearGradient(0,30,0,90);gr.addColorStop(0,'#fff6ba');gr.addColorStop(.45,'#e0ae4b');gr.addColorStop(.5,'#926024');gr.addColorStop(1,'#ffe6a0');g.fillStyle=gr;g.fillText('GOLDENBALLS',30,86);
        g.restore();
        g.fillStyle = '#c01a1a'; g.fillRect(70, 112, 360, 34); g.fillStyle = '#0a0a12'; g.fillRect(70, 146, 360, 4);
        g.font = 'bold 26px Arial,sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('T A R G E T   R A N G E', 250, 138);
        return c; })();
      const mates = (() => { const c = id => { try { return window.Cast && Cast.first ? Cast.first(id) : null; } catch (e) { return null; } };
        return [['DAVE', 9800, 'THE DAM'], ['LUKE', 8700, 'THE BUNKER'], ['CALLUM', 7900, 'BOMB DEFUSE'], ['JACKK', 7200, 'FIRING RANGE'], [String(c('kidEp1') || 'RYAN').toUpperCase(), 6100, 'THE ARMOURED TRAIN'], [String(c('cousin') || 'KIM').toUpperCase(), 5400, 'SNIPER RIDGE']]; })();
      const myName = () => { try { return (window.Net && Net.me && Net.me.member && Net.me.nick) ? String(Net.me.nick).toUpperCase().slice(0, 10) : 'YOU'; } catch (e) { return 'YOU'; } };
      function folder(g, x, y, w, h, tab) {
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x + 4, y + 4, w, h);
        g.fillStyle = '#b89a5a'; g.fillRect(x + 8, y - 9, 70, 12); g.fillStyle = '#d4b878'; g.fillRect(x, y, w, h); g.fillStyle = '#c4a86a'; g.fillRect(x, y, w, 3);
        g.fillStyle = '#f2ead2'; g.fillRect(x + 6, y + 6, w - 12, h - 12); g.fillStyle = 'rgba(160,140,100,.25)'; for (let yy = y + 18; yy < y + h - 8; yy += 10) g.fillRect(x + 10, yy, w - 20, 1);
        if (tab) F.draw(g, tab, x + 12, y - 7, '#3a2a10', 1);
      }
      function stamp(g, x, y, s, col, rot) { g.save(); g.translate(x, y); g.rotate(rot || -0.2); g.strokeStyle = col || '#c01a1a'; g.lineWidth = 2; const w = F.width(s) + 8; g.strokeRect(-w / 2, -7, w, 14); F.center(g, s, 0, -3, col || '#c01a1a', 1); g.restore(); }
      function medalIcon(g, x, y, m, r) { r = r || 4; g.fillStyle = m ? '#1a1a1a' : 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + 0.5, y + 0.5, r + 1, 0, TAU); g.fill(); g.fillStyle = MCOL[m]; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); if (m) { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x - r * 0.5, y - r * 0.6, r * 0.5, r * 0.4); } }
      function bigMedal(g, x, y, m, t) {
        const s = clamp(t * 3, 0, 1); if (s <= 0) return; g.save(); g.translate(x, y); g.scale(s, s);
        g.fillStyle = '#c01a1a'; g.beginPath(); g.moveTo(-10, -26); g.lineTo(-4, -2); g.lineTo(4, -2); g.lineTo(10, -26); g.fill(); g.fillStyle = '#1a3ab0'; g.fillRect(-3, -26, 6, 22);
        medalIcon(g, 0, 8, m, 13); F.center(g, String(['', 'III', 'II', 'I'][m]), 0, 5, '#3a2a10', 1); g.restore();
      }
      function shadowText(g, s, x, y, col, k) { F.center(g, s, x, y, col, k || 1, '#000'); }
      function drawCross(g) {
        const gd = gunNow(), scoped = gd.scope && G.zoom > 1.6, aimed = G.zoom > 1.05;
        if (scoped) {
          const r = H * 0.46; g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, W, H); g.arc(W / 2, H / 2, r, 0, TAU, true); g.fill();
          const gr = g.createRadialGradient(W / 2, H / 2, r * 0.75, W / 2, H / 2, r); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = gr; g.beginPath(); g.arc(W / 2, H / 2, r, 0, TAU); g.fill();
          g.fillStyle = '#000'; g.fillRect(W / 2 - r, H / 2, r * 2, 1); g.fillRect(W / 2, H / 2 - r, 1, r * 2); g.fillRect(W / 2 - r, H / 2 - 1, r * 0.55, 3); g.fillRect(W / 2 + r * 0.45, H / 2 - 1, r * 0.55, 3); g.fillRect(W / 2 - 1, H / 2 + r * 0.45, 3, r * 0.55);
          for (let i = -4; i <= 4; i++) if (i) { g.fillRect(W / 2 + i * 12 - 1, H / 2 - 1, 2, 3); g.fillRect(W / 2 - 1, H / 2 + i * 12 - 1, 3, 2); }
          F.draw(g, G.zoom.toFixed(1) + 'X', W / 2 + r * 0.55, H / 2 + r * 0.62, '#c8e8c8', 1);
          g.fillStyle = '#ff3a2a'; g.fillRect(W / 2 - 1, H / 2 - 1, 3, 3);
          return;
        }
        const cx = aimed ? W / 2 : (aimX + 1) / 2 * W, cy = aimed ? H / 2 : (aimY + 1) / 2 * H;
        let onT = false; for (const t of aimTargets()) if (Math.hypot((t[0] + 1) / 2 * W - cx, (t[1] + 1) / 2 * H - cy) < 9) onT = true;
        const col = onT ? '#ffe04a' : '#ff3a2a', gap = 3 + (G.fireCD > 0 ? 2 : 0) + (gd.auto && K.held('a') ? 2 : 0);
        g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(cx - gap - 6, cy, 6, 2); g.fillRect(cx + gap + 1, cy, 6, 2); g.fillRect(cx, cy - gap - 6, 2, 6); g.fillRect(cx, cy + gap + 1, 2, 6);
        g.fillStyle = col; g.fillRect(cx - gap - 6, cy - 1, 6, 2); g.fillRect(cx + gap + 1, cy - 1, 6, 2); g.fillRect(cx - 1, cy - gap - 6, 2, 6); g.fillRect(cx - 1, cy + gap + 1, 2, 6);
        if (aimed) { g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, 10, 0, TAU); g.stroke(); }
      }
      function drawPlayHud() {
        const g = hud, M = G.M, gd = gunNow(), gs = G.guns[G.gun];
        drawCross(g);
        // warnings: a red ! over anybody about to shoot (an arrow at the edge if they're off to the side)
        for (const e of G.ents) if ((e.k === 'g' || e.k === 'boss') && ((e.st === 'aim' && e.warn < 0.65 && !G.move && !e.surrender && !(M.kind === 'sniper' && !G.alarmOn && e.how === 'stand')) || e.st === 'fire')) {
          const [x, y, on] = scr(e.x, (e.ch.y || 0) + 2.2, e.z);
          if (on && x > 0.02 && x < 0.98 && y > 0.04) { if ((K.frame >> 2) % 2 || e.st === 'fire') F.center(g, '!', x * W, y * H - 6, '#ff2a1a', 2, '#000'); }
          else { const left = on ? x < 0.5 : wrapA(Math.atan2(e.x - cam.position.x, e.z - cam.position.z) - cam.rotation.y + Math.PI) > 0; g.fillStyle = (K.frame >> 3) % 2 ? '#ff2a1a' : '#a01010'; g.beginPath(); if (left) { g.moveTo(4, H / 2); g.lineTo(14, H / 2 - 8); g.lineTo(14, H / 2 + 8); } else { g.moveTo(W - 4, H / 2); g.lineTo(W - 14, H / 2 - 8); g.lineTo(W - 14, H / 2 + 8); } g.fill(); }
        }
        // ammo
        F.draw(g, String(gs.mag), W - 46 - (gs.mag > 9 ? 12 : 0), H - 26, gs.mag ? '#ffffff' : '#ff6a5a', 2, '#000');
        F.draw(g, cheat('ammo') ? '/ --' : '/ ' + gs.res, W - 30, H - 19, '#c8c8c8', 1, '#000');
        const nb = Math.min(gd.mag, 15); for (let i = 0; i < nb; i++) { const full = i < gs.mag * nb / gd.mag; g.fillStyle = full ? '#e8c040' : '#4a3a18'; g.fillRect(W - 10 - i * 5, H - 38, 3, 8); g.fillStyle = full ? '#b07a18' : '#2a2010'; g.fillRect(W - 10 - i * 5, H - 32, 3, 2); }
        if (G.rel > 0) F.draw(g, 'RELOADING', W - 62, H - 48, '#fff', 1, '#000'); else if (!gs.mag && !gs.res && !cheat('ammo')) F.draw(g, 'EMPTY', W - 40, H - 48, '#ff6a5a', 1, '#000');
        // health and armour (two bars like the real thing had)
        if (M.kind !== 'range') {
          const bh = 54, by = H - 12 - bh; g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(6, by - 1, 7, bh + 2); g.fillRect(15, by - 1, 7, bh + 2);
          const hk = G.hp / 100, ak = G.armour / 100; g.fillStyle = hk < 0.3 && (K.frame >> 3) % 2 ? '#ff8a6a' : '#d82a1a'; g.fillRect(7, by + bh * (1 - hk), 5, bh * hk); g.fillStyle = '#3a7ae8'; g.fillRect(16, by + bh * (1 - ak), 5, bh * ak);
          F.draw(g, '+', 7, H - 10, '#ff6a5a', 1); F.draw(g, 'A', 16, H - 10, '#7ab0ff', 1);
        }
        // the clock and the mission bits
        if (M.bomb) { const s = mmss(G.bombT); F.center(g, s, W / 2, 6, G.bombT < 15 && (K.frame >> 3) % 2 ? '#ffffff' : '#ff3a2a', 2, '#000'); if (G.defuse && G.defuse.st === 'cut') F.center(g, 'WIRE ' + (G.defuse.i + 1) + ' OF 3: MATCH THE LIGHT', W / 2, 24, '#ffd84a', 1, '#000'); }
        else if (M.kind === 'sniper') { F.center(g, mmss(G.clock), W / 2, 6, G.clock < 20 ? '#ff6a5a' : '#fff', 2, '#000'); F.draw(g, 'LOOKOUTS ' + G.kills + '/' + G.need, 6, 6, '#9ad0ff', 1, '#000'); F.draw(g, 'ALARM', 6, 16, G.alarmOn ? '#ff3a2a' : '#ddd', 1, '#000'); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(40, 16, 52, 7); g.fillStyle = G.alarmOn ? '#ff3a2a' : '#f0a020'; g.fillRect(41, 17, 50 * Math.min(1, G.alarm), 5); }
        else F.draw(g, mmss(G.t), 6, 6, '#fff', 1, '#000');
        if (M.kind === 'range') { const st = M.stops[Math.max(0, G.si)]; F.draw(g, 'PHASE ' + (G.si + 1) + ': ' + st.phase, W - F.width('PHASE 1: ' + st.phase) - 6, 6, '#9ad0ff', 1, '#000'); F.draw(g, 'TARGETS ' + G.cardsHit + '/' + G.cardsAll, 6, 16, '#ddd', 1, '#000'); }
        F.draw(g, 'SCORE ' + Math.max(0, G.score), 6, M.kind === 'sniper' ? 26 : M.kind === 'range' ? 26 : 16, '#fff', 1, '#000');
        const b = G.bossE; if (b && b.st !== 'down' && b.st !== 'gone') { const w = 120; F.center(g, 'DOCTOR KLAXON', W / 2, 6, '#ff9a8a', 1, '#000'); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(W / 2 - w / 2 - 1, 15, w + 2, 6); g.fillStyle = '#c01a6a'; g.fillRect(W / 2 - w / 2, 16, w * Math.max(0, b.hp) / b.maxHp, 4); }
        if (gd.scope && G.zoom < 1.05 && !G.move && G.t < 20 && !G.demo) F.center(g, 'HOLD ' + K.label('r') + ' TO ZOOM THE SCOPE', W / 2, H - 46, '#c8e8ff', 1, '#000');
        // pops, banners, flashes
        for (const p of pops) F.center(g, p.s, p.x * W, p.y * H - 14 - (1 - p.t) * 14, p.c, 1, '#000');
        if (banner) { const B = banner, a = Math.min(1, B.age * 4, (B.life - B.age) * 3); if (a > 0) { g.globalAlpha = a; g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 74, W, B.sub ? 36 : 24); F.center(g, B.t, W / 2, 78, B.col, 2, '#000'); if (B.sub) F.center(g, B.sub, W / 2, 98, '#fff', 1, '#000'); g.globalAlpha = 1; } }
        if (hurtFlash > 0) { const a = Math.min(0.55, hurtFlash); const gr = g.createRadialGradient(W / 2 + hurtSide * 90, H / 2, H * 0.25, W / 2, H / 2, H * 0.8); gr.addColorStop(0, 'rgba(200,0,0,0)'); gr.addColorStop(1, `rgba(220,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
        if (G.hp < 30 && M.kind !== 'range' && !G.done) { g.fillStyle = `rgba(160,0,0,${0.12 + Math.sin(K.t * 6) * 0.06})`; g.fillRect(0, 0, W, H); }
        if (G.demo) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, H - 22, W, 14); F.center(g, (K.frame >> 5) % 2 ? 'DEMO - PRESS START' : 'GOLDENBALLS', W / 2, H - 19, '#ffd84a', 1); }
        if (paused) {
          g.fillStyle = 'rgba(4,8,16,.72)'; g.fillRect(0, 0, W, H); folder(g, 60, 40, W - 120, H - 70, 'PAUSED');
          F.draw(g, M.n, 72, 52, '#1a1a1a', 1); F.draw(g, DIFFS[G.d], 72, 62, '#7a2a1a', 1);
          M.obj.forEach((o, i) => F.draw(g, String.fromCharCode(97 + i) + '. ' + o, 72, 76 + i * 9, '#4a4a4a', 1));
          pauseItems().forEach((s, i) => F.draw(g, (psel === i ? '→ ' : '  ') + s, 80, 112 + i * 13, psel === i ? '#c01a1a' : '#1a1a1a', 1));
          F.draw(g, 'SCORE SO FAR ' + Math.max(0, G.score), 72, H - 46, '#4a4a4a', 1);
        }
      }
      function drawMenus() {
        const g = hud;
        if (mode === 'title') {
          g.fillStyle = 'rgba(0,0,10,.25)'; g.fillRect(0, 0, W, H);
          const k = ease(mt / 0.8); g.globalAlpha = k; g.drawImage(LOGO, 10, 18 - (1 - k) * 30, 300, 80); g.globalAlpha = 1;
          if (mt > 1 && (K.t * 2 | 0) % 2) shadowText(g, 'PRESS START', W / 2, 150, '#ffffff', 1);
          shadowText(g, 'HI-SCORE ' + Math.max(K.best, SV.top[0] ? SV.top[0].s : 0), W / 2, 168, '#ffd84a', 1);
          shadowText(g, '(C) 1999 MOLEHILL SOFTWARE', W / 2, H - 14, '#b8b8c8', 1);
          return;
        }
        if (mode === 'top') {
          g.fillStyle = 'rgba(0,0,10,.55)'; g.fillRect(0, 0, W, H); folder(g, 40, 24, W - 80, H - 46, 'TOP AGENTS');
          const L = mates.map(([n, s, m]) => ({ n, s, m, mate: 1 })).concat(SV.top.slice(0, 5).map(t => ({ n: myName(), s: t.s, m: t.m }))).sort((a, b) => b.s - a.s).slice(0, 8);
          F.draw(g, 'NAME', 56, 38, '#7a2a1a', 1); F.draw(g, 'BEST MISSION', 130, 38, '#7a2a1a', 1); F.draw(g, 'SCORE', W - 92, 38, '#7a2a1a', 1);
          L.forEach((x, i) => { const y = 52 + i * 17, col = x.mate ? '#1a1a1a' : '#c01a1a'; F.draw(g, (i + 1) + '. ' + x.n, 50, y, col, 1); F.draw(g, x.m.slice(0, 16), 130, y, '#4a4a4a', 1); F.draw(g, String(x.s), W - 56 - F.width(String(x.s)), y, col, 1); });
          if (!fromAttract) F.center(g, 'PRESS ' + K.label('b') + ' TO GO BACK', W / 2, H - 34, '#6a5a3a', 1);
          return;
        }
        if (mode === 'main') {
          g.fillStyle = 'rgba(0,0,10,.3)'; g.fillRect(0, 0, W, H); g.drawImage(LOGO, 70, 8, 180, 48);
          folder(g, 90, 72, 140, 120, 'MAIN MENU');
          MAIN.forEach((s, i) => { const y = 88 + i * 18; F.draw(g, (sel === i ? '→ ' : '  ') + s, 102, y, sel === i ? '#c01a1a' : '#1a1a1a', 1); });
          F.draw(g, 'CHEATS ' + CHEATS.filter(c => SV.got[c.id]).length + '/7', 112, 176, '#6a5a3a', 1);
          shadowText(g, K.label('a') + ' CHOOSE   ' + K.label('b') + ' BACK', W / 2, H - 14, '#ddd', 1);
          return;
        }
        if (mode === 'missions' || mode === 'diff') {
          g.fillStyle = 'rgba(0,0,10,.25)'; g.fillRect(0, 0, W, H);
          folder(g, 8, 18, 186, H - 34, 'MISSIONS');
          MISSIONS.forEach((M, i) => { const y = 32 + i * 25, on = unlocked(i), cur = msel === i;
            if (cur) { g.fillStyle = 'rgba(192,26,26,.12)'; g.fillRect(14, y - 4, 174, 22); }
            F.draw(g, (i + 1) + '.', 18, y, cur ? '#c01a1a' : '#3a3a3a', 1);
            F.draw(g, on ? M.n : 'CLASSIFIED', 32, y, on ? (cur ? '#c01a1a' : '#1a1a1a') : '#9a8a6a', 1);
            if (on) { const ms = MS(M.id); for (let d = 0; d < 3; d++) medalIcon(g, 40 + d * 12, y + 13, ms.md[d] | 0, 3.5); if (ms.s.some(Boolean)) F.draw(g, 'BEST ' + Math.max(...ms.s), 82, y + 10, '#6a5a3a', 1); }
            else { const lx = 38 + F.width('CLASSIFIED'); g.fillStyle = '#7a6a4a'; g.fillRect(lx, y + 2, 7, 5); g.strokeStyle = '#7a6a4a'; g.beginPath(); g.arc(lx + 3.5, y + 2, 2.5, Math.PI, 0); g.stroke(); }
          });
          const M = MISSIONS[msel];
          if (unlocked(msel)) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(198, H - 44, W - 202, 30); F.draw(g, M.n, 202, H - 40, '#ffd84a', 1); F.draw(g, M.place.slice(0, 19), 202, H - 30, '#ddd', 1); F.draw(g, M.place.slice(19, 38), 202, H - 22, '#ddd', 1); }
          else { g.fillStyle = 'rgba(0,0,0,.75)'; g.fillRect(198, 18, W - 204, H - 34); stamp(g, 258, H / 2, 'CLASSIFIED', '#c01a1a', -0.3); F.center(g, 'FINISH MISSION ' + msel, 258, H / 2 + 20, '#aaa', 1); F.center(g, 'TO OPEN THIS ONE', 258, H / 2 + 30, '#aaa', 1); }
          if (mode === 'diff') {
            g.fillStyle = 'rgba(0,0,10,.55)'; g.fillRect(0, 0, W, H); folder(g, 70, 70, 180, 100, 'DIFFICULTY');
            F.draw(g, M.n, 82, 84, '#1a1a1a', 1);
            DIFFS.forEach((s, d) => { const y = 100 + d * 18, open = diffOpen(msel, d), ms = MS(M.id); F.draw(g, (dsel === d ? '→ ' : '  ') + s, 82, y, !open ? '#a89a7a' : dsel === d ? '#c01a1a' : '#1a1a1a', 1); medalIcon(g, 236, y + 3, ms.md[d] | 0, 3.5); if (!open && dsel === d) F.draw(g, 'FINISH ' + DIFFS[d - 1] + ' FIRST', 94, y + 9, '#7a2a1a', 1); });
          }
          else shadowText(g, K.label('a') + ' CHOOSE   ' + K.label('b') + ' BACK', 258, 6, '#ddd', 1);
          return;
        }
        if (mode === 'brief') {
          const M = MISSIONS[msel]; g.fillStyle = 'rgba(0,0,10,.4)'; g.fillRect(0, 0, W, H); folder(g, 16, 18, W - 32, H - 30, 'BRIEFING');
          F.draw(g, M.n, 28, 30, '#1a1a1a', 2); F.draw(g, DIFFS[dsel], 28, 48, '#7a2a1a', 1); stamp(g, W - 70, 40, 'TOP SECRET', '#c01a1a', -0.2);
          M.brief.forEach((s, i) => F.draw(g, s, 28, 64 + i * 10, '#2a2a2a', 1));
          F.draw(g, 'OBJECTIVES', 28, 110, '#7a2a1a', 1); M.obj.forEach((o, i) => F.draw(g, String.fromCharCode(97 + i) + '. ' + o, 34, 121 + i * 10, '#2a2a2a', 1));
          F.draw(g, 'EQUIPMENT', 28, 156, '#7a2a1a', 1); M.guns.forEach((id, i) => F.draw(g, GUNS[id].n, 34, 167 + i * 10, '#2a2a2a', 1));
          const ch = CHEATS.filter(c => cheat(c.id)); if (ch.length) F.draw(g, 'CHEATS ON: ' + ch.map(c => c.n).join(', ').slice(0, 40), 28, H - 36, blocking() ? '#c01a1a' : '#4a6a2a', 1);
          if ((K.t * 2 | 0) % 2) F.center(g, 'PRESS START TO BEGIN', W * 0.66, H - 24, '#1a1a1a', 1);
          return;
        }
        if (mode === 'cheats') {
          g.fillStyle = 'rgba(0,0,10,.5)'; g.fillRect(0, 0, W, H); folder(g, 30, 22, W - 60, H - 40, 'CHEATS');
          CHEATS.forEach((c, i) => { const y = 38 + i * 20, got = !!SV.got[c.id]; F.draw(g, (sel === i ? '→ ' : '  ') + (got ? c.n : '? ? ? ? ?'), 42, y, sel === i ? '#c01a1a' : got ? '#1a1a1a' : '#9a8a6a', 1);
            if (got) F.draw(g, SV.ch[c.id] ? 'ON' : 'OFF', W - 70, y, SV.ch[c.id] ? '#2a8a2a' : '#7a6a4a', 1); else F.draw(g, 'GOLD ON ' + MISSIONS[i].n, 54, y + 9, '#9a8a6a', 1); });
          F.center(g, 'SOME CHEATS STOP YOU WINNING MEDALS', W / 2, H - 30, '#7a2a1a', 1);
          return;
        }
        if (mode === 'options') {
          g.fillStyle = 'rgba(0,0,10,.5)'; g.fillRect(0, 0, W, H); folder(g, 50, 50, W - 100, 130, 'OPTIONS');
          const L = [['MUSIC', SV.opt.music ? 'ON' : 'OFF'], ['AIM SPEED', ['SLOW', 'NORMAL', 'FAST'][SV.opt.aim | 0]], ['AUTO-AIM', SV.opt.assist ? 'ON' : 'OFF'], ['SCREEN SHAKE', SV.opt.shake ? 'ON' : 'OFF']];
          L.forEach(([a, b], i) => { const y = 70 + i * 20; F.draw(g, (sel === i ? '→ ' : '  ') + a, 62, y, sel === i ? '#c01a1a' : '#1a1a1a', 1); F.draw(g, '< ' + b + ' >', W - 62 - F.width('< ' + b + ' >'), y, '#3a3a3a', 1); });
          F.center(g, 'AUTO-AIM HELPS WITH A STICK OR ARROWS', W / 2, 158, '#6a5a3a', 1);
          return;
        }
        if (mode === 'howto') {
          g.fillStyle = 'rgba(0,0,10,.5)'; g.fillRect(0, 0, W, H); folder(g, 14, 18, W - 28, H - 30, 'HOW TO PLAY ' + (page + 1) + '/2');
          const L = page === 0 ? [['AIM', 'ARROWS, THE STICK OR THE MOUSE'], ['FIRE', 'Z KEY, CLICK, OR ' + K.label('a')], ['RELOAD', 'X KEY OR ' + K.label('b')], ['AIM / ZOOM', 'HOLD E OR ' + K.label('r')], ['SWAP GUN', 'Q KEY OR ' + K.label('l')], ['PAUSE', 'ENTER OR START'], ['', ''], ['', 'PUSH THE CROSSHAIR TO THE EDGE'], ['', 'OF THE SCREEN TO LOOK ROUND.']]
            : [['!', 'A RED ! MEANS SOMEBODY IS ABOUT'], ['', 'TO SHOOT AT YOU. GET THEM FIRST.'], ['HEAD', 'HEADSHOTS SCORE EXTRA (HATS TOO!)'], ['DON\'T', 'NEVER SHOOT WORKERS, SCIENTISTS'], ['', 'OR PASSENGERS: -500 EACH'], ['BOXES', 'SHOOT GREEN BOXES FOR AMMO AND'], ['', 'BLUE ONES FOR BODY ARMOUR'], ['MEDALS', 'GOLD UNLOCKS A CHEAT. FINISH A'], ['', 'MISSION TO OPEN THE NEXT ONE.']];
          L.forEach(([a, b], i) => { const y = 36 + i * 17; F.draw(g, a, 28, y, '#7a2a1a', 1); F.draw(g, b, 96, y, '#1a1a1a', 1); });
          F.center(g, 'PRESS ' + K.label('a') + ' FOR THE NEXT PAGE', W / 2, H - 24, '#6a5a3a', 1);
          return;
        }
        if ((mode === 'debrief' || mode === 'sent') && DB) {
          g.fillStyle = 'rgba(0,0,10,.5)'; g.fillRect(0, 0, W, H); folder(g, 16, 18, W - 32, H - 30, 'DEBRIEF');
          F.draw(g, DB.M.n, 28, 30, '#1a1a1a', 1); F.draw(g, DIFFS[DB.d], 28, 40, '#7a2a1a', 1);
          stamp(g, W - 80, 36, DB.win ? 'COMPLETED' : 'FAILED', DB.win ? '#1a7a2a' : '#c01a1a', -0.15);
          const L = DB.rows.concat(DB.bonus); let y = 54;
          L.forEach(([a, b], i) => { if (mt > 0.15 + i * 0.12) { F.draw(g, a, 28, y + i * 9, '#3a3a3a', 1); F.draw(g, String(b), 184 - F.width(String(b)), y + i * 9, '#1a1a1a', 1); } });
          const ty = y + L.length * 9 + 4;
          if (mt > 0.3 + L.length * 0.12) { g.fillStyle = '#1a1a1a'; g.fillRect(28, ty - 2, 158, 1); F.draw(g, 'SCORE' + (DIFFS[DB.d] !== 'AGENT' ? ' X' + DK[DB.d].mul : ''), 28, ty + 2, '#7a2a1a', 1); F.draw(g, String(DB.total), 184 - F.width(String(DB.total)), ty + 2, '#c01a1a', 1); }
          if (!DB.win && DB.why) F.draw(g, DB.why, 28, H - 44, '#c01a1a', 1);
          if (DB.medal) { bigMedal(g, 248, 98, DB.medal, mt - 1.2); if (mt > 1.5) F.center(g, MEDAL[DB.medal] + ' MEDAL', 248, 126, '#3a2a10', 1); }
          else if (DB.noMedal) F.center(g, 'NO MEDALS WITH CHEATS', 248, 98, '#7a2a1a', 1);
          let ny = 138; for (const s of [DB.newMission && ['NEW MISSION:', DB.newMission], DB.newDiff && DB.win && ['NOW TRY', DB.newDiff], DB.newCheat && ['NEW CHEAT:', DB.newCheat], DB.pb && DB.total > 0 && ['A NEW BEST!', '']]) if (s && mt > 1.8) { F.center(g, s[0], 248, ny, '#1a5a1a', 1); if (s[1]) { ny += 9; F.center(g, s[1], 248, ny, '#c01a1a', 1); } ny += 12; }
          if (mode === 'debrief' && mt > 1.5 && (K.t * 2 | 0) % 2) F.center(g, 'PRESS START', 248, H - 30, '#1a1a1a', 1);
        }
      }

      // ================================================================ start up: straight back to the missions after "Play again"
      if (SV.back && Date.now() - SV.back < 20 * 60000) {
        const last = clamp(SV.last | 0, 0, MISSIONS.length - 1); delete SV.back; save();
        mode = 'missions'; mt = 0; msel = MS(MISSIONS[last].id).ok.some(Boolean) && last + 1 < SV.open ? last + 1 : last; loadScene(Math.min(msel, SV.open - 1)); flyT = 0; music('menu');
      } else goTitle();
      window.__rangeDbg = { DBG, get G() { return G; }, get mode() { return mode; }, get SV() { return SV; }, get SC() { return SC; }, crowd,
        start(mi, d) { startMission(mi, d || 0, false); mode = 'play'; }, win() { if (G) missionDone(); }, fail() { if (G) missionFail('TEST'); },
        clear() { if (G) for (const e of G.ents) if (e.k === 'g' || e.k === 'boss') down(e, true); }, aim(x, y) { aimX = x; aimY = y; }, fire() { if (G) fire(); }, debrief() { return DB; } };
      // ---- a console-only model viewer (for checking the models from every side): __rangeDbg.view('soldier', angleDeg, dist, height, 'aim'|'run'|'idle'|'down')
      let VIEW = null;
      function viewStep(dt) {
        const V = VIEW; V.t += dt;
        if (V.gun) { setGunModel(V.gun); gunHold.position.set(0, 0, 0); gunHold.rotation.set(0, 0, 0); gunHold.visible = true; const a = V.ang * Math.PI / 180; gunCam.position.set(Math.sin(a) * V.dist, V.h, Math.cos(a) * V.dist); gunCam.lookAt(0, -0.06, -0.15); return; }
        const ch = V.ch, R = ch.rot; for (const r of R) r[0] = r[1] = r[2] = 0; ch.hipY = 0; const ph = V.t * 8;
        if (V.pose === 'run') { R[8][0] = -Math.sin(ph) * 0.75; R[10][0] = Math.sin(ph) * 0.75; R[9][0] = Math.max(0, Math.sin(ph + 1.2)) * 1.1; R[11][0] = Math.max(0, -Math.sin(ph + 1.2)) * 1.1; R[4][0] = Math.sin(ph) * 0.6; R[6][0] = -Math.sin(ph) * 0.6; R[2][0] = 0.12; }
        if (V.pose === 'aim') { R[4][0] = -1.32; R[4][2] = 0.5; R[5][0] = -0.15; R[6][0] = -1.5; R[6][2] = -0.12; }
        if (V.pose === 'crouch') { R[8][0] = R[10][0] = -1.45; R[9][0] = R[11][0] = 1.5; ch.hipY = -0.46; R[2][0] = 0.25; }
        if (V.pose === 'down') { R[0][0] = -1.52; R[4][0] = -2.6; R[6][0] = -2.4; }
        if (V.pose === 'panic') { R[4][0] = -2.9; R[6][0] = -2.9; R[4][2] = 0.2; R[6][2] = -0.2; R[8][0] = -Math.sin(ph) * 0.75; R[10][0] = Math.sin(ph) * 0.75; }
        crowd.pose(V.slot, ch); crowd.flush();
        const a = V.ang * Math.PI / 180; cam.position.set(ch.x + Math.sin(a) * V.dist, V.h, ch.z + Math.cos(a) * V.dist); cam.lookAt(ch.x, V.h * 0.5 + 0.4, ch.z); cam.fov = 40; cam.updateProjectionMatrix();
      }
      window.__rangeDbg.view = (what, ang, dist, h, pose) => {
        if (G) { for (const e of G.ents) crowd.give(e.slot); G = null; }
        if (VIEW && VIEW.slot != null) crowd.give(VIEW.slot);
        mode = 'view'; if (GUNS[what]) { VIEW = { gun: what, ang: ang || 0, dist: dist || 0.8, h: h == null ? 0.1 : h, t: 0 }; return; }
        const boxes = charBoxes(STYLES[what]); const slot = crowd.take(boxes);
        VIEW = { slot, ang: ang || 0, dist: dist || 3.2, h: h == null ? 1.2 : h, pose: pose || 'idle', t: 0, ch: { boxes, rot: BONES.map(() => [0, 0, 0]), x: 0, y: 0, z: -40, yaw: 0, sc: what === 'boss' ? 1.12 : 1 } };
      };
      return {
        update(dt) {
          mt += dt; if (mode === 'view') { viewStep(dt); return; } if (banner) { banner.age += dt; if (banner.age > banner.life) banner = null; }
          for (let i = pops.length - 1; i >= 0; i--) { pops[i].t -= dt; if (pops[i].t <= 0) pops.splice(i, 1); }
          if (mode === 'play' && G) {
            if (G.demo && (K.any() || clicked)) { clicked = false; goTitle(); return; }
            if (paused) { updPause(); clicked = false; return; }
            if (K.pressed('start') && !G.done && !G.demo) { paused = true; psel = 0; K.music(null); snd.ok(); return; }
            playUpdate(dt); return;
          }
          if (mode !== 'sent') updMenus(dt);
          clicked = false;
        },
        draw() {
          sky.position.copy(cam.position); DBG.draws++; const nw = performance.now(); if (nw - DBG.ft > 1000) { DBG.fps = DBG.draws; DBG.draws = 0; DBG.ft = nw; }
          ren.autoClear = true; T3.render();
          if (mode === 'view') { hud.clearRect(0, 0, W, H); if (VIEW.gun) { ren.autoClear = true; ren.setClearColor(0x6a7a8a); ren.clear(); ren.render(gunScene, gunCam); } return; }
          if (mode === 'play' && G && gunHold.visible) { ren.autoClear = false; ren.clearDepth(); ren.render(gunScene, gunCam); ren.autoClear = true; }
          hud.clearRect(0, 0, W, H);
          if (mode === 'play' && G) drawPlayHud(); else { drawMenus(); for (const p of pops) F.center(hud, p.s, p.x * W, p.y * H, p.c, 1, '#000'); }
        },
        end() {
          top.removeEventListener('pointermove', onMove); top.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp);
          try { if (G) for (const c of G.cards) disposeCard(c); unloadScene(); crowd.dispose(); skyG.dispose(); pG.dispose(); hG.dispose(); pM.dispose(); hM.dispose(); skyM.dispose(); if (gunModel) gunModel.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } catch (e) {}
        },
      };
    },
  });
})();

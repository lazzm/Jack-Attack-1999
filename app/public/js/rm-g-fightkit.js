/* rm-g-fightkit: the shared 3D fight engine for the beat-'em-ups in Jack's room: TEKNO FIST (PlayStation, js/rm-g-fight.js)
 * and SOUL SABRE (Dreamcast, js/rm-g-duel.js). Version 2 (pack 36).
 *   - Fighters are ONE skinned mesh each (a merged, vertex-coloured, texture-atlased body on a 20-bone skeleton: one draw
 *     call), with painted faces and clothes, their own build, hair, stance and weapon. Poses are blended frame by frame.
 *   - Stages are built from merged buckets (one draw call per texture), a sky dome, a painted skyline band, 3D crowds
 *     (instanced), ambient particles and per-stage lights.
 *   - Fighting: high/mid/low, guard (auto-guard when standing still in Tekno Fist), crouch, sidesteps, dashes, jumps,
 *     8-way run (Soul Sabre), strings, specials, two throws each with their own animation, throw breaks, counter hits,
 *     parries (Tekno: tap back just as it lands) and Guard Impacts (Sabre: forward + guard), launchers and juggles, a combo
 *     counter, crumples, knock-downs, ring outs, hit-stop, sparks, shake, a slow-motion K.O. and an action replay.
 *   - Modes: Arcade (story, rival, boss, ending), Versus CPU, Survival, Time Attack and Training (dummy settings, move
 *     list). Options, high scores (seeded with Jack's mates), unlockable fighters/costumes/stages (in the save), attract
 *     mode demo fights, pause menu.
 *   RmFight.make(K, CFG) -> { update, draw, end }   (CFG: see rm-g-fight.js / rm-g-duel.js)
 *   RmFight.PP(pose), RmFight.POSE, RmFight.PT (canvas painters) - helpers for the game files.
 * Everything (models, textures, music) is made in code: nothing is loaded. */
(function () {
  'use strict';
  if (window.RmFight && window.RmFight.v >= 2) return;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = t => t * t * (3 - 2 * t);
  const rnd = Math.random;
  const TAU = Math.PI * 2;
  const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  function prng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ================================================================ colours
  function rgbOf(c) {
    if (typeof c === 'number') return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    c = String(c || '#000'); if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    const n = parseInt(c.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const hx = a => '#' + a.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  const shade = (c, k) => hx(rgbOf(c).map(v => v * k));
  const mixC = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return hx(A.map((v, i) => lerp(v, B[i], t))); };
  const rgba = (c, a) => { const A = rgbOf(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
  const numC = c => { const A = rgbOf(c); return (A[0] << 16) | (A[1] << 8) | A[2]; };

  // ================================================================ poses (flat arrays so blending is quick)
  // lead side = 'l' (the arm/leg at -x, the one forward in a stance), rear side = 'r'. Angles in radians.
  //  y pelvis height offset, lean (torso forward), twist (torso turn), hp head pitch, spin (whole body turn),
  //  slp/slr lead shoulder pitch (forward raise)/roll (out), el elbow bend, srp/srr/er the rear arm,
  //  hlp/hlr lead hip pitch/roll, kl knee, hrp/hrr/kr rear leg, fw pelvis forward shift, tilt pelvis roll,
  //  sly/sry upper-arm swing across the body, wl/wr wrist bend, fl/fr ankle (0 = foot flat), hy head turn,
  //  side torso side-bend, hly/hry thigh turn-out
  const KEYS = ['y', 'lean', 'twist', 'hp', 'spin', 'slp', 'slr', 'el', 'srp', 'srr', 'er', 'hlp', 'hlr', 'kl', 'hrp', 'hrr', 'kr', 'fw', 'tilt',
    'sly', 'sry', 'wl', 'wr', 'fl', 'fr', 'hy', 'side', 'hly', 'hry'];
  const NK = KEYS.length, KI = {}; KEYS.forEach((k, i) => { KI[k] = i; });
  function PP(o, base) {
    const q = Object.assign({}, o);
    for (const s of ['sl', 'sr', 'hl', 'hr']) if (q[s]) { q[s + 'p'] = q[s][0]; q[s + 'r'] = q[s][1] || 0; if (q[s][2] != null) q[s + 'y'] = q[s][2]; }
    const a = new Float32Array(NK); if (base) a.set(base);
    for (let i = 0; i < NK; i++) if (q[KEYS[i]] != null) a[i] = q[KEYS[i]];
    return a;
  }
  const mixP = (a, b, t, out) => { for (let i = 0; i < NK; i++) out[i] = a[i] + (b[i] - a[i]) * t; return out; };
  // mirror a pose's sides (lead <-> rear)
  function flipP(p) { const o = new Float32Array(p); const sw = (a, b) => { const t = o[KI[a]]; o[KI[a]] = o[KI[b]]; o[KI[b]] = t; }; sw('slp', 'srp'); sw('slr', 'srr'); sw('el', 'er'); sw('hlp', 'hrp'); sw('hlr', 'hrr'); sw('kl', 'kr'); sw('sly', 'sry'); sw('wl', 'wr'); sw('fl', 'fr'); sw('hly', 'hry'); o[KI.twist] = -o[KI.twist]; o[KI.spin] = -o[KI.spin]; o[KI.side] = -o[KI.side]; o[KI.hy] = -o[KI.hy]; return o; }
  const POSE = {
    stance: PP({ y: -0.08, lean: 0.12, twist: 0.35, sl: [0.95, 0.2], el: 1.95, sr: [1.1, 0.18], er: 2.1, hl: [0.38, 0.1], kl: 0.4, hr: [-0.28, 0.12], kr: 0.3 }),
    bstance: PP({ y: -0.1, lean: 0.1, twist: 0.25, sl: [0.6, 0.25], el: 1.1, sr: [0.85, 0.12], er: 0.7, hl: [0.4, 0.1], kl: 0.45, hr: [-0.3, 0.12], kr: 0.35 }),
    crouch: PP({ y: -0.42, lean: 0.35, twist: 0.2, sl: [1.0, 0.2], el: 2.0, sr: [1.0, 0.2], er: 2.0, hl: [1.45, 0.25], kl: 2.3, hr: [0.9, 0.2], kr: 2.1 }),
    guard: PP({ y: -0.1, lean: 0.2, twist: 0.1, sl: [1.45, 0.05, 0.3], el: 2.45, sr: [1.45, 0.05, 0.3], er: 2.45, hl: [0.3, 0.1], kl: 0.4, hr: [-0.25, 0.12], kr: 0.3 }),
    cguard: PP({ y: -0.45, lean: 0.45, twist: 0.1, sl: [1.3, 0.1, 0.3], el: 2.4, sr: [1.3, 0.1, 0.3], er: 2.4, hl: [1.45, 0.25], kl: 2.3, hr: [0.9, 0.2], kr: 2.1 }),
    bguard: PP({ y: -0.12, lean: 0.15, twist: -0.2, sl: [1.2, 0.1], el: 1.6, sr: [1.3, 0.1], er: 1.2, hl: [0.35, 0.1], kl: 0.45, hr: [-0.3, 0.12], kr: 0.35 }),
    bcguard: PP({ y: -0.42, lean: 0.4, twist: -0.2, sl: [1.1, 0.1], el: 1.5, sr: [1.2, 0.1], er: 1.1, hl: [1.4, 0.25], kl: 2.2, hr: [0.9, 0.2], kr: 2.0 }),
    hit: PP({ y: -0.1, lean: -0.5, twist: 0.4, hp: -0.5, sl: [0.4, 0.7], el: 0.7, sr: [0.3, 0.7], er: 0.7, hl: [0.1, 0.1], kl: 0.2, hr: [-0.4, 0.1], kr: 0.5 }),
    hitmid: PP({ y: -0.18, lean: 0.75, twist: -0.2, hp: 0.3, sl: [0.7, 0.3], el: 1.6, sr: [0.8, 0.3], er: 1.7, hl: [0.4, 0.1], kl: 0.7, hr: [-0.2, 0.1], kr: 0.6 }),
    hitlow: PP({ y: -0.2, lean: 0.6, twist: -0.2, hp: 0.2, sl: [0.6, 0.4], el: 1.0, sr: [0.5, 0.4], er: 1.0, hl: [0.6, 0.2], kl: 1.2, hr: [-0.2, 0.2], kr: 0.9 }),
    crumple: PP({ y: -0.5, lean: 0.9, twist: 0.5, hp: 0.6, sl: [0.3, 0.3], el: 0.4, sr: [0.2, 0.4], er: 0.3, hl: [1.2, 0.3], kl: 2.0, hr: [0.7, 0.1], kr: 2.2, side: 0.3 }),
    air: PP({ y: 0, lean: -0.9, twist: 0.3, hp: -0.5, sl: [1.8, 0.8], el: 0.3, sr: [2.0, 0.8], er: 0.3, hl: [0.8, 0.2], kl: 0.9, hr: [0.4, 0.2], kr: 1.2 }),
    down: PP({ y: 0, lean: 0, hp: 0.1, sl: [2.6, 0.5], el: 0.4, sr: [2.8, 0.6], er: 0.3, hl: [0.2, 0.15], kl: 0.3, hr: [0.05, 0.2], kr: 0.15 }),
    win: PP({ y: -0.04, lean: -0.1, twist: 0.2, hp: -0.25, sl: [0.3, 0.3], el: 1.6, sr: [3.0, 0.25], er: 0.3, hl: [0.15, 0.15], kl: 0.1, hr: [-0.1, 0.15], kr: 0.1 }),
    win2: PP({ y: -0.02, lean: -0.15, hp: -0.3, sl: [2.9, 0.4], el: 0.2, sr: [2.9, 0.4], er: 0.2, hl: [0.05, 0.2], kl: 0.05, hr: [0.05, 0.2], kr: 0.05 }),
    win3: PP({ y: -0.05, lean: 0.1, twist: 0.5, sl: [0.4, 0.2], el: 2.3, sr: [1.6, 0.0, 0.6], er: 0.1, hl: [0.25, 0.15], kl: 0.2, hr: [-0.15, 0.15], kr: 0.1 }),
    bow: PP({ y: -0.04, lean: 0.75, hp: 0.3, sl: [0.15, 0.05], el: 0.2, sr: [0.15, 0.05], er: 0.2, hl: [0.0, 0.05], kl: 0.05, hr: [0.0, 0.05], kr: 0.05 }),
    grab: PP({ y: -0.12, lean: 0.35, twist: 0, sl: [1.55, -0.1], el: 0.4, sr: [1.55, -0.1], er: 0.4, hl: [0.45, 0.1], kl: 0.5, hr: [-0.35, 0.12], kr: 0.35 }),
    lift: PP({ y: -0.05, lean: -0.35, twist: 0, sl: [2.9, 0.1], el: 0.3, sr: [2.9, 0.1], er: 0.3, hl: [0.3, 0.1], kl: 0.3, hr: [-0.4, 0.12], kr: 0.3 }),
    slam: PP({ y: -0.35, lean: 0.9, sl: [1.2, 0.1], el: 0.2, sr: [1.2, 0.1], er: 0.2, hl: [1.1, 0.2], kl: 1.6, hr: [0.2, 0.1], kr: 1.2 }),
    bridge: PP({ y: -0.3, lean: -1.4, hp: -0.8, sl: [3.0, 0.2], el: 0.3, sr: [3.0, 0.2], er: 0.3, hl: [0.3, 0.2], kl: 1.6, hr: [0.3, 0.2], kr: 1.6 }),
    jump: PP({ y: 0.05, lean: 0.2, sl: [1.2, 0.3], el: 1.8, sr: [1.2, 0.3], er: 1.8, hl: [1.3, 0.2], kl: 2.0, hr: [0.9, 0.2], kr: 2.1 }),
    dash: PP({ y: -0.18, lean: 0.45, twist: 0.2, sl: [1.1, 0.2], el: 2.0, sr: [0.4, 0.2], er: 1.6, hl: [0.9, 0.1], kl: 0.9, hr: [-0.7, 0.1], kr: 1.0 }),
    bdash: PP({ y: -0.12, lean: -0.1, twist: 0.3, sl: [1.0, 0.25], el: 2.0, sr: [1.1, 0.2], er: 2.1, hl: [-0.2, 0.1], kl: 0.6, hr: [-0.6, 0.1], kr: 0.4 }),
    side: PP({ y: -0.2, lean: 0.25, twist: 0.2, sl: [1.2, 0.2], el: 2.1, sr: [1.2, 0.2], er: 2.1, hl: [0.6, 0.35], kl: 0.8, hr: [0.1, 0.35], kr: 0.7 }),
    parried: PP({ y: -0.06, lean: -0.55, twist: -0.5, hp: -0.4, sl: [2.4, 0.9], el: 0.4, sr: [2.0, 1.1], er: 0.5, hl: [-0.1, 0.1], kl: 0.2, hr: [-0.5, 0.15], kr: 0.4 }),
    impact: PP({ y: -0.14, lean: 0.25, twist: -0.7, sl: [1.5, 0.3, 0.5], el: 0.8, sr: [1.6, 0.5, -0.4], er: 0.5, hl: [0.5, 0.1], kl: 0.6, hr: [-0.4, 0.12], kr: 0.3 }),
    taunt: PP({ y: -0.04, lean: -0.05, twist: 0.1, sl: [0.2, 0.9], el: 2.4, sr: [1.6, 0.2, 0.3], er: 1.9, wr: 0.6, hl: [0.1, 0.12], kl: 0.1, hr: [-0.1, 0.12], kr: 0.1 }),
    tpose: PP({}),
  };

  // ================================================================ canvas painters (shared with the game files: their stage art)
  const PT = {
    noise(g, x, y, w, h, amt, r, sz) { r = r || rnd; sz = sz || 1; const n = (w * h / (sz * sz)) / 3 | 0; for (let i = 0; i < n; i++) { const d = r() < 0.5; g.fillStyle = d ? `rgba(0,0,0,${(r() * amt).toFixed(3)})` : `rgba(255,255,255,${(r() * amt * 0.8).toFixed(3)})`; g.fillRect(x + (r() * w / sz | 0) * sz, y + (r() * h / sz | 0) * sz, sz, sz); } },
    vgrad(g, x, y, w, h, stops) { const gr = g.createLinearGradient(0, y, 0, y + h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(x, y, w, h); },
    hgrad(g, x, y, w, h, stops) { const gr = g.createLinearGradient(x, 0, x + w, 0); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(x, y, w, h); },
    bricks(g, w, h, o) { o = o || {}; const r = o.r || prng(o.seed || 3), bw = o.bw || w / 4, bh = o.bh || h / 8; g.fillStyle = o.mortar || '#555'; g.fillRect(0, 0, w, h); for (let y = 0, row = 0; y < h; y += bh, row++) for (let x = -(row % 2) * bw / 2; x < w; x += bw) { g.fillStyle = shade(o.col || '#8a4a3a', 0.8 + r() * 0.35); g.fillRect(x + 1, y + 1, bw - 2, bh - 2); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 1, y + 1, bw - 2, 1); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 1, y + bh - 2, bw - 2, 1); } if (o.grime !== false) PT.noise(g, 0, 0, w, h, 0.12, r); },
    planks(g, w, h, o) { o = o || {}; const r = o.r || prng(o.seed || 5), n = o.n || 6, ph = h / n; for (let i = 0; i < n; i++) { g.fillStyle = shade(o.col || '#a0703a', 0.82 + r() * 0.3); g.fillRect(0, i * ph, w, ph); for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; g.fillRect(0, i * ph + r() * ph, w, 1); } g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, i * ph + ph - 1, w, 1); g.fillStyle = 'rgba(0,0,0,.35)'; const jx = r() * w | 0; g.fillRect(jx, i * ph, 1, ph); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, i * ph, w, 1); } },
    tiles(g, w, h, o) { o = o || {}; const n = o.n || 4, tw = w / n, r = o.r || prng(o.seed || 7); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = shade((x + y) % 2 && o.b ? o.b : (o.a || '#ccc'), 0.92 + r() * 0.14); g.fillRect(x * tw, y * tw, tw, tw); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x * tw, y * tw, tw, 1); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x * tw, y * tw + tw - 1, tw, 1); g.fillRect(x * tw + tw - 1, y * tw, 1, tw); } if (o.grout) { g.fillStyle = o.grout; for (let i = 0; i <= n; i++) { g.fillRect(i * tw - 1, 0, 2, h); g.fillRect(0, i * tw - 1, w, 2); } } },
    stone(g, w, h, o) { o = o || {}; const r = o.r || prng(o.seed || 9); g.fillStyle = o.mortar || shade(o.col || '#8a8a80', 0.55); g.fillRect(0, 0, w, h); const rows = o.rows || 4, rh = h / rows; for (let y = 0; y < rows; y++) { let x = -r() * 10; while (x < w) { const bw = (o.bw || w / 3) * (0.6 + r() * 0.8); g.fillStyle = shade(o.col || '#8a8a80', 0.78 + r() * 0.4); g.fillRect(x + 1, y * rh + 1, bw - 2, rh - 2); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x + 1, y * rh + 1, bw - 2, 1); x += bw; } } PT.noise(g, 0, 0, w, h, 0.07, r); },
    metal(g, w, h, o) { o = o || {}; const r = o.r || prng(o.seed || 11), n = o.n || 2, pw = w / n; g.fillStyle = o.col || '#7a7f88'; g.fillRect(0, 0, w, h); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { PT.vgrad(g, x * pw + 1, y * pw + 1, pw - 2, pw - 2, [[0, shade(o.col || '#7a7f88', 1.18)], [1, shade(o.col || '#7a7f88', 0.82)]]); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x * pw, y * pw, pw, 1); g.fillRect(x * pw, y * pw, 1, pw); if (o.rivets !== false) { g.fillStyle = 'rgba(255,255,255,.5)'; for (const [a, b] of [[3, 3], [pw - 5, 3], [3, pw - 5], [pw - 5, pw - 5]]) g.fillRect(x * pw + a, y * pw + b, 2, 2); } } PT.noise(g, 0, 0, w, h, 0.08, r); },
    windows(g, w, h, o) { o = o || {}; const r = o.r || prng(o.seed || 13), cols = o.cols || 4, rows = o.rows || 6; g.fillStyle = o.col || '#22242e'; g.fillRect(0, 0, w, h); const cw = w / cols, rh = h / rows; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const lit = r() < (o.lit == null ? 0.45 : o.lit); g.fillStyle = lit ? shade(o.on || '#ffd27a', 0.8 + r() * 0.3) : (o.off || '#0a0c14'); g.fillRect(x * cw + cw * 0.18, y * rh + rh * 0.2, cw * 0.64, rh * 0.6); if (lit) { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x * cw + cw * 0.18, y * rh + rh * 0.2, cw * 0.64, 1); } } PT.noise(g, 0, 0, w, h, 0.08, r); },
    // a skyline / mountain silhouette band (transparent above): kind 'city' | 'hills' | 'peaks' | 'trees' | 'castle'
    skyline(g, w, h, o) {
      o = o || {}; const r = o.r || prng(o.seed || 17), base = h;
      const layers = o.layers || [{ col: o.col || '#223', hmin: 0.3, hmax: 0.8 }];
      layers.forEach((L, li) => {
        g.fillStyle = L.col;
        if ((L.kind || o.kind) === 'city') {
          let x = 0; while (x < w) { const bw = (L.bw || 18) * (0.5 + r()), bh = h * (L.hmin + r() * (L.hmax - L.hmin)); g.fillStyle = L.col; g.fillRect(x, base - bh, bw, bh); if (r() < 0.3) g.fillRect(x + bw * 0.4, base - bh - h * 0.06, 2, h * 0.06); if (L.lit) { for (let yy = base - bh + 3; yy < base - 2; yy += 4) for (let xx = x + 2; xx < x + bw - 2; xx += 4) if (r() < L.lit) { g.fillStyle = L.win || '#ffd27a'; g.fillRect(xx, yy, 2, 2); } } x += bw + (r() < 0.2 ? 2 : 0); }
        } else if ((L.kind || o.kind) === 'trees') {
          for (let x = -10; x < w + 10; x += 5 + r() * 6) { const th = h * (L.hmin + r() * (L.hmax - L.hmin)); g.beginPath(); g.moveTo(x - th * 0.25, base); g.lineTo(x, base - th); g.lineTo(x + th * 0.25, base); g.fill(); }
        } else if ((L.kind || o.kind) === 'castle') {
          let x = 0; while (x < w) { const bw = 20 + r() * 30, bh = h * (L.hmin + r() * (L.hmax - L.hmin)); g.fillRect(x, base - bh, bw, bh); for (let k = 0; k < bw; k += 6) g.fillRect(x + k, base - bh - 4, 3, 4); if (r() < 0.5) { const tx = x + bw / 2, tw = 8 + r() * 6, tt = bh + h * 0.15; g.fillRect(tx - tw / 2, base - tt, tw, tt); g.beginPath(); g.moveTo(tx - tw / 2 - 2, base - tt); g.lineTo(tx, base - tt - 14); g.lineTo(tx + tw / 2 + 2, base - tt); g.fill(); } x += bw + 10 + r() * 40; }
        } else { // hills / peaks: a smooth random ridge
          const peaks = (L.kind || o.kind) === 'peaks'; const pts = []; let y = L.hmin + r() * (L.hmax - L.hmin); const step = peaks ? 18 : 30;
          for (let x = 0; x <= w + step; x += step) { y = clamp(y + (r() - 0.5) * (peaks ? 0.5 : 0.25), L.hmin, L.hmax); pts.push([x, base - h * y]); }
          pts[pts.length - 1][1] = pts[0][1];
          g.beginPath(); g.moveTo(0, base); for (const [x, yy] of pts) g.lineTo(x, yy); g.lineTo(w, base); g.closePath(); g.fill();
          if (peaks && L.snow) { g.fillStyle = L.snow; for (let i = 1; i < pts.length - 1; i++) if (pts[i][1] < pts[i - 1][1] && pts[i][1] < pts[i + 1][1]) { g.beginPath(); g.moveTo(pts[i][0] - 6, pts[i][1] + 7); g.lineTo(pts[i][0], pts[i][1]); g.lineTo(pts[i][0] + 6, pts[i][1] + 7); g.fill(); } }
        }
      });
    },
    clouds(g, w, h, o) { o = o || {}; const r = o.r || prng(o.seed || 19); for (let i = 0; i < (o.n || 12); i++) { const x = r() * w, y = h * (o.y0 || 0.2) + r() * h * (o.dy || 0.4), s = (o.s || 20) * (0.6 + r()); g.fillStyle = o.col || 'rgba(255,255,255,.8)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + (k - 2) * s * 0.5, y + Math.sin(k) * s * 0.12, s * 0.5, s * 0.28, 0, 0, TAU); g.fill(); } } },
  };

  // ================================================================ the mesher: merge many little shapes into one geometry
  // add(geo, o): o = { x,y,z, rx,ry,rz, sx,sy,sz, ord, m (Matrix4 applied after), col, bone, uv:[u0,v0,u1,v1] (atlas rect),
  //   wuv: tile size (world box-mapping uvs), grad:[kTop,kBottom] (shade by height), dark (0..1 extra darkening) }
  function Mesher(T, defUV) {
    const P = [], N = [], U = [], C = [], SI = [], I = []; let nv = 0;
    const m4 = new T.Matrix4(), nm = new T.Matrix3(), v = new T.Vector3(), n3 = new T.Vector3(), q = new T.Quaternion(), e = new T.Euler(), sc = new T.Vector3(), pos = new T.Vector3(), col = new T.Color();
    function add(geo, o) {
      o = o || {};
      e.set(o.rx || 0, o.ry || 0, o.rz || 0, o.ord || 'XYZ'); q.setFromEuler(e); sc.set(o.sx || 1, o.sy || 1, o.sz || 1); pos.set(o.x || 0, o.y || 0, o.z || 0);
      m4.compose(pos, q, sc); if (o.m) m4.premultiply(o.m);
      nm.getNormalMatrix(m4);
      const pa = geo.attributes.position, na = geo.attributes.normal, ua = geo.attributes.uv;
      col.set(o.col == null ? 0xffffff : o.col);
      let ymin = Infinity, ymax = -Infinity;
      if (o.grad) for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
      const UV = o.uv || (!o.wuv && !o.rep ? defUV : null), wt = o.wuv;
      for (let i = 0; i < pa.count; i++) {
        v.fromBufferAttribute(pa, i); const ly = v.y; v.applyMatrix4(m4); P.push(v.x, v.y, v.z);
        n3.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N.push(n3.x, n3.y, n3.z);
        let u = ua ? ua.getX(i) : 0, w = ua ? ua.getY(i) : 0;
        if (wt) { const ax = Math.abs(n3.x), ay = Math.abs(n3.y), az = Math.abs(n3.z), tu = wt.length ? wt[0] : wt, tv = wt.length ? wt[1] : wt; if (ay >= ax && ay >= az) { u = v.x / tu; w = v.z / tv; } else if (ax >= az) { u = v.z / tu; w = v.y / tv; } else { u = v.x / tu; w = v.y / tv; } }
        else if (UV) { if (UV.length === 2) { u = UV[0]; w = UV[1]; } else { u = UV[0] + u * (UV[2] - UV[0]); w = UV[1] + w * (UV[3] - UV[1]); } }
        else if (o.rep) { u *= o.rep[0]; w *= o.rep[1]; }
        U.push(u, w);
        let k = 1; if (o.grad) k = lerp(o.grad[1], o.grad[0], ymax > ymin ? (ly - ymin) / (ymax - ymin) : 1);
        if (o.dark) k *= 1 - o.dark;
        C.push(col.r * k, col.g * k, col.b * k);
        SI.push(o.bone || 0);
      }
      if (geo.index) { const ia = geo.index; for (let i = 0; i < ia.count; i++) I.push(ia.getX(i) + nv); }
      else for (let i = 0; i < pa.count; i++) I.push(i + nv);
      nv += pa.count;
      geo.dispose();
      return api;
    }
    function build(skin) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
      if (skin) { const si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4); for (let i = 0; i < nv; i++) { si[i * 4] = SI[i]; sw[i * 4] = 1; } g.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4)); }
      g.setIndex(nv > 65000 ? new T.Uint32BufferAttribute(I, 1) : new T.Uint16BufferAttribute(I, 1));
      g.computeBoundingSphere();
      return g;
    }
    // shapes (centred on x,y,z unless noted)
    const api = {
      add, build, get count() { return nv; },
      box: (w, h, d, o) => add(new T.BoxGeometry(w, h, d), o),
      cyl: (rt, rb, h, seg, o) => add(new T.CylinderGeometry(rt, rb, h, seg || 8, 1, !!(o && o.open), Math.PI, TAU), o),
      cone: (r, h, seg, o) => add(new T.ConeGeometry(r, h, seg || 6), o),
      ball: (r, ws, hs, o) => add(new T.SphereGeometry(r, ws || 8, hs || 6, 0, TAU, (o && o.t0) || 0, (o && o.tl) || Math.PI), o),
      plane: (w, h, o) => add(new T.PlaneGeometry(w, h), o),
      circle: (r, seg, o) => add(new T.CircleGeometry(r, seg || 16), o),
      torus: (r, t, rs, ts, o) => add(new T.TorusGeometry(r, t, rs || 4, ts || 12), o),
      ring: (r0, r1, seg, o) => add(new T.RingGeometry(r0, r1, seg || 16), o),
    };
    return api;
  }

  // ================================================================ PS1 15-bit colour dither (an ordered 4x4 Bayer pattern)
  const DITHER = '\n{ vec2 dq = mod(floor(gl_FragCoord.xy), 4.0); vec2 d1 = mod(dq, 2.0); vec2 d2 = floor(dq * 0.5);\n' +
    '  float bay = (4.0 * mod(2.0 * d1.x + 3.0 * d1.y, 4.0) + mod(2.0 * d2.x + 3.0 * d2.y, 4.0)) / 16.0;\n' +
    '  gl_FragColor.rgb = floor(gl_FragColor.rgb * 31.0 + bay) / 31.0; }\n';

  // ================================================================ the fighters' texture atlas (128 x 128 units; 2x pixels on the Dreamcast)
  //  head (0,0 64x32: wraps the head, face at x=16), top (64,0 64x64: chest rows 0-40, tummy 40-64, front at x=96),
  //  pants (0,32 64x32: thighs rows 0-16, shins 16-32, front at x=32), extra (0,64 64x32: cape/coat), white texel at 124,124
  function emblem(g, kind, cx, cy, s, col, col2) {
    g.fillStyle = col; g.strokeStyle = col; g.lineWidth = s * 0.18;
    switch (kind) {
      case 'bolt': g.beginPath(); g.moveTo(cx + s * 0.2, cy - s); g.lineTo(cx - s * 0.5, cy + s * 0.1); g.lineTo(cx, cy + s * 0.1); g.lineTo(cx - s * 0.2, cy + s); g.lineTo(cx + s * 0.5, cy - s * 0.1); g.lineTo(cx, cy - s * 0.1); g.closePath(); g.fill(); break;
      case 'star': g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * 0.42 : s; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); break;
      case 'circle': g.beginPath(); g.arc(cx, cy, s, 0, TAU); g.fill(); if (col2) { g.fillStyle = col2; g.beginPath(); g.arc(cx, cy, s * 0.55, 0, TAU); g.fill(); } break;
      case 'ring': g.beginPath(); g.arc(cx, cy, s * 0.8, 0, TAU); g.stroke(); break;
      case 'skull': g.beginPath(); g.arc(cx, cy - s * 0.15, s * 0.6, 0, TAU); g.fill(); g.fillRect(cx - s * 0.35, cy + s * 0.2, s * 0.7, s * 0.45); g.fillStyle = col2 || '#000'; g.fillRect(cx - s * 0.35, cy - s * 0.3, s * 0.25, s * 0.25); g.fillRect(cx + s * 0.1, cy - s * 0.3, s * 0.25, s * 0.25); break;
      case 'cross': g.fillRect(cx - s * 0.2, cy - s, s * 0.4, s * 2); g.fillRect(cx - s * 0.8, cy - s * 0.2, s * 1.6, s * 0.4); break;
      case 'flower': for (let i = 0; i < 5; i++) { const a = i * TAU / 5; g.beginPath(); g.arc(cx + Math.cos(a) * s * 0.5, cy + Math.sin(a) * s * 0.5, s * 0.4, 0, TAU); g.fill(); } g.fillStyle = col2 || '#ffd040'; g.beginPath(); g.arc(cx, cy, s * 0.3, 0, TAU); g.fill(); break;
      case 'leaf': g.beginPath(); g.ellipse(cx, cy, s * 0.4, s, 0.5, 0, TAU); g.fill(); break;
      case 'moon': g.beginPath(); g.arc(cx, cy, s, 0, TAU); g.fill(); g.fillStyle = col2 || '#000'; g.beginPath(); g.arc(cx + s * 0.45, cy - s * 0.2, s * 0.85, 0, TAU); g.fill(); break;
      case 'wave': for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx - s * 0.6 + i * s * 0.6, cy, s * 0.3, Math.PI, 0); g.stroke(); } break;
      case 'gear': g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * TAU / 16, r = i % 2 ? s * 0.75 : s; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); g.fillStyle = col2 || '#000'; g.beginPath(); g.arc(cx, cy, s * 0.35, 0, TAU); g.fill(); break;
      default: if (kind) { g.font = `bold ${s * 1.6}px Arial,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(kind, cx, cy); }
    }
  }
  function paintHead(g, F, C) {
    const fc = F.face || {}, sk = C.skin, hr = C.hair, x0 = 0, y0 = 0, W = 64, H = 32, fx = 16, ey = 14.6;
    const full = fc.full; // a helmet / robot / mask: the whole head is that colour
    g.fillStyle = full || sk; g.fillRect(x0, y0, W, H);
    PT.vgrad(g, x0, y0, W, H, [[0, 'rgba(255,255,255,.10)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.28)']]);
    PT.hgrad(g, x0, y0, W, H, [[0, 'rgba(0,0,0,.12)'], [0.25, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,.12)'], [0.75, 'rgba(0,0,0,.22)'], [1, 'rgba(0,0,0,.12)']]);
    const hairY = fc.hairY == null ? 8.5 : fc.hairY, backY = fc.backY == null ? 19 : fc.backY;
    if (!full && F.hairTex !== false && fc.bald !== true) { // hair painted on: the top, the back, sideburns and a fringe
      g.fillStyle = hr; g.fillRect(x0, y0, W, hairY);
      g.fillRect(27, 0, 37, backY); g.fillRect(0, 0, 5, backY); // the back of the head wraps round the seam
      g.fillRect(4.5, 0, 2.2, 16.5); g.fillRect(25.3, 0, 2.2, 16.5); // sideburns
      const fr = fc.fringe || 'zig';
      g.beginPath(); g.moveTo(5, hairY);
      if (fr === 'zig') for (let x = 5; x <= 27; x += 3) g.lineTo(x + 1.5, hairY + (x % 2 ? 2.6 : 1.2));
      else if (fr === 'side') { g.lineTo(9, hairY + 4.5); g.lineTo(20, hairY + 1); }
      else if (fr === 'widow') { g.lineTo(16, hairY + 2.8); }
      else if (fr === 'bangs') { g.lineTo(5, hairY + 4.5); g.lineTo(27, hairY + 4.5); }
      g.lineTo(27, hairY); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 1; x < W; x += 3) g.fillRect(x, 1 + (x % 5), 1, hairY - 2); // strands
    }
    if (fc.bald === true || F.hair === 'bald' || F.hair === 'grot') { g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(18, 3.5, 6, 2, 0, 0, TAU); g.fill(); }
    // ears (darker skin at the sides)
    if (!full) { g.fillStyle = shade(sk, 0.82); g.fillRect(0, ey - 1, 2.2, 5); g.fillRect(30.8, ey - 1, 2.2, 5); }
    const eye = fc.eyes || 'normal', ec = C.eye || '#3a2a1a', brow = C.brow || shade(hr, 0.9);
    if (fc.mask) { g.fillStyle = fc.mask; g.fillRect(6, ey - 3.8, 20, 6.4); g.fillStyle = fc.mask2 || shade(fc.mask, 1.3); g.fillRect(6, ey - 3.8, 20, 1); }
    if (eye === 'panda') { g.fillStyle = '#141414'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(fx + s * 4.5, ey + 0.4, 3.2, 2.6, s * 0.4, 0, TAU); g.fill(); } }
    for (const s of [-1, 1]) {
      const ex = fx + s * 4.3;
      if (eye === 'visor' || eye === 'robot') continue;
      if (eye === 'shades') { g.fillStyle = '#111'; g.fillRect(ex - 2.4, ey - 1.3, 4.8, 2.6); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(ex - 1.8, ey - 0.9, 1.4, 0.6); continue; }
      const big = eye === 'big' || eye === 'grot', ew = big ? 4.2 : eye === 'narrow' ? 3.6 : 3.8, eh = big ? 2.8 : eye === 'narrow' ? 1.2 : 2.1;
      g.fillStyle = eye === 'grot' ? '#ffe040' : '#f8f8f0'; g.fillRect(ex - ew / 2, ey - eh / 2, ew, eh);
      g.fillStyle = eye === 'grot' ? '#c01010' : ec; g.fillRect(ex - 0.75 - s * 0.25, ey - eh / 2, 1.5, eh);
      g.fillStyle = '#0a0a0a'; g.fillRect(ex - 0.35 - s * 0.25, ey - eh / 2 + 0.2, 0.7, Math.max(0.6, eh - 0.6));
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(ex - ew / 2, ey - eh / 2 - 0.5, ew, 0.5); // the lid
      if (fc.lash) { g.fillStyle = '#111'; g.fillRect(ex - ew / 2 - 0.3, ey - eh / 2 - 0.7, ew + 0.6, 0.7); }
      // brows
      const bt = fc.brow || 'flat'; if (bt !== 'none') {
        g.strokeStyle = brow; g.lineWidth = bt === 'thick' ? 1.5 : 1.0; g.beginPath();
        const inY = bt === 'angry' ? ey - 1.6 : bt === 'up' ? ey - 3.4 : ey - 2.6, outY = bt === 'angry' ? ey - 3.4 : bt === 'up' ? ey - 2.4 : ey - 2.8;
        g.moveTo(fx + s * 1.3, inY); g.lineTo(fx + s * 6.2, outY); g.stroke();
      }
    }
    if (eye === 'visor') { g.fillStyle = fc.visor || '#ff2a1a'; g.fillRect(7, ey - 1.6, 18, 3.2); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(7, ey - 1.6, 18, 0.7); }
    if (eye === 'robot') { g.fillStyle = '#111'; g.fillRect(6.5, ey - 2.4, 19, 4.8); g.fillStyle = fc.visor || '#ff3a1a'; for (const s of [-1, 1]) g.fillRect(fx + s * 4.3 - 1.8, ey - 0.8, 3.6, 1.6); g.fillStyle = '#555'; for (let i = 0; i < 5; i++) g.fillRect(11 + i * 2.2, ey + 4.5, 1.2, 3); }
    if (fc.specs) { g.strokeStyle = fc.specs; g.lineWidth = 0.6; for (const s of [-1, 1]) { g.beginPath(); g.arc(fx + s * 4.3, ey, 2.4, 0, TAU); g.stroke(); } g.beginPath(); g.moveTo(fx - 1.9, ey); g.lineTo(fx + 1.9, ey); g.stroke(); }
    if (fc.goggles) { for (const s of [-1, 1]) { g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(fx + s * 4.2, ey - 5.2, 2.8, 0, TAU); g.fill(); g.fillStyle = fc.goggles; g.beginPath(); g.arc(fx + s * 4.2, ey - 5.2, 1.9, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(fx + s * 4.2 - 1, ey - 6.2, 0.8, 0.8); } g.fillStyle = '#3a2a1a'; g.fillRect(0, ey - 5.8, 64, 1.2); }
    if (eye !== 'robot' && !fc.noNose) { g.fillStyle = shade(full || sk, 0.78); g.fillRect(fx - 0.8, ey + 1.4, 1.6, 2.4); g.fillStyle = shade(full || sk, 0.6); g.fillRect(fx - 1.3, ey + 3.4, 0.8, 0.5); g.fillRect(fx + 0.5, ey + 3.4, 0.8, 0.5); }
    if (fc.blush) { g.fillStyle = 'rgba(255,90,110,.35)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(fx + s * 5.2, ey + 3.4, 2, 1.1, 0, 0, TAU); g.fill(); } }
    if (fc.freckles) { g.fillStyle = shade(sk, 0.7); for (const [a, b] of [[-5, 2.4], [-4, 3.2], [-6, 3.1], [5, 2.4], [4, 3.2], [6, 3.1]]) g.fillRect(fx + a, ey + b, 0.6, 0.6); }
    if (fc.paint) { g.fillStyle = fc.paint; for (const s of [-1, 1]) { g.fillRect(fx + s * 5.5 - 0.5, ey + 2, 1, 3); g.fillRect(fx + s * 6.8 - 0.5, ey + 1.5, 1, 3); } }
    if (fc.beard) { g.fillStyle = fc.beard; g.beginPath(); g.moveTo(5.5, ey + 1.5); g.lineTo(9, ey + 9.5); g.lineTo(fx, ey + 12.5); g.lineTo(23, ey + 9.5); g.lineTo(26.5, ey + 1.5); g.lineTo(23, ey + 5); g.lineTo(fx, ey + 4.6); g.lineTo(9, ey + 5); g.closePath(); g.fill(); }
    if (fc.stubble) { const r = prng(41); g.fillStyle = rgba(fc.stubble, 0.45); for (let i = 0; i < 120; i++) { const a = r() * 20 + 6, b = ey + 3 + r() * 7.5; g.fillRect(a, b, 0.5, 0.5); } }
    // the mouth
    const mo = fc.mouth || 'flat', my = ey + 6, lip = C.lip || shade(full || sk, 0.55);
    g.fillStyle = lip;
    if (mo === 'grin') { g.beginPath(); g.moveTo(fx - 3, my - 0.6); g.quadraticCurveTo(fx, my + 2.4, fx + 3, my - 0.6); g.lineTo(fx + 2.4, my - 0.2); g.quadraticCurveTo(fx, my + 1.2, fx - 2.4, my - 0.2); g.fill(); }
    else if (mo === 'teeth' || mo === 'fangs') { g.fillStyle = '#5a1010'; g.fillRect(fx - 3, my - 0.8, 6, 2.4); g.fillStyle = '#fff'; g.fillRect(fx - 2.8, my - 0.8, 5.6, 1); if (mo === 'fangs') { g.fillRect(fx - 2.4, my, 0.9, 1.4); g.fillRect(fx + 1.5, my, 0.9, 1.4); } }
    else if (mo === 'frown') { g.beginPath(); g.moveTo(fx - 2.6, my + 0.8); g.quadraticCurveTo(fx, my - 1.2, fx + 2.6, my + 0.8); g.lineTo(fx + 2.2, my + 1.1); g.quadraticCurveTo(fx, my - 0.4, fx - 2.2, my + 1.1); g.fill(); }
    else if (mo === 'o') { g.beginPath(); g.ellipse(fx, my + 0.3, 1.2, 1.4, 0, 0, TAU); g.fill(); }
    else if (mo === 'smirk') { g.fillRect(fx - 2.2, my, 4, 0.8); g.fillRect(fx + 1.4, my - 0.6, 1.2, 0.8); }
    else if (mo !== 'none') g.fillRect(fx - 2.3, my, 4.6, 0.8);
    if (fc.tache) { g.fillStyle = fc.tache; g.beginPath(); g.moveTo(fx - 4, my + 0.6); g.quadraticCurveTo(fx, my - 3, fx + 4, my + 0.6); g.quadraticCurveTo(fx, my - 1.2, fx - 4, my + 0.6); g.fill(); }
    if (fc.cover) { g.fillStyle = fc.cover; g.fillRect(4, ey + 2.2, 24, 12); g.fillStyle = 'rgba(0,0,0,.2)'; for (let x = 5; x < 28; x += 2) g.fillRect(x, ey + 2.2, 0.6, 12); } // a ninja's face mask
    if (fc.scar) { g.fillStyle = 'rgba(120,40,40,.6)'; g.fillRect(fx + 3.6, ey - 3.2, 0.6, 5.5); }
    if (full && fc.trim) { g.fillStyle = fc.trim; g.fillRect(0, 0, 64, 1.5); g.fillRect(15.3, 0, 1.4, ey - 2.5); g.fillRect(0, 26, 64, 1); }
  }
  function paintTop(g, F, C) {
    const x0 = 64, W = 64, H = 64, fx = 96, st = F.top || 'tee', c1 = C.top, c2 = C.top2 || shade(c1, 0.7), sk = C.skin;
    const R = prng(F.id ? F.id.length * 31 + 7 : 7);
    g.fillStyle = c1; g.fillRect(x0, 0, W, H);
    const lapels = (col, depth, inner) => { g.fillStyle = inner; g.beginPath(); g.moveTo(fx - 6, 0); g.lineTo(fx, depth); g.lineTo(fx + 6, 0); g.fill(); g.strokeStyle = col; g.lineWidth = 2.2; g.beginPath(); g.moveTo(fx - 7, 0); g.lineTo(fx + 2, depth + 6); g.moveTo(fx + 7, 0); g.lineTo(fx - 1, depth + 3); g.stroke(); };
    const muscles = (y1) => { g.strokeStyle = rgba(shade(sk, 0.55), 0.55); g.lineWidth = 0.8; g.beginPath(); g.moveTo(fx - 11, 14); g.quadraticCurveTo(fx - 5, 21, fx, 17); g.quadraticCurveTo(fx + 5, 21, fx + 11, 14); g.stroke(); g.beginPath(); g.moveTo(fx, 17); g.lineTo(fx, y1); g.stroke(); for (let y = 26; y < y1 - 2; y += 6) { g.beginPath(); g.moveTo(fx - 5, y); g.lineTo(fx + 5, y); g.stroke(); } g.fillStyle = rgba(shade(sk, 0.6), 0.6); g.beginPath(); g.ellipse(fx, 52, 0.9, 1.2, 0, 0, TAU); g.fill(); };
    switch (st) {
      case 'gi': lapels(c2, 20, shade(sk, 0.85)); g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 7; i++) { g.fillRect(x0 + R() * W, 20 + R() * 40, 0.8, 6 + R() * 10); } break;
      case 'bare': g.fillStyle = sk; g.fillRect(x0, 0, W, H); muscles(50); break;
      case 'singlet': g.fillStyle = sk; g.fillRect(x0, 0, W, 22); muscles(22); g.fillStyle = c1; g.fillRect(x0, 20, W, H - 20); for (const s of [-1, 1]) { g.fillRect(fx + s * 9 - 2.5, 0, 5, 22); g.fillRect(fx + s * 9 - 2.5 - 32 * s, 0, 5, 22); } g.fillStyle = c2; g.fillRect(x0, 40, W, 3); break;
      case 'tank': g.fillStyle = sk; g.fillRect(x0, 0, W, 10); g.fillStyle = c1; g.beginPath(); g.moveTo(fx - 12, 0); g.quadraticCurveTo(fx, 14, fx + 12, 0); g.lineTo(fx + 12, 10); g.lineTo(fx - 12, 10); g.fill(); g.fillStyle = sk; g.beginPath(); g.moveTo(fx - 7, 0); g.quadraticCurveTo(fx, 9, fx + 7, 0); g.fill(); break;
      case 'tee': g.fillStyle = shade(c1, 0.8); g.beginPath(); g.ellipse(fx, 0, 7, 4, 0, 0, Math.PI); g.fill(); g.fillStyle = sk; g.beginPath(); g.ellipse(fx, 0, 5.5, 2.8, 0, 0, Math.PI); g.fill(); break;
      case 'jacket': g.fillStyle = c2; g.fillRect(fx - 7, 0, 14, H); g.fillStyle = shade(c1, 0.75); g.fillRect(fx - 8, 0, 1.4, H); g.fillRect(fx + 6.6, 0, 1.4, H); g.fillStyle = shade(c1, 1.15); g.fillRect(x0, 0, W, 3); g.fillStyle = sk; g.beginPath(); g.ellipse(fx, 0, 5, 3, 0, 0, Math.PI); g.fill(); g.fillStyle = '#c8c8c8'; for (let y = 6; y < 60; y += 3) g.fillRect(fx + 7.3, y, 0.8, 1.6); break;
      case 'robot': g.fillStyle = c1; g.fillRect(x0, 0, W, H); for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) { PT.vgrad(g, x0 + x + 0.5, y + 0.5, 15, 15, [[0, shade(c1, 1.25)], [1, shade(c1, 0.8)]]); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x0 + x + 2, y + 2, 1, 1); g.fillRect(x0 + x + 13, y + 2, 1, 1); g.fillRect(x0 + x + 2, y + 13, 1, 1); g.fillRect(x0 + x + 13, y + 13, 1, 1); } g.fillStyle = '#222'; g.beginPath(); g.arc(fx, 18, 6.5, 0, TAU); g.fill(); g.fillStyle = C.extra || '#ff3a1a'; g.beginPath(); g.arc(fx, 18, 4.6, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(fx - 1.4, 16.6, 1.4, 0, TAU); g.fill(); g.fillStyle = '#333'; for (let i = 0; i < 4; i++) g.fillRect(fx - 7 + i * 4, 44, 2, 10); break;
      case 'cardigan': for (let x = 0; x < W; x += 2.5) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x0 + x, 0, 1, H); } g.fillStyle = '#f4f0e8'; g.beginPath(); g.moveTo(fx - 7, 0); g.lineTo(fx, 10); g.lineTo(fx + 7, 0); g.fill(); g.fillStyle = shade(c1, 0.7); g.fillRect(fx - 0.7, 8, 1.4, H); g.fillStyle = c2; for (let y = 14; y < 62; y += 9) { g.beginPath(); g.arc(fx + 2.6, y, 1.4, 0, TAU); g.fill(); } g.fillStyle = shade(c1, 1.2); g.fillRect(x0 + 6, 46, 9, 8); g.fillRect(x0 + 49, 46, 9, 8); break;
      case 'fur': for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${R() * 0.07})`; g.fillRect(x0 + R() * W, R() * H, 0.6, 2); } g.fillStyle = c2; g.beginPath(); g.ellipse(fx, 38, 13, 22, 0, 0, TAU); g.fill(); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(0,0,0,${R() * 0.07})`; g.fillRect(fx - 12 + R() * 24, 18 + R() * 40, 0.6, 2); } break;
      case 'armour': { PT.vgrad(g, x0, 0, W, H, [[0, shade(c1, 1.3)], [0.5, c1], [1, shade(c1, 0.7)]]); g.fillStyle = shade(c1, 1.5); g.fillRect(fx - 0.6, 2, 1.2, 36); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0, 38, W, 1.2); for (let y = 44; y < H; y += 6) g.fillRect(x0, y, W, 0.8); g.fillStyle = c2; g.fillRect(fx - 12, 0, 24, 2.5); if (F.emblem) emblem(g, F.emblem, fx, 20, 6, C.extra || c2, c1); break; }
      case 'labcoat': g.fillStyle = C.shirt || '#9ab8d8'; g.fillRect(fx - 6, 0, 12, 40); g.fillStyle = C.tie || '#c01a1a'; g.beginPath(); g.moveTo(fx - 1.6, 2); g.lineTo(fx + 1.6, 2); g.lineTo(fx + 2.2, 28); g.lineTo(fx, 31); g.lineTo(fx - 2.2, 28); g.fill(); g.fillStyle = shade(c1, 0.8); g.fillRect(fx - 7, 0, 1.4, H); g.fillRect(fx + 5.6, 0, 1.4, H); g.fillStyle = shade(c1, 0.88); g.fillRect(fx + 9, 22, 8, 9); g.fillStyle = '#2a4ad0'; g.fillRect(fx + 10, 19, 1, 5); g.fillStyle = '#d02a2a'; g.fillRect(fx + 12, 19.5, 1, 4.5); break;
      case 'camo': { const cc = [shade(c1, 0.7), c2, shade(c1, 1.25), '#3a2a1a']; for (let i = 0; i < 70; i++) { g.fillStyle = cc[i % 4]; g.beginPath(); g.ellipse(x0 + R() * W, R() * H, 2 + R() * 4, 1.5 + R() * 2.5, R() * 3, 0, TAU); g.fill(); } g.fillStyle = '#e0d8b0'; g.fillRect(fx + 4, 14, 9, 2.4); g.fillStyle = '#222'; g.fillRect(fx + 5, 14.6, 7, 1.2); g.fillStyle = sk; g.beginPath(); g.ellipse(fx, 0, 5, 3, 0, 0, Math.PI); g.fill(); break; }
      case 'robe': { lapels(c2, 26, C.inner || sk); g.strokeStyle = rgba(c2, 0.55); g.lineWidth = 1; for (let i = 0; i < 8; i++) { const cx = x0 + 6 + R() * 52, cy = 30 + R() * 30; g.beginPath(); g.arc(cx, cy, 2.5, 0, Math.PI * 1.5); g.arc(cx + 2.5, cy, 1.2, Math.PI, TAU * 0.9); g.stroke(); } g.fillStyle = c2; g.fillRect(x0, 60, W, 4); break; }
      case 'pirate': g.fillStyle = '#f2ece0'; g.fillRect(x0, 0, W, H); g.fillStyle = c1; g.fillRect(x0, 0, 21, H); g.fillRect(x0 + 43, 0, 21, H); g.fillStyle = shade(c1, 0.7); g.fillRect(x0 + 20, 0, 1.2, H); g.fillRect(x0 + 43, 0, 1.2, H); g.fillStyle = '#d8d0c0'; g.beginPath(); g.moveTo(fx - 5, 0); g.lineTo(fx, 12); g.lineTo(fx + 5, 0); g.fill(); g.fillStyle = sk; g.beginPath(); g.moveTo(fx - 3.5, 0); g.lineTo(fx, 9); g.lineTo(fx + 3.5, 0); g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 0.5; for (let y = 3; y < 10; y += 2) { g.beginPath(); g.moveTo(fx - 1.5, y); g.lineTo(fx + 1.5, y + 1); g.stroke(); } g.fillStyle = C.extra || '#c01a1a'; g.fillRect(x0, 50, W, 9); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x0, 54, W, 1); break;
      case 'chef': g.fillStyle = shade(c1, 0.9); g.fillRect(fx - 12, 0, 2, H); for (const s of [-1, 1]) for (let y = 10; y < 46; y += 8) { g.fillStyle = '#bbb'; g.beginPath(); g.arc(fx + s * 6, y, 1.4, 0, TAU); g.fill(); } g.fillStyle = C.extra || '#d02020'; g.beginPath(); g.moveTo(fx - 6, 0); g.lineTo(fx, 7); g.lineTo(fx + 6, 0); g.fill(); g.fillStyle = shade(c1, 0.92); g.fillRect(x0, 0, W, 2); break;
      case 'ninja': g.fillStyle = shade(c1, 1.25); g.beginPath(); g.moveTo(fx - 10, 0); g.lineTo(fx + 3, 26); g.lineTo(fx + 6, 26); g.lineTo(fx - 6, 0); g.fill(); for (let y = 0; y < H; y += 3) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x0, y, W, 1); } g.fillStyle = c2; g.fillRect(x0, 48, W, 7); g.fillStyle = shade(c2, 0.7); g.fillRect(fx + 3, 48, 4, 14); break;
      case 'fencer': g.fillStyle = shade(c1, 0.86); g.fillRect(fx + 3, 0, 1.2, H); g.fillStyle = c2; for (let y = 4; y < 60; y += 6) g.fillRect(fx + 5, y, 1.6, 1.6); g.fillStyle = shade(c1, 1.05); g.fillRect(x0, 0, W, 4); if (F.emblem) emblem(g, F.emblem, fx - 8, 16, 3.2, C.extra || '#d02a2a', '#fff'); break;
      case 'tunic': g.fillStyle = sk; g.fillRect(x0, 0, W, H); g.fillStyle = c1; g.beginPath(); g.moveTo(x0 + 40, 0); g.lineTo(x0 + 64, 0); g.lineTo(x0 + 64, H); g.lineTo(x0, H); g.lineTo(x0, 36); g.lineTo(fx - 18, 40); g.lineTo(fx + 12, 0); g.fill(); g.strokeStyle = shade(c1, 0.75); g.lineWidth = 1; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(fx + 12 - i * 5, 0); g.lineTo(fx - 18 - i * 3, 42 + i * 3); g.stroke(); } muscles(36); break;
      case 'vest': g.fillStyle = sk; g.fillRect(fx - 7, 0, 14, H); muscles(48); g.fillStyle = shade(c1, 0.7); g.fillRect(fx - 8, 0, 1.4, H); g.fillRect(fx + 6.6, 0, 1.4, H); g.fillStyle = C.extra || '#e0c040'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(fx - 6 + i * 1.5, 6 + Math.sin(i / 8 * Math.PI) * 4, 0.9, 0, TAU); g.fill(); } break;
      case 'chrome': for (let x = 0; x < W; x += 2) { const k = 0.6 + Math.abs(Math.sin(x * 0.21)) * 0.7; g.fillStyle = shade(c1, k); g.fillRect(x0 + x, 0, 2, H); } muscles(50); break;
      case 'dark': { PT.vgrad(g, x0, 0, W, H, [[0, shade(c1, 1.4)], [1, shade(c1, 0.7)]]); g.strokeStyle = C.extra || '#b04aff'; g.lineWidth = 1; for (let i = 0; i < 6; i++) { const cx = fx - 12 + (i % 3) * 12, cy = 14 + (i / 3 | 0) * 18; g.beginPath(); g.moveTo(cx - 3, cy); g.lineTo(cx, cy - 4); g.lineTo(cx + 3, cy); g.lineTo(cx, cy + 4); g.closePath(); g.stroke(); } g.fillStyle = c2; g.fillRect(x0, 0, W, 3); break; }
      case 'king': { PT.vgrad(g, x0, 0, W, H, [[0, shade(c1, 1.35)], [0.6, c1], [1, shade(c1, 0.7)]]); g.fillStyle = c2; g.fillRect(x0, 40, W, H - 40); g.fillStyle = '#fff'; g.fillRect(x0, 0, W, 6); g.fillStyle = '#111'; for (let x = 2; x < W; x += 5) g.fillRect(x0 + x, 2, 1, 2); g.fillStyle = shade(c1, 1.6); g.fillRect(fx - 0.6, 6, 1.2, 34); emblem(g, 'circle', fx, 22, 4, C.extra || '#c01020', '#ff8a8a'); break; }
      case 'tracksuit': g.fillStyle = c2; g.fillRect(x0 + 14, 0, 2.5, H); g.fillRect(x0 + 47.5, 0, 2.5, H); g.fillStyle = shade(c1, 0.8); g.fillRect(fx - 0.5, 0, 1, H); g.fillStyle = shade(c1, 1.2); g.fillRect(x0, 0, W, 3); g.fillStyle = '#ddd'; g.fillRect(fx - 0.8, 3, 1.6, 2.5); break;
    }
    if (F.emblem && !['armour', 'fencer'].includes(st)) emblem(g, F.emblem, F.emblemBack ? fx - 32 : fx, F.emblemY || 18, F.emblemS || 5, C.emblem || C.extra || c2, c1);
    if (F.emblem && F.emblemBack !== false && st !== 'armour') emblem(g, F.emblem, x0 + 0.5, 20, 7, C.emblem || C.extra || c2, c1); // (a big one on the back too)
    // round shading: lighter at the front, darker round the back
    PT.hgrad(g, x0, 0, W, H, [[0, 'rgba(0,0,0,.22)'], [0.3, 'rgba(0,0,0,.05)'], [0.5, 'rgba(255,255,255,.08)'], [0.7, 'rgba(0,0,0,.05)'], [1, 'rgba(0,0,0,.22)']]);
    PT.vgrad(g, x0, 0, W, H, [[0, 'rgba(255,255,255,.06)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.15)']]);
  }
  function paintPants(g, F, C) {
    const x0 = 0, y0 = 64, W = 64, H = 32, fx = 32, st = F.pants || 'plain', c = C.pants, R = prng(77);
    g.fillStyle = c; g.fillRect(x0, y0, W, H);
    switch (st) {
      case 'gi': g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 9; i++) g.fillRect(R() * W, y0 + R() * H, 0.8, 4 + R() * 6); break;
      case 'jeans': for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(255,255,255,${R() * 0.12})`; g.fillRect(R() * W, y0 + R() * H, 1.4, 0.5); } g.fillStyle = '#e0a040'; g.fillRect(fx - 16.3, y0, 0.6, H); g.fillRect(fx + 15.7, y0, 0.6, H); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(fx - 4, y0 + 15, 8, 2); if (F.rips) { g.fillStyle = C.skin; g.fillRect(fx - 3, y0 + 15.4, 6, 1.2); } break;
      case 'stripe': g.fillStyle = C.stripe || C.top2 || '#fff'; g.fillRect(fx - 16.8, y0, 1.8, H); g.fillRect(fx + 15, y0, 1.8, H); break;
      case 'camo': { const cc = [shade(c, 0.7), C.top2 || shade(c, 0.5), shade(c, 1.25), '#3a2a1a']; for (let i = 0; i < 40; i++) { g.fillStyle = cc[i % 4]; g.beginPath(); g.ellipse(R() * W, y0 + R() * H, 2 + R() * 3, 1.2 + R() * 2, R() * 3, 0, TAU); g.fill(); } break; }
      case 'check': for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (((x + y) / 2) % 2) { g.fillStyle = C.pants2 || '#222'; g.fillRect(x, y0 + y, 2, 2); } break;
      case 'hoops': for (let y = 0; y < H; y += 4) { g.fillStyle = C.pants2 || '#fff'; g.fillRect(x0, y0 + y, W, 2); } break;
      case 'armour': for (let y = 0; y < H; y += 5) { PT.vgrad(g, x0, y0 + y, W, 5, [[0, shade(c, 1.3)], [1, shade(c, 0.75)]]); } break;
      case 'fur': for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${R() * 0.07})`; g.fillRect(R() * W, y0 + R() * H, 0.6, 2); } break;
      case 'chrome': for (let x = 0; x < W; x += 2) { g.fillStyle = shade(c, 0.6 + Math.abs(Math.sin(x * 0.3)) * 0.7); g.fillRect(x, y0, 2, H); } break;
    }
    if (F.kneepads) { g.fillStyle = C.pad || '#222'; g.fillRect(fx - 6, y0 + 13, 12, 6); }
    PT.hgrad(g, x0, y0, W, H, [[0, 'rgba(0,0,0,.22)'], [0.5, 'rgba(255,255,255,.06)'], [1, 'rgba(0,0,0,.22)']]);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x0, y0 + 15, W, 1);
  }
  function paintExtra(g, F, C) {
    const x0 = 0, y0 = 96, W = 64, H = 32, c = C.cape || C.extra || '#8a1010';
    g.fillStyle = c; g.fillRect(x0, y0, W, H);
    PT.hgrad(g, x0, y0, W, H, [[0, 'rgba(0,0,0,.3)'], [0.25, 'rgba(255,255,255,.08)'], [0.5, 'rgba(0,0,0,.25)'], [0.75, 'rgba(255,255,255,.08)'], [1, 'rgba(0,0,0,.3)']]);
    g.fillStyle = C.trim || shade(c, 1.6); g.fillRect(x0, y0 + H - 2.5, W, 2.5); g.fillRect(x0, y0, 1.6, H); g.fillRect(W - 1.6, y0, 1.6, H);
    if (F.capeEmblem) emblem(g, F.capeEmblem, x0 + W / 4, y0 + 13, 6, C.trim || '#ffd040', c);
  }

  // ================================================================ build a fighter: one skinned mesh
  const BN = ['pelvis', 'spine', 'chest', 'neck', 'head', 'shL', 'elL', 'hdL', 'shR', 'elR', 'hdR', 'hipL', 'knL', 'ftL', 'hipR', 'knR', 'ftR', 'hair', 'cape', 'hair2'];
  const BPAR = { spine: 'pelvis', chest: 'spine', neck: 'chest', head: 'neck', shL: 'chest', elL: 'shL', hdL: 'elL', shR: 'chest', elR: 'shR', hdR: 'elR', hipL: 'pelvis', knL: 'hipL', ftL: 'knL', hipR: 'pelvis', knR: 'hipR', ftR: 'knR', hair: 'head', cape: 'chest', hair2: 'hair' };
  const BI = {}; BN.forEach((n, i) => { BI[n] = i; });
  function costumeCols(F, cos) { const C = Object.assign({ skin: '#e0b090', hair: '#2a1a10', top: '#dddddd', pants: '#333344', shoe: '#222222', eye: '#3a2a1a' }, F.col, (cos && F.cos && F.cos[cos - 1] && F.cos[cos - 1].col) || {}); return C; }
  function buildModel(S, F, cos) {
    const T = S.T, hi = S.hi;
    const C = costumeCols(F, cos);
    const FL = Object.assign({}, F, (cos && F.cos && F.cos[cos - 1] && F.cos[cos - 1].look) || {});
    const sleeves = FL.sleeves || 'none';
    const bare = ['bare', 'singlet', 'tank', 'tunic', 'vest', 'chrome'].includes(FL.top);
    if (!C.sleeve) C.sleeve = C.top; if (!C.arm) C.arm = sleeves === 'long' ? C.sleeve : C.skin; if (!C.glove) C.glove = C.skin; if (!C.leg) C.leg = C.pants; if (!C.belt) C.belt = shade(C.pants, 0.6);
    const b = FL.body || {}, H = b.h || 1, Wd = b.w || 1, CH = b.chest || 1, BL = b.belly || 1, LM = b.limb || 1, HD = b.head || 1, AR = b.arm || 1, LG = b.legs || 1, TO = b.torso || 1, GL = b.glove || 1;
    // ---- the atlas
    const AW = hi ? 256 : 128, cv = document.createElement('canvas'); cv.width = cv.height = AW;
    const g = cv.getContext('2d'); g.scale(AW / 128, AW / 128);
    g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
    g.save(); g.scale(1, 2); paintHead(g, FL, C); g.restore(); paintTop(g, FL, C); paintPants(g, FL, C); paintExtra(g, FL, C);
    g.fillStyle = '#fff'; g.fillRect(118, 118, 10, 10);
    const tex = S.track(new T.CanvasTexture(cv));
    if (hi) { tex.magFilter = T.LinearFilter; tex.minFilter = T.LinearMipmapLinearFilter; } else { tex.magFilter = T.NearestFilter; tex.minFilter = T.NearestFilter; tex.generateMipmaps = false; }
    tex.wrapS = tex.wrapT = T.ClampToEdgeWrapping;
    const R = (x, y, w, h) => [x / 128, 1 - (y + h) / 128, (x + w) / 128, 1 - y / 128];
    const WH = [123 / 128, 1 - 123 / 128];
    const RH = R(0, 1, 64, 62), RTc = R(64.5, 0, 63, 40), RTa = R(64.5, 40, 63, 24), RPt = R(0.5, 64, 63, 16), RPs = R(0.5, 80, 63, 16), RX = R(0.5, 96, 63, 32);
    // ---- the skeleton (bind pose: standing straight, arms down)
    const LL = 0.9 * H * LG, ank = 0.085 * H, th = (LL - 0.05 * H - ank) / 2;
    const ab = 0.14 * H * TO, ch = 0.3 * H * TO, ua = 0.29 * H * AR, fa = 0.25 * H * AR;
    const sx = 0.21 * Wd * CH + 0.055, hr = 0.126 * H * HD;
    const P = {}; const set = (n, x, y, z) => { P[n] = [x, y, z]; };
    set('pelvis', 0, LL, 0); set('spine', 0, LL + 0.06 * H, 0); set('chest', 0, LL + 0.06 * H + ab, 0); set('neck', 0, P.chest[1] + ch, 0); set('head', 0, P.neck[1] + 0.05 * H, 0);
    for (const [s, k] of [['L', -1], ['R', 1]]) {
      set('sh' + s, k * sx, P.chest[1] + ch - 0.045 * H, 0); set('el' + s, k * sx, P['sh' + s][1] - ua, 0); set('hd' + s, k * sx, P['el' + s][1] - fa, 0);
      set('hip' + s, k * 0.095 * Wd, LL - 0.05 * H, 0); set('kn' + s, k * 0.095 * Wd, P['hip' + s][1] - th, 0); set('ft' + s, k * 0.095 * Wd, ank, 0);
    }
    set('hair', 0, P.head[1] + hr * 1.5, -hr * 0.85); set('hair2', 0, P.hair[1] - 0.16 * H, -hr * 0.95); set('cape', 0, P.chest[1] + ch - 0.02 * H, -0.13 * Wd * CH);
    const bones = BN.map(n => { const bo = new T.Bone(); bo.name = n; return bo; });
    BN.forEach((n, i) => { const par = BPAR[n], p = P[n]; if (par) { const q = P[par]; bones[i].position.set(p[0] - q[0], p[1] - q[1], p[2] - q[2]); bones[BI[par]].add(bones[i]); } else bones[i].position.set(p[0], p[1], p[2]); });
    for (const n of ['shL', 'shR', 'hipL', 'hipR']) bones[BI[n]].rotation.order = 'YXZ';
    // ---- the body
    const mm = Mesher(T, WH);
    const seg = hi ? 10 : 7, hs = hi ? [18, 13] : [10, 8];
    const at = (bn, dx, dy, dz, o) => Object.assign({ x: P[bn][0] + (dx || 0), y: P[bn][1] + (dy || 0), z: P[bn][2] + (dz || 0), bone: BI[bn] }, o || {});
    const sz = 0.7 * Math.sqrt(BL), wl = Wd * Math.pow(BL, 0.75);
    // pelvis + tummy + chest
    mm.cyl(0.152 * wl, 0.165 * Wd, 0.2 * H, seg, at('pelvis', 0, -0.06 * H, 0, { sz: 0.74 * Math.sqrt(BL), col: C.shorts || C.pants }));
    mm.cyl(0.165 * Wd * CH * (bare && FL.top === 'bare' ? 0.95 : 1), 0.152 * wl, ab + 0.05, seg, at('spine', 0, ab / 2, 0, { sz, uv: RTa }));
    if (BL > 1.12) mm.ball(0.13 * Wd * Math.pow(BL, 0.8), seg, seg - 2, at('spine', 0, ab * 0.3, 0.035 * BL, { sz: 0.78, sy: 1.0, col: C.belly || (FL.top === 'bare' || FL.top === 'tunic' ? C.skin : FL.top === 'fur' ? (C.top2 || C.top) : C.top), uv: WH }));
    mm.cyl(0.205 * Wd * CH, 0.168 * Wd * CH * Math.max(1, BL * 0.92), ch, seg, at('chest', 0, ch / 2, 0, { sz: 0.66 * (CH > 1.08 ? 1.08 : 1), uv: RTc }));
    mm.cyl(0.085 * Math.sqrt(Wd * CH), 0.205 * Wd * CH, 0.085 * H, seg, at('chest', 0, ch + 0.035 * H, -0.01, { sz: 0.62, col: C.shoulder || (bare || FL.top === 'tank' || FL.top === 'singlet' ? C.skin : C.top), uv: WH }));
    if (FL.belt !== false && (C.beltOn || FL.extra && FL.extra.includes('belt'))) {
      mm.cyl(0.158 * wl, 0.158 * wl, 0.05, seg, at('pelvis', 0, 0.035, 0, { sz: 0.78 * Math.sqrt(BL), col: C.belt, uv: WH }));
      if (FL.extra && FL.extra.includes('beltTails')) for (const s of [-1, 1]) mm.box(0.035, 0.2, 0.012, at('pelvis', s * 0.035, -0.07, 0.122 * Math.sqrt(BL), { rz: s * 0.18, col: C.belt, uv: WH }));
    }
    // neck + head
    mm.cyl(0.066 * Math.sqrt(Wd * CH), 0.078 * Math.sqrt(Wd * CH), 0.11 * H, seg, at('neck', 0, 0.02 * H, 0, { col: C.neck || (FL.face && FL.face.full) || C.skin, uv: WH }));
    mm.ball(hr, hs[0], hs[1], at('head', 0, hr * 0.95, 0.008, { sx: 0.9, sy: 1.08, uv: RH }));
    const noFace = FL.face && (FL.face.eyes === 'robot' || FL.face.noNose);
    if (!noFace) mm.cone(hr * 0.13, hr * 0.36, 4, at('head', 0, hr * 0.84, hr * 0.93, { col: shade((FL.face && FL.face.full) || C.skin, 0.95), uv: WH, rx: 0.25, ry: Math.PI / 4, sz: 1.6 }));
    if (!(FL.face && FL.face.full) && !['helmet', 'hood'].includes(FL.hair)) for (const s of [-1, 1]) mm.box(hr * 0.16, hr * 0.42, hr * 0.3, at('head', s * hr * 0.88, hr * 0.92, -0.01, { col: shade(C.skin, 0.9), uv: WH }));
    hairGeo(mm, FL, C, at, hr, H, hs, seg);
    // arms
    const upC = sleeves === 'none' ? C.arm2 || C.skin : C.sleeve, loC = sleeves === 'long' ? C.sleeve : (C.arm === C.sleeve && sleeves !== 'long' ? C.skin : C.arm);
    for (const [s, k] of [['L', -1], ['R', 1]]) {
      mm.ball(0.074 * H * LM, seg, seg - 2, at('sh' + s, 0, -0.01, 0, { col: sleeves === 'none' ? (C.shoulderPad || upC) : C.sleeve, uv: WH, sx: 1.05 }));
      mm.cyl(0.07 * LM, 0.056 * LM, ua, seg, at('sh' + s, 0, -ua / 2, 0, { col: sleeves === 'short' ? C.skin : upC, uv: WH }));
      if (sleeves === 'short') mm.cyl(0.078 * LM, 0.072 * LM, ua * 0.45, seg, at('sh' + s, 0, -ua * 0.22, 0, { col: C.sleeve, uv: WH }));
      mm.ball(0.055 * LM, seg, seg - 3, at('el' + s, 0, 0, 0, { col: sleeves === 'long' ? C.sleeve : (sleeves === 'short' ? C.skin : loC), uv: WH }));
      mm.cyl(0.056 * LM, 0.043 * LM, fa, seg, at('el' + s, 0, -fa / 2, 0, { col: sleeves === 'short' ? C.skin : loC, uv: WH }));
      if (C.band) mm.cyl(0.05 * LM, 0.048 * LM, 0.05, seg, at('hd' + s, 0, 0.035, 0, { col: C.band, uv: WH }));
      if (FL.gloves === 'boxing') mm.ball(0.078 * GL, seg, seg - 2, at('hd' + s, 0, -0.065, 0.015, { col: C.glove, uv: WH, sz: 1.1 }));
      else { mm.box(0.092 * GL, 0.105 * GL, 0.105 * GL, at('hd' + s, 0, -0.055, 0.012, { col: C.glove, uv: WH })); mm.box(0.094 * GL, 0.03, 0.03, at('hd' + s, 0, -0.1 * GL, 0.055, { col: shade(C.glove, 0.85), uv: WH })); mm.box(0.032, 0.058, 0.042, at('hd' + s, -k * 0.04, -0.03, 0.06, { col: C.glove, uv: WH, rz: k * 0.3 })); }
      // legs
      const tk = FL.baggy ? 1.28 : 1;
      mm.cyl(0.1 * Math.sqrt(Wd) * LM * tk, 0.068 * LM * tk, th + 0.03, seg, at('hip' + s, 0, -th / 2, 0, { uv: C.leg === C.pants || true ? RPt : WH, col: '#ffffff' }));
      mm.ball(0.066 * LM * tk, seg, seg - 3, at('kn' + s, 0, 0, 0, { col: FL.kneepads ? (C.pad || '#222') : C.pants, uv: WH }));
      if (C.leg === C.pants) mm.cyl(0.066 * LM * tk, 0.048 * LM * (FL.baggy ? 1.45 : 1), th, seg, at('kn' + s, 0, -th / 2, 0, { uv: RPs, col: '#ffffff' }));
      else { mm.cyl(0.064 * LM, 0.046 * LM, th, seg, at('kn' + s, 0, -th / 2, 0, { col: C.leg, uv: WH })); mm.ball(0.052 * LM, seg, 4, at('kn' + s, 0, -th * 0.3, -0.03, { col: C.leg, uv: WH, sy: 1.6 })); }
      const sh = FL.shoes || 'shoe';
      if (sh === 'boot') mm.cyl(0.06 * LM, 0.056 * LM, 0.17, seg, at('ft' + s, 0, 0.045, 0, { col: C.shoe, uv: WH }));
      mm.box(sh === 'bare' ? 0.085 : 0.1, 0.075, sh === 'bare' ? 0.22 : 0.25, at('ft' + s, 0, -0.045, 0.06, { col: sh === 'bare' ? C.skin : C.shoe, uv: WH }));
      if (sh === 'trainer') mm.box(0.104, 0.022, 0.262, at('ft' + s, 0, -0.075, 0.062, { col: C.sole || '#f4f4f4', uv: WH }));
    }
    extrasGeo(mm, FL, C, at, { H, Wd, CH, BL, ch, ab, fa, ua, th, seg, RX, WH, wl, P, hr });
    const tips = weaponGeo(mm, FL, C, at, P, hi);
    // ---- the mesh
    const geo = S.S3.keep(mm.build(true));
    const mat = S.fmat(tex);
    const mesh = new T.SkinnedMesh(geo, mat);
    mesh.add(bones[0]); mesh.frustumCulled = false;
    mesh.updateMatrixWorld(true);
    const skel = new T.Skeleton(bones);
    mesh.bind(skel);
    const model = { mesh, bones, B: {}, skel, LL, H, hr, ch, th, P, tips, C, F: FL, tex, cos: cos || 0 };
    BN.forEach((n, i) => { model.B[n] = bones[i]; });
    // trail anchor points (bone, local offset): fists, feet and the weapon
    const off = (bn, wp) => [BI[bn], new T.Vector3(wp[0] - P[bn][0], wp[1] - P[bn][1], wp[2] - P[bn][2])];
    model.anchor = {
      hdL: [off('hdL', [P.hdL[0], P.hdL[1] - 0.06, P.hdL[2]]), off('elL', [P.elL[0], P.elL[1] - fa * 0.3, P.elL[2]])],
      hdR: [off('hdR', [P.hdR[0], P.hdR[1] - 0.06, P.hdR[2]]), off('elR', [P.elR[0], P.elR[1] - fa * 0.3, P.elR[2]])],
      ftL: [off('ftL', [P.ftL[0], P.ftL[1] - 0.04, P.ftL[2] + 0.16]), off('knL', [P.knL[0], P.knL[1] - th * 0.35, P.knL[2]])],
      ftR: [off('ftR', [P.ftR[0], P.ftR[1] - 0.04, P.ftR[2] + 0.16]), off('knR', [P.knR[0], P.knR[1] - th * 0.35, P.knR[2]])],
    };
    if (tips) model.anchor.wpn = [off('hdR', tips[1]), off('hdR', tips[0])];
    if (tips && tips[2]) model.anchor.wpn2 = [off('hdL', tips[3]), off('hdL', tips[2])];
    model.dispose = () => { geo.dispose(); mat.dispose(); };
    return model;
  }
  function hairGeo(mm, F, C, at, hr, H, hs, seg) {
    const hc = (dx, dy, dz, o) => at('head', dx || 0, hr * 0.95 + (dy || 0), dz || 0, o);
    const hcol = C.hair, hat = C.hat || C.extra || '#c01a1a', W = { uv: [123 / 128, 5 / 128] };
    const cap = (r, tl, o) => mm.ball(hr * r, hs[0], Math.max(4, hs[1] / 2 | 0), hc(0, 0, -hr * 0.04, Object.assign({ t0: 0, tl: tl || Math.PI * 0.42, sx: 0.92, sy: 1.08, col: hcol, rx: -0.28 }, W, o)));
    switch (F.hair) {
      case 'short': cap(1.07); break;
      case 'spiky': cap(1.06); for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU, r = hr * 0.55; mm.cone(hr * 0.24, hr * 0.7, 4, hc(Math.sin(a) * r * 0.9, hr * 0.85, Math.cos(a) * r - hr * 0.15, Object.assign({ rx: Math.cos(a) * 0.7 - 0.35, rz: -Math.sin(a) * 0.7, col: hcol }, W))); } break;
      case 'band': cap(1.06); mm.cyl(hr * 0.98, hr * 1.0, hr * 0.26, hs[0], hc(0, hr * 0.38, -hr * 0.02, Object.assign({ sx: 0.93, col: C.band2 || C.extra || '#e01a1a', rx: -0.12 }, W))); for (const s of [-1, 1]) mm.box(hr * 0.22, hr * 1.5, 0.012, at('hair', s * hr * 0.15, -hr * 0.55, -0.02, Object.assign({ rx: 0.35, rz: s * 0.25, col: C.band2 || C.extra || '#e01a1a', bone: 17 }, W))); break;
      case 'pony': cap(1.07); mm.ball(hr * 0.3, 6, 5, at('hair', 0, -hr * 0.1, 0.02, Object.assign({ col: hcol }, W))); mm.cyl(hr * 0.3, hr * 0.1, 0.3 * H, 6, at('hair2', 0, -0.06 * H, 0, Object.assign({ col: hcol, bone: 19 }, W))); break;
      case 'bun': cap(1.06); mm.ball(hr * 0.46, 8, 6, hc(0, hr * 0.85, -hr * 0.55, Object.assign({ col: hcol }, W))); break;
      case 'long': cap(1.08, Math.PI * 0.5); mm.box(hr * 1.75, 0.36 * H, hr * 0.32, at('hair', 0, -0.13 * H, 0.03, Object.assign({ col: hcol, rx: 0.08 }, W))); mm.box(hr * 1.6, 0.2 * H, hr * 0.3, at('hair2', 0, -0.09 * H, 0, Object.assign({ col: hcol, bone: 19 }, W))); break;
      case 'mohawk': mm.box(hr * 0.24, hr * 0.62, hr * 1.85, hc(0, hr * 0.98, -hr * 0.12, Object.assign({ col: hcol, rx: -0.15 }, W))); break;
      case 'afro': mm.ball(hr * 1.38, hs[0], hs[1], hc(0, hr * 0.38, -hr * 0.22, Object.assign({ col: hcol, sx: 0.95 }, W))); break;
      case 'cap': cap(1.1, Math.PI * 0.44, { col: hat, rx: -0.1 }); mm.box(hr * 1.4, hr * 0.08, hr * 0.95, hc(0, hr * 0.52, -hr * 1.2, Object.assign({ col: hat, rx: 0.15 }, W))); mm.box(hr * 0.3, hr * 0.06, hr * 0.3, hc(0, hr * 1.12, 0, Object.assign({ col: shade(hat, 0.6) }, W))); break;
      case 'beret': cap(1.04); mm.ball(hr * 1.08, 10, 5, hc(hr * 0.12, hr * 0.72, -hr * 0.05, Object.assign({ t0: 0, tl: Math.PI * 0.5, sy: 0.42, rz: 0.32, col: hat }, W))); break;
      case 'crown': cap(1.05, Math.PI * 0.4); mm.cyl(hr * 0.95, hr * 0.88, hr * 0.42, 10, hc(0, hr * 0.98, 0, Object.assign({ col: C.crown || '#ffd040', open: true }, W))); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; mm.cone(hr * 0.16, hr * 0.42, 4, hc(Math.sin(a) * hr * 0.88, hr * 1.38, Math.cos(a) * hr * 0.88, Object.assign({ col: C.crown || '#ffd040' }, W))); } mm.ball(hr * 0.14, 6, 4, hc(0, hr * 0.98, hr * 0.96, Object.assign({ col: '#e01a3a' }, W))); break;
      case 'robot': cap(1.08, Math.PI * 0.5, { col: C.helm || '#8a9098', rx: 0 }); mm.cyl(0.012, 0.012, hr * 1.4, 4, hc(hr * 0.62, hr * 1.25, 0, Object.assign({ col: '#aaa' }, W))); mm.ball(hr * 0.2, 6, 4, hc(hr * 0.62, hr * 1.95, 0, Object.assign({ col: C.extra || '#ff2a1a' }, W))); for (const s of [-1, 1]) mm.cyl(hr * 0.3, hr * 0.3, hr * 0.25, 8, hc(s * hr * 0.95, 0, 0, Object.assign({ rz: Math.PI / 2, col: C.helm || '#6a7078' }, W))); break;
      case 'helmet': mm.ball(hr * 1.18, hs[0], hs[1], hc(0, hr * 0.05, -hr * 0.03, Object.assign({ col: C.helm || '#b8bcc8', sx: 0.95, sy: 1.08 }, W))); mm.box(hr * 1.3, hr * 0.2, 0.04, hc(0, 0, hr * 1.12, Object.assign({ col: '#111' }, W))); mm.box(hr * 0.12, hr * 1.1, 0.03, hc(0, -hr * 0.5, hr * 1.13, Object.assign({ col: shade(C.helm || '#b8bcc8', 0.8) }, W))); mm.box(hr * 0.18, hr * 0.7, hr * 1.7, hc(0, hr * 1.3, -hr * 0.2, Object.assign({ col: C.plume || C.extra || '#c01a1a' }, W))); break;
      case 'ears': cap(1.06); for (const s of [-1, 1]) mm.ball(hr * 0.34, 8, 6, hc(s * hr * 0.72, hr * 0.85, -hr * 0.1, Object.assign({ col: hcol, sz: 0.6 }, W))); break;
      case 'grot': for (const s of [-1, 1]) mm.cone(hr * 0.3, hr * 1.3, 5, hc(s * hr * 1.35, hr * 0.15, -hr * 0.15, Object.assign({ rz: -s * Math.PI / 2 * 0.85, ry: s * 0.4, sz: 0.4, col: C.skin }, W))); break;
      case 'chef': cap(1.04); mm.cyl(hr * 0.88, hr * 0.94, hr * 1.0, seg, hc(0, hr * 1.25, 0, Object.assign({ col: '#f8f8f8' }, W))); mm.ball(hr * 1.12, hs[0], hs[1] / 2 | 0, hc(0, hr * 1.85, 0, Object.assign({ sy: 0.62, col: '#ffffff' }, W))); break;
      case 'tricorn': cap(1.06); mm.cyl(hr * 1.6, hr * 1.6, 0.03, 3, hc(0, hr * 0.78, 0, Object.assign({ col: hat, ry: Math.PI }, W))); mm.ball(hr * 0.98, 10, 5, hc(0, hr * 0.62, 0, Object.assign({ t0: 0, tl: Math.PI * 0.5, col: hat }, W))); if (C.skullHat) mm.box(hr * 0.3, hr * 0.3, 0.02, hc(0, hr * 0.98, hr * 0.92, Object.assign({ col: '#f4f4f4' }, W))); break;
      case 'hood': mm.ball(hr * 1.2, hs[0], hs[1], hc(0, hr * 0.05, -hr * 0.12, Object.assign({ t0: 0, tl: Math.PI * 0.62, rx: -0.55, col: C.hood || C.top }, W))); break;
      case 'topknot': cap(1.06); mm.cyl(hr * 0.2, hr * 0.26, hr * 0.42, 6, hc(0, hr * 1.18, -hr * 0.32, Object.assign({ col: hcol, rx: -0.4 }, W))); break;
      case 'wild': cap(1.06); for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 1.2 + Math.PI * 0.4; mm.cone(hr * 0.22, hr * 0.85, 4, hc(Math.cos(a) * hr * 0.85, hr * 0.5 + Math.sin(i) * hr * 0.2, -Math.abs(Math.sin(a)) * hr * 0.5 - hr * 0.2, Object.assign({ rz: -Math.cos(a) * 1.3, rx: -0.8, col: hcol }, W))); } break;
      case 'horns': mm.ball(hr * 1.14, hs[0], hs[1], hc(0, hr * 0.1, -hr * 0.05, Object.assign({ t0: 0, tl: Math.PI * 0.56, col: C.helm || '#2a1a3a' }, W))); for (const s of [-1, 1]) { mm.cone(hr * 0.2, hr * 1.1, 5, hc(s * hr * 0.95, hr * 1.0, -hr * 0.1, Object.assign({ rz: -s * 0.75, col: C.horn || '#e8e0d0' }, W))); } break;
      case 'bob': cap(1.1, Math.PI * 0.52); for (const s of [-1, 1]) mm.box(hr * 0.3, hr * 1.1, hr * 1.5, hc(s * hr * 0.86, hr * 0.15, -hr * 0.18, Object.assign({ col: hcol }, W))); mm.box(hr * 1.7, hr * 1.1, hr * 0.3, hc(0, hr * 0.15, -hr * 0.92, Object.assign({ col: hcol }, W))); break;
      case 'bandana': cap(1.08, Math.PI * 0.46, { col: hat }); mm.ball(hr * 0.25, 6, 4, at('hair', 0, -hr * 0.2, 0.02, Object.assign({ col: hat }, W))); for (const s of [-1, 1]) mm.box(hr * 0.25, hr * 1.2, 0.012, at('hair2', s * hr * 0.12, hr * 0.5, 0, Object.assign({ rz: s * 0.2, col: hat, bone: 19 }, W))); break;
      case 'pigtails': cap(1.07); for (const s of [-1, 1]) { mm.ball(hr * 0.22, 6, 4, hc(s * hr * 0.9, hr * 0.4, -hr * 0.3, Object.assign({ col: C.band2 || '#e03a6a' }, W))); mm.cyl(hr * 0.25, hr * 0.08, hr * 1.6, 6, hc(s * hr * 1.1, -hr * 0.4, -hr * 0.35, Object.assign({ rz: s * 0.3, col: hcol }, W))); } break;
      case 'mimic': cap(1.02, Math.PI * 0.4, { col: C.hair }); break;
      default: break; // bald (the hair is painted on, or there is none)
    }
  }
  function extrasGeo(mm, F, C, at, d) {
    const ex = F.extra || [], W = { uv: d.WH };
    if (ex.includes('cape')) mm.box(0.5 * d.Wd * d.CH, 0.98 * d.H, 0.03, at('cape', 0, -0.47 * d.H, 0, { uv: d.RX, bone: BI.cape }));
    if (ex.includes('coat')) for (const s of [-1, 1]) mm.box(0.17 * d.Wd, 0.46 * d.H, 0.022, at('pelvis', s * 0.09 * d.Wd, -0.2 * d.H, -0.115 * Math.sqrt(d.BL), Object.assign({ col: C.coat || C.top, rx: 0.08 }, W)));
    if (ex.includes('tails')) for (const s of [-1, 1]) mm.box(0.12 * d.Wd, 0.36 * d.H, 0.02, at('pelvis', s * 0.08 * d.Wd, -0.18 * d.H, -0.12 * Math.sqrt(d.BL), Object.assign({ col: C.coat || C.top, rx: 0.1, rz: s * 0.08 }, W)));
    if (ex.includes('skirt')) mm.cyl(0.165 * d.wl, 0.27 * d.Wd, 0.42 * d.H, d.seg + 2, at('pelvis', 0, -0.22 * d.H, 0, Object.assign({ col: C.skirt || C.pants, open: true }, W)));
    if (ex.includes('kilt')) mm.cyl(0.165 * d.wl, 0.24 * d.Wd, 0.26 * d.H, d.seg + 2, at('pelvis', 0, -0.13 * d.H, 0, Object.assign({ col: C.skirt || C.pants, open: true }, W)));
    if (ex.includes('pads')) for (const [s, k] of [['L', -1], ['R', 1]]) mm.box(0.17, 0.07, 0.19, at('sh' + s, k * 0.03, 0.05, 0, Object.assign({ rz: -k * 0.35, col: C.pad || C.extra || '#888' }, W)));
    if (ex.includes('shield')) { mm.cyl(0.27, 0.27, 0.05, 12, at('elL', -0.1, -d.fa * 0.55, 0.05, Object.assign({ rz: Math.PI / 2, col: C.shield || C.extra || '#3a4ab0' }, W))); mm.ball(0.07, 6, 4, at('elL', -0.13, -d.fa * 0.55, 0.05, Object.assign({ col: C.boss || '#ffd040' }, W))); mm.cyl(0.275, 0.275, 0.035, 12, at('elL', -0.098, -d.fa * 0.55, 0.05, Object.assign({ rz: Math.PI / 2, col: C.boss || '#ffd040', sy: 0.6 }, W))); }
    if (ex.includes('backpack')) { mm.box(0.3, 0.34, 0.14, at('chest', 0, d.ch * 0.5, -0.19 * d.Wd, Object.assign({ col: C.pack || '#5a5a62' }, W))); for (const s of [-1, 1]) mm.cyl(0.06, 0.06, 0.4, 8, at('chest', s * 0.1, d.ch * 0.55, -0.29 * d.Wd, Object.assign({ col: C.tank || '#c8a020' }, W))); }
    if (ex.includes('sash')) mm.cyl(0.162 * d.wl, 0.16 * d.wl, 0.08, d.seg, at('spine', 0, 0.02, 0, Object.assign({ sz: 0.76, col: C.sash || C.extra || '#c01a1a' }, W)));
    if (ex.includes('necklace')) mm.torus(0.085, 0.014, 4, 10, at('neck', 0, 0.0, 0.01, Object.assign({ rx: Math.PI / 2 + 0.3, col: C.beads || '#e0c040' }, W)));
    if (ex.includes('collar')) mm.cyl(0.11, 0.17, 0.08, d.seg, at('chest', 0, d.ch - 0.01, 0, Object.assign({ sz: 0.8, col: C.collar || '#f4f4f4' }, W)));
    if (ex.includes('bag')) { const bx = d.P.shR[0] + 0.07; mm.box(0.09, 0.2, 0.24, at('pelvis', bx, -0.02, 0.0, Object.assign({ col: C.bag || '#7a2a5a' }, W))); mm.box(0.095, 0.04, 0.245, at('pelvis', bx, 0.07, 0.0, Object.assign({ col: shade(C.bag || '#7a2a5a', 0.7) }, W))); mm.ball(0.02, 5, 4, at('pelvis', bx + 0.05, 0.05, 0, Object.assign({ col: '#ffd040' }, W))); mm.box(0.02, d.ch * 1.2, 0.02, at('chest', bx - 0.08, d.ch * 0.25, 0.08, Object.assign({ col: shade(C.bag || '#7a2a5a', 0.6), rz: 0.55 }, W))); }
    if (ex.includes('tie')) mm.box(0.04, 0.2, 0.01, at('chest', 0, d.ch * 0.62, 0.135 * d.Wd * d.CH, Object.assign({ col: C.tie || '#c01a1a', rx: -0.18 }, W)));
    if (ex.includes('gauntlets')) for (const [s] of [['L'], ['R']]) mm.cyl(0.062, 0.054, d.fa * 0.6, d.seg, at('el' + s, 0, -d.fa * 0.62, 0, Object.assign({ col: C.gauntlet || C.extra || '#8a8a8a' }, W)));
    if (ex.includes('greaves')) for (const [s] of [['L'], ['R']]) mm.cyl(0.07, 0.056, d.th * 0.7, d.seg, at('kn' + s, 0, -d.th * 0.45, 0.005, Object.assign({ col: C.greave || C.extra || '#8a8a8a' }, W)));
    if (ex.includes('scarf')) { mm.torus(0.08, 0.035, 5, 10, at('neck', 0, 0.02, 0, Object.assign({ rx: Math.PI / 2, col: C.scarf || C.extra || '#c01a1a' }, W))); mm.box(0.07, 0.34, 0.02, at('hair2', 0.04, -0.02, -0.05, Object.assign({ col: C.scarf || C.extra || '#c01a1a', bone: BI.hair2, rz: 0.1 }, W))); }
    if (ex.includes('hook')) { mm.cyl(0.05, 0.05, 0.06, 8, at('hdL', 0, -0.03, 0, Object.assign({ col: '#5a3a1a' }, W))); mm.torus(0.05, 0.012, 4, 8, at('hdL', 0, -0.1, 0.03, Object.assign({ col: '#c8c8d0', arc: 1 }, W))); }
    if (ex.includes('patch')) mm.box(d.hr * 0.4, d.hr * 0.36, 0.02, at('head', -d.hr * 0.37, d.hr * 1.02, d.hr * 0.9, Object.assign({ col: '#111' }, W)));
  }
  // weapons (in the rear hand: the blade sticks out forward). Returns [tipNear, tipFar, (offhand near, far)] in bind world space
  function weaponGeo(mm, F, C, at, P, hi) {
    const Wp = F.weapon; if (!Wp) return null;
    const out = [];
    for (const side of Wp.off ? ['hdR', 'hdL'] : ['hdR']) {
      const kind = side === 'hdL' ? (Wp.off === true ? Wp.kind : Wp.off) : Wp.kind;
      const a = (Wp.angle == null ? 0.6 : Wp.angle) * Math.PI / 2, L = Wp.len || 1.1;
      const g0 = [P[side][0], P[side][1] - 0.06, P[side][2] + 0.02], d = [0, -Math.cos(a), Math.sin(a)], e = [0, Math.sin(a), Math.cos(a)];
      const pt = (t, s) => [g0[0], g0[1] + d[1] * t + e[1] * (s || 0), g0[2] + d[2] * t + e[2] * (s || 0)];
      const put = (fn, t, s, o) => { const p = pt(t, s); fn(Object.assign({ x: p[0], y: p[1], z: p[2], rx: -a, bone: BI[side], uv: [123 / 128, 5 / 128] }, o)); };
      const blade = Wp.col || '#dfe6f0', acc = Wp.col2 || '#d0a020', grip = Wp.grip || '#3a2a1a', sg = hi ? 8 : 5;
      const cyl = (rt, rb, h, t, s, o) => put(q => mm.cyl(rt, rb, h, sg, q), t, s, o);
      const box = (w, h, dd, t, s, o) => put(q => mm.box(w, h, dd, q), t, s, o);
      let near = 0.2, far = L;
      switch (kind) {
        case 'sword': case 'katana': case 'great': case 'cutlass': {
          const wide = kind === 'great' ? 0.16 : kind === 'cutlass' ? 0.11 : kind === 'katana' ? 0.055 : 0.085;
          cyl(0.024, 0.024, kind === 'katana' ? 0.28 : 0.22, -0.01, 0, { col: grip }); put(q => mm.ball(0.035, 6, 4, q), -0.14, 0, { col: acc });
          if (kind === 'katana') cyl(0.06, 0.06, 0.02, 0.13, 0, { col: acc });
          else if (kind === 'cutlass') { box(0.13, 0.05, 0.12, 0.12, 0.03, { col: acc }); }
          else box(kind === 'great' ? 0.36 : 0.26, 0.045, 0.06, 0.12, 0, { col: acc });
          box(wide, L, 0.022, 0.14 + L / 2, kind === 'cutlass' ? 0.02 : 0, { col: blade });
          if (Wp.edge) box(0.012, L, 0.03, 0.14 + L / 2, 0, { col: Wp.edge, x: g0[0] + (wide / 2) });
          put(q => mm.cone(wide * 0.58, 0.16, 4, q), 0.14 + L + 0.07, kind === 'cutlass' ? 0.03 : 0, { col: blade, sz: 0.25, rx: -a + Math.PI });
          near = 0.2; far = 0.14 + L + 0.12; break;
        }
        case 'rapier': cyl(0.02, 0.02, 0.2, 0, 0, { col: grip }); put(q => mm.ball(0.075, 8, 4, q), 0.11, 0, { col: acc, t0: Math.PI / 2, tl: Math.PI / 2 }); cyl(0.011, 0.006, L, 0.13 + L / 2, 0, { col: blade }); near = 0.25; far = 0.13 + L; break;
        case 'axe': cyl(0.026, 0.032, L + 0.2, L / 2 - 0.06, 0, { col: grip }); box(0.045, 0.34, 0.36, L - 0.12, 0.17, { col: blade }); box(0.05, 0.36, 0.05, L - 0.12, 0.34, { col: shade(blade, 1.2) }); near = 0.3; far = L; break;
        case 'staff': cyl(0.028, 0.028, L * 2, L * 0.3, 0, { col: Wp.col || '#8a5a2a' }); for (const t of [L * 1.3, -L * 0.7]) cyl(0.04, 0.04, 0.12, t, 0, { col: acc }); near = 0.3; far = L * 1.3; break;
        case 'spear': cyl(0.025, 0.025, L * 1.9, L * 0.45, 0, { col: grip }); put(q => mm.cone(0.07, 0.34, 4, q), L * 1.4 + 0.17, 0, { col: blade, sz: 0.3, rx: -a + Math.PI }); put(q => mm.ball(0.06, 6, 4, q), L * 1.32, 0, { col: acc }); near = 0.3; far = L * 1.4 + 0.3; break;
        case 'dagger': cyl(0.02, 0.02, 0.14, 0, 0, { col: grip }); box(0.13, 0.03, 0.035, 0.08, 0, { col: acc }); box(0.06, L, 0.018, 0.09 + L / 2, 0, { col: blade }); put(q => mm.cone(0.035, 0.1, 4, q), 0.09 + L + 0.05, 0, { col: blade, sz: 0.3, rx: -a + Math.PI }); near = 0.12; far = 0.09 + L + 0.08; break;
        case 'pan': cyl(0.025, 0.03, 0.5, 0.2, 0, { col: grip }); put(q => mm.cyl(0.25, 0.21, 0.06, hi ? 16 : 9, q), 0.45 + 0.24, 0, { col: blade, rz: Math.PI / 2 }); put(q => mm.cyl(0.21, 0.21, 0.062, hi ? 16 : 9, q), 0.45 + 0.24, 0, { col: Wp.col2 || '#5a5a5a', rz: Math.PI / 2, x: g0[0] + 0.002 }); near = 0.35; far = 0.93; break;
        case 'mace': cyl(0.026, 0.03, L, L / 2 - 0.05, 0, { col: grip }); put(q => mm.ball(0.13, 8, 6, q), L, 0, { col: blade }); for (let i = 0; i < 6; i++) { const aa = i / 6 * TAU; put(q => mm.cone(0.04, 0.12, 4, q), L, 0, { col: acc, rz: Math.cos(aa) * 1.5, rx: -a + Math.sin(aa) * 1.5 }); } near = 0.3; far = L + 0.12; break;
        case 'wrench': cyl(0.03, 0.03, 0.5, 0.2, 0, { col: blade }); box(0.05, 0.12, 0.16, 0.48, 0.03, { col: blade }); box(0.05, 0.12, 0.05, 0.53, 0.09, { col: blade }); near = 0.2; far = 0.55; break;
      }
      const n = pt(near), f = pt(far); out.push(n, f);
    }
    return out;
  }
  // pose a model's bones (face = the direction the fighter looks along the floor)
  function applyPose(m, p, face) {
    const B = m.B;
    B.pelvis.position.set(0, m.LL + p[0], p[17]); B.pelvis.rotation.set(0, 0, p[18]);
    const lean = p[1], tw = p[2], sd = p[26];
    B.spine.rotation.set(lean * 0.45, tw * 0.4, sd * 0.5); B.chest.rotation.set(lean * 0.55, tw * 0.6, sd * 0.5);
    B.neck.rotation.set(-lean * 0.25 + p[3] * 0.4, (p[25] - tw * 0.7) * 0.5, -sd * 0.4); B.head.rotation.set(-lean * 0.25 + p[3] * 0.6, (p[25] - tw * 0.7) * 0.5, -sd * 0.3);
    B.shL.rotation.set(-p[5], p[19], -p[6]); B.elL.rotation.x = -p[7]; B.hdL.rotation.x = -p[21];
    B.shR.rotation.set(-p[8], -p[20], p[9]); B.elR.rotation.x = -p[10]; B.hdR.rotation.x = -p[22];
    B.hipL.rotation.set(-p[11], -p[27], -p[12]); B.knL.rotation.x = p[13]; B.ftL.rotation.x = p[11] - p[13] + p[23];
    B.hipR.rotation.set(-p[14], p[28], p[15]); B.knR.rotation.x = p[16]; B.ftR.rotation.x = p[14] - p[16] + p[24];
    m.mesh.rotation.y = face + p[4];
  }

  // ================================================================ particles: one THREE.Points per blend mode (one draw call each)
  function particleAtlas(S) {
    const cv = document.createElement('canvas'), N = S.hi ? 128 : 64; cv.width = cv.height = N; const g = cv.getContext('2d'), c = N / 2;
    // 0: a four-point spark star, 1: a soft glow, 2: a ring, 3: a soft puff, (the 4th cell row is 2x2 so cells go 0..3)
    g.save(); g.translate(c / 2, c / 2); g.fillStyle = '#fff';
    g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? c * 0.09 : c * 0.48; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
    const gl = g.createRadialGradient(0, 0, 0, 0, 0, c * 0.2); gl.addColorStop(0, 'rgba(255,255,255,1)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(-c / 2, -c / 2, c, c); g.restore();
    g.save(); g.translate(c * 1.5, c / 2); const g2 = g.createRadialGradient(0, 0, 0, 0, 0, c * 0.48); g2.addColorStop(0, 'rgba(255,255,255,1)'); g2.addColorStop(0.35, 'rgba(255,255,255,.55)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = g2; g.fillRect(-c / 2, -c / 2, c, c); g.restore();
    g.save(); g.translate(c / 2, c * 1.5); g.strokeStyle = '#fff'; g.lineWidth = c * 0.07; g.beginPath(); g.arc(0, 0, c * 0.4, 0, TAU); g.stroke(); g.restore();
    g.save(); g.translate(c * 1.5, c * 1.5); const g3 = g.createRadialGradient(0, 0, 0, 0, 0, c * 0.46); g3.addColorStop(0, 'rgba(255,255,255,.9)'); g3.addColorStop(0.6, 'rgba(255,255,255,.5)'); g3.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = g3; g.beginPath(); g.arc(0, 0, c * 0.46, 0, TAU); g.fill(); g.restore();
    const t = S.track(new S.T.CanvasTexture(cv)); if (!S.hi) { t.magFilter = S.T.NearestFilter; t.minFilter = S.T.NearestFilter; t.generateMipmaps = false; }
    return t;
  }
  function pointsMat(S, map, add) {
    const T = S.T;
    const m = new T.ShaderMaterial({
      uniforms: { map: { value: map }, uScale: { value: S.H / 2 / Math.tan((S.fov || 50) * Math.PI / 360) } },
      vertexShader: 'attribute float size; attribute float cell; attribute vec4 rgba; varying vec4 vC; varying float vCell; uniform float uScale;\n' +
        'void main() { vC = rgba; vCell = cell; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(size * uScale / max(0.2, -mv.z), 1.0, 128.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec4 vC; varying float vCell;\n' +
        'void main() { vec2 pc = gl_PointCoord; vec2 uv = vec2((mod(vCell, 2.0) + pc.x) * 0.5, 1.0 - (floor(vCell / 2.0) + pc.y) * 0.5); vec4 t = texture2D(map, uv); float a = t.a * vC.a; if (a < 0.02) discard;' +
        (add ? ' gl_FragColor = vec4(vC.rgb * t.rgb * a, 1.0); }' : ' gl_FragColor = vec4(vC.rgb * t.rgb, a); }'),
      transparent: true, depthWrite: false, blending: add ? T.AdditiveBlending : T.NormalBlending,
    });
    if (add) { m.blending = T.CustomBlending; m.blendSrc = T.OneFactor; m.blendDst = T.OneFactor; }
    S.own.push(m); return m;
  }
  function Particles(S, map, add, max) {
    const T = S.T, pos = new Float32Array(max * 3), col = new Float32Array(max * 4), size = new Float32Array(max), cell = new Float32Array(max);
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('rgba', new T.BufferAttribute(col, 4)); geo.setAttribute('size', new T.BufferAttribute(size, 1)); geo.setAttribute('cell', new T.BufferAttribute(cell, 1));
    geo.setDrawRange(0, 0); S.S3.keep(geo);
    const pts = new T.Points(geo, pointsMat(S, map, add)); pts.frustumCulled = false; pts.renderOrder = 5;
    const P = []; const c3 = new T.Color();
    return {
      pts, P,
      spawn(o) { if (P.length >= max) P.shift(); c3.set(o.col || '#fff'); P.push({ x: o.x, y: o.y, z: o.z, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0, g: o.g == null ? 0.004 : o.g, drag: o.drag == null ? 0.96 : o.drag, life: o.life || 30, max: o.life || 30, s0: o.size || 0.2, s1: o.size1 == null ? (o.size || 0.2) * 0.3 : o.size1, r: c3.r, gg: c3.g, b: c3.b, a: o.a == null ? 1 : o.a, cell: o.cell || 0, floor: o.floor }); },
      step(slow) {
        const k = slow || 1;
        for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.life -= k; if (p.life <= 0) { P.splice(i, 1); continue; } p.x += p.vx * k; p.y += p.vy * k; p.z += p.vz * k; p.vy -= p.g * k; const d = Math.pow(p.drag, k); p.vx *= d; p.vy *= d; p.vz *= d; if (p.floor != null && p.y < p.floor) { p.y = p.floor; p.vy *= -0.3; } }
      },
      write() {
        const n = P.length;
        for (let i = 0; i < n; i++) { const p = P[i], t = p.life / p.max; pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; col[i * 4] = p.r; col[i * 4 + 1] = p.gg; col[i * 4 + 2] = p.b; col[i * 4 + 3] = p.a * Math.min(1, t * 2.2); size[i] = lerp(p.s1, p.s0, t); cell[i] = p.cell; }
        geo.attributes.position.needsUpdate = geo.attributes.rgba.needsUpdate = geo.attributes.size.needsUpdate = geo.attributes.cell.needsUpdate = true;
        geo.setDrawRange(0, n);
      },
      clear() { P.length = 0; geo.setDrawRange(0, 0); },
    };
  }
  // a ribbon trail (weapon swings, fists and feet on special moves)
  function Trail(S, n) {
    const T = S.T, N = n || 14, geo = new T.BufferGeometry(), pos = new Float32Array(N * 2 * 3), col = new Float32Array(N * 2 * 3), idx = [];
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setIndex(idx); S.S3.keep(geo);
    const m = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }); S.own.push(m);
    const me = new T.Mesh(geo, m); me.frustumCulled = false; me.renderOrder = 4; me.visible = false;
    const pts = [], c = new T.Color();
    return {
      me, pts,
      push(a, b) { pts.unshift([a.clone(), b.clone()]); if (pts.length > N) pts.pop(); },
      fade() { if (pts.length) pts.pop(); },
      clear() { pts.length = 0; me.visible = false; },
      write(colr, wide) {
        me.visible = pts.length > 1; if (!me.visible) return; c.set(colr);
        for (let i = 0; i < N; i++) { const P = pts[Math.min(i, pts.length - 1)], k = Math.max(0, 1 - i / Math.max(2, pts.length)); pos.set([P[0].x, P[0].y, P[0].z, P[1].x, P[1].y, P[1].z], i * 6); col.set([c.r * k * (wide ? 0.5 : 0.15), c.g * k * (wide ? 0.5 : 0.15), c.b * k * (wide ? 0.5 : 0.15), c.r * k, c.g * k, c.b * k], i * 6); }
        geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
      },
    };
  }

  // ================================================================ the stage builder handed to every stage's build(SB)
  function stageKit(S, root, L) {
    const T = S.T, S3 = S.S3, buckets = [], anims = [], dispose = [];
    const mk = o => {
      o = o || {};
      let m;
      if (o.add) { m = new T.MeshBasicMaterial({ map: o.map || null, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: o.side || T.FrontSide, fog: !!o.fog }); S.own.push(m); }
      else m = S.mat({ map: o.map, lit: !o.unlit, emissive: o.emissive, vcol: true, transparent: !!o.transparent, opacity: o.opacity, side: o.side, fog: o.fog });
      if (o.alphaTest) { m.alphaTest = o.alphaTest; m.transparent = false; }
      if (o.side) m.side = o.side;
      dispose.push(m); return m;
    };
    const SB = {
      T, S3, S, look: S.look, hi: S.hi, PT, prng, shade, mixC, rgba, numC, root, L,
      tex(w, h, paint, o) { o = o || {}; const k = S.hi && !o.lo ? 2 : 1, t = S3.tex(w * k, h * k, (g) => { if (k > 1) g.scale(k, k); paint(g, w, h); }); if (o.rep) t.repeat.set(o.rep[0], o.rep[1]); if (o.clamp) { t.wrapS = t.wrapT = T.ClampToEdgeWrapping; } dispose.push(t); return t; },
      bucket(o) { const m = Mesher(T); buckets.push({ m, o: o || {} }); return m; },
      mesh(geo, o) { const me = new T.Mesh(geo, mk(o)); S3.keep(geo); dispose.push(geo); root.add(me); return me; },
      sky(stops, o) { // a gradient dome (vertex colours: smooth on the Dreamcast, banded and dithered on the PlayStation)
        o = o || {}; const g = new T.SphereGeometry(o.r || 160, 16, 12), pa = g.attributes.position, cs = [];
        const cols = stops.map(([k, c]) => [k, new T.Color(c)]);
        for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) / (o.r || 160); const k = clamp(1 - (y + (o.lift || 0.1)) / 1.1, 0, 1); let j = 0; while (j < cols.length - 2 && cols[j + 1][0] < k) j++; const [k0, c0] = cols[j], [k1, c1] = cols[Math.min(j + 1, cols.length - 1)]; const t = k1 > k0 ? clamp((k - k0) / (k1 - k0), 0, 1) : 0; cs.push(lerp(c0.r, c1.r, t), lerp(c0.g, c1.g, t), lerp(c0.b, c1.b, t)); }
        g.setAttribute('color', new T.Float32BufferAttribute(cs, 3));
        const m = S.mat({ lit: false, vcol: true, fog: false, side: T.BackSide }); dispose.push(m, g); S3.keep(g);
        const me = new T.Mesh(g, m); me.renderOrder = -10; root.add(me);
        S3.scene.background = new T.Color(stops[stops.length - 1][1]);
        return me;
      },
      band(paint, o) { // a painted skyline round the horizon (transparent above the silhouette)
        o = o || {}; const pw = o.pw || 512, ph = o.ph || 128;
        const t = SB.tex(pw, ph, paint, { lo: o.lo }); t.repeat.set(o.rep || 2, 1); t.wrapT = T.ClampToEdgeWrapping;
        const g = new T.CylinderGeometry(o.r || 90, o.r || 90, o.h || 24, 32, 1, true); S3.keep(g); dispose.push(g);
        const m = S.mat({ map: t, lit: false, fog: !!o.fog, side: T.BackSide, transparent: false }); m.alphaTest = 0.5; dispose.push(m);
        const me = new T.Mesh(g, m); me.position.y = (o.y == null ? 6 : o.y); me.rotation.y = o.ry || 0; me.renderOrder = -9; root.add(me);
        return me;
      },
      disc(col, r, pos, o) { o = o || {}; const g = new T.CircleGeometry(r, 20); S3.keep(g); dispose.push(g); const m = S.mat({ color: numC(col), lit: false, fog: false, transparent: !!o.glow, opacity: o.opacity }); dispose.push(m); const me = new T.Mesh(g, m); me.position.set(pos[0], pos[1], pos[2]); me.lookAt(0, pos[1] * 0.5, 0); me.renderOrder = -8; root.add(me); if (o.glow) { const g2 = new T.CircleGeometry(r * 2.4, 20); S3.keep(g2); dispose.push(g2); const m2 = S.mat({ color: numC(col), lit: false, fog: false, transparent: true, opacity: 0.25 }); dispose.push(m2); const gl = new T.Mesh(g2, m2); gl.position.copy(me.position); gl.quaternion.copy(me.quaternion); gl.position.multiplyScalar(1.01); gl.renderOrder = -9; root.add(gl); } return me; },
      stars(n, o) { o = o || {}; const r = prng(o.seed || 5), p = []; for (let i = 0; i < n; i++) { const a = r() * TAU, e = 0.08 + r() * 1.3, R0 = 150; p.push(Math.cos(a) * Math.cos(e) * R0, Math.sin(e) * R0, Math.sin(a) * Math.cos(e) * R0); } const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); S3.keep(g); dispose.push(g); const m = new T.PointsMaterial({ color: o.col || 0xffffff, size: o.size || (S.hi ? 2 : 1.5), sizeAttenuation: false, fog: false }); S.own.push(m); dispose.push(m); const me = new T.Points(g, m); me.renderOrder = -9; root.add(me); return me; },
      // 3D crowds: instanced little people. spots: [[x, y, z, faceAngle], ...]
      crowd(spots, o) {
        o = o || {}; const n = spots.length; if (!n) return null;
        const bm = Mesher(T), hm = Mesher(T), sc = o.scale || 1;
        bm.cyl(0.17, 0.2, 0.62, 6, { y: 0.31 }); bm.cyl(0.13, 0.13, 0.5, 5, { y: 0.0, x: 0, z: 0.02, sy: 0.6 });
        for (const s of [-1, 1]) bm.cyl(0.05, 0.05, 0.45, 4, { x: s * 0.24, y: 0.75, rz: s * -0.45 });
        hm.ball(0.13, 7, 5, { y: 0.78 }); hm.ball(0.135, 7, 3, { y: 0.82, t0: 0, tl: 1.3, col: '#666' });
        const bg = S3.keep(bm.build()), hg = S3.keep(hm.build()); dispose.push(bg, hg);
        const mb = S.mat({ vcol: true }), mh = S.mat({ vcol: true }); dispose.push(mb, mh);
        const IB = new T.InstancedMesh(bg, mb, n), IH = new T.InstancedMesh(hg, mh, n);
        const r = prng(o.seed || 9), cols = (o.cols || ['#c02a2a', '#2a5ad0', '#e0c020', '#2a9a4a', '#f0f0f0', '#7a2ab0', '#f07a1a', '#1a1a1a']).map(c => new T.Color(c)), skins = (o.skins || ['#f0c8a0', '#d8a070', '#a86a3a', '#6a4020', '#f4d0b0']).map(c => new T.Color(c));
        const cr = spots.map(([x, y, z, a]) => ({ x, y, z, a: a == null ? Math.atan2(-x, -z) : a, ph: r() * TAU, sp: 0.06 + r() * 0.06, s: sc * (0.85 + r() * 0.3) }));
        cr.forEach((c, i) => { IB.setColorAt(i, cols[r() * cols.length | 0]); IH.setColorAt(i, skins[r() * skins.length | 0]); });
        const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), v = new T.Vector3(), s3 = new T.Vector3();
        const upd = (t, hype) => { for (let i = 0; i < n; i++) { const c = cr[i], j = Math.max(0, Math.sin(t * c.sp * (1 + hype) + c.ph)) * (0.05 + hype * 0.22); e.set(0, c.a, Math.sin(t * 0.05 + c.ph) * 0.06 * (1 + hype)); q.setFromEuler(e); v.set(c.x, c.y + j, c.z); s3.set(c.s, c.s * (1 + j * 0.3), c.s); m4.compose(v, q, s3); IB.setMatrixAt(i, m4); IH.setMatrixAt(i, m4); } IB.instanceMatrix.needsUpdate = IH.instanceMatrix.needsUpdate = true; };
        upd(0, 0); IB.frustumCulled = IH.frustumCulled = false;
        root.add(IB); root.add(IH);
        anims.push((t, G) => { if (t % 2 === 0) upd(t, G ? G.hype : 0); });
        return IB;
      },
      // drifting ambient particles in a box: kind 'snow' | 'petal' | 'ember' | 'rain' | 'leaf' | 'dust' | 'spray' | 'bubble'
      drift(o) {
        const n = o.n || 60, b = o.box || [-14, 14, 0, 12, -14, 6], r = prng(o.seed || 21), add = !!o.add;
        const sys = Particles(S, S.patlas, add, n); root.add(sys.pts); dispose.push(sys.pts.geometry, sys.pts.material);
        const c3 = new T.Color();
        for (let i = 0; i < n; i++) { const cl = o.cols ? o.cols[i % o.cols.length] : o.col || '#fff'; c3.set(cl); sys.P.push({ x: lerp(b[0], b[1], r()), y: lerp(b[2], b[3], r()), z: lerp(b[4], b[5], r()), vx: 0, vy: 0, vz: 0, g: 0, drag: 1, life: 1e9, max: 1e9, s0: (o.size || 0.12) * (0.6 + r() * 0.8), s1: 0, r: c3.r, gg: c3.g, b: c3.b, a: o.a || 0.9, cell: o.cell == null ? 3 : o.cell, ph: r() * TAU }); }
        anims.push(t => {
          for (const p of sys.P) {
            p.y += o.vy || -0.02; p.x += (o.vx || 0) + Math.sin(t * 0.02 + p.ph) * (o.sway || 0.01); p.z += o.vz || 0;
            if (p.y < b[2]) { p.y = b[3]; p.x = lerp(b[0], b[1], (p.ph * 7.3) % 1); } if (p.y > b[3]) p.y = b[2];
            if (p.x < b[0]) p.x = b[1]; if (p.x > b[1]) p.x = b[0];
            if (o.flick) p.a = 0.5 + Math.abs(Math.sin(t * 0.1 + p.ph)) * 0.5;
          }
          sys.write();
          const sz = sys.pts.geometry.attributes.size; for (let i = 0; i < sys.P.length; i++) sz.array[i] = sys.P[i].s0; sz.needsUpdate = true;
        });
        return sys;
      },
      on(fn) { anims.push(fn); },
      light(o) { L.set(o); },
      fog(col, near, far) { S3.scene.fog = new T.Fog(col, near, far); },
      // finish: every bucket becomes one mesh
      _finish() { for (const b of buckets) { if (!b.m.count) continue; const geo = S3.keep(b.m.build()); dispose.push(geo); const me = new T.Mesh(geo, mk(b.o)); if (b.o.order != null) me.renderOrder = b.o.order; root.add(me); if (b.o.ref) b.o.ref(me); } },
      _anims: anims, _dispose: dispose,
    };
    return SB;
  }

  // ================================================================ throws: each kind is a little two-person animation
  //  A: the thrower's key poses [frame, pose]; at(t) -> where the victim is (d forward of the thrower, s to the side, y up,
  //  tilt, turn (extra spin), pose); hits: frames that do damage (shares of the total); end: what happens to the victim
  const PA = (o) => PP(o);
  const THROWS = {
    hip: { len: 52, hits: [[36, 1]], A: [[0, POSE.grab], [10, POSE.grab], [26, PA({ y: -0.2, lean: 0.5, twist: -1.2, sl: [1.2, 0.3], el: 0.8, sr: [1.6, -0.2], er: 0.6, hl: [0.6, 0.2], kl: 1.0, hr: [-0.3, 0.2], kr: 0.6 })], [38, POSE.slam], [52, POSE.slam]],
      at: t => t < 12 ? { d: 0.75, y: 0, tilt: 0, pose: POSE.hit } : t < 36 ? { d: lerp(0.75, 0.5, (t - 12) / 24), s: Math.sin((t - 12) / 24 * Math.PI) * -0.3, y: Math.sin((t - 12) / 24 * Math.PI) * 1.0, tilt: -((t - 12) / 24) * 2.2, pose: POSE.air } : { d: 1.0, y: 0, tilt: -1.55, pose: POSE.down }, end: { st: 'down', d: 1.0 } },
    slam: { len: 60, hits: [[40, 1]], A: [[0, POSE.grab], [12, POSE.grab], [26, POSE.lift], [34, POSE.lift], [42, POSE.slam], [60, POSE.slam]],
      at: t => t < 12 ? { d: 0.75, pose: POSE.hit } : t < 34 ? { d: lerp(0.75, 0.1, (t - 12) / 22), y: lerp(0, 1.9, sm((t - 12) / 22)), tilt: -lerp(0, 1.55, (t - 12) / 22), pose: POSE.air } : t < 40 ? { d: lerp(0.1, 0.9, (t - 34) / 6), y: lerp(1.9, 0, (t - 34) / 6), tilt: -1.55, pose: POSE.air } : { d: 0.95, tilt: -1.55, pose: POSE.down }, end: { st: 'down', d: 0.95 } },
    suplex: { len: 64, hits: [[38, 1]], A: [[0, POSE.grab], [12, POSE.grab], [22, PA({ y: -0.25, lean: 0.4, sl: [1.6, 0.2], el: 1.2, sr: [1.6, 0.2], er: 1.2, hl: [0.6, 0.2], kl: 1.2, hr: [0.5, 0.2], kr: 1.1 })], [38, POSE.bridge], [52, POSE.bridge], [64, POSE.crouch]],
      at: t => t < 14 ? { d: 0.6, pose: POSE.hitmid } : t < 38 ? { d: lerp(0.6, -0.8, sm((t - 14) / 24)), y: Math.sin((t - 14) / 24 * Math.PI) * 1.6, tilt: -lerp(0, 3.0, (t - 14) / 24), pose: POSE.air } : { d: -0.95, tilt: -1.55, turn: Math.PI, pose: POSE.down }, end: { st: 'down', d: -0.95, flip: true } },
    toss: { len: 40, hits: [[22, 1]], A: [[0, POSE.grab], [12, POSE.grab], [18, PA({ y: -0.04, lean: -0.3, sl: [1.0, 0.4], el: 1.6, sr: [0.9, 0.3], er: 1.4, hl: [0.1, 0.05], kl: 0.2, hr: [1.55, 0.05], kr: 0.05 })], [26, PA({ y: -0.04, lean: -0.35, sl: [1.0, 0.4], el: 1.6, sr: [0.9, 0.3], er: 1.4, hl: [0.1, 0.05], kl: 0.2, hr: [1.6, 0.05], kr: 0 })], [40, POSE.stance]],
      at: t => t < 22 ? { d: 0.75, y: 0, pose: POSE.hitmid } : { d: 0.9, y: 0.1, pose: POSE.air }, end: { st: 'air', d: 0.9, vx: 0.16, vy: 0.11 } },
    spin: { len: 70, hits: [[56, 1]], A: [[0, POSE.grab], [12, POSE.grab], [56, PA({ y: -0.2, lean: -0.2, sl: [1.6, 0.4], el: 0.4, sr: [1.6, 0.4], er: 0.4, hl: [0.5, 0.3], kl: 0.6, hr: [-0.3, 0.3], kr: 0.5 })], [70, POSE.stance]],
      spin: t => t < 12 ? 0 : t < 56 ? Math.pow((t - 12) / 44, 1.6) * TAU * 2 : TAU * 2,
      at: t => t < 12 ? { d: 0.75, pose: POSE.hit } : { d: 1.05, y: t < 56 ? 0.35 + Math.sin(t * 0.3) * 0.1 : 0.4, tilt: -0.9, pose: POSE.air }, end: { st: 'air', d: 1.1, vx: 0.18, vy: 0.08 } },
    knee: { len: 50, hits: [[14, 0.3], [24, 0.3], [34, 0.4]], A: [[0, POSE.grab], [8, POSE.grab], [14, PA({ y: -0.05, lean: 0.3, sl: [1.6, 0.0], el: 1.6, sr: [1.6, 0.0], er: 1.6, hl: [0.2, 0.1], kl: 0.3, hr: [1.6, 0.05], kr: 2.4 })], [19, POSE.grab], [24, PA({ y: -0.05, lean: 0.3, sl: [1.6, 0.0], el: 1.6, sr: [1.6, 0.0], er: 1.6, hl: [0.2, 0.1], kl: 0.3, hr: [1.6, 0.05], kr: 2.4 })], [29, POSE.grab], [34, PA({ y: -0.05, lean: 0.3, sl: [1.6, 0.0], el: 1.6, sr: [1.6, 0.0], er: 1.6, hl: [0.2, 0.1], kl: 0.3, hr: [1.8, 0.05], kr: 2.4 })], [50, POSE.stance]],
      at: t => ({ d: 0.68, y: 0, pose: t >= 14 && t < 40 ? POSE.hitmid : POSE.hit }), end: { st: 'crumple', d: 0.8 } },
    head: { len: 46, hits: [[18, 0.45], [32, 0.55]], A: [[0, POSE.grab], [10, POSE.grab], [14, PA({ y: -0.1, lean: -0.4, hp: -0.4, sl: [1.6, 0.0], el: 0.6, sr: [1.6, 0.0], er: 0.6 })], [18, PA({ y: -0.12, lean: 0.55, hp: 0.5, sl: [1.6, 0.0], el: 0.6, sr: [1.6, 0.0], er: 0.6 })], [26, PA({ y: -0.1, lean: -0.45, hp: -0.4, sl: [1.6, 0.0], el: 0.6, sr: [1.6, 0.0], er: 0.6 })], [32, PA({ y: -0.12, lean: 0.6, hp: 0.6, sl: [1.6, 0.0], el: 0.6, sr: [1.6, 0.0], er: 0.6 })], [46, POSE.stance]],
      at: t => ({ d: 0.62, pose: POSE.hit }), end: { st: 'crumple', d: 0.75 } },
    zap: { len: 60, hits: [[20, 0.2], [30, 0.2], [40, 0.2], [50, 0.4]], A: [[0, POSE.grab], [60, POSE.grab]], fx: 'zap',
      at: t => ({ d: 0.72, y: 0.05 + (t > 12 ? Math.random() * 0.06 : 0), tilt: t > 12 ? (Math.random() - 0.5) * 0.15 : 0, pose: t > 12 ? (t % 6 < 3 ? POSE.air : POSE.hit) : POSE.hit }), end: { st: 'down', d: 0.85 } },
    flip: { len: 56, hits: [[34, 1]], A: [[0, POSE.grab], [10, POSE.grab], [24, PA({ y: -0.7, lean: -1.0, sl: [2.4, 0.2], el: 0.6, sr: [2.4, 0.2], er: 0.6, hl: [1.9, 0.1], kl: 0.4, hr: [1.2, 0.1], kr: 1.6 })], [38, PA({ y: -0.75, lean: -1.2, sl: [2.6, 0.2], el: 0.4, sr: [2.6, 0.2], er: 0.4, hl: [2.4, 0.1], kl: 0.1, hr: [1.5, 0.1], kr: 1.2 })], [56, POSE.crouch]],
      at: t => t < 12 ? { d: 0.7, pose: POSE.hit } : t < 34 ? { d: lerp(0.7, -1.4, sm((t - 12) / 22)), y: Math.sin((t - 12) / 22 * Math.PI) * 1.4, tilt: -lerp(0, 3.4, (t - 12) / 22), pose: POSE.air } : { d: -1.5, tilt: -1.55, turn: Math.PI, pose: POSE.down }, end: { st: 'down', d: -1.5, flip: true } },
    magic: { len: 70, hits: [[56, 1]], A: [[0, POSE.grab], [10, PA({ y: -0.04, lean: -0.1, sl: [2.6, 0.5], el: 0.4, sr: [2.6, 0.5], er: 0.4 })], [40, POSE.taunt], [70, POSE.taunt]], fx: 'poof',
      at: t => t < 14 ? { d: 0.75, pose: POSE.hit } : t < 40 ? { d: 0.9, hide: true, pose: POSE.air } : { d: 0.95, y: Math.max(0, lerp(6, 0, (t - 40) / 16)), tilt: t < 56 ? -0.3 : -1.55, pose: t < 56 ? POSE.air : POSE.down }, end: { st: 'down', d: 0.95 } },
    pancake: { len: 64, hits: [[46, 1]], A: [[0, POSE.grab], [12, POSE.grab], [20, POSE.slam], [30, POSE.jump], [44, PA({ y: -0.6, lean: 1.2, sl: [2.0, 0.6], el: 0.2, sr: [2.0, 0.6], er: 0.2, hl: [1.2, 0.4], kl: 0.6, hr: [1.2, 0.4], kr: 0.6 })], [64, POSE.crouch]], hop: t => t > 24 && t < 46 ? Math.sin((t - 24) / 22 * Math.PI) * 1.2 : 0, fwd: t => t > 24 ? Math.min(1, (t - 24) / 20) * 0.9 : 0,
      at: t => t < 20 ? { d: 0.75, pose: POSE.hit } : { d: 1.0, tilt: -lerp(0, 1.55, Math.min(1, (t - 20) / 8)), pose: POSE.down }, end: { st: 'down', d: 1.0 } },
    slash: { len: 44, hits: [[18, 0.5], [30, 0.5]], A: [[0, POSE.grab], [10, POSE.grab], [16, PA({ y: -0.1, twist: 1.2, sl: [0.6, 0.4], el: 1.2, sr: [1.5, 0.9], er: 0.4 })], [20, PA({ y: -0.12, twist: -1.1, sl: [0.6, 0.5], el: 1.2, sr: [1.5, 0.1], er: 0.1 })], [28, PA({ y: -0.05, lean: -0.3, sl: [0.8, 0.4], el: 1.4, sr: [0.9, 0.3], er: 0.7, hl: [0.2, 0.05], kl: 0.3, hr: [1.5, 0.05], kr: 0.05 })], [44, POSE.bstance]],
      at: t => t < 30 ? { d: 0.75, pose: t > 18 ? POSE.hitmid : POSE.hit } : { d: 0.9, y: 0.1, pose: POSE.air }, end: { st: 'air', d: 0.95, vx: 0.15, vy: 0.1 } },
  };
  function evalKeys(keys, t, out) {
    if (t <= keys[0][0]) { out.set(keys[0][1]); return out; }
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i]; return mixP(a, b, sm((t - t0) / Math.max(1, t1 - t0)), out); }
    out.set(keys[keys.length - 1][1]); return out;
  }

  // ================================================================ the engine
  function make(K, CFG) {
    const DUEL = !!CFG.duel, look = CFG.look === 'dc' ? 'dc' : 'ps1', hi = look === 'dc';
    const S3 = K.three({ fov: CFG.fov || 42, near: 0.1, far: 600, fogCol: 0x000000, fogNear: 80, fogFar: 400 });
    const T = S3.T, W = K.W, H = K.H, g = K.hud, fk = W / 320;
    const S = { T, S3, look, hi, W, H, fov: CFG.fov || 42, own: [], texs: [] };
    S.track = t => { S.texs.push(t); return t; };
    const ditherize = m => { const ob = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { if (ob) ob(sh, r); sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>' + DITHER); }; m.customProgramCacheKey = () => 'rmps1d'; return m; };
    S.mat = o => { const m = S3.mat(o); return look === 'ps1' ? ditherize(m) : m; };
    S.fmat = tex => {
      let m;
      if (hi) { m = new T.MeshPhongMaterial({ map: tex, vertexColors: true, shininess: 26, specular: 0x2c2c2c }); S.own.push(m); }
      else m = S.mat({ map: tex, vcol: true });
      m.skinning = true; return m;
    };
    S.patlas = particleAtlas(S);
    S3.ren.autoClearStencil = true;
    // ---- lights: sky/ground fill, a sun and a rim light from behind (it makes the fighters pop off the background)
    const LT = S3.lights({ amb: 0.85, sun: 0.8, dir: [0.4, 1, 0.6] });
    const rim = new T.DirectionalLight(0xffffff, 0.3); rim.position.set(-0.4, 0.6, -1); S3.scene.add(rim);
    const shU = { floor: { value: 0 }, L: { value: new T.Vector2(0.35, 0.25) } };
    const Lset = o => {
      o = o || {};
      LT.hemi.color.set(o.sky || 0xffffff); LT.hemi.groundColor.set(o.ground || 0x404048); LT.hemi.intensity = o.amb == null ? 0.85 : o.amb;
      LT.sun.color.set(o.sunCol || 0xffffff); LT.sun.intensity = o.sun == null ? 0.8 : o.sun; const d = o.dir || [0.4, 1, 0.6]; LT.sun.position.set(d[0], d[1], d[2]);
      rim.color.set(o.rimCol || 0xffffff); rim.intensity = o.rim == null ? 0.3 : o.rim;
      shU.L.value.set(-d[0] / Math.max(0.3, d[1]) * 0.6, -d[2] / Math.max(0.3, d[1]) * 0.6);
    };
    Lset({});
    // ---- effects
    const FXA = Particles(S, S.patlas, true, 300), FXN = Particles(S, S.patlas, false, 200); S3.add(FXA.pts); S3.add(FXN.pts);
    const blobGeo = S3.keep(new T.CircleGeometry(0.5, 16)), blobMat = S.mat({ color: 0x000000, lit: false, transparent: true, opacity: 0.42 }); blobMat.depthWrite = false;
    let shadowMat = null;
    if (hi) {
      shadowMat = new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false });
      shadowMat.skinning = true; shadowMat.side = T.DoubleSide; shadowMat.stencilWrite = true; shadowMat.stencilRef = 1; shadowMat.stencilFunc = T.NotEqualStencilFunc; shadowMat.stencilZPass = T.ReplaceStencilOp;
      shadowMat.polygonOffset = true; shadowMat.polygonOffsetFactor = -2; shadowMat.polygonOffsetUnits = -4;
      shadowMat.onBeforeCompile = sh => { sh.uniforms.uFloor = shU.floor; sh.uniforms.uL = shU.L; sh.vertexShader = 'uniform float uFloor;\nuniform vec2 uL;\n' + sh.vertexShader.replace('#include <project_vertex>', 'vec4 wp = modelMatrix * vec4(transformed, 1.0); float hh = max(wp.y - uFloor, 0.0); wp.xz += uL * hh; wp.y = uFloor + 0.012; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;'); };
      shadowMat.customProgramCacheKey = () => 'rmshadow';
      S.own.push(shadowMat);
    }

    // ================================================================ the save (rm.<gid>; def.v stays 1, fields only ever added)
    const DEF = { opt: { diff: 1, rounds: 2, time: 60, music: 1, shake: 1 }, unl: {}, cos: {}, st: {}, end: {}, hi: null, ta: 0, sv: 0, n: 0, wins: 0, last: 0 };
    const SV = (() => { let s = null; try { s = K.load(); } catch (e) {} s = (s && typeof s === 'object') ? s : {}; const o = Object.assign({}, DEF, s); o.opt = Object.assign({}, DEF.opt, s.opt || {}); for (const k of ['unl', 'cos', 'st', 'end']) o[k] = (s[k] && typeof s[k] === 'object') ? s[k] : {}; if (!Array.isArray(o.hi)) o.hi = null; return o; })();
    let G = null;
    const save = quiet => { try { K.save(SV); } catch (e) {} if (!quiet && G) G.saving = 80; };
    // the cartridge's own high-score table (Jack's mates got there first)
    if (!SV.hi) {
      const cn = (id, d) => { try { return (window.Cast && Cast.n) ? Cast.n(id) : d; } catch (e) { return d; } };
      const top = CFG.hiTop || 24000, ids = CFG.roster.map(f => f.id);
      SV.hi = [['DAVE', 1], ['LUKE', 0.78], [cn('cousin', 'KIM').toUpperCase().slice(0, 8), 0.62], ['CALLUM', 0.5], ['JACKK', 0.4], [cn('kidPoke', 'SAM').toUpperCase().slice(0, 8), 0.3], ['MOM', 0.12], [cn('sister', 'MEG').toUpperCase().slice(0, 8), 0.07]]
        .map(([n, k], i) => ({ n, s: Math.round(top * k / 10) * 10, c: ids[(i * 3) % ids.length] }));
    }
    const opt = SV.opt;

    // ================================================================ the roster and what's unlocked
    const ROST = CFG.roster.concat(CFG.hidden || []).concat(CFG.boss ? [CFG.boss] : []);
    const byId = {}; ROST.forEach(f => { byId[f.id] = f; });
    const unlocked = f => !f.lock || !!SV.unl[f.id];
    const selList = () => ROST.filter(f => !f.noPick || SV.unl[f.id]);
    const ncos = f => 1 + (f.cos ? f.cos.length : 0);
    const cosOK = (f, i) => i === 0 || !!(SV.cos[f.id] && SV.cos[f.id] >= i) || (f.cos[i - 1] && f.cos[i - 1].free);
    const STAGES = CFG.stages;
    const stageOK = i => !STAGES[i].lock || !!SV.st[STAGES[i].id];

    // ================================================================ stages
    const stageRoot = S3.group();
    let stage = null, stageIdx = -1, SBk = null;
    function clearStage() {
      if (SBk) { for (const d of SBk._dispose) { try { if (d.isObject3D) continue; d.dispose(); } catch (e) {} } }
      while (stageRoot.children.length) stageRoot.remove(stageRoot.children[0]);
      SBk = null; stage = null; stageIdx = -1;
    }
    function setStage(i, special) {
      const key = special || i; if (stage && stage.key === key) return;
      clearStage();
      S3.scene.fog = new T.Fog(0x000000, 60, 300); S3.scene.background = new T.Color(0x000000); Lset({});
      SBk = stageKit(S, stageRoot, { set: Lset });
      const def = special === 'show' ? { build: showroom } : special === 'train' ? (CFG.trainStage || { build: trainRoom }) : STAGES[i];
      let info = {}; try { info = def.build(SBk) || {}; } catch (e) { console.error(e); }
      SBk._finish();
      stage = Object.assign({ wall: 8.5, floorY: 0 }, info, { def, key, anims: SBk._anims });
      stageIdx = typeof key === 'number' ? key : -1;
      shU.floor.value = stage.floorY || 0;
    }
    // the select screen's showroom: a dark floor with a pool of light
    function showroom(SB) {
      const c = CFG.show || {};
      SB.sky([[0, c.top || '#05060c'], [0.55, c.mid || '#141a3a'], [1, c.bot || '#2a1030']], { lift: 0.2 });
      SB.fog(numC(c.fog || '#0a0a18'), 12, 40);
      const fl = SB.tex(64, 64, (g2, w, h) => { const gr = g2.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, c.pool || '#5a6aa0'); gr.addColorStop(0.6, shade(c.pool || '#5a6aa0', 0.35)); gr.addColorStop(1, '#05060c'); g2.fillStyle = gr; g2.fillRect(0, 0, w, h); g2.strokeStyle = 'rgba(255,255,255,.18)'; g2.lineWidth = 1; g2.beginPath(); g2.arc(w / 2, h / 2, w * 0.3, 0, TAU); g2.stroke(); }, { clamp: true });
      SB.bucket({ map: fl, unlit: true }).plane(7, 7, { rx: -Math.PI / 2 });
      const glow = SB.tex(32, 64, (g2, w, h) => PT.vgrad(g2, 0, 0, w, h, [[0, 'rgba(255,255,255,0)'], [1, c.beam || 'rgba(160,190,255,.35)']]), { clamp: true });
      SB.bucket({ map: glow, add: true, side: T.DoubleSide }).cyl(0.4, 2.2, 8, 16, { y: 4, open: true });
      SB.drift({ n: 40, box: [-4, 4, 0, 6, -4, 2], vy: 0.004, sway: 0.004, col: c.dust || '#9ab0ff', size: 0.05, add: true, cell: 1 });
      SB.light({ amb: 0.75, sun: 0.9, dir: [0.5, 0.8, 1], sky: 0xc8d0ff, ground: 0x302838, rim: 0.7, rimCol: numC(c.rim || '#7a9aff') });
      return { wall: 3 };
    }
    // the training room: a grid in the dark
    function trainRoom(SB) {
      SB.sky([[0, '#0a0f1e'], [0.6, '#16284a'], [1, '#1a3a5a']]); SB.fog(0x10203a, 18, 60);
      const t = SB.tex(64, 64, (g2, w, h) => { g2.fillStyle = '#20304a'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#4a8ad0'; g2.fillRect(0, 0, w, 1); g2.fillRect(0, 0, 1, h); g2.fillStyle = 'rgba(74,138,208,.35)'; g2.fillRect(0, h / 2, w, 1); g2.fillRect(w / 2, 0, 1, h); });
      SB.bucket({ map: t }).plane(80, 80, { rx: -Math.PI / 2, rep: [40, 40] });
      const wb = SB.bucket({ unlit: true });
      for (let i = -6; i <= 6; i++) { wb.box(0.06, 12, 0.06, { x: i * 4, y: 6, z: -24, col: '#2a5a9a' }); wb.box(48, 0.06, 0.06, { x: 0, y: i + 6, z: -24, col: '#1a3a6a' }); }
      SB.light({ amb: 0.9, sun: 0.7, sky: 0xc0d8ff, ground: 0x202838 });
      return { wall: 12 };
    }

    // ================================================================ fighters
    const models = {};
    function getModel(cfg, cos, slot) {
      const k = cfg.id + '/' + (cos || 0) + '/' + (slot || ''); if (models[k]) return models[k];
      const m = models[k] = buildModel(S, cfg, cos);
      m.mesh.scale.x = -1; // (an orthodox stance: lead with the left, chest open to the camera on the left-hand side)
      if (hi) { m.shadow = new T.SkinnedMesh(m.mesh.geometry, shadowMat); m.shadow.bind(m.skel); m.shadow.frustumCulled = false; m.shadow.renderOrder = 2; }
      else { m.shadow = new T.Mesh(blobGeo, blobMat); m.shadow.rotation.x = -Math.PI / 2; m.shadow.renderOrder = 2; }
      return m;
    }
    function fighter(cfg, slot, cpu, lvl, cos) {
      const m = getModel(cfg, cos, slot);
      S3.add(m.mesh); S3.add(m.shadow);
      const st = cfg.stance ? PP(cfg.stance, DUEL ? POSE.bstance : POSE.stance) : (DUEL ? POSE.bstance : POSE.stance);
      const f = { cfg, m, slot, cpu, lvl: lvl || 0, cos: cos || 0, x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, face: 0, hp: 100, max: 100, st: 'idle', t: 0, mv: null, hitDone: false, hitN: 0, queued: null,
        stun: 0, guard: null, crouch: false, pose: new Float32Array(st), tmp: new Float32Array(NK), tgt: new Float32Array(NK), stance: st, wins: 0, comboN: 0, comboDmg: 0, comboT: 0, buf: [], tilt: 0,
        ai: { t: 0, plan: 'wait' }, trail: Trail(S, hi ? 16 : 10), dtap: 0, utap: 0, lastF: -99, lastB: -99, lastFP: -99, lastBP: -99, atkId: 0, moves: null, keys: {}, hide: false, dmgLag: 100, spark: 0 };
      S3.add(f.trail.me);
      f.moves = buildMoves(cfg);
      f.speed = (DUEL ? 0.05 : 0.036) * (cfg.spd || 1);
      return f;
    }
    function removeFighter(f) { if (!f) return; S3.scene.remove(f.m.mesh); S3.scene.remove(f.m.shadow); S3.scene.remove(f.trail.me); }
    // ---- moves: the shared ones from the game file, the fighter's own (by id or input), specials, jump attacks
    function normMove(o, cfg) {
      const m = Object.assign({ kind: DUEL ? 'w' : 'p', ht: 'h', su: 10, ac: 3, re: 14, dmg: 8, rng: 1.3, push: 0.02 }, o);
      m.hs = m.hs || Math.round(12 + m.dmg * 0.55); m.bs = m.bs || Math.round(7 + m.dmg * 0.3);
      m.cw = m.cw || [m.su, m.su + m.ac + Math.min(18, m.re)];
      m.total = m.su + m.ac + m.re;
      if (!m.trail) m.trail = DUEL && m.kind === 'w' ? 'wpn' : null;
      return m;
    }
    function buildMoves(cfg) {
      const list = [], ids = {};
      const add = (o, tag) => { const m = normMove(o, cfg); m.tag = tag; const prev = ids[m.id]; if (prev) list.splice(list.indexOf(prev), 1); ids[m.id] = m; list.push(m); };
      for (const o of (CFG.base || [])) add(o, 'base');
      for (const o of (cfg.moves || [])) { if (!o.id) o.id = (o.btn + (o.dir || '')) + '_' + cfg.id; const same = list.find(x => x.btn === o.btn && (x.dir || '') === (o.dir || '') && !x.chainOnly && !o.chainOnly && !o.id.startsWith(x.id)); if (same && !ids[o.id]) { list.splice(list.indexOf(same), 1); delete ids[same.id]; } add(o, 'own'); }
      for (const o of (cfg.specials || [])) { if (!o.id) o.id = 'sp_' + (o.btn + (o.dir || '')); add(Object.assign({ sp: true }, o), 'sp'); }
      for (const o of (CFG.jumps || [])) add(Object.assign({ air: true }, o), 'air');
      const thr = (cfg.throws || CFG.throws || []).map((t, i) => normMove(Object.assign({ id: 'throw' + i, n: t.n, kind: 't', su: 6, ac: 3, re: 24, rng: DUEL ? 1.35 : 1.2, dmg: t.dmg || 20, thr: t, btns: (CFG.throwBtns || [['a', 'b'], ['x', 'y']])[i] || ['a', 'b'] }), cfg));
      return { list, ids, thr };
    }
    // which move does a button (and a direction) give right now?
    function moveFor(f, btn, dir, ctx) {
      const L = f.moves.list;
      if (ctx === 'air') return L.find(m => m.air && m.btn === btn) || L.find(m => m.air);
      const ok = m => !m.air && !m.chainOnly && m.btn === btn;
      return L.find(m => ok(m) && m.sp && m.dir === dir) || L.find(m => ok(m) && m.tag === 'own' && (m.dir || null) === dir) || L.find(m => ok(m) && (m.dir || null) === dir) ||
        (dir === 'd' ? L.find(m => ok(m) && m.dir === 'd') : L.find(m => ok(m) && !m.dir));
    }
    const isFree = st => st === 'idle' || st === 'walk' || st === 'back' || st === 'guard' || st === 'crouch' || st === 'run';
    const fwdVec = f => [Math.sin(f.face), Math.cos(f.face)];
    const dist = (a, b) => Math.hypot(b.x - a.x, b.z - a.z);
    function camRight() { const dx = G.cam.lx - G.cam.x, dz = G.cam.lz - G.cam.z, l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; }
    function camAway() { const dx = G.cam.lx - G.cam.x, dz = G.cam.lz - G.cam.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; }
    function onLeft(f, o) { const cr = camRight(); return (f.x - o.x) * cr[0] + (f.z - o.z) * cr[1] < 0; }

    // ================================================================ game state
    G = { scr: 'boot', t: 0, frame: 0, o: {}, mode: null, p: null, c: null, fs: '', round: 1, timer: 60, score: 0, freeze: 0, slow: 0, slowAcc: 0, shake: 0, hype: 0,
      msgs: [], paused: false, pm: 0, cam: { x: 0, y: 1.5, z: 6, lx: 0, ly: 1, lz: 0, fov: CFG.fov || 42 }, winner: null, endWhy: '', tally: null, cont: 0, rec: [], recEv: [], replay: null, idle: 0,
      run: null, ladder: [], step: 0, combo: { n: 0, dmg: 0, t: 0, side: 0 }, gi: 0, ringSec: false };
    if (window.__rmDebug) window.__rmFightG = G;
    window['__' + (CFG.dbgName || 'fight') + 'Dbg'] = { G, SV, cheat: o => cheat(o), ROST, STAGES };
    function music(k) { if (!opt.music) { K.music(null); return; } const s = CFG.music[k] || null; K.music(s); }
    const SFX = makeSfx(K, look);
    function say(text, frames, o) { G.msgs.push(Object.assign({ text, t: 0, life: frames || 60, col: '#fff' }, o || {})); if (G.msgs.length > 4) G.msgs.shift(); }
    function sayC(text, frames, o) { G.msgs = G.msgs.filter(m => !m.big); say(text, frames, Object.assign({ big: true }, o)); }

    // ================================================================ input -> what each fighter wants this frame
    const BTN = ['a', 'b', 'x', 'y'];
    function blankInp() { return { fwd: false, back: false, up: false, down: false, lat: 0, jump: 0, dash: 0, guard: false, press: null, thr: -1, dir: null, run: null, gi: false, pressed: [] }; }
    function playerInput(f, o) {
      const L = onLeft(f, o), fK = L ? 'right' : 'left', bK = L ? 'left' : 'right';
      const inp = blankInp();
      inp.fwd = K.held(fK); inp.back = K.held(bK); inp.up = K.held('up'); inp.down = K.held('down');
      const fr = G.frame;
      if (K.pressed(fK)) { if (fr - f.lastFP < 12 && !inp.down) inp.dash = 1; f.lastFP = fr; }
      if (K.pressed(bK)) { if (fr - f.lastBP < 12 && !inp.down) inp.dash = -1; f.lastBP = fr; f.lastB = fr; }
      if (DUEL) {
        const st = K.stick();
        inp.guard = K.held('y'); inp.crouchG = inp.guard && st.y > 0.5;
        inp.run = (Math.abs(st.x) > 0.3 || Math.abs(st.y) > 0.3) ? st : null;
        inp.fwd = (L ? st.x : -st.x) > 0.4; inp.back = (L ? st.x : -st.x) < -0.4; inp.down = st.y > 0.5; inp.up = st.y < -0.5;
        if (K.pressed('y') && inp.fwd) inp.gi = true;
        if (inp.guard && f.st !== 'atk') { inp.run = inp.run && !inp.crouchG ? inp.run : null; }
      } else {
        inp.guard = inp.back;
        // Up: a quick press is a sidestep into the screen, holding it jumps; Down: a quick press steps out, holding it crouches
        if (inp.up) { f.utap++; if (f.utap === 7) inp.jump = inp.fwd ? 1 : inp.back ? -1 : 0.01; } else { if (f.utap > 0 && f.utap < 7) inp.lat = -1; f.utap = 0; }
        if (inp.down) f.dtap++; else { if (f.dtap > 0 && f.dtap < 7) inp.lat = 1; f.dtap = 0; }
        if (inp.up && f.utap < 7) inp.up = false;
      }
      inp.dir = inp.fwd ? 'f' : inp.back ? 'b' : inp.down ? 'd' : null;
      for (const b of BTN) if (K.pressed(b)) { f.buf.push({ b, t: 0, dir: inp.dir }); inp.pressed.push(b); }
      return inp;
    }
    // buttons wait 2 frames for a partner (two together is a throw)
    function takeButtons(f, inp) {
      if (!f.buf.length) return;
      for (const x of f.buf) x.t++;
      const has = b => f.buf.some(x => x.b === b);
      f.moves.thr.forEach((m, i) => { if (inp.thr < 0 && has(m.btns[0]) && has(m.btns[1])) inp.thr = i; });
      if (inp.thr >= 0) { f.buf.length = 0; return; }
      const first = f.buf[0];
      if (first.t >= 2) { f.buf.shift(); inp.press = first.b; inp.dir = first.dir || inp.dir; }
      if (f.buf.length > 4) f.buf.length = 0;
    }

    // ================================================================ the CPU: reads, guards, punishes, juggles, mixes up (better at higher levels)
    const LV = (f, arr) => { const l = clamp(f.lvl, 0, arr.length - 1), a = Math.floor(l), b = Math.min(arr.length - 1, a + 1); return lerp(arr[a], arr[b], l - a); };
    function pickMove(f, o, want) {
      const d = dist(f, o), L = f.moves.list.filter(m => !m.air && !m.chainOnly && m.kind !== 't');
      let ok = L.filter(m => m.rng + 0.25 >= d);
      if (!ok.length) return null;
      const by = {
        fast: () => ok.reduce((a, b) => (b.su < a.su ? b : a)),
        big: () => ok.reduce((a, b) => (b.dmg / (b.su + 4) > a.dmg / (a.su + 4) ? b : a)),
        launch: () => ok.find(m => m.launch) || null,
        low: () => { const l = ok.filter(m => m.ht === 'l'); return l.length ? l[rnd() * l.length | 0] : null; },
        mid: () => { const l = ok.filter(m => m.ht === 'm'); return l.length ? l[rnd() * l.length | 0] : null; },
        special: () => { const l = ok.filter(m => m.sp); return l.length ? l[rnd() * l.length | 0] : null; },
        push: () => ok.reduce((a, b) => ((b.push || 0) > (a.push || 0) ? b : a)),
        any: () => ok[rnd() * ok.length | 0],
      };
      return (by[want] || by.any)() || by.any();
    }
    function pressMove(inp, m) { if (!m) return; inp.press = m.btn; inp.dir = m.dir || null; inp.want = m.id; }
    function cpuInput(f, o) {
      const A = f.ai, inp = blankInp();
      if (G.fs !== 'fight') return inp;
      const d = dist(f, o);
      // training dummies
      if (f.dummy && f.dummy !== 'cpu') {
        const m = o.st === 'atk' && o.mv ? o.mv : null;
        if (f.dummy === 'random' && m && A.rgId !== o.atkId) { A.rgId = o.atkId; A.rg = rnd() < 0.5; }
        const gd = f.dummy === 'guard' || (f.dummy === 'random' && A.rg);
        if (gd) { if (m) { inp.guard = true; inp.back = false; if (m.ht === 'l') { inp.down = true; inp.crouchG = true; } } else if (DUEL) inp.guard = true; }
        if (f.dummy === 'random' && !A.rg) inp.noAuto = true;
        if (f.dummy === 'crouch') { inp.down = true; inp.crouchG = DUEL; inp.guard = DUEL; inp.back = false; }
        if (f.dummy === 'jump' && f.st === 'idle' && G.frame % 70 === 0) inp.jump = 0.01;
        if (DUEL && !inp.guard) inp.guard = false;
        inp.dir = inp.down ? 'd' : null; if (f.dummy === 'stand') inp.noAuto = true;
        return inp;
      }
      // follow up a string?
      if (f.st === 'atk' && f.mv && f.mv.next && !A.chainDone && f.t >= f.mv.su) {
        A.chainDone = true;
        if (rnd() < LV(f, [0.2, 0.45, 0.65, 0.8, 0.9])) { const ks = Object.keys(f.mv.next); const b = ks[rnd() * ks.length | 0]; inp.press = b; inp.dir = null; }
        return inp;
      }
      if (f.st !== 'atk') A.chainDone = false;
      // 1. defence: see an attack coming, guard the right way (or step, parry, guard impact)
      if (o.st === 'atk' && o.mv && o.mv.kind !== 't' && o.t < o.mv.su + o.mv.ac) {
        if (A.seen !== o.atkId) { A.seen = o.atkId; A.react = Math.round(LV(f, [24, 16, 11, 7, 4]) * (0.8 + rnd() * 0.4)); A.dec = false; }
        else if (!A.dec && --A.react <= 0) {
          A.dec = true;
          if (d < o.mv.rng + 0.8 && (isFree(f.st) || f.st === 'atk' && f.t < 3)) {
            const mv = o.mv, good = rnd() < LV(f, [0.25, 0.48, 0.68, 0.82, 0.92]);
            if (good) {
              if (!DUEL && mv.ht !== 'l' && !mv.unb && rnd() < LV(f, [0, 0.03, 0.1, 0.18, 0.26])) A.def = 'parry';
              else if (DUEL && mv.ht !== 'l' && !mv.unb && rnd() < LV(f, [0, 0.04, 0.12, 0.2, 0.3])) A.def = 'gi';
              else if (!mv.track && rnd() < LV(f, [0.02, 0.08, 0.16, 0.22, 0.28])) A.def = 'side';
              else if (mv.unb) A.def = 'back';
              else A.def = mv.ht === 'l' ? 'low' : 'high';
            } else A.def = rnd() < 0.55 ? (o.mv.ht === 'l' ? 'high' : 'low') : 'none';
            A.defT = Math.max(4, o.mv.su + o.mv.ac - o.t + 3); A.defMv = o.atkId;
          }
        }
      }
      if (A.defT > 0) {
        A.defT--;
        const left = o.st === 'atk' && o.mv && o.atkId === A.defMv ? o.mv.su - o.t : 99;
        switch (A.def) {
          case 'high': inp.guard = true; inp.back = !DUEL && rnd() < 0.3; break;
          case 'low': inp.guard = true; inp.down = true; inp.crouchG = true; inp.back = !DUEL; break;
          case 'side': if (!DUEL) { inp.lat = rnd() < 0.5 ? -1 : 1; A.defT = 0; } else { inp.run = { x: 0, y: A.cdir || (A.cdir = rnd() < 0.5 ? -1 : 1) }; } break;
          case 'parry': if (left <= 3 && left >= 0) { inp.back = true; inp.guard = true; f.lastB = G.frame; } break;
          case 'gi': if (left <= 5 && left >= 1 && !A.giDone) { inp.gi = true; A.giDone = true; } else if (left > 5) A.giDone = false; break;
          case 'back': inp.back = true; inp.dash = DUEL ? 0 : -1; break;
        }
        inp.dir = inp.down ? 'd' : inp.back ? 'b' : null;
        return inp;
      }
      // 2. punish a whiffed / blocked / parried move
      const oRec = o.st === 'parried' ? o.stun : (o.st === 'atk' && o.mv && o.t >= o.mv.su + o.mv.ac ? o.mv.total - o.t : 0);
      if (oRec > 6 && isFree(f.st) && !A.pun) {
        A.pun = true;
        if (rnd() < LV(f, [0.08, 0.28, 0.55, 0.8, 0.95])) { const cands = f.moves.list.filter(m => !m.air && !m.chainOnly && m.kind !== 't' && m.su < oRec - 1 && m.rng + 0.2 >= d); if (cands.length) { const best = cands.reduce((a, b) => ((b.launch ? b.dmg * 2.2 : b.dmg) > (a.launch ? a.dmg * 2.2 : a.dmg) ? b : a)); pressMove(inp, best); return inp; } }
      }
      if (oRec <= 0) A.pun = false;
      // 3. juggle a launched opponent / hit a crumpling one
      if ((o.st === 'air' && !o.noJ && o.y > 0.25 && o.vy < 0.06) || o.st === 'crumple') {
        if (isFree(f.st) && rnd() < LV(f, [0.1, 0.35, 0.65, 0.85, 0.95])) { const m = pickMove(f, o, o.st === 'crumple' ? 'big' : 'fast'); if (m && m.ht !== 'l') { pressMove(inp, m); return inp; } }
        if (d > 1.4 && isFree(f.st)) { inp.fwd = true; inp.dir = 'f'; return inp; }
      }
      // 4. a downed opponent: a cheeky low, or back off and wait
      if (o.st === 'down' && isFree(f.st)) {
        if (d < 1.6 && !A.otg && rnd() < LV(f, [0, 0.05, 0.15, 0.3, 0.4])) { A.otg = true; const m = pickMove(f, o, 'low'); if (m) { pressMove(inp, m); return inp; } }
        if (d < 1.2) { inp.back = true; inp.dir = 'b'; } return inp;
      }
      A.otg = false;
      // 5. ring outs (Soul Sabre): keep off the edge, push them off theirs
      const R0 = stage && stage.ring;
      if (R0 && isFree(f.st)) {
        const myEdge = R0 - Math.max(Math.abs(f.x), Math.abs(f.z)), theirEdge = R0 - Math.max(Math.abs(o.x), Math.abs(o.z));
        if (myEdge < 1.1 && LV(f, [0.2, 0.5, 0.8, 0.95, 1]) > rnd() * 0.9) { const cr = camRight(), aw = camAway(), tx = -f.x, tz = -f.z, l = Math.hypot(tx, tz) || 1; inp.run = { x: (tx * cr[0] + tz * cr[1]) / l, y: -(tx * aw[0] + tz * aw[1]) / l }; inp.guard = rnd() < 0.3; return inp; }
        if (theirEdge < 1.4 && d < 2.2 && rnd() < LV(f, [0.02, 0.06, 0.12, 0.2, 0.26])) { if (d < 1.2 && rnd() < 0.4) { inp.thr = 0; return inp; } pressMove(inp, pickMove(f, o, 'push')); return inp; }
      }
      // 6. the plan: close in, wait, poke, mix up, throw
      A.t--;
      if (A.t <= 0) {
        const agg = LV(f, [0.32, 0.46, 0.56, 0.66, 0.74]) * (f.cfg.ai && f.cfg.ai.agg || 1), r = rnd(), reach = DUEL ? 2.1 : 1.35;
        A.t = Math.max(4, Math.round(LV(f, [40, 26, 18, 12, 8]) + rnd() * LV(f, [30, 18, 12, 8, 6])));
        if (d > reach + 0.5) A.plan = r < 0.75 ? 'close' : r < 0.87 ? 'side' : 'wait';
        else if (r < agg) A.plan = 'attack';
        else if (r < agg + 0.08 * (f.cfg.ai && f.cfg.ai.thr || 1) && d < 1.25) A.plan = 'throw';
        else if (r < agg + 0.16) A.plan = 'back';
        else if (r < agg + 0.26) A.plan = 'side';
        else A.plan = 'wait';
        if (o.st === 'guard' || o.guard) A.plan = rnd() < LV(f, [0.05, 0.2, 0.35, 0.45, 0.5]) && d < 1.25 ? 'throw' : A.plan;
      }
      switch (A.plan) {
        case 'close': inp.fwd = true; if (d > 3.2 && rnd() < 0.04) inp.dash = 1; break;
        case 'back': inp.back = true; inp.guard = !DUEL; if (DUEL && rnd() < 0.5) inp.guard = true; break;
        case 'wait': if (DUEL) inp.guard = rnd() < LV(f, [0.1, 0.3, 0.5, 0.6, 0.7]); break;
        case 'side': if (!DUEL) { inp.lat = rnd() < 0.5 ? -1 : 1; A.plan = 'wait'; } else { A.plan = 'circle'; A.cdir = rnd() < 0.5 ? -1 : 1; A.t = 16 + rnd() * 16 | 0; } break;
        case 'circle': inp.run = { x: 0, y: A.cdir }; break;
        case 'throw': inp.thr = f.moves.thr.length > 1 && rnd() < 0.5 ? 1 : 0; A.plan = 'wait'; A.t = 10; break;
        case 'attack': {
          if (d > (DUEL ? 2.3 : 1.55)) { inp.fwd = true; break; }
          const r = rnd(), lvl = f.lvl;
          const want = r < 0.18 ? 'low' : r < 0.36 ? 'mid' : r < 0.46 && lvl > 1 ? 'launch' : r < 0.58 ? 'special' : r < 0.75 ? 'fast' : 'any';
          pressMove(inp, pickMove(f, o, want)); A.plan = 'wait'; A.t = Math.round(LV(f, [30, 18, 12, 8, 5]));
          break;
        }
      }
      if (!inp.dir) inp.dir = inp.down ? 'd' : inp.fwd ? 'f' : inp.back ? 'b' : null;
      return inp;
    }

    // ================================================================ one fighter, one frame
    function startMove(f, mv) {
      f.st = 'atk'; f.mv = mv; f.t = 0; f.hitDone = false; f.hitN = 0; f.queued = null; f.atkId = (f.atkId + 1) | 0; f.trail.clear();
      if (mv.kind === 't') return;
      SFX.whoosh(mv.dmg, mv.su);
    }
    function moveKeys(f, mv) {
      let k = f.keys[mv.id]; if (k) return k;
      const base = mv.air ? POSE.jump : f.stance, su = mv.su, ac = mv.ac;
      if (mv.K) k = mv.K.map(([t, p]) => [t, p === 'base' ? base : p]);
      else k = [[0, base], [Math.max(1, su * 0.62), mv.A || base], [su, mv.B || mv.A || base], [su + ac, mv.B || mv.A || base], [mv.total, base]];
      return f.keys[mv.id] = k;
    }
    function stepFighter(f, o, inp) {
      f.t++;
      const fv = fwdVec(f);
      const faceO = (k) => { const a = Math.atan2(o.x - f.x, o.z - f.z); f.face = k ? f.face + wrapA(a - f.face) * k : a; };
      const base = f.stance; let target = base, k = 0.3;
      f.guard = null; f.crouch = false;
      const airborne = f.y > 0.001 || f.vy > 0;
      switch (f.st) {
        case 'idle': case 'walk': case 'back': case 'guard': case 'crouch': case 'run': {
          faceO(0.35);
          if (inp.gi && DUEL) { f.st = 'impact'; f.t = 0; f.vx *= 0.3; f.vz *= 0.3; break; }
          if (inp.thr >= 0 && f.moves.thr[inp.thr]) { startMove(f, f.moves.thr[inp.thr]); break; }
          if (inp.press) { const mv = moveFor(f, inp.press, f.crouch || inp.down ? (inp.dir === 'd' || inp.down ? 'd' : inp.dir) : inp.dir); if (mv) { startMove(f, mv); break; } }
          if (inp.jump && !DUEL) { f.st = 'jump'; f.t = 0; f.vy = 0.15; const s = inp.jump > 0.5 ? 1 : inp.jump < -0.5 ? -1 : 0; f.vx = fv[0] * s * 0.05; f.vz = fv[1] * s * 0.05; SFX.hop(); break; }
          if (inp.dash) { f.st = inp.dash > 0 ? 'dash' : 'bdash'; f.t = 0; SFX.step(); break; }
          if (inp.lat && !DUEL) { f.st = 'side'; f.t = 0; const aw = camAway(); f.sideDir = inp.lat; f.sideV = [aw[0] * -inp.lat, aw[1] * -inp.lat]; SFX.step(); break; }
          const runOk = DUEL && inp.run && (Math.abs(inp.run.x) > 0.3 || Math.abs(inp.run.y) > 0.3);
          if (DUEL && (inp.crouchG || (inp.down && !runOk))) { f.st = 'crouch'; f.crouch = true; f.guard = inp.guard ? 'l' : null; target = inp.guard ? POSE.bcguard : POSE.crouch; k = 0.35; f.vx *= 0.5; f.vz *= 0.5; break; }
          if (DUEL && (runOk || inp.fwd || inp.back)) {
            const cr = camRight(), aw = camAway();
            let mx, mz; if (runOk) { mx = inp.run.x * cr[0] - inp.run.y * aw[0]; mz = inp.run.x * cr[1] - inp.run.y * aw[1]; } else { const sg = inp.fwd ? 1 : -1; mx = fv[0] * sg; mz = fv[1] * sg; }
            const l = Math.hypot(mx, mz) || 1, dot = (mx * fv[0] + mz * fv[1]) / l, back = dot < -0.5;
            const sp = f.speed * (back ? 0.75 : 1) * (inp.guard ? 0.45 : 1);
            f.vx = lerp(f.vx, mx / l * sp, 0.4); f.vz = lerp(f.vz, mz / l * sp, 0.4); f.st = 'run'; f.guard = inp.guard ? 'h' : null;
            target = inp.guard ? POSE.bguard : walkPose(f, base, dot, Math.abs(dot) < 0.5 ? (mx * fv[1] - mz * fv[0]) / l : 0);
            k = 0.3; break;
          }
          if (!DUEL && inp.down) { f.st = 'crouch'; f.crouch = true; f.guard = inp.noAuto ? null : 'l'; target = inp.back ? POSE.cguard : mixP(POSE.crouch, base, 0.15, f.tmp); k = 0.35; f.vx *= 0.5; f.vz *= 0.5; break; }
          if (!DUEL && inp.fwd) { f.vx = fv[0] * f.speed; f.vz = fv[1] * f.speed; f.st = 'walk'; target = walkPose(f, base, 1, 0); break; }
          if (!DUEL && inp.back) { f.vx = -fv[0] * f.speed * 0.8; f.vz = -fv[1] * f.speed * 0.8; f.st = 'back'; f.guard = 'h'; target = mixP(walkPose(f, base, -1, 0), POSE.guard, 0.5, f.tgt); break; }
          f.st = inp.guard ? 'guard' : 'idle'; f.vx *= 0.6; f.vz *= 0.6;
          if (!DUEL && !inp.noAuto) f.guard = 'h'; // standing still guards highs and mids (Tekno Fist)
          if (DUEL && inp.guard) f.guard = 'h';
          if (inp.guard) target = DUEL ? POSE.bguard : POSE.guard;
          else { const b = Math.sin(G.frame * (f.cfg.bounce ? 0.2 : 0.11) + (f.slot === 'c' ? 1.3 : 0)); mixP(base, base, 0, f.tmp); f.tmp[0] += b * (f.cfg.bounce ? 0.045 : 0.025); f.tmp[1] += b * 0.025; f.tmp[13] += b * 0.06; f.tmp[16] += b * 0.06; f.tmp[11] += b * 0.03; target = f.tmp; }
          break;
        }
        case 'dash': case 'bdash': {
          const s = f.st === 'dash' ? 1 : -1, sp = (f.t < 10 ? 0.12 : 0.04) * (s > 0 ? 1 : 0.85) * (f.cfg.spd || 1) ** 0.5;
          f.vx = fv[0] * sp * s; f.vz = fv[1] * sp * s; target = s > 0 ? POSE.dash : POSE.bdash; k = 0.35; faceO(0.3);
          if (s > 0 && f.t > 4 && inp.press) { const mv = moveFor(f, inp.press, inp.dir === 'b' ? null : inp.dir); if (mv) { startMove(f, mv); break; } }
          if (s > 0 && f.t > 4 && inp.thr >= 0) { startMove(f, f.moves.thr[inp.thr]); break; }
          if (f.t > 14) f.st = 'idle';
          break;
        }
        case 'side': {
          const d = f.t < 12 ? 0.075 : 0; f.vx = f.sideV[0] * d; f.vz = f.sideV[1] * d;
          mixP(base, POSE.side, 0.8, f.tmp); f.tmp[4] = f.sideDir * 0.5; target = f.tmp; k = 0.3; faceO(0.2);
          if (f.t > 6 && inp.press) { const mv = moveFor(f, inp.press, inp.dir); if (mv) { startMove(f, mv); break; } }
          if (f.t > 15) { f.st = 'idle'; faceO(); }
          break;
        }
        case 'jump': {
          f.y += f.vy; f.vy -= 0.0085; target = POSE.jump; k = 0.25;
          if (inp.press && f.t > 3 && f.y > 0.2) { const mv = moveFor(f, inp.press, null, 'air'); if (mv) { startMove(f, mv); f.air = true; break; } }
          if (f.y <= 0 && f.vy < 0) { f.y = 0; f.vy = 0; f.st = 'land'; f.t = 0; f.vx *= 0.3; f.vz *= 0.3; SFX.land(); }
          break;
        }
        case 'land': target = POSE.crouch; k = 0.4; f.vx *= 0.7; f.vz *= 0.7; if (f.t > 6) f.st = 'idle'; break;
        case 'impact': { // a Guard Impact attempt (Soul Sabre): a short window that knocks attacks aside
          target = POSE.impact; k = 0.45; f.vx *= 0.7; f.vz *= 0.7; faceO(0.3);
          if (f.t > (f.giHit ? 12 : 24)) { f.st = 'idle'; f.giHit = false; }
          break;
        }
        case 'parryOK': target = POSE.impact; k = 0.45; f.vx *= 0.7; f.vz *= 0.7; if (f.t > 10) f.st = 'idle'; break;
        case 'parried': target = POSE.parried; k = 0.3; f.vx *= 0.85; f.vz *= 0.85; if (--f.stun <= 0) { f.st = 'idle'; } break;
        case 'atk': {
          const mv = f.mv, su = mv.su, ac = mv.ac;
          if (mv.track && f.t < su) faceO(0.25);
          if (mv.kind !== 't' && f.t === su) { SFX.swing(mv); if (mv.fx) fxMove(f, mv, true); if (mv.heal) { f.hp = Math.min(f.max, f.hp + mv.heal); f.dmgLag = Math.max(f.dmgLag, f.hp); say('+' + mv.heal + ' ENERGY', 50, { col: '#7affd0', side: f === G.p ? -1 : 1, small: true }); SFX.ok(); } }
          // a string: the next button in the window queues the next move
          if (mv.next && f.t >= mv.cw[0] - 6 && f.t <= mv.cw[1] && inp.press && mv.next[inp.press] && !f.queued) { f.queued = f.moves.ids[mv.next[inp.press]] || null; }
          if (f.queued && f.t >= su + ac) { const q = f.queued; startMove(f, q); f.combo = true; target = f.pose; break; }
          target = evalKeys(moveKeys(f, mv), f.t, f.tmp); k = f.t < su ? 0.55 : f.t < su + ac ? 0.85 : 0.35;
          if (mv.spin) { const p = f.t < su ? 0 : f.t < su + ac ? mv.spin * ((f.t - su) / ac) : mv.spin; f.tmp[4] = p; f.pose[4] = lerp(f.pose[4], p, 0.6); }
          if (mv.dash && f.t < su + ac) { const s = f.t < su ? (mv.dashSu ? 1 : 0.35) : 1; f.vx = fv[0] * mv.dash * s; f.vz = fv[1] * mv.dash * s; } else { f.vx *= 0.7; f.vz *= 0.7; }
          if (mv.back && f.t < su) { f.vx = -fv[0] * mv.back; f.vz = -fv[1] * mv.back; }
          if (f.air) { f.y += f.vy; f.vy -= 0.0085; if (f.y <= 0 && f.vy < 0) { f.y = 0; f.vy = 0; f.air = false; f.st = 'land'; f.t = 0; SFX.land(); break; } }
          else if (mv.hop && f.t < su + ac + 4) f.y = Math.sin(clamp(f.t / (su + ac + 4), 0, 1) * Math.PI) * mv.hop;
          if (mv.fx && f.t >= su - 2 && f.t < su + ac + 2) fxMove(f, mv, false);
          if (mv.kind === 't' && f.t === su) tryThrow(f, o, mv);
          if (f.st === 'atk' && f.t >= mv.total) { f.st = 'idle'; if (Math.abs(f.pose[4]) > 3) f.pose[4] = wrapA(f.pose[4]); f.mv = null; if (!f.air) f.y = 0; }
          break;
        }
        case 'throwing': {
          const th = f.thr, K0 = THROWS[th.kind] || THROWS.hip;
          target = evalKeys(K0.A, f.t, f.tmp); k = 0.4; f.vx = f.vz = 0;
          if (K0.spin) f.tmp[4] = K0.spin(f.t);
          f.y = K0.hop ? K0.hop(f.t) : 0;
          if (K0.fwd) { f.x = f.thrX + fv[0] * K0.fwd(f.t); f.z = f.thrZ + fv[1] * K0.fwd(f.t); }
          if (f.t >= K0.len) { f.st = 'idle'; f.y = 0; f.pose[4] = 0; f.tmp[4] = 0; }
          break;
        }
        case 'thrown': {
          const A = f.by, th = A.thr, K0 = THROWS[th.kind] || THROWS.hip, tt = A.t;
          const sp = K0.spin ? K0.spin(tt) : 0, af = A.face + sp, afv = [Math.sin(af), Math.cos(af)], ar = [afv[1], -afv[0]];
          const P = K0.at(tt);
          // a throw break: press the right buttons as you're grabbed
          if (tt < 12 && !f.cpu && G.mode !== 'demo' && (inp.thr >= 0 || (inp.press && A.thrMv && A.thrMv.btns.includes(inp.press)))) { breakThrow(A, f); break; }
          f.x = A.x + afv[0] * (P.d || 0) + ar[0] * (P.s || 0); f.z = A.z + afv[1] * (P.d || 0) + ar[1] * (P.s || 0); f.y = Math.max(0, (P.y || 0) + (K0.hop ? K0.hop(tt) * 0.7 : 0));
          f.face = af + Math.PI + (P.turn || 0); f.tilt = P.tilt || 0; f.hide = !!P.hide; target = P.pose || POSE.hit; k = 0.35;
          for (const [hf, share] of K0.hits) if (tt === hf) { damage(f, A, A.thrDmg * share, { thr: true }); hitFx(f, A, 'm', A.thrDmg * share >= 10, false); }
          if (K0.fx && tt > 12 && tt % 4 === 0) fxThrow(f, K0.fx);
          if (tt >= K0.len) {
            const E = K0.end; f.hide = false;
            f.face = A.face + Math.PI * (E.flip ? 0 : 1); if (E.flip) f.face = A.face;
            if (E.st === 'air') { f.st = 'air'; f.t = 0; f.vx = afv[0] * E.vx; f.vz = afv[1] * E.vx; f.vy = E.vy; f.noJ = true; f.tilt = -0.6; }
            else if (E.st === 'crumple') { f.st = 'crumple'; f.t = 0; f.tilt = 0; }
            else { f.st = f.hp <= 0 ? 'ko' : 'down'; f.t = 0; f.tilt = -1.55; slam(f); }
          }
          break;
        }
        case 'hit': case 'gstun': {
          target = f.st === 'gstun' ? (f.gcr ? (DUEL ? POSE.bcguard : POSE.cguard) : (DUEL ? POSE.bguard : POSE.guard)) : f.hitPose || POSE.hit; k = 0.5;
          if (f.st === 'gstun') { f.guard = f.gcr ? 'l' : 'h'; f.crouch = !!f.gcr; }
          f.vx *= 0.84; f.vz *= 0.84;
          if (--f.stun <= 0) { f.st = f.gcr && f.st === 'gstun' ? 'crouch' : 'idle'; f.gcr = false; if (f.wasGuard && f.cpu) f.ai.pun = false; f.wasGuard = false; }
          break;
        }
        case 'crumple': {
          target = POSE.crumple; k = 0.12; f.vx *= 0.85; f.vz *= 0.85;
          if (f.t > 46) { f.st = f.hp <= 0 ? 'ko' : 'down'; f.t = 0; f.tilt = -0.2; slam(f, true); }
          break;
        }
        case 'air': {
          target = POSE.air; k = 0.25;
          f.y += f.vy; f.vy -= 0.0085; f.vx *= 0.97; f.vz *= 0.97; f.tilt = lerp(f.tilt || 0, -1.3, 0.07);
          if (f.y <= 0 && f.vy < 0) { f.y = 0; f.vy = 0; slam(f); f.st = f.hp <= 0 ? 'ko' : 'down'; f.t = 0; f.juggle = 0; f.noJ = false; }
          break;
        }
        case 'down': case 'ko': {
          target = POSE.down; k = 0.3; f.tilt = lerp(f.tilt || 0, -1.55, 0.2); f.vx *= 0.82; f.vz *= 0.82; f.y = Math.max(0, f.y - 0.05);
          if (f.st === 'down') {
            const wake = f.cpu ? (f.wake || (f.wake = 18 + (rnd() * LV(f, [40, 30, 22, 16, 12]) | 0))) : 60;
            if (f.t > wake || (f.t > 14 && !f.cpu && (inp.press || inp.fwd || inp.back || inp.up))) { f.st = 'rise'; f.t = 0; f.wake = 0; }
          }
          break;
        }
        case 'rise': target = base; k = 0.22; f.tilt = lerp(f.tilt || 0, 0, 0.22); if (f.t > 18) { f.st = 'idle'; f.tilt = 0; } break;
        case 'ringout': target = POSE.air; k = 0.2; f.y -= f.vy; f.vy += 0.01; f.vx *= 0.98; f.vz *= 0.98; f.tilt = lerp(f.tilt || 0, -0.8, 0.05); if (!f.splash && f.y < (stage.waterY == null ? -2 : stage.waterY)) { f.splash = true; splash(f); } break;
        case 'win': target = f.cfg.winPose ? PP(f.cfg.winPose) : POSE.win; k = 0.1; f.vx *= 0.8; f.vz *= 0.8; faceO(0.05); if (f.cfg.winAnim) f.cfg.winAnim(f.tmp, G.frame) ; break;
        case 'lose': target = mixP(base, POSE.hitlow, 0.6, f.tmp); k = 0.1; f.vx *= 0.8; f.vz *= 0.8; break;
        case 'pose': target = f.posePose || base; k = 0.12; break;
      }
      f.x += f.vx; f.z += f.vz;
      // the edges: invisible walls (Tekno Fist) or the edge of the ring (Soul Sabre: off you go: RING OUT)
      const R = stage.ring || 0, Wl = stage.wall || 8.5;
      if (R) {
        const out = stage.round ? Math.hypot(f.x, f.z) > R : (Math.abs(f.x) > R || Math.abs(f.z) > R);
        if (out && f.st !== 'ringout' && f.st !== 'thrown' && f.st !== 'throwing' && (G.fs === 'fight' || G.fs === 'ko') && f.y <= 0.05) { f.st = 'ringout'; f.t = 0; f.vy = 0.02; f.ring = true; f.splash = false; SFX.fall(); }
      } else if (f.st !== 'thrown') { if (Math.abs(f.x) > Wl || Math.abs(f.z) > Wl) { if (f.st === 'air' && Math.hypot(f.vx, f.vz) > 0.05) { f.vx *= -0.4; f.vz *= -0.4; burst(new T.Vector3(f.x, f.y + 1, f.z), '#ffffff', 6, 0.08); SFX.thud(); } } f.x = clamp(f.x, -Wl, Wl); f.z = clamp(f.z, -Wl, Wl); }
      mixP(f.pose, target, k, f.pose);
    }
    function walkPose(f, base, dir, lat) {
      const w = Math.sin(G.frame * (DUEL ? 0.32 : 0.28) * (f.cfg.spd || 1) + (f.slot === 'c' ? 1.7 : 0)), a = 0.38 * (dir || 1);
      mixP(base, base, 0, f.tgt); const t = f.tgt;
      if (lat) { t[12] += Math.max(0, w) * 0.35; t[15] += Math.max(0, -w) * 0.35; t[4] += lat * 0.2; }
      else { t[11] += w * a; t[14] -= w * a; t[13] += Math.max(0, -w) * 0.75; t[16] += Math.max(0, w) * 0.75; }
      t[0] += Math.abs(w) * 0.03 - 0.02; t[2] += w * 0.06;
      return t;
    }
    function slam(f, soft) { if (opt.shake) G.shake = Math.max(G.shake, soft ? 3 : 6); SFX.thud(); dust(f.x, f.z, soft ? 6 : 12); }
    function splash(f) { for (let i = 0; i < 24; i++) FXN.spawn({ x: f.x + (rnd() - 0.5) * 0.6, y: stage.waterY == null ? -2 : stage.waterY, z: f.z + (rnd() - 0.5) * 0.6, vx: (rnd() - 0.5) * 0.08, vy: 0.08 + rnd() * 0.1, vz: (rnd() - 0.5) * 0.08, g: 0.006, life: 40, size: 0.35, col: stage.splashCol || '#e8f4ff', cell: 3 }); SFX.splash(); }
    function dust(x, z, n) { for (let i = 0; i < n; i++) FXN.spawn({ x: x + (rnd() - 0.5) * 0.8, y: (stage.floorY || 0) + 0.05, z: z + (rnd() - 0.5) * 0.8, vx: (rnd() - 0.5) * 0.03, vy: 0.01 + rnd() * 0.02, vz: (rnd() - 0.5) * 0.03, g: 0, drag: 0.94, life: 30 + rnd() * 20, size: 0.4, size1: 0.9, col: stage.dustCol || '#c8bca8', a: 0.5, cell: 3 }); }
    function breakThrow(A, B) {
      A.st = 'hit'; A.stun = 14; A.hitPose = POSE.hit; B.st = 'hit'; B.stun = 14; B.hitPose = POSE.hit; B.hide = false; B.tilt = 0;
      const fv = fwdVec(A); A.vx = -fv[0] * 0.08; A.vz = -fv[1] * 0.08; B.vx = fv[0] * 0.08; B.vz = fv[1] * 0.08;
      say('BREAK!', 50, { col: '#9af0ff', side: B === G.p ? -1 : 1 }); SFX.brk(); if (B === G.p) addScore(150);
    }
    function tryThrow(A, B, mv) {
      const d = dist(A, B);
      if (d > mv.rng + 0.1 || !(isFree(B.st) || B.st === 'atk' || B.st === 'gstun' || B.st === 'dash') || B.y > 0.15 || B.crouch || B.st === 'rise') { SFX.whiff(); return; }
      const brk = (B.cpu || G.mode === 'demo') && !B.dummy ? rnd() < LV(B, [0.03, 0.1, 0.2, 0.3, 0.38]) : false;
      if (brk) { breakThrow(A, B); return; }
      A.st = 'throwing'; A.t = 0; A.thr = mv.thr; A.thrMv = mv; A.thrX = A.x; A.thrZ = A.z; B.st = 'thrown'; B.t = 0; B.by = A; A.thrDmg = (mv.thr.dmg || 20) * (A.cfg.pow || 1);
      B.mv = null; B.trail.clear(); SFX.grab(); A.hitDone = true;
      if (mv.thr.n) say(mv.thr.n, 70, { col: '#ffd84a', side: A === G.p ? -1 : 1, small: true });
    }
    function addScore(n) { if (G.scoring) G.score += Math.round(n); }
    function damage(B, A, dmg, o) {
      o = o || {};
      const n = B.comboN;
      const scale = n > 0 ? Math.max(0.3, 1 - n * 0.11) * (B.st === 'air' ? 0.85 : 1) : 1;
      dmg = dmg * scale * (A.cfg.pow || 1) * (CFG.dmgMul || 1) * (A.bossMul || 1) * (B.armour || 1) * (o.counter ? 1.25 : 1) * (o.otg ? 0.5 : 1);
      dmg = Math.max(1, Math.min(Math.round(dmg), Math.ceil(B.hp)));
      if (G.mode === 'train' && B === G.c) { B.hp = Math.max(1, B.hp - dmg); } else B.hp = Math.max(0, B.hp - dmg);
      B.tookHit = true; B.comboN++; B.comboDmg += dmg; B.comboBy = A;
      if (B.comboN >= 2) { G.combo = { n: B.comboN, dmg: B.comboDmg, t: 90, side: A === G.p || (G.mode !== 'vs' && A.slot === 'p') ? -1 : 1 }; if (B.comboN >= 3) G.hype = Math.min(1, G.hype + 0.1); }
      if (A === G.p) { addScore(dmg * 4 + (B.comboN >= 2 ? 30 * (B.comboN - 1) : 0) + (o.counter ? 100 : 0)); if (B.comboN >= (CFG.comboSecretN || 8) && CFG.comboSecret) K.secret(CFG.comboSecret); }
      G.trainLast = { dmg, n: B.comboN, total: B.comboDmg };
      if (B.hp <= 0) ko(B, A);
    }
    function ko(B, A) {
      if (G.winner || G.mode === 'train') return;
      const dbl = A.hp <= 0;
      G.winner = dbl ? null : A; G.draw = dbl; G.endWhy = 'ko'; G.slow = 80; G.fs = 'ko'; G.t = 0; G.koAt = G.frame; G.koF = B;
      sayC(dbl ? 'DOUBLE K.O.' : 'K.O.', 120, { col: '#ff3a3a', grad: CFG.koGrad });
      SFX.ko(); G.hype = 1;
      if (B.st !== 'thrown' && B.st !== 'ringout') { B.st = 'air'; B.t = 0; B.vy = Math.max(B.vy, 0.13); const fv = fwdVec(A); B.vx = fv[0] * 0.07; B.vz = fv[1] * 0.07; B.noJ = true; }
      B.hp = 0;
    }
    // ---- hit effects
    const v3a = new T.Vector3(), v3b = new T.Vector3();
    function burst(pos, col, n, spd, cell, size) { for (let i = 0; i < n; i++) FXA.spawn({ x: pos.x, y: pos.y, z: pos.z, vx: (rnd() - 0.5) * spd, vy: (rnd() - 0.25) * spd, vz: (rnd() - 0.5) * spd, g: 0.003, drag: 0.9, life: 14 + rnd() * 10, size: (size || 0.22) * (0.6 + rnd() * 0.8), col, cell: cell == null ? 0 : cell }); }
    function hitFx(B, A, ht, heavy, blocked, special) {
      const fv = fwdVec(A), hgt = (ht === 'l' ? 0.4 : ht === 'm' ? 1.05 : 1.45) * (B.cfg.body && B.cfg.body.h || 1) + B.y;
      const at = v3a.set(B.x - fv[0] * 0.28, hgt, B.z - fv[1] * 0.28);
      if (blocked) { burst(at, CFG.guardCol || '#9ad8ff', 6, 0.1); FXA.spawn({ x: at.x, y: at.y, z: at.z, life: 10, size: 0.5, size1: 1.2, col: CFG.guardCol || '#9ad8ff', cell: 2 }); }
      else {
        const col = special || CFG.hitCol || '#ffd84a';
        burst(at, col, heavy ? 12 : 7, heavy ? 0.16 : 0.11); burst(at, '#ffffff', 4, 0.06);
        FXA.spawn({ x: at.x, y: at.y, z: at.z, life: 8, size: heavy ? 1.6 : 1.0, size1: heavy ? 0.4 : 0.3, col: '#ffffff', cell: 1 });
        FXA.spawn({ x: at.x, y: at.y, z: at.z, life: 12, size: 0.3, size1: heavy ? 2.0 : 1.3, col, cell: 2, a: 0.8 });
        G.flash = { x: at.x, y: at.y, z: at.z, t: heavy ? 6 : 4, big: heavy, col };
      }
      G.recEv.push({ f: G.frame, x: at.x, y: at.y, z: at.z, blocked, heavy, col: blocked ? (CFG.guardCol || '#9ad8ff') : (special || CFG.hitCol || '#ffd84a') });
      if (G.recEv.length > 60) G.recEv.shift();
    }
    const FXC = { fire: ['#ffd040', '#ff6a1a', '#ff2a0a'], zap: ['#ffffff', '#9ae0ff', '#4a9aff'], magic: ['#ff9aff', '#ffe04a', '#9affd0'], wind: ['#ffffff', '#c8f0ff'], ice: ['#ffffff', '#a0e8ff'], dark: ['#c06aff', '#5a1a9a', '#ff4aff'], petal: ['#ffb0d0', '#ffffff'], gold: ['#fff4a0', '#ffd040'], leaf: ['#9aff7a', '#3ac04a'], steam: ['#ffffff', '#e0e0e0'] };
    function anchorPos(f, name, i, out) { const a = f.m.anchor[name]; if (!a) return out.set(f.x, f.y + 1, f.z); const [bi, off] = a[i]; return out.copy(off).applyMatrix4(f.m.bones[bi].matrixWorld); }
    function fxMove(f, mv, big) {
      const cols = FXC[mv.fx] || FXC.fire, nm = mv.trail || (DUEL ? 'wpn' : 'hdR');
      f.m.mesh.updateMatrixWorld(true); anchorPos(f, nm, 0, v3b);
      const n = big ? 6 : 2;
      for (let i = 0; i < n; i++) (mv.fx === 'steam' ? FXN : FXA).spawn({ x: v3b.x + (rnd() - 0.5) * 0.15, y: v3b.y + (rnd() - 0.5) * 0.15, z: v3b.z + (rnd() - 0.5) * 0.15, vx: (rnd() - 0.5) * 0.03, vy: 0.01 + rnd() * 0.02, vz: (rnd() - 0.5) * 0.03, g: mv.fx === 'fire' ? -0.001 : 0.001, life: 16 + rnd() * 12, size: 0.18 + rnd() * 0.18, col: cols[rnd() * cols.length | 0], cell: mv.fx === 'magic' || mv.fx === 'zap' ? 0 : 1 });
    }
    function fxThrow(f, kind) {
      const cols = kind === 'zap' ? FXC.zap : ['#ffffff', '#d8d8e8', '#b8b8c8'];
      for (let i = 0; i < 4; i++) (kind === 'zap' ? FXA : FXN).spawn({ x: f.x + (rnd() - 0.5) * 0.7, y: f.y + 0.4 + rnd() * 1.4, z: f.z + (rnd() - 0.5) * 0.7, vx: (rnd() - 0.5) * 0.06, vy: (rnd() - 0.3) * 0.05, vz: (rnd() - 0.5) * 0.06, g: 0, life: 12 + rnd() * 10, size: kind === 'zap' ? 0.25 : 0.7, size1: kind === 'zap' ? 0.05 : 1.2, col: cols[rnd() * cols.length | 0], cell: kind === 'zap' ? 0 : 3, a: kind === 'zap' ? 1 : 0.8 });
      if (kind === 'zap') SFX.zap();
      if (kind === 'poof' && G.frame % 8 === 0) SFX.poof();
    }
    // ---- did an attack connect?
    function resolve(A, B) {
      if (A.st !== 'atk' || G.winner && G.fs !== 'ko') return;
      const mv = A.mv; if (!mv || mv.kind === 't' || A.t < mv.su || A.t >= mv.su + mv.ac) return;
      const nh = mv.hits || 1; if (A.hitDone) { if (nh > 1 && A.hitN < nh && (A.t - mv.su) >= A.hitN * mv.ac / nh) A.hitDone = false; else return; }
      if (B.st === 'rise' && B.t < 10) return;
      if (B.st === 'thrown' || B.st === 'ringout' || B.st === 'throwing' || B.hide) return;
      const downed = B.st === 'down' || B.st === 'ko';
      if (downed && !(mv.ht === 'l' || mv.otg)) return;
      const fv = fwdVec(A), dx = B.x - A.x, dz = B.z - A.z, fw = dx * fv[0] + dz * fv[1], lat = dx * fv[1] - dz * fv[0];
      if (fw < -0.25 || fw > mv.rng + 0.32 || Math.abs(lat) > (mv.track ? mv.rng * 0.95 : 0.5)) return;
      if (B.st === 'air' || B.st === 'jump' || (B.st === 'atk' && B.air)) { if (mv.ht === 'l' && B.y > 0.15) return; if (B.noJ && B.st === 'air') return; }
      else if (mv.ht === 'h' && (B.crouch || (B.st === 'atk' && B.mv && B.mv.crush === 'high' && B.t < B.mv.su + B.mv.ac) || B.st === 'crumple')) { if (B.st !== 'crumple') return; }
      if (mv.ht === 'l' && B.st === 'atk' && B.mv && B.mv.crush === 'low' && B.t < B.mv.su + B.mv.ac) return;
      A.hitDone = true; A.hitN++;
      // parry (Tekno Fist: back pressed just before) / Guard Impact (Soul Sabre)
      const canParry = mv.ht !== 'l' && !mv.unb && (mv.hits || 1) === 1;
      if (canParry && !DUEL && isFree(B.st) && !B.dummy && G.frame - B.lastB <= 6 && B.lastB > 0) { parry(A, B, false); return; }
      if (canParry && DUEL && B.st === 'impact' && B.t < 11) { parry(A, B, true); return; }
      const canGuard = (isFree(B.st) || B.st === 'gstun') && B.guard && !mv.unb;
      const blocked = canGuard && ((B.guard === 'h' && mv.ht !== 'l') || (B.guard === 'l' && mv.ht !== 'm' && mv.ht !== 's'));
      if (blocked) {
        B.gcr = B.guard === 'l'; B.st = 'gstun'; B.stun = mv.bs; B.wasGuard = true; const pk = 1 + (mv.push || 0) * 5; B.vx = fv[0] * 0.05 * pk; B.vz = fv[1] * 0.05 * pk;
        A.vx -= fv[0] * 0.03; A.vz -= fv[1] * 0.03;
        hitFx(B, A, mv.ht, false, true); SFX.block(mv); G.freeze = 3;
        if (B === G.p) addScore(15);
        if (DUEL && mv.dmg >= 10) B.hp = Math.max(1, B.hp - 1); // a little chip from big weapon blows
        return;
      }
      const counter = B.st === 'atk' && B.mv && B.t < B.mv.su;
      damage(B, A, mv.dmg, { counter, otg: downed });
      if (counter) say('COUNTER!', 45, { col: '#ff8a3a', side: A === G.p ? -1 : 1, small: true });
      const heavy = mv.dmg >= 12 || counter;
      hitFx(B, A, mv.ht, heavy, false, mv.fx ? (FXC[mv.fx] || FXC.fire)[0] : null);
      G.freeze = heavy ? 9 : 5; if (opt.shake) G.shake = Math.max(G.shake, heavy ? 7 : 3);
      SFX.hit(mv, heavy, DUEL);
      if (B.st === 'ko' || (G.winner && B.hp <= 0)) return;
      B.mv = null; B.trail.clear(); B.queued = null;
      const push = mv.push || 0.02;
      if (downed) { B.vy = 0.03; B.y = 0.02; return; }
      if (B.st === 'air' || (B.st === 'atk' && B.air)) { B.st = 'air'; B.air = false; B.juggle = (B.juggle || 0) + 1; if (B.juggle > 6) B.noJ = true; B.vy = Math.max(0.03, 0.105 - B.juggle * 0.012) + (mv.launch ? 0.04 : 0); B.vx = fv[0] * (0.025 + push * 0.4); B.vz = fv[1] * (0.025 + push * 0.4); return; }
      if (mv.launch) { B.st = 'air'; B.t = 0; B.vy = 0.17; B.vx = fv[0] * 0.02; B.vz = fv[1] * 0.02; B.juggle = 0; B.tilt = 0; say('LAUNCH!', 40, { col: '#9af0ff', side: A === G.p ? -1 : 1, small: true }); return; }
      if (mv.crumple || (counter && mv.dmg >= 14)) { B.st = 'crumple'; B.t = 0; B.vx = fv[0] * 0.03; B.vz = fv[1] * 0.03; return; }
      if (mv.kd || (B.hp < 20 && mv.dmg >= 12)) { B.st = 'air'; B.t = 0; B.vy = 0.08 + (mv.lift || 0); B.vx = fv[0] * (0.04 + push * 0.3); B.vz = fv[1] * (0.04 + push * 0.3); B.juggle = 0; B.noJ = !mv.juggleOK; return; }
      B.st = 'hit'; B.t = 0; B.stun = mv.hs + (counter ? 8 : 0); B.hitPose = mv.ht === 'l' ? POSE.hitlow : mv.ht === 'm' ? POSE.hitmid : POSE.hit;
      B.vx = fv[0] * (0.035 + push * 0.5); B.vz = fv[1] * (0.035 + push * 0.5);
    }
    function parry(A, B, gi) {
      A.st = 'parried'; A.stun = gi ? 32 : 26; A.mv = null; A.trail.clear(); A.queued = null;
      const fv = fwdVec(A); A.vx = -fv[0] * 0.05; A.vz = -fv[1] * 0.05;
      if (gi) { B.giHit = true; B.t = 2; } else { B.st = 'parryOK'; B.t = 0; }
      v3a.set((A.x + B.x) / 2, 1.3, (A.z + B.z) / 2);
      burst(v3a, '#ffffff', 14, 0.18); FXA.spawn({ x: v3a.x, y: v3a.y, z: v3a.z, life: 16, size: 0.4, size1: 2.6, col: gi ? '#7ad8ff' : '#ffe07a', cell: 2 }); FXA.spawn({ x: v3a.x, y: v3a.y, z: v3a.z, life: 10, size: 2.2, size1: 0.3, col: '#ffffff', cell: 1 });
      G.freeze = 10; G.flash = { x: v3a.x, y: v3a.y, z: v3a.z, t: 8, big: true, col: '#ffffff' };
      say(gi ? 'GUARD IMPACT!' : 'PARRY!', 60, { col: gi ? '#7ad8ff' : '#ffe07a', side: B === G.p ? -1 : 1 });
      SFX.parry(gi);
      if (B === G.p) { addScore(200); G.giCount = (G.giCount || 0) + 1; if (gi && CFG.giSecret && G.giCount >= 3) K.secret(CFG.giSecret); }
    }
    function separate(a, b) {
      if (a.st === 'thrown' || b.st === 'thrown' || a.st === 'ringout' || b.st === 'ringout' || a.hide || b.hide) return;
      if (Math.abs(a.y - b.y) > 1.2) return;
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = DUEL ? 0.8 : 0.62;
      if (d < min && d > 0.0001) { const p = (min - d) / 2, nx = dx / d, nz = dz / d; a.x -= nx * p; a.z -= nz * p; b.x += nx * p; b.z += nz * p; }
      else if (d <= 0.0001) { a.x -= 0.1; b.x += 0.1; }
    }
    // ---- the round's simulation step
    function simStep() {
      const p = G.p, c = G.c, live = G.fs === 'fight';
      const pi = live ? (p.cpu ? cpuInput(p, c) : playerInput(p, c)) : blankInp();
      const ci = live ? (c.cpu ? cpuInput(c, p) : blankInp()) : blankInp();
      if (live && !p.cpu) takeButtons(p, pi); else p.buf.length = 0;
      if (ci.thr < 0 && ci.press == null) {} // (the CPU presses directly)
      if (ci.back && !c.cpuLB) { c.lastB = G.frame; } c.cpuLB = ci.back;
      stepFighter(p, c, pi); stepFighter(c, p, ci);
      if (live || G.fs === 'ko') { resolve(p, c); resolve(c, p); }
      for (const f of [p, c]) if (isFree(f.st) && f.comboN) { f.comboN = 0; f.comboDmg = 0; f.juggle = 0; }
      separate(p, c);
      if (live) for (const [f, o] of [[p, c], [c, p]]) if (f.st === 'ringout' && !G.winner) {
        G.winner = o; G.endWhy = 'ring'; G.fs = 'ko'; G.t = 0; G.slow = 60; G.koAt = G.frame; G.koF = f; sayC('RING OUT!', 130, { col: '#9af0ff' }); SFX.ringout(); G.hype = 1;
        if (o === G.p && CFG.ringSecret && G.mode !== 'demo') K.secret(CFG.ringSecret);
      }
      // the replay recorder (the last four seconds)
      const snap = f => ({ x: f.x, y: f.y, z: f.z, face: f.face, tilt: f.tilt || 0, hide: f.hide, pose: new Float32Array(f.pose), st: f.st, mv: f.mv && f.mv.trail ? f.mv.trail : null, act: f.st === 'atk' && f.mv && f.t >= f.mv.su - 3 && f.t < f.mv.su + f.mv.ac + 3 });
      G.rec.push({ f: G.frame, p: snap(p), c: snap(c) }); if (G.rec.length > 260) G.rec.shift();
    }

    // ================================================================ matches and rounds
    const DIFF = [{ n: 'EASY', lv: 0.3 }, { n: 'NORMAL', lv: 1.3 }, { n: 'HARD', lv: 2.4 }, { n: CFG.masterName || 'MASTER', lv: 3.4 }];
    const ROUNDS = [1, 2, 3], TIMES = [30, 45, 60, 99, 0];
    let showA = null, showB = null;
    function clearShow() { removeFighter(showA); removeFighter(showB); showA = showB = null; }
    function clearFight() { removeFighter(G.p); removeFighter(G.c); G.p = G.c = null; FXA.clear(); FXN.clear(); }
    // m: { p: {cfg, cos}, c: {cfg, cos, lvl}, stage, need, time, boss }
    function startMatch(m) {
      clearShow(); clearFight();
      setStage(m.stage === 'train' ? 0 : m.stage, m.stage === 'train' ? 'train' : null);
      let pc = m.p.cos || 0, cc = m.c.cos || 0;
      if (m.p.cfg.id === m.c.cfg.id && pc === cc) cc = (cc + 1) % ncos(m.c.cfg);
      G.p = fighter(m.p.cfg, 'p', !!m.p.cpu, m.p.lvl || 0, pc);
      G.c = fighter(m.c.cfg, 'c', m.c.cpu !== false, m.c.lvl || 0, cc);
      if (m.boss) { G.c.max = G.c.hp = 125; G.c.bossMul = 1.12; }
      if (m.c.dummy) G.c.dummy = m.c.dummy;
      G.p.wins = G.c.wins = 0; G.round = 1; G.match = m; G.giCount = 0; G.score0 = G.score;
      if (m.carry != null) { G.p.carry = m.carry; }
      G.recEv.length = 0; G.rec.length = 0;
      go('vs');
    }
    function placeStart() {
      const p = G.p, c = G.c, d = DUEL ? 2.6 : 2.2;
      for (const [f, x] of [[p, -d / 2], [c, d / 2]]) {
        f.x = x; f.z = 0; f.y = 0; f.vx = f.vz = f.vy = 0; f.st = 'idle'; f.t = 0; f.mv = null; f.stun = 0; f.comboN = 0; f.comboDmg = 0; f.juggle = 0; f.buf = []; f.tookHit = false; f.noJ = false; f.air = false;
        f.face = x < 0 ? Math.PI / 2 : -Math.PI / 2; f.pose.set(f.stance); f.ring = false; f.tilt = 0; f.hide = false; f.trail.clear(); f.queued = null; f.ai = { t: 20, plan: 'wait' };
      }
      G.cam.x = 0; G.cam.z = 6; G.cam.lx = 0; G.cam.lz = 0; G.cam.y = 1.5;
    }
    function startRound() {
      const p = G.p, c = G.c, m = G.match;
      placeStart();
      for (const f of [p, c]) { f.hp = f.max; f.dmgLag = f.max; }
      if (p.carry != null && G.round === 1) { p.hp = p.dmgLag = Math.max(10, Math.round(p.carry)); }
      G.timer = m.time || Infinity; G.fs = G.round === 1 && !m.skipIntro ? 'intro' : 'ready'; G.t = 0; G.winner = null; G.draw = false; G.slow = 0; G.freeze = 0; G.replay = null; G.msgs = []; G.combo.t = 0; G.hype = 0.2;
      camFight(true);
      music(m.music || (STAGES[stageIdx] && STAGES[stageIdx].music) || 'fight');
    }
    function endRound() {
      const p = G.p, c = G.c, w = G.winner;
      if (w) w.wins++;
      if (w === p && G.scoring) {
        const perfect = !p.tookHit, tb = isFinite(G.timer) ? Math.min(300, Math.round(Math.max(0, G.timer)) * 6) : 150, hb = Math.round(p.hp / p.max * 600);
        G.tally = { win: 600, time: tb, health: hb, perfect: perfect ? 1000 : 0, ring: G.endWhy === 'ring' ? 300 : 0 };
        addScore(600 + tb + hb + (perfect ? 1000 : 0) + (G.endWhy === 'ring' ? 300 : 0));
      } else G.tally = null;
      if (w === p && !p.tookHit) { if (G.mode !== 'demo' && CFG.perfectSecret) K.secret(CFG.perfectSecret); say('PERFECT!', 140, { col: '#7affd0', big2: true }); }
      if (w) { w.st = 'win'; w.t = 0; w.posePick = rnd(); const l = w === p ? c : p; if (!['ko', 'ringout', 'down', 'air'].includes(l.st)) l.st = 'lose'; }
      G.fs = 'roundEnd'; G.t = 0;
      K.music(null);
      if (w === p || (G.mode === 'vs' && false)) SFX.jingle(true); else SFX.jingle(false);
    }
    function afterRound() {
      const p = G.p, c = G.c, need = G.match.need || 2;
      if (G.mode === 'train') { G.round++; startRound(); return; }
      if (p.wins >= need || c.wins >= need) { matchOver(p.wins >= need); return; }
      if (G.round >= need * 2 + 1) { matchOver(false); return; } // (too many draws)
      G.round++; startRound();
    }
    function finishRun(title, text) {
      if (G.done) return;
      const sc = Math.min(CFG.maxScore || 50000, Math.round(G.score), Math.floor((CFG.rate || 400) * 0.92 * (K.t + 5)));
      G.final = { sc, title, text };
      if (sc > 0 && (SV.hi.length < 8 || sc > SV.hi[SV.hi.length - 1].s)) go('name'); else go('over');
    }
    // ---- the modes
    function arcadeLadder(pick) {
      const ids = CFG.roster.map((f, i) => i).filter(i => CFG.roster[i].id !== pick.id);
      for (let i = ids.length - 1; i > 0; i--) { const j = rnd() * (i + 1) | 0; [ids[i], ids[j]] = [ids[j], ids[i]]; }
      const n = CFG.arcadeLen || 5, out = [];
      const rivalI = CFG.roster.findIndex(f => f.id === pick.rival);
      let pool = ids.filter(i => i !== rivalI).slice(0, rivalI >= 0 ? n - 1 : n);
      pool.forEach(i => out.push({ cfg: CFG.roster[i] }));
      if (rivalI >= 0) out.push({ cfg: CFG.roster[rivalI], rival: true });
      if (CFG.boss && pick.id !== CFG.boss.id) out.push({ cfg: CFG.boss, boss: true });
      else if (CFG.boss) { const r = CFG.roster[ids[n % ids.length]]; out.push({ cfg: r, boss: true }); }
      return out;
    }
    function homeStage(cfg) { const i = STAGES.findIndex(s => s.id === cfg.home); return i >= 0 ? i : (CFG.roster.indexOf(cfg) % Math.max(1, STAGES.filter(s => !s.lock && !s.boss).length)); }
    function lvlFor(step, boss) { return clamp(DIFF[opt.diff].lv + step * 0.18 + (boss ? 0.45 : 0), 0, 4); }
    function startRun(mode, pick, cos) {
      G.mode = mode; G.score = 0; G.cont = 0; G.done = false; G.scoring = mode === 'arcade' || mode === 'surv' || mode === 'ta';
      G.run = { mode, pick, cos, step: 0, wins: 0, t0: K.t, fights: [] };
      SV.n = (SV.n | 0) + 1; SV.last = ROST.indexOf(pick); save(true);
      if (mode === 'arcade') { G.ladder = arcadeLadder(pick); go('story', { cfg: pick, cos }); return; }
      if (mode === 'ta') { G.ladder = arcadeLadder(pick).slice(-Math.min(6, CFG.taLen || 6)); }
      nextFight();
    }
    function nextFight() {
      const R = G.run, pick = R.pick;
      let oc, boss = false, rival = false, stage, lvl, need = ROUNDS[opt.rounds - 1] || 2, time = TIMES[TIMES.indexOf(opt.time)] === undefined ? 60 : opt.time;
      if (R.mode === 'arcade' || R.mode === 'ta') {
        // a surprise challenger (the hidden fighter) halfway through a good arcade run
        const hid = (CFG.hidden || []).find(f => !SV.unl[f.id]);
        if (R.mode === 'arcade' && hid && R.step === 3 && G.cont === 0 && !R.chal) { R.chal = true; G.ladder.splice(3, 0, { cfg: hid, chal: true }); }
        const L = G.ladder[R.step]; oc = L.cfg; boss = !!L.boss; rival = !!L.rival; R.chal2 = !!L.chal;
        stage = boss ? STAGES.findIndex(s => s.boss) : homeStage(oc); if (stage < 0) stage = 0;
        if (boss && STAGES[stage].id && !SV.st[STAGES[stage].id]) { SV.st[STAGES[stage].id] = 1; save(); }
        lvl = lvlFor(R.step, boss);
        if (R.mode === 'ta') need = 1;
      } else if (R.mode === 'surv') {
        const pool = CFG.roster.filter(f => f.id !== pick.id); oc = pool[rnd() * pool.length | 0];
        if (R.wins > 0 && R.wins % 8 === 7 && CFG.boss) { oc = CFG.boss; boss = true; }
        const ok = STAGES.map((s, i) => i).filter(i => stageOK(i)); stage = ok[rnd() * ok.length | 0];
        lvl = clamp(DIFF[opt.diff].lv + R.wins * 0.12, 0, 4); need = 1; time = 60;
      }
      const cpuCos = rnd() < 0.3 ? 1 : 0;
      startMatch({ p: { cfg: pick, cos: R.cos }, c: { cfg: oc, cos: cpuCos, lvl }, stage, need, time, boss, rival, chal: R.chal2, carry: R.mode === 'surv' ? R.hp : null, music: boss ? 'boss' : null, skipIntro: R.mode === 'surv' && R.wins > 0 });
    }
    function matchOver(won) {
      const R = G.run, m = G.match;
      clearShow();
      if (G.mode === 'demo') { go('title'); return; }
      if (G.mode === 'vs' || G.mode === 'train') { go('vsres', { won }); return; }
      if (won) {
        R.wins++; SV.wins = (SV.wins | 0) + 1;
        if (R.mode === 'surv') { R.hp = Math.min(G.p.max, G.p.hp + 30); addScore(400); if (R.wins > (SV.sv | 0)) SV.sv = R.wins; if (R.wins >= 5) unlock('surv'); save(); go('next', { won: true }); return; }
        if (m.chal) { const hid = G.c.cfg; if (!SV.unl[hid.id]) { SV.unl[hid.id] = 1; save(); G.unl = (G.unl || []).concat([[(hid.n + ' JOINS THE FIGHT!'), hid]]); } G.ladder.splice(R.step, 1); go('next', { won: true, chal: true }); return; }
        R.step++;
        addScore(R.mode === 'ta' ? 1500 : 500);
        if (R.step >= G.ladder.length) { go(R.mode === 'arcade' ? 'ending' : 'taDone'); return; }
        go('next', { won: true });
      } else {
        if (m.chal) { G.ladder.splice(R.step, 1); go('next', { won: false, chal: true }); return; }
        if (R.mode === 'arcade') { go('continue'); return; }
        if (R.mode === 'surv') { finishRun('SURVIVAL OVER', `${R.pick.n} beat ${R.wins} fighter${R.wins === 1 ? '' : 's'} in a row`); return; }
        finishRun('TIME ATTACK FAILED', `Beaten by ${G.c.cfg.n}`);
      }
    }
    function unlock(why) {
      const out = G.unl = G.unl || [];
      const pick = G.run && G.run.pick;
      if (why === 'arcade') {
        for (const h of (CFG.hidden || [])) if (!SV.unl[h.id]) { SV.unl[h.id] = 1; out.push([h.n + ' IS NOW PLAYABLE!', h]); }
        if (CFG.boss && opt.diff >= 1 && !SV.unl[CFG.boss.id]) { SV.unl[CFG.boss.id] = 1; out.push([CFG.boss.n + ' IS NOW PLAYABLE!', CFG.boss]); }
        if (pick && pick.cos) { const want = opt.diff >= 2 ? Math.min(pick.cos.length, 2) : 1; if ((SV.cos[pick.id] | 0) < want) { SV.cos[pick.id] = want; out.push(['NEW COSTUME FOR ' + pick.n + '!', pick]); } }
        SV.end[pick.id] = 1;
        if (CFG.champSecret) K.secret(CFG.champSecret);
        if (CFG.bossSecret && pick.id !== (CFG.boss && CFG.boss.id)) K.secret(CFG.bossSecret);
      }
      if (why === 'surv') { const st = STAGES.find(s => s.lock === 'surv'); if (st && !SV.st[st.id]) { SV.st[st.id] = 1; out.push(['NEW STAGE: ' + st.n + '!', null]); } }
      save();
    }
    function cheat(o) { // (testing only, from the console)
      o = o || {};
      if (o.unlockAll) { ROST.forEach(f => { SV.unl[f.id] = 1; SV.cos[f.id] = 3; }); STAGES.forEach(s => { if (s.id) SV.st[s.id] = 1; }); save(); }
      if (o.win && G.c) { G.c.hp = 1; }
      if (o.lose && G.p) { G.p.hp = 1; }
      if (o.ko && G.c && G.fs === 'fight') { damage(G.c, G.p, 999); }
      if (o.die && G.p && G.fs === 'fight') { damage(G.p, G.c, 999); }
      if (o.step != null && G.run) { G.run.step = o.step; }
      if (o.cpu && G.p) { G.p.cpu = true; G.p.lvl = 3; }
      if (o.view) { G.view = o.view; go('viewer'); }
      if (o.go) go(o.go, o.goO);
      return { scr: G.scr, fs: G.fs, mode: G.mode, score: G.score, round: G.round, p: G.p && { id: G.p.cfg.id, hp: G.p.hp, st: G.p.st, wins: G.p.wins }, c: G.c && { id: G.c.cfg.id, hp: G.c.hp, st: G.c.st, wins: G.c.wins, lvl: G.c.lvl }, step: G.run && G.run.step, ladder: G.ladder.length };
    }

    // ================================================================ the camera
    function camFight(snap) {
      const p = G.p, c = G.c, mx = (p.x + c.x) / 2, mz = (p.z + c.z) / 2;
      let dx = c.x - p.x, dz = c.z - p.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
      let nx = -dz, nz = dx;
      const cx = G.cam.x - G.cam.lx, cz = G.cam.z - G.cam.lz;
      if (nx * cx + nz * cz < 0) { nx = -nx; nz = -nz; }
      const zoom = G.fs === 'ko' ? 0.78 : 1, dist0 = Math.max(DUEL ? 4.4 : 3.7, d * 1.05 + (DUEL ? 2.7 : 2.3)) * zoom;
      const hy = Math.max(p.y, c.y) * 0.4;
      const tx = mx + nx * dist0, tz = mz + nz * dist0, ty = (DUEL ? 1.6 : 1.4) + d * 0.07 + hy;
      const k = snap ? 1 : 0.1;
      G.cam.x = lerp(G.cam.x, tx, k); G.cam.z = lerp(G.cam.z, tz, k); G.cam.y = lerp(G.cam.y, ty, k);
      G.cam.lx = lerp(G.cam.lx, mx, snap ? 1 : 0.15); G.cam.lz = lerp(G.cam.lz, mz, snap ? 1 : 0.15); G.cam.ly = lerp(G.cam.ly, 0.95 + hy, snap ? 1 : 0.15);
    }
    function camOrbit(cx, cz, r, h, a, ly, k) { const tx = cx + Math.sin(a) * r, tz = cz + Math.cos(a) * r; k = k == null ? 1 : k; G.cam.x = lerp(G.cam.x, tx, k); G.cam.z = lerp(G.cam.z, tz, k); G.cam.y = lerp(G.cam.y, h, k); G.cam.lx = lerp(G.cam.lx, cx, k); G.cam.lz = lerp(G.cam.lz, cz, k); G.cam.ly = lerp(G.cam.ly, ly == null ? 1 : ly, k); }

    // ================================================================ the screens
    const okP = () => K.pressed('a') || K.pressed('start');
    const backP = () => K.pressed('b');
    const anyP = () => K.pressed('a') || K.pressed('b') || K.pressed('x') || K.pressed('y') || K.pressed('start');
    function nav(n, cur, keys) { const up = keys ? keys[0] : 'up', dn = keys ? keys[1] : 'down'; if (K.pressed(up)) { SFX.move(); return (cur + n - 1) % n; } if (K.pressed(dn)) { SFX.move(); return (cur + 1) % n; } return cur; }
    function go(name, o) { if (LOADS[name] && G.scr !== 'boot') G.load = LOADS[name]; G.scr = name; G.t = 0; G.o = o || {}; G.idle = 0; G.msgs = []; const s = SCR[name]; if (s && s.enter) s.enter(G.o); }
    function posing(f, pose, t) { if (!f) return; f.st = 'pose'; f.posePose = pose; mixP(f.pose, pose, 0.12, f.pose); const b = Math.sin(t * 0.08) * 0.02; f.pose[0] += b * 0.1; f.pose[1] += b * 0.1; }
    function showPair(a, b, ca, cb) {
      clearShow();
      showA = fighter(a, 'a', true, 0, ca || 0); showB = b ? fighter(b, 'b', true, 0, cb || 0) : null;
      showA.x = b ? -1.15 : 0; showA.z = 0; showA.face = b ? Math.PI / 2 : 0;
      if (showB) { showB.x = 1.15; showB.z = 0; showB.face = -Math.PI / 2; if (showB.cfg.id === showA.cfg.id) { removeFighter(showB); showB = fighter(b, 'b', true, 0, ((ca || 0) + 1) % ncos(b)); showB.x = 1.15; showB.face = -Math.PI / 2; } }
    }
    const randUnlocked = () => { const l = ROST.filter(f => unlocked(f) && !f.noPick || SV.unl[f.id]); return l[rnd() * l.length | 0]; };
    const LOADS = { vs: hi ? 40 : 55, story: hi ? 30 : 45, select: hi ? 26 : 40, ending: hi ? 36 : 50, demo: hi ? 30 : 45 };
    const MENU = [['ARCADE', 'arcade', 'Fight your way to the top. Story, rival and a boss.'], ['VERSUS CPU', 'vs', 'Pick both fighters and the stage. Just for fun.'], ['SURVIVAL', 'surv', 'One energy bar. How many can you beat?'], ['TIME ATTACK', 'ta', 'Six fights, one round each, against the clock.'], ['TRAINING', 'train', 'Practise combos on a dummy. Move lists in the pause menu.'], ['OPTIONS', 'opt', 'Difficulty, rounds, timer, music.'], ['HIGH SCORES', 'hi', 'The best runs on this disc.'], ['HOW TO PLAY', 'how', 'Controls, guarding, throws and tips.']];
    const SCR = {
      boot: { // the memory card / VMU check, then the title
        update() { const B = window.RmFight.booted = window.RmFight.booted || {}; if (B[CFG.title]) { go('title'); return; } if (G.t > 150 || (G.t > 30 && anyP())) { B[CFG.title] = 1; go('title'); } if (G.t === 40) SFX.move(); if (G.t === 100) SFX.ok(); },
      },
      title: {
        enter() { G.mode = null; clearFight(); setStage(CFG.titleStage || 0); const a = randUnlocked(); let b = randUnlocked(); if (b === a) b = ROST[(ROST.indexOf(a) + 1) % CFG.roster.length]; showPair(a, b); music('title'); },
        update() {
          posing(showA, showA.cfg.win2 ? PP(showA.cfg.win2) : showA.stance, G.t); posing(showB, showB.stance, G.t + 40);
          camOrbit(0, 0, 4.4, 1.35, Math.sin(G.t * 0.004) * 0.7, 1.05);
          if (anyP()) { SFX.ok(); go('menu'); return; }
          if (G.t > 60 * 11) go('hiscore', { attract: 1 });
        },
      },
      menu: {
        enter(o) { if (!showA) { const a = randUnlocked(); showPair(a, null); } G.pm = G.pm || 0; },
        update() {
          if (showA) posing(showA, showA.stance, G.t); if (showB) posing(showB, showB.stance, G.t + 40);
          camOrbit(showB ? 0 : -0.9, 0, 4.4, 1.35, Math.sin(G.t * 0.004) * 0.7 + 0.3, 1.05, 0.05);
          G.pm = nav(MENU.length, G.pm);
          if (backP()) { SFX.back(); go('title'); return; }
          if (G.t > 60 * 30) { go('title'); return; }
          if (okP()) {
            SFX.ok(); const k = MENU[G.pm][1];
            if (k === 'opt') go('options'); else if (k === 'hi') go('hiscore'); else if (k === 'how') go('how');
            else go('select', { mode: k, who: 1 });
          }
        },
      },
      options: {
        enter() { G.om = 0; },
        update() {
          camOrbit(0, 0, 4.4, 1.35, G.t * 0.003, 1.05, 0.05); if (showA) posing(showA, showA.stance, G.t); if (showB) posing(showB, showB.stance, G.t);
          const rows = 6; G.om = nav(rows, G.om);
          const d = K.pressed('right') ? 1 : K.pressed('left') ? -1 : 0;
          if (d || (okP() && G.om < 5)) {
            const s = d || 1; SFX.move();
            if (G.om === 0) opt.diff = (opt.diff + s + 4) % 4;
            if (G.om === 1) opt.rounds = ((opt.rounds - 1 + s + 3) % 3) + 1;
            if (G.om === 2) { const i = Math.max(0, TIMES.indexOf(opt.time)); opt.time = TIMES[(i + s + TIMES.length) % TIMES.length]; }
            if (G.om === 3) { opt.music = opt.music ? 0 : 1; music('title'); }
            if (G.om === 4) opt.shake = opt.shake ? 0 : 1;
            save(true);
          }
          if (backP() || (okP() && G.om === 5)) { SFX.back(); save(); go('menu'); }
        },
      },
      hiscore: {
        update() {
          camOrbit(0, 0, 5, 1.6, G.t * 0.004, 1.1, 0.05); if (showA) posing(showA, showA.stance, G.t); if (showB) posing(showB, showB.stance, G.t);
          if (G.t > 20 && anyP()) { SFX.back(); go(G.o.attract ? 'title' : 'menu'); return; }
          if (G.o.attract && G.t > 60 * 7) go('demo');
        },
      },
      how: {
        enter() { G.hp = 0; },
        update() {
          camOrbit(0, 0, 4.4, 1.35, G.t * 0.003, 1.05, 0.05); if (showA) posing(showA, showA.stance, G.t); if (showB) posing(showB, showB.stance, G.t);
          const n = CFG.how(K).length;
          if (K.pressed('right') || K.pressed('a')) { if (G.hp < n - 1) { G.hp++; SFX.move(); } else if (K.pressed('a')) { SFX.back(); go('menu'); } }
          if (K.pressed('left')) { G.hp = Math.max(0, G.hp - 1); SFX.move(); }
          if (backP() || K.pressed('start')) { SFX.back(); go('menu'); }
        },
      },
      demo: {
        enter() {
          G.mode = 'demo'; G.scoring = false; const a = randUnlocked(); let b = randUnlocked(); if (b === a) b = CFG.roster[(CFG.roster.indexOf(a) + 3) % CFG.roster.length];
          const ok = STAGES.map((s, i) => i).filter(i => stageOK(i));
          const st = ok[rnd() * ok.length | 0];
          startMatch({ p: { cfg: a, cpu: true, lvl: 2 }, c: { cfg: b, lvl: 2 }, stage: st, need: 1, time: 30, skipIntro: true });
          G.scr = 'fight'; G.t = 0; startRound(); G.fs = 'ready';
        },
      },
      select: {
        enter(o) {
          G.sel = G.sel || {}; G.sl = selList();
          if (o.who === 1) { G.sp = clamp(SV.last | 0, 0, G.sl.length - 1); G.scos = 0; G.p1 = null; } else { G.sp = (G.sl.indexOf(G.p1.cfg) + 1) % G.sl.length; G.scos = 0; }
          setStage(0, 'show'); clearShow(); clearFight(); selShow(); music('select');
          G.portraitsTodo = G.sl.slice();
          G.cam.x = 0; G.cam.z = 4; G.cam.y = 1.3; G.cam.lx = 0; G.cam.ly = 1; G.cam.lz = 0;
        },
        update() {
          const L = G.sl, n = L.length, cols = Math.min(n, CFG.selCols || 6);
          let m = G.sp;
          if (K.pressed('left')) m = (m + n - 1) % n; if (K.pressed('right')) m = (m + 1) % n;
          if (K.pressed('up')) m = (m - cols + n) % n; if (K.pressed('down')) m = (m + cols) % n;
          if (m !== G.sp) { G.sp = m; G.scos = 0; SFX.move(); selShow(); }
          const f = L[G.sp];
          if (K.pressed('x') && unlocked(f) || (K.pressed('y') && unlocked(f) && !DUEL)) { let c = G.scos; for (let i = 0; i < ncos(f); i++) { c = (c + 1) % ncos(f); if (cosOK(f, c)) break; } if (c !== G.scos) { G.scos = c; SFX.move(); selShow(); } }
          if (showA) { posing(showA, (G.t % 400) > 300 && showA.cfg.win2 ? PP(showA.cfg.win2) : showA.stance, G.t); showA.face = Math.sin(G.t * 0.012) * 0.5 + 0.35; }
          camOrbit(-1.05, 0, 3.9, 1.2, 0.2, 0.95, 0.08);
          if (backP()) { SFX.back(); if (G.o.who === 2) go('select', { mode: G.o.mode, who: 1 }); else go('menu'); return; }
          if (okP()) {
            if (!unlocked(f)) { SFX.err(); return; }
            SFX.pick(); say(f.n, 50, { col: '#ffd84a' });
            const pick = { cfg: f, cos: G.scos };
            if (G.o.mode === 'vs' || G.o.mode === 'train') { if (G.o.who === 1) { G.p1 = pick; go('select', { mode: G.o.mode, who: 2 }); } else { G.p2 = pick; go('stage', { mode: G.o.mode }); } return; }
            startRun(G.o.mode, f, G.scos);
          }
        },
      },
      stage: {
        enter() { const ok = STAGES.map((s, i) => i); G.ss = G.ss == null ? 0 : G.ss; if (G.o.mode === 'train') G.ss = -1; G.ssT = 0; clearShow(); setStageSafe(); G.dm = G.dm || 1; },
        update() {
          const n = STAGES.length;
          const move = K.pressed('right') ? 1 : K.pressed('left') ? -1 : 0;
          if (move) { let i = G.ss; for (let k = 0; k < n + 1; k++) { i += move; if (i < -1) i = n - 1; if (i >= n) i = -1; if (i === -1 && G.o.mode !== 'train') continue; if (i === -1 || stageOK(i)) break; } G.ss = i; G.ssT = 0; SFX.move(); }
          if (G.o.mode === 'vs' && (K.pressed('up') || K.pressed('down'))) { opt.diff = (opt.diff + (K.pressed('up') ? 1 : 3)) % 4; SFX.move(); save(); }
          if (G.o.mode === 'train' && (K.pressed('up') || K.pressed('down'))) { const D = ['stand', 'guard', 'crouch', 'random', 'cpu']; G.dm = (G.dm + (K.pressed('up') ? 1 : D.length - 1)) % D.length; SFX.move(); }
          if (++G.ssT === 14) setStageSafe();
          camOrbit(0, 0, 7, 2.4, G.t * 0.004, 1.2, 0.05);
          if (backP()) { SFX.back(); go('select', { mode: G.o.mode, who: 2 }); return; }
          if (okP()) {
            SFX.pick();
            const D = ['stand', 'guard', 'crouch', 'random', 'cpu'];
            G.mode = G.o.mode; G.scoring = false; G.score = 0; G.run = null;
            const st = G.ss === -1 ? 'train' : G.ss === -2 ? 0 : G.ss;
            if (G.o.mode === 'train') startMatch({ p: G.p1, c: { cfg: G.p2.cfg, cos: G.p2.cos, lvl: 1, dummy: D[G.dm] }, stage: st, need: 99, time: 0, skipIntro: true });
            else startMatch({ p: G.p1, c: { cfg: G.p2.cfg, cos: G.p2.cos, lvl: DIFF[opt.diff].lv }, stage: st, need: ROUNDS[opt.rounds - 1] || 2, time: opt.time || 0 });
          }
        },
      },
      story: {
        enter(o) { setStage(homeStage(o.cfg)); clearShow(); showA = fighter(o.cfg, 'a', true, 0, o.cos); showA.x = 0; showA.z = 0; showA.face = 0.3; music('story'); },
        update() {
          posing(showA, showA.cfg.win2 ? PP(showA.cfg.win2) : showA.stance, G.t);
          camOrbit(0.6, 0, 2.6 - Math.min(0.6, G.t * 0.002), 1.5, 0.5 + G.t * 0.0015, 1.25, 0.06);
          if (G.t > 20 && okP()) { SFX.ok(); nextFight(); }
          if (G.t > 60 * 14) nextFight();
        },
      },
      vs: {
        enter() { G.vsT = 0; music('vs'); SFX.vs(); },
        update() {
          const p = G.p, c = G.c;
          if (G.t === 1) { placeStart(); p.x = -1.4; c.x = 1.4; }
          posing(p, p.cfg.win2 ? PP(p.cfg.win2) : p.stance, G.t); posing(c, c.cfg.win2 ? PP(c.cfg.win2) : c.stance, G.t + 30);
          camOrbit(0, 0, 4.6, 1.35, -0.25 + G.t * 0.0025, 1.1, G.t < 2 ? 1 : 0.1);
          if (G.t > 200 || (G.t > 40 && okP())) { G.scr = 'fight'; G.t = 0; startRound(); }
        },
      },
      fight: { update: fightUpdate },
      next: {
        enter(o) { music(o.won ? 'win' : null); },
        update() {
          if (G.p) { stepFighter(G.p, G.c, blankInp()); stepFighter(G.c, G.p, blankInp()); }
          if (G.p) camOrbit(G.p.x, G.p.z, 3.0, 1.3, G.p.face + 0.4 + G.t * 0.004, 1.15, 0.05);
          if (G.t > 200 || (G.t > 50 && okP())) {
            if (G.unl && G.unl.length) { go('unlock', { then: 'next2' }); return; }
            nextFight();
          }
        },
      },
      next2: { enter() { nextFight(); } },
      continue: {
        enter() { G.contT = 10; K.music(null); SFX.err(); },
        update() {
          if (G.c) { stepFighter(G.c, G.p, blankInp()); camOrbit(G.c.x, G.c.z, 3.0, 1.3, G.c.face + 0.4, 1.15, 0.05); }
          if (G.t % 60 === 0 && G.t > 0) { G.contT--; SFX.tick(); }
          if (okP()) { G.cont++; G.score = Math.floor(G.score / 2); SFX.ok(); nextFight(); return; }
          if (G.contT <= 0 || backP()) finishRun('GAME OVER', `Beaten by ${G.c.cfg.n} (fight ${G.run.step + 1} of ${G.ladder.length})`);
        },
      },
      ending: {
        enter() {
          const f = G.run.pick; clearFight(); setStage(homeStage(f)); clearShow(); showA = fighter(f, 'a', true, 0, G.run.cos); showA.x = 0; showA.face = 0.4;
          addScore(4000); unlock('arcade'); music('ending'); G.endLines = (f.ending || ['And so the tournament was won.']).slice(); G.endT = 0;
        },
        update() {
          posing(showA, showA.cfg.endPose ? PP(showA.cfg.endPose) : (showA.cfg.win2 ? PP(showA.cfg.win2) : POSE.win), G.t);
          camOrbit(0.2, 0, 3.4 - Math.min(1.2, G.t * 0.0025), 1.2 + Math.min(0.5, G.t * 0.001), 0.9 - G.t * 0.0012, 1.2, 0.04);
          const total = G.endLines.join('').length * 2 + 260;
          if ((G.t > 60 && okP() && G.t < total - 40) ) G.t = total - 40;
          else if (G.t >= total && okP() || G.t > total + 300) {
            if (G.unl && G.unl.length) go('unlock', { then: 'champ' }); else go('champ');
          }
        },
      },
      champ: { enter() { finishRun('CHAMPION!', `${G.run.pick.n} won the ${CFG.title} tournament${G.cont ? ` (${G.cont} continue${G.cont > 1 ? 's' : ''})` : ' without a single continue'}!`); } },
      taDone: {
        enter() { const secs = Math.round(K.t - G.run.t0); G.taSecs = secs; addScore(Math.max(0, 600 - secs) * 18); if (!SV.ta || secs < SV.ta) { SV.ta = secs; save(); } music('win'); },
        update() { if (G.p) camOrbit(G.p.x, G.p.z, 3.0, 1.4, G.t * 0.01, 1.2, 0.05); if (G.t > 60 && okP() || G.t > 400) finishRun('TIME ATTACK CLEAR!', `${G.run.pick.n}: all fights in ${fmtT(G.taSecs)}`); },
      },
      unlock: {
        enter() { SFX.unlock(); G.ui = 0; },
        update() { if (G.t > 40 && okP()) { G.ui++; G.t = 0; if (G.ui >= G.unl.length) { G.unl = []; go(G.o.then || 'title'); } else SFX.unlock(); } },
      },
      vsres: {
        enter(o) { G.vm = 0; music(o.won ? 'win' : null); },
        update() {
          if (G.p) camOrbit(G.p.x, G.p.z, 3.4, 1.4, G.t * 0.006, 1.2, 0.05);
          const items = 4; G.vm = nav(items, G.vm);
          if (okP()) {
            SFX.ok();
            if (G.vm === 0) { const m = G.match; startMatch(Object.assign({}, m, { p: { cfg: G.p.cfg, cos: G.p.cos }, c: { cfg: G.c.cfg, cos: G.c.cos, lvl: G.c.lvl, dummy: G.c.dummy } })); }
            else if (G.vm === 1) go('select', { mode: G.mode, who: 1 });
            else if (G.vm === 2) go('stage', { mode: G.mode });
            else go('title');
          }
        },
      },
      name: {
        enter() { G.nm = (CFG.defaultName || 'JACK').split(''); while (G.nm.length < 4) G.nm.push(' '); G.ni = 0; music('win'); },
        update() {
          const A = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!';
          const c = G.nm[G.ni], i = A.indexOf(c);
          if (K.pressed('up')) { G.nm[G.ni] = A[(i + 1) % A.length]; SFX.move(); } if (K.pressed('down')) { G.nm[G.ni] = A[(i - 1 + A.length) % A.length]; SFX.move(); }
          if (K.pressed('right')) { G.ni = Math.min(3, G.ni + 1); SFX.move(); } if (K.pressed('left') || backP()) { G.ni = Math.max(0, G.ni - 1); SFX.move(); }
          if (K.pressed('a') && G.ni < 3) { G.ni++; SFX.ok(); }
          else if (K.pressed('start') || (K.pressed('a') && G.ni === 3)) {
            SFX.ok(); const n = G.nm.join('').trim() || 'JACK';
            SV.hi.push({ n, s: G.final.sc, c: G.run ? G.run.pick.id : '' }); SV.hi.sort((a, b) => b.s - a.s); SV.hi.length = Math.min(8, SV.hi.length); save();
            G.newHi = n; go('over');
          }
        },
      },
      viewer: { // (testing: one model, one pose, any camera angle: RmFight's console hook __<game>Dbg.cheat({view:{id, cos, move, t, ang, dist, h, ly, stage}}))
        enter() {
          const V = G.view; clearFight(); clearShow();
          if (V.stage != null) setStage(V.stage); else setStage(0, 'show');
          const cfg = byId[V.id] || ROST[0]; showA = fighter(cfg, 'a', true, 0, V.cos || 0); showA.x = 0; showA.z = 0; showA.face = 0;
          if (V.vs) { showB = fighter(byId[V.vs] || ROST[1], 'b', true, 0, 0); showB.x = 0; showB.z = DUEL ? 2.4 : 1.9; showB.face = Math.PI; }
          G.viewPose();
        },
        update() { const V = G.view; if (V.anim) { V.t = ((V.t || 0) + 1) % 120; G.viewPose(); } camOrbit(0, 0, V.dist || 2.6, V.h == null ? 1.2 : V.h, V.ang || 0, V.ly == null ? 1.0 : V.ly, 1); },
      },
      over: { enter() { G.done = true; K.music(null); K.over(G.final.sc, { title: G.final.title, text: G.final.text }); }, update() {} },
    };
    G.viewPose = () => {
      const V = G.view, f = showA; if (!f) return;
      let p = f.stance;
      if (V.move) { const mv = f.moves.ids[V.move] || f.moves.list.find(m => m.n === V.move); if (mv) p = evalKeys(moveKeys(f, mv), V.t == null ? mv.su : V.t, new Float32Array(NK)); }
      else if (V.pose) p = POSE[V.pose] || (V.pose === 'win2' && f.cfg.win2 ? PP(f.cfg.win2) : f.stance);
      f.pose.set(p); f.st = 'pose'; f.posePose = p; f.tilt = V.tilt || 0;
    };
    const CODES = [
      { seq: ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'], n: 'ALL FIGHTERS!', f() { ROST.forEach(f => { SV.unl[f.id] = 1; if (f.cos) SV.cos[f.id] = f.cos.length; }); STAGES.forEach(st => { if (st.id && st.lock) SV.st[st.id] = 1; }); save(); } },
      { seq: ['left', 'right', 'left', 'right', 'a', 'a', 'a'], n: 'BIG HEAD MODE', f() { SV.bighead = SV.bighead ? 0 : 1; save(true); return SV.bighead ? 'BIG HEAD MODE: ON' : 'BIG HEAD MODE: OFF'; } },
      { seq: ['down', 'down', 'down', 'x', 'x'], n: 'DISCO MODE', f() { SV.disco = SV.disco ? 0 : 1; save(true); return SV.disco ? 'DISCO TRAILS: ON' : 'DISCO TRAILS: OFF'; } },
    ];
    let codeBuf = [];
    function cheatInput() {
      if (G.scr !== 'title' && G.scr !== 'menu') { codeBuf = []; return false; }
      for (const b of ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y']) if (K.pressed(b)) { codeBuf.push(b); if (codeBuf.length > 12) codeBuf.shift(); }
      for (const c of CODES) { const n = c.seq.length; if (codeBuf.length >= n && codeBuf.slice(-n).join() === c.seq.join()) { codeBuf = []; const msg = c.f() || c.n; SFX.unlock(); G.cheatMsg = { text: msg, t: 150 }; return true; } }
      return false;
    }
    function setStageSafe() { if (G.ss === -1) setStage(0, 'train'); else setStage(G.ss); }
    function selShow() {
      const f = G.sl[G.sp]; removeFighter(showA); showA = null;
      if (!f || !unlocked(f)) return;
      showA = fighter(f, 'a', true, 0, G.scos); showA.x = 0; showA.z = 0; showA.face = 0.35;
    }
    const fmtT = s => Math.floor(s / 60) + "'" + String(s % 60).padStart(2, '0') + '"';

    // ---- the fight itself
    function fightUpdate() {
      const p = G.p, c = G.c;
      if (G.paused) { pauseUpdate(); return; }
      if (K.pressed('start') && (G.fs === 'fight' || G.fs === 'ready' || G.fs === 'intro')) {
        if (G.mode === 'demo') { go('title'); return; }
        G.paused = true; G.pm = 0; G.pmode = 'menu'; SFX.pause(); K.music(null); return;
      }
      if (G.mode === 'demo' && anyP()) { go('title'); return; }
      G.combo.t = Math.max(0, G.combo.t - 1); G.hype = Math.max(0.15, G.hype - 0.003);
      for (const f of [p, c]) { if (f.dmgLag > f.hp) { if (f.st === 'idle' || f.st === 'walk' || f.st === 'guard' || f.st === 'crouch' || f.st === 'run' || G.fs !== 'fight') f.dmgLag = Math.max(f.hp, f.dmgLag - 0.6); } else f.dmgLag = f.hp; }
      switch (G.fs) {
        case 'intro': { // the camera swings round each fighter in turn
          const who = G.t < 70 ? p : c; posing(p, p.stance, G.t); posing(c, c.stance, G.t);
          const a = who.face + (who === p ? -0.75 : 0.75) + (G.t % 70) * 0.006 * (who === p ? 1 : -1);
          camOrbit(who.x, who.z, 2.2 + (G.t % 70) * 0.01, 1.2 + (G.t % 70) * 0.004, a, 1.25, (G.t % 70) < 2 ? 1 : 0.12);
          if (G.t === 1) SFX.intro(); if (G.t === 70) SFX.intro();
          if (G.t > 140 || (G.t > 10 && okP())) { G.fs = 'ready'; G.t = 0; for (const f of [p, c]) { f.st = 'idle'; } G.cam.x = 0; G.cam.z = 6; G.cam.lx = 0; G.cam.lz = 0; camFight(true); }
          return;
        }
        case 'ready': {
          simStep(); camFight();
          if (G.t === 2) { sayC(G.round === (G.match.need || 2) * 2 - 1 && G.round > 1 ? 'FINAL ROUND' : G.mode === 'train' ? 'TRAINING' : 'ROUND ' + G.round, 70, { col: '#ffd84a' }); SFX.round(); }
          if (G.t === 72) { sayC(CFG.fightWord || 'FIGHT!', 50, { col: '#ff5a3a', grow: true }); SFX.fight(); }
          if (G.t > 80) { G.fs = 'fight'; G.t = 0; }
          return;
        }
        case 'fight': {
          if (G.freeze > 0) { G.freeze--; camFight(); return; }
          simStep(); camFight();
          if (G.fs === 'fight' && isFinite(G.timer) && G.mode !== 'train') {
            G.timer -= 1 / 60;
            if (G.timer <= 0) {
              G.timer = 0; const pr = p.hp / p.max, cr = c.hp / c.max;
              G.winner = Math.abs(pr - cr) < 0.001 ? null : pr > cr ? p : c; G.draw = !G.winner; G.endWhy = 'time'; sayC(G.draw ? 'DRAW' : 'TIME UP', 100, { col: '#ffd84a' }); G.fs = 'ko'; G.t = 0; G.slow = 0; G.koAt = G.frame; G.koF = null; SFX.timeUp();
            }
          }
          if (G.mode === 'train') { for (const f of [p, c]) if (isFree(f.st) && f.hp < f.max && f.comboN === 0) f.hp = Math.min(f.max, f.hp + 1.2); }
          if (G.shake > 0) G.shake *= 0.85;
          return;
        }
        case 'ko': {
          if (G.freeze > 0) { G.freeze--; return; }
          G.slowAcc += G.slow > 0 ? 0.3 : 1; if (G.slow > 0) G.slow--;
          while (G.slowAcc >= 1) { G.slowAcc -= 1; simStep(); }
          camFight(); if (G.shake > 0) G.shake *= 0.85;
          if (G.t > 150) {
            if (G.endWhy !== 'time' && G.rec.length > 60 && G.mode !== 'demo' && G.koF) startReplay(); else endRound();
          }
          return;
        }
        case 'replay': replayUpdate(); return;
        case 'roundEnd': {
          stepFighter(p, c, blankInp()); stepFighter(c, p, blankInp());
          const w = G.winner || p;
          if (G.winner) camOrbit(w.x, w.z, 3.0, 1.35, w.face + 0.5 + G.t * 0.004, 1.15, G.t < 2 ? 1 : 0.06);
          if (G.t === 40 && G.winner) SFX.cheer(1);
          if (G.t > 220 || (G.t > 60 && okP())) afterRound();
          return;
        }
      }
    }
    // ---- the action replay: the last few seconds again, slowly, from a fancy angle
    function startReplay() {
      const i0 = Math.max(0, G.rec.findIndex(r => r.f >= G.koAt - 110)), i1 = G.rec.length - 1;
      G.replay = { i: i0, i0, i1, sp: 0.42, ang: rnd() < 0.5 ? 1 : -1 };
      G.fs = 'replay'; G.t = 0; FXA.clear(); FXN.clear();
    }
    function replayUpdate() {
      const R = G.replay, prev = R.i | 0;
      R.i = Math.min(R.i1, R.i + R.sp);
      const cur = R.i | 0;
      for (let k = prev + 1; k <= cur; k++) { const fr = G.rec[k].f; for (const e of G.recEv) if (e.f === fr) { v3a.set(e.x, e.y, e.z); burst(v3a, e.col, e.heavy ? 12 : 6, e.heavy ? 0.12 : 0.08); FXA.spawn({ x: e.x, y: e.y, z: e.z, life: 10, size: e.heavy ? 1.6 : 1, size1: 0.3, col: '#fff', cell: 1 }); if (!e.blocked) SFX.hit({ kind: DUEL ? 'w' : 'p' }, e.heavy, DUEL); } }
      const s = G.rec[cur], L = G.koF === G.p ? s.p : s.c;
      camOrbit(L.x, L.z, 2.4 + G.t * 0.004, 0.7 + G.t * 0.003, L.face + R.ang * (1.4 + G.t * 0.006), 1.0, G.t < 2 ? 1 : 0.08);
      if (R.i >= R.i1 || (G.t > 30 && anyP())) { G.replay = null; G.fs = 'ko'; G.t = 151; endRound(); }
    }
    // ---- the pause menu (and the move list, and the training settings)
    function pauseItems() {
      const it = [['RESUME', 'resume'], ['MOVE LIST', 'moves']];
      if (G.mode === 'train') { const D = { stand: 'STAND STILL', guard: 'GUARD ALL', crouch: 'CROUCH', random: 'RANDOM GUARD', cpu: 'FIGHT BACK' }; it.push(['DUMMY: ' + D[G.c.dummy || 'stand'], 'dummy'], ['RESET POSITIONS', 'reset']); }
      else it.push(['RESTART MATCH', 'restart']);
      it.push([G.scoring && G.score > 0 ? 'QUIT (END THE RUN)' : 'QUIT TO TITLE', 'quit']);
      return it;
    }
    function pauseUpdate() {
      if (G.pmode === 'moves') { const n = movesFor(G.p).length; if (K.pressed('down')) G.ml = Math.min(Math.max(0, n - 10), (G.ml | 0) + 1); if (K.pressed('up')) G.ml = Math.max(0, (G.ml | 0) - 1); if (backP() || K.pressed('start') || K.pressed('a')) { G.pmode = 'menu'; SFX.back(); } return; }
      const it = pauseItems(); G.pm = nav(it.length, G.pm);
      if (K.pressed('start') || backP()) { G.paused = false; SFX.pause(); music(G.match.music || (STAGES[stageIdx] && STAGES[stageIdx].music) || 'fight'); return; }
      if (okP()) {
        const k = it[G.pm][1]; SFX.ok();
        if (k === 'resume') { G.paused = false; music(G.match.music || (STAGES[stageIdx] && STAGES[stageIdx].music) || 'fight'); }
        else if (k === 'moves') { G.pmode = 'moves'; G.ml = 0; }
        else if (k === 'dummy') { const D = ['stand', 'guard', 'crouch', 'random', 'cpu']; G.c.dummy = D[(D.indexOf(G.c.dummy || 'stand') + 1) % D.length]; G.c.cpu = true; if (G.c.dummy === 'cpu') G.c.lvl = 1; }
        else if (k === 'reset') { G.paused = false; placeStart(); G.p.hp = G.p.max; G.c.hp = G.c.max; camFight(true); }
        else if (k === 'restart') { G.paused = false; const m = G.match; G.p.wins = G.c.wins = 0; G.round = 1; m.skipIntro = true; G.score = G.score0 | 0; startRound(); }
        else if (k === 'quit') { G.paused = false; if (G.scoring && G.score > 0) finishRun('YOU GAVE UP', `${G.run.pick.n}, fight ${(G.run.step | 0) + 1}`); else { clearFight(); go('title'); } }
      }
    }
    function movesFor(f) {
      const L = f.moves.list.filter(m => !m.air && !m.hide), out = [];
      const ins = m => (m.dir ? { f: '→', b: '←', d: '↓', u: '↑' }[m.dir] + '+' : '') + K.label(m.btn);
      const seen = {};
      for (const m of L.filter(x => x.sp)) out.push([m.n, ins(m), 'sp', m.ht]);
      for (const m of L.filter(x => !x.sp && !x.chainOnly)) { const key = ins(m); if (seen[key]) continue; seen[key] = 1; out.push([m.n, key, '', m.ht]); }
      for (const m of L) if (m.next) for (const b in m.next) { const n2 = f.moves.ids[m.next[b]]; if (n2) out.push([n2.n, ins(m) + ',' + K.label(b), 'str', n2.ht]); }
      f.moves.thr.forEach(t => out.push([t.n || 'THROW', t.btns.map(b => K.label(b)).join('+'), 'thr', 't']));
      return out;
    }

    // ================================================================ drawing the 3D
    const yAxisV = new T.Vector3();
    function placeModel(f, s) {
      if (!f) return;
      s = s || f; const m = f.m;
      applyPose(m, s.pose, s.face);
      const tilt = s.tilt || 0, LLm = m.LL, sn = Math.sin(tilt), cs = Math.cos(tilt), lie = Math.min(1, Math.abs(sn));
      const pelY = (s.st === 'ringout' ? s.y : Math.max(0, s.y)) + (stage.floorY || 0) + LLm - (LLm - 0.2) * lie;
      const yaw = m.mesh.rotation.y;
      m.mesh.rotation.order = 'YXZ'; m.mesh.rotation.x = tilt;
      m.mesh.position.set(s.x - Math.sin(yaw) * LLm * sn, pelY - LLm * cs, s.z - Math.cos(yaw) * LLm * sn);
      m.mesh.visible = !s.hide;
      m.B.head.scale.setScalar(SV.bighead ? 1.7 : 1);
      // secondary motion: capes and hair swing with speed
      const sp = Math.hypot(f.vx || 0, f.vz || 0), air = (f.st === 'air' || f.st === 'jump') ? 0.6 : 0;
      m.B.cape.rotation.x = lerp(m.B.cape.rotation.x, 0.12 + Math.min(0.9, sp * 7) + air + Math.sin(G.frame * 0.09) * 0.04, 0.15);
      m.B.hair.rotation.x = lerp(m.B.hair.rotation.x, Math.min(0.6, sp * 5) + air * 0.5 - (f.vy || 0) * 3, 0.2); m.B.hair2.rotation.x = lerp(m.B.hair2.rotation.x, m.B.hair.rotation.x * 0.8 + Math.sin(G.frame * 0.12) * 0.05, 0.15);
      const sh = m.shadow, offRing = stage.ring && (stage.round ? Math.hypot(s.x, s.z) > stage.ring + 0.3 : (Math.abs(s.x) > stage.ring + 0.3 || Math.abs(s.z) > stage.ring + 0.3));
      sh.visible = !s.hide && s.st !== 'ringout' && !offRing && !stage.noShadow;
      if (!hi) { const k = 1 - Math.min(0.6, Math.max(0, s.y) * 0.35); sh.position.set(s.x - Math.sin(yaw) * LLm * sn * 0.4, (stage.floorY || 0) + 0.025, s.z - Math.cos(yaw) * LLm * sn * 0.4); sh.scale.set(k * (1 + lie * 0.5) * (f.cfg.body && f.cfg.body.w || 1), k * (1 + lie * 1.3), 1); sh.rotation.z = -yaw; }
    }
    function trailStep(f, live) {
      const tr = f.trail;
      let on = false, nm = null;
      if (live) { on = f.st === 'atk' && f.mv && f.mv.trail && f.t >= f.mv.su - 3 && f.t < f.mv.su + f.mv.ac + 3; nm = on ? f.mv.trail : null; }
      else { on = live === false && f._snap && f._snap.act && f._snap.mv; nm = on ? f._snap.mv : null; }
      if (!on && SV.disco && f.st === 'atk' && f.mv) { on = true; nm = DUEL && f.mv.kind === 'w' ? 'wpn' : 'hdR'; }
      if (on && f.m.anchor[nm]) { anchorPos(f, nm, 0, v3a); anchorPos(f, nm, 1, v3b); tr.push(v3a, v3b); if (nm === 'wpn' && f.m.anchor.wpn2 && f.mv && f.mv.both) {} }
      else tr.fade();
      tr.write(SV.disco ? '#' + new T.Color().setHSL((G.frame * 0.01) % 1, 1, 0.6).getHexString() : DUEL ? ((f.cfg.weapon && f.cfg.weapon.trail) || '#9ad8ff') : (f.cfg.trail || CFG.trailCol || '#ffd27a'), DUEL);
    }
    let lastT = 0;
    function draw() {
      const rep = G.fs === 'replay' && G.replay && G.scr === 'fight';
      let sp = null, sc = null;
      if (rep) { const R = G.replay, i = R.i | 0, j = Math.min(R.i1, i + 1), t = R.i - i, A = G.rec[i], B = G.rec[j]; const mixS = (a, b) => { const o = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), face: a.face + wrapA(b.face - a.face) * t, tilt: lerp(a.tilt, b.tilt, t), hide: a.hide, st: a.st, pose: mixP(a.pose, b.pose, t, new Float32Array(NK)), act: a.act, mv: a.mv }; return o; }; sp = mixS(A.p, B.p); sc = mixS(A.c, B.c); if (G.p) G.p._snap = sp; if (G.c) G.c._snap = sc; }
      for (const [f, s] of [[G.p, sp], [G.c, sc], [showA, null], [showB, null]]) if (f) { placeModel(f, s); f.m.mesh.updateMatrixWorld(true); }
      for (const f of [G.p, G.c]) if (f) trailStep(f, rep ? false : true);
      // the camera (with a little shake)
      const cam = S3.cam, shk = opt.shake && G.shake > 0.3 ? G.shake * 0.012 : 0;
      cam.position.set(G.cam.x + (rnd() - 0.5) * shk, G.cam.y + (rnd() - 0.5) * shk, G.cam.z);
      cam.lookAt(G.cam.lx, G.cam.ly, G.cam.lz);
      if (cam.fov !== G.cam.fov) { cam.fov = G.cam.fov; cam.updateProjectionMatrix(); }
      FXA.write(); FXN.write();
      if (G.portraitsTodo && G.portraitsTodo.length) portraitsStep();
      if (G.scr === 'viewer' && G.view && G.view.sheet) { sheet(); hud(); return; }
      S3.render();
      hud();
    }
    const HUDS_EXTRA = {};
    // ---- (testing) a contact sheet: one model from six angles in one frame
    function sheet() {
      const V = G.view, R = S3.ren, cam = S3.cam, cols = 3, rows = 2, tw = Math.floor(W / cols), th = Math.floor(H / rows);
      const hgt = (showA && showA.m.H || 1) * 0.9, angs = V.angles || [0, 0.75, 1.57, 2.36, 3.14, 'face'];
      R.autoClear = false; R.setScissorTest(true); R.setScissor(0, 0, W, H); R.setViewport(0, 0, W, H); R.clear();
      angs.forEach((a, i) => {
        const x = (i % cols) * tw, y = H - th - Math.floor(i / cols) * th;
        R.setViewport(x, y, tw, th); R.setScissor(x, y, tw, th); R.clear();
        cam.aspect = tw / th; cam.fov = 34; cam.updateProjectionMatrix();
        if (a === 'face') { const hp = new T.Vector3(); showA.m.B.head.getWorldPosition(hp); cam.position.set(hp.x + 0.25, hp.y + 0.05, hp.z + 0.9); cam.lookAt(hp.x, hp.y - 0.02, hp.z); }
        else { const d = V.dist || 3.4; cam.position.set(Math.sin(a) * d, hgt + (V.h || 0.1), Math.cos(a) * d); cam.lookAt(0, hgt - 0.05, 0); }
        R.render(S3.scene, cam);
      });
      R.setScissorTest(false); R.setViewport(0, 0, W, H); R.autoClear = true; cam.aspect = W / H; cam.fov = G.cam.fov; cam.updateProjectionMatrix();
    }
    HUDS_EXTRA.viewer = () => { const V = G.view; tx(`${V.id}/${V.cos || 0} ${V.move || V.pose || 'stance'}`, U(4), U(4), { col: '#ff0', k: hi ? 0.7 : 1 }); };
    // ---- portraits: each fighter's head and shoulders, rendered from their real model into a little canvas
    const PORT = {}, PW = hi ? 132 : 66, PH = hi ? 156 : 78;
    let pScene = null, pCam = null;
    function portraitsStep() {
      const n = Math.min(3, G.portraitsTodo.length);
      for (let i = 0; i < n; i++) { const f = G.portraitsTodo.shift(); for (let c = 0; c < ncos(f); c++) if (!PORT[f.id + '/' + c] && (c === 0 || cosOK(f, c))) portrait(f, c); }
    }
    function portrait(cfg, cos) {
      const key = cfg.id + '/' + cos; if (PORT[key]) return PORT[key];
      if (!pScene) {
        pScene = new T.Scene(); pScene.add(new T.HemisphereLight(0xffffff, 0x404050, 0.8)); const key2 = new T.DirectionalLight(0xffffff, 0.9); key2.position.set(0.6, 0.8, 1); pScene.add(key2); const rm = new T.DirectionalLight(0xa0c0ff, 0.7); rm.position.set(-0.8, 0.5, -1); pScene.add(rm);
        pCam = new T.PerspectiveCamera(26, PW / PH, 0.1, 30);
      }
      const m = getModel(cfg, cos, 'port');
      const pose = cfg.portPose ? PP(cfg.portPose, DUEL ? POSE.bstance : POSE.stance) : (cfg.stance ? PP(cfg.stance, DUEL ? POSE.bstance : POSE.stance) : (DUEL ? POSE.bstance : POSE.stance));
      applyPose(m, pose, -0.35); m.mesh.position.set(0, 0, 0); m.mesh.rotation.x = 0; m.mesh.visible = true;
      const par = m.mesh.parent; pScene.add(m.mesh); m.mesh.updateMatrixWorld(true);
      const hp = new T.Vector3(); m.B.head.getWorldPosition(hp);
      pScene.background = new T.Color(shade(m.C.top2 || m.C.top, 0.35));
      pCam.position.set(hp.x + 0.25, hp.y + 0.02, hp.z + 1.55); pCam.lookAt(hp.x, hp.y - 0.12, hp.z);
      const R = S3.ren; R.setViewport(0, 0, PW, PH); R.setScissor(0, 0, PW, PH); R.setScissorTest(true);
      R.render(pScene, pCam);
      const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH; const c2 = cv.getContext('2d');
      try { c2.drawImage(K.cv, 0, H - PH, PW, PH, 0, 0, PW, PH); } catch (e) {}
      R.setScissorTest(false); R.setViewport(0, 0, W, H);
      pScene.remove(m.mesh); if (par) par.add(m.mesh);
      // a little vignette and a border
      const gr = c2.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0.6, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); c2.fillStyle = gr; c2.fillRect(0, 0, PW, PH);
      return PORT[key] = cv;
    }

    // ================================================================ the HUD (a 2D canvas over the 3D)
    const U = n => n * fk;
    const FONT_DC = '"Trebuchet MS", Verdana, Tahoma, Arial, sans-serif';
    function tx(s, x, y, o) {
      o = o || {}; s = String(s); const k = o.k || 1, col = o.col || '#fff';
      if (!hi) {
        const kk = Math.max(1, Math.round(k)), w = F.width(s, kk), xx = o.al === 'c' ? x - w / 2 : o.al === 'r' ? x - w : x;
        if (o.a != null) g.globalAlpha = o.a;
        F.draw(g, s, xx, y, col, kk, o.sh === false ? null : (o.sh || '#000')); g.globalAlpha = 1; return w;
      }
      const px = Math.round(8 * k * fk * 1.12);
      g.font = `${o.it ? 'italic ' : ''}bold ${px}px ${FONT_DC}`; g.textBaseline = 'top'; g.textAlign = o.al === 'c' ? 'center' : o.al === 'r' ? 'right' : 'left';
      if (o.a != null) g.globalAlpha = o.a;
      if (o.sh !== false) { g.fillStyle = o.sh || 'rgba(0,0,0,.8)'; g.fillText(s, x + Math.max(1, px * 0.08), y + Math.max(1, px * 0.08)); }
      g.fillStyle = col; g.fillText(s, x, y); g.globalAlpha = 1;
      return g.measureText(s).width;
    }
    const F = K.font;
    const bigC = {};
    function bigText(s, k, grad) { // chunky gradient lettering with a black outline (cached)
      const key = s + '|' + k + '|' + grad.join(','); if (bigC[key]) return bigC[key];
      const cv = document.createElement('canvas'), c = cv.getContext('2d');
      if (!hi) {
        const kk = Math.max(1, Math.round(k)), w = F.width(s, kk) + kk * 4, h = 8 * kk + kk * 4; cv.width = w; cv.height = h;
        const t = document.createElement('canvas'); t.width = w; t.height = h; const tc = t.getContext('2d');
        F.draw(tc, s, kk * 2, kk * 2, '#fff', kk);
        tc.globalCompositeOperation = 'source-in'; const gr = tc.createLinearGradient(0, kk * 2, 0, kk * 2 + 7 * kk); grad.forEach((c2, i) => gr.addColorStop(i / Math.max(1, grad.length - 1), c2)); tc.fillStyle = gr; tc.fillRect(0, 0, w, h);
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1], [2, 2], [1, 2], [2, 1]]) F.draw(c, s, kk * 2 + dx * Math.max(1, kk / 2), kk * 2 + dy * Math.max(1, kk / 2), '#000', kk);
        c.drawImage(t, 0, 0);
      } else {
        const px = Math.round(8 * k * fk * 1.2); c.font = `italic 900 ${px}px "Arial Black", Impact, ${FONT_DC}`;
        const w = Math.ceil(c.measureText(s).width + px * 0.6), h = Math.ceil(px * 1.5); cv.width = w; cv.height = h;
        c.font = `italic 900 ${px}px "Arial Black", Impact, ${FONT_DC}`; c.textBaseline = 'middle'; c.textAlign = 'center';
        c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = px * 0.25; c.lineJoin = 'round'; c.lineWidth = px * 0.16; c.strokeStyle = '#000'; c.strokeText(s, w / 2, h / 2); c.shadowBlur = 0;
        const gr = c.createLinearGradient(0, h / 2 - px / 2, 0, h / 2 + px / 2); grad.forEach((c2, i) => gr.addColorStop(i / Math.max(1, grad.length - 1), c2)); c.fillStyle = gr; c.fillText(s, w / 2, h / 2);
        c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, 0, w, h * 0.42);
      }
      return bigC[key] = cv;
    }
    function big(s, cx, cy, k, grad, a, sc) { const cv = bigText(s, k, grad || ['#fff8c0', '#ffd040', '#e05a10']); const w = cv.width * (sc || 1), h = cv.height * (sc || 1); g.save(); g.globalAlpha = a == null ? 1 : a; g.imageSmoothingEnabled = hi; g.drawImage(cv, Math.round(cx - w / 2), Math.round(cy - h / 2), Math.round(w), Math.round(h)); g.restore(); }
    let logoCv = null;
    function logo(cx, cy) { // the title logo: extruded, chrome-y, a bit shiny
      if (!logoCv) {
        const sz = (CFG.logoSize || 40) * fk, cv = document.createElement('canvas'), c = cv.getContext('2d');
        const font = `italic 900 ${sz}px "Arial Black", Impact, Arial, sans-serif`; c.font = font;
        const w = Math.ceil(c.measureText(CFG.title).width + sz), h = Math.ceil(sz * 1.6); cv.width = w; cv.height = h;
        c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle';
        const depth = Math.round(sz * 0.12);
        for (let i = depth; i > 0; i--) { c.fillStyle = shade(CFG.logoDeep || '#5a1000', 0.5 + 0.5 * (1 - i / depth)); c.fillText(CFG.title, w / 2 + i * 0.6, h / 2 + i); }
        c.lineWidth = Math.max(2, sz * 0.08); c.strokeStyle = '#000'; c.lineJoin = 'round'; c.strokeText(CFG.title, w / 2, h / 2);
        const gr = c.createLinearGradient(0, h / 2 - sz / 2, 0, h / 2 + sz / 2); CFG.logoGrad.forEach((c2, i) => gr.addColorStop(i / (CFG.logoGrad.length - 1), c2)); c.fillStyle = gr; c.fillText(CFG.title, w / 2, h / 2);
        c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(0, 0, w, h / 2 - sz * 0.08);
        logoCv = cv;
      }
      const sh = (G.frame % 240) / 240;
      g.save(); g.imageSmoothingEnabled = hi; g.drawImage(logoCv, Math.round(cx - logoCv.width / 2), Math.round(cy - logoCv.height / 2));
      // a glint that sweeps across
      g.globalCompositeOperation = 'lighter'; const gx = cx - logoCv.width / 2 + sh * logoCv.width * 1.6 - logoCv.width * 0.3;
      const gr = g.createLinearGradient(gx - U(10), 0, gx + U(10), 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr;
      g.beginPath(); g.rect(cx - logoCv.width / 2, cy - logoCv.height * 0.3, logoCv.width, logoCv.height * 0.6); g.fill(); g.restore();
    }
    function panel(x, y, w, h, o) {
      o = o || {};
      if (!hi) { g.fillStyle = o.bg || 'rgba(8,8,20,.78)'; g.fillRect(x, y, w, h); g.fillStyle = o.edge || CFG.panelEdge || '#c08a20'; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 1, y + 1, w - 2, 1); return; }
      const r = U(5); g.save(); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, o.bg2 || 'rgba(40,60,120,.82)'); gr.addColorStop(1, o.bg || 'rgba(10,16,40,.86)'); g.fillStyle = gr; g.fill();
      g.lineWidth = U(1); g.strokeStyle = o.edge || CFG.panelEdge || 'rgba(160,200,255,.8)'; g.stroke(); g.restore();
    }
    function bar(x, y, w, h, frac, lag, col, right, low) {
      if (!hi) {
        g.fillStyle = '#000'; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = '#8a8a8a'; g.fillRect(x - 1, y - 1, w + 2, 1); g.fillStyle = '#3a3a3a'; g.fillRect(x - 1, y + h, w + 2, 1);
        g.fillStyle = '#2a0808'; g.fillRect(x, y, w, h);
        const lw = Math.max(0, w * lag), fw = Math.max(0, w * frac);
        g.fillStyle = '#e02020'; g.fillRect(right ? x + w - lw : x, y, lw, h);
        const c = low && (G.frame >> 3) % 2 ? '#ff6a2a' : col; g.fillStyle = c; g.fillRect(right ? x + w - fw : x, y, fw, h);
        g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(right ? x + w - fw : x, y, fw, 2); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(right ? x + w - fw : x, y + h - 2, fw, 2);
        for (let i = 1; i < 10; i++) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + (w * i / 10 | 0), y, 1, h); }
        return;
      }
      g.save();
      const sk = U(6), path = (xx, ww) => { g.beginPath(); if (right) { g.moveTo(xx + sk, y); g.lineTo(xx + ww, y); g.lineTo(xx + ww - sk, y + h); g.lineTo(xx, y + h); } else { g.moveTo(xx, y); g.lineTo(xx + ww - sk, y); g.lineTo(xx + ww, y + h); g.lineTo(xx + sk, y + h); } g.closePath(); };
      path(x - U(2), w + U(4)); g.fillStyle = 'rgba(0,0,0,.7)'; g.fill(); g.lineWidth = U(1); g.strokeStyle = 'rgba(255,255,255,.7)'; g.stroke();
      const lw = w * lag, fw = w * frac;
      if (lw > 0) { path(right ? x + w - lw : x, lw); g.fillStyle = '#ff3a3a'; g.fill(); }
      if (fw > 0) { path(right ? x + w - fw : x, fw); const gr = g.createLinearGradient(0, y, 0, y + h); const c = low && (G.frame >> 3) % 2 ? '#ff8a3a' : col; gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, c); gr.addColorStop(1, shade(c, 0.6)); g.fillStyle = gr; g.fill(); }
      g.restore();
    }
    function port(cfg, cos, x, y, w, h, flip) {
      const cv = PORT[cfg.id + '/' + (cos || 0)] || PORT[cfg.id + '/0'];
      g.save(); g.imageSmoothingEnabled = hi;
      if (cv) { if (flip) { g.translate(x + w, y); g.scale(-1, 1); g.drawImage(cv, 0, 0, w, h); } else g.drawImage(cv, x, y, w, h); }
      else { g.fillStyle = shade(cfg.col.top, 0.5); g.fillRect(x, y, w, h); g.fillStyle = cfg.col.skin; g.fillRect(x + w * 0.3, y + h * 0.2, w * 0.4, h * 0.45); }
      g.restore();
    }
    const proj = new T.Vector3();
    function toScreen(x, y, z) { proj.set(x, y, z).project(S3.cam); return [(proj.x + 1) / 2 * W, (1 - proj.y) / 2 * H, proj.z]; }
    function sysHud() {
      if (G.scr === 'boot' && !(window.RmFight.booted || {})[CFG.title]) {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        const lines = hi ? ['VISUAL MEMORY GIZMO', 'CONTROLLER A, SLOT 1', '', G.t < 40 ? 'CHECKING...' : SV.n ? CFG.title + ' FILE FOUND (8 BLOCKS)' : 'NO ' + CFG.title + ' FILE. ONE WILL BE MADE.', G.t > 100 ? 'OK!' : '']
          : ['MEMORY CARD CHECK', 'MEMORY CARD (SLOT 1)', '', G.t < 40 ? 'CHECKING...' : SV.n ? 'LOADING ' + CFG.title + ' DATA (1 BLOCK)' : 'NO SAVE DATA. ONE WILL BE MADE (1 BLOCK).', G.t > 100 ? 'COMPLETE.' : ''];
        lines.forEach((l, i) => tx(l, W / 2, H * 0.32 + i * U(13), { col: i === 0 ? '#ffd84a' : '#ddd', al: 'c', k: i === 0 && !hi ? 2 : 1 }));
        cardIcon(W / 2 - U(14), H * 0.12, G.t > 40 && G.t < 100 && (G.t >> 3) % 2);
        return true;
      }
      if (G.load > 0) {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        const a = G.frame * 0.25, cx = W - U(34), cy = H - U(30), r = U(11);
        g.save(); g.translate(cx, cy); g.rotate(a); const gr = g.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, '#9ad0ff'); gr.addColorStop(0.5, '#ff9af0'); gr.addColorStop(0.7, '#ffe07a'); gr.addColorStop(1, '#c8c8d8'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, r * 0.25, 0, TAU); g.fill(); g.restore();
        tx('NOW LOADING' + '...'.slice(0, (G.frame >> 4) % 4), W - U(54), H - U(34), { col: '#fff', al: 'r' });
        return true;
      }
      return false;
    }
    function cardIcon(x, y, blink) { // a memory card (PlayStation) or a VMU (Dreamcast), drawn as pixels
      const p = U(1);
      if (!hi) { g.fillStyle = '#9a9aa8'; g.fillRect(x, y, 28 * p, 34 * p); g.fillStyle = '#5a5a68'; g.fillRect(x + 2 * p, y + 2 * p, 24 * p, 12 * p); g.fillStyle = '#d8d8e0'; g.fillRect(x + 4 * p, y + 18 * p, 20 * p, 10 * p); g.fillStyle = blink ? '#ff3a3a' : '#5a1a1a'; g.fillRect(x + 22 * p, y + 4 * p, 3 * p, 3 * p); for (let i = 0; i < 6; i++) { g.fillStyle = '#d0b040'; g.fillRect(x + (3 + i * 4) * p, y + 30 * p, 2 * p, 4 * p); } }
      else { g.fillStyle = '#e8e8e0'; g.fillRect(x, y, 28 * p, 40 * p); g.fillStyle = '#6a8a6a'; g.fillRect(x + 3 * p, y + 4 * p, 22 * p, 15 * p); g.fillStyle = '#1a2a1a'; for (let i = 0; i < 4; i++) g.fillRect(x + (6 + i * 4) * p, y + (8 + (i % 2) * 2) * p, 2 * p, 6 * p); g.fillStyle = blink ? '#3aff3a' : '#2a6a2a'; g.fillRect(x + 22 * p, y + 22 * p, 2 * p, 2 * p); g.fillStyle = '#9a9a98'; g.fillRect(x + 6 * p, y + 26 * p, 8 * p, 8 * p); g.fillStyle = '#c03030'; g.fillRect(x + 18 * p, y + 27 * p, 4 * p, 4 * p); g.fillStyle = '#3040c0'; g.fillRect(x + 18 * p, y + 33 * p, 4 * p, 4 * p); }
    }
    function hud() {
      g.clearRect(0, 0, W, H);
      if (sysHud()) return;
      const blink = (G.frame >> 4) % 2 === 0, s = G.scr;
      const H2 = HUDS[s] || HUDS_EXTRA[s]; if (H2) H2(blink);
      // messages
      for (let i = G.msgs.length - 1; i >= 0; i--) { const m = G.msgs[i]; m.t++; if (m.t > m.life) G.msgs.splice(i, 1); }
      for (const m of G.msgs) {
        const a = Math.min(1, (m.life - m.t) / 12, m.t / 4);
        if (m.big) { const grow = m.grow ? 1 + Math.max(0, 8 - m.t) * 0.08 : 1 + Math.max(0, 6 - m.t) * 0.12; big(m.text, W / 2, H * 0.42, m.text.length > 9 ? 3 : 4, m.grad || (m.col === '#ff3a3a' ? ['#ffe0e0', '#ff4a3a', '#8a0000'] : m.col === '#9af0ff' || m.col === '#7ad8ff' ? ['#ffffff', '#9af0ff', '#2a6ad0'] : null), a, grow); }
        else if (m.big2) big(m.text, W / 2, H * 0.6, 3, ['#ffffff', '#7affd0', '#1a8a5a'], a);
        else if (m.side) { const x = m.side < 0 ? U(14) : W - U(14); tx(m.text, x, H * 0.27 + (m.small ? U(12) : 0), { col: m.col, al: m.side < 0 ? 'l' : 'r', a }); }
        else tx(m.text, W / 2, H * 0.3, { col: m.col, al: 'c', k: 2, a });
      }
      saveHud();
    }
    function cheatHud() { const c = G.cheatMsg; if (!c || c.t <= 0) return; c.t--; big(c.text, W / 2, H * 0.55, hi ? 1.6 : 2, ['#ffffff', '#7affd0', '#1a8a5a'], Math.min(1, c.t / 20)); }
    function saveHud() {
      if (!(G.saving > 0)) return;
      const a = Math.min(1, G.saving / 10), w2 = U(176), x = W / 2 - w2 / 2, y = H - U(44);
      g.save(); g.globalAlpha = a; panel(x, y, w2, U(34), { bg: 'rgba(0,0,0,.85)' }); cardIcon(x + U(6), y + U(4), (G.frame >> 3) % 2); g.restore();
      tx(hi ? 'SAVING TO THE VMG...' : 'SAVING TO MEMORY CARD (SLOT 1)...', x + U(24), y + U(5), { col: '#ffd84a', k: hi ? 0.8 : 1, a });
      tx(hi ? 'DO NOT REMOVE THE VMG.' : 'DO NOT REMOVE THE MEMORY CARD', x + U(24), y + U(15), { col: '#ddd', k: hi ? 0.75 : 1, a }); if (!hi) tx('OR SWITCH OFF THE POWER.', x + U(24), y + U(24), { col: '#ddd', a });
    }
    function stats(f, x, y) {
      const st = (lbl, v, yy) => { tx(lbl, x, yy, { col: '#bcd' }); for (let i = 0; i < 5; i++) { g.fillStyle = i < v ? (hi ? '#7ad8ff' : '#ffd040') : 'rgba(255,255,255,.15)'; g.fillRect(x + U(42) + i * U(8), yy + U(1), U(6), U(5)); } };
      st('POWER', f.stats[0], y); st('SPEED', f.stats[1], y + U(9)); st('REACH', f.stats[2], y + U(18));
    }
    const HUDS = {
      title(blink) {
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, H);
        logo(W / 2, H * 0.28); tx(CFG.sub, W / 2, H * 0.28 + U(24), { col: CFG.subCol || '#ffd84a', al: 'c' });
        if (blink) tx('PRESS START', W / 2, H * 0.72, { col: '#fff', al: 'c', k: hi ? 1.2 : 1 });
        tx(CFG.copy || '(C) 1999', W / 2, H - U(24), { col: '#aab', al: 'c', k: hi ? 0.8 : 1 }); if (CFG.licence) tx(CFG.licence, W / 2, H - U(13), { col: '#889', al: 'c', k: hi ? 0.7 : 1 });
        cheatHud();
      },
      menu() {
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, 0, W, H);
        logo(W / 2, H * 0.17);
        const x = W - U(132), y = U(62); panel(x, y, U(118), U(MENU.length * 13 + 8));
        MENU.forEach((m, i) => { const sel = i === G.pm; if (sel) { g.fillStyle = hi ? 'rgba(120,180,255,.35)' : 'rgba(255,190,40,.3)'; g.fillRect(x + U(3), y + U(4 + i * 13), U(112), U(12)); } tx((sel ? '> ' : '  ') + m[0], x + U(6), y + U(6 + i * 13), { col: sel ? '#fff' : '#99a' }); });
        panel(U(8), H - U(30), W - U(16), U(22)); tx(MENU[G.pm][2], W / 2, H - U(23), { col: '#dde', al: 'c', k: hi ? 0.9 : 1 });
        tx('HI ' + (SV.hi[0] ? SV.hi[0].s : 0), U(10), U(62), { col: '#ffd84a' });
        cheatHud();
      },
      options() {
        g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, W, H);
        tx('OPTIONS', W / 2, U(20), { col: '#ffd84a', al: 'c', k: 2 });
        const rows = [['DIFFICULTY', DIFF[opt.diff].n], ['ROUNDS TO WIN', String(opt.rounds)], ['ROUND TIME', opt.time ? String(opt.time) : 'NO LIMIT'], ['MUSIC', opt.music ? 'ON' : 'OFF'], ['SCREEN SHAKE', opt.shake ? 'ON' : 'OFF'], ['BACK', '']];
        panel(U(40), U(50), W - U(80), U(rows.length * 16 + 10));
        rows.forEach(([a, b], i) => { const sel = G.om === i; tx((sel ? '> ' : '  ') + a, U(50), U(58 + i * 16), { col: sel ? '#fff' : '#99a' }); if (b) tx((sel ? '← ' : '') + b + (sel ? ' →' : ''), W - U(50), U(58 + i * 16), { col: sel ? '#ffd84a' : '#bbb', al: 'r' }); });
        tx('← → CHANGE   ' + K.label('b') + ' BACK', W / 2, H - U(20), { col: '#aab', al: 'c' });
      },
      hiscore(blink) {
        g.fillStyle = 'rgba(0,0,10,.55)'; g.fillRect(0, 0, W, H);
        big('HIGH SCORES', W / 2, U(26), 2, CFG.logoGrad.slice(0, 3));
        panel(U(36), U(46), W - U(72), U(150));
        SV.hi.forEach((e, i) => { const y = U(56 + i * 17), f = byId[e.c]; const me = G.newHi && e.n === G.newHi; tx(`${i + 1}.`, U(48), y, { col: i === 0 ? '#ffd84a' : '#aab' }); tx(e.n, U(70), y, { col: me && blink ? '#ffd84a' : '#fff' }); tx(String(e.s), W - U(48), y, { col: '#7affd0', al: 'r' }); if (f) tx(f.n.split(' ').pop(), U(150), y, { col: '#9ab', k: hi ? 0.85 : 1 }); });
        if (SV.ta) tx('TIME ATTACK BEST ' + fmtT(SV.ta), W / 2, H - U(36), { col: '#9ad8ff', al: 'c' });
        if (SV.sv) tx('SURVIVAL BEST ' + SV.sv + ' WINS', W / 2, H - U(26), { col: '#9ad8ff', al: 'c' });
      },
      how() {
        g.fillStyle = 'rgba(0,0,16,.82)'; g.fillRect(0, 0, W, H);
        const pages = CFG.how(K), pg = pages[G.hp];
        tx(pg[0], W / 2, U(12), { col: '#ffd84a', al: 'c', k: 2 });
        pg.slice(1).forEach((l, i) => { const hl = l.startsWith('!'); tx(hl ? l.slice(1) : l, U(18), U(38 + i * 12), { col: hl ? '#ffd84a' : i % 2 ? '#fff' : '#cfe', k: hi ? 0.95 : 1 }); });
        tx(`PAGE ${G.hp + 1} OF ${pages.length}   ← →   ${K.label('b')} BACK`, W / 2, H - U(14), { col: '#aab', al: 'c' });
      },
      select(blink) {
        const L = G.sl, n = L.length, cols = Math.min(n, CFG.selCols || 6), rows = Math.ceil(n / cols), f = L[G.sp];
        big(G.o.who === 2 ? (G.o.mode === 'train' ? 'PICK THE DUMMY' : 'PICK YOUR OPPONENT') : 'SELECT YOUR FIGHTER', W / 2, U(12), hi ? 1.5 : 2, CFG.logoGrad.slice(0, 3));
        const pw = U(30), ph = U(36), gx = W - U(8) - cols * pw, gy = H - U(8) - rows * ph;
        // the portrait grid
        L.forEach((r, i) => {
          const x = gx + (i % cols) * pw, y = gy + (i / cols | 0) * ph, sel = i === G.sp;
          g.fillStyle = '#000'; g.fillRect(x, y, pw - U(2), ph - U(2));
          if (unlocked(r)) port(r, 0, x + U(1), y + U(1), pw - U(4), ph - U(4)); else { g.fillStyle = '#16161e'; g.fillRect(x + U(1), y + U(1), pw - U(4), ph - U(4)); tx('?', x + pw / 2 - U(1), y + ph / 2 - U(7), { col: '#557', al: 'c', k: 2 }); }
          if (sel) { g.strokeStyle = blink ? (G.o.who === 2 ? '#ff5a5a' : '#ffd84a') : '#fff'; g.lineWidth = U(2); g.strokeRect(x, y, pw - U(2), ph - U(2)); tx(G.o.who === 2 ? '2P' : '1P', x + U(2), y + U(1), { col: G.o.who === 2 ? '#ff5a5a' : '#ffd84a', k: hi ? 0.7 : 1 }); }
        });
        // the info panel down the left
        const px = U(8), py = U(26), pw2 = gx - U(16), ph2 = H - py - U(8), k1 = hi ? 0.85 : 1;
        panel(px, py, pw2, ph2);
        if (unlocked(f)) {
          tx(f.n, px + U(5), py + U(5), { col: '#ffd84a', k: hi ? 1.05 : 1 }); tx(f.s, px + U(5), py + U(16), { col: '#9ad8ff', k: hi ? 0.75 : 1 });
          if (f.from) tx(f.from, px + U(5), py + U(26), { col: '#889', k: hi ? 0.72 : 1 });
          stats(f, px + U(5), py + U(38));
          tx('SPECIAL MOVES', px + U(5), py + U(68), { col: '#9ab', k: hi ? 0.72 : 1 });
          (f.specials || []).slice(0, 3).forEach((m, i) => { tx(m.n, px + U(5), py + U(79 + i * 17), { col: '#fff', k: k1 }); tx((m.dir ? { f: '→', b: '←', d: '↓' }[m.dir] + ' + ' : '') + K.label(m.btn), px + U(9), py + U(87 + i * 17), { col: '#ffd84a', k: k1 }); });
          if (ncos(f) > 1) { const got = [...Array(ncos(f)).keys()].filter(i => cosOK(f, i)).length; tx(`COSTUME ${G.scos + 1} OF ${got}`, px + U(5), py + U(134), { col: '#9ab', k: hi ? 0.75 : 1 }); tx(got > 1 ? `${K.label('x')}: CHANGE` : 'WIN ARCADE FOR MORE', px + U(5), py + U(143), { col: '#9ab', k: hi ? 0.75 : 1 }); }
        } else { tx('???', px + U(5), py + U(5), { col: '#889', k: 2 }); const words = (f.hint || 'KEEP PLAYING TO UNLOCK').split(' '); let line = '', yy = py + U(30); for (const w2 of words) { if ((line + ' ' + w2).length > 18) { tx(line, px + U(5), yy, { col: '#aab', k: k1 }); yy += U(10); line = w2; } else line = line ? line + ' ' + w2 : w2; } tx(line, px + U(5), yy, { col: '#aab', k: k1 }); }
        if (blink) tx(`${K.label('a')}: FIGHT!`, px + pw2 / 2, py + ph2 - U(13), { col: '#fff', al: 'c', k: k1 });
      },
      stage(blink) {
        const st = G.ss === -1 ? { n: 'TRAINING ROOM', d: 'A grid in the dark. No crowd, no pressure.' } : STAGES[G.ss];
        big('SELECT STAGE', W / 2, U(14), 2, CFG.logoGrad.slice(0, 3));
        panel(U(20), H - U(64), W - U(40), U(52));
        tx('← ' + st.n + ' →', W / 2, H - U(58), { col: '#ffd84a', al: 'c', k: hi ? 1.2 : 1 }); tx(st.d || '', W / 2, H - U(45), { col: '#ccd', al: 'c', k: hi ? 0.8 : 1 });
        if (G.o.mode === 'vs') tx('↑ ↓ CPU: ' + DIFF[opt.diff].n, W / 2, H - U(30), { col: '#9ad8ff', al: 'c' });
        if (G.o.mode === 'train') { const D = { stand: 'STAND STILL', guard: 'GUARD ALL', crouch: 'CROUCH', random: 'RANDOM GUARD', cpu: 'FIGHT BACK' }; tx('↑ ↓ DUMMY: ' + D[['stand', 'guard', 'crouch', 'random', 'cpu'][G.dm]], W / 2, H - U(30), { col: '#9ad8ff', al: 'c' }); }
        if (blink) tx(K.label('a') + ': GO!', W / 2, H - U(20) + U(4), { col: '#fff', al: 'c' });
      },
      story() {
        const f = G.run.pick, lines = f.story || ['A new challenger enters the tournament.'];
        letterbox(0.12);
        tx('ARCADE MODE', U(12), U(10), { col: '#ffd84a' });
        panel(U(10), H - U(84), W - U(20), U(72), { bg: 'rgba(0,0,0,.72)' });
        tx(f.n, U(18), H - U(78), { col: '#ffd84a', k: hi ? 1.1 : 1 });
        typeLines(lines, U(18), H - U(64), G.t, W - U(36));
        if (G.t > 60) tx(K.label('a') + ': FIGHT', W - U(16), H - U(20), { col: '#aab', al: 'r' });
      },
      vs(blink) {
        const p = G.p, c = G.c, m = G.match, slide = Math.min(1, G.t / 18);
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H);
        const pw = U(92), ph = U(108);
        g.save(); g.globalAlpha = slide;
        port(p.cfg, p.cos, U(14) - (1 - slide) * U(120), U(40), pw, ph); port(c.cfg, c.cos, W - U(14) - pw + (1 - slide) * U(120), U(40), pw, ph, true);
        g.strokeStyle = '#fff'; g.lineWidth = U(1); g.strokeRect(U(14) - (1 - slide) * U(120), U(40), pw, ph); g.strokeRect(W - U(14) - pw + (1 - slide) * U(120), U(40), pw, ph);
        g.restore();
        tx(p.cfg.n, U(14), U(152), { col: '#fff', k: hi ? 1.1 : 1 }); tx(p.cfg.s, U(14), U(162), { col: '#9ad8ff', k: hi ? 0.8 : 1 });
        tx(c.cfg.n, W - U(14), U(152), { col: '#fff', al: 'r', k: hi ? 1.1 : 1 }); tx(c.cfg.s, W - U(14), U(162), { col: '#ff9a9a', al: 'r', k: hi ? 0.8 : 1 });
        big('VS', W / 2, U(92), 5, ['#ffffff', '#ff5a3a', '#7a0000'], Math.min(1, G.t / 12), 1 + Math.max(0, 10 - G.t) * 0.15);
        let top = G.mode === 'arcade' ? `STAGE ${G.run.step + 1}` : G.mode === 'surv' ? `SURVIVAL: WIN ${G.run.wins + 1}` : G.mode === 'ta' ? `TIME ATTACK ${G.run.step + 1}/${G.ladder.length}` : G.mode === 'train' ? 'TRAINING' : 'VERSUS';
        if (m.boss) top = 'FINAL STAGE: THE BOSS!'; if (m.rival) top = 'YOUR RIVAL!'; if (m.chal) top = 'HERE COMES A NEW CHALLENGER!';
        tx(top, W / 2, U(14), { col: m.boss || m.chal ? (blink ? '#ff5a5a' : '#ffd84a') : '#ffd84a', al: 'c', k: hi ? 1.2 : 1 });
        tx(stageIdx >= 0 ? STAGES[stageIdx].n : 'TRAINING ROOM', W / 2, H - U(40), { col: '#9ad8ff', al: 'c' });
        const line = m.rival && p.cfg.rivalLine ? p.cfg.rivalLine : c.cfg.taunt;
        if (line && G.t > 30) tx('"' + line + '"', W / 2, H - U(28), { col: '#ddd', al: 'c', k: hi ? 0.85 : 1 });
        if (G.t > 40 && blink) tx('PRESS ' + K.label('a'), W / 2, H - U(14), { col: '#aab', al: 'c' });
      },
      fight: fightHud,
      next(blink) { fightHud(blink, true); big(G.o.chal && !G.o.won ? 'NICE TRY!' : 'YOU WIN!', W / 2, H * 0.3, 4); if (blink) tx(G.mode === 'surv' ? 'NEXT FIGHTER... (+30 ENERGY)' : 'NEXT CHALLENGER...', W / 2, H * 0.62, { col: '#fff', al: 'c' }); tx('SCORE ' + G.score, W / 2, H * 0.72, { col: '#7affd0', al: 'c' }); },
      continue() { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, W, H); big('CONTINUE?', W / 2, H * 0.3, 3); big(String(Math.max(0, G.contT)), W / 2, H * 0.52, 5, ['#ffffff', '#ffd040', '#c04010']); tx(`START: YES (SCORE HALVED)   ${K.label('b')}: NO`, W / 2, H * 0.75, { col: '#ccc', al: 'c' }); },
      ending() {
        const f = G.run.pick; letterbox(0.14);
        tx('ENDING: ' + f.n, U(12), U(10), { col: '#ffd84a' });
        const total = G.endLines.join('').length * 2 + 260;
        panel(U(10), H - U(92), W - U(20), U(80), { bg: 'rgba(0,0,0,.7)' });
        typeLines(G.endLines, U(18), H - U(84), G.t, W - U(36));
        if (G.t > total - 60) big('THE END', W / 2, H * 0.36, 3, ['#ffffff', '#ffd040', '#a05010'], Math.min(1, (G.t - total + 60) / 40));
      },
      taDone() { big('ALL CLEAR!', W / 2, H * 0.3, 4); tx('TIME ' + fmtT(G.taSecs | 0), W / 2, H * 0.5, { col: '#fff', al: 'c', k: 2 }); if (SV.ta === G.taSecs) tx('NEW BEST TIME!', W / 2, H * 0.62, { col: '#7affd0', al: 'c' }); },
      unlock(blink) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H); const u = G.unl[G.ui]; if (!u) return; big('NEW!', W / 2, H * 0.22, 4, ['#ffffff', '#7affd0', '#1a8a5a'], 1, 1 + Math.max(0, 8 - G.t) * 0.1); if (u[1]) port(u[1], u[1].cos && SV.cos[u[1].id] ? SV.cos[u[1].id] : 0, W / 2 - U(30), H * 0.33, U(60), U(70)); tx(u[0], W / 2, H * 0.68, { col: '#ffd84a', al: 'c', k: hi ? 1.2 : 1 }); if (G.t > 40 && blink) tx('PRESS ' + K.label('a'), W / 2, H * 0.82, { col: '#aab', al: 'c' }); },
      vsres() { fightHud(false, true); panel(W / 2 - U(70), H * 0.36, U(140), U(66)); ['REMATCH', 'CHANGE FIGHTERS', 'CHANGE STAGE', 'QUIT TO TITLE'].forEach((s2, i) => tx((G.vm === i ? '> ' : '  ') + s2, W / 2 - U(60), H * 0.36 + U(8 + i * 14), { col: G.vm === i ? '#fff' : '#99a' })); big(G.o.won ? (G.mode === 'train' ? 'DONE' : '1P WINS') : 'CPU WINS', W / 2, H * 0.22, 3); },
      name(blink) {
        g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, W, H);
        big('NEW HIGH SCORE!', W / 2, H * 0.2, 3); tx(String(G.final.sc), W / 2, H * 0.32, { col: '#7affd0', al: 'c', k: 2 });
        tx('ENTER YOUR NAME', W / 2, H * 0.46, { col: '#fff', al: 'c' });
        for (let i = 0; i < 4; i++) { const x = W / 2 - U(36) + i * U(18), y = H * 0.56; g.fillStyle = i === G.ni ? (blink ? '#ffd84a' : '#806020') : '#333'; g.fillRect(x, y + U(16), U(14), U(2)); tx(G.nm[i], x + U(7), y, { col: '#fff', al: 'c', k: 2 }); }
        tx('↑ ↓ LETTER   ← → MOVE   START: DONE', W / 2, H * 0.8, { col: '#aab', al: 'c' });
      },
      over() { fightHud(false, true); },
    };
    function letterbox(k) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H * k); g.fillRect(0, H * (1 - k), W, H * k); }
    function typeLines(lines, x, y, t, maxW) {
      let left = Math.max(0, (t - 20) / 2 | 0), yy = y;
      for (const l of lines) { const words = l.split(' '); let cur = ''; const out = []; for (const w2 of words) { const tryS = cur ? cur + ' ' + w2 : w2; if ((hi ? (g.font = `bold ${Math.round(8 * 0.9 * fk * 1.12)}px ${FONT_DC}`, g.measureText(tryS).width) : F.width(tryS, 1)) > maxW && cur) { out.push(cur); cur = w2; } else cur = tryS; } if (cur) out.push(cur);
        for (const o of out) { if (left <= 0) return; const sh = o.slice(0, left); left -= o.length; tx(sh, x, yy, { col: '#fff', k: hi ? 0.9 : 1 }); yy += U(10); } yy += U(3); }
    }
    function fightHud(blink, quiet) {
      const p = G.p, c = G.c; if (!p || !c) return;
      if (G.fs === 'intro' && !quiet) {
        const who = G.t < 70 ? p : c, tt = G.t % 70, a = Math.min(1, tt / 10, (70 - tt) / 10);
        letterbox(0.1);
        g.save(); g.globalAlpha = a; tx(who.cfg.n, who === p ? U(16) : W - U(16), H * 0.7, { col: '#fff', al: who === p ? 'l' : 'r', k: 2 }); tx(who.cfg.s, who === p ? U(16) : W - U(16), H * 0.7 + U(18), { col: '#ffd84a', al: who === p ? 'l' : 'r' }); g.restore();
        return;
      }
      if (G.fs === 'replay') { letterbox(0.1); if (blink) tx('REPLAY', U(12), H * 0.1 + U(6), { col: '#ff5a5a', k: 2 }); return; }
      const bw = U(122), bh = U(9), ty = U(10);
      // portraits by the bars
      const pp = U(22);
      port(p.cfg, p.cos, U(6), ty - U(4), pp * 0.85, pp); port(c.cfg, c.cos, W - U(6) - pp * 0.85, ty - U(4), pp * 0.85, pp, true);
      g.strokeStyle = '#000'; g.lineWidth = U(1); g.strokeRect(U(6), ty - U(4), pp * 0.85, pp); g.strokeRect(W - U(6) - pp * 0.85, ty - U(4), pp * 0.85, pp);
      const bx1 = U(28), bx2 = W - U(28) - bw;
      bar(bx1, ty, bw - U(14), bh, p.hp / p.max, p.dmgLag / p.max, CFG.barCol || '#ffd84a', true, p.hp / p.max < 0.25);
      bar(bx2 + U(14), ty, bw - U(14), bh, c.hp / c.max, c.dmgLag / c.max, CFG.barCol || '#ffd84a', false, c.hp / c.max < 0.25);
      tx(p.cfg.n, bx1, ty + bh + U(4), { col: '#fff', k: hi ? 0.85 : 1 }); tx(c.cfg.n, W - bx1, ty + bh + U(4), { col: '#fff', al: 'r', k: hi ? 0.85 : 1 });
      const need = G.match.need || 2;
      if (G.mode !== 'train') for (let i = 0; i < Math.min(need, 5); i++) {
        const on1 = i < p.wins, on2 = i < c.wins, y = ty + bh + U(14);
        const dot = (x, on) => { if (hi) { g.beginPath(); g.arc(x + U(3), y + U(3), U(3), 0, TAU); g.fillStyle = on ? '#ffd84a' : 'rgba(255,255,255,.2)'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke(); } else { g.fillStyle = '#000'; g.fillRect(x - 1, y - 1, U(7) + 2, U(7) + 2); g.fillStyle = on ? '#ffd84a' : '#3a3a3a'; g.fillRect(x, y, U(7), U(7)); if (on) { g.fillStyle = '#fff6c0'; g.fillRect(x, y, U(7), 2); } } };
        dot(bx1 + bw - U(22) - i * U(10), on1); dot(W - bx1 - bw + U(15) + i * U(10), on2);
      }
      // the clock
      const tm = G.mode === 'train' || !isFinite(G.timer) ? '--' : String(Math.ceil(Math.max(0, G.timer))).padStart(2, '0');
      if (!hi) { g.fillStyle = '#000'; g.fillRect(W / 2 - U(14), ty - U(5), U(28), U(20)); g.fillStyle = '#5a5a5a'; g.fillRect(W / 2 - U(14), ty - U(5), U(28), 1); }
      else { panel(W / 2 - U(15), ty - U(6), U(30), U(22), { bg: 'rgba(0,0,0,.6)', bg2: 'rgba(30,40,80,.7)' }); }
      tx(tm, W / 2, ty - U(2), { col: G.timer < 10 && blink ? '#ff5a5a' : '#fff', al: 'c', k: 2 });
      // the combo counter
      if (G.combo.t > 0 && G.combo.n >= 2) {
        const a = Math.min(1, G.combo.t / 20), x = G.combo.side < 0 ? U(14) : W - U(14), al = G.combo.side < 0 ? 'l' : 'r', pop = 1 + Math.max(0, G.combo.t - 82) * 0.06;
        big(String(G.combo.n), x + (G.combo.side < 0 ? U(14) : -U(14)), H * 0.42, 4 * pop, ['#ffffff', '#ffd040', '#d04010'], a);
        tx('HITS', x + (G.combo.side < 0 ? U(32) : -U(32)), H * 0.42 - U(6), { col: '#ffd84a', al, a });
        tx(G.combo.dmg + ' DAMAGE', x, H * 0.42 + U(18), { col: '#fff', al, a, k: hi ? 0.85 : 1 });
      }
      // the bottom line
      if (G.scoring) tx('SCORE ' + G.score, U(10), H - U(14), { col: '#ddd', k: hi ? 0.85 : 1 });
      if (G.mode === 'arcade' && G.run) tx(`STAGE ${G.run.step + 1}`, W - U(10), H - U(14), { col: '#aab', al: 'r', k: hi ? 0.85 : 1 });
      if (G.mode === 'surv' && G.run) tx(`WINS ${G.run.wins}`, W - U(10), H - U(14), { col: '#ffd84a', al: 'r' });
      if (G.mode === 'ta' && G.run) tx(fmtT(Math.round(K.t - G.run.t0)), W - U(10), H - U(14), { col: '#9ad8ff', al: 'r' });
      if (G.mode === 'demo' && blink) { tx('DEMO PLAY', W / 2, H * 0.78, { col: '#fff', al: 'c', k: 2 }); tx('PRESS START', W / 2, H * 0.78 + U(20), { col: '#ffd84a', al: 'c' }); }
      if (G.mode === 'train') { const L2 = G.trainLast; panel(U(8), H - U(44), U(124), U(34)); tx('LAST: ' + (L2 ? L2.dmg : 0) + ' DMG', U(14), H - U(40), { col: '#fff', k: hi ? 0.85 : 1 }); tx('COMBO: ' + (L2 ? L2.n + ' HITS, ' + L2.total : 0), U(14), H - U(30), { col: '#ffd84a', k: hi ? 0.85 : 1 }); tx('START: MOVES + DUMMY', U(14), H - U(20), { col: '#9ab', k: hi ? 0.75 : 1 }); }
      // a white flash where a heavy hit landed
      if (G.flash && G.flash.t > 0) {
        const [sx, sy, sz] = toScreen(G.flash.x, G.flash.y, G.flash.z); G.flash.t--;
        if (sz < 1) { const r = U(G.flash.big ? 26 : 16) * (0.6 + G.flash.t * 0.08); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(G.flash.col || '#fff', 0.7); g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + G.frame * 0.3, rr = i % 2 ? r * 0.25 : r * (0.7 + (i % 4) * 0.15); g.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore(); }
      }
      if (false && G.fs === 'ko') { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, 0, W, H); }
      if (G.fs === 'roundEnd' && G.t > 30 && !quiet) {
        const won = G.winner === p && G.mode !== 'demo';
        big(G.draw ? 'DRAW' : G.mode === 'vs' ? (won ? '1P WINS' : 'CPU WINS') : won ? 'YOU WIN' : G.winner ? 'YOU LOSE' : 'DRAW', W / 2, H * 0.24, 3);
        if (won && G.tally) { const T2 = G.tally; let y = H * 0.38; panel(W / 2 - U(90), y - U(6), U(180), U(64)); for (const [l, v] of [['ROUND', T2.win], ['TIME BONUS', T2.time], ['ENERGY BONUS', T2.health], ['PERFECT', T2.perfect], ['RING OUT', T2.ring]]) { if (!v) continue; tx(l, W / 2 - U(80), y, { col: '#fff' }); tx(String(v), W / 2 + U(80), y, { col: '#7affd0', al: 'r' }); y += U(11); } }
        if (G.winner && G.t > 80) { const q = G.winner === p ? G.winner.cfg.quote : G.winner.cfg.taunt; if (q) tx('"' + q + '"', W / 2, H * 0.82, { col: '#ddd', al: 'c', k: hi ? 0.9 : 1 }); }
      }
      if (G.paused) {
        g.fillStyle = 'rgba(0,0,0,.62)'; g.fillRect(0, 0, W, H);
        if (G.pmode === 'moves') {
          const ml = movesFor(p); big(p.cfg.n, W / 2, U(14), 2, CFG.logoGrad.slice(0, 3));
          panel(U(12), U(28), W - U(24), H - U(48));
          ml.slice(G.ml | 0, (G.ml | 0) + 13).forEach(([n, inp, kind, ht], i) => { const y = U(34 + i * 13); tx(n, U(20), y, { col: kind === 'sp' ? '#ffd84a' : kind === 'str' ? '#9ad8ff' : kind === 'thr' ? '#ff9a7a' : '#fff', k: hi ? 0.85 : 1 }); tx(inp, W - U(56), y, { col: '#fff', al: 'r', k: hi ? 0.85 : 1 }); tx(ht === 'h' ? 'HIGH' : ht === 'm' ? 'MID' : ht === 'l' ? 'LOW' : ht === 't' ? 'THROW' : 'MID', W - U(20), y, { col: ht === 'l' ? '#ff8a8a' : ht === 'h' ? '#ffe08a' : '#9ad8ff', al: 'r', k: hi ? 0.7 : 1 }); });
          tx(`YELLOW: SPECIALS  BLUE: STRINGS  ↑↓ MORE  ${K.label('b')}: BACK`, W / 2, H - U(16), { col: '#aab', al: 'c', k: hi ? 0.75 : 1 });
        } else {
          big('PAUSE', W / 2, H * 0.24, 4);
          const it = pauseItems(); panel(W / 2 - U(76), H * 0.38, U(152), U(it.length * 14 + 8));
          it.forEach(([s2], i) => tx((G.pm === i ? '> ' : '  ') + s2, W / 2 - U(66), H * 0.38 + U(6 + i * 14), { col: G.pm === i ? '#fff' : '#99a' }));
          tx('START: CARRY ON', W / 2, H - U(18), { col: '#aab', al: 'c' });
        }
      }
    }

    // ================================================================ the main loop
    function update() {
      G.frame++; G.t++;
      if (stage && stage.anims) for (const a of stage.anims) a(G.frame, G);
      if (stage && stage.update) stage.update(G.frame, G);
      const slow = G.scr === 'fight' && G.fs === 'ko' && G.slow > 0 ? 0.3 : G.fs === 'replay' ? (G.replay ? G.replay.sp : 1) : 1;
      if (!(G.scr === 'fight' && G.paused)) { FXA.step(slow); FXN.step(slow); }
      if (G.load > 0) { G.load--; return; } // (NOW LOADING: the disc is spinning)
      if (G.saving > 0) G.saving--;
      if (cheatInput()) return;
      const s = SCR[G.scr]; if (s && s.update) s.update();
    }
    return {
      update, draw,
      end() {
        for (const k in models) { try { models[k].dispose(); } catch (e) {} }
        for (const m of S.own) { try { m.dispose(); } catch (e) {} }
        for (const t of S.texs) { try { t.dispose(); } catch (e) {} }
        if (SBk) clearStage();
        K.music(null);
      },
    };
  }

  // ================================================================ sound effects (made from tones and noise; PlayStation thumps, Dreamcast rings)
  function makeSfx(K, look) {
    const S = K.sfx, dc = look === 'dc', w = dc ? 'sine' : 'square';
    return {
      move: () => S.tone(dc ? 1180 : 880, 0.04, w, 0.05),
      ok: () => { S.tone(dc ? 1320 : 990, 0.07, w, 0.07); S.tone(dc ? 1980 : 1320, 0.1, w, 0.05, 0.05); },
      pick: () => { S.seq([[67, 0.25], [74, 0.25], [79, 0.5]], { bpm: 320, vol: 0.09, wave: dc ? 'triangle' : 'square' }); S.noise(0.3, 0.06, 3000, 0.1, 'highpass'); },
      back: () => S.tone(520, 0.08, w, 0.06, 0, 330),
      err: () => S.tone(150, 0.25, 'sawtooth', 0.08),
      pause: () => S.tone(660, 0.08, w, 0.07),
      whoosh: (dmg, su) => S.noise(0.1 + dmg * 0.006, 0.04 + dmg * 0.003, 1300 + su * 50, Math.max(0, (su - 4) / 60), 'bandpass', 500),
      swing: mv => { if (mv.kind === 'w') { S.noise(0.18, 0.09, 3200, 0, 'bandpass', 800); S.tone(380, 0.12, 'sine', 0.03, 0, 200); } },
      hit: (mv, heavy, duel) => { S.noise(heavy ? 0.24 : 0.12, heavy ? 0.26 : 0.17, heavy ? 850 : 1700); S.tone(heavy ? 80 : 140, heavy ? 0.24 : 0.1, 'square', 0.13, 0, 45); if (duel && mv.kind === 'w') { S.tone(2300, 0.16, 'triangle', 0.05, 0, 1500); S.noise(0.08, 0.08, 5000, 0, 'highpass'); } },
      block: mv => { if (dc && mv.kind === 'w') { S.tone(1450, 0.18, 'triangle', 0.08); S.tone(2170, 0.26, 'sine', 0.05); S.tone(3100, 0.12, 'sine', 0.03); S.noise(0.06, 0.08, 6000, 0, 'highpass'); } else { S.tone(900, 0.06, 'square', 0.07); S.noise(0.05, 0.1, 3800, 0, 'highpass'); } },
      parry: gi => { S.tone(1568, 0.3, 'triangle', 0.1); S.tone(2093, 0.4, 'sine', 0.08, 0.04); S.tone(3136, 0.3, 'sine', 0.04, 0.08); S.noise(0.15, 0.1, 7000, 0, 'highpass'); },
      grab: () => { S.tone(160, 0.25, 'square', 0.1, 0, 90); S.noise(0.1, 0.1, 900); },
      brk: () => { S.tone(900, 0.08, 'square', 0.08); S.tone(1200, 0.1, 'square', 0.06, 0.06); },
      thud: () => { S.tone(70, 0.28, 'sine', 0.2, 0, 35); S.noise(0.22, 0.15, 420); },
      land: () => S.noise(0.08, 0.08, 600),
      step: () => S.noise(0.05, 0.04, 1200),
      hop: () => S.tone(300, 0.1, 'sine', 0.05, 0, 520),
      whiff: () => S.noise(0.1, 0.04, 2000, 0, 'bandpass'),
      ko: () => { S.tone(220, 1.3, 'sawtooth', 0.14, 0, 40); S.noise(1.1, 0.2, 600, 0, 'lowpass', 80); S.tone(55, 1.2, 'sine', 0.2, 0.05, 30); },
      ringout: () => { S.tone(700, 0.9, 'triangle', 0.1, 0, 120); S.seq([[72, 0.5], [67, 0.5], [60, 1]], { bpm: 200, vol: 0.08, wave: 'triangle', when: 0.2 }); },
      fall: () => S.tone(420, 0.8, 'triangle', 0.08, 0, 90),
      splash: () => { S.noise(0.7, 0.22, 2400, 0, 'lowpass', 300); S.noise(0.4, 0.08, 6000, 0.05, 'highpass'); },
      zap: () => S.tone(1600 + rnd() * 1200, 0.05, 'sawtooth', 0.04),
      poof: () => S.noise(0.35, 0.1, 1500, 0, 'bandpass', 400),
      round: () => { S.tone(110, 0.6, 'sawtooth', 0.1, 0, 55); S.noise(0.5, 0.1, 900); S.seq([[57, 0.5], [64, 0.5]], { bpm: 240, vol: 0.08, wave: w }); },
      fight: () => { S.tone(440, 0.15, 'square', 0.12); S.tone(660, 0.35, 'square', 0.12, 0.1); S.noise(0.35, 0.16, 3000); S.tone(110, 0.4, 'sawtooth', 0.1, 0.1, 220); },
      intro: () => { S.noise(0.5, 0.06, 1500, 0, 'bandpass', 4000); },
      vs: () => { S.tone(80, 1.2, 'sawtooth', 0.1, 0, 160); S.noise(1.0, 0.08, 800, 0, 'lowpass', 3000); S.tone(1046, 0.6, w, 0.05, 0.4); },
      timeUp: () => S.seq([[72, 0.5], [72, 0.5], [60, 1.5]], { bpm: 200, vol: 0.1, wave: w }),
      jingle: won => won ? S.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]], { bpm: 220, vol: 0.1, wave: w }) : S.seq([[67, 0.5], [63, 0.5], [60, 1.5]], { bpm: 160, vol: 0.1, wave: 'triangle' }),
      cheer: k => { S.noise(1.6 * k, 0.07 * k, 1100, 0, 'bandpass', 700); S.noise(1.2 * k, 0.04 * k, 2600, 0.2, 'bandpass', 1800); },
      tick: () => S.tone(440, 0.08, w, 0.08),
      unlock: () => S.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 1]], { bpm: 260, vol: 0.09, wave: dc ? 'triangle' : 'square' }),
    };
  }

  window.RmFight = { v: 2, make, PP, POSE, PT, mixP, flipP, shade, mixC, prng, KEYS };
})();

/* pcgames-engine: the shared 3D engine for JAQUAKE and JACKREAL TOURNAMENT (three.js r128 underneath).
 * A "software renderer" look on purpose: a low resolution render target blown up with chunky pixels, procedurally drawn
 * 256-colour textures, light baked into the vertices with banding, a 5x7 pixel font, Quake-ish air-strafing physics,
 * keyboard/mouse (pointer lock) and two-stick touch controls, square particles and synthesised sound effects.
 * Everything here is drawn and written from scratch. Loaded on demand by pcgames.js. */
(function () {
  'use strict';
  if (window.PCG && window.PCG.engine) return;
  const T = window.THREE, Grid = window.PCGGrid;
  const PCG = window.PCG = window.PCG || {};
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rng = seed => { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hashStr = s => [...s].reduce((x, c) => Math.imul(x ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

  // ================================================================ styles (we own no CSS file, so inject them)
  const styled = {};
  function css(id, text) { if (styled[id]) return; styled[id] = 1; const s = document.createElement('style'); s.textContent = text; document.head.appendChild(s); }
  css('engine', `
.pcg-host{position:absolute;inset:0;overflow:hidden;background:#000;outline:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;cursor:crosshair}
.pcg-host canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.pcg-host canvas.px{image-rendering:pixelated;image-rendering:crisp-edges}
.pcgwin > .appbody{padding:0!important;overflow:hidden!important;background:#000;min-height:120px}
.pcg-touch{position:absolute;inset:0;pointer-events:none;z-index:3}
.pcg-stick{position:absolute;bottom:18px;width:118px;height:118px;border-radius:50%;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.28);pointer-events:auto;touch-action:none}
.pcg-stick i{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:rgba(255,255,255,.3);border:2px solid rgba(255,255,255,.5)}
.pcg-tb{position:absolute;pointer-events:auto;touch-action:none;width:64px;height:64px;border-radius:50%;background:rgba(200,40,20,.35);border:2px solid rgba(255,200,150,.6);color:#fff;font:bold 11px Arial,sans-serif;display:flex;align-items:center;justify-content:center;text-shadow:1px 1px #000}
.pcg-tb.sm{width:46px;height:46px;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.4)}
.pcg-tb.on{background:rgba(255,120,40,.6)}
.pcg-ov{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font:12px Tahoma,Arial,sans-serif}
`);

  // ================================================================ the 256-colour palette (16 ramps x 16 shades)
  const RAMPS = [[[0, 0, 0], [235, 235, 235]], [[15, 10, 5], [200, 150, 100]], [[20, 18, 12], [222, 204, 164]], [[22, 8, 0], [244, 146, 64]], [[16, 0, 0], [226, 64, 40]],
    [[10, 12, 0], [166, 172, 92]], [[0, 14, 0], [104, 222, 90]], [[0, 22, 6], [150, 255, 70]], [[0, 0, 26], [96, 146, 255]], [[0, 16, 16], [96, 222, 212]], [[16, 0, 22], [196, 116, 236]],
    [[22, 16, 0], [255, 242, 110]], [[28, 12, 10], [255, 196, 166]], [[8, 10, 14], [176, 190, 214]], [[48, 0, 0], [255, 236, 96]], [[18, 8, 2], [196, 126, 64]]];
  const PAL = [];
  RAMPS.forEach(([a, b], r) => { for (let k = 0; k < 16; k++) { const t = k / 15, tt = r === 14 ? Math.pow(t, 0.8) : t; PAL.push([0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * (r === 14 && i === 1 ? t * t : tt)))); } });
  let LUT = null;
  function lut() {
    if (LUT) return LUT;
    LUT = new Uint8Array(32768);
    for (let r = 0; r < 32; r++) for (let g = 0; g < 32; g++) for (let b = 0; b < 32; b++) {
      const R = r * 8 + 4, Gg = g * 8 + 4, B = b * 8 + 4; let best = 0, bd = 1e9;
      for (let i = 0; i < 256; i++) { const p = PAL[i], d = (p[0] - R) * (p[0] - R) * 3 + (p[1] - Gg) * (p[1] - Gg) * 4 + (p[2] - B) * (p[2] - B) * 2; if (d < bd) { bd = d; best = i; } }
      LUT[(r << 10) | (g << 5) | b] = best;
    }
    return LUT;
  }
  function quantize(img) {
    const L = lut(), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const p = PAL[L[((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3)]]; d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; }
    return img;
  }

  // ================================================================ procedural textures
  // painter(ctx2d, size, rnd, px) draws; px(x,y,[r,g,b]) sets a pixel in an ImageData pass afterwards via `post`
  const C = (r, g, b) => `rgb(${r | 0},${g | 0},${b | 0})`;
  const shade = (c, k) => [clamp(c[0] * k, 0, 255), clamp(c[1] * k, 0, 255), clamp(c[2] * k, 0, 255)];
  function grain(img, rnd, amt, sx) { const d = img.data; for (let i = 0; i < d.length; i += 4) { const k = 1 + (rnd() - 0.5) * amt; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; } return img; }
  function vnoise(rnd, n) { // tileable value noise, n x n lattice
    const g = []; for (let i = 0; i < n * n; i++) g.push(rnd());
    return (x, y) => { x = ((x % n) + n) % n; y = ((y % n) + n) % n; const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = g[yi * n + xi], b = g[yi * n + (xi + 1) % n], c = g[((yi + 1) % n) * n + xi], d = g[((yi + 1) % n) * n + (xi + 1) % n];
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
  }
  function fbm(rnd, size) { const ns = [vnoise(rnd, 4), vnoise(rnd, 8), vnoise(rnd, 16)]; return (x, y) => (ns[0](x / size * 4, y / size * 4) * 0.55 + ns[1](x / size * 8, y / size * 8) * 0.3 + ns[2](x / size * 16, y / size * 16) * 0.15); }
  function field(ctx, S, fn) { const img = ctx.getImageData(0, 0, S, S), d = img.data; for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = (y * S + x) * 4, c = fn(x, y, [d[i], d[i + 1], d[i + 2]]); if (c) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c.length > 3 ? c[3] : 255; } } ctx.putImageData(img, 0, 0); }
  function bevel(ctx, x, y, w, h, base, hi, lo) { ctx.fillStyle = C(...base); ctx.fillRect(x, y, w, h); ctx.fillStyle = C(...hi); ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillStyle = C(...lo); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h); }
  function bricks(ctx, S, rnd, o) {
    ctx.fillStyle = C(...o.mortar); ctx.fillRect(0, 0, S, S);
    const bw = o.bw || 16, bh = o.bh || 8;
    for (let y = 0; y < S; y += bh) for (let x = -bw; x < S; x += bw) {
      const off = (y / bh) % 2 ? bw / 2 : 0, k = 0.8 + rnd() * 0.4, c = shade(o.c, k);
      bevel(ctx, x + off + 1, y + 1, bw - 1, bh - 1, c, shade(c, 1.25), shade(c, 0.6));
      if (x + off + bw > S) bevel(ctx, x + off + 1 - S, y + 1, bw - 1, bh - 1, c, shade(c, 1.25), shade(c, 0.6));
    }
  }
  function rivets(ctx, S, pts, c) { pts.forEach(([x, y]) => { ctx.fillStyle = C(...shade(c, 1.4)); ctx.fillRect(x, y, 2, 2); ctx.fillStyle = C(...shade(c, 0.45)); ctx.fillRect(x + 1, y + 1, 2, 2); ctx.fillStyle = C(...c); ctx.fillRect(x + 1, y + 1, 1, 1); }); }
  function streaks(ctx, S, rnd, c, n) { for (let k = 0; k < n; k++) { const x = rnd() * S | 0, y = rnd() * S | 0, l = 4 + rnd() * 14 | 0; ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.25 + rnd() * 0.35})`; ctx.fillRect(x, y, 1 + (rnd() * 2 | 0), l); } }
  function glyphs(ctx, S, rnd, c) { // carved squiggly runes (made up)
    ctx.strokeStyle = C(...c); ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const x = 8 + k * 18, y = 20; ctx.beginPath(); ctx.moveTo(x, y); for (let s = 0; s < 4; s++) ctx.lineTo(x + (rnd() * 12 | 0), y + (rnd() * 24 | 0)); ctx.stroke(); }
  }

  const TEX = {
    // ---------------- JAQUAKE: rusty gothic-industrial
    brick: (x, S, r) => { bricks(x, S, r, { c: [104, 70, 44], mortar: [34, 24, 16] }); },
    brick2: (x, S, r) => { bricks(x, S, r, { c: [90, 84, 70], mortar: [26, 24, 20], bw: 32, bh: 16 }); },
    metal: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => { const v = n(i, j); return shade([112, 84, 58], 0.62 + v * 0.6); }); x.fillStyle = C(40, 28, 18); x.fillRect(0, 31, S, 2); x.fillRect(31, 0, 2, S); rivets(x, S, [[3, 3], [27, 3], [3, 27], [27, 27], [35, 35], [59, 35], [35, 59], [59, 59], [35, 3], [59, 3], [3, 35], [3, 59], [27, 35], [27, 59], [59, 27], [35, 27]], [150, 110, 72]); streaks(x, S, r, [120, 50, 10], 26); },
    rust: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => { const v = n(i, j); return v > 0.55 ? shade([168, 82, 28], 0.6 + v * 0.6) : shade([86, 70, 56], 0.7 + v * 0.5); }); x.fillStyle = C(30, 20, 12); for (let k = 0; k < S; k += 16) x.fillRect(0, k, S, 1); },
    rune: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => shade([96, 88, 74], 0.6 + n(i, j) * 0.6)); x.fillStyle = C(30, 26, 20); x.fillRect(0, 0, S, 2); x.fillRect(0, 0, 2, S); x.fillStyle = C(150, 140, 120); x.fillRect(2, 2, S - 2, 1); glyphs(x, S, r, [36, 30, 22]); },
    floor: (x, S, r) => { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const k = 0.85 + r() * 0.3; bevel(x, i * 32, j * 32, 32, 32, shade([92, 80, 62], k), shade([92, 80, 62], k * 1.3), shade([92, 80, 62], k * 0.5)); } const n = fbm(r, S); field(x, S, (i, j, c) => shade(c, 0.75 + n(i, j) * 0.45)); x.fillStyle = C(40, 32, 24); for (let k = 0; k < 6; k++) { let a = r() * S, b = r() * S; for (let s = 0; s < 8; s++) { x.fillRect(a | 0, b | 0, 1, 1); a += r() * 3 - 1; b += r() * 3 - 1; } } },
    ceil: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => shade([58, 52, 46], 0.6 + n(i, j) * 0.6)); x.fillStyle = C(24, 20, 16); x.fillRect(0, 15, S, 2); x.fillRect(0, 47, S, 2); x.fillRect(15, 0, 2, S); x.fillRect(47, 0, 2, S); },
    wood: (x, S, r) => { for (let i = 0; i < S; i += 16) { const k = 0.8 + r() * 0.35; x.fillStyle = C(...shade([112, 70, 34], k)); x.fillRect(i, 0, 16, S); x.fillStyle = C(...shade([112, 70, 34], k * 0.55)); x.fillRect(i + 15, 0, 1, S); for (let g = 0; g < 5; g++) { x.fillStyle = C(...shade([112, 70, 34], k * 0.75)); x.fillRect(i + 2 + (r() * 12 | 0), 0, 1, S); } } x.fillStyle = C(56, 36, 18); x.fillRect(0, 0, S, 2); },
    crate: (x, S, r) => { TEX.wood(x, S, r); x.strokeStyle = C(70, 44, 20); x.lineWidth = 6; x.strokeRect(3, 3, S - 6, S - 6); x.beginPath(); x.moveTo(4, 4); x.lineTo(S - 4, S - 4); x.stroke(); x.strokeStyle = C(140, 92, 48); x.lineWidth = 2; x.strokeRect(1, 1, S - 2, S - 2); },
    door: (x, S, r) => { TEX.metal(x, S, r); x.fillStyle = C(70, 54, 40); x.fillRect(28, 0, 8, S); for (let k = 0; k < S; k += 8) { x.fillStyle = C(200, 170, 40); x.fillRect(0, S - 10, S, 8); } x.fillStyle = C(20, 16, 10); for (let k = -8; k < S; k += 8) { x.beginPath(); x.moveTo(k, S - 2); x.lineTo(k + 4, S - 2); x.lineTo(k + 8, S - 10); x.lineTo(k + 4, S - 10); x.fill(); } },
    silver: (x, S, r) => { TEX.door(x, S, r); x.fillStyle = C(190, 196, 210); x.fillRect(20, 14, 24, 24); x.fillStyle = C(80, 84, 100); x.fillRect(26, 20, 6, 6); x.fillRect(30, 24, 10, 3); x.fillRect(36, 27, 2, 4); },
    gold: (x, S, r) => { TEX.door(x, S, r); x.fillStyle = C(236, 200, 60); x.fillRect(20, 14, 24, 24); x.fillStyle = C(110, 70, 10); x.fillRect(26, 20, 6, 6); x.fillRect(30, 24, 10, 3); x.fillRect(36, 27, 2, 4); },
    light: (x, S, r) => { x.fillStyle = C(60, 50, 40); x.fillRect(0, 0, S, S); bevel(x, 8, 8, 48, 48, [255, 236, 170], [255, 255, 230], [180, 140, 70]); x.fillStyle = C(255, 250, 210); x.fillRect(16, 16, 32, 32); },
    tech: (x, S, r) => { TEX.metal(x, S, r); bevel(x, 10, 12, 44, 26, [20, 40, 30], [60, 90, 70], [8, 14, 10]); for (let k = 0; k < 6; k++) { x.fillStyle = r() > 0.5 ? C(90, 230, 90) : C(230, 60, 40); x.fillRect(14 + k * 7, 18 + (r() * 12 | 0), 4, 3); } x.fillStyle = C(150, 120, 90); x.fillRect(12, 46, 40, 4); },
    button: (x, S, r) => { TEX.metal(x, S, r); bevel(x, 20, 20, 24, 24, [200, 30, 20], [255, 120, 90], [90, 0, 0]); },
    emblem: (x, S, r) => { TEX.rune(x, S, r); x.fillStyle = C(150, 60, 20); x.fillRect(30, 10, 10, 34); x.fillRect(18, 38, 18, 8); x.fillRect(16, 30, 8, 10); x.fillStyle = C(230, 210, 170); x.beginPath(); x.moveTo(40, 12); x.lineTo(48, 18); x.lineTo(40, 22); x.fill(); },
    slime: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => { const v = n(i, j); return [30 + v * 70, 120 + v * 130, 20 + v * 30]; }); },
    lava: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => { const v = n(i, j); return v > 0.5 ? [255, 120 + v * 130, 30 + v * 40] : [150 + v * 160, 30 + v * 90, 0]; }); },
    water: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => { const v = n(i, j); return [30 + v * 40, 60 + v * 70, 70 + v * 90]; }); },
    tele: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => { const v = n(i, j); return v > 0.55 ? [200 + v * 50, 160 + v * 80, 255] : [60 + v * 120, 20 + v * 40, 120 + v * 130]; }); },
    sky1: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => { const v = n(i, j); return [70 + v * 110, 20 + v * 40, 60 + v * 100]; }); },
    sky2: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => { const v = n(i, j); return v > 0.52 ? [110 + v * 100, 70 + v * 60, 120 + v * 90, 255] : [0, 0, 0, 0]; }); },
    grit: (x, S, r) => { field(x, S, () => { const v = 196 + r() * 59; return [v, v, v]; }); },
    grass: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => { const v = n(i, j); return [40 + v * 50, 90 + v * 80, 24 + v * 30]; }); for (let k = 0; k < 90; k++) { const a = r() * S | 0, b = r() * S | 0; x.fillStyle = r() < 0.5 ? C(70, 140, 40) : C(28, 70, 20); x.fillRect(a, b, 1, 2 + (r() * 3 | 0)); } },
    mossy: (x, S, r) => { TEX.brick2(x, S, r); const n = fbm(r, S); field(x, S, (i, j, c) => { const v = n(i, j); return v > 0.58 ? [c[0] * 0.55, c[1] * 0.9 + 20, c[2] * 0.45] : null; }); },
    // ---------------- JACKREAL TOURNAMENT: shiny 3D-card look
    jfloor: (x, S, r) => { bevel(x, 0, 0, S, S, [92, 96, 108], [150, 156, 170], [40, 42, 50]); x.fillStyle = C(50, 52, 60); for (let k = 4; k < S; k += 6) { x.fillRect(4, k, S - 8, 2); } x.fillStyle = C(170, 140, 40); x.fillRect(0, 0, S, 3); x.fillRect(0, S - 3, S, 3); },
    jpanel: (x, S, r) => { bevel(x, 0, 0, S, S, [70, 76, 92], [130, 140, 160], [30, 32, 40]); bevel(x, 6, 6, S - 12, 22, [52, 58, 72], [100, 110, 130], [24, 26, 34]); x.fillStyle = C(60, 160, 255); x.fillRect(10, 38, S - 20, 4); x.fillStyle = C(200, 230, 255); x.fillRect(12, 39, 8, 2); rivets(x, S, [[3, 3], [S - 6, 3], [3, S - 6], [S - 6, S - 6]], [140, 150, 170]); },
    jslab: (x, S, r) => { const n = fbm(r, S); field(x, S, (i, j) => shade([86, 80, 74], 0.6 + n(i, j) * 0.5)); x.fillStyle = C(255, 170, 40); for (let k = 0; k < S; k += 16) { x.fillRect(k, 0, 8, 4); x.fillRect(k + 8, S - 4, 8, 4); } },
    jred: (x, S, r) => { TEX.jfloor(x, S, r); x.fillStyle = 'rgba(220,40,30,.45)'; x.fillRect(0, 0, S, S); x.fillStyle = C(255, 90, 60); x.fillRect(28, 8, 8, 48); x.fillRect(8, 28, 48, 8); },
    jblue: (x, S, r) => { TEX.jfloor(x, S, r); x.fillStyle = 'rgba(30,70,230,.45)'; x.fillRect(0, 0, S, S); x.fillStyle = C(90, 150, 255); x.fillRect(28, 8, 8, 48); x.fillRect(8, 28, 48, 8); },
    jpad: (x, S, r) => { x.fillStyle = C(30, 30, 40); x.fillRect(0, 0, S, S); for (let k = 30; k > 2; k -= 6) { x.fillStyle = k % 12 ? C(80, 200, 255) : C(20, 60, 120); x.beginPath(); x.arc(32, 32, k, 0, 7); x.fill(); } },
    cstone: (x, S, r) => { bricks(x, S, r, { c: [120, 116, 106], mortar: [52, 50, 46], bw: 32, bh: 16 }); const n = fbm(r, S); field(x, S, (i, j, c) => shade(c, 0.8 + n(i, j) * 0.35)); },
    cobble: (x, S, r) => { x.fillStyle = C(50, 48, 40); x.fillRect(0, 0, S, S); for (let k = 0; k < 40; k++) { const cx = r() * S, cy = r() * S, rr = 4 + r() * 4, c = shade([120, 112, 96], 0.7 + r() * 0.5); for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) { x.fillStyle = C(...c); x.beginPath(); x.arc(cx + ox, cy + oy, rr, 0, 7); x.fill(); } } const n = fbm(r, S); field(x, S, (i, j, c) => { const g = n(i, j); return g > 0.62 ? [c[0] * 0.6, c[1] * 0.9, c[2] * 0.5] : null; }); },
    planks: (x, S, r) => { for (let j = 0; j < S; j += 8) { const k = 0.75 + r() * 0.4; x.fillStyle = C(...shade([140, 96, 52], k)); x.fillRect(0, j, S, 8); x.fillStyle = C(...shade([140, 96, 52], k * 0.5)); x.fillRect(0, j + 7, S, 1); x.fillRect((r() * S) | 0, j, 1, 7); } rivets(x, S, [[4, 3], [44, 11], [20, 27], [56, 35], [10, 51]], [120, 120, 120]); },
    pillar: (x, S, r) => { for (let i = 0; i < S; i++) { const k = 0.55 + 0.6 * Math.sin(i / S * Math.PI * 2 * 2) * 0.5 + 0.3; x.fillStyle = C(...shade([150, 144, 130], clamp(k, 0.3, 1.2))); x.fillRect(i, 0, 1, S); } x.fillStyle = C(60, 56, 50); x.fillRect(0, 0, S, 4); x.fillRect(0, S - 4, S, 4); },
    flag: (x, S, r) => { x.fillStyle = C(110, 20, 20); x.fillRect(0, 0, S, S); x.fillStyle = C(200, 160, 40); x.fillRect(0, 4, S, 3); x.fillRect(0, S - 7, S, 3); for (let k = 8; k < S - 8; k += 8) { x.fillStyle = C(150, 40, 30); x.fillRect(0, k, S, 4); } },
  };
  // textures, cached per game instance (ctx.bag frees them)
  function tex(ctx, name, o) {
    o = o || {};
    const key = name + (o.lin ? ':l' : '');
    if (ctx.texCache[key]) return ctx.texCache[key];
    const S = o.size || (TEX[name] && TEX[name].size) || 64, cv = document.createElement('canvas'); cv.width = cv.height = S; // (a texture function can ask for a bigger canvas: fn.size = 128)
    const x = cv.getContext('2d'), r = rng(hashStr(name) + 7);
    (TEX[name] || TEX.grit)(x, S, r);
    if (!o.raw) { const img = x.getImageData(0, 0, S, S); grain(img, r, o.lin ? 0.08 : 0.14); if (!o.lin) quantize(img); x.putImageData(img, 0, 0); }
    const t = new T.CanvasTexture(cv);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    if (o.lin) { t.magFilter = T.LinearFilter; t.minFilter = T.LinearMipmapLinearFilter; t.anisotropy = 2; }
    else { t.magFilter = T.NearestFilter; t.minFilter = T.NearestMipmapNearestFilter; }
    ctx.bag.push(t); ctx.texCache[key] = t;
    return t;
  }

  // ================================================================ shaders
  const VS = `attribute vec3 lit; attribute vec3 flk; uniform float flick; uniform float uvs; uniform float time; uniform vec2 scroll;
varying vec2 vUv; varying vec3 vL; varying float vD; varying vec3 vW;
void main(){ vUv = uv * uvs + scroll * time; vL = lit + flk * flick; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`;
  const FS = `uniform sampler2D map; uniform float band; uniform vec3 fogC; uniform float fogD; uniform vec3 lmul; uniform float full; uniform float lfloor; uniform float warp; uniform float time; uniform float alpha; uniform float hurt;
uniform vec4 dlp[3]; uniform vec3 dlc[3]; uniform float dlk;
varying vec2 vUv; varying vec3 vL; varying float vD; varying vec3 vW;
void main(){ vec2 uv = vUv; if (warp > 0.0) uv += 0.12 * vec2(sin(vUv.y * 6.28 + time * 1.4), sin(vUv.x * 6.28 + time * 1.2));
 vec4 t = texture2D(map, uv); if (t.a < 0.5) discard;
 vec3 L = max(vL * max(lmul, vec3(lfloor)), vec3(full)); if (band > 0.0) L = floor(L * band + 0.5) / band;
 vec3 c = t.rgb * L;
 for (int i = 0; i < 3; i++) { if (dlp[i].w > 0.0) { float dk = 1.0 - length(vW - dlp[i].xyz) / dlp[i].w; if (dk > 0.0) c += t.rgb * dlc[i] * dk * dk * dlk; } }
 float f = clamp(1.0 - exp(-fogD * vD), 0.0, 1.0); c = mix(c, fogC, f); c = mix(c, vec3(c.r * 0.9 + 0.18, c.g * 0.55, c.b * 0.45), min(hurt, 0.7));
 gl_FragColor = vec4(c, alpha); }`;
  // dynamic lights (muzzle flashes, rockets, explosions): opt-in. A game that wants them sets ctx.uDlp / ctx.uDlc to
  // { value: [3 x Vector4(x, y, z, radius)] } / { value: [3 x Vector3(r, g, b)] } BEFORE building materials; radius 0 = off.
  // Everybody else shares these all-off defaults, so nothing changes for them.
  const DL0 = { p: { value: [0, 0, 0].map(() => new T.Vector4(0, 0, 0, 0)) }, c: { value: [0, 0, 0].map(() => new T.Vector3(0, 0, 0)) } };
  // Quake-ish sky: two cloud layers slid across a squashed dome, drawn on ceiling surfaces
  const SKY_FS = `uniform sampler2D map; uniform sampler2D map2; uniform float time; varying vec3 vW; uniform float band;
void main(){ vec3 d = normalize(vW - cameraPosition); d.y = abs(d.y) * 3.0 + 0.4; vec2 p = d.xz / d.y * 1.6;
 vec4 a = texture2D(map, p + vec2(time * 0.02, time * 0.015)); vec4 b = texture2D(map2, p * 1.2 + vec2(time * 0.05, time * 0.04));
 vec3 c = b.a > 0.5 ? b.rgb : a.rgb; gl_FragColor = vec4(c, 1.0); }`;
  // dome skies for the arena maps: stars + a nebula, or a dusk sky with clouds
  const DOME_VS = `varying vec3 vD; void main(){ vD = position; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; }`;
  const DOME_FS = `uniform float kind; uniform float time; varying vec3 vD;
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
 return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y), mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }
void main(){ vec3 d = normalize(vD); vec3 c;
 if (kind < 0.5) { float s = h3(floor(d * 260.0)); float st = step(0.9965, s) * (0.5 + 0.5 * h3(floor(d * 260.0) + 3.0));
  float neb = n3(d * 3.0) * 0.6 + n3(d * 7.0) * 0.4; neb = smoothstep(0.45, 0.9, neb);
  c = vec3(0.02, 0.01, 0.05) + neb * mix(vec3(0.35, 0.05, 0.4), vec3(0.05, 0.25, 0.5), n3(d * 2.0 + 9.0)) * 0.7 + vec3(st);
  float sun = pow(max(dot(d, normalize(vec3(0.6, 0.25, -0.5))), 0.0), 400.0); c += vec3(1.0, 0.9, 0.7) * sun * 2.0; }
 else { float y = d.y; c = mix(vec3(0.95, 0.55, 0.3), vec3(0.18, 0.2, 0.45), clamp(y * 1.8, 0.0, 1.0)); if (y < 0.0) c = vec3(0.3, 0.22, 0.2);
  float cl = n3(vec3(d.xz / (y + 0.25) * 2.0, 0.0) + vec3(time * 0.02, 0.0, 0.0)) * 0.65 + n3(vec3(d.xz / (y + 0.25) * 5.0, 1.0)) * 0.35;
  cl = smoothstep(0.55, 0.85, cl) * clamp(y * 4.0, 0.0, 1.0); c = mix(c, vec3(1.0, 0.75, 0.6) * (0.6 + 0.5 * (1.0 - y)), cl * 0.8);
  float sun = pow(max(dot(d, normalize(vec3(-0.8, 0.12, 0.3))), 0.0), 60.0); c += vec3(1.0, 0.7, 0.3) * sun; }
 gl_FragColor = vec4(c, 1.0); }`;
  function worldMat(ctx, t, o) {
    o = o || {};
    const m = new T.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS, transparent: !!o.alpha && o.alpha < 1, side: o.side || T.FrontSide, depthWrite: o.depthWrite !== false,
      uniforms: { map: { value: t }, band: { value: ctx.band }, fogC: { value: ctx.fogC }, fogD: { value: ctx.fogD }, lmul: { value: o.lmul || new T.Vector3(1, 1, 1) }, full: { value: o.full || 0 }, lfloor: { value: o.floor || 0 }, warp: { value: o.warp ? 1 : 0 },
        time: ctx.uTime, flick: ctx.uFlick, hurt: ctx.uHurt, alpha: { value: o.alpha || 1 }, uvs: { value: o.uvs || 1 }, scroll: { value: o.scroll || new T.Vector2(0, 0) },
        dlp: (!o.noDl && ctx.uDlp) || DL0.p, dlc: (!o.noDl && ctx.uDlc) || DL0.c, dlk: { value: o.dlk != null ? o.dlk : 1 } },
    });
    (ctx.mbag || ctx.bag).push(m); return m;
  }
  function skyMat(ctx) {
    const m = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: SKY_FS, uniforms: { map: { value: tex(ctx, 'sky1') }, map2: { value: tex(ctx, 'sky2') }, time: ctx.uTime, band: { value: 0 }, flick: ctx.uFlick, uvs: { value: 1 }, scroll: { value: new T.Vector2(0, 0) } } });
    (ctx.mbag || ctx.bag).push(m); return m;
  }
  function dome(ctx, kind) {
    const g = new T.SphereGeometry(300, 24, 16), m = new T.ShaderMaterial({ vertexShader: DOME_VS, fragmentShader: DOME_FS, side: T.BackSide, depthWrite: false, uniforms: { kind: { value: kind === 'dusk' ? 1 : 0 }, time: ctx.uTime } });
    (ctx.mbag || ctx.bag).push(g, m);
    const s = new T.Mesh(g, m); s.renderOrder = -10; s.frustumCulled = false;
    s.onBeforeRender = (r, sc, cam) => { s.position.copy(cam.position); };
    return s;
  }

  // ================================================================ the render context
  function makeCtx(host, o) {
    o = Object.assign({ base: 200, band: 16, px: true, fov: 90, far: 120, fogC: [0.08, 0.06, 0.04], fogD: 0.012 }, o || {});
    const canvas = document.createElement('canvas'); if (o.px) canvas.className = 'px';
    const hud = document.createElement('canvas'); hud.className = 'px';
    host.appendChild(canvas); host.appendChild(hud);
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }); }
    catch (e) { return null; }
    renderer.setPixelRatio(1); renderer.autoClear = false; renderer.setClearColor(0x000000, 1);
    const ctx = {
      o, host, canvas, hud, hctx: hud.getContext('2d'), renderer, bag: [], texCache: {}, band: o.band,
      fogC: new T.Vector3(...o.fogC), fogD: o.fogD, uTime: { value: 0 }, uFlick: { value: 1 }, uHurt: { value: 0 },
      scene: new T.Scene(), camera: new T.PerspectiveCamera(o.fov, 1.6, 0.05, o.far),
      wscene: new T.Scene(), wcam: new T.PerspectiveCamera(60, 1.6, 0.01, 10), rw: 320, rh: 200, scale: 1, res: o.base,
    };
    ctx.camera.rotation.order = 'YXZ';
    ctx.resize = () => {
      const r = host.getBoundingClientRect(), W = Math.max(2, r.width), H = Math.max(2, r.height);
      const sc = Math.max(1, Math.min(W / (ctx.res * 1.6), H / ctx.res));
      ctx.rw = Math.max(2, Math.round(W / sc)); ctx.rh = Math.max(2, Math.round(H / sc)); ctx.scale = sc;
      renderer.setSize(ctx.rw, ctx.rh, false);
      hud.width = ctx.rw; hud.height = ctx.rh;
      const vh = Math.max(2, ctx.rh - (ctx.bottom || 0));
      ctx.camera.aspect = ctx.rw / vh;
      // keep the horizontal fov sane in portrait (phones)
      const hf = o.fovH || ctx.fovH || o.fov; ctx.camera.fov = clamp(2 * Math.atan(Math.tan(hf * Math.PI / 360) / ctx.camera.aspect) * 180 / Math.PI, 40, 110);
      ctx.camera.updateProjectionMatrix();
      ctx.wcam.aspect = ctx.camera.aspect; ctx.wcam.fov = clamp(ctx.camera.fov * 0.75, 40, 80); ctx.wcam.updateProjectionMatrix();
      ctx.hctx.imageSmoothingEnabled = false;
    };
    ctx.fovH = o.fov;
    ctx.render = () => {
      renderer.setViewport(0, 0, ctx.rw, ctx.rh); renderer.clear();
      const b = ctx.bottom || 0; if (b) renderer.setViewport(0, b, ctx.rw, Math.max(2, ctx.rh - b));
      renderer.render(ctx.scene, ctx.camera);
      if (ctx.wscene.children.length) { renderer.clearDepth(); renderer.render(ctx.wscene, ctx.wcam); }
    };
    ctx.setBottom = b => { if (ctx.bottom !== b) { ctx.bottom = b; ctx.resize(); } };
    ctx.dispose = () => {
      ctx.scene.traverse(x => { if (x.geometry) x.geometry.dispose(); });
      ctx.wscene.traverse(x => { if (x.geometry) x.geometry.dispose(); });
      ctx.bag.concat(ctx.mbag || []).forEach(x => { try { x.dispose(); } catch (e) {} }); ctx.bag = []; ctx.mbag = [];
      try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) {}
      canvas.width = canvas.height = 1;
    };
    ctx.clearMap = () => {
      ctx.scene.traverse(x => { if (x.geometry) x.geometry.dispose(); });
      (ctx.mbag || []).forEach(x => { try { x.dispose(); } catch (e) {} });
      ctx.mbag = []; ctx.scene = new T.Scene();
    };
    ctx.resize();
    return ctx;
  }

  // ================================================================ world builder: grid -> lit, textured geometry
  function lighting(M, lights, amb) {
    // lights: [{x,y,z,r,g,b,rad,flick}]
    const A = amb || [0.25, 0.22, 0.2];
    function at(x, y, z, nx, ny, nz, shadows) {
      let r = A[0], g = A[1], b = A[2], fr = 0, fg = 0, fb = 0;
      for (const L of lights) {
        const dx = L.x - x, dy = L.y - y, dz = L.z - z, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > L.rad * L.rad) continue;
        const d = Math.sqrt(d2) || 0.001, nd = nx == null ? 1 : (dx * nx + dy * ny + dz * nz) / d;
        if (nd < -0.1) continue;
        let k = (1 - d / L.rad); k = k * k * (0.55 + 0.45 * Math.max(0, nd)) * L.i;
        if (shadows && d > 0.6 && !Grid.los(M, x + (nx || 0) * 0.1, y + (ny || 0) * 0.1, z + (nz || 0) * 0.1, L.x, L.y, L.z, 0.15)) k *= 0.12;
        if (L.flick) { fr += k * L.c[0]; fg += k * L.c[1]; fb += k * L.c[2]; } else { r += k * L.c[0]; g += k * L.c[1]; b += k * L.c[2]; }
      }
      return [r, g, b, fr, fg, fb];
    }
    return at;
  }
  function buildWorld(ctx, M, o) {
    o = o || {};
    const S = M.S, dome = o.sky === 'dome', lightAt = lighting(M, o.lights || [], o.amb), shadows = o.shadows !== false;
    const lin = !!o.lin;
    const groups = {}; // tex -> {pos, uv, lit, flk}
    const G = k => groups[k] = groups[k] || { pos: [], uv: [], lit: [], flk: [] };
    // one sub-divided quad: origin p, edge vectors a (u dir) and b (v dir), lengths la/lb, normal n, uv origin functions
    function face(texName, px, py, pz, ax, ay, az, la, bx, by, bz, lb, n, uvf) {
      if (la <= 0.001 || lb <= 0.001) return;
      const g = G(texName), na = Math.max(1, Math.ceil(la / (o.sub || 1) - 0.01)), nb = Math.max(1, Math.ceil(lb / (o.sub || 1) - 0.01));
      const vtx = (s, t) => { const x = px + ax * s + bx * t, y = py + ay * s + by * t, z = pz + az * s + bz * t; return [x, y, z]; };
      const cache = {};
      const L = (s, t) => { const k = s + ',' + t; if (cache[k]) return cache[k]; const v = vtx(s, t); return cache[k] = [v, lightAt(v[0], v[1], v[2], n[0], n[1], n[2], shadows)]; };
      for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) {
        const s0 = la * i / na, s1 = la * (i + 1) / na, t0 = lb * j / nb, t1 = lb * (j + 1) / nb;
        const q = [L(s0, t0), L(s1, t0), L(s1, t1), L(s0, t1)];
        for (const k of [0, 1, 2, 0, 2, 3]) { const [v, l] = q[k]; g.pos.push(v[0], v[1], v[2]); const uv = uvf(v); g.uv.push(uv[0], uv[1]); g.lit.push(l[0], l[1], l[2]); g.flk.push(l[3], l[4], l[5]); }
      }
    }
    const tFloor = c => c.ft || o.ft || 'floor', tCeil = c => c.ct || o.ct || 'ceil', tWall = c => c.wt || o.wt || 'brick', tStep = c => c.st || c.wt || o.st || o.wt || 'brick';
    const uvF = v => [v[0] / S, v[2] / S], uvX = v => [v[2] / S, v[1] / S], uvZ = v => [v[0] / S, v[1] / S];
    // vertical face along the cell edge, between heights y0..y1; side: 0 +x (east), 1 -x, 2 +z (south), 3 -z ; normal points into "toward"
    function wall(texName, i, j, side, y0, y1, normalOut) {
      if (y1 - y0 < 0.001) return;
      const x0 = i * S, z0 = j * S;
      // edge endpoints
      let ex, ez, dx, dz, nrm;
      if (side === 0) { ex = x0 + S; ez = z0; dx = 0; dz = 1; nrm = [1, 0, 0]; }
      else if (side === 1) { ex = x0; ez = z0; dx = 0; dz = 1; nrm = [-1, 0, 0]; }
      else if (side === 2) { ex = x0; ez = z0 + S; dx = 1; dz = 0; nrm = [0, 0, 1]; }
      else { ex = x0; ez = z0; dx = 1; dz = 0; nrm = [0, 0, -1]; }
      if (!normalOut) nrm = nrm.map(v => -v);
      // wind so the face is visible from the normal side
      const flip = side < 2 ? nrm[0] > 0 : nrm[2] < 0;
      const uvf = side < 2 ? uvX : uvZ;
      if (!flip) face(texName, ex, y0, ez, dx, 0, dz, S, 0, 1, 0, y1 - y0, nrm, uvf);
      else face(texName, ex + dx * S, y0, ez + dz * S, -dx, 0, -dz, S, 0, 1, 0, y1 - y0, nrm, uvf);
    }
    const NB = [[1, 0, 0], [-1, 0, 1], [0, 1, 2], [0, -1, 3]];
    const roof = o.roof != null ? o.roof : 6;
    const liquids = {};
    for (const c of M.cells) {
      const { i, j } = c, x0 = i * S, z0 = j * S;
      if (c.s) {
        if (!dome) continue;
        // solid tops (battlements, pillars) where they meet open air
        if (NB.some(([di, dj]) => { const n = M.cell(i + di, j + dj); return !n.s && n.sky; })) face(c.x && c.x.tt || tWall(c), x0, c.h, z0 + S, 1, 0, 0, S, 0, 0, -1, S, [0, 1, 0], uvF);
        continue;
      }
      if (c.v) continue;
      const top = c.c, hasCeil = !c.sky || !dome, dyn = c.x && c.x.dyn;
      // floor + ceiling
      if (!(dyn === 'lift')) face(tFloor(c), x0, c.f, z0 + S, 1, 0, 0, S, 0, 0, -1, S, [0, 1, 0], uvF);
      if (c.slab) face(c.x.bt || tStep(c), x0, c.f - c.slab, z0, 1, 0, 0, S, 0, 0, 1, S, [0, -1, 0], uvF);
      if (hasCeil) {
        if (c.sky) { const g = G('@sky'); face('@sky', x0, top, z0, 1, 0, 0, S, 0, 0, 1, S, [0, -1, 0], uvF); }
        else face(tCeil(c), x0, top, z0, 1, 0, 0, S, 0, 0, 1, S, [0, -1, 0], uvF);
      }
      const roofY = Math.max(roof, top + 0.6); // (a tall room gets its roof above its own ceiling)
      if (dome && !c.sky) face(o.rt || 'cstone', x0, roofY, z0 + S, 1, 0, 0, S, 0, 0, -1, S, [0, 1, 0], uvF);
      if (c.liq) { const L = liquids[c.liq] = liquids[c.liq] || []; L.push(c); }
      for (const [di, dj, side] of NB) {
        const n = M.cell(i + di, j + dj);
        if (n.s) {
          const yt = (dome && c.sky) ? Math.max(n.h, c.f) : top;
          wall(tWall(n.out ? c : n), i, j, side, c.f, yt, false);
          continue;
        }
        // step down toward a lower neighbour (or the void): this cell draws its edge face, facing the neighbour
        if (n.f < c.f - 0.001) { const lo = n.v ? c.f - (c.slab || 0.6) : (c.slab ? Math.max(n.f, c.f - c.slab) : n.f); wall(tStep(c), i, j, side, lo, c.f, true); }
        if (hasCeil && !(n.sky && dome)) { if (n.c < top - 0.001) wall(tWall(c), i, j, side, n.c, top, false); }
        else if (dome && !c.sky && n.sky) wall(o.rt || tWall(c), i, j, side, top, roofY, true);
      }
    }
    // build meshes
    const meshes = [];
    const mk = (k, mat) => {
      const g = groups[k]; if (!g || !g.pos.length) return;
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(g.pos, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(g.uv, 2));
      geo.setAttribute('lit', new T.Float32BufferAttribute(g.lit, 3));
      geo.setAttribute('flk', new T.Float32BufferAttribute(g.flk, 3));
      geo.computeBoundingSphere();
      const m = new T.Mesh(geo, mat); m.name = k; m.matrixAutoUpdate = false; meshes.push(m); ctx.scene.add(m);
    };
    for (const k of Object.keys(groups)) {
      if (k === '@sky') mk(k, skyMat(ctx));
      else mk(k, worldMat(ctx, tex(ctx, k, { lin }), { full: (o.full || []).includes(k) ? 1.1 : 0 }));
    }
    // liquids: a warped, slightly see-through surface (lava glows)
    for (const kind of Object.keys(liquids)) {
      const g = { pos: [], uv: [], lit: [], flk: [] }; groups['@' + kind] = g;
      for (const c of liquids[kind]) { if (!c.sky && c.c < c.lv) continue; const x0 = c.i * S, z0 = c.j * S; face('@' + kind, x0, c.lv, z0 + S, 1, 0, 0, S, 0, 0, -1, S, [0, 1, 0], uvF); face('@' + kind, x0, c.lv, z0, 1, 0, 0, S, 0, 0, 1, S, [0, -1, 0], uvF); }
      mk('@' + kind, worldMat(ctx, tex(ctx, kind === 'tele' ? 'tele' : kind, { lin }), { warp: 1, full: kind === 'lava' || kind === 'tele' ? 1 : 0.55, alpha: kind === 'water' ? 0.7 : 1, side: T.DoubleSide }));
    }
    return { meshes, lightAt };
  }
  // a solid box (doors, lifts, crates) with baked light, from (x0,y0,z0) to (x1,y1,z1)
  function boxMesh(ctx, M, lightAt, texName, x0, y0, z0, x1, y1, z1, o) {
    o = o || {};
    const pos = [], uv = [], lit = [], flk = [];
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, S = M.S;
    const faces = [
      [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], 'z'], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], 'z'],
      [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], 'y'], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], 'y'],
      [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], 'x'], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], 'x'],
    ];
    for (const [a, b, c, d, n, ax] of faces) {
      const q = [a, b, c, d].map(v => [v, lightAt(v[0] + n[0] * 0.3, v[1] + n[1] * 0.3, v[2] + n[2] * 0.3, n[0], n[1], n[2], true)]);
      for (const k of [0, 1, 2, 0, 2, 3]) {
        const [v, l] = q[k]; pos.push(v[0] - cx, v[1] - cy, v[2] - cz);
        const u = ax === 'z' ? [v[2] / S, v[1] / S] : ax === 'x' ? [v[0] / S, v[1] / S] : [v[0] / S, v[2] / S];
        uv.push(u[0], u[1]); lit.push(l[0], l[1], l[2]); flk.push(l[3], l[4], l[5]);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setAttribute('lit', new T.Float32BufferAttribute(lit, 3)); geo.setAttribute('flk', new T.Float32BufferAttribute(flk, 3));
    const m = new T.Mesh(geo, o.mat || worldMat(ctx, tex(ctx, texName, { lin: o.lin }))); m.position.set(cx, cy, cz);
    ctx.scene.add(m); return m;
  }

  // ================================================================ blocky models (monsters, players, weapons, pickups)
  // part list: [name, w, h, d, x, y, z, colour, parent?] -> THREE.Group with .parts[name]; faces are pre-shaded
  function model(ctx, parts, o) {
    o = o || {};
    const root = new T.Group(); root.parts = {};
    const mat = o.mat || entMat(ctx, o);
    root.mat = mat;
    for (const p of parts) {
      const [name, w, h, d, x, y, z, col, parent, pivot] = p;
      const g = new T.BoxGeometry(w, h, d);
      const c = new T.Color(col), sh = [0.82, 0.62, 1.0, 0.42, 0.9, 0.7], arr = [];
      for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) arr.push(c.r * sh[f] * 1.6, c.g * sh[f] * 1.6, c.b * sh[f] * 1.6);
      g.setAttribute('lit', new T.Float32BufferAttribute(arr, 3));
      g.setAttribute('flk', new T.Float32BufferAttribute(new Array(arr.length).fill(0), 3));
      const uvs = g.attributes.uv; for (let k = 0; k < uvs.count; k++) uvs.setXY(k, uvs.getX(k) * Math.max(w, d) * 2, uvs.getY(k) * h * 2);
      const mesh = new T.Mesh(g, mat);
      if (pivot) { const piv = new T.Group(); piv.position.set(x, y, z); mesh.position.set(pivot[0], pivot[1], pivot[2]); piv.add(mesh); (parent ? root.parts[parent] : root).add(piv); root.parts[name] = piv; root.parts[name + '_m'] = mesh; }
      else { mesh.position.set(x, y, z); (parent ? root.parts[parent] : root).add(mesh); root.parts[name] = mesh; }
    }
    return root;
  }
  function entMat(ctx, o) { o = o || {}; return worldMat(ctx, tex(ctx, o.tex || 'grit', { lin: o.lin }), { lmul: new T.Vector3(1, 1, 1), floor: o.full ? o.full * 0.85 : 0, alpha: o.alpha, dlk: 0.35 }); } // (models are pale-textured: dynamic lights go easier on them)
  function setLight(mdl, l, k) { k = k || 1.5; if (mdl && mdl.mat) mdl.mat.uniforms.lmul.value.set((l[0] + l[3]) * k + 0.15, (l[1] + l[4]) * k + 0.15, (l[2] + l[5]) * k + 0.15); }

  // ================================================================ particles (square, Quake style) and sprites
  function fx(ctx, max) {
    max = max || 1500;
    const pos = new Float32Array(max * 3), col = new Float32Array(max * 3), P = [];
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const mat = new T.PointsMaterial({ size: ctx.o.px ? 0.09 : 0.07, vertexColors: true, sizeAttenuation: true });
    const bag = ctx.mbag || ctx.bag; bag.push(mat);
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; ctx.scene.add(pts);
    for (let k = 0; k < max; k++) P.push({ life: 0 });
    let cur = 0;
    // puff sprites (smoke clouds) share a small canvas texture
    const pc = document.createElement('canvas'); pc.width = pc.height = 32; const px = pc.getContext('2d');
    for (let k = 0; k < 9; k++) { px.fillStyle = `rgba(${200 + k * 5},${200 + k * 5},${200 + k * 5},.9)`; const a = k / 9 * 6.28; px.beginPath(); px.arc(16 + Math.cos(a) * 7, 16 + Math.sin(a) * 7, 8, 0, 7); px.fill(); }
    px.beginPath(); px.arc(16, 16, 10, 0, 7); px.fill();
    const ptex = new T.CanvasTexture(pc); ptex.magFilter = ctx.o.px ? T.NearestFilter : T.LinearFilter; bag.push(ptex);
    // cartoon stars for the "poof" (kid friendly: nothing bleeds, everything goes POOF in smoke and stars)
    const sc = document.createElement('canvas'); sc.width = sc.height = 32; const sx = sc.getContext('2d');
    sx.fillStyle = '#fff'; sx.strokeStyle = 'rgba(120,80,0,.9)'; sx.lineWidth = 2; sx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 6 : 14; sx.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r); } sx.closePath(); sx.stroke(); sx.fill();
    const stex = new T.CanvasTexture(sc); stex.magFilter = ctx.o.px ? T.NearestFilter : T.LinearFilter; bag.push(stex);
    const sprites = [];
    const STAR = [[1, 0.9, 0.2], [1, 1, 1], [0.5, 0.9, 1], [1, 0.6, 0.9], [0.6, 1, 0.5]];
    const api = {
      emit(x, y, z, vx, vy, vz, c, life, grav) {
        const p = P[cur]; cur = (cur + 1) % max;
        Object.assign(p, { x, y, z, vx, vy, vz, r: c[0], g: c[1], b: c[2], life, grav: grav == null ? 9 : grav });
      },
      spray(x, y, z, n, c, sp, life, grav) { for (let k = 0; k < n; k++) api.emit(x, y, z, (Math.random() - 0.5) * sp, Math.random() * sp * 0.8, (Math.random() - 0.5) * sp, c, life * (0.6 + Math.random() * 0.6), grav); },
      // the kid-friendly "poof": a cloud of smoke and a burst of spinning cartoon stars
      poof(x, y, z, big) {
        const k = big ? 2.4 : 1;
        for (let s = 0; s < 4 * k; s++) api.puff(x + (Math.random() - 0.5) * k, y + Math.random() * k, z + (Math.random() - 0.5) * k, 0.9 * k, [0.95, 0.95, 0.92]);
        api.stars(x, y + 0.3, z, Math.round(7 * k), k);
        api.spray(x, y + 0.5, z, 10 * k, [1, 0.95, 0.5], 4, 0.5, 0);
      },
      stars(x, y, z, n, k) {
        k = k || 1;
        for (let s = 0; s < n; s++) { const a = Math.random() * 6.28, sp = (2 + Math.random() * 2.5) * Math.sqrt(k); api.puff(x, y, z, (0.35 + Math.random() * 0.25) * Math.sqrt(k), STAR[s % STAR.length], { tex: stex, vx: Math.cos(a) * sp, vy: 2.5 + Math.random() * 2.5, vz: Math.sin(a) * sp, grav: 7, life: 0.8 + Math.random() * 0.5, spin: (Math.random() - 0.5) * 12, grow: 0 }); }
      },
      boom(x, y, z) {
        api.puff(x, y, z, 1.6, [1, 0.6, 0.15]); api.puff(x, y + 0.3, z, 1.2, [1, 0.9, 0.4]);
        for (let s = 0; s < 3; s++) api.puff(x + (Math.random() - 0.5), y + Math.random(), z + (Math.random() - 0.5), 1.3, [0.5, 0.45, 0.4]);
        api.spray(x, y, z, 40, [1, 0.7, 0.2], 9, 0.7, 4); api.spray(x, y, z, 20, [1, 1, 0.5], 6, 0.4, 0);
      },
      // a quick bright flash where a gun goes off (other players' guns; your own has a flash on the view model)
      flash(x, y, z, size, c) { api.puff(x, y, z, size || 0.5, c || [1, 0.9, 0.5], { tex: stex, life: 0.07, grow: 0.2, vy: 0, spin: 0 }); },
      puff(x, y, z, size, c, o) {
        o = o || {};
        let s = sprites.find(q => !q.visible);
        if (!s) { if (sprites.length > 90) { s = sprites[api.rr = ((api.rr || 0) + 1) % sprites.length]; } else { const m = new T.SpriteMaterial({ map: ptex, transparent: true, depthWrite: false }); bag.push(m); s = new T.Sprite(m); sprites.push(s); ctx.scene.add(s); } }
        s.visible = true; s.position.set(x, y, z); s.t = 0; s.life = o.life || 0.5 + Math.random() * 0.4; s.size = size; s.material.map = o.tex || ptex; s.material.color.setRGB(c[0], c[1], c[2]); s.material.opacity = 1; s.material.rotation = o.tex ? Math.random() * 6.28 : 0;
        s.vx = o.vx || 0; s.vy = o.vy != null ? o.vy : 0.8 + Math.random(); s.vz = o.vz || 0; s.grav = o.grav || 0; s.spin = o.spin || 0; s.grow = o.grow != null ? o.grow : 0.9; s.scale.set(size * 0.4, size * 0.4, 1);
        if (o.tex) s.scale.set(size, size, 1);
      },
      update(dt) {
        let n = 0;
        for (const p of P) {
          if (p.life <= 0) continue;
          p.life -= dt; p.vy -= p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          pos[n * 3] = p.x; pos[n * 3 + 1] = p.y; pos[n * 3 + 2] = p.z; col[n * 3] = p.r; col[n * 3 + 1] = p.g; col[n * 3 + 2] = p.b; n++;
        }
        geo.setDrawRange(0, n); geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
        for (const s of sprites) {
          if (!s.visible) continue; s.t += dt; const k = s.t / s.life; if (k >= 1) { s.visible = false; continue; }
          s.vy -= s.grav * dt; s.position.x += s.vx * dt; s.position.y += s.vy * dt; s.position.z += s.vz * dt;
          if (s.spin) s.material.rotation += s.spin * dt;
          const z = s.material.map === ptex ? s.size * (0.4 + k * s.grow) : s.size * (1 + k * s.grow) * (k < 0.15 ? k / 0.15 : 1); s.scale.set(z, z, 1); s.material.opacity = 1 - k * k;
        }
      },
    };
    return api;
  }

  // ================================================================ movement physics (grid collision + Quake-ish acceleration)
  // body: {p:[x,y,z], v:[x,y,z], r, h, ground}; wish: [x,z] world direction (len 0..1); cfg: {speed, accel, air, fric, grav, jump}
  function blockedAt(M, x, y, z, r, h, step) {
    let fl = -1e9;
    for (const [ox, oz] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, 0]]) {
      const c = M.at(x + ox, z + oz);
      if (c.s) return null;
      if (c.f > y + step) return null;
      if (!c.sky && c.c < Math.max(y, c.f) + h) return null;
      if (c.f > fl) fl = c.f;
    }
    return fl;
  }
  function floorUnder(M, x, z, r) { let fl = -1e9, cl = 1e9; for (const [ox, oz] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, 0]]) { const c = M.at(x + ox, z + oz); if (c.s) continue; if (c.f > fl) fl = c.f; if (!c.sky && c.c < cl) cl = c.c; } return [fl, cl]; }
  function move(M, b, wish, jump, dt, cfg) {
    const v = b.v, p = b.p;
    if (cfg.noclip) {
      p[0] += wish[0] * cfg.speed * 2 * dt; p[2] += wish[1] * cfg.speed * 2 * dt; p[1] += (wish[2] || 0) * cfg.speed * 2 * dt + (jump ? cfg.speed * dt : 0); v[0] = v[1] = v[2] = 0; return;
    }
    const wl = Math.hypot(wish[0], wish[1]), wx = wl ? wish[0] / wl : 0, wz = wl ? wish[1] / wl : 0, ws = Math.min(1, wl) * cfg.speed * (b.slow || 1);
    if (b.ground) {
      const sp = Math.hypot(v[0], v[2]);
      if (sp > 0) { const drop = Math.max(sp, cfg.stop || 3) * (cfg.fric || 6) * dt, ns = Math.max(0, sp - drop) / sp; v[0] *= ns; v[2] *= ns; }
      accel(v, wx, wz, ws, cfg.accel || 10, dt);
      if (jump && !b.jumpHeld) { v[1] = cfg.jump; b.ground = false; b.jumped = true; }
    } else accel(v, wx, wz, Math.min(ws, cfg.air || 0.8), cfg.accel || 10, dt, ws);
    b.jumpHeld = cfg.autoHop ? false : jump;
    if (b.swim) { v[1] *= 0.9; if (jump) v[1] = Math.min(v[1] + 18 * dt, 3); v[1] -= cfg.grav * 0.25 * dt; }
    else if (!b.ground) v[1] -= cfg.grav * dt;
    // horizontal, axis by axis, in small steps
    const dist = Math.hypot(v[0], v[2]) * dt, n = Math.max(1, Math.ceil(dist / 0.25));
    const step = b.ground ? 0.55 : 0.25;
    b.bumped = false;
    for (let k = 0; k < n; k++) {
      for (const ax of [0, 2]) {
        const d = v[ax] * dt / n; if (!d) continue;
        const nx = ax === 0 ? p[0] + d : p[0], nz = ax === 2 ? p[2] + d : p[2];
        const fl = blockedAt(M, nx, p[1], nz, b.r, b.h, step);
        if (fl === null) { v[ax] = 0; b.bumped = true; continue; }
        p[0] = nx; p[2] = nz;
        if (fl > p[1] && fl - p[1] <= step) { b.stepUp = (b.stepUp || 0) + (fl - p[1]); p[1] = fl; }
      }
    }
    // vertical
    p[1] += v[1] * dt;
    const [fl, cl] = floorUnder(M, p[0], p[2], b.r);
    if (p[1] + b.h > cl) { p[1] = cl - b.h; if (v[1] > 0) v[1] = 0; }
    if (p[1] <= fl) { if (!b.ground && v[1] < -1) b.landed = -v[1]; p[1] = fl; v[1] = Math.max(0, v[1]); b.ground = true; }
    else if (b.ground && v[1] <= 0 && p[1] - fl < 0.6 && !b.jumped) { b.stepUp = (b.stepUp || 0) - (p[1] - fl); p[1] = fl; }
    else b.ground = false;
    b.jumped = false;
  }
  function accel(v, wx, wz, ws, a, dt, full) {
    const cur = v[0] * wx + v[2] * wz, add = ws - cur;
    if (add <= 0) return;
    const ac = Math.min(add, a * (full || ws) * dt);
    v[0] += ac * wx; v[2] += ac * wz;
  }

  // ================================================================ breadth-first flow fields (monsters and bots find their way)
  function flow(M, ti, tj, o) {
    o = o || {};
    const W = M.w, H = M.h, dist = new Int16Array(W * H).fill(-1), q = new Int32Array(W * H);
    const ok = o.ok || ((a, b) => !a.s && !b.s && !b.v && (b.f - a.f) <= 0.6 && (b.sky || b.c - b.f >= 1.8));
    let qh = 0, qt = 0;
    if (ti < 0 || tj < 0 || ti >= W || tj >= H) return { dist, W };
    dist[tj * W + ti] = 0; q[qt++] = tj * W + ti;
    while (qh < qt) {
      const k = q[qh++], i = k % W, j = (k / W) | 0, c = M.cells[k];
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
        const nk = nj * W + ni; if (dist[nk] >= 0) continue;
        const n = M.cells[nk];
        if (!ok(n, c)) continue; // walking from n to c (towards the target)
        dist[nk] = dist[k] + 1; q[qt++] = nk;
      }
      if (o.extra) o.extra(k, (nk) => { if (dist[nk] < 0) { dist[nk] = dist[k] + 1; q[qt++] = nk; } });
    }
    return { dist, W, next(i, j) { // best neighbour cell to walk to
      const d0 = dist[j * W + i]; if (d0 <= 0) return null; let best = null, bd = d0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue; const d = dist[nj * W + ni]; if (d >= 0 && d < bd) { bd = d; best = [ni, nj]; } }
      return best; } };
  }

  // ================================================================ key bindings (Options > Controls in both games)
  const ACT = [
    ['fwd', 'Move forward', ['KeyW', 'ArrowUp']], ['back', 'Move back', ['KeyS', 'ArrowDown']], ['left', 'Strafe left', ['KeyA']], ['right', 'Strafe right', ['KeyD']],
    ['jump', 'Jump', ['Space', 'Mouse2']], ['fire', 'Fire', ['Mouse0', 'ControlLeft']], ['next', 'Next weapon', ['KeyE']], ['prev', 'Previous weapon', ['KeyZ']],
    ['turnl', 'Turn left', ['ArrowLeft']], ['turnr', 'Turn right', ['ArrowRight']], ['scores', 'Show the scores', ['Tab']], ['talk', 'Talk', ['KeyY']],
  ];
  const KEYNAME = { Space: 'SPACE', Mouse0: 'LEFT CLICK', Mouse1: 'MIDDLE CLICK', Mouse2: 'RIGHT CLICK', ControlLeft: 'CTRL', ControlRight: 'RIGHT CTRL', ShiftLeft: 'SHIFT', ShiftRight: 'RIGHT SHIFT', AltLeft: 'ALT', AltRight: 'ALT GR',
    ArrowUp: 'UP ARROW', ArrowDown: 'DOWN ARROW', ArrowLeft: 'LEFT ARROW', ArrowRight: 'RIGHT ARROW', Tab: 'TAB', Enter: 'ENTER', Backspace: 'BACKSPACE', CapsLock: 'CAPS LOCK', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']',
    Semicolon: ';', Quote: "'", Backslash: '#', Comma: ',', Period: '.', Slash: '/', Insert: 'INS', Delete: 'DEL', Home: 'HOME', End: 'END', PageUp: 'PG UP', PageDown: 'PG DN', IntlBackslash: '\\' };
  const keyName = c => !c ? '---' : KEYNAME[c] || c.replace(/^Key|^Digit|^Numpad/, m => m === 'Numpad' ? 'KP ' : '');
  const gameCode = c => c === 'KeyQ' ? 'KeyZ' : c === 'KeyT' ? 'KeyY' : c;
  // extra (optional): more actions for one game only, e.g. [['alt', 'Alt fire', ['Mouse2', 'KeyF']]]; their default keys win
  // over the shared defaults (so Mouse2 moves from Jump to Alt fire there). Without it nothing changes.
  function bindings(saved, extra) {
    const B = {}, ACTS = extra ? ACT.concat(extra) : ACT, own = new Set(extra ? [].concat(...extra.map(x => x[2])) : []);
    const dflt = (k, d) => own.size && !extra.some(x => x[0] === k) ? d.filter(c => !own.has(c)) : d;
    for (const [k, , d] of ACTS) B[k] = [...new Set((saved && Array.isArray(saved[k]) && saved[k].every(x => typeof x === 'string') ? saved[k] : dflt(k, d)).slice(0, 2).map(gameCode))];
    if (extra && saved) for (const [k, , d] of extra) if (!Array.isArray(saved[k])) for (const c of d) for (const [k2] of ACT) B[k2] = B[k2].filter(x => x !== c);
    const api = {
      ACT: ACTS, B,
      codes: n => B[n] || [],
      bound: code => ACTS.some(([k]) => B[k].includes(code)),
      label: n => (B[n] || []).map(keyName).join(' or ') || '---',
      set(n, code) { if (!B[n] || /^(Escape|Backquote|KeyQ|KeyT)$/.test(code)) return; for (const [k] of ACTS) B[k] = B[k].filter(x => x !== code); B[n] = [code].concat(B[n].filter(x => x !== code)).slice(0, 2); },
      reset() { for (const [k, , d] of ACTS) B[k] = dflt(k, d).map(gameCode); },
      save: () => JSON.parse(JSON.stringify(B)),
    };
    return api;
  }

  // ================================================================ input: keyboard, mouse + pointer lock, two virtual sticks
  function input(host, o) {
    o = o || {};
    host.houseTyping = () => !!o.typing?.();
    const I = { keys: {}, mdx: 0, mdy: 0, fire: false, alt: false, wheel: 0, locked: false, touch: false, mv: [0, 0], lk: [0, 0], jump: false, pressed: [], enabled: true, binds: o.binds || bindings() };
    // Normalize legacy bindings in memory only; never rewrite the player's save.
    for (const k of Object.keys(I.binds.B)) I.binds.B[k] = [...new Set(I.binds.B[k].map(gameCode))];
    const kd = ev => {
      if (!I.enabled) return;
      if (o.onKey && o.onKey(ev) === false) { ev.preventDefault(); ev.stopPropagation(); return; }
      I.keys[ev.code] = true; I.pressed.push(ev.code);
      if (/^(Space|Tab|Arrow|Key[WASDEQRFCT]|Digit|Control|Backquote|Enter|Slash|Backspace|Quote)/.test(ev.code) || I.binds.bound(ev.code)) ev.preventDefault();
      ev.stopPropagation();
    };
    const ku = ev => { I.keys[ev.code] = false; };
    host.addEventListener('keydown', kd); host.addEventListener('keyup', ku);
    const blur = () => { I.keys = {}; I.fire = false; I.alt = false; };
    window.addEventListener('blur', blur);
    const mm = ev => { if (I.locked) { I.mdx += ev.movementX || 0; I.mdy += ev.movementY || 0; } else if (I.drag) { I.mdx += (ev.clientX - I.drag[0]) * 1.5; I.mdy += (ev.clientY - I.drag[1]) * 1.5; I.drag = [ev.clientX, ev.clientY]; } };
    const md = ev => {
      if (ev.pointerType === 'touch') return;
      host.focus();
      if (o.canLock && !o.canLock()) return;
      if (!I.locked && ev.button === 0) { try { const p = host.requestPointerLock && host.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} if (!document.pointerLockElement) I.drag = [ev.clientX, ev.clientY]; }
      I.keys['Mouse' + ev.button] = true; I.pressed.push('Mouse' + ev.button);
      if (ev.button === 2) I.alt = true;
    };
    const mu = ev => { if (ev.pointerType === 'touch') return; I.keys['Mouse' + ev.button] = false; if (ev.button === 2) I.alt = false; I.drag = null; };
    const plc = () => { I.locked = document.pointerLockElement === host; if (!I.locked) { I.keys.Mouse0 = I.keys.Mouse2 = false; } if (o.onLock) o.onLock(I.locked); };
    const wh = ev => { ev.preventDefault(); I.wheel += Math.sign(ev.deltaY); };
    const cm = ev => ev.preventDefault();
    host.addEventListener('pointerdown', md); window.addEventListener('pointerup', mu); window.addEventListener('mousemove', mm);
    document.addEventListener('pointerlockchange', plc); host.addEventListener('wheel', wh, { passive: false }); host.addEventListener('contextmenu', cm);
    // is an action held down? (the touch buttons count as FIRE and JUMP)
    I.act = n => (n === 'fire' && I.fire) || (n === 'jump' && I.jump) || I.binds.codes(n).some(c => I.keys[c]);
    I.hit = n => { const cs = I.binds.codes(n); const i = I.pressed.findIndex(c => cs.includes(c)); if (i >= 0) { I.pressed.splice(i, 1); return true; } return false; };
    // ---- touch: left stick moves, right stick looks, plus buttons
    let tl = null;
    function touchUI(btns) {
      I.touch = true;
      tl = document.createElement('div'); tl.className = 'pcg-touch';
      tl.innerHTML = `<div class="pcg-stick" data-s="mv" style="left:14px"><i></i></div><div class="pcg-stick" data-s="lk" style="right:14px"><i></i></div>`;
      const mk = (b, st) => { const e = document.createElement('div'); e.className = 'pcg-tb' + (b.sm ? ' sm' : ''); e.textContent = b.label; Object.assign(e.style, st); tl.appendChild(e);
        e.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); e.classList.add('on'); if (b.hold) I[b.hold] = true; if (b.tap) b.tap(); try { e.setPointerCapture(ev.pointerId); } catch (x) {} });
        const up = () => { e.classList.remove('on'); if (b.hold) I[b.hold] = false; }; e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up); b.el = e; return e; };
      (btns || []).forEach(b => mk(b, b.style));
      tl.querySelectorAll('.pcg-stick').forEach(st => {
        const knob = st.firstChild, which = st.dataset.s; let id = null, cx = 0, cy = 0;
        st.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); id = ev.pointerId; const r = st.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; try { st.setPointerCapture(id); } catch (x) {} mvh(ev); });
        // a little dead zone in the middle, then a gentle curve so small nudges aim finely
        const mvh = ev => { if (ev.pointerId !== id) return; let dx = (ev.clientX - cx) / 50, dy = (ev.clientY - cy) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } knob.style.transform = `translate(${dx * 36}px,${dy * 36}px)`; const L = Math.min(1, l), k = L < 0.12 ? 0 : (which === 'lk' ? Math.pow((L - 0.12) / 0.88, 1.6) : (L - 0.12) / 0.88) / (L || 1); I[which] = [dx * k, dy * k]; };
        st.addEventListener('pointermove', mvh);
        const end = ev => { if (ev.pointerId !== id) return; id = null; I[which] = [0, 0]; knob.style.transform = ''; };
        st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
      });
      host.appendChild(tl);
      return tl;
    }
    I.touchUI = touchUI;
    I.showTouch = on => { if (tl) tl.style.display = on ? '' : 'none'; };
    I.touchBottom = px => { if (tl && tl._b !== px) { tl._b = px; tl.style.bottom = px + 'px'; } };
    I.consume = () => { const r = [I.mdx, I.mdy]; I.mdx = I.mdy = 0; return r; };
    I.take = code => { const i = I.pressed.indexOf(code); if (i >= 0) { I.pressed.splice(i, 1); return true; } return false; };
    I.unlock = () => { if (document.pointerLockElement === host) try { document.exitPointerLock(); } catch (e) {} };
    I.dispose = () => {
      delete host.houseTyping;
      host.removeEventListener('keydown', kd); host.removeEventListener('keyup', ku); window.removeEventListener('blur', blur);
      host.removeEventListener('pointerdown', md); window.removeEventListener('pointerup', mu); window.removeEventListener('mousemove', mm);
      document.removeEventListener('pointerlockchange', plc); host.removeEventListener('wheel', wh); host.removeEventListener('contextmenu', cm);
      I.unlock();
    };
    return I;
  }
  const isTouch = () => matchMedia('(hover:none)').matches || ('ontouchstart' in window && innerWidth < 900);

  // ================================================================ the main loop: pauses when minimised or hidden, stops on close
  function loop(w, step, o) {
    o = o || {};
    let last = performance.now(), raf = 0, dead = false, idle = 0;
    const visible = () => !document.hidden && w.el && w.el.style.display !== 'none' && w.el.isConnected;
    function frame() {
      if (dead) return;
      const now = performance.now(), dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (!visible()) { idle = setTimeout(() => { last = performance.now(); raf = requestAnimationFrame(frame); }, 400); if (o.onPause) o.onPause(); return; }
      try { step(dt, now / 1000); } catch (e) { console.error(e); dead = true; if (o.onError) o.onError(e); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return { stop() { dead = true; cancelAnimationFrame(raf); clearTimeout(idle); } };
  }

  // ================================================================ the 5x7 pixel font
  const B32 = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
  const FONT = {
    A: 'EHHVHHH', B: 'UHHUHHU', C: 'EHGGGHE', D: 'UHHHHHU', E: 'VGGUGGV', F: 'VGGUGGG', G: 'EHGNHHF', H: 'HHHVHHH', I: 'E44444E', J: '72222IC', K: 'HIKOKIH', L: 'GGGGGGV', M: 'HRLLHHH',
    N: 'HHPLJHH', O: 'EHHHHHE', P: 'UHHUGGG', Q: 'EHHHLID', R: 'UHHUKIH', S: 'FGGE11U', T: 'V444444', U: 'HHHHHHE', V: 'HHHHHA4', W: 'HHHLLLA', X: 'HHA4AHH', Y: 'HHA4444', Z: 'V12348V',
    0: 'EHJLPHE', 1: '4C4444E', 2: 'EH1248V', 3: 'V2421HE', 4: '26AIV22', 5: 'VGU11HE', 6: '68GUHHE', 7: 'V124888', 8: 'EHHEHHE', 9: 'EHHF12C',
    ' ': '0000000', '!': '444440 4'.replace(' ', ''), '?': 'EH12404', '.': '00000CC', ',': '0000C48', ':': '0CC0CC0', ';': '0CC0C48', '-': '000E000', '+': '044V440', '_': '000000V',
    "'": '4480000', '"': 'AA00000', '/': '1124 8GG'.replace(' ', ''), '\\': 'GG8421 1'.replace(' ', ''), '(': '2488842', ')': '8422248', '[': 'E88888E', ']': 'E22222E', '=': '00V0V00',
    '*': '04LEL40', '#': 'AAVAVAA', '%': 'OP248J3', '&': 'CIK8LID', '<': '248G842', '>': '842124 8'.replace(' ', ''), '@': 'EH1DLLE', '$': '4FKE5U4', '£': '698S88V', '`': '8400000', '~': '008L200', '^': '4AH0000', '|': '4444444',
  };
  const GLYPH = {};
  for (const k of Object.keys(FONT)) GLYPH[k] = [...FONT[k]].slice(0, 7).map(ch => B32.indexOf(ch));
  const atlases = {};
  function atlas(color) {
    if (atlases[color]) return atlases[color];
    const keys = Object.keys(GLYPH), cv = document.createElement('canvas'); cv.width = keys.length * 6; cv.height = 8;
    const x = cv.getContext('2d'); x.fillStyle = color; const idx = {};
    keys.forEach((k, n) => { idx[k] = n; GLYPH[k].forEach((row, y) => { for (let b = 0; b < 5; b++) if (row & (16 >> b)) x.fillRect(n * 6 + b, y, 1, 1); }); });
    return atlases[color] = { cv, idx };
  }
  const font = {
    w: 6, h: 8,
    width: (s, k) => String(s).length * 6 * (k || 1),
    draw(g, s, x, y, color, k, shadow) {
      k = k || 1; s = String(s).toUpperCase(); x = Math.round(x); y = Math.round(y);
      if (shadow) font.draw(g, s, x + k, y + k, typeof shadow === 'string' ? shadow : '#000', k);
      const A = atlas(color || '#fff');
      for (let i = 0; i < s.length; i++) { const n = A.idx[s[i]]; if (n == null || s[i] === ' ') continue; g.drawImage(A.cv, n * 6, 0, 6, 8, x + i * 6 * k, y, 6 * k, 8 * k); }
    },
    center(g, s, cx, y, color, k, shadow) { font.draw(g, s, cx - font.width(s, k) / 2, y, color, k, shadow); },
  };

  // ================================================================ sound effects (synthesised; silent unless SFX is on)
  let AC = null, out = null, noiseBuf = null;
  function ac() {
    if (!window.Sound || !Sound.on) return null;
    if (!AC) { try { AC = Sound.unlock && Sound.unlock(); } catch (e) { AC = null; } if (!AC) return null; out = AC.createGain(); out.gain.value = 0.22; out.connect(Sound.output(AC)); }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function nbuf() { if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return noiseBuf; }
  function tone(f, d, type, v, when, to) { const c = ac(); if (!c) return; const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d); g.gain.setValueAtTime(v || 0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.02); }
  function noise(d, v, f, when, type, to) { const c = ac(); if (!c) return; const t = c.currentTime + (when || 0), s = c.createBufferSource(); s.buffer = nbuf(); const fl = c.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(f || 1200, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + d); const g = c.createGain(); g.gain.setValueAtTime(v || 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02); }
  const SFX = {
    shoota() { noise(0.25, 0.5, 1800, 0, 'lowpass', 300); tone(90, 0.12, 'square', 0.2, 0, 40); },
    teef() { noise(0.05, 0.2, 3000, 0, 'bandpass'); tone(700, 0.04, 'square', 0.06, 0, 400); },
    launch() { noise(0.4, 0.3, 600, 0, 'bandpass', 2400); tone(160, 0.3, 'sawtooth', 0.1, 0, 60); },
    boom() { noise(0.9, 0.7, 900, 0, 'lowpass', 80); tone(70, 0.6, 'sine', 0.4, 0, 30); },
    choppa() { noise(0.1, 0.25, 2500, 0, 'highpass'); },
    clang() { tone(1300, 0.15, 'triangle', 0.15); tone(1730, 0.12, 'triangle', 0.1); },
    pain() { tone(320, 0.18, 'sawtooth', 0.15, 0, 180); },
    grot() { tone(900, 0.08, 'square', 0.1, 0, 1400); tone(1200, 0.1, 'square', 0.08, 0.08, 700); },
    squig() { tone(140, 0.25, 'sawtooth', 0.2, 0, 320); noise(0.15, 0.15, 500); },
    roar() { tone(80, 0.9, 'sawtooth', 0.3, 0, 45); tone(83, 0.9, 'sawtooth', 0.25, 0, 40); noise(0.8, 0.3, 400); },
    poof() { noise(0.35, 0.35, 2600, 0, 'bandpass', 400); tone(600, 0.12, 'sine', 0.1, 0, 1600); },
    pickup() { tone(660, 0.07, 'square', 0.12); tone(990, 0.1, 'square', 0.12, 0.07); },
    weapon() { tone(220, 0.08, 'square', 0.15); tone(330, 0.08, 'square', 0.15, 0.08); tone(440, 0.15, 'square', 0.15, 0.16); },
    health() { tone(523, 0.1, 'triangle', 0.2); tone(784, 0.18, 'triangle', 0.2, 0.08); },
    door() { noise(0.9, 0.25, 220, 0, 'lowpass'); tone(55, 0.9, 'sawtooth', 0.08); },
    lift() { noise(1.2, 0.2, 160, 0, 'lowpass'); tone(48, 1.2, 'square', 0.05); },
    secret() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'square', 0.12, i * 0.09)); },
    key() { [784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', 0.18, i * 0.07)); },
    tele() { tone(200, 0.6, 'sine', 0.2, 0, 1600); noise(0.6, 0.15, 3000, 0, 'bandpass', 600); },
    jump() { tone(200, 0.1, 'square', 0.06, 0, 300); },
    land() { noise(0.08, 0.15, 300); },
    hurt() { tone(220, 0.2, 'sawtooth', 0.18, 0, 110); },
    die() { tone(400, 0.7, 'sawtooth', 0.2, 0, 60); },
    talk() { tone(1000, 0.05, 'square', 0.06); },
    menu() { tone(440, 0.05, 'square', 0.1); },
    enforza() { noise(0.12, 0.35, 2500, 0, 'lowpass', 400); tone(300, 0.06, 'square', 0.1, 0, 120); },
    shokka() { tone(1800, 0.35, 'sawtooth', 0.12, 0, 200); noise(0.2, 0.2, 4000, 0, 'highpass'); },
    dakka() { noise(0.05, 0.25, 2000, 0, 'lowpass'); },
    flak() { noise(0.35, 0.5, 1200, 0, 'lowpass', 200); tone(120, 0.15, 'square', 0.15, 0, 50); },
    rokkit() { noise(0.5, 0.3, 400, 0, 'bandpass', 2000); },
    spanner() { noise(0.12, 0.3, 1500, 0, 'bandpass'); tone(160, 0.1, 'square', 0.1); },
    announce() { tone(880, 0.12, 'square', 0.12); tone(1320, 0.18, 'square', 0.12, 0.12); },
    big() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.16, 'sawtooth', 0.1, i * 0.08)); tone(98, 0.6, 'square', 0.15, 0.1); },
    frag() { tone(1200, 0.06, 'square', 0.1); tone(1600, 0.08, 'square', 0.1, 0.06); },
    flagx() { [660, 880, 660, 880].forEach((f, i) => tone(f, 0.1, 'square', 0.12, i * 0.1)); },
    pad() { tone(150, 0.4, 'sine', 0.25, 0, 900); },
    hit() { tone(1900, 0.035, 'square', 0.07); tone(2600, 0.03, 'square', 0.05, 0.03); },
    step() { noise(0.045, 0.06, 500 + Math.random() * 300, 0, 'bandpass'); },
    empty() { tone(1200, 0.025, 'square', 0.08); noise(0.03, 0.1, 3000, 0.01, 'highpass'); },
    count() { tone(660, 0.12, 'square', 0.1); },
    vote() { tone(880, 0.06, 'triangle', 0.15); tone(1320, 0.09, 'triangle', 0.12, 0.06); },
    respawn() { tone(300, 0.25, 'sine', 0.18, 0, 900); tone(600, 0.2, 'triangle', 0.08, 0.1, 1200); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.5 : 0.14, 'square', 0.12, i * 0.13)); tone(131, 0.9, 'triangle', 0.18, 0); },
    lose() { [392, 370, 349, 330].forEach((f, i) => tone(f, i === 3 ? 0.6 : 0.2, 'sawtooth', 0.09, i * 0.22)); },
    quad() { tone(110, 0.8, 'sawtooth', 0.12, 0, 220); tone(220, 0.8, 'square', 0.06, 0.05, 440); },
    swap() { tone(500, 0.03, 'square', 0.06); noise(0.06, 0.12, 1800, 0.02, 'bandpass'); },
    join() { tone(523, 0.08, 'triangle', 0.15); tone(784, 0.12, 'triangle', 0.15, 0.08); },
  };
  // menu music (original tunes for the JackOS "MIDI" player). Only when SFX is on; stops when the shooting starts.
  if (window.Sound && Sound.addTune) {
    Sound.addTune('jrt', { step: 0.13, hats: true,
      lead: [69, 0, 72, 76, 81, -1, 79, 76, 77, 0, 76, 74, 72, -1, 74, 76, 69, 0, 72, 76, 84, -1, 83, 81, 79, -1, 77, 76, 74, -1, 0, 0,
        72, 0, 76, 79, 84, -1, 83, 79, 81, 0, 79, 77, 76, -1, 74, 72, 74, 0, 77, 81, 83, -1, 81, 79, 81, -1, -1, -1, 0, 0, 69, 71],
      bass: [45, 45, 57, 45, 41, 41, 53, 41, 45, 45, 57, 45, 43, 43, 55, 43, 48, 48, 60, 48, 41, 41, 53, 41, 38, 38, 50, 38, 40, 40, 52, 40] });
    Sound.addTune('jaquake', { step: 0.3, hats: false,
      lead: [45, -1, -1, -1, 0, 0, 48, -1, 47, -1, -1, -1, 0, 0, 0, 0, 45, -1, -1, -1, 0, 0, 52, -1, 51, -1, -1, -1, 0, 0, 0, 0,
        57, -1, -1, 0, 55, -1, 53, -1, 52, -1, -1, -1, 0, 0, 0, 0, 45, -1, 0, 48, -1, 0, 47, -1, 44, -1, -1, -1, -1, -1, 0, 0],
      bass: [33, 33, 33, 33, 36, 36, 35, 35, 33, 33, 33, 33, 40, 40, 39, 39, 38, 38, 36, 36, 35, 35, 35, 35, 33, 33, 36, 35, 32, 32, 32, 32] });
  }
  function music(name, on) {
    const S = window.Sound; if (!S || !S.music) return;
    if (on && S.on) { if (S.music.playing !== name) S.music.play(name); }
    else if (S.music.playing === name) S.music.stop();
  }
  const lastSfx = {};
  function sfx(name, minGap) {
    if (!window.Sound || !Sound.on || !SFX[name]) return;
    const now = performance.now(); if (lastSfx[name] && now - lastSfx[name] < (minGap || 30)) return; lastSfx[name] = now;
    try { SFX[name](); } catch (e) {}
  }

  // ================================================================ small helpers shared by both games
  // ray against a list of boxes ({p:[x,y,z], r, h}), returns {t, e} for the nearest
  function rayEnts(o, d, max, list, skip) {
    let best = null, bt = max;
    for (const e of list) {
      if (!e || e === skip || e.dead) continue;
      const r = e.r || 0.45, h = e.h || 1.8, bx0 = e.p[0] - r, bx1 = e.p[0] + r, by0 = e.p[1], by1 = e.p[1] + h, bz0 = e.p[2] - r, bz1 = e.p[2] + r;
      let t0 = 0, t1 = bt;
      for (const [oo, dd, a, b] of [[o[0], d[0], bx0, bx1], [o[1], d[1], by0, by1], [o[2], d[2], bz0, bz1]]) {
        if (Math.abs(dd) < 1e-9) { if (oo < a || oo > b) { t0 = 1e9; break; } continue; }
        let ta = (a - oo) / dd, tb = (b - oo) / dd; if (ta > tb) { const s = ta; ta = tb; tb = s; }
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) break;
      }
      if (t0 <= t1 && t0 < bt) { bt = t0; best = e; }
    }
    return best ? { t: bt, e: best } : null;
  }
  const fwd = (yaw, pitch) => [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
  function box2d(g, x, y, w, h, c1, c2, c3) { g.fillStyle = c1; g.fillRect(x, y, w, h); g.fillStyle = c2; g.fillRect(x, y, w, 1); g.fillRect(x, y, 1, h); g.fillStyle = c3; g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h); }
  // a loading / title overlay with a JackOS 98 progress bar while textures and lighting are baked
  // the loading screen: the map's name, its blurb and a tip while the lighting is worked out
  function loading(host, o) {
    const d = document.createElement('div'); d.className = 'pcg-ov pcg-load ' + (o.style || 'jrt');
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    d.innerHTML = `<div class="pl-box"><div class="pl-h">${esc(o.head || 'LOADING')}</div><div class="pl-t">${esc(o.title || '')}</div>${o.by ? `<div class="pl-by">by ${esc(o.by)}</div>` : ''}<div class="pl-b">${esc(o.blurb || '')}</div><div class="pl-bar"><i></i></div>${o.tip ? `<div class="pl-tip"><b>TIP:</b> ${esc(o.tip)}</div>` : ''}</div>`;
    host.appendChild(d);
    const bar = d.querySelector('.pl-bar i'); let k = 0; const iv = setInterval(() => { k = Math.min(96, k + 6 + Math.random() * 14); bar.style.width = k + '%'; }, 60);
    return { el: d, done() { clearInterval(iv); bar.style.width = '100%'; setTimeout(() => d.remove(), 120); } };
  }
  css('load', `
.pcg-load{background:#000;z-index:9}
.pcg-load .pl-box{width:min(420px,88%);text-align:center}
.pcg-load .pl-h{font:bold 12px Tahoma,sans-serif;letter-spacing:6px;color:#9a9ab0;margin-bottom:6px}
.pcg-load .pl-t{font:900 clamp(18px,4.4vw,30px) Impact,'Arial Black',sans-serif;color:#ffd860;text-shadow:2px 2px 0 #3a2400;letter-spacing:1px}
.pcg-load .pl-by{font:11px Tahoma,sans-serif;color:#8a8aa8;margin-top:2px}
.pcg-load .pl-b{font:12px Tahoma,sans-serif;color:#c8c8d8;margin:10px 0;line-height:1.4}
.pcg-load .pl-bar{height:10px;border:1px solid #8a7a3a;background:#14141c;padding:1px}.pcg-load .pl-bar i{display:block;height:100%;width:0;background:linear-gradient(#ffe890,#c89020);transition:width .06s}
.pcg-load .pl-tip{font:11px Tahoma,sans-serif;color:#a0e0a0;margin-top:12px;line-height:1.4}
.pcg-load.jq{background:#1a1008}
.pcg-load.jq .pl-box{background:#3a2a1a;border:3px outset #806040;padding:12px 18px}
.pcg-load.jq .pl-h{font:bold 13px 'Courier New',monospace;color:#ffd890;letter-spacing:4px}
.pcg-load.jq .pl-t{font:bold clamp(16px,3.6vw,24px) 'Courier New',monospace;color:#e8b84c;text-shadow:2px 2px 0 #1a0a00;letter-spacing:0}
.pcg-load.jq .pl-by,.pcg-load.jq .pl-b{font-family:'Courier New',monospace;color:#d8c8a8}
.pcg-load.jq .pl-bar{border:2px inset #806040;background:#1a1008}.pcg-load.jq .pl-bar i{background:#a8582a}
.pcg-load.jq .pl-tip{font-family:'Courier New',monospace;color:#e8c890}
`);
  // a muzzle flash for the gun in your hands (a star of light, in the view-model scene)
  function muzzle(ctx) {
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
    const g = x.createRadialGradient(16, 16, 1, 16, 16, 15); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.35, 'rgba(255,220,90,.95)'); g.addColorStop(1, 'rgba(255,120,0,0)');
    x.fillStyle = g; x.beginPath(); for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, r = k % 2 ? 6 : 16; x.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r); } x.closePath(); x.fill();
    const t = new T.CanvasTexture(c); if (ctx.o.px) t.magFilter = T.NearestFilter;
    const m = new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false }); ctx.bag.push(t, m);
    const s = new T.Sprite(m); s.visible = false; s.renderOrder = 10; ctx.wscene.add(s);
    return { s, t: 0, fire(x2, y2, z2, size, col) { s.position.set(x2, y2, z2); s.scale.set(size, size, 1); m.rotation = Math.random() * 6.28; m.color.setRGB(...(col || [1, 1, 1])); s.visible = true; this.t = 0.06; }, update(dt) { if (this.t > 0) { this.t -= dt; if (this.t <= 0) s.visible = false; } } };
  }
  function busy(host, text) { const d = document.createElement('div'); d.className = 'pcg-ov'; d.style.background = '#000'; d.innerHTML = `<div style="font:bold 14px 'Courier New',monospace;color:#c8a060">${text}</div>`; host.appendChild(d); return d; }

  PCG.engine = { music, loading, muzzle, bindings, keyName, ACT, T, Grid, clamp, rng, hashStr, css, PAL, tex, TEX, worldMat, skyMat, dome, makeCtx, buildWorld, boxMesh, lighting, model, entMat, setLight, fx, move, blockedAt, floorUnder, flow, input, isTouch, loop, font, sfx, tone, noise, rayEnts, fwd, box2d, busy, quantize };
})();

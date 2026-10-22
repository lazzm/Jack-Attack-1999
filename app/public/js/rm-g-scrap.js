/* STREET SCRAPPER II: THE WORLD SCRAPPER (Super Nintendo, found in the bin: Dave threw it there after losing 20 in a row).
 * A one-on-one tournament fighter in the 16-bit arcade style. Eight scrappers from round the world and one end boss, each
 * drawn by a little 2D skeleton rig rasterised into proper pixel art (shading ramps with hue-shifted shadows, a light from
 * the top left, 1px outlines between overlapping limbs, 15-bit colour), baked frame by frame into sprites when a fight
 * loads. Six attack buttons like the real pad (Y X L punches, B A R kicks), throws, blocking (hold back), crouching, jump
 * arcs, hit-stun, hit-stop, juggles, combos with a counter, dizzy stars, chip damage on blocked specials, motion-input
 * specials (quarter circles, dragon punch, charge, 360, button mashing), best of three with a round timer, an arcade
 * ladder against the CPU that gets sharper as you climb, a bonus stage (smash Dad's old fridge), an end boss, endings,
 * a high-score table on the cartridge (Jack's mates got there first), a training room and a demo fight on the title.
 * Stages: line-scrolled perspective floors, parallax layers and animated crowds (all made-up places and people).
 * Secrets: lk.scrap.champ (win the tournament), lk.scrap.perfect (win a round without being hit).
 * Every pixel, tune and sound is made up and drawn in code. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const W = 256, H = 224, GROUND = 196, WORLD = 512;
  const TAU = Math.PI * 2, PI = Math.PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sgn = v => v < 0 ? -1 : 1;
  function prng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hasDoc = typeof document !== 'undefined';
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ================================================================ colour: 15-bit like the real machine, hue-shifted ramps
  const q5 = v => Math.min(248, Math.max(0, Math.round(v))) & 0xF8 | (Math.min(248, Math.max(0, Math.round(v))) >> 5);
  function hexRGB(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const pack = (r, g, b, a) => ((a == null ? 255 : a) << 24 | q5(b) << 16 | q5(g) << 8 | q5(r)) >>> 0;
  const hex32 = c => { const [r, g, b] = hexRGB(c); return pack(r, g, b); };
  const css32 = n => `rgb(${n & 255},${(n >> 8) & 255},${(n >> 16) & 255})`;
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
    if (!s) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  const towards = (h, to, k) => { let d = ((to - h + 540) % 360) - 180; return h + d * k; };
  // a 6-colour ramp from a base: highlight, light, base, shade, deep, outline (shadows lean blue-purple, lights lean warm)
  function ramp(hex) {
    const [r, g, b] = hexRGB(hex), [h, s, l] = rgb2hsl(r, g, b);
    const grey = s < 0.08;
    const mk = (dl, hueTo, hk, ds) => { const c = hsl2rgb(grey ? h : towards(h, hueTo, hk), grey ? s : s + ds, l + dl); return pack(c[0], c[1], c[2]); };
    return [mk(+0.17 * (1.1 - l), 50, 0.12, -0.04), mk(+0.08 * (1.2 - l), 50, 0.06, 0), pack(r, g, b),
      mk(-0.13 - l * 0.06, 255, 0.10, +0.06), mk(-0.25 - l * 0.08, 262, 0.18, +0.08), (() => { const c = hsl2rgb(grey ? 240 : towards(h, 260, 0.35), grey ? 0.25 : clamp(s * 0.7 + 0.15, 0, 1), clamp(l * 0.22, 0.04, 0.16)); return pack(c[0], c[1], c[2]); })()];
  }

  // ================================================================ a pixel buffer (backgrounds, logos, effects: crisp, no anti-aliasing)
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function PB(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  PB.prototype = {
    px(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; },
    get(x, y) { x |= 0; y |= 0; return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.d[y * this.w + x] : 0; },
    rect(x, y, w, h, c) { const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0), x1 = Math.min(this.w, (x + w) | 0), y1 = Math.min(this.h, (y + h) | 0); for (let j = y0; j < y1; j++) this.d.fill(c, j * this.w + x0, j * this.w + x1); },
    // two colours mixed by an ordered dither (t: 0 = all a, 1 = all b)
    dith(x, y, w, h, a, b, t) { const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0), x1 = Math.min(this.w, (x + w) | 0), y1 = Math.min(this.h, (y + h) | 0); const th = t * 16; for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.d[j * this.w + i] = BAYER[(j & 3) * 4 + (i & 3)] < th ? b : a; },
    // a vertical gradient in hard bands through a list of colours, dithered at the band edges
    vgrad(x, y, w, h, cols, bands) {
      bands = bands || 12; const n = cols.length - 1;
      for (let j = 0; j < h; j++) {
        const f = j / Math.max(1, h - 1) * n, i0 = Math.min(n - 1, Math.floor(f)), k = f - i0;
        const q = Math.floor(k * bands) / bands, edge = (k * bands) % 1;
        const c0 = mixc(cols[i0], cols[i0 + 1], q), c1 = mixc(cols[i0], cols[i0 + 1], Math.min(1, q + 1 / bands));
        for (let i = 0; i < w; i++) this.px(x + i, y + j, BAYER[((y + j) & 3) * 4 + ((x + i) & 3)] < edge * 10 - 3 ? c1 : c0);
      }
    },
    ellipse(cx, cy, rx, ry, c) { for (let j = Math.floor(cy - ry); j <= cy + ry; j++) { const dy = (j + 0.5 - cy) / ry; if (dy * dy > 1) continue; const hw = rx * Math.sqrt(1 - dy * dy); this.rect(Math.round(cx - hw), j, Math.round(cx + hw) - Math.round(cx - hw), 1, c); } },
    poly(pts, c) { // even-odd scanline fill, pixel centres
      let y0 = 1e9, y1 = -1e9; for (let i = 1; i < pts.length; i += 2) { y0 = Math.min(y0, pts[i]); y1 = Math.max(y1, pts[i]); }
      const n = pts.length / 2, xs = [];
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.h - 1, Math.ceil(y1)); y++) {
        const yc = y + 0.5; xs.length = 0;
        for (let i = 0; i < n; i++) { const ax = pts[i * 2], ay = pts[i * 2 + 1], bx = pts[((i + 1) % n) * 2], by = pts[((i + 1) % n) * 2 + 1]; if ((ay <= yc) !== (by <= yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); if (b > a) this.rect(a, y, b - a, 1, c); }
      }
    },
    line(x0, y0, x1, y1, c) { x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { this.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } },
    blit(src, x, y, flip) { for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) { const c = src.d[j * src.w + i]; if (c >>> 24) this.px(x + (flip ? src.w - 1 - i : i), y + j, c); } },
    outline(c) { // a 1px outline round everything drawn
      const w = this.w, h = this.h, s = this.d, o = new Uint32Array(s);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (s[i] >>> 24) continue; if ((x > 0 && s[i - 1] >>> 24) || (x < w - 1 && s[i + 1] >>> 24) || (y > 0 && s[i - w] >>> 24) || (y < h - 1 && s[i + w] >>> 24)) o[i] = c; }
      this.d = o;
    },
    canvas() { const c = canvas(this.w, this.h), g = c.getContext('2d'), im = g.createImageData(this.w, this.h); new Uint32Array(im.data.buffer).set(this.d); g.putImageData(im, 0, 0); return c; },
  };
  function mixc(a, b, t) { return pack(lerp(a & 255, b & 255, t), lerp((a >> 8) & 255, (b >> 8) & 255, t), lerp((a >> 16) & 255, (b >> 16) & 255, t)); }
  const C32 = c => typeof c === 'string' ? hex32(c) : c;

  // ================================================================ the sprite rasteriser: shaded primitives into material/shade/layer buffers
  const LX = -0.5, LY = -0.68, LZ = 0.54, LN = Math.hypot(LX, LY, LZ), L0 = LX / LN, L1 = LY / LN, L2 = LZ / LN;
  const band = l => l > 0.8 ? 0 : l > 0.52 ? 1 : l > 0.16 ? 2 : l > -0.2 ? 3 : 4;
  function Rast(w, h, ox, oy, sc) { this.w = w; this.h = h; this.ox = ox; this.oy = oy; this.sc = sc; this.m = new Uint8Array(w * h); this.s = new Uint8Array(w * h); this.g = new Uint8Array(w * h); this.f = new Uint8Array(w * h); this.grp = 1; }
  Rast.prototype = {
    set(i, mat, sh, flat) { this.m[i] = mat; this.s[i] = sh; this.g[i] = this.grp; this.f[i] = flat ? 1 : 0; },
    shadeOf(nx, ny, nz, o, x, y) {
      if (o.flat != null) return o.flat;
      let l = nx * L0 + ny * L1 + nz * L2; if (o.lb) l += o.lb;
      let b = band(l) + (o.dk || 0);
      if (o.dith) { const th = [0.8, 0.52, 0.16, -0.2]; for (const t of th) if (Math.abs(l - t) < 0.05 && ((x + y) & 1)) { b += l > t ? 1 : -1; break; } }
      return clamp(b, 0, 4);
    },
    // a tapered capsule from (x0,y0) radius r0 to (x1,y1) radius r1 (sprite space: feet at 0,0, y up is negative)
    cap(x0, y0, r0, x1, y1, r1, mat, o) {
      o = o || {}; const S = this.sc, X0 = this.ox + x0 * S, Y0 = this.oy + y0 * S, X1 = this.ox + x1 * S, Y1 = this.oy + y1 * S, R0 = Math.max(0.5, r0 * S), R1 = Math.max(0.5, r1 * S);
      const bx0 = Math.max(0, Math.floor(Math.min(X0 - R0, X1 - R1))), bx1 = Math.min(this.w - 1, Math.ceil(Math.max(X0 + R0, X1 + R1)));
      const by0 = Math.max(0, Math.floor(Math.min(Y0 - R0, Y1 - R1))), by1 = Math.min(this.h - 1, Math.ceil(Math.max(Y0 + R0, Y1 + R1)));
      const dx = X1 - X0, dy = Y1 - Y0, L2s = dx * dx + dy * dy || 1e-6;
      for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
        const px = x + 0.5, py = y + 0.5; let t = ((px - X0) * dx + (py - Y0) * dy) / L2s; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const cx = X0 + dx * t, cy = Y0 + dy * t, r = R0 + (R1 - R0) * t, ex = px - cx, ey = py - cy, d = Math.sqrt(ex * ex + ey * ey);
        if (d > r) continue;
        const k = d / r, ux = d > 1e-4 ? ex / d : 0, uy = d > 1e-4 ? ey / d : 0;
        this.set(y * this.w + x, mat, this.shadeOf(ux * k, uy * k, Math.sqrt(Math.max(0, 1 - k * k)), o, x, y), o.flat != null);
      }
    },
    ell(cx, cy, rx, ry, ang, mat, o) {
      o = o || {}; const S = this.sc, X = this.ox + cx * S, Y = this.oy + cy * S, RX = Math.max(0.5, rx * S), RY = Math.max(0.5, ry * S), ca = Math.cos(ang || 0), sa = Math.sin(ang || 0), R = Math.max(RX, RY);
      for (let y = Math.max(0, Math.floor(Y - R)); y <= Math.min(this.h - 1, Math.ceil(Y + R)); y++) for (let x = Math.max(0, Math.floor(X - R)); x <= Math.min(this.w - 1, Math.ceil(X + R)); x++) {
        const px = x + 0.5 - X, py = y + 0.5 - Y, lx = (px * ca + py * sa) / RX, ly = (-px * sa + py * ca) / RY, k2 = lx * lx + ly * ly;
        if (k2 > 1) continue;
        const nx = lx * ca - ly * sa, ny = lx * sa + ly * ca;
        this.set(y * this.w + x, mat, this.shadeOf(nx, ny, Math.sqrt(Math.max(0, 1 - k2)), o, x, y), o.flat != null);
      }
    },
    // a polygon (flat array of sprite-space points), shaded by a fixed normal o.n = [nx, ny, nz] or o.flat
    poly(pts, mat, o) {
      o = o || {}; const S = this.sc, P = pts.map((v, i) => i & 1 ? this.oy + v * S : this.ox + v * S), n = P.length / 2;
      let y0 = 1e9, y1 = -1e9; for (let i = 1; i < P.length; i += 2) { y0 = Math.min(y0, P[i]); y1 = Math.max(y1, P[i]); }
      const nn = o.n || [0, 0, 1], xs = [];
      for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.h - 1, Math.ceil(y1)); y++) {
        const yc = y + 0.5; xs.length = 0;
        for (let i = 0; i < n; i++) { const ax = P[i * 2], ay = P[i * 2 + 1], bx = P[((i + 1) % n) * 2], by = P[((i + 1) % n) * 2 + 1]; if ((ay <= yc) !== (by <= yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax)); }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.round(xs[k])); x < Math.min(this.w, Math.round(xs[k + 1])); x++) {
          let sh;
          if (o.grad) { const f = (yc - y0) / Math.max(1, y1 - y0); sh = clamp(Math.round(o.grad[0] + (o.grad[1] - o.grad[0]) * f + (((x + y) & 1) ? 0.25 : -0.25)), 0, 4); }
          else sh = this.shadeOf(nn[0], nn[1], nn[2], o, x, y);
          this.set(y * this.w + x, mat, sh, o.flat != null);
        }
      }
    },
    dot(x, y, mat, sh) { const S = this.sc, X = Math.floor(this.ox + x * S), Y = Math.floor(this.oy + y * S); if (X >= 0 && Y >= 0 && X < this.w && Y < this.h) this.set(Y * this.w + X, mat, sh, true); },
    // resolve to pixels: inner lines where a limb overlaps something behind it, a dark outline round the outside
    out(rampsOf, noOut) {
      const w = this.w, h = this.h, m = this.m, s = this.s, g = this.g, f = this.f, pb = new PB(w, h), d = pb.d;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, mi = m[i];
        if (mi) {
          const R = rampsOf[mi]; let c = R[s[i]];
          if (!f[i]) { const gi = g[i]; if ((x > 0 && m[i - 1] && g[i - 1] > gi && !f[i - 1]) || (x < w - 1 && m[i + 1] && g[i + 1] > gi && !f[i + 1]) || (y > 0 && m[i - w] && g[i - w] > gi && !f[i - w]) || (y < h - 1 && m[i + w] && g[i + w] > gi && !f[i + w])) c = R[5]; }
          d[i] = c;
        } else if (!noOut) {
          let n = 0; if (x > 0 && m[i - 1]) n = m[i - 1]; else if (x < w - 1 && m[i + 1]) n = m[i + 1]; else if (y > 0 && m[i - w]) n = m[i - w]; else if (y < h - 1 && m[i + w]) n = m[i + w];
          if (n) d[i] = rampsOf[n][5];
        }
      }
      return pb;
    },
  };

  // ================================================================ the rig: a pose (angles and IK targets) -> joint positions
  const dir = a => [Math.sin(a), Math.cos(a)];           // 0 = straight down, +PI/2 = forward (facing right)
  function ik(rx, ry, tx, ty, a, b, px, py) {
    let dx = tx - rx, dy = ty - ry, d = Math.hypot(dx, dy); const mx = (a + b) * 0.995, mn = Math.abs(a - b) + 0.5;
    if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
    if (d < mn) { if (d < 1e-4) { dx = 0; dy = mn; } else { dx *= mn / d; dy *= mn / d; } d = mn; }
    const base = Math.atan2(dy, dx), off = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
    const j1x = rx + Math.cos(base + off) * a, j1y = ry + Math.sin(base + off) * a, j2x = rx + Math.cos(base - off) * a, j2y = ry + Math.sin(base - off) * a;
    const mx2 = rx + dx / 2, my2 = ry + dy / 2, s1 = (j1x - mx2) * px + (j1y - my2) * py, s2 = (j2x - mx2) * px + (j2y - my2) * py;
    return s1 >= s2 ? [j1x, j1y, rx + dx, ry + dy] : [j2x, j2y, rx + dx, ry + dy];
  }
  const rotL = (ox, oy, a, lx, ly) => [ox + lx * Math.cos(a) - ly * Math.sin(a), oy + lx * Math.sin(a) + ly * Math.cos(a)];
  function solve(C, P) {
    const B = C.b, legLen = B.th + B.sh, armLen = B.ua + B.fa, ank = B.ank;
    const t = P.t || 0, hy = -(P.h == null ? 0.92 : P.h) * legLen - ank * 0.5 + (P.y || 0), hx = (P.hx || 0);
    const J = { t, rot: P.rot || 0, P };
    J.H = [hx, hy];
    J.N = [hx + Math.sin(t) * B.to, hy - Math.cos(t) * B.to];
    const ha = t + (P.n || 0); J.ha = ha;
    J.Hd = [J.N[0] + Math.sin(ha) * (B.nk + B.hr[1]), J.N[1] - Math.cos(ha) * (B.nk + B.hr[1])];
    J.sF = rotL(J.N[0], J.N[1], t, B.sF[0], B.sF[1]); J.sB = rotL(J.N[0], J.N[1], t, B.sB[0], B.sB[1]);
    J.hF = [hx + B.hF[0], hy + B.hF[1]]; J.hB = [hx + B.hB[0], hy + B.hB[1]];
    const arm = (s, A, side) => {
      if (!A) A = side === 'F' ? [0.42, -0.08] : [0.3, 0.05];
      if (Array.isArray(A)) { const r = ik(s[0], s[1], s[0] + A[0] * armLen, s[1] + A[1] * armLen, B.ua, B.fa, -0.35, 1); return [[r[0], r[1]], [r[2], r[3]]]; }
      const u = dir(A.a[0]), f = dir(A.a[0] + A.a[1]); const e = [s[0] + u[0] * B.ua, s[1] + u[1] * B.ua]; return [e, [e[0] + f[0] * B.fa, e[1] + f[1] * B.fa]];
    };
    [J.eF, J.wF] = arm(J.sF, P.fa, 'F'); [J.eB, J.wB] = arm(J.sB, P.ba, 'B');
    const leg = (hp, L, side) => {
      if (!L) L = side === 'F' ? [0.26, 0] : [-0.28, 0];
      if (Array.isArray(L)) { const r = ik(hp[0], hp[1], hx + L[0] * legLen, -ank - (L[1] || 0) * legLen, B.th, B.sh, 1, -0.15); return [[r[0], r[1]], [r[2], r[3]]]; }
      const u = dir(L.a[0]), s = dir(L.a[0] - L.a[1]); const k = [hp[0] + u[0] * B.th, hp[1] + u[1] * B.th]; return [k, [k[0] + s[0] * B.sh, k[1] + s[1] * B.sh]];
    };
    [J.kF, J.aF] = leg(J.hF, P.fl, 'F'); [J.kB, J.aB] = leg(J.hB, P.bl, 'B');
    const foot = (k, a, ov) => {
      const sa = Math.atan2(a[0] - k[0], a[1] - k[1]); let fa;
      if (ov === 'point') fa = sa + 0.35; else if (typeof ov === 'number') fa = ov; else fa = a[1] > -ank - 3 ? PI / 2 : sa + 1.25;
      const d = dir(fa); return [a[0] + d[0] * B.ft, a[1] + d[1] * B.ft];
    };
    J.tF = foot(J.kF, J.aF, P.ff); J.tB = foot(J.kB, J.aB, P.bf);
    // whole-body rotation (flips, falls) about the middle of the body
    if (J.rot) {
      const px = hx, py = hy - B.to * 0.3, ca = Math.cos(J.rot), sa = Math.sin(J.rot);
      for (const k of ['H', 'N', 'Hd', 'sF', 'sB', 'hF', 'hB', 'eF', 'wF', 'eB', 'wB', 'kF', 'aF', 'kB', 'aB', 'tF', 'tB']) { const p = J[k], dx = p[0] - px, dy = p[1] - py; J[k] = [px + dx * ca - dy * sa, py + dx * sa + dy * ca]; }
      J.t += J.rot; J.ha += J.rot;
    }
    if (P.floor) { // lying on the ground: drop the lowest point onto it
      let my = -1e9; for (const k of ['H', 'N', 'Hd', 'eF', 'wF', 'eB', 'wB', 'kF', 'aF', 'kB', 'aB', 'tF', 'tB']) my = Math.max(my, J[k][1] + (k === 'Hd' ? B.hr[1] : k === 'N' ? B.chest[1] * 0.8 : 3));
      const sh = -my + (P.floorY || 0); for (const k of ['H', 'N', 'Hd', 'sF', 'sB', 'hF', 'hB', 'eF', 'wF', 'eB', 'wB', 'kF', 'aF', 'kB', 'aB', 'tF', 'tB']) J[k] = [J[k][0], J[k][1] + sh];
    }
    J.fistF = [J.wF[0] + Math.sin(Math.atan2(J.wF[0] - J.eF[0], J.wF[1] - J.eF[1])) * B.fist * 0.7, J.wF[1] + Math.cos(Math.atan2(J.wF[0] - J.eF[0], J.wF[1] - J.eF[1])) * B.fist * 0.7];
    J.fistB = [J.wB[0] + Math.sin(Math.atan2(J.wB[0] - J.eB[0], J.wB[1] - J.eB[1])) * B.fist * 0.7, J.wB[1] + Math.cos(Math.atan2(J.wB[0] - J.eB[0], J.wB[1] - J.eB[1])) * B.fist * 0.7];
    return J;
  }
  // head-local point: x forward, y down, turned with the head
  const hp = (J, lx, ly) => rotL(J.Hd[0], J.Hd[1], J.ha, lx, ly);
  const tp = (J, lx, ly) => rotL(J.N[0], J.N[1], J.t, lx, ly);       // torso-local, from the neck

  // ================================================================ drawing a fighter's rig into a Rast
  function drawRig(R, C, J, P) {
    const M = C.M, B = C.b, D = C.dress || {};
    const face = P.face || 'n';
    const armDraw = (s, e, w, side, o) => {
      const sl = B.sleeve; // 'long' | 'short' | 'none'
      R.cap(s[0], s[1], B.uaR[0], e[0], e[1], B.uaR[1], sl === 'none' ? M.skin : M[B.sleeveMat || 'top'], o);
      const fm = sl === 'long' ? M[B.sleeveMat || 'top'] : M.skin;
      R.cap(e[0], e[1], B.faR[0], w[0], w[1], B.faR[1], fm, o);
      if (B.cuff) { const k = 0.72; R.cap(lerp(e[0], w[0], k), lerp(e[1], w[1], k), B.faR[1] + 0.9, w[0], w[1], B.faR[1] + 0.6, M[B.cuff], o); }
      const hand = (side === 'F' ? P.hF : P.hB) || 'fist', a = Math.atan2(w[0] - e[0], w[1] - e[1]), d = dir(a), gm = B.glove ? M.glove : M.skin;
      if (hand === 'open') { R.ell(w[0] + d[0] * B.fist * 0.9, w[1] + d[1] * B.fist * 0.9, B.fist * 0.62, B.fist * 1.15, -a, gm, o); R.cap(w[0] + d[0] * B.fist * 0.3 - d[1] * B.fist * 0.5, w[1] + d[1] * B.fist * 0.3 + d[0] * B.fist * 0.5, B.fist * 0.32, w[0] + d[0] * B.fist * 1.0 - d[1] * B.fist * 0.95, w[1] + d[1] * B.fist * 1.0 + d[0] * B.fist * 0.95, B.fist * 0.28, gm, o); }
      else { R.ell(w[0] + d[0] * B.fist * 0.55, w[1] + d[1] * B.fist * 0.55, B.fist * 1.0, B.fist * 0.9, -a, gm, o); R.cap(w[0] + d[0] * B.fist * 0.2 + d[1] * B.fist * 0.55, w[1] + d[1] * B.fist * 0.2 - d[0] * B.fist * 0.55, B.fist * 0.38, w[0] + d[0] * B.fist * 0.9 + d[1] * B.fist * 0.8, w[1] + d[1] * B.fist * 0.9 - d[0] * B.fist * 0.8, B.fist * 0.36, gm, Object.assign({ lb: 0.1 }, o)); }
      if (B.band) R.cap(lerp(e[0], w[0], 0.86), lerp(e[1], w[1], 0.86), B.faR[1] + 0.5, w[0], w[1], B.faR[1] + 0.4, M[B.band], o);
    };
    const legDraw = (h, k, a, t, o) => {
      const pm = M[B.legMat || 'pants'];
      R.cap(h[0], h[1], B.thR[0], k[0], k[1], B.thR[1], pm, o);
      const sm = B.shinMat ? M[B.shinMat] : pm;
      R.cap(k[0], k[1], B.shR[0], a[0], a[1], B.shR[1], sm, o);
      if (B.boot) R.cap(lerp(k[0], a[0], B.boot), lerp(k[1], a[1], B.boot), B.shR[1] + 1.3, a[0], a[1], B.shR[1] + 1.0, M.shoe, o);
      if (B.flare) R.cap(lerp(k[0], a[0], 0.55), lerp(k[1], a[1], 0.55), B.shR[0] * 0.95, a[0], a[1] - 0.5, B.shR[0] * 1.25, pm, o);
      R.cap(a[0], a[1], B.ftR + 0.3, t[0], t[1], B.ftR, B.bare ? M.skin : M.shoe, o);
      if (D.foot) D.foot(R, a, t, o);
    };
    const dB = { dk: 1 }, dF = {};
    R.grp = 1; if (D.back) D.back(R, J, P);
    R.grp = 2; armDraw(J.sB, J.eB, J.wB, 'B', dB);
    R.grp = 3; legDraw(J.hB, J.kB, J.aB, J.tB, dB);
    // the body
    R.grp = 4;
    const H = J.H, N = J.N, t = J.t, cx = tp(J, 0, 0);
    R.cap(H[0], H[1] - 2, B.waR + 1.2, H[0], H[1] + 2.2, B.waR + 1.5, M[B.legMat || 'pants']);                           // hips
    R.cap(N[0] - Math.sin(t) * 2, N[1] + 3, 3, ...hp(J, 0.4, 4.5), 2.6, M.skin);                                          // neck
    R.cap(...tp(J, 0, B.to - 3), B.waR, ...tp(J, 1, B.chest[1] * 0.8), B.chR, M[B.topMat || 'top']);                     // torso
    R.ell(...tp(J, 1.2 + (B.chOff || 0), B.chest[1] * 0.85), B.chest[0], B.chest[1], t, M[B.topMat || 'top']);           // chest
    if (B.belly) R.ell(...tp(J, 2.5 + B.belly[2], B.to - B.belly[1] * 0.85), B.belly[0], B.belly[1], t, M[B.bellyMat || B.topMat || 'top']);
    if (D.torso) D.torso(R, J, P);
    if (B.belt) R.cap(...tp(J, -B.waR - 0.5, B.to - 2.5), 1.9, ...tp(J, B.waR + 1 + (B.belly ? B.belly[2] + 2 : 0), B.to - 2.5), 1.9, M.belt);
    R.ell(...rotL(J.sB[0], J.sB[1], t, 0.5, 1), B.delt * 0.9, B.delt, t, B.sleeve === 'none' ? M.skin : M[B.sleeveMat || 'top'], { dk: 1 });
    R.grp = 5; legDraw(J.hF, J.kF, J.aF, J.tF, dF);
    if (D.hips) D.hips(R, J, P);
    // the head
    R.grp = 6;
    const hr = B.hr;
    R.ell(...hp(J, -0.6, -0.6), hr[0], hr[1], J.ha, M.skin);                       // skull
    R.ell(...hp(J, 1.6, hr[1] * 0.42), hr[0] * 0.74 * (B.jaw || 1), hr[1] * 0.52, J.ha, M.skin);  // jaw
    R.ell(...hp(J, hr[0] - 0.2, 0.9), 1.45, 1.9, J.ha, M.skin, { lb: 0.1 });        // nose
    R.ell(...hp(J, -1.6, 0.6), 1.4, 2.0, J.ha, M.skin, { dk: 1 });                  // ear
    if (D.head0) D.head0(R, J, P);
    // the face
    const ex = hr[0] * 0.52, ey = -0.7;
    if (face === 'ko') { R.cap(...hp(J, ex - 1, ey - 1), 0.5, ...hp(J, ex + 1, ey + 1), 0.5, M.eye, { flat: 2 }); R.cap(...hp(J, ex - 1, ey + 1), 0.5, ...hp(J, ex + 1, ey - 1), 0.5, M.eye, { flat: 2 }); }
    else if (face === 'hurt') { R.cap(...hp(J, ex - 1.2, ey - 1), 0.5, ...hp(J, ex + 1, ey), 0.5, M.eye, { flat: 2 }); R.cap(...hp(J, ex + 1, ey), 0.5, ...hp(J, ex - 1.2, ey + 1), 0.5, M.eye, { flat: 2 }); }
    else if (face === 'happy') { R.cap(...hp(J, ex - 1, ey), 0.5, ...hp(J, ex, ey - 1), 0.5, M.eye, { flat: 2 }); R.cap(...hp(J, ex, ey - 1), 0.5, ...hp(J, ex + 1, ey), 0.5, M.eye, { flat: 2 }); }
    else { R.cap(...hp(J, ex, ey - 0.6), 0.5, ...hp(J, ex, ey + 0.6), 0.5, M.eye, { flat: 2 }); R.dot(...hp(J, ex + 1.05, ey), M.white, 1); }
    if (!B.noBrow) R.cap(...hp(J, ex - 1.0, ey - 2.6), 0.5, ...hp(J, ex + 1.6, ey - (face === 'angry' || face === 'shout' ? 1.8 : 2.5)), 0.5, M[B.browMat || 'hair'], { flat: 3 });
    if (face === 'shout' || face === 'hurt' || face === 'ko') R.ell(...hp(J, hr[0] * 0.62, hr[1] * 0.58), 1.3, face === 'ko' ? 0.9 : 1.5, J.ha, M.mouth, { flat: 2 });
    else if (face === 'happy' || face === 'win') R.cap(...hp(J, hr[0] * 0.38, hr[1] * 0.5), 0.5, ...hp(J, hr[0] * 0.8, hr[1] * 0.5 - 0.6), 0.5, M.mouth, { flat: 2 });
    else R.cap(...hp(J, hr[0] * 0.45, hr[1] * 0.56), 0.45, ...hp(J, hr[0] * 0.8, hr[1] * 0.52), 0.45, M.mouth, { flat: 3 });
    if (D.head) D.head(R, J, P);
    R.grp = 7;
    R.ell(...rotL(J.sF[0], J.sF[1], t, 0, 0.5), B.delt, B.delt * 1.05, t, B.sleeve === 'none' ? M.skin : M[B.sleeveMat || 'top']);
    armDraw(J.sF, J.eF, J.wF, 'F', dF);
    R.grp = 8; if (D.front) D.front(R, J, P);
  }

  // ================================================================ the scrappers
  // b: the build (px at 1x): th/sh thigh+shin, to torso, ua/fa arms, radii, hr head radii, sF/sB shoulder offsets (torso-local)
  const BASE = { th: 21, sh: 21, to: 25, nk: 2.5, ua: 14, fa: 13, thR: [6.2, 4.7], shR: [4.4, 3.0], uaR: [4.3, 3.6], faR: [3.8, 3.1], fist: 3.7, ft: 7.5, ftR: 2.6, ank: 3.2,
    waR: 7.2, chR: 9, chest: [10.5, 9], delt: 4.8, hr: [6.2, 6.9], sF: [3.5, 3.2], sB: [-4.5, 2.4], hF: [2, 2.5], hB: [-3, 2], sleeve: 'none' };
  const bld = o => Object.assign({}, BASE, o);
  // hair / hats / extras are little functions drawing more primitives
  const D_hair = (R, J, M) => { R.ell(...hp(J, -3.0, -4.7), 5.9, 4.1, J.ha, M.hair); R.ell(...hp(J, 1.8, -6.0), 3.2, 1.9, J.ha - 0.2, M.hair); R.ell(...hp(J, -4.6, -1.6), 2.8, 4.6, J.ha, M.hair); };
  const D_spikes = (R, J, M, n, len) => { for (let i = 0; i < n; i++) { const a = -2.2 + i * 0.5, b = a + 0.25; const p0 = hp(J, Math.cos(a) * 5.5, Math.sin(a) * 6), p1 = hp(J, Math.cos(b) * (6 + len) - 2, Math.sin(b) * (6 + len)), p2 = hp(J, Math.cos(a + 0.5) * 5.5, Math.sin(a + 0.5) * 6); R.poly([...p0, ...p1, ...p2], M.hair, { n: [Math.cos(b) * 0.6, Math.sin(b) * 0.6, 0.5] }); } };
  const CH = [
    { id: 'kenji', name: 'KENJI', land: 'JAPAN', flag: 'jp', stage: 'tokyo', map: [212, 52], style: 'KARATE CHAMP',
      bio: 'TRAINS ALL DAY. EATS RICE ALL NIGHT.', note: "JACK'S MAIN!",
      b: bld({ sleeve: 'short', belt: 1, bare: 1 }),
      pal: { skin: '#e8b07c', top: '#3a5cc8', pants: '#3a5cc8', belt: '#262230', hair: '#3a2418', acc: '#d82a2a', shoe: '#e8b07c' },
      alt: { top: '#f2f0e6', pants: '#f2f0e6', acc: '#202020' },
      dress: {
        back(R, J, P) { const w = P.wind || 0; R.cap(...hp(J, -5.5, -4.8), 1.1, ...hp(J, -11.5, -3.6 + w * 2), 0.8, this.M.acc); R.cap(...hp(J, -5.5, -4.4), 1.0, ...hp(J, -10.5, 0 + w), 0.7, this.M.acc, { dk: 1 }); },
        torso(R, J) { const a = tp(J, 1.5, 1.5), b = tp(J, 6.5, 2), c = tp(J, 4, 10); R.poly([...a, ...b, ...c], this.M.skin, { n: [0.1, -0.2, 0.9] }); },
        head(R, J) { const M = this.M; D_hair(R, J, M); D_spikes(R, J, M, 5, 3.5); R.cap(...hp(J, -5.9, -4.6), 0.95, ...hp(J, 4.8, -5.4), 0.95, M.acc); },
      },
      moves: ['ball', 'skyfist', 'twister'], win: 'fistup', quote: ['THE FIGHT IS IN THE FISTS.', 'NOW I CAN HAVE MY RICE.'] },
    { id: 'barry', name: 'BIG BARRY', land: 'ENGLAND', flag: 'en', stage: 'pier', map: [118, 38], style: 'SEASIDE STRONGMAN',
      bio: 'LIFTS DONKEYS FOR FUN. LOVES A PASTY.', note: "DAVE'S MAIN",
      b: bld({ th: 23, sh: 21, to: 30, ua: 16, fa: 15, thR: [8.2, 6.2], shR: [6.2, 4.4], uaR: [6.6, 5.6], faR: [6.0, 4.8], fist: 5.3, ft: 9, ftR: 3.4, ank: 4,
        waR: 11, chR: 13.5, chest: [15, 12], belly: [11, 10.5, 3], delt: 7.5, hr: [6.4, 7.2], sF: [5, 4], sB: [-7, 3], hF: [3, 3], hB: [-4, 2.5], boot: 0.55, jaw: 1.15 }),
      pal: { skin: '#f0b494', top: '#d42c2c', top2: '#f4ead2', pants: '#d42c2c', hair: '#6e3a18', shoe: '#3c2a1e' },
      alt: { top: '#2a54c8', pants: '#2a54c8' },
      dress: {
        torso(R, J) { const M = this.M; for (let i = 0; i < 4; i++) { const y = 9 + i * 5.2; R.cap(...tp(J, -13, y), 1.5, ...tp(J, 14 + (i > 1 ? 4 : 0), y), 1.5, M.top2, { lb: 0.05 }); } R.cap(...tp(J, -2, -1), 3, ...tp(J, 6, 0), 3, M.skin); R.ell(...tp(J, 3, 2), 9, 4, J.t, M.skin); },
        head(R, J) { const M = this.M; R.ell(...hp(J, -4.2, 1), 2.2, 4.2, J.ha, M.hair, { dk: 1 }); R.cap(...hp(J, 2.2, 3.1), 1.4, ...hp(J, 7.3, 2.7), 1.3, M.hair); R.cap(...hp(J, 6.6, 2.6), 1.2, ...hp(J, 8.6, 1.2), 0.9, M.hair); R.cap(...hp(J, 2.4, 3.2), 1.2, ...hp(J, 0.6, 5), 0.9, M.hair); },
      },
      moves: ['pierdriver', 'windmill'], win: 'flex', quote: ['FANCY A PASTY? I KNOW I DO.', 'YOU WANT TO EAT MORE CHIPS, YOU.'] },
    { id: 'luana', name: 'LUANA', land: 'BRAZIL', flag: 'br', stage: 'rio', map: [90, 88], style: 'CAPOEIRA DANCER',
      bio: 'NEVER STOPS DANCING. NOT EVEN IN BED.', note: '',
      b: bld({ th: 21, sh: 21, to: 23, ua: 13.5, fa: 12.5, thR: [5.6, 4.1], shR: [4.0, 2.6], uaR: [3.4, 2.9], faR: [3.0, 2.5], fist: 3.2, ft: 7, ftR: 2.3,
        waR: 5.6, chR: 7.4, chest: [8.2, 7.6], delt: 3.8, hr: [5.8, 6.6], sF: [3, 2.8], sB: [-3.8, 2.2], belt: 1, bare: 1, flare: 1, band: 'acc' }),
      pal: { skin: '#a2643c', top: '#28a648', pants: '#f2f0e4', belt: '#f0c420', hair: '#1e1410', acc: '#f0c420', shoe: '#a2643c' },
      alt: { top: '#8a3ac8', pants: '#f0c420', belt: '#28a648' },
      dress: {
        torso(R, J) { R.cap(...tp(J, -3.5, 18), 3.2, ...tp(J, 5, 18.5), 3.4, this.M.skin); },
        back(R, J, P) { const M = this.M, w = P.wind || 0; let p = hp(J, -5, -1); for (let i = 0; i < 6; i++) { const q = [p[0] - 2.2 + w * 0.6 * i, p[1] + 4]; R.ell(q[0], q[1], 2.3, 2.6, 0.3, M.hair, { lb: 0.1 }); p = q; } R.ell(p[0], p[1] + 2.5, 1.6, 2.2, 0, M.acc); },
        head(R, J) { const M = this.M; D_hair(R, J, M); R.ell(...hp(J, 3, -4.9), 3.2, 1.8, J.ha - 0.3, M.hair); R.cap(...hp(J, -6.2, -3.6), 1.0, ...hp(J, 3.6, -6.4), 1.0, M.acc); },
      },
      moves: ['roll', 'spring'], win: 'dance', quote: ['FEEL THE RHYTHM? YOU FELT MY FOOT.', 'CARNIVAL STARTS NOW!'] },
    { id: 'olga', name: 'OLGA', land: 'RUSSIA', flag: 'ru', stage: 'rink', map: [164, 32], style: 'ICE SKATER',
      bio: 'THREE GOLD MEDALS AND A VERY COLD NOSE.', note: '',
      b: bld({ th: 21, sh: 20, to: 22, ua: 13, fa: 12, thR: [5.4, 4.0], shR: [3.9, 2.6], uaR: [3.2, 2.7], faR: [2.9, 2.4], fist: 3.1, ft: 7.5, ftR: 2.6, ank: 6,
        waR: 5.4, chR: 7.2, chest: [8, 7.4], delt: 3.6, hr: [5.7, 6.5], sF: [3, 2.8], sB: [-3.8, 2.2], legMat: 'tights', shinMat: 'tights', boot: 0.62, cuff: 'top2' }),
      pal: { skin: '#f4caa4', top: '#8c3cc0', top2: '#f2f2fa', pants: '#8c3cc0', tights: '#e8b49c', hair: '#f2cc5e', shoe: '#f4f4f8', acc: '#a8d8ff' },
      alt: { top: '#d02a4a', shoe: '#2a2a34', top2: '#202020' },
      dress: {
        hips(R, J) { const M = this.M, a = tp(J, -9, J.P.skirt ? 21 : 22), b = tp(J, 9, 21), c = tp(J, 12, 31), d = tp(J, -12, 31); R.poly([...a, ...b, ...c, ...d], M.top, { grad: [1, 3] }); R.cap(...tp(J, -12, 31), 0.8, ...tp(J, 12, 31), 0.8, M.top2, { flat: 1 }); },
        foot(R, a, t) { const M = this.M; R.cap(a[0] - 1, a[1] + 4.2, 0.6, t[0] + 2, t[1] + 4.2, 0.6, M.acc, { flat: 1 }); R.cap(a[0], a[1] + 2.5, 0.5, a[0], a[1] + 4, 0.5, M.acc, { flat: 2 }); R.cap(t[0], t[1] + 2.5, 0.5, t[0], t[1] + 4, 0.5, M.acc, { flat: 2 }); },
        head(R, J) { const M = this.M; D_hair(R, J, M); R.ell(...hp(J, -4.5, -6.5), 3.6, 3.4, J.ha, M.hair, { lb: 0.1 }); R.ell(...hp(J, 3.2, -4.9), 3, 1.8, J.ha - 0.4, M.hair); R.cap(...hp(J, -2, -6.8), 0.9, ...hp(J, 2.5, -6.5), 0.9, M.acc, { lb: 0.3 }); },
      },
      moves: ['axel', 'spike', 'snowball'], win: 'spin', quote: ['TEN POINTS FROM THE JUDGES. ZERO FOR YOU.', 'THAT WAS NOT EVEN MY BEST SPIN.'] },
    { id: 'kip', name: 'KIP', land: 'KENYA', flag: 'ke', stage: 'safari', map: [150, 86], style: 'MARATHON MAN',
      bio: 'RUNS TO SCHOOL. RUNS HOME. RUNS EVERYWHERE.', note: "CAL'S MAIN",
      b: bld({ th: 24, sh: 24, to: 24, ua: 15, fa: 14, thR: [5.2, 3.9], shR: [3.7, 2.4], uaR: [3.5, 2.9], faR: [3.1, 2.5], fist: 3.4, ft: 8, ftR: 2.6,
        waR: 6, chR: 8, chest: [8.8, 8], delt: 4, hr: [5.8, 6.8], sF: [3, 3], sB: [-4, 2.2], shinMat: 'skin', band: 'acc' }),
      pal: { skin: '#6c3c24', top: '#d62a2a', top2: '#20983c', pants: '#22222a', hair: '#140c08', shoe: '#f4f4f0', acc: '#20983c' },
      alt: { top: '#20983c', top2: '#f0c020', pants: '#f4f4f0' },
      dress: {
        torso(R, J) { const M = this.M; R.cap(...tp(J, -6, 3), 0.9, ...tp(J, -6, 20), 0.9, M.top2); R.cap(...tp(J, 6.5, 3), 0.9, ...tp(J, 6.5, 20), 0.9, M.top2); R.poly([...tp(J, -1.5, 8), ...tp(J, 8, 8), ...tp(J, 8, 15.5), ...tp(J, -1.5, 15.5)], M.white, { flat: 1 }); R.cap(...tp(J, 2, 9.6), 0.5, ...tp(J, 5, 9.6), 0.5, M.eye, { flat: 2 }); R.cap(...tp(J, 5, 9.6), 0.5, ...tp(J, 3, 13.6), 0.5, M.eye, { flat: 2 }); },
        hips(R, J) { R.cap(J.H[0] - 5, J.H[1] + 4, 3.6, J.H[0] + 5, J.H[1] + 4, 3.8, this.M.pants); },
        foot(R, a, t, o) { R.cap(a[0] + 1, a[1] + 1, 0.6, t[0] - 1, t[1] - 0.5, 0.6, this.M.top, Object.assign({ flat: 2 }, o)); },
        head(R, J) { const M = this.M; R.ell(...hp(J, -2, -4.4), 6.2, 3.9, J.ha, M.hair); R.ell(...hp(J, -4.3, -2), 2.6, 3.6, J.ha, M.hair); R.cap(...hp(J, -5.6, -2.4), 1.3, ...hp(J, 5.4, -3.4), 1.3, M.acc); },
      },
      moves: ['sprint', 'leap'], win: 'arms', quote: ['YOU ARE FAST. JUST NOT FAST ENOUGH.', 'TIME FOR MY SECOND MARATHON OF THE DAY.'] },
    { id: 'gaston', name: 'GASTON', land: 'FRANCE', flag: 'fr', stage: 'paris', map: [124, 44], style: 'MASTER CHEF',
      bio: 'MAKES 100 PANCAKES A MINUTE. SLAPS THE SAME.', note: '',
      b: bld({ th: 18, sh: 17, to: 25, ua: 13, fa: 12, thR: [7.4, 5.4], shR: [5.4, 3.8], uaR: [5.2, 4.4], faR: [4.6, 3.8], fist: 4.4, ft: 8, ftR: 3, ank: 3.6,
        waR: 11.5, chR: 11.5, chest: [12.5, 11], belly: [13, 12, 3], delt: 5.6, hr: [6.6, 7.1], sF: [4, 3.5], sB: [-6, 3], hF: [3, 2.5], hB: [-4, 2], sleeve: 'long', cuff: 'top', jaw: 1.1 }),
      pal: { skin: '#f2c2a0', top: '#f6f6ee', top2: '#c4c4bc', pants: '#2a2a34', pants2: '#f2f2ea', hair: '#3c2418', shoe: '#2a2a2a', acc: '#d4282c' },
      alt: { top: '#f0dca0', acc: '#2a52c8', pants: '#5a2a1a' },
      dress: {
        torso(R, J) { const M = this.M; for (let i = 0; i < 3; i++) { R.ell(...tp(J, 6, 8 + i * 6), 1.1, 1.1, 0, M.top2); R.ell(...tp(J, 11, 9 + i * 6), 1.1, 1.1, 0, M.top2); } R.cap(...tp(J, -4, 0), 3.2, ...tp(J, 6, 1), 3.2, M.acc); R.poly([...tp(J, 3, 1), ...tp(J, 9, 2), ...tp(J, 5, 8)], M.acc, { n: [0.2, -0.3, 0.9] }); },
        head(R, J) { const M = this.M; R.ell(...hp(J, -2.5, -3.6), 6, 3.6, J.ha, M.hair); R.cap(...hp(J, -3, -6), 5.5, ...hp(J, -2, -15), 6.6, M.top, { lb: 0.05 }); R.ell(...hp(J, -2, -16), 7.2, 4.4, J.ha, M.top); R.cap(...hp(J, -6, -6), 1.2, ...hp(J, 3, -6.4), 1.2, M.top2, { flat: 2 });
          R.cap(...hp(J, 3, 3.2), 1.3, ...hp(J, 8.5, 2.6), 1.1, M.hair); R.cap(...hp(J, 8.5, 2.6), 1.0, ...hp(J, 10.2, 0.6), 0.7, M.hair); R.cap(...hp(J, 3, 3.2), 1.1, ...hp(J, 0.5, 2.2), 0.7, M.hair); },
      },
      moves: ['slaps', 'souffle'], win: 'twirl', quote: ['OOH LA LA! YOU ARE FLATTER THAN A CREPE.', 'TOO MANY COOKS? NO. JUST ONE. ME.'] },
    { id: 'hank', name: 'HANK', land: 'USA', flag: 'us', stage: 'rodeo', map: [56, 46], style: 'RODEO COWBOY',
      bio: 'RIDES BULLS. WRESTLES BEARS. HUGS HIS MOM.', note: "LUKE'S MAIN",
      b: bld({ th: 22, sh: 21, to: 26, ua: 15, fa: 14, thR: [6.6, 5], shR: [5, 3.6], uaR: [4.9, 4.1], faR: [4.3, 3.5], fist: 4.2, ft: 8.5, ftR: 2.9, ank: 3.8,
        waR: 8, chR: 10.5, chest: [11.5, 10], delt: 5.4, hr: [6.4, 7.2], sF: [4, 3.4], sB: [-5, 2.6], sleeve: 'long', belt: 1, boot: 0.42, jaw: 1.15 }),
      pal: { skin: '#e2a676', top: '#c42a2a', top2: '#7a4822', pants: '#3a5aa4', belt: '#563418', hair: '#6a4626', shoe: '#6a3a1c', acc: '#2a5ad2', hat: '#c8a06a' },
      alt: { top: '#2a6ac8', hat: '#2a2a2e', acc: '#c42a2a' },
      dress: {
        torso(R, J) { const M = this.M; R.poly([...tp(J, -10, 1), ...tp(J, -1, 2), ...tp(J, -3, 22), ...tp(J, -10, 22)], M.top2, { grad: [1, 3] }); R.poly([...tp(J, 5, 2), ...tp(J, 11, 1), ...tp(J, 12, 22), ...tp(J, 7, 22)], M.top2, { grad: [1, 3] }); R.poly([...tp(J, -2, -1), ...tp(J, 7, 0), ...tp(J, 3, 6)], M.acc, { n: [0.2, -0.3, 0.9] }); R.ell(...tp(J, 3, 23.5), 2.4, 1.8, J.t, M.hat, { lb: 0.3 }); },
        head(R, J) { const M = this.M; R.ell(...hp(J, -3, -1), 4, 5, J.ha, M.hair, { dk: 1 }); R.ell(...hp(J, -0.5, -4.5), 12, 2.6, J.ha, M.hat); R.cap(...hp(J, -1, -6.5), 5.5, ...hp(J, -0.5, -10), 5, M.hat, { lb: 0.1 }); R.cap(...hp(J, -5.5, -6.6), 1.0, ...hp(J, 4.6, -6.6), 1.0, M.belt, { flat: 3 }); },
      },
      moves: ['lasso', 'rodeo'], win: 'hat', quote: ['YEE-HAW! NOW GET OFF MY RANCH.', 'MY MOM HITS HARDER THAN YOU.'] },
    { id: 'mei', name: 'MEI', land: 'CHINA', flag: 'cn', stage: 'market', map: [196, 58], style: 'KUNG FU STAR',
      bio: 'KICKS FASTER THAN YOU CAN BLINK. TRY IT.', note: '',
      b: bld({ th: 21, sh: 20, to: 22, ua: 13, fa: 12, thR: [6.2, 4.4], shR: [4.4, 2.8], uaR: [3.4, 2.9], faR: [3.1, 2.5], fist: 3.2, ft: 7, ftR: 2.4,
        waR: 5.6, chR: 7.4, chest: [8.2, 7.6], delt: 3.8, hr: [5.7, 6.5], sF: [3, 2.8], sB: [-3.8, 2.2], sleeve: 'long', cuff: 'top2', belt: 1 }),
      pal: { skin: '#f2c8a2', top: '#2a62d2', top2: '#f2c840', pants: '#f4f2ea', belt: '#f2c840', hair: '#1c1418', shoe: '#2a2a38', acc: '#e83a4a' },
      alt: { top: '#d42a3a', acc: '#f2c840', pants: '#2a2a38', belt: '#2a2a38' },
      dress: {
        torso(R, J) { const M = this.M; R.cap(...tp(J, 0, 0), 1.2, ...tp(J, 5, 14), 1.2, M.top2); R.cap(...tp(J, -3, 0.5), 1.4, ...tp(J, 4, 0.5), 1.4, M.top2); },
        head(R, J) { const M = this.M; D_hair(R, J, M); R.ell(...hp(J, 3, -4.9), 3, 1.8, J.ha - 0.4, M.hair);
          for (const s of [-1, 1]) { const c = hp(J, -3 + s * 3.6, -7); R.ell(c[0], c[1], 3.3, 3.1, 0, M.hair, { lb: 0.1 }); R.ell(c[0] - 1.5, c[1] - 2.2, 1.6, 1.1, 0.5, M.acc, { lb: 0.2 }); } },
      },
      moves: ['legs', 'palm', 'phoenix'], win: 'vsign', quote: ['TOO SLOW! MY GRAN KICKS FASTER.', 'I WARMED UP MORE THAN THAT.'] },
    { id: 'baron', name: 'THE BARON', land: 'THE SKY', flag: 'sky', stage: 'airship', map: [0, 0], style: 'EVIL GENIUS', boss: 1,
      bio: 'RUNS THE WHOLE TOURNAMENT. FROM A BLIMP.', note: '',
      b: bld({ th: 24, sh: 23, to: 31, ua: 17, fa: 16, thR: [7.6, 5.6], shR: [6, 4.4], uaR: [6.4, 5.4], faR: [5.6, 4.6], fist: 5.4, ft: 9, ftR: 3.3, ank: 4,
        waR: 10, chR: 13.5, chest: [14.5, 12.5], delt: 8, hr: [6.6, 7.4], sF: [5, 4], sB: [-7, 3], hF: [3, 3], hB: [-4, 2.5], sleeve: 'long', glove: 1, boot: 0.4, belt: 1, jaw: 1.2 }),
      pal: { skin: '#e6bea0', top: '#6c1a2c', top2: '#f0c040', pants: '#262634', belt: '#141418', hair: '#dadad8', shoe: '#18181c', glove: '#f4f4f0', hat: '#262634', cape: '#2c1a44', cape2: '#c02a3a' },
      alt: {},
      dress: {
        back(R, J, P) { const M = this.M, w = (P.wind || 0) * 3, s = J.sB, s2 = J.sF; R.poly([s[0] - 2, s[1] - 2, s2[0] + 2, s2[1] - 2, J.H[0] - 8 - w, J.H[1] + 34, J.H[0] - 26 - w * 2, J.H[1] + 30], M.cape, { grad: [1, 4] }); R.poly([s[0] - 1, s[1], J.H[0] - 9 - w, J.H[1] + 32, J.H[0] - 24 - w * 2, J.H[1] + 29], M.cape2, { grad: [2, 4] }); },
        torso(R, J) { const M = this.M; for (let i = 0; i < 4; i++) R.ell(...tp(J, 8, 6 + i * 6), 1.3, 1.3, 0, M.top2); R.cap(...tp(J, -14, 3), 1, ...tp(J, 0, 3), 1, M.top2, { flat: 2 }); },
        head(R, J) { const M = this.M; R.ell(...hp(J, -1, -5), 8, 3, J.ha, M.hat); R.cap(...hp(J, -2, -8), 5.5, ...hp(J, 1, -9), 6.5, M.hat); R.ell(...hp(J, 6.5, -4.5), 4, 1.3, J.ha + 0.2, M.belt); R.ell(...hp(J, 4, -9), 2.2, 2.2, 0, M.top2, { lb: 0.3 });
          R.cap(...hp(J, 2, 3), 1.5, ...hp(J, 9, 2.4), 1.2, M.hair); R.cap(...hp(J, 9, 2.4), 1.0, ...hp(J, 10, 0.4), 0.8, M.hair); R.ell(...hp(J, 3.5, -0.8), 1.9, 1.9, 0, M.top2, { flat: 1 }); },
        front(R, J) { R.ell(...rotL(J.sF[0], J.sF[1], J.t, 0, -1), 5, 2.4, J.t, this.M.top2); },
      },
      moves: ['blaster', 'crusher', 'barrage'], win: 'laugh', quote: ['BOW BEFORE THE BARON! OR AT LEAST WAVE.', 'MY BLIMP. MY RULES. MY WIN.'] },
  ];
  const CHI = {}; CH.forEach((c, i) => { CHI[c.id] = c; c.i = i; });
  const ROSTER = CH.filter(c => !c.boss);
  // materials: names -> index, and ramps for a palette (alt: the other colours for a mirror match)
  const MATS = ['skin', 'top', 'top2', 'pants', 'pants2', 'tights', 'belt', 'hair', 'shoe', 'glove', 'acc', 'hat', 'cape', 'cape2', 'eye', 'white', 'mouth'];
  function prepChar(C, alt) {
    const pal = Object.assign({ top2: '#e0e0e0', pants2: '#888', tights: '#e0b0a0', belt: '#222', glove: '#eee', acc: '#eee', hat: '#666', cape: '#333', cape2: '#933', shoe: '#333' }, C.pal, alt ? C.alt : {}, { eye: '#1c1424', white: '#f8f8f8', mouth: '#6a2030' });
    const M = {}, RA = [null]; MATS.forEach((n, i) => { M[n] = i + 1; RA.push(ramp(pal[n])); });
    RA[M.eye] = [hex32('#1c1424'), hex32('#1c1424'), hex32('#1c1424'), hex32('#100c18'), hex32('#100c18'), hex32('#100c18')];
    RA[M.white] = [hex32('#ffffff'), hex32('#f0f0f8'), hex32('#e0e0e8'), hex32('#c0c0d0'), hex32('#a0a0b0'), hex32('#202030')];
    const dress = {}; for (const k in C.dress || {}) dress[k] = C.dress[k].bind({ M });
    return { b: C.b, M, RA, dress, C };
  }

  // ================================================================ poses (facing right). legs: [dx, lift] in leg lengths from the hips (planted
  // when lift is 0) or {a: [thigh angle, knee bend]}; arms: [dx, dy] in arm lengths from the shoulder or {a: [upper, elbow]}
  const X = (a, b) => Object.assign({}, a, b);
  const STANCE = {
    kenji: { h: 0.85, t: 0.16, n: -0.08, fl: [0.29, 0], bl: [-0.3, 0], fa: [0.52, -0.36], ba: [0.3, -0.16] },
    barry: { h: 0.88, t: 0.1, n: -0.05, fl: [0.3, 0], bl: [-0.32, 0], fa: [0.5, -0.12], ba: [0.38, 0.0] },
    luana: { h: 0.8, t: 0.1, n: -0.05, fl: [0.32, 0], bl: [-0.34, 0], fa: [0.42, -0.42], ba: [-0.25, 0.25], hF: 'open', hB: 'open' },
    olga: { h: 0.9, t: 0.06, n: -0.04, fl: [0.18, 0], bl: [-0.24, 0], fa: [0.55, -0.28], ba: [-0.35, 0.15], hF: 'open', hB: 'open' },
    kip: { h: 0.88, t: 0.14, n: -0.06, fl: [0.25, 0], bl: [-0.25, 0], fa: [0.48, -0.42], ba: [0.3, -0.3] },
    gaston: { h: 0.87, t: 0.05, n: -0.02, fl: [0.28, 0], bl: [-0.3, 0], fa: [0.55, -0.25], ba: [0.42, -0.08], hF: 'open', hB: 'open' },
    hank: { h: 0.88, t: 0.12, n: -0.05, fl: [0.27, 0], bl: [-0.29, 0], fa: [0.5, -0.3], ba: [0.34, -0.12] },
    mei: { h: 0.82, t: 0.08, n: -0.04, fl: [0.3, 0], bl: [-0.3, 0], fa: [0.58, -0.32], ba: [0.18, -0.4], hF: 'open', hB: 'open' },
    baron: { h: 0.9, t: 0.06, n: -0.06, fl: [0.24, 0], bl: [-0.26, 0], fa: [0.4, -0.15], ba: [0.3, 0.05] },
  };
  const TUCK = { fl: { a: [1.45, 2.55] }, bl: { a: [1.05, 2.45] }, fa: [0.35, -0.2], ba: [0.25, -0.05], t: 0.3, h: 0.95 };
  const spin6 = (base, dirn, n) => Array.from({ length: n || 6 }, (_, i) => X(base, { rot: dirn * i / (n || 6) * TAU }));
  function poseSet(C) {
    const S = STANCE[C.id], id = C.id, big = C.b.th + C.b.sh > 43;
    const st = (o) => X(S, o);
    const cr = X(S, { h: 0.5, t: 0.45, n: -0.36, fl: [0.34, 0], bl: [-0.28, 0], fa: [0.5, -0.22], ba: [0.34, -0.05] });
    const P = {};
    P.idle = [0, 1, 2, 3].map(i => { const b = Math.sin(i / 4 * TAU), c = Math.cos(i / 4 * TAU);
      if (id === 'luana') return st({ hx: c * 4, t: 0.1 + b * 0.06, fl: [0.32 - c * 0.12, Math.max(0, -c) * 0.06], bl: [-0.34 + c * 0.1, Math.max(0, c) * 0.06], fa: [0.42 + c * 0.1, -0.42 + b * 0.08], ba: [-0.25 - c * 0.15, 0.2], wind: c });
      if (id === 'olga') return st({ h: 0.9 + b * 0.01, hx: b * 1.5, fa: [0.55, -0.28 + b * 0.05], wind: b });
      return st({ h: S.h + b * 0.013, t: S.t + b * 0.012, fa: [S.fa[0], S.fa[1] + b * 0.03], ba: [S.ba[0], S.ba[1] + b * 0.03], wind: b }); });
    P.walk = [0, 1, 2, 3, 4, 5].map(i => { const ph = i / 6 * TAU;
      return st({ h: S.h + 0.015 * Math.cos(2 * ph), fl: [S.fl[0] * 0.75 + 0.12 * Math.cos(ph), 0.07 * Math.max(0, Math.sin(ph))], bl: [S.bl[0] * 0.75 - 0.12 * Math.cos(ph), 0.07 * Math.max(0, -Math.sin(ph))], wind: Math.sin(ph) }); });
    P.crouch = [X(S, { h: 0.66, t: 0.3, n: -0.2 }), cr];
    P.pre = [X(S, { h: 0.7, t: 0.25, n: -0.15, fl: [0.25, 0], bl: [-0.25, 0] })];
    P.jump = [X(TUCK, { fl: { a: [0.9, 1.6] }, bl: { a: [0.25, 1.2] }, t: 0.1, fa: [0.4, -0.5], ba: [0.3, -0.35], wind: -1 }), X(TUCK, { wind: -1 }), X(TUCK, { fl: { a: [0.55, 0.8] }, bl: { a: [0.1, 0.5] }, t: 0.12, fa: [0.45, -0.25], wind: 1 })];
    P.flip = spin6(X(TUCK, { t: 0.55, fl: { a: [1.7, 2.7] }, bl: { a: [1.5, 2.6] }, fa: [0.45, 0.25], ba: [0.38, 0.32] }), 1);
    // standing normals
    P.lp = [st({ fa: [0.7, -0.32] }), st({ t: 0.22, hx: 1, fa: [0.99, -0.04], face: 'shout' }), st({ fa: [0.75, -0.3] })];
    P.mp = [st({ t: 0.1, ba: [0.25, -0.3] }), st({ t: 0.34, hx: 3, ba: [0.99, 0.0], fa: [0.3, 0.12], face: 'shout' }), st({ t: 0.25, hx: 2, ba: [0.65, -0.05] })];
    P.hp = [st({ t: 0.0, hx: -3, ba: [-0.15, -0.15], fa: [0.45, -0.4] }), st({ t: 0.44, hx: 5, h: S.h - 0.04, fl: [0.38, 0], ba: [0.99, -0.06], fa: [0.12, 0.05], face: 'shout' }), st({ t: 0.32, hx: 3, ba: [0.72, -0.1], fa: [0.2, -0.1] })];
    P.lk = [st({ t: 0.05, bl: [-0.08, 0], fl: { a: [0.8, 1.2] } }), st({ t: -0.02, bl: [-0.06, 0], fl: { a: [1.25, 0.15] }, ff: 'point', face: 'shout' }), st({ bl: [-0.1, 0], fl: { a: [0.8, 1.0] } })];
    P.mk = [st({ t: 0.0, bl: [-0.05, 0], fl: { a: [1.25, 1.9] } }), st({ t: -0.2, n: 0.15, bl: [-0.05, 0], fl: { a: [1.65, 0.08] }, ff: 'point', face: 'shout' }), st({ t: -0.05, bl: [-0.07, 0], fl: { a: [1.2, 1.5] } })];
    P.hk = [st({ t: -0.05, fl: [0.06, 0], bl: { a: [0.9, 1.9] }, fa: [0.45, -0.45] }), st({ t: -0.45, n: 0.35, hx: 2, fl: [0.0, 0], bl: { a: [2.12, 0.12] }, bf: 'point', fa: [0.1, -0.2], ba: [-0.4, 0.1], face: 'shout' }), st({ t: -0.25, n: 0.2, fl: [0.02, 0], bl: { a: [1.6, 1.3] } }), st({ t: -0.05, fl: [0.1, 0], bl: { a: [0.6, 1.4] } })];
    // crouching normals
    P.clp = [X(cr, { fa: [0.7, -0.05] }), X(cr, { t: 0.5, fa: [0.99, 0.02], face: 'shout' })];
    P.cmp = [X(cr, { ba: [0.5, 0.0] }), X(cr, { t: 0.55, hx: 2, ba: [0.98, 0.04], face: 'shout' })];
    P.chp = [X(cr, { ba: [0.42, 0.32], t: 0.5 }), X(cr, { h: 0.74, t: 0.08, n: -0.05, hx: 3, ba: [0.32, -0.97], fa: [0.2, 0.2], face: 'shout' }), X(cr, { h: 0.62, t: 0.25, ba: [0.45, -0.55] })];
    P.clk = [X(cr, { fl: [0.6, 0.05], h: 0.46 }), X(cr, { h: 0.44, t: 0.5, fl: [0.98, 0.02], ff: 'point', face: 'shout' })];
    P.cmk = [X(cr, { fl: [0.6, 0.06], h: 0.45 }), X(cr, { h: 0.42, t: 0.55, hx: 3, fl: [1.08, 0.03], ff: 'point', fa: [0.4, 0.3], face: 'shout' })];
    P.chk = [X(cr, { h: 0.42, t: 0.6, bl: [-0.45, 0.04], fa: [0.45, 0.62], hF: 'open' }), X(cr, { h: 0.4, t: 0.62, bl: [0.4, 0.03], fa: [0.4, 0.68], hF: 'open', bf: 'point' }),
      X(cr, { h: 0.4, t: 0.64, hx: 2, bl: [1.12, 0.02], fl: [0.18, 0], fa: [0.32, 0.7], hF: 'open', bf: 'point', face: 'shout' }), X(cr, { h: 0.44, t: 0.55, bl: [0.5, 0.02], fa: [0.4, 0.6], hF: 'open' })];
    // jumping normals
    P.jp = [X(TUCK, { fa: [0.55, 0.1] }), X(TUCK, { t: 0.4, fa: [0.88, 0.42], fl: { a: [0.9, 1.6] }, face: 'shout' })];
    P.jhp = [X(TUCK, { ba: [0.0, -0.6] }), X(TUCK, { t: 0.45, ba: [0.85, 0.42], fa: [0.1, 0.2], fl: { a: [0.8, 1.5] }, face: 'shout' })];
    P.jk = [X(TUCK, { fl: { a: [1.0, 2.0] } }), X(TUCK, { t: 0.2, fl: { a: [1.12, 0.12] }, ff: 'point', bl: { a: [0.5, 1.7] }, face: 'shout' })];
    P.jhk = [X(TUCK, { fl: { a: [1.2, 2.3] }, t: 0 }), X(TUCK, { t: -0.25, n: 0.25, fl: { a: [1.62, 0.04] }, ff: 'point', bl: { a: [0.45, 1.5] }, fa: [0.1, -0.3], face: 'shout' })];
    // defence and getting bonked
    P.block = [st({ t: 0.0, hx: -2, n: 0.15, fa: [0.34, -0.62], ba: [0.24, -0.5], face: 'angry' })];
    P.cblock = [X(cr, { t: 0.32, hx: -2, n: -0.2, fa: [0.38, -0.55], ba: [0.3, -0.45], face: 'angry' })];
    P.hit = [st({ t: -0.38, n: -0.45, hx: -4, fa: { a: [-0.3, 0.8] }, ba: { a: [-0.6, 0.6] }, face: 'hurt', hF: 'open', hB: 'open' }), st({ t: -0.18, n: -0.2, hx: -2, fa: [0.3, -0.1], face: 'hurt' })];
    P.hitb = [st({ t: 0.6, n: 0.35, h: S.h - 0.06, hx: -2, fa: [0.25, 0.35], ba: [0.12, 0.38], face: 'hurt' }), st({ t: 0.35, n: 0.15, h: S.h - 0.03, face: 'hurt' })];
    P.chit = [X(cr, { t: 0.05, n: -0.45, hx: -3, face: 'hurt', fa: [0.1, 0.2] })];
    const fallB = { fl: { a: [1.2, 0.5] }, bl: { a: [0.8, 0.9] }, fa: { a: [2.4, 0.4] }, ba: { a: [2.0, 0.6] }, face: 'hurt', hF: 'open', hB: 'open', t: -0.2, n: -0.3, h: 0.9 };
    P.fall = [X(fallB, { rot: -0.55 }), X(fallB, { rot: -1.1, fl: { a: [1.0, 0.3] } }), X(fallB, { rot: -1.45, fl: { a: [0.6, 0.2] }, bl: { a: [0.5, 0.3] } })];
    P.down = [X(fallB, { rot: -PI / 2, floor: 1, t: 0, n: 0.1, fl: { a: [0.55, 0.9] }, bl: { a: [0.3, 0.4] }, fa: { a: [2.6, 0.2] }, ba: { a: [2.2, 0.3] }, face: 'hurt' })];
    P.ko = [X(P.down[0], { face: 'ko', fl: { a: [0.3, 0.3] }, fa: { a: [2.9, 0.1] } })];
    P.getup = [X(cr, { h: 0.42, t: 0.75, n: -0.6, fa: [0.35, 0.7], ba: [0.2, 0.75], hF: 'open', hB: 'open' }), X(cr, { h: 0.65, t: 0.4, n: -0.3 })];
    P.dizzy = [0, 1, 2, 3].map(i => { const s = Math.sin(i / 4 * TAU); return st({ h: S.h + 0.02, t: -0.05 + s * 0.1, n: s * 0.3, hx: s * 2, fa: { a: [0.2 + s * 0.2, 0.25] }, ba: { a: [-0.1 - s * 0.2, 0.3] }, hF: 'open', hB: 'open', face: 'ko', fl: [0.2, 0], bl: [-0.2, 0] }); });
    P.grab = [st({ t: 0.28, hx: 3, fa: [0.8, -0.18], ba: [0.72, -0.05], hF: 'open', hB: 'open', face: 'angry' })];
    P.toss = [st({ t: -0.1, fa: [0.4, -0.75], ba: [0.3, -0.7], hF: 'open', hB: 'open', face: 'shout' }), st({ t: -0.5, hx: -3, fa: [-0.3, -0.85], ba: [-0.4, -0.72], hF: 'open', hB: 'open', face: 'shout' })];
    P.thrown = [X(fallB, { rot: 0.6 }), X(fallB, { rot: 1.6 }), X(fallB, { rot: 2.7 }), X(fallB, { rot: 3.8 })];
    // specials (shared shapes; a few scrappers have their own)
    P.shoot = [st({ h: S.h - 0.06, t: -0.02, hx: -3, fa: [-0.08, 0.36], ba: [-0.18, 0.34], hF: 'open', hB: 'open', fl: [0.3, 0], bl: [-0.34, 0] }),
      st({ h: S.h - 0.08, t: 0.36, hx: 5, fl: [0.44, 0], bl: [-0.32, 0], fa: [0.98, -0.08], ba: [0.92, 0.04], hF: 'open', hB: 'open', face: 'shout' })];
    P.rise = [X(cr, { h: 0.6, t: 0.3, ba: [0.42, 0.3] }), st({ h: 0.98, t: -0.06, n: 0.05, ba: [0.28, -0.99], fa: [0.2, 0.25], fl: { a: [1.25, 1.75] }, bl: { a: [0.15, 0.45] }, face: 'shout' }), st({ h: 0.98, t: 0.0, ba: [0.3, -0.85], fa: [0.25, 0.1], fl: { a: [0.8, 1.4] }, bl: { a: [0.1, 0.6] } })];
    P.spinkick = [X(TUCK, { t: 0.05, h: 0.96, fl: { a: [1.57, 0.04] }, ff: 'point', bl: { a: [0.35, 1.3] }, fa: [0.25, -0.3], ba: [-0.2, -0.1], face: 'shout' }),
      X(TUCK, { t: 0.0, h: 0.96, fl: { a: [0.35, 0.1] }, bl: { a: [0.3, 1.3] }, fa: [0.5, -0.1], ba: [-0.3, -0.1] })];
    P.flashk = spin6(X(TUCK, { t: -0.1, fl: { a: [2.6, 0.05] }, ff: 'point', bl: { a: [0.5, 1.5] }, fa: [-0.3, 0.3], ba: [-0.4, 0.2], face: 'shout' }), -1);
    P.wheel = spin6(X(TUCK, { t: 0.0, h: 0.9, fl: { a: [1.0, 0.05] }, bl: { a: [-1.0, 0.05] }, ff: 'point', bf: 'point', fa: { a: [3.0, 0] }, ba: { a: [3.1, 0] }, hF: 'open', hB: 'open' }), 1);
    P.ball = spin6(X(TUCK, { t: 0.9, n: 0.4, fl: { a: [1.8, 2.8] }, bl: { a: [1.6, 2.8] }, fa: [0.4, 0.35], ba: [0.3, 0.4] }), 1);
    P.knee = [st({ h: 0.98, t: -0.12, fl: { a: [1.75, 2.4] }, bl: { a: [0.15, 0.45] }, bf: 'point', fa: [0.32, -0.95], ba: [0.05, -0.92], face: 'shout' })];
    P.slide = [st({ h: 0.4, t: -0.8, n: 0.5, hx: -2, fl: [1.08, 0.03], ff: 'point', bl: { a: [0.85, 1.9] }, fa: [-0.45, 0.42], ba: [-0.5, 0.32], hF: 'open', hB: 'open', face: 'shout' })];
    P.torpedo = [X(TUCK, { h: 0.9, t: 0, n: 0, fa: [0.15, -0.99], ba: [0.05, -0.97], hF: 'open', hB: 'open', fl: { a: [-0.15, 0.15] }, bl: { a: [-0.32, 0.3] }, rot: 1.42, face: 'shout' })];
    P.slap = [st({ t: 0.25, hx: 2, fa: [0.96, -0.38], ba: [0.85, 0.12], hF: 'open', hB: 'open', face: 'shout' }), st({ t: 0.28, hx: 3, fa: [0.88, 0.08], ba: [0.97, -0.3], hF: 'open', hB: 'open', face: 'shout' }), st({ t: 0.22, hx: 2, fa: [0.99, -0.12], ba: [0.8, -0.48], hF: 'open', hB: 'open', face: 'shout' })];
    P.legs = [0.85, 1.35, 1.85].map(a => st({ t: -0.08 - a * 0.06, bl: [-0.04, 0], fl: { a: [a + 0.4, 0.1] }, ff: 'point', fa: [0.25, -0.5], ba: [-0.3, 0.15], face: 'shout' }));
    P.windmill = [st({ t: 0.0, fa: { a: [1.6, 0.05] }, ba: { a: [-1.6, -0.05] }, hF: 'fist', face: 'shout', wind: 1 }), st({ t: 0.0, fa: { a: [0.6, 0.1] }, ba: { a: [-0.5, 0.1] }, face: 'shout' })];
    P.lift = [st({ h: S.h + 0.02, t: -0.1, fa: [0.12, -0.98], ba: [0.06, -0.96], hF: 'open', hB: 'open', face: 'shout' })];
    P.slam = [X(cr, { h: 0.55, t: 0.25, fa: [0.6, 0.4], ba: [0.5, 0.45], face: 'shout' })];
    P.lasso = [st({ fa: [0.2, -0.98], hF: 'fist' }), st({ t: 0.25, hx: 2, fa: [0.98, -0.25], face: 'shout' })];
    P.spikek = [st({ h: 0.95, t: -0.5, n: 0.4, hx: -2, fl: { a: [2.75, 0.05] }, ff: 'point', bl: [-0.05, 0], fa: { a: [-0.6, 0.3] }, ba: { a: [-0.9, 0.3] }, hF: 'open', hB: 'open', face: 'shout' })];
    P.bike = [X(TUCK, { t: -0.25, h: 0.96, fl: { a: [2.2, 0.15] }, ff: 'point', bl: { a: [0.9, 2.2] }, fa: [0.2, -0.4], ba: [-0.3, -0.2], face: 'shout' }), X(TUCK, { t: -0.25, h: 0.96, bl: { a: [2.2, 0.15] }, bf: 'point', fl: { a: [0.9, 2.2] }, fa: [0.2, -0.4], ba: [-0.3, -0.2], face: 'shout' })];
    P.axel = [st({ h: 0.96, t: -0.05, fl: { a: [1.4, 0.05] }, ff: 'point', bl: [0, 0.04], fa: { a: [1.45, 0.05] }, ba: { a: [-1.4, -0.05] }, hF: 'open', hB: 'open', face: 'shout' }), st({ h: 0.96, t: 0, fl: { a: [0.5, 0.1] }, bl: [0, 0.04], fa: { a: [0.5, 0.1] }, ba: { a: [-0.4, -0.1] }, hF: 'open', hB: 'open' })];
    P.taunt = [st({ fa: [0.55, -0.6], hF: 'open', face: 'happy' })];
    // the win pose (two frames)
    const W = {
      fistup: [st({ h: 0.93, t: -0.04, n: -0.05, fa: { a: [3.0, 0.05] }, ba: [0.05, 0.38], fl: [0.18, 0], bl: [-0.22, 0], face: 'shout' }), st({ h: 0.93, t: -0.04, fa: { a: [2.95, 0.1] }, ba: [0.05, 0.38], fl: [0.18, 0], bl: [-0.22, 0], face: 'win' })],
      flex: [st({ h: 0.9, t: -0.02, fa: { a: [1.75, 2.0] }, ba: { a: [-1.6, -2.0] }, face: 'happy', fl: [0.3, 0], bl: [-0.3, 0] }), st({ h: 0.88, t: 0.0, fa: { a: [1.85, 2.2] }, ba: { a: [-1.7, -2.2] }, face: 'shout', fl: [0.3, 0], bl: [-0.3, 0] })],
      dance: [st({ hx: 4, t: -0.1, fa: { a: [2.7, 0.3] }, ba: { a: [2.5, 0.5] }, hF: 'open', hB: 'open', face: 'happy', fl: [0.2, 0.08], bl: [-0.3, 0] }), st({ hx: -4, t: 0.05, fa: { a: [2.5, -0.4] }, ba: { a: [2.8, -0.3] }, hF: 'open', hB: 'open', face: 'win', fl: [0.3, 0], bl: [-0.2, 0.08] })],
      spin: [st({ h: 0.94, t: -0.08, fa: { a: [2.75, 0.45] }, ba: { a: [2.9, -0.45] }, hF: 'open', hB: 'open', bl: { a: [-0.6, 1.5] }, fl: [0.02, 0], face: 'happy' }), st({ h: 0.94, t: -0.12, fa: { a: [2.6, 0.6] }, ba: { a: [2.95, -0.5] }, hF: 'open', hB: 'open', bl: { a: [-0.8, 1.7] }, fl: [0.02, 0], face: 'win' })],
      arms: [st({ h: 0.94, t: -0.1, fa: { a: [2.55, 0.15] }, ba: { a: [2.75, 0.15] }, face: 'happy', fl: [0.15, 0], bl: [-0.18, 0] }), st({ h: 0.96, t: -0.12, fa: { a: [2.65, 0.05] }, ba: { a: [2.85, 0.05] }, face: 'shout', fl: [0.15, 0], bl: [-0.18, 0] })],
      twirl: [st({ h: 0.9, t: -0.05, fa: [0.3, -0.72], hF: 'open', ba: [-0.25, 0.42], face: 'happy' }), st({ h: 0.9, t: -0.05, fa: [0.36, -0.7], hF: 'open', ba: [-0.25, 0.42], face: 'win' })],
      hat: [st({ h: 0.91, t: 0.0, fa: [0.2, -1.0], hF: 'open', ba: [0.02, 0.42], face: 'happy' }), st({ h: 0.91, t: 0.05, n: 0.15, fa: [0.35, -0.85], hF: 'open', ba: [0.02, 0.42], face: 'win' })],
      vsign: [st({ h: 0.92, t: 0.0, fa: [0.36, -0.92], hF: 'open', ba: [-0.2, 0.4], face: 'happy', fl: [0.2, 0], bl: { a: [-0.6, 1.4] } }), st({ h: 0.95, t: -0.05, fa: [0.4, -0.95], hF: 'open', ba: [-0.2, 0.42], face: 'win', fl: [0.2, 0], bl: { a: [-0.7, 1.6] } })],
      laugh: [st({ h: 0.9, t: -0.12, n: -0.4, fa: [-0.12, 0.5], ba: [-0.2, 0.48], face: 'shout', fl: [0.26, 0], bl: [-0.26, 0] }), st({ h: 0.9, t: -0.16, n: -0.5, fa: [-0.12, 0.48], ba: [-0.2, 0.46], face: 'win', fl: [0.26, 0], bl: [-0.26, 0] })],
    };
    P.win = W[C.win];
    if (id === 'olga') { P.idle.forEach(p => p.skirt = 1); }
    return P;
  }

  // ================================================================ baking: pose -> cropped pixel sprite (+ the joints, for hit boxes)
  function renderPose(prep, P, sc) {
    sc = sc || 1; const sz = Math.ceil(184 * sc), ox = Math.floor(sz / 2), oy = sz - Math.ceil(30 * sc);
    const R = new Rast(sz, sz, ox, oy, sc), J = solve(prep, P); drawRig(R, prep, J, P);
    if (sc !== 1) for (const k in J) if (Array.isArray(J[k]) && J[k].length === 2 && typeof J[k][0] === 'number') J[k] = [J[k][0] * sc, J[k][1] * sc];
    const pb = R.out(prep.RA);
    let x0 = sz, y0 = sz, x1 = -1, y1 = -1; const d = pb.d;
    for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) if (d[y * sz + x] >>> 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; }
    const out = new PB(x1 - x0 + 1, y1 - y0 + 1);
    for (let y = y0; y <= y1; y++) out.d.set(d.subarray(y * sz + x0, y * sz + x1 + 1), (y - y0) * out.w);
    // the body's hurt box (sprite space, facing right) from the joints
    let hx0 = 1e9, hx1 = -1e9, hy0 = 1e9, hy1 = -1e9; const B = prep.b;
    for (const k of ['H', 'N', 'Hd', 'kF', 'kB', 'aF', 'aB', 'sF', 'sB']) { const p = J[k]; hx0 = Math.min(hx0, p[0]); hx1 = Math.max(hx1, p[0]); hy0 = Math.min(hy0, p[1]); hy1 = Math.max(hy1, p[1]); }
    const r = B.chR * 0.8;
    return { pb: out, x: x0 - ox, y: y0 - oy, J, hb: [Math.max(hx0 - r * 0.6 * sc, -B.chR * 1.6 * sc), hy0 - B.hr[1] * sc, Math.min(hx1 + r * 0.6 * sc, B.chR * 1.6 * sc), Math.max(0, hy1)] };
  }

  // ================================================================ big lettering: the console's 5x7 font, smoothed (Scale2x), bevelled, outlined, extruded
  let GL = null;
  const GLCH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!.?-:\'&/';
  function initGlyphs(font) {
    if (GL || !hasDoc) return; GL = {};
    const c = canvas(GLCH.length * 6, 8), g = c.getContext('2d'); font.draw(g, GLCH, 0, 0, '#fff', 1);
    const d = g.getImageData(0, 0, c.width, 8).data;
    [...GLCH].forEach((ch, n) => { const a = new Uint8Array(35); for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) a[y * 5 + x] = d[(y * c.width + n * 6 + x) * 4 + 3] > 100 ? 1 : 0; GL[ch] = a; });
  }
  function scale2x(m) {
    const { w, h, a } = m, o = new Uint8Array(w * h * 4), W2 = w * 2, at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : a[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const B = at(x, y - 1), D = at(x - 1, y), E = at(x, y), F = at(x + 1, y), Hh = at(x, y + 1);
      let e0 = E, e1 = E, e2 = E, e3 = E;
      if (B !== Hh && D !== F) { e0 = D === B ? D : E; e1 = B === F ? F : E; e2 = D === Hh ? D : E; e3 = Hh === F ? F : E; }
      o[(y * 2) * W2 + x * 2] = e0; o[(y * 2) * W2 + x * 2 + 1] = e1; o[(y * 2 + 1) * W2 + x * 2] = e2; o[(y * 2 + 1) * W2 + x * 2 + 1] = e3;
    }
    return { w: W2, h: h * 2, a: o };
  }
  const bigCache = {};
  function bigText(str, o) {
    o = o || {}; const key = str + JSON.stringify(o); if (bigCache[key]) return bigCache[key];
    str = String(str).toUpperCase();
    let m = { w: str.length * 6 - 1, h: 7, a: new Uint8Array((str.length * 6 - 1) * 7) };
    if (o.roman) { // a proper chunky "II" for the logo
      m = { w: 30, h: 30, a: new Uint8Array(900) }; const put = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) m.a[j * 30 + i] = 1; };
      for (const bx of [0, 17]) { put(bx, 0, 13, 4); put(bx + 3, 4, 7, 22); put(bx, 26, 13, 4); }
    } else {
      [...str].forEach((ch, n) => { const G = GL && GL[ch]; if (!G) return; for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (G[y * 5 + x]) m.a[y * m.w + n * 6 + x] = 1; });
      for (let k = o.k || 4; k > 1; k >>= 1) m = scale2x(m);
    }
    if (o.bold) { const a = new Uint8Array(m.a); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.a[y * m.w + x]) for (let b = 1; b <= o.bold; b++) if (x + b < m.w) a[y * m.w + x + b] = 1; m.a = a; }
    const sx = o.sx || 1, sy = o.sy || 1, sh = o.shear || 0, w2 = Math.round(m.w * sx), h2 = Math.round(m.h * sy), shx = Math.ceil(h2 * sh);
    const ol = o.ol == null ? 1 : o.ol, ext = o.ext || 0, pad = ol + 1, Wd = w2 + shx + pad * 2 + ext, Ht = h2 + pad * 2 + ext;
    const M2 = new Uint8Array(Wd * Ht);
    for (let y = 0; y < h2; y++) { const off = Math.round((h2 - 1 - y) * sh); for (let x = 0; x < w2; x++) if (m.a[Math.floor(y / sy) * m.w + Math.floor(x / sx)]) M2[(y + pad) * Wd + x + pad + off] = 1; }
    const cols = (o.cols || ['#ffffff', '#ffe060', '#f08020', '#c02010']).map(hex32), out = hex32(o.out || '#200810'), ec = hex32(o.extCol || o.out || '#200810');
    const pb = new PB(Wd, Ht), at = (x, y) => (x < 0 || y < 0 || x >= Wd || y >= Ht) ? 0 : M2[y * Wd + x];
    // the extrusion (a solid block behind, down-right), then the outline, then the face
    for (let e = ext; e >= 1; e--) for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) { const xx = x - e, yy = y - e; let on = at(xx, yy); if (!on && ol) for (let dy = -ol; dy <= ol && !on; dy++) for (let dx = -ol; dx <= ol; dx++) if (at(xx + dx, yy + dy)) { on = 1; break; } if (on) pb.d[y * Wd + x] = ec; }
    if (ol) for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) { if (at(x, y)) continue; let n = 0; for (let dy = -ol; dy <= ol && !n; dy++) for (let dx = -ol; dx <= ol; dx++) if (at(x + dx, y + dy)) { n = 1; break; } if (n) pb.d[y * Wd + x] = out; }
    const nc = cols.length - 1;
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
      if (!at(x, y)) continue;
      const f = clamp((y - pad) / Math.max(1, h2 - 1), 0, 1) * nc, i0 = Math.min(nc - 1, Math.floor(f)), k = f - i0;
      let c = mixc(cols[i0], cols[i0 + 1], Math.round(k * 3) / 3);
      if (!at(x, y - 1) || !at(x - 1, y)) c = mixc(c, 0xffffffff, 0.45); else if (!at(x, y + 1) || !at(x + 1, y)) c = mixc(c, out, 0.35);
      pb.d[y * Wd + x] = c;
    }
    return bigCache[key] = { cv: hasDoc ? pb.canvas() : null, w: Wd, h: Ht, pb };
  }
  const BT = { // the house styles
    gold: { k: 4, cols: ['#fffbe0', '#ffe048', '#f8a018', '#d85010', '#902008'], out: '#280808', ext: 2, extCol: '#5a1008', shear: 0.18 },
    red: { k: 4, cols: ['#fff0e0', '#ff7050', '#e02818', '#a01010'], out: '#200408', ext: 2, extCol: '#480810', shear: 0.18 },
    blue: { k: 4, cols: ['#ffffff', '#b8e0ff', '#5898f0', '#2848c0'], out: '#080828', ext: 2, extCol: '#101850', shear: 0.18 },
    small: { k: 2, cols: ['#ffffff', '#ffe890', '#f8b030'], out: '#200808', ext: 1, extCol: '#401008', shear: 0.12 },
    smallb: { k: 2, cols: ['#ffffff', '#c8e8ff', '#70a8f0'], out: '#081028', ext: 1, extCol: '#102040', shear: 0.12 },
    silver: { k: 2, cols: ['#ffffff', '#e0e0f0', '#9898b8', '#606080'], out: '#101018', ext: 1, extCol: '#202030' },
  };
  const big = (s, st, extra) => bigText(s, Object.assign({}, BT[st] || BT.gold, extra || {}));

  // ================================================================ effect sprites: hit sparks, dust, projectiles, stars
  function mkSpark(r, cols, rays, seed) {
    const R = prng(seed), fr = [], n = rays || 8, len = []; for (let i = 0; i < n; i++) len.push(0.6 + R() * 0.4);
    for (let f = 0; f < 4; f++) {
      const s = Math.ceil(r * 2 + 4), pb = new PB(s, s), c = s / 2, k = [0.55, 1, 0.9, 0.7][f];
      const C = cols.map(hex32);
      for (let i = 0; i < n; i++) { const a = i / n * TAU + (i & 1) * 0.2, L = r * k * len[i] * (i & 1 ? 0.6 : 1); for (let t = 0; t < L; t += 0.5) { const w = (1 - t / L) * (f < 2 ? 2.2 : 1.4); const col = t < L * 0.35 ? C[0] : t < L * 0.7 ? C[1] : C[2]; if (f === 3 && t < L * 0.5) continue; pb.ellipse(c + Math.cos(a) * t, c + Math.sin(a) * t, w, w, col); } }
      if (f < 3) pb.ellipse(c, c, r * 0.32 * k + 1, r * 0.32 * k + 1, f === 2 ? C[1] : C[0]);
      fr.push(pb);
    }
    return fr;
  }
  function mkDust() {
    const fr = [], R = prng(7); const pts = []; for (let i = 0; i < 7; i++) pts.push([R() * 2 - 1, R() * 0.6, 0.5 + R() * 0.5]);
    for (let f = 0; f < 5; f++) { const pb = new PB(40, 20); const k = (f + 1) / 5;
      for (const [x, y, s] of pts) { const cx = 20 + x * 14 * k, cy = 14 - y * 8 * k, rr = s * (3 + 4 * k) * (f === 4 ? 0.7 : 1); pb.ellipse(cx, cy, rr, rr * 0.8, hex32(f > 2 ? '#a89a88' : '#d8ccb8')); if (f < 3) pb.ellipse(cx - rr * 0.3, cy - rr * 0.3, rr * 0.5, rr * 0.4, hex32('#f4ecdc')); }
      if (f >= 3) for (let i = 0; i < pb.d.length; i++) if (((i % 40) + Math.floor(i / 40)) % 2) pb.d[i] = 0;
      pb.outline(hex32('#5a4a3a')); fr.push(pb); }
    return fr;
  }
  function mkProj(kind) {
    const fr = [];
    for (let f = 0; f < 4; f++) {
      const pb = new PB(40, 30), cx = 26, cy = 15;
      if (kind === 'ball' || kind === 'bolt') {
        const P = kind === 'ball' ? ['#ffffff', '#c0f0ff', '#58b8ff', '#2058e0', '#102890'] : ['#ffffff', '#f0c8ff', '#c060ff', '#7020c0', '#381060'];
        for (let i = 0; i < 6; i++) { const a = f * 0.9 + i * 1.3, tx = cx - 8 - i * 3.2, ty = cy + Math.sin(a) * (3 + i * 0.6); pb.ellipse(tx, ty, 5 - i * 0.6, 4 - i * 0.5, hex32(P[Math.min(4, 2 + (i >> 1))])); }
        pb.ellipse(cx, cy, 9 + (f & 1) * 0.6, 8, hex32(P[3])); pb.ellipse(cx + 0.5, cy, 7, 6.2, hex32(P[2])); pb.ellipse(cx + 1, cy - 0.5, 4.6, 4, hex32(P[1])); pb.ellipse(cx + 1.5, cy - 1, 2.4, 2, hex32(P[0]));
        if (kind === 'bolt') for (let i = 0; i < 3; i++) { const a = f * 1.7 + i * 2.1; pb.line(cx, cy, cx + Math.cos(a) * 12, cy + Math.sin(a) * 10, hex32('#ffffff')); }
        pb.outline(hex32(P[4]));
      } else if (kind === 'snow') {
        for (let i = 0; i < 4; i++) { const tx = cx - 9 - i * 4, ty = cy + ((i + f) & 1 ? -3 : 3); pb.px(tx, ty, hex32('#ffffff')); pb.px(tx - 1, ty, hex32('#a8d8ff')); pb.px(tx + 1, ty, hex32('#a8d8ff')); pb.px(tx, ty - 1, hex32('#a8d8ff')); pb.px(tx, ty + 1, hex32('#a8d8ff')); }
        pb.ellipse(cx, cy, 7, 7, hex32('#8aa8d0')); pb.ellipse(cx - 0.6, cy - 0.6, 6, 6, hex32('#d0e4f8')); pb.ellipse(cx - 1.5, cy - 1.5, 3.4, 3.4, hex32('#ffffff'));
        pb.px(cx + 2 - f, cy + 3, hex32('#a0b8d8')); pb.px(cx - 3 + f, cy + 2, hex32('#a0b8d8')); pb.outline(hex32('#283858'));
      } else if (kind === 'palm') {
        const P = ['#fffff0', '#fff080', '#f8c020', '#d07010'];
        for (let i = 3; i >= 0; i--) { const r = 6 + i * 3 + (f & 1); for (let a = -1.2; a <= 1.2; a += 0.04) pb.ellipse(cx - 6 + Math.cos(a) * r, cy + Math.sin(a) * r * 1.2, 1.4, 1.4, hex32(P[i])); }
        pb.outline(hex32('#602008'));
      } else if (kind === 'lasso') {
        const rx = 9 * Math.abs(Math.cos(f * PI / 4)) + 3, C = [hex32('#e8c070'), hex32('#a87030'), hex32('#5a3010')];
        for (let a = 0; a < TAU; a += 0.05) { const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * 9; pb.px(x, y, (Math.floor(a * 4) & 1) ? C[0] : C[1]); pb.px(x, y + 1, C[1]); }
        pb.outline(C[2]);
      }
      fr.push(pb);
    }
    return fr;
  }
  function mkStar(col) { const pb = new PB(9, 9), c = hex32(col), w = hex32('#ffffff'); for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * TAU / 5; pb.line(4, 4, 4 + Math.cos(a) * 4, 4 + Math.sin(a) * 4, c); } pb.rect(3, 3, 3, 3, c); pb.px(4, 4, w); pb.outline(hex32('#402000')); return pb; }
  function mkShadow(w) { const pb = new PB(w, 7), c = pack(0, 0, 24, 120); pb.ellipse(w / 2, 3.5, w / 2, 3.2, c); return pb; }

  // ================================================================ flags (16x11), made up of simple stripes and shapes
  function mkFlag(id) {
    const pb = new PB(16, 11), c = hex32;
    switch (id) {
      case 'jp': pb.rect(0, 0, 16, 11, c('#f8f8f8')); pb.ellipse(8, 5.5, 3.3, 3.3, c('#d8202a')); break;
      case 'en': pb.rect(0, 0, 16, 11, c('#f8f8f8')); pb.rect(7, 0, 2, 11, c('#d8202a')); pb.rect(0, 4, 16, 3, c('#d8202a')); break;
      case 'br': pb.rect(0, 0, 16, 11, c('#20a040')); pb.poly([8, 1, 15, 5.5, 8, 10, 1, 5.5], c('#f8d820')); pb.ellipse(8, 5.5, 2.6, 2.6, c('#2040a0')); break;
      case 'ru': pb.rect(0, 0, 16, 4, c('#f8f8f8')); pb.rect(0, 4, 16, 3, c('#2848b8')); pb.rect(0, 7, 16, 4, c('#d8202a')); break;
      case 'ke': pb.rect(0, 0, 16, 3, c('#181818')); pb.rect(0, 3, 16, 1, c('#f8f8f8')); pb.rect(0, 4, 16, 3, c('#c82020')); pb.rect(0, 7, 16, 1, c('#f8f8f8')); pb.rect(0, 8, 16, 3, c('#209040')); pb.ellipse(8, 5.5, 1.8, 4, c('#c82020')); pb.rect(7.5, 2, 1, 7, c('#f8f8f8')); break;
      case 'fr': pb.rect(0, 0, 6, 11, c('#2848b8')); pb.rect(6, 0, 5, 11, c('#f8f8f8')); pb.rect(11, 0, 5, 11, c('#d8202a')); break;
      case 'us': for (let i = 0; i < 11; i++) pb.rect(0, i, 16, 1, c(i & 1 ? '#f8f8f8' : '#c82030')); pb.rect(0, 0, 7, 6, c('#283898')); for (let y = 1; y < 6; y += 2) for (let x = 1; x < 7; x += 2) pb.px(x, y, c('#f8f8f8')); break;
      case 'cn': pb.rect(0, 0, 16, 11, c('#d82020')); for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * TAU / 5; pb.line(4, 4, 4 + Math.cos(a) * 2.5, 4 + Math.sin(a) * 2.5, c('#f8e020')); } pb.px(8, 2, c('#f8e020')); pb.px(9, 4, c('#f8e020')); pb.px(8, 6, c('#f8e020')); break;
      default: pb.rect(0, 0, 16, 11, c('#3a1858')); for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * TAU / 5; pb.line(8, 5, 8 + Math.cos(a) * 4, 5 + Math.sin(a) * 4, c('#f0c040')); }
    }
    const o = new PB(18, 13); o.rect(0, 0, 18, 13, c('#101018')); o.blit(pb, 1, 1); return o;
  }

  // ================================================================ portraits (the rig, bigger, head and shoulders)
  function portrait(C, alt, sc, w, h, pose, bg) {
    const prep = prepChar(C, alt), P = poseSet(C), f = renderPose(prep, pose || X(P.idle[0], { fa: [0.35, 0.3], ba: [0.2, 0.35] }), sc);
    const pb = new PB(w, h); if (bg) pb.vgrad(0, 0, w, h, bg.map(hex32), 6);
    const hx = f.J.Hd[0] - f.x, hy = f.J.Hd[1] - f.y;
    pb.blit(f.pb, Math.round(w * 0.5 - hx), Math.round(h * 0.4 - hy));
    return pb;
  }

  // ================================================================ music (16th-note steps) and sound
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function T(s) { const out = []; for (const tk of s.split(/\s+/)) { if (!tk || tk === '|') continue; if (tk === '.') out.push(0); else if (tk === '-') out.push(-1); else { const m = /^([a-g])(#|b)?(\d)$/.exec(tk); if (!m) continue; out.push(12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)); } } return out; }
  const bassOf = (roots, pat) => T(roots.split(' ').map(r => (pat || 'R . O . R . O . R . O . R . O .').replace(/R/g, r + '2').replace(/O/g, r + '3')).join(' '));
  const SONGS = {
    title: { bpm: 138, wave: 'square', bassWave: 'triangle', vol: 0.055, drums: 'o.x.o.x.o.x.oxx.',
      lead: T('g4 . g4 . bb4 . d5 - - - c5 - bb4 - a4 - | g4 - - - f4 - g4 - a4 - - - d4 - - - | g4 . g4 . bb4 . d5 - - - f5 - eb5 - d5 - | c5 - - - bb4 - c5 - d5 - - - - - - - | eb5 - - - d5 - c5 - bb4 - - - a4 - g4 - | f4 - - - g4 - a4 - bb4 - - - c5 - d5 - | eb5 - d5 - c5 - bb4 - a4 - bb4 - c5 - a4 - | g4 - - - - - - - d5 . d5 . g5 - - -'),
      bass: bassOf('g f g c eb f c g') },
    select: { bpm: 150, wave: 'square', vol: 0.05, drums: 'o.x.oxx.o.x.oxxx',
      lead: T('a4 . c5 . e5 . a5 . g5 - e5 - c5 - d5 - | e5 - - - d5 - c5 - b4 - - - g4 - - - | a4 . c5 . e5 . a5 . b5 - a5 - g5 - e5 - | f5 - - - e5 - d5 - e5 - - - - - - -'),
      bass: bassOf('a g a e') },
    tokyo: { bpm: 152, wave: 'square', vol: 0.05, drums: 'o.x.o.xxo.x.o.xx',
      lead: T('e5 - - . g5 . a5 - b5 - - - a5 . g5 . | e5 - - - d5 - e5 - g5 - - - - - - - | e5 - - . g5 . a5 - b5 - d6 - b5 . a5 . | g5 - a5 - g5 - e5 - d5 - - - e5 - - - | c5 - - . d5 . e5 - g5 - - - e5 . d5 . | c5 - - - b4 - c5 - d5 - - - - - - - | e5 . e5 . g5 . a5 . b5 - - - d6 - - - | b5 - a5 - g5 - a5 - e5 - - - - - - -'),
      bass: bassOf('e e e e c c d b') },
    pier: { bpm: 126, wave: 'square', vol: 0.05, drums: 'o...x...o...x...',
      lead: T('c5 - e5 - g5 - - - e5 - c5 - g4 - - - | a4 - c5 - f5 - - - e5 - d5 - c5 - - - | d5 - f5 - a5 - - - g5 - f5 - e5 - - - | d5 - e5 - d5 - b4 - c5 - - - - - - - | e5 - g5 - c6 - - - b5 - a5 - g5 - - - | f5 - a5 - d6 - - - c6 - b5 - a5 - - - | g5 - e5 - c5 - e5 - d5 - - - g4 - - - | c5 - - - g4 - - - c5 - - - - - - -'),
      bass: bassOf('c f g c c d g c', 'R . . . O . . . R . . . O . . .') },
    rio: { bpm: 164, wave: 'square', vol: 0.05, drums: 'o.xxo.x.oxx.o.xx',
      lead: T('d5 . f#5 - . a5 . f#5 . e5 - d5 . b4 - . | a4 . b4 . d5 - . e5 . f#5 - e5 . d5 - . | d5 . f#5 - . a5 . b5 . a5 - f#5 . e5 - . | g5 . f#5 . e5 - . d5 . e5 - - - - - - - | b5 . a5 - . f#5 . a5 . b5 - a5 . f#5 - . | g5 . f#5 . e5 - . f#5 . d5 - - - - - . .'),
      bass: bassOf('d b g a d e', 'R . . O . . R . R . . O . . R .') },
    rink: { bpm: 172, wave: 'square', vol: 0.05, drums: 'o.x.o.x.o.x.o.xx',
      lead: T('a4 . d5 . f5 . e5 . d5 . c#5 . d5 - - - | a4 . d5 . f5 . a5 . g5 . f5 . e5 - - - | bb4 . e5 . g5 . f5 . e5 . d5 . e5 - - - | a4 . c#5 . e5 . g5 . f5 . e5 . d5 - - - | d5 . f5 . a5 . d6 . c6 . bb5 . a5 - - - | g5 . bb5 . a5 . g5 . f5 . e5 . d5 - - -'),
      bass: bassOf('d d g a d d') },
    safari: { bpm: 140, wave: 'square', vol: 0.05, drums: 'o.x.oxx.o.xxo.x.',
      lead: T('f5 . a5 . c6 - a5 . g5 . f5 . d5 - c5 - | f5 . g5 . a5 - c6 - d6 - - - c6 - - - | a5 . c6 . d6 - c6 . a5 . g5 . f5 - g5 - | a5 - - - g5 - f5 - d5 - - - f5 - - -'),
      bass: bassOf('f bb f c', 'R . O . . R O . R . O . . R O .') },
    paris: { bpm: 150, wave: 'triangle', vol: 0.07, drums: 'o...x.x.o...x.x.',
      lead: T('e5 - d#5 e5 g5 - - - f5 - e5 - d5 - - - | d5 - c#5 d5 f5 - - - e5 - d5 - c5 - - - | c5 - b4 c5 e5 - a5 - g5 - f5 - e5 - d5 - | b4 - c5 - d5 - e5 - c5 - - - - - - -'),
      bass: bassOf('c g g c', 'R . . . O . O . R . . . O . O .') },
    rodeo: { bpm: 168, wave: 'square', vol: 0.05, drums: 'o.x.o.x.o.x.o.x.',
      lead: T('g4 g4 b4 d5 g5 - d5 - e5 - d5 - b4 - g4 - | c5 c5 e5 g5 c6 - g5 - a5 - g5 - e5 - c5 - | d5 d5 f#5 a5 d6 - a5 - b5 - a5 - f#5 - d5 - | g5 - d5 - b4 - d5 - g4 - - - - - - -'),
      bass: bassOf('g c d g', 'R . O . R . O . R . O . R . O .') },
    market: { bpm: 140, wave: 'square', vol: 0.05, drums: 'o.x.o.xxo.x.oxx.',
      lead: T('e5 - g5 - a5 - c6 - a5 - g5 - e5 - d5 - | c5 - d5 - e5 - g5 - e5 - - - - - - - | a5 - c6 - d6 - c6 - a5 - g5 - a5 - c6 - | g5 - e5 - d5 - e5 - c5 - - - - - - -'),
      bass: bassOf('c a f c') },
    airship: { bpm: 148, wave: 'sawtooth', vol: 0.04, drums: 'o.xxo.x.o.xxo.xx',
      lead: T('c5 - - - eb5 - - - g5 - f#5 - g5 - - - | ab5 - - - g5 - f5 - eb5 - d5 - c5 - - - | c5 - - - eb5 - - - g5 - f#5 - g5 - c6 - | b5 - - - g5 - - - d5 - - - g4 - - -'),
      bass: bassOf('c ab c g', 'R R O R R O R R R R O R R O R O') },
    bonus: { bpm: 184, wave: 'square', vol: 0.05, drums: 'oxxxoxxxoxxxoxxx',
      lead: T('c5 e5 g5 e5 c5 e5 g5 e5 d5 f5 a5 f5 d5 f5 a5 f5 | e5 g5 b5 g5 e5 g5 b5 g5 c6 - - - g5 - - - '),
      bass: bassOf('c d e c') },
    cont: { bpm: 96, wave: 'triangle', vol: 0.07, lead: T('a4 - - - g4 - - - f4 - - - e4 - - - | d4 - - - e4 - f4 - e4 - - - - - - -'), bass: bassOf('a g f e d e', 'R . . . . . . . O . . . . . . .') },
    ending: { bpm: 120, wave: 'square', vol: 0.05, drums: 'o...x...o.o.x...',
      lead: T('c5 - - - e5 - g5 - c6 - - - b5 - a5 - | g5 - - - e5 - c5 - d5 - - - - - - - | a4 - - - c5 - f5 - a5 - - - g5 - f5 - | e5 - - - d5 - e5 - c5 - - - - - - -'),
      bass: bassOf('c g f c', 'R . . . O . . . R . . . O . . .') },
    hiscore: { bpm: 124, wave: 'square', vol: 0.045, drums: 'o...x...o...x.x.', lead: T('g5 . e5 . c5 . e5 . g5 - - - a5 - g5 - | f5 . d5 . b4 . d5 . f5 - - - e5 - d5 - | e5 . c5 . a4 . c5 . e5 - - - f5 - e5 - | d5 - - - g4 - - - c5 - - - - - - -'), bass: bassOf('c g a g') },
  };
  function sounds(K) {
    const S = K.sfx;
    return {
      whoosh(s) { S.noise(0.07 + s * 0.03, 0.08 + s * 0.03, 1400 + s * 600, 0, 'bandpass', 600); },
      hit(s) { S.noise(0.08 + s * 0.05, 0.22 + s * 0.06, 2600 - s * 500, 0, 'lowpass', 300); S.tone(180 - s * 40, 0.1 + s * 0.04, 'square', 0.1, 0, 60); },
      block() { S.tone(1600, 0.04, 'square', 0.06, 0, 900); S.noise(0.05, 0.1, 5000, 0, 'highpass'); },
      fire() { S.noise(0.35, 0.14, 800, 0, 'bandpass', 2600); S.tone(220, 0.3, 'sawtooth', 0.06, 0, 440); },
      boom() { S.noise(0.5, 0.3, 900, 0, 'lowpass', 80); S.tone(90, 0.4, 'sine', 0.2, 0, 30); },
      jump() { S.tone(300, 0.08, 'square', 0.04, 0, 520); },
      land() { S.noise(0.06, 0.08, 500, 0, 'lowpass'); },
      ko() { S.tone(660, 0.9, 'sawtooth', 0.08, 0, 110); S.noise(0.8, 0.12, 1200, 0.05, 'lowpass', 100); },
      move() { S.tone(880, 0.03, 'square', 0.05); },
      ok() { S.tone(660, 0.06, 'square', 0.07); S.tone(990, 0.12, 'square', 0.07, 0.06); },
      tick() { S.tone(1320, 0.03, 'square', 0.04); },
      dizzy() { S.tone(1200, 0.12, 'sine', 0.05, 0, 1800); S.tone(1500, 0.12, 'sine', 0.05, 0.13, 2100); },
      grab() { S.noise(0.1, 0.15, 900, 0, 'bandpass'); },
      cheer() { S.noise(1.2, 0.07, 1800, 0, 'bandpass', 1200); },
      bell(n) { S.seq(n === 2 ? [[84, 0.5], [79, 0.5], [84, 1]] : [[72, 0.5], [79, 1.5]], { bpm: 200, wave: 'square', vol: 0.08 }); },
      fight() { S.seq([[67, 0.25], [71, 0.25], [74, 0.25], [79, 1]], { bpm: 260, wave: 'square', vol: 0.08 }); S.noise(0.3, 0.1, 3000, 0.25, 'highpass'); },
      win() { S.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 0.75], [79, 0.25], [84, 2]], { bpm: 220, wave: 'square', vol: 0.08 }); S.seq([[48, 1.5], [55, 1.25], [60, 2]], { bpm: 220, wave: 'triangle', vol: 0.12 }); },
      lose() { S.seq([[67, 0.75], [63, 0.75], [60, 0.75], [55, 2]], { bpm: 160, wave: 'square', vol: 0.07 }); },
      vs() { S.seq([[55, 0.5], [55, 0.5], [62, 0.5], [67, 2]], { bpm: 180, wave: 'sawtooth', vol: 0.07 }); S.noise(0.6, 0.12, 700, 0.5, 'lowpass', 60); },
      crash(s) { S.noise(0.25 + s * 0.15, 0.25, 3200, 0, 'bandpass', 700); S.tone(150, 0.2, 'square', 0.08, 0, 50); },
      coin() { S.tone(988, 0.06, 'square', 0.06); S.tone(1319, 0.2, 'square', 0.06, 0.06); },
    };
  }

  // ================================================================ stages: far layer (x0.25), middle (x0.6) with a crowd, a line-scrolled floor, extras
  const FAR_K = 0.25, MID_K = 0.6, FLOOR_C = 64, FW = 768;
  const farW = W + Math.ceil(256 * FAR_K), midW = W + Math.ceil(256 * MID_K);
  function pbText(pb, s, x, y, col, k) { if (!GL) return; k = k || 1; const c = C32(col); [...String(s).toUpperCase()].forEach((ch, n) => { const G = GL[ch]; if (!G) return; for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (G[j * 5 + i]) pb.rect(x + (n * 6 + i) * k, y + j * k, k, k, c); }); }
  // a perspective floor: pat(u, w, x, y) -> colour; u: world x (1:1 on the fighters' line), w: depth (px)
  function floorPB(hz, pat) {
    const fh = H - hz, gr = GROUND - hz, pb = new PB(FW, fh);
    for (let y = 0; y < fh; y++) { const k = (gr + FLOOR_C) / (y + FLOOR_C), w = (y + FLOOR_C); for (let x = 0; x < FW; x++) pb.d[y * FW + x] = pat((x - FW / 2) * k, w, x, y); }
    return pb;
  }
  // little background people, from the same rig as the scrappers
  const CIVPAL = { skin: ['#f0c8a0', '#e0a878', '#a86a40', '#6a3c24', '#f4d0b0', '#c88a5a'], hair: ['#2a1a10', '#6a4020', '#e8c060', '#181010', '#a04818', '#888078'], top: ['#d82a2a', '#2a6ad8', '#e8c020', '#28a050', '#f0f0e8', '#8a3ac0', '#f07818', '#20a0b0', '#e85a9a'], pants: ['#2a3a6a', '#3a3a3a', '#6a5a3a', '#4a6a9a', '#202028'] };
  function crowdSprites(seed, n, sc, opts) {
    opts = opts || {}; const R = prng(seed), out = [], pick = a => a[Math.floor(R() * a.length)];
    for (let i = 0; i < n; i++) {
      const hat = opts.hats ? pick(opts.hats) : null, big = 0.85 + R() * 0.3;
      const C = { id: 'civ', b: bld({ th: 19 * big, sh: 19 * big, to: 23 * big, waR: 6.5 + R() * 3, chR: 8 + R() * 2.5, chest: [9 + R() * 2, 8.5], belly: R() < 0.25 ? [8, 8, 2] : null, sleeve: R() < 0.5 ? 'short' : 'long' }),
        pal: { skin: pick(CIVPAL.skin), hair: pick(CIVPAL.hair), top: opts.tops ? pick(opts.tops) : pick(CIVPAL.top), pants: pick(CIVPAL.pants), shoe: '#2a2020', hat: hat || '#444', acc: pick(CIVPAL.top) },
        dress: { head(R2, J) { const M = this.M; if (hat) { R2.ell(...hp(J, -1, -5), 6.6, 3.4, J.ha, M.hat); R2.ell(...hp(J, -1, -7.5), 5, 3, J.ha, M.hat); } else D_hair(R2, J, M); } } };
      const prep = prepChar(C), kind = opts.kinds ? pick(opts.kinds) : pick(['cheer', 'clap', 'wave', 'cheer']);
      const base = { h: 0.95, t: 0.02, n: -0.1, fl: [0.12, 0], bl: [-0.12, 0], face: 'happy' };
      const poses = kind === 'cheer' ? [X(base, { fa: { a: [2.75, 0.2] }, ba: { a: [2.95, 0.1] }, hF: 'open', hB: 'open', face: 'shout' }), X(base, { h: 0.9, fa: { a: [2.2, 0.8] }, ba: { a: [2.4, 0.6] }, hF: 'open', hB: 'open' })]
        : kind === 'clap' ? [X(base, { fa: [0.42, -0.4], ba: [0.38, -0.36], hF: 'open', hB: 'open' }), X(base, { fa: [0.3, -0.45], ba: [0.44, -0.3], hF: 'open', hB: 'open', face: 'shout' })]
        : kind === 'sit' ? [X(base, { h: 0.55, t: -0.05, fl: { a: [1.5, 1.5] }, bl: { a: [1.4, 1.5] }, fa: [0.42, -0.4], ba: [0.38, -0.36], hF: 'open', hB: 'open' }), X(base, { h: 0.55, t: -0.05, fl: { a: [1.5, 1.5] }, bl: { a: [1.4, 1.5] }, fa: [0.3, -0.45], ba: [0.44, -0.3], hF: 'open', hB: 'open', face: 'shout' })]
        : kind === 'salute' ? [X(base, { face: 'n', fa: [0.32, -0.92], hF: 'open', ba: { a: [0.05, 0.05] } }), X(base, { face: 'n', fa: [0.3, -0.9], hF: 'open', ba: { a: [0.05, 0.05] } })]
        : [X(base, { fa: { a: [2.6, 0.5] }, hF: 'open', ba: { a: [0.1, 0.2] } }), X(base, { fa: { a: [2.9, -0.4] }, hF: 'open', ba: { a: [0.1, 0.2] } })];
      const s = sc * (0.9 + R() * 0.2), flip = R() < 0.5;
      out.push({ fr: poses.map(p => renderPose(prep, p, s)), flip, ph: R() * TAU, rate: 4 + R() * 5 });
    }
    return out;
  }
  // tiny helpers for painting
  const shadeRow = (pb, x, y, w, h, cols) => { const n = cols.length; for (let j = 0; j < h; j++) pb.rect(x, y + j, w, 1, cols[Math.min(n - 1, Math.floor(j / h * n))]); };
  function windows(pb, x, y, w, h, R, lit, dark, step) { step = step || 4; for (let j = y + 3; j < y + h - 3; j += step + 1) for (let i = x + 2; i < x + w - 3; i += step) if (R() < 0.45) pb.rect(i, j, 2, 2, R() < 0.8 ? lit : dark); }
  function cloud(pb, x, y, s, c1, c2) { for (let i = 0; i < 5; i++) pb.ellipse(x + (i - 2) * 6 * s, y - Math.sin(i / 4 * PI) * 5 * s, 7 * s, 5 * s, c2); for (let i = 0; i < 5; i++) pb.ellipse(x + (i - 2) * 6 * s - 1, y - Math.sin(i / 4 * PI) * 5 * s - 2, 6 * s, 4 * s, c1); }

  const STAGES = {
    tokyo: { name: 'TOKYO ARCADE STREET', hz: 150, music: 'tokyo', paint(R) {
      const c = hex32, far = new PB(farW, 160), mid = new PB(midW, 160);
      far.vgrad(0, 0, farW, 160, [c('#100828'), c('#2a1050'), c('#5a1a6a'), c('#a03a7a')], 10);
      for (let i = 0; i < 40; i++) far.px(R() * farW, R() * 60, c(R() < 0.5 ? '#ffffff' : '#a8a0ff'));
      for (let x = -10; x < farW;) { const w = 18 + R() * 26, h = 50 + R() * 80, col = c(R() < 0.5 ? '#1a1030' : '#22183a'); far.rect(x, 160 - h, w, h, col); far.rect(x, 160 - h, 1, h, c('#3a2a5a')); windows(far, x, 160 - h, w, h, R, c('#f8d878'), c('#7ac8f0')); if (R() < 0.3) { far.rect(x + w / 2 - 1, 160 - h - 8, 2, 8, col); far.px(x + w / 2, 160 - h - 9, c('#ff4040')); } x += w + 2; }
      // a big billboard
      far.rect(120, 40, 70, 30, c('#101018')); far.rect(122, 42, 66, 26, c('#e83a8a')); far.rect(124, 44, 62, 22, c('#3a1048')); pbText(far, 'GAME ON', 134, 51, '#ffe060');
      // the arcade front
      mid.rect(0, 60, midW, 100, c('#2a2238')); shadeRow(mid, 0, 60, midW, 8, [c('#4a3a5a'), c('#3a2e4a')]);
      for (let x = 6; x < midW; x += 46) { mid.rect(x, 74, 40, 70, c('#0c0a14')); mid.rect(x + 1, 75, 38, 2, c('#3a2a4a')); }
      // cabinets
      const cabC = ['#d82a2a', '#2a5ad8', '#e8c020', '#28a050', '#8a3ac0'];
      for (let x = 8; x < midW - 30; x += 23) { const col = c(cabC[Math.floor(R() * cabC.length)]), y = 96;
        mid.rect(x, y, 18, 52, col); mid.rect(x, y, 2, 52, mixc(col, c('#ffffff'), 0.3)); mid.rect(x + 16, y, 2, 52, mixc(col, 0xff000000, 0.45)); mid.rect(x + 2, y + 2, 14, 6, c('#fff0a0')); mid.rect(x + 3, y + 11, 12, 11, c('#0a0a18')); mid.rect(x + 4, y + 12, 10, 9, c(R() < 0.5 ? '#3ad8f0' : '#a8f070')); mid.rect(x + 1, y + 24, 16, 5, mixc(col, 0xff000000, 0.3)); mid.px(x + 5, y + 25, c('#e02020')); mid.px(x + 11, y + 25, c('#2040e0')); mid.px(x + 13, y + 25, c('#20c020')); }
      // neon tubes and the sign
      for (let x = 0; x < midW; x += 2) { mid.px(x, 70, c('#ff60c0')); mid.px(x, 71, c('#ffd0f0')); }
      mid.rect(162, 36, 86, 22, c('#120a1a')); mid.rect(164, 38, 82, 18, c('#2a1038')); pbText(mid, 'ARCADE', 170, 40, '#40f0ff', 2);
      mid.rect(30, 38, 50, 20, c('#120a1a')); pbText(mid, 'PLAY', 32, 40, '#ff60c0', 2); pbText(mid, '24HR', 42, 52, '#ffe060', 1);
      const floor = floorPB(150, (u, w, x, y) => { const s = Math.floor(u / 40), lane = Math.abs(u % 160) < 3 && (Math.floor(w / 6) & 1); let col = (s + Math.floor(w / 10)) & 1 ? c('#2a2840') : c('#262438'); if (lane) col = c('#c8c8d8'); if (y < 20 && BAYER[(y & 3) * 4 + (x & 3)] < (20 - y) / 2 && Math.abs(Math.sin(u * 0.07)) > 0.6) col = c(Math.sin(u * 0.02) > 0 ? '#c03a90' : '#2a8ab0'); return col; });
      return { far, mid, floor, crowd: { seed: 11, n: 8, y: 152, xs: [40, 90, 140, 210, 260, 300, 350, 380], sc: 0.5 },
        anim(g, t, cam) { const f = (t * 8 | 0) % 53; if (f === 0 || f === 3) { g.fillStyle = 'rgba(18,10,26,.8)'; g.fillRect(Math.round(164 - cam * MID_K), 38, 82, 18); } for (let i = 0; i < 18; i++) { if (((t * 3 + i * 7) | 0) % 11 === 0) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(Math.round(12 + i * 23 - cam * MID_K), 108, 10, 9); } } } };
    } },
    pier: { name: 'BLACKPOOL PIER', hz: 152, music: 'pier', paint(R) {
      const c = hex32, far = new PB(farW, 160), mid = new PB(midW, 160);
      far.vgrad(0, 0, farW, 110, [c('#283070'), c('#7a3a7a'), c('#e86a5a'), c('#f8b860'), c('#f8e0a0')], 10);
      far.ellipse(200, 96, 18, 18, c('#fff4c0')); far.ellipse(200, 96, 15, 15, c('#ffffe8'));
      for (let i = 0; i < 4; i++) far.rect(178, 88 + i * 5, 44, 1, c('#f8b860'));
      for (let i = 0; i < 6; i++) cloud(far, 30 + i * 55 + R() * 20, 30 + R() * 30, 0.8 + R() * 0.5, c('#f8c8a8'), c('#c87a8a'));
      far.vgrad(0, 110, farW, 50, [c('#3a5a98'), c('#2a3a78'), c('#1a2858')], 6);
      for (let i = 0; i < 70; i++) far.rect(R() * farW, 111 + R() * 45, 2 + R() * 3, 1, c(R() < 0.5 ? '#f8d890' : '#6a8ac8'));
      // the tower (a made-up iron lattice tower) and a big wheel
      const tx = 70; far.poly([tx - 14, 112, tx + 14, 112, tx + 3, 30, tx - 3, 30], c('#5a2a3a')); for (let y = 36; y < 112; y += 6) { const hw = 3 + (y - 30) * 0.135; far.line(tx - hw, y, tx + hw, y + 6, c('#8a3a4a')); far.line(tx + hw, y, tx - hw, y + 6, c('#8a3a4a')); }
      far.rect(tx - 6, 40, 12, 6, c('#7a3a4a')); far.rect(tx - 1, 16, 2, 16, c('#5a2a3a')); far.px(tx, 15, c('#ff4040'));
      for (let a = 0; a < TAU; a += 0.02) far.px(260 + Math.cos(a) * 26, 84 + Math.sin(a) * 26, c('#6a3a5a')); for (let a = 0; a < TAU; a += TAU / 12) { far.line(260, 84, 260 + Math.cos(a) * 26, 84 + Math.sin(a) * 26, c('#6a3a5a')); far.rect(258 + Math.cos(a) * 26, 83 + Math.sin(a) * 26, 4, 3, c('#e86a6a')); } far.poly([254, 112, 266, 112, 261, 84, 259, 84], c('#4a2a3a'));
      // the pier: kiosks, railings, lamps, bunting
      mid.rect(0, 108, midW, 52, c('#5a3a2a'));
      const kiosk = (x, label, col) => { mid.rect(x, 64, 60, 50, c('#f4ecd8')); mid.rect(x + 56, 64, 4, 50, c('#c8bca0')); for (let i = 0; i < 6; i++) mid.rect(x - 4 + i * 11, 58, 11, 10, c(i & 1 ? '#f4f4f0' : col)); mid.rect(x - 4, 68, 68, 2, c('#7a4a3a')); mid.rect(x + 6, 74, 48, 14, c('#203070')); pbText(mid, label, x + 30 - label.length * 3, 78, '#ffe060'); mid.rect(x + 8, 92, 44, 20, c('#3a2a2a')); mid.rect(x + 10, 94, 40, 8, c('#f8d890')); };
      kiosk(40, 'CHIPS', '#d82a2a'); kiosk(250, 'ROCK', '#2a8ad8');
      for (let x = 0; x < midW; x += 70) { mid.rect(x + 20, 30, 3, 84, c('#2a3a5a')); mid.rect(x + 19, 30, 1, 84, c('#4a6a8a')); mid.ellipse(x + 21, 28, 5, 4, c('#fff4c0')); mid.ellipse(x + 21, 28, 3, 2, c('#ffffff')); }
      for (let x = 0; x < midW; x++) { const y = 36 + Math.abs(Math.sin(x / 70 * PI)) * 10; mid.px(x, y, c('#3a2a2a')); if (x % 8 === 0) mid.poly([x, y + 1, x + 5, y + 1, x + 2.5, y + 7], c(['#d82a2a', '#f8d820', '#2a8ad8', '#28a050'][(x / 8) % 4])); }
      mid.rect(0, 128, midW, 3, c('#f4f4f0')); mid.rect(0, 138, midW, 3, c('#f4f4f0')); mid.rect(0, 131, midW, 1, c('#a8a8a0')); mid.rect(0, 141, midW, 1, c('#a8a8a0'));
      for (let x = 4; x < midW; x += 16) { mid.rect(x, 124, 3, 36, c('#f4f4f0')); mid.rect(x + 2, 124, 1, 36, c('#a8a8a0')); mid.ellipse(x + 1.5, 123, 2, 2, c('#f4f4f0')); }
      const floor = floorPB(152, (u, w, x, y) => { const pl = ((u % 18) + 18) % 18, gap = pl < 1.2; const n = Math.floor(u / 18), seam = ((Math.floor(w * 0.9 + n * 37)) % 80) < 2; const base = ((n * 7919) % 3 + 3) % 3; let col = c(['#a8744a', '#9a6a44', '#b07c50'][base]); if (gap || seam) col = c('#4a2a1a'); else if (((x + y) & 1) && ((u * 3 + w) % 23) < 2) col = c('#8a5a38'); return col; });
      return { far, mid, floor, crowd: { seed: 22, n: 8, y: 154, xs: [20, 70, 120, 170, 220, 290, 330, 380], sc: 0.52, kinds: ['cheer', 'clap', 'wave'] },
        anim(g, t, cam) { for (let i = 0; i < 4; i++) { const x = ((t * (14 + i * 5) + i * 90) % 360) - 50 - cam * 0.3, y = 30 + i * 12 + Math.sin(t * 2 + i) * 4, f = Math.sin(t * 9 + i) > 0; g.fillStyle = '#f8f8f8'; g.fillRect(x | 0, y | 0, 2, 1); g.fillRect((x + 4) | 0, y | 0, 2, 1); g.fillRect((x + 2) | 0, (y + 1) | 0, 2, 1); g.fillStyle = '#404048'; g.fillRect(x | 0, (y + (f ? -1 : 1)) | 0, 1, 1); g.fillRect((x + 5) | 0, (y + (f ? -1 : 1)) | 0, 1, 1); } } };
    } },
    rio: { name: 'RIO MARKET SQUARE', hz: 152, music: 'rio', paint(R) {
      const c = hex32, far = new PB(farW, 160), mid = new PB(midW, 160);
      far.vgrad(0, 0, farW, 160, [c('#3a8ae8'), c('#68b8f8'), c('#b8e8ff')], 8);
      for (let i = 0; i < 5; i++) cloud(far, 20 + i * 70 + R() * 20, 24 + R() * 24, 0.9 + R() * 0.5, c('#ffffff'), c('#c8e0f8'));
      far.poly([150, 140, 180, 60, 198, 48, 214, 58, 240, 140], c('#2a7a4a')); far.poly([186, 70, 198, 50, 210, 58, 205, 80], c('#3a9a5a'));
      far.poly([0, 140, 40, 90, 90, 100, 130, 140], c('#3a8a50'));
      for (let i = 0; i < 60; i++) { const x = R() * farW, y = 104 + R() * 40; far.rect(x, y, 6, 5, c(['#f8d050', '#f87050', '#70c8f0', '#f0f0e8', '#f8a0c0'][Math.floor(R() * 5)])); far.px(x + 2, y + 2, c('#3a2a2a')); }
      far.rect(0, 140, farW, 20, c('#2a6a40'));
      // palms
      const palm = (x, y, h) => { for (let i = 0; i < h; i++) mid.rect(x + Math.sin(i / h * 1.5) * 6, y - i, 4, 1, c(i % 4 < 2 ? '#8a5a2a' : '#6a4020')); const tx = x + Math.sin(1.5) * 6 + 2, ty = y - h; for (let a = 0; a < 7; a++) { const an = -PI + a / 6 * PI; for (let k = 0; k < 18; k++) { const px = tx + Math.cos(an) * k, py = ty + Math.sin(an) * k * 0.5 + k * k * 0.03; mid.rect(px, py, 2, 2, c(k < 12 ? '#2a9a3a' : '#1a7a2a')); } } };
      palm(20, 120, 70); palm(380, 120, 80);
      // stalls
      const stall = (x, c1) => { for (let i = 0; i < 8; i++) mid.poly([x + i * 9, 60, x + i * 9 + 9, 60, x + i * 9 + 11, 72, x + i * 9 - 2, 72], c(i & 1 ? '#f8f8f0' : c1)); mid.rect(x - 2, 72, 76, 2, c('#5a3a1a')); mid.rect(x, 74, 3, 60, c('#6a4a2a')); mid.rect(x + 68, 74, 3, 60, c('#6a4a2a')); mid.rect(x - 2, 104, 76, 30, c('#8a5a30')); mid.rect(x - 2, 104, 76, 2, c('#b07a48')); for (let i = 0; i < 26; i++) { const fx = x + 2 + (i % 13) * 5.4, fy = 98 + Math.floor(i / 13) * 4; mid.ellipse(fx, fy, 2.6, 2.4, c(['#f8d020', '#e83a2a', '#f88a20', '#58c040', '#a040a0'][i % 5])); mid.px(fx - 1, fy - 1, c('#ffffff')); } };
      stall(50, '#28a048'); stall(170, '#e8c020'); stall(290, '#e83a3a');
      // the parrot perch
      mid.rect(150, 64, 2, 60, c('#6a4a2a')); mid.rect(144, 64, 14, 2, c('#6a4a2a'));
      for (let i = 0; i < midW; i += 6) { const y = 18 + Math.sin(i / midW * PI) * 10; mid.poly([i, y, i + 5, y, i + 2.5, y + 6], c(['#28a048', '#f8d020', '#2a5ad8'][(i / 6) % 3])); }
      mid.rect(0, 134, midW, 26, c('#d8c8a0'));
      const floor = floorPB(152, (u, w, x, y) => { const wave = Math.sin(u * 0.045) * 7; const v = (w * 0.55 + wave) % 14; let col = v < 4.5 ? c('#3a3430') : c('#e8dcc4'); if (v >= 4.5 && v < 5.5) col = c('#b8ac98'); if (((x * 7 + y * 13) % 23) === 0) col = v < 4.5 ? c('#4a4440') : c('#d4c8b0'); return col; });
      return { far, mid, floor, crowd: { seed: 33, n: 9, y: 152, xs: [10, 60, 110, 160, 200, 250, 290, 340, 390], sc: 0.5, kinds: ['cheer', 'wave', 'clap'] },
        anim(g, t, cam) { const x = 150 - cam * MID_K + 0, y = 56, f = Math.sin(t * 6) > 0.6; g.fillStyle = '#20202a'; g.fillRect(x - 1, y - 1, 9, 10); g.fillStyle = '#e83a2a'; g.fillRect(x, y, 7, 8); g.fillStyle = '#f8d020'; g.fillRect(x + 5, y + 1, 3, 2); g.fillStyle = '#2a5ad8'; g.fillRect(x - (f ? 3 : 0), y + (f ? 1 : 4), f ? 4 : 3, 4); g.fillStyle = '#fff'; g.fillRect(x + 4, y + 1, 1, 1); } };
    } },
    rink: { name: 'MOSCOW ICE RINK', hz: 150, music: 'rink', paint(R) {
      const c = hex32, far = new PB(farW, 160), mid = new PB(midW, 160);
      far.vgrad(0, 0, farW, 160, [c('#0a1030'), c('#1a2858'), c('#3a4a80'), c('#6a6aa0')], 10);
      for (let i = 0; i < 50; i++) far.px(R() * farW, R() * 80, c('#c8d8ff'));
      // a made-up cathedral with onion domes
      const dome = (x, y, r, col, h) => { far.rect(x - r * 0.7, y, r * 1.4, h, c('#d8d0c0')); far.rect(x - r * 0.7, y, 2, h, c('#f0e8d8')); windows(far, x - r * 0.7, y, r * 1.4, h, R, c('#f8d878'), c('#8a7a58'), 5); far.ellipse(x, y - r * 0.6, r, r * 0.9, c(col)); far.poly([x - r * 0.5, y - r * 1.1, x + r * 0.5, y - r * 1.1, x, y - r * 2.2], c(col)); far.ellipse(x - r * 0.35, y - r * 0.8, r * 0.25, r * 0.4, mixc(c(col), 0xffffffff, 0.4)); far.rect(x, y - r * 2.8, 1, r * 0.7, c('#f0c040')); far.rect(x - 1, y - r * 2.6, 3, 1, c('#f0c040')); };
      far.rect(150, 100, 110, 60, c('#c8c0b0')); dome(170, 90, 9, '#2a8a5a', 70); dome(205, 70, 14, '#d83a3a', 90); dome(240, 90, 9, '#2a5ad8', 70); dome(188, 100, 6, '#f0c040', 60); dome(222, 100, 6, '#e8e8f0', 60);
      for (let x = 0; x < farW; x += 30 + R() * 20) if (x < 140 || x > 270) { const h = 30 + R() * 30; far.rect(x, 160 - h, 26, h, c('#2a2a48')); windows(far, x, 160 - h, 26, h, R, c('#f8d878'), c('#4a4a68')); }
      // fir trees, the boards and the stands
      mid.rect(0, 90, midW, 70, c('#3a2a3a'));
      for (let r = 0; r < 3; r++) for (let x = 6 + r * 4; x < midW; x += 14) { mid.rect(x, 92 + r * 12, 12, 12, c(r & 1 ? '#4a3a48' : '#42343f')); }
      const fir = (x, y, s) => { for (let i = 0; i < 4; i++) { const w = (6 + i * 5) * s, yy = y + i * 9 * s; mid.poly([x, yy - 6 * s, x + w, yy + 8 * s, x - w, yy + 8 * s], c('#1a4a3a')); mid.poly([x, yy - 6 * s, x + w * 0.6, yy + 2 * s, x - w * 0.8, yy + 3 * s], c('#f0f4ff')); } mid.rect(x - 2, y + 36 * s, 4, 8 * s, c('#4a2a1a')); };
      fir(14, 40, 1.2); fir(396, 40, 1.2); fir(200, 56, 0.8);
      for (let x = 0; x < midW; x += 90) { mid.rect(x + 50, 20, 3, 100, c('#2a2a3a')); mid.ellipse(x + 51, 18, 6, 4, c('#f8e0a0')); }
      mid.rect(0, 128, midW, 32, c('#f4f4f8')); mid.rect(0, 128, midW, 3, c('#d82a2a')); mid.rect(0, 152, midW, 3, c('#2a4ad8')); for (let x = 0; x < midW; x += 64) { mid.rect(x, 131, 1, 21, c('#c0c0d0')); mid.rect(x + 8, 136, 40, 10, c('#2a4ad8')); pbText(mid, 'ICE', x + 19, 138, '#ffffff'); }
      const floor = floorPB(150, (u, w, x, y) => { const t = y / 74; let col = mixc(c('#a8c8e8'), c('#e8f4ff'), t); const sc = Math.abs(Math.sin(u * 0.05 + w * 0.08) * 40 - ((w * 1.7) % 40)) < 0.7; if (sc) col = c('#ffffff'); if (y < 30 && Math.abs(((u + 1000) % 90) - 45) < 3 && BAYER[(y & 3) * 4 + (x & 3)] < 9) col = c('#f8f0c0'); if (((u * 3 + w * 7) | 0) % 53 === 0) col = c('#88a8c8'); return col; });
      return { far, mid, floor, crowd: { seed: 44, n: 9, y: 130, xs: [20, 64, 108, 150, 196, 240, 284, 330, 372], sc: 0.46, hats: ['#5a3a2a', '#e8e0d0', '#2a2a3a', '#a02a2a'] },
        snow: 1 };
    } },
    safari: { name: 'KENYAN SAFARI', hz: 150, music: 'safari', paint(R) {
      const c = hex32, far = new PB(farW, 160), mid = new PB(midW, 160);
      far.vgrad(0, 0, farW, 160, [c('#e85a28'), c('#f88a30'), c('#f8c050'), c('#f8e0a0')], 10);
      far.ellipse(110, 110, 34, 34, c('#f8a040')); far.ellipse(110, 110, 30, 30, c('#f8d070')); far.ellipse(110, 110, 25, 25, c('#fff0b0'));
      far.poly([180, 140, 230, 90, 262, 86, 300, 140], c('#a85a5a')); far.poly([222, 98, 230, 90, 262, 86, 270, 96, 256, 94, 246, 99, 236, 95], c('#f8f0f0'));
      far.rect(0, 136, farW, 24, c('#c87a3a'));
      const acacia = (pb, x, y, s, col) => { pb.rect(x - 1, y - 30 * s, 3, 30 * s, col); pb.line(x, y - 20 * s, x - 10 * s, y - 34 * s, col); pb.line(x, y - 22 * s, x + 12 * s, y - 34 * s, col); pb.ellipse(x, y - 36 * s, 26 * s, 5 * s, col); pb.ellipse(x - 8 * s, y - 39 * s, 14 * s, 4 * s, col); };
      acacia(far, 40, 140, 1, c('#5a2a20')); acacia(far, 280, 140, 0.8, c('#5a2a20'));
      // grass, rocks, a resting lion, the jeep
      mid.rect(0, 120, midW, 40, c('#b88a3a'));
      for (let i = 0; i < 260; i++) { const x = R() * midW, y = 112 + R() * 46, h = 4 + R() * 9; mid.line(x, y, x + (R() - 0.5) * 4, y - h, c(R() < 0.5 ? '#d8b050' : '#a87a30')); }
      mid.ellipse(330, 120, 30, 16, c('#8a6a5a')); mid.ellipse(326, 114, 26, 10, c('#a8887a')); mid.ellipse(330, 102, 12, 6, c('#d8a050')); mid.ellipse(342, 98, 7, 7, c('#a86a28')); mid.ellipse(343, 99, 5, 5, c('#e8b060')); mid.px(345, 98, c('#202020')); mid.rect(318, 102, 6, 2, c('#d8a050'));
      acacia(mid, 30, 130, 1.6, c('#3a1a14'));
      const jx = 120; mid.rect(jx, 96, 110, 26, c('#d8c890')); mid.rect(jx, 96, 110, 3, c('#f0e4b0')); mid.rect(jx + 104, 100, 8, 18, c('#b8a870')); mid.rect(jx + 6, 78, 3, 18, c('#5a5a40')); mid.rect(jx + 100, 78, 3, 18, c('#5a5a40')); mid.rect(jx + 2, 74, 104, 5, c('#4a6a3a')); mid.ellipse(jx + 22, 124, 10, 10, c('#202020')); mid.ellipse(jx + 22, 124, 4, 4, c('#888')); mid.ellipse(jx + 88, 124, 10, 10, c('#202020')); mid.ellipse(jx + 88, 124, 4, 4, c('#888'));
      mid.rect(jx + 10, 104, 90, 3, c('#a89860'));
      const floor = floorPB(150, (u, w, x, y) => { const n = Math.sin(u * 0.13) * Math.cos(w * 0.31) + Math.sin(u * 0.041 + w * 0.17); let col = n > 0.9 ? c('#a86a38') : n > -0.6 ? c('#c8844a') : c('#b87840'); if (((u * 5 + w * 11) | 0) % 97 === 0 || (((u | 0) * 31 + (w | 0) * 17) % 151 === 0)) col = c('#d8b050'); return col; });
      return { far, mid, floor, crowd: { seed: 55, n: 4, y: 104, xs: [140, 165, 190, 212], sc: 0.44, kinds: ['cheer', 'wave'], hats: ['#d8c890', '#e8e0c8'] },
        anim(g, t, cam) { // giraffes strolling past in the distance
          for (let i = 0; i < 2; i++) { const x = ((t * 3 + i * 170) % 420) - 60 - cam * FAR_K, y = 136, b = Math.sin(t * 3 + i) * 1; g.fillStyle = '#5a2a20'; g.fillRect(x, y - 16, 16, 6); g.fillRect(x + 1, y - 10, 2, 10); g.fillRect(x + 12, y - 10, 2, 10); g.fillRect(x + 13, y - 32 + b, 3, 18); g.fillRect(x + 13, y - 34 + b, 7, 4); } } };
    } },
    paris: { name: 'PARIS CAFE', hz: 150, music: 'paris', paint(R) {
      const c = hex32, far = new PB(farW, 160), mid = new PB(midW, 160);
      far.vgrad(0, 0, farW, 160, [c('#2a2a68'), c('#6a4a8a'), c('#d87a8a'), c('#f8b890')], 10);
      for (let i = 0; i < 20; i++) far.px(R() * farW, R() * 40, c('#ffffff'));
      const tx = 230; far.poly([tx - 30, 150, tx - 6, 70, tx + 6, 70, tx + 30, 150, tx + 20, 150, tx, 110, tx - 20, 150], c('#3a3048')); far.poly([tx - 6, 72, tx - 2, 20, tx + 2, 20, tx + 6, 72], c('#3a3048')); far.rect(tx - 9, 70, 18, 3, c('#4a3e58')); far.rect(tx - 14, 104, 28, 3, c('#4a3e58')); far.rect(tx, 10, 1, 10, c('#3a3048')); far.px(tx, 9, c('#f8e070'));
      for (let x = 0; x < farW; x += 34) { const h = 40 + R() * 20; far.rect(x, 160 - h, 32, h, c('#4a4a6a')); far.poly([x - 2, 160 - h, x + 34, 160 - h, x + 28, 150 - h, x + 4, 150 - h], c('#5a6a8a')); far.rect(x + 8, 146 - h, 4, 6, c('#6a4a4a')); windows(far, x, 160 - h, 32, h, R, c('#f8d878'), c('#3a3a5a'), 6); }
      // the café
      mid.rect(0, 30, midW, 130, c('#e8dcc0')); for (let y = 30; y < 160; y += 8) mid.rect(0, y, midW, 1, c('#d0c4a8'));
      for (let x = 10; x < midW; x += 66) { mid.rect(x, 40, 40, 36, c('#5a3a2a')); mid.rect(x + 3, 43, 34, 30, c('#f8d890')); mid.rect(x + 19, 43, 2, 30, c('#5a3a2a')); mid.rect(x + 3, 57, 34, 2, c('#5a3a2a')); mid.rect(x - 2, 76, 44, 8, c('#7a5a3a')); for (let i = 0; i < 6; i++) mid.ellipse(x + 3 + i * 7, 74, 3, 3, c(['#e83a5a', '#f8d020', '#e83a5a'][i % 3])); }
      for (let i = 0; i < midW / 10; i++) mid.poly([i * 10, 88, i * 10 + 10, 88, i * 10 + 11, 100, i * 10 - 1, 100], c(i & 1 ? '#f4f4f0' : '#c82a3a'));
      mid.rect(0, 100, midW, 60, c('#3a2a2a')); mid.rect(130, 104, 120, 50, c('#f0c870')); for (let i = 0; i < 4; i++) mid.rect(130 + i * 30, 104, 2, 50, c('#5a3a2a'));
      pbText(mid, 'CAFE', 167, 112, '#8a3a1a', 2); pbText(mid, 'CHEZ GASTON', 157, 132, '#8a3a1a', 1);
      for (let x = 30; x < midW; x += 120) { mid.rect(x, 128, 30, 3, c('#d8d8d0')); mid.rect(x + 14, 131, 2, 22, c('#5a5a5a')); mid.rect(x + 8, 152, 14, 2, c('#5a5a5a')); }
      const floor = floorPB(150, (u, w, x, y) => { const row = Math.floor(w / 5), off = (row & 1) * 6, cx = ((u + off) % 12 + 12) % 12, ry = w % 5; let col = c(['#8a8090', '#7a7080', '#948a9a'][((Math.floor((u + off) / 12) * 7 + row) % 3 + 3) % 3]); if (cx < 1.2 || ry < 0.9) col = c('#4a4250'); return col; });
      return { far, mid, floor, crowd: { seed: 66, n: 8, y: 152, xs: [24, 60, 100, 300, 340, 380, 140, 260], sc: 0.5, kinds: ['clap', 'sit', 'wave'] } };
    } },
    rodeo: { name: 'TEXAS RODEO', hz: 152, music: 'rodeo', paint(R) {
      const c = hex32, far = new PB(farW, 160), mid = new PB(midW, 160);
      far.vgrad(0, 0, farW, 160, [c('#6a2a5a'), c('#d84a3a'), c('#f8904a'), c('#f8d080')], 10);
      far.poly([0, 130, 20, 80, 70, 80, 80, 130], c('#9a4a3a')); far.rect(20, 78, 50, 4, c('#b85a42')); far.poly([200, 130, 220, 96, 236, 96, 250, 130], c('#9a4a3a')); far.poly([260, 130, 270, 70, 300, 70, 320, 130], c('#8a3a32')); far.rect(270, 68, 30, 3, c('#b85a42'));
      far.rect(0, 128, farW, 32, c('#c87a4a'));
      for (let i = 0; i < 6; i++) { const x = 30 + i * 55 + R() * 20, h = 10 + R() * 10; far.rect(x, 140 - h, 3, h, c('#3a6a3a')); far.rect(x - 3, 134 - h * 0.6, 3, 2, c('#3a6a3a')); far.rect(x - 3, 130 - h * 0.6, 2, 5, c('#3a6a3a')); far.rect(x + 3, 132 - h * 0.4, 3, 2, c('#3a6a3a')); far.rect(x + 4, 128 - h * 0.4, 2, 5, c('#3a6a3a')); }
      // the barn, hay and fence
      mid.poly([40, 50, 110, 50, 130, 70, 130, 130, 20, 130, 20, 70], c('#b82a2a')); mid.poly([40, 50, 110, 50, 130, 70, 20, 70], c('#8a1a1a')); mid.rect(55, 80, 40, 50, c('#5a1a1a')); mid.line(55, 80, 95, 130, c('#f4f0e8')); mid.line(95, 80, 55, 130, c('#f4f0e8')); mid.rect(55, 80, 40, 2, c('#f4f0e8'));
      for (let i = 0; i < 3; i++) { const x = 280 + i * 28; mid.rect(x, 108, 26, 20, c('#e8c060')); mid.rect(x, 108, 26, 2, c('#f8e090')); for (let j = 0; j < 8; j++) mid.px(x + 2 + j * 3, 112 + (j % 3) * 4, c('#b8902a')); }
      for (let y of [110, 124, 138]) { mid.rect(0, y, midW, 5, c('#8a5a30')); mid.rect(0, y, midW, 1, c('#b07a48')); }
      for (let x = 0; x < midW; x += 40) { mid.rect(x, 104, 6, 56, c('#6a4020')); mid.rect(x, 104, 2, 56, c('#8a5a30')); }
      mid.rect(0, 150, midW, 10, c('#c8844a'));
      const floor = floorPB(152, (u, w, x, y) => { const n = Math.sin(u * 0.21 + w * 0.13) + Math.sin(u * 0.07 - w * 0.41); let col = n > 1.2 ? c('#b0683a') : n > -0.5 ? c('#d08a52') : c('#c47c46'); if (((u | 0) * 13 + (w | 0) * 29) % 113 === 0) col = c('#8a5030'); return col; });
      return { far, mid, floor, crowd: { seed: 77, n: 6, y: 106, xs: [160, 190, 220, 250, 340, 390], sc: 0.46, kinds: ['cheer', 'wave', 'sit'], hats: ['#c8a06a', '#5a3a1a', '#e8e0c8'] },
        cows: [140, 370],
        anim(g, t, cam) { // cows peeping over the fence (they chew), and the odd tumbleweed
          for (const cx of [146, 372]) { const x = cx - cam * MID_K, y = 96, ch = Math.sin(t * 5 + cx) > 0 ? 1 : 0; g.fillStyle = '#201818'; g.fillRect(x - 1, y - 1, 16, 15); g.fillStyle = '#f4f0e8'; g.fillRect(x, y, 14, 13); g.fillStyle = '#2a2020'; g.fillRect(x + 2, y + 1, 5, 4); g.fillRect(x + 9, y + 6, 4, 3); g.fillStyle = '#f0a0a0'; g.fillRect(x + 2, y + 9 + ch, 10, 4); g.fillStyle = '#202020'; g.fillRect(x + 3, y + 4, 2, 2); g.fillRect(x + 9, y + 4, 2, 2); g.fillStyle = '#d8c8a0'; g.fillRect(x - 3, y, 3, 2); g.fillRect(x + 14, y, 3, 2); }
          const tw = ((t * 40) % 900) - 120 - cam, a = t * 8; if (tw > -20 && tw < 280) { g.strokeStyle = '#8a6a3a'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(tw, 190 - Math.abs(Math.sin(t * 4)) * 6, 6 - i, a + i, a + i + 4); g.stroke(); } } } };
    } },
    market: { name: 'HONG KONG NIGHT MARKET', hz: 150, music: 'market', paint(R) {
      const c = hex32, far = new PB(farW, 160), mid = new PB(midW, 160);
      far.vgrad(0, 0, farW, 160, [c('#08081c'), c('#18183a'), c('#3a2050')], 8);
      for (let x = -4; x < farW;) { const w = 20 + R() * 24, h = 70 + R() * 80; far.rect(x, 160 - h, w, h, c('#1a1a30')); windows(far, x, 160 - h, w, h, R, c('#f0e0a0'), c('#80c0e0')); if (R() < 0.6) { const sx = x + 3, sy = 160 - h + 10 + R() * 30, col = c(['#ff4060', '#40ff80', '#ffd040', '#40c0ff'][Math.floor(R() * 4)]); far.rect(sx, sy, 6, 30, c('#100a10')); for (let j = 0; j < 5; j++) far.rect(sx + 1, sy + 2 + j * 6, 4, 4, col); } x += w + 1; }
      // stalls with lanterns, steam, bikes
      mid.rect(0, 70, midW, 90, c('#2a1a1a'));
      const stall = (x, col) => { mid.rect(x, 66, 80, 8, c(col)); mid.rect(x, 74, 80, 2, c('#1a0a0a')); mid.rect(x + 2, 76, 76, 40, c('#4a2a20')); for (let i = 0; i < 5; i++) mid.rect(x + 6 + i * 15, 86, 10, 22, c(['#f8d080', '#e86a3a', '#f8f0d0', '#a8d850', '#e84a4a'][i])); mid.rect(x, 112, 80, 26, c('#6a3a2a')); mid.rect(x, 112, 80, 2, c('#8a5a3a')); };
      stall(10, '#d82a2a'); stall(150, '#2a8a5a'); stall(290, '#d8a02a');
      for (let x = 0; x < midW; x++) mid.px(x, 30 + Math.abs(Math.sin(x / 82 * PI)) * 8, c('#100808'));
      mid.rect(110, 120, 30, 2, c('#5a5a6a')); mid.ellipse(112, 128, 6, 6, c('#3a3a4a')); mid.ellipse(138, 128, 6, 6, c('#3a3a4a'));
      mid.rect(0, 138, midW, 22, c('#3a2a2a'));
      const floor = floorPB(150, (u, w, x, y) => { const tx = Math.floor(u / 20), ty = Math.floor(w / 9), ex = ((u % 20) + 20) % 20, ey = w % 9; let col = (tx + ty) & 1 ? c('#6a2a2a') : c('#3a4a3a'); if (ex < 1 || ey < 0.8) col = c('#1a1a1a'); else if (y < 26 && Math.abs(((u + 4000) % 82) - 41) < 4 && BAYER[(y & 3) * 4 + (x & 3)] < 7) col = c('#e86a3a'); return col; });
      return { far, mid, floor, crowd: { seed: 88, n: 9, y: 150, xs: [20, 60, 100, 140, 190, 230, 270, 330, 380], sc: 0.48, kinds: ['cheer', 'clap', 'wave'] },
        anim(g, t, cam) { // swinging lanterns and steam
          for (let i = 0; i < 5; i++) { const lx = 41 + i * 82 - cam * MID_K, sw = Math.sin(t * 2 + i) * 2, ly = 40 + Math.abs(Math.sin((41 + i * 82) / 82 * PI)) * 8; g.fillStyle = '#100808'; g.fillRect(lx, ly - 8, 1, 8); g.fillStyle = '#801010'; g.fillRect(lx - 6 + sw, ly, 13, 11); g.fillStyle = '#e82a2a'; g.fillRect(lx - 5 + sw, ly + 1, 11, 9); g.fillStyle = '#f8a060'; g.fillRect(lx - 2 + sw, ly + 2, 5, 7); g.fillStyle = '#f8d020'; g.fillRect(lx - 1 + sw, ly + 11, 3, 3); }
          g.fillStyle = 'rgba(240,240,255,.35)'; for (let i = 0; i < 6; i++) { const p = (t * 0.6 + i / 6) % 1, x = 200 - cam * MID_K + Math.sin(p * 9 + i) * 5, y = 82 - p * 40; g.fillRect(x - 2, y - 2, 4 + p * 4, 4 + p * 3); } } };
    } },
    airship: { name: "THE BARON'S BLIMP", hz: 148, music: 'airship', paint(R) {
      const c = hex32, far = new PB(farW, 160), mid = new PB(midW, 160);
      far.vgrad(0, 0, farW, 160, [c('#100820'), c('#2a1048'), c('#5a2a68'), c('#8a5a88')], 10);
      far.ellipse(260, 34, 16, 16, c('#e8e0f8')); far.ellipse(265, 30, 14, 14, c('#3a1a58'));
      for (let i = 0; i < 30; i++) far.px(R() * farW, R() * 70, c('#d0c0ff'));
      // the envelope of the blimp up above, with ribs
      mid.ellipse(midW / 2, -30, midW * 0.7, 70, c('#4a2a3a')); for (let i = -8; i <= 8; i++) { const x = midW / 2 + i * 26; for (let y = 0; y < 40 - Math.abs(i) * 3; y++) mid.px(x + y * i * 0.05, y, c('#3a1a2a')); }
      mid.rect(0, 0, midW, 4, c('#2a1020'));
      // propellers housings, rigging, rails
      for (const px of [40, 370]) { mid.rect(px - 6, 30, 12, 50, c('#5a5a6a')); mid.rect(px - 6, 30, 3, 50, c('#7a7a8a')); mid.ellipse(px, 82, 10, 6, c('#4a4a58')); }
      for (let x = 0; x < midW; x += 40) mid.line(x, 0, x + 20, 120, c('#2a2a38'));
      mid.rect(0, 120, midW, 40, c('#3a3a48')); mid.rect(0, 116, midW, 4, c('#9a9aa8')); mid.rect(0, 116, midW, 1, c('#c8c8d8'));
      for (let x = 0; x < midW; x += 18) { mid.rect(x, 116, 3, 24, c('#6a6a7a')); mid.rect(x, 116, 1, 24, c('#9a9aa8')); }
      mid.rect(0, 130, midW, 2, c('#9a9aa8')); mid.rect(170, 40, 70, 40, c('#2a1a2a')); mid.rect(172, 42, 66, 36, c('#6a1a2c')); for (let i = 0; i < 5; i++) { const a = -PI / 2 + i * TAU / 5; mid.line(205, 60, 205 + Math.cos(a) * 14, 60 + Math.sin(a) * 14, c('#f0c040')); }
      const floor = floorPB(148, (u, w, x, y) => { const px = ((u % 48) + 48) % 48, py = w % 16; let col = (Math.floor(u / 48) + Math.floor(w / 16)) & 1 ? c('#5a5a68') : c('#626272'); if (px < 1.3 || py < 0.9) col = c('#2a2a34'); else if ((Math.abs(px - 4) < 0.8 || Math.abs(px - 44) < 0.8) && (Math.abs(py - 3) < 0.7 || Math.abs(py - 13) < 0.7)) col = c('#a8a8b8'); return col; });
      return { far, mid, floor, crowd: { seed: 99, n: 7, y: 120, xs: [60, 100, 140, 260, 300, 340, 380], sc: 0.46, kinds: ['salute'], tops: ['#2a2a3a', '#3a3a4a'], hats: ['#2a2a3a'] },
        clouds: 1,
        anim(g, t, cam) { // spinning propellers and the odd lightning flash
          for (const px of [40, 370]) { const x = px - cam * MID_K, y = 82, a = t * 30; g.fillStyle = '#c8c8d8'; for (let k = 0; k < 3; k++) { const an = a + k * TAU / 3, l = 22 * Math.abs(Math.cos(an)); g.fillRect(x - 1, y + 4, 3, 3); g.fillRect(x + (Math.cos(an) < 0 ? -l : 0), y + 5, l, 1); } }
          const fl = (t % 7); if (fl < 0.12 || (fl > 0.25 && fl < 0.32)) { g.fillStyle = 'rgba(230,220,255,.35)'; g.fillRect(0, 0, W, 150); } } };
    } },
    garden: { name: "DAD'S DRIVEWAY", hz: 150, music: 'bonus', paint(R) {
      const c = hex32, far = new PB(farW, 160), mid = new PB(midW, 160);
      far.vgrad(0, 0, farW, 160, [c('#4a8ae0'), c('#88c0f8'), c('#d8f0ff')], 8);
      for (let i = 0; i < 4; i++) cloud(far, 30 + i * 80 + R() * 20, 26 + R() * 20, 1 + R() * 0.4, c('#ffffff'), c('#c8dcf0'));
      for (let x = -10; x < farW; x += 78) { far.rect(x, 70, 72, 90, c('#b85a3a')); for (let y = 72; y < 160; y += 4) far.rect(x, y, 72, 1, c('#a04a30')); far.poly([x - 6, 70, x + 78, 70, x + 64, 44, x + 8, 44], c('#5a4a4a')); far.rect(x + 10, 84, 18, 16, c('#f4f4f0')); far.rect(x + 12, 86, 14, 12, c('#7ab0d8')); far.rect(x + 44, 84, 18, 16, c('#f4f4f0')); far.rect(x + 46, 86, 14, 12, c('#7ab0d8')); far.rect(x + 30, 112, 12, 26, c(['#2a5a2a', '#8a1a1a', '#1a3a7a'][Math.floor(R() * 3)])); far.rect(x + 50, 36, 6, 10, c('#8a4a3a')); }
      // fence, hedge, garage, wheelie bin
      for (let x = 0; x < midW; x += 10) { mid.rect(x, 96, 9, 44, c('#9a6a3a')); mid.rect(x, 96, 2, 44, c('#b88a50')); mid.rect(x + 8, 96, 1, 44, c('#6a4420')); }
      mid.rect(0, 104, midW, 3, c('#6a4420')); mid.rect(0, 128, midW, 3, c('#6a4420'));
      for (let i = 0; i < 40; i++) mid.ellipse(R() * midW, 140 + R() * 6, 8 + R() * 6, 6, c(R() < 0.5 ? '#2a7a3a' : '#3a9a4a'));
      mid.rect(300, 60, 100, 90, c('#d8d0c0')); mid.rect(306, 70, 88, 80, c('#e8e8e0')); for (let y = 74; y < 150; y += 6) mid.rect(306, y, 88, 1, c('#b8b8b0'));
      mid.rect(40, 112, 22, 34, c('#2a6a3a')); mid.rect(38, 108, 26, 6, c('#1a5a2a')); mid.ellipse(44, 148, 3, 3, c('#202020'));
      mid.rect(0, 146, midW, 14, c('#b8b0a0'));
      const floor = floorPB(150, (u, w, x, y) => { const bx = Math.floor(u / 10), by = Math.floor(w / 4); const hb = (bx + by) & 1; const ex = ((u % 10) + 10) % 10, ey = w % 4; let col = hb ? c('#b8705a') : c('#a8604a'); if (ex < 0.9 || ey < 0.6) col = c('#6a4038'); return col; });
      return { far, mid, floor, crowd: { seed: 5, n: 0, y: 150, xs: [] } };
    } },
  };

  // ================================================================ moves: the normals (frames: startup, active, recovery; ai = the pose that hits)
  const NORM = {
    lp: { a: 'lp', f: [3, 3, 6], ai: 1, dmg: 30, s: 0, hit: 'fistF', r: 7, can: 1 },
    mp: { a: 'mp', f: [4, 4, 10], ai: 1, dmg: 55, s: 1, hit: 'fistB', r: 7, can: 1 },
    hp: { a: 'hp', f: [6, 4, 16], ai: 1, dmg: 90, s: 2, hit: 'fistB', r: 8 },
    lk: { a: 'lk', f: [4, 3, 8], ai: 1, dmg: 32, s: 0, hit: 'tF', r: 7 },
    mk: { a: 'mk', f: [5, 4, 12], ai: 1, dmg: 60, s: 1, hit: 'tF', r: 7, can: 1 },
    hk: { a: 'hk', f: [7, 4, 18], ai: 1, dmg: 95, s: 2, hit: 'tB', r: 9 },
    clp: { a: 'clp', f: [3, 3, 5], ai: 1, dmg: 25, s: 0, hit: 'fistF', r: 6, can: 1, cr: 1 },
    cmp: { a: 'cmp', f: [4, 4, 9], ai: 1, dmg: 50, s: 1, hit: 'fistB', r: 6, can: 1, cr: 1 },
    chp: { a: 'chp', f: [4, 6, 17], ai: 1, dmg: 85, s: 2, hit: 'fistB', r: 10, cr: 1, aa: 1 },
    clk: { a: 'clk', f: [3, 3, 7], ai: 1, dmg: 25, s: 0, hit: 'tF', r: 6, lo: 1, can: 1, cr: 1 },
    cmk: { a: 'cmk', f: [5, 4, 11], ai: 1, dmg: 55, s: 1, hit: 'tF', r: 7, lo: 1, can: 1, cr: 1 },
    chk: { a: 'chk', f: [7, 4, 20], ai: 2, dmg: 85, s: 2, hit: 'tB', r: 8, lo: 1, kd: 1, cr: 1 },
    jlp: { a: 'jp', f: [3, 12, 0], ai: 1, dmg: 45, s: 0, hit: 'fistF', r: 8, ov: 1, air: 1 },
    jmp: { a: 'jp', f: [4, 10, 0], ai: 1, dmg: 60, s: 1, hit: 'fistF', r: 8, ov: 1, air: 1 },
    jhp: { a: 'jhp', f: [5, 8, 0], ai: 1, dmg: 85, s: 2, hit: 'fistB', r: 9, ov: 1, air: 1 },
    jlk: { a: 'jk', f: [3, 14, 0], ai: 1, dmg: 45, s: 0, hit: 'tF', r: 8, ov: 1, air: 1 },
    jmk: { a: 'jk', f: [4, 10, 0], ai: 1, dmg: 65, s: 1, hit: 'tF', r: 9, ov: 1, air: 1 },
    jhk: { a: 'jhk', f: [5, 8, 0], ai: 1, dmg: 90, s: 2, hit: 'tF', r: 10, ov: 1, air: 1 },
  };
  for (const k in NORM) NORM[k].id = k;
  const BTN = { y: 'lp', x: 'mp', l: 'hp', b: 'lk', a: 'mk', r: 'hk' };
  const BTN_ORDER = ['l', 'r', 'x', 'a', 'y', 'b'];
  const SP = {
    ball: { n: 'SPIRIT BALL', in: 'qcf', b: 'p', ty: 'proj', kind: 'ball', a: 'shoot', st: 10, rec: 28, dmg: 80, spd: [2.4, 3.2, 4.0] },
    skyfist: { n: 'SKY FIST', in: 'dp', b: 'p', ty: 'rise', a: 'rise', dmg: [90, 105, 120], inv: 8, vy: [5.4, 6.4, 7.2], vx: [1.0, 1.3, 1.6], hits: [1, 1, 2], hit: 'fistB' },
    twister: { n: 'TWISTER KICK', in: 'qcb', b: 'k', ty: 'spin', a: 'spinkick', dmg: [45, 45, 45], dur: [26, 36, 46], vx: [1.8, 2.2, 2.6] },
    pierdriver: { n: 'PIER DRIVER', in: '360', b: 'p', ty: 'cgrab', dmg: [180, 200, 220], rng: [48, 44, 40] },
    windmill: { n: 'WINDMILL ARMS', in: 'mashP', b: 'p', ty: 'windmill', a: 'windmill', dmg: [30, 30, 30], dur: 44 },
    roll: { n: 'CANNONBALL ROLL', in: 'chgBF', b: 'k', ty: 'rush', a: 'ball', cyc: 1, y: -24, r: 15, dmg: [80, 90, 100], vx: [3.8, 4.6, 5.4], dur: [22, 26, 30], kd: 1 },
    spring: { n: 'SAMBA SPRING', in: 'chgDU', b: 'k', ty: 'rise', a: 'wheel', cyc: 1, dmg: [85, 100, 115], inv: 8, vy: [6, 6.8, 7.6], vx: [0.8, 1.1, 1.4], hits: [1, 2, 2], hit: 'tF' },
    axel: { n: 'TRIPLE AXEL', in: 'qcf', b: 'k', ty: 'rush', a: 'axel', spin: 1, y: -48, r: 17, dmg: [35, 35, 35], vx: [2.4, 2.9, 3.4], dur: [24, 30, 36], multi: 8 },
    spike: { n: 'ICE SPIKE', in: 'dp', b: 'k', ty: 'rise', a: 'spikek', dmg: [90, 105, 120], inv: 7, vy: [5.8, 6.6, 7.4], vx: [0.6, 0.9, 1.2], hits: [1, 1, 2], hit: 'tF' },
    snowball: { n: 'SNOWBALL', in: 'qcb', b: 'p', ty: 'proj', kind: 'snow', a: 'shoot', st: 12, rec: 26, dmg: 70, spd: [2.2, 2.8, 3.4], lob: 1 },
    sprint: { n: 'SPRINT SLIDE', in: 'qcf', b: 'k', ty: 'rush', a: 'slide', y: -10, r: 13, lo: 1, dmg: [70, 80, 90], vx: [4.4, 5.2, 6.0], dur: [18, 22, 26], kd: 1 },
    leap: { n: 'HIGH JUMP KNEE', in: 'dp', b: 'p', ty: 'rise', a: 'knee', dmg: [85, 100, 115], inv: 7, vy: [6.2, 7.0, 7.8], vx: [1.2, 1.5, 1.8], hits: [1, 1, 2], hit: 'kF' },
    slaps: { n: 'HUNDRED SLAPS', in: 'mashP', b: 'p', ty: 'mash', a: 'slap', dmg: [24, 24, 24], hit: 'fistF' },
    souffle: { n: 'FLYING SOUFFLE', in: 'chgBF', b: 'p', ty: 'rush', a: 'torpedo', y: -42, air: 1, r: 17, dmg: [85, 95, 105], vx: [4.0, 4.8, 5.6], dur: [22, 26, 30], kd: 1 },
    lasso: { n: 'LASSO LOOP', in: 'chgBF', b: 'p', ty: 'proj', kind: 'lasso', a: 'lasso', st: 12, rec: 24, dmg: 80, spd: [2.6, 3.4, 4.2] },
    rodeo: { n: 'RODEO FLIP', in: 'chgDU', b: 'k', ty: 'rise', a: 'flashk', cyc: 1, dmg: [95, 110, 125], inv: 9, vy: [5.8, 6.6, 7.4], vx: [0.4, 0.6, 0.8], hits: [1, 1, 2], hit: 'tF' },
    legs: { n: 'LIGHTNING LEGS', in: 'mashK', b: 'k', ty: 'mash', a: 'legs', dmg: [24, 24, 24], hit: 'tF' },
    palm: { n: 'PALM WAVE', in: 'qcf', b: 'p', ty: 'proj', kind: 'palm', a: 'shoot', st: 10, rec: 24, dmg: 75, spd: [1.8, 2.3, 2.8], life: [42, 58, 76] },
    phoenix: { n: 'PHOENIX KICK', in: 'chgDU', b: 'k', ty: 'rise', a: 'bike', cyc: 1, dmg: [90, 105, 120], inv: 8, vy: [6, 6.8, 7.6], vx: [0.8, 1.1, 1.4], hits: [2, 2, 3], hit: 'tF' },
    blaster: { n: 'BARON BLASTER', in: 'chgBF', b: 'p', ty: 'rush', a: 'torpedo', y: -42, air: 1, r: 19, dmg: [95, 110, 125], vx: [4.6, 5.4, 6.2], dur: [24, 28, 32], kd: 1, aura: 1 },
    crusher: { n: 'SKY CRUSHER', in: 'dp', b: 'k', ty: 'rise', a: 'spikek', dmg: [100, 115, 130], inv: 8, vy: [6, 7, 7.8], vx: [0.6, 0.9, 1.2], hits: [1, 2, 2], hit: 'tF' },
    barrage: { n: 'BARON BOLT', in: 'qcf', b: 'p', ty: 'proj', kind: 'bolt', a: 'shoot', st: 10, rec: 26, dmg: 90, spd: [2.8, 3.6, 4.4] },
  };
  for (const k in SP) SP[k].id = k;
  const INTXT = { qcf: '↓ → + ', qcb: '↓ ← + ', dp: '→ ↓ → + ', '360': 'SPIN THE PAD + ', chgBF: 'HOLD ←, THEN → + ', chgDU: 'HOLD ↓, THEN ↑ + ', mashP: 'BASH PUNCH FAST', mashK: 'BASH KICK FAST' };
  const moveText = (m) => (INTXT[m.in] || '') + (m.in.startsWith('mash') ? '' : m.b === 'p' ? 'PUNCH' : 'KICK');
  const STATS = { kenji: [1.5, 1.2, 6.6, 1.9], barry: [1.05, 0.9, 6.0, 1.6], luana: [1.7, 1.4, 6.8, 2.1], olga: [1.8, 1.5, 6.8, 2.0], kip: [2.0, 1.6, 7.0, 2.3], gaston: [1.2, 1.0, 6.2, 1.7], hank: [1.4, 1.2, 6.5, 1.9], mei: [1.7, 1.4, 7.2, 2.1], baron: [1.45, 1.25, 6.6, 2.0] };
  const GRAV = 0.32, MAXHP = 1000;
  const POW = { barry: [1.2, 0.84], gaston: [1.1, 0.9], hank: [1.05, 0.95], kip: [0.95, 1.05], olga: [0.95, 1.04], mei: [0.96, 1.0], luana: [1, 1], kenji: [1, 1], baron: [1.08, 0.88] };

  // ================================================================ a fighter's baked sprites (made bit by bit so a phone never stalls)
  const SC = 1.1;
  function bakeJob(C, alt) {
    const prep = prepChar(C, alt), P = poseSet(C), FR = {}, list = [];
    for (const k in P) P[k].forEach((p, i) => list.push([k, i, p]));
    let n = 0;
    return { FR, total: list.length, get done() { return n >= list.length; }, step(ms) {
      const t0 = Date.now(); while (n < list.length && Date.now() - t0 < ms) { const [k, i, p] = list[n++]; const f = renderPose(prep, p, SC); f.cv = hasDoc ? f.pb.canvas() : null; f.pb = null; (FR[k] = FR[k] || [])[i] = f; }
      return n >= list.length; } };
  }
  function flashOf(f) { // a white silhouette of a frame (hit flash)
    if (f.wcv || !hasDoc) return f.wcv; const c = canvas(f.cv.width, f.cv.height), g = c.getContext('2d'); g.drawImage(f.cv, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); return f.wcv = c;
  }

  // ================================================================ the fight
  function makeFighter(C, side, FR, alt) {
    const st = STATS[C.id];
    return { C, side, FR, alt, x: side ? 330 : 182, y: 0, vx: 0, vy: 0, face: side ? -1 : 1, hp: MAXHP, dhp: MAXHP, st: 'idle', t: 0, atk: null, sp: null,
      pow: (POW[C.id] || [1, 1])[0], def: (POW[C.id] || [1, 1])[1], walkF: st[0], walkB: st[1], jvy: st[2], jvx: st[3], ib: { d: new Uint8Array(64), n: 0 }, chB: 0, chD: 0, chBm: 0, chDm: 0, mash: [], buf: null,
      combo: 0, stun: 0, stunT: 0, dizzyUsed: 0, inv: 0, flash: 0, wins: 0, dmgTaken: 0, anim: 'idle', fi: 0, mir: 0, proj: null, ai: null, hitsLanded: 0, jumpAtk: 0, lastAtkT: 0 };
  }
  const NEUTRAL = { idle: 1, walk: 1, crouch: 1, walkb: 1 };
  function Fight(o) {
    // o: { K, snd, A: [C, alt], B: [C, alt], FR: [frA, frB], stage, mode: 'arcade'|'demo'|'training'|'bonus', lvl, onEnd(res), boss }
    const K = o.K, snd = o.snd, sfx = o.sfx || (() => {});
    const M = { t: 0, round: 1, timer: 99, tsub: 0, state: 'intro', st: 0, stop: 0, slow: 0, shake: 0, cam: 128, fx: [], proj: [], texts: [], score: 0, roundScore: 0, perfect: false, over: false, hits: 0, bestCombo: 0, mode: o.mode, kos: [], drawRounds: 0, maxRounds: 4 };
    const P1 = makeFighter(o.A[0], 0, o.FR[0], o.A[1]);
    const P2 = o.bonus ? { fridge: 1, C: { id: 'fridge', b: { chR: 15 }, moves: [] }, side: 1, x: 330, y: 0, vx: 0, vy: 0, face: -1, hp: MAXHP, dhp: MAXHP, st: 'idle', t: 0, ib: { d: new Uint8Array(64), n: 0 }, inv: 0, flash: 0, wins: 0, dmgTaken: 0, combo: 0, stun: 0, mir: 0, lastAtkT: -1, hitT: 0 } : makeFighter(o.B[0], 1, o.FR[1], o.B[1]);
    M.p = [P1, P2]; P1.opp = P2; P2.opp = P1;
    if (o.boss) P2.dmgK = 1.1;
    const lvl = o.lvl == null ? 0.5 : o.lvl;
    if (o.mode === 'demo') { P1.ai = mkAI(0.55); P2.ai = mkAI(0.55); }
    else if (o.mode !== 'training') P2.ai = mkAI(lvl);
    M.dummy = 'stand';
    const addScore = n => { if (M.mode === 'arcade' && n > 0) { M.score += n; M.roundScore += n; } };
    // --------------------------------------------------------------- state helpers
    const set = (F, st, t) => { F.st = st; F.t = t || 0; };
    const grounded = F => F.y >= 0 && (F.st !== 'air' && F.st !== 'fall' && F.st !== 'thrown' && !(F.sp && F.sp.air));
    const actionable = F => NEUTRAL[F.st] || (F.st === 'land' && F.t <= 0);
    function frameOf(F) { const a = F.FR[F.anim] || F.FR.idle; return a[Math.min(a.length - 1, F.fi)] || F.FR.idle[0]; }
    function faceOpp(F) { if (Math.abs(F.opp.x - F.x) > 2) F.face = F.opp.x > F.x ? 1 : -1; }
    function rel(F, d) { // numpad direction relative to facing (6 = towards the opponent)
      if (F.face < 0) d = ({ 1: 3, 3: 1, 4: 6, 6: 4, 7: 9, 9: 7 })[d] || d; return d;
    }
    // --------------------------------------------------------------- input -> intent
    function humanIntent(F) {
      const u = K.held('up'), dn = K.held('down'), l = K.held('left'), r = K.held('right');
      const vy = u ? 8 : dn ? 2 : 5, hx = l && !r ? -1 : r && !l ? 1 : 0;
      let d = vy === 8 ? (hx < 0 ? 7 : hx > 0 ? 9 : 8) : vy === 2 ? (hx < 0 ? 1 : hx > 0 ? 3 : 2) : (hx < 0 ? 4 : hx > 0 ? 6 : 5);
      d = rel(F, d);
      let btn = null; for (const b of BTN_ORDER) if (K.pressed(b)) { btn = BTN[b]; break; }
      const presses = []; for (const b of BTN_ORDER) if (K.pressed(b)) presses.push(BTN[b]);
      return { d, btn, presses };
    }
    function dummyIntent(F) {
      const m = M.dummy; if (m === 'crouch') return { d: 2 }; if (m === 'jump') return { d: 8 }; if (m === 'block') { const a = F.opp.atk || F.opp.sp; return { d: a && a.m && a.m.lo ? 1 : 4 }; }
      if (m === 'cpu') { if (!F.ai) F.ai = mkAI(0.5); return aiThink(F); } return { d: 5 };
    }
    // the motion inputs (on the direction history)
    const inSet = (d, s) => s.indexOf(d) >= 0;
    function seq(F, steps, win) { const ib = F.ib; let k = steps.length - 1; for (let i = ib.n - 1, lim = Math.max(0, ib.n - win); i >= lim; i--) { if (inSet(ib.d[i & 63], steps[k])) { k--; if (k < 0) return true; } } return false; }
    function recentDirs(F, win) { const ib = F.ib, g = { L: 0, D: 0, R: 0, U: 0 }; for (let i = ib.n - 1, lim = Math.max(0, ib.n - win); i >= lim; i--) { const d = ib.d[i & 63]; if (inSet(d, [1, 4, 7])) g.L = 1; if (inSet(d, [1, 2, 3])) g.D = 1; if (inSet(d, [3, 6, 9])) g.R = 1; if (inSet(d, [7, 8, 9])) g.U = 1; } return g; }
    function specialFor(F, btn, presses) {
      const isP = btn && btn[1] === 'p', s = btn ? ({ l: 0, m: 1, h: 2 })[btn[0]] : 0;
      const order = F.C.moves.map(id => SP[id]).sort((a, b) => (b.in === 'dp' ? 1 : 0) - (a.in === 'dp' ? 1 : 0));
      for (const m of order) {
        if (m.in === 'mashP' || m.in === 'mashK') { const want = m.in === 'mashP' ? 'p' : 'k'; if (presses && presses.some(p => p[1] === want)) { const n = F.mash.filter(x => x[1][1] === want && M.t - x[0] < 40).length; if (n >= 4) return [m, s]; } continue; }
        if (!btn || (m.b === 'p') !== isP) continue;
        if (m.in === 'qcf' && seq(F, [[2], [3, 6]], 14) && inSet(F.ib.d[(F.ib.n - 1) & 63], [3, 6, 5, 9])) return [m, s];
        if (m.in === 'qcb' && seq(F, [[2], [1, 4]], 14) && inSet(F.ib.d[(F.ib.n - 1) & 63], [1, 4, 5, 7])) return [m, s];
        if (m.in === 'dp' && seq(F, [[6], [2, 1], [3]], 18)) return [m, s];
        if (m.in === '360') { const g = recentDirs(F, 34); if (g.L && g.D && g.R) return [m, s]; }
        if (m.in === 'chgBF' && F.chBm >= 36 && inSet(F.ib.d[(F.ib.n - 1) & 63], [6, 3, 9])) return [m, s];
        if (m.in === 'chgDU' && F.chDm >= 36 && inSet(F.ib.d[(F.ib.n - 1) & 63], [7, 8, 9])) return [m, s];
      }
      return null;
    }
    // --------------------------------------------------------------- starting things
    function startNormal(F, id) {
      const m = NORM[id]; F.atk = { m, t: 0, hit: 0, contact: 0 }; F.anim = m.a; F.fi = 0; F.lastAtkT = M.t; snd.whoosh(m.s);
      if (!m.air) { set(F, 'atk'); F.vx = 0; }
    }
    function startSpecial(F, m, s) {
      if (m.ty === 'proj' && F.proj) return false;
      F.atk = null; F.sp = { m, s, t: 0, hits: 0, lastHit: -99, air: !!m.air }; set(F, 'sp'); F.vx = 0; F.lastAtkT = M.t;
      F.anim = m.a || 'idle'; F.fi = 0; F.mir = 0;
      if (m.ty === 'rise') F.inv = m.inv;
      if (m.ty === 'windmill' || m.ty === 'mash') F.sp.end = m.ty === 'mash' ? 34 : m.dur;
      if (F === P1 && M.mode === 'training') M.lastSp = m.n;
      return true;
    }
    function tryThrow(F, btn, d) {
      const O = F.opp; if (!(btn === 'hp' || btn === 'hk') || !(d === 4 || d === 6)) return false;
      if (Math.abs(O.x - F.x) > 38 || !grounded(O) || O.inv > 0 || !(NEUTRAL[O.st] || O.st === 'atk' || O.st === 'land')) return false;
      if (O.st === 'hit' || O.st === 'block') return false;
      F.atk = null; O.atk = null; O.sp = null;
      set(F, 'throw'); set(O, 'thrown'); F.anim = 'grab'; F.fi = 0; O.anim = 'hit'; O.fi = 0; O.thr = { by: F, x0: O.x, back: d === 4, cmd: 0 }; snd.grab(); F.lastAtkT = M.t;
      return true;
    }
    // --------------------------------------------------------------- the per-frame update of one fighter
    function feed(F, I) { // every frame (even frozen ones): direction history, charges, mashing, the button buffer
      const d = I.d, ib = F.ib; ib.d[ib.n & 63] = d; ib.n++;
      if (inSet(d, [1, 4, 7])) F.chB++; else { if (F.chB >= 36) F.chBr = 10; F.chB = 0; }
      if (inSet(d, [1, 2, 3])) F.chD++; else { if (F.chD >= 36) F.chDr = 10; F.chD = 0; }
      if (F.chBr > 0) F.chBr--; if (F.chDr > 0) F.chDr--;
      F.chBm = F.chB >= 36 || F.chBr > 0 ? 99 : 0; F.chDm = F.chD >= 36 || F.chDr > 0 ? 99 : 0;
      if (I.presses) for (const p of I.presses) F.mash.push([M.t, p]);
      if (F.mash.length > 12) F.mash.splice(0, F.mash.length - 12);
      if (I.btn) F.buf = [I.btn, M.t, I.presses];
    }
    function control(F, I) {
      const O = F.opp, d = I.d, ib = F.ib;
      if (F.st === 'dizzy') { if (I.btn || (d !== 5 && F.ib.d[(ib.n - 2) & 63] !== d)) F.t -= 3; return; }
      // specials (also as cancels out of a normal that connected, and out of the jump start)
      const can = actionable(F) || F.st === 'pre' || (F.atk && F.atk.m.can && F.atk.contact && F.atk.t < F.atk.m.f[0] + F.atk.m.f[1] + 8 && !F.atk.m.air);
      if (can) {
        let sp = I.sp ? [SP[I.sp[0]], I.sp[1]] : null;
        const b = I.btn || (F.buf && M.t - F.buf[1] <= 4 ? F.buf[0] : null);
        if (!sp && b) sp = specialFor(F, b, I.btn ? I.presses : F.buf && F.buf[2]);
        if (sp && F.sp && F.sp.m.ty === 'mash' && sp[0] === F.sp.m) sp = null;
        if (sp && startSpecial(F, sp[0], sp[1])) { F.buf = null; return; }
      }
      if (F.st === 'sp' && F.sp && (F.sp.m.ty === 'mash' || F.sp.m.ty === 'windmill') && I.presses && I.presses.some(p => p[1] === F.sp.m.b)) F.sp.end = Math.min(F.sp.end + 6, F.sp.m.ty === 'mash' ? 80 : 90);
      if (F.st === 'air' && !F.atk && !F.jumpAtk && I.btn) { startNormal(F, 'j' + I.btn); F.jumpAtk = 1; F.buf = null; return; }
      if (!actionable(F)) return;
      faceOpp(F);
      const b = I.btn || (F.buf && M.t - F.buf[1] <= 3 ? F.buf[0] : null);
      if (b) {
        F.buf = null;
        if (tryThrow(F, b, d)) return;
        const crouch = inSet(d, [1, 2, 3]);
        startNormal(F, (crouch ? 'c' : '') + b); return;
      }
      if (inSet(d, [7, 8, 9])) { set(F, 'pre'); F.anim = 'pre'; F.fi = 0; F.jdir = d === 9 ? 1 : d === 7 ? -1 : 0; return; }
      if (inSet(d, [1, 2, 3])) { if (F.st !== 'crouch') { set(F, 'crouch'); F.fi = 0; } const thr = d === 1 && ((O.atk || (O.sp && O.st === 'sp')) && Math.abs(O.x - F.x) < 110 || (O.proj && Math.abs(O.proj.x - F.x) < 90)); F.anim = thr ? 'cblock' : 'crouch'; F.fi = thr ? 0 : Math.min(1, F.t >> 1); F.vx = 0; return; }
      if (d === 6) { set(F, F.st === 'walk' ? 'walk' : 'walk', F.st === 'walk' ? F.t : 0); F.vx = F.walkF * F.face; F.anim = 'walk'; F.fi = Math.floor(F.t / 5) % 6; return; }
      if (d === 4) {
        const threat = (O.atk || (O.sp && O.st === 'sp')) && Math.abs(O.x - F.x) < 110 || (O.proj && Math.abs(O.proj.x - F.x) < 90);
        if (threat) { set(F, 'idle'); F.vx = 0; F.anim = 'block'; F.fi = 0; return; }
        set(F, F.st === 'walkb' ? 'walkb' : 'walkb', F.st === 'walkb' ? F.t : 0); F.vx = -F.walkB * F.face; F.anim = 'walk'; F.fi = 5 - Math.floor(F.t / 6) % 6; return;
      }
      set(F, 'idle', F.st === 'idle' ? F.t : 0); F.vx = 0; F.anim = 'idle'; F.fi = Math.floor(F.t / 9) % 4;
    }
    function physics(F) {
      const O = F.opp; F.t++;
      if (F.inv > 0) F.inv--;
      // decay of dizziness points
      if (M.t - F.stunT > 90) F.stun = Math.max(0, F.stun - 1);
      switch (F.st) {
        case 'walk': case 'walkb': case 'idle': case 'crouch': F.x += F.vx; break;
        case 'pre': if (F.t >= 4) { set(F, 'air'); F.vy = -F.jvy; F.vx = F.jdir * F.jvx * F.face; F.anim = F.jdir ? 'flip' : 'jump'; F.fi = 0; F.jumpAtk = 0; snd.jump(); if (F.jdir < 0) F.vx *= 0.9; } break;
        case 'air': {
          F.vy += GRAV; F.x += F.vx; F.y += F.vy;
          if (!F.atk) { if (F.anim === 'flip') F.fi = Math.min(5, Math.floor(F.t / 5)); else { F.anim = 'jump'; F.fi = F.vy < -2 ? 0 : F.vy < 2 ? 1 : 2; } }
          if (F.y >= 0) { F.y = 0; F.vy = 0; F.vx = 0; F.atk = null; set(F, 'land', 4); F.anim = 'pre'; F.fi = 0; snd.land(); dust(F.x, 0.6); }
          break;
        }
        case 'land': F.t -= 2; if (F.t <= 0) { set(F, 'idle'); F.anim = 'idle'; } break;
        case 'atk': break;
        case 'block': F.x += F.vx; F.vx *= 0.82; F.t -= 2; if (F.t <= 0) { set(F, F.crBlock ? 'crouch' : 'idle'); F.anim = F.crBlock ? 'crouch' : 'idle'; F.fi = F.crBlock ? 1 : 0; } break;
        case 'hit': F.x += F.vx; F.vx *= 0.82; F.t -= 2; if (F.t <= 0) afterStun(F); break;
        case 'fall': {
          F.vy += GRAV; F.x += F.vx; F.y += F.vy; F.anim = 'fall'; F.fi = F.vy < -1 ? 0 : F.vy < 2 ? 1 : 2;
          if (F.y >= 0) { F.y = 0; if (F.bounce && F.vy > 2) { F.vy = -2.4; F.bounce = 0; shake(3); dust(F.x, 1); snd.land(); } else { F.vy = 0; F.vx = 0; set(F, F.hp <= 0 ? 'ko' : 'down'); F.anim = F.hp <= 0 ? 'ko' : 'down'; F.fi = 0; dust(F.x, 1.2); snd.land(); shake(2); } }
          break;
        }
        case 'down': if (F.t > 34) { set(F, 'getup'); F.anim = 'getup'; F.fi = 0; F.inv = 22; } break;
        case 'getup': F.fi = F.t < 10 ? 0 : 1; if (F.t > 18) afterStun(F, 1); break;
        case 'dizzy': F.t -= 2; F.anim = 'dizzy'; F.fi = Math.floor(M.t / 12) % 4; if (F.t <= 0) { set(F, 'idle'); F.anim = 'idle'; } break;
        case 'ko': F.anim = 'ko'; break;
        case 'throw': {
          const th = O.thr; F.fi = 0;
          if (F.t < 10) F.anim = 'grab'; else { F.anim = 'toss'; F.fi = F.t < 16 ? 0 : 1; }
          if (F.t >= 28) { set(F, 'idle'); F.anim = 'idle'; }
          break;
        }
        case 'thrown': {
          const th = F.thr, A = th.by, k = A.t;
          if (th.cmd) break; // a command grab moves us itself
          if (k < 10) { F.x = A.x + A.face * 22; F.y = 0; F.anim = 'hit'; F.fi = 0; }
          else if (k < 26) { const p = (k - 10) / 16, dirn = th.back ? -1 : 1; F.x = A.x + A.face * dirn * lerp(10, 46, p) + (th.back ? A.face * 10 * (1 - p) : 0); F.y = -Math.sin(p * PI) * 46 - 10 * (1 - p); F.anim = 'thrown'; F.fi = Math.min(3, Math.floor(p * 4)); }
          else { set(F, 'fall'); F.vx = A.face * (th.back ? -1.4 : 1.4); F.vy = 1; F.y = Math.min(F.y, -8); F.bounce = 1; damage(F, 120, A); F.thr = null; snd.hit(2); shake(5); if (th.back) F.face = -F.face; }
          break;
        }
        case 'sp': if (F.sp) special(F); else { set(F, 'idle'); F.anim = 'idle'; F.mir = 0; } break;
        case 'win': F.anim = 'win'; F.fi = Math.floor(F.t / 20) % 2; break;
        case 'intro': F.anim = 'idle'; F.fi = Math.floor(F.t / 9) % 4; break;
      }
      // normal attacks in progress
      if (F.atk) {
        const a = F.atk, m = a.m; a.t++;
        const tot = m.f[0] + m.f[1] + m.f[2], n = (F.FR[m.a] || [0]).length;
        if (a.t <= m.f[0]) F.fi = m.ai > 1 ? Math.min(m.ai - 1, Math.floor(a.t / m.f[0] * m.ai)) : 0;
        else if (a.t <= m.f[0] + m.f[1]) F.fi = m.ai;
        else { const r = n - 1 - m.ai; F.fi = r > 0 ? Math.min(n - 1, m.ai + 1 + Math.floor((a.t - m.f[0] - m.f[1]) / Math.max(1, m.f[2]) * r)) : 0; }
        F.anim = m.a;
        if (!m.air && a.t >= tot) { F.atk = null; set(F, m.cr ? 'crouch' : 'idle'); F.anim = m.cr ? 'crouch' : 'idle'; F.fi = m.cr ? 1 : 0; }
        if (m.air && a.t >= m.f[0] + m.f[1] + 6) { F.atk = null; }
      }
    }
    function afterStun(F, gotUp) {
      if (F.stun >= 150 && !F.dizzyUsed && F.hp > 0) { set(F, 'dizzy', 170); F.dizzyUsed = 1; F.stun = 0; F.anim = 'dizzy'; snd.dizzy(); return; }
      set(F, 'idle'); F.anim = 'idle'; F.fi = 0; F.combo = 0; if (gotUp) faceOpp(F);
    }
    // --------------------------------------------------------------- specials in progress
    function special(F) {
      const S = F.sp, m = S.m, s = S.s, O = F.opp; S.t++;
      const done = (rec) => { F.sp = null; F.vx = 0; if (F.y < 0) { set(F, 'air'); F.jumpAtk = 1; } else { set(F, 'land', rec || 6); F.anim = 'pre'; } };
      switch (m.ty) {
        case 'proj': {
          F.anim = m.a; F.fi = S.t < m.st ? 0 : 1;
          if (S.t === m.st) { const J = frameOf(F).J, hx = J.fistF ? J.fistF[0] : 30; F.proj = { own: F, kind: m.kind, x: F.x + F.face * (hx + 6), y: m.lob ? -70 : -56, vx: F.face * m.spd[s], vy: m.lob ? -1.8 : 0, dmg: m.dmg, life: m.life ? m.life[s] : 400, t: 0, m }; M.proj.push(F.proj); snd.fire(); }
          if (S.t >= m.st + m.rec) done(2);
          break;
        }
        case 'rise': {
          const up = 3;
          if (S.t < up) { F.anim = m.a; F.fi = 0; if (m.cyc) F.fi = 0; break; }
          if (S.t === up) { F.vy = -m.vy[s]; F.vx = m.vx[s] * F.face; S.air = true; snd.whoosh(2); }
          F.vy += GRAV; F.x += F.vx; F.y += F.vy;
          if (m.cyc) { const n = F.FR[m.a].length; F.fi = Math.floor((S.t - up) / 4) % n; } else F.fi = F.vy < 0 ? 1 : (F.FR[m.a].length > 2 ? 2 : 1);
          if (F.vy < 1 && S.hits < m.hits[s] && S.t - S.lastHit > 7) hitCheck(F, { dmg: m.dmg[s] / (m.hits[s] > 1 ? 1.4 : 1), s: 2, hit: m.hit, r: 13, kd: 1, sp: 1, jug: 1, aa: 1 });
          if (F.y >= 0) { F.y = 0; F.vy = 0; F.vx = 0; F.sp = null; set(F, 'land', 22); F.anim = 'pre'; F.fi = 0; dust(F.x, 0.7); snd.land(); }
          break;
        }
        case 'spin': {
          const dur = m.dur[s];
          F.y = S.t < 8 ? -S.t * 3 : S.t > dur ? Math.min(0, -24 + (S.t - dur) * 4) : -24;
          F.vx = S.t >= 6 && S.t <= dur ? m.vx[s] * F.face : 0; F.x += F.vx; S.air = F.y < 0;
          const ph = Math.floor(S.t / 4) % 4; F.anim = m.a; F.fi = ph & 1; F.mir = ph >= 2 ? 1 : 0;
          if (S.t >= 6 && S.t <= dur && S.t - S.lastHit >= 8) hitCheck(F, { dmg: m.dmg[s], s: 1, box: [-30, -82, 30, -54], kd: S.t > dur - 8 ? 1 : 0, sp: 1 });
          if (S.t > dur + 6) { F.mir = 0; F.sp = null; F.y = 0; set(F, 'land', 20); F.anim = 'pre'; dust(F.x, 0.5); }
          break;
        }
        case 'rush': {
          const st = 6, dur = m.dur[s];
          if (S.t < st) { F.anim = m.a === 'slide' ? 'crouch' : m.a === 'torpedo' ? 'pre' : m.a; F.fi = m.a === 'slide' ? 1 : 0; break; }
          if (S.t === st) snd.whoosh(2);
          if (m.air) F.y = S.t < st + 6 ? -(S.t - st) * 6 : -36; S.air = F.y < 0;
          if (!S.stop) { F.vx = m.vx[s] * F.face; F.x += F.vx; }
          F.anim = m.a; if (m.cyc) F.fi = Math.floor(S.t / 3) % F.FR[m.a].length; else if (m.spin) { const ph = Math.floor(S.t / 4) % 4; F.fi = ph & 1; F.mir = ph >= 2 ? 1 : 0; } else F.fi = 0;
          if (m.aura && M.t % 3 === 0) M.fx.push({ k: 'aura', x: F.x - F.face * 10, y: F.y - 40, t: 0 });
          if (m.a === 'slide' && M.t % 4 === 0) dust(F.x - F.face * 10, 0.4);
          if (!S.stop && (m.multi ? S.t - S.lastHit >= m.multi : S.hits === 0)) {
            const r = hitCheck(F, { dmg: m.dmg[s], s: 2, box: m.lo ? [0, -24, 40, 0] : [-4, m.y - m.r, m.r * 2 + 8, m.y + m.r], kd: m.multi ? 0 : m.kd, lo: m.lo, sp: 1 });
            if (r && !m.multi) { S.stop = 1; F.vx = -F.face * 2; S.t = Math.max(S.t, dur); }
          }
          if (S.stop) { F.x += F.vx; F.vx *= 0.9; }
          if (S.t >= dur + st) { F.mir = 0; F.sp = null; if (F.y < 0) { set(F, 'air'); F.vy = 0; F.vx = -F.face * 1; F.atk = null; F.jumpAtk = 1; F.anim = 'jump'; } else { set(F, 'land', m.multi ? 14 : 16); F.anim = 'pre'; } }
          break;
        }
        case 'mash': {
          F.anim = m.a; const n = F.FR[m.a].length; F.fi = Math.floor(S.t / 3) % n;
          if (S.t > 3 && S.t - S.lastHit >= 6) hitCheck(F, { dmg: m.dmg[s], s: 1, hit: m.hit, r: 15, sp: 1, push: 0.6 });
          if (S.t % 6 === 0) snd.whoosh(0);
          if (S.t >= S.end) { F.sp = null; set(F, 'land', 12); F.anim = 'idle'; }
          break;
        }
        case 'windmill': {
          F.anim = m.a; const ph = Math.floor(S.t / 4) % 4; F.fi = ph & 1; F.mir = ph >= 2 ? 1 : 0;
          const dx = K.held && F === P1 && !P1.ai ? (K.held('left') ? -1 : K.held('right') ? 1 : 0) : (F.ai ? Math.sign(O.x - F.x) : 0);
          F.x += dx * 1.0;
          if (S.t > 4 && S.t - S.lastHit >= 8) hitCheck(F, { dmg: m.dmg[s], s: 1, box: [-40, -78, 40, -46], both: 1, sp: 1, push: 1.4 });
          if (S.t % 8 === 0) snd.whoosh(1);
          if (S.t >= S.end) { F.mir = 0; F.sp = null; set(F, 'land', 14); F.anim = 'idle'; }
          break;
        }
        case 'cgrab': {
          if (S.t === 1) {
            const ok = Math.abs(O.x - F.x) <= m.rng[s] && grounded(O) && O.inv <= 0 && O.st !== 'thrown' && O.st !== 'down' && O.st !== 'ko' && O.st !== 'getup';
            if (!ok) { S.miss = 1; F.anim = 'grab'; F.fi = 0; }
            else { O.atk = null; O.sp = null; set(O, 'thrown'); O.thr = { by: F, cmd: 1 }; snd.grab(); S.got = 1; }
          }
          if (S.miss) { F.anim = 'grab'; if (S.t > 26) { F.sp = null; set(F, 'idle'); F.anim = 'idle'; } break; }
          // the pier driver: grab, leap up spinning, then a big slam
          const T1 = 10, T2 = 40, T3 = 52;
          if (S.t < T1) { F.anim = 'grab'; F.fi = 0; O.x = F.x + F.face * 24; O.anim = 'hit'; O.fi = 0; }
          else if (S.t < T2) { const p = (S.t - T1) / (T2 - T1); F.anim = 'lift'; F.fi = 0; F.y = -Math.sin(p * PI * 0.5) * 70; S.air = true; F.mir = (Math.floor(S.t / 4) & 1); O.x = F.x; O.y = F.y - 64; O.anim = 'thrown'; O.fi = 2; O.mir = F.mir; if (S.t === T1) snd.jump(); }
          else if (S.t < T3) { const p = (S.t - T2) / (T3 - T2); F.mir = 0; F.anim = 'lift'; F.y = -70 * (1 - p); O.x = F.x + F.face * 4; O.y = F.y - 60 * (1 - p) - 4; O.anim = 'thrown'; O.fi = 2; O.mir = 0; }
          else if (S.t === T3) { F.y = 0; F.anim = 'slam'; O.y = 0; O.mir = 0; O.thr = null; damage(O, m.dmg[s] * (F.dmgK || 1), F); set(O, O.hp <= 0 ? 'ko' : 'down'); O.anim = O.hp <= 0 ? 'ko' : 'down'; O.fi = 0; shake(9); dust(O.x, 1.6); dust(F.x, 1); snd.boom(); spark(O.x, -10, 2, 0); combo(F, O); if (F === P1) addScore(250); }
          else { F.anim = 'slam'; if (S.t > T3 + 16) { F.sp = null; set(F, 'idle'); F.anim = 'idle'; } }
          break;
        }
      }
    }
    // --------------------------------------------------------------- hitting
    function hurtRect(F) { if (F.fridge) return [F.x - 18, -66, F.x + 18, 0]; const f = frameOf(F), hb = f.hb; return F.face > 0 ^ F.mir ? [F.x + hb[0], F.y + hb[1], F.x + hb[2], F.y + hb[3]] : [F.x - hb[2], F.y + hb[1], F.x - hb[0], F.y + hb[3]]; }
    function hitCheck(F, h) {
      const O = F.opp; if (O.inv > 0 || O.st === 'down' || O.st === 'ko' || O.st === 'thrown' || O.st === 'getup') return false;
      if (O.st === 'fall' && !h.jug) return false;
      const R = hurtRect(O);
      let hit = false;
      if (h.box) { const b = h.box, f = F.face; const bx0 = F.x + (f > 0 ? b[0] : -b[2]), bx1 = F.x + (f > 0 ? b[2] : -b[0]); const ax0 = h.both ? F.x + b[0] : bx0, ax1 = h.both ? F.x - b[0] : bx1; hit = ax1 > R[0] && ax0 < R[2] && F.y + b[3] > R[1] && F.y + b[1] < R[3]; }
      else { const J = frameOf(F).J[h.hit]; if (!J) return false; const mir = F.mir ? -1 : 1, px = F.x + J[0] * F.face * mir, py = F.y + J[1], r = h.r || 7; const cx = clamp(px, R[0], R[2]), cy = clamp(py, R[1], R[3]); hit = (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r; if (hit) h.at = [px, py]; }
      if (!hit) return false;
      if (F.sp) { F.sp.hits++; F.sp.lastHit = F.sp.t; }
      land(F, O, h);
      return true;
    }
    function canBlockNow(O, h) {
      if (O.fridge) return false;
      if (!(NEUTRAL[O.st] || O.st === 'block' || (O.st === 'land' && O.t <= 0))) return false;
      const d = O.ib.d[(O.ib.n - 1) & 63];
      if (!(d === 4 || d === 1)) return false;
      if (h.lo && d !== 1) return false;
      if (h.ov && d === 1) return false;
      return true;
    }
    function land(F, O, h) {
      const at = h.at || [lerp(F.x, O.x, 0.6), F.y + (h.box ? (h.box[1] + h.box[3]) / 2 : -50)];
      const blocked = canBlockNow(O, h);
      const push = (h.push || [1.6, 2.2, 2.8][h.s]);
      if (blocked) {
        set(O, 'block', [9, 13, 16][h.s]); O.crBlock = O.ib.d[(O.ib.n - 1) & 63] === 1; O.anim = O.crBlock ? 'cblock' : 'block'; O.fi = 0; O.vx = (O.x > F.x ? 1 : -1) * push;
        if (h.sp) damage(O, Math.round(h.dmg / 4), F);
        spark(at[0], at[1], h.s, 1); snd.block(); M.stop = 5; if (F.atk) F.atk.contact = 1; if (F.atk) F.atk.hit = 1;
        if (F.y >= 0 && atWall(O)) F.x -= (O.x > F.x ? 1 : -1) * push * 3;
        return;
      }
      if (O.fridge) { // Dad's old fridge takes a beating
        O.hp = Math.max(0, O.hp - h.dmg); O.hitT = M.t; O.flash = 3; if (F.atk) { F.atk.contact = 1; F.atk.hit = 1; }
        spark(at[0], at[1], h.s, 0); snd.crash(h.s); M.stop = [5, 7, 9][h.s]; shake(h.s + 1); addScore(20 + h.s * 10);
        for (let i = 0; i < 3 + h.s * 2; i++) M.fx.push({ k: 'chunk', x: at[0], y: at[1], vx: (F.face) * (1 + Math.random() * 3), vy: -2 - Math.random() * 3, c: ['#f4f4f0', '#c8c8c0', '#8a8a90', '#5ab0f0'][i & 3], t: 0 });
        return;
      }
      const dmg = Math.round(h.dmg * (F.dmgK || 1) * (F.pow || 1) * (O.def || 1) * (O.combo > 2 ? 0.85 : 1));
      const wasStun = O.st === 'hit' || O.st === 'fall' || O.st === 'dizzy';
      O.atk = null; if (O.sp) { O.sp = null; O.mir = 0; }
      damage(O, dmg, F);
      O.stun += h.dmg * (h.s === 2 ? 1.2 : 0.9); O.stunT = M.t;
      O.flash = 4;
      const air = O.y < -1 || O.st === 'air' || O.st === 'fall';
      if (h.kd || air || O.hp <= 0) { set(O, 'fall'); O.vy = O.hp <= 0 ? -5 : air ? -3.5 : -4; O.vx = (O.x > F.x ? 1 : -1) * (O.hp <= 0 ? 2.4 : 1.8); O.bounce = O.hp <= 0 ? 1 : 0; O.anim = 'fall'; if (O.dizzy) O.dizzyUsed = 1; }
      else { const crouching = O.st === 'crouch' || (O.anim === 'crouch'); set(O, 'hit', [12, 16, 20][h.s]); O.anim = crouching ? 'chit' : (h.lo || F.atk && F.atk.m.cr ? 'hitb' : 'hit'); O.fi = 0; O.vx = (O.x > F.x ? 1 : -1) * push; if (atWall(O) && F.y >= 0) F.x -= (O.x > F.x ? 1 : -1) * push * 3; }
      if (F.atk) { F.atk.contact = 1; F.atk.hit = 1; }
      O.combo = wasStun ? O.combo + 1 : 1; combo(F, O);
      F.hitsLanded++;
      spark(at[0], at[1], h.s, 0); snd.hit(h.s); M.stop = [6, 8, 11][h.s]; if (h.s === 2) shake(3);
      if (F === P1) { const pts = [10, 20, 35][h.s] + (h.sp ? 15 : 0) + Math.min(50, (O.combo - 1) * 10); addScore(pts); M.scHits = (M.scHits || 0) + pts; M.nHits = (M.nHits || 0) + 1; }
    }
    function combo(F, O) { if (O.combo >= 2) { M.texts.push({ s: O.combo + ' HITS!', side: F.side, t: 0 }); M.bestCombo = Math.max(M.bestCombo, F === P1 ? O.combo : 0); } }
    function damage(O, dmg, F) {
      if (M.mode === 'training') { O.hp = Math.max(1, O.hp - dmg); if (O === P2) M.lastDmg = (M.lastDmg || 0) + dmg; return; }
      O.hp = Math.max(0, O.hp - dmg); O.dmgTaken += dmg;
      if (O.hp <= 0 && !M.kod) { M.kod = O; M.slow = 70; M.flashT = 6; snd.ko(); }
    }
    const atWall = O => O.x <= M.cam + 18 || O.x >= M.cam + W - 18 || O.x <= 22 || O.x >= WORLD - 22;
    function spark(x, y, s, blk) { M.fx.push({ k: blk ? 'bspark' : 'spark', s, x, y, t: 0 }); }
    function dust(x, k) { M.fx.push({ k: 'dust', x, y: 0, t: 0, sc: k }); }
    function shake(n) { M.shake = Math.max(M.shake, n); }
    // --------------------------------------------------------------- projectiles
    function projUpdate() {
      for (let i = M.proj.length - 1; i >= 0; i--) {
        const p = M.proj[i]; p.t++; p.x += p.vx; if (p.m.lob) { p.vy += 0.045; p.y = Math.min(-14, p.y + p.vy); } p.life--;
        let gone = p.life <= 0 || p.x < M.cam - 40 || p.x > M.cam + W + 40;
        for (const q of M.proj) if (q !== p && q.own !== p.own && Math.abs(q.x - p.x) < 16 && Math.abs(q.y - p.y) < 18) { gone = true; q.life = 0; spark((p.x + q.x) / 2, p.y, 1, 1); snd.block(); }
        const O = p.own.opp;
        if (!gone && O.inv <= 0 && !['down', 'ko', 'thrown', 'getup'].includes(O.st)) {
          const R = hurtRect(O); if (p.x + 9 > R[0] && p.x - 9 < R[2] && p.y + 8 > R[1] && p.y - 8 < R[3]) { const F = p.own, at = F.atk; F.atk = null; land(F, O, { dmg: p.dmg, s: 2, sp: 1, at: [p.x, p.y], push: 2.2 }); F.atk = at; gone = true; }
        }
        if (gone) { M.proj.splice(i, 1); if (p.own.proj === p) p.own.proj = null; }
      }
    }
    // --------------------------------------------------------------- the CPU brain
    function mkAI(l) { return { lvl: l, cd: 0, plan: null, react: 0, seen: 0, queue: [], hold: 5, holdT: 0 }; }
    function aiThink(F) {
      const A = F.ai, O = F.opp, L = A.lvl, dx = (O.x - F.x) * F.face, ad = Math.abs(O.x - F.x), r = Math.random;
      const I = { d: 5, btn: null, presses: null, sp: null };
      const has = ty => F.C.moves.find(id => SP[id].ty === ty || id === ty);
      if (A.spCD > 0) A.spCD--;
      const pick = (id, force) => { if (A.spCD > 0 && !force) return; I.sp = [id, r() < L ? 2 : r() < 0.5 ? 1 : 0]; A.spCD = Math.round(lerp(120, 45, L) + r() * 40); };
      // keep blocking while the threat lasts
      const oAtk = O.atk || (O.sp && O.st === 'sp'), lowAtk = O.atk ? O.atk.m.lo : O.sp && O.sp.m.lo;
      const proj = M.proj.find(p => p.own === O && Math.abs(p.x - F.x) < 120 && Math.sign(p.vx) === Math.sign(F.x - p.x));
      const jumpIn = (O.st === 'air' || (O.sp && O.sp.air)) && ad < 120 && Math.sign(O.vx || 0) === Math.sign(F.x - O.x) && O.vy > -3;
      const threat = (oAtk && ad < 100) || proj || jumpIn;
      if (threat && !A.seen) { A.seen = 1; A.react = Math.round(lerp(26, 6, L) + r() * 8); A.resp = null; }
      if (!threat) A.seen = 0;
      if (A.seen) {
        if (A.react > 0) A.react--;
        else {
          if (!A.resp) {
            if (jumpIn) { const aa = F.C.moves.find(id => SP[id].ty === 'rise'); A.resp = r() < lerp(0.12, 0.8, L) ? (aa && r() < 0.7 ? ['sp', aa] : ['btn', 'chp']) : r() < lerp(0.3, 0.7, L) ? ['block'] : ['none']; }
            else if (proj) { const pj = F.C.moves.find(id => SP[id].ty === 'proj'); A.resp = pj && !F.proj && r() < 0.4 ? ['sp', pj] : r() < lerp(0.2, 0.55, L) && ad > 70 ? ['jumpf'] : r() < lerp(0.4, 0.9, L) ? ['block'] : ['none']; }
            else A.resp = r() < lerp(0.25, 0.88, L) ? ['block'] : ['none'];
          }
          const R2 = A.resp;
          if (R2[0] === 'block') { I.d = lowAtk || (O.st === 'sp' && O.sp && O.sp.m.lo) ? 1 : (O.st === 'air' ? 4 : (r() < 0.5 ? 4 : 1)); if (O.atk && O.atk.m.ov) I.d = 4; return I; }
          if (R2[0] === 'sp' && actionable(F)) { pick(R2[1], 1); A.resp = ['done']; return I; }
          if (R2[0] === 'btn' && actionable(F)) { I.d = 2; I.btn = 'hp'; I.presses = ['hp']; A.resp = ['done']; return I; }
          if (R2[0] === 'jumpf' && actionable(F)) { I.d = 9; A.resp = ['done']; return I; }
        }
      }
      // in the air: kick on the way down
      if (F.st === 'air' && !F.jumpAtk && F.vy > 0 && ad < 70 && r() < 0.5) { const b = r() < 0.5 ? 'hk' : 'mk'; I.btn = b; I.presses = [b]; return I; }
      if (!actionable(F)) return I;
      // follow a queued combo
      if (A.queue.length) { const q = A.queue[0]; if (--q[2] <= 0) { A.queue.shift(); if (q[0] === 'btn') { I.d = q[1][0] === 'c' ? 2 : 5; const b = q[1].replace(/^c/, ''); I.btn = b; I.presses = [b]; } else pick(q[1]); } return I; }
      if (A.holdT > 0) { A.holdT--; I.d = A.hold; return I; }
      // a fresh decision
      const prj = has('proj'), rush = F.C.moves.find(id => SP[id].ty === 'rush' || SP[id].ty === 'spin'), mash = F.C.moves.find(id => SP[id].ty === 'mash' || SP[id].ty === 'windmill'), cg = has('cgrab');
      const agg = lerp(0.45, 0.85, L), x = r();
      if (O.st === 'dizzy' || (O.st === 'land' && O.t > 6)) { // a free hit!
        if (ad > 60) { A.hold = 6; A.holdT = 8; I.d = 6; return I; }
        A.queue = L > 0.5 && rush ? [['btn', 'hp', 1], ['sp', rush, 10]] : [['btn', 'hk', 1]]; return I;
      }
      if (ad > 150) {
        if (prj && !F.proj && x < lerp(0.15, 0.45, L)) { pick(prj); return I; }
        if (x < 0.12 * agg) { I.d = 9; return I; }
        A.hold = 6; A.holdT = 10 + (r() * 20 | 0); I.d = 6; return I;
      }
      if (ad > 72) {
        if (prj && !F.proj && x < lerp(0.08, 0.3, L)) { pick(prj); return I; }
        if (rush && x < lerp(0.04, 0.18, L)) { pick(rush); return I; }
        if (x < 0.18 * agg) { I.d = 9; return I; }
        if (x < 0.35) { const b = ['mk', 'hk', 'cmk'][r() * 3 | 0]; I.d = b[0] === 'c' ? 2 : 5; I.btn = b.replace(/^c/, ''); I.presses = [I.btn]; return I; }
        if (x < 0.42 + (1 - agg) * 0.2) { A.hold = r() < 0.6 ? 4 : 1; A.holdT = 10 + (r() * 16 | 0); I.d = A.hold; return I; }
        A.hold = 6; A.holdT = 8 + (r() * 14 | 0); I.d = 6; return I;
      }
      // close
      if (cg && ad < 46 && x < lerp(0.2, 0.55, L)) { pick(cg, 1); return I; }
      if (x < lerp(0.04, 0.16, L) && ad < 36) { I.d = r() < 0.5 ? 6 : 4; I.btn = r() < 0.5 ? 'hp' : 'hk'; I.presses = [I.btn]; return I; }
      if (mash && x < lerp(0.08, 0.3, L)) { pick(mash); return I; }
      if (x < agg * 0.75) {
        const combos = L > 0.55 && rush ? [[['btn', 'clk', 1], ['btn', 'clk', 9], ['sp', rush, 6]], [['btn', 'cmk', 1], ['sp', prj || rush, 7]]] : [[['btn', 'clk', 1], ['btn', 'clk', 10]], [['btn', 'lp', 1], ['btn', 'mp', 12]], [['btn', 'chk', 1]], [['btn', 'mk', 1]], [['btn', 'hp', 1]]];
        A.queue = combos[r() * combos.length | 0].map(q => q.slice()); return I;
      }
      A.hold = r() < 0.5 ? 1 : 4; A.holdT = 10 + (r() * 20 | 0); I.d = A.hold; return I;
    }
    // --------------------------------------------------------------- the round flow
    function placeFighters() {
      P1.x = 256 - 70; P2.x = 256 + 70; for (const F of M.p) { if (F.fridge) { F.hp = F.dhp = MAXHP; continue; } F.y = 0; F.vx = F.vy = 0; F.hp = F.dhp = MAXHP; F.atk = F.sp = null; F.proj = null; F.stun = 0; F.dizzyUsed = 0; F.combo = 0; F.inv = 0; F.mir = 0; F.dmgTaken = 0; set(F, 'intro'); F.anim = 'idle'; }
      P1.face = 1; P2.face = -1; if (P2.fridge) { P1.x = 196; P2.x = 330; P2.st = 'idle'; M.timer = 30; } M.proj.length = 0; M.cam = 128; M.timer = 99; M.tsub = 0; M.kod = null; M.roundScore = 0;
    }
    placeFighters();
    M.state = 'intro'; M.st = 0;
    function roundOver(winner) { // winner: fighter or null (draw)
      M.state = 'ko'; M.st = 0; M.winner = winner;
      if (winner) winner.wins++; else { P1.wins++; P2.wins++; M.drawRounds++; }
      M.perfect = !!winner && winner.dmgTaken === 0;
      if (M.mode === 'arcade' && winner === P1) {
        const tb = M.timer * 8, vb = Math.floor(P1.hp / MAXHP * 800), pb = M.perfect ? 1000 : 0;
        M.bonus = { time: tb, vit: vb, perf: pb }; addScore(tb + vb + pb);
        if (M.perfect) K.secret('lk.scrap.perfect');
      } else M.bonus = null;
    }
    // --------------------------------------------------------------- update
    M.update = function () {
      M.t++;
      if (M.flashT > 0) M.flashT--;
      for (const F of M.p) if (F.flash > 0) F.flash--;
      if (M.shake > 0) M.shake = Math.max(0, M.shake - 0.4);
      for (const t of M.texts) t.t++; while (M.texts.length && M.texts[0].t > 60) M.texts.shift();
      for (let i = M.fx.length - 1; i >= 0; i--) { const f = M.fx[i]; f.t++; if (f.k === 'chunk') { f.vy += 0.3; f.x += f.vx; f.y = Math.min(0, f.y + f.vy); if (f.y >= 0) f.vx *= 0.8; } if (f.t > (f.k === 'chunk' ? 70 : 24)) M.fx.splice(i, 1); }
      M.st++;
      const playing = M.state === 'fight';
      // read the pads every frame, even while the action is frozen
      const intents = [null, null];
      for (const F of M.p) { if (F.fridge) continue; let I = { d: 5 };
        if (playing) { if (F.ai && !(M.mode === 'training' && F === P2)) I = aiThink(F); else if (F === P1) I = humanIntent(F); else if (M.mode === 'training') I = dummyIntent(F); }
        feed(F, I); intents[F.side] = I; }
      // slow motion after a K.O. (one step in three), hit-stop
      if (M.slow > 0) { M.slow--; if (M.slow % 3) return; }
      if (M.stop > 0) { M.stop--; return; }
      if (M.state === 'intro') { if (M.st > 50) { M.state = 'round'; M.st = 0; snd.bell(1); } }
      else if (M.state === 'round') { if (M.st > 70) { M.state = 'fight'; M.st = 0; snd.fight(); for (const F of M.p) { set(F, 'idle'); F.anim = 'idle'; } } }
      // the fighters
      for (const F of M.p) {
        if (F.fridge) continue;
        if (playing) control(F, intents[F.side] || { d: 5 });
        physics(F);
        if (M.state === 'ko' && NEUTRAL[F.st]) { F.anim = 'idle'; F.fi = Math.floor(M.t / 9) % 4; }
      }
      projUpdate();
      // the normals' hits
      for (const F of M.p) if (F.atk && !F.atk.hit) { const a = F.atk, m = a.m; if (a.t > m.f[0] && a.t <= m.f[0] + m.f[1]) hitCheck(F, m); }
      // keep them apart, on the screen and facing each other
      const minD = (P1.C.b.chR + P2.C.b.chR) * 1.25 + 6;
      if (Math.abs(P1.y - P2.y) < 60 && Math.abs(P1.x - P2.x) < minD && P1.st !== 'thrown' && P2.st !== 'thrown') {
        const mid = (P1.x + P2.x) / 2, s = P1.x < P2.x ? -1 : P1.x > P2.x ? 1 : (P1.face > 0 ? -1 : 1);
        P1.x = mid + s * minD / 2; P2.x = mid - s * minD / 2;
      }
      for (const F of M.p) F.x = clamp(F.x, 22, WORLD - 22);
      const want = clamp((P1.x + P2.x) / 2 - W / 2, 0, WORLD - W); M.cam += (want - M.cam) * 0.2;
      for (const F of M.p) F.x = clamp(F.x, M.cam + 18, M.cam + W - 18);
      for (const F of M.p) { if (F.hp < F.dhp) F.dhp = Math.max(F.hp, F.dhp - 6); }
      // the clock and K.O.s
      if (M.state === 'fight') {
        if (M.mode !== 'training' && M.mode !== 'demo2') { if (++M.tsub >= 54) { M.tsub = 0; M.timer = Math.max(0, M.timer - 1); if (M.timer <= 10 && M.timer > 0) snd.tick(); } }
        if (P2.fridge) { if (P2.hp <= 0) { M.state = 'ko'; M.st = 0; M.winner = P1; M.bonus = { fridge: 1000, time: M.timer * 20 }; addScore(1000 + M.timer * 20); snd.boom(); shake(8); for (let i = 0; i < 18; i++) M.fx.push({ k: 'chunk', x: P2.x + (Math.random() - 0.5) * 30, y: -40 - Math.random() * 30, vx: (Math.random() - 0.5) * 6, vy: -2 - Math.random() * 4, c: ['#f4f4f0', '#c8c8c0', '#8a8a90', '#5ab0f0'][i & 3], t: 0 }); } else if (M.timer <= 0) { M.state = 'ko'; M.st = 0; M.winner = null; M.bonus = null; } }
        else if (M.kod) { const w = M.kod === P1 ? P2 : P1; roundOver(w); }
        else if (M.timer <= 0) { M.timeover = 1; roundOver(P1.hp > P2.hp ? P1 : P2.hp > P1.hp ? P2 : null); }
        if (M.mode === 'training') { for (const F of M.p) if (F.st === 'idle' && F.hp < MAXHP && M.t - F.lastAtkT > 60 && F.opp.t > 50) F.hp = F.dhp = MAXHP; }
      } else if (M.state === 'ko') {
        const settled = M.p.every(F => !['fall', 'air', 'thrown', 'hit', 'sp', 'atk', 'throw', 'pre', 'land', 'block'].includes(F.st) || F.t > 200) && M.slow <= 0;
        if (settled && !M.winPosed) { M.winPosed = M.st; if (M.winner) { set(M.winner, 'win'); M.winner.anim = 'win'; if (M.mode !== 'demo') { if (M.winner === P1) snd.win(); else snd.lose(); } } }
        if (M.winPosed && M.st - M.winPosed > 150) {
          M.winPosed = 0; M.timeover = 0;
          if (P2.fridge) { M.over = true; o.onEnd && o.onEnd({ win: P2.hp <= 0, score: M.score }); return; }
          const need = 2, done = P1.wins >= need || P2.wins >= need || M.round >= M.maxRounds;
          if (done) { M.over = true; const youWin = P1.wins > P2.wins; o.onEnd && o.onEnd({ win: youWin, score: M.score }); }
          else { M.round++; placeFighters(); M.state = 'intro'; M.st = 30; }
        }
      }
    };
    // --------------------------------------------------------------- drawing
    let FXR = null;
    M.draw = function (g, stage, FX) {
      FXR = FX;
      const sx = M.shake > 0 ? Math.round((Math.random() - 0.5) * M.shake * 2) : 0, sy = M.shake > 0 ? Math.round((Math.random() - 0.5) * M.shake) : 0;
      const cam = Math.round(M.cam) - sx;
      stage.draw(g, cam, M.t / 60, M.state === 'ko' ? 2 : 1);
      g.save(); g.translate(0, sy);
      // shadows
      for (const F of M.p) { const k = clamp(1 + F.y / 160, 0.4, 1), w = Math.round(F.C.b.chR * 3.4 * k); g.drawImage(FX.shadow, 0, 0, FX.shadow.width, FX.shadow.height, Math.round(F.x - cam - w / 2), GROUND - 3, w, 6); }
      // the one who attacked last in front
      const order = P1.lastAtkT >= P2.lastAtkT ? [P2, P1] : [P1, P2];
      for (const F of order) drawFighter(g, F, cam);
      for (const p of M.proj) { const fr = FX.proj[p.kind][(p.t >> 2) & 3]; const x = Math.round(p.x - cam), y = GROUND + Math.round(p.y);
        if (p.kind === 'lasso') { g.strokeStyle = '#a87030'; g.lineWidth = 1; g.beginPath(); const J = frameOf(p.own).J; g.moveTo(Math.round(p.own.x - cam + (J.fistF ? J.fistF[0] : 20) * p.own.face), GROUND + Math.round(p.own.y + (J.fistF ? J.fistF[1] : -50))); g.lineTo(x, y); g.stroke(); }
        if (p.vx < 0) { g.save(); g.translate(x, 0); g.scale(-1, 1); g.drawImage(fr, -26, y - 15); g.restore(); } else g.drawImage(fr, x - 26, y - 15); }
      for (const f of M.fx) {
        if (f.k === 'spark' || f.k === 'bspark') { const set2 = f.k === 'spark' ? FX.spark[f.s] : FX.bspark; const fr = set2[Math.min(3, f.t >> 1)]; if (f.t < 8) g.drawImage(fr, Math.round(f.x - cam - fr.width / 2), Math.round(GROUND + f.y - fr.height / 2)); }
        else if (f.k === 'dust') { const fr = FX.dust[Math.min(4, f.t / 4 | 0)]; if (f.t < 20) { const w = 40 * f.sc, h = 20 * f.sc; g.drawImage(fr, Math.round(f.x - cam - w / 2), Math.round(GROUND - h + 2), Math.round(w), Math.round(h)); } }
        else if (f.k === 'chunk') { g.fillStyle = '#202028'; g.fillRect(Math.round(f.x - cam) - 1, Math.round(GROUND + f.y) - 1, 4, 4); g.fillStyle = f.c; g.fillRect(Math.round(f.x - cam), Math.round(GROUND + f.y), 2, 2); }
        else if (f.k === 'aura') { g.fillStyle = `rgba(190,90,255,${0.5 - f.t / 50})`; const s = 10 + f.t; g.fillRect(Math.round(f.x - cam - s / 2), Math.round(GROUND + f.y - s / 2), s, s); }
      }
      // dizzy stars
      for (const F of M.p) if (!F.fridge) if (F.st === 'dizzy' || (F.st === 'ko' && M.state === 'ko')) { const fr = frameOf(F), hd = fr.J.Hd; const cx = F.x - cam + hd[0] * F.face, cy = GROUND + F.y + hd[1] - (F.st === 'ko' ? 6 : 14); for (let i = 0; i < 3; i++) { const a = M.t / 9 + i * TAU / 3; g.drawImage(FX.star, Math.round(cx + Math.cos(a) * 12 - 4), Math.round(cy + Math.sin(a) * 4 - 4)); } }
      g.restore();
      if (M.flashT > 0) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, 0, W, H); }
    };
    function drawFighter(g, F, cam) {
      if (F.fridge) { const lv = F.hp > 750 ? 0 : F.hp > 500 ? 1 : F.hp > 250 ? 2 : F.hp > 0 ? 3 : 4, cv = FXR.fridge[lv], j = M.t - F.hitT < 8 ? ((M.t & 2) ? 1 : -1) : 0; g.drawImage(cv, Math.round(F.x - cam - cv.width / 2 + j), GROUND - cv.height + 2); return; }
      const fr = frameOf(F); if (!fr || !fr.cv) return;
      const flip = (F.face < 0) !== !!F.mir, x = Math.round(F.x - cam), y = Math.round(GROUND + F.y);
      const put = cv => { if (!flip) g.drawImage(cv, x + fr.x, y + fr.y); else { g.save(); g.translate(x, 0); g.scale(-1, 1); g.drawImage(cv, fr.x, y + fr.y); g.restore(); } };
      put(fr.cv);
      if (F.flash > 2) { g.globalAlpha = 0.55; put(flashOf(fr)); g.globalAlpha = 1; }
    }
    M.P1 = P1; M.P2 = P2; M.frameOf = frameOf; M.hurtRect = hurtRect; M.startSpecial = startSpecial; M.set = set;
    return M;
  }

  // ================================================================ the world map (made-up blobby continents) and the fridge
  const LANDS = [
    [8, 22, 30, 12, 62, 10, 92, 16, 98, 28, 86, 36, 80, 50, 70, 60, 60, 64, 50, 58, 38, 50, 26, 44, 14, 34],
    [64, 64, 80, 62, 98, 70, 104, 80, 96, 94, 88, 108, 80, 110, 78, 96, 70, 82],
    [112, 26, 118, 18, 132, 14, 150, 16, 154, 26, 146, 36, 136, 42, 126, 44, 116, 40],
    [118, 50, 136, 46, 156, 50, 166, 62, 162, 78, 150, 96, 138, 100, 132, 84, 122, 70, 116, 60],
    [150, 14, 180, 6, 220, 8, 244, 16, 240, 30, 226, 40, 218, 54, 206, 66, 190, 70, 176, 60, 166, 48, 156, 36],
    [204, 84, 224, 80, 240, 86, 238, 98, 222, 102, 206, 96],
    [114, 30, 120, 28, 121, 36, 116, 38], [212, 42, 216, 40, 219, 50, 214, 56, 211, 52],
  ];
  function mkMap() {
    const pb = new PB(256, 112), c = hex32;
    for (let y = 0; y < 112; y++) for (let x = 0; x < 256; x++) pb.d[y * 256 + x] = BAYER[(y & 3) * 4 + (x & 3)] < 4 + y / 16 ? c('#1a3a8a') : c('#22489a');
    for (let x = 0; x < 256; x += 16) for (let y = 0; y < 112; y += 2) pb.px(x, y, c('#3a62b8'));
    for (let y = 8; y < 112; y += 16) for (let x = 0; x < 256; x += 2) pb.px(x, y, c('#3a62b8'));
    const land = new PB(256, 112); for (const L of LANDS) land.poly(L, c('#5aa040'));
    for (let y = 0; y < 112; y++) for (let x = 0; x < 256; x++) { const v = land.d[y * 256 + x]; if (!v) continue; const top = !land.get(x, y - 1), bot = !land.get(x, y + 1) || !land.get(x + 1, y); pb.d[y * 256 + x] = top ? c('#9ad870') : bot ? c('#2a6a30') : ((x * 7 + y * 3) % 17 === 0 ? c('#4a8a38') : v); }
    for (let y = 0; y < 112; y++) for (let x = 0; x < 256; x++) if (!land.d[y * 256 + x] && (land.get(x - 1, y) || land.get(x, y - 1))) pb.d[y * 256 + x] = c('#0c1c50');
    return pb;
  }
  function mkFridge(lv) {
    const pb = new PB(44, 76), c = hex32, ox = 4, w = 36, h = lv === 4 ? 30 : 70, y0 = 76 - h - 2;
    const body = c('#e8ecee'), sh = c('#b8c0c8'), dk = c('#7a8490'), ol = c('#20242c');
    if (lv === 4) { pb.poly([2, 74, 10, 50, 30, 46, 42, 58, 40, 74], body); pb.poly([24, 48, 30, 46, 42, 58, 40, 74, 34, 74], sh); pb.line(10, 60, 30, 58, dk); pb.line(14, 52, 18, 72, dk); pb.ellipse(20, 62, 4, 3, c('#5ab0f0')); pb.outline(ol); return pb; }
    pb.rect(ox, y0, w, h, body); pb.rect(ox + w - 7, y0, 7, h, sh); pb.rect(ox, y0, 2, h, c('#ffffff')); pb.rect(ox, y0 + 22, w, 2, dk);
    pb.rect(ox + 4, y0 + 8, 2, 10, dk); pb.rect(ox + 4, y0 + 30, 2, 14, dk);
    pb.rect(ox + 12, y0 + 34, 6, 6, c('#e83a3a')); pb.rect(ox + 20, y0 + 40, 5, 5, c('#3a8ae8')); pb.rect(ox + 14, y0 + 46, 8, 3, c('#f8d020')); // fridge magnets
    pb.rect(ox + 4, y0 + h - 4, w - 8, 4, dk);
    if (lv >= 1) { pb.ellipse(ox + 22, y0 + 14, 5, 4, sh); pb.ellipse(ox + 14, y0 + 54, 6, 5, sh); pb.line(ox + 18, y0 + 10, ox + 26, y0 + 18, dk); }
    if (lv >= 2) { pb.poly([ox + w, y0 + 24, ox + w + 4, y0 + 30, ox + w + 4, y0 + 66, ox + w, y0 + h], sh); pb.ellipse(ox + 10, y0 + 30, 4, 6, sh); pb.line(ox + 6, y0 + 58, ox + 24, y0 + 62, dk); }
    if (lv >= 3) { pb.rect(ox + 3, y0 + 25, w - 10, h - 30, c('#5a6a78')); for (let i = 0; i < 3; i++) pb.rect(ox + 3, y0 + 36 + i * 11, w - 10, 2, c('#c8d0d8')); pb.rect(ox + 8, y0 + 30, 5, 6, c('#f4f4f0')); pb.rect(ox + 8, y0 + 30, 5, 2, c('#3a8ae8')); pb.ellipse(ox + 20, y0 + 44, 4, 3, c('#e85a8a')); pb.rect(ox + 14, y0 + 52, 8, 4, c('#f8d020')); }
    pb.outline(ol); return pb;
  }
  // endings: three pages each, then the staff roll
  const ENDINGS = {
    kenji: ['KENJI HAS BEATEN THE BARON. THE TOURNAMENT IS OVER.', 'HE GOES HOME TO THE TOKYO ARCADE AND FINALLY GETS THE TOP SCORE ON HIS FAVOURITE MACHINE.', 'HE TYPES IN HIS NAME: K-E-N... AND RUNS OUT OF LETTERS. HE IS STILL VERY HAPPY.'],
    barry: ['BIG BARRY HAS BEATEN THE BARON. THE PIER GOES WILD.', 'HE CARRIES THE BLIMP HOME ON HIS BACK AND TIES IT TO THE END OF THE PIER.', 'NOW IT IS THE BIGGEST CHIP SHOP IN ENGLAND. EXTRA VINEGAR FOR EVERYONE!'],
    luana: ['LUANA HAS BEATEN THE BARON! SHE DANCES ALL THE WAY HOME.', 'THE WHOLE CARNIVAL FOLLOWS HER, DRUMS AND ALL. THE BARON JOINS IN AT THE BACK.', 'HE IS NOT VERY GOOD AT DANCING. BUT HE IS TRYING.'],
    olga: ['OLGA HAS BEATEN THE BARON. THE JUDGES GIVE HER A PERFECT TEN.', 'SHE FREEZES THE BLIMP INTO A GIANT ICE RINK IN THE SKY.', 'THERE SHE SKATES THE FIRST QUADRUPLE AXEL EVER DONE IN THE CLOUDS.'],
    kip: ['KIP HAS BEATEN THE BARON! NOBODY SAW HIM DO IT. HE WAS TOO FAST.', 'HE RUNS THE BARON ALL THE WAY TO THE POLICE STATION. ON FOOT. IN TWELVE MINUTES.', 'THE BARON NEEDS A SIT DOWN AND A GLASS OF SQUASH.'],
    gaston: ['GASTON HAS BEATEN THE BARON. OOH LA LA!', 'HE OPENS A CAFE INSIDE THE BLIMP. THE MENU HAS ONE THING ON IT: ONE HUNDRED PANCAKES.', 'THE BARON DOES THE WASHING UP. FOREVER.'],
    hank: ['HANK HAS BEATEN THE BARON. YEE-HAW!', 'HE LASSOS THE BLIMP AND TIES IT TO HIS FENCE. THE COWS ARE VERY IMPRESSED.', 'THEN HE PHONES HIS MOM TO TELL HER THE GOOD NEWS. SHE ALREADY KNEW.'],
    mei: ['MEI HAS BEATEN THE BARON! SHE DID NOT EVEN GET TIRED.', 'SHE KICKS THE BLIMP SO HARD IT LANDS IN THE MIDDLE OF THE NIGHT MARKET.', 'NOW IT IS A VERY BIG LANTERN. EVERYONE AGREES IT LOOKS NICER LIKE THAT.'],
  };
  const STAFF = ['STREET SCRAPPER II', '', 'THE WORLD SCRAPPER', '', '', 'PRODUCER', 'BIG MIKE', '', 'FIGHTER ART', 'THE PIXEL TWINS', '', 'STAGE ART', 'A VERY PATIENT DOG', '', 'MUSIC', 'DJ CHIPTUNE', '', 'SOUND', 'SOMEONE HITTING A FRIDGE', '', 'GAME TESTING', 'JACK  DAVE  LUKE', 'CALLUM  JACKK', '', 'SPECIAL THANKS', "DAVE (FOR LOSING 20 TIMES)", "MOM (FOR THE SANDWICHES)", "DAD (FOR THE FRIDGE)", '', '', 'KAPOW SOFT 1999', '', 'THANK YOU FOR PLAYING!'];
  const HI0 = [['JACK', 41500, 'kenji'], ['DAVE', 30200, 'barry'], ['LUKE', 26800, 'hank'], ['CAL', 19400, 'kip'], ['JK', 15700, 'mei'], ['DAVE', 12100, 'barry'], ['LUKE', 9800, 'olga'], ['MOM', 2600, 'gaston']];
  const TIPS = ['HOLD AWAY FROM YOUR ENEMY TO BLOCK', 'WIN A ROUND WITHOUT A SCRATCH FOR A PERFECT!', 'CLOSE UP: ← OR → AND A HEAVY BUTTON TO THROW', 'SPECIAL MOVES ARE IN THE PAUSE MENU', 'DAVE SAYS BIG BARRY IS NOT CHEAP', 'BEAT ALL EIGHT TO FACE THE BARON', 'CROUCH TO BLOCK LOW KICKS', 'LUKE ALWAYS PICKS HANK. ALWAYS.'];

  // shared caches between goes (sprites take a moment to bake)
  const FRC = new Map(), STC = new Map(); let FXC = null, PORT = null, MAPC = null;
  function cacheGet(map, key, max, mk) { if (map.has(key)) { const v = map.get(key); map.delete(key); map.set(key, v); return v; } const v = mk(); map.set(key, v); while (map.size > max) map.delete(map.keys().next().value); return v; }
  function buildStage(key) {
    const S = STAGES[key], R = prng(key.length * 977 + key.charCodeAt(0) * 31), L = S.paint(R);
    const cr = L.crowd && L.crowd.n ? crowdSprites(L.crowd.seed, L.crowd.n, L.crowd.sc || 0.5, L.crowd) : [];
    cr.forEach(m => m.fr.forEach(f => { f.cv = f.pb.canvas(); f.pb = null; }));
    const far = L.far.canvas(), mid = L.mid.canvas(), floor = L.floor.canvas(), hz = S.hz;
    const flakes = []; if (L.snow) { const r = prng(4); for (let i = 0; i < 70; i++) flakes.push([r() * 400, r() * 224, 0.3 + r() * 0.7]); }
    return { key, name: S.name, music: S.music, hz,
      draw(g, cam, t, ex) {
        if (L.clouds) { const o = (t * 6) % farW; g.drawImage(far, -Math.round(cam * FAR_K), 0); g.fillStyle = 'rgba(200,170,230,.35)'; for (let i = 0; i < 6; i++) { const x = ((i * 70 - t * (14 + i * 3)) % 340 + 340) % 340 - 40, y = 30 + i * 16; g.fillRect(Math.round(x), y, 46 + i * 4, 4); g.fillRect(Math.round(x) + 8, y - 3, 26, 3); } }
        else g.drawImage(far, -Math.round(cam * FAR_K), 0);
        g.drawImage(mid, -Math.round(cam * MID_K), 0);
        const cx = L.crowd;
        cr.forEach((m, i) => { const f = m.fr[Math.floor(t * m.rate * ex + m.ph) & 1], x = Math.round(cx.xs[i] - cam * MID_K), y = cx.y + (Math.floor(t * m.rate * ex + m.ph) & 1 ? 0 : -1);
          if (m.flip) { g.save(); g.translate(x, 0); g.scale(-1, 1); g.drawImage(f.cv, f.x, y + f.y); g.restore(); } else g.drawImage(f.cv, x + f.x, y + f.y); });
        if (L.anim) L.anim(g, t, cam);
        const gr = GROUND - hz + FLOOR_C;
        for (let y = hz; y < H; y++) { const f = (y - hz + FLOOR_C) / gr, sx = Math.round(FW / 2 - W / 2 + (cam - 128) * f); g.drawImage(floor, sx, y - hz, W, 1, 0, y, W, 1); }
        if (flakes.length) { g.fillStyle = '#f4f8ff'; for (const fl of flakes) { const x = ((fl[0] - cam * fl[2] * 0.6 + Math.sin(t + fl[1]) * 6) % 400 + 400) % 400 - 40, y = (fl[1] + t * 22 * fl[2]) % 224; g.fillRect(Math.round(x), Math.round(y), fl[2] > 0.7 ? 2 : 1, fl[2] > 0.7 ? 2 : 1); } }
      } };
  }
  function buildFX() {
    const cv = pb => pb.canvas();
    return { spark: [mkSpark(9, ['#ffffff', '#fff070', '#f89020'], 8, 1), mkSpark(13, ['#ffffff', '#fff070', '#f86020'], 10, 2), mkSpark(18, ['#ffffff', '#ffe060', '#f84020'], 12, 3)].map(s => s.map(cv)),
      bspark: mkSpark(11, ['#ffffff', '#c0e8ff', '#5090f0'], 8, 4).map(cv), dust: mkDust().map(cv),
      proj: { ball: mkProj('ball').map(cv), bolt: mkProj('bolt').map(cv), snow: mkProj('snow').map(cv), palm: mkProj('palm').map(cv), lasso: mkProj('lasso').map(cv) },
      star: cv(mkStar('#ffe040')), shadow: cv(mkShadow(48)), fridge: [0, 1, 2, 3, 4].map(l => cv(mkFridge(l))),
      flags: Object.fromEntries(['jp', 'en', 'br', 'ru', 'ke', 'fr', 'us', 'cn', 'sky'].map(k => [k, cv(mkFlag(k))])) };
  }

  // ================================================================ the cartridge
  TV.game('sn.fight', {
    buttons: ['y', 'x', 'l', 'b', 'a', 'r'],
    help: 'Move: arrows. Punch: V / C / U (light, medium, heavy). Kick: X / Z / E. Block: hold back. Pause: Enter.',
    v: 1,
    _lib: typeof TESTLIB !== 'undefined' ? TESTLIB : null,
    make(K) {
      initGlyphs(K.font);
      const g = K.g, F = K.font, snd = sounds(K), L = b => K.label(b);
      if (K.hud) K.hud.clearRect(0, 0, W, H);
      g.imageSmoothingEnabled = false;
      if (!FXC) FXC = buildFX();
      if (!MAPC) MAPC = mkMap().canvas();
      const FX = FXC;
      // ---------------------------------------------------------- the save: high scores and the arcade run in progress
      let SV = K.load() || {};
      if (!Array.isArray(SV.hi) || SV.hi.length !== 8) SV.hi = HI0.map(([n, s, c]) => ({ n, s, c }));
      SV.champs = SV.champs || [];
      const save = () => { try { K.save(SV); } catch (e) {} };
      const hiTop = () => SV.hi[0].s;
      // ---------------------------------------------------------- little drawing helpers
      const txt = (s, x, y, col, k) => F.draw(g, s, x, y, col || '#fff', k || 1, '#000');
      const ctr = (s, y, col, k) => F.center(g, s, W / 2, y, col || '#fff', k || 1, '#000');
      const rtxt = (s, x, y, col, k) => F.draw(g, s, x - F.width(s, k || 1), y, col || '#fff', k || 1, '#000');
      const bigC = (s, st, y, ex, x) => { const b = big(s, st, ex); g.drawImage(b.cv, Math.round((x == null ? W / 2 : x) - b.w / 2), Math.round(y)); return b; };
      const panel = (x, y, w, h, a) => { g.fillStyle = `rgba(8,8,24,${a == null ? 0.78 : a})`; g.fillRect(x, y, w, h); g.fillStyle = '#c8a040'; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); g.fillStyle = '#5a4018'; g.fillRect(x + 1, y + 1, w - 2, 1); };
      const wrap = (s, n) => { const out = []; let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; };
      const fmt = n => String(Math.floor(n)).padStart(7, '0');
      const anyKey = () => K.pressed('start') || K.pressed('a') || K.pressed('b') || K.pressed('x') || K.pressed('y') || K.pressed('l') || K.pressed('r');
      const okKey = () => K.pressed('start') || K.pressed('a') || K.pressed('y') || K.pressed('b') || K.pressed('x');
      const portraits = () => { if (!PORT) { PORT = {}; } return PORT; };
      const port = (C, alt, kind) => { const P = portraits(), key = C.id + (alt ? 'a' : '') + kind; if (P[key]) return P[key];
        const pose = kind === 'ko' ? X(poseSet(C).idle[0], { face: 'ko', n: 0.2, fa: [0.3, 0.35], ba: [0.2, 0.4], hF: 'open', hB: 'open' }) : kind === 'win' ? X(poseSet(C).idle[0], { face: 'happy', fa: [0.3, 0.35], ba: [0.2, 0.4] }) : null;
        const pb = kind === 'grid' ? portrait(C, alt, 1.5, 34, 38, null, ['#4a2a6a', '#1a1030']) : portrait(C, alt, 2.6, 64, 72, pose, kind === 'ko' ? ['#3a1a1a', '#100808'] : ['#3a3a7a', '#101028']);
        if (kind === 'big' || kind === 'ko' || kind === 'win') { for (let i = 0; i < pb.w; i++) { pb.px(i, 0, hex32('#c8a040')); pb.px(i, pb.h - 1, hex32('#5a4018')); } for (let j = 0; j < pb.h; j++) { pb.px(0, j, hex32('#c8a040')); pb.px(pb.w - 1, j, hex32('#5a4018')); } }
        return P[key] = pb.canvas(); };
      const bodyCv = {}; // big full-body sprites for the VS screen and the title
      const body = (C, alt, sc, posek) => { const key = C.id + (alt ? 'a' : '') + sc + (posek || ''); if (bodyCv[key]) return bodyCv[key]; const P = poseSet(C), f = renderPose(prepChar(C, alt), posek === 'win' ? P.win[0] : P.idle[0], sc); f.cv = f.pb.canvas(); f.pb = null; return bodyCv[key] = f; };
      const drawBody = (f, x, y, flip, alpha) => { if (alpha != null) g.globalAlpha = alpha; if (!flip) g.drawImage(f.cv, Math.round(x + f.x), Math.round(y + f.y)); else { g.save(); g.translate(Math.round(x), 0); g.scale(-1, 1); g.drawImage(f.cv, f.x, Math.round(y + f.y)); g.restore(); } g.globalAlpha = 1; };
      const drawFlag = (id, x, y) => g.drawImage(FX.flags[id], Math.round(x), Math.round(y));
      // ---------------------------------------------------------- scenes
      let S = null; // { n: name, t, ... }
      const go = (n, o) => { S = Object.assign({ n, t: 0 }, o || {}); if (SCN[n].enter) SCN[n].enter(S); };
      let fight = null, stage = null, run = null, lastSong = null;
      const song = n => { if (lastSong === n) return; lastSong = n; K.music(n ? SONGS[n] : null); };
      // a match: bake both scrappers and the stage (a little each frame), then fight
      function prepMatch(o) { // o: { a: C, aAlt, b: C, bAlt, stage, mode, lvl, boss, bonus, next(res) }
        const ja = cacheGet(FRC, o.a.id + (o.aAlt ? 'a' : ''), 4, () => bakeJob(o.a, o.aAlt));
        const jb = o.bonus ? ja : cacheGet(FRC, o.b.id + (o.bAlt ? 'a' : ''), 4, () => bakeJob(o.b, o.bAlt));
        return { o, ja, jb, st: null, step(ms) { if (!this.ja.done) { this.ja.step(ms); return false; } if (!this.jb.done) { this.jb.step(ms); return false; } if (!this.st) { this.st = cacheGet(STC, o.stage, 3, () => buildStage(o.stage)); return false; } return true; } };
      }
      function startFight(pm) {
        const o = pm.o; stage = pm.st;
        fight = Fight({ K, snd, A: [o.a, o.aAlt], B: [o.b, o.bAlt], FR: [pm.ja.FR, pm.jb.FR], stage: o.stage, mode: o.mode, lvl: o.lvl, boss: o.boss, bonus: o.bonus, onEnd: res => o.next(res) });
        if (o.bonus) { fight.maxRounds = 1; }
        song(o.bonus ? 'bonus' : stage.music);
        go('fight', { pm });
      }
      // ---------------------------------------------------------- the arcade run
      function newRun(c, alt) {
        const R = prng((Date.now() & 0xffff) + 7), others = ROSTER.filter(x => x.id !== c.id).map(x => x.id);
        for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
        run = { c: c.id, alt: !!alt, ladder: others.concat('baron'), i: 0, score: 0, bonus: 0, conts: 0 };
        SV.run = run; save();
      }
      const lvlOf = i => i >= 7 ? 0.86 : 0.14 + i * 0.1;
      function nextArcade() {
        if (run.i === 4 && !run.bonus) { go('vs', { bonus: 1 }); return; }
        if (run.i >= run.ladder.length) { go('ending'); return; }
        go('map');
      }
      function arcadeMatch(bonus) {
        const me = CHI[run.c], foe = bonus ? me : CHI[run.ladder[run.i]];
        return prepMatch({ a: me, aAlt: run.alt, b: foe, bAlt: false, stage: bonus ? 'garden' : foe.stage, mode: 'arcade', lvl: lvlOf(run.i), boss: !!foe.boss, bonus,
          next(res) {
            run.score += fight.score;
            if (bonus) { run.bonus = 1; SV.run = run; save(); go('bonusres', { res, sc: fight.score }); return; }
            if (res.win) { run.i++; SV.run = run; save(); if (foe.boss) { K.secret('lk.scrap.champ'); if (!SV.champs.includes(me.id)) SV.champs.push(me.id); save(); } go('quote', { win: 1, winner: me, loser: foe }); }
            else go('quote', { win: 0, winner: foe, loser: me });
          } });
      }
      // score sent to JackNet: never more than the time playing could make (a resumed run starts its clock again)
      function finishGo(title, text) { const sc = Math.min(50000, run ? run.score : 0), safe = Math.min(sc, Math.floor(390 * (K.t + 3))); SV.run = null; save(); song(null); K.over(safe, { title, text }); }
      // ---------------------------------------------------------- scene table
      const SCN = {};
      // ----- title + attract
      let titleIdle = 0;
      SCN.title = {
        enter(s) { song('title'); s.menu = 0; s.open = 0; titleIdle = 0; s.items = null; },
        update(s) {
          s.t++; titleIdle++;
          if (!s.open) { if (K.pressed('start') || okKey()) { snd.ok(); s.open = 1; titleIdle = 0; s.items = (SV.run ? [['CONTINUE', 'cont']] : []).concat([['ARCADE', 'arcade'], ['TRAINING', 'train'], ['HIGH SCORES', 'hi'], ['HOW TO PLAY', 'how']]); s.menu = 0; } if (titleIdle > 60 * 14) { go('hiscores', { attract: 1 }); } return; }
          if (K.pressed('up')) { s.menu = (s.menu + s.items.length - 1) % s.items.length; snd.move(); titleIdle = 0; }
          if (K.pressed('down')) { s.menu = (s.menu + 1) % s.items.length; snd.move(); titleIdle = 0; }
          if (titleIdle > 60 * 25) { s.open = 0; titleIdle = 0; }
          if (okKey()) { snd.ok(); const it = s.items[s.menu][1];
            if (it === 'arcade') go('select', { mode: 'arcade' });
            else if (it === 'cont') { run = SV.run; nextArcade(); }
            else if (it === 'train') go('select', { mode: 'train' });
            else if (it === 'hi') go('hiscores', {});
            else go('how'); }
        },
        draw(s) { drawTitle(s); }
      };
      function drawTitle(s) {
        const t = s.t;
        g.fillStyle = '#100410'; g.fillRect(0, 0, W, H);
        // rays behind the logo
        g.save(); g.translate(W / 2, 70);
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + t / 300; g.fillStyle = i & 1 ? '#3a0a18' : '#260814'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 300, Math.sin(a) * 300); g.lineTo(Math.cos(a + TAU / 16) * 300, Math.sin(a + TAU / 16) * 300); g.fill(); }
        g.restore();
        // two scrappers facing off, lit from below by the logo
        const a = body(CHI.kenji, 0, 1.55), b = body(CHI.barry, 0, 1.55), bob = Math.sin(t / 20) * 1;
        drawBody(a, 52, 236 + bob, false); drawBody(b, 206, 236 - bob, true);
        const gr = g.createLinearGradient(0, 120, 0, 224); gr.addColorStop(0, 'rgba(16,4,16,0)'); gr.addColorStop(1, 'rgba(16,4,16,.85)'); g.fillStyle = gr; g.fillRect(0, 120, W, 104);
        // the logo
        const k = Math.min(1, t / 40), drop = (1 - k) * -80;
        const l1 = big('STREET', 'gold', { sx: 1.0 }), l2 = big('SCRAPPER', 'gold', { sx: 1.12, sy: 1.2 }), l3 = big('II', 'red', { roman: 1, sx: 1.25, sy: 2.4, ext: 3, cols: ['#fff0e0', '#ff8060', '#f03020', '#c01818', '#801010'] });
        g.drawImage(l1.cv, 30, 14 + drop); g.drawImage(l3.cv, 200, 10 + drop * 1.3); g.drawImage(l2.cv, Math.round(W / 2 - l2.w / 2) - 4, 46 + drop);
        if (t > 40) { const sh = ((t - 40) * 6) % 600 - 100; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(sh, 10); g.lineTo(sh + 14, 10); g.lineTo(sh - 26, 96); g.lineTo(sh - 40, 96); g.fill(); g.restore(); }
        const sub = big('THE WORLD SCRAPPER', 'silver', { k: 2, shear: 0 }); g.drawImage(sub.cv, Math.round(W / 2 - sub.w / 2), 98);
        if (!s.open) { if ((t >> 5) & 1 || t < 40) ctr('PRESS START', 156, '#ffe060', 1); const tip = TIPS[Math.floor(t / 300) % TIPS.length]; ctr('TIP: ' + tip, 200, '#9a9ab8'); }
        else { panel(78, 132, 100, s.items.length * 12 + 8); s.items.forEach((it, i) => { const on = i === s.menu, lab = it[1] === 'cont' && SV.run ? 'CONTINUE ' + (SV.run.i + 1) + '/8' : it[0]; if (on) { g.fillStyle = '#7a1a20'; g.fillRect(80, 137 + i * 12, 96, 10); txt('→', 84, 138 + i * 12, '#ffe060'); } txt(lab, 94, 138 + i * 12, on ? '#ffffff' : '#b8b8d0'); }); }
        txt('HI ' + fmt(hiTop()), 6, 4, '#ffe060');
        F.center(g, '(C) 1999 KAPOW SOFT', W / 2, 214, '#7a6a8a', 1);
      }
      // ----- the high score table (attract, or after a go)
      SCN.hiscores = {
        enter(s) { if (!s.after) song('hiscore'); },
        update(s) { s.t++; if (s.t > 20 && (anyKey())) { if (s.after) { s.after(); return; } go('title'); return; } if (s.attract && s.t > 60 * 6) go('demo'); if (s.after && s.t > 60 * 8) s.after(); },
        draw(s) {
          g.fillStyle = '#080818'; g.fillRect(0, 0, W, H);
          for (let i = 0; i < 40; i++) { const x = (i * 53 + s.t * (1 + i % 3)) % W, y = (i * 37) % H; g.fillStyle = i % 3 ? '#3a3a6a' : '#8a8ac8'; g.fillRect(x, y, 1, 1); }
          bigC('HIGH SCORES', 'gold', 10, { k: 2, sy: 1.4 });
          panel(18, 40, 220, 150);
          txt('RANK', 26, 48, '#9a9ab8'); txt('NAME', 64, 48, '#9a9ab8'); rtxt('SCORE', 166, 48, '#9a9ab8'); txt('SCRAPPER', 174, 48, '#9a9ab8');
          SV.hi.forEach((e, i) => { const y = 64 + i * 15, me = s.mark === i, col = me ? ((s.t >> 3) & 1 ? '#ffffff' : '#ffe060') : i === 0 ? '#ffe060' : '#e0e0f0';
            txt(['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH'][i], 26, y, col); txt(e.n, 64, y, col); rtxt(String(e.s), 166, y, col); const C = CHI[e.c]; if (C) { drawFlag(C.flag, 174, y - 2); txt(C.name.replace('BIG ', '').replace('THE ', ''), 194, y, col); } });
          ctr(s.after ? 'PRESS A BUTTON' : 'PRESS START', 200, (s.t >> 5) & 1 ? '#ffe060' : '#a08030');
        }
      };
      // ----- the demo fight
      SCN.demo = {
        enter(s) { const r = prng(Date.now() & 0xffff), a = ROSTER[Math.floor(r() * 8)]; let b = ROSTER[Math.floor(r() * 8)]; if (b === a) b = ROSTER[(a.i + 3) % 8];
          s.pm = prepMatch({ a, b, stage: b.stage, mode: 'demo', lvl: 0.5, next() { go('title'); } }); song(null); },
        update(s) { s.t++; if (anyKey()) { go('title'); return; } if (s.pm.step(8)) { startFight(s.pm); S.demo = 1; } },
        draw(s) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); ctr('LOADING...', 108, '#888'); }
      };
      // ----- how to play
      SCN.how = {
        update(s) { s.t++; if (s.t > 10 && anyKey()) { snd.ok(); go('title'); } },
        draw(s) {
          g.fillStyle = '#0c0c20'; g.fillRect(0, 0, W, H); bigC('HOW TO PLAY', 'gold', 6, { k: 2, sy: 1.4 });
          // the pad, with the six attack buttons
          const px = 128, py = 62; g.fillStyle = '#9a98a0'; g.beginPath(); g.ellipse(px - 52, py, 30, 24, 0, 0, TAU); g.ellipse(px + 52, py, 30, 24, 0, 0, TAU); g.fill(); g.fillRect(px - 52, py - 24, 104, 48); g.fillStyle = '#c8c6cc'; g.fillRect(px - 50, py - 22, 100, 6);
          g.fillStyle = '#2a2a30'; g.fillRect(px - 64, py - 4, 24, 8); g.fillRect(px - 56, py - 12, 8, 24);
          g.fillStyle = '#6a6870'; g.fillRect(px - 70, py - 30, 34, 6); g.fillRect(px + 36, py - 30, 34, 6); txt(L('l'), px - 56, py - 30, '#fff'); txt(L('r'), px + 50, py - 30, '#fff');
          const btn = (b, x, y, col) => { g.fillStyle = '#202024'; g.beginPath(); g.arc(x, y + 1, 7, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); F.center(g, L(b), x, y - 3, '#fff', 1); };
          btn('x', px + 52, py - 12, '#2a52d0'); btn('y', px + 38, py, '#2a9a4a'); btn('a', px + 66, py, '#d42a2a'); btn('b', px + 52, py + 12, '#e8c21a');
          const lines = [[`PUNCH  (${L('y')}) LIGHT  (${L('x')}) MEDIUM  (${L('l')}) HEAVY`, '#ffe060'], [`KICK   (${L('b')}) LIGHT  (${L('a')}) MEDIUM  (${L('r')}) HEAVY`, '#ffe060'], ['', ''], ['WALK: ← →   JUMP: ↑   CROUCH: ↓', '#fff'], ['BLOCK: HOLD AWAY FROM YOUR ENEMY', '#fff'], ['(CROUCH AND HOLD AWAY TO BLOCK LOW)', '#b8b8d0'], ['THROW: GET CLOSE, ← OR → + HEAVY', '#fff'], ['SPECIAL MOVES: PAUSE > MOVE LIST', '#fff'], ['', ''], ['WIN 2 ROUNDS TO WIN THE FIGHT.', '#9ae0ff'], ['BEAT ALL EIGHT TO BE THE WORLD SCRAPPER!', '#9ae0ff']];
          lines.forEach(([l, c], i) => l && ctr(l, 98 + i * 10, c));
          ctr('PRESS A BUTTON', 212, (s.t >> 5) & 1 ? '#ffe060' : '#a08030');
        }
      };
      // ----- character select (with the world map)
      SCN.select = {
        enter(s) { song('select'); s.cur = s.cur || 0; s.pick = null; s.flash = 0; s.second = 0; },
        update(s) {
          s.t++;
          if (s.flash) { if (--s.flash === 0) { const C = ROSTER[s.cur];
            if (s.mode === 'train' && !s.second) { s.me = [s.pick, s.alt]; s.second = 1; s.cur = (s.cur + 1) % 8; return; }
            if (s.mode === 'train') { const foe = ROSTER[s.cur]; const pm = prepMatch({ a: s.me[0], aAlt: s.me[1], b: foe, bAlt: foe === s.me[0] ? !s.me[1] : false, stage: foe.stage, mode: 'training', lvl: 0.5, next() { go('title'); } }); go('vs', { pm, train: 1 }); return; }
            newRun(s.pick, s.alt); nextArcade(); } return; }
          const c = s.cur, col = c % 4, row = c >> 2;
          if (K.pressed('left')) { s.cur = row * 4 + (col + 3) % 4; snd.move(); }
          if (K.pressed('right')) { s.cur = row * 4 + (col + 1) % 4; snd.move(); }
          if (K.pressed('up') || K.pressed('down')) { s.cur = (s.cur + 4) % 8; snd.move(); }
          let alt = null; if (K.pressed('b') || K.pressed('a') || K.pressed('r')) alt = true; else if (K.pressed('y') || K.pressed('x') || K.pressed('l') || K.pressed('start')) alt = false;
          if (alt != null) { s.pick = ROSTER[s.cur]; s.alt = alt; s.flash = 40; snd.ok(); }
        },
        draw(s) {
          const t = s.t; g.fillStyle = '#100818'; g.fillRect(0, 0, W, H);
          g.drawImage(MAPC, 0, 14);
          g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, W, 14);
          bigC(s.mode === 'train' ? (s.second ? 'PICK A PRACTICE PARTNER' : 'TRAINING: PICK YOUR SCRAPPER') : 'SELECT YOUR SCRAPPER', 'silver', 1, { k: 2, shear: 0, ext: 0 });
          const hov = ROSTER[s.cur];
          ROSTER.forEach(C => { const [mx, my] = C.map, on = C === hov; drawFlag(C.flag, mx - 9, 14 + my - 16); g.fillStyle = on ? ((t >> 3) & 1 ? '#ffffff' : '#ff4040') : '#202020'; g.fillRect(mx - 1, 14 + my - 3, 3, 3); });
          // the big portrait of the one under the cursor
          const big1 = port(hov, s.second ? false : s.flash ? s.alt : false, 'big');
          g.drawImage(big1, 6, 128); if (s.flash && (s.flash >> 2) & 1) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(6, 128, 64, 72); }
          // the grid
          ROSTER.forEach((C, i) => { const x = 82 + (i % 4) * 40, y = 130 + (i >> 2) * 42; g.fillStyle = '#000'; g.fillRect(x - 1, y - 1, 36, 40); g.drawImage(port(C, false, 'grid'), x, y);
            if (i === s.cur) { const c2 = s.second ? '#40a0ff' : ((t >> 3) & 1 ? '#ff2020' : '#ffe040'); g.fillStyle = c2; g.fillRect(x - 2, y - 2, 38, 2); g.fillRect(x - 2, y + 38, 38, 2); g.fillRect(x - 2, y - 2, 2, 42); g.fillRect(x + 34, y - 2, 2, 42); txt(s.second ? '2P' : '1P', x + 1, y + 1, c2); }
            if (s.second && s.me && C === s.me[0]) txt('1P', x + 22, y + 30, '#ff4040'); });
          // the name plate
          panel(0, 112, W, 15, 0.85); txt(hov.name, 6, 116, '#ffe060'); txt(hov.land, 6 + F.width(hov.name) + 8, 116, '#9ad0ff'); rtxt(hov.style, 250, 116, '#c8c8e0');
          ctr(hov.bio, 214, '#e0e0f0');
          if (hov.note && !s.second) { const w = F.width(hov.note) + 8; g.fillStyle = '#c02020'; g.fillRect(6, 116 + 86, w, 10); txt(hov.note, 10, 116 + 87, '#ffffff'); }
          if (s.mode !== 'train' && !s.flash && (t >> 5) & 1) rtxt('PUNCH OR KICK: COLOURS', 250, 202, '#8a8aa8');
        }
      };
      // ----- the world map between fights: a little plane flies to the next country
      SCN.map = {
        enter(s) { song(null); s.from = run.i ? CHI[run.ladder[run.i - 1]] : CHI[run.c]; s.to = CHI[run.ladder[run.i]]; snd.coin(); },
        update(s) { s.t++; if (s.t > 150 || (s.t > 30 && okKey())) go('vs', {}); },
        draw(s) {
          g.fillStyle = '#100818'; g.fillRect(0, 0, W, H); g.drawImage(MAPC, 0, 40);
          const a = s.from.map[0] ? s.from.map : [128, 0], b = s.to.boss ? [128, 4] : s.to.map, k = clamp(s.t / 110, 0, 1);
          for (let i = 0; i <= 20; i++) { const p = i / 20; if (p > k) break; const x = lerp(a[0], b[0], p), y = lerp(a[1], b[1], p) - Math.sin(p * PI) * 20; g.fillStyle = '#ffffff'; g.fillRect(Math.round(x), Math.round(40 + y), 1, 1); }
          const px = lerp(a[0], b[0], k), py = lerp(a[1], b[1], k) - Math.sin(k * PI) * 20; g.fillStyle = '#202020'; g.fillRect(px - 5, 40 + py - 2, 11, 4); g.fillStyle = '#f0f0f0'; g.fillRect(px - 4, 40 + py - 1, 9, 2); g.fillRect(px - 1, 40 + py - 4, 3, 8);
          ROSTER.forEach(C => { if (C.id === run.c || run.ladder.indexOf(C.id) < run.i) { const [mx, my] = C.map; txt(C.id === run.c ? '*' : 'X', mx - 3, 40 + my - 4, C.id === run.c ? '#ffe060' : '#ff4040'); } });
          bigC('FIGHT ' + (run.i + 1) + ' OF 8', 'gold', 6, { k: 2, sy: 1.3 });
          panel(20, 160, 216, 40); txt('NEXT:', 28, 166, '#9a9ab8'); txt(s.to.name, 64, 166, '#ffe060'); txt(s.to.boss ? 'THE BLIMP, SOMEWHERE ABOVE YOU' : s.to.land, 64, 178, '#9ad0ff'); if (!s.to.boss) drawFlag(s.to.flag, 208, 168);
          rtxt('SCORE ' + fmt(run.score), 248, 30, '#e0e0f0');
        }
      };
      // ----- VS: the big face-off while the sprites bake
      SCN.vs = {
        enter(s) {
          if (!s.pm) s.pm = s.bonus ? arcadeMatch(1) : arcadeMatch(0);
          snd.vs(); song(null);
        },
        update(s) { s.t++; s.pm.step(9); if (s.t > (s.bonus ? 110 : 170) && s.pm.step(9)) startFight(s.pm); },
        draw(s) {
          const o = s.pm.o, t = s.t;
          if (o.bonus) {
            g.fillStyle = '#081830'; g.fillRect(0, 0, W, H);
            for (let i = 0; i < 20; i++) { g.fillStyle = i & 1 ? '#0c2448' : '#08203c'; g.fillRect(0, i * 12, W, 12); }
            bigC('BONUS STAGE', 'gold', 24, { k: 2, sx: 1.6, sy: 2.2 }); bigC("SMASH DAD'S OLD FRIDGE!", 'small', 76, { k: 2 });
            ctr("DAD: 'IT'S GOING TO THE TIP ANYWAY.'", 102, '#9ad0ff'); ctr('30 SECONDS. GO!', 116, '#ffffff'); g.drawImage(FX.fridge[0], 106, 136); g.drawImage(FX.fridge[3], 154, 136);
            return;
          }
          // split diagonal background with speed lines
          g.fillStyle = '#5a0a14'; g.fillRect(0, 0, W, H); g.fillStyle = '#0a1450'; g.beginPath(); g.moveTo(150, 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(106, H); g.fill();
          for (let i = 0; i < 14; i++) { const y = (i * 17 + t * 7) % H; g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, y, 120, 1); g.fillRect(136, (i * 23 + t * 9) % H, 120, 1); }
          const k = clamp(t / 20, 0, 1), A = body(o.a, o.aAlt, 1.5), B = body(o.b, o.bAlt, 1.5);
          drawBody(A, lerp(-80, 58, k), 196, false); drawBody(B, lerp(W + 80, 198, k), 196, true);
          // the big portraits, one each side of the split (the same art as the select screen)
          const pa = port(o.a, o.aAlt, 'big'), pb2 = port(o.b, o.bAlt, 'big'), pk = clamp((t - 6) / 16, 0, 1);
          g.drawImage(pa, Math.round(lerp(-70, 10, pk)), 22); g.drawImage(pb2, Math.round(lerp(W + 6, W - 74, pk)), 22);
          g.fillStyle = '#ffe060'; g.fillRect(10, 94, 64, 1); g.fillRect(W - 74, 94, 64, 1);
          const vsb = big('VS', 'gold', { k: 4, sx: 1.4, sy: 1.6, ext: 3 }), zz = t < 30 ? 1 + (30 - t) / 15 : 1;
          if (t > 14) { g.save(); g.translate(W / 2, 92); g.scale(zz, zz); g.drawImage(vsb.cv, -vsb.w / 2, -vsb.h / 2); g.restore(); }
          panel(0, 196, W, 28, 0.9);
          txt(o.a.name, 8, 202, '#ffe060'); drawFlag(o.a.flag, 8, 211); txt(o.a.land, 30, 213, '#c8c8e0');
          rtxt(o.b.name, 248, 202, '#ffe060'); if (!o.b.boss) drawFlag(o.b.flag, 230, 211); rtxt(o.b.boss ? 'THE FINAL FIGHT' : o.b.land, o.b.boss ? 248 : 226, 213, '#c8c8e0');
          ctr(STAGES[o.stage].name, 8, '#ffffff'); if (o.boss) { if ((t >> 3) & 1) ctr('WARNING! THE BARON IS HERE!', 20, '#ff4040'); }
          if (s.t > 170 && !s.pm.step(0)) ctr('LOADING...', 180, '#ffffff');
        }
      };
      // ----- the fight itself (and training, and the demo)
      let pauseSel = 0, paused = false, movesShown = false;
      SCN.fight = {
        enter() { paused = false; movesShown = false; },
        update(s) {
          s.t++;
          const M = fight;
          if (S.demo) { if (anyKey() || s.t > 60 * 28) { fight = null; go('title'); } else M.update(); return; }
          if (K.pressed('start') && !M.over) { paused = !paused; movesShown = false; pauseSel = 0; snd.move(); if (paused) K.music(null); else K.music(SONGS[lastSong]); return; }
          if (paused) { pauseUpdate(); return; }
          M.update();
        },
        draw(s) { const M = fight; M.draw(g, stage, FX); drawHUD(M, s); if (paused) drawPause(); }
      };
      const pauseItems = () => fight.mode === 'training' ? ['RESUME', 'MOVE LIST', 'DUMMY: ' + fight.dummy.toUpperCase(), 'QUIT TO TITLE'] : ['RESUME', 'MOVE LIST', 'QUIT TO TITLE'];
      function pauseUpdate() {
        if (movesShown) { if (anyKey()) { movesShown = false; snd.move(); } return; }
        const it = pauseItems();
        if (K.pressed('up')) { pauseSel = (pauseSel + it.length - 1) % it.length; snd.move(); }
        if (K.pressed('down')) { pauseSel = (pauseSel + 1) % it.length; snd.move(); }
        const lab = it[pauseSel];
        if (lab.startsWith('DUMMY') && (K.pressed('left') || K.pressed('right') || okKey())) { const L2 = ['stand', 'crouch', 'jump', 'block', 'cpu'], i = L2.indexOf(fight.dummy); fight.dummy = L2[(i + (K.pressed('left') ? 4 : 1)) % 5]; if (fight.P2.ai && fight.dummy !== 'cpu') fight.P2.ai = null; snd.move(); return; }
        if (okKey()) { snd.ok(); if (lab === 'RESUME') { paused = false; K.music(SONGS[lastSong]); } else if (lab === 'MOVE LIST') movesShown = true; else if (lab === 'QUIT TO TITLE') { paused = false; fight = null; go('title'); } }
      }
      function drawPause() {
        g.fillStyle = 'rgba(0,0,16,.72)'; g.fillRect(0, 0, W, H);
        const C = fight.P1.C;
        if (movesShown) {
          bigC(C.name + ' MOVES', 'gold', 18, { k: 2, sy: 1.3 }); panel(10, 46, 236, 140);
          let y = 54; for (const id of C.moves) { const m = SP[id]; txt(m.n, 18, y, '#ffe060'); txt(moveText(m), 26, y + 10, '#ffffff'); y += 26; }
          txt('THROW', 18, y, '#ffe060'); txt('CLOSE UP: ← OR → + HEAVY P OR K', 26, y + 10, '#ffffff'); y += 26;
          txt('(MOVES ARE FOR FACING RIGHT)', 18, y + 2, '#8a8aa8');
          ctr('PRESS A BUTTON', 196, '#a0a0c0'); return;
        }
        bigC('PAUSED', 'gold', 40, { k: 4 });
        const it = pauseItems(); panel(66, 92, 124, it.length * 14 + 10);
        it.forEach((l, i) => { const on = i === pauseSel; if (on) { g.fillStyle = '#7a1a20'; g.fillRect(68, 97 + i * 14, 120, 11); txt('→', 72, 99 + i * 14, '#ffe060'); } txt(l, 82, 99 + i * 14, on ? '#ffffff' : '#b8b8d0'); });
        ctr('PRESS START TO RESUME', 176, (K.frame >> 5) & 1 ? '#ffe060' : '#a08030');
        if (fight.mode === 'training') ctr('DUMMY: ← → TO CHANGE', 190, '#8a8aa8');
      }
      // ---------------------------------------------------------- the fight HUD
      function drawHUD(M, s) {
        const P1 = M.P1, P2 = M.P2, t = M.t;
        // life bars
        const bar = (F, x, right) => {
          const w = 104, y = 13, h = 9, k = clamp(F.hp / MAXHP, 0, 1), kd = clamp(F.dhp / MAXHP, 0, 1);
          g.fillStyle = '#101018'; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = '#c8a040'; g.fillRect(x - 1, y - 1, w + 2, 1); g.fillRect(x - 1, y + h, w + 2, 1); g.fillStyle = '#b01818'; g.fillRect(x, y, w, h); g.fillStyle = '#801010'; g.fillRect(x, y + h - 2, w, 2);
          const fw = Math.round(w * k), dw = Math.round(w * kd), low = k < 0.25 && (t >> 3) & 1;
          const fx = right ? x : x + w - fw, dx = right ? x : x + w - dw;
          g.fillStyle = '#ffffff'; g.fillRect(dx, y, dw, h);
          g.fillStyle = low ? '#ff8040' : '#f8d020'; g.fillRect(fx, y, fw, h); g.fillStyle = low ? '#ffc0a0' : '#fff7a0'; g.fillRect(fx, y, fw, 2); g.fillStyle = '#c89a10'; g.fillRect(fx, y + h - 2, fw, 2);
        };
        if (P2.fridge) { bar(P1, 10, false); bar(P2, 142, true); }
        else { bar(P1, 10, false); bar(P2, 142, true); }
        txt(P1.C.name, 10, 25, '#ffffff'); rtxt(P2.fridge ? "DAD'S FRIDGE" : P2.C.name, 246, 25, '#ffffff');
        // rounds won
        const medal = (x, y) => { g.fillStyle = '#101018'; g.fillRect(x - 1, y - 1, 9, 9); g.fillStyle = '#f8d020'; g.fillRect(x, y, 7, 7); g.fillStyle = '#fff7a0'; g.fillRect(x, y, 7, 2); txt('V', x + 1, y, '#a02010'); };
        for (let i = 0; i < Math.min(2, P1.wins); i++) medal(102 - i * 10, 25);
        for (let i = 0; i < Math.min(2, P2.wins); i++) medal(147 + i * 10, 25);
        // the clock
        g.fillStyle = '#101018'; g.fillRect(117, 8, 22, 18); g.fillStyle = '#3a2a10'; g.fillRect(118, 9, 20, 16);
        if (M.mode === 'training') txt('--', 122, 13, '#ffe060');
        else { const tb = big(String(M.timer).padStart(2, '0'), M.timer <= 10 ? 'red' : 'gold', { k: 2, ext: 0, shear: 0, ol: 1 }); g.drawImage(tb.cv, Math.round(128 - tb.w / 2), 8); }
        // score
        if (M.mode === 'arcade') { txt('1P ' + fmt((run ? run.score : 0) + M.score), 10, 2, '#e0e0f0'); rtxt('HI ' + fmt(Math.max(hiTop(), (run ? run.score : 0) + M.score)), 246, 2, '#ffe060'); }
        else if (M.mode === 'training') { ctr('TRAINING', 2, '#9ad0ff'); if (M.lastSp) txt(M.lastSp + '!', 10, 40, '#ffe060'); if (M.lastDmg) rtxt('DAMAGE ' + M.lastDmg, 246, 40, '#ffffff'); }
        else if (S.demo) { if ((t >> 5) & 1) ctr('DEMO PLAY - PRESS START', 40, '#ffe060'); }
        // combo counters
        for (const c of M.texts) { const x = c.side ? 250 : 6, y = 70 - Math.min(6, c.t) + 0, b = big(c.s, 'small', { k: 2 }); if (c.t < 50 || (c.t & 2)) g.drawImage(b.cv, c.side ? x - b.w : x, y); }
        // the round announcer
        const st = M.state, k = M.st;
        if (st === 'round' || (st === 'intro' && M.round > 1 && k > 30)) {
          if (M.P2.fridge) { if (st === 'round') bigC('BONUS STAGE', 'gold', 80, { k: 4 }); }
          else if (st === 'round') { const s2 = M.round >= 3 && P1.wins === 1 && P2.wins === 1 ? 'FINAL ROUND' : 'ROUND ' + M.round; const b = big(s2, 'gold', { k: 4 }); const x = Math.round(lerp(W + 10, W / 2 - b.w / 2, clamp(k / 12, 0, 1))); g.drawImage(b.cv, x, 84); }
        }
        if (st === 'fight' && k < 40) { const b = big(M.P2.fridge ? 'SMASH IT!' : 'FIGHT!', 'red', { k: 4, sx: 1.2, sy: 1.3 }), z = k < 8 ? 2.4 - k * 0.175 : 1; g.save(); g.translate(W / 2, 100); g.scale(z, z); g.drawImage(b.cv, -b.w / 2, -b.h / 2); g.restore(); }
        if (st === 'ko') {
          if (M.P2.fridge) { if (k > 10) { if (M.winner) { bigC('BRILLIANT!', 'gold', 70, { k: 4 }); ctr('FRIDGE BONUS 1000', 116, '#ffffff'); ctr('TIME BONUS ' + (M.bonus ? M.bonus.time : 0), 128, '#ffffff'); } else { bigC('TIME UP!', 'red', 76, { k: 4 }); ctr("DAD: 'NOT BAD. IT'S STILL A BIT COLD.'", 120, '#ffffff'); } } }
          else {
            if (k < 70 && !M.timeover) { const b = big('K.O.', 'red', { k: 4, sx: 1.5, sy: 1.6, ext: 3 }); if (k < 40 || (k >> 2) & 1) g.drawImage(b.cv, Math.round(W / 2 - b.w / 2), 64); }
            if (M.timeover && k < 70) bigC('TIME OVER', 'red', 74, { k: 4 });
            if (M.winPosed && k - M.winPosed > 10) {
              const s2 = !M.winner ? 'DRAW GAME' : M.mode === 'demo' || M.mode === 'training' ? M.winner.C.name + ' WINS' : M.winner === P1 ? 'YOU WIN' : 'YOU LOSE';
              bigC(s2, M.winner === P1 || M.mode === 'demo' ? 'gold' : 'blue', 62, { k: 4 });
              if (M.perfect && (k >> 3) & 1) bigC('PERFECT', 'red', 98, { k: 4, sy: 1.2 });
              if (M.bonus && M.winner === P1) { const y = M.perfect ? 136 : 106; ctr('TIME BONUS    ' + M.bonus.time, y, '#ffffff'); ctr('VITAL BONUS   ' + M.bonus.vit, y + 11, '#ffffff'); if (M.bonus.perf) ctr('PERFECT BONUS ' + M.bonus.perf, y + 22, '#ffe060'); }
            }
          }
        }
      }
      // ----- after the bonus stage
      SCN.bonusres = { update(s) { s.t++; if (s.t > 40) { fight = null; go('map'); } }, draw() { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); } };
      // ----- the win quote / lose screen after a match
      SCN.quote = {
        enter(s) { song(null); s.q = s.winner.quote[Math.floor(Math.random() * s.winner.quote.length)]; fight = null; },
        update(s) { s.t++; if (s.t > 50 && okKey() || s.t > 300) { if (s.win) nextArcade(); else go('cont'); } },
        draw(s) {
          g.fillStyle = '#080814'; g.fillRect(0, 0, W, H);
          for (let y = 0; y < H; y += 2) { g.fillStyle = (y >> 1) & 1 ? '#0c0c1c' : '#080814'; g.fillRect(0, y, W, 1); }
          g.drawImage(port(s.winner, s.win ? run.alt : false, 'win'), 20, 40); g.drawImage(port(s.loser, s.win ? false : run.alt, 'ko'), 172, 40);
          bigC(s.winner.name, 'gold', 118, { k: 2 }, 52); bigC(s.loser.name, 'blue', 118, { k: 2 }, 204);
          panel(14, 146, 228, 52); const n = Math.min(s.q.length, Math.floor(s.t / 2)); wrap(s.q.slice(0, n), 36).forEach((l, i) => txt(l, 22, 154 + i * 11, '#ffffff'));
          ctr(s.win ? 'YOU WIN!' : 'YOU LOSE...', 16, s.win ? '#ffe060' : '#9ad0ff', 2);
        }
      };
      // ----- continue?
      SCN.cont = {
        enter(s) { song('cont'); s.cn = 9; },
        update(s) {
          s.t++; if (s.t % 70 === 0) { s.cn--; snd.tick(); }
          if (okKey() && s.t > 20) { snd.coin(); const sc = Math.min(50000, run.score); if (sc > 0) K.over(Math.min(sc, Math.floor(390 * (K.t + 3))), { keep: true }); run.score = 0; run.conts++; SV.run = run; save(); go('vs', {}); return; }
          if (s.cn < 0 || K.pressed('select')) { song(null); gameOver(); }
        },
        draw(s) {
          g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
          g.drawImage(port(CHI[run.c], run.alt, 'ko'), 96, 26);
          bigC('CONTINUE?', 'blue', 112, { k: 4 });
          const nb = big(String(Math.max(0, s.cn)), 'gold', { k: 4, sx: 1.6, sy: 1.6, ext: 3 }); g.drawImage(nb.cv, Math.round(W / 2 - nb.w / 2), 146);
          ctr('PRESS START TO KEEP FIGHTING', 206, (s.t >> 4) & 1 ? '#ffe060' : '#a08030');
        }
      };
      // ----- game over / name entry / table, then the score card
      function qualifies(sc) { return sc > SV.hi[7].s; }
      function gameOver() {
        const sc = Math.min(50000, run.score);
        const fin = () => finishGo('GAME OVER', 'You reached fight ' + (run.i + 1) + ' of 8 with ' + CHI[run.c].name + '.');
        if (qualifies(sc)) go('entry', { sc, after: fin }); else go('over', { after: fin });
      }
      SCN.over = { enter() { song(null); snd.lose(); }, update(s) { s.t++; if (s.t > 150 || (s.t > 40 && okKey())) go('hiscores', { after: s.after }); },
        draw(s) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); bigC('GAME OVER', 'red', 90, { k: 4, sy: 1.3 }); ctr('SCORE ' + fmt(run.score), 140, '#ffffff'); } };
      SCN.entry = {
        enter(s) { song('hiscore'); s.nm = ['J', 'A', 'C', 'K']; s.pos = 0; s.done = 0; },
        update(s) {
          s.t++; const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ .!', ch = s.nm[s.pos], i = A.indexOf(ch);
          if (K.pressed('up')) { s.nm[s.pos] = A[(i + 1) % A.length]; snd.move(); }
          if (K.pressed('down')) { s.nm[s.pos] = A[(i + A.length - 1) % A.length]; snd.move(); }
          if (K.pressed('right') || K.pressed('a') || K.pressed('y') || K.pressed('x') || K.pressed('b')) { s.pos++; snd.ok(); }
          if (K.pressed('left') && s.pos > 0) { s.pos--; snd.move(); }
          if (K.pressed('start') || s.pos > 3 || s.t > 60 * 40) {
            const n = s.nm.join('').trim() || 'JACK', e = { n, s: s.sc, c: run.c };
            SV.hi.push(e); SV.hi.sort((a, b) => b.s - a.s); SV.hi.length = 8; save();
            go('hiscores', { mark: SV.hi.indexOf(e), after: s.after });
          }
        },
        draw(s) {
          g.fillStyle = '#080818'; g.fillRect(0, 0, W, H);
          bigC('NEW HIGH SCORE!', 'gold', 14, { k: 2, sy: 1.4 });
          g.drawImage(port(CHI[run.c], run.alt, 'win'), 96, 42);
          ctr('SCORE ' + fmt(s.sc), 122, '#ffffff');
          ctr('ENTER YOUR NAME', 140, '#9ad0ff');
          for (let i = 0; i < 4; i++) { const x = 92 + i * 20, on = i === s.pos; g.fillStyle = on ? '#7a1a20' : '#202040'; g.fillRect(x, 154, 16, 20); const b = big(s.nm[i] === ' ' ? '-' : s.nm[i], on ? 'gold' : 'silver', { k: 2, ext: 0, shear: 0 }); g.drawImage(b.cv, x + 8 - b.w / 2, 157); if (on && (s.t >> 4) & 1) { txt('↑', x + 5, 146, '#ffe060'); txt('↓', x + 5, 176, '#ffe060'); } }
          ctr('↑↓ LETTER  → NEXT  START: DONE', 196, '#8a8aa8');
        }
      };
      // ----- the ending
      SCN.ending = {
        enter(s) { song('ending'); s.page = 0; s.C = CHI[run.c]; s.st = cacheGet(STC, s.C.stage, 3, () => buildStage(s.C.stage)); s.lines = ENDINGS[s.C.id] || ENDINGS.kenji; s.pt = 0; },
        update(s) { s.t++; s.pt++; if (s.pt > 30 && okKey() || s.pt > 60 * 9) { s.page++; s.pt = 0; snd.move(); if (s.page >= s.lines.length) go('staff'); } },
        draw(s) {
          s.st.draw(g, 128, s.t / 60, 2);
          g.fillStyle = 'rgba(0,0,20,.25)'; g.fillRect(0, 0, W, H);
          const f = body(s.C, run.alt, 1.4, 'win'); drawBody(f, 128, 200, false);
          panel(8, 8, 240, 58, 0.86); const l = s.lines[Math.min(s.page, s.lines.length - 1)], n = Math.floor(s.pt * 1.2); wrap(l.slice(0, n), 38).forEach((x, i) => txt(x, 16, 16 + i * 11, '#ffffff'));
          if (s.pt > 30 && (s.t >> 4) & 1) rtxt('>', 240, 55, '#ffe060');
        }
      };
      SCN.staff = {
        update(s) { s.t++; if (s.t > STAFF.length * 14 * 2 + 400 || (s.t > 200 && K.pressed('start'))) { const sc = Math.min(50000, run.score); const fin = () => finishGo('WORLD SCRAPPER!', CHI[run.c].name + ' beat the Baron! Champion!'); if (qualifies(sc)) go('entry', { sc, after: fin }); else go('hiscores', { after: fin }); } },
        draw(s) {
          g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
          for (let i = 0; i < 50; i++) { const x = (i * 97) % W, y = (i * 61 + s.t * (0.3 + (i % 4) * 0.2)) % H; g.fillStyle = i % 4 ? '#3a3a5a' : '#c8c8ff'; g.fillRect(x, y, 1, 1); }
          const y0 = H - s.t / 2;
          STAFF.forEach((l, i) => { const y = y0 + i * 14; if (y > -10 && y < H) ctr(l, y, i === 0 || STAFF[i - 1] === '' ? '#ffe060' : '#ffffff'); });
          const endY = y0 + STAFF.length * 14 + 40; if (endY < 140) { bigC('THE END', 'gold', Math.max(70, endY), { k: 4 }); ctr('YOU ARE THE WORLD SCRAPPER!', Math.max(70, endY) + 46, '#9ad0ff'); ctr('FINAL SCORE ' + fmt(run.score), Math.max(70, endY) + 60, '#ffffff'); }
        }
      };
      go('title');
      // ---------------------------------------------------------- debug handle for tests
      K.dbg = {
        get scene() { return S && S.n; }, get fight() { return fight; }, get run() { return run; }, get save() { return SV; },
        go: (n, o) => go(n, o), arcade(c, i) { newRun(CHI[c || 'kenji'], false); run.i = i || 0; nextArcade(); },
        ko(p) { if (fight) { const F = p ? fight.P2 : fight.P1; F.hp = 1; } },
        win() { this.kill(fight && fight.P2); }, lose() { this.kill(fight && fight.P1); },
        kill(O) { if (!O || !fight || fight.state !== 'fight') return; O.hp = 0; O.dmgTaken = (O.dmgTaken || 0) + 1; if (O.fridge) return; fight.kod = O; fight.set(O, 'fall'); O.vy = -4; O.vx = -O.face * 2; O.anim = 'fall'; O.bounce = 1; },
        vs(a, b, stg, mode) { const A = CHI[a], B = CHI[b]; go('vs', { pm: prepMatch({ a: A, b: B, bAlt: A === B, stage: stg || B.stage, mode: mode || 'training', lvl: 0.5, next() { go('title'); } }), train: 1 }); },
        sp(side, id, s) { if (fight) fight.startSpecial(side ? fight.P2 : fight.P1, SP[id], s || 0); },
        pose(side, st, anim, fi) { if (fight) { const F = side ? fight.P2 : fight.P1; fight.set(F, st); F.anim = anim; F.fi = fi || 0; } },
      };
      return {
        update() { const sc = SCN[S.n]; if (sc.update) sc.update(S); },
        draw() { g.imageSmoothingEnabled = false; const sc = SCN[S.n]; sc.draw(S); },
        end() { K.music(null); fight = null; },
      };
    },
  });
})();

/* jw-art: JACKWORLD's drawings. Everything is original pixel art made by code: a tiny software rasteriser draws
 * isometric boxes, cylinders, balls and panels pixel by pixel (no blurry edges), then every sprite gets a dark outline,
 * so furni, people and rooms all look like they came out of the same 1999 paint program.
 *   JWArt.furni(f, rot, st, frame) -> sprite {c (canvas), w, h, ox, oy, a (alpha bytes for clicks), glow}
 *   JWArt.wallItem(f, wall, st, frame) -> sprite                JWArt.avatar(av, pose, dir, frame, wear) -> sprite
 *   JWArt.room(scene) -> {c, ox, oy, W, H, wallH}  the still part of a room (backdrop, walls, floor)
 *   JWArt.thumb(id) -> dataURL for catalogue pictures and the Treasure Chest          JWArt.head(av) -> small head dataURL
 * Sprite coordinates: world (x, y in tiles, z in pixels up) -> sprite pixel (ox + (x - y) * 16, oy + (x + y) * 8 - z). */
(function () {
  'use strict';
  if (window.JWArt) return;
  const C = window.JWCat; if (!C) return;
  const TW = 16, TH = 8; // half a tile, in pixels

  // ================================================================ colours
  const hexc = {};
  function rgb(c) {
    if (Array.isArray(c)) return c;
    let v = hexc[c]; if (v) return v;
    let s = String(c).replace('#', ''); if (s.length === 3) s = s.replace(/./g, ch => ch + ch);
    const n = parseInt(s.slice(0, 6), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255, s.length === 8 ? parseInt(s.slice(6), 16) : 255];
    return (hexc[c] = v);
  }
  // tone: t > 0 towards a warm white, t < 0 towards a deep blue-purple (pixel-art shading, never plain grey)
  function tone(c, t) {
    const [r, g, b, a] = rgb(c);
    if (t >= 0) return [r + (255 - r) * t, g + (250 - g) * t, b + (232 - b) * t, a].map(Math.round);
    t = -t; return [r + (26 - r) * t, g + (16 - g) * t, b + (48 - b) * t, a].map(Math.round);
  }
  const mix = (a, b, t) => { a = rgb(a); b = rgb(b); return [0, 1, 2, 3].map(i => Math.round(a[i] + (b[i] - a[i]) * t)); };
  const alpha = (c, al) => { const v = rgb(c).slice(); v[3] = Math.round(al * 255); return v; };
  const hsh = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + (c || 0) * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  // ================================================================ the rasteriser
  function Buf(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  Buf.prototype.pset = function (x, y, c) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const d = this.d, i = (y * this.w + x) * 4, a = c[3] === undefined ? 255 : c[3];
    if (a >= 255) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
    if (a <= 0) return;
    const k = a / 255, da = d[i + 3] / 255, oa = k + da * (1 - k);
    d[i] = (c[0] * k + d[i] * da * (1 - k)) / oa; d[i + 1] = (c[1] * k + d[i + 1] * da * (1 - k)) / oa; d[i + 2] = (c[2] * k + d[i + 2] * da * (1 - k)) / oa; d[i + 3] = oa * 255;
  };
  Buf.prototype.rect = function (x, y, w, h, c) { c = rgb(c); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.pset(i, j, c); };
  // fill a polygon, sampling each pixel's centre (crisp: adjacent faces share edges with no gaps). col: colour or fn(px, py)
  Buf.prototype.poly = function (pts, col) {
    let y0 = 1e9, y1 = -1e9; for (const p of pts) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(this.h - 1, Math.ceil(y1));
    const fn = typeof col === 'function', cc = fn ? null : rgb(col), n = pts.length, xs = [];
    for (let y = y0; y <= y1; y++) {
      const yc = y + 0.5; xs.length = 0;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, Math.ceil(xs[k] - 0.5)), xb = Math.min(this.w, Math.ceil(xs[k + 1] - 0.5));
        for (let x = xa; x < xb; x++) { const c = fn ? col(x + 0.5, yc) : cc; if (c) this.pset(x, y, fn ? rgb(c) : c); }
      }
    }
  };
  Buf.prototype.ell = function (cx, cy, rx, ry, col) {
    const fn = typeof col === 'function', cc = fn ? null : rgb(col);
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v <= 1) { const c = fn ? col(u, v) : cc; if (c) this.pset(x, y, fn ? rgb(c) : c); }
    }
  };
  Buf.prototype.line = function (x0, y0, x1, y1, col) {
    const c = rgb(col); x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (let i = 0; i < 400; i++) { this.pset(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  };
  // a dark outline round everything solid (Habbo-ish, but our own): transparent pixels touching a solid one take its darkest tone
  Buf.prototype.outline = function (k) {
    const { w, h, d } = this, src = new Uint8ClampedArray(d), solid = i => src[i + 3] > 200;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4; if (src[i + 3] > 200) continue;
      let n = -1;
      if (x > 0 && solid(i - 4)) n = i - 4; else if (x < w - 1 && solid(i + 4)) n = i + 4; else if (y > 0 && solid(i - w * 4)) n = i - w * 4; else if (y < h - 1 && solid(i + w * 4)) n = i + w * 4;
      if (n < 0) continue;
      const t = tone([src[n], src[n + 1], src[n + 2]], -(k || 0.72));
      d[i] = t[0]; d[i + 1] = t[1]; d[i + 2] = t[2]; d[i + 3] = 255;
    }
  };
  Buf.prototype.canvas = function () {
    const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
    if (this.w && this.h) c.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
    return c;
  };

  // ================================================================ a 3x5 pixel font for signs and scoreboards
  const FONT = {};
  ('A:111101111101101 B:110101110101110 C:111100100100111 D:110101101101110 E:111100110100111 F:111100110100100 G:111100101101111 H:101101111101101 I:111010010010111 J:001001001101111 K:101101110101101 L:100100100100111 M:101111111101101 N:111101101101101 O:111101101101111 P:111101111100100 Q:111101101111001 R:111101110101101 S:111100111001111 T:111010010010010 U:101101101101111 V:101101101101010 W:101101111111101 X:101101010101101 Y:101101010010010 Z:111001010100111 ' +
    '0:111101101101111 1:010110010010111 2:111001111100111 3:111001111001111 4:101101111001001 5:111100111001111 6:111100111101111 7:111001001010010 8:111101111101111 9:111101111001111 !:010010010000010 ?:111001011000010 -:000000111000000 .:000000000000010 ::000010000010000 \':010010000000000 /:001001010100100 +:000010111010000')
    .split(' ').forEach(s => { const k = s[0]; FONT[k] = s.slice(2); });
  function text(B, str, x, y, col, scale) {
    const c = rgb(col), s = scale || 1;
    for (const ch of String(str).toUpperCase()) { const g = FONT[ch]; if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) B.pset(x + (i % 3) * s + a, y + ((i / 3) | 0) * s + b, c); x += 4 * s; }
  }
  const textW = (str, s) => String(str).length * 4 * (s || 1) - (s || 1);

  // ================================================================ the painter: world-ish primitives on a sprite
  // flip mirrors x <-> y (rotation 1, and things hung on the left wall). Faces are lit by where they point on screen.
  function Painter(B, ox, oy, flip) {
    const P = (x, y, z) => (flip ? [ox + (y - x) * TW, oy + (x + y) * TH - z] : [ox + (x - y) * TW, oy + (x + y) * TH - z]);
    const SH = { top: 0.16, l: 0, r: -0.22 };
    const pt = (x, y, z) => P(x, y, z);
    const self = {
      B, P: pt, flip,
      // a box: top, and the two faces that point at you. o: {top, l, r} colour overrides, e: draw light front edges
      box(x, y, z, w, d, h, col, o) {
        o = o || {};
        const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
        const fy = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)]; // local +y face
        const fx = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)]; // local +x face
        const cy = o[flip ? 'r' : 'l'] || tone(col, flip ? SH.r : SH.l), cx = o[flip ? 'l' : 'r'] || tone(col, flip ? SH.l : SH.r);
        if (h > 0) { B.poly(fy, flip ? cy : cy); B.poly(fx, cx); }
        B.poly(top, o.top || tone(col, SH.top));
        if (o.e !== 0 && h > 1) { // a light edge along the front of the lid
          const ec = tone(o.top || tone(col, SH.top), 0.35), a = P(x, y + d, z + h), b = P(x + w, y + d, z + h), c = P(x + w, y, z + h);
          B.line(a[0], a[1] - 0.5, b[0] - (flip ? 0 : 1), b[1] - 0.5, ec); B.line(b[0], b[1] - 0.5, c[0] - (flip ? 1 : 0), c[1] - 0.5, ec);
        }
      },
      // a flat panel on a face: plane y = Y (from x0..x1, z0..z1), plane x = X, or flat at height Z. col may be fn(u, v)
      fy(Y, x0, x1, z0, z1, col) { B.poly([P(x0, Y, z0), P(x1, Y, z0), P(x1, Y, z1), P(x0, Y, z1)], shadeFn(col, flip ? SH.r : SH.l, flip ? 'fx' : 'fy')); },
      fx(X, y0, y1, z0, z1, col) { B.poly([P(X, y0, z0), P(X, y1, z0), P(X, y1, z1), P(X, y0, z1)], shadeFn(col, flip ? SH.l : SH.r, 'fx')); },
      fz(Z, x0, y0, x1, y1, col) { B.poly([P(x0, y0, Z), P(x1, y0, Z), P(x1, y1, Z), P(x0, y1, Z)], col); },
      // a cylinder standing up (r in tiles). Shaded in bands across its face.
      cyl(cx, cy, z, r, h, col, o) {
        o = o || {};
        const c0 = P(cx, cy, z), rx = r * TW * 1.414, ry = r * TH * 1.414, base = rgb(col);
        const band = u => tone(base, u < -0.55 ? 0.2 : u < -0.1 ? 0.06 : u < 0.45 ? -0.1 : -0.3);
        B.ell(c0[0], c0[1], rx, ry, (u, v) => (v > 0 ? band(u) : null));
        B.rect(Math.round(c0[0] - rx), Math.round(c0[1] - h), 0, 0, col);
        for (let x = Math.ceil(c0[0] - rx - 0.5); x < Math.ceil(c0[0] + rx - 0.5); x++) { const u = (x + 0.5 - c0[0]) / rx; const c = rgb(band(u)); for (let y = Math.round(c0[1] - h); y < Math.round(c0[1]); y++) B.pset(x, y, c); }
        B.ell(c0[0], c0[1] - h, rx, ry, o.top || tone(col, SH.top + 0.05));
      },
      // a ball (r in pixels), lit from the top left
      ball(cx, cy, z, r, col, sh) {
        const c0 = P(cx, cy, z + r);
        B.ell(c0[0], c0[1], r, r, (u, v) => { const l = (u + 0.45) * (u + 0.45) + (v + 0.5) * (v + 0.5); return tone(col, l < 0.12 ? 0.45 : l < 0.5 ? 0.12 : l < 1.3 ? -0.08 : -0.3); });
        if (sh !== 0) { const s = P(cx, cy, z); B.pset(s[0], s[1], [0, 0, 0, 0]); }
      },
      disc(cx, cy, z, r, col) { const c0 = P(cx, cy, z); B.ell(c0[0], c0[1], r * TW * 1.414, r * TH * 1.414, col); },
      shadow(cx, cy, r) { const c0 = P(cx, cy, 0); B.ell(c0[0], c0[1], r * TW * 1.414, r * TH * 1.414, [20, 10, 40, 70]); },
      line(x0, y0, z0, x1, y1, z1, col) { const a = P(x0, y0, z0), b = P(x1, y1, z1); B.line(a[0], a[1], b[0], b[1], col); },
      dot(x, y, z, col, s) { const a = P(x, y, z); if (s > 1) B.rect(Math.round(a[0]) - (s >> 1), Math.round(a[1]) - (s >> 1), s, s, col); else B.pset(a[0], a[1], rgb(col)); },
      // a sheared pixel picture flat on a face: column i, row j (from the top) -> fn(i, j) colour or null.
      // face 'y' = plane y = at, running along x from u0; face 'x' = plane x = at, along y. z1 = height of the top edge.
      decal(face, at, u0, z1, cols, rows, fn) {
        const a = face === 'y' ? P(u0, at, z1) : P(at, u0, z1), b = face === 'y' ? P(u0 + 1, at, z1) : P(at, u0 + 1, z1);
        const sx = Math.sign(b[0] - a[0]) || 1, k = (b[1] - a[1]) / Math.abs(b[0] - a[0] || 1);
        const sh = face === 'y' ? (flip ? SH.r : SH.l) : (flip ? SH.l : SH.r);
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const c = fn(sx < 0 ? cols - 1 - i : i, j); if (c) B.pset(Math.round(a[0]) + sx * i, Math.round(a[1] + k * i) + j, rgb(tone(c, sh * 0.5))); }
      },
      // pixel text on a face (plane y = Y or x = X), centred at u (along), baseline z
      txt(face, at, u, z, str, col, s) { // sheared onto the face, so it lies flat on it like a printed label
        const p = face === 'y' ? P(u, at, z) : P(at, u, z), q = face === 'y' ? P(u + 0.5, at, z) : P(at, u + 0.5, z);
        const k = (q[1] - p[1]) / ((q[0] - p[0]) || 1), w = textW(str, s), sc = s || 1, c = rgb(col);
        const x0 = Math.round(p[0] - w / 2), y0 = p[1] - 5 * sc - k * (w / 2);
        let x = x0;
        for (const ch of String(str).toUpperCase()) { const g = FONT[ch]; if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) { const px = x + (i % 3) * sc + a; B.pset(px, Math.round(y0 + k * (px - x0)) + ((i / 3) | 0) * sc + b, c); } x += 4 * sc; }
      },
    };
    // a colour function on a face gets local (u, v) for patterns; plain colours are shaded by the face direction
    function shadeFn(col, sh, face) {
      if (typeof col !== 'function') return tone(col, sh);
      return (px, py) => {
        // undo the projection for this plane to hand back (u = along, v = height)
        const sx = px - ox, sy = py - oy;
        return col(sx, sy, face);
      };
    }
    return self;
  }

  // ================================================================ sprites + their cache
  const CACHE = new Map(); let cacheN = 0;
  function sprite(key, w, h, ox, oy, flip, draw, o) {
    let s = CACHE.get(key); if (s) return s;
    const B = new Buf(w, h), p = Painter(B, ox, oy, flip);
    const meta = draw(p, B) || {};
    if (!(o && o.noOutline)) B.outline(o && o.ol);
    s = { c: B.canvas(), w, h, ox, oy, a: B.d, glow: meta.glow || null, seat: meta.seat || 0 };
    CACHE.set(key, s); if (++cacheN > 1800) { CACHE.clear(); cacheN = 0; }
    return s;
  }
  const hit = (s, x, y) => { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < s.w && y < s.h && s.a[(y * s.w + x) * 4 + 3] > 100; };

  // furniture: rot 0 faces +y (bottom left of the screen), rot 1 faces +x (bottom right)
  function furni(f, rot, st, frame) {
    const A = ART[f.art[0]] || ART.crate, fl = !!rot, w = fl ? f.d : f.w, d = fl ? f.w : f.d, hm = (f.h || 44) + 8;
    const fr = f.anim ? (frame | 0) % 8 : 0;
    const key = `${f.id}|${rot ? 1 : 0}|${st | 0}|${fr}`;
    return sprite(key, (w + d) * TW + 12, (w + d) * TH + hm + 10, d * TW + 6, hm + 4, fl, p => A(p, f.art, f.w, f.d, st | 0, fr, f), f.k === 'r' ? { ol: 0.5 } : null);
  }
  // wall things: drawn in the wall's own plane (x along the wall, y sticking out, z up). Left wall = mirrored.
  function wallItem(f, wall, st, frame) {
    const A = ART[f.art[0]] || ART.poster, fl = wall === 'L', fr = f.anim ? (frame | 0) % 8 : 0;
    const key = `${f.id}|w${wall}|${st | 0}|${fr}`, w = f.w, hm = 80;
    return sprite(key, (w + 1) * TW + 12, (w + 1) * TH + hm + 10, (fl ? w : 1) * TW + 6, hm + 4, fl, p => A(p, f.art, f.w, 1, st | 0, fr, f), null);
  }

  // ================================================================ furniture drawings: ART[name](p, art, w, d, st, frame, f)
  const ART = {};
  const WOOD = '#a0703a';
  const legs4 = (p, x0, y0, x1, y1, h, col, t) => { t = t || 0.12; for (const [x, y] of [[x0, y0], [x1 - t, y0], [x0, y1 - t], [x1 - t, y1 - t]]) p.box(x, y, 0, t, t, h, col, { e: 0 }); };

  // ---- bits & bobs
  ART.crate = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.box(0.08, 0.08, 0, 0.84, 0.84, 20, a[1]); const c = tone(a[1], -0.35); p.fy(0.92, 0.12, 0.88, 6, 7, c); p.fy(0.92, 0.12, 0.88, 13, 14, c); p.fx(0.92, 0.12, 0.88, 6, 7, c); p.fx(0.92, 0.12, 0.88, 13, 14, c); p.line(0.1, 0.92, 2, 0.9, 0.92, 18, c); };
  ART.crate2 = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.box(0.08, 0.08, 0, 0.84, 0.84, 18, a[1]); p.box(0.16, 0.12, 18, 0.7, 0.7, 16, tone(a[1], 0.08)); const c = tone(a[1], -0.35); p.fy(0.92, 0.12, 0.88, 8, 9, c); p.fy(0.82, 0.2, 0.82, 25, 26, c); p.txt('y', 0.92, 0.5, 15, 'FRAGILE', [180, 40, 30], 1); };
  ART.cushion = (p, a) => { p.shadow(0.5, 0.5, 0.42); p.box(0.12, 0.12, 0, 0.76, 0.76, 7, a[1]); p.box(0.2, 0.2, 7, 0.6, 0.6, 1, tone(a[1], 0.1), { e: 0 }); p.dot(0.5, 0.5, 8, tone(a[1], -0.3)); return { seat: 6 }; };
  ART.beanbag = (p, a) => { p.shadow(0.5, 0.5, 0.48); p.ball(0.5, 0.55, -6, 15, a[1], 0); p.ball(0.45, 0.3, 6, 10, tone(a[1], 0.05), 0); return { seat: 8 }; };
  ART.stool = (p, a) => { p.shadow(0.5, 0.5, 0.3); p.cyl(0.5, 0.5, 0, 0.06, 22, '#9aa4b0'); p.disc(0.5, 0.5, 4, 0.22, '#7a8490'); p.cyl(0.5, 0.5, 22, 0.26, 5, a[1]); return { seat: 22 }; };
  ART.plant = (p, a) => { p.shadow(0.5, 0.5, 0.35); p.cyl(0.5, 0.5, 0, 0.22, 12, '#c8643a'); p.cyl(0.5, 0.5, 11, 0.24, 2, '#a8502a'); p.disc(0.5, 0.5, 13, 0.18, '#4a2a10'); p.line(0.5, 0.5, 13, 0.5, 0.5, 30, '#5a3a1a'); const g = a[1]; const L = [[0.25, 0.5, 18, 5], [0.75, 0.45, 20, 5], [0.45, 0.25, 22, 5], [0.55, 0.75, 19, 5], [0.3, 0.3, 27, 5], [0.7, 0.68, 27, 5], [0.62, 0.3, 31, 4], [0.38, 0.65, 32, 4], [0.5, 0.5, 36, 4]]; L.forEach(([x, y, z, r], i) => { const c = p.P(x, y, z); p.B.ell(c[0], c[1], r + 1.5, r * 0.75, (u, v) => tone(g, u + v < -0.6 ? 0.28 : v > 0.35 ? -0.2 : (i % 2 ? 0.05 : -0.05))); p.B.pset(c[0] - 1, c[1] - 1, rgb(tone(g, 0.45))); }); };
  ART.cactus = (p, a) => { p.shadow(0.5, 0.5, 0.3); p.cyl(0.5, 0.5, 0, 0.2, 10, '#c8643a'); p.cyl(0.5, 0.5, 10, 0.1, 22, a[1]); p.cyl(0.36, 0.5, 18, 0.06, 8, a[1]); p.cyl(0.64, 0.5, 22, 0.06, 7, a[1]); p.dot(0.5, 0.5, 33, '#ef6fb0', 2); };
  ART.bin = (p, a) => { p.shadow(0.5, 0.5, 0.32); p.cyl(0.5, 0.5, 0, 0.24, 20, a[1]); p.cyl(0.5, 0.5, 20, 0.26, 3, tone(a[1], 0.1)); p.ball(0.5, 0.5, 21, 3, '#eeeae0', 0); };
  ART.rug = (p, a, w, d) => { p.fz(0, 0.08, 0.08, w - 0.08, d - 0.08, tone(a[1], -0.1)); p.fz(0, 0.18, 0.18, w - 0.18, d - 0.18, a[1]); p.fz(0, 0.36, 0.36, w - 0.36, d - 0.36, (x, y) => (hsh(x | 0, y | 0) < 0.5 ? tone(a[1], 0.15) : tone(a[1], 0.05))); p.fz(0, 0.6, 0.6, w - 0.6, d - 0.6, tone(a[1], -0.2)); };
  ART.lamp = (p, a, w, d, st) => { p.shadow(0.5, 0.5, 0.3); p.disc(0.5, 0.5, 0, 0.2, '#5a5a62'); p.cyl(0.5, 0.5, 1, 0.04, 34, '#7a7a82'); p.cyl(0.5, 0.5, 30, 0.22, 12, st ? '#fff4b0' : a[1]); if (st) return { glow: [0.5, 0.5, 34, '#ffe9a0', 70] }; };
  ART.comics = (p, a) => { p.shadow(0.5, 0.5, 0.38); const cs = [a[1], '#3266d6', '#f2c22e', '#3fa34a', '#eeeae0', '#ef6fb0', '#f08a24']; for (let i = 0; i < 9; i++) { p.box(0.2 + (i % 2) * 0.05 - (i % 3) * 0.02, 0.22 - (i % 3) * 0.03, i * 1.6, 0.6, 0.5, 1.6, cs[i % 7], { e: 0 }); } p.fz(14.5, 0.3, 0.3, 0.7, 0.62, '#ffffff'); p.fz(14.6, 0.34, 0.34, 0.66, 0.42, a[1]); p.dot(0.55, 0.52, 15, '#f2c22e', 2); };
  ART.boxes = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.box(0.05, 0.1, 0, 0.6, 0.6, 14, a[1]); p.box(0.45, 0.4, 0, 0.5, 0.5, 12, tone(a[1], -0.05)); p.box(0.1, 0.15, 14, 0.5, 0.5, 11, tone(a[1], 0.06)); p.fz(25.01, 0.1, 0.38, 0.6, 0.42, tone(a[1], -0.3)); };

  // ---- bedroom
  ART.bed = (p, a) => { p.shadow(0.5, 1, 0.7); p.box(0.05, 0.05, 0, 0.9, 1.9, 8, WOOD); p.box(0.05, 0.02, 0, 0.9, 0.12, 24, tone(WOOD, -0.08)); p.box(0.1, 0.12, 8, 0.8, 1.78, 5, '#f4f0e8'); p.box(0.18, 0.18, 13, 0.64, 0.36, 4, '#ffffff'); p.box(0.08, 0.55, 13, 0.84, 1.37, 3, a[1]); p.fz(16.01, 0.08, 0.9, 0.92, 1.0, tone(a[1], 0.3)); p.fz(16.01, 0.08, 1.3, 0.92, 1.4, tone(a[1], 0.3)); return { seat: 14 }; };
  ART.bunk = (p, a) => { p.shadow(0.5, 1, 0.7); const W = tone(WOOD, 0.05); for (const [x, y] of [[0.05, 0.05], [0.85, 0.05], [0.05, 1.85], [0.85, 1.85]]) p.box(x, y, 0, 0.1, 0.1, 50, W, { e: 0 }); p.box(0.1, 0.1, 6, 0.8, 1.8, 4, '#f4f0e8'); p.box(0.1, 0.5, 10, 0.8, 1.4, 3, a[1]); p.box(0.1, 0.1, 32, 0.8, 1.8, 4, '#f4f0e8'); p.box(0.1, 0.5, 36, 0.8, 1.4, 3, tone(a[1], -0.2)); p.box(0.05, 0.1, 44, 0.1, 1.8, 2, W); for (let i = 0; i < 4; i++) p.box(0.85, 1.3 + 0, 8 + i * 8, 0.1, 0.5, 1.5, W, { e: 0 }); return { seat: 10 }; };
  ART.wardrobe = (p, a) => { p.shadow(0.5, 0.5, 0.48); p.box(0.08, 0.15, 0, 0.84, 0.7, 50, a[1]); p.fy(0.85, 0.48, 0.52, 2, 48, tone(a[1], -0.4)); p.dot(0.42, 0.85, 26, '#f2c22e'); p.dot(0.58, 0.85, 26, '#f2c22e'); p.fy(0.85, 0.12, 0.88, 47, 48, tone(a[1], 0.2)); };
  ART.desk = (p, a, w) => { p.shadow(1, 0.5, 0.7); legs4(p, 0.05, 0.1, 1.95, 0.9, 16, tone(a[1], -0.1)); p.box(1.3, 0.1, 0, 0.6, 0.8, 16, a[1]); p.fy(0.9, 1.35, 1.85, 5, 6, tone(a[1], -0.4)); p.fy(0.9, 1.35, 1.85, 11, 12, tone(a[1], -0.4)); p.box(0.02, 0.05, 16, 1.96, 0.9, 3, a[1]); p.box(0.3, 0.3, 19, 0.4, 0.3, 1, '#eeeae0', { e: 0 }); p.box(0.75, 0.25, 19, 0.35, 0.3, 4, '#3266d6', { e: 0 }); p.cyl(1.6, 0.4, 19, 0.06, 6, '#d8342c'); };
  ART.pcdesk = (p, a, w, d, st, fr) => {
    p.shadow(1, 0.5, 0.75); legs4(p, 0.05, 0.1, 1.95, 0.9, 16, tone(a[1], -0.2)); p.box(0.02, 0.05, 16, 1.96, 0.9, 3, a[1]);
    p.box(0.25, 0.15, 19, 0.6, 0.55, 18, '#d8d0c0'); p.box(0.3, 0.68, 19, 0.5, 0.06, 1, '#d8d0c0'); p.fy(0.7, 0.32, 0.78, 23, 35, '#2a2a3a'); if (st) p.fy(0.7, 0.34, 0.76, 24, 34, (fr & 2) ? '#3a8ac8' : '#2a7ab8');
    if (st) { p.fy(0.7, 0.36, 0.5, 31, 32, '#ffffff'); p.fy(0.7, 0.36, 0.62, 28, 29, '#dddddd'); } p.box(1.1, 0.2, 19, 0.35, 0.6, 26, '#d8d0c0'); p.fy(0.8, 1.15, 1.4, 38, 39, '#3a3a44'); p.dot(1.2, 0.8, 23, st ? '#3fe04a' : '#2a6a2a');
    p.box(0.3, 0.72, 19, 0.6, 0.15, 1, '#eeeae0', { e: 0 }); return st ? { glow: [0.55, 0.7, 30, '#7ac0ff', 40] } : null;
  };
  ART.drawers = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.box(0.1, 0.15, 0, 0.8, 0.7, 30, a[1]); for (let i = 0; i < 3; i++) { p.fy(0.85, 0.15, 0.85, 3 + i * 9, 4 + i * 9, tone(a[1], -0.4)); p.dot(0.5, 0.85, 8 + i * 9, '#f2c22e'); } p.box(0.6, 0.3, 30, 0.2, 0.2, 7, '#eeeae0'); };
  ART.bedside = (p, a) => { p.shadow(0.5, 0.5, 0.35); p.box(0.2, 0.2, 0, 0.6, 0.6, 18, a[1]); p.fy(0.8, 0.25, 0.75, 10, 11, tone(a[1], -0.4)); p.box(0.35, 0.35, 18, 0.3, 0.2, 7, '#d8342c'); p.fy(0.55, 0.4, 0.6, 20, 24, '#1a1a1a'); p.txt('y', 0.55, 0.5, 20, '7', '#ff4a3a'); };
  ART.chair = (p, a) => { p.shadow(0.5, 0.5, 0.3); p.cyl(0.5, 0.5, 0, 0.05, 12, '#5a5a62'); p.disc(0.5, 0.5, 1, 0.25, '#3a3a44'); p.box(0.25, 0.25, 12, 0.5, 0.5, 4, a[1]); p.box(0.25, 0.18, 16, 0.5, 0.1, 16, a[1]); return { seat: 15 }; };
  ART.laundry = (p) => { p.shadow(0.5, 0.5, 0.4); p.ball(0.45, 0.5, -3, 11, '#7aa0e0', 0); p.ball(0.6, 0.45, 2, 7, '#eeeae0', 0); p.ball(0.35, 0.4, 3, 6, '#d8342c', 0); p.box(0.55, 0.62, 0, 0.3, 0.12, 1, '#2a2a30', { e: 0 }); };
  ART.goldfish = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.3); p.box(0.3, 0.3, 0, 0.4, 0.4, 10, WOOD); const c0 = p.P(0.5, 0.5, 20); p.B.ell(c0[0], c0[1], 10, 9, (u, v) => (v < -0.6 ? null : u * u + v * v > 0.7 ? [200, 230, 255, 180] : [120, 190, 240, 160])); const fx = c0[0] - 4 + ((fr % 8) < 4 ? fr % 4 : 4 - fr % 4) * 2; p.B.rect(fx, c0[1], 4, 2, a[1]); p.B.pset(fx + (fr % 8 < 4 ? 4 : -1), c0[1], rgb(a[1])); };
  ART.telly = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.4); p.box(0.15, 0.2, 0, 0.7, 0.6, 20, a[1]); p.fy(0.8, 0.2, 0.7, 4, 17, '#1a1a22'); tvScreen(p, 0.8, 0.22, 0.68, 5, 16, st, fr); p.line(0.4, 0.4, 20, 0.2, 0.3, 36, '#9aa4b0'); p.line(0.6, 0.4, 20, 0.8, 0.2, 34, '#9aa4b0'); p.dot(0.76, 0.8, 8, '#d8342c'); return st ? { glow: [0.5, 0.8, 10, '#a0c8ff', 36] } : null; };
  function tvScreen(p, Y, x0, x1, z0, z1, st, fr) {
    if (!st) { p.fy(Y, x0, x1, z0, z1, '#2a3a3a'); p.fy(Y, x0 + 0.04, x0 + 0.12, z1 - 4, z1 - 2, '#5a7070'); return; }
    const ch = st % 4;
    if (ch === 1) p.fy(Y, x0, x1, z0, z1, (sx, sy) => (hsh(sx | 0, sy | 0, fr) < 0.5 ? '#dde' : '#778'));
    else if (ch === 2) { const bars = ['#eeeeee', '#f2e22e', '#2ae0e0', '#2ae02a', '#e02ae0', '#e02a2a', '#2a2ae0']; const n = bars.length, dx = (x1 - x0) / n; for (let i = 0; i < n; i++) p.fy(Y, x0 + i * dx, x0 + (i + 1) * dx, z0, z1, bars[i]); }
    else if (ch === 3) { p.fy(Y, x0, x1, z0, z1, '#3a8a3a'); p.fy(Y, x0, x1, z0, z0 + 3, '#4aa04a'); const bx = x0 + 0.1 + ((fr % 8) / 8) * (x1 - x0 - 0.2); p.fy(Y, bx, bx + 0.05, z0 + 3 + (fr % 3), z0 + 5 + (fr % 3), '#ffffff'); }
    else { p.fy(Y, x0, x1, z0, z1, '#2a5ac8'); p.fy(Y, x0, x1, z0, z0 + (z1 - z0) * 0.4, '#3fa34a'); p.fy(Y, x0 + (x1 - x0) * 0.6, x0 + (x1 - x0) * 0.75, z1 - 4, z1 - 2, '#f2e22e'); }
  }
  // ---- gamer's den
  ART.crt = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.48); p.box(0.15, 0.2, 0, 0.7, 0.6, 12, '#3a3a44'); p.fy(0.8, 0.2, 0.8, 4, 9, '#2a2a30'); p.box(0.05, 0.15, 12, 0.9, 0.7, 30, a[1]); p.fy(0.85, 0.1, 0.9, 14, 40, '#141418'); tvScreen(p, 0.85, 0.13, 0.87, 16, 39, st, fr); p.fy(0.85, 0.75, 0.8, 13, 14, '#3fe04a'); return st ? { glow: [0.5, 0.9, 26, '#a0c8ff', 46] } : null; };
  ART.arcade = (p, a, w, d, st, fr) => {
    p.shadow(0.5, 0.5, 0.48); p.box(0.12, 0.2, 0, 0.76, 0.65, 26, a[1]); p.box(0.12, 0.2, 26, 0.76, 0.5, 22, a[1]); p.box(0.12, 0.15, 48, 0.76, 0.6, 8, tone(a[1], 0.1));
    p.box(0.15, 0.7, 24, 0.7, 0.18, 3, '#2a2a30'); p.dot(0.35, 0.82, 28, '#d8342c', 2); p.dot(0.6, 0.8, 27, '#f2c22e'); p.dot(0.7, 0.8, 27, '#3266d6');
    p.fy(0.7, 0.18, 0.82, 29, 46, '#0a0a14'); const cols = ['#ff3a6a', '#3ae0ff', '#f2e22e', '#7aff4a'];
    for (let i = 0; i < 5; i++) { const x = 0.25 + ((i * 0.13 + fr * 0.04) % 0.5); p.fy(0.7, x, x + 0.05, 33 + (i * 3 + fr) % 10, 35 + (i * 3 + fr) % 10, cols[(i + fr) % 4]); }
    p.fy(0.75, 0.16, 0.84, 49, 55, (fr & 4) ? '#ffe46a' : '#ffd02a'); p.txt('y', 0.75, 0.5, 49, 'ARCADE', '#d8342c'); p.fy(0.85, 0.4, 0.6, 8, 14, '#2a2a30'); p.dot(0.5, 0.85, 11, '#f2c22e');
    return { glow: [0.5, 0.75, 38, cols[fr % 4], 34] };
  };
  ART.pinball = (p, a, w, d, st, fr) => { p.shadow(1, 0.5, 0.7); legs4(p, 0.15, 0.15, 1.85, 0.85, 14, '#2a2a30'); p.box(0.1, 0.1, 14, 1.8, 0.8, 8, a[1]); p.fz(22.01, 0.2, 0.18, 1.7, 0.82, '#1a2a6a'); for (let i = 0; i < 4; i++) p.dot(0.5 + i * 0.3, 0.35 + (i % 2) * 0.3, 23, ['#ff3a6a', '#f2e22e', '#3ae0ff', '#7aff4a'][(i + fr) % 4], 2); p.dot(0.4 + (fr % 8) * 0.15, 0.5, 23, '#ffffff', 2); p.box(1.6, 0.1, 22, 0.3, 0.8, 26, tone(a[1], -0.1)); p.fx(1.9, 0.15, 0.85, 30, 46, '#0a0a14'); p.fx(1.9, 0.2, 0.8, 36, 42, (fr & 2) ? '#ff3a6a' : '#f2c22e'); };
  ART.gamechair = (p, a) => { // a floor rocker: low seat, tilted back with speakers in it
    p.shadow(0.5, 0.5, 0.42); const c = a[1];
    p.box(0.15, 0.4, 0, 0.7, 0.48, 5, c);
    const B = p.B, Q = (x, y, z) => p.P(x, y, z);
    B.poly([Q(0.15, 0.4, 5), Q(0.85, 0.4, 5), Q(0.85, 0.12, 30), Q(0.15, 0.12, 30)], tone(c, 0.06));                 // the tilted back (front face)
    B.poly([Q(0.85, 0.4, 0), Q(0.85, 0.4, 5), Q(0.85, 0.12, 30), Q(0.85, 0.08, 28), Q(0.85, 0.36, 0)], tone(c, -0.3)); // its side
    B.poly([Q(0.15, 0.12, 30), Q(0.85, 0.12, 30), Q(0.85, 0.08, 28), Q(0.15, 0.08, 28)], tone(c, 0.25));               // top edge
    for (const x of [0.28, 0.72]) { const q = Q(x, 0.2, 21); B.ell(q[0], q[1], 3, 3, '#141418'); B.ell(q[0], q[1], 1.4, 1.4, '#7a7a82'); }
    p.box(0.15, 0.84, 0, 0.7, 0.05, 2, '#d8342c', { e: 0 }); p.dot(0.5, 0.86, 6, '#3fe04a');
    return { seat: 5 };
  };
  ART.cdtower = (p, a) => { p.shadow(0.5, 0.5, 0.3); p.box(0.32, 0.32, 0, 0.36, 0.36, 40, a[1]); for (let i = 0; i < 9; i++) p.fy(0.68, 0.34, 0.66, 3 + i * 4, 5 + i * 4, ['#d8342c', '#eeeae0', '#3266d6', '#f2c22e', '#3fa34a'][i % 5]); };
  ART.speakers = (p, a) => { p.shadow(0.5, 0.5, 0.38); p.box(0.22, 0.25, 0, 0.56, 0.5, 34, a[1]); const G = pixApi(9, 30); G.circ(4, 20, 4, '#141418'); G.circ(4, 20, 2, '#3a3a44'); G.set(4, 20, '#7a7a82'); G.circ(4, 8, 2, '#141418'); G.set(4, 8, '#5a5a62'); G.rect(1, 27, 7, 1, '#3a3a44'); p.decal('y', 0.75, 0.22 + 1 / 16, 32, 9, 30, (i, j) => G.at(i, j)); };
  ART.gamepile = (p, a) => { p.shadow(0.5, 0.5, 0.4); const cs = [a[1], '#d8342c', '#3fa34a', '#f2c22e', '#8a4ad0']; for (let i = 0; i < 5; i++) { p.box(0.2 + (i % 2) * 0.06, 0.28 - (i % 3) * 0.03, i * 5, 0.6, 0.45, 5, cs[i], { e: 0 }); p.fy(0.73 - (i % 3) * 0.03, 0.25 + (i % 2) * 0.06, 0.5 + (i % 2) * 0.06, i * 5 + 1, i * 5 + 4, '#eeeae0'); } };
  ART.footy = (p, a) => { p.shadow(1, 0.5, 0.7); legs4(p, 0.15, 0.15, 1.85, 0.85, 16, '#3a3a44'); p.box(0.1, 0.1, 16, 1.8, 0.8, 8, '#8a5a32'); p.fz(24.01, 0.18, 0.18, 1.82, 0.82, a[1]); p.line(1, 0.18, 24, 1, 0.82, 24, '#ffffff'); for (let i = 0; i < 4; i++) p.line(0.35 + i * 0.42, 0, 27, 0.35 + i * 0.42, 1.0, 27, '#b8c0cc'); for (let i = 0; i < 4; i++) p.dot(0.35 + i * 0.42, 0.5, 26, i % 2 ? '#3266d6' : '#d8342c', 2); };
  ART.padrug = (p, a) => { const c = a[1]; p.disc(0.55, 1.0, 0, 0.6, tone(c, -0.3)); p.disc(1.45, 1.0, 0, 0.6, tone(c, -0.3)); p.fz(0, 0.45, 0.45, 1.55, 1.55, tone(c, -0.3)); p.disc(0.55, 1.0, 0, 0.52, c); p.disc(1.45, 1.0, 0, 0.52, c); p.fz(0, 0.52, 0.52, 1.48, 1.48, c); p.fz(0, 0.4, 0.88, 0.7, 1.12, '#2a2a30'); p.fz(0, 0.43, 0.72, 0.67, 1.28, '#2a2a30'); for (const [x, y, col] of [[1.35, 0.78, '#d8342c'], [1.6, 1.0, '#f2c22e'], [1.35, 1.22, '#3fa34a'], [1.1, 1.0, '#3266d6']]) p.disc(x, y, 0, 0.11, col); p.fz(0, 0.85, 0.75, 1.0, 0.95, '#5a5a62'); p.fz(0, 0.85, 1.05, 1.0, 1.25, '#5a5a62'); };
  ART.consoletv = (p, a, w, d, st, fr) => { p.shadow(1, 0.5, 0.75); p.box(0.1, 0.1, 0, 1.8, 0.8, 14, WOOD); p.fy(0.9, 0.2, 1.8, 3, 11, tone(WOOD, -0.35)); p.box(0.25, 0.4, 3, 0.5, 0.4, 5, '#5a5a62', { e: 0 }); p.box(0.3, 0.15, 14, 0.85, 0.65, 26, a[1]); p.fy(0.8, 0.35, 1.1, 16, 37, '#141418'); tvScreen(p, 0.8, 0.38, 1.07, 17, 36, st || 3, fr); p.box(1.3, 0.3, 14, 0.45, 0.35, 5, '#5a5a62'); p.fy(0.65, 1.4, 1.65, 16, 18, '#2a2a30'); for (let i = 0; i < 3; i++) { p.box(1.25 + i * 0.18, 0.75, 14, 0.12, 0.08, 2, ['#d8342c', '#3266d6', '#3fa34a'][i], { e: 0 }); } return { glow: [0.75, 0.8, 26, '#a0c8ff', 44] }; };

  // ---- front room
  ART.sofa = (p, a) => { p.shadow(1, 0.5, 0.75); const c = a[1]; p.box(0.05, 0.12, 0, 1.9, 0.82, 10, tone(c, -0.08)); p.box(0.05, 0.08, 10, 1.9, 0.26, 18, c); p.box(0.05, 0.3, 10, 0.2, 0.62, 10, c); p.box(1.75, 0.3, 10, 0.2, 0.62, 10, c); p.box(0.25, 0.32, 10, 0.72, 0.58, 4, tone(c, 0.1)); p.box(1.0, 0.32, 10, 0.72, 0.58, 4, tone(c, 0.1)); return { seat: 13 }; };
  ART.armchair = (p, a) => { p.shadow(0.5, 0.5, 0.45); const c = a[1]; p.box(0.1, 0.12, 0, 0.8, 0.8, 10, tone(c, -0.08)); p.box(0.1, 0.08, 10, 0.8, 0.26, 20, c); p.box(0.1, 0.3, 10, 0.18, 0.62, 10, c); p.box(0.72, 0.3, 10, 0.18, 0.62, 10, c); p.box(0.28, 0.32, 10, 0.44, 0.58, 4, tone(c, 0.1)); return { seat: 13 }; };
  ART.table = (p, a) => { p.shadow(0.5, 0.5, 0.42); legs4(p, 0.18, 0.18, 0.82, 0.82, 12, tone(a[1], -0.15)); p.box(0.12, 0.12, 12, 0.76, 0.76, 3, a[1]); p.box(0.3, 0.3, 15, 0.16, 0.16, 4, '#eeeae0', { e: 0 }); };
  ART.table2 = (p, a) => { p.shadow(1, 0.5, 0.7); legs4(p, 0.15, 0.2, 1.85, 0.8, 12, tone(a[1], -0.15)); p.box(0.1, 0.15, 12, 1.8, 0.7, 3, a[1]); p.box(0.4, 0.3, 15, 0.5, 0.35, 1, '#d8342c', { e: 0 }); p.box(1.3, 0.35, 15, 0.14, 0.14, 4, '#eeeae0', { e: 0 }); };
  ART.dining = (p, a) => { p.shadow(1, 1, 0.9); legs4(p, 0.2, 0.2, 1.8, 1.8, 18, tone(a[1], -0.15)); p.box(0.1, 0.1, 18, 1.8, 1.8, 3, a[1]); p.fz(21.01, 0.4, 0.4, 1.6, 1.6, '#f4f0e8'); p.cyl(1, 1, 21, 0.1, 8, '#cfe8ff'); p.ball(1, 1, 27, 3, '#d8342c', 0); };
  ART.dchair = (p, a) => { p.shadow(0.5, 0.5, 0.3); legs4(p, 0.25, 0.25, 0.75, 0.75, 12, tone(a[1], -0.15), 0.08); p.box(0.22, 0.22, 12, 0.56, 0.56, 3, a[1]); p.box(0.22, 0.18, 15, 0.56, 0.08, 16, a[1]); p.fy(0.26, 0.3, 0.7, 22, 26, tone(a[1], 0.15)); return { seat: 14 }; };
  ART.lava = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.25); p.cyl(0.5, 0.5, 0, 0.16, 8, '#b8c0cc'); const c0 = p.P(0.5, 0.5, 8); for (let y = 0; y < 24; y++) { const ww = 4 + Math.round(Math.sin(y / 23 * Math.PI) * 1.6); for (let x = -ww; x < ww; x++) { const blob = st && Math.sin((y + fr * 1.5) * 0.45 + x * 0.3) > 0.55; p.B.pset(c0[0] + x, c0[1] - 2 - y, rgb(blob ? tone(a[1], x < 0 ? 0.2 : -0.05) : st ? tone(a[1], -0.5 + (x < -1 ? 0.15 : 0)) : tone(a[1], -0.7))); } } p.cyl(0.5, 0.5, 34, 0.1, 4, '#b8c0cc'); if (st) return { glow: [0.5, 0.5, 20, a[1], 46] }; };
  ART.fishtank = (p, a, w, d, st, fr) => { p.shadow(1, 0.5, 0.7); p.box(0.1, 0.2, 0, 1.8, 0.6, 16, '#2a2a30'); const g = [120, 200, 240, 200]; p.box(0.15, 0.25, 16, 1.7, 0.5, 20, '#5ab0e0', { top: [150, 210, 240, 140], l: g, r: [90, 170, 220, 200] }); p.fy(0.75, 0.2, 1.8, 16, 19, '#e8cf8a'); p.fy(0.75, 1.4, 1.5, 19, 30, '#3fa34a'); p.fy(0.75, 0.4, 0.46, 19, 27, '#2f8a3a'); const fx = 0.35 + ((fr % 8) / 8) * 1.1; p.fy(0.75, fx, fx + 0.1, 28, 30, '#f08a24'); p.fy(0.75, 1.5 - fx * 0.6, 1.58 - fx * 0.6, 24, 26, '#ff4a6a'); p.dot(1.1, 0.75, 22 + (fr % 8) * 1.5, '#ffffff'); p.box(0.1, 0.2, 36, 1.8, 0.6, 3, '#2a2a30'); };
  ART.bookcase = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.box(0.1, 0.2, 0, 0.8, 0.6, 52, a[1]); for (let s = 0; s < 4; s++) { p.fy(0.8, 0.15, 0.85, 3 + s * 12, 13 + s * 12, tone(a[1], -0.5)); for (let i = 0; i < 6; i++) p.fy(0.8, 0.17 + i * 0.11, 0.25 + i * 0.11, 3 + s * 12, 10 + s * 12 - (i % 3), ['#d8342c', '#3266d6', '#f2c22e', '#3fa34a', '#eeeae0', '#8a4ad0'][(i + s * 2) % 6]); } };
  ART.fireplace = (p, a, w, d, st, fr) => { p.shadow(1, 0.5, 0.7); p.box(0.1, 0.15, 0, 1.8, 0.5, 34, a[1]); p.box(0.05, 0.1, 34, 1.9, 0.6, 3, tone(a[1], 0.1)); p.fy(0.65, 0.5, 1.5, 3, 22, '#2a1a10'); p.fy(0.65, 0.55, 1.45, 4, 8, '#5a3a2a'); if (st) for (let i = 0; i < 6; i++) { const h = 6 + ((i * 5 + fr * 3) % 9); p.fy(0.65, 0.6 + i * 0.14, 0.7 + i * 0.14, 6, 6 + h, i % 2 ? '#ffb02a' : '#ff6a1a'); p.fy(0.65, 0.62 + i * 0.14, 0.68 + i * 0.14, 6, 6 + h * 0.5, '#ffe46a'); } p.box(0.3, 0.3, 37, 0.2, 0.2, 8, '#f2c22e'); p.box(1.4, 0.3, 37, 0.3, 0.15, 6, '#eeeae0'); return st ? { glow: [1, 0.65, 12, '#ff9a3a', 60] } : null; };
  ART.gclock = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.35); p.box(0.28, 0.3, 0, 0.44, 0.4, 56, a[1]); p.box(0.24, 0.26, 40, 0.52, 0.48, 18, tone(a[1], 0.05)); const c = p.P(0.5, 0.74, 49); p.B.ell(c[0] - 1, c[1], 6, 6, '#f4f0e8'); const t = new Date(), h = (t.getHours() % 12 + t.getMinutes() / 60) / 12 * Math.PI * 2, m = t.getMinutes() / 60 * Math.PI * 2; p.B.line(c[0] - 1, c[1], c[0] - 1 + Math.sin(h) * 3, c[1] - Math.cos(h) * 3, '#1a1a1a'); p.B.line(c[0] - 1, c[1], c[0] - 1 + Math.sin(m) * 5, c[1] - Math.cos(m) * 5, '#1a1a1a'); p.fy(0.7, 0.36, 0.64, 10, 36, tone(a[1], -0.4)); const sw = Math.sin(fr / 8 * Math.PI * 2) * 0.06; p.fy(0.7, 0.47 + sw, 0.53 + sw, 14, 18, '#f2c22e'); };
  ART.roundrug = (p, a, w) => { const r = w / 2; p.disc(r, r, 0, r - 0.05, tone(a[1], -0.15)); p.disc(r, r, 0, r - 0.25, a[1]); p.disc(r, r, 0, r - 0.55, tone(a[1], 0.2)); p.disc(r, r, 0, r - 0.85, a[1]); p.disc(r, r, 0, 0.3, tone(a[1], -0.2)); };
  ART.radiator = (p, a) => { p.box(0.3, 0.05, 2, 0.4, 0.2, 24, a[1]); for (let i = 0; i < 5; i++) p.fy(0.25, 0.32 + i * 0.08, 0.36 + i * 0.08, 4, 24, tone(a[1], -0.15)); p.box(0.35, 0.25, 22, 0.3, 0.1, 3, '#d8342c'); };

  // ---- space age
  ART.blowchair = (p, a) => { p.shadow(0.5, 0.5, 0.45); const c = alpha(a[1], 0.9); p.ball(0.5, 0.55, -2, 11, c, 0); p.ball(0.3, 0.6, 2, 7, c, 0); p.ball(0.7, 0.6, 2, 7, c, 0); p.ball(0.45, 0.2, 10, 10, c, 0); return { seat: 10 }; };
  ART.chrome = (p, a) => { p.shadow(0.5, 0.5, 0.36); p.disc(0.5, 0.5, 0, 0.25, '#7a8490'); p.cyl(0.5, 0.5, 0, 0.05, 16, a[1]); p.cyl(0.5, 0.5, 16, 0.36, 2, a[1], { top: '#eef4ff' }); p.dot(0.4, 0.4, 18, '#ffffff', 2); };
  ART.plasma = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.3); p.box(0.3, 0.3, 0, 0.4, 0.4, 8, '#2a2a30'); const c0 = p.P(0.5, 0.5, 19); p.B.ell(c0[0], c0[1], 10, 10, (u, v) => (u * u + v * v > 0.8 ? [180, 160, 230, 200] : [40, 20, 80, 220])); if (st) for (let k = 0; k < 5; k++) { const an = (k * 1.3 + fr * 0.5); let x = c0[0], y = c0[1]; for (let i = 0; i < 9; i++) { x += Math.cos(an + Math.sin(i + k) * 0.6); y += Math.sin(an + Math.cos(i * 2 + fr) * 0.6); p.B.pset(x, y, rgb(i > 6 ? '#ffffff' : '#e08aff')); } } p.B.ell(c0[0], c0[1], 2, 2, st ? '#ffffff' : '#7a6a9a'); if (st) return { glow: [0.5, 0.5, 19, '#c08aff', 44] }; };
  ART.rocketlamp = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.3); p.cyl(0.5, 0.5, 0, 0.18, 4, '#3a3a44'); if (st) for (let i = 0; i < 3; i++) p.ball(0.5, 0.5, 2 + i * 2, 3 + (fr + i) % 3, i ? '#ffb02a' : '#ffe46a', 0); p.cyl(0.5, 0.5, 8, 0.12, 30, '#eeeae0'); p.cyl(0.5, 0.5, 18, 0.13, 6, a[1]); const t = p.P(0.5, 0.5, 38); p.B.poly([[t[0] - 4, t[1] + 1], [t[0] + 4, t[1] + 1], [t[0], t[1] - 9]], a[1]); for (const [dx, dy] of [[0.18, 0], [-0.18, 0], [0, 0.18]]) p.box(0.5 + dx - 0.03, 0.5 + dy - 0.03, 8, 0.06, 0.06, 10, a[1], { e: 0 }); p.dot(0.5, 0.62, 28, '#3266d6', 2); if (st) return { glow: [0.5, 0.5, 6, '#ffb02a', 40] }; };
  ART.globe = (p, a) => { p.shadow(0.5, 0.5, 0.3); p.disc(0.5, 0.5, 0, 0.2, WOOD); p.cyl(0.5, 0.5, 0, 0.04, 14, '#c89a30'); const c0 = p.P(0.5, 0.5, 22); p.B.ell(c0[0], c0[1], 9, 9, (u, v) => { const land = Math.sin(u * 5) + Math.cos(v * 4 + u * 2) > 0.6; const l = (u + 0.4) ** 2 + (v + 0.4) ** 2; return tone(land ? '#3fa34a' : a[1], l < 0.3 ? 0.2 : l > 1.2 ? -0.25 : 0); }); };
  ART.telescope = (p, a) => { p.shadow(0.5, 0.5, 0.35); p.line(0.5, 0.5, 18, 0.2, 0.3, 0, '#3a3a44'); p.line(0.5, 0.5, 18, 0.8, 0.3, 0, '#3a3a44'); p.line(0.5, 0.5, 18, 0.5, 0.8, 0, '#3a3a44'); for (let i = 0; i < 18; i++) { const x = 0.3 + i * 0.025, z = 16 + i * 1.2; p.dot(x, 0.5, z, i > 14 ? '#3a3a44' : a[1], 4); } };
  ART.robot = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.35); p.cyl(0.5, 0.5, 0, 0.2, 6, '#5a5a62'); p.box(0.3, 0.3, 6, 0.4, 0.36, 18, a[1]); p.fy(0.66, 0.36, 0.64, 10, 20, '#3a3a44'); for (let i = 0; i < 3; i++) p.dot(0.42 + i * 0.08, 0.66, 17, ['#d8342c', '#f2c22e', '#3fe04a'][(i + fr) % 3]); p.box(0.33, 0.33, 25, 0.34, 0.3, 12, tone(a[1], 0.1)); p.fy(0.63, 0.38, 0.62, 29, 33, '#1a1a22'); p.fy(0.63, 0.41, 0.46, 30, 32, (fr & 4) ? '#ff3a3a' : '#7ac0ff'); p.fy(0.63, 0.54, 0.59, 30, 32, (fr & 4) ? '#ff3a3a' : '#7ac0ff'); p.line(0.5, 0.5, 37, 0.5, 0.5, 43, '#9aa4b0'); p.dot(0.5, 0.5, 44, (fr & 2) ? '#ff3a3a' : '#f2c22e', 2); p.box(0.18, 0.4, 14, 0.12, 0.14, 12, a[1]); p.box(0.7, 0.4, 14, 0.12, 0.14, 12, a[1]); };
  ART.eggchair = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.cyl(0.5, 0.5, 0, 0.06, 8, '#b8c0cc'); p.disc(0.5, 0.5, 0, 0.25, '#9aa4b0'); const c0 = p.P(0.5, 0.5, 22); p.B.ell(c0[0], c0[1], 14, 16, (u, v) => { const inside = u * u * 1.4 + (v - 0.15) ** 2 * 1.3 < 0.55 && v > -0.6; return inside ? (v > 0.3 ? '#d8342c' : tone('#d8342c', -0.25)) : tone(a[1], u < -0.3 ? 0.1 : u > 0.4 ? -0.25 : -0.05); }); return { seat: 10 }; };

  // ---- garden & beach
  ART.deckchair = (p, a) => { p.shadow(0.5, 0.5, 0.4); p.line(0.25, 0.75, 0, 0.25, 0.2, 26, WOOD); p.line(0.75, 0.75, 0, 0.75, 0.2, 26, WOOD); p.line(0.25, 0.2, 0, 0.25, 0.6, 10, WOOD); p.line(0.75, 0.2, 0, 0.75, 0.6, 10, WOOD); const n = 10; for (let i = 0; i < n; i++) { const t = i / n, y = 0.7 - t * 0.5, z = 6 + t * 18; p.fz(z, 0.27, y - 0.05, 0.73, y + 0.02, i % 2 ? a[1] : '#eeeae0'); } return { seat: 8 }; };
  ART.parasol = (p, a, w, d, st, fr, f) => { p.shadow(0.5, 0.5, 0.6); p.cyl(0.5, 0.5, 0, 0.04, 44, '#eeeae0'); const c = p.P(0.5, 0.5, 44); for (let k = 0; k < 8; k++) { const a0 = k / 8 * Math.PI * 2, a1 = (k + 1) / 8 * Math.PI * 2, R = 0.62; const q = (an, r, z) => p.P(0.5 + Math.cos(an) * r, 0.5 + Math.sin(an) * r, z); p.B.poly([[c[0], c[1] - 10], q(a0, R, 38), q(a1, R, 38)], k % 2 ? a[1] : '#eeeae0'); } };
  ART.palm = (p, a, w, d, st, fr, f) => {
    const big = a[2], h = big ? 70 : 40; p.shadow(0.5, 0.5, big ? 0.6 : 0.35); if (!big) p.cyl(0.5, 0.5, 0, 0.22, 10, '#c8643a'); else p.disc(0.5, 0.5, 0, 0.3, '#c8a868');
    for (let i = 0; i < 12; i++) p.cyl(0.5 + Math.sin(i * 0.25) * 0.08, 0.5, (big ? 0 : 10) + i * (h - (big ? 0 : 10)) / 12, big ? 0.08 : 0.05, (h - 10) / 12 + 1, i % 2 ? '#a0703a' : '#8a5a32');
    const top = [0.5 + Math.sin(3) * 0.08, 0.5, h];
    for (let k = 0; k < 7; k++) { const an = k / 7 * Math.PI * 2 + 0.3, L = big ? 0.9 : 0.55; for (let i = 0; i <= 10; i++) { const t = i / 10, x = top[0] + Math.cos(an) * L * t, y = top[1] + Math.sin(an) * L * t, z = top[2] + Math.sin(t * Math.PI) * 6 - t * t * 16; p.dot(x, y, z, k % 2 ? a[1] : tone(a[1], -0.2), big ? 4 : 3); } }
    p.ball(top[0], top[1] + 0.05, h - 6, 3, '#6a4a20', 0); p.ball(top[0] + 0.07, top[1], h - 7, 3, '#5a3a18', 0);
  };
  ART.gnome = (p, a) => { p.shadow(0.5, 0.5, 0.25); p.box(0.38, 0.4, 0, 0.24, 0.2, 10, '#3266d6'); p.box(0.36, 0.38, 10, 0.28, 0.24, 9, '#3fa34a'); p.ball(0.5, 0.5, 18, 5, '#f6d2b0', 0); p.fy(0.62, 0.42, 0.58, 18, 22, '#eeeae0'); const t = p.P(0.5, 0.5, 26); p.B.poly([[t[0] - 5, t[1] + 1], [t[0] + 5, t[1] + 1], [t[0] + 1, t[1] - 10]], a[1]); };
  ART.bbq = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.4); p.line(0.3, 0.3, 0, 0.5, 0.5, 18, '#3a3a44'); p.line(0.7, 0.3, 0, 0.5, 0.5, 18, '#3a3a44'); p.line(0.5, 0.75, 0, 0.5, 0.5, 18, '#3a3a44'); const c = p.P(0.5, 0.5, 18); p.B.ell(c[0], c[1] + 2, 12, 8, (u, v) => (v > -0.2 ? tone(a[1], u > 0.3 ? -0.2 : 0.05) : null)); p.B.ell(c[0], c[1], 11, 5, st ? '#3a1a10' : '#2a2a30'); if (st) { for (let i = 0; i < 6; i++) p.B.pset(c[0] - 6 + i * 2, c[1] + (i % 2), rgb((fr + i) % 3 ? '#ff6a1a' : '#ffe46a')); p.B.rect(c[0] - 6, c[1] - 2, 5, 2, '#8a3a1a'); p.B.rect(c[0] + 1, c[1] - 1, 5, 2, '#a04a2a'); for (let i = 0; i < 4; i++) p.B.pset(c[0] - 2 + Math.sin(fr + i) * 2, c[1] - 6 - i * 3 - (fr % 3), [220, 220, 220, 160]); } return st ? { glow: [0.5, 0.5, 18, '#ff8a2a', 34] } : null; };
  ART.ppool = (p, a, w, d, st, fr) => { p.disc(1, 1, 0, 0.92, '#eeeae0'); p.disc(1, 1, 0, 0.92, alpha('#3a9ad8', 0.4)); const ring = p.P(1, 1, 6); p.B.ell(ring[0], ring[1], 0.92 * 22.6, 0.92 * 11.3, (u, v) => (u * u + v * v > 0.8 ? tone(a[1], v < 0 ? 0.25 : -0.05) : [90, 180, 230, 255])); for (let i = 0; i < 4; i++) { const x = ring[0] - 12 + i * 7 + (fr % 4), y = ring[1] - 3 + (i % 2) * 4; p.B.rect(x, y, 3, 1, '#d8f0ff'); } p.box(0.4, 0.8, 6, 0.2, 0.2, 2, '#f2c22e', { e: 0 }); };
  ART.sandcastle = (p, a) => { p.shadow(0.5, 0.5, 0.4); p.box(0.15, 0.15, 0, 0.7, 0.7, 8, a[1]); for (const [x, y] of [[0.15, 0.15], [0.65, 0.15], [0.15, 0.65], [0.65, 0.65]]) p.cyl(x + 0.1, y + 0.1, 8, 0.1, 8, tone(a[1], 0.05)); p.cyl(0.5, 0.5, 8, 0.16, 12, a[1]); p.line(0.5, 0.5, 20, 0.5, 0.5, 30, '#eeeae0'); p.fy(0.5, 0.5, 0.7, 26, 30, '#d8342c'); };
  ART.bench = (p, a) => { p.shadow(1, 0.5, 0.7); for (const x of [0.15, 1.75]) { p.box(x, 0.35, 0, 0.1, 0.1, 12, '#2a2a30', { e: 0 }); p.box(x, 0.15, 0, 0.1, 0.1, 26, '#2a2a30', { e: 0 }); } for (let i = 0; i < 3; i++) p.box(0.08, 0.3 + i * 0.16, 12, 1.84, 0.12, 2, a[1], { e: 0 }); for (let i = 0; i < 2; i++) p.box(0.08, 0.12, 16 + i * 6, 1.84, 0.06, 4, a[1], { e: 0 }); return { seat: 13 }; };
  ART.hedge = (p, a) => { p.shadow(0.5, 0.5, 0.48); p.box(0.05, 0.05, 0, 0.9, 0.9, 24, a[1], { top: (x, y) => (hsh(x | 0, y | 0) < 0.4 ? tone(a[1], 0.25) : tone(a[1], 0.1)) }); for (let i = 0; i < 14; i++) p.dot(0.1 + hsh(i, 1) * 0.8, 0.95, 2 + hsh(i, 2) * 20, tone(a[1], 0.2)); };
  ART.tree = (p, a, w, d, st, fr, f) => { const big = f && f.h > 75; p.shadow(0.5, 0.5, big ? 0.75 : 0.55); p.cyl(0.5, 0.5, 0, big ? 0.1 : 0.07, big ? 30 : 22, '#7a4a20'); const c = a[1]; const blobs = big ? [[0.5, 0.5, 40, 16], [0.25, 0.5, 34, 11], [0.75, 0.5, 34, 11], [0.5, 0.25, 50, 11], [0.5, 0.75, 46, 11], [0.45, 0.45, 56, 10]] : [[0.5, 0.5, 30, 12], [0.3, 0.55, 26, 8], [0.7, 0.45, 27, 8], [0.5, 0.45, 38, 8]]; blobs.forEach(([x, y, z, r], i) => p.ball(x, y, z, r, i % 2 ? c : tone(c, 0.08), 0)); if (!big) for (let i = 0; i < 5; i++) p.dot(0.3 + hsh(i, 3) * 0.4, 0.7, 30 + hsh(i, 4) * 16, '#d8342c', 2); };
  ART.flowers = (p, a) => { p.box(0.1, 0.1, 0, 0.8, 0.8, 5, '#8a5a32'); p.fz(5.01, 0.15, 0.15, 0.85, 0.85, '#5a3a1a'); for (let i = 0; i < 9; i++) { const x = 0.25 + (i % 3) * 0.25, y = 0.25 + ((i / 3) | 0) * 0.25; p.line(x, y, 5, x, y, 13, '#3fa34a'); p.dot(x, y, 14, [a[1], '#f2c22e', '#eeeae0', '#d8342c'][i % 4], 3); } };

  // ---- fun & games
  ART.tramp = (p, a, w, d, st, fr) => { p.shadow(1, 1, 0.9); for (const [x, y] of [[0.3, 0.3], [1.7, 0.3], [0.3, 1.7], [1.7, 1.7]]) p.box(x - 0.04, y - 0.04, 0, 0.08, 0.08, 9, '#5a5a62', { e: 0 }); p.disc(1, 1, 9, 0.95, a[1]); p.disc(1, 1, 9, 0.75, '#2a2a30'); p.disc(1, 1, 9, 0.7, '#1a1a22'); };
  ART.dice = (p, a, w, d, st) => { p.shadow(0.5, 0.5, 0.35); p.box(0.3, 0.3, 0, 0.4, 0.4, 10, '#3a3a44'); p.box(0.25, 0.25, 10, 0.5, 0.5, 18, a[1]); const n = st || 6, D = { 1: [[0.5, 0.5]], 2: [[0.3, 0.3], [0.7, 0.7]], 3: [[0.3, 0.3], [0.5, 0.5], [0.7, 0.7]], 4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]], 5: [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]], 6: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.5], [0.7, 0.5], [0.3, 0.7], [0.7, 0.7]] }; for (const [u, v] of D[n] || D[6]) p.dot(0.25 + u * 0.5, 0.25 + v * 0.5, 28, '#1a1a2a', 2); p.fy(0.75, 0.42, 0.58, 18, 20, '#d8342c'); };
  ART.juke = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.45); p.box(0.12, 0.25, 0, 0.76, 0.55, 30, a[1]); const c = p.P(0.5, 0.8, 34); p.B.ell(c[0] - 1, c[1], 13, 14, (u, v) => (v > 0.3 ? null : u * u + v * v > 0.7 ? ['#ffd02a', '#ff6a3a', '#ff3aa0', '#3ae0ff'][((Math.atan2(v, u) * 3 + fr) & 3)] : tone(a[1], 0.2))); p.fy(0.8, 0.25, 0.75, 22, 30, '#2a2a30'); for (let i = 0; i < 5; i++) p.fy(0.8, 0.28 + i * 0.09, 0.33 + i * 0.09, 23, 29, (i + fr) % 5 === 0 ? '#ffe46a' : '#eeeae0'); p.fy(0.8, 0.3, 0.7, 6, 18, (sx, sy) => ((sy | 0) % 3 ? '#8a5a32' : '#5a3a1a')); return { glow: [0.5, 0.8, 34, '#ff6a3a', 40] }; };
  ART.disco = (p, a, w, d, st, fr) => { const cs = [a[1], '#3ae0ff', '#f2e22e', '#ff3a6a']; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) p.fz(0, 0.04 + i * 0.48, 0.04 + j * 0.48, 0.48 + i * 0.48, 0.48 + j * 0.48, st ? cs[(i + j * 2 + fr) % 4] : tone(cs[(i + j * 2) % 4], -0.55)); if (st) return { glow: [0.5, 0.5, 2, cs[fr % 4], 26] }; };
  ART.ballpit = (p, a) => { p.box(0.02, 0.02, 0, 1.96, 1.96, 8, a[1], { top: '#2a2a30' }); const cs = ['#d8342c', '#3266d6', '#3fa34a', '#f2c22e', '#ef6fb0']; for (let i = 0; i < 40; i++) p.ball(0.2 + hsh(i, 5) * 1.6, 0.2 + hsh(i, 6) * 1.6, 5, 2, cs[i % 5], 0); };
  ART.tele = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.48); p.box(0.1, 0.1, 0, 0.8, 0.8, 4, '#5a5a62'); p.box(0.1, 0.1, 4, 0.12, 0.8, 46, a[1]); p.box(0.1, 0.1, 4, 0.8, 0.12, 46, a[1]); p.box(0.78, 0.1, 4, 0.12, 0.12, 46, a[1]); p.box(0.1, 0.78, 4, 0.12, 0.12, 46, a[1]); p.box(0.1, 0.1, 50, 0.8, 0.8, 6, tone(a[1], 0.1)); p.fy(0.9, 0.22, 0.78, 51, 55, '#f2e22e'); p.txt('y', 0.9, 0.5, 51, 'TELE', '#1a1a2a'); p.fy(0.22, 0.25, 0.75, 8, 44, (sx, sy) => ((sy + fr * 2) % 6 < 2 ? [120, 220, 255, 120] : [60, 140, 220, 60])); return { seat: 4, glow: [0.5, 0.5, 26, '#7ac0ff', 34] }; };
  ART.vend = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.45); p.box(0.1, 0.25, 0, 0.8, 0.6, 52, a[1]); p.fy(0.85, 0.15, 0.6, 18, 48, '#cfe8ff'); for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) p.fy(0.85, 0.2 + i * 0.13, 0.3 + i * 0.13, 21 + r * 7, 26 + r * 7, ['#d8342c', '#3266d6', '#f2c22e', '#3fa34a'][(r + i) % 4]); p.fy(0.85, 0.66, 0.85, 30, 40, '#2a2a30'); p.dot(0.72, 0.85, 36, (fr & 4) ? '#3fe04a' : '#1a6a1a'); p.fy(0.85, 0.2, 0.8, 4, 12, '#1a1a22'); p.txt('y', 0.85, 0.5, 49, 'POP', '#ffffff'); return { glow: [0.4, 0.85, 34, '#cfe8ff', 30] }; };
  ART.pooltable = (p, a) => { p.shadow(1, 1, 0.95); for (const [x, y] of [[0.2, 0.2], [1.7, 0.2], [0.2, 1.7], [1.7, 1.7]]) p.box(x, y, 0, 0.12, 0.12, 14, '#5a3a1a', { e: 0 }); p.box(0.05, 0.05, 14, 1.9, 1.9, 8, '#6a4020'); p.fz(22.01, 0.18, 0.18, 1.82, 1.82, a[1]); for (const [x, y] of [[0.2, 0.2], [1.8, 0.2], [0.2, 1.8], [1.8, 1.8], [1, 0.18], [1, 1.82]]) p.disc(x, y, 22, 0.07, '#1a1a1a'); const bs = ['#f2c22e', '#d8342c', '#3266d6', '#1a1a1a', '#eeeae0', '#8a4ad0']; bs.forEach((c, i) => p.ball(0.6 + (i % 3) * 0.14, 0.9 + ((i / 3) | 0) * 0.14 + (i % 3) * 0.07, 22, 2, c, 0)); p.line(0.4, 1.4, 25, 1.5, 0.7, 25, '#c89a30'); };
  ART.beachball = (p, a) => { p.shadow(0.5, 0.5, 0.25); const c0 = p.P(0.5, 0.5, 8); p.B.ell(c0[0], c0[1], 8, 8, (u, v) => { const an = Math.atan2(v, u), k = Math.floor((an + Math.PI) / (Math.PI / 3)) % 3; const l = (u + 0.4) ** 2 + (v + 0.4) ** 2; return tone([a[1], '#eeeae0', '#3266d6'][k], l < 0.25 ? 0.3 : l > 1.3 ? -0.25 : 0); }); };
  ART.shopbell = (p, a) => { p.shadow(0.5, 0.5, 0.25); p.box(0.3, 0.3, 0, 0.4, 0.4, 14, WOOD); p.disc(0.5, 0.5, 14, 0.16, '#5a5a62'); const c = p.P(0.5, 0.5, 15); p.B.ell(c[0], c[1] - 3, 6, 6, (u, v) => (v > 0.4 ? null : tone(a[1], u < -0.2 ? 0.3 : u > 0.3 ? -0.2 : 0.05))); p.B.rect(c[0] - 1, c[1] - 11, 2, 2, '#c89a30'); };
  ART.karaoke = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.4); p.box(0.2, 0.25, 0, 0.6, 0.5, 22, a[1]); p.fy(0.75, 0.26, 0.74, 12, 20, '#0a0a14'); p.fy(0.75, 0.3, 0.3 + ((fr % 8) / 8) * 0.4, 15, 17, '#f2e22e'); for (let i = 0; i < 2; i++) { p.line(0.3 + i * 0.4, 0.4, 22, 0.3 + i * 0.4, 0.4, 32, '#3a3a44'); p.ball(0.3 + i * 0.4, 0.4, 32, 2, '#9aa4b0', 0); } p.fy(0.75, 0.3, 0.7, 3, 9, '#2a2a30'); return { glow: [0.5, 0.75, 16, '#f2e22e', 24] }; };

  // ---- walls (x along the wall, y out of it, z up)
  // posters: 14 x 26 pixel pictures (G: the pixel api) pinned to the wall
  const POSTER = {
    rocket: G => { G.bg('#0a0a3a'); G.stars(); G.rect(6, 4, 3, 14, '#eeeae0'); G.rect(7, 2, 1, 2, '#d8342c'); G.rect(6, 3, 3, 1, '#d8342c'); G.rect(4, 14, 2, 4, '#d8342c'); G.rect(9, 14, 2, 4, '#d8342c'); G.rect(7, 8, 1, 1, '#3266d6'); G.rect(6, 18, 3, 2, '#ffb02a'); G.rect(7, 20, 1, 2, '#ffe46a'); G.txt('GO!', 2, 21, '#f2e22e'); },
    band: G => { G.bg('#ef6fb0'); G.rect(0, 0, 14, 7, '#2a2a30'); G.txt('ZAP', 1, 1, '#ffffff'); G.rect(2, 9, 4, 4, '#f6d2b0'); G.rect(8, 9, 4, 4, '#d29a6a'); G.rect(2, 8, 4, 2, '#f2e22e'); G.rect(8, 8, 4, 2, '#2a1a10'); G.rect(1, 13, 6, 6, '#3266d6'); G.rect(7, 13, 6, 6, '#2a2a30'); G.rect(0, 20, 14, 6, '#2a2a30'); G.txt('POP', 1, 20, '#f2e22e'); },
    film: G => { G.bg('#1a1a2a'); G.stars(); G.circ(7, 9, 5, '#d8342c'); G.circ(7, 9, 3, '#ff8a3a'); G.rect(0, 16, 14, 1, '#ffffff'); G.txt('STA', 1, 18, '#f2e22e'); G.txt('R 2', 1, 24 - 1, '#f2e22e'); },
    ork: G => { G.bg('#2a2a30'); G.circ(7, 9, 6, '#3fa34a'); G.rect(4, 7, 2, 2, '#d8342c'); G.rect(8, 7, 2, 2, '#d8342c'); G.rect(3, 12, 8, 2, '#eeeae0'); G.rect(4, 11, 1, 1, '#eeeae0'); G.rect(9, 11, 1, 1, '#eeeae0'); G.txt('WAA', 1, 19, '#f2e22e'); },
    play: G => { G.bg('#3266d6'); G.rect(2, 5, 10, 7, '#9aa4b0'); G.rect(3, 8, 3, 1, '#2a2a30'); G.rect(4, 7, 1, 3, '#2a2a30'); G.rect(9, 7, 1, 1, '#d8342c'); G.rect(10, 9, 1, 1, '#f2c22e'); G.txt('PLA', 1, 14, '#ffffff'); G.txt('Y!', 3, 20, '#f2e22e'); },
    cube: G => { G.bg('#eeeae0'); const cs = ['#d8342c', '#f2c22e', '#3266d6', '#3fa34a', '#f08a24', '#ffffff']; for (let i = 0; i < 9; i++) G.rect(2 + (i % 3) * 4, 3 + ((i / 3) | 0) * 4, 3, 3, cs[(i * 5) % 6]); G.txt('3X3', 1, 17, '#2a2a30'); },
    robot: G => { G.bg('#f08a24'); G.rect(3, 7, 8, 8, '#5a5a62'); G.rect(5, 3, 4, 4, '#9aa4b0'); G.rect(5, 4, 1, 1, '#d8342c'); G.rect(8, 4, 1, 1, '#d8342c'); G.rect(1, 9, 2, 2, '#9aa4b0'); G.rect(11, 9, 3, 2, '#eeeae0'); G.rect(3, 15, 8, 2, '#2a2a30'); G.txt('BOT', 1, 19, '#2a2a30'); },
  };
  function pixApi(w, h) {
    const px = new Array(w * h).fill(null);
    const api = {
      px, set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = c; },
      bg(c) { for (let i = 0; i < px.length; i++) px[i] = c; },
      rect(x, y, ww, hh, c) { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) api.set(i, j, c); },
      circ(x, y, r, c) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.6) api.set(x + i, y + j, c); },
      stars() { for (let i = 0; i < 8; i++) api.set(hsh(i, 9) * w, hsh(i, 8) * h, '#ffffff'); },
      txt(str, x, y, c) { for (const ch of String(str).toUpperCase()) { const g = FONT[ch]; if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') api.set(x + (i % 3), y + ((i / 3) | 0), c); x += 4; } },
      at: (i, j) => px[j * w + i],
    };
    return api;
  }
  // a framed picture on the wall: frame colour, then the picture (w x h pixels)
  function framed(p, z1, w, h, frame, draw) {
    const G = pixApi(w, h); draw(G);
    p.box(0.5 / 16 * 16 / 16 + 0.04, 0, z1 - h - 2, (w + 2) / 16, 0.05, h + 4, frame, { e: 0 });
    p.decal('y', 0.05, 0.04 + 1 / 16, z1, w, h, (i, j) => G.at(i, j));
  }
  ART.poster = (p, a) => { const G = pixApi(14, 26); POSTER[a[1]](G); p.decal('y', 0.01, 1 / 16, 60, 14, 26, (i, j) => G.at(i, j)); p.decal('y', 0.01, 1 / 16, 61, 14, 1, i => (i === 1 || i === 12 ? '#d8342c' : null)); };
  ART.window = (p, a, w, d, st, fr) => { p.box(0.1, 0, 26, 0.8, 0.06, 38, a[1]); p.fy(0.06, 0.16, 0.84, 30, 60, skyAt()); const s = skyAt(); if (s === '#0a1a4a') { p.dot(0.3, 0.06, 52, '#ffffff'); p.dot(0.7, 0.06, 45, '#ffffff'); p.dot(0.55, 0.06, 56, '#ffe9a0', 2); } else p.dot(0.7, 0.06, 52, '#ffe46a', 3); p.fy(0.07, 0.48, 0.52, 30, 60, a[1]); p.fy(0.07, 0.16, 0.84, 44, 46, a[1]); p.box(0.05, 0, 24, 0.9, 0.12, 3, a[1]); };
  ART.bigwindow = (p, a) => { p.box(0.04, 0, 12, 0.92, 0.05, 52, '#5a5a62'); const G = pixApi(13, 44); G.bg('#05051a'); for (let i = 0; i < 16; i++) G.set(hsh(i, 7) * 13, hsh(i, 8) * 44, hsh(i, 9) < 0.3 ? '#9cc8ff' : '#ffffff'); if (a[1] === 'earth') { G.circ(6, 26, 6, '#2a5ac8'); G.rect(3, 23, 4, 3, '#3fa34a'); G.rect(7, 28, 3, 3, '#3fa34a'); G.rect(4, 21, 3, 1, '#ffffff'); for (let j = -6; j <= 6; j++) for (let i = 2; i <= 6; i++) if (i * i + j * j <= 38 && i + j > 3) G.set(6 + i, 26 + j, '#0a1a4a'); } else { G.circ(9, 10, 2, '#f4f0d8'); G.set(10, 9, '#05051a'); } p.decal('y', 0.05, 0.12 + 1 / 16, 62, 13, 44, (i, j) => G.at(i, j)); };
  function clockFace(G, cx, cy, r, rim) { G.circ(cx, cy, r, rim); G.circ(cx, cy, r - 1, '#f4f0e8'); for (let i = 0; i < 12; i += 3) G.set(cx + Math.round(Math.sin(i / 6 * Math.PI) * (r - 2)), cy - Math.round(Math.cos(i / 6 * Math.PI) * (r - 2)), '#7a7a82'); const t = new Date(), h = (t.getHours() % 12 + t.getMinutes() / 60) / 12 * Math.PI * 2, m = t.getMinutes() / 60 * Math.PI * 2; for (let k = 0; k <= r - 2; k++) { if (k <= r - 4) G.set(cx + Math.round(Math.sin(h) * k), cy - Math.round(Math.cos(h) * k), '#1a1a1a'); G.set(cx + Math.round(Math.sin(m) * k), cy - Math.round(Math.cos(m) * k), '#1a1a1a'); } G.set(cx, cy, rim); }
  ART.wclock = (p, a) => { const G = pixApi(16, 16); clockFace(G, 7, 7, 7, a[1]); p.decal('y', 0.01, 0, 60, 16, 16, (i, j) => G.at(i, j)); };
  ART.shelf = (p, a) => { p.box(0.05, 0, 36, 0.9, 0.25, 3, a[1]); p.box(0.15, 0.05, 39, 0.15, 0.15, 10, '#f2c22e'); p.box(0.13, 0.03, 49, 0.19, 0.19, 2, '#f2c22e'); p.box(0.45, 0.05, 39, 0.12, 0.12, 6, '#c0c0c0'); p.ball(0.51, 0.1, 45, 3, '#c0c0c0', 0); p.box(0.7, 0.05, 39, 0.15, 0.12, 8, '#c8643a'); p.dot(0.77, 0.15, 44, '#f2c22e'); };
  ART.dartboard = (p, a) => { const G = pixApi(16, 16); G.circ(7, 7, 7, '#2a2a30'); for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const r = Math.sqrt(i * i + j * j); if (r > 6.3) continue; const k = Math.floor((Math.atan2(j, i) + Math.PI) / (Math.PI / 8)); G.set(7 + i, 7 + j, r > 5 ? (k % 2 ? '#d8342c' : '#3fa34a') : r < 1 ? '#d8342c' : r < 2 ? '#3fa34a' : k % 2 ? '#2a2a30' : '#eeeae0'); } G.rect(9, 5, 3, 1, '#f2c22e'); G.rect(3, 9, 3, 1, '#3266d6'); p.decal('y', 0.01, 0, 58, 16, 16, (i, j) => G.at(i, j)); };
  ART.neon = (p, a, w, d, st, fr) => { const on = st && fr !== 5, c = on ? a[1] : tone(a[1], -0.55), hi = on ? tone(a[1], 0.6) : c; const G = pixApi(16, 13); G.bg('#1a1a22'); G.rect(1, 1, 14, 1, c); G.rect(1, 11, 14, 1, c); G.txt('OPEN', 1, 4, hi); p.decal('y', 0.02, 0, 56, 16, 13, (i, j) => G.at(i, j)); if (st) return { glow: [0.5, 0.05, 50, a[1], 40] }; };
  ART.mirror = (p, a) => { const G = pixApi(12, 24); G.bg('#c89a30'); G.rect(1, 1, 10, 22, a[1]); for (let k = 0; k < 6; k++) { G.set(3 + k, 12 - k * 2, '#ffffff'); G.set(3 + k, 13 - k * 2, '#ffffff'); G.set(5 + k, 16 - k * 2, '#ffffff'); } p.decal('y', 0.01, 0.12, 62, 12, 24, (i, j) => G.at(i, j)); };
  ART.painting = (p, a) => { const G = pixApi(16, 13); G.bg('#c89a30'); G.rect(1, 1, 14, 11, '#9cd0f4'); for (let i = 0; i < 9; i++) G.rect(3 + i, 8 - Math.min(i, 8 - i), 1, Math.min(i, 8 - i) + 1, '#8a8a9a'); G.rect(6, 4, 3, 1, '#ffffff'); G.rect(7, 3, 1, 1, '#ffffff'); G.rect(1, 9, 14, 3, a[1]); G.rect(1, 11, 14, 1, '#3266d6'); G.rect(12, 2, 2, 2, '#ffe46a'); p.decal('y', 0.01, 0, 58, 16, 13, (i, j) => G.at(i, j)); };
  ART.corkboard = (p, a) => { const G = pixApi(16, 14); G.bg('#8a5a32'); G.rect(1, 1, 14, 12, a[1]); for (const [c, x, y] of [['#eeeae0', 2, 2], ['#f2e22e', 8, 2], ['#9cc8ec', 9, 8], ['#ef6fb0', 2, 8]]) { G.rect(x, y, 5, 4, c); G.set(x + 2, y, '#d8342c'); } p.decal('y', 0.01, 0, 58, 16, 14, (i, j) => G.at(i, j)); };
  ART.flag = (p, a) => { p.line(0.1, 0.05, 30, 0.1, 0.05, 62, '#8a5a32'); for (let i = 0; i < 4; i++) p.fy(0.05, 0.12, 0.85, 50 - i * 4, 54 - i * 4, i % 2 ? '#eeeae0' : a[1]); p.fy(0.05, 0.12, 0.35, 46, 54, '#f2c22e'); };
  ART.liftdoor = (p, a) => { p.box(-0.05, 0, 0, 1.1, 0.06, 62, '#5a5a62'); p.fy(0.06, 0.05, 0.95, 0, 56, a[1]); p.fy(0.07, 0.49, 0.51, 0, 56, '#5a5a62'); p.fy(0.07, 0.3, 0.7, 57, 61, '#1a1a22'); p.txt('y', 0.07, 0.5, 57, 'LIFT', '#f2a22e'); };
  ART.door = (p, a) => { p.box(-0.05, 0, 0, 1.1, 0.06, 62, tone(a[1], -0.2)); p.fy(0.06, 0.05, 0.95, 0, 58, a[1]); for (const [x, z] of [[0.15, 32], [0.55, 32], [0.15, 6], [0.55, 6]]) p.fy(0.07, x, x + 0.3, z, z + 20, tone(a[1], -0.12)); p.dot(0.85, 0.08, 28, '#f2c22e', 2); };
  ART.banner = (p, a, w) => { p.box(0.05, 0, 40, w - 0.1, 0.04, 22, a[1]); p.fy(0.04, 0.12, w - 0.12, 42, 60, '#f2e22e'); p.txt('y', 0.05, w / 2, 53, a[2] || 'WELCOME TO', a[1]); p.txt('y', 0.05, w / 2, 46, a[3] || 'JACKWORLD!', '#3266d6'); };
  ART.scoreboard = (p, a, w, d, st, fr) => { p.box(0.05, 0, 34, 1.9, 0.06, 30, a[1]); p.fy(0.06, 0.12, 1.88, 37, 61, '#05050a'); p.txt('y', 0.07, 1, 53, 'QUIZ', (fr & 4) ? '#ffe46a' : '#ff6a3a'); p.txt('y', 0.07, 1, 45, 'BOOTH', '#3ae0ff'); for (let i = 0; i < 8; i++) p.dot(0.2 + i * 0.22, 0.07, 39, (i + fr) % 4 ? '#ff3aa0' : '#ffffff'); };
  // ---- seasonal
  ART.pumpkin = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.35); const c = p.P(0.5, 0.5, 10); p.B.ell(c[0], c[1], 12, 10, (u, v) => tone(a[1], Math.abs(Math.sin(u * 4)) < 0.25 ? -0.2 : u < -0.3 ? 0.12 : 0)); const fc = st ? (fr & 1 ? '#ffe46a' : '#ffb02a') : '#3a1a0a'; p.B.poly([[c[0] - 7, c[1] - 3], [c[0] - 3, c[1] - 3], [c[0] - 5, c[1] - 6]], fc); p.B.poly([[c[0] + 1, c[1] - 3], [c[0] + 5, c[1] - 3], [c[0] + 3, c[1] - 6]], fc); p.B.rect(c[0] - 6, c[1] + 1, 10, 2, fc); p.B.rect(c[0] - 2, c[1] - 12, 2, 4, '#3a6a2a'); if (st) return { glow: [0.5, 0.5, 10, '#ffa02a', 40] }; };
  ART.fireworks = (p, a) => { p.shadow(0.5, 0.5, 0.4); p.box(0.15, 0.2, 0, 0.7, 0.6, 12, a[1]); p.fy(0.8, 0.2, 0.8, 4, 9, '#f2e22e'); for (let i = 0; i < 5; i++) { const x = 0.25 + i * 0.12; p.cyl(x, 0.45, 12, 0.04, 8 + (i % 3) * 5, ['#3266d6', '#f2c22e', '#3fa34a', '#ef6fb0', '#eeeae0'][i]); } };
  ART.xmastree = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.45); p.box(0.38, 0.38, 0, 0.24, 0.24, 8, '#d8342c'); p.cyl(0.5, 0.5, 8, 0.05, 6, '#6a4020'); for (let k = 0; k < 4; k++) { const c = p.P(0.5, 0.5, 14 + k * 11), ww = 15 - k * 3; p.B.poly([[c[0] - ww, c[1]], [c[0] + ww, c[1]], [c[0], c[1] - 16]], k % 2 ? a[1] : tone(a[1], 0.08)); } const cs = ['#d8342c', '#f2c22e', '#3266d6', '#ef6fb0']; for (let i = 0; i < 12; i++) { const z = 16 + hsh(i, 2) * 34, r = (1 - (z - 14) / 48) * 12; const c = p.P(0.5, 0.5, z); p.B.rect(c[0] - r + hsh(i, 3) * r * 2, c[1] - 2, 2, 2, st ? cs[(i + fr) % 4] : tone(cs[i % 4], -0.3)); } const t = p.P(0.5, 0.5, 62); p.B.poly([[t[0], t[1] - 4], [t[0] + 3, t[1] + 2], [t[0] - 3, t[1] + 2]], '#ffe46a'); if (st) return { glow: [0.5, 0.5, 34, '#ffe9a0', 40] }; };
  ART.snowman = (p, a) => { p.shadow(0.5, 0.5, 0.4); p.ball(0.5, 0.5, 0, 11, a[1], 0); p.ball(0.5, 0.5, 18, 8, a[1], 0); p.ball(0.5, 0.5, 31, 6, a[1], 0); const c = p.P(0.5, 0.5, 37); p.B.rect(c[0] - 3, c[1] - 2, 2, 2, '#1a1a1a'); p.B.rect(c[0] + 1, c[1] - 2, 2, 2, '#1a1a1a'); p.B.rect(c[0] - 1, c[1] + 1, 4, 1, '#f08a24'); const s = p.P(0.5, 0.5, 31); p.B.rect(s[0] - 7, s[1] - 2, 14, 3, '#d8342c'); p.B.rect(s[0] + 2, s[1], 3, 7, '#d8342c'); p.B.rect(c[0] - 5, c[1] - 9, 10, 2, '#1a1a1a'); p.B.rect(c[0] - 3, c[1] - 15, 6, 6, '#1a1a1a'); };
  ART.easteregg = (p, a) => { p.shadow(0.5, 0.5, 0.35); const c = p.P(0.5, 0.5, 14); p.B.ell(c[0], c[1], 10, 14, (u, v) => tone(Math.abs(v - 0.1) < 0.15 ? '#3266d6' : Math.abs(v + 0.35) < 0.08 ? '#ef6fb0' : a[1], u < -0.35 ? 0.2 : u > 0.45 ? -0.25 : 0)); p.B.rect(c[0] - 2, c[1] - 1, 4, 3, '#eeeae0'); };
  ART.heart = (p, a) => { p.shadow(0.5, 0.5, 0.3); p.box(0.4, 0.4, 0, 0.2, 0.2, 6, '#eeeae0'); const c = p.P(0.5, 0.5, 20); p.B.ell(c[0] - 4, c[1] - 4, 5, 5, a[1]); p.B.ell(c[0] + 4, c[1] - 4, 5, 5, a[1]); p.B.poly([[c[0] - 9, c[1] - 3], [c[0] + 9, c[1] - 3], [c[0], c[1] + 8]], a[1]); p.B.rect(c[0] - 5, c[1] - 7, 2, 2, '#ffb0c0'); };
  ART.eclipse = (p, a) => { p.shadow(0.5, 0.5, 0.35); p.box(0.25, 0.3, 0, 0.5, 0.4, 14, '#eeeae0'); p.fy(0.7, 0.3, 0.7, 4, 12, a[1]); p.dot(0.5, 0.7, 8, '#f2e22e', 2); p.box(0.3, 0.3, 14, 0.4, 0.4, 1, '#c8c0a8'); p.txt('y', 0.7, 0.5, 1, 'SUN', '#d8342c'); };
  ART.icecart = (p, a) => { p.shadow(0.5, 0.5, 0.45); const wh = p.P(0.2, 0.75, 6); p.B.ell(wh[0], wh[1], 5, 5, '#2a2a30'); p.box(0.1, 0.25, 6, 0.8, 0.55, 18, a[1]); p.fy(0.8, 0.15, 0.85, 12, 20, '#eeeae0'); p.txt('y', 0.8, 0.5, 13, 'ICES', '#d8342c'); p.line(0.15, 0.3, 24, 0.15, 0.3, 46, '#9aa4b0'); p.line(0.85, 0.3, 24, 0.85, 0.3, 46, '#9aa4b0'); p.box(0.05, 0.2, 46, 0.9, 0.65, 3, '#eeeae0'); p.fy(0.85, 0.05, 0.95, 46, 49, (sx, sy) => ((sx | 0) % 6 < 3 ? '#ef6fb0' : '#eeeae0')); };
  ART.conkers = (p, a) => { p.shadow(0.5, 0.5, 0.3); p.ball(0.5, 0.5, 0, 9, '#c8a070', 0); for (let i = 0; i < 4; i++) p.ball(0.35 + (i % 2) * 0.25, 0.45 + (i >> 1) * 0.15, 10 + (i % 2) * 2, 3, a[1], 0); };

  // ---- rares
  ART.pillar = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.box(0.12, 0.12, 0, 0.76, 0.76, 6, a[1]); p.cyl(0.5, 0.5, 6, 0.26, 40, a[1]); for (let i = 0; i < 5; i++) { const an = -0.6 + i * 0.35; p.line(0.5 + Math.cos(an + 0.8) * 0.18, 0.5 + Math.sin(an + 0.8) * 0.18, 7, 0.5 + Math.cos(an + 0.8) * 0.18, 0.5 + Math.sin(an + 0.8) * 0.18, 45, tone(a[1], -0.18)); } p.box(0.1, 0.1, 46, 0.8, 0.8, 7, tone(a[1], 0.05)); };
  ART.lavaxl = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.35); p.cyl(0.5, 0.5, 0, 0.26, 12, '#c89a30'); const c0 = p.P(0.5, 0.5, 12); for (let y = 0; y < 40; y++) { const ww = 6 + Math.round(Math.sin(y / 39 * Math.PI) * 2.5); for (let x = -ww; x < ww; x++) { const blob = Math.sin((y + fr * 2) * 0.3 + x * 0.25) > 0.5 || Math.cos((y - fr * 1.5) * 0.22 - x * 0.2) > 0.82; p.B.pset(c0[0] + x, c0[1] - 2 - y, rgb(blob && st ? tone(a[1], x < -2 ? 0.25 : 0) : tone(a[1], st ? -0.5 + (x < -3 ? 0.12 : 0) : -0.7))); } } p.cyl(0.5, 0.5, 52, 0.16, 6, '#c89a30'); if (st) return { glow: [0.5, 0.5, 30, a[1], 60] }; };
  ART.wyrm = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.4); p.box(0.25, 0.25, 0, 0.5, 0.5, 8, '#3a3a44'); const c = a[1]; p.ball(0.5, 0.45, 8, 8, c, 0); for (let i = 0; i < 6; i++) p.ball(0.5, 0.45 + i * 0.03, 22 + i * 4, 4, tone(c, i % 2 ? 0 : 0.1), 0); const h = p.P(0.5, 0.65, 44); p.B.ell(h[0] - 4, h[1], 7, 5, tone(c, 0.05)); p.B.rect(h[0] - 12, h[1] - 1, 6, 3, tone(c, 0.05)); p.B.rect(h[0] - 4, h[1] - 3, 2, 2, '#f2e22e'); p.B.poly([[h[0], h[1] - 4], [h[0] + 6, h[1] - 12], [h[0] + 3, h[1] - 3]], tone(c, -0.2)); p.B.poly([[h[0] + 6, h[1] - 18], [h[0] + 14, h[1] - 8], [h[0] + 3, h[1] - 6]], tone(c, 0.15)); if (st) { for (let i = 0; i < 8; i++) p.B.rect(h[0] - 14 - i * 2 - (fr % 3), h[1] - 1 + Math.sin(i + fr) * 2, 2, 2, i < 3 ? '#ffe46a' : (c === '#7ad0f0' ? '#cfe8ff' : '#ff8a2a')); return { glow: [0.3, 0.7, 42, c === '#7ad0f0' ? '#cfe8ff' : '#ff8a2a', 40] }; } };
  ART.throne = (p, a) => { p.shadow(0.5, 0.5, 0.48); const c = a[1]; p.box(0.1, 0.12, 0, 0.8, 0.8, 14, c); p.box(0.1, 0.08, 14, 0.8, 0.2, 38, c); p.box(0.1, 0.28, 14, 0.14, 0.62, 12, tone(c, -0.05)); p.box(0.76, 0.28, 14, 0.14, 0.62, 12, tone(c, -0.05)); p.box(0.24, 0.3, 14, 0.52, 0.56, 3, '#d8342c'); p.fy(0.28, 0.25, 0.75, 22, 48, '#a01a2a'); p.dot(0.5, 0.28, 44, '#3ae0ff', 3); const t = p.P(0.5, 0.18, 52); for (let i = -2; i <= 2; i++) p.B.poly([[t[0] + i * 5 - 2, t[1]], [t[0] + i * 5 + 2, t[1]], [t[0] + i * 5, t[1] - 5]], c); return { seat: 16 }; };
  ART.icecream = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.45); p.box(0.12, 0.2, 0, 0.76, 0.65, 34, '#eeeae0'); p.fy(0.85, 0.15, 0.85, 4, 30, (sx, sy) => ((sx | 0) % 8 < 4 ? a[1] : '#eeeae0')); p.box(0.18, 0.25, 34, 0.64, 0.5, 10, '#cfd4dc'); p.fy(0.75, 0.25, 0.75, 36, 42, '#05050a'); p.txt('y', 0.75, 0.5, 37, 'WHIP', a[1]); const c = p.P(0.5, 0.5, 46); p.B.ell(c[0], c[1] - 2, 7, 5, a[1]); p.B.ell(c[0], c[1] - 6, 5, 4, tone(a[1], 0.15)); p.B.ell(c[0], c[1] - 9, 3, 3, tone(a[1], 0.3)); };
  ART.egg = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.4); const c = p.P(0.5, 0.5, 18); p.B.ell(c[0], c[1], 13, 17, (u, v) => tone(a[1], u < -0.4 ? 0.25 : u > 0.5 ? -0.25 : 0)); p.B.rect(c[0] - 7, c[1] - 7, 14, 11, '#cfe8c0'); p.B.rect(c[0] - 6, c[1] - 6, 12, 9, '#9ab890'); const bx = c[0] - 3 + ((fr % 4) - 1), by = c[1] - 4 + (fr % 2); p.B.rect(bx, by, 5, 4, '#2a3a2a'); p.B.pset(bx + 1, by + 1, rgb('#cfe8c0')); for (let i = 0; i < 3; i++) p.B.ell(c[0] - 5 + i * 5, c[1] + 9, 2, 2, '#eeeae0'); };
  ART.crystal = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.35); p.box(0.28, 0.28, 0, 0.44, 0.44, 8, '#3a2a4a'); p.box(0.33, 0.33, 8, 0.34, 0.34, 4, '#c89a30'); const c = p.P(0.5, 0.5, 22); p.B.ell(c[0], c[1], 10, 10, (u, v) => { const sw = st ? Math.sin(u * 6 + fr * 0.8) * Math.cos(v * 5 - fr * 0.5) : 0; return u * u + v * v > 0.8 ? tone(a[1], -0.1) : tone(a[1], 0.2 + sw * 0.3); }); p.B.rect(c[0] - 5, c[1] - 6, 2, 2, '#ffffff'); if (st) return { glow: [0.5, 0.5, 22, a[1], 44] }; };
  ART.gramophone = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.box(0.15, 0.2, 0, 0.7, 0.6, 18, WOOD); p.disc(0.5, 0.5, 18, 0.25, '#1a1a1a'); p.cyl(0.6, 0.4, 18, 0.03, 12, '#c89a30'); const c = p.P(0.75, 0.3, 40); p.B.ell(c[0], c[1], 13, 11, (u, v) => (u * u + v * v > 0.55 ? a[1] : tone(a[1], -0.35))); p.B.line(c[0] - 6, c[1] + 6, c[0] - 14, c[1] + 18, rgb('#c89a30')); };
  ART.armour = (p, a) => { p.shadow(0.5, 0.5, 0.35); p.box(0.2, 0.2, 0, 0.6, 0.6, 4, '#5a3a1a'); const c = a[1]; p.box(0.36, 0.42, 4, 0.12, 0.14, 20, c); p.box(0.52, 0.42, 4, 0.12, 0.14, 20, c); p.box(0.32, 0.38, 24, 0.36, 0.24, 18, c); p.box(0.22, 0.42, 26, 0.1, 0.14, 15, tone(c, -0.05)); p.box(0.68, 0.42, 26, 0.1, 0.14, 15, tone(c, -0.05)); p.box(0.38, 0.4, 42, 0.24, 0.22, 12, c); p.fy(0.62, 0.42, 0.58, 47, 49, '#1a1a22'); p.line(0.5, 0.5, 54, 0.5, 0.5, 58, '#d8342c'); p.line(0.82, 0.5, 2, 0.82, 0.5, 48, '#cfd4dc'); };
  ART.snowglobe = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.35); p.box(0.25, 0.25, 0, 0.5, 0.5, 7, WOOD); const c = p.P(0.5, 0.5, 20); p.B.ell(c[0], c[1], 12, 12, (u, v) => (u * u + v * v > 0.85 ? [220, 240, 255, 200] : v > 0.35 ? [255, 255, 255, 255] : tone(a[1], 0.1))); p.B.rect(c[0] - 4, c[1] - 2, 8, 6, '#d8342c'); p.B.poly([[c[0] - 5, c[1] - 2], [c[0] + 5, c[1] - 2], [c[0], c[1] - 7]], '#5a5a62'); p.B.rect(c[0] - 1, c[1] + 1, 2, 3, '#f2e22e'); if (st) for (let i = 0; i < 10; i++) p.B.pset(c[0] - 9 + hsh(i, 1) * 18, c[1] - 9 + ((hsh(i, 2) * 18 + fr * 2) % 18), [255, 255, 255, 255]); };
  ART.saturn = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.3); p.disc(0.5, 0.5, 0, 0.18, '#3a3a44'); p.cyl(0.5, 0.5, 0, 0.03, 16, '#9aa4b0'); const c = p.P(0.5, 0.5, 26); p.B.ell(c[0], c[1] + 1, 16, 4, (u, v) => (v < 0 ? tone(a[1], -0.3) : null)); p.B.ell(c[0], c[1], 9, 9, (u, v) => tone(a[1], (st ? 0.25 : 0) + (Math.abs(v - 0.2) < 0.12 ? -0.15 : 0) + (u < -0.4 ? 0.15 : u > 0.5 ? -0.2 : 0))); p.B.ell(c[0], c[1] + 1, 16, 4, (u, v) => (v >= 0 && u * u + v * v > 0.45 ? tone(a[1], 0.3) : null)); if (st) return { glow: [0.5, 0.5, 26, a[1], 46] }; };
  ART.rocking = (p, a) => { p.shadow(0.5, 0.5, 0.45); const c = a[1]; for (let i = 0; i <= 12; i++) { const t = i / 12 - 0.5; p.dot(0.5, 0.5 + t * 0.9, 2 + t * t * 18, '#8a5a32', 2); p.dot(0.3, 0.5 + t * 0.9, 2 + t * t * 18, '#8a5a32', 2); } p.line(0.4, 0.25, 6, 0.4, 0.3, 16, '#8a5a32'); p.line(0.4, 0.75, 6, 0.4, 0.7, 16, '#8a5a32'); p.box(0.3, 0.22, 16, 0.2, 0.56, 10, c); p.box(0.3, 0.72, 22, 0.2, 0.18, 14, c); p.box(0.3, 0.8, 32, 0.2, 0.22, 7, c); p.dot(0.4, 0.98, 36, '#1a1a1a'); p.fy(0.82, 0.31, 0.49, 26, 38, tone(c, -0.45)); p.box(0.3, 0.1, 18, 0.2, 0.1, 6, tone(c, -0.3)); p.box(0.28, 0.4, 25, 0.24, 0.2, 2, '#d8342c'); return { seat: 22 }; };
  ART.alienjar = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.3); p.cyl(0.5, 0.5, 0, 0.22, 4, '#5a5a62'); p.cyl(0.5, 0.5, 4, 0.2, 30, [120, 220, 160, 150], { top: [150, 240, 190, 200] }); const c = p.P(0.5, 0.5, 18); p.B.ell(c[0], c[1] - 2, 5, 6, a[1]); p.B.rect(c[0] - 4, c[1] - 4, 3, 3, fr === 6 ? rgb(a[1]) : '#1a1a1a'); p.B.rect(c[0] + 1, c[1] - 4, 3, 3, fr === 6 ? rgb(a[1]) : '#1a1a1a'); p.B.rect(c[0] - 2, c[1] + 4, 4, 6, a[1]); for (let i = 0; i < 3; i++) p.B.pset(c[0] - 5 + i * 4, c[1] - 12 - ((fr + i * 3) % 8), [220, 255, 230, 255]); p.cyl(0.5, 0.5, 34, 0.21, 4, '#5a5a62'); };
  ART.treasure = (p, a, w, d, st) => { p.shadow(0.5, 0.5, 0.45); p.box(0.12, 0.2, 0, 0.76, 0.6, 16, a[1]); p.fy(0.8, 0.12, 0.88, 6, 8, '#c89a30'); if (st) { p.box(0.12, 0.15, 16, 0.76, 0.1, 18, a[1]); p.fz(16.5, 0.16, 0.26, 0.84, 0.76, '#f2c22e'); for (let i = 0; i < 6; i++) p.ball(0.25 + hsh(i, 1) * 0.5, 0.35 + hsh(i, 2) * 0.35, 16, 2, i % 2 ? '#ffe46a' : '#3ae0ff', 0); return { glow: [0.5, 0.5, 18, '#ffe46a', 40] }; } p.box(0.12, 0.2, 16, 0.76, 0.6, 6, tone(a[1], 0.08)); p.fy(0.8, 0.45, 0.55, 12, 18, '#c89a30'); };
  ART.robodog = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.4); const c = a[1]; for (const [x, y] of [[0.3, 0.35], [0.3, 0.6], [0.7, 0.35], [0.7, 0.6]]) p.box(x, y, 0, 0.08, 0.08, 9, tone(c, -0.15), { e: 0 }); p.box(0.25, 0.32, 9, 0.55, 0.36, 10, c); p.box(0.7, 0.36, 15, 0.26, 0.28, 10, tone(c, 0.05)); p.fx(0.96, 0.4, 0.6, 19, 22, '#1a1a22'); p.dot(0.96, 0.45, 21, '#ff3a3a'); p.dot(0.96, 0.57, 21, '#ff3a3a'); p.box(0.8, 0.3, 25, 0.06, 0.08, 6, tone(c, -0.2)); p.box(0.8, 0.62, 25, 0.06, 0.08, 6, tone(c, -0.2)); const wag = (fr % 4) < 2 ? 0.08 : -0.08; p.line(0.25, 0.5, 18, 0.12, 0.5 + wag, 26, tone(c, -0.2)); };
  ART.ship = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.box(0.3, 0.2, 0, 0.12, 0.6, 5, WOOD); p.box(0.58, 0.2, 0, 0.12, 0.6, 5, WOOD); const c0 = p.P(0.5, 0.5, 16); p.B.ell(c0[0], c0[1], 18, 11, (u, v) => (u * u + v * v > 0.8 ? [220, 255, 230, 190] : v > 0.25 ? [70, 120, 200, 160] : [200, 240, 220, 70])); p.B.rect(c0[0] - 8, c0[1] + 1, 14, 3, '#8a5a32'); p.B.rect(c0[0] - 1, c0[1] - 9, 1, 10, '#5a3a1a'); p.B.poly([[c0[0] - 1, c0[1] - 8], [c0[0] - 7, c0[1] - 1], [c0[0] - 1, c0[1] - 1]], a[1] === '#2a2a30' ? '#2a2a30' : '#eeeae0'); p.B.poly([[c0[0], c0[1] - 7], [c0[0] + 5, c0[1] - 1], [c0[0], c0[1] - 1]], a[1] === '#2a2a30' ? '#3a3a44' : '#f4f0e8'); p.B.rect(c0[0] + 17, c0[1] - 2, 4, 4, '#a0703a'); };
  ART.holo = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.35); p.cyl(0.5, 0.5, 0, 0.26, 6, '#3a3a44'); p.disc(0.5, 0.5, 6, 0.18, a[1]); if (st) { const c = p.P(0.5, 0.5, 30), an = fr / 8 * Math.PI / 2, s = 8; const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([x, y, z]) => { const X = x * Math.cos(an) - y * Math.sin(an), Y = x * Math.sin(an) + y * Math.cos(an); return [c[0] + (X - Y) * s * 0.7, c[1] + (X + Y) * s * 0.35 - z * s * 0.8]; }); [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([i, j]) => p.B.line(V[i][0], V[i][1], V[j][0], V[j][1], tone(a[1], 0.4))); const b = p.P(0.5, 0.5, 6); p.B.poly([[b[0] - 4, b[1]], [b[0] + 4, b[1]], [c[0] + 9, c[1] + 6], [c[0] - 9, c[1] + 6]], alpha(a[1], 0.25)); return { glow: [0.5, 0.5, 26, a[1], 40] }; } };
  ART.cubestatue = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.box(0.15, 0.15, 0, 0.7, 0.7, 16, '#eeeae0'); p.fy(0.85, 0.3, 0.7, 6, 10, a[1]); const s = 0.14, cs = [a[1], tone(a[1], 0.2), tone(a[1], -0.1)]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) if (i === 2 || j === 2 || k === 2) p.box(0.29 + i * s, 0.29 + j * s, 16 + k * 9, s - 0.01, s - 0.01, 9, cs[(i + j + k) % 3], { e: 0 }); };
  ART.moonrock = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.4); p.box(0.2, 0.2, 0, 0.6, 0.6, 14, '#5a1a2a'); p.box(0.18, 0.18, 14, 0.64, 0.64, 2, '#c89a30'); p.ball(0.5, 0.5, 16, 8, a[1], 0); p.ball(0.4, 0.55, 17, 5, tone(a[1], -0.1), 0); p.dot(0.45, 0.6, 26, tone(a[1], -0.3), 2); if (st || f_glow(a)) return { glow: [0.5, 0.5, 22, a[1], 30] }; };
  const f_glow = a => a[1] === '#7ad0f0';
  ART.discoball = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.35); p.disc(0.5, 0.5, 0, 0.22, '#3a3a44'); p.cyl(0.5, 0.5, 0, 0.03, 40, '#9aa4b0'); const c = p.P(0.5, 0.5, 50); p.B.ell(c[0], c[1], 10, 10, (u, v) => { const q = (Math.floor((u + 1) * 5) + Math.floor((v + 1) * 5) + (st ? fr : 0)) % 4; return tone(a[1], q === 0 ? 0.6 : q === 1 ? 0.1 : q === 2 ? -0.15 : -0.35); }); if (st) return { glow: [0.5, 0.5, 50, ['#ff3aa0', '#3ae0ff', '#f2e22e', '#7aff4a'][fr % 4], 70] }; };
  ART.speakerstack = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.45); for (let k = 0; k < 2; k++) for (let i = 0; i < 2; i++) { const x = 0.08 + i * 0.44, z = k * 24; p.box(x, 0.2, z, 0.42, 0.6, 24, a[1]); const c = p.P(x + 0.21, 0.8, z + 12); const pump = st && ((fr + i + k) & 1) ? 1 : 0; p.B.ell(c[0] - 3, c[1] + 1, 6 + pump, 6 + pump, '#141418'); p.B.ell(c[0] - 3, c[1] + 1, 2, 2, '#5a5a62'); } p.box(0.15, 0.25, 48, 0.7, 0.5, 6, '#3a3a44'); p.fy(0.75, 0.2, 0.8, 50, 52, st ? '#3fe04a' : '#1a4a1a'); };
  ART.teddy = (p, a) => { p.shadow(0.5, 0.5, 0.48); const c = a[1], pan = c === '#eeeae0'; p.ball(0.5, 0.5, 0, 14, c, 0); p.ball(0.3, 0.75, 0, 6, pan ? '#1a1a1a' : c, 0); p.ball(0.75, 0.3, 0, 6, pan ? '#1a1a1a' : c, 0); p.ball(0.5, 0.5, 24, 11, c, 0); const h = p.P(0.5, 0.5, 35); p.B.ell(h[0] - 9, h[1] - 9, 4, 4, pan ? '#1a1a1a' : c); p.B.ell(h[0] + 9, h[1] - 9, 4, 4, pan ? '#1a1a1a' : c); p.B.rect(h[0] - 5, h[1] - 3, 3, 3, '#1a1a1a'); p.B.rect(h[0] + 2, h[1] - 3, 3, 3, '#1a1a1a'); p.B.ell(h[0], h[1] + 3, 4, 3, pan ? '#eeeae0' : tone(c, 0.3)); p.B.rect(h[0] - 1, h[1] + 1, 2, 2, '#1a1a1a'); p.B.rect(h[0] - 6, h[1] + 8, 12, 3, '#d8342c'); return { seat: 14 }; };
  ART.gfloppy = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.box(0.15, 0.3, 0, 0.7, 0.4, 6, '#2a2a30'); p.box(0.2, 0.42, 6, 0.6, 0.12, 44, a[1]); p.fy(0.54, 0.32, 0.68, 34, 48, '#cfd4dc'); p.fy(0.55, 0.55, 0.62, 37, 46, tone(a[1], -0.3)); p.fy(0.54, 0.26, 0.74, 10, 28, '#eeeae0'); p.fy(0.55, 0.3, 0.7, 22, 23, '#3266d6'); p.txt('y', 0.55, 0.5, 13, '1.44', '#d8342c'); };
  ART.chopper = (p, a) => { p.shadow(0.5, 0.5, 0.5); const wh = (x, r) => { const c = p.P(x, 0.5, r); p.B.ell(c[0], c[1], r * 0.9, r, '#1a1a1a'); p.B.ell(c[0], c[1], r * 0.9 - 2, r - 2, null); p.B.ell(c[0], c[1], r * 0.9 - 3, r - 3, [0, 0, 0, 0]); p.B.ell(c[0], c[1], 2, 2, '#9aa4b0'); }; wh(0.15, 10); wh(0.85, 7); p.line(0.15, 0.5, 10, 0.5, 0.5, 18, a[1]); p.line(0.5, 0.5, 18, 0.85, 0.5, 8, a[1]); p.line(0.5, 0.5, 18, 0.75, 0.5, 30, '#9aa4b0'); p.box(0.25, 0.45, 20, 0.25, 0.1, 4, '#1a1a1a'); p.line(0.75, 0.5, 30, 0.85, 0.3, 32, '#9aa4b0'); p.line(0.75, 0.5, 30, 0.85, 0.7, 32, '#9aa4b0'); p.dot(0.45, 0.5, 20, '#3a3a44', 2); };
  ART.shuttle = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.45); p.box(0.2, 0.2, 0, 0.6, 0.6, 4, '#5a5a62'); p.box(0.66, 0.4, 4, 0.08, 0.2, 54, '#9a5a2a'); p.cyl(0.42, 0.5, 4, 0.13, 48, '#f08a24'); p.cyl(0.42, 0.5, 52, 0.13, 4, '#f08a24'); const t = p.P(0.42, 0.5, 56); p.B.poly([[t[0] - 4, t[1] + 1], [t[0] + 4, t[1] + 1], [t[0], t[1] - 7]], '#f08a24'); p.box(0.18, 0.34, 10, 0.14, 0.32, 36, a[1]); p.box(0.12, 0.3, 10, 0.06, 0.4, 14, a[1]); p.fx(0.32, 0.36, 0.64, 44, 46, '#1a1a1a'); if (st) { for (let i = 0; i < 5; i++) p.ball(0.42, 0.5, 2 - i * 3 - (fr % 3), 4 + i, i < 2 ? '#ffe46a' : [220, 220, 220, 200], 0); return { glow: [0.42, 0.5, 4, '#ffb02a', 60] }; } };
  ART.y2k = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.45); p.box(0.15, 0.25, 0, 0.7, 0.5, 30, '#5a5a62'); p.box(0.1, 0.2, 30, 0.8, 0.6, 24, a[1]); p.fy(0.8, 0.14, 0.86, 34, 50, '#05050a'); const now = new Date(), tgt = new Date(now.getFullYear() + 1, 0, 1), s = Math.max(0, Math.floor((tgt - now) / 1000)), dd = Math.floor(s / 86400); p.txt('y', 0.8, 0.5, 44, `${dd} DAYS`, '#ff3a3a'); p.txt('y', 0.8, 0.5, 37, (fr & 4) ? 'Y2K' : '2000', '#3ae0ff'); p.fy(0.75, 0.25, 0.75, 6, 22, '#3a3a44'); for (let i = 0; i < 4; i++) p.dot(0.3 + i * 0.13, 0.76, 14, (i + fr) % 4 ? '#3fe04a' : '#ff3a3a'); return { glow: [0.5, 0.8, 42, '#ff3a3a', 34] }; };
  ART.cup = (p, a) => { p.shadow(0.5, 0.5, 0.4); p.box(0.25, 0.25, 0, 0.5, 0.5, 8, '#2a2a30'); p.fy(0.75, 0.3, 0.7, 2, 6, '#c89a30'); p.cyl(0.5, 0.5, 8, 0.06, 8, a[1]); const c = p.P(0.5, 0.5, 16); p.B.ell(c[0], c[1] - 8, 11, 11, (u, v) => (v < -0.5 ? null : tone(a[1], u < -0.3 ? 0.3 : u > 0.4 ? -0.25 : 0))); p.B.ell(c[0], c[1] - 13, 10, 3, tone(a[1], -0.4)); p.B.ell(c[0] - 13, c[1] - 9, 4, 5, null); p.B.rect(c[0] - 15, c[1] - 12, 3, 7, a[1]); p.B.rect(c[0] + 12, c[1] - 12, 3, 7, tone(a[1], -0.2)); };

  // ---- public room things
  ART.recep = (p, a) => { p.shadow(1.5, 0.5, 0.9); p.box(0.05, 0.1, 0, 2.9, 0.8, 22, a[1]); p.box(0, 0.05, 22, 3, 0.9, 3, tone(a[1], 0.15)); p.fy(0.9, 0.2, 2.8, 6, 18, tone(a[1], -0.2)); p.txt('y', 0.9, 1.5, 9, 'RECEPTION', '#f2e22e'); p.box(2.2, 0.2, 25, 0.4, 0.4, 3, '#eeeae0'); p.box(0.4, 0.3, 25, 0.45, 0.4, 14, '#d8d0c0'); p.fy(0.7, 0.45, 0.8, 28, 37, '#2a6ab8'); p.ball(1.4, 0.5, 25, 3, '#f2c22e', 0); };
  ART.fountain = (p, a, w, d, st, fr) => { p.shadow(1, 1, 1); p.cyl(1, 1, 0, 0.95, 8, a[1]); p.disc(1, 1, 8, 0.8, '#3a9ad8'); const c = p.P(1, 1, 8); for (let i = 0; i < 6; i++) p.B.rect(c[0] - 16 + ((i * 7 + fr * 2) % 30), c[1] - 4 + (i % 3) * 3, 3, 1, '#cfe8ff'); p.cyl(1, 1, 8, 0.12, 18, a[1]); p.cyl(1, 1, 26, 0.4, 4, a[1]); p.disc(1, 1, 30, 0.3, '#3a9ad8'); const t = p.P(1, 1, 30); for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2, r = 4 + ((fr + i) % 4) * 2; p.B.pset(t[0] + Math.cos(an) * r, t[1] - 10 + ((fr + i) % 4) * 3 + Math.abs(Math.sin(an)) * 2, [200, 235, 255, 255]); } p.B.rect(t[0] - 1, t[1] - 16, 2, 14, [180, 225, 255, 230]); };
  ART.statue = (p, a, w, d, st) => {
    p.shadow(1, 1, 0.95); p.box(0.15, 0.15, 0, 1.7, 1.7, 6, '#b8b098'); p.box(0.3, 0.3, 6, 1.4, 1.4, 20, '#d8d0b8'); p.box(0.22, 0.22, 26, 1.56, 1.56, 4, '#e8e0c8');
    p.fy(1.7, 0.45, 1.55, 10, 22, '#c8c0a8'); p.txt('y', 1.7, 1.0, 14, 'THE MAYOR', '#6a6050');
    const c = a[1], dk = tone(c, -0.15);
    p.box(0.78, 0.86, 30, 0.16, 0.2, 20, dk); p.box(1.06, 0.86, 30, 0.16, 0.2, 20, dk);            // legs
    p.box(0.7, 0.8, 30, 0.6, 0.12, 4, dk);                                                            // shoes
    p.box(0.68, 0.78, 48, 0.64, 0.4, 24, c);                                                          // coat
    p.ball(1, 1.02, 52, 9, tone(c, 0.05), 0);                                                         // a big round tummy
    p.box(0.56, 0.86, 54, 0.12, 0.2, 18, dk);                                                         // arm
    p.box(1.32, 0.86, 70, 0.12, 0.16, 16, dk); p.ball(1.38, 0.94, 86, 3, c, 0);                       // the other arm, waving
    p.ball(1, 0.98, 76, 7, tone(c, 0.12), 0);                                                         // head
    p.fy(1.12, 0.92, 1.08, 78, 80, dk);                                                               // moustache
    if (!st) { p.cyl(1, 0.98, 88, 0.4, 3, tone(c, -0.25)); p.cyl(1, 0.98, 91, 0.25, 22, tone(c, -0.25)); p.cyl(1, 0.98, 95, 0.255, 3, tone(c, 0.1)); }
  };
  ART.townclock = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.4); p.box(0.3, 0.3, 0, 0.4, 0.4, 6, '#5a5a62'); p.cyl(0.5, 0.5, 6, 0.07, 60, a[1]); p.box(0.25, 0.25, 66, 0.5, 0.5, 20, a[1]); for (const [face, at] of [['y', 0.75], ['x', 0.75]]) { const c = face === 'y' ? p.P(0.5, at, 76) : p.P(at, 0.5, 76); p.B.ell(c[0] + (face === 'y' ? -1 : 1), c[1], 5, 6, '#f4f0e8'); const t = new Date(), hh = (t.getHours() % 12 + t.getMinutes() / 60) / 12 * Math.PI * 2, mm = t.getMinutes() / 60 * Math.PI * 2, cx = c[0] + (face === 'y' ? -1 : 1); p.B.line(cx, c[1], cx + Math.sin(hh) * 2.5, c[1] - Math.cos(hh) * 3, '#1a1a1a'); p.B.line(cx, c[1], cx + Math.sin(mm) * 4, c[1] - Math.cos(mm) * 5, '#1a1a1a'); } const t = p.P(0.5, 0.5, 86); p.B.poly([[t[0] - 9, t[1] + 2], [t[0] + 9, t[1] + 2], [t[0], t[1] - 8]], '#3a6a4a'); };
  ART.stall = (p, a) => { p.shadow(1, 0.5, 0.75); p.box(0.1, 0.3, 0, 1.8, 0.5, 18, '#a0703a'); const fr = ['#d8342c', '#f2c22e', '#3fa34a', '#f08a24']; for (let i = 0; i < 12; i++) p.ball(0.25 + (i % 6) * 0.28, 0.45 + ((i / 6) | 0) * 0.2, 18, 3, fr[i % 4], 0); for (const x of [0.12, 1.85]) p.line(x, 0.3, 18, x, 0.3, 50, '#8a5a32'); for (let i = 0; i < 8; i++) p.fz(50 - i * 0.6, 0.05 + i * 0.235, 0.1, 0.05 + (i + 1) * 0.235, 0.95, i % 2 ? a[1] : '#eeeae0'); p.fy(0.95, 0.05, 1.93, 44, 50, (sx) => ((sx | 0) % 10 < 5 ? a[1] : '#eeeae0')); };
  ART.phonebox = (p, a, w, d, st) => { p.shadow(0.5, 0.5, 0.48); p.box(0.12, 0.12, 0, 0.76, 0.76, 56, a[1]); for (const [face, at] of [['y', 0.88], ['x', 0.88]]) for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { const u0 = 0.2 + c * 0.2, z0 = 10 + r * 6.5; if (face === 'y') p.fy(at, u0, u0 + 0.16, z0, z0 + 5, '#cfe8ff'); else p.fx(at, u0, u0 + 0.16, z0, z0 + 5, '#cfe8ff'); } p.fy(0.88, 0.2, 0.8, 50, 54, '#1a1a1a'); p.txt('y', 0.88, 0.5, 50, 'PHONE', '#ffffff'); p.box(0.1, 0.1, 56, 0.8, 0.8, 5, tone(a[1], 0.08)); };
  ART.lamppost = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.25); p.cyl(0.5, 0.5, 0, 0.1, 6, a[1]); p.cyl(0.5, 0.5, 6, 0.04, 54, a[1]); p.box(0.38, 0.38, 60, 0.24, 0.24, 8, '#ffe9a0', { top: a[1] }); p.box(0.35, 0.35, 68, 0.3, 0.3, 3, a[1]); const n = skyAt() === '#0a1a4a'; return n ? { glow: [0.5, 0.5, 64, '#ffe9a0', 70] } : null; };
  ART.bandstand = (p, a) => {
    p.shadow(1.5, 1.5, 1.4); p.cyl(1.5, 1.5, 0, 1.3, 10, '#c8c0a8'); p.cyl(1.5, 1.5, 10, 1.25, 1, '#e8e0c8');
    const posts = []; for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + Math.PI / 8; posts.push([1.5 + Math.cos(an) * 1.1, 1.5 + Math.sin(an) * 1.1, an]); }
    const back = posts.filter(q => Math.sin(q[2] + Math.PI / 4) < 0), front = posts.filter(q => Math.sin(q[2] + Math.PI / 4) >= 0);
    for (const [x, y] of back) p.cyl(x, y, 11, 0.05, 40, a[1]);
    for (let i = 0; i < 8; i++) { const [x0, y0] = posts[i], [x1, y1] = posts[(i + 1) % 8]; p.line(x0, y0, 22, x1, y1, 22, a[1]); }
    for (const [x, y] of front) p.cyl(x, y, 11, 0.05, 40, a[1]);
    const c = p.P(1.5, 1.5, 51), rx = 1.32 * 22.6, ry = 1.32 * 11.3;
    p.B.ell(c[0], c[1], rx, ry, (u, v) => (Math.floor((Math.atan2(v, u) + Math.PI) / (Math.PI / 6)) % 2 ? '#d8342c' : '#eeeae0'));
    p.B.poly([[c[0] - rx, c[1]], [c[0] + rx, c[1]], [c[0], c[1] - 26]], '#3a6a4a'); p.B.poly([[c[0], c[1] - 26], [c[0] + rx, c[1]], [c[0] + rx * 0.4, c[1] + 2]], '#2a5a3a');
    p.B.rect(c[0] - 1, c[1] - 32, 2, 7, '#c89a30'); p.B.ell(c[0], c[1] - 33, 2, 2, '#f2c22e');
  };
  ART.duck = (p, a, w, d, st, fr) => { const bob = (fr % 4) < 2 ? 0 : 1; const c = p.P(0.5, 0.5, bob); p.B.ell(c[0], c[1] - 3, 6, 3, a[1]); p.B.ell(c[0] + 4, c[1] - 8, 3, 3, '#3a7a3a'); p.B.rect(c[0] + 7, c[1] - 8, 3, 1, '#f08a24'); p.B.pset(c[0] + 5, c[1] - 9, rgb('#1a1a1a')); p.B.ell(c[0], c[1], 9, 2, [120, 200, 240, 120]); };
  ART.hut = (p, a) => { p.shadow(1, 1, 1); p.box(0.2, 0.2, 0, 1.6, 1.6, 36, '#eeeae0'); p.fy(1.8, 0.4, 1.6, 14, 30, '#05050a'); p.fy(1.8, 0.45, 1.55, 15, 29, '#ffe9a0'); p.box(0.2, 1.5, 14, 1.6, 0.4, 3, '#a0703a'); for (let i = 0; i < 3; i++) { const c = p.P(0.5 + i * 0.4, 1.7, 22); p.B.ell(c[0], c[1], 3, 3, ['#ef6fb0', '#f4f0e8', '#8a5a32'][i]); p.B.poly([[c[0] - 3, c[1] + 2], [c[0] + 3, c[1] + 2], [c[0], c[1] + 8]], '#e8b060'); } for (let i = 0; i < 8; i++) p.fz(36 + i, 0.05 + i * 0.03, 0.05 + i * 0.03, 1.95 - i * 0.03, 1.95 - i * 0.03, i % 2 ? a[1] : '#eeeae0'); p.fy(1.8, 0.2, 1.8, 30, 36, (sx) => ((sx | 0) % 8 < 4 ? a[1] : '#eeeae0')); p.txt('y', 1.8, 1, 31, 'ICES', '#d8342c'); };
  ART.lifeguard = (p, a) => { p.shadow(0.5, 0.5, 0.45); for (const [x, y] of [[0.15, 0.15], [0.75, 0.15], [0.15, 0.75], [0.75, 0.75]]) p.box(x, y, 0, 0.1, 0.1, 40, a[1], { e: 0 }); for (let i = 0; i < 4; i++) p.box(0.15, 0.78, 6 + i * 9, 0.7, 0.06, 2, a[1], { e: 0 }); p.box(0.1, 0.1, 40, 0.8, 0.8, 3, '#d8342c'); p.box(0.1, 0.08, 43, 0.8, 0.12, 16, '#d8342c'); p.fy(0.2, 0.2, 0.8, 50, 56, '#eeeae0'); p.txt('y', 0.2, 0.5, 50, 'GUARD', '#d8342c'); return { seat: 43 }; };
  ART.msgbottle = (p, a) => { const c = p.P(0.5, 0.5, 3); p.B.ell(c[0], c[1], 8, 3, [90, 180, 120, 200]); p.B.rect(c[0] + 7, c[1] - 1, 4, 2, [90, 180, 120, 220]); p.B.rect(c[0] + 11, c[1] - 1, 2, 2, '#a0703a'); p.B.rect(c[0] - 4, c[1] - 1, 6, 2, '#f4f0e8'); };
  ART.console = (p, a, w, d, st, fr) => { p.shadow(1, 0.5, 0.75); p.box(0.1, 0.1, 0, 1.8, 0.7, 20, a[1]); const top = [p.P(0.1, 0.8, 20), p.P(1.9, 0.8, 20), p.P(1.9, 0.55, 30), p.P(0.1, 0.55, 30)]; p.B.poly(top, '#3a3a44'); for (let i = 0; i < 14; i++) { const x = 0.2 + (i % 7) * 0.24, z = 22 + ((i / 7) | 0) * 4; p.dot(x, 0.75 - ((i / 7) | 0) * 0.08, z, ['#ff3a3a', '#3fe04a', '#f2e22e', '#3ae0ff'][(i + fr) % 4]); } p.box(0.4, 0.15, 20, 1.2, 0.3, 22, '#3a3a44'); p.fy(0.45, 0.45, 1.55, 24, 40, '#0a1a2a'); for (let i = 0; i < 4; i++) p.fy(0.45, 0.5, 0.5 + ((fr + i * 3) % 8) * 0.12, 27 + i * 3, 28 + i * 3, '#3fe04a'); return { glow: [1, 0.5, 30, '#3ae0ff', 40] }; };
  ART.bigrocket = (p, a) => { p.shadow(1, 1, 0.9); for (const [dx, dy] of [[0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4]]) p.box(1 + dx - 0.06, 1 + dy - 0.06, 0, 0.12, 0.12, 24, '#d8342c'); p.cyl(1, 1, 4, 0.36, 90, a[1]); p.cyl(1, 1, 40, 0.37, 5, '#d8342c'); const t = p.P(1, 1, 94); p.B.poly([[t[0] - 11, t[1]], [t[0] + 11, t[1]], [t[0] + 5, t[1] - 14], [t[0], t[1] - 20], [t[0] - 5, t[1] - 14]], '#d8342c'); p.fy(1.36, 0.85, 1.15, 60, 70, '#3a6ab8'); p.txt('y', 1.37, 1, 22, 'JW', '#3266d6'); };
  ART.crater = (p, a) => { p.disc(1, 1, 0, 0.9, tone(a[1], -0.25)); p.disc(1.05, 1.05, 0, 0.7, tone(a[1], -0.1)); p.disc(1.1, 1.1, 0, 0.5, tone(a[1], -0.3)); };
  ART.moonflag = (p, a) => { p.shadow(0.5, 0.5, 0.2); p.line(0.5, 0.5, 0, 0.5, 0.5, 52, '#cfd4dc'); p.fy(0.5, 0.5, 1.1, 34, 52, (sx, sy) => ((sy | 0) % 6 < 3 ? '#d8342c' : '#eeeae0')); p.fy(0.5, 0.5, 0.75, 44, 52, '#3266d6'); p.txt('y', 0.5, 0.82, 36, 'JW', '#1a1a2a'); };
  ART.snowwall = (p, a) => { p.shadow(1, 0.5, 0.6); for (let i = 0; i < 6; i++) p.ball(0.2 + i * 0.32, 0.5, 0, 8, i % 2 ? a[1] : tone(a[1], -0.05), 0); for (let i = 0; i < 5; i++) p.ball(0.36 + i * 0.32, 0.5, 11, 7, a[1], 0); };
  ART.snowpile = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.ball(0.5, 0.5, -4, 13, a[1], 0); for (let i = 0; i < 5; i++) p.ball(0.3 + i * 0.1, 0.65, 0, 3, '#ffffff', 0); };
  ART.pad = (p, a) => { p.fz(0, 0.08, 0.08, 1.92, 1.92, tone(a[1], -0.3)); p.fz(0, 0.18, 0.18, 1.82, 1.82, a[1]); p.fz(0, 0.32, 0.32, 1.68, 1.68, tone(a[1], 0.15)); const c = p.P(1, 1, 0); text(p.B, a[2], c[0] - 5, c[1] - 7, '#ffffff', 3); };
  ART.quizdesk = (p, a, w, d, st, fr) => { p.shadow(1, 0.5, 0.75); p.box(0.1, 0.2, 0, 1.8, 0.6, 24, a[1]); p.fy(0.8, 0.15, 1.85, 4, 20, (sx, sy) => (((sx | 0) + (sy | 0) + fr) % 6 < 3 ? tone(a[1], 0.2) : tone(a[1], -0.1))); p.txt('y', 0.8, 1, 9, 'QUIZ', '#f2e22e'); p.box(0.05, 0.15, 24, 1.9, 0.7, 3, '#eeeae0'); p.box(1.4, 0.4, 27, 0.2, 0.2, 4, '#d8342c'); p.line(0.5, 0.5, 27, 0.5, 0.5, 36, '#3a3a44'); p.ball(0.5, 0.5, 36, 2, '#9aa4b0', 0); return { glow: [1, 0.8, 12, '#c08aff', 40] }; };
  ART.djbooth = (p, a, w, d, st, fr) => { p.shadow(1, 0.5, 0.75); p.box(0.1, 0.2, 0, 1.8, 0.6, 24, a[1]); p.fy(0.8, 0.15, 1.85, 4, 20, (sx, sy) => ((((sx / 3) | 0) + fr) % 4 === 0 ? '#ff3aa0' : '#1a1a22')); p.txt('y', 0.8, 1, 9, 'DJ SPINZ', '#3ae0ff'); p.box(0.05, 0.15, 24, 1.9, 0.7, 2, '#3a3a44'); p.disc(0.5, 0.5, 26, 0.25, '#1a1a1a'); p.disc(1.5, 0.5, 26, 0.25, '#1a1a1a'); p.dot(0.5, 0.5, 27, '#d8342c'); p.dot(1.5, 0.5, 27, '#3266d6'); p.box(0.9, 0.35, 26, 0.2, 0.3, 2, '#9aa4b0'); return { glow: [1, 0.8, 12, '#ff3aa0', 50] }; };
  ART.noticeboard = (p, a) => { p.shadow(1, 0.5, 0.7); for (const x of [0.15, 1.8]) p.box(x, 0.45, 0, 0.08, 0.08, 46, a[1], { e: 0 }); p.box(0.1, 0.4, 20, 1.8, 0.1, 30, a[1]); p.fy(0.5, 0.18, 1.82, 23, 47, '#c8a070'); const n = [['#eeeae0', 0.25, 36], ['#f2e22e', 0.75, 38], ['#9cc8ec', 1.2, 30], ['#ef6fb0', 0.5, 26], ['#eeeae0', 1.45, 39]]; for (const [c, x, z] of n) { p.fy(0.51, x, x + 0.3, z, z + 8, c); p.dot(x + 0.15, 0.52, z + 7, '#d8342c'); } p.fy(0.51, 0.25, 0.55, 39.5, 40.5, '#1a1a2a'); };
  ART.airlock = (p, a) => { p.fz(0, 0.05, 0.05, 0.95, 0.95, '#3a3a44'); p.fz(0, 0.12, 0.12, 0.88, 0.88, (x, y) => (((x + y) | 0) % 8 < 4 ? '#f2c22e' : '#1a1a1a')); p.fz(0, 0.25, 0.25, 0.75, 0.75, a[1]); p.disc(0.5, 0.5, 0, 0.18, '#5a5a62'); };
  ART.skilift = (p, a) => { p.shadow(0.5, 0.5, 0.35); p.box(0.4, 0.4, 0, 0.2, 0.2, 64, '#5a5a62'); p.box(0.05, 0.4, 64, 0.9, 0.2, 4, '#3a3a44'); p.line(0.1, 0.5, 64, 0.1, 0.5, 40, '#1a1a1a'); p.box(0, 0.35, 30, 0.3, 0.3, 10, a[1]); p.box(0, 0.35, 40, 0.3, 0.05, 2, a[1]); };
  ART.signpost = (p, a) => { p.shadow(0.5, 0.5, 0.2); p.box(0.45, 0.45, 0, 0.1, 0.1, 56, a[1], { e: 0 }); p.box(0.1, 0.48, 44, 0.8, 0.04, 8, '#eeeae0'); p.box(0.48, 0.1, 32, 0.04, 0.8, 8, '#eeeae0'); p.fy(0.52, 0.15, 0.85, 45, 51, '#3fa34a'); p.fx(0.52, 0.15, 0.85, 33, 39, '#f2c22e'); };
  ART.seats = (p, a) => { p.shadow(1, 0.5, 0.7); p.box(0.05, 0.3, 0, 1.9, 0.08, 10, '#5a5a62'); for (let i = 0; i < 3; i++) { p.box(0.1 + i * 0.62, 0.15, 10, 0.56, 0.6, 3, a[1]); p.box(0.1 + i * 0.62, 0.1, 13, 0.56, 0.1, 14, a[1]); } return { seat: 12 }; };
  ART.mchair = (p, a) => { p.shadow(0.5, 0.5, 0.3); legs4(p, 0.25, 0.25, 0.75, 0.75, 12, '#eeeae0', 0.07); p.box(0.22, 0.22, 12, 0.56, 0.56, 3, a[1]); p.box(0.22, 0.18, 15, 0.56, 0.08, 14, a[1]); return { seat: 14 }; };
  ART.ice = (p, a, w, d) => { p.fz(0, 0, 0, w, d, alpha(a[1], 0.85)); p.line(0.3, 0.4, 0, 0.8, 0.6, 0, '#ffffff'); p.line(1.1, 1.2, 0, 1.6, 1.3, 0, '#ffffff'); };
  ART.pine = (p, a) => { p.shadow(0.5, 0.5, 0.5); p.cyl(0.5, 0.5, 0, 0.07, 12, '#6a4020'); for (let k = 0; k < 4; k++) { const c = p.P(0.5, 0.5, 12 + k * 14), ww = 18 - k * 4; p.B.poly([[c[0] - ww, c[1]], [c[0] + ww, c[1]], [c[0], c[1] - 20]], tone(a[1], k * 0.03)); p.B.poly([[c[0] - ww + 4, c[1] - 6], [c[0] + ww - 8, c[1] - 6], [c[0] - 2, c[1] - 18]], '#eef4ff'); } };
  ART.gate = (p, a) => { p.shadow(0.5, 0.5, 0.3); for (const y of [0.1, 0.9]) p.box(0.45, y - 0.06, 0, 0.12, 0.12, 50, a[1]); for (let i = 0; i < 7; i++) p.line(0.5, 0.15 + i * 0.11, 2, 0.5, 0.15 + i * 0.11, 40, a[1]); p.line(0.5, 0.1, 40, 0.5, 0.9, 40, a[1]); p.line(0.5, 0.1, 12, 0.5, 0.9, 12, a[1]); };
  ART.rock = (p, a) => { p.shadow(0.5, 0.5, 0.45); p.ball(0.5, 0.5, -6, 13, a[1], 0); p.ball(0.35, 0.6, -2, 7, tone(a[1], 0.05), 0); };
  ART.rail = (p, a) => { for (const y of [0.1, 0.9]) p.box(0.45, y - 0.04, 0, 0.08, 0.08, 18, a[1], { e: 0 }); p.box(0.45, 0.05, 18, 0.08, 0.9, 2, a[1], { e: 0 }); p.box(0.45, 0.05, 9, 0.08, 0.9, 1, a[1], { e: 0 }); };
  ART.gubbinz = (p, a, w, d, st, fr) => { p.shadow(0.5, 0.5, 0.25); const hop = (fr % 4 === 1) ? 2 : 0; const c = p.P(0.5, 0.5, 8 + hop); p.B.ell(c[0], c[1], 6, 7, a[1]); p.B.poly([[c[0] - 5, c[1] - 3], [c[0] - 12, c[1] - 7], [c[0] - 5, c[1] - 1]], a[1]); p.B.poly([[c[0] + 5, c[1] - 3], [c[0] + 12, c[1] - 7], [c[0] + 5, c[1] - 1]], a[1]); p.B.rect(c[0] - 3, c[1] - 2, 2, 2, '#d8342c'); p.B.rect(c[0] + 1, c[1] - 2, 2, 2, '#d8342c'); p.B.rect(c[0] - 2, c[1] + 3, 4, 1, '#eeeae0'); p.B.rect(c[0] - 3, c[1] + 6, 2, 4 - hop, tone(a[1], -0.2)); p.B.rect(c[0] + 1, c[1] + 6, 2, 4 - hop, tone(a[1], -0.2)); };

  // ================================================================ the sky outside (real clock)
  function skyAt() { const h = new Date().getHours(); return h >= 20 || h < 6 ? '#0a1a4a' : h >= 18 || h < 8 ? '#f0a070' : '#9cd0f4'; }
  const isNight = () => { const h = new Date().getHours(); return h >= 20 || h < 6; };

  // ================================================================ floors (one 32x16 diamond per tile) and walls
  // FLOORART[name](x, y, u, v, art) -> colour for a pixel at (u, v) in the tile (u, v in 0..1 along the tile's x and y)
  const FLOORART = {
    boards: (tx, ty, u, v, a) => { const plank = Math.floor(v * 4), off = hsh(tx, ty * 7 + plank) * 0.5; const seam = (v * 4) % 1 < 0.08 || ((u + off) % 1) < 0.03; return tone(a[1], seam ? -0.35 : (hsh(tx * 4 + plank, ty) - 0.5) * 0.12); },
    carpet: (tx, ty, u, v, a) => { const n = hsh((u * 32) | 0, (v * 32) | 0, tx * 31 + ty); return tone(a[1], a[2] ? (n < 0.05 ? 0.3 : (n - 0.5) * 0.08) : (n - 0.5) * 0.1); },
    check: (tx, ty, u, v, a) => ((tx + ty) % 2 ? a[2] : a[1]),
    grass: (tx, ty, u, v, a) => { const n = hsh((u * 32) | 0, (v * 32) | 0, tx * 13 + ty * 7); return tone(a[1], n < 0.08 ? 0.2 : n > 0.93 ? -0.18 : (hsh(tx, ty) - 0.5) * 0.08); },
    tiles: (tx, ty, u, v, a) => (u % 0.5 < 0.04 || v % 0.5 < 0.04 ? tone(a[1], -0.2) : tone(a[1], (hsh(tx * 2 + (u > 0.5), ty * 2 + (v > 0.5)) - 0.5) * 0.08)),
    plate: (tx, ty, u, v, a) => { if (u < 0.04 || v < 0.04) return tone(a[1], -0.3); if ((Math.abs(u - 0.12) < 0.04 && Math.abs(v - 0.12) < 0.04) || (Math.abs(u - 0.88) < 0.04 && Math.abs(v - 0.88) < 0.04)) return tone(a[1], 0.3); return tone(a[1], (u + v) * 0.05 - 0.05); },
    sand: (tx, ty, u, v, a) => { const n = hsh((u * 32) | 0, (v * 32) | 0, tx * 5 + ty * 3); return tone(a[1], n < 0.06 ? -0.15 : n > 0.95 ? 0.2 : 0); },
    starfloor: (tx, ty, u, v, a) => { const n = hsh((u * 32) | 0, (v * 32) | 0, tx * 17 + ty); return n < 0.02 ? '#ffffff' : n < 0.04 ? '#9cc8ff' : tone(a[1], (hsh(tx, ty) - 0.5) * 0.1); },
    discofloor: (tx, ty, u, v, a) => (u < 0.06 || v < 0.06 ? '#1a1a1a' : ['#ff3aa0', '#3ae0ff', '#f2e22e', '#7aff4a'][(tx * 3 + ty * 5) % 4]),
    marble: (tx, ty, u, v, a) => { const n = Math.sin((u + tx) * 6 + Math.sin((v + ty) * 5) * 2); return tone(a[1], n > 0.9 ? -0.15 : (u < 0.03 || v < 0.03) ? -0.1 : 0.02); },
    lavafloor: (tx, ty, u, v, a) => { const n = Math.sin((u + tx) * 5 + Math.cos((v + ty) * 4) * 2) + Math.cos((v + ty) * 6); return n > 1.2 ? '#ffd02a' : n > 0.4 ? '#ff6a1a' : tone(a[1], -0.2); },
    cobble: (tx, ty, u, v, a) => { const cu = (u * 3) % 1, cv = (v * 3 + (Math.floor(u * 3) % 2) * 0.5) % 1; const edge = cu < 0.12 || cv < 0.12; return edge ? tone(a[1], -0.3) : tone(a[1], (hsh(tx * 3 + Math.floor(u * 3), ty * 3 + Math.floor(v * 3 + 0.5)) - 0.5) * 0.2); },
    snow: (tx, ty, u, v, a) => { const n = hsh((u * 32) | 0, (v * 32) | 0, tx * 11 + ty); return n < 0.03 ? '#ffffff' : tone(a[1], -(u + v) * 0.03); },
    moondust: (tx, ty, u, v, a) => { const n = hsh((u * 32) | 0, (v * 32) | 0, tx * 3 + ty * 9); return tone(a[1], n < 0.05 ? -0.25 : (hsh(tx, ty) - 0.5) * 0.1); },
  };
  const TILECHAR = { g: ['grass', '#5ab04a'], s: ['sand', '#e8cf8a'], c: ['cobble', '#a8a090'], n: ['snow', '#eef4ff'], m: ['plate', '#8a94a4'], d: ['moondust', '#a8a8ac'], p: ['sand', '#c8a878'], i: ['snow', '#bfe0f4'], k: ['discofloor', '#2a2a3a'] };
  const EDGE = { grass: '#7a5030', sand: '#b8945a', cobble: '#6a6458', snow: '#9ab0c8', plate: '#4a4a56', moondust: '#6a6a70', boards: '#6a4a2a', carpet: '#4a4a5a', check: '#6a6050', tiles: '#7a90a0', starfloor: '#0a0a1a', discofloor: '#1a1a1a', marble: '#a8a49c', lavafloor: '#5a1a0a' };
  // walls: WALLART[name](u, v, a) where u = pixels along the wall and v = pixels up it
  const WALLART = {
    plain: (u, v, a) => (a[2] ? tone(a[1], Math.sin(u * 0.3 + v * 0.2) > 0.85 ? 0.35 : 0) : a[1]),
    stripes: (u, v, a) => ((u | 0) % 12 < 6 ? a[1] : a[2]),
    dots: (u, v, a) => { const cu = u % 12 - 6, cv = (v + ((u / 12) | 0) % 2 * 6) % 12 - 6; return cu * cu + cv * cv < 6 ? a[1] : a[2]; },
    brick: (u, v, a) => { const row = Math.floor(v / 6), off = row % 2 ? 7 : 0; const mortar = v % 6 < 1 || (u + off) % 14 < 1; return mortar ? '#c8c0b0' : tone(a[1], (hsh(Math.floor((u + off) / 14), row) - 0.5) * 0.2); },
    panel: (u, v, a) => (v < 26 ? ((u | 0) % 16 < 1 ? tone(a[1], -0.3) : tone(a[1], (hsh((u / 16) | 0, 1) - 0.5) * 0.1)) : v < 28 ? tone(a[1], 0.25) : tone(a[1], 0.55)),
    starwall: (u, v, a) => { const n = hsh(u | 0, v | 0); return n < 0.012 ? '#ffe9a0' : n < 0.02 ? '#cfe8ff' : a[1]; },
    camo: (u, v, a) => { const n = Math.sin(u * 0.15) + Math.cos(v * 0.2 + u * 0.05) + Math.sin((u + v) * 0.09); return n > 1 ? tone(a[1], -0.3) : n > 0 ? a[1] : n > -1 ? tone(a[1], 0.15) : '#6a5a3a'; },
    hearts: (u, v, a) => { const cu = u % 14 - 7, cv = (v % 14) - 7; const hx = Math.abs(cu) - 2, inside = (hx * hx + (cv + 1.5) ** 2 < 6) || (cv > -1 && Math.abs(cu) < 4 - cv * 0.8 && cv < 4); return inside ? '#e0306a' : a[1]; },
    code: (u, v, a) => { const col = (u / 4) | 0, n = hsh(col, ((v / 5) | 0)); return n < 0.25 && u % 4 < 3 ? (n < 0.05 ? '#aaffaa' : '#2aa02a') : a[1]; },
    space: (u, v, a) => { const n = hsh(u | 0, v | 0); if (n < 0.01) return '#ffffff'; const neb = Math.sin(u * 0.05) * Math.cos(v * 0.07); return neb > 0.6 ? '#2a1a4a' : a[1]; },
    flames: (u, v, a) => { const f = Math.sin(u * 0.4) * 4 + 14; return v < f ? (v < f - 6 ? '#ffd02a' : '#ff6a1a') : v < f + 2 ? '#d82a1a' : a[1]; },
  };

  // ================================================================ backdrops for outdoor rooms
  // the world outside an open-air room: sky to the horizon, then the ground stretching away underneath the floating floor
  const GROUND = { city: ['#7a8098', '#3a3e52'], town: ['#8aa070', '#4a6040'], park: ['#7ab868', '#3a6a30'], sea: ['#3a8ad8', '#1a4a90'], peak: ['#e8f0fa', '#a8b8d0'], moon: ['#05050f', '#05050f'] };
  function skyCols(kind) { const n = isNight(), dusk = !n && skyAt() === '#f0a070'; return kind === 'moon' ? ['#05050f', '#05050f'] : n ? ['#050a24', '#1a2a5a'] : dusk ? ['#5a6ab8', '#f0a070'] : kind === 'peak' ? ['#5aa0e0', '#cfe8f8'] : ['#4a9ae0', '#bfe4fa']; }
  function groundCols(kind) { const g = GROUND[kind] || GROUND.park; return isNight() && kind !== 'moon' ? [tone(g[0], -0.55), tone(g[1], -0.6)].map(c => `rgb(${c.slice(0, 3).join(',')})`) : g; }
  function backdrop(g, kind, W, H, hz) {
    const n = isNight(), dusk = !n && skyAt() === '#f0a070', sky = skyCols(kind), gr0 = groundCols(kind);
    const gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); g.fillStyle = gr; g.fillRect(0, 0, W, hz);
    const gg = g.createLinearGradient(0, hz, 0, H); gg.addColorStop(0, gr0[0]); gg.addColorStop(1, gr0[1]); g.fillStyle = gg; g.fillRect(0, hz, W, H - hz);
    if (n || kind === 'moon') { g.fillStyle = '#ffffff'; for (let i = 0; i < 260; i++) { const x = hsh(i, 1) * W, y = hsh(i, 2) * (kind === 'moon' ? H : hz); g.fillRect(x | 0, y | 0, hsh(i, 3) < 0.15 ? 2 : 1, 1); } }
    if (kind === 'moon') { const ex = W * 0.72, ey = hz * 0.45; g.fillStyle = '#2a5ac8'; g.beginPath(); g.arc(ex, ey, 26, 0, 7); g.fill(); g.fillStyle = '#3fa34a'; g.fillRect(ex - 12, ey - 10, 14, 11); g.fillRect(ex + 5, ey + 3, 9, 10); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(ex - 19, ey - 2, 11, 2); g.fillStyle = 'rgba(5,5,15,.5)'; g.beginPath(); g.arc(ex + 9, ey, 26, -1.6, 1.6); g.fill(); return; }
    if (!n) { g.fillStyle = dusk ? '#ffd08a' : '#fff4c0'; g.beginPath(); g.arc(W * 0.78, hz * 0.45, dusk ? 18 : 14, 0, 7); g.fill(); for (let i = 0; i < 7; i++) cloud(g, hsh(i, 4) * W, hz * (0.2 + hsh(i, 5) * 0.5), 20 + hsh(i, 6) * 26, dusk ? '#ffd8c0' : '#ffffff'); }
    else { g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(W * 0.76, hz * 0.4, 11, 0, 7); g.fill(); g.fillStyle = sky[0]; g.beginPath(); g.arc(W * 0.76 + 5, hz * 0.4 - 3, 10, 0, 7); g.fill(); }
    const dark = n ? 0.55 : 0;
    const sil = (c, k) => { g.fillStyle = `rgb(${tone(c, -dark - (k || 0)).slice(0, 3).join(',')})`; };
    if (kind === 'city' || kind === 'town') {
      for (let pass = 0; pass < 2; pass++) for (let i = 0, x = -10; x < W; i++) {
        const bw = 16 + hsh(i, pass + 7) * 26, bh = (pass ? 30 : 60) + hsh(i, pass + 9) * (pass ? 40 : 80);
        sil(pass ? '#6a7090' : '#8a90a8', pass ? 0.2 : 0); g.fillRect(x | 0, (hz - bh) | 0, bw | 0, (kind === 'city' ? H : hz + 4) - (hz - bh) | 0);
        g.fillStyle = n ? '#ffe9a0' : 'rgba(255,255,255,.35)';
        for (let wy = hz - bh + 4; wy < (kind === 'city' ? H : hz) - 4; wy += 6) for (let wx = x + 3; wx < x + bw - 3; wx += 5) if (hsh(wx | 0, wy | 0, i) < (n ? 0.4 : 0.25)) g.fillRect(wx | 0, wy | 0, 2, 3);
        x += bw + 2;
      }
      if (kind === 'town') { sil('#5a8a4a'); for (let i = 0; i < W; i += 18) { g.beginPath(); g.arc(i, hz, 14, Math.PI, 0); g.fill(); } }
    } else if (kind === 'park') { sil('#8ac878'); g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 18 - Math.sin(x * 0.02) * 14); g.lineTo(W, hz); g.fill(); sil('#4a8a3a'); for (let i = 0; i < W; i += 14) { g.beginPath(); g.arc(i, hz - 2, 10 + hsh(i, 1) * 8, Math.PI, 0); g.fill(); } }
    else if (kind === 'sea') { g.fillStyle = n ? '#14284a' : '#6ab0f0'; for (let i = 0; i < 90; i++) g.fillRect((hsh(i, 1) * W) | 0, (hz + hsh(i, 2) * (H - hz)) | 0, 6 + (hsh(i, 3) * 8 | 0), 1); sil('#6a7a5a'); g.beginPath(); g.moveTo(W * 0.05, hz); g.lineTo(W * 0.12, hz - 16); g.lineTo(W * 0.22, hz); g.fill(); }
    else if (kind === 'peak') { sil('#8a9ab8'); g.beginPath(); g.moveTo(0, hz); for (let i = 0; i <= 10; i++) g.lineTo(i * W / 10, hz - (i % 2 ? 100 : 44) - hsh(i, 2) * 30); g.lineTo(W, hz); g.fill(); g.fillStyle = n ? '#9aa8c8' : '#ffffff'; for (let i = 1; i < 10; i += 2) { const x = i * W / 10, y = hz - 100 - hsh(i, 2) * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 18, y + 22); g.lineTo(x + 18, y + 22); g.fill(); } }
  }
  function cloud(g, x, y, s, c) { s /= 2; g.fillStyle = c; x |= 0; y |= 0; const w = Math.round(s * 1.6), hh = Math.max(3, Math.round(s * 0.35)); g.fillRect(x, y, w, hh); g.fillRect(x + Math.round(s * 0.2), y - Math.round(hh * 0.7), Math.round(w * 0.55), hh); g.fillRect(x + Math.round(s * 0.55), y - Math.round(hh * 1.2), Math.round(w * 0.3), hh); g.fillStyle = 'rgba(160,190,220,.45)'; g.fillRect(x, y + hh - 1, w, 1); }

  // ================================================================ a whole room's still layer: backdrop, walls, floor
  // scene: { map: [rows], floor: art, wall: art, in: bool, sky, doors: [[wall, pos]] }
  const WALLH = 76, PAD = 24;
  function room(sc) {
    const map = sc.map, H = map.length, W = map[0].length, inside = !!sc.in;
    const mx = inside ? PAD : 300, top = inside ? WALLH + 34 : 300, lw = (W + H) * TW + mx * 2, lh = (W + H) * TH + top + (inside ? PAD + 18 : 260);
    const ox = H * TW + mx, oy = top;
    const B = new Buf(lw, lh);
    const cv = document.createElement('canvas'); cv.width = lw; cv.height = lh;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    if (!inside) { // painted at half size and blown up, so the sky is chunky pixels like everything else
      const bc = document.createElement('canvas'); bc.width = Math.ceil(lw / 2); bc.height = Math.ceil(lh / 2);
      const bg = bc.getContext('2d'); bg.imageSmoothingEnabled = false; backdrop(bg, sc.sky || 'park', bc.width, bc.height, (oy - 30) / 2);
      g.drawImage(bc, 0, 0, bc.width * 2, bc.height * 2);
    }
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 'x' : map[y][x]);
    const P = (x, y, z) => [ox + (x - y) * TW, oy + (x + y) * TH - (z || 0)];
    const fl = sc.floor || ['boards', '#b98a52'];
    // walls (indoor rooms): the back edges of the floor
    if (inside) {
      const wa = sc.wall || ['plain', '#efe4c8'], WA = WALLART[wa[0]] || WALLART.plain;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (at(x, y) === 'x') continue;
        if (at(x, y - 1) === 'x') { // right-hand back wall along y
          const a = P(x, y, 0), b = P(x + 1, y, 0);
          B.poly([[a[0], a[1]], [b[0], b[1]], [b[0], b[1] - WALLH], [a[0], a[1] - WALLH]], (px, py) => { const u = (px - ox) + (y) * TW + 0, k = (px - a[0]) / TW, v = (a[1] + k * TH) - py; return tone(WA(x * 32 + (px - a[0]) * 2, v, wa), -0.12 + (v < 3 ? -0.2 : 0)); });
          B.poly([[a[0], a[1] - WALLH], [b[0], b[1] - WALLH], [b[0] + 4, b[1] - WALLH - 2], [a[0] + 4, a[1] - WALLH - 2]], tone(wa[1], 0.35));
        }
        if (at(x - 1, y) === 'x') { // left-hand back wall along x
          const a = P(x, y, 0), b = P(x, y + 1, 0);
          B.poly([[b[0], b[1]], [a[0], a[1]], [a[0], a[1] - WALLH], [b[0], b[1] - WALLH]], (px, py) => { const k = (a[0] - px) / TW, v = (a[1] + k * TH) - py; return tone(WA(y * 32 + (a[0] - px) * 2, v, wa), 0.06 + (v < 3 ? -0.2 : 0)); });
          B.poly([[b[0], b[1] - WALLH], [a[0], a[1] - WALLH], [a[0] - 4, a[1] - WALLH - 2], [b[0] - 4, b[1] - WALLH - 2]], tone(wa[1], 0.45));
        }
      }
    }
    // floor tiles, then the thickness along exposed front edges
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = at(x, y); if (ch === 'x' || ch === 'w') continue;
      const art = ch === '.' ? fl : TILECHAR[ch] || fl, FA = FLOORART[art[0]] || FLOORART.boards;
      const a = P(x, y), b = P(x + 1, y), c = P(x + 1, y + 1), d = P(x, y + 1);
      B.poly([a, b, c, d], (px, py) => { const sx = px - ox, sy = py - oy; const u = (sx / TW + sy / TH) / 2 - x, v = (sy / TH - sx / TW) / 2 - y; return FA(x, y, Math.max(0, Math.min(0.999, u)), Math.max(0, Math.min(0.999, v)), art); });
      const ed = EDGE[art[0]] || '#5a4a3a', T = inside ? 6 : 10;
      if (at(x, y + 1) === 'x') B.poly([d, c, [c[0], c[1] + T], [d[0], d[1] + T]], tone(ed, 0.05));
      if (at(x + 1, y) === 'x') B.poly([b, c, [c[0], c[1] + T], [b[0], b[1] + T]], tone(ed, -0.2));
    }
    // doormats on the tiles that lead somewhere else
    for (const [x, y] of sc.exits || []) {
      const c0 = P(x + 0.5, y + 0.5);
      B.poly([P(x + 0.12, y + 0.12), P(x + 0.88, y + 0.12), P(x + 0.88, y + 0.88), P(x + 0.12, y + 0.88)], (px, py) => (Math.abs(px - c0[0]) / 2 + Math.abs(py - c0[1])) % 4 < 2 ? '#ffd02a' : '#b8860a');
      B.poly([[c0[0], c0[1] - 4], [c0[0] + 6, c0[1]], [c0[0], c0[1] + 4], [c0[0] - 6, c0[1]]], '#fff4b0');
    }
    // a railing along the back edges (the Rooftop)
    if (sc.rail) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (at(x, y) === 'x') continue;
      const edges = []; if (at(x, y - 1) === 'x') edges.push([P(x, y), P(x + 1, y)]); if (at(x - 1, y) === 'x') edges.push([P(x, y), P(x, y + 1)]);
      for (const [a, b] of edges) { for (const q of [a, b]) B.rect(Math.round(q[0]) - 1, Math.round(q[1]) - 20, 2, 20, '#7a8494'); for (const hgt of [20, 11]) B.line(a[0], a[1] - hgt, b[0], b[1] - hgt, rgb('#b8c0cc')); }
    }
    g.drawImage(B.canvas(), 0, 0);
    return { c: cv, ox, oy, W, H, lw, lh, P, bg: inside ? null : [skyCols(sc.sky)[0], groundCols(sc.sky)[1]] };
  }
  // water: animated, drawn every frame by the room view (a few cached frames)
  function water(fr, night) {
    return sprite(`water|${fr}|${night ? 1 : 0}`, 34, 18, 17, 1, false, (p, B) => {
      const base = night ? '#1a3a6a' : '#3a8ad8';
      B.poly([p.P(0, 0, 0), p.P(1, 0, 0), p.P(1, 1, 0), p.P(0, 1, 0)], (px, py) => { const n = Math.sin((px + fr * 2) * 0.5) + Math.cos((py * 2 - fr) * 0.7); return n > 1.5 ? tone(base, 0.45) : n > 0.6 ? tone(base, 0.12) : base; });
    }, { noOutline: true });
  }

  // ================================================================ people
  // av = [head, skin, hair, hairCol, top, topCol, legs, legsCol, shoes]; pose: stand | walk | sit | wave | dance | laugh | lay
  // dir: 0 SE (towards +x), 1 SW (+y), 2 NW (-x), 3 NE (-y). SW/NW are SE/NE mirrored. frame: 0..3
  const FACEPAL = { k: '#000000', w: '#ffffff', g: '#3fa34a', G: '#1e6e2a', r: '#e10600', y: '#ffd400', b: '#0028c8', B: '#0028c8', s: '#ffcc99', p: '#ff66aa', o: '#ff8000', a: '#9a9a9a', m: '#8000ff', e: '#808080', c: '#00c0c0', n: '#8a5a2a' };
  let AVGRID = null;
  function avGrid() { // the JackNet faces (js/community.js draws them; we borrow its pictures as heads)
    if (AVGRID) return AVGRID;
    AVGRID = [];
    try { if (window.Community && Community.avatarURL) for (let i = 0; i < 16; i++) { const img = new Image(); img.onload = () => { bumpWear(); }; img.src = Community.avatarURL(i); AVGRID.push(img); } } catch (e) {}
    return AVGRID;
  }
  const svgImgs = {};
  function svgImg(key, svg, w, h, onload) { // a hat or face item's SVG, as a tiny crisp canvas
    if (svgImgs[key]) return svgImgs[key].c;
    const o = svgImgs[key] = { c: null };
    try {
      const img = new Image();
      img.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h); const d = g.getImageData(0, 0, w, h); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; g.putImageData(d, 0, 0); o.c = c; if (onload) onload(); };
      img.src = 'data:image/svg+xml,' + encodeURIComponent(svg.includes('xmlns') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'));
    } catch (e) {}
    return null;
  }
  let wearTick = 0; const bumpWear = () => { wearTick++; };
  function avatar(av, pose, dir, frame, wear) {
    av = C.avOk(av) ? av : [0, 0, 0, 0, 0, 1, 0, 1, 0];
    const back = dir === 2 || dir === 3, mirror = dir === 1 || dir === 2;
    const hatK = wear && wear.hat || '', faceK = wear && wear.face || '';
    const key = `av|${av.join('.')}|${pose}|${back ? 1 : 0}|${frame & 3}|${hatK}|${faceK}|${wearTick}`;
    const s = sprite(key, 40, 72, 20, 66, false, (p, B) => drawPerson(B, av, pose, back, frame & 3, hatK, faceK));
    return { s, mirror };
  }
  function drawPerson(B, av, pose, back, fr, hatK, faceK) {
    const [head, skin, hair, hc, top, tc, legs, lc, shoes] = av;
    const SK = C.AV.SKIN[skin] || C.AV.SKIN[0], HC = C.AV.HAIRC[hc], TC = C.AV.COL[tc], LC = C.AV.COL[lc], SC = C.AV.SHOES[shoes];
    const R = (x, y, w, h, c) => B.rect(x, y, w, h, c);
    const floor = pose === 'floor', sit = pose === 'sit' || floor, walk = pose === 'walk', bob = (walk && (fr & 1)) || (pose === 'dance' && (fr & 1)) ? 1 : 0;
    const by = (floor ? 13 : sit ? 9 : 0) + bob; // the body drops when sitting
    const cx = 20;
    // ---- legs
    const LCd = tone(LC, -0.2), SCd = tone(SC, -0.2);
    const sitLegs = () => { // drawn after the body: the thighs come forward towards the way you're facing
      const LCl = tone(LC, 0.14), lc = legs === 2 || legs === 3 ? SK : LC, lcd = legs === 2 || legs === 3 ? tone(SK, -0.18) : LCd;
      if (back) { R(cx - 5, 53, 4, 3, LCd); R(cx + 1, 53, 4, 3, LCd); return; }
      if (floor) { // cross-legged on the floor
        R(cx - 7, 53, 15, 4, LC); R(cx - 7, 53, 15, 1, LCl); R(cx - 8, 56, 6, 2, SC); R(cx + 3, 56, 6, 2, SCd); return;
      }
      R(cx - 4, 46, 13, 4, LC); R(cx - 4, 46, 13, 1, LCl);       // near thigh
      R(cx - 2, 44, 11, 2, LCd);                                   // far thigh, just behind
      if (legs === 3) { R(cx - 5, 45, 15, 5, LC); R(cx - 5, 45, 15, 1, LCl); }
      R(cx + 5, 50, 4, legs === 2 ? 2 : 6, LC); if (legs === 2 || legs === 3) R(cx + 5, legs === 2 ? 52 : 50, 4, legs === 2 ? 4 : 6, SK);   // near shin
      R(cx + 2, 49, 3, 6, lcd);                                    // far shin
      R(cx + 5, 56, 6, 2, SC); R(cx + 1, 55, 5, 2, SCd);           // shoes
    };
    if (sit) { /* legs come after the body */ } else {
      const st = walk ? (fr & 2 ? 1 : -1) : 0, sh = pose === 'dance' ? (fr & 2 ? 1 : -1) : 0;
      const lA = 46 - (st > 0 ? 1 : 0), lB = 46 - (st < 0 ? 1 : 0);
      const short = legs === 2, skirt = legs === 3;
      for (const [lx, ly, c, sc] of [[cx - 5 + sh, lA, LC, SC], [cx + 1 - sh, lB, LCd, SCd]]) {
        if (short) { R(lx, ly, 4, 5, c); R(lx, ly + 5, 4, 7, SK); } else if (skirt) R(lx, ly + 3, 4, 9, tone(SK, -0.05)); else R(lx, ly, 4, 12, c);
        if (legs === 4) R(lx + 3, ly, 1, 12, '#eeeae0');
        if (legs === 5) R(lx - 1, ly + 8, 6, 4, c);
        R(lx - (back ? 0 : 0), ly + 12, 5, 3, sc); if (!back) R(lx + 4, ly + 13, 1, 2, sc);
      }
      if (legs === 1) { R(cx - 5, 50, 1, 3, tone(LC, -0.35)); R(cx + 4, 50, 1, 3, tone(LC, -0.35)); }
      if (skirt) { R(cx - 6, 44, 12, 7, LC); R(cx - 7, 49, 14, 2, LCd); }
    }
    // ---- body
    const ty = 30 + by, bw = top === 4 ? 14 : 12, bx = cx - bw / 2;
    const TCl = tone(TC, 0.12), TCd = tone(TC, -0.22);
    R(bx, ty, bw, 16, TC); R(bx, ty, 3, 16, TCl); R(bx + bw - 3, ty, 3, 16, TCd);
    if (top === 1) for (let i = 0; i < 16; i += 4) R(bx, ty + i, bw, 2, '#eeeae0');
    if (top === 2) { if (!back) { R(cx - 3, ty + 9, 6, 4, TCd); R(cx - 2, ty + 1, 1, 5, '#eeeae0'); R(cx + 1, ty + 1, 1, 5, '#eeeae0'); } R(cx - 4, ty - 2, 8, 3, TCd); }
    if (top === 3 && !back) { R(cx - 3, ty, 6, 3, '#f4f0e8'); R(cx - 1, ty + 2, 2, 10, '#d8342c'); R(cx - 1, ty + 1, 2, 1, '#a01a1a'); }
    if (top === 4) { for (let i = 3; i < 16; i += 4) R(bx, ty + i, bw, 1, TCd); R(cx - 4, ty - 1, 8, 2, TCl); }
    if (top === 5) { R(bx, ty, bw, 16, '#eeeae0'); R(bx + bw - 3, ty, 3, 16, '#c8c4bc'); if (!back) { R(cx - 3, ty + 4, 6, 5, TC); R(cx - 2, ty + 5, 1, 1, '#f2e22e'); R(cx + 1, ty + 5, 1, 1, '#d8342c'); } else R(cx - 5, ty + 1, 10, 12, '#9aa4b0'); }
    if (top === 6) { R(cx - 1, ty, 2, 16, '#eeeae0'); if (!back) R(cx - 3, ty, 6, 2, '#eeeae0'); else { R(cx - 3, ty + 4, 2, 6, '#eeeae0'); R(cx + 1, ty + 4, 2, 6, '#eeeae0'); } }
    if (top === 7) { R(bx, ty, bw, 16, '#4a6aa8'); R(bx + bw - 3, ty, 3, 16, '#3a5a90'); if (!back) R(cx - 2, ty, 4, 16, TC); R(bx, ty + 14, bw, 2, '#3a5a90'); }
    if (top === 8 && !back) { R(cx - 3, ty + 3, 7, 7, '#f2e22e'); R(cx - 2, ty + 5, 1, 1, '#1a1a1a'); R(cx + 2, ty + 5, 1, 1, '#1a1a1a'); R(cx - 2, ty + 8, 5, 1, '#1a1a1a'); }
    if (top === 9) { for (let i = 2; i < 15; i += 3) for (let j = 1; j < bw - 1; j += 3) B.pset(bx + j, ty + i, rgb(TCl)); R(bx, ty + 14, bw, 2, TCd); R(cx - 4, ty - 1, 8, 2, TCd); }
    if (sit) sitLegs();
    // ---- arms (sleeves then hands)
    const sleeve = top === 0 || top === 6 || top === 8 ? 5 : 11, arm = (x, y, up, c) => {
      if (up) { R(x, y - 10, 3, 11, c); R(x, y - 13, 3, 3, SK); return; }
      R(x, y, 3, sleeve, c); R(x, y + sleeve, 3, 12 - sleeve, SK); R(x, y + 12, 3, 2, tone(SK, -0.1));
    };
    const swing = walk ? (fr & 2 ? 1 : -1) : 0;
    const armL = top === 7 ? '#4a6aa8' : top === 5 ? '#eeeae0' : TCl, armR = top === 7 ? '#3a5a90' : top === 5 ? '#c8c4bc' : TCd;
    const wave = pose === 'wave' && (fr & 2), danceUp = pose === 'dance';
    arm(bx - 3, ty + 1 + swing, danceUp && (fr & 2), armL);
    arm(bx + bw, ty + 1 - swing, wave || (danceUp && !(fr & 2)) || pose === 'laugh' && false, armR);
    // ---- the head
    const hy = ty - 14;
    if (head > 0) { // a JackNet face (10x10 picture, doubled)
      const g = avGrid()[head - 1];
      R(cx - 2, ty - 2, 4, 2, tone(SK, -0.15));
      if (g && g.complete && g.naturalWidth) {
        if (!drawPerson._c) { drawPerson._c = document.createElement('canvas'); drawPerson._c.width = drawPerson._c.height = 10; }
        const cg = drawPerson._c.getContext('2d'); cg.clearRect(0, 0, 10, 10); cg.drawImage(g, 0, 0); const d = cg.getImageData(0, 0, 10, 10).data;
        for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) { const i = (y * 10 + (back ? x : x)) * 4; if (d[i + 3] > 100) { const col = back ? tone([d[i], d[i + 1], d[i + 2]], -0.25) : [d[i], d[i + 1], d[i + 2]]; R(cx - 10 + x * 2, hy - 7 + y * 2, 2, 2, col); } }
      } else R(cx - 8, hy - 5, 16, 16, '#3fa34a');
    } else {
      const SKd = tone(SK, -0.18), SKl = tone(SK, 0.1);
      R(cx - 2, ty - 2, 4, 3, SKd); // neck
      R(cx - 6, hy, 12, 13, SK); R(cx - 6, hy + 1, 2, 11, SKl); R(cx + 4, hy + 1, 2, 12, SKd); R(cx - 5, hy + 13, 10, 1, SKd);
      if (!back) {
        R(cx - 1, hy + 6, 2, 2, '#1a1a2a'); R(cx + 3, hy + 6, 2, 2, '#1a1a2a'); B.pset(cx - 1, hy + 6, rgb('#ffffff')); B.pset(cx + 3, hy + 6, rgb('#ffffff'));
        if (pose === 'laugh') { R(cx, hy + 9, 5, 3, '#6a1a1a'); R(cx + 1, hy + 9, 3, 1, '#ffffff'); }
        else R(cx + 1, hy + 10, 3, 1, tone(SK, -0.4));
        B.pset(cx + 5, hy + 8, rgb(SKd));
        R(cx - 6, hy + 6, 2, 3, SKd); // ear
      }
      hairDo(B, hair, HC, cx, hy, back, R);
    }
    // ---- hats and face things from the Rupee shop / JackLoot (Econ draws them as SVG; we shrink them down)
    if (faceK && !back && window.Econ && Econ.faceSvg) { const svg = Econ.faceSvg(faceK); const c = svg && svgImg('f|' + faceK, svg, 16, 8, bumpWear); if (c) blit(B, c, cx - 7, head ? hy - 1 : hy + 3); }
    if (hatK && window.Econ && Econ.hatSvg) { const svg = Econ.hatSvg(hatK); const c = svg && svgImg('h|' + hatK, svg, 18, 12, bumpWear); if (c) blit(B, c, cx - 9, head ? hy - 17 : hy - 9); }
    return { seat: 0 };
  }
  function blit(B, c, x, y) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) { const k = (j * c.width + i) * 4; if (d[k + 3] > 100) B.pset(x + i, y + j, [d[k], d[k + 1], d[k + 2], 255]); } }
  function hairDo(B, s, HC, cx, hy, back, R) {
    const Hd = tone(HC, -0.25), Hl = tone(HC, 0.2);
    switch (s) {
      case 0: R(cx - 7, hy - 2, 14, 5, HC); R(cx - 7, hy + 3, 2, 4, HC); R(cx - 5, hy - 2, 6, 1, Hl); if (back) R(cx - 7, hy, 14, 10, HC); break; // short
      case 1: for (let i = 0; i < 6; i++) R(cx - 7 + i * 2 + 1, hy - 5 + (i % 2) * 2, 2, 4, i % 2 ? HC : Hl); R(cx - 7, hy - 1, 14, 4, HC); if (back) R(cx - 7, hy, 14, 9, HC); break; // spiky
      case 2: R(cx - 7, hy - 2, 14, 4, HC); R(cx - 7, hy + 2, 5, 6, HC); R(cx + 2, hy + 2, 5, 5, HC); R(cx - 1, hy - 1, 2, 3, Hd); if (back) R(cx - 7, hy, 14, 11, HC); break; // curtains
      case 3: R(cx - 7, hy - 2, 14, 5, HC); R(cx - 2, hy + 3, 8, 3, HC); R(cx - 7, hy + 3, 2, 6, HC); if (back) R(cx - 7, hy, 14, 11, HC); break; // floppy
      case 4: R(cx - 7, hy - 2, 14, 5, HC); R(cx - 8, hy + 2, 3, 16, HC); R(cx + 5, hy + 2, 3, 14, Hd); if (back) R(cx - 8, hy, 16, 18, HC); break; // long
      case 5: R(cx - 7, hy - 2, 14, 5, HC); R(cx - 11, hy + 3, 4, 7, HC); R(cx + 7, hy + 3, 4, 7, Hd); R(cx - 8, hy + 3, 1, 2, '#d8342c'); R(cx + 7, hy + 3, 1, 2, '#d8342c'); if (back) R(cx - 7, hy, 14, 9, HC); break; // bunches
      case 6: R(cx - 6, hy - 1, 12, 2, tone(HC, 0.15)); if (back) R(cx - 6, hy, 12, 6, tone(HC, 0.25)); break; // shaved
      case 7: R(cx - 7, hy - 2, 14, 5, HC); R(cx - 7, hy + 3, 2, 4, HC); if (back) { R(cx - 7, hy, 14, 9, HC); R(cx - 2, hy + 9, 4, 9, Hd); } else R(cx - 10, hy + 2, 3, 9, Hd); break; // ponytail
      case 8: B.ell(cx, hy + 2, 10, 8, (u, v) => (v > 0.4 && !back && Math.abs(u) < 0.62 ? null : hsh(u * 9 | 0, v * 9 | 0) < 0.2 ? Hl : HC)); break; // afro
      case 9: R(cx - 7, hy - 2, 14, 5, HC); R(cx - 8, hy + 2, 3, 10, HC); R(cx + 5, hy + 2, 3, 10, Hd); R(cx - 5, hy + 3, 8, 2, HC); if (back) R(cx - 8, hy, 16, 12, HC); break; // bob
      case 10: R(cx - 7, hy - 2, 14, 7, HC); R(cx - 7, hy + 5, 2, 2, HC); R(cx + 5, hy + 5, 2, 2, HC); R(cx - 5, hy - 1, 8, 1, Hl); if (back) R(cx - 7, hy, 14, 9, HC); break; // bowl
      case 11: R(cx - 6, hy - 3, 12, 4, HC); for (let i = 0; i < 5; i++) R(cx - 5 + i * 2, hy - 5 - (i % 2), 1, 3, Hl); if (back) R(cx - 7, hy, 14, 8, HC); break; // gelled
    }
  }
  // a little head picture (for bubbles and the who's-here list)
  const headCache = {};
  function headURL(av, wear) {
    const k = (C.avOk(av) ? av.join('.') : 'x') + '|' + (wear ? wear.hat + wear.face : '') + '|' + wearTick; if (headCache[k]) return headCache[k];
    const { s } = avatar(av, 'stand', 0, 0, wear); const c = document.createElement('canvas'); c.width = 24; c.height = 24; const g = c.getContext('2d');
    g.drawImage(s.c, 8, av && av[0] ? 14 : 18, 24, 24, 0, 0, 24, 24); return (headCache[k] = c.toDataURL());
  }
  // a catalogue / Treasure Chest picture of a piece of furni
  const thumbs = {};
  function thumb(id, size) {
    const f = C.FURNI[id]; if (!f) return '';
    const k = id + '|' + (size || 64); if (thumbs[k]) return thumbs[k];
    const s = f.k === 'w' ? wallItem(f, 'R', f.use === 'lamp' ? 1 : 0, 0) : furni(f, 0, f.use === 'lamp' || f.use === 'tv' || f.use === 'pc' || f.use === 'disco' ? 1 : 0, 0);
    // crop to what is drawn
    let x0 = s.w, y0 = s.h, x1 = 0, y1 = 0; for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.a[(y * s.w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const S = size || 64, cw = Math.max(1, x1 - x0 + 1), ch = Math.max(1, y1 - y0 + 1), k2 = Math.max(1, Math.floor(Math.min(S / cw, S / ch) * 2) / 2);
    const c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const dw = Math.round(cw * Math.min(k2, S / cw)), dh = Math.round(ch * Math.min(k2, S / ch)), sc = Math.min(dw / cw, dh / ch);
    g.drawImage(s.c, x0, y0, cw, ch, Math.round((S - cw * sc) / 2), Math.round((S - ch * sc) / 2), Math.round(cw * sc), Math.round(ch * sc));
    return (thumbs[k] = c.toDataURL());
  }

  window.JWArt = { furni, wallItem, avatar, room, water, thumb, headURL, hit, isNight, skyAt, tone, rgb, ART, FLOORART, WALLART, TW, TH, WALLH, text, Buf, get wearTick() { return wearTick; } };
})();

/* THE LEGEND OF ZELDO: A LINK TO THE PASTA (Super Nintendo, in Jack's room). A top-down sword-and-shield adventure.
 * Princess Zeldo's secret pasta-sauce recipe has been nicked by BARON MEATBALLO. LINGO (that's you) grabs Grandad's old
 * sword, explores the kingdom of Lasagnia screen by screen (a village with a shop, fields, a lake, a graveyard, a forest
 * and the north cliffs), buys bombs to blast the rockfall and storms the COLANDER KEEP: small keys and locked doors, a map
 * and a compass, crystal switches, push blocks, a boomerang, the BIG CHEESE mini-boss, the big key and the Baron himself.
 * Hearts, heart pieces (four make a new heart), heart containers, gems (the money), bombs and a bottle of minestrone.
 * Controls: arrows walk, B (X) sword (hold it, then let go: spin attack), A (Z) talk / lift / throw / open, Y (V) use the
 * item picked on the START menu, X (C) the map. Three save files (Jack's mates got there first); it saves on every new
 * screen and from the START menu, and CONTINUE carries on exactly where you were. Everything here is original. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const W = 256, H = 224, TS = 16, COLS = 16, ROWS = 12, TOP = 32, RW = 256, RH = 192;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const DX = [0, 0, -1, 1], DY = [1, -1, 0, 0]; // dirs: 0 down, 1 up, 2 left, 3 right
  const OPP = [1, 0, 3, 2];
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  // ---------------------------------------------------------------- canvases and pixel tools
  function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function hexRGB(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function shade(c, k) { const [r, g, b] = hexRGB(c); const f = v => clamp(Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k), 0, 255); return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join(''); }
  // draw with shapes, then binarise the alpha and (optionally) add a 1px outline round the shape
  function mk(w, h, fn, outline) {
    const c = cnv(w, h), g = c.getContext('2d'); fn(g, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data, a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { if (d[i * 4 + 3] > 100) { d[i * 4 + 3] = 255; a[i] = 1; } else d[i * 4 + 3] = 0; }
    if (outline) {
      const [r, gg, b] = hexRGB(outline);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (a[i]) continue;
        if ((x > 0 && a[i - 1]) || (x < w - 1 && a[i + 1]) || (y > 0 && a[i - w]) || (y < h - 1 && a[i + w])) { const o = i * 4; d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; }
      }
    }
    g.putImageData(im, 0, 0);
    return c;
  }
  function flipH(src) { const c = cnv(src.width, src.height), g = c.getContext('2d'); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; }
  function flipV(src) { const c = cnv(src.width, src.height), g = c.getContext('2d'); g.translate(0, src.height); g.scale(1, -1); g.drawImage(src, 0, 0); return c; }
  function rot90(src) { const c = cnv(src.height, src.width), g = c.getContext('2d'); g.translate(src.height, 0); g.rotate(Math.PI / 2); g.drawImage(src, 0, 0); return c; }
  function tint(src, col, a) { const c = cnv(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = a == null ? 1 : a; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; }
  // pixel-string sprites: rows of characters, each a colour from the palette ('.' is see-through)
  function pix(rows, pal, outline) {
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    return mk(w, h, g => { for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) { const ch = rows[y][x], c = pal[ch]; if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } } }, outline);
  }
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const P = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  const E = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
  const DITH = (g, x, y, w, h, c, ph) => { g.fillStyle = c; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((i + j + (ph || 0)) & 1) === 0) g.fillRect(x + i, y + j, 1, 1); };
  const OUT = '#1a1020'; // the outline colour of every sprite

  // ---------------------------------------------------------------- the 5x7 font, word wrap
  function wrap(s, max) {
    const out = []; for (const para of String(s).split('\n')) { let line = ''; for (const w of para.split(' ')) { if ((line + (line ? ' ' : '') + w).length > max) { if (line) out.push(line); line = w; } else line += (line ? ' ' : '') + w; } out.push(line); }
    return out;
  }

  // ================================================================ TILES (16x16, drawn in code; 4 animation frames)
  const GRASS = {
    n: { base: '#58b040', dark: '#3c8a30', light: '#88d060', deep: '#2c6a28', tall: '#3e9a34', flo: ['#f8f8f0', '#f8e040'] },
    f: { base: '#45983a', dark: '#2e7430', light: '#68b850', deep: '#1e5024', tall: '#2f8030', flo: ['#f8c0e0', '#f8f8f0'] },
    g: { base: '#5e8c5a', dark: '#44704a', light: '#7ca874', deep: '#30523a', tall: '#4a7a4c', flo: ['#d8d0f8', '#f8f8f0'] },
  };
  const TCACHE = {};
  function tc(key, fn) { if (TCACHE[key]) return TCACHE[key]; const c = cnv(16, 16); fn(c.getContext('2d')); return TCACHE[key] = c; }

  function grassTile(G, v) {
    return tc('gr' + G.base + v, g => {
      R(g, 0, 0, 16, 16, G.base);
      const n = v === 0 ? 3 : v === 1 ? 5 : 2;
      for (let i = 0; i < n; i++) {
        const x = 1 + Math.floor(hash(i, v, 7) * 12), y = 2 + Math.floor(hash(v, i, 9) * 11);
        P(g, x, y, G.dark); P(g, x + 1, y + 1, G.dark); P(g, x + 2, y, G.dark); P(g, x + 1, y - 1, G.light);
      }
      if (v === 2) for (let i = 0; i < 4; i++) P(g, 1 + Math.floor(hash(i, 3, 11) * 14), 1 + Math.floor(hash(3, i, 13) * 14), G.light);
      if (v === 3) { P(g, 4, 5, G.flo[1]); P(g, 11, 10, G.flo[0]); P(g, 10, 11, G.dark); P(g, 3, 6, G.dark); }
    });
  }
  function tallTile(G) {
    return tc('tall' + G.base, g => {
      R(g, 0, 0, 16, 16, G.deep);
      for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) {
        const x = i * 4 + (row & 1) * 2, y = 4 + row * 5;
        g.fillStyle = G.tall; g.beginPath(); g.moveTo(x, y + 5); g.lineTo(x + 1.5, y - 1); g.lineTo(x + 3, y + 5); g.fill();
        P(g, x + 1, y, G.light); P(g, x + 1, y + 1, G.light);
      }
    });
  }
  function tallOverlay(G) { // the bottom of the long grass, drawn over your feet
    return tc('tallo' + G.base, g => {
      for (let i = 0; i < 5; i++) { const x = i * 4 - 1; g.fillStyle = G.tall; g.beginPath(); g.moveTo(x, 16); g.lineTo(x + 2, 9); g.lineTo(x + 4, 16); g.fill(); P(g, x + 2, 10, G.light); }
    });
  }
  function flowerTile(G, fr, v) {
    return tc('fl' + G.base + fr + v, g => {
      g.drawImage(grassTile(G, 0), 0, 0);
      const sw = [0, 1, 0, -1][fr];
      const spots = v ? [[4, 4], [11, 9]] : [[3, 10], [10, 3], [12, 12]];
      spots.forEach(([x, y], i) => {
        const c = G.flo[(i + v) % 2], s = i % 2 ? sw : -sw;
        P(g, x, y + 2, G.dark); P(g, x, y + 3, G.dark);
        R(g, x - 1 + s, y, 3, 1, c); R(g, x + s, y - 1, 1, 3, c); P(g, x + s, y, '#f0a020');
      });
    });
  }
  function pathTile(v) {
    return tc('path' + v, g => {
      R(g, 0, 0, 16, 16, '#d8b070');
      for (let i = 0; i < 6; i++) { const x = Math.floor(hash(i, v, 21) * 15), y = Math.floor(hash(v, i, 23) * 15); P(g, x, y, '#b48a50'); P(g, x + 1, y, '#f0d498'); }
      if (v === 1) { R(g, 6, 7, 3, 2, '#a88050'); P(g, 6, 7, '#e8c890'); }
    });
  }
  function sandTile(v) {
    return tc('sand' + v, g => {
      R(g, 0, 0, 16, 16, '#f0d898');
      for (let i = 0; i < 5; i++) { const x = Math.floor(hash(i, v, 31) * 15), y = Math.floor(hash(v, i, 33) * 15); P(g, x, y, '#d0b070'); }
      R(g, 2 + v * 3, 5, 4, 1, '#e0c480'); R(g, 8 - v, 11, 5, 1, '#e0c480'); P(g, 9, 3, '#fff0c8');
    });
  }
  function waterBase(fr, red) {
    return tc('wat' + fr + (red ? 'r' : ''), g => {
      const base = red ? '#c83a1c' : '#3474d0', deep = red ? '#a02810' : '#2860b8', hi = red ? '#f07838' : '#70acf0';
      R(g, 0, 0, 16, 16, base);
      DITH(g, 0, 0, 16, 16, deep, 0); R(g, 0, 0, 16, 16, 'rgba(0,0,0,0)');
      g.fillStyle = base; for (let y = 0; y < 16; y += 2) g.fillRect(0, y, 16, 1);
      if (red) { // tomato sauce: bubbles that swell and pop
        const b = [[4, 4], [11, 10], [9, 3], [3, 12]];
        b.forEach(([x, y], i) => { const s = (fr + i) % 4; if (s === 1) P(g, x, y, hi); if (s === 2) { R(g, x - 1, y - 1, 3, 3, hi); P(g, x, y, base); P(g, x - 1, y - 1, '#ffb070'); } if (s === 3) { P(g, x - 2, y, hi); P(g, x + 2, y, hi); P(g, x, y - 2, hi); } });
      } else {
        const o = fr * 2;
        for (let k = 0; k < 2; k++) { const y = 4 + k * 8, x = (o + k * 7) % 16; R(g, x, y, 3, 1, hi); R(g, (x + 3) % 16, y - 1, 2, 1, hi); }
        P(g, (3 + fr * 4) % 16, 9, '#c8e4ff');
      }
    });
  }
  function treeTile(G, nb) { // nb: bitmask of tree neighbours (1 up, 2 down, 4 left, 8 right)
    return tc('tree' + G.base + nb, g => {
      g.drawImage(grassTile(G, 0), 0, 0);
      const dk = shade(G.deep, 0.8), md = G.deep, lt = G.dark, hl = G.light;
      if (!(nb & 2)) { g.fillStyle = 'rgba(0,30,0,.35)'; g.beginPath(); g.ellipse(9, 14, 7, 2.5, 0, 0, 7); g.fill(); R(g, 6, 11, 4, 5, '#6a4020'); R(g, 6, 11, 1, 5, '#8a5a30'); R(g, 9, 11, 1, 5, '#4a2810'); }
      g.fillStyle = dk;
      g.beginPath(); g.arc(8, 7, 7.5, 0, 7); g.fill();
      if (nb & 1) R(g, 0.5, 0, 15, 7, dk); if (nb & 2) R(g, 0.5, 7, 15, 9, dk); if (nb & 4) R(g, 0, 0.5, 8, nb & 2 ? 15.5 : 13, dk); if (nb & 8) R(g, 8, 0.5, 8, nb & 2 ? 15.5 : 13, dk);
      g.fillStyle = md; g.beginPath(); g.arc(7.5, 6.5, 6, 0, 7); g.fill();
      if (nb & 1) R(g, 1.5, 0, 13, 6, md); if (nb & 2) R(g, 1.5, 7, 13, 9, md); if (nb & 4) R(g, 0, 1.5, 8, 11, md); if (nb & 8) R(g, 8, 1.5, 8, 11, md);
      g.fillStyle = lt; g.beginPath(); g.arc(6.5, 5, 3.8, 0, 7); g.fill(); g.beginPath(); g.arc(11, 8, 2.4, 0, 7); g.fill(); g.beginPath(); g.arc(4, 10, 2, 0, 7); g.fill();
      P(g, 5, 3, hl); P(g, 6, 3, hl); P(g, 4, 4, hl); P(g, 10, 7, hl); P(g, 3, 9, hl); P(g, 8, 5, hl);
      P(g, 9, 11, dk); P(g, 12, 4, dk); P(g, 2, 7, dk); P(g, 7, 9, dk);
      // keep the tile's crisp pixels (no anti-aliasing)
      const im = g.getImageData(0, 0, 16, 16); for (let i = 3; i < im.data.length; i += 4) im.data[i] = 255; g.putImageData(im, 0, 0);
    });
  }
  function bushOn(g, ox, oy, under) {
    if (under) g.drawImage(under, ox, oy);
    g.drawImage(SPR_BUSH, ox, oy);
  }
  let SPR_BUSH, SPR_ROCK, SPR_POT, SPR_SIGN, SPR_GRAVE, SPR_BOULDER;
  function buildObjSprites() {
    SPR_BUSH = mk(16, 16, g => {
      E(g, 8, 13, 7, 2.5, 'rgba(0,30,0,.45)');
      E(g, 8, 8.5, 7, 6, '#2e7a26'); E(g, 7.5, 7.5, 6, 5, '#4ea83a'); E(g, 6, 6, 3, 2.5, '#78c850');
      P(g, 4, 5, '#a8e878'); P(g, 5, 4, '#a8e878'); P(g, 10, 6, '#78c850'); P(g, 11, 7, '#a8e878');
      P(g, 9, 10, '#2e7a26'); P(g, 5, 10, '#2e7a26'); P(g, 12, 9, '#2e7a26'); P(g, 8, 4, '#2e7a26');
    }, OUT);
    SPR_ROCK = mk(16, 16, g => {
      E(g, 8, 13, 7, 2.5, 'rgba(0,0,0,.35)');
      E(g, 8, 9, 6.5, 5.5, '#6a6a7a'); E(g, 7.5, 8, 5.5, 4.5, '#9a9aa8'); E(g, 6, 6.5, 2.5, 1.5, '#d0d0dc');
      P(g, 10, 10, '#55556a'); P(g, 11, 9, '#55556a'); P(g, 5, 10, '#7a7a8a');
    }, OUT);
    SPR_BOULDER = mk(16, 16, g => {
      R(g, 1, 2, 14, 13, '#6a6070'); R(g, 2, 1, 12, 14, '#6a6070');
      R(g, 2, 2, 11, 10, '#9a90a0'); R(g, 3, 2, 6, 3, '#c8c0d0');
      g.fillStyle = '#3a3040'; [[8, 3], [7, 4], [7, 5], [8, 6], [9, 7], [8, 8], [5, 7], [6, 7], [10, 9], [11, 10], [4, 10], [5, 11]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
      R(g, 1, 13, 14, 2, '#4a4050');
    }, OUT);
    SPR_POT = mk(16, 16, g => {
      E(g, 8, 14, 6, 2, 'rgba(0,0,0,.4)');
      E(g, 8, 9.5, 6, 5, '#a85a30'); E(g, 7, 8.5, 4.5, 4, '#d0804a'); R(g, 5, 2, 6, 3, '#a85a30'); R(g, 4, 2, 8, 1, '#d0804a');
      R(g, 6, 3, 4, 1, '#3a2010'); P(g, 5, 7, '#f0b080'); P(g, 6, 6, '#f0b080'); R(g, 3, 10, 10, 1, '#7a3a1a');
    }, OUT);
    SPR_SIGN = mk(16, 16, g => {
      E(g, 8, 14.5, 5, 1.5, 'rgba(0,0,0,.35)');
      R(g, 7, 9, 2, 6, '#6a4020'); R(g, 2, 2, 12, 8, '#b07838'); R(g, 2, 2, 12, 1, '#e0a860'); R(g, 2, 9, 12, 1, '#7a4a20');
      R(g, 4, 4, 8, 1, '#5a3010'); R(g, 4, 6, 6, 1, '#5a3010');
    }, OUT);
    SPR_GRAVE = mk(16, 16, g => {
      E(g, 9, 14, 7, 2, 'rgba(0,0,0,.4)');
      R(g, 3, 4, 10, 10, '#8a8aa0'); E(g, 8, 4.5, 5, 3.5, '#8a8aa0'); R(g, 4, 4, 7, 9, '#a8a8c0'); E(g, 7.5, 4.5, 3.5, 2.5, '#a8a8c0');
      R(g, 7, 3, 2, 7, '#5a5a72'); R(g, 5, 5, 6, 2, '#5a5a72'); R(g, 2, 13, 12, 2, '#6a6a80');
    }, OUT);
  }
  // snap every pixel to the nearest colour of a small palette (keeps code-drawn shapes crisp, like real pixel art)
  function quant(c, pal) {
    const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, P2 = pal.map(hexRGB);
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 100) { d[i + 3] = 0; continue; } let best = 0, bd = 1e9; for (let k = 0; k < P2.length; k++) { const q = P2[k], e = (q[0] - d[i]) ** 2 + (q[1] - d[i + 1]) ** 2 + (q[2] - d[i + 2]) ** 2; if (e < bd) { bd = e; best = k; } } d[i] = P2[best][0]; d[i + 1] = P2[best][1]; d[i + 2] = P2[best][2]; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  }
  let ROCKTEX = null;
  function rockTex() { // a 64x64 seamless cliff face: rounded lumps of rock, lit from the top left
    if (ROCKTEX) return ROCKTEX;
    const N = 64, c = cnv(N, N), g = c.getContext('2d');
    R(g, 0, 0, N, N, '#5a3418');
    const lumps = []; for (let i = 0; i < 30; i++) lumps.push([hash(i, 1, 71) * N, hash(i, 2, 71) * N, 5 + hash(i, 3, 71) * 5, 3 + hash(i, 4, 71) * 3, hash(i, 5, 71)]);
    lumps.sort((p, q) => p[1] - q[1]);
    const each = fn => { for (const L of lumps) for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) fn(L[0] + ox, L[1] + oy, L[2], L[3], L[4]); };
    each((x, y, rx, ry) => E(g, x + 1, y + 1.5, rx, ry, '#7a4a24'));
    each((x, y, rx, ry, k) => E(g, x, y, rx, ry, k > 0.5 ? '#b07a48' : '#a06c3e'));
    each((x, y, rx, ry) => E(g, x - rx * 0.3, y - ry * 0.35, rx * 0.55, ry * 0.4, '#c8925a'));
    each((x, y, rx, ry) => E(g, x - rx * 0.45, y - ry * 0.55, rx * 0.25, ry * 0.18, '#e0ae70'));
    return ROCKTEX = quant(c, ['#5a3418', '#7a4a24', '#a06c3e', '#b07a48', '#c8925a', '#e0ae70']);
  }
  function cliffTile(nb, G, v, tx, ty) { // nb: 1 cliff above, 2 below, 4 left, 8 right
    const sx = ((tx | 0) & 3) * 16, sy = ((ty | 0) & 3) * 16;
    return tc('cl' + nb + G.base + sx + '_' + sy, g => {
      g.drawImage(rockTex(), sx, sy, 16, 16, 0, 0, 16, 16);
      if (!(nb & 4)) { R(g, 0, 0, 1, 16, '#4a2810'); g.fillStyle = 'rgba(40,20,0,.35)'; g.fillRect(1, 0, 2, 16); }
      if (!(nb & 8)) { R(g, 15, 0, 1, 16, '#3a1e08'); g.fillStyle = 'rgba(30,10,0,.45)'; g.fillRect(12, 0, 3, 16); }
      if (!(nb & 1)) { // the grassy top edge hanging over the rock
        R(g, 0, 0, 16, 3, G.base); for (let i = 0; i < 16; i++) { const d = (hash(i + sx, sy, 29) * 2.6) | 0; R(g, i, 3, 1, d, G.base); P(g, i, 3 + d, G.deep); P(g, i, 4 + d, '#4a2810'); }
        P(g, 3, 1, G.light); P(g, 9, 0, G.light); P(g, 13, 1, G.dark);
      }
      if (!(nb & 2)) { R(g, 0, 15, 16, 1, '#3a1e08'); g.fillStyle = 'rgba(30,10,0,.4)'; g.fillRect(0, 12, 16, 3); }
    });
  }
  function caveMouth(G) {
    return tc('cave' + G.base, g => {
      g.drawImage(cliffTile(15, G, 1, 1, 1), 0, 0);
      R(g, 2, 3, 12, 13, '#3a2410'); E(g, 8, 4, 6, 3, '#3a2410');
      R(g, 3, 4, 10, 12, '#0c0608'); E(g, 8, 4.5, 5, 2.5, '#0c0608');
      R(g, 1, 3, 1, 13, '#d8a468');
    });
  }
  function fenceTile(G, nb) {
    return tc('fen' + G.base + nb, g => {
      g.drawImage(grassTile(G, 0), 0, 0);
      R(g, 0, 13, 16, 2, 'rgba(0,30,0,.3)');
      R(g, nb & 4 ? 0 : 3, 5, nb & 4 ? (nb & 8 ? 16 : 10) : (nb & 8 ? 13 : 7), 2, '#c88a48'); R(g, nb & 4 ? 0 : 3, 9, nb & 4 ? (nb & 8 ? 16 : 10) : (nb & 8 ? 13 : 7), 2, '#a06a30');
      R(g, 3, 2, 3, 12, '#8a5a28'); R(g, 3, 2, 1, 12, '#c88a48'); R(g, 3, 2, 3, 1, '#e0a868');
      R(g, 10, 2, 3, 12, '#8a5a28'); R(g, 10, 2, 1, 12, '#c88a48'); R(g, 10, 2, 3, 1, '#e0a868');
    });
  }
  function bridgeTile(fr) {
    return tc('br' + fr, g => {
      g.drawImage(waterBase(fr), 0, 0);
      R(g, 0, 2, 16, 12, '#a06a34');
      for (let x = 0; x < 16; x += 4) { R(g, x, 2, 1, 12, '#6a4018'); R(g, x + 1, 2, 1, 12, '#c88c50'); }
      R(g, 0, 1, 16, 2, '#5a3412'); R(g, 0, 13, 16, 2, '#5a3412'); R(g, 0, 15, 16, 1, 'rgba(0,0,40,.35)');
      R(g, 6, 0, 3, 3, '#7a4a20'); R(g, 6, 13, 3, 3, '#7a4a20');
    });
  }
  function stairsTile() {
    return tc('stairs', g => {
      R(g, 0, 0, 16, 16, '#3a3040');
      for (let i = 0; i < 4; i++) { R(g, 1 + i, 2 + i * 3, 14 - i * 2, 3, i % 2 ? '#7a7088' : '#8a809a'); R(g, 1 + i, 2 + i * 3, 14 - i * 2, 1, '#b0a8c0'); }
      R(g, 4, 14, 8, 2, '#0a0610');
    });
  }
  function wellTile(G) {
    return tc('well' + G.base, g => {
      g.drawImage(grassTile(G, 0), 0, 0);
      E(g, 9, 13, 8, 3, 'rgba(0,0,0,.35)');
      E(g, 8, 8, 7.5, 6.5, '#7a7a8a'); E(g, 8, 7.5, 6.5, 5.5, '#a8a8b8'); E(g, 8, 7.5, 4.5, 3.5, '#20304a'); E(g, 8, 8, 3, 2, '#3868a8'); P(g, 7, 7, '#a8d0ff');
      for (let a = 0; a < 6; a++) { const x = 8 + Math.cos(a) * 6, y = 7.5 + Math.sin(a) * 5; P(g, x | 0, y | 0, '#5a5a6a'); }
    });
  }

  // ---- indoors and the dungeon
  function woodFloor(v) {
    return tc('wood' + v, g => {
      R(g, 0, 0, 16, 16, '#b8804a');
      for (let y = 0; y < 16; y += 4) { R(g, 0, y, 16, 1, '#8a5a30'); const o = ((y / 4 + v) % 2) * 8; R(g, o + 3, y + 1, 1, 3, '#8a5a30'); R(g, 0, y + 1, 16, 1, '#c89060'); }
      P(g, 5 + v, 6, '#9a6a3a'); P(g, 11, 10 - v, '#9a6a3a');
    });
  }
  function caveFloor(v) {
    return tc('cvf' + v, g => {
      R(g, 0, 0, 16, 16, '#6a5a52');
      for (let i = 0; i < 7; i++) { const x = Math.floor(hash(i, v, 41) * 14), y = Math.floor(hash(v, i, 43) * 14); R(g, x, y, 2, 1, '#55463e'); P(g, x, y - 1 < 0 ? 0 : y - 1, '#857268'); }
    });
  }
  function dgFloor(v) {
    return tc('dgf' + v, g => {
      R(g, 0, 0, 16, 16, '#565c78');
      R(g, 0, 0, 8, 8, '#5c6280'); R(g, 8, 8, 8, 8, '#5c6280');
      R(g, 0, 0, 16, 1, '#6c7494'); R(g, 0, 8, 16, 1, '#6c7494'); R(g, 0, 0, 1, 16, '#6c7494'); R(g, 8, 0, 1, 16, '#6c7494');
      R(g, 0, 7, 16, 1, '#444a62'); R(g, 0, 15, 16, 1, '#444a62'); R(g, 7, 0, 1, 16, '#444a62'); R(g, 15, 0, 1, 16, '#444a62');
      if (v === 1) { E(g, 4, 4, 1.5, 1.5, '#2a2e40'); P(g, 3, 5, '#7a84a8'); E(g, 12, 12, 1.5, 1.5, '#2a2e40'); P(g, 11, 13, '#7a84a8'); } // colander holes
      if (v === 2) { P(g, 11, 3, '#444a62'); P(g, 12, 4, '#444a62'); P(g, 3, 12, '#6c7494'); }
    });
  }
  function dgBlock(kind) { // a raised stone block (#), the push block (B), a statue (S)
    return tc('dgb' + kind, g => {
      g.drawImage(dgFloor(0), 0, 0);
      if (kind === 'S') {
        R(g, 2, 11, 12, 5, '#3a3e52'); R(g, 3, 10, 10, 2, '#7a80a0'); R(g, 4, 12, 8, 3, '#5a607c');
        R(g, 5, 2, 6, 9, '#8a90b0'); R(g, 5, 2, 2, 9, '#a8b0d0'); R(g, 10, 2, 1, 9, '#5a607c'); // a big fork, standing on its handle
        R(g, 4, 0, 1, 4, '#a8b0d0'); R(g, 7, 0, 1, 3, '#a8b0d0'); R(g, 9, 0, 1, 3, '#a8b0d0'); R(g, 11, 0, 1, 4, '#8a90b0'); R(g, 4, 3, 8, 2, '#8a90b0');
        return;
      }
      const top = kind === 'B' ? '#a8a4b8' : '#7c84a4', side = kind === 'B' ? '#6a6680' : '#464c66', hi = kind === 'B' ? '#d8d4e8' : '#a4acc8';
      R(g, 0, 0, 16, 16, '#22263a'); R(g, 1, 1, 14, 11, top); R(g, 1, 12, 14, 3, side);
      R(g, 1, 1, 14, 1, hi); R(g, 1, 1, 1, 11, hi); R(g, 14, 1, 1, 11, side);
      if (kind === 'B') { R(g, 4, 4, 8, 5, '#8a86a0'); R(g, 5, 5, 6, 3, '#c8c4d8'); P(g, 3, 3, '#5a5670'); P(g, 12, 3, '#5a5670'); P(g, 3, 10, '#5a5670'); P(g, 12, 10, '#5a5670'); }
      else { R(g, 4, 5, 8, 1, '#5c6484'); R(g, 4, 8, 8, 1, '#5c6484'); }
    });
  }
  function torchTile(fr) {
    return tc('torch' + fr, g => {
      g.drawImage(dgFloor(0), 0, 0);
      E(g, 8, 14, 6, 2, 'rgba(0,0,0,.45)');
      R(g, 4, 9, 8, 6, '#4a4e66'); R(g, 4, 9, 8, 1, '#8a90b0'); R(g, 3, 7, 10, 3, '#6a5040'); R(g, 3, 7, 10, 1, '#a8805a');
      const f = [[0, 0], [1, -1], [0, -2], [-1, -1]][fr];
      g.fillStyle = '#e83818'; g.beginPath(); g.moveTo(4, 7); g.quadraticCurveTo(5 + f[0], 1 + f[1], 8 + f[0], -1 + f[1] * 0.5); g.quadraticCurveTo(11 + f[0], 2, 12, 7); g.fill();
      g.fillStyle = '#f8a020'; g.beginPath(); g.moveTo(5.5, 7); g.quadraticCurveTo(7 + f[0], 3 + f[1], 8 + f[0], 1); g.quadraticCurveTo(10, 4, 10.5, 7); g.fill();
      g.fillStyle = '#fff0a0'; g.beginPath(); g.ellipse(8 + f[0] * 0.5, 6, 1.5, 2, 0, 0, 7); g.fill();
      const im = g.getImageData(0, 0, 16, 16); for (let i = 3; i < im.data.length; i += 4) im.data[i] = 255; g.putImageData(im, 0, 0);
    });
  }
  function colourBlock(col, up) { // the crystal switch's orange and blue blocks, raised or lowered
    return tc('cb' + col + up, g => {
      g.drawImage(dgFloor(0), 0, 0);
      const c = col === 'o' ? ['#f08828', '#b05010', '#ffc070'] : ['#3a78e8', '#1a3ca0', '#90c0ff'];
      if (up) { R(g, 0, 0, 16, 16, '#1a1020'); R(g, 1, 1, 14, 11, c[0]); R(g, 1, 12, 14, 3, c[1]); R(g, 1, 1, 14, 1, c[2]); R(g, 1, 1, 1, 11, c[2]); R(g, 5, 4, 6, 5, c[1]); R(g, 6, 5, 4, 3, c[2]); }
      else { R(g, 1, 1, 14, 14, c[1]); R(g, 2, 2, 12, 12, '#565c78'); R(g, 3, 3, 10, 10, shade(c[1], 0.8)); R(g, 4, 4, 8, 8, '#4a506a'); }
    });
  }
  function crystalTile(state) {
    return tc('cry' + state, g => {
      g.drawImage(dgFloor(0), 0, 0);
      E(g, 8, 14, 6, 2, 'rgba(0,0,0,.4)'); R(g, 4, 10, 8, 5, '#4a4e66'); R(g, 4, 10, 8, 1, '#9aa0c0');
      const c = state ? ['#3a78e8', '#90c0ff', '#1a3ca0'] : ['#f08828', '#ffd090', '#b05010'];
      g.fillStyle = c[2]; g.beginPath(); g.moveTo(8, 0); g.lineTo(13, 5); g.lineTo(8, 11); g.lineTo(3, 5); g.fill();
      g.fillStyle = c[0]; g.beginPath(); g.moveTo(8, 1); g.lineTo(12, 5); g.lineTo(8, 10); g.lineTo(4, 5); g.fill();
      g.fillStyle = c[1]; g.beginPath(); g.moveTo(8, 1); g.lineTo(8, 5); g.lineTo(4, 5); g.fill(); P(g, 6, 3, '#fff');
      const im = g.getImageData(0, 0, 16, 16); for (let i = 3; i < im.data.length; i += 4) im.data[i] = 255; g.putImageData(im, 0, 0);
    });
  }
  function switchTile(on) {
    return tc('sw' + on, g => {
      g.drawImage(dgFloor(0), 0, 0);
      R(g, 2, 2, 12, 12, '#2a2e40'); R(g, 3, 3, 10, 10, on ? '#7a6a3a' : '#c8a048'); if (!on) { R(g, 3, 3, 10, 1, '#f8d880'); R(g, 3, 12, 10, 1, '#8a6a20'); }
      R(g, 6, 6, 4, 4, on ? '#5a4a28' : '#f0c860');
    });
  }
  function gateTile(up) {
    return tc('gate' + up, g => {
      g.drawImage(dgFloor(0), 0, 0);
      if (up) { E(g, 8, 15, 7, 1.5, 'rgba(0,0,0,.4)'); for (let x = 1; x < 16; x += 4) { R(g, x, 0, 2, 15, '#8a90a8'); R(g, x, 0, 1, 15, '#d0d4e8'); R(g, x - 1, 13, 4, 2, '#4a4e66'); } R(g, 0, 3, 16, 2, '#5a6078'); R(g, 0, 3, 16, 1, '#a0a8c0'); }
      else { for (let x = 1; x < 16; x += 4) R(g, x, 6, 2, 4, '#3a3e52'); R(g, 0, 7, 16, 2, '#3a3e52'); }
    });
  }
  function chestImg(big, open) {
    return tc('chest' + big + open, g => {
      const body = big ? '#c03a2a' : '#a8682e', dark = big ? '#7a1a18' : '#6a3e18', trim = '#f0c040', trimD = '#a87a18';
      E(g, 8, 14.5, 7.5, 2, 'rgba(0,0,0,.45)');
      if (!open) {
        R(g, 1, 3, 14, 12, '#1a1020'); R(g, 2, 4, 12, 4, body); R(g, 2, 4, 12, 1, shade(body, 1.3)); R(g, 2, 8, 12, 6, shade(body, 0.85)); R(g, 2, 13, 12, 1, dark);
        R(g, 2, 7, 12, 1, dark); R(g, 2, 4, 1, 10, trim); R(g, 13, 4, 1, 10, trim); R(g, 7, 6, 2, 4, trim); P(g, 7, 9, trimD); P(g, 8, 8, '#1a1020');
      } else {
        R(g, 1, 5, 14, 10, '#1a1020'); R(g, 2, 2, 12, 4, shade(body, 0.7)); R(g, 2, 2, 12, 1, trim); R(g, 1, 1, 14, 1, '#1a1020');
        R(g, 2, 6, 12, 2, '#100808'); R(g, 2, 8, 12, 6, shade(body, 0.85)); R(g, 2, 13, 12, 1, dark); R(g, 2, 8, 1, 6, trim); R(g, 13, 8, 1, 6, trim);
      }
    });
  }

  // ================================================================ PEOPLE: one pixel painter, many styles (16x24, feet at y 22)
  // light comes from the top left: left edges a step lighter, right edges a step darker
  const STY = {
    hero: { skin: '#f8c498', hair: '#b8642c', band: '#e8383a', top: '#3a7ae0', legs: '#e8dcc0', boot: '#86482a', belt: '#6a3a1a', buck: '#f8d040', tails: 1 },
    mom: { skin: '#f8c498', hair: '#7a3a20', top: '#d8507a', legs: '#d8507a', boot: '#5a3020', apron: '#f8f0e0', bun: 1, dress: 1 },
    elder: { skin: '#f0b888', hair: '#e8e8f0', top: '#e0b830', legs: '#e0b830', boot: '#6a4020', beard: '#f4f4f8', bald: 1, dress: 1, cane: 1 },
    mabel: { skin: '#f8c498', hair: '#d0702a', top: '#4aa860', legs: '#3a6a40', boot: '#5a3020', apron: '#f8e8c8', bun: 1, dress: 1 },
    nonna: { skin: '#f0b888', hair: '#c8c8d8', top: '#8a4a9a', legs: '#6a3a7a', boot: '#3a2020', shawl: '#c8506a', bun: 1, dress: 1, glasses: 1 },
    dave: { skin: '#f8c498', hair: '#e8c048', top: '#e85020', legs: '#3a4a8a', boot: '#2a2a2a', cap: '#2a5ad0' },
    luke: { skin: '#f8c498', hair: '#5a3018', top: '#2aa070', legs: '#4a4a6a', boot: '#2a2a2a', glasses: 1 },
    cal: { skin: '#f8c498', hair: '#2a2028', top: '#5a5a6a', legs: '#2a3a5a', boot: '#2a2a2a', phones: 1 },
    fisher: { skin: '#e8b080', hair: '#8a6a4a', top: '#e8c020', legs: '#3a5a8a', boot: '#3a3020', hat: '#e8c020', beard: '#8a6a4a' },
    lady: { skin: '#f8c498', hair: '#2a1a1a', top: '#4a7ad0', legs: '#4a7ad0', boot: '#5a3020', apron: '#f8f0e0', dress: 1, long: 1 },
    zeldo: { skin: '#f8d0a8', hair: '#f8d050', top: '#f0a0d0', legs: '#f0a0d0', boot: '#c060a0', dress: 1, long: 1, crown: 1 },
  };
  const PEOPLE = {};
  function personFrames(name, shield) {
    const key = name + (shield ? 's' : ''); if (PEOPLE[key]) return PEOPLE[key];
    const S = STY[name], out = {};
    for (const pose of ['walk', 'attack', 'carry', 'get', 'charge']) for (let dir = 0; dir < 3; dir++) for (let ph = 0; ph < 4; ph++) {
      if (pose !== 'walk' && ph) continue; if (pose === 'get' && dir) continue;
      const c = mk(16, 24, g => paintPerson(g, S, dir, pose, ph, shield), OUT);
      out[pose + dir + ph] = c; if (dir === 2) out[pose + 3 + ph] = flipH(c);
    }
    return PEOPLE[key] = out;
  }
  function paintPerson(g, S, dir, pose, ph, shield) {
    const sk = S.skin, skD = shade(sk, 0.8), hr = S.hair, hrD = shade(hr, 0.7), hrL = shade(hr, 1.25);
    const tp = S.top, tpD = shade(tp, 0.72), tpL = shade(tp, 1.25), lg = S.legs, lgD = shade(lg, 0.75), bt = S.boot, btD = shade(bt, 0.7);
    const step = pose === 'walk' ? [0, 1, 0, -1][ph] : 0; // -1 / +1: which leg is forward
    const bob = pose === 'walk' && (ph === 1 || ph === 3) ? 1 : 0; // the body dips a pixel on each step
    const armsUp = pose === 'carry' || pose === 'get';
    const y0 = bob;
    if (dir === 0 || dir === 1) {
      // ---- legs and boots
      if (!S.dress) {
        const lL = step > 0 ? -1 : 0, rL = step < 0 ? -1 : 0;
        R(g, 5, 17 + y0, 2, 3 + lL, lg); R(g, 9, 17 + y0, 2, 3 + rL, lgD); R(g, 5, 17 + y0, 1, 2, shade(lg, 1.15));
        R(g, 4, 20 + lL, 3, 2, bt); R(g, 9, 20 + rL, 3, 2, bt); R(g, 4, 21 + lL, 3, 1, btD); R(g, 9, 21 + rL, 3, 1, btD); P(g, 4, 20 + lL, shade(bt, 1.3));
      } else {
        R(g, 3, 16 + y0, 10, 5 - y0, lg); R(g, 3, 16 + y0, 2, 5 - y0, shade(lg, 1.15)); R(g, 11, 16 + y0, 2, 5 - y0, lgD); R(g, 3, 20, 10, 1, lgD);
        R(g, 5 + (step > 0 ? -1 : 0), 21, 2, 1, bt); R(g, 9 + (step < 0 ? 1 : 0), 21, 2, 1, bt);
      }
      // ---- body
      R(g, 4, 11 + y0, 8, 7, tp); R(g, 4, 11 + y0, 2, 6, tpL); R(g, 10, 11 + y0, 2, 7, tpD);
      if (!S.dress) { R(g, 3, 16 + y0, 10, 2, tp); R(g, 3, 17 + y0, 10, 1, tpD); }
      if (S.belt) { R(g, 4, 15 + y0, 8, 1, S.belt); if (dir === 0) R(g, 7, 15 + y0, 2, 1, S.buck); }
      if (S.apron && dir === 0) { R(g, 5, 13 + y0, 6, 7, S.apron); R(g, 5, 13 + y0, 6, 1, shade(S.apron, 0.85)); R(g, 10, 14 + y0, 1, 6, shade(S.apron, 0.85)); }
      if (S.shawl) { R(g, 3, 11 + y0, 10, 3, S.shawl); R(g, 3, 13 + y0, 10, 1, shade(S.shawl, 0.75)); if (dir === 0) { P(g, 7, 14 + y0, S.shawl); P(g, 8, 14 + y0, S.shawl); } }
      // ---- arms
      if (armsUp) {
        R(g, 2, 3 + y0, 2, 9, tp); R(g, 12, 3 + y0, 2, 9, tpD); R(g, 2, 1, 2, 2, sk); R(g, 12, 1, 2, 2, skD);
      } else if (pose === 'attack' || pose === 'charge') {
        if (dir === 0) { R(g, 3, 12 + y0, 2, 4, tpL); R(g, 11, 12 + y0, 2, 4, tpD); R(g, 5, 16 + y0, 2, 2, sk); R(g, 9, 16 + y0, 2, 2, skD); }
        else { R(g, 3, 11, 2, 4, tpL); R(g, 11, 11, 2, 4, tpD); R(g, 5, 9, 2, 2, sk); R(g, 9, 9, 2, 2, skD); }
      } else {
        const aL = dir === 0 ? step : -step;
        R(g, 2, 12 + y0 + aL, 2, 4, tpL); R(g, 12, 12 + y0 - aL, 2, 4, tpD); R(g, 2, 16 + y0 + aL, 2, 2, sk); R(g, 12, 16 + y0 - aL, 2, 2, skD);
      }
      if (S.cane && dir === 0) { R(g, 13, 12 + y0, 1, 10 - y0, '#8a5a28'); R(g, 12, 11 + y0, 3, 1, '#6a4018'); }
      // ---- head
      const hy = y0;
      if (dir === 0) {
        R(g, 4, 5 + hy, 8, 5, sk); R(g, 5, 10 + hy, 6, 1, sk); R(g, 11, 5 + hy, 1, 5, skD); P(g, 10, 10 + hy, skD); R(g, 6, 11 + hy, 4, 1, skD);
        if (S.long) { R(g, 2, 4 + hy, 2, 10, hr); R(g, 12, 4 + hy, 2, 10, hrD); }
        if (!S.bald) {
          R(g, 3, 2 + hy, 10, 4, hr); R(g, 4, 1 + hy, 8, 1, hr); R(g, 5, 0 + hy, 6, 1, hr); R(g, 5, 1 + hy, 3, 1, hrL); R(g, 4, 2 + hy, 2, 1, hrL); R(g, 10, 2 + hy, 2, 3, hrD); R(g, 12, 3 + hy, 1, 3, hrD);
          R(g, 3, 5 + hy, 1, 4, hr); R(g, 12, 5 + hy, 1, 4, hrD); // side locks
          if (S.band) { P(g, 5, 0 + hy, hrL); P(g, 9, 0 + hy, hr); } else { R(g, 5, 5 + hy, 2, 1, hr); R(g, 9, 5 + hy, 2, 1, hr); }
        } else { R(g, 4, 2 + hy, 8, 4, sk); R(g, 5, 2 + hy, 3, 1, shade(sk, 1.15)); R(g, 3, 4 + hy, 1, 4, hr); R(g, 12, 4 + hy, 1, 4, hr); }
        if (S.bun) { R(g, 6, -0 + hy, 4, 2, hrD); R(g, 7, 0 + hy, 2, 1, hrL); }
        if (S.band) { R(g, 3, 3 + hy, 10, 2, S.band); R(g, 3, 4 + hy, 10, 1, shade(S.band, 0.7)); R(g, 3, 3 + hy, 3, 1, shade(S.band, 1.3)); R(g, 13, 4 + hy, 2, 2, S.band); R(g, 14, 6 + hy + (ph & 1), 1, 2, shade(S.band, 0.7)); }
        if (S.cap) { R(g, 3, 1 + hy, 10, 3, S.cap); R(g, 3, 1 + hy, 4, 1, shade(S.cap, 1.3)); R(g, 3, 4 + hy, 10, 1, shade(S.cap, 0.6)); R(g, 6, 0 + hy, 4, 1, S.cap); }
        if (S.hat) { R(g, 1, 3 + hy, 14, 2, S.hat); R(g, 4, 0 + hy, 8, 3, S.hat); R(g, 4, 0 + hy, 3, 1, shade(S.hat, 1.3)); R(g, 1, 4 + hy, 14, 1, shade(S.hat, 0.7)); }
        if (S.crown) { R(g, 4, -0 + hy, 8, 2, '#f8d040'); P(g, 4, 0 + hy, '#f8f0a0'); P(g, 7, 0 + hy, '#e83a6a'); P(g, 8, 0 + hy, '#e83a6a'); }
        if (S.phones) { R(g, 2, 5 + hy, 2, 3, '#3a3a4a'); R(g, 12, 5 + hy, 2, 3, '#3a3a4a'); R(g, 3, 0 + hy, 10, 1, '#3a3a4a'); }
        // eyes: tall, with a white glint; a little blush
        if (!(pose === 'get')) { R(g, 5, 7 + hy, 2, 2, '#1a2058'); R(g, 9, 7 + hy, 2, 2, '#1a2058'); P(g, 5, 7 + hy, '#fff'); P(g, 9, 7 + hy, '#fff'); }
        else { R(g, 5, 8 + hy, 2, 1, '#1a2058'); R(g, 9, 8 + hy, 2, 1, '#1a2058'); R(g, 7, 10 + hy, 2, 1, '#a83a3a'); }
        if (S.glasses) { R(g, 4, 7 + hy, 3, 1, '#2a2a3a'); R(g, 9, 7 + hy, 3, 1, '#2a2a3a'); P(g, 7, 7 + hy, '#2a2a3a'); P(g, 8, 7 + hy, '#2a2a3a'); }
        P(g, 4, 9 + hy, '#f09888'); P(g, 11, 9 + hy, '#e08070');
        if (S.beard) { R(g, 4, 9 + hy, 8, 4, S.beard); R(g, 5, 13 + hy, 6, 2, S.beard); R(g, 6, 15 + hy, 4, 1, S.beard); R(g, 10, 10 + hy, 2, 4, shade(S.beard, 0.8)); R(g, 6, 9 + hy, 4, 1, shade(S.beard, 0.85)); }
      } else { // the back of the head
        R(g, 4, 5 + hy, 8, 6, sk);
        if (!S.bald) { R(g, 3, 1 + hy, 10, 9, hr); R(g, 4, 0 + hy, 8, 2, hr); R(g, 4, 1 + hy, 3, 3, hrL); R(g, 10, 2 + hy, 3, 8, hrD); R(g, 4, 10 + hy, 8, 1, hrD); }
        else { R(g, 4, 2 + hy, 8, 6, sk); R(g, 3, 6 + hy, 10, 4, hr); }
        if (S.long) { R(g, 3, 4 + hy, 10, 11, hr); R(g, 10, 4 + hy, 3, 11, hrD); }
        if (S.bun) { R(g, 6, 1 + hy, 4, 3, hrD); R(g, 7, 1 + hy, 2, 1, hrL); }
        if (S.band) { R(g, 3, 3 + hy, 10, 2, S.band); R(g, 3, 4 + hy, 10, 1, shade(S.band, 0.7)); R(g, 7, 5 + hy, 2, 2, S.band); R(g, 6 + (ph & 1), 7 + hy, 1, 3, shade(S.band, 0.8)); R(g, 9 - (ph & 1), 7 + hy, 1, 2, S.band); }
        if (S.cap) { R(g, 3, 1 + hy, 10, 4, S.cap); R(g, 5, 4 + hy, 6, 2, shade(S.cap, 0.6)); }
        if (S.hat) { R(g, 1, 3 + hy, 14, 2, S.hat); R(g, 4, 0 + hy, 8, 3, S.hat); R(g, 1, 4 + hy, 14, 1, shade(S.hat, 0.7)); }
        if (S.crown) { R(g, 4, 0 + hy, 8, 2, '#f8d040'); }
        if (S.phones) { R(g, 2, 5 + hy, 2, 3, '#3a3a4a'); R(g, 12, 5 + hy, 2, 3, '#3a3a4a'); R(g, 3, 0 + hy, 10, 1, '#3a3a4a'); }
      }
      // ---- the shield: on your left arm (the screen's right when you face us)
      if (shield && !armsUp) {
        if (dir === 0 && pose === 'walk') shieldFront(g, 10, 12 + y0);
        else if (dir === 0) shieldFront(g, 11, 10 + y0);
        else R(g, 1, 12 + y0, 2, 6, '#7a4a20');
      }
    } else { // ---- facing right (left is the mirror)
      const sw = pose === 'walk' ? step : 0;
      if (!S.dress) {
        // back leg then front leg
        R(g, 6 - sw, 17 + y0, 2, 3, lgD); R(g, 5 - sw * 2, 20, 3, 2, btD);
        R(g, 8 + sw, 17 + y0, 2, 3, lg); R(g, 8 + sw * 2, 20, 4, 2, bt); P(g, 8 + sw * 2, 20, shade(bt, 1.3));
      } else { R(g, 4, 16 + y0, 8, 5 - y0, lg); R(g, 10, 16 + y0, 2, 5 - y0, lgD); R(g, 6 + sw, 21, 3, 1, bt); }
      R(g, 5, 11 + y0, 6, 7, tp); R(g, 5, 11 + y0, 2, 6, tpL); R(g, 10, 11 + y0, 1, 7, tpD);
      if (!S.dress) { R(g, 4, 16 + y0, 8, 2, tp); R(g, 4, 17 + y0, 8, 1, tpD); }
      if (S.belt) R(g, 5, 15 + y0, 6, 1, S.belt);
      if (S.apron) { R(g, 9, 13 + y0, 3, 7, S.apron); }
      if (S.shawl) { R(g, 4, 11 + y0, 8, 3, S.shawl); }
      // the head in profile
      const hy = y0;
      R(g, 5, 4 + hy, 7, 7, sk); R(g, 12, 7 + hy, 1, 2, sk); R(g, 6, 11 + hy, 5, 1, skD); R(g, 5, 10 + hy, 6, 1, skD);
      if (!S.bald) { R(g, 3, 1 + hy, 9, 4, hr); R(g, 4, 0 + hy, 7, 2, hr); R(g, 4, 0 + hy, 3, 2, hrL); R(g, 3, 4 + hy, 4, 5, hr); R(g, 3, 6 + hy, 2, 4, hrD); P(g, 11, 4 + hy, hr); }
      else { R(g, 5, 2 + hy, 6, 3, sk); R(g, 4, 5 + hy, 3, 4, hr); }
      if (S.long) { R(g, 2, 3 + hy, 5, 12, hr); R(g, 2, 8 + hy, 2, 7, hrD); }
      if (S.bun) { R(g, 2, 2 + hy, 3, 3, hrD); }
      if (S.band) { R(g, 4, 3 + hy, 8, 2, S.band); R(g, 4, 4 + hy, 8, 1, shade(S.band, 0.7)); R(g, 1, 4 + hy + (ph & 1), 3, 2, S.band); R(g, 0, 6 + hy - (ph & 1), 2, 2, shade(S.band, 0.75)); }
      if (S.cap) { R(g, 3, 1 + hy, 9, 3, S.cap); R(g, 11, 3 + hy, 3, 1, shade(S.cap, 0.6)); R(g, 1, 3 + hy, 3, 1, S.cap); }
      if (S.hat) { R(g, 1, 3 + hy, 14, 2, S.hat); R(g, 4, 0 + hy, 8, 3, S.hat); R(g, 1, 4 + hy, 14, 1, shade(S.hat, 0.7)); }
      if (S.crown) R(g, 5, 0 + hy, 6, 2, '#f8d040');
      if (S.phones) { R(g, 5, 5 + hy, 3, 3, '#3a3a4a'); R(g, 5, 0 + hy, 2, 5, '#3a3a4a'); }
      if (pose === 'get') R(g, 10, 8 + hy, 2, 1, '#1a2058'); else { R(g, 10, 6 + hy, 1, 3, '#1a2058'); P(g, 10, 6 + hy, '#fff'); }
      if (S.glasses) { R(g, 9, 6 + hy, 3, 1, '#2a2a3a'); }
      P(g, 9, 9 + hy, '#f09888');
      if (S.beard) { R(g, 8, 9 + hy, 5, 4, S.beard); R(g, 9, 13 + hy, 3, 2, S.beard); }
      // arms
      if (armsUp) { R(g, 6, 2 + y0, 2, 10, tp); R(g, 6, 0, 2, 2, sk); }
      else if (pose === 'attack' || pose === 'charge') { R(g, 7, 12 + y0, 5, 2, tp); R(g, 12, 12 + y0, 2, 2, sk); }
      else { R(g, 7 + sw, 12 + y0, 2, 4, tpL); R(g, 7 + sw, 16 + y0, 2, 2, sk); }
      if (S.cane) { R(g, 12, 12 + y0, 1, 10 - y0, '#8a5a28'); }
      if (shield && !armsUp) { if (pose === 'walk') shieldSide(g, 10, 11 + y0); else shieldSide(g, 4, 11 + y0); }
    }
  }
  function shieldFront(g, x, y) { // a round red shield with a golden fork on it
    R(g, x, y + 1, 5, 6, '#c8302a'); R(g, x + 1, y, 3, 8, '#c8302a'); R(g, x, y + 1, 1, 6, '#e85848'); R(g, x + 4, y + 1, 1, 6, '#8a1a18');
    R(g, x + 2, y + 2, 1, 4, '#f8d040'); P(g, x + 1, y + 2, '#f8d040'); P(g, x + 3, y + 2, '#f8d040'); P(g, x + 1, y + 1, '#f8d040'); P(g, x + 3, y + 1, '#f8d040');
  }
  function shieldSide(g, x, y) { R(g, x, y + 2, 3, 6, '#c8302a'); R(g, x + 1, y + 1, 2, 8, '#c8302a'); R(g, x, y + 2, 1, 6, '#e85848'); R(g, x + 2, y + 2, 1, 6, '#8a1a18'); R(g, x + 1, y + 3, 1, 4, '#f8d040'); }

  // ---- the sword: 8 directions (0 right, then clockwise), each with the hilt's position
  let SWORD = null;
  function buildSword() {
    const blade = '#e8f0ff', bladeD = '#98a8c8', edge = '#5a6888';
    const hor = mk(18, 7, g => { // pointing right, hilt on the left
      R(g, 1, 2, 4, 3, '#7a4a20'); R(g, 1, 2, 4, 1, '#a86a30'); R(g, 5, 0, 2, 7, '#f8c838'); P(g, 5, 0, '#fff0a0'); R(g, 7, 2, 9, 3, blade); R(g, 7, 4, 9, 1, bladeD); R(g, 16, 3, 1, 1, blade);
      R(g, 7, 3, 8, 1, '#ffffff');
    }, OUT);
    const dia = mk(15, 15, g => { // pointing down-right, hilt at the top left
      for (let i = 0; i < 4; i++) { R(g, 1 + i, 1 + i, 2, 2, '#7a4a20'); }
      R(g, 4, 6, 1, 1, '#f8c838'); R(g, 3, 6, 4, 1, '#f8c838'); R(g, 6, 3, 1, 4, '#f8c838');
      for (let i = 0; i < 7; i++) { R(g, 6 + i, 6 + i, 2, 2, blade); P(g, 7 + i, 6 + i, '#fff'); P(g, 6 + i, 7 + i, bladeD); }
    }, OUT);
    const A = [];
    A[0] = { c: hor, hx: 3, hy: 3 };
    A[2] = { c: rot90(hor), hx: 3, hy: 3 }; // down (rot90 maps (x,y) to (h-1-y, x))
    A[2].hx = 7 - 1 - 3; A[2].hy = 3;
    A[4] = { c: flipH(hor), hx: 18 - 1 - 3, hy: 3 };
    A[6] = { c: flipV(A[2].c), hx: A[2].hx, hy: 18 - 1 - 3 };
    A[1] = { c: dia, hx: 2, hy: 2 };
    A[3] = { c: flipH(dia), hx: 12, hy: 2 };
    A[5] = { c: flipV(A[3].c), hx: 12, hy: 12 };
    A[7] = { c: flipV(dia), hx: 2, hy: 12 };
    SWORD = A;
  }

  // ================================================================ BADDIES, BOSSES, THINGS (all kid friendly: they get bonked and go "poof")
  const SPR = {};
  function sphere(g, x, y, r, base, hi, lo) { // a shaded ball, light from the top left
    E(g, x, y, r, r, lo); E(g, x - r * 0.12, y - r * 0.12, r * 0.85, r * 0.85, base); E(g, x - r * 0.35, y - r * 0.38, r * 0.35, r * 0.3, hi);
  }
  function eyes(g, x1, x2, y, look, big) {
    const h = big ? 3 : 2;
    R(g, x1, y, 2, h, '#fff'); R(g, x2, y, 2, h, '#fff');
    const lx = look > 0 ? 1 : 0; R(g, x1 + lx, y + h - 2, 1, 2, '#1a1020'); R(g, x2 + lx, y + h - 2, 1, 2, '#1a1020');
  }
  function buildMonsters() {
    // GLOOP: a wobbly blob of tomato jelly (2 squash frames). Dungeon gloops are purple.
    for (const [nm, c0, c1, c2] of [['gloop', '#e8483a', '#ff9a80', '#9a1a1a'], ['gloopP', '#9a5ad0', '#d0a8f8', '#5a2a8a']]) {
      SPR[nm] = [0, 1].map(f => mk(16, 16, g => {
        const sq = f ? 1 : 0;
        g.fillStyle = c2; g.beginPath(); g.ellipse(8, 11 + sq, 7 + sq, 5 - sq, 0, Math.PI, 0); g.lineTo(15 + sq, 14); g.lineTo(1 - sq, 14); g.fill();
        g.fillStyle = c0; g.beginPath(); g.ellipse(7.5, 11 + sq, 6 + sq, 4.5 - sq, 0, Math.PI, 0); g.lineTo(13.5 + sq, 13); g.lineTo(1.5 - sq, 13); g.fill();
        E(g, 5, 8 + sq, 2, 1.3, c1); P(g, 4, 8 + sq, '#fff');
        R(g, 5, 10 + sq, 2, 2, '#1a1020'); R(g, 9, 10 + sq, 2, 2, '#1a1020'); P(g, 5, 10 + sq, '#fff'); P(g, 9, 10 + sq, '#fff');
      }, OUT));
    }
    // PEA POD SNAPPER: a pea pod on little legs that spits peas (down, up, side x 2 frames)
    SPR.snap = {};
    for (let d = 0; d < 3; d++) for (let f = 0; f < 2; f++) {
      const c = mk(16, 16, g => {
        const leg = f ? 1 : 0;
        R(g, 4, 12 - leg, 2, 3 + leg, '#2a6a20'); R(g, 10, 11 + leg, 2, 4 - leg, '#2a6a20');
        if (d === 2) { E(g, 7, 8, 6, 5, '#3a8a2a'); E(g, 6.5, 7, 5, 3.8, '#6ac048'); E(g, 5, 5.5, 2, 1.2, '#b0f080'); R(g, 11, 6, 4, 4, '#3a8a2a'); R(g, 13, 7, 2, 2, '#1a3a10'); P(g, 9, 6, '#fff'); P(g, 9, 7, '#1a1020'); R(g, 2, 3, 2, 2, '#2a6a20'); }
        else {
          E(g, 8, 8, 6.5, 5.5, '#3a8a2a'); E(g, 7.5, 7, 5.5, 4.2, '#6ac048'); E(g, 6, 5.5, 2, 1.2, '#b0f080');
          R(g, 7, 1, 2, 3, '#2a6a20'); R(g, 8, 1, 3, 1, '#2a6a20');
          if (d === 0) { eyes(g, 4, 10, 6, 0); R(g, 6, 10, 4, 3, '#1a3a10'); R(g, 7, 11, 2, 1, '#3a8a2a'); }
          else { R(g, 3, 8, 10, 1, '#2a6a20'); P(g, 5, 7, '#9ad870'); P(g, 8, 7, '#9ad870'); P(g, 11, 7, '#9ad870'); }
        }
      }, OUT);
      SPR.snap[d + '' + f] = c; if (d === 2) SPR.snap['3' + f] = flipH(c);
    }
    SPR.pea = mk(8, 8, g => { sphere(g, 4, 4, 3, '#70d050', '#d0ffb0', '#2a7a20'); }, OUT);
    // FORK KNIGHT: a tin soldier with a big fork (down, up, side x 2 frames)
    SPR.knight = {};
    for (let d = 0; d < 3; d++) for (let f = 0; f < 2; f++) {
      const c = mk(16, 24, g => {
        const st = f ? 1 : -1;
        const ar = '#7a8ab8', arL = '#b8c8f0', arD = '#4a5680', pl = '#e8383a';
        if (d < 2) {
          R(g, 5, 18, 2, 3 + (st > 0 ? 0 : -1), arD); R(g, 9, 18, 2, 3 + (st < 0 ? 0 : -1), arD); R(g, 4, 20 + (st > 0 ? 0 : -1), 3, 2, '#3a3a50'); R(g, 9, 20 + (st < 0 ? 0 : -1), 3, 2, '#3a3a50');
          R(g, 3, 11, 10, 8, ar); R(g, 3, 11, 3, 7, arL); R(g, 11, 11, 2, 8, arD);
          R(g, 1, 11, 4, 3, arL); R(g, 11, 11, 4, 3, arD); R(g, 1, 11, 4, 1, '#e0e8ff'); // pauldrons
          if (d === 0) { R(g, 5, 12, 6, 7, '#c8303a'); R(g, 5, 12, 2, 7, '#e85a5a'); R(g, 10, 12, 1, 7, '#8a1a20'); R(g, 7, 13, 2, 4, '#f8d040'); P(g, 6, 13, '#f8d040'); P(g, 9, 13, '#f8d040'); }
          else { R(g, 4, 12, 8, 6, arD); R(g, 5, 12, 6, 1, ar); }
          R(g, 3, 17, 10, 1, '#8a6a20'); R(g, 7, 17, 2, 1, '#f8d040');
          E(g, 8, 6.5, 5.5, 5.5, ar); R(g, 3, 6, 10, 5, ar); E(g, 6.5, 5, 2.5, 2.5, arL); R(g, 11, 4, 2, 7, arD); R(g, 3, 10, 10, 1, arD);
          R(g, 7, -1, 2, 4, pl); R(g, 6, 0, 1, 3, pl); R(g, 9, 0, 1, 2, shade(pl, 0.7)); P(g, 7, -1, '#ff8a8a');
          if (d === 0) { R(g, 4, 6, 8, 2, '#1a1020'); P(g, 5, 6, '#ffe040'); P(g, 10, 6, '#ffe040'); R(g, 7, 8, 2, 2, arD); }
          // the fork, held to one side
          const fx = d === 0 ? 13 : 1; R(g, fx, 4 + st, 1, 18, '#8a5a28'); R(g, fx - 1, 1 + st, 3, 1, '#d0d8f0'); R(g, fx - 1, 0 + st, 1, 2, '#d0d8f0'); R(g, fx + 1, 0 + st, 1, 2, '#d0d8f0'); R(g, fx, -1 + st, 1, 3, '#f0f4ff');
          R(g, fx - 1, 12, 2, 2, '#f8c498');
        } else {
          R(g, 6 - st, 18, 2, 3, arD); R(g, 8 + st, 18, 2, 3, ar); R(g, 5 - st * 2, 20, 3, 2, '#3a3a50'); R(g, 8 + st * 2, 20, 4, 2, '#3a3a50');
          R(g, 4, 11, 8, 8, ar); R(g, 4, 11, 3, 7, arL); R(g, 10, 11, 2, 8, arD); R(g, 4, 15, 8, 1, '#c8a040');
          E(g, 8, 6.5, 5, 5.5, ar); R(g, 3, 6, 9, 5, ar); E(g, 6.5, 5, 2.4, 2.4, arL); R(g, 9, 6, 3, 2, '#1a1020'); P(g, 10, 6, '#ffe040'); R(g, 4, -1, 3, 4, pl); R(g, 2, 0, 2, 3, shade(pl, 0.7)); R(g, 5, 12, 4, 6, '#c8303a'); R(g, 5, 12, 1, 6, '#e85a5a'); R(g, 9, 11, 3, 3, arL);
          R(g, 1, 13, 15, 1, '#8a5a28'); R(g, 15, 11, 1, 5, '#d0d8f0'); P(g, 16, 12, '#f0f4ff'); R(g, 13, 11, 1, 1, '#d0d8f0'); R(g, 13, 15, 1, 1, '#d0d8f0');
          R(g, 9, 12, 2, 3, '#f8c498');
        }
      }, OUT);
      SPR.knight[d + '' + f] = c; if (d === 2) SPR.knight['3' + f] = flipH(c);
    }
    // FLITTER: a little purple bat (wings up / down)
    SPR.bat = [0, 1].map(f => mk(16, 12, g => {
      const wy = f ? 4 : 0;
      g.fillStyle = '#5a2a7a'; g.beginPath(); g.moveTo(8, 6); g.lineTo(1, 1 + wy); g.lineTo(2, 6 + wy * 0.5); g.lineTo(4, 5 + wy * 0.5); g.lineTo(5, 8); g.fill();
      g.beginPath(); g.moveTo(8, 6); g.lineTo(15, 1 + wy); g.lineTo(14, 6 + wy * 0.5); g.lineTo(12, 5 + wy * 0.5); g.lineTo(11, 8); g.fill();
      sphere(g, 8, 6, 3.5, '#8a4ab0', '#c890f0', '#4a1a6a'); R(g, 6, 2, 1, 2, '#8a4ab0'); R(g, 9, 2, 1, 2, '#8a4ab0');
      P(g, 7, 6, '#ffe040'); P(g, 9, 6, '#ffe040'); P(g, 7, 8, '#fff'); P(g, 9, 8, '#fff');
    }, OUT));
    // GHOULASH: a friendly-ish sheet ghost with a soup ladle
    SPR.ghost = [0, 1].map(f => mk(16, 18, g => {
      g.fillStyle = '#d8e0f8'; g.beginPath(); g.ellipse(8, 7, 6, 6, 0, Math.PI, 0); g.lineTo(14, 15); for (let i = 0; i < 4; i++) { g.lineTo(12.5 - i * 3, f ? 13 + (i & 1) * 3 : 16 - (i & 1) * 3); g.lineTo(11 - i * 3, 15); } g.lineTo(2, 7); g.fill();
      g.fillStyle = '#f8fcff'; g.beginPath(); g.ellipse(7, 6, 4, 4, 0, Math.PI, 0); g.lineTo(11, 9); g.lineTo(3, 9); g.fill();
      R(g, 10, 4, 3, 10, '#a8b4d8');
      R(g, 5, 6, 2, 3, '#2a2048'); R(g, 9, 6, 2, 3, '#2a2048'); E(g, 8, 11, 1.5, 1.2, '#2a2048');
      R(g, 13, 8 + f, 1, 6, '#a07040'); E(g, 13.5, 14 + f, 2, 1.5, '#c0c8d8');
    }, OUT));
    // SHORE CRAB
    SPR.crab = [0, 1].map(f => mk(16, 14, g => {
      for (let i = 0; i < 3; i++) { R(g, 2 - (f ? 1 : 0), 8 + i * 2, 3, 1, '#a83a1a'); R(g, 11 + (f ? 1 : 0), 8 + i * 2, 3, 1, '#a83a1a'); }
      E(g, 8, 8, 5.5, 4, '#a83a1a'); E(g, 7.5, 7.5, 4.5, 3, '#f06a30'); E(g, 6, 6.5, 2, 1, '#ffb080');
      const o = f ? 1 : 0; E(g, 2, 4 - o, 2.5, 2, '#f06a30'); E(g, 14, 4 - o, 2.5, 2, '#f06a30'); R(g, 1, 2 - o, 1, 2 + o, '#a83a1a'); R(g, 14, 2 - o, 1, 2 + o, '#a83a1a');
      R(g, 6, 3, 1, 3, '#a83a1a'); R(g, 9, 3, 1, 3, '#a83a1a'); P(g, 6, 2, '#fff'); P(g, 9, 2, '#fff'); P(g, 6, 3, '#1a1020'); P(g, 9, 3, '#1a1020');
    }, OUT));
    // SPIKY MEATBALL (the blade trap: can't be bonked)
    SPR.spike = [0, 1].map(f => mk(16, 16, g => {
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + (f ? Math.PI / 8 : 0); g.fillStyle = i % 2 ? '#a8b0c8' : '#e0e4f0'; g.beginPath(); g.moveTo(8 + Math.cos(a) * 7.8, 8 + Math.sin(a) * 7.8); g.lineTo(8 + Math.cos(a + 0.5) * 4, 8 + Math.sin(a + 0.5) * 4); g.lineTo(8 + Math.cos(a - 0.5) * 4, 8 + Math.sin(a - 0.5) * 4); g.fill(); }
      sphere(g, 8, 8, 5, '#9a5a30', '#d89060', '#5a2a10'); P(g, 6, 9, '#5a2a10'); P(g, 10, 7, '#5a2a10'); R(g, 5, 7, 2, 1, '#1a1020'); R(g, 9, 7, 2, 1, '#1a1020');
    }, OUT));
    // a mini meatball (the Baron's little helpers)
    SPR.ball = [0, 1].map(f => mk(14, 14, g => {
      sphere(g, 7, 7 + f * 0.5, 5.5, '#9a5a30', '#d89060', '#5a2a10'); P(g, 5, 9, '#5a2a10'); P(g, 9, 5, '#5a2a10'); P(g, 8, 10, '#c88050');
      R(g, 4, 6, 2, 2, '#fff'); R(g, 8, 6, 2, 2, '#fff'); P(g, 5, 7, '#1a1020'); P(g, 9, 7, '#1a1020'); R(g, 3, 4, 3, 1, '#3a1a08'); R(g, 8, 4, 3, 1, '#3a1a08');
    }, OUT));
    SPR.drop = mk(8, 8, g => { sphere(g, 4, 4.5, 3, '#e83a20', '#ff9a70', '#8a1a10'); }, OUT); // a splodge of sauce
    SPR.crumb = mk(8, 8, g => { R(g, 1, 2, 6, 5, '#c89018'); R(g, 1, 2, 6, 4, '#f8d040'); R(g, 2, 2, 3, 1, '#fff0a0'); P(g, 4, 4, '#c89018'); }, OUT);

    // a village hen (idle, step, peck), facing left; +3 = facing right
    SPR.hen = [];
    for (let f = 0; f < 3; f++) SPR.hen.push(mk(14, 14, g => {
      const pk = f === 2 ? 2 : 0, st = f === 1 ? 1 : 0;
      R(g, 5, 11, 1, 2 + st, '#e8a020'); R(g, 8, 11, 1, 2 - st, '#e8a020');
      E(g, 8, 8, 5, 3.6, '#e8e8f0'); E(g, 7.5, 7.5, 4, 2.6, '#ffffff'); R(g, 11, 5, 2, 3, '#e8e8f0'); P(g, 12, 5, '#ffffff');
      E(g, 4, 4 + pk, 2.6, 2.6, '#ffffff'); R(g, 3, 1 + pk, 2, 2, '#e8303a'); R(g, 0, 4 + pk, 2, 1, '#f8b020'); P(g, 2, 6 + pk, '#e8303a'); P(g, 3, 4 + pk, '#1a1020');
      R(g, 7, 7, 4, 1, '#c8c8d8');
    }, OUT));
    for (let f = 0; f < 3; f++) SPR.hen.push(flipH(SPR.hen[f]));
    // ---- THE BIG CHEESE (mini-boss): a wheel of holey cheese, 32x32, 4 rolling frames + dizzy
    SPR.cheese = [];
    for (let f = 0; f < 5; f++) SPR.cheese.push(mk(32, 32, g => {
      E(g, 16, 28, 12, 3, 'rgba(0,0,0,0)');
      R(g, 3, 9, 26, 16, '#c88a10'); E(g, 16, 25, 13, 5, '#a86a08'); E(g, 16, 9, 13, 6, '#f8d848');
      R(g, 3, 9, 26, 16, '#e8b020'); R(g, 3, 9, 4, 16, '#f8c838'); R(g, 25, 9, 4, 16, '#b07810'); E(g, 16, 25, 13, 5, '#c88a10'); R(g, 3, 20, 26, 5, '#d09818');
      E(g, 16, 9, 13, 6, '#f8d848'); E(g, 13, 7.5, 7, 2.5, '#fff0a0');
      const o = (f % 4) * 3; // the holes roll round the rim
      [[6 + o, 16], [13 + o, 21], [20 + o, 14], [27 + o, 19]].forEach(([x, y]) => { x = 4 + ((x - 4) % 25); E(g, x, y, 2, 1.6, '#a87008'); P(g, x - 1 | 0, y - 1 | 0, '#7a5000'); });
      E(g, 9, 9, 2, 1, '#e8b020'); E(g, 21, 10, 2.5, 1.2, '#e8b020');
      if (f < 4) { // a cross face on the front
        R(g, 9, 13, 5, 2, '#1a1020'); R(g, 18, 13, 5, 2, '#1a1020'); R(g, 10, 15, 3, 3, '#fff'); R(g, 19, 15, 3, 3, '#fff'); R(g, 11, 16, 2, 2, '#1a1020'); R(g, 19, 16, 2, 2, '#1a1020');
        R(g, 12, 20, 8, 2, '#5a2a08'); R(g, 13, 20, 2, 1, '#fff'); R(g, 17, 20, 2, 1, '#fff');
      } else { // dizzy: swirly eyes, tongue out
        for (const cx of [11, 21]) { R(g, cx - 2, 14, 5, 1, '#1a1020'); R(g, cx - 2, 14, 1, 4, '#1a1020'); R(g, cx - 2, 17, 4, 1, '#1a1020'); R(g, cx + 1, 15, 1, 3, '#1a1020'); P(g, cx, 16, '#1a1020'); }
        E(g, 16, 21, 3, 2, '#5a2a08'); R(g, 15, 21, 3, 3, '#f06a8a');
      }
    }, OUT));
    // ---- BARON MEATBALLO (the boss): a huge meatball in a crown with a curly moustache and a third eye (his weak spot)
    SPR.baron = [];
    for (let f = 0; f < 4; f++) SPR.baron.push(mk(48, 48, g => { // 0 eye shut, 1 eye open, 2 dizzy, 3 roar
      sphere(g, 24, 28, 19, '#9a5428', '#d89060', '#5a2a10');
      for (let i = 0; i < 26; i++) { const a = hash(i, 1, 5) * 6.28, r = hash(i, 2, 5) * 15; const x = 24 + Math.cos(a) * r, y = 29 + Math.sin(a) * r * 0.9; E(g, x, y, 1.5, 1.2, hash(i, 3, 5) > 0.5 ? '#7a3a18' : '#b06a38'); }
      E(g, 15, 18, 5, 3, '#e8a070'); P(g, 13, 17, '#fff0d0');
      // the crown
      R(g, 13, 5, 22, 7, '#d8a018'); R(g, 13, 5, 22, 2, '#f8d848'); for (let i = 0; i < 4; i++) { g.fillStyle = '#f8d848'; g.beginPath(); g.moveTo(13 + i * 5.5, 6); g.lineTo(15.75 + i * 5.5, 0); g.lineTo(18.5 + i * 5.5, 6); g.fill(); }
      E(g, 24, 8.5, 2, 2, '#e83a6a'); E(g, 17, 9, 1.5, 1.5, '#3a8ae8'); E(g, 31, 9, 1.5, 1.5, '#3ae87a'); R(g, 13, 11, 22, 1, '#a07008');
      // the third eye on his forehead
      if (f === 1) { E(g, 24, 17, 5, 4, '#fff'); E(g, 24, 17.5, 2.5, 3, '#e8283a'); E(g, 24, 17.5, 1.2, 1.8, '#1a1020'); P(g, 23, 16, '#fff'); R(g, 19, 12, 10, 1, '#3a1a08'); }
      else if (f === 2) { R(g, 20, 17, 9, 1, '#3a1a08'); P(g, 24, 16, '#3a1a08'); }
      else { R(g, 19, 17, 11, 2, '#5a2a10'); R(g, 20, 17, 9, 1, '#3a1a08'); }
      // eyes
      if (f === 2) { for (const cx of [17, 31]) { R(g, cx - 3, 23, 6, 1, '#1a1020'); R(g, cx - 3, 23, 1, 5, '#1a1020'); R(g, cx - 3, 27, 5, 1, '#1a1020'); R(g, cx + 1, 24, 1, 4, '#1a1020'); P(g, cx - 1, 25, '#1a1020'); } }
      else { E(g, 17, 25, 4, 3.5, '#fff'); E(g, 31, 25, 4, 3.5, '#fff'); E(g, 18, 26, 2, 2.4, '#1a1020'); E(g, 30, 26, 2, 2.4, '#1a1020'); P(g, 17, 25, '#fff'); P(g, 29, 25, '#fff'); R(g, 12, 20, 9, 2, '#3a1a08'); R(g, 27, 20, 9, 2, '#3a1a08'); P(g, 21, 21, '#3a1a08'); P(g, 27, 21, '#3a1a08'); }
      // the moustache
      g.fillStyle = '#2a1408'; g.beginPath(); g.moveTo(24, 31); g.quadraticCurveTo(14, 28, 9, 34); g.quadraticCurveTo(7, 30, 11, 29); g.quadraticCurveTo(18, 27, 24, 30); g.quadraticCurveTo(30, 27, 37, 29); g.quadraticCurveTo(41, 30, 39, 34); g.quadraticCurveTo(34, 28, 24, 31); g.fill();
      if (f === 3) { E(g, 24, 38, 7, 5, '#3a0a08'); R(g, 19, 35, 10, 2, '#fff'); E(g, 24, 41, 4, 2, '#e85a6a'); }
      else { E(g, 24, 37, 4, 2, '#3a0a08'); R(g, 22, 36, 4, 1, '#fff'); }
    }, OUT));
  }

  // ---- things to pick up, the items, the effects
  const ITEMIMG = {};
  function buildItems() {
    const gem = (c0, c1, c2) => [0, 1].map(f => mk(8, 14, g => {
      g.fillStyle = c2; g.beginPath(); g.moveTo(4, 0); g.lineTo(7.5, 4); g.lineTo(7.5, 10); g.lineTo(4, 14); g.lineTo(0.5, 10); g.lineTo(0.5, 4); g.fill();
      g.fillStyle = c0; g.beginPath(); g.moveTo(4, 1); g.lineTo(6.5, 4); g.lineTo(6.5, 10); g.lineTo(4, 13); g.fill();
      R(g, 2, 4, 2, 6, c1); P(g, 2, 3, c1);
      if (f) { R(g, 2, 2, 1, 3, '#fff'); P(g, 1, 3, '#fff'); P(g, 3, 3, '#fff'); }
    }, OUT));
    ITEMIMG.gem1 = gem('#30c048', '#a8f8b0', '#1a7a2a'); ITEMIMG.gem5 = gem('#3a70f0', '#b0d0ff', '#1a3aa0'); ITEMIMG.gem20 = gem('#f03a4a', '#ffb0b8', '#a01a28');
    ITEMIMG.heart = mk(8, 8, g => { R(g, 1, 1, 2, 1, '#f03a4a'); R(g, 4, 1, 2, 1, '#f03a4a'); R(g, 0, 2, 7, 2, '#f03a4a'); R(g, 1, 4, 5, 1, '#f03a4a'); R(g, 2, 5, 3, 1, '#c01a2a'); P(g, 3, 6, '#c01a2a'); P(g, 1, 2, '#ffb0b8'); R(g, 5, 2, 2, 2, '#c01a2a'); }, OUT);
    const bigHeart = (fill, part) => mk(16, 15, g => {
      const P0 = (x, y, w, h, c) => R(g, x, y, w, h, c);
      // a 13x12 heart
      const rows = ['..xxx...xxx..', '.xxxxx.xxxxx.', 'xxxxxxxxxxxxx', 'xxxxxxxxxxxxx', 'xxxxxxxxxxxxx', '.xxxxxxxxxxx.', '..xxxxxxxxx..', '...xxxxxxx...', '....xxxxx....', '.....xxx.....', '......x......'];
      rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === 'x') { const q = (x < 6.5 ? 0 : 1) + (y < 5 ? 0 : 2); const on = part == null ? true : part.includes(q); P0(x + 1, y + 2, 1, 1, on ? (x + y < 7 ? '#ff8a98' : y > 7 || x > 9 ? '#b01a2a' : fill) : '#3a1a28'); } });
      if (part) { R(g, 7, 2, 1, 11, OUT); R(g, 1, 7, 13, 1, OUT); }
      P0(3, 4, 2, 1, '#fff'); P0(3, 5, 1, 1, '#fff');
    }, OUT);
    ITEMIMG.container = bigHeart('#f03a4a');
    ITEMIMG.piece = bigHeart('#f03a4a', [0]);
    ITEMIMG.pieces = [0, 1, 2, 3, 4].map(n => bigHeart('#f03a4a', [0, 1, 2, 3].slice(0, n)));
    ITEMIMG.key = mk(8, 16, g => { E(g, 4, 3.5, 3.2, 3.2, '#e8b020'); E(g, 4, 3.5, 1.4, 1.4, 'rgba(0,0,0,0)'); R(g, 3, 6, 2, 9, '#e8b020'); R(g, 3, 6, 1, 9, '#fff0a0'); R(g, 5, 11, 2, 1, '#e8b020'); R(g, 5, 13, 2, 2, '#e8b020'); P(g, 2, 2, '#fff0a0'); }, OUT);
    // (punch the hole in the key's ring)
    { const g = ITEMIMG.key.getContext('2d'); g.clearRect(3, 2, 2, 3); }
    ITEMIMG.bigkey = mk(16, 16, g => {
      E(g, 5, 5, 4.5, 4.5, '#c83a2a'); E(g, 5, 5, 3.2, 3.2, '#f8c838'); E(g, 5, 5, 1.5, 1.5, '#c83a2a');
      g.fillStyle = '#f8c838'; for (let i = 0; i < 8; i++) { g.fillRect(7 + i, 7 + i, 2, 2); } R(g, 11, 13, 3, 2, '#f8c838'); R(g, 13, 10, 2, 3, '#f8c838'); P(g, 3, 3, '#fff8c0');
    }, OUT);
    ITEMIMG.map = mk(16, 16, g => { R(g, 2, 3, 12, 10, '#f0d8a0'); R(g, 2, 3, 12, 1, '#fff0c8'); R(g, 1, 2, 2, 12, '#c09860'); R(g, 13, 2, 2, 12, '#c09860'); R(g, 4, 5, 3, 3, '#5aa040'); R(g, 8, 8, 4, 3, '#4a80d0'); R(g, 6, 6, 5, 1, '#c8302a'); P(g, 10, 5, '#c8302a'); P(g, 9, 4, '#c8302a'); }, OUT);
    ITEMIMG.compass = mk(16, 16, g => { E(g, 8, 8, 7, 7, '#a07018'); E(g, 8, 8, 6, 6, '#f8d048'); E(g, 8, 8, 4.5, 4.5, '#f8f4e8'); g.fillStyle = '#e8283a'; g.beginPath(); g.moveTo(8, 3); g.lineTo(9.5, 8); g.lineTo(6.5, 8); g.fill(); g.fillStyle = '#3a4a6a'; g.beginPath(); g.moveTo(8, 13); g.lineTo(9.5, 8); g.lineTo(6.5, 8); g.fill(); P(g, 5, 5, '#fff'); }, OUT);
    // the boomerang: a bent, very crunchy breadstick (4 spin frames)
    const boom = mk(16, 16, g => {
      g.fillStyle = '#b07028'; g.beginPath(); g.moveTo(2, 4); g.lineTo(8, 9); g.lineTo(14, 4); g.lineTo(14, 8); g.lineTo(8, 13); g.lineTo(2, 8); g.fill();
      g.fillStyle = '#e8b058'; g.beginPath(); g.moveTo(2, 4); g.lineTo(8, 9); g.lineTo(14, 4); g.lineTo(14, 6); g.lineTo(8, 11); g.lineTo(2, 6); g.fill();
      P(g, 4, 6, '#fff0c0'); P(g, 11, 6, '#fff0c0'); P(g, 6, 8, '#fff0c0'); P(g, 9, 9, '#8a4a18'); P(g, 12, 7, '#8a4a18'); P(g, 5, 7, '#8a4a18');
    }, OUT);
    ITEMIMG.boom = [boom, rot90(boom), rot90(rot90(boom)), rot90(rot90(rot90(boom)))];
    ITEMIMG.bomb = [0, 1].map(f => mk(16, 16, g => {
      E(g, 8, 14, 6, 1.8, 'rgba(0,0,0,0)');
      sphere(g, 8, 9.5, 5.5, '#3a4ac0', '#a0b0ff', '#1a2060'); R(g, 6, 3, 4, 2, '#8a8aa0'); R(g, 6, 3, 4, 1, '#c8c8d8');
      R(g, 9, 1, 1, 2, '#a07040'); R(g, 10, 0, 2, 1, '#a07040');
      if (f) { P(g, 12, 0, '#fff060'); P(g, 13, 1, '#ff8020'); P(g, 11, 0, '#ff8020'); P(g, 12, 1, '#fff'); }
    }, OUT));
    ITEMIMG.bottle = [0, 1].map(full => mk(16, 16, g => {
      R(g, 6, 1, 4, 2, '#c09060'); R(g, 6, 3, 4, 2, '#a8d8e8'); E(g, 8, 10, 5, 5, '#a8d8e8'); E(g, 8, 10, 4, 4, full ? '#e88028' : '#d8f0f8');
      if (full) { E(g, 8, 11, 4, 3, '#d05a18'); P(g, 6, 10, '#5ac040'); P(g, 9, 12, '#f8e040'); P(g, 10, 9, '#5ac040'); }
      R(g, 5, 7, 1, 4, '#fff'); P(g, 6, 6, '#fff');
    }, OUT));
    ITEMIMG.swordIcon = mk(16, 16, g => { for (let i = 0; i < 9; i++) R(g, 5 + i, 9 - i, 2, 2, '#e8f0ff'); for (let i = 0; i < 8; i++) P(g, 6 + i, 9 - i, '#fff'); R(g, 3, 10, 5, 1, '#f8c838'); R(g, 5, 8, 1, 5, '#f8c838'); R(g, 2, 12, 3, 3, '#7a4a20'); }, OUT);
    ITEMIMG.shieldIcon = mk(16, 16, g => { R(g, 3, 2, 10, 9, '#c8302a'); R(g, 4, 11, 8, 2, '#c8302a'); R(g, 6, 13, 4, 2, '#c8302a'); R(g, 3, 2, 2, 9, '#e85848'); R(g, 11, 3, 2, 9, '#8a1a18'); R(g, 7, 4, 2, 7, '#f8d040'); R(g, 5, 4, 1, 3, '#f8d040'); R(g, 10, 4, 1, 3, '#f8d040'); R(g, 5, 6, 6, 1, '#f8d040'); R(g, 3, 2, 10, 1, '#f8d040'); }, OUT);
    ITEMIMG.recipe = mk(16, 16, g => { R(g, 3, 2, 10, 12, '#f8ecd0'); R(g, 2, 1, 12, 2, '#d8b880'); R(g, 2, 13, 12, 2, '#d8b880'); for (let i = 0; i < 4; i++) R(g, 5, 5 + i * 2, 6 - (i & 1) * 2, 1, '#8a5a3a'); E(g, 11, 11, 2, 2, '#e83a3a'); }, OUT);
    ITEMIMG.trifork = mk(24, 24, g => { // three golden prongs on a handle
      const gold = '#f8c838', hi = '#fff4b0', dk = '#b07810';
      R(g, 11, 10, 3, 13, gold); R(g, 11, 10, 1, 13, hi); R(g, 13, 10, 1, 13, dk); R(g, 4, 9, 17, 3, gold); R(g, 4, 9, 17, 1, hi);
      for (const x of [4, 11, 18]) { R(g, x, 1, 3, 9, gold); R(g, x, 1, 1, 9, hi); R(g, x + 2, 1, 1, 9, dk); g.fillStyle = gold; g.beginPath(); g.moveTo(x, 1); g.lineTo(x + 1.5, -1); g.lineTo(x + 3, 1); g.fill(); }
    }, OUT);
    // effects: the puff of smoke a baddie leaves behind, sparkles, a bomb's bang
    ITEMIMG.puff = [0, 1, 2, 3, 4].map(f => mk(24, 24, g => {
      const r = 4 + f * 2.2, a = f < 3 ? 1 : 1;
      for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2 + f * 0.3; const x = 12 + Math.cos(an) * r * 0.9, y = 12 + Math.sin(an) * r * 0.8; E(g, x, y, 4.5 - f * 0.6, 4 - f * 0.6, f > 2 ? '#c8c8d8' : '#f8f8ff'); }
      if (f < 3) E(g, 12, 12, 5 - f, 4.5 - f, '#ffffff');
      if (f > 0 && f < 4) { const s = 3 + f * 2; for (const [dx, dy] of [[-1, -1], [1, -0.6], [0.3, 1]]) { const x = 12 + dx * s, y = 12 + dy * s; R(g, x - 0.5, y - 2, 1, 5, '#f8e040'); R(g, x - 2, y - 0.5, 5, 1, '#f8e040'); P(g, x, y, '#fff'); } }
    }, '#6a6a8a'));
    ITEMIMG.spark = [0, 1, 2, 3].map(f => mk(9, 9, g => { const s = [1, 3, 4, 2][f]; R(g, 4, 4 - s, 1, s * 2 + 1, '#fff'); R(g, 4 - s, 4, s * 2 + 1, 1, '#fff'); if (s > 2) { P(g, 3, 3, '#fff8a0'); P(g, 5, 5, '#fff8a0'); P(g, 5, 3, '#fff8a0'); P(g, 3, 5, '#fff8a0'); } }));
    ITEMIMG.bang = [0, 1, 2, 3].map(f => mk(40, 40, g => {
      const r = 8 + f * 4;
      for (let i = 0; i < 9; i++) { const an = i / 9 * 6.28 + f; E(g, 20 + Math.cos(an) * r * 0.7, 20 + Math.sin(an) * r * 0.7, r * 0.45, r * 0.42, f < 2 ? '#f8a020' : '#a8a0a8'); }
      E(g, 20, 20, r * 0.75, r * 0.7, f < 1 ? '#fff8c0' : f < 2 ? '#f8e040' : f < 3 ? '#f86020' : '#6a6070');
      if (f < 2) E(g, 20, 20, r * 0.4, r * 0.4, '#fff');
    }, OUT));
    ITEMIMG.hit = mk(16, 16, g => { g.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.beginPath(); g.moveTo(8, 8); g.lineTo(8 + Math.cos(a - 0.2) * (i % 2 ? 4 : 7.5), 8 + Math.sin(a - 0.2) * (i % 2 ? 4 : 7.5)); g.lineTo(8 + Math.cos(a + 0.2) * (i % 2 ? 4 : 7.5), 8 + Math.sin(a + 0.2) * (i % 2 ? 4 : 7.5)); g.fill(); } E(g, 8, 8, 2.5, 2.5, '#fff8a0'); });
    ITEMIMG.star = mk(7, 7, g => { R(g, 3, 0, 1, 7, '#f8e040'); R(g, 0, 3, 7, 1, '#f8e040'); R(g, 2, 2, 3, 3, '#f8e040'); P(g, 3, 3, '#fff'); }, '#a07010');
  }

  // ================================================================ THE KINGDOM OF LASAGNIA (16x12 tiles a screen)
  // outdoors: . grass  " long grass  f flowers  : path  s sand  T tree  b bush  r rock  X cracked boulder  C cliff  ~ water
  //   = bridge  F fence  S sign  g grave  G the wobbly grave  h house  d house door  K the keep  D keep door  @ cave  O well
  // indoors: # wall  . floor  x furniture  k counter  m the way out  p pot  c chest  q cracked wall  w rock
  // the dungeon: # wall / block  B push block  S statue  t torch  v tomato sauce  o / u orange / blue blocks  Q crystal switch
  //   _ floor switch  Z gate  A the big chest   (doors are in each room's `doors`: . open, L locked, Y big lock, J cracked, U shutter, O one-way)
  const ROOMS = {
    grave: { kind: 'ow', gx: 0, gy: 0, name: 'OLD GRAVEYARD', gp: 'g', song: 'grave', map: [
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'T.g..g...g..g..T',
      'T..............T',
      'T.g..g..G..g...T',
      'T..............T',
      'T.g..g..:..g.g.T',
      'T.......:......T',
      'TFFFFFF.:.FFFFFT',
      'T.""....:..."".T',
      'T.b.....:....b.T',
      'TTTTTT..:.TTTTTT'],
      ents: [['ghost', 4, 3], ['ghost', 12, 5], ['ghost', 6, 9]],
      warps: { '8,4': ['c_grave', 7, 10, 1] } },
    cliff: { kind: 'ow', gx: 1, gy: 0, name: 'NORTH CLIFFS', song: 'field', map: [
      'CCCCCKKKKKKCCCCC',
      'CCCCCKKKKKKCCCCC',
      'CCC..KKKKKK..CCC',
      'CC.r.KKDDKK.r.CC',
      'CC......:.....CC',
      'CC.CCCC.:.CCCC.C',
      'CC.CCCC.:.CCCC.C',
      'CC...b..:..b...C',
      'CCCC....:....CCC',
      'CCCC.r..:..r.CCC',
      'CCCCCCCXXCCCCCCC',
      'CCCCCC....CCCCCC'],
      ents: [['snap', 3, 7], ['snap', 12, 4], ['knight', 8, 8]],
      warps: { '7,3': ['d1', 7, 10, 1], '8,3': ['d1', 8, 10, 1] } },
    forest: { kind: 'ow', gx: 2, gy: 0, name: 'MISTY WOODS', gp: 'f', song: 'woods', fog: 1, map: [
      'TTTTTTTTTTTTTTTT',
      'TT..T....TT..cTT',
      'T..TT.T..T..T..T',
      'T.T...T.TT.TT..T',
      'T...T...T....T.T',
      'TT.TT.TTT.TT...T',
      'T.......T..T.TTT',
      'T.TTT.T...T....T',
      'T..~~...T..TT..T',
      'T..~~.TT....T..T',
      'T......T.......T',
      'TTTTTT....TTTTTT'],
      ents: [['npc', 9, 10, 'cal'], ['gloop', 5, 6], ['gloop', 13, 4], ['bat', 2, 2]],
      chests: { '13,1': 'gems50' } },
    lake: { kind: 'ow', gx: 0, gy: 1, name: 'LAKE LINGUINE', song: 'field', map: [
      'TTTTTT....TTTTTT',
      'T.......::.....T',
      'T~~~~~~..::..b.T',
      '~~~~~~~~..::...T',
      '~~~~~~~~~..:...T',
      '~~ss~~~~~~.:::::',
      '~~ss~~~=====....',
      '~~~~~~~~~~......',
      '~~~~~~~~~~..f..T',
      'T~~~~~~~~..""..T',
      'T.~~~~~..::....T',
      'TTTTTT.::.TTTTTT'],
      ents: [['npc', 12, 7, 'fisher'], ['piece', 3, 6, 'lake'], ['gloop', 12, 2], ['snap', 13, 9]] },
    village: { kind: 'ow', gx: 1, gy: 1, name: 'FARFALLE VILLAGE', song: 'village', map: [
      'TTTTTT....TTTTTT',
      'T.hhhhh::S.hhhhT',
      'T.hhhhh::..hhhhT',
      'T.hhhhh::..hhhhT',
      'T.hhdhh::..hhdhT',
      '....:..::....:..',
      '::::::::::::::::',
      '..hhhh.::...f...',
      'T.hhhh.::.O.bb.T',
      'T.hdhh.::......T',
      'T..:...::..ff..T',
      'TTTTTT.::.TTTTTT'],
      houses: [[2, 1, 5, 4, 'shop'], [11, 1, 4, 4, 'blue'], [2, 7, 4, 3, 'green']],
      ents: [['npc', 6, 7, 'luke'], ['npc', 12, 9, 'lady'], ['hen', 5, 10], ['hen', 13, 6], ['hen', 10, 10]],
      warps: { '4,4': ['h_shop', 7, 10, 1], '13,4': ['h_elder', 7, 10, 1], '3,9': ['h_nonna', 7, 10, 1] } },
    east: { kind: 'ow', gx: 2, gy: 1, name: 'PEAPOD FIELDS', song: 'field', map: [
      'TTTTTT....TTTTTT',
      'T.....::....CCCC',
      'T.""..::....C@CC',
      'T.""..::.......T',
      'T.....::..b....T',
      '......::...."".T',
      '::::::::.....r.T',
      '......::..b....T',
      'T.....::.."""..T',
      'T..f..::.......T',
      'T.....::....f..T',
      'TTTTTT.::.TTTTTT'],
      ents: [['snap', 3, 4], ['snap', 11, 8], ['knight', 10, 3], ['gloop', 4, 9]],
      warps: { '13,2': ['c_field', 7, 10, 1] } },
    home: { kind: 'ow', gx: 0, gy: 2, name: "{N}'S HOUSE", song: 'field', map: [
      'TTTTTT....TTTTTT',
      'TT.f......T..TTT',
      'T..............T',
      'T..hhhhh...f...T',
      'T..hhhhh.......T',
      'T..hhhhh..b.b...',
      'T..hhdhh........',
      'T....:..........',
      'T.ff.:::::::::::',
      'T..b....."""...T',
      'TT.....bb""..TTT',
      'TTTTTTTTTTTTTTTT'],
      houses: [[3, 3, 5, 4, 'red']],
      ents: [['gloop', 11, 9]],
      warps: { '5,6': ['h_home', 7, 10, 1] } },
    south: { kind: 'ow', gx: 1, gy: 2, name: 'SOUTH MEADOW', song: 'field', map: [
      'TTTTTT....TTTTTT',
      'T......::......T',
      'T..b...::...r..T',
      'T.""...::..""".T',
      'T.""...::..""...',
      '.......::.......',
      '::::::::::::::::',
      '.....S..........',
      '..rr...""...b..T',
      'T..""..""..bb..T',
      'T.....f....T...T',
      'TTTTTTTTTTTTTTTT'],
      ents: [['gloop', 3, 9], ['gloop', 12, 3], ['snap', 10, 8]] },
    shore: { kind: 'ow', gx: 2, gy: 2, name: 'SUNNY SHORE', song: 'field', map: [
      'TTTTTT....TTTTTT',
      'T.....:...b....T',
      'T..ff.:..."""..T',
      'T.....:......r.T',
      '......:.....S..T',
      '::::::::...ssssT',
      '.....sssssssss~~',
      '..sssssss~~~~~~~',
      'Tssss~~~~~~~~~~~',
      'Tss~~~~~~~~~~~~~',
      'T~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~'],
      ents: [['crab', 8, 6], ['crab', 4, 7], ['gloop', 10, 3]] },

    // ---- indoors
    h_home: { kind: 'in', name: "{N}'S HOUSE", song: 'home', map: [
      '################',
      '################',
      '#xx..........xx#',
      '#xx............#',
      '#..........c...#',
      '#..............#',
      '#....xx........#',
      '#....xx........#',
      '#..............#',
      '#x............x#',
      '#.............p#',
      '#######mm#######'],
      decor: [['bed', 1, 2], ['dresser', 13, 2], ['table', 5, 6], ['plant', 1, 9], ['plant', 14, 9], ['rug', 4, 5], ['fire', 7, 0], ['window', 3, 0], ['window', 11, 0]],
      ents: [['npc', 8, 5, 'mom']], chests: { '11,4': 'sword' }, out: ['home', 5, 7, 0] },
    h_shop: { kind: 'in', name: "MABEL'S SHOP", song: 'shop', map: [
      '################',
      '################',
      '#xx.........xxx#',
      '#..kkkkkkkkkk..#',
      '#..............#',
      '#..............#',
      '#...x..x..x....#',
      '#..............#',
      '#..............#',
      '#x............x#',
      '#..............#',
      '#######mm#######'],
      decor: [['shelf', 1, 2], ['shelf', 12, 2], ['barrel', 14, 2], ['plant', 1, 9], ['plant', 14, 9], ['window', 3, 0], ['window', 11, 0], ['shopsign', 6, 0]],
      ents: [['npc', 7, 2, 'mabel'], ['ware', 4, 6, 'bombs'], ['ware', 7, 6, 'soup'], ['ware', 10, 6, 'heart']], out: ['village', 4, 5, 0] },
    h_elder: { kind: 'in', name: "THE ELDER'S HOUSE", song: 'home', map: [
      '################',
      '################',
      '#xx.........xxx#',
      '#xx............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..xx......xx..#',
      '#..xx..........#',
      '#..............#',
      '#p............p#',
      '#######mm#######'],
      decor: [['bed', 1, 2], ['shelf', 12, 2], ['books', 14, 2], ['table', 3, 7], ['chair', 11, 7], ['rug', 6, 4], ['window', 6, 0], ['clock', 10, 0]],
      ents: [['npc', 7, 5, 'elder']], out: ['village', 13, 5, 0] },
    h_nonna: { kind: 'in', name: "NONNA ROSA'S HOUSE", song: 'home', map: [
      '################',
      '################',
      '#xx.........xxx#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#....xx........#',
      '#....xx........#',
      '#..............#',
      '#x............x#',
      '#..............#',
      '#######mm#######'],
      decor: [['bed', 1, 2], ['telly', 13, 2], ['table', 5, 6], ['plant', 1, 9], ['plant', 14, 9], ['rug', 10, 4], ['window', 4, 0], ['fire', 8, 0]],
      ents: [['npc', 4, 4, 'nonna'], ['npc', 13, 4, 'dave', 1]], out: ['village', 3, 10, 0] },
    c_grave: { kind: 'cv', name: 'UNDER THE GRAVE', song: 'cave', dark: 1, map: [
      '################',
      '################',
      '####wwwwwwww####',
      '###w........w###',
      '##w..........w##',
      '##w..........w##',
      '##w..........w##',
      '##w..........w##',
      '###w........w###',
      '####w......w####',
      '#####w....w#####',
      '#######mm#######'],
      ents: [['piece', 7, 5, 'grave'], ['bat', 4, 4], ['bat', 11, 6]], out: ['grave', 8, 5, 0] },
    c_field: { kind: 'cv', name: 'PEAPOD CAVE', song: 'cave', dark: 1, map: [
      '################',
      '################',
      '#.......w.....##',
      '#.p.....w.....##',
      '#.......w.....##',
      '#.......wwqqwww#',
      '#..............#',
      '#..............#',
      '#..p...........#',
      '#.............p#',
      '#..............#',
      '#######mm#######'],
      ents: [['piece', 11, 3, 'cave'], ['bat', 4, 6], ['bat', 10, 8], ['bat', 6, 9], ['gem', 12, 2, 20]], out: ['east', 13, 3, 0] },

    // ---- THE COLANDER KEEP
    d1: { kind: 'dg', gx: 1, gy: 4, name: 'ENTRANCE HALL', song: 'keep', doors: { n: '.', s: 'X' }, map: [
      '################',
      '#..............#',
      '#.t..........t.#',
      '#..............#',
      '#...S......S...#',
      '#..............#',
      '#..............#',
      '#...S......S...#',
      '#..............#',
      '#.p..........p.#',
      '#pp..........pp#',
      '################'],
      ents: [['gloopP', 5, 5], ['gloopP', 10, 6]], exit: ['cliff', 7, 4, 0] },
    d3: { kind: 'dg', gx: 0, gy: 3, name: 'THE TRAP ROOM', song: 'keep', doors: { e: '.' }, trap: 1, map: [
      '################',
      '#..............#',
      '#.S..........S.#',
      '#..............#',
      '#..............#',
      '#......c.......#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#.S..........S.#',
      '#..............#',
      '################'],
      ents: [['gloopP', 4, 4], ['gloopP', 10, 7], ['bat', 7, 3], ['knight', 4, 8]], chests: { '7,5': 'key' }, hidden: { '7,5': 1 } },
    d4: { kind: 'dg', gx: 1, gy: 3, name: 'GREAT HALL', song: 'keep', doors: { n: 'L', s: '.', w: '.', e: '.' }, map: [
      '################',
      '#t............t#',
      '#..............#',
      '#...##....##...#',
      '#...##....##...#',
      '#..............#',
      '#..............#',
      '#...##....##...#',
      '#...##....##...#',
      '#..............#',
      '#t.....pp.....t#',
      '################'],
      ents: [['knight', 8, 3], ['bat', 3, 6], ['bat', 12, 6]] },
    d5: { kind: 'dg', gx: 2, gy: 3, name: 'SAUCE MOAT', song: 'keep', doors: { w: '.' }, map: [
      '################',
      '#...Q.t..t.....#',
      '#.c............#',
      '#vvvvvvoovvvvvv#',
      '#vvvvvvoovvvvvv#',
      '#..............#',
      '#..............#',
      '#..S........S..#',
      '#..............#',
      '#............c.#',
      '#..............#',
      '################'],
      ents: [['gloopP', 6, 7], ['gloopP', 10, 9]], chests: { '2,2': 'key', '13,9': 'map' } },
    d6: { kind: 'dg', gx: 0, gy: 2, name: 'CHEESE CELLAR', song: 'keep', doors: { e: 'L', n: 'U' }, trap: 1, map: [
      '################',
      '#..............#',
      '#.S..........S.#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#.S..........S.#',
      '#..............#',
      '################'],
      ents: [['cheese', 7, 5]] },
    d7: { kind: 'dg', gx: 1, gy: 2, name: 'FORK GALLERY', song: 'keep', doors: { s: 'L', w: 'L', e: '.', n: 'O' }, map: [
      '################',
      '#..............#',
      '#.S..vvvvvv..S.#',
      '#....v....v....#',
      '#....v.c..v....#',
      '#....vv..vv....#',
      '#..............#',
      '#...p......p...#',
      '#..............#',
      '#.S..........S.#',
      '#..............#',
      '################'],
      ents: [['knight', 3, 8], ['knight', 12, 4], ['spike', 1, 1]], chests: { '7,4': 'compass' } },
    d8: { kind: 'dg', gx: 2, gy: 2, name: 'BLOCK ROOM', song: 'keep', doors: { w: '.', n: 'J' }, map: [
      '################',
      '#..............#',
      '#....#######...#',
      '#....#c....#...#',
      '#....#.....#...#',
      '#....###B###...#',
      '#..............#',
      '#..............#',
      '#.S..........S.#',
      '#..............#',
      '#..............#',
      '################'],
      ents: [['spike', 14, 1], ['spike', 1, 10], ['bat', 9, 8], ['gloopP', 12, 7]], chests: { '6,3': 'boom' } },
    d8n: { kind: 'dg', gx: 2, gy: 1, name: 'SECRET LARDER', song: 'keep', secret: 1, doors: { s: 'J' }, map: [
      '################',
      '#..............#',
      '#..t........t..#',
      '#..............#',
      '#...p......p...#',
      '#..............#',
      '#..............#',
      '#...p......p...#',
      '#..............#',
      '#..t........t..#',
      '#..............#',
      '################'],
      ents: [['piece', 7, 5, 'keep'], ['gem', 5, 6, 5], ['gem', 10, 6, 5], ['gem', 7, 8, 20]] },
    d9: { kind: 'dg', gx: 0, gy: 1, name: 'KEY VAULT', song: 'keep', doors: { s: '.', e: '.' }, map: [
      '################',
      '#..............#',
      '#.....#A#......#',
      '#.....#Z#......#',
      '#..............#',
      '#..............#',
      '#..B...........#',
      '#..............#',
      '#.._......B.._.#',
      '#..............#',
      '#..............#',
      '################'],
      ents: [['bat', 11, 3], ['gloopP', 6, 9], ['gloopP', 12, 5]], chests: { '7,2': 'bigkey' } },
    d10: { kind: 'dg', gx: 1, gy: 1, name: 'THE BARON\'S DOOR', song: 'keep', doors: { w: '.', s: 'O', n: 'Y' }, map: [
      '################',
      '#t............t#',
      '#..............#',
      '#..vvvv..vvvv..#',
      '#..vvvv..vvvv..#',
      '#..............#',
      '#..............#',
      '#..p........p..#',
      '#..............#',
      '#.S..........S.#',
      '#p............p#',
      '################'],
      ents: [['knight', 4, 6], ['knight', 11, 8]] },
    d11: { kind: 'dg', gx: 1, gy: 0, name: 'THE BARON\'S KITCHEN', song: 'boss', doors: { s: 'Y' }, trap: 1, map: [
      '################',
      '#t............t#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#t............t#',
      '################'],
      ents: [['baron', 7, 4]] },
  };
  const OWG = {}, DGG = {};
  for (const id in ROOMS) { const r = ROOMS[id]; r.id = id; if (r.kind === 'ow') OWG[r.gx + ',' + r.gy] = id; if (r.kind === 'dg') DGG[r.gx + ',' + r.gy] = id; }

  // ================================================================ SCENERY: houses, the Colander Keep, rooms indoors, the dungeon's walls
  const SCN = {};
  function crisp(c) { const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height); for (let i = 3; i < im.data.length; i += 4) im.data[i] = im.data[i] > 90 ? 255 : 0; g.putImageData(im, 0, 0); return c; }
  function houseArt(w, h, style, door, font) {
    const key = 'house' + w + h + style + door; if (SCN[key]) return SCN[key];
    const PW = w * 16, PH = h * 16, c = cnv(PW + 6, PH + 6), g = c.getContext('2d');
    const roofC = { red: ['#d04a3a', '#8a2420', '#f08a6a'], blue: ['#3a6ad0', '#1a3a8a', '#7aa8f8'], green: ['#3a9a52', '#1a5a2a', '#7ad088'], shop: ['#e08a2a', '#9a4a10', '#f8c070'] }[style];
    const wallH = 24, roofH = PH - wallH + 6;
    // drop shadow on the grass (right and below)
    // walls
    const wy = PH - wallH;
    R(g, 1, wy, PW - 2, wallH, '#f0dcb4'); R(g, 1, wy, 3, wallH, '#fff0d0'); R(g, PW - 5, wy, 4, wallH, '#c8b08a');
    R(g, 1, PH - 5, PW - 2, 5, '#9a8a7a'); for (let x = 2; x < PW - 2; x += 6) R(g, x, PH - 5, 1, 5, '#6a5a4a'); R(g, 1, PH - 5, PW - 2, 1, '#b8a898');
    for (const x of [1, PW - 4]) R(g, x, wy, 3, wallH - 5, '#7a4a28');
    // door
    const dx = door * 16 + 2;
    R(g, dx - 1, PH - 19, 14, 19, '#5a3418'); R(g, dx, PH - 18, 12, 18, '#2a1408'); R(g, dx + 1, PH - 17, 10, 17, '#9a6030');
    for (let x = dx + 3; x < dx + 11; x += 3) R(g, x, PH - 17, 1, 17, '#7a4820'); R(g, dx + 1, PH - 17, 10, 1, '#c88a50'); R(g, dx + 8, PH - 9, 2, 2, '#f8d040');
    R(g, dx - 2, PH - 1, 16, 1, '#6a5a4a');
    // windows either side of the door
    for (const wx of [dx - 20, dx + 20]) {
      if (wx < 6 || wx > PW - 16) continue;
      R(g, wx - 1, wy + 5, 13, 11, '#5a3418'); R(g, wx, wy + 6, 11, 9, '#7ab8e8'); R(g, wx, wy + 6, 11, 3, '#b8e0ff'); R(g, wx + 5, wy + 6, 1, 9, '#5a3418'); R(g, wx, wy + 10, 11, 1, '#5a3418');
      P(g, wx + 1, wy + 7, '#fff'); R(g, wx - 2, wy + 16, 15, 3, '#8a5a28'); for (let i = 0; i < 5; i++) { P(g, wx - 1 + i * 3, wy + 15, i % 2 ? '#f8e040' : '#e83a5a'); P(g, wx + i * 3, wy + 16, '#3a9a3a'); }
    }
    // the roof: rows of shingles, a ridge, dark eaves casting a shadow on the wall
    R(g, 0, 2, PW, roofH, roofC[1]);
    for (let y = 4, row = 0; y < roofH; y += 4, row++) {
      R(g, 1, y, PW - 2, 3, roofC[0]);
      for (let x = (row % 2) * 4; x < PW; x += 8) R(g, x, y, 1, 3, roofC[1]);
      R(g, 1, y, PW - 2, 1, shade(roofC[0], 1.15));
    }
    R(g, 0, 0, PW, 4, roofC[2]); R(g, 0, 3, PW, 1, roofC[1]); R(g, 2, 1, PW - 4, 1, '#fff8e0');
    R(g, 0, 2, 3, roofH, shade(roofC[0], 1.2)); R(g, PW - 3, 2, 3, roofH, roofC[1]);
    R(g, 0, roofH, PW, 3, roofC[1]); R(g, 2, roofH + 3, PW - 4, 2, 'rgba(60,30,10,.45)');
    if (style !== 'shop') { // a chimney
      const cx = PW - 22; R(g, cx, -0, 9, 12, '#8a4a3a'); R(g, cx, 0, 9, 2, '#b86a50'); for (let y = 3; y < 12; y += 3) R(g, cx, y, 9, 1, '#6a3020'); R(g, cx + 1, 0, 2, 12, '#a85a48');
    } else { // a striped awning over the door and a SHOP board
      const ax = dx - 6, ay = PH - 26; for (let i = 0; i < 6; i++) R(g, ax + i * 4, ay, 4, 6, i % 2 ? '#f8f0e0' : '#d83a2a'); R(g, ax, ay + 6, 24, 1, '#7a1a10');
      for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#f8f0e0' : '#d83a2a'; g.beginPath(); g.arc(ax + i * 4 + 2, ay + 6.5, 2, 0, Math.PI); g.fill(); }
      R(g, PW / 2 - 18, 9, 36, 13, '#5a3418'); R(g, PW / 2 - 17, 10, 34, 11, '#f8e0a0'); if (font) font.center(g, 'SHOP', PW / 2, 12, '#8a2a10', 1);
    }
    return SCN[key] = crisp(c);
  }
  function keepArt(font) { // the COLANDER KEEP: a giant silver colander on a stone keep (6x4 tiles)
    if (SCN.keep) return SCN.keep;
    const c = cnv(96, 64), g = c.getContext('2d');
    // the stone base
    R(g, 4, 30, 88, 34, '#6a6078'); for (let y = 32; y < 64; y += 6) { R(g, 4, y, 88, 1, '#4a4058'); for (let x = 4 + (y % 12 ? 0 : 6); x < 92; x += 12) R(g, x, y, 1, 6, '#4a4058'); }
    R(g, 4, 30, 88, 2, '#9a90a8'); R(g, 4, 30, 3, 34, '#8a80a0'); R(g, 89, 30, 3, 34, '#3a3048');
    // the door (tiles 7-8 of the cliff screen = x 32..64)
    R(g, 32, 38, 32, 26, '#2a2030'); E(g, 48, 40, 16, 8, '#2a2030'); R(g, 34, 40, 28, 24, '#08060c'); E(g, 48, 41, 14, 6.5, '#08060c');
    for (let x = 30; x < 67; x += 4) { P(g, x, 38 - Math.round(Math.sqrt(Math.max(0, 256 - (x - 48) * (x - 48))) * 0.5), '#b0a8c0'); }
    // the colander dome, with rows of holes
    g.fillStyle = '#5a6a88'; g.beginPath(); g.ellipse(48, 32, 44, 30, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#9aa8c8'; g.beginPath(); g.ellipse(46, 32, 41, 28, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#c8d4f0'; g.beginPath(); g.ellipse(36, 18, 18, 9, -0.3, 0, 7); g.fill();
    g.fillStyle = '#eef4ff'; g.beginPath(); g.ellipse(32, 14, 8, 3.5, -0.3, 0, 7); g.fill();
    for (let row = 0; row < 3; row++) { const y = 26 - row * 8, n = 8 - row * 2, w = 74 - row * 18; for (let i = 0; i < n; i++) { const x = 48 - w / 2 + (i + 0.5) * w / n; E(g, x, y, 2.4, 1.6, '#1a2030'); P(g, Math.round(x), Math.round(y) + 1, '#e8f0ff'); } }
    R(g, 2, 30, 92, 3, '#4a5670'); R(g, 2, 30, 92, 1, '#d0daf0');
    // the handles
    for (const [x, d] of [[2, -1], [94, 1]]) { R(g, x - (d > 0 ? 2 : 0), 22, 3, 10, '#7a88a8'); R(g, x - (d > 0 ? 0 : 0), 22, 1, 10, '#c8d4f0'); }
    // a little flag on top
    R(g, 47, 0, 1, 6, '#3a3048'); R(g, 48, 0, 6, 4, '#e83a3a'); R(g, 48, 0, 6, 1, '#ff8a7a');
    return SCN.keep = crisp(c);
  }

  function castleArt() { // Princess Zeldo's castle: towers with pointy roofs, lit windows, banners
    if (SCN.castle) return SCN.castle;
    const c = mk(176, 142, g => {
      g.translate(0, 30);
      const st = '#8a86a8', stL = '#b4b0cc', stD = '#5e5a7c', stDD = '#3e3a58', roof = '#c83a4a', roofL = '#f06a6a', roofD = '#7a1a2a';
      const bricks = (x, y, w, h, base) => { R(g, x, y, w, h, base); for (let yy = y + 4; yy < y + h; yy += 5) { R(g, x, yy, w, 1, stD); for (let xx = x + ((yy / 5) % 2 ? 3 : 0); xx < x + w; xx += 7) R(g, xx, yy - 4, 1, 4, stD); } R(g, x, y, 2, h, stL); R(g, x + w - 3, y, 3, h, stDD); };
      const crenel = (x, y, w) => { for (let xx = x; xx < x + w - 3; xx += 6) { R(g, xx, y - 4, 4, 4, st); R(g, xx, y - 4, 4, 1, stL); } };
      const win = (x, y, lit) => { R(g, x - 1, y - 1, 6, 9, stDD); R(g, x, y + 2, 4, 6, lit ? '#f8d878' : '#2a2848'); E(g, x + 2, y + 2, 2, 2, lit ? '#f8d878' : '#2a2848'); if (lit) R(g, x, y + 2, 1, 6, '#fff4c0'); };
      const tower = (x, y, w, h) => { bricks(x, y, w, h, st); g.fillStyle = roofD; g.beginPath(); g.moveTo(x - 4, y + 1); g.lineTo(x + w / 2, y - 34); g.lineTo(x + w + 4, y + 1); g.fill(); g.fillStyle = roof; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + w / 2, y - 33); g.lineTo(x + w / 2 + 3, y); g.fill(); g.fillStyle = roofL; g.beginPath(); g.moveTo(x, y - 2); g.lineTo(x + w / 2, y - 30); g.lineTo(x + w / 2 - 2, y - 2); g.fill(); R(g, x + w / 2, y - 44, 1, 11, stDD); R(g, x + w / 2 + 1, y - 44, 7, 4, '#f8d048'); R(g, x + w / 2 + 1, y - 44, 7, 1, '#fff4a0'); };
      bricks(20, 60, 136, 52, st); crenel(20, 60, 136);
      bricks(56, 34, 64, 78, st); crenel(56, 34, 64);
      tower(6, 44, 26, 68); tower(144, 44, 26, 68); tower(76, 6, 24, 34);
      // the gate
      R(g, 74, 80, 28, 32, stDD); E(g, 88, 81, 14, 9, stDD); R(g, 76, 82, 24, 30, '#1a1428'); E(g, 88, 82, 12, 7, '#1a1428'); for (let x = 78; x < 100; x += 4) R(g, x, 78, 2, 34, '#5a5470'); R(g, 76, 92, 24, 2, '#5a5470'); R(g, 76, 102, 24, 2, '#5a5470');
      // windows
      for (const [x, y] of [[16, 60], [16, 80], [154, 60], [154, 80], [70, 48], [102, 48], [86, 16], [40, 76], [130, 76]]) win(x, y, (x + y) % 3 !== 0);
      // banners
      for (const x of [62, 110]) { R(g, x, 64, 8, 14, '#c83a4a'); R(g, x, 64, 8, 2, '#f06a6a'); g.fillStyle = '#c83a4a'; g.beginPath(); g.moveTo(x, 78); g.lineTo(x + 4, 74); g.lineTo(x + 8, 78); g.fill(); R(g, x + 3, 68, 2, 5, '#f8d048'); }
    });
    return SCN.castle = c;
  }
  // ---- furniture and things indoors (drawn over the floor; their tiles are marked x in the map)
  function decorArt(kind, font) {
    const key = 'dec' + kind; if (SCN[key]) return SCN[key];
    let c;
    switch (kind) {
      case 'bed': c = mk(32, 32, g => {
        R(g, 1, 1, 30, 30, '#6a3a18'); R(g, 2, 2, 28, 6, '#a86a30'); R(g, 2, 2, 28, 1, '#d89a58');
        R(g, 3, 8, 26, 22, '#f8f0e8'); R(g, 5, 9, 22, 7, '#ffffff'); R(g, 5, 15, 22, 1, '#c8c0d0');
        R(g, 3, 16, 26, 14, '#d84a4a'); for (let x = 3; x < 29; x += 6) for (let y = 16; y < 30; y += 6) R(g, x + ((y / 6) % 2) * 3, y, 3, 3, '#f8a040'); R(g, 3, 16, 26, 1, '#f88a7a'); R(g, 27, 16, 2, 14, '#a02a2a');
      }, OUT); break;
      case 'dresser': c = mk(32, 16, g => { R(g, 1, 1, 30, 14, '#8a5428'); R(g, 1, 1, 30, 2, '#c08048'); for (let y = 5; y < 14; y += 4) { R(g, 3, y, 26, 3, '#a8683a'); R(g, 14, y + 1, 4, 1, '#f8d040'); } R(g, 4, -0, 4, 2, '#5ab0e8'); }, OUT); break;
      case 'table': c = mk(32, 32, g => {
        E(g, 17, 28, 14, 3, 'rgba(0,0,0,.35)'); E(g, 16, 14, 15, 11, '#7a4420'); E(g, 16, 13, 14, 10, '#f8f0e0'); E(g, 16, 13, 12, 8, '#e8e0d0');
        for (let i = 0; i < 6; i++) R(g, 3 + i * 5, 21, 3, 3, i % 2 ? '#e83a3a' : '#f8f0e0');
        E(g, 16, 12, 6, 4, '#f8f8ff'); E(g, 16, 11.5, 4.5, 2.6, '#f0c060'); E(g, 16, 11, 3, 1.5, '#e83a20'); P(g, 15, 10, '#ffd0a0'); // a bowl of spaghetti
        R(g, 6, 24, 3, 6, '#5a3010'); R(g, 23, 24, 3, 6, '#5a3010');
      }, OUT); break;
      case 'chair': c = mk(16, 16, g => { R(g, 3, 1, 10, 6, '#8a5428'); R(g, 3, 1, 10, 1, '#c08048'); R(g, 2, 7, 12, 4, '#a8683a'); R(g, 3, 11, 2, 4, '#5a3010'); R(g, 11, 11, 2, 4, '#5a3010'); }, OUT); break;
      case 'plant': c = mk(16, 16, g => { R(g, 4, 10, 8, 5, '#c0602a'); R(g, 4, 10, 8, 1, '#e8905a'); R(g, 5, 15, 6, 1, '#8a3a1a'); E(g, 8, 6, 6, 4.5, '#2a7a2a'); E(g, 6, 5, 3, 2.5, '#4ab048'); E(g, 11, 7, 2.5, 2, '#4ab048'); P(g, 5, 4, '#9ae08a'); P(g, 10, 6, '#9ae08a'); }, OUT); break;
      case 'rug': c = cnv(48, 32); { const g = c.getContext('2d'); R(g, 0, 0, 48, 32, '#7a2a3a'); R(g, 2, 2, 44, 28, '#b84a4a'); R(g, 5, 5, 38, 22, '#d8a040'); R(g, 7, 7, 34, 18, '#9a3040'); for (let i = 0; i < 4; i++) { R(g, 12 + i * 7, 13, 4, 6, '#d8a040'); } for (let x = 0; x < 48; x += 3) { P(g, x, 0, '#d8a040'); P(g, x + 1, 31, '#d8a040'); } } break;
      case 'fire': c = mk(32, 32, g => {
        R(g, 0, 4, 32, 28, '#8a7a7a'); for (let y = 6; y < 32; y += 5) { R(g, 0, y, 32, 1, '#5a4a4a'); for (let x = (y % 10 ? 0 : 5); x < 32; x += 10) R(g, x, y, 1, 5, '#5a4a4a'); }
        R(g, 0, 2, 32, 4, '#6a3a1a'); R(g, 0, 2, 32, 1, '#a86a3a'); R(g, 6, 14, 20, 18, '#1a0a08'); E(g, 16, 14, 10, 4, '#1a0a08');
        E(g, 16, 28, 7, 3, '#e84a1a'); E(g, 16, 26, 4, 4, '#f8a020'); E(g, 16, 27, 2, 2, '#fff0a0'); R(g, 9, 29, 14, 2, '#5a3010');
      }, OUT); break;
      case 'window': c = mk(32, 22, g => { R(g, 3, 3, 26, 17, '#6a4020'); R(g, 5, 5, 22, 13, '#8ac8f8'); R(g, 5, 5, 22, 5, '#c0e4ff'); R(g, 15, 5, 2, 13, '#6a4020'); R(g, 5, 10, 22, 2, '#6a4020'); R(g, 1, 18, 30, 3, '#8a5a28'); P(g, 7, 6, '#fff'); P(g, 8, 6, '#fff'); R(g, 4, 3, 5, 15, '#d84a4a'); R(g, 23, 3, 5, 15, '#d84a4a'); }, OUT); break;
      case 'shelf': c = mk(32, 16, g => { R(g, 1, 1, 30, 14, '#7a4420'); R(g, 2, 2, 28, 5, '#4a2810'); R(g, 2, 8, 28, 6, '#4a2810'); R(g, 1, 7, 30, 1, '#b07038'); const cols = ['#e83a3a', '#3a8ae8', '#f8d040', '#3ab84a', '#e88a2a', '#a85ad8']; for (let i = 0; i < 6; i++) { R(g, 3 + i * 4, 3 + (i % 2), 3, 4 - (i % 2), cols[i]); R(g, 3 + i * 4, 9, 3, 5, cols[(i + 3) % 6]); P(g, 3 + i * 4, 9, '#fff'); } }, OUT); break;
      case 'books': c = mk(16, 16, g => { R(g, 1, 1, 14, 14, '#7a4420'); for (let y = 2; y < 14; y += 6) { R(g, 2, y, 12, 5, '#3a2010'); for (let x = 2; x < 14; x += 2) R(g, x, y + 1, 2, 4, ['#c83a3a', '#3a6ac8', '#3a9a4a', '#d8a030'][(x + y) % 4]); } }, OUT); break;
      case 'barrel': c = mk(16, 16, g => { E(g, 8, 13, 6, 2.5, '#5a3010'); R(g, 2, 3, 12, 10, '#a86a30'); E(g, 8, 3, 6, 2.5, '#c88a48'); E(g, 8, 3, 4.5, 1.5, '#7a4a20'); R(g, 2, 5, 12, 1, '#5a5a6a'); R(g, 2, 10, 12, 1, '#5a5a6a'); R(g, 3, 3, 2, 10, '#c88a48'); }, OUT); break;
      case 'clock': c = mk(16, 30, g => { R(g, 3, 2, 10, 27, '#6a3a18'); R(g, 3, 2, 2, 27, '#9a6030'); E(g, 8, 8, 4, 4, '#f8f0d8'); R(g, 8, 5, 1, 3, '#1a1020'); R(g, 8, 8, 3, 1, '#1a1020'); R(g, 6, 15, 4, 11, '#2a1408'); E(g, 8, 23, 2, 2, '#f8d040'); }, OUT); break;
      case 'telly': c = mk(32, 26, g => { // an old telly on a table, a games console plugged in
        R(g, 2, 16, 28, 9, '#7a4420'); R(g, 2, 16, 28, 2, '#a86a38'); R(g, 4, 25, 3, 1, '#3a2010');
        R(g, 5, 0, 22, 17, '#3a3a44'); R(g, 5, 0, 22, 2, '#5a5a66'); R(g, 7, 2, 15, 12, '#1a2a3a'); R(g, 8, 3, 13, 10, '#3a8ad0'); R(g, 9, 10, 11, 3, '#3ab84a'); R(g, 13, 7, 3, 3, '#e83a3a'); P(g, 9, 4, '#c0e8ff'); R(g, 23, 4, 3, 2, '#8a8a9a'); R(g, 23, 8, 3, 2, '#8a8a9a');
        R(g, 10, 19, 12, 4, '#b8b8c8'); R(g, 11, 19, 10, 1, '#e8e8f0'); R(g, 12, 21, 2, 1, '#3a52d0'); R(g, 15, 21, 2, 1, '#d42a2a'); R(g, 18, 21, 2, 1, '#e8c21a');
      }, OUT); break;
      case 'shopsign': c = mk(64, 20, g => { R(g, 2, 3, 60, 15, '#5a3418'); R(g, 4, 5, 56, 11, '#f8e0a0'); R(g, 4, 5, 56, 2, '#fff4c8'); R(g, 10, 0, 2, 4, '#8a8a9a'); R(g, 52, 0, 2, 4, '#8a8a9a'); }, OUT);
        if (font) font.center(c.getContext('2d'), "MABEL'S", 32, 7, '#8a2a10', 1); break;
      case 'stand': c = mk(16, 16, g => { E(g, 8, 14, 7, 2, 'rgba(0,0,0,.35)'); R(g, 1, 4, 14, 10, '#7a4420'); R(g, 1, 4, 14, 3, '#c08048'); R(g, 1, 7, 14, 1, '#5a3010'); R(g, 3, 9, 10, 3, '#5a3010'); }, OUT); break;
      default: c = cnv(16, 16);
    }
    return SCN[key] = c;
  }

  // ---- the frame round a room indoors (the walls), with the way out at the bottom
  function inFrame(kind) {
    const key = 'inf' + kind; if (SCN[key]) return SCN[key];
    const c = cnv(256, 192), g = c.getContext('2d');
    if (kind === 'in') {
      // the back wall: wallpaper with a dado rail and a skirting board
      R(g, 0, 0, 256, 32, '#e8cfa0'); for (let x = 0; x < 256; x += 8) { R(g, x, 4, 3, 22, '#f0dcb4'); P(g, x + 5, 10, '#d8b888'); P(g, x + 5, 20, '#d8b888'); }
      R(g, 0, 0, 256, 4, '#6a3a18'); R(g, 0, 3, 256, 1, '#9a6030'); R(g, 0, 18, 256, 2, '#9a6030'); R(g, 0, 26, 256, 6, '#7a4420'); R(g, 0, 26, 256, 1, '#b07038'); R(g, 0, 31, 256, 1, '#3a2010');
      // the side walls
      for (const [x, cc] of [[0, '#8a5428'], [240, '#6a3a18']]) { R(g, x, 0, 16, 192, cc); R(g, x + (x ? 0 : 13), 0, 3, 192, x ? '#4a2810' : '#b07038'); for (let y = 8; y < 192; y += 16) R(g, x + 3, y, 10, 1, shade(cc, 0.8)); }
      // the front wall with the doorway
      R(g, 0, 176, 256, 16, '#7a4420'); R(g, 0, 176, 256, 2, '#b07038'); R(g, 0, 190, 256, 2, '#3a2010');
      R(g, 112, 176, 32, 16, '#f8e8a0'); R(g, 114, 176, 28, 16, '#fff4c8'); R(g, 116, 184, 24, 8, '#c84a3a'); for (let x = 117; x < 140; x += 3) R(g, x, 185, 1, 6, '#e87a5a');
      R(g, 110, 176, 2, 16, '#3a2010'); R(g, 144, 176, 2, 16, '#3a2010');
    } else { // a cave
      R(g, 0, 0, 256, 192, '#3a2c28');
      for (let i = 0; i < 300; i++) { const x = hash(i, 1, 77) * 256 | 0, y = hash(i, 2, 77) * 192 | 0; R(g, x, y, 3, 2, hash(i, 3, 77) > 0.5 ? '#4a3a34' : '#2a1e1a'); }
      R(g, 0, 26, 256, 6, '#2a1e1a'); R(g, 0, 31, 256, 1, '#1a1210');
      R(g, 112, 176, 32, 16, '#1a1210'); for (let i = 0; i < 4; i++) R(g, 116 + i * 2, 178 + i * 3, 24 - i * 4, 3, ['#6a5a50', '#5a4a42', '#4a3c36', '#3a2e2a'][i]);
      g.clearRect(16, 32, 224, 144);
    }
    g.clearRect(16, 32, 224, 144);
    return SCN[key] = c;
  }

  // ---- the dungeon's walls, with doors cut in (doors: { n, s, e, w } in the run-time states 'n' open, 'L', 'Y', 'J', 'U', 'X', 'E' bombed)
  function dgFrame(doors) {
    const key = 'dgf' + ['n', 's', 'w', 'e'].map(k => doors[k] || '#').join(''); if (SCN[key]) return SCN[key];
    const c = cnv(256, 192), g = c.getContext('2d');
    R(g, 0, 0, 256, 192, '#22263a');
    // the back wall's face: rows of steel-blue bricks, lighter at the bottom, with colander holes
    for (let y = 0; y < 16; y += 4) { R(g, 0, y, 256, 4, ['#353a54', '#3c4260', '#444a6a', '#4c5476'][y / 4]); for (let x = (y % 8 ? 4 : 0); x < 256; x += 8) R(g, x, y, 1, 4, '#2a2e44'); R(g, 0, y, 256, 1, '#2a2e44'); }
    for (let x = 24; x < 240; x += 32) { if (x > 100 && x < 156) continue; E(g, x, 8, 3, 2.5, '#12141e'); R(g, x - 2, 10, 4, 1, '#8a92b8'); }
    R(g, 0, 15, 256, 1, '#14161f');
    // the front wall's top
    R(g, 0, 176, 256, 16, '#30344c'); R(g, 0, 176, 256, 2, '#6a7294'); for (let x = 0; x < 256; x += 16) R(g, x, 178, 1, 14, '#262a3e');
    // the side walls
    R(g, 0, 0, 16, 192, '#3a405c'); R(g, 13, 16, 3, 160, '#5a6284'); R(g, 15, 16, 1, 160, '#7a82a8'); for (let y = 16; y < 176; y += 8) R(g, 0, y, 13, 1, '#2c3048');
    R(g, 240, 0, 16, 192, '#2c3048'); R(g, 240, 16, 3, 160, '#444a68'); R(g, 240, 16, 1, 160, '#5a6284'); for (let y = 20; y < 176; y += 8) R(g, 243, y, 13, 1, '#22263a');
    // corner posts
    for (const [x, y] of [[0, 0], [240, 0], [0, 176], [240, 176]]) { R(g, x, y, 16, 16, '#4a5070'); R(g, x + 1, y + 1, 14, 14, '#5c6488'); R(g, x + 1, y + 1, 14, 2, '#8a92b8'); E(g, x + 8, y + 8, 3, 3, '#2a2e44'); P(g, x + 7, y + 6, '#a8b0d0'); }
    // doors
    const door = (side, st) => {
      if (!st || st === '#') return;
      const hor = side === 'n' || side === 's';
      const x = hor ? 112 : side === 'w' ? 0 : 240, y = hor ? (side === 'n' ? 0 : 176) : 80, w = hor ? 32 : 16, h = hor ? 16 : 32;
      // the stone frame
      R(g, x - (hor ? 3 : 0), y - (hor ? 0 : 3), w + (hor ? 6 : 0), h + (hor ? 0 : 6), '#6a7294');
      R(g, x, y, w, h, '#06060c');
      if (st === 'X') { // the way out: daylight
        const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#06060c'); gr.addColorStop(1, '#5a6a8a'); g.fillStyle = gr; g.fillRect(x + 2, y, w - 4, h);
      }
      if (st === 'n' || st === 'X') { // an open archway: a little floor shows through
        if (side === 'n') { R(g, x + 2, y + 8, w - 4, 8, '#2a2e44'); } if (side === 's' && st !== 'X') R(g, x + 2, y, w - 4, 6, '#2a2e44'); if (side === 'w') R(g, x + 8, y + 2, 8, h - 4, '#2a2e44'); if (side === 'e') R(g, x, y + 2, 8, h - 4, '#2a2e44');
      }
      if (st === 'L' || st === 'Y') { // a wooden door with iron bands and a lock
        const big = st === 'Y';
        R(g, x + 1, y + 1, w - 2, h - 2, big ? '#8a2a20' : '#7a4a20'); R(g, x + 1, y + 1, w - 2, 1, big ? '#c84a3a' : '#a86a38');
        if (hor) { for (let i = x + 4; i < x + w - 2; i += 5) R(g, i, y + 1, 1, h - 2, big ? '#6a1a10' : '#5a3010'); R(g, x + 1, y + 4, w - 2, 2, '#5a5a6a'); R(g, x + 1, y + 11, w - 2, 2, '#5a5a6a'); }
        else { for (let i = y + 4; i < y + h - 2; i += 5) R(g, x + 1, i, w - 2, 1, big ? '#6a1a10' : '#5a3010'); R(g, x + 4, y + 1, 2, h - 2, '#5a5a6a'); R(g, x + 11, y + 1, 2, h - 2, '#5a5a6a'); }
        const cx = x + w / 2, cy = y + h / 2;
        if (big) { E(g, cx, cy, 6, 6, '#f8c838'); E(g, cx, cy, 4, 4, '#c88a10'); R(g, cx - 1, cy - 2, 2, 5, '#1a1020'); E(g, cx - 2, cy - 2, 1.5, 1.5, '#fff4b0'); }
        else { R(g, cx - 4, cy - 2, 8, 7, '#e8b020'); R(g, cx - 3, cy - 6, 6, 5, 'rgba(0,0,0,0)'); g.strokeStyle = '#c8c8d8'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy - 2, 3, Math.PI, 0); g.stroke(); R(g, cx - 1, cy, 2, 3, '#3a2010'); R(g, cx - 4, cy - 2, 8, 1, '#fff0a0'); }
      }
      if (st === 'U') { // a shutter: iron bars
        if (hor) for (let i = x + 2; i < x + w - 1; i += 5) { R(g, i, y, 3, h, '#8a92b0'); R(g, i, y, 1, h, '#d0d6ec'); } else for (let i = y + 2; i < y + h - 1; i += 5) { R(g, x, i, w, 3, '#8a92b0'); R(g, x, i, w, 1, '#d0d6ec'); }
        R(g, x + (hor ? 0 : w / 2 - 1), y + (hor ? h / 2 - 1 : 0), hor ? w : 2, hor ? 2 : h, '#5a6080');
      }
      if (st === 'J') { // a cracked bit of wall (it looks almost like the rest)
        if (hor) { for (let yy = y; yy < y + h; yy += 4) { R(g, x - 3, yy, w + 6, 4, ['#353a54', '#3c4260', '#444a6a', '#4c5476'][(yy - y) / 4 | 0] || '#444a6a'); R(g, x - 3, yy, w + 6, 1, '#2a2e44'); } }
        else R(g, x, y - 3, w, h + 6, side === 'w' ? '#3a405c' : '#2c3048');
        g.fillStyle = '#0c0c14'; const cx = x + w / 2, cy = y + h / 2;
        [[0, 0], [1, 1], [2, 1], [3, 2], [-1, -1], [-2, -1], [-3, -2], [1, -1], [2, -2], [-1, 2], [-2, 3], [4, 2], [-4, -2]].forEach(([a, b]) => g.fillRect(cx + a, cy + b, 1, 1));
      }
      if (st === 'E') { // a hole blown in the wall: rubble round the edge
        for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; E(g, x + w / 2 + Math.cos(a) * w * 0.45, y + h / 2 + Math.sin(a) * h * 0.45, 2.5, 2, '#5a6080'); }
        R(g, x + 3, y + 3, w - 6, h - 6, '#06060c');
      }
    };
    door('n', doors.n); door('s', doors.s); door('w', doors.w); door('e', doors.e);
    g.clearRect(16, 16, 224, 160);
    return SCN[key] = c;
  }

  // ================================================================ MUSIC (all original; written as note:length-in-16ths)
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function tune(s) {
    const out = [];
    for (const tok of s.trim().split(/\s+/)) {
      if (tok === '|') continue; const [n, d] = tok.split(':'); const len = +d || 1;
      if (n === '.') { for (let i = 0; i < len; i++) out.push(0); continue; }
      const m = /^([A-G])(#|b)?(\d)$/.exec(n); if (!m) continue;
      out.push((+m[3] + 1) * 12 + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)); for (let i = 1; i < len; i++) out.push(-1);
    }
    return out;
  }
  const SONGS = {
    title: { bpm: 92, wave: 'square', bassWave: 'triangle', vol: 0.05, drums: 'o.......o...x...',
      lead: tune('C5:6 G4:2 C5:2 D5:2 E5:4 | F5:6 E5:2 D5:4 C5:4 | A4:6 C5:2 F5:4 E5:2 D5:2 | G5:12 .:4 | E5:6 D5:2 C5:2 D5:2 E5:4 | F5:4 A5:4 G5:4 F5:4 | E5:4 C5:4 D5:4 B4:4 | C5:12 .:4'),
      bass: tune('C3:4 G3:4 C3:4 G3:4 | F2:4 C3:4 F2:4 C3:4 | F2:4 C3:4 F2:4 A2:4 | G2:4 D3:4 G2:4 B2:4 | C3:4 G3:4 A2:4 E3:4 | F2:4 C3:4 D3:4 A2:4 | G2:4 E3:4 G2:4 F3:4 | C3:4 G2:4 C3:8') },
    field: { bpm: 132, wave: 'square', bassWave: 'triangle', vol: 0.045, drums: 'o.x.o.x.o.x.oxx.',
      lead: tune('F4:2 A4:2 C5:4 A4:2 C5:2 F5:4 | E5:2 D5:2 C5:2 A4:2 G4:6 .:2 | Bb4:2 A4:2 G4:2 Bb4:2 D5:4 C5:4 | A4:2 G4:2 F4:2 G4:2 A4:8 | F4:2 A4:2 C5:4 A4:2 C5:2 F5:4 | G5:2 F5:2 E5:2 D5:2 C5:6 .:2 | Bb4:2 D5:2 F5:4 E5:2 D5:2 E5:4 | F5:8 C5:4 .:4 | D5:4 C5:2 Bb4:2 A4:4 G4:4 | A4:2 Bb4:2 C5:4 F4:8 | G4:2 A4:2 Bb4:4 D5:4 C5:2 Bb4:2 | A4:12 .:4 | D5:4 E5:2 F5:2 G5:4 F5:2 E5:2 | F5:4 D5:4 A4:8 | Bb4:2 C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 Bb5:2 | C6:8 .:4 C5:4'),
      bass: tune('F2:2 C3:2 F3:2 C3:2 F2:2 C3:2 F3:2 C3:2 | C3:2 G3:2 C3:2 G3:2 C3:2 G3:2 E3:2 G3:2 | Bb2:2 F3:2 Bb2:2 F3:2 Bb2:2 F3:2 D3:2 F3:2 | F2:2 C3:2 F3:2 C3:2 C3:2 G3:2 C3:2 E3:2 | F2:2 C3:2 F3:2 C3:2 F2:2 C3:2 F3:2 C3:2 | C3:2 G3:2 C3:2 G3:2 A2:2 E3:2 A2:2 E3:2 | Bb2:2 F3:2 Bb2:2 F3:2 C3:2 G3:2 C3:2 G3:2 | F2:2 C3:2 F3:2 A3:2 F3:4 .:4 | Bb2:2 F3:2 Bb2:2 F3:2 F2:2 C3:2 F2:2 C3:2 | F2:2 C3:2 F2:2 C3:2 F2:2 A2:2 C3:2 F3:2 | G2:2 D3:2 G2:2 D3:2 Bb2:2 F3:2 Bb2:2 F3:2 | F2:2 C3:2 F3:2 C3:2 F2:2 C3:2 F3:2 C3:2 | D3:2 A3:2 D3:2 A3:2 C3:2 G3:2 C3:2 G3:2 | D3:2 A3:2 D3:2 A3:2 D3:2 F3:2 A3:2 D3:2 | Bb2:2 F3:2 Bb2:2 F3:2 C3:2 G3:2 C3:2 G3:2 | C3:2 G3:2 C3:2 E3:2 C3:4 C3:4') },
    village: { bpm: 108, wave: 'triangle', bassWave: 'triangle', vol: 0.07, drums: 'o...x...o.o.x...',
      lead: tune('G4:4 B4:2 D5:2 G5:4 F#5:2 E5:2 | D5:4 B4:4 G4:4 A4:4 | C5:4 E5:2 C5:2 A4:4 B4:2 C5:2 | B4:4 G4:4 D4:8 | E4:2 G4:2 B4:4 A4:2 G4:2 E5:4 | D5:4 C5:2 B4:2 A4:8 | C5:2 B4:2 A4:2 G4:2 F#4:4 A4:4 | G4:12 .:4'),
      bass: tune('G2:4 D3:4 B2:4 D3:4 | G2:4 D3:4 G2:4 F#2:4 | C3:4 G3:4 A2:4 E3:4 | G2:4 D3:4 G2:4 D3:4 | E2:4 B2:4 C3:4 G2:4 | D3:4 A2:4 D3:4 F#3:4 | C3:4 E3:4 D3:4 F#3:4 | G2:4 D3:4 G2:8') },
    woods: { bpm: 96, wave: 'triangle', bassWave: 'sine', vol: 0.07,
      lead: tune('A4:4 E5:4 D5:2 C5:2 B4:4 | C5:4 A4:4 E4:8 | F4:4 A4:4 C5:4 B4:2 A4:2 | G#4:12 .:4 | A4:4 C5:4 E5:4 A5:4 | G5:2 F5:2 E5:4 D5:4 C5:4 | B4:4 D5:4 C5:2 B4:2 A4:2 G#4:2 | A4:12 .:4'),
      bass: tune('A2:8 E3:8 | A2:8 C3:8 | F2:8 D3:8 | E2:8 E3:8 | A2:8 E3:8 | C3:8 G2:8 | D3:8 E3:8 | A2:16') },
    grave: { bpm: 76, wave: 'sine', bassWave: 'triangle', vol: 0.08,
      lead: tune('E5:4 B4:4 C5:4 A4:4 | B4:8 E4:8 | F4:4 A4:4 G#4:4 B4:4 | E5:12 .:4 | D5:4 C5:4 B4:4 A4:4 | G#4:8 B4:8 | C5:4 B4:4 A4:4 G#4:4 | A4:12 .:4'),
      bass: tune('A2:16 | E2:16 | D2:16 | E2:16 | F2:16 | E2:16 | D2:8 E2:8 | A2:16') },
    home: { bpm: 88, wave: 'triangle', bassWave: 'sine', vol: 0.07,
      lead: tune('E5:4 C5:4 D5:4 G4:4 | C5:4 D5:2 E5:2 C5:8 | A4:4 F5:4 E5:4 D5:4 | C5:4 B4:4 C5:8 | G5:4 E5:4 F5:4 D5:4 | E5:4 C5:2 D5:2 E5:8 | F5:4 A4:4 D5:4 B4:4 | C5:12 .:4'),
      bass: tune('C3:8 G2:8 | A2:8 E2:8 | F2:8 G2:8 | G2:8 C3:8 | C3:8 B2:8 | A2:8 E2:8 | F2:8 G2:8 | C3:16') },
    shop: { bpm: 140, wave: 'square', bassWave: 'triangle', vol: 0.04, drums: 'o.x.o.x.',
      lead: tune('C5:2 E5:2 G5:2 E5:2 F5:2 D5:2 B4:4 | C5:2 E5:2 G5:2 C6:2 B5:4 G5:4 | A5:2 F5:2 D5:2 F5:2 G5:2 E5:2 C5:4 | D5:2 B4:2 G4:2 B4:2 C5:8'),
      bass: tune('C3:2 G3:2 C3:2 G3:2 G2:2 D3:2 G2:2 D3:2 | C3:2 G3:2 C3:2 G3:2 E3:2 B3:2 E3:2 B3:2 | F2:2 C3:2 F2:2 C3:2 C3:2 G3:2 A2:2 E3:2 | G2:2 D3:2 G2:2 B2:2 C3:4 .:4') },
    cave: { bpm: 80, wave: 'sine', bassWave: 'triangle', vol: 0.07,
      lead: tune('E5:2 .:6 B4:2 .:6 | C5:2 .:6 A4:2 .:6 | D5:2 .:6 G4:2 .:6 | B4:2 .:4 G#4:2 .:8'),
      bass: tune('E2:16 | A2:16 | G2:16 | E2:16') },
    keep: { bpm: 120, wave: 'square', bassWave: 'triangle', vol: 0.04, drums: 'o...x...o.o.x...',
      lead: tune('D4:2 .:2 D4:2 F4:2 A4:4 G#4:4 | A4:2 .:2 A4:2 C5:2 E5:4 D5:4 | Bb4:2 .:2 Bb4:2 D5:2 F5:4 E5:4 | C#5:4 E5:4 A4:8 | D5:2 .:2 D5:2 F5:2 A5:4 G5:4 | F5:2 E5:2 D5:2 C5:2 Bb4:4 A4:4 | G4:2 Bb4:2 D5:2 G5:2 F5:2 E5:2 D5:2 C#5:2 | D5:12 .:4 | F4:4 E4:4 D4:4 C#4:4 | D4:2 F4:2 A4:2 D5:2 C5:4 A4:4 | Bb4:4 A4:4 G4:4 F4:4 | E4:12 .:4 | A4:2 .:2 A4:2 Bb4:2 C5:4 D5:4 | E5:2 F5:2 E5:2 D5:2 C#5:8 | D5:2 F5:2 A5:2 D6:2 C6:2 A5:2 F5:2 E5:2 | D5:12 .:4'),
      bass: tune('D2:2 D3:2 D2:2 D3:2 D2:2 D3:2 D2:2 D3:2 | A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 | Bb2:2 Bb3:2 Bb2:2 Bb3:2 Bb2:2 Bb3:2 Bb2:2 Bb3:2 | A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 | D2:2 D3:2 D2:2 D3:2 D2:2 D3:2 D2:2 D3:2 | Bb2:2 Bb3:2 Bb2:2 Bb3:2 F2:2 F3:2 F2:2 F3:2 | G2:2 G3:2 G2:2 G3:2 A2:2 A3:2 A2:2 A3:2 | D2:2 D3:2 D2:2 D3:2 D2:8 | D2:2 D3:2 D2:2 D3:2 A2:2 A3:2 A2:2 A3:2 | D2:2 D3:2 D2:2 D3:2 F2:2 F3:2 F2:2 F3:2 | G2:2 G3:2 G2:2 G3:2 Bb2:2 Bb3:2 Bb2:2 Bb3:2 | A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 | F2:2 F3:2 F2:2 F3:2 G2:2 G3:2 G2:2 G3:2 | A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 A2:2 A3:2 | Bb2:2 Bb3:2 Bb2:2 Bb3:2 A2:2 A3:2 A2:2 A3:2 | D2:2 D3:2 D2:2 D3:2 D2:8') },
    boss: { bpm: 168, wave: 'sawtooth', bassWave: 'square', vol: 0.035, drums: 'o.xxo.xxo.xxoxxx',
      lead: tune('E5:2 E5:2 .:2 E5:2 G5:2 E5:2 D5:2 B4:2 | C5:2 C5:2 .:2 C5:2 E5:2 C5:2 B4:2 A4:2 | E5:2 E5:2 .:2 E5:2 G5:2 A5:2 B5:4 | A5:2 G5:2 F#5:2 G5:2 E5:8 | B4:2 B4:2 .:2 B4:2 D5:2 B4:2 A4:2 F#4:2 | G4:2 G4:2 .:2 G4:2 B4:2 G4:2 F#4:2 E4:2 | E5:2 F#5:2 G5:2 A5:2 B5:2 A5:2 G5:2 F#5:2 | E5:4 B4:4 E5:8'),
      bass: tune('E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 | C2:2 C3:2 C2:2 C3:2 C2:2 C3:2 C2:2 C3:2 | E2:2 E3:2 E2:2 E3:2 D2:2 D3:2 D2:2 D3:2 | B1:2 B2:2 B1:2 B2:2 E2:2 E3:2 E2:4 | B1:2 B2:2 B1:2 B2:2 B1:2 B2:2 B1:2 B2:2 | C2:2 C3:2 C2:2 C3:2 C2:2 C3:2 C2:2 C3:2 | A1:2 A2:2 A1:2 A2:2 B1:2 B2:2 B1:2 B2:2 | E2:2 E3:2 E2:2 E3:2 E2:8') },
    ending: { bpm: 112, wave: 'square', bassWave: 'triangle', vol: 0.05, drums: 'o...x...o.o.x.x.',
      lead: tune('C5:4 E5:2 G5:2 C6:6 B5:2 | A5:4 F5:4 C5:8 | D5:4 F5:2 A5:2 G5:4 E5:4 | G5:12 .:4 | C6:4 B5:2 A5:2 G5:4 E5:4 | F5:4 A5:4 G5:4 E5:4 | D5:4 G5:4 F5:4 D5:4 | C5:12 .:4'),
      bass: tune('C3:4 G3:4 E3:4 G3:4 | F2:4 C3:4 A2:4 C3:4 | D3:4 A3:4 G2:4 D3:4 | G2:4 D3:4 B2:4 D3:4 | A2:4 E3:4 E2:4 B2:4 | F2:4 C3:4 C3:4 G3:4 | G2:4 D3:4 G2:4 B2:4 | C3:4 G2:4 C3:8') },
    files: { bpm: 84, wave: 'triangle', bassWave: 'sine', vol: 0.07,
      lead: tune('G5:2 E5:2 C5:2 E5:2 G5:2 E5:2 C5:2 E5:2 | A5:2 F5:2 C5:2 F5:2 A5:2 F5:2 C5:2 F5:2 | G5:2 D5:2 B4:2 D5:2 G5:2 D5:2 B4:2 D5:2 | E5:2 C5:2 G4:2 C5:2 E5:4 .:4'),
      bass: tune('C3:16 | F2:16 | G2:16 | C3:16') },
  };

  TV.game('sn.zeldo', {
    buttons: ['a', 'b', 'x', 'y'], v: 1,
    help: 'Walk: arrows. Sword: X (hold it, then let go: spin attack). Talk / lift / open: Z. Use item: V. Map: C. Menu and save: Enter.',
    make(K) {
      const g = K.g, F = K.font, sfx = K.sfx;
      g.imageSmoothingEnabled = false;
      if (!SWORD) { buildObjSprites(); buildSword(); buildMonsters(); buildItems(); }
      const LB = b => K.label(b);

      // ============================================================ sounds
      const SND = {
        sword() { sfx.noise(0.12, 0.1, 3000, 0, 'bandpass', 900); sfx.tone(900, 0.07, 'square', 0.025, 0, 500); },
        spin() { sfx.noise(0.35, 0.14, 1500, 0, 'bandpass', 5000); sfx.tone(300, 0.35, 'sawtooth', 0.04, 0, 1200); },
        charged() { sfx.tone(1568, 0.06, 'square', 0.05); sfx.tone(2093, 0.12, 'square', 0.05, 0.06); },
        hit() { sfx.noise(0.08, 0.14, 2500); sfx.tone(220, 0.1, 'square', 0.07, 0, 90); },
        tink() { sfx.tone(2400, 0.07, 'square', 0.05); sfx.tone(3200, 0.06, 'triangle', 0.05, 0.03); },
        poof() { sfx.noise(0.3, 0.14, 1200, 0, 'lowpass', 200); sfx.tone(520, 0.15, 'square', 0.04, 0.02, 1400); },
        hurt() { sfx.tone(500, 0.18, 'sawtooth', 0.07, 0, 160); sfx.noise(0.12, 0.1, 1200); },
        gem() { sfx.tone(1760, 0.05, 'square', 0.045); sfx.tone(2637, 0.12, 'square', 0.045, 0.05); },
        heart() { sfx.tone(1047, 0.06, 'triangle', 0.08); sfx.tone(1568, 0.1, 'triangle', 0.08, 0.06); },
        key() { sfx.seq([[84, 0.5], [88, 0.5], [91, 1]], { bpm: 600, vol: 0.06 }); },
        item() { sfx.seq([[72, 1], [76, 1], [79, 1], [84, 3]], { bpm: 280, vol: 0.07 }); sfx.seq([[60, 1], [64, 1], [67, 1], [72, 3]], { bpm: 280, wave: 'triangle', vol: 0.1 }); },
        big() { sfx.seq([[67, 1], [72, 1], [76, 1], [79, 2], [76, 1], [79, 1], [84, 5]], { bpm: 300, vol: 0.07 }); sfx.seq([[55, 3], [60, 2], [64, 2], [67, 5]], { bpm: 300, wave: 'triangle', vol: 0.1 }); },
        secret() { sfx.seq([[76, 0.5], [79, 0.5], [84, 0.5], [83, 0.5], [79, 0.5], [88, 2]], { bpm: 300, vol: 0.06 }); sfx.seq([[64, 1], [67, 1], [72, 2]], { bpm: 300, wave: 'triangle', vol: 0.08 }); },
        door() { sfx.noise(0.25, 0.12, 600, 0, 'lowpass', 150); sfx.tone(110, 0.25, 'square', 0.04, 0, 70); },
        unlock() { sfx.tone(1200, 0.05, 'square', 0.05); sfx.tone(900, 0.05, 'square', 0.05, 0.05); sfx.noise(0.2, 0.1, 800, 0.1); },
        chest() { sfx.tone(300, 0.15, 'square', 0.05, 0, 600); sfx.noise(0.15, 0.08, 1500, 0.05); },
        bombSet() { sfx.tone(200, 0.06, 'square', 0.05); },
        fuse() { sfx.noise(0.05, 0.025, 6000, 0, 'highpass'); },
        boom() { sfx.noise(0.7, 0.3, 900, 0, 'lowpass', 60); sfx.tone(90, 0.5, 'sine', 0.18, 0, 30); },
        lift() { sfx.tone(260, 0.08, 'square', 0.04, 0, 420); },
        throw() { sfx.noise(0.12, 0.08, 2000, 0, 'bandpass', 600); },
        smash() { sfx.noise(0.25, 0.14, 2500, 0, 'bandpass', 500); sfx.tone(700, 0.06, 'square', 0.035, 0.02, 300); },
        cut() { sfx.noise(0.15, 0.11, 3500, 0, 'highpass', 1500); },
        push() { sfx.noise(0.25, 0.07, 400, 0, 'lowpass'); },
        boomer() { sfx.tone(700, 0.07, 'triangle', 0.035, 0, 900); },
        blip() { sfx.tone(1400, 0.02, 'square', 0.02); },
        menu() { sfx.tone(1200, 0.04, 'square', 0.045); },
        pick() { sfx.tone(800, 0.05, 'square', 0.045); sfx.tone(1600, 0.08, 'square', 0.045, 0.05); },
        stairs() { for (let i = 0; i < 5; i++) sfx.tone(400 - i * 50, 0.06, 'square', 0.035, i * 0.07); },
        low() { sfx.tone(1800, 0.05, 'square', 0.025); sfx.tone(1800, 0.05, 'square', 0.025, 0.12); },
        crystal() { sfx.tone(1318, 0.1, 'triangle', 0.08); sfx.tone(1976, 0.2, 'triangle', 0.06, 0.06); },
        click() { sfx.tone(220, 0.08, 'square', 0.05); sfx.tone(330, 0.08, 'square', 0.05, 0.06); },
        roar() { sfx.tone(140, 0.6, 'sawtooth', 0.09, 0, 60); sfx.noise(0.5, 0.12, 500, 0, 'lowpass', 100); },
        stomp() { sfx.tone(70, 0.3, 'sine', 0.2, 0, 35); sfx.noise(0.25, 0.14, 300); },
        splat() { sfx.noise(0.15, 0.09, 900, 0, 'lowpass', 300); },
        cluck() { sfx.tone(900, 0.05, 'square', 0.035, 0, 1300); sfx.tone(700, 0.07, 'square', 0.035, 0.07, 1100); },
        die() { sfx.seq([[72, 1], [71, 1], [70, 1], [69, 4]], { bpm: 220, vol: 0.06 }); },
        save() { sfx.seq([[79, 0.5], [84, 0.5], [88, 1]], { bpm: 360, vol: 0.05 }); },
        shut() { sfx.noise(0.2, 0.12, 1200, 0, 'bandpass', 300); sfx.tone(160, 0.15, 'square', 0.045); },
        heal() { for (let i = 0; i < 6; i++) sfx.tone(800 + i * 150, 0.06, 'triangle', 0.045, i * 0.05); },
        shine() { sfx.tone(2093, 0.3, 'triangle', 0.04, 0, 3136); },
      };
      const song = name => { if (curSong === name) return; curSong = name; K.music(name ? SONGS[name] : null); };
      let curSong = null;

      // ============================================================ the save files (three slots: Jack's mates got there first)
      const HOF0 = [['LUKE', 14820], ['JK', 12260], ['JACK', 9870], ['DAVE', 7350], ['CAL', 4410], ['MOM', 1250]];
      function freshSave(name) {
        return { name, hp: 6, maxH: 3, pieces: 0, got: {}, gems: 0, bombs: 0, bag: 0, keys: 0, big: 0, map: 0, comp: 0, sword: 0, shield: 0, boom: 0, bottle: 0,
          sel: '', f: {}, opened: {}, doors: {}, cleared: {}, seen: {}, gone: {}, room: 'h_home', x: 136, y: 124, dir: 0, time: 0, score: 0, deaths: 0, done: 0, intro: 0 };
      }
      function demoSaves() {
        const d = freshSave('DAVE SUX'); Object.assign(d, { intro: 1, sword: 1, shield: 1, room: 'village', x: 120, y: 92, gems: 12, time: 2832, score: 380, hp: 3, f: { mom: 1 }, seen: { h_home: 1, home: 1, south: 1, village: 1 } });
        const t = freshSave('TEST'); Object.assign(t, { intro: 1, time: 63, score: 0, seen: { h_home: 1 } });
        return [null, d, t];
      }
      let store = (() => { const s = K.load(); if (s && s.v === 1 && Array.isArray(s.slots) && s.slots.length === 3 && Array.isArray(s.hof)) return s; return { v: 1, slots: demoSaves(), hof: HOF0.map(([n, sc]) => ({ n, s: sc })), last: 0 }; })();
      let S = null, slot = 0;
      function persist() { K.save(store); }
      function save() { if (!S || !room || !pl) return; S.room = room.id; S.x = Math.round(pl.x); S.y = Math.round(pl.y); S.dir = pl.dir; store.slots[slot] = S; store.last = slot; persist(); }

      // ============================================================ score: progress points (and JackNet reports, spaced out)
      const addScore = n => { if (S) S.score = Math.min(60000, (S.score | 0) + n); };
      let lastRep = { t: 0, sc: 0 }, repPend = false;
      const repOK = sc => K.t - lastRep.t >= Math.max(64, sc / 45 + 8);
      function report() {
        if (!S) return; const sc = Math.min(99999, S.score | 0);
        if (sc <= lastRep.sc) { repPend = false; return; }
        if (S.f.cheese || !repOK(sc)) { repPend = !S.f.cheese; return; } // (after the mini-boss we save it all for the end)
        K.over(sc, { keep: true }); lastRep = { t: K.t, sc }; repPend = false;
      }
      function finalScore(sc, title, text) { // the server believes points per second since the last report: never send more than that
        const allowed = Math.floor(57 * (K.t - lastRep.t + 4));
        sc = Math.max(0, Math.min(99999, sc, allowed));
        lastRep = { t: K.t, sc }; K.over(sc, { title, text });
      }

      // ============================================================ rooms: load, doors, tiles, drawing
      let room = null, ents = [], shots = [], fx = [], pl = null;
      const SOLID = new Set('TbrXCFSgGhKOxkpcwq#BtQAeaZ13LYJU%~v'.split(''));
      const LOW = new Set(['~', 'v']); // you can't walk on them, but things fly over
      const LIFT = { b: 'bush', r: 'rock', p: 'pot' };
      const WALKDOOR = new Set(['n', 'X', 'E']);
      const inRoom = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
      const tileAt = (rm, x, y) => inRoom(x, y) ? rm.t[y][x] : null;
      function under(rm, x, y) {
        if (rm.kind !== 'ow') return '.';
        for (const [a, b] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (tileAt(rm, x + a, y + b) === ':') return ':';
        return '.';
      }
      function nbRoom(rm, side) { // the room next door (overworld screens and dungeon rooms are on grids)
        const d = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[side], k = (rm.def.gx + d[0]) + ',' + (rm.def.gy + d[1]);
        return rm.kind === 'ow' ? OWG[k] : rm.kind === 'dg' ? DGG[k] : null;
      }
      const doorId = (a, b) => [a, b].sort().join('|');
      const DOORCELLS = { n: [[7, 0], [8, 0]], s: [[7, 11], [8, 11]], w: [[0, 5], [0, 6]], e: [[15, 5], [15, 6]] };
      function setDoors(rm) {
        const D = rm.def.doors || {};
        for (const side of ['n', 's', 'w', 'e']) {
          let st = '#'; const t = D[side];
          if (t) {
            const other = nbRoom(rm, side), did = other ? doorId(rm.id, other) : '';
            st = t === '.' ? 'n' : t === 'X' ? 'X' : t === 'L' ? (S.doors[did] ? 'n' : 'L') : t === 'Y' ? (S.doors[did] ? 'n' : 'Y') : t === 'J' ? (S.doors[did] ? 'E' : 'J')
              : t === 'U' ? (S.cleared[rm.id] ? 'n' : 'U') : t === 'O' ? (S.doors[did] ? 'n' : 'U') : 'n';
            if (rm.trapOn && (st === 'n' || st === 'E' || st === 'X')) st = 'U';
            rm.did[side] = did;
          }
          rm.doors[side] = st;
          for (const [x, y] of DOORCELLS[side]) rm.t[y][x] = st === '#' ? '#' : st;
        }
      }
      function applyCrystal(rm) {
        for (const [x, y, c] of rm.cry) rm.t[y][x] = c === 'o' ? (S.f.cry ? '2' : '1') : (S.f.cry ? '3' : '4');
      }
      function makeRoom(id) {
        const def = ROOMS[id];
        const rm = { id, def, kind: def.kind, G: GRASS[def.gp || 'n'], t: def.map.map(r => r.split('')), doors: {}, did: {}, fr: null, cry: [], sw: [], trapOn: false, name: roomName(id) };
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const c = rm.t[y][x]; if (c === 'o' || c === 'u') rm.cry.push([x, y, c]); if (c === '_') rm.sw.push([x, y]); }
        for (const k of (S.gone[id] || [])) { const [x, y] = k.split(',').map(Number); rm.t[y][x] = under(rm, x, y); }
        for (const k in (def.chests || {})) {
          const [x, y] = k.split(',').map(Number);
          if (def.hidden && def.hidden[k] && !S.cleared[id]) rm.t[y][x] = '.';
          else if (S.opened[id + ':' + k]) rm.t[y][x] = rm.t[y][x] === 'A' ? 'a' : 'e';
        }
        if (id === 'grave' && S.f.grave) { rm.t[3][8] = 'G'; rm.t[4][8] = '^'; }
        if (id === 'd9' && S.f.gate) rm.t[3][7] = 'z';
        applyCrystal(rm);
        if (rm.kind === 'dg') setDoors(rm);
        return rm;
      }
      function roomName(id) { return ROOMS[id].name.replace('{N}', (S && S.name ? S.name.trim() : 'JACK') || 'JACK'); }
      // remember a tile that's gone for good (a blown-up boulder, a bombed wall)
      function goneForGood(rm, x, y) { const a = S.gone[rm.id] = S.gone[rm.id] || []; const k = x + ',' + y; if (!a.includes(k)) a.push(k); }

      // ---- drawing a room into four animation frames (water, flowers and torches move)
      const PATHY = new Set([':', 'D', 'd', '@', '=', '^', 'X']);
      const GRASSY = new Set(['.', '"', 'f', 'T', 'b', 'r', 'F', 'S', 'g', 'G', 'O', 'h']);
      const ANIM = new Set(['~', 'v', 'f', 't', '=']);
      function render(rm) { // static tiles once, then only the moving ones in frames 1-3
        if (!rm.fr) rm.fr = [0, 1, 2, 3].map(() => cnv(RW, RH));
        const g0 = rm.fr[0].getContext('2d'); g0.clearRect(0, 0, RW, RH);
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) drawTile(g0, rm, x, y, 0);
        overlays(g0, rm);
        for (let f = 1; f < 4; f++) {
          const gg = rm.fr[f].getContext('2d'); gg.clearRect(0, 0, RW, RH); gg.drawImage(rm.fr[0], 0, 0);
          let any = false;
          for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (ANIM.has(rm.t[y][x])) { gg.clearRect(x * 16, y * 16, 16, 16); drawTile(gg, rm, x, y, f); any = true; }
          if (any && rm.kind !== 'ow') overlays(gg, rm);
        }
      }
      function redrawTile(rm, x, y) {
        if (!rm.fr) return;
        if (rm.kind !== 'ow' && rm.kind !== 'dg') { render(rm); return; } // (indoors: furniture sits over the floor)
        for (let f = 0; f < 4; f++) { const gg = rm.fr[f].getContext('2d'); gg.clearRect(x * 16, y * 16, 16, 16); drawTile(gg, rm, x, y, f); }
        // neighbours whose edges depend on this tile
        for (const [a, b] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const c = tileAt(rm, x + a, y + b); if (c === '~' || c === 'v' || c === ':' || c === 's') for (let f = 0; f < 4; f++) drawTile(rm.fr[f].getContext('2d'), rm, x + a, y + b, f); }
      }
      function fringe(gg, ox, oy, side, col, shadowCol, seed) {
        for (let i = 0; i < 16; i++) {
          const h = 1 + ((hash(ox + i, oy + seed, 5) * 2.6) | 0);
          if (side === 0) { R(gg, ox + i, oy, 1, h, col); if (shadowCol) P(gg, ox + i, oy + h, shadowCol); }
          if (side === 1) { R(gg, ox + i, oy + 16 - h, 1, h, col); }
          if (side === 2) { R(gg, ox, oy + i, h, 1, col); }
          if (side === 3) { R(gg, ox + 16 - h, oy + i, h, 1, col); }
        }
      }
      function drawTile(gg, rm, x, y, f) {
        const ch = rm.t[y][x], ox = x * 16, oy = y * 16, G = rm.G, k = rm.kind;
        const v = (hash(x, y, 3) * 4) | 0;
        const T = (xx, yy) => (xx < 0 || yy < 0 || xx >= COLS || yy >= ROWS) ? null : rm.t[yy][xx];
        const nb4 = fn => { let m = 0; if (fn(T(x, y - 1), 0, -1)) m |= 1; if (fn(T(x, y + 1), 0, 1)) m |= 2; if (fn(T(x - 1, y), -1, 0)) m |= 4; if (fn(T(x + 1, y), 1, 0)) m |= 8; return m; };
        if (k === 'ow') {
          const ground = () => gg.drawImage(grassTile(G, v), ox, oy);
          switch (ch) {
            case '"': gg.drawImage(tallTile(G), ox, oy); break;
            case 'f': gg.drawImage(flowerTile(G, [0, 1, 2, 1][f], v & 1), ox, oy); break;
            case ':': case 'X': {
              gg.drawImage(pathTile(v === 3 ? 1 : 0), ox, oy);
              const sides = [[0, -1], [0, 1], [-1, 0], [1, 0]];
              sides.forEach(([a, b], i) => { const c = T(x + a, y + b); if (c && GRASSY.has(c)) fringe(gg, ox, oy, i, G.base, '#b48a50', y * 3 + x); });
              if (ch === 'X') gg.drawImage(SPR_BOULDER, ox, oy);
              break;
            }
            case 's': {
              gg.drawImage(sandTile(v & 1), ox, oy);
              [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([a, b], i) => { const c = T(x + a, y + b); if (c && (GRASSY.has(c) || c === ':')) fringe(gg, ox, oy, i, c === ':' ? '#d8b070' : G.base, null, x * 7 + y); });
              break;
            }
            case 'T': gg.drawImage(treeTile(G, nb4((c, a, b) => c === 'T' || (c === null && (x + a < 0 || x + a >= COLS ? true : false)))), ox, oy); break;
            case 'b': ground(); gg.drawImage(SPR_BUSH, ox, oy); break;
            case 'r': ground(); gg.drawImage(SPR_ROCK, ox, oy); break;
            case 'C': case 'K': case 'D': gg.drawImage(cliffTile(nb4(c => c === 'C' || c === 'K' || c === 'D' || c === '@' || c === null), G, v, x, y), ox, oy); if (ch !== 'C') { R(gg, ox, oy, 16, 16, '#7a7088'); R(gg, ox, oy, 16, 1, '#9a90a8'); } break;
            case '@': gg.drawImage(caveMouth(G), ox, oy); break;
            case '~': {
              gg.drawImage(waterBase(f), ox, oy);
              const land = c => c && c !== '~' && c !== '=';
              const lc = c => c === 's' ? ['#f0d898', '#c8a868'] : c === 'C' ? ['#7a4a24', '#4a2a10'] : [G.base, G.deep];
              const tc_ = T(x, y - 1), bc = T(x, y + 1), lc_ = T(x - 1, y), rc = T(x + 1, y);
              const fo = (f + x + y) % 4;
              if (land(tc_)) { const [a, b] = lc(tc_); R(gg, ox, oy, 16, 3, a); R(gg, ox, oy + 3, 16, 1, b); R(gg, ox, oy + 4, 16, 2, 'rgba(10,30,90,.35)'); R(gg, ox + fo * 3, oy + 6, 4, 1, '#d8ecff'); }
              if (land(bc)) { const [a, b] = lc(bc); R(gg, ox, oy + 14, 16, 2, a); R(gg, ox, oy + 13, 16, 1, '#d8ecff'); R(gg, ox + 12 - fo * 3, oy + 12, 3, 1, '#a8d0ff'); }
              if (land(lc_)) { const [a, b] = lc(lc_); R(gg, ox, oy, 2, 16, a); R(gg, ox + 2, oy, 1, 16, b); R(gg, ox + 3, oy + fo * 3, 1, 4, '#d8ecff'); }
              if (land(rc)) { const [a, b] = lc(rc); R(gg, ox + 14, oy, 2, 16, a); R(gg, ox + 13, oy, 1, 16, '#d8ecff'); }
              break;
            }
            case '=': gg.drawImage(bridgeTile(f), ox, oy); break;
            case 'F': ground(); gg.drawImage(fenceTile(G, nb4(c => c === 'F')), ox, oy); break;
            case 'S': ground(); gg.drawImage(SPR_SIGN, ox, oy); break;
            case 'g': case 'G': ground(); gg.drawImage(SPR_GRAVE, ox, oy); if (ch === 'G') { P(gg, ox + 4, oy + 12, '#5a8a5a'); P(gg, ox + 11, oy + 11, '#5a8a5a'); } break;
            case 'O': gg.drawImage(wellTile(G), ox, oy); break;
            case '^': gg.drawImage(stairsTile(), ox, oy); break;
            default: ground();
          }
        } else if (k === 'in' || k === 'cv') {
          const floor = () => gg.drawImage(k === 'in' ? woodFloor(v & 1) : caveFloor(v & 1), ox, oy);
          switch (ch) {
            case '#': break;
            case 'k': R(gg, ox, oy, 16, 16, '#6a3a18'); R(gg, ox, oy, 16, 9, '#b07038'); R(gg, ox, oy, 16, 1, '#e0a868'); R(gg, ox, oy + 9, 16, 1, '#4a2810'); R(gg, ox + ((x & 1) ? 15 : 0), oy + 10, 1, 6, '#4a2810'); break;
            case 'p': floor(); gg.drawImage(SPR_POT, ox, oy); break;
            case 'c': case 'e': floor(); gg.drawImage(chestImg(0, ch === 'e'), ox, oy); break;
            case 'w': case 'q': {
              R(gg, ox, oy, 16, 16, '#3a2c28');
              const up = T(x, y - 1), dn = T(x, y + 1);
              R(gg, ox, oy, 16, 12, '#5a4a42'); R(gg, ox + 2, oy + 2, 5, 3, '#6e5c52'); R(gg, ox + 9, oy + 6, 5, 3, '#6e5c52'); R(gg, ox, oy + 12, 16, 4, '#2a1e1a');
              if (up !== 'w' && up !== 'q' && up !== '#') R(gg, ox, oy, 16, 2, '#8a766a');
              if (dn !== 'w' && dn !== 'q' && dn !== '#') { R(gg, ox, oy + 12, 16, 4, '#2a1e1a'); R(gg, ox, oy + 15, 16, 1, '#140c0a'); }
              if (ch === 'q') { gg.fillStyle = '#140c0a'; [[7, 2], [8, 3], [8, 4], [7, 5], [6, 6], [9, 6], [10, 7], [5, 7], [4, 8], [8, 8], [8, 9], [11, 8]].forEach(([a, b]) => gg.fillRect(ox + a, oy + b, 1, 1)); }
              break;
            }
            default: floor();
          }
        } else { // the dungeon
          if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) { R(gg, ox, oy, 16, 16, '#22263a'); return; }
          const hv = hash(x, y, 9), floor = () => gg.drawImage(dgFloor(hv < 0.1 ? 1 : hv < 0.2 ? 2 : 0), ox, oy);
          switch (ch) {
            case '#': gg.drawImage(dgBlock('#'), ox, oy); break;
            case 'B': case '%': floor(); if (ch === 'B') gg.drawImage(dgBlock('B'), ox, oy); break;
            case 'S': gg.drawImage(dgBlock('S'), ox, oy); break;
            case 't': gg.drawImage(torchTile(f), ox, oy); break;
            case 'p': floor(); gg.drawImage(SPR_POT, ox, oy); break;
            case 'c': case 'e': floor(); gg.drawImage(chestImg(0, ch === 'e'), ox, oy); break;
            case 'A': case 'a': floor(); gg.drawImage(chestImg(1, ch === 'a'), ox, oy); break;
            case 'v': {
              gg.drawImage(waterBase(f, true), ox, oy);
              const land = c => c && c !== 'v';
              if (land(T(x, y - 1))) { R(gg, ox, oy, 16, 2, '#565c78'); R(gg, ox, oy + 2, 16, 1, '#2a2e44'); R(gg, ox, oy + 3, 16, 2, 'rgba(60,0,0,.4)'); }
              if (land(T(x, y + 1))) { R(gg, ox, oy + 14, 16, 2, '#7a82a8'); R(gg, ox, oy + 13, 16, 1, '#ff9a6a'); }
              if (land(T(x - 1, y))) { R(gg, ox, oy, 2, 16, '#6a7294'); R(gg, ox + 2, oy, 1, 16, '#2a2e44'); }
              if (land(T(x + 1, y))) { R(gg, ox + 14, oy, 2, 16, '#4a5070'); }
              break;
            }
            case '1': gg.drawImage(colourBlock('o', 1), ox, oy); break;
            case '2': gg.drawImage(colourBlock('o', 0), ox, oy); break;
            case '3': gg.drawImage(colourBlock('u', 1), ox, oy); break;
            case '4': gg.drawImage(colourBlock('u', 0), ox, oy); break;
            case 'Q': gg.drawImage(crystalTile(S.f.cry ? 1 : 0), ox, oy); break;
            case '_': gg.drawImage(switchTile(0), ox, oy); break;
            case '-': gg.drawImage(switchTile(1), ox, oy); break;
            case 'Z': gg.drawImage(gateTile(1), ox, oy); break;
            case 'z': gg.drawImage(gateTile(0), ox, oy); break;
            default: floor();
          }
        }
      }
      function overlays(gg, rm) {
        const d = rm.def;
        if (rm.kind === 'ow') {
          for (const [hx, hy, w, h, st] of (d.houses || [])) {
            let door = 0; for (let i = 0; i < w; i++) if (rm.t[hy + h - 1][hx + i] === 'd') door = i;
            gg.fillStyle = 'rgba(0,30,0,.32)'; gg.fillRect(hx * 16 + w * 16, hy * 16 + 10, 5, h * 16 - 8); gg.fillRect(hx * 16 + 6, hy * 16 + h * 16, w * 16 - 1, 4);
            gg.drawImage(houseArt(w, h, st, door, F), hx * 16, hy * 16);
          }
          if (rm.id === 'cliff') gg.drawImage(keepArt(F), 80, 0);
          if (rm.id === 'forest') { // the fairy pond: a ring of mossy stones and lily pads
            for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, x = 64 + Math.cos(a) * 19, y = 144 + Math.sin(a) * 19; E(gg, x + 1, y + 1, 4, 3, '#3a3a48'); E(gg, x, y, 4, 3, i % 3 ? '#8a8aa0' : '#6a8a5a'); P(gg, Math.round(x - 1), Math.round(y - 1), '#c8c8d8'); }
            for (const [x, y] of [[58, 138], [70, 150]]) { E(gg, x, y, 3, 2, '#3a9a3a'); P(gg, x, y - 1, '#f8a0c8'); }
          }
        } else if (rm.kind === 'in' || rm.kind === 'cv') {
          gg.drawImage(inFrame(rm.kind), 0, 0);
          for (const [kind, x, y] of (d.decor || [])) if (kind === 'rug') gg.drawImage(decorArt(kind, F), x * 16, y * 16);
          for (const e of (d.ents || [])) if (e[0] === 'ware') gg.drawImage(decorArt('stand', F), e[1] * 16, e[2] * 16);
          for (const [kind, x, y] of (d.decor || [])) if (kind !== 'rug') { const im = decorArt(kind, F); gg.drawImage(im, x * 16, kind === 'window' ? 6 : kind === 'shopsign' ? 6 : kind === 'clock' ? 2 : y * 16 + (16 - im.height % 16) % 16); }
        } else gg.drawImage(dgFrame(rm.doors), 0, 0);
      }

      // ============================================================ things in a room
      const rnd = K.rnd((Date.now() & 0xffff) + 7);
      const EN = {
        gloop: { hp: 1, w: 6, h: 9, dmg: 1 }, gloopP: { hp: 2, w: 6, h: 9, dmg: 1 }, snap: { hp: 2, w: 6, h: 10, dmg: 1 },
        knight: { hp: 3, w: 6, h: 16, dmg: 2 }, bat: { hp: 1, w: 5, h: 8, dmg: 1, fly: 1 }, ghost: { hp: 2, w: 6, h: 13, dmg: 1, fly: 1 },
        crab: { hp: 2, w: 7, h: 9, dmg: 1 }, spike: { hp: 99, w: 7, h: 13, dmg: 2, tough: 1 }, ball: { hp: 1, w: 5, h: 10, dmg: 1 },
        cheese: { hp: 8, w: 13, h: 22, dmg: 2, boss: 1 }, baron: { hp: 12, w: 17, h: 30, dmg: 1, boss: 1 },
      };
      let shake = 0, flashT = 0, banner = null, toast = null;
      function mkEnt(type, x, y, o) { // x, y: the feet, in pixels
        const d = EN[type] || {};
        return Object.assign({ type, x, y, z: 0, vz: 0, vx: 0, vy: 0, dir: 0, st: 0, tm: 30 + (rnd() * 60 | 0), hp: d.hp || 1, w: d.w || 6, h: d.h || 10, dmg: d.dmg || 1,
          enemy: !!EN[type], inv: 0, kbx: 0, kby: 0, kbt: 0, stun: 0, flash: 0, anim: 0, hx: x, hy: y }, o || {});
      }
      function spawnEnts(rm) {
        ents = []; shots = []; fx = [];
        const d = rm.def, quiet = d.trap && S.cleared[rm.id];
        for (const [type, tx, ty, a, b] of (d.ents || [])) {
          const x = tx * 16 + 8, y = ty * 16 + 12;
          if (EN[type]) {
            if (quiet) continue;
            if (type === 'cheese' && S.f.cheese) continue; if (type === 'baron' && S.f.baron) continue;
            const e = mkEnt(type, x, y); e.dir = rnd() * 4 | 0;
            if (type === 'cheese') { e.st = 'wait'; e.tm = 50; } if (type === 'baron') { e.st = 'wait'; e.tm = 9999; e.x = 128; e.y = 104; }
            ents.push(e);
          } else if (type === 'npc') ents.push(mkEnt('npc', x, y, { name: a, dir: 0, enemy: false, sit: b, w: 6, h: 12, home: [x, y] }));
          else if (type === 'hen') ents.push(mkEnt('hen', x, y, { enemy: false, w: 5, h: 8 }));
          else if (type === 'ware') ents.push(mkEnt('ware', x, y, { item: a, enemy: false }));
          else if (type === 'piece') { if (!S.got['piece_' + a]) ents.push(mkEnt('pick', x, y, { kind: 'piece', id: a, perm: 1, enemy: false })); }
          else if (type === 'gem') { const id = 'gem_' + rm.id + tx + '_' + ty; if (!S.got[id]) ents.push(mkEnt('pick', x, y, { kind: 'gem' + a, id, perm: 1, enemy: false })); }
        }
        // a fallen heart container or the recipe that was never picked up
        if (rm.id === 'd6' && S.f.cheese && !S.got.hc_cheese) ents.push(mkEnt('pick', 128, 100, { kind: 'container', id: 'hc_cheese', perm: 1, enemy: false }));
        if (rm.id === 'd11' && S.f.baron && !S.got.hc_baron) ents.push(mkEnt('pick', 104, 108, { kind: 'container', id: 'hc_baron', perm: 1, enemy: false }));
        if (rm.id === 'd11' && S.f.baron && !S.f.recipe) ents.push(mkEnt('pick', 152, 108, { kind: 'recipe', id: 'recipe', perm: 1, enemy: false }));
      }
      const enemiesLeft = () => ents.some(e => e.enemy && !e.dying && e.type !== 'spike');
      const box = e => [e.x - e.w, e.y - e.h, e.x + e.w, e.y];
      const hitBox = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
      // can something with feet at (x, y) and half-width w stand there?
      function solidPt(px, py, flying) {
        const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
        if (!inRoom(tx, ty)) return !(room.kind === 'ow' || room.kind === 'dg');
        const c = room.t[ty][tx];
        if (flying) return c === '#' || (room.kind === 'dg' && (tx === 0 || ty === 0 || tx === 15 || ty === 11) && !WALKDOOR.has(c));
        return SOLID.has(c);
      }
      function entFree(e, x, y) {
        const w = (EN[e.type] || {}).boss ? e.w - 2 : Math.min(e.w, 7);
        if (x - w < 16 && room.kind !== 'ow') return false; if (x + w > RW - 16 && room.kind !== 'ow') return false;
        if (x - w < 2 || x + w > RW - 2 || y - 6 < 2 || y > RH - 2) return false;
        if (room.kind !== 'ow' && (y - 6 < 16 || y > RH - 16)) return false;
        const fl = !!(EN[e.type] || {}).fly;
        if (solidPt(x - w, y - 6, fl) || solidPt(x + w, y - 6, fl) || solidPt(x - w, y - 1, fl) || solidPt(x + w, y - 1, fl) || solidPt(x, y - 6, fl) || solidPt(x, y - 1, fl)) return false;
        return true;
      }
      function moveEnt(e, dx, dy) {
        let ok = true;
        if (dx) { if (entFree(e, e.x + dx, e.y)) e.x += dx; else ok = false; }
        if (dy) { if (entFree(e, e.x, e.y + dy)) e.y += dy; else ok = false; }
        return ok;
      }
      // ---- effects
      function puff(x, y, big) { fx.push({ k: 'puff', x, y, t: 0, n: 20 }); if (big) for (let i = 0; i < 4; i++) fx.push({ k: 'puff', x: x + (rnd() - 0.5) * 24, y: y + (rnd() - 0.5) * 18, t: -i * 4, n: 20 }); }
      function sparks(x, y, n, col) { for (let i = 0; i < n; i++) { const a = rnd() * 6.28, s = 0.6 + rnd() * 1.8; fx.push({ k: 'bit', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, t: 0, n: 22 + rnd() * 12, col: col || '#fff8a0' }); } }
      function debris(x, y, kind) {
        const cols = kind === 'bush' ? ['#4ea83a', '#2e7a26', '#78c850'] : kind === 'pot' ? ['#a85a30', '#d0804a', '#7a3a1a'] : kind === 'grass' ? ['#3e9a34', '#68c048', '#2c6a28'] : ['#9a9aa8', '#6a6a7a', '#d0d0dc'];
        for (let i = 0; i < 8; i++) { const a = rnd() * 6.28, s = 0.5 + rnd() * 1.5; fx.push({ k: 'chip', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, z: 6 + rnd() * 6, vz: 1 + rnd() * 1.5, t: 0, n: 40, col: cols[i % 3] }); }
      }
      function text(x, y, s, col) { fx.push({ k: 'txt', x, y, s, col, t: 0, n: 50 }); }
      // ---- things to pick up
      function drop(x, y, kind, o) { const p = mkEnt('pick', x, y, Object.assign({ kind, enemy: false, z: 6, vz: 1.6, life: 600 }, o || {})); ents.push(p); return p; }
      function loot(x, y, tbl) {
        const r = rnd();
        if (tbl === 'none') return;
        const hurt = S.hp < S.maxH * 2;
        if (r < 0.32) drop(x, y, 'gem1'); else if (r < 0.42) drop(x, y, 'gem5'); else if (r < 0.43) drop(x, y, 'gem20');
        else if (r < (hurt ? 0.62 : 0.5)) drop(x, y, 'heart'); else if (r < 0.58 && S.bag && S.bombs < 10) drop(x, y, 'bombs');
      }
      function bonk(e, how) { // a baddie is beaten: it pops in a puff of smoke (and maybe leaves something)
        e.dying = 1; e.dead = true;
        puff(e.x, e.y - 6, e.type === 'knight'); SND.poof();
        addScore(e.type === 'ball' ? 5 : 10);
        if (e.type !== 'ball' || rnd() < 0.3) loot(e.x, e.y - 2);
        if (room.def.trap && !enemiesLeft()) roomCleared();
      }
      function hurtEnt(e, dmg, sx, sy, how) {
        if (e.dead || e.inv > 0) return false;
        if (e.type === 'hen') { e.st = 1; e.tm = 60; const a = Math.atan2(e.y - sy, e.x - sx); e.vx = Math.cos(a) * 2.4; e.vy = Math.sin(a) * 2.4; e.inv = 20; SND.cluck(); sparks(e.x, e.y - 8, 3, '#ffffff'); S.f.hens = (S.f.hens | 0) + 1; return true; }
        if (!e.enemy) return false;
        const d = EN[e.type] || {};
        if (d.tough || e.ghostFade) { if (how !== 'bomb') { SND.tink(); sparks((e.x + sx) / 2, (e.y + sy) / 2 - 8, 3); } return false; }
        if (d.boss) return bossHit(e, dmg, how);
        if (how === 'boom' && e.type !== 'bat' && e.type !== 'gloop' && e.type !== 'ball') { e.stun = 150; e.inv = 10; SND.hit(); return true; }
        e.hp -= dmg; e.inv = 22; e.flash = 22; e.stun = 0;
        const a = Math.atan2(e.y - sy, e.x - sx); e.kbx = Math.cos(a) * 2.6; e.kby = Math.sin(a) * 2.6; e.kbt = 10;
        SND.hit(); fx.push({ k: 'hit', x: (e.x + sx) / 2, y: (e.y + sy) / 2 - 8, t: 0, n: 6 });
        if (e.hp <= 0) bonk(e, how);
        return true;
      }
      function shoot(x, y, vx, vy, spr, o) { shots.push(Object.assign({ x, y, vx, vy, spr, dmg: 1, life: 200, refl: true, z: 6 }, o || {})); }

      // ---- the baddies' brains
      function updateEnemy(e) {
        if (e.inv > 0) e.inv--; if (e.flash > 0) e.flash--;
        if (e.kbt > 0) { e.kbt--; moveEnt(e, e.kbx, 0); moveEnt(e, 0, e.kby); return; }
        if (e.stun > 0) { e.stun--; return; }
        const dx = pl.x - e.x, dy = pl.y - e.y, dist = Math.hypot(dx, dy);
        switch (e.type) {
          case 'gloop': case 'gloopP':
            if (e.st === 0) { if (--e.tm <= 0) { const a = Math.atan2(dy, dx) + (rnd() - 0.5) * 1.4, sp = e.type === 'gloopP' ? 1.1 : 0.9; e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; e.vz = 2.2; e.st = 1; } }
            else { e.z += e.vz; e.vz -= 0.16; moveEnt(e, e.vx, e.vy); if (e.z <= 0) { e.z = 0; e.st = 0; e.tm = 25 + rnd() * 45; } }
            e.anim = e.st ? 1 : (K.frame >> 4) & 1; break;
          case 'snap':
            if (e.st === 0) {
              if (!moveEnt(e, DX[e.dir] * 0.6, DY[e.dir] * 0.6)) { e.dir = rnd() * 4 | 0; }
              if (--e.tm <= 0) { e.st = 1; e.tm = 44; if (dist < 110) e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); }
              e.anim = (K.frame >> 3) & 1;
            } else {
              if (--e.tm === 20) { shoot(e.x + DX[e.dir] * 8, e.y - 6 + DY[e.dir] * 6, DX[e.dir] * 2.2, DY[e.dir] * 2.2, 'pea'); sfx.tone(300, 0.06, 'square', 0.04, 0, 600); }
              if (e.tm <= 0) { e.st = 0; e.tm = 50 + rnd() * 70; if (rnd() < 0.5) e.dir = rnd() * 4 | 0; }
              e.anim = 0;
            }
            break;
          case 'knight': case 'ball': {
            const chase = e.type === 'ball' || (dist < 84 && !pl.dead);
            if (chase) {
              e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
              const sp = e.type === 'ball' ? 0.9 : 0.72;
              moveEnt(e, Math.abs(dx) > 2 ? Math.sign(dx) * sp : 0, Math.abs(dy) > 2 ? Math.sign(dy) * sp : 0);
            } else {
              if (!moveEnt(e, DX[e.dir] * 0.5, DY[e.dir] * 0.5) || --e.tm <= 0) { e.dir = rnd() * 4 | 0; e.tm = 60 + rnd() * 80; }
            }
            e.anim = (K.frame >> (chase ? 3 : 4)) & 1;
            if (e.type === 'ball') e.z = Math.abs(Math.sin(K.frame * 0.25)) * 2;
            break;
          }
          case 'bat':
            if (e.st === 0) { e.z = 2; if (--e.tm <= 0 || dist < 56) { e.st = 1; e.tm = 120 + rnd() * 120; } }
            else {
              e.z = 8;
              if (K.frame % 22 === 0 || (!e.vx && !e.vy)) { const a = Math.atan2(dy, dx) + (rnd() - 0.5) * 2.6; e.vx = Math.cos(a) * 1.3; e.vy = Math.sin(a) * 1.3; }
              e.x = clamp(e.x + e.vx, 22, RW - 22); e.y = clamp(e.y + e.vy, 30, RH - 18);
              if (--e.tm <= 0) { e.st = 0; e.tm = 50 + rnd() * 60; e.vx = e.vy = 0; }
            }
            e.anim = e.st ? (K.frame >> 2) & 1 : 0; break;
          case 'ghost': {
            e.tm++; e.ghostFade = (e.tm % 260) > 180;
            const sp = 0.42;
            e.x = clamp(e.x + Math.sign(dx) * sp + Math.cos(e.tm * 0.05) * 0.4, 20, RW - 20); e.y = clamp(e.y + Math.sign(dy) * sp * 0.8 + Math.sin(e.tm * 0.07) * 0.3, 30, RH - 10);
            e.z = 6 + Math.sin(e.tm * 0.08) * 3; e.anim = (e.tm >> 4) & 1; break;
          }
          case 'crab':
            if (e.st === 0) { if (!e.vx) e.vx = rnd() < 0.5 ? -1.3 : 1.3; if (!moveEnt(e, e.vx, 0)) e.vx = -e.vx; if (--e.tm <= 0) { e.st = 1; e.tm = 30; } e.anim = (K.frame >> 2) & 1; }
            else { if (--e.tm <= 0) { e.st = 0; e.tm = 40 + rnd() * 80; if (rnd() < 0.5) e.vx = -e.vx; } e.anim = (K.frame >> 4) & 1; }
            break;
          case 'spike':
            if (e.st === 0) {
              if (e.tm > 0) { e.tm--; break; }
              const ax = Math.abs(dx) < 10, ay = Math.abs(dy + 4) < 10;
              if ((ax || ay) && dist < 200) { e.st = 1; e.vx = ay ? Math.sign(dx) * 3.2 : 0; e.vy = ax && !ay ? Math.sign(dy) * 3.2 : 0; e.run = 0; }
            } else if (e.st === 1) { e.run++; if (!moveEnt(e, e.vx, e.vy) || e.run > 60) { e.st = 2; sfx.tone(1800, 0.05, 'square', 0.03); } }
            else { const ddx = e.hx - e.x, ddy = e.hy - e.y; if (Math.abs(ddx) + Math.abs(ddy) < 1.2) { e.x = e.hx; e.y = e.hy; e.st = 0; e.tm = 40; } else { e.x += Math.sign(ddx) * Math.min(1, Math.abs(ddx)); e.y += Math.sign(ddy) * Math.min(1, Math.abs(ddy)); } }
            e.anim = (K.frame >> 2) & 1; break;
          case 'cheese': updateCheese(e, dx, dy); break;
          case 'baron': updateBaron(e, dx, dy); break;
        }
      }

      // ---- THE BIG CHEESE: rolls round the room (can't be hurt), then stops, spits crumbs and gets dizzy (bonk it then!)
      function updateCheese(e) {
        e.tm--;
        const fast = 1.7 + (8 - e.hp) * 0.12;
        switch (e.st) {
          case 'wait': if (e.tm <= 0) { e.st = 'roll'; e.tm = 200; const a = rnd() < 0.5 ? 0.8 : 2.3; e.vx = Math.cos(a) * fast; e.vy = Math.sin(a) * fast; SND.roar(); } e.anim = 0; break;
          case 'roll':
            if (!moveEnt(e, e.vx, 0)) { e.vx = -e.vx; shake = 3; SND.stomp(); }
            if (!moveEnt(e, 0, e.vy)) { e.vy = -e.vy; shake = 3; SND.stomp(); }
            e.anim = (K.frame >> 2) & 3;
            if (e.tm <= 0) { e.st = 'spit'; e.tm = 50; }
            break;
          case 'spit':
            e.anim = 0;
            if (e.tm === 25) { const n = e.hp <= 4 ? 10 : 8; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; shoot(e.x, e.y - 10, Math.cos(a) * 1.6, Math.sin(a) * 1.6, 'crumb', { dmg: 1 }); } SND.splat(); }
            if (e.tm <= 0) { e.st = 'dizzy'; e.tm = 130; }
            break;
          case 'dizzy': e.anim = 4; if (e.tm % 20 === 0) sfx.tone(600 + (e.tm % 40) * 10, 0.06, 'triangle', 0.03); if (e.tm <= 0) { e.st = 'roll'; e.tm = 220; const a = Math.atan2(pl.y - e.y, pl.x - e.x); e.vx = Math.cos(a) * fast; e.vy = Math.sin(a) * fast; } break;
          case 'die': dieAnim(e, () => {
            S.f.cheese = 1; addScore(1000); roomCleared(); drop(128, 100, 'container', { id: 'hc_cheese', perm: 1, vz: 2.4 }); SND.secret(); song('keep');
          }); break;
        }
      }
      function dieAnim(e, done) {
        e.anim = e.type === 'baron' ? 2 : 4; e.flash = 4;
        if (e.tm % 8 === 0) { puff(e.x + (rnd() - 0.5) * e.w * 2.4, e.y - rnd() * e.h * 1.2); SND.poof(); shake = 4; }
        if (e.tm <= 0) { e.dead = true; puff(e.x, e.y - e.h / 2, true); sparks(e.x, e.y - e.h / 2, 24, e.type === 'baron' ? '#ffffff' : '#f8d848'); shake = 10; done(); }
      }
      function bossHit(e, dmg, how) {
        const vuln = e.type === 'cheese' ? e.st === 'dizzy' : e.st === 'dizzy';
        if (e.st === 'die' || e.st === 'wait') return false;
        if (e.type === 'cheese' && how === 'boom' && e.st === 'roll') { e.st = 'dizzy'; e.tm = 110; SND.hit(); return true; }
        if (e.type === 'baron' && e.st === 'eye' && (how === 'boom' || how === 'sword' || how === 'spin')) { e.st = 'dizzy'; e.tm = e.phase2 ? 150 : 190; SND.hit(); SND.roar(); shake = 4; sparks(e.x, e.y - 32, 10, '#ff6a6a'); return true; }
        if (!vuln) { SND.tink(); sparks(pl.x + DX[pl.dir] * 10, pl.y - 10 + DY[pl.dir] * 8, 3); if (how === 'sword' || how === 'spin') knock(pl, e.x, e.y, 2.2, 8); return false; }
        if (e.inv > 0) return false;
        e.hp -= dmg; e.inv = 20; e.flash = 20; SND.hit(); fx.push({ k: 'hit', x: pl.x + DX[pl.dir] * 12, y: pl.y - 10 + DY[pl.dir] * 10, t: 0, n: 6 }); shake = 3;
        if (e.type === 'baron' && e.hp <= 6 && !e.phase2) { e.phase2 = true; text(e.x, e.y - 50, 'GRR!', '#ff8a6a'); }
        if (e.hp <= 0) { e.st = 'die'; e.tm = e.type === 'baron' ? 150 : 90; song(null); sfx.tone(200, 1.2, 'sawtooth', 0.08, 0, 40); }
        return true;
      }
      // ---- BARON MEATBALLO: hops about (watch his shadow), splats sauce, then opens his third eye: hit it to make him dizzy
      function updateBaron(e, dx, dy) {
        e.tm--;
        const P2 = e.phase2;
        switch (e.st) {
          case 'wait': e.anim = 0; break;
          case 'start': e.anim = 3; if (e.tm <= 0) { e.st = 'hop'; e.hops = P2 ? 4 : 3; e.tm = 0; } break;
          case 'hop':
            if (!e.jump) {
              if (e.tm > 0) { e.anim = 0; break; }
              const tx = clamp(pl.x + (rnd() - 0.5) * 90, 48, 208), ty = clamp(pl.y + (rnd() - 0.5) * 60, 72, 160);
              e.jump = { x0: e.x, y0: e.y, x1: tx, y1: ty, t: 0, n: P2 ? 40 : 52 }; sfx.tone(200, 0.3, 'square', 0.05, 0, 500);
            }
            { const J = e.jump; J.t++; const k = J.t / J.n; e.x = lerp(J.x0, J.x1, k); e.y = lerp(J.y0, J.y1, k); e.z = Math.sin(k * Math.PI) * (P2 ? 46 : 56); e.anim = 0;
              if (J.t >= J.n) {
                e.z = 0; e.jump = null; shake = 8; SND.stomp(); puff(e.x - 16, e.y); puff(e.x + 16, e.y);
                if (Math.abs(pl.x - e.x) < 22 && Math.abs(pl.y - e.y) < 14) hurtPlayer(2, e.x, e.y - 10);
                const n = P2 ? 6 : 4; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rnd(); shoot(e.x, e.y - 8, Math.cos(a) * 1.5, Math.sin(a) * 1.5, 'drop', { dmg: 1 }); }
                e.tm = P2 ? 14 : 24;
                if (--e.hops <= 0) { e.st = 'eye'; e.tm = P2 ? 120 : 160; e.spat = 0; }
              } }
            break;
          case 'eye':
            e.anim = 1;
            if ((e.tm === 100 || (P2 && e.tm === 60)) && ents.filter(o => o.type === 'ball' && !o.dead).length < 2) { for (const s of [-1, 1]) { const b = mkEnt('ball', clamp(e.x + s * 22, 28, RW - 28), clamp(e.y - 2, 36, RH - 24)); b.z = 6; ents.push(b); } SND.splat(); }
            if (e.tm <= 0) { e.st = 'start'; e.tm = 40; SND.roar(); }
            break;
          case 'dizzy': e.anim = 2; if (e.tm % 24 === 0) sfx.tone(500, 0.08, 'triangle', 0.03); if (e.tm <= 0) { e.st = 'start'; e.tm = 30; SND.roar(); } break;
          case 'die': dieAnim(e, () => {
            S.f.baron = 1; addScore(3000); roomCleared();
            drop(104, 108, 'container', { id: 'hc_baron', perm: 1, vz: 2.6 }); drop(152, 108, 'recipe', { id: 'recipe', perm: 1, vz: 2.6 });
            run(function* () { yield 40; SND.secret(); yield { text: 'BARON MEATBALLO popped into a shower of grated parmesan! The SECRET RECIPE fell out of his crown!' }; }());
          }); break;
        }
      }

      // ============================================================ YOU
      function newPlayer(x, y, dir) { return { x, y, dir, anim: 0, act: null, at: 0, charge: 0, carry: null, inv: 0, kbx: 0, kby: 0, kbt: 0, pushT: 0, moving: false, spinId: 0, dead: false, cut: false }; }
      function knock(p, sx, sy, sp, n) { const a = Math.atan2(p.y - sy, p.x - sx); p.kbx = Math.cos(a) * sp; p.kby = Math.sin(a) * sp; p.kbt = n; }
      function hurtPlayer(dmg, sx, sy) {
        if (pl.inv > 0 || pl.dead || co || mode !== 'play') return;
        S.hp = Math.max(0, S.hp - dmg); pl.inv = 70; knock(pl, sx, sy, 2.4, 10); SND.hurt(); shake = Math.max(shake, 4); flashT = 4;
        if (pl.act === 'sword' || pl.act === 'charge') pl.act = null;
        if (S.hp <= 0) faint();
      }
      // outdoors, walking off the edge of the screen is fine if the next screen has room for you there
      function solidAtP(px, py) {
        const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
        if (inRoom(tx, ty)) return SOLID.has(room.t[ty][tx]);
        if (room.kind === 'dg') return false;
        if (room.kind !== 'ow') return true;
        const nx = tx < 0 ? -1 : tx >= COLS ? 1 : 0, ny = ty < 0 ? -1 : ty >= ROWS ? 1 : 0;
        const id = OWG[(room.def.gx + nx) + ',' + (room.def.gy + ny)]; if (!id || (nx && ny)) return true;
        const c = ROOMS[id].map[(ty + ROWS) % ROWS][(tx + COLS) % COLS]; return SOLID.has(c);
      }
      function blockedByThing(x, y) {
        for (const e of ents) if ((e.type === 'npc' || e.type === 'ware' || e.type === 'block') && !e.dead) { if (Math.abs(e.x - x) < 5 + 6 && y - 7 < e.y && y > e.y - (e.type === 'block' ? 16 : 9)) return true; }
        return false;
      }
      const plFree = (x, y) => !solidAtP(x - 5, y - 7) && !solidAtP(x + 5, y - 7) && !solidAtP(x - 5, y - 1) && !solidAtP(x + 5, y - 1) && !solidAtP(x, y - 7) && !solidAtP(x, y - 1) && !blockedByThing(x, y);
      function plMove(dx, dy) { // slides round corners, like it should
        let moved = false;
        if (dx) {
          if (plFree(pl.x + dx, pl.y)) { pl.x += dx; moved = true; }
          else if (!dy) for (let k = 1; k <= 7; k++) { if (plFree(pl.x + dx, pl.y - k) && plFree(pl.x, pl.y - 1)) { pl.y -= 1; moved = true; break; } if (plFree(pl.x + dx, pl.y + k) && plFree(pl.x, pl.y + 1)) { pl.y += 1; moved = true; break; } }
        }
        if (dy) {
          if (plFree(pl.x, pl.y + dy)) { pl.y += dy; moved = true; }
          else if (!dx) for (let k = 1; k <= 7; k++) { if (plFree(pl.x - k, pl.y + dy) && plFree(pl.x - 1, pl.y)) { pl.x -= 1; moved = true; break; } if (plFree(pl.x + k, pl.y + dy) && plFree(pl.x + 1, pl.y)) { pl.x += 1; moved = true; break; } }
        }
        return moved;
      }
      function unstick() { // never leave you inside something solid (a block that reset, a raised crystal block)
        if (plFree(pl.x, pl.y)) return;
        let best = null;
        for (let r = 1; r < 12 && !best; r++) for (let y = 0; y < ROWS && !best; y++) for (let x = 0; x < COLS; x++) {
          const px = x * 16 + 8, py = y * 16 + 12; if (Math.abs(px - pl.x) > r * 16 || Math.abs(py - pl.y) > r * 16) continue;
          if (plFree(px, py) && px > 8 && px < RW - 8 && py > 16 && py < RH - 4) { best = [px, py]; break; }
        }
        if (best) { pl.x = best[0]; pl.y = best[1]; }
      }
      const frontPt = () => [pl.x + DX[pl.dir] * 11, pl.y - 4 + (pl.dir === 0 ? 9 : pl.dir === 1 ? -9 : 0)];
      const frontTile = () => { const [fx, fy] = frontPt(); return [Math.floor(fx / 16), Math.floor(fy / 16)]; };
      // the sword: which of the 8 blade pictures, and where your hand is
      const SWING = [[0, 1, 2], [4, 5, 6], [6, 5, 4], [6, 7, 0]];
      const HAND = [[0, -5], [2, -14], [-5, -9], [5, -9]];
      const VEC = [[1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7], [0, -1], [0.7, -0.7]];
      const FRONT = [2, 6, 4, 0];
      function swordIdx() {
        if (pl.act === 'sword') { const a = pl.at; return a < 2 ? -1 : SWING[pl.dir][a < 4 ? 0 : a < 6 ? 1 : 2]; }
        if (pl.act === 'charge') return FRONT[pl.dir];
        if (pl.act === 'spin') return (FRONT[pl.dir] + 2 + Math.floor(pl.at / 3)) % 8;
        return -1;
      }
      function swordPoints() { // the blade's reach (two circles)
        const i = swordIdx(); if (i < 0) return null;
        const h = HAND[pl.act === 'spin' ? 0 : pl.dir], hx = pl.x + h[0], hy = pl.y + h[1], v = VEC[i];
        return [[hx + v[0] * 7, hy + v[1] * 7], [hx + v[0] * 14, hy + v[1] * 14]];
      }
      function cutTile(tx, ty, quiet) {
        const c = tileAt(room, tx, ty); if (c !== 'b' && c !== '"') return false;
        room.t[ty][tx] = under(room, tx, ty); redrawTile(room, tx, ty);
        debris(tx * 16 + 8, ty * 16 + 10, c === 'b' ? 'bush' : 'grass'); if (!quiet) SND.cut();
        const r = rnd(); if (r < (c === 'b' ? 0.28 : 0.2)) drop(tx * 16 + 8, ty * 16 + 12, r < 0.07 ? 'heart' : r < 0.1 ? 'gem5' : 'gem1');
        return true;
      }
      function swordHits(spin) {
        const pts = swordPoints(); if (!pts) return;
        const rr = spin ? 26 : 7;
        // baddies (and hens)
        for (const e of ents) {
          if (e.dead || (!e.enemy && e.type !== 'hen')) continue;
          const b = box(e); let hit = false;
          if (spin) hit = Math.hypot(e.x - pl.x, (e.y - e.h / 2) - (pl.y - 8)) < rr + e.w;
          else for (const [px, py] of pts) if (px > b[0] - 6 && px < b[2] + 6 && py > b[1] - 6 - e.z && py < b[3] + 6 - e.z) hit = true;
          if (hit) { if (spin) { if (e.spinHit === pl.spinId) continue; e.spinHit = pl.spinId; } hurtEnt(e, spin ? 2 : (pl.act === 'charge' ? 1 : 1), pl.x, pl.y - 8, spin ? 'spin' : 'sword'); }
        }
        // grass, bushes and crystal switches
        if (spin) { for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { const tx = Math.floor(pl.x / 16) + x, ty = Math.floor((pl.y - 8) / 16) + y; if (Math.hypot(tx * 16 + 8 - pl.x, ty * 16 + 8 - (pl.y - 8)) < 28) cutTile(tx, ty, true); } }
        else for (const [px, py] of pts) { const tx = Math.floor(px / 16), ty = Math.floor(py / 16); cutTile(tx, ty); if (tileAt(room, tx, ty) === 'Q' && !pl.cut) { pl.cut = true; toggleCrystal(); } }
      }
      function toggleCrystal() {
        S.f.cry = S.f.cry ? 0 : 1; applyCrystal(room); render(room); SND.crystal(); flashT = 3;
        unstick();
        for (const e of ents) if (e.enemy && !entFree(e, e.x, e.y)) { bonk(e); }
      }

      // ---- lifting, throwing, chests, signs, doors
      function lift(tx, ty) {
        const c = room.t[ty][tx], kind = LIFT[c];
        room.t[ty][tx] = under(room, tx, ty); redrawTile(room, tx, ty);
        pl.carry = kind; pl.act = 'lift'; pl.at = 0; SND.lift();
        const r = rnd();
        if (kind === 'bush' && r < 0.25) drop(tx * 16 + 8, ty * 16 + 12, r < 0.08 ? 'heart' : 'gem1');
        if (kind === 'pot') { if (r < 0.25) drop(tx * 16 + 8, ty * 16 + 12, 'heart'); else if (r < 0.5) drop(tx * 16 + 8, ty * 16 + 12, 'gem1'); else if (r < 0.6) drop(tx * 16 + 8, ty * 16 + 12, 'gem5'); else if (r < 0.7 && S.bag) drop(tx * 16 + 8, ty * 16 + 12, 'bombs'); }
        if (kind === 'rock' && r < 0.15) drop(tx * 16 + 8, ty * 16 + 12, 'gem5');
      }
      function throwIt() {
        ents.push(mkEnt('thrown', pl.x, pl.y, { kind: pl.carry, z: 18, vz: 0.6, vx: DX[pl.dir] * 3, vy: DY[pl.dir] * 3, enemy: false }));
        pl.carry = null; pl.act = 'throw'; pl.at = 0; SND.throw();
      }
      function smash(e) {
        e.dead = true; debris(e.x, e.y - 4, e.kind === 'pot' ? 'pot' : e.kind === 'rock' ? 'rock' : 'bush'); if (e.kind === 'bush') SND.cut(); else SND.smash();
      }
      function readSign(tx, ty) {
        const c = room.t[ty][tx], k = room.id + ':' + tx + ',' + ty;
        run(function* () { yield { text: signText(room.id, tx, ty, c) }; }());
      }
      function openChest(tx, ty) {
        const k = tx + ',' + ty, what = (room.def.chests || {})[k]; if (!what) return;
        S.opened[room.id + ':' + k] = 1; room.t[ty][tx] = room.t[ty][tx] === 'A' ? 'a' : 'e'; redrawTile(room, tx, ty); SND.chest();
        run(getItem(what, tx * 16 + 8, ty * 16));
      }
      function doorSideAt(tx, ty) { for (const s in DOORCELLS) for (const [x, y] of DOORCELLS[s]) if (x === tx && y === ty) return s; return null; }
      function tryUnlock(tx, ty) {
        const c = tileAt(room, tx, ty), side = doorSideAt(tx, ty); if (!side) return false;
        if (c === 'L') {
          if (S.keys <= 0) { if (!pl.lockMsg) { pl.lockMsg = 1; run(function* () { yield { text: "It's locked. You need a SMALL KEY. They're usually in chests round here." }; }()); } return false; }
          S.keys--; S.doors[room.did[side]] = 1; setDoors(room); render(room); SND.unlock(); save(); return true;
        }
        if (c === 'Y') {
          if (!S.big) { if (!pl.lockMsg) { pl.lockMsg = 1; run(function* () { yield { text: 'A BIG door with a BIG lock. It needs the BIG KEY.' }; }()); } return false; }
          S.doors[room.did[side]] = 1; setDoors(room); render(room); SND.unlock(); SND.door(); save(); return true;
        }
        return false;
      }
      function talkTo(e) {
        if (e.type === 'npc') { if (!e.sit) e.dir = Math.abs(pl.x - e.x) > Math.abs(pl.y - e.y) ? (pl.x < e.x ? 2 : 3) : (pl.y < e.y ? 1 : 0); run(npcTalk(e)); }
        else if (e.type === 'ware') run(shopTalk(e));
      }
      function actionA() {
        if (pl.carry) { throwIt(); return; }
        const [fx, fy] = frontPt();
        let reach = [[fx, fy]]; const [tx, ty] = [Math.floor(fx / 16), Math.floor(fy / 16)];
        if (tileAt(room, tx, ty) === 'k') reach.push([fx + DX[pl.dir] * 16, fy + DY[pl.dir] * 16]);
        for (const [px, py] of reach) for (const e of ents) if ((e.type === 'npc' || e.type === 'ware') && Math.abs(e.x - px) < 11 && py > e.y - 18 && py < e.y + 6) { talkTo(e); return; }
        const c = tileAt(room, tx, ty);
        if (c === 'S' || ((c === 'g' || c === 'G') && pl.dir === 1)) { readSign(tx, ty); return; }
        if ((c === 'c' || c === 'A') && pl.dir === 1) { openChest(tx, ty); return; }
        if (c === 'L' || c === 'Y') { pl.lockMsg = 0; tryUnlock(tx, ty); return; }
        if (LIFT[c]) { lift(tx, ty); return; }
        const say = s => run(function* () { yield { text: s }; }());
        if (c === '~' && room.kind === 'ow') say("The water looks lovely, but you can't swim. Your Mom kept meaning to take you to lessons.");
        else if (c === 'O') say('You look down the well. A frog looks back up at you. Neither of you says anything.');
        else if (c === 'X') say('A big cracked boulder blocks the way. A BOMB would sort that out.');
        else if (c === 'q' || c === 'J') say('This bit of wall is cracked... it sounds hollow when you knock on it.');
        else if (c === 'v') say("Bubbling hot tomato sauce. Smells amazing. Do NOT go for a paddle.");
        else if ((c === 'c' || c === 'A') && pl.dir !== 1) say('Open chests from the front (stand below them, facing up).');
        else if (c === 'B' || c === 'G') say('Walk into it and keep pushing to shove it along.');
      }
      function tryPush(tx, ty) {
        const c = room.t[ty][tx], nx = tx + DX[pl.dir], ny = ty + DY[pl.dir], t2 = tileAt(room, nx, ny);
        if (!t2) return;
        const okInto = c === 'G' ? (t2 === '.' || t2 === '"') : (t2 === '.' || t2 === '_' || t2 === '2' || t2 === '4' || t2 === 'z');
        if (!okInto || ents.some(e => !e.dead && e.type !== 'pick' && Math.abs(e.x - (nx * 16 + 8)) < 12 && Math.abs(e.y - (ny * 16 + 12)) < 12)) return;
        if (c === 'G') { if (room.id !== 'grave' || pl.dir !== 1) return; S.f.grave = 1; addScore(100); }
        const wasSw = room.sw.some(([x, y]) => x === tx && y === ty);
        room.t[ty][tx] = c === 'G' ? '^' : wasSw ? '_' : '.'; redrawTile(room, tx, ty);
        const onto = t2; room.t[ny][nx] = '%';
        ents.push(mkEnt('block', tx * 16 + 8, ty * 16 + 16, { kind: c, tx: nx, ty: ny, t: 0, onto, enemy: false, sx: tx * 16 + 8, sy: ty * 16 + 16 }));
        SND.push(); pl.pushT = -10;
        if (c === 'G') run(function* () { yield 24; SND.secret(); yield { text: 'The gravestone slid out of the way... there are steps going down!' }; save(); }());
      }
      function blockLanded(e) {
        room.t[e.ty][e.tx] = e.kind; redrawTile(room, e.tx, e.ty); e.dead = true; sfx.noise(0.1, 0.06, 300);
        // the floor switches: cover them all to lower the gate
        if (room.sw.length && !S.f.gate && room.id === 'd9') {
          const all = room.sw.every(([x, y]) => room.t[y][x] === 'B');
          if (room.sw.some(([x, y]) => x === e.tx && y === e.ty)) SND.click();
          if (all) { S.f.gate = 1; room.t[3][7] = 'z'; redrawTile(room, 7, 3); SND.secret(); shake = 3; sparks(120, 56, 10); save(); }
        }
      }
      function useItem() {
        if (pl.carry || pl.act) return;
        if (!S.sel) { toast = { s: 'PICK AN ITEM ON THE START MENU', t: 0 }; return; }
        if (S.sel === 'boom') {
          if (ents.some(e => e.type === 'boomer' && !e.dead)) return;
          let vx = (K.held('right') ? 1 : 0) - (K.held('left') ? 1 : 0), vy = (K.held('down') ? 1 : 0) - (K.held('up') ? 1 : 0);
          if (!vx && !vy) { vx = DX[pl.dir]; vy = DY[pl.dir]; } const m = Math.hypot(vx, vy);
          ents.push(mkEnt('boomer', pl.x + vx / m * 6, pl.y - 9 + vy / m * 4, { vx: vx / m * 3.6, vy: vy / m * 3.6, t: 0, back: false, enemy: false }));
          pl.act = 'item'; pl.at = 0; SND.boomer();
        } else if (S.sel === 'bombs') {
          if (S.bombs <= 0) { toast = { s: 'NO BOMBS LEFT! MABEL SELLS THEM.', t: 0 }; return; }
          if (ents.filter(e => e.type === 'bomb' && !e.dead).length >= 2) return;
          const [fx, fy] = frontPt(); S.bombs--;
          ents.push(mkEnt('bomb', clamp(fx, 20, RW - 20), clamp(fy + 4, 28, RH - 14), { t: 0, enemy: false })); SND.bombSet();
        } else if (S.sel === 'soup') {
          if (S.bottle === 2) { S.bottle = 1; run(function* () { pl.act = 'get'; pl.getSpr = ITEMIMG.bottle[1]; SND.heal(); yield 30; S.hp = S.maxH * 2; yield { text: "Glug glug... MINESTRONE! Just like Nonna makes. Your hearts are all full again!" }; pl.act = null; pl.getSpr = null; }()); }
          else run(function* () { yield { text: "The bottle's empty. Mabel's shop can fill it up again." }; }());
        }
      }
      function explode(x, y) {
        fx.push({ k: 'bang', x, y, t: 0, n: 20 }); SND.boom(); shake = 9; flashT = 2;
        for (const e of ents) if (!e.dead && (e.enemy || e.type === 'hen') && Math.hypot(e.x - x, e.y - 6 - y) < 30 + e.w) hurtEnt(e, 3, x, y, 'bomb');
        if (Math.hypot(pl.x - x, pl.y - 6 - y) < 18) { const i = pl.inv; pl.inv = 0; hurtPlayer(1, x, y); if (S.hp > 0) pl.inv = Math.max(pl.inv, i); }
        for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
          const d = Math.hypot(tx * 16 + 8 - x, ty * 16 + 8 - y); if (d > 28) continue;
          const c = room.t[ty][tx];
          if (c === 'b') cutTile(tx, ty, true);
          else if (c === 'p') { room.t[ty][tx] = under(room, tx, ty); redrawTile(room, tx, ty); debris(tx * 16 + 8, ty * 16 + 8, 'pot'); }
          else if (c === 'X' || c === 'q') {
            room.t[ty][tx] = under(room, tx, ty); goneForGood(room, tx, ty); redrawTile(room, tx, ty); debris(tx * 16 + 8, ty * 16 + 8, 'rock');
            if (!S.f['blast_' + room.id]) { S.f['blast_' + room.id] = 1; addScore(100); setTimeout(() => SND.secret(), 350); }
          }
        }
        for (const side in DOORCELLS) if (room.doors[side] === 'J') { const [[ax, ay], [bx, by]] = DOORCELLS[side]; const cx = (ax + bx) * 8 + 8, cy = (ay + by) * 8 + 8; if (Math.hypot(cx - x, cy - y) < 36) { S.doors[room.did[side]] = 1; setDoors(room); render(room); addScore(100); setTimeout(() => SND.secret(), 350); debris(cx, cy, 'rock'); } }
        save();
      }

      // ---- getting things: hold it up high, a fanfare, a few words
      const ITEMTXT = {
        sword: () => `You got GRANDAD'S SWORD and SHIELD! Press ${LB('b')} to swing the sword. Hold ${LB('b')}, then let go, for a SPIN ATTACK! Face things that are thrown at you and the shield blocks them.`,
        gems50: () => 'You found 50 GEMS! Somebody\'s dinner money, probably.',
        key: () => 'You got a SMALL KEY! It opens one locked door in the Colander Keep.',
        map: () => `You got the DUNGEON MAP! Press ${LB('x')} any time to have a look at it.`,
        compass: () => 'You got the COMPASS! Now the map shows the treasure chests, and where the Baron is snoring.',
        boom: () => `You got the BREADSTICK BOOMERANG! It's stale, it's bent and it ALWAYS comes back. Pick it on the START menu and press ${LB('y')} to throw it. It stuns baddies, fetches things and hits switches!`,
        bigkey: () => 'You got the BIG KEY! It opens the Baron\'s big door. It\'s ever so heavy.',
        piece: () => S.pieces === 0 ? 'You found a PIECE OF HEART! That makes four... and four pieces make a whole new HEART!' : `You found a PIECE OF HEART! That's ${S.pieces} of 4. Find four to make a new heart!`,
        container: () => 'You got a HEART CONTAINER! You have one more heart, and you\'re all better!',
        bombs: () => `You got a BOMB BAG and 8 BOMBS! Pick them on the START menu, press ${LB('y')} to put one down... then STAND BACK!`,
        soup: () => `You got a BOTTLE OF MINESTRONE! Pick it on the START menu and press ${LB('y')} to slurp it when you're poorly. It fills every heart!`,
        refill: () => 'Mabel filled your bottle with hot MINESTRONE!',
        recipe: () => 'You got the SECRET RECIPE! It says: 1. Tomatoes. 2. Garlic. 3. A pinch of love. 4. NEVER let a meatball near it.',
      };
      const ITEMICON = { sword: () => ITEMIMG.swordIcon, gems50: () => ITEMIMG.gem20[1], key: () => ITEMIMG.key, map: () => ITEMIMG.map, compass: () => ITEMIMG.compass, boom: () => ITEMIMG.boom[0], bigkey: () => ITEMIMG.bigkey,
        piece: () => ITEMIMG.piece, container: () => ITEMIMG.container, bombs: () => ITEMIMG.bomb[0], soup: () => ITEMIMG.bottle[1], refill: () => ITEMIMG.bottle[1], recipe: () => ITEMIMG.recipe };
      function* getItem(what) {
        pl.act = 'get'; pl.getSpr = ITEMICON[what](); pl.carry = null;
        const big = what === 'boom' || what === 'bigkey' || what === 'sword' || what === 'container' || what === 'recipe';
        if (big) SND.big(); else if (what === 'key') SND.key(); else SND.item();
        switch (what) {
          case 'sword': S.sword = 1; S.shield = 1; addScore(100); break;
          case 'gems50': S.gems = Math.min(999, S.gems + 50); addScore(50); break;
          case 'key': S.keys++; addScore(100); break;
          case 'map': S.map = 1; addScore(100); break;
          case 'compass': S.comp = 1; addScore(100); break;
          case 'boom': S.boom = 1; S.sel = 'boom'; addScore(400); break;
          case 'bigkey': S.big = 1; addScore(300); break;
          case 'piece': S.pieces++; if (S.pieces >= 4) { S.pieces = 0; S.maxH = Math.min(10, S.maxH + 1); S.hp = S.maxH * 2; } addScore(250); K.secret('lk.zeldo.heart'); break;
          case 'container': S.maxH = Math.min(10, S.maxH + 1); S.hp = S.maxH * 2; addScore(500); break;
          case 'bombs': S.bag = 1; S.bombs = Math.min(10, S.bombs + 8); if (!S.sel) S.sel = 'bombs'; addScore(50); break;
          case 'soup': case 'refill': S.bottle = 2; if (!S.sel) S.sel = 'soup'; if (what === 'soup') addScore(50); break;
          case 'recipe': S.f.recipe = 1; break;
        }
        save();
        yield 46;
        yield { text: ITEMTXT[what]() };
        pl.act = null; pl.getSpr = null;
        if (what === 'recipe') { yield 20; startEnding(); return; }
        report();
      }

      // ---- the screens: scrolling from one to the next, stairs and doors fade
      let trans = null, lastName = '';
      function edge(side) {
        if (room.kind === 'dg' && side === 's' && room.doors.s === 'X') { const ex = room.def.exit; warp(ex[0], ex[1], ex[2], ex[3]); return; }
        const nb = nbRoom(room, side);
        if (!nb) { pl.x = clamp(pl.x, 6, RW - 6); pl.y = clamp(pl.y, 10, RH - 1); return; }
        const nr = makeRoom(nb); render(nr);
        const dx = side === 'e' ? 1 : side === 'w' ? -1 : 0, dy = side === 's' ? 1 : side === 'n' ? -1 : 0;
        const x1 = dx > 0 ? 7 : dx < 0 ? RW - 7 : pl.x, y1 = dy > 0 ? 12 : dy < 0 ? RH - 2 : pl.y;
        trans = { side, dx, dy, from: room, to: nr, t: 0, n: room.kind === 'ow' ? 44 : 36, x0: pl.x, y0: pl.y, x1, y1 };
        mode = 'scroll'; shots = []; fx = []; ents = ents.filter(e => e.type === 'never');
      }
      function warp(id, tx, ty, dir) { trans = { warp: [id, tx, ty, dir], t: 0, n: 16, phase: 0 }; mode = 'fade'; if (room.kind !== 'ow' || id[0] !== 'h') SND.stairs(); else SND.door(); }
      function enterRoom(rm, x, y, dir) {
        room = rm; if (!room.fr) render(room);
        pl.x = x; pl.y = y; if (dir != null) pl.dir = dir;
        pl.act = pl.carry ? null : null; pl.carry = null; pl.kbt = 0; pl.pushT = 0;
        spawnEnts(room); unstick(); onEnter();
      }
      function onEnter() {
        const id = room.id;
        if (!S.seen[id]) { S.seen[id] = 1; addScore(20); }
        if (room.name !== lastName) { banner = { s: room.name, t: 0 }; lastName = room.name; }
        song(room.def.song || 'field');
        if (room.def.trap && !S.cleared[id] && enemiesLeft()) room.trapPending = true;
        if (id === 'd10' && room.did.s && !S.doors[room.did.s]) { S.doors[room.did.s] = 1; setDoors(room); render(room); setTimeout(() => SND.door(), 200); }
        if (id === 'd1' && !S.f.keepIn) { S.f.keepIn = 1; run(function* () { yield 20; yield { text: 'THE COLANDER KEEP. It smells of garlic, old socks and danger. Somewhere in here, Baron Meatballo is hiding the recipe.' }; }()); }
        if (id === 'd11' && !S.f.baron) run(bossIntro());
        save(); report();
      }
      function* bossIntro() {
        song(null); yield 50;
        const b = ents.find(e => e.type === 'baron'); if (b) { b.anim = 3; SND.roar(); shake = 6; }
        yield { text: `BARON MEATBALLO: MAMMA MIA! Who dares wake me from my nap?! You want the recipe back? Ha! With it I shall make... THE BIGGEST SPAGHETTI IN THE WORLD!` };
        yield { text: 'BARON MEATBALLO: Come on then, little noodle. Nobody can hurt me... unless they hit my THIRD EYE. Oops. Forget I said that.' };
        song('boss'); if (b) { b.st = 'start'; b.tm = 40; }
      }
      function roomCleared() {
        if (!room.def.trap) return;
        S.cleared[room.id] = 1; room.trapOn = false; room.trapPending = false; setDoors(room); render(room); SND.door();
        for (const k in (room.def.hidden || {})) { const [x, y] = k.split(',').map(Number); if (room.t[y][x] === '.') { room.t[y][x] = 'c'; redrawTile(room, x, y); puff(x * 16 + 8, y * 16 + 10); setTimeout(() => SND.secret(), 300); } }
        save();
      }
      function faint() { pl.dead = true; pl.carry = null; S.deaths++; song(null); SND.die(); mode = 'dying'; dyingT = 0; }
      let dyingT = 0;
      function respawn() {
        S.hp = S.maxH * 2; pl = newPlayer(0, 0, 1);
        if (room.kind === 'dg') enterRoom(makeRoom('d1'), 128, 172, 1);
        else enterRoom(makeRoom('h_home'), 104, 136, 0);
        mode = 'play'; fade = 1;
      }
      let fade = 0;

      // ============================================================ scripts (generators: yield a number to wait, { text, ask } for a text box)
      let co = null, coWait = 0, tb = null; const coQ = [];
      function run(gen) { if (co) { coQ.push(gen); return; } co = gen; coWait = 0; coNext(); }
      function coNext(v) {
        for (;;) {
          if (!co) { if (coQ.length) { co = coQ.shift(); v = undefined; continue; } return; }
          let r; try { r = co.next(v); } catch (e) { console.error(e); co = null; tb = null; continue; }
          if (r.done) { co = null; continue; }
          const t = r.value;
          if (typeof t === 'number') { coWait = t; return; }
          if (t && t.text) { openBox(t); return; }
          v = undefined;
        }
      }
      function openBox(o) {
        const lines = wrap(String(o.text).toUpperCase(), 36), pages = [];
        for (let i = 0; i < lines.length; i += 3) pages.push(lines.slice(i, i + 3));
        tb = { pages, p: 0, n: 0, ask: o.ask || null, sel: 0, top: !!(pl && pl.y > 118 && mode === 'play') };
      }
      function updateBox() {
        const page = tb.pages[tb.p], total = page.join('').length;
        if (tb.n < total) {
          const was = tb.n | 0; tb.n += K.held('a') || K.held('b') ? 2.5 : 1;
          if ((tb.n | 0) !== was && (tb.n | 0) % 2 === 0) SND.blip();
          if ((K.pressed('a') || K.pressed('b')) && tb.n > 4) tb.n = total;
          return;
        }
        const last = tb.p === tb.pages.length - 1;
        if (last && tb.ask) { if (K.pressed('left') || K.pressed('right') || K.pressed('up') || K.pressed('down')) { tb.sel = 1 - tb.sel; SND.menu(); } }
        if (K.pressed('a') || (K.pressed('b') && !(last && tb.ask))) {
          if (!last) { tb.p++; tb.n = 0; SND.menu(); return; }
          const sel = tb.sel; tb = null; SND.menu(); coNext(sel);
        }
      }
      function drawBox() {
        if (!tb) return;
        const y = tb.top ? TOP + 6 : H - 62, x = 8, w = 240, h = 56;
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 3, y + 3, w, h);
        g.fillStyle = '#f8f8f8'; g.fillRect(x, y, w, h); g.fillStyle = '#2a3a8a'; g.fillRect(x + 2, y + 2, w - 4, h - 4);
        const gr = g.createLinearGradient(0, y + 3, 0, y + h - 3); gr.addColorStop(0, '#182058'); gr.addColorStop(1, '#0a0e2c'); g.fillStyle = gr; g.fillRect(x + 3, y + 3, w - 6, h - 6);
        g.fillStyle = '#c8a040'; [[x + 1, y + 1], [x + w - 3, y + 1], [x + 1, y + h - 3], [x + w - 3, y + h - 3]].forEach(([a, b]) => g.fillRect(a, b, 2, 2));
        const page = tb.pages[tb.p]; let left = tb.n | 0;
        page.forEach((ln, i) => {
          const s = ln.slice(0, Math.max(0, left)); left -= ln.length;
          const ci = s.indexOf(':'), named = ci > 1 && ci < 18 && /^[A-Z .']+$/.test(s.slice(0, ci)) && i === 0 && tb.p === 0;
          if (named) { F.draw(g, s.slice(0, ci + 1), x + 10, y + 9 + i * 14, '#f8d048', 1, '#000'); F.draw(g, s.slice(ci + 1), x + 10 + (ci + 1) * 6, y + 9 + i * 14, '#ffffff', 1, '#000'); }
          else F.draw(g, s, x + 10, y + 9 + i * 14, '#ffffff', 1, '#000');
        });
        const done = (tb.n | 0) >= page.join('').length, last = tb.p === tb.pages.length - 1;
        if (done && last && tb.ask) {
          tb.ask.forEach((o, i) => { const ox = x + 150 + i * 44; F.draw(g, o, ox, y + h - 14, i === tb.sel ? '#f8d048' : '#8890c0', 1, '#000'); if (i === tb.sel) F.draw(g, '→', ox - 9, y + h - 14, '#f8d048', 1, '#000'); });
        } else if (done && (K.frame >> 4) & 1) { g.fillStyle = '#f8d048'; g.beginPath(); g.moveTo(x + w - 16, y + h - 12); g.lineTo(x + w - 8, y + h - 12); g.lineTo(x + w - 12, y + h - 7); g.fill(); }
      }
      const say = s => ({ text: s });

      // ============================================================ what people say
      const NN = () => S.name.trim() || 'JACK';
      const cycle = (e, list) => { e.line = ((e.line | 0) + 1) % list.length; return list[(e.line + list.length - 1) % list.length]; };
      function* npcTalk(e) {
        const N = NN();
        switch (e.name) {
          case 'mom':
            if (!S.sword) {
              yield say(`MOM: ${N}! At last, you're up! Have you HEARD? Princess Zeldo's secret pasta-sauce recipe has been NICKED! In the night!`);
              yield say(`MOM: Your Grandad's old sword and shield are in that chest over there. Take them, find out who did it... and be home in time for your tea!`);
              S.f.mom = 1;
            } else if (!S.f.elder) yield say(`MOM: Go and see ELDER PARMESAN in FARFALLE VILLAGE. Out the door, follow the path east, then go north. He knows everything. Well, nearly everything.`);
            else if (!S.f.baron) yield say(cycle(e, [`MOM: Have you got a clean hanky? ...Never mind. Go on, save the day, ${N}.`, "MOM: If you're feeling poorly, Mabel's MINESTRONE is the best. After mine, obviously.", 'MOM: Push a gravestone? Of course not. Unless it really, really wobbles. Why do you ask?']));
            else yield say(`MOM: My little hero! The whole kingdom's talking about you. Now wipe your feet, ${N}.`);
            break;
          case 'elder':
            if (!S.f.elder) {
              yield say(`ELDER PARMESAN: Ah, young ${N}. I know why you're here. The thief was BARON MEATBALLO: a big round meanie with a crown and a moustache.`);
              yield say("ELDER PARMESAN: He's hiding in the COLANDER KEEP, up on the NORTH CLIFFS. But a rockfall has blocked the cliff path. You'll need BOMBS!");
              yield say("ELDER PARMESAN: Mabel's shop sells them. Here, take 20 GEMS. My pocket money from 1974. Don't spend it all on sweets.");
              S.gems = Math.min(999, S.gems + 20); S.f.elder = 1; SND.gem(); addScore(20); save();
              yield say('You got 20 GEMS! Cut long grass and bushes with your sword to find more.');
            } else if (!S.bag) yield say('ELDER PARMESAN: BOMBS, young one! Mabel\'s shop is across the square. Then blow up those rocks at the north end of the village.');
            else if (!S.f.baron) yield say(cycle(e, ['ELDER PARMESAN: In the Keep, SMALL KEYS open small doors, and the BIG KEY opens the big one. I learned that the hard way. Took me three weeks.', 'ELDER PARMESAN: The Baron has a weak spot, I\'m sure of it. Every bully does. Keep your eyes open... and maybe so will he.', `ELDER PARMESAN: Lost? Press ${LB('x')} to look at your map, ${N}.`]));
            else yield say('ELDER PARMESAN: You did it! I would do a cartwheel, but my knees said no in 1962.');
            break;
          case 'mabel':
            yield say(cycle(e, ["MABEL: Welcome to MABEL'S! Everything's out on the stands. Walk up to something and have a look.", "MABEL: Bombs, minestrone, hearts. That's all the essentials, really. And string. I'm out of string.", 'MABEL: Short of gems, love? Long grass is full of them. Nobody knows why.']));
            break;
          case 'nonna':
            if (!S.f.grave) yield say(cycle(e, [`NONNA ROSA: Ooh, a visitor! Sit down, ${N}, have a biscuit. My Pasquale is buried up in the graveyard, north of the lake.`, 'NONNA ROSA: His gravestone was always a bit wobbly... just like him. He used to say: if you want something, give it a good PUSH from the front!', 'NONNA ROSA: That boy on my telly has been there since Tuesday. I think he lives here now.']));
            else yield say('NONNA ROSA: You found Pasquale\'s little hiding place? He always did keep his treasures under that stone. Bless him.');
            break;
          case 'dave':
            yield say(cycle(e, ["DAVE: Shh! I'm on the last boss... ARGH! I DIED! That was YOUR fault. You were breathing too loud.", "DAVE: Somebody keeps writing DAVE SUX on everything. When I find out who it is, they're getting a dead arm.", "DAVE: My mate JACK reckons he can do this dungeon in under twenty minutes. No chance.", "DAVE: Have you tried hitting the hens? Don't. Trust me."]));
            break;
          case 'luke':
            yield say(cycle(e, ['LUKE: Cut the long grass with your sword! Gems EVERYWHERE. My Mom says it counts as gardening.', `LUKE: Hold ${LB('b')} down, then let go. SPIN ATTACK! It's mint.`, 'LUKE: Bushes and pots can be picked up and thrown, you know. Lift with ' + LB('a') + ', throw with ' + LB('a') + ' again.', 'LUKE: I bet there are heart pieces hidden all over the place. FOUR of them make a whole new heart!']));
            break;
          case 'lady':
            if (!S.f.blast_c_field) yield say(cycle(e, ['MRS PENNE: My grandad says the cave in the PEAPOD FIELDS has a wall that sounds hollow. A bomb might sort it. Bombs sort most things, he says.', 'MRS PENNE: Those hens are mine. Please be nice to them. They are very sensitive.']));
            else yield say("MRS PENNE: You blew the wall up? Grandad was right! Don't tell him, he'll be unbearable.");
            break;
          case 'fisher':
            if (!S.got.piece_lake) yield say(S.boom ? 'OLD SALTY: That bendy breadstick of yours comes BACK when you throw it, eh? Go on then, fetch that shiny thing off the island!' : "OLD SALTY: See that heart shining on the little island? I can't swim out there, me. If only I had something I could throw that comes BACK...");
            else yield say("OLD SALTY: Ha! You got it! I've been staring at that thing for forty years. Now what'll I look at?");
            break;
          case 'cal':
            yield say(cycle(e, ["CAL: Oh, hi. My PC's broken, so I had to go outside. This is like DOOM, but with more trees.", "CAL: There's a chest up past those trees. I'd get it myself, but... trees.", 'CAL: That pond is magic, I reckon. Stand in front of it and your hearts fill up. Or I fell asleep. One of the two.']));
            break;
        }
      }
      const WARES = { bombs: ['BOMBS', 30], soup: ['MINESTRONE', 40], heart: ['3 HEARTS', 10] };
      function* shopTalk(e) {
        const w = e.item;
        if (w === 'bombs') {
          if (S.bag && S.bombs >= 10) { yield say("MABEL: Your bomb bag's full to bursting, love! Not literally, I hope."); return; }
          const r = yield { text: `BOMBS! A bag of 8 for 30 GEMS. They go BANG. Would you like them?`, ask: ['YES', 'NO'] };
          if (r !== 0) return;
          if (S.gems < 30) { yield say("MABEL: Ooh, you're a bit short, love. 30 gems, please. Try cutting some long grass!"); return; }
          S.gems -= 30; if (!S.bag) yield* getItem('bombs'); else { S.bombs = Math.min(10, S.bombs + 8); SND.pick(); save(); yield say('MABEL: There you go! Mind your eyebrows.'); }
        } else if (w === 'soup') {
          if (S.bottle === 2) { yield say("MABEL: You've already got a full bottle of minestrone. Save it for when you're poorly!"); return; }
          const price = S.bottle ? 20 : 40;
          const r = yield { text: S.bottle ? 'A REFILL of hot MINESTRONE for 20 GEMS?' : 'A BOTTLE OF MINESTRONE for 40 GEMS. Fills ALL your hearts when you drink it!', ask: ['YES', 'NO'] };
          if (r !== 0) return;
          if (S.gems < price) { yield say(`MABEL: That's ${price} gems, love. Come back when your pockets jingle.`); return; }
          S.gems -= price; yield* getItem(S.bottle ? 'refill' : 'soup');
        } else {
          if (S.hp >= S.maxH * 2) { yield say("MABEL: Hearts? You're fit as a fiddle! Save your gems."); return; }
          const r = yield { text: 'A HEART REFILL (3 hearts) for 10 GEMS?', ask: ['YES', 'NO'] };
          if (r !== 0) return;
          if (S.gems < 10) { yield say("MABEL: 10 gems, love. Sorry!"); return; }
          S.gems -= 10; S.hp = Math.min(S.maxH * 2, S.hp + 6); SND.heal(); save(); yield say('MABEL: There! Rosy cheeks again.');
        }
      }
      const GRAVES = ["HERE LIES DAVE'S HIGH SCORE. IT WAS NOT VERY HIGH.", 'R.I.P. MY TAMAGOTCHI. THREE DAYS OLD. I FORGOT TO FEED HIM.', 'HERE LIES THE LAST CHOCOLATE BISCUIT. DAD ATE IT.', 'SIR LANCELOT OF LASAGNA. A GOOD KNIGHT. GOOD NIGHT.',
        'THE MILLENNIUM BUG. DUE ANY DAY NOW.', 'BOB THE BUSH. SOMEBODY CUT HIM. TWICE.', 'HERE LIES NOBODY. IT IS A VERY QUIET GRAVE.', "MY FIRST GOLDFISH, BUBBLES. HE WAS A BRILLIANT SWIMMER.", 'R.I.P. THE BLUE BUTTON ON MY CONTROLLER. PRESSED TOO HARD.', 'GERALD THE GHOST. GONE, BUT STILL AROUND.', "GRANDAD'S CARDIGAN. IT WAS VERY ITCHY."];
      function signText(id, x, y, c) {
        if (c === 'G') return 'HERE LIES PASQUALE, BELOVED HUSBAND OF ROSA. HE ALWAYS WAS A BIT OF A PUSHOVER.';
        if (c === 'g') return GRAVES[(x * 7 + y * 3) % GRAVES.length];
        if (id === 'south') return '↑ FARFALLE VILLAGE     ← HOME     → SUNNY SHORE';
        if (id === 'village') return 'NORTH: THE CLIFFS AND THE COLANDER KEEP. WARNING! ROCKFALL! (A BOMB WOULD SORT THAT OUT.)';
        if (id === 'shore') return 'Written in the sand: DAVE WAS ERE. Somebody has added, underneath: DAVE SUX.';
        return 'The writing has worn away.';
      }

      // ============================================================ PLAYING: one step
      let mode = 'title', lowT = 0;
      function updatePlay() {
        if (co) { if (tb) updateBox(); else if (coWait > 0 && --coWait <= 0) coNext(); updateFx(); return; }
        S.time += 1 / 60;
        if (K.pressed('start')) { openMenu(); return; }
        if (K.pressed('x') && !pl.carry) { mapOpen(); return; }
        updatePlayer();
        if (mode !== 'play') return;
        for (const e of ents) if (!e.dead) updateThing(e);
        ents = ents.filter(e => !e.dead);
        updateShots(); updateFx();
        // the trap shuts behind you once you're properly in the room
        if (room.trapPending && pl.x > 36 && pl.x < RW - 36 && pl.y > 44 && pl.y < RH - 20) { room.trapPending = false; room.trapOn = true; setDoors(room); render(room); SND.shut(); shake = 2; }
        // the fairy pond in the woods
        if (room.id === 'forest' && Math.hypot(pl.x - 64, pl.y - 140) < 30 && S.hp < S.maxH * 2 && K.frame % 20 === 0) { S.hp++; SND.heart(); sparks(pl.x, pl.y - 10, 3, '#ffb0e0'); }
        // low on hearts: a little beep
        if (S.hp <= 2 && ++lowT % 80 === 0) SND.low();
        if (repPend && K.frame % 120 === 0) report();
      }
      function updatePlayer() {
        if (pl.inv > 0) pl.inv--;
        if (pl.kbt > 0) { pl.kbt--; plMove(pl.kbx, 0); plMove(0, pl.kby); pl.act = pl.act === 'charge' || pl.act === 'sword' ? null : pl.act; return checkEdges(); }
        const sx = (K.held('right') ? 1 : 0) - (K.held('left') ? 1 : 0), sy = (K.held('down') ? 1 : 0) - (K.held('up') ? 1 : 0);
        // actions
        if (pl.act) pl.at++;
        switch (pl.act) {
          case 'sword': swordHits(false); if (pl.at >= 12) { pl.cut = false; if (K.held('b')) { pl.act = 'charge'; pl.charge = 0; } else pl.act = null; } break;
          case 'charge':
            pl.charge++; if (pl.charge === 42) { SND.charged(); sparks(pl.x + DX[pl.dir] * 14, pl.y - 8 + DY[pl.dir] * 12, 4); }
            if (pl.charge % 6 === 0) swordHits(false);
            if (!K.held('b')) { if (pl.charge >= 42) { pl.act = 'spin'; pl.at = 0; pl.spinId++; SND.spin(); } else pl.act = null; }
            break;
          case 'spin': swordHits(true); if (pl.at >= 24) pl.act = null; break;
          case 'lift': if (pl.at >= 10) pl.act = null; break;
          case 'throw': case 'item': if (pl.at >= 10) pl.act = null; break;
        }
        if (!pl.act || pl.act === 'charge') {
          if (K.pressed('b') && S.sword && !pl.carry && !pl.act) { pl.act = 'sword'; pl.at = 0; pl.cut = false; SND.sword(); }
          else if (K.pressed('b') && pl.carry) throwIt();
          else if (K.pressed('a') && !pl.act) actionA();
          else if (K.pressed('y') && !pl.act) useItem();
        }
        if (co || mode !== 'play') return;
        // walking
        const canWalk = !pl.act || pl.act === 'charge';
        pl.moving = false;
        if (canWalk && (sx || sy)) {
          if (pl.act !== 'charge') { if (sx && sy) { if (!(pl.dir === (sx < 0 ? 2 : 3) || pl.dir === (sy < 0 ? 1 : 0))) pl.dir = Math.abs(sx) >= 1 ? (sx < 0 ? 2 : 3) : pl.dir; } else pl.dir = sx ? (sx < 0 ? 2 : 3) : (sy < 0 ? 1 : 0); }
          const sp = pl.act === 'charge' ? 0.85 : pl.carry ? 1.2 : 1.45, k = sx && sy ? 0.75 : 1;
          const moved = plMove(sx * sp * k, sy * sp * k);
          pl.moving = true; pl.anim++;
          // shoving blocks, gravestones and locked doors
          if (!moved && (!sx || !sy)) {
            const [tx, ty] = frontTile(), c = tileAt(room, tx, ty);
            if (c === 'B' || c === 'G') { if (++pl.pushT > 22 && !pl.carry) { pl.pushT = 0; tryPush(tx, ty); } }
            else if (c === 'L' || c === 'Y') { if (++pl.pushT > 12) { pl.pushT = -40; tryUnlock(tx, ty); } }
            else pl.pushT = Math.min(pl.pushT, 0);
          } else pl.pushT = 0;
        } else { pl.anim = 0; if (pl.pushT > 0) pl.pushT = 0; if (pl.pushT < 0) pl.pushT++; pl.lockMsg = 0; }
        // stairs, doors, mats
        const ftx = Math.floor(pl.x / 16), fty = Math.floor((pl.y - 3) / 16), fc = tileAt(room, ftx, fty);
        if (fc && 'dD@^m'.includes(fc)) {
          if (fc === 'm') { const o = room.def.out; warp(o[0], o[1], o[2], o[3]); return; }
          const w = (room.def.warps || {})[ftx + ',' + fty]; if (w) { warp(w[0], w[1], w[2], w[3]); return; }
        }
        checkEdges();
      }
      function checkEdges() {
        if (pl.x < 2) edge('w'); else if (pl.x > RW - 2) edge('e'); else if (pl.y < 8) edge('n'); else if (pl.y > RH - 1) edge('s');
      }
      // ---- everything else in the room
      function updateThing(e) {
        switch (e.type) {
          case 'npc': {
            if (e.name === 'luke' || e.name === 'lady') { // wander about the village a bit
              if (--e.tm <= 0) { e.walk = !e.walk && rnd() < 0.7; e.dir = rnd() * 4 | 0; e.tm = 40 + rnd() * 80; }
              if (e.walk) { const nx = e.x + DX[e.dir] * 0.5, ny = e.y + DY[e.dir] * 0.5; if (entFree(e, nx, ny) && Math.hypot(nx - e.home[0], ny - e.home[1]) < 40 && Math.hypot(nx - pl.x, ny - pl.y) > 16) { e.x = nx; e.y = ny; e.anim++; } else e.walk = false; }
            }
            break;
          }
          case 'hen':
            if (e.inv > 0) e.inv--;
            if (e.st === 1) { e.x += e.vx; e.y += e.vy; e.x = clamp(e.x, 10, RW - 10); e.y = clamp(e.y, 14, RH - 4); e.vx *= 0.97; e.vy *= 0.97; e.z = 3 + Math.abs(Math.sin(e.tm * 0.4)) * 4; if (--e.tm <= 0) { e.st = 0; e.z = 0; } e.anim = (K.frame >> 1) & 1; if (e.vx) e.dir = e.vx < 0 ? 2 : 3; }
            else { if (--e.tm <= 0) { e.walk = rnd() < 0.6; e.dir = rnd() < 0.5 ? 2 : 3; e.vy = (rnd() - 0.5) * 0.4; e.tm = 30 + rnd() * 60; if (rnd() < 0.2) SND.cluck(); } if (e.walk) { moveEnt(e, DX[e.dir] * 0.4, e.vy); e.anim = (K.frame >> 3) & 1; } else e.anim = (K.frame >> 5) & 1 ? 2 : 0; }
            break;
          case 'pick': {
            if (e.carried) { if (e.carried.dead) { collect(e); return; } e.x = e.carried.x; e.y = e.carried.y + 8; e.z = 0; return; }
            if (e.vz || e.z > 0) { e.z += e.vz; e.vz -= 0.15; if (e.z <= 0) { e.z = 0; e.vz = Math.abs(e.vz) > 0.8 ? -e.vz * 0.4 : 0; } }
            if (!e.perm && --e.life <= 0) { e.dead = true; return; }
            if (Math.abs(e.x - pl.x) < 10 && e.y > pl.y - 14 && e.y - 8 < pl.y && e.z < 8 && !pl.dead) collect(e);
            break;
          }
          case 'thrown': {
            e.x += e.vx; e.y += e.vy; e.z += e.vz; e.vz -= 0.12;
            const hit = ents.find(o => o.enemy && !o.dead && hitBox(box(o), [e.x - 6, e.y - 10, e.x + 6, e.y]));
            if (hit) { hurtEnt(hit, 2, e.x - e.vx * 4, e.y - e.vy * 4, 'throw'); smash(e); break; }
            const tx = Math.floor(e.x / 16), ty = Math.floor((e.y - 4) / 16), c = tileAt(room, tx, ty);
            if (e.z <= 0 || (c && SOLID.has(c) && !LOW.has(c)) || e.x < 4 || e.x > RW - 4 || e.y < 8 || e.y > RH) { if (c === 'Q') { /* only the boomerang and the sword work it */ } smash(e); }
            break;
          }
          case 'bomb':
            e.t++; if (e.t % (e.t > 80 ? 6 : 14) === 0) SND.fuse();
            if (e.t >= 110) { e.dead = true; explode(e.x, e.y - 6); }
            break;
          case 'boomer': {
            e.t++; if (K.frame % 7 === 0) SND.boomer();
            if (!e.back) {
              e.x += e.vx; e.y += e.vy;
              const tx = Math.floor(e.x / 16), ty = Math.floor((e.y + 4) / 16), c = tileAt(room, tx, ty);
              if (c === 'Q' && !e.hitQ) { e.hitQ = true; toggleCrystal(); e.back = true; }
              if (e.t > 28 || !c || (SOLID.has(c) && !LOW.has(c) && c !== 'p' && c !== 'b' && c !== 'r') || (c === 'b' && cutTile(tx, ty))) { if (c && SOLID.has(c) && !LOW.has(c)) { sfx.tone(1600, 0.04, 'square', 0.03); sparks(e.x, e.y, 2); } e.back = true; }
            } else {
              const dx = pl.x - e.x, dy = pl.y - 10 - e.y, d = Math.hypot(dx, dy);
              if (d < 7 || pl.dead) { e.dead = true; for (const p of ents) if (p.carried === e) collect(p); break; }
              e.x += dx / d * 4; e.y += dy / d * 4;
            }
            for (const o of ents) {
              if (o.dead || o === e) continue;
              if (o.type === 'pick' && !o.carried && Math.abs(o.x - e.x) < 13 && Math.abs(o.y - 6 - e.y) < 14) { o.carried = e; e.back = true; }
              if ((o.enemy || o.type === 'hen') && !e.hitList) e.hitList = [];
              if ((o.enemy || o.type === 'hen') && !e.hitList.includes(o) && hitBox(box(o), [e.x - 5, e.y - 5 + o.z, e.x + 5, e.y + 9 + o.z])) { e.hitList.push(o); hurtEnt(o, 1, e.x, e.y, 'boom'); e.back = true; }
            }
            break;
          }
          case 'block': {
            e.t++; const k = e.t / 16;
            e.x = lerp(e.sx, e.tx * 16 + 8, k); e.y = lerp(e.sy, e.ty * 16 + 16, k);
            if (e.t >= 16) blockLanded(e);
            break;
          }
          default:
            if (e.enemy) {
              updateEnemy(e);
              if (!e.dead && !e.stun && !e.ghostFade && !(e.st === 'dizzy') && !(e.st === 'die') && !(e.type === 'baron' && e.z > 14) && e.type !== 'npc') {
                const pb = [pl.x - 5, pl.y - 13, pl.x + 5, pl.y]; if (hitBox(box(e), pb)) hurtPlayer(e.dmg, e.x, e.y - e.h / 2);
              }
            }
        }
      }
      function collect(p) {
        p.dead = true;
        switch (p.kind) {
          case 'gem1': case 'gem5': case 'gem20': { const v = +p.kind.slice(3); S.gems = Math.min(999, S.gems + v); addScore(v); SND.gem(); if (p.id) S.got[p.id] = 1; break; }
          case 'heart': S.hp = Math.min(S.maxH * 2, S.hp + 2); SND.heart(); break;
          case 'bombs': S.bombs = Math.min(10, S.bombs + 4); SND.pick(); break;
          case 'piece': S.got['piece_' + p.id] = 1; run(getItem('piece')); break;
          case 'container': S.got[p.id] = 1; run(getItem('container')); break;
          case 'recipe': run(getItem('recipe')); break;
        }
      }
      function updateShots() {
        for (const s of shots) {
          s.x += s.vx; s.y += s.vy; s.life--;
          const tx = Math.floor(s.x / 16), ty = Math.floor(s.y / 16), c = tileAt(room, tx, ty);
          if (s.life <= 0 || !c || (SOLID.has(c) && !LOW.has(c) && !(room.kind === 'dg' && c === '#' && tx > 0 && ty > 0 && tx < 15 && ty < 11 && false))) { s.dead = true; continue; }
          if (Math.abs(s.x - pl.x) < 7 && s.y > pl.y - 15 && s.y < pl.y + 1 && !pl.dead) {
            // the shield: facing the shot, not swinging, not carrying
            const facing = (s.vx * DX[pl.dir] + s.vy * DY[pl.dir]) < -0.5 * Math.hypot(s.vx, s.vy);
            if (S.shield && facing && s.refl && (!pl.act || pl.act === 'charge') && !pl.carry) { s.dead = true; SND.tink(); sparks(s.x, s.y, 4); continue; }
            s.dead = true; hurtPlayer(s.dmg, s.x - s.vx * 3, s.y - s.vy * 3);
          }
        }
        shots = shots.filter(s => !s.dead);
      }
      function updateFx() {
        for (const f of fx) {
          f.t++;
          if (f.k === 'bit') { f.x += f.vx; f.y += f.vy; f.vy += 0.08; }
          if (f.k === 'chip') { f.x += f.vx; f.y += f.vy; f.z += f.vz; f.vz -= 0.18; if (f.z < 0) { f.z = 0; f.vz = -f.vz * 0.3; f.vx *= 0.6; f.vy *= 0.6; } }
          if (f.k === 'txt') f.y -= 0.4;
        }
        fx = fx.filter(f => f.t < f.n);
        if (shake > 0) shake = Math.max(0, shake - 0.5);
        if (flashT > 0) flashT--;
      }

      // ============================================================ DRAWING the room, the things in it, and you
      const WHITE = new Map();
      function white(img) { let w = WHITE.get(img); if (!w) { w = tint(img, '#ffffff', 0.85); WHITE.set(img, w); } return w; }
      const fdir = d => d === 2 ? 3 : d === 3 ? 2 : d; // our left/right -> the sprite sheet's (2 is the right-facing one)
      function heroImg() {
        const PF = personFrames('hero', !!S.shield), d = fdir(pl.dir);
        if (pl.dead) return PF['walk00'];
        if (pl.act === 'get') return PF['get00'];
        if (pl.act === 'sword' || pl.act === 'item' || pl.act === 'throw') return PF['attack' + d + '0'];
        if (pl.act === 'charge') return PF['attack' + d + '0'];
        if (pl.act === 'spin') { const i = swordIdx(); return PF['attack' + fdir(i === 0 || i === 7 ? 3 : i <= 3 ? 0 : i <= 5 ? 2 : 1) + '0']; }
        if (pl.carry || pl.act === 'lift') return PF['carry' + d + '0'];
        return PF['walk' + d + (pl.moving ? (pl.anim >> 3) & 3 : 0)];
      }
      function shadow(x, y, w) { g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(x, y - 1, w, w * 0.38, 0, 0, 7); g.fill(); }
      function drawSword() {
        const i = swordIdx(); if (i < 0 || !SWORD) return;
        const sp = SWORD[i], h = HAND[pl.act === 'spin' ? 0 : pl.dir];
        g.drawImage(sp.c, Math.round(pl.x + h[0] - sp.hx), Math.round(pl.y + h[1] - sp.hy));
        if (pl.act === 'charge' && pl.charge >= 42 && (K.frame >> 2) & 1) { const v = VEC[i]; const im = ITEMIMG.spark[(K.frame >> 2) & 3]; g.drawImage(im, Math.round(pl.x + h[0] + v[0] * 15 - 4), Math.round(pl.y + h[1] + v[1] * 15 - 4)); }
      }
      function drawHero() {
        if (pl.inv > 0 && (pl.inv >> 2) & 1 && !pl.dead) return;
        const img = heroImg(), x = Math.round(pl.x - 8), y = Math.round(pl.y - 22);
        const behind = false;
        if (pl.act === 'spin') { g.save(); g.globalAlpha = 0.35; g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); const a0 = Math.atan2(VEC[FRONT[pl.dir]][1], VEC[FRONT[pl.dir]][0]) + Math.PI / 2; g.arc(pl.x, pl.y - 8, 17, a0, a0 + (pl.at / 24) * Math.PI * 2); g.stroke(); g.restore(); }
        if (behind) drawSword();
        g.drawImage(flashT && pl.inv > 60 ? white(img) : img, x, y);
        if (!behind) drawSword();
        if (pl.carry || pl.act === 'lift') { const im = pl.carry === 'pot' ? SPR_POT : pl.carry === 'rock' ? SPR_ROCK : SPR_BUSH; const k = pl.act === 'lift' ? pl.at / 10 : 1; g.drawImage(im, x, Math.round(lerp(y + 16, y - 12, k))); }
        if (pl.act === 'get' && pl.getSpr) { const im = pl.getSpr; g.drawImage(im, Math.round(pl.x - im.width / 2), y - im.height - 1); if ((K.frame >> 3) & 1) g.drawImage(ITEMIMG.spark[(K.frame >> 3) & 3], Math.round(pl.x + 4), y - im.height - 4); }
      }
      function drawEnt(e) {
        const x = Math.round(e.x), y = Math.round(e.y), z = Math.round(e.z || 0);
        let img = null, ox = 8, oy = 15;
        switch (e.type) {
          case 'gloop': case 'gloopP': img = SPR[e.type][e.anim]; oy = 14; break;
          case 'snap': img = SPR.snap[fdir(e.dir) + '' + e.anim]; oy = 15; break;
          case 'knight': img = SPR.knight[fdir(e.dir) + '' + e.anim]; oy = 22; break;
          case 'bat': img = SPR.bat[e.anim]; oy = 10; break;
          case 'ghost': img = SPR.ghost[e.anim]; oy = 17; break;
          case 'crab': img = SPR.crab[e.anim]; oy = 13; break;
          case 'spike': img = SPR.spike[e.anim]; oy = 15; break;
          case 'ball': img = SPR.ball[e.anim | 0]; ox = 7; oy = 13; break;
          case 'cheese': img = SPR.cheese[e.anim]; ox = 16; oy = 30; break;
          case 'baron': img = SPR.baron[e.anim]; ox = 24; oy = 46; break;
          case 'hen': img = SPR.hen[(e.anim === 2 ? 2 : e.anim) + (e.dir === 3 ? 3 : 0)]; ox = 7; oy = 13; break;
          case 'npc': { const PF = personFrames(e.name); img = PF['walk' + fdir(e.sit ? 1 : e.dir) + (e.walk ? (e.anim >> 3) & 3 : 0)]; oy = 22; break; }
          case 'ware': {
            const icon = e.item === 'bombs' ? ITEMIMG.bomb[0] : e.item === 'soup' ? ITEMIMG.bottle[1] : ITEMIMG.container;
            g.drawImage(icon, x - (icon.width >> 1), y - 14 - (icon.height - 12) - ((K.frame >> 5) & 1));
            const pr = String(WARES[e.item][1]); F.draw(g, pr, x - F.width(pr) / 2 + 3, y + 6, '#fff8c0', 1, '#000');
            g.drawImage(ITEMIMG.gem1[0], 0, 0, 8, 14, x - F.width(pr) / 2 - 6, y + 4, 6, 10);
            return;
          }
          case 'pick': {
            const blink = !e.perm && e.life < 120 && (K.frame >> 2) & 1; if (blink) return;
            const sp = (K.frame >> 4) & 1;
            img = e.kind === 'heart' ? ITEMIMG.heart : e.kind === 'bombs' ? ITEMIMG.bomb[0] : e.kind === 'piece' ? ITEMIMG.piece : e.kind === 'container' ? ITEMIMG.container : e.kind === 'recipe' ? ITEMIMG.recipe : ITEMIMG[e.kind][sp];
            ox = img.width >> 1; oy = img.height + 1;
            if (e.perm && !e.carried) { const gl = 0.25 + Math.sin(K.t * 4) * 0.12; g.fillStyle = `rgba(255,255,220,${gl})`; g.beginPath(); g.ellipse(x, y - oy / 2 - z, ox + 3, oy / 2 + 3, 0, 0, 7); g.fill(); }
            break;
          }
          case 'thrown': img = e.kind === 'pot' ? SPR_POT : e.kind === 'rock' ? SPR_ROCK : SPR_BUSH; oy = 14; break;
          case 'bomb': img = ITEMIMG.bomb[(e.t >> (e.t > 80 ? 1 : 3)) & 1]; if (e.t > 80 && (e.t >> 1) & 1) img = white(img); oy = 15; break;
          case 'boomer': img = ITEMIMG.boom[(e.t >> 1) & 3]; oy = 8; break;
          case 'block': img = e.kind === 'G' ? SPR_GRAVE : dgBlock('B'); oy = 16; break;
        }
        if (!img) return;
        let draw = img;
        if (e.flash && (K.frame >> 1) & 1) draw = white(img);
        if (e.ghostFade) { g.globalAlpha = 0.3; }
        if (e.stun > 0 && (K.frame >> 2) & 1) { g.globalAlpha = 0.7; }
        g.drawImage(draw, x - ox, y - oy - z);
        g.globalAlpha = 1;
        if (e.stun > 0 || (e.type === 'cheese' && e.st === 'dizzy') || (e.type === 'baron' && e.st === 'dizzy')) { // dizzy stars
          const r = e.type === 'baron' ? 18 : e.type === 'cheese' ? 12 : 7, top = y - oy - z - 2;
          for (let i = 0; i < 3; i++) { const a = K.t * 5 + i * 2.1; g.drawImage(ITEMIMG.star, Math.round(x + Math.cos(a) * r - 3), Math.round(top + Math.sin(a) * r * 0.3 - 3)); }
        }
      }
      const SHADOWW = { gloop: 6, gloopP: 6, snap: 6, knight: 7, bat: 4, ghost: 5, crab: 6, spike: 6, ball: 5, cheese: 14, baron: 20, hen: 5, npc: 6, pick: 4, thrown: 6, bomb: 5, boomer: 4 };
      function drawRoom(rm, ox, oy, full) {
        g.drawImage(rm.fr[(K.frame / 12 | 0) % 4], ox, oy);
        if (!full) return;
        const list = ents.filter(e => !e.dead && e.type !== 'ware').slice();
        // shadows first (the depth trick: everything floats over the ground)
        for (const e of list) { const w = SHADOWW[e.type]; if (w && !(e.type === 'ghost' && e.ghostFade)) shadow(e.x + ox, e.y + oy, w * (1 - Math.min(0.5, (e.z || 0) / 80))); }
        if (!pl.dead) shadow(pl.x + ox, pl.y + oy, 6);
        for (const e of ents) if (e.type === 'ware' && !e.dead) { g.save(); g.translate(ox, oy); drawEnt(e); g.restore(); }
        list.push({ type: '_pl', y: pl.y });
        list.sort((a, b) => (a.type === 'baron' ? a.y - 10 : a.y) - (b.type === 'baron' ? b.y - 10 : b.y));
        g.save(); g.translate(ox, oy);
        for (const e of list) {
          if (e.type === '_pl') { drawHero(); continue; }
          drawEnt(e);
        }
        // long grass round your ankles
        const tallAt = (x, y) => tileAt(room, Math.floor(x / 16), Math.floor((y - 2) / 16)) === '"';
        if (room.kind === 'ow') {
          const ov = tallOverlay(room.G);
          if (tallAt(pl.x, pl.y) && !pl.dead) g.drawImage(ov, 0, 8, 16, 8, Math.round(pl.x - 8), Math.round(pl.y - 7), 16, 8);
          for (const e of list) if (e.type !== '_pl' && e.enemy && !e.z && tallAt(e.x, e.y)) g.drawImage(ov, 0, 8, 16, 8, Math.round(e.x - 8), Math.round(e.y - 7), 16, 8);
        }
        for (const s of shots) { const im = SPR[s.spr]; shadow(s.x, s.y + 6, 3); g.drawImage(im, Math.round(s.x - 4), Math.round(s.y - 4 - (s.z || 0) + 6)); }
        for (const f of fx) drawFx(f);
        g.restore();
      }
      function drawFx(f) {
        if (f.t < 0) return;
        switch (f.k) {
          case 'puff': { const i = Math.min(4, f.t / 4 | 0); g.drawImage(ITEMIMG.puff[i], Math.round(f.x - 12), Math.round(f.y - 12)); break; }
          case 'bang': { const i = Math.min(3, f.t / 5 | 0); g.drawImage(ITEMIMG.bang[i], Math.round(f.x - 20), Math.round(f.y - 20)); break; }
          case 'hit': g.drawImage(ITEMIMG.hit, Math.round(f.x - 8), Math.round(f.y - 8)); break;
          case 'bit': g.fillStyle = f.col; g.fillRect(Math.round(f.x), Math.round(f.y), f.t < f.n / 2 ? 2 : 1, f.t < f.n / 2 ? 2 : 1); break;
          case 'chip': g.fillStyle = f.col; g.fillRect(Math.round(f.x), Math.round(f.y - f.z), 2, 2); break;
          case 'txt': F.center(g, f.s, Math.round(f.x), Math.round(f.y), f.col || '#fff', 1, '#000'); break;
        }
      }
      // ---- light and air: dark caves with a lantern glow, torch-lit dungeons, cloud shadows drifting over the fields, mist in the woods
      const LIGHT = cnv(RW, RH), LG = LIGHT.getContext('2d');
      let CLOUD = null, MIST = null, VIG = null;
      function atmos(rm, ox, oy) {
        const k = rm.kind;
        if (rm.def.dark) {
          LG.globalCompositeOperation = 'source-over'; LG.clearRect(0, 0, RW, RH); LG.fillStyle = 'rgba(4,2,10,.86)'; LG.fillRect(0, 0, RW, RH);
          LG.globalCompositeOperation = 'destination-out';
          const hole = (x, y, r) => { const gr = LG.createRadialGradient(x, y, r * 0.25, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); LG.fillStyle = gr; LG.fillRect(x - r, y - r, r * 2, r * 2); };
          hole(pl.x, pl.y - 8, 62 + Math.sin(K.t * 3) * 2); hole(128, 186, 50);
          for (const e of ents) if (e.type === 'pick' && e.perm) hole(e.x, e.y - 6, 26);
          LG.globalCompositeOperation = 'source-over';
          g.drawImage(LIGHT, ox, oy);
        } else if (k === 'dg') {
          if (!VIG) { VIG = cnv(RW, RH); const vg = VIG.getContext('2d'), gr = vg.createRadialGradient(128, 96, 60, 128, 96, 170); gr.addColorStop(0, 'rgba(0,0,20,0)'); gr.addColorStop(1, 'rgba(0,0,20,.45)'); vg.fillStyle = gr; vg.fillRect(0, 0, RW, RH); }
          g.drawImage(VIG, ox, oy);
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (rm.t[y][x] === 't') { const r = 30 + Math.sin(K.t * 9 + x) * 2, cx = x * 16 + 8 + ox, cy = y * 16 + 4 + oy; const gr = g.createRadialGradient(cx, cy, 2, cx, cy, r); gr.addColorStop(0, 'rgba(255,150,60,.28)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2); }
          g.restore();
        } else if (k === 'ow') {
          if (rm.def.fog) {
            if (!MIST) { MIST = cnv(RW * 2, RH); const mg = MIST.getContext('2d'); for (let i = 0; i < 40; i++) { const x = hash(i, 1, 51) * RW * 2, y = hash(i, 2, 51) * RH, r = 20 + hash(i, 3, 51) * 30; const gr = mg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(230,240,255,.22)'); gr.addColorStop(1, 'rgba(230,240,255,0)'); mg.fillStyle = gr; mg.fillRect(x - r, y - r, r * 2, r * 2); } }
            const o = (K.t * 6) % RW; g.drawImage(MIST, -o + ox, oy); g.drawImage(MIST, -o + RW * 2 + ox, oy);
            g.fillStyle = 'rgba(10,40,30,.12)'; g.fillRect(ox, oy, RW, RH);
            if (rm.id === 'forest') for (let i = 0; i < 6; i++) { const t = (K.t * 0.6 + i / 6) % 1, x = 64 + Math.sin(i * 2.3 + K.t) * 10, y = 150 - t * 34; g.globalAlpha = Math.sin(t * Math.PI); g.drawImage(ITEMIMG.spark[(i + (K.frame >> 3)) & 3], Math.round(x - 4 + ox), Math.round(y - 4 + oy)); g.globalAlpha = 1; }
          } else if (rm.def.gp === 'g') { g.fillStyle = 'rgba(30,20,60,.18)'; g.fillRect(ox, oy, RW, RH); }
          else {
            if (!CLOUD) { CLOUD = cnv(140, 70); const cg = CLOUD.getContext('2d'); for (let i = 0; i < 7; i++) { const x = 25 + i * 15, y = 35 + Math.sin(i * 1.7) * 10, r = 18 + (i % 3) * 6; const gr = cg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,20,40,.16)'); gr.addColorStop(1, 'rgba(0,20,40,0)'); cg.fillStyle = gr; cg.fillRect(x - r, y - r, r * 2, r * 2); } }
            for (let i = 0; i < 2; i++) { const cx = ((K.t * 7 + i * 190 + hash(rm.def.gx, rm.def.gy, 4) * 300) % (RW + 160)) - 150, cy = 20 + i * 90 + Math.sin(K.t * 0.1 + i) * 10; g.drawImage(CLOUD, cx + ox, cy + oy); }
          }
        }
      }

      // ============================================================ the HUD (life, gems, bombs, keys, the Y item)
      const ICON = {
        gem: mk(8, 10, gg => { gg.fillStyle = '#1a7a2a'; gg.beginPath(); gg.moveTo(4, 0); gg.lineTo(7.5, 3); gg.lineTo(7.5, 7); gg.lineTo(4, 10); gg.lineTo(0.5, 7); gg.lineTo(0.5, 3); gg.fill(); R(gg, 4, 1, 3, 8, '#30c048'); R(gg, 2, 3, 2, 4, '#a8f8b0'); }, OUT),
        bomb: mk(9, 9, gg => { E(gg, 4.5, 5, 3.6, 3.6, '#3a4ac0'); E(gg, 3.5, 4, 1.4, 1.2, '#a0b0ff'); R(gg, 4, 0, 2, 2, '#c8c8d8'); P(gg, 7, 0, '#ff9020'); }, OUT),
        key: mk(6, 10, gg => { R(gg, 1, 0, 4, 4, '#e8b020'); R(gg, 2, 1, 2, 2, 'rgba(0,0,0,0)'); R(gg, 2, 4, 2, 6, '#e8b020'); R(gg, 4, 7, 1, 1, '#e8b020'); R(gg, 4, 9, 1, 1, '#e8b020'); }, OUT),
      };
      { const kg = ICON.key.getContext('2d'); kg.clearRect(3, 2, 1, 1); kg.clearRect(2, 2, 1, 1); }
      const HEARTI = [0, 1, 2].map(n => mk(9, 8, gg => { // empty, half, full
        const rows = ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'];
        rows.forEach((r, y) => { for (let x = 0; x < 7; x++) if (r[x] === 'x') { const on = n === 2 || (n === 1 && x < 4); P(gg, x + 1, y + 1, on ? (y === 0 || (y === 1 && x < 3) ? '#ff9aa8' : y > 3 ? '#b81a2a' : '#f0303e') : '#3a1a2a'); } });
        if (n) P(gg, 2, 2, '#ffffff');
      }, '#100810'));
      const itemIcon = k => k === 'boom' ? ITEMIMG.boom[0] : k === 'bombs' ? ITEMIMG.bomb[0] : k === 'soup' ? ITEMIMG.bottle[S.bottle === 2 ? 1 : 0] : null;
      function drawHUD() {
        const gr = g.createLinearGradient(0, 0, 0, TOP); gr.addColorStop(0, '#141830'); gr.addColorStop(1, '#0a0c1c'); g.fillStyle = gr; g.fillRect(0, 0, W, TOP);
        g.fillStyle = '#c8a040'; g.fillRect(0, TOP - 2, W, 1); g.fillStyle = '#5a4818'; g.fillRect(0, TOP - 1, W, 1);
        // the Y item box
        g.fillStyle = '#c8a040'; g.fillRect(6, 4, 24, 24); g.fillStyle = '#20284a'; g.fillRect(7, 5, 22, 22); g.fillStyle = '#0a0e22'; g.fillRect(8, 6, 20, 20);
        const ic = S.sel ? itemIcon(S.sel) : null; if (ic) g.drawImage(ic, 18 - ic.width / 2, 16 - ic.height / 2);
        E(g, 8, 8, 5.5, 5.5, '#145a28'); E(g, 8, 7.5, 5, 5, '#2a9a4a'); E(g, 7, 6, 2, 1.5, '#6ad08a'); F.draw(g, LB('y'), 6, 4, '#ffffff', 1);
        // gems, bombs, keys
        g.drawImage(ICON.gem, 38, 5); F.draw(g, String(S.gems).padStart(3, '0'), 34, 18, '#ffffff', 1, '#000');
        if (S.bag) { g.drawImage(ICON.bomb, 62, 6); F.draw(g, String(S.bombs).padStart(2, '0'), 60, 18, '#ffffff', 1, '#000'); }
        if (room && room.kind === 'dg') { g.drawImage(ICON.key, 85, 5); F.draw(g, String(S.keys), 85, 18, '#ffffff', 1, '#000'); if (S.big) g.drawImage(ITEMIMG.bigkey, 0, 0, 16, 16, 94, 4, 12, 12); }
        // life
        F.center(g, '- LIFE -', 192, 3, '#f8d048', 1, '#000');
        const n = S.maxH, hp = S.hp;
        for (let i = 0; i < n; i++) { const v = hp >= (i + 1) * 2 ? 2 : hp === i * 2 + 1 ? 1 : 0; const bx = 192 - n * 4.5 + i * 9, by = 13 + (v && hp <= 2 && (K.frame >> 3) & 1 ? -1 : 0); g.drawImage(HEARTI[v], Math.round(bx), by); }
      }
      function drawBanner() {
        if (!banner) return; const t = banner.t; if (t > 150) { banner = null; return; }
        const a = t < 15 ? t / 15 : t > 120 ? (150 - t) / 30 : 1, w = F.width(banner.s) + 24;
        g.globalAlpha = a; g.fillStyle = 'rgba(10,12,30,.8)'; g.fillRect(128 - w / 2, TOP + 10, w, 17); g.fillStyle = '#c8a040'; g.fillRect(128 - w / 2, TOP + 10, w, 1); g.fillRect(128 - w / 2, TOP + 26, w, 1);
        F.center(g, banner.s, 128, TOP + 15, '#ffffff', 1, '#000'); g.globalAlpha = 1;
      }
      function drawToast() { if (!toast) return; const w = F.width(toast.s) + 12; g.fillStyle = 'rgba(0,0,0,.7)'; g.fillRect(128 - w / 2, H - 22, w, 14); F.center(g, toast.s, 128, H - 19, '#fff8c0', 1); }
      function frameBox(x, y, w, h, fill) { g.fillStyle = '#f0e8d0'; g.fillRect(x, y, w, h); g.fillStyle = '#c8a040'; g.fillRect(x + 1, y + 1, w - 2, h - 2); g.fillStyle = fill || '#16204a'; g.fillRect(x + 2, y + 2, w - 4, h - 4); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x + 2, y + 2, w - 4, 2); }

      // ============================================================ the START menu: items, the quest, save
      let menu = null;
      const ITEMS = [['boom', 'BOOMERANG'], ['bombs', 'BOMBS'], ['soup', 'MINESTRONE']];
      const owned = k => k === 'boom' ? S.boom : k === 'bombs' ? S.bag : S.bottle > 0;
      function openMenu() { menu = { row: 0, col: Math.max(0, ITEMS.findIndex(i => i[0] === S.sel)), t: 0, saved: 0 }; mode = 'menu'; SND.menu(); }
      function updMenu() {
        const M = menu; M.t++; if (M.saved) M.saved--;
        if (K.pressed('start') || (K.pressed('b') && M.row === 0)) { mode = 'play'; SND.menu(); return; }
        if (K.pressed('up') || K.pressed('down')) { M.row = 1 - M.row; SND.menu(); }
        if (K.pressed('left')) { M.col = (M.col + 2) % 3; SND.menu(); } if (K.pressed('right')) { M.col = (M.col + 1) % 3; SND.menu(); }
        if (M.row === 0 && owned(ITEMS[M.col][0]) && S.sel !== ITEMS[M.col][0] && (K.pressed('left') || K.pressed('right') || K.pressed('a') || K.pressed('y'))) { S.sel = ITEMS[M.col][0]; SND.pick(); }
        if (M.row === 1 && (K.pressed('a') || K.pressed('y'))) {
          if (M.col === 0) { mode = 'play'; SND.menu(); }
          else if (M.col === 1) { save(); SND.save(); M.saved = 90; }
          else { save(); SND.save(); song(null); mode = 'done'; finalScore(S.score | 0, 'SAVED!', `${NN()}'s adventure is saved. Pick the file again to carry on where you left off.`); }
        }
      }
      function drawMenu() {
        const M = menu, k = Math.min(1, M.t / 10), off = Math.round((1 - k) * -H);
        g.fillStyle = 'rgba(0,0,10,.55)'; g.fillRect(0, 0, W, H);
        g.save(); g.translate(0, off);
        frameBox(6, 6, 244, 212, '#101838');
        F.center(g, '- ITEMS -', 70, 13, '#f8d048', 1, '#000');
        frameBox(12, 22, 118, 62, '#0a1030');
        ITEMS.forEach(([key, nm], i) => {
          const x = 20 + i * 36, y = 32; g.fillStyle = '#1c2858'; g.fillRect(x, y, 30, 30); g.fillStyle = '#2c3a78'; g.fillRect(x, y, 30, 1);
          if (owned(key)) { const ic = itemIcon(key); g.drawImage(ic, x + 15 - ic.width / 2, y + 15 - ic.height / 2); if (key === 'bombs') F.draw(g, String(S.bombs), x + 18, y + 22, '#fff', 1, '#000'); }
          if (S.sel === key) { g.strokeStyle = '#f8d048'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, 29, 29); }
          if (M.row === 0 && M.col === i && (M.t >> 3) & 1) { g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(x - 2, y - 2, 34, 34); }
        });
        const cur = ITEMS[M.col]; F.center(g, owned(cur[0]) ? cur[1] : '- - -', 71, 70, owned(cur[0]) ? '#ffffff' : '#5a6090', 1, '#000');
        // equipment, heart pieces, gems and time
        F.center(g, '- KIT -', 190, 13, '#f8d048', 1, '#000');
        frameBox(136, 22, 108, 62, '#0a1030');
        g.globalAlpha = S.sword ? 1 : 0.2; g.drawImage(ITEMIMG.swordIcon, 144, 29); g.globalAlpha = S.shield ? 1 : 0.2; g.drawImage(ITEMIMG.shieldIcon, 162, 29); g.globalAlpha = 1;
        g.drawImage(ITEMIMG.pieces[S.pieces], 210, 27); F.center(g, S.pieces + '/4', 218, 45, '#ffb0b8', 1, '#000');
        g.drawImage(ICON.gem, 144, 56); F.draw(g, String(S.gems), 156, 57, '#a8f8b0', 1, '#000');
        F.draw(g, 'TIME ' + clock(S.time), 190, 57, '#c8d0f0', 1); F.draw(g, 'HEARTS ' + S.maxH, 144, 70, '#ffb0b8', 1);
        // the dungeon things
        frameBox(12, 88, 232, 34, '#0a1030');
        F.draw(g, 'COLANDER KEEP', 20, 101, '#f8d048', 1, '#000');
        [['map', ITEMIMG.map, S.map], ['compass', ITEMIMG.compass, S.comp], ['bigkey', ITEMIMG.bigkey, S.big]].forEach(([n, im, has], i) => { const x = 116 + i * 24; g.globalAlpha = has ? 1 : 0.18; g.drawImage(im, x, 97); g.globalAlpha = 1; });
        g.drawImage(ICON.key, 196, 99); F.draw(g, 'X' + S.keys, 205, 101, '#fff', 1, '#000');
        // the quest
        frameBox(12, 126, 232, 50, '#0a1030');
        F.draw(g, 'QUEST:', 20, 132, '#f8d048', 1, '#000');
        wrap(questLine(), 36).slice(0, 3).forEach((l, i) => F.draw(g, l, 20, 143 + i * 10, '#ffffff', 1, '#000'));
        // options
        ['CARRY ON', 'SAVE', 'SAVE & QUIT'].forEach((o, i) => { const x = [20, 98, 160][i]; const on = M.row === 1 && M.col === i; F.draw(g, o, x + 10, 186, on ? '#f8d048' : '#9aa0c8', 1, '#000'); if (on) F.draw(g, '→', x, 186, '#f8d048', 1); });
        F.center(g, M.saved ? 'SAVED!' : `${LB('start')}: BACK TO THE GAME`, 128, 203, M.saved ? '#a8f8b0' : '#5a6090', 1);
        g.restore();
      }
      const clock = s => { s = s | 0; const h = s / 3600 | 0, m = (s / 60 | 0) % 60; return h + ':' + String(m).padStart(2, '0'); };
      function questLine() {
        if (!S.sword) return "Grab Grandad's sword and shield from the chest at home.";
        if (!S.f.elder) return 'Go and see ELDER PARMESAN in Farfalle Village (east, then north).';
        if (!S.bag) return "Buy some BOMBS at Mabel's shop in the village.";
        if (!S.f.blast_cliff) return 'Blow up the rockfall at the north end of the village.';
        if (!S.f.keepIn) return 'Climb the North Cliffs to the COLANDER KEEP.';
        if (!S.boom) return 'Find the treasure of the Colander Keep. Small keys open locked doors.';
        if (!S.f.cheese) return 'Somebody cheesy is guarding the west of the Keep...';
        if (!S.big) return 'Find the BIG KEY. Maybe some blocks need pushing.';
        if (!S.f.baron) return "Open the big door and beat BARON MEATBALLO! Watch his THIRD EYE.";
        return 'You saved tea-time! Find any heart pieces you missed.';
      }

      // ============================================================ the MAP
      let mapT = 0; const MINI = {};
      const MCOL = { '.': '#58b040', '"': '#3e9a34', f: '#80c860', ':': '#d8b070', s: '#f0d898', T: '#2a6a28', b: '#4ea83a', r: '#9a9aa8', X: '#7a7088', C: '#a87040', '~': '#3474d0', '=': '#a06a34', F: '#a06a30', S: '#b07838', g: '#8a8aa0', G: '#8a8aa0', h: '#c84a3a', d: '#5a3018', K: '#b0bcd8', D: '#1a1020', '@': '#1a1020', O: '#7a7a8a', '^': '#3a3040' };
      function mini(id) {
        if (MINI[id]) return MINI[id];
        const c = cnv(64, 48), gg = c.getContext('2d'), def = ROOMS[id];
        def.map.forEach((row, y) => [...row].forEach((ch, x) => { gg.fillStyle = MCOL[ch] || '#58b040'; gg.fillRect(x * 4, y * 4, 4, 4); if (ch === 'T') { gg.fillStyle = '#3a8a34'; gg.fillRect(x * 4, y * 4, 2, 2); } }));
        return MINI[id] = c;
      }
      function mapOpen() { mode = 'map'; mapT = 0; SND.menu(); }
      function updMap() { mapT++; if (mapT > 6 && (K.pressed('x') || K.pressed('a') || K.pressed('b') || K.pressed('start'))) { mode = 'play'; SND.menu(); } }
      function drawMap() {
        g.fillStyle = 'rgba(0,0,10,.75)'; g.fillRect(0, 0, W, H);
        if (room.kind === 'dg') return drawDgMap();
        frameBox(22, 6, 212, 194, '#0a1030');
        F.center(g, 'THE KINGDOM OF LASAGNIA', 128, 12, '#f8d048', 1, '#000');
        const ox = 32, oy = 24, here = room.kind === 'ow' ? room.id : ({ h_home: 'home', h_shop: 'village', h_elder: 'village', h_nonna: 'village', c_grave: 'grave', c_field: 'east' })[room.id] || 'cliff';
        for (const id in OWG) {} // (the grid)
        for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
          const id = OWG[gx + ',' + gy], x = ox + gx * 64, y = oy + gy * 48;
          if (S.seen[id]) g.drawImage(mini(id), x, y); else { g.fillStyle = '#1a2040'; g.fillRect(x, y, 64, 48); F.center(g, '?', x + 32, y + 20, '#3a4478', 1); }
          g.strokeStyle = 'rgba(0,0,0,.5)'; g.strokeRect(x + 0.5, y + 0.5, 63, 47);
        }
        // the keep, and where you are
        if (S.seen.cliff) { g.drawImage(ITEMIMG.trifork, 0, 0, 24, 24, ox + 64 + 26, oy + 2, 12, 12); }
        const hx = OWG[ROOMS[here].gx + ',' + ROOMS[here].gy] ? ROOMS[here].gx : 0, hy = ROOMS[here].gy;
        const px = room.kind === 'ow' ? pl.x / 4 : 32, py = room.kind === 'ow' ? pl.y / 4 : 24;
        if ((mapT >> 3) & 1) { g.fillStyle = '#ffffff'; g.fillRect(ox + hx * 64 + px - 3, oy + hy * 48 + py - 5, 6, 6); g.fillStyle = '#e83838'; g.fillRect(ox + hx * 64 + px - 2, oy + hy * 48 + py - 4, 4, 4); }
        F.center(g, roomName(here), 128, 172, '#ffffff', 1, '#000');
        F.center(g, `${LB('x')}: CLOSE THE MAP`, 128, 186, '#5a6090', 1);
      }
      function drawDgMap() {
        frameBox(22, 6, 212, 194, '#0a1030');
        F.center(g, 'THE COLANDER KEEP', 128, 12, '#f8d048', 1, '#000');
        const ox = 72, oy = 26, cw = 36, chh = 26;
        for (const id in ROOMS) {
          const r = ROOMS[id]; if (r.kind !== 'dg') continue;
          const seen = S.seen[id], show = seen || (S.map && !r.secret); if (!show) continue;
          const x = ox + r.gx * cw, y = oy + r.gy * chh;
          g.fillStyle = seen ? '#3a5aa8' : '#1c2858'; g.fillRect(x + 2, y + 2, cw - 4, chh - 4); g.fillStyle = seen ? '#6a8ad8' : '#2c3a78'; g.fillRect(x + 2, y + 2, cw - 4, 2);
          const d = r.doors || {}; g.fillStyle = seen ? '#6a8ad8' : '#2c3a78';
          if (d.n && d.n !== 'J') g.fillRect(x + cw / 2 - 3, y, 6, 3); if (d.s) g.fillRect(x + cw / 2 - 3, y + chh - 3, 6, 3); if (d.w) g.fillRect(x, y + chh / 2 - 3, 3, 6); if (d.e) g.fillRect(x + cw - 3, y + chh / 2 - 3, 3, 6);
          if (S.comp) {
            for (const k in (r.chests || {})) if (!S.opened[id + ':' + k]) { g.fillStyle = '#f8d048'; g.fillRect(x + 6 + (k.length % 3) * 6, y + 8, 4, 4); }
            if (id === 'd11' && !S.f.baron && (mapT >> 4) & 1) { g.drawImage(SPR.ball[0], x + cw / 2 - 7, y + 5); }
          }
          if (id === room.id && (mapT >> 3) & 1) { g.fillStyle = '#fff'; g.fillRect(x + cw / 2 - 3, y + chh / 2 - 3, 6, 6); g.fillStyle = '#e83838'; g.fillRect(x + cw / 2 - 2, y + chh / 2 - 2, 4, 4); }
        }
        F.draw(g, S.map ? 'MAP' : 'NO MAP YET', 30, 168, S.map ? '#a8f8b0' : '#5a6090', 1); F.draw(g, S.comp ? 'COMPASS' : 'NO COMPASS', 100, 168, S.comp ? '#a8f8b0' : '#5a6090', 1); F.draw(g, S.big ? 'BIG KEY' : '', 180, 168, '#f8d048', 1);
        F.center(g, roomName(room.id), 128, 152, '#ffffff', 1, '#000');
        F.center(g, `${LB('x')}: CLOSE THE MAP`, 128, 186, '#5a6090', 1);
      }

      // ============================================================ THE TITLE SCREEN
      function logoText(str, size, ramp, outline, font) {
        const pad = 6, tmp = cnv(10, 10).getContext('2d'); tmp.font = font || `bold ${size}px Georgia, "Times New Roman", serif`;
        const w = Math.ceil(tmp.measureText(str).width) + pad * 2, h = Math.ceil(size * 1.25) + pad * 2;
        const c = cnv(w, h), gg = c.getContext('2d'); gg.font = tmp.font; gg.textBaseline = 'top'; gg.fillStyle = '#fff'; gg.fillText(str, pad, pad);
        const im = gg.getImageData(0, 0, w, h), d = im.data, A = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) A[i] = d[i * 4 + 3] > 110 ? 1 : 0;
        let y0 = h, y1 = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (A[y * w + x]) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        const rgb = ramp.map(hexRGB), ol = hexRGB(outline);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x, o = i * 4;
          if (A[i]) {
            const k = clamp((y - y0) / Math.max(1, y1 - y0), 0, 0.999); let c = rgb[Math.floor(k * rgb.length)];
            if (!A[i - w]) c = [255, 255, 240]; else if (!A[i + w]) c = rgb[rgb.length - 1].map(v => v * 0.6);
            d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
          } else {
            let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { if (Math.abs(dx) + Math.abs(dy) > 3) continue; const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h && A[yy * w + xx]) { near = true; break; } }
            if (near) { d[o] = ol[0]; d[o + 1] = ol[1]; d[o + 2] = ol[2]; d[o + 3] = 255; } else d[o + 3] = 0;
          }
        }
        gg.putImageData(im, 0, 0);
        return c;
      }
      let TBG = null, LOGO = null, LOGO2 = null, CLOUDS = null, DARKC = null, BARONK = null;
      function titleArt() {
        if (TBG) return;
        CLOUDS = [['#c8a8dc', '#a888c0'], ['#ffe0e0', '#f0b0c0']].map(([a, b]) => mk(56, 16, cg => { E(cg, 14, 10, 12, 5, b); E(cg, 30, 9, 16, 6, b); E(cg, 44, 11, 10, 4, b); E(cg, 16, 8, 10, 4, a); E(cg, 30, 6, 13, 5, a); E(cg, 42, 9, 8, 3, a); E(cg, 26, 4, 6, 2, '#ffffff'); }));
        TBG = cnv(W, H); const gg = TBG.getContext('2d');
        // the dawn sky in SNES-style bands
        const sky = ['#1a1848', '#22205a', '#2c2a6c', '#3a3478', '#4a3c80', '#5e4486', '#784a86', '#944e80', '#b05a78', '#c86a6e', '#dc7e66', '#ec9a62', '#f6b864'];
        sky.forEach((c, i) => { gg.fillStyle = c; gg.fillRect(0, i * 12, W, 12); if (i) DITH(gg, 0, i * 12, W, 2, sky[i - 1]); });
        for (let i = 0; i < 40; i++) { const x = hash(i, 1, 61) * W | 0, y = hash(i, 2, 61) * 60 | 0; gg.fillStyle = i % 5 ? '#c8c8f0' : '#ffffff'; gg.fillRect(x, y, 1, 1); }
        // the sun peeping over the hills
        E(gg, 128, 150, 30, 30, '#ffd890'); E(gg, 128, 150, 24, 24, '#fff0b8');
        // far mountains (purple, snowy tops), then blue hills with the Keep, then green hills
        const ridge = (base, amp, f1, f2, col, seed, top) => { gg.fillStyle = col; gg.beginPath(); gg.moveTo(0, H); for (let x = 0; x <= W; x += 2) { const y = base - Math.abs(Math.sin(x * f1 + seed)) * amp - Math.sin(x * f2 + seed * 2) * amp * 0.3; gg.lineTo(x, y); if (top && y < base - amp * 0.75) { } } gg.lineTo(W, H); gg.fill(); };
        ridge(140, 46, 0.018, 0.05, '#6a5a9a', 1); ridge(140, 46, 0.018, 0.05, '#6a5a9a', 1);
        for (let x = 0; x < W; x += 1) { const y = 140 - Math.abs(Math.sin(x * 0.018 + 1)) * 46 - Math.sin(x * 0.05 + 2) * 46 * 0.3; if (y < 108) { gg.fillStyle = '#e8e0f8'; gg.fillRect(x, y, 1, Math.min(6, 108 - y)); } }
        ridge(160, 26, 0.03, 0.08, '#3a4a8a', 4);
        gg.drawImage(keepArt(F), 0, 0, 96, 64, 200, 134, 48, 32); E(gg, 224, 167, 26, 4, '#3a4a8a');
        ridge(184, 18, 0.04, 0.11, '#2a6a4a', 7); ridge(200, 12, 0.05, 0.13, '#3a8a3a', 9);
        gg.fillStyle = '#2a6a2a'; gg.fillRect(0, 204, W, 20); for (let x = 0; x < W; x += 3) { gg.fillStyle = '#4aa040'; gg.fillRect(x, 203 - (hash(x, 5, 3) * 4 | 0), 1, 5); }
        LOGO = logoText('ZELDO', 46, ['#fff4b0', '#f8e070', '#f8c838', '#e8a020', '#c87818', '#a85a10'], '#2a1004');
        LOGO2 = logoText('THE LEGEND OF', 12, ['#ffffff', '#e0e8ff', '#a8b8e8'], '#101030', 'bold 12px Georgia, "Times New Roman", serif');
      }
      let titleT = 0;
      function updTitle() {
        titleT++;
        if (titleT > 50 && (K.pressed('start') || K.pressed('a'))) { mode = 'files'; files = { row: Math.min(2, store.last | 0), t: 0, erase: false, confirm: -1 }; SND.pick(); song('files'); }
      }
      function drawTitle() {
        titleArt();
        g.drawImage(TBG, 0, 0);
        // drifting clouds (two speeds: parallax)
        for (let i = 0; i < 5; i++) { const sp = i < 2 ? 4 : 9, x = ((titleT / 60 * sp + i * 70) % (W + 80)) - 60, y = 22 + i * 13 + (i % 2) * 6; g.drawImage(CLOUDS[i < 2 ? 0 : 1], Math.round(x), y); }
        // the tri-fork rises over the hills, shining; then the logo drops in under it
        const drop = Math.min(1, titleT / 50), lg = 1 - Math.pow(1 - drop, 3);
        const fy = Math.round(150 - lg * 146);
        g.save(); g.globalAlpha = 0.25 + 0.1 * Math.sin(K.t * 2); g.fillStyle = '#fff8c0'; g.beginPath(); g.arc(128, fy + 22, 26, 0, 7); g.fill(); g.restore();
        g.drawImage(ITEMIMG.trifork, 0, 0, 24, 24, 128 - 24, fy, 48, 48);
        const ly = Math.round(-70 + Math.min(1, Math.max(0, (titleT - 20) / 40)) * 138);
        g.drawImage(LOGO2, 128 - LOGO2.width / 2, ly - 16);
        g.drawImage(LOGO, 128 - LOGO.width / 2, ly);
        // a glint sweeps across now and then
        const sw = (titleT % 240) - 60; if (sw > 0 && sw < 80 && titleT > 60) { const x = 128 - LOGO.width / 2 + sw * (LOGO.width / 80); g.drawImage(ITEMIMG.spark[(titleT >> 2) & 3], Math.round(x), ly + 10 + Math.round(Math.sin(sw / 10) * 6)); }
        // the ribbon
        if (titleT > 40) {
          const ry = ly + LOGO.height - 2, rw = 150;
          g.fillStyle = '#7a1418'; g.fillRect(128 - rw / 2 - 10, ry + 4, 12, 12); g.fillRect(128 + rw / 2 - 2, ry + 4, 12, 12);
          g.fillStyle = '#c8282e'; g.fillRect(128 - rw / 2, ry, rw, 14); g.fillStyle = '#e8484e'; g.fillRect(128 - rw / 2, ry, rw, 2); g.fillStyle = '#8a161a'; g.fillRect(128 - rw / 2, ry + 12, rw, 2);
          F.center(g, 'A LINK TO THE PASTA', 128, ry + 4, '#fff4d0', 1, '#5a0a0c');
        }
        // the attract bit: our hero legs it along the bottom with a meatball bouncing after him
        const ax = ((titleT * 0.9) % (W + 120)) - 40, PF = personFrames('hero', true);
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(ax, 214, 6, 2, 0, 0, 7); g.fill();
        g.drawImage(PF['walk2' + ((titleT >> 3) & 3)], Math.round(ax - 8), 192);
        const bx = ax - 36, by = 200 - Math.abs(Math.sin(titleT * 0.12)) * 14;
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(bx, 214, 5, 2, 0, 0, 7); g.fill(); g.drawImage(SPR.ball[0], Math.round(bx - 7), Math.round(by));
        if (titleT > 60 && (titleT >> 5) & 1) F.center(g, 'PRESS START', 128, 170, '#ffffff', 1, '#3a1a08');
        F.center(g, '(C) 1999 BIG FORK GAMES', 128, 184, '#ffe0b0', 1, '#5a2a10');
      }

      // ============================================================ PICK A FILE (and the Hall of Fame)
      let files = null;
      function updFiles() {
        const Fs = files; Fs.t++;
        if (Fs.confirm >= 0) {
          if (K.pressed('left') || K.pressed('right')) { Fs.yes = !Fs.yes; SND.menu(); }
          if (K.pressed('a')) { if (Fs.yes) { store.slots[Fs.confirm] = null; persist(); SND.boom(); } Fs.confirm = -1; Fs.erase = false; SND.menu(); }
          if (K.pressed('b')) { Fs.confirm = -1; SND.menu(); }
          return;
        }
        if (K.pressed('up')) { Fs.row = (Fs.row + 3) % 4; SND.menu(); } if (K.pressed('down')) { Fs.row = (Fs.row + 1) % 4; SND.menu(); }
        if (K.pressed('b')) { if (Fs.erase) { Fs.erase = false; SND.menu(); } else { mode = 'title'; titleT = 60; song('title'); } return; }
        if (K.pressed('a') || K.pressed('start')) {
          if (Fs.row === 3) { Fs.erase = !Fs.erase; SND.menu(); return; }
          const s = store.slots[Fs.row];
          if (Fs.erase) { if (s) { Fs.confirm = Fs.row; Fs.yes = false; SND.menu(); } return; }
          SND.pick();
          if (s) startFile(Fs.row); else { naming = { slot: Fs.row, name: 'JACK', row: 4, col: 2, t: 0 }; mode = 'name'; }
        }
      }
      function fairy(x, y) { const f = (K.frame >> 2) & 1; g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 5, y - 3 + f, 4, 3); g.fillRect(x + 2, y - 3 + f, 4, 3); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = '#ffe0f0'; g.fillRect(x, y, 1, 1); }
      function bgPattern() {
        g.fillStyle = '#0c1030'; g.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 16) for (let x = (y / 16 % 2) * 8; x < W; x += 16) { g.fillStyle = '#121840'; g.fillRect(x, y, 8, 8); }
        for (let i = 0; i < 24; i++) { const x = hash(i, 7, 9) * W | 0, y = hash(i, 8, 9) * H | 0; if ((K.frame + i * 13) % 90 < 45) { g.fillStyle = '#c8d0ff'; g.fillRect(x, y, 1, 1); } }
      }
      function drawFiles() {
        const Fs = files; bgPattern();
        frameBox(16, 6, 224, 140, '#101838');
        F.center(g, Fs.erase ? 'WHICH FILE SHALL I ERASE?' : 'PICK A FILE', 128, 13, Fs.erase ? '#ff8a8a' : '#f8d048', 1, '#000');
        for (let i = 0; i < 3; i++) {
          const s = store.slots[i], y = 26 + i * 32, on = Fs.row === i;
          g.fillStyle = on ? '#22306a' : '#141c48'; g.fillRect(26, y, 204, 28); g.fillStyle = on ? '#3a4a9a' : '#1c2858'; g.fillRect(26, y, 204, 1);
          F.draw(g, String(i + 1), 34, y + 10, '#f8d048', 1, '#000');
          if (s) {
            g.drawImage(personFrames('hero', !!s.shield)['walk00'], 44, y + 2);
            F.draw(g, s.name, 64, y + 5, '#ffffff', 1, '#000');
            for (let h = 0; h < s.maxH; h++) { const v = s.hp >= (h + 1) * 2 ? 2 : s.hp === h * 2 + 1 ? 1 : 0; g.drawImage(HEARTI[v], 64 + h * 9, y + 16); }
            F.draw(g, clock(s.time), 196, y + 5, '#c8d0f0', 1);
            if (s.f && s.f.baron) g.drawImage(ITEMIMG.trifork, 0, 0, 24, 24, 204, y + 14, 12, 12);
          } else F.draw(g, '- NEW FILE -', 64, y + 10, '#6a74b0', 1);
          if (on) fairy(22, y + 13);
        }
        const ey = 126; F.draw(g, Fs.erase ? 'CANCEL' : 'ERASE A FILE', 44, ey, Fs.row === 3 ? '#ffffff' : '#8a90c0', 1, '#000'); if (Fs.row === 3) fairy(34, ey + 3);
        // the Hall of Fame: Jack's mates' best scores (yours goes in when you beat the Baron)
        frameBox(16, 150, 224, 68, '#101838');
        F.center(g, 'HALL OF FAME', 128, 156, '#f8d048', 1, '#000');
        store.hof.slice(0, 8).forEach((h, i) => { const x = i < 4 ? 26 : 134, y = 168 + (i % 4) * 11; F.draw(g, (i + 1) + '.' + h.n.slice(0, 8), x, y, i === 0 ? '#f8d048' : '#ffffff', 1, '#000'); F.draw(g, String(h.s).padStart(5, ' '), x + 72, y, '#a8f8b0', 1); });
        if (Fs.confirm >= 0) {
          frameBox(40, 70, 176, 50, '#3a1010');
          F.center(g, 'ERASE ' + store.slots[Fs.confirm].name + '?', 128, 80, '#ffffff', 1, '#000');
          F.center(g, "IT'LL BE GONE FOR EVER!", 128, 92, '#ffb0b0', 1);
          F.draw(g, 'YES', 96, 106, Fs.yes ? '#f8d048' : '#8a90c0', 1); F.draw(g, 'NO', 144, 106, !Fs.yes ? '#f8d048' : '#8a90c0', 1); fairy(Fs.yes ? 88 : 136, 109);
        }
      }
      // ---- typing a name
      let naming = null;
      const GRID = ['ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ-!?.', '0123456789'];
      function updName() {
        const N = naming; N.t++;
        const rows = 5, cols = N.row === 4 ? 3 : 10;
        if (K.pressed('up')) { N.row = (N.row + rows - 1) % rows; N.col = Math.min(N.col, N.row === 4 ? 2 : 9); SND.menu(); }
        if (K.pressed('down')) { N.row = (N.row + 1) % rows; N.col = Math.min(N.col, N.row === 4 ? 2 : 9); SND.menu(); }
        if (K.pressed('left')) { N.col = (N.col + cols - 1) % cols; SND.menu(); } if (K.pressed('right')) { N.col = (N.col + 1) % cols; SND.menu(); }
        if (K.pressed('b')) { if (N.name.length) { N.name = N.name.slice(0, -1); SND.menu(); } else { mode = 'files'; } return; }
        const end = () => { const nm = N.name.trim() || 'JACK'; store.slots[N.slot] = freshSave(nm); persist(); SND.save(); startFile(N.slot); };
        if (K.pressed('start')) { end(); return; }
        if (K.pressed('a')) {
          if (N.row < 4) { if (N.name.length < 8) { N.name += GRID[N.row][N.col]; SND.blip(); } }
          else if (N.col === 0) { if (N.name.length < 8) N.name += ' '; }
          else if (N.col === 1) N.name = N.name.slice(0, -1);
          else end();
        }
      }
      function drawName() {
        const N = naming; bgPattern();
        frameBox(16, 10, 224, 200, '#101838');
        F.center(g, "WHAT'S YOUR NAME?", 128, 20, '#f8d048', 1, '#000');
        g.drawImage(personFrames('hero', false)['walk0' + ((N.t >> 4) & 1 ? 1 : 0)], 64, 34);
        for (let i = 0; i < 8; i++) { const c = N.name[i] || ''; F.draw(g, c, 92 + i * 12, 44, '#ffffff', 2 > 1 ? 1 : 1, '#000'); g.fillStyle = i === N.name.length && (N.t >> 4) & 1 ? '#f8d048' : '#5a6090'; g.fillRect(91 + i * 12, 54, 8, 1); }
        GRID.forEach((r, y) => [...r].forEach((ch, x) => { const on = N.row === y && N.col === x; if (on) { g.fillStyle = '#3a4a9a'; g.fillRect(36 + x * 19, 76 + y * 20, 15, 15); } F.draw(g, ch, 40 + x * 19, 80 + y * 20, on ? '#f8d048' : '#ffffff', 1, '#000'); }));
        ['SPACE', 'DEL', 'END'].forEach((o, i) => { const on = N.row === 4 && N.col === i, x = 48 + i * 60; if (on) { g.fillStyle = '#3a4a9a'; g.fillRect(x - 4, 156, F.width(o) + 8, 15); } F.draw(g, o, x, 160, on ? '#f8d048' : '#ffffff', 1, '#000'); });
        F.center(g, `${LB('a')}: TYPE   ${LB('b')}: RUB OUT   START: DONE`, 128, 190, '#8a90c0', 1);
      }
      function startFile(i) {
        slot = i; S = store.slots[i]; store.last = i;
        for (const k of ['f', 'opened', 'doors', 'cleared', 'seen', 'gone', 'got']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};
        if (!ROOMS[S.room]) { S.room = 'h_home'; S.x = 136; S.y = 124; }
        S.hp = clamp(S.hp | 0, 1, S.maxH * 2);
        pl = newPlayer(S.x, S.y, S.dir | 0); lastRep = { t: K.t, sc: 0 }; lastRep.sc = 0;
        if (!S.intro) { mode = 'intro'; intro = { page: 0, t: 0 }; song('title'); openBox({ text: INTRO[0][1] }); }
        else beginPlay();
      }
      function beginPlay() { lastName = ''; enterRoom(makeRoom(S.room), S.x, S.y, S.dir | 0); mode = 'play'; fade = 1; }

      // ============================================================ THE STORY SO FAR
      let intro = null;
      const INTRO = [
        ['castle', 'Long ago, in the kingdom of LASAGNIA, the kind PRINCESS ZELDO guarded the greatest treasure in the land...'],
        ['recipe', '...the SECRET RECIPE for the perfect pasta sauce, kept safe under the golden TRI-FORK.'],
        ['baron', 'But one stormy night, greedy BARON MEATBALLO crept in and NICKED it! He didn\'t even do the washing up.'],
        ['house', `Now tea-time itself is in danger. Only one hero can save it... and he's still in bed.`],
      ];
      function updIntro() {
        intro.t++;
        if (K.pressed('start')) { tb = null; S.intro = 1; save0(); beginPlay(); wakeUp(); return; }
        if (tb) { updateBoxIntro(); return; }
        intro.page++; intro.t = 0;
        if (intro.page >= INTRO.length) { S.intro = 1; save0(); beginPlay(); wakeUp(); return; }
        openBox({ text: INTRO[intro.page][1] });
      }
      function save0() { store.slots[slot] = S; persist(); }
      function updateBoxIntro() { // the same box, but no script behind it
        const page = tb.pages[tb.p], total = page.join('').length;
        if (tb.n < total) { tb.n += K.held('a') ? 2.5 : 0.8; if ((tb.n | 0) % 3 === 0) SND.blip(); if (K.pressed('a') && tb.n > 4) tb.n = total; return; }
        if (K.pressed('a')) { if (tb.p < tb.pages.length - 1) { tb.p++; tb.n = 0; } else tb = null; SND.menu(); }
      }
      function wakeUp() { run(function* () { yield 40; yield say(`MOM: ${NN()}! ${NN()}! WAKE UP! Come here, quick! Something TERRIBLE has happened!`); }()); }
      function drawIntro() {
        const sc = INTRO[Math.min(intro.page, INTRO.length - 1)][0], t = K.t;
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        g.save(); g.beginPath(); g.rect(16, 16, 224, 128); g.clip();
        if (sc === 'castle' || sc === 'recipe') { const gr = g.createLinearGradient(0, 16, 0, 144); gr.addColorStop(0, '#2a2a7a'); gr.addColorStop(1, '#e8907a'); g.fillStyle = gr; g.fillRect(16, 16, 224, 128); }
        else if (sc === 'baron') { g.fillStyle = (intro.t % 90) < 4 ? '#c8c8ff' : '#10102a'; g.fillRect(16, 16, 224, 128); for (let i = 0; i < 30; i++) { const x = 16 + ((hash(i, 1, 3) * 224 + intro.t * 3) % 224), y = 16 + ((hash(i, 2, 3) * 128 + intro.t * 6) % 128); g.fillStyle = '#5a6aa8'; g.fillRect(x | 0, y | 0, 1, 4); } }
        else { g.fillStyle = '#0a1030'; g.fillRect(16, 16, 224, 128); for (let i = 0; i < 30; i++) { g.fillStyle = '#c8d0ff'; g.fillRect(16 + hash(i, 3, 5) * 224 | 0, 16 + hash(i, 4, 5) * 60 | 0, 1, 1); } E(g, 200, 40, 10, 10, '#f8f0c0'); E(g, 205, 37, 9, 9, '#0a1030'); }
        if (sc === 'castle') {
          for (let i = 0; i < 20; i++) { g.fillStyle = '#e8e0ff'; g.fillRect(16 + hash(i, 5, 5) * 224 | 0, 18 + hash(i, 6, 5) * 40 | 0, 1, 1); }
          g.fillStyle = '#5a4a8a'; g.beginPath(); g.moveTo(16, 144); for (let x = 16; x <= 240; x += 4) g.lineTo(x, 118 - Math.sin(x * 0.03) * 10); g.lineTo(240, 144); g.fill();
          g.drawImage(castleArt(), 40, -4);
          g.fillStyle = '#2a6a3a'; g.fillRect(16, 134, 224, 10); g.fillStyle = '#3a8a4a'; g.fillRect(16, 134, 224, 2);
          g.drawImage(personFrames('zeldo')['walk0' + ((intro.t >> 5) & 1 ? 0 : 0)], 120, 112);
        } else if (sc === 'recipe') {
          g.fillStyle = '#5a4a7a'; g.fillRect(100, 104, 56, 40); g.fillStyle = '#7a6a9a'; g.fillRect(96, 100, 64, 8);
          const gl = 0.3 + Math.sin(t * 3) * 0.1; g.fillStyle = `rgba(255,240,160,${gl})`; g.beginPath(); g.arc(128, 70, 40, 0, 7); g.fill();
          g.drawImage(ITEMIMG.trifork, 0, 0, 24, 24, 104, 26, 48, 48); g.drawImage(ITEMIMG.recipe, 0, 0, 16, 16, 112, 76, 32, 32);
          for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; g.drawImage(ITEMIMG.spark[(K.frame >> 3) & 3], 124 + Math.cos(a) * 34, 66 + Math.sin(a) * 22); }
        } else if (sc === 'baron') {
          const flash = intro.t % 90 < 4;
          if (!DARKC) { DARKC = tint(castleArt(), '#161630', 0.78); BARONK = tint(SPR.baron[3], '#1a0a10', 0.45); }
          g.drawImage(flash ? castleArt() : DARKC, 40, -4);
          g.fillStyle = flash ? '#3a6a4a' : '#0e1a14'; g.fillRect(16, 134, 224, 10);
          const x = Math.min(200, 112 + intro.t * 0.45), hop = Math.abs(Math.sin(intro.t * 0.15)) * 6;
          g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(x, 136, 18, 4, 0, 0, 7); g.fill();
          g.drawImage(BARONK, Math.round(x - 24), Math.round(90 - hop)); g.drawImage(ITEMIMG.recipe, Math.round(x + 10), Math.round(82 - hop));
          if (flash) { g.fillStyle = '#ffffff'; g.fillRect(200, 16, 3, 30); g.fillRect(196, 46, 3, 20); g.fillRect(199, 66, 3, 14); }
        } else {
          g.drawImage(houseArt(5, 4, 'red', 2, F), 88, 80); g.fillStyle = '#f8e080'; g.fillRect(110, 124, 9, 7);
          F.draw(g, 'Z', 132, 70 - (intro.t % 60) / 6, '#ffffff', 1); F.draw(g, 'Z', 140, 60 - (intro.t % 60) / 5, '#c8d0ff', 1); g.fillStyle = '#1a4a2a'; g.fillRect(16, 140, 224, 4);
        }
        g.restore();
        g.strokeStyle = '#c8a040'; g.lineWidth = 2; g.strokeRect(15, 15, 226, 130);
        drawBox();
        F.center(g, 'START: SKIP', 128, 150, '#5a6090', 1);
      }

      // ============================================================ FAINTING, and carrying on
      let over = null;
      function updDying() {
        dyingT++;
        if (dyingT < 60) { pl.dir = [0, 2, 1, 3][(dyingT >> 2) & 3]; }
        if (dyingT === 110) { mode = 'gameover'; over = { sel: 0, t: 0 }; song(null); }
      }
      function updGameOver() {
        over.t++;
        if (K.pressed('up') || K.pressed('down')) { over.sel = 1 - over.sel; SND.menu(); }
        if (over.t > 30 && (K.pressed('a') || K.pressed('start'))) {
          SND.pick();
          if (over.sel === 0) respawn();
          else { S.hp = S.maxH * 2; const inDg = room.kind === 'dg'; S.room = inDg ? 'd1' : 'h_home'; S.x = inDg ? 128 : 104; S.y = inDg ? 172 : 136; S.dir = inDg ? 1 : 0; store.slots[slot] = S; persist(); mode = 'done'; finalScore(S.score | 0, 'YOU FAINTED!', `${NN()} had a little lie down. The file is saved: pick it again to carry on.`); }
        }
      }
      function drawGameOver() {
        const k = Math.min(1, over.t / 30);
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        g.fillStyle = `rgba(90,0,10,${0.6 * k})`; g.fillRect(0, 0, W, H);
        const PF = personFrames('hero', !!S.shield); g.save(); g.translate(128, 100); g.rotate(-Math.PI / 2); g.drawImage(PF['get00'], -12, -8); g.restore();
        for (let i = 0; i < 3; i++) { const a = K.t * 4 + i * 2.1; g.drawImage(ITEMIMG.star, Math.round(118 + Math.cos(a) * 12), Math.round(88 + Math.sin(a) * 4)); }
        g.globalAlpha = k; F.center(g, 'YOU FAINTED!', 128, 46, '#ff8a8a', 2, '#000');
        F.center(g, 'HAVE A LITTLE SIT DOWN...', 128, 66, '#ffffff', 1);
        ['CARRY ON', 'SAVE & QUIT'].forEach((o, i) => { F.center(g, o, 128, 140 + i * 16, over.sel === i ? '#f8d048' : '#8a90c0', 1, '#000'); if (over.sel === i) fairy(128 - F.width(o) / 2 - 10, 143 + i * 16); });
        g.globalAlpha = 1;
      }

      // ============================================================ THE END: the feast, the credits, the Hall of Fame
      let ending = null;
      function startEnding() {
        K.secret('lk.zeldo.boss');
        S.done = 1;
        const mins = Math.floor(S.time / 60);
        ending = { t: 0, phase: 0, page: 0, bonusT: Math.max(0, 4000 - mins * 100), bonusH: S.maxH * 100, fw: [] };
        ending.total = Math.min(99999, (S.score | 0) + ending.bonusT + ending.bonusH);
        // after the credits you carry on from the village, everything kept
        S.room = 'village'; S.x = 120; S.y = 92; S.dir = 0; store.slots[slot] = S;
        const me = { n: (S.name || 'JACK').slice(0, 8), s: ending.total, me: 1 };
        store.hof = store.hof.filter(h => !h.me || h.n !== me.n).concat([me]).sort((a, b) => b.s - a.s).slice(0, 8);
        ending.rank = store.hof.indexOf(me) + 1;
        persist();
        trans = { warp: null, t: 0, n: 40, phase: 0 }; mode = 'ending'; song(null);
      }
      const FEAST = ['zeldo', 'mom', 'elder', 'mabel', 'nonna', 'dave', 'luke', 'cal', 'fisher', 'lady'];
      const CREDITS = () => ['THE LEGEND OF ZELDO', 'A LINK TO THE PASTA', '', '- STARRING -', NN(), '', 'PRINCESS ZELDO', 'MOM', 'ELDER PARMESAN', 'MABEL (OF MABEL\'S)', 'NONNA ROSA', 'DAVE (STILL ON THE LAST BOSS)', 'LUKE', 'CAL (PC STILL BROKEN)', 'OLD SALTY', 'MRS PENNE AND HER HENS', '',
        '- THE BADDIES -', 'BARON MEATBALLO', 'THE BIG CHEESE', 'THE FORK KNIGHTS', 'THE GLOOPS', 'THE PEA POD SNAPPERS', 'GHOULASH THE GHOST', '', 'NO BADDIES WERE HURT IN THE', 'MAKING OF THIS GAME.', 'THEY ALL JUST WENT POOF.', '', '- BIG FORK GAMES 1999 -', '', 'THANKS FOR PLAYING!'];
      function updEnding() {
        const E2 = ending; E2.t++;
        if (E2.phase === 0) { if (E2.t === 40) { song('ending'); E2.phase = 1; E2.t = 0; openBox({ text: `PRINCESS ZELDO: ${NN()}! You got my recipe back! The whole kingdom is SO proud of you. Even the hens.` }); } return; }
        if (E2.phase === 1) {
          if (E2.t % 50 === 0) E2.fw.push({ x: 30 + rnd() * 196, y: 20 + rnd() * 50, t: 0, c: ['#f8d048', '#ff6a8a', '#6af0ff', '#a8ff6a'][rnd() * 4 | 0] });
          E2.fw = E2.fw.filter(f => ++f.t < 50);
          if (tb) { updateBoxIntro(); return; }
          E2.page++;
          const lines = [`MOM: That's my ${NN()}! Did you wipe your feet?`, 'DAVE: I could have done it quicker. Probably. Maybe.', `PRINCESS ZELDO: Tonight, EVERYONE eats spaghetti! Three cheers for ${NN()}!`];
          if (E2.page <= lines.length) openBox({ text: lines[E2.page - 1] });
          else { E2.phase = 2; E2.t = 0; }
          return;
        }
        if (E2.phase === 2) { if (E2.t > 60 * 22 || (E2.t > 120 && K.pressed('start'))) { E2.phase = 3; E2.t = 0; } return; }
        if (E2.phase === 3) {
          if (E2.t > 90 && (K.pressed('start') || K.pressed('a'))) {
            const wait = Math.max(64, E2.total / 45 + 8) - (K.t - lastRep.t);
            if (wait > 0 && !E2.waited) { E2.waitT = wait; E2.waited = true; return; }
            mode = 'done'; finalScore(E2.total, 'TEA-TIME IS SAVED!', `${NN()} beat Baron Meatballo in ${clock(S.time)} and got the recipe back. You're #${E2.rank} in the Hall of Fame!`);
          }
          if (E2.waited && E2.waitT > 0) { E2.waitT -= 1 / 60; if (E2.waitT <= 0) { mode = 'done'; finalScore(E2.total, 'TEA-TIME IS SAVED!', `${NN()} beat Baron Meatballo in ${clock(S.time)} and got the recipe back. You're #${E2.rank} in the Hall of Fame!`); } }
        }
      }
      function drawEnding() {
        const E2 = ending;
        if (E2.phase === 0) { drawPlayFrame(); g.fillStyle = `rgba(255,255,255,${Math.min(1, E2.t / 40)})`; g.fillRect(0, 0, W, H); return; }
        if (E2.phase === 1) {
          // the feast: evening sky, fireworks, bunting, a long table of spaghetti, and everybody
          const gr = g.createLinearGradient(0, 0, 0, 140); gr.addColorStop(0, '#141a4a'); gr.addColorStop(1, '#d8705a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
          for (const f of E2.fw) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28, r = f.t * 0.8; g.fillStyle = f.c; g.globalAlpha = 1 - f.t / 50; g.fillRect(Math.round(f.x + Math.cos(a) * r), Math.round(f.y + Math.sin(a) * r + f.t * 0.1), 2, 2); } g.globalAlpha = 1;
          g.drawImage(castleArt(), 40, -8);
          g.fillStyle = '#3a8a3a'; g.fillRect(0, 128, W, 96); DITH(g, 0, 128, W, 2, '#2a6a2a');
          for (let x = 0; x < W; x += 12) { g.fillStyle = ['#e83a3a', '#f8d048', '#3a8ae8', '#3ab84a'][(x / 12) % 4]; g.beginPath(); g.moveTo(x, 104); g.lineTo(x + 10, 104); g.lineTo(x + 5, 112 + Math.sin(K.t * 3 + x) * 1); g.fill(); } g.fillStyle = '#5a3a1a'; g.fillRect(0, 103, W, 1);
          F.center(g, `HOORAY FOR ${NN()}!`, 128, 88, '#fff8c0', 1, '#5a1a10');
          // the people, behind the table
          FEAST.forEach((n, i) => { const x = 20 + i * 22 + (i >= 5 ? 6 : 0), hop = Math.abs(Math.sin(K.t * 4 + i)) * ((E2.t + i * 20) % 120 < 30 ? 3 : 0); g.drawImage(personFrames(n)['walk00'], x - 8, 126 - hop); });
          g.drawImage(personFrames('hero', true)['get00'], 120 - 8, 124); g.drawImage(ITEMIMG.recipe, 112, 106);
          // the table, with spaghetti all the way along it
          g.fillStyle = '#7a4420'; g.fillRect(8, 150, 240, 20); g.fillStyle = '#f8f0e0'; g.fillRect(6, 142, 244, 12); g.fillStyle = '#e83a3a'; for (let x = 6; x < 250; x += 8) g.fillRect(x, 152, 4, 3);
          for (let x = 18; x < 240; x += 22) { E(g, x, 145, 7, 3, '#ffffff'); E(g, x, 143, 5, 2.4, '#f0c060'); E(g, x, 142, 3, 1.4, '#e83a20'); }
          for (let i = 0; i < 4; i++) g.drawImage(SPR.hen[(K.frame >> 4) % 2 + (i % 2) * 3], 30 + i * 60, 196);
          drawBox(); return;
        }
        if (E2.phase === 2) { // the credits roll up over a starry dusk with hills in front (parallax)
          const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0a0c28'); gr.addColorStop(1, '#3a2a5a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
          for (let i = 0; i < 50; i++) { g.fillStyle = i % 7 ? '#8a90c8' : '#ffffff'; g.fillRect(hash(i, 1, 21) * W | 0, hash(i, 2, 21) * 150 | 0, 1, 1); }
          const hill = (base, amp, sp, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 4) g.lineTo(x, base - Math.sin((x + E2.t * sp) * 0.03) * amp); g.lineTo(W, H); g.fill(); };
          hill(180, 12, 0.2, '#2a2a5a'); hill(198, 8, 0.5, '#1a3a3a');
          const L = CREDITS(), y0 = H - 30 - E2.t * 0.42; g.save(); g.beginPath(); g.rect(0, 0, W, 176); g.clip();
          L.forEach((s, i) => { const y = y0 + i * 14; if (y > -10 && y < H) F.center(g, s, 128, Math.round(y), i < 2 ? '#f8d048' : s.startsWith('-') ? '#ff9a8a' : '#ffffff', 1, '#000'); });
          g.restore();
          const ax = (E2.t * 0.6) % (W + 60) - 30; g.drawImage(personFrames('hero', true)['walk2' + ((E2.t >> 3) & 3)], Math.round(ax - 8), 194);
          g.drawImage(personFrames('zeldo')['walk2' + ((E2.t >> 3) & 3)], Math.round(ax - 30), 194);
          return;
        }
        // phase 3: the scores
        bgPattern();
        frameBox(16, 8, 224, 208, '#101838');
        F.center(g, 'THE END', 128, 16, '#f8d048', 2, '#000');
        const rows = [['PROGRESS POINTS', S.score | 0], ['TIME BONUS (' + clock(S.time) + ')', E2.bonusT], ['HEART BONUS (' + S.maxH + ' HEARTS)', E2.bonusH], ['TOTAL', E2.total]];
        rows.forEach(([a, b], i) => { F.draw(g, a, 28, 44 + i * 12, i === 3 ? '#f8d048' : '#ffffff', 1, '#000'); F.draw(g, String(b).padStart(5, ' '), 196, 44 + i * 12, i === 3 ? '#f8d048' : '#a8f8b0', 1); });
        F.draw(g, 'FAINTED: ' + (S.deaths ? S.deaths + (S.deaths === 1 ? ' TIME' : ' TIMES') : 'NEVER!'), 28, 96, '#c8d0f0', 1);
        F.center(g, 'HALL OF FAME', 128, 114, '#f8d048', 1, '#000');
        store.hof.slice(0, 8).forEach((h, i) => { const y = 126 + i * 10, me = h.me && i === E2.rank - 1; if (me && (K.frame >> 3) & 1) { g.fillStyle = '#2a3a8a'; g.fillRect(56, y - 2, 144, 10); } F.draw(g, (i + 1) + '. ' + h.n, 64, y, me ? '#f8d048' : '#ffffff', 1, '#000'); F.draw(g, String(h.s).padStart(5, ' '), 160, y, '#a8f8b0', 1); });
        if (E2.waited && E2.waitT > 0) F.center(g, 'SENDING YOUR SCORE TO JACKNET...', 128, 206, '#8a90c0', 1);
        else if (E2.t > 90 && (E2.t >> 5) & 1) F.center(g, 'PRESS START', 128, 206, '#ffffff', 1);
      }

      // ============================================================ the run-time: one step, one picture
      function updScroll() {
        trans.t++; pl.anim++; pl.moving = true;
        if (trans.t >= trans.n) { const T2 = trans; trans = null; mode = 'play'; enterRoom(T2.to, T2.x1, T2.y1, pl.dir); }
      }
      function updFade() {
        trans.t++;
        if (trans.phase === 0 && trans.t >= trans.n) { const [id, tx, ty, dir] = trans.warp; enterRoom(makeRoom(id), tx * 16 + 8, ty * 16 + 12, dir); trans.phase = 1; trans.t = 0; }
        else if (trans.phase === 1 && trans.t >= trans.n) { trans = null; mode = 'play'; }
      }
      function drawPlayFrame() {
        const sx = shake ? Math.round((rnd() - 0.5) * shake) : 0, sy = shake ? Math.round((rnd() - 0.5) * shake) : 0;
        g.fillStyle = '#000'; g.fillRect(0, TOP, W, RH);
        g.save(); g.beginPath(); g.rect(0, TOP, W, RH); g.clip();
        drawRoom(room, sx, TOP + sy, true); atmos(room, sx, TOP + sy);
        if (flashT) { g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, TOP, W, RH); }
        g.restore();
        drawHUD(); drawBanner(); drawToast();
      }
      function drawScroll() {
        const T2 = trans, k0 = T2.t / T2.n, k = k0 < 0.5 ? 2 * k0 * k0 : 1 - Math.pow(-2 * k0 + 2, 2) / 2;
        const ox = -T2.dx * RW * k, oy = -T2.dy * RH * k;
        g.fillStyle = '#000'; g.fillRect(0, TOP, W, RH);
        g.save(); g.beginPath(); g.rect(0, TOP, W, RH); g.clip();
        g.drawImage(T2.from.fr[0], Math.round(ox), Math.round(TOP + oy)); g.drawImage(T2.to.fr[0], Math.round(ox + T2.dx * RW), Math.round(TOP + oy + T2.dy * RH));
        const px = lerp(T2.x0, T2.x1 + T2.dx * RW, k0) + ox, py = lerp(T2.y0, T2.y1 + T2.dy * RH, k0) + oy;
        const keep = { x: pl.x, y: pl.y }; pl.x = px; pl.y = py + TOP;
        shadow(pl.x, pl.y, 6); drawHero(); pl.x = keep.x; pl.y = keep.y;
        if (T2.from.def.dark || T2.to.def.dark) { g.fillStyle = 'rgba(4,2,10,.6)'; g.fillRect(0, TOP, W, RH); }
        g.restore();
        drawHUD();
      }
      function update() {
        switch (mode) {
          case 'title': updTitle(); break;
          case 'files': updFiles(); break;
          case 'name': updName(); break;
          case 'intro': updIntro(); break;
          case 'play': updatePlay(); break;
          case 'scroll': updScroll(); break;
          case 'fade': updFade(); break;
          case 'menu': updMenu(); break;
          case 'map': updMap(); break;
          case 'dying': updDying(); updateFx(); break;
          case 'gameover': updGameOver(); break;
          case 'ending': updEnding(); break;
        }
        if (banner) banner.t++; if (toast && ++toast.t > 150) toast = null;
      }
      function draw() {
        K.hud.clearRect(0, 0, W, H);
        g.imageSmoothingEnabled = false;
        switch (mode) {
          case 'title': drawTitle(); break;
          case 'files': drawFiles(); break;
          case 'name': drawName(); break;
          case 'intro': drawIntro(); break;
          case 'play': case 'dying': drawPlayFrame(); if (mode === 'dying') { g.fillStyle = `rgba(120,0,20,${Math.min(0.7, dyingT / 110)})`; g.fillRect(0, TOP, W, RH); } drawBox(); break;
          case 'scroll': drawScroll(); break;
          case 'fade': drawPlayFrame(); { const a = trans ? (trans.phase === 0 ? trans.t / trans.n : 1 - trans.t / trans.n) : 0; g.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`; g.fillRect(0, TOP, W, RH); } break;
          case 'menu': drawPlayFrame(); drawMenu(); break;
          case 'map': drawPlayFrame(); drawMap(); break;
          case 'gameover': drawGameOver(); break;
          case 'ending': drawEnding(); break;
          case 'done': if (room && S) drawPlayFrame(); else drawTitle(); break;
        }
        if (fade > 0 && (mode === 'play' || mode === 'done')) { g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, TOP, W, RH); fade = Math.max(0, fade - 0.05); }
      }
      song('title');
      // (for testing: RoomTV.dbg().dbg)
      K.dbg = {
        get S() { return S; }, get pl() { return pl; }, get room() { return room; }, get ents() { return ents; }, get mode() { return mode; }, get tb() { return tb; }, get co() { return co; }, get store() { return store; },
        get lastRep() { return lastRep; }, get ending() { return ending; },
        start(i, name) { if (!store.slots[i]) store.slots[i] = freshSave(name || 'JACK'); store.slots[i].intro = 1; startFile(i); },
        warp(id, tx, ty, dir) { co = null; tb = null; coQ.length = 0; enterRoom(makeRoom(id), tx * 16 + 8, ty * 16 + 12, dir || 0); mode = 'play'; },
        give(o) { Object.assign(S, o); }, flag(k, v) { S.f[k] = v; }, makeRoom, ROOMS, report, startEnding, explode, toggleCrystal, hurtPlayer, run, getItem, say,
        bonkAll() { for (const e of ents) if (e.enemy && !e.dead && !(EN[e.type] || {}).boss && e.type !== 'spike') bonk(e); },
        get shots() { return shots; }, tileAt: (x, y) => tileAt(room, x, y), get trans() { return trans; },
        skipText() { if (tb) { tb.p = tb.pages.length - 1; tb.n = 999; } },
      };
      return { update, draw, end() { K.music(null); } };
    },
  });
})();

/* econ-town: JACKTOWN (www.jacktown.jnet), a shared town every JackNet member can build in. Isometric pixel art drawn on
 * canvas (all original), live updates from the server, the Jacktown Gazette, town statistics and the planning guide. */
(function () {
  'use strict';
  const W = window.EconWeb, C = window.EconCat, A = window.Apps; if (!W || W.town) return;
  const { route, member, guestBox, footer, teef, fmt, esc, d99, t99, ago, sfx } = W;
  const H = 'www.jacktown.jnet', U = 'http://' + H, CSS = 'ecw-town';
  const TW = 32, TH = 16, N = C.TOWN.W, NP = C.TOWN.N, RES = C.TOWN.RESERVED;
  const OX = N * TW / 2 + 8, OY = 70; // where tile (0,0) sits in the world picture
  const WW = N * TW + 16, WH = N * TH + 100;
  let T = null; // { plots, stats, hist, ev, treasury }
  Econ.on('ecTown', m => { T = m; });
  Econ.on('ecPlot', m => { if (T) T.plots[m.i] = m.p; });
  Econ.on('ecCell', m => { if (T && T.plots[m.i]) { const p = T.plots[m.i]; p[2] = p[2].slice(0, m.k) + m.b + p[2].slice(m.k + 1); } });
  Econ.on('ecStats', m => { if (T) { T.stats = m.stats; T.ev = m.ev; T.treasury = m.treasury; if (m.stats) { T.hist.push([m.stats.pop, m.stats.hap, m.stats.crime, m.stats.poll, m.stats.sq]); if (T.hist.length > 96) T.hist.shift(); } } });

  // ---------------------------------------------------------------- the map
  const isRoad = v => v >= 2 && v <= 37 && (v - 2) % 5 === 0;
  const plotAt = (x, y) => { const px = Math.floor((x - 3) / 5), py = Math.floor((y - 3) / 5); if (px < 0 || py < 0 || px >= NP || py >= NP) return null; const kx = x - 3 - px * 5, ky = y - 3 - py * 5; if (kx > 3 || ky > 3) return null; return { i: py * NP + px, k: ky * 4 + kx, px, py }; };
  const plotXY = i => ({ x: 3 + (i % NP) * 5, y: 3 + ((i / NP) | 0) * 5 });
  const address = i => `${C.ROADS[(i / NP) | 0]} / ${C.AVES[i % NP]}`;
  function ground(x, y) {
    if (y <= 1) return 'water';
    if (y >= 38 || x <= 1 || x >= 38) return 'wood';
    if (isRoad(x) || isRoad(y)) return isRoad(x) && isRoad(y) ? 'cross' : isRoad(x) ? 'roadv' : 'roadh';
    return 'grass';
  }
  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const ownerCol = s => `hsl(${hash(s) % 360},80%,50%)`;
  const noise = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

  // ---------------------------------------------------------------- drawing kit (plain shapes, chunky outlines)
  function poly(g, pts, fill, stroke) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); } }
  function diamond(g, cx, cy, f, fill, stroke, lift) { const w = TW / 2 * f, h = TH / 2 * f, l = lift || 0; poly(g, [[cx, cy - h - l], [cx + w, cy - l], [cx, cy + h - l], [cx - w, cy - l]], fill, stroke); }
  function box(g, cx, cy, f, hgt, top, left, right, lift) {
    const w = TW / 2 * f, h = TH / 2 * f, l = lift || 0;
    poly(g, [[cx - w, cy - l], [cx, cy + h - l], [cx, cy + h - l - hgt], [cx - w, cy - l - hgt]], left, '#000');
    poly(g, [[cx, cy + h - l], [cx + w, cy - l], [cx + w, cy - l - hgt], [cx, cy + h - l - hgt]], right, '#000');
    poly(g, [[cx, cy - h - l - hgt], [cx + w, cy - l - hgt], [cx, cy + h - l - hgt], [cx - w, cy - l - hgt]], top, '#000');
  }
  function gable(g, cx, cy, f, hgt, rh, c1, c2, wall) { // a pitched roof (ridge running left-back to right-front) on a box of height hgt
    const w = TW / 2 * f, h = TH / 2 * f, b = cy - hgt, L = [cx - w, b], Bc = [cx, b + h], R = [cx + w, b], Tc = [cx, b - h];
    const r1 = [cx - w / 2, b - h / 2 - rh], r2 = [cx + w / 2, b + h / 2 - rh];
    poly(g, [Tc, R, r2, r1], c2, '#000'); poly(g, [L, Bc, r2, r1], c1, '#000'); poly(g, [Bc, R, r2], wall || '#c8b890', '#000');
  }
  function pyramid(g, cx, cy, f, hgt, rh, c1, c2) { const w = TW / 2 * f, h = TH / 2 * f, b = cy - hgt; poly(g, [[cx - w, b], [cx, b + h], [cx, b - rh]], c1, '#000'); poly(g, [[cx, b + h], [cx + w, b], [cx, b - rh]], c2, '#000'); }
  const px = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  function tree(g, cx, cy, s, col) { px(g, cx - 1, cy - 8 * s, 2, 8 * s, '#6a3a1a'); g.beginPath(); g.arc(cx, cy - 10 * s, 6 * s, 0, 7); g.fillStyle = col || '#2a8a2a'; g.fill(); g.strokeStyle = '#0a3a0a'; g.stroke(); px(g, cx - 3 * s, cy - 13 * s, 2, 2, '#5ac05a'); }
  function sq(g, x, y, c) { g.beginPath(); g.ellipse(x, y, 3, 2.4, 0, 0, 7); g.fillStyle = c || '#e10600'; g.fill(); g.strokeStyle = '#000'; g.stroke(); px(g, x - 2, y - 1, 1, 1, '#ff0'); px(g, x + 1, y - 1, 1, 1, '#ff0'); px(g, x - 1, y + 1, 3, 1, '#fff'); }

  function drawGround(g, x, y) {
    const sx = OX + (x - y) * TW / 2, sy = OY + (x + y) * TH / 2, cy = sy + TH / 2, t = ground(x, y), n = noise(x, y);
    const fill = t === 'water' ? ((x + y) % 2 ? '#2a6ad8' : '#2a62c8') : t === 'wood' ? '#3a7a22' : t === 'grass' ? ((x + y) % 2 ? '#5aa02a' : '#62a832') : '#7a7a7a';
    poly(g, [[sx, sy], [sx + TW / 2, cy], [sx, sy + TH], [sx - TW / 2, cy]], fill, t === 'grass' ? null : null);
    if (t === 'water') { if (n % 3 === 0) px(g, sx - 4 + n % 7, cy - 1, 4, 1, '#8ab8ff'); }
    else if (t.startsWith('road') || t === 'cross') {
      g.strokeStyle = '#555'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + TW / 2, cy); g.lineTo(sx, sy + TH); g.lineTo(sx - TW / 2, cy); g.closePath(); g.stroke();
      if (t === 'roadh') { g.strokeStyle = '#e8e080'; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(sx - TW / 4, cy - TH / 4); g.lineTo(sx + TW / 4, cy + TH / 4); g.stroke(); g.setLineDash([]); }
      if (t === 'roadv') { g.strokeStyle = '#e8e080'; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(sx + TW / 4, cy - TH / 4); g.lineTo(sx - TW / 4, cy + TH / 4); g.stroke(); g.setLineDash([]); }
    } else if (t === 'grass' && n % 5 === 0) px(g, sx - 6 + n % 11, cy - 2 + n % 4, 1, 2, '#3a8a1a');
  }
  // one building on one tile, centre (cx, cy) at the middle of the tile's diamond
  function drawB(g, b, cx, cy, seed) {
    switch (b) {
      case 'r': diamond(g, cx, cy, 0.95, '#b8a070', '#8a7040'); for (let i = 0; i < 4; i++) px(g, cx - 6 + i * 4, cy - 1 + (i % 2) * 2, 2, 1, '#8a7040'); break;
      case 't': tree(g, cx - 4, cy + 1, 0.9, '#2a8a2a'); tree(g, cx + 5, cy - 1, 0.7, '#3a9a2a'); break;
      case 'f': for (let i = 0; i < 9; i++) { const a = (seed * 7 + i * 37) % 360, r = 2 + (i * 5 + seed) % 8; px(g, cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 0.5, 2, 2, ['#ff3a6a', '#ffd400', '#fff', '#c040ff'][i % 4]); } break;
      case 'p': diamond(g, cx, cy, 0.75, '#3a8ae8', '#1a4a9a'); px(g, cx - 4, cy - 1, 5, 1, '#a8d8ff'); px(g, cx + 3, cy + 1, 2, 2, '#2a9a2a'); break;
      case 'F': box(g, cx, cy, 0.7, 3, '#c8c8c8', '#9a9a9a', '#b0b0b0'); diamond(g, cx, cy, 0.5, '#4a9ae8', null, 3); px(g, cx - 1, cy - 14, 2, 11, '#d8f0ff'); px(g, cx - 4, cy - 12, 8, 2, '#a8d8ff'); break;
      case 'h': box(g, cx, cy, 0.62, 9, '#e8d8b0', '#e8d8b0', '#c8b890'); gable(g, cx, cy, 0.62, 9, 6, '#c02a1a', '#901a0a'); px(g, cx + 3, cy - 2, 2, 4, '#5a2a0a'); px(g, cx - 5, cy - 4, 2, 2, '#9fd0ff'); break;
      case 'a': box(g, cx, cy, 0.72, 30, '#9a9aa8', '#b8b8c0', '#8a8a98'); for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) { px(g, cx - 9 + k * 4, cy - 26 + r * 6 + k * 2, 2, 3, (r + k + seed) % 3 ? '#ffe880' : '#2a3a5a'); px(g, cx + 3 + k * 4, cy - 23 + r * 6 - k * 2, 2, 3, (r + k + seed) % 4 ? '#ffe880' : '#2a3a5a'); } break;
      case 'o': box(g, cx, cy, 0.6, 8, '#8a6a3a', '#8a6a3a', '#6a4a2a'); pyramid(g, cx, cy, 0.66, 8, 7, '#6a7a6a', '#4a5a4a'); px(g, cx + 5, cy - 22, 1, 10, '#333'); poly(g, [[cx + 6, cy - 22], [cx + 12, cy - 20], [cx + 6, cy - 18]], '#e10600'); break;
      case 's': box(g, cx, cy, 0.62, 11, '#f0e8d8', '#f0e8d8', '#d0c8b8'); for (let i = 0; i < 4; i++) poly(g, [[cx - 10 + i * 2.5, cy - 7 + i * 1.25], [cx - 7.5 + i * 2.5, cy - 5.75 + i * 1.25], [cx - 7.5 + i * 2.5, cy - 3 + i * 1.25], [cx - 10 + i * 2.5, cy - 4.25 + i * 1.25]], i % 2 ? '#fff' : '#e10600'); diamond(g, cx, cy, 0.62, '#9a2a1a', '#000', 11); break;
      case 'T': box(g, cx, cy, 0.62, 10, '#fff8e8', '#fff8e8', '#e0d8c0'); for (let i = 0; i < 4; i++) poly(g, [[cx + i * 2.5, cy + 4 - i * 1.25], [cx + 2.5 + i * 2.5, cy + 2.75 - i * 1.25], [cx + 2.5 + i * 2.5, cy + 5.5 - i * 1.25], [cx + i * 2.5, cy + 6.75 - i * 1.25]], i % 2 ? '#fff' : '#2a5ad8'); gable(g, cx, cy, 0.62, 10, 4, '#5a3a2a', '#3a2a1a', '#e0d8c0'); px(g, cx - 7, cy - 9, 5, 3, '#2a5ad8'); break;
      case 'm': diamond(g, cx, cy, 0.85, '#4a2a12', '#2a1a0a'); for (let i = 0; i < 5; i++) { const mx = cx - 8 + i * 4, my = cy - 1 + (i % 2) * 3; px(g, mx, my - 3, 1, 3, '#eee'); g.beginPath(); g.arc(mx + 0.5, my - 3, 2.6, Math.PI, 0); g.fillStyle = i % 2 ? '#e10600' : '#c84aff'; g.fill(); px(g, mx, my - 5, 1, 1, '#fff'); } break;
      case 'q': diamond(g, cx, cy, 0.85, '#8a7a4a', null); g.strokeStyle = '#5a3a1a'; g.lineWidth = 1.5; diamond(g, cx, cy, 0.85, null, '#5a3a1a'); for (let i = 0; i < 4; i++) px(g, cx - 12 + i * 8, cy - 4 + (i % 2) * 2, 1, 5, '#5a3a1a'); g.lineWidth = 1; sq(g, cx - 4, cy - 1, '#e10600'); sq(g, cx + 4, cy + 1, '#d1007a'); sq(g, cx + 1, cy - 4, '#ff5a00'); break;
      case 'w': box(g, cx, cy, 0.7, 12, '#7a7a7a', '#9a9a9a', '#6a6a6a'); px(g, cx + 4, cy - 26, 3, 12, '#555'); g.beginPath(); g.arc(cx + 6, cy - 29, 3, 0, 7); g.arc(cx + 9, cy - 33, 4, 0, 7); g.fillStyle = 'rgba(220,220,220,.8)'; g.fill(); px(g, cx - 8, cy - 6, 6, 4, '#e10600'); px(g, cx - 8, cy - 2, 2, 2, '#000'); px(g, cx - 4, cy - 2, 2, 2, '#000'); break;
      case 'g': box(g, cx, cy, 0.3, 26, '#8a6a3a', '#9a7a4a', '#6a4a2a'); box(g, cx, cy, 0.55, 7, '#aa8a5a', '#9a7a4a', '#7a5a3a', 26); pyramid(g, cx, cy - 33, 0.6, 0, 6, '#c02a1a', '#901a0a'); px(g, cx - 1, cy - 30, 2, 2, '#3a9a2a'); break;
      case 'e': box(g, cx, cy, 0.8, 16, '#b0a060', '#c8b878', '#9a8a4a'); px(g, cx - 8, cy - 28, 3, 12, '#555'); px(g, cx + 5, cy - 30, 3, 14, '#555'); poly(g, [[cx - 2, cy - 12], [cx + 3, cy - 12], [cx, cy - 8], [cx + 3, cy - 8], [cx - 3, cy - 1], [cx - 1, cy - 6], [cx - 4, cy - 6]], '#ffd400', '#000'); break;
      case 'n': box(g, cx, cy, 0.4, 20, '#e8e0d0', '#f0e8d8', '#c8c0b0'); pyramid(g, cx, cy, 0.45, 20, 5, '#7a3a1a', '#5a2a0a'); { const a = (seed % 4) * 0.4; for (let i = 0; i < 4; i++) { const an = a + i * Math.PI / 2; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 3, cy - 22); g.lineTo(cx + 3 + Math.cos(an) * 11, cy - 22 + Math.sin(an) * 11); g.stroke(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke(); } } break;
      case 'x': box(g, cx, cy, 0.7, 14, '#2a1a4a', '#3a2a6a', '#2a1a4a'); px(g, cx - 10, cy - 12, 8, 2, '#ff2a6d'); px(g, cx + 2, cy - 11, 8, 2, '#00e5ff'); px(g, cx - 6, cy - 8, 4, 3, '#ffd400'); px(g, cx + 4, cy - 6, 3, 3, '#3f3'); break;
      case 'b': box(g, cx, cy, 0.72, 14, '#f4f0e8', '#f4f0e8', '#d8d0c0'); for (let i = 0; i < 3; i++) { px(g, cx - 10 + i * 3, cy - 12 + i * 1.5, 1, 10, '#a8a090'); px(g, cx + 3 + i * 3, cy - 9 - i * 1.5 + 4, 1, 10, '#a8a090'); } pyramid(g, cx, cy, 0.74, 14, 6, '#ffd400', '#c9a000'); break;
      case 'R': box(g, cx, cy, 0.5, 4, '#c8c8c8', '#a8a8a8', '#888'); { const cs = ['#e10600', '#fff', '#0028c8', '#ffd400', '#0a0', '#ff8c00']; box(g, cx, cy, 0.42, 12, cs[(seed) % 6], cs[(seed + 1) % 6], cs[(seed + 3) % 6], 4); g.strokeStyle = '#000'; g.beginPath(); g.moveTo(cx - 4, cy - 10); g.lineTo(cx - 4, cy - 18); g.moveTo(cx + 4, cy - 10); g.lineTo(cx + 4, cy - 18); g.stroke(); } break;
      case 'c': box(g, cx, cy, 0.78, 18, '#5a1a2a', '#7a2a3a', '#5a1a2a'); px(g, cx - 12, cy - 18, 12, 6, '#000'); g.fillStyle = '#ffd400'; g.font = 'bold 5px Arial'; g.fillText('EP I', cx - 11, cy - 13); for (let i = 0; i < 5; i++) px(g, cx - 12 + i * 3, cy - 20 + i * 0.5, 1, 1, i % 2 ? '#fff' : '#ff0'); px(g, cx + 3, cy - 6, 3, 5, '#ffd400'); break;
    }
  }
  function drawLandmark(g, i) {
    const { x, y } = plotXY(i), cx = OX + (x + 1.5 - (y + 1.5)) * TW / 2, cy = OY + (x + 1.5 + y + 1.5) * TH / 2 + TH / 2;
    diamond(g, cx, cy, 4, '#c8b890', '#8a7a50');
    if (i === 24) { // Town Hall
      box(g, cx, cy, 2.6, 22, '#e8dcc0', '#f0e4c8', '#c8bc98'); pyramid(g, cx, cy, 2.7, 22, 14, '#4a5aa8', '#2a3a88');
      box(g, cx, cy - 36, 0.7, 18, '#e8dcc0', '#f0e4c8', '#c8bc98'); pyramid(g, cx, cy - 36, 0.8, 18, 10, '#4a5aa8', '#2a3a88');
      g.beginPath(); g.arc(cx - 5, cy - 46, 3, 0, 7); g.fillStyle = '#fff'; g.fill(); g.stroke(); px(g, cx - 5, cy - 48, 1, 2, '#000');
      for (let k = 0; k < 6; k++) { px(g, cx - 38 + k * 6, cy - 12 + k * 3, 2, 8, '#a8a090'); px(g, cx + 6 + k * 6, cy + 3 - k * 3, 2, 8, '#a8a090'); }
      px(g, cx - 2, cy - 74, 1, 18, '#333'); poly(g, [[cx - 1, cy - 74], [cx + 10, cy - 71], [cx - 1, cy - 68]], '#3a9a2a');
    } else if (i === 17) { // the Jack Exchange on Market Square
      box(g, cx, cy, 2.4, 18, '#f4f0e8', '#f4f0e8', '#d0c8b8'); for (let k = 0; k < 7; k++) { px(g, cx - 36 + k * 5, cy - 14 + k * 2.5, 2, 14, '#b8b0a0'); px(g, cx + 4 + k * 5, cy + 1 - k * 2.5, 2, 14, '#b8b0a0'); }
      pyramid(g, cx, cy, 2.5, 18, 12, '#ff8c00', '#c06000'); px(g, cx - 18, cy - 26, 36, 6, '#000'); g.fillStyle = '#0f0'; g.font = 'bold 5px Courier New'; g.fillText('PETS+ GEMS+ JNET-', cx - 17, cy - 21.5);
      for (let k = 0; k < 4; k++) sq(g, cx - 30 + k * 18, cy + 18 - (k % 2) * 4, ['#e10600', '#d1007a', '#ff5a00', '#e10600'][k]);
    } else { // the Gazette and the bandstand
      box(g, cx - 14, cy - 4, 1.6, 20, '#d8c8a8', '#e8d8b8', '#b8a888'); gable(g, cx - 14, cy - 4, 1.6, 20, 8, '#5a5a5a', '#3a3a3a', '#b8a888');
      px(g, cx - 30, cy - 18, 22, 5, '#fff'); g.fillStyle = '#000'; g.font = 'bold 4px Times New Roman'; g.fillText('GAZETTE', cx - 29, cy - 14);
      box(g, cx + 22, cy + 6, 1.1, 3, '#c8c8c8', '#a8a8a8', '#888'); for (let k = 0; k < 3; k++) px(g, cx + 12 + k * 9, cy - 4 + (k % 2) * 4, 1, 10, '#fff'); pyramid(g, cx + 22, cy - 4, 1.2, 4, 7, '#e10600', '#a00');
      tree(g, cx + 30, cy - 14, 1); tree(g, cx - 34, cy + 16, 1.1);
    }
  }
  function renderWorld(cv) {
    cv.width = WW; cv.height = WH;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = '#2a5a12'; g.fillRect(0, 0, WW, WH);
    for (let s = 0; s < N * 2 - 1; s++) for (let x = Math.max(0, s - N + 1); x <= Math.min(N - 1, s); x++) drawGround(g, x, s - x);
    // plots, owner flags and FOR SALE signs, then everything that sticks up, back to front
    const items = [];
    for (let i = 0; i < NP * NP; i++) {
      const { x, y } = plotXY(i), P = T && T.plots[i];
      if (RES.includes(i)) { items.push({ d: x + y + 3.2, f: () => drawLandmark(g, i) }); continue; }
      const cx = OX + (x + 1.5 - (y + 1.5)) * TW / 2, cy = OY + (x + 1.5 + y + 1.5) * TH / 2 + TH / 2;
      if (P) { diamond(g, cx, cy, 4, null, 'rgba(0,0,0,.35)'); items.push({ d: x + y - 0.5, f: () => { const fx = OX + (x - y) * TW / 2, fy = OY + (x + y) * TH / 2 + 4; px(g, fx, fy - 12, 1, 12, '#333'); poly(g, [[fx + 1, fy - 12], [fx + 8, fy - 10], [fx + 1, fy - 8]], ownerCol(P[0]), '#000'); } }); }
      else items.push({ d: x + y + 0.1, f: () => { const fx = OX + (x + 1 - (y + 1)) * TW / 2, fy = OY + (x + y + 2) * TH / 2; px(g, fx - 1, fy - 12, 2, 12, '#6a3a1a'); px(g, fx - 9, fy - 19, 18, 8, '#fff'); g.strokeStyle = '#000'; g.strokeRect(fx - 9.5, fy - 19.5, 19, 9); g.fillStyle = '#c00'; g.font = 'bold 6px Arial,sans-serif'; g.textAlign = 'center'; g.fillText('SALE', fx, fy - 13); g.textAlign = 'left'; } });
      if (P) for (let k = 0; k < 16; k++) { const b = P[2][k]; if (b === '.') continue; const tx = x + k % 4, ty = y + ((k / 4) | 0); items.push({ d: tx + ty, f: () => drawB(g, b, OX + (tx - ty) * TW / 2, OY + (tx + ty) * TH / 2 + TH / 2, (tx * 3 + ty * 5) % 97) }); }
    }
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (ground(x, y) === 'wood' && noise(x, y) % 3 !== 0) items.push({ d: x + y, f: () => tree(g, OX + (x - y) * TW / 2 + (noise(x, y) % 7) - 3, OY + (x + y) * TH / 2 + TH / 2 + 2, 0.8 + (noise(x, y) % 4) / 10, noise(x, y) % 2 ? '#2a7a22' : '#1a6a1a') });
    items.sort((a, b) => a.d - b.d).forEach(it => it.f());
    // the bridge over the river
    for (let y = 0; y < 2; y++) { const x = 17, sx = OX + (x - y) * TW / 2, sy = OY + (x + y) * TH / 2; poly(g, [[sx, sy], [sx + TW / 2, sy + TH / 2], [sx, sy + TH], [sx - TW / 2, sy + TH / 2]], '#9a7a4a', '#5a3a1a'); }
    return cv;
  }

  // ---------------------------------------------------------------- the town viewer (pan, zoom, pick)
  function viewer(P, host, opts) {
    const wrap = document.createElement('div'); wrap.className = 'gv-view';
    wrap.innerHTML = `<canvas class="gv-cv"></canvas><div class="gv-zoom"><button type="button" data-z="1" aria-label="Zoom in">+</button><button type="button" data-z="-1" aria-label="Zoom out">-</button><button type="button" data-z="0" title="Town Hall">TH</button><button type="button" data-z="me" title="My plot">ME</button></div><div class="gv-ev" hidden></div>`;
    host.appendChild(wrap);
    const cv = wrap.querySelector('canvas'), g = cv.getContext('2d'), world = document.createElement('canvas');
    let zoom = innerWidth < 600 ? 1 : 1.5, panX = 0, panY = 0, sel = null, hover = null, dirty = true, walkers = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => { const w = wrap.clientWidth || 600, h = Math.round(Math.min(460, Math.max(300, w * 0.62))); cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); return { w, h }; };
    let vw = size();
    const center = (tx, ty) => { const sx = OX + (tx - ty) * TW / 2, sy = OY + (tx + ty) * TH / 2; panX = vw.w / 2 - sx * zoom; panY = vw.h / 2 - sy * zoom; clampPan(); };
    const clampPan = () => { panX = Math.min(40, Math.max(vw.w - WW * zoom - 40, panX)); panY = Math.min(40, Math.max(vw.h - WH * zoom - 40, panY)); };
    function myPlot() { const me = Econ.me; return me && me.plot >= 0 ? me.plot : -1; }
    const goMe = () => { const i = myPlot(); if (i >= 0) { const { x, y } = plotXY(i); center(x + 2, y + 2); } else center(20, 20); draw(); };
    function tileAt(cx, cy) { const wx = (cx - panX) / zoom - OX, wy = (cy - panY) / zoom - OY; const a = wx / (TW / 2), b = wy / (TH / 2); const x = Math.floor((a + b) / 2), y = Math.floor((b - a) / 2); return x >= 0 && y >= 0 && x < N && y < N ? { x, y } : null; }
    function hl(t, col, thick) { if (!t) return; const sx = OX + (t.x - t.y) * TW / 2, sy = OY + (t.x + t.y) * TH / 2; g.save(); g.translate(panX, panY); g.scale(zoom, zoom); poly(g, [[sx, sy], [sx + TW / 2, sy + TH / 2], [sx, sy + TH], [sx - TW / 2, sy + TH / 2]], null, null); g.strokeStyle = col; g.lineWidth = thick / zoom; g.stroke(); g.restore(); }
    function plotOutline(i, col) { const { x, y } = plotXY(i); g.save(); g.translate(panX, panY); g.scale(zoom, zoom); const p = (tx, ty) => [OX + (tx - ty) * TW / 2, OY + (tx + ty) * TH / 2]; poly(g, [p(x, y), p(x + 4, y), p(x + 4, y + 4), p(x, y + 4)], null, null); g.setLineDash([4, 3]); g.strokeStyle = col; g.lineWidth = 2 / zoom; g.stroke(); g.restore(); }
    function draw() {
      if (dirty) { renderWorld(world); dirty = false; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = false;
      g.fillStyle = '#1a3a0a'; g.fillRect(0, 0, vw.w, vw.h);
      g.drawImage(world, panX, panY, WW * zoom, WH * zoom);
      // little people wandering the roads
      g.save(); g.translate(panX, panY); g.scale(zoom, zoom);
      const ev = T && T.ev || [], parade = ev.some(e => e.id === 'parade'), stampede = ev.some(e => e.id === 'stampede');
      walkers.forEach((w, i) => { const sx = OX + (w.x - w.y) * TW / 2, sy = OY + (w.x + w.y) * TH / 2 + TH / 2;
        if (stampede && i % 2) { sq(g, sx, sy - 3 - Math.abs(Math.sin(Date.now() / 120 + i)) * 3, ['#e10600', '#d1007a', '#ff5a00'][i % 3]); return; }
        const big = parade && i % 3 === 0; px(g, sx - 1, sy - 5, big ? 4 : 3, big ? 6 : 4, ['#2a5ad8', '#e10600', '#ffd400', '#3a9a2a', '#a050f0'][i % 5]); px(g, sx - 1, sy - 1, 1, 2, '#333'); px(g, sx + 1, sy - 1, 1, 2, '#333'); px(g, sx - 1, sy - 7, 3, 2, '#f0c8a0');
        if (parade && i % 3 === 0) { px(g, sx + 3, sy - 14, 1, 10, '#333'); px(g, sx + 4, sy - 14, 5, 3, i % 2 ? '#e10600' : '#ffd400'); } });
      if (ev.some(e => e.id === 'rain')) { g.strokeStyle = 'rgba(180,200,255,.5)'; for (let i = 0; i < 160; i++) { const rx = (i * 97 + Date.now() / 3) % WW, ry = (i * 53 + Date.now() / 1.5) % WH; g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 2, ry + 6); g.stroke(); } }
      if (ev.some(e => e.id === 'powercut')) { g.fillStyle = 'rgba(0,0,30,.45)'; g.fillRect(0, 0, WW, WH); }
      g.restore();
      const mp = myPlot(); if (mp >= 0) plotOutline(mp, '#ffd400');
      if (sel) hl(sel, '#fff', 2.5);
      if (hover && (!sel || hover.x !== sel.x || hover.y !== sel.y)) hl(hover, 'rgba(255,255,255,.6)', 1.5);
    }
    // walkers: a handful of people, more when the town is busy
    const spawn = () => { const ev = (T && T.ev) || [], extra = ev.some(e => e.id === 'parade' || e.id === 'stampede') ? 30 : 0; const n = Math.min(24 + extra, 4 + extra + Math.round(((T && T.stats && T.stats.pop) || 0) / 20)); while (walkers.length < n) { const h = Math.random() < 0.5, r = 2 + 5 * Math.floor(Math.random() * 8), s = 2 + Math.random() * 35; walkers.push(h ? { x: s, y: r, dx: Math.random() < .5 ? 0.05 : -0.05, dy: 0 } : { x: r, y: s, dx: 0, dy: Math.random() < .5 ? 0.05 : -0.05 }); } walkers.length = n; };
    spawn();
    const tick = () => { for (const w of walkers) { w.x += w.dx; w.y += w.dy; if (w.x < 2 || w.x > 37) w.dx = -w.dx; if (w.y < 2 || w.y > 37) w.dy = -w.dy; } draw(); };
    P.every(tick, 120);
    // pointer: drag to pan, click to pick
    let down = null;
    cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, px: panX, py: panY, moved: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      if (down) { const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 6) down.moved = true; if (down.moved) { panX = down.px + dx; panY = down.py + dy; clampPan(); draw(); } return; }
      if (e.pointerType === 'mouse') { hover = tileAt(e.clientX - r.left, e.clientY - r.top); draw(); }
    });
    cv.addEventListener('pointerup', e => { const d = down; down = null; if (!d || d.moved) return; const r = cv.getBoundingClientRect(), t = tileAt(e.clientX - r.left, e.clientY - r.top); if (!t) return; sel = t; draw(); opts.pick(t); });
    cv.addEventListener('pointerleave', () => { hover = null; draw(); });
    cv.addEventListener('wheel', e => { e.preventDefault(); setZoom(e.deltaY < 0 ? 1 : -1, e); }, { passive: false });
    function setZoom(d, e) { const old = zoom; zoom = Math.max(0.5, Math.min(3, d > 0 ? zoom * 1.5 : zoom / 1.5)); const r = cv.getBoundingClientRect(), mx = e ? e.clientX - r.left : vw.w / 2, my = e ? e.clientY - r.top : vw.h / 2; panX = mx - (mx - panX) * zoom / old; panY = my - (my - panY) * zoom / old; clampPan(); draw(); }
    wrap.querySelectorAll('[data-z]').forEach(b => b.addEventListener('click', () => { const z = b.dataset.z; if (z === 'me') goMe(); else if (z === '0') { center(19, 19); draw(); } else setZoom(+z); }));
    const ro = () => { vw = size(); clampPan(); draw(); }; window.addEventListener('resize', ro); P.live.offs.push(() => window.removeEventListener('resize', ro));
    goMe();
    return { redraw() { dirty = true; spawn(); draw(); }, draw, goMe, get sel() { return sel; }, set sel(v) { sel = v; draw(); }, flashEv(h) { const b = wrap.querySelector('.gv-ev'); b.textContent = 'BREAKING: ' + h; b.hidden = false; P.later(() => { b.hidden = true; }, 9000); } };
  }

  // ---------------------------------------------------------------- pages
  function top(on) {
    const tabs = [['/', 'TOWN MAP'], ['/gazette.html', 'THE GAZETTE'], ['/stats.html', 'TOWN STATS'], ['/plots.html', 'WHO LIVES WHERE'], ['/guide.html', 'PLANNING GUIDE']];
    return `<div class="gv-head"><div class="gv-sign"><b>JACKTOWN</b><i>twinned with nowhere &middot; pop. <span class="gv-pop">?</span></i></div><div class="gv-weather"></div></div><div class="gv-nav">${tabs.map(([u, l]) => `<a href="${U}${u}" class="${on === u ? 'on' : ''}">${l}</a>`).join('')}</div>`;
  }
  function headUpd(P) { const s = T && T.stats; const p = P.q('.gv-pop'); if (p && s) p.textContent = fmt(s.pop); const w = P.q('.gv-weather'); if (w && T) { const ev = T.ev || []; w.innerHTML = ev.length ? ev.map(e => `<span class="gv-evtag">${esc(e.h)}</span>`).join(' ') : '<span class="gv-evtag gv-calm">All quiet in Jacktown</span>'; } }
  const B = C.BUILD;
  function bIcon(code) { const cv = document.createElement('canvas'); cv.width = 40; cv.height = 44; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; diamond(g, 20, 34, 1, '#62a832', '#3a7a1a'); if (code !== '.') drawB(g, code, 20, 34, 7); else { g.strokeStyle = '#c00'; g.lineWidth = 3; g.beginPath(); g.moveTo(12, 24); g.lineTo(28, 38); g.moveTo(28, 24); g.lineTo(12, 38); g.stroke(); } return cv; }

  route(H, '/', CSS, P => {
    A.secret('econ.grotville');
    P.el.innerHTML = `${top('/')}<div class="gv-body"><div class="gv-mapcol"><div class="gv-mapbox"></div><div class="gv-tip">Drag to move around. Click a tile to look at it. ${member() ? 'Pick something from the <b>Build</b> list, then click a square on <b>your</b> plot to build it.' : ''}</div><div class="gv-build" hidden><div class="gv-bh"><b>BUILD</b> <span class="gv-tool">Look (no building)</span></div><div class="gv-tools"></div></div></div>
      <div class="gv-side"><div class="gv-info"><b class="gv-ih">Welcome to Jacktown!</b><div class="gv-ib">Jacktown is a town built by everyone on JackNet. Every member can claim <b>one plot</b> (4 x 4 squares) and build on it with Rupees. Buildings pay <b>rent</b> every hour, and how happy the town is changes how much everybody gets. Click a <b>FOR SALE</b> sign to claim a plot!</div></div><div class="gv-msg ec-msg" hidden></div>${member() ? '' : guestBox('Anyone can look around Jacktown. Members can claim a plot and build.')}
      <div class="gv-mini"><b>TOWN AT A GLANCE</b><div class="gv-stat"></div><a href="${U}/stats.html">More stats &raquo;</a></div><div class="gv-mini"><b>LATEST FROM THE GAZETTE</b><div class="gv-gz"></div><a href="${U}/gazette.html">Read the Gazette &raquo;</a></div></div></div>${footer('<p class="c">Jacktown Town Council &middot; Mayor: a man in a VERY big hat &middot; Rent is paid every hour on the hour (ish).</p>')}`;
    let tool = '';
    const tools = P.q('.gv-tools');
    for (const code of C.BUILD_ORDER) { const b = document.createElement('button'); b.type = 'button'; b.className = 'gv-tb'; b.dataset.b = code; b.title = B[code].n + ': ' + B[code].d; b.appendChild(bIcon(code)); b.insertAdjacentHTML('beforeend', `<span>${esc(code === '.' ? 'Bulldoze' : B[code].n)}</span><small>${code === '.' ? 'refund 1/3' : W.rp(B[code].cost)}</small>`); tools.appendChild(b); }
    tools.addEventListener('click', e => { const b = e.target.closest('.gv-tb'); if (!b) return; tool = tool === b.dataset.b ? '' : b.dataset.b; P.qa('.gv-tb').forEach(x => x.classList.toggle('on', x.dataset.b === tool)); P.q('.gv-tool').textContent = tool ? (tool === '.' ? 'Bulldozer' : B[tool].n + ' (' + W.rp(B[tool].cost) + ')') + ': click your plot' : 'Look (no building)'; sfx('click'); });
    const info = (h, body) => { P.q('.gv-ih').innerHTML = h; P.q('.gv-ib').innerHTML = body; };
    const v = viewer(P, P.q('.gv-mapbox'), { pick(t) {
      P.q('.gv-msg').hidden = true;
      const at = plotAt(t.x, t.y), g0 = ground(t.x, t.y);
      if (!at) { info(g0 === 'water' ? 'The River Jack' : g0 === 'wood' ? 'Pixelwood Forest' : 'A road', g0 === 'water' ? 'Brown, cold and full of trolleys. Do not swim in it.' : g0 === 'wood' ? 'Trees. Squirrels. Probably a troll.' : 'Cobbles. Mind the potholes. The council will fix them "after the Millennium".'); return; }
      if (RES.includes(at.i)) {
        const L = { 24: ['Jacktown Town Hall', 'The Mayor works here (a man in a VERY big hat). The Big Power Station in the cellar gives the town 20 units of power for free. Treasury: <b>' + W.rp(T ? T.treasury : 0) + '</b> (from a 10% tax on rent).'], 17: ['The Jack Exchange, Market Square', 'Where Jacktown trades shares. <a href="http://www.jackexchange.grot/">Visit the Jack Stock Exchange &raquo;</a>'], 31: ['Gazette Office &amp; Bandstand', 'Home of the Jacktown Gazette, printed on a press made of a mangle. <a href="' + U + '/gazette.html">Read today\'s paper &raquo;</a>'] }[at.i];
        info(L[0], L[1]); if (at.i === 24) { A.secret('econ.townhall'); P.say('.gv-msg', '<b>The Mayor says:</b> "' + esc(['Welcome to Jacktown! Mind the potholes.', 'Build more windmills. The Big Power Station is wheezing.', 'Crime is up! Build Neighbourhood Watch Huts!', 'This is not a big hat. It is a MAYOR\'S hat.', 'Rent is paid on the hour. Happy towns pay more.', 'I once got to level 9 on JACKTRIS. Ask me about it.'][Math.floor(Math.random() * 5)]) + '"', 'ok'); }
        return;
      }
      const Pl = T && T.plots[at.i], me = Econ.me;
      if (!Pl) {
        const can = member() && me && me.plot < 0;
        info(`Plot ${at.i + 1}: FOR SALE`, `${esc(address(at.i))}<br>Nobody lives here yet. The deeds cost <b>25 Rupees</b>.${can ? '<br><button type="button" class="gv-claim">Claim this plot (25 Rupees)</button>' : member() && me && me.plot >= 0 ? '<br><i>You already have a plot. One each!</i>' : ''}`);
        const cb = P.q('.gv-claim'); if (cb) cb.addEventListener('click', () => { cb.disabled = true; Net.send({ t: 'ecClaim', i: at.i }); });
        return;
      }
      const mine = me && me.plot === at.i, b = Pl[2][at.k];
      if (mine && tool) {
        if (tool === b) return;
        if (tool !== '.' && b !== '.' && !confirmReplace(b)) return;
        Net.send({ t: 'ecBuild', k: at.k, b: tool });
        return;
      }
      info(`${Pl[1] ? esc(Pl[1]) : 'Plot ' + (at.i + 1)}`, `${esc(address(at.i))}<br>Owner: <b>${esc(Pl[0])}</b> ${W.badge(Pl[3])}<br>This square: <b>${b === '.' ? 'grass' : esc(B[b].n)}</b>${b !== '.' ? `<br><i>${esc(B[b].d)}</i>` : ''}<br>Buildings on this plot: ${[...Pl[2]].filter(c => c !== '.').length} of 16${mine ? `<br><br><label>Name your plot: <input type="text" maxlength="24" class="gv-nm" value="${esc(Pl[1] || '')}"></label> <button type="button" class="gv-nmb">Save</button><br><br><a href="#" class="gv-ab">Move out (lose everything)</a>` : ''}`);
      if (mine) { P.q('.gv-nmb').addEventListener('click', () => Net.send({ t: 'ecPlotName', nm: P.q('.gv-nm').value })); P.q('.gv-ab').addEventListener('click', ev => { ev.preventDefault(); const a = ev.target; if (a.dataset.sure) { Net.send({ t: 'ecAbandon' }); } else { a.dataset.sure = '1'; a.textContent = 'Are you SURE? Everything gets flattened. Click again to move out.'; } }); }
    } });
    let lastConfirm = 0;
    function confirmReplace(b) { if (Date.now() - lastConfirm < 4000) return true; lastConfirm = Date.now(); P.say('.gv-msg', `There is already a ${esc(B[b].n)} there. Click again to knock it down (you get a third back) and build.`, ''); return false; }
    const side = () => {
      headUpd(P);
      const s = T && T.stats, st = P.q('.gv-stat');
      if (st && s) st.innerHTML = `<table>${[['Population', fmt(s.pop)], ['Happiness', `<span class="gv-hap"><i style="width:${s.hap}%"></i></span> ${s.hap}%`], ['Jobs', `${fmt(s.jobs)} (${fmt(s.unemp)} out of work)`], ['Power', `${s.supply} / ${s.demand} needed ${s.powOk < 1 ? '<b class="gv-bad">BROWNOUT</b>' : ''}`], ['Crime', s.crime], ['Pollution', s.poll], ['Pixel Pets', s.sq], ['Rent rate', 'x' + s.mult]].map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`;
      const me = Econ.me, bd = P.q('.gv-build'); if (bd) bd.hidden = !(me && me.plot >= 0);
    };
    const gz = () => { const b = P.q('.gv-gz'); if (b && gzList) b.innerHTML = gzList.slice(0, 3).map(a => `<p><b>${esc(W.unteef(a.h))}</b><br><span class="gv-small">${ago(a.ts)}</span></p>`).join(''); };
    let gzList = null;
    P.on('ecGaz', m => { gzList = m.list; gz(); });
    P.on('ecTown', () => { v.redraw(); side(); });
    P.on('ecPlot', m => { v.redraw(); side(); if (Econ.me && m.p && m.p[0] === Econ.me.name) { A.secret('econ.claim'); sfx('solve'); P.say('.gv-msg', 'This plot is <b>yours</b>! Pick something from the Build list and click a square on your plot (it has a yellow dotted line round it).', 'ok'); Net.send({ t: 'ecMe' }); } });
    P.on('ecCell', m => { v.redraw(); if (Econ.me && m.by === Econ.me.name) { sfx('thud'); if (m.b === 'c') A.secret('econ.cinema'); } else sfx('click'); });
    P.on('ecStats', () => { side(); v.redraw(); });
    P.on('ecTownEv', m => { v.flashEv(m.h); Net.send({ t: 'ecGaz' }); });
    P.on('me', () => { side(); v.draw(); });
    P.errTo('.gv-msg');
    P.sub({ town: true });
    Net.send({ t: 'ecTown' }); Net.send({ t: 'ecGaz' }); Net.send({ t: 'ecMe' });
    side();
  });

  route(H, '/gazette.html', CSS + ' gv-paper', P => {
    A.secret('econ.gazette');
    const today = W.longDate();
    P.el.innerHTML = `${top('/gazette.html')}<div class="gz"><div class="gz-mast"><span class="gz-ear">No. ${fmt(1234 + Math.floor(Date.now() / 86400000) % 1000)}</span><h1>The Jacktown Gazette</h1><span class="gz-ear">Price: 2 Rupees</span></div><div class="gz-date">${esc(today)} &middot; "All the news that's fit to print, and some that isn't" &middot; Weather: rain</div><div class="gz-cols">Stop the presses...</div>
      <div class="gz-class"><b>CLASSIFIED ADS</b><p>LOST: one virtual pet on a keyring, blue, answers to "BEEP". Probably hungry. Reward.</p><p>FOR SALE: go-kart, one careful owner. Red. Goes faster. No brakes.</p><p>WANTED: someone to solve the cube statue. Tourists have given up.</p><p>SWAPS: 2 shiny cards for 1 memory card. Must have saves on it. Ask for Dave.</p><p>Robot builder seeks spanner. Has many spanners. Wants one more.</p></div></div>${footer()}`;
    P.on('ecGaz', m => {
      const b = P.q('.gz-cols'); if (!b) return;
      b.innerHTML = m.list.length ? m.list.map((a, i) => `<article class="gz-a${i === 0 ? ' gz-lead' : ''}"><h2>${esc(W.unteef(a.h))}</h2><div class="gz-by">${d99(a.ts)} ${t99(a.ts)} &middot; ${{ town: 'Town Hall', build: 'Property', event: 'Breaking News', mkt: 'Business', shop: 'Shopping', lotto: 'Lotto', race: 'Racing' }[a.k] || 'News'}</div><p>${esc(W.unteef(a.b))}</p></article>`).join('') : '<p>No news. Jacktown is very quiet. Suspiciously quiet.</p>';
    });
    Net.send({ t: 'ecGaz' }); headUpd(P); Net.send({ t: 'ecTown' }); P.on('ecTown', () => headUpd(P));
  });

  route(H, '/stats.html', CSS, P => {
    P.el.innerHTML = `${top('/stats.html')}<div class="gv-pad"><h1 class="gv-h">Town Statistics</h1><p>Worked out by the council's computer every three minutes. Happiness, power and events change everyone's rent.</p><div class="gv-st"></div><h2 class="gv-h2">The last few hours</h2><canvas class="gv-graph"></canvas><div class="gv-key"><span style="color:#2a7ad8">&#9632; Population</span> <span style="color:#2a9a2a">&#9632; Happiness</span> <span style="color:#c00">&#9632; Crime</span> <span style="color:#8a6a2a">&#9632; Pollution</span> <span style="color:#d1007a">&#9632; Pixel Pets</span></div></div>${footer()}`;
    const draw = () => {
      headUpd(P); if (!T || !T.stats) return;
      const s = T.stats;
      P.q('.gv-st').innerHTML = `<table class="gv-tbl">${[['Population', fmt(s.pop), 'People living in houses, flats and sheds.'], ['Jobs', fmt(s.jobs), `Shops, farms, workshops and the town buildings. ${fmt(s.unemp)} people out of work (that makes them grumpy).`], ['Happiness', s.hap + '%', 'Parks, trees, fountains, the cinema and the arcade help. Pollution, crime and unemployment hurt.'], ['Power', `${s.supply} made, ${s.demand} used`, s.powOk < 1 ? '<b class="gv-bad">Not enough power! Rent is cut. Build a Big Power Station or windmills.</b>' : 'Plenty. Lights on.'], ['Crime', s.crime, 'Neighbourhood Watch Huts stop it.'], ['Pollution', s.poll, 'Workshops and generators make it. Trees and ponds soak it up.'], ['Pixel Pets', s.sq, 'Pet shops. Helps the Pixel Pets plc share price!'], ['Mushrooms', s.mush, 'Mushroom farms. Helps Gubbinz Pet Food shares!'], ['Rent multiplier', 'x' + s.mult, 'How much of the full rent everyone gets right now.'], ['Plots claimed', `${s.plots} of ${NP * NP - RES.length}`, ''], ['Buildings', fmt(s.built), ''], ['Town Treasury', W.rp(T.treasury), '10% of all rent. The Mayor is saving up for a bigger hat.']].map(([a, b, c]) => `<tr><th>${a}</th><td><b>${b}</b></td><td>${c}</td></tr>`).join('')}</table>`;
      const cv = P.q('.gv-graph'), w = cv.clientWidth || 500, h = 160, dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px';
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#fffff0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ddd'; for (let y = 0; y < h; y += 20) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(w, y + .5); g.stroke(); }
      const hs = T.hist; if (hs.length < 2) { g.fillStyle = '#666'; g.font = '12px Verdana'; g.fillText('Not enough history yet. Check back in a bit.', 10, 20); return; }
      ['#2a7ad8', '#2a9a2a', '#c00', '#8a6a2a', '#d1007a'].forEach((col, k) => { const vals = hs.map(r => r[k]), hi = Math.max(10, ...vals); g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); vals.forEach((val, i) => { const x = i / (vals.length - 1) * (w - 10) + 5, y = h - 8 - val / hi * (h - 16); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); });
    };
    P.on('ecTown', draw); P.on('ecStats', draw); P.sub({ town: true }); Net.send({ t: 'ecTown' }); draw();
  });

  route(H, '/plots.html', CSS, P => {
    P.el.innerHTML = `${top('/plots.html')}<div class="gv-pad"><h1 class="gv-h">Who Lives Where</h1><div class="gv-pl">Loading...</div></div>${footer()}`;
    const draw = () => {
      headUpd(P); if (!T) return;
      const rows = T.plots.map((p, i) => p ? { i, p, n: [...p[2]].filter(c => c !== '.').length } : null).filter(Boolean).sort((a, b) => b.n - a.n);
      P.q('.gv-pl').innerHTML = rows.length ? `<table class="gv-tbl"><tr><th>Plot</th><th>Name</th><th>Owner</th><th>Address</th><th>Buildings</th></tr>${rows.map(r => `<tr><td>${r.i + 1}</td><td>${esc(r.p[1] || '-')}</td><td><span class="gv-flag" style="background:${ownerCol(r.p[0])}"></span>${esc(r.p[0])} ${W.badge(r.p[3])}</td><td>${esc(address(r.i))}</td><td>${r.n} / 16</td></tr>`).join('')}</table><p>${NP * NP - RES.length - rows.length} plots still for sale. <a href="${U}/">Go and claim one!</a></p>` : `<p>Nobody has moved in yet! <a href="${U}/">Be the first &raquo;</a></p>`;
    };
    P.on('ecTown', draw); P.on('ecPlot', draw); P.on('ecCell', draw); P.sub({ town: true }); Net.send({ t: 'ecTown' }); draw();
  });

  route(H, '/guide.html', CSS, P => {
    P.el.innerHTML = `${top('/guide.html')}<div class="gv-pad"><h1 class="gv-h">The Jacktown Planning Guide</h1><p>Every member can claim one plot (4 x 4 squares, deeds cost 25 Rupees). Build on it with Rupees. Houses, flats and sheds bring <b>people</b>; shops, farms and workshops make <b>jobs</b> and pay <b>rent</b>. Most buildings need <b>power</b>. Rent is paid into your JackNet Bank account every hour, multiplied by how happy and well-powered the town is. Bulldozing gives back a third of what something cost.</p><table class="gv-tbl gv-guide"><tr><th></th><th>Building</th><th>Cost</th><th>People</th><th>Jobs</th><th>Power</th><th>Happy</th><th>Crime</th><th>Pollution</th><th>Rent/hr*</th><th>Max</th></tr></table><p class="gv-small">*Rent per hour at a 1.0 rent rate (20 council ticks an hour, minus 10% tax). Max = most of that building allowed on one plot.</p><p>Tips from the Mayor: houses need jobs nearby, jobs need people, everyone needs power, and NOBODY likes pollution. Pet shops make the Pixel Pets plc share price go up. Mushroom farms help Gubbinz Pet Food. The Planning Inspector gives 75 Rupees every midnight to the Best-Kept Plot.</p></div>${footer()}`;
    const t = P.q('.gv-guide');
    for (const code of C.BUILD_ORDER) { if (code === '.') continue; const b = B[code], tr = document.createElement('tr'); const td0 = document.createElement('td'); td0.appendChild(bIcon(code)); tr.appendChild(td0); tr.insertAdjacentHTML('beforeend', `<td><b>${esc(b.n)}</b><br><span class="gv-small">${esc(b.d)}</span></td><td>${b.cost}</td><td>${b.pop || ''}</td><td>${b.jobs || ''}</td><td>${b.pow > 0 ? '+' + b.pow : b.pow || ''}</td><td>${b.hap || ''}</td><td>${b.crime || ''}</td><td>${b.poll || ''}</td><td>${b.rent ? (b.rent * 18).toFixed(2) : ''}</td><td>${b.max < 16 ? b.max : ''}</td>`); t.appendChild(tr); }
    Net.send({ t: 'ecTown' }); P.on('ecTown', () => headUpd(P));
  });
  W.town = true;
})();

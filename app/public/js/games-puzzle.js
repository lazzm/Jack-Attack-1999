/* Slider 15 and Jigsaw 98 for JackOS 98 (lazy loaded by apps-games.js).
 * The pictures are original pixel art (hand-typed rows or worked out pixel by pixel) and two painted canvas scenes. */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const fmtT = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // ================================================================ pictures
  const rowsArt = (rows, pal) => (c, n) => { // hand-typed rows -> pixels (n = side)
    rows.forEach((r, y) => { for (let x = 0; x < n; x++) { c.fillStyle = pal[r[x] || r[r.length - 1]] || pal[Object.keys(pal)[0]]; c.fillRect(x, y, 1, 1); } });
  };
  const GROT = ['bbbbbbbbbbbbbbbbbbbb', 'bbbbbbbbbbbbbbbbbbbb', 'bbbbbbbkkkkkkbbbbbbb', 'bbbbbbkggggggkbbbbbb', 'kbbbbkggggggggkbbbbk', 'kgkbkggggggggggkbkgk', 'bkgkkggggggggggkkgkb', 'bbkggggggggggggggkbb', 'bbbkggkkkggkkkggkbbb', 'bbbbkgrwkggkwrgkbbbb', 'bbbbkgrrkggkrrgkbbbb', 'bbbbkggggddggggkbbbb', 'bbbbkgkkkkkkkkgkbbbb', 'bbbbkgkwkwwkwkgkbbbb', 'bbbbbkgkkkkkkgkbbbbb', 'bbbbbbkggggggkbbbbbb', 'bbbbbbbkkkkkkbbbbbbb', 'bbbbbbnnnnnnnnbbbbbb', 'bbbbnnnnynnynnnnbbbb', 'bbbnnnnnnnnnnnnnnbbb'];
  const ORK = ['ooooooookcckoooooooo', 'oooooooookkooooooooo', 'oookkkkkkkkkkkkkkooo', 'oookhhhhhhhhhhhhkooo', 'oookhssssssssssdkooo', 'oookhskkkkkkkksdkooo', 'okdkhskrrrrrrksdkdko', 'okdkhskryrryrksdkdko', 'okdkhskkkkkkkksdkdko', 'okdkhssssssssssdkdko', 'oookhskwkwkwkwsdkooo', 'oookhskwkwkwkwsdkooo', 'oookhssssssssssdkooo', 'oookddddddddddddkooo', 'oookkkkkkkkkkkkkkooo', 'oooooookddddkooooooo', 'ookkkkkkkkkkkkkkkkoo', 'oknnnnnnyyyynnnnnnko', 'knnnnnnnnnnnnnnnnnnk', 'knnnsnnnnnnnnnnsnnnk']; // the Robot Boss (id stays ork)
  const POD = ['yyyyyyyyyyyyyyyyyyyy', 'yyuuyyyyyyyyyyyyuuyy', 'yyyyyyyyyyyyyyyyyyyy', 'yyyykkkkkkkkkkkyyyyy', 'ofkshhhhrrhhhhskyyyy', 'ffksssssrrssssskkyyy', 'yyyykkkkkkkkkkkcyyyy', 'yyyyyyyyyyyyyyycyyyy', 'yyyyyyyyyyyykkkckyyy', 'yyyyyyyyyyykbbgkkyyy', 'yyyyyyyyyyykbggrkkyy', 'yyyyyyyyyyyykkkckyyy', 'yyyyyyyyyyyyyyycyyyy', 'yyyykkkkkkkkkkkcyyyy', 'ffksssssrrssssskkyyy', 'ofkshhhhrrhhhhskyyyy', 'yyyykkkkkkkkkkkyyyyy', 'yyyyyyyyyyyyyyyyyyyy', 'yyuuuyyyyyyyyyyuuyyy', 'yyyyyyyyyyyyyyyyyyyy'];
  function cubeArt(c, n) { // a Rubik's cube in isometric pixels, worked out per pixel
    const faces = [ // origin, edge A, edge B, sticker colours
      { o: [12, 1.5], a: [10.5, 5.2], b: [-10.5, 5.2], col: ['#fff', '#ffd400', '#fff', '#e10600', '#fff', '#fff', '#1aa31a', '#fff', '#2349b8'] },
      { o: [1.5, 6.7], a: [10.5, 5.2], b: [0, 11.5], col: ['#1aa31a', '#1aa31a', '#ff8a00', '#1aa31a', '#1aa31a', '#e10600', '#ffd400', '#1aa31a', '#1aa31a'] },
      { o: [12, 11.9], a: [10.5, -5.2], b: [0, 11.5], col: ['#e10600', '#e10600', '#e10600', '#2349b8', '#e10600', '#e10600', '#e10600', '#fff', '#e10600'] },
    ];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let col = (x + y) % 2 ? '#24245a' : '#1e1e50';
      for (const f of faces) {
        const px = x + 0.5 - f.o[0], py = y + 0.5 - f.o[1], det = f.a[0] * f.b[1] - f.a[1] * f.b[0];
        const u = (px * f.b[1] - py * f.b[0]) / det, v = (f.a[0] * py - f.a[1] * px) / det;
        if (u >= 0 && u <= 1 && v >= 0 && v <= 1) { const su = u * 3, sv = v * 3, fu = su % 1, fv = sv % 1; col = (fu < 0.1 || fu > 0.93 || fv < 0.1 || fv > 0.93) ? '#000' : f.col[Math.min(2, sv | 0) * 3 + Math.min(2, su | 0)]; }
      }
      c.fillStyle = col; c.fillRect(x, y, 1, 1);
    }
  }
  function spaceArt(c, n) {
    const r = JG.rng(42);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let col = y < 12 ? '#05052a' : '#0a0a3a';
      const s = r(); if (s < 0.05) col = s < 0.015 ? '#ffffff' : '#8888cc';
      const dx = x - 6.5, dy = y - 17.5, d = Math.hypot(dx, dy);
      if (d < 6.2) { const band = Math.floor((y + x * 0.3) / 2) % 2; col = d > 5.2 && dx > 0 ? '#7a2a10' : band ? '#ff9a3a' : '#e06a20'; }
      const rx = (x - 6.5) / 9.5, ry = (y - 17.5) / 2.2; if (Math.abs(rx * rx + ry * ry - 1) < 0.18 && !(d < 6.2 && y < 17.5)) col = '#ffe6a0';
      const mx = x - 17, my = y - 6, md = Math.hypot(mx, my); if (md < 3.3) col = md > 2.4 && mx < 0 ? '#5a6a8a' : '#c8d4f0';
      if (md < 1 && mx > 0) col = '#8a9ab8';
      // a little rocket heading up-right
      if (x >= 3 && x <= 6 && y >= 3 && y <= 9 && Math.abs((x - 4.5) - (y - 6) * -0.0) < 1.6 + (y > 7 ? 0.5 : 0) - (y < 5 ? (5 - y) * 0.6 : 0)) col = y > 8 ? '#e10600' : '#e8e8f0';
      if (y === 10 && (x === 4 || x === 5)) col = r() < 0.5 ? '#ffd400' : '#ff8a00';
      if (y === 11 && x === 4) col = '#ff8a00';
      if (y === 5 && x === 4) col = '#2a9aff';
      c.fillStyle = col; c.fillRect(x, y, 1, 1);
    }
  }
  function sunsetScene(c, W, H) {
    const g = c.createLinearGradient(0, 0, 0, H * 0.7); g.addColorStop(0, '#2a0a5a'); g.addColorStop(0.45, '#c8307a'); g.addColorStop(0.75, '#ff7a1a'); g.addColorStop(1, '#ffd060');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // the sun with retro stripes
    const sx = W * 0.62, sy = H * 0.56, sr = H * 0.26;
    const sg = c.createLinearGradient(0, sy - sr, 0, sy + sr); sg.addColorStop(0, '#fff3a0'); sg.addColorStop(1, '#ff5a1a');
    c.save(); c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.clip(); c.fillStyle = sg; c.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    c.fillStyle = 'rgba(200,40,110,.9)'; for (let i = 0; i < 6; i++) { const yy = sy + sr * (0.05 + i * 0.16); c.fillRect(sx - sr, yy, sr * 2, sr * 0.03 + i * sr * 0.012); }
    c.restore();
    // stars and a moon
    const r = JG.rng(7); c.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H * 0.3; c.globalAlpha = 0.3 + r() * 0.7; c.fillRect(x, y, 1.5, 1.5); } c.globalAlpha = 1;
    c.fillStyle = '#ffe9c0'; c.beginPath(); c.arc(W * 0.16, H * 0.16, H * 0.06, 0, TAU); c.fill(); c.fillStyle = '#3a1060'; c.beginPath(); c.arc(W * 0.16 + H * 0.025, H * 0.15, H * 0.055, 0, TAU); c.fill();
    // dunes
    const dune = (y0, amp, col, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += W / 60) c.lineTo(x, y0 + Math.sin(x / W * 6 + ph) * amp + Math.sin(x / W * 13 + ph * 2) * amp * 0.3); c.lineTo(W, H); c.closePath(); c.fill(); };
    dune(H * 0.7, H * 0.03, '#a0401a', 1); dune(H * 0.78, H * 0.04, '#6a2410', 2.5); dune(H * 0.88, H * 0.03, '#2a0a08', 4);
    // silhouettes: a rocket on its launch pad, an astronaut waving, a moon buggy and three flying saucers
    c.fillStyle = '#1a0606';
    const u = H * 0.012, rx = W * 0.24, ry = H * 0.8;
    c.fillRect(rx - u * 9, ry - u * 3, u * 18, u * 3); // pad
    c.fillRect(rx - u * 8, ry - u * 36, u * 1.6, u * 33); c.fillRect(rx - u * 8, ry - u * 30, u * 5, u * 1); c.fillRect(rx - u * 8, ry - u * 20, u * 5, u * 1); // gantry
    for (let k = 0; k < 6; k++) { c.fillRect(rx - u * 8 + (k % 2) * u, ry - u * (8 + k * 5), u * 1.6, u * 0.6); }
    c.beginPath(); c.moveTo(rx, ry - u * 42); c.quadraticCurveTo(rx + u * 4.5, ry - u * 34, rx + u * 3.5, ry - u * 8); c.lineTo(rx + u * 6.5, ry - u * 3); c.lineTo(rx - u * 6.5, ry - u * 3); c.lineTo(rx - u * 3.5, ry - u * 8); c.quadraticCurveTo(rx - u * 4.5, ry - u * 34, rx, ry - u * 42); c.fill(); // rocket
    const ax = W * 0.42, ay = H * 0.84;
    c.beginPath(); c.arc(ax, ay - u * 13, u * 3, 0, TAU); c.fill(); c.fillRect(ax - u * 3, ay - u * 10, u * 6, u * 7); c.fillRect(ax - u * 4.2, ay - u * 9, u * 1.6, u * 5); c.fillRect(ax + u * 3, ay - u * 9, u * 1.6, u * 5);
    c.fillRect(ax - u * 2.4, ay - u * 3.5, u * 2, u * 4); c.fillRect(ax + u * 0.4, ay - u * 3.5, u * 2, u * 4);
    c.save(); c.translate(ax + u * 4, ay - u * 9); c.rotate(-0.7); c.fillRect(0, -u * 0.8, u * 6, u * 1.6); c.restore(); // waving arm
    const bx = W * 0.78, by = H * 0.92;
    c.fillRect(bx - u * 12, by - u * 7, u * 22, u * 4); c.fillRect(bx - u * 4, by - u * 11, u * 8, u * 4); c.fillRect(bx + u * 6, by - u * 15, u * 0.8, u * 9); c.beginPath(); c.arc(bx + u * 6.4, by - u * 15.5, u * 2.2, Math.PI, 0); c.fill();
    for (const wx of [-9, 7]) { c.beginPath(); c.arc(bx + wx * u, by - u * 2, u * 3.5, 0, TAU); c.fill(); }
    for (const [x, y, s] of [[0.45, 0.3, 1], [0.53, 0.24, 0.7], [0.37, 0.21, 0.6]]) { c.beginPath(); c.ellipse(W * x, H * y, u * 7 * s, u * 2 * s, -0.1, 0, TAU); c.fill(); c.beginPath(); c.ellipse(W * x, H * y - u * 1.6 * s, u * 3 * s, u * 2.4 * s, -0.1, Math.PI, TAU); c.fill(); }
  }
  function battleScene(c, W, H) {
    c.fillStyle = '#02020f'; c.fillRect(0, 0, W, H);
    const r = JG.rng(1999);
    for (const [x, y, rad, col] of [[0.25, 0.3, 0.5, 'rgba(120,40,200,.45)'], [0.8, 0.7, 0.45, 'rgba(20,120,220,.35)'], [0.6, 0.2, 0.3, 'rgba(220,40,120,.3)']]) { const g = c.createRadialGradient(W * x, H * y, 0, W * x, H * y, W * rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; const s = r() < 0.08 ? 2 : 1; c.fillRect(r() * W, r() * H, s, s); }
    // ringed planet
    const px = W * 0.22, py = H * 0.72, pr = H * 0.28;
    const pg = c.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr); pg.addColorStop(0, '#ffcf7a'); pg.addColorStop(0.6, '#d0702a'); pg.addColorStop(1, '#4a1a08');
    c.save(); c.translate(px, py); c.rotate(-0.35);
    c.strokeStyle = 'rgba(255,230,170,.7)'; c.lineWidth = H * 0.025; c.beginPath(); c.ellipse(0, 0, pr * 1.7, pr * 0.32, 0, Math.PI, TAU); c.stroke();
    c.restore();
    c.fillStyle = pg; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(px, py, pr, 0, TAU); c.clip(); c.fillStyle = 'rgba(120,40,10,.35)'; for (let i = -3; i < 4; i++) c.fillRect(px - pr, py + i * pr * 0.22, pr * 2, pr * 0.07); c.restore();
    c.save(); c.translate(px, py); c.rotate(-0.35); c.strokeStyle = 'rgba(255,230,170,.8)'; c.lineWidth = H * 0.025; c.beginPath(); c.ellipse(0, 0, pr * 1.7, pr * 0.32, 0, 0, Math.PI); c.stroke(); c.restore();
    // lasers
    c.lineCap = 'round';
    for (const [x0, y0, x1, y1, col] of [[0.55, 0.42, 0.72, 0.3, '#ff3030'], [0.6, 0.47, 0.78, 0.36, '#ff3030'], [0.83, 0.28, 0.66, 0.58, '#3aff6a'], [0.4, 0.22, 0.52, 0.16, '#3aff6a']]) {
      c.strokeStyle = col; c.lineWidth = H * 0.012; c.shadowColor = col; c.shadowBlur = H * 0.03; c.beginPath(); c.moveTo(W * x0, H * y0); c.lineTo(W * x1, H * y1); c.stroke();
    }
    c.shadowBlur = 0;
    // wedge starfighters and a big round saucer
    const fighter = (x, y, s, a, col) => { c.save(); c.translate(W * x, H * y); c.rotate(a); c.scale(s * H / 100, s * H / 100);
      c.fillStyle = col; c.beginPath(); c.moveTo(12, 0); c.lineTo(-8, -7); c.lineTo(-4, 0); c.lineTo(-8, 7); c.closePath(); c.fill();
      c.fillStyle = '#ffd400'; c.fillRect(-10, -2, 3, 4); c.fillStyle = '#7ad0ff'; c.beginPath(); c.arc(2, 0, 2.4, 0, TAU); c.fill(); c.restore(); };
    fighter(0.5, 0.45, 1.3, -0.6, '#c8c8d8'); fighter(0.58, 0.52, 1, -0.5, '#b0b0c0'); fighter(0.36, 0.25, 0.8, -0.4, '#d0d0e0');
    const sx = W * 0.8, sy = H * 0.32, sr = H * 0.12;
    c.fillStyle = '#5a5a6a'; c.beginPath(); c.ellipse(sx, sy, sr * 1.6, sr * 0.55, 0.15, 0, TAU); c.fill();
    c.fillStyle = '#9a9aac'; c.beginPath(); c.ellipse(sx, sy - sr * 0.12, sr * 1.4, sr * 0.38, 0.15, 0, TAU); c.fill();
    c.fillStyle = '#7ad0ff'; c.beginPath(); c.ellipse(sx, sy - sr * 0.35, sr * 0.55, sr * 0.38, 0.15, Math.PI, TAU); c.fill();
    for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#ffd400' : '#ff3030'; c.beginPath(); c.arc(sx + Math.cos(0.15) * (i - 3) * sr * 0.4, sy + Math.sin(0.15) * (i - 3) * sr * 0.4 + sr * 0.18, sr * 0.07, 0, TAU); c.fill(); }
    // explosions
    for (const [x, y, s] of [[0.68, 0.6, 1], [0.45, 0.12, 0.6]]) { const ex = W * x, ey = H * y, er = H * 0.07 * s; const g = c.createRadialGradient(ex, ey, 0, ex, ey, er); g.addColorStop(0, '#fff'); g.addColorStop(0.3, '#ffd400'); g.addColorStop(0.7, 'rgba(255,90,0,.7)'); g.addColorStop(1, 'rgba(255,0,0,0)'); c.fillStyle = g; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = er * (i % 2 ? 0.55 : 1.15); c.lineTo(ex + Math.cos(a) * rr, ey + Math.sin(a) * rr); } c.fill(); }
  }
  const PICS = [
    { id: 'grot', name: 'Gubbinz', n: 20, art: rowsArt(GROT, { b: '#7ec8ff', k: '#1a1a1a', g: '#5aac2c', d: '#3a7a1a', r: '#e10600', w: '#ffffff', n: '#8a5a2a', y: '#ffd400' }) },
    { id: 'ork', name: 'Robot Boss', n: 20, art: rowsArt(ORK, { o: '#ff9a3a', k: '#1a1a1a', s: '#a4aebe', h: '#eef2f8', d: '#5a6474', r: '#ff2010', y: '#ffe060', w: '#ffffff', n: '#2a3a8a', c: '#7ad0ff' }) },
    { id: 'pod', name: 'Peapod Racer', n: 20, art: rowsArt(POD, { y: '#e8c070', u: '#d0a050', k: '#1a1a1a', s: '#a0a0b0', h: '#e0e0e8', r: '#e10600', f: '#ffd400', o: '#ff8a00', g: '#5aac2c', c: '#505060', b: '#7ad0ff' }) },
    { id: 'cube', name: "Rubrick's Cube", n: 32, art: (c, n) => { const t = document.createElement('canvas'); t.width = t.height = 24; cubeArt(t.getContext('2d'), 24); c.fillStyle = '#1e1e50'; c.fillRect(0, 0, n, n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { c.fillStyle = (x + y) % 2 ? '#24245a' : '#1e1e50'; c.fillRect(x, y, 1, 1); } c.drawImage(t, 4, 4); } },
    { id: 'space', name: 'Space!', n: 24, art: spaceArt },
    { id: 'sunset', name: 'Space Sunset', paint: sunsetScene },
    { id: 'battle', name: 'Space Battle', paint: battleScene },
  ];
  // render a picture into a w x h canvas (pixel art is scaled up crisply, centred, sides filled with its edge colour)
  function picture(p, w, h) {
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h));
    const c = cv.getContext('2d');
    if (p.paint) { p.paint(c, cv.width, cv.height); return cv; }
    const src = document.createElement('canvas'); src.width = src.height = p.n; p.art(src.getContext('2d'), p.n);
    const sc = src.getContext('2d'), side = Math.min(cv.width, cv.height), ox = (cv.width - side) / 2, oy = (cv.height - side) / 2;
    if (ox > 0.5 || oy > 0.5) { // extend the edge colours
      const l = sc.getImageData(0, 0, 1, p.n).data, r = sc.getImageData(p.n - 1, 0, 1, p.n).data;
      for (let y = 0; y < p.n; y++) { const y0 = oy + y * side / p.n, hh = side / p.n + 1; c.fillStyle = `rgb(${l[y * 4]},${l[y * 4 + 1]},${l[y * 4 + 2]})`; c.fillRect(0, y0, ox + 1, hh); c.fillStyle = `rgb(${r[y * 4]},${r[y * 4 + 1]},${r[y * 4 + 2]})`; c.fillRect(ox + side - 1, y0, ox + 1, hh); }
    }
    c.imageSmoothingEnabled = false; c.drawImage(src, ox, oy, side, side);
    return cv;
  }
  JG.puzzlePics = { PICS, picture };

  JG.css('puzzle', `
.jgsl{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--face)}
.jgsl-top{flex:none;display:flex;align-items:center;justify-content:space-between;gap:6px;margin:4px;padding:4px 6px;border:2px solid;border-color:#808080 #fff #fff #808080}
.jgsl-top .lcdnum b{width:13px;height:22px;line-height:22px;font-size:17px;animation:none}
.jgsl-top .jgsl-face.btn{width:32px;height:32px;padding:0!important;display:flex;align-items:center;justify-content:center;min-width:32px;flex:none}
.jgsl-top .jgsl-face svg{width:22px!important;height:22px!important;display:block}
.jgsl-mid{flex:1;display:flex;align-items:center;gap:4px;font:11px var(--ui);min-width:0;justify-content:center;text-align:center}
.jgsl-board{flex:1;position:relative;min-height:0}
.jgsl-board .jgcv{touch-action:none}
`);
  const FACE = '<svg viewBox="0 0 32 32"><path d="M8 13L1 8v10zM24 13l7-5v10z" fill="#5aac2c" stroke="#000"/><circle cx="16" cy="16" r="10" fill="#5aac2c" stroke="#000"/><rect x="10" y="12" width="4" height="4" fill="#e10600" stroke="#000" stroke-width=".6"/><rect x="18" y="12" width="4" height="4" fill="#e10600" stroke="#000" stroke-width=".6"/><path d="M10 20q6 5 12 0" fill="#fff" stroke="#000"/></svg>';
  const lcd = n => String(Math.max(0, Math.min(999, n | 0))).padStart(3, '0').split('').map(d => `<b>${d}</b>`).join('');

  // ================================================================ SLIDER 15
  JG.mod('slide', G => {
    const host = G.host;
    let opts = Object.assign({ n: 4, pic: 'numbers', nums: true }, G.store.get('opts', {}));
    const save = () => G.store.set('opts', opts);
    host.innerHTML = `<div class="jgsl"><div class="jgsl-top"><span class="lcdnum jgsl-moves">${lcd(0)}</span><span class="jgsl-mid"></span><button class="btn jgsl-face" type="button" title="Shuffle">${FACE}</button><span class="jgsl-mid"></span><span class="lcdnum jgsl-time">${lcd(0)}</span></div><div class="jgsl-board"></div></div>`;
    const boardEl = host.querySelector('.jgsl-board'), movesEl = host.querySelector('.jgsl-moves'), timeEl = host.querySelector('.jgsl-time');
    host.querySelector('.jgsl-face').addEventListener('click', () => newGame());
    const C = G.canvas(boardEl, () => { dirty = true; picCache = null; });
    G.focusEl = C.cv;
    let N = 4, arr = [], pos = [], moves = 0, time = 0, started = false, solved = false, dave = false, daveWarned = false, dirty = true, picCache = null, picKey = '', anim = new Map(), flash = 0;
    const scores = () => JG.Scores('slide' + N, { lower: true, fmt: fmtT, label: 'Time', title: `Slider 15 Best Times (${N} x ${N})`, max: 360000 });
    // online races (mp.js): the same shuffle (from the shared seed) for everybody; first to put it back in order wins
    let race = null, raceN = 4;
    function newGame(daveMode, rseed) {
      const seeded = typeof rseed === 'number';
      if (!seeded && race && race.active) { Desk.toast('Slider 15', "You're in a race! Keep sliding.", 2500); return; }
      if (seeded) daveMode = false;
      N = daveMode ? 4 : seeded ? raceN : opts.n; dave = !!daveMode; daveWarned = false;
      const rnd = seeded ? JG.rng(rseed) : Math.random;
      arr = []; for (let i = 1; i < N * N; i++) arr.push(i); arr.push(0);
      if (dave) { arr[13] = 15; arr[14] = 14; }
      else { // random walk of the gap: always solvable
        let b = N * N - 1, last = -1;
        for (let k = 0; k < N * N * 40 || isSolved(); k++) {
          const opts2 = nbrs(b).filter(x => x !== last); const t = opts2[(rnd() * opts2.length) | 0];
          arr[b] = arr[t]; arr[t] = 0; last = b; b = t;
        }
      }
      moves = 0; time = 0; started = false; solved = false; anim.clear(); flash = 0; dirty = true; picCache = null;
      update(); G.focus();
      G.w.setTitle(dave ? "Slider 15 - Dave's Puzzle" : 'Slider 15');
    }
    const nbrs = i => { const x = i % N, y = (i / N) | 0, o = []; if (x > 0) o.push(i - 1); if (x < N - 1) o.push(i + 1); if (y > 0) o.push(i - N); if (y < N - 1) o.push(i + N); return o; };
    const isSolved = () => { for (let i = 0; i < N * N - 1; i++) if (arr[i] !== i + 1) return false; return true; };
    function update() {
      movesEl.innerHTML = lcd(moves); timeEl.innerHTML = lcd(time);
      const best = G.store.get('bestmoves' + N, 0);
      G.status(solved ? `Solved in ${moves} move${moves === 1 ? '' : 's'} and ${fmtT(time)}!` : `${N} x ${N}${dave ? " (Dave's Puzzle)" : ''}\u2003Moves: ${moves}\u2003${best ? 'Fewest moves: ' + best : 'Click a tile next to the gap'}`);
    }
    function slideFrom(i) { // slide tile i (and any between it and the gap) towards the gap
      if (solved) return false;
      const b = arr.indexOf(0), bx = b % N, by = (b / N) | 0, x = i % N, y = (i / N) | 0;
      if (i === b || (x !== bx && y !== by)) return false;
      const step = x === bx ? (y < by ? -N : N) : (x < bx ? -1 : 1);
      let g = b;
      while (g !== i) { const t = g + step; anim.set(arr[t], { from: t, t: 0 }); arr[g] = arr[t]; arr[t] = 0; g = t; moves++; }
      if (!started) started = true;
      G.sfx('click'); dirty = true; saver.save();
      if (race && race.active && !isSolved()) { let k = 0; for (let j = 0; j < N * N - 1; j++) if (arr[j] === j + 1) k++; race.progress(k / (N * N - 1), `${k}/${N * N - 1}`); }
      if (isSolved()) win();
      else if (dave && moves >= 100 && !daveWarned) { daveWarned = true; G.timeout(daveExplain, 400); }
      update();
      return true;
    }
    function win() {
      solved = true; flash = 1.5; G.sfx('solve'); G.secret('games.slide.solve');
      if (race && race.active) { race.progress(1, 'solved'); race.done({ ok: true, score: moves }); return; }
      const bm = G.store.get('bestmoves' + N, 0); if (!bm || moves < bm) G.store.set('bestmoves' + N, moves);
      G.timeout(() => scores().submit(Math.max(1, Math.round(time))), 900);
    }
    function daveExplain() {
      G.secret('games.slide.loyd');
      G.msg("Dave's Puzzle", "Give up? Good, because it CAN'T be done!\n\nDave swapped the 14 and the 15. Every slide moves the gap one square, so the tiles can only ever be rearranged into half of all the possible orders. Swapping just two tiles puts the puzzle into the OTHER half. You could slide forever (Dave did, on the bus) and it would never come out.\n\nA puzzle man in America offered a big cash prize for solving it back in the 1880s. Nobody ever claimed it. Dave says he \"nearly\" did.", 'info');
    }
    G.keys = { down(ev) {
      if (ev.ctrlKey || ev.altKey) return false;
      const b = arr.indexOf(0), bx = b % N, by = (b / N) | 0, m = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [1, 0], ArrowRight: [-1, 0] }[ev.key];
      if (!m) return false;
      const x = bx + m[0], y = by + m[1]; if (x >= 0 && x < N && y >= 0 && y < N) slideFrom(y * N + x);
      return true;
    } };
    let geo = null;
    function layout() {
      const W = C.W, H = C.H, S = Math.floor(Math.min(W, H) - 16), x0 = Math.floor((W - S) / 2), y0 = H > W * 1.25 ? 8 : Math.floor((H - S) / 2);
      geo = { S, x0, y0, pad: 4, cs: (S - 8) / N };
    }
    G.on(C.cv, 'pointerdown', ev => {
      ev.preventDefault(); G.focus(); if (!geo) return;
      const r = DesktopSurface.rect(C.cv), point = DesktopSurface.point(ev.clientX, ev.clientY), x = point.x - r.left - geo.x0 - geo.pad, y = point.y - r.top - geo.y0 - geo.pad;
      const cx = Math.floor(x / geo.cs), cy = Math.floor(y / geo.cs);
      if (cx >= 0 && cx < N && cy >= 0 && cy < N) slideFrom(cy * N + cx);
    });
    function picCanvas() {
      const p = PICS.find(q => q.id === opts.pic); if (!p) return null;
      const key = p.id + '|' + geo.S + '|' + C.dpr;
      if (picCache && picKey === key) return picCache;
      picKey = key; picCache = picture(p, (geo.S - 8) * C.dpr, (geo.S - 8) * C.dpr); return picCache;
    }
    function draw() {
      layout();
      const c = C.c, { S, x0, y0, pad, cs } = geo;
      c.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      c.fillStyle = '#c0c0c0'; c.fillRect(0, 0, C.W, C.H);
      // sunken tray
      c.fillStyle = '#808080'; c.fillRect(x0, y0, S, S);
      c.fillStyle = '#404040'; c.fillRect(x0, y0, S, 2); c.fillRect(x0, y0, 2, S);
      c.fillStyle = '#fff'; c.fillRect(x0, y0 + S - 2, S, 2); c.fillRect(x0 + S - 2, y0, 2, S);
      const pic = opts.pic !== 'numbers' ? picCanvas() : null;
      const done = solved && flash < 1.2;
      for (let i = 0; i < N * N; i++) {
        let v = arr[i]; if (!v && !done) continue; if (!v) v = N * N;
        let gx = i % N, gy = (i / N) | 0;
        const a = anim.get(v);
        if (a) { const t = Math.min(1, a.t / 0.09), e = 1 - (1 - t) * (1 - t); const fx = a.from % N, fy = (a.from / N) | 0; gx = fx + (gx - fx) * e; gy = fy + (gy - fy) * e; }
        const x = x0 + pad + gx * cs + 1, y = y0 + pad + gy * cs + 1, s = cs - 2;
        const home = v - 1, hx = home % N, hy = (home / N) | 0;
        if (pic) {
          const sp = pic.width / N;
          c.drawImage(pic, hx * sp, hy * sp, sp, sp, x, y, s, s);
          c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x, y, s, 1.5); c.fillRect(x, y, 1.5, s);
          c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x, y + s - 1.5, s, 1.5); c.fillRect(x + s - 1.5, y, 1.5, s);
          if (opts.nums && !done) { const fs = Math.max(9, cs * 0.2); c.font = `bold ${fs}px Tahoma, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x + 2, y + 2, c.measureText(v).width + 4, fs + 2); c.fillStyle = '#fff'; c.fillText(v, x + 4, y + 3); }
        } else {
          c.fillStyle = '#c0c0c0'; c.fillRect(x, y, s, s);
          c.fillStyle = '#fff'; c.fillRect(x, y, s, 2); c.fillRect(x, y, 2, s);
          c.fillStyle = '#000'; c.fillRect(x, y + s - 1, s, 1); c.fillRect(x + s - 1, y, 1, s);
          c.fillStyle = '#808080'; c.fillRect(x + 1, y + s - 2, s - 2, 1); c.fillRect(x + s - 2, y + 1, 1, s - 2);
          const right = !dave && v === home + 1 && i === home;
          c.font = `bold ${Math.round(cs * 0.4)}px Tahoma, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillStyle = '#fff'; c.fillText(v, x + s / 2 + 1, y + s / 2 + 2);
          c.fillStyle = right ? '#000080' : '#800000'; c.fillText(v, x + s / 2, y + s / 2 + 1);
        }
      }
      if (flash > 0 && solved) { c.fillStyle = `rgba(255,255,255,${Math.max(0, flash - 1) * 0.8})`; c.fillRect(x0, y0, S, S); }
    }
    G.loop((dt, active) => {
      if (started && !solved && active) { const before = Math.floor(time); time += dt; if (Math.floor(time) !== before) update(); }
      for (const [k, a] of anim) { a.t += dt; dirty = true; if (a.t > 0.09) anim.delete(k); }
      if (flash > 0) { flash -= dt; dirty = true; }
      if (dirty) { dirty = false; draw(); }
    });
    G.newGame = () => newGame();
    const setN = n => { opts.n = n; save(); newGame(); };
    const setPic = id => { opts.pic = id; save(); picCache = null; dirty = true; };
    G.helpKey = () => help();
    const help = () => G.help([
      ['How to play', 'Slide the tiles back into order: 1, 2, 3... from the top left, with the gap in the bottom right corner.\n\nClick any tile in the same row or column as the gap and it slides along, pushing any tiles in between. You can also use the arrow keys: the tile next to the gap moves into it.'],
      ['Pictures', 'Options > Picture swaps the numbers for one of Jack\'s pixel pictures. Turn on "Show numbers" if you get stuck.\n\nTip: do the top row first, then the left column, then the rest is a smaller puzzle!'],
      ["Dave's Puzzle", 'Dave says he can solve this one. It looks easy: only the 14 and 15 are the wrong way round...'],
    ]);
    G.menu([
      ['Game', () => [
        { label: 'Shuffle', key: 'F2', act: () => newGame() },
        ...(window.MP ? [MP.menuItem('race.slide', { n: N })] : []), '-',
        ...[3, 4, 5].map(n => ({ label: `${n} x ${n}${n === 4 ? ' (classic)' : n === 3 ? ' (easy)' : ' (hard)'}`, rad: !dave && N === n, act: () => setN(n) })),
        { label: "Dave's Puzzle", rad: dave, act: () => newGame(true) }, '-',
        { label: 'Give Up', dis: !dave || solved, act: daveExplain },
        { label: 'Best Times...', act: () => scores().show() }, '-',
        { label: 'Exit', act: () => G.w.close() },
      ]],
      ['Options', () => [
        { label: 'Picture', sub: [{ label: 'Numbers', rad: opts.pic === 'numbers', act: () => setPic('numbers') }, '-', ...PICS.map(p => ({ label: p.name, rad: opts.pic === p.id, act: () => setPic(p.id) }))] },
        { label: 'Show numbers on pictures', chk: opts.nums, act: () => { opts.nums = !opts.nums; save(); dirty = true; } },
      ]],
      ['Help', () => [{ label: 'Help Topics', key: 'F1', act: help }, '-', { label: 'About Slider 15', act: () => G.about({ ver: 'Version 2.1', blurb: 'The plastic sliding puzzle from the Christmas cracker, except none of the tiles fall out.', credits: [['Programming', 'Jack'], ['Pixel pictures', 'Jack (with the mouse, no cheating)'], ['Puzzle tester', 'Mom (3x3 champion)'], ['Impossible puzzle', 'Dave'], ['Moral support', 'Gubbinz'], ['Cracker supplier', 'Gran']] }) }]],
    ]);
    if (window.MP) race = MP.hook('games.slide', G.w, { start(seed, o, R, preview) { raceN = [3, 4, 5].includes(o && o.n) ? o.n : 4; newGame(false, seed); if (preview) solved = true; update(); } });
    G.dbg = { solveAlmost() { arr = []; for (let i = 1; i < N * N; i++) arr.push(i); arr.push(0); arr[N * N - 1] = arr[N * N - 2]; arr[N * N - 2] = 0; solved = false; started = true; dave = false; dirty = true; } };
    // the puzzle in progress is saved (js/gamesave.js): every tile, moves and time. Not an online race (that's live).
    const saver = G.saver(() => (race && race.active) ? undefined : (!started || solved) ? null : { N, arr: arr.slice(), moves, time: Math.floor(time), dave, dw: daveWarned }, { v: 1, live: true });
    function resume() {
      const s = saver.load(); if (!s || ![3, 4, 5].includes(s.N) || !Array.isArray(s.arr) || s.arr.length !== s.N * s.N || new Set(s.arr).size !== s.N * s.N || s.arr.some(v => !(v >= 0 && v < s.N * s.N))) return false;
      N = s.N; arr = s.arr.slice(); moves = s.moves | 0; time = Math.max(0, +s.time || 0); dave = !!s.dave; daveWarned = !!s.dw;
      started = true; solved = false; anim.clear(); flash = 0; dirty = true; picCache = null;
      update(); G.focus();
      G.w.setTitle(dave ? "Slider 15 - Dave's Puzzle" : 'Slider 15');
      return true;
    }
    if (!resume()) newGame(opts.dave);
  });

  // ================================================================ JIGSAW 98
  JG.mod('jigsaw', G => {
    const host = G.host;
    G.fit();
    let opts = Object.assign({ count: 24, pic: 'sunset', ghost: true }, G.store.get('opts', {}));
    const save = () => G.store.set('opts', opts);
    const C = G.canvas(host, () => { relayout(); });
    G.focusEl = C.cv;
    const GRIDS = { 12: [4, 3], 24: [6, 4], 48: [8, 6] };
    let cols = 6, rows = 4, pieces = [], edgesH = [], edgesV = [], time = 0, started = false, done = false, drag = null, geo = null, img = null, dirty = true, flash = 0;
    const scores = () => JG.Scores('jigsaw' + opts.count, { lower: true, fmt: fmtT, label: 'Time', title: `Jigsaw 98 Best Times (${opts.count} pieces)`, max: 360000 });
    function newGame() {
      [cols, rows] = GRIDS[opts.count] || GRIDS[24];
      edgesH = []; edgesV = []; // tab directions (+1/-1) of each internal edge
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols - 1; x++) edgesV[y * cols + x] = Math.random() < 0.5 ? 1 : -1;
      for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols; x++) edgesH[y * cols + x] = Math.random() < 0.5 ? 1 : -1;
      pieces = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) pieces.push({ c: x, r: y, x: 0, y: 0, placed: false, cv: null, path: null });
      time = 0; started = false; done = false; flash = 0; img = null;
      relayout(true); scatter(); dirty = true; status();
    }
    // the four sides of piece (c, r): 0 = flat, +1 = tab out, -1 = blank in
    function sides(p) {
      const top = p.r === 0 ? 0 : -edgesH[(p.r - 1) * cols + p.c], bottom = p.r === rows - 1 ? 0 : edgesH[p.r * cols + p.c];
      const left = p.c === 0 ? 0 : -edgesV[p.r * cols + p.c - 1], right = p.c === cols - 1 ? 0 : edgesV[p.r * cols + p.c];
      return [top, right, bottom, left];
    }
    function edge(path, x0, y0, x1, y1, s) {
      if (!s) { path.lineTo(x1, y1); return; }
      const dx = x1 - x0, dy = y1 - y0, nx = dy, ny = -dx; // outward normal for a clockwise path (scaled by length)
      const P = (t, u) => [x0 + dx * t + nx * u * s, y0 + dy * t + ny * u * s];
      const seg = [[0.36, 0], [0.42, 0, 0.45, 0.06, 0.40, 0.12], [0.35, 0.20, 0.41, 0.28, 0.50, 0.28], [0.59, 0.28, 0.65, 0.20, 0.60, 0.12], [0.55, 0.06, 0.58, 0, 0.64, 0]];
      let p = P(seg[0][0], seg[0][1]); path.lineTo(p[0], p[1]);
      for (let i = 1; i < seg.length; i++) { const q = seg[i], a = P(q[0], q[1]), b = P(q[2], q[3]), d = P(q[4], q[5]); path.bezierCurveTo(a[0], a[1], b[0], b[1], d[0], d[1]); }
      path.lineTo(x1, y1);
    }
    function piecePath(p, cw, ch, m) {
      const [t, r, b, l] = sides(p), path = new Path2D();
      path.moveTo(m, m); edge(path, m, m, m + cw, m, t); edge(path, m + cw, m, m + cw, m + ch, r); edge(path, m + cw, m + ch, m, m + ch, b); edge(path, m, m + ch, m, m, l); path.closePath();
      return path;
    }
    function relayout(keep) {
      const W = C.W, H = C.H; if (!W || !H) return;
      const aspect = 4 / 3, portrait = H > W * 1.05;
      let bw, bh, bx, by;
      if (portrait) { bw = W * 0.92; bh = bw / aspect; if (bh > H * 0.48) { bh = H * 0.48; bw = bh * aspect; } bx = (W - bw) / 2; by = 10; }
      else { bh = H * 0.62; bw = bh * aspect; if (bw > W * 0.6) { bw = W * 0.6; bh = bw / aspect; } bx = (W - bw) / 2; by = (H - bh) / 2; }
      const cw = bw / cols, ch = bh / rows, m = Math.min(cw, ch) * 0.3;
      const changed = !geo || Math.abs(geo.bw - bw) > 0.5 || geo.dpr !== C.dpr;
      geo = { W, H, bw, bh, bx, by, cw, ch, m, portrait, dpr: C.dpr };
      if (changed || !img) { img = picture(PICS.find(q => q.id === opts.pic) || PICS[5], bw * C.dpr, bh * C.dpr); pieces.forEach(p => { p.cv = null; }); }
      pieces.forEach(p => { // keep loose pieces on screen
        if (p.placed) return;
        p.x = clamp(p.x, -bx / cw - 0.2, (W - bx) / cw - 0.9); p.y = clamp(p.y, -by / ch - 0.2, (H - by) / ch - 0.9);
      });
      dirty = true;
    }
    function scatter() {
      if (!geo) return;
      const { W, H, bx, by, bw, bh, cw, ch, portrait } = geo;
      const spots = [];
      // candidate spots outside the board where possible
      for (let i = 0; i < 400; i++) {
        const sx = Math.random() * (W - cw * 1.1) + cw * 0.05, sy = Math.random() * (H - ch * 1.1) + ch * 0.05;
        const inside = sx + cw > bx && sx < bx + bw && sy + ch > by && sy < by + bh;
        spots.push([sx, sy, inside]);
      }
      const outside = spots.filter(s => !s[2]), use = outside.length > pieces.length * 2 ? outside : spots;
      JG.shuffle(pieces.filter(p => !p.placed)).forEach((p, i) => { const s = use[i % use.length]; p.x = (s[0] - bx) / cw; p.y = (s[1] - by) / ch; });
      if (portrait) pieces.forEach(p => { if (!p.placed && p.y * ch + by < by + bh) p.y = (bh + 8 + Math.random() * Math.max(10, H - by - bh - ch - 10)) / ch; });
      // shuffle the draw order too
      const loose = JG.shuffle(pieces.filter(p => !p.placed)); pieces = [...pieces.filter(p => p.placed), ...loose];
      dirty = true;
    }
    function sprite(p) {
      if (p.cv) return p.cv;
      const { cw, ch, m, dpr } = geo, cv = document.createElement('canvas');
      cv.width = Math.ceil((cw + m * 2) * dpr); cv.height = Math.ceil((ch + m * 2) * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      p.path = piecePath(p, cw, ch, m);
      c.save(); c.clip(p.path);
      c.drawImage(img, (p.c * cw - m) * dpr, (p.r * ch - m) * dpr, (cw + m * 2) * dpr, (ch + m * 2) * dpr, 0, 0, cw + m * 2, ch + m * 2);
      // bevel: light top-left, dark bottom-right
      c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.45)'; c.translate(1, 1); c.stroke(p.path); c.translate(-2, -2); c.strokeStyle = 'rgba(255,255,255,.45)'; c.stroke(p.path);
      c.restore();
      c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,.6)'; c.stroke(p.path);
      p.cv = cv; return cv;
    }
    function status() {
      const left = pieces.filter(p => !p.placed).length;
      G.status(done ? `Finished in ${fmtT(time)}! Press F2 for another jigsaw.` : `${pieces.length - left} of ${pieces.length} pieces in place\u2003Time: ${fmtT(time)}`);
    }
    const toScreen = p => [geo.bx + p.x * geo.cw - geo.m, geo.by + p.y * geo.ch - geo.m];
    function hit(x, y) {
      const c = C.c;
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i]; if (p.placed) continue; sprite(p);
        const [sx, sy] = toScreen(p);
        if (x < sx || y < sy || x > sx + geo.cw + geo.m * 2 || y > sy + geo.ch + geo.m * 2) continue;
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); const inP = c.isPointInPath(p.path, x - sx, y - sy); c.restore();
        if (inP) return p;
      }
      return null;
    }
    G.on(C.cv, 'pointerdown', ev => {
      ev.preventDefault(); G.focus(); if (!geo || done) return;
      const r = DesktopSurface.rect(C.cv), point = DesktopSurface.point(ev.clientX, ev.clientY), x = point.x - r.left, y = point.y - r.top, p = hit(x, y);
      if (!p) return;
      pieces = pieces.filter(q => q !== p); pieces.push(p);
      drag = { p, dx: x - toScreen(p)[0], dy: y - toScreen(p)[1], id: ev.pointerId };
      try { C.cv.setPointerCapture(ev.pointerId); } catch (e) {}
      if (!started) started = true;
      G.sfx('click'); dirty = true;
    });
    G.on(C.cv, 'pointermove', ev => {
      if (!drag || ev.pointerId !== drag.id) return;
      const r = DesktopSurface.rect(C.cv), point = DesktopSurface.point(ev.clientX, ev.clientY), x = point.x - r.left - drag.dx + geo.m, y = point.y - r.top - drag.dy + geo.m;
      drag.p.x = clamp((x - geo.bx) / geo.cw, -geo.bx / geo.cw - 0.4, (geo.W - geo.bx) / geo.cw - 0.6);
      drag.p.y = clamp((y - geo.by) / geo.ch, -geo.by / geo.ch - 0.4, (geo.H - geo.by) / geo.ch - 0.6);
      dirty = true;
    });
    const drop = ev => {
      if (!drag || ev.pointerId !== drag.id) return;
      const p = drag.p; drag = null;
      if (Math.abs(p.x - p.c) < 0.28 && Math.abs(p.y - p.r) < 0.28) {
        p.x = p.c; p.y = p.r; p.placed = true; pieces = [p, ...pieces.filter(q => q !== p)];
        G.sfx('turn');
        if (pieces.every(q => q.placed)) finish();
      }
      dirty = true; status(); jsaver.save();
    };
    G.on(C.cv, 'pointerup', drop); G.on(C.cv, 'pointercancel', drop);
    function finish() {
      done = true; flash = 1.6; G.sfx('solve'); G.secret('games.jig.done'); status();
      G.timeout(() => scores().submit(Math.max(1, Math.round(time))), 1500);
    }
    function draw() {
      const c = C.c, { W, H, bx, by, bw, bh } = geo;
      c.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      // the table: a dark baize
      const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, '#2c6a5a'); g.addColorStop(1, '#123a32');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // the board tray
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
      c.fillStyle = '#0c2a24'; c.fillRect(bx, by, bw, bh);
      if (opts.ghost && !done) { c.globalAlpha = 0.22; c.drawImage(img, bx, by, bw, bh); c.globalAlpha = 1; }
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      if (done) { c.drawImage(img, bx, by, bw, bh); }
      for (const p of pieces) {
        if (done) break;
        const cv = sprite(p), [sx, sy] = toScreen(p), lift = drag && drag.p === p;
        if (!p.placed) { c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = lift ? 14 : 4; c.shadowOffsetX = lift ? 6 : 2; c.shadowOffsetY = lift ? 8 : 2; }
        c.drawImage(cv, sx - (lift ? 2 : 0), sy - (lift ? 3 : 0), cv.width / C.dpr, cv.height / C.dpr);
        if (!p.placed) c.restore();
      }
      if (flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(0.6, flash * 0.4)})`; c.fillRect(bx, by, bw, bh); }
      if (done) { c.font = `bold ${Math.max(16, bh * 0.08)}px Tahoma, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillText('Well done!', bx + bw / 2 + 2, by + bh + Math.min(30, (H - by - bh) / 2) + 2); c.fillStyle = '#ffd400'; c.fillText('Well done!', bx + bw / 2, by + bh + Math.min(30, (H - by - bh) / 2)); }
    }
    G.loop((dt, active) => {
      if (!geo) { relayout(); if (!geo) return; }
      if (started && !done && active) { const b = Math.floor(time); time += dt; if (Math.floor(time) !== b) status(); }
      if (flash > 0) { flash -= dt; dirty = true; }
      if (dirty) { dirty = false; draw(); }
    });
    G.keys = { down(ev) { if (ev.key === ' ') { opts.ghost = !opts.ghost; save(); dirty = true; return true; } return false; } };
    G.newGame = newGame;
    G.dbg = { place(n) { pieces.filter(p => !p.placed).slice(0, n).forEach(p => { p.x = p.c + 0.1; p.y = p.r - 0.1; }); dirty = true; }, pieceAt(i) { const p = pieces.filter(q => !q.placed).reverse()[i]; if (!p) return null; const [sx, sy] = toScreen(p), R = DesktopSurface.rect(C.cv), from = DesktopSurface.client(R.left + sx + geo.m + geo.cw / 2, R.top + sy + geo.m + geo.ch / 2), to = DesktopSurface.client(R.left + geo.bx + (p.c + 0.5) * geo.cw, R.top + geo.by + (p.r + 0.5) * geo.ch); return { x: from.x, y: from.y, tx: to.x, ty: to.y }; } };
    G.helpKey = () => help();
    const help = () => G.help([
      ['How to play', 'Drag the pieces onto the dark board. When a piece is close to its proper place it clicks in and stays put.\n\nThe faint picture on the board shows where everything goes. Turn it off in Options (or press Space) if you think you are too good for it.'],
      ['Pictures', 'Options > Picture has Jack\'s pixel art and two big paintings. Game > Pieces sets how many pieces: 12 is easy, 48 takes a rainy afternoon.'],
      ['Small screens', 'Drag pieces with the mouse. On a small window the pile is under the board.'],
    ]);
    G.menu([
      ['Game', () => [
        { label: 'New Jigsaw', key: 'F2', act: newGame },
        { label: 'Pieces', sub: [12, 24, 48].map(n => ({ label: n + ' pieces', rad: opts.count === n, act: () => { opts.count = n; save(); newGame(); } })) },
        { label: 'Scatter Pieces', dis: done, act: scatter }, '-',
        { label: 'Best Times...', act: () => scores().show() }, '-',
        { label: 'Exit', act: () => G.w.close() },
      ]],
      ['Options', () => [
        { label: 'Picture', sub: PICS.map(p => ({ label: p.name, rad: opts.pic === p.id, act: () => { opts.pic = p.id; save(); newGame(); } })) },
        { label: 'Show Picture on Board', key: 'Space', chk: opts.ghost, act: () => { opts.ghost = !opts.ghost; save(); dirty = true; } },
      ]],
      ['Help', () => [{ label: 'Help Topics', key: 'F1', act: help }, '-', { label: 'About Jigsaw 98', act: () => G.about({ ver: 'Version 1.0', blurb: 'Jigsaws with every piece present and correct. Unlike the 1000-piece lighthouse in the loft, which is missing 3 bits of sky.', credits: [['Programming', 'Jack'], ['Wobbly piece shapes', 'Jack (and a protractor)'], ['Paintings', 'Jack'], ['Lost piece finder', 'Mom'], ['Vacuum operator', 'Dad (sorry)'], ['Tester', 'Gran']] }) }]],
    ]);
    // the jigsaw in progress is saved (js/gamesave.js): the picture, the cut of every piece, where every loose piece is
    // lying (and which are in), and the time
    const jsaver = G.saver(() => (!started || done || !pieces.length) ? null : { count: opts.count, pic: opts.pic, cols, rows, eh: edgesH, ev: edgesV, p: pieces.map(p => [p.c, p.r, Math.round(p.x * 1000) / 1000, Math.round(p.y * 1000) / 1000, p.placed ? 1 : 0]), time: Math.floor(time) }, { v: 1, live: true });
    function resume() {
      const s = jsaver.load(); if (!s || !GRIDS[s.count] || !Array.isArray(s.p) || s.p.length !== s.cols * s.rows || !Array.isArray(s.eh) || !Array.isArray(s.ev)) return false;
      const [c0, r0] = GRIDS[s.count]; if (c0 !== s.cols || r0 !== s.rows) return false;
      if (new Set(s.p.map(q => q[1] * s.cols + q[0])).size !== s.p.length) return false;
      opts.count = s.count; if (PICS.find(q => q.id === s.pic)) opts.pic = s.pic; save();
      cols = s.cols; rows = s.rows; edgesH = s.eh; edgesV = s.ev;
      pieces = s.p.map(([c, r, x, y, pl]) => ({ c, r, x: +x || 0, y: +y || 0, placed: !!pl, cv: null, path: null }));
      time = Math.max(0, +s.time || 0); started = true; done = false; flash = 0; img = null;
      relayout(true); dirty = true; status();
      return true;
    }
    if (!resume()) newGame();
  });
})();

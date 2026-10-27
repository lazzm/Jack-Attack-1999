/* Jack Jong for JackOS 98 (lazy loaded by apps-games.js): Shanghai-style tile matching.
 * 144 original tiles drawn on canvas (Orks, Dice and Cubes 1-9, four racing craft, three greenskin "dragons",
 * planets and floppy disks), stacked layouts, and deals that are always solvable (built by removing pairs). */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;
  const TAU = Math.PI * 2;
  const fmtT = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // ================================================================ layouts: [x, y, z] in tile units (halves allowed)
  const row = (P, y, x0, x1, z, step) => { for (let x = x0; x <= x1 + 1e-6; x += step || 1) P.push([x, y, z]); };
  const LAYOUTS = {
    dragon: { name: 'The Dragon (classic)', make() {
      const P = [];
      row(P, 0, 1, 12, 0); row(P, 1, 3, 10, 0); row(P, 2, 2, 11, 0); row(P, 3, 1, 12, 0); row(P, 4, 1, 12, 0); row(P, 5, 2, 11, 0); row(P, 6, 3, 10, 0); row(P, 7, 1, 12, 0);
      P.push([0, 3.5, 0], [13, 3.5, 0], [14, 3.5, 0]);
      for (let y = 1; y <= 6; y++) row(P, y, 4, 9, 1);
      for (let y = 2; y <= 5; y++) row(P, y, 5, 8, 2);
      for (let y = 3; y <= 4; y++) row(P, y, 6, 7, 3);
      P.push([6.5, 3.5, 4]);
      return P;
    } },
    pod: { name: 'Peapod Racer', make() {
      const P = [];
      for (const yt of [0, 6]) {
        for (const y of [yt, yt + 1]) { row(P, y, 6, 15, 0); row(P, y, 7, 14, 1); row(P, y, 8, 13, 2); }
        row(P, yt + 0.5, 9.5, 11.5, 3);
      }
      for (const y of [2.5, 3.5, 4.5]) row(P, y, 0, 3, 0);
      for (const y of [3, 4]) row(P, y, 0.5, 2.5, 1);
      P.push([1.5, 3.5, 2], [-1, 3.5, 0]);
      P.push([4, 1.5, 0], [5, 1, 0], [4, 5.5, 0], [5, 6, 0]);
      return P;
    } },
    fortress: { name: 'Fortress', make() {
      const P = [];
      for (let y = 0; y <= 6; y++) row(P, y, 0, 11, 0);
      for (let y = 0; y <= 6; y++) for (let x = 0; x <= 11; x++) if (x === 0 || x === 11 || y === 0 || y === 6) P.push([x, y, 1]);
      for (const [cx, cy, dx, dy] of [[0, 0, 1, 1], [11, 0, -1, 1], [0, 6, 1, -1], [11, 6, -1, -1]]) { P.push([cx, cy, 2], [cx + dx, cy, 2], [cx, cy + dy, 2], [cx, cy, 3]); }
      for (let y = 2; y <= 4; y++) row(P, y, 5, 6, 1);
      return P;
    } },
  };

  // ================================================================ the tile set: 34 kinds x 4, plus 4 planets + 4 floppies
  const SUITS = ['o', 'd', 'c']; // orks, dice, cubes
  function tileSet() {
    const pairs = [];
    for (const s of SUITS) for (let n = 1; n <= 9; n++) { pairs.push([s + n, s + n], [s + n, s + n]); }
    for (let i = 0; i < 4; i++) pairs.push(['p' + i, 'p' + i], ['p' + i, 'p' + i]);
    for (let i = 0; i < 3; i++) pairs.push(['g' + i, 'g' + i], ['g' + i, 'g' + i]);
    pairs.push(['pl0', 'pl1'], ['pl2', 'pl3'], ['fl0', 'fl1'], ['fl2', 'fl3']);
    return pairs;
  }
  const keyOf = t => t === 'gub' ? 'pl' : /^pl|^fl/.test(t) ? t.slice(0, 2) : t;
  const NAMES = { o: 'Robots', d: 'Dice', c: 'Cubes', p: ['Peapod Racer', 'Saucer', 'Rocket', 'Space Shuttle'], g: ['Alien', 'Blobbit', 'Mushroom'] };
  function tileName(t) {
    if (t === 'gub') return 'Gubbinz (a planet?!)';
    if (/^pl/.test(t)) return ['Ringed Planet', 'Red Planet', 'Blue Moon World', 'Green Gas Giant'][+t[2]] + ' (any planet matches)';
    if (/^fl/.test(t)) return ['Black Floppy', 'Blue Floppy', 'Red Floppy', 'Yellow Floppy'][+t[2]] + ' (any floppy matches)';
    if (t[0] === 'p') return NAMES.p[+t[1]];
    if (t[0] === 'g') return NAMES.g[+t[1]];
    return t.slice(1) + ' of ' + NAMES[t[0]];
  }

  // ================================================================ tile faces (drawn in a 60 x 78 box)
  const FW = 60, FH = 78;
  const PIPS = { 1: [[30, 42]], 2: [[30, 26], [30, 58]], 3: [[18, 24], [30, 42], [42, 60]], 4: [[19, 28], [41, 28], [19, 56], [41, 56]], 5: [[19, 25], [41, 25], [30, 42], [19, 59], [41, 59]],
    6: [[19, 24], [41, 24], [19, 42], [41, 42], [19, 60], [41, 60]], 7: [[17, 20], [30, 27], [43, 34], [19, 50], [41, 50], [19, 65], [41, 65]], 8: [[19, 20], [41, 20], [19, 35], [41, 35], [19, 50], [41, 50], [19, 65], [41, 65]],
    9: [[15, 24], [30, 24], [45, 24], [15, 43], [30, 43], [45, 43], [15, 62], [30, 62], [45, 62]] };
  const PIPR = { 1: 17, 2: 12, 3: 10, 4: 10, 5: 8.5, 6: 8, 7: 7, 8: 7, 9: 7 };
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function orkHead(c, x, y, r) { // the "Robots" suit pip: a little tin robot head
    c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineWidth = Math.max(0.8, r * 0.09); c.strokeStyle = '#10202a';
    c.beginPath(); c.moveTo(0, -r * 0.62); c.lineTo(0, -r * 0.95); c.stroke();
    c.fillStyle = '#ff3a2a'; c.beginPath(); c.arc(0, -r * 1.02, r * 0.16, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#e0a000'; c.fillRect(-r * 0.92, -r * 0.2, r * 0.22, r * 0.44); c.fillRect(r * 0.7, -r * 0.2, r * 0.22, r * 0.44);
    const g = c.createLinearGradient(-r * 0.7, -r * 0.6, r * 0.7, r * 0.6); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#b8c4d0'); g.addColorStop(1, '#5a6a7a');
    rr(c, -r * 0.72, -r * 0.62, r * 1.44, r * 1.24, r * 0.28); c.fillStyle = g; c.fill(); c.stroke();
    for (const s of [-1, 1]) { c.fillStyle = '#1a2a3a'; c.beginPath(); c.arc(s * r * 0.3, -r * 0.1, r * 0.25, 0, TAU); c.fill(); c.fillStyle = '#4ae0ff'; c.beginPath(); c.arc(s * r * 0.3, -r * 0.1, r * 0.16, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(s * r * 0.3 - r * 0.06, -r * 0.16, r * 0.06, 0, TAU); c.fill(); }
    c.fillStyle = '#1a2a3a'; rr(c, -r * 0.4, r * 0.24, r * 0.8, r * 0.2, r * 0.08); c.fill();
    c.fillStyle = '#9aa8b4'; for (let k = -1; k <= 1; k++) c.fillRect(k * r * 0.2 - r * 0.03, r * 0.26, r * 0.06, r * 0.16);
    c.restore();
  }
  function die(c, x, y, s, n, col, pip) {
    rr(c, x - s / 2, y - s / 2, s, s, s * 0.18); c.fillStyle = col; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#500'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)'; rr(c, x - s / 2 + 2, y - s / 2 + 2, s - 4, s * 0.3, s * 0.12); c.fill();
    const q = s * 0.27, P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[n];
    c.fillStyle = pip; for (const [a, b] of P) { c.beginPath(); c.arc(x + a * q, y + b * q, s * 0.1, 0, TAU); c.fill(); }
  }
  const CUBECOL = ['#e10600', '#1aa31a', '#2349b8', '#ff8a00', '#ffd400', '#e10600', '#1aa31a', '#2349b8', '#ff8a00'];
  function numeral(c, n, col) { c.font = 'bold 13px Arial, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = col; c.fillText(String(n), 4, 3); }
  function space(c) { rr(c, 7, 9, 46, 60, 6); const g = c.createLinearGradient(0, 9, 0, 69); g.addColorStop(0, '#0a0a3a'); g.addColorStop(1, '#2a1060'); c.fillStyle = g; c.fill(); c.fillStyle = '#fff'; for (const [x, y] of [[12, 15], [44, 20], [20, 62], [47, 58], [33, 13], [10, 40]]) c.fillRect(x, y, 1.5, 1.5); }
  function drawFace(c, t) {
    const s = t[0];
    if (t === 'gub') { // the secret tile
      space(c);
      c.save(); c.translate(30, 40);
      c.fillStyle = '#5aac2c'; c.strokeStyle = '#000'; c.lineWidth = 1;
      for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 8, -3); c.lineTo(sx * 19, -11); c.lineTo(sx * 10, 4); c.fill(); c.stroke(); }
      c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#e10600'; c.fillRect(-6, -4, 4, 4); c.fillRect(2, -4, 4, 4);
      c.fillStyle = '#fff'; c.fillRect(-5, 5, 10, 2.5);
      c.strokeStyle = 'rgba(200,240,255,.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -1, 16, 0, TAU); c.stroke();
      c.restore();
      c.font = 'bold 8px Arial'; c.textAlign = 'center'; c.fillStyle = '#ffd400'; c.fillText('GUBBINZ', 30, 66);
      return;
    }
    if (/^pl/.test(t)) {
      space(c); const i = +t[2], x = 30, y = 40;
      const cols = [['#ffcf7a', '#a0501a'], ['#ff7a5a', '#8a1a0a'], ['#7ac8ff', '#1a3a9a'], ['#9aff7a', '#1a6a2a']][i];
      if (i === 0) { c.strokeStyle = '#ffe6a0'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, 21, 6, -0.3, Math.PI, TAU); c.stroke(); }
      const g = c.createRadialGradient(x - 5, y - 5, 2, x, y, 14); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]); c.fillStyle = g; c.beginPath(); c.arc(x, y, 13, 0, TAU); c.fill();
      if (i === 0) { c.strokeStyle = '#ffe6a0'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, 21, 6, -0.3, 0, Math.PI); c.stroke(); }
      if (i === 1) { c.fillStyle = 'rgba(80,0,0,.4)'; c.beginPath(); c.arc(x + 4, y - 3, 3, 0, TAU); c.arc(x - 5, y + 5, 2, 0, TAU); c.fill(); }
      if (i === 2) { c.fillStyle = '#ddd'; c.beginPath(); c.arc(x + 15, y - 13, 4, 0, TAU); c.fill(); }
      if (i === 3) { c.save(); c.beginPath(); c.arc(x, y, 13, 0, TAU); c.clip(); c.fillStyle = 'rgba(0,60,0,.35)'; for (let k = -2; k <= 2; k++) c.fillRect(x - 14, y + k * 5, 28, 2); c.restore(); }
      return;
    }
    if (/^fl/.test(t)) {
      const i = +t[2], col = ['#2a2a2a', '#2349b8', '#c01010', '#e0b020'][i];
      rr(c, 10, 14, 40, 44, 3); c.fillStyle = col; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#c8c8d0'; c.fillRect(20, 14, 20, 13); c.fillStyle = col; c.fillRect(32, 16, 5, 9);
      c.fillStyle = '#fff'; c.fillRect(15, 33, 30, 21); c.fillStyle = '#888'; for (let k = 0; k < 4; k++) c.fillRect(18, 37 + k * 4.5, 24 - (k === 3 ? 8 : 0), 1);
      c.font = 'bold 7px Arial'; c.textAlign = 'center'; c.fillStyle = col === '#e0b020' ? '#806000' : col; c.fillText(['GAMES', 'MUSIC', 'PICS', 'H/WORK'][i], 30, 70);
      return;
    }
    if (s === 'o') { const n = +t[1]; numeral(c, n, '#1a4a7a'); for (const [x, y] of PIPS[n]) orkHead(c, x, y + 2, PIPR[n]); return; }
    if (s === 'd') {
      const n = +t[1]; numeral(c, n, '#a00000');
      if (n <= 6) die(c, 31, 42, 34, n, '#d81818', '#fff');
      else { die(c, 30, 27, 25, 6, '#d81818', '#fff'); die(c, 30, 56, 25, n - 6, '#1a1a1a', '#fff'); }
      return;
    }
    if (s === 'c') {
      const n = +t[1]; numeral(c, n, '#2349b8');
      // a cube face in slight 3D: top strip, side strip, 3x3 stickers (n of them coloured)
      c.fillStyle = '#333'; c.beginPath(); c.moveTo(12, 26); c.lineTo(18, 20); c.lineTo(52, 20); c.lineTo(46, 26); c.fill();
      c.beginPath(); c.moveTo(46, 26); c.lineTo(52, 20); c.lineTo(52, 54); c.lineTo(46, 60); c.fill();
      c.fillStyle = '#111'; c.fillRect(12, 26, 34, 34);
      for (let k = 0; k < 9; k++) { const x = 13.5 + (k % 3) * 10.8, y = 27.5 + ((k / 3) | 0) * 10.8; rr(c, x, y, 9.4, 9.4, 1.5); c.fillStyle = k < n ? CUBECOL[k] : '#4a4a4a'; c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.3)'; for (let k = 0; k < 3; k++) c.fillRect(19 + k * 11, 21.5, 8, 2.5);
      return;
    }
    if (s === 'p') { // racing craft
      const i = +t[1];
      c.save(); c.translate(30, 40);
      if (i === 0) { // pod racer: two engines on cables pulling a little cockpit
        for (const y of [-12, 12]) { rr(c, -22, y - 5, 30, 10, 4); c.fillStyle = '#b0b0c0'; c.fill(); c.strokeStyle = '#333'; c.lineWidth = 1; c.stroke(); c.fillStyle = '#e10600'; c.fillRect(-6, y - 5, 4, 10); c.fillStyle = '#ffd400'; c.beginPath(); c.moveTo(-22, y - 3); c.lineTo(-28, y); c.lineTo(-22, y + 3); c.fill(); }
        c.strokeStyle = '#555'; c.beginPath(); c.moveTo(8, -12); c.lineTo(14, 0); c.lineTo(8, 12); c.stroke();
        c.fillStyle = '#e8a020'; rr(c, 12, -4, 14, 8, 3); c.fill(); c.stroke(); c.fillStyle = '#5aac2c'; c.beginPath(); c.arc(20, -1, 2.5, 0, TAU); c.fill();
      } else if (i === 1) { // saucer
        c.fillStyle = '#7ad0ff'; c.beginPath(); c.ellipse(0, -5, 10, 9, 0, Math.PI, TAU); c.fill();
        c.fillStyle = '#8a8a9a'; c.beginPath(); c.ellipse(0, 0, 24, 8, 0, 0, TAU); c.fill(); c.strokeStyle = '#333'; c.stroke();
        c.fillStyle = '#ffd400'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.arc(k * 8, 2, 2, 0, TAU); c.fill(); }
        c.fillStyle = 'rgba(160,255,120,.5)'; c.beginPath(); c.moveTo(-8, 8); c.lineTo(8, 8); c.lineTo(14, 26); c.lineTo(-14, 26); c.fill();
      } else if (i === 2) { // rocket
        c.fillStyle = '#e10600'; c.beginPath(); c.moveTo(-10, 18); c.lineTo(-16, 26); c.lineTo(-6, 22); c.fill(); c.beginPath(); c.moveTo(10, 18); c.lineTo(16, 26); c.lineTo(6, 22); c.fill();
        c.fillStyle = '#eee'; c.beginPath(); c.moveTo(0, -28); c.quadraticCurveTo(12, -12, 9, 22); c.lineTo(-9, 22); c.quadraticCurveTo(-12, -12, 0, -28); c.fill(); c.strokeStyle = '#333'; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#e10600'; c.beginPath(); c.moveTo(0, -28); c.quadraticCurveTo(6, -21, 7.5, -14); c.lineTo(-7.5, -14); c.quadraticCurveTo(-6, -21, 0, -28); c.fill();
        c.fillStyle = '#2a9aff'; c.beginPath(); c.arc(0, -3, 4, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#ffd400'; c.beginPath(); c.moveTo(-6, 22); c.lineTo(0, 31); c.lineTo(6, 22); c.fill();
      } else { // space shuttle climbing away on its booster flame
        c.rotate(-0.6);
        c.fillStyle = 'rgba(255,255,255,.6)'; for (const [x, y, r] of [[-30, 2, 5], [-24, -3, 4], [-35, -2, 4]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
        c.fillStyle = '#ffd400'; c.beginPath(); c.moveTo(-18, -4); c.lineTo(-29, 0); c.lineTo(-18, 4); c.fill(); c.fillStyle = '#ff6a00'; c.beginPath(); c.moveTo(-18, -2.5); c.lineTo(-24, 0); c.lineTo(-18, 2.5); c.fill();
        c.strokeStyle = '#222'; c.lineWidth = 1; c.lineJoin = 'round';
        c.fillStyle = '#e8eaf0'; c.beginPath(); c.moveTo(-14, 2); c.lineTo(4, 3); c.lineTo(-10, 16); c.lineTo(-16, 16); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-18, -5); c.lineTo(14, -5); c.quadraticCurveTo(26, -4, 27, 1); c.quadraticCurveTo(24, 5, 14, 5); c.lineTo(-18, 5); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#222'; c.beginPath(); c.moveTo(21, -4.4); c.quadraticCurveTo(26, -4, 27, 1); c.quadraticCurveTo(25, 4, 21, 4.6); c.closePath(); c.fill();
        c.fillStyle = '#e8eaf0'; c.beginPath(); c.moveTo(-17, -5); c.lineTo(-11, -5); c.lineTo(-17, -15); c.lineTo(-20, -15); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#3a4a6a'; c.fillRect(13, -3.6, 4, 2.4); c.fillRect(8, -3.6, 3.5, 2.4);
        c.fillStyle = '#c8102e'; c.fillRect(-6, -1, 10, 1.8); c.fillStyle = '#888'; c.fillRect(-21, -4, 3, 8); c.strokeRect(-21, -4, 3, 8);
      }
      c.restore();
      c.font = 'bold 9px Arial'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = '#5a3a00'; c.fillText(['POD', 'SAUCER', 'ROCKET', 'SHUTTLE'][i], 30, 74);
      c.font = 'bold 10px Arial'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = '#5a3a00'; c.fillText(['N', 'E', 'S', 'W'][i], 4, 3);
      return;
    }
    if (s === 'g') { // the three "dragons": alien, Blobbit, mushroom
      const i = +t[1];
      c.save(); c.translate(30, 40);
      if (i === 0) { // a little green alien
        c.strokeStyle = '#000'; c.lineWidth = 1.2; c.lineJoin = 'round';
        for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 5, -13); c.quadraticCurveTo(sx * 9, -22, sx * 12, -24); c.stroke(); c.fillStyle = '#ffd400'; c.beginPath(); c.arc(sx * 12, -24, 3, 0, TAU); c.fill(); c.stroke(); }
        c.fillStyle = '#4ab02a'; c.beginPath(); c.moveTo(-10, 16); c.quadraticCurveTo(0, 12, 10, 16); c.lineTo(12, 22); c.lineTo(-12, 22); c.closePath(); c.fill(); c.stroke();
        const g = c.createRadialGradient(-5, -8, 1, 0, -2, 18); g.addColorStop(0, '#c8ff9a'); g.addColorStop(0.5, '#6ad03a'); g.addColorStop(1, '#2a8a1a');
        c.fillStyle = g; c.beginPath(); c.moveTo(0, -15); c.bezierCurveTo(17, -15, 18, 4, 0, 15); c.bezierCurveTo(-18, 4, -17, -15, 0, -15); c.fill(); c.stroke();
        for (const sx of [-1, 1]) { c.save(); c.translate(sx * 6, -2); c.rotate(sx * 0.5); c.fillStyle = '#111'; c.beginPath(); c.ellipse(0, 0, 3.6, 6, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-1, -2.5, 1.2, 0, TAU); c.fill(); c.restore(); }
        c.beginPath(); c.arc(0, 7, 3, 0.3, Math.PI - 0.3); c.stroke();
      }
      else if (i === 1) { // a round bouncy Blobbit
        c.strokeStyle = '#000'; c.lineWidth = 1.2; c.lineJoin = 'round'; c.fillStyle = '#e8301e';
        for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 8, 18, 5.5, 3, 0, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.ellipse(sx * 10, -15, 3.6, 5.5, sx * 0.5, 0, TAU); c.fill(); c.stroke(); }
        const g = c.createRadialGradient(-6, -7, 1, 0, 0, 20); g.addColorStop(0, '#ffb0a0'); g.addColorStop(0.35, '#ff4a32'); g.addColorStop(1, '#a01008');
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill(); c.stroke();
        for (const sx of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(sx * 6, -4, 4.4, 5.4, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#000'; c.beginPath(); c.arc(sx * 6 + 0.8, -3, 2.3, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(sx * 6, -4.4, 0.9, 0, TAU); c.fill(); }
        c.fillStyle = '#5a0010'; c.beginPath(); c.arc(0, 5, 6, 0.15, Math.PI - 0.15); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#ff7aa0'; c.beginPath(); c.ellipse(0, 9.2, 3, 1.5, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,150,170,.7)'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 12, 4, 2.5, 1.5, 0, 0, TAU); c.fill(); }
      }
      else { c.fillStyle = '#f2e8d0'; c.strokeStyle = '#5a4a2a'; c.lineWidth = 1.2; c.fillRect(-6, 0, 12, 20); c.strokeRect(-6, 0, 12, 20); c.fillStyle = '#c81810'; c.beginPath(); c.ellipse(0, 0, 21, 15, 0, Math.PI, TAU); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; for (const [x, y, r] of [[-10, -6, 3.5], [3, -10, 3], [12, -4, 2.5], [-2, -3, 2]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } }
      c.restore();
      c.font = 'bold 9px Arial'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = ['#1a6a0a', '#a01010', '#8a2a10'][i]; c.fillText(['ALIEN', 'BLOBBIT', 'SHROOM'][i], 30, 74);
    }
  }

  JG.mod('mahjong', G => {
    const host = G.host;
    G.fit();
    let opts = Object.assign({ layout: 'dragon', bg: 'felt', dim: false }, G.store.get('opts', {}));
    const save = () => G.store.set('opts', opts);
    const C = G.canvas(host, () => { geo = null; sprites.clear(); dirty = true; });
    G.focusEl = C.cv;
    let solution = [], tiles = [], sel = -1, undo = [], time = 0, started = false, won = false, gameNo = 0, hint = null, hintT = 0, dirty = true, geo = null, fx = [], shuffles = 0, portrait = false, stuckShown = false;
    const sprites = new Map();
    const scores = () => JG.Scores('mahjong' + (opts.layout === 'dragon' ? '' : '_' + opts.layout), { lower: true, fmt: fmtT, label: 'Time', title: 'Jack Jong Best Times (' + LAYOUTS[opts.layout].name.replace(' (classic)', '') + ')', max: 360000 });

    // ---------------------------------------------------------------- deal
    function geometry(P) {
      const n = P.length, T = P.map(([x, y, z], i) => ({ i, x, y, z, t: '', alive: true, above: [], left: [], right: [] }));
      for (const a of T) for (const b of T) {
        if (a === b) continue;
        const dx = b.x - a.x, dy = Math.abs(b.y - a.y);
        if (b.z > a.z && Math.abs(dx) < 1 - 1e-6 && dy < 1 - 1e-6) a.above.push(b.i);
        if (b.z === a.z && dy < 1 - 1e-6) { if (Math.abs(dx + 1) < 1e-6) a.left.push(b.i); if (Math.abs(dx - 1) < 1e-6) a.right.push(b.i); }
      }
      return T;
    }
    const isFree = (T, a) => a.alive && !a.above.some(j => T[j].alive) && (!a.left.some(j => T[j].alive) || !a.right.some(j => T[j].alive));
    // fill the alive positions with the given pairs so that they can always be cleared (remove pairs, then play them back)
    function fill(T, pairs, rnd) {
      const live = T.filter(a => a.alive);
      for (let attempt = 0; attempt < 400; attempt++) {
        const ps = JG.shuffle(pairs.slice(), rnd), alive = new Map(live.map(a => [a.i, true]));
        const shadow = T.map(a => ({ alive: alive.has(a.i), above: a.above, left: a.left, right: a.right }));
        const out = new Map(), order = []; let ok = true;
        for (const pair of ps) {
          const free = live.filter(a => shadow[a.i].alive && isFree(shadow, shadow[a.i]));
          if (free.length < 2) { ok = false; break; }
          const a = free[(rnd() * free.length) | 0]; let b = a;
          // prefer the second tile far away (a bit harder), but any free tile will do
          for (let k = 0; k < 4 && b === a; k++) b = free[(rnd() * free.length) | 0];
          if (b === a) b = free.find(x => x !== a);
          out.set(a.i, pair[0]); out.set(b.i, pair[1]); order.push([a.i, b.i]); shadow[a.i].alive = shadow[b.i].alive = false;
        }
        if (ok) { for (const [i, t] of out) T[i].t = t; solution = order; return true; }
      }
      return false;
    }
    // online races (mp.js): the same game number and layout for everybody (never turned on its side, so it really is the same)
    let race = null, raceCall = false, raceLayout = '';
    function deal(no) {
      if (race && race.active && !raceCall) { Desk.toast('Jack Jong', "You're in a race! Finish it (or give up) first.", 2500); return; }
      gameNo = no || (1 + Math.floor(Math.random() * 32000));
      const lay = raceCall && LAYOUTS[raceLayout] ? raceLayout : opts.layout;
      const rnd = JG.rng(gameNo * 7919 + lay.length);
      let P = LAYOUTS[lay].make();
      portrait = !raceCall && C.H > C.W * 1.15;
      if (portrait) P = P.map(([x, y, z]) => [y, x, z]);
      tiles = geometry(P);
      let pairs = tileSet();
      if (rnd() < 0.3) pairs = pairs.map(p => p[0] === 'pl0' ? ['gub', 'pl1'] : p); // Gubbinz hides among the planets sometimes
      JG.shuffle(pairs, rnd); pairs = pairs.slice(0, tiles.length / 2);
      if (!fill(tiles, pairs, rnd)) return deal(gameNo + 1);
      total = tiles.length;
      sel = -1; undo = []; time = 0; started = false; won = false; hint = null; fx = []; shuffles = 0; stuckShown = false; geo = null; sprites.clear(); dirty = true;
      if (saver && !raceCall) saver.clear(); // a new deal: the old saved game goes
      G.w.setTitle('Jack Jong - Game #' + gameNo);
      status();
    }
    const alive = () => tiles.filter(a => a.alive);
    function moves() {
      const free = tiles.filter(a => isFree(tiles, a)), by = {};
      for (const a of free) (by[keyOf(a.t)] = by[keyOf(a.t)] || []).push(a);
      return Object.values(by).filter(l => l.length > 1);
    }
    let total = 1;
    function status() {
      if (race && race.active && !won) race.progress(1 - alive().length / total, `${alive().length} left`);
      const left = alive().length, m = moves().reduce((n, l) => n + l.length * (l.length - 1) / 2, 0);
      G.status(won ? `Cleared in ${fmtT(time)}! Press F2 for another game.` : `Tiles left: ${left} Matches available: ${m} Time: ${fmtT(time)}${shuffles ? ' Shuffles: ' + shuffles : ''}`);
      return m;
    }

    // ---------------------------------------------------------------- play
    function click(a) {
      if (won) return;
      if (!isFree(tiles, a)) { G.sfx('click'); a.shake = 0.25; dirty = true; G.status('That tile is stuck. A tile is free when nothing is on top of it and its left or right side is open.'); return; }
      if (!started) started = true;
      if (a.t === 'gub') { G.secret('games.mj.gubbinz'); if (!a.saw) { a.saw = true; Desk.toast('Jack Jong', 'Oi! Gubbinz has got into the tiles. He counts as a planet.', 5000); } }
      hint = null;
      if (sel === a.i) { sel = -1; dirty = true; return; }
      const s = tiles[sel];
      if (s && keyOf(s.t) === keyOf(a.t)) {
        s.alive = a.alive = false; undo.push([s.i, a.i]); sel = -1;
        saver.save();
        fx.push({ a: s, t: 0 }, { a, t: 0 });
        G.sfx('turn');
        if (!alive().length) return win();
        if (status() === 0) G.timeout(stuck, 450);
      } else { sel = a.i; G.sfx('click'); G.status(tileName(a.t)); }
      dirty = true;
    }
    function stuck() {
      if (won || stuckShown || moves().length) return; stuckShown = true; G.sfx('uhoh');
      G.dialog('Jack Jong', `<p style="margin:0 0 4px"><b>No more matching tiles!</b></p><p style="margin:0">${alive().length} tiles left. You can shuffle the tiles that are left, undo a few moves, or start again.</p>`, [['Shuffle', () => shuffle()], ['Undo', () => doUndo()], ['New Game', () => deal()]], { w: 330 });
    }
    function doUndo() { const u = undo.pop(); if (!u || won) return; u.forEach(i => { tiles[i].alive = true; }); saver.save(); sel = -1; hint = null; stuckShown = false; G.sfx('click'); dirty = true; status(); }
    function shuffle() {
      if (won) return;
      const left = alive(); if (left.length < 2) return;
      const byKey = {}; left.forEach(a => (byKey[keyOf(a.t)] = byKey[keyOf(a.t)] || []).push(a.t));
      const pairs = []; for (const k in byKey) { const l = byKey[k]; for (let i = 0; i + 1 < l.length; i += 2) pairs.push([l[i], l[i + 1]]); }
      if (!fill(tiles, pairs, Math.random)) { G.msg('Jack Jong', 'The tiles are wedged too tightly to shuffle. Try Undo instead.', 'warn'); return; }
      shuffles++; undo = []; sel = -1; hint = null; stuckShown = false; G.sfx('dice'); dirty = true; status(); saver.save();
    }
    function showHint() {
      const m = moves(); if (!m.length) { stuck(); return; }
      const l = m[(Math.random() * m.length) | 0]; hint = [l[0].i, l[1].i]; hintT = 2.5; dirty = true; G.sfx('pet');
    }
    function win() {
      won = true; sel = -1; G.sfx('solve'); G.secret('games.mj.clear'); status();
      if (!(race && race.active)) saver.clear();
      if (race && race.active) { race.progress(1, 'cleared'); race.done({ ok: true }); return; }
      for (let k = 0; k < 80; k++) fx.push({ spark: true, x: Math.random(), y: 1.05, vx: (Math.random() - 0.5) * 0.4, vy: -0.6 - Math.random() * 0.7, t: 0, col: ['#ffd400', '#e10600', '#5aac2c', '#2a9aff', '#fff'][k % 5] });
      G.timeout(() => scores().submit(Math.max(1, Math.round(time))), 1600);
    }

    // ---------------------------------------------------------------- drawing
    function layout() {
      const W = C.W, H = C.H, xs = tiles.map(a => a.x), ys = tiles.map(a => a.y), zs = tiles.map(a => a.z);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys), maxZ = Math.max(...zs);
      const spanX = maxX - minX + 1, spanY = maxY - minY + 1, ar = 1.3, dk = 0.15, sk = 0.15;
      const tw = Math.min((W - 16) / (spanX + maxZ * dk + sk), (H - 16) / (spanY * ar + maxZ * dk + sk));
      const th = tw * ar, d = tw * dk, s = tw * sk;
      const bw = spanX * tw + maxZ * d + s, bh = spanY * th + maxZ * d + s;
      geo = { tw, th, d, s, ox: (W - bw) / 2 + maxZ * d, oy: (H - bh) / 2 + maxZ * d, minX, minY };
      geo.order = tiles.slice().sort((a, b) => a.z - b.z || (a.x - b.x) || (a.y - b.y));
    }
    const pos = a => [geo.ox + (a.x - geo.minX) * geo.tw - a.z * geo.d, geo.oy + (a.y - geo.minY) * geo.th - a.z * geo.d];
    function sprite(t) {
      let cv = sprites.get(t); if (cv) return cv;
      const { tw, th } = geo, dpr = C.dpr; cv = document.createElement('canvas'); cv.width = Math.ceil(tw * dpr); cv.height = Math.ceil(th * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      rr(c, 0.5, 0.5, tw - 1, th - 1, tw * 0.1);
      const g = c.createLinearGradient(0, 0, tw, th); g.addColorStop(0, '#fffef6'); g.addColorStop(1, '#ece2c2'); c.fillStyle = g; c.fill();
      c.lineWidth = 1; c.strokeStyle = '#8a7a50'; c.stroke();
      c.save(); c.translate(tw * 0.04, th * 0.04); c.scale(tw * 0.92 / FW, th * 0.92 / FH); drawFace(c, t); c.restore();
      sprites.set(t, cv); return cv;
    }
    let bgCv = null, bgKey = '';
    function background() {
      const key = opts.bg + C.W + 'x' + C.H + C.dpr; if (bgCv && bgKey === key) return bgCv;
      bgKey = key; bgCv = document.createElement('canvas'); bgCv.width = Math.round(C.W * C.dpr); bgCv.height = Math.round(C.H * C.dpr);
      const c = bgCv.getContext('2d'), W = bgCv.width, H = bgCv.height;
      if (opts.bg === 'space') { c.fillStyle = '#05051e'; c.fillRect(0, 0, W, H); const r = JG.rng(5); for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.8})`; c.fillRect(r() * W, r() * H, 1.5, 1.5); } const g = c.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, W * 0.5); g.addColorStop(0, 'rgba(140,40,200,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
      else if (opts.bg === 'wood') { c.fillStyle = '#8a5a2a'; c.fillRect(0, 0, W, H); const r = JG.rng(9); for (let y = 0; y < H; y += 3) { c.fillStyle = `rgba(${r() < 0.5 ? '60,30,10' : '200,140,80'},${0.08 + r() * 0.1})`; c.fillRect(0, y, W, 2 + r() * 3); } }
      else { const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, '#1e7a4a'); g.addColorStop(1, '#0a3a22'); c.fillStyle = g; c.fillRect(0, 0, W, H); const r = JG.rng(3); for (let i = 0; i < 4000; i++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.04)'; c.fillRect(r() * W, r() * H, 1, 1); } }
      return bgCv;
    }
    function drawTile(c, a, x, y, alpha, scale) {
      const { tw, th, s } = geo;
      c.save(); c.globalAlpha = alpha;
      if (scale !== 1) { c.translate(x + tw / 2, y + th / 2); c.scale(scale, scale); c.translate(-x - tw / 2, -y - th / 2); }
      // drop shadow, then the two-tone body (ivory layer + green back), then the face
      c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, x + s * 1.5, y + s * 1.7, tw, th, tw * 0.1); c.fill();
      c.fillStyle = '#1e5a36'; rr(c, x + s, y + s, tw, th, tw * 0.1); c.fill();
      c.fillStyle = '#3a9a62'; rr(c, x + s * 0.75, y + s * 0.75, tw, th, tw * 0.1); c.fill();
      c.fillStyle = '#bfb185'; rr(c, x + s * 0.45, y + s * 0.45, tw, th, tw * 0.1); c.fill();
      c.fillStyle = '#ddd2a8'; rr(c, x + s * 0.2, y + s * 0.2, tw, th, tw * 0.1); c.fill();
      c.drawImage(sprite(a.t), x, y, tw, th);
      c.restore();
    }
    function draw(dt) {
      if (!geo) layout();
      const c = C.c;
      c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(background(), 0, 0);
      c.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      const blink = Math.sin(performance.now() / 120) > 0;
      for (const a of geo.order) {
        if (!a.alive) continue;
        let [x, y] = pos(a);
        if (a.shake > 0) x += Math.sin(a.shake * 60) * 3;
        drawTile(c, a, x, y, 1, 1);
        const blocked = opts.dim && !isFree(tiles, a);
        if (blocked) { c.fillStyle = 'rgba(0,0,0,.28)'; rr(c, x, y, geo.tw, geo.th, geo.tw * 0.1); c.fill(); }
        if (a.i === sel) { c.fillStyle = 'rgba(0,0,128,.38)'; rr(c, x, y, geo.tw, geo.th, geo.tw * 0.1); c.fill(); c.strokeStyle = '#ffd400'; c.lineWidth = 2; c.stroke(); }
        if (hint && hint.includes(a.i) && blink) { c.fillStyle = 'rgba(255,212,0,.45)'; rr(c, x, y, geo.tw, geo.th, geo.tw * 0.1); c.fill(); }
      }
      for (const f of fx) {
        if (f.spark) { c.fillStyle = f.col; c.fillRect(f.x * C.W, f.y * C.H, 4, 4); continue; }
        const [x, y] = pos(f.a), k = f.t / 0.3; drawTile(c, f.a, x, y - k * 12, Math.max(0, 1 - k), 1 + k * 0.25);
      }
      if (won) { c.font = `bold ${Math.max(18, Math.min(40, C.W / 14))}px Tahoma, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillText('YOU CLEARED IT!', C.W / 2 + 2, C.H / 2 + 2); c.fillStyle = '#ffd400'; c.fillText('YOU CLEARED IT!', C.W / 2, C.H / 2); }
    }
    G.loop((dt, active) => {
      if (!tiles.length) return;
      if (started && !won && active) { const b = Math.floor(time); time += dt; if (Math.floor(time) !== b) status(); }
      if (hint) { hintT -= dt; dirty = true; if (hintT <= 0) hint = null; }
      for (const a of tiles) if (a.shake > 0) { a.shake -= dt; dirty = true; }
      if (fx.length) {
        dirty = true;
        for (const f of fx) { f.t += dt; if (f.spark) { f.vy += 0.9 * dt; f.x += f.vx * dt; f.y += f.vy * dt; } }
        fx = fx.filter(f => f.spark ? f.t < 3 : f.t < 0.3);
      }
      if (dirty) { dirty = false; draw(dt); }
    });
    G.on(C.cv, 'pointerdown', ev => {
      ev.preventDefault(); G.focus(); if (!geo) return;
      const r = DesktopSurface.rect(C.cv), point = DesktopSurface.point(ev.clientX, ev.clientY), x = point.x - r.left, y = point.y - r.top;
      for (let k = geo.order.length - 1; k >= 0; k--) { const a = geo.order[k]; if (!a.alive) continue; const [sx, sy] = pos(a); if (x >= sx && x < sx + geo.tw && y >= sy && y < sy + geo.th) { click(a); return; } }
      if (sel >= 0) { sel = -1; dirty = true; }
    });
    G.on(C.cv, 'contextmenu', ev => ev.preventDefault());
    G.keys = { down(ev) {
      if ((ev.ctrlKey && (ev.key === 'z' || ev.key === 'Z')) || ev.key === 'Backspace') { doUndo(); return true; }
      if (!ev.ctrlKey && (ev.key === 'h' || ev.key === 'H')) { showHint(); return true; }
      if (ev.key === 'Escape' && sel >= 0) { sel = -1; dirty = true; return true; }
      return false;
    } };
    G.onActive = a => { if (a) dirty = true; };
    function selectGame() {
      const d = G.dialog('Select Game', `<p style="margin:0 0 6px">Type a game number from 1 to 32000:</p><input type="text" class="jgname" maxlength="5" inputmode="numeric" value="${gameNo}">`, [['OK', f => { const n = parseInt(f.querySelector('input').value, 10); if (n >= 1 && n <= 32000) deal(n); else { G.msg('Select Game', 'Please type a number between 1 and 32000.', 'warn'); return false; } }], ['Cancel']], { w: 260, noFocus: true });
      const inp = d.f.querySelector('input'); setTimeout(() => { try { inp.focus(); inp.select(); } catch (e) {} }, 50);
    }
    G.newGame = () => deal();
    G.helpKey = () => help();
    const help = () => G.help([
      ['How to play', 'Clear the board by matching pairs of tiles. Click one tile, then click its twin and both disappear.\n\nYou can only use FREE tiles: nothing on top of them, and nothing touching their left side OR their right side.\n\nThe tiles are dealt so that every game CAN be cleared. Whether you clear it is another matter.'],
      ['The tiles', '- Robots, Dice and Cubes come in 1 to 9. Match the same suit and number.\n- Four racing craft: Pod, Saucer, Rocket and Shuttle.\n- Three "dragons": Alien, Blobbit and Mushroom.\n- Planets: ANY planet matches ANY other planet.\n- Floppy disks: ANY floppy matches ANY other floppy.\n\nThere is a rumour about a fifth planet...'],
      ['Tips', '- Free the long rows from the ends.\n- Get the big stack in the middle down early.\n- H shows a hint, Ctrl+Z undoes. Game > Shuffle mixes up the tiles that are left if you get stuck.\n- Options > Dim Blocked Tiles darkens the tiles you can\'t use yet.'],
    ]);
    G.menu([
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: () => deal() },
        { label: 'Select Game...', act: selectGame },
        { label: 'Restart This Game', act: () => deal(gameNo) },
        ...(window.MP ? [MP.menuItem('race.mahjong', { layout: opts.layout })] : []), '-',
        { label: 'Undo', key: 'Ctrl+Z', dis: !undo.length || won, act: doUndo },
        { label: 'Hint', key: 'H', dis: won, act: showHint },
        { label: 'Shuffle Tiles', dis: won, act: shuffle }, '-',
        { label: 'Best Times...', act: () => scores().show() }, '-',
        { label: 'Exit', act: () => G.w.close() },
      ]],
      ['Options', () => [
        { label: 'Layout', sub: Object.entries(LAYOUTS).map(([k, l]) => ({ label: l.name, rad: opts.layout === k, act: () => { opts.layout = k; save(); deal(); } })) },
        { label: 'Background', sub: [['felt', 'Green Felt'], ['space', 'Outer Space'], ['wood', "Gran's Table"]].map(([k, n]) => ({ label: n, rad: opts.bg === k, act: () => { opts.bg = k; save(); dirty = true; } })) },
        { label: 'Dim Blocked Tiles', chk: opts.dim, act: () => { opts.dim = !opts.dim; save(); dirty = true; } },
      ]],
      ['Help', () => [{ label: 'Help Topics', key: 'F1', act: help }, '-', { label: 'About Jack Jong', act: () => G.about({ ver: 'Version 1.3 (' + tiles.length + ' tiles)', blurb: 'An ancient tile game, re-tiled for the space age. Every one of the 144 tiles was drawn by hand. Well, by mouse.', credits: [['Programming', 'Jack'], ['Tile art', 'Jack (took 3 weekends)'], ['Dice consultant', 'Dave'], ['Cube tiles', 'Jack\'s 3x3, posing nicely'], ['Peapod Racer layout', Cast.t('Cousin {cousin}')], ['Blobbit wrangling', 'Gubbinz'], ['Tea and biscuits', 'Mom'], ['Real mahjong set', 'Gran (we lost 2 tiles)']] }) }]],
    ]);
    if (window.MP) race = MP.hook('games.mahjong', G.w, { start(seed, o, R, preview) { raceLayout = o && LAYOUTS[o.layout] ? o.layout : 'dragon'; raceCall = true; try { deal(1 + (seed % 32000)); } finally { raceCall = false; } if (preview) won = true; } });
    G.dbg = () => ({ n: tiles.length, alive: alive().length, moves: moves().length, game: gameNo, portrait, solve() { // test helper: replay the deal's own removal order
      for (const [a, b] of solution) { if (!tiles[a].alive) continue; if (!isFree(tiles, tiles[a]) || !isFree(tiles, tiles[b])) return false; sel = -1; click(tiles[a]); click(tiles[b]); } return !alive().length; } });
    // the game in progress is saved (js/gamesave.js): the layout, every tile (after shuffles too), which are gone, undo and
    // the time. Not an online race (that's live).
    const saver = G.saver(() => (race && race.active) ? undefined : (!started || won || !tiles.length) ? null
      : { lay: opts.layout, por: portrait ? 1 : 0, no: gameNo, t: tiles.map(a => a.t), al: tiles.map(a => (a.alive ? 1 : 0)).join(''), undo: undo.slice(-80), time: Math.floor(time), sh: shuffles }, { v: 1, live: true });
    function resume() {
      const s = saver.load(); if (!s || !LAYOUTS[s.lay] || !Array.isArray(s.t) || typeof s.al !== 'string') return false;
      let P = LAYOUTS[s.lay].make(); if (s.por) P = P.map(([x, y, z]) => [y, x, z]);
      if (P.length !== s.t.length || s.al.length !== P.length || !s.t.every(t => typeof t === 'string')) return false;
      const T = geometry(P); T.forEach((a, i) => { a.t = s.t[i]; a.alive = s.al[i] === '1'; });
      if (!T.some(a => a.alive)) return false;
      if (opts.layout !== s.lay) { opts.layout = s.lay; save(); }
      tiles = T; gameNo = s.no | 0; portrait = !!s.por; total = tiles.length; solution = [];
      sel = -1; undo = (Array.isArray(s.undo) ? s.undo : []).filter(u => Array.isArray(u) && u.length === 2 && u.every(i => tiles[i] && !tiles[i].alive));
      time = Math.max(0, +s.time || 0); started = true; won = false; hint = null; fx = []; shuffles = s.sh | 0; stuckShown = false; geo = null; sprites.clear(); dirty = true;
      G.w.setTitle('Jack Jong - Game #' + gameNo);
      status();
      return true;
    }
    if (!resume()) deal();
  });
})();

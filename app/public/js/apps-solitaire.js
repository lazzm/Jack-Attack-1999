/* apps-solitaire: Solitaire (Klondike) and FreeCell for JackOS 98.
 * Everything is original and drawn live on a <canvas>: the card faces, the court characters (a grot Jack,
 * a robot Queen and an Ork Warboss King), twelve card backs, the bouncing-cards finale and the FreeCell king.
 * No images, no libraries. Debug helpers only exist when the page is opened with ?soltest. */
(function () {
  'use strict';
  if (!window.Apps) return;
  const store = Apps.store;
  const TEST = /[?&]soltest\b/.test(location.search);
  const now = () => performance.now();
  const rnd = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };
  const secret = id => { try { Apps.secret(id); } catch (e) {} };
  const R = 96 / 71; // card height / width

  // ================================================================ secrets
  [['sol.win', 'Patience is a virtue', 'Win a game of patience'],
    ['sol.draw3', 'Three times the trouble', 'Win the harder way'],
    ['sol.fcwin', 'Free as a bird', 'Win the game with four empty boxes'],
    ['sol.speedy', 'Card sharp', 'Win before the kettle boils (two minutes)'],
    ['sol.vegas', 'Viva Las Vegas', 'Leave the casino richer than you went in'],
    ['sol.secretback', 'The mystery deck', 'Knock on an empty deck. Keep knocking.'],
    ['sol.dave', 'Dave was right (probably)', 'Every playground has a number nobody can beat'],
    ['sol.bounce', 'Bouncy bouncy', 'Watch the whole celebration. Every. Single. Card.'],
    ['sol.undo20', 'Ctrl+Z addict', 'Change your mind. Then change it again. And again...'],
    ['sol.deal50', 'Shuffle champion', 'Deal, deal and deal some more'],
    ['sol.cheat', 'Cheaters never prosper', 'Some keys are hidden in the card games'],
    ['sol.king', 'Royal audience', 'Poke the king in FreeCell'],
    ['sol.fclose', 'Out of moves', 'Get completely stuck in FreeCell'],
    ['sol.highroller', 'High roller', 'Have $500 in the Vegas bank'],
    ['sol.allbacks', 'Back to back to back', 'Try every card back in the deck'],
  ].forEach(s => Apps.defineSecret(...s));

  // ================================================================ card art (drawn in device pixels into cached sprites)
  const SUIT_N = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
  const RANK_S = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const RANK_N = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
  const isRed = s => s === 1 || s === 2;
  const RED = '#d00000', INK = '#000';
  const CLOTH = ['#2349b8', '#e0601a', '#c8102e', '#4b2a86'];
  const GOLD = '#f2b600';

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function poly(c, pts, fill, stroke) {
    c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); } if (stroke !== false) c.stroke();
  }
  function ell(c, x, y, rx, ry, fill, stroke) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke !== false) c.stroke();
  }
  // a suit symbol of height z centred on (x, y)
  function pip(c, s, x, y, z, flip, col) {
    c.save(); c.translate(x, y); if (flip) c.rotate(Math.PI);
    c.fillStyle = col || (isRed(s) ? RED : INK);
    const w = z, h = z;
    c.beginPath();
    if (s === 2) {
      c.moveTo(0, h * 0.5);
      c.bezierCurveTo(-w * 0.12, h * 0.32, -w * 0.53, h * 0.06, -w * 0.5, -h * 0.18);
      c.bezierCurveTo(-w * 0.47, -h * 0.53, -w * 0.06, -h * 0.56, 0, -h * 0.25);
      c.bezierCurveTo(w * 0.06, -h * 0.56, w * 0.47, -h * 0.53, w * 0.5, -h * 0.18);
      c.bezierCurveTo(w * 0.53, h * 0.06, w * 0.12, h * 0.32, 0, h * 0.5);
      c.fill();
    } else if (s === 1) {
      c.moveTo(0, -h * 0.5);
      c.quadraticCurveTo(w * 0.15, -h * 0.2, w * 0.4, 0); c.quadraticCurveTo(w * 0.15, h * 0.2, 0, h * 0.5);
      c.quadraticCurveTo(-w * 0.15, h * 0.2, -w * 0.4, 0); c.quadraticCurveTo(-w * 0.15, -h * 0.2, 0, -h * 0.5);
      c.fill();
    } else if (s === 3) {
      c.moveTo(0, -h * 0.5);
      c.bezierCurveTo(w * 0.12, -h * 0.3, w * 0.55, -h * 0.12, w * 0.5, h * 0.12);
      c.bezierCurveTo(w * 0.46, h * 0.36, w * 0.14, h * 0.38, w * 0.04, h * 0.18);
      c.quadraticCurveTo(w * 0.06, h * 0.4, w * 0.22, h * 0.5);
      c.lineTo(-w * 0.22, h * 0.5);
      c.quadraticCurveTo(-w * 0.06, h * 0.4, -w * 0.04, h * 0.18);
      c.bezierCurveTo(-w * 0.14, h * 0.38, -w * 0.46, h * 0.36, -w * 0.5, h * 0.12);
      c.bezierCurveTo(-w * 0.55, -h * 0.12, -w * 0.12, -h * 0.3, 0, -h * 0.5);
      c.fill();
    } else {
      const r = w * 0.22;
      for (const [cx, cy] of [[0, -h * 0.25], [-w * 0.26, h * 0.06], [w * 0.26, h * 0.06]]) { c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); }
      c.beginPath(); c.arc(0, h * 0.02, r * 0.6, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-w * 0.04, 0); c.quadraticCurveTo(-w * 0.05, h * 0.38, -w * 0.22, h * 0.5);
      c.lineTo(w * 0.22, h * 0.5); c.quadraticCurveTo(w * 0.05, h * 0.38, w * 0.04, 0); c.closePath(); c.fill();
    }
    c.restore();
  }
  function star(c, x, y, r, pts, inner) {
    pts = pts || 5; inner = inner || 0.45;
    c.beginPath();
    for (let i = 0; i < pts * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / pts, rad = i % 2 ? r * inner : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
    c.closePath();
  }

  // ---- characters (unit space: the head is roughly -0.5..0.5 each way)
  // the Jacks: a young apprentice wizard in a pointy hood with a star badge
  function grotHead(c, o) {
    o = o || {};
    const hood = o.hood || '#2a3c9e', SK = '#f6d0ac', SKD = '#dca47a';
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#000';
    // the hood: drapes round the face and flops over into a point with a gold tassel
    c.beginPath(); c.moveTo(-0.34, 0.3); c.bezierCurveTo(-0.42, -0.1, -0.3, -0.42, 0.02, -0.44);
    c.quadraticCurveTo(0.3, -0.5, 0.46, -0.7); c.quadraticCurveTo(0.44, -0.4, 0.33, -0.22); c.bezierCurveTo(0.42, 0, 0.4, 0.2, 0.34, 0.3); c.closePath();
    c.fillStyle = hood; c.fill(); c.stroke();
    c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(-0.24, -0.2, 0.08, 0.3, 0.3, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0.36, 0.05, 0.08, 0.32, 0, 0, TAU); c.fill(); c.restore();
    ell(c, 0.47, -0.71, 0.055, 0.055, GOLD);
    // face (dark hood lining behind it)
    ell(c, 0, 0.02, 0.27, 0.31, 'rgba(0,0,0,.45)', false);
    ell(c, 0, 0.04, 0.23, 0.27, SK);
    c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(0.1, 0.08, 0.12, 0.22, 0, -1.2, 1.6); c.fill();
    // fringe
    c.beginPath(); c.moveTo(-0.22, -0.08); c.quadraticCurveTo(-0.16, -0.24, 0.02, -0.24); c.quadraticCurveTo(0.2, -0.24, 0.22, -0.08); c.quadraticCurveTo(0.12, -0.16, 0.06, -0.1); c.quadraticCurveTo(0, -0.17, -0.06, -0.1); c.quadraticCurveTo(-0.13, -0.16, -0.22, -0.08); c.closePath(); c.fillStyle = '#7a4a1a'; c.fill(); c.stroke();
    // eyes, brows, nose, smile, freckles
    for (const sx of [-1, 1]) {
      if (o.blink) { c.beginPath(); c.moveTo(sx * 0.14, 0.0); c.lineTo(sx * 0.05, 0.0); c.stroke(); }
      else { ell(c, sx * 0.095, 0, 0.055, 0.045, '#fff'); ell(c, sx * 0.09, 0.005, 0.03, 0.03, '#2a6ab8', false); ell(c, sx * 0.09, 0.005, 0.014, 0.014, '#000', false); ell(c, sx * 0.08, -0.01, 0.009, 0.009, '#fff', false); }
      c.beginPath(); c.moveTo(sx * 0.15, -0.07); c.quadraticCurveTo(sx * 0.1, -0.1, sx * 0.04, -0.075); c.stroke();
      ell(c, sx * 0.15, 0.1, 0.035, 0.022, 'rgba(255,110,110,.45)', false);
    }
    c.beginPath(); c.moveTo(0.01, 0.03); c.quadraticCurveTo(0.05, 0.09, 0.0, 0.1); c.strokeStyle = SKD; c.stroke(); c.strokeStyle = '#000';
    c.beginPath(); c.moveTo(-0.09, 0.15); c.quadraticCurveTo(0, 0.22, 0.09, 0.15); c.stroke();
    // star badge on the hood
    star(c, -0.22, -0.3, 0.075); c.fillStyle = GOLD; c.fill(); c.stroke();
    c.lineCap = 'butt';
  }
  // Gubbinz (the JackOS helper) for the secret back: big pointy ears, red eyes, toothy grin
  function gubbinzHead(c, o) {
    o = o || {};
    const G = '#5aac2c';
    c.lineJoin = 'round'; c.strokeStyle = '#000';
    for (const sx of [-1, 1]) { // the big pointy ears
      c.beginPath(); c.moveTo(sx * 0.2, -0.12); c.quadraticCurveTo(sx * 0.42, -0.2, sx * 0.56, -0.4); c.quadraticCurveTo(sx * 0.42, -0.02, sx * 0.2, 0.1); c.closePath();
      c.fillStyle = G; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(sx * 0.24, -0.06); c.quadraticCurveTo(sx * 0.38, -0.13, sx * 0.47, -0.28); c.strokeStyle = '#2f6e14'; c.stroke(); c.strokeStyle = '#000';
    }
    ell(c, 0, 0, 0.26, 0.3, G);
    if (o.hood) { // pointy hood
      c.beginPath(); c.moveTo(-0.27, -0.04); c.bezierCurveTo(-0.3, -0.3, -0.1, -0.36, 0.06, -0.36);
      c.quadraticCurveTo(0.26, -0.5, 0.34, -0.66); c.quadraticCurveTo(0.36, -0.4, 0.27, -0.04);
      c.quadraticCurveTo(0, -0.2, -0.27, -0.04); c.closePath(); c.fillStyle = o.hood; c.fill(); c.stroke();
      ell(c, 0.35, -0.68, 0.06, 0.06, GOLD);
      c.beginPath(); c.moveTo(-0.27, -0.04); c.quadraticCurveTo(0, -0.2, 0.27, -0.04); c.lineWidth *= 2.2; c.strokeStyle = GOLD; c.stroke(); c.lineWidth /= 2.2; c.strokeStyle = '#000';
    }
    // angry little eyebrows, red eyes
    c.beginPath(); c.moveTo(-0.19, -0.13); c.lineTo(-0.04, -0.07); c.moveTo(0.19, -0.13); c.lineTo(0.04, -0.07); c.lineWidth *= 1.8; c.stroke(); c.lineWidth /= 1.8;
    for (const sx of [-1, 1]) {
      if (o.blink) { c.beginPath(); c.moveTo(sx * 0.16, -0.02); c.lineTo(sx * 0.05, -0.02); c.stroke(); }
      else { ell(c, sx * 0.105, -0.02, 0.065, 0.055, '#ff2a00'); ell(c, sx * 0.1, -0.02, 0.025, 0.025, '#000', false); ell(c, sx * 0.09, -0.04, 0.012, 0.012, '#fff', false); }
    }
    poly(c, [[0, -0.01], [0.07, 0.09], [-0.02, 0.09]], '#4c9a22'); // nose
    c.beginPath(); c.moveTo(-0.16, 0.13); c.quadraticCurveTo(0, 0.3, 0.16, 0.13); c.quadraticCurveTo(0, 0.17, -0.16, 0.13); c.closePath(); c.fillStyle = '#4a0d0d'; c.fill(); c.stroke();
    c.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) { const x = -0.12 + i * 0.06; c.beginPath(); c.moveTo(x - 0.024, 0.145 + Math.abs(x) * 0.06); c.lineTo(x + 0.024, 0.145 + Math.abs(x) * 0.06); c.lineTo(x, 0.19); c.closePath(); c.fill(); }
  }
  function orkHead(c, o) {
    o = o || {};
    const G = '#3f8f22', GD = '#1f4f0e';
    c.lineJoin = 'round'; c.strokeStyle = '#000';
    for (const sx of [-1, 1]) poly(c, [[sx * 0.34, -0.12], [sx * 0.5, -0.22], [sx * 0.38, 0.04]], G);
    c.beginPath(); c.moveTo(-0.32, -0.02); c.bezierCurveTo(-0.34, -0.42, 0.34, -0.42, 0.32, -0.02);
    c.lineTo(0.4, 0.2); c.quadraticCurveTo(0.38, 0.38, 0.22, 0.4); c.lineTo(-0.22, 0.4); c.quadraticCurveTo(-0.38, 0.38, -0.4, 0.2); c.closePath();
    c.fillStyle = G; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-0.28, -0.15); c.lineTo(-0.03, -0.06); c.lineTo(0.03, -0.06); c.lineTo(0.28, -0.15); c.lineWidth *= 3; c.strokeStyle = GD; c.stroke(); c.lineWidth /= 3; c.strokeStyle = '#000';
    for (const sx of [-1, 1]) { ell(c, sx * 0.14, -0.04, 0.05, 0.04, '#ff1a00'); ell(c, sx * 0.13, -0.05, 0.015, 0.015, '#ffef80', false); }
    ell(c, -0.04, 0.08, 0.025, 0.02, GD, false); ell(c, 0.04, 0.08, 0.025, 0.02, GD, false);
    rr(c, -0.24, 0.16, 0.48, 0.14, 0.05); c.fillStyle = '#3a0808'; c.fill(); c.stroke(); // the big underbite
    c.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) { const x = -0.14 + i * 0.07; c.beginPath(); c.moveTo(x - 0.025, 0.16); c.lineTo(x + 0.025, 0.16); c.lineTo(x, 0.2); c.closePath(); c.fill(); }
    for (const sx of [-1, 1]) poly(c, [[sx * 0.13, 0.31], [sx * 0.21, 0.31], [sx * 0.18, 0.09]], '#fffbe0'); // tusks
    if (o.scar) { c.beginPath(); c.moveTo(0.1, -0.22); c.lineTo(0.24, 0.06); for (let i = 1; i < 4; i++) { const t = i / 4, x = 0.1 + 0.14 * t, y = -0.22 + 0.28 * t; c.moveTo(x - 0.03, y + 0.015); c.lineTo(x + 0.03, y - 0.015); } c.strokeStyle = '#8a1a1a'; c.stroke(); c.strokeStyle = '#000'; }
    if (o.crown) { // iron crown with spikes and horns
      for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 0.28, -0.26); c.quadraticCurveTo(sx * 0.5, -0.3, sx * 0.5, -0.56); c.quadraticCurveTo(sx * 0.4, -0.38, sx * 0.24, -0.34); c.closePath(); c.fillStyle = '#eee3c0'; c.fill(); c.stroke(); }
      const pts = [[-0.3, -0.24]]; for (let i = 0; i <= 4; i++) { const x = -0.3 + i * 0.15; pts.push([x, -0.36], [x + 0.075, i < 4 ? -0.52 : -0.36]); }
      pts.length = pts.length - 1; pts.push([0.3, -0.36], [0.3, -0.24]);
      poly(c, pts, GOLD);
      rr(c, -0.32, -0.34, 0.64, 0.11, 0.02); c.fillStyle = '#555c66'; c.fill(); c.stroke();
      for (let i = 0; i < 5; i++) ell(c, -0.24 + i * 0.12, -0.285, 0.022, 0.022, '#cfd6de', false);
    }
  }
  // the Kings: jolly pod-racing pilot kings (leather flying cap, goggles up, crown pinned on, handlebar moustache)
  function pilotKingHead(c) {
    const SK = '#f4c8a0', SKD = '#d89a70', LE = '#7a4a1e', LEL = '#a8703a';
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#000';
    for (const sx of [-1, 1]) poly(c, [[sx * 0.24, -0.12], [sx * 0.33, 0.06], [sx * 0.27, 0.28], [sx * 0.16, 0.26], [sx * 0.18, 0.04], [sx * 0.14, -0.12]], LE);
    const fg = c.createLinearGradient(-0.24, -0.2, 0.24, 0.32); fg.addColorStop(0, '#ffe2c4'); fg.addColorStop(0.5, SK); fg.addColorStop(1, SKD);
    c.beginPath(); c.moveTo(-0.23, -0.1); c.quadraticCurveTo(-0.25, 0.32, 0, 0.34); c.quadraticCurveTo(0.25, 0.32, 0.23, -0.1); c.closePath(); c.fillStyle = fg; c.fill(); c.stroke();
    for (const sx of [-1, 1]) {
      ell(c, sx * 0.09, -0.01, 0.045, 0.035, '#fff'); ell(c, sx * 0.09 + 0.008, 0, 0.022, 0.022, '#2a4a8a', false); ell(c, sx * 0.09 + 0.008, 0, 0.01, 0.01, '#000', false);
      c.beginPath(); c.moveTo(sx * 0.04, -0.06); c.quadraticCurveTo(sx * 0.09, -0.09, sx * 0.15, -0.06); c.lineWidth *= 1.6; c.strokeStyle = '#6a3a14'; c.stroke(); c.lineWidth /= 1.6; c.strokeStyle = '#000';
      ell(c, sx * 0.15, 0.1, 0.04, 0.025, 'rgba(255,110,110,.45)', false);
    }
    poly(c, [[0, 0.0], [0.05, 0.09], [-0.01, 0.1]], SKD, false);
    c.beginPath(); c.moveTo(-0.09, 0.19); c.quadraticCurveTo(0, 0.27, 0.09, 0.19); c.quadraticCurveTo(0, 0.21, -0.09, 0.19); c.closePath(); c.fillStyle = '#7a1010'; c.fill(); c.stroke();
    for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(0, 0.12); c.quadraticCurveTo(sx * 0.1, 0.1, sx * 0.16, 0.15); c.quadraticCurveTo(sx * 0.21, 0.16, sx * 0.2, 0.1); c.quadraticCurveTo(sx * 0.19, 0.2, sx * 0.11, 0.17); c.quadraticCurveTo(sx * 0.05, 0.16, 0, 0.17); c.closePath(); c.fillStyle = '#8a4a14'; c.fill(); c.stroke(); }
    const lg = c.createLinearGradient(-0.26, -0.42, 0.26, -0.08); lg.addColorStop(0, LEL); lg.addColorStop(1, LE);
    c.beginPath(); c.moveTo(-0.26, -0.06); c.quadraticCurveTo(-0.28, -0.42, 0, -0.43); c.quadraticCurveTo(0.28, -0.42, 0.26, -0.06); c.quadraticCurveTo(0, -0.16, -0.26, -0.06); c.closePath(); c.fillStyle = lg; c.fill(); c.stroke();
    c.fillStyle = '#3a2a1a'; c.fillRect(-0.27, -0.27, 0.54, 0.06);
    for (const sx of [-1, 1]) {
      ell(c, sx * 0.12, -0.24, 0.1, 0.1, '#c8a040');
      const gg = c.createRadialGradient(sx * 0.12 - 0.03, -0.27, 0.005, sx * 0.12, -0.24, 0.07); gg.addColorStop(0, '#e8fbff'); gg.addColorStop(1, '#4ab0e0');
      ell(c, sx * 0.12, -0.24, 0.068, 0.068, gg); ell(c, sx * 0.12 - 0.025, -0.265, 0.018, 0.018, '#fff', false);
    }
    poly(c, [[-0.13, -0.36], [-0.12, -0.5], [-0.06, -0.43], [0, -0.53], [0.06, -0.43], [0.12, -0.5], [0.13, -0.36]], GOLD);
    ell(c, 0, -0.41, 0.025, 0.025, '#e0004a', false);
    c.lineCap = 'butt';
  }
  function robotHead(c, o) {
    o = o || {};
    c.lineJoin = 'round'; c.strokeStyle = '#000';
    c.beginPath(); c.moveTo(0, -0.3); c.lineTo(0, -0.48); c.stroke();
    ell(c, 0, -0.5, 0.06, 0.06, o.ant || '#ff4aa0');
    for (const sx of [-1, 1]) { rr(c, sx > 0 ? 0.28 : -0.36, -0.12, 0.08, 0.18, 0.02); c.fillStyle = '#8a949e'; c.fill(); c.stroke(); }
    rr(c, -0.3, -0.32, 0.6, 0.58, 0.08); c.fillStyle = '#b9c2cc'; c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-0.25, -0.28, 0.08, 0.4);
    for (const sx of [-1, 1]) {
      ell(c, sx * 0.13, -0.07, 0.09, 0.08, '#7ff4ff'); ell(c, sx * 0.13, -0.06, 0.035, 0.035, '#003a5a', false);
      if (o.lashes) { c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(sx * 0.13 + i * 0.05, -0.14); c.lineTo(sx * 0.13 + i * 0.07, -0.2); } c.stroke(); }
      ell(c, sx * 0.2, 0.08, 0.04, 0.025, '#ff9ac0', false);
    }
    rr(c, -0.14, 0.1, 0.28, 0.09, 0.02); c.fillStyle = o.lips || '#333'; c.fill(); c.stroke();
    c.beginPath(); for (let i = 1; i < 4; i++) { c.moveTo(-0.14 + i * 0.07, 0.1); c.lineTo(-0.14 + i * 0.07, 0.19); } c.strokeStyle = '#999'; c.stroke(); c.strokeStyle = '#000';
    if (o.crown) {
      poly(c, [[-0.26, -0.3], [-0.28, -0.5], [-0.16, -0.4], [-0.08, -0.56], [0, -0.42], [0.08, -0.56], [0.16, -0.4], [0.28, -0.5], [0.26, -0.3]], GOLD);
      ell(c, 0, -0.38, 0.035, 0.035, '#e0004a'); ell(c, -0.15, -0.36, 0.025, 0.025, '#2aa0ff'); ell(c, 0.15, -0.36, 0.025, 0.025, '#2aa0ff');
    }
  }
  // a court figure: origin at the bottom-centre of a half picture, box height = 1 unit
  function figure(c, rank, suit) {
    const cloth = CLOTH[suit];
    c.lineJoin = 'round'; c.strokeStyle = '#000'; c.lineWidth = 0.03;
    c.beginPath(); c.moveTo(-0.46, 0); c.lineTo(-0.42, -0.19); c.quadraticCurveTo(-0.3, -0.29, -0.12, -0.29); c.lineTo(0.12, -0.29);
    c.quadraticCurveTo(0.3, -0.29, 0.42, -0.19); c.lineTo(0.46, 0); c.closePath(); c.fillStyle = cloth; c.fill(); c.stroke();
    if (rank === 12) { // robot queen: a necklace of shiny bolts and a heart-shaped power light
      c.beginPath(); c.moveTo(-0.2, -0.28); c.quadraticCurveTo(0, -0.08, 0.2, -0.28); c.lineWidth = 0.02; c.strokeStyle = GOLD; c.stroke(); c.lineWidth = 0.03; c.strokeStyle = '#000';
      for (let i = 0; i < 7; i++) { const t = i / 6, x = -0.2 + 0.4 * t, y = (1 - t) * (1 - t) * -0.28 + 2 * (1 - t) * t * -0.08 + t * t * -0.28; ell(c, x, y, 0.025, 0.025, '#e8eef4'); }
      pip(c, 2, 0, -0.08, 0.09, false, '#ff4aa0');
    } else if (rank === 13) { // pilot king: a fur collar, brass buttons and a white silk scarf
      for (let i = 0; i < 7; i++) ell(c, -0.21 + i * 0.07, -0.28 + Math.sin(i * 1.7) * 0.012, 0.05, 0.045, '#f4ecd8', false);
      c.beginPath(); c.moveTo(0.08, -0.26); c.quadraticCurveTo(0.26, -0.2, 0.4, -0.27); c.lineTo(0.38, -0.17); c.quadraticCurveTo(0.24, -0.11, 0.08, -0.18); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.stroke();
      for (const y of [-0.14, -0.06]) ell(c, -0.1, y, 0.022, 0.022, GOLD);
    } else { // grot jack: rope collar and a little gold badge
      c.beginPath(); c.moveTo(-0.12, -0.29); c.lineTo(0, -0.15); c.lineTo(0.12, -0.29); c.lineWidth = 0.045; c.strokeStyle = GOLD; c.stroke(); c.lineWidth = 0.03; c.strokeStyle = '#000';
      ell(c, 0, -0.08, 0.045, 0.045, GOLD);
    }
    c.save();
    const hs = 0.84;
    c.translate(0, -0.56); c.scale(hs, hs); c.lineWidth = 0.03 / hs;
    if (rank === 11) grotHead(c, { hood: cloth }); else if (rank === 12) robotHead(c, { crown: true, lashes: true, lips: '#a0104a' }); else pilotKingHead(c);
    c.restore();
  }

  // ---- card faces
  // pip positions: [column (0 left, 1 middle, 2 right), row 0..1]
  const L = 0, M = 1, Rt = 2;
  const PIPS = {
    2: [[M, 0], [M, 1]], 3: [[M, 0], [M, .5], [M, 1]], 4: [[L, 0], [Rt, 0], [L, 1], [Rt, 1]],
    5: [[L, 0], [Rt, 0], [M, .5], [L, 1], [Rt, 1]], 6: [[L, 0], [Rt, 0], [L, .5], [Rt, .5], [L, 1], [Rt, 1]],
    7: [[L, 0], [Rt, 0], [M, .25], [L, .5], [Rt, .5], [L, 1], [Rt, 1]],
    8: [[L, 0], [Rt, 0], [M, .25], [L, .5], [Rt, .5], [M, .75], [L, 1], [Rt, 1]],
    9: [[L, 0], [Rt, 0], [L, 1 / 3], [Rt, 1 / 3], [M, .5], [L, 2 / 3], [Rt, 2 / 3], [L, 1], [Rt, 1]],
    10: [[L, 0], [Rt, 0], [M, 1 / 6], [L, 1 / 3], [Rt, 1 / 3], [L, 2 / 3], [Rt, 2 / 3], [M, 5 / 6], [L, 1], [Rt, 1]],
  };
  function rankText(c, t, x, y, fs, col) {
    c.font = `bold ${fs}px Arial, Helvetica, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillStyle = col;
    if (t === '10') { c.save(); c.translate(x, y); c.scale(0.74, 1); c.fillText('10', 0, 0); c.restore(); } else c.fillText(t, x, y);
  }
  function cardBase(c, w, h) {
    const r = Math.max(2, w * 0.07);
    rr(c, 0.5, 0.5, w - 1, h - 1, r); c.fillStyle = '#fff'; c.fill(); c.lineWidth = Math.max(1, w / 90); c.strokeStyle = '#000'; c.stroke();
    return r;
  }
  function drawFace(c, card, w, h, compact) {
    cardBase(c, w, h);
    const { s, r } = card, col = isRed(s) ? RED : INK;
    if (compact) {
      // big phone-friendly index across the top, the proper layout underneath
      const fs = Math.round(w * 0.36);
      rankText(c, RANK_S[r], w * 0.25, h * 0.035, fs, col);
      pip(c, s, w * 0.75, h * 0.035 + fs * 0.5, w * 0.3);
      const top = h * 0.4, bot = h * 0.93;
      if (r > 10) court(c, r, s, w * 0.08, top - h * 0.02, w * 0.84, bot - top + h * 0.03, true);
      else if (r === 1) pip(c, s, w / 2, (top + bot) / 2, w * 0.46);
      else { const z = w * 0.19, xs = [w * 0.27, w * 0.5, w * 0.73]; for (const [cx, ry] of PIPS[r]) pip(c, s, xs[cx], top + z * 0.5 + ry * (bot - top - z), z, ry > 0.5); }
      return;
    }
    const fs = Math.max(8, Math.round(w * 0.17)), ix = w * 0.105;
    const corner = () => { rankText(c, RANK_S[r], ix, h * 0.03, fs, col); pip(c, s, ix, h * 0.03 + fs + w * 0.065, w * 0.115); };
    corner(); c.save(); c.translate(w, h); c.rotate(Math.PI); corner(); c.restore();
    if (r > 10) court(c, r, s, w * 0.21, h * 0.12, w * 0.58, h * 0.76, false);
    else if (r === 1) {
      pip(c, s, w / 2, h / 2, w * (s === 3 ? 0.5 : 0.38));
      if (s === 3) { pip(c, s, w / 2, h / 2 - w * 0.02, w * 0.3, false, '#fff'); pip(c, s, w / 2, h / 2 - w * 0.02, w * 0.2, false, RED); }
    } else {
      const z = w * (r > 8 ? 0.18 : 0.2), xs = [w * 0.3, w * 0.5, w * 0.7], top = h * 0.12, bot = h * 0.88;
      for (const [cx, ry] of PIPS[r]) pip(c, s, xs[cx], top + z * 0.5 + ry * (bot - top - z), z, ry > 0.5);
    }
  }
  function court(c, r, s, bx, by, bw, bh, single) {
    const col = CLOTH[s];
    c.save();
    c.beginPath(); c.rect(bx, by, bw, bh); c.fillStyle = '#fdf1c8'; c.fill(); c.clip();
    // a faint pattern behind the character
    c.fillStyle = 'rgba(0,0,0,.05)'; for (let y = by; y < by + bh; y += Math.max(3, bw / 10)) c.fillRect(bx, y, bw, Math.max(1, bw / 40));
    const half = (ox, oy, hh) => { c.save(); const sc = Math.min(hh / 1.08, bw); c.translate(ox + bw / 2, oy + hh); c.scale(sc, sc); figure(c, r, s); c.restore(); };
    if (single) half(bx, by, bh);
    else {
      half(bx, by, bh / 2);
      c.save(); c.translate(bx + bw, by + bh); c.rotate(Math.PI); c.beginPath(); c.rect(0, 0, bw, bh / 2); c.clip(); half(0, 0, bh / 2); c.restore();
      c.beginPath(); c.moveTo(bx, by + bh / 2); c.lineTo(bx + bw, by + bh / 2); c.strokeStyle = col; c.lineWidth = Math.max(1, bw / 50); c.stroke();
    }
    c.restore();
    c.strokeStyle = col; c.lineWidth = Math.max(1, bw / 40); c.strokeRect(bx, by, bw, bh);
    if (!single) { pip(c, s, bx + bw * 0.13, by + bw * 0.14, bw * 0.17); pip(c, s, bx + bw * 0.87, by + bh - bw * 0.14, bw * 0.17, true); }
  }

  // ---- card backs (all original)
  function chequer(c, w, h, n, a, b) { const z = w / n; for (let y = 0; y * z < h; y++) for (let x = 0; x < n; x++) { c.fillStyle = (x + y) % 2 ? a : b; c.fillRect(x * z, y * z, z + 0.5, z + 0.5); } }
  function inUnits(c, cx, cy, s, fn) { c.save(); c.translate(cx, cy); c.scale(s, s); c.lineWidth = 0.035; fn(); c.restore(); }
  const BACKS = [
    { name: 'Ork', draw(c, w, h) { chequer(c, w, h, 6, '#b01010', '#1a1a1a'); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, w, h); inUnits(c, w / 2, h * 0.52, w * 0.95, () => orkHead(c, { scar: true })); } },
    { name: 'Blobbit', draw(c, w, h) {
      c.fillStyle = '#ffb000'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd34d'; for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) { c.beginPath(); c.arc((x + (y % 2) * 0.5) * w / 4, y * h / 7, w * 0.06, 0, TAU); c.fill(); }
      inUnits(c, w / 2, h * 0.5, w * 0.9, () => {
        c.strokeStyle = '#000'; c.lineJoin = 'round';
        // little feet and ears
        for (const sx of [-1, 1]) { ell(c, sx * 0.2, 0.38, 0.12, 0.06, '#e8381b'); c.save(); c.translate(sx * 0.24, -0.34); c.rotate(sx * 0.5); ell(c, 0, 0, 0.08, 0.12, '#e8381b'); ell(c, 0, 0.01, 0.04, 0.07, '#ff9a8a', false); c.restore(); }
        const g = c.createRadialGradient(-0.14, -0.16, 0.02, 0, 0, 0.42); g.addColorStop(0, '#ffb8a8'); g.addColorStop(0.35, '#ff4a2a'); g.addColorStop(1, '#a8140a');
        ell(c, 0, 0, 0.38, 0.36, g);
        // big shiny eyes
        for (const sx of [-1, 1]) { ell(c, sx * 0.13, -0.08, 0.1, 0.12, '#fff'); ell(c, sx * 0.13 + 0.015, -0.06, 0.055, 0.06, '#000', false); ell(c, sx * 0.13 - 0.01, -0.1, 0.022, 0.022, '#fff', false); }
        // happy grin with a tongue, rosy cheeks
        c.beginPath(); c.moveTo(-0.15, 0.1); c.quadraticCurveTo(0, 0.32, 0.15, 0.1); c.closePath(); c.fillStyle = '#5a0010'; c.fill(); c.stroke();
        c.save(); c.beginPath(); c.moveTo(-0.15, 0.1); c.quadraticCurveTo(0, 0.32, 0.15, 0.1); c.closePath(); c.clip(); ell(c, 0, 0.22, 0.08, 0.05, '#ff7aa0', false); c.restore();
        for (const sx of [-1, 1]) ell(c, sx * 0.25, 0.08, 0.05, 0.03, 'rgba(255,170,190,.8)', false);
      });
    } },
    { name: 'Cube', draw(c, w, h) {
      c.fillStyle = '#20105a'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = Math.max(1, w / 60); for (let i = -h; i < w + h; i += w / 5) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.moveTo(i, h); c.lineTo(i + h, 0); c.stroke(); }
      const a = w * 0.36, cx = w / 2, cy = h / 2;
      const faces = [[[cx, cy - a], [cx + a * 0.866, cy - a / 2], [cx - a * 0.866, cy - a / 2], ['#fff', '#ffd400', '#fff', '#ff7a00', '#fff', '#fff', '#2a8a2a', '#fff', '#ffd400']],
        [[cx - a * 0.866, cy - a / 2], [cx, cy], [cx - a * 0.866, cy + a / 2], ['#d42020', '#d42020', '#1e50d0', '#d42020', '#ffd400', '#d42020', '#d42020', '#fff', '#d42020']],
        [[cx, cy], [cx + a * 0.866, cy - a / 2], [cx, cy + a], ['#1e50d0', '#2a8a2a', '#1e50d0', '#1e50d0', '#1e50d0', '#ff7a00', '#d42020', '#1e50d0', '#1e50d0']]];
      for (const [o, p1, p2, cols] of faces) {
        const e1 = [(p1[0] - o[0]) / 3, (p1[1] - o[1]) / 3], e2 = [(p2[0] - o[0]) / 3, (p2[1] - o[1]) / 3];
        cols.forEach((col, k) => { const u = k % 3, v = (k / 3) | 0, P = (du, dv) => [o[0] + e1[0] * (u + du) + e2[0] * (v + dv), o[1] + e1[1] * (u + du) + e2[1] * (v + dv)];
          c.lineWidth = Math.max(1, w / 40); c.strokeStyle = '#000'; poly(c, [P(0, 0), P(1, 0), P(1, 1), P(0, 1)], col); });
      }
    } },
    { name: 'Stars', draw(c, w, h) {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#000040'); g.addColorStop(1, '#10107a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (let y = 0; y < 7; y++) for (let x = 0; x < 4; x++) { star(c, (x + (y % 2) * 0.5 + 0.25) * w / 4, (y + 0.5) * h / 7, w * 0.075); c.fillStyle = (x + y) % 3 ? '#ffd400' : '#fff'; c.fill(); }
    } },
    { name: 'Flames', draw(c, w, h) {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#000'); g.addColorStop(1, '#5a0000'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      const flame = (x, fw, fh, col) => { c.beginPath(); c.moveTo(x - fw / 2, h); c.bezierCurveTo(x - fw * 0.7, h - fh * 0.5, x - fw * 0.1, h - fh * 0.6, x + fw * 0.05, h - fh); c.bezierCurveTo(x + fw * 0.15, h - fh * 0.6, x + fw * 0.7, h - fh * 0.45, x + fw / 2, h); c.closePath(); c.fillStyle = col; c.fill(); };
      for (const [col, k] of [['#e01000', 1], ['#ff7a00', 0.72], ['#ffd400', 0.45]]) for (let i = -1; i < 5; i++) flame((i + 0.5) * w / 3.6, w * 0.42 * (0.8 + k * 0.4), h * k * (i % 2 ? 0.85 : 1), col);
    } },
    { name: 'JackOS Flag', draw(c, w, h) {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#4aa8ff'); g.addColorStop(1, '#c8e8ff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; [[0.75, 0.82, 0.13], [0.62, 0.86, 0.1], [0.88, 0.86, 0.09]].forEach(([x, y, r]) => { c.beginPath(); c.arc(w * x, h * y, w * r, 0, TAU); c.fill(); });
      c.fillStyle = '#2a8a2a'; c.beginPath(); c.moveTo(0, h); c.quadraticCurveTo(w * 0.3, h * 0.84, w * 0.55, h); c.fill();
      const px = w * 0.2, lw = Math.max(1, w / 50);
      c.fillStyle = '#5a3a1a'; c.fillRect(px - w * 0.025, h * 0.1, w * 0.05, h * 0.86); ell(c, px, h * 0.09, w * 0.05, w * 0.05, GOLD, false);
      // the JackOS cube-face flag, flapping in the breeze, on a pole (it's a flag, see)
      const fw = w * 0.7, fh = h * 0.36, fx = px + w * 0.025, fy = h * 0.14;
      const Y = (x, k) => fy + k * fh + Math.sin((x - fx) / fw * Math.PI * 1.6) * h * 0.035 * ((x - fx) / fw);
      const quad = (x0, x1, k0, k1, col) => { c.beginPath(); for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / 8) c.lineTo(x, Y(x, k0)); for (let x = x1; x >= x0 - 0.1; x -= (x1 - x0) / 8) c.lineTo(x, Y(x, k1)); c.closePath(); c.fillStyle = col; c.fill(); };
      const CUBE = ['#e8141c', '#ffd200', '#1650e0', '#00a83a', '#fff', '#ff7a00', '#1650e0', '#e8141c', '#ffd200']; // the JackOS cube face
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) quad(fx + fw * i / 3, fx + fw * (i + 1) / 3, j / 3, (j + 1) / 3, CUBE[j * 3 + i]);
      c.beginPath(); for (let x = fx; x <= fx + fw + 0.1; x += fw / 16) c.lineTo(x, Y(x, 0)); for (let x = fx + fw; x >= fx - 0.1; x -= fw / 16) c.lineTo(x, Y(x, 1)); c.closePath(); c.strokeStyle = '#000'; c.lineWidth = lw; c.stroke();
      c.fillStyle = '#fff'; c.font = `bold ${Math.round(w * 0.16)}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeStyle = '#000'; c.lineWidth = lw * 1.5;
      c.strokeText('J', fx + fw / 2, Y(fx + fw / 2, 0.5)); c.fillText('J', fx + fw / 2, Y(fx + fw / 2, 0.5));
    } },
    { name: 'Wizard', draw(c, w, h) {
      c.fillStyle = '#5a2a8a'; c.fillRect(0, 0, w, h); c.fillStyle = '#6e3aa0'; for (let i = -h; i < w; i += w / 4) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + w / 8, 0); c.lineTo(i + w / 8 + h, h); c.lineTo(i + h, h); c.fill(); }
      c.fillStyle = '#ffd400'; for (let i = 0; i < 16; i++) { star(c, ((i * 37) % 100) / 100 * w, ((i * 61) % 100) / 100 * h, w * (i % 3 ? 0.025 : 0.04)); c.fill(); }
      inUnits(c, w / 2, h * 0.56, w * 0.95, () => grotHead(c, { hood: '#c8102e' }));
    } },
    { name: 'Castle', draw(c, w, h) {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#000830'); g.addColorStop(1, '#203a90'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; for (let i = 0; i < 14; i++) c.fillRect((i * 37 % 100) / 100 * w, (i * 53 % 50) / 100 * h, Math.max(1, w / 50), Math.max(1, w / 50));
      ell(c, w * 0.76, h * 0.16, w * 0.11, w * 0.11, '#fff4b0', false); ell(c, w * 0.8, h * 0.14, w * 0.1, w * 0.1, '#0a1240', false);
      c.fillStyle = '#2a7a2a'; c.beginPath(); c.moveTo(0, h); c.quadraticCurveTo(w / 2, h * 0.7, w, h); c.fill();
      const st = '#8a8f9a', bl = (x, y, ww, hh) => { c.fillStyle = st; c.fillRect(x, y, ww, hh); const m = ww / 5; for (let i = 0; i < 5; i += 2) c.fillRect(x + i * m, y - m, m, m); };
      bl(w * 0.22, h * 0.52, w * 0.56, h * 0.36); bl(w * 0.1, h * 0.38, w * 0.2, h * 0.5); bl(w * 0.7, h * 0.38, w * 0.2, h * 0.5); bl(w * 0.4, h * 0.3, w * 0.2, h * 0.3);
      c.fillStyle = '#e10600'; poly(c, [[w * 0.5, h * 0.12], [w * 0.62, h * 0.16], [w * 0.5, h * 0.2]], '#e10600', false); c.fillRect(w * 0.49, h * 0.12, Math.max(1, w / 50), h * 0.15);
      c.fillStyle = '#ffd400'; [[0.18, 0.5], [0.78, 0.5], [0.48, 0.4]].forEach(([x, y]) => c.fillRect(w * x, h * y, w * 0.05, h * 0.06));
      c.fillStyle = '#3a2410'; c.beginPath(); c.moveTo(w * 0.42, h * 0.88); c.lineTo(w * 0.42, h * 0.74); c.arc(w * 0.5, h * 0.74, w * 0.08, Math.PI, 0); c.lineTo(w * 0.58, h * 0.88); c.fill();
    } },
    { name: 'Fish', draw(c, w, h) {
      c.fillStyle = '#0a5ab8'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = Math.max(1, w / 50); for (let y = h * 0.08; y < h; y += h / 8) { c.beginPath(); for (let x = 0; x <= w; x += w / 8) c.lineTo(x, y + Math.sin(x / w * TAU * 2) * h * 0.012); c.stroke(); }
      const fish = (x, y, s, col, dir) => { c.save(); c.translate(x, y); c.scale(s * dir, s); c.lineWidth = 0.06; c.strokeStyle = '#000';
        c.beginPath(); c.moveTo(0.5, 0); c.quadraticCurveTo(0, -0.42, -0.4, 0); c.quadraticCurveTo(0, 0.42, 0.5, 0); c.fillStyle = col; c.fill(); c.stroke();
        poly(c, [[-0.35, 0], [-0.7, -0.28], [-0.7, 0.28]], col); ell(c, 0.25, -0.06, 0.07, 0.07, '#fff'); ell(c, 0.27, -0.06, 0.03, 0.03, '#000', false); c.restore(); };
      fish(w * 0.35, h * 0.25, w * 0.42, '#ff8a00', 1); fish(w * 0.62, h * 0.52, w * 0.42, '#ffd400', -1); fish(w * 0.36, h * 0.78, w * 0.42, '#ff5aa8', 1);
      c.strokeStyle = 'rgba(255,255,255,.8)'; [[0.82, 0.2, 0.04], [0.86, 0.12, 0.025], [0.14, 0.6, 0.03], [0.1, 0.52, 0.02]].forEach(([x, y, r]) => { c.beginPath(); c.arc(w * x, h * y, w * r, 0, TAU); c.stroke(); });
    } },
    { name: 'Robot', draw(c, w, h) {
      chequer(c, w, h, 8, '#c01818', '#f0f0f0');
      c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(0, 0, w, h);
      inUnits(c, w / 2, h * 0.5, w * 0.9, () => {
        c.strokeStyle = '#000';
        for (const sx of [-1, 1]) { rr(c, sx > 0 ? 0.3 : -0.42, 0.18, 0.12, 0.36, 0.04); c.fillStyle = '#8a949e'; c.fill(); c.stroke(); ell(c, sx * 0.36, 0.58, 0.07, 0.05, '#555'); }
        rr(c, -0.3, 0.12, 0.6, 0.5, 0.05); c.fillStyle = '#9aa4ae'; c.fill(); c.stroke();
        ell(c, 0, 0.3, 0.09, 0.09, '#ffd400'); c.beginPath(); c.moveTo(0, 0.3); c.lineTo(0.05, 0.24); c.stroke();
        rr(c, -0.2, 0.44, 0.4, 0.08, 0.02); c.fillStyle = '#2a2'; c.fill(); c.stroke();
        c.save(); c.translate(0, -0.18); c.scale(0.7, 0.7); c.lineWidth = 0.05; robotHead(c, { ant: '#e10600' }); c.restore();
      });
    } },
    { name: 'Rocket', draw(c, w, h) {
      c.fillStyle = '#05051a'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; for (let i = 0; i < 22; i++) c.fillRect((i * 41 % 97) / 97 * w, (i * 67 % 89) / 89 * h, Math.max(1, w / 60), Math.max(1, w / 60));
      ell(c, w * 0.22, h * 0.8, w * 0.2, w * 0.2, '#c86a2a', false); c.strokeStyle = '#ffd38a'; c.lineWidth = Math.max(1, w / 40); c.beginPath(); c.ellipse(w * 0.22, h * 0.8, w * 0.32, w * 0.07, -0.3, 0, TAU); c.stroke();
      c.save(); c.translate(w * 0.56, h * 0.45); c.rotate(0.5); const s = w * 0.9; c.scale(s, s); c.lineWidth = 0.03; c.strokeStyle = '#000';
      c.beginPath(); c.moveTo(-0.06, 0.24); c.quadraticCurveTo(0, 0.5, 0.06, 0.24); c.fillStyle = '#ffd400'; c.fill(); c.beginPath(); c.moveTo(-0.03, 0.24); c.quadraticCurveTo(0, 0.38, 0.03, 0.24); c.fillStyle = '#ff5a00'; c.fill();
      for (const sx of [-1, 1]) poly(c, [[sx * 0.08, 0.06], [sx * 0.18, 0.26], [sx * 0.08, 0.22]], '#e10600');
      c.beginPath(); c.moveTo(0, -0.36); c.bezierCurveTo(0.14, -0.2, 0.1, 0.1, 0.08, 0.24); c.lineTo(-0.08, 0.24); c.bezierCurveTo(-0.1, 0.1, -0.14, -0.2, 0, -0.36); c.fillStyle = '#eee'; c.fill(); c.stroke();
      ell(c, 0, -0.06, 0.05, 0.05, '#4ac0ff'); poly(c, [[0, -0.36], [0.065, -0.26], [-0.065, -0.26]], '#e10600');
      c.restore();
    } },
    { name: 'Gubbinz (secret)', anim: 8, draw(c, w, h, f) {
      c.fillStyle = '#7ec8ff'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; [[0.2, 0.12, 0.12], [0.32, 0.1, 0.09], [0.78, 0.86, 0.14], [0.66, 0.9, 0.1]].forEach(([x, y, r]) => { c.beginPath(); c.arc(w * x, h * y, w * r, 0, TAU); c.fill(); });
      c.fillStyle = '#3aa02a'; c.fillRect(0, h * 0.84, w, h * 0.16);
      const wave = Math.sin(f / 8 * TAU) * 0.5;
      inUnits(c, w / 2, h * 0.56, w * 0.7, () => {
        c.strokeStyle = '#000';
        c.save(); c.translate(0.3, 0.32); c.rotate(-1.1 + wave); rr(c, -0.04, -0.4, 0.09, 0.42, 0.04); c.fillStyle = '#5aac2c'; c.fill(); c.stroke(); ell(c, 0, -0.42, 0.08, 0.08, '#5aac2c'); c.restore();
        rr(c, -0.26, 0.24, 0.52, 0.42, 0.1); c.fillStyle = '#c8102e'; c.fill(); c.stroke();
        gubbinzHead(c, { blink: f === 3 });
      });
      if (f % 4 < 2) { c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = Math.max(1, w / 50); rr(c, w * 0.06, h * 0.06, w * 0.34, h * 0.13, w * 0.04); c.fill(); c.stroke(); rankText(c, 'HI!', w * 0.23, h * 0.075, Math.round(w * 0.12), '#000'); }
    } },
  ];
  const SECRET_BACK = 11;
  function drawBack(c, id, w, h, f) {
    const r = cardBase(c, w, h);
    const m = Math.max(2, Math.round(w * 0.07));
    c.save(); rr(c, m, m, w - 2 * m, h - 2 * m, r * 0.5); c.clip(); c.translate(m, m);
    (BACKS[id] || BACKS[0]).draw(c, w - 2 * m, h - 2 * m, f || 0); c.restore();
    rr(c, m, m, w - 2 * m, h - 2 * m, r * 0.5); c.strokeStyle = '#000'; c.lineWidth = Math.max(1, w / 90); c.stroke();
  }
  const cache = new Map();
  function sprite(key, w, h, fn) {
    let cv = cache.get(key);
    if (!cv) {
      if (cache.size > 500) cache.clear();
      cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h); cache.set(key, cv);
    }
    return cv;
  }
  const faceSprite = (card, w, h, compact) => sprite(`f${card.s}.${card.r}.${w}.${h}.${compact ? 1 : 0}`, w, h, (c) => drawFace(c, card, w, h, compact));
  const backSprite = (id, w, h, f) => sprite(`b${id}.${w}.${h}.${BACKS[id] && BACKS[id].anim ? f % BACKS[id].anim : 0}`, w, h, (c) => drawBack(c, id, w, h, f));

  // ================================================================ the table: one canvas, tweened cards, drag + tap
  function Table(game) {
    const cv = document.createElement('canvas'); cv.className = 'solcv'; cv.tabIndex = 0;
    cv.setAttribute('aria-label', game.label || 'Card table');
    const ctx = cv.getContext('2d');
    const T = { cv, ctx, W: 71, H: 96, cw: 1, ch: 1, dpr: 1, piles: [], drag: null, sel: null, press: null, mode: 'play', compact: false, raf: 0, frame: 0, speed: 1, outline: false, lastTap: null };
    T.pos = (c, t) => {
      if (t >= c.t1) return [c.bx, c.by];
      if (t <= c.t0) return [c.ax, c.ay];
      const p = (t - c.t0) / (c.t1 - c.t0), e = 1 - Math.pow(1 - p, 3);
      return [c.ax + (c.bx - c.ax) * e, c.ay + (c.by - c.ay) * e];
    };
    T.target = (p, i) => [p.x + (p.ox[i] || 0), p.y + (p.oy[i] || 0)];
    T.place = snap => {
      game.layout(T);
      const t = now();
      for (const p of T.piles) p.cards.forEach((c, i) => {
        const [x, y] = T.target(p, i);
        if (snap || c.bx === undefined) { c.ax = c.bx = x; c.ay = c.by = y; c.t0 = c.t1 = 0; }
        else if (Math.abs(c.bx - x) > 0.5 || Math.abs(c.by - y) > 0.5) {
          const [cx, cy] = T.pos(c, t), d = Math.hypot(x - cx, y - cy);
          c.ax = cx; c.ay = cy; c.bx = x; c.by = y; c.t0 = t + (c.delay || 0); c.t1 = c.t0 + (game.quick && game.quick() ? 1 : 90 + Math.min(230, d * 0.45));
        }
        c.delay = 0;
      });
      T.kick();
    };
    T.snapTo = (cards, x, y) => cards.forEach(c => { c.ax = c.bx = x; c.ay = c.by = y; c.t0 = c.t1 = 0; });
    T.settled = () => { const t = now(); return T.piles.every(p => p.cards.every(c => t >= c.t1 && (!c.f0 || t >= c.f0 + 170))); };
    T.resize = () => {
      const host = cv.parentNode; if (!host) return;
      const r = host.getBoundingClientRect();
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const cw = Math.max(50, Math.floor(r.width)), ch = Math.max(50, Math.floor(r.height));
      if (cw === T.cw && ch === T.ch && dpr === T.dpr && cv.width) return;
      T.cw = cw; T.ch = ch; T.dpr = dpr;
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
      if (T.mode !== 'play' && game.stopBounce) game.stopBounce(true);
      T.mode = 'play';
      T.place(true); T.draw();
    };
    const dev = v => Math.round(v * T.dpr);
    T.img = (c, up) => up ? faceSprite(c, dev(T.W), dev(T.H), T.compact) : backSprite(game.back(), dev(T.W), dev(T.H), T.frame);
    let busy = false;
    T.blit = (c, x, y, t) => {
      let up = c.up, s = 1;
      if (c.f0 && t < c.f0 + 170) { busy = true; if (t < c.f0 + 85) up = !up; if (t > c.f0) s = Math.max(0.04, Math.abs(Math.cos((t - c.f0) / 170 * Math.PI))); }
      const img = T.img(c, up);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const X = dev(x), Y = dev(y);
      if (s === 1) ctx.drawImage(img, X, Y); else { const w = img.width * s; ctx.drawImage(img, X + (img.width - w) / 2, Y, w, img.height); }
      ctx.setTransform(T.dpr, 0, 0, T.dpr, 0, 0);
    };
    T.slot = (x, y, kind) => { // an empty place on the felt
      const { W, H } = T, r = Math.max(2, W * 0.07);
      ctx.save();
      if (kind === 'sunk') {
        ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x, y, W, H);
        ctx.fillStyle = '#003000'; ctx.fillRect(x, y, W, 1.5); ctx.fillRect(x, y, 1.5, H);
        ctx.fillStyle = '#20c020'; ctx.fillRect(x, y + H - 1.5, W, 1.5); ctx.fillRect(x + W - 1.5, y, 1.5, H);
      } else {
        rr(ctx, x + 1, y + 1, W - 2, H - 2, r); ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,30,0,.75)'; ctx.stroke();
        rr(ctx, x + 2.5, y + 2.5, W - 5, H - 5, r); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(160,255,160,.25)'; ctx.stroke();
      }
      ctx.restore();
    };
    T.draw = () => {
      if (T.mode !== 'play') return;
      busy = false;
      const t = now();
      ctx.setTransform(T.dpr, 0, 0, T.dpr, 0, 0);
      ctx.fillStyle = '#008000'; ctx.fillRect(0, 0, T.cw, T.ch);
      for (const p of T.piles) game.drawSlot(T, p);
      if (game.drawExtra) game.drawExtra(T);
      const d = T.drag && T.drag.live ? T.drag : null, lifted = d && !T.outline ? new Set(d.cards) : null, moving = [];
      for (const p of T.piles) for (const c of p.cards) {
        if (lifted && lifted.has(c)) continue;
        if (t < c.t1) { moving.push(c); busy = true; continue; }
        T.blit(c, c.bx, c.by, t);
      }
      moving.sort((a, b) => (a.t0 <= t) - (b.t0 <= t) || ((a.t0 <= t) ? a.t0 - b.t0 : b.t0 - a.t0));
      for (const c of moving) { const [x, y] = T.pos(c, t); T.blit(c, x, y, t); }
      // the selection: inverted, like the real thing
      const s = T.sel;
      if (s && s.pile.cards[s.i] === s.card) {
        const [x0, y0] = T.target(s.pile, s.i), [x1, y1] = T.target(s.pile, s.pile.cards.length - 1);
        ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff';
        rr(ctx, x0, y0, x1 - x0 + T.W, y1 - y0 + T.H, Math.max(2, T.W * 0.07)); ctx.fill(); ctx.restore();
      } else T.sel = null;
      if (d) {
        const fx = d.x - d.gx, fy = d.y - d.gy;
        d.cards.forEach((c, k) => {
          const x = fx + (d.from.ox[d.i + k] || 0) - (d.from.ox[d.i] || 0), y = fy + (d.from.oy[d.i + k] || 0) - (d.from.oy[d.i] || 0);
          if (T.outline) { ctx.save(); ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5; ctx.strokeStyle = '#000'; ctx.strokeRect(x + 0.5, y + 0.5, T.W - 1, T.H - 1); ctx.strokeStyle = '#fff'; ctx.lineDashOffset = 3; ctx.strokeRect(x + 0.5, y + 0.5, T.W - 1, T.H - 1); ctx.restore(); }
          else T.blit(c, x, y, t);
        });
      }
      if (game.drawTop) game.drawTop(T);
      if (busy) T.kick();
    };
    T.kick = () => { if (!T.raf) T.raf = requestAnimationFrame(() => { T.raf = 0; T.draw(); }); };
    T.hit = (x, y) => {
      for (let pi = T.piles.length - 1; pi >= 0; pi--) {
        const p = T.piles[pi];
        for (let i = p.cards.length - 1; i >= 0; i--) { const c = p.cards[i]; if (x >= c.bx && x < c.bx + T.W && y >= c.by && y < c.by + T.H) return { pile: p, i, card: c }; }
      }
      return null;
    };
    T.zone = p => { // tap / drop zone of a pile (columns reach down to the bottom of the table)
      const n = p.cards.length, [lx, ly] = n ? T.target(p, n - 1) : [p.x, p.y];
      return { x: p.x, y: p.y, w: Math.max(lx - p.x, 0) + T.W, h: p.kind === 'tab' ? Math.max(T.ch - p.y, ly - p.y + T.H) : Math.max(ly - p.y, 0) + T.H };
    };
    T.zoneAt = (x, y) => { for (let pi = T.piles.length - 1; pi >= 0; pi--) { const z = T.zone(T.piles[pi]); if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return T.piles[pi]; } return null; };
    const pt = ev => { const r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    cv.addEventListener('pointerdown', ev => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      ev.preventDefault();
      try { cv.focus({ preventScroll: true }); } catch (e) {}
      if (T.mode === 'bounce') { if (game.skipBounce) game.skipBounce(); return; }
      if (T.mode !== 'play' || (game.locked && game.locked())) return;
      const { x, y } = pt(ev), h = T.hit(x, y);
      T.press = { x, y, id: ev.pointerId, touch: ev.pointerType !== 'mouse' };
      T.drag = null;
      if (h && game.canPick(h.pile, h.i)) { const [cx, cy] = T.target(h.pile, h.i); T.drag = { from: h.pile, i: h.i, cards: h.pile.cards.slice(h.i), gx: x - cx, gy: y - cy, x, y, live: false }; }
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
    });
    cv.addEventListener('pointermove', ev => {
      const { x, y } = pt(ev);
      if (game.hover) game.hover(T, x, y);
      const p = T.press; if (!p || ev.pointerId !== p.id || !T.drag) return;
      const d = T.drag; d.x = x; d.y = y;
      if (!d.live && Math.hypot(x - p.x, y - p.y) > (p.touch ? 9 : 4)) { d.live = true; T.sel = null; }
      if (d.live) T.kick();
    });
    const finish = (ev, cancel) => {
      const p = T.press; if (!p || ev.pointerId !== p.id) return;
      T.press = null;
      const d = T.drag; T.drag = null;
      const { x, y } = pt(ev);
      if (d && d.live) drop(d, cancel);
      else if (!cancel) tap(x, y);
      T.kick();
    };
    cv.addEventListener('pointerup', ev => finish(ev, false));
    cv.addEventListener('pointercancel', ev => finish(ev, true));
    cv.addEventListener('contextmenu', ev => { ev.preventDefault(); if (T.mode === 'bounce') return game.skipBounce && game.skipBounce(); if (T.mode === 'play' && game.right) game.right(); });
    function drop(d, cancel) {
      const fx = d.x - d.gx, fy = d.y - d.gy;
      if (!T.outline) d.cards.forEach((c, k) => T.snapTo([c], fx + (d.from.ox[d.i + k] || 0) - (d.from.ox[d.i] || 0), fy + (d.from.oy[d.i + k] || 0) - (d.from.oy[d.i] || 0)));
      let best = null, area = 0;
      if (!cancel) {
        for (const p of T.piles) {
          if (p === d.from || !game.canDrop(d.cards, d.from, p)) continue;
          const n = p.cards.length, [rx, ry] = n ? T.target(p, n - 1) : [p.x, p.y];
          const ox = Math.min(fx + T.W, rx + T.W) - Math.max(fx, rx), oy = Math.min(fy + T.H, ry + T.H) - Math.max(fy, ry);
          if (ox > 0 && oy > 0 && ox * oy > area) { area = ox * oy; best = p; }
        }
        if (!best) { const p = T.zoneAt(d.x, d.y); if (p && p !== d.from && game.canDrop(d.cards, d.from, p)) best = p; }
      }
      if (best) game.move(d.from, d.i, best, 'drag');
      else if (!cancel && game.badDrop) game.badDrop(d, T.zoneAt(d.x, d.y));
      T.place();
    }
    function tap(x, y) {
      const h = T.hit(x, y), p = h ? h.pile : T.zoneAt(x, y), t = now();
      const dbl = h && T.lastTap && T.lastTap.card === h.card && T.lastTap.pile === h.pile && t - T.lastTap.t < 450;
      T.lastTap = dbl ? null : { card: h && h.card, pile: h && h.pile, t };
      if (dbl) { T.sel = null; game.dbl(h.pile, h.i); return; }
      const s = T.sel;
      if (s) {
        T.sel = null;
        if (p === s.pile) return;
        if (p && game.tryMove(s.pile, s.i, p)) return;
      }
      if (game.click(h, p)) { if (p && p.kind === 'stock') T.lastTap = null; return; }
      if (h && game.canPick(h.pile, h.i)) T.sel = game.selectFor ? game.selectFor(h) : { pile: h.pile, i: h.i, card: h.card };
    }
    // the famous finale: cards leap off the foundations and bounce along the bottom, leaving trails
    T.bounce = (launch, done) => {
      T.mode = 'play'; T.drag = null; T.sel = null; T.draw();
      T.mode = 'bounce';
      let cur = null, last = now(), acc = 0;
      const sc = T.W / 71, g = 0.6 * sc;
      const step = () => {
        if (!cur) {
          cur = launch(); if (!cur) return false;
          cur.vx = (Math.random() < 0.5 ? -1 : 1) * rnd(2.5, 7.5) * sc * Math.max(1, T.cw / 600);
          cur.vy = -rnd(0, 9) * sc;
        }
        cur.x += cur.vx; cur.vy += g; cur.y += cur.vy;
        if (cur.y + T.H > T.ch) { cur.y = T.ch - T.H; cur.vy = -cur.vy * rnd(0.7, 0.86); }
        T.blit(cur.card, cur.x, cur.y, 1e12);
        if (cur.x + T.W < 0 || cur.x > T.cw) cur = null;
        return true;
      };
      const frame = () => {
        if (T.mode !== 'bounce') return;
        const t = now(); acc += Math.min(100, t - last); last = t;
        let n = 0;
        while (acc >= 16.6 || n === 0) { acc = Math.max(0, acc - 16.6); for (let k = 0; k < T.speed; k++) if (!step()) { T.mode = 'done'; done(true); return; } if (++n > 4) { acc = 0; break; } }
        T.braf = requestAnimationFrame(frame);
      };
      T.braf = requestAnimationFrame(frame);
    };
    T.stopBounceLoop = () => { cancelAnimationFrame(T.braf); };
    return T;
  }

  // ================================================================ shared bits: dialogs, icons, decks
  const ICON = {
    sol32: '<svg viewBox="0 0 32 32"><rect x="2.5" y="3.5" width="16" height="22" rx="2" fill="#fff" stroke="#000"/><rect x="4.5" y="5.5" width="12" height="18" fill="#2349b8"/><path d="M6 8l9 13M15 8L6 21" stroke="#ffd400"/><g transform="rotate(14 21 18)"><rect x="12.5" y="7.5" width="16" height="22" rx="2" fill="#fff" stroke="#000"/><path d="M20.5 22c-1-1.5-5-3.5-5-6.5 0-2 2.5-3 5-0.5 2.5-2.5 5-1.5 5 0.5 0 3-4 5-5 6.5z" fill="#d00000"/><path d="M14 13.5l1.7-4.5 1.7 4.5M14.6 12h2.2" stroke="#d00000" fill="none"/></g></svg>',
    sol16: '<svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="8" height="11" fill="#2349b8" stroke="#000"/><rect x="6.5" y="4.5" width="8" height="11" fill="#fff" stroke="#000"/><path d="M10.5 13c-.6-1-2.6-2-2.6-3.4 0-1 1.4-1.5 2.6-.3 1.2-1.2 2.6-.7 2.6.3 0 1.4-2 2.4-2.6 3.4z" fill="#d00000"/></svg>',
    fc32: '<svg viewBox="0 0 32 32"><g transform="rotate(-12 10 20)"><rect x="3.5" y="9.5" width="14" height="19" rx="2" fill="#fff" stroke="#000"/><path d="M7 14l2 4-2 4M8.5 17h0" stroke="#000"/></g><g transform="rotate(10 22 20)"><rect x="14.5" y="9.5" width="14" height="19" rx="2" fill="#fff" stroke="#000"/><path d="M21.5 15l3 4-3 4-3-4z" fill="#d00000"/></g><path d="M9 9l2-6 3 4 2-5 2 5 3-4 2 6z" fill="#f2b600" stroke="#000"/><circle cx="16" cy="6" r="1.2" fill="#d00000"/></svg>',
    fc16: '<svg viewBox="0 0 16 16"><rect x="1.5" y="5.5" width="7" height="10" fill="#fff" stroke="#000"/><rect x="7.5" y="5.5" width="7" height="10" fill="#fff" stroke="#000"/><path d="M11 8l2 2.5-2 2.5-2-2.5z" fill="#d00000"/><path d="M4 5l1-4 2 2.5L8 .5l1 3L11 1l1 4z" fill="#f2b600" stroke="#000" stroke-width=".6"/></svg>',
  };
  // the official JackOS 98 icons (icons.js) where they're the specific match
  if (window.JICON) Object.assign(ICON, { sol32: JICON.get('cards', 32), sol16: JICON.get('cards', 16), fc32: JICON.get('freecell', 32), fc16: JICON.get('freecell', 16) });
  function dialog(title, html, buttons, o) {
    o = o || {};
    const f = document.createElement('form'); f.className = 'soldlg';
    f.innerHTML = html + '<div class="row soldbtns"></div>';
    const w = Apps.win(title, f, Object.assign({ w: 320, noResize: true, noMax: true, noMin: true, escClose: true }, o));
    const row = f.querySelector('.soldbtns');
    buttons.forEach(([label, fn], i) => {
      const b = document.createElement('button'); b.className = 'btn'; b.type = i === 0 ? 'submit' : 'button'; b.textContent = label;
      b.addEventListener('click', ev => { ev.preventDefault(); if (fn && fn(f, w) === false) return; w.close(); });
      row.appendChild(b);
      if (i === 0) setTimeout(() => { try { b.focus(); } catch (e) {} }, 40);
    });
    f.addEventListener('submit', ev => ev.preventDefault());
    return { w, f };
  }
  function msg(title, text, icon, buttons) { const m = Desk.msgbox(title, text, icon, buttons); try { m.el.classList.add('solmsg'); } catch (e) {} return m; }
  function newDeck() { const d = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ id: s * 13 + r - 1, s, r, up: false }); return d; }
  const pile = (kind, n) => ({ kind, n, cards: [], x: 0, y: 0, ox: [], oy: [] });
  const top = p => p.cards[p.cards.length - 1];
  const fmtCash = v => (v < 0 ? '-$' : '$') + Math.abs(v);
  const cardName = c => `${RANK_N[c.r]} of ${SUIT_N[c.s]}`;
  function fitWindow(w) { if (innerWidth < 700 || innerHeight < 520) { w.el.classList.add('maxwin'); setTimeout(() => window.dispatchEvent(new Event('resize')), 30); } }
  function hookResize(T, host, w) {
    let ro = null;
    const fn = () => T.resize();
    if (window.ResizeObserver) { ro = new ResizeObserver(fn); ro.observe(host); }
    window.addEventListener('resize', fn);
    setTimeout(fn, 0);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', fn); };
  }

  // ================================================================ SOLITAIRE (Klondike)
  const OPT_DEF = { draw: 1, scoring: 'std', timed: true, outline: false, status: true, keep: true, back: 2 };
  let solOpts = Object.assign({}, OPT_DEF, store.get('jhp_sol_opts', {}));
  const saveOpts = () => store.set('jhp_sol_opts', solOpts);
  const solStats = () => Object.assign({ played: 0, won: 0, won3: 0, best: 0, bestScore: 0, dealt: 0 }, store.get('jhp_sol_stats', {}));
  const saveSolStats = s => store.set('jhp_sol_stats', s);
  const backUnlocked = () => !!store.get('jhp_sol_back11', 0);
  function unlockBack() {
    if (backUnlocked()) return false;
    store.set('jhp_sol_back11', 1); secret('sol.secretback');
    Desk.toast('Solitaire', 'A mysterious new card back has appeared in Game > Deck...', 6000); sfx('solve');
    return true;
  }
  function triedBack(id) {
    const tried = store.get('jhp_sol_backs', []);
    if (!tried.includes(id)) { tried.push(id); store.set('jhp_sol_backs', tried); }
    if (tried.length >= BACKS.length) secret('sol.allbacks');
  }

  Apps.register('sol', { single: true, cmd: ['sol', 'solitaire', 'klondike', 'patience'], open() { return openSolitaire(); } });
  function openSolitaire() {
    const deck = newDeck();
    const stock = pile('stock'), waste = pile('waste'), found = [0, 1, 2, 3].map(n => pile('found', n)), tab = [0, 1, 2, 3, 4, 5, 6].map(n => pile('tab', n));
    let G = null, timer = 0, animT = 0, autoT = 0;
    const game = {
      label: 'Solitaire table',
      back: () => solOpts.back,
      locked: () => !!autoT,
      layout, drawSlot, canPick, canDrop, move, click, dbl, tryMove, right: autoPlay, skipBounce: () => endBounce(false), stopBounce: () => endBounce(false, true),
    };
    const T = Table(game);
    T.piles = [stock, waste, ...found, ...tab];
    const wrap = document.createElement('div'); wrap.className = 'solwrap'; wrap.appendChild(T.cv);
    const w = Apps.win('Solitaire', wrap, { w: 640, h: 500, icon: ICON.sol16, menubar: true, status: true, cls: 'solwin', minW: 250, minH: 230, onClose: closing });
    // the game in progress is saved (js/gamesave.js): every card in every pile, face up or down, plus score, time and undo
    const saver = Apps.gameSaver ? Apps.gameSaver('sol', () => (!G || !G.started || G.won) ? null : { p: T.piles.map(p => p.cards.map(c => c.id * 2 + (c.up ? 1 : 0))), draw: solOpts.draw, scoring: solOpts.scoring, score: G.score, time: G.time, fan: G.fan, passes: G.passes, undos: G.undos, cheated: G.cheated, base: G.base, undo: G.undo.slice(-40) }, { v: 1, live: true }).watch(w) : null;
    fitWindow(w);
    const stL = w.status, stR = document.createElement('span'); stR.className = 'solst2'; stL.parentNode.appendChild(stR);
    const unhook = hookResize(T, wrap, w);
    T.outline = solOpts.outline;
    applyStatusBar();
    Apps.menubar(w, [
      ['Game', () => [
        { label: 'Deal', key: 'F2', act: deal }, '-',
        { label: 'Undo', key: 'Ctrl+Z', dis: !G || !G.undo.length || G.won, act: undo }, '-',
        { label: 'Deck...', act: deckDialog }, { label: 'Options...', act: optionsDialog }, { label: 'Statistics...', act: statsDialog },
        { label: 'Auto-play (right-click)', act: autoPlay }, '-',
        { label: 'Exit', act: () => w.close() },
      ]],
      ['Help', () => [
        { label: 'Contents', key: 'F1', act: help }, { label: 'How to Play with the Mouse', act: () => msg('Solitaire', 'Drag cards with the mouse, or click a card to pick it up and then click where it should go. Double-click to send a card up to the aces. Game > Auto-play does what right-click does.', 'info') }, '-',
        { label: 'About Solitaire', act: () => msg('About Solitaire', 'Solitaire for JackOS 98\nVersion 4.10.1999\n\nCard art painted by Jack with the mouse, one pixel at a time. The Jacks are apprentice wizards, the Queens are robots and the Kings are Ork Warbosses (Jack painted one for his bits box), obviously.\n\nPhysical memory available to JackOS: 32,768 KB', 'info') },
      ]],
    ]);
    w.el.addEventListener('keydown', ev => {
      if (ev.key === 'F2') { ev.preventDefault(); deal(); }
      else if (ev.key === 'F1') { ev.preventDefault(); help(); }
      else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') { ev.preventDefault(); undo(); }
      else if (ev.key === 'Escape') { T.sel = null; T.kick(); }
      else if (ev.altKey && ev.shiftKey && ev.code === 'Digit2') { ev.preventDefault(); cheatWin(); }
    });
    T.resize();
    timer = setInterval(tick, 1000);
    animT = setInterval(() => { if (BACKS[solOpts.back] && BACKS[solOpts.back].anim && T.mode === 'play') { T.frame++; if (stock.cards.length || tab.some(p => p.cards.some(c => !c.up))) T.kick(); } }, 170);
    if (!resume()) deal(true);

    function resume() { // carry on with the saved game (if there is a good one)
      const s = saver && saver.load(); if (!s || !Array.isArray(s.p) || s.p.length !== T.piles.length) return false;
      const okP = ps => Array.isArray(ps) && ps.length === T.piles.length && ps.every(Array.isArray) && (() => { const seen = new Set(); ps.forEach(a => a.forEach(v => { if (typeof v === 'number' && deck[v >> 1]) seen.add(v >> 1); })); return seen.size === 52 && ps.reduce((n, a) => n + a.length, 0) === 52; })();
      if (!okP(s.p)) return false;
      if (s.draw === 1 || s.draw === 3) solOpts.draw = s.draw;
      if (['std', 'vegas', 'none'].includes(s.scoring)) solOpts.scoring = s.scoring;
      saveOpts();
      T.mode = 'play'; T.sel = null; T.drag = null;
      T.piles.forEach((p, i) => { p.cards = s.p[i].map(v => { const c = deck[v >> 1]; c.up = !!(v & 1); c.f0 = 0; c.delay = 0; return c; }); });
      const num = v => (typeof v === 'number' && isFinite(v) ? v : 0);
      G = { score: num(s.score), time: num(s.time), started: true, won: false, fan: num(s.fan), passes: num(s.passes), undo: (Array.isArray(s.undo) ? s.undo : []).filter(u => u && okP(u.p)), undos: num(s.undos), stub: 0, cheated: !!s.cheated, base: solOpts.keep ? (typeof s.base === 'number' ? s.base : store.get('jhp_sol_vegas', 0)) : 0 };
      T.place(true); status();
      return true;
    }
    function closing() {
      clearInterval(timer); clearInterval(animT); clearTimeout(autoT); T.stopBounceLoop(); T.mode = 'gone'; unhook();
      endOfGame();
    }
    function applyStatusBar() { const st = w.el.querySelector('.appstatus'); if (st) st.style.display = solOpts.status ? '' : 'none'; }
    // ---------------------------------------------------------- layout
    function layout(T) {
      const { cw, ch } = T;
      const W = Math.max(28, Math.floor(Math.min(cw / 8.1, (ch - 8) / (R * 3.25), 124)));
      const H = Math.round(W * R);
      T.W = W; T.H = H; T.compact = W < 60;
      const gx = Math.min((cw - 7 * W) / 8, W * 0.32), left = (cw - 7 * W - 6 * gx) / 2, gy = Math.max(4, Math.min(gx, W * 0.16));
      const X = i => Math.round(left + i * (W + gx));
      const fy = gy, ty = Math.round(fy + H + gy * 1.6);
      stock.x = X(0); stock.y = fy; waste.x = X(1); waste.y = fy;
      found.forEach((p, i) => { p.x = X(3 + i); p.y = fy; });
      const stack = p => { p.ox = p.cards.map((c, i) => Math.floor(i / 10) * 2); p.oy = p.cards.map((c, i) => Math.floor(i / 10) * 2); };
      stack(stock); found.forEach(stack);
      const n = waste.cards.length, fan = G ? Math.min(G.fan, n) : 0, fdx = W * (T.compact ? 0.3 : 0.2);
      waste.ox = waste.cards.map((c, i) => solOpts.draw === 3 && i >= n - fan ? Math.round((i - (n - fan)) * fdx) + Math.floor((n - fan) / 10) * 2 : Math.floor(i / 10) * 2);
      waste.oy = waste.cards.map((c, i) => solOpts.draw === 3 && i >= n - fan ? Math.floor((n - fan) / 10) * 2 : Math.floor(i / 10) * 2);
      tab.forEach((p, i) => {
        p.x = X(i); p.y = ty;
        let dn = Math.max(3, Math.round(H * 0.075)), up = Math.round(H * (T.compact ? 0.31 : 0.25));
        const downs = p.cards.filter(c => !c.up).length, ups = p.cards.length - downs, avail = ch - ty - H - 3;
        if (ups > 1 && downs * dn + (ups - 1) * up > avail) up = Math.max(Math.round(H * 0.12), Math.floor((avail - downs * dn) / (ups - 1)));
        if (downs * dn + Math.max(0, ups - 1) * up > avail) dn = 2;
        let y = 0; p.ox = []; p.oy = [];
        p.cards.forEach((c, k) => { p.ox.push(0); p.oy.push(y); y += c.up ? up : dn; });
      });
    }
    function drawSlot(T, p) {
      const c = T.ctx, { W, H } = T;
      if (p.kind === 'stock') {
        T.slot(p.x, p.y);
        if (!p.cards.length) {
          const can = canRecycle() && waste.cards.length;
          c.save(); c.lineWidth = Math.max(2, W * 0.07); c.strokeStyle = can ? '#00d000' : '#00b000'; c.beginPath();
          if (can) c.arc(p.x + W / 2, p.y + H / 2, W * 0.25, 0, TAU);
          else { const r = W * 0.22; c.moveTo(p.x + W / 2 - r, p.y + H / 2 - r); c.lineTo(p.x + W / 2 + r, p.y + H / 2 + r); c.moveTo(p.x + W / 2 + r, p.y + H / 2 - r); c.lineTo(p.x + W / 2 - r, p.y + H / 2 + r); }
          c.stroke(); c.restore();
        }
      } else if (p.kind === 'found') {
        T.slot(p.x, p.y);
        if (!p.cards.length) { c.save(); c.globalAlpha = 0.25; rankText(c, 'A', p.x + W / 2, p.y + H / 2 - W * 0.17, Math.round(W * 0.34), '#002000'); c.restore(); }
      } else if (!p.cards.length) T.slot(p.x, p.y);
    }
    // ---------------------------------------------------------- rules
    function canPick(p, i) {
      const c = p.cards[i]; if (!c || !c.up || G.won) return false;
      if (p.kind === 'tab') return true;
      return (p.kind === 'waste' || p.kind === 'found') && i === p.cards.length - 1;
    }
    function fits(c, p) {
      const t = top(p);
      if (p.kind === 'found') return t ? t.s === c.s && c.r === t.r + 1 : c.r === 1;
      if (p.kind === 'tab') return t ? t.up && isRed(t.s) !== isRed(c.s) && c.r === t.r - 1 : c.r === 13;
      return false;
    }
    function canDrop(cards, from, to) { if (to.kind === 'found' && cards.length !== 1) return false; return fits(cards[0], to); }
    function vegasCash() { return -52 + 5 * found.reduce((a, p) => a + p.cards.length, 0); }
    function addScore(n) { if (solOpts.scoring === 'std') G.score = Math.max(0, G.score + n); }
    function snapshot() { G.undo.push({ p: T.piles.map(p => p.cards.map(c => c.id * 2 + (c.up ? 1 : 0))), score: G.score, fan: G.fan, passes: G.passes }); if (G.undo.length > 200) G.undo.shift(); }
    function begin() {
      if (G.started) return;
      G.started = true;
      const st = solStats(); st.played++; saveSolStats(st);
    }
    function move(from, i, to, how, noSnap) {
      if (!noSnap) snapshot();
      begin();
      const cards = from.cards.splice(i);
      to.cards.push(...cards);
      if (to.kind === 'found' && from.kind !== 'found') addScore(10);
      if (from.kind === 'waste' && to.kind === 'tab') addScore(5);
      if (from.kind === 'found' && to.kind === 'tab') addScore(-15);
      if (from.kind === 'waste') G.fan = waste.cards.length ? Math.max(1, G.fan - 1) : 0;
      if (to.kind === 'found') sfx('click');
      after();
    }
    function click(h, p) {
      if (G.won) return true;
      if (p === stock) { drawStock(); return true; }
      if (h && h.pile.kind === 'tab' && !h.card.up && h.i === h.pile.cards.length - 1) {
        snapshot(); begin(); h.card.up = true; h.card.f0 = now(); addScore(5); sfx('turn'); after(); return true;
      }
      return false;
    }
    function dbl(p, i) {
      const c = p.cards[i];
      if (!c || i !== p.cards.length - 1 || G.won) return;
      if (!c.up) { if (p.kind === 'tab') click({ pile: p, i, card: c }, p); return; }
      if (p.kind === 'found') return;
      const f = found.find(fp => fits(c, fp));
      if (f) move(p, i, f, 'dbl');
    }
    function tryMove(from, i, to) {
      const cards = from.cards.slice(i);
      if (!cards.length || !canPick(from, i) || !canDrop(cards, from, to)) return false;
      move(from, i, to, 'tap'); T.place(); return true;
    }
    function canRecycle() { return !G || solOpts.scoring !== 'vegas' || G.passes < (solOpts.draw === 1 ? 0 : 2); }
    function drawStock() {
      if (stock.cards.length) {
        snapshot(); begin();
        const n = Math.min(solOpts.draw, stock.cards.length), t = now();
        for (let k = 0; k < n; k++) { const c = stock.cards.pop(); c.up = true; c.delay = k * 55; c.f0 = t + k * 55; waste.cards.push(c); }
        G.fan = n; G.stub = 0; sfx('turn');
      } else if (waste.cards.length && canRecycle()) {
        snapshot(); begin();
        G.passes++;
        while (waste.cards.length) { const c = waste.cards.pop(); c.up = false; c.f0 = 0; stock.cards.push(c); }
        G.fan = 0;
        if (solOpts.scoring === 'std') addScore(solOpts.draw === 1 ? -100 : (G.passes >= 3 ? -20 : 0));
        sfx('dice');
      } else {
        // knocking on an empty deck...
        G.stub++; sfx('thud');
        if (G.stub >= 7) { G.stub = 0; if (unlockBack()) { solOpts.back = SECRET_BACK; saveOpts(); triedBack(SECRET_BACK); T.kick(); } }
        return;
      }
      after();
    }
    function after() {
      if (!G.won && found.every(p => p.cards.length === 13)) win();
      if (saver) saver.save();
      status(); T.place();
      if (!G.won && !autoT && !stock.cards.length && !waste.cards.length && tab.every(p => p.cards.every(c => c.up)) && found.some(p => p.cards.length < 13)) {
        autoT = setTimeout(() => { autoT = 0; autoPlay(); }, 380);
      }
    }
    function undo() {
      if (!G || !G.undo.length || G.won || T.mode !== 'play') return;
      clearTimeout(autoT); autoT = 0;
      const s = G.undo.pop();
      T.piles.forEach((p, i) => { p.cards = s.p[i].map(v => { const c = deck[v >> 1], up = !!(v & 1); if (c.up !== up) c.f0 = up ? now() : 0; c.up = up; return c; }); });
      G.score = s.score; G.fan = s.fan; G.passes = s.passes; T.sel = null;
      if (saver) saver.save();
      if (++G.undos >= 20) secret('sol.undo20');
      sfx('click'); status(); T.place();
    }
    function autoPlay() {
      if (!G || G.won || T.mode !== 'play') return;
      clearTimeout(autoT); autoT = 0;
      let first = true;
      const stepper = () => {
        autoT = 0;
        const srcs = [waste, ...tab].filter(p => p.cards.length && top(p).up);
        for (const p of srcs) {
          const c = top(p), f = found.find(fp => fits(c, fp));
          if (f) { move(p, p.cards.length - 1, f, 'auto', !first); first = false; if (!G.won) autoT = setTimeout(stepper, 110); return; }
        }
      };
      stepper();
    }
    // ---------------------------------------------------------- scoring, timer, status bar
    function tick() {
      if (!G || !G.started || G.won || T.mode !== 'play' || w.el.style.display === 'none') return;
      G.time++;
      if (solOpts.timed && solOpts.scoring === 'std' && G.time % 10 === 0) addScore(-2);
      status();
    }
    function status() {
      if (!G) return;
      let left = '';
      if (solOpts.scoring === 'std') left = `Score: ${G.score}`;
      else if (solOpts.scoring === 'vegas') {
        const cash = vegasCash();
        left = `Score: ${fmtCash(cash)}` + (solOpts.keep ? `   Bank: ${fmtCash(G.base + cash)}` : '');
        if (solOpts.keep) { store.set('jhp_sol_vegas', G.base + cash); if (G.base + cash >= 500) secret('sol.highroller'); }
      }
      stL.textContent = left || ' ';
      stR.textContent = solOpts.timed ? `Time: ${G.time}` : '';
      stR.style.display = solOpts.timed ? '' : 'none';
    }
    // ---------------------------------------------------------- dealing and winning
    function endOfGame() {
      if (!G) return;
      if (solOpts.scoring === 'vegas' && G.started && !G.cheated && vegasCash() > 0) secret('sol.vegas');
    }
    function deal(first) {
      endOfGame();
      endBounce(false, true);
      clearTimeout(autoT); autoT = 0;
      T.mode = 'play'; T.sel = null; T.drag = null;
      const cards = deck.slice();
      for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
      cards.forEach(c => { c.up = false; c.f0 = 0; c.delay = 0; });
      T.piles.forEach(p => { p.cards = []; });
      let k = 0;
      const order = [];
      for (let r = 0; r < 7; r++) for (let c = r; c < 7; c++) { const card = cards[k++]; card.up = c === r; tab[c].cards.push(card); order.push(card); }
      stock.cards = cards.slice(k);
      const base = solOpts.keep ? store.get('jhp_sol_vegas', 0) : 0;
      G = { score: 0, time: 0, started: false, won: false, fan: 0, passes: 0, undo: [], undos: 0, stub: 0, cheated: false, base };
      if (saver) saver.clear(); // a new deal: the old saved game goes
      const st = solStats(); st.dealt++; saveSolStats(st);
      if (st.dealt >= 50) secret('sol.deal50');
      // fly the cards out of the deck, one at a time
      layout(T);
      T.snapTo(cards, stock.x, stock.y);
      const t = now();
      order.forEach((c, i) => { c.delay = i * 32; if (c.up) c.f0 = t + i * 32 + 140; });
      T.place();
      status();
      if (!first) sfx('dice');
    }
    function win() {
      G.won = true; T.sel = null;
      clearTimeout(autoT); autoT = 0;
      if (saver) saver.clear();
      if (solOpts.scoring === 'std' && solOpts.timed && G.time >= 30) G.score += Math.round(700000 / G.time);
      if (!G.cheated) {
        const st = solStats(); st.won++; if (solOpts.draw === 3) st.won3++;
        if (solOpts.timed && G.time > 0 && (!st.best || G.time < st.best)) st.best = G.time;
        if (solOpts.scoring === 'std' && G.score > st.bestScore) st.bestScore = G.score;
        saveSolStats(st);
        secret('sol.win');
        if (solOpts.draw === 3) secret('sol.draw3');
        if (G.time < 120) secret('sol.speedy');
        if (solOpts.scoring === 'vegas' && vegasCash() > 0) secret('sol.vegas');
      }
      sfx('solve');
      const wait = () => { if (T.mode !== 'play' || !G.won) return; if (!T.settled()) return setTimeout(wait, 120); startBounce(); };
      setTimeout(wait, 400);
    }
    function startBounce() {
      let fi = 3;
      T.bounce(() => {
        for (let k = 0; k < 4; k++) {
          fi = (fi + 1) % 4;
          const p = found[fi]; if (!p.cards.length) continue;
          const c = p.cards.pop(), x = c.bx, y = c.by;
          // tidy the foundation underneath (the trails will scribble over it again soon enough)
          const cx = T.ctx; cx.setTransform(T.dpr, 0, 0, T.dpr, 0, 0); cx.fillStyle = '#008000'; cx.fillRect(p.x - 1, p.y - 1, T.W + 8, T.H + 8);
          if (p.cards.length) { const t2 = top(p); T.blit(t2, t2.bx, t2.by, 1e12); } else T.slot(p.x, p.y);
          return { card: c, x, y };
        }
        return null;
      }, natural => endBounce(natural));
    }
    function endBounce(natural, silent) {
      if (T.mode !== 'bounce' && T.mode !== 'done') return;
      T.stopBounceLoop();
      // whatever happens, the cards end up back on the foundations
      const all = deck.slice().sort((a, b) => a.s - b.s || a.r - b.r);
      found.forEach((p, i) => { p.cards = all.filter(c => c.s === i); });
      if (silent) { T.mode = 'play'; return; }
      T.mode = 'done';
      if (natural) secret('sol.bounce');
      msg('Solitaire', natural ? 'Congratulations, you won! (And you watched every single card bounce. Respect.)\n\nDeal again?' : 'Congratulations, you won!\n\nDeal again?', 'q', [['Yes', () => deal()], ['No', () => { T.mode = 'play'; T.place(true); T.draw(); }]]);
    }
    function cheatWin() {
      if (!G || G.won || T.mode !== 'play') return;
      secret('sol.cheat');
      snapshot(); G.cheated = true; begin();
      const cashBefore = vegasCash();
      const all = deck.slice().sort((a, b) => a.r - b.r);
      T.piles.forEach(p => { p.cards = []; });
      all.forEach((c, i) => { c.up = true; c.delay = i * 12; found[c.s].cards.push(c); });
      G.base -= vegasCash() - cashBefore; // no free money for cheats
      Desk.toast('Solitaire', 'Alt+Shift+2? Shh. Jack read about that one in a magazine.', 4000);
      after();
    }
    // ---------------------------------------------------------- dialogs
    function optionsDialog() {
      const o = solOpts;
      const { f } = dialog('Options', `<div class="solopt">
        <fieldset class="group"><span class="lg">Draw</span><label><input type="radio" name="draw" value="1"${o.draw === 1 ? ' checked' : ''}><span>Draw <u>O</u>ne</span></label><label><input type="radio" name="draw" value="3"${o.draw === 3 ? ' checked' : ''}><span>Draw <u>T</u>hree</span></label></fieldset>
        <fieldset class="group"><span class="lg">Scoring</span><label><input type="radio" name="sc" value="std"${o.scoring === 'std' ? ' checked' : ''}><span><u>S</u>tandard</span></label><label><input type="radio" name="sc" value="vegas"${o.scoring === 'vegas' ? ' checked' : ''}><span><u>V</u>egas</span></label><label><input type="radio" name="sc" value="none"${o.scoring === 'none' ? ' checked' : ''}><span><u>N</u>one</span></label></fieldset>
        </div>
        <div class="solchk"><label><input type="checkbox" name="timed"${o.timed ? ' checked' : ''}><span>Timed game</span></label><label><input type="checkbox" name="status"${o.status ? ' checked' : ''}><span>Status bar</span></label><label><input type="checkbox" name="outline"${o.outline ? ' checked' : ''}><span>Outline dragging</span></label><label><input type="checkbox" name="keep"${o.keep ? ' checked' : ''}><span>Keep Vegas score (bank: <b>${fmtCash(store.get('jhp_sol_vegas', 0))}</b>)</span></label></div>`,
      [['OK', f => {
        const draw = +f.querySelector('[name=draw]:checked').value, sc = f.querySelector('[name=sc]:checked').value;
        const redeal = draw !== o.draw || sc !== o.scoring;
        o.draw = draw; o.scoring = sc; o.timed = f.querySelector('[name=timed]').checked; o.status = f.querySelector('[name=status]').checked;
        o.outline = f.querySelector('[name=outline]').checked; o.keep = f.querySelector('[name=keep]').checked;
        saveOpts(); T.outline = o.outline; applyStatusBar();
        if (redeal) deal(); else status();
      }], ['Cancel'], ['Reset Bank', () => { msg('Solitaire', 'Reset your Vegas bank to $0? (Mom says gambling is bad anyway.)', 'q', [['Yes', () => { store.set('jhp_sol_vegas', 0); if (G) G.base = -vegasCash(); status(); }], ['No']]); return false; }]],
      { w: 330, icon: ICON.sol16 });
      return f;
    }
    function deckDialog() {
      let pick = solOpts.back, knocks = 0;
      const { f, w: dw } = dialog('Select Card Back', '<div class="soldeck field"></div><div class="soldeckname"></div>', [['OK', () => choose(pick)], ['Cancel']], { w: 370, icon: ICON.sol16 });
      const grid = f.querySelector('.soldeck'), name = f.querySelector('.soldeckname');
      const W = 48, H = Math.round(W * R), dpr = Math.min(3, window.devicePixelRatio || 1);
      const cvs = [];
      function choose(id) { solOpts.back = id; saveOpts(); triedBack(id); T.frame = 0; T.kick(); }
      function paint(frame) {
        cvs.forEach((cv, id) => {
          const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
          if (id === SECRET_BACK && !backUnlocked()) { cardBase(c, cv.width, cv.height); rankText(c, '?', cv.width / 2, cv.height * 0.28, Math.round(cv.width * 0.5), '#808080'); }
          else drawBack(c, id, cv.width, cv.height, frame);
          cv.parentNode.classList.toggle('on', id === pick);
        });
        name.textContent = pick === SECRET_BACK && !backUnlocked() ? '???' : BACKS[pick].name;
      }
      BACKS.forEach((b, id) => {
        const btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('aria-label', id === SECRET_BACK ? 'Mystery card back' : b.name);
        const cv = document.createElement('canvas'); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
        btn.appendChild(cv); grid.appendChild(btn); cvs.push(cv);
        let lastClick = 0;
        btn.addEventListener('click', () => {
          if (id === SECRET_BACK && !backUnlocked()) {
            knocks++; sfx('thud');
            name.textContent = knocks < 3 ? '??? (locked)' : knocks < 6 ? '??? ' + 'knock '.repeat(knocks - 2) : '??? ...somebody is coming!';
            if (knocks >= 7) { unlockBack(); pick = id; paint(0); }
            return;
          }
          const t = now();
          if (pick === id && t - lastClick < 450) { choose(id); dw.close(); return; }
          lastClick = t; pick = id; paint(0);
        });
      });
      paint(0);
      let fr = 0; const anim = setInterval(() => { if (dw.closed || !document.body.contains(grid)) return clearInterval(anim); if (backUnlocked()) { fr++; const cv = cvs[SECRET_BACK], c = cv.getContext('2d'); drawBack(c, SECRET_BACK, cv.width, cv.height, fr); } }, 170);
    }
    function statsDialog() {
      const st = solStats(), pct = st.played ? Math.round(st.won / st.played * 100) : 0;
      dialog('Solitaire Statistics', `<table class="soltab"><tr><td>Games dealt:</td><td>${st.dealt}</td></tr><tr><td>Games played:</td><td>${st.played}</td></tr><tr><td>Games won:</td><td>${st.won} (${pct}%)</td></tr><tr><td>Won with Draw Three:</td><td>${st.won3}</td></tr><tr><td>Fastest win:</td><td>${st.best ? st.best + ' seconds' : 'none yet'}</td></tr><tr><td>Best score:</td><td>${st.bestScore}</td></tr><tr><td>Vegas bank:</td><td>${fmtCash(store.get('jhp_sol_vegas', 0))}</td></tr></table>`,
        [['OK'], ['Reset', () => { msg('Solitaire', 'Wipe all your Solitaire statistics? There is no undo for this one.', 'q', [['Yes', () => { saveSolStats({}); }], ['No']]); }]], { icon: ICON.sol16 });
    }
    function help() {
      Desk.notepad('SOL.HLP', `SOLITAIRE HELP\n==============\n\nThe aim: build four piles of cards, one per suit, from Ace up to King.\n\n* Click the deck (top left) to turn cards over.\n* Drag cards between the seven columns: down in rank, red on black,\n  black on red. Only a King can go in an empty column.\n* Click a face-down card at the bottom of a column to turn it over.\n* Double-click a card to send it up to the Ace piles.\n* Right-click to send EVERYTHING possible up to the Ace piles.\n* Game > Undo (Ctrl+Z) takes back a move. As many as you like.\n\nOPTIONS\n  Draw One / Draw Three: how many cards the deck turns over.\n  Standard scoring: +10 for a card on an Ace pile, +5 for a card\n  from the deck to a column, +5 for turning a card over. -2 every\n  10 seconds if the game is timed (but a big bonus if you win fast).\n  Vegas: you pay $52 for the deck and win $5 for every card on an\n  Ace pile. Only one trip through the deck (three in Draw Three).\n  Keep Vegas score: your winnings (or debts) carry over. Forever.\n\nTIPS FROM JACK\n  Always turn over face-down cards first.\n  Don't empty a column unless you've got a King ready.\n  If you win, DON'T click. Just watch. Trust me.\n  Dave says there are cheat keys. Dave says a lot of things.\n`);
    }
    if (TEST) window.SolTest = Object.assign(window.SolTest || {}, { sol: {
      T, deck, piles: { stock, waste, found, tab }, get G() { return G; }, deal, undo, autoPlay,
      // a nearly-finished game: every card on the foundations except the four Kings
      nearWin() {
        endBounce(false, true); clearTimeout(autoT); autoT = 0; T.mode = 'play';
        T.piles.forEach(p => { p.cards = []; });
        deck.forEach(c => { c.up = true; c.f0 = 0; if (c.r < 13) found[c.s].cards.push(c); });
        tab[0].cards.push(deck[12]); tab[1].cards.push(deck[25]); waste.cards.push(deck[38]); tab[3].cards.push(deck[51]); deck[51].up = false;
        G.fan = 1; G.started = true; G.undo = []; T.place(true); status();
      },
      rect(p, i) { const r = T.cv.getBoundingClientRect(), [x, y] = T.target(p, i == null ? p.cards.length - 1 : i); return { x: r.left + x, y: r.top + y, w: T.W, h: T.H }; },
      moves() { // every legal column/waste -> column/foundation move, for the tests
        const out = []; for (const from of [waste, ...tab]) for (let i = 0; i < from.cards.length; i++) { if (!canPick(from, i)) continue; for (const to of [...found, ...tab]) if (to !== from && canDrop(from.cards.slice(i), from, to)) out.push({ from, i, to }); }
        return out;
      },
    } });
    return w;
  }

  // ================================================================ FREECELL
  const fcOpts = Object.assign({ msgs: true, quick: false }, store.get('jhp_sol_fcopts', {}));
  const fcStatsGet = () => Object.assign({ won: 0, lost: 0, cur: 0, bestW: 0, bestL: 0 }, store.get('jhp_sol_fc', {}));
  const fcSession = { won: 0, lost: 0 };
  const DAVE = 11982;
  function fcRecord(won) {
    const st = fcStatsGet();
    if (won) { st.won++; fcSession.won++; st.cur = st.cur > 0 ? st.cur + 1 : 1; st.bestW = Math.max(st.bestW, st.cur); }
    else { st.lost++; fcSession.lost++; st.cur = st.cur < 0 ? st.cur - 1 : -1; st.bestL = Math.max(st.bestL, -st.cur); }
    store.set('jhp_sol_fc', st);
  }
  // Jack's own shuffle: a xorshift generator seeded from the game number, then a Fisher-Yates shuffle.
  function fcDeal(num) {
    let s = (Math.imul(num, 2654435761) ^ 0x1999c0de) >>> 0 || 0x9e3779b9;
    const next = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    for (let i = 0; i < 12; i++) next();
    const order = []; for (let i = 0; i < 52; i++) order.push(i);
    for (let i = 51; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return order;
  }

  Apps.register('freecell', { single: true, cmd: ['freecell', 'fc'], open(arg) { return openFreeCell(arg); } });
  function openFreeCell(arg) {
    const deck = newDeck();
    const cells = [0, 1, 2, 3].map(n => pile('cell', n)), found = [0, 1, 2, 3].map(n => pile('found', n)), tab = [0, 1, 2, 3, 4, 5, 6, 7].map(n => pile('tab', n));
    let F = null, autoT = 0, look = 0, kingBox = null, pokes = 0, pokeT = 0;
    const game = {
      label: 'FreeCell table', back: () => solOpts.back, quick: () => fcOpts.quick,
      layout, drawSlot, drawExtra: drawKing, canPick, canDrop, move, click, dbl, tryMove,
      selectFor: h => h.pile.kind === 'tab' ? { pile: h.pile, i: h.pile.cards.length - 1, card: top(h.pile) } : { pile: h.pile, i: h.i, card: h.card },
      badDrop(d, over) { if (fcOpts.msgs && over && over !== d.from) illegal(d.cards, d.from, over); },
      hover(T, x) { setLook(x); },
    };
    const T = Table(game);
    T.piles = [...cells, ...found, ...tab];
    const wrap = document.createElement('div'); wrap.className = 'solwrap'; wrap.appendChild(T.cv);
    const w = Apps.win('FreeCell', wrap, { w: 640, h: 500, icon: ICON.fc16, menubar: true, status: true, cls: 'solwin', minW: 250, minH: 230, onClose: closing });
    fitWindow(w);
    const stL = w.status, stR = document.createElement('span'); stR.className = 'solst2'; stL.parentNode.appendChild(stR);
    const unhook = hookResize(T, wrap, w);
    // online races (mp.js): everybody plays the same game number at once; the first to get all 52 home wins
    const race = window.MP ? MP.hook('freecell', w, { start(seed, o, R, preview) { newGame(1 + (seed % 32000), true); if (preview) F.done = true; } }) : null;
    const noRace = () => { if (race && race.active) { Desk.toast('FreeCell', "You're in a race! No new deals until it's over.", 2500); return false; } return true; };
    // the game in progress is saved (js/gamesave.js), but not an online race (that's live)
    const racing = () => !!(race && race.active);
    const saver = Apps.gameSaver ? Apps.gameSaver('freecell', () => racing() ? undefined : (!F || !F.moved || F.done) ? null : { num: F.num, p: T.piles.map(p => p.cards.map(c => c.id)), cheated: F.cheated, undo: F.undo.slice(-40) }, { v: 1, live: true }).watch(w) : null;
    Apps.menubar(w, [
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: () => noRace() && resign(() => newGame(1 + Math.floor(Math.random() * 32000))) },
        { label: 'Select Game...', key: 'F3', act: () => noRace() && selectGame() },
        { label: 'Restart Game', dis: !F || !F.moved, act: () => noRace() && newGame(F.num, true) },
        ...(window.MP ? [MP.menuItem('race.freecell')] : []), '-',
        { label: 'Statistics...', key: 'F4', act: statsDialog },
        { label: 'Options...', key: 'F5', act: optionsDialog }, '-',
        { label: 'Undo', key: 'Ctrl+Z', dis: !F || !F.undo.length || F.done, act: undo }, '-',
        { label: 'Exit', act: () => w.close() },
      ]],
      ['Help', () => [
        { label: 'Contents', key: 'F1', act: help }, '-',
        { label: 'About FreeCell', act: () => msg('About FreeCell', 'FreeCell for JackOS 98\n32,000 deals, every one shuffled by Jack\'s own shuffling machine.\n\nThe king is called Kevin. He watches you play.', 'info') },
      ]],
    ]);
    w.el.addEventListener('keydown', ev => {
      const k = ev.key;
      if (k === 'F10' && ev.ctrlKey && ev.shiftKey) { ev.preventDefault(); cheat(); }
      else if (k === 'F2') { ev.preventDefault(); if (noRace()) resign(() => newGame(1 + Math.floor(Math.random() * 32000))); }
      else if (k === 'F3') { ev.preventDefault(); selectGame(); }
      else if (k === 'F4') { ev.preventDefault(); statsDialog(); }
      else if (k === 'F5') { ev.preventDefault(); optionsDialog(); }
      else if (k === 'F1') { ev.preventDefault(); help(); }
      else if ((ev.ctrlKey || ev.metaKey) && k.toLowerCase() === 'z') { ev.preventDefault(); undo(); }
      else if (k === 'Escape') { T.sel = null; T.kick(); }
    });
    T.resize();
    if ((arg && +arg >= 1 && +arg <= 32000) || !resume()) newGame(arg && +arg >= 1 && +arg <= 32000 ? +arg : 1 + Math.floor(Math.random() * 32000));

    function resume() { // carry on with the saved game (if there is a good one)
      const s = saver && saver.load(); if (!s || !(s.num >= 1 && s.num <= 32000)) return false;
      const okP = ps => Array.isArray(ps) && ps.length === T.piles.length && ps.every(Array.isArray) && new Set([].concat(...ps).filter(id => deck[id])).size === 52 && ps.reduce((n, a) => n + a.length, 0) === 52;
      if (!okP(s.p)) return false;
      T.sel = null; T.drag = null; T.mode = 'play'; pokes = 0;
      T.piles.forEach((p, i) => { p.cards = s.p[i].map(id => { const c = deck[id]; c.up = true; c.f0 = 0; c.delay = 0; return c; }); });
      F = { num: s.num, undo: (Array.isArray(s.undo) ? s.undo : []).filter(okP), moved: true, done: false, won: false, cheated: !!s.cheated };
      w.setTitle(`FreeCell Game #${F.num}`);
      T.place(true); status();
      return true;
    }
    function closing() { clearTimeout(autoT); clearTimeout(pokeT); T.mode = 'gone'; unhook(); if (F && F.moved && !F.done) fcRecord(false); }
    function layout(T) {
      const { cw, ch } = T;
      const W = Math.max(26, Math.floor(Math.min(cw / 9.3, (ch - 8) / (R * 3.3), 118)));
      const H = Math.round(W * R);
      T.W = W; T.H = H; T.compact = W < 60;
      const m = Math.max(3, Math.round(W * 0.06));
      const rowW = 8 * W + Math.max(W * 0.9, 0), left = Math.max(m, (cw - rowW) / 2 - W * 0.4);
      cells.forEach((p, i) => { p.x = Math.round(left + i * W); p.y = m; p.ox = [0]; p.oy = [0]; });
      found.forEach((p, i) => { p.x = Math.round(cw - left - (4 - i) * W); p.y = m; p.ox = p.cards.map(() => 0); p.oy = p.cards.map(() => 0); });
      const kx = cells[3].x + W, kw = found[0].x - kx;
      kingBox = { x: kx, y: m, w: kw, h: H };
      const gx = Math.min((cw - 8 * W) / 9, W * 0.3), tl = (cw - 8 * W - 7 * gx) / 2, ty = Math.round(m + H + Math.max(6, W * 0.18));
      tab.forEach((p, i) => {
        p.x = Math.round(tl + i * (W + gx)); p.y = ty;
        let up = Math.round(H * (T.compact ? 0.31 : 0.25));
        const n = p.cards.length, avail = ch - ty - H - 3;
        if (n > 1 && (n - 1) * up > avail) up = Math.max(Math.round(H * 0.1), Math.floor(avail / (n - 1)));
        p.ox = p.cards.map(() => 0); p.oy = p.cards.map((c, k) => k * up);
      });
    }
    function drawSlot(T, p) { if (p.kind === 'cell' || p.kind === 'found') T.slot(p.x, p.y, 'sunk'); }
    function setLook(x) {
      if (!kingBox) return;
      const mid = kingBox.x + kingBox.w / 2, l = x < mid - kingBox.w * 0.1 ? -1 : x > mid + kingBox.w * 0.1 ? 1 : 0;
      if (l !== look) { look = l; T.kick(); }
    }
    function drawKing(T) {
      const b = kingBox; if (!b || b.w < 16) return;
      const c = T.ctx, s = Math.min(b.w * 0.8, b.h * 0.8), cx = b.x + b.w / 2, cy = b.y + b.h * 0.5;
      const mood = F && F.done ? (F.won ? 'happy' : 'sad') : pokes >= 3 ? 'cross' : 'calm';
      c.save(); c.translate(cx, cy); c.scale(s, s); c.lineWidth = 0.03; c.lineJoin = 'round'; c.strokeStyle = '#000';
      const dx = look * 0.07;
      // robe and ermine collar
      c.beginPath(); c.moveTo(-0.46, 0.5); c.quadraticCurveTo(-0.42, 0.18, -0.14, 0.14); c.lineTo(0.14, 0.14); c.quadraticCurveTo(0.42, 0.18, 0.46, 0.5); c.closePath(); c.fillStyle = '#b0102a'; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-0.32, 0.22); c.quadraticCurveTo(0, 0.36, 0.32, 0.22); c.lineTo(0.3, 0.3); c.quadraticCurveTo(0, 0.44, -0.3, 0.3); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.stroke();
      c.fillStyle = '#000'; [-0.2, 0, 0.2].forEach(x => c.fillRect(x - 0.015, 0.3 + (x ? 0 : 0.04), 0.03, 0.04));
      // beard behind the face
      c.beginPath(); c.moveTo(-0.24 + dx * 0.5, -0.02); c.quadraticCurveTo(-0.26 + dx, 0.3, dx, 0.36); c.quadraticCurveTo(0.26 + dx, 0.3, 0.24 + dx * 0.5, -0.02); c.closePath(); c.fillStyle = '#f2f2f2'; c.fill(); c.stroke();
      ell(c, dx * 0.5, -0.08, 0.22, 0.24, '#f6c99a');
      ell(c, -0.22 + dx * 0.2, -0.06, 0.04, 0.06, '#eab183'); ell(c, 0.22 + dx * 0.2, -0.06, 0.04, 0.06, '#eab183');
      // eyes follow you around the room
      for (const sx of [-1, 1]) {
        const ex = sx * 0.085 + dx;
        if (mood === 'happy') { c.beginPath(); c.arc(ex, -0.1, 0.04, Math.PI, 0); c.stroke(); }
        else { ell(c, ex, -0.1, 0.045, 0.05, '#fff'); ell(c, ex + look * 0.022, -0.1, 0.022, 0.026, '#000', false); }
        c.beginPath(); const by = mood === 'cross' ? (sx > 0 ? -0.17 : -0.19) : -0.18; c.moveTo(ex - 0.05, mood === 'cross' ? by - sx * 0.02 : by); c.lineTo(ex + 0.05, mood === 'cross' ? by + sx * 0.02 : by); c.lineWidth = 0.035; c.stroke(); c.lineWidth = 0.03;
      }
      ell(c, dx * 1.3, -0.02, 0.04, 0.035, '#e8a070');
      // moustache and mouth
      c.beginPath(); c.moveTo(dx - 0.12, 0.06); c.quadraticCurveTo(dx - 0.06, 0.01, dx, 0.05); c.quadraticCurveTo(dx + 0.06, 0.01, dx + 0.12, 0.06); c.quadraticCurveTo(dx, 0.08, dx - 0.12, 0.06); c.fillStyle = '#e8e8e8'; c.fill(); c.stroke();
      c.beginPath();
      if (mood === 'happy') { c.arc(dx, 0.08, 0.07, 0.15, Math.PI - 0.15); c.fillStyle = '#7a1010'; c.fill(); }
      else if (mood === 'sad') { c.arc(dx, 0.16, 0.05, Math.PI + 0.3, -0.3); }
      else { c.moveTo(dx - 0.04, 0.1); c.lineTo(dx + 0.04, 0.1); }
      c.stroke();
      // the crown, tilting a little towards where he's looking
      c.save(); c.translate(dx * 0.6, -0.27); c.rotate(look * 0.08);
      poly(c, [[-0.2, 0.04], [-0.23, -0.18], [-0.11, -0.07], [0, -0.22], [0.11, -0.07], [0.23, -0.18], [0.2, 0.04]], GOLD);
      ell(c, 0, -0.03, 0.03, 0.03, '#e0004a'); ell(c, -0.12, -0.01, 0.022, 0.022, '#2aa0ff'); ell(c, 0.12, -0.01, 0.022, 0.022, '#2aa0ff');
      [[-0.23, -0.18], [0, -0.22], [0.23, -0.18]].forEach(([x, y]) => ell(c, x, y, 0.025, 0.025, '#fff4b0'));
      c.restore();
      c.restore();
      if (F && F.done && F.won) { c.save(); c.fillStyle = '#ffd400'; c.font = `bold ${Math.max(10, Math.round(T.W * 0.2))}px Arial`; c.textAlign = 'center'; c.textBaseline = 'top'; c.strokeStyle = '#000'; c.lineWidth = 3; c.strokeText('YOU WIN!', cx, b.y + b.h + 2); c.fillText('YOU WIN!', cx, b.y + b.h + 2); c.restore(); }
    }
    // ---------------------------------------------------------- rules
    function freeCells() { return cells.filter(p => !p.cards.length).length; }
    function emptyCols() { return tab.filter(p => !p.cards.length).length; }
    function cap(toEmpty) { return (freeCells() + 1) * Math.pow(2, Math.max(0, emptyCols() - (toEmpty ? 1 : 0))); }
    function stacks(a, b) { return isRed(a.s) !== isRed(b.s) && a.r === b.r + 1; } // can b sit on a?
    function seqFrom(p, i) { for (let k = i; k < p.cards.length - 1; k++) if (!stacks(p.cards[k], p.cards[k + 1])) return false; return true; }
    function seqStart(p) { let i = p.cards.length - 1; while (i > 0 && stacks(p.cards[i - 1], p.cards[i])) i--; return i; }
    function foundFits(c, p) { const t = top(p); return t ? t.s === c.s && c.r === t.r + 1 : c.r === 1; }
    function canPick(p, i) {
      if (!F || F.done || !p.cards[i]) return false;
      if (p.kind === 'cell') return true;
      if (p.kind === 'tab') return seqFrom(p, i) && p.cards.length - i <= cap(false);
      return false;
    }
    function canDrop(cards, from, to) {
      const c = cards[0];
      if (to.kind === 'cell') return cards.length === 1 && !to.cards.length;
      if (to.kind === 'found') return cards.length === 1 && foundFits(c, to);
      if (to.kind === 'tab') { const t = top(to); if (cards.length > cap(!t)) return false; return t ? stacks(t, c) : true; }
      return false;
    }
    function illegal(cards, from, to) {
      if (!fcOpts.msgs) return;
      let msg = "Sorry, that move isn't allowed. Cards go down in order, red on black and black on red.";
      if (to.kind === 'tab' && cards.length > cap(!to.cards.length)) msg = `You've only got room to move ${cap(!to.cards.length)} card${cap(!to.cards.length) === 1 ? '' : 's'} at once, not ${cards.length}. Empty some free cells or columns first.`;
      else if (to.kind === 'cell') msg = 'That free cell is already full. One card per cell!';
      else if (to.kind === 'found') msg = to.cards.length ? `Only the ${RANK_N[top(to).r + 1] || 'nothing'} of ${SUIT_N[top(to).s]} can go there next.` : 'Only an Ace can start a home pile.';
      Desk.toast('FreeCell', msg, 4000);
    }
    function snapshot() { F.undo.push(T.piles.map(p => p.cards.map(c => c.id))); if (F.undo.length > 300) F.undo.shift(); }
    function move(from, i, to, how, auto) {
      if (!auto) { snapshot(); clearTimeout(autoT); autoT = 0; }
      const cards = from.cards.splice(i); to.cards.push(...cards); F.moved = true;
      if (saver) saver.save();
      if (to.kind === 'found') sfx('click');
      status(); T.place();
      if (!autoT) autoT = setTimeout(autoStep, fcOpts.quick ? 30 : 170);
    }
    function tryMove(from, i, to) {
      if (!F || F.done) return true;
      if (from.kind === 'tab' && to.kind === 'tab') {
        const st = seqStart(from), n = from.cards.length, t = top(to), room = cap(!t);
        if (!t) { const k = Math.min(n - st, room); move(from, n - k, to, 'tap'); return true; }
        for (let j = st; j < n; j++) if (stacks(t, from.cards[j])) { if (n - j <= room) { move(from, j, to, 'tap'); return true; } illegal(from.cards.slice(j), from, to); return true; }
        illegal([top(from)], from, to); return true;
      }
      const j = from.cards.length - 1, cards = [top(from)];
      if (canDrop(cards, from, to)) { move(from, j, to, 'tap'); return true; }
      if (to.kind !== 'tab' || to.cards.length) illegal(cards, from, to);
      return true;
    }
    function click() { return !F || F.done; }
    function dbl(p, i) {
      if (!F || F.done || !p.cards.length || p.kind === 'found') return;
      const j = p.cards.length - 1, c = p.cards[j];
      const f = found.find(fp => foundFits(c, fp));
      if (f) return move(p, j, f, 'dbl');
      if (p.kind === 'tab') { const cell = cells.find(q => !q.cards.length); if (cell) return move(p, j, cell, 'dbl'); }
    }
    // a card is safe to send home when nothing could still need it as a landing spot
    function safe(c) {
      if (c.r <= 2) return true;
      const opp = found.filter(p => p.cards.length && isRed(p.cards[0].s) !== isRed(c.s)).map(p => top(p).r);
      return opp.length === 2 && Math.min(...opp) >= c.r - 1;
    }
    function autoStep() {
      autoT = 0;
      if (!F || F.done) return;
      for (const p of [...cells, ...tab]) {
        const c = top(p); if (!c) continue;
        const f = found.find(fp => foundFits(c, fp));
        if (f && safe(c)) { move(p, p.cards.length - 1, f, 'auto', true); return; }
      }
      if (found.every(p => p.cards.length === 13)) return win();
      if (!hasMoves()) lose();
    }
    function hasMoves() {
      if (freeCells() || emptyCols()) return true;
      const srcs = [...cells, ...tab].filter(p => p.cards.length);
      for (const p of srcs) { const c = top(p); if (found.some(f => foundFits(c, f))) return true; if (tab.some(t => t !== p && t.cards.length && stacks(top(t), c))) return true; }
      return false;
    }
    function win() {
      if (F.done) return;
      F.done = true; F.won = true; T.sel = null;
      if (saver && !racing()) saver.clear();
      if (!F.cheated) { fcRecord(true); secret('sol.fcwin'); }
      sfx('solve'); T.kick();
      if (race && race.active) { race.progress(1, '52 home'); race.done({ ok: !F.cheated }); return; }
      setTimeout(() => { if (!w.closed) msg('Game Over', `Congratulations, you win${F.cheated ? '! (Kevin the king saw you cheat, mind.)' : F.num === DAVE ? `! You beat game #${DAVE}. So much for Dave. (Don't tell him, he'll only say it was a different number.)` : '! Kevin the king is well chuffed.'}\n\nDo you want to play again?`, 'q', [['Yes', () => newGame(1 + Math.floor(Math.random() * 32000))], ['No']]); }, 700);
    }
    function lose() {
      if (F.done) return;
      F.done = true; F.won = false;
      if (saver && !racing()) saver.clear();
      fcRecord(false); secret('sol.fclose');
      sfx('uhoh'); T.kick();
      if (race && race.active) { race.done({ ok: false }); return; }
      msg('Game Over', `Sorry, you lose. There are no more legal moves.${F.num === DAVE ? '\n\nSee? Dave was right. Probably.' : ''}\n\nDo you want to play this game again?`, 'q', [['Yes', () => newGame(F.num, true)], ['No']]);
    }
    function undo() {
      if (!F || !F.undo.length || F.done) return;
      clearTimeout(autoT); autoT = 0;
      const s = F.undo.pop();
      T.piles.forEach((p, i) => { p.cards = s[i].map(id => deck[id]); });
      if (saver) saver.save();
      T.sel = null; sfx('click'); status(); T.place();
    }
    function status() {
      if (!F) return;
      const left = 52 - found.reduce((a, p) => a + p.cards.length, 0);
      stL.textContent = `Cards Left: ${left}`;
      if (race && race.active && !F.done) race.progress((52 - left) / 52, `${52 - left} home`);
      stR.textContent = `Game #${F.num}`;
    }
    function resign(then) {
      if (F && F.moved && !F.done) msg('FreeCell', 'Do you want to resign this game? (It counts as a loss. Kevin is keeping score.)', 'q', [['Yes', () => { F.done = true; fcRecord(false); then(); }], ['No']]);
      else then();
    }
    function newGame(num, restart) {
      clearTimeout(autoT); autoT = 0;
      if (!restart && F && F.moved && !F.done) fcRecord(false);
      T.sel = null; T.drag = null; T.mode = 'play'; pokes = 0;
      const order = fcDeal(num);
      T.piles.forEach(p => { p.cards = []; });
      order.forEach((id, k) => { const c = deck[id]; c.up = true; c.f0 = 0; tab[k % 8].cards.push(c); });
      F = { num, undo: [], moved: false, done: false, won: false, cheated: false };
      if (saver && !racing()) saver.clear(); // a new deal: the old saved game goes
      w.setTitle(`FreeCell Game #${num}`);
      layout(T);
      // deal from the middle, like a croupier
      T.snapTo(deck, (T.cw - T.W) / 2, T.ch);
      order.forEach((id, k) => { deck[id].delay = k * 14; });
      T.place();
      status();
      if (num === DAVE) {
        secret('sol.dave');
        Desk.toast('FreeCell', `Game #${DAVE}! Dave says this one is IMPOSSIBLE. Unbeatable. His cousin's mate tried it for a whole half-term. (Dave also says his uncle works at Ultra Entertainment.)`, 9000);
      }
      if (!restart) sfx('dice');
    }
    function selectGame() {
      Desk.ask('Game Number', 'Select a game number from 1 to 32000:', String(1 + Math.floor(Math.random() * 32000)), 5, v => {
        const n = parseInt(String(v).trim(), 10);
        if (!(n >= 1 && n <= 32000)) return msg('FreeCell', 'Game numbers go from 1 to 32000. (Dave says there are secret minus ones. There aren\'t.)', 'warn');
        resign(() => newGame(n));
      });
    }
    function statsDialog() {
      const st = fcStatsGet(), pct = (a, b) => a + b ? Math.round(a / (a + b) * 100) : 0;
      dialog('FreeCell Statistics', `<table class="soltab"><tr><th colspan="2">This session</th></tr><tr><td>won: ${fcSession.won}</td><td>lost: ${fcSession.lost}</td><td>${pct(fcSession.won, fcSession.lost)}%</td></tr>
        <tr><th colspan="2">Total</th></tr><tr><td>won: ${st.won}</td><td>lost: ${st.lost}</td><td>${pct(st.won, st.lost)}%</td></tr>
        <tr><th colspan="2">Streaks</th></tr><tr><td>wins: ${st.bestW}</td><td>losses: ${st.bestL}</td><td></td></tr><tr><td colspan="3">current: ${Math.abs(st.cur)} ${st.cur > 0 ? (st.cur === 1 ? 'win' : 'wins') : st.cur < 0 ? (st.cur === -1 ? 'loss' : 'losses') : ''}</td></tr></table>`,
      [['OK'], ['Clear', (f, dw) => { msg('FreeCell', 'Clear all your FreeCell statistics?', 'q', [['Yes', () => { store.set('jhp_sol_fc', {}); fcSession.won = fcSession.lost = 0; }], ['No']]); }]], { icon: ICON.fc16, w: 280 });
    }
    function optionsDialog() {
      dialog('FreeCell Options', `<div class="solchk"><label><input type="checkbox" name="msgs"${fcOpts.msgs ? ' checked' : ''}><span>Display messages on illegal moves</span></label><label><input type="checkbox" name="quick"${fcOpts.quick ? ' checked' : ''}><span>Quick play (no animation)</span></label></div>`,
        [['OK', f => { fcOpts.msgs = f.querySelector('[name=msgs]').checked; fcOpts.quick = f.querySelector('[name=quick]').checked; store.set('jhp_sol_fcopts', fcOpts); }], ['Cancel']], { icon: ICON.fc16, w: 300 });
    }
    function cheat() {
      if (!F || F.done) return;
      secret('sol.cheat');
      dialog('Cheat-o-Matic 98', '<p style="margin:0 0 8px">Jack\'s secret FreeCell cheat menu. (Found in a magazine. Do NOT tell Dave.)</p><p style="margin:0">What do you want to happen?</p>',
        [['Win now', () => {
          F.cheated = true; snapshot(); clearTimeout(autoT); autoT = 0;
          T.piles.forEach(p => { p.cards = []; });
          deck.slice().sort((a, b) => a.r - b.r).forEach((c, i) => { c.delay = i * 10; found[c.s].cards.push(c); });
          status(); T.place(); win();
        }], ['Lose now', () => { lose(); }], ['Cancel']], { icon: ICON.fc16, w: 330 });
    }
    function help() {
      Desk.notepad('FREECELL.HLP', `FREECELL HELP\n=============\n\nThe aim: move all 52 cards up to the four home piles (top right),\none pile per suit, from Ace up to King.\n\n* The four boxes at the top left are FREE CELLS. Each one holds a\n  single card while you get it out of the way.\n* In the columns, build down in alternating colours (red on black,\n  black on red). Any card can go in an empty column.\n* You can move a whole run of cards at once if you have enough free\n  cells and empty columns to do it one at a time. The more space,\n  the bigger the run.\n* Double-click a card to send it home, or into a free cell.\n* Cards that are safe to go home go there by themselves.\n* Click a card, then click where you want it to go. Or drag it.\n\nNearly every game can be won. NEARLY.\n(Dave says one of them can't. Dave says lots of things.)\n`);
    }
    // poke the king
    T.cv.addEventListener('pointerup', ev => {
      if (!kingBox || T.mode !== 'play') return;
      const r = T.cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, b = kingBox;
      setLook(x);
      if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + b.h) return;
      pokes++; clearTimeout(pokeT); pokeT = setTimeout(() => { pokes = 0; T.kick(); }, 4000); sfx('pet'); T.kick();
      if (pokes === 5) { secret('sol.king'); Desk.toast('Kevin the King', pick(['Oi! Stop poking the king!', 'I am ROYALTY. Kindly play a card.', 'Have you tried the Ace of Hearts? No? Then stop poking me.', 'One more poke and I\'m telling your Mom.'])); }
    });
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    if (TEST) window.SolTest = Object.assign(window.SolTest || {}, { fc: {
      T, deck, piles: { cells, found, tab }, get F() { return F; }, newGame, undo, fcDeal, cap,
      nearWin() { // everything home except one card per suit, waiting in the columns
        clearTimeout(autoT); autoT = 0; T.piles.forEach(p => { p.cards = []; });
        deck.forEach(c => { if (c.r < 13) found[c.s].cards.push(c); });
        [12, 25, 38, 51].forEach((id, i) => tab[i * 2].cards.push(deck[id]));
        F.done = false; F.moved = true; F.undo = []; T.place(true); status();
      },
      rect(p, i) { const r = T.cv.getBoundingClientRect(), [x, y] = p.cards.length ? T.target(p, i == null ? p.cards.length - 1 : i) : [p.x, p.y]; return { x: r.left + x, y: r.top + y, w: T.W, h: T.H }; },
      king() { const r = T.cv.getBoundingClientRect(); return { x: r.left + kingBox.x, y: r.top + kingBox.y, w: kingBox.w, h: kingBox.h, look }; },
    } });
    return w;
  }

  if (TEST) window.SolTest = Object.assign(window.SolTest || {}, {
    sheet(W, compact) { // every face and back on one canvas, to eyeball the art
      W = W || 71; const H = Math.round(W * R), cv = document.createElement('canvas'); cv.width = 13 * (W + 4) + 4; cv.height = 5 * (H + 4) + 4 + H + 4;
      const c = cv.getContext('2d'); c.fillStyle = '#008000'; c.fillRect(0, 0, cv.width, cv.height);
      for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) c.drawImage(faceSprite({ s, r }, W, H, compact), 4 + (r - 1) * (W + 4), 4 + s * (H + 4));
      BACKS.forEach((b, i) => c.drawImage(backSprite(i, W, H, 0), 4 + i * (W + 4), 4 + 4 * (H + 4)));
      return cv.toDataURL();
    },
  });

  // ================================================================ desktop, Start menu, Run, files
  Apps.addProgram(['Games', 'Solitaire'], 'sol', ICON.sol16);
  Apps.addProgram(['Games', 'FreeCell'], 'freecell', ICON.fc16);
  Apps.desktopIcon('Solitaire', ICON.sol32, () => Apps.open('sol'), 'iconSol');
  Apps.desktopIcon('FreeCell', ICON.fc32, () => Apps.open('freecell'), 'iconFreecell');
  Apps.cmd(['cards.dll', 'cards'], () => msg('CARDS.DLL', 'CARDS.DLL is a library of playing cards used by Solitaire and FreeCell. It contains 52 cards, 12 backs, 4 Ork Warbosses and 1 secret. It cannot be run on its own. (Nice try.)', 'info'));
  Apps.cmd(['dave', 'dave.exe'], () => msg('dave.exe', 'Dave is not a program. Dave is a boy in Jack\'s class who knows "for a fact" that one FreeCell game can never be won. He has never said which number in the same way twice, but lately it\'s been eleven thousand and something.', 'info'));
  try {
    Apps.fs.add('C:/JACKOS', { name: 'SOL.EXE', type: 'exe', app: 'sol', size: '64 KB', date: '11/05/98' });
    Apps.fs.add('C:/JACKOS', { name: 'FREECELL.EXE', type: 'exe', app: 'freecell', size: '35 KB', date: '11/05/98' });
    Apps.fs.add('C:/JACKOS/SYSTEM', { name: 'CARDS.DLL', type: 'dll', size: '148 KB', date: '11/05/98' });
    Apps.fs.add('C:/My Documents', { name: 'freecell tips.txt', type: 'txt', size: '1 KB', date: '22/03/99', text: `FREECELL TIPS (by Jack, age none of your business)\n\n1. Empty columns are worth MORE than free cells.\n2. Get the Aces out first. Then the 2s.\n3. Don't fill all four free cells. Ever. That's how you lose.\n4. Kevin the king looks at whichever side you're about to cheat on.\n\nTHINGS DAVE SAYS ABOUT FREECELL\n- there's a game that can't be won. He says it's #11982.\n  (He also said that about #1. I won #1 at lunch.)\n- if you press loads of keys at once you can make it let you win\n- his uncle works at Ultra Entertainment (he doesn't)\n\nBEST STREAK: 7 (Mom made me stop for tea)\n` });
    Apps.fs.add('C:/JACKOS/SYSTEM', { name: 'vegas.ini', type: 'txt', size: '1 KB', date: '01/04/99', hidden: true, text: `[Solitaire]\nDraw=1\nScoring=Vegas\nKeepScore=1\n; my bank is "in the red" which Dad says is a grown-up way of saying\n; I owe the computer money. how do I pay a computer.\n` });
  } catch (e) {}
})();

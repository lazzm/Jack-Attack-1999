/* Hearts and Spider Solitaire for JackOS 98 (lazy loaded by apps-games.js).
 * Own card renderer (not Solitaire's): tin-robot Jacks, space-queen Queens and pod-pilot Kings, five card backs,
 * tweened cards on green felt, drag + tap controls, an AI table of Dave, the cousin (js/cast.js) and Gubbinz, and a spider web of 104 cards.
 * All art is drawn live on canvas. */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const RS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const RN = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
  const SN = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
  const KIM = window.Cast ? Cast.t('Cousin {cousin}') : 'Cousin Kim'; // this visitor's cousin (js/cast.js)
  const isRed = s => s === 1 || s === 2;
  const RED = '#c8001e', INK = '#111';
  const CLOTH = ['#1f7a3a', '#e07a00', '#c8102e', '#2a3c9e'];
  const cardName = c => `${RN[c.r]} of ${SN[c.s]}`;

  JG.css('cards', `
    .jgc-over{position:absolute;left:0;right:0;display:flex;justify-content:center;gap:8px;pointer-events:none}
    .jgc-over .btn{pointer-events:auto;min-width:96px;font-weight:bold}
    .jgc-stats td{padding:2px 10px 2px 0}
    .jgc-stats th{text-align:left;padding:2px 10px 2px 0;border-bottom:1px solid #808080}
    .jgc-hs{width:100%;border-collapse:collapse;background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;font:12px var(--ui)}
    .jgc-hs td,.jgc-hs th{padding:2px 6px;text-align:right}
    .jgc-hs td:first-child,.jgc-hs th:first-child{text-align:left}
    .jgc-hs tr.me td{font-weight:bold}
    .jgc-backs{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:6px 0}
    .jgc-backs button{padding:3px;background:#fff;border:2px solid transparent;cursor:pointer;line-height:0}
    .jgc-backs button.on{border-color:#000080;background:#000080}
  `);

  // ================================================================ suit symbols (centred at x,y, height z)
  function suit(c, s, x, y, z, col, flip) {
    c.save(); c.translate(x, y); if (flip) c.rotate(Math.PI); c.scale(z / 100, z / 100);
    c.fillStyle = col || (isRed(s) ? RED : INK);
    c.beginPath();
    if (s === 2) {
      c.moveTo(0, 46); c.bezierCurveTo(-12, 30, -50, 8, -50, -16); c.bezierCurveTo(-50, -46, -12, -52, 0, -24);
      c.bezierCurveTo(12, -52, 50, -46, 50, -16); c.bezierCurveTo(50, 8, 12, 30, 0, 46); c.fill();
    } else if (s === 1) {
      c.moveTo(0, -50); c.quadraticCurveTo(14, -16, 40, 0); c.quadraticCurveTo(14, 16, 0, 50); c.quadraticCurveTo(-14, 16, -40, 0); c.quadraticCurveTo(-14, -16, 0, -50); c.fill();
    } else if (s === 3) {
      c.moveTo(0, -50); c.bezierCurveTo(12, -30, 50, -12, 50, 12); c.bezierCurveTo(50, 36, 18, 42, 5, 22);
      c.quadraticCurveTo(8, 40, 22, 50); c.lineTo(-22, 50); c.quadraticCurveTo(-8, 40, -5, 22);
      c.bezierCurveTo(-18, 42, -50, 36, -50, 12); c.bezierCurveTo(-50, -12, -12, -30, 0, -50); c.fill();
    } else {
      for (const [cx, cy] of [[0, -25], [-25, 8], [25, 8]]) { c.beginPath(); c.arc(cx, cy, 21, 0, TAU); c.fill(); }
      c.beginPath(); c.arc(0, 2, 12, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-5, 5); c.quadraticCurveTo(-6, 38, -22, 50); c.lineTo(22, 50); c.quadraticCurveTo(6, 38, 5, 5); c.closePath(); c.fill();
    }
    c.restore();
  }
  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  // ================================================================ court characters (drawn in a 100 x 70 half-frame, bust sitting on y=70)
  function squigJack(c, s) { // the Jacks are little wind-up tin robots
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 1.6;
    // wind-up key poking out behind the right shoulder
    c.fillStyle = '#d4a000'; c.fillRect(80, 44, 12, 4); c.strokeRect(80, 44, 12, 4);
    for (const dy of [-7, 7]) { c.beginPath(); c.ellipse(95, 46 + dy, 4, 6, 0, 0, TAU); c.fill(); c.stroke(); }
    c.fillStyle = '#fff2a0'; c.fillRect(83, 45, 8, 1);
    // tin chest in the suit colour, with rivets and a pressure dial
    const cg = c.createLinearGradient(10, 46, 90, 70); cg.addColorStop(0, '#fff'); cg.addColorStop(0.18, CLOTH[s]); cg.addColorStop(1, CLOTH[s]);
    c.fillStyle = cg; c.beginPath(); c.moveTo(8, 70); c.lineTo(12, 55); c.quadraticCurveTo(14, 47, 24, 47); c.lineTo(76, 47); c.quadraticCurveTo(86, 47, 88, 55); c.lineTo(92, 70); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.moveTo(76, 47); c.quadraticCurveTo(86, 47, 88, 55); c.lineTo(92, 70); c.lineTo(80, 70); c.lineTo(78, 52); c.closePath(); c.fill();
    c.fillStyle = '#e8ecf2'; for (const [x, y] of [[18, 53], [28, 51], [72, 51], [82, 53]]) { c.beginPath(); c.arc(x, y, 1.7, 0, TAU); c.fill(); c.stroke(); }
    c.fillStyle = '#fffbe8'; c.beginPath(); c.arc(50, 61, 6.5, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = '#c8001e'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(50, 61); c.lineTo(54, 57); c.stroke(); c.strokeStyle = '#000'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(45, 61); c.lineTo(46, 61); c.moveTo(50, 56); c.lineTo(50, 57); c.moveTo(55, 61); c.lineTo(54, 61); c.stroke();
    // ribbed neck
    c.fillStyle = '#8a929c'; c.fillRect(42, 40, 16, 8); c.strokeRect(42, 40, 16, 8); c.beginPath(); for (const y of [42.5, 45]) { c.moveTo(42, y); c.lineTo(58, y); } c.stroke();
    // antenna with a light in the suit colour
    c.beginPath(); c.moveTo(50, 11); c.lineTo(50, 5); c.stroke();
    c.fillStyle = CLOTH[s]; c.beginPath(); c.arc(50, 4, 3.4, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(48.8, 2.8, 1.1, 0, TAU); c.fill();
    // ear bolts
    for (const sx of [-1, 1]) { c.fillStyle = '#9aa2ac'; c.fillRect(50 + sx * 25 - 3, 19, 6, 13); c.strokeRect(50 + sx * 25 - 3, 19, 6, 13); c.fillStyle = '#d4a000'; c.beginPath(); c.arc(50 + sx * 28.5, 25.5, 2.4, 0, TAU); c.fill(); c.stroke(); }
    // the tin head: light from the top left
    const hg = c.createLinearGradient(28, 10, 72, 42); hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.35, '#d4dae2'); hg.addColorStop(1, '#7c8590');
    c.fillStyle = hg; rrect(c, 27, 10, 46, 32, 7); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.7)'; rrect(c, 30, 12.5, 4, 22, 2); c.fill();
    c.fillStyle = '#5a636e'; for (const [x, y] of [[31, 38], [69, 38], [69, 14]]) { c.beginPath(); c.arc(x, y, 1.1, 0, TAU); c.fill(); }
    // brow plate with the suit as a badge
    c.fillStyle = '#5a636e'; rrect(c, 34, 14, 32, 4, 2); c.fill();
    suit(c, s, 50, 15.5, 8, '#fff'); suit(c, s, 50, 15.5, 6);
    // big glowing bulb eyes
    for (const sx of [-1, 1]) {
      const ex = 50 + sx * 10.5, eg = c.createRadialGradient(ex - 2, 23, 0.5, ex, 25, 6.5); eg.addColorStop(0, '#fffbe0'); eg.addColorStop(0.6, '#ffe14a'); eg.addColorStop(1, '#e09a00');
      c.fillStyle = '#5a636e'; c.beginPath(); c.arc(ex, 25, 7.5, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = eg; c.beginPath(); c.arc(ex, 25, 5.6, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#000'; c.beginPath(); c.arc(ex + sx * 0.6, 25.6, 2.3, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - 1.8, 23, 1.2, 0, TAU); c.fill();
    }
    // speaker-grille grin
    c.fillStyle = '#2a2e34'; rrect(c, 37, 33, 26, 6, 3); c.fill(); c.stroke();
    c.strokeStyle = '#9aa2ac'; c.lineWidth = 1; c.beginPath(); for (let x = 41; x < 60; x += 3.5) { c.moveTo(x, 34.5); c.lineTo(x, 37.5); } c.stroke();
    c.strokeStyle = '#000'; c.lineWidth = 1.6; c.lineCap = 'butt';
  }
  function spaceQueen(c, s) {
    c.lineJoin = 'round'; c.strokeStyle = '#000'; c.lineWidth = 1.6;
    // high collar + shoulders
    c.fillStyle = CLOTH[s]; c.beginPath(); c.moveTo(10, 70); c.quadraticCurveTo(16, 50, 34, 48); c.lineTo(66, 48); c.quadraticCurveTo(84, 50, 90, 70); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(30, 50); c.lineTo(22, 34); c.lineTo(40, 46); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(70, 50); c.lineTo(78, 34); c.lineTo(60, 46); c.closePath(); c.fill(); c.stroke();
    // necklace
    c.strokeStyle = '#d4a000'; c.lineWidth = 2.5; c.beginPath(); c.arc(50, 50, 12, 0.2, Math.PI - 0.2); c.stroke();
    c.fillStyle = '#7cf'; c.beginPath(); c.arc(50, 62, 3, 0, TAU); c.fill(); c.strokeStyle = '#000'; c.lineWidth = 1.6;
    // antennae
    for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(50 + sx * 8, 16); c.quadraticCurveTo(50 + sx * 22, 2, 50 + sx * 26, 4); c.stroke(); c.fillStyle = '#ffd400'; c.beginPath(); c.arc(50 + sx * 26, 4, 3.5, 0, TAU); c.fill(); c.stroke(); }
    // face
    c.fillStyle = '#b9a4f0'; c.beginPath(); c.ellipse(50, 32, 15, 18, 0, 0, TAU); c.fill(); c.stroke();
    // big alien eyes
    for (const sx of [-1, 1]) { c.fillStyle = '#111'; c.beginPath(); c.ellipse(50 + sx * 6.5, 30, 4.5, 6, sx * -0.35, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(50 + sx * 6.5 - 1.5, 28, 1.4, 0, TAU); c.fill(); }
    c.beginPath(); c.arc(50, 40, 4, 0.2, Math.PI - 0.2); c.stroke();
    // star tiara
    c.fillStyle = '#ffd400'; c.beginPath(); c.moveTo(36, 18); c.quadraticCurveTo(50, 10, 64, 18); c.lineTo(62, 21); c.quadraticCurveTo(50, 15, 38, 21); c.closePath(); c.fill(); c.stroke();
    star(c, 50, 11, 5); c.fill(); c.stroke();
  }
  function star(c, x, y, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
  function orkKing(c, s) { // the Kings are pod-racing pilots: leather flying cap, goggles up, crown pinned on
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 1.6;
    const SK = '#f4c8a0', SKD = '#d89a70', LE = '#7a4a1e', LEL = '#a8703a';
    // flying coat with a fur collar
    c.fillStyle = CLOTH[s]; c.beginPath(); c.moveTo(4, 70); c.quadraticCurveTo(10, 46, 30, 44); c.lineTo(70, 44); c.quadraticCurveTo(90, 46, 96, 70); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(8, 70); c.quadraticCurveTo(13, 52, 28, 48); c.lineTo(30, 52); c.quadraticCurveTo(18, 56, 16, 70); c.fill();
    c.fillStyle = '#d4a000'; for (const y of [58, 66]) { c.beginPath(); c.arc(42, y, 1.8, 0, TAU); c.fill(); c.stroke(); }
    // neck
    c.fillStyle = SKD; c.fillRect(43, 40, 14, 8);
    c.fillStyle = '#f4ecd8'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(26 + i * 6, 47 + Math.sin(i * 1.7) * 1.2, 4.6, 0, TAU); c.fill(); }
    c.strokeStyle = '#b8ae94'; c.lineWidth = 0.8; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(26 + i * 6, 47 + Math.sin(i * 1.7) * 1.2, 3, 0.4, 2.2); c.stroke(); } c.strokeStyle = '#000'; c.lineWidth = 1.6;
    // white silk scarf blowing to the side
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(60, 47); c.quadraticCurveTo(80, 54, 92, 46); c.lineTo(90, 55); c.quadraticCurveTo(78, 62, 60, 54); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(66, 50); c.quadraticCurveTo(78, 55, 88, 50); c.strokeStyle = '#c8c8d0'; c.lineWidth = 1; c.stroke(); c.strokeStyle = '#000'; c.lineWidth = 1.6;
    // leather ear flaps hang down beside the face
    c.fillStyle = LE; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(50 + sx * 16, 22); c.quadraticCurveTo(50 + sx * 21, 32, 50 + sx * 17, 42); c.lineTo(50 + sx * 11, 40); c.quadraticCurveTo(50 + sx * 13, 30, 50 + sx * 10, 22); c.closePath(); c.fill(); c.stroke(); }
    // face
    const fg = c.createLinearGradient(36, 18, 64, 44); fg.addColorStop(0, '#ffe2c4'); fg.addColorStop(0.5, SK); fg.addColorStop(1, SKD);
    c.fillStyle = fg; c.beginPath(); c.moveTo(35, 24); c.quadraticCurveTo(34, 42, 50, 44); c.quadraticCurveTo(66, 42, 65, 24); c.closePath(); c.fill(); c.stroke();
    // eyes + brows
    for (const sx of [-1, 1]) {
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(50 + sx * 6.5, 28.5, 3.2, 2.4, 0, 0, TAU); c.fill(); c.lineWidth = 1; c.stroke();
      c.fillStyle = '#2a4a8a'; c.beginPath(); c.arc(50 + sx * 6.5 + 0.6, 28.7, 1.6, 0, TAU); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(50 + sx * 6.5 + 0.6, 28.7, 0.8, 0, TAU); c.fill();
      c.lineWidth = 2; c.strokeStyle = '#6a3a14'; c.beginPath(); c.moveTo(50 + sx * 3, 25); c.quadraticCurveTo(50 + sx * 6.5, 23.4, 50 + sx * 10, 25); c.stroke(); c.strokeStyle = '#000'; c.lineWidth = 1.6;
    }
    // nose, grin and a splendid handlebar moustache
    c.fillStyle = SKD; c.beginPath(); c.moveTo(50, 29); c.quadraticCurveTo(53.5, 34, 51, 35.5); c.lineTo(49, 35.5); c.closePath(); c.fill();
    c.fillStyle = '#7a1010'; c.beginPath(); c.moveTo(44, 38.5); c.quadraticCurveTo(50, 43, 56, 38.5); c.quadraticCurveTo(50, 40, 44, 38.5); c.fill(); c.lineWidth = 1; c.stroke(); c.lineWidth = 1.6;
    c.fillStyle = '#8a4a14'; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(50, 35.5); c.quadraticCurveTo(50 + sx * 7, 34, 50 + sx * 11, 37.5); c.quadraticCurveTo(50 + sx * 14, 38, 50 + sx * 14, 34.5); c.quadraticCurveTo(50 + sx * 13, 40.5, 50 + sx * 8, 38.5); c.quadraticCurveTo(50 + sx * 4, 37.5, 50, 38); c.closePath(); c.fill(); c.lineWidth = 1; c.stroke(); } c.lineWidth = 1.6;
    // the leather cap (domed, stitched seam)
    const lg = c.createLinearGradient(30, 4, 70, 26); lg.addColorStop(0, LEL); lg.addColorStop(1, LE);
    c.fillStyle = lg; c.beginPath(); c.moveTo(32, 26); c.quadraticCurveTo(30, 4, 50, 3); c.quadraticCurveTo(70, 4, 68, 26); c.quadraticCurveTo(50, 20, 32, 26); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#4a2a0a'; c.lineWidth = 1; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(50, 4); c.lineTo(50, 21); c.stroke(); c.setLineDash([]); c.strokeStyle = '#000'; c.lineWidth = 1.6;
    // goggles pushed up on the cap
    c.fillStyle = '#3a2a1a'; c.fillRect(32, 13, 36, 4);
    for (const sx of [-1, 1]) {
      c.fillStyle = '#c8a040'; c.beginPath(); c.arc(50 + sx * 8, 14.5, 7, 0, TAU); c.fill(); c.stroke();
      const gg = c.createRadialGradient(50 + sx * 8 - 2, 12.5, 0.5, 50 + sx * 8, 14.5, 5); gg.addColorStop(0, '#e8fbff'); gg.addColorStop(1, '#4ab0e0');
      c.fillStyle = gg; c.beginPath(); c.arc(50 + sx * 8, 14.5, 4.8, 0, TAU); c.fill(); c.lineWidth = 1; c.stroke(); c.lineWidth = 1.6;
      c.fillStyle = '#fff'; c.beginPath(); c.arc(50 + sx * 8 - 1.8, 12.6, 1.2, 0, TAU); c.fill();
    }
    c.fillStyle = '#3a2a1a'; c.fillRect(48, 13, 4, 3);
    // a little gold crown pinned on top
    c.fillStyle = '#ffd400'; c.beginPath(); c.moveTo(42, 8); c.lineTo(43, 0); c.lineTo(46.5, 4.5); c.lineTo(50, -1.5); c.lineTo(53.5, 4.5); c.lineTo(57, 0); c.lineTo(58, 8); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#c8001e'; c.beginPath(); c.arc(50, 5.5, 1.6, 0, TAU); c.fill(); c.fillStyle = '#fff8c0'; c.fillRect(43, 6, 2, 1);
    c.lineCap = 'butt';
  }
  const COURT = { 11: squigJack, 12: spaceQueen, 13: orkKing };

  // ================================================================ card faces
  const PIPS = {
    2: [[0.5, 0], [0.5, 1]], 3: [[0.5, 0], [0.5, 0.5], [0.5, 1]],
    4: [[0, 0], [1, 0], [0, 1], [1, 1]], 5: [[0, 0], [1, 0], [0.5, 0.5], [0, 1], [1, 1]],
    6: [[0, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [1, 1]], 7: [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0, 1], [1, 1]],
    8: [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0.5, 0.75], [0, 1], [1, 1]],
    9: [[0, 0], [1, 0], [0, 1 / 3], [1, 1 / 3], [0.5, 0.5], [0, 2 / 3], [1, 2 / 3], [0, 1], [1, 1]],
    10: [[0, 0], [1, 0], [0.5, 1 / 6], [0, 1 / 3], [1, 1 / 3], [0, 2 / 3], [1, 2 / 3], [0.5, 5 / 6], [0, 1], [1, 1]],
  };
  function index(c, s, r, w, h, compact) {
    const col = isRed(s) ? RED : INK, txt = RS[r];
    const fh = compact ? Math.max(9, w * 0.36) : h * 0.15;
    c.fillStyle = col; c.font = `bold ${fh}px Arial, Helvetica, sans-serif`; c.textBaseline = 'top'; c.textAlign = 'center';
    const cx = compact ? w * 0.27 : w * 0.12, tw = c.measureText(txt).width, maxW = compact ? w * 0.5 : w * 0.2;
    c.save(); c.translate(compact ? (txt.length > 1 ? w * 0.3 : w * 0.24) : cx, h * 0.035); if (tw > maxW) c.scale(maxW / tw, 1); c.fillText(txt, 0, 0); c.restore();
    if (compact) suit(c, s, w * 0.74, h * 0.035 + fh * 0.45, fh * 0.8);
    else suit(c, s, cx, h * 0.035 + fh + h * 0.055, h * 0.095);
  }
  function drawFace(c, s, r, w, h, compact) {
    const rad = Math.max(2, w * 0.07);
    rrect(c, 0.5, 0.5, w - 1, h - 1, rad); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#333'; c.stroke();
    // a cream inner glow so the face isn't flat
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(230,224,200,.35)'); c.fillStyle = g; rrect(c, 1, 1, w - 2, h - 2, rad); c.fill();
    if (compact) {
      index(c, s, r, w, h, true);
      if (r > 10) { // a tiny court portrait
        c.save(); c.translate(w * 0.12, h * 0.4); const sc = (w * 0.76) / 100; c.scale(sc, sc); c.beginPath(); c.rect(0, -6, 100, 76); c.clip(); COURT[r](c, s); c.restore();
        c.strokeStyle = CLOTH[s]; c.lineWidth = 1; c.strokeRect(w * 0.12, h * 0.4 - 6 * w * 0.0076, w * 0.76, 76 * w * 0.0076);
      } else suit(c, s, w / 2, h * 0.66, Math.min(w * 0.55, h * 0.38));
      return;
    }
    index(c, s, r, w, h, false);
    c.save(); c.translate(w, h); c.rotate(Math.PI); index(c, s, r, w, h, false); c.restore();
    if (r === 1) {
      const z = s === 3 ? h * 0.42 : h * 0.3;
      if (s === 3) { // the ace of spades gets a ring of stars and Jack's maker's mark
        c.strokeStyle = '#2a3c9e'; c.lineWidth = Math.max(1, w * 0.02); c.beginPath(); c.arc(w / 2, h / 2, h * 0.27, 0, TAU); c.stroke();
        c.fillStyle = '#d4a000'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; star(c, w / 2 + Math.cos(a) * h * 0.27, h / 2 + Math.sin(a) * h * 0.27, w * 0.035); c.fill(); }
        c.fillStyle = '#2a3c9e'; c.font = `bold ${h * 0.045}px Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('JACKOS 98', w / 2, h * 0.86);
      }
      suit(c, s, w / 2, h / 2, z);
      return;
    }
    if (r > 10) {
      const fx = w * 0.19, fy = h * 0.12, fw = w * 0.62, fhh = h * 0.76;
      c.fillStyle = '#fffbea'; c.fillRect(fx, fy, fw, fhh);
      c.save(); c.beginPath(); c.rect(fx, fy, fw, fhh / 2); c.clip(); c.translate(fx, fy); c.scale(fw / 100, (fhh / 2) / 70); COURT[r](c, s); c.restore();
      c.save(); c.translate(fx + fw, fy + fhh); c.rotate(Math.PI); c.beginPath(); c.rect(0, 0, fw, fhh / 2); c.clip(); c.scale(fw / 100, (fhh / 2) / 70); COURT[r](c, s); c.restore();
      c.strokeStyle = CLOTH[s]; c.lineWidth = Math.max(1, w * 0.025); c.strokeRect(fx, fy, fw, fhh);
      c.strokeStyle = '#d4a000'; c.lineWidth = Math.max(0.8, w * 0.012); c.beginPath(); c.moveTo(fx, fy + fhh / 2); c.lineTo(fx + fw, fy + fhh / 2); c.stroke();
      suit(c, s, fx + fw * 0.12, fy + fhh * 0.07, h * 0.06); suit(c, s, fx + fw * 0.88, fy + fhh * 0.93, h * 0.06, null, true);
      return;
    }
    const px0 = w * 0.27, px1 = w * 0.73, py0 = h * 0.17, py1 = h * 0.83, z = Math.min(w * 0.2, h * 0.14);
    for (const [ux, uy] of PIPS[r]) suit(c, s, px0 + (px1 - px0) * ux, py0 + (py1 - py0) * uy, z, null, uy > 0.5);
  }

  // ================================================================ card backs
  const BACKS = ['Starfield', 'Peapod Race', 'Tartan', 'Cube', 'Blobbit Spots'];
  function drawBack(c, b, w, h) {
    const rad = Math.max(2, w * 0.07);
    rrect(c, 0.5, 0.5, w - 1, h - 1, rad); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#333'; c.lineWidth = 1; c.stroke();
    const m = Math.max(2, w * 0.07), x = m, y = m, iw = w - m * 2, ih = h - m * 2;
    c.save(); rrect(c, x, y, iw, ih, rad * 0.6); c.clip();
    const rnd = JG.rng(77 + b);
    if (b === 0) { // starfield with a ringed planet
      const g = c.createLinearGradient(0, y, 0, y + ih); g.addColorStop(0, '#05052a'); g.addColorStop(1, '#2a0a6a'); c.fillStyle = g; c.fillRect(x, y, iw, ih);
      for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.6})`; const s = rnd() < 0.15 ? 1.6 : 0.9; c.fillRect(x + rnd() * iw, y + rnd() * ih, s, s); }
      const pg = c.createRadialGradient(x + iw * 0.42, y + ih * 0.4, 1, x + iw * 0.5, y + ih * 0.5, iw * 0.3); pg.addColorStop(0, '#ffb060'); pg.addColorStop(1, '#a03010');
      c.fillStyle = pg; c.beginPath(); c.arc(x + iw / 2, y + ih / 2, iw * 0.24, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,240,200,.8)'; c.lineWidth = Math.max(1, w * 0.025); c.beginPath(); c.ellipse(x + iw / 2, y + ih / 2, iw * 0.42, iw * 0.09, -0.35, 0, TAU); c.stroke();
    } else if (b === 1) { // pod race: desert, twin engines and a chequered band
      const g = c.createLinearGradient(0, y, 0, y + ih); g.addColorStop(0, '#ffd890'); g.addColorStop(0.55, '#f0a050'); g.addColorStop(1, '#b8682a'); c.fillStyle = g; c.fillRect(x, y, iw, ih);
      c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(x + iw * 0.75, y + ih * 0.16, iw * 0.09, 0, TAU); c.arc(x + iw * 0.88, y + ih * 0.22, iw * 0.06, 0, TAU); c.fill();
      c.fillStyle = 'rgba(120,60,20,.5)'; c.beginPath(); c.moveTo(x, y + ih * 0.78); for (let i = 0; i <= 8; i++) c.lineTo(x + iw * i / 8, y + ih * (0.74 + (i % 2) * 0.05)); c.lineTo(x + iw, y + ih); c.lineTo(x, y + ih); c.fill();
      const ey = y + ih * 0.42, el = iw * 0.5, eh = ih * 0.08;
      for (const dy of [-eh * 1.1, eh * 1.1]) { c.fillStyle = '#c8c8d0'; rrect(c, x + iw * 0.12, ey + dy - eh / 2, el, eh, eh / 2); c.fill(); c.strokeStyle = '#333'; c.lineWidth = 0.8; c.stroke(); c.fillStyle = '#ff8a00'; c.beginPath(); c.moveTo(x + iw * 0.12, ey + dy - eh / 3); c.lineTo(x + iw * 0.02, ey + dy); c.lineTo(x + iw * 0.12, ey + dy + eh / 3); c.fill(); }
      c.strokeStyle = '#4af'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + iw * 0.62, ey - eh); c.lineTo(x + iw * 0.8, ey); c.lineTo(x + iw * 0.62, ey + eh); c.stroke();
      c.fillStyle = '#4f9a28'; rrect(c, x + iw * 0.78, ey - eh * 0.6, iw * 0.16, eh * 1.2, eh * 0.3); c.fill(); c.stroke();
      const cs = iw / 8; for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#000' : '#fff'; c.fillRect(x + i * cs, y + ih * 0.62 + j * cs * 0.6, cs, cs * 0.6); }
    } else if (b === 2) { // tartan with a gold crest
      c.fillStyle = '#1e6a2a'; c.fillRect(x, y, iw, ih);
      const st = Math.max(4, iw / 6);
      for (let i = -1; i < iw / st + 1; i++) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + i * st, y, st * 0.4, ih); c.fillStyle = 'rgba(255,212,0,.35)'; c.fillRect(x + i * st + st * 0.7, y, 1, ih); }
      for (let i = -1; i < ih / st + 1; i++) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, y + i * st, iw, st * 0.4); c.fillStyle = 'rgba(200,16,46,.45)'; c.fillRect(x, y + i * st + st * 0.7, iw, 1); }
      const cx = x + iw / 2, cy = y + ih / 2, r = iw * 0.26;
      const shield = k => { c.beginPath(); c.moveTo(cx - r * k, cy - r * 1.05 * k); c.lineTo(cx + r * k, cy - r * 1.05 * k); c.lineTo(cx + r * k, cy - r * 0.1 * k); c.quadraticCurveTo(cx + r * k, cy + r * 0.85 * k, cx, cy + r * 1.3 * k); c.quadraticCurveTo(cx - r * k, cy + r * 0.85 * k, cx - r * k, cy - r * 0.1 * k); c.closePath(); };
      c.fillStyle = 'rgba(0,0,0,.4)'; c.save(); c.translate(iw * 0.03, iw * 0.03); shield(1.08); c.fill(); c.restore();
      const gg = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r); gg.addColorStop(0, '#fff6b0'); gg.addColorStop(0.4, '#ffd400'); gg.addColorStop(1, '#a87800');
      shield(1.08); c.fillStyle = gg; c.fill(); c.strokeStyle = '#000'; c.lineWidth = Math.max(0.8, iw * 0.012); c.stroke();
      shield(0.86); c.fillStyle = '#1a2a7a'; c.fill(); c.stroke();
      c.save(); shield(0.86); c.clip(); c.fillStyle = '#c8102e'; c.fillRect(cx - r * 0.12, cy - r, r * 0.24, r * 2.4); c.restore();
      star(c, cx, cy - r * 0.02, r * 0.5); c.fillStyle = '#fff'; c.fill(); c.stroke();
      star(c, cx, cy - r * 0.02, r * 0.3); c.fillStyle = '#ffd400'; c.fill();
    } else if (b === 3) { // cube stickers
      const cols = ['#fff', '#e10600', '#1aa31a', '#ff8a00', '#ffd400', '#2349b8'], n = 4, cw = iw / n;
      c.fillStyle = '#111'; c.fillRect(x, y, iw, ih);
      for (let i = 0; i < n; i++) for (let j = 0; j < Math.ceil(ih / cw); j++) { c.fillStyle = cols[(i * 7 + j * 3 + ((i * j) % 4)) % 6]; rrect(c, x + i * cw + 1.2, y + j * cw + 1.2, cw - 2.4, cw - 2.4, cw * 0.15); c.fill(); }
    } else { // Blobbit spots: a pile of round bouncy Blobbits
      const bg = c.createLinearGradient(x, y, x + iw, y + ih); bg.addColorStop(0, '#ff5a3a'); bg.addColorStop(1, '#a8100e'); c.fillStyle = bg; c.fillRect(x, y, iw, ih);
      c.fillStyle = 'rgba(255,220,120,.28)'; const sp = iw / 5; for (let j = 0; j * sp < ih + sp; j++) for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x + (i + (j % 2) * 0.5) * sp, y + j * sp, sp * 0.16, 0, TAU); c.fill(); }
      const blob = (bx, by, br, col, look) => {
        c.save(); c.translate(bx, by); c.lineWidth = Math.max(0.6, br * 0.09); c.strokeStyle = '#000'; c.lineJoin = 'round';
        c.fillStyle = col; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * br * 0.45, br * 0.95, br * 0.28, br * 0.16, 0, 0, TAU); c.fill(); c.stroke(); }
        for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * br * 0.55, -br * 0.82, br * 0.2, br * 0.3, sx * 0.5, 0, TAU); c.fill(); c.stroke(); }
        const g = c.createRadialGradient(-br * 0.35, -br * 0.4, br * 0.1, 0, 0, br * 1.1); g.addColorStop(0, '#fff'); g.addColorStop(0.25, col); g.addColorStop(1, col);
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, br, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.arc(0, 0, br, 0.1, Math.PI * 0.9); c.arc(0, -br * 0.15, br * 0.92, Math.PI * 0.9, 0.1, true); c.fill();
        for (const sx of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(sx * br * 0.32 + look, -br * 0.15, br * 0.24, br * 0.3, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#000'; c.beginPath(); c.arc(sx * br * 0.32 + look * 1.6, -br * 0.1, br * 0.12, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(sx * br * 0.32 + look * 1.6 - br * 0.05, -br * 0.16, br * 0.045, 0, TAU); c.fill(); }
        c.fillStyle = '#7a1020'; c.beginPath(); c.arc(look, br * 0.28, br * 0.3, 0.15, Math.PI - 0.15); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,90,140,.55)'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * br * 0.62, br * 0.22, br * 0.13, br * 0.08, 0, 0, TAU); c.fill(); }
        c.restore();
      };
      blob(x + iw * 0.27, y + ih * 0.18, iw * 0.15, '#ffd400', 1); blob(x + iw * 0.74, y + ih * 0.26, iw * 0.13, '#3ac8ff', -1);
      blob(x + iw * 0.26, y + ih * 0.8, iw * 0.13, '#7ae04a', 1); blob(x + iw * 0.74, y + ih * 0.78, iw * 0.15, '#ff8ad0', -1);
      const fs = iw * 0.24; c.font = `900 ${fs}px 'Arial Black', Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineJoin = 'round'; c.lineWidth = Math.max(1.5, fs * 0.22); c.strokeStyle = '#000'; c.strokeText('BLOB!', x + iw / 2, y + ih / 2); c.fillStyle = '#fff'; c.fillText('BLOB!', x + iw / 2, y + ih / 2);
      c.fillStyle = '#ffd400'; c.save(); c.beginPath(); c.rect(x, y + ih / 2 + fs * 0.05, iw, fs); c.clip(); c.fillText('BLOB!', x + iw / 2, y + ih / 2); c.restore();
    }
    c.restore();
  }

  // sprite cache (device pixels)
  const cache = new Map();
  function sprite(key, w, h, dpr, paint) {
    const k = key + '|' + w.toFixed(1) + '|' + h.toFixed(1) + '|' + dpr;
    let cv = cache.get(k); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
    const c = cv.getContext('2d'); c.scale(cv.width / w, cv.height / h); paint(c);
    cache.set(k, cv);
    if (cache.size > 700) { let n = 0; for (const kk of cache.keys()) { cache.delete(kk); if (++n > 250) break; } }
    return cv;
  }
  const faceSp = (card, w, h, dpr, compact) => sprite(`f${card.s}.${card.r}${compact ? 'c' : ''}`, w, h, dpr, c => drawFace(c, card.s, card.r, w, h, compact));
  const backSp = (b, w, h, dpr) => sprite('b' + b, w, h, dpr, c => drawBack(c, b, w, h));
  function felt(c, W, H) {
    const g = c.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#16983e'); g.addColorStop(1, '#055a20'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  function feltSp(W, H, dpr) { return sprite('felt', W, H, dpr, c => { felt(c, W, H); c.globalAlpha = 0.05; const rnd = JG.rng(5); for (let i = 0; i < W * H / 60; i++) { c.fillStyle = rnd() < 0.5 ? '#000' : '#fff'; c.fillRect(rnd() * W, rnd() * H, 1, 1); } c.globalAlpha = 1; }); }

  // tweening: every card eases towards (tx, ty); `delay` staggers deals
  function tween(c, dt, speed) {
    if (c.delay > 0) { c.delay -= dt; return true; }
    if (c.fl > 0) c.fl = Math.max(0, c.fl - dt);
    const dx = c.tx - c.x, dy = c.ty - c.y, dr = (c.trot || 0) - (c.rot || 0);
    if (Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4 && Math.abs(dr) < 0.01) { c.x = c.tx; c.y = c.ty; c.rot = c.trot || 0; return c.fl > 0; }
    const k = 1 - Math.pow(0.0004, dt * (speed || 1));
    c.x += dx * k; c.y += dy * k; c.rot = (c.rot || 0) + dr * k;
    return true;
  }
  // draw one card (handles the flip squash, rotation and an optional highlight)
  function blit(ctx, card, w, h, dpr, back, compact, o) {
    o = o || {};
    let up = card.up, sx = 1;
    if (card.fl > 0) { const p = 1 - card.fl / 0.22; if (p < 0.5) up = !up; sx = Math.max(0.05, Math.abs(Math.cos(p * Math.PI))); }
    const img = up ? faceSp(card, w, h, dpr, compact) : backSp(back, w, h, dpr);
    ctx.save();
    ctx.translate(card.x + w / 2, card.y + h / 2);
    if (card.rot) ctx.rotate(card.rot);
    if (o.scale) ctx.scale(o.scale, o.scale);
    if (o.shadow) { ctx.fillStyle = 'rgba(0,0,0,.28)'; rrect(ctx, -w / 2 * sx + 3, -h / 2 + 4, w * sx, h, w * 0.07 * sx); ctx.fill(); }
    ctx.drawImage(img, -w / 2 * sx, -h / 2, w * sx, h);
    if (o.dim) { ctx.fillStyle = 'rgba(0,30,0,.32)'; rrect(ctx, -w / 2, -h / 2, w, h, w * 0.07); ctx.fill(); }
    if (o.sel) { ctx.strokeStyle = o.sel; ctx.lineWidth = 2.5; rrect(ctx, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, w * 0.07); ctx.stroke(); }
    ctx.restore();
  }
  function wrapText(c, text, maxW) {
    const words = String(text).split(' '), lines = []; let line = '';
    for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (c.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t; }
    if (line) lines.push(line); return lines;
  }
  function backPicker(cur, cb) {
    const d = JG.dialog('Select Card Back', `<div class="jgc-backs">${BACKS.map((n, i) => `<button type="button" data-b="${i}" class="${i === cur ? 'on' : ''}" title="${n}"></button>`).join('')}</div><div class="jgc-bname" style="min-height:16px;font-weight:bold">${BACKS[cur]}</div>`,
      [['OK', f => { cb(+f.querySelector('.on').dataset.b); }], ['Cancel']], { w: 330 });
    d.f.querySelectorAll('[data-b]').forEach(b => {
      const cv = backSp(+b.dataset.b, 44, 62, Math.min(2, devicePixelRatio || 1)), im = document.createElement('canvas'); im.width = cv.width; im.height = cv.height; im.style.width = '44px'; im.style.height = '62px'; im.getContext('2d').drawImage(cv, 0, 0); b.appendChild(im);
      b.addEventListener('click', () => { d.f.querySelectorAll('[data-b]').forEach(x => x.classList.toggle('on', x === b)); d.f.querySelector('.jgc-bname').textContent = BACKS[+b.dataset.b]; });
    });
    return d;
  }

  // ======================================================================================== HEARTS
  const V = c => c.r === 1 ? 14 : c.r;
  const isQS = c => c.s === 3 && c.r === 12;
  const PTS = c => c.s === 2 ? 1 : isQS(c) ? 13 : 0;
  const ORDER = [0, 1, 3, 2]; // hand sort: clubs, diamonds, spades, hearts
  const PASSN = ['Left', 'Right', 'Across', 'Hold'];
  const LINES = {
    1: { // Dave
      deal: ['Right. Watch and learn.', 'My uncle taught me this. He works at the card factory.', "I'm basically a pro at Hearts.", 'Did you see the peapod race bit? I could totally drive one of those.', 'Dave says he can do the voice. *ahem* "Win this hand, I will."'],
      takeQ: ['NOOOO! Not the lady!', "That's well unfair. I'm telling.", 'This is worse than when the pod engine blew up.', 'Thirteen points?! My mom will hear about this.'],
      gotPoints: ['Oi! I was just holding those.', 'Hearts? Pfft. I meant to do that.', 'That one was a tactic.'],
      other: ['Ha! Get in!', 'Unlucky, mate.', 'That was me doing a Space Cadet mind trick on you.', 'Called it.'],
      broken: ['Hearts are broken! Everyone panic!', 'Whoa, red cards incoming.'],
      win: ['I WON! I told you I was a pro.', "Undefeated champion of the world. Well, of Mom's kitchen."],
      lose: ['The cards were rigged.', "That doesn't count, I wasn't trying."],
      idle: ['Hurry up, I want to watch the telly.', 'Have you got the new space film sticker album? I need the peapod racer shiny.', 'I had a lightspatula that lit up. Mom took the batteries out.'],
    },
    2: { // the cousin (KIM)
      deal: ['Ready when you are.', "I've seen the new space film twice. Peapod Race is the best bit, no question.", 'Shuffle up, Jack.', 'Let\'s make this quick, I\'m going to Tasha\'s at four.'],
      takeQ: ['Oh, lovely. Thanks a LOT.', 'Fine. I wanted thirteen points anyway.', 'Nice one. Remind me to get you back.'],
      gotPoints: ['Ugh, hearts.', 'Not ideal.', "I'll survive."],
      other: ['Nice!', 'Ha, that was neat.', 'Ouch. Sorry. Not sorry.'],
      broken: ['Hearts are broken, careful now.'],
      win: ['Too easy. Rematch?', KIM + ' wins again. Write it on the fridge.'],
      lose: ['Well played, you lot.', "Next time I'm not going easy on you."],
      idle: ['Is this taking forever or is it just me?', 'May the cards be with you. There, I said it.', 'Gubbinz keeps looking at my hand.'],
    },
    3: { // Gubbinz
      deal: ['It looks like you\'re playing Hearts! Would you like help losing?', 'These cards smell of Wotsitz.', 'Gubbinz wants a laser sword. A double one, like the baddie in the film.', 'Gubbinz can do a peapod race. Gubbinz just needs two engines and NO brakes.'],
      takeQ: ['The pointy lady! Gubbinz is NOT happy.', 'Error 404: fair play not found!', 'Can Gubbinz eat this card? No? Hmph.'],
      gotPoints: ['All the red ones... into MY pile. Hmph.', 'Gubbinz collects hearts. Is that good? It is NOT good.'],
      other: ['Hehehe!', 'Good. Gubbinz likes that.', 'Ha! Have a Blue Conch, that\'s what that was.'],
      broken: ['Ooh, red ones!'],
      win: ['GUBBINZ IS THE BOSS!', 'WAAAGH! Gubbinz wins! Where is Gubbinz\'s prize Twax?'],
      lose: ['Gubbinz was letting you win.', 'Gubbinz is gonna eat the score sheet.'],
      idle: ['Is it Gubbinz\'s go? Is it now? Is it now?', 'Gubbinz is gonna build a peapod racer out of the toaster.', 'Gubbinz saw a little green fella in the film. Not as green as Gubbinz.'],
    },
  };
  const pick = a => a[(Math.random() * a.length) | 0];

  JG.mod('hearts', G => {
    G.fit();
    const host = G.host;
    let opts = Object.assign({ moon: true, legal: true, fast: false, back: 0 }, G.store.get('opts', {}));
    const saveOpts = () => G.store.set('opts', opts);
    const C = G.canvas(host, () => { relayout(true); });
    const cv = C.cv, ctx = C.c; G.focusEl = cv;
    const over = document.createElement('div'); over.className = 'jgc-over'; host.appendChild(over);
    const NAMES = ['You', 'Dave', KIM, 'Gubbinz'];
    const deck = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ s, r, id: s * 13 + r, x: 0, y: 0, tx: 0, ty: 0, rot: 0, trot: 0, up: false, z: 0 });
    let H = null, gen = 0, cursor = -1, drag = null, dirty = true;
    const bubbles = [null, null, null, null];
    let lastSay = 0;
    function say(p, kind, force) {
      if (p === 0 || !H || (NET && (!NET.host || humanSeat(p)))) return;
      const t = performance.now();
      if (!force && (t - lastSay < 1600 || Math.random() < 0.35)) return;
      lastSay = t;
      const L = LINES[p][kind]; if (!L) return;
      bubbles[p] = { text: pick(L), t: 3.4 }; dirty = true;
    }
    function newGame() {
      if (NET && !NET.host) return;
      gen++;
      if (NET) NET.ds = 0;
      H = { players: NAMES.map((n, i) => ({ name: n, hand: [], taken: [], score: 0, hp: 0, hist: [] })), handNo: 0, phase: 'deal', trick: [], leader: 0, turn: 0, broken: false, trickNo: 0, seen: [], qsFrom: -1 };
      if (!NET && saver) saver.clear(); // a new game: the old saved one goes
      const st = G.store.get('stats', { played: 0, won: 0, moons: 0 }); st.played++; G.store.set('stats', st);
      dealHand();
    }
    function dealHand() {
      if (NET && !NET.host) return;
      if (NET) { NET.pass = {}; NET.ds = 0; }
      const my = ++gen;
      H.phase = 'deal'; H.trick = []; H.broken = false; H.trickNo = 0; H.seen = []; H.passSel = []; H.qsFrom = -1;
      H.players.forEach(p => { p.hand = []; p.taken = []; p.hp = 0; });
      const d = JG.shuffle(deck.slice());
      const { cw, ch } = sizes();
      d.forEach((c, i) => { c.up = false; c.gone = false; c.fl = 0; c.x = C.W / 2 - cw / 2; c.y = C.H / 2 - ch / 2; c.rot = 0; c.raised = false; c.recv = false; H.players[i % 4].hand.push(c); c.delay = i * (opts.fast ? 0.008 : 0.018); });
      H.players.forEach((p, i) => sortHand(p));
      H.players[0].hand.forEach(c => { c.up = true; });
      relayout();
      G.sfx('dice');
      G.timeout(() => { if (my !== gen) return; [1, 2, 3].forEach(p => say(p, 'deal')); startPass(); }, opts.fast ? 500 : 1200);
    }
    const sortHand = p => p.hand.sort((a, b) => ORDER[a.s] - ORDER[b.s] || V(a) - V(b));
    function startPass() {
      const dir = H.handNo % 4;
      if (NET && NET.host) pushSoon();
      if (dir === 3) { H.phase = 'hold'; G.status('This hand there is no passing. Keep your cards!'); showBtn('Start', () => { hideBtn(); startPlay(); }); return; }
      H.phase = 'pass'; H.passSel = [];
      G.status(`Select three cards to pass ${PASSN[dir].toLowerCase()} to ${NAMES[(dir === 0 ? 1 : dir === 1 ? 3 : 2)]}.`);
      showBtn('Pass ' + PASSN[dir], doPass, true);
    }
    function showBtn(label, fn, needs3) {
      over.innerHTML = ''; const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = label;
      b.addEventListener('click', () => { if (!b.disabled) { G.sfx('click'); fn(); } }); over.appendChild(b);
      if (needs3) b.disabled = true; H.btn = b; positionOver();
    }
    function hideBtn() { over.innerHTML = ''; if (H) H.btn = null; }
    function positionOver() { over.style.top = Math.round(C.H * 0.42 + 18) + 'px'; }
    function aiPass(p) {
      const hand = H.players[p].hand, cnt = [0, 0, 0, 0]; hand.forEach(c => cnt[c.s]++);
      const hasQ = hand.some(isQS);
      const danger = c => isQS(c) ? (cnt[3] >= 5 ? 6 : 70) : (c.s === 3 && V(c) > 12) ? (cnt[3] >= 5 ? 8 : (hasQ ? 40 : 50)) : c.s === 2 ? V(c) * 2.2 + 3 : V(c) + (cnt[c.s] <= 3 ? 9 : 0);
      return hand.slice().sort((a, b) => danger(b) - danger(a)).slice(0, 3);
    }
    function doPass() {
      if (H.phase !== 'pass' || H.passSel.length !== 3) return;
      if (NET && !NET.host) { NET.s.send({ k: 'pass', hn: H.handNo, ids: H.passSel.map(c => c.id) }); H.passDone = true; hideBtn(); G.status('Cards chosen. Waiting for everybody else to pass...'); return; }
      if (NET && NET.host) { H.passDone = true; if ([1, 2, 3].some(q => humanSeat(q) && !NET.pass[q])) { hideBtn(); G.status('Waiting for everybody else to pick their cards...'); pushSoon(); return; } }
      hideBtn();
      const dir = H.handNo % 4, off = dir === 0 ? 1 : dir === 1 ? 3 : 2;
      const outs = [H.passSel.slice(), ...[1, 2, 3].map(q => (NET && NET.host && humanSeat(q) && NET.pass[q]) ? NET.pass[q] : aiPass(q))];
      if (NET) NET.pass = {};
      outs.forEach((cards, p) => { const q = (p + off) % 4; cards.forEach(c => { H.players[p].hand.splice(H.players[p].hand.indexOf(c), 1); }); });
      outs.forEach((cards, p) => { const q = (p + off) % 4; cards.forEach(c => { c.raised = false; c.up = q === 0; c.recv = q === 0; H.players[q].hand.push(c); }); });
      H.players.forEach(sortHand);
      H.phase = 'passing'; relayout(); G.sfx('turn');
      G.status('Cards passed. The new ones are sticking up.');
      const my = gen;
      G.timeout(() => { if (my !== gen) return; H.players[0].hand.forEach(c => { c.recv = false; }); relayout(); startPlay(); }, opts.fast ? 700 : 1600);
    }
    function startPlay() {
      H.phase = 'play';
      const p = H.players.findIndex(pl => pl.hand.some(c => c.s === 0 && c.r === 2));
      H.leader = H.turn = p; H.trick = [];
      nextTurn();
    }
    function legal(p) {
      const hand = H.players[p].hand;
      if (!H.trick.length) {
        if (H.trickNo === 0) return hand.filter(c => c.s === 0 && c.r === 2);
        if (!H.broken) { const nh = hand.filter(c => c.s !== 2); if (nh.length) return nh; }
        return hand.slice();
      }
      const lead = H.trick[0].card.s, f = hand.filter(c => c.s === lead);
      if (f.length) return f;
      if (H.trickNo === 0) { const np = hand.filter(c => !PTS(c)); if (np.length) return np; }
      return hand.slice();
    }
    function moonThreat(p) { // somebody else has every point taken so far (and a fair few of them)
      const tot = H.players.map(pl => pl.taken.reduce((a, c) => a + PTS(c), 0));
      const sum = tot.reduce((a, b) => a + b, 0);
      if (sum < 8) return -1;
      const q = tot.findIndex(t => t === sum);
      return q >= 0 && q !== p ? q : -1;
    }
    function aiChoose(p) {
      const L = legal(p); if (L.length === 1) return L[0];
      const hand = H.players[p].hand, cnt = [0, 0, 0, 0]; hand.forEach(c => cnt[c.s]++);
      const qsOut = !H.seen.some(isQS), hasQ = hand.some(isQS), threat = moonThreat(p);
      if (!H.trick.length) {
        let best = null, bs = 1e9;
        for (const c of L) {
          let s = V(c);
          if (c.s === 2) s += 9;
          if (c.s === 3) { if (isQS(c)) s += 40; else if (hasQ) s += 7; else if (qsOut && V(c) < 12) s -= 4; else if (qsOut && V(c) > 12) s += 30; }
          if (cnt[c.s] <= 2 && c.s !== 3) s -= 3;
          if (threat >= 0 && c.s === 2) s -= 6; // lead a heart to stop a moon shot
          s += Math.random() * 0.5;
          if (s < bs) { bs = s; best = c; }
        }
        return best;
      }
      const lead = H.trick[0].card.s;
      let win = H.trick[0];
      for (const t of H.trick) if (t.card.s === lead && V(t.card) > V(win.card)) win = t;
      const tpts = H.trick.reduce((a, t) => a + PTS(t.card), 0), last = H.trick.length === 3;
      if (L[0].s === lead) {
        if (threat >= 0 && win.p === threat && tpts > 0) { const above = L.filter(c => V(c) > V(win.card) && !isQS(c)).sort((a, b) => V(a) - V(b)); if (above.length) return above[0]; }
        const qs = L.find(isQS);
        if (qs && V(win.card) > 12) return qs; // a bigger spade is out: dump the lady on it
        const under = L.filter(c => V(c) < V(win.card) && !isQS(c));
        if (under.length) return under.reduce((a, b) => V(b) > V(a) ? b : a);
        const safe = L.filter(c => !isQS(c));
        const pool = safe.length ? safe : L;
        if (last && tpts === 0) return pool.reduce((a, b) => V(b) > V(a) ? b : a);
        if (lead === 3 && qsOut && !hasQ) return pool.reduce((a, b) => V(b) < V(a) ? b : a);
        return last ? pool.reduce((a, b) => V(b) > V(a) ? b : a) : pool.reduce((a, b) => V(b) < V(a) ? b : a);
      }
      // void: throw away the nastiest card
      const helpingShooter = threat >= 0 && win.p === threat;
      let best = null, bs = -1e9;
      for (const c of L) {
        let s = V(c);
        if (isQS(c)) s += helpingShooter ? -50 : 100;
        else if (c.s === 3 && V(c) > 12 && qsOut && !hasQ) s += 30;
        else if (c.s === 2) s += helpingShooter ? -20 : 10;
        if (cnt[c.s] === 1) s += 3;
        if (s > bs) { bs = s; best = c; }
      }
      return best;
    }
    function nextTurn() {
      if (H.phase !== 'play') return;
      const p = H.turn;
      relayout();
      if (p === 0) {
        const L = legal(0);
        G.status(H.trickNo === 0 && !H.trick.length ? 'Your lead. Play the 2 of clubs to start.' : !H.trick.length ? 'Your lead. Pick a card.' : `Your turn. ${L[0].s === H.trick[0].card.s ? 'Follow suit.' : 'You can play anything (you have no ' + SN[H.trick[0].card.s].toLowerCase() + ').'}`);
        if (cursor < 0 || cursor >= H.players[0].hand.length) cursor = -1;
        return;
      }
      G.status(`${NAMES[p]} is thinking...`);
      if (NET && (!NET.host || humanSeat(p))) return; // a real person: their card arrives over JackNet
      const my = gen;
      G.timeout(() => { if (my !== gen || H.phase !== 'play' || H.turn !== p) return; play(p, aiChoose(p)); }, opts.fast ? 220 : 520 + Math.random() * 300);
    }
    function play(p, card) {
      const pl = H.players[p];
      if (!legal(p).includes(card)) return false;
      pl.hand.splice(pl.hand.indexOf(card), 1);
      card.up = true; card.raised = false; if (p !== 0) card.fl = 0.22;
      H.trick.push({ p, card }); H.seen.push(card); card.z = 100 + H.trick.length;
      if (card.s === 2 && !H.broken) { H.broken = true; [1, 2, 3].forEach(q => q !== p && say(q, 'broken')); }
      if (isQS(card)) H.qsFrom = p;
      G.sfx('turn');
      cursor = -1;
      if (!NET) saver.save();
      if (H.trick.length === 4) { H.phase = 'trick'; relayout(); const my = gen; G.timeout(() => { if (my === gen) endTrick(); }, opts.fast ? 500 : 1100); }
      else { H.turn = (p + 1) % 4; relayout(); nextTurn(); }
      return true;
    }
    function endTrick() {
      const lead = H.trick[0].card.s;
      let win = H.trick[0]; for (const t of H.trick) if (t.card.s === lead && V(t.card) > V(win.card)) win = t;
      const w = H.players[win.p], pts = H.trick.reduce((a, t) => a + PTS(t.card), 0);
      H.trick.forEach(t => { w.taken.push(t.card); t.card.gone = win.p + 1; });
      if (pts > 0) {
        if (H.trick.some(t => isQS(t.card))) {
          if (win.p > 0) say(win.p, 'takeQ', true);
          [1, 2, 3].filter(q => q !== win.p).forEach(q => say(q, 'other'));
          if (win.p === 1 && H.qsFrom === 0) { G.secret('games.hearts.dave'); }
          if (win.p === 0) G.sfx('uhoh');
        } else if (win.p > 0) say(win.p, 'gotPoints');
      } else if (Math.random() < 0.08) say(1 + ((Math.random() * 3) | 0), 'idle');
      H.trick = []; H.trickNo++; H.leader = H.turn = win.p;
      H.phase = 'play';
      relayout();
      if (H.trickNo === 13) { H.phase = 'handend'; const my = gen; G.timeout(() => { if (my === gen) endHand(); }, opts.fast ? 400 : 900); return; }
      nextTurn();
    }
    function endHand() {
      const hp = H.players.map(p => p.taken.reduce((a, c) => a + PTS(c), 0));
      let moon = hp.findIndex(x => x === 26), note = '';
      if (moon >= 0 && opts.moon) {
        H.players.forEach((p, i) => { p.hp = i === moon ? 0 : 26; });
        note = moon === 0 ? 'YOU SHOT THE MOON! Everyone else gets 26.' : `${NAMES[moon]} shot the moon! Everyone else gets 26.`;
        if (moon === 0) { G.secret('games.hearts.moon'); G.sfx('solve'); const st = G.store.get('stats', { played: 0, won: 0, moons: 0 }); st.moons = (st.moons || 0) + 1; G.store.set('stats', st); }
        else say(moon, 'win', true);
      } else H.players.forEach((p, i) => { p.hp = hp[i]; });
      H.players.forEach(p => { p.score += p.hp; p.hist.push(p.hp); });
      H.handNo++; scored = H.handNo;
      if (!NET) saver.save();
      const done = H.players.some(p => p.score >= 100);
      if (NET && NET.host) { NET.ds = H.handNo; NET.note = note; NET.done = done; pushSoon(); }
      scoreDialog(note, done);
    }
    function scoreDialog(note, done) {
      const rows = H.players.map((p, i) => `<tr${i === 0 ? ' class="me"' : ''}><td>${G.esc(p.name)}</td>${p.hist.map(x => `<td>${x}</td>`).join('')}<td><b>${p.score}</b></td></tr>`).join('');
      const cols = H.players[0].hist.map((_, i) => `<th>${i + 1}</th>`).join('');
      let msg = note ? `<p style="margin:0 0 8px;font-weight:bold;color:#a00000">${G.esc(note)}</p>` : '';
      if (done) {
        const low = Math.min(...H.players.map(p => p.score)), winners = H.players.map((p, i) => p.score === low ? i : -1).filter(i => i >= 0);
        const youWin = winners.includes(0);
        msg += `<p style="margin:0 0 8px"><b>${youWin ? 'You win!' : NAMES[winners[0]] + ' wins!'}</b> ${youWin ? 'Lowest score on the board. Dave wants a rematch.' : 'Better luck next time.'}</p>`;
        const st = G.store.get('stats', { played: 0, won: 0, moons: 0 });
        if (youWin) { st.won++; G.secret('games.hearts.win'); G.sfx('solve'); [1, 2, 3].forEach(q => say(q, 'lose', true)); }
        else { winners.forEach(q => q && say(q, 'win', true)); G.sfx('uhoh'); }
        st.best = youWin ? Math.min(st.best || 999, H.players[0].score) : st.best;
        G.store.set('stats', st);
      }
      const d = G.dialog(done ? 'Game Over' : 'Score Sheet', `${msg}<div style="overflow:auto;max-height:220px"><table class="jgc-hs"><tr><th>Player</th>${cols}<th>Total</th></tr>${rows}</table></div>`,
        NET && !NET.host ? [['OK']] : [[done ? 'New Game' : 'Next Hand', () => { if (done) newGame(); else dealHand(); }]], { w: Math.min(420, innerWidth - 10) });
      return d;
    }

    // ---------------------------------------------------------------- layout
    function sizes() {
      const W = C.W, Hh = C.H, phone = W < 520;
      const cw = clamp(Math.min(W * (phone ? 0.15 : 0.11), Hh * 0.13), 36, 74), ch = cw * 1.4;
      const handY = Hh - ch - (phone ? 10 : 14);
      return { W, Hh, phone, cw, ch, handY, sm: 0.6 };
    }
    function relayout(snap) {
      if (!H) return;
      const { W, Hh, cw, ch, handY, sm, phone } = sizes();
      const cx = W / 2, cy = (Hh - ch * 0.3) / 2;
      // your hand
      const me = H.players[0].hand, n = me.length;
      const sp = n > 1 ? Math.min(cw * 0.62, (W - 16 - cw) / (n - 1)) : 0, x0 = cx - ((n - 1) * sp + cw) / 2;
      me.forEach((c, i) => { c.tx = x0 + i * sp; c.ty = handY - (c.raised || c.recv ? ch * 0.22 : 0); c.trot = 0; c.z = i; c.gone = false; });
      // opponents: sideways stacks for Dave/Gubbinz, a row for the cousin
      const ow = cw * sm, oh = ch * sm;
      for (const p of [1, 2, 3]) {
        const hand = H.players[p].hand, m = hand.length;
        if (p === 2) { const s2 = Math.min(ow * 0.42, (W * 0.6) / Math.max(1, m)); const xs = cx - ((m - 1) * s2 + ow) / 2; hand.forEach((c, i) => { c.tx = xs + i * s2; c.ty = phone ? 30 : 34; c.trot = 0; c.z = i; }); }
        else {
          const top = phone ? 92 : 70, avail = handY - top - 30 - oh, s2 = Math.min(ow * 0.42, avail / Math.max(1, m));
          const ys = top + (avail - (m - 1) * s2) / 2;
          hand.forEach((c, i) => { c.tx = p === 1 ? (phone ? 6 : 14) + (oh - ow) / 2 : W - (phone ? 6 : 14) - oh + (oh - ow) / 2; c.ty = ys + i * s2; c.trot = Math.PI / 2; c.z = i; });
        }
      }
      // trick in the middle
      const offX = Math.min(cw * 0.95, W * 0.17), offY = Math.min(ch * 0.55, Hh * 0.13);
      const spot = [[cx - cw / 2, cy - ch / 2 + offY], [cx - cw / 2 - offX, cy - ch / 2], [cx - cw / 2, cy - ch / 2 - offY], [cx - cw / 2 + offX, cy - ch / 2]];
      H.trick.forEach(t => { t.card.tx = spot[t.p][0]; t.card.ty = spot[t.p][1]; t.card.trot = (t.p % 2 ? 0.12 : -0.05) * (t.p === 3 ? -1 : 1); });
      // taken cards fly off towards the winner and vanish
      const dest = [[cx - cw / 2, Hh + ch], [-cw * 2, cy - ch / 2], [cx - cw / 2, -ch * 2], [W + cw, cy - ch / 2]];
      deck.forEach(c => { if (c.gone) { const d = dest[c.gone - 1]; c.tx = d[0]; c.ty = d[1]; } });
      if (snap) deck.forEach(c => { c.x = c.tx; c.y = c.ty; c.rot = c.trot; c.delay = 0; });
      positionOver();
      dirty = true;
      if (NET && NET.host) pushSoon();
    }

    // ---------------------------------------------------------------- drawing
    function labelBox(text, x, y, align, hi) {
      ctx.font = 'bold 12px Tahoma, sans-serif'; const tw = ctx.measureText(text).width + 12;
      const bx = align === 'c' ? x - tw / 2 : align === 'r' ? x - tw : x;
      ctx.fillStyle = hi ? 'rgba(255,255,160,.95)' : 'rgba(0,40,0,.55)'; rrect(ctx, bx, y, tw, 18, 4); ctx.fill();
      ctx.fillStyle = hi ? '#000' : '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + 6, y + 9.5);
    }
    function bubble(p, b) {
      const { W, Hh, handY, phone } = sizes();
      ctx.font = '12px Tahoma, sans-serif';
      const maxW = phone ? 150 : 200, lines = wrapText(ctx, b.text, maxW - 14), bw = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width)) + 14), bh = lines.length * 15 + 10;
      let x, y, tx, ty;
      if (p === 1) { x = phone ? 40 : 70; y = phone ? Hh * 0.42 : Hh * 0.28; tx = x - 14; ty = y + bh / 2; }
      else if (p === 2) { x = W / 2 + (phone ? -bw / 2 : 40); y = phone ? 96 : 62; tx = x + (phone ? bw / 2 : 10); ty = y - 10; }
      else { x = W - bw - (phone ? 40 : 70); y = phone ? Hh * 0.56 : Hh * 0.42; tx = x + bw + 14; ty = y + bh / 2; }
      x = clamp(x, 4, W - bw - 4); y = clamp(y, 4, handY - bh - 4);
      ctx.globalAlpha = Math.min(1, b.t * 2);
      ctx.fillStyle = '#ffffe8'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      rrect(ctx, x, y, bw, bh, 8); ctx.fill(); ctx.stroke();
      ctx.beginPath(); const mx = clamp(tx, x + 10, x + bw - 10), my = clamp(ty, y + 8, y + bh - 8);
      if (p === 2) { ctx.moveTo(mx - 6, y + 0.5); ctx.lineTo(tx, ty); ctx.lineTo(mx + 6, y + 0.5); }
      else { const ex = p === 1 ? x + 0.5 : x + bw - 0.5; ctx.moveTo(ex, my - 6); ctx.lineTo(tx, ty); ctx.lineTo(ex, my + 6); }
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#000'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      lines.forEach((l, i) => ctx.fillText(l, x + 7, y + 5 + i * 15));
      ctx.globalAlpha = 1;
    }
    function draw() {
      const { W, Hh, cw, ch, handY, sm, phone } = sizes(), dpr = C.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(feltSp(W, Hh, dpr), 0, 0, W, Hh);
      if (!H) return;
      // labels
      const sc = i => `${NAMES[i]}  ${H.players[i].score}${H.phase === 'play' || H.phase === 'trick' ? '' : ''}`;
      labelBox(sc(2), W / 2, 6, 'c', H.turn === 2 && H.phase === 'play');
      labelBox(sc(1), phone ? 4 : 10, phone ? 70 : 46, 'l', H.turn === 1 && H.phase === 'play');
      labelBox(sc(3), W - (phone ? 4 : 10), phone ? 70 : 46, 'r', H.turn === 3 && H.phase === 'play');
      labelBox(sc(0) + (H.players[0].taken.length ? `  (this hand: ${H.players[0].taken.reduce((a, c) => a + PTS(c), 0)})` : ''), W / 2, handY - 24 - (H.phase === 'pass' ? ch * 0.22 : 0), 'c', H.turn === 0 && H.phase === 'play');
      if (H.phase === 'pass' || H.phase === 'hold') { ctx.font = 'bold 14px Tahoma, sans-serif'; ctx.fillStyle = '#ffffa0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(H.phase === 'hold' ? 'No passing this hand' : `Pass three cards ${PASSN[H.handNo % 4].toLowerCase()}`, W / 2, Hh * 0.42); }
      // cards: opponents, trick, you
      const legalSet = H.phase === 'play' && H.turn === 0 && opts.legal ? new Set(legal(0)) : null;
      const list = deck.filter(c => !(c.gone && Math.abs(c.x - c.tx) < 1 && Math.abs(c.y - c.ty) < 1));
      const where = c => H.players[0].hand.includes(c) ? 2 : H.trick.some(t => t.card === c) ? 1 : c.gone ? 1 : 0;
      list.sort((a, b) => where(a) - where(b) || a.z - b.z);
      for (const c of list) {
        const w0 = where(c), small = w0 === 0 && !c.gone;
        const w = small ? cw * sm : cw, h = small ? ch * sm : ch;
        if (drag && drag.card === c) continue;
        const i = H.players[0].hand.indexOf(c);
        blit(ctx, c, w, h, dpr, opts.back, w < 46, { dim: legalSet && w0 === 2 && !legalSet.has(c), sel: w0 === 2 && i === cursor ? '#ffd400' : (H.phase === 'pass' && c.raised ? '#000080' : null), shadow: w0 === 1 });
      }
      if (drag && drag.live) { const c = drag.card; const sx = c.x, sy = c.y; c.x = drag.x - drag.gx; c.y = drag.y - drag.gy; blit(ctx, c, cw, ch, dpr, opts.back, cw < 46, { shadow: true }); c.x = sx; c.y = sy; }
      for (let p = 1; p < 4; p++) if (bubbles[p]) bubble(p, bubbles[p]);
    }

    // ---------------------------------------------------------------- input
    function handAt(x, y) {
      const { cw, ch } = sizes(), hand = H.players[0].hand;
      for (let i = hand.length - 1; i >= 0; i--) { const c = hand[i]; if (x >= c.x && x < c.x + cw && y >= c.y && y < c.y + ch) return i; }
      return -1;
    }
    function act(i) {
      if (!H || i < 0) return;
      const c = H.players[0].hand[i]; if (!c) return;
      if (H.phase === 'pass') {
        if (c.raised) { c.raised = false; H.passSel.splice(H.passSel.indexOf(c), 1); }
        else if (H.passSel.length < 3) { c.raised = true; H.passSel.push(c); }
        else { G.sfx('beep'); return; }
        G.sfx('click'); if (H.btn) H.btn.disabled = H.passSel.length !== 3;
        relayout(); return;
      }
      if (H.phase === 'play' && H.turn === 0 && NET && !NET.host) {
        if (legal(0).includes(c)) { NET.s.send({ k: 'play', hn: H.handNo, tn: H.trickNo, id: c.id }); c.raised = true; H.turn = -1; G.sfx('turn'); relayout(); G.status('Sent!'); }
        else G.sfx('beep');
        return;
      }
      if (H.phase === 'play' && H.turn === 0) {
        if (!play(0, c)) {
          const L = legal(0); G.sfx('beep');
          G.status(H.trickNo === 0 && !H.trick.length ? 'You must lead the 2 of clubs.' : !H.trick.length && !H.broken && c.s === 2 ? "Hearts haven't been broken yet. Lead something else." : H.trick.length && L[0].s === H.trick[0].card.s ? `You must follow suit (${SN[H.trick[0].card.s].toLowerCase()}).` : "You can't play points on the first trick.");
        }
      }
    }
    G.on(cv, 'pointerdown', ev => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      ev.preventDefault(); G.focus();
      if (!H) return;
      const r = DesktopSurface.rect(cv), point = DesktopSurface.point(ev.clientX, ev.clientY), x = point.x - r.left, y = point.y - r.top, i = handAt(x, y);
      if (i < 0) return;
      const c = H.players[0].hand[i];
      drag = { card: c, i, x, y, sx: x, sy: y, gx: x - c.x, gy: y - c.y, live: false, id: ev.pointerId };
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
    });
    G.on(cv, 'pointermove', ev => {
      if (!drag || ev.pointerId !== drag.id) return;
      const r = DesktopSurface.rect(cv), point = DesktopSurface.point(ev.clientX, ev.clientY); drag.x = point.x - r.left; drag.y = point.y - r.top;
      if (!drag.live && Math.hypot(drag.x - drag.sx, drag.y - drag.sy) > 10 && H.phase === 'play' && H.turn === 0) drag.live = true;
      if (drag.live) dirty = true;
    });
    const endDrag = (ev, cancel) => {
      if (!drag || ev.pointerId !== drag.id) return;
      const d = drag; drag = null; dirty = true;
      if (cancel) return;
      if (d.live) { const { handY, ch } = sizes(); if (d.y < handY - ch * 0.3) act(H.players[0].hand.indexOf(d.card)); }
      else act(H.players[0].hand.indexOf(d.card));
    };
    G.on(cv, 'pointerup', ev => endDrag(ev, false)); G.on(cv, 'pointercancel', ev => endDrag(ev, true));
    G.keys = {
      down(ev) {
        if (!H) return false;
        const n = H.players[0].hand.length;
        if (ev.key === 'ArrowLeft') { cursor = cursor <= 0 ? n - 1 : cursor - 1; dirty = true; return true; }
        if (ev.key === 'ArrowRight') { cursor = cursor >= n - 1 ? 0 : cursor + 1; dirty = true; return true; }
        if ((ev.key === 'Enter' || ev.key === ' ') && cursor >= 0) { act(cursor); dirty = true; return true; }
        if ((ev.key === 'Enter' || ev.key === ' ') && H.btn && !H.btn.disabled) { H.btn.click(); return true; }
        return false;
      },
    };

    // ---------------------------------------------------------------- loop
    G.loop(dt => {
      let busy = false;
      for (const c of deck) if (tween(c, dt, opts.fast ? 2.2 : 1.3)) busy = true;
      for (let p = 1; p < 4; p++) if (bubbles[p]) { bubbles[p].t -= dt; busy = true; if (bubbles[p].t <= 0) bubbles[p] = null; }
      if (busy || dirty || drag) { draw(); dirty = false; }
    });

    // ---------------------------------------------------------------- menus
    G.newGame = () => { if (NET) { Desk.toast('Hearts', "You're at an online table. Leave it first (the Leave button at the top).", 3000); return; } hideBtn(); newGame(); };

    // ---------------------------------------------------------------- online tables (mp.js): up to four people, bots fill the rest
    // The host's PC runs the real game (absolute seats, the host is seat 0); everybody else gets their own view of it,
    // turned round so they sit at the bottom, with only their own cards visible. Guests send their passes and plays.
    // A player whose connection drops keeps their seat for two minutes (the game waits on their turn), then a bot takes over.
    let NET = null;
    const BOTN = ['Dave', "Jack's Cousin", 'Gubbinz']; // online: the guests see these too, so the role, not this visitor's cousin's name
    const byId = id => deck.find(c => c.id === id);
    function humanSeat(p) { const x = NET && NET.seats[p]; return !!(x && !x.bot); }
    function seatOf(id) { return NET ? NET.seats.findIndex(x => x && !x.bot && x.id === id) : -1; }
    function seatName(j) { const x = NET.seats[j]; return x ? x.nick + (x.bot && x.was ? ' (bot)' : '') : '?'; }
    let pushT = 0;
    function pushSoon() { if (!NET || !NET.host || pushT) return; pushT = setTimeout(() => { pushT = 0; push(); }, 30); }
    function view(k) {
      const L = a => (a - k + 4) % 4, pl = [0, 1, 2, 3].map(i => H.players[(i + k) % 4]);
      return { hn: H.handNo, ph: H.phase, tr: H.trick.map(t => [L(t.p), t.card.id]), ld: L(H.leader), tu: H.phase === 'play' ? L(H.turn) : -1, br: H.broken ? 1 : 0, tn: H.trickNo,
        nm: [0, 1, 2, 3].map(i => i === 0 ? 'You' : seatName((i + k) % 4)), h: pl[0].hand.map(c => c.id), n: pl.map(p => p.hand.length), tk: pl.map(p => p.taken.map(c => c.id)),
        sc: pl.map(p => p.score), hp: pl.map(p => p.hp), hi: pl.map(p => p.hist.slice(-20)), pd: NET.pass[k] ? 1 : 0, ds: NET.ds || 0, note: NET.note || '', done: NET.done ? 1 : 0 };
    }
    function ser() { return { H: { hn: H.handNo, ph: H.phase, tr: H.trick.map(t => [t.p, t.card.id]), ld: H.leader, tu: H.turn, br: H.broken ? 1 : 0, tn: H.trickNo, qs: H.qsFrom, seen: H.seen.map(c => c.id), pl: H.players.map(p => ({ h: p.hand.map(c => c.id), tk: p.taken.map(c => c.id), sc: p.score, hp: p.hp, hi: p.hist })) }, seats: NET.seats }; }
    function push() {
      if (!NET || !NET.host || !H) return;
      for (const [j, x] of NET.seats.entries()) if (j > 0 && x && !x.bot) NET.s.send({ k: 'v', v: view(j) }, x.id);
      NET.s.save(ser());
    }
    function seatsFromRoster() { // humans in the order they joined, then bots
      const hum = NET.s.roster.filter(p => !p.bot).slice(0, 4);
      const seats = hum.map(p => ({ id: p.id, nick: p.nick, bot: false }));
      let b = 0; while (seats.length < 4) seats.push({ id: 0, nick: BOTN[b++] || 'Bot', bot: true });
      return seats;
    }
    function tableScreen() {
      over.innerHTML = '';
      const box = document.createElement('div'); box.className = 'jgc-table';
      box.style.cssText = 'background:#c0c0c0;border:2px outset #fff;padding:8px 10px;font:12px Tahoma,sans-serif;text-align:center;max-width:280px;margin:0 auto';
      const hum = NET.s.roster.filter(p => !p.bot);
      box.innerHTML = `<b>Online Hearts table</b><div style="margin:6px 0;text-align:left">${[0, 1, 2, 3].map(i => `Seat ${i + 1}: ${hum[i] ? G.esc(hum[i].nick) + (hum[i].id === Net.me.id ? ' (you)' : '') : '<i>empty (a bot will sit here)</i>'}`).join('<br>')}</div>`;
      if (NET.host) {
        const inv = document.createElement('button'); inv.className = 'btn'; inv.type = 'button'; inv.textContent = 'Invite another player'; inv.onclick = () => MP.pick('cards.hearts');
        const go = document.createElement('button'); go.className = 'btn'; go.type = 'button'; go.textContent = 'Deal!'; go.style.marginLeft = '6px'; go.onclick = () => startOnline();
        box.appendChild(inv); box.appendChild(go);
      } else box.insertAdjacentHTML('beforeend', `<div>Waiting for ${G.esc(NET.s.nick(NET.s.hostId))} to deal...</div>`);
      over.appendChild(box); over.style.top = '20%';
      G.status(NET.host ? 'Invite up to three people, then press Deal. Bots fill any empty seats.' : 'Sitting at the table...');
    }
    function startOnline() {
      NET.table = false; NET.s.heartsTable = false; NET.seats = seatsFromRoster();
      if (NET.seats.every(x => !x.bot)) G.secret('mp.hearts');
      NET.seats.forEach((x, j) => { NAMES[j] = j === 0 ? 'You' : x.nick; });
      hideBtn(); newGame(); push();
    }
    // a guest builds its own (turned round) copy of the table from the host's view
    let lastDs = 0;
    function applyView(v) {
      if (!v || typeof v !== 'object' || !Array.isArray(v.h) || !Array.isArray(v.tk) || v.tk.length !== 4) return;
      NET.table = false; if (over.querySelector('.jgc-table')) over.innerHTML = '';
      const prevPh = H && H.phase, prevHn = H && H.handNo, keepSel = H && H.passSel && prevPh === 'pass' && prevHn === v.hn && v.ph === 'pass' ? H.passSel.map(c => c.id) : [];
      if (!H) H = { players: [0, 1, 2, 3].map(() => ({ name: '', hand: [], taken: [], score: 0, hp: 0, hist: [] })), seen: [], passSel: [] };
      v.nm.forEach((n, i) => { NAMES[i] = String(n).slice(0, 24); });
      const known = new Set([...v.h, ...v.tr.map(t => t[1]), ...[].concat(...v.tk)]), unknown = deck.filter(c => !known.has(c.id));
      deck.forEach(c => { c.gone = false; c.raised = false; c.recv = false; });
      H.players.forEach((p, i) => { p.name = NAMES[i]; p.score = v.sc[i] | 0; p.hp = v.hp[i] | 0; p.hist = Array.isArray(v.hi[i]) ? v.hi[i] : []; p.taken = v.tk[i].map(byId).filter(Boolean); p.taken.forEach(c => { c.gone = i + 1; c.up = true; }); });
      H.players[0].hand = v.h.map(byId).filter(Boolean); H.players[0].hand.forEach(c => { c.up = true; });
      for (let i = 1; i < 4; i++) { H.players[i].hand = unknown.splice(0, v.n[i] | 0); H.players[i].hand.forEach(c => { c.up = false; }); }
      H.trick = v.tr.map(([p, id]) => ({ p, card: byId(id) })).filter(t => t.card); H.trick.forEach(t => { t.card.up = true; });
      H.handNo = v.hn | 0; H.phase = v.ph; H.turn = v.tu; H.leader = v.ld; H.broken = !!v.br; H.trickNo = v.tn | 0; H.seen = [];
      sortHand(H.players[0]);
      H.passSel = keepSel.map(byId).filter(c => c && H.players[0].hand.includes(c)); H.passSel.forEach(c => { c.raised = true; });
      if (v.ph === 'pass' && !v.pd) { if (!H.btn || prevHn !== v.hn || prevPh !== 'pass') { const dir = H.handNo % 4; showBtn('Pass ' + PASSN[dir], doPass, true); } if (H.btn) H.btn.disabled = H.passSel.length !== 3; G.status(`Select three cards to pass ${PASSN[H.handNo % 4].toLowerCase()}.`); }
      else hideBtn();
      if (v.ph === 'pass' && v.pd) G.status('Waiting for everybody else to pass...');
      else if (v.ph === 'hold') G.status(`No passing this hand. Waiting for ${NET.s.nick(NET.s.hostId)} to start...`);
      else if (v.ph === 'play') G.status(H.turn === 0 ? (H.trickNo === 0 && !H.trick.length ? 'Your lead. Play the 2 of clubs to start.' : 'Your turn!') : `${NAMES[H.turn] || 'Somebody'} is thinking...`);
      if (prevPh === 'play' && v.ph === 'play' && H.turn === 0) G.sfx('turn');
      relayout();
      if (v.ds && v.ds !== lastDs) { lastDs = v.ds; scoreDialog(v.note || '', !!v.done); }
    }
    function goOffline(why) {
      if (!NET) return; NET = null; NAMES.splice(0, 4, 'You', 'Dave', KIM, 'Gubbinz');
      if (why) G.msg('Hearts', why + '\n\nDealing you a fresh game against Dave, ' + KIM + ' and Gubbinz.', 'info');
      over.innerHTML = ''; H = null; newGame();
    }
    function botTakesOver(id, why) {
      const j = seatOf(id); if (j <= 0 || !H) return;
      const x = NET.seats[j]; x.bot = true; x.was = true; NAMES[j] = x.nick + ' (bot)';
      G.status(`${x.nick} ${why}. A bot is playing their cards now.`);
      if (H.phase === 'pass' && H.passDone && ![1, 2, 3].some(q => humanSeat(q) && !NET.pass[q])) doPass();
      else if (H.phase === 'play' && H.turn === j) nextTurn();
      push();
    }
    function onlineSession(s) {
      if (NET && NET.s && NET.s !== s && !NET.s.ended) NET.s.leave(true);
      NET = { s, host: s.host, my: 0, seats: [], pass: {}, table: true, ds: 0 };
      s.heartsTable = s.host;
      gen++; hideBtn(); deck.forEach(c => { c.gone = false; });
      s.on('end', () => { if (NET && NET.s === s) goOffline(''); });
      s.on('roster', () => { if (NET && NET.s === s && NET.table) tableScreen(); });
      if (s.host) {
        s.state(id => { const j = seatOf(id); return H && !NET.table && j > 0 ? { v: view(j) } : { table: 1 }; });
        s.on('m', (d, from) => {
          if (!NET || NET.s !== s || !d || !H || NET.table) return;
          const j = seatOf(from); if (j <= 0) return;
          if (d.k === 'pass' && H.phase === 'pass' && d.hn === H.handNo && Array.isArray(d.ids) && d.ids.length === 3 && !NET.pass[j]) {
            const cards = d.ids.map(byId); if (new Set(d.ids).size !== 3 || !cards.every(c => c && H.players[j].hand.includes(c))) return;
            NET.pass[j] = cards; pushSoon();
            if (H.passDone && ![1, 2, 3].some(q => humanSeat(q) && !NET.pass[q])) doPass();
          }
          if (d.k === 'play' && H.phase === 'play' && H.turn === j && d.hn === H.handNo) { const c = byId(d.id); if (!c || !H.players[j].hand.includes(c) || !play(j, c)) push(); }
        });
        s.on('gone', id => botTakesOver(id, 'lost their connection'));
        s.on('left', id => { if (NET && NET.table) tableScreen(); else botTakesOver(id, 'left the table'); });
        s.on('lost', () => { if (H && H.phase === 'play' && humanSeat(H.turn)) G.status(`${NAMES[H.turn]}'s connection dropped. Waiting for them (the game is paused)...`); });
        if (s.resumed && s.saved && s.saved.H && Array.isArray(s.saved.seats)) { // the host's page was reloaded mid-game
          const S0 = s.saved.H; NET.seats = s.saved.seats; NET.table = false; s.heartsTable = false;
          NET.seats.forEach((x, j) => { NAMES[j] = j === 0 ? 'You' : x.nick + (x.bot && x.was ? ' (bot)' : ''); });
          gen++; deck.forEach(c => { c.gone = false; c.raised = false; c.recv = false; });
          H = { players: S0.pl.map((p, i) => ({ name: NAMES[i], hand: p.h.map(byId), taken: p.tk.map(byId), score: p.sc, hp: p.hp, hist: p.hi || [] })), handNo: S0.hn, phase: S0.ph, trick: S0.tr.map(([p, id]) => ({ p, card: byId(id) })), leader: S0.ld, turn: S0.tu, broken: !!S0.br, trickNo: S0.tn, seen: (S0.seen || []).map(byId), qsFrom: S0.qs, passSel: [] };
          H.players.forEach((p, i) => { p.hand.forEach(c => { c.up = i === 0; }); p.taken.forEach(c => { c.gone = i + 1; c.up = true; }); });
          H.trick.forEach(t => { t.card.up = true; });
          relayout(true);
          if (H.phase === 'pass' || H.phase === 'deal') startPass(); else if (H.phase === 'hold') startPass(); else if (H.phase === 'passing') startPlay(); else if (H.phase === 'trick') endTrick(); else if (H.phase === 'handend') endHand(); else nextTurn();
          push(); return;
        }
        tableScreen();
      } else {
        s.on('m', d => { if (NET && NET.s === s && d && d.k === 'v') applyView(d.v); });
        s.on('state', st => { if (NET && NET.s === s && st && st.v) applyView(st.v); });
        s.on('gone', id => { if (id === s.hostId) s.end(''); });
        s.on('left', id => { if (id === s.hostId) { s.end(''); } });
        s.on('end', () => {});
        s.save();
        H = null; tableScreen();
        if (s.resumed) s.need();
      }
    }
    if (window.MP) MP.hook('games.hearts', G.w, { session: s => onlineSession(s) });
    function stats() {
      const st = G.store.get('stats', { played: 0, won: 0, moons: 0 });
      G.dialog('Hearts Statistics', `<table class="jgc-stats"><tr><td>Games played:</td><td><b>${st.played}</b></td></tr><tr><td>Games won:</td><td><b>${st.won}</b> (${st.played ? Math.round(st.won / st.played * 100) : 0}%)</td></tr><tr><td>Moons shot:</td><td><b>${st.moons || 0}</b></td></tr><tr><td>Best winning score:</td><td><b>${st.best || '-'}</b></td></tr></table>`,
        [['OK'], ['Reset', () => { G.store.set('stats', { played: 0, won: 0, moons: 0 }); }]], { w: 280 });
    }
    G.helpKey = () => help();
    function help() {
      G.help([
        ['How to play', 'Hearts is a trick-taking game for four. You play against Dave, ' + KIM + ' and Gubbinz.\n\nThe aim is to score as FEW points as possible. Every heart you win is 1 point, and the Queen of Spades is 13. When anyone reaches 100 points the game ends, and the lowest score wins.'],
        ['Passing', 'Before each hand you pick three cards to pass: left, then right, then across, then a hand with no passing. Then it starts again.\n\nTap or click three cards so they stick up, then press the Pass button.'],
        ['Playing a trick', '- Whoever has the 2 of clubs leads it.\n- You must follow suit if you can.\n- If you can\'t, play anything (but no points on the very first trick).\n- Highest card of the suit that was led wins the trick.\n- You can\'t lead hearts until someone has thrown one away ("hearts are broken").'],
        ['Shooting the moon', 'If you win ALL the hearts AND the Queen of Spades in one hand, you score nothing and everyone else gets 26. It\'s risky. It\'s brilliant. Gran did it twice by accident.'],
        ['Controls', '- Click a card to play it, or drag it into the middle.\n- Left and Right arrows pick a card, Enter plays it.\n- F2 starts a new game.'],
      ]);
    }
    G.menu([
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: G.newGame },
        ...(window.MP ? [{ label: 'Play with someone... (online)', act: () => MP.pick('cards.hearts') }] : []), '-',
        { label: 'Score...', dis: !H || !H.players[0].hist.length, act: () => scoreDialog('', false) },
        { label: 'Statistics...', act: stats }, '-',
        { label: 'Exit', act: () => G.w.close() },
      ]],
      ['Options', () => [
        { label: 'Shoot the Moon (others get 26)', chk: opts.moon, act: () => { opts.moon = !opts.moon; saveOpts(); } },
        { label: 'Show Legal Cards', chk: opts.legal, act: () => { opts.legal = !opts.legal; saveOpts(); dirty = true; } },
        { label: 'Quick Play', chk: opts.fast, act: () => { opts.fast = !opts.fast; saveOpts(); } }, '-',
        { label: 'Card Back...', act: () => backPicker(opts.back, b => { opts.back = b; saveOpts(); dirty = true; }) },
      ]],
      ['Help', () => [
        { label: 'Help Topics', key: 'F1', act: help },
        { label: 'Who Are These People?', act: () => G.msg('The Players', 'DAVE (left): in Jack\'s class. Says he is a pro. Is not a pro.\n\n' + KIM.toUpperCase() + ' (across): two years older, plays cards like a shark, is going to Tasha\'s at four.\n\nGUBBINZ (right): the little green desktop helper. Has been told not to eat the cards. Has eaten some of the cards.', 'info') }, '-',
        { label: 'About Hearts', act: () => G.about({ ver: 'Version 2.1 (Kitchen Table Edition)', blurb: 'The classic card game where hearts are bad and the Queen of Spades is worse.', credits: [['Game design', 'Jack'], ['Card art', 'Jack (in Paint, at 400% zoom)'], ['Robot Jacks', 'Jack, from a BLOCKO kit'], ['Space Queens', KIM + '\'s idea'], ['Pod-Pilot Kings', 'Jack, obviously'], ['Dave\'s voice acting', 'Dave (he insisted)'], ['Card back "Peapod Race"', 'Drawn the day after the film'], ['Rules checking', 'Gran'], ['Snacks', 'Mom'], ['Cards eaten during testing', 'Gubbinz (four)']] }) },
      ]],
    ]);
    G.dbg = () => ({ phase: H && H.phase, turn: H && H.turn, trickNo: H && H.trickNo, hand: H && H.players[0].hand.map(cardName), scores: H && H.players.map(p => p.score), legal: H && H.phase === 'play' && H.turn === 0 ? legal(0).map(cardName) : [] });
    G.act = i => act(i);
    // the game in progress is saved (js/gamesave.js), right in the middle of a hand: every hand, the trick on the table,
    // the passing and the scores. Online tables aren't saved (they're live).
    let scored = -1; // the hand number whose points have been added up (the score sheet is showing)
    const saver = G.saver(() => {
      if (NET) return undefined;
      if (!H || H.players.some(p => p.score >= 100)) return null;
      return { hn: H.handNo, ph: H.phase, tr: H.trick.map(t => [t.p, t.card.id]), ld: H.leader, tu: H.turn, br: H.broken ? 1 : 0, tn: H.trickNo, qs: H.qsFrom, seen: H.seen.map(c => c.id), pl: H.players.map(p => ({ h: p.hand.map(c => c.id), tk: p.taken.map(c => c.id), sc: p.score, hp: p.hp, hi: p.hist })), done: H.phase === 'handend' && scored === H.handNo ? 1 : 0 };
    }, { v: 1, live: true, every: 4000 });
    function resumeH() {
      const S0 = saver.load(); if (!S0 || !Array.isArray(S0.pl) || S0.pl.length !== 4 || !Array.isArray(S0.tr) || !S0.pl.every(p => p && Array.isArray(p.h) && Array.isArray(p.tk))) return false;
      const ids = [].concat(...S0.pl.map(p => p.h.concat(p.tk)), S0.tr.map(t => t && t[1]));
      if (ids.length !== 52 || new Set(ids.filter(byId)).size !== 52) return false;
      if (!['deal', 'pass', 'hold', 'passing', 'play', 'trick', 'handend'].includes(S0.ph)) return false;
      gen++; deck.forEach(c => { c.gone = false; c.raised = false; c.recv = false; c.fl = 0; c.delay = 0; });
      H = { players: S0.pl.map((p, i) => ({ name: NAMES[i], hand: p.h.map(byId), taken: p.tk.map(byId), score: +p.sc || 0, hp: +p.hp || 0, hist: Array.isArray(p.hi) ? p.hi : [] })), handNo: S0.hn | 0, phase: S0.ph, trick: S0.tr.map(([p, id]) => ({ p, card: byId(id) })), leader: S0.ld | 0, turn: S0.tu | 0, broken: !!S0.br, trickNo: S0.tn | 0, seen: (S0.seen || []).map(byId).filter(Boolean), qsFrom: S0.qs == null ? -1 : S0.qs, passSel: [] };
      H.players.forEach((p, i) => { p.hand.forEach(c => { c.up = i === 0; }); p.taken.forEach(c => { c.gone = i + 1; c.up = true; }); });
      H.trick.forEach((t, k) => { t.card.up = true; t.card.z = 101 + k; });
      relayout(true);
      if (S0.done) { scored = H.handNo; scoreDialog('', false); }
      else if (H.phase === 'pass' || H.phase === 'deal' || H.phase === 'hold') startPass();
      else if (H.phase === 'passing') startPlay();
      else if (H.phase === 'trick') endTrick();
      else if (H.phase === 'handend') endHand();
      else nextTurn();
      return true;
    }
    if (!resumeH()) newGame();
  });

  // ======================================================================================== SPIDER
  JG.mod('spider', (G, arg) => {
    G.fit();
    const host = G.host;
    let opts = Object.assign({ suits: 1, back: 0 }, G.store.get('opts', {}));
    const saveOpts = () => G.store.set('opts', opts);
    const scores = G.scores({ title: 'Spider Solitaire High Scores', max: 2000, seed: [['JACK', 1120], ['DAD', 980], ['DAVE', 610]] });
    const C = G.canvas(host, () => { layout(true); });
    const cv = C.cv, ctx = C.c; G.focusEl = cv;
    let S = null, cards = [], dirty = true, sel = null, drag = null, hint = null, hintIx = 0, fireworks = null, lastTap = null;
    function deal(seed) {
      seed = seed || ((Math.random() * 1e9) | 0);
      const rnd = JG.rng(seed);
      const suitsFor = opts.suits === 1 ? [3] : opts.suits === 2 ? [3, 2] : [3, 2, 1, 0];
      cards = []; let id = 0;
      for (let k = 0; k < 8; k++) for (let r = 1; r <= 13; r++) cards.push({ id: id++, s: suitsFor[k % suitsFor.length], r, up: false, x: 0, y: 0, tx: 0, ty: 0, fl: 0 });
      JG.shuffle(cards, rnd);
      S = { seed, suits: opts.suits, cols: Array.from({ length: 10 }, () => []), stock: [], found: [], score: 500, moves: 0, undo: [], won: false, counted: false };
      if (saver && !racing()) saver.clear(); // a new deal: the old saved game goes
      let k = 0;
      for (let row = 0; row < 6; row++) for (let c = 0; c < 10; c++) { if (row === 5 && c >= 4) continue; S.cols[c].push(cards[k++]); }
      S.stock = cards.slice(k);
      S.cols.forEach(col => { col[col.length - 1].up = true; });
      const st = stats(); st[opts.suits].played++; saveStats(st); S.counted = true;
      sel = null; hint = null; fireworks = null;
      layout(true);
      // fly everything out of the stock
      const sp = stockPos();
      let n = 0;
      S.cols.forEach(col => col.forEach(c => { c.x = sp.x; c.y = sp.y; c.delay = (n++) * 0.012; }));
      G.sfx('dice'); status();
    }
    const stats = () => Object.assign({ 1: { played: 0, won: 0, best: 0 }, 2: { played: 0, won: 0, best: 0 }, 4: { played: 0, won: 0, best: 0 } }, G.store.get('stats', {}));
    const saveStats = s => G.store.set('stats', s);
    function status() { if (S && race && race.active && !S.won) race.progress(S.found.length / 8, `${S.found.length}/8 runs`); if (S) G.status(C.W < 520 ? `Score ${S.score} \u00b7 Moves ${S.moves} \u00b7 Deals ${S.stock.length / 10}` : `Score: ${S.score}    Moves: ${S.moves}    Deals left: ${S.stock.length / 10}    ${['', 'One suit', 'Two suits', '', 'Four suits'][S.suits]}`); }

    // ---------------------------------------------------------------- geometry
    function geo() {
      const W = C.W, Hh = C.H, m = W < 520 ? 3 : 8, gap = W < 520 ? 2.5 : 7;
      const cw = Math.min(76, (W - m * 2 - gap * 9) / 10), ch = cw * 1.4;
      return { W, Hh, m, gap, cw, ch, compact: cw < 48, bottom: Hh - ch - m };
    }
    function colX(i) { const g = geo(); return g.m + i * (g.cw + g.gap); }
    function stockPos() { const g = geo(); const n = Math.max(1, S.stock.length / 10); return { x: g.W - g.m - g.cw - (n - 1) * Math.min(12, g.cw * 0.18), y: g.bottom }; }
    function offsets(col, g) {
      const avail = g.bottom - g.m - 8 - g.ch, down = col.filter(c => !c.up).length, up = col.length - down;
      let dd = g.ch * 0.11, du = g.ch * (g.compact ? 0.3 : 0.26);
      const need = down * dd + Math.max(0, up - 1) * du;
      if (need > avail && need > 0) { const f = avail / need; dd = Math.max(2, dd * f); du = Math.max(g.ch * 0.13, du * f); }
      return { dd, du };
    }
    function layout(snap) {
      if (!S) return;
      const g = geo();
      S.cols.forEach((col, i) => {
        const { dd, du } = offsets(col, g); let y = g.m;
        col.forEach((c, k) => { c.tx = colX(i); c.ty = y; y += c.up ? du : dd; c.z = k; });
      });
      S.stock.forEach((c, k) => { const grp = Math.floor(k / 10), n = S.stock.length / 10; c.tx = g.W - g.m - g.cw - (n - 1 - grp) * Math.min(12, g.cw * 0.18); c.ty = g.bottom; c.z = k; c.up = false; });
      S.found.forEach((run, k) => run.forEach((c, j) => { c.tx = g.m + k * Math.min(16, g.cw * 0.28); c.ty = g.bottom; c.z = 200 + k * 13 + j; }));
      if (snap) cards.forEach(c => { c.x = c.tx; c.y = c.ty; c.delay = 0; });
      dirty = true;
    }

    // ---------------------------------------------------------------- rules
    const runFrom = (col, k) => { if (k < 0 || k >= col.length || !col[k].up) return false; for (let i = k + 1; i < col.length; i++) if (!col[i].up || col[i].s !== col[i - 1].s || col[i].r !== col[i - 1].r - 1) return false; return true; };
    const canDrop = (top, dest) => !dest.length || dest[dest.length - 1].r === top.r + 1;
    function snapshot() { return { cols: S.cols.map(c => c.map(k => [k.id, k.up])), stock: S.stock.map(k => k.id), found: S.found.map(r => r.map(k => k.id)), score: S.score, moves: S.moves }; }
    function restore(sn) {
      const byId = new Map(cards.map(c => [c.id, c]));
      S.cols = sn.cols.map(col => col.map(([id, up]) => { const c = byId.get(id); c.up = up; return c; }));
      S.stock = sn.stock.map(id => byId.get(id)); S.found = sn.found.map(r => r.map(id => byId.get(id)));
      S.score = sn.score; S.moves = sn.moves;
    }
    function move(from, k, to) {
      const src = S.cols[from], dst = S.cols[to];
      if (from === to || !runFrom(src, k) || !canDrop(src[k], dst)) return false;
      S.undo.push(snapshot()); if (S.undo.length > 300) S.undo.shift();
      dst.push(...src.splice(k));
      S.moves++; S.score--;
      flipTop(src);
      G.sfx('turn');
      afterMove(to);
      return true;
    }
    function flipTop(col) { const t = col[col.length - 1]; if (t && !t.up) { t.up = true; t.fl = 0.22; } }
    function afterMove(ci) {
      sel = null; hint = null;
      const col = S.cols[ci];
      if (col.length >= 13) {
        const k = col.length - 13;
        if (col[k].r === 13 && runFrom(col, k) && col[col.length - 1].r === 1) {
          const run = col.splice(k);
          S.found.push(run); S.score += 100;
          run.forEach((c, j) => { c.delay = (12 - j) * 0.04; });
          flipTop(col);
          G.sfx('join');
          if (S.found.length === 8) win();
        }
      }
      if (saver) saver.save();
      layout(); status();
    }
    function dealRow() {
      if (!S || S.won) return;
      if (!S.stock.length) { G.sfx('beep'); return; }
      if (S.cols.some(c => !c.length)) { G.msg('Spider', 'You are not allowed to deal a new row while there are any empty columns.', 'warn'); return; }
      S.undo.push(snapshot());
      const sp = stockPos();
      for (let i = 0; i < 10; i++) { const c = S.stock.pop(); c.up = true; c.fl = 0.22; c.x = sp.x; c.y = sp.y; c.delay = i * 0.05; S.cols[i].push(c); }
      S.moves++; S.score--;
      sel = null; hint = null; G.sfx('dice');
      layout();
      for (let i = 0; i < 10; i++) afterMove(i);
      status();
    }
    function undo() {
      if (!S || !S.undo.length || S.won) return;
      restore(S.undo.pop()); S.score--; S.moves++;
      if (saver) saver.save();
      sel = null; hint = null; layout(); status(); G.sfx('click');
    }
    function hints() {
      const out = [];
      S.cols.forEach((src, from) => {
        for (let k = 0; k < src.length; k++) {
          if (!runFrom(src, k)) continue;
          const top = src[k], below = src[k - 1];
          S.cols.forEach((dst, to) => {
            if (to === from || !dst.length || !canDrop(top, dst)) return;
            const dt = dst[dst.length - 1];
            if (below && below.up && below.r === top.r + 1 && below.s === top.s) return; // pointless
            let sc = dt.s === top.s ? 10 : 2;
            if (below && !below.up) sc += 6; else if (!below) sc += 4;
            if (below && below.up && below.r === top.r + 1 && dt.s !== top.s) sc -= 3;
            out.push({ from, k, to, sc: sc + (src.length - k) * 0.1 });
          });
          break; // only the longest run from each column
        }
      });
      return out.sort((a, b) => b.sc - a.sc);
    }
    function showHint() {
      if (!S || S.won) return;
      const hs = hints();
      if (!hs.length) { G.msg('Spider', S.stock.length ? 'There are no more moves. Deal a new row from the stock (bottom right).' : 'There are no more moves left. Spider wins this time.', 'info'); return; }
      hint = Object.assign({ t: 1.6 }, hs[hintIx++ % hs.length]); dirty = true; G.sfx('click');
    }
    function win() {
      S.won = true;
      if (saver && !racing()) saver.clear();
      const st = stats(), s = st[S.suits]; s.won++; s.best = Math.max(s.best || 0, S.score); saveStats(st);
      G.secret('games.spider.win'); if (S.suits === 4) G.secret('games.spider.four');
      G.sfx('solve');
      fireworks = { t: 0, parts: [], next: 0 };
      const sc = S.score;
      if (race && race.active) { race.progress(1, '8/8 runs'); race.done({ ok: true, score: sc }); G.timeout(() => { fireworks = null; dirty = true; }, 4000); return; }
      G.timeout(() => {
        fireworks = null; dirty = true;
        G.msg('Spider', `Congratulations, you won!\n\nScore: ${sc}\nMoves: ${S.moves}`, 'info', [['OK', () => scores.submit(sc)]]);
      }, 5000);
    }
    function smartMove(from, k) { // double-click: the best place for this run
      const top = S.cols[from][k];
      const opts2 = S.cols.map((d, to) => ({ to, d })).filter(o => o.to !== from && canDrop(top, o.d));
      if (!opts2.length) { G.sfx('beep'); return false; }
      opts2.sort((a, b) => score2(b) - score2(a));
      function score2(o) { if (!o.d.length) return 1; return (o.d[o.d.length - 1].s === top.s ? 10 : 5); }
      return move(from, k, opts2[0].to);
    }

    // ---------------------------------------------------------------- drawing
    function draw() {
      const g = geo(), dpr = C.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(feltSp(g.W, g.Hh, dpr), 0, 0, g.W, g.Hh);
      if (!S) return;
      for (let i = 0; i < 10; i++) { const x = colX(i); ctx.strokeStyle = 'rgba(0,40,0,.6)'; ctx.lineWidth = 1.2; rrect(ctx, x + 0.5, g.m + 0.5, g.cw - 1, g.ch - 1, g.cw * 0.07); ctx.stroke(); }
      if (!S.found.length) { ctx.strokeStyle = 'rgba(0,40,0,.5)'; rrect(ctx, g.m + 0.5, g.bottom + 0.5, g.cw - 1, g.ch - 1, g.cw * 0.07); ctx.stroke(); }
      const dragSet = drag && drag.live ? new Set(S.cols[drag.from].slice(drag.k)) : null;
      const selSet = sel ? new Set(S.cols[sel.from].slice(sel.k)) : null;
      const hintSet = hint ? new Set([...S.cols[hint.from].slice(hint.k), S.cols[hint.to][S.cols[hint.to].length - 1]]) : null;
      const order = cards.slice().sort((a, b) => ((a.delay > 0 || Math.abs(a.x - a.tx) > 1 || Math.abs(a.y - a.ty) > 1) - (b.delay > 0 || Math.abs(b.x - b.tx) > 1 || Math.abs(b.y - b.ty) > 1)) || a.z - b.z);
      for (const c of order) {
        if (dragSet && dragSet.has(c)) continue;
        if (c.delay > 0 && S.stock.indexOf(c) < 0 && !S.found.some(r => r.includes(c))) { /* waiting in the stock */ const sp = stockPos(); const sx = c.x, sy = c.y; c.x = sp.x; c.y = sp.y; const u = c.up; c.up = false; blit(ctx, c, g.cw, g.ch, dpr, opts.back, g.compact); c.up = u; c.x = sx; c.y = sy; continue; }
        blit(ctx, c, g.cw, g.ch, dpr, opts.back, g.compact, { sel: selSet && selSet.has(c) ? '#ffd400' : hintSet && hintSet.has(c) && Math.sin(performance.now() / 90) > -0.3 ? '#00e5ff' : null });
      }
      if (dragSet) {
        const col = S.cols[drag.from];
        col.slice(drag.k).forEach((c, j) => { const sx = c.x, sy = c.y; c.x = drag.x - drag.gx; c.y = drag.y - drag.gy + (c.ty - col[drag.k].ty); blit(ctx, c, g.cw, g.ch, dpr, opts.back, g.compact, { shadow: j === 0 }); c.x = sx; c.y = sy; });
      }
      if (S.stock.length) { ctx.fillStyle = '#fff'; ctx.font = '11px Tahoma, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(`${S.stock.length / 10} deal${S.stock.length > 10 ? 's' : ''}`, g.W - g.m, g.bottom - 3); }
      if (fireworks) drawFireworks();
    }
    function drawFireworks() {
      const g = geo();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of fireworks.parts) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.strokeStyle = p.col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.font = `bold ${Math.min(42, g.W / 12)}px Tahoma, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000'; ctx.fillText('YOU WIN!', g.W / 2 + 2, g.Hh * 0.4 + 2); ctx.fillStyle = '#ffd400'; ctx.fillText('YOU WIN!', g.W / 2, g.Hh * 0.4);
    }
    function stepFireworks(dt) {
      const g = geo(); fireworks.t += dt; fireworks.next -= dt;
      if (fireworks.next <= 0 && fireworks.t < 4.2) {
        fireworks.next = 0.3 + Math.random() * 0.3;
        const x = g.W * (0.15 + Math.random() * 0.7), y = g.Hh * (0.12 + Math.random() * 0.4), col = ['#ffd400', '#ff4040', '#40c0ff', '#7cff3a', '#ff40ff', '#fff'][(Math.random() * 6) | 0];
        for (let i = 0; i < 70; i++) { const a = Math.random() * TAU, v = 70 + Math.random() * 170; fireworks.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1 + Math.random() * 0.4, col }); }
        G.note(300 + Math.random() * 500, 0.12, 'triangle');
      }
      for (const p of fireworks.parts) { p.vy += 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 0.8; }
      fireworks.parts = fireworks.parts.filter(p => p.life > 0);
    }

    // ---------------------------------------------------------------- input
    function hit(x, y) {
      const g = geo();
      for (let i = 0; i < 10; i++) {
        const cx = colX(i); if (x < cx || x >= cx + g.cw) continue;
        const col = S.cols[i];
        for (let k = col.length - 1; k >= 0; k--) { const c = col[k]; if (y >= c.ty && y < c.ty + g.ch) return { col: i, k }; }
        return { col: i, k: -1 };
      }
      const sp = stockPos(); if (S.stock.length && x >= sp.x && y >= g.bottom && y < g.bottom + g.ch) return { stock: true };
      return null;
    }
    function dropTarget(x) { // the column under the dragged run's middle
      const g = geo(); let best = -1, bd = 1e9;
      for (let i = 0; i < 10; i++) { const d = Math.abs(colX(i) + g.cw / 2 - x); if (d < bd) { bd = d; best = i; } }
      return bd < g.cw ? best : -1;
    }
    G.on(cv, 'pointerdown', ev => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      ev.preventDefault(); G.focus();
      if (!S) return;
      if (fireworks) { fireworks.t = 99; return; }
      if (S.won) return;
      const r = DesktopSurface.rect(cv), point = DesktopSurface.point(ev.clientX, ev.clientY), x = point.x - r.left, y = point.y - r.top, h = hit(x, y);
      if (!h) { sel = null; dirty = true; return; }
      if (h.stock) { dealRow(); return; }
      const col = S.cols[h.col];
      if (h.k >= 0 && runFrom(col, h.k)) {
        drag = { from: h.col, k: h.k, x, y, sx: x, sy: y, gx: x - col[h.k].x, gy: y - col[h.k].y, live: false, id: ev.pointerId, touch: ev.pointerType !== 'mouse' };
        try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
      } else drag = { from: h.col, k: -1, x, y, sx: x, sy: y, id: ev.pointerId, live: false, dead: true };
    });
    G.on(cv, 'pointermove', ev => {
      if (!drag || ev.pointerId !== drag.id || drag.dead) return;
      const r = DesktopSurface.rect(cv), point = DesktopSurface.point(ev.clientX, ev.clientY); drag.x = point.x - r.left; drag.y = point.y - r.top;
      if (!drag.live && Math.hypot(drag.x - drag.sx, drag.y - drag.sy) > (drag.touch ? 9 : 4)) { drag.live = true; sel = null; }
      if (drag.live) dirty = true;
    });
    const up = (ev, cancel) => {
      if (!drag || ev.pointerId !== drag.id) return;
      const d = drag; drag = null; dirty = true;
      if (cancel) return;
      if (d.live) {
        const g = geo(), to = dropTarget(d.x - d.gx + g.cw / 2);
        if (to < 0 || !move(d.from, d.k, to)) { if (to >= 0 && to !== d.from) G.sfx('beep'); layout(); }
        return;
      }
      // a tap: second tap on the same run = smart move; a tap on another column moves the selection there
      const t = performance.now();
      if (sel) {
        const from = sel.from, k = sel.k; sel = null;
        if (d.from !== from) { if (!move(from, k, d.from)) G.sfx('beep'); return; }
        if (lastTap && t - lastTap.t < 450) { smartMove(from, k); lastTap = null; return; }
        lastTap = { t, col: from }; return;
      }
      if (d.k >= 0) { sel = { from: d.from, k: d.k }; lastTap = { t, col: d.from }; }
    };
    G.on(cv, 'pointerup', ev => up(ev, false)); G.on(cv, 'pointercancel', ev => up(ev, true));
    G.on(cv, 'dblclick', ev => ev.preventDefault());
    G.keys = {
      down(ev) {
        if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'z' || ev.key === 'Z')) { undo(); return true; }
        if (ev.key === 'h' || ev.key === 'H') { showHint(); return true; }
        if (ev.key === 'd' || ev.key === 'D') { dealRow(); return true; }
        if (ev.key === 'Escape') { sel = null; dirty = true; return true; }
        return false;
      },
    };
    G.loop(dt => {
      let busy = false;
      for (const c of cards) if (tween(c, dt, 1.6)) busy = true;
      if (hint) { hint.t -= dt; busy = true; if (hint.t <= 0) hint = null; }
      if (fireworks) { stepFireworks(dt); busy = true; }
      if (busy || dirty || (drag && drag.live)) { draw(); dirty = false; }
    });

    // ---------------------------------------------------------------- menus
    function newGame(seed) { deal(seed); }
    // online races (mp.js): the same deal (and number of suits) for everybody; the first to clear the table wins
    const race = window.MP ? MP.hook('games.spider', G.w, { start(seed, o, R, preview) { opts.suits = [1, 2, 4].includes(o && o.suits) ? o.suits : 1; deal((seed % 999999999) + 1); if (preview) S.won = true; status(); } }) : null;
    const noRace = () => { if (race && race.active) { Desk.toast('Spider Solitaire', "You're in a race! Finish it (or give up) first.", 2500); return false; } return true; };
    // the game in progress is saved (js/gamesave.js): all 104 cards, face up or down, the stock, the finished runs, score,
    // moves and the last 20 undos. Not an online race (that's live).
    const racing = () => !!(race && race.active);
    const pack = sn => ({ c: sn.cols.map(col => col.map(([id, up]) => id * 2 + (up ? 1 : 0))), s: sn.stock, f: sn.found, sc: sn.score, m: sn.moves });
    const unpack = p => ({ cols: p.c.map(col => col.map(v => [v >> 1, !!(v & 1)])), stock: p.s, found: p.f, score: +p.sc || 0, moves: +p.m || 0 });
    const okPack = p => p && Array.isArray(p.c) && p.c.length === 10 && p.c.every(Array.isArray) && Array.isArray(p.s) && Array.isArray(p.f) && p.f.every(Array.isArray) && (() => { const all = [].concat(...p.c.map(col => col.map(v => v >> 1)), p.s, ...p.f); return all.length === 104 && new Set(all.filter(i => i >= 0 && i < 104)).size === 104; })();
    const saver = G.saver(() => racing() ? undefined : (!S || S.won || !S.moves) ? null : { seed: S.seed, suits: S.suits, sn: pack(snapshot()), undo: S.undo.slice(-20).map(pack) }, { v: 1, live: true });
    function resume() {
      const v = saver.load(); if (!v || ![1, 2, 4].includes(v.suits) || !okPack(v.sn)) return false;
      const suitsFor = v.suits === 1 ? [3] : v.suits === 2 ? [3, 2] : [3, 2, 1, 0];
      cards = []; let id = 0;
      for (let k = 0; k < 8; k++) for (let r = 1; r <= 13; r++) cards.push({ id: id++, s: suitsFor[k % suitsFor.length], r, up: false, x: 0, y: 0, tx: 0, ty: 0, fl: 0 });
      opts.suits = v.suits; saveOpts();
      S = { seed: v.seed, suits: v.suits, cols: Array.from({ length: 10 }, () => []), stock: [], found: [], score: 500, moves: 0, undo: (Array.isArray(v.undo) ? v.undo : []).filter(okPack).map(unpack), won: false, counted: true };
      restore(unpack(v.sn));
      S.found.forEach(run => run.forEach(c => { c.up = true; }));
      sel = null; hint = null; fireworks = null;
      layout(true); status();
      return true;
    }
    G.newGame = () => { if (noRace()) newGame(); };
    function setSuits(n) {
      if (n === opts.suits) return;
      if (!noRace()) return;
      const go = () => { opts.suits = n; saveOpts(); newGame(); };
      if (S && S.moves && !S.won) G.msg('Difficulty', `Start a new ${n === 1 ? 'one-suit (easy)' : n === 2 ? 'two-suit (medium)' : 'four-suit (difficult)'} game? This game will count as a loss.`, 'q', [['Yes', go], ['No']]); else go();
    }
    function statsDlg() {
      const st = stats();
      G.dialog('Statistics', `<table class="jgc-stats"><tr><th>Level</th><th>Played</th><th>Won</th><th>Best score</th></tr>${[1, 2, 4].map(n => `<tr><td>${n === 1 ? 'Easy (1 suit)' : n === 2 ? 'Medium (2 suits)' : 'Difficult (4 suits)'}</td><td>${st[n].played}</td><td>${st[n].won} (${st[n].played ? Math.round(st[n].won / st[n].played * 100) : 0}%)</td><td>${st[n].best || '-'}</td></tr>`).join('')}</table>`,
        [['OK'], ['Reset', () => saveStats({})]], { w: 380 });
    }
    G.helpKey = () => help();
    function help() {
      G.help([
        ['How to play', 'Spider uses two packs of cards (104 cards). The aim is to clear the table by building runs from King down to Ace in the same suit. A finished run flies off to the bottom left by itself.\n\nYou start with 500 points. Every move or deal costs 1 point. Every finished run is worth 100.'],
        ['Moving cards', '- Put a card on any card one higher (a 6 on a 7), whatever the suit.\n- You can only move a group of cards together if they are all the same suit and in order.\n- Any card or run can go into an empty column.\n\nDrag cards with the mouse. Or click a card to pick it up and click the column it should go to. Double-click to send it to the best place.'],
        ['Dealing', 'Click the stock in the bottom right to deal one more card onto every column. You can\'t deal while a column is empty.'],
        ['Difficulty', '- Easy: one suit (all spades)\n- Medium: two suits\n- Difficult: all four suits\n\nDad says Difficult is "for people with a lot of free time". He has played it 212 times.'],
        ['Keys', '- H: show a possible move\n- D: deal a row\n- Ctrl+Z: undo\n- F2: new game'],
      ]);
    }
    G.menu([
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: G.newGame },
        { label: 'Restart This Game', dis: !S, act: () => { if (!noRace()) return; const s = S.seed; S.counted = false; newGame(s); } },
        ...(window.MP ? [MP.menuItem('race.spider', { suits: opts.suits })] : []), '-',
        { label: 'Undo', key: 'Ctrl+Z', dis: !S || !S.undo.length || S.won, act: undo },
        { label: 'Deal Next Row', key: 'D', dis: !S || !S.stock.length || S.won, act: dealRow },
        { label: 'Show an Available Move', key: 'H', dis: !S || S.won, act: showHint }, '-',
        { label: 'Statistics...', act: statsDlg },
        { label: 'High Scores...', act: () => scores.show() }, '-',
        { label: 'Exit', act: () => G.w.close() },
      ]],
      ['Options', () => [
        ...[[1, 'Easy: One Suit'], [2, 'Medium: Two Suits'], [4, 'Difficult: Four Suits']].map(([n, l]) => ({ label: l, rad: opts.suits === n, act: () => setSuits(n) })), '-',
        { label: 'Card Back...', act: () => backPicker(opts.back, b => { opts.back = b; saveOpts(); dirty = true; }) },
      ]],
      ['Help', () => [
        { label: 'Help Topics', key: 'F1', act: help }, '-',
        { label: 'About Spider Solitaire', act: () => G.about({ ver: 'Version 1.0 (8 legs edition)', blurb: 'Two packs, ten columns, eight runs, one very patient Dad.', credits: [['Programming', 'Jack'], ['Card art', 'Jack'], ['Spider consultant', 'The one in the bath'], ['Fireworks', 'Jack + bonfire night memories'], ['Difficulty testing', 'Dad (212 games)'], ['Four-suit testing', 'Nobody. Nobody wins four suits.'], ['Moral support', 'Mom'], ['Did not help', 'Gubbinz']] }) },
      ]],
    ]);
    G.dbg = () => ({ score: S.score, moves: S.moves, stock: S.stock.length, found: S.found.length, cols: S.cols.map(c => c.length), won: S.won });
    G.test = { move, dealRow, hints, undo, S: () => S, cheatWin: () => { // test helper: finish the game instantly
      S.cols.forEach(c => c.splice(0)); S.stock = []; S.found = []; cards.forEach(c => { c.up = true; }); for (let k = 0; k < 8; k++) S.found.push(cards.slice(k * 13, k * 13 + 13)); win(); layout(); } };
    if (!resume()) newGame();
  });
})();

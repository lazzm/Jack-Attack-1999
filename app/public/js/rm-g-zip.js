/* ZIP THE BADGER (Mega Glide, in Jack's room): a speed platformer in six zones (Blackberry Bay, Sprocket Works,
 * Candy Carnival, Redwood Relay, Drizzle Ruins, Kettle Citadel), two acts each and a boss: Dr. Sprocket and his machines. Momentum on the slopes, rings to grab (and
 * lose), springs (up, sideways and diagonal), bumpers, loop-the-loops and corkscrews, boost pads, item monitors, star
 * posts, crushers and conveyor belts, wind-up badniks with an animal inside each, a giant ring to a bonus stage at the end
 * of an act if you hold 50 rings, and six Time Stones to find. Zip is a purple badger with flying goggles, a yellow scarf
 * and teal trainers. Run: arrows. Jump: Z / X / C. Roll: Down while running. Spin dash: hold Down, press jump, let go.
 * Every sprite is drawn here as vector shapes at four times the size and then boiled down to Mega Glide pixels (a 9-level
 * per channel palette, dark selective outlines). Original characters, levels and music. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const GID = 'md.zip', W = 320, H = 224;
  const SECRETS = [
    ['rm.zip.boss', 'Spanner in the Works', 'Beat Dr. Sprocket\'s last machine in Zip the Badger.'],
    ['rm.zip.gems', 'Time Lord', 'Collect all six Time Stones in Zip the Badger.'],
    ['rm.zip.select', 'Level Select', 'An old cheat code still works on the Zip the Badger title screen.'],
  ];
  try { if (window.Apps && Apps.defineSecret) for (const [id, n, h] of SECRETS) if (!(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, h); } catch (e) {}
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const castN = (id, fb) => { try { return (window.Cast && Cast.n(id)) || fb; } catch (e) { return fb; } };

  // ================================================================ the pixel-art machine
  // Draw with flat palette colours at 4x, then each output pixel takes the commonest colour of its 4x4 block, snapped to
  // the palette. Outlines go round the outside in the darkest shade of whatever they touch (selective outlining).
  const PAL = { // name: [colour, outline]
    k: ['#081028', '#081028'], B: ['#9848d8', '#301048'], b: ['#582878', '#301048'], L: ['#d088f8', '#301048'], P: ['#f0e8d8', '#403848'], p: ['#b8b0c0', '#403848'],
    W: ['#ffffff', '#303848'], w: ['#b8c4d8', '#303848'], R: ['#e83020', '#480808'], r: ['#a01810', '#480808'], Y: ['#f8d820', '#583800'], y: ['#c89010', '#583800'],
    G: ['#80e0ff', '#103050'], g: ['#784018', '#301000'], E: ['#081028', '#081028'], O: ['#f89020', '#582000'], o: ['#b85810', '#401800'], s: ['#606878', '#181820'], S: ['#9098a8', '#181820'],
    N: ['#48b030', '#0c3008'], n: ['#287018', '#0c3008'], V: ['#9040d0', '#200838'], v: ['#602898', '#200838'], M: ['#f048a0', '#480828'], C: ['#40d8c0', '#083830'], D: ['#383848', '#101018'],
  };
  const PKEYS = Object.keys(PAL), PRGB = PKEYS.map(k => { const n = parseInt(PAL[k][0].slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }), ORGB = PKEYS.map(k => { const n = parseInt(PAL[k][1].slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; });
  const C = k => PAL[k][0];
  const near = new Map();
  function palIdx(r, g, b) { const key = (r << 16) | (g << 8) | b; let v = near.get(key); if (v != null) return v; let bd = 1e9; for (let i = 0; i < PRGB.length; i++) { const p = PRGB[i], d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2; if (d < bd) { bd = d; v = i; } } near.set(key, v); return v; }
  function pixel(w, h, draw, o) {
    o = o || {}; const S = 4, big = mk(w * S, h * S), bg = big.getContext('2d'); bg.scale(S, S); draw(bg);
    const src = bg.getImageData(0, 0, w * S, h * S).data, out = mk(w, h), og = out.getContext('2d'), im = og.createImageData(w, h), d = im.data, idx = new Int16Array(w * h).fill(-1);
    const cnt = new Int16Array(PKEYS.length + 1);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      cnt.fill(0); let tr = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) { const i = ((y * S + sy) * w * S + x * S + sx) * 4; if (src[i + 3] < 140) { tr++; continue; } cnt[palIdx(src[i], src[i + 1], src[i + 2])]++; }
      if (tr >= (o.thin ? 7 : 9)) continue;
      let best = 0; for (let k = 1; k < PKEYS.length; k++) if (cnt[k] > cnt[best]) best = k;
      idx[y * w + x] = best; const p = PRGB[best], j = (y * w + x) * 4; d[j] = p[0]; d[j + 1] = p[1]; d[j + 2] = p[2]; d[j + 3] = 255;
    }
    if (o.outline !== false) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x; if (idx[i] >= 0) continue; let nb = -1, lum = 1e9;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const v = idx[yy * w + xx]; if (v < 0) continue; const q = ORGB[v], l = q[0] + q[1] + q[2]; if (l < lum) { lum = l; nb = v; } }
        if (nb >= 0) { const q = ORGB[nb], j = i * 4; d[j] = q[0]; d[j + 1] = q[1]; d[j + 2] = q[2]; d[j + 3] = 255; }
      }
    }
    og.putImageData(im, 0, 0); return out;
  }
  // vector helpers (all coordinates in final pixels; the machine draws them 4x)
  const ell = (g, x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); g.fill(); };
  const poly = (g, pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  const limb = (g, x1, y1, x2, y2, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const rect = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  // a simpler way to get the same look: base, then the dark side, then base again shifted towards the light
  function ball3(g, x, y, rx, ry, base, dark, light, lx, ly, rot) {
    ell(g, x, y, rx, ry, dark, rot); ell(g, x + (lx || 0.9), y + (ly || -0.9), rx * 0.92, ry * 0.92, base, rot);
    if (light) ell(g, x + (lx || 0.9) * 2.6, y + (ly || -0.9) * 2.6, rx * 0.32, ry * 0.26, light, rot);
  }

  // ================================================================ ZIP: a little rig, posed for every frame
  // pose: { lean, bob, head: tilt, eye: 'n'|'up'|'hurt'|'x'|'wink'|'side', arms: [[ax, ay, hx, hy] x2] (shoulder offsets to hands),
  //         legs: [[kx, ky, fx, fy, fa] x2] (knee and foot positions from the hip, foot angle), scarf phase, mouth }
  function drawZip(g, P) {
    const ox = 24, base = 46; // feet on y=46, the middle of the body at x=24
    g.save(); g.translate(ox, base); g.rotate(P.rot || 0); g.translate(-ox, -base);
    const bob = P.bob || 0, lean = P.lean || 0;
    const hip = [ox - 2 + lean * 2, 34 + bob], sh = [ox - 1 + lean * 8, 27 + bob], hd = [ox + 1 + lean * 12, 17 + bob + (P.duck || 0)];
    const legs = P.legs, arms = P.arms;
    // the far leg and arm first (darker)
    const leg = (L, far) => {
      const hx = hip[0] + (far ? 1.5 : -0.5), hy = hip[1], kx = hx + L[0], ky = hy + L[1], fx = hx + L[2], fy = hy + L[3];
      limb(g, hx, hy, kx, ky, 3.6, far ? C('b') : C('B')); limb(g, kx, ky, fx, fy, 3.4, far ? C('b') : C('B'));
      // Zip's own chunky teal high-tops, ivory laces and dark rubber soles.
      const a = L[4] || 0; g.save(); g.translate(fx, fy); g.rotate(a);
      ell(g, 2.0, 0.6, 5.2, 3.1, far ? C('n') : C('C'));
      rect(g, -2.8, -3.0, 4.2, 5.4, far ? C('n') : C('C'));
      limb(g, 0, -1.5, 3.5, -0.8, 1, C('W')); limb(g, 0, 0, 4, 0.7, 1, C('W'));
      rect(g, -3.0, 2.6, 10.2, 1.4, C('W')); rect(g, -3, 4, 10.2, 1, C('k'));
      g.restore();
    };
    const arm = (A, far) => {
      const sx = sh[0] + (far ? 2.2 : -1.8), sy = sh[1] + 1, ex = sx + A[0], ey = sy + A[1], hx = sx + A[2], hy = sy + A[3];
      limb(g, sx, sy, ex, ey, 2.6, far ? C('b') : C('B')); limb(g, ex, ey, hx, hy, 2.6, far ? C('b') : C('B'));
      ball3(g, hx, hy, 2.4, 2.4, far ? C('w') : C('W'), C('w'), null, 0.5, -0.5);
    };
    if (legs) leg(legs[1], true);
    if (arms) arm(arms[1], true);
    // the scarf tail streams out behind
    const sp = P.scarf || 0, sw = P.wind == null ? 1 : P.wind;
    g.fillStyle = C('Y'); g.beginPath(); g.moveTo(sh[0] - 1, sh[1] - 2.5);
    for (let i = 0; i <= 6; i++) { const t = i / 6; g.lineTo(sh[0] - 2 - t * 12 * sw, sh[1] - 3 + t * 2 * (1 - sw) * 4 + Math.sin(sp + t * 5) * 2.2 * t); }
    for (let i = 6; i >= 0; i--) { const t = i / 6; g.lineTo(sh[0] - 2 - t * 12 * sw, sh[1] + 0.5 + t * 2 * (1 - sw) * 4 + Math.sin(sp + t * 5) * 2.2 * t); }
    g.fill();
    // body: a purple bean with an ivory bib
    g.save(); g.translate(sh[0] - 1, sh[1] + 4); g.rotate(lean * 0.6);
    ball3(g, 0, 0, 6.0, 6.6, C('B'), C('b'), null, 0.7, -0.6); ell(g, 1.6, 0.8, 2.7, 4.2, C('P')); ell(g, 2.2, 0.2, 1.4, 2.6, '#f8e0b0');
    g.restore();
    // the head
    g.save(); g.translate(hd[0], hd[1]); g.rotate(P.head || 0);
    // Rounded badger ears and a short three-point punk crest: no swept-back quills.
    ell(g, -6, -8, 4.1, 4.4, C('b')); ell(g, -6, -8, 2.3, 2.5, C('P'));
    ball3(g, 0, 0, 10.5, 9.5, C('B'), C('b'), C('L'), 1, -1);
    poly(g, [-6,-7,-4,-13,-1,-9,2,-14,4,-8,6,-11,8,-5], C('B'));
    // The broad ivory forehead stripe follows the snout; dark cheek-mask frames the eye.
    poly(g, [-1,-9,4,-9,8,-5,10,1,5,7,0,4,2,-2], C('P'));
    ell(g, 4, -1, 6.0, 4.3, C('k'), -0.35);
    // the goggles, pushed up on his forehead
    limb(g, -8, -5, 7, -8.5, 2.2, C('g'));
    ell(g, 0.5, -7.2, 3.1, 2.7, C('s')); ell(g, 0.5, -7.2, 2.2, 1.8, C('G')); ell(g, 6.2, -8.0, 2.9, 2.6, C('s')); ell(g, 6.2, -8.0, 2.0, 1.7, C('G')); rect(g, 6.2, -9.2, 1, 1, C('W')); rect(g, 0.4, -8.4, 1, 1, C('W'));
    // the muzzle and nose
    ell(g, 6.3, 3.6, 6.2, 4.6, C('P')); ell(g, 3.4, 4.6, 3.8, 3.4, C('P'));
    ell(g, 12.0, 1.4, 1.9, 1.5, C('E'));
    // the eye
    const eye = P.eye || 'n';
    if (eye === 'hurt' || eye === 'x') { limb(g, 3.2, -3.6, 7.2, -1.4, 1.2, C('E')); limb(g, 3.2, 0.4, 7.2, -1.4, 1.2, C('E')); if (eye === 'x') { limb(g, 3.5, -3.5, 7, 0.5, 1, C('E')); } }
    else if (eye === 'wink') { limb(g, 3, -1.2, 7.6, -1.6, 1.2, C('E')); }
    else { ell(g, 5.3, -1.8, 3.2, 4.6, C('W')); const px = eye === 'up' ? 6.2 : eye === 'side' ? 3.6 : 6.6, py = eye === 'up' ? -3.6 : -1.0; ell(g, px, py, 1.4, 2.5, C('E')); rect(g, px + 0.2, py - 1.4, 0.9, 0.9, C('W')); ell(g, 5.3, -6.2, 3.2, 0.9, C('b')); }
    // the mouth
    const m = P.mouth || 'smile';
    if (m === 'smile') { g.strokeStyle = C('k'); g.lineWidth = 0.8; g.beginPath(); g.moveTo(6.6, 5.6); g.quadraticCurveTo(9, 7.2, 11.2, 5.0); g.stroke(); }
    else if (m === 'grin') { poly(g, [6.4, 5.2, 11.6, 4.4, 9.6, 7.4], C('W')); }
    else if (m === 'o') { ell(g, 9.2, 6.2, 1.3, 1.6, C('r')); }
    else if (m === 'grit') { rect(g, 7, 5.4, 4.4, 1.6, C('W')); }
    g.restore();
    // the scarf knot over the neck
    ell(g, sh[0] + 0.5, sh[1] - 1.4, 4.4, 1.9, C('Y')); ell(g, sh[0] + 3, sh[1] - 1.1, 1.6, 1.6, C('y'));
    if (arms) arm(arms[0], false);
    if (legs) leg(legs[0], false);
    g.restore();
  }
  // spinning into a ball (any angle: the machine draws it already turned)
  function drawBall(g, a, squash) {
    g.save(); g.translate(24, 35); g.rotate(a); g.scale(1, squash || 1);
    ball3(g, 0, 0, 11, 11, C('B'), C('b'), null, 1, -1);
    for (let i = 0; i < 4; i++) { const q = i / 4 * Math.PI * 2; g.fillStyle = C('b'); g.beginPath(); g.moveTo(Math.cos(q) * 4, Math.sin(q) * 4); g.quadraticCurveTo(Math.cos(q + 0.6) * 10, Math.sin(q + 0.6) * 10, Math.cos(q + 1.2) * 11, Math.sin(q + 1.2) * 11); g.quadraticCurveTo(Math.cos(q + 0.5) * 7, Math.sin(q + 0.5) * 7, Math.cos(q + 0.3) * 3, Math.sin(q + 0.3) * 3); g.fill(); }
    limb(g, -6, -7, 7, 4, 5, C('P')); ell(g, 3, 0, 5, 3, C('k'));
    ell(g, 6, 3, 4.4, 3.4, C('P')); ell(g, 9.6, 1.6, 1.4, 1.2, C('E'));
    ell(g, 3.6, -3.4, 2.2, 2.6, C('W')); ell(g, 4.4, -3.0, 0.9, 1.5, C('E'));
    limb(g, -6, -6, 5, -9, 1.6, C('g')); ell(g, 1.2, -8.4, 1.8, 1.5, C('G'));
    rect(g, -4, 5.4, 6, 3, C('C')); rect(g, -1.5, 5.4, 1.2, 3, C('W'));
    g.restore();
  }
  // the poses
  function legsRun(ph, k) { // a run cycle: k = how big the stride is (0.6 jog .. 1.2 sprint)
    const out = [];
    for (const off of [0, Math.PI]) {
      const p = ph + off, fx = Math.sin(p) * 7 * k, lift = Math.max(0, -Math.cos(p)) * 4.2 * k, fy = 11.6 - lift - Math.max(0, Math.cos(p)) * 0.4;
      const kx = fx * 0.5 + 2.4 + lift * 0.4, ky = 5.6 - lift * 0.35; out.push([kx, ky, fx, fy, -0.15 + Math.cos(p) * 0.2 * k + (lift > 2 ? -0.35 : 0)]);
    }
    return out;
  }
  function armsRun(ph, k) { return [[-Math.sin(ph) * 3 * k + 1, 3.4, -Math.sin(ph) * 6 * k + 3, 4 + Math.cos(ph) * 1.5], [Math.sin(ph) * 3 * k + 1, 3.2, Math.sin(ph) * 6 * k + 3, 4 - Math.cos(ph) * 1.5]]; }
  const STAND_L = [[1.4, 5.8, -1.4, 11.6, 0], [1.8, 5.8, 3.6, 11.6, 0]], STAND_A = [[1.6, 3.6, 2.0, 7.4], [2.4, 3.4, 3.6, 7]];
  function zipFrames() {
    const F = {}, fr = (n, w, h, fn) => (F[n] = F[n] || []).push(pixel(w || 48, h || 48, fn));
    fr('stand', 0, 0, g => drawZip(g, { legs: STAND_L, arms: STAND_A, scarf: 0.5, wind: 0.25 }));
    fr('stand', 0, 0, g => drawZip(g, { legs: STAND_L, arms: STAND_A, scarf: 1.5, wind: 0.25, eye: 'side' }));
    fr('wait', 0, 0, g => drawZip(g, { legs: [[1.4, 5.8, -1.4, 11.6, 0], [2.6, 5.2, 4.6, 10.0, -0.4]], arms: [[-0.4, 2.6, 3.6, 2.4], [0.6, 2.4, 4.0, 2.0]], eye: 'side', mouth: 'grit', scarf: 0.4, wind: 0.2 }));
    fr('wait', 0, 0, g => drawZip(g, { legs: STAND_L, arms: [[-0.4, 2.6, 3.6, 2.4], [0.6, 2.4, 4.0, 2.0]], eye: 'side', mouth: 'grit', scarf: 0.6, wind: 0.2 }));
    for (let i = 0; i < 8; i++) { const ph = i / 8 * Math.PI * 2; fr('walk', 0, 0, g => drawZip(g, { legs: legsRun(ph, 0.75), arms: armsRun(ph, 0.7), lean: 0.12, bob: -Math.abs(Math.sin(ph)) * 1.0 + 0.5, scarf: ph, wind: 0.6 })); }
    for (let i = 0; i < 8; i++) { const ph = i / 8 * Math.PI * 2; fr('run', 0, 0, g => drawZip(g, { legs: legsRun(ph, 1.15), arms: armsRun(ph, 1.1), lean: 0.3, bob: -Math.abs(Math.sin(ph)) * 1.4 + 0.6, scarf: ph * 1.5, wind: 1, mouth: 'grin' })); }
    for (let i = 0; i < 4; i++) { const ph = i / 4 * Math.PI * 2; fr('dash', 0, 0, g => { // the figure-of-eight legs
      g.globalAlpha = 0.85; for (let k = 0; k < 6; k++) { const a = ph + k / 6 * Math.PI * 2; ell(g, 22 + Math.cos(a) * 7, 41 + Math.sin(a * 2) * 2.6, 4.6, 2.5, k % 2 ? C('C') : C('n')); }
      g.globalAlpha = 1; ell(g, 22, 41, 4, 1.6, C('W'));
      drawZip(g, { legs: null, arms: [[-3, 1.4, -7, 3.6], [-2, 0.6, -6, 2.6]], lean: 0.42, bob: 0.4, scarf: ph * 2, wind: 1.2, mouth: 'grin' }); }); }
    for (let i = 0; i < 8; i++) fr('ball', 0, 0, g => drawBall(g, i / 8 * Math.PI * 2));
    fr('roll', 0, 0, g => drawBall(g, 0, 0.92));
    fr('skid', 0, 0, g => drawZip(g, { legs: [[4.8, 4.2, 7.6, 10.6, -0.5], [1.0, 6.0, 0.6, 11.6, -0.2]], arms: [[-2.6, 1.4, -5.6, 0.2], [-2.0, 1.0, -4.4, -0.8]], lean: -0.36, rot: -0.12, eye: 'n', mouth: 'grit', scarf: 2, wind: 0.2 }));
    fr('crouch', 0, 0, g => drawZip(g, { legs: [[4.0, 2.6, 1.0, 5.0, 0], [4.4, 2.4, 4.0, 5.2, 0]], arms: [[2.0, 2.0, 5.0, 3.0], [2.4, 1.8, 5.4, 2.6]], bob: 6.2, duck: 1.6, head: 0.18, scarf: 0.5, wind: 0.2 }));
    fr('up', 0, 0, g => drawZip(g, { legs: STAND_L, arms: STAND_A, head: -0.28, eye: 'up', scarf: 0.5, wind: 0.2 }));
    fr('spring', 0, 0, g => drawZip(g, { legs: [[0.6, 6.4, -0.6, 13.2, 0.5], [1.4, 6.4, 1.8, 13.4, 0.6]], arms: [[1.0, -4.6, 1.6, -9.4], [2.0, -4.6, 3.2, -9.0]], bob: -2, head: -0.1, eye: 'up', mouth: 'o', scarf: 1, wind: 0.1 }));
    fr('hurt', 0, 0, g => drawZip(g, { legs: [[-3, 4, -6, 9, 0.6], [3.6, 3.6, 6.6, 7.0, -0.6]], arms: [[-4, -1.6, -8, -3.6], [4, -2.6, 7.6, -5.2]], lean: -0.2, eye: 'hurt', mouth: 'o', scarf: 3, wind: 0.6, rot: -0.2 }));
    fr('dead', 0, 0, g => drawZip(g, { legs: [[-3, 4, -6, 9, 0.6], [3.6, 3.6, 6.6, 7.0, -0.6]], arms: [[-4, -3.6, -6, -8], [4, -3.6, 6, -8.6]], eye: 'x', mouth: 'o', scarf: 3, wind: 0.6 }));
    fr('win', 0, 0, g => drawZip(g, { legs: [[1.4, 5.8, -1.0, 11.6, 0], [2.2, 5.4, 4.4, 11.6, 0]], arms: [[2.2, 3.2, 3.4, 7.0], [3.6, -2.6, 6.8, -6.0]], eye: 'wink', mouth: 'grin', scarf: 1, wind: 0.5 }));
    fr('push', 0, 0, g => drawZip(g, { legs: [[-1.6, 5.2, -5.4, 11.6, 0], [-0.4, 5.8, -3.0, 11.4, 0]], arms: [[3.8, 0.6, 8.4, 0.2], [4.0, 0.2, 8.8, -0.8]], lean: 0.36, mouth: 'grit', scarf: 1, wind: 0.3 }));
    fr('push', 0, 0, g => drawZip(g, { legs: [[-0.6, 5.6, -3.6, 11.6, 0], [-1.4, 5.0, -5.8, 11.4, 0]], arms: [[3.8, 0.6, 8.4, 0.2], [4.0, 0.2, 8.8, -0.8]], lean: 0.36, mouth: 'grit', scarf: 1.4, wind: 0.3 }));
    fr('fall', 0, 0, g => drawZip(g, { legs: [[1.2, 6.4, 0.2, 12.8, 0.3], [2.6, 5.8, 4.6, 12.0, 0.2]], arms: [[-1.6, -3.0, -2.4, -7.6], [3.0, -3.4, 5.0, -7.8]], eye: 'up', mouth: 'o', scarf: 2, wind: 0.2 }));
    return F;
  }
  // ================================================================ everything else that moves
  function objFrames() {
    const A = {};
    // rings: eight turns of a spinning gold ring, and the sparkle when you grab one
    A.ring = []; for (let i = 0; i < 8; i++) { const c = Math.cos(i / 8 * Math.PI * 2), w = Math.max(0.8, Math.abs(c) * 6.6); A.ring.push(pixel(16, 16, g => { ell(g, 8, 8, w, 6.8, C('y')); ell(g, 8 - 0.4, 7.6, w * 0.9, 6.2, C('Y')); if (w > 2.4) { g.globalCompositeOperation = 'destination-out'; ell(g, 8, 8, w * 0.48, 3.6, '#000'); g.globalCompositeOperation = 'source-over'; } ell(g, 8 - w * 0.45, 4.6, Math.max(0.6, w * 0.18), 1.2, C('W')); }, { thin: 1 })); }
    A.spark = [0, 1, 2, 3].map(f => pixel(16, 16, g => { const r = 2 + f * 1.6; poly(g, [8, 8 - r * 1.6, 8 + r * 0.35, 8 - r * 0.35, 8 + r * 1.6, 8, 8 + r * 0.35, 8 + r * 0.35, 8, 8 + r * 1.6, 8 - r * 0.35, 8 + r * 0.35, 8 - r * 1.6, 8, 8 - r * 0.35, 8 - r * 0.35], f < 3 ? C('W') : C('Y')); }, { outline: false }));
    // item monitors: a little telly on legs with the prize on screen
    const ICON = {
      rings: g => { ell(g, 13, 11, 4.6, 4.6, C('Y')); ell(g, 13, 11, 2.4, 2.4, C('k')); },
      shield: g => { ell(g, 13, 11, 5.4, 5.4, C('C')); ell(g, 12, 10, 3, 3, C('W')); },
      shoes: g => { ell(g, 13, 12.4, 6, 2.6, C('R')); rect(g, 10, 10, 2, 4.4, C('W')); rect(g, 7.4, 14.4, 11, 1.2, C('s')); },
      life: g => { ell(g, 10, 7, 2, 2, C('B')); ell(g, 14, 11, 5, 4.6, C('B')); limb(g, 13, 7, 17, 13, 2.6, C('P')); ell(g, 16, 10, 2.4, 1.5, C('k')); ell(g, 17.4, 13.6, 2.6, 2, C('P')); },
      stars: g => { for (let k = 0; k < 3; k++) { const x = 8 + k * 5, y = 9 + (k % 2) * 4; poly(g, [x, y - 3, x + 1, y - 1, x + 3, y, x + 1, y + 1, x, y + 3, x - 1, y + 1, x - 3, y, x - 1, y - 1], C('Y')); } },
      magnet: g => { poly(g, [14, 5, 9, 12, 13, 12, 11, 18, 17, 10, 13, 10, 15, 5], C('Y')); },
      gem: g => { poly(g, [13, 5, 18, 10, 13, 17, 8, 10], C('M')); poly(g, [13, 5, 15, 10, 13, 17], C('W')); },
    };
    A.mon = {}; for (const k in ICON) A.mon[k] = pixel(26, 30, g => {
      rect(g, 1, 1, 24, 22, C('S')); rect(g, 1, 1, 24, 2, C('W')); rect(g, 1, 21, 24, 2, C('s'));
      rect(g, 4, 4, 18, 15, C('k')); ICON[k](g); rect(g, 5, 5, 6, 2, 'rgba(255,255,255,.6)');
      rect(g, 4, 23, 4, 6, C('s')); rect(g, 18, 23, 4, 6, C('s')); rect(g, 3, 27, 20, 2, C('s'));
    });
    A.monBroke = pixel(26, 12, g => { rect(g, 3, 6, 20, 5, C('s')); poly(g, [2, 6, 7, 1, 11, 5, 16, 1, 21, 4, 24, 6], C('S')); });
    // springs: yellow (bouncy) and red (very bouncy), shut and sprung
    A.spring = {}; for (const [k, top, top2] of [['y', 'Y', 'y'], ['r', 'R', 'r']]) A.spring[k] = [0, 1].map(up => pixel(28, 26, g => {
      const h = up ? 18 : 8; rect(g, 3, 22, 22, 4, C('s')); rect(g, 3, 22, 22, 1, C('S'));
      for (let i = 0; i < (up ? 4 : 2); i++) { const y = 22 - (i + 1) * (h / (up ? 4 : 2)); ell(g, 14, y + 1.5, 8, 1.6, C('S')); ell(g, 14, y + 1.0, 7, 1.0, C('W')); }
      rect(g, 1, 22 - h - 5, 26, 5, C(top)); rect(g, 1, 22 - h - 5, 26, 1.6, C('W')); rect(g, 1, 22 - h - 1.4, 26, 1.4, C(top2));
    }));
    A.spikes = pixel(32, 18, g => { for (let i = 0; i < 4; i++) { poly(g, [i * 8, 16, i * 8 + 4, 1, i * 8 + 8, 16], C('S')); poly(g, [i * 8 + 4, 1, i * 8 + 8, 16, i * 8 + 5, 16], C('s')); poly(g, [i * 8 + 3.2, 5, i * 8 + 4, 2, i * 8 + 4.2, 6], C('W')); } rect(g, 0, 15, 32, 3, C('s')); });
    A.post = [0, 1].map(on => pixel(14, 46, g => { rect(g, 5.4, 10, 3.2, 34, C('S')); rect(g, 5.4, 10, 1, 34, C('W')); rect(g, 2, 42, 10, 4, C('s')); ball3(g, 7, 6, 5, 5, on ? C('R') : C('B'), on ? C('r') : C('b'), C('W')); }));
    // the signpost: Dr. Sprocket's face, spin, Zip's face
    const face = (g, zip) => { if (zip) { ball3(g, 18, 14, 8, 7.6, C('B'), C('b'), C('L')); ell(g, 11, 7, 3, 3, C('B')); limb(g, 17, 7, 22, 18, 3.5, C('P')); ell(g, 19, 12, 5, 3, C('k')); ell(g, 21, 16, 4, 3, C('P')); ell(g, 19, 12, 2, 3, C('W')); rect(g, 20, 12, 1.2, 2, C('E')); } else { ball3(g, 18, 15, 8, 7, C('P'), C('p'), null); rect(g, 10, 6, 16, 3, C('k')); rect(g, 13, 1, 10, 6, C('k')); ell(g, 18, 18, 7, 2.2, C('O')); ell(g, 22, 12, 2, 2, C('W')); ell(g, 22, 12, 2.4, 2.4, 'rgba(0,0,0,0)'); rect(g, 14, 11, 2, 2, C('E')); } };
    A.sign = [0, 1, 2, 3].map(f => pixel(36, 54, g => { rect(g, 16, 26, 4, 28, C('S')); rect(g, 16, 26, 1, 28, C('W')); const w = [32, 16, 3, 16][f]; rect(g, 18 - w / 2, 2, w, 24, f === 2 ? C('S') : C('W')); rect(g, 18 - w / 2, 24, w, 2, C('w'));
      if (f === 0) face(g, false); if (f === 1 || f === 3) { g.save(); g.translate(18, 0); g.scale(0.5, 1); g.translate(-18, 0); face(g, f === 3); g.restore(); } }));
    A.signZip = pixel(36, 54, g => { rect(g, 16, 26, 4, 28, C('S')); rect(g, 2, 2, 32, 24, C('W')); rect(g, 2, 24, 32, 2, C('w')); face(g, true); });
    A.boost = pixel(32, 8, g => { rect(g, 0, 1, 32, 7, C('D')); for (let i = 0; i < 3; i++) poly(g, [3 + i * 9, 2, 10 + i * 9, 4.5, 3 + i * 9, 7, 6 + i * 9, 4.5], C('Y')); });
    A.vent = pixel(32, 10, g => { rect(g, 0, 1, 32, 9, C('D')); for (let i = 0; i < 7; i++) rect(g, 2 + i * 4, 3, 2, 6, C('k')); rect(g, 0, 1, 32, 1.4, C('S')); });
    A.bumper = [0, 1].map(hit => pixel(32, 32, g => { ball3(g, 16, 16, hit ? 14 : 12.5, hit ? 14 : 12.5, C('M'), C('V'), C('W')); ell(g, 16, 16, 7, 7, C('Y')); ell(g, 15, 15, 4, 4, C('W')); }));
    A.giant = [0, 1, 2, 3].map(f => { const c = Math.cos(f / 8 * Math.PI * 2), w = Math.max(3, Math.abs(c) * 28); return pixel(64, 64, g => { ell(g, 32, 32, w, 29, C('y')); ell(g, 31, 31, w * 0.92, 27, C('Y')); g.globalCompositeOperation = 'destination-out'; ell(g, 32, 32, w * 0.6, 20, '#000'); g.globalCompositeOperation = 'source-over'; ell(g, 32 - w * 0.6, 14, Math.max(1, w * 0.12), 4, C('W')); }); });
    A.gem = [0,1,2,3,4,5].map(i => pixel(16, 18, g => { const col = ['M', 'C', 'Y', 'N', 'O', 'V'][i]; poly(g, [8, 1, 14, 6, 8, 17, 2, 6], C(col)); poly(g, [8, 1, 10, 6, 8, 17], C('W')); poly(g, [2, 6, 14, 6, 8, 8], 'rgba(255,255,255,.5)'); }));
    // ---- the badniks (Dr. Sprocket's wind-up robots; each has an animal inside)
    A.crab = [0, 1].map(f => pixel(34, 26, g => {
      for (let i = 0; i < 3; i++) { limb(g, 9 + i * 7, 18, 6 + i * 7 + f * 2, 25, 1.6, C('s')); }
      ball3(g, 17, 15, 11, 7.4, C('R'), C('r'), C('W')); rect(g, 8, 18, 18, 2.6, C('r'));
      rect(g, 15.4, 2, 3, 6, C('S')); rect(g, 12, 1, 9, 2.4, C('W')); // the wind-up key
      ell(g, 13, 11, 2.4, 2.6, C('W')); ell(g, 21, 11, 2.4, 2.6, C('W')); rect(g, 13.4, 11, 1.4, 1.8, C('E')); rect(g, 21.4, 11, 1.4, 1.8, C('E'));
      for (const s of [-1, 1]) { const cx = 17 + s * 13; ball3(g, cx, 10 - f * 2.4, 4.4, 3.6, C('O'), C('o'), null); poly(g, [cx - 2 * s, 7 - f * 2, cx + 5 * s, 2 - f * 4, cx + 2 * s, 9 - f * 2], C('O')); }
    }));
    A.bee = [0, 1].map(f => pixel(34, 26, g => {
      ell(g, 11 + f, 6, 7, 3.2, 'rgba(230,240,255,.9)'); ell(g, 19 - f, 5, 7, 3, 'rgba(200,220,255,.9)');
      ball3(g, 15, 14, 10.4, 6.4, C('Y'), C('y'), C('W')); rect(g, 9, 8, 3, 12, C('k')); rect(g, 16, 8, 3, 12, C('k'));
      ball3(g, 25, 13, 4.4, 4.4, C('S'), C('s'), null); ell(g, 26.6, 12, 1.6, 1.6, C('R'));
      poly(g, [5, 13, 0, 19, 7, 16], C('S'));
    }));
    A.fish = [0, 1].map(f => pixel(30, 26, g => {
      poly(g, [4, 13, -1 + f * 2, 6, -1 + f * 2, 20], C('R'));
      ball3(g, 15, 13, 10, 8, C('M'), C('V'), C('W')); ell(g, 20, 17, 6, 3, C('W'));
      for (let i = 0; i < 4; i++) poly(g, [15 + i * 3, 15, 16.5 + i * 3, 17.6, 18 + i * 3, 15], C('W'));
      ell(g, 20, 9, 2.6, 2.6, C('W')); rect(g, 20.6, 9, 1.4, 1.8, C('E')); poly(g, [12, 5, 18, 0, 19, 6], C('V'));
    }));
    A.roll = [0, 1].map(f => pixel(30, 24, g => { for (let i = 0; i < 2; i++) limb(g, 10 + i * 9, 18, 9 + i * 9 + (f ? 2 : -2) * (i ? -1 : 1), 23, 2, C('s')); ball3(g, 15, 13, 11, 7.6, C('S'), C('s'), C('W')); for (let i = 0; i < 4; i++) rect(g, 7 + i * 4.4, 6, 1.4, 13, C('s')); ball3(g, 25, 13, 4.4, 4, C('C'), C('o'), null); ell(g, 27, 12, 1.2, 1.4, C('E')); }));
    A.rollBall = [0, 1, 2, 3].map(f => pixel(24, 24, g => { g.translate(12, 12); g.rotate(f * Math.PI / 4); ball3(g, 0, 0, 10, 10, C('S'), C('s'), C('W')); for (let i = 0; i < 3; i++) { g.rotate(Math.PI / 3); rect(g, -10, -0.8, 20, 1.6, C('s')); } }));
    A.spark2 = [0, 1].map(f => pixel(28, 30, g => { ball3(g, 14, 12, 9, 9, C('D'), C('k'), C('S')); rect(g, 8, 18, 3, 8 + f, C('Y')); rect(g, 17, 18, 3, 8 + f, C('Y')); ell(g, 10, 10, 2.4, 2.4, C('C')); ell(g, 18, 10, 2.4, 2.4, C('C')); rect(g, 10, 14, 8, 1.4, C('C')); }));
    A.jester = [0, 1].map(f => pixel(28, 40, g => { for (let i = 0; i < 4; i++) ell(g, 14, 36 - i * 3 * (f ? 1.4 : 0.8), 6, 1.6, C('S')); ball3(g, 14, 18 - (f ? 4 : 0), 8, 9, C('V'), C('v'), C('W')); poly(g, [6, 10 - f * 4, 2, 0 - f * 4, 11, 6 - f * 4], C('M')); poly(g, [22, 10 - f * 4, 26, 0 - f * 4, 17, 6 - f * 4], C('C')); ell(g, 14, 16 - f * 4, 4.4, 4.4, C('W')); ell(g, 14, 18 - f * 4, 1.6, 1.6, C('R')); rect(g, 11, 14 - f * 4, 1.4, 1.6, C('E')); rect(g, 16, 14 - f * 4, 1.4, 1.6, C('E')); }));
    A.turtle = [0, 1].map(f => pixel(34, 26, g => { for (let i = 0; i < 2; i++) ell(g, 10 + i * 14, 22, 3, 2.4, C('N')); ell(g, 29 + f, 15, 4, 3.6, C('N')); ball3(g, 16, 14, 12, 8, C('S'), C('s'), C('W')); for (let i = 0; i < 4; i++) poly(g, [7 + i * 6, 8, 10 + i * 6, -1, 13 + i * 6, 8], C('W')); rect(g, 30 + f, 13, 1.4, 1.4, C('E')); }));
    A.batbot = [0, 1].map(f => pixel(36, 24, g => { poly(g, [18, 12, 1, f ? 2 : 18, 7, 13, 2, f ? 8 : 22], C('v')); poly(g, [18, 12, 35, f ? 2 : 18, 29, 13, 34, f ? 8 : 22], C('v')); ball3(g, 18, 12, 6, 6, C('V'), C('v'), C('W')); ell(g, 16, 11, 1.6, 1.8, C('Y')); ell(g, 20, 11, 1.6, 1.8, C('Y')); poly(g, [14, 6, 15, 1, 17, 6], C('V')); poly(g, [19, 6, 21, 1, 22, 6], C('V')); }));
    // the animals that pop out
    A.critter = [0, 1, 2].map(kind => [0, 1].map(f => pixel(16, 16, g => {
      if (kind === 0) { ball3(g, 8, 10, 4.4, 4, C('W'), C('w'), null); ell(g, 6 + f, 3 + f, 1.4, 4, C('W')); ell(g, 9, 3, 1.4, 4, C('w')); rect(g, 9.4, 9, 1.2, 1.4, C('E')); ell(g, 7, 14 - f, 2, 1, C('w')); }
      else if (kind === 1) { ball3(g, 8, 9, 4.4, 4, C('C'), C('o'), null); poly(g, [8, 9, 1, 3 + f * 6, 5, 11], C('C')); poly(g, [12, 9, 15, 10, 12, 11], C('Y')); rect(g, 9.4, 7, 1.2, 1.2, C('E')); }
      else { ball3(g, 8, 10, 4.2, 4, C('O'), C('o'), null); ell(g, 3, 6 + f, 3, 4, C('O')); ell(g, 3, 6 + f, 1.6, 2.6, C('Y')); rect(g, 10, 8.4, 1.2, 1.4, C('E')); }
    })));
    A.boom = [0, 1, 2, 3, 4].map(f => pixel(32, 32, g => { const r = 5 + f * 3; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + f; ell(g, 16 + Math.cos(a) * r * 0.5, 16 + Math.sin(a) * r * 0.5, r * 0.55, r * 0.55, f < 2 ? C('W') : f < 3 ? C('Y') : f < 4 ? C('O') : C('S')); } if (f < 4) ell(g, 16, 16, r * 0.45, r * 0.45, f < 2 ? C('Y') : C('W')); }, { outline: f > 2 }));
    A.dust = [0, 1, 2].map(f => pixel(12, 12, g => { ell(g, 6, 7 - f, 2 + f * 1.4, 2 + f, f < 2 ? C('W') : C('w')); }, { outline: false }));
    // ---- Dr. Sprocket in his hover pod (original: green waistcoat, ginger moustache, monocle, cog top hat)
    A.doc = [0, 1, 2].map(f => pixel(72, 72, g => {
      g.translate(0, 8); // him first (he sits in the pod)
      ball3(g, 36, 22, 13, 11, C('N'), C('n'), null); ell(g, 36, 25, 6, 7, C('W'));
      ball3(g, 38, 9, 9, 8, C('P'), C('p'), null);
      rect(g, 28, -4, 17, 8, C('k')); rect(g, 25, 2.4, 23, 2.6, C('k')); ell(g, 36.5, 0, 3.4, 3.4, C('Y')); ell(g, 36.5, 0, 1.4, 1.4, C('k'));
      ell(g, 43, 8, 3.4, 3.4, f === 1 ? C('W') : C('G')); g.strokeStyle = C('Y'); g.lineWidth = 1; g.beginPath(); g.arc(43, 8, 3.6, 0, 7); g.stroke(); ell(g, 33, 8, 1.6, 2, C('E'));
      ell(g, 40, 14, 9, 2.8, C('O')); ell(g, 47.5, 12.6, 3, 2, C('O')); ell(g, 32, 12.6, 3, 2, C('O')); ell(g, 45, 10.4, 2.4, 2.0, C('p'));
      if (f === 2) { ell(g, 40, 17, 3, 2, C('r')); }
      // the pod: a silver cup with a glass dome and a jet underneath
      g.strokeStyle = C('G'); g.lineWidth = 1.6; g.beginPath(); g.arc(36, 30, 24, Math.PI * 1.08, Math.PI * 1.55); g.stroke(); g.beginPath(); g.arc(36, 30, 24, Math.PI * 1.7, Math.PI * 1.92); g.stroke();
      ball3(g, 36, 40, 28, 13, C('S'), C('s'), C('W')); rect(g, 8, 32, 56, 4, C('Y')); for (let i = 0; i < 6; i++) rect(g, 11 + i * 9, 32, 4, 4, C('k'));
      ell(g, 36, 52, 9, 4, C('D')); ell(g, 36, 55, 6, 2.6 + (f % 2), C('O')); ell(g, 36, 56, 3, 2, C('Y'));
      ell(g, 14, 42, 3, 3, C('R')); ell(g, 58, 42, 3, 3, C('R'));
    }));
    A.ball = pixel(32, 32, g => { ball3(g, 16, 16, 13, 13, C('D'), C('k'), C('S')); ell(g, 11, 10, 4, 3, C('S')); });
    A.chain = pixel(8, 8, g => { ell(g, 4, 4, 3, 3, C('S')); ell(g, 4, 4, 1.4, 1.4, C('s')); });
    A.bomb = pixel(16, 18, g => { ball3(g, 8, 10, 6.6, 6.6, C('D'), C('k'), C('S')); rect(g, 7, 1, 2, 4, C('S')); ell(g, 9, 1, 1.6, 1.6, C('O')); });
    A.capsule = [0, 1].map(open => pixel(64, 64, g => { ball3(g, 32, 40, 26, 18, C('S'), C('s'), C('W')); rect(g, 6, 50, 52, 12, C('D')); if (!open) { rect(g, 22, 18, 20, 12, C('R')); rect(g, 22, 18, 20, 3, C('W')); } else rect(g, 22, 28, 20, 4, C('r')); for (let i = 0; i < 5; i++) rect(g, 10 + i * 10, 34, 4, 16, C('D')); }));
    return A;
  }
  // ================================================================ the zones (a ground height for every pixel across)
  function builder(y0) {
    const hm = [], objs = [], loops = [], plats = [], conv = [], corks = [], deco = [];
    let y = y0;
    const PIT = () => Infinity;
    const seg = (n, f, cb) => { const x0 = hm.length, ys = y; for (let i = 0; i < n; i++) hm.push(f(i / n, ys)); if (f !== PIT) y = f(1, ys); if (cb) cb(helper(x0)); return B; };
    const gy = x => { x = clamp(Math.round(x), 0, hm.length - 1); let v = hm[x]; if (v === Infinity) { for (let d = 1; d < 400; d++) { if (hm[x - d] < Infinity) { v = hm[x - d]; break; } if (hm[x + d] < Infinity) { v = hm[x + d]; break; } } } return v; };
    function helper(x0) {
      return {
        o(type, dx, h, ex) { const x = x0 + dx; objs.push(Object.assign({ type, x, y: gy(x) - (h || 0) }, ex || {})); return this; },
        rings(dx, h, n, gap) { for (let i = 0; i < n; i++) this.o('ring', dx + i * (gap || 22), h); return this; },
        arc(dx, h, n, w, ah) { for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : 0.5; this.o('ring', dx + t * w, h + Math.sin(t * Math.PI) * ah); } return this; },
        col(dx, h, n) { for (let i = 0; i < n; i++) this.o('ring', dx, h + i * 20); return this; },
        loop(dx, r) { const x = x0 + dx; loops.push({ x, y: gy(x), r }); return this; },
        cork(dx, len) { corks.push({ x0: x0 + dx, x1: x0 + dx + len, y: gy(x0 + dx) }); return this; },
        plat(dx, h, w, mv) { const x = x0 + dx; plats.push({ x0: x, y0: gy(x) - h, x, y: gy(x) - h, w, mv: mv || null, dx: 0, dy: 0 }); return this; },
        platAt(dx, ay, w, mv) { const x = x0 + dx; plats.push({ x0: x, y0: ay, x, y: ay, w, mv: mv || null, dx: 0, dy: 0 }); return this; },
        conv(dx, len, sp) { conv.push({ x0: x0 + dx, x1: x0 + dx + len, sp }); return this; },
        deco(k, dx, h, front) { deco.push({ k, x: x0 + dx, y: gy(x0 + dx) - (h || 0), front: !!front }); return this; },
        get y() { return y; },
      };
    }
    const B = {
      flat: (n, cb) => seg(n, (t, ys) => ys, cb),
      curve: (n, dy, cb) => seg(n, (t, ys) => ys + dy * (1 - Math.cos(t * Math.PI)) / 2, cb),
      ramp: (n, dy, cb) => seg(n, (t, ys) => ys + dy * t * t, cb), // a launch ramp: steeper to the lip (about 40 degrees)
      slope: (n, dy, cb) => seg(n, (t, ys) => ys + dy * t, cb),
      hills: (n, dy, k, cb) => seg(n, (t, ys) => ys + Math.sin(t * Math.PI * 2 * k) * dy, cb),
      pit: (n, cb) => seg(n, PIT, cb),
      step: dy => { y += dy; return B; },
      get y() { return y; },
      done: () => ({ hm: Float32Array.from(hm), objs, loops, plats, conv, corks, deco, len: hm.length }),
    };
    return B;
  }
  // decorations every so often along flat-ish ground
  function dress(L, kinds, every, seed) { const R = rnd(seed); for (let x = 200; x < L.len - 300; x += every * (0.6 + R() * 0.8)) { const y = L.hm[Math.round(x)]; if (!(y < Infinity)) continue; const a = L.hm[Math.round(x) - 12], b = L.hm[Math.round(x) + 12]; if (!(a < Infinity && b < Infinity) || Math.abs(a - b) > 10) continue; if (L.loops.some(l => Math.abs(l.x - x) < 120)) continue; L.deco.push({ k: kinds[(R() * kinds.length) | 0], x, y, front: R() < 0.18 }); } }
  function rnd(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // ---- Blackberry Bay, act 1: wide open, loops, the first badniks
  function bay1() {
    const B = builder(400);
    B.flat(420, s => { s.rings(190, 26, 5).o('mon', 360, 0, { it: 'rings' }); s.deco('sign0', 60, 0); })
      .curve(240, -50, s => s.arc(40, 30, 5, 160, 30))
      .curve(240, 50, s => { s.o('crab', 160, 0); })
      .flat(220, s => { s.rings(40, 26, 6).o('spring', 190, 0, { pw: 'y' }); })
      .flat(160, s => s.arc(0, 120, 6, 150, 26))
      .curve(420, 130, s => s.rings(80, 26, 8, 30))
      .flat(140, s => s.o('boost', 40, 0))
      .flat(380, s => { s.loop(90, 70).rings(60, 26, 3).o('mon', 300, 0, { it: 'shield' }); })
      .flat(220, s => { s.o('crab', 120, 0); s.o('bee', 120, 70); })
      .curve(200, -60)
      .flat(80, s => s.o('post', 40, 0))
      .pit(320, s => { s.platAt(10, B.y - 10, 64); s.platAt(130, B.y - 40, 64, { dx: 0, dy: 30, p: 3 }); s.platAt(240, B.y - 10, 64); s.arc(30, -40, 7, 260, 50); s.o('fish', 100, -60, { pit: 1 }); })
      .flat(200, s => { s.o('spikes', 100, 0); s.rings(10, 26, 3); })
      .curve(500, 160, s => { s.rings(60, 26, 10, 36); s.o('bee', 300, 60); })
      .flat(120, s => s.o('boost', 30, 0))
      .ramp(280, -110)
      .step(140).flat(80)
      .flat(260, s => { s.arc(-120, 140, 9, 300, 60); s.o('mon', 200, 0, { it: 'life' }); })
      .curve(200, -40, s => s.o('crab', 100, 0))
      .curve(200, 40)
      .flat(300, s => { s.o('spring', 60, 0, { pw: 'r' }); s.plat(140, 150, 96); s.rings(140, 175, 4); s.o('mon', 210, 150, { it: 'shoes', onPlat: 1 }); s.o('spring', 280, 0, { pw: 'y', dir: 'l' }); })
      .curve(260, -80, s => s.o('bee', 120, 70))
      .flat(300, s => { s.o('post', 30, 0); s.o('crab', 180, 0); s.o('crab', 260, 0); s.rings(80, 26, 6); })
      .curve(400, 140, s => s.rings(60, 26, 9, 32))
      .flat(500, s => { s.loop(120, 66); s.rings(330, 26, 5); s.o('spikes', 440, 0); })
      .curve(300, -40, s => { s.o('bee', 100, 50); s.o('mon', 240, 0, { it: 'rings' }); })
      .flat(260, s => { s.o('post', 40, 0); s.o('spring', 180, 0, { pw: 'y', diag: 1 }); s.arc(190, 110, 7, 220, 50); })
      .pit(280, s => { s.platAt(40, B.y - 70, 72, { fall: 1 }); s.platAt(170, B.y - 40, 72, { dx: 40, dy: 0, p: 3 }); s.o('bee', 130, -60); s.o('fish', 120, -40, { pit: 1 }); })
      .flat(200, s => { s.o('crab', 90, 0); s.rings(20, 26, 4); s.o('mon', 160, 0, { it: 'stars' }); })
      .hills(880, 36, 2, s => { s.rings(40, 40, 6, 26); s.o('crab', 300, 0); s.rings(460, 40, 6, 26); s.o('crab', 700, 0); })
      .flat(200, s => { s.o('spikes', 70, 0); s.o('spikes', 102, 0); s.arc(40, 30, 5, 110, 50); })
      .curve(360, 120, s => { s.rings(40, 26, 10, 30); s.o('bee', 250, 60); })
      .flat(120, s => s.o('boost', 40, 0))
      .flat(500, s => { s.cork(60, 300); s.rings(80, 30, 10, 28); })
      .flat(420, s => { s.loop(100, 64); s.rings(260, 26, 5); s.o('crab', 360, 0); })
      .flat(460, s => { s.o('sign', 300, 0); s.rings(100, 26, 5); })
      .step(-200).flat(40);
    const L = Object.assign(B.done(), { name: 'BLACKBERRY BAY', zone: 0, act: 0, theme: 'bay', start: 60 });
    dress(L, ['flower', 'flower', 'bush', 'palm', 'totem'], 160, 11); return L;
  }
  // ---- Blackberry Bay, act 2: higher paths, more pits, the Wrecker at the end
  function bay2() {
    const B = builder(420);
    B.flat(360, s => { s.rings(150, 26, 5); s.o('mon', 300, 0, { it: 'shield' }); })
      .curve(300, -90, s => { s.o('crab', 120, 0); s.arc(150, 40, 5, 120, 30); })
      .flat(200, s => { s.o('spring', 150, 0, { pw: 'y' }); s.plat(100, 140, 120); s.rings(110, 165, 5); })
      .curve(400, 160, s => { s.rings(40, 26, 10, 34); s.o('bee', 280, 70); })
      .flat(140, s => s.o('boost', 40, 0))
      .flat(420, s => { s.loop(90, 72); s.o('crab', 330, 0); })
      .pit(360, s => { s.platAt(20, B.y - 20, 70, { fall: 1 }); s.platAt(140, B.y - 50, 70, { fall: 1 }); s.platAt(260, B.y - 20, 80); s.arc(30, -30, 9, 300, 60); s.o('fish', 120, -50, { pit: 1 }); s.o('fish', 250, -50, { pit: 1 }); })
      .flat(200, s => { s.o('post', 30, 0); s.o('mon', 90, 0, { it: 'magnet' }); s.o('boost', 175, 0); })
      .ramp(260, -90).step(160).flat(60)
      .flat(300, s => { s.arc(-60, 120, 9, 260, 60); s.o('crab', 180, 0); s.o('bee', 260, 80); })
      .hills(900, 40, 2.5, s => { s.rings(60, 44, 8, 28); s.o('crab', 330, 0); s.o('crab', 620, 0); s.rings(600, 44, 8, 28); })
      .flat(260, s => { s.o('spikes', 60, 0); s.o('spring', 150, 0, { pw: 'r' }); s.plat(120, 170, 140); s.rings(130, 196, 6); s.o('mon', 230, 170, { it: 'life', onPlat: 1 }); })
      .curve(320, -70, s => s.o('bee', 160, 70))
      .flat(300, s => { s.o('post', 40, 0); s.rings(120, 26, 6); s.o('crab', 240, 0); })
      .curve(480, 180, s => { s.rings(60, 26, 12, 34); })
      .flat(140, s => s.o('boost', 40, 0))
      .flat(520, s => { s.cork(40, 320); s.rings(60, 30, 12, 26); })
      .flat(420, s => { s.loop(110, 70); s.rings(280, 26, 5); })
      .flat(300, s => { s.o('post', 80, 0); s.o('mon', 200, 0, { it: 'rings' }); })
      .flat(700, s => { s.o('boss', 140, 0, { kind: 0 }); })
      .flat(200).step(-200).flat(40);
    const L = Object.assign(B.done(), { name: 'BLACKBERRY BAY', zone: 0, act: 1, theme: 'bay', start: 60 });
    dress(L, ['flower', 'bush', 'palm', 'totem', 'flower'], 150, 22); return L;
  }
  // ---- Sprocket Works, act 1: conveyors, steam vents, crushers
  function works1() {
    const B = builder(380);
    B.flat(420, s => { s.rings(150, 26, 5); s.o('mon', 330, 0, { it: 'rings' }); })
      .flat(300, s => { s.conv(0, 300, 2.5); s.rings(40, 26, 8, 30); s.o('roll', 250, 0); })
      .curve(200, 70)
      .flat(260, s => { s.o('vent', 120, 0); s.arc(90, 80, 5, 90, 50); s.o('spikes', 210, 0); })
      .pit(360, s => { s.platAt(20, B.y - 10, 64, { dx: 60, dy: 0, p: 4 }); s.platAt(200, B.y - 30, 64, { dx: 0, dy: 40, p: 3 }); s.arc(40, -40, 8, 300, 40); })
      .flat(260, s => { s.o('roll', 140, 0); s.o('post', 40, 0); s.o('crusher', 210, 0); })
      .curve(400, 140, s => { s.rings(60, 26, 8, 36); s.o('spark', 240, 50); })
      .flat(160, s => s.o('boost', 40, 0))
      .flat(380, s => { s.loop(100, 68); s.o('mon', 300, 0, { it: 'shield' }); })
      .flat(300, s => { s.conv(0, 300, -2); s.o('crab', 140, 0); s.rings(30, 26, 6, 32); s.o('crusher', 230, 0); })
      .curve(220, -70)
      .flat(240, s => { s.o('vent', 60, 0); s.plat(60, 170, 96); s.rings(70, 200, 4); s.o('mon', 130, 170, { it: 'life', onPlat: 1 }); s.o('spikes', 170, 0); })
      .pit(300, s => { s.platAt(30, B.y - 20, 56, { dx: 0, dy: -50, p: 2.5 }); s.platAt(170, B.y - 20, 56, { dx: 0, dy: -50, p: 2.5, ph: 1.25 }); s.arc(40, -10, 6, 220, 60); })
      .flat(260, s => { s.o('post', 40, 0); s.o('roll', 200, 0); })
      .flat(300, s => { s.conv(0, 300, 3); s.o('spikes', 120, 0); s.rings(20, 60, 5); s.o('spark', 220, 40); })
      .curve(380, 130, s => s.o('bee', 160, 60))
      .ramp(270, -100)
      .step(120).flat(100)
      .flat(260, s => { s.arc(-140, 150, 9, 300, 60); s.o('crab', 160, 0); })
      .flat(340, s => { s.o('vent', 50, 0); s.o('vent', 170, 0); s.rings(110, 40, 3); s.o('mon', 250, 0, { it: 'stars' }); s.o('crusher', 300, 0); })
      .curve(200, -60, s => s.o('spark', 90, 60))
      .flat(220, s => { s.o('post', 40, 0); s.conv(60, 160, -3); s.o('roll', 150, 0); })
      .pit(340, s => { s.platAt(20, B.y - 30, 56, { dx: 50, dy: 0, p: 3.2 }); s.platAt(150, B.y - 70, 56, { fall: 1 }); s.platAt(260, B.y - 30, 56, { dx: 0, dy: 50, p: 2.6 }); s.arc(60, 0, 8, 240, 70); })
      .flat(160, s => { s.o('crab', 100, 0); s.o('mon', 40, 0, { it: 'shield' }); })
      .curve(320, 110, s => { s.rings(40, 26, 8, 30); s.o('bee', 200, 60); })
      .flat(140, s => s.o('boost', 50, 0))
      .flat(500, s => { s.cork(40, 300); s.rings(70, 30, 10, 26); })
      .flat(360, s => { s.loop(110, 66); s.o('roll', 300, 0); })
      .flat(300, s => { s.o('vent', 60, 0); s.o('spikes', 140, 0); s.o('vent', 220, 0); s.arc(40, 90, 7, 200, 40); })
      .flat(420, s => { s.o('sign', 260, 0); s.rings(60, 26, 6); s.o('roll', 140, 0); })
      .step(-200).flat(40);
    const L = Object.assign(B.done(), { name: 'SPROCKET WORKS', zone: 1, act: 0, theme: 'works', start: 60 });
    dress(L, ['barrel', 'pipe', 'warn', 'barrel'], 170, 33); return L;
  }
  function works2() {
    const B = builder(400);
    B.flat(380, s => { s.rings(120, 26, 6); s.o('mon', 320, 0, { it: 'magnet' }); })
      .flat(360, s => { s.conv(0, 360, 3); s.o('crusher', 120, 0); s.o('crusher', 240, 0); s.rings(30, 26, 10, 32); })
      .curve(300, 120, s => { s.o('spark', 150, 50); })
      .flat(200, s => { s.o('spring', 120, 0, { pw: 'y', diag: 1 }); s.plat(200, 160, 120); s.rings(210, 186, 5); })
      .pit(380, s => { s.platAt(30, B.y - 30, 60, { dx: 0, dy: -60, p: 2.4 }); s.platAt(150, B.y - 30, 60, { dx: 0, dy: -60, p: 2.4, ph: 1.2 }); s.platAt(270, B.y - 30, 60, { fall: 1 }); s.arc(20, -40, 10, 320, 70); })
      .flat(260, s => { s.o('post', 30, 0); s.o('roll', 100, 0); s.o('roll', 150, 0); s.o('boost', 230, 0); })
      .ramp(290, -110).step(180).flat(80)
      .flat(320, s => { s.arc(-80, 140, 10, 300, 70); s.o('vent', 160, 0); s.plat(150, 200, 100); s.o('mon', 190, 200, { it: 'life', onPlat: 1 }); })
      .curve(420, 150, s => { s.rings(40, 26, 12, 32); s.o('spark', 260, 60); })
      .flat(150, s => s.o('boost', 40, 0))
      .flat(400, s => { s.loop(100, 70); s.o('crab', 320, 0); })
      .flat(320, s => { s.conv(0, 320, -3); s.o('crusher', 160, 0); s.o('spikes', 260, 0); s.rings(30, 60, 6); })
      .flat(260, s => { s.o('post', 60, 0); s.o('mon', 180, 0, { it: 'shield' }); })
      .hills(800, 36, 2, s => { s.rings(60, 44, 8, 26); s.o('roll', 300, 0); s.o('spark', 520, 50); s.rings(560, 44, 8, 26); })
      .pit(320, s => { s.platAt(20, B.y - 40, 60, { dx: 60, dy: 0, p: 3 }); s.platAt(220, B.y - 60, 60, { fall: 1 }); s.arc(40, -10, 8, 260, 60); s.o('bee', 160, -80); })
      .flat(260, s => { s.o('vent', 80, 0); s.o('vent', 160, 0); s.rings(60, 120, 6); })
      .curve(400, 120, s => { s.rings(40, 26, 10, 30); })
      .flat(140, s => s.o('boost', 40, 0))
      .flat(500, s => { s.cork(40, 320); s.rings(60, 30, 12, 26); })
      .flat(300, s => { s.o('post', 80, 0); s.o('mon', 200, 0, { it: 'rings' }); })
      .flat(700, s => { s.o('boss', 140, 0, { kind: 1 }); })
      .flat(200).step(-200).flat(40);
    const L = Object.assign(B.done(), { name: 'SPROCKET WORKS', zone: 1, act: 1, theme: 'works', start: 60 });
    dress(L, ['barrel', 'pipe', 'warn', 'pipe'], 160, 44); return L;
  }
  // ---- Candy Carnival: bumpers, jesters, bat-bots and big drops at night
  function carn1() {
    const B = builder(400);
    B.flat(400, s => { s.rings(140, 26, 6); s.o('mon', 330, 0, { it: 'rings' }); })
      .flat(300, s => { s.o('bumper', 120, 60); s.o('bumper', 200, 90); s.rings(100, 120, 5, 26); s.o('jester', 260, 0); })
      .curve(300, 120, s => { s.rings(40, 26, 8, 32); s.o('bat', 200, 90); })
      .flat(200, s => s.o('boost', 50, 0))
      .flat(420, s => { s.loop(90, 72); s.o('turtle', 330, 0); })
      .pit(340, s => { s.platAt(20, B.y - 20, 64, { swing: 1, r: 60, p: 3 }); s.platAt(190, B.y - 20, 64, { swing: 1, r: 60, p: 3, ph: 1.5 }); s.arc(20, -50, 9, 300, 60); s.o('bumper', 150, -70, { air: 1 }); })
      .flat(240, s => { s.o('post', 60, 0); s.o('jester', 180, 0); })
      .curve(360, -100, s => { s.o('bat', 160, 70); s.arc(60, 40, 6, 200, 40); })
      .flat(300, s => { s.o('spring', 60, 0, { pw: 'r' }); s.plat(150, 180, 110); s.o('mon', 200, 180, { it: 'shoes', onPlat: 1 }); s.rings(160, 205, 4); s.o('turtle', 240, 0); })
      .curve(440, 180, s => { s.rings(60, 26, 12, 30); s.o('bumper', 300, 50); })
      .flat(140, s => s.o('boost', 40, 0))
      .flat(500, s => { s.cork(40, 320); s.rings(60, 30, 12, 26); })
      .flat(260, s => { s.o('post', 40, 0); s.o('mon', 160, 0, { it: 'shield' }); s.o('jester', 220, 0); })
      .hills(880, 44, 2, s => { s.o('bumper', 210, 120); s.o('bumper', 650, 120); s.rings(80, 50, 6, 24); s.rings(520, 50, 6, 24); s.o('bat', 400, 100); })
      .pit(300, s => { s.platAt(30, B.y - 40, 60, { fall: 1 }); s.platAt(160, B.y - 60, 60, { dx: 0, dy: 40, p: 2.6 }); s.arc(30, -20, 8, 240, 60); })
      .flat(260, s => { s.o('turtle', 120, 0); s.o('spikes', 200, 0); })
      .curve(340, 120, s => { s.rings(40, 26, 10, 30); })
      .flat(140, s => s.o('boost', 40, 0))
      .flat(420, s => { s.loop(110, 70); s.rings(280, 26, 5); })
      .flat(420, s => { s.o('sign', 280, 0); s.rings(80, 26, 6); s.o('jester', 160, 0); })
      .step(-200).flat(40);
    const L = Object.assign(B.done(), { name: 'CANDY CARNIVAL', zone: 2, act: 0, theme: 'carn', start: 60 });
    dress(L, ['lamp', 'balloon', 'popcorn', 'lamp'], 170, 55); return L;
  }
  function carn2() {
    const B = builder(420);
    B.flat(380, s => { s.rings(130, 26, 6); s.o('mon', 300, 0, { it: 'stars' }); })
      .curve(340, 140, s => { s.rings(40, 26, 10, 30); s.o('bat', 240, 80); })
      .flat(260, s => { s.o('bumper', 80, 70); s.o('bumper', 150, 110); s.o('bumper', 220, 70); s.arc(60, 150, 7, 180, 30); })
      .pit(380, s => { s.platAt(20, B.y - 30, 60, { swing: 1, r: 70, p: 3.2 }); s.platAt(200, B.y - 30, 60, { swing: 1, r: 70, p: 3.2, ph: 1.6 }); s.arc(30, -60, 10, 320, 60); s.o('bumper', 170, -90, { air: 1 }); })
      .flat(240, s => { s.o('post', 40, 0); s.o('turtle', 120, 0); s.o('boost', 215, 0); })
      .ramp(290, -110).step(180).flat(80)
      .flat(320, s => { s.arc(-80, 150, 10, 300, 70); s.o('jester', 160, 0); s.o('jester', 230, 0); })
      .curve(420, 160, s => { s.rings(40, 26, 12, 32); s.o('bat', 280, 70); })
      .flat(150, s => s.o('boost', 40, 0))
      .flat(420, s => { s.loop(100, 72); s.o('turtle', 330, 0); })
      .flat(300, s => { s.o('spring', 80, 0, { pw: 'y', diag: 1 }); s.plat(200, 180, 120); s.o('mon', 240, 180, { it: 'life', onPlat: 1 }); s.rings(210, 206, 5); })
      .flat(260, s => { s.o('post', 60, 0); s.o('mon', 180, 0, { it: 'magnet' }); })
      .hills(900, 46, 2.5, s => { s.o('bumper', 180, 120); s.o('bumper', 540, 120); s.rings(60, 50, 8, 26); s.rings(620, 50, 8, 26); s.o('jester', 400, 0); s.o('bat', 700, 100); })
      .pit(340, s => { s.platAt(20, B.y - 40, 60, { fall: 1 }); s.platAt(140, B.y - 60, 60, { fall: 1 }); s.platAt(260, B.y - 40, 60, { fall: 1 }); s.arc(20, -20, 10, 300, 60); })
      .curve(400, 140, s => { s.rings(40, 26, 10, 30); })
      .flat(140, s => s.o('boost', 40, 0))
      .flat(520, s => { s.cork(40, 330); s.rings(60, 30, 12, 26); })
      .flat(300, s => { s.o('post', 80, 0); s.o('mon', 200, 0, { it: 'shield' }); })
      .flat(760, s => { s.o('boss', 140, 0, { kind: 2 }); })
      .flat(200).step(-200).flat(40);
    const L = Object.assign(B.done(), { name: 'CANDY CARNIVAL', zone: 2, act: 1, theme: 'carn', start: 60 });
    dress(L, ['lamp', 'balloon', 'popcorn', 'lamp'], 160, 66); return L;
  }
  // ---- the bonus stage: cloud platforms in a starry sky, rings everywhere
  function bonus(seed) {
    const R = rnd(seed), B = builder(360);
    B.flat(260, s => { s.rings(120, 30, 5); });
    for (let i = 0; i < 9; i++) B.pit(260, s => { const h = B.y - (i === 0 ? 0 : 30 + R() * 70); s.platAt(40, h, 70, R() < 0.3 ? { dx: 40, dy: 0, p: 2.4 } : null); s.arc(30, -(h - B.y) + 30, 6, 120, 40); if (i % 3 === 1) s.o('bumper', 200, -(h - B.y) + 60, { air: 1 }); if (i % 3 === 2) s.platAt(170, h - 50, 50); s.arc(150, -(h - B.y) + 90, 4, 80, 20); });
    B.flat(400, s => { s.rings(60, 30, 8, 26); s.o('gemspot', 300, 0); }).step(-200).flat(40);
    return Object.assign(B.done(), { name: 'BONUS STAGE', zone: 3, act: 0, theme: 'sky', start: 60, bonus: 1 });
  }
  // The second tour: deliberately authored routes, each built around a different skill.
  function canopy1(){const B=builder(400);
    B.flat(480,s=>{s.rings(170,26,8);s.o('mon',410,0,{it:'shield'})})
      .curve(380,-90,s=>s.rings(60,28,10,28))
      .flat(400,s=>{s.o('spring',90,0,{pw:'r'});s.plat(70,130,150);s.rings(85,156,6);s.plat(270,200,100);s.o('mon',290,200,{it:'life',onPlat:1});s.o('bee',250,100)})
      .curve(340,120,s=>{s.o('crab',110,0);s.arc(140,30,6,160,60)})
      .flat(500,s=>{s.o('boost',60,0);s.loop(180,72);s.o('post',440,0)})
      .flat(280,s=>{s.o('spikes',120,0);s.o('spring',70,0,{pw:'y',diag:1});s.arc(70,40,9,280,70)})
      .pit(260,s=>{s.platAt(40,B.y-40,80,{swing:1,r:48,p:3});s.platAt(180,B.y-25,70);s.o('bee',130,-60)})
      .flat(300,s=>{s.o('post',50,0);s.o('mon',200,0,{it:'shoes'})})
      .hills(900,58,2,s=>{s.rings(50,30,10,32);s.o('crab',450,0);s.rings(550,30,8,30)})
      .curve(300,-60).flat(480,s=>{s.cork(40,280);s.rings(40,30,10,28)})
      .flat(420,s=>s.o('sign',300,0)).step(-200).flat(40);
    return dressNew(B,'REDWOOD RELAY',3,0,'canopy',['fern','bush','flower'],71);
  }
  function canopy2(){const B=builder(460);
    B.flat(400,s=>{s.rings(150,26,6);s.o('mon',330,0,{it:'shield'})})
      .curve(300,-80,s=>{s.o('bee',180,70);s.arc(80,30,6,180,50)})
      .flat(400,s=>{s.o('spring',70,0,{pw:'r'});s.plat(60,160,140);s.plat(250,220,120);s.o('mon',270,220,{it:'magnet',onPlat:1});s.rings(75,186,5)})
      .curve(500,150,s=>s.rings(60,30,12,32))
      .flat(520,s=>{s.o('boost',40,0);s.loop(180,78);s.o('post',450,0)})
      .pit(360,s=>{s.platAt(15,B.y-10,90,{fall:1});s.platAt(150,B.y-40,80,{dx:30,dy:10,p:3});s.platAt(285,B.y-10,90);s.arc(40,20,10,280,70)})
      .flat(240,s=>{s.o('post',40,0);s.o('spring',180,0,{pw:'y',diag:1})})
      .hills(800,36,2,s=>{s.rings(20,36,8,30);s.o('turtle',370,0);s.o('bee',520,70);s.rings(580,30,6,26)})
      .flat(360,s=>{s.o('post',50,0);s.o('mon',180,0,{it:'rings'})})
      .flat(850,s=>s.o('boss',180,0,{kind:0})).step(-200).flat(40);
    return dressNew(B,'REDWOOD RELAY',3,1,'canopy',['fern','bush'],72);
  }
  function ruins1(){const B=builder(400);
    B.flat(400,s=>{s.rings(150,26,6);s.o('mon',340,0,{it:'shield'})})
      .curve(300,100,s=>s.rings(40,28,9,28))
      .flat(320,s=>{s.o('vent',100,0);s.col(100,40,7);s.plat(160,145,130);s.o('mon',200,145,{it:'rings',onPlat:1})})
      .pit(300,s=>{s.platAt(10,B.y-15,80);s.platAt(120,B.y-50,70,{dx:35,dy:0,p:3});s.platAt(230,B.y-15,80);s.arc(25,25,8,250,50);s.o('fish',140,-45,{pit:1})})
      .flat(300,s=>{s.o('post',40,0);s.o('spring',160,0,{pw:'r'});s.plat(100,150,150);s.rings(115,176,6)})
      .curve(360,-100,s=>{s.o('bat',190,70);s.rings(30,30,8,32)})
      .flat(420,s=>{s.o('crusher',150,0);s.o('crusher',300,0);s.arc(70,30,8,270,45)})
      .flat(320,s=>{s.o('post',40,0);s.o('boost',240,0)})
      .flat(500,s=>{s.loop(140,70);s.rings(340,30,6)})
      .hills(720,36,2,s=>{s.o('turtle',160,0);s.rings(240,40,9,32);s.o('spring',600,0,{pw:'y'})})
      .flat(420,s=>s.o('sign',300,0)).step(-200).flat(40);
    return dressNew(B,'DRIZZLE RUINS',4,0,'ruins',['statue','fern'],81);
  }
  function ruins2(){const B=builder(420);
    B.flat(380,s=>{s.rings(150,28,6);s.o('mon',320,0,{it:'shield'})})
      .curve(340,100,s=>s.rings(60,28,9,28))
      .flat(360,s=>{s.o('vent',80,0);s.plat(120,150,160);s.rings(130,176,6);s.o('bat',260,90)})
      .pit(320,s=>{s.platAt(20,B.y-10,85,{fall:1});s.platAt(140,B.y-55,80,{swing:1,r:35,p:3});s.platAt(260,B.y-10,80);s.arc(20,30,9,280,55)})
      .flat(280,s=>{s.o('post',30,0);s.o('mon',200,0,{it:'stars'})})
      .curve(400,-80,s=>{s.o('turtle',180,0);s.o('bat',290,80)})
      .flat(500,s=>{s.conv(30,400,-1.2);s.o('crusher',180,0);s.o('crusher',350,0);s.rings(30,35,12,30)})
      .flat(320,s=>{s.o('post',40,0);s.o('boost',210,0)})
      .flat(500,s=>{s.loop(140,74);s.o('mon',350,0,{it:'rings'})})
      .flat(850,s=>s.o('boss',180,0,{kind:1})).step(-200).flat(40);
    return dressNew(B,'DRIZZLE RUINS',4,1,'ruins',['statue','fern'],82);
  }
  function citadel1(){const B=builder(420);
    B.flat(400,s=>{s.rings(170,26,7);s.o('mon',350,0,{it:'shield'})})
      .curve(300,-80,s=>s.o('spark',180,0))
      .flat(420,s=>{s.conv(30,340,1.5);s.rings(30,30,12,28);s.o('spring',360,0,{pw:'y',diag:1})})
      .pit(300,s=>{s.platAt(40,B.y-40,85,{dx:35,dy:0,p:2});s.platAt(190,B.y-40,85,{dx:35,dy:0,p:2,ph:1});s.arc(10,50,9,280,40)})
      .flat(280,s=>{s.o('post',40,0);s.o('mon',160,0,{it:'shoes'});s.o('boost',240,0)})
      .flat(560,s=>{s.cork(40,320);s.rings(60,30,12,26);s.o('spring',450,0,{pw:'r'})})
      .curve(340,120,s=>s.rings(30,35,9,30))
      .flat(480,s=>{s.o('crusher',160,0);s.o('spark',280,0);s.o('crusher',380,0)})
      .flat(360,s=>{s.o('post',40,0);s.o('mon',180,0,{it:'stars'});s.o('boost',290,0)})
      .flat(520,s=>{s.loop(160,80);s.rings(350,30,6)})
      .flat(420,s=>s.o('sign',300,0)).step(-200).flat(40);
    return dressNew(B,'KETTLE CITADEL',5,0,'citadel',['antenna','pipe','warn'],91);
  }
  function citadel2(){const B=builder(440);
    B.flat(400,s=>{s.rings(160,26,7);s.o('mon',350,0,{it:'shield'})})
      .hills(680,42,2,s=>{s.rings(30,36,10,28);s.o('spark',400,0);s.o('bee',540,80)})
      .flat(300,s=>{s.o('post',40,0);s.o('spring',180,0,{pw:'r'});s.plat(140,150,140);s.o('mon',180,150,{it:'life',onPlat:1})})
      .pit(340,s=>{s.platAt(20,B.y-20,85,{fall:1});s.platAt(150,B.y-55,85,{dx:35,dy:0,p:3});s.platAt(270,B.y-15,85);s.arc(20,30,9,290,50)})
      .flat(480,s=>{s.conv(20,400,-1.3);s.o('crusher',140,0);s.o('crusher',300,0);s.rings(30,32,12,30)})
      .curve(360,120,s=>s.rings(30,30,10,30))
      .flat(240,s=>{s.o('post',40,0);s.o('mon',160,0,{it:'rings'})})
      .flat(520,s=>{s.o('boost',30,0);s.loop(180,78);s.o('spring',400,0,{pw:'y',diag:1})})
      .flat(400,s=>{s.o('spark',130,0);s.o('bee',240,80);s.rings(280,30,5)})
      .flat(340,s=>{s.o('post',40,0);s.o('mon',170,0,{it:'shield'});s.rings(230,26,4)})
      .flat(950,s=>s.o('boss',180,0,{kind:2})).step(-200).flat(40);
    return dressNew(B,'KETTLE CITADEL',5,1,'citadel',['antenna','pipe','warn'],92);
  }
  function dressNew(B,name,zone,act,theme,deco,seed){const L=Object.assign(B.done(),{name,zone,act,theme,start:60});dress(L,deco,170,seed);return L}
  const ACTS = [bay1, bay2, works1, works2, carn1, carn2, canopy1, canopy2, ruins1, ruins2, citadel1, citadel2];
  const ZONES = ['BLACKBERRY BAY', 'SPROCKET WORKS', 'CANDY CARNIVAL', 'REDWOOD RELAY', 'DRIZZLE RUINS', 'KETTLE CITADEL'];

  // ================================================================ backgrounds (Mega Glide style: flat bands, dithering, parallax)
  function dither(g, x, y, w, h, c1, c2) { g.fillStyle = c1; g.fillRect(x, y, w, h); g.fillStyle = c2; for (let yy = 0; yy < h; yy++) for (let xx = (yy % 2); xx < w; xx += 2) g.fillRect(x + xx, y + yy, 1, 1); }
  function bands(g, w, y0, cols, bh) { let y = y0; for (let i = 0; i < cols.length; i++) { g.fillStyle = cols[i]; g.fillRect(0, y, w, bh); if (i < cols.length - 1) dither(g, 0, y + bh - 2, w, 2, cols[i], cols[i + 1]); y += bh; } return y; }
  function backdrop(theme) {
    const L = [], R = rnd(theme.length * 77);
    const lay = (w, h, k, y, fn, o) => { const c = mk(w, h); fn(c.getContext('2d'), w, h); L.push(Object.assign({ c, k, y }, o || {})); };
    if(['canopy','ruins','citadel'].includes(theme)){
      const forest=theme==='canopy',ruins=theme==='ruins';
      lay(W,H,0,0,(g,w,h)=>bands(g,w,0,forest?['#183050','#305878','#608888','#98b898','#e0d0a0']:ruins?['#182840','#304858','#506878','#789098','#a8b8b0']:['#080c28','#181838','#302048','#603858','#a85860'],46),{fixed:1});
      lay(512,160,.08,12,(g,w,h)=>{
        for(let i=0;i<16;i++){
          const x=i*36-10,hh=60+R()*95;
          if(forest){rect(g,x,h-hh,10,hh,'#284858');for(let j=0;j<4;j++)ell(g,x+5+(j-1)*12,h-hh+25+j*5,23,30,'#386068')}
          else if(ruins){rect(g,x,h-hh,20,hh,'#405868');rect(g,x-3,h-hh,26,7,'#607888');g.fillStyle='#405868';g.beginPath();g.arc(x+30,h-hh+22,20,Math.PI,0);g.lineTo(x+50,h);g.lineTo(x+10,h);g.fill()}
          else{rect(g,x,h-hh,26,hh,'#28283c');rect(g,x+5,h-hh-12,3,12,'#484860');for(let y=h-hh+10;y<h;y+=12)rect(g,x+4,y,3,3,'#f0a040')}
        }
      });
      lay(512,120,.3,60,(g,w,h)=>{
        for(let i=0;i<8;i++){const x=i*70,hh=65+(i%3)*16;
          if(forest){rect(g,x+10,h-hh,16,hh,'#483830');rect(g,x+13,h-hh,3,hh,'#705040');for(let j=0;j<4;j++)ell(g,x+10+(j-1)*13,h-hh+5+(j%2)*8,26,18,j%2?'#306048':'#487858')}
          else if(ruins){rect(g,x,h-hh,18,hh,'#485860');rect(g,x+2,h-hh+2,3,hh-4,'#789098');rect(g,x-5,h-hh-4,28,8,'#809088');for(let y=0;y<hh;y+=16)rect(g,x,h-hh+y,18,2,'#303c48');ell(g,x,h-10,22,8,'#306858')}
          else{rect(g,x,h-hh,18,hh,'#303448');rect(g,x+3,h-hh,3,hh,'#586078');rect(g,x-2,h-hh+16,50,5,'#606878');for(let k=0;k<3;k++){rect(g,x+24+k*5,h-hh+24+k*4,3,16,'#d89038')}}
        }
      });
      return L;
    }
    if (theme === 'bay') {
      lay(W, H, 0, 0, (g, w, h) => bands(g, w, 0, ['#1c3cc8', '#2448d8', '#2c5ce8', '#3c74f0', '#5890f8', '#78acf8', '#98c4f8'], 22), { fixed: 1 });
      lay(512, 70, 0.04, 6, (g, w) => { for (let i = 0; i < 7; i++) { const x = i * 74 + R() * 20, y = 10 + (i % 3) * 16, s = 0.7 + R() * 0.6; for (let j = 0; j < 5; j++) { ell(g, x + j * 9 * s, y + (j % 2) * 3, 11 * s, 6 * s, '#ffffff'); } g.fillStyle = '#c8dcf8'; g.fillRect(x - 6, y + 4 * s, 50 * s, 2); } });
      lay(512, 70, 0.1, 44, (g, w, h) => { g.fillStyle = '#6870c0'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, 24 + Math.abs(Math.sin(x / 60)) * -18 + Math.sin(x / 23) * 4 + 16); g.lineTo(w, h); g.fill(); g.fillStyle = '#e8f0ff'; for (let x = 0; x < w; x += 120) { g.beginPath(); g.moveTo(x + 50, 23); g.lineTo(x + 60, 16); g.lineTo(x + 70, 23); g.fill(); } dither(g, 0, 44, w, 26, '#5860b0', '#6870c0'); });
      lay(512, 40, 0.18, 92, (g, w, h) => { g.fillStyle = '#2860d0'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) for (let x = (y * 7) % 23; x < w; x += 23 + (y % 4) * 5) { g.fillStyle = y < 12 ? '#a8d0ff' : '#68a0f0'; g.fillRect(x, y, 6 + (y % 3) * 2, 1); } }, { water: 1 });
      lay(512, 90, 0.42, 86, (g, w, h) => { // checkered hills with palms and a waterfall
        g.fillStyle = '#2a8a2a'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 4) g.lineTo(x, 26 + Math.sin(x / 70) * 16 + Math.sin(x / 19) * 3); g.lineTo(w, h); g.fill();
        g.save(); g.clip(); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) if (((x + y) / 8) % 2) { g.fillStyle = '#1e6e22'; g.fillRect(x, y, 8, 8); } g.restore();
        g.fillStyle = '#145a18'; g.fillRect(296, 24, 22, 66);
        for (const px of [60, 200, 420]) { g.fillStyle = '#8a5a2a'; for (let i = 0; i < 9; i++) g.fillRect(px + i * 0.6, 10 + i * 3, 4, 3); g.fillStyle = '#1a9a2a'; for (let a = 0; a < 5; a++) { g.beginPath(); g.ellipse(px + 2 + Math.cos(a * 1.3) * 9, 10 + Math.sin(a * 1.3) * 3, 10, 3, a * 1.3, 0, 7); g.fill(); } }
      }, { fall: [298, 26, 64] });
    } else if (theme === 'works') {
      lay(W, H, 0, 0, (g, w, h) => bands(g, w, 0, ['#281038', '#401848', '#602040', '#882838', '#b04030', '#d06030', '#e88838', '#f0a840'], 18), { fixed: 1 });
      lay(512, 120, 0.08, 10, (g, w, h) => { g.fillStyle = '#381838'; for (let i = 0; i < 12; i++) { const x = i * 44 + R() * 10, hh = 40 + R() * 60; g.fillRect(x, h - hh, 30, hh); if (i % 3 === 0) { g.fillRect(x + 8, h - hh - 36, 8, 36); g.fillStyle = 'rgba(200,180,200,.25)'; g.beginPath(); g.arc(x + 12, h - hh - 44, 8, 0, 7); g.fill(); g.fillStyle = '#381838'; } } g.fillStyle = '#f8c040'; for (let i = 0; i < 40; i++) g.fillRect(R() * w, 50 + R() * 60, 2, 2); });
      lay(512, 100, 0.25, 50, (g, w, h) => { g.fillStyle = '#281830'; g.fillRect(0, 40, w, 60); g.fillStyle = '#483858'; for (let x = 0; x < w; x += 64) { g.fillRect(x, 16, 10, 84); g.fillRect(x, 36, 64, 6); for (let k = 0; k < 6; k++) g.fillRect(x + 10 + k * 9, 42 + (k % 2) * 6, 2, 12); } }, { gears: 1 });
    } else if (theme === 'carn') {
      lay(W, H, 0, 0, (g, w, h) => { bands(g, w, 0, ['#080418', '#100828', '#180c38', '#281048', '#381458', '#481868', '#5a2070'], 32); for (let i = 0; i < 80; i++) { g.fillStyle = R() < 0.2 ? '#f8f8a0' : '#ffffff'; g.fillRect(R() * w, R() * 140, 1, 1); } ell(g, 260, 34, 14, 14, '#f8f0c8'); ell(g, 266, 30, 12, 12, '#100828'); }, { fixed: 1 });
      lay(512, 110, 0.1, 22, (g, w, h) => { for (let i = 0; i < 4; i++) { const x = i * 130 + 20; const cols = ['#d82848', '#2858d8', '#d8a828', '#28a858'][i]; g.fillStyle = cols; g.beginPath(); g.moveTo(x, h); g.lineTo(x + 10, 50); g.lineTo(x + 45, 18); g.lineTo(x + 80, 50); g.lineTo(x + 90, h); g.fill(); g.fillStyle = '#f0e8e0'; for (let s = 0; s < 4; s++) { g.beginPath(); g.moveTo(x + 45, 18); g.lineTo(x + 14 + s * 22, h); g.lineTo(x + 22 + s * 22, h); g.fill(); } g.fillStyle = '#f8d020'; g.fillRect(x + 43, 6, 4, 14); } });
      lay(512, 120, 0.22, 12, (g, w, h) => { g.strokeStyle = '#a868d8'; g.lineWidth = 2; g.beginPath(); g.arc(380, 60, 50, 0, 7); g.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(380, 60); g.lineTo(380 + Math.cos(a) * 50, 60 + Math.sin(a) * 50); g.stroke(); g.fillStyle = ['#f048a0', '#40d8c0', '#f8d020'][k % 3]; g.fillRect(376 + Math.cos(a) * 50, 56 + Math.sin(a) * 50, 8, 8); } g.fillStyle = '#382050'; g.fillRect(372, 60, 16, 60); g.fillStyle = '#2a1840'; g.fillRect(0, 100, w, 20); for (let x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#f848a0' : '#40e8d0'; g.fillRect(x + 4, 96, 4, 4); } }, { wheel: [380, 60, 50] });
    } else {
      lay(W, H, 0, 0, (g, w, h) => { bands(g, w, 0, ['#281058', '#40187a', '#60209a', '#8a30b0', '#b048c0', '#d070c8', '#f0a0d0'], 32); for (let i = 0; i < 60; i++) { g.fillStyle = '#fff'; g.fillRect(R() * w, R() * 120, 1, 1); } }, { fixed: 1 });
      lay(512, 60, 0.15, 96, (g, w) => { for (let i = 0; i < 8; i++) { const x = i * 64 + R() * 20; for (let j = 0; j < 4; j++) ell(g, x + j * 10, 30 + (j % 2) * 4, 14, 9, '#f8e0f0'); } });
    }
    return L;
  }
  function groundPat(theme) {
    const c = mk(32, 32), x = c.getContext('2d');
    if(['canopy','ruins','citadel'].includes(theme)){
      const cols=theme==='canopy'?['#504030','#705838','#907048']:theme==='ruins'?['#384850','#586870','#889898']:['#282c40','#484c60','#80889c'];
      x.fillStyle=cols[0];x.fillRect(0,0,32,32);
      for(let y=0;y<32;y+=8)for(let a=0;a<32;a+=16){x.fillStyle=cols[1];x.fillRect(a+(y%16?0:2),y+1,13,6);x.fillStyle=cols[2];x.fillRect(a+3,y+1,10,1)}
      if(theme==='canopy'){x.fillStyle='#302c28';for(let i=0;i<6;i++)x.fillRect((i*7)%32,2+i*5,1,9)}
    }
    else if (theme === 'bay') { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const a = (i + j) % 2; x.fillStyle = a ? '#b86828' : '#8a4818'; x.fillRect(i * 16, j * 16, 16, 16); x.fillStyle = a ? '#d88838' : '#a05820'; x.fillRect(i * 16, j * 16, 16, 2); x.fillRect(i * 16, j * 16, 2, 16); x.fillStyle = a ? '#884018' : '#683008'; x.fillRect(i * 16, j * 16 + 14, 16, 2); x.fillRect(i * 16 + 14, j * 16, 2, 16); } }
    else if (theme === 'works') { x.fillStyle = '#585868'; x.fillRect(0, 0, 32, 32); x.fillStyle = '#707084'; x.fillRect(1, 1, 30, 14); x.fillRect(1, 17, 14, 14); x.fillRect(17, 17, 14, 14); x.fillStyle = '#9898a8'; for (const [a, b] of [[3, 3], [28, 3], [3, 19], [12, 19], [19, 19], [28, 28]]) x.fillRect(a, b, 2, 2); x.fillStyle = '#383848'; x.fillRect(0, 15, 32, 2); x.fillRect(15, 17, 2, 15); }
    else if (theme === 'carn') { for (let i = -32; i < 64; i += 8) { x.fillStyle = (i / 8) % 2 ? '#e84898' : '#f8e8f0'; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 8, 0); x.lineTo(i + 40, 32); x.lineTo(i + 32, 32); x.fill(); } x.fillStyle = 'rgba(40,0,40,.25)'; x.fillRect(0, 30, 32, 2); }
    else { x.fillStyle = '#f8e8f8'; x.fillRect(0, 0, 32, 32); x.fillStyle = '#e8c8e8'; x.fillRect(0, 20, 32, 12); }
    return c;
  }
  const TOP = { canopy:['#20382c','#588848','#b8c878'],ruins:['#283c40','#709080','#b0c8a0'],citadel:['#202438','#a0a8b8','#e0c878'],bay: ['#0a5a14', '#30b030', '#90f060'], works: ['#202028', '#d8b020', '#f8e070'], carn: ['#401040', '#f8d020', '#fff8a0'], sky: ['#c8a0c8', '#ffffff', '#ffffff'] };
  function decoFrames() {
    const D = {};
    D.fern=[pixel(40,36,g=>{for(let i=0;i<7;i++){const a=-Math.PI*.9+i*.42;limb(g,20,34,20+Math.cos(a)*18,12+Math.sin(a)*8,2,C('n'));for(let j=1;j<5;j++){const x=20+Math.cos(a)*j*3,y=34+(12+Math.sin(a)*8-34)*j/5;ell(g,x,y,5,1.8,j%2?C('N'):C('n'),a)}}})];
    D.statue=[pixel(36,64,g=>{rect(g,3,56,30,8,C('s'));rect(g,7,50,22,6,C('S'));rect(g,10,22,16,28,C('s'));rect(g,10,22,4,28,C('S'));ball3(g,18,15,12,13,C('S'),C('s'),C('w'));rect(g,8,10,20,4,C('D'));rect(g,12,12,3,5,C('C'));rect(g,22,12,3,5,C('C'));rect(g,14,23,10,2,C('D'));ell(g,10,55,9,4,C('n'))})];
    D.antenna=[pixel(36,68,g=>{rect(g,15,15,6,50,C('s'));rect(g,16,15,2,50,C('S'));for(let i=0;i<5;i++)rect(g,4+i*2,15+i*8,28-i*4,2,C('S'));ell(g,18,8,6,6,C('R'));ell(g,16,6,2,2,C('Y'));rect(g,9,63,18,5,C('D'))})];
    D.flower = [0, 1].map(f => pixel(16, 28, g => { limb(g, 8, 27, 8, 12, 1.6, C('n')); ell(g, 4 + f, 20, 3.6, 1.6, C('N'), -0.4); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + f * 0.5; ell(g, 8 + Math.cos(a) * 4, 8 + Math.sin(a) * 4, 2.6, 2.6, C('Y')); } ell(g, 8, 8, 2.6, 2.6, C('o')); }));
    D.bush = [pixel(48, 24, g => { for (let k = 0; k < 6; k++) ball3(g, 8 + k * 7, 15 - (k % 2) * 4, 9, 8, C('N'), C('n'), null); for (let k = 0; k < 10; k++) ell(g, 6 + k * 4, 10 + (k % 3) * 4, 1.6, 1.6, C('V')); })];
    D.palm = [pixel(48, 72, g => { for (let i = 0; i < 12; i++) ball3(g, 22 + Math.sin(i / 4) * 3, 70 - i * 5, 3.6, 3, C('o'), C('g'), null); for (let a = 0; a < 6; a++) { const q = -Math.PI + a / 5 * Math.PI; g.fillStyle = a % 2 ? C('N') : C('n'); g.beginPath(); g.moveTo(22, 12); g.quadraticCurveTo(22 + Math.cos(q) * 14, 4 + Math.sin(q) * 10, 22 + Math.cos(q) * 24, 18 + Math.sin(q) * 6); g.quadraticCurveTo(22 + Math.cos(q) * 10, 12 + Math.sin(q) * 4, 22, 14); g.fill(); } ball3(g, 21, 14, 2.6, 2.6, C('g'), C('k'), null); ball3(g, 25, 15, 2.6, 2.6, C('g'), C('k'), null); })];
    D.totem = [pixel(20, 56, g => { for (let i = 0; i < 4; i++) { ball3(g, 10, 50 - i * 13, 8, 6.6, i % 2 ? C('O') : C('Y'), C('o'), null); ell(g, 7, 48 - i * 13, 1.6, 1.6, C('k')); ell(g, 13, 48 - i * 13, 1.6, 1.6, C('k')); rect(g, 6, 52 - i * 13, 8, 1.4, C('k')); } poly(g, [2, 8, 10, 0, 18, 8], C('N')); })];
    D.sign0 = [pixel(32, 40, g => { rect(g, 14, 18, 4, 22, C('o')); rect(g, 2, 2, 28, 18, C('W')); rect(g, 2, 18, 28, 2, C('w')); poly(g, [8, 11, 18, 5, 18, 8, 25, 8, 25, 14, 18, 14, 18, 17], C('R')); })];
    D.barrel = [pixel(20, 26, g => { ball3(g, 10, 13, 8, 11, C('R'), C('r'), C('W')); rect(g, 2, 7, 16, 2, C('D')); rect(g, 2, 17, 16, 2, C('D')); ell(g, 10, 13, 3, 3, C('Y')); })];
    D.pipe = [pixel(40, 40, g => { rect(g, 4, 0, 10, 40, C('S')); rect(g, 4, 0, 3, 40, C('W')); rect(g, 2, 12, 14, 4, C('s')); rect(g, 14, 22, 26, 10, C('S')); rect(g, 14, 22, 26, 3, C('W')); rect(g, 26, 20, 4, 14, C('s')); })];
    D.warn = [pixel(24, 36, g => { rect(g, 10, 14, 4, 22, C('s')); poly(g, [12, 1, 23, 20, 1, 20], C('Y')); poly(g, [12, 4, 20, 18, 4, 18], C('k')); poly(g, [12, 6, 18, 17, 6, 17], C('Y')); rect(g, 11, 9, 2, 5, C('k')); rect(g, 11, 15, 2, 1.6, C('k')); })];
    D.lamp = [0, 1].map(f => pixel(16, 56, g => { rect(g, 6.4, 12, 3.2, 44, C('D')); rect(g, 3, 52, 10, 4, C('D')); ell(g, 8, 8, 6, 6, f ? C('Y') : C('O')); ell(g, 8, 7, 3, 3, C('W')); }));
    D.balloon = [0, 1].map(f => pixel(28, 48, g => { limb(g, 14, 47, 14 + (f ? 1 : -1), 24, 1, C('W')); for (let k = 0; k < 3; k++) ball3(g, 6 + k * 8, 14 - (k % 2) * 6, 6, 7.6, C(['M', 'C', 'Y'][k]), C(['V', 'o', 'y'][k]), C('W')); }));
    D.popcorn = [pixel(32, 40, g => { rect(g, 4, 18, 24, 22, C('R')); for (let x = 4; x < 28; x += 6) rect(g, x, 18, 3, 22, C('W')); poly(g, [2, 18, 16, 4, 30, 18], C('Y')); for (let k = 0; k < 8; k++) ell(g, 8 + (k % 4) * 5, 12 + (k >> 2) * 3, 2.4, 2.2, C('W')); })];
    return D;
  }
  // ---- music (original): lead + bass in 16th notes
  const R_ = 0, Hd = -1;
  const SONGS = {
    bay: { bpm: 152, wave: 'square', bassWave: 'sawtooth', vol: 0.05, drums: 'o.x.o.x.o.x.oxx.',
      lead: [76, Hd, 79, Hd, 81, Hd, 79, 76, Hd, Hd, 74, Hd, 76, Hd, R_, R_, 72, Hd, 74, Hd, 76, Hd, 79, Hd, 74, Hd, Hd, Hd, R_, R_, R_, R_,
        76, Hd, 79, Hd, 81, Hd, 83, 84, Hd, Hd, 83, Hd, 81, Hd, R_, 79, 81, Hd, 79, 76, Hd, 74, 72, Hd, 74, Hd, Hd, Hd, Hd, Hd, R_, R_],
      bass: [45, R_, 45, 57, R_, 45, 57, R_, 41, R_, 41, 53, R_, 41, 53, R_, 43, R_, 43, 55, R_, 43, 55, R_, 40, R_, 40, 52, R_, 43, 55, R_] },
    works: { bpm: 140, wave: 'sawtooth', bassWave: 'square', vol: 0.04, drums: 'o..xo.x.o..xo.xx',
      lead: [69, R_, 72, R_, 74, 76, R_, 74, 72, R_, 69, R_, 67, Hd, 69, R_, 69, R_, 72, R_, 74, 76, R_, 79, 76, Hd, 74, Hd, 72, Hd, R_, R_,
        81, Hd, 79, R_, 76, Hd, 74, R_, 72, 74, 76, R_, 74, Hd, 72, R_, 69, R_, 72, R_, 74, R_, 67, R_, 69, Hd, Hd, Hd, R_, R_, R_, R_],
      bass: [33, 33, R_, 45, 33, R_, 43, 45, 31, 31, R_, 43, 31, R_, 41, 43, 29, 29, R_, 41, 29, R_, 39, 41, 28, 28, R_, 40, 31, R_, 43, 44] },
    carn: { bpm: 168, wave: 'square', bassWave: 'triangle', vol: 0.05, drums: 'o.xxo.x.o.xxo.xo',
      lead: [72, R_, 76, 79, Hd, 76, 72, R_, 74, R_, 77, 81, Hd, 77, 74, R_, 76, R_, 79, 84, Hd, 83, 81, 79, 77, Hd, 76, Hd, 74, Hd, R_, R_,
        72, R_, 76, 79, Hd, 76, 72, R_, 71, R_, 74, 77, Hd, 74, 71, R_, 72, 74, 76, 77, 79, 81, 83, 84, Hd, Hd, 79, Hd, 72, Hd, R_, R_],
      bass: [48, R_, 55, R_, 52, R_, 55, R_, 50, R_, 57, R_, 53, R_, 57, R_, 52, R_, 59, R_, 55, R_, 59, R_, 50, R_, 55, R_, 43, R_, 47, R_] },
    boss: { bpm: 176, wave: 'sawtooth', bassWave: 'square', vol: 0.045, drums: 'oxxoxxoxoxxoxxox',
      lead: [64, Hd, 63, Hd, 64, R_, 67, R_, 66, Hd, 65, Hd, 64, R_, 59, R_, 64, Hd, 63, Hd, 64, R_, 69, R_, 67, Hd, 66, Hd, 64, Hd, R_, R_],
      bass: [40, 40, 52, 40, 40, 52, 40, 52, 41, 41, 53, 41, 41, 53, 41, 53] },
    sky: { bpm: 120, wave: 'triangle', bassWave: 'sine', vol: 0.07, drums: 'o...x...o.o.x...',
      lead: [79, Hd, 84, Hd, 83, 81, 79, Hd, 76, Hd, 79, Hd, 74, Hd, Hd, Hd, 77, Hd, 81, Hd, 79, 77, 76, Hd, 72, Hd, 74, Hd, 76, Hd, Hd, Hd],
      bass: [48, R_, 55, R_, 52, R_, 55, R_, 45, R_, 52, R_, 47, R_, 52, R_] },
    shoes: { bpm: 200, wave: 'square', bassWave: 'sawtooth', vol: 0.05, drums: 'oxoxoxox', lead: [84, 81, 79, 81, 84, 86, 88, 86, 84, 81, 79, 76, 79, 81, 79, 76], bass: [45, 57, 45, 57, 43, 55, 43, 55] },
    title: { bpm: 132, wave: 'square', bassWave: 'triangle', vol: 0.05, drums: 'o.x.o.xxo.x.o.x.',
      lead: [72, Hd, 76, Hd, 79, Hd, 84, Hd, Hd, Hd, 83, 81, 79, Hd, 76, Hd, 77, Hd, 81, Hd, 84, Hd, 86, Hd, Hd, Hd, 84, Hd, Hd, Hd, R_, R_],
      bass: [48, R_, 48, R_, 52, R_, 55, R_, 53, R_, 53, R_, 50, R_, 55, R_] },
  };
  for(const [name,lead,bass,bpm] of [
    ['canopy',[76,79,83,81,79,0,76,74,72,-1,76,79,81,-1,79,0],[40,0,52,0,43,0,55,0,36,0,48,0,38,0,50,0],148],
    ['ruins',[69,-1,72,74,76,-1,74,72,67,-1,71,72,74,-1,72,0],[33,0,45,0,36,0,48,0,31,0,43,0,38,0,50,0],124],
    ['citadel',[64,0,67,70,69,0,64,62,64,67,72,71,70,67,64,0],[28,28,40,0,31,31,43,0,26,26,38,0,28,28,40,0],166]
  ])SONGS[name]={bpm,wave:'square',bassWave:'triangle',vol:.04,lead,bass,drums:'o.x.o.xxo.x.oxx.'};
  const ZSONG = ['bay', 'works', 'carn', 'canopy', 'ruins', 'citadel'];
  // ================================================================ the game
  let ART = null;
  function art() { if (!ART) ART = { Z: zipFrames(), O: objFrames(), D: decoFrames() }; return ART; }
  // HUD lettering: a chunky italic yellow, boiled down to pixels like everything else
  const labelCache = {};
  function label(text, col, size) { const k = text + col + size; if (labelCache[k]) return labelCache[k]; const w = Math.ceil(text.length * size * 0.72) + 6, h = size + 6; return labelCache[k] = pixel(w, h, g => { g.font = `italic 900 ${size}px Arial Black,Arial,sans-serif`; g.textBaseline = 'top'; g.fillStyle = C('o'); g.fillText(text, 3.5, 2.6); g.fillStyle = C(col); g.fillText(text, 3, 2); }); }
  const digitsCache = {};
  function digit(ch) { return digitsCache[ch] || (digitsCache[ch] = pixel(10, 14, g => { g.font = 'italic 900 12px Arial Black,Arial,sans-serif'; g.textBaseline = 'top'; g.fillStyle = C('w'); g.fillText(ch, 1.6, 1.6); g.fillStyle = C('W'); g.fillText(ch, 1, 1); })); }
  function num(g, s, x, y, right) { s = String(s); if (right) x -= s.length * 9; for (let i = 0; i < s.length; i++) g.drawImage(digit(s[i]), x + i * 9, y); }

  TV.game(GID, {
    buttons: ['a', 'b', 'c'],
    help: 'Run: arrows. Jump: Z, X or C. Roll: Down while running. Spin dash: hold Down, press jump, let go. Pause: Enter.',
    make(K) {
      const g = K.g, F = K.font, A = art(), Z = A.Z, O = A.O, D = A.D, sfx = K.sfx;
      g.imageSmoothingEnabled = false;
      // ---- the save: how far you've got, Time Stones, best times, the high-score table, options
      const sv = Object.assign({ top: 0, gems: [0, 0, 0, 0, 0, 0], best: {}, opts: {}, cont: null, sel: 0 }, K.load() || {});
      sv.opts = Object.assign({ music: 1, easy: 0 }, sv.opts);
      if (!Array.isArray(sv.hi)) sv.hi = [['DAVE', 61200], ['LUKE', 48800], ['CALLUM', 40100], ['JACKK', 33500], [castN('cousin', 'KIM').toUpperCase().slice(0, 8), 21000], [castN('kidPoke', 'SAM').toUpperCase().slice(0, 8), 15400], ['GUBBINZ', 9000], ['MOM', 3100]];
      const save = () => { try { K.save(sv); } catch (e) {} };
      let mode = 'title', menuT = 0, sel = 0, score = 0, lives = 3, actN = 0, L = null, bg = null, pat = null, reported = false, conts = 3;
      let levelSeed = 0;
      let P = null, cam = { x: 0, y: 0, lock: null }, time = 0, tally = null, rings = 0, shake = 0, msgT = 0, spawnX = 60, spawnT = 0, card = 0;
      let fx = [], loose = [], pops = [], shots = [];
      let superT=0;
      let paused = false, pmenu = 0, chain = 0, shoes = 0, shield = 0, inv = 0, stars = 0, attract = false, attractT = 0, idleT = 0, code = [], selOn = !!sv.selOn, timeAttack = false, bonusFrom = -1, bonusT = 0, nameEntry = null, ctrlLock = 0;
      const song = s => { if (sv.opts.music) K.music(SONGS[s]); else K.music(null); };
      const zsong = () => song(superT>0 || stars > 0 || shoes > 0 ? 'shoes' : L && L.boss && L.boss.on ? 'boss' : L ? (L.bonus?'sky':ZSONG[L.zone]) : 'title');
      const S = {
        jump() { sfx.tone(300, 0.18, 'square', 0.08, 0, 900); },
        ring() { sfx.tone(1568, 0.05, 'square', 0.06); sfx.tone(2093, 0.18, 'square', 0.06, 0.05); },
        spring() { sfx.tone(200, 0.35, 'square', 0.09, 0, 1200); sfx.tone(400, 0.2, 'triangle', 0.06, 0.05, 1600); },
        pop() { sfx.noise(0.25, 0.18, 1500, 0, 'lowpass', 200); sfx.tone(180, 0.15, 'square', 0.06, 0, 60); },
        hurt() { sfx.noise(0.3, 0.15, 800); sfx.tone(600, 0.4, 'sawtooth', 0.07, 0, 150); },
        lose() { for (let i = 0; i < 8; i++) sfx.tone(1900 - i * 120, 0.06, 'square', 0.05, i * 0.035); },
        rev(n) { sfx.tone(300 + n * 60, 0.2, 'sawtooth', 0.06, 0, 1400 + n * 100); },
        dash() { sfx.noise(0.35, 0.15, 3000, 0, 'bandpass', 600); },
        boost() { sfx.noise(0.3, 0.12, 4000, 0, 'highpass'); sfx.tone(500, 0.25, 'square', 0.05, 0, 1500); },
        post() { sfx.tone(1047, 0.1, 'square', 0.07); sfx.tone(1319, 0.1, 'square', 0.07, 0.1); sfx.tone(1568, 0.3, 'square', 0.07, 0.2); },
        mon() { sfx.noise(0.2, 0.12, 2500); sfx.tone(880, 0.1, 'square', 0.06, 0.08, 1320); },
        tick() { sfx.tone(1800, 0.03, 'square', 0.04); },
        die() { sfx.tone(700, 0.6, 'square', 0.08, 0, 100); },
        life() { sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]], { bpm: 240, vol: 0.08 }); },
        skid() { sfx.noise(0.15, 0.08, 1200, 0, 'bandpass'); },
        bump() { sfx.tone(520, 0.08, 'square', 0.07); sfx.tone(1040, 0.12, 'square', 0.06, 0.05); },
        boss() { sfx.noise(0.2, 0.2, 900); sfx.tone(140, 0.25, 'square', 0.09, 0, 60); },
        boom() { sfx.noise(0.5, 0.22, 600, 0, 'lowpass', 120); },
        warp() { for (let i = 0; i < 10; i++) sfx.tone(600 + i * 140, 0.06, 'triangle', 0.06, i * 0.04); },
      };
      // ---- the ground
      const gAt = x => { const i = Math.round(x); return i < 0 || i >= L.len ? (i < 0 ? L.hm[0] : Infinity) : L.hm[i]; };
      const floorAt = x => { const c = gAt(x); if (c < Infinity) return c; return Math.min(gAt(x - 6), gAt(x + 6)); };
      const angAt = x => { const c = gAt(x), a = gAt(x - 7), b = gAt(x + 7); if (c === Infinity) return 0; const okA = a < Infinity && Math.abs(a - c) < 11, okB = b < Infinity && Math.abs(b - c) < 11; return okA && okB ? Math.atan2(b - a, 14) : okA ? Math.atan2(c - a, 7) : okB ? Math.atan2(b - c, 7) : 0; };
      const convAt = x => { for (const c of L.conv) if (x >= c.x0 && x <= c.x1) return c.sp; return 0; };
      let maxY = 0;
      function loadAct(n, bonusSeed) {
        levelSeed = bonusSeed || 0;
        L = bonusSeed ? bonus(bonusSeed) : ACTS[n](); if (!bonusSeed) actN = n;
        maxY = 0; for (const v of L.hm) if (v < Infinity && v > maxY) maxY = v;
        bg = backdrop(L.theme); pat = g.createPattern(groundPat(L.theme), 'repeat'); L.camBase = floorAt(L.start) - 136;
        L.boss = null;
        for (const o of L.objs) { o.alive = true; o.t = Math.random() * 6; o.hx = o.x; o.hy = o.y; if (o.type === 'post') o.on = false; if (o.type === 'boss') L.boss = { o, x0: o.x - 20, on: false, hp: (o.kind === 2 ? 10 : 8) + (L.zone>=3?2:0), x: o.x + 200, y: o.y - 110, t: 0, hitT: 0, phase: 0, dead: false, deadT: 0, kind: o.kind, vx: 0, vy: 0 }; }
        for (const p of L.plats) { p.fallT = 0; p.gone = false; p.vy = 0; }
        spawnX = L.start; spawnT = 0; time = 0; rings = 0; cam.lock = null; fx = []; loose = []; pops = []; shots = [];
        respawn(); card = bonusSeed ? 0 : 3.2; msgT = 3;
        if (bonusSeed) { bonusT = 40; bonusDone = false; song('sky'); } else zsong();
        if (!bonusSeed && !timeAttack && !attract) { sv.cont = { act: n, score, lives }; if (n > sv.top) sv.top = n; save(); }
      }
      function respawn() {
        P = { x: spawnX, y: floorAt(spawnX), vx: 0, vy: 0, gsp: 0, ang: 0, ground: true, plat: null, dir: 1, ball: false, roll: false, crouch: false, rev: 0, revving: false,
          hurt: false, dead: false, deadT: 0, loop: null, spring: 0, skid: false, anim: 0, jumped: false, idle: 0, push: false, cork: 0 };
        rings = 0; time = spawnT; superT=0; inv = 0; shield = 0; shoes = 0; stars = 0; chain = 0; loose = []; ctrlLock = 0;
        cam.x = P.x - W / 2; cam.y = P.y - 140;
        if (L.boss && !L.boss.dead) { L.boss.on = false; L.boss.hp = (L.boss.kind === 2 ? 10 : 8)+(L.zone>=3?2:0); cam.lock = null; }
      }
      function hit(src) {
        if (inv > 0 || P.hurt || P.dead || stars > 0 || superT>0) return;
        P.loop = null; P.cork = 0;
        if (shield) { shield = 0; S.hurt(); P.hurt = true; P.ground = false; P.plat = null; P.vy = -4; P.vx = -2 * (src != null ? Math.sign(src - P.x) || P.dir : P.dir); P.ball = false; return; }
        if (rings > 0) {
          S.lose(); const n = Math.min(rings, 32);
          for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i % 2 ? 1 : -1) * (0.25 + (i >> 1) * 0.19), sp = i < 16 ? 4 : 2.2; loose.push({ x: P.x, y: P.y - 16, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0 }); }
          rings = sv.opts.easy ? 1 : 0; P.hurt = true; P.ground = false; P.plat = null; P.ball = false; P.roll = false; P.vy = -4; P.vx = -2 * (src != null ? Math.sign(src - P.x) || P.dir : P.dir); shake = 6;
        } else die();
      }
      function die() { if (P.dead) return; P.dead = true; P.deadT = 0; P.vy = -7; P.vx = 0; P.ground = false; P.loop = null; S.die(); K.music(null); }
      const MAXSC = 99999;
      function addScore(n, x, y) { score = Math.min(MAXSC, score + n); if (x != null) pops.push({ x, y, t: 0, txt: String(n) }); if (Math.floor((score) / 50000) > Math.floor((score - n) / 50000)) { lives++; S.life(); } }
      function popEnemy(o) {
        o.alive = false; S.pop(); shake = 3; chain++;
        const pts = [100, 200, 500, 1000][Math.min(3, chain - 1)]; addScore(pts, o.x, o.y - 20);
        fx.push({ kind: 'boom', x: o.x, y: o.y - 12, t: 0 }); fx.push({ kind: 'critter', x: o.x, y: o.y - 12, t: 0, vx: (Math.random() < 0.5 ? -1 : 1) * 1.6, vy: -4, k: (o.x | 0) % 3 });
      }
      // ---- the player (the classic constants: 1/64ths of a pixel)
      const isBall = () => P.ball || P.roll;
      const TOPS = () => superT>0 ? 10 : shoes > 0 ? 12 : 6;
      const bot = () => attract || window.__zipAI;
      const jumpPressed = () => !bot() ? (K.pressed('a') || K.pressed('b') || K.pressed('c')) : aiJump;
      const jumpHeld = () => !bot() ? (K.held('a') || K.held('b') || K.held('c')) : aiHold;
      let aiJump = false, aiHold = false, aiDir = 1;
      const held = b => bot() ? (b === 'right' ? aiDir > 0 : b === 'left' ? aiDir < 0 : b === 'down' ? aiDown : false) : K.held(b);
      let aiDown = false;
      function land(y, plat) {
        P.ground = true; P.plat = plat || null; P.y = y; chain = 0; P.ang = plat ? 0 : angAt(P.x);
        P.gsp = P.vx * Math.cos(P.ang) + P.vy * Math.sin(P.ang);
        if (P.hurt) { P.hurt = false; P.gsp = 0; inv = 120; }
        if (P.vy > 6) fx.push({ kind: 'dust', x: P.x, y: P.y, t: 0 });
        P.ball = false; P.spring = 0; P.jumped = false;
        if (P.roll && Math.abs(P.gsp) < 0.5) P.roll = false;
      }
      function stepPlayer() {
        if (P.dead) { P.deadT += 1 / 60; P.vy += 0.21875; P.y += P.vy; if (P.deadT > 2.4) { if (timeAttack) { loadAct(actN); return; } if (L.bonus) { endBonus(false); return; } lives--; if (lives < 0) { gameOver(); return; } respawn(); zsong(); } return; }
        if (ctrlLock > 0) ctrlLock--;
        const L1 = held('left') && !ctrlLock, R1 = held('right') && !ctrlLock, Dn = held('down'), U = held('up');
        const acc = shoes > 0 ? 0.09375 : 0.046875, dec = 0.5, frc = 0.046875;
        if (P.loop) return stepLoop();
        if (P.ground) {
          if (P.crouch) {
            if (jumpPressed()) { P.rev = Math.min(8, P.rev + 2); P.revving = true; S.rev(P.rev); fx.push({ kind: 'dust', x: P.x - P.dir * 10, y: P.y, t: 0 }); }
            P.rev *= 0.97;
            if (!Dn) { P.crouch = false; if (P.revving) { P.roll = true; P.gsp = (8 + Math.floor(P.rev) / 2) * P.dir; S.dash(); shake = 2; } P.revving = false; P.rev = 0; }
            return groundMove();
          }
          if (jumpPressed() && !P.hurt) {
            const sn = Math.sin(P.ang), cs = Math.cos(P.ang), J = superT>0?8:6.5;
            P.vx = P.gsp * cs + J * sn; P.vy = P.gsp * sn - J * cs; P.ground = false; P.plat = null; P.ball = true; P.roll = false; P.jumped = true; S.jump(); P.cork = 0;
            return airMove();
          }
          if (Dn && Math.abs(P.gsp) < 1 && !P.roll) { P.crouch = true; P.gsp = 0; return groundMove(); }
          if (Dn && Math.abs(P.gsp) >= 1 && !P.roll) { P.roll = true; S.dash(); }
          if (P.roll) {
            if ((L1 && P.gsp > 0) || (R1 && P.gsp < 0)) P.gsp -= Math.sign(P.gsp) * 0.125;
            P.gsp -= Math.sign(P.gsp) * Math.min(Math.abs(P.gsp), 0.0234375);
            const sn = Math.sin(P.ang); P.gsp += (Math.sign(P.gsp) === Math.sign(sn) ? 0.3125 : 0.078125) * sn;
            if (Math.abs(P.gsp) < 0.5) P.roll = false;
          } else {
            P.skid = false;
            if (L1) { if (P.gsp > 0) { P.gsp -= dec; if (P.gsp > 3) { P.skid = true; if (K.frame % 8 === 0) { S.skid(); fx.push({ kind: 'dust', x: P.x, y: P.y, t: 0 }); } } if (P.gsp < 0) P.gsp = -0.5; } else if (P.gsp > -TOPS()) P.gsp = Math.max(-TOPS(), P.gsp - acc); P.dir = -1; }
            else if (R1) { if (P.gsp < 0) { P.gsp += dec; if (P.gsp < -3) { P.skid = true; if (K.frame % 8 === 0) { S.skid(); fx.push({ kind: 'dust', x: P.x, y: P.y, t: 0 }); } } if (P.gsp > 0) P.gsp = 0.5; } else if (P.gsp < TOPS()) P.gsp = Math.min(TOPS(), P.gsp + acc); P.dir = 1; }
            else P.gsp -= Math.sign(P.gsp) * Math.min(Math.abs(P.gsp), frc);
            if (!P.plat) P.gsp += 0.125 * Math.sin(P.ang) * (Math.abs(P.ang) > 0.15 || Math.abs(P.gsp) > 0.1 ? 1 : 0);
          }
          P.gsp = clamp(P.gsp, -16, 16);
          P.idle = (!L1 && !R1 && !Dn && !U && Math.abs(P.gsp) < 0.05) ? P.idle + 1 : 0;
          return groundMove();
        }
        return airMove();
      }
      function groundMove() {
        if (P.plat) {
          const pl = P.plat; P.x += P.gsp + pl.dx; P.y = pl.y;
          if (pl.gone || P.x < pl.x - 4 || P.x > pl.x + pl.w + 4) { P.ground = false; P.plat = null; P.vx = P.gsp; P.vy = pl.dy; }
          if (pl.mv && pl.mv.fall && !pl.fallT) pl.fallT = 0.01;
          wallCheck(); return;
        }
        const ox = P.x, cs = Math.cos(P.ang);
        let nx = P.x + P.gsp * cs + convAt(P.x);
        const ny = floorAt(nx);
        P.push = false;
        if (ny < P.y - 16) { if (Math.abs(P.gsp) > 0.2) P.push = true; P.gsp = 0; nx = ox; }
        else if (ny === Infinity || ny - P.y > 6 + Math.abs(P.gsp) * 1.2) { P.x = nx; P.ground = false; P.vx = P.gsp * Math.cos(P.ang); P.vy = P.gsp * Math.sin(P.ang); if (P.roll) P.ball = true; P.roll = false; return; }
        else { P.x = nx; P.y = ny; P.ang = angAt(P.x); }
        if (P.x < 16) { P.x = 16; P.gsp = 0; }
        if (cam.lock) { if (P.x < cam.lock + 12) { P.x = cam.lock + 12; P.gsp = Math.max(0, P.gsp); } if (P.x > cam.lock + W - 12) { P.x = cam.lock + W - 12; P.gsp = Math.min(0, P.gsp); } }
        for (const lp of L.loops) if (ox < lp.x && P.x >= lp.x && P.gsp >= 4.5) { P.loop = { lp, th: 0 }; P.x = lp.x; P.y = lp.y; S.dash(); }
        // corkscrews: run through fast and Zip spins round the track
        P.cork = 0; for (const c of L.corks) if (P.x > c.x0 && P.x < c.x1 && Math.abs(P.gsp) > 4.5) P.cork = (P.x - c.x0) / (c.x1 - c.x0);
      }
      let loopsDone = 0;
      function stepLoop() {
        const lp = P.loop.lp, r = lp.r;
        P.gsp -= 0.21875 * Math.sin(P.loop.th) * 0.9;
        if (P.gsp < 2.2 && P.loop.th > Math.PI * 0.5 && P.loop.th < Math.PI * 1.5) { const th = P.loop.th; P.vx = P.gsp * Math.cos(th); P.vy = -P.gsp * Math.sin(th); P.loop = null; P.ground = false; P.ball = true; P.roll = false; return; }
        P.loop.th += Math.max(P.gsp, 2.2) / r;
        const th = P.loop.th;
        if (th >= Math.PI * 2) { P.loop = null; P.x = lp.x + 2; P.y = lp.y; P.ang = 0; loopsDone++; return; }
        P.x = lp.x + r * Math.sin(th); P.y = lp.y - r * (1 - Math.cos(th)); P.ang = -th;
        // rings in the loop get collected too
      }
      function airMove() {
        const L1 = held('left') && !ctrlLock, R1 = held('right') && !ctrlLock;
        if (!P.hurt) { const a = shoes > 0 ? 0.1875 : 0.09375; if (L1) { P.vx = Math.max(-TOPS() - 4, P.vx - a); P.dir = -1; } if (R1) { P.vx = Math.min(TOPS() + 4, P.vx + a); P.dir = 1; } }
        if (P.jumped && !jumpHeld() && P.vy < -4) P.vy = -4;
        if (P.vy < 0 && P.vy > -4) P.vx -= P.vx / 32 * 0.125 * 8;
        P.vy = Math.min(16, P.vy + (P.hurt ? 0.1875 : 0.21875));
        const ox = P.x; P.x += P.vx; P.y += P.vy;
        if (P.x < 16) { P.x = 16; P.vx = 0; }
        if (cam.lock) { if (P.x < cam.lock + 12) { P.x = cam.lock + 12; P.vx = Math.abs(P.vx) * 0.5; } if (P.x > cam.lock + W - 12) { P.x = cam.lock + W - 12; P.vx = -Math.abs(P.vx) * 0.5; } }
        wallCheck(ox);
        if (P.vy >= 0) for (const pl of L.plats) if (!pl.gone && P.x > pl.x - 4 && P.x < pl.x + pl.w + 4 && P.y >= pl.y && P.y - P.vy <= pl.y + 2 + Math.max(0, pl.dy)) { land(pl.y, pl); P.gsp = P.vx; return; }
        const fy = floorAt(P.x);
        if (fy < Infinity && P.y >= fy && P.vy >= -1) land(fy);
        if (P.y > maxY + 160) die();
      }
      function wallCheck(ox) { for (const s of [-9, 9]) { const fy = gAt(P.x + s); if (fy < P.y - 16 && fy > P.y - 400) { P.x = (ox != null ? ox : P.x - Math.sign(s)); if (P.ground) P.gsp = 0; else P.vx = 0; break; } } }
      // ---- the camera: leads the way you're going
      function camera() {
        if (cam.lock) { cam.x += (cam.lock - cam.x) * 0.1; }
        else { const lead = clamp((P.ground ? P.gsp : P.vx) * 14, -70, 70); cam.x += (P.x - W / 2 + lead - cam.x) * 0.12; }
        const look = (P.ground && !P.gsp && held('up')) ? -60 : (P.crouch && !P.revving) ? 50 : 0;
        const ty = P.y - 136 + look;
        if (P.ground || P.loop) cam.y += (ty - cam.y) * 0.12; else { if (P.y - cam.y < 70) cam.y = P.y - 70; if (P.y - cam.y > 176) cam.y = P.y - 176; }
        cam.x = clamp(cam.x, 0, L.len - W); cam.y = clamp(cam.y, -260, maxY + 60 - H);
      }
      // ---- the things in the level
      const near = (o, rx, ry) => Math.abs(o.x - P.x) < rx && Math.abs((o.y - 10) - (P.y - (isBall() ? 10 : 15))) < ry;
      const ENEMY = { crab: 1, bee: 1, fish: 1, roll: 1, spark: 1, jester: 1, turtle: 1, bat: 1 };
      function objects() {
        const dt = 1 / 60;
        for (const pl of L.plats) {
          if (pl.gone) { pl.fallT += dt; if (pl.fallT > 4 && Math.abs(pl.x0 - P.x) > 300) { pl.gone = false; pl.fallT = 0; pl.y = pl.y0; pl.vy = 0; } continue; }
          if (!pl.mv) { pl.dx = pl.dy = 0; continue; }
          if (pl.mv.fall) { pl.dx = 0; if (pl.fallT > 0) { pl.fallT += dt; if (pl.fallT > 0.5) { pl.vy += 0.3; pl.dy = pl.vy; pl.y += pl.vy; if (pl.y > maxY + 200) { pl.gone = true; pl.fallT = 0; } } else pl.dy = 0; } else pl.dy = 0; continue; }
          if (pl.mv.swing) { const a = Math.sin(time * Math.PI * 2 / pl.mv.p + (pl.mv.ph || 0)) * 1.1, nx = pl.x0 + Math.sin(a) * pl.mv.r, ny = pl.y0 - pl.mv.r + Math.cos(a) * pl.mv.r; pl.dx = nx - pl.x; pl.dy = ny - pl.y; pl.x = nx; pl.y = ny; continue; }
          const t = (time / pl.mv.p + (pl.mv.ph || 0) / pl.mv.p) * Math.PI * 2, nx = pl.x0 + Math.sin(t) * pl.mv.dx, ny = pl.y0 + Math.sin(t) * pl.mv.dy; pl.dx = nx - pl.x; pl.dy = ny - pl.y; pl.x = nx; pl.y = ny;
        }
        for (const o of L.objs) {
          if (!o.alive || Math.abs(o.x - P.x) > 440) continue;
          o.t += dt;
          if (o.type === 'ring') { if (shield === 3 && Math.hypot(o.x - P.x, o.y - P.y) < 80) { o.mag = 1; } if (o.mag) { const dx = P.x - o.x, dy = P.y - 12 - o.y, d = Math.hypot(dx, dy) || 1; o.x += dx / d * 5; o.y += dy / d * 5; }
            if (!P.dead && (near(o, 13, 17) || (P.loop && Math.hypot(o.x - P.x, o.y - P.y) < 22))) { o.alive = false; rings++; S.ring(); fx.push({ kind: 'spark', x: o.x, y: o.y - 8, t: 0 }); if (rings % 100 === 0) { lives++; S.life(); } } continue; }
          // badniks
          if (o.type === 'crab') { o.x = o.hx + Math.sin(o.t * 0.8) * 50; o.y = floorAt(o.x); o.f = (o.t * 4 | 0) % 2; if ((o.t % 4) < 0.02 && Math.abs(o.x - P.x) < 200) { shots.push({ x: o.x - 12, y: o.y - 18, vx: -1.4, vy: -4.6, t: 0 }); shots.push({ x: o.x + 12, y: o.y - 18, vx: 1.4, vy: -4.6, t: 0 }); } }
          else if (o.type === 'bee') { const close = Math.abs(o.x - P.x) < 110 && !P.dead; if (!close || o.fired > 0) o.x = o.hx + Math.sin(o.t * 0.9) * 70; o.y = floorAt(o.hx) - 70 + Math.sin(o.t * 3) * 6; o.f = (o.t * 20 | 0) % 2; o.dir = P.x > o.x ? 1 : -1; o.fired = (o.fired || 0) - dt; if (close && o.fired <= 0) { o.fired = 2.2; const dx = P.x - o.x, dy = P.y - 14 - o.y, d = Math.hypot(dx, dy) || 1; shots.push({ x: o.x, y: o.y, vx: dx / d * 2.6, vy: dy / d * 2.6, t: 0, sting: 1 }); } }
          else if (o.type === 'fish') { const ph = (o.t % 3.2) / 3.2; o.y = o.hy + 60 - Math.sin(Math.min(1, ph * 1.6) * Math.PI) * 150; o.f = ph < 0.3 ? 0 : 1; o.up = ph < 0.31; }
          else if (o.type === 'roll') { const d = P.x - o.x; if (Math.abs(d) < 160 && !P.dead) { o.ballT = 1; o.vx = clamp((o.vx || 0) + Math.sign(d) * 0.1, -3, 3); } else { o.ballT = Math.max(0, (o.ballT || 0) - dt); o.vx = (o.vx || 0) * 0.95; if (!o.ballT) o.x += Math.sin(o.t) * 0.4; } const nx = o.x + (o.vx || 0); if (Math.abs(floorAt(nx) - o.y) < 12) o.x = nx; else o.vx = 0; o.y = floorAt(o.x); o.f = ((o.x / 6) | 0) & 3; }
          else if (o.type === 'spark') { o.y = o.hy + Math.sin(o.t * 2) * 8; o.x = o.hx + Math.sin(o.t * 0.6) * 40; o.zap = (o.t % 2.6) > 1.9; o.f = (o.t * 8 | 0) % 2; if (o.zap && K.frame % 6 === 0) sfx.noise(0.05, 0.04, 6000, 0, 'highpass'); }
          else if (o.type === 'jester') { const ph = (o.t % 1.4) / 1.4; o.y = o.hy - Math.sin(ph * Math.PI) * 70; o.f = ph < 0.1 || ph > 0.9 ? 1 : 0; }
          else if (o.type === 'turtle') { o.x = o.hx + Math.sin(o.t * 0.5) * 40; o.y = floorAt(o.x); o.f = (o.t * 3 | 0) % 2; o.dir = Math.cos(o.t * 0.5) > 0 ? 1 : -1; }
          else if (o.type === 'bat') { const d = P.x - o.x; if (!o.swoop && Math.abs(d) < 120 && !P.dead) { o.swoop = 1; o.st = 0; o.sx = o.x; o.sy = o.y; o.tx = P.x; o.ty = P.y - 14; } if (o.swoop) { o.st += dt / 1.4; const k = o.st; o.x = lerp(o.sx, o.tx + (o.tx - o.sx), k); o.y = o.sy + Math.sin(k * Math.PI) * (o.ty - o.sy); if (k >= 1) { o.swoop = 0; o.hx = o.x; o.hy = o.y; } } else { o.y = o.hy + Math.sin(o.t * 2) * 6; } o.f = (o.t * 10 | 0) % 2; }
          if (P.dead || P.loop) { if (o.sp > 0) o.sp -= dt; continue; }
          if (ENEMY[o.type]) {
            if (o.type === 'fish' && o.y > floorAt(o.hx) + 20 && o.pit) continue;
            if (near(o, 18, 18)) {
              const fromAbove = P.vy > 0 && P.y < o.y - 4;
              if (stars > 0 || superT>0) popEnemy(o);
              else if (o.type === 'turtle' && fromAbove) hit(o.x); // spikes on top!
              else if (o.type === 'spark' && o.zap) hit(o.x);
              else if (isBall() || fromAbove) { popEnemy(o); if (!P.ground) P.vy = held('a') || jumpHeld() ? Math.min(-4, -P.vy) : Math.min(-3, -P.vy * 0.7); }
              else hit(o.x);
            }
            if (o.type === 'spark' && o.zap && Math.hypot(o.x - P.x, o.y - (P.y - 14)) < 30 && stars <= 0) hit(o.x);
          } else if (o.type === 'spring') {
            const dirS = o.dir === 'l' ? -1 : o.dir === 'r' ? 1 : 0;
            if (Math.abs(o.x - P.x) < 15 && P.y >= o.y - 14 && P.y <= o.y + 4 && (P.ground ? true : P.vy >= 0)) {
              const pw = o.pw === 'r' ? 16 : 10; P.ground = false; P.plat = null; P.ball = false; P.roll = false; P.spring = 1; P.jumped = false; P.y = o.y - 15; o.sp = 0.3; S.spring();
              if (o.diag) { P.vx = pw * 0.75 * (P.dir || 1); P.vy = -pw * 0.75; ctrlLock = 20; } else if (dirS) { P.vy = -5; P.vx = dirS * pw; P.dir = dirS; ctrlLock = 24; } else { if (P.ground) P.vx = P.gsp; P.vy = -pw; }
            }
          } else if (o.type === 'spikes') { if (Math.abs(o.x - P.x) < 18 && P.y >= o.y - 14 && P.y <= o.y + 2) hit(o.x); }
          else if (o.type === 'mon') {
            if (near(o, 16, 18)) {
              if (isBall() || (P.vy > 0 && P.y < o.y - 10)) { o.alive = false; S.mon(); if (!P.ground) P.vy = -3; fx.push({ kind: 'boom', x: o.x, y: o.y - 14, t: 0 }); o.prize = 1.2;
                if (o.it === 'rings') { rings += 10; S.ring(); } else if (o.it === 'shield') shield = 1; else if (o.it === 'magnet') shield = 3; else if (o.it === 'life') { lives++; S.life(); } else if (o.it === 'shoes') { shoes = 15; zsong(); } else if (o.it === 'stars') { stars = 20; zsong(); }
                addScore(10, o.x, o.y - 24); }
              else if (P.ground) { if ((P.x < o.x && P.gsp > 0) || (P.x > o.x && P.gsp < 0)) { P.gsp = 0; P.x = o.x - Math.sign(o.x - P.x) * 16; P.push = true; } }
            }
          } else if (o.type === 'boost') { if (P.ground && Math.abs(o.x - P.x) < 18 && Math.abs(o.y - P.y) < 8) { if (Math.abs(P.gsp) < 12) S.boost(); P.gsp = 12 * (P.gsp < 0 && !held('right') ? -1 : 1); P.dir = Math.sign(P.gsp); } }
          else if (o.type === 'post') { if (!o.on && Math.abs(o.x - P.x) < 12 && Math.abs(P.y - o.y) < 40) { o.on = true; o.spinT = 1; S.post(); spawnX = o.x; spawnT = time; } }
          else if (o.type === 'vent') { const on = (o.t % 3) < 1.1; o.on = on; if (on && Math.abs(o.x - P.x) < 16 && P.y <= o.y + 2 && P.y > o.y - 140) { P.ground = false; P.plat = null; P.vy = Math.min(P.vy, -7.5); P.ball = false; P.spring = 1; } }
          else if (o.type === 'bumper') { if (o.air && !o.placed) { o.placed = 1; } const bx = o.x, by = o.y - 16, dx = P.x - bx, dy = (P.y - 14) - by, d = Math.hypot(dx, dy); if (d < 26) { const nx = dx / (d || 1), ny = dy / (d || 1); P.ground = false; P.plat = null; P.vx = nx * 7.5; P.vy = ny * 7.5 - 1; P.ball = true; P.jumped = false; o.sp = 0.2; S.bump(); if ((o.n = (o.n || 0) + 1) <= 10) addScore(10, bx, by - 20); } }
          else if (o.type === 'crusher') { const ph = (o.t % 3) / 3; o.drop = ph < 0.55 ? 0 : ph < 0.62 ? (ph - 0.55) / 0.07 : ph < 0.8 ? 1 : 1 - (ph - 0.8) / 0.2; if (o.drop > 0.95 && !o.thud) { o.thud = 1; if (Math.abs(o.x - P.x) < 300) { S.boom(); shake = 4; } } if (o.drop < 0.5) o.thud = 0; const bottom = o.y - 14 - (1 - o.drop) * 90; if (Math.abs(o.x - P.x) < 20 && P.y - 26 < bottom && P.y > bottom - 10 && o.drop > 0.3) hit(o.x); }
          else if (o.type === 'sign') { if (P.x >= o.x && !tally) startTally(o); }
          else if (o.type === 'gemspot') { if (P.x >= o.x && !tally && L.bonus && !bonusDone) endBonus(rings >= 40); }
          else if (o.type === 'boss') bossStep(o);
          if (o.sp > 0) o.sp -= dt;
        }
        // badnik shots
        for (const s of shots) { s.t += dt; s.x += s.vx; s.y += s.vy; if (!s.sting) s.vy += 0.15; if (!P.dead && Math.abs(s.x - P.x) < 9 && Math.abs(s.y - (P.y - 14)) < 14) { if (shield) { s.t = 9; } else hit(s.x); } }
        shots = shots.filter(s => s.t < 3);
        for (const r of loose) {
          r.t += dt; r.vy += 0.09375; r.x += r.vx; r.y += r.vy;
          const fy = floorAt(r.x); if (r.y > fy && r.vy > 0) { r.y = fy; r.vy *= -0.75; }
          if (r.t > 0.6 && !P.dead && Math.abs(r.x - P.x) < 14 && Math.abs(r.y - 8 - (P.y - 14)) < 18) { r.t = 99; rings++; S.ring(); }
        }
        loose = loose.filter(r => r.t < 4.2);
      }
      // ---- Dr. Sprocket
      function bossStep(o) {
        const Bs = L.boss; if (!Bs || Bs.dead && Bs.deadT > 6) return;
        if (!Bs.on && !Bs.dead && P.x > Bs.x0 + 40) { Bs.on = true; cam.lock = Bs.x0; Bs.t = 0; Bs.vx=0;Bs.vy=0;Bs.rest=0;Bs.hitT=0; Bs.x = Bs.x0 + W + 60; Bs.y = o.y - 120; zsong(); }
        if (!Bs.on) return;
        const dt = 1 / 60, gy = o.y; Bs.t += dt; if (Bs.hitT > 0) Bs.hitT -= dt;
        if (Bs.dead) { Bs.deadT += dt; if (K.frame % 7 === 0 && Bs.deadT < 2.6) { fx.push({ kind: 'boom', x: Bs.x + (Math.random() - 0.5) * 50, y: Bs.y + (Math.random() - 0.5) * 40, t: 0 }); S.boom(); }
          if (Bs.deadT > 2.6) { Bs.x += 3.2; Bs.y -= 0.8; }
          if (Bs.deadT > 3.2 && !Bs.cap) { Bs.cap = { x: Bs.x0 + W / 2 + 40, y: gy, open: false, t: 0 }; cam.lock = null; zsong(); }
          return; }
        const k = Bs.kind, left = Bs.x0 + 50, right = Bs.x0 + W - 50;
        if (k === 0) { // the Wrecker: swings a ball and glides side to side
          Bs.x = lerp(left, right, (Math.sin(Bs.t * 0.55) + 1) / 2); Bs.y = gy - 120 + Math.sin(Bs.t * 2) * 4;
          Bs.ang = Math.sin(Bs.t * 1.9) * 1.2; Bs.bx = Bs.x + Math.sin(Bs.ang) * 70; Bs.by = Bs.y + 24 + Math.cos(Bs.ang) * 70;
          if (Math.hypot(Bs.bx - P.x, Bs.by - (P.y - 14)) < 22) hit(Bs.bx);
        } else if (k === 1) { // the Flame-o-Matic: hovers, swoops low and breathes fire along the floor, drops bombs
          const ph = Bs.t % 6; Bs.x = lerp(left, right, (Math.sin(Bs.t * 0.4) + 1) / 2); Bs.y = gy - (ph > 3.4 && ph < 5 ? 62 : 128) + Math.sin(Bs.t * 2.4) * 4;
          Bs.flame = ph > 3.7 && ph < 4.8; if (Bs.flame) { if (K.frame % 4 === 0) fx.push({ kind: 'flame', x: Bs.x + (Math.random() - 0.5) * 10, y: Bs.y + 28, t: 0, vx: (Math.random() - 0.5) * 3 }); if (Math.abs(P.x - Bs.x) < 30 && P.y > Bs.y + 10) hit(Bs.x); }
          if ((Bs.t % 2.2) < dt && ph < 3.4) shots.push({ x: Bs.x, y: Bs.y + 26, vx: (P.x - Bs.x) * 0.012, vy: -1, t: 0, bomb: 1 });
        } else { // the Big Top Bouncer: hops across the arena, a shockwave when it lands, bouncing bombs
          Bs.vy = (Bs.vy || 0) + 0.18; Bs.y += Bs.vy; Bs.x += Bs.vx || 0;
          if (Bs.y > gy - 56) { Bs.y = gy - 56; if (Bs.vy > 2) { shake = 6; S.boom(); fx.push({ kind: 'wave', x: Bs.x, y: gy, t: 0, dir: -1 }, { kind: 'wave', x: Bs.x, y: gy, t: 0, dir: 1 }); } Bs.vy = 0; Bs.vx=0; Bs.rest = (Bs.rest || 0) + dt; if (Bs.rest > (Bs.hp < 5 ? 0.6 : 1.1)) { Bs.rest = 0; Bs.vy = -7.5; const tx = clamp(P.x + (Math.random() - 0.5) * 80, left, right); Bs.vx = (tx - Bs.x) / 84; if (Math.random() < 0.6) shots.push({ x: Bs.x, y: Bs.y, vx: -2, vy: -3, t: 0, bomb: 1 }, { x: Bs.x, y: Bs.y, vx: 2, vy: -3, t: 0, bomb: 1 }); } }
          if (Math.abs(P.x - Bs.x) < 34 && P.y > Bs.y + 14 && P.y < Bs.y + 60 && !(P.vy > 0 && P.y < Bs.y + 30)) hit(Bs.x);
        }
        // a hit on the pod
        const dx = P.x - Bs.x, dy = (P.y - 14) - Bs.y;
        if (Math.abs(dx) < 34 && Math.abs(dy) < 30 && Bs.hitT <= 0 && !P.dead) {
          if (isBall() || stars > 0 || superT>0) { Bs.hp--; Bs.hitT = 1; S.boss(); shake = 4; addScore(100, Bs.x, Bs.y - 40); P.vx = -Math.sign(dx || 1) * -3.5; P.vx = Math.sign(dx || -1) * 3.5; P.vy = -4; P.ground = false; if (Bs.hp <= 0) { Bs.dead = true; Bs.deadT = 0; addScore(1000, Bs.x, Bs.y - 50); K.music(null); } }
          else hit(Bs.x);
        }
      }
      function capsuleStep() {
        const c = L.boss && L.boss.cap; if (!c) return;
        if (!c.open && Math.abs(P.x - c.x) < 20 && P.y < c.y - 50 && P.y > c.y - 70 && P.vy >= 0) { c.open = true; c.t = 0; S.boom(); for (let i = 0; i < 10; i++) fx.push({ kind: 'critter', x: c.x + (Math.random() - 0.5) * 30, y: c.y - 30, t: -i * 0.15, vx: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random()), vy: -4 - Math.random() * 2, k: i % 3 }); }
        if (!c.open && Math.abs(P.x - c.x) < 30 && P.y > c.y - 60) { P.x = c.x + Math.sign(P.x - c.x || -1) * 30; P.gsp = 0; }
        if (!c.open && P.vy >= 0 && Math.abs(P.x - c.x) < 28 && P.y >= c.y - 64 && P.y <= c.y - 54) { land(c.y - 64); P.plat = { x: c.x - 28, y: c.y - 64, w: 56, dx: 0, dy: 0 }; }
        if (c.open) { c.t += 1 / 60; if (c.t > 2.4 && !tally) startTally({ x: c.x, spinT: 0 }); }
      }
      function startTally(o) {
        o.spinT = 2; const t = time;
        tally = { o, t: 0, phase: 0, rb: rings * 100, tb: t < 45 ? 5000 : t < 60 ? 4000 : t < 90 ? 3000 : t < 120 ? 2000 : t < 180 ? 1000 : t < 300 ? 500 : 0, rings, time: t, shown: false, bonus: rings >= 50 && !sv.gems[actN%6] && !timeAttack };
        if (rings >= 100) K.secret('rm.zip.rings');
        const key = 'a' + actN; if (!sv.best[key] || t < sv.best[key]) { sv.best[key] = Math.round(t * 100) / 100; tally.pb = 1; } save();
        K.music(null);
        sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 0.5], [79, 0.5], [84, 2]], { bpm: 200, vol: 0.08, when: 0.2 });
      }
      function stepTally() {
        const T = tally; T.t += 1 / 60;
        if (!P.dead) { if (P.ground) { P.gsp = Math.max(0, P.gsp - 0.1); groundMove(); } else airMove(); }
        if (T.t < 2.2) return;
        if (T.phase === 0) { T.phase = 1; T.shown = true; }
        if (T.phase === 1 && T.t > 3) {
          if (timeAttack) { T.phase = 2; T.t2 = T.t; }
          else if (T.tb > 0) { const n = Math.min(100, T.tb); T.tb -= n; addScore(n); if (K.frame % 3 === 0) S.tick(); }
          else if (T.rb > 0) { const n = Math.min(100, T.rb); T.rb -= n; addScore(n); if (K.frame % 3 === 0) S.tick(); }
          else { T.phase = 2; T.t2 = T.t; sfx.tone(1568, 0.3, 'square', 0.08); }
        }
        if (T.phase === 2 && T.t - T.t2 > 2) {
          tally = null;
          if (timeAttack) { mode = 'ta'; menuT = 0; return; }
          if (T.bonus) { bonusFrom = actN; S.warp(); loadAct(actN, 1000 + actN * 7); return; }
          nextAct();
        }
      }
      function nextAct() {
        if (actN === ACTS.length - 1) { mode = 'won'; menuT = 0; K.music(null); sfx.seq([[72, 1], [76, 1], [79, 1], [84, 1], [83, 1], [84, 3]], { bpm: 220, vol: 0.09 }); K.secret('rm.zip.boss'); sv.cont = null; sv.run=null; sv.clear=1; save(); return; }
        loadAct(actN + 1);
      }
      function endBonus(won) {
        if (won && bonusFrom >= 0) { sv.gems[bonusFrom%6] = 1; save(); fx.push({ kind: 'gemget', x: P.x, y: P.y - 40, t: 0 }); sfx.seq([[84, 0.5], [88, 0.5], [91, 0.5], [96, 2]], { bpm: 240, vol: 0.09 }); if (sv.gems.every(v => v)) K.secret('rm.zip.gems'); }
        actN = bonusFrom; bonusFrom = -1; const n = actN; setTimeout(() => {}, 0);
        msgBonus = won ? 'YOU GOT A TIME STONE!' : 'NO TIME STONE THIS TIME'; msgBonusT = 2.5; bonusDone = true;
        if (P) { P.gsp = 0; P.vx = 0; }
        afterBonus = () => { if (n === ACTS.length - 1) { actN = n; nextAct(); } else loadAct(n + 1); };
      }
      let msgBonus = '', msgBonusT = 0, bonusDone = false, afterBonus = null;
      function gameOver() {
        if (conts > 0 && !attract) { mode = 'cont'; menuT = 0; K.music(null); sfx.seq([[67, 1], [64, 1], [60, 1], [55, 3]], { bpm: 160, vol: 0.08, wave: 'triangle' }); return; }
        mode = 'over'; menuT = 0; K.music(null); sfx.seq([[67, 1], [64, 1], [60, 1], [55, 3]], { bpm: 160, vol: 0.08, wave: 'triangle' }); sv.cont = null; save();
      }
      // ================================================================ drawing
      const SX = x => Math.round(x - cam.x), SY = y => Math.round(y - cam.y);
      function drawBg() {
        for (const ly of bg) {
          if (ly.fixed) { g.drawImage(ly.c, 0, 0); continue; }
          const w = ly.c.width, y = Math.round(ly.y - (cam.y - (L.camBase || 0)) * ly.k * 0.5);
          if (ly.water) { // line scroll: each row of the water slides at its own speed (nearer = faster)
            for (let r = 0; r < ly.c.height; r++) { const k = ly.k + (r / ly.c.height) * 0.26, ox = -((cam.x * k + time * 6 * (r % 3 === 0 ? 1 : 0)) % w + w) % w; for (let x = ox; x < W; x += w) g.drawImage(ly.c, 0, r, w, 1, Math.round(x), y + r, w, 1); }
            continue;
          }
          const ox = -((cam.x * ly.k) % w + w) % w;
          for (let x = ox; x < W; x += w) g.drawImage(ly.c, Math.round(x), y);
          if (ly.fall) { const [fx0, fy0, fh] = ly.fall, o = (time * 70) | 0; for (let x = ox; x < W + w; x += w) { const X = Math.round(x + fx0); for (let yy = 0; yy < fh; yy += 2) { const k = ((yy + o) >> 1) % 4; g.fillStyle = k === 0 ? '#ffffff' : k === 1 ? '#a8e0ff' : k === 2 ? '#68b0f0' : '#88c8f8'; g.fillRect(X, y + fy0 + yy, 18, 2); g.fillStyle = '#ffffff'; if ((yy + o) % 12 < 2) g.fillRect(X + ((yy * 7) % 14), y + fy0 + yy, 3, 2); } g.fillStyle = (time * 8 | 0) % 2 ? '#ffffff' : '#c8ecff'; g.fillRect(X - 4, y + fy0 + fh - 3, 26, 4); } }
          if (ly.wheel) { const [cx, cy, r] = ly.wheel; for (let x = ox; x < W + w; x += w) { for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + time * 0.3; const px = Math.round(x + cx + Math.cos(a) * r), py = Math.round(y + cy + Math.sin(a) * r); g.fillStyle = ['#f048a0', '#40d8c0', '#f8d020', '#9040d0'][k % 4]; g.fillRect(px - 4, py - 3, 8, 7); g.fillStyle = '#281838'; g.fillRect(px - 4, py + 3, 8, 1); } } }
          if (ly === bg[bg.length - 1]) { g.fillStyle = L.theme === 'bay' ? '#1e6e22' : L.theme === 'works' ? '#281830' : L.theme === 'carn' ? '#2a1840' : L.theme==='canopy'?'#182820':L.theme==='ruins'?'#182c38':L.theme==='citadel'?'#14182c':'#f0a0d0'; g.fillRect(0, y + ly.c.height - 1, W, H); }
        }
      }
      function drawLoopBack(lp) {
        const x = SX(lp.x), y = SY(lp.y - lp.r); if (x < -lp.r - 40 || x > W + lp.r + 40) return;
        const T = L.theme, c1 = T === 'bay' ? '#8a4818' : T === 'works' ? '#484858' : T==='canopy'?'#504030':T==='ruins'?'#384850':T==='citadel'?'#282c40':'#e84898', c2 = T === 'bay' ? '#b86828' : T === 'works' ? '#707084' : T==='canopy'?'#907048':T==='ruins'?'#889898':T==='citadel'?'#80889c':'#f8e8f0', top = TOP[T] || TOP.bay;
        g.save(); g.lineWidth = 16;
        for (let i = 0; i < 24; i++) { g.strokeStyle = i % 2 ? c1 : c2; g.beginPath(); g.arc(x, y, lp.r + 9, i / 24 * Math.PI * 2, (i + 1) / 24 * Math.PI * 2 + 0.01); g.stroke(); }
        g.lineWidth = 5; g.strokeStyle = top[1]; g.beginPath(); g.arc(x, y, lp.r + 1, 0, Math.PI * 2); g.stroke();
        g.lineWidth = 2; g.strokeStyle = top[0]; g.beginPath(); g.arc(x, y, lp.r + 17, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(x, y, lp.r - 1.5, 0, Math.PI * 2); g.stroke();
        g.restore();
      }
      function corkscrew(front) { // the spiral track: the back half before Zip is drawn, the front half after
        for (const c of L.corks) {
          if (c.x1 < cam.x - 20 || c.x0 > cam.x + W + 20) continue;
          const T = L.theme, a = T === 'bay' ? '#b86828' : T === 'works' ? '#707084' : T==='canopy'?'#907048':T==='ruins'?'#889898':T==='citadel'?'#80889c':'#e84898', b = T === 'bay' ? '#8a4818' : T === 'works' ? '#484858' : T==='canopy'?'#504030':T==='ruins'?'#384850':T==='citadel'?'#282c40':'#f8e8f0', top = (TOP[T] || TOP.bay)[1];
          for (let x = c.x0; x < c.x1; x += 4) {
            const t = (x - c.x0) / (c.x1 - c.x0), ph = t * Math.PI * 2 * 2, cz = Math.cos(ph);
            if ((cz > 0) !== front) continue;
            const yy = c.y - 22 - Math.sin(ph) * 22, sx = SX(x), sy = SY(yy);
            g.fillStyle = ((x / 16) | 0) % 2 ? a : b; g.fillRect(sx, sy - 5, 5, 10); g.fillStyle = top; g.fillRect(sx, sy - 6, 5, 2);
          }
          if (!front) { g.fillStyle = '#5a5a6a'; for (let x = c.x0; x <= c.x1; x += 80) g.fillRect(SX(x) - 2, SY(c.y - 48), 4, 48); }
        }
      }
      function drawGround() {
        const x0 = Math.floor(cam.x / 4) * 4 - 4, x1 = cam.x + W + 8, top = TOP[L.theme] || TOP.bay;
        g.save(); g.translate(-Math.round(cam.x), -Math.round(cam.y));
        const runs = []; let cur = null;
        for (let x = x0; x <= x1; x += 4) { const y = gAt(x); if (y === Infinity) { if (cur) { runs.push(cur); cur = null; } continue; } if (!cur) cur = []; cur.push(x, y); }
        if (cur) runs.push(cur);
        const bottom = cam.y + H + 20;
        for (const r of runs) {
          if (L.theme !== 'sky') { g.fillStyle = pat; g.beginPath(); g.moveTo(r[0], bottom); for (let i = 0; i < r.length; i += 2) g.lineTo(r[i], r[i + 1]); g.lineTo(r[r.length - 2], bottom); g.closePath(); g.fill(); }
          else { g.fillStyle = '#f8e0f0'; g.beginPath(); g.moveTo(r[0], bottom); for (let i = 0; i < r.length; i += 2) g.lineTo(r[i], r[i + 1] + 4); g.lineTo(r[r.length - 2], bottom); g.closePath(); g.fill(); }
          g.lineJoin = 'round';
          // a shadow under the lip, the lip, a highlight
          g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 6; g.beginPath(); for (let i = 0; i < r.length; i += 2) g.lineTo(r[i], r[i + 1] + 8); g.stroke();
          g.strokeStyle = top[0]; g.lineWidth = 9; g.beginPath(); for (let i = 0; i < r.length; i += 2) g.lineTo(r[i], r[i + 1] + 2); g.stroke();
          g.strokeStyle = top[1]; g.lineWidth = 5; if (L.theme === 'works') g.setLineDash([8, 8]); g.beginPath(); for (let i = 0; i < r.length; i += 2) g.lineTo(r[i], r[i + 1]); g.stroke(); g.setLineDash([]);
          g.strokeStyle = top[2]; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < r.length; i += 2) g.lineTo(r[i], r[i + 1] - 2); g.stroke();
          if (L.theme === 'bay') { g.fillStyle = top[1]; for (let i = 0; i < r.length; i += 4) { const x = r[i], y = r[i + 1]; if (((x / 4) | 0) % 3 === 0) { g.fillRect(x, y - 5, 2, 3); g.fillRect(x + 3, y - 4, 2, 2); } } }
          if (L.theme === 'carn') { for (let i = 0; i < r.length; i += 8) { g.fillStyle = ((r[i] / 32) | 0) % 2 ? '#f8f8a0' : '#f84898'; g.fillRect(r[i], r[i + 1] + 3, 3, 3); } }
        }
        for (const c of L.conv) { if (c.x1 < cam.x || c.x0 > cam.x + W) continue; const y = gAt(c.x0); g.fillStyle = '#202028'; g.fillRect(c.x0, y - 3, c.x1 - c.x0, 7); g.fillStyle = '#808090'; const o = ((time * c.sp * 60) % 12 + 12) % 12; for (let x = c.x0 + o; x < c.x1 - 4; x += 12) g.fillRect(x, y - 2, 5, 3); g.fillStyle = '#b0b0c0'; g.beginPath(); g.arc(c.x0, y + 1, 5, 0, 7); g.arc(c.x1, y + 1, 5, 0, 7); g.fill(); }
        for (const pl of L.plats) { if (pl.gone || pl.x > cam.x + W || pl.x + pl.w < cam.x) continue; const x = Math.round(pl.x), y = Math.round(pl.y), w = pl.w;
          if (pl.mv && pl.mv.swing) { g.fillStyle = '#9098a8'; const ax = pl.x0 + w / 2, ay = pl.y0 - pl.mv.r; for (let k = 0; k <= 8; k++) { g.fillRect(Math.round(lerp(ax, x + w / 2, k / 8)) - 2, Math.round(lerp(ay, y, k / 8)) - 2, 4, 4); } g.fillStyle = '#606878'; g.fillRect(ax - 4, ay - 4, 8, 8); }
          if (L.theme === 'bay') { g.fillStyle = pat; g.fillRect(x, y, w, 16); g.fillStyle = top[0]; g.fillRect(x - 2, y - 3, w + 4, 6); g.fillStyle = top[1]; g.fillRect(x - 1, y - 3, w + 2, 4); g.fillStyle = top[2]; g.fillRect(x, y - 3, w, 1); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y + 15, w, 2); }
          else if (L.theme === 'works') { g.fillStyle = '#8a8a9a'; g.fillRect(x, y, w, 12); g.fillStyle = '#d8b020'; for (let i = 0; i < w; i += 8) g.fillRect(x + i, y, 4, 3); g.fillStyle = '#404050'; g.fillRect(x, y + 10, w, 2); g.fillStyle = '#b0b0c0'; g.fillRect(x + 3, y + 5, 2, 2); g.fillRect(x + w - 5, y + 5, 2, 2); }
          else if (['canopy','ruins','citadel'].includes(L.theme)) {g.fillStyle=pat;g.fillRect(x,y,w,14);g.fillStyle=top[1];g.fillRect(x-1,y-3,w+2,5);g.fillStyle=top[2];g.fillRect(x,y-3,w,1);g.fillStyle='#182028';g.fillRect(x,y+13,w,2)}
          else if (L.theme === 'carn') { for (let i = 0; i < w; i += 8) { g.fillStyle = (i / 8) % 2 ? '#f84898' : '#f8f0f8'; g.fillRect(x + i, y, 8, 12); } g.fillStyle = '#f8d020'; g.fillRect(x - 2, y - 3, w + 4, 4); g.fillStyle = '#401040'; g.fillRect(x, y + 12, w, 2); }
          else { for (let i = 0; i < w; i += 10) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + i + 5, y + 4, 8, 0, 7); g.fill(); } g.fillStyle = '#e8c8e8'; g.fillRect(x, y + 6, w, 5); }
          if (pl.mv && pl.mv.fall && pl.fallT > 0 && pl.fallT < 0.5 && (K.frame & 2)) { g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x, y - 3, w, 14); }
        }
        g.restore();
      }
      function drawDeco(front) { for (const d of L.deco) { if (d.front !== front || d.x < cam.x - 60 || d.x > cam.x + W + 60) continue; const fr = D[d.k]; if (!fr) continue; const im = fr[((time * 2) | 0) % fr.length]; g.drawImage(im, SX(d.x) - (im.width >> 1), SY(d.y) - im.height + 2); } }
      function drawObjs() {
        for (const o of L.objs) {
          if (o.x < cam.x - 60 || o.x > cam.x + W + 60) continue;
          const x = SX(o.x), y = SY(o.y);
          if (o.type === 'ring') { if (o.alive) g.drawImage(O.ring[((time * 10 + o.x / 40) | 0) & 7], x - 8, y - 16); continue; }
          if (o.type === 'post') { g.drawImage(O.post[o.on ? 1 : 0], x - 7, y - 46); if (o.spinT > 0) { for (let k = 0; k < 4; k++) { const a = time * 12 + k * Math.PI / 2; g.drawImage(O.spark[k & 3], x - 8 + Math.cos(a) * 10, y - 54 + Math.sin(a) * 6); } } continue; }
          if (o.type === 'sign') { let im; if (tally && tally.o === o && tally.t > 2) im = O.signZip; else if (o.spinT > 0 || (tally && tally.o === o)) im = O.sign[((time * 14) | 0) & 3]; else im = O.sign[0]; g.drawImage(im, x - 18, y - 54); continue; }
          if (o.type === 'gemspot') { const im = O.gem[(bonusFrom >= 0 ? bonusFrom : 0) % 6]; g.drawImage(im, x - 8, y - 40 + Math.sin(time * 3) * 3); continue; }
          if (o.type === 'boost') { g.drawImage(O.boost, x - 16, y - 6); continue; }
          if (o.type === 'vent') { g.drawImage(O.vent, x - 16, y - 8); if (o.on) for (let i = 0; i < 6; i++) { const a = ((time * 3 + i / 6) % 1); g.fillStyle = `rgba(230,230,240,${(1 - a) * 0.7})`; g.beginPath(); g.arc(x + Math.sin(i * 2 + time * 5) * 6, y - 8 - a * 110, 5 + a * 9, 0, 7); g.fill(); } continue; }
          if (o.type === 'bumper') { g.drawImage(O.bumper[o.sp > 0 ? 1 : 0], x - 16, y - 32); continue; }
          if (o.type === 'crusher') { const bottom = y - 14 - (1 - (o.drop || 0)) * 90; g.fillStyle = '#404050'; g.fillRect(x - 3, bottom - 200, 6, 200 - 40); g.fillStyle = '#707084'; g.fillRect(x - 18, bottom - 40, 36, 40); g.fillStyle = '#d8b020'; for (let i = 0; i < 36; i += 8) g.fillRect(x - 18 + i, bottom - 6, 4, 6); g.fillStyle = '#202028'; g.fillRect(x - 18, bottom - 1, 36, 1); continue; }
          if (o.type === 'boss') continue;
          if (!o.alive) { if (o.type === 'mon') { g.drawImage(O.monBroke, x - 13, y - 12); if (o.prize > 0) { const icon = O.mon[o.it]; g.drawImage(icon, 4, 4, 18, 15, x - 9, y - 40 - (1.2 - o.prize) * 30, 18, 15); } } continue; }
          if (o.type === 'crab') g.drawImage(O.crab[o.f | 0], x - 17, y - 26);
          else if (o.type === 'bee') { g.save(); g.translate(x, y - 13); if (o.dir < 0) g.scale(-1, 1); g.drawImage(O.bee[o.f | 0], -17, -13); g.restore(); }
          else if (o.type === 'fish') { g.save(); g.translate(x, y - 13); if (!o.up) g.scale(1, -1); g.drawImage(O.fish[o.f | 0], -15, -13); g.restore(); }
          else if (o.type === 'roll') { if (o.ballT > 0) g.drawImage(O.rollBall[o.f | 0], x - 12, y - 24); else g.drawImage(O.roll[(o.t * 4 | 0) % 2], x - 15, y - 24); }
          else if (o.type === 'spark') { g.drawImage(O.spark2[o.f | 0], x - 14, y - 30); if (o.zap) { g.strokeStyle = (K.frame & 2) ? '#80e0ff' : '#ffffff'; g.lineWidth = 1; g.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const r = 18 + (k % 2) * 8; g.lineTo(x + Math.cos(a) * r, y - 18 + Math.sin(a) * r); } g.closePath(); g.stroke(); } }
          else if (o.type === 'jester') g.drawImage(O.jester[o.f | 0], x - 14, y - 40);
          else if (o.type === 'turtle') { g.save(); g.translate(x, y - 13); if (o.dir < 0) g.scale(-1, 1); g.drawImage(O.turtle[o.f | 0], -17, -13); g.restore(); }
          else if (o.type === 'bat') g.drawImage(O.batbot[o.f | 0], x - 18, y - 12);
          else if (o.type === 'spring') { const im = O.spring[o.pw][o.sp > 0 ? 1 : 0]; g.save(); g.translate(x, y); if (o.diag) g.rotate(Math.PI / 4); else if (o.dir === 'l') g.rotate(-Math.PI / 2); else if (o.dir === 'r') g.rotate(Math.PI / 2); g.drawImage(im, -14, -26); g.restore(); }
          else if (o.type === 'spikes') g.drawImage(O.spikes, x - 16, y - 18);
          else if (o.type === 'mon') { g.drawImage(O.mon[o.it], x - 13, y - 30); if (((time * 6) | 0) % 5 === 0) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 9, y - 26, 18, 15); } }
        }
        for (const s of shots) { const x = SX(s.x), y = SY(s.y); if (s.bomb) g.drawImage(O.bomb, x - 8, y - 9); else { g.fillStyle = s.sting ? '#f8d020' : '#f84020'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#fff'; g.fillRect(x - 1, y - 1, 2, 2); } }
      }
      function drawBoss() {
        const Bs = L.boss; if (!Bs || !Bs.on && !Bs.cap) return;
        if (Bs.cap) { const c = Bs.cap; g.drawImage(O.capsule[c.open ? 1 : 0], SX(c.x) - 32, SY(c.y) - 64); }
        if (Bs.dead && Bs.deadT > 6) return;
        const x = SX(Bs.x), y = SY(Bs.y);
        if (Bs.kind === 0 && !Bs.dead) { for (let k = 1; k <= 8; k++) g.drawImage(O.chain, Math.round(lerp(x, SX(Bs.bx), k / 9)) - 4, Math.round(lerp(y + 24, SY(Bs.by), k / 9)) - 4); g.drawImage(O.ball, SX(Bs.bx) - 16, SY(Bs.by) - 16); for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#f8f8f8' : '#202028'; } }
        if (Bs.kind === 2) { g.fillStyle = '#606878'; g.fillRect(x - 24, y + 22, 6, 30); g.fillRect(x + 18, y + 22, 6, 30); for (let k = 0; k < 4; k++) { g.fillStyle = '#b0b8c8'; g.fillRect(x - 28, y + 28 + k * 6, 14, 3); g.fillRect(x + 14, y + 28 + k * 6, 14, 3); } }
        if (Bs.hitT > 0 && (K.frame & 2)) { g.globalCompositeOperation = 'lighter'; }
        const face = Bs.hitT > 0 ? 1 : (P.dead || (P.hurt)) ? 2 : 0;
        g.save(); g.translate(x, y); if (P.x > Bs.x) g.scale(-1, 1); g.drawImage(O.doc[face], -36, -44); g.restore();
        g.globalCompositeOperation = 'source-over';
        if (Bs.flame) { /* the flame is drawn as fx */ }
      }
      function frameOf() {
        if (P.dead) return [Z.dead[0], 0];
        if (P.hurt) return [Z.hurt[0], 0];
        if (P.ball || P.roll || P.revving) { const n = ((time * (P.revving ? 40 : 14 + Math.abs(P.gsp || P.vx) * 3)) | 0) & 7; return [Z.ball[n], 0]; }
        if (P.spring) return [P.vy > 2 ? Z.fall[0] : Z.spring[0], 0];
        if (P.crouch) return [Z.crouch[0], 0];
        if (tally && tally.t > 1.4 && P.ground && Math.abs(P.gsp) < 0.1) return [Z.win[0], 0];
        if (P.ground || P.loop) {
          const sp = Math.abs(P.gsp);
          if (P.skid) return [Z.skid[0], 0];
          if (P.push) return [Z.push[((time * 3) | 0) & 1], 0];
          let rot = P.loop ? Math.round(P.ang / (Math.PI / 8)) * (Math.PI / 8) : Math.abs(P.ang) > 0.35 ? Math.round(P.ang / (Math.PI / 4)) * (Math.PI / 4) : 0;
          if (sp < 0.05) { if (held('up')) return [Z.up[0], 0]; if (P.idle > 300) return [Z.wait[((time * 2) | 0) & 1], 0]; return [Z.stand[(P.idle % 240) > 225 ? 1 : 0], 0]; }
          if (sp > 9) return [Z.dash[((P.anim) | 0) & 3], rot];
          if (sp > 5) return [Z.run[((P.anim) | 0) & 7], rot];
          return [Z.walk[((P.anim) | 0) & 7], rot];
        }
        return [P.vy < 0 ? Z.spring[0] : Z.fall[0], 0];
      }
      function drawPlayer() {
        if (inv > 0 && inv < 120 && (K.frame & 3) < 2 && !P.dead) return;
        const [im, rot] = frameOf();
        let x = SX(P.x), y = SY(P.y), sy = 1;
        if (P.cork > 0 && P.cork < 1) { const ph = P.cork * Math.PI * 4; y -= Math.round(22 + Math.sin(ph) * 22); sy = Math.cos(ph) >= 0 ? 1 : -1; }
        g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (P.dir < 0 && !P.loop) g.scale(-1, 1); if (sy < 0) { g.translate(0, -24); g.scale(1, -1); g.translate(0, 24); }
        g.drawImage(im, -24, -46); g.restore();
        if (shield === 1) { g.save(); g.globalAlpha = 0.5 + Math.sin(time * 14) * 0.15; ell(g, x, y - 18, 22, 22, 'rgba(90,200,255,.25)'); g.strokeStyle = '#a8e8ff'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 18, 22, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.fillRect(x - 12, y - 32, 4, 3); g.restore(); }
        if (shield === 3) { g.save(); g.strokeStyle = (K.frame & 4) ? '#f8f080' : '#f8d020'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI * 2, r = 22 + ((k + (K.frame >> 2)) % 2) * 4; g.lineTo(x + Math.cos(a) * r, y - 18 + Math.sin(a) * r); } g.stroke(); g.restore(); }
        if (stars > 0) for (let k = 0; k < 6; k++) { const a = time * 9 + k * 1.05, r = 20 + Math.sin(time * 6 + k) * 5; g.drawImage(O.spark[(k + (K.frame >> 2)) & 3], x - 8 + Math.cos(a) * r, y - 26 + Math.sin(a) * r); }
        if (shoes > 0 && Math.abs(P.gsp || P.vx) > 4) { g.globalAlpha = 0.35; g.save(); g.translate(x - P.dir * 12, y); if (P.dir < 0) g.scale(-1, 1); g.drawImage(im, -24, -46); g.restore(); g.globalAlpha = 1; }
        if (P.revving && K.frame % 2) fx.push({ kind: 'dust', x: P.x - P.dir * (12 + Math.random() * 8), y: P.y, t: 0 });
      }
      function drawFx() {
        for (const f of fx) {
          if (f.t < 0) continue; const x = SX(f.x), y = SY(f.y);
          if (f.kind === 'boom') g.drawImage(O.boom[Math.min(4, (f.t * 14) | 0)], x - 16, y - 16);
          else if (f.kind === 'critter') { g.save(); g.translate(x, y); if (f.vx < 0) g.scale(-1, 1); g.drawImage(O.critter[f.k][((f.t * 8) | 0) & 1], -8, -16); g.restore(); }
          else if (f.kind === 'spark') g.drawImage(O.spark[Math.min(3, (f.t * 12) | 0)], x - 8, y - 8);
          else if (f.kind === 'dust') g.drawImage(O.dust[Math.min(2, (f.t * 8) | 0)], x - 6, y - 10 - f.t * 10);
          else if (f.kind === 'flame') { const r = 4 + f.t * 12; g.fillStyle = f.t < 0.15 ? '#ffffff' : f.t < 0.3 ? '#f8d020' : '#f87020'; g.beginPath(); g.arc(x, Math.min(y, SY(floorAt(f.x)) - 4), r, 0, 7); g.fill(); }
          else if (f.kind === 'wave') { const h = 14 - f.t * 6; g.fillStyle = '#f8f0f8'; g.fillRect(x - 6, y - h, 12, h); }
          else if (f.kind === 'gemget') { g.drawImage(O.gem[bonusFrom >= 0 ? bonusFrom % 6 : 0], x - 8, y - 9 - f.t * 30); }
        }
        for (const r of loose) { if (r.t > 3 && (K.frame & 2)) continue; g.drawImage(O.ring[((time * 20) | 0) & 7], SX(r.x) - 8, SY(r.y) - 16); }
        for (const p of pops) F.center(g, p.txt, SX(p.x), SY(p.y) - p.t * 30, '#fff', 1, '#000');
      }
      const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
      let headIcon = null;
      function hud() {
        g.drawImage(label('SCORE', 'Y', 11), 8, 6); num(g, score, 116, 7, true);
        g.drawImage(label('TIME', 'Y', 11), 8, 22); num(g, mmss(L.bonus ? bonusT : time).replace(':', ':'), 60, 23);
        const rc = rings === 0 && (K.frame & 16) ? 'R' : 'Y'; g.drawImage(label('RINGS', rc, 11), 8, 38); num(g, rings, 116, 39, true);
        if (L.bonus) { F.draw(g, 'NEED 40 RINGS!', 130, 40, rings >= 40 ? '#80ff80' : '#fff', 1, '#000'); }
        if (!headIcon) headIcon = pixel(20, 18, gg => { gg.translate(-14, -6); gg.scale(1, 1); drawZip(gg, { legs: null, arms: null, scarf: 0, wind: 0 }); });
        g.drawImage(headIcon, 8, H - 26); g.drawImage(label('ZIP', 'Y', 9), 28, H - 28); F.draw(g, 'X ' + Math.max(0, lives), 32, H - 14, '#fff', 1, '#000');
        if(superT>0)F.draw(g,'BURROW POWER',128,H-14,'#f8d020',1,'#000');
        if (sv.gems.some(v => v)) sv.gems.forEach((v, i) => { if (v) g.drawImage(O.gem[i], W - 22 - (5 - i) * 14, H - 22); });
        const Bs = L.boss; if (Bs && Bs.on && !Bs.dead) { F.draw(g, 'DR. SPROCKET', W - 112, 8, '#f8d020', 1, '#000'); const n = (Bs.kind === 2 ? 10 : 8)+(L.zone>=3?2:0); for (let i = 0; i < n; i++) { g.fillStyle = i < Bs.hp ? '#f84020' : '#303040'; g.fillRect(W - 112 + i * 8, 18, 6, 5); } }
        // the zone title card
        if (card > 0) {
          const k = card > 2.6 ? (3.2 - card) / 0.6 : card < 0.6 ? card / 0.6 : 1, e = 1 - Math.pow(1 - clamp(k, 0, 1), 3);
          g.fillStyle = '#1838c0'; g.fillRect(0, 0, Math.round(W * 0.32 * e), H); g.fillStyle = '#f8d020'; g.fillRect(Math.round(W * 0.32 * e) - 6, 0, 6, H);
          g.fillStyle = '#e83020'; g.fillRect(0, Math.round(H - 40 * e), W, 40);
          const nm = label(L.name, 'W', 22), zx = Math.round(W - (W - 40) * e + (1 - e) * 200);
          g.drawImage(nm, Math.min(zx, W - nm.width - 16), 70); g.drawImage(label('ZONE', 'Y', 18), W - 110 + Math.round((1 - e) * 300), 100);
          ell(g, W - 70 + (1 - e) * 300, 156, 26, 26, '#f8d020'); g.drawImage(label('ACT', 'k', 10), W - 88 + Math.round((1 - e) * 300), 140); g.drawImage(label(String(L.act + 1), 'R', 22), W - 78 + Math.round((1 - e) * 300), 146);
        }
        if (tally && tally.shown) {
          g.drawImage(label('ZIP GOT THROUGH', 'W', 20), W / 2 - 104, 40); g.drawImage(label('ACT ' + (L.act + 1), 'Y', 18), W / 2 - 34, 66);
          if (!timeAttack) { g.drawImage(label('TIME BONUS', 'Y', 11), 60, 104); num(g, tally.tb, 260, 105, true); g.drawImage(label('RING BONUS', 'Y', 11), 60, 122); num(g, tally.rb, 260, 123, true); g.drawImage(label('SCORE', 'Y', 11), 60, 144); num(g, score, 260, 145, true); }
          else { g.drawImage(label('YOUR TIME', 'Y', 14), 70, 110); num(g, (tally.time).toFixed(2), 250, 113, true); if (tally.pb) F.center(g, 'NEW BEST TIME!', W / 2, 140, '#80ff80', 1, '#000'); }
          if (tally.rings >= 100) F.center(g, '100 RINGS! WHAT A HOARDER!', W / 2, 166, '#7affd0', 1, '#000');
          if (tally.bonus && tally.phase === 2) F.center(g, '50 RINGS: TO THE BONUS STAGE!', W / 2, 182, (K.frame & 8) ? '#f8d020' : '#fff', 1, '#000');
        }
        if (msgBonusT > 0) { g.fillStyle = 'rgba(0,0,40,.6)'; g.fillRect(0, H / 2 - 20, W, 40); F.center(g, msgBonus, W / 2, H / 2 - 4, '#f8d020', 1, '#000'); }
        if (attract) { F.center(g, 'DEMO PLAY', W / 2, 60, (K.frame & 16) ? '#fff' : '#f8d020', 2, '#000'); F.center(g, 'PRESS START', W / 2, H - 30, '#fff', 1, '#000'); }
        if (paused) { g.fillStyle = 'rgba(0,0,40,.65)'; g.fillRect(0, 0, W, H); g.drawImage(label('PAUSE', 'Y', 22), W / 2 - 40, 60); ['CONTINUE', 'RESTART ACT', 'QUIT TO TITLE'].forEach((s, i) => F.center(g, (i === pmenu ? '> ' : '') + s + (i === pmenu ? ' <' : ''), W / 2, 110 + i * 18, i === pmenu ? '#f8d020' : '#fff', 1, '#000')); }
      }
      // ================================================================ the title, the menus, the demo
      let titleL = null, bigZip = null, logo = null;
      const CODE = ['up', 'down', 'left', 'right'];
      // passwords, like the cartridge would have used: the act and your Time Stones in four letters
      const PWA = 'BCDFGHJKLMNPQRSTVWXZ';
      const gemBits = () => sv.gems.reduce((n, v, i) => n | (v ? 1 << i : 0), 0);
      function pwOf(act, gems) { if(act>=6)return 'MEMORY CARD'; const v = act * 64 + gems, a = v % 20, b = Math.floor(v / 20) % 20, c = (v * 7 + 3) % 20, d = (a + b * 3 + c * 5) % 20; return PWA[a] + PWA[b] + PWA[c] + PWA[d]; }
      function pwRead(s) { const n = s.split('').map(ch => PWA.indexOf(ch)); if (n.some(x => x < 0)) return null; const v = n[0] + n[1] * 20; if ((v * 7 + 3) % 20 !== n[2] || (n[0] + n[1] * 3 + n[2] * 5) % 20 !== n[3]) return null; const act = Math.floor(v / 64); return act < ACTS.length ? { act, gems: v % 64 } : null; }
      let pwIn = null;
      function menuItems() { const m = [['START GAME', 'new']]; if (sv.cont) m.push(['CONTINUE: ' + ZONES[Math.floor(sv.cont.act / 2)].split(' ')[0] + ' ' + (sv.cont.act % 2 + 1), 'cont']); m.push(['TIME ATTACK', 'ta']); if (selOn) m.push(['LEVEL SELECT', 'sel']); m.push(['PASSWORD', 'pw'], ['HIGH SCORES', 'hi'], ['OPTIONS', 'opts'], ['HOW TO PLAY', 'how']); return m; }
      let taSel = 0, lsSel = 0, optSel = 0, soundSel = 0, aiDash = 0, aiSlow = 0, aiBack = 0, aiStuck = 0;
      function newGame(act) { tally=null;msgBonusT=0;afterBonus=null;bonusFrom=-1;nameEntry=null;reported=false;sv.run = null; score = 0; lives = sv.opts.easy ? 5 : 3; conts = 3; timeAttack = false; attract = false; mode = 'play'; paused = false; loadAct(act || 0); sfx.tone(1320, 0.1); }
      function startAttract() { attract = true; attractT = 0; score = 0; lives = 3; mode = 'play'; loadAct(0); card = 0; K.music(null); }
      function stopAttract() { attract = false; mode = 'title'; menuT = 0; L = null; titleL = null; idleT = 0; }
      function ai() { // the demo: run right, jump at trouble, spin dash out of corners
        aiDir = 1; aiJump = false; aiDown = false;
        if (aiDash > 0) { aiDash--; aiDown = aiDash > 0; aiJump = aiDash % 6 === 3; aiHold = false; return; }
        const ahead = P.x + 34 + Math.abs(P.gsp) * 8;
        const danger = L.objs.some(o => o.alive && (ENEMY[o.type] || o.type === 'spikes' || o.type === 'mon') && o.x > P.x + 10 && o.x < ahead && Math.abs(o.y - P.y) < 70);
        if (aiBack > 0) { aiBack--; aiDir = aiBack > 20 ? -1 : 1; aiHold = false; return; }
        const pit = gAt(P.x + 40 + Math.abs(P.gsp) * 4) === Infinity, wall = floorAt(P.x + 24) < floorAt(P.x + 12) - 14;
        aiStuck = P.ground && Math.abs(P.gsp) < 1 && P.ang < -0.25 ? aiStuck + 1 : 0; if (aiStuck > 50) { aiStuck = 0; aiBack = 110; return; }
        if (P.ground && (danger || pit || wall) && K.frame % 3 === 0) aiJump = true;
        aiHold = !P.ground && (P.vy < 0 || pit);
        aiSlow = P.ground && Math.abs(P.gsp) < 1.2 ? aiSlow + 1 : 0;
        if (P.ground && (P.push || aiSlow > 40) && !P.roll && P.ang > -0.2) { aiDash = 26; aiSlow = 0; }
      }
      function drawTitle() {
        if (!titleL) { titleL = ACTS[0](); L = titleL; bg = backdrop('bay'); pat = g.createPattern(groundPat('bay'), 'repeat'); L.camBase = 400 - 168; maxY = 0; for (const v of L.hm) if (v < Infinity && v > maxY) maxY = v; time = 0; }
        L = titleL; time += 1 / 60;
        cam.x = (menuT * 46) % (L.len - W * 2); cam.y = (gAt(cam.x + W / 2) < Infinity ? gAt(cam.x + W / 2) : 400) - 168;
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H); drawBg(); drawGround(); drawDeco(false);
        if (!bigZip) bigZip = pixel(96, 96, gg => { gg.scale(2, 2); drawZip(gg, { legs: [[1.4, 5.8, -1.0, 11.6, 0], [2.2, 5.4, 4.4, 11.6, 0]], arms: [[2.2, 3.2, 3.4, 7.0], [3.6, -2.6, 6.8, -6.0]], eye: 'n', mouth: 'grin', scarf: 1, wind: 0.8 }); });
        if (!logo) logo = { a: pixel(170, 50, gg => { gg.font = 'italic 900 46px Arial Black,Arial,sans-serif'; gg.textBaseline = 'top'; gg.fillStyle = C('b'); gg.fillText('ZIP', 6, 2); gg.fillStyle = C('W'); gg.fillText('ZIP', 3, -1); gg.fillStyle = C('L'); gg.fillRect(0, 22, 170, 2); }), b: pixel(170, 22, gg => { gg.font = 'italic 900 17px Arial Black,Arial,sans-serif'; gg.textBaseline = 'top'; gg.fillStyle = C('y'); gg.fillText('THE BADGER', 3, 3); gg.fillStyle = C('Y'); gg.fillText('THE BADGER', 2, 2); }) };
        const cx = W / 2, cy = 74;
        // the emblem: a big gold ring with wings, Zip bursting out of it
        for (const s of [-1, 1]) { g.fillStyle = '#f8f8f8'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(cx + s * (58 + k * 10), cy - 12 + k * 6, 14 - k * 2, 6, s * 0.4, 0, 7); g.fill(); } }
        ell(g, cx, cy, 54, 54, '#1838c0'); g.lineWidth = 7; g.strokeStyle = '#c89010'; g.beginPath(); g.arc(cx, cy, 54, 0, 7); g.stroke(); g.lineWidth = 3; g.strokeStyle = '#f8d820'; g.beginPath(); g.arc(cx, cy, 53, 0, 7); g.stroke(); g.lineWidth = 1; g.strokeStyle = '#fff8a0'; g.beginPath(); g.arc(cx, cy, 51, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
        g.drawImage(bigZip, cx - 50, cy - 70 + Math.round(Math.sin(menuT * 2) * 2));
        g.fillStyle = '#e83020'; g.fillRect(cx - 130, cy + 30, 260, 40); g.fillStyle = '#f8d020'; g.fillRect(cx - 130, cy + 30, 260, 3); g.fillRect(cx - 130, cy + 67, 260, 3); g.fillStyle = '#801010'; g.fillRect(cx - 130, cy + 64, 260, 3);
        g.drawImage(logo.a, cx - 126, cy + 22); g.drawImage(logo.b, cx - 26, cy + 45);
        F.center(g, '©SEGUE 1999'.replace('©', '(C) '), cx, 212, '#fff', 1, '#000');
        if (mode === 'title') {
          if ((menuT * 2 | 0) % 2 === 0) F.center(g, 'PRESS START BUTTON', cx, 168, '#fff', 1, '#000');
          const i = Math.floor(menuT / 2.2) % 5, h = sv.hi[i]; F.center(g, 'HI-SCORE  ' + (i + 1) + '. ' + h[0] + '  ' + h[1], cx, 186, '#f8d020', 1, '#000');
          return;
        }
        g.fillStyle = 'rgba(0,0,40,.72)'; g.fillRect(40, 150, W - 80, 58); g.fillStyle = '#f8d020'; g.fillRect(40, 150, W - 80, 1);
        if (mode === 'menu') { const m = menuItems(); const top = clamp(sel - 1, 0, Math.max(0, m.length - 3)); for (let i = top; i < Math.min(m.length, top + 3); i++) F.center(g, (i === sel ? '> ' : '  ') + m[i][0] + (i === sel ? ' <' : '  '), cx, 156 + (i - top) * 16, i === sel ? '#f8d020' : '#fff', 1, '#000'); if (m.length > 3) F.draw(g, (sel + 1) + '/' + m.length, W - 74, 196, '#8888aa', 1); }
        else if (mode === 'ta' || mode === 'sel') { const n = mode === 'ta' ? sv.top + 1 : ACTS.length, i = mode === 'ta' ? taSel : lsSel; F.center(g, (mode === 'ta' ? 'TIME ATTACK: ' : 'LEVEL SELECT: ') + ZONES[i >> 1] + ' ' + (i % 2 + 1), cx, 160, '#f8d020', 1, '#000'); F.center(g, mode === 'ta' ? 'BEST ' + (sv.best['a' + i] != null ? sv.best['a' + i].toFixed(2) + 'S' : '--') : '', cx, 176, '#fff', 1, '#000'); F.center(g, 'LEFT/RIGHT: ACT (' + n + ' OPEN)  JUMP: GO', cx, 192, '#8888cc', 1, '#000'); }
        else if (mode === 'opts') { const rows = ['MUSIC: ' + (sv.opts.music ? 'ON' : 'OFF'), 'MODE: ' + (sv.opts.easy ? 'EASY (5 LIVES)' : 'NORMAL'), 'SOUND TEST: ' + ['BAY', 'WORKS', 'CARNIVAL', 'BOSS', 'BONUS', 'SPEED', 'TITLE'][soundSel], 'BACK']; const top = clamp(optSel - 1, 0, 1); for (let i = top; i < top + 3; i++) F.center(g, (i === optSel ? '> ' : '') + rows[i] + (i === optSel ? ' <' : ''), cx, 156 + (i - top) * 16, i === optSel ? '#f8d020' : '#fff', 1, '#000'); }
      }
      function drawPanel(title, lines) { g.fillStyle = 'rgba(0,0,40,.85)'; g.fillRect(14, 14, W - 28, H - 28); g.fillStyle = '#f8d020'; g.fillRect(14, 14, W - 28, 2); g.fillRect(14, H - 16, W - 28, 2); g.drawImage(label(title, 'Y', 14), W / 2 - title.length * 5, 20); lines.forEach((l, i) => F.center(g, l, W / 2, 46 + i * 12, typeof l === 'string' && l.startsWith('*') ? '#80e0ff' : '#fff', 1)); }
      function drawEnd(title, sub) {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H); if (L) { drawBg(); g.fillStyle = 'rgba(0,0,30,.55)'; g.fillRect(0, 0, W, H); }
        g.drawImage(label(title, 'Y', 24), W / 2 - title.length * 8.6, 40); F.center(g, sub, W / 2, 80, '#fff', 1, '#000'); F.center(g, 'SCORE ' + score, W / 2, 96, '#fff', 2, '#000'); if (mode === 'over') F.center(g, 'PASSWORD: ' + pwOf(actN, gemBits()), W / 2, 118, '#80e0ff', 1, '#000');
        if (mode === 'won') { const n = sv.gems.filter(v => v).length; sv.gems.forEach((v, i) => g.drawImage(v ? O.gem[i] : O.ring[0], W / 2 - 48 + i * 16, 122)); F.center(g, n === 6 ? 'ALL SIX TIME STONES! THE WORLD IS SAFE!' : 'TIME STONES: ' + n + ' OF 6', W / 2, 146, n === 6 ? '#80ff80' : '#fff', 1, '#000'); g.save(); g.translate(W / 2, 214 + Math.abs(Math.sin(menuT * 6)) * -10); g.drawImage(Z.win[0], -24, -46); g.restore(); }
        if (nameEntry) { F.center(g, 'A NEW HIGH SCORE! ENTER YOUR NAME', W / 2, 170, '#f8d020', 1, '#000'); for (let i = 0; i < 3; i++) { const ch = nameEntry.s[i]; F.draw(g, ch, W / 2 - 22 + i * 16, 186, i === nameEntry.i ? ((K.frame & 8) ? '#fff' : '#f8d020') : '#fff', 2, '#000'); } }
      }
      function drawCont() { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.drawImage(label('CONTINUE?', 'Y', 24), W / 2 - 74, 50); const n = Math.max(0, 9 - Math.floor(menuT)); F.center(g, String(n), W / 2, 96, '#fff', 4, '#000'); F.center(g, 'PRESS START   (' + conts + ' LEFT)', W / 2, 140, '#fff', 1); F.center(g, 'PASSWORD: ' + pwOf(actN, gemBits()), W / 2, 156, '#80e0ff', 1); g.save(); g.translate(W / 2, 210); g.drawImage(Z.wait[((menuT * 3) | 0) & 1], -24, -46); g.restore(); }
      function finishRun(won) {
        const s = Math.min(score, MAXSC), pos = sv.hi.findIndex(h => s > h[1]);
        if (s > 0 && (pos >= 0 || sv.hi.length < 8) && !nameEntry) { nameEntry = { s: ['A', 'A', 'A'], i: 0, pos: pos < 0 ? sv.hi.length : pos, won }; try { const nk = window.Net && Net.me && Net.me.nick ? String(Net.me.nick).toUpperCase().replace(/[^A-Z]/g, '') : ''; if (nk.length >= 3) nameEntry.s = nk.slice(0, 3).split(''); } catch (e) {} return; }
        report(won);
      }
      function report(won) { if (reported) return; reported = true; const s = Math.min(score, MAXSC, Math.floor((K.t + 4) * 390)); K.over(s, won ? { title: 'YOU DID IT!', text: 'Dr. Sprocket is beaten. ' + sv.gems.filter(v => v).length + ' of 6 Time Stones.' } : { title: 'GAME OVER', text: `You got to ${L ? L.name : ''} act ${L ? L.act + 1 : 1}.` }); }
      // Additive run save: legacy progress, passwords, records and gem keys stay intact.
      const clone = value => JSON.parse(JSON.stringify(value));
      function checkpoint() {
        if (attract || !P || !L || mode !== 'play') return;
        const player = Object.assign({}, P, { plat: null, loop: null });
        sv.run = clone({ act: actN, seed: levelSeed, player, plat: L.plats.indexOf(P.plat), loop: P.loop && { i:L.loops.indexOf(P.loop.lp), th:P.loop.th },
          score, lives, conts, rings, time, spawnX, spawnT, cam, paused, pmenu, timeAttack, bonusFrom, bonusT, bonusDone, msgBonusT, msgBonus,
          shield, shoes, stars, superT, inv, chain, card, loose, shots, fx, pops, tally: tally && Object.assign({}, tally, { o: L.objs.indexOf(tally.o) }),
          objects: L.objs.flatMap((o,i)=>o.type==='ring'?[]:[Object.assign({i},o)]), spent:L.objs.flatMap((o,i)=>o.type==='ring'&&!o.alive?[i]:[]), plats: L.plats, boss: L.boss, loopsDone });
        save();
      }
      function resumeRun() {
        const r = sv.run; if (!r || !Number.isInteger(r.act) || r.act < 0 || r.act >= ACTS.length || !r.player || !Number.isFinite(r.player.x)) return false;
        mode = 'play'; attract = false; timeAttack = !!r.timeAttack;
        // loadAct writes a legacy continue; preserve the snapshot while rebuilding its deterministic level.
        loadAct(r.act, r.seed || undefined);
        Object.assign(P, r.player); P.plat = L.plats[r.plat] || null; P.loop = r.loop && L.loops[r.loop.i] ? {lp:L.loops[r.loop.i],th:r.loop.th} : null;
        r.objects?.forEach((o,i)=>{const index=o.i==null?i:o.i;if(L.objs[index])Object.assign(L.objs[index],o)});r.spent?.forEach(i=>{if(L.objs[i])L.objs[i].alive=false});
        r.plats?.forEach((o,i)=>{if(L.plats[i])Object.assign(L.plats[i],o)});
        L.boss = r.boss; score=r.score; lives=r.lives; conts=r.conts; rings=r.rings; time=r.time; spawnX=r.spawnX; spawnT=r.spawnT;
        cam=r.cam; paused=!!r.paused; pmenu=r.pmenu||0; bonusFrom=r.bonusFrom; bonusT=r.bonusT; bonusDone=r.bonusDone;msgBonusT=r.msgBonusT||0;msgBonus=r.msgBonus||'';if(msgBonusT>0)afterBonus=()=>{actN=r.act;nextAct()};
        shield=r.shield; shoes=r.shoes; stars=r.stars; superT=r.superT||0; inv=r.inv; chain=r.chain; card=r.card;
        loose=r.loose||[];shots=r.shots||[];fx=r.fx||[];pops=r.pops||[];loopsDone=r.loopsDone||0;
        tally=r.tally&&Object.assign({},r.tally,{o:L.objs[r.tally.o]});
        if(paused)K.music(null);else zsong();return true;
      }
      const onHide = () => checkpoint();
      window.addEventListener('pagehide',onHide);window.addEventListener('beforeunload',onHide); document.addEventListener('visibilitychange',onHide);
      if(K.restoring)resumeRun();
      window.__zipDbg = () => P && L && { x: P.x | 0, y: P.y | 0, gsp: +(P.gsp || 0).toFixed(2), loops: loopsDone, act: actN, rings, score, lives, mode, time, paused, shield, shoes, superT, bonusT, tally: !!tally, boss: L.boss && { on: L.boss.on, hp: L.boss.hp, dead: L.boss.dead }, len: L.len, bonus: !!L.bonus, gems: sv.gems.join('') };
      window.__zipDo = { save: checkpoint, resume: resumeRun, get P(){return P}, get level(){return L},get frames(){return Z}, hit: src=>hit(src), go: (n, x) => { newGame(n || 0); if (x) { P.x = x; P.y = floorAt(x); cam.x = x - W / 2; } }, warp: x => { P.x = x; P.y = floorAt(x) - 1; P.ground = true; P.plat = null; cam.x = x - W / 2; }, rings: n => { rings = n; }, bonus: () => { bonusFrom = actN; loadAct(actN, 1000 + actN * 7); }, lives: n => { lives = n; }, inv: () => { stars = 999; }, score: n => { score = n; }, die: () => die(), boss: () => { const B = L.boss; if (B) { B.on = true; cam.lock = B.x0; B.hp = 0; B.dead = true; B.deadT = 0; } return !!B; }, cap: () => { const c = L.boss && L.boss.cap; if (c) { P.x = c.x; P.y = c.y - 90; P.vy = 1; P.ground = false; P.plat = null; } return !!c; }, sign: () => { const o = L.objs.find(q => q.type === 'sign' || q.type === 'gemspot'); if (o) { P.x = o.x - 60; P.y = floorAt(P.x); P.ground = true; P.gsp = 5; } return !!o; }, mode: () => mode };
      return {
        update(dt) {
          if (K.frame % 120 === 0) checkpoint();
          menuT += dt;
          if (mode === 'title') {
            idleT += dt; if (idleT > 16) { startAttract(); return; }
            if (menuT > 0.4 && (K.pressed('start') || K.pressed('a') || K.pressed('b') || K.pressed('c'))) { mode = 'menu'; sel = 0; idleT = 0; sfx.tone(1320, 0.1); song('title'); }
            for (const d of ['up', 'down', 'left', 'right']) if (K.pressed(d)) { code.push(d); code = code.slice(-4); idleT = 0; }
            return;
          }
          if (mode === 'menu' || mode === 'ta' || mode === 'sel' || mode === 'opts') {
            idleT += dt; if (idleT > 30) { mode = 'title'; K.music(null); idleT = 0; return; }
            if (K.any() || K.pressed('up') || K.pressed('down') || K.pressed('left') || K.pressed('right')) idleT = 0;
            for (const d of ['up', 'down', 'left', 'right']) if (K.pressed(d)) { code.push(d); code = code.slice(-4); }
            if (code.join() === CODE.join() && !selOn) { selOn = true; sv.selOn = 1; save(); K.secret('rm.zip.select'); S.life(); code = []; }
            const ok = K.pressed('a') || K.pressed('c') || K.pressed('start'), back = K.pressed('b');
            if (mode === 'menu') {
              const m = menuItems();
              if (K.pressed('up')) { sel = (sel + m.length - 1) % m.length; sfx.tone(880, 0.04); } if (K.pressed('down')) { sel = (sel + 1) % m.length; sfx.tone(880, 0.04); }
              if (back) { mode = 'title'; K.music(null); }
              if (ok) { const k = m[sel][1]; sfx.tone(1320, 0.08);
                if (k === 'new') newGame(0); else if (k === 'cont') { if (!resumeRun()) { const c = Object.assign({},sv.cont); newGame(c.act); score = c.score | 0; lives = Math.max(0, c.lives | 0); } } else if (k === 'ta') { mode = 'ta'; taSel = Math.min(taSel, sv.top); } else if (k === 'sel') { mode = 'sel'; } else if (k === 'opts') { mode = 'opts'; optSel = 0; } else if (k === 'pw') { mode = 'pw'; pwIn = { s: ['B', 'B', 'B', 'B'], i: 0, bad: 0 }; } else mode = k; }
              return;
            }
            if (mode === 'ta' || mode === 'sel') {
              const n = mode === 'ta' ? sv.top + 1 : ACTS.length; let i = mode === 'ta' ? taSel : lsSel;
              if (K.pressed('left')) i = (i + n - 1) % n; if (K.pressed('right')) i = (i + 1) % n; if (mode === 'ta') taSel = i; else lsSel = i;
              if (back) mode = 'menu';
              if (ok) { if (mode === 'ta') { newGame(i); timeAttack = true; lives = 99; } else newGame(i); }
              return;
            }
            if (mode === 'opts') {
              if (K.pressed('up')) optSel = (optSel + 3) % 4; if (K.pressed('down')) optSel = (optSel + 1) % 4;
              const ch = K.pressed('left') || K.pressed('right') || ok;
              if (ch) { sfx.tone(880, 0.04); if (optSel === 0) { sv.opts.music = sv.opts.music ? 0 : 1; if (sv.opts.music) song('title'); else K.music(null); } else if (optSel === 1) sv.opts.easy = sv.opts.easy ? 0 : 1; else if (optSel === 2) { if (K.pressed('left')) soundSel = (soundSel + 6) % 7; else if (K.pressed('right')) soundSel = (soundSel + 1) % 7; else K.music(SONGS[['bay', 'works', 'carn', 'boss', 'sky', 'shoes', 'title'][soundSel]]); } else if (ok) mode = 'menu'; save(); }
              if (back) { mode = 'menu'; song('title'); }
              return;
            }
          }
          if (mode === 'pw') { const P0 = pwIn; let c = PWA.indexOf(P0.s[P0.i]); if (P0.bad > 0) P0.bad -= dt;
            if (K.pressed('up')) c = (c + 1) % 20; if (K.pressed('down')) c = (c + 19) % 20; P0.s[P0.i] = PWA[c];
            if (K.pressed('left') && P0.i > 0) P0.i--; if (K.pressed('b')) { if (P0.i > 0) P0.i--; else mode = 'menu'; }
            if (K.pressed('right') || K.pressed('a') || K.pressed('start')) { if (P0.i < 3) P0.i++; else { const r = pwRead(P0.s.join('')); if (r) { for (let i = 0; i < 6; i++) if (r.gems & (1 << i)) sv.gems[i] = 1; if (r.act > sv.top) sv.top = r.act; save(); S.life(); newGame(r.act); } else { P0.bad = 1.5; sfx.tone(200, 0.3, 'square', 0.08); } } }
            return; }
          if (mode === 'hi' || mode === 'how') { if (K.any() || K.pressed('b')) mode = 'menu'; return; }
          if (mode === 'cont') { if (menuT > 0.6 && (K.pressed('start') || K.pressed('a'))) { conts--; lives = sv.opts.easy ? 5 : 3; score = 0; mode = 'play'; loadAct(actN); return; } if (menuT > 10) { mode = 'over'; menuT = 0; sv.cont = null; save(); } return; }
          if (mode === 'over' || mode === 'won') {
            if (nameEntry) { const ne = nameEntry, AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!'; let c = AB.indexOf(ne.s[ne.i]);
              if (K.pressed('up')) c = (c + 1) % AB.length; if (K.pressed('down')) c = (c + AB.length - 1) % AB.length; ne.s[ne.i] = AB[c];
              if (K.pressed('a') || K.pressed('start') || K.pressed('right')) { ne.i++; sfx.tone(1320, 0.05); if (ne.i >= 3) { sv.hi.splice(ne.pos, 0, [ne.s.join(''), Math.min(score, MAXSC)]); sv.hi = sv.hi.slice(0, 8); save(); nameEntry = null; menuT = 0; report(ne.won); } }
              if ((K.pressed('b') || K.pressed('left')) && ne.i > 0) ne.i--;
              return; }
            if ((mode==='won' ? menuT>36 || (menuT>8 && K.pressed('start')) : menuT>2.4) && !reported) finishRun(mode === 'won');
            return;
          }
          // ---- playing
          if (attract) { attractT += dt; ai(); if (K.any() || K.pressed('start') || attractT > 26 || P.dead) { stopAttract(); return; } }
          else if (window.__zipAI) ai();
          else if (K.pressed('start') && !tally && !msgBonusT) { paused = !paused; pmenu = 0; sfx.tone(paused ? 440 : 880, 0.06); if (paused) K.music(null); else zsong(); checkpoint(); }
          if (paused) {
            if (K.pressed('up')) pmenu = (pmenu + 2) % 3; if (K.pressed('down')) pmenu = (pmenu + 1) % 3;
            if (K.pressed('a') || K.pressed('c')) { if (pmenu === 0) { paused = false; zsong(); } else if (pmenu === 1) { paused = false; if (!timeAttack && !L.bonus) lives = Math.max(0, lives - 1); spawnX = L.start; spawnT = 0; loadAct(L.bonus ? bonusFrom : actN); } else { checkpoint(); paused = false; L = null; titleL = null; mode = 'title'; menuT = 0; K.music(null); } }
            if (K.pressed('b')) { paused = false; zsong(); }
            return;
          }
          if (card > 0) card -= dt;
          if(!attract&&!L.bonus&&!tally&&sv.gems.slice(0,6).every(Boolean)&&rings>=50&&K.pressed('select')&&superT<=0){superT=1;S.life();song('shoes');}
          if(superT>0&&!tally&&!P.dead){superT-=dt;if(superT<=0){rings=Math.max(0,rings-1);superT=rings>0?1:0;if(!superT)zsong()}if(K.frame%5===0)fx.push({kind:'spark',x:P.x+(Math.random()-.5)*30,y:P.y-8-Math.random()*32,t:0})}

          if (msgBonusT > 0) { msgBonusT -= dt; if (msgBonusT <= 0 && afterBonus) { const f = afterBonus; afterBonus = null; f(); } return; }
          if (tally) { stepTally(); objects(); camera(); return; }
          if (!P.dead && card < 2.2) { time += dt; if (L.bonus) { bonusT -= dt; if (bonusT <= 0) { endBonus(false); return; } } }
          if (time >= 600 && !timeAttack) die();
          if (inv > 0) inv--;
          if (shoes > 0) { shoes -= dt; if (shoes <= 0) { shoes = 0; zsong(); } }
          if (stars > 0) { stars -= dt; if (stars <= 0) { stars = 0; zsong(); } }
          for (const o of L.objs) { if(o.spinT>0)o.spinT-=dt;if(o.prize>0)o.prize-=dt; }
          for (const f of fx) {
            if(f.kind==='critter'){f.x+=f.vx;f.vy+=.2;f.y+=f.vy;const gy=floorAt(f.x);if(f.y>gy){f.y=gy;f.vy=-3.6}}
            if(f.kind==='flame'){f.x+=f.vx||0;f.y+=2.6}
            if(f.kind==='wave'){f.x+=f.dir*4;const h=14-f.t*6;if(!P.dead&&Math.abs(f.x-P.x)<10&&P.y>f.y-h-2&&P.ground)hit(f.x)}
          }
          P.anim += Math.abs(P.gsp)>9 ? Math.abs(P.gsp)/30 : .08+Math.abs(P.gsp)/28;
          stepPlayer();
          if (mode !== 'play') return;
          objects(); capsuleStep(); camera();
          for (const f of fx) f.t += dt; fx = fx.filter(f => f.t < (f.kind === 'critter' ? 3 : f.kind === 'boom' ? 0.36 : f.kind === 'flame' ? 0.5 : f.kind === 'wave' ? 1.6 : f.kind === 'gemget' ? 2 : 0.4));
          for (const p of pops) p.t += dt; pops = pops.filter(p => p.t < 0.8);
          if (shake > 0) shake -= 0.5;
        },
        draw() {
          if (mode === 'title' || mode === 'menu' || mode === 'ta' || mode === 'sel' || mode === 'opts') return drawTitle();
          if (mode === 'hi') { drawTitle(); return drawPanel('HIGH SCORES', sv.hi.map((h, i) => `${i + 1}. ${h[0].padEnd(8, ' ')} ${String(h[1]).padStart(6, ' ')}`).concat(['', 'ACT RECORDS: ' + Object.keys(sv.best).length + '/' + ACTS.length, 'TIME STONES ' + sv.gems.filter(v => v).length + '/6'])); }
          if (mode === 'pw') { drawTitle(); drawPanel('PASSWORD', ['', '', '', '', '', '', 'UP/DOWN: LETTER   LEFT/RIGHT: MOVE', pwIn.bad > 0 ? 'THAT PASSWORD IS NOT RIGHT' : 'THE PASSWORD IS ON THE CONTINUE SCREEN']); for (let i = 0; i < 4; i++) F.draw(g, pwIn.s[i], W / 2 - 40 + i * 22, 84, i === pwIn.i ? ((K.frame & 8) ? '#fff' : '#f8d020') : '#fff', 3, '#000'); return; }
          if (mode === 'how') { drawTitle(); return drawPanel('HOW TO PLAY', ['RUN: LEFT / RIGHT     JUMP: ' + K.keyLabel('a') + ' ' + K.keyLabel('b') + ' OR ' + K.keyLabel('c'), 'ROLL: PRESS DOWN WHILE RUNNING', 'SPIN DASH: HOLD DOWN, PRESS JUMP, LET GO', '', '*JUMP ON BADNIKS OR ROLL INTO THEM', '*KEEP HOLD OF A RING OR YOU LOSE A LIFE', '*SPIKY TURTLES: HIT THEM FROM THE SIDE', '*50 RINGS AT THE END: BONUS STAGE!', '*SIX STONES + 50 RINGS: SHIFT = BURROW POWER', '', 'HIT DR. SPROCKET\'S POD WHILE YOU SPIN']); }
          if (mode === 'over') return drawEnd('GAME OVER', 'ZIP NEEDS A LIE DOWN');
          if (mode === 'won') {
            drawEnd('WELL DONE!', 'DR. SPROCKET IS SCRAP METAL');
            if(menuT>8&&!nameEntry){g.fillStyle='#160c28';g.fillRect(0,0,W,H);const lines=['ZIP THE BADGER','','DIG THE SPEED!','','ORIGINAL GAME AND ART','ZIP TEAM','','TWELVE ACTS / SIX ZONES','SIX TIME STONES','ONE VERY CROSS DOCTOR','','TEST CREW','JACK  DAVE  LUKE  CALLUM  JACKK','','SANDWICHES BY MOM','','THANK YOU FOR PLAYING!','','TRY TIME ATTACK','FIND THE HIGH ROADS','AND BRING EVERY CRITTER HOME'];for(let i=0;i<lines.length;i++){const y=H-50-(menuT-8)*18+i*14;if(y>-12&&y<H-22)F.center(g,lines[i],W/2,y,i%3===0?'#ffd23a':'#fff',1,'#000')}F.center(g,'START: SKIP CREDITS',W/2,H-12,'#c088e8',1,'#000')}
            return;
          }
          if (mode === 'cont') return drawCont();
          const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
          g.save(); g.translate(Math.round(sx), 0);
          drawBg();
          for (const lp of L.loops) drawLoopBack(lp);
          drawDeco(false); corkscrew(false); drawGround(); drawObjs(); drawBoss(); drawPlayer(); corkscrew(true); drawDeco(true); drawFx();
          g.restore();
          hud();
        },
        end() { checkpoint(); window.removeEventListener('pagehide',onHide);window.removeEventListener('beforeunload',onHide);document.removeEventListener('visibilitychange',onHide);K.music(null);delete window.__zipDo;delete window.__zipDbg; },
      };
    },
  });
})();

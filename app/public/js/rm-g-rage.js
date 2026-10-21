/* PAVEMENTS OF PERIL (Mega Drive, in Jack's room): a scrolling street brawler across one long night in a 1999 British
 * seaside town. Five stages, each with its own boss: GRIMSBY STREET (Moped Mick), THE PRECINCT (Security Stan and his
 * torch), THE PROM at sunset (Big Barry and his wheelie bin), THE PIER funfair (Candyfloss Carl) and the roof of
 * GRIMLY TOWERS, where Mr Grimly himself is waiting with his umbrella.
 * Pick KEV (big punches), SHAZ (fast feet) or, once you've finished it, NAN (handbag).
 *   Z punch (keep pressing: a combo)  X jump (Z in the air: flying kick)  C special spin (only costs health if it hits)
 *   Tap a direction twice to run (Z while running: a shoulder barge). Walk into somebody to grab them: Z knees,
 *   X throws them (hold the other way to throw them behind you). Every hit fills the MOM meter: when it flashes, C
 *   calls Mom, who drives past honking and everybody falls over in fright.
 * Bins, crates and phone boxes hide fish and chips, sausage rolls, a Sunday roast, pocket money, cassettes, a lead pipe
 * and a cricket bat. On the title, hold X and press START for the cheat menu (stage select, 9 lives). Each stage card shows a PASSWORD
 * (enter it from the menu to start from that stage; the secret one lets Nan have a go). The cartoon thugs never get hurt for real: beaten, they say sorry and run off home.
 * Title screen with an attract demo, options (difficulty, lives, music), how to play, a pause menu, a continue screen,
 * passwords, and a battery-backed high-score table (initials) and unlocks.
 * Everything here (the people, the town, the music) is drawn and written from scratch. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const SECRETS = [['rm.rage.nan', 'Nan\'s Night Out', 'Clean up every street in Pavements of Peril and somebody new wants a go.'],
    ['rm.rage.combo', 'Combo King', 'Land a really long combo in Pavements of Peril without stopping.']];
  try { if (window.Apps && Apps.defineSecret) for (const [id, n, hint] of SECRETS) if (!(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, hint); } catch (e) {}
  const W = 320, H = 224, TOPY = 150, BOTY = 210;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const q9 = v => clamp(Math.round(v / 36.43) * 36.43, 0, 255) | 0; // 3 bits a channel: the Mega Drive's 512 colours
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = l => l[Math.floor(Math.random() * l.length)];
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function hexRGB(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function shade(c, k) { const [r, g, b] = hexRGB(c); const f = v => clamp(Math.round(v * k), 0, 255).toString(16).padStart(2, '0'); return '#' + f(r) + f(g) + f(b); }
  const ell = (g, x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2); g.fill(); };
  const rect = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const poly = (g, pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  // ---------------------------------------------------------------- crisping: hard alpha, cel shading (lit from the top
  // left), the 512-colour palette and a dark outline. Drawn with smooth shapes, it comes out as 16-bit pixel art.
  function crisp(c, outline, flat) {
    const w = c.width, h = c.height, g = c.getContext('2d');
    let im; try { im = g.getImageData(0, 0, w, h); } catch (e) { return c; }
    const d = im.data, a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] > 110 ? 1 : 0;
    const A = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, o = i * 4; if (!a[i]) { d[o + 3] = 0; continue; }
      let k = 1;
      if (!flat) { if (!A(x + 2, y) || !A(x + 1, y + 2) || !A(x, y + 3)) k = 0.66; else if (!A(x - 1, y) || !A(x, y - 2)) k = 1.28; }
      d[o] = q9(d[o] * k); d[o + 1] = q9(d[o + 1] * k); d[o + 2] = q9(d[o + 2] * k); d[o + 3] = 255;
    }
    if (outline) {
      const [r, gg, b] = hexRGB(outline);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (a[i]) continue; if (A(x - 1, y) || A(x + 1, y) || A(x, y - 1) || A(x, y + 1)) { const o = i * 4; d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; } }
    }
    g.putImageData(im, 0, 0); return c;
  }
  // a smooth gradient, banded to the palette and ordered-dithered between bands (the Mega Drive sky look)
  function dgrad(g, x0, y0, w, h, stops) {
    const im = g.createImageData(w, h), d = im.data, cols = stops.map(([t, c]) => [t, hexRGB(c)]);
    for (let y = 0; y < h; y++) {
      const t = y / Math.max(1, h - 1); let k = 0; while (k < cols.length - 2 && t > cols[k + 1][0]) k++;
      const [t0, c0] = cols[k], [t1, c1] = cols[k + 1], f = clamp((t - t0) / Math.max(0.0001, t1 - t0), 0, 1);
      const rgb = [0, 1, 2].map(j => (c0[j] + (c1[j] - c0[j]) * f) / 36.43);
      for (let x = 0; x < w; x++) {
        const th = (BAYER[y & 3][x & 3] + 0.5) / 16, o = (y * w + x) * 4;
        for (let j = 0; j < 3; j++) { const v = rgb[j], fl = Math.floor(v); d[o + j] = clamp(Math.round((v - fl > th ? fl + 1 : fl) * 36.43), 0, 255); }
        d[o + 3] = 255;
      }
    }
    g.putImageData(im, x0, y0);
  }

  // ---------------------------------------------------------------- people: a look + a pose. Angles: 0 = straight down,
  // PI/2 = forward (everyone is drawn facing right), PI = up. [upper, lower] for each limb; arms/legs: [back, front].
  const POSES = {
    idle: { lean: 0.05, legs: [[-0.22, -0.05], [0.25, 0.1]], arms: [[0.5, 2.3], [0.9, 2.6]] },
    idle2: { lean: 0.07, bob: 1, legs: [[-0.22, -0.05], [0.25, 0.1]], arms: [[0.45, 2.2], [0.85, 2.5]] },
    walk0: { lean: 0.1, legs: [[-0.5, -0.75], [0.5, 0.25]], arms: [[0.6, 1.9], [-0.2, 0.9]] },
    walk1: { lean: 0.1, bob: -1, legs: [[-0.05, -0.4], [0.1, 0.05]], arms: [[0.3, 1.5], [0.2, 1.4]] },
    walk2: { lean: 0.1, legs: [[0.5, 0.25], [-0.5, -0.75]], arms: [[-0.2, 0.9], [0.6, 1.9]] },
    walk3: { lean: 0.1, bob: -1, legs: [[0.1, 0.05], [-0.05, -0.4]], arms: [[0.2, 1.4], [0.3, 1.5]] },
    run0: { lean: 0.35, legs: [[-0.9, -1.6], [0.9, 0.3]], arms: [[1.2, 2.4], [-0.6, 0.6]] },
    run1: { lean: 0.35, bob: -2, legs: [[0.9, 0.3], [-0.9, -1.6]], arms: [[-0.6, 0.6], [1.2, 2.4]] },
    jab: { lean: 0.15, legs: [[-0.4, -0.2], [0.4, 0.22]], arms: [[0.7, 2.5], [1.55, 1.58]] },
    cross: { lean: 0.3, legs: [[-0.45, -0.25], [0.35, 0.2]], arms: [[1.6, 1.62], [0.6, 2.3]] },
    hook: { lean: 0.32, bob: -2, legs: [[-0.3, -0.4], [0.4, 0.3]], arms: [[0.3, 2.0], [1.8, 2.9]] },
    upper: { lean: 0.1, bob: -3, legs: [[-0.35, -0.5], [0.3, 0.1]], arms: [[0.4, 1.8], [1.2, 2.95]] },
    hikick: { lean: -0.35, legs: [[-0.1, -0.05], [1.9, 1.75]], arms: [[-0.8, 0.4], [0.9, 2.4]] },
    jump: { lean: 0.1, legs: [[0.7, -0.5], [1.2, -0.1]], arms: [[-0.6, 0.8], [0.6, 2.6]] },
    jkick: { lean: -0.25, legs: [[0.5, -0.9], [1.5, 1.55]], arms: [[-0.9, 0.3], [0.5, 2.7]] },
    barge: { lean: 0.55, legs: [[-0.7, -1.0], [0.7, 0.2]], arms: [[0.6, 1.9], [1.0, 2.2]] },
    grab: { lean: 0.15, legs: [[-0.3, -0.2], [0.3, 0.2]], arms: [[1.25, 1.5], [1.35, 1.65]] },
    knee: { lean: 0.25, legs: [[-0.2, -0.1], [1.45, -0.1]], arms: [[1.0, 1.3], [1.1, 1.45]] },
    throw: { lean: -0.4, legs: [[-0.45, -0.3], [0.4, 0.3]], arms: [[2.7, 3.0], [2.9, 3.1]] },
    hurt: { lean: -0.35, legs: [[-0.3, -0.3], [0.2, 0.25]], arms: [[-0.7, -0.2], [-0.3, 0.6]], ouch: 1 },
    hurt2: { lean: 0.4, bob: 2, legs: [[-0.3, -0.1], [0.3, 0.2]], arms: [[0.4, 0.9], [0.6, 1.2]], ouch: 1 },
    spin0: { lean: 0, legs: [[-0.5, -0.5], [0.9, 0.2]], arms: [[-1.57, -1.57], [1.57, 1.57]] },
    spin1: { lean: 0, legs: [[0.9, 0.2], [-0.5, -0.5]], arms: [[1.57, 1.57], [-1.57, -1.57]] },
    limp: { lean: 0, legs: [[0.05, 0.05], [-0.08, -0.05]], arms: [[0.15, 0.3], [-0.1, -0.2]], ouch: 1 },
    getup: { lean: 0.45, bob: 10, legs: [[1.0, -0.7], [1.3, -0.3]], arms: [[0.9, 0.4], [1.1, 0.5]] },
    flee0: { lean: 0.25, legs: [[-0.6, -0.9], [0.6, 0.3]], arms: [[2.6, 3.0], [2.8, 3.1]], ouch: 1 },
    flee1: { lean: 0.25, bob: -2, legs: [[0.6, 0.3], [-0.6, -0.9]], arms: [[2.8, 3.1], [2.6, 3.0]], ouch: 1 },
    swing0: { lean: -0.1, legs: [[-0.38, -0.2], [0.38, 0.22]], arms: [[0.4, 2.4], [2.6, 2.9]], wpn: 1 },
    swing1: { lean: 0.3, legs: [[-0.4, -0.25], [0.4, 0.25]], arms: [[0.5, 2.4], [1.3, 1.1]], wpn: 2 },
    skate: { lean: 0.15, legs: [[-0.15, -0.1], [0.2, 0.15]], arms: [[1.3, 1.2], [-1.1, -1.3]], board: 1 },
    wind: { lean: -0.2, legs: [[-0.4, -0.25], [0.35, 0.2]], arms: [[0.5, 2.5], [-0.7, 1.9]] },
    lift: { lean: -0.1, legs: [[-0.3, -0.2], [0.3, 0.2]], arms: [[2.4, 2.9], [2.5, 3.0]] },
    block: { lean: -0.05, legs: [[-0.35, -0.2], [0.3, 0.2]], arms: [[1.0, 3.0], [1.2, 3.05]] },
    dizzy: { lean: -0.15, bob: 1, legs: [[-0.2, 0.1], [0.3, -0.1]], arms: [[0.3, 0.2], [-0.2, -0.1]], ouch: 1 },
    win: { lean: 0, legs: [[-0.25, -0.05], [0.25, 0.05]], arms: [[0.4, 0.6], [2.8, 3.0]] },
    poke: { lean: 0.25, legs: [[-0.45, -0.25], [0.45, 0.25]], arms: [[0.5, 2.3], [1.6, 1.6]], wpn: 3 },
  };
  const OL = '#140c1c';
  function paint(look, pose, wpn) {
    const S = (look.size || 1) * 1.3, CW = Math.ceil(70 * S), CH = Math.ceil(84 * S);
    const c = canvas(CW, CH), g = c.getContext('2d');
    const ox = CW / 2, oy = CH - 4, P = POSES[pose];
    g.lineCap = 'round'; g.lineJoin = 'round';
    const hipY = oy - 25 * S + (P.bob || 0) * S, hipX = ox - 2 * S;
    const shX = hipX + P.lean * 18 * S, shY = hipY - 18 * S;
    const seg = (x, y, a, len) => [x + Math.sin(a) * len, y + Math.cos(a) * len];
    const line = (pts, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); };
    const limb = (x, y, a1, a2, l1, l2, w1, w2, col, col2, outl) => {
      const [kx, ky] = seg(x, y, a1, l1), [fx, fy] = seg(kx, ky, a2, l2);
      if (outl) line([x, y, kx, ky, fx, fy], Math.max(w1, w2) + 1.6 * S, OL);
      line([x, y, kx, ky], w1, col); line([kx, ky, fx, fy], w2, col2 || col);
      return [kx, ky, fx, fy];
    };
    const leg = (L, back) => {
      const k = back ? 0.72 : 1, col = shade(look.legs, k);
      const [kx, ky, fx, fy] = limb(hipX + (back ? -2.5 : 2) * S, hipY, L[0], L[1], 12 * S, 12 * S, 6.4 * S, 5.6 * S, col, look.socks ? shade(look.socks, k) : col, !back);
      if (look.skirt && !back) {} // (the skirt covers the tops of the legs: drawn with the body)
      // the shoe: a wedge pointing forward, a pale sole
      const sc = shade(look.shoes, k);
      poly(g, [fx - 3 * S, fy - 2.4 * S, fx + 2 * S, fy - 2.6 * S, fx + 6 * S, fy + 0.2 * S, fx + 6 * S, fy + 2.2 * S, fx - 3.4 * S, fy + 2.2 * S], sc);
      rect(g, fx - 3.4 * S, fy + 1.4 * S, 9.4 * S, 1 * S, look.sole || shade(look.shoes, 0.6));
      return [kx, ky];
    };
    const sleeve = look.sleeve || look.top;
    const arm = (A, back) => {
      const k = back ? 0.72 : 1, sx = shX + (back ? -2.5 : 2.5) * S, sy = shY + 2 * S;
      const [, , fx, fy] = limb(sx, sy, A[0], A[1], 8.8 * S, 8.4 * S, 5 * S, 4.2 * S, shade(sleeve, k), look.bare ? shade(look.skin, k) : shade(sleeve, k), !back);
      if (!look.bare && look.cuff) { const [cx, cy] = seg(fx, fy, A[1] + Math.PI, 1.6 * S); ell(g, cx, cy, 2.2 * S, 2.2 * S, shade(look.cuff, k)); }
      ell(g, fx, fy, 3.1 * S, 3.1 * S, shade(look.gloves || look.skin, k));
      return [fx, fy, A[1]];
    };
    if (P.board) { rect(g, ox - 16 * S, oy - 4 * S, 32 * S, 3 * S, '#c82a1a'); rect(g, ox - 16 * S, oy - 4 * S, 32 * S, 1 * S, '#f07a4a'); ell(g, ox - 10 * S, oy, 2.2 * S, 2.2 * S, '#e8e8e8'); ell(g, ox + 10 * S, oy, 2.2 * S, 2.2 * S, '#e8e8e8'); }
    // ---- back limbs
    const backHand = arm(P.arms[0], true); leg(P.legs[0], true);
    // ---- the body: a side-on torso (shoulders wider than the hips), then its details
    const mx = (hipX + shX) / 2, my = (hipY + shY) / 2, bw = look.belly ? 1.25 : 1;
    if (look.skirt) poly(g, [hipX - 6 * S, hipY - 3 * S, hipX + 6 * S, hipY - 3 * S, hipX + 8.5 * S, hipY + 9 * S, hipX - 8 * S, hipY + 9 * S], look.skirt);
    if (look.coat) poly(g, [hipX - 6 * S, hipY - 4 * S, hipX + 6.5 * S, hipY - 4 * S, hipX + 7.5 * S, hipY + 8 * S, hipX - 7 * S, hipY + 8 * S], look.top);
    g.fillStyle = look.top; g.beginPath();
    g.moveTo(hipX - 4.8 * S, hipY + 1 * S); g.lineTo(shX - 5.4 * S, shY + 1 * S); g.quadraticCurveTo(shX, shY - 3 * S, shX + 5.4 * S, shY + 1.5 * S);
    g.quadraticCurveTo(mx + 7.5 * S * bw, my, hipX + 5 * S * bw, hipY + 1 * S); g.closePath(); g.fill();
    if (look.belly) ell(g, mx + 4 * S, my + 3 * S, 6 * S, 7 * S, look.top);
    if (look.tee) poly(g, [shX + 1.5 * S, shY, shX + 4.8 * S, shY + 1.5 * S, mx + 6 * S, my, hipX + 4.6 * S, hipY - 1 * S, hipX + 2 * S, hipY - 1 * S], look.tee); // jacket open over a tee
    if (look.shirt) { poly(g, [shX + 1 * S, shY + 0.5 * S, shX + 5 * S, shY + 1.5 * S, mx + 3 * S, my - 1 * S], look.shirt); if (look.tie) line([shX + 3 * S, shY + 2 * S, mx + 3.5 * S, my + 4 * S], 1.6 * S, look.tie); }
    if (look.stripe) line([hipX - 1 * S, hipY - 1 * S, shX - 1 * S, shY + 2 * S], 1.4 * S, look.stripe);
    if (look.vest) { line([hipX - 4 * S, hipY - 6 * S, mx + 6 * S, my - 2 * S], 2.2 * S, look.vest); line([hipX - 4 * S, hipY - 2 * S, mx + 6 * S, my + 2 * S], 2.2 * S, look.vest); }
    if (look.studs) for (let i = 0; i < 4; i++) ell(g, mx + (i - 1.5) * 2.4 * S, my - 3 * S + i * 1.6 * S, 0.8 * S, 0.8 * S, '#e8e8f0');
    if (look.stripes) for (let i = 0; i < 4; i++) line([hipX - 4 * S + i * 3 * S, hipY, shX - 4 * S + i * 3 * S, shY + 2 * S], 1.2 * S, look.stripes);
    if (look.badge) rect(g, mx + 2 * S, my - 4 * S, 2.4 * S, 2.4 * S, look.badge);
    if (look.satchel) { line([shX - 2 * S, shY + 1 * S, hipX + 3 * S, hipY - 2 * S], 1.4 * S, '#6a3a10'); rect(g, hipX - 8 * S, hipY - 7 * S, 7 * S, 7 * S, look.satchel); rect(g, hipX - 8 * S, hipY - 7 * S, 7 * S, 2 * S, shade(look.satchel, 0.7)); }
    if (!look.skirt) rect(g, hipX - 5 * S, hipY - 2.5 * S, 10 * S * bw, 2.4 * S, look.belt || shade(look.legs, 0.55)); // belt
    leg(P.legs[1], false);
    // ---- the head
    const hx = shX + 1.5 * S + P.lean * 2 * S, hy = shY - 7.2 * S, sk = look.skin, hc = look.hairCol || '#3a2410';
    rect(g, shX - 1.2 * S, shY - 3 * S, 4 * S, 4 * S, shade(sk, 0.85)); // neck
    if (look.hair === 'hood') ell(g, hx - 1.5 * S, hy - 0.5 * S, 8 * S, 8 * S, look.top);
    if (look.hair === 'pony') { poly(g, [hx - 6 * S, hy - 3 * S, hx - 12 * S, hy + 5 * S, hx - 9 * S, hy + 7 * S, hx - 4 * S, hy], hc); ell(g, hx - 6 * S, hy - 2.5 * S, 2.2 * S, 2.2 * S, look.bobble || '#e0306a'); }
    if (look.hair === 'bun') ell(g, hx - 6 * S, hy - 3 * S, 3.2 * S, 3.2 * S, hc);
    ell(g, hx, hy, 6.2 * S, 6.8 * S, sk);                      // the head
    ell(g, hx + 2.6 * S, hy + 3 * S, 4.2 * S, 3.4 * S, sk);   // the jaw
    poly(g, [hx + 5.6 * S, hy - 1 * S, hx + 7.6 * S, hy + 1.8 * S, hx + 5.4 * S, hy + 2 * S], sk); // the nose
    ell(g, hx - 1.8 * S, hy + 0.6 * S, 1.6 * S, 2 * S, shade(sk, 0.8)); // the ear
    if (look.beard) ell(g, hx + 2.6 * S, hy + 4.2 * S, 4.6 * S, 3 * S, hc);
    if (look.tache) rect(g, hx + 3.2 * S, hy + 2.6 * S, 3.6 * S, 1.3 * S, look.tacheCol || hc);
    // hair and hats
    const H2 = look.hair;
    if (H2 === 'spiky') { for (let i = 0; i < 5; i++) poly(g, [hx - 6.5 * S + i * 2.6 * S, hy - 2.5 * S, hx - 7.5 * S + i * 2.4 * S, hy - 10 * S - (i % 2) * 1.6 * S, hx - 3 * S + i * 2.6 * S, hy - 4 * S], hc); ell(g, hx - 1.4 * S, hy - 4 * S, 6 * S, 3.4 * S, hc); poly(g, [hx - 6 * S, hy - 3 * S, hx - 6 * S, hy + 3 * S, hx - 3 * S, hy - 1 * S], hc); }
    else if (H2 === 'pony') { ell(g, hx - 1 * S, hy - 3.6 * S, 6.4 * S, 3.8 * S, hc); poly(g, [hx + 4 * S, hy - 5 * S, hx + 6.4 * S, hy - 1 * S, hx + 3 * S, hy - 2.6 * S], hc); }
    else if (H2 === 'short') { ell(g, hx - 1.2 * S, hy - 4 * S, 6.2 * S, 3.4 * S, hc); poly(g, [hx - 6.2 * S, hy - 3 * S, hx - 6 * S, hy + 2 * S, hx - 3 * S, hy - 2 * S], hc); }
    else if (H2 === 'cap') { ell(g, hx - 0.5 * S, hy - 4 * S, 6.6 * S, 3.8 * S, look.capCol); rect(g, hx - 11 * S, hy - 4.6 * S, 6 * S, 2 * S, shade(look.capCol, 0.8)); }
    else if (H2 === 'helmet') { ell(g, hx - 0.4 * S, hy - 1.5 * S, 7.6 * S, 7.4 * S, look.capCol); poly(g, [hx + 1 * S, hy - 3 * S, hx + 8 * S, hy - 2 * S, hx + 8 * S, hy + 2 * S, hx + 1 * S, hy + 1.5 * S], '#203048'); line([hx - 6 * S, hy - 3 * S, hx + 2 * S, hy - 8 * S], 1.4 * S, '#d02a2a'); }
    else if (H2 === 'hood') { ell(g, hx - 2.4 * S, hy - 3 * S, 6.6 * S, 4.4 * S, shade(look.top, 0.9)); poly(g, [hx - 8 * S, hy - 1 * S, hx - 5 * S, hy + 7 * S, hx - 2 * S, hy + 6 * S], shade(look.top, 0.85)); }
    else if (H2 === 'bald') ell(g, hx - 1 * S, hy - 4 * S, 2.2 * S, 1.3 * S, shade(sk, 1.25));
    else if (H2 === 'mohican') { for (let i = 0; i < 5; i++) poly(g, [hx - 5 * S + i * 2.2 * S, hy - 5 * S, hx - 4 * S + i * 2.2 * S, hy - 13 * S + Math.abs(i - 2) * 1.5 * S, hx - 2.6 * S + i * 2.2 * S, hy - 5.5 * S], i % 2 ? hc : (look.hairCol2 || hc)); }
    else if (H2 === 'bun') { ell(g, hx - 1 * S, hy - 3.6 * S, 6.4 * S, 3.8 * S, hc); for (let i = 0; i < 4; i++) ell(g, hx - 4 * S + i * 2.4 * S, hy - 5.6 * S, 1.6 * S, 1.6 * S, shade(hc, 1.15)); }
    else if (H2 === 'peak') { ell(g, hx - 0.5 * S, hy - 4.5 * S, 6.8 * S, 3.6 * S, look.capCol); rect(g, hx - 5 * S, hy - 5 * S, 12 * S, 2.6 * S, look.capCol); poly(g, [hx + 3 * S, hy - 3 * S, hx + 10 * S, hy - 2 * S, hx + 4 * S, hy - 1.2 * S], '#101018'); rect(g, hx + 1 * S, hy - 6 * S, 2 * S, 2 * S, '#f0d040'); }
    else if (H2 === 'bowler') { ell(g, hx - 0.5 * S, hy - 5 * S, 5.6 * S, 4.6 * S, look.capCol); rect(g, hx - 8 * S, hy - 3.6 * S, 16 * S, 1.8 * S, look.capCol); rect(g, hx - 5.5 * S, hy - 5 * S, 11 * S, 1.2 * S, '#a01a3a'); }
    else if (H2 === 'boater') { rect(g, hx - 6 * S, hy - 9 * S, 12 * S, 5 * S, '#f0d890'); rect(g, hx - 6 * S, hy - 5.8 * S, 12 * S, 1.6 * S, '#c01a2a'); rect(g, hx - 9 * S, hy - 4.4 * S, 18 * S, 1.6 * S, '#e0c070'); }
    // the face
    if (H2 !== 'helmet') {
      const ey = hy - 0.6 * S;
      if (P.ouch) { line([hx + 1.8 * S, ey - 1.4 * S, hx + 4.4 * S, ey + 1.2 * S], 1.1 * S, '#100808'); line([hx + 4.4 * S, ey - 1.4 * S, hx + 1.8 * S, ey + 1.2 * S], 1.1 * S, '#100808'); ell(g, hx + 4.2 * S, hy + 3.6 * S, 1.4 * S, 1.2 * S, '#3a0808'); }
      else {
        if (look.shades) rect(g, hx + 0.6 * S, ey - 1.4 * S, 6 * S, 2.6 * S, '#101018');
        else { rect(g, hx + 2.2 * S, ey - 1.2 * S, 2.6 * S, 2.6 * S, '#f8f8f0'); rect(g, hx + 3.6 * S, ey - 1 * S, 1.3 * S, 2.2 * S, '#101018'); }
        if (look.specs) { g.strokeStyle = '#d0d0e0'; g.lineWidth = 0.9 * S; g.strokeRect(hx + 1.6 * S, ey - 1.8 * S, 4 * S, 3.4 * S); }
        rect(g, hx + 1.6 * S, ey - (look.mean ? 2.6 : 3) * S, 4 * S, 1 * S, look.mean ? '#201008' : shade(hc, 0.9)); // the eyebrow
        if (look.mean) rect(g, hx + 4 * S, ey - 2.2 * S, 1.4 * S, 1 * S, '#201008');
        if (!look.tache) rect(g, hx + 3 * S, hy + 3.4 * S, 3 * S, 0.9 * S, shade(sk, 0.55));
      }
    }
    // ---- the front arm (over everything) and whatever is in that hand
    const [fx, fy, fa] = arm(P.arms[1], false);
    const item = wpn || look.item;
    if (item) {
      const ang = P.wpn === 1 ? fa + 0.3 : P.wpn === 2 ? fa + 0.9 : P.wpn === 3 ? Math.PI / 2 : fa + 0.25;
      const ex2 = (len) => [fx + Math.sin(ang) * len * S, fy + Math.cos(ang) * len * S];
      if (item === 'pipe') { const [x2, y2] = ex2(19); line([fx, fy, x2, y2], 4 * S, OL); line([fx, fy, x2, y2], 2.6 * S, '#8a8a9a'); }
      else if (item === 'bat') { const [x1, y1] = ex2(6), [x2, y2] = ex2(24); line([fx, fy, x2, y2], 3 * S, OL); line([fx, fy, x1, y1], 2 * S, '#3a2010'); line([x1, y1, x2, y2], 4.4 * S, '#e0b060'); }
      else if (item === 'brolly') { const [x2, y2] = ex2(26); line([fx, fy, x2, y2], 4.6 * S, '#181820'); line([fx, fy, x2, y2], 1.2 * S, '#c0c0c8'); ell(g, fx - 1 * S, fy + 1 * S, 2 * S, 2 * S, '#7a4a20'); }
      else if (item === 'torch') { const [x2, y2] = ex2(9); line([fx, fy, x2, y2], 3.6 * S, '#282830'); ell(g, x2, y2, 2.4 * S, 2.4 * S, '#f8f0a0'); }
      else if (item === 'floss') { const [x2, y2] = ex2(14); line([fx, fy, x2, y2], 1.6 * S, '#e8e0c0'); ell(g, x2, y2, 6 * S, 5 * S, '#f8a0d0'); ell(g, x2 - 2 * S, y2 - 2 * S, 3 * S, 2.4 * S, '#ffd0f0'); }
      else if (item === 'bag') { line([fx, fy, fx - 1 * S, fy + 4 * S], 0.9 * S, '#5a3010'); poly(g, [fx - 5 * S, fy + 4 * S, fx + 4 * S, fy + 4 * S, fx + 5 * S, fy + 11 * S, fx - 6 * S, fy + 11 * S], look.bagCol || '#7a2a5a'); rect(g, fx - 1 * S, fy + 5 * S, 2 * S, 1.6 * S, '#f0d040'); }
      else if (item === 'paper') { rect(g, fx - 2 * S, fy - 5 * S, 4 * S, 9 * S, '#e8e8e0'); rect(g, fx - 2 * S, fy - 3 * S, 4 * S, 1 * S, '#606060'); }
    }
    crisp(c, OL);
    c.head = [hx, hy, S];
    return c;
  }
  function lying(look, wpn) { // knocked down: the limp pose turned on its side
    const st = paint(look, 'limp', wpn), S = (look.size || 1) * 1.3, CW = st.width, CH = st.height;
    const c = canvas(CH, CH), g = c.getContext('2d');
    g.translate(CH * 0.72, CH - 6 * S); g.rotate(-Math.PI / 2); g.drawImage(st, -CW / 2, -(CH - 4));
    return c;
  }
  // everyone's look
  const LOOKS = {
    kev: { skin: '#f4c8a0', hair: 'spiky', hairCol: '#6a3a10', top: '#3a62c8', tee: '#f0f0f0', legs: '#26386e', shoes: '#f0f0f0', sole: '#a0a0b0', cuff: '#e8e8ff' },
    shaz: { skin: '#c8906a', hair: 'pony', hairCol: '#1a1010', top: '#9a2ac8', stripe: '#ffffff', legs: '#7a20a8', shoes: '#f0f0f0', sole: '#e02a6a', size: 0.95 },
    nan: { skin: '#f4d0b8', hair: 'bun', hairCol: '#c8c8d0', top: '#b07ad0', legs: '#d8a890', skirt: '#5a6a3a', shoes: '#5a3010', size: 0.9, specs: 1, item: 'bag', bagCol: '#2a6a3a' },
    herb: { skin: '#f0c098', hair: 'hood', top: '#7a7a84', legs: '#22222a', shoes: '#c0c0c0', mean: 1 },
    herb2: { skin: '#a87050', hair: 'hood', top: '#3a8a3a', legs: '#22222a', shoes: '#c0c0c0', mean: 1 },
    skater: { skin: '#f4c8a0', hair: 'cap', capCol: '#e02828', top: '#2aa05a', legs: '#4a5a8a', shoes: '#202020', mean: 1 },
    punk: { skin: '#f0c0a0', hair: 'mohican', hairCol: '#f02a8a', hairCol2: '#3ae070', top: '#1c1c24', studs: 1, legs: '#b01a1a', shoes: '#101010', mean: 1 },
    paper: { skin: '#f4c8a0', hair: 'cap', capCol: '#2a4ad0', top: '#f0c020', legs: '#3a4a7a', shoes: '#5a3a1a', satchel: '#e07a1a', size: 0.86, mean: 1, item: 'paper' },
    lenny: { skin: '#f0b890', hair: 'bald', top: '#e8e8e8', bare: 1, legs: '#3a4a7a', shoes: '#3a2010', size: 1.22, belly: 1, mean: 1 },
    bouncer: { skin: '#8a5a3a', hair: 'bald', top: '#1a1a24', shirt: '#f0f0f0', tie: '#1a1a1a', legs: '#1a1a24', shoes: '#0a0a0a', size: 1.24, shades: 1, mean: 1 },
    mick: { skin: '#f0c098', hair: 'helmet', capCol: '#f0f0f0', top: '#1a1a20', legs: '#1a1a20', shoes: '#3a3a3a', size: 1.15, mean: 1, gloves: '#2a2a2a' },
    stan: { skin: '#f0c098', hair: 'peak', capCol: '#1a2050', top: '#8ab0e0', badge: '#f0d040', legs: '#1a2050', shoes: '#101010', size: 1.28, belly: 1, mean: 1, tache: 1, hairCol: '#5a3a20', item: 'torch' },
    barry: { skin: '#e8a880', hair: 'short', hairCol: '#a04010', top: '#f08020', vest: '#f8f040', legs: '#2a3a5a', shoes: '#1a1a1a', size: 1.42, belly: 1, beard: 1, mean: 1, gloves: '#3a3a3a' },
    carl: { skin: '#f4c8a0', hair: 'boater', top: '#e8e8e8', stripes: '#d01a2a', legs: '#f0f0f0', shoes: '#1a1a1a', size: 1.34, belly: 1, mean: 1, tache: 1, hairCol: '#2a1a10', item: 'floss' },
    grimly: { skin: '#e8c0a0', hair: 'bowler', capCol: '#1a1018', top: '#5a1a6a', shirt: '#f0f0f0', tie: '#c01a2a', legs: '#4a1458', shoes: '#0a0a0a', size: 1.3, coat: 1, mean: 1, tache: 1, tacheCol: '#d0d0d0', item: 'brolly' },
  };
  const SPR = {};
  function sprites(id, wpn) {
    const key = id + (wpn || ''); if (SPR[key]) return SPR[key];
    const L = LOOKS[id], o = {};
    for (const p of Object.keys(POSES)) o[p] = paint(L, p, wpn);
    o.down = lying(L, wpn);
    if (id === 'barry') o.carry = (() => { const c = paint(L, 'lift'), x = c.getContext('2d'), S = 1.42 * 1.3, [hx, hy] = c.head; const b = canvas(c.width, c.height), bg = b.getContext('2d'); rect(bg, hx - 13 * S, hy - 24 * S, 24 * S, 20 * S, '#2a7a2a'); rect(bg, hx - 14 * S, hy - 25 * S, 26 * S, 3 * S, '#1a5a1a'); crisp(b, OL); x.drawImage(b, 0, 0); return c; })();
    return SPR[key] = o;
  }
  // the props and pick-ups (drawn once)
  const ART = {};
  function art(k) {
    if (ART[k]) return ART[k];
    let c;
    const mk = (w, h, f, flat) => { c = canvas(w, h); const g = c.getContext('2d'); g.lineCap = 'round'; f(g, w, h); crisp(c, OL, flat); return c; };
    switch (k) {
      case 'bin': mk(30, 40, g => { rect(g, 4, 9, 22, 30, '#2a7a2a'); rect(g, 3, 6, 24, 5, '#1a5a1a'); rect(g, 7, 15, 16, 2, '#1a5a1a'); rect(g, 7, 22, 16, 2, '#1a5a1a'); ell(g, 22, 36, 3, 3, '#181818'); rect(g, 6, 9, 3, 28, '#4aa04a'); }); break;
      case 'crate': mk(32, 30, g => { rect(g, 2, 3, 28, 26, '#a87440'); g.strokeStyle = '#6a4418'; g.lineWidth = 2; g.strokeRect(3, 4, 26, 24); g.beginPath(); g.moveTo(3, 4); g.lineTo(29, 28); g.stroke(); rect(g, 3, 14, 26, 2, '#6a4418'); }); break;
      case 'phone': mk(30, 76, g => { rect(g, 3, 6, 24, 70, '#d01a1a'); rect(g, 2, 3, 26, 5, '#a01010'); rect(g, 6, 10, 18, 6, '#181818'); for (let k2 = 0; k2 < 5; k2++) { rect(g, 6, 20 + k2 * 10, 8, 8, '#f8f0c0'); rect(g, 16, 20 + k2 * 10, 8, 8, '#f8f0c0'); } g.font = 'bold 5px Arial'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('PHONE', 15, 15); }, true); break;
      case 'barrel': mk(28, 36, g => { ell(g, 14, 18, 12, 17, '#8a5a2a'); rect(g, 2, 8, 24, 3, '#3a3a40'); rect(g, 2, 26, 24, 3, '#3a3a40'); rect(g, 8, 2, 3, 32, '#a87038'); }); break;
      case 'cone': mk(20, 26, g => { poly(g, [10, 1, 17, 23, 3, 23], '#f07a1a'); rect(g, 6, 11, 8, 3, '#f0f0f0'); rect(g, 1, 22, 18, 3, '#d05a10'); }); break;
      case 'chips': mk(22, 18, g => { rect(g, 3, 8, 16, 9, '#f0f0f0'); rect(g, 3, 8, 16, 2, '#2a5ad0'); for (let i = 0; i < 5; i++) rect(g, 5 + i * 3, 3 + (i % 2), 2, 6, '#f0c040'); ell(g, 14, 6, 4, 2.5, '#d08a30'); }); break;
      case 'apple': mk(14, 16, g => { ell(g, 7, 9, 5, 5, '#d02020'); rect(g, 7, 1, 1, 4, '#5a3a10'); ell(g, 10, 3, 2.4, 1.2, '#3a9a3a'); }); break;
      case 'roll': mk(22, 14, g => { ell(g, 11, 8, 9, 5, '#e0a050'); for (let i = 0; i < 3; i++) rect(g, 6 + i * 5, 5, 2, 6, '#b06a20'); ell(g, 19, 8, 2, 3, '#c07a7a'); }); break;
      case 'roast': mk(30, 20, g => { ell(g, 15, 14, 14, 5, '#e8e8f0'); ell(g, 15, 10, 9, 6, '#a0501a'); ell(g, 13, 8, 4, 2.4, '#d08040'); ell(g, 6, 13, 3, 2, '#e8c040'); ell(g, 24, 13, 3, 2, '#3a9a3a'); }); break;
      case 'money': mk(18, 20, g => { ell(g, 9, 12, 7, 7, '#c8a050'); rect(g, 6, 3, 6, 4, '#a08030'); g.font = 'bold 9px Arial'; g.fillStyle = '#5a3a00'; g.textAlign = 'center'; g.fillText('£', 9, 15); }); break;
      case 'tape': mk(22, 16, g => { rect(g, 2, 2, 18, 12, '#202028'); rect(g, 4, 4, 14, 5, '#f0f0f0'); ell(g, 7, 9, 2, 2, '#808080'); ell(g, 15, 9, 2, 2, '#808080'); rect(g, 4, 4, 14, 2, '#e02a6a'); }); break;
      case 'oneup': mk(18, 18, g => { ell(g, 9, 9, 8, 8, '#2a8a2a'); g.font = 'bold 8px Arial'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('1UP', 9, 12); }, true); break;
      case 'pipe': mk(26, 10, g => { g.strokeStyle = '#9a9aa8'; g.lineWidth = 3; g.beginPath(); g.moveTo(2, 7); g.lineTo(24, 3); g.stroke(); }); break;
      case 'bat': mk(30, 12, g => { g.lineWidth = 2; g.strokeStyle = '#3a2010'; g.beginPath(); g.moveTo(2, 8); g.lineTo(9, 7); g.stroke(); g.lineWidth = 5; g.strokeStyle = '#e0b060'; g.beginPath(); g.moveTo(9, 7); g.lineTo(28, 4); g.stroke(); }); break;
      case 'paper': mk(14, 10, g => { rect(g, 1, 2, 12, 6, '#e8e8e0'); rect(g, 1, 4, 12, 1, '#606060'); }); break;
      case 'thrownbin': mk(28, 30, g => { rect(g, 3, 5, 22, 24, '#2a7a2a'); rect(g, 2, 2, 24, 5, '#1a5a1a'); }); break;
      case 'car': mk(110, 46, g => { // Mom's hatchback
        poly(g, [6, 30, 10, 20, 30, 18, 44, 4, 80, 4, 96, 18, 106, 22, 106, 34, 6, 34], '#c81a2a');
        poly(g, [48, 8, 78, 8, 90, 18, 40, 18], '#a8d0f0'); rect(g, 62, 8, 3, 10, '#c81a2a');
        ell(g, 26, 36, 8, 8, '#181818'); ell(g, 86, 36, 8, 8, '#181818'); ell(g, 26, 36, 3, 3, '#b0b0b8'); ell(g, 86, 36, 3, 3, '#b0b0b8');
        rect(g, 100, 24, 6, 4, '#f8f0a0'); rect(g, 6, 24, 4, 4, '#f04040'); ell(g, 70, 14, 4, 4, '#f4c8a0'); rect(g, 66, 9, 8, 3, '#8a4a20');
      }); break;
    }
    return ART[k] = c;
  }

  // ---------------------------------------------------------------- the stages: three scrolling layers each (far, middle,
  // the street itself), a floor, and a few live bits (lights, the big wheel, the sea)
  const STAGES = [
    { name: 'GRIMSBY STREET', time: 'FRIDAY 11:42 PM', len: 3400, song: 'street', boss: 'mick', floor: 'slabs',
      sky: [[0, '#0a0a30'], [0.7, '#2a1a50'], [1, '#5a2a5a']],
      waves: [{ at: 480, e: ['herb', 'herb'] }, { at: 1020, e: ['herb', 'skater', 'herb2'] }, { at: 1560, e: ['punk', 'herb', 'herb2'] }, { at: 2100, e: ['lenny', 'herb', 'skater'] }, { at: 2640, e: ['punk', 'punk', 'herb2', 'herb'] }, { at: 3180, e: ['mick', 'herb', 'herb2'], boss: 1 }],
      props: [['bin', 360, 162, 'apple'], ['phone', 760, 152, 'money'], ['bin', 1250, 196, 'chips'], ['bin', 1470, 160, 'pipe'], ['cone', 1700, 200, ''], ['crate', 1880, 200, 'roll'], ['bin', 2380, 172, 'chips'], ['crate', 2900, 188, 'tape']] },
    { name: 'THE PRECINCT', time: 'FRIDAY 11:58 PM', len: 3400, song: 'precinct', boss: 'stan', floor: 'tiles',
      sky: [[0, '#101028'], [1, '#3a2a48']],
      waves: [{ at: 480, e: ['herb2', 'paper', 'herb'] }, { at: 1020, e: ['bouncer', 'herb'] }, { at: 1560, e: ['skater', 'skater', 'paper'] }, { at: 2100, e: ['punk', 'bouncer', 'herb2'] }, { at: 2640, e: ['lenny', 'paper', 'herb', 'herb2'] }, { at: 3180, e: ['stan', 'paper'], boss: 1 }],
      props: [['crate', 420, 170, 'apple'], ['bin', 900, 196, 'roll'], ['crate', 1300, 160, 'bat'], ['bin', 1760, 186, 'chips'], ['phone', 2240, 152, 'money'], ['crate', 2700, 196, 'roast'], ['bin', 3000, 170, 'tape']] },
    { name: 'THE PROM', time: 'SATURDAY 7:12 PM', len: 3600, song: 'prom', boss: 'barry', floor: 'prom',
      sky: [[0, '#2a2a7a'], [0.45, '#c84a7a'], [0.75, '#f08a4a'], [1, '#f8d070']],
      waves: [{ at: 480, e: ['herb', 'herb2', 'skater'] }, { at: 1080, e: ['lenny', 'lenny'] }, { at: 1680, e: ['paper', 'punk', 'skater', 'herb'] }, { at: 2260, e: ['bouncer', 'herb', 'herb2', 'paper'] }, { at: 2860, e: ['punk', 'punk', 'lenny', 'skater'] }, { at: 3380, e: ['barry', 'herb', 'herb2'], boss: 1 }],
      props: [['crate', 400, 170, 'apple'], ['bin', 900, 196, 'chips'], ['phone', 1400, 152, 'money'], ['bin', 1980, 162, 'pipe'], ['crate', 2560, 192, 'roll'], ['bin', 2700, 200, 'oneup'], ['crate', 3100, 176, 'chips']] },
    { name: 'THE PIER', time: 'SATURDAY 9:30 PM', len: 3600, song: 'pier', boss: 'carl', floor: 'planks',
      sky: [[0, '#04041a'], [0.6, '#1a1040'], [1, '#3a1a4a']],
      waves: [{ at: 480, e: ['skater', 'herb', 'paper'] }, { at: 1080, e: ['bouncer', 'bouncer'] }, { at: 1680, e: ['punk', 'herb2', 'paper', 'herb'] }, { at: 2260, e: ['lenny', 'skater', 'skater', 'punk'] }, { at: 2860, e: ['bouncer', 'paper', 'herb', 'herb2', 'punk'] }, { at: 3380, e: ['carl', 'herb', 'skater'], boss: 1 }],
      props: [['barrel', 420, 172, 'roll'], ['barrel', 980, 196, 'chips'], ['crate', 1500, 162, 'bat'], ['barrel', 2000, 186, 'tape'], ['crate', 2500, 200, 'roast'], ['barrel', 3000, 170, 'money']] },
    { name: 'GRIMLY TOWERS', time: 'SUNDAY 5:55 AM', len: 3400, song: 'roof', boss: 'grimly', floor: 'roof',
      sky: [[0, '#1a1050'], [0.5, '#7a3a8a'], [0.85, '#f07a5a'], [1, '#f8c870']],
      waves: [{ at: 480, e: ['punk', 'herb', 'herb2'] }, { at: 1020, e: ['bouncer', 'paper', 'skater'] }, { at: 1560, e: ['lenny', 'lenny', 'herb'] }, { at: 2100, e: ['punk', 'punk', 'bouncer', 'paper'] }, { at: 2640, e: ['skater', 'herb2', 'herb', 'lenny', 'paper'] }, { at: 3180, e: ['grimly'], boss: 1 }],
      props: [['crate', 400, 176, 'chips'], ['barrel', 860, 194, 'apple'], ['crate', 1300, 160, 'pipe'], ['barrel', 1800, 196, 'roast'], ['crate', 2300, 168, 'oneup'], ['barrel', 2800, 190, 'chips']] },
  ];
  function buildStage(n) {
    const ST = STAGES[n], len = ST.len;
    const farW = Math.ceil(W + (len - W) * 0.2), midW = Math.ceil(W + (len - W) * 0.5);
    const far = canvas(farW, 150), mid = canvas(midW, 150), near = canvas(len, 150);
    const fg = far.getContext('2d'), mg = mid.getContext('2d'), ng = near.getContext('2d');
    dgrad(fg, 0, 0, farW, 150, ST.sky);
    const R = (k => () => { k = (k * 16807) % 2147483647; return (k - 1) / 2147483646; })(91 + n * 7);
    const win = (g, x, y, w, h, lit) => { rect(g, x, y, w, h, lit ? '#f8d070' : '#1a1a38'); if (lit) rect(g, x, y, w, 1, '#fff0b0'); };
    const lights = [];
    if (n === 0 || n === 1) { // the town at night: stars, the moon, tower blocks, then rooftops with chimneys and aerials
      for (let i = 0; i < 90; i++) rect(fg, R() * farW | 0, R() * 70 | 0, 1, 1, R() < 0.3 ? '#ffffff' : '#8a8ab0');
      ell(fg, 70, 30, 12, 12, '#f8f0d0'); ell(fg, 66, 27, 3, 3, '#d8d0b0'); ell(fg, 74, 34, 2, 2, '#d8d0b0');
      for (let x = 0; x < farW; x += 50 + R() * 40) { const h = 100 + R() * 40, w = 30 + R() * 26; rect(fg, x, 150 - h, w, h, '#1a1838'); for (let y = 150 - h + 6; y < 145; y += 8) for (let i = 4; i < w - 4; i += 7) if (R() < 0.35) rect(fg, x + i, y, 3, 4, '#e8c060'); }
      for (let x = 0; x < midW; x += 70 + R() * 30) { const w = 70 + R() * 30, h = 104 + R() * 26; rect(mg, x, 150 - h, w, h, '#2a2040'); poly(mg, [x - 4, 150 - h, x + w / 2, 150 - h - 20, x + w + 4, 150 - h], '#3a2a4a'); rect(mg, x + w * 0.7, 150 - h - 26, 8, 16, '#3a2838'); rect(mg, x + w * 0.7 - 1, 150 - h - 28, 10, 3, '#4a3848'); if (R() < 0.6) { rect(mg, x + w * 0.3, 150 - h - 34, 1, 18, '#5a5a70'); rect(mg, x + w * 0.3 - 6, 150 - h - 30, 13, 1, '#5a5a70'); } for (let i = 0; i < 3; i++) win(mg, x + 10 + i * (w - 20) / 3, 150 - h + 10, 10, 12, R() < 0.4); }
      if (n === 1) { // the precinct's top floor: a concrete deck with shop signs and a balcony rail
        rect(mg, 0, 0, midW, 150, '#5a5448'); for (let x = 0; x < midW; x += 48) { rect(mg, x, 0, 3, 150, '#4a4438'); } for (let x = 20; x < midW; x += 130) { rect(mg, x, 6, 90, 22, '#1a1830'); for (let i = 0; i < 4; i++) win(mg, x + 6 + i * 21, 10, 16, 14, R() < 0.6); }
        rect(mg, 0, 30, midW, 6, '#7a7468'); for (let x = 0; x < midW; x += 10) rect(mg, x, 36, 2, 10, '#9a9aaa'); rect(mg, 0, 34, midW, 2, '#b8b8c8'); for (let x = 60; x < midW; x += 260) { rect(mg, x, 12, 4, 20, '#c8c0a0'); ell(mg, x + 2, 12, 6, 3, '#f8f0c0'); } }
    } else if (n === 2) { // the prom at sunset: the sun on the sea, clouds, a distant pier
      ell(fg, farW * 0.35, 92, 22, 22, '#f8e890'); ell(fg, farW * 0.35, 92, 17, 17, '#fff8c0');
      for (let i = 0; i < 6; i++) { const x = R() * farW, y = 20 + R() * 40; ell(fg, x, y, 30 + R() * 30, 5 + R() * 3, '#e86a8a'); ell(fg, x + 10, y - 2, 20, 3, '#f8a0a0'); }
      dgrad(fg, 0, 100, farW, 50, [[0, '#3a4a9a'], [1, '#1a2a6a']]);
      for (let i = 0; i < 70; i++) rect(fg, R() * farW | 0, 102 + R() * 46 | 0, 4 + R() * 8 | 0, 1, R() < 0.5 ? '#f8c070' : '#6a7ac8');
      rect(mg, 0, 108, midW, 42, 'rgba(0,0,0,0)');
      for (let x = 200; x < midW; x += 700) { rect(mg, x, 96, 220, 4, '#3a2a3a'); for (let i = 0; i < 220; i += 20) rect(mg, x + i, 100, 3, 22, '#3a2a3a'); rect(mg, x + 180, 76, 40, 20, '#5a3a4a'); poly(mg, [x + 176, 76, x + 200, 62, x + 224, 76], '#7a3a4a'); }
    } else if (n === 3) { // the pier at night: stars, the big wheel and helter-skelter come later (live), the dark sea
      for (let i = 0; i < 120; i++) rect(fg, R() * farW | 0, R() * 90 | 0, 1, 1, R() < 0.3 ? '#ffffff' : '#7a7ab0');
      dgrad(fg, 0, 104, farW, 46, [[0, '#0a1430'], [1, '#04081a']]);
      for (let x = 0; x < midW; x += 380) { // the helter-skelter and the dodgems tent
        poly(mg, [x + 60, 30, x + 80, 120, x + 40, 120], '#d0c8a0'); for (let k2 = 0; k2 < 6; k2++) poly(mg, [x + 42 + k2 * 2, 120 - k2 * 15, x + 78 - k2 * 2, 108 - k2 * 15, x + 78 - k2 * 2, 113 - k2 * 15, x + 42 + k2 * 2, 125 - k2 * 15], '#d02a3a'); poly(mg, [x + 60, 18, x + 66, 32, x + 54, 32], '#f0c020');
        poly(mg, [x + 160, 120, x + 210, 70, x + 260, 120], '#3a6ad0'); for (let k2 = 0; k2 < 5; k2++) poly(mg, [x + 210, 70, x + 160 + k2 * 25, 120, x + 172 + k2 * 25, 120], '#f0f0f0'); rect(mg, x + 160, 118, 100, 4, '#2a2a40');
        for (let k2 = 0; k2 < 12; k2++) lights.push([1, x + 160 + k2 * 9, 116, k2]);
      }
    } else { // the roof at dawn: the whole town below, water tanks and aerials
      for (let x = 0; x < farW; x += 26 + R() * 20) { const h = 20 + R() * 46; rect(fg, x, 150 - h, 20 + R() * 16, h, '#2a1a40'); for (let y = 150 - h + 4; y < 146; y += 6) if (R() < 0.4) rect(fg, x + 4 + R() * 10, y, 2, 3, '#f0b060'); }
      for (let x = 30; x < midW; x += 220 + R() * 80) { rect(mg, x, 88, 40, 30, '#5a4a6a'); rect(mg, x - 2, 84, 44, 6, '#6a5a7a'); for (let i = 0; i < 4; i++) rect(mg, x + 4 + i * 10, 118, 3, 32, '#3a2a4a'); rect(mg, x + 90, 60, 2, 90, '#4a3a5a'); rect(mg, x + 80, 70, 22, 2, '#4a3a5a'); rect(mg, x + 84, 80, 14, 2, '#4a3a5a'); lights.push([2, x + 91, 58, 0]); }
    }
    // ---- the street itself (the near layer, the same speed as the fighting)
    if (n === 0) {
      const SHOPS = [['CHIPPY', '#2a6ad0', '#ffd84a'], ['VIDEO SHACK', '#d02a2a', '#fff'], ['NEWSAGENTS', '#1a8a3a', '#fff'], ['LAUNDERETTE', '#6a3ab0', '#fff'], ['TOY SHOP', '#e07a1a', '#fff'], ['POST OFFICE', '#c01a1a', '#ffd84a'],
        ['GREASY SPOON', '#3a3a3a', '#ffb0b0'], ['RECORD SHOP', '#1a1a1a', '#7affd0'], ['COMPUTER SHOP', '#2a4a8a', '#ffffff'], ['HAIR BY SHARON', '#d04a8a', '#fff'], ['PET SHOP', '#2a8a8a', '#fff'], ['KEBAB HOUSE', '#a03a1a', '#ffd84a']];
      let x = 0, i = 0;
      while (x < len) {
        const w = 150 + (i % 3) * 30, [name, col, tc] = SHOPS[i % SHOPS.length], brick = i % 2 ? '#5a3028' : '#4a2a3a';
        rect(ng, x, 34, w, 116, brick);
        for (let y = 38; y < 72; y += 6) for (let bx = (y / 6 % 2) * 6; bx < w; bx += 12) { rect(ng, x + bx, y, 11, 5, shade(brick, 1.12)); rect(ng, x + bx, y, 11, 1, shade(brick, 1.3)); }
        rect(ng, x - 2, 30, w + 4, 5, shade(brick, 0.6)); rect(ng, x - 2, 30, w + 4, 1, shade(brick, 1.4)); if (i % 2) { rect(ng, x + w - 30, 18, 12, 14, shade(brick, 0.8)); rect(ng, x + w - 31, 16, 14, 3, shade(brick, 0.6)); }
        for (let k2 = 0; k2 < 3; k2++) { const wx = x + 18 + k2 * (w - 36) / 2.5, lit = (i * 7 + k2 * 3) % 5 < 2; rect(ng, wx - 2, 40, 30, 26, '#1a1418'); win(ng, wx, 42, 26, 22, lit); rect(ng, wx + 12, 42, 2, 22, '#1a1418'); rect(ng, wx, 52, 26, 2, '#1a1418'); rect(ng, wx - 3, 64, 32, 3, '#c8c0b0'); }
        rect(ng, x + 4, 72, w - 8, 18, col); rect(ng, x + 4, 72, w - 8, 2, shade(col, 1.5)); rect(ng, x + 4, 88, w - 8, 2, shade(col, 0.6));
        ng.font = 'bold 11px Arial,sans-serif'; if (ng.measureText(name).width > w - 16) ng.font = 'bold 9px Arial,sans-serif'; ng.textAlign = 'center'; ng.fillStyle = '#000'; ng.fillText(name, x + w / 2 + 1, 86, w - 12); ng.fillStyle = tc; ng.fillText(name, x + w / 2, 85, w - 12);
        for (let k2 = 0; k2 < (w - 8) / 10; k2++) poly(ng, [x + 4 + k2 * 10, 92, x + 14 + k2 * 10, 92, x + 12 + k2 * 10, 100, x + 6 + k2 * 10, 100], k2 % 2 ? '#f0f0f0' : col); // the awning
        rect(ng, x + 8, 100, w - 16, 42, '#c8b870'); rect(ng, x + 10, 102, w - 20, 38, i % 3 === 2 ? '#3a3a48' : '#fff0b8');
        if (i % 3 === 2) for (let y = 104; y < 140; y += 3) rect(ng, x + 10, y, w - 20, 1, '#5a5a6a'); // shutters down
        else { for (let k2 = 0; k2 < 4; k2++) rect(ng, x + 14 + k2 * (w - 28) / 4, 124 - (k2 % 2) * 8, (w - 28) / 5, 16 + (k2 % 2) * 8, ['#d04a3a', '#3a8ad0', '#f0c040', '#5ab05a'][(i + k2) % 4]); lights.push([0, x + w / 2, 120, w - 24]); }
        rect(ng, x + w / 2 - 1, 102, 2, 38, '#9a8a50'); rect(ng, x + 4, 142, w - 8, 8, '#2a2a2a');
        if (i % 4 === 1) { rect(ng, x + w - 40, 104, 24, 38, '#3a2010'); rect(ng, x + w - 36, 108, 16, 14, '#ffefb0'); ell(ng, x + w - 20, 126, 1.5, 1.5, '#f0d040'); }
        x += w + 4; i++;
      }
      for (let lx = 100; lx < len; lx += 300) { rect(ng, lx, 40, 4, 110, '#303038'); rect(ng, lx + 1, 40, 1, 110, '#50505a'); rect(ng, lx - 8, 38, 22, 4, '#303038'); ell(ng, lx + 11, 44, 6, 4, '#fff8c0'); }
    } else if (n === 1) { // the shopping precinct: concrete, shop units, an escalator, plant pots, the fountain
      rect(ng, 0, 46, len, 104, '#8a8478'); for (let x = 0; x < len; x += 40) rect(ng, x, 46, 2, 104, '#6a6458'); rect(ng, 0, 46, len, 4, '#5a5448');
      const UNITS = [['BARGAIN BAZAAR', '#d01a6a'], ['CD WORLD', '#1a6ad0'], ['GAMEZONE', '#1a8a1a'], ['SHOE CITY', '#d07a1a'], ['CARD SHOP', '#8a2ab0'], ['SWEETIE JAR', '#e02a2a'], ['OPTICIANS', '#2a8a9a'], ['TOYMASTER', '#d0a01a']];
      let x = 20, i = 0;
      while (x < len) {
        if (i % 4 === 3) { // the escalator up to the top floor
          poly(ng, [x, 150, x + 120, 40, x + 150, 40, x + 30, 150], '#5a5a68'); for (let s = 0; s < 14; s++) rect(ng, x + 20 + s * 8, 140 - s * 8, 18, 2, '#9a9aaa'); poly(ng, [x, 140, x + 120, 30, x + 124, 34, x + 4, 144], '#2a2a38'); x += 170; i++; continue;
        }
        const w = 170, [name, col] = UNITS[i % UNITS.length];
        rect(ng, x, 46, w, 104, '#3a3640'); rect(ng, x + 4, 50, w - 8, 18, col); rect(ng, x + 4, 50, w - 8, 2, shade(col, 1.5));
        ng.font = 'bold 11px Arial,sans-serif'; ng.textAlign = 'center'; ng.fillStyle = '#fff'; ng.fillText(name, x + w / 2, 63);
        rect(ng, x + 8, 72, w - 16, 68, '#c8e8f8'); rect(ng, x + 10, 74, w - 20, 64, '#e8f8ff'); for (let k2 = 0; k2 < 5; k2++) rect(ng, x + 16 + k2 * 30, 104 - (k2 % 2) * 10, 20, 34 + (k2 % 2) * 10, ['#f04a7a', '#4a8af0', '#f0c040', '#5ad05a', '#c05af0'][(i + k2) % 5]); rect(ng, x + 10, 74, 40, 64, 'rgba(255,255,255,.35)');
        lights.push([0, x + w / 2, 104, w - 30]);
        rect(ng, x + w + 4, 120, 18, 30, '#7a5a3a'); ell(ng, x + w + 13, 112, 14, 12, '#2a7a3a'); ell(ng, x + w + 9, 108, 6, 5, '#4aa05a');
        x += w + 30; i++;
      }
      for (let fx2 = 900; fx2 < len; fx2 += 1400) { rect(ng, fx2, 122, 90, 28, '#9a9aa8'); rect(ng, fx2 + 4, 126, 82, 6, '#4a8ad0'); rect(ng, fx2 + 42, 96, 6, 30, '#9a9aa8'); lights.push([3, fx2 + 45, 96, 0]); }
    } else if (n === 2) { // the prom: kiosks and beach huts, railings, the sea behind
      const SHOPS = [['AMUSEMENTS', '#e02a8a'], ['ROCK SHOP', '#f0a0c0'], ['ICE CREAM', '#7ad0f0'], ['PENNY FALLS', '#f0c020'], ['FISH BAR', '#2a6ad0'], ['DONKEY RIDES', '#5ab05a'], ['CRAZY GOLF', '#e07a1a'], ['GIFT SHOP', '#b03ad0']];
      let x = 40, i = 0;
      while (x < len) {
        if (i % 3 === 2) { for (let k2 = 0; k2 < 3; k2++) { const hx = x + 10 + k2 * 48, hc = ['#e04a4a', '#4a9ae0', '#f0c040'][(i + k2) % 3]; rect(ng, hx, 96, 40, 54, '#f0e8d8'); for (let y = 98; y < 150; y += 6) rect(ng, hx, y, 40, 3, hc); poly(ng, [hx - 4, 96, hx + 20, 80, hx + 44, 96], shade(hc, 0.7)); rect(ng, hx + 14, 116, 12, 34, '#5a3a2a'); } x += 160; i++; continue; }
        const w = 140, [name, col] = SHOPS[i % SHOPS.length];
        rect(ng, x, 44, w, 106, '#e8e0d0'); rect(ng, x, 44, w, 6, col); poly(ng, [x - 4, 44, x + w / 2, 22, x + w + 4, 44], shade(col, 0.8));
        for (let k2 = 0; k2 < 9; k2++) lights.push([1, x + 6 + k2 * (w - 12) / 8, 54, k2 + i]);
        ng.font = 'bold 12px Arial,sans-serif'; ng.textAlign = 'center'; ng.fillStyle = '#000'; ng.fillText(name, x + w / 2 + 1, 75); ng.fillStyle = col; ng.fillText(name, x + w / 2, 74);
        rect(ng, x + 10, 82, w - 20, 60, '#2a1a3a'); for (let k2 = 0; k2 < 5; k2++) rect(ng, x + 16 + k2 * 22, 88, 16, 20, ['#ff4a8a', '#4aff8a', '#4a8aff', '#ffd84a', '#ff8a4a'][(k2 + i) % 5]);
        x += w + 30; i++;
      }
      for (let x2 = 0; x2 < len; x2 += 8) rect(ng, x2, 132, 2, 18, '#e8e8f0'); rect(ng, 0, 130, len, 3, '#f8f8ff'); rect(ng, 0, 140, len, 2, '#b8b8c8');
    } else if (n === 3) { // the pier: stalls with bulbs, a wooden rail
      const STALLS = [['HOOK-A-DUCK', '#2a8ad0'], ['DOUGHNUTS', '#e07a1a'], ['COCONUT SHY', '#5aa02a'], ['WHACK-A-MOLE', '#d02a2a'], ['FORTUNES', '#8a2ad0'], ['TEDDY GRAB', '#d02a8a']];
      let x = 30, i = 0;
      while (x < len) {
        const w = 150, [name, col] = STALLS[i % STALLS.length];
        rect(ng, x, 62, w, 88, '#3a2a20'); for (let k2 = 0; k2 < w / 15; k2++) poly(ng, [x + k2 * 15, 50, x + k2 * 15 + 15, 50, x + k2 * 15 + 15, 66, x + k2 * 15 + 7, 72, x + k2 * 15, 66], k2 % 2 ? '#f0f0f0' : col);
        ng.font = 'bold 11px Arial,sans-serif'; ng.textAlign = 'center'; ng.fillStyle = '#ffe080'; ng.fillText(name, x + w / 2, 86);
        rect(ng, x + 8, 92, w - 16, 50, '#1a1018'); for (let k2 = 0; k2 < 6; k2++) ell(ng, x + 22 + k2 * 21, 118, 7, 9, ['#f0d040', '#f07ab0', '#7ad0f0', '#c0f07a'][(k2 + i) % 4]);
        for (let k2 = 0; k2 < 10; k2++) lights.push([1, x + 8 + k2 * 14.8, 48, k2 + i * 3]);
        x += w + 40; i++;
      }
      for (let x2 = 0; x2 < len; x2 += 30) rect(ng, x2, 132, 4, 18, '#6a4a2a'); rect(ng, 0, 130, len, 4, '#8a6a3a');
    } else { // the roof: a parapet, vents, satellite dishes, a helipad sign
      rect(ng, 0, 112, len, 38, '#5a5060'); rect(ng, 0, 110, len, 4, '#7a7080');
      for (let x = 60; x < len; x += 260) { rect(ng, x, 80, 50, 36, '#8a8a98'); for (let k2 = 0; k2 < 5; k2++) rect(ng, x + 4, 84 + k2 * 6, 42, 2, '#5a5a68'); ell(ng, x + 150, 92, 14, 14, '#c8c8d8'); ell(ng, x + 152, 92, 10, 10, '#a8a8b8'); rect(ng, x + 148, 104, 4, 12, '#6a6a78'); }
      ng.font = 'bold 24px Arial,sans-serif'; ng.textAlign = 'center'; for (let x = 1200; x < len; x += 1600) { ell(ng, x, 128, 40, 12, '#3a3848'); ng.fillStyle = '#f0f0f0'; ng.fillText('H', x, 136); }
      rect(ng, len - 220, 30, 140, 30, '#2a1a3a'); ng.font = 'bold 13px Arial,sans-serif'; ng.fillStyle = '#f0c040'; ng.fillText('GRIMLY TOWERS', len - 150, 50);
    }
    crisp(mid, null, true); crisp(near, null, true); // (every pixel on the Mega Drive's palette, signs and all)
    return { far, mid, near, lights, ST };
  }

  // ---------------------------------------------------------------- music (original): a groove per stage, the boss, the rest
  const R = 0, Hd = -1;
  const SONGS = {
    title: { bpm: 120, wave: 'sawtooth', bassWave: 'square', vol: 0.045, drums: 'o...x..oo.o.x...',
      lead: [69, Hd, Hd, Hd, 72, Hd, 74, Hd, 76, Hd, Hd, Hd, 74, Hd, 72, Hd, 69, Hd, Hd, Hd, 67, Hd, 64, Hd, 67, Hd, Hd, Hd, Hd, Hd, R, R],
      bass: [33, R, 45, R, 33, R, 45, 43, 29, R, 41, R, 29, R, 41, 40, 31, R, 43, R, 31, R, 43, 41, 28, R, 40, R, 28, 40, 31, 35] },
    street: { bpm: 124, wave: 'square', bassWave: 'sawtooth', vol: 0.045, drums: 'o.x.o.xxo.x.o.xo',
      lead: [R, R, 69, R, 72, R, 74, 72, R, 69, R, 67, 69, Hd, Hd, Hd, R, R, 69, R, 72, R, 76, 74, R, 72, R, 74, 72, Hd, 69, Hd,
        R, R, 69, R, 72, R, 74, 72, R, 69, R, 67, 69, Hd, Hd, Hd, 76, Hd, 74, Hd, 72, Hd, 74, Hd, 69, Hd, Hd, Hd, R, R, R, R],
      bass: [33, R, 33, 45, R, 33, 43, R, 31, R, 31, 43, R, 31, 41, 43, 29, R, 29, 41, R, 29, 39, R, 28, R, 28, 40, R, 31, 43, R] },
    precinct: { bpm: 118, wave: 'square', bassWave: 'triangle', vol: 0.045, drums: 'o..xo.x.o..xo.xx',
      lead: [76, Hd, 79, Hd, 81, R, 79, 76, R, 74, 76, Hd, Hd, Hd, R, R, 72, Hd, 74, Hd, 76, R, 74, 72, R, 69, 72, Hd, Hd, Hd, R, R,
        76, Hd, 79, Hd, 83, R, 81, 79, R, 76, 79, Hd, 81, Hd, 83, Hd, 84, Hd, 83, 81, 79, Hd, 76, Hd, 74, Hd, 72, Hd, 69, Hd, R, R],
      bass: [36, R, 48, R, 36, 43, 48, R, 41, R, 53, R, 41, 48, 53, R, 33, R, 45, R, 33, 40, 45, R, 38, R, 50, R, 43, R, 47, R] },
    prom: { bpm: 128, wave: 'sawtooth', bassWave: 'square', vol: 0.04, drums: 'o.xxo.x.o.xxo.xo',
      lead: [76, R, 76, 79, R, 76, 74, R, 72, R, 74, 76, Hd, Hd, R, R, 76, R, 76, 79, R, 81, 79, R, 76, R, 74, 72, Hd, Hd, R, R],
      bass: [36, R, 48, 36, R, 48, 36, 43, 33, R, 45, 33, R, 45, 33, 40, 29, R, 41, 29, R, 41, 29, 36, 31, R, 43, 31, R, 43, 31, 35] },
    pier: { bpm: 136, wave: 'square', bassWave: 'sawtooth', vol: 0.042, drums: 'o.x.oox.o.x.oxxx',
      lead: [72, 76, 79, 76, 81, Hd, 79, R, 77, 76, 74, 76, 72, Hd, R, R, 74, 77, 81, 77, 83, Hd, 81, R, 79, 77, 76, 74, 76, Hd, R, R],
      bass: [36, 36, 48, 36, 41, 41, 53, 41, 43, 43, 55, 43, 36, 36, 48, 43, 38, 38, 50, 38, 43, 43, 55, 43, 41, 41, 53, 41, 36, 43, 36, R] },
    roof: { bpm: 140, wave: 'sawtooth', bassWave: 'sawtooth', vol: 0.042, drums: 'oxo.oxo.oxo.oxxx',
      lead: [64, Hd, 67, Hd, 71, Hd, 72, 71, 69, Hd, 67, Hd, 64, Hd, R, R, 64, Hd, 67, Hd, 71, Hd, 74, 72, 71, Hd, 72, Hd, 71, Hd, 67, Hd],
      bass: [28, 28, 40, 28, 28, 40, 28, 40, 24, 24, 36, 24, 24, 36, 24, 36, 26, 26, 38, 26, 26, 38, 26, 38, 23, 23, 35, 23, 31, 30, 29, 28] },
    boss: { bpm: 150, wave: 'sawtooth', bassWave: 'sawtooth', vol: 0.045, drums: 'oxoxoxoxoxoxooxx',
      lead: [64, R, 64, 67, R, 64, 70, R, 69, R, 67, R, 64, Hd, R, R, 64, R, 64, 67, R, 64, 71, R, 70, R, 69, R, 67, Hd, R, R],
      bass: [28, 28, 40, 28, 28, 40, 28, 38, 28, 28, 40, 28, 31, 30, 29, 28] },
    cont: { bpm: 90, wave: 'triangle', bassWave: 'triangle', vol: 0.05, lead: [69, Hd, 68, Hd, 67, Hd, 66, Hd, 65, Hd, Hd, Hd, 64, Hd, Hd, Hd], bass: [45, R, R, R, 44, R, R, R, 43, R, R, R, 40, R, R, R] },
    end: { bpm: 112, wave: 'square', bassWave: 'triangle', vol: 0.045, drums: 'o...x...o.o.x...',
      lead: [72, Hd, 76, Hd, 79, Hd, 84, Hd, 83, Hd, 79, Hd, 81, Hd, Hd, Hd, 77, Hd, 81, Hd, 84, Hd, 88, Hd, 86, Hd, 84, 83, 84, Hd, Hd, Hd],
      bass: [48, R, 55, R, 52, R, 55, R, 43, R, 50, R, 53, R, 50, R, 41, R, 48, R, 45, R, 48, R, 43, R, 50, R, 48, R, 43, R] },
  };

  // ---------------------------------------------------------------- the cast
  const EN = { // hp, speed, damage, points, reach, names
    herb: { hp: 28, sp: 0.8, dmg: 6, pts: 200, reach: 26, names: ['HERBERT', 'NIGEL', 'GAZ', 'DEL', 'WAYNE'] },
    herb2: { hp: 32, sp: 0.85, dmg: 7, pts: 250, reach: 26, names: ['DARREN', 'LEE', 'CRAIG', 'DEAN'] },
    skater: { hp: 22, sp: 1.1, dmg: 8, pts: 300, reach: 24, names: ['SKATER STEVE', 'OLLIE', 'KICKFLIP KEITH'] },
    punk: { hp: 34, sp: 1.0, dmg: 9, pts: 350, reach: 26, names: ['SPIKE', 'SID', 'VINNIE'] },
    paper: { hp: 20, sp: 1.2, dmg: 6, pts: 300, reach: 24, names: ['PAPERBOY PETE', 'EXTRA EDDIE'] },
    lenny: { hp: 60, sp: 0.6, dmg: 11, pts: 500, reach: 30, names: ['BIG LENNY', 'TINY TERRY', 'BRICK'] },
    bouncer: { hp: 70, sp: 0.65, dmg: 12, pts: 600, reach: 30, names: ['DOORMAN DES', 'BOUNCER BOB'] },
    mick: { hp: 130, sp: 0.85, dmg: 12, pts: 3000, reach: 30, names: ['MOPED MICK'], boss: 1 },
    stan: { hp: 170, sp: 0.75, dmg: 13, pts: 3500, reach: 32, names: ['SECURITY STAN'], boss: 1 },
    barry: { hp: 220, sp: 0.6, dmg: 15, pts: 4000, reach: 34, names: ['BIG BARRY'], boss: 1 },
    carl: { hp: 230, sp: 0.8, dmg: 14, pts: 4500, reach: 34, names: ['CANDYFLOSS CARL'], boss: 1 },
    grimly: { hp: 300, sp: 0.85, dmg: 15, pts: 6000, reach: 44, names: ['MR GRIMLY'], boss: 1 },
  };
  const HEROES = {
    kev: { n: 'KEV', look: 'kev', hp: 100, sp: 1.45, jab: 5, cross: 6, fin: 11, finPose: 'hook', kick: 12, desc: ['DENIM JACKET.', 'BIG PUNCHES.'] },
    shaz: { n: 'SHAZ', look: 'shaz', hp: 90, sp: 1.8, jab: 4, cross: 5, fin: 10, finPose: 'hikick', kick: 15, desc: ['TRACKSUIT.', 'FAST FEET.'] },
    nan: { n: 'NAN', look: 'nan', hp: 115, sp: 1.25, jab: 6, cross: 7, fin: 14, finPose: 'upper', kick: 10, desc: ['HANDBAG.', 'TAKES NO NONSENSE.'] },
  };
  const SORRY = ['SORRY!', "I'M OFF HOME!", 'NOT FAIR!', 'OW OW OW!', 'I GIVE UP!', 'MY TEA IS READY!', 'I WANT MY MOM!', 'BEDTIME!'];
  const BOSSLINE = { mick: 'NOBODY TOUCHES MY MOPED!', stan: 'OI! NO RUNNING IN THE PRECINCT!', barry: 'THIS IS MY PROM, THIS IS.', carl: 'FANCY SOME CANDYFLOSS? NO?', grimly: 'SO. YOU MADE IT TO THE ROOF.' };
  const FOOD = { chips: [60, 'FISH & CHIPS!'], apple: [20, 'AN APPLE A DAY'], roll: [35, 'SAUSAGE ROLL!'], roast: [100, 'SUNDAY ROAST!'] };
  const PWA = 'BCDFGHJKLMNPQRSTVWXZ', HIDS = ['kev', 'shaz', 'nan'];
  function pwOf(stage, hero, lives, credits) {
    const v = ((stage * 3 + Math.max(0, HIDS.indexOf(hero))) * 6 + clamp(lives, 0, 5)) * 4 + clamp(credits, 0, 3), d0 = v % 20, d1 = Math.floor(v / 20);
    return PWA[d1] + PWA[d0] + PWA[(v * 7 + 3) % 20] + PWA[(d0 * 3 + d1 * 5 + 11) % 20];
  }
  function pwRead(pw) {
    const a = [...pw].map(ch => PWA.indexOf(ch)); if (a.some(x => x < 0)) return null;
    const v = a[0] * 20 + a[1]; if (v >= 360 || PWA[(v * 7 + 3) % 20] !== pw[2] || PWA[(a[1] * 3 + a[0] * 5 + 11) % 20] !== pw[3]) return null;
    return { stage: Math.floor(v / 72), hero: HIDS[Math.floor(v / 24) % 3], lives: Math.floor(v / 4) % 6, credits: v % 4, score: 0 };
  }
  const DIFF = [{ n: 'EASY', hp: 0.75, dmg: 0.6, at: 1 }, { n: 'NORMAL', hp: 1, dmg: 1, at: 2 }, { n: 'HARD', hp: 1.3, dmg: 1.4, at: 3 }];

  TV.game('md.rage', {
    buttons: ['a', 'b', 'c'],
    help: 'Walk: arrows (tap twice to run). Punch: Z. Jump: X. Special: C (when MOM flashes, C calls Mom). Walk into someone to grab them. Pause: Enter.',
    make(K) {
      let g = K.g; const F = K.font, sfx = K.sfx;
      g.imageSmoothingEnabled = false;
      // ---- the cartridge's save
      const sv = K.load() || {};
      const nm = (id, fb) => { try { const n = window.Cast && Cast.first ? Cast.first(id) : ''; return String(n || fb).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || fb; } catch (e) { return fb; } };
      const SAVE = {
        opt: Object.assign({ diff: 1, lives: 3, music: 1 }, sv.opt || {}),
        hi: Array.isArray(sv.hi) ? sv.hi.slice(0, 5) : [['DAVE', 42500, 'KEV'], ['CALLUM', 31800, 'SHAZ'], ['LUKE', 24300, 'KEV'], ['JACKK', 16900, 'SHAZ'], [nm('cousin2', 'GEMMA'), 8800, 'KEV']].map(([n, s, h]) => ({ n, s, h })),
        un: Object.assign({ nan: 0 }, sv.un || {}), prog: sv.prog && sv.prog.stage >= 0 ? sv.prog : null, wins: sv.wins | 0,
      };
      const persist = () => K.save(SAVE);
      // ---- game state
      let mode = 'title', T = 0, hero = 'kev', score = 0, lives = 3, credits = 2, stageN = 0, ST = null, BG = null, reported = false;
      let cam = 0, lockX = Infinity, waveI = 0, waveOn = false, go = 0, ents = [], fx = [], freeze = 0, shake = 0, paused = false, pauseI = 0, foe = null, foeT = 0, stageT = 0, clearT = 0, msgT = 0, msg = '';
      let P = null, spawnQ = [], paid = false, attract = null, idleT = 0, menuI = 0, optI = 0, howI = 0, sel = 0, cardT = 0, contT = 0, endT = 0, entry = null, flashT = 0, momCar = null, lastTap = { d: 0, t: -9 }, maxCombo = 0, bossIntro = null;
      const D = () => DIFF[SAVE.opt.diff];
      const S = {
        swing() { sfx.noise(0.08, 0.06, 3000, 0, 'highpass'); },
        hit(k) { sfx.noise(0.12, 0.2, 900, 0, 'lowpass', 120); sfx.tone(150 - (k || 0) * 20, 0.1, 'square', 0.08, 0, 60); },
        big() { sfx.noise(0.25, 0.25, 600, 0, 'lowpass', 80); sfx.tone(110, 0.25, 'sawtooth', 0.09, 0, 40); },
        thud() { sfx.noise(0.2, 0.2, 300); sfx.tone(70, 0.2, 'sine', 0.15, 0, 40); },
        jump() { sfx.tone(260, 0.12, 'square', 0.05, 0, 520); },
        smash() { sfx.noise(0.3, 0.2, 2500, 0, 'bandpass', 500); },
        eat() { sfx.seq([[72, 0.25], [76, 0.25], [79, 0.5]], { bpm: 300, vol: 0.08 }); },
        coin() { sfx.tone(1319, 0.06, 'square', 0.06); sfx.tone(1760, 0.2, 'square', 0.06, 0.06); },
        hurt() { sfx.tone(420, 0.2, 'sawtooth', 0.07, 0, 160); },
        go() { sfx.tone(880, 0.08, 'square', 0.06); sfx.tone(880, 0.08, 'square', 0.06, 0.15); },
        special() { sfx.noise(0.4, 0.12, 2000, 0, 'bandpass', 4000); sfx.tone(300, 0.4, 'sawtooth', 0.06, 0, 900); },
        block() { sfx.tone(900, 0.05, 'square', 0.06); sfx.noise(0.06, 0.1, 4000, 0, 'highpass'); },
        honk() { sfx.tone(392, 0.25, 'square', 0.1); sfx.tone(494, 0.25, 'square', 0.1); sfx.tone(392, 0.3, 'square', 0.1, 0.32); sfx.tone(494, 0.3, 'square', 0.1, 0.32); },
        menu() { sfx.tone(880, 0.04, 'square', 0.05); }, ok() { sfx.tone(1320, 0.07, 'square', 0.06); },
      };
      const music = s => K.music(SAVE.opt.music ? s : null);
      const pt = (n, x, y, txt) => { score = Math.min(99999, score + n); if (txt !== false) fx.push({ k: 'txt', x, y, t: 0, s: txt || String(n) }); };

      // ---- input: the controller, or the attract demo's pretend player
      const BOT = { h: {}, p: {} };
      const IN = { held: b => attract ? !!BOT.h[b] : K.held(b), pressed: b => attract ? !!BOT.p[b] : K.pressed(b) };

      // ================================================================ setting up
      function loadStage(n) {
        stageN = n; BG = buildStage(n); ST = BG.ST;
        cam = 0; lockX = Infinity; waveI = 0; waveOn = false; go = 0; foe = null; stageT = 0; clearT = 0; spawnQ = []; fx = []; momCar = null; bossIntro = null;
        ents = ents.filter(e => e === P);
        for (const w of ST.waves) w.t0 = 0;
        for (const [k, x, y, item] of ST.props) ents.push({ type: 'prop', k, x, y, z: 0, hp: k === 'phone' ? 3 : k === 'cone' ? 1 : 2, item, flash: 0 });
        if (!P) newPlayer(); P.x = 60; P.y = 180; P.z = 0; P.st = 'idle'; P.vz = 0; P.grab = null;
        for (const id of [...new Set(ST.waves.flatMap(w => w.e))]) sprites(id); // (paint everybody now, not mid-fight)
        if (!attract) stageStart = { stage: n, hero, score, lives, credits };
      }
      function newPlayer() {
        const H0 = HEROES[hero];
        P = { type: 'hero', h: H0, id: hero, spr: sprites(H0.look), x: 60, y: 180, z: 0, vz: 0, vx: 0, face: 1, hp: H0.hp, st: 'idle', t: 0, combo: 0, comboT: 0, inv: 0, anim: 0, grab: null, grabT: 0, knees: 0, wpn: null, wpnN: 0, touchT: 0, rage: 0, hits: 0, hitT: 0, run: false };
        ents.push(P);
      }
      function setWeapon(w, n) { P.wpn = w; P.wpnN = n; P.spr = w ? sprites(P.h.look, w) : sprites(P.h.look); }
      function spawn(kind, side) {
        const E = EN[kind], fromRight = side > 0, hp = Math.round(E.hp * D().hp);
        const e = { type: 'foe', kind, E, spr: sprites(kind), name: pick(E.names), x: fromRight ? cam + W + 30 + Math.random() * 30 : cam - 30 - Math.random() * 30, y: rnd(TOPY + 4, BOTY - 4), z: 0, vz: 0, vx: 0,
          face: fromRight ? -1 : 1, hp, max: hp, st: 'walk', t: 0, cd: rnd(0.6, 1.6), anim: 0, flash: 0, slot: Math.random() < 0.5 ? -1 : 1, enter: true, summon: 0 };
        if (kind === 'skater') e.st = 'skate';
        if (E.boss) { e.cd = 1.6; bossIntro = { e, t: 0 }; foe = e; foeT = 99; }
        ents.push(e); return e;
      }
      // ================================================================ fighting
      const lane = (a, b, d) => Math.abs(a.y - b.y) < (d || 12);
      function strike(att, reach, dmg, kind, all) {
        let n = 0;
        for (const e of ents) {
          if (e === att || e.dead) continue;
          const foeSide = att.type === 'hero' ? e.type === 'foe' || e.type === 'prop' : e.type === 'hero';
          if (!foeSide) continue;
          if (e.type === 'prop' && att.type !== 'hero') continue;
          if (!lane(att, e, e.type === 'prop' ? 14 : 12)) continue;
          const dx = (e.x - att.x) * (all ? Math.sign(e.x - att.x) || 1 : att.face);
          if (dx < -8 || dx > reach) continue;
          if (e.z > 28 && kind !== 'air') continue;
          if (e.type === 'hero' && (e.inv > 0 || e.st === 'down' || e.st === 'special' || e.st === 'getup' || momCar)) continue;
          if (e.type === 'foe' && (e.st === 'down' || e.st === 'flee' || e.st === 'getup' || e.st === 'thrown')) continue;
          hurt(e, dmg, kind, att); n++;
        }
        return n;
      }
      function hurt(e, dmg, kind, att) {
        const dir = Math.sign(e.x - att.x) || att.face || 1;
        const tall = e.spr && e.spr.idle ? e.spr.idle.height * 0.42 : 30;
        // the bouncers block light hits from the front (grab them, throw them, kick them, or get round the back)
        if (e.type === 'foe' && e.kind === 'bouncer' && kind === 'light' && (e.st === 'walk' || e.st === 'idle' || e.st === 'block') && e.face === -dir && Math.random() < 0.75) {
          e.st = 'block'; e.t = 0; e.vx = dir * 0.8; S.block(); fx.push({ k: 'txt', x: e.x, y: e.y - 96, t: 0, s: 'BLOCKED!' }); return;
        }
        fx.push({ k: 'pow', x: (e.x + att.x) / 2 + dir * 4, y: e.y, z: e.z + tall, t: 0, big: kind !== 'light' });
        freeze = kind === 'light' ? 3 : 6; shake = kind === 'light' ? 1 : 3;
        if (e.type === 'prop') {
          e.hp--; e.flash = 0.2; S.smash();
          if (e.hp <= 0) { e.dead = true; for (let i = 0; i < 7; i++) fx.push({ k: 'bit', x: e.x, y: e.y, z: 20, vx: rnd(-2, 2), vz: rnd(1, 4), t: 0, col: e.k === 'phone' ? '#d02020' : e.k === 'bin' ? '#2a7a2a' : e.k === 'cone' ? '#f07a1a' : '#a07040' }); if (e.item) ents.push({ type: 'item', k: e.item, x: e.x, y: e.y + 4, z: 0, t: 0 }); pt(50, e.x, e.y - 40); }
          return;
        }
        if (e.type === 'foe' && e.E.boss) dmg = Math.round(dmg * 0.9);
        e.hp -= e.type === 'hero' ? Math.round(dmg * D().dmg) : dmg;
        if (e.type === 'foe') {
          foe = e; foeT = 3; pt(10, e.x, e.y - 60, false); e.flash = 0.15;
          if (att.type === 'hero' || att.type === 'foe') { P.hits++; P.hitT = 1.3; P.rage = Math.min(100, P.rage + 4); if (P.hits > maxCombo) maxCombo = P.hits; if (P.hits >= 15) K.secret('rm.rage.combo'); }
        }
        if (e.type === 'hero') { S.hurt(); e.rage = Math.min(100, e.rage + 6); if (e.grab) { e.grab.grabbedBy = null; if (e.grab.st === 'grabbed') e.grab.st = 'walk'; e.grab = null; } }
        else S.hit(kind === 'light' ? 0 : 1);
        if (e.grabbedBy) { e.grabbedBy.grab = null; e.grabbedBy = null; }
        if (e.hp <= 0 || kind === 'heavy' || kind === 'air' || kind === 'throw') {
          e.st = 'down'; e.t = 0; e.vz = 3; e.vx = dir * (kind === 'throw' ? 4 : 2.2); e.z = Math.max(e.z, 1); S.big();
          if (e.type === 'foe') pt(50, e.x, e.y - 70, false);
        } else { e.st = Math.random() < 0.5 ? 'hurt' : 'hurt2'; e.t = 0; e.vx = dir * 1.2; }
        if (e.type === 'hero' && e.hp <= 0) e.hp = 0;
      }
      // ================================================================ the player
      let queue = false;
      function playerStep(dt) {
        const p = P, H0 = p.h;
        p.t += dt; if (p.inv > 0) p.inv -= dt; if (p.comboT > 0) p.comboT -= dt; else p.combo = 0;
        if (p.hitT > 0) { p.hitT -= dt; if (p.hitT <= 0) { if (p.hits >= 4) pt(p.hits * p.hits * 5, p.x, p.y - 100, p.hits + ' HIT COMBO!'); p.hits = 0; } }
        const L = IN.held('left'), Rr = IN.held('right'), U = IN.held('up'), Dn = IN.held('down');
        if (p.st === 'down') { physics(p); if (p.t > (p.hp <= 0 ? 1.6 : 0.9) && p.z <= 0) { if (p.hp <= 0) return loseLife(); p.st = 'getup'; p.t = 0; } return; }
        if (p.st === 'getup') { if (p.t > 0.35) { p.st = 'idle'; p.inv = 1.2; } return; }
        if (p.st === 'hurt' || p.st === 'hurt2') { p.x += p.vx; p.vx *= 0.8; if (p.t > 0.3) p.st = 'idle'; return; }
        if (p.st === 'dizzy') { if (p.t > 1.1) p.st = 'idle'; return; }
        if (p.st === 'atk') {
          const A = p.atk;
          if (A.move) p.x += p.face * A.move * (1 - p.t / A.len);
          if (!A.done && p.t >= A.at) { A.done = true; const n = strike(p, A.reach, A.dmg, A.kind); if (n) { pt(10 * n, p.x + p.face * 20, p.y - 50, false); if (p.wpn) { p.wpnN--; if (p.wpnN <= 0) { fx.push({ k: 'txt', x: p.x, y: p.y - 90, t: 0, s: (p.wpn === 'bat' ? 'BAT' : 'PIPE') + ' BROKE!' }); setWeapon(null, 0); } } } }
          if (IN.pressed('a') && p.t > A.len * 0.4 && p.combo > 0 && p.combo < 3 && !p.wpn) queue = true;
          if (p.t >= A.len) { p.st = 'idle'; if (queue) { queue = false; attack(); } }
          return;
        }
        if (p.st === 'special') { if (p.t > 0.1 && p.t < 0.5 && !p.spun) { p.spun = true; const n = strike(p, 38, 12, 'heavy', true); if (n && p.hp > 10) p.hp -= 6; } if (p.t > 0.6) { p.st = 'idle'; p.spun = false; } return; }
        if (p.st === 'grab') {
          const e = p.grab;
          if (!e || e.dead || e.st !== 'grabbed') { p.st = 'idle'; p.grab = null; return; }
          e.x = p.x + p.face * 16; e.y = p.y; e.face = -p.face;
          p.grabT += dt;
          if (IN.pressed('a')) { p.st = 'kneeing'; p.t = 0; p.knees++; S.swing(); }
          else if (IN.pressed('b') || p.grabT > 1.8) {
            if (p.grabT > 1.8 && !IN.pressed('b')) { e.st = 'walk'; e.grabbedBy = null; p.grab = null; p.st = 'idle'; e.cd = 0.3; return; }
            const back = (p.face > 0 && L) || (p.face < 0 && Rr); // hold the other way: over your shoulder behind you
            p.st = 'throwing'; p.t = 0; e.st = 'thrown'; e.t = 0; e.z = 30; e.vz = 3.2; e.vx = (back ? -p.face : p.face) * 3.6; e.x = p.x; e.grabbedBy = null; p.grab = null; S.swing();
            if (!back) e.x = p.x + p.face * 10;
          }
          return;
        }
        if (p.st === 'kneeing') {
          const e = p.grab;
          if (p.t > 0.1 && !p.kneed && e) { p.kneed = true; const finish = p.knees >= 3 || e.hp <= 5; e.st = 'hurt'; hurt(e, finish ? 9 : 5, finish ? 'heavy' : 'light', p); if (finish || e.st === 'down') { p.grab = null; p.knees = 0; } else { e.st = 'grabbed'; e.grabbedBy = p; p.grab = e; } }
          if (p.t > 0.28) { p.kneed = false; p.st = p.grab ? 'grab' : 'idle'; }
          return;
        }
        if (p.st === 'throwing') { if (p.t > 0.4) p.st = 'idle'; return; }
        if (p.st === 'jump' || p.st === 'jkick') {
          p.x += p.vx; physics(p);
          if (p.st === 'jump' && IN.pressed('a')) { p.st = 'jkick'; p.kicked = false; S.swing(); }
          if (p.st === 'jkick' && !p.kicked && p.z > 4) { if (strike(p, 32, H0.kick, 'air')) p.kicked = true; }
          if (p.z <= 0) { p.z = 0; p.st = 'idle'; p.vx = 0; }
          return;
        }
        // walking and running about
        let mx = (Rr ? 1 : 0) - (L ? 1 : 0); const my = (Dn ? 1 : 0) - (U ? 1 : 0);
        for (const [b, d] of [['left', -1], ['right', 1]]) if (IN.pressed(b)) { if (lastTap.d === d && K.t - lastTap.t < 0.28) p.run = true; lastTap = { d, t: K.t }; }
        if (!mx) p.run = false;
        if (mx) p.face = mx;
        const sp = H0.sp * (p.run ? 1.9 : 1);
        p.x += mx * sp; p.y = clamp(p.y + my * H0.sp * 0.6, TOPY, BOTY);
        p.st = mx || my ? 'walk' : 'idle'; if (mx || my) p.anim += p.run ? 0.22 : 0.14;
        if (IN.pressed('a')) { if (p.run) { p.atk = { at: 0.06, len: 0.4, reach: 30, dmg: H0.cross + 4, kind: 'heavy', pose: 'barge', move: 3 }; p.st = 'atk'; p.t = 0; p.run = false; S.swing(); return; } return attack(); }
        if (IN.pressed('b')) { p.st = 'jump'; p.t = 0; p.vz = 4.8; p.z = 0.1; p.vx = mx * sp * 1.1; p.run = false; S.jump(); return; }
        if (IN.pressed('c')) {
          if (p.rage >= 100) return callMom();
          p.st = 'special'; p.t = 0; p.spun = false; S.special(); return;
        }
        // walk into somebody to grab them
        let touching = null;
        for (const e of ents) if (e.type === 'foe' && (e.st === 'walk' || e.st === 'idle' || e.st === 'wind' || e.st === 'block') && !e.E.boss && e.z <= 0 && lane(p, e, 8) && (e.x - p.x) * p.face > 0 && Math.abs(e.x - p.x) < 22 && mx === p.face) touching = e;
        if (touching) { p.touchT += dt; if (p.touchT > 0.2) { p.st = 'grab'; p.grab = touching; p.grabT = 0; p.knees = 0; touching.st = 'grabbed'; touching.grabbedBy = p; p.touchT = 0; p.run = false; } } else p.touchT = 0;
        for (const it of ents) if (it.type === 'item' && !it.dead && Math.abs(it.x - p.x) < 16 && Math.abs(it.y - p.y) < 10) take(it);
      }
      function attack() {
        const p = P, H0 = p.h;
        if (p.wpn) { p.atk = { at: 0.12, len: 0.34, reach: p.wpn === 'bat' ? 40 : 36, dmg: p.wpn === 'bat' ? 17 : 14, kind: 'heavy', pose: 'swing' }; p.st = 'atk'; p.t = 0; S.swing(); return; }
        p.combo = p.comboT > 0 ? p.combo + 1 : 1; if (p.combo > 3) p.combo = 1; p.comboT = 0.6;
        const c = p.combo;
        p.atk = c === 1 ? { at: 0.05, len: 0.17, reach: 28, dmg: H0.jab, kind: 'light', pose: 'jab' } : c === 2 ? { at: 0.05, len: 0.19, reach: 28, dmg: H0.cross, kind: 'light', pose: 'cross' } : { at: 0.08, len: 0.32, reach: 32, dmg: H0.fin, kind: 'heavy', pose: H0.finPose };
        p.st = 'atk'; p.t = 0; p.x += p.face * 2; S.swing();
      }
      function callMom() { // the MOM meter: Mom drives past honking and everybody falls over in fright
        P.rage = 0; momCar = { x: cam - 120, t: 0, hit: new Set() }; S.honk(); flashT = 0.15; msg = 'MOM!'; msgT = 0;
        P.st = 'idle'; P.inv = 2.5;
      }
      function take(it) {
        it.dead = true;
        if (FOOD[it.k]) { P.hp = Math.min(P.h.hp, P.hp + FOOD[it.k][0]); S.eat(); pt(100, it.x, it.y - 30, FOOD[it.k][1]); }
        else if (it.k === 'money') { S.coin(); pt(500, it.x, it.y - 30, '+500 POCKET MONEY'); }
        else if (it.k === 'tape') { S.coin(); pt(1000, it.x, it.y - 30, 'A MIX TAPE! +1000'); }
        else if (it.k === 'oneup') { lives++; sfx.seq([[72, 0.25], [79, 0.25], [84, 0.25], [91, 0.5]], { bpm: 300, vol: 0.08 }); fx.push({ k: 'txt', x: it.x, y: it.y - 30, t: 0, s: 'EXTRA LIFE!' }); }
        else if (it.k === 'pipe' || it.k === 'bat') { setWeapon(it.k, it.k === 'bat' ? 10 : 12); S.coin(); pt(100, it.x, it.y - 30, it.k === 'bat' ? 'A CRICKET BAT!' : 'A LEAD PIPE!'); if (it.k === 'pipe') K.secret('rm.rage.pipe'); }
      }
      function loseLife() {
        lives--;
        if (lives < 0) {
          if (attract) { endAttract(); return; }
          if (credits > 0) { mode = 'continue'; contT = 0; music(SONGS.cont); return; }
          return gameOver();
        }
        respawn();
      }
      function respawn() {
        P.hp = P.h.hp; P.st = 'idle'; P.inv = 2.5; P.z = 0; setWeapon(null, 0);
        fx.push({ k: 'txt', x: P.x, y: P.y - 100, t: 0, s: 'LIVES LEFT: ' + lives });
        for (const e of ents) if (e.type === 'foe' && Math.abs(e.x - P.x) < 90 && e.st !== 'flee') { e.st = 'down'; e.t = 0; e.vz = 2; e.vx = Math.sign(e.x - P.x) * 3; e.z = 1; }
      }
      function gameOver() { mode = 'over'; T = 0; music(null); sfx.seq([[67, 1], [63, 1], [60, 1], [55, 3]], { bpm: 140, vol: 0.08, wave: 'triangle' }); }
      function physics(e) {
        e.vz -= 0.25; e.z += e.vz; e.x += e.vx || 0;
        if (e.z <= 0) { if (e.vz < -2.5 && (e.st === 'down' || e.st === 'thrown')) { S.thud(); shake = 2; } e.z = 0; e.vz = e.st === 'down' && e.vz < -3 ? -e.vz * 0.3 : 0; if (e.st === 'down') e.vx *= 0.6; }
      }
      // ================================================================ the thugs (and their bosses)
      let attackers = 0;
      function foeStep(e, dt) {
        e.t += dt; if (e.flash > 0) e.flash -= dt; e.cd -= dt;
        const E = e.E, p = P;
        if (e.st === 'grabbed') return;
        if (e.st === 'thrown') {
          physics(e);
          for (const o of ents) if (o !== e && o.type === 'foe' && o.st !== 'down' && o.st !== 'flee' && lane(o, e, 12) && Math.abs(o.x - e.x) < 18) { hurt(o, 8, 'heavy', e); pt(100, o.x, o.y - 60, 'STRIKE!'); }
          if (e.z <= 0) { e.st = 'down'; e.t = 0; e.vz = 1.5; e.z = 1; e.hp -= 10; S.thud(); shake = 3; pt(50, e.x, e.y - 50, false); }
          return;
        }
        if (e.st === 'down') { physics(e); if (e.t > 1.1 && e.z <= 0) { if (e.hp <= 0) { e.st = 'flee'; e.t = 0; e.say = E.boss ? 'ALL RIGHT! I GIVE UP!' : pick(SORRY); pt(E.pts, e.x, e.y - 70); if (foe === e) foeT = 1; } else { e.st = 'getup'; e.t = 0; } } return; }
        if (e.st === 'getup') { if (e.t > 0.4) { e.st = 'walk'; e.cd = rnd(0.5, 1.2); } return; }
        if (e.st === 'flee') { e.face = e.x < cam + W / 2 ? -1 : 1; e.x += e.face * 2.2; e.anim += 0.2; if (e.x < cam - 70 || e.x > cam + W + 70) e.dead = true; return; }
        if (e.st === 'hurt' || e.st === 'hurt2' || e.st === 'block') { e.x += e.vx; e.vx *= 0.8; if (e.t > 0.32) { e.st = 'walk'; e.cd = Math.max(e.cd, e.kind === 'bouncer' ? 0.1 : 0.4); } return; }
        if (P.st === 'down' && P.hp <= 0) { e.st = 'idle'; return; }
        const canHit = () => p.inv <= 0 && p.st !== 'down' && p.st !== 'special' && !momCar;
        if (e.st === 'skate') {
          e.x += e.face * 3.3; e.anim += 0.1;
          if (lane(e, p, 10) && Math.abs(e.x - p.x) < 16 && p.z < 10 && canHit()) hurt(p, E.dmg, 'heavy', e);
          if ((e.face > 0 && e.x > cam + W + 30) || (e.face < 0 && e.x < cam - 30)) { e.face = -e.face; e.y = clamp(p.y + rnd(-10, 10), TOPY, BOTY); e.laps = (e.laps | 0) + 1; if (e.laps > 1) e.st = 'walk'; }
          return;
        }
        if (e.st === 'charge' || e.st === 'spinatk') {
          e.x += e.face * (e.st === 'spinatk' ? 2.6 : 3.4); e.anim += 0.25;
          if (lane(e, p, e.st === 'spinatk' ? 16 : 12) && Math.abs(e.x - p.x) < (e.st === 'spinatk' ? 30 : 20) && canHit() && p.z < 10) hurt(p, E.dmg, 'heavy', e);
          if (e.t > 1.3 || e.x < cam + 4 || e.x > cam + W - 4) { e.st = 'walk'; e.cd = rnd(1, 1.8); e.x = clamp(e.x, cam + 6, cam + W - 6); }
          return;
        }
        if (e.st === 'jkick') { // the punks fly in feet first
          e.x += e.vx; physics(e);
          if (!e.hit && e.z > 4 && lane(e, p, 12) && Math.abs(e.x - p.x) < 24 && canHit()) { e.hit = true; hurt(p, E.dmg, 'heavy', e); }
          if (e.z <= 0) { e.z = 0; e.st = 'walk'; e.hit = false; e.vx = 0; e.cd = rnd(0.8, 1.6); }
          return;
        }
        if (e.st === 'throw') { if (e.t > 0.3 && !e.thrown) { e.thrown = true; ents.push({ type: 'proj', k: 'paper', x: e.x + e.face * 16, y: e.y, z: 36, vx: e.face * 3.6, t: 0, dmg: E.dmg }); S.swing(); } if (e.t > 0.6) { e.st = 'walk'; e.thrown = false; e.cd = rnd(1.4, 2.4); } return; }
        if (e.st === 'lift') { if (e.t > 0.7 && !e.lobbed) { e.lobbed = true; ents.push({ type: 'proj', k: 'thrownbin', x: e.x + e.face * 20, y: e.y, z: 0, vx: e.face * 3.6, t: 0, dmg: 12, roll: 1 }); S.swing(); } if (e.t > 1.1) { e.st = 'walk'; e.lobbed = false; e.cd = rnd(1.2, 2); } return; }
        if (e.st === 'torch') { // Security Stan's torch: look into it and you're seeing spots
          if (e.t > 0.5 && !e.shone) { e.shone = true; if (lane(e, p, 18) && (p.x - e.x) * e.face > 0 && Math.abs(p.x - e.x) < 150 && canHit() && p.st !== 'jump' && p.st !== 'jkick') { p.st = 'dizzy'; p.t = 0; fx.push({ k: 'txt', x: p.x, y: p.y - 100, t: 0, s: 'DAZZLED!' }); sfx.tone(1800, 0.4, 'sine', 0.06, 0, 600); } }
          if (e.t > 1.0) { e.st = 'walk'; e.shone = false; e.cd = rnd(1, 1.8); }
          return;
        }
        if (e.st === 'wind') { if (e.t > (E.boss ? 0.42 : 0.36)) { e.st = 'punch'; e.t = 0; S.swing(); } return; }
        if (e.st === 'punch') {
          if (e.t > 0.06 && !e.hit) { e.hit = true; strike(e, E.reach, Math.round(E.dmg), E.boss ? 'heavy' : 'light'); }
          if (e.t > 0.3) { e.st = 'walk'; e.hit = false; e.cd = rnd(0.6, 1.3) * (E.boss ? 0.8 : 1); }
          return;
        }
        // Mr Grimly calls the lads when he's getting the worst of it
        if (e.kind === 'grimly' && ((e.hp < e.max * 0.6 && e.summon === 0) || (e.hp < e.max * 0.3 && e.summon === 1))) { e.summon++; e.say2 = 'LADS! GET HIM!'; e.sayT = 2; spawnQ.push({ k: 'herb', side: 1, at: stageT + 0.4 }, { k: e.summon === 2 ? 'punk' : 'herb2', side: -1, at: stageT + 1 }, { k: 'paper', side: 1, at: stageT + 1.6 }); }
        // walk to a spot beside the player
        if (e.enter && e.x > cam + 6 && e.x < cam + W - 6) e.enter = false;
        const side = e.x < p.x ? -1 : 1, ranged = e.kind === 'paper';
        const want = ranged ? 100 : (e.cd <= 0 && attackers < D().at + (E.boss ? 1 : 0)) ? E.reach - 6 : 58 + (e.slot > 0 ? 12 : 0);
        let tx = p.x + side * want; const ty = p.y + (e.cd <= 0 || ranged ? 0 : e.slot * 9);
        if (tx < cam + 14 || tx > cam + W - 14) tx = p.x - side * want;
        tx = clamp(tx, cam + 14, cam + W - 14);
        const dx = tx - e.x, dy = ty - e.y;
        e.face = p.x > e.x ? 1 : -1;
        let moved = false;
        if (Math.abs(dx) > 3) { e.x += Math.sign(dx) * Math.min(E.sp, Math.abs(dx)); moved = true; }
        if (Math.abs(dy) > 2) { e.y = clamp(e.y + Math.sign(dy) * Math.min(E.sp * 0.6, Math.abs(dy)), TOPY, BOTY); moved = true; }
        if (!e.enter) e.x = clamp(e.x, cam + 6, cam + W - 6);
        e.anim += moved ? 0.12 : 0;
        e.st = moved ? 'walk' : 'idle';
        const dist = Math.abs(p.x - e.x);
        if (e.cd > 0 || p.st === 'down') return;
        if (ranged) { if (lane(e, p, 8) && dist > 50 && dist < 170) { e.st = 'throw'; e.t = 0; } return; }
        if (e.kind === 'punk' && lane(e, p, 10) && dist > 50 && dist < 110 && Math.random() < 0.04) { e.st = 'jkick'; e.t = 0; e.vz = 4.2; e.z = 0.1; e.vx = e.face * 2.4; e.hit = false; S.jump(); return; }
        if (e.kind === 'stan' && lane(e, p, 14) && dist > 50 && Math.random() < 0.03) { e.st = 'torch'; e.t = 0; return; }
        if (e.kind === 'carl' && lane(e, p, 16) && dist > 40 && Math.random() < 0.025) { e.st = 'spinatk'; e.t = 0; S.special(); return; }
        if (e.kind === 'grimly' && lane(e, p, 14) && dist > 60 && Math.random() < 0.02) { e.st = 'spinatk'; e.t = 0; S.special(); return; }
        if ((e.kind === 'barry' || e.kind === 'lenny') && !lane(e, p, 6) && dist > 90 && Math.random() < 0.012) { if (e.kind === 'lenny') { e.st = 'charge'; e.t = 0; e.y = p.y; } else { e.st = 'lift'; e.t = 0; } return; }
        if (lane(e, p, 6) && dist < E.reach + 2) {
          if ((e.kind === 'lenny' || e.kind === 'mick' || e.kind === 'stan') && Math.random() < 0.25) { e.st = 'charge'; e.t = 0; e.face = side < 0 ? 1 : -1; }
          else if (e.kind === 'barry' && Math.random() < 0.3) { e.st = 'lift'; e.t = 0; }
          else { e.st = 'wind'; e.t = 0; }
        }
      }
      // ================================================================ waves and scrolling
      function waves() {
        const Wv = ST.waves[waveI];
        if (!waveOn && Wv && P.x > Wv.at - 40) {
          waveOn = true; lockX = Wv.at + W / 2 - 140; go = 0;
          spawnQ = Wv.e.map((k, i) => ({ k, side: i % 2 ? -1 : 1, at: stageT + i * 0.9 + (EN[k].boss ? 0.6 : 0) }));
          Wv.t0 = stageT;
          if (Wv.boss && !attract) { music(SONGS.boss); msg = 'WATCH OUT!'; msgT = 2; }
        }
        if (spawnQ.length && stageT >= spawnQ[0].at) { const q = spawnQ.shift(); spawn(q.k, q.side); }
        if (waveOn) {
          const alive = ents.some(e => e.type === 'foe' && e.st !== 'flee' && !e.dead);
          if (!alive && !spawnQ.length && stageT - Wv.t0 > 1) {
            waveOn = false; waveI++; lockX = Infinity;
            if (Wv.boss) { clearT = 0.01; music(null); sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 2]], { bpm: 200, vol: 0.08 }); }
            else { go = 3; S.go(); }
          }
        }
        const want = clamp(P.x - 130, cam, Math.min(lockX - W / 2 + 40, ST.len - W));
        cam += (want - cam) * 0.15;
        P.x = clamp(P.x, cam + 12, Math.min(cam + W - 12, ST.len - 12));
      }
      // ================================================================ drawing
      function sprOf(e) {
        const s = e.spr, st = e.st;
        if (st === 'down' || st === 'thrown') return s.down;
        if (st === 'getup') return s.getup;
        if (st === 'hurt' || st === 'grabbed') return s.hurt;
        if (st === 'hurt2') return s.hurt2;
        if (st === 'flee') return s['flee' + ((e.anim | 0) & 1)];
        if (st === 'block') return s.block;
        if (st === 'dizzy') return s.dizzy;
        if (e.type === 'hero') {
          if (st === 'atk') return e.atk.pose === 'swing' ? (e.t < e.atk.at ? s.swing0 : s.swing1) : s[e.atk.pose];
          if (st === 'jump') return s.jump;
          if (st === 'jkick') return s.jkick;
          if (st === 'grab') return s.grab;
          if (st === 'kneeing') return s.knee;
          if (st === 'throwing') return e.t < 0.2 ? s.throw : s.cross;
          if (st === 'special') return s['spin' + ((e.t * 16 | 0) & 1)];
          if (st === 'win') return s.win;
          if (st === 'walk') return e.run ? s['run' + ((e.anim | 0) & 1)] : s['walk' + ((e.anim | 0) & 3)];
          return (T * 2 | 0) % 2 ? s.idle2 : s.idle;
        }
        if (st === 'skate') return s.skate;
        if (st === 'wind') return s.wind;
        if (st === 'punch') return e.t < 0.2 ? (e.kind === 'grimly' ? s.poke : s.jab) : s.idle;
        if (st === 'charge') return s['run' + ((e.anim | 0) & 1)];
        if (st === 'spinatk') return s['spin' + ((e.t * 14 | 0) & 1)];
        if (st === 'jkick') return s.jkick;
        if (st === 'throw') return e.t < 0.3 ? s.wind : s.cross;
        if (st === 'torch') return s.jab;
        if (st === 'lift') return s.carry || s.throw;
        if (st === 'walk') return s['walk' + ((e.anim | 0) & 3)];
        return (T * 1.6 + e.x * 0.01 | 0) % 2 ? s.idle2 : s.idle;
      }
      function drawEnt(e) {
        const x = Math.round(e.x - cam), y = Math.round(e.y);
        if (x < -100 || x > W + 100) return;
        const sw = e.type === 'prop' ? 13 : e.type === 'proj' ? 8 : 13 * ((e.spr && e.spr.idle.width / 91) || 1);
        g.fillStyle = 'rgba(0,0,10,.4)'; g.beginPath(); g.ellipse(x, y, sw, 3.5, 0, 0, 7); g.fill();
        if (e.type === 'prop') { const im = art(e.k); if (e.flash > 0 && (K.frame & 2)) { g.globalAlpha = 0.5; } g.drawImage(im, x - im.width / 2, y - im.height + 2); g.globalAlpha = 1; return; }
        if (e.type === 'item') { const im = art(e.k), by = y - 2 - Math.abs(Math.sin(T * 4)) * 2; g.drawImage(im, x - im.width / 2, by - im.height); if ((K.frame >> 3) % 4 === 0) rect(g, x - im.width / 2 + 2, by - im.height + 2, 2, 2, '#fff'); return; }
        if (e.type === 'proj') { const im = art(e.k); g.save(); g.translate(x, y - e.z - im.height / 2); g.rotate(e.t * (e.roll ? 8 : 14) * Math.sign(e.vx)); g.drawImage(im, -im.width / 2, -im.height / 2); g.restore(); return; }
        if (e.inv > 0 && (K.frame & 4) && !momCar) return;
        const im = sprOf(e); if (!im) return;
        g.save(); g.translate(x, y - e.z);
        if (e.face < 0) g.scale(-1, 1);
        if (e.flash > 0 && (K.frame & 2)) g.globalAlpha = 0.55;
        if (im === e.spr.down) g.drawImage(im, -im.width * 0.72, -im.height + 4); else g.drawImage(im, -im.width / 2, -im.height + 4);
        g.restore();
        const top = y - e.z - (e.spr.idle.height - 8);
        if (e.st === 'flee' && e.say) bubble(e.say, x, top - 6);
        if (e.sayT > 0 && e.say2) bubble(e.say2, x, top - 6);
        if (e.st === 'block') { g.strokeStyle = '#a8e0ff'; g.lineWidth = 2; g.beginPath(); g.arc(x + e.face * 14, y - 50, 14, -1.2, 1.2); g.stroke(); }
        if (e.st === 'torch' && e.t > 0.25) { g.save(); g.globalAlpha = 0.35 + Math.sin(T * 40) * 0.1; g.fillStyle = '#fff8b0'; g.beginPath(); const tx = x + e.face * 22, ty = y - 58; g.moveTo(tx, ty); g.lineTo(tx + e.face * 150, ty - 26); g.lineTo(tx + e.face * 150, ty + 40); g.closePath(); g.fill(); g.restore(); }
        if (e.st === 'getup' || e.st === 'dizzy' || (e.st === 'down' && e.t > 0.5 && e.hp > 0)) for (let k = 0; k < 3; k++) { const a = T * 6 + k * 2.1; rect(g, x - 6 + Math.cos(a) * 10, (e.st === 'dizzy' ? top + 6 : y - 30) + Math.sin(a) * 3, 3, 3, '#ffd84a'); }
      }
      function bubble(s, x, y) { const w = F.width(s) + 8; x = clamp(x, w / 2 + 2, W - w / 2 - 2); rect(g, x - w / 2 - 1, y - 13, w + 2, 14, '#000'); rect(g, x - w / 2, y - 12, w, 12, '#fff'); poly(g, [x - 3, y - 1, x + 3, y - 1, x, y + 4], '#fff'); F.center(g, s, x, y - 10, '#000'); }
      function drawFx() {
        for (const f of fx) {
          const x = Math.round(f.x - cam);
          if (f.k === 'pow') { const y = f.y - f.z, r = 5 + f.t * 70; const col = f.t < 0.05 ? '#ffffff' : '#ffd84a'; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + f.x; poly(g, [x, y, x + Math.cos(a - 0.2) * r * 0.4, y + Math.sin(a - 0.2) * r * 0.4, x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a + 0.2) * r * 0.4, y + Math.sin(a + 0.2) * r * 0.4], col); } if (f.big && f.t < 0.14) F.center(g, ['POW!', 'BIFF!', 'WHAM!', 'BOFF!'][(f.x | 0) % 4], x, y - 22, '#fff', 1, '#c01a1a'); }
          else if (f.k === 'txt') F.center(g, f.s, x, Math.round(f.y - f.t * 24), '#fff', 1, '#000');
          else if (f.k === 'bit') rect(g, x + f.vx * f.t * 40, Math.round(f.y - (f.z + f.vz * f.t * 40 - f.t * f.t * 300)), 4, 3, f.col);
        }
      }
      const SLAB = { slabs: ['#6e6874', '#4e4858', '#82808c'], tiles: ['#c8b898', '#8a6a4a', '#e8dcc0'], prom: ['#b89a78', '#8a7058', '#d0b490'], planks: ['#8a6038', '#4a3018', '#a87848'], roof: ['#4a4450', '#2e2a36', '#5e5866'] };
      function drawStage() {
        const c = cam;
        g.drawImage(BG.far, Math.round(c * 0.2), 0, W, 150, 0, 0, W, 150);
        // live bits behind the middle layer: the big wheel on the pier
        if (stageN === 3) drawWheel(160 - ((c * 0.35) % 640) + 200, 64);
        g.drawImage(BG.mid, Math.round(c * 0.5), 0, W, 150, 0, 0, W, 150);
        g.drawImage(BG.near, Math.round(c), 0, W, 150, 0, 0, W, 150);
        // lights: shop windows glow, bulbs twinkle
        for (const [k, lx, ly, n] of BG.lights) {
          const par = k === 2 ? 0.5 : k === 1 && stageN === 3 && ly > 100 ? 0.5 : 1, x = lx - c * par;
          if (x < -80 || x > W + 80) continue;
          if (k === 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(60,50,10,.25)'; g.fillRect(x - n / 2, 150, n, 14); g.restore(); }
          else if (k === 1) rect(g, Math.round(x) - 1, ly - 1, 3, 3, ((K.frame >> 4) + n) % 3 ? ['#ff4a4a', '#ffd84a', '#7aff7a', '#7ad0ff'][n % 4] : '#5a4a4a');
          else if (k === 2) rect(g, Math.round(x) - 1, ly - 1, 3, 3, (K.frame >> 5) % 2 ? '#ff2a2a' : '#5a1010');
          else if (k === 3) for (let i = 0; i < 6; i++) { const a = (T * 3 + i) % 1; rect(g, Math.round(x + Math.sin(i * 2.1) * 14 * a), Math.round(ly + a * 26 - Math.sin(a * 3.1) * 10), 2, 2, '#bfe6ff'); }
        }
        // the floor: rows get taller towards you
        const [c0, c1, c2] = SLAB[ST.floor];
        rect(g, 0, 150, W, 64, c0);
        const rows = [150, 155, 162, 171, 182, 196, 214];
        for (let r = 0; r < rows.length - 1; r++) {
          const y0 = rows[r], y1 = rows[r + 1], hh = y1 - y0, sw = 24 + r * 10, off = (r % 2) * sw / 2;
          if (ST.floor === 'tiles') { for (let x = -((c + off) % (sw * 2)) - sw * 2; x < W + sw; x += sw) if (((x + c + off) / sw | 0) % 2 === 0) rect(g, x, y0, sw, hh, c2); rect(g, 0, y0, W, 1, '#fff8e0'); continue; }
          if (ST.floor === 'planks') { rect(g, 0, y1 - 1, W, 1, c1); for (let x = -((c * 1 + off * 3) % 90); x < W; x += 90) rect(g, x, y0, 1, hh, c1); if (r % 2) rect(g, 0, y0 + 1, W, 1, c2); continue; }
          rect(g, 0, y0, W, 1, c1); rect(g, 0, y0 + 1, W, 1, c2);
          for (let x = -((c + off) % sw); x < W; x += sw) rect(g, Math.round(x), y0, 1, hh, c1);
          if (ST.floor === 'roof') for (let i = 0; i < 6; i++) rect(g, ((i * 53 + r * 37 - c) % W + W) % W, y0 + 2 + (i % 3) * 2, 1, 1, c2);
        }
        // the edge nearest you
        if (ST.floor === 'slabs') { rect(g, 0, 212, W, 4, '#9a9aa4'); rect(g, 0, 216, W, 8, '#2a2a30'); for (let x = -((c * 1.2) % 40); x < W; x += 40) rect(g, x, 219, 20, 2, '#e8c020'); }
        else if (ST.floor === 'tiles') { rect(g, 0, 212, W, 12, '#7a6a58'); rect(g, 0, 212, W, 2, '#b8a888'); }
        else if (ST.floor === 'prom') { rect(g, 0, 212, W, 12, '#d8d0c0'); for (let x = -((c * 1.3) % 16); x < W; x += 16) rect(g, x, 212, 3, 12, '#8a8a98'); rect(g, 0, 212, W, 2, '#ffffff'); }
        else if (ST.floor === 'planks') { rect(g, 0, 212, W, 12, '#0a1430'); for (let i = 0; i < 12; i++) rect(g, ((i * 41 - c * 1.3) % W + W) % W, 216 + (i % 3) * 2, 8, 1, '#4a6ab0'); for (let x = -((c * 1.3) % 60); x < W; x += 60) rect(g, x, 212, 6, 12, '#3a2410'); }
        else { rect(g, 0, 212, W, 12, '#6a6070'); rect(g, 0, 212, W, 2, '#9a90a0'); }
        // the night's lamp light
        if (stageN === 0) { g.save(); g.globalCompositeOperation = 'lighter'; for (let lx = 100; lx < ST.len; lx += 300) { const x = lx + 11 - c; if (x < -80 || x > W + 80) continue; const gr = g.createRadialGradient(x, 182, 4, x, 182, 70); gr.addColorStop(0, 'rgba(120,100,40,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 80, 140, 160, 84); } g.restore(); }
      }
      function drawWheel(cx, cy) {
        const r = 52, a0 = T * 0.25;
        g.strokeStyle = '#6a6a9a'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
        for (let i = 0; i < 12; i++) { const a = a0 + i / 12 * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); rect(g, Math.round(x) - 4, Math.round(y), 8, 6, ['#d02a3a', '#2a8ad0', '#f0c020'][i % 3]); rect(g, Math.round(x) - 1, Math.round(y) - 1, 2, 2, ((K.frame >> 3) + i) % 2 ? '#fff0a0' : '#8a7040'); }
        g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - 30, 150); g.moveTo(cx, cy); g.lineTo(cx + 30, 150); g.stroke(); ell(g, cx, cy, 4, 4, '#c8c8e0');
      }
      function bar(x, y, w, v, max, col) { rect(g, x - 1, y - 1, w + 2, 8, '#000'); rect(g, x, y, w, 6, '#5a1010'); rect(g, x, y, Math.max(0, w * v / max), 6, col); rect(g, x, y, Math.max(0, w * v / max), 2, shade(col, 1.4)); for (let i = 8; i < w; i += 8) rect(g, x + i, y, 1, 6, 'rgba(0,0,0,.35)'); }
      function face(spr, x, y, flip) { // a little portrait from the idle sprite's head
        const im = spr.idle, [hx, hy, S2] = im.head, s = 13 * S2;
        rect(g, x - 1, y - 1, 22, 22, '#000'); rect(g, x, y, 20, 20, '#2a2a5a');
        g.save(); if (flip) { g.translate(x + 20, y); g.scale(-1, 1); g.drawImage(im, hx - s / 2, hy - s / 2 - 1, s, s, 0, 0, 20, 20); } else g.drawImage(im, hx - s / 2, hy - s / 2 - 1, s, s, x, y, 20, 20); g.restore();
      }
      function hud() {
        face(P.spr, 6, 4);
        F.draw(g, P.h.n, 30, 4, '#ffd84a', 1, '#000'); bar(30, 13, 90, P.hp, P.h.hp, P.hp < 30 && (K.frame & 8) ? '#ff4a4a' : '#ffd84a');
        F.draw(g, 'X' + Math.max(0, lives), 124, 12, '#fff', 1, '#000');
        // the MOM meter
        F.draw(g, 'MOM', 30, 22, P.rage >= 100 && (K.frame & 8) ? '#ff8ad0' : '#c8a0c0', 1, '#000'); rect(g, 49, 23, 52, 6, '#000'); rect(g, 50, 24, 50 * P.rage / 100, 4, P.rage >= 100 ? ((K.frame & 8) ? '#ff4ab0' : '#ffffff') : '#c04a9a');
        if (P.wpn) F.draw(g, (P.wpn === 'bat' ? 'BAT ' : 'PIPE ') + P.wpnN, 106, 22, '#9ad0ff', 1, '#000');
        F.center(g, String(score).padStart(6, '0'), W / 2 + 10, 4, '#fff', 1, '#000');
        if (foe && foeT > 0 && !foe.dead) { face(foe.spr, W - 26, 4, true); F.draw(g, foe.name, W - 30 - F.width(foe.name), 4, foe.E.boss ? '#ff6a6a' : '#ff9a9a', 1, '#000'); bar(W - 120, 13, 90, Math.max(0, foe.hp), foe.max, foe.E.boss ? '#ff2a5a' : '#ff6a3a'); }
        if (P.hits >= 2) { const s = P.hits + ' HITS'; F.draw(g, s, W - 10 - F.width(s, 2), 40, (K.frame & 4) ? '#ffd84a' : '#ff8a2a', 2, '#000'); }
        if (go > 0 && (K.frame & 16)) { F.draw(g, 'GO', W - 54, 80, '#ffd84a', 3, '#000'); poly(g, [W - 12, 90, W - 22, 80, W - 22, 100], '#ffd84a'); }
        if (msgT > 0) { rect(g, 0, 92, W, 30, 'rgba(0,0,0,.6)'); F.center(g, msg, W / 2, 97, '#ffd84a', 2, '#000'); F.center(g, ST.name, W / 2, 113, '#fff', 1, '#000'); }
        if (bossIntro && bossIntro.t < 2.6) { const k = Math.min(1, bossIntro.t * 3), y = 60; rect(g, 0, y, W * k, 34, 'rgba(60,0,20,.8)'); rect(g, 0, y, W * k, 2, '#ff4a6a'); rect(g, 0, y + 32, W * k, 2, '#ff4a6a'); if (k >= 1) { face(bossIntro.e.spr, 20, y + 7, true); F.draw(g, bossIntro.e.name, 50, y + 6, '#ffd84a', 2, '#000'); F.draw(g, BOSSLINE[bossIntro.e.kind] || '', 50, y + 23, '#fff', 1, '#000'); } }
        if (clearT > 0) {
          rect(g, 0, 64, W, 84, 'rgba(0,0,30,.78)'); F.center(g, 'STAGE CLEAR!', W / 2, 72, '#ffd84a', 2, '#000');
          F.center(g, 'TIME BONUS ' + tb(), W / 2, 98, '#fff', 1, '#000'); F.center(g, 'BEST COMBO ' + maxCombo, W / 2, 110, '#fff', 1, '#000'); F.center(g, 'SCORE ' + score, W / 2, 126, '#ffd84a', 1, '#000');
        }
        if (attract && (K.frame >> 5) % 2) { rect(g, W / 2 - 50, 186, 100, 18, 'rgba(0,0,0,.6)'); F.center(g, 'DEMO - PRESS START', W / 2, 191, '#fff', 1, '#000'); }
        if (paused) {
          rect(g, 0, 0, W, H, 'rgba(0,0,30,.55)'); rect(g, 100, 64, 120, 92, '#100828'); rect(g, 100, 64, 120, 2, '#ff4a8a'); rect(g, 100, 154, 120, 2, '#ff4a8a');
          F.center(g, 'PAUSED', W / 2, 72, '#ffd84a', 2, '#000');
          ['RESUME', 'RESTART STAGE', 'QUIT TO TITLE'].forEach((s, i) => F.center(g, (i === pauseI ? '> ' : '  ') + s + (i === pauseI ? ' <' : '  '), W / 2, 98 + i * 16, i === pauseI ? '#fff' : '#8a8aa8', 1, '#000'));
        }
      }
      const tb = () => Math.max(0, Math.round((3000 - stageT * 12) / 100) * 100);
      // Mom's hatchback, honking across the screen
      function drawCar() { if (!momCar) return; const im = art('car'), x = Math.round(momCar.x - cam), y = BOTY + 12; g.drawImage(im, x, y - im.height); if (momCar.t < 1.6) bubble('OI! HOME, THE LOT OF YOU!', clamp(x + 60, 80, W - 80), y - im.height - 8); }

      // ================================================================ title, menus, select, cards, continue, ending
      let titleBG = null;
      let logoC = null;
      function drawLogo(y) {
        if (!logoC) { logoC = canvas(W, 90); const g0 = g; g = logoC.getContext('2d'); try { drawLogoRaw(42); } finally { g = g0; } crisp(logoC, '#1a0010', true); }
        g.drawImage(logoC, 0, y - 42);
      }
      function drawLogoRaw(y) {
        g.save(); g.font = 'italic 900 36px Arial Black,Arial,sans-serif'; g.textAlign = 'center';
        for (const [t, yy] of [['PAVEMENTS', y], ['OF PERIL', y + 38]]) {
          g.fillStyle = '#1a0010'; g.fillText(t, W / 2 + 3, yy + 4);
          g.lineWidth = 5; g.strokeStyle = '#1a0010'; g.strokeText(t, W / 2, yy);
          const gr = g.createLinearGradient(0, yy - 30, 0, yy); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(0.45, '#ff8a2a'); gr.addColorStop(0.55, '#e0204a'); gr.addColorStop(1, '#8a0a5a'); g.fillStyle = gr; g.fillText(t, W / 2, yy);
        }
        g.restore();
      }
      function drawTitleBack() {
        if (!titleBG) titleBG = buildStage(0);
        const c = (T * 18) % (titleBG.ST.len - W);
        g.drawImage(titleBG.far, Math.round(c * 0.2), 0, W, 150, 0, 0, W, 150); g.drawImage(titleBG.mid, Math.round(c * 0.5), 0, W, 150, 0, 0, W, 150); g.drawImage(titleBG.near, Math.round(c), 0, W, 150, 0, 0, W, 150);
        rect(g, 0, 150, W, 74, '#4e4858'); rect(g, 0, 150, W, 2, '#82808c');
        rect(g, 0, 0, W, H, 'rgba(10,0,30,.5)');
      }
      function drawTitle() {
        drawTitleBack(); drawLogo(56);
        const k = sprites('kev'), s = sprites('shaz');
        g.drawImage(k.idle, 26, 222 - k.idle.height); g.save(); g.translate(W - 26, 0); g.scale(-1, 1); g.drawImage(s.idle, 0 - s.idle.width / 2 - 20, 222 - s.idle.height); g.restore();
        if ((T * 2 | 0) % 2 === 0) F.center(g, 'PRESS START', W / 2, 132, '#fff', 2, '#000');
        F.center(g, 'TOP SCORE ' + Math.max(SAVE.hi[0] ? SAVE.hi[0].s : 0, K.best), W / 2, 158, '#ffd84a', 1, '#000');
        F.center(g, '(C) 1999 SEGUE   LICENSED BY SEGUE ENTERPRISES', W / 2, 210, '#ccc', 1, '#000');
      }
      function drawHiscores() {
        drawTitleBack();
        F.center(g, 'TOUGHEST ON THE STREET', W / 2, 30, '#ffd84a', 2, '#000');
        SAVE.hi.forEach((e, i) => { const y = 64 + i * 22; F.draw(g, `${i + 1}.`, 60, y, '#ff8a2a', 2, '#000'); F.draw(g, e.n, 90, y, '#fff', 2, '#000'); F.draw(g, String(e.s).padStart(6, ' '), 178, y, '#fff', 2, '#000'); F.draw(g, e.h || '', 258, y + 4, '#aaa', 1, '#000'); });
        F.center(g, 'PRESS START', W / 2, 190, '#fff', 1, '#000');
      }
      const MENU = () => ['START GAME', 'PASSWORD', 'OPTIONS', 'HOW TO PLAY'];
      let stageStart = null, pwIn = null, cheat = null;
      function drawMenu() {
        drawTitleBack(); drawLogo(50);
        const items = MENU();
        rect(g, 70, 104, 180, items.length * 18 + 14, 'rgba(10,0,30,.8)'); rect(g, 70, 104, 180, 2, '#ff4a8a');
        items.forEach((s, i) => F.center(g, (i === menuI ? '> ' : '') + s + (i === menuI ? ' <' : ''), W / 2, 114 + i * 18, i === menuI ? '#ffd84a' : '#aaa', 1, '#000'));
        F.center(g, `DIFFICULTY ${D().n}   LIVES ${SAVE.opt.lives}`, W / 2, 200, '#ccc', 1, '#000');
      }
      function drawOptions() {
        drawTitleBack(); F.center(g, 'OPTIONS', W / 2, 30, '#ffd84a', 2, '#000');
        const rows = [['DIFFICULTY', D().n], ['LIVES', String(SAVE.opt.lives)], ['MUSIC', SAVE.opt.music ? 'ON' : 'OFF'], ['BACK', '']];
        rows.forEach(([a, b], i) => { const y = 70 + i * 24, on = i === optI; if (on) rect(g, 50, y - 5, 220, 18, 'rgba(255,74,138,.35)'); F.draw(g, a, 64, y, on ? '#fff' : '#aaa', 1, '#000'); if (b) F.draw(g, '← ' + b + ' →', 180, y, on ? '#ffd84a' : '#aaa', 1, '#000'); });
        F.center(g, `GAMES WON: ${SAVE.wins}`, W / 2, 180, '#ccc', 1, '#000'); F.center(g, SAVE.un.nan ? 'NAN IS READY FOR A SCRAP.' : 'FINISH THE GAME FOR A SURPRISE...', W / 2, 194, '#ccc', 1, '#000');
      }
      const HOW = [
        ['THE BASICS', ['WALK WITH THE ARROWS.', 'TAP A DIRECTION TWICE TO RUN.', '', 'Z  PUNCH - KEEP PRESSING FOR A COMBO', 'X  JUMP - THEN Z FOR A FLYING KICK', 'C  SPECIAL SPIN (HURTS YOU A BIT', '   BUT ONLY IF IT HITS SOMEBODY)', 'Z WHILE RUNNING: SHOULDER BARGE']],
        ['GRABS AND THROWS', ['WALK INTO A THUG TO GRAB THEM.', '', 'Z  KNEE THEM (THREE TIMES!)', 'X  THROW THEM - INTO THEIR MATES!', 'HOLD BACK + X: THROW BEHIND YOU', '', 'BOUNCERS BLOCK PUNCHES: GRAB', 'THEM, KICK THEM OR GO ROUND THE BACK']],
        ['GOODIES', ['SMASH BINS, CRATES AND PHONE BOXES.', '', 'FISH & CHIPS, ROLLS, ROASTS: HEALTH', 'POCKET MONEY AND TAPES: POINTS', 'PIPES AND BATS: HIT HARDER', 'THE GREEN 1UP: AN EXTRA LIFE', '', 'FILL THE MOM METER, THEN PRESS C!']],
      ];
      function drawHow() {
        drawTitleBack(); const [t, lines] = HOW[howI];
        rect(g, 14, 18, W - 28, 190, 'rgba(10,0,30,.85)'); rect(g, 14, 18, W - 28, 2, '#ff4a8a');
        F.center(g, t, W / 2, 28, '#ffd84a', 2, '#000'); lines.forEach((l, i) => F.draw(g, l, 30, 58 + i * 15, '#fff', 1, '#000'));
        F.center(g, `${howI + 1}/${HOW.length}   ← →   B: BACK`, W / 2, 194, '#aaa', 1, '#000');
      }
      const HLIST = () => ['kev', 'shaz', 'nan'];
      function drawSelect() {
        drawTitleBack();
        F.center(g, 'CHOOSE YOUR FIGHTER', W / 2, 10, '#ffd84a', 2, '#000');
        HLIST().forEach((id, i) => {
          const x = 56 + i * 104, on = sel === i, Hh = HEROES[id], locked = id === 'nan' && !SAVE.un.nan;
          rect(g, x - 48, 30, 96, 160, on ? '#c0105a' : '#2a1a3a'); rect(g, x - 46, 32, 92, 156, on ? '#3a0a2a' : '#1a1028');
          if (locked) { F.center(g, '?', x, 90, '#5a4a6a', 4, '#000'); F.center(g, '???', x, 150, '#888', 2, '#000'); F.center(g, 'FINISH THE', x, 170, '#aaa', 1, '#000'); F.center(g, 'GAME FIRST', x, 179, '#aaa', 1, '#000'); return; }
          const sp = sprites(Hh.look), im = on && (T * 3 | 0) % 2 ? sp[Hh.finPose] : sp.idle;
          g.drawImage(im, x - im.width / 2, 142 - im.height + 4);
          F.center(g, Hh.n, x, 148, on ? '#ffd84a' : '#aaa', 2, '#000');
          Hh.desc.forEach((d, j) => F.center(g, d, x, 168 + j * 9, '#fff', 1, '#000'));
        });
        F.center(g, '← → THEN START', W / 2, 206, '#fff', 1, '#000');
      }
      function drawCard() { // the stage intro card
        rect(g, 0, 0, W, H, '#000');
        const k = Math.min(1, cardT * 3), ST2 = STAGES[stageN];
        g.save(); g.globalAlpha = 0.35; g.drawImage(BG.near, 200, 0, W, 150, 0, 40, W, 150); g.restore();
        dgrad(g, 0, 82, Math.max(1, Math.round(W * k)), 54, [[0, '#5a0a2a'], [0.5, '#c01a4a'], [1, '#5a0a2a']]);
        if (k >= 1) {
          F.center(g, 'STAGE ' + (stageN + 1), W / 2, 90, '#ffd84a', 2, '#000');
          F.center(g, ST2.name, W / 2, 110, '#fff', 2, '#000');
          F.center(g, ST2.time, W / 2, 150, '#aaa', 1, '#000');
          if (!cheat) { F.center(g, 'PASSWORD', W / 2, 176, '#888', 1, '#000'); F.center(g, pwOf(stageN, hero, lives, credits), W / 2, 188, '#ffd84a', 2, '#000'); }
        }
      }
      const PWL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      function drawPassword() {
        drawTitleBack(); F.center(g, 'ENTER PASSWORD', W / 2, 40, '#ffd84a', 2, '#000');
        for (let i = 0; i < 4; i++) { const x = W / 2 - 54 + i * 28, on = i === pwIn.i; rect(g, x, 80, 24, 30, on ? '#c0105a' : '#2a1a3a'); rect(g, x, 108, 24, 2, '#000'); F.draw(g, PWL[pwIn.l[i]], x + 6, 87, '#fff', 2, '#000'); if (on) { F.center(g, '↑', x + 12, 70, '#aaa', 1, '#000'); F.center(g, '↓', x + 12, 114, '#aaa', 1, '#000'); } }
        if (pwIn.bad > 0) F.center(g, 'WRONG PASSWORD!', W / 2, 136, '#ff4a4a', 1, '#000');
        F.center(g, '↑↓ LETTER  ← → MOVE  START: GO  B: BACK', W / 2, 180, '#ccc', 1, '#000');
        F.center(g, 'THE PASSWORD IS ON EACH STAGE CARD.', W / 2, 196, '#888', 1, '#000');
      }
      function drawCheat() {
        drawTitleBack(); rect(g, 40, 30, 240, 150, 'rgba(10,0,30,.85)'); rect(g, 40, 30, 240, 2, '#3aff8a');
        F.center(g, '- CHEAT MODE -', W / 2, 40, '#3aff8a', 2, '#000');
        const rows = [['STAGE', String(cheat.stage + 1)], ['LIVES', String(cheat.lives)], ['START!', '']];
        rows.forEach(([a, b], i) => { const y = 80 + i * 24, on = i === cheat.i; F.draw(g, (on ? '> ' : '  ') + a, 80, y, on ? '#fff' : '#8a8aa8', 1, '#000'); if (b) F.draw(g, '← ' + b + ' →', 180, y, on ? '#ffd84a' : '#8a8aa8', 1, '#000'); });
        F.center(g, 'NO PASSWORDS IN CHEAT MODE!', W / 2, 160, '#888', 1, '#000');
      }
      function drawContinue() {
        drawStage(); rect(g, 0, 0, W, H, 'rgba(0,0,20,.75)');
        F.center(g, 'CONTINUE?', W / 2, 50, '#ffd84a', 3, '#000');
        F.center(g, String(Math.max(0, 9 - Math.floor(contT))), W / 2, 90, '#fff', 4, '#000');
        const im = P.spr.hurt2; g.drawImage(im, W / 2 - im.width / 2, 200 - im.height);
        F.center(g, `PRESS START  (CREDITS ${credits})`, W / 2, 206, '#fff', 1, '#000');
        F.draw(g, 'PASSWORD ' + pwOf(stageN, hero, SAVE.opt.lives - 1, 0), 8, 120, '#aaa', 1, '#000');
      }
      function drawEnding() {
        drawStage(); rect(g, 0, 0, W, H, 'rgba(40,10,30,' + Math.min(0.55, endT * 0.2) + ')');
        const im = P.spr.win; g.drawImage(im, W / 2 - im.width / 2, 196 - im.height);
        const L = ['MR GRIMLY SAYS SORRY.', 'HE SAYS IT WAS ALL A BIG MISUNDERSTANDING.', 'THE STREETS ARE SORTED.', 'EVERYBODY GOES FOR CHIPS.', '', 'THE END'];
        L.forEach((l, i) => { if (endT > 1 + i * 1.2) F.center(g, l, W / 2, 40 + i * 14, i === L.length - 1 ? '#ffd84a' : '#fff', i === L.length - 1 ? 2 : 1, '#000'); });
        if (endT > 9 && endNew) F.center(g, 'NAN WANTS A GO NEXT TIME!', W / 2, 128, '#ff8ad0', 1, '#000');
      }
      const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ .!';
      function drawEntry() {
        drawTitleBack(); F.center(g, 'NEW HIGH SCORE!', W / 2, 30, '#ffd84a', 2, '#000'); F.center(g, String(score), W / 2, 56, '#fff', 2, '#000');
        F.center(g, 'ENTER YOUR NAME', W / 2, 84, '#aaa', 1, '#000');
        for (let i = 0; i < 6; i++) { const x = W / 2 - 66 + i * 22, on = i === entry.i; rect(g, x, 100, 18, 24, on ? '#c0105a' : '#2a1a3a'); F.draw(g, ABC[entry.name[i]], x + 3, 105, '#fff', 2, '#000'); }
        F.center(g, '↑ ↓ LETTER   ← → MOVE   START: DONE', W / 2, 150, '#ccc', 1, '#000');
      }
      // ================================================================ the attract demo: the computer has a go
      function startAttract() {
        attract = { t: 0 }; hero = Math.random() < 0.5 ? 'kev' : 'shaz'; score = 0; lives = 0; credits = 0; P = null; ents = []; maxCombo = 0;
        loadStage(0); mode = 'play'; music(null);
      }
      function endAttract() { attract = null; P = null; ents = []; mode = 'hiscores'; idleT = 0; music(SONGS.title); }
      function botThink() {
        BOT.p = {}; const p = P; let tgt = null, best = 1e9;
        for (const e of ents) if (e.type === 'foe' && e.st !== 'flee' && e.st !== 'down' && !e.dead) { const d = Math.abs(e.x - p.x) + Math.abs(e.y - p.y) * 2; if (d < best) { best = d; tgt = e; } }
        if (!tgt) for (const e of ents) if (e.type === 'prop' && !e.dead && e.x > p.x - 20 && e.x < cam + W) { tgt = e; break; }
        BOT.h = {};
        if (!tgt) { BOT.h.right = true; return; }
        const dx = tgt.x - p.x, dy = tgt.y - p.y;
        if (Math.abs(dy) > 4) BOT.h[dy > 0 ? 'down' : 'up'] = true;
        if (Math.abs(dx) > 26) BOT.h[dx > 0 ? 'right' : 'left'] = true;
        else if (Math.abs(dy) <= 6) { if ((dx > 0 ? 1 : -1) !== p.face) BOT.h[dx > 0 ? 'right' : 'left'] = true; else if (K.frame % 9 === 0) BOT.p.a = true; }
        if (K.frame % 200 === 0) BOT.p.b = true;
      }

      // ================================================================ starting and finishing a run
      function startRun(fromSave) {
        attract = null; maxCombo = 0; reported = false; endNew = false; runWon = false;
        if (fromSave) { hero = fromSave.hero in HEROES ? fromSave.hero : 'kev'; score = fromSave.score | 0; lives = fromSave.lives | 0; credits = fromSave.credits | 0; }
        else { score = 0; lives = SAVE.opt.lives - 1; credits = 2; }
        P = null; ents = [];
        stageN = fromSave ? clamp(fromSave.stage | 0, 0, STAGES.length - 1) : 0;
        loadStage(stageN); mode = 'card'; cardT = 0; music(null); sfx.seq([[60, 0.5], [67, 0.5], [72, 1]], { bpm: 200, vol: 0.08 });
      }
      let endNew = false, runWon = false;
      function finishRun(won) {
        mode = won ? 'ending' : 'over'; T = 0; endT = 0; runWon = won;
        SAVE.prog = null;
        if (won) { SAVE.wins++; if (!SAVE.un.nan) { SAVE.un.nan = 1; endNew = true; } K.secret('rm.rage.nan'); music(SONGS.end); }
        persist();
      }
      function afterRun() {
        if (score > 0 && (SAVE.hi.length < 5 || score > SAVE.hi[SAVE.hi.length - 1].s)) { entry = { name: [0, 26, 26, 26, 26, 26], i: 0 }; mode = 'entry'; music(SONGS.title); return; }
        report();
      }
      function report() {
        if (reported) return; reported = true; mode = 'done';
        const sc = Math.min(score, 99999, Math.floor(300 * (K.t + 4))); // (never faster than JackNet believes)
        const won = runWon;
        K.over(sc, won ? { title: 'YOU WIN!', text: `${P ? P.h.n : 'You'} cleaned up the whole town. Mr Grimly went home.` } : { title: 'GAME OVER', text: `You got to stage ${stageN + 1}: ${ST ? ST.name : ''}.` });
      }

      window.__rageDbg = () => ({ mode, stage: stageN, wave: waveI, waveOn, x: P && P.x | 0, hp: P && P.hp, st: P && P.st, lives, credits, score, rage: P && P.rage, wpn: P && P.wpn, y: P && P.y | 0, cam: cam | 0, foes: ents.filter(e => e.type === 'foe').map(e => e.kind + ':' + e.st + ':' + e.hp), un: SAVE.un, prog: SAVE.prog, hi: SAVE.hi,
        cheat: { stage: n => { loadStage(n); mode = 'play'; music(SONGS[STAGES[n].song]); }, boss: () => { const b = ST.waves.length - 1; waveI = b; P.x = ST.waves[b].at - 30; cam = Math.max(0, P.x - 130); }, hp: v => { P.hp = v; }, kill: () => { for (const e of ents) if (e.type === 'foe') { e.hp = 0; e.st = 'down'; e.t = 2; } }, rage: () => { P.rage = 100; }, lives: n => { lives = n; }, win: () => { stageN = STAGES.length - 1; ST = STAGES[stageN]; clearT = 4.9; }, score: s => { score = s; }, die: () => { P.hp = 0; P.st = 'down'; P.t = 0; }, pw: () => pwOf(stageN, hero, lives, credits), read: w => pwRead(w) } });
      music(SONGS.title);
      // ================================================================ the game
      return {
        update(dt) {
          T += dt;
          const ok = K.pressed('start') || K.pressed('a'), back = K.pressed('b'), up = K.pressed('up'), dn = K.pressed('down'), lf = K.pressed('left'), rt = K.pressed('right');
          if (flashT > 0) flashT -= dt;
          if (mode === 'title' || mode === 'hiscores') {
            idleT += dt;
            if (mode === 'title' && idleT > 10) { startAttract(); return; }
            if (mode === 'hiscores' && idleT > 7) { mode = 'title'; idleT = 0; }
            if (K.pressed('start') && K.held('b') && mode === 'title') { cheat = { stage: 0, lives: 9, i: 0 }; mode = 'cheat'; sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 0.5]], { bpm: 400, vol: 0.08 }); return; }
            if (ok && T > 0.3) { mode = 'menu'; menuI = 0; S.ok(); idleT = 0; cheat = null; }
            else if (up || dn || lf || rt || back) idleT = 0;
            return;
          }
          if (mode === 'menu') {
            const items = MENU();
            if (up) { menuI = (menuI + items.length - 1) % items.length; S.menu(); } if (dn) { menuI = (menuI + 1) % items.length; S.menu(); }
            if (back) { mode = 'title'; idleT = 0; return; }
            if (ok) { const it = items[menuI]; S.ok(); if (it === 'PASSWORD') { mode = 'password'; pwIn = { l: [0, 0, 0, 0], i: 0, bad: 0 }; } else if (it === 'START GAME') { mode = 'select'; sel = 0; } else if (it === 'OPTIONS') { mode = 'options'; optI = 0; } else { mode = 'how'; howI = 0; } }
            return;
          }
          if (mode === 'options') {
            if (up) { optI = (optI + 3) % 4; S.menu(); } if (dn) { optI = (optI + 1) % 4; S.menu(); }
            const d = lf ? -1 : rt || (ok && optI < 3) ? 1 : 0;
            if (d && optI === 0) { SAVE.opt.diff = (SAVE.opt.diff + 3 + d) % 3; S.menu(); persist(); }
            if (d && optI === 1) { SAVE.opt.lives = clamp(SAVE.opt.lives + d, 2, 5); S.menu(); persist(); }
            if (d && optI === 2) { SAVE.opt.music = SAVE.opt.music ? 0 : 1; S.menu(); persist(); music(SONGS.title); }
            if ((ok && optI === 3) || back) { mode = 'menu'; S.ok(); }
            return;
          }
          if (mode === 'how') { if (rt || ok) { howI++; S.menu(); if (howI >= HOW.length) mode = 'menu'; } if (lf) howI = Math.max(0, howI - 1); if (back) mode = 'menu'; return; }
          if (mode === 'password') {
            const P2 = pwIn; if (P2.bad > 0) P2.bad -= dt;
            if (up) { P2.l[P2.i] = (P2.l[P2.i] + 1) % 26; S.menu(); } if (dn) { P2.l[P2.i] = (P2.l[P2.i] + 25) % 26; S.menu(); }
            if (lf) P2.i = Math.max(0, P2.i - 1); if (rt || K.pressed('a')) P2.i = Math.min(3, P2.i + 1);
            if (back) { mode = 'menu'; return; }
            if (K.pressed('start')) {
              const w = P2.l.map(i => PWL[i]).join('');
              const pr = w === 'NANA' ? { stage: 0, hero: 'nan', lives: SAVE.opt.lives - 1, credits: 2, score: 0 } : pwRead(w); // (Nan fancies a go: the secret password)
              if (!pr) { P2.bad = 1.5; sfx.tone(110, 0.3, 'square', 0.1); return; }
              hero = pr.hero; S.ok(); startRun(pr);
            }
            return;
          }
          if (mode === 'cheat') {
            if (up) { cheat.i = (cheat.i + 2) % 3; S.menu(); } if (dn) { cheat.i = (cheat.i + 1) % 3; S.menu(); }
            const d = lf ? -1 : rt ? 1 : 0;
            if (d && cheat.i === 0) { cheat.stage = (cheat.stage + 5 + d) % 5; S.menu(); }
            if (d && cheat.i === 1) { cheat.lives = clamp(cheat.lives + d, 1, 9); S.menu(); }
            if (back) { cheat = null; mode = 'title'; idleT = 0; return; }
            if (ok && cheat.i === 2) { mode = 'select'; sel = 0; S.ok(); }
            return;
          }
          if (mode === 'select') {
            const n = SAVE.un.nan ? 3 : 2;
            if (lf || rt) { sel = (sel + (lf ? n - 1 : 1)) % n; S.menu(); }
            if (back) { mode = 'menu'; return; }
            if (ok) { hero = HLIST()[sel]; S.ok(); startRun(cheat ? { stage: cheat.stage, hero, lives: cheat.lives - 1, credits: 2, score: 0 } : null); }
            return;
          }
          if (mode === 'card') { cardT += dt; if (cardT > 2.6 || (cardT > 0.8 && ok)) { mode = 'play'; music(SONGS[ST.song]); msg = 'STAGE ' + (stageN + 1); msgT = 2; } return; }
          if (mode === 'continue') {
            contT += dt + (back ? 1 : 0); // (B hurries the countdown along)
            if (ok && contT > 0.3) { credits--; lives = SAVE.opt.lives - 1; mode = 'play'; respawn(); music(SONGS[ST.song]); return; }
            if (contT >= 10) { gameOver(); }
            return;
          }
          if (mode === 'ending') { endT += dt; if (endT > 11 && (ok || endT > 16)) afterRun(); return; }
          if (mode === 'over') { if (T > 2.6) afterRun(); return; }
          if (mode === 'entry') {
            const e = entry;
            if (up) { e.name[e.i] = (e.name[e.i] + 1) % ABC.length; S.menu(); } if (dn) { e.name[e.i] = (e.name[e.i] + ABC.length - 1) % ABC.length; S.menu(); }
            if (lf || back) e.i = Math.max(0, e.i - 1); if (rt) e.i = Math.min(5, e.i + 1);
            if (K.pressed('a')) { if (e.i < 5) { e.i++; if (e.name[e.i] === 26) e.name[e.i] = 0; } else e.done = true; S.menu(); }
            if (K.pressed('start') || e.done) { const n = e.name.map(i => ABC[i]).join('').trim() || 'PLAYER'; SAVE.hi.push({ n, s: score, h: HEROES[hero].n }); SAVE.hi.sort((a, b) => b.s - a.s); SAVE.hi.length = Math.min(5, SAVE.hi.length); persist(); S.ok(); report(); }
            return;
          }
          if (mode !== 'play') return;
          // ---------------------------------------------------------------- playing (or the demo)
          if (attract) { attract.t += dt; if (K.pressed('start') || K.pressed('a') || attract.t > 28) { endAttract(); if (attract === null && (K.pressed('start') || K.pressed('a'))) { mode = 'title'; idleT = 0; } return; } botThink(); }
          if (!attract && K.pressed('start')) { paused = !paused; pauseI = 0; S.menu(); if (paused) K.music(null); else music(waveOn && ST.waves[waveI] && ST.waves[waveI].boss ? SONGS.boss : SONGS[ST.song]); return; }
          if (paused) {
            if (up) { pauseI = (pauseI + 2) % 3; S.menu(); } if (dn) { pauseI = (pauseI + 1) % 3; S.menu(); }
            if (K.pressed('a')) {
              paused = false;
              if (pauseI === 0) music(waveOn && ST.waves[waveI] && ST.waves[waveI].boss ? SONGS.boss : SONGS[ST.song]);
              else if (pauseI === 1) { const sv2 = stageStart || { stage: stageN, hero, score, lives, credits }; P = null; ents = []; startRun(sv2); }
              else { P = null; ents = []; mode = 'title'; T = 0; idleT = 0; music(SONGS.title); }
            }
            return;
          }
          if (freeze > 0) { freeze--; return; } // hit-stop: every punch lands
          stageT += dt; if (msgT > 0) msgT -= dt; if (go > 0) go -= dt; if (foeT > 0 && foeT < 90) foeT -= dt; if (shake > 0) shake -= 0.25;
          if (bossIntro) { bossIntro.t += dt; if (bossIntro.t > 3) bossIntro = null; }
          if (clearT > 0) {
            clearT += dt; P.st = 'win';
            if (clearT > 3.2 && !paid) { paid = true; score = Math.min(99999, score + tb()); }
            if (clearT > 5) {
              paid = false; clearT = 0; P.st = 'idle';
              if (attract) { endAttract(); return; }
              if (stageN < STAGES.length - 1) { loadStage(stageN + 1); mode = 'card'; cardT = 0; music(null); }
              else { score = Math.min(99999, score + Math.max(0, lives) * 2000); finishRun(true); }
            }
            return;
          }
          playerStep(dt);
          if (mode !== 'play') return;
          attackers = ents.filter(e => e.type === 'foe' && (e.st === 'wind' || e.st === 'punch')).length;
          for (const e of ents) if (e.type === 'foe' && !e.dead) { foeStep(e, dt); if (e.sayT > 0) e.sayT -= dt; }
          for (const b of ents) if (b.type === 'proj' && !b.dead) {
            b.t += dt; b.x += b.vx; if (!b.roll) { b.z -= 0.15; if (b.z < 0) b.dead = true; }
            if (lane(b, P, 12) && Math.abs(b.x - P.x) < 14 && P.z < 18 && P.inv <= 0 && P.st !== 'down' && P.st !== 'special' && !momCar) { hurt(P, b.dmg, b.roll ? 'heavy' : 'light', b); b.dead = true; S.smash(); }
            if (b.x < cam - 40 || b.x > cam + W + 40) b.dead = true;
          }
          if (momCar) {
            momCar.t += dt; momCar.x += 4;
            for (const e of ents) if (e.type === 'foe' && !e.dead && e.st !== 'flee' && !momCar.hit.has(e) && e.x < momCar.x + 80) { momCar.hit.add(e); e.st = 'hurt'; hurt(e, e.E.boss ? Math.round(e.max * 0.15) : 30, 'heavy', { x: e.x - 10, face: 1, type: 'car' }); }
            if (K.frame % 20 === 0) shake = 2;
            if (momCar.x > cam + W + 40) momCar = null;
          }
          for (const it of ents) if (it.type === 'item') it.t += dt;
          if (!ents.includes(P)) ents.push(P);
          ents = ents.filter(e => !e.dead || e === P);
          waves();
          for (const f of fx) f.t += dt; fx = fx.filter(f => f.t < (f.k === 'txt' ? 1 : f.k === 'bit' ? 0.7 : 0.18));
        },
        draw() {
          if (mode === 'title') return drawTitle();
          if (mode === 'hiscores') return drawHiscores();
          if (mode === 'menu') return drawMenu();
          if (mode === 'options') return drawOptions();
          if (mode === 'how') return drawHow();
          if (mode === 'password') return drawPassword();
          if (mode === 'cheat') return drawCheat();
          if (mode === 'select') return drawSelect();
          if (mode === 'card') return drawCard();
          if (mode === 'entry') return drawEntry();
          if (mode === 'continue') return drawContinue();
          if (mode === 'ending') return drawEnding();
          if (!P || !ST) { rect(g, 0, 0, W, H, '#000'); return; }
          const sx = shake > 0 ? Math.round((Math.random() - 0.5) * shake * 2) : 0;
          g.save(); g.translate(sx, 0);
          drawStage();
          const order = ents.slice().sort((a, b) => a.y - b.y || (a === P ? 1 : -1));
          for (const e of order) drawEnt(e);
          drawCar();
          drawFx();
          g.restore();
          if (flashT > 0) rect(g, 0, 0, W, H, 'rgba(255,255,255,.7)');
          hud();
          if (mode === 'over' || mode === 'done') { rect(g, 0, 0, W, H, 'rgba(0,0,0,.6)'); F.center(g, runWon ? 'THE END' : 'GAME OVER', W / 2, 80, runWon ? '#ffd84a' : '#ff4a4a', 3, '#000'); F.center(g, 'SCORE ' + score, W / 2, 120, '#fff', 2, '#000'); if (!runWon && !cheat) { F.center(g, 'PASSWORD FOR STAGE ' + (stageN + 1), W / 2, 150, '#aaa', 1, '#000'); F.center(g, pwOf(stageN, hero, SAVE.opt.lives - 1, 2), W / 2, 162, '#ffd84a', 2, '#000'); } }
        },
        end() { K.music(null); },
      };
    },
  });
})();

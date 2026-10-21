/* TEENY MOTORS (Mega Drive, in Jack's room: it's Callum's cartridge): a top-down racer of tiny toy cars on household
 * tracks. Six tracks: the breakfast table (spilt milk, and a short cut through the cereal bowl if you are brave with the
 * spoons), two school desks joined by rulers, the garden pond and the bath (boats!), a pool table with pockets to fall
 * in, and the sandpit. Modes: THE TEENY CUP (six races against Dave, Luke and Cal: finish in the top two to go
 * through, three tries), HEAD TO HEAD (the camera follows the leader: leave your rival off the screen to win a light,
 * get all eight) and TIME TRIAL. Best laps and the cup's hall of fame live on the cartridge (K.save).
 * Steer: left/right. Go: Z (A) or Up. Brake/reverse: X (B) or Down. Pause: Enter.
 * Everything here (cars, tracks, tunes) is drawn and written from scratch. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const W = 320, H = 224, SP = 4; // SP: track sample spacing in pixels
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const q9 = v => v <= 0 ? 0 : Math.min(252, Math.round(v / 36) * 36); // 3 bits a channel: the Mega Drive's 512 colours
  const wrapA = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const TAU = Math.PI * 2;
  const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };
  function hexRGB(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  // crisp a sprite: hard alpha, 9-bit colour, a dark outline
  function crisp(c, outline, dither) {
    const w = c.width, h = c.height, g = c.getContext('2d');
    const im = g.getImageData(0, 0, w, h), d = im.data, a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const o = i * 4; if (d[o + 3] > 100) {
        const b = dither ? (B4[((i / w | 0) & 3) * 4 + (i % w & 3)] / 16 - 0.47) * 30 : 0;
        d[o + 3] = 255; a[i] = 1; d[o] = q9(d[o] + b); d[o + 1] = q9(d[o + 1] + b); d[o + 2] = q9(d[o + 2] + b);
      } else d[o + 3] = 0;
    }
    if (outline) {
      const [r, gg, b] = hexRGB(outline);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (a[i]) continue; if ((x > 0 && a[i - 1]) || (x < w - 1 && a[i + 1]) || (y > 0 && a[i - w]) || (y < h - 1 && a[i + w])) { const o = i * 4; d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; } }
    }
    g.putImageData(im, 0, 0); return c;
  }
  const ell = (g, x, y, rx, ry, col, rot) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); g.fill(); };
  const circ = (g, x, y, r, col) => ell(g, x, y, r, r, col);
  const rect = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const poly = (g, pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  function rrect(g, x, y, w, h, r, col) { g.fillStyle = col; g.beginPath(); r = Math.min(r, w / 2, h / 2); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); }
  // noise
  function hash(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vn(x, y, sc, s) { x /= sc; y /= sc; const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  // paint every pixel of a canvas from fn(x, y, out[3]) (alpha 255), optionally only inside a mask test
  function pix(c, fn, x0, y0, w, h) {
    const g = c.getContext('2d'); x0 = x0 || 0; y0 = y0 || 0; w = w || c.width; h = h || c.height;
    const im = g.getImageData(x0, y0, w, h), d = im.data, o3 = [0, 0, 0];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const r = fn(x + x0, y + y0, o3); if (r === false) continue; const o = (y * w + x) * 4; d[o] = o3[0]; d[o + 1] = o3[1]; d[o + 2] = o3[2]; d[o + 3] = 255; }
    g.putImageData(im, x0, y0); return c;
  }
  // the whole picture through a 4x4 ordered dither down to 9-bit colour (the 16-bit look)
  function dither16(c) {
    const g = c.getContext('2d'), w = c.width, h = c.height, im = g.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4; if (d[o + 3] < 8) { d[o + 3] = 0; continue; }
      const b = (B4[(y & 3) * 4 + (x & 3)] / 16 - 0.47) * 36; d[o] = q9(d[o] + b); d[o + 1] = q9(d[o + 1] + b); d[o + 2] = q9(d[o + 2] + b);
    }
    g.putImageData(im, 0, 0); return c;
  }
  // a little tracker notation for the tunes: "c5 - e5 . g#4" (- holds, . rests)
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const tr = s => s.trim().split(/\s+/).map(t => t === '-' ? -1 : t === '.' ? 0 : (NOTE[t[0]] + (t[1] === '#' ? 1 : 0) + 12 * (+t[t.length - 1] + 1)));

  // ================================================================ materials (what the cars feel under their wheels)
  const FALL = 0, ROAD = 1, ROUGH = 2, BUMP = 3, SOLID = 4, SLIP = 5, RAMP = 6, BOWL = 7, STICKY = 8;
  const MC = id => `rgb(${id * 16},0,0)`;
  //            top speed, accel, grip, rumble
  const SURF = [[1, 1, 1, 0], [1, 1, 1, 0], [0.56, 0.75, 0.85, 1], [0.5, 0.65, 0.8, 2], [1, 1, 1, 0], [0.97, 0.45, 0.1, 0], [1, 1, 1, 0], [0.8, 0.8, 0.45, 0], [0.4, 0.55, 1.2, 0]];

  // ================================================================ the cars (stats 1-5) and the people driving them
  const CARS = [
    { id: 'rocket', name: 'ROCKET', col: '#e8301c', dk: '#901008', lt: '#ff9070', spd: 5, acc: 3, grp: 3, wt: 3, blurb: 'FLAT OUT FAST. A BIT SLIDEY.' },
    { id: 'flash', name: 'FLASH', col: '#2a5ae8', dk: '#102a90', lt: '#80b0ff', spd: 4, acc: 5, grp: 3, wt: 2, blurb: 'A RACING CAR. ZOOMS OFF THE LINE.' },
    { id: 'nipper', name: 'NIPPER', col: '#f8c818', dk: '#a86a00', lt: '#fff090', spd: 3, acc: 4, grp: 5, wt: 2, blurb: 'TINY AND STICKS TO THE TABLE.' },
    { id: 'bruiser', name: 'BRUISER', col: '#30b040', dk: '#106020', lt: '#a0f080', spd: 3, acc: 3, grp: 3, wt: 5, blurb: 'A BIG 4X4. BARGES EVERYONE ABOUT.' },
  ];
  const MATES = ['DAVE', 'LUKE', 'CAL'];
  const MATE_SKILL = { DAVE: 0.93, LUKE: 0.9, CAL: 0.965 };
  function carPhys(ci, boat) {
    const c = CARS[ci];
    const p = { vmax: 2.42 + c.spd * 0.085, acc: 0.03 + c.acc * 0.0075, grip: 0.1 + c.grp * 0.03, turn: 0.056 + c.grp * 0.0035, mass: 0.75 + c.wt * 0.13 };
    if (boat) { p.grip *= 0.42; p.turn *= 0.92; p.acc *= 0.9; }
    return p;
  }

  // ---------------------------------------------------------------- car and boat sprites (top-down, nose to the right; 32 angles)
  function drawVehicle(g, ci, boat) {
    const C = CARS[ci], TY = '#1a1a20', GL = '#203a68', GH = '#7ab0e8';
    const wheel = (x, y, l, w) => { rrect(g, x - l / 2, y - w / 2, l, w, 0.8, TY); rect(g, x - l / 2 + 0.6, y - w / 2 + 0.4, l - 1.2, 0.6, '#5a5a66'); };
    if (boat) {
      // a speedboat: pointy hull, white deck, a windscreen and an outboard motor
      poly(g, [10, 0, 6, -4.4, -7, -4.6, -8.5, -3, -8.5, 3, -7, 4.6, 6, 4.4], C.col);
      poly(g, [10, 0, 6, -2.6, -6.5, -2.8, -6.5, 2.8, 6, 2.6], '#f0f0f0');
      poly(g, [7.6, 0, 4.6, -1.8, -1, -2, -1, 2, 4.6, 1.8], C.col);
      poly(g, [1.4, -3.6, 3.2, -2.2, 3.2, 2.2, 1.4, 3.6, 0.4, 3.6, 0.4, -3.6], GL); rect(g, 1.6, -2.4, 0.8, 2, GH);
      rect(g, -5.6, -2.2, 4, 4.4, C.dk); rect(g, -5, -1.6, 2.8, 3.2, '#f0f0f0');
      rrect(g, -11, -1.6, 3, 3.2, 0.8, '#30303a'); rect(g, -10.6, -1, 1.6, 0.8, '#8a8a96');
      rect(g, -8, -4.6, 14, 0.8, C.lt);
      return;
    }
    if (C.id === 'rocket') { // a red sports car with a white stripe and a spoiler
      wheel(5, -4.3, 4, 2.2); wheel(5, 4.3, 4, 2.2); wheel(-5, -4.4, 4.4, 2.4); wheel(-5, 4.4, 4.4, 2.4);
      poly(g, [-8, -3.8, 3.5, -4.2, 7.6, -2.8, 8.6, 0, 7.6, 2.8, 3.5, 4.2, -8, 3.8], C.col);
      poly(g, [0.4, -3.4, 3.6, -2.9, 3.6, 2.9, 0.4, 3.4], GL); rect(g, 2.2, -2.2, 0.8, 2.6, GH);
      rect(g, -2.8, -3.2, 3.2, 6.4, C.col); poly(g, [-4.4, -3, -2.8, -3.2, -2.8, 3.2, -4.4, 3], GL);
      rect(g, -8, -0.8, 16, 1.6, '#f8f8f8'); rect(g, 0.4, -0.8, 3.2, 1.6, GL);
      rect(g, -9.4, -4.4, 1.8, 8.8, C.dk); rect(g, 6.8, -2.8, 1.2, 1, '#fff6a0'); rect(g, 6.8, 1.8, 1.2, 1, '#fff6a0');
    } else if (C.id === 'flash') { // a blue single-seater: wings, open wheels and a yellow helmet
      wheel(5, -4.6, 3.8, 2.4); wheel(5, 4.6, 3.8, 2.4); wheel(-5.5, -4.8, 4.6, 2.8); wheel(-5.5, 4.8, 4.6, 2.8);
      rect(g, 7.4, -4.6, 2, 9.2, C.dk); rect(g, 7.8, -4.2, 1.2, 8.4, C.col);
      poly(g, [9.6, 0, 7, -1.4, 0, -1.8, -3, -3.4, -7.5, -3, -7.5, 3, -3, 3.4, 0, 1.8, 7, 1.4], C.col);
      rect(g, -9.6, -4.4, 2.4, 8.8, C.dk); rect(g, -9.2, -4, 1.4, 8, C.col);
      circ(g, -1.6, 0, 1.9, '#f8d020'); rect(g, -1, -1, 1.2, 2, '#202838');
      rect(g, 1, -0.5, 6, 1, '#f8f8f8');
    } else if (C.id === 'nipper') { // a round little city car with a white roof
      wheel(4, -4.1, 3, 1.8); wheel(4, 4.1, 3, 1.8); wheel(-4.2, -4.1, 3, 1.8); wheel(-4.2, 4.1, 3, 1.8);
      rrect(g, -6.6, -4.3, 13.4, 8.6, 3.4, C.col);
      rrect(g, -4.6, -3.4, 7.4, 6.8, 2, GL); rect(g, 1.4, -2.2, 0.8, 2.4, GH);
      rrect(g, -3.8, -2.8, 5.6, 5.6, 1.6, '#f4f4f4');
      rect(g, 5.6, -3, 1, 1.2, '#fff6a0'); rect(g, 5.6, 1.8, 1, 1.2, '#fff6a0');
    } else { // a green 4x4: big tyres, roof rack, bull bar and a spare wheel
      wheel(5, -4.7, 4.6, 2.8); wheel(5, 4.7, 4.6, 2.8); wheel(-5, -4.7, 4.6, 2.8); wheel(-5, 4.7, 4.6, 2.8);
      rrect(g, -8, -4.4, 16, 8.8, 1.2, C.col);
      rect(g, 2.4, -3.8, 1.8, 7.6, GL); rect(g, 2.8, -2.6, 0.7, 2.4, GH);
      rect(g, -6, -3.6, 8.2, 7.2, C.dk); for (let i = 0; i < 4; i++) rect(g, -5.6 + i * 2.1, -3.2, 0.7, 6.4, '#9aa0a8');
      circ(g, -8.8, 0, 2.2, TY); circ(g, -8.8, 0, 1, '#6a6a76');
      rect(g, 8, -3.8, 1.4, 7.6, '#9aa0a8'); rect(g, 6.8, -3.6, 1, 1.2, '#fff6a0'); rect(g, 6.8, 2.4, 1, 1.2, '#fff6a0');
    }
  }
  const NANG = 32;
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    SPR = { car: [], boat: [], shadow: { car: [], boat: [] }, big: {} };
    const S = 40, sc = 1.7;
    for (const kind of ['car', 'boat']) {
      for (let ci = 0; ci < CARS.length; ci++) {
        const arr = [];
        for (let k = 0; k < NANG; k++) {
          const c = mkc(S, S), g = c.getContext('2d'), a = k / NANG * TAU;
          g.save(); g.translate(S / 2, S / 2); g.rotate(a); g.scale(sc, sc); drawVehicle(g, ci, kind === 'boat'); g.restore();
          // a fixed light from the top left, whichever way the car points
          g.globalCompositeOperation = 'source-atop';
          const gr = g.createLinearGradient(6, 6, S - 6, S - 6); gr.addColorStop(0, 'rgba(255,255,255,.42)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(0,0,30,0)'); gr.addColorStop(1, 'rgba(0,0,40,.5)');
          g.fillStyle = gr; g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'source-over';
          arr.push(crisp(c, '#100c14', true));
        }
        SPR[kind].push(arr);
      }
      for (let k = 0; k < NANG; k++) {
        const c = mkc(S, S), g = c.getContext('2d');
        g.save(); g.translate(S / 2, S / 2); g.rotate(k / NANG * TAU); g.scale(sc * 1.05, sc * 1.05); drawVehicle(g, 0, kind === 'boat'); g.restore();
        g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
        SPR.shadow[kind].push(crisp(c));
      }
    }
    return SPR;
  }
  // a big car for the car select (drawn on demand, kept)
  function bigCar(ci, k, boat) {
    const key = ci + ':' + k + ':' + (boat ? 1 : 0); if (SPR.big[key]) return SPR.big[key];
    const S = 76, c = mkc(S, S), g = c.getContext('2d');
    g.save(); g.translate(S / 2, S / 2); g.rotate(k / 24 * TAU); g.scale(3, 3); drawVehicle(g, ci, boat); g.restore();
    g.globalCompositeOperation = 'source-atop';
    const gr = g.createLinearGradient(8, 8, S - 8, S - 8); gr.addColorStop(0, 'rgba(255,255,255,.4)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,30,.45)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'source-over';
    return SPR.big[key] = crisp(c, '#100c14', true);
  }

  // ================================================================ the tracks
  // pts: the racing line (a closed curve). rw: road width. bw: the border band. Every prop paints the picture (v) and
  // what it is made of (m) at once.
  const TRACKS = [
    { id: 'bfast', name: 'BREAKFAST BUNDLE', where: 'THE KITCHEN TABLE', theme: 'bfast', ww: 1280, wh: 900, rw: 62, bw: 10, laps: 3, song: 0,
      pts: [[300, 158], [520, 150], [780, 160], [1000, 170], [1110, 240], [1142, 380], [1126, 560], [1066, 700], [960, 776], [850, 760], [772, 690], [742, 580], [740, 500], [722, 418], [672, 368], [600, 350], [528, 368], [478, 418], [460, 500], [458, 600], [440, 700], [380, 772], [270, 798], [170, 748], [134, 600], [144, 420], [176, 262]],
      tip: 'CAL SAYS: THE SPOONS ARE RAMPS. TRY THE BOWL!' },
    { id: 'desk', name: 'DESK DASH', where: 'ROOM 12, AFTER SCHOOL', theme: 'desk', ww: 1320, wh: 920, rw: 60, bw: 9, laps: 3, song: 1,
      pts: [[300, 205], [470, 210], [670, 212], [860, 206], [1060, 200], [1180, 280], [1196, 420], [1100, 500], [980, 540], [1010, 640], [1170, 690], [1150, 800], [980, 790], [840, 736], [670, 722], [500, 726], [330, 790], [170, 720], [130, 580], [230, 500], [150, 410], [150, 300], [200, 222]],
      tip: 'THE RULERS ARE THE ONLY WAY ACROSS. NO PRESSURE.' },
    { id: 'pond', name: 'POND PATROL', where: 'THE BACK GARDEN', theme: 'pond', ww: 1240, wh: 900, rw: 72, bw: 12, laps: 3, song: 2, boat: true,
      pts: [[330, 182], [560, 150], [800, 160], [990, 210], [1080, 340], [1010, 470], [1070, 600], [930, 730], [720, 720], [520, 712], [380, 760], [230, 690], [170, 520], [196, 330]],
      tip: 'HIT THE PLANK FLAT OUT TO JUMP THE LOG.' },
    { id: 'bath', name: 'BATH TIME BLAST', where: 'THE BATHROOM', theme: 'bath', ww: 1160, wh: 700, rw: 70, bw: 12, laps: 4, song: 2, boat: true,
      pts: [[420, 196], [640, 186], [860, 200], [970, 270], [990, 400], [920, 500], [780, 480], [650, 530], [480, 510], [330, 500], [270, 420], [290, 260]],
      tip: 'KEEP AWAY FROM THE PLUGHOLE. IT WANTS YOU.' },
    { id: 'pool', name: 'POCKET ROCKETS', where: 'THE GARAGE POOL TABLE', theme: 'pool', ww: 1360, wh: 860, rw: 62, bw: 8, laps: 3, song: 1,
      pts: [[400, 220], [680, 200], [940, 214], [1120, 260], [1176, 420], [1090, 580], [900, 620], [770, 530], [620, 560], [450, 650], [250, 610], [190, 430], [240, 270]],
      tip: 'THE POCKETS ARE A LONG WAY DOWN. GO ROUND THEM.' },
    { id: 'sand', name: 'SANDPIT SCRAMBLE', where: 'NEXT DOOR\'S SANDPIT', theme: 'sand', ww: 1240, wh: 900, rw: 64, bw: 10, laps: 3, song: 3,
      pts: [[330, 170], [600, 160], [880, 176], [1060, 250], [1090, 420], [1080, 600], [1010, 740], [800, 770], [620, 700], [560, 560], [690, 470], [760, 380], [620, 320], [440, 360], [330, 470], [330, 640], [230, 740], [150, 600], [150, 360], [190, 230]],
      tip: 'HIT THE SPADE TO JUMP THE MOAT. MIND THE BUCKET.' },
  ];

  function sampleTrack(T) {
    const P = T.pts, n = P.length, dense = [];
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      for (let s = 0; s < 30; s++) {
        const t = s / 30, t2 = t * t, t3 = t2 * t;
        const f = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
        dense.push([f(0), f(1)]);
      }
    }
    // resample every SP pixels
    const X = [], Y = []; let acc = 0, px = dense[0][0], py = dense[0][1]; X.push(px); Y.push(py);
    for (let i = 1; i <= dense.length; i++) {
      const q = dense[i % dense.length]; let dx = q[0] - px, dy = q[1] - py, d = Math.hypot(dx, dy);
      while (acc + d >= SP) { const k = (SP - acc) / d; px += dx * k; py += dy * k; X.push(px); Y.push(py); dx = q[0] - px; dy = q[1] - py; d = Math.hypot(dx, dy); acc = 0; }
      acc += d; px = q[0]; py = q[1];
    }
    if (Math.hypot(X[X.length - 1] - X[0], Y[Y.length - 1] - Y[0]) < SP * 0.6) { X.pop(); Y.pop(); }
    const N = X.length, A = new Float32Array(N), NX = new Float32Array(N), NY = new Float32Array(N), VT = new Float32Array(N);
    for (let i = 0; i < N; i++) { const a = (i + 1) % N, b = (i - 1 + N) % N; A[i] = Math.atan2(Y[a] - Y[b], X[a] - X[b]); NX[i] = -Math.sin(A[i]); NY[i] = Math.cos(A[i]); }
    // how fast the robots dare go here: slower before a sharp bend
    const VR = new Float32Array(N);
    for (let i = 0; i < N; i++) { const d = Math.abs(wrapA(A[(i + 14) % N] - A[i])); VR[i] = clamp(1.04 - d * 0.62, 0.5, 1); }
    for (let i = 0; i < N; i++) { let m = 1; for (let k = 0; k < 26; k++) m = Math.min(m, VR[(i + k) % N]); VT[i] = m; }
    return { N, X: Float32Array.from(X), Y: Float32Array.from(Y), A, NX, NY, VT, len: N * SP };
  }
  // the index of the racing line nearest a point (whole lap)
  function nearestIdx(S, x, y) { let b = 0, bd = 1e12; for (let i = 0; i < S.N; i++) { const d = (S.X[i] - x) ** 2 + (S.Y[i] - y) ** 2; if (d < bd) { bd = d; b = i; } } return b; }

  // ---------------------------------------------------------------- building a track: the picture, the material map, the minimap
  function buildTrack(T) {
    const S = T.S || (T.S = sampleTrack(T));
    const ww = T.ww, wh = T.wh;
    const cv = mkc(ww, wh), v = cv.getContext('2d'), mcv = mkc(ww, wh), m = mcv.getContext('2d');
    const B = { T, S, v, m, cv, ramps: [], dyn: [], fish: [], deco: [], floor: null, fallOK: false, warn: [] };
    v.lineJoin = m.lineJoin = 'round'; v.lineCap = m.lineCap = 'round';
    const TH = THEMES[T.theme];
    TH.base(B);                      // the ground, the edges, the material underneath
    paintOff(B, TH);                  // the stuff off the racing line
    bandAndRoad(B, TH);               // the border band and the road itself
    TH.props(B);                      // hazards, short cuts, objects
    if (EXTRA[T.theme]) EXTRA[T.theme](B); // more toys and clutter at toy scale
    startLine(B);
    if (TH.after) TH.after(B);
    dither16(cv);
    // the material grid (2px cells), with the soft edges of the shapes cleaned up
    const MW = Math.ceil(ww / 2), MH = Math.ceil(wh / 2), M = new Uint8Array(MW * MH), md = m.getImageData(0, 0, ww, wh).data;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const o = ((y * 2 + 1) * ww + (x * 2 + 1)) * 4, r = md[o], id = Math.round(r / 16);
      M[y * MW + x] = (md[o + 3] > 200 && Math.abs(r - id * 16) <= 3) ? id : 255;
    }
    for (let pass = 0; pass < 3; pass++) for (let i = 0; i < M.length; i++) if (M[i] === 255) { const l = M[i - 1], r = M[i + 1], u = M[i - MW], d = M[i + MW]; M[i] = l !== 255 && l != null ? l : u !== 255 && u != null ? u : r !== 255 && r != null ? r : d !== 255 && d != null ? d : 255; }
    for (let i = 0; i < M.length; i++) if (M[i] === 255) M[i] = T.outMat || FALL;
    B.M = M; B.MW = MW; B.MH = MH;
    mcv.width = mcv.height = 1;
    // the minimap
    const mm = mkc(72, 52), mg = mm.getContext('2d'), sc = Math.min(64 / ww, 44 / wh); B.mmSc = sc; B.mmX = (72 - ww * sc) / 2; B.mmY = (52 - wh * sc) / 2;
    mg.lineJoin = 'round'; mg.strokeStyle = 'rgba(0,0,0,.6)'; mg.lineWidth = 5; mg.beginPath(); for (let i = 0; i < S.N; i += 3) { const x = B.mmX + S.X[i] * sc, y = B.mmY + S.Y[i] * sc; i ? mg.lineTo(x, y) : mg.moveTo(x, y); } mg.closePath(); mg.stroke();
    mg.strokeStyle = '#e8e8f0'; mg.lineWidth = 2; mg.stroke();
    B.mm = mm;
    return B;
  }
  function trackPath(g, S, i0, i1) { // a sub-path from sample i0 to i1 (wrapping); whole loop when i0 == null
    g.beginPath();
    if (i0 == null) { g.moveTo(S.X[0], S.Y[0]); for (let i = 1; i < S.N; i++) g.lineTo(S.X[i], S.Y[i]); g.closePath(); return; }
    let i = i0; g.moveTo(S.X[i], S.Y[i]); while (i !== i1) { i = (i + 1) % S.N; g.lineTo(S.X[i], S.Y[i]); }
  }
  const at = (S, t) => ((Math.round(t * S.N) % S.N) + S.N) % S.N;
  function bandRanges(T, S) { return (T.noBand || []).length ? invert(T.noBand.map(([a, b]) => [at(S, a), at(S, b)]), S.N) : [[0, null]]; }
  function invert(gaps, N) { const out = []; for (let k = 0; k < gaps.length; k++) out.push([gaps[k][1], gaps[(k + 1) % gaps.length][0]]); return out; }
  function paintOff(B, TH) {
    if (!TH.off) return;
    const c = mkc(B.T.ww, B.T.wh), g = c.getContext('2d'); g.lineJoin = g.lineCap = 'round';
    TH.off(B, g);
    g.globalCompositeOperation = 'destination-out'; g.lineWidth = B.T.rw + B.T.bw * 2 - 2; g.strokeStyle = '#000'; trackPath(g, B.S); g.stroke();
    B.v.drawImage(c, 0, 0);
  }
  function bandAndRoad(B, TH) {
    const { T, S, v, m } = B;
    // the band (what borders the road)
    for (const [i0, i1] of bandRanges(T, S)) {
      if (TH.bandV) { v.lineWidth = T.rw + T.bw * 2; v.strokeStyle = TH.bandV; if (i1 == null) trackPath(v, S); else trackPath(v, S, i0, i1); v.stroke(); }
      m.lineWidth = T.rw + T.bw * 2; m.strokeStyle = MC(TH.bandM); if (i1 == null) trackPath(m, S); else trackPath(m, S, i0, i1); m.stroke();
    }
    // the road, a darker lane down the middle, then the kerb lines either side
    v.lineWidth = T.rw; v.strokeStyle = TH.roadV(B); trackPath(v, S); v.stroke();
    v.lineWidth = T.rw * 0.5; v.strokeStyle = TH.lane || 'rgba(0,0,0,.08)'; trackPath(v, S); v.stroke();
    if (TH.kerb !== null) {
      const kc = TH.kerb || 'rgba(60,30,10,.45)', ic = TH.kerbIn || 'rgba(255,255,255,.16)';
      for (const sd of [-1, 1]) { offsetPath(v, S, sd * (T.rw / 2 - 1)); v.lineWidth = 2; v.strokeStyle = kc; v.stroke(); offsetPath(v, S, sd * (T.rw / 2 - 4)); v.lineWidth = 1.5; v.strokeStyle = ic; v.stroke(); }
    }
    if (TH.roadTop) TH.roadTop(B);
    m.lineWidth = T.rw; m.strokeStyle = MC(ROAD); trackPath(m, S); m.stroke();
    // the border objects, both sides
    if (TH.border) {
      const ranges = bandRanges(T, S);
      const inBand = i => ranges.some(([a, b]) => b == null || (a <= b ? i >= a && i <= b : i >= a || i <= b));
      const step = TH.borderStep || 3, off = T.rw / 2 + T.bw / 2;
      for (const side of [-1, 1]) for (let i = 0, k = 0; i < S.N; i += step, k++) if (inBand(i)) TH.border(B, S.X[i] + S.NX[i] * off * side, S.Y[i] + S.NY[i] * off * side, S.A[i], side, k, i);
    }
    // arrows on the road before the big bends
    let last = -99;
    for (let i = 0; i < S.N; i++) {
      const d = wrapA(S.A[(i + 20) % S.N] - S.A[i]);
      if (Math.abs(d) > 0.9 && i - last > 40) { last = i; chevrons(v, S, i, d > 0 ? 1 : -1, TH.chev || 'rgba(255,255,255,.55)'); }
    }
  }
  function offsetPath(v, S, off) { v.beginPath(); for (let i = 0; i <= S.N; i++) { const j = i % S.N, x = S.X[j] + S.NX[j] * off, y = S.Y[j] + S.NY[j] * off; i ? v.lineTo(x, y) : v.moveTo(x, y); } }
  function chevrons(v, S, i, dir, col) {
    v.save(); v.translate(S.X[i] + S.NX[i] * dir * -20, S.Y[i] + S.NY[i] * dir * -20); v.rotate(S.A[i] + dir * 0.5); v.fillStyle = col;
    for (let k = 0; k < 2; k++) { v.beginPath(); const x = k * 9 - 4; v.moveTo(x, -5 * dir); v.lineTo(x + 6, 0); v.lineTo(x, 5 * dir); v.lineTo(x - 3, 5 * dir); v.lineTo(x + 3, 0); v.lineTo(x - 3, -5 * dir); v.closePath(); v.fill(); }
    v.restore();
  }
  function startLine(B) {
    const { S, v, T } = B; const i = 0;
    v.save(); v.translate(S.X[i], S.Y[i]); v.rotate(S.A[i]);
    const hw = T.rw / 2; for (let y = -hw, r = 0; y < hw; y += 4, r++) for (let x = 0; x < 8; x += 4) rect(v, x - 4, y, 4, Math.min(4, hw - y), ((x / 4 + r) & 1) ? '#101010' : '#f4f4f4');
    // the grid boxes
    v.strokeStyle = 'rgba(255,255,255,.55)'; v.lineWidth = 1;
    for (let k = 0; k < 4; k++) { const gx = -18 - (k >> 1) * 26 - (k & 1) * 10, gy = (k & 1 ? 1 : -1) * 13; v.beginPath(); v.moveTo(gx + 8, gy - 7); v.lineTo(gx - 6, gy - 7); v.moveTo(gx + 8, gy + 7); v.lineTo(gx - 6, gy + 7); v.moveTo(gx + 8, gy - 7); v.lineTo(gx + 8, gy + 7); v.stroke(); }
    v.restore();
  }
  // props: paint both layers
  function shadowLocal(B, x, y, w, h, fn, dx, dy, a) { // the same, for a small area (cheaper)
    const c = mkc(w, h), g = c.getContext('2d'); g.translate(-x, -y); fn(g); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    B.v.save(); B.v.globalAlpha = a || 0.35; B.v.drawImage(c, x + dx, y + dy); B.v.restore();
  }
  function matCircle(B, x, y, r, id) { B.m.fillStyle = MC(id); B.m.beginPath(); B.m.arc(x, y, r, 0, TAU); B.m.fill(); }
  function matEll(B, x, y, rx, ry, rot, id) { B.m.fillStyle = MC(id); B.m.beginPath(); B.m.ellipse(x, y, rx, ry, rot || 0, 0, TAU); B.m.fill(); }
  function matRect(B, x, y, w, h, id, rot) { B.m.save(); B.m.translate(x, y); if (rot) B.m.rotate(rot); B.m.fillStyle = MC(id); B.m.fillRect(-w / 2, -h / 2, w, h); B.m.restore(); }
  function matRing(B, x, y, r0, r1, id) { B.m.fillStyle = MC(id); B.m.beginPath(); B.m.arc(x, y, r1, 0, TAU); B.m.arc(x, y, r0, 0, TAU, true); B.m.fill(); }
  // a ramp from (ax, ay) up to (bx, by), w wide, h high at the top end
  function addRamp(B, ax, ay, bx, by, w, h) { B.ramps.push({ ax, ay, bx, by, w, h, len: Math.hypot(bx - ax, by - ay) }); const a = Math.atan2(by - ay, bx - ax), L = Math.hypot(bx - ax, by - ay); matRect(B, (ax + bx) / 2, (ay + by) / 2, L, w, RAMP, a); }
  // somewhere along the track: t (0..1) and a sideways offset
  function along(B, t, off) { const S = B.S, i = at(S, t); return [S.X[i] + S.NX[i] * (off || 0), S.Y[i] + S.NY[i] * (off || 0), S.A[i], i]; }
  function idxNear(S, x, y) { return nearestIdx(S, x, y); }

  // ================================================================ the six worlds
  // a parallax floor far below (seen past the edge of the table)
  function floorTile(kind) {
    const c = mkc(64, 64), g = c.getContext('2d');
    if (kind === 'lino') { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) rect(g, x * 32, y * 32, 32, 32, (x + y) & 1 ? '#3a3238' : '#9a9088'); pix(c, (x, y, o) => { const k = 0.9 + hash(x, y, 3) * 0.12; const base = ((x >> 5) + (y >> 5)) & 1 ? [58, 50, 56] : [154, 144, 136]; o[0] = base[0] * k; o[1] = base[1] * k; o[2] = base[2] * k; }); rect(g, 0, 0, 64, 1, '#2a2228'); rect(g, 0, 32, 64, 1, '#2a2228'); rect(g, 0, 0, 1, 64, '#2a2228'); rect(g, 32, 0, 1, 64, '#2a2228'); }
    else if (kind === 'school') { pix(c, (x, y, o) => { const k = 0.88 + hash(x, y, 7) * 0.14 + (hash(x >> 1, y >> 1, 9) > 0.93 ? -0.25 : 0); o[0] = 120 * k; o[1] = 124 * k; o[2] = 118 * k; }); rect(g, 0, 0, 64, 1, '#585a54'); rect(g, 0, 0, 1, 64, '#585a54'); }
    else if (kind === 'carpet') { pix(c, (x, y, o) => { const u = (x + 0.5) / 64 * TAU, w = (y + 0.5) / 64 * TAU; const s = Math.sin(u * 2) * Math.cos(w * 2) + Math.sin((u + w) * 1) * 0.6; const k = 0.9 + hash(x, y, 5) * 0.15; if (s > 0.9) { o[0] = 200 * k; o[1] = 150 * k; o[2] = 40 * k; } else if (s > 0.55) { o[0] = 40 * k; o[1] = 70 * k; o[2] = 50 * k; } else { o[0] = 120 * k; o[1] = 24 * k; o[2] = 36 * k; } }); }
    else if (kind === 'lawn') { pix(c, (x, y, o) => { const k = 0.8 + hash(x, y, 11) * 0.3 + vn(x, y, 16, 3) * 0.2; o[0] = 50 * k; o[1] = 128 * k; o[2] = 40 * k; }); }
    else { pix(c, (x, y, o) => { const k = 0.85 + hash(x, y, 2) * 0.2; o[0] = 210 * k; o[1] = 214 * k; o[2] = 220 * k; }); rect(g, 0, 0, 64, 2, '#8a96a0'); rect(g, 0, 0, 2, 64, '#8a96a0'); rect(g, 0, 31, 64, 2, '#8a96a0'); rect(g, 31, 0, 2, 64, '#8a96a0'); }
    // far away: darker and a little hazy
    g.fillStyle = 'rgba(10,10,30,.45)'; g.fillRect(0, 0, 64, 64);
    return dither16(c);
  }
  // table / desk edges: a side face along the bottom and right (we look down at it from a little to the south-east)
  function edgeFaces(B, rx, ry, rw, rh, top, side, deep) {
    const v = B.v; deep = deep || 16;
    // the cast shadow on the floor far below
    v.fillStyle = 'rgba(0,0,0,.35)'; v.fillRect(rx + 18, ry + rh + deep, rw, 26); v.fillRect(rx + rw + 10, ry + 18, 22, rh + deep);
    const gr = v.createLinearGradient(0, ry + rh, 0, ry + rh + deep); gr.addColorStop(0, top); gr.addColorStop(1, side);
    v.fillStyle = gr; v.fillRect(rx, ry + rh, rw, deep);
    const gr2 = v.createLinearGradient(rx + rw, 0, rx + rw + deep * 0.5, 0); gr2.addColorStop(0, top); gr2.addColorStop(1, side);
    v.fillStyle = gr2; v.beginPath(); v.moveTo(rx + rw, ry); v.lineTo(rx + rw + deep * 0.5, ry + deep * 0.5); v.lineTo(rx + rw + deep * 0.5, ry + rh + deep); v.lineTo(rx + rw, ry + rh); v.fill();
    v.fillStyle = 'rgba(255,255,255,.25)'; v.fillRect(rx, ry, rw, 1); v.fillRect(rx, ry, 1, rh);
  }
  function cornflake(v, x, y, s, rot) {
    v.save(); v.translate(x, y); v.rotate(rot);
    v.fillStyle = '#b86a18'; v.beginPath(); v.moveTo(-4 * s, -2 * s); v.lineTo(-1 * s, -4 * s); v.lineTo(4 * s, -3 * s); v.lineTo(5 * s, 1 * s); v.lineTo(2 * s, 4 * s); v.lineTo(-3 * s, 3 * s); v.closePath(); v.fill();
    v.fillStyle = '#f0b040'; v.beginPath(); v.moveTo(-3 * s, -2 * s); v.lineTo(-1 * s, -3.2 * s); v.lineTo(3.4 * s, -2.4 * s); v.lineTo(3.4 * s, 0.6 * s); v.lineTo(0, 2 * s); v.lineTo(-2.6 * s, 1.6 * s); v.closePath(); v.fill();
    v.fillStyle = '#ffe090'; v.fillRect(-1.5 * s, -2 * s, 2 * s, 1 * s);
    v.restore();
  }
  function hoop(v, x, y, r) { circ(v, x + 1, y + 1.5, r, 'rgba(0,0,0,.3)'); circ(v, x, y, r, '#c88a28'); circ(v, x - r * 0.25, y - r * 0.25, r * 0.7, '#f0c050'); circ(v, x, y, r * 0.38, '#7a4a10'); }

  const THEMES = {
    // ---------------------------------------------------------------- 1. the breakfast table
    bfast: {
      chev: 'rgba(255,240,200,.5)', bandM: BUMP, borderStep: 2, kerb: 'rgba(90,40,10,.5)', kerbIn: 'rgba(255,230,180,.22)', lane: 'rgba(60,20,0,.09)',
      base(B) {
        const { v, m, T } = B, tx = 50, ty = 44, tw = 1180, th = 800; B.table = [tx, ty, tw, th]; B.floor = floorTile('lino'); B.fallOK = true;
        // wooden planks with grain
        pix(B.cv, (x, y, o) => {
          const p = Math.floor((y - ty) / 64), sh = 0.86 + hash(p, 1, 4) * 0.2, jx = (x + p * 237) % 520;
          const gr = Math.sin((y * 0.7 + vn(x, y * 3, 60, p + 3) * 26 + p * 9) * 0.8) * 0.5 + 0.5, fib = vn(x, y, 3, p) * 0.08;
          let k = sh * (0.88 + gr * 0.1 + fib); if (((y - ty) & 63) < 2 || jx < 2) k *= 0.55; if (((y - ty) & 63) === 2) k *= 1.12;
          const kn = vn(x, y, 22, p + 40); if (kn > 0.86) k *= 0.8 - (kn - 0.86) * 3;
          o[0] = 176 * k; o[1] = 110 * k; o[2] = 58 * k;
        }, tx, ty, tw, th);
        edgeFaces(B, tx, ty, tw, th, '#7a4418', '#3a1c08', 18);
        m.fillStyle = MC(FALL); m.fillRect(0, 0, T.ww, T.wh); m.fillStyle = MC(ROUGH); m.fillRect(tx, ty, tw, th);
        // a sunny window glow across the table
        const gr = v.createLinearGradient(tx, ty, tx + tw, ty + th); gr.addColorStop(0, 'rgba(255,240,200,.16)'); gr.addColorStop(0.6, 'rgba(255,240,200,0)'); gr.addColorStop(1, 'rgba(30,10,0,.12)');
        v.fillStyle = gr; v.fillRect(tx, ty, tw, th);
      },
      off(B, g) { // crumbs and sugar everywhere you shouldn't be
        const [tx, ty, tw, th] = B.table;
        for (let i = 0; i < 2600; i++) { const x = tx + hash(i, 1, 21) * tw, y = ty + hash(i, 2, 21) * th, r = hash(i, 3, 21); if (r < 0.55) { rect(g, x, y, 2, 2, r < 0.25 ? '#f8f4e8' : '#e8d8b0'); } else if (r < 0.85) { rect(g, x, y, 3, 2, '#c08038'); rect(g, x, y, 2, 1, '#e8b060'); } else rect(g, x, y, 1, 1, '#ffffff'); }
        g.fillStyle = 'rgba(80,40,10,.12)'; g.fillRect(tx, ty, tw, th);
      },
      bandV: 'rgba(120,64,20,.35)',
      roadV(B) { const c = mkc(64, 64); pix(c, (x, y, o) => { const k = 0.98 + hash(x, y, 5) * 0.05; o[0] = 210 * k; o[1] = 150 * k; o[2] = 90 * k; }); return B.v.createPattern(c, 'repeat'); },
      roadTop(B) { const { v, S, T } = B; v.globalCompositeOperation = 'multiply'; v.lineWidth = T.rw; v.strokeStyle = '#d8a878'; trackPath(v, S); v.stroke(); v.globalCompositeOperation = 'source-over'; v.globalAlpha = 0.5; v.lineWidth = T.rw - 6; v.strokeStyle = 'rgba(255,230,190,.25)'; v.stroke(); v.globalAlpha = 1; },
      border(B, x, y, a, side, k) { const r = hash(k, side + 5, 8); if (r < 0.7) cornflake(B.v, x + (hash(k, 1, 9) - 0.5) * 6, y + (hash(k, 2, 9) - 0.5) * 6, 1 + hash(k, 3, 9) * 0.5, hash(k, 4, 9) * 6); else hoop(B.v, x + (hash(k, 1, 9) - 0.5) * 5, y + (hash(k, 2, 9) - 0.5) * 5, 3.4); },
      props(B) {
        const { v, S } = B;
        // ---- the cereal bowl and its two spoons (the short cut)
        const cx = 600, cy = 500, R = 88; B.bowl = { x: cx, y: cy, r: R };
        shadowLocal(B, cx - R - 20, cy - R - 20, R * 2 + 60, R * 2 + 60, g => circ(g, cx, cy, R + 2, '#000'), 10, 12, 0.4);
        const rg = v.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, R); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.8, '#d8dce8'); rg.addColorStop(1, '#8890a8');
        v.fillStyle = rg; v.beginPath(); v.arc(cx, cy, R, 0, TAU); v.fill();
        circ(v, cx, cy, R - 4, '#3060c0'); circ(v, cx, cy, R - 7, '#e8ecf4');
        const mg = v.createRadialGradient(cx + 20, cy + 20, 8, cx, cy, R - 9); mg.addColorStop(0, '#fffef4'); mg.addColorStop(0.75, '#f0ecdc'); mg.addColorStop(1, '#a8a498');
        v.fillStyle = mg; v.beginPath(); v.arc(cx, cy, R - 10, 0, TAU); v.fill();
        for (let i = 0; i < 36; i++) { const a = hash(i, 1, 33) * TAU, d = Math.sqrt(hash(i, 2, 33)) * (R - 22); hoop(v, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 4 + hash(i, 3, 33) * 1.5); }
        v.strokeStyle = 'rgba(255,255,255,.8)'; v.lineWidth = 2; v.beginPath(); v.arc(cx, cy, R - 2, Math.PI * 1.1, Math.PI * 1.5); v.stroke();
        matCircle(B, cx, cy, R, SOLID); matCircle(B, cx, cy, R - 10, BOWL);
        // spoons: in from the right leg, out to the left leg
        const spoon = (bx, by, tx, ty, h, inBowl) => {
          const a = Math.atan2(ty - by, tx - bx), L = Math.hypot(tx - bx, ty - by);
          shadowLocal(B, Math.min(bx, tx) - 30, Math.min(by, ty) - 30, Math.abs(tx - bx) + 60, Math.abs(ty - by) + 60, g => { g.save(); g.translate(bx, by); g.rotate(a); g.fillRect(0, -8, L, 16); g.restore(); }, 5, 7, 0.35);
          v.save(); v.translate(bx, by); v.rotate(a);
          const sg = v.createLinearGradient(0, -9, 0, 9); sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.45, '#b8c0cc'); sg.addColorStop(1, '#5a6270');
          v.fillStyle = sg; v.beginPath(); v.moveTo(0, -7); v.lineTo(L * 0.62, -5); v.quadraticCurveTo(L * 0.66, -13, L * 0.82, -13); v.quadraticCurveTo(L + 6, -12, L + 6, 0); v.quadraticCurveTo(L + 6, 12, L * 0.82, 13); v.quadraticCurveTo(L * 0.66, 13, L * 0.62, 5); v.lineTo(0, 7); v.closePath(); v.fill();
          v.fillStyle = 'rgba(255,255,255,.7)'; v.fillRect(4, -5, L * 0.55, 2); rect(v, L * 0.7, -8, L * 0.2, 3, 'rgba(255,255,255,.6)');
          for (let s = 8; s < L * 0.6; s += 12) { v.fillStyle = 'rgba(40,50,70,.35)'; v.fillRect(s, -6, 2, 12); }
          v.restore();
          addRamp(B, bx, by, tx, ty, 22, h);
        };
        const u1 = [Math.cos(0.52), Math.sin(0.52)], u2 = [-Math.cos(0.52), Math.sin(0.52)];
        spoon(cx + u1[0] * 150, cy + u1[1] * 150, cx + u1[0] * (R - 2), cy + u1[1] * (R - 2), 16, false);
        spoon(cx + u2[0] * 22, cy + u2[1] * 22, cx + u2[0] * (R + 2), cy + u2[1] * (R + 2), 20, true);
        B.alt = { from: idxNear(S, cx + u1[0] * 158, cy + u1[1] * 158) - 6, to: idxNear(S, cx + u2[0] * 170, cy + u2[1] * 170) + 4,
          pts: [[cx + u1[0] * 156, cy + u1[1] * 156], [cx + u1[0] * 120, cy + u1[1] * 120], [cx + u1[0] * 30, cy + u1[1] * 30], [cx + u2[0] * 5 + 6, cy + u2[1] * 5 - 6], [cx + u2[0] * 30, cy + u2[1] * 30], [cx + u2[0] * 120, cy + u2[1] * 120], [cx + u2[0] * 176, cy + u2[1] * 176]] };
        // ---- the spilt milk (on the right-hand bend)
        const mx = 1128, my = 470;
        v.fillStyle = '#f4f2ea'; v.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, r = 1 + Math.sin(a * 3 + 1) * 0.16 + Math.sin(a * 5) * 0.08; const x = mx + Math.cos(a) * 34 * r, y = my + Math.sin(a) * 66 * r; i ? v.lineTo(x, y) : v.moveTo(x, y); } v.fill();
        v.fillStyle = 'rgba(200,200,220,.6)'; v.beginPath(); v.ellipse(mx + 6, my + 8, 22, 50, 0, 0, TAU); v.fill(); v.fillStyle = '#ffffff'; v.beginPath(); v.ellipse(mx - 10, my - 26, 7, 16, 0.2, 0, TAU); v.fill();
        circ(v, mx + 44, my - 70, 6, '#f4f2ea'); circ(v, mx - 30, my + 72, 5, '#f4f2ea');
        matEll(B, mx, my, 34, 66, 0, SLIP);
        // ---- the cereal box, lying down
        const bx = 520, by = 214, bw2 = 170, bh = 76;
        shadowLocal(B, bx - 10, by - 10, bw2 + 50, bh + 50, g => g.fillRect(bx, by, bw2, bh), 12, 14, 0.4);
        rect(v, bx, by, bw2, bh, '#d02818'); rect(v, bx, by + bh - 8, bw2, 8, '#901808'); rect(v, bx + bw2 - 6, by, 6, bh, '#a01c0c');
        rrect(v, bx + 8, by + 8, 100, 52, 10, '#f8d020'); rrect(v, bx + 12, by + 12, 92, 44, 8, '#ffe868');
        for (let i = 0; i < 6; i++) hoop(v, bx + 130 + (i % 2) * 14, by + 16 + (i >> 1) * 16, 6);
        TV.font.draw(v, 'CRUNCHY', bx + 16, by + 16, '#c01808', 2); TV.font.draw(v, 'HOOPS', bx + 28, by + 34, '#c01808', 2);
        TV.font.draw(v, 'WITH 7 VITAMINS', bx + 12, by + 52, '#ffffff', 1);
        rect(v, bx, by, bw2, 2, 'rgba(255,255,255,.45)'); matRect(B, bx + bw2 / 2, by + bh / 2, bw2, bh, SOLID);
        // ---- a plate of toast and a fried egg
        const px = 935, py = 470;
        shadowLocal(B, px - 120, py - 120, 260, 260, g => circ(g, px, py, 100, '#000'), 8, 10, 0.35);
        const pg = v.createRadialGradient(px - 40, py - 40, 20, px, py, 100); pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#b8c0d0'); v.fillStyle = pg; v.beginPath(); v.arc(px, py, 100, 0, TAU); v.fill();
        circ(v, px, py, 74, '#e8ecf4'); v.strokeStyle = '#4070c8'; v.lineWidth = 3; v.beginPath(); v.arc(px, py, 88, 0, TAU); v.stroke();
        for (const [ox, oy, r] of [[-26, -18, 0.2], [18, 14, -0.35]]) { v.save(); v.translate(px + ox, py + oy); v.rotate(r); rrect(v, -30, -28, 60, 56, 10, '#9a5a20'); rrect(v, -26, -24, 52, 48, 8, '#e8a850'); for (let i = 0; i < 18; i++) rect(v, -22 + hash(i, ox, 3) * 44, -20 + hash(i, oy, 4) * 40, 2, 2, '#c08030'); rrect(v, -10, -8, 20, 14, 2, '#fff0a0'); v.restore(); }
        ell(v, px + 30, py - 40, 24, 20, '#ffffff', 0.4); circ(v, px + 33, py - 42, 9, '#f8a818'); circ(v, px + 30, py - 45, 3, '#ffe090');
        matCircle(B, px, py, 100, SOLID);
        // ---- a mug of tea (steam rises from it)
        const ux = 930, uy = 668;
        shadowLocal(B, ux - 50, uy - 50, 110, 110, g => circ(g, ux, uy, 30, '#000'), 9, 11, 0.4);
        circ(v, ux, uy, 30, '#2a6ac8'); circ(v, ux, uy, 25, '#d8e0f0'); circ(v, ux, uy, 22, '#a86a38'); circ(v, ux - 6, uy - 6, 8, '#c8905a');
        rrect(v, ux + 26, uy - 7, 16, 14, 5, '#2a6ac8'); rrect(v, ux + 30, uy - 3, 8, 6, 3, '#6a4a2a');
        TV.font.draw(v, 'DAD', ux - 9, uy + 32, '#f8f8f8', 1);
        matCircle(B, ux, uy, 30, SOLID); B.deco.push({ k: 'steam', x: ux, y: uy });
        // ---- the marmalade jar and an egg in an egg cup
        const jx = 300, jy = 470;
        shadowLocal(B, jx - 60, jy - 60, 140, 140, g => circ(g, jx, jy, 42, '#000'), 9, 11, 0.4);
        circ(v, jx, jy, 42, '#e07818'); circ(v, jx, jy, 36, '#c8c8d0'); const jg = v.createRadialGradient(jx - 12, jy - 12, 4, jx, jy, 36); jg.addColorStop(0, '#ffffff'); jg.addColorStop(1, '#808898'); v.fillStyle = jg; v.beginPath(); v.arc(jx, jy, 34, 0, TAU); v.fill();
        for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; rect(v, jx + Math.cos(a) * 30 - 1, jy + Math.sin(a) * 30 - 1, 2, 2, '#606878'); }
        TV.font.center(v, 'MARM', jx, jy - 4, '#e07818', 1);
        matCircle(B, jx, jy, 42, SOLID);
        const ex = 300, ey = 640;
        shadowLocal(B, ex - 40, ey - 40, 100, 100, g => circ(g, ex, ey, 24, '#000'), 7, 9, 0.4);
        circ(v, ex, ey, 24, '#30a050'); circ(v, ex, ey, 19, '#f4ead8'); ell(v, ex - 2, ey - 2, 14, 16, '#fff8ec'); circ(v, ex - 6, ey - 8, 3, '#ffffff');
        matCircle(B, ex, ey, 24, SOLID);
        // ---- knife and fork near the top edge
        v.save(); v.translate(300, 86); shadowLocal(B, 280, 70, 200, 40, g => g.fillRect(300, 82, 150, 8), 4, 5, 0.35); rrect(v, 0, -4, 60, 8, 3, '#3a2a20'); rect(v, 60, -3, 90, 6, '#d0d4dc'); rect(v, 60, -3, 90, 2, '#ffffff'); v.restore();
        v.save(); v.translate(700, 92); shadowLocal(B, 680, 70, 200, 40, g => g.fillRect(700, 86, 150, 10), 4, 5, 0.35); rrect(v, 0, -4, 70, 8, 3, '#3a2a20'); rect(v, 70, -3, 40, 6, '#d0d4dc'); for (let i = 0; i < 4; i++) rect(v, 110, -5 + i * 3, 36, 1.6, '#c0c4cc'); v.restore();
        matRect(B, 375, 86, 150, 8, SOLID); matRect(B, 780, 92, 150, 10, SOLID);
        // a little sign for the short cut
        v.save(); v.translate(cx + u1[0] * 196, cy + u1[1] * 150 + 40); rect(v, -1, 0, 2, 14, '#5a3a1a'); rrect(v, -24, -14, 48, 16, 3, '#f8f0d0'); TV.font.center(v, 'SHORT', 0, -12, '#c01808', 1); v.restore();
      },
    },
    // ---------------------------------------------------------------- 2. two school desks and two rulers
    desk: {
      chev: 'rgba(40,60,160,.45)', bandM: SOLID, borderStep: 1, kerb: 'rgba(40,50,80,.4)', kerbIn: 'rgba(255,255,255,.3)',
      base(B) {
        const { v, m, T } = B; B.floor = floorTile('school'); B.fallOK = true;
        const D = B.desks = [[40, 50, 600, 820], [700, 50, 580, 820]];
        m.fillStyle = MC(FALL); m.fillRect(0, 0, T.ww, T.wh);
        for (const [x, y, w, h] of D) {
          pix(B.cv, (px, py, o) => { const k = 0.93 + hash(px, py, 1) * 0.07 + vn(px, py, 80, 2) * 0.06 + (hash(px >> 2, py >> 2, 6) > 0.97 ? -0.08 : 0); o[0] = 168 * k; o[1] = 176 * k; o[2] = 182 * k; }, x, y, w, h);
          v.strokeStyle = '#c8783a'; v.lineWidth = 6; v.strokeRect(x + 3, y + 3, w - 6, h - 6);
          edgeFaces(B, x, y, w, h, '#8a5a30', '#3a2210', 16);
          m.fillStyle = MC(ROUGH); m.fillRect(x, y, w, h);
        }
        // doodles in biro
        const doodle = (s, x, y, rot, col) => { v.save(); v.translate(x, y); v.rotate(rot); v.globalAlpha = 0.6; TV.font.draw(v, s, 0, 0, col || '#2a3a90', 2); v.restore(); };
        doodle('CAL WOZ ERE', 820, 380, -0.12); doodle('DAVE SUX', 230, 600, 0.08); doodle('1999!!', 920, 610, 0.15, '#902020'); doodle('J + ?', 380, 120, -0.05);
        v.globalAlpha = 0.6; v.strokeStyle = '#2a3a90'; v.lineWidth = 2; for (let i = 0; i < 2; i++) { v.beginPath(); v.moveTo(420 + i * 16, 330); v.lineTo(420 + i * 16, 378); v.moveTo(404, 346 + i * 16); v.lineTo(452, 346 + i * 16); v.stroke(); }
        TV.font.draw(v, 'X', 409, 333, '#2a3a90', 1); TV.font.draw(v, 'O', 425, 349, '#2a3a90', 1); TV.font.draw(v, 'X', 441, 365, '#2a3a90', 1); v.globalAlpha = 1;
      },
      off(B, g) { for (let i = 0; i < 1400; i++) { const x = hash(i, 1, 41) * B.T.ww, y = hash(i, 2, 41) * B.T.wh; const r = hash(i, 3, 41); if (r < 0.5) { rect(g, x, y, 3, 2, '#e0b080'); rect(g, x + 1, y, 2, 1, '#8a5a30'); } else if (r < 0.8) rect(g, x, y, 2, 2, '#f0a0b0'); else rect(g, x, y, 1, 3, '#606070'); } g.fillStyle = 'rgba(40,50,60,.1)'; g.fillRect(0, 0, B.T.ww, B.T.wh); g.globalCompositeOperation = 'destination-in'; for (const [x, y, w, h] of B.desks) g.fillRect(x + 6, y + 6, w - 12, h - 12); g.globalCompositeOperation = 'source-over'; },
      bandV: 'rgba(60,40,20,.3)',
      roadV(B) { const c = mkc(64, 64); pix(c, (x, y, o) => { const k = 0.97 + hash(x, y, 8) * 0.05; o[0] = 196 * k; o[1] = 202 * k; o[2] = 206 * k; }); return B.v.createPattern(c, 'repeat'); },
      border(B, x, y, a, side, k, i) { // pencils, end to end
        const v = B.v; if (k % 9) return;
        const cols = ['#f8c818', '#e83828', '#3070e0', '#30a040', '#f8c818'], col = cols[(k / 9 + (side > 0 ? 2 : 0)) % cols.length];
        v.save(); v.translate(x, y); v.rotate(a); v.fillStyle = 'rgba(0,0,0,.3)'; v.fillRect(-16, -1, 34, 7);
        rect(v, -18, -3.5, 26, 7, col); rect(v, -18, -3.5, 26, 2, 'rgba(255,255,255,.45)'); rect(v, -18, 1.5, 26, 2, 'rgba(0,0,0,.2)');
        poly(v, [8, -3.5, 16, 0, 8, 3.5], '#f0c890'); poly(v, [13.5, -1, 16.5, 0, 13.5, 1], '#303030');
        rect(v, -21, -3.5, 3, 7, '#b8b8c0'); rrect(v, -25, -3.5, 4.5, 7, 2, '#f090a0');
        v.restore();
      },
      props(B) {
        const { v, S } = B;
        // the gap between the desks (paint the fall back in, then the two rulers across)
        const gx = 640, gw = 60;
        v.clearRect(gx, 0, gw, B.T.wh); B.m.fillStyle = MC(FALL); B.m.fillRect(gx, 0, gw, B.T.wh);
        // the left desk's side face and its shadow, down in the gap
        v.fillStyle = 'rgba(0,0,0,.35)'; v.fillRect(gx + 10, 68, 22, 820);
        const sg = v.createLinearGradient(gx, 0, gx + 8, 0); sg.addColorStop(0, '#8a5a30'); sg.addColorStop(1, '#3a2210'); v.fillStyle = sg; v.beginPath(); v.moveTo(gx, 50); v.lineTo(gx + 8, 58); v.lineTo(gx + 8, 886); v.lineTo(gx, 870); v.fill();
        v.fillStyle = '#3a2210'; v.fillRect(gx, 870, 8, 16);
        const ruler = (y) => {
          const x0 = gx - 70, L = gw + 140, w = 40;
          v.fillStyle = 'rgba(0,0,0,.35)'; v.fillRect(x0 + 8, y - w / 2 + 10, L, w);
          const rg = v.createLinearGradient(0, y - w / 2, 0, y + w / 2); rg.addColorStop(0, '#f8f0c8'); rg.addColorStop(1, '#d8c890');
          v.fillStyle = rg; v.fillRect(x0, y - w / 2, L, w); rect(v, x0, y + w / 2 - 3, L, 3, '#a89860'); rect(v, x0, y - w / 2, L, 1, '#fffff0');
          for (let i = 0; i <= L - 8; i += 5) rect(v, x0 + 4 + i, y - w / 2 + 1, 1, i % 25 === 0 ? 9 : i % 10 === 0 ? 6 : 4, '#3a3020');
          for (let i = 0, n = 0; i <= L - 8; i += 25, n++) TV.font.draw(v, String(n), x0 + 2 + i, y - w / 2 + 11, '#3a3020', 1);
          TV.font.draw(v, 'SHATTERPROOF', x0 + 50, y + 4, '#8a7a50', 1);
          matRect(B, x0 + L / 2, y, L, w, ROAD);
        };
        ruler(S.Y[at(S, 0.08)]); ruler(S.Y[idxNear(S, 670, 722)]);
        // the ink blot (slippy) on the bend after the chicane
        const ix = 1104, iy = 520;
        v.fillStyle = '#1a2a80'; v.beginPath(); for (let i = 0; i <= 30; i++) { const a = i / 30 * TAU, r = 32 * (1 + Math.sin(a * 5 + 2) * 0.18 + Math.sin(a * 9) * 0.08); const x = ix + Math.cos(a) * r * 1.2, y = iy + Math.sin(a) * r; i ? v.lineTo(x, y) : v.moveTo(x, y); } v.fill();
        ell(v, ix - 10, iy - 10, 12, 7, '#4060c0', -0.4); circ(v, ix + 50, iy - 24, 5, '#1a2a80'); circ(v, ix - 46, iy + 26, 4, '#1a2a80');
        matEll(B, ix, iy, 40, 34, 0, SLIP);
        // rubbers (erasers) on the S-bend, a pencil case and a sharpener
        const rub = (x, y, r) => { shadowLocal(B, x - 40, y - 40, 90, 90, g => { g.save(); g.translate(x, y); g.rotate(r); g.fillRect(-20, -12, 40, 24); g.restore(); }, 5, 6, 0.4); v.save(); v.translate(x, y); v.rotate(r); rrect(v, -20, -12, 40, 24, 4, '#f4f0e8'); rrect(v, -20, -12, 18, 24, 4, '#3a70d8'); rect(v, -4, -12, 24, 3, '#ffffff'); v.restore(); matRect(B, x, y, 40, 24, SOLID, r); };
        rub(300, 560, 0.3); rub(300, 420, -0.4);
        const pcx = 400, pcy = 330, pw = 120, ph = 50;
        shadowLocal(B, pcx - 80, pcy - 40, 220, 120, g => rrect(g, pcx - pw / 2, pcy - ph / 2, pw, ph, 16, '#000'), 8, 10, 0.4);
        const cg = v.createLinearGradient(0, pcy - ph / 2, 0, pcy + ph / 2); cg.addColorStop(0, '#c040d0'); cg.addColorStop(1, '#601870'); rrect(v, pcx - pw / 2, pcy - ph / 2, pw, ph, 16, cg);
        rect(v, pcx - pw / 2 + 8, pcy - 2, pw - 16, 3, '#e8e0f0'); for (let i = 0; i < 26; i++) rect(v, pcx - pw / 2 + 10 + i * 4, pcy - 3, 2, 5, '#a0a0b0'); rrect(v, pcx + pw / 2 - 18, pcy - 6, 10, 12, 3, '#d8d8e8');
        matRect(B, pcx, pcy, pw, ph, SOLID);
        // calculator on the right desk
        const kx = 1000, ky = 330; shadowLocal(B, kx - 60, ky - 70, 140, 160, g => g.fillRect(kx - 40, ky - 56, 80, 112), 7, 9, 0.4);
        rrect(v, kx - 40, ky - 56, 80, 112, 6, '#3a3a44'); rect(v, kx - 32, ky - 48, 64, 22, '#98a888'); TV.font.draw(v, '58008', kx - 28, ky - 42, '#2a3a2a', 2);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) rrect(v, kx - 32 + c * 17, ky - 18 + r * 17, 13, 12, 2, c === 3 ? '#d86a2a' : '#b8b8c4');
        matRect(B, kx, ky, 80, 112, SOLID);
        // an exercise book, open (homework, not done)
        v.save(); v.translate(880, 640); v.rotate(-0.08); rect(v, -66, -46, 140, 100, 'rgba(0,0,0,.3)'); rect(v, -70, -50, 140, 100, '#f8f8f0'); rect(v, -2, -50, 4, 100, '#d0d0c8');
        for (let k = 0; k < 9; k++) { rect(v, -66, -38 + k * 10, 62, 1, '#a0b8e8'); rect(v, 4, -38 + k * 10, 62, 1, '#a0b8e8'); } rect(v, -58, -50, 1, 100, '#e86a6a'); rect(v, 12, -50, 1, 100, '#e86a6a');
        TV.font.draw(v, 'MATHS', -52, -46, '#3040a0', 1); TV.font.draw(v, '2+2=5?', -50, -26, '#3040a0', 1); TV.font.draw(v, 'SEE ME', 20, 20, '#d02020', 1); v.restore();
        // a set square
        v.save(); v.translate(1010, 760); v.globalAlpha = 0.75; poly(v, [0, 0, 120, 0, 0, 80], '#90d0f0'); v.globalCompositeOperation = 'destination-out'; poly(v, [16, 12, 70, 12, 16, 48], '#000'); v.restore();
      },
    },
    // ---------------------------------------------------------------- 3. the garden pond
    pond: {
      chev: 'rgba(255,255,255,.35)', bandM: BUMP, borderStep: 3, kerb: 'rgba(220,245,255,.4)', kerbIn: 'rgba(255,255,255,.1)', lane: 'rgba(0,30,40,.08)',
      base(B) {
        const { v, m, T } = B; B.floor = null;
        T.outMat = SOLID;
        // the pond: a wobbly blob
        const cx = 620, cy = 455, P = [];
        for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, r = 1 + Math.sin(a * 3 + 0.5) * 0.04 + Math.sin(a * 5 + 1) * 0.03; P.push([cx + Math.cos(a) * 560 * r, cy + Math.sin(a) * 400 * r]); }
        B.pondP = P;
        const blob = (g, k) => { g.beginPath(); P.forEach(([x, y], i) => { const X = cx + (x - cx) * k, Y = cy + (y - cy) * k; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); };
        // grass all round
        pix(B.cv, (x, y, o) => { const k = 0.7 + hash(x, y, 3) * 0.25 + vn(x, y, 30, 5) * 0.3 + (hash(x, y >> 1, 4) > 0.8 ? 0.15 : 0); o[0] = 54 * k; o[1] = 136 * k; o[2] = 44 * k; });
        // water: deeper in the middle
        const wc = mkc(T.ww, T.wh); pix(wc, (x, y, o) => { const d = Math.min(1, Math.hypot((x - cx) / 560, (y - cy) / 400)); const n = vn(x, y, 40, 9) * 0.25 + vn(x, y, 9, 2) * 0.1; const k = 0.62 + d * 0.4 + n; o[0] = 30 * k; o[1] = 96 * k; o[2] = 104 * k; if (vn(x * 1.4, y * 3, 14, 6) > 0.8) { o[0] += 40; o[1] += 50; o[2] += 50; } });
        const wg = wc.getContext('2d'); wg.globalCompositeOperation = 'destination-in'; blob(wg, 1); wg.fill();
        // shadow of the bank on the water edge, then the stones
        v.drawImage(wc, 0, 0); v.save(); blob(v, 1); v.clip(); v.lineWidth = 30; v.strokeStyle = 'rgba(0,20,10,.35)'; blob(v, 1); v.stroke(); v.restore();
        for (let i = 0; i < 64 * 3; i++) { const a = i / (64 * 3) * TAU, r = 1 + Math.sin(a * 3 + 0.5) * 0.04 + Math.sin(a * 5 + 1) * 0.03, j = hash(i, 1, 12); const x = cx + Math.cos(a) * (560 * r + 6 + j * 6), y = cy + Math.sin(a) * (400 * r + 6 + j * 6), s = 9 + hash(i, 2, 12) * 6; ell(v, x + 3, y + 4, s, s * 0.8, 'rgba(0,0,0,.35)'); ell(v, x, y, s, s * 0.8, '#8a8a80'); ell(v, x - 2, y - 2, s * 0.7, s * 0.55, '#b4b4a8'); ell(v, x - 3, y - 3, s * 0.3, s * 0.2, '#d8d8cc'); }
        m.fillStyle = MC(SOLID); m.fillRect(0, 0, T.ww, T.wh); m.fillStyle = MC(ROUGH); blob(m, 0.985); m.fill();
        // flowers in the grass
        for (let i = 0; i < 140; i++) { const x = hash(i, 1, 44) * T.ww, y = hash(i, 2, 44) * T.wh; if (Math.hypot((x - cx) / 600, (y - cy) / 440) < 1.02) continue; const c = ['#f8f8f8', '#f8d020', '#e85a8a'][i % 3]; for (let k = 0; k < 5; k++) circ(v, x + Math.cos(k * 1.26) * 2.4, y + Math.sin(k * 1.26) * 2.4, 1.6, c); circ(v, x, y, 1.2, '#f8a018'); }
      },
      off(B, g) { // pondweed
        for (let i = 0; i < 1500; i++) { const x = hash(i, 1, 51) * B.T.ww, y = hash(i, 2, 51) * B.T.wh, a = hash(i, 3, 51) * TAU, L = 6 + hash(i, 4, 51) * 10; g.strokeStyle = i % 3 ? '#3a7a30' : '#5a9a38'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * L, y + Math.sin(a + 0.6) * L, x + Math.cos(a) * L * 1.6, y + Math.sin(a) * L * 1.6); g.stroke(); }
        g.globalCompositeOperation = 'destination-in'; g.beginPath(); B.pondP.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
      },
      bandV: null,
      roadV(B) { return 'rgba(120,200,210,.12)'; },
      border(B, x, y, a, side, k) { // lily pads and the odd reed clump
        const v = B.v, r = hash(k, side + 3, 61);
        if (r < 0.62) { const s = 7 + hash(k, 1, 62) * 4, ang = hash(k, 2, 62) * TAU; ell(v, x + 2, y + 3, s, s * 0.9, 'rgba(0,30,20,.35)'); v.fillStyle = '#2a8a30'; v.beginPath(); v.moveTo(x, y); v.arc(x, y, s, ang + 0.4, ang + TAU - 0.1); v.closePath(); v.fill(); v.fillStyle = '#58b848'; v.beginPath(); v.moveTo(x, y); v.arc(x, y, s * 0.75, ang + 0.6, ang + TAU - 0.3); v.closePath(); v.fill(); rect(v, x - 1, y - 1, 2, 2, '#1a5a20'); if (r < 0.1) { circ(v, x + 2, y - 2, 3, '#f8a0c0'); circ(v, x + 2, y - 2, 1.4, '#fff0a0'); } }
        else if (r < 0.8) { for (let j = 0; j < 6; j++) { const dx = (hash(k, j, 63) - 0.5) * 10, dy = (hash(k, j + 9, 63) - 0.5) * 10; rect(v, x + dx, y + dy - 6, 2, 9, '#2a6a20'); rect(v, x + dx, y + dy - 7, 2, 3, '#7a4a20'); } }
      },
      props(B) {
        const { v, S } = B;
        // the island with the fishing gnome
        const ix = 640, iy = 450;
        ell(v, ix + 8, iy + 10, 120, 80, 'rgba(0,20,10,.4)');
        ell(v, ix, iy, 118, 78, '#7a6a4a'); pix(B.cv, (x, y, o) => { const d = ((x - ix) / 112) ** 2 + ((y - iy) / 72) ** 2; if (d > 1) return false; const k = 0.7 + hash(x, y, 31) * 0.25 + vn(x, y, 12, 4) * 0.25; o[0] = 70 * k; o[1] = 140 * k; o[2] = 48 * k; }, ix - 120, iy - 80, 240, 160);
        for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; ell(v, ix + Math.cos(a) * 114, iy + Math.sin(a) * 75, 9, 7, '#9a9a90'); ell(v, ix + Math.cos(a) * 112 - 2, iy + Math.sin(a) * 73 - 2, 5, 4, '#c8c8bc'); }
        matEll(B, ix, iy, 120, 80, 0, SOLID);
        // the gnome: red hat, white beard, a fishing rod
        const gx = ix - 20, gy = iy - 6;
        ell(v, gx + 4, gy + 6, 16, 10, 'rgba(0,0,0,.35)'); circ(v, gx, gy, 13, '#3a60c8'); circ(v, gx - 2, gy + 2, 9, '#f4f4f0'); circ(v, gx - 4, gy - 4, 6, '#f0b090');
        poly(v, [gx - 12, gy - 6, gx + 6, gy - 10, gx - 10, gy - 30], '#d82818'); poly(v, [gx - 9, gy - 8, gx + 2, gy - 10, gx - 9, gy - 26], '#f05040');
        v.strokeStyle = '#6a4020'; v.lineWidth = 2; v.beginPath(); v.moveTo(gx + 8, gy); v.lineTo(gx + 60, gy - 40); v.stroke(); v.strokeStyle = 'rgba(255,255,255,.6)'; v.lineWidth = 1; v.beginPath(); v.moveTo(gx + 60, gy - 40); v.lineTo(gx + 74, gy - 2); v.stroke(); circ(v, gx + 74, gy - 2, 3, '#e83020');
        // a little frog on a pad, a watering can on the bank
        B.deco.push({ k: 'frog', x: ix + 64, y: iy + 30 });
        // the jump: a plank, then a log across the bottom straight
        const [px, py, pa, pi] = along(B, 0.6, 0), log = S.N;
        const ca = Math.cos(pa), sa = Math.sin(pa);
        const ax = px - ca * 50, ay = py - sa * 50, bx = px - ca * 4, by = py - sa * 4;
        v.save(); v.translate(ax, ay); v.rotate(pa); v.fillStyle = 'rgba(0,20,10,.35)'; v.fillRect(4, -36, 50, 80); rect(v, 0, -38, 48, 76, '#a8783a'); for (let k = 0; k < 4; k++) rect(v, 0, -38 + k * 19, 48, 2, '#6a4420'); rect(v, 0, -38, 48, 3, '#d8a868'); rect(v, 44, -38, 4, 76, '#c89858'); v.restore();
        addRamp(B, ax, ay, bx, by, 76, 18);
        // the log
        const lx = px + ca * 30, ly = py + sa * 30;
        v.save(); v.translate(lx, ly); v.rotate(pa + Math.PI / 2); v.fillStyle = 'rgba(0,20,10,.4)'; v.fillRect(-60, -6, 128, 22);
        const lg = v.createLinearGradient(0, -11, 0, 11); lg.addColorStop(0, '#a8784a'); lg.addColorStop(0.5, '#7a4a20'); lg.addColorStop(1, '#3a2010'); v.fillStyle = lg; v.fillRect(-62, -11, 124, 22);
        for (let k = 0; k < 9; k++) rect(v, -58 + k * 14, -9 + (k % 3) * 5, 8, 2, '#5a3416'); ell(v, -62, 0, 4, 11, '#c8a070'); ell(v, -62, 0, 2, 6, '#8a6030'); ell(v, 62, 0, 4, 11, '#c8a070'); v.restore();
        matRect(B, lx, ly, 22, 124, SOLID, pa);
        // fish below the surface
        for (let i = 0; i < 4; i++) B.fish.push({ x: 300 + i * 180, y: 300 + (i % 2) * 260, a: i, sp: 0.4 + i * 0.07, c: i % 2 ? '#f87a20' : '#f8d040', s: 1 + (i % 3) * 0.2 });
        // floating lily pads on the open water you can push about
        for (const [x, y] of [[350, 330], [880, 330], [400, 580], [880, 590]]) B.dyn.push({ x, y, hx: x, hy: y, vx: 0, vy: 0, r: 16, kind: 'pad', m: 1.2 });
      },
    },
    // ---------------------------------------------------------------- 4. the bath
    bath: {
      chev: 'rgba(255,255,255,.5)', bandM: BUMP, borderStep: 2, kerb: 'rgba(255,255,255,.55)', kerbIn: 'rgba(255,255,255,.15)', lane: 'rgba(0,40,80,.07)',
      base(B) {
        const { v, m, T } = B; B.floor = null; T.outMat = SOLID;
        // bathroom tiles round the outside
        pix(B.cv, (x, y, o) => { const gx = x % 40, gy = y % 40, gl = gx < 2 || gy < 2; const k = gl ? 0.7 : 0.95 + hash(x >> 2, y >> 2, 3) * 0.05 - (gx + gy) * 0.002; o[0] = 150 * k; o[1] = 200 * k; o[2] = 196 * k; });
        // the tub: enamel rim, then the water
        const ox = 40, oy = 40, ow = 1080, oh = 620;
        rrect(v, ox + 12, oy + 14, ow, oh, 150, 'rgba(0,0,0,.3)');
        const eg = v.createLinearGradient(ox, oy, ox + ow, oy + oh); eg.addColorStop(0, '#ffffff'); eg.addColorStop(1, '#c8d0dc'); rrect(v, ox, oy, ow, oh, 150, eg);
        const ix = 104, iy = 100, iw = 952, ih = 500; B.inner = [ix, iy, iw, ih];
        rrect(v, ix - 6, iy - 6, iw + 12, ih + 12, 116, '#a8b4c4');
        const wc = mkc(T.ww, T.wh); pix(wc, (x, y, o) => { const c1 = Math.abs(Math.sin(x * 0.06 + vn(x, y, 30, 1) * 5) + Math.sin(y * 0.07 + vn(x, y, 26, 2) * 5)); const k = 0.9 + vn(x, y, 50, 4) * 0.15; o[0] = 110 * k; o[1] = 186 * k; o[2] = 216 * k; if (c1 < 0.12) { o[0] += 60; o[1] += 50; o[2] += 30; } }, ix, iy, iw, ih);
        const wg = wc.getContext('2d'); wg.globalCompositeOperation = 'destination-in'; rrect(wg, ix, iy, iw, ih, 110, '#000'); v.drawImage(wc, 0, 0);
        v.save(); rrect(v, ix, iy, iw, ih, 110, 'rgba(0,0,0,0)'); v.clip(); v.lineWidth = 24; v.strokeStyle = 'rgba(30,60,90,.22)'; v.beginPath(); v.roundRect ? v.roundRect(ix, iy, iw, ih, 110) : v.rect(ix, iy, iw, ih); v.stroke(); v.restore();
        m.fillStyle = MC(SOLID); m.fillRect(0, 0, T.ww, T.wh); rrect(m, ix + 4, iy + 4, iw - 8, ih - 8, 106, MC(ROUGH));
        // taps and a shampoo bottle on the rim
        const tx = 1092, ty = 350; rrect(v, tx - 14, ty - 70, 28, 140, 8, 'rgba(0,0,0,.25)'); for (const dy of [-40, 40]) { circ(v, tx, ty + dy, 15, '#a0a8b8'); circ(v, tx - 2, ty + dy - 2, 12, '#e8ecf4'); rect(v, tx - 11, ty + dy - 2, 22, 4, '#a0a8b8'); circ(v, tx, ty + dy, 4, dy < 0 ? '#e03030' : '#3060e0'); }
        rrect(v, tx - 30, ty - 6, 30, 12, 4, '#c0c8d4'); rect(v, tx - 30, ty - 6, 30, 3, '#ffffff');
        rrect(v, 70, 40, 60, 36, 10, '#e858a8'); rect(v, 76, 46, 26, 22, '#f8d0e8'); TV.font.draw(v, 'POO', 79, 52, '#b02878', 1);
        rrect(v, 160, 42, 34, 34, 10, '#f8d020'); rect(v, 168, 50, 18, 18, '#fff4a0');
      },
      off(B, g) { // foam
        const [ix, iy, iw, ih] = B.inner;
        for (let i = 0; i < 2600; i++) { const x = ix + hash(i, 1, 71) * iw, y = iy + hash(i, 2, 71) * ih, r = 2 + hash(i, 3, 71) * 6; circ(g, x + 1, y + 1, r, 'rgba(120,160,190,.6)'); circ(g, x, y, r, '#f4f8fc'); circ(g, x - r * 0.35, y - r * 0.35, r * 0.35, '#ffffff'); }
        g.globalCompositeOperation = 'destination-in'; rrect(g, ix, iy, iw, ih, 110, '#000'); g.globalCompositeOperation = 'source-over';
      },
      bandV: null,
      roadV(B) { return 'rgba(255,255,255,.06)'; },
      border(B, x, y, a, side, k) { const v = B.v; for (let j = 0; j < 2; j++) { const r = 2.5 + hash(k, j, 72) * 3.5, dx = (hash(k, j + 4, 72) - 0.5) * 8, dy = (hash(k, j + 7, 72) - 0.5) * 8; circ(v, x + dx + 1, y + dy + 1, r, 'rgba(60,110,150,.5)'); circ(v, x + dx, y + dy, r, '#eef6fc'); rect(v, x + dx - r * 0.5, y + dy - r * 0.5, 1.5, 1.5, '#ffffff'); } },
      props(B) {
        const { v, S } = B;
        // the plughole (sucks you in) and its chain
        const hx = 168, hy = 350; B.plug = { x: hx, y: hy, r: 80 }; B.fallTop = true;
        circ(v, hx, hy, 18, '#8890a0'); circ(v, hx, hy, 14, '#c8ccd8'); circ(v, hx, hy, 10, '#202830'); for (let i = 0; i < 4; i++) rect(v, hx - 9, hy - 7 + i * 4, 18, 1.6, '#8890a0');
        v.strokeStyle = 'rgba(255,255,255,.35)'; v.lineWidth = 2; for (let i = 0; i < 3; i++) { v.beginPath(); v.arc(hx, hy, 28 + i * 16, i, i + 2.4); v.stroke(); }
        matCircle(B, hx, hy, 9, FALL); B.deco.push({ k: 'swirl', x: hx, y: hy });
        // a bar of soap floating on the racing line (slippy)
        const [sx, sy, sa] = along(B, 0.62, 6);
        v.save(); v.translate(sx, sy); v.rotate(sa + 0.3); v.fillStyle = 'rgba(0,40,80,.25)'; v.fillRect(-20, -9, 46, 26); rrect(v, -22, -12, 44, 24, 10, '#f8c8d8'); rrect(v, -18, -9, 34, 14, 7, '#ffe8f0'); TV.font.draw(v, 'SOAP', -12, -6, '#d888a8', 1); v.restore();
        matEll(B, sx, sy, 36, 24, sa + 0.3, SLIP);
        // a sponge island (solid) in the middle and the duck family (bob about, push them)
        const px = 640, py = 345;
        rrect(v, px - 66, py - 30, 140, 70, 12, 'rgba(0,40,80,.3)'); rrect(v, px - 70, py - 36, 140, 70, 12, '#f8d848'); pix(B.cv, (x, y, o) => { const k = 0.8 + hash(x, y, 9) * 0.25; if (hash(x >> 1, y >> 1, 4) > 0.82) { o[0] = 190; o[1] = 150; o[2] = 40; return; } o[0] = 248 * k; o[1] = 216 * k; o[2] = 72 * k; }, px - 66, py - 32, 132, 62);
        rect(v, px - 70, py + 22, 140, 12, '#30a050'); rect(v, px - 70, py + 22, 140, 3, '#60d070');
        matRect(B, px, py, 140, 70, SOLID);
        for (const [x, y, r] of [[420, 300, 18], [860, 300, 18], [470, 395, 12], [830, 395, 12]]) B.dyn.push({ x, y, hx: x, hy: y, vx: 0, vy: 0, r, kind: 'duck', m: r / 10 });
      },
    },
    // ---------------------------------------------------------------- 5. the pool table in the garage
    pool: {
      chev: 'rgba(255,255,255,.4)', bandM: ROUGH, borderStep: 2, kerb: null, lane: 'rgba(0,0,0,.1)',
      base(B) {
        const { v, m, T } = B; B.floor = floorTile('carpet'); B.fallOK = true; B.fallTop = true; T.outMat = FALL;
        const fx = 50, fy = 50, fw = 1260, fh = 760; B.frame = [fx, fy, fw, fh];
        const cx = 112, cy = 112, cw = 1136, ch = 636; B.cloth = [cx, cy, cw, ch];
        edgeFaces(B, fx, fy, fw, fh, '#5a2a10', '#200a04', 20);
        // the wooden frame
        pix(B.cv, (x, y, o) => { const gr = Math.sin((x + y) * 0.05 + vn(x, y, 30, 3) * 9) * 0.5 + 0.5; const k = 0.75 + gr * 0.2 + hash(x, y, 2) * 0.06; o[0] = 120 * k; o[1] = 58 * k; o[2] = 26 * k; }, fx, fy, fw, fh);
        v.fillStyle = 'rgba(255,220,180,.25)'; v.fillRect(fx, fy, fw, 3); v.fillRect(fx, fy, 3, fh);
        for (const [x, y] of [[fx + 30, fy + 18], [fx + fw / 4, fy + 18], [fx + fw / 2, fy + 18], [fx + fw * 0.75, fy + 18], [fx + fw - 30, fy + 18], [fx + fw / 4, fy + fh - 18], [fx + fw * 0.75, fy + fh - 18], [fx + 18, fy + fh / 2], [fx + fw - 18, fy + fh / 2]]) { ell(v, x, y, 5, 3, '#e8d090'); ell(v, x - 1, y - 1, 2, 1, '#fff8d0'); }
        // cushions then the baize
        rect(v, cx - 14, cy - 14, cw + 28, ch + 28, '#0e5a28'); rect(v, cx - 14, cy - 14, cw + 28, 4, '#2a8a48');
        pix(B.cv, (x, y, o) => { const k = 0.9 + hash(x, y, 4) * 0.08 + vn(x, y, 60, 7) * 0.08 - Math.hypot(x - 680, y - 430) / 3000; o[0] = 26 * k; o[1] = 128 * k; o[2] = 60 * k; }, cx, cy, cw, ch);
        // lamp light: brighter in the middle
        const lg = v.createRadialGradient(680, 430, 50, 680, 430, 700); lg.addColorStop(0, 'rgba(255,255,220,.14)'); lg.addColorStop(1, 'rgba(0,0,0,.18)'); v.fillStyle = lg; v.fillRect(cx, cy, cw, ch);
        rect(v, cx, cy, cw, 5, 'rgba(0,0,0,.25)'); rect(v, cx, cy, 5, ch, 'rgba(0,0,0,.2)');
        m.fillStyle = MC(FALL); m.fillRect(0, 0, T.ww, T.wh); m.fillStyle = MC(SOLID); m.fillRect(fx, fy, fw, fh); m.fillStyle = MC(ROUGH); m.fillRect(cx, cy, cw, ch);
        // the pockets (a long way down)
        B.pockets = [[cx + 4, cy + 4], [cx + cw / 2, cy - 4], [cx + cw - 4, cy + 4], [cx + 4, cy + ch - 4], [cx + cw / 2, cy + ch + 4], [cx + cw - 4, cy + ch - 4]];
        for (const [x, y] of B.pockets) { circ(v, x, y, 30, '#3a2a1a'); circ(v, x, y, 26, '#c8a040'); circ(v, x, y, 23, '#0a0806'); circ(v, x + 4, y + 4, 16, '#000000'); matCircle(B, x, y, 22, FALL); }
        // chalk dust here and there
        for (let i = 0; i < 40; i++) { const x = cx + hash(i, 1, 81) * cw, y = cy + hash(i, 2, 81) * ch; v.fillStyle = 'rgba(120,170,230,.18)'; v.beginPath(); v.ellipse(x, y, 10 + hash(i, 3, 81) * 14, 6, hash(i, 4, 81) * 3, 0, TAU); v.fill(); }
      },
      off(B, g) { const [cx, cy, cw, ch] = B.cloth; g.fillStyle = 'rgba(0,30,10,.28)'; g.fillRect(cx, cy, cw, ch); for (let i = 0; i < 1400; i++) { const x = cx + hash(i, 1, 82) * cw, y = cy + hash(i, 2, 82) * ch; rect(g, x, y, 2, 1, i % 3 ? 'rgba(0,40,10,.5)' : 'rgba(140,190,230,.5)'); } },
      bandV: null,
      roadV(B) { return 'rgba(255,255,230,.06)'; },
      roadTop(B) { const { v, S, T } = B; v.save(); v.setLineDash([10, 8]); v.lineWidth = 2; v.strokeStyle = 'rgba(240,250,255,.8)'; for (const s of [-1, 1]) { v.beginPath(); for (let i = 0; i <= S.N; i++) { const j = i % S.N, x = S.X[j] + S.NX[j] * s * (T.rw / 2 + 1), y = S.Y[j] + S.NY[j] * s * (T.rw / 2 + 1); i ? v.lineTo(x, y) : v.moveTo(x, y); } v.stroke(); } v.restore(); },
      border(B, x, y, a, side, k) { if (k % 7) return; const v = B.v, cols = ['#e82818', '#f8d018', '#e82818', '#f8d018', '#101010']; const c = cols[(k / 7 + (side > 0 ? 1 : 0)) % 5]; ball(v, x, y, 7, c); matCircle(B, x, y, 7, SOLID); },
      props(B) {
        const { v } = B;
        // the racked balls in the middle (a solid lump), the black, the cue ball, chalk
        const rx = 760, ry = 400;
        for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) { const x = rx + r * 13, y = ry + (c - r / 2) * 15; ball(v, x, y, 7.4, (r === 2 && c === 1) ? '#101010' : (r + c) % 2 ? '#e82818' : '#f8d018'); matCircle(B, x, y, 8, SOLID); }
        v.strokeStyle = '#6a3a18'; v.lineWidth = 4; v.beginPath(); v.moveTo(rx - 12, ry); v.lineTo(rx + 66, ry - 44); v.lineTo(rx + 66, ry + 44); v.closePath(); v.stroke();
        ball(v, 560, 410, 7.4, '#f8f8f0'); matCircle(B, 560, 410, 8, SOLID);
        // the cue lying across the middle
        v.save(); v.translate(420, 470); v.rotate(-0.25); v.fillStyle = 'rgba(0,0,0,.3)'; v.fillRect(6, 4, 330, 8);
        const cg = v.createLinearGradient(0, -5, 0, 5); cg.addColorStop(0, '#f8d8a0'); cg.addColorStop(1, '#8a5a28'); v.fillStyle = cg; v.beginPath(); v.moveTo(0, -2); v.lineTo(220, -3.5); v.lineTo(330, -5); v.lineTo(330, 5); v.lineTo(220, 3.5); v.lineTo(0, 2); v.fill();
        rect(v, 220, -3.5, 110, 7, '#2a1a10'); rect(v, -3, -2, 4, 4, '#3060c0'); v.restore();
        v.save(); v.translate(420, 470); v.rotate(-0.25); v.restore(); B.m.save(); B.m.translate(420, 470); B.m.rotate(-0.25); B.m.fillStyle = MC(SOLID); B.m.fillRect(0, -4, 330, 8); B.m.restore();
        // chalk cube
        const kx = 940, ky = 450; rect(v, kx + 3, ky + 4, 16, 16, 'rgba(0,0,0,.35)'); rect(v, kx - 8, ky - 8, 16, 16, '#3070d0'); rect(v, kx - 8, ky - 8, 16, 3, '#80b0ff'); rect(v, kx - 4, ky - 4, 8, 8, '#a0c8ff'); matRect(B, kx, ky, 16, 16, SOLID);
        // a can of pop on the frame and a scrap of paper with the scores
        circ(v, 1290, 120, 12, 'rgba(0,0,0,.35)'); circ(v, 1286, 116, 12, '#d02020'); circ(v, 1286, 116, 9, '#c0c4cc'); circ(v, 1288, 114, 2, '#505860');
        v.save(); v.translate(70, 380); v.rotate(-0.1); rect(v, 0, 0, 40, 60, '#f8f4e0'); TV.font.draw(v, 'DAD', 3, 4, '#3040a0', 1); TV.font.draw(v, 'IIII', 3, 14, '#3040a0', 1); TV.font.draw(v, 'ME', 3, 30, '#3040a0', 1); TV.font.draw(v, 'II', 3, 40, '#3040a0', 1); v.restore();
      },
    },
    // ---------------------------------------------------------------- 6. the sandpit
    sand: {
      chev: 'rgba(120,70,20,.5)', bandM: BUMP, borderStep: 2, kerb: 'rgba(110,70,30,.5)', kerbIn: 'rgba(255,240,200,.25)',
      base(B) {
        const { v, m, T } = B; B.floor = null; T.outMat = SOLID;
        // lawn round the outside
        pix(B.cv, (x, y, o) => { const k = 0.72 + hash(x, y, 13) * 0.25 + vn(x, y, 24, 8) * 0.25; o[0] = 56 * k; o[1] = 138 * k; o[2] = 42 * k; });
        const fx = 30, fy = 30, fw = 1180, fh = 840, t = 34; B.pit = [fx + t, fy + t, fw - t * 2, fh - t * 2];
        rect(v, fx + 10, fy + 12, fw, fh, 'rgba(0,0,0,.3)');
        pix(B.cv, (x, y, o) => { const horiz = (y < fy + t || y >= fy + fh - t); const u = horiz ? y : x; const gr = Math.sin((horiz ? x : y) * 0.08 + vn(x, y, 30, 4) * 7) * 0.5 + 0.5; const k = 0.75 + gr * 0.15 + hash(x, y, 5) * 0.08 - ((u - (horiz ? (y < fy + t ? fy : fy + fh - t) : (x < fx + t ? fx : fx + fw - t))) / t) * 0.15; o[0] = 196 * k; o[1] = 132 * k; o[2] = 70 * k; }, fx, fy, fw, fh);
        const [px, py, pw, ph] = B.pit;
        pix(B.cv, (x, y, o) => { const rp = Math.sin(x * 0.12 + y * 0.05 + vn(x, y, 40, 2) * 6) * 0.5 + 0.5; const k = 0.86 + hash(x, y, 6) * 0.12 + rp * 0.06 + vn(x, y, 70, 9) * 0.08; o[0] = 232 * k; o[1] = 196 * k; o[2] = 124 * k; }, px, py, pw, ph);
        rect(v, px, py, pw, 8, 'rgba(60,30,0,.25)'); rect(v, px, py, 8, ph, 'rgba(60,30,0,.2)');
        for (const [x, y] of [[fx + 4, fy + 4], [fx + fw - 34, fy + 4], [fx + 4, fy + fh - 34], [fx + fw - 34, fy + fh - 34]]) { rect(v, x, y, 30, 30, '#8a5a30'); circ(v, x + 15, y + 15, 3, '#c0c0c8'); }
        m.fillStyle = MC(SOLID); m.fillRect(0, 0, T.ww, T.wh); m.fillStyle = MC(ROUGH); m.fillRect(px, py, pw, ph);
      },
      off(B, g) { const [px, py, pw, ph] = B.pit; for (let i = 0; i < 1600; i++) { const x = px + hash(i, 1, 91) * pw, y = py + hash(i, 2, 91) * ph; ell(g, x, y, 4 + hash(i, 3, 91) * 5, 2, i % 2 ? 'rgba(255,240,190,.45)' : 'rgba(150,110,50,.3)', 0.2); } },
      bandV: 'rgba(120,80,30,.25)',
      roadV(B) { const c = mkc(64, 64); pix(c, (x, y, o) => { const k = 0.9 + hash(x, y, 14) * 0.1; o[0] = 196 * k; o[1] = 150 * k; o[2] = 92 * k; }); return B.v.createPattern(c, 'repeat'); },
      roadTop(B) { const { v, S, T } = B; v.save(); v.lineWidth = 3; v.strokeStyle = 'rgba(110,70,30,.3)'; for (const s of [-12, -6, 6, 12]) { v.beginPath(); for (let i = 0; i <= S.N; i += 2) { const j = i % S.N, x = S.X[j] + S.NX[j] * s, y = S.Y[j] + S.NY[j] * s; i ? v.lineTo(x, y) : v.moveTo(x, y); } v.stroke(); } v.restore(); },
      border(B, x, y, a, side, k) { const v = B.v, r = hash(k, side + 2, 93); if (r < 0.75) { const s = 3 + hash(k, 1, 94) * 3, c = ['#9a9488', '#c8c0b0', '#7a7468', '#e8e0d0'][k % 4]; ell(v, x + 1.5, y + 2, s, s * 0.8, 'rgba(70,40,10,.35)'); ell(v, x, y, s, s * 0.8, c); ell(v, x - s * 0.3, y - s * 0.3, s * 0.4, s * 0.3, '#f8f4ec'); } else { v.save(); v.translate(x, y); v.rotate(hash(k, 3, 94) * 6); v.fillStyle = '#f8d8c8'; v.beginPath(); v.moveTo(0, -5); v.lineTo(5, 3); v.lineTo(-5, 3); v.closePath(); v.fill(); v.strokeStyle = '#d0907a'; v.lineWidth = 1; for (let j = -3; j <= 3; j += 2) { v.beginPath(); v.moveTo(0, -4); v.lineTo(j, 3); v.stroke(); } v.restore(); } },
      props(B) {
        const { v, S } = B;
        // the moat across the bottom-right straight, with a spade to jump it
        const [mx, my, ma] = along(B, 0.33, 0); const ca = Math.cos(ma), sa = Math.sin(ma);
        const ox = mx + ca * 34, oy = my + sa * 34;
        v.save(); v.translate(ox, oy); v.rotate(ma); rect(v, -18, -60, 36, 120, '#8a6a3a'); const wg = v.createLinearGradient(-14, 0, 14, 0); wg.addColorStop(0, '#2a5a7a'); wg.addColorStop(1, '#5a9ab8'); v.fillStyle = wg; v.fillRect(-14, -58, 28, 116); rect(v, -14, -58, 4, 116, 'rgba(0,0,0,.25)'); for (let k = 0; k < 6; k++) rect(v, -8 + (k % 2) * 8, -50 + k * 18, 6, 1, 'rgba(255,255,255,.6)'); v.restore();
        matRect(B, ox, oy, 28, 116, STICKY, ma);
        const ax = mx - ca * 48, ay = my - sa * 48, bx = mx + ca * 10, by = my + sa * 10;
        v.save(); v.translate(ax, ay); v.rotate(ma); v.fillStyle = 'rgba(80,40,0,.35)'; v.fillRect(6, -26, 60, 60);
        rrect(v, 0, -28, 62, 56, 8, '#2a8ae8'); rrect(v, 4, -24, 54, 48, 6, '#5ab0ff'); rect(v, 6, -22, 50, 4, '#a0d8ff'); for (let k = 0; k < 3; k++) rect(v, 12 + k * 14, -18, 2, 36, '#2a70c0');
        rect(v, -60, -4, 62, 8, '#f8d020'); rect(v, -60, -4, 62, 2, '#fff090'); rrect(v, -74, -10, 16, 20, 5, '#f8d020'); v.restore();
        addRamp(B, ax, ay, bx, by, 58, 18);
        // the bucket and sandcastles
        const castle = (x, y, s) => { ell(v, x + 8, y + 9, 26 * s, 22 * s, 'rgba(90,50,10,.35)'); for (const [dx, dy] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) { circ(v, x + dx * s, y + dy * s, 10 * s, '#c89a58'); circ(v, x + dx * s - 2, y + dy * s - 2, 7 * s, '#e8c080'); } rect(v, x - 14 * s, y - 14 * s, 28 * s, 28 * s, '#d8aa68'); rect(v, x - 8 * s, y - 8 * s, 16 * s, 16 * s, '#e8c080'); rect(v, x, y - 30 * s, 1.5, 22 * s, '#5a3a1a'); poly(v, [x + 1.5, y - 30 * s, x + 14 * s, y - 26 * s, x + 1.5, y - 22 * s], '#e83030'); matCircle(B, x, y, 22 * s, SOLID); };
        castle(450, 560, 1.3); castle(860, 360, 1.1); castle(250, 300, 1);
        const kx = 900, ky = 560; ell(v, kx + 10, ky + 12, 44, 40, 'rgba(90,50,10,.35)'); circ(v, kx, ky, 42, '#d82838'); circ(v, kx, ky, 36, '#a81828'); circ(v, kx - 4, ky - 4, 30, '#e8c080'); v.strokeStyle = '#f8f8f8'; v.lineWidth = 3; v.beginPath(); v.arc(kx, ky, 46, 0.2, Math.PI - 0.2); v.stroke(); matCircle(B, kx, ky, 42, SOLID);
        // a toy digger
        const dx = 620, dy = 210; v.save(); v.translate(dx, dy); rect(v, -26, -14, 60, 34, 'rgba(90,50,10,.35)'); rect(v, -30, -20, 56, 30, '#f8b818'); rect(v, -30, -20, 56, 4, '#fff080'); rect(v, -6, -16, 22, 22, '#3a3a40'); rect(v, -2, -12, 14, 12, '#a0c8e8'); rect(v, -34, 8, 64, 8, '#202020'); for (let k = 0; k < 6; k++) rect(v, -32 + k * 11, 9, 6, 6, '#5a5a60'); rect(v, 26, -10, 34, 6, '#f8b818'); rect(v, 54, -16, 12, 18, '#9a9aa0'); v.restore(); matRect(B, dx + 10, dy - 4, 100, 36, SOLID);
        // a damp patch (sticky) on the inside of the hairpin
        const [wx, wy] = along(B, 0.7, 0); ell(v, wx, wy, 30, 22, 'rgba(120,80,30,.55)'); ell(v, wx - 6, wy - 4, 16, 10, 'rgba(90,60,20,.5)'); matEll(B, wx, wy, 28, 20, 0, STICKY);
      },
    },
  };
  // ---------------------------------------------------------------- more clutter, at toy scale (all off the racing line)
  function shadowOf(B, x, y, w, h, fn) { shadowLocal(B, x - w / 2 - 20, y - h / 2 - 20, w + 40, h + 40, fn, 7, 9, 0.38); }
  const EXTRA = {
    bfast(B) {
      const { v } = B;
      // a milk carton in the top-left corner (tall, so a long shadow)
      const mx = 100, my = 112; shadowLocal(B, mx - 40, my - 60, 120, 140, g => g.fillRect(mx - 22, my - 34, 44, 68), 14, 18, 0.42);
      rect(v, mx - 22, my - 34, 44, 68, '#2a5ad8'); rect(v, mx - 22, my - 34, 44, 10, '#f0f4ff'); rect(v, mx - 18, my - 36, 36, 4, '#d8dce8'); rect(v, mx - 16, my - 18, 32, 40, '#f8f8ff'); rect(v, mx + 16, my - 34, 6, 68, '#1a3a98');
      TV.font.draw(v, 'MILK', mx - 12, my - 12, '#2a5ad8', 1); TV.font.draw(v, 'FULL', mx - 12, my - 2, '#2a5ad8', 1); TV.font.draw(v, 'FAT', mx - 9, my + 8, '#2a5ad8', 1); circ(v, mx, my + 14, 4, '#e03030');
      matRect(B, mx, my, 44, 68, SOLID);
      // a plate of beans down in the middle
      const bx = 600, by = 740; shadowOf(B, bx, by, 130, 130, g => circ(g, bx, by, 64, '#000'));
      const pg = v.createRadialGradient(bx - 24, by - 24, 10, bx, by, 64); pg.addColorStop(0, '#ffffff'); pg.addColorStop(1, '#b8c0d0'); v.fillStyle = pg; v.beginPath(); v.arc(bx, by, 64, 0, TAU); v.fill();
      v.strokeStyle = '#4070c8'; v.lineWidth = 2; v.beginPath(); v.arc(bx, by, 56, 0, TAU); v.stroke(); circ(v, bx, by, 44, '#c84a18');
      for (let i = 0; i < 70; i++) { const a = hash(i, 1, 77) * TAU, d = Math.sqrt(hash(i, 2, 77)) * 40; ell(v, bx + Math.cos(a) * d, by + Math.sin(a) * d, 3.2, 2.4, '#e8702a', a); rect(v, bx + Math.cos(a) * d - 1, by + Math.sin(a) * d - 1, 1, 1, '#ffb080'); }
      v.save(); v.translate(bx + 46, by - 30); v.rotate(0.6); rect(v, -3, -40, 6, 40, '#d0d4dc'); rect(v, -3, -40, 2, 40, '#ffffff'); ell(v, 0, 6, 7, 10, '#d0d4dc'); ell(v, -1, 5, 4, 6, '#c84a18'); v.restore();
      matCircle(B, bx, by, 64, SOLID);
      // salt and pepper up by the top edge, and a second mug top right
      for (const [sx, col] of [[560, '#f4f4f0'], [596, '#404048']]) { shadowOf(B, sx, 80, 28, 28, g => circ(g, sx, 80, 12, '#000')); circ(v, sx, 80, 12, col); circ(v, sx, 80, 8, col === '#f4f4f0' ? '#ffffff' : '#606068'); for (let k = 0; k < 5; k++) rect(v, sx - 4 + (k % 3) * 3, 76 + (k >> 1) * 3, 1, 1, '#202020'); matCircle(B, sx, 80, 12, SOLID); }
      const ux = 1180, uy = 96; shadowLocal(B, ux - 50, uy - 50, 110, 110, g => circ(g, ux, uy, 28, '#000'), 9, 11, 0.4);
      circ(v, ux, uy, 28, '#d83030'); circ(v, ux, uy, 23, '#f0d0d0'); circ(v, ux, uy, 20, '#3a2010'); circ(v, ux - 6, uy - 6, 7, '#6a4a2a'); rrect(v, ux - 42, uy - 7, 16, 14, 5, '#d83030'); rrect(v, ux - 38, uy - 3, 8, 6, 3, '#6a4a2a');
      TV.font.draw(v, 'MOM', ux - 9, uy + 30, '#f8f8f8', 1); matCircle(B, ux, uy, 28, SOLID); B.deco.push({ k: 'steam', x: ux, y: uy });
      // a teaspoon bottom right, a banana bottom left
      v.save(); v.translate(1160, 790); v.rotate(-0.2); shadowLocal(B, 1100, 760, 130, 60, g => { g.save(); g.translate(1160, 790); g.rotate(-0.2); g.fillRect(-28, -4, 56, 8); g.restore(); }, 4, 5, 0.35); rect(v, -28, -3, 36, 6, '#d0d4dc'); rect(v, -28, -3, 36, 2, '#ffffff'); ell(v, 16, 0, 10, 7, '#d0d4dc'); ell(v, 15, -1, 6, 4, '#a0a8b8'); v.restore(); matRect(B, 1160, 790, 56, 12, SOLID, -0.2);
      const nx = 100, ny = 800; shadowOf(B, nx, ny, 70, 30, g => { g.save(); g.translate(nx, ny); g.rotate(-0.3); g.fillRect(-32, -9, 64, 18); g.restore(); });
      v.save(); v.translate(nx, ny); v.rotate(-0.3); v.fillStyle = '#f0c820'; v.beginPath(); v.moveTo(-32, -2); v.quadraticCurveTo(0, -18, 32, -2); v.quadraticCurveTo(0, 12, -32, -2); v.fill(); v.fillStyle = '#c89010'; v.beginPath(); v.moveTo(-30, -2); v.quadraticCurveTo(0, 10, 30, -2); v.quadraticCurveTo(0, 6, -30, -2); v.fill(); rect(v, 30, -5, 5, 5, '#4a3010'); rect(v, -34, -3, 4, 3, '#6a4a20'); v.restore();
      matEll(B, nx, ny, 32, 9, -0.3, SOLID);
    },
    desk(B) {
      const { v } = B;
      // pencil shavings, a protractor, a glue stick and a compass on the left desk
      const sx = 480, sy = 520; for (let i = 0; i < 14; i++) { const a = hash(i, 1, 55) * TAU, d = hash(i, 2, 55) * 22, x = sx + Math.cos(a) * d, y = sy + Math.sin(a) * d; v.save(); v.translate(x, y); v.rotate(hash(i, 3, 55) * 6); v.fillStyle = '#e8c890'; v.beginPath(); v.arc(0, 0, 7, 0, 2.6); v.lineTo(0, 0); v.fill(); v.strokeStyle = '#c03030'; v.lineWidth = 1.5; v.beginPath(); v.arc(0, 0, 7, 0.2, 2.4); v.stroke(); v.restore(); }
      const px = 520, py = 400; shadowOf(B, px, py, 90, 50, g => { g.beginPath(); g.arc(px, py + 10, 44, Math.PI, 0); g.closePath(); g.fill(); });
      v.fillStyle = 'rgba(200,230,250,.75)'; v.beginPath(); v.arc(px, py + 10, 44, Math.PI, 0); v.closePath(); v.fill(); v.fillStyle = 'rgba(255,255,255,.3)'; v.beginPath(); v.arc(px, py + 10, 30, Math.PI, 0); v.closePath(); v.fill();
      v.strokeStyle = '#30405a'; v.lineWidth = 1; for (let a = 0; a <= 180; a += 10) { const r = a % 30 ? 38 : 34, t = Math.PI + a / 180 * Math.PI; v.beginPath(); v.moveTo(px + Math.cos(t) * 44, py + 10 + Math.sin(t) * 44); v.lineTo(px + Math.cos(t) * r, py + 10 + Math.sin(t) * r); v.stroke(); }
      rect(v, px - 44, py + 9, 88, 2, '#30405a'); matRect(B, px, py - 10, 88, 40, SOLID);
      const gx = 260, gy = 650; shadowOf(B, gx, gy, 22, 56, g => rrect(g, gx - 11, gy - 28, 22, 56, 6, '#000')); rrect(v, gx - 11, gy - 28, 22, 56, 6, '#f0f0f0'); rrect(v, gx - 11, gy - 28, 22, 14, 6, '#e8402a'); rect(v, gx - 8, gy - 10, 16, 30, '#9a60c8'); TV.font.draw(v, 'GLU', gx - 8, gy - 4, '#ffffff', 1); matRect(B, gx, gy, 22, 56, SOLID);
      const cx = 430, cy = 625; shadowOf(B, cx, cy, 50, 60, g => { g.save(); g.translate(cx, cy); g.rotate(0.3); g.fillRect(-20, -28, 40, 56); g.restore(); });
      v.save(); v.translate(cx, cy); v.rotate(0.3); rect(v, -3, -28, 6, 56, '#c0c4cc'); rect(v, -24, -24, 6, 52, '#c0c4cc'); poly(v, [-24, 28, -18, 28, -21, 34], '#404048'); rect(v, -3, 28, 6, 4, '#f8c818'); circ(v, 0, -28, 5, '#e8402a'); rect(v, -20, -16, 20, 3, '#9a9aa6'); v.restore(); matRect(B, cx, cy, 44, 60, SOLID, 0.3);
      // a stapler, a biro and a sharpener on the right desk
      const tx = 850, ty = 400; shadowOf(B, tx, ty, 64, 26, g => rrect(g, tx - 32, ty - 13, 64, 26, 5, '#000')); rrect(v, tx - 32, ty - 13, 64, 26, 5, '#202028'); rrect(v, tx - 30, ty - 15, 60, 16, 5, '#e8402a'); rect(v, tx - 30, ty - 15, 60, 3, '#ff8a70'); rect(v, tx - 28, ty + 6, 52, 3, '#9a9aa6'); matRect(B, tx, ty, 64, 28, SOLID);
      v.save(); v.translate(760, 320); v.rotate(0.15); shadowLocal(B, 700, 290, 130, 60, g => { g.save(); g.translate(760, 320); g.rotate(0.15); g.fillRect(-44, -4, 88, 8); g.restore(); }, 4, 5, 0.35); rect(v, -44, -3, 80, 6, '#2a3ad8'); rect(v, -44, -3, 80, 2, '#8090ff'); poly(v, [36, -3, 46, 0, 36, 3], '#c0c4cc'); rect(v, -46, -4, 8, 8, '#1a2a98'); rect(v, -30, -5, 40, 2, '#8090ff'); v.restore(); matRect(B, 760, 320, 92, 8, SOLID, 0.15);
      const hx = 1090, hy = 600; shadowOf(B, hx, hy, 20, 14, g => g.fillRect(hx - 10, hy - 7, 20, 14)); rect(v, hx - 10, hy - 7, 20, 14, '#f8c818'); rect(v, hx - 10, hy - 7, 20, 3, '#fff090'); rect(v, hx - 6, hy - 3, 6, 6, '#303038'); rect(v, hx + 2, hy - 2, 7, 1, '#a0a8b8'); matRect(B, hx, hy, 20, 14, SOLID);
    },
    pond(B) {
      const { v } = B;
      // a wooden toy sailboat on the bank, a watering can and a snail
      const bx = 1170, by = 120; shadowOf(B, bx, by, 60, 40, g => { g.beginPath(); g.ellipse(bx, by + 8, 28, 10, 0, 0, TAU); g.fill(); });
      ell(v, bx, by + 8, 28, 9, '#8a5a28'); ell(v, bx, by + 6, 24, 6, '#c08a48'); rect(v, bx - 1, by - 36, 2, 44, '#5a3a18'); poly(v, [bx + 1, by - 34, bx + 24, by - 6, bx + 1, by - 6], '#f0f0f0'); poly(v, [bx - 1, by - 30, bx - 18, by - 8, bx - 1, by - 8], '#e83030'); matEll(B, bx, by + 6, 28, 10, 0, SOLID);
      const wx = 90, wy = 790; shadowOf(B, wx, wy, 70, 50, g => rrect(g, wx - 22, wy - 20, 44, 40, 6, '#000'));
      rrect(v, wx - 22, wy - 20, 44, 40, 6, '#30a050'); rect(v, wx - 22, wy - 20, 44, 5, '#70d080'); rrect(v, wx - 10, wy - 30, 20, 12, 6, '#30a050'); v.strokeStyle = '#30a050'; v.lineWidth = 5; v.beginPath(); v.moveTo(wx + 18, wy - 10); v.lineTo(wx + 40, wy - 28); v.stroke(); circ(v, wx + 42, wy - 30, 7, '#e8c030'); for (let k = 0; k < 5; k++) rect(v, wx + 39 + (k % 3) * 2, wy - 33 + (k >> 1) * 3, 1, 1, '#604010'); matRect(B, wx + 6, wy - 8, 70, 50, SOLID);
      const nx = 1150, ny = 800; ell(v, nx + 2, ny + 3, 16, 9, 'rgba(0,20,0,.35)'); ell(v, nx - 6, ny + 2, 14, 5, '#d8c060'); circ(v, nx + 2, ny - 4, 10, '#a86a30'); circ(v, nx + 2, ny - 4, 6, '#d09050'); circ(v, nx + 3, ny - 5, 2.5, '#a86a30'); rect(v, nx - 20, ny - 10, 1, 8, '#604010'); rect(v, nx - 16, ny - 11, 1, 9, '#604010'); circ(v, nx - 20, ny - 11, 1.5, '#202020'); circ(v, nx - 16, ny - 12, 1.5, '#202020');
    },
    bath(B) {
      const { v } = B;
      // a toy submarine and a bath shark inside the loop, a toothbrush mug on the rim
      const sx = 860, sy = 420; ell(v, sx + 4, sy + 6, 26, 10, 'rgba(0,40,80,.3)'); ell(v, sx, sy, 24, 9, '#f8c818'); ell(v, sx, sy - 1, 20, 5, '#ffe060'); rect(v, sx - 8, sy - 16, 12, 9, '#f8c818'); rect(v, sx - 3, sy - 22, 2, 7, '#404048'); circ(v, sx + 8, sy - 1, 3, '#60c0ff'); circ(v, sx - 4, sy - 1, 3, '#60c0ff'); poly(v, [sx - 24, sy - 8, sx - 30, sy - 12, sx - 30, sy + 4, sx - 24, sy + 2], '#e0a010'); matEll(B, sx, sy - 4, 28, 16, 0, SOLID);
      const kx = 420, ky = 410; ell(v, kx + 4, ky + 6, 30, 11, 'rgba(0,40,80,.3)'); v.save(); v.translate(kx, ky); v.rotate(0.2); ell(v, 0, 0, 28, 9, '#6a8aa8'); ell(v, 4, 2, 20, 5, '#e8f0f8'); poly(v, [-4, -8, 2, -24, 8, -8], '#6a8aa8'); poly(v, [-28, 0, -40, -10, -36, 2, -40, 10], '#6a8aa8'); circ(v, 18, -3, 2.5, '#101018'); for (let k = 0; k < 5; k++) poly(v, [14 + k * 2.6, 3, 15.3 + k * 2.6, 6, 16.6 + k * 2.6, 3], '#ffffff'); v.restore(); matEll(B, kx, ky, 34, 14, 0.2, SOLID);
      const mx = 1090, my = 620; shadowOf(B, mx, my, 30, 30, g => circ(g, mx, my, 14, '#000')); circ(v, mx, my, 14, '#f8f8f8'); circ(v, mx, my, 11, '#c8d0dc'); rect(v, mx - 6, my - 32, 3, 30, '#e83030'); rect(v, mx - 6, my - 36, 3, 6, '#ffffff'); rect(v, mx + 3, my - 28, 3, 26, '#3070e0'); rect(v, mx + 3, my - 32, 3, 6, '#ffffff'); matCircle(B, mx, my, 14, SOLID);
    },
    pool(B) { const { v } = B; for (const [x, y, c] of [[350, 380, '#e82818'], [1000, 330, '#f8d018'], [640, 300, '#e82818']]) { ball(v, x, y, 7.4, c); matCircle(B, x, y, 8, SOLID); } },
    sand(B) {
      const { v } = B;
      // a starfish, shells, a toy rake
      const fx = 700, fy = 620; v.save(); v.translate(fx, fy); v.rotate(0.4); ell(v, 3, 4, 22, 22, 'rgba(90,50,10,.3)'); v.fillStyle = '#e86a3a'; v.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, r = k % 2 ? 8 : 22; v.lineTo(Math.cos(a) * r, Math.sin(a) * r); } v.closePath(); v.fill(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; for (let d = 4; d < 18; d += 4) rect(v, Math.cos(a) * d - 1, Math.sin(a) * d - 1, 2, 2, '#ffb080'); } v.restore(); matCircle(B, fx, fy, 20, SOLID);
      const shell = (x, y, r, c) => { ell(v, x + 2, y + 3, 11, 9, 'rgba(90,50,10,.3)'); v.save(); v.translate(x, y); v.rotate(r); v.fillStyle = c; v.beginPath(); v.moveTo(0, 8); for (let k = 0; k <= 8; k++) { const a = Math.PI + k / 8 * Math.PI; v.lineTo(Math.cos(a) * 11, 2 + Math.sin(a) * 10); } v.closePath(); v.fill(); v.strokeStyle = 'rgba(120,70,40,.6)'; v.lineWidth = 1; for (let k = 1; k < 6; k++) { const a = Math.PI + k / 6 * Math.PI; v.beginPath(); v.moveTo(0, 7); v.lineTo(Math.cos(a) * 10, 2 + Math.sin(a) * 9); v.stroke(); } v.restore(); matCircle(B, x, y, 11, SOLID); };
      shell(980, 330, 0.5, '#f8e0c8'); shell(420, 800, -0.6, '#f0c8b0'); shell(160, 810, 2.5, '#fff0e0'); shell(1010, 100, 1.2, '#f8e0c8');
      const rx = 330, ry = 820; shadowOf(B, rx, ry, 120, 30, g => { g.save(); g.translate(rx, ry); g.rotate(0.05); g.fillRect(-60, -6, 120, 12); g.restore(); });
      v.save(); v.translate(rx, ry); v.rotate(0.05); rect(v, -60, -3, 90, 6, '#e8402a'); rect(v, -60, -3, 90, 2, '#ff9080'); rect(v, 30, -12, 6, 24, '#2a8ae8'); for (let k = 0; k < 6; k++) rect(v, 34, -12 + k * 4.4, 14, 2, '#2a8ae8'); v.restore(); matRect(B, rx, ry, 120, 24, SOLID, 0.05);
    },
  };
  function ball(v, x, y, r, c) { circ(v, x + 2, y + 3, r, 'rgba(0,0,0,.35)'); circ(v, x, y, r, c); circ(v, x + r * 0.3, y + r * 0.3, r * 0.6, 'rgba(0,0,0,.18)'); circ(v, x - r * 0.35, y - r * 0.35, r * 0.3, 'rgba(255,255,255,.75)'); }

  // ================================================================ music (all original): 16th-note steps
  const SONGS = {
    title: { bpm: 144, wave: 'square', bassWave: 'triangle', vol: 0.05, drums: 'o.x.o.x.o.x.oxx.',
      lead: tr('c5 - e5 - g5 - e5 g5 a5 - g5 - e5 - c5 -   d5 - f5 - a5 - f5 a5 c6 - a5 - g5 - - .   c5 - e5 - g5 - c6 - b5 - g5 - e5 - d5 -   c5 - b4 c5 d5 - e5 - c5 - - - . . . .'),
      bass: tr('c3 . c4 . c3 . c4 . c3 . c4 . c3 . c4 .   d3 . d4 . d3 . d4 . f3 . f4 . f3 . f4 .   c3 . c4 . e3 . e4 . g3 . g4 . g3 . g4 .   g2 . g3 . g2 . g3 . c3 . c4 . c3 . c3 .') },
    menu: { bpm: 116, wave: 'triangle', bassWave: 'square', vol: 0.05, drums: 'o...x...o.o.x...',
      lead: tr('f5 - a5 - c6 - a5 - g5 - e5 - c5 - - -   d5 - f5 - a5 - g5 f5 e5 - d5 - c5 - - -   f5 - a5 - c6 - d6 - c6 - a5 - f5 - g5 -   a5 - g5 - f5 - e5 - f5 - - - . . . .'),
      bass: tr('f2 . c3 . f3 . c3 . c2 . g2 . c3 . g2 .   d2 . a2 . d3 . a2 . a#1 . f2 . a#2 . f2 .   f2 . c3 . f3 . c3 . a#1 . f2 . a#2 . f2 .   c2 . g2 . c3 . g2 . f2 . c3 . f2 . . .') },
    r0: { bpm: 160, wave: 'square', bassWave: 'triangle', vol: 0.045, drums: 'o.x.o.xxo.x.o.xx',
      lead: tr('g5 . g5 . d5 . g5 - a5 - b5 . a5 . g5 .   e5 . e5 . c5 . e5 - f#5 - g5 . f#5 . e5 .   d5 . d5 . b4 . d5 - e5 - f#5 . a5 . f#5 .   g5 - - - d5 - b4 - g4 - - - . . . .'),
      bass: tr('g2 . g3 . g2 . g3 . g2 . g3 . g2 . g3 .   c3 . c4 . c3 . c4 . c3 . c4 . c3 . c4 .   d3 . d4 . d3 . d4 . d3 . d4 . d3 . d4 .   g2 . g3 . d3 . d4 . g2 . g3 . g2 . . .') },
    r1: { bpm: 150, wave: 'sawtooth', bassWave: 'square', vol: 0.035, drums: 'o..xo.x.o..xo.xx',
      lead: tr('a4 . c5 . e5 . a5 - g5 . e5 . c5 . d5 .   e5 - - . d5 . c5 . b4 . c5 . d5 - - .   f5 . e5 . d5 . c5 - b4 . c5 . d5 . e5 .   a5 - g5 - e5 - c5 - e5 - - - . . . .'),
      bass: tr('a2 a2 . a3 a2 . a3 . f2 f2 . f3 f2 . f3 .   c3 c3 . c4 c3 . c4 . g2 g2 . g3 g2 . g3 .   d3 d3 . d4 d3 . d4 . e2 e2 . e3 e2 . e3 .   a2 a2 . a3 a2 . a3 . a2 . e2 . a2 . . .') },
    r2: { bpm: 132, wave: 'triangle', bassWave: 'square', vol: 0.055, drums: 'o.....x.o.o...x.',
      lead: tr('d5 - f#5 - a5 - - - f#5 - a5 - d6 - - -   b5 - a5 - f#5 - - - e5 - f#5 - d5 - - -   g5 - b5 - d6 - - - a5 - f#5 - d5 - - -   e5 - f#5 - e5 - c#5 - d5 - - - - - . .'),
      bass: tr('d3 . a3 . d4 . a3 . d3 . a3 . d4 . a3 .   g2 . d3 . g3 . d3 . a2 . e3 . a3 . e3 .   g2 . d3 . g3 . d3 . d3 . a3 . d4 . a3 .   a2 . e3 . a3 . e3 . d3 . a3 . d3 . . .') },
    r3: { bpm: 168, wave: 'square', bassWave: 'sawtooth', vol: 0.04, drums: 'o.x.o.x.o.x.o.xx',
      lead: tr('e5 . e5 g5 . e5 a5 . b5 . a5 g5 . e5 d5 .   e5 . e5 g5 . e5 a5 . b5 - d6 - b5 - - .   c6 . b5 a5 . g5 a5 . b5 . g5 e5 . d5 e5 .   g5 - f#5 - e5 - d5 - e5 - - - . . . .'),
      bass: tr('e2 e3 e2 e3 e2 e3 e2 e3 c2 c3 c2 c3 d2 d3 d2 d3   e2 e3 e2 e3 e2 e3 e2 e3 g2 g3 g2 g3 b1 b2 b1 b2   a1 a2 a1 a2 a1 a2 a1 a2 g1 g2 g1 g2 d2 d3 d2 d3   e2 e3 e2 e3 b1 b2 b1 b2 e2 . e2 . . . . .') },
    champ: { bpm: 176, wave: 'square', bassWave: 'triangle', vol: 0.05, drums: 'oxo.oxo.oxo.oxox',
      lead: tr('c5 e5 g5 c6 - - g5 - a5 - c6 - - - g5 -   f5 a5 c6 f6 - - c6 - d6 - c6 - a#5 - a5 -   g5 - c6 - e6 - d6 - c6 - g5 - e5 - g5 -   c6 - - - g5 - - - c6 - - - . . . .'),
      bass: tr('c3 . c4 . c3 . c4 . c3 . c4 . c3 . c4 .   f2 . f3 . f2 . f3 . f2 . f3 . f2 . f3 .   g2 . g3 . g2 . g3 . g2 . g3 . g2 . g3 .   c3 . g2 . c3 . g2 . c3 . . . c2 . . .') },
  };

  // ================================================================ the cartridge
  const SAVE_V = 1;
  function freshRecs() {
    return {
      name: 'JACK',
      hof: [['CAL', 10850], ['DAVE', 8200], ['JK', 6400], ['LUKE', 5100], ['JACK', 3300], ['MOM', 1250]],
      laps: {}, // filled from LAPREC below
    };
  }
  // best laps on the cartridge before you got your hands on it (seconds; tuned against the robots)
  const LAPREC = {
    bfast: [['CAL', 18.9], ['DAVE', 19.8], ['LUKE', 20.6], ['JK', 21.5], ['JACK', 22.9]],
    desk: [['CAL', 19.7], ['DAVE', 20.6], ['JK', 21.4], ['LUKE', 22.2], ['ASDF', 24.8]],
    pond: [['CAL', 17.6], ['LUKE', 18.5], ['DAVE', 19.2], ['JACK', 20.1], ['JK', 21.3]],
    bath: [['CAL', 11.4], ['DAVE', 12.0], ['MOM', 12.9], ['JK', 13.4], ['LUKE', 14.0]],
    pool: [['CAL', 18.2], ['DAVE', 19.1], ['LUKE', 19.9], ['JACK', 20.8], ['TEST', 23.5]],
    sand: [['CAL', 21.2], ['JK', 22.1], ['DAVE', 22.8], ['LUKE', 23.6], ['JACK2', 25.0]],
  };
  const ORD = ['1ST', '2ND', '3RD', '4TH'];
  const PTS = [10, 6, 3, 1], POSSC = [1000, 600, 300, 100];
  const fmt = s => { if (!(s < 6000)) return '-:--.--'; const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(2); };

  TV.game('md.teeny', {
    v: SAVE_V,
    buttons: ['a', 'b'],
    help: 'Steer: left/right. Go: Z (or Up). Brake/reverse: X (or Down). Menus: arrows + Z, X to go back. Pause: Enter.',
    make(K) {
      const g = K.g, F = K.font, sfx = K.sfx;
      g.imageSmoothingEnabled = false;
      const SP_ = sprites();
      // ---- the save
      let store = null; try { store = K.load(); } catch (e) { store = null; }
      if (!store || typeof store !== 'object') store = {};
      if (!store.recs || !Array.isArray(store.recs.hof)) store.recs = freshRecs();
      const recs = store.recs; recs.laps = recs.laps || {};
      for (const t of TRACKS) if (!Array.isArray(recs.laps[t.id])) recs.laps[t.id] = LAPREC[t.id].map(x => x.slice());
      if (typeof recs.name !== 'string' || !recs.name) recs.name = 'JACK';
      let champ = store.champ && typeof store.champ === 'object' && store.champ.race < 6 ? store.champ : null;
      const persist = () => { store.recs = recs; store.champ = champ; K.save(store); };
      // ---- sound effects
      const S = {
        blip() { sfx.tone(880, 0.05, 'square', 0.06); },
        ok() { sfx.tone(660, 0.06, 'square', 0.07); sfx.tone(990, 0.1, 'square', 0.07, 0.06); },
        back() { sfx.tone(440, 0.08, 'square', 0.06, 0, 300); },
        beep(hi) { sfx.tone(hi ? 1320 : 660, hi ? 0.45 : 0.2, 'square', 0.09); },
        bump(k) { sfx.noise(0.12, 0.08 * k, 900, 0, 'lowpass', 200); sfx.tone(110, 0.1, 'square', 0.05 * k, 0, 60); },
        car() { sfx.noise(0.1, 0.07, 1400, 0, 'bandpass'); sfx.tone(180, 0.08, 'square', 0.05, 0, 90); },
        skid() { sfx.noise(0.12, 0.035, 2600, 0, 'bandpass', 1800); },
        jump() { sfx.tone(260, 0.3, 'square', 0.06, 0, 720); },
        land() { sfx.noise(0.14, 0.09, 500, 0, 'lowpass', 80); },
        splash() { sfx.noise(0.35, 0.09, 3000, 0, 'lowpass', 300); },
        fall() { sfx.tone(900, 0.8, 'square', 0.06, 0, 120); },
        lap() { sfx.seq([[76, 0.5], [79, 0.5], [84, 1]], { bpm: 300, vol: 0.07 }); },
        final() { sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 0.5], [79, 0.5], [84, 1.5]], { bpm: 320, vol: 0.07 }); },
        win() { sfx.seq([[72, 1], [76, 1], [79, 1], [84, 2], [83, 1], [84, 3]], { bpm: 240, vol: 0.08 }); },
        lose() { sfx.seq([[67, 1], [64, 1], [60, 1], [55, 3]], { bpm: 170, vol: 0.07, wave: 'triangle' }); },
        point() { sfx.seq([[79, 0.5], [84, 0.5], [88, 1]], { bpm: 360, vol: 0.08 }); },
        lostpt() { sfx.seq([[64, 0.5], [60, 0.5], [55, 1]], { bpm: 300, vol: 0.07, wave: 'triangle' }); },
        secret() { sfx.seq([[84, 0.5], [88, 0.5], [91, 0.5], [96, 1.5]], { bpm: 300, vol: 0.08 }); },
        engine(sp, boat) { sfx.tone((boat ? 48 : 56) + Math.abs(sp) * 34, 0.075, 'sawtooth', 0.016); },
      };
      let curSong = null;
      const song = s => { if (s === curSong) return; curSong = s; K.music(s ? SONGS[s] : null); };

      // ================================================================ a race (also the attract mode behind the title)
      let B = null, TT = null, cars = [], parts = [], race = null, cam = { x: 0, y: 0 }, shake = 0, msgs = [];
      const loaded = {}; // track index -> built world (only the current one is kept)
      function world(ti) { if (B && B.ti === ti) return B; B = null; for (const k in loaded) delete loaded[k]; const T = TRACKS[ti]; const b = buildTrack(T); b.ti = ti; loaded[ti] = b; B = b; TT = T; return b; }
      const matAt = (x, y) => { const cx = x >> 1, cy = y >> 1; if (cx < 0 || cy < 0 || cx >= B.MW || cy >= B.MH) return TT.outMat == null ? FALL : TT.outMat; return B.M[cy * B.MW + cx]; };
      // ---- particles (a fixed pool)
      const PN = 260; for (let i = 0; i < PN; i++) parts.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, life: 1, c: '#fff', s: 1, k: 0 });
      let pi_ = 0;
      function puff(x, y, z, vx, vy, vz, life, c, s, k) { const p = parts[pi_]; pi_ = (pi_ + 1) % PN; p.on = true; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.t = 0; p.life = life; p.c = c; p.s = s; p.k = k || 0; }
      let banner = null; // the lap banner: a stripe that slides across
      function setBanner(text, col) { banner = { text, col, t: 0, life: 1.8 }; }
      function drawBanner() {
        if (!banner) return; const b = banner, k = b.t < 0.25 ? b.t / 0.25 : b.t > b.life - 0.3 ? (b.life - b.t) / 0.3 : 1; if (k <= 0) return;
        const w = Math.round(W * k), x0 = b.t < 0.25 ? 0 : W - w, y = 46;
        g.fillStyle = b.col; g.fillRect(x0, y, w, 22); g.fillStyle = '#ffd040'; g.fillRect(x0, y, w, 2); g.fillRect(x0, y + 20, w, 2);
        if (k > 0.9) F.center(g, b.text, W / 2, y + 4, '#ffffff', 2, '#000');
      }
      function msg(text, col, t, big) { msgs.push({ text, col: col || '#fff', t: 0, life: t || 1.6, big: big == null ? 2 : big }); if (msgs.length > 3) msgs.shift(); }
      // ---- the cars
      function makeCar(slot, ci, name, ai, skill) {
        const ph = carPhys(ci, !!TT.boat);
        return { slot, ci, name, ai, skill: skill || 1, ph, x: 0, y: 0, vx: 0, vy: 0, a: 0, st: 0, fwd: 0, lat: 0, z: 0, vz: 0, air: false, ramp: null, rampS: 0,
          mat: ROAD, idx: 0, lap: -1, maxLap: -1, lapStart: 0, laps: [], best: 99999, fin: 0, finT: 0, fallT: 0, ghost: 0, stuck: 0, rev: 0, off: 0,
          lane: (slot - 1.5) * 9, laneT: 0, alt: -1, altI: 0, bowlT: 0, falls: 0, eng: 0, skidT: 0, prog: 0, lights: 4, gas: 0, brake: 0, steer: 0, flash: 0, tag: 3, useAlt: false, wrongT: 0 };
      }
      function placeGrid() {
        const S = B.S;
        cars.forEach((c, k) => {
          const back = 18 + (k >> 1) * 26 + (k & 1) * 10, i = (S.N - Math.round(back / SP)) % S.N, side = (k & 1 ? 1 : -1) * 13;
          c.x = S.X[i] + S.NX[i] * side; c.y = S.Y[i] + S.NY[i] * side; c.a = S.A[i]; c.idx = i; c.lap = -1; c.maxLap = 0; c.vx = c.vy = 0; c.z = 0;
        });
      }
      // ---- one go round the track
      function newRace(o) {
        // o: { ti, mode: 'champ'|'h2h'|'tt'|'demo', player: ci or -1, rivals: [[ci, name, skill]...] }
        world(o.ti);
        cars = []; parts.forEach(p => p.on = false); msgs = []; banner = null;
        const laps = o.mode === 'h2h' ? 6 : TT.laps;
        race = { quiet: o.mode === 'demo', mode: o.mode, ti: o.ti, laps, t: 0, cd: o.mode === 'demo' ? 0.01 : 3.6, go: false, fin: 0, endT: 0, over: false, pcar: null, best: 99999, bestBy: null, bowl: false, ptT: 0, resetT: 0, lead: null, firstFin: false, playerLapBest: 99999 };
        let slot = 0;
        if (o.player >= 0) { const p = makeCar(slot++, o.player, 'YOU', false); cars.push(p); race.pcar = p; }
        for (const [ci, name, sk] of o.rivals) { const c = makeCar(slot++, ci, name, true, sk); c.useAlt = name === 'CAL' || (name === 'DAVE' && o.ti !== 0); cars.push(c); }
        // the player starts at the back of the grid in the cup (you have to earn it)
        if (o.mode === 'champ') { cars.push(cars.shift()); cars.forEach((c, k) => c.slot = k); }
        placeGrid();
        cars.forEach(c => { c.lane = (c.slot - 1.5) * 8; });
        const lead = race.pcar || cars[0]; cam.x = lead.x; cam.y = lead.y;
        B.dyn.forEach(d => { d.x = d.hx; d.y = d.hy; d.vx = d.vy = 0; });
        if (o.mode !== 'demo') song(null);
      }
      // ---- the physics, 60 times a second
      const CS = [], SN = []; for (let k = 0; k < 8; k++) { CS.push(Math.cos(k / 8 * TAU)); SN.push(Math.sin(k / 8 * TAU)); }
      const CR = 7; // car radius
      function solidN(x, y, out) { // the way out of any wall touching a car at (x, y)
        let sx = 0, sy = 0, n = 0;
        for (let k = 0; k < 8; k++) if (matAt(x + CS[k] * CR, y + SN[k] * CR) === SOLID) { sx += CS[k]; sy += SN[k]; n++; }
        if (!n) return false; const l = Math.hypot(sx, sy) || 1; out[0] = -sx / l; out[1] = -sy / l; return true;
      }
      const NV = [0, 0];
      function unstick(c) {
        if (matAt(c.x, c.y) !== SOLID) return;
        for (let r = 2; r < 60; r += 2) for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r; if (matAt(x, y) !== SOLID && matAt(x, y) !== FALL) { c.x = x; c.y = y; return; } }
      }
      function respawn(c) {
        const S = B.S; let i = (c.idx - 6 + S.N) % S.N;
        for (let k = 0; k < 60; k++) { const m = matAt(S.X[i], S.Y[i]); if (m === ROAD || m === ROUGH) break; i = (i - 2 + S.N) % S.N; }
        c.x = S.X[i]; c.y = S.Y[i]; c.a = S.A[i]; c.idx = i; c.vx = c.vy = 0; c.fwd = 0; c.z = 0; c.vz = 0; c.air = false; c.ramp = null; c.fallT = 0; c.ghost = 100; c.alt = -1; c.bowlT = 0; c.stuck = 0; c.rev = 0;
        if (c === race.pcar) race.bowl = false;
      }
      function control(c) {
        if (!c.ai && !(race.pcar === c && c.fin)) {
          const st = K.stick ? K.stick() : null; let sx = (K.held('left') ? -1 : 0) + (K.held('right') ? 1 : 0); if (st && Math.abs(st.x) > 0.2 && !sx) sx = st.x;
          c.gas = K.held('a') || K.held('up') ? 1 : 0; c.brake = K.held('b') || K.held('down') ? 1 : 0; c.steer = sx; return;
        }
        const S = B.S, N = S.N;
        if (c.rev > 0) { c.rev--; c.gas = 0; c.brake = 1; c.steer = c.revDir; return; }
        let tx, ty;
        if (c.alt >= 0 && B.alt) { const p = B.alt.pts[c.alt]; tx = p[0]; ty = p[1]; if ((tx - c.x) ** 2 + (ty - c.y) ** 2 < 22 * 22) { c.alt++; if (c.alt >= B.alt.pts.length) { c.alt = -1; c.idx = B.alt.to % N; } } }
        if (c.alt < 0) {
          if (B.alt && c.useAlt && c.idx >= B.alt.from - 2 && c.idx <= B.alt.from + 1 && c.lap >= 0 && !c.altTried) { c.altTried = true; if (Math.random() < 0.55) { c.alt = 0; } }
          if (c.idx > (B.alt ? B.alt.from + 10 : 0) || c.idx < 10) c.altTried = false;
          const look = 5 + Math.round(Math.abs(c.fwd) * 5.5), i = (c.idx + look) % N;
          c.laneT -= 1 / 60; if (c.laneT <= 0) { c.laneT = 1 + Math.random() * 2; c.laneW = (Math.random() - 0.5) * (TT.rw * 0.35); }
          c.lane += ((c.laneW || 0) - c.lane) * 0.02;
          tx = S.X[i] + S.NX[i] * c.lane; ty = S.Y[i] + S.NY[i] * c.lane;
        }
        const want = Math.atan2(ty - c.y, tx - c.x), d = wrapA(want - c.a);
        c.steer = clamp(d * 3, -1, 1);
        let vt = c.ph.vmax * c.skill * (c.alt >= 0 ? 0.9 : S.VT[c.idx]);
        if (race.pcar && race.mode !== 'demo' && c.ai) { // keep it a race: ease off a touch when miles ahead, push when behind
          const gap = c.prog - race.pcar.prog; if (gap > 150) vt *= 0.95; else if (gap < -200) vt *= 1.03;
        }
        if (Math.abs(d) > 1.2) vt *= 0.6;
        c.gas = c.fwd < vt ? 1 : 0; c.brake = c.fwd > vt + 0.45 ? 1 : 0;
      }
      function drive(c) {
        const ph = c.ph, boat = !!TT.boat;
        if (c.fallT > 0) { c.fallT -= 1 / 50; c.x += c.vx * 0.9; c.y += c.vy * 0.9; c.vx *= 0.96; c.vy *= 0.96; c.a += 0.08; if (c.fallT <= 0) respawn(c); return; }
        if (c.ghost > 0) c.ghost--;
        if (c.air) { // flying!
          c.z += c.vz; c.vz -= 0.16; c.x += c.vx; c.y += c.vy; c.a += c.steer * 0.01;
          if (c.z <= 0) {
            c.z = 0; c.air = false; c.vz = 0; const m = matAt(c.x, c.y);
            if (c === race.pcar) { S.land(); shake = Math.max(shake, 3); }
            for (let k = 0; k < 6; k++) puff(c.x, c.y, 0, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, 0.6 + Math.random(), 0.5, boat || m === BOWL ? '#f0f8ff' : '#d8c8a8', 2, 1);
            if (m === FALL) startFall(c); else if (m === SOLID) { unstick(c); c.vx *= -0.3; c.vy *= -0.3; }
          }
          return;
        }
        const m = c.mat = matAt(c.x, c.y);
        if (m === FALL) { startFall(c); return; }
        const sf = SURF[m] || SURF[1];
        const ca = Math.cos(c.a), sa = Math.sin(c.a);
        let fwd = c.vx * ca + c.vy * sa, lat = -c.vx * sa + c.vy * ca;
        const vmax = ph.vmax * sf[0] * (c.ai ? 1 : 1);
        const gas = race.go ? c.gas : 0, brake = race.go ? c.brake : 0;
        if (gas && !brake) { fwd += ph.acc * sf[1] * (fwd < 0 ? 2.2 : 1); }
        else if (brake) { if (fwd > 0.05) fwd -= 0.11; else fwd -= ph.acc * 0.7; if (fwd < -vmax * 0.42) fwd = -vmax * 0.42; }
        else fwd *= 0.985;
        if (fwd > vmax) fwd += (vmax - fwd) * 0.07;
        // grip: the sideways slide dies away (less on milk, ink and water)
        const grip = ph.grip * sf[2] * (brake && fwd > 1.4 ? 0.55 : 1);
        lat *= 1 - clamp(grip, 0.02, 0.95);
        // steering, smoothed (you can't spin on the spot)
        c.st += (c.steer - c.st) * 0.3;
        const sp = clamp(Math.abs(fwd) / 1.1, 0, 1) * (fwd < 0 ? -1 : 1);
        c.a += c.st * ph.turn * sp * (boat ? 1 : 1);
        c.fwd = fwd; c.lat = lat;
        const ca2 = Math.cos(c.a), sa2 = Math.sin(c.a);
        // (keep a bit of the old momentum when turning: drift)
        c.vx = fwd * ca2 - lat * sa2; c.vy = fwd * sa2 + lat * ca2;
        // rumble on the rough stuff
        if (sf[3] && Math.abs(fwd) > 0.8 && (K.frame & 3) === 0) { const col = TT.theme === 'pond' ? '#4a8a38' : TT.theme === 'bath' ? '#ffffff' : TT.theme === 'sand' ? '#e8d098' : '#d8b878'; puff(c.x - ca2 * 6, c.y - sa2 * 6, 0, -ca2 * 0.5 + (Math.random() - 0.5), -sa2 * 0.5 + (Math.random() - 0.5), 0.8 + Math.random(), 0.45, col, 2, 1); if (c === race.pcar && sf[3] > 1) shake = Math.max(shake, 1.2); }
        // skids, wakes, splashes
        const sliding = Math.abs(lat) > 0.75 || (brake && fwd > 1.6);
        if (boat) { if (Math.abs(fwd) > 1 && (K.frame & 1) === 0) { puff(c.x - ca2 * 9 - sa2 * 3, c.y - sa2 * 9 + ca2 * 3, 0, -sa2 * 0.4, ca2 * 0.4, 0, 0.7, 'rgba(255,255,255,.8)', 2, 2); puff(c.x - ca2 * 9 + sa2 * 3, c.y - sa2 * 9 - ca2 * 3, 0, sa2 * 0.4, -ca2 * 0.4, 0, 0.7, 'rgba(255,255,255,.8)', 2, 2); } }
        else if (sliding && m !== BOWL) {
          skidMark(c, ca2, sa2);
          if ((K.frame & 3) === 0) puff(c.x - ca2 * 6, c.y - sa2 * 6, 0, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, 0.3, 0.6, 'rgba(230,230,230,.7)', 3, 3);
          if (c === race.pcar && c.skidT <= 0) { S.skid(); c.skidT = 10; }
        }
        if (m === BOWL && Math.abs(fwd) > 0.6 && (K.frame & 3) === 0) puff(c.x, c.y, 0, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, 1.2, 0.5, '#fffff4', 2, 1);
        if (m === SLIP && Math.abs(fwd) > 1 && (K.frame & 3) === 0) puff(c.x, c.y, 0, (Math.random() - 0.5), (Math.random() - 0.5), 0.8, 0.4, TT.theme === 'desk' ? '#2a3aa0' : '#ffffff', 2, 1);
        if (c.skidT > 0) c.skidT--;
        // the plughole pulls
        if (B.plug) { const dx = B.plug.x - c.x, dy = B.plug.y - c.y, d = Math.hypot(dx, dy); if (d < B.plug.r) { const f = (1 - d / B.plug.r) * 0.09; c.vx += dx / d * f - dy / d * f * 0.8; c.vy += dy / d * f + dx / d * f * 0.8; } }
        // ramps
        if (m === RAMP) {
          let best = null, bd = 1e9; for (const r of B.ramps) { const ux = (r.bx - r.ax) / r.len, uy = (r.by - r.ay) / r.len, s = (c.x - r.ax) * ux + (c.y - r.ay) * uy, q = Math.abs(-(c.x - r.ax) * uy + (c.y - r.ay) * ux); const dd = q + Math.max(0, -s, s - r.len); if (dd < bd) { bd = dd; best = r; c.rampS = clamp(s / r.len, 0, 1); } }
          c.ramp = best; if (best) c.z = best.h * c.rampS;
        } else if (c.ramp) {
          const r = c.ramp; c.ramp = null;
          if (c.rampS > 0.75 && fwd > 0.6) { c.air = true; c.vz = 0.55 + fwd * 0.55; if (c === race.pcar) S.jump(); }
          else if (c.z > 3) { c.air = true; c.vz = 0; } else c.z = 0;
          if (c.air) { c.x += c.vx; c.y += c.vy; return; }
        }
        // move, and bounce off walls
        const nx = c.x + c.vx, ny = c.y + c.vy;
        if (c.z < 4 && solidN(nx, ny, NV)) {
          const vn = c.vx * NV[0] + c.vy * NV[1];
          if (vn < 0) { c.vx -= 1.4 * vn * NV[0]; c.vy -= 1.4 * vn * NV[1]; c.vx *= 0.8; c.vy *= 0.8; if (vn < -0.7) { if (c === race.pcar) { S.bump(Math.min(1.4, -vn / 1.6)); shake = Math.max(shake, -vn * 1.8); } for (let k = 0; k < 4; k++) puff(nx - NV[0] * 5, ny - NV[1] * 5, 2, NV[0] + (Math.random() - 0.5) * 2, NV[1] + (Math.random() - 0.5) * 2, 1, 0.3, '#fff8a0', 1, 1); } }
          const tx = c.x + c.vx, ty = c.y + c.vy; if (!solidN(tx, ty, NV)) { c.x = tx; c.y = ty; } else { c.x += NV[0] * 0.6; c.y += NV[1] * 0.6; }
          // turn the car a little along the wall
          const cross = Math.cos(c.a) * NV[1] - Math.sin(c.a) * NV[0]; c.a += clamp(cross, -1, 1) * 0.02;
        } else { c.x = nx; c.y = ny; }
        unstick(c);
        c.x = clamp(c.x, 2, TT.ww - 3); c.y = clamp(c.y, 2, TT.wh - 3);
        if (c === race.pcar) { c.eng--; if (c.eng <= 0) { S.engine(fwd, boat); c.eng = 6; } }
      }
      function startFall(c) {
        if (c.fallT > 0) return;
        if (!B.fallOK && !B.plug && TT.outMat !== FALL) { unstick(c); return; }
        c.fallT = 1; c.falls++;
        if (c === race.pcar) { S.fall(); msg(TT.theme === 'pool' ? 'POTTED!' : TT.theme === 'bath' ? 'DOWN THE PLUGHOLE!' : 'OVER THE EDGE!', '#ffd040', 1.4); }
      }
      function skidMark(c, ca, sa) {
        const v = B.v; v.fillStyle = 'rgba(30,20,10,.16)';
        v.fillRect(c.x - ca * 5 - sa * 4, c.y - sa * 5 + ca * 4, 2, 2); v.fillRect(c.x - ca * 5 + sa * 4, c.y - sa * 5 - ca * 4, 2, 2);
      }
      // which bit of the lap each car is on
      function progress(c) {
        const S = B.S, N = S.N; if (c.alt >= 0) { c.prog = c.lap * N + c.idx; return; }
        let bi = -1, bd = (TT.rw / 2 + 26) ** 2;
        const win = B.alt ? 230 : 110;
        for (let d = -24; d <= win; d++) { const i = (c.idx + d + N) % N, dd = (S.X[i] - c.x) ** 2 + (S.Y[i] - c.y) ** 2; if (dd < bd) { bd = dd; bi = i; } }
        if (bi >= 0) {
          if (bi < N * 0.25 && c.idx > N * 0.75) { c.lap++; lapDone(c); } else if (bi > N * 0.75 && c.idx < N * 0.25) c.lap--;
          c.idx = bi; c.off = 0;
        } else c.off++;
        c.prog = c.lap * N + c.idx;
        // wrong way?
        if (c === race.pcar && !c.fin) { const d = Math.abs(wrapA(c.a - S.A[c.idx])); if (d > 2.2 && c.fwd > 0.4) c.wrongT++; else c.wrongT = Math.max(0, c.wrongT - 3); }
        // lost (way off the track for ages): put back on
        if (c.off > (c.ai ? 160 : 420) && c.fallT <= 0) { c.off = 0; respawn(c); if (c === race.pcar) msg('BACK ON TRACK', '#fff', 1.2); }
      }
      function lapDone(c) {
        if (c.lap <= c.maxLap) return; c.maxLap = c.lap;
        if (c.lap === 0) { c.lapStart = race.t; return; }
        const lt = race.t - c.lapStart; c.lapStart = race.t; c.laps.push(lt); if (lt < c.best) c.best = lt;
        if (lt < race.best) { race.best = lt; race.bestBy = c; }
        if (c === race.pcar) {
          const rec = recs.laps[TT.id], isRec = lt < rec[0][1];
          if (c.lap < race.laps) { if (c.lap === race.laps - 1 && race.mode !== 'h2h') { S.final(); setBanner('FINAL LAP!', '#e8341c'); } else { S.lap(); setBanner('LAP ' + (c.lap + 1), '#1a3ad0'); } }
          msg('LAP ' + fmt(lt) + (isRec ? ' RECORD!' : lt <= c.best ? ' BEST' : ''), isRec ? '#80ff80' : '#ffffff', 1.8, 1);
          race.playerLapBest = Math.min(race.playerLapBest, lt);
        }
        if (c.lap >= race.laps && race.mode !== 'h2h' && !c.fin) { c.fin = ++race.fin; c.finT = race.t; if (c === race.pcar) playerFinished(); }
      }
      function projectFinish() { // anyone still out there gets the time they were on for (so the sheet never says DNF for a mate who was just behind)
        const N = B.S.N, total = race.laps * N;
        cars.filter(c => !c.fin).sort((a, b) => b.prog - a.prog).forEach(c => { const done = Math.max(1, c.prog), left = Math.max(0, total - done); c.fin = ++race.fin; c.finT = race.t + left * (race.t / done) + 0.01 * c.fin; c.est = true; });
      }
      function playerFinished() {
        const p = race.pcar; race.firstFin = true;
        if (race.mode === 'tt') { S.win(); msg('FINISHED!', '#ffd040', 3); race.endT = 2.5; return; }
        const pos = p.fin - 1; if (pos <= 1) S.win(); else S.lose();
        msg(ORD[pos] + '!', pos === 0 ? '#ffd040' : pos === 1 ? '#e0e8ff' : '#ff9060', 3, 3);
      }
      function collideCars() {
        for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
          const a = cars[i], b = cars[j]; if (a.fallT > 0 || b.fallT > 0 || a.ghost || b.ghost || Math.abs(a.z - b.z) > 5) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, R2 = 14; if (d2 > R2 * R2 || d2 < 0.0001) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = R2 - d, ma = a.ph.mass, mb = b.ph.mass;
          a.x -= nx * ov * mb / (ma + mb); a.y -= ny * ov * mb / (ma + mb); b.x += nx * ov * ma / (ma + mb); b.y += ny * ov * ma / (ma + mb);
          const vr = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vr < 0) { const j2 = -(1.5) * vr / (1 / ma + 1 / mb); a.vx -= j2 / ma * nx; a.vy -= j2 / ma * ny; b.vx += j2 / mb * nx; b.vy += j2 / mb * ny; if ((a === race.pcar || b === race.pcar) && vr < -0.5) { S.car(); shake = Math.max(shake, 2); } if (vr < -0.8) for (let k = 0; k < 3; k++) puff(a.x + nx * 6, a.y + ny * 6, 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 1, 0.3, '#ffffa0', 1, 1); }
          unstick(a); unstick(b);
        }
        // the floating things (ducks, lily pads): push them about, they drift home
        for (const o of B.dyn) {
          o.vx += (o.hx - o.x) * 0.002; o.vy += (o.hy - o.y) * 0.002; o.vx *= 0.96; o.vy *= 0.96; o.x += o.vx; o.y += o.vy;
          for (const c of cars) { if (c.z > 4 || c.fallT > 0) continue; const dx = c.x - o.x, dy = c.y - o.y, d = Math.hypot(dx, dy), R = o.r + 7; if (d < R && d > 0.01) { const nx = dx / d, ny = dy / d, ov = R - d; c.x += nx * ov * 0.7; c.y += ny * ov * 0.7; o.x -= nx * ov * 0.3; o.y -= ny * ov * 0.3; const vr = c.vx * nx + c.vy * ny; if (vr < 0) { c.vx -= 1.3 * vr * nx; c.vy -= 1.3 * vr * ny; o.vx += vr * nx * 0.6 / o.m; o.vy += vr * ny * 0.6 / o.m; if (c === race.pcar && vr < -0.6) S.bump(0.6); } } }
        }
      }
      function stepRace() {
        const R = race;
        if (!R.go) { R.cd -= 1 / 60; const n = Math.ceil(R.cd); if (!R.quiet && n !== R.lastN && n <= 3 && n >= 1) { S.beep(false); R.lastN = n; } if (R.cd <= 0) { R.go = true; R.t = 0; if (!R.quiet) { S.beep(true); song('r' + TT.song); } cars.forEach(c => c.lapStart = 0); } }
        else R.t += 1 / 60;
        for (const c of cars) control(c);
        for (const c of cars) drive(c);
        collideCars();
        for (const c of cars) if (c.fallT <= 0) progress(c);
        // robots that get stuck back out
        if (R.go) for (const c of cars) if (c.ai || c.fin) {
          if (Math.abs(c.fwd) < 0.25 && !c.air && c.fallT <= 0 && c.rev <= 0) { c.stuck++; if (c.stuck > 50) { c.stuck = 0; c.rev = 34; c.revDir = -Math.sign(c.steer || 1); } } else c.stuck = 0;
        }
        // the player's bowl ride
        const p = R.pcar;
        if (p && B.bowl) {
          if (p.mat === BOWL && !p.air) { p.bowlT = 400; R.bowl = true; }
          if (p.bowlT > 0) { p.bowlT--; if (R.bowl && !p.air && p.mat === ROAD && Math.hypot(p.x - B.bowl.x, p.y - B.bowl.y) > B.bowl.r + 20) { R.bowl = false; p.bowlT = 0; if (B.alt && Math.abs(p.idx - B.alt.to) < 60) { msg('BOWL RIDE!', '#80f0ff', 2); S.secret(); if (!R.bowlDone) K.secret('lk.teeny.bowl'); R.bowlDone = (R.bowlDone || 0) + 1; } } }
        }
        // the camera
        let lead = p;
        if (R.mode === 'demo' || R.mode === 'h2h') { lead = cars[0]; for (const c of cars) if (c.prog > lead.prog && c.fallT <= 0) lead = c; R.lead = lead; }
        if (lead) { const tx = lead.x + lead.vx * 22, ty = lead.y + lead.vy * 18; cam.x += (tx - cam.x) * 0.1; cam.y += (ty - cam.y) * 0.1; }
        // particles
        for (const q of parts) if (q.on) { q.t += 1 / 60; if (q.t > q.life) { q.on = false; continue; } q.x += q.vx; q.y += q.vy; if (q.k === 1) { q.z += q.vz; q.vz -= 0.12; if (q.z < 0) { q.z = 0; q.vz *= -0.3; q.vx *= 0.7; q.vy *= 0.7; } } else { q.vx *= 0.94; q.vy *= 0.94; } }
        for (const mm of msgs) mm.t += 1 / 60; msgs = msgs.filter(mm => mm.t < mm.life);
        if (banner) { banner.t += 1 / 60; if (banner.t > banner.life) banner = null; }
        if (shake > 0) shake *= 0.86; if (shake < 0.2) shake = 0;
        if (R.mode === 'h2h' && R.go) stepH2H();
        // the end of the race
        if (R.mode === 'champ' || R.mode === 'tt') {
          if (R.endT > 0) { R.endT -= 1 / 60; if (R.endT <= 0) { R.over = true; projectFinish(); } }
          else if (p && p.fin) { const others = cars.filter(c => c.ai); if (others.every(c => c.fin) || R.t - p.finT > 7) R.endT = 1.2; }
          else if (p && R.mode === 'champ' && R.fin >= 3) R.endT = 3;
        }
      }
      // ---- head to head: leave them off the screen
      function stepH2H() {
        const R = race, p = R.pcar, o = cars.find(c => c !== p);
        if (R.resetT > 0) { R.resetT -= 1 / 60; if (R.resetT <= 0) { R.frozen = false; } return; }
        if (R.over || R.endT > 0) { R.endT -= 1 / 60; if (R.endT <= 0) R.over = true; return; }
        const lead = p.prog >= o.prog ? p : o, back = lead === p ? o : p;
        const vx = clamp(cam.x - W / 2, 0, TT.ww - W), vy = clamp(cam.y - H / 2, 0, TT.wh - H);
        const M = 24, offx = back.x < vx - M || back.x > vx + W + M, offy = back.y < vy - M || back.y > vy + H + M;
        if ((offx || offy) && lead.fallT <= 0 && R.t > 4) {
          lead.lights++; back.lights--;
          if (lead === p) { S.point(); msg('YOU WIN A LIGHT!', '#80ff80', 1.6, 1); } else { S.lostpt(); msg(o.name + ' WINS A LIGHT', '#ff9060', 1.6, 1); }
          if (lead.lights >= 8) { R.winner = lead; R.endT = 2.4; msg(lead === p ? 'YOU WIN!' : o.name + ' WINS!', '#ffd040', 2.6, 3); if (lead === p) S.win(); else S.lose(); return; }
          // both back on the track where the leader was
          const S2 = B.S, i = lead.idx;
          for (const [c, s] of [[lead, -12], [back, 12]]) { c.x = S2.X[i] + S2.NX[i] * s; c.y = S2.Y[i] + S2.NY[i] * s; c.a = S2.A[i]; c.idx = i; c.lap = lead.lap; c.maxLap = Math.max(c.maxLap, lead.maxLap); c.vx = c.vy = 0; c.fwd = 0; c.z = 0; c.air = false; c.ramp = null; c.fallT = 0; c.ghost = 60; unstick(c); }
          cam.x = lead.x; cam.y = lead.y; R.resetT = 1.3;
        }
        if (Math.max(p.lap, o.lap) >= R.laps && !R.winner) { R.winner = p.lights > o.lights ? p : o.lights > p.lights ? o : (p.prog >= o.prog ? p : o); R.endT = 2.4; msg(R.winner === p ? 'YOU WIN!' : o.name + ' WINS!', '#ffd040', 2.6, 3); if (R.winner === p) S.win(); else S.lose(); }
      }

      // ================================================================ drawing the race
      function drawWorld() {
        const sx = shake ? (Math.random() - 0.5) * shake : 0, sy = shake ? (Math.random() - 0.5) * shake : 0;
        let vx = Math.round(clamp(cam.x - W / 2, 0, TT.ww - W) + sx), vy = Math.round(clamp(cam.y - H / 2, 0, TT.wh - H) + sy);
        race.vx = vx; race.vy = vy;
        // the floor far below (parallax), falling cars, then the world
        if (B.floor) { g.save(); g.fillStyle = g.createPattern(B.floor, 'repeat'); const ox = -((vx * 0.55) % 64) - 64, oy = -((vy * 0.55) % 64) - 64; g.translate(ox, oy); g.fillRect(0, 0, W + 128, H + 128); g.restore(); }
        else { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
        for (const c of cars) if (c.fallT > 0 && !B.fallTop) drawCar(c, vx, vy);
        g.drawImage(B.cv, vx, vy, W, H, 0, 0, W, H);
        drawDeco(vx, vy);
        // ground particles, shadows, cars, air particles
        for (const q of parts) if (q.on && q.z < 2) drawPart(q, vx, vy);
        const order = cars.filter(c => !(c.fallT > 0 && !B.fallTop)).sort((a, b) => (a.z - b.z) || (a.y - b.y));
        for (const c of order) drawShadow(c, vx, vy);
        for (const o of B.dyn) drawDyn(o, vx, vy);
        for (const c of order) drawCar(c, vx, vy);
        for (const q of parts) if (q.on && q.z >= 2) drawPart(q, vx, vy);
        if (TT.boat) waterGlint(vx, vy);
      }
      const kOf = a => ((Math.round(a / TAU * NANG) % NANG) + NANG) % NANG;
      function drawShadow(c, vx, vy) {
        const sh = SP_.shadow[TT.boat ? 'boat' : 'car'][kOf(c.a)];
        g.globalAlpha = TT.boat ? 0.25 : 0.4; g.drawImage(sh, Math.round(c.x - vx - 20 + 4 + c.z * 0.6), Math.round(c.y - vy - 20 + 6 + c.z * 0.9)); g.globalAlpha = 1;
      }
      function drawCar(c, vx, vy) {
        if (c.ghost && (c.ghost & 4)) return;
        const spr = SP_[TT.boat ? 'boat' : 'car'][c.ci][kOf(c.a)];
        let s = 1 + c.z / 34;
        if (c.fallT > 0) { s = B.fallTop ? Math.max(0.1, c.fallT * c.fallT) : 0.4 + c.fallT * 0.6; }
        const x = c.x - vx, y = c.y - vy - c.z * 0.9;
        if (s === 1) g.drawImage(spr, Math.round(x - 20), Math.round(y - 20));
        else { const w = Math.round(40 * s); g.drawImage(spr, Math.round(x - w / 2), Math.round(y - w / 2), w, w); }
        if (c.fallT > 0) { g.globalAlpha = 1 - c.fallT; g.fillStyle = '#000'; g.beginPath(); g.arc(x, y, 12 * s, 0, TAU); g.fill(); g.globalAlpha = 1; }
        // name tags at the start, and an arrow over you
        if (race.mode !== 'demo' && (race.t < 3 || !race.go)) {
          const lab = c.name; F.center(g, lab, x, y - 26, c === race.pcar ? '#ffff60' : '#ffffff', 1, '#000');
          if (c === race.pcar && (K.frame & 16)) { poly(g, [x - 4, y - 17, x + 4, y - 17, x, y - 13], '#ffff60'); }
        }
      }
      function drawPart(q, vx, vy) {
        const x = q.x - vx, y = q.y - vy - q.z; if (x < -4 || y < -4 || x > W + 4 || y > H + 4) return;
        const f = 1 - q.t / q.life;
        if (q.k === 2) { g.globalAlpha = f * 0.8; g.fillStyle = q.c; g.fillRect(Math.round(x), Math.round(y), 2, 2); g.globalAlpha = 1; return; }
        if (q.k === 3) { g.globalAlpha = f * 0.6; const r = q.s * (1.5 - f); g.fillStyle = q.c; g.fillRect(Math.round(x - r), Math.round(y - r), Math.round(r * 2), Math.round(r * 2)); g.globalAlpha = 1; return; }
        g.fillStyle = q.c; g.fillRect(Math.round(x), Math.round(y), q.s, q.s);
      }
      function drawDyn(o, vx, vy) {
        const x = Math.round(o.x - vx), y = Math.round(o.y - vy + Math.sin(K.t * 2 + o.hx) * 1.2); if (x < -30 || y < -30 || x > W + 30 || y > H + 30) return;
        if (o.kind === 'duck') {
          const r = o.r; ell(g, x + 3, y + 4, r, r * 0.8, 'rgba(0,40,80,.3)'); ell(g, x, y, r, r * 0.82, '#f8d018'); ell(g, x - r * 0.2, y - r * 0.15, r * 0.6, r * 0.45, '#fff080');
          circ(g, x + r * 0.55, y - r * 0.2, r * 0.5, '#f8d018'); ell(g, x + r * 1.05, y - r * 0.15, r * 0.3, r * 0.16, '#f87818'); rect(g, x + r * 0.6, y - r * 0.4, 2, 2, '#101010'); ell(g, x - r * 0.75, y, r * 0.3, r * 0.2, '#e8b810');
        } else { const r = o.r; ell(g, x + 2, y + 3, r, r * 0.85, 'rgba(0,30,20,.3)'); g.fillStyle = '#2a8a30'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, 0.5, TAU - 0.1); g.closePath(); g.fill(); g.fillStyle = '#5ab848'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r * 0.75, 0.7, TAU - 0.3); g.closePath(); g.fill(); circ(g, x - 3, y - 3, 3, '#f8a0c0'); circ(g, x - 3, y - 3, 1.4, '#fff0a0'); }
      }
      function drawDeco(vx, vy) {
        for (const d of B.deco) {
          const x = d.x - vx, y = d.y - vy; if (x < -60 || y < -80 || x > W + 60 || y > H + 60) continue;
          if (d.k === 'steam') { for (let i = 0; i < 4; i++) { const t = (K.t * 0.6 + i / 4) % 1; g.globalAlpha = (1 - t) * 0.5; circ(g, x + Math.sin(t * 6 + i) * 6, y - t * 46, 4 + t * 7, '#ffffff'); } g.globalAlpha = 1; }
          else if (d.k === 'frog') { const hop = (K.t % 4) < 0.4 ? Math.sin((K.t % 4) / 0.4 * Math.PI) * 6 : 0; circ(g, x, y + 4, 10, '#2a8a30'); ell(g, x + 1, y - hop + 2, 8, 6, 'rgba(0,0,0,.3)'); ell(g, x, y - hop, 8, 6, '#58c040'); circ(g, x - 4, y - hop - 5, 2.5, '#58c040'); circ(g, x + 4, y - hop - 5, 2.5, '#58c040'); rect(g, x - 5, y - hop - 6, 2, 2, '#000'); rect(g, x + 3, y - hop - 6, 2, 2, '#000'); }
          else if (d.k === 'swirl') { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const a0 = K.t * 2.4 + i * 2.1; g.beginPath(); g.arc(x, y, 20 + i * 12, a0, a0 + 1.6); g.stroke(); } }
        }
        for (const f of B.fish) { // goldfish under the water
          f.a += 0.004 * f.sp; const fx = f.x + Math.cos(f.a * 3) * 120, fy = f.y + Math.sin(f.a * 2) * 70, ang = Math.atan2(Math.cos(f.a * 2) * 140 * 0.004 * f.sp, -Math.sin(f.a * 3) * 360 * 0.004 * f.sp);
          const x = fx - vx, y = fy - vy; if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
          g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(ang); g.globalAlpha = 0.55; ell(g, 0, 0, 7 * f.s, 3 * f.s, f.c); poly(g, [-6 * f.s, 0, -11 * f.s, -3.5 * f.s + Math.sin(K.t * 10) * 1.5, -11 * f.s, 3.5 * f.s + Math.sin(K.t * 10) * 1.5], f.c); g.globalAlpha = 1; g.restore();
        }
      }
      function waterGlint(vx, vy) { // little sparkles that dance on the water
        g.fillStyle = 'rgba(255,255,255,.7)';
        for (let i = 0; i < 26; i++) { const t = (K.t * 0.5 + hash(i, 1, 99)) % 1; if (t > 0.35) continue; const x = (hash(i, 2, 99 + Math.floor(K.t * 0.5 + hash(i, 1, 99))) * W) | 0, y = (hash(i, 3, 99 + Math.floor(K.t * 0.5 + hash(i, 1, 99))) * H) | 0; const m = matAt(x + vx, y + vy); if (m !== ROAD && m !== ROUGH) continue; const w = t < 0.17 ? 3 : 1; g.fillRect(x - (w >> 1), y, w, 1); if (w > 1) g.fillRect(x, y - 1, 1, 3); }
      }
      // ---- the race HUD
      function plate(x, y, w, h) { g.fillStyle = 'rgba(8,8,32,.62)'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, y, w, 1); }
      function helmet(x, y, ci, me) { circ(g, x, y, 5, '#101018'); circ(g, x, y, 4, CARS[ci].col); rect(g, x - 1, y - 2, 4, 3, '#203050'); rect(g, x - 3, y - 3, 2, 1, 'rgba(255,255,255,.7)'); if (me) { g.strokeStyle = '#ffff60'; g.lineWidth = 1; g.strokeRect(x - 7.5, y - 7.5, 15, 15); } }
      function order() { return cars.slice().sort((a, b) => (a.fin && b.fin) ? a.finT - b.finT : a.fin ? -1 : b.fin ? 1 : b.prog - a.prog); }
      function hud() {
        const R = race, p = R.pcar;
        if (R.mode === 'demo') return;
        // lap and time
        plate(4, 4, 92, 30);
        const lapN = p ? clamp(p.lap + 1, 1, R.laps) : 1;
        if (R.mode === 'h2h') F.draw(g, 'LAP ' + lapN + '/' + R.laps, 9, 8, '#ffd040', 1, '#000'); else { F.draw(g, 'LAP', 9, 8, '#ffd040', 1, '#000'); F.draw(g, lapN + '/' + R.laps, 33, 8, '#ffffff', 1, '#000'); }
        const t = p && p.fin ? p.finT : R.go ? R.t : 0; F.draw(g, fmt(t), 9, 20, '#ffffff', 1, '#000');
        if (p && p.best < 9999) F.draw(g, fmt(p.best), 9 + 50, 20, '#80ff80', 1, '#000');
        if (R.mode === 'h2h') { hudLights(); }
        else if (R.mode !== 'tt') {
          // position, big
          const od = order(), pos = od.indexOf(p);
          const ps = ORD[pos], col = ['#ffd040', '#f0f4ff', '#ff9a30', '#ff5050'][pos], dk = ['#6a4800', '#3a4060', '#6a3000', '#600000'][pos];
          rrect(g, W - 70, 3, 66, 32, 4, '#000'); rrect(g, W - 68, 5, 62, 28, 3, dk); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(W - 68, 5, 62, 2);
          F.draw(g, ps, W - 62, 10, col, 3, '#000');
          // the order of the helmets down the side
          plate(4, 38, 18, 4 * 14 + 4); od.forEach((c, k) => helmet(13, 46 + k * 14, c.ci, c === p));
        } else {
          plate(W - 96, 4, 92, 30); F.draw(g, 'RECORD', W - 91, 8, '#ffd040', 1, '#000'); F.draw(g, fmt(recs.laps[TT.id][0][1]), W - 91, 20, '#ffffff', 1, '#000'); F.draw(g, recs.laps[TT.id][0][0].slice(0, 4), W - 40, 20, '#80c0ff', 1, '#000');
        }
        // the minimap
        const mx = W - 76, my = H - 56; g.globalAlpha = 0.85; g.drawImage(B.mm, mx, my); g.globalAlpha = 1;
        for (const c of cars) { const x = mx + B.mmX + c.x * B.mmSc, y = my + B.mmY + c.y * B.mmSc; rect(g, Math.round(x) - 2, Math.round(y) - 2, 4, 4, '#000'); rect(g, Math.round(x) - 1, Math.round(y) - 1, 2, 2, c === p ? ((K.frame & 8) ? '#ffffff' : CARS[c.ci].col) : CARS[c.ci].col); }
        // countdown lights
        if (!R.go || R.t < 0.8) {
          const n = R.go ? 0 : Math.ceil(R.cd), x0 = W / 2 - 34, y0 = 34;
          if (R.go || n <= 3) {
            rrect(g, x0 - 4, y0 - 4, 76, 26, 6, '#101018'); rrect(g, x0 - 2, y0 - 2, 72, 22, 5, '#2a2a34');
            for (let k = 0; k < 3; k++) { const on = R.go ? 2 : n === 3 ? (k === 0 ? 1 : 0) : n === 2 ? (k <= 1 ? 1 : 0) : (k <= 2 ? 1 : 0); const cx = x0 + 10 + k * 24, cy = y0 + 9; circ(g, cx, cy, 8, '#000'); circ(g, cx, cy, 7, on === 2 ? '#30f040' : on ? '#f03020' : '#401818'); if (on) circ(g, cx - 2, cy - 2, 2, '#ffffff'); }
            if (R.go) F.center(g, 'GO!', W / 2, 70, '#40ff50', 4, '#003000');
          }
          if (!R.go && R.cd > 0.6 && R.mode !== 'demo') { plate(20, H - 46, W - 40, 30); F.center(g, 'HOLD ' + K.label('a') + ' TO GO   ' + K.label('b') + ' TO BRAKE', W / 2, H - 41, '#ffffff', 1, '#000'); F.center(g, 'STEER WITH LEFT AND RIGHT', W / 2, H - 29, '#ffd040', 1, '#000'); }
        }
        drawBanner();
        // messages
        let my2 = 84; for (const mm of msgs) { const a = Math.min(1, (mm.life - mm.t) * 4, mm.t * 8); if (a <= 0) continue; g.globalAlpha = a; const dy = mm.big > 1 ? 0 : 0; F.center(g, mm.text, W / 2, my2 + dy, mm.col, mm.big, '#000'); g.globalAlpha = 1; my2 += mm.big * 8 + 6; }
        if (p && p.wrongT > 40 && (K.frame & 16)) F.center(g, 'WRONG WAY!', W / 2, 130, '#ff4040', 2, '#000');
        if (R.mode === 'h2h' && R.resetT > 0) F.center(g, 'READY...', W / 2, 150, '#ffffff', 2, '#000');
      }
      function hudLights() {
        const R = race, p = R.pcar, o = cars.find(c => c !== p); const x0 = W - 8 * 18 - 2, y0 = 8;
        plate(x0 - 8, 4, 8 * 18 + 6, 30);
        for (let k = 0; k < 8; k++) { const mine = k < p.lights, cx = x0 + k * 18, cy = y0 + 8; circ(g, cx, cy, 7, '#000'); circ(g, cx, cy, 6, mine ? CARS[p.ci].col : CARS[o.ci].col); circ(g, cx - 2, cy - 2, 2, 'rgba(255,255,255,.6)'); }
        F.draw(g, 'YOU', x0 - 4, y0 + 18, '#ffff60', 1, '#000'); F.draw(g, o.name, x0 + 8 * 18 - 4 - F.width(o.name), y0 + 18, '#ffffff', 1, '#000');
      }

      // ================================================================ the screens
      let mode = 'title', mt = 0, sel = 0, demoT = 0, paused = false, psel = 0;
      let pick = { car: 0, ti: 0, rival: 0, slot: 0 };
      let res = null; // the last race's results
      let name = null; // name entry
      let finalScore = 0, reported = false, endInfo = null, newRecs = [];
      let goStart = 0;
      function startDemo() { const ti = Math.floor(Math.random() * TRACKS.length); newRace({ ti, mode: 'demo', player: -1, rivals: [[0, 'CAL', 0.97], [1, 'DAVE', 0.95], [2, 'LUKE', 0.93], [3, 'JK', 0.94]] }); demoT = 0; }
      function toMenu() { mode = 'menu'; mt = 0; sel = 0; paused = false; song('menu'); if (!race || race.mode !== 'demo') startDemo(); }
      // the cup
      function cupRivals(car) { // the three mates take the other cars (Luke always grabs the yellow one if he can)
        const left = [0, 1, 2, 3].filter(i => i !== car); const out = [];
        const luke = left.includes(2) ? 2 : left[0]; out.push([luke, 'LUKE']);
        const rest = left.filter(i => i !== luke); out.push([rest[0], 'DAVE']); out.push([rest[1], 'CAL']);
        return out;
      }
      function newCup(car) { champ = { race: 0, tries: 3, car, pts: { YOU: 0, DAVE: 0, LUKE: 0, CAL: 0 }, score: 0, wins: 0, bowl: 0, fast: 0 }; persist(); }
      function cupSkill(name, r) { return clamp(MATE_SKILL[name] - 0.04 + r * 0.012, 0.8, 1.02); }
      function startCupRace() { const r = champ.race; newRace({ ti: r, mode: 'champ', player: champ.car, rivals: cupRivals(champ.car).map(([ci, n]) => [ci, n, cupSkill(n, r)]) }); mode = 'race'; mt = 0; }
      function raceResults() {
        const R = race, p = R.pcar, od = order();
        const rows = od.map((c, k) => ({ name: c.name, ci: c.ci, t: c.fin ? c.finT : null, est: !!c.est, best: c.best, me: c === p, pos: k }));
        const pos = od.indexOf(p); const out = { rows, pos, mode: R.mode, ti: R.ti, best: p ? p.best : 99999, lapBest: R.best, fastest: R.bestBy === p, falls: p ? p.falls : 0, bowl: R.bowlDone || 0, t: 0 };
        if (R.mode === 'champ') {
          let sc = POSSC[pos] + (out.fastest ? 200 : 0) + (out.falls === 0 ? 150 : 0) + Math.min(1, out.bowl) * 100;
          out.sc = sc; out.qual = pos <= 1;
          od.forEach((c, k) => { champ.pts[c.name] = (champ.pts[c.name] || 0) + PTS[k]; });
          champ.score += sc; if (pos === 0) champ.wins++;
          if (out.qual) champ.race++; else champ.tries--;
          out.tries = champ.tries;
        }
        // best laps onto the cartridge
        if (p && p.best < 9999 && p.best > 5) { const tab = recs.laps[TRACKS[R.ti].id]; if (p.best < tab[tab.length - 1][1]) { out.lapRec = true; if (!pendLaps[R.ti] || p.best < pendLaps[R.ti]) pendLaps[R.ti] = p.best; } }
        return out;
      }
      function addLapRec(ti, t, nm) { const tab = recs.laps[TRACKS[ti].id]; tab.push([nm, +t.toFixed(2)]); tab.sort((a, b) => a[1] - b[1]); tab.length = 5; }
      function addHof(sc, nm) { recs.hof.push([nm, sc]); recs.hof.sort((a, b) => b[1] - a[1]); recs.hof.length = 6; }
      const pendLaps = {}; // best laps that will go on the cartridge (track index -> seconds)
      function flushLaps(nm) { for (const ti in pendLaps) { addLapRec(+ti, pendLaps[ti], nm); delete pendLaps[ti]; } persist(); }
      function finishGo(score, title, text, hof) { // the go is done: the cartridge's own tables first, then the runtime's score card
        finalScore = Math.max(0, Math.round(score)); endInfo = { title, text };
        // the server only believes so much per second; a CONTINUE'd cup can be bigger than that
        const cap = Math.floor((K.t + 5) * 145); if (finalScore > cap) finalScore = cap;
        const pend = [];
        for (const ti in pendLaps) pend.push({ k: 'lap', ti: +ti, t: pendLaps[ti] });
        if (hof && finalScore > recs.hof[recs.hof.length - 1][1]) pend.push({ k: 'hof', sc: finalScore });
        pages = [];
        if (pend.length) { const nm = (recs.name || 'JACK').slice(0, 8); name = { s: nm.split(''), cur: nm.length, pend }; mode = 'name'; mt = 0; song('menu'); }
        else { if (hof) pages.push(0); if (res) pages.push(res.ti + 1); mode = 'tables'; mt = 0; newRecs = []; }
      }
      let pages = [];
      // ---- update
      function update() {
        mt += 1 / 60;
        if (mode === 'title') {
          demo();
          if (mt > 0.5 && (K.pressed('start') || K.pressed('a'))) { S.ok(); toMenu(); }
          return;
        }
        if (mode === 'menu') { demo(); return menuUpdate(); }
        if (mode === 'carsel') return carselUpdate();
        if (mode === 'setup') return setupUpdate();
        if (mode === 'intro') { if (mt > 0.6 && (K.pressed('a') || K.pressed('start'))) { S.ok(); mode = 'race'; mt = 0; } return; }
        if (mode === 'race') return raceUpdate();
        if (mode === 'results') return resultsUpdate();
        if (mode === 'name') return nameUpdate();
        if (mode === 'cupend') { if (mt > 1.5 && (K.pressed('a') || K.pressed('start'))) { const ce = res.cupEnd; S.ok(); finishGo(ce.sc, ce.won ? 'CHAMPION!' : 'RUNNER UP', ce.won ? 'The Teeny Cup is yours. Cal is fuming.' : ce.tab[0][0] + ' took the cup. Have another go!', true); } return; }
        if (mode === 'tables') {
          if (mt > 0.8 && !reported && (K.pressed('a') || K.pressed('start') || mt > 15)) {
            if (pages.length > 1) { pages.shift(); mt = 0; S.blip(); return; }
            reported = true; K.over(finalScore, endInfo);
          }
          return;
        }
        if (mode === 'records') { if (K.pressed('left')) { pick.page = (pick.page + TRACKS.length) % (TRACKS.length + 1); S.blip(); } if (K.pressed('right')) { pick.page = (pick.page + 1) % (TRACKS.length + 1); S.blip(); } if (K.pressed('b') || K.pressed('start') || K.pressed('a')) { S.back(); mode = 'menu'; mt = 0; } return; }
      }
      function demo() { if (!race || race.mode !== 'demo') startDemo(); stepRace(); demoT += 1 / 60; if (demoT > 30) startDemo(); }
      function menuItems() { const it = []; if (champ) it.push(['cont', 'CONTINUE CUP: RACE ' + (champ.race + 1) + ' OF 6']); it.push(['cup', champ ? 'NEW TEENY CUP' : 'THE TEENY CUP']); it.push(['h2h', 'HEAD TO HEAD']); it.push(['tt', 'TIME TRIAL']); it.push(['rec', 'RECORDS']); return it; }
      function menuUpdate() {
        const it = menuItems();
        if (K.pressed('up')) { sel = (sel + it.length - 1) % it.length; S.blip(); }
        if (K.pressed('down')) { sel = (sel + 1) % it.length; S.blip(); }
        if (K.pressed('b')) { S.back(); mode = 'title'; mt = 0; song('title'); return; }
        if (mt > 0.25 && (K.pressed('a') || K.pressed('start'))) {
          const k = it[sel][0]; S.ok();
          if (k === 'cont') { startCupRace(); mode = 'intro'; mt = 0; song('menu'); }
          else if (k === 'cup') { pick.next = 'cup'; mode = 'carsel'; mt = 0; pick.car = champ ? champ.car : pick.car; }
          else if (k === 'h2h') { pick.next = 'h2h'; mode = 'carsel'; mt = 0; }
          else if (k === 'tt') { pick.next = 'tt'; mode = 'carsel'; mt = 0; }
          else { mode = 'records'; mt = 0; pick.page = 0; }
        }
      }
      function carselUpdate() {
        if (K.pressed('left')) { pick.car = (pick.car + 3) % 4; S.blip(); }
        if (K.pressed('right')) { pick.car = (pick.car + 1) % 4; S.blip(); }
        if (K.pressed('b')) { S.back(); mode = 'menu'; mt = 0; return; }
        if (mt > 0.3 && (K.pressed('a') || K.pressed('start'))) {
          S.ok();
          if (pick.next === 'cup') { newCup(pick.car); goStart = K.t; startCupRace(); mode = 'intro'; mt = 0; }
          else { mode = 'setup'; mt = 0; pick.slot = 0; }
        }
      }
      function setupUpdate() {
        const rows = pick.next === 'h2h' ? 2 : 1;
        if (K.pressed('up')) { pick.slot = (pick.slot + rows - 1) % rows; S.blip(); }
        if (K.pressed('down')) { pick.slot = (pick.slot + 1) % rows; S.blip(); }
        const d = (K.pressed('right') ? 1 : 0) - (K.pressed('left') ? 1 : 0);
        if (d) { S.blip(); if (pick.slot === 0) pick.ti = (pick.ti + d + TRACKS.length) % TRACKS.length; else pick.rival = (pick.rival + d + 3) % 3; }
        if (K.pressed('b')) { S.back(); mode = 'carsel'; mt = 0; return; }
        if (mt > 0.3 && (K.pressed('a') || K.pressed('start'))) {
          S.ok(); goStart = K.t;
          if (pick.next === 'h2h') { const rn = ['LUKE', 'DAVE', 'CAL'][pick.rival], rc = pick.car === 2 ? (rn === 'LUKE' ? 0 : 2) : rn === 'LUKE' ? 2 : (pick.car + 1) % 4 === 2 ? (pick.car + 2) % 4 : (pick.car + 1) % 4; newRace({ ti: pick.ti, mode: 'h2h', player: pick.car, rivals: [[rc, rn, MATE_SKILL[rn]]] }); }
          else newRace({ ti: pick.ti, mode: 'tt', player: pick.car, rivals: [] });
          mode = 'intro'; mt = 0;
        }
      }
      function raceUpdate() {
        if (K.pressed('start') && !race.over) { paused = !paused; psel = 0; S.blip(); if (paused) K.music(null); else K.music(curSong ? SONGS[curSong] : null); return; }
        if (paused) {
          if (K.pressed('up') || K.pressed('down')) { psel ^= 1; S.blip(); }
          if (K.pressed('a')) { if (psel === 0) { paused = false; K.music(curSong ? SONGS[curSong] : null); } else { paused = false; S.back(); flushLaps(recs.name || 'JACK'); song('menu'); toMenu(); } }
          if (K.pressed('b')) { paused = false; K.music(curSong ? SONGS[curSong] : null); }
          return;
        }
        stepRace();
        if (race.over) {
          if (race.mode === 'h2h') { const won = race.winner === race.pcar, rn = cars.find(c => c !== race.pcar).name; const sc = won ? 1000 + { LUKE: 0, DAVE: 300, CAL: 600 }[rn] : 100 * Math.max(0, race.pcar.lights); res = raceResults(); res.h2h = { won, rn, sc }; mode = 'results'; mt = 0; song('menu'); return; }
          res = raceResults(); mode = 'results'; mt = 0; song('menu');
          if (race.mode === 'champ') persist();
        }
      }
      function resultsUpdate() {
        if (mt < 0.8 || !(K.pressed('a') || K.pressed('start'))) return;
        S.ok();
        if (res.mode === 'champ') {
          if (res.page !== 1) { res.page = 1; mt = 0.3; return; } // first the race, then the cup table
          if (champ.tries <= 0) { const sc = champ.score, rn = champ.race; champ = null; persist(); S.lose(); finishGo(sc, 'OUT OF THE CUP', 'No tries left on race ' + (rn + 1) + '. Have another go!', true); return; }
          if (champ.race >= 6) { // the cup is over
            const tab = Object.entries(champ.pts).sort((a, b) => b[1] - a[1]), won = tab[0][0] === 'YOU';
            let sc = champ.score + (won ? 3000 : 1000) + champ.tries * 500;
            champ = null; persist();
            if (won) { K.secret('lk.teeny.cup'); }
            res.cupEnd = { tab, won, sc }; mode = 'cupend'; mt = 0; song(won ? 'champ' : 'menu'); if (won) S.win();
            return;
          }
          startCupRace(); mode = 'intro'; mt = 0; return;
        }
        if (res.mode === 'h2h') return finishGo(res.h2h.sc, res.h2h.won ? 'YOU WIN!' : res.h2h.rn + ' WINS', res.h2h.won ? `You left ${res.h2h.rn} in the dust.` : `${res.h2h.rn} is unbearable now.`);
        // time trial: a medal by your best lap against the cartridge's table
        const tab = LAPREC[TRACKS[res.ti].id], b = res.best;
        const medal = b < tab[0][1] ? 3 : b < tab[2][1] ? 2 : b < tab[4][1] ? 1 : 0; res.medal = medal;
        return finishGo([250, 600, 1000, 1500][medal], ['NO MEDAL', 'BRONZE', 'SILVER', 'GOLD!'][medal], 'Best lap ' + fmt(b) + ' on ' + TRACKS[res.ti].name.toLowerCase() + '.');
      }
      const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!? ';
      function nameUpdate() { // up/down: the letter. right/A: next (A on the empty end: done). left: back. B: rub out. START: done
        const n = name; if (mt < 0.4) return;
        if (K.pressed('start')) return doneName();
        const ud = (K.pressed('up') ? 1 : 0) - (K.pressed('down') ? 1 : 0);
        if (ud) { if (n.cur >= n.s.length) { if (n.s.length >= 8) return; n.s.push(ud > 0 ? 'A' : 'Z'); } else { let i = CH.indexOf(n.s[n.cur]); if (i < 0) i = CH.length - 1; n.s[n.cur] = CH[(i + ud + CH.length) % CH.length]; } S.blip(); }
        if (K.pressed('a')) { if (n.cur >= n.s.length || n.cur >= 7) return doneName(); n.cur++; S.blip(); }
        if (K.pressed('right')) { if (n.cur < n.s.length && n.cur < 7) { n.cur++; S.blip(); } }
        if (K.pressed('left')) { if (n.cur > 0) { n.cur--; S.blip(); } }
        if (K.pressed('b')) { if (n.cur > 0) { n.s.splice(n.cur - 1, 1); n.cur--; S.back(); } else if (n.s.length) { n.s.splice(0, 1); S.back(); } }
      }
      function doneName() {
        const nm = name.s.join('').trim().slice(0, 8) || 'JACK'; recs.name = nm; newRecs = []; pages = [];
        for (const p of name.pend) { if (p.k === 'lap') { addLapRec(p.ti, p.t, nm); delete pendLaps[p.ti]; newRecs.push('lap:' + p.ti); pages.push(p.ti + 1); } else { addHof(p.sc, nm); newRecs.push('hof'); pages.unshift(0); } }
        persist(); S.ok(); mode = 'tables'; mt = 0;
      }

      // ---- drawing the screens
      let LOGO = null;
      function logo() {
        if (LOGO) return LOGO;
        const c = mkc(300, 92), x = c.getContext('2d');
        const word = (s, cx, y, k, face, side) => { const w = F.width(s, k); for (let d = 6; d > 0; d--) F.draw(x, s, cx - w / 2 + d * 0.5, y + d, d > 3 ? '#200800' : side, k); F.draw(x, s, cx - w / 2, y, face, k); };
        word('TEENY', 150, 4, 6, '#ffe040', '#c03000');
        word('MOTORS', 150, 50, 5, '#ffffff', '#1040c0');
        // shine the letters: a gradient on the faces
        x.globalCompositeOperation = 'source-atop'; const gr = x.createLinearGradient(0, 0, 0, 92); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(0.3, 'rgba(255,255,255,0)'); gr.addColorStop(0.42, 'rgba(255,120,0,.25)'); gr.addColorStop(0.55, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(0,0,80,.25)'); x.fillStyle = gr; x.fillRect(0, 0, 300, 92);
        return LOGO = crisp(c, '#100410', true);
      }
      function dim(a) { g.fillStyle = `rgba(4,4,24,${a})`; g.fillRect(0, 0, W, H); }
      function drawTitle() {
        drawWorld(); dim(0.35);
        const bob = Math.round(Math.sin(mt * 2) * 2);
        g.drawImage(logo(), W / 2 - 150, 24 + bob);
        // a stripe with a car zooming across it
        const sy = 122; g.fillStyle = '#e8341c'; g.fillRect(0, sy, W, 18); g.fillStyle = '#ffd040'; g.fillRect(0, sy, W, 2); g.fillRect(0, sy + 16, W, 2);
        F.center(g, 'THE HOUSEHOLD GRAND PRIX', W / 2, sy + 5, '#ffffff', 1, '#600000');
        const cx = ((mt * 140) % (W + 80)) - 40; g.drawImage(SP_.car[1][0], Math.round(cx) - 20, sy - 30); g.drawImage(SP_.car[0][0], Math.round(cx) - 60, sy - 36);
        if ((mt * 2 | 0) % 2 === 0) F.center(g, 'PRESS START', W / 2, 158, '#ffffff', 2, '#000');
        F.center(g, 'CUP RECORD ' + recs.hof[0][1] + ' ' + recs.hof[0][0], W / 2, 184, '#ffd040', 1, '#000');
        F.center(g, '© 1999 TINY TOAD SOFTWARE', W / 2, 206, '#a0b0d0', 1, '#000');
      }
      function box(x, y, w, h, col) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x + 3, y + 3, w, h); g.fillStyle = col || '#14206a'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x, y, w, 2); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y + h - 2, w, 2); g.strokeStyle = '#ffd040'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
      function drawMenu() {
        drawWorld(); dim(0.45);
        g.drawImage(logo(), W / 2 - 150, 6);
        const it = menuItems(), y0 = 104, rh = 16, bw = 220;
        box(W / 2 - bw / 2, y0 - 8, bw, it.length * rh + 12);
        it.forEach(([k, s], i) => { const y = y0 + i * rh; if (i === sel) { g.fillStyle = '#e8341c'; g.fillRect(W / 2 - bw / 2 + 6, y - 3, bw - 12, 14); poly(g, [W / 2 - bw / 2 + 10, y, W / 2 - bw / 2 + 16, y + 4, W / 2 - bw / 2 + 10, y + 8], '#ffd040'); } F.center(g, s, W / 2, y, i === sel ? '#ffffff' : '#c0c8ff', 1, '#000'); });
        F.center(g, '↑↓ CHOOSE   ' + K.label('a') + ' OK   ' + K.label('b') + ' BACK', W / 2, H - 12, '#ffd040', 1, '#000');
        const tip = ['THE CUP: BEAT DAVE, LUKE AND CAL OVER SIX RACES.', 'HEAD TO HEAD: LEAVE YOUR MATE OFF THE SCREEN.', 'TIME TRIAL: JUST YOU AND THE CLOCK.', 'CAL SAYS THE BOWL IS A SHORT CUT. IS HE RIGHT?'][Math.floor(mt / 4) % 4];
        plate(0, H - 28, W, 12); F.center(g, tip, W / 2, H - 26, '#ffffff', 1, '#000');
      }
      function stat(x, y, label, n, col) { F.draw(g, label, x, y, '#c0c8ff', 1, '#000'); for (let k = 0; k < 5; k++) { rect(g, x + 46 + k * 9, y, 8, 7, '#000'); rect(g, x + 47 + k * 9, y + 1, 6, 5, k < n ? col : '#2a2a50'); } }
      function drawCarsel() {
        g.fillStyle = '#0c1440'; g.fillRect(0, 0, W, H);
        // a checkered floor in perspective-ish bands
        for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 8) if (((x + y + Math.floor(mt * 16) * 8) >> 3) & 1) rect(g, x, y, 8, 8, '#101c50');
        box(10, 6, W - 20, 22, '#e8341c'); F.center(g, 'PICK YOUR MOTOR', W / 2, 13, '#ffffff', 1, '#600000');
        const boat = false;
        for (let i = 0; i < 4; i++) {
          const cx = 42 + i * 79, cy = 66, on = i === pick.car;
          ell(g, cx, cy + 18, 30, 9, on ? '#ffd040' : '#28307a'); ell(g, cx, cy + 16, 30, 9, on ? '#e8a020' : '#1a2060');
          const k = on ? Math.floor(mt * 8) % 24 : 21; g.drawImage(bigCar(i, k, boat), cx - 38, cy - 38 + (on ? Math.round(Math.sin(mt * 6)) : 0));
          if (!on) { g.fillStyle = 'rgba(12,20,64,.45)'; g.fillRect(cx - 38, cy - 38, 76, 76); }
          F.center(g, CARS[i].name, cx, 92, on ? '#ffffff' : '#7080c0', 1, '#000');
        }
        const C = CARS[pick.car]; box(30, 108, W - 60, 86);
        F.center(g, C.blurb, W / 2, 116, '#ffd040', 1, '#000');
        stat(60, 132, 'SPEED', C.spd, '#f04030'); stat(60, 144, 'ZOOM', C.acc, '#f0a020'); stat(60, 156, 'GRIP', C.grp, '#40c040'); stat(60, 168, 'WEIGHT', C.wt, '#4080f0');
        const rv = pick.next === 'cup' ? cupRivals(pick.car) : null;
        if (rv) { F.draw(g, 'VS', 200, 132, '#c0c8ff', 1, '#000'); rv.forEach(([ci, n], k) => { helmet(206, 148 + k * 12, ci, false); F.draw(g, n, 216, 145 + k * 12, '#ffffff', 1, '#000'); }); if (pick.car === 2) F.draw(g, 'LUKE SULKS', 196, 182, '#ff9060', 1, '#000'); }
        F.center(g, '←→ CHOOSE   ' + K.label('a') + ' OK   ' + K.label('b') + ' BACK', W / 2, 206, '#ffffff', 1, '#000');
      }
      function drawSetup() {
        g.fillStyle = '#0c1440'; g.fillRect(0, 0, W, H);
        box(10, 6, W - 20, 22, '#e8341c'); F.center(g, pick.next === 'h2h' ? 'HEAD TO HEAD' : 'TIME TRIAL', W / 2, 13, '#ffffff', 1, '#600000');
        const T = TRACKS[pick.ti];
        box(20, 36, W - 40, pick.next === 'h2h' ? 150 : 150);
        const row = (i, y, label, val) => { const on = pick.slot === i; if (on) { g.fillStyle = '#e8341c'; g.fillRect(28, y - 3, W - 56, 14); } F.draw(g, label, 36, y, '#c0c8ff', 1, '#000'); F.center(g, '← ' + val + ' →', W / 2 + 40, y, '#ffffff', 1, '#000'); };
        row(0, 46, 'TRACK', T.name);
        // a little preview of the track's shape
        trackThumb(T, W / 2 - 60, 64, 120, 70);
        F.center(g, T.where + (T.boat ? ' (BOATS!)' : ''), W / 2, 140, '#ffd040', 1, '#000');
        if (pick.next === 'h2h') { const rn = ['LUKE', 'DAVE', 'CAL'][pick.rival]; row(1, 158, 'RIVAL', rn); F.center(g, { LUKE: 'GOES EASY ON YOU. MOSTLY.', DAVE: 'RECKONS HE IS UNBEATABLE.', CAL: 'IT IS HIS CARTRIDGE...' }[rn], W / 2, 172, '#a0b0e0', 1, '#000'); }
        else { const r = recs.laps[T.id][0]; F.center(g, 'LAP RECORD ' + fmt(r[1]) + ' ' + r[0], W / 2, 162, '#ffffff', 1, '#000'); }
        F.center(g, (pick.next === 'h2h' ? '↑↓ ' : '') + '←→ CHANGE   ' + K.label('a') + ' RACE   ' + K.label('b') + ' BACK', W / 2, 206, '#ffffff', 1, '#000');
      }
      const thumbs = {};
      function trackThumb(T, x, y, w, h) {
        const key = T.id + w; if (!thumbs[key]) {
          const S = T.S || (T.S = sampleTrack(T)), c = mkc(w, h), t = c.getContext('2d'), sc = Math.min((w - 8) / T.ww, (h - 8) / T.wh), ox = (w - T.ww * sc) / 2, oy = (h - T.wh * sc) / 2;
          t.fillStyle = { bfast: '#7a4a20', desk: '#8a9098', pond: '#2a6a50', bath: '#a8c8e0', pool: '#1a6a3a', sand: '#c8a868' }[T.theme]; t.fillRect(0, 0, w, h);
          t.lineJoin = 'round'; t.strokeStyle = '#000'; t.lineWidth = 7; t.beginPath(); for (let i = 0; i < S.N; i += 3) { const px = ox + S.X[i] * sc, py = oy + S.Y[i] * sc; i ? t.lineTo(px, py) : t.moveTo(px, py); } t.closePath(); t.stroke(); t.strokeStyle = '#f0f0f0'; t.lineWidth = 4; t.stroke();
          t.fillStyle = '#e8341c'; t.fillRect(ox + S.X[0] * sc - 2, oy + S.Y[0] * sc - 4, 4, 8);
          thumbs[key] = c;
        }
        rect(g, x - 2, y - 2, w + 4, h + 4, '#000'); g.drawImage(thumbs[key], x, y);
      }
      function drawIntro() {
        drawWorld(); dim(0.55);
        const T = TT; box(24, 18, W - 48, 186);
        const R = race;
        F.center(g, R.mode === 'champ' ? 'THE TEENY CUP: RACE ' + (R.ti + 1) + ' OF 6' : R.mode === 'h2h' ? 'HEAD TO HEAD' : 'TIME TRIAL', W / 2, 26, '#ffd040', 1, '#000');
        F.center(g, T.name, W / 2, 40, '#ffffff', 2, '#000');
        F.center(g, T.where, W / 2, 58, '#a0b0e0', 1, '#000');
        trackThumb(T, 44, 72, 110, 66);
        const tx = 166;
        F.draw(g, R.laps + ' LAPS' + (T.boat ? ' - BOATS!' : ''), tx, 74, '#ffffff', 1, '#000');
        if (R.mode === 'champ') { F.draw(g, 'FINISH 1ST OR 2ND', tx, 90, '#80ff80', 1, '#000'); F.draw(g, 'TO GO THROUGH.', tx, 100, '#80ff80', 1, '#000'); F.draw(g, 'TRIES LEFT ', tx, 116, '#ffffff', 1, '#000'); for (let k = 0; k < champ.tries; k++) g.drawImage(SP_.car[champ.car][24], tx + 56 + k * 22, 102); }
        else if (R.mode === 'h2h') { F.draw(g, 'THE CAMERA FOLLOWS', tx, 90, '#ffffff', 1, '#000'); F.draw(g, 'WHOEVER IS IN FRONT.', tx, 100, '#ffffff', 1, '#000'); F.draw(g, 'DROP OFF THE SCREEN', tx, 112, '#ff9060', 1, '#000'); F.draw(g, 'AND YOU LOSE A LIGHT.', tx, 122, '#ff9060', 1, '#000'); }
        else { const r = recs.laps[T.id]; F.draw(g, 'GOLD   ' + fmt(LAPREC[T.id][0][1]), tx, 90, '#ffd040', 1, '#000'); F.draw(g, 'SILVER ' + fmt(LAPREC[T.id][2][1]), tx, 100, '#d0d8e8', 1, '#000'); F.draw(g, 'BRONZE ' + fmt(LAPREC[T.id][4][1]), tx, 110, '#e09050', 1, '#000'); F.draw(g, 'RECORD ' + fmt(r[0][1]) + ' ' + r[0][0], tx, 124, '#80ff80', 1, '#000'); }
        F.center(g, T.tip, W / 2, 150, '#ffd040', 1, '#000');
        F.center(g, K.label('a') + '/UP: GO   ' + K.label('b') + '/DOWN: BRAKE   ←→ STEER', W / 2, 166, '#ffffff', 1, '#000');
        if ((mt * 2 | 0) % 2 === 0) F.center(g, 'PRESS ' + K.label('a') + ' WHEN READY', W / 2, 186, '#ffffff', 1, '#000');
      }
      function drawRace() {
        drawWorld(); hud();
        if (paused) { dim(0.55); box(W / 2 - 90, 70, 180, 84); F.center(g, 'PAUSED', W / 2, 80, '#ffd040', 2, '#000'); ['CARRY ON', race.mode === 'champ' ? 'QUIT TO MENU (CUP IS SAVED)' : 'QUIT TO MENU'].forEach((s, i) => { const y = 106 + i * 16; if (psel === i) { g.fillStyle = '#e8341c'; g.fillRect(W / 2 - 84, y - 3, 168, 14); } F.center(g, s, W / 2, y, '#ffffff', 1, '#000'); }); F.center(g, 'START OR ' + K.label('b') + ' TO CARRY ON', W / 2, 140, '#a0b0e0', 1, '#000'); }
      }
      function drawResults() {
        g.fillStyle = '#0c1440'; g.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 16) rect(g, 0, y, W, 8, '#0e1848');
        const r = res;
        if (r.mode === 'champ' && r.page === 1) return drawStandings();
        box(10, 6, W - 20, 22, '#e8341c'); F.center(g, r.mode === 'h2h' ? (r.h2h.won ? 'YOU WIN!' : r.h2h.rn + ' WINS!') : r.mode === 'tt' ? 'TIME TRIAL' : 'RESULTS: ' + TRACKS[r.ti].name, W / 2, 13, '#ffffff', 1, '#600000');
        if (r.mode === 'tt' || r.mode === 'h2h') {
          box(30, 40, W - 60, 120);
          const p = r.rows.find(x => x.me); let y = 52;
          if (r.mode === 'h2h') { F.center(g, r.h2h.won ? 'ALL EIGHT LIGHTS ARE YOURS' : r.h2h.rn + ' TOOK ALL EIGHT LIGHTS', W / 2, y, '#ffd040', 1, '#000'); y += 16; F.center(g, 'SCORE ' + r.h2h.sc, W / 2, y + 6, '#ffffff', 2, '#000'); y += 34; }
          F.center(g, 'BEST LAP ' + fmt(r.best), W / 2, y, '#80ff80', 1, '#000'); y += 14;
          if (r.mode === 'tt') { const tab = LAPREC[TRACKS[r.ti].id], b = r.best, md = b < tab[0][1] ? 3 : b < tab[2][1] ? 2 : b < tab[4][1] ? 1 : 0; medal(W / 2, y + 22, md); F.center(g, ['NO MEDAL THIS TIME', 'BRONZE MEDAL', 'SILVER MEDAL', 'GOLD MEDAL!'][md], W / 2, y + 48, ['#a0a0b0', '#e09050', '#e0e8f0', '#ffd040'][md], 1, '#000'); }
          if (r.lapRec) F.center(g, 'A NEW LAP RECORD!', W / 2, 146, (K.frame & 16) ? '#ffffff' : '#ffd040', 1, '#000');
        } else {
          box(20, 36, W - 40, 112);
          F.draw(g, 'POS', 30, 44, '#c0c8ff', 1); F.draw(g, 'NAME', 64, 44, '#c0c8ff', 1); F.draw(g, 'TIME', 150, 44, '#c0c8ff', 1); F.draw(g, 'BEST LAP', 214, 44, '#c0c8ff', 1);
          r.rows.forEach((x, k) => { const y = 58 + k * 18; if (x.me) { g.fillStyle = 'rgba(232,52,28,.6)'; g.fillRect(24, y - 4, W - 48, 15); } F.draw(g, ORD[k], 30, y, k === 0 ? '#ffd040' : '#ffffff', 1, '#000'); helmet(70, y + 3, x.ci, false); F.draw(g, x.name, 80, y, '#ffffff', 1, '#000'); F.draw(g, x.t != null ? fmt(x.t) : 'DNF', 150, y, x.est ? '#b0b8d0' : '#ffffff', 1, '#000'); F.draw(g, x.best < 9999 ? fmt(x.best) : '-', 214, y, x.best === r.lapBest ? '#80ff80' : '#ffffff', 1, '#000'); });
          const y = 156;
          box(20, y, W - 40, 40, r.qual ? '#106a20' : '#7a1a10');
          F.center(g, r.qual ? 'THROUGH TO THE NEXT RACE!' : 'NOT QUALIFIED: ' + (r.tries > 0 ? r.tries + (r.tries === 1 ? ' TRY' : ' TRIES') + ' LEFT' : 'NO TRIES LEFT'), W / 2, y + 6, '#ffffff', 1, '#000');
          const bits = ['+' + POSSC[r.pos]]; if (r.fastest) bits.push('FASTEST LAP +200'); if (!r.falls) bits.push('NO FALLS +150'); if (r.bowl) bits.push('BOWL +100');
          F.center(g, bits.join('  '), W / 2, y + 18, '#ffd040', 1, '#000'); F.center(g, 'CUP SCORE ' + champ.score, W / 2, y + 28, '#ffffff', 1, '#000');
        }
        if (mt > 0.8 && (mt * 2 | 0) % 2 === 0) F.center(g, 'PRESS ' + K.label('a'), W / 2, 208, '#ffffff', 1, '#000');
      }
      function medal(x, y, md) { const col = ['#606070', '#c87830', '#c8d0e0', '#f8c820'][md]; poly(g, [x - 10, y - 26, x - 4, y - 12, x + 4, y - 12, x + 10, y - 26], '#2a5ae8'); circ(g, x + 1, y + 1, 14, '#000'); circ(g, x, y, 14, col); circ(g, x - 3, y - 3, 6, 'rgba(255,255,255,.45)'); F.center(g, String(md || '-'), x, y - 3, '#000', 1); }
      function drawStandings() {
        box(10, 6, W - 20, 22, '#e8341c'); F.center(g, 'THE TEENY CUP TABLE', W / 2, 13, '#ffffff', 1, '#600000');
        const tab = Object.entries(champ ? champ.pts : {}).sort((a, b) => b[1] - a[1]);
        box(40, 38, W - 80, 96);
        tab.forEach(([n, p], k) => { const y = 48 + k * 20; if (n === 'YOU') { g.fillStyle = 'rgba(232,52,28,.6)'; g.fillRect(46, y - 4, W - 92, 15); } F.draw(g, ORD[k], 52, y, '#ffd040', 1, '#000'); F.draw(g, n, 92, y, '#ffffff', 1, '#000'); F.draw(g, p + ' PTS', 200, y, '#ffffff', 1, '#000'); });
        // the ladder: six little track tiles
        for (let i = 0; i < 6; i++) { const x = 28 + i * 46, y = 146, done = champ && i < champ.race, cur = champ && i === champ.race; rect(g, x - 1, y - 1, 42, 30, cur && (K.frame & 16) ? '#ffd040' : '#000'); g.fillStyle = done ? '#106a20' : cur ? '#7a5a10' : '#20285a'; g.fillRect(x, y, 40, 28); F.center(g, String(i + 1), x + 20, y + 4, '#ffffff', 1, '#000'); F.center(g, TRACKS[i].name.split(' ')[0].slice(0, 6), x + 20, y + 16, done ? '#a0ffa0' : '#c0c8ff', 1, '#000'); }
        if (champ) F.center(g, champ.tries > 0 ? (champ.race < 6 ? 'NEXT: ' + TRACKS[champ.race].name : 'THE CUP IS DONE!') : 'OUT OF TRIES...', W / 2, 186, '#ffffff', 1, '#000');
        if (mt > 0.6 && (mt * 2 | 0) % 2 === 0) F.center(g, 'PRESS ' + K.label('a'), W / 2, 208, '#ffffff', 1, '#000');
      }
      function drawCupEnd() {
        const ce = res.cupEnd;
        g.fillStyle = ce.won ? '#3a1a60' : '#101840'; g.fillRect(0, 0, W, H);
        // rays
        if (ce.won) { g.save(); g.translate(W / 2, 92); g.rotate(mt * 0.3); for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); poly(g, [0, 0, 300, -30, 300, 30], i % 2 ? '#5a2a80' : '#4a2070'); } g.restore(); }
        // the cup
        const cx = W / 2, cy = 92 + Math.round(Math.sin(mt * 3) * 2);
        const cupCol = ce.won ? ['#f8d020', '#c89010', '#fff8a0'] : ['#c8d0e0', '#8890a8', '#ffffff'];
        rect(g, cx - 22, cy + 34, 44, 10, '#5a3a20'); rect(g, cx - 16, cy + 26, 32, 10, '#7a4a28'); rect(g, cx - 4, cy + 12, 8, 16, cupCol[1]);
        g.fillStyle = cupCol[0]; g.beginPath(); g.moveTo(cx - 28, cy - 34); g.lineTo(cx + 28, cy - 34); g.quadraticCurveTo(cx + 28, cy + 14, cx, cy + 14); g.quadraticCurveTo(cx - 28, cy + 14, cx - 28, cy - 34); g.fill();
        g.strokeStyle = cupCol[0]; g.lineWidth = 5; g.beginPath(); g.arc(cx - 30, cy - 18, 11, 1.2, 4.6); g.stroke(); g.beginPath(); g.arc(cx + 30, cy - 18, 11, -1.4, 1.9); g.stroke();
        rect(g, cx - 18, cy - 30, 6, 30, cupCol[2]); rect(g, cx + 12, cy - 30, 4, 24, cupCol[1]);
        F.center(g, ce.won ? 'CHAMPION!' : 'RUNNER UP', W / 2, 150, ce.won ? '#ffd040' : '#e0e8ff', 3, '#000');
        F.center(g, ce.won ? 'THE TEENY CUP IS YOURS. CAL IS FUMING.' : ce.tab[0][0] + ' TAKES THE CUP THIS TIME.', W / 2, 178, '#ffffff', 1, '#000');
        F.center(g, 'SCORE ' + ce.sc, W / 2, 192, '#80ff80', 1, '#000');
        if (ce.won && (K.frame % 6) === 0) for (let i = 0; i < 2; i++) puffConf();
        drawConf();
        if (mt > 1.5 && (mt * 2 | 0) % 2 === 0) F.center(g, 'PRESS ' + K.label('a'), W / 2, 210, '#ffffff', 1, '#000');
      }
      const conf = []; function puffConf() { if (conf.length > 80) conf.shift(); conf.push({ x: Math.random() * W, y: -4, vy: 0.6 + Math.random(), c: ['#ffd040', '#e8341c', '#2a5ae8', '#30b040', '#ffffff'][Math.random() * 5 | 0], ph: Math.random() * 6 }); }
      function drawConf() { for (const c of conf) { c.y += c.vy; c.x += Math.sin(mt * 3 + c.ph) * 0.4; rect(g, Math.round(c.x), Math.round(c.y), 3, 2, c.c); } }
      function drawName() {
        g.fillStyle = '#0c1440'; g.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 16) rect(g, 0, y, W, 8, '#0e1848');
        box(10, 6, W - 20, 22, '#e8341c'); F.center(g, 'NEW RECORD!', W / 2, 13, '#ffffff', 1, '#600000');
        let y = 38;
        for (const p of name.pend.slice(0, 3)) { F.center(g, p.k === 'lap' ? 'BEST LAP ' + fmt(p.t) + ': ' + TRACKS[p.ti].name : 'CUP SCORE ' + p.sc + ': HALL OF FAME', W / 2, y, '#ffd040', 1, '#000'); y += 11; }
        F.center(g, "PUT YOUR NAME ON CAL'S CARTRIDGE", W / 2, 78, '#ffffff', 1, '#000');
        const x0 = W / 2 - 8 * 15;
        for (let i = 0; i < 8; i++) {
          const x = x0 + i * 30, on = i === name.cur;
          rect(g, x + 2, 98, 26, 32, on ? '#e8341c' : '#14206a'); rect(g, x + 2, 98, 26, 2, 'rgba(255,255,255,.3)'); rect(g, x + 2, 128, 26, 2, '#ffd040');
          const ch = name.s[i]; if (ch && ch !== ' ') F.center(g, ch, x + 15, 106, '#ffffff', 2, '#000');
          if (on && (K.frame & 16)) { poly(g, [x + 15, 90, x + 10, 95, x + 20, 95], '#ffd040'); poly(g, [x + 15, 138, x + 10, 133, x + 20, 133], '#ffd040'); }
        }
        F.center(g, '↑↓ LETTER   ←→ MOVE   ' + K.label('b') + ' RUB OUT', W / 2, 152, '#c0c8ff', 1, '#000');
        F.center(g, K.label('a') + ' NEXT LETTER (OR DONE AT THE END)', W / 2, 164, '#c0c8ff', 1, '#000');
        if ((mt * 2 | 0) % 2 === 0) F.center(g, 'START WHEN DONE', W / 2, 184, '#ffd040', 1, '#000');
      }
      function drawTables(page) { // page 0: the hall of fame; 1..6: best laps on that track
        if (page == null) page = pages[0] || 0;
        g.fillStyle = '#0c1440'; g.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 16) rect(g, 0, y, W, 8, '#0e1848');
        const flash = (K.frame & 16) ? 'rgba(232,52,28,.85)' : 'rgba(232,52,28,.45)';
        if (page === 0) {
          box(10, 6, W - 20, 22, '#e8341c'); F.center(g, 'HALL OF FAME: THE TEENY CUP', W / 2, 13, '#ffffff', 1, '#600000');
          box(46, 38, W - 92, 128);
          let shown = false;
          recs.hof.forEach(([n, sc], k) => { const y = 50 + k * 19, me = !shown && newRecs.includes('hof') && n === recs.name && sc === finalScore; if (me) { shown = true; g.fillStyle = flash; g.fillRect(52, y - 4, W - 104, 15); } F.draw(g, (k + 1) + '.', 60, y, '#ffd040', 1, '#000'); F.draw(g, n, 84, y, '#ffffff', 1, '#000'); F.draw(g, String(sc), 262 - F.width(String(sc)), y, '#ffffff', 1, '#000'); });
          trophy(W / 2, 186);
        } else {
          const ti = page - 1, T = TRACKS[ti];
          box(10, 6, W - 20, 22, '#e8341c'); F.center(g, 'BEST LAPS: ' + T.name, W / 2, 13, '#ffffff', 1, '#600000');
          trackThumb(T, W / 2 - 40, 36, 80, 48);
          box(46, 92, W - 92, 102);
          let shown = false;
          recs.laps[T.id].forEach(([n, t], k) => { const y = 102 + k * 18, me = !shown && newRecs.includes('lap:' + ti) && n === recs.name; if (me) { shown = true; g.fillStyle = flash; g.fillRect(52, y - 4, W - 104, 15); } F.draw(g, (k + 1) + '.', 60, y, '#ffd040', 1, '#000'); F.draw(g, n, 84, y, '#ffffff', 1, '#000'); F.draw(g, fmt(t), 262 - F.width(fmt(t)), y, '#ffffff', 1, '#000'); });
        }
        if (mode === 'records') F.center(g, '←→ MORE TABLES   ' + K.label('b') + ' BACK', W / 2, 206, '#ffffff', 1, '#000');
        else if (mt > 0.8 && (mt * 2 | 0) % 2 === 0) F.center(g, 'PRESS ' + K.label('a'), W / 2, 206, '#ffffff', 1, '#000');
      }
      function trophy(x, y) { rect(g, x - 9, y + 8, 18, 5, '#5a3a20'); rect(g, x - 2, y + 2, 4, 7, '#c89010'); g.fillStyle = '#f8d020'; g.beginPath(); g.moveTo(x - 10, y - 10); g.lineTo(x + 10, y - 10); g.quadraticCurveTo(x + 10, y + 4, x, y + 4); g.quadraticCurveTo(x - 10, y + 4, x - 10, y - 10); g.fill(); rect(g, x - 7, y - 8, 2, 8, '#fff8a0'); }
      function draw() {
        if (mode === 'title') return drawTitle();
        if (mode === 'menu') return drawMenu();
        if (mode === 'carsel') return drawCarsel();
        if (mode === 'setup') return drawSetup();
        if (mode === 'intro') return drawIntro();
        if (mode === 'race') return drawRace();
        if (mode === 'results') return drawResults();
        if (mode === 'cupend') return drawCupEnd();
        if (mode === 'name') return drawName();
        if (mode === 'tables') return drawTables(null);
        if (mode === 'records') return drawTables(pick.page);
      }
      startDemo(); song('title');
      // ---- test hooks
      K.dbg = {
        st: () => ({ mode, race: race && { mode: race.mode, ti: race.ti, t: +race.t.toFixed(2), go: race.go, over: race.over, fin: race.fin }, cars: cars.map(c => ({ n: c.name, x: c.x | 0, y: c.y | 0, lap: c.lap, idx: c.idx, fin: c.fin, best: +c.best.toFixed(2), falls: c.falls, l: c.lights })), champ, sel, res: res && { pos: res.pos, sc: res.sc, qual: res.qual, mode: res.mode } }),
        race(ti, m, car) { m = m || 'tt'; if (m === 'champ') { newCup(car || 0); champ.race = ti; goStart = K.t; startCupRace(); } else if (m === 'h2h') newRace({ ti, mode: 'h2h', player: car || 0, rivals: [[1, 'DAVE', 0.95]] }); else newRace({ ti, mode: m, player: car || 0, rivals: m === 'tt' ? [] : [[1, 'DAVE', 0.95], [2, 'LUKE', 0.92], [3, 'CAL', 0.97]] }); mode = 'race'; mt = 0; },
        auto(on, sk) { if (race && race.pcar) { race.pcar.ai = !!on; race.pcar.skill = sk || 0.99; race.pcar.useAlt = on === 2; } },
        press(b) { const o = K.pressed; K.pressed = x => x === b || o(x); try { update(); } finally { K.pressed = o; } return K.dbg.st().mode; },
        put(x, y, a) { const p = race.pcar; p.x = x; p.y = y; p.a = a || 0; p.vx = p.vy = 0; p.idx = nearestIdx(B.S, x, y); },
        sim(ti, secs, sk) { // run a whole robot race flat out (no drawing): lap times, falls, stuck
          newRace({ ti, mode: 'demo', player: -1, rivals: [[0, 'CAL', sk || 1], [1, 'DAVE', sk || 1], [2, 'LUKE', sk || 1], [3, 'JK', sk || 1]] });
          race.mode = 'sim'; const n = (secs || 90) * 60; for (let i = 0; i < n; i++) stepRace();
          return cars.map(c => ({ n: c.name, lap: c.lap, laps: c.laps.map(x => +x.toFixed(2)), falls: c.falls, off: c.off }));
        },
        map(scale) { const s = scale || 0.25; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.drawImage(B.cv, 0, 0, B.T.ww * s, B.T.wh * s); mode = 'frozen'; },
        mat(x, y) { return matAt(x, y); },
        view(x, y) { cam.x = x; cam.y = y; },
        set(k, v) { if (k === 'mode') { mode = v; mt = 0; } else if (k === 'res') res = v; else if (k === 'champ') champ = v; else if (k === 'shake') shake = v; },
        fin() { const p = race.pcar; p.lap = race.laps - 1; p.maxLap = p.lap; p.idx = B.S.N - 3; const S2 = B.S; p.x = S2.X[p.idx]; p.y = S2.Y[p.idx]; p.a = S2.A[p.idx]; },
        step(n) { for (let i = 0; i < n; i++) update(); return K.dbg.st(); },
        name: () => name, recs: () => recs, B: () => B,
      };
      return {
        update() { if (mode === 'frozen') return; update(); },
        draw() { if (mode === 'frozen') return; draw(); },
        end() { song(null); B = null; cars = []; },
      };
    },
  });
})();

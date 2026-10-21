/* FORMULA NULL (Super Nintendo, came with the console): hover racing in proper Mode 7. The track floor is one big
 * procedurally painted 2048x2048 texture (palette indices, so the boost arrows, pit lane and sea shimmer cycle colour like
 * the real thing), drawn a scanline at a time with an affine projection into a Uint32 framebuffer. Parallax skylines turn
 * with you, rival cars are pre-rendered from little 3D models at 16 angles and scaled as sprites.
 * THE NULL CUP: CHROME CITY, PORT PIXEL, MUTE CANYON, BISCUIT FALLS. Eight cars, three laps, a rank limit each lap, spare
 * cars, points table, trophies. Practice mode (time trial against DAVE's ghost) and a best-lap table per track.
 * Go: A. Brake: B. Boost: Y (one per lap from lap 2). Lean: L / R (with a turn: tighter). Pause: START.
 * Secrets: win every race of a cup (lk.zero.gold), jump the harbour gap on PORT PIXEL from the blue ramp (lk.zero.jump).
 * Everything (art, models, tunes) is made up and drawn in code. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const W = 256, H = 224, HZ = 72;            // the screen and the horizon line
  const FOC = 160, CAM_H = 43, CAMD = 64;     // Mode 7 camera: focal length, height, distance behind the car
  const TS = 2048, TSH = 11, TM = TS - 1;     // the track texture (TS x TS palette indices)
  const DS = 4;                               // track samples every 4 texels
  const RW = 120, HW = 60, BW = 9, SHW = 10;  // road width, half width, barrier band, drop shadow
  const LAPS = 3, NCARS = 8;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  // 15-bit colour (5 bits a channel) like the real machine
  const q5 = v => Math.min(248, Math.max(0, Math.round(v) & 0xF8));
  function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const rgb32 = (r, g, b) => (255 << 24 | q5(b) << 16 | q5(g) << 8 | q5(r)) >>> 0;
  const hex32 = c => { const [r, g, b] = hex(c); return rgb32(r, g, b); };
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + [0, 1, 2].map(i => Math.round(lerp(A[i], B[i], t)).toString(16).padStart(2, '0')).join(''); };
  const shade = (c, k) => { const A = hex(c); return '#' + A.map(v => Math.round(clamp(v * k, 0, 255)).toString(16).padStart(2, '0')).join(''); };
  function prng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const fmt = t => { if (!(t > 0) || t > 5999) return "-'--\"--"; const m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor(t * 100) % 100; return `${m}'${String(s).padStart(2, '0')}"${String(c).padStart(2, '0')}`; };
  const ORD = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH'];
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ================================================================ palette layout (indices into the track texture)
  // 0-31 ground (theme), 32-63 the same ground in the track's shadow, 64-79 road, 80-95 barrier, 96-111 pit lane,
  // 112-127 dash plate, 128-143 jump ramp, 144-159 rough, 160-175 start line + grid, 176-255 spare
  const P_ROAD = 64, P_BAR = 80, P_PIT = 96, P_DASH = 112, P_JUMP = 128, P_ROUGH = 144, P_LINE = 160;
  const M_OFF = 0, M_ROAD = 1, M_BAR = 2, M_PIT = 3, M_DASH = 4, M_JUMP = 5, M_ROUGH = 6;
  const MAT = new Uint8Array(256);
  for (let i = 0; i < 256; i++) MAT[i] = i < 64 ? M_OFF : i < 80 ? M_ROAD : i < 96 ? M_BAR : i < 112 ? M_PIT : i < 128 ? M_DASH : i < 144 ? M_JUMP : i < 160 ? M_ROUGH : i < 176 ? M_ROAD : M_OFF;

  // ================================================================ the tracks: a rounded polygon (corners [x, y, radius]) in texels.
  // start: how far along the first edge the start line is. feat: [edge, from (0..1), to, kind, lat0, lat1] on the straight
  // part of an edge (kind: dash, jump, rough, pit, ramp). lat: + is the right-hand side.
  const TRACKS = [
    { id: 'chrome', name: 'CHROME CITY', sub: 'THE NEON STRIP', theme: 'city', par: 22.4, ref: 20.5,
      pts: [[1850, 1870, 240], [200, 1870, 240], [200, 200, 240], [880, 200, 200], [880, 1000, 170], [1400, 1000, 170], [1400, 200, 200], [1850, 200, 220], [1850, 800, 200], [1620, 1150, 200], [1850, 1450, 200]],
      start: 0.55,
      feat: [[1, 0.35, 0, 'dash', -12, 12], [1, 0.75, 0, 'dash', 6, 30], [3, 0.5, 0, 'dash', -30, -6], [5, 0.45, 0, 'dash', -12, 12], [7, 0.3, 0, 'dash', -30, -6],
        [8, 0.2, 0.8, 'rough', -58, -34, 'c'], [4, 0.2, 0.8, 'rough', -58, -34, 'c'], [0, 0.04, 0.33, 'pit', 30, 56]] },
    { id: 'port', name: 'PORT PIXEL', sub: 'THE HARBOUR RUN', theme: 'port', par: 18.3, ref: 16.86,
      pts: [[250, 1860, 220], [1850, 1860, 220], [1850, 520, 200], [1150, 520, 110], [1150, 170, 110], [900, 170, 110], [900, 520, 110], [250, 520, 200], [600, 1000, 180], [250, 1450, 180]],
      start: 0.5,
      feat: [[0, 0.62, 0, 'dash', -12, 12], [1, 0.4, 0, 'dash', 6, 30], [2, 0.25, 0, 'dash', -42, -18], [2, 0.82, 0, 'ramp', -50, -16], [8, 0.4, 0, 'dash', -12, 12],
        [7, 0.2, 0.8, 'rough', 34, 58, 'c'], [0, 0.04, 0.3, 'pit', -56, -30]] },
    { id: 'canyon', name: 'MUTE CANYON', sub: 'SHH! QUIET ZONE', theme: 'canyon', par: 25.4, ref: 23.15,
      pts: [[1850, 1860, 200], [200, 1860, 200], [200, 230, 200], [700, 230, 160], [700, 1100, 140], [1050, 1100, 140], [1050, 230, 160], [1850, 230, 200], [1850, 900, 180], [1450, 900, 140], [1450, 1450, 150], [1850, 1450, 160]],
      start: 0.55,
      feat: [[1, 0.2, 0, 'dash', -12, 12], [1, 0.5, 0, 'jump', -58, 58], [3, 0.1, 0, 'jump', -58, 58], [3, 0.7, 0, 'dash', -30, -6], [5, 0.4, 0, 'dash', 6, 30], [6, 0.5, 0, 'dash', -12, 12],
        [2, 0.2, 0.8, 'rough', 34, 58, 'c'], [3, 0.2, 0.8, 'rough', -58, -34, 'c'], [8, 0.2, 0.8, 'rough', -58, -34, 'c'], [10, 0.2, 0.8, 'rough', 34, 58, 'c'], [0, 0.04, 0.33, 'pit', 30, 56]] },
    { id: 'biscuit', name: 'BISCUIT FALLS', sub: 'CUSTARD CREEK', theme: 'biscuit', par: 27.4, ref: 24.93,
      pts: [[250, 1860, 200], [1850, 1860, 200], [1850, 1300, 140], [1320, 1300, 140], [1320, 900, 140], [1850, 900, 160], [1850, 190, 200], [1100, 190, 130], [1060, 1500, 130], [650, 1500, 130], [650, 600, 150], [250, 600, 190]],
      start: 0.5,
      feat: [[0, 0.62, 0, 'dash', -30, -6], [5, 0.4, 0, 'dash', -12, 12], [7, 0.2, 0, 'jump', -58, 58], [9, 0.15, 0, 'jump', -58, 58], [9, 0.75, 0, 'dash', 6, 30], [11, 0.4, 0, 'dash', 6, 30],
        [1, 0.2, 0.8, 'rough', -58, -34, 'c'], [2, 0.2, 0.8, 'rough', 34, 58, 'c'], [3, 0.2, 0.8, 'rough', 34, 58, 'c'], [8, 0.2, 0.8, 'rough', 34, 58, 'c'], [10, 0.2, 0.8, 'rough', -58, -34, 'c'], [0, 0.04, 0.3, 'pit', -56, -30]] },
  ];
  // corners -> straights and arcs
  function toSegs(pts) {
    const n = pts.length, d = [], len = [], t = [], segs = [];
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); d.push([(b[0] - a[0]) / l, (b[1] - a[1]) / l]); len.push(l); }
    const turn = []; for (let i = 0; i < n; i++) { const a = d[(i + n - 1) % n], b = d[i]; turn.push(Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1])); t.push(pts[i][2] * Math.tan(Math.abs(turn[i]) / 2)); }
    const bad = [];
    for (let i = 0; i < n; i++) { const st = len[i] - t[i] - t[(i + 1) % n]; if (st < 0) bad.push(i); segs.push(['s', Math.max(0, st), i]); segs.push(['a', turn[(i + 1) % n] * 180 / Math.PI, pts[(i + 1) % n][2], i]); }
    return { segs, h0: Math.atan2(d[0][1], d[0][0]), x0: pts[0][0] + d[0][0] * t[0], y0: pts[0][1] + d[0][1] * t[0], bad };
  }
  // the centre line, sampled every DS texels from the start line
  function geom(def) {
    const R = toSegs(def.pts), segs = R.segs;
    const S0 = []; let tot = 0; for (const s of segs) { S0.push(tot); tot += s[0] === 's' ? s[1] : s[2] * Math.abs(s[1]) * Math.PI / 180; }
    const shift = segs[0][1] * def.start;
    const N = Math.round(tot / DS), step = tot / N;
    const X = new Float32Array(N), Y = new Float32Array(N), A = new Float32Array(N), C = new Float32Array(N), SEG = new Uint8Array(N);
    let x = R.x0, y = R.y0, hh = R.h0, si = 0;
    const st = [];
    for (const s of segs) { st.push([x, y, hh]); if (s[0] === 's') { x += Math.cos(hh) * s[1]; y += Math.sin(hh) * s[1]; } else { const sg = Math.sign(s[1]), r = s[2], th = Math.abs(s[1]) * Math.PI / 180; const cx = x + sg * r * -Math.sin(hh), cy = y + sg * r * Math.cos(hh); hh += sg * th; x = cx + sg * r * Math.sin(hh); y = cy - sg * r * Math.cos(hh); } }
    const at = (d, o) => {
      d = (((d + shift) % tot) + tot) % tot;
      if (d < S0[si] || (si < segs.length - 1 && d >= S0[si + 1])) { si = 0; while (si < segs.length - 1 && d >= S0[si + 1]) si++; }
      const s = segs[si], [x0, y0, h0] = st[si], tt = d - S0[si];
      if (s[0] === 's') { o[0] = x0 + Math.cos(h0) * tt; o[1] = y0 + Math.sin(h0) * tt; o[2] = h0; o[3] = 0; }
      else { const sg = Math.sign(s[1]), r = s[2]; const cx = x0 + sg * r * -Math.sin(h0), cy = y0 + sg * r * Math.cos(h0), h1 = h0 + sg * tt / r; o[0] = cx + sg * r * Math.sin(h1); o[1] = cy - sg * r * Math.cos(h1); o[2] = h1; o[3] = sg / r; }
      o[4] = s[3]; return o;
    };
    const o = [0, 0, 0, 0, 0];
    let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
    for (let i = 0; i < N; i++) { at(i * step, o); X[i] = o[0]; Y[i] = o[1]; A[i] = o[2]; C[i] = o[3]; SEG[i] = o[4]; mnx = Math.min(mnx, o[0]); mxx = Math.max(mxx, o[0]); mny = Math.min(mny, o[1]); mxy = Math.max(mxy, o[1]); }
    const CS = new Float32Array(N);
    for (let i = 0; i < N; i++) { let a = 0, n = 0; for (let k = -14; k <= 14; k++) { a += C[(i + k + N) % N] * (15 - Math.abs(k)); n += 15 - Math.abs(k); } CS[i] = a / n; }
    // where each edge's straight starts and ends (in s from the start line)
    const edge = i => { const a = S0[i * 2]; return [(((a - shift) % tot) + tot) % tot, segs[i * 2][1]]; };
    const arc = i => { const a = S0[i * 2 + 1], sg = segs[i * 2 + 1]; return [(((a - shift) % tot) + tot) % tot, sg[2] * Math.abs(sg[1]) * Math.PI / 180]; };
    return { def, segs, L: tot, N, step, X, Y, A, C, CS, SEG, at, edge, arc, bbox: [mnx, mny, mxx, mxy], bad: R.bad };
  }
  // the s range of a feature
  const PLATE = { dash: 30, jump: 24, ramp: 44 };
  const featS = (G, f) => { const [a, l] = f[6] === 'c' ? G.arc(f[0]) : G.edge(f[0]); return PLATE[f[3]] ? [a + l * f[1], a + l * f[1] + PLATE[f[3]]] : [a + l * f[1], a + l * f[2]]; };


  // ================================================================ themes: ground tile, decorations, road colours, sky
  // tileable value noise over a 256 tile
  function noiseMap(rng, cells) {
    const g = new Float32Array(cells * cells); for (let i = 0; i < g.length; i++) g[i] = rng();
    const out = new Float32Array(65536), k = cells / 256;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const fx = x * k, fy = y * k, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const x1 = (ix + 1) % cells, y1 = (iy + 1) % cells;
      const a = g[iy * cells + ix], b = g[iy * cells + x1], c = g[y1 * cells + ix], d = g[y1 * cells + x1];
      out[y * 256 + x] = lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
    }
    return out;
  }
  function fbm(rng, list) { const out = new Float32Array(65536); let tot = 0; for (const [cells, w] of list) { const m = noiseMap(rng, cells); for (let i = 0; i < 65536; i++) out[i] += m[i] * w; tot += w; } for (let i = 0; i < 65536; i++) out[i] /= tot; return out; }
  const pad32 = a => { a = a.slice(); while (a.length < 32) a.push(a[a.length - 1] || '#000000'); return a; };
  // horizontal colour bands (the HDMA gradient look)
  function bands(g, y0, y1, cols, step) {
    step = step || 3; const n = Math.ceil((y1 - y0) / step);
    for (let i = 0; i < n; i++) { const t = i / Math.max(1, n - 1) * (cols.length - 1), k = Math.min(cols.length - 2, Math.floor(t)); g.fillStyle = mix(cols[k], cols[k + 1], t - k); g.fillRect(0, y0 + i * step, g.canvas.width, step); }
  }
  // draw something on a wrapping layer (x and x +- width)
  const wrapDraw = (w, fn) => { fn(0); fn(-w); fn(w); };
  // a 3D-looking rooftop: bevelled rect lit from the top-left (indices: base, light, dark)
  function bevel(T, x, y, w, h, base, li, dk) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const e = i === 0 || j === 0 ? li : (i === w - 1 || j === h - 1) ? dk : base; T[((y + j) & 255) * 256 + ((x + i) & 255)] = e; }
  }
  const THEMES = {
    city: {
      ground: ['#14162a', '#1e2138', '#a88830', '#3a3e5c', '#4c5578', '#6e7aa8', '#30365a', '#6c4878', '#946ca8', '#44304f', '#3a6274', '#5c94a8', '#26404e', '#a0a8c0', '#565c76', '#2c5a3c', '#1a3a26', '#3c7c4a', '#f8d860', '#68d8f8', '#f878c8', '#a8f878', '#b03048', '#e8e8f0', '#262a46', '#f8f0b0', '#0e1020', '#4a4e6a'],
      shadow: [0.42, 0.42, 0.62],
      road: ['#565c74', '#7c84a2', '#3c4156', '#d8e0ff', '#50566c', '#474c62', '#666e8c', '#9aa4c8'],
      bar: ['#e8e8f0', '#d82840', '#70e8ff', '#22243a', '#b8b8c8', '#a01830', '#181a2a'], lamp: ['#a8f8ff', '#203848'],
      pit: ['#f8a8f8', '#d860e0', '#a030b0', '#601870'], dash: ['#fff8c0', '#f8e040', '#f0a020', '#b05010'], jump: ['#ffffff', '#f88020'], ramp: ['#e0f8ff', '#3890f8'],
      rough: ['#3a3040', '#4a4058', '#2a2434', '#5a5068'],
      haze: '#b04880', hazeA: 0.85, blocks: 1,
      cyc: [{ i: 18, n: 4, every: 20, cols: ['#f8d860', '#68d8f8', '#f878c8', '#2a2a44'] }],
      tile(T, r) {
        T.fill(1);
        for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) {
          const X = bx * 128, Y = by * 128;
          // streets: dashed yellow centre lines
          for (let i = 0; i < 128; i++) { if ((i >> 3) & 1) { T[(Y + 10) * 256 + X + i] = 2; T[(Y + i) * 256 + X + 10] = 2; } }
          // pavement round the block
          bevel(T, X + 20, Y + 20, 104, 104, 3, 27, 24);
          // buildings in the block (or a park)
          const park = r() < 0.22;
          if (park) {
            bevel(T, X + 24, Y + 24, 96, 96, 15, 17, 16);
            for (let k = 0; k < 14; k++) { const cx = X + 32 + r() * 80 | 0, cy = Y + 32 + r() * 80 | 0, rr = 4 + r() * 5 | 0; for (let j = -rr - 2; j <= rr + 2; j++) for (let i = -rr - 2; i <= rr + 2; i++) { const d = i * i + j * j; if (d <= rr * rr) T[((cy + j) & 255) * 256 + ((cx + i) & 255)] = (i + j < -rr * 0.6) ? 17 : (i + j > rr * 0.5) ? 16 : 15 + (d < rr * rr * 0.5 ? 2 : 0); else if (d <= (rr + 2) * (rr + 2) && i + j > 0) T[((cy + j) & 255) * 256 + ((cx + i) & 255)] = 16; } }
          } else {
            const split = r() < 0.5 ? 1 : 2, rows = r() < 0.5 ? 1 : 2;
            for (let jy = 0; jy < rows; jy++) for (let ix = 0; ix < split; ix++) {
              const w = (96 / split | 0) - 6, h = (96 / rows | 0) - 6, x = X + 26 + ix * (96 / split | 0), y = Y + 26 + jy * (96 / rows | 0);
              const kind = r() * 3 | 0, base = [4, 7, 10][kind], li = base + 1, dk = base + 2;
              // the building's shadow (bottom-right)
              for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) T[((y + j + 5) & 255) * 256 + ((x + i + 5) & 255)] = 26;
              bevel(T, x, y, w, h, base, li, dk);
              bevel(T, x + 4, y + 4, w - 8, h - 8, base, dk, li); // the roof parapet (inset)
              // rooftop kit: air-con boxes, a water tank, lights
              for (let k = 0; k < 3 + r() * 4; k++) { const ax = x + 8 + r() * (w - 20) | 0, ay = y + 8 + r() * (h - 20) | 0, aw = 4 + r() * 6 | 0, ah = 4 + r() * 5 | 0; for (let j = 0; j < ah; j++) for (let i = 0; i < aw; i++) T[((ay + j + 2) & 255) * 256 + ((ax + i + 2) & 255)] = 26; bevel(T, ax, ay, aw, ah, 14, 13, 26); }
              if (r() < 0.35 && w > 40 && h > 40) { const cx = x + w / 2 | 0, cy = y + h / 2 | 0; for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) { const d = i * i + j * j; if (d <= 81) T[((cy + j) & 255) * 256 + ((cx + i) & 255)] = d > 64 ? 23 : 22; } for (let j = -5; j <= 5; j++) { T[((cy + j) & 255) * 256 + cx - 3] = 23; T[((cy + j) & 255) * 256 + cx + 3] = 23; } for (let i = -3; i <= 3; i++) T[cy * 256 + cx + i] = 23; }
              for (let k = 0; k < 6; k++) { const lx = x + 2 + r() * (w - 4) | 0, ly = r() < 0.5 ? y + 1 : y + h - 2; T[(ly & 255) * 256 + (lx & 255)] = 18 + (r() * 4 | 0); }
            }
          }
          // street lamps
          for (let i = 6; i < 128; i += 32) { T[(Y + 17) * 256 + X + i] = 25; T[(Y + i) * 256 + X + 17] = 25; }
        }
      },
      sky(g, w, h) {
        bands(g, 0, h, ['#06041a', '#140a34', '#2c1450', '#5a1c64', '#9a2c70', '#d84c6c', '#f88858'], 3);
        const r = prng(7); for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.3 ? '#f8f8ff' : '#8888c0'; g.fillRect(r() * w | 0, r() * h * 0.55 | 0, 1, 1); }
      },
      far(g, w, h) {
        const r = prng(11);
        // the moon
        wrapDraw(w, o => { g.fillStyle = '#f8e8c8'; g.beginPath(); g.arc(o + 700, 16, 11, 0, TAU); g.fill(); g.fillStyle = '#d8c0a0'; g.beginPath(); g.arc(o + 696, 13, 3, 0, TAU); g.arc(o + 704, 20, 2, 0, TAU); g.fill(); });
        let x = 0;
        while (x < w) {
          const bw = 10 + r() * 22 | 0, bh = 14 + r() * 30 | 0, col = r() < 0.5 ? '#3a1e5a' : '#30184e';
          wrapDraw(w, o => {
            g.fillStyle = col; g.fillRect(o + x, h - bh, bw, bh);
            g.fillStyle = '#48286c'; g.fillRect(o + x, h - bh, 2, bh);
            if (r() < 0.25) g.fillRect(o + x + bw / 2 | 0, h - bh - 6, 1, 6);
            for (let yy = h - bh + 3; yy < h - 2; yy += 3) for (let xx = x + 3; xx < x + bw - 2; xx += 3) if (r() < 0.22) { g.fillStyle = r() < 0.7 ? '#f8c860' : '#78d8f8'; g.fillRect(o + xx, yy, 1, 1); }
          });
          x += bw + (r() * 4 | 0);
        }
      },
      near(g, w, h) {
        const r = prng(12); let x = 0;
        while (x < w) {
          const bw = 18 + r() * 30 | 0, bh = 8 + r() * 18 | 0;
          const neon = r() < 0.3 ? (r() < 0.5 ? '#f858c8' : '#58e8f8') : null;
          const yy = h - bh, nx = x + 4 + (r() * 8 | 0);
          wrapDraw(w, o => {
            g.fillStyle = '#120a22'; g.fillRect(o + x, yy, bw, bh);
            g.fillStyle = '#24163e'; g.fillRect(o + x, yy, bw, 1); g.fillRect(o + x, yy, 1, bh);
            for (let j = yy + 3; j < h - 1; j += 4) for (let i = x + 2; i < x + bw - 2; i += 4) { if (((i * 7 + j * 3) % 5) < 2) { g.fillStyle = '#f8b848'; g.fillRect(o + i, j, 2, 1); } }
            if (neon) { g.fillStyle = neon; g.fillRect(o + nx, yy + 2, 10, 3); g.globalAlpha = 0.35; g.fillRect(o + nx - 2, yy, 14, 7); g.globalAlpha = 1; }
          });
          x += bw;
        }
      },
    },
    port: {
      ground: ['#1c58b0', '#2060b8', '#2466c0', '#2a6cc8', '#3478d0', '#5098e0', '#88c8f0', '#2060b8', '#e8f8ff', '#164a98', '#9a9a90', '#b8b8ac', '#76766e', '#d84030', '#3070d0', '#e8c020', '#38a050', '#f0f0f0', '#5a3a20', '#8a5a30', '#a87440', '#2a2a30', '#c8c8c0', '#6a6a64', '#e05028', '#20406a'],
      shadow: [0.5, 0.58, 0.72],
      road: ['#8a8c94', '#aaacb6', '#6a6c74', '#f8f8f8', '#84868e', '#7a7c84', '#9a9ca4', '#f8d020'],
      bar: ['#f8f8f8', '#2860d8', '#f8d020', '#2a2c38', '#c8c8d0', '#1840a0', '#202230'], lamp: ['#fff8a0', '#584818'],
      pit: ['#f8f8a8', '#e8d040', '#b89820', '#685010'], dash: ['#fff8c0', '#f8e040', '#f0a020', '#b05010'], jump: ['#ffffff', '#f88020'], ramp: ['#e8f8ff', '#3890f8'],
      rough: ['#6a6a60', '#7a7a70', '#5a5a52', '#8a8a80'],
      haze: '#c8e8ff', hazeA: 0.8,
      cyc: [{ i: 0, n: 8, every: 7, cols: ['#1c58b0', '#2060b8', '#2466c0', '#2a6cc8', '#3478d0', '#5098e0', '#80c0f0', '#3478d0'] }],
      tile(T, r) {
        const n = fbm(r, [[8, 1], [16, 0.5]]);
        for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
          const w = x * 0.7 + y + 14 * Math.sin(TAU * y / 128) + 9 * Math.sin(TAU * x / 64) + n[y * 256 + x] * 30;
          T[y * 256 + x] = ((w / 5 | 0) % 8 + 8) % 8;
          if (n[y * 256 + x] < 0.32) T[y * 256 + x] = 9;
        }
        for (let k = 0; k < 60; k++) T[(r() * 256 | 0) * 256 + (r() * 256 | 0)] = 8;
      },
      sky(g, w, h) { bands(g, 0, h, ['#1848b8', '#2a68d0', '#4a90e0', '#78b8f0', '#b0dcf8', '#e0f4ff'], 3); },
      far(g, w, h) {
        const r = prng(21);
        // clouds
        for (let k = 0; k < 9; k++) { const cx = r() * w, cy = 8 + r() * 18, s = 0.6 + r() * 0.8; wrapDraw(w, o => { for (let j = 0; j < 6; j++) { const px = o + cx + (j - 3) * 9 * s, py = cy + Math.sin(j * 1.7) * 3; g.fillStyle = '#c0d8f0'; g.beginPath(); g.ellipse(px, py + 2, 9 * s, 5 * s, 0, 0, TAU); g.fill(); g.fillStyle = '#f8fcff'; g.beginPath(); g.ellipse(px - 1, py, 8 * s, 4.5 * s, 0, 0, TAU); g.fill(); } }); }
        // far islands
        for (let k = 0; k < 6; k++) { const cx = r() * w, bw = 60 + r() * 90, bh = 8 + r() * 12; wrapDraw(w, o => { g.fillStyle = '#5a88b8'; g.beginPath(); g.ellipse(o + cx, h, bw, bh, 0, Math.PI, TAU); g.fill(); g.fillStyle = '#6a98c4'; g.beginPath(); g.ellipse(o + cx - bw * 0.2, h, bw * 0.6, bh * 0.8, 0, Math.PI, TAU); g.fill(); }); }
        // the lighthouse
        wrapDraw(w, o => { const lx = o + 300; g.fillStyle = '#5a88b8'; g.fillRect(lx - 12, h - 6, 26, 6); g.fillStyle = '#f0f0f0'; g.fillRect(lx - 3, h - 24, 6, 18); g.fillStyle = '#d83030'; g.fillRect(lx - 3, h - 20, 6, 3); g.fillRect(lx - 3, h - 13, 6, 3); g.fillStyle = '#f8e060'; g.fillRect(lx - 2, h - 27, 4, 3); g.fillStyle = '#303040'; g.fillRect(lx - 4, h - 28, 8, 1); });
      },
      near(g, w, h) {
        const r = prng(22); let x = 0;
        while (x < w) {
          const kind = r(), bw = 20 + r() * 40 | 0;
          wrapDraw(w, o => {
            if (kind < 0.35) { // warehouse
              const bh = 10 + r() * 8 | 0; g.fillStyle = '#7a5a48'; g.fillRect(o + x, h - bh, bw, bh); g.fillStyle = '#946e58'; g.fillRect(o + x, h - bh, bw, 2); g.fillStyle = '#5a4034'; for (let i = x + 3; i < x + bw - 3; i += 6) g.fillRect(o + i, h - bh + 4, 3, bh - 4);
            } else if (kind < 0.6) { // container stacks
              const cols = ['#d84030', '#3070d0', '#e8c020', '#38a050', '#e07020'];
              for (let j = 0; j < 3; j++) for (let i = 0; i < bw / 12 - 1; i++) if (r() < 0.8 || j === 0) { g.fillStyle = cols[(r() * 5) | 0]; g.fillRect(o + x + i * 12, h - 6 - j * 6, 11, 5); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(o + x + i * 12, h - 2 - j * 6, 11, 1); }
            } else if (kind < 0.8) { // a crane
              g.fillStyle = '#e8b020'; g.fillRect(o + x + 4, h - 34, 3, 34); g.fillRect(o + x + 14, h - 34, 3, 34); g.fillRect(o + x - 8, h - 36, 40, 3); g.fillStyle = '#a87810'; for (let j = h - 30; j < h; j += 6) g.fillRect(o + x + 4, j, 13, 1); g.fillStyle = '#303030'; g.fillRect(o + x + 26, h - 33, 1, 14);
            } else { // a ship
              g.fillStyle = '#28304a'; g.beginPath(); g.moveTo(o + x, h - 8); g.lineTo(o + x + bw, h - 8); g.lineTo(o + x + bw - 6, h); g.lineTo(o + x + 4, h); g.fill(); g.fillStyle = '#d83030'; g.fillRect(o + x + 2, h - 3, bw - 6, 1); g.fillStyle = '#f0f0f0'; g.fillRect(o + x + bw - 18, h - 16, 12, 8); g.fillStyle = '#303848'; g.fillRect(o + x + bw - 16, h - 14, 8, 2); g.fillStyle = '#e8b020'; g.fillRect(o + x + bw - 12, h - 22, 3, 6);
            }
          });
          x += bw + 6 + (r() * 12 | 0);
        }
      },
      // the quayside along the bottom and left: concrete with containers
      deco(tex, G, r, put) {
        const quay = (x0, y0, x1, y1) => {
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const e = x === x0 || y === y0; put(x, y, e ? 11 : ((x * 13 + y * 7) % 97 === 0 ? 12 : 10)); }
          for (let k = 0; k < (x1 - x0) * (y1 - y0) / 1800; k++) { const cw = 18 + (r() * 2 | 0) * 18, ch = 9, cx = x0 + 12 + r() * (x1 - x0 - 40) | 0, cy = y0 + 12 + r() * (y1 - y0 - 30) | 0, c = [13, 14, 15, 16, 24][r() * 5 | 0]; for (let j = 0; j < ch + 3; j++) for (let i = 0; i < cw + 3; i++) put(cx + i, cy + j, i >= cw || j >= ch ? 23 : (i % 3 === 0 ? 21 : c)); }
        };
        quay(0, 1960, 2048, 2048); quay(0, 0, 90, 2048); quay(1960, 0, 2048, 2048);
        // boats and buoys out on the water
        for (let k = 0; k < 90; k++) { const x = r() * 2048 | 0, y = r() * 2048 | 0, big = r() < 0.4; if (big) { const l = 22 + r() * 18 | 0, a = r() * TAU, ca = Math.cos(a), sa = Math.sin(a); for (let u = -l; u <= l; u++) for (let v = -7; v <= 7; v++) { const hw = 7 * Math.sqrt(1 - (u / l) * (u / l)); if (Math.abs(v) > hw) continue; const px = x + u * ca - v * sa | 0, py = y + u * sa + v * ca | 0; put(px + 3, py + 4, 9); } for (let u = -l; u <= l; u++) for (let v = -7; v <= 7; v++) { const hw = 7 * Math.sqrt(1 - (u / l) * (u / l)); if (Math.abs(v) > hw) continue; const px = x + u * ca - v * sa | 0, py = y + u * sa + v * ca | 0; put(px, py, Math.abs(v) > hw - 1.5 ? 17 : (u > -l * 0.3 && u < l * 0.2 && Math.abs(v) < hw - 3) ? 22 : 19); } } else { put(x, y, 13); put(x + 1, y, 13); put(x, y + 1, 13); put(x + 1, y + 1, 17); put(x + 2, y + 2, 9); } }
      },
    },
    canyon: {
      ground: ['#b06030', '#c06c38', '#cc7840', '#d88a4c', '#e09c5c', '#e8b070', '#a05028', '#8a4020', '#784050', '#8a5060', '#a06068', '#b87870', '#5a2a38', '#6c3444', '#f0c888', '#3a1a20', '#4a8040', '#68a050', '#e8e0d0'],
      shadow: [0.5, 0.38, 0.5],
      road: ['#a88c78', '#c4a892', '#86705e', '#f8f0e0', '#a08470', '#947a66', '#b49884', '#f8f0e0'],
      bar: ['#f8e8c8', '#e06020', '#ffd060', '#3a2028', '#c8b498', '#a04010', '#281418'], lamp: ['#fff0a0', '#604018'],
      pit: ['#a8f8f8', '#50d0e0', '#2090b0', '#105060'], dash: ['#fff8c0', '#f8e040', '#f0a020', '#b05010'], jump: ['#ffffff', '#e04060'], ramp: ['#e8f8ff', '#3890f8'],
      rough: ['#c88850', '#d8a060', '#a86838', '#e8b878'],
      haze: '#f0a060', hazeA: 0.85,
      cyc: [],
      tile(T, r) {
        const n = fbm(r, [[4, 1], [8, 0.6], [32, 0.25]]), rock = fbm(r, [[8, 1], [16, 0.5], [64, 0.2]]);
        for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
          const i = y * 256 + x, h = rock[i];
          if (h > 0.62) { // rock: shaded by slope (light from the top-left)
            const sl = (rock[((y + 1) & 255) * 256 + ((x + 1) & 255)] - rock[((y - 1) & 255) * 256 + ((x - 1) & 255)]) * 40;
            T[i] = h > 0.7 ? (sl < -0.4 ? 11 : sl > 0.4 ? 8 : 9 + (h > 0.76 ? 1 : 0)) : (sl < -0.3 ? 10 : sl > 0.3 ? 12 : 9);
            if (h > 0.62 && h < 0.635) T[i] = 13;
          } else {
            const rip = Math.sin(TAU * (x + y * 0.3 + n[i] * 60) / 16);
            let v = n[i] * 6 + rip * 0.7; T[i] = clamp(v | 0, 0, 5);
            if (rip > 0.92) T[i] = 5; if (rip < -0.95) T[i] = 6;
            if (h > 0.58 && h <= 0.62) T[i] = 7; // the rock's shadow
          }
        }
        for (let k = 0; k < 40; k++) T[(r() * 256 | 0) * 256 + (r() * 256 | 0)] = 14;
      },
      sky(g, w, h) { bands(g, 0, h, ['#20103a', '#4a1a50', '#8a2a50', '#c84838', '#f07830', '#f8b048', '#f8d070'], 3); },
      far(g, w, h) {
        // the sun, then layered mesas
        wrapDraw(w, o => { g.fillStyle = '#f8e080'; g.beginPath(); g.arc(o + 500, h - 10, 18, 0, TAU); g.fill(); g.fillStyle = '#f8f0b0'; g.beginPath(); g.arc(o + 500, h - 10, 13, 0, TAU); g.fill(); for (let j = 0; j < 4; j++) { g.fillStyle = '#f0a050'; g.fillRect(o + 478, h - 12 + j * 3, 44, 1); } });
        const r = prng(31); let x = 0;
        while (x < w) { const bw = 40 + r() * 70 | 0, bh = 12 + r() * 22 | 0, tw = bw * (0.5 + r() * 0.3) | 0; wrapDraw(w, o => { g.fillStyle = '#7a3a60'; g.beginPath(); g.moveTo(o + x, h); g.lineTo(o + x + (bw - tw) / 2, h - bh); g.lineTo(o + x + (bw + tw) / 2, h - bh); g.lineTo(o + x + bw, h); g.fill(); g.fillStyle = '#904670'; g.fillRect(o + x + (bw - tw) / 2 | 0, h - bh, tw / 2 | 0, 2); }); x += bw - 10 + (r() * 30 | 0); }
      },
      near(g, w, h) {
        const r = prng(32); let x = 0;
        while (x < w) {
          const bw = 30 + r() * 50 | 0, bh = 10 + r() * 20 | 0;
          const pts = []; for (let i = 0; i <= 6; i++) pts.push([x + bw * i / 6, h - bh * (0.6 + 0.4 * Math.sin(i / 6 * Math.PI)) - r() * 4]);
          wrapDraw(w, o => {
            g.fillStyle = '#6a2418'; g.beginPath(); g.moveTo(o + x, h); for (const p of pts) g.lineTo(o + p[0], p[1]); g.lineTo(o + x + bw, h); g.fill();
            g.fillStyle = '#a03c20'; g.beginPath(); g.moveTo(o + x, h); for (const p of pts.slice(0, 4)) g.lineTo(o + p[0], p[1] + 1); g.lineTo(o + x + bw * 0.4, h); g.fill();
            g.fillStyle = '#c85a30'; for (const p of pts.slice(0, 3)) g.fillRect(o + p[0], p[1] + 1, 4, 1);
            g.fillStyle = '#4a180e'; for (let j = h - bh * 0.5 | 0; j < h; j += 4) g.fillRect(o + x + bw * 0.5, j, bw * 0.4, 1);
          });
          x += bw - 6;
        }
        // a few cacti
        for (let k = 0; k < 10; k++) { const cx = r() * w | 0; wrapDraw(w, o => { g.fillStyle = '#2a5a28'; g.fillRect(o + cx, h - 12, 3, 12); g.fillRect(o + cx - 3, h - 9, 3, 1); g.fillRect(o + cx - 3, h - 12, 1, 4); g.fillRect(o + cx + 3, h - 7, 3, 1); g.fillRect(o + cx + 5, h - 10, 1, 4); }); }
      },
      deco(tex, G, r, put) {},
    },
    biscuit: {
      ground: ['#d89838', '#e0a444', '#e8b050', '#f0bc60', '#c88830', '#b07428', '#7a4818', '#f8d890', '#5a3018', '#6c3a1c', '#844824', '#4a2410', '#f8e070', '#f0d050', '#e8c040', '#f8f0a8', '#d02838', '#f05868', '#ffffff', '#a86420'],
      shadow: [0.55, 0.42, 0.42],
      road: ['#c898c8', '#e0b8e0', '#a878a8', '#ffffff', '#c090c0', '#b484b4', '#d4a8d4', '#f8e8f8'],
      bar: ['#f8f0d8', '#6a3418', '#f878b8', '#3a1a10', '#d8c8a8', '#4a2008', '#2a1008'], lamp: ['#fff0f8', '#683050'],
      pit: ['#f8f8a8', '#f8d850', '#d0a020', '#806010'], dash: ['#fff8c0', '#f8e040', '#f0a020', '#b05010'], jump: ['#ffffff', '#40b0f0'], ramp: ['#e8f8ff', '#3890f8'],
      rough: ['#e8d0a0', '#f8e8c0', '#c8a870', '#fff8e0'],
      haze: '#f8c0d0', hazeA: 0.8,
      cyc: [{ i: 12, n: 4, every: 8, cols: ['#f8e070', '#f0d050', '#e8c040', '#f0d050'] }, { i: 8, n: 4, every: 9, cols: ['#5a3018', '#6c3a1c', '#844824', '#6c3a1c'] }],
      tile(T, r) {
        const n = fbm(r, [[8, 1], [32, 0.5]]);
        for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const i = y * 256 + x; T[i] = clamp(n[i] * 5 | 0, 0, 3); }
        // a big biscuit's "docking" holes: little pits, dark top-left, lit bottom-right
        for (let y = 16; y < 256; y += 32) for (let x = 16; x < 256; x += 32) for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const d = i * i + j * j; if (d > 10) continue; T[(y + j) * 256 + x + i] = d > 5 ? (i + j < 0 ? 6 : 7) : 5; }
        for (let k = 0; k < 300; k++) { const x = r() * 256 | 0, y = r() * 256 | 0; T[y * 256 + x] = r() < 0.5 ? 18 : 4; }
      },
      sky(g, w, h) { bands(g, 0, h, ['#f878a8', '#f890b8', '#f8a8c0', '#f8c0c8', '#f8d8d0', '#fff0e0'], 3); },
      far(g, w, h) {
        const r = prng(41);
        for (let k = 0; k < 8; k++) { const cx = r() * w, cy = 8 + r() * 16; wrapDraw(w, o => { g.fillStyle = '#fff8fc'; for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse(o + cx + j * 8, cy + (j % 2) * 2, 8, 4, 0, 0, TAU); g.fill(); } }); }
        // giant biscuits standing on edge, with a custard waterfall
        let x = 0;
        while (x < w) { const rad = 14 + r() * 14, cx = x + rad; wrapDraw(w, o => { g.fillStyle = '#c88a48'; g.beginPath(); g.arc(o + cx, h - rad * 0.55, rad, 0, TAU); g.fill(); g.fillStyle = '#d89a58'; g.beginPath(); g.arc(o + cx - 2, h - rad * 0.55 - 2, rad - 3, 0, TAU); g.fill(); g.fillStyle = '#a86a30'; for (let a = 0; a < 6; a++) g.fillRect(o + cx + Math.cos(a) * rad * 0.5 | 0, h - rad * 0.55 + Math.sin(a) * rad * 0.5 | 0, 2, 2); }); x += rad * 2 + 6 + r() * 30; }
        wrapDraw(w, o => { g.fillStyle = '#f8d850'; g.fillRect(o + 620, h - 34, 14, 34); g.fillStyle = '#fff0a0'; for (let j = h - 34; j < h; j += 4) g.fillRect(o + 622 + (j % 8 ? 4 : 0), j, 4, 2); g.fillStyle = '#c87830'; g.fillRect(o + 610, h - 38, 34, 5); });
      },
      near(g, w, h) {
        const r = prng(42); let x = 0;
        while (x < w) {
          const kind = r(), bw = 20 + r() * 26 | 0;
          wrapDraw(w, o => {
            if (kind < 0.5) { // a wafer stack
              const bh = 8 + r() * 16 | 0; for (let j = 0; j < bh; j += 3) { g.fillStyle = j % 6 ? '#f0c0d0' : '#e8b060'; g.fillRect(o + x, h - j - 3, bw, 3); } g.fillStyle = '#c88840'; for (let i = x + 2; i < x + bw; i += 4) g.fillRect(o + i, h - bh, 1, bh);
            } else { // a jammy one
              const rr = bw / 2; g.fillStyle = '#c88840'; g.beginPath(); g.arc(o + x + rr, h - rr * 0.7, rr, Math.PI, TAU); g.fill(); g.fillStyle = '#d02838'; g.beginPath(); g.arc(o + x + rr, h - rr * 0.7 - 2, rr * 0.35, 0, TAU); g.fill(); g.fillStyle = '#f87080'; g.fillRect(o + x + rr - 2, h - rr * 0.7 - 5, 2, 2);
            }
          });
          x += bw + 4;
        }
      },
      deco(tex, G, r, put) {
        // custard pools and chocolate chunks
        for (let k = 0; k < 26; k++) { const x = r() * 2048 | 0, y = r() * 2048 | 0, rr = 20 + r() * 40 | 0; for (let j = -rr - 3; j <= rr + 3; j++) for (let i = -rr - 3; i <= rr + 3; i++) { const d = Math.sqrt(i * i + j * j) + Math.sin(Math.atan2(j, i) * 5) * 3; if (d > rr + 3) continue; put(x + i, y + j, d > rr ? (i + j > 0 ? 19 : 7) : 12 + (((d / 5) | 0) % 4)); } }
        for (let k = 0; k < 60; k++) { const x = r() * 2048 | 0, y = r() * 2048 | 0, s = 6 + r() * 8 | 0; for (let j = 0; j < s + 2; j++) for (let i = 0; i < s + 2; i++) put(x + i, y + j, i >= s || j >= s ? 6 : (i === 0 || j === 0) ? 10 : (i === s - 1 || j === s - 1) ? 11 : 9); }
        for (let k = 0; k < 40; k++) { const x = r() * 2048 | 0, y = r() * 2048 | 0, rr = 4 + r() * 6 | 0; for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) if (i * i + j * j <= rr * rr) put(x + i, y + j, (i + j < -rr / 2) ? 17 : 16); }
      },
    },
  };
  THEMES.city.deco = () => {};

  // ================================================================ painting a track into its texture
  function buildWorld(G) {
    const def = G.def, TH = THEMES[def.theme], rng = prng(def.id.length * 977 + def.pts.length * 31);
    const tex = new Uint8Array(TS * TS), tile = new Uint8Array(65536);
    TH.tile(tile, rng);
    for (let y = 0; y < TS; y++) { const ro = y << TSH, to = (y & 255) << 8; for (let x = 0; x < TS; x++) tex[ro + x] = tile[to + (x & 255)]; }
    if (TH.blocks) { // a city: shuffle 128-texel blocks from a few different tiles so it never repeats
      const alt = [tile]; for (let k = 0; k < 3; k++) { const t = new Uint8Array(65536); TH.tile(t, rng); alt.push(t); }
      for (let by = 0; by < TS / 128; by++) for (let bx = 0; bx < TS / 128; bx++) { const t = alt[rng() * 4 | 0], ox = (rng() * 2 | 0) * 128, oy = (rng() * 2 | 0) * 128; for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) tex[((by * 128 + y) << TSH) | (bx * 128 + x)] = t[(oy + y) * 256 + ox + x]; }
    }
    const put = (x, y, v) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < TS && y < TS) tex[(y << TSH) | x] = v; };
    if (TH.deco) TH.deco(tex, G, rng, put);
    const o = [0, 0, 0, 0, 0], L = G.L, EW = HW + BW;
    // 1: the track's shadow on the ground (lit from the top-left, so it falls down-right)
    for (let s = 0; s < L; s += 0.6) {
      G.at(s, o); const nx = -Math.sin(o[2]), ny = Math.cos(o[2]);
      for (let l = -EW; l <= EW; l += 0.6) { const x = (o[0] + nx * l + 9) | 0, y = (o[1] + ny * l + 12) | 0; if (x >= 0 && y >= 0 && x < TS && y < TS) { const k = (y << TSH) | x, v = tex[k]; if (v < 32) tex[k] = v + 32; } }
    }
    // 2: the barriers (the inner face on the sunny side is lit), with chase lights
    for (let s = 0; s < L; s += 0.5) {
      G.at(s, o); const nx = -Math.sin(o[2]), ny = Math.cos(o[2]);
      const blk = Math.floor(s / 14), lit = (nx * -0.7 + ny * -0.7) > 0; // left barrier's face points +N
      for (const sd of [-1, 1]) {
        const faceLit = sd < 0 ? lit : !lit;
        for (let l = HW; l <= EW; l += 0.5) {
          const d = l - HW; let v;
          if (d < 2.5) v = blk & 1 ? (faceLit ? P_BAR + 1 : P_BAR + 13) : (faceLit ? P_BAR : P_BAR + 12);
          else if (d < 7) { v = blk & 1 ? P_BAR + 1 : P_BAR; const ls = s % 14; if (ls > 5 && ls < 9 && d > 3.5 && d < 6) v = P_BAR + 4 + (blk & 7); }
          else v = d < 8 ? P_BAR + 3 : P_BAR + 14;
          put(o[0] + nx * l * sd, o[1] + ny * l * sd, v);
        }
      }
    }
    // 3: the road: panels with bevelled seams, edge lines, a bit of grime
    const hh = (a, b) => { let t = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); t = Math.imul(t ^ (t >>> 13), 1274126177); return ((t ^ (t >>> 16)) >>> 0) / 4294967296; };
    for (let s = 0; s < L; s += 0.5) {
      G.at(s, o); const nx = -Math.sin(o[2]), ny = Math.cos(o[2]);
      const ps = s % 64, pr = Math.floor(s / 64);
      for (let l = -HW; l < HW; l += 0.5) {
        const al = Math.abs(l), pl = l + 60, pc = Math.floor(pl / 30);
        let v = P_ROAD + (((pr + pc) & 1) ? 4 : 0);
        if (al > HW - 2) v = P_ROAD + 2;
        else if (al > HW - 4.5 && al < HW - 2.5) v = P_ROAD + 3;
        else if (ps < 1) v = P_ROAD + 2; else if (ps < 2) v = P_ROAD + 1;
        else if (pl % 30 < 1) v = P_ROAD + 2; else if (pl % 30 < 2) v = P_ROAD + 1;
        else { const q = hh(s * 0.5, l * 0.5); if (q < 0.04) v = P_ROAD + 5; else if (q > 0.975) v = P_ROAD + 6; }
        put(o[0] + nx * l, o[1] + ny * l, v);
      }
    }
    // 4: the start line (a chequered band) and the grid boxes
    for (let s = -2; s < 10; s += 0.5) { G.at(s, o); const nx = -Math.sin(o[2]), ny = Math.cos(o[2]); for (let l = -HW + 4; l < HW - 4; l += 0.5) put(o[0] + nx * l, o[1] + ny * l, P_LINE + ((((s + 2) / 4 | 0) + ((l + 60) / 4 | 0)) & 1)); }
    for (let k = 0; k < NCARS; k++) {
      const g0 = gridSlot(k);
      for (let s = g0[0] - 12; s <= g0[0] + 12; s += 0.5) { G.at(s, o); const nx = -Math.sin(o[2]), ny = Math.cos(o[2]); for (let l = g0[1] - 10; l <= g0[1] + 10; l += 0.5) { const e = Math.abs(s - g0[0]) > 11 || Math.abs(l - g0[1]) > 9; if (e) put(o[0] + nx * l, o[1] + ny * l, P_LINE + 2); } }
    }
    // 5: features
    const feats = [];
    for (const f of def.feat) {
      const [s0, s1] = featS(G, f), kind = f[3], l0 = f[4], l1 = f[5], lc = (l0 + l1) / 2;
      feats.push({ kind, s0, s1, l0, l1 });
      for (let s = s0; s < s1; s += 0.5) {
        G.at(s, o); const nx = -Math.sin(o[2]), ny = Math.cos(o[2]), u = s - s0, len = s1 - s0;
        for (let l = l0; l < l1; l += 0.5) {
          const rim = u < 2 || u > len - 2 || l < l0 + 2 || l > l1 - 2.5; let v;
          if (kind === 'dash') { const ch = (u - Math.abs(l - lc) * 0.9) + 64; v = rim ? P_DASH + 9 : (ch % 14 < 7 ? P_DASH + ((ch / 14 | 0) & 7) : P_DASH + 8); }
          else if (kind === 'pit') { const st = (u + Math.abs(l - lc) * 1.2 + 200) % 22; v = rim ? P_PIT + 9 : st < 4 ? P_PIT + (((u + Math.abs(l - lc) * 1.2 + 200) / 22 | 0) & 7) : P_PIT + 8; }
          else if (kind === 'jump') { const st = (u + 400) % 16; v = rim ? P_JUMP + 5 : (Math.abs(l - lc) < 10 && Math.abs(u - len / 2) < 8 && (u - len / 2) + Math.abs(l - lc) < 6) ? P_JUMP + 6 : st < 8 ? P_JUMP + ((u / 16 | 0) & 3) : P_JUMP + 4; }
          else if (kind === 'ramp') { const st = (u + 400) % 12; const ar = Math.abs(l - lc) < 7 && (u - len * 0.4) + Math.abs(l - lc) < 7 && u > len * 0.2; v = rim ? P_JUMP + 13 : ar ? P_JUMP + 14 : st < 6 ? P_JUMP + 8 + ((u / 12 | 0) & 3) : P_JUMP + 12; }
          else { const q = hh(s * 1.3, l * 1.7); v = P_ROUGH + (q < 0.3 ? 0 : q < 0.6 ? 1 : q < 0.85 ? 2 : 3); if (rim && q < 0.5) v = P_ROAD + 2; }
          put(o[0] + nx * l, o[1] + ny * l, v);
        }
      }
    }
    // the palette (15-bit), shadow copies of the ground, then the cycling groups
    const pal = new Uint32Array(256), sh = TH.shadow, gr = pad32(TH.ground);
    for (let i = 0; i < 32; i++) { const [r, g, b] = hex(gr[i]); pal[i] = rgb32(r, g, b); pal[i + 32] = rgb32(r * sh[0], g * sh[1], b * sh[2]); }
    TH.road.forEach((c, i) => { pal[P_ROAD + i] = hex32(c); });
    pal[P_BAR] = hex32(TH.bar[0]); pal[P_BAR + 1] = hex32(TH.bar[1]); pal[P_BAR + 2] = hex32(TH.bar[2]); pal[P_BAR + 3] = hex32(TH.bar[3]);
    pal[P_BAR + 12] = hex32(TH.bar[4]); pal[P_BAR + 13] = hex32(TH.bar[5]); pal[P_BAR + 14] = hex32(TH.bar[6]);
    for (let i = 0; i < 8; i++) pal[P_BAR + 4 + i] = hex32(TH.lamp[1]);
    const pc = TH.pit; pal[P_PIT + 8] = hex32(mix(TH.road[0], pc[3], 0.45)); pal[P_PIT + 9] = hex32(pc[1]);
    pal[P_DASH + 8] = hex32('#603010'); pal[P_DASH + 9] = hex32('#f8f0d0');
    pal[P_JUMP + 4] = hex32(shade(TH.jump[1], 0.55)); pal[P_JUMP + 5] = hex32('#f8f8f8'); pal[P_JUMP + 6] = hex32('#ffffff');
    pal[P_JUMP + 12] = hex32('#1838a0'); pal[P_JUMP + 13] = hex32('#e8f0ff'); pal[P_JUMP + 14] = hex32('#ffffff');
    TH.rough.forEach((c, i) => { pal[P_ROUGH + i] = hex32(c); });
    pal[P_LINE] = hex32('#f8f8f8'); pal[P_LINE + 1] = hex32('#202028'); pal[P_LINE + 2] = hex32('#e8e8f0');
    const cyc = [
      { i: P_BAR + 4, n: 8, every: 3, cols: [TH.lamp[0], mix(TH.lamp[0], TH.lamp[1], 0.5), TH.lamp[1], TH.lamp[1], TH.lamp[1], TH.lamp[1], TH.lamp[1], TH.lamp[1]] },
      { i: P_PIT, n: 8, every: 4, cols: [pc[0], pc[1], pc[2], pc[3], pc[3], pc[2], pc[1], pc[0]] },
      { i: P_DASH, n: 8, every: 3, cols: ['#fff8d0', TH.dash[1], TH.dash[2], TH.dash[3], '#702808', '#702808', TH.dash[3], TH.dash[2]] },
      { i: P_JUMP, n: 4, every: 6, cols: [TH.jump[0], TH.jump[1], shade(TH.jump[1], 0.8), TH.jump[1]] },
      { i: P_JUMP + 8, n: 4, every: 5, cols: ['#e8f8ff', '#58b0ff', '#2868e0', '#58b0ff'] },
    ].concat(TH.cyc.map(c => Object.assign({ ground: 1 }, c)));
    for (const c of cyc) { c.c32 = c.cols.map(hex32); if (c.ground) c.s32 = c.cols.map(x => { const [r, g, b] = hex(x); return rgb32(r * sh[0], g * sh[1], b * sh[2]); }); }
    return { tex, tile, pal, cyc, feats, TH };
  }
  // grid slot k (0 = pole): [s, lat]
  function gridSlot(k) { const row = k >> 1, side = k & 1 ? 1 : -1; return [-34 - row * 46 - (side > 0 ? 22 : 0), side * 28]; }


  // ================================================================ the cars: little 3D models, pre-rendered to sprites
  // model space: x forward, y right, z up (texels). Faces: { p: [[x, y, z]...], c: role, n: normal, m: centre }
  const MACHINES = [
    { id: 'comet', name: 'BLUE COMET', pilot: 'ACE NOVA', shape: 'comet', body: '#2858e8', trim: '#f0f0f8', acc: '#f8c820', stats: [3, 3, 3, 3], vmax: 360, accel: 150, grip: 5.5, turn: 3.0, wt: 1.0, blurb: 'ALL-ROUNDER. GOOD AT EVERYTHING.' },
    { id: 'hornet', name: 'GOLD HORNET', pilot: 'BUZZ BIXBY', shape: 'hornet', body: '#f8c818', trim: '#202028', acc: '#f8f8f8', stats: [2, 5, 4, 1], vmax: 338, accel: 185, grip: 6.5, turn: 2.95, wt: 0.75, blurb: 'ZIPPY AND LIGHT. GETS BUMPED.' },
    { id: 'gecko', name: 'LIME GECKO', pilot: 'LIZ LIME', shape: 'gecko', body: '#38c040', trim: '#f0f0c8', acc: '#e83878', stats: [3, 3, 5, 2], vmax: 344, accel: 155, grip: 8.0, turn: 2.98, wt: 0.85, blurb: 'STICKS TO CORNERS LIKE GLUE.' },
    { id: 'rhino', name: 'RED RHINO', pilot: 'MAJOR TANK', shape: 'rhino', body: '#e02828', trim: '#b0b0c0', acc: '#202028', stats: [5, 2, 2, 5], vmax: 390, accel: 138, grip: 5.0, turn: 2.98, wt: 1.5, blurb: 'FLAT OUT FAST. TURNS LIKE A BUS.' },
  ];
  // the rest of the field (made-up pilots, plus Dave, who is always somewhere near the back)
  const PACK = [
    { id: 'viper', name: 'VIPER', shape: 'gecko', body: '#9038d8', trim: '#f878c8', acc: '#f8f8f8', vmax: 340, wt: 0.9 },
    { id: 'toffee', name: 'TOFFEE', shape: 'hornet', body: '#f08820', trim: '#6a3818', acc: '#f8e8c8', vmax: 335, wt: 0.8 },
    { id: 'sharky', name: 'SHARKY', shape: 'comet', body: '#28b0b8', trim: '#5a6878', acc: '#f8f8f8', vmax: 338, wt: 1.0 },
    { id: 'dave', name: 'DAVE', shape: 'rhino', body: '#8a6a48', trim: '#e0d0a0', acc: '#58a838', vmax: 328, wt: 1.3 },
  ];
  function buildModel(shape) {
    const F = [];
    const sup = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
    // a rounded cross-section (8 points) at x
    const NS = 12, sec = (x, hw, top, bot, e, yc) => { const pts = [], mid = (top + bot) / 2, hh = (top - bot) / 2; for (let k = 0; k < NS; k++) { const a = (k + 0.5) / NS * TAU; pts.push([x, (yc || 0) + sup(Math.cos(a), e || 0.7) * hw, mid + sup(Math.sin(a), e || 0.7) * hh]); } return pts; };
    const face = (p, c) => F.push({ p, c });
    // join sections: cols(i, k) picks a colour for band i, facet k
    function loft(S, cols, capF, capB) {
      const n = S[0].length, part = [];
      for (let i = 0; i < S.length - 1; i++) for (let k = 0; k < n; k++) { const k2 = (k + 1) % n; part.push({ p: [S[i][k], S[i][k2], S[i + 1][k2], S[i + 1][k]], c: typeof cols === 'function' ? cols(i, k) : cols }); }
      if (capF) part.push({ p: S[0].slice(), c: capF });
      if (capB) part.push({ p: S[S.length - 1].slice(), c: capB });
      let cx = 0, cy = 0, cz = 0, m = 0; for (const s of S) for (const q of s) { cx += q[0]; cy += q[1]; cz += q[2]; m++; }
      for (const f of part) { f.o = [cx / m, cy / m, cz / m]; F.push(f); }
    }
    const tube = (x0, x1, y, z, r, cBody, cBack, cFront) => loft([sec(x0, r * 0.6, z + r * 0.6, z - r * 0.6, 0.9, y), sec(x0 - (x0 - x1) * 0.25, r, z + r, z - r, 0.9, y), sec(x1, r * 0.9, z + r * 0.9, z - r * 0.9, 0.9, y)], cBody, cFront || cBody, cBack);
    const plate = (pts, c, th) => { const top = pts.map(q => [q[0], q[1], q[2] + th]); const S = [pts, top]; loft([pts, top], c, c, c); };
    // top facets (k = 1, 2 are the upper middle ones) get the stripe
    const stripe = (bodyC, trimC) => (i, k) => k === 2 ? trimC : (k >= 6 && k <= 10 ? 'under' : bodyC);
    if (shape === 'comet') {
      loft([sec(15, 0.6, 2.2, 1.4), sec(9, 3.2, 3.2, 0.9), sec(1, 5, 4.4, 0.8), sec(-7, 5.6, 4.6, 0.9), sec(-13, 5, 4.0, 1.3)], stripe('body', 'trim'), null, 'dark');
      loft([sec(4, 1.2, 5.0, 3.6, 0.7), sec(0, 2.4, 6.4, 3.8, 0.7), sec(-5, 2.2, 6.0, 3.8, 0.7), sec(-8, 1.4, 4.9, 3.8, 0.7)], 'glass', 'glass', 'dark');
      for (const sd of [-1, 1]) {
        tube(-1, -14, sd * 6.6, 2.6, 2.0, (i, k) => k === 2 ? 'acc' : 'pod', 'glow', 'dark');
        plate([[-3, sd * 4.5, 2.2], [-11, sd * 4.5, 2.2], [-12, sd * 9.2, 1.8], [-8, sd * 9.2, 1.8]], 'trim', 0.6);
        plate([[-10, sd * 6.6, 4.4], [-14, sd * 6.6, 4.4], [-14.5, sd * 6.6, 7.2], [-12.5, sd * 6.6, 7.2]].map(q => q), 'body', 0.01);
      }
    } else if (shape === 'hornet') {
      loft([sec(13, 0.5, 2.4, 1.8), sec(8, 3.0, 3.8, 1.0), sec(2, 4.6, 5.0, 0.9), sec(-4, 4.8, 5.0, 0.9), sec(-10, 4.2, 4.4, 1.3)], (i, k) => (k >= 6 && k <= 10) ? 'under' : (i === 1 || i === 3) ? 'trim' : 'body', null, 'dark');
      loft([sec(5, 1.2, 5.6, 4.2, 0.6), sec(1, 2.6, 7.2, 4.4, 0.6), sec(-3, 2.2, 6.8, 4.4, 0.6)], 'glass', 'glass', 'dark');
      for (const sd of [-1, 1]) {
        tube(2, -12, sd * 6.4, 2.8, 2.7, (i, k) => (i === 1 && k >= 1 && k <= 3) ? 'trim' : 'body', 'glow', 'dark');
        plate([[-2, sd * 4, 4.6], [-7, sd * 4, 4.6], [-9, sd * 10, 6.2], [-6, sd * 10.5, 6.6]], 'acc', 0.4);
      }
      loft([sec(-10, 1.2, 3.4, 2.0), sec(-15, 0.3, 2.9, 2.5)], 'trim', null, 'trim'); // the sting
    } else if (shape === 'gecko') {
      loft([sec(17, 0.6, 1.8, 1.2), sec(10, 3.0, 2.6, 0.8), sec(1, 4.6, 3.4, 0.7), sec(-8, 5.0, 3.4, 0.8), sec(-14, 4.4, 3.0, 1.2)], stripe('body', 'trim'), null, 'dark');
      loft([sec(3, 1.0, 3.9, 3.0, 0.7), sec(-1, 2.0, 5.0, 3.1, 0.7), sec(-6, 1.6, 4.6, 3.1, 0.7)], 'glass', 'glass', 'dark');
      for (const sd of [-1, 1]) {
        plate([[6, sd * 3, 1.6], [-10, sd * 4, 1.6], [-13, sd * 11, 1.4], [-4, sd * 11, 1.4]], 'body', 0.7);
        plate([[-4, sd * 10.4, 2.1], [-13, sd * 10.4, 2.1], [-13, sd * 11, 2.1], [-4, sd * 11, 2.1]], 'acc', 0.3);
        tube(-6, -15, sd * 5.0, 2.2, 1.7, 'pod', 'glow', 'dark');
      }
    } else { // rhino
      loft([sec(14, 1.6, 2.8, 1.4), sec(9, 4.6, 4.2, 0.8), sec(1, 6.4, 5.4, 0.7), sec(-7, 6.6, 5.4, 0.8), sec(-13, 6.0, 4.8, 1.2)], stripe('body', 'trim'), null, 'dark');
      loft([sec(3, 1.4, 6.0, 4.6, 0.7), sec(-1, 2.8, 7.4, 4.8, 0.7), sec(-6, 2.6, 7.0, 4.8, 0.7)], 'glass', 'glass', 'dark');
      loft([sec(13, 1.0, 3.2, 2.2), sec(17, 0.2, 5.0, 4.6)], 'trim', null, 'trim'); // the horn
      for (const sd of [-1, 1]) tube(0, -15, sd * 7.6, 3.0, 2.9, (i, k) => k === 2 ? 'acc' : 'pod', 'glow', 'dark');
      for (const sd of [-1, 1]) plate([[-9, sd * 2, 5.4], [-13, sd * 2, 5.2], [-14, sd * 3.6, 8.2], [-11.5, sd * 3.6, 8.2]], 'trim', 0.01);
    }
    // normals (pointing out from the part's middle)
    for (const f of F) {
      const p = f.p, a = p[0], b = p[1], c = p[2];
      let nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (Math.hypot(nx, ny, nz) < 1e-6 && p[3]) { const d = p[3]; nx = (c[1] - a[1]) * (d[2] - a[2]) - (c[2] - a[2]) * (d[1] - a[1]); ny = (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]); nz = (c[0] - a[0]) * (d[1] - a[1]) - (c[1] - a[1]) * (d[0] - a[0]); }
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const m = [0, 0, 0]; for (const q of p) { m[0] += q[0] / p.length; m[1] += q[1] / p.length; m[2] += q[2] / p.length; }
      const o = f.o || [0, 0, 2];
      if ((m[0] - o[0]) * nx + (m[1] - o[1]) * ny + (m[2] - o[2]) * nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      f.n = [nx, ny, nz]; f.m = m;
    }
    return F;
  }
  const MODELS = {};
  const LIGHT = (() => { const v = [-0.45, -0.55, 0.75], l = Math.hypot(...v); return v.map(x => x / l); })();
  // draw a model into a canvas: yaw (0 = we see its back), pitch (camera looking down), roll (+ = right side up)
  function renderCar(car, yaw, pitch, roll, scale, cw, ch, cx, cy, outline) {
    const F = MODELS[car.shape] || (MODELS[car.shape] = buildModel(car.shape));
    const cv = canvas(cw, ch), g = cv.getContext('2d');
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    const xf = q => { const y1 = q[1] * cr - q[2] * sr, z1 = q[1] * sr + q[2] * cr; const x2 = q[0] * cyw - y1 * syw, y2 = q[0] * syw + y1 * cyw; return [x2, y2, z1]; };
    const cols = { body: car.body, trim: car.trim, acc: car.acc, pod: shade(car.body, 0.8), under: shade(car.body, 0.45), dark: '#1a1a26', glass: '#3a5ab8', glow: '#f8f8b0' };
    const list = [];
    for (const f of F) {
      const n = xf(f.n), vd = [cp, 0, -sp]; // view direction (into the screen)
      if (n[0] * vd[0] + n[2] * vd[2] > 0.02) continue; // facing away
      const pts = f.p.map(xf), depth = pts.reduce((a, q) => a + (q[0] * cp - q[2] * sp), 0) / pts.length;
      let col = cols[f.c] || '#ff00ff';
      if (f.c !== 'glow') {
        const lam = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        let k = 0.38 + 0.72 * lam; k = Math.round(k * 6) / 6; // a stepped shading ramp
        col = shade(col, k);
        // a hot spot of sun on the shiny bits
        const rz = 2 * lam * n[2] - LIGHT[2]; if ((f.c === 'glass' || f.c === 'body' || f.c === 'trim') && lam > 0.86) col = mix(col, '#ffffff', f.c === 'glass' ? 0.55 : 0.3);
      }
      list.push({ pts, depth, col });
    }
    list.sort((a, b) => b.depth - a.depth);
    for (const f of list) {
      g.fillStyle = f.col; g.strokeStyle = f.col; g.lineWidth = 0.6; g.beginPath();
      f.pts.forEach((q, i) => { const sx = cx + q[1] * scale, sy = cy - (q[0] * sp + q[2] * cp) * scale; if (i) g.lineTo(sx, sy); else g.moveTo(sx, sy); });
      g.closePath(); g.fill(); g.stroke();
    }
    crisp(cv, outline || '#0a0a14');
    return cv;
  }
  // tidy a canvas into pixel art: hard alpha, 15-bit colour, a dark outline
  function crisp(cv, outline) {
    const w = cv.width, h = cv.height, g = cv.getContext('2d'), im = g.getImageData(0, 0, w, h), d = im.data, a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { const o = i * 4; if (d[o + 3] > 120) { a[i] = 1; d[o] = q5(d[o]); d[o + 1] = q5(d[o + 1]); d[o + 2] = q5(d[o + 2]); d[o + 3] = 255; } else d[o + 3] = 0; }
    if (outline) { const [r, gg, b] = hex(outline); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (a[i]) continue; if ((x > 0 && a[i - 1]) || (x < w - 1 && a[i + 1]) || (y > 0 && a[i - w]) || (y < h - 1 && a[i + w])) { const o = i * 4; d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; } } }
    g.putImageData(im, 0, 0);
  }
  // sprite sets: 16 angles near (big) and far (small)
  const SPR = {};
  const SB = { w: 132, h: 104, cx: 66, cy: 62, sc: 4.2 }, SN = { w: 80, h: 64, cx: 40, cy: 38, sc: 2.5 }, SF = { w: 40, h: 30, cx: 20, cy: 18, sc: 1.15 };
  function spriteSet(car) {
    if (SPR[car.id]) return SPR[car.id];
    const near = [], far = [];
    for (let k = 0; k < 16; k++) { const yw = k / 16 * TAU; near.push(renderCar(car, yw, 0.5, 0, SN.sc, SN.w, SN.h, SN.cx, SN.cy)); far.push(renderCar(car, yw, 0.24, 0, SF.sc, SF.w, SF.h, SF.cx, SF.cy)); }
    return SPR[car.id] = { near, far };
  }
  // the player's own car: 9 lean frames (turned and banked) seen from the chase camera
  function playerFrames(car) {
    const out = []; for (let i = 0; i < 9; i++) { const t = (i - 4) / 4; out.push(renderCar(car, t * 0.36, 0.48, -t * 0.42, SN.sc, SN.w, SN.h, SN.cx, SN.cy)); } return out;
  }

  // ================================================================ text art: chrome-gradient lettering with an outline (cached)
  const TXT = {};
  function textArt(F, s, k, cols, outline, slant, depth, dcol) {
    depth = depth || 0;
    const key = [s, k, cols.join(), outline, slant, depth].join('|'); if (TXT[key]) return TXT[key];
    const h = 8 * k + 4, w = F.width(s, k) + 4 + (slant ? Math.ceil(h * slant) + 2 : 0);
    const base = canvas(w, h), b = base.getContext('2d'); b.imageSmoothingEnabled = false;
    if (slant) b.setTransform(1, 0, -slant, 1, slant * h, 0);
    F.draw(b, s, 2, 2, '#ffffff', k);
    b.setTransform(1, 0, 0, 1, 0, 0);
    const gr = canvas(w, h), gg = gr.getContext('2d');
    for (let y = 0; y < h; y++) { const t = (y - 2) / (8 * k - 1) * (cols.length - 1), i = clamp(Math.floor(t), 0, cols.length - 2); gg.fillStyle = mix(cols[i], cols[i + 1], clamp(t - i, 0, 1)); gg.fillRect(0, y, w, 1); }
    b.globalCompositeOperation = 'source-in'; b.drawImage(gr, 0, 0);
    const out = canvas(w + 2 + depth, h + 2 + depth), o = out.getContext('2d');
    if (depth) { const ex = canvas(w, h), eg = ex.getContext('2d'); eg.drawImage(base, 0, 0); eg.globalCompositeOperation = 'source-in'; eg.fillStyle = dcol || '#301010'; eg.fillRect(0, 0, w, h); for (let i = depth; i >= 1; i--) o.drawImage(ex, 1 + i, 1 + i); }
    if (outline) {
      const sil = canvas(w, h), sg = sil.getContext('2d'); sg.drawImage(base, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = outline; sg.fillRect(0, 0, w, h);
      for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2], [2, 2], [0, 0], [2, 0], [0, 2], [2, 3], [1, 3]]) o.drawImage(sil, dx, dy);
    }
    o.drawImage(base, 1, 1);
    crisp(out, null);
    return TXT[key] = out;
  }
  // a shaded trophy (gold, silver or bronze), lit from the top-left
  const TROPHY = {};
  function trophy(kind) {
    if (TROPHY[kind]) return TROPHY[kind];
    const P = { gold: ['#fff8d0', '#f8e070', '#e0b030', '#a87010', '#603808'], silver: ['#ffffff', '#e0e8f0', '#a8b4c8', '#6a7890', '#384058'], bronze: ['#ffe0c0', '#e8a868', '#c07838', '#884818', '#4a2408'] }[kind];
    const c = canvas(64, 72), g = c.getContext('2d');
    const band = (x0, x1, y0, y1, path) => { // fill a shape with vertical light bands
      g.save(); path(); g.clip(); const w = x1 - x0; const st = [[0, P[3]], [0.12, P[2]], [0.24, P[1]], [0.32, P[0]], [0.4, P[1]], [0.62, P[2]], [0.84, P[3]], [0.95, P[4]]];
      for (let i = 0; i < st.length; i++) { g.fillStyle = st[i][1]; const a = x0 + w * st[i][0], b = x0 + w * (i + 1 < st.length ? st[i + 1][0] : 1); g.fillRect(a, y0, b - a + 0.5, y1 - y0); } g.restore(); };
    // handles
    g.lineWidth = 3.2; g.strokeStyle = P[3]; g.beginPath(); g.ellipse(13, 16, 8, 9, 0, Math.PI * 0.5, Math.PI * 1.5); g.stroke(); g.beginPath(); g.ellipse(51, 16, 8, 9, 0, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
    g.lineWidth = 1.2; g.strokeStyle = P[1]; g.beginPath(); g.ellipse(13, 15, 7, 8, 0, Math.PI * 0.6, Math.PI * 1.4); g.stroke();
    // the bowl
    band(10, 54, 4, 40, () => { g.beginPath(); g.moveTo(10, 5); g.lineTo(54, 5); g.bezierCurveTo(54, 26, 44, 38, 32, 39); g.bezierCurveTo(20, 38, 10, 26, 10, 5); g.closePath(); });
    g.fillStyle = P[4]; g.beginPath(); g.ellipse(32, 6, 22, 3.5, 0, 0, TAU); g.fill(); g.fillStyle = P[3]; g.beginPath(); g.ellipse(32, 6.5, 20, 2.5, 0, 0, TAU); g.fill();
    g.fillStyle = P[0]; g.fillRect(16, 10, 2, 12); g.fillRect(18, 22, 1, 4);
    // a star on the front
    g.fillStyle = P[4]; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3 : 7; g.lineTo(32 + Math.cos(a) * r, 21 + Math.sin(a) * r); } g.fill();
    g.fillStyle = P[0]; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.2 : 5.5; g.lineTo(32 + Math.cos(a) * r, 20.5 + Math.sin(a) * r); } g.fill();
    // stem and base
    band(27, 37, 38, 52, () => { g.beginPath(); g.moveTo(29, 38); g.lineTo(35, 38); g.lineTo(34, 46); g.lineTo(38, 52); g.lineTo(26, 52); g.lineTo(30, 46); g.closePath(); });
    band(18, 46, 52, 57, () => { g.beginPath(); g.rect(20, 52, 24, 5); });
    g.fillStyle = '#3a2418'; g.fillRect(16, 57, 32, 12); g.fillStyle = '#5a3a28'; g.fillRect(16, 57, 32, 2); g.fillStyle = '#24140c'; g.fillRect(16, 67, 32, 2);
    g.fillStyle = P[2]; g.fillRect(22, 60, 20, 5); g.fillStyle = P[0]; g.fillRect(22, 60, 20, 1); g.fillStyle = P[4]; for (let i = 0; i < 4; i++) g.fillRect(25 + i * 4, 62, 2, 1);
    crisp(c, '#08081a');
    return TROPHY[kind] = c;
  }
  const CHROME = ['#ffffff', '#c8d8f8', '#6888d0', '#283878', '#a8c0f0', '#ffffff'];
  const FIRE = ['#fff8c0', '#f8d040', '#f88020', '#d02810', '#f8a030'];
  const GOLD = ['#fffbe0', '#f8d848', '#c88818', '#f8e070'];
  const MINT = ['#e8fff0', '#78f0a8', '#20a868', '#a8f8c8'];
  const PINK = ['#fff0f8', '#f890d0', '#c03890', '#f8b0e0'];

  const LIB = { TRACKS, geom, featS, MAT, TS, HW, RW, DS, buildWorld, THEMES, MACHINES, PACK, buildModel, renderCar, spriteSet, playerFrames, textArt };

  // ================================================================ music (all made up): 16th-note steps, '-' holds, '.' rests
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function N(str) { const out = []; for (const t of str.trim().split(/\s+/)) { if (t === '|') continue; if (t === '.') out.push(0); else if (t === '-') out.push(-1); else { const m = /^([a-g])([#b]?)(\d)$/.exec(t); out.push(12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)); } } return out; }
  const SONGS = {
    title: { bpm: 128, wave: 'square', vol: 0.045, bassWave: 'triangle', drums: 'o...x...o...x.x.',
      lead: N('e5 - - - b4 - e5 - f#5 - g5 - f#5 - e5 - | d5 - - - a4 - d5 - e5 - f#5 - e5 - d5 - | c5 - - - g4 - c5 - d5 - e5 - g5 - - - | f#5 - - - - - - - d#5 - - - b4 - - -'),
      bass: N('e2 . e3 . e2 . e3 . e2 . e3 . e2 . e3 . | d2 . d3 . d2 . d3 . d2 . d3 . d2 . d3 . | c2 . c3 . c2 . c3 . c2 . c3 . c2 . c3 . | b1 . b2 . b1 . b2 . b1 . b2 . d#2 . f#2 .') },
    menu: { bpm: 116, wave: 'square', vol: 0.035, bassWave: 'triangle', drums: 'o.x.x.x.o.x.x.x.',
      lead: N('g4 - c5 - e5 - g5 - f5 - e5 - d5 - - - | e4 - a4 - c5 - e5 - d5 - c5 - b4 - - - | f4 - a4 - c5 - f5 - e5 - d5 - c5 - a4 - | g4 - - - b4 - - - d5 - - - g5 - - -'),
      bass: N('c3 . g2 . c3 . g2 . c3 . g2 . c3 . g2 . | a2 . e2 . a2 . e2 . a2 . e2 . a2 . e2 . | f2 . c3 . f2 . c3 . f2 . c3 . f2 . c3 . | g2 . d3 . g2 . d3 . g2 . b2 . d3 . b2 .') },
    city: { bpm: 150, wave: 'square', vol: 0.04, bassWave: 'triangle', drums: 'o.x.o.x.o.xoo.x.',
      lead: N('e5 . e5 . g5 . e5 . a5 - g5 - e5 . d5 . | e5 . e5 . g5 . e5 . b5 - a5 - g5 - - - | c6 . b5 . a5 . g5 . a5 - g5 - e5 . g5 . | f#5 - - - d5 - - - b4 - d5 - f#5 - - -'),
      bass: N('e2 e2 e3 e2 . e2 e3 e2 e2 e2 e3 e2 . e2 d3 e3 | e2 e2 e3 e2 . e2 e3 e2 e2 e2 e3 e2 . e2 d3 e3 | c2 c2 c3 c2 . c2 c3 c2 a1 a1 a2 a1 . a1 a2 c3 | b1 b1 b2 b1 . b1 b2 b1 b1 b1 b2 b1 d#2 f#2 b2 d#3') },
    port: { bpm: 140, wave: 'square', vol: 0.04, bassWave: 'triangle', drums: 'o...x.o.o...x...',
      lead: N('d5 - f#5 - a5 - - - b5 - a5 - f#5 - - - | g5 - - - e5 - - - f#5 - d5 - e5 - - - | d5 - f#5 - a5 - - - d6 - c#6 - b5 - a5 - | g5 - b5 - a5 - g5 - f#5 - e5 - d5 - - -'),
      bass: N('d2 . a2 . d3 . a2 . d2 . a2 . d3 . a2 . | g2 . d3 . g2 . d3 . a2 . e3 . a2 . e3 . | d2 . a2 . d3 . a2 . b2 . f#2 . b2 . f#2 . | g2 . d3 . a2 . e3 . d2 . a2 . d3 . . .') },
    canyon: { bpm: 124, wave: 'triangle', vol: 0.07, bassWave: 'square', drums: 'o.....x.o.....x.',
      lead: N('a4 - . a4 c5 - . c5 e5 - - - d5 - c5 - | b4 - . b4 d5 - . d5 f#5 - - - e5 - d5 - | c5 - . c5 e5 - . e5 g5 - - - f#5 - e5 - | d5 - - - b4 - - - a4 - - - - - - -'),
      bass: N('a2 . . a2 . . a2 . g2 . . g2 . . g2 . | g2 . . g2 . . g2 . f#2 . . f#2 . . f#2 . | f2 . . f2 . . f2 . e2 . . e2 . . e2 . | d2 . . d2 . . d2 . e2 . . e2 . e2 . e2 .') },
    biscuit: { bpm: 160, wave: 'square', vol: 0.04, bassWave: 'triangle', drums: 'o.x.o.x.o.x.oox.',
      lead: N('f5 . a5 . c6 . a5 . f5 . a5 . c6 - - . | bb5 . g5 . e5 . g5 . c6 - - - . . . . | a5 . f5 . d5 . f5 . bb5 . a5 . g5 . f5 . | e5 . g5 . c6 . e6 . f6 - - - . . . .'),
      bass: N('f2 . c3 . f2 . c3 . f2 . c3 . f2 . c3 . | c2 . g2 . c2 . g2 . c2 . g2 . c3 . c2 . | d2 . a2 . d2 . a2 . bb1 . f2 . c2 . g2 . | c2 . g2 . c3 . g2 . f2 . c3 . f2 . . .') },
    results: { bpm: 104, wave: 'square', vol: 0.04, bassWave: 'triangle',
      lead: N('c5 - e5 - g5 - c6 - b5 - g5 - e5 - g5 - | a5 - f5 - d5 - f5 - g5 - - - - - - - | e5 - g5 - c6 - e6 - d6 - b5 - g5 - b5 - | c6 - - - g5 - - - c5 - - - - - - -'),
      bass: N('c3 . . . g2 . . . c3 . . . g2 . . . | f2 . . . a2 . . . g2 . . . b2 . . . | c3 . . . g2 . . . g2 . . . b2 . . . | c3 . . . g2 . . . c2 . . . . . . .') },
  };
  // the cup: classes, points, scores
  const CLASSES = [
    { id: 'rookie', name: 'ROOKIE', ai: 0.84, corner: 0.82, safe: [8, 7, 6], spares: 4, mul: 0.8, dmg: 0.6, desc: 'GENTLE RIVALS', desc2: 'FINISH IN THE TOP 6', col: MINT },
    { id: 'pro', name: 'PRO', ai: 0.9, corner: 0.9, safe: [7, 6, 5], spares: 3, mul: 1, desc: 'PROPER RACING', desc2: 'FINISH IN THE TOP 5', col: CHROME },
    { id: 'master', name: 'MASTER', ai: 0.96, corner: 0.97, safe: [6, 5, 4], spares: 3, mul: 1.2, dmg: 1.2, desc: 'NO MERCY. NONE.', desc2: 'FINISH IN THE TOP 4', col: FIRE },
  ];
  const CUP_PTS = [10, 8, 6, 5, 4, 3, 2, 1];
  const PLACE_BONUS = [5000, 3800, 3000, 2400, 1900, 1500, 1200, 1000];
  // Jack's mates got here first (the best-lap tables start with their times; the top one is hard)
  const MATES = [['LUKE', 0.965], ['JACK', 0.995], ['DAVE', 1.04], ['CAL', 1.085], ['JK', 1.14]];
  const CUP_TABLE = [[38200, 'LUKE'], [30150, 'DAVE'], [26400, 'JACK'], [15500, 'CAL'], [9900, 'JK']];

  // ================================================================ the game
  TV.game('sn.zero', {
    buttons: ['y', 'b', 'a', 'l', 'r'],
    help: 'Steer: arrows. Go: Z. Brake: X. Boost: V. Lean: Q / E. Pause: Enter.',
    _lib: LIB,
    make(K) {
      const g = K.g, F = K.font, SFX = K.sfx;
      g.imageSmoothingEnabled = false;
      try { K.hud.clearRect(0, 0, K.hud.canvas.width, K.hud.canvas.height); } catch (e) {}
      const btn = b => '(' + K.label(b) + ')';
      const rnd = Math.random;

      // ------------------------------------------------------------ the save: records, the cup in progress, trophies
      const SV = (() => { const s = K.load(); return (s && typeof s === 'object') ? s : {}; })();
      if (!SV.recs || typeof SV.recs !== 'object') SV.recs = {};
      if (!Array.isArray(SV.cups)) SV.cups = CUP_TABLE.map(x => x.slice());
      if (!SV.gold || typeof SV.gold !== 'object') SV.gold = {};
      if (typeof SV.ini !== 'string' || SV.ini.length !== 3) SV.ini = 'JAK';
      if (SV.cup && !(SV.cup.race >= 0 && SV.cup.race < TRACKS.length && SV.cup.pts && typeof SV.cup.pts === 'object' && SV.cup.spares >= 0 && CLASSES[SV.cup.cls] && MACHINES[SV.cup.car])) SV.cup = null;
      const recs = i => { const id = TRACKS[i].id; if (!Array.isArray(SV.recs[id]) || !SV.recs[id].length) SV.recs[id] = MATES.map(([n, k]) => [Math.round(TRACKS[i].par * k * 100) / 100, n]); return SV.recs[id]; };
      const save = () => { try { K.save(SV); } catch (e) {} };

      // ------------------------------------------------------------ sound
      const snd = {
        move() { SFX.tone(880, 0.04, 'square', 0.05); },
        ok() { SFX.tone(660, 0.05, 'square', 0.06); SFX.tone(990, 0.08, 'square', 0.06, 0.05); },
        back() { SFX.tone(500, 0.08, 'square', 0.05, 0, 300); },
        beep(hi) { SFX.tone(hi ? 1320 : 660, hi ? 0.55 : 0.2, 'square', 0.08); },
        wall(k) { SFX.noise(0.2, 0.06 + 0.08 * k, 1500, 0, 'bandpass', 300); SFX.tone(110, 0.16, 'square', 0.03 + 0.05 * k, 0, 45); },
        scrape() { SFX.noise(0.08, 0.05, 4000, 0, 'highpass'); },
        bump() { SFX.tone(180, 0.1, 'square', 0.07, 0, 70); SFX.noise(0.08, 0.06, 900); },
        dash() { SFX.tone(330, 0.3, 'sawtooth', 0.05, 0, 1500); SFX.noise(0.3, 0.05, 1000, 0, 'bandpass', 4000); },
        boost() { SFX.noise(1.0, 0.1, 500, 0, 'bandpass', 3500); SFX.tone(160, 0.7, 'sawtooth', 0.05, 0, 900); },
        jump() { SFX.tone(260, 0.45, 'square', 0.05, 0, 1100); },
        land() { SFX.noise(0.16, 0.1, 500); SFX.tone(80, 0.14, 'sine', 0.14, 0, 40); },
        pit() { SFX.tone(1300 + rnd() * 300, 0.04, 'triangle', 0.04); },
        lap() { SFX.seq([[76, 0.5], [81, 0.5], [88, 1.5]], { bpm: 300, vol: 0.07 }); },
        final() { SFX.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 0.5], [79, 0.5], [84, 2]], { bpm: 280, vol: 0.08 }); },
        win() { SFX.seq([[72, 1], [76, 1], [79, 1], [84, 1], [0, 0.5], [79, 0.5], [84, 3]], { bpm: 260, vol: 0.09 }); SFX.seq([[60, 4], [64, 4], [67, 4]], { bpm: 260, vol: 0.05, wave: 'triangle' }); },
        fin() { SFX.seq([[67, 1], [72, 1], [76, 2]], { bpm: 220, vol: 0.08 }); },
        warn() { SFX.tone(1760, 0.07, 'square', 0.05); SFX.tone(1760, 0.07, 'square', 0.05, 0.12); },
        out() { SFX.seq([[67, 1], [63, 1], [60, 1], [55, 3]], { bpm: 170, vol: 0.08, wave: 'triangle' }); SFX.tone(300, 1.3, 'sawtooth', 0.04, 0, 40); },
        splash() { SFX.noise(0.7, 0.14, 1400, 0, 'lowpass', 200); },
        cheer() { SFX.noise(1.6, 0.05, 2500, 0, 'bandpass', 1200); },
        tick() { SFX.tone(1500, 0.03, 'square', 0.04); },
      };
      let song = null, songFast = false;
      function music(name, fast) { if (song === name && songFast === !!fast) return; song = name; songFast = !!fast; if (!name) return K.music(null); const S0 = SONGS[name]; K.music(fast ? Object.assign({}, S0, { bpm: Math.round(S0.bpm * 1.1) }) : S0); }

      // ------------------------------------------------------------ the track in use
      let T = null;
      const A_LAT = 560, DEC = 320, LW = 1005;
      const oo = [0, 0, 0, 0, 0];
      function useTrack(i) {
        if (T && T.idx === i) return T;
        T = null;
        const def = TRACKS[i], G = geom(def), Wd = buildWorld(G), TH = Wd.TH;
        const sky = canvas(W, HZ); TH.sky(sky.getContext('2d'), W, HZ);
        const far = canvas(LW, 60), near = canvas(LW, 36);
        TH.far(far.getContext('2d'), LW, 60); crisp(far, null);
        TH.near(near.getContext('2d'), LW, 36); crisp(near, null);
        const haze = canvas(W, 48), hg = haze.getContext('2d');
        for (let y = 0; y < 48; y += 2) { hg.globalAlpha = TH.hazeA * Math.pow(1 - y / 48, 1.8); hg.fillStyle = TH.haze; hg.fillRect(0, y, W, 2); }
        const N = G.N, line = new Float32Array(N), vc = new Float32Array(N);
        for (let k = 0; k < N; k++) { let a = 0, n = 0; for (let j = -30; j <= 30; j += 2) { a += G.CS[(k + j + N) % N]; n++; } line[k] = clamp(a / n * 9000, -1, 1) * (HW - 18); }
        for (let k = 0; k < N; k++) vc[k] = Math.min(999, Math.sqrt(A_LAT / Math.max(1e-5, Math.abs(G.CS[k]))));
        for (let rep = 0; rep < 3; rep++) for (let k = N - 1; k >= 0; k--) { const j = (k + 1) % N; vc[k] = Math.min(vc[k], Math.sqrt(vc[j] * vc[j] + 2 * DEC * G.step)); }
        // the mini map
        const mini = canvas(60, 60), mg = mini.getContext('2d'), [bx0, by0, bx1, by1] = G.bbox, ms = 52 / Math.max(bx1 - bx0, by1 - by0), mox = 30 - (bx0 + bx1) / 2 * ms, moy = 30 - (by0 + by1) / 2 * ms;
        const path = (w, c) => { mg.strokeStyle = c; mg.lineWidth = w; mg.lineJoin = 'round'; mg.beginPath(); for (let k = 0; k <= N; k += 3) { const q = k % N, x = G.X[q] * ms + mox, y = G.Y[q] * ms + moy; if (k) mg.lineTo(x, y); else mg.moveTo(x, y); } mg.closePath(); mg.stroke(); };
        path(6, '#000018'); path(4, '#6878b0'); path(2, '#e8f0ff');
        crisp(mini, null);
        const mg2 = mini.getContext('2d'); mg2.fillStyle = '#f8f8f8'; mg2.fillRect(G.X[0] * ms + mox - 2, G.Y[0] * ms + moy - 2, 4, 4); mg2.fillStyle = '#202020'; mg2.fillRect(G.X[0] * ms + mox - 1, G.Y[0] * ms + moy - 2, 1, 1); mg2.fillRect(G.X[0] * ms + mox + 1, G.Y[0] * ms + moy, 1, 1);
        T = { idx: i, def, G, tex: Wd.tex, tile: Wd.tile, pal: Wd.pal, cyc: Wd.cyc, feats: Wd.feats, TH, sky, far, near, haze, line, vc, mini, ms, mox, moy, ramps: Wd.feats.filter(f => f.kind === 'ramp') };
        return T;
      }
      const idxOf = s => { const G = T.G, d = ((s % G.L) + G.L) % G.L; return Math.min(G.N - 1, d / G.step | 0); };
      const matAt = (x, y) => { const ui = x | 0, vi = y | 0; if ((ui | vi) & ~TM) return M_OFF; return MAT[T.tex[(vi << TSH) | ui]]; };

      // ------------------------------------------------------------ cars
      function mkCar(def, o) {
        return Object.assign({ def, id: def.id, name: def.name, spr: spriteSet(def), x: 0, y: 0, a: 0, vx: 0, vy: 0, v: 0, alt: 0, vz: 0, air: false, s: 0, i: 0, lat: 0, latV: 0,
          energy: 100, boostT: 0, dashT: 0, boosts: 0, lapMax: 0, lapT0: 0, laps: [], best: 0, fin: 0, hits: 0, bigAir: 0, scrape: 0, rescue: 0, safeS: 0, wob: rnd() * TAU,
          vtop: def.vmax, ck: 1, off: 0, offT: 0, lift: 0, ghost: false, player: false, lean: 0, flash: 0, bumpT: 0, place: 1, takeoffS: 0, roughT: 0, main: false, smoke: 0 }, o || {});
      }
      function put(c, s, lat) {
        const G = T.G; G.at(s, oo); const nx = -Math.sin(oo[2]), ny = Math.cos(oo[2]);
        c.s = s; c.lat = lat; c.x = oo[0] + nx * lat; c.y = oo[1] + ny * lat; c.a = oo[2]; c.i = idxOf(s); c.safeS = s;
      }
      // where a free-driving car is along the track (window search, or all of it after a jump)
      function locate(c, global) {
        const G = T.G, N = G.N, X = G.X, Y = G.Y; let bi = c.i, bd = 1e18;
        if (global) { for (let k = 0; k < N; k++) { const dx = c.x - X[k], dy = c.y - Y[k], d = dx * dx + dy * dy; if (d < bd) { bd = d; bi = k; } } }
        else for (let j = -14; j <= 14; j++) { const k = (c.i + j + N) % N, dx = c.x - X[k], dy = c.y - Y[k], d = dx * dx + dy * dy; if (d < bd) { bd = d; bi = k; } }
        c.i = bi; const ca = Math.cos(G.A[bi]), sa = Math.sin(G.A[bi]), dx = c.x - X[bi], dy = c.y - Y[bi];
        c.lat = -dx * sa + dy * ca;
        const sw = bi * G.step + dx * ca + dy * sa, cur = ((c.s % G.L) + G.L) % G.L;
        let d = sw - cur; if (d > G.L / 2) d -= G.L; if (d < -G.L / 2) d += G.L;
        c.s += d; return d;
      }

      // ------------------------------------------------------------ the race
      let R = null;
      const inp = { steer: 0, thr: false, brk: false, boost: false, lean: 0 };
      let cup = SV.cup || null; // { cls, car, race, pts[8 ids], spares, score, wins, res: [] }
      function newRace(ti, kind, o) {
        o = o || {};
        useTrack(ti);
        const cls = CLASSES[kind === 'gp' ? cup.cls : kind === 'attract' ? 1 : 1];
        R = { kind, ti, t: 0, go: false, cars: [], me: null, cls, ban: [], banCur: null, parts: [], order: [], cd: 0, wrongT: 0, split: null, endT: 0, score: null, pitT: 0, warnT: 0, boostHint: false, startBoost: 0, chain: 0 };
        const field = [];
        if (kind === 'attract') { for (const m of MACHINES) field.push(mkCar(m, { main: true })); for (const p of PACK) field.push(mkCar(p)); }
        else {
          const mine = MACHINES[o.car || 0];
          R.me = mkCar(mine, { player: true, name: 'YOU', frames: playerFrames(mine) });
          if (kind === 'gp') { for (const m of MACHINES) if (m !== mine) field.push(mkCar(m, { main: true })); for (const p of PACK) field.push(mkCar(p)); }
          else { // practice: just you and Dave's ghost (his best lap, on loop)
            const rec = recs(ti), dave = rec.find(r => r[1] === 'DAVE') || rec[2];
            const gh = mkCar(PACK[3], { ghost: true, name: "DAVE'S GHOST" });
            gh.ck = T.def.ref / dave[0]; gh.vtop = 360 * gh.ck; field.push(gh);
          }
        }
        // the grid: the player starts sixth in a cup race, second-row-ish in practice
        let si = 0;
        for (const c of field) {
          if (R.me && kind === 'gp' && si === 5) si++;
          const sl = gridSlot(c.ghost ? 2 : si++); put(c, sl[0], sl[1]);
          if (!c.ghost) c.vtop = c.def.vmax * cls.ai * (c.main ? 0.99 : 1) * (0.99 + rnd() * 0.02) * (c.id === 'dave' ? 0.97 : 1);
          c.off = (rnd() - 0.5) * 20; c.offT = rnd() * 10;
        }
        if (R.me) { const sl = gridSlot(kind === 'gp' ? 5 : 1); put(R.me, sl[0], sl[1]); R.me.boosts = 0; }
        R.cars = R.me ? [R.me].concat(field) : field;
        if (kind === 'practice') { const sl = gridSlot(0); put(R.cars[1], sl[0], sl[1]); }
        cam.a = R.cars[0].a; cam.x = R.cars[0].x; cam.y = R.cars[0].y;
        ranks();
      }
      function ranks() { const l = R.cars.filter(c => !c.ghost); l.sort((a, b) => (b.fin ? 1e9 - b.fin : b.s) - (a.fin ? 1e9 - a.fin : a.s)); l.forEach((c, k) => { c.place = k + 1; }); R.order = l; }
      function banner(t, o) { o = o || {}; const b = { t, sub: o.sub || '', cols: o.cols || CHROME, life: o.life || 1.6, age: 0, k: o.k || 3 }; if (o.now) { R.ban.length = 0; R.banCur = b; } else R.ban.push(b); }
      const parts = []; // particles: [x, y, alt, vx, vy, va, life, col, size]
      function spark(x, y, alt, n, cols, spd) { for (let k = 0; k < n; k++) { if (parts.length > 160) parts.shift(); const a = rnd() * TAU, v = (spd || 60) * (0.4 + rnd()); parts.push([x, y, alt, Math.cos(a) * v, Math.sin(a) * v, 30 + rnd() * 50, 0.3 + rnd() * 0.4, cols[rnd() * cols.length | 0], rnd() < 0.3 ? 2 : 1]); } }
      let shake = 0;

      // ---- the player's machine (free physics)
      function drivePlayer(c, dt) {
        const M = c.def, ctl = R.go && !c.fin && c.rescue <= 0 && c.energy > 0;
        const steer = ctl || c.auto ? inp.steer : 0, thr = (ctl || c.auto) && inp.thr, brk = (ctl || c.auto) && inp.brk, lean = (ctl || c.auto) ? inp.lean : 0;
        if (c.rescue > 0) { // the rescue drone lowers you back on
          c.rescue -= dt; c.vx = c.vy = 0; c.alt = Math.max(0, c.rescue * 30);
          if (c.rescue <= 0) { c.alt = 0; c.flash = 1.2; }
          return;
        }
        const fx = Math.cos(c.a), fy = Math.sin(c.a);
        let vf = c.vx * fx + c.vy * fy, vl = -c.vx * fy + c.vy * fx;
        const mat = c.air ? M_OFF : matAt(c.x, c.y);
        // boost / dash plates / rough / pit
        if (inp.boost && (ctl || c.auto) && c.boosts > 0 && c.boostT <= 0) { c.boosts--; c.boostT = 2.4; snd.boost(); shake = Math.max(shake, 0.25); if (c.player && R.kind !== 'attract') banner('BOOST!', { cols: FIRE, life: 0.8, now: true, k: 3 }); }
        if (mat === M_DASH && c.dashT < 0.6) { c.dashT = 0.9; vf = Math.max(vf, 0) + 70; snd.dash(); }
        if (mat === M_JUMP && !c.air && vf > 60) { c.air = true; c.vz = 110 + 0.32 * vf; c.takeoffS = c.s; snd.jump(); }
        const rough = mat === M_ROUGH;
        if (rough) { c.roughT = 0.1; if (K.frame % 3 === 0) spark(c.x, c.y, 1, 1, ['#8a7050', '#c8a878'], 30); }
        if (mat === M_PIT && c.energy < 100 && c.player) { c.energy = Math.min(100, c.energy + 30 * dt); if (K.frame % 6 === 0) snd.pit(); R.pitT = 0.3; }
        if (c.boostT > 0) c.boostT -= dt; if (c.dashT > 0) c.dashT -= dt;
        let vmax = M.vmax * (c.boostT > 0 ? 1.3 : 1) * (c.dashT > 0 ? 1.16 : 1) * (rough ? 0.58 : 1);
        if (c.energy <= 0) { vmax = 0; if (K.frame % 4 === 0) spark(c.x - Math.cos(c.a) * 12, c.y - Math.sin(c.a) * 12, 6, 1, ['#585868', '#8a8a98', '#3a3a48'], 18); }
        if (thr) { const acc = M.accel * (c.boostT > 0 ? 2.4 : c.dashT > 0 ? 2 : 1); if (vf < vmax) { const r = vf / vmax; vf = Math.min(vmax, vf + acc * Math.max(0.12, 1 - r * r * r * r) * dt * (vf < 0 ? 3 : 1)); } }
        else if (!c.air) vf -= Math.sign(vf) * Math.min(Math.abs(vf), (35 + Math.abs(vf) * 0.22) * dt);
        if (vf > vmax) vf -= Math.min(vf - vmax, (rough ? 400 : 160) * dt);
        if (brk && !c.air) { vf -= Math.sign(vf) * Math.min(Math.abs(vf), 330 * dt); if (Math.abs(vf) < 5 && !thr) vf = Math.max(-60, vf - 90 * dt); }
        // steering: slower turning at speed; lean into the turn to tighten it (and slide a bit)
        const sp = Math.min(1, Math.abs(vf) / M.vmax);
        let w = M.turn * (1 - 0.35 * sp) * steer * (vf < -1 ? -1 : 1);
        let grip = M.grip;
        if (lean) { if (steer && Math.sign(steer) === lean) { w *= 1.5; grip *= 0.55; } else vl += lean * 90 * dt; }
        if (c.air) { w *= 0.5; grip = 0.3; }
        if (Math.abs(vf) < 20) w *= Math.abs(vf) / 20 + 0.3;
        vl *= Math.exp(-grip * dt);
        c.vx = fx * vf - fy * vl; c.vy = fy * vf + fx * vl;
        c.a += w * dt;
        c.lean = lerp(c.lean, clamp(steer * 0.7 + (lean ? lean * 0.3 : 0) + clamp(-vl / 140, -0.4, 0.4), -1, 1), Math.min(1, dt * 8));
        c.x += c.vx * dt; c.y += c.vy * dt; c.v = vf;
        if (c.air) {
          c.alt += c.vz * dt; c.vz -= 420 * dt;
          if (c.alt <= 0) {
            c.alt = 0; c.air = false; c.vz = 0;
            const jumped = locate(c, true); snd.land(); shake = Math.max(shake, 0.2);
            if (Math.abs(c.lat) > HW + BW - 2) return fallOff(c);
            if (c.s - c.takeoffS > 650 && c.player) { // flew over the gap: the short cut
              c.bigAir++; R.chain++;
              if (R.kind !== 'attract') { banner('BIG AIR!', { sub: 'SHORT CUT!', cols: MINT, now: true }); snd.final(); K.secret('lk.zero.jump'); if (!SV.jumped) { SV.jumped = 1; save(); } }
            }
          }
        }
        if (!c.air) {
          locate(c);
          const lim = HW - 7, al = Math.abs(c.lat);
          if (al > lim && al < HW + BW + 30) { // the barrier: bounce, sparks, lose power
            const sg = Math.sign(c.lat), nx = -Math.sin(T.G.A[c.i]) * sg, ny = Math.cos(T.G.A[c.i]) * sg;
            c.x -= nx * (al - lim); c.y -= ny * (al - lim); c.lat = sg * lim;
            const vn = c.vx * nx + c.vy * ny;
            if (vn > 0) {
              c.vx -= nx * vn * 1.55; c.vy -= ny * vn * 1.55;
              const sp2 = Math.hypot(c.vx, c.vy), keep = 0.97 - Math.min(0.15, vn / 900); c.vx *= keep; c.vy *= keep;
              if (vn > 25) { if (c.player) { const d = 1.5 + vn * 0.045; hurt(c, d); c.hits++; shake = Math.max(shake, Math.min(0.5, vn / 300)); snd.wall(Math.min(1, vn / 200)); } spark(c.x + nx * 7, c.y + ny * 7, 3, 6 + (vn / 15 | 0), ['#fff8a0', '#f8d040', '#ffffff', '#f88020'], 70 + vn * 0.3); c.flash = 0.25; }
              else if (sp2 > 80) { c.scrape += dt; if (c.player) { hurt(c, 4 * dt); if (K.frame % 5 === 0) snd.scrape(); } if (K.frame % 2 === 0) spark(c.x + nx * 7, c.y + ny * 7, 2, 2, ['#fff8a0', '#f8c040'], 50); }
            }
            // steer the nose away from the wall a touch so it never sticks
            const ta = T.G.A[c.i]; c.a += clamp(wrapA(ta - c.a), -0.6, 0.6) * dt * 2;
          } else if (al >= HW + BW + 30) return fallOff(c);
          if (al < HW - 10) c.safeS = c.s;
        } else locate(c);
      }
      function hurt(c, d) { if (!c.player || R.kind === 'attract') return; d *= R.cls.dmg || 1; const was = c.energy; c.energy = Math.max(0, c.energy - d); if (was > 25 && c.energy <= 25) { banner('POWER LOW!', { sub: 'DRIVE THROUGH THE PIT LANE', cols: FIRE, life: 2.2, now: true, k: 2 }); snd.warn(); } }
      function fallOff(c) {
        snd.splash(); spark(c.x, c.y, 0, 24, T.def.theme === 'port' ? ['#ffffff', '#a8d8f8', '#78b8f0'] : ['#e8d8b0', '#a08060', '#ffffff'], 90); shake = 0.4;
        if (c.player && R.kind !== 'attract') { banner(T.def.theme === 'port' ? 'SPLASH!' : 'WHOOPS!', { sub: 'THE RESCUE DRONE IS ON ITS WAY', cols: CHROME, now: true, life: 1.8, k: 3 }); hurt(c, 12); }
        put(c, c.safeS - 40, clamp(c.lat, -20, 20) * 0); c.vx = c.vy = 0; c.v = 0; c.air = false; c.alt = 30; c.rescue = 1.4; c.boostT = 0; c.dashT = 0;
      }
      // ---- the computer cars (on rails, but clever rails)
      function driveAI(c, dt) {
        const G = T.G, me = R.me;
        if (!R.go) { c.x += 0; return; }
        const i = idxOf(c.s), kap = G.CS[i];
        const ia = idxOf(c.s + 30 + c.v * 0.3);
        let band = 1;
        if (me && !c.ghost && !me.fin) { const gap = me.s - c.s; band = 1 + clamp(gap / (c.main ? 1700 : 2400), c.main ? -0.13 : -0.1, c.main ? 0.085 : 0.05); }
        if (R.kind === 'attract') band = 1 + clamp((R.order[3] ? R.order[3].s - c.s : 0) / 2000, -0.08, 0.08);
        let vt = Math.min(c.vtop * band, T.vc[ia] * R.cls.corner * c.ck);
        if (c.ghost) vt = Math.min(c.vtop, T.vc[ia] * c.ck);
        const mat = c.air ? M_OFF : matAt(c.x, c.y);
        if (mat === M_DASH && c.dashT <= 0) c.dashT = 0.8;
        if (mat === M_JUMP && !c.air) { c.air = true; c.vz = 110 + 0.32 * c.v; }
        if (mat === M_ROUGH) vt = Math.min(vt, c.vtop * 0.6);
        if (c.dashT > 0) { c.dashT -= dt; vt *= 1.15; }
        if (c.lift > 0) { c.lift -= dt; vt *= 0.8; } else if (!c.main && !c.ghost && rnd() < dt / 14) c.lift = 0.5 + rnd() * 0.6;
        // a target line: the racing line plus this driver's own habit, and dodging whoever is in front
        c.offT -= dt; if (c.offT <= 0) { c.offT = 3 + rnd() * 5; c.off = (rnd() - 0.5) * (c.ghost ? 0 : 26); }
        let lt = T.line[idxOf(c.s + 60)] * (c.ghost ? 1 : 0.85) + c.off;
        if (!c.ghost) for (const o of R.cars) {
          if (o === c || o.ghost || o.rescue > 0) continue; const ds = o.s - c.s;
          if (ds > 0 && ds < 50 && Math.abs(o.lat - c.lat) < 22) { lt = o.lat + (o.lat > c.lat ? -1 : 1) * 26; if (Math.abs(lt) > HW - 12) lt = o.lat - Math.sign(o.lat) * 26; if (ds < 24) vt = Math.min(vt, (o.player ? Math.hypot(o.vx, o.vy) : o.v) + 6); }
        }
        for (const f of T.ramps) { const d = (((c.s - f.s0 + 250) % G.L) + G.L) % G.L; if (d < 380) lt = Math.max(lt, f.l1 + 16); }
        lt = clamp(lt, -HW + 12, HW - 12);
        const dv = vt - c.v; c.v += dv > 0 ? Math.min(dv, 150 * dt * Math.max(0.25, 1 - (c.v / (c.vtop * 1.2)) ** 2)) : Math.max(dv, -DEC * dt);
        c.latV = lerp(c.latV, clamp((lt - c.lat) * 2.2, -75, 75), Math.min(1, dt * 4)); c.lat += c.latV * dt;
        const den = clamp(1 - c.lat * kap, 0.6, 1.4); c.s += c.v * dt / den;
        G.at(c.s, oo); const nx = -Math.sin(oo[2]), ny = Math.cos(oo[2]);
        c.x = oo[0] + nx * c.lat; c.y = oo[1] + ny * c.lat; c.a = oo[2] + Math.atan2(c.latV, Math.max(30, c.v)); c.i = idxOf(c.s);
        c.lean = lerp(c.lean, clamp(kap * 250 + c.latV / 120, -1, 1), dt * 5);
        if (c.air) { c.alt += c.vz * dt; c.vz -= 420 * dt; if (c.alt <= 0) { c.alt = 0; c.air = false; } }
      }
      // ---- bumping into each other (the player only: the others dodge)
      function collide() {
        const me = R.me; if (!me || me.rescue > 0) return;
        for (const c of R.cars) {
          if (c === me || c.ghost) continue;
          const dx = c.x - me.x, dy = c.y - me.y; if (Math.abs(dx) > 16 || Math.abs(dy) > 16 || Math.abs(c.alt - me.alt) > 8) continue;
          const d = Math.hypot(dx, dy); if (d >= 15 || d < 0.01) continue;
          const nx = dx / d, ny = dy / d, push = (15 - d), wm = me.def.wt, wc = c.def.wt || 1, tot = wm + wc;
          me.x -= nx * push * wc / tot; me.y -= ny * push * wc / tot;
          const cvx = Math.cos(c.a) * c.v, cvy = Math.sin(c.a) * c.v, rel = (me.vx - cvx) * nx + (me.vy - cvy) * ny;
          if (rel > 0) {
            const j = rel * 1.4; me.vx -= nx * j * wc / tot; me.vy -= ny * j * wc / tot;
            const T0 = T.G.A[c.i], tx = Math.cos(T0), ty = Math.sin(T0);
            c.v += (nx * tx + ny * ty) * j * wm / tot; c.latV += (-nx * ty + ny * tx) * j * wm / tot * 1.2; c.lat += (-nx * ty + ny * tx) * push * wm / tot;
            if (rel > 20) { hurt(me, 1.5 + rel * 0.03); snd.bump(); spark((me.x + c.x) / 2, (me.y + c.y) / 2, 4, 5, ['#ffffff', '#f8e060'], 60); shake = Math.max(shake, 0.15); c.flash = 0.2; me.flash = 0.2; }
          }
        }
      }
      function lapCheck(c) {
        const L = T.G.L, lp = Math.floor(c.s / L);
        if (lp > c.lapMax) {
          c.lapMax = lp;
          if (lp >= 1) {
            const lt = R.t - c.lapT0; c.lapT0 = R.t; c.laps.push(lt); if (!c.best || lt < c.best) c.best = lt;
            if (c.ghost) return;
            if (c.player && R.kind !== 'attract' && !c.fin) onLap(c, lp, lt);
            if (lp >= LAPS && !c.fin) { c.fin = R.t; if (c.player && R.kind !== 'attract') onFinish(c); }
          }
        }
      }
      function onLap(c, lp, lt) {
        const rec = recs(R.ti), isRec = lt < rec[0][0];
        R.split = { lap: lp, t: lt, age: 0, best: lt <= c.best + 1e-6 && lp > 1, rec: isRec };
        if (lp < LAPS) {
          if (R.kind === 'gp') {
            ranks();
            const lim = R.cls.safe[lp - 1];
            if (c.place > lim) return rankOut('RANKED OUT', `YOU WERE ${ORD[c.place - 1]}. YOU NEEDED TOP ${lim}.`);
          }
          if (lp === LAPS - 1) { banner('FINAL LAP!', { cols: FIRE, sub: R.kind === 'gp' ? `FINISH IN THE TOP ${R.cls.safe[2]}` : '', life: 2 }); snd.final(); music(T.def.theme, true); }
          else { banner('LAP ' + (lp + 1), { cols: CHROME, sub: R.kind === 'gp' ? `STAY IN THE TOP ${R.cls.safe[lp]}!` : '', life: 1.6 }); snd.lap(); }
          if (c.boosts < 3) { c.boosts++; if (!R.boostHint) { R.boostHint = true; banner('BOOST READY!', { sub: `PRESS ${btn('y')} FOR A SUPER BOOST`, cols: MINT, life: 2.2, k: 2 }); } }
        }
      }
      function onFinish(c) {
        ranks();
        if (R.kind === 'gp' && c.place > R.cls.safe[2]) return rankOut('RANKED OUT', `YOU CAME ${ORD[c.place - 1]}. YOU NEEDED TOP ${R.cls.safe[2]}.`);
        mode = 'finish'; mt = 0; c.auto = true;
        banner(R.kind === 'practice' ? 'FINISH!' : ORD[c.place - 1] + '!', { cols: c.place === 1 ? GOLD : CHROME, sub: R.kind === 'practice' ? 'TIME ' + fmt(R.t) : c.place === 1 ? 'YOU WIN!' : 'WELL DRIVEN!', life: 3.5, now: true, k: 4 });
        if (c.place === 1 || R.kind === 'practice') snd.win(); else snd.fin();
        music(null);
      }
      function rankOut(title, text) {
        const me = R.me; me.auto = true; me.fin = me.fin || R.t;
        mode = 'out'; mt = 0; outInfo = { title, text }; music(null); snd.out();
        banner(title, { cols: FIRE, now: true, life: 3, k: 3 });
      }
      let outInfo = null;

      // ------------------------------------------------------------ the race update
      const cam = { x: 0, y: 0, a: 0, h: CAM_H, follow: 0 };
      function autoDrive(c) {
        const G = T.G, look = 46 + Math.abs(c.v) * 0.32; G.at(c.s + look, oo);
        const lt = T.line[idxOf(c.s + look)] * 0.9;
        const tx = oo[0] - Math.sin(oo[2]) * lt, ty = oo[1] + Math.cos(oo[2]) * lt;
        const d = wrapA(Math.atan2(ty - c.y, tx - c.x) - c.a);
        inp.steer = clamp(d * 4, -1, 1);
        const vt = T.vc[idxOf(c.s + 30 + Math.max(0, c.v) * 0.3)] * (c.autoK || 1.05);
        inp.thr = c.v < vt; inp.brk = c.v > vt + 40; inp.lean = Math.abs(d) > 0.18 ? Math.sign(d) : 0; inp.boost = c.autoBoost && c.lapMax >= 1 && Math.abs(G.CS[idxOf(c.s + 200)]) < 0.001;
      }
      function raceStep(dt) {
        if (R.go) R.t += dt;
        const me = R.me;
        if (me) {
          if (me.auto) autoDrive(me);
          else { const st = K.stick(); inp.steer = st.x; inp.thr = K.held('a'); inp.brk = K.held('b'); inp.boost = K.pressed('y') || K.pressed('x'); inp.lean = (K.held('r') ? 1 : 0) - (K.held('l') ? 1 : 0); }
          if (!R.go) { if (K.held('a') && R.cd > 0 && R.cd < 0.45 && !R.startBoost) R.startBoost = 1; if (K.held('a') && R.cd > 1.2) R.startBoost = -1; }
          drivePlayer(me, dt);
          if (me.energy <= 0 && R.kind !== 'attract' && mode === 'race') { mode = 'nopower'; mt = 0; outInfo = { title: 'OUT OF POWER', text: 'THE BATTERY WENT FLAT. USE THE PIT LANE!' }; music(null); snd.out(); banner('OUT OF POWER', { sub: 'THE BATTERY IS FLAT!', cols: FIRE, now: true, life: 3, k: 3 }); }
        }
        for (const c of R.cars) if (!c.player) driveAI(c, dt);
        collide();
        for (const c of R.cars) { lapCheck(c); if (c.flash > 0) c.flash -= dt; }
        ranks();
        // wrong way?
        if (me && R.go && !me.fin && mode === 'race') {
          const back = Math.cos(wrapA(me.a - T.G.A[me.i])) < -0.2 && Math.hypot(me.vx, me.vy) > 40;
          R.wrongT = back ? R.wrongT + dt : 0;
          if (R.wrongT > 1.2 && !(R.banCur && R.banCur.t === 'WRONG WAY!')) { banner('WRONG WAY!', { cols: FIRE, sub: 'TURN AROUND!', life: 1.5, now: true }); snd.warn(); }
          if (me.energy < 25 && me.energy > 0) { R.warnT -= dt; if (R.warnT <= 0) { R.warnT = 1.2; snd.warn(); } }
          if (R.pitT > 0) R.pitT -= dt;
        }
        // particles
        for (let k = parts.length - 1; k >= 0; k--) { const p = parts[k]; p[0] += p[3] * dt; p[1] += p[4] * dt; p[2] += p[5] * dt; p[5] -= 160 * dt; p[6] -= dt; if (p[2] < 0) { p[2] = 0; p[5] *= -0.4; } if (p[6] <= 0) parts.splice(k, 1); }
        if (shake > 0) shake = Math.max(0, shake - dt);
        // banners
        if (!R.banCur && R.ban.length) R.banCur = R.ban.shift();
        if (R.banCur) { R.banCur.age += dt; if (R.banCur.age > R.banCur.life) R.banCur = null; }
        if (R.split) { R.split.age += dt; if (R.split.age > 3.5) R.split = null; }
        // the engine note
        if (me && !me.auto && R.go && K.frame % 6 === 0 && (mode === 'race')) { const v = Math.hypot(me.vx, me.vy); SFX.tone(55 + v * 0.32, 0.12, 'sawtooth', 0.016 + (me.boostT > 0 ? 0.01 : 0)); if (me.boostT > 0 && K.frame % 12 === 0) SFX.noise(0.12, 0.03, 2500, 0, 'bandpass'); }
      }
      function camFollow(c, dt, snap) {
        const k = snap ? 1 : Math.min(1, dt * 10);
        cam.a += wrapA(c.a - cam.a) * k;
        cam.h = CAM_H + c.alt * 0.55;
        cam.x = c.x - Math.cos(cam.a) * CAMD; cam.y = c.y - Math.sin(cam.a) * CAMD;
      }

      // ------------------------------------------------------------ drawing the world
      const FH = H - HZ, fimg = g.createImageData(W, FH), fb = new Uint32Array(fimg.data.buffer);
      let palTick = 0;
      function cyclePal() {
        palTick++;
        for (const c of T.cyc) { if (palTick % c.every) continue; c.ph = ((c.ph || 0) + 1) % c.n; for (let k = 0; k < c.n; k++) { T.pal[c.i + k] = c.c32[(k + c.ph) % c.n]; if (c.s32) T.pal[c.i + 32 + k] = c.s32[(k + c.ph) % c.n]; } }
      }
      function drawFloor(cx, cy, ca, ch) {
        const tex = T.tex, tile = T.tile, pal = T.pal, fx = Math.cos(ca), fy = Math.sin(ca), rx = -fy, ry = fx, hfoc = ch * FOC;
        let o = 0;
        for (let r = 0; r < FH; r++) {
          const z = hfoc / (r + 0.5), k = z / FOC;
          let u = cx + fx * z - rx * k * 128, v = cy + fy * z - ry * k * 128; const du = rx * k, dv = ry * k;
          for (let x = 0; x < W; x++) { const ui = u | 0, vi = v | 0; fb[o++] = pal[((ui | vi) & ~TM) === 0 ? tex[(vi << TSH) | ui] : tile[((vi & 255) << 8) | (ui & 255)]]; u += du; v += dv; }
        }
        g.putImageData(fimg, 0, HZ);
      }
      function drawSky(ca) {
        g.drawImage(T.sky, 0, 0);
        let ox = -((ca * FOC * 0.8) % LW); if (ox > 0) ox -= LW;
        g.drawImage(T.far, ox, HZ - 60); g.drawImage(T.far, ox + LW, HZ - 60);
        ox = -((ca * FOC) % LW); if (ox > 0) ox -= LW;
        g.drawImage(T.near, ox, HZ - 36); g.drawImage(T.near, ox + LW, HZ - 36);
      }
      const SHADOW = (() => { const c = canvas(40, 14), x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,16,0.42)'; x.beginPath(); x.ellipse(20, 7, 19, 6.5, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(0,0,16,0.25)'; x.beginPath(); x.ellipse(20, 7, 14, 4.5, 0, 0, TAU); x.fill(); return c; })();
      const FLAME = [0, 1, 2].map(f => { const c = canvas(12, 20), x = c.getContext('2d'); const l = 12 + f * 3; x.fillStyle = '#f87818'; x.beginPath(); x.ellipse(6, 3 + l / 2, 4.5, l / 2, 0, 0, TAU); x.fill(); x.fillStyle = '#f8d040'; x.beginPath(); x.ellipse(6, 2 + l / 3, 3, l / 3, 0, 0, TAU); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(6, 2.5, 2, 2.5, 0, 0, TAU); x.fill(); crisp(c, null); return c; });
      const DRONE = (() => { const c = canvas(32, 22), x = c.getContext('2d'); x.fillStyle = '#e8e8f0'; x.fillRect(10, 6, 12, 6); x.fillStyle = '#f8c020'; x.fillRect(12, 7, 8, 3); x.fillStyle = '#404050'; x.fillRect(2, 3, 28, 2); x.fillRect(15, 12, 2, 9); x.fillStyle = '#a0a8c0'; x.fillRect(0, 1, 8, 1); x.fillRect(24, 1, 8, 1); x.fillStyle = '#f83030'; x.fillRect(15, 5, 2, 1); crisp(c, '#101018'); return c; })();
      const PODY = { comet: 6.6, hornet: 6.4, gecko: 5.0, rhino: 7.6 };
      const dl = [], tags = [], tagBox = []; // draw list
      function drawSprites(cx, cy, ca, ch, ghostAlpha) {
        const fx = Math.cos(ca), fy = Math.sin(ca); dl.length = 0;
        for (const c of R.cars) { const dx = c.x - cx, dy = c.y - cy, z = dx * fx + dy * fy; if (z < 14 || z > 2600) continue; dl.push([z, c, -dx * fy + dy * fx]); }
        dl.sort((a, b) => b[0] - a[0]);
        for (const [z, c, xr] of dl) {
          const sc = FOC / z, sx = W / 2 + xr * sc, gy = HZ + ch * sc;
          if (sx < -60 || sx > W + 60) continue;
          // the shadow
          const sw = 22 * sc * (c.def.shape === 'rhino' ? 1.2 : 1);
          g.globalAlpha = c.ghost ? 0.3 : clamp(1 - c.alt / 120, 0.3, 1); g.drawImage(SHADOW, sx - sw / 2, gy - sw * 0.17, sw, sw * 0.35); g.globalAlpha = 1;
          if (c.rescue > 0 && c.rescue > 1.3 && (K.frame & 2)) continue;
          const bob = Math.sin(K.t * 7 + c.wob) * 0.6 + 2;
          const y = gy - (c.alt + bob) * sc;
          let img, k, ax, ay, isP = false;
          if (c.player && c.frames && Math.abs(xr) < 40 && z < 120) {
            const rel = wrapA(c.a - ca), t = clamp(rel * 2.2 + c.lean * 0.5, -1, 1), f = Math.round((t + 1) * 4);
            img = c.frames[f]; k = sc / SN.sc; ax = SN.cx; ay = SN.cy; isP = true;
          } else {
            const view = wrapA(c.a - Math.atan2(c.y - cy, c.x - cx)), f = ((Math.round(view / TAU * 16) % 16) + 16) % 16;
            if (sc > 1.45) { const B = c.spr.big || (c.spr.big = []); img = B[f] || (B[f] = renderCar(c.def, f / 16 * TAU, 0.55, 0, SB.sc, SB.w, SB.h, SB.cx, SB.cy)); k = sc / SB.sc; ax = SB.cx; ay = SB.cy; }
            else if (sc > 1.1) { img = c.spr.near[f]; k = sc / SN.sc; ax = SN.cx; ay = SN.cy; } else { img = c.spr.far[f]; k = sc / SF.sc; ax = SF.cx; ay = SF.cy; }
          }
          let jx = 0, jy = 0; if (c.roughT > 0 || (c.player && c.scrape > 0)) { jx = (rnd() - 0.5) * 2; jy = (rnd() - 0.5) * 2; c.roughT = Math.max(0, c.roughT - 1 / 60); c.scrape = Math.max(0, c.scrape - 1 / 60); }
          if (c.ghost) g.globalAlpha = ghostAlpha || (0.45 + 0.15 * Math.sin(K.t * 9));
          if (c.flash > 0 && (K.frame & 2)) g.globalAlpha = 0.5;
          const dw = img.width * k, dh = img.height * k;
          g.drawImage(img, Math.round(sx - ax * k + jx), Math.round(y - ay * k + jy), Math.round(dw), Math.round(dh));
          // thruster flames (big when boosting)
          if (isP && c.rescue <= 0) {
            const py = PODY[c.def.shape] * 2.5 * k, big = c.boostT > 0 ? 1.5 : c.dashT > 0 ? 1.2 : (c.auto || inp.thr) && c.energy > 0 ? 0.85 : 0.45, fr = FLAME[(K.frame >> 1) % 3], fw = 10 * k * Math.min(1.2, big), fh = 18 * k * big;
            for (const sd of [-1, 1]) g.drawImage(fr, Math.round(sx + jx + sd * py - fw / 2 - c.lean * 3 * k), Math.round(y + jy + 8 * k), Math.round(fw), Math.round(fh));
          }
          g.globalAlpha = 1;
          if (c.rescue > 0) g.drawImage(DRONE, Math.round(sx - 16 * k * 1.5), Math.round(y - (34 + 16) * k), Math.round(32 * k * 1.5), Math.round(22 * k * 1.5));
          // name tags over the nearby rivals
          if (!c.player && z < 230 && z > 30 && R.kind !== 'attract' && mode === 'race' && !paused) tags.push([sx, y - ay * k * 0.75 - 10, c, z]);
        }
        // name tags over the nearest rivals (never on top of each other)
        tagBox.length = 0;
        for (let q = tags.length - 1; q >= 0; q--) {
          const [tx, ty, c, z] = tags[q], nm = c.ghost ? 'DAVE' : c.name.split(' ').pop(), tw = nm.length * 6, x0 = Math.round(tx - tw / 2), y0 = Math.round(ty);
          if (tagBox.some(b => x0 < b[0] + b[2] + 2 && x0 + tw + 2 > b[0] && Math.abs(y0 - b[1]) < 10)) continue;
          tagBox.push([x0, y0, tw]); g.globalAlpha = clamp((230 - z) / 80, 0, 0.9); F.draw(g, nm, x0, y0, c.ghost ? '#c8d8ff' : '#f8f0c0', 1, '#000010'); g.globalAlpha = 1;
        }
        tags.length = 0;
        // sparks and bits
        for (const p of parts) {
          const dx = p[0] - cx, dy = p[1] - cy, z = dx * fx + dy * fy; if (z < 10) continue;
          const sc = FOC / z, sx = W / 2 + (-dx * fy + dy * fx) * sc, sy = HZ + (ch - p[2]) * sc, s = Math.max(1, Math.round(p[8] * sc / 2.5));
          g.fillStyle = p[7]; g.fillRect(sx | 0, sy | 0, s, s);
        }
      }
      function drawWorld(cx, cy, ca, ch, sk) {
        let sx = 0, sy = 0; if (sk > 0) { sx = (rnd() - 0.5) * sk * 10; sy = (rnd() - 0.5) * sk * 8; }
        const ox = cx + (Math.cos(ca) * sy - Math.sin(ca) * sx), oy = cy + (Math.sin(ca) * sy + Math.cos(ca) * sx);
        drawSky(ca); drawFloor(ox, oy, ca, ch);
        g.drawImage(T.haze, 0, HZ);
        if (R) drawSprites(ox, oy, ca, ch);
      }

      // ------------------------------------------------------------ text and panels
      const txt = (s, x, y, col, k) => F.draw(g, s, x, y, col || '#ffffff', k || 1, '#000010');
      const ctr = (s, y, col, k, cx) => F.center(g, s, cx == null ? W / 2 : cx, y, col || '#ffffff', k || 1, '#000010');
      const art = (s, k, cols, x, y, slant) => { const c = textArt(F, s, k, cols, '#08081a', slant); g.drawImage(c, Math.round(x == null ? (W - c.width) / 2 : x), Math.round(y)); return c; };
      const num = (s, k, cols, x, y) => { s = String(s); const adv = 6 * k; for (let i = 0; i < s.length; i++) if (s[i] !== ' ') { const c = textArt(F, s[i], k, cols, '#08081a', 0.2); g.drawImage(c, Math.round(x + i * adv), Math.round(y)); } };
      function panel(x, y, w, h, a) {
        g.globalAlpha = a == null ? 0.88 : a; g.fillStyle = '#0c1030'; g.fillRect(x, y, w, h); g.globalAlpha = 1;
        g.fillStyle = '#7888d8'; g.fillRect(x, y, w, 1); g.fillRect(x, y, 1, h); g.fillStyle = '#000008'; g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h);
        g.fillStyle = '#2a3478'; g.fillRect(x + 2, y + 2, w - 4, 1); g.fillRect(x + 2, y + 2, 1, h - 4);
      }
      const blink = (hz) => (K.t * (hz || 2)) % 1 < 0.6;
      function chip(x, y, col) { g.fillStyle = '#000010'; g.fillRect(x - 1, y - 1, 9, 9); g.fillStyle = col; g.fillRect(x, y, 7, 7); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x, y, 7, 2); }

      // ------------------------------------------------------------ the HUD
      function drawHUD() {
        const me = R.me; if (!me) return;
        // lap + time (top left)
        const lap = clamp(me.lapMax + 1, 1, LAPS);
        txt('LAP', 6, 6, '#a8b8f0'); art(String(lap), 2, CHROME, 26, 1); txt('/' + LAPS, 40, 6, '#a8b8f0');
        txt(fmt(R.t), 6, 20, '#ffffff');
        if (R.split) { const sp = R.split; if (sp.age < 3.2 && (sp.age > 0.4 || (K.frame & 4))) { txt('LAP ' + sp.lap + ' ' + fmt(sp.t), 6, 30, sp.rec ? '#f8e060' : sp.best ? '#78f0a8' : '#d0d8f8'); if (sp.rec) txt('TRACK RECORD!', 6, 40, '#f8e060'); } }
        // power (top middle)
        const px = 84, pw = 88, e = me.energy / 100;
        txt('POWER', px, 3, me.energy < 25 && blink(4) ? '#f84040' : '#a8b8f0');
        g.fillStyle = '#000010'; g.fillRect(px - 1, 12, pw + 2, 9); g.fillStyle = '#20284a'; g.fillRect(px, 13, pw, 7);
        const ec = e > 0.5 ? ['#78f878', '#38c048', '#208828'] : e > 0.25 ? ['#f8f080', '#f8c020', '#b88010'] : ['#f88080', '#f02828', '#981010'];
        const ew = Math.round(pw * e); g.fillStyle = ec[1]; g.fillRect(px, 13, ew, 7); g.fillStyle = ec[0]; g.fillRect(px, 13, ew, 2); g.fillStyle = ec[2]; g.fillRect(px, 18, ew, 2);
        g.fillStyle = 'rgba(0,0,16,.5)'; for (let k = 1; k < 11; k++) g.fillRect(px + k * 8, 13, 1, 7);
        if (R.pitT > 0 && (K.frame & 4)) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(px, 13, ew, 7); }
        // super boosts
        for (let k = 0; k < 3; k++) { const on = k < me.boosts; const bx = px + k * 12, by = 23; g.fillStyle = '#000010'; g.fillRect(bx, by, 10, 9); g.fillStyle = on ? (me.boostT > 0 ? '#f8f8f8' : '#f8b020') : '#2a304a'; g.fillRect(bx + 1, by + 1, 8, 7); if (on) { F.draw(g, 'S', bx + 2, by + 1, '#802008', 1); } }
        if (me.boosts > 0 && R.kind !== 'attract') txt(btn('y'), px + 38, 24, blink(1.5) ? '#f8d040' : '#a07820');
        // position (top right)
        if (R.kind !== 'practice') {
          const lim = R.kind === 'gp' ? R.cls.safe[clamp(me.lapMax, 0, 2)] : 8, bad = me.place > lim;
          const c = art(String(me.place), 4, bad ? FIRE : me.place === 1 ? GOLD : CHROME, W - 52, 1, 0.15);
          txt(ORD[me.place - 1].slice(1), W - 52 + c.width - 2, 6, '#ffffff');
          txt('/' + NCARS, W - 52 + c.width - 2, 16, '#a8b8f0');
          if (R.kind === 'gp') txt(bad ? 'DANGER!' : 'SAFE ' + lim, W - 50, 36, bad ? (blink(3) ? '#f84040' : '#802020') : '#78f0a8');
        } else { txt('BEST', W - 62, 6, '#a8b8f0'); txt(me.best ? fmt(me.best) : "-'--\"--", W - 62, 16); txt('REC ' + recs(R.ti)[0][1], W - 62, 28, '#f8e060'); txt(fmt(recs(R.ti)[0][0]), W - 62, 38, '#f8e060'); }
        // speed (bottom right)
        const kmh = Math.round(Math.hypot(me.vx, me.vy) * 1.25);
        num(String(kmh).padStart(3, ' '), 2, me.boostT > 0 ? FIRE : CHROME, W - 74, H - 22); txt('KM/H', W - 30, H - 13, '#a8b8f0');
        // the mini map (bottom left)
        g.globalAlpha = 0.85; g.drawImage(T.mini, 4, H - 64); g.globalAlpha = 1;
        for (let k = R.cars.length - 1; k >= 0; k--) { const c = R.cars[k], mx = 4 + c.x * T.ms + T.mox, my = H - 64 + c.y * T.ms + T.moy; if (c.player) { if (K.frame & 8) { g.fillStyle = '#000'; g.fillRect(mx - 2, my - 2, 5, 5); g.fillStyle = '#fff'; g.fillRect(mx - 1, my - 1, 3, 3); } } else { g.fillStyle = '#000'; g.fillRect(mx - 1, my - 1, 4, 4); g.fillStyle = c.ghost ? '#a8c0ff' : c.def.body; g.fillRect(mx, my, 2, 2); } }
        // practice: the gap to Dave's ghost
      }
      function drawBanner() {
        const b = R && R.banCur; if (!b) return;
        const c = textArt(F, b.t, b.k, b.cols, '#08081a', 0.18), a = b.age, z = a < 0.12 ? 1 + (0.12 - a) * 6 : 1;
        const out = b.life - a < 0.2 ? (b.life - a) / 0.2 : 1, w = c.width * z, h = c.height * z, y = 82;
        g.globalAlpha = clamp(out, 0, 1);
        g.drawImage(c, Math.round(W / 2 - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
        if (b.sub) ctr(b.sub, y + h / 2 + 4, '#ffffff');
        g.globalAlpha = 1;
      }

      // ------------------------------------------------------------ modes
      let mode = 'title', mt = 0, sel = 0, menu = null, paused = false, psel = 0, attractCar = 0, tsel = 0, csel = 0, clsSel = 1, recPage = 0, nameE = null, after = null, tally = null, fade = 0;
      const titleItems = () => (SV.cup ? ['CONTINUE CUP'] : []).concat(['GRAND PRIX', 'PRACTICE', 'RECORDS']);
      function goTitle() { mode = 'title'; mt = 0; menu = null; sel = 0; paused = false; newRace(0, 'attract'); R.go = true; music('title'); attractCar = 0; }
      function startCup(cls, car) { cup = { cls, car, race: 0, pts: {}, spares: CLASSES[cls].spares, score: 0, wins: 0, res: [] }; for (const m of MACHINES.concat(PACK)) cup.pts[m.id] = 0; SV.cup = cup; save(); intro(); }
      function intro() { const ti = cup ? cup.race : tsel; newRace(ti, cup ? 'gp' : 'practice', { car: cup ? cup.car : csel }); mode = 'intro'; mt = 0; music(null); paused = false; parts.length = 0; }
      function countdown() { mode = 'count'; mt = 0; R.cd = 3.2; camFollow(R.me, 0, true); }
      function raceScore() {
        const me = R.me, b = [];
        b.push([ORD[me.place - 1] + ' PLACE', PLACE_BONUS[me.place - 1]]);
        b.push(['POWER LEFT ' + Math.round(me.energy) + '%', Math.round(me.energy) * 8]);
        if (me.hits === 0) b.push(['NO BUMPS ON THE WALL', 500]);
        if (me.bigAir) b.push(['BIG AIR x' + Math.min(3, me.bigAir), Math.min(3, me.bigAir) * 300]);
        if (me.best && me.best < recs(R.ti)[0][0]) b.push(['LAP RECORD', 200]);
        const raw = b.reduce((a, x) => a + x[1], 0), tot = Math.round(raw * R.cls.mul / 10) * 10;
        return { lines: b, raw, tot };
      }
      function finishRace() { // after the FINISH! (gp)
        const me = R.me, order = R.order.slice();
        const sc = raceScore();
        order.forEach((c, k) => { cup.pts[c.id] = (cup.pts[c.id] | 0) + CUP_PTS[k]; });
        cup.score += sc.tot; if (me.place === 1) cup.wins++;
        cup.res.push(me.place);
        R.score = sc; R.gained = order.map((c, k) => [c, CUP_PTS[k]]);
        // a best lap for the tables?
        checkRecord(me.best);
        cup.race++;
        SV.cup = cup.race < TRACKS.length ? cup : null; save();
        mode = 'results'; mt = 0; music('results');
      }
      let pendingRec = null;
      function checkRecord(best) { if (!best) return; const t = recs(R.ti); const pos = t.findIndex(r => best < r[0]); if (pos >= 0 && pos < 5) pendingRec = { ti: R.ti, t: Math.round(best * 100) / 100 }; }
      function standingsList() { const all = MACHINES.concat(PACK); return all.map(m => [m, cup.pts[m.id] | 0]).sort((a, b) => b[1] - a[1] || (a[0] === MACHINES[cup.car] ? -1 : 1)); }
      function cupDone() {
        const st = standingsList(), myPos = st.findIndex(x => x[0] === MACHINES[cup.car]) + 1;
        const cl = CLASSES[cup.cls];
        let bonus = myPos === 1 ? 6000 : myPos === 2 ? 3500 : myPos === 3 ? 2000 : 0;
        const perfect = cup.wins >= TRACKS.length; if (perfect) bonus += 2000;
        bonus = Math.round(bonus * cl.mul / 10) * 10;
        tally = { pos: myPos, bonus, perfect, base: cup.score, total: Math.min(50000, cup.score + bonus) };
        if (myPos === 1) { SV.gold[cl.id] = Math.max(SV.gold[cl.id] | 0, 1); }
        if (perfect) K.secret('lk.zero.gold');
        SV.cup = null; save();
        mode = 'cupend'; mt = 0; music(null); if (myPos <= 3) { snd.win(); snd.cheer(); } else snd.fin();
        confetti = []; if (myPos <= 3) for (let k = 0; k < 90; k++) confetti.push([rnd() * W, -rnd() * H, 20 + rnd() * 40, rnd() * TAU, ['#f8d040', '#f84878', '#48c8f8', '#78f878', '#ffffff'][k % 5]]);
      }
      let confetti = [];
      function gameOver() { tally = { pos: 0, bonus: 0, base: cup ? cup.score : 0, total: cup ? cup.score : 0, over: true }; SV.cup = null; save(); mode = 'gameover'; mt = 0; music(null); }
      function report(sc, title, text) {
        const capped = Math.min(sc, 50000, Math.floor(K.t * 195));
        K.over(capped, { title, text });
      }
      // name entry for the tables (the 1999 way: three letters)
      const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!-. ';
      function askName(kind, then) { nameE = { kind, l: SV.ini.split(''), at: 0, then }; mode = 'name'; mt = 0; music('menu'); }

      function update(dt) {
        mt += dt; cyclePal();
        if (mode === 'title') return updTitle(dt);
        if (mode === 'class' || mode === 'car' || mode === 'track' || mode === 'records') { if (R) { raceStep(dt); camOrbit(dt); } return updMenus(dt); }
        if (mode === 'name') { if (R) { raceStep(dt); camOrbit(dt); } return updName(); }
        if (mode === 'intro') { raceStep(dt); if (mt > 3.2 || (mt > 0.6 && (K.pressed('a') || K.pressed('start')))) countdown(); return; }
        if (mode === 'count' || mode === 'race' || mode === 'finish' || mode === 'out' || mode === 'nopower') return updRace(dt);
        if (mode === 'results' || mode === 'standings' || mode === 'practiceEnd') { raceStep(dt); camFollow(R.me, dt); return updResults(); }
        if (mode === 'outcard') { if (mt > 1 && (K.pressed('a') || K.pressed('start'))) { snd.ok(); if (cup && cup.spares >= 0) intro(); else gameOver(); } return; }
        if (mode === 'cupend' || mode === 'gameover') return updEnd(dt);
        if (mode === 'reported') { for (const p of confetti) { p[1] += p[2] * dt; if (p[1] > H) p[1] -= H + 10; } }
      }
      function camOrbit(dt) { if (!R || !R.cars.length) return; const c = R.cars[attractCar % R.cars.length]; cam.a = c.a + Math.sin(K.t * 0.25) * 0.5; cam.h = CAM_H + 30; cam.x = c.x - Math.cos(cam.a) * 140; cam.y = c.y - Math.sin(cam.a) * 140; }
      function updTitle(dt) {
        raceStep(dt);
        if (mt > 0 && Math.floor(mt / 9) !== Math.floor((mt - dt) / 9)) attractCar = (attractCar + 3) % R.cars.length;
        const c = R.cars[attractCar % R.cars.length]; camFollow(c, dt);
        if (!menu) { if (mt > 0.5 && (K.pressed('start') || K.pressed('a'))) { menu = titleItems(); sel = 0; snd.ok(); } return; }
        if (K.pressed('up')) { sel = (sel + menu.length - 1) % menu.length; snd.move(); }
        if (K.pressed('down')) { sel = (sel + 1) % menu.length; snd.move(); }
        if (K.pressed('b')) { menu = null; snd.back(); return; }
        if (K.pressed('a') || K.pressed('start')) {
          const it = menu[sel]; snd.ok();
          if (it === 'CONTINUE CUP') { cup = SV.cup; intro(); }
          else if (it === 'GRAND PRIX') { mode = 'class'; mt = 0; music('menu'); after = 'gp'; }
          else if (it === 'PRACTICE') { mode = 'track'; mt = 0; music('menu'); after = 'practice'; }
          else { mode = 'records'; mt = 0; recPage = 0; music('menu'); }
        }
      }
      function updMenus() {
        const lr = K.pressed('left') ? -1 : K.pressed('right') ? 1 : 0, ud = K.pressed('up') ? -1 : K.pressed('down') ? 1 : 0;
        if (mode === 'class') {
          if (ud) { clsSel = clamp(clsSel + ud, 0, 2); snd.move(); }
          if (K.pressed('b')) { goTitle(); snd.back(); return; }
          if (K.pressed('a') || K.pressed('start')) { snd.ok(); mode = 'car'; mt = 0; }
        } else if (mode === 'car') {
          if (lr) { csel = (csel + lr + 4) % 4; snd.move(); carSpin = 0; }
          if (K.pressed('b')) { snd.back(); mode = after === 'gp' ? 'class' : 'track'; mt = 0; return; }
          if (K.pressed('a') || K.pressed('start')) { snd.ok(); if (after === 'gp') startCup(clsSel, csel); else { cup = null; intro(); } }
        } else if (mode === 'track') {
          if (lr) { tsel = (tsel + lr + TRACKS.length) % TRACKS.length; snd.move(); }
          if (K.pressed('b')) { goTitle(); snd.back(); return; }
          if (K.pressed('a') || K.pressed('start')) { snd.ok(); mode = 'car'; mt = 0; }
        } else if (mode === 'records') {
          if (lr) { recPage = (recPage + lr + TRACKS.length + 1) % (TRACKS.length + 1); snd.move(); }
          if (K.pressed('b') || K.pressed('a') || K.pressed('start')) { goTitle(); snd.back(); }
        }
      }
      function updName() {
        const n = nameE; const ch = ABC.indexOf(n.l[n.at]);
        if (K.pressed('up')) { n.l[n.at] = ABC[(ch + 1) % ABC.length]; snd.move(); }
        if (K.pressed('down')) { n.l[n.at] = ABC[(ch - 1 + ABC.length) % ABC.length]; snd.move(); }
        if (K.pressed('left') && n.at > 0) { n.at--; snd.move(); }
        if (K.pressed('right') && n.at < 2) { n.at++; snd.move(); }
        if (K.pressed('b') && n.at > 0) { n.at--; snd.back(); }
        if (K.pressed('a') || K.pressed('start')) {
          snd.ok();
          if (n.at < 2 && !K.pressed('start')) { n.at++; return; }
          const nm = n.l.join('').trim() || 'JAK'; SV.ini = n.l.join(''); save();
          n.then(nm);
        }
      }
      function updRace(dt) {
        const me = R.me;
        if (paused) {
          if (K.pressed('up')) { psel = (psel + 2) % 3; snd.move(); } if (K.pressed('down')) { psel = (psel + 1) % 3; snd.move(); }
          const opts = pauseOpts();
          if (K.pressed('start') || (K.pressed('a') && psel === 0) || K.pressed('b')) { paused = false; music(T.def.theme, me.lapMax >= LAPS - 1); snd.ok(); return; }
          if (K.pressed('a')) {
            if (psel === 1 && opts[1].ok) { snd.ok(); paused = false; if (R.kind === 'gp') { cup.spares--; SV.cup = cup; save(); } intro(); }
            else if (psel === 2) { snd.back(); paused = false; goTitle(); }
          }
          return;
        }
        if (K.pressed('start') && (mode === 'race' || mode === 'count')) { paused = true; psel = 0; music(null); snd.tick(); return; }
        if (mode === 'count') {
          const was = R.cd; R.cd -= dt;
          const n0 = Math.ceil(was), n1 = Math.ceil(R.cd);
          if (n1 !== n0 && n1 >= 1 && n1 <= 3) snd.beep(false);
          if (R.cd <= 0) {
            R.go = true; mode = 'race'; mt = 0; snd.beep(true); music(T.def.theme);
            banner('GO!', { cols: MINT, life: 0.9, now: true, k: 5 });
            if (R.startBoost === 1 && me) { me.dashT = 1.0; banner('ROCKET START!', { cols: FIRE, life: 1.4, k: 2 }); snd.dash(); }
            for (const c of R.cars) if (!c.player) c.v = 20 + rnd() * 30;
          }
        }
        raceStep(dt);
        camFollow(me, dt);
        if (mode === 'finish' && mt > 4) { if (R.kind === 'gp') finishRace(); else practiceEnd(); }
        if ((mode === 'out' || mode === 'nopower') && mt > 3) {
          if (R.kind === 'practice') { practiceEnd(true); return; }
          cup.spares--; SV.cup = cup.spares >= 0 ? cup : null; save();
          mode = 'outcard'; mt = 0; music('results');
        }
      }
      function pauseOpts() { const sp = R.kind === 'gp' ? cup.spares : 1; return [{ t: 'CONTINUE', ok: true }, { t: R.kind === 'gp' ? (sp > 0 ? 'RETRY (USES A SPARE)' : 'RETRY (NO SPARES!)') : 'RETRY', ok: sp > 0 }, { t: R.kind === 'gp' ? 'QUIT (CUP IS SAVED)' : 'QUIT', ok: true }]; }
      function practiceEnd(failed) {
        const me = R.me; checkRecord(me.best);
        R.score = { failed }; mode = 'practiceEnd'; mt = 0; music('results');
      }
      function updResults() {
        if (mt < 0.8) return;
        if (!(K.pressed('a') || K.pressed('start'))) return;
        snd.ok();
        if (mode === 'results') { mode = 'standings'; mt = 0; return; }
        const next = () => { if (mode === 'name') { /* set by askName */ } };
        if (pendingRec) { const pr = pendingRec; pendingRec = null; askName('lap', nm => { const t = recs(pr.ti); t.push([pr.t, nm]); t.sort((a, b) => a[0] - b[0]); t.length = 5; save(); afterResults(); }); return; }
        afterResults();
      }
      function afterResults() {
        if (R.kind === 'practice') { mode = 'track'; mt = 0; after = 'practice'; music('menu'); newRace(tsel, 'attract'); R.go = true; return; }
        if (cup.race >= TRACKS.length) cupDone(); else intro();
      }
      function updEnd(dt) {
        for (const p of confetti) { p[1] += p[2] * dt; p[0] += Math.sin(p[3] + K.t * 3) * 20 * dt; if (p[1] > H) p[1] -= H + 10; }
        if (mt < 2) return;
        if (K.pressed('a') || K.pressed('start')) {
          snd.ok();
          const tot = tally.total, done = () => report(tot, tally.over ? 'GAME OVER' : tally.pos === 1 ? 'NULL CUP CHAMPION!' : tally.pos <= 3 ? 'ON THE PODIUM!' : 'CUP COMPLETE',
            tally.over ? 'Out of spare cars. Practice makes perfect!' : tally.pos === 1 ? (tally.perfect ? 'Every race won. Luke is going to be fuming.' : 'The gold cup is yours!') : `You finished the cup ${ORD[tally.pos - 1]}.`);
          const pos = SV.cups.findIndex(r => tot > r[0]);
          if (pos >= 0 && pos < 5 && tot > 0) askName('cup', nm => { SV.cups.push([tot, nm]); SV.cups.sort((a, b) => b[0] - a[0]); SV.cups.length = 5; save(); mode = 'reported'; done(); });
          else { mode = 'reported'; done(); }
        }
      }

      // ------------------------------------------------------------ drawing the screens
      let carSpin = 0;
      function draw() {
        g.imageSmoothingEnabled = false;
        if (!T || !R) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return; }
        if (mode === 'intro') { // a fly-by: high up and round, then down behind you
          const me = R.me, t = clamp(mt / 3.2, 0, 1), e = 1 - (1 - t) * (1 - t);
          const a = me.a + (1 - e) * 2.4, d = lerp(320, CAMD, e), h = lerp(170, CAM_H, e);
          drawWorld(me.x - Math.cos(a) * d, me.y - Math.sin(a) * d, a, h, 0);
          drawIntro(t);
          return;
        }
        if (mode === 'outcard') return drawOutCard();
        if (mode === 'cupend' || mode === 'gameover' || mode === 'reported') return drawEnd();
        drawWorld(cam.x, cam.y, cam.a, cam.h, shake);
        if (mode === 'title') return drawTitle();
        if (mode === 'class') return drawClass();
        if (mode === 'car') return drawCar();
        if (mode === 'track') return drawTrackSel();
        if (mode === 'records') return drawRecords();
        if (mode === 'name') return drawName();
        if (mode === 'results') return drawResults();
        if (mode === 'standings') return drawStandings();
        if (mode === 'practiceEnd') return drawPracticeEnd();
        // racing
        drawHUD();
        if (mode === 'count') drawLights();
        drawBanner();
        if (paused) drawPause();
      }
      function dim(a) { g.fillStyle = `rgba(4,6,24,${a})`; g.fillRect(0, 0, W, H); }
      function drawTitle() {
        dim(0.25);
        const y0 = 22 + (mt < 1 ? (1 - mt) * -60 : 0);
        // a sleek backing band, with speed lines streaming off the back of NULL
        g.globalAlpha = 0.82; g.fillStyle = '#08082a'; g.beginPath(); g.moveTo(0, y0 + 20); g.lineTo(W, y0 + 8); g.lineTo(W, y0 + 66); g.lineTo(0, y0 + 76); g.fill(); g.globalAlpha = 1;
        g.fillStyle = '#f8a020'; g.beginPath(); g.moveTo(0, y0 + 19); g.lineTo(W, y0 + 7); g.lineTo(W, y0 + 8); g.lineTo(0, y0 + 20); g.fill();
        g.fillStyle = '#d83010'; g.beginPath(); g.moveTo(0, y0 + 76); g.lineTo(W, y0 + 66); g.lineTo(W, y0 + 67); g.lineTo(0, y0 + 77); g.fill();
        for (let k = 0; k < 5; k++) { const yy = y0 + 34 + k * 8, ph = (K.frame * (3 + k) + k * 37) % 80, w = 30 + ((k * 23) % 30); g.fillStyle = k % 2 ? '#f8c040' : '#f86020'; g.globalAlpha = 0.85; g.fillRect(64 - ph - w, yy, w, 1 + (k & 1)); g.globalAlpha = 1; }
        g.drawImage(textArt(F, 'FORMULA', 3, CHROME, '#08081a', 0.3, 3, '#18205a'), 24, y0);
        g.drawImage(textArt(F, 'NULL', 6, FIRE, '#08081a', 0.3, 5, '#4a0c08'), 68, y0 + 22);
        art('THE NULL CUP', 1, GOLD, null, y0 + 78);
        const best = SV.cups[0];
        txt('HI ' + String(best[0]).padStart(5, ' ') + ' ' + best[1], 6, 4, '#f8e060');
        if (!menu) {
          if (blink(1.6)) art('PRESS START', 2, CHROME, null, 190);
          ctr('(C) 1990 HOVERSOFT', H - 10, '#a8b0d8');
        } else {
          const n = menu.length, ph = n * 14 + 10, py = 132;
          panel(64, py, 128, ph);
          menu.forEach((it, k) => { const on = k === sel; ctr(it, py + 7 + k * 14, on ? '#f8e060' : '#c8d0f0'); if (on && blink(3)) { txt('→', 70, py + 7 + k * 14, '#f8e060'); } });
          if (SV.cup && menu[sel] === 'CONTINUE CUP') { const c = SV.cup; ctr(`${CLASSES[c.cls].name} CUP - RACE ${c.race + 1}: ${TRACKS[c.race].name}`, py + ph + 4, '#a8f0c0'); }
          ctr(`(A) OK   (B) BACK`.replace('(A)', btn('a')).replace('(B)', btn('b')), H - 12, '#a8b0d8');
        }
      }
      function drawClass() {
        dim(0.45);
        art('CHOOSE A CLASS', 2, CHROME, null, 10);
        CLASSES.forEach((c, k) => {
          const y = 40 + k * 50, on = k === clsSel;
          panel(24, y, 208, 42, on ? 0.95 : 0.7);
          if (on) { g.fillStyle = '#f8e060'; g.fillRect(24, y, 208, 1); g.fillRect(24, y + 41, 208, 1); }
          art(c.name, 2, on ? c.col : ['#8890b0', '#5a6080'], 34, y + 6);
          txt(c.desc, 34, y + 25, on ? '#ffffff' : '#8890b0'); txt(c.desc2, 34, y + 33, on ? '#a8f0c0' : '#606880');
          txt('x' + c.mul.toFixed(1) + ' PTS', 172, y + 8, on ? '#f8e060' : '#707890');
          if (SV.gold[c.id]) g.drawImage(trophy('gold'), 200, y + 15, 24, 27);
        });
        ctr('WIN EVERY RACE FOR A PERFECT CUP!', 192, blink(1) ? '#f8e060' : '#c8a840');
        ctr(`↑↓ CHOOSE  ${btn('a')} OK  ${btn('b')} BACK`, H - 12, '#a8b0d8');
      }
      let bigCar = null, bigKey = '';
      function drawCar() {
        dim(0.5);
        const m = MACHINES[csel]; carSpin += 1 / 60;
        art('CHOOSE YOUR MACHINE', 1, GOLD, null, 8);
        // the turntable
        const cx = W / 2, cy = 92;
        g.fillStyle = '#101840'; g.beginPath(); g.ellipse(cx, cy + 8, 70, 16, 0, 0, TAU); g.fill();
        g.fillStyle = '#28388a'; g.beginPath(); g.ellipse(cx, cy + 6, 66, 14, 0, 0, TAU); g.fill();
        g.strokeStyle = '#78a8f8'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy + 6, 66, 14, 0, 0, TAU); g.stroke();
        for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + carSpin * 0.8; g.fillStyle = (k + (K.frame >> 3)) % 3 ? '#3a58c8' : '#a8d0ff'; g.fillRect(cx + Math.cos(a) * 60 - 1, cy + 6 + Math.sin(a) * 12, 2, 1); }
        const yaw = Math.PI * 0.75 + carSpin * 0.9, key = m.id + ':' + Math.round(yaw * 30);
        if (key !== bigKey) { bigKey = key; bigCar = renderCar(m, yaw, 0.42, 0, 4.0, 140, 90, 70, 58); }
        g.drawImage(bigCar, cx - 70, cy - 54 + Math.round(Math.sin(K.t * 3) * 1.5));
        if (blink(2)) { art('<', 2, CHROME, 8, cy - 10); art('>', 2, CHROME, W - 22, cy - 10); }
        art(m.name, 2, [m.trim === '#202028' ? '#fff8c0' : '#ffffff', m.body, shade(m.body, 0.6), m.body], null, 116, 0.15);
        ctr('PILOT: ' + m.pilot, 136, '#c8d0f0');
        panel(30, 148, 196, 50);
        ['SPEED', 'ACCEL', 'GRIP', 'WEIGHT'].forEach((l, k) => { const y = 154 + k * 10; txt(l, 38, y, '#a8b8f0'); for (let j = 0; j < 5; j++) { const on = j < m.stats[[0, 1, 2, 3][k]]; g.fillStyle = '#000010'; g.fillRect(100 + j * 22, y - 1, 20, 8); g.fillStyle = on ? (k === 3 ? '#a8a8c8' : ['#78f878', '#f8d040', '#78c8f8'][k]) : '#262c4a'; g.fillRect(101 + j * 22, y, 18, 6); if (on) { g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(101 + j * 22, y, 18, 2); } } });
        ctr(m.blurb, 202, '#f8e060');
        ctr(`←→ CHOOSE  ${btn('a')} RACE!  ${btn('b')} BACK`, H - 10, '#a8b0d8');
      }
      function drawTrackSel() {
        dim(0.45);
        art('PRACTICE', 2, CHROME, null, 8);
        ctr('RACE DAVE\'S GHOST. BEAT HIS BEST LAP!', 28, '#a8f0c0');
        const t = TRACKS[tsel];
        panel(16, 40, 224, 150);
        art(t.name, 2, tsel === 0 ? CHROME : tsel === 1 ? MINT : tsel === 2 ? FIRE : PINK, null, 48);
        ctr(t.sub, 68, '#c8d0f0');
        drawMiniOf(tsel, 34, 84);
        txt('BEST LAPS', 120, 84, '#f8e060');
        recs(tsel).forEach((r, k) => { txt(`${k + 1} ${r[1].padEnd(4, ' ')}`, 120, 96 + k * 11, r[1] === SV.ini ? '#78f0a8' : '#ffffff'); txt(fmt(r[0]), 178, 96 + k * 11, '#c8d0f0'); });
        if (t.id === 'port') ctr(SV.jumped ? 'YOU FOUND THE BIG JUMP!' : 'TIP: THAT BLUE RAMP LOOKS SNEAKY...', 172, SV.jumped ? '#78f0a8' : '#f8b0e0');
        if (blink(2)) { art('<', 2, CHROME, 2, 106); art('>', 2, CHROME, W - 16, 106); }
        ctr(`←→ TRACK  ${btn('a')} OK  ${btn('b')} BACK`, H - 12, '#a8b0d8');
      }
      const miniCache = {};
      function drawMiniOf(i, x, y) {
        if (!miniCache[i]) {
          const G = geom(TRACKS[i]), c = canvas(76, 76), m = c.getContext('2d'), [a, b, cc, d] = G.bbox, s = 66 / Math.max(cc - a, d - b), ox = 38 - (a + cc) / 2 * s, oy = 38 - (b + d) / 2 * s;
          const path = (w, col) => { m.strokeStyle = col; m.lineWidth = w; m.lineJoin = 'round'; m.beginPath(); for (let k = 0; k <= G.N; k += 3) { const q = k % G.N; if (k) m.lineTo(G.X[q] * s + ox, G.Y[q] * s + oy); else m.moveTo(G.X[q] * s + ox, G.Y[q] * s + oy); } m.closePath(); m.stroke(); };
          path(7, '#000018'); path(5, '#5868a8'); path(2, '#ffffff'); crisp(c, null);
          m.fillStyle = '#f8e060'; m.fillRect(G.X[0] * s + ox - 2, G.Y[0] * s + oy - 2, 5, 5);
          miniCache[i] = c;
        }
        g.drawImage(miniCache[i], x, y);
      }
      function drawRecords() {
        dim(0.5);
        art('RECORDS', 2, GOLD, null, 8);
        panel(24, 32, 208, 168);
        if (recPage < TRACKS.length) {
          const t = TRACKS[recPage]; art(t.name, 1, CHROME, null, 40); ctr('BEST LAPS', 54, '#a8b8f0');
          recs(recPage).forEach((r, k) => { const y = 72 + k * 18; num(String(k + 1), 2, k === 0 ? GOLD : CHROME, 40, y - 5); txt(r[1], 70, y, r[1] === SV.ini ? '#78f0a8' : '#ffffff', 1); txt(fmt(r[0]), 150, y, '#f8e060'); });
        } else {
          art('CUP SCORES', 1, CHROME, null, 40); ctr('THE NULL CUP', 54, '#a8b8f0');
          SV.cups.forEach((r, k) => { const y = 66 + k * 15; num(String(k + 1), 1, k === 0 ? GOLD : CHROME, 44, y - 1); txt(r[1], 70, y, r[1] === SV.ini ? '#78f0a8' : '#ffffff'); txt(String(r[0]).padStart(6, ' '), 150, y, '#f8e060'); });
          let x = 60; CLASSES.forEach(c => { if (!SV.gold[c.id]) g.globalAlpha = 0.2; g.drawImage(trophy('gold'), x - 12, 142, 24, 27); g.globalAlpha = 1; F.center(g, c.name, x, 171, SV.gold[c.id] ? '#f8e060' : '#505878', 1); x += 68; });
        }
        ctr(`PAGE ${recPage + 1}/${TRACKS.length + 1}`, 189, '#707898');
        ctr(`←→ PAGE  ${btn('b')} BACK`, H - 12, '#a8b0d8');
      }
      function drawName() {
        dim(0.55);
        const n = nameE;
        art(n.kind === 'lap' ? 'NEW BEST LAP!' : 'HIGH SCORE!', 2, GOLD, null, 30);
        ctr('ENTER YOUR NAME', 56, '#c8d0f0');
        panel(68, 72, 120, 52);
        for (let k = 0; k < 3; k++) { const x = 84 + k * 32; if (k === n.at) { g.fillStyle = blink(3) ? '#f8e060' : '#806820'; g.fillRect(x - 2, 112, 24, 2); txt('↑', x + 7, 76, '#a8b0d8'); } art(n.l[k] === ' ' ? '_' : n.l[k], 3, k === n.at ? GOLD : CHROME, x, 84); }
        ctr(`↑↓ LETTER  ←→ MOVE  ${btn('a')} OK`, 136, '#a8b0d8');
      }
      function drawIntro(t) {
        const d = T.def, k = mt;
        if (k > 0.2) { const a = clamp((k - 0.2) * 4, 0, 1); g.globalAlpha = a; panel(-2, 30, W + 4, 54, 0.75); g.globalAlpha = 1; }
        const sx = clamp((k - 0.2) * 900, 0, 9999);
        const c = textArt(F, d.name, 3, CHROME, '#08081a', 0.2); g.drawImage(c, Math.round(Math.min(W / 2 - c.width / 2, -c.width + sx)), 38);
        if (k > 0.6) ctr(d.sub, 70, '#f8e060');
        if (R.kind === 'gp') { art(`RACE ${cup.race + 1} OF ${TRACKS.length}`, 1, GOLD, null, 16); txt(CLASSES[cup.cls].name + ' CLASS', 6, H - 30, '#a8b8f0'); txt('SPARE CARS: ' + cup.spares, 6, H - 20, '#a8f0c0'); }
        else art('PRACTICE', 1, MINT, null, 16);
        if (k > 1) { const tip = R.kind === 'practice' && d.id === 'port' && !SV.jumped ? 'JACK\'S TIP: DASH INTO THE BLUE RAMP!' : `HOLD ${btn('a')} TO GO  ${btn('b')} BRAKE  ${btn('l')}${btn('r')} LEAN`; panel(8, 160, 240, 18, 0.7); ctr(tip, 165, '#ffffff'); }
        if (k > 0.6 && blink(2)) ctr(`${btn('a')} SKIP`, H - 10, '#a8b0d8');
      }
      function drawLights() {
        const n = Math.ceil(R.cd), x0 = W / 2 - 36, y0 = 40;
        panel(x0 - 6, y0 - 6, 84, 28, 0.85);
        for (let k = 0; k < 3; k++) { const on = n <= 3 - k + 0 && n <= 3 && R.cd < 3, lit = 3 - n >= k; const cx = x0 + 6 + k * 26, cy = y0 + 8; g.fillStyle = '#000'; g.beginPath(); g.arc(cx + 6, cy, 9, 0, TAU); g.fill(); g.fillStyle = lit && R.cd < 3 ? '#f83020' : '#401010'; g.beginPath(); g.arc(cx + 6, cy, 7, 0, TAU); g.fill(); if (lit && R.cd < 3) { g.fillStyle = '#f8a080'; g.fillRect(cx + 3, cy - 4, 3, 2); } }
        if (R.cd < 3 && R.cd > 0) { const c = textArt(F, String(n), 5, CHROME, '#08081a', 0.15), f = R.cd % 1, z = 1 + Math.max(0, f - 0.7) * 2; g.drawImage(c, Math.round(W / 2 - c.width * z / 2), Math.round(96 - c.height * z / 2), Math.round(c.width * z), Math.round(c.height * z)); }
        ctr(`HOLD ${btn('a')} TO GO!`, 150, blink(3) ? '#ffffff' : '#a8b0d8');
      }
      function drawPause() {
        dim(0.5);
        art('PAUSED', 3, CHROME, null, 48);
        const o = pauseOpts(); panel(48, 84, 160, 52);
        o.forEach((it, k) => { const on = k === psel; ctr(it.t, 92 + k * 14, !it.ok ? '#606880' : on ? '#f8e060' : '#c8d0f0'); if (on && blink(3)) txt('→', 54, 92 + k * 14, '#f8e060'); });
        ctr(`PRESS START TO CARRY ON`, 150, '#a8b0d8');
        if (R.kind === 'gp') ctr(`SPARE CARS: ${cup.spares}`, 164, '#a8f0c0');
      }
      function drawResults() {
        dim(0.35);
        art('RACE RESULTS', 2, GOLD, null, 6);
        panel(20, 28, 216, 116);
        R.gained.forEach(([c, p], k) => { const y = 34 + k * 13, me = c === R.me; if (me) { g.fillStyle = 'rgba(248,224,96,.18)'; g.fillRect(22, y - 2, 212, 12); } txt(ORD[k], 26, y, k === 0 ? '#f8e060' : '#c8d0f0'); chip(56, y, c.def.body); txt(me ? 'YOU (' + c.def.name.split(' ')[1] + ')' : c.name, 70, y, me ? '#f8e060' : '#ffffff'); txt(c.fin ? fmt(c.fin) : '--', 156, y, '#a8b8f0'); if (mt > 0.3 + k * 0.08) txt('+' + p, 212, y, '#78f0a8'); });
        const sc = R.score; panel(20, 148, 216, 62);
        sc.lines.slice(0, 4).forEach((l, k) => { if (mt > 0.8 + k * 0.25) { txt(l[0], 28, 154 + k * 10, '#c8d0f0'); txt(String(l[1]).padStart(5, ' '), 194, 154 + k * 10, '#ffffff'); } });
        if (mt > 2) { txt('RACE SCORE' + (R.cls.mul !== 1 ? ' x' + R.cls.mul.toFixed(1) : ''), 28, 196, '#f8e060'); txt(String(sc.tot).padStart(5, ' '), 194, 196, '#f8e060'); }
        if (mt > 1 && blink(2)) ctr(`${btn('a')} NEXT`, H - 10, '#a8b0d8');
      }
      function drawStandings() {
        dim(0.45);
        art('CUP STANDINGS', 2, CHROME, null, 6);
        art(`AFTER RACE ${cup.race} OF ${TRACKS.length}`, 1, GOLD, null, 26);
        panel(28, 40, 200, 116);
        standingsList().forEach(([m, p], k) => { const y = 46 + k * 13, me = m === MACHINES[cup.car]; if (me) { g.fillStyle = 'rgba(248,224,96,.18)'; g.fillRect(30, y - 2, 196, 12); } txt(ORD[k], 34, y, k === 0 ? '#f8e060' : '#c8d0f0'); chip(64, y, m.body); txt(me ? 'YOU' : (m.pilot ? m.name.split(' ')[1] : m.name), 78, y, me ? '#f8e060' : '#ffffff'); const w = Math.min(70, p * 1.8); g.fillStyle = me ? '#f8c020' : '#4a68c8'; g.fillRect(136, y + 1, w, 5); txt(String(p), 210, y, '#ffffff'); });
        panel(28, 160, 200, 32); txt('SCORE', 36, 166, '#a8b8f0'); txt(String(cup.score).padStart(6, ' '), 170, 166, '#f8e060'); txt('SPARE CARS ' + cup.spares, 36, 178, '#a8f0c0'); txt(cup.race < TRACKS.length ? 'NEXT: ' + TRACKS[cup.race].name.split(' ')[0] : 'FINAL!', 132, 178, '#ffffff');
        if (mt > 1 && blink(2)) ctr(`${btn('a')} ${cup.race < TRACKS.length ? 'NEXT RACE' : 'THE CEREMONY'}`, H - 12, '#a8b0d8');
      }
      function drawPracticeEnd() {
        dim(0.4);
        const me = R.me, sc = R.score;
        art(sc.failed ? 'OUT OF POWER' : 'PRACTICE OVER', 2, sc.failed ? FIRE : CHROME, null, 20);
        panel(40, 50, 176, 100);
        me.laps.forEach((t, k) => { txt('LAP ' + (k + 1), 52, 60 + k * 12, '#a8b8f0'); txt(fmt(t), 120, 60 + k * 12, t === me.best ? '#78f0a8' : '#ffffff'); });
        txt('BEST LAP', 52, 104, '#f8e060'); txt(me.best ? fmt(me.best) : '--', 120, 104, '#f8e060');
        const dave = (recs(R.ti).find(r => r[1] === 'DAVE') || [0])[0];
        if (me.best && dave) txt(me.best < dave ? 'YOU BEAT DAVE!' : 'DAVE WINS THIS TIME', 52, 120, me.best < dave ? '#78f0a8' : '#f8b0e0');
        if (me.bigAir) txt('BIG AIR x' + me.bigAir + '!', 52, 132, '#78f0a8');
        if (mt > 1 && blink(2)) ctr(`${btn('a')} OK`, H - 12, '#a8b0d8');
      }
      function drawOutCard() {
        g.fillStyle = '#060818'; g.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 4) { g.fillStyle = '#0c1030'; g.fillRect(0, y, W, 2); }
        art(outInfo ? outInfo.title : 'OUT', 3, FIRE, null, 44);
        if (outInfo) ctr(outInfo.text, 84, '#ffffff');
        const sp = cup ? cup.spares : 0;
        ctr(sp >= 0 ? 'SPARE CARS LEFT: ' + sp : 'NO SPARE CARS LEFT!', 110, sp >= 0 ? '#a8f0c0' : '#f86060');
        for (let k = 0; k < Math.max(0, sp); k++) g.drawImage(R.me.spr.near[0], W / 2 - Math.max(0, sp) * 22 + k * 44 + 2, 120, 40, 28);
        if (mt > 1 && blink(2)) ctr(sp >= 0 ? `${btn('a')} TRY AGAIN` : `${btn('a')} OK`, 170, '#f8e060');
      }
      let podCar = null, podKey = '';
      function drawEnd() {
        g.fillStyle = '#060818'; g.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 2) { g.fillStyle = y < 120 ? mix('#0a0a2a', '#1a1040', y / 120) : '#0c0c24'; g.fillRect(0, y, W, 2); }
        const tl = tally;
        // spotlights
        for (let k = 0; k < 2; k++) { const sx = k ? W - 30 : 30, a = Math.sin(K.t * 0.8 + k * 2) * 40; g.globalAlpha = 0.07; g.fillStyle = '#d8e0ff'; g.beginPath(); g.moveTo(sx, 0); g.lineTo(W / 2 + a - 50, 160); g.lineTo(W / 2 + a + 50, 160); g.fill(); g.globalAlpha = 1; }
        if (tl.over) { art('GAME OVER', 3, FIRE, null, 46); ctr('OUT OF SPARE CARS', 82, '#ffffff'); ctr('PRACTICE MAKES PERFECT!', 96, '#a8b0d8'); }
        else {
          const kind = tl.pos === 1 ? 'gold' : tl.pos === 2 ? 'silver' : tl.pos === 3 ? 'bronze' : null;
          if (kind) { const tr = trophy(kind), bob = Math.round(Math.sin(K.t * 2) * 1.5); g.drawImage(tr, W / 2 - 32, 6 + bob); for (let k = 0; k < 6; k++) { const ph = (K.t * 1.7 + k * 0.37) % 1, a = k * 1.9; if (ph < 0.35) { const x = W / 2 + Math.cos(a) * 24, y = 26 + Math.sin(a) * 16, r = ph < 0.17 ? 2 : 1; g.fillStyle = '#ffffff'; g.fillRect(x - r, y, r * 2 + 1, 1); g.fillRect(x, y - r, 1, r * 2 + 1); } } }
          art(tl.pos === 1 ? 'CHAMPION!' : tl.pos <= 3 ? ORD[tl.pos - 1] + ' OVERALL' : 'CUP COMPLETE', 2, tl.pos === 1 ? GOLD : CHROME, null, kind ? 80 : 46);
          ctr(tl.pos === 1 ? 'THE GOLD NULL CUP IS YOURS!' : tl.pos === 2 ? 'A SHINY SILVER CUP!' : tl.pos === 3 ? 'A BRONZE CUP. NOT BAD!' : `YOU CAME ${ORD[tl.pos - 1]}. HAVE ANOTHER GO!`, kind ? 100 : 66, '#ffffff');
          if (tl.perfect) ctr('WON EVERY RACE: PERFECT!', 110, blink(3) ? '#78f0a8' : '#f8e060');
        }
        // your car on the podium, turning slowly
        const m = MACHINES[cup ? cup.car : 0], key = m.id + Math.round(K.t * 20);
        if (key !== podKey) { podKey = key; podCar = renderCar(m, K.t * 0.9, 0.38, 0, 2.6, 96, 60, 48, 40); }
        g.fillStyle = '#20286a'; g.fillRect(W / 2 - 40, 150, 80, 14); g.fillStyle = '#3848a8'; g.fillRect(W / 2 - 40, 150, 80, 2); g.fillStyle = '#101440'; g.fillRect(W / 2 - 40, 162, 80, 2);
        g.fillStyle = '#2a3488'; g.beginPath(); g.ellipse(W / 2, 150, 40, 6, 0, 0, TAU); g.fill(); g.fillStyle = '#5868c8'; g.beginPath(); g.ellipse(W / 2, 149, 38, 5, 0, 0, TAU); g.fill();
        if (!tl.over) F.center(g, tl.pos <= 3 ? String(tl.pos) : '', W / 2, 154, '#f8e060', 1);
        g.drawImage(podCar, W / 2 - 48, 112 + Math.round(Math.sin(K.t * 3)));
        panel(36, 168, 184, 42);
        txt('RACE SCORES', 46, 174, '#a8b8f0'); txt(String(tl.base).padStart(6, ' '), 170, 174);
        txt('CUP BONUS', 46, 184, '#a8b8f0'); txt(String(tl.bonus).padStart(6, ' '), 170, 184);
        txt('TOTAL', 46, 197, '#f8e060'); num(String(tl.total).padStart(6, ' '), 1, GOLD, 170, 195);
        for (const p of confetti) { g.fillStyle = p[4]; g.fillRect(p[0] | 0, p[1] | 0, 2, Math.sin(p[3] + K.t * 6) > 0 ? 3 : 1); }
        if (mode !== 'reported' && mt > 2 && blink(2)) ctr(`${btn('a')} OK`, H - 10, '#a8b0d8');
      }

      // ------------------------------------------------------------ start up
      goTitle();
      K.dbg = {
        get mode() { return mode; }, get R() { return R; }, get T() { return T; }, get cup() { return cup; }, SV, cam, inp, CLASSES,
        state: () => R && R.me ? { mode, t: +R.t.toFixed(2), lap: R.me.lapMax, s: Math.round(R.me.s), lat: Math.round(R.me.lat), place: R.me.place, energy: Math.round(R.me.energy), v: Math.round(R.me.v), fin: R.me.fin, laps: R.me.laps.map(x => +x.toFixed(2)), cup: cup && { race: cup.race, score: cup.score, spares: cup.spares } } : { mode },
        auto(on, k) { if (R && R.me) { R.me.auto = !!on; R.me.autoK = k || 1.05; R.me.autoBoost = true; } },
        race(ti, kind, cls, car) { if (kind === 'gp') { cup = { cls: cls || 1, car: car || 0, race: ti, pts: {}, spares: 3, score: 0, wins: 0, res: [] }; for (const m of MACHINES.concat(PACK)) cup.pts[m.id] = 0; } else { cup = null; tsel = ti; csel = car || 0; } intro(); countdown(); R.cd = 0.01; },
        tp(s, lat) { const me = R.me; put(me, s, lat || 0); me.vx = Math.cos(me.a) * 300; me.vy = Math.sin(me.a) * 300; me.i = idxOf(s); },
        go: m => { mode = m; mt = 0; },
        bench() { let t0 = performance.now(); for (let i = 0; i < 30; i++) draw(); const d = (performance.now() - t0) / 30; t0 = performance.now(); for (let i = 0; i < 60; i++) update(1 / 60); return [+d.toFixed(2), +((performance.now() - t0) / 60).toFixed(3)]; },
        near(lap, back) { const me = R.me, L = T.G.L; for (const c of R.cars) { if (c === me) continue; c.s = lap * L - (back || 300) - 60 - rnd() * 400; c.lapMax = lap - 1; } put(me, lap * L - (back || 300), 0); me.lapMax = lap - 1; me.vx = Math.cos(me.a) * 300; me.vy = Math.sin(me.a) * 300; },
      };
      return { update, draw, end() { music(null); T = null; R = null; } };
    },
  });
})();

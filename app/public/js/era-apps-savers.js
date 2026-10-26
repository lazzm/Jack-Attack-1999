/* era-apps-savers: two screen savers for the ERA SOFTWARE pack (lazy loaded by era-apps.js).
 * 3D Jack Maze: a raycast brick maze with a smiley at the end, spinning robot heads that turn the world upside down
 *   and Blobbits scurrying about (our take on the famous OpenGL maze). (cfg keys grot/squigs kept for saved settings.)
 * Jack Island: Zib, a castaway little green alien (drawGrot) on a desert island who lives by YOUR clock and the 1999 calendar.
 * Both are factories(g, W, H, o) -> { frame(dt, t), stop() }, drawn live on canvas. No images, no libraries. */
(function () {
  'use strict';
  const E = window.Era; if (!E) return;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  const u32 = c => new Uint32Array(c.getContext('2d').getImageData(0, 0, c.width, c.height).data.buffer);
  const rgb = (r, g, b) => (255 << 24 | clamp(b | 0, 0, 255) << 16 | clamp(g | 0, 0, 255) << 8 | clamp(r | 0, 0, 255)) >>> 0;
  // paint a 64x64 texture pixel by pixel: fn(x, y) -> [r, g, b]
  function paint(n, fn) {
    const c = cnv(n), x2 = c.getContext('2d'), img = x2.createImageData(n, n), d = img.data;
    for (let y = 0, p = 0; y < n; y++) for (let x = 0; x < n; x++, p += 4) { const v = fn(x, y); d[p] = v[0]; d[p + 1] = v[1]; d[p + 2] = v[2]; d[p + 3] = 255; }
    x2.putImageData(img, 0, 0); return c;
  }
  const hash = (a, b) => { let x = Math.imul(a * 374761393 + b * 668265263, 1274126177); x ^= x >>> 13; x = Math.imul(x, 1103515245); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

  // ======================================================================================== 3D JACK MAZE
  const TEXCACHE = {};
  function wallTex(kind) {
    if (TEXCACHE['w' + kind]) return TEXCACHE['w' + kind];
    const R = E.rng('wall' + kind);
    const nz = () => (R() - 0.5);
    let c;
    if (kind === 'stone') c = paint(64, (x, y) => {
      const row = y >> 4, off = [0, 9, 21, 5][row & 3], bx = (x + off) % 21, id = Math.floor((x + off) / 21) + row * 9;
      if ((y & 15) < 2 || bx < 2) return [70 + nz() * 20, 70 + nz() * 20, 72 + nz() * 20];
      const b = 110 + hash(id, 3) * 50 + nz() * 26, e = (y & 15) === 2 || bx === 2 ? 22 : (y & 15) === 15 ? -20 : 0;
      return [b + e, b + e - 2, b + e + 4];
    });
    else if (kind === 'wood') c = paint(64, (x, y) => {
      const pl = x >> 4, xx = x & 15, k = hash(pl, 7);
      if (xx === 0) return [40, 22, 10];
      const gr = Math.sin((y * 0.35 + Math.sin(xx * 0.6 + pl * 3) * 2.2 + k * 20)) * 14;
      const nail = (y === 4 || y === 59) && xx === 8 ? 80 : 0;
      return [122 + gr + k * 30 + nail + nz() * 8, 76 + gr * 0.7 + k * 16 + nail + nz() * 6, 38 + gr * 0.4 + nail];
    });
    else if (kind === 'ork') c = paint(64, (x, y) => {
      const px = x >> 5, py = y >> 5, xx = x & 31, yy = y & 31, id = px + py * 2;
      if (xx === 0 || yy === 0) return [30, 26, 22];
      const rv = ((xx - 4) ** 2 + (yy - 4) ** 2 < 4) || ((xx - 27) ** 2 + (yy - 4) ** 2 < 4) || ((xx - 4) ** 2 + (yy - 27) ** 2 < 4) || ((xx - 27) ** 2 + (yy - 27) ** 2 < 4);
      if (rv) return [190, 180, 160];
      if (id === 1 && yy > 20) return ((xx + yy) >> 2) & 1 ? [230, 190, 20] : [25, 25, 25];
      const rust = clamp(hash(x >> 2, y >> 2) * 1.4 - 0.3 + Math.sin(x * 0.3 + y * 0.2) * 0.15, 0, 1);
      const base = [96 + id * 10, 96 + id * 6, 92];
      return [lerp(base[0], 150, rust) + nz() * 14, lerp(base[1], 70, rust) + nz() * 10, lerp(base[2], 30, rust) + nz() * 8];
    });
    else c = paint(64, (x, y) => { // red brick
      const row = y >> 4, yy = y & 15, off = (row & 1) * 16, bx = (x + off) & 31, id = ((x + off) >> 5) + row * 7;
      if (yy < 2 || bx < 2) return [150 + nz() * 26, 142 + nz() * 22, 128 + nz() * 20];
      const k = hash(id, row), e = yy === 2 || bx === 2 ? 26 : yy === 15 || bx === 31 ? -26 : 0;
      return [136 + k * 46 + e + nz() * 24, 48 + k * 18 + e * 0.5 + nz() * 12, 30 + k * 10 + e * 0.4 + nz() * 10];
    });
    return (TEXCACHE['w' + kind] = c);
  }
  // signs on some walls: the OpenJack sign and a JackOS 98 poster
  function signTex(kind, which) {
    const key = 's' + kind + which; if (TEXCACHE[key]) return TEXCACHE[key];
    const c = cnv(64), x = c.getContext('2d');
    x.drawImage(wallTex(kind), 0, 0);
    if (which === 0) {
      x.fillStyle = '#222'; x.fillRect(7, 15, 50, 34); x.fillStyle = '#f4f4f0'; x.fillRect(9, 17, 46, 30);
      x.fillStyle = '#1040c0'; x.font = 'bold 13px Arial,sans-serif'; x.textAlign = 'center'; x.fillText('Open', 32, 30);
      x.fillStyle = '#e10600'; x.fillText('JACK', 32, 43);
      x.fillStyle = '#5aac2c'; x.fillRect(48, 18, 6, 6);
    } else {
      x.fillStyle = '#000'; x.fillRect(10, 8, 44, 48); x.fillStyle = '#008080'; x.fillRect(12, 10, 40, 44);
      const cs = ['#e10600', '#1aa31a', '#1040c0', '#ffd400'];
      for (let i = 0; i < 4; i++) { x.fillStyle = cs[i]; x.fillRect(20 + (i & 1) * 12, 14 + (i >> 1) * 11 + (i & 1 ? 2 : 0), 11, 10); }
      x.fillStyle = '#fff'; x.font = 'bold 10px Arial,sans-serif'; x.textAlign = 'center'; x.fillText('JackOS', 32, 46);
      x.fillStyle = '#ff7a00'; x.font = 'bold italic 8px Arial,sans-serif'; x.fillText('98', 32, 53);
    }
    return (TEXCACHE[key] = c);
  }
  function flatTex(kind, ceiling) {
    const key = (ceiling ? 'c' : 'f') + kind; if (TEXCACHE[key]) return TEXCACHE[key];
    const R = E.rng(key), nz = () => R() - 0.5;
    let c;
    if (kind === 'carpet') c = paint(64, (x, y) => { const d = ((x >> 3) + (y >> 3)) & 1, s = Math.sin(x * 0.8) * Math.sin(y * 0.8) > 0.6 ? 30 : 0; return [130 + d * 14 + s + nz() * 26, 20 + nz() * 10 + s * 0.6, 30 + nz() * 10]; });
    else if (kind === 'grass') c = paint(64, (x, y) => { const v = nz() * 50 + Math.sin(x * 1.3 + y * 0.4) * 10; return [40 + v * 0.4, 110 + v, 30 + v * 0.3]; });
    else if (kind === 'sky') c = paint(64, (x, y) => R() < 0.02 ? [230, 230, 255] : [8 + nz() * 6, 10 + nz() * 6, 40 + nz() * 10]);
    else if (kind === 'wood') c = paint(64, (x, y) => { const beam = (y & 31) < 8; const gr = Math.sin(x * 0.4 + Math.sin(y) * 2) * 10; return beam ? [70 + gr, 40 + gr * 0.6, 18] : [110 + gr + nz() * 10, 72 + gr * 0.6, 36]; });
    else c = paint(64, (x, y) => { // grey tiles
      const g2 = (x & 31) < 2 || (y & 31) < 2, b = ceiling ? 168 : 120, k = hash((x >> 5) + (ceiling ? 9 : 0), y >> 5) * 16;
      if (g2) return [b - 50, b - 50, b - 46];
      const v = b + k + nz() * 18; return [v, v, v + 4];
    });
    return (TEXCACHE[key] = c);
  }
  function floorMark(text, col) {
    const key = 'm' + text; if (TEXCACHE[key]) return TEXCACHE[key];
    const c = cnv(64), x = c.getContext('2d'); x.drawImage(flatTex('grey'), 0, 0);
    if (text === 'END') { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) & 1 ? '#111' : '#eee'; x.fillRect(i * 8, j * 8, 8, 8); } }
    else { x.fillStyle = col; x.fillRect(4, 22, 56, 20); x.fillStyle = '#fff'; x.font = 'bold 14px Arial,sans-serif'; x.textAlign = 'center'; x.fillText(text, 32, 37); }
    return (TEXCACHE[key] = c);
  }
  // sprites (drawn once into little canvases, then read as pixels)
  function spr(n, draw) { const c = cnv(n), x = c.getContext('2d'); draw(x, n); return { w: n, h: n, px: u32(c) }; }
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    // a silver robot head (antenna, square glowing eyes, grille mouth, ear bolts); back = the panel and screws behind
    const head = back => (x, n) => {
      x.lineJoin = 'round';
      x.strokeStyle = '#1a1e2a'; x.lineWidth = 2; x.beginPath(); x.moveTo(32, 12); x.lineTo(32, 4); x.stroke();
      x.fillStyle = '#ff3020'; x.beginPath(); x.arc(32, 4, 3.5, 0, TAU); x.fill(); x.stroke(); x.fillStyle = '#ffb0a0'; x.fillRect(30, 2, 2, 2);
      // ear bolts
      x.fillStyle = '#8a92a4'; x.lineWidth = 1.5; x.beginPath(); x.rect(5, 28, 7, 14); x.rect(52, 28, 7, 14); x.fill(); x.stroke();
      const gr = x.createLinearGradient(12, 12, 54, 58); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#c8d0dc'); gr.addColorStop(1, '#5a6272');
      x.fillStyle = gr; x.beginPath(); x.moveTo(17, 12); x.lineTo(47, 12); x.quadraticCurveTo(53, 12, 53, 18); x.lineTo(53, 54); x.quadraticCurveTo(53, 60, 47, 60); x.lineTo(17, 60); x.quadraticCurveTo(11, 60, 11, 54); x.lineTo(11, 18); x.quadraticCurveTo(11, 12, 17, 12); x.fill(); x.stroke();
      x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(15, 15, 14, 3);
      x.fillStyle = '#5a6272'; [[15, 16], [49, 16], [15, 56], [49, 56]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 1.6, 0, TAU); x.fill(); });
      if (back) { x.fillStyle = '#9aa2b2'; x.strokeStyle = '#3a4252'; x.lineWidth = 1.5; x.beginPath(); x.rect(20, 24, 24, 22); x.fill(); x.stroke(); x.fillStyle = '#3a4252'; for (let i = 0; i < 4; i++) x.fillRect(24, 29 + i * 4, 16, 2); [[22, 26], [42, 26], [22, 44], [42, 44]].forEach(([a, b]) => x.fillRect(a - 1, b - 1, 2, 2)); return; }
      // visor + eyes
      x.fillStyle = '#10141c'; x.beginPath(); x.rect(16, 22, 32, 15); x.fill();
      x.fillStyle = '#40e0ff'; x.fillRect(20, 25, 9, 9); x.fillRect(35, 25, 9, 9); x.fillStyle = '#d0ffff'; x.fillRect(21, 26, 3, 3); x.fillRect(36, 26, 3, 3);
      // grille mouth
      x.fillStyle = '#10141c'; x.beginPath(); x.rect(20, 44, 24, 9); x.fill(); x.fillStyle = '#9aa2b2'; for (let i = 0; i < 5; i++) x.fillRect(22 + i * 4.4, 45, 2, 7);
    };
    // a scurrying Blobbit: round pink critter, little round ears, big eyes, happy open mouth; f = which foot is down
    const squig = f => (x, n) => {
      x.lineJoin = 'round'; x.strokeStyle = '#6a0a3a'; x.lineWidth = 2;
      x.fillStyle = '#c8287a'; x.beginPath(); x.ellipse(20, 56 - (f ? 0 : 3), 7, 4, 0, 0, TAU); x.fill(); x.stroke(); x.beginPath(); x.ellipse(44, 56 - (f ? 3 : 0), 7, 4, 0, 0, TAU); x.fill(); x.stroke();
      x.fillStyle = '#e8489a'; [[16, 18], [48, 18]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 7, 0, TAU); x.fill(); x.stroke(); });
      x.fillStyle = '#ffc8e0'; [[16, 18], [48, 18]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 3.2, 0, TAU); x.fill(); });
      const gr = x.createRadialGradient(24, 26, 3, 32, 36, 25); gr.addColorStop(0, '#ffc0e0'); gr.addColorStop(0.5, '#f0509c'); gr.addColorStop(1, '#a01860');
      x.fillStyle = gr; x.beginPath(); x.ellipse(32, 36, 23, 19, 0, 0, TAU); x.fill(); x.stroke();
      x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.ellipse(21, 24, 5, 2.6, -0.6, 0, TAU); x.fill();
      x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(25, 32, 5.5, 6.5, 0, 0, TAU); x.fill(); x.stroke(); x.beginPath(); x.ellipse(39, 32, 5.5, 6.5, 0, 0, TAU); x.fill(); x.stroke();
      x.fillStyle = '#000'; x.beginPath(); x.arc(26.5, 33, 2.8, 0, TAU); x.arc(40.5, 33, 2.8, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.fillRect(26, 31, 1.6, 1.6); x.fillRect(40, 31, 1.6, 1.6);
      x.fillStyle = 'rgba(255,60,120,.7)'; x.beginPath(); x.ellipse(16, 40, 3.5, 2.2, 0, 0, TAU); x.ellipse(48, 40, 3.5, 2.2, 0, 0, TAU); x.fill();
      x.fillStyle = '#5a0a20'; x.beginPath(); x.moveTo(26, 42); x.quadraticCurveTo(32, 51, 38, 42); x.closePath(); x.fill(); x.fillStyle = '#ff7a9a'; x.beginPath(); x.ellipse(32, 46, 3, 1.6, 0, 0, TAU); x.fill();
    };
    SPR = {
      head: spr(64, head(false)), back: spr(64, head(true)),
      sq0: spr(64, squig(0)), sq1: spr(64, squig(1)),
      smile: spr(64, (x) => {
        const gr = x.createRadialGradient(24, 22, 4, 32, 32, 30); gr.addColorStop(0, '#fff8a0'); gr.addColorStop(0.5, '#ffd400'); gr.addColorStop(1, '#c89000');
        x.fillStyle = gr; x.strokeStyle = '#5a3a00'; x.lineWidth = 2; x.beginPath(); x.arc(32, 32, 29, 0, TAU); x.fill(); x.stroke();
        x.fillStyle = '#000'; x.beginPath(); x.ellipse(22, 24, 4, 7, 0, 0, TAU); x.ellipse(42, 24, 4, 7, 0, 0, TAU); x.fill();
        x.lineWidth = 4; x.beginPath(); x.arc(32, 32, 18, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke();
      }),
    };
    return SPR;
  }

  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  function genMaze(n, R) {
    const T = 2 * n + 1, map = new Uint8Array(T * T).fill(1), seen = new Uint8Array(n * n), st = [[0, 0]];
    seen[0] = 1; map[T + 1] = 0;
    while (st.length) {
      const [cx, cy] = st[st.length - 1], opts = [];
      for (let d = 0; d < 4; d++) { const nx = cx + DIRS[d][0], ny = cy + DIRS[d][1]; if (nx >= 0 && ny >= 0 && nx < n && ny < n && !seen[ny * n + nx]) opts.push(d); }
      if (!opts.length) { st.pop(); continue; }
      const d = opts[Math.floor(R() * opts.length)], nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
      seen[ny * n + nx] = 1; map[(2 * cy + 1 + DIRS[d][1]) * T + 2 * cx + 1 + DIRS[d][0]] = 0; map[(2 * ny + 1) * T + 2 * nx + 1] = 0; st.push([nx, ny]);
    }
    // a few signs on walls that face a corridor
    const signs = Math.max(2, n >> 1);
    for (let k = 0, tries = 0; k < signs && tries < 500; tries++) {
      const x = 1 + Math.floor(R() * (T - 2)), y = 1 + Math.floor(R() * (T - 2));
      if (map[y * T + x] !== 1) continue;
      if (!(map[y * T + x - 1] === 0 || map[y * T + x + 1] === 0 || map[(y - 1) * T + x] === 0 || map[(y + 1) * T + x] === 0)) continue;
      map[y * T + x] = 2 + (k & 1); k++;
    }
    return { n, T, map };
  }

  E.savers.maze = (g, W, H, o) => {
    const cfg = Object.assign({ wall: 'brick', floor: 'grey', ceil: 'grey', size: 'normal', grot: true, squigs: true }, E.store.get('jhp_era_maze', {}) || {});
    const RW0 = o.preview ? Math.min(W, 160) : Math.min(360, W), RK = Math.min(1, Math.sqrt(90000 / (RW0 * RW0 * H / W)));
    const RW = Math.max(40, Math.round(RW0 * RK)), RH = Math.max(20, Math.round(RW * H / W));
    const buf = cnv(RW, RH), bx = buf.getContext('2d'), img = bx.createImageData(RW, RH), PX = new Uint32Array(img.data.buffer);
    const zb = new Float32Array(RW), WH = 0.86;
    const WT = [null, u32(wallTex(cfg.wall)), u32(signTex(cfg.wall, 0)), u32(signTex(cfg.wall, 1))];
    const FT = u32(flatTex(cfg.floor)), CT = u32(flatTex(cfg.ceil, true)), ST = u32(floorMark('START', '#1a8a1a')), XT = u32(floorMark('END'));
    const S = sprites();
    const N = cfg.size === 'small' ? 7 : cfg.size === 'huge' ? 17 : 11;
    let M, cam, task, cell, dir, heads, squigs, exitC, phase, fadeT, roll = 0, rollTo = 0, exits = 0, spin = 0, R, turned = false;
    const open = (cx, cy, d) => M.map[(2 * cy + 1 + DIRS[d][1]) * M.T + 2 * cx + 1 + DIRS[d][0]] === 0;
    const centre = (cx, cy) => [2 * cx + 1.5, 2 * cy + 1.5];
    function build() {
      R = E.rng(Math.random() * 1e9 | 0);
      M = genMaze(N, R);
      cell = [0, 0]; dir = open(0, 0, 0) ? 0 : 1;
      const c = centre(0, 0); cam = { x: c[0], y: c[1], a: dir * Math.PI / 2 };
      exitC = [N - 1, N - 1]; task = null; turned = false; phase = 'run'; fadeT = 0; roll = rollTo = 0;
      heads = []; squigs = [];
      const cells = N * N;
      if (cfg.grot) for (let i = 0; i < Math.max(2, cells / 16 | 0); i++) { const cx = Math.floor(R() * N), cy = Math.floor(R() * N); if (cx + cy < 2 || (cx === N - 1 && cy === N - 1)) continue; const p = centre(cx, cy); heads.push({ x: p[0], y: p[1], ph: R() * TAU }); }
      // put one of each near the start so you see them straight away (where the right-hand rule will go)
      const path = []; { let c = [0, 0], d = dir; for (let k = 0; k < 12 && path.length < 6; k++) { for (const nd of [(d + 1) & 3, d, (d + 3) & 3, (d + 2) & 3]) if (open(c[0], c[1], nd)) { d = nd; break; } c = [c[0] + DIRS[d][0], c[1] + DIRS[d][1]]; path.push(c); } }
      if (cfg.grot && path[2]) { const p = centre(path[2][0], path[2][1]); heads.push({ x: p[0], y: p[1], ph: 0 }); }
      if (cfg.squigs && path[1]) { const p = centre(path[1][0], path[1][1]); squigs.push({ c: path[1], to: null, x: p[0], y: p[1], t: 0, ph: 1, last: -1 }); }
      if (cfg.squigs) for (let i = 0; i < Math.max(2, cells / 14 | 0); i++) { const cx = Math.floor(R() * N), cy = Math.floor(R() * N); const p = centre(cx, cy); squigs.push({ c: [cx, cy], to: null, x: p[0], y: p[1], t: 0, ph: R() * 10, last: -1 }); }
    }
    build();
    // wall-following (keep your right hand on the wall): always gets there in a perfect maze
    function nextTask() {
      for (const nd of turned ? [dir] : [(dir + 1) & 3, dir, (dir + 3) & 3, (dir + 2) & 3]) {
        if (!open(cell[0], cell[1], nd)) continue;
        turned = nd !== dir;
        if (nd !== dir) { const delta = nd === ((dir + 1) & 3) ? Math.PI / 2 : nd === ((dir + 3) & 3) ? -Math.PI / 2 : Math.PI; dir = nd; return { k: 'turn', a0: cam.a, a1: cam.a + delta, t: 0, d: Math.abs(delta) > 2 ? 0.95 : 0.55 }; }
        const nx = cell[0] + DIRS[dir][0], ny = cell[1] + DIRS[dir][1], to = centre(nx, ny), atExit = nx === exitC[0] && ny === exitC[1];
        cell = [nx, ny];
        return { k: 'move', x0: cam.x, y0: cam.y, x1: atExit ? lerp(cam.x, to[0], 0.62) : to[0], y1: atExit ? lerp(cam.y, to[1], 0.62) : to[1], t: 0, d: atExit ? 0.8 : 0.78, exit: atExit };
      }
      return null;
    }
    function update(dt) {
      spin += dt * 2.4;
      roll += clamp(rollTo - roll, -dt * 2.6, dt * 2.6);
      if (phase === 'fade') { fadeT += dt; if (fadeT > 1.6) build(); return; }
      if (!task) task = nextTask();
      if (task) {
        task.t += dt / task.d;
        const k = Math.min(1, task.t);
        if (task.k === 'turn') cam.a = lerp(task.a0, task.a1, ease(k));
        else { cam.x = lerp(task.x0, task.x1, k); cam.y = lerp(task.y0, task.y1, k); }
        if (task.t >= 1) {
          if (task.exit) { phase = 'fade'; fadeT = 0; exits++; if (o.full && exits === 1) E.secret('maze.exit'); }
          task = null;
        }
      }
      for (let i = heads.length - 1; i >= 0; i--) if (Math.hypot(heads[i].x - cam.x, heads[i].y - cam.y) < 0.55) { heads.splice(i, 1); rollTo = rollTo ? 0 : Math.PI; }
      for (const s of squigs) {
        if (!s.to) {
          const opts = []; for (let d = 0; d < 4; d++) if (open(s.c[0], s.c[1], d) && d !== s.last) opts.push(d);
          const d = opts.length ? opts[Math.floor(Math.random() * opts.length)] : (s.last + 2) & 3;
          s.d = d; s.last = (d + 2) & 3; s.to = [s.c[0] + DIRS[d][0], s.c[1] + DIRS[d][1]]; s.t = 0;
        }
        s.t += dt * 1.25;
        const a = centre(s.c[0], s.c[1]), b = centre(s.to[0], s.to[1]);
        s.x = lerp(a[0], b[0], Math.min(1, s.t)); s.y = lerp(a[1], b[1], Math.min(1, s.t));
        if (s.t >= 1) { s.c = s.to; s.to = null; }
      }
    }
    const shade = (c, s) => (0xff000000 | ((((c >>> 16) & 255) * s >> 8) << 16) | ((((c >>> 8) & 255) * s >> 8) << 8) | (((c & 255) * s) >> 8)) >>> 0;
    const fog = d => d < 1 ? 256 : Math.max(40, 290 - d * 26) | 0;
    function render() {
      const dX = Math.cos(cam.a), dY = Math.sin(cam.a), pX = -dY * 0.72, pY = dX * 0.72;
      // while turning on the spot, step back a little so the wall doesn't fill the whole screen
      const pb = task && task.k === 'turn' ? Math.sin(Math.min(1, task.t) * Math.PI) * 0.3 : 0;
      const px = cam.x - dX * pb, py = cam.y - dY * pb, T = M.T, map = M.map, half = RH / 2;
      const sx0 = 2 * 0 + 1, sy0 = 1, ex0 = 2 * exitC[0] + 1, ey0 = 2 * exitC[1] + 1;
      // floor + ceiling
      const r0x = dX - pX, r0y = dY - pY, r1x = dX + pX, r1y = dY + pY;
      for (let y = Math.floor(half) + 1; y < RH; y++) {
        const rd = half * WH / (y - half), stx = rd * (r1x - r0x) / RW, sty = rd * (r1y - r0y) / RW;
        let fx = px + rd * r0x, fy = py + rd * r0y;
        const s = fog(rd), yc = RH - 1 - y, ro = y * RW, rc = yc * RW;
        for (let x = 0; x < RW; x++) {
          const cx = fx | 0, cy = fy | 0, tx = ((fx - cx) * 64) & 63, ty = ((fy - cy) * 64) & 63, ti = ty * 64 + tx;
          const ft = cx === sx0 && cy === sy0 ? ST : cx === ex0 && cy === ey0 ? XT : FT;
          PX[ro + x] = shade(ft[ti], s);
          if (rc >= 0) PX[rc + x] = shade(CT[ti], s);
          fx += stx; fy += sty;
        }
      }
      if (RH & 1) { const hy = Math.floor(half) * RW; for (let x = 0; x < RW; x++) PX[hy + x] = 0xff000000; }
      // walls
      for (let x = 0; x < RW; x++) {
        const cx = 2 * x / RW - 1, rx = dX + pX * cx, ry = dY + pY * cx;
        let mx = px | 0, my = py | 0;
        const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry);
        let stepX, stepY, sdx, sdy, side = 0, hit = 0;
        if (rx < 0) { stepX = -1; sdx = (px - mx) * ddx; } else { stepX = 1; sdx = (mx + 1 - px) * ddx; }
        if (ry < 0) { stepY = -1; sdy = (py - my) * ddy; } else { stepY = 1; sdy = (my + 1 - py) * ddy; }
        for (let i = 0; i < 64; i++) {
          if (sdx < sdy) { sdx += ddx; mx += stepX; side = 0; } else { sdy += ddy; my += stepY; side = 1; }
          if (mx < 0 || my < 0 || mx >= T || my >= T) { hit = 1; break; }
          hit = map[my * T + mx]; if (hit) break;
        }
        const perp = Math.max(0.05, side === 0 ? sdx - ddx : sdy - ddy);
        zb[x] = perp;
        const tex = WT[hit] || WT[1];
        let wx = side === 0 ? py + perp * ry : px + perp * rx; wx -= Math.floor(wx);
        const rep = hit >= 2 ? 64 : 128;
        let tx = (wx * rep) & 63; if ((side === 0 && rx < 0) || (side === 1 && ry > 0)) tx = 63 - tx;
        const lh = RH * WH / perp, top = half - lh / 2, y0 = Math.max(0, top | 0), y1 = Math.min(RH - 1, (half + lh / 2) | 0);
        const step = rep / lh, s = (fog(perp) * (side ? 0.78 : 1)) | 0;
        let tp = (y0 - top) * step;
        for (let y = y0; y <= y1; y++) { PX[y * RW + x] = shade(tex[((tp | 0) & 63) * 64 + tx], s); tp += step; }
      }
      // sprites: grot heads (spinning), squigs (scurrying), the smiley at the end
      const list = [];
      const ec = centre(exitC[0], exitC[1]);
      list.push({ x: ec[0], y: ec[1], s: S.smile, sc: 0.62, v: 0.02 + Math.sin(spin * 1.3) * 0.03, ws: 1 });
      for (const hd of heads) { const c = Math.cos(spin + hd.ph); list.push({ x: hd.x, y: hd.y, s: c >= 0 ? S.head : S.back, sc: 0.5, v: -0.02 + Math.sin(spin * 1.7 + hd.ph) * 0.06, ws: Math.max(0.08, Math.abs(c)) }); }
      for (const q of squigs) list.push({ x: q.x, y: q.y, s: ((spin * 3 + q.ph) | 0) & 1 ? S.sq1 : S.sq0, sc: 0.26, v: 0.37, ws: 1 });
      for (const it of list) it.d = (it.x - px) ** 2 + (it.y - py) ** 2;
      list.sort((a, b) => b.d - a.d);
      const inv = 1 / (pX * dY - dX * pY);
      for (const it of list) {
        const rx2 = it.x - px, ry2 = it.y - py;
        const tX = inv * (dY * rx2 - dX * ry2), tY = inv * (-pY * rx2 + pX * ry2);
        if (tY < 0.15) continue;
        const scx = (RW / 2) * (1 + tX / tY), sz = RH * WH / tY * it.sc, sw = sz * it.ws, vm = it.v * RH * WH / tY;
        const yTop = half - sz / 2 + vm, xL = scx - sw / 2;
        const xa = Math.max(0, xL | 0), xb = Math.min(RW - 1, (scx + sw / 2) | 0), ya = Math.max(0, yTop | 0), yb = Math.min(RH - 1, (yTop + sz) | 0);
        const s = fog(tY), sp = it.s;
        for (let x = xa; x <= xb; x++) {
          if (tY >= zb[x]) continue;
          const tx = Math.min(sp.w - 1, ((x - xL) * sp.w / sw) | 0);
          for (let y = ya; y <= yb; y++) {
            const c = sp.px[Math.min(sp.h - 1, ((y - yTop) * sp.h / sz) | 0) * sp.w + tx];
            if ((c >>> 24) > 140) PX[y * RW + x] = shade(c, s);
          }
        }
      }
      bx.putImageData(img, 0, 0);
      // onto the screen, rolled over if a grot head has turned the world upside down
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      g.imageSmoothingEnabled = false;
      g.save(); g.translate(W / 2, H / 2);
      if (roll) { const c = Math.abs(Math.cos(roll)), s2 = Math.abs(Math.sin(roll)), z = Math.max((W * c + H * s2) / W, (W * s2 + H * c) / H); g.rotate(roll); g.scale(z, z); }
      g.drawImage(buf, -W / 2, -H / 2, W, H); g.restore();
      if (phase === 'fade') { g.fillStyle = `rgba(0,0,0,${clamp(fadeT / 1.2, 0, 1)})`; g.fillRect(0, 0, W, H); }
    }
    return {
      frame(dt) { update(dt * (E._mazeSpeed || 1)); render(); },
      stop() {},
      _state: () => ({ cell, dir, heads: heads.length, roll, phase, exits }),
    };
  };

  // ======================================================================================== JACK ISLAND
  const SKY = [ // hour, top, bottom
    [0, [6, 8, 26], [16, 22, 56]], [4.8, [8, 10, 32], [24, 26, 66]], [5.8, [44, 52, 120], [236, 140, 100]], [7, [70, 140, 220], [200, 226, 246]],
    [16.5, [60, 140, 230], [190, 228, 255]], [18.3, [70, 80, 160], [255, 150, 70]], [19.4, [30, 26, 80], [150, 70, 100]], [20.4, [10, 12, 36], [28, 30, 70]], [24, [6, 8, 26], [16, 22, 56]]];
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const css3 = (c, a) => a == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function skyAt(h) { for (let i = 0; i < SKY.length - 1; i++) if (h >= SKY[i][0] && h < SKY[i + 1][0]) { const t = (h - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]); return [mix(SKY[i][1], SKY[i + 1][1], t), mix(SKY[i][2], SKY[i + 1][2], t)]; } return [SKY[0][1], SKY[0][2]]; }
  const lightAt = h => h < 5 || h > 20.6 ? 0 : h < 7 ? ease((h - 5) / 2) : h > 18 ? 1 - ease((h - 18) / 2.6) : 1;
  const GREEN = '#5aac2c', DARKG = '#1d4a10', BROWN = '#8a5a2a';

  // the grot himself: feet at (0,0), about 16 units tall. o: {pose, t, face, hat, glasses, hold}
  function drawGrot(g, x, y, o) {
    const t = o.t || 0, P = o.pose || 'stand';
    g.save(); g.translate(x, y); g.scale(o.face || 1, 1);
    let aB = 0.25, aF = 0.25, sit = false, jump = 0, bob = 0, leg = 0, eyes = 'open', mouth = 'grin', lean = 0, headTilt = 0;
    const w = Math.sin(t * 10);
    switch (P) {
      case 'walk': leg = Math.sin(t * 11); bob = Math.abs(Math.sin(t * 11)) * 0.7; aB = 0.5 * leg; aF = -0.5 * leg; break;
      case 'wave': jump = Math.abs(Math.sin(t * 7)) * 4; aB = 2.7 + Math.sin(t * 15) * 0.35; aF = 2.7 - Math.sin(t * 15) * 0.35; mouth = 'open'; break;
      case 'bye': aF = 2.5 + Math.sin(t * 9) * 0.4; aB = 0.2; break;
      case 'stretch': aB = aF = 2.95; mouth = 'yawn'; eyes = 'shut'; bob = -0.5; break;
      case 'yawn': aF = 1.9; aB = 0.2; mouth = 'yawn'; eyes = 'shut'; break;
      case 'push': aB = aF = 1.5; lean = 0.25; bob = Math.sin(t * 30) * 0.3; mouth = 'teeth'; break;
      case 'dizzy': aB = 0.6 + w * 0.3; aF = 0.6 - w * 0.3; eyes = 'x'; lean = Math.sin(t * 5) * 0.15; mouth = 'open'; break;
      case 'crack': aB = aF = 1.2 + Math.abs(Math.sin(t * 9)) * 0.9; sit = true; break;
      case 'drink': sit = true; aF = 2.6; aB = 0.5; eyes = 'shut'; break;
      case 'sit': sit = true; aB = aF = 0.7; break;
      case 'fish': sit = true; aB = aF = 1.35; break;
      case 'reel': sit = true; aB = 1.2 + w * 0.3; aF = 1.6 - w * 0.3; mouth = 'open'; lean = -0.15; break;
      case 'angry': aF = 2.8 + Math.sin(t * 20) * 0.3; aB = 0.3; jump = Math.abs(Math.sin(t * 9)) * 1.5; mouth = 'teeth'; eyes = 'cross'; break;
      case 'build': sit = true; lean = 0.3; aB = 1.0 + Math.max(0, Math.sin(t * 7)) * 0.5; aF = 1.0 + Math.max(0, -Math.sin(t * 7)) * 0.5; break;
      case 'write': sit = true; aB = 0.9; aF = 1.0 + Math.sin(t * 14) * 0.12; headTilt = 0.2; break;
      case 'throw': aF = 3.3 - ((t * 3) % 1) * 3.5; aB = 0.4; lean = 0.15; break;
      case 'eat': sit = true; aF = 1.6 + Math.max(0, Math.sin(t * 4)) * 1.2; aB = 0.6; mouth = Math.sin(t * 8) > 0 ? 'open' : 'grin'; break;
      case 'toast': sit = true; aF = 1.25; aB = 0.6; break;
      case 'juggle': aB = 1.5 + Math.sin(t * 6) * 0.35; aF = 1.5 - Math.sin(t * 6) * 0.35; headTilt = -0.25; break;
      case 'look': aF = 2.4; aB = 0.2; headTilt = -0.35; break;
      case 'cheer': sit = true; aB = aF = 2.7 + Math.sin(t * 8) * 0.2; mouth = 'open'; break;
      case 'umbrella': aF = 2.9; aB = 0.3; mouth = 'grin'; break;
      case 'sleep': break;
    }
    if (P === 'sleep') { // lying down in the hammock: drawn on his back
      g.rotate(-Math.PI / 2 + 0.06); eyes = 'shut'; mouth = 'flat'; aB = aF = 0.1;
    }
    g.translate(0, -jump - bob);
    g.rotate(lean);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const by = sit ? 3 : 0; // body drops when sitting
    // legs
    g.strokeStyle = DARKG; g.lineWidth = 2.2;
    g.beginPath();
    if (sit) { g.moveTo(-1, -2); g.lineTo(4, -1); g.lineTo(5, 0.5); g.moveTo(1, -2); g.lineTo(6, -1.4); g.lineTo(7, 0); }
    else { g.moveTo(-1.2, -4); g.lineTo(-1.2 - leg * 1.4, 0); g.moveTo(1.2, -4); g.lineTo(1.2 + leg * 1.4, 0); }
    g.stroke();
    g.strokeStyle = GREEN; g.lineWidth = 1.2; g.stroke();
    const sh = [0, -9.5 + by];
    const arm = (a, dx, back) => { const hx = sh[0] + dx + Math.sin(a) * 5, hy = sh[1] + Math.cos(a) * 5; g.strokeStyle = back ? '#123d08' : DARKG; g.lineWidth = 2.2; g.beginPath(); g.moveTo(sh[0] + dx, sh[1]); g.lineTo(hx, hy); g.stroke(); g.strokeStyle = back ? '#3d8a1e' : GREEN; g.lineWidth = 1.2; g.stroke(); return [hx, hy]; };
    const hb = arm(aB, -1.5, true);
    // body
    g.fillStyle = GREEN; g.strokeStyle = DARKG; g.lineWidth = 0.8;
    g.beginPath(); g.ellipse(0, -7 + by, 3.4, 3.8, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = BROWN; g.fillRect(-3.3, -5.4 + by, 6.6, 2.2);
    if (o.hold === 'paper') { g.fillStyle = '#f4f0e0'; g.fillRect(2, -6 + by, 4, 3); }
    // head
    g.save(); g.translate(0, -13.5 + by); g.rotate(headTilt);
    // antennae with glowing bobbles (Zib is a little green alien, not a goblin: no pointy ears)
    g.strokeStyle = DARKG; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-1.6, -3.2); g.quadraticCurveTo(-3, -6, -3.6, -7.4); g.moveTo(1.8, -3.2); g.quadraticCurveTo(3.2, -6, 4, -7.4); g.stroke();
    g.fillStyle = '#b8ff60'; g.lineWidth = 0.4; [-3.7, 4.1].forEach(ax => { g.beginPath(); g.arc(ax, -7.7, 1.05, 0, TAU); g.fill(); g.stroke(); });
    const hg = g.createRadialGradient(-1.4, -1.6, 0.3, 0, 0, 4.6); hg.addColorStop(0, '#a8f070'); hg.addColorStop(1, GREEN);
    g.fillStyle = hg; g.strokeStyle = DARKG; g.lineWidth = 0.8; g.beginPath(); g.ellipse(0, -0.3, 4.3, 4, 0, 0, TAU); g.fill(); g.stroke();
    if (eyes === 'open' || eyes === 'cross') { g.fillStyle = '#000'; g.beginPath(); g.ellipse(-1.5, -0.6, 1.15, 1.6, -0.35, 0, TAU); g.ellipse(1.9, -0.6, 1.15, 1.6, 0.35, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(-1.9, -1.6, 0.6, 0.6); g.fillRect(1.5, -1.6, 0.6, 0.6); if (eyes === 'cross') { g.strokeStyle = DARKG; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-2.6, -2.9); g.lineTo(-0.5, -2.2); g.moveTo(3, -2.9); g.lineTo(0.9, -2.2); g.stroke(); } }
    else if (eyes === 'x') { g.strokeStyle = '#e10600'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-1.8, -1.6); g.lineTo(-0.4, -0.2); g.moveTo(-0.4, -1.6); g.lineTo(-1.8, -0.2); g.moveTo(0.8, -1.6); g.lineTo(2.2, -0.2); g.moveTo(2.2, -1.6); g.lineTo(0.8, -0.2); g.stroke(); }
    else { g.strokeStyle = DARKG; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-1.8, -0.6); g.lineTo(-0.3, -0.6); g.moveTo(0.9, -0.6); g.lineTo(2.4, -0.6); g.stroke(); }
    if (o.glasses) { g.fillStyle = '#111'; g.fillRect(-2.2, -1.8, 2.2, 1.8); g.fillRect(0.6, -1.8, 2.2, 1.8); g.fillRect(0, -1.2, 0.6, 0.5); }
    if (mouth === 'yawn' || mouth === 'open') { g.fillStyle = '#300'; g.beginPath(); g.ellipse(0.4, 2.2, 1.4, mouth === 'yawn' ? 1.3 : 0.9, 0, 0, TAU); g.fill(); }
    else if (mouth === 'teeth') { g.fillStyle = '#fff'; g.fillRect(-1.2, 1.6, 3, 1); g.strokeStyle = '#300'; g.lineWidth = 0.3; g.strokeRect(-1.2, 1.6, 3, 1); }
    else if (mouth === 'flat') { g.strokeStyle = DARKG; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-0.8, 2.2); g.lineTo(1.6, 2.2); g.stroke(); }
    else { g.strokeStyle = DARKG; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-1.2, 1.8); g.quadraticCurveTo(0.4, 3, 2, 1.8); g.stroke(); g.fillStyle = '#fff'; g.fillRect(1.3, 1.8, 0.6, 0.7); }
    if (o.hat === 'santa') { g.fillStyle = '#e10600'; g.beginPath(); g.moveTo(-3.6, -2); g.quadraticCurveTo(0, -9, 5, -7); g.lineTo(3.8, -2); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(-3.8, -2.8, 7.8, 1.6); g.beginPath(); g.arc(5.2, -7, 1.1, 0, TAU); g.fill(); }
    if (o.hat === 'party') { const cs = ['#ff2a6d', '#ffd400', '#00e5ff']; g.fillStyle = cs[0]; g.beginPath(); g.moveTo(-2.6, -2.6); g.lineTo(0.5, -10); g.lineTo(3, -2.6); g.closePath(); g.fill(); g.fillStyle = cs[1]; g.fillRect(-1.6, -5.5, 3.6, 0.9); g.fillStyle = cs[2]; g.beginPath(); g.arc(0.5, -10.3, 1, 0, TAU); g.fill(); }
    g.restore();
    const hf = arm(aF, 1.5, false);
    g.restore();
    return { hb, hf, by };
  }
  // where the front hand ends up, in island units (mirrors drawGrot's maths; used to hang rods, coconuts and bottles on him)
  const handAt = (x, y, face, a, sit, jump) => [x + face * (1.5 + Math.sin(a) * 5), y - jump + (-9.5 + (sit ? 3 : 0)) + Math.cos(a) * 5];

  function palm(g, x, sway, t, opt) {
    g.save(); g.translate(x, 0);
    g.strokeStyle = '#5a3a14'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-1, -26, -5 + sway, -50); g.stroke();
    g.strokeStyle = '#8a5a24'; g.lineWidth = 2.6; g.stroke();
    g.strokeStyle = '#5a3a14'; g.lineWidth = 0.6;
    for (let i = 1; i < 10; i++) { const k = i / 10, px = lerp(0, -5 + sway, k * k) - k, py = -50 * k; g.beginPath(); g.moveTo(px - 1.6, py); g.lineTo(px + 1.6, py - 1); g.stroke(); }
    const tx = -5 + sway, ty = -50;
    if (opt && opt.coconuts) { g.fillStyle = '#4a2a0a'; for (const [cx, cy] of [[-1.5, 2], [1.5, 2.6], [0, 3.6]]) { g.beginPath(); g.arc(tx + cx, ty + cy, 1.7, 0, TAU); g.fill(); } }
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.62 + Math.sin(t * 1.4 + i) * 0.05 + sway * 0.03, L = 17 + (i % 2) * 4;
      const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + 6;
      g.strokeStyle = '#1a5a14'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * L * 0.5, ty + Math.sin(a) * L * 0.5 - 3, ex, ey); g.stroke();
      g.strokeStyle = '#3a9a2a'; g.lineWidth = 1.8; g.stroke();
      if (opt && opt.xmas) { g.fillStyle = ['#e10600', '#ffd400', '#00a0ff'][i % 3]; g.beginPath(); g.arc(ex, ey + 1.2, 1, 0, TAU); g.fill(); }
    }
    g.restore();
    return [x + tx, ty];
  }
  function fishShape(g, x, y, a, boot) {
    g.save(); g.translate(x, y); g.rotate(a);
    if (boot) { g.fillStyle = '#5a3a1a'; g.fillRect(-1.5, -4, 3, 5); g.fillRect(-1.5, 0, 5, 2.2); g.fillStyle = '#3a2410'; g.fillRect(-1.5, 1.6, 5, 0.6); }
    else { g.fillStyle = '#ff8a20'; g.beginPath(); g.ellipse(0, 0, 1.6, 3.2, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(0, 2.6); g.lineTo(-1.8, 5); g.lineTo(1.8, 5); g.fill(); g.fillStyle = '#000'; g.fillRect(-0.6, -2, 0.7, 0.7); }
    g.restore();
  }
  function heart(g, x, y, s, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.3, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.6, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9); g.fill(); }

  E.savers.island = (g, W, H, o) => {
    const P = o.preview ? 1 : Math.max(2, Math.round(Math.min(W, H) / 280));
    const bw = Math.max(40, Math.ceil(W / P)), bh = Math.max(30, Math.ceil(H / P));
    const buf = cnv(bw, bh), b = buf.getContext('2d'), fgc = cnv(bw, bh), f = fgc.getContext('2d');
    const portrait = bh > bw * 1.1;
    const u = o.preview ? Math.min(bw / 175, bh / 135) : Math.min(bw / (portrait ? 150 : 185), bh / 150);
    const horizon = Math.round(bh * (portrait ? 0.5 : 0.54));
    const cx = bw / 2, cy = horizon + (bh - horizon) * 0.42;
    const R = Math.random;
    const stars = Array.from({ length: Math.round(bw * horizon / 180) + 20 }, () => [R() * bw, R() * horizon * 0.97, R(), R() * 6]);
    const clouds = Array.from({ length: 4 }, (_, i) => ({ x: R() * bw, y: horizon * (0.12 + R() * 0.35), s: 0.6 + R() * 0.8, v: 2 + R() * 3 }));
    let T = 0, gx = 0, face = 1, last = '', walkT = 0, thrownCyc = -1;
    const ev = { ship: null, shark: null, rain: null, nextShip: o.full ? 50 + R() * 50 : 8 + R() * 10, nextShark: 70 + R() * 90, nextRain: 160 + R() * 300 };
    if (E._isleTest) Object.assign(ev, E._isleTest); // test hook: { nextShip: 2, nextShark: 3, nextRain: 4 }
    const fw = [];
    let specialSeen = false, shipSeen = false;
    const day = () => E.today();
    // what's on today?
    function special() {
      const d = day(), md = d.md;
      return { bonfire: md === 1105, xmas: d.m === 12, presents: md === 1224 || md === 1225, nye: md === 1231, ny: md === 101, hallow: md === 1031, valentine: md === 214, eclipse: md === 811, fools: md === 401 };
    }
    // the timetable: by the hour, overridden on special days
    function plan(h, sp) {
      if (sp.eclipse && h >= 9.9 && h < 12.5) return 'eclipse';
      if (sp.bonfire && h >= 17.3 && h < 23) return 'bonfire';
      if (sp.nye && h >= 19) return 'party';
      if (sp.ny && h < 1) return 'party';
      if (h >= 22 || h < 6) return 'sleep';
      if (h < 7.5) return 'wake';
      if (h < 9) return 'breakfast';
      if (h < 12) return 'fish';
      if (h < 13) return 'lunch';
      if (h < 16) return 'castle';
      if (h < 17.5) return 'bottle';
      if (h < 19) return 'juggle';
      return 'campfire';
    }
    const HOME = { sleep: -17, wake: -4, breakfast: -20, fish: 42, lunch: -2, castle: 6, bottle: 0, juggle: 0, campfire: 4, bonfire: 8, party: 2, eclipse: 4 };
    const bottles = [];
    const bubble = []; // crisp text to draw on top: [x, y, text]

    function sea(g2, h, light, tt) {
      const [top, bot] = skyAt(h);
      const s1 = mix([10, 40, 110], [20, 80, 170], light), s2 = mix([4, 14, 40], [10, 50, 120], light);
      const gr = g2.createLinearGradient(0, horizon, 0, bh); gr.addColorStop(0, css3(mix(s1, bot, 0.35))); gr.addColorStop(1, css3(s2));
      g2.fillStyle = gr; g2.fillRect(0, horizon, bw, bh - horizon);
      // waves
      g2.fillStyle = css3(mix([60, 90, 150], [170, 220, 255], light), 0.55);
      for (let y = horizon + 2, i = 0; y < bh; y += 2 + (y - horizon) * 0.06, i++) {
        const sp = 6 + (y - horizon) * 0.4, off = (tt * (4 + i % 3) + i * 37) % sp;
        for (let x = -sp + off; x < bw; x += sp) { const w2 = 1 + (y - horizon) * 0.05; if (((x + i * 13) | 0) % 3 === 0) g2.fillRect(x | 0, y | 0, Math.ceil(w2 * 2), 1); }
      }
    }
    function rocket() { fw.push({ x: cx + (R() - 0.5) * 120 * u, y: cy - 4 * u, vx: (R() - 0.5) * 6 * u, vy: -(42 + R() * 18) * u, life: 1.1 + R() * 0.5, col: ['#ff3a3a', '#ffd400', '#3aff6a', '#3ad0ff', '#ff6aff', '#fff'][R() * 6 | 0], kind: 'r' }); }
    function boom(p) { const n = 26 + (R() * 20 | 0), sp = (16 + R() * 14) * u; for (let i = 0; i < n; i++) { const a = i / n * TAU; fw.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp * (0.7 + R() * 0.3), vy: Math.sin(a) * sp * (0.7 + R() * 0.3), life: 1.2 + R() * 0.6, col: R() < 0.2 ? '#fff' : p.col, kind: 'p' }); } try { if (o.full && window.Sound && Sound.on && R() < 0.5) Sound.note(80 + R() * 40, 0.25, 'triangle'); } catch (e) {} }

    function frame(dt) {
      T += dt;
      const h = (E.hour() % 24 + 24) % 24, sp = special();
      let light = lightAt(h);
      // the 1999 eclipse: 11 August, greatest at 11:11
      let cover = 0;
      if (sp.eclipse) { cover = clamp(1 - Math.abs(h - 11.18) / 1.25, 0, 1); light *= 1 - (cover > 0.85 ? (cover - 0.85) / 0.15 * 0.85 : cover * 0.12); }
      // random events
      if (!ev.ship && T > ev.nextShip) { if (light > 0.4) ev.ship = { t: 0, dir: R() < 0.5 ? 1 : -1 }; ev.nextShip = T + (o.full ? 140 + R() * 160 : 25 + R() * 20); }
      if (!ev.shark && T > ev.nextShark) { ev.shark = { t: 0 }; ev.nextShark = T + 90 + R() * 150; }
      if (!ev.rain && T > ev.nextRain && h > 7 && h < 20) { ev.rain = { t: 0 }; ev.nextRain = T + 240 + R() * 400; }
      if (ev.ship && (ev.ship.t += dt) > 40) ev.ship = null;
      if (ev.shark && (ev.shark.t += dt) > 26) ev.shark = null;
      if (ev.rain && (ev.rain.t += dt) > 34) ev.rain = null;
      const rainK = ev.rain ? clamp(Math.min(ev.rain.t / 4, (34 - ev.rain.t) / 4), 0, 1) : 0;
      light *= 1 - rainK * 0.3;
      const dark = 1 - light;

      // ---- sky
      let [top, bot] = skyAt(h);
      if (cover) { const k = cover > 0.85 ? (cover - 0.85) / 0.15 : 0; top = mix(top, [8, 10, 30], k * 0.9); bot = mix(bot, [60, 40, 70], k * 0.8); }
      if (rainK) { top = mix(top, [90, 96, 110], rainK * 0.7 * light); bot = mix(bot, [140, 146, 156], rainK * 0.7 * light); }
      const sg = b.createLinearGradient(0, 0, 0, horizon); sg.addColorStop(0, css3(top)); sg.addColorStop(1, css3(bot));
      b.fillStyle = sg; b.fillRect(0, 0, bw, horizon + 1);
      // stars
      const starA = clamp(dark * 1.3 - 0.25, 0, 1) * (1 - rainK);
      if (starA > 0) for (const s of stars) { const tw = 0.6 + 0.4 * Math.sin(T * 2 + s[3]); b.fillStyle = `rgba(255,255,240,${(starA * tw * (0.4 + s[2] * 0.6)).toFixed(2)})`; b.fillRect(s[0] | 0, s[1] | 0, s[2] > 0.85 ? 2 : 1, 1); }
      // sun
      const sunR = Math.max(2, 7 * u);
      if (h > 5.5 && h < 20) {
        const k = (h - 5.8) / (19.6 - 5.8), sx = bw * lerp(0.08, 0.92, k), sy = horizon - Math.sin(clamp(k, 0, 1) * Math.PI) * horizon * 0.78 + sunR * 0.6;
        const warm = 1 - Math.sin(clamp(k, 0, 1) * Math.PI);
        b.fillStyle = css3(mix([255, 250, 200], [255, 120, 40], ease(warm * 1.2)), 0.25 * (1 - rainK)); b.beginPath(); b.arc(sx, sy, sunR * 2.2, 0, TAU); b.fill();
        b.fillStyle = css3(mix([255, 245, 170], [255, 110, 40], ease(warm * 1.2))); b.beginPath(); b.arc(sx, sy, sunR, 0, TAU); b.fill();
        if (cover) { // the moon slides across the sun
          const off = (h < 11.18 ? 1 : -1) * (1 - cover) * sunR * 2.1;
          if (cover > 0.97) { b.strokeStyle = 'rgba(255,255,255,.8)'; b.lineWidth = Math.max(1, sunR * 0.25); b.beginPath(); b.arc(sx, sy, sunR * 1.25, 0, TAU); b.stroke(); b.fillStyle = 'rgba(255,255,230,.18)'; b.beginPath(); b.arc(sx, sy, sunR * 2.4, 0, TAU); b.fill(); }
          b.fillStyle = css3(top); b.beginPath(); b.arc(sx + off, sy, sunR * 1.02, 0, TAU); b.fill();
        }
      }
      // moon
      if (h > 19 || h < 6.5) {
        const k = ((h - 19 + 24) % 24) / 11.5, mx = bw * lerp(0.1, 0.9, k), my = horizon - Math.sin(clamp(k, 0, 1) * Math.PI) * horizon * 0.72 + 4;
        const mr = Math.max(2, 5 * u);
        b.fillStyle = 'rgba(255,255,220,.12)'; b.beginPath(); b.arc(mx, my, mr * 2.4, 0, TAU); b.fill();
        b.fillStyle = '#f4f0d0'; b.beginPath(); b.arc(mx, my, mr, 0, TAU); b.fill();
        b.fillStyle = css3(top); b.beginPath(); b.arc(mx + mr * 0.55, my - mr * 0.25, mr * 0.9, 0, TAU); b.fill();
      }
      // clouds
      for (const c of clouds) {
        c.x += c.v * dt * u * 0.6; if (c.x > bw + 40 * u) c.x = -40 * u;
        const col = mix([255, 255, 255], [120, 126, 140], rainK), a = (0.35 + light * 0.5) * (1 - dark * 0.6) + rainK * 0.4;
        b.fillStyle = css3(mix(col, [40, 40, 70], dark * 0.8), Math.min(0.95, a));
        const s = c.s * u; for (const [ox, oy, r] of [[0, 0, 7], [7, 1, 6], [-7, 2, 5], [13, 3, 4], [-12, 3.5, 3.5]]) { b.beginPath(); b.arc(c.x + ox * s, c.y + oy * s, r * s, 0, TAU); b.fill(); }
      }
      if (rainK) { const rg = b.createLinearGradient(0, 0, 0, horizon); rg.addColorStop(0, `rgba(80,86,100,${(rainK * 0.6).toFixed(2)})`); rg.addColorStop(1, 'rgba(80,86,100,0)'); b.fillStyle = rg; b.fillRect(0, 0, bw, horizon); }
      // ship on the horizon
      if (ev.ship) {
        const k = ev.ship.t / 40, x = ev.ship.dir > 0 ? lerp(-30 * u, bw + 30 * u, k) : lerp(bw + 30 * u, -30 * u, k), y = horizon;
        b.save(); b.translate(x, y); b.scale(u * 0.55 * ev.ship.dir, u * 0.55);
        b.fillStyle = '#222'; b.beginPath(); b.moveTo(-16, -4); b.lineTo(16, -4); b.lineTo(12, 1); b.lineTo(-13, 1); b.fill();
        b.fillStyle = '#e10600'; b.fillRect(-15, -5.5, 30, 1.5);
        b.fillStyle = '#eee'; b.fillRect(-8, -10, 14, 5); b.fillStyle = '#336'; for (let i = 0; i < 4; i++) b.fillRect(-6 + i * 3.2, -8.8, 1.6, 1.6);
        b.fillStyle = '#c03010'; b.fillRect(1, -16, 3.4, 6); b.fillStyle = '#111'; b.fillRect(1, -16, 3.4, 1.4);
        for (let i = 0; i < 4; i++) { b.fillStyle = `rgba(200,200,200,${0.5 - i * 0.1})`; b.beginPath(); b.arc(-2 - i * 5 - (T * 3 % 5), -19 - i * 2.4, 2 + i * 0.8, 0, TAU); b.fill(); }
        b.restore();
        if (o.full && !shipSeen) { shipSeen = true; E.secret('island.ship'); }
      }

      // ---- the foreground: sea, island and everything on it (drawn on its own layer so night can tint it)
      f.clearRect(0, 0, bw, bh);
      sea(f, h, light, T);
      // sun/moon glints on the water
      const glintX = h > 6 && h < 19.6 ? bw * lerp(0.08, 0.92, (h - 5.8) / 13.8) : bw * lerp(0.1, 0.9, ((h - 19 + 24) % 24) / 11.5);
      f.fillStyle = `rgba(255,${h > 6 && h < 19.6 ? 230 : 250},${h > 6 && h < 19.6 ? 160 : 220},${(0.25 + 0.3 * Math.abs(Math.sin(T))).toFixed(2)})`;
      for (let y = horizon + 2; y < bh; y += 3) { const w2 = 2 + (y - horizon) * 0.08, jx = Math.sin(y * 1.7 + T * 3) * w2; f.fillRect((glintX + jx - w2) | 0, y, Math.ceil(w2 * 1.2), 1); }
      // floating bottles
      for (let i = bottles.length - 1; i >= 0; i--) {
        const bt = bottles[i]; bt.t += dt; if (bt.t > 60) { bottles.splice(i, 1); continue; }
        const k = bt.t / 60, x = cx + (bt.x0 + bt.t * 2.2) * u, y = lerp(cy + 6 * u, horizon + 2, ease(k)) + Math.sin(bt.t * 3) * u * 0.6, s = u * lerp(1, 0.35, k);
        f.save(); f.translate(x, y); f.rotate(Math.sin(bt.t * 2) * 0.4); f.fillStyle = 'rgba(120,220,160,.9)'; f.fillRect(-1.2 * s, -2.5 * s, 2.4 * s, 4 * s); f.fillStyle = '#c8a060'; f.fillRect(-0.6 * s, -3.4 * s, 1.2 * s, 1 * s); f.restore();
      }
      // the shark, behind the island
      let sharkFront = false, sharkP = null;
      if (ev.shark) { const a = ev.shark.t * 0.5 + 1, k = clamp(Math.min(ev.shark.t / 2, (26 - ev.shark.t) / 2), 0, 1); sharkP = [cx + Math.cos(a) * 92 * u, cy + 4 * u + Math.sin(a) * 15 * u, k, -Math.sin(a) >= 0 ? -1 : 1]; sharkFront = Math.sin(a) > 0; }
      const drawShark = () => { if (!sharkP) return; const [x, y, k, d] = sharkP; f.save(); f.translate(x, y); f.scale(u * d, u); f.fillStyle = '#5a6470'; f.beginPath(); f.moveTo(-3, 0); f.lineTo(0.5, -6 * k); f.lineTo(3, 0); f.fill(); f.fillStyle = 'rgba(255,255,255,.6)'; f.fillRect(-6, 0, 12, 0.8); f.restore(); };
      if (!sharkFront) drawShark();

      f.save(); f.translate(cx, cy); f.scale(u, u);
      // island
      f.fillStyle = 'rgba(255,255,255,.75)';
      const foam = 1 + Math.sin(T * 1.6) * 0.03;
      f.beginPath(); f.ellipse(0, 3, 66 * foam, 12.5 * foam, 0, 0, TAU); f.fill();
      f.fillStyle = '#c8a050'; f.beginPath(); f.ellipse(0, 3.5, 62, 10.5, 0, 0, TAU); f.fill();
      f.fillStyle = '#f0d890'; f.beginPath(); f.ellipse(0, 1.5, 60, 9, 0, 0, TAU); f.fill();
      f.fillStyle = '#f8e8b0'; f.beginPath(); f.ellipse(-8, -0.5, 40, 5, 0, 0, TAU); f.fill();
      f.fillStyle = '#d8b870'; for (const [x, y] of [[-40, 4], [22, 6], [35, -1], [-12, 7], [48, 3], [-50, 1]]) f.fillRect(x, y, 2, 0.8);
      // shells and a starfish
      f.fillStyle = '#ff9a8a'; f.fillRect(30, 5, 1.6, 1.2); f.fillStyle = '#ff7a20'; f.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 0.9 : 2.2; f.lineTo(-42 + Math.cos(a) * r, 6 + Math.sin(a) * r); } f.fill();
      if (sp.valentine) { heart(f, -26, 6, 3.4, '#ff6a9a'); heart(f, 16, 7, 2.6, '#ff3a6a'); heart(f, -8, 8, 2, '#ff8ab0'); }

      const act = plan(h, sp);
      if (act !== last) { last = act; walkT = 0; }
      // palm tree (with hammock post), shaken at breakfast
      const cycle = T % 24;
      const shaking = act === 'breakfast' && cycle < 3;
      const sway = Math.sin(T * 0.9) * 1.2 + (shaking ? Math.sin(T * 30) * 2.5 : 0) + (rainK ? Math.sin(T * 3) * 2 : 0);
      const top2 = palm(f, -30, sway, T, { coconuts: !(act === 'breakfast' && cycle > 3 && cycle < 23), xmas: false });
      // hammock post + hammock
      f.strokeStyle = '#6a4a1a'; f.lineWidth = 1.6; f.beginPath(); f.moveTo(-5, 0); f.lineTo(-5, -13); f.stroke();
      f.strokeStyle = '#e8d8a0'; f.lineWidth = 1; f.beginPath(); f.moveTo(-31, -12); f.quadraticCurveTo(-18, act === 'sleep' ? -1 : -5, -5, -12.5); f.stroke();
      if (act === 'sleep') { f.strokeStyle = '#c0a060'; f.lineWidth = 2.2; f.beginPath(); f.moveTo(-28, -9); f.quadraticCurveTo(-18, -1.5, -8, -9.5); f.stroke(); }
      // the special things on special days
      if (sp.xmas) { // a little Christmas tree
        f.save(); f.translate(30, 0);
        f.fillStyle = '#5a3a14'; f.fillRect(-1, -3, 2, 3);
        f.fillStyle = '#1a6a2a'; for (let i = 0; i < 3; i++) { f.beginPath(); f.moveTo(-7 + i * 1.6, -3 - i * 5); f.lineTo(0, -12 - i * 5); f.lineTo(7 - i * 1.6, -3 - i * 5); f.fill(); }
        for (let i = 0; i < 9; i++) { const on = ((T * 3 | 0) + i) % 3; f.fillStyle = ['#e10600', '#ffd400', '#3ad0ff'][on]; f.fillRect(-5 + (i * 37 % 11), -5 - (i * 23 % 17), 1.2, 1.2); }
        f.fillStyle = '#ffd400'; f.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 1 : 2.4; f.lineTo(Math.cos(a) * r, -23 + Math.sin(a) * r); } f.fill();
        if (sp.presents) { f.fillStyle = '#e10600'; f.fillRect(4, -3, 4, 3); f.fillStyle = '#ffd400'; f.fillRect(5.6, -3, 0.8, 3); f.fillStyle = '#2a5ad8'; f.fillRect(-9, -2.5, 3.5, 2.5); f.fillStyle = '#fff'; f.fillRect(-7.6, -2.5, 0.7, 2.5); }
        f.restore();
      }
      if (sp.hallow) { f.save(); f.translate(32, 0); f.fillStyle = '#ff7a10'; f.beginPath(); f.ellipse(0, -2.4, 3.6, 2.6, 0, 0, TAU); f.fill(); f.fillStyle = '#3a6a1a'; f.fillRect(-0.4, -5.6, 0.9, 1.4); f.fillStyle = dark > 0.4 ? '#ffe04a' : '#3a1a00'; f.fillRect(-2, -3.4, 1, 0.9); f.fillRect(1, -3.4, 1, 0.9); f.fillRect(-1.6, -1.8, 3.2, 0.7); f.restore(); }
      if (sp.fools) { f.save(); f.translate(-47, 0); f.fillStyle = '#6a4a1a'; f.fillRect(-0.5, -12, 1, 12); f.fillStyle = '#fff'; f.fillRect(-9, -15, 18, 7); f.strokeStyle = '#e10600'; f.lineWidth = 0.6; f.strokeRect(-9, -15, 18, 7); if (o.preview) { f.fillStyle = '#e10600'; f.fillRect(-7, -13, 14, 1.2); f.fillRect(-7, -11, 10, 1); } f.restore(); }
      // campfires and bonfires
      const fire = act === 'campfire' || act === 'bonfire' || (act === 'party' && h >= 19) ? { x: act === 'bonfire' ? -8 : -10, big: act === 'bonfire' } : null;
      if (fire) {
        f.save(); f.translate(fire.x, 0);
        f.fillStyle = '#5a3a14'; f.fillRect(-4, -1.2, 8, 1.4); f.fillRect(-3, -2, 6, 1);
        if (fire.big) { f.strokeStyle = '#6a4a1a'; f.lineWidth = 1.2; for (let i = -3; i <= 3; i++) { f.beginPath(); f.moveTo(i * 2, 0); f.lineTo(i * 0.4, -14); f.stroke(); }
          // the guy on top
          f.fillStyle = '#8a6a3a'; f.fillRect(-2, -20, 4, 6); f.fillStyle = '#e8d0a0'; f.beginPath(); f.arc(0, -22, 2, 0, TAU); f.fill(); f.fillStyle = '#222'; f.fillRect(-2.4, -24.4, 4.8, 1); f.fillRect(-1.4, -26, 2.8, 1.8); }
        const fh = fire.big ? 13 : 6;
        for (let i = 0; i < 6; i++) { const ph = T * 9 + i * 1.7, hh = fh * (0.6 + 0.4 * Math.abs(Math.sin(ph))), x0 = (i - 2.5) * (fire.big ? 2 : 1.1); f.fillStyle = i % 2 ? '#ffd400' : '#ff5a10'; f.beginPath(); f.moveTo(x0 - 1.6, -1); f.quadraticCurveTo(x0 + Math.sin(ph) * 1.5, -hh * 0.6, x0 + Math.sin(ph * 1.3), -hh); f.quadraticCurveTo(x0 + 1, -hh * 0.4, x0 + 1.6, -1); f.fill(); }
        for (let i = 0; i < 4; i++) { const k = (T * 0.8 + i * 0.25) % 1; f.fillStyle = `rgba(255,200,80,${1 - k})`; f.fillRect(Math.sin(i * 7 + T) * 3, -fh - k * 14, 0.8, 0.8); }
        f.restore();
      }
      // a sandcastle that grows through the afternoon (and stays until the tide comes in at night)
      const csK = act === 'castle' ? clamp((h - 13) / 3, 0.05, 1) : (h >= 16 && h < 22 ? 1 : 0);
      if (csK > 0) {
        f.save(); f.translate(20, 0);
        f.fillStyle = '#e0c070'; f.beginPath(); f.ellipse(0, 0, 8 * Math.min(1, csK * 2.5), 2, 0, Math.PI, TAU); f.fill();
        if (csK > 0.25) { f.fillStyle = '#d8b460'; f.fillRect(-6, -5 * Math.min(1, (csK - 0.25) * 3), 12, 5 * Math.min(1, (csK - 0.25) * 3)); }
        if (csK > 0.5) { const k = Math.min(1, (csK - 0.5) * 3); f.fillStyle = '#e8c870'; f.fillRect(-7, -9 * k, 4, 9 * k); f.fillRect(3, -9 * k, 4, 9 * k); f.fillStyle = '#c8a050'; for (const x of [-7, -5.6, -4.2, 3, 4.4, 5.8]) f.fillRect(x, -10 * k, 1, 1.4 * k); f.fillStyle = '#7a5a2a'; f.fillRect(-1, -3, 2, 3); }
        if (csK > 0.8) { f.fillStyle = '#e8c870'; f.fillRect(-2, -14, 4, 9); f.strokeStyle = '#6a4a1a'; f.lineWidth = 0.4; f.beginPath(); f.moveTo(0, -14); f.lineTo(0, -19); f.stroke(); f.fillStyle = '#e10600'; f.beginPath(); f.moveTo(0, -19); f.lineTo(3.4 + Math.sin(T * 6) * 0.4, -18); f.lineTo(0, -17); f.fill(); }
        if (csK > 0.92) { f.fillStyle = '#5ab8f0'; f.fillRect(-10, 0.4, 20, 0.9); }
        f.restore();
        if (act === 'castle') { f.fillStyle = '#e10600'; f.fillRect(28, -3.5, 3, 3.5); f.strokeStyle = '#e10600'; f.lineWidth = 0.4; f.beginPath(); f.arc(29.5, -3.5, 1.6, Math.PI, TAU); f.stroke(); f.strokeStyle = '#888'; f.lineWidth = 0.6; f.beginPath(); f.moveTo(33, 0); f.lineTo(34.5, -6); f.stroke(); }
      }

      // ---- the grot: walk to where the activity happens, then do it
      let tx = HOME[act] != null ? HOME[act] : 0, pose = 'stand', fc = 1, hold = null, props = [];
      const c24 = T % 24;
      bubble.length = 0;
      const shipNear = ev.ship && ev.ship.t > 6 && ev.ship.t < 34 && act !== 'sleep';
      if (act === 'sleep') pose = 'sleep';
      else if (act === 'wake') { const c = T % 12; pose = c < 3 ? 'stretch' : c < 4.5 ? 'yawn' : 'stand'; fc = c > 8 ? -1 : 1; }
      else if (act === 'breakfast') {
        fc = -1; tx = -22;
        const bonk = ((T / 24) | 0) % 3 === 1;
        if (c24 < 3) pose = 'push';
        else if (c24 < 4.2) { pose = 'look'; const k = (c24 - 3) / 1.2; props.push(['nut', lerp(top2[0], bonk ? -22 : -26, k), lerp(top2[1] + 3, bonk ? -17 : -1, k * k)]); }
        else if (bonk && c24 < 7) { pose = 'dizzy'; props.push(['nut', -27, -1], ['stars', -22, -21]); }
        else if (c24 < 9) { pose = 'crack'; props.push(['nut', -26.5, -1.5]); }
        else if (c24 < 20) { pose = 'drink'; props.push(['drink']); }
        else { pose = 'stand'; fc = 1; }
      }
      else if (act === 'fish') {
        const cyc = (T / 20) | 0, c = T % 20, r = E.rng(cyc + 17), bite = 5 + r() * 6, boot = r() < 0.2, gull = !boot && r() < 0.3;
        pose = 'fish'; fc = 1;
        const st = { cast: c < 1.2, wait: c >= 1.2 && c < bite, bite: c >= bite && c < bite + 1.2, reel: c >= bite + 1.2 && c < bite + 2.5, show: c >= bite + 2.5 && c < bite + 6 };
        if (st.reel) pose = 'reel';
        if (st.show && gull && c > bite + 4) pose = 'angry';
        props.push(['rod', st, c, bite, boot, gull]);
        const pile = Math.min(4, cyc % 5); for (let i = 0; i < pile; i++) props.push(['pile', 33 + i * 1.6, -0.6 - (i % 2)]);
      }
      else if (act === 'lunch') { pose = 'eat'; props.push(['fishhand']); }
      else if (act === 'castle') { pose = 'build'; fc = 1; }
      else if (act === 'bottle') {
        const c = T % 36;
        if (c < 10) { pose = 'write'; tx = 0; hold = 'paper'; if (o.full) bubble.push([0, -24, sp.valentine ? 'Be my Valentine? - Zib' : sp.xmas ? 'Dear Santa, a boat please. - Zib' : 'HELP! Saucer out of petrol. Send pizza. - Zib']); }
        else if (c < 13) { pose = 'sit'; tx = 0; props.push(['bottlehand']); }
        else if (c < 18.5) { tx = 46; props.push(['bottlehand']); pose = Math.abs(gx - 46) < 0.6 ? 'throw' : 'stand'; }
        else { tx = 46; pose = c < 30 ? 'bye' : 'stand'; const cyc = (T / 36) | 0; if (thrownCyc !== cyc) { thrownCyc = cyc; bottles.push({ t: 0, x0: 50 }); } }
      }
      else if (act === 'juggle') { pose = 'juggle'; props.push(['juggle']); }
      else if (act === 'campfire') { pose = (T % 14) > 11 ? 'eat' : 'toast'; fc = -1; props.push(['toast', (T % 14) > 11]); }
      else if (act === 'bonfire') { pose = (T % 6) < 1.2 ? 'cheer' : 'sit'; fc = -1; }
      else if (act === 'party') { pose = (T % 5) < 1.5 ? 'cheer' : 'sit'; fc = -1; }
      else if (act === 'eclipse') { pose = 'look'; fc = 1; }
      if (shipNear) { tx = 44; pose = Math.abs(gx - 44) < 1 ? 'wave' : 'walk'; fc = ev.ship.dir; if (o.full) bubble.push([0, -26, ['HELP!', 'OI! OVER HERE!', 'HEEELP!', 'STOP THE BOAT!'][((T / 2) | 0) % 4]]); }
      else if (rainK > 0.3 && act !== 'sleep' && act !== 'fish') pose = 'umbrella';
      // walking
      if (act !== 'sleep' && Math.abs(gx - tx) > 0.5) { const d = Math.sign(tx - gx); gx += d * Math.min(Math.abs(tx - gx), dt * 12); fc = d; pose = 'walk'; props = props.filter(p => p[0] === 'pile' || p[0] === 'bottlehand'); hold = null; }
      face = fc;
      const hat = sp.xmas ? 'santa' : (act === 'party') ? 'party' : null;
      // props behind/around him
      for (const p of props) if (p[0] === 'pile') fishShape(f, p[1], p[2], Math.PI / 2, false);
      let gy = 0;
      if (act === 'sleep') { gy = -7; gx = -8; }
      const info = drawGrot(f, gx, gy, { pose, t: T, face, hat, glasses: act === 'eclipse', hold });
      // things he holds (worked out from his hand)
      const sit = ['crack', 'drink', 'sit', 'fish', 'reel', 'build', 'write', 'eat', 'toast', 'cheer'].includes(pose);
      const hand = a => handAt(gx, gy, face, a, sit, 0);
      for (const p of props) {
        if (p[0] === 'nut') { f.fillStyle = '#4a2a0a'; f.beginPath(); f.arc(p[1], p[2], 1.7, 0, TAU); f.fill(); }
        else if (p[0] === 'stars') { for (let i = 0; i < 3; i++) { const a = T * 4 + i * 2.1; f.fillStyle = '#ffd400'; f.fillRect(gx + Math.cos(a) * 4 - 0.6, -19 + Math.sin(a) * 1.4, 1.2, 1.2); } }
        else if (p[0] === 'drink') { const hp = hand(2.6); f.fillStyle = '#5a3a14'; f.beginPath(); f.arc(hp[0] + face * 0.5, hp[1] - 0.5, 1.8, 0, TAU); f.fill(); f.strokeStyle = '#ff3a8a'; f.lineWidth = 0.4; f.beginPath(); f.moveTo(hp[0], hp[1] - 1.5); f.lineTo(hp[0] - face * 1, hp[1] - 4); f.stroke(); }
        else if (p[0] === 'fishhand') { const hp = hand(1.6 + Math.max(0, Math.sin(T * 4)) * 1.2); fishShape(f, hp[0] + face, hp[1], 0.4 * face, false); }
        else if (p[0] === 'bottlehand') { const hp = hand(pose === 'throw' ? 3.3 - ((T * 3) % 1) * 3.5 : 1); f.fillStyle = 'rgba(120,220,160,.95)'; f.fillRect(hp[0] - 0.8, hp[1] - 2.5, 1.6, 3.4); f.fillStyle = '#c8a060'; f.fillRect(hp[0] - 0.4, hp[1] - 3.2, 0.8, 0.8); }
        else if (p[0] === 'juggle') { for (let i = 0; i < 3; i++) { const ph = (T * 1.4 + i / 3) % 1, side = ((T * 1.4 + i / 3) | 0) % 2 ? 1 : -1, x = gx + side * lerp(-3.5, 3.5, ph), y = -12 - Math.sin(ph * Math.PI) * 9; f.fillStyle = '#4a2a0a'; f.beginPath(); f.arc(x, y, 1.3, 0, TAU); f.fill(); } }
        else if (p[0] === 'toast') { const hp = hand(1.25); const ex = hp[0] + face * 9, ey = hp[1] - 2.5; f.strokeStyle = '#6a4a1a'; f.lineWidth = 0.5; f.beginPath(); f.moveTo(hp[0], hp[1]); f.lineTo(ex, ey); f.stroke(); if (!p[1]) { f.fillStyle = '#c8381b'; f.beginPath(); f.arc(ex, ey, 1.5, 0, TAU); f.fill(); f.fillStyle = '#fff'; f.fillRect(ex - 0.8, ey - 0.6, 0.5, 0.5); f.fillRect(ex + 0.3, ey - 0.6, 0.5, 0.5); f.fillStyle = 'rgba(255,255,255,.4)'; f.fillRect(ex, ey - 3 - (T * 4 % 3), 0.6, 0.6); } }
        else if (p[0] === 'rod') {
          const [, st, c, bite, boot, gull] = p;
          const hp = hand(pose === 'reel' ? 1.6 : 1.35), tip = [hp[0] + 11, hp[1] - 9 + (st.bite || st.reel ? 3 : 0)];
          f.strokeStyle = '#6a4a1a'; f.lineWidth = 0.6; f.beginPath(); f.moveTo(hp[0] - 2, hp[1] + 1.5); f.quadraticCurveTo(hp[0] + 6, hp[1] - 6, tip[0], tip[1]); f.stroke();
          f.strokeStyle = 'rgba(255,255,255,.8)'; f.lineWidth = 0.25;
          let bob = null;
          if (st.cast) { const k = c / 1.2; bob = [lerp(tip[0], 66, k), lerp(tip[1], 6, k) - Math.sin(k * Math.PI) * 6]; }
          else if (st.wait) bob = [66, 6 + Math.sin(T * 3) * 0.4];
          else if (st.bite) bob = [66, 7 + Math.abs(Math.sin(T * 14)) * 1.2];
          else if (st.reel) { const k = (c - bite - 1.2) / 1.3; bob = [lerp(66, tip[0], k), lerp(7, tip[1] + 6, k)]; }
          if (bob) { f.beginPath(); f.moveTo(tip[0], tip[1]); f.lineTo(bob[0], bob[1]); f.stroke(); f.fillStyle = '#e10600'; f.fillRect(bob[0] - 0.6, bob[1] - 0.9, 1.2, 0.9); f.fillStyle = '#fff'; f.fillRect(bob[0] - 0.6, bob[1], 1.2, 0.6); if (st.bite) { f.strokeStyle = 'rgba(255,255,255,.7)'; f.beginPath(); f.ellipse(bob[0], bob[1] + 0.8, 2.5 + Math.sin(T * 8), 0.7, 0, 0, TAU); f.stroke(); } }
          if (st.show) {
            const k = c - bite - 2.5, gullOn = gull && k > 1.2;
            if (!gullOn || k < 1.6) { f.beginPath(); f.moveTo(tip[0], tip[1]); f.lineTo(tip[0], tip[1] + 6); f.stroke(); fishShape(f, tip[0], tip[1] + 8 + (boot ? 0 : Math.sin(T * 12) * 0.3), boot ? 0 : Math.sin(T * 14) * 0.5, boot); }
            if (gull) { const gk = clamp((k - 0.4) / 2.6, 0, 1), gxp = lerp(-80, 90, gk), gyp = gk < 0.45 ? lerp(-40, tip[1] + 6, gk / 0.45) : lerp(tip[1] + 6, -50, (gk - 0.45) / 0.55); f.save(); f.translate(gxp, gyp); const fl = Math.sin(T * 16) * 2; f.strokeStyle = '#fff'; f.lineWidth = 1.2; f.beginPath(); f.moveTo(-5, -fl); f.quadraticCurveTo(-2, -2, 0, 0); f.quadraticCurveTo(2, -2, 5, -fl); f.stroke(); f.fillStyle = '#ffa020'; f.fillRect(0.6, -0.4, 1.4, 0.6); if (gk > 0.45) fishShape(f, 0, 3, Math.PI / 2, false); f.restore(); }
            if (boot && k > 0.6 && o.full) bubble.push([0, -24, 'An old boot. AGAIN.']);
          }
        }
      }
      if (act === 'sleep') { for (let i = 0; i < 3; i++) { const k = (T * 0.35 + i / 3) % 1; f.fillStyle = `rgba(255,255,255,${(1 - k).toFixed(2)})`; f.font = `bold ${3 + k * 3}px Arial`; f.fillText('Z', -12 + k * 8 + Math.sin(k * 6) * 1.5, -14 - k * 16); } }
      f.restore();
      if (sharkFront) drawShark();
      // rain
      if (rainK) { f.strokeStyle = `rgba(200,210,230,${(rainK * 0.6).toFixed(2)})`; f.lineWidth = 1; f.beginPath(); for (let i = 0; i < 120 * rainK; i++) { const x = (i * 97.3 + T * 40) % bw, y = (i * 53.1 + T * 260) % bh; f.moveTo(x, y); f.lineTo(x - 1.5, y + 5); } f.stroke(); }
      // night falls on the foreground
      if (dark > 0.02) { f.globalCompositeOperation = 'source-atop'; f.fillStyle = `rgba(8,12,44,${(dark * 0.62).toFixed(3)})`; f.fillRect(0, 0, bw, bh); f.globalCompositeOperation = 'source-over'; }
      b.drawImage(fgc, 0, 0);
      // lights: the fire glows, the pumpkin glows
      if (fire) { const fx = cx + fire.x * u, fy = cy - 3 * u, r = (fire.big ? 60 : 34) * u * (0.95 + Math.sin(T * 13) * 0.05); const gl = b.createRadialGradient(fx, fy, 1, fx, fy, r); gl.addColorStop(0, `rgba(255,170,60,${(0.2 + dark * 0.35).toFixed(2)})`); gl.addColorStop(1, 'rgba(255,120,30,0)'); b.globalCompositeOperation = 'lighter'; b.fillStyle = gl; b.fillRect(fx - r, fy - r, r * 2, r * 2); b.globalCompositeOperation = 'source-over'; }
      if (sp.hallow && dark > 0.4) { const px = cx + 32 * u, py = cy - 2.5 * u, r = 10 * u, gl = b.createRadialGradient(px, py, 0, px, py, r); gl.addColorStop(0, 'rgba(255,200,60,.5)'); gl.addColorStop(1, 'rgba(255,160,0,0)'); b.fillStyle = gl; b.fillRect(px - r, py - r, r * 2, r * 2); for (let i = 0; i < 3; i++) { const a = T * 1.5 + i * 2; const bx2 = cx + Math.cos(a) * 50 * u, by2 = horizon * 0.5 + Math.sin(a * 1.3) * 20 * u, fl = Math.sin(T * 14 + i) * 2 * u; b.fillStyle = '#111'; b.beginPath(); b.moveTo(bx2 - 4 * u, by2 - fl); b.lineTo(bx2, by2); b.lineTo(bx2 + 4 * u, by2 - fl); b.lineTo(bx2, by2 + u); b.fill(); } }
      // fireworks
      const fwOn = (act === 'bonfire' && dark > 0.3) || (act === 'party' && (h >= 21 || h < 1));
      if (fwOn && R() < dt * ((sp.nye && h > 23.9) || (sp.ny && h < 0.1) ? 6 : 1.4)) rocket();
      for (let i = fw.length - 1; i >= 0; i--) {
        const p = fw[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.kind === 'r' ? 8 : 14) * u * dt; if (p.kind === 'p') { p.vx *= 0.985; }
        if (p.kind === 'r' && (p.life < 0.3 || p.vy > -4 * u)) { boom(p); fw.splice(i, 1); continue; }
        if (p.life <= 0) { fw.splice(i, 1); continue; }
        b.fillStyle = p.col; b.globalAlpha = clamp(p.life, 0, 1); b.fillRect(p.x | 0, p.y | 0, p.kind === 'r' ? 1 : 2, p.kind === 'r' ? 2 : 2); b.globalAlpha = 1;
      }
      if (o.full && !specialSeen && (sp.bonfire || sp.xmas || sp.nye || sp.ny || sp.hallow || sp.valentine || (sp.eclipse && cover > 0) || sp.fools)) { specialSeen = true; E.secret('island.special'); }

      // ---- up onto the real screen, chunky pixels and all
      g.imageSmoothingEnabled = false;
      g.drawImage(buf, 0, 0, bw * P, bh * P);
      // crisp words on top (speech bubbles, signs, banners)
      if (!o.preview) {
        const sx = x => (cx + x * u) * P, sy = y => (cy + y * u) * P, fs = Math.max(11, Math.round(u * P * 4.2));
        g.font = `bold ${fs}px Tahoma, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (const [, y, text] of bubble) {
          const x = sx(gx), yy = sy(y), w2 = g.measureText(text).width + fs;
          g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2;
          const bx2 = Math.max(4, Math.min(W - w2 - 4, x - w2 / 2));
          g.beginPath(); g.rect(bx2, yy - fs * 0.9, w2, fs * 1.8); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(x - fs * 0.3, yy + fs * 0.9); g.lineTo(x, yy + fs * 1.6); g.lineTo(x + fs * 0.4, yy + fs * 0.9); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(x - fs * 0.3 + 1, yy + fs * 0.9 - 2, fs * 0.7 - 2, 3);
          g.fillStyle = '#000'; g.fillText(text, bx2 + w2 / 2, yy);
        }
        if (sp.fools) { g.font = `bold ${Math.max(8, Math.round(u * P * 1.7))}px Arial`; g.fillStyle = '#000'; g.fillStyle = '#e10600'; g.fillText('FOR SALE', sx(-47), sy(-12.9)); g.fillStyle = '#000'; g.fillText('1 Tazoz o.n.o.', sx(-47), sy(-10.1)); }
        const banner = sp.nye && h >= 19 ? 'PARTY LIKE IT\'S 1999!' : sp.ny && h < 1 ? 'HAPPY NEW YEAR!' : sp.bonfire && h >= 17.3 ? 'Remember, remember the 5th of November!' : sp.eclipse && cover > 0.5 ? 'TOTAL ECLIPSE! 11 August 1999 (don\'t look at the sun!)' : '';
        if (banner) { let fb = Math.max(14, Math.round(fs * 1.4)); g.font = `bold ${fb}px "Comic Sans MS", Tahoma, sans-serif`; const bwid = g.measureText(banner).width; if (bwid > W - 20) { fb = Math.max(9, Math.floor(fb * (W - 20) / bwid)); g.font = `bold ${fb}px "Comic Sans MS", Tahoma, sans-serif`; } g.fillStyle = '#000'; g.fillText(banner, W / 2 + 2, fb * 1.6 + 2); g.fillStyle = sp.bonfire ? '#ffb040' : '#ffd400'; g.fillText(banner, W / 2, fb * 1.6); }
      }
    }
    return { frame, stop() {}, _state: () => ({ act: last, gx }) };
  };
})();

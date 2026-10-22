/* BOUNCE QUEST 64 (N64, in Jack's room): a proper 3D collect-a-thon. King Grumpus has pinched the golden acorns of
 * Biscuit Island and hidden them all over the place. Bopper hops round the island (8 acorns) and through the magic
 * doors in Acorn Plaza into four worlds (Custard Cove, Frosty Flapjack Peaks, Ghoulish Ginger Manor, Tick-Tock Tower),
 * six named acorns in each, then faces King Grumpus in the Biscuit Barrel for the Crown Acorn. 33 in all.
 * Moves: jump, land-and-jump-again for a double then triple jump, a twirl in the air, long jump (run, hold Z, press A),
 * backflip (stand still, hold Z, press A), ground pound (Z in the air), wall kick (jump at a wall, press A as you touch
 * it), punch-punch-kick (B), jump kick (B in the air). Camera: L / R turn it round (like the yellow C buttons).
 * Health is a biscuit that loses a bite when you're hit; coins put bites back. Talk to people and read signs with B.
 * Progress (acorns, lives, options, the high-score table) is saved as you go: CONTINUE on the title carries on.
 * Soft, foggy, blurry and Gouraud-shaded, like it should be. Original everything: characters, worlds, tunes. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const GID = 'n64.hop';
  const SECRETS = [
    ['rm.hop.king', 'Crumbs!', 'Somebody very grumpy is waiting behind the last door in Bounce Quest 64.'],
    ['rm.hop.every', 'Every Last Acorn', 'There are thirty-three golden acorns in Bounce Quest 64. Find the lot.'],
    ['rm.hop.wall', 'Wall Kicker', 'In Bounce Quest 64, a certain golden acorn can only be reached by kicking off walls.'],
  ];
  for (const [id, n, h] of SECRETS) { try { if (window.Apps && Apps.defineSecret && !(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, h); } catch (e) {} }

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ex = (x, z, cx, cz, s) => Math.exp(-((x - cx) * (x - cx) + (z - cz) * (z - cz)) / s);
  const wrapA = d => { while (d > Math.PI) d -= 6.283185; while (d < -Math.PI) d += 6.283185; return d; };
  const TAU = Math.PI * 2;

  // ================================================================ the tunes (16th-note steps; 0 rest, -1 hold)
  const SONGS = {
    title: { bpm: 120, wave: 'square', vol: 0.045, bassWave: 'triangle',
      lead: [72, 0, 76, 0, 79, 0, 84, -1, -1, 0, 83, 0, 81, 0, 79, 0, 77, 0, 81, 0, 84, 0, 88, -1, -1, 0, 86, 0, 84, 0, 83, 0,
        81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 74, 0, 76, 0, 77, -1, -1, 0, 79, -1, -1, 0, 72, -1, -1, -1, 0, 0, 0, 0],
      bass: [48, 0, 0, 0, 55, 0, 0, 0, 48, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 57, 0, 0, 0, 53, 0, 0, 0, 57, 0, 0, 0,
        50, 0, 0, 0, 57, 0, 0, 0, 55, 0, 0, 0, 59, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0, 48, 0, 0, 0, 43, 0, 0, 0],
      drums: 'o...x...o.o.x...' },
    hub: { bpm: 132, wave: 'triangle', vol: 0.07, bassWave: 'triangle',
      lead: [67, 0, 72, 0, 76, 0, 79, -1, 77, 76, 74, 0, 72, -1, -1, 0, 69, 0, 72, 0, 77, 0, 81, -1, 79, 77, 76, 0, 74, -1, -1, 0,
        67, 0, 72, 0, 76, 0, 79, -1, 81, 79, 77, 0, 76, 0, 74, 0, 72, 0, 74, 0, 76, 0, 74, 72, 71, 0, 72, -1, -1, -1],
      bass: [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 60, 0, 57, 0, 48, 0, 55, 0, 52, 0, 55, 0, 43, 0, 47, 0, 50, 0, 55, 0],
      drums: 'o...x...o.o.x...' },
    cove: { bpm: 116, wave: 'triangle', vol: 0.075, bassWave: 'square',
      lead: [79, 0, 0, 76, 0, 79, 0, 81, 0, 79, 76, 0, 72, 0, 0, 0, 74, 0, 0, 77, 0, 81, 0, 79, 0, 77, 74, 0, 71, 0, 0, 0,
        79, 0, 0, 76, 0, 79, 0, 84, 0, 83, 81, 0, 79, 0, 76, 0, 77, 0, 76, 0, 74, 0, 71, 0, 72, -1, -1, -1, 0, 0, 0, 0],
      bass: [48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 60, 0, 53, 0, 60, 0, 50, 0, 57, 0, 55, 0, 59, 0, 48, 0, 55, 0, 48, 0, 52, 55],
      drums: 'o..xo.x.o..xo.x.' },
    peaks: { bpm: 100, wave: 'sine', vol: 0.09, bassWave: 'triangle',
      lead: [76, -1, -1, 79, -1, -1, 84, -1, -1, -1, 83, -1, 81, -1, -1, -1, 79, -1, -1, 77, -1, -1, 76, -1, -1, -1, 74, -1, 72, -1, -1, -1,
        74, -1, -1, 77, -1, -1, 81, -1, -1, -1, 79, -1, 77, -1, 76, -1, 74, -1, -1, 72, -1, -1, 71, -1, 72, -1, -1, -1, -1, -1, -1, -1],
      bass: [48, 0, 0, 0, 55, 0, 0, 0, 52, 0, 0, 0, 55, 0, 0, 0, 45, 0, 0, 0, 52, 0, 0, 0, 50, 0, 0, 0, 55, 0, 0, 0],
      drums: '..x...x...x...x.' },
    manor: { bpm: 92, wave: 'triangle', vol: 0.08, bassWave: 'sine',
      lead: [69, 0, 72, 0, 76, 0, 75, 0, 76, -1, 72, 0, 69, -1, -1, 0, 68, 0, 71, 0, 74, 0, 73, 0, 74, -1, 71, 0, 68, -1, -1, 0,
        69, 0, 72, 0, 76, 0, 79, 0, 81, -1, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 71, 0, 68, 0, 69, -1, -1, -1, 0, 0, 0, 0],
      bass: [45, 0, 0, 0, 52, 0, 0, 0, 45, 0, 0, 0, 52, 0, 0, 0, 44, 0, 0, 0, 52, 0, 0, 0, 44, 0, 0, 0, 52, 0, 0, 0],
      drums: 'o.......x.......' },
    tower: { bpm: 138, wave: 'square', vol: 0.04, bassWave: 'triangle',
      lead: [72, 0, 79, 0, 76, 0, 79, 0, 72, 0, 79, 0, 76, 0, 79, 0, 74, 0, 79, 0, 77, 0, 79, 0, 74, 0, 79, 0, 77, 0, 79, 0,
        76, 0, 84, 0, 79, 0, 84, 0, 77, 0, 83, 0, 79, 0, 83, 0, 76, 0, 79, 0, 74, 0, 77, 0, 72, -1, -1, 0, 0, 0, 0, 0],
      bass: [36, 0, 0, 0, 43, 0, 0, 0, 36, 0, 0, 0, 43, 0, 0, 0, 38, 0, 0, 0, 43, 0, 0, 0, 38, 0, 0, 0, 43, 0, 0, 0],
      drums: 'x...x...x...x...' },
    boss: { bpm: 168, wave: 'sawtooth', vol: 0.035, bassWave: 'square',
      lead: [64, 0, 64, 0, 67, 0, 64, 0, 70, 0, 69, 0, 67, 0, 64, 0, 62, 0, 62, 0, 65, 0, 62, 0, 69, 0, 67, 0, 65, 0, 62, 0,
        64, 0, 64, 0, 67, 0, 64, 0, 72, 0, 71, 0, 70, 0, 69, 0, 67, 0, 65, 0, 64, 0, 62, 0, 64, -1, -1, 0, 0, 0, 0, 0],
      bass: [40, 40, 0, 40, 40, 0, 40, 0, 38, 38, 0, 38, 38, 0, 38, 0],
      drums: 'o.x.o.x.o.xxo.x.' },
    ending: { bpm: 104, wave: 'triangle', vol: 0.08, bassWave: 'sine',
      lead: [72, -1, 76, -1, 79, -1, 84, -1, 83, -1, 79, -1, 81, -1, -1, -1, 77, -1, 81, -1, 84, -1, 86, -1, 84, -1, 81, -1, 79, -1, -1, -1,
        76, -1, 79, -1, 84, -1, 88, -1, 86, -1, 84, -1, 83, -1, 81, -1, 79, -1, 77, -1, 76, -1, 74, -1, 72, -1, -1, -1, -1, -1, -1, -1],
      bass: [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 53, 0, 57, 0, 50, 0, 57, 0, 55, 0, 59, 0, 48, 0, 52, 0, 55, 0, 52, 0],
      drums: 'o.......x.......' },
  };

  TV.game(GID, {
    three: true, stick: true, buttons: ['a', 'b', 'c', 'l', 'r'],
    help: 'Run: arrows. Jump: Z (land and jump again: double, triple). Punch / talk: X. Crouch, ground pound, long jump: C. Camera: U / E. Pause: Enter.',
    make(K) {
      const T3 = K.three({ fov: 60, near: 0.3, far: 420, fogCol: 0xa8d4f8, fogNear: 50, fogFar: 170 }), T = T3.T, hud = K.hud, F = K.font, W = K.W, H = K.H;
      const LT = T3.lights({ amb: 0.8, sun: 0.75, dir: [0.4, 1, 0.3], skyCol: 0xf0f8ff, groundCol: 0x5a7a4a });
      const rnd = K.rnd(64);
      const V3 = (x, y, z) => new T.Vector3(x, y, z);
      const tv = new T.Vector3(), tv2 = new T.Vector3();
      const L = b => K.label(b);

      // ---------------------------------------------------------------- geometry: merged, vertex-coloured, world-UV'd parts
      const _e = new T.Euler(), _q = new T.Quaternion(), _p = new T.Vector3(), _s = new T.Vector3();
      function M(x, y, z, rx, ry, rz, sx, sy, sz) { _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy, sz == null ? (sx == null ? 1 : sx) : sz); return new T.Matrix4().compose(_p, _q, _s); }
      const GC = {}; // shared unit shapes
      const S = {
        box: () => GC.box || (GC.box = new T.BoxGeometry(1, 1, 1)),
        ball: (s) => GC['b' + (s || 12)] || (GC['b' + (s || 12)] = new T.SphereGeometry(0.5, s || 12, Math.max(6, ((s || 12) * 0.7) | 0))),
        cyl: (s, top) => GC['c' + (s || 12) + '_' + (top == null ? 1 : top)] || (GC['c' + (s || 12) + '_' + (top == null ? 1 : top)] = new T.CylinderGeometry(0.5 * (top == null ? 1 : top), 0.5, 1, s || 12)),
        cone: (s) => GC['k' + (s || 10)] || (GC['k' + (s || 10)] = new T.ConeGeometry(0.5, 1, s || 10)),
        tor: (t, s) => GC['t' + t + '_' + (s || 16)] || (GC['t' + t + '_' + (s || 16)] = new T.TorusGeometry(0.5, t, 6, s || 16)),
        ico: () => GC.ico || (GC.ico = new T.IcosahedronGeometry(0.5, 0)),
        dod: () => GC.dod || (GC.dod = new T.DodecahedronGeometry(0.5, 0)),
        hemi: (s) => GC['h' + (s || 12)] || (GC['h' + (s || 12)] = new T.SphereGeometry(0.5, s || 12, 6, 0, TAU, 0, Math.PI / 2)),
      };
      // a part: { geo, c (hex), m (Matrix4), sh (0..1 darker at the bottom), uv (world-UV scale, for textured buckets) }
      const pt = (geo, c, x, y, z, sx, sy, sz, rx, ry, rz, sh) => ({ geo, c, m: M(x || 0, y || 0, z || 0, rx, ry, rz, sx, sy, sz), sh: sh || 0 });
      const ptM = (geo, c, m, sh) => ({ geo, c, m, sh: sh || 0 });
      const col = new T.Color();
      function merge(parts, uvScale) {
        let n = 0;
        const gs = parts.map(p => { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone(); g.applyMatrix4(p.m); n += g.attributes.position.count; return g; });
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), cl = new Float32Array(n * 3), uv = uvScale ? new Float32Array(n * 2) : null;
        let o = 0;
        gs.forEach((g, i) => {
          const P = g.attributes.position.array, N = g.attributes.normal.array, cnt = g.attributes.position.count, p = parts[i];
          pos.set(P, o * 3); nor.set(N, o * 3); col.set(p.c);
          let y0 = 1e9, y1 = -1e9; if (p.sh) for (let k = 0; k < cnt; k++) { const y = P[k * 3 + 1]; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          for (let k = 0; k < cnt; k++) {
            const f = p.sh ? 1 - p.sh * (1 - clamp((P[k * 3 + 1] - y0) / ((y1 - y0) || 1), 0, 1)) : 1;
            cl[(o + k) * 3] = col.r * f; cl[(o + k) * 3 + 1] = col.g * f; cl[(o + k) * 3 + 2] = col.b * f;
            if (uv) { // world-space UVs picked by the face direction, so textures tile at the same size everywhere
              const nx = Math.abs(N[k * 3]), ny = Math.abs(N[k * 3 + 1]), nz = Math.abs(N[k * 3 + 2]), x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2], s = p.uv || uvScale;
              if (ny > nx && ny > nz) { uv[(o + k) * 2] = x / s; uv[(o + k) * 2 + 1] = z / s; } else if (nx > nz) { uv[(o + k) * 2] = z / s; uv[(o + k) * 2 + 1] = y / s; } else { uv[(o + k) * 2] = x / s; uv[(o + k) * 2 + 1] = y / s; }
            }
          }
          o += cnt; g.dispose();
        });
        const out = new T.BufferGeometry();
        out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); out.setAttribute('color', new T.BufferAttribute(cl, 3));
        if (uv) out.setAttribute('uv', new T.BufferAttribute(uv, 2));
        out.computeBoundingSphere();
        return out;
      }
      const MC = {}; // materials, made once
      const mat = (key, p) => MC[key] || (MC[key] = T3.mat(p));
      const matV = () => mat('v', { vcol: true });
      const matVB = () => mat('vb', { vcol: true, lit: false });

      // ---------------------------------------------------------------- textures (small and blurry, the N64 way)
      const TX = {};
      const tex = (key, w, h, paint) => TX[key] || (TX[key] = T3.tex(w, h, paint));
      const speck = (g, w, h, cols, n, sz) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; const s = sz || 2; g.fillRect(rnd() * w | 0, rnd() * h | 0, s + (rnd() * s | 0), s); } };
      const TEX = {
        detail: () => tex('detail', 64, 64, (g, w, h) => { g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, w, h); speck(g, w, h, ['#e8e8e8', '#b8b8b8', '#f4f4f4', '#a8a8a8'], 260, 2); for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(rnd() * w | 0, rnd() * h | 0, 1, 3); } }),
        brick: () => tex('brick', 64, 64, (g, w, h) => { g.fillStyle = '#d8d0c0'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 16 - 16; x < w; x += 32) { g.fillStyle = ['#e8e0d0', '#d0c4b0', '#e0d4c0'][(x + y) / 16 & 1]; g.fillRect(x + 1, y + 1, 30, 14); } speck(g, w, h, ['#c0b4a0', '#f0e8d8'], 80, 1); }),
        sandbrick: () => tex('sandbrick', 64, 64, (g, w, h) => { g.fillStyle = '#f0d898'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8b878'; for (let y = 0; y < h; y += 16) { g.fillRect(0, y, w, 2); for (let x = (y / 16 % 2) * 16; x < w; x += 32) g.fillRect(x, y, 2, 16); } speck(g, w, h, ['#e0c080', '#fff0c0'], 120, 1); }),
        wood: () => tex('wood', 32, 32, (g, w, h) => { g.fillStyle = '#b07a42'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a4a22'; for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 1); g.fillStyle = '#c8945a'; for (let i = 0; i < 24; i++) g.fillRect(rnd() * w | 0, rnd() * h | 0, 5, 1); g.fillStyle = '#5a3a1a'; for (let y = 0; y < h; y += 8) g.fillRect(((y * 7) % 28) + 2, y + 3, 1, 1); }),
        crate: () => tex('crate', 32, 32, (g, w, h) => { g.fillStyle = '#c88a4a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a4a1a'; g.lineWidth = 3; g.strokeRect(2, 2, 28, 28); g.beginPath(); g.moveTo(3, 3); g.lineTo(29, 29); g.stroke(); }),
        stripe: () => tex('stripe', 16, 32, g => { for (let y = 0; y < 32; y += 16) { g.fillStyle = '#e83a2a'; g.fillRect(0, y, 16, 8); g.fillStyle = '#ffffff'; g.fillRect(0, y + 8, 16, 8); } }),
        roof: () => tex('roof', 32, 32, (g, w, h) => { g.fillStyle = '#7a2a3a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = (y / 8 % 2) * 4 - 8; x < w; x += 8) { g.fillStyle = (x + y) % 16 ? '#9a3a4a' : '#8a3242'; g.beginPath(); g.arc(x + 4, y + 2, 4, 0, Math.PI); g.fill(); } }),
        ginger: () => tex('ginger', 64, 64, (g, w, h) => { g.fillStyle = '#a8642a'; g.fillRect(0, 0, w, h); speck(g, w, h, ['#94541e', '#b8743a', '#8a4a18'], 220, 2); g.fillStyle = '#fff4e8'; for (let y = 6; y < h; y += 16) for (let x = 6; x < w; x += 16) { g.beginPath(); g.arc(x + (y % 32 ? 8 : 0), y, 1.6, 0, 7); g.fill(); } }),
        hedge: () => tex('hedge', 32, 32, (g, w, h) => { g.fillStyle = '#2a5a2a'; g.fillRect(0, 0, w, h); speck(g, w, h, ['#3a7a3a', '#1e4a24', '#4a8a4a'], 140, 2); }),
        metal: () => tex('metal', 32, 32, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e8c070'); gr.addColorStop(0.5, '#b88a3a'); gr.addColorStop(1, '#e0b060'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#7a5a1a'; for (const [x, y] of [[4, 4], [28, 4], [4, 28], [28, 28]]) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, 14, w, 2); }),
        cobble: () => tex('cobble', 64, 64, (g, w, h) => { g.fillStyle = '#6a6470'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { const x = rnd() * w, y = rnd() * h, r = 4 + rnd() * 4; g.fillStyle = ['#8a8490', '#7a7480', '#9a94a0'][i % 3]; g.beginPath(); g.ellipse(x, y, r, r * 0.8, rnd() * 3, 0, 7); g.fill(); } }),
        ice: () => tex('ice', 32, 32, (g, w, h) => { g.fillStyle = '#bfe8ff'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.stroke(); } }),
        water: () => tex('water', 64, 64, (g, w, h) => { g.fillStyle = '#2a8ad8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 46; i++) { g.fillStyle = i % 3 ? 'rgba(255,255,255,.28)' : 'rgba(10,60,140,.3)'; g.fillRect(rnd() * w | 0, rnd() * h | 0, 4 + rnd() * 8 | 0, 1); } }),
        lava: () => tex('lava', 64, 64, (g, w, h) => { g.fillStyle = '#c8280a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { const x = rnd() * w, y = rnd() * h, r = 3 + rnd() * 7; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#ffe84a'); gr.addColorStop(0.5, '#ff8a1a'); gr.addColorStop(1, 'rgba(200,40,10,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }),
        cloud: () => tex('cloud', 64, 32, (g, w, h) => { for (let i = 0; i < 9; i++) { const x = 10 + rnd() * 44, y = 12 + rnd() * 10, r = 7 + rnd() * 8; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.6, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }),
        shadow: () => tex('shadow', 32, 32, g => { const gr = g.createRadialGradient(16, 16, 2, 16, 16, 15); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.7, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }),
        clock: () => tex('clock', 128, 128, g => {
          g.fillStyle = '#c8a050'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#fff8e0'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.strokeStyle = '#6a4a1a'; g.lineWidth = 4; g.stroke();
          g.fillStyle = '#3a2a1a'; g.font = 'bold 13px Georgia,serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((s, i) => { const a = i / 12 * TAU - Math.PI / 2; g.fillText(s, 64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); });
        }),
        sign: () => tex('sign', 32, 32, g => { g.fillStyle = '#c8945a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#7a4a22'; for (let y = 4; y < 32; y += 7) g.fillRect(4, y, 18 + (y * 3) % 8, 2); }),
      };
      // the door paintings: one per world
      function doorTex(k) {
        return tex('door' + k, 64, 96, g => {
          const P = [['#2a9ad8', '#ffe08a'], ['#a8d0f0', '#ffffff'], ['#3a2a5a', '#c8a0ff'], ['#e88a3a', '#ffe0a0'], ['#5a0a0a', '#ffb02a']][k];
          const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, P[0]); gr.addColorStop(1, '#101020'); g.fillStyle = gr; g.fillRect(0, 0, 64, 96);
          g.save(); g.translate(32, 44);
          if (k === 0) { g.fillStyle = '#ffe08a'; g.beginPath(); g.ellipse(0, 26, 30, 10, 0, 0, 7); g.fill(); g.fillStyle = '#f08ab0'; g.beginPath(); for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI; g.lineTo(Math.cos(a) * 16, Math.sin(a) * 16 + 4); } g.fill(); g.strokeStyle = '#a04a70'; g.lineWidth = 1.5; for (let i = 1; i < 8; i++) { const a = Math.PI + i / 8 * Math.PI; g.beginPath(); g.moveTo(0, 4); g.lineTo(Math.cos(a) * 16, Math.sin(a) * 16 + 4); g.stroke(); } }
          else if (k === 1) { g.strokeStyle = '#fff'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -20); g.moveTo(0, -12); g.lineTo(-6, -17); g.moveTo(0, -12); g.lineTo(6, -17); g.stroke(); } }
          else if (k === 2) { g.fillStyle = '#f0f0ff'; g.beginPath(); g.arc(0, -4, 15, Math.PI, 0); g.lineTo(15, 16); for (let i = 0; i < 5; i++) g.lineTo(15 - (i + 0.5) * 6, i % 2 ? 16 : 11); g.lineTo(-15, 16); g.fill(); g.fillStyle = '#201030'; g.beginPath(); g.arc(-5, -4, 3, 0, 7); g.arc(5, -4, 3, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, 5, 3, 4, 0, 0, 7); g.fill(); }
          else if (k === 3) { g.fillStyle = '#fff8e0'; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -14); g.moveTo(0, 0); g.lineTo(10, 4); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.stroke(); }
          else { g.fillStyle = '#ffd23a'; g.beginPath(); g.moveTo(-18, 10); g.lineTo(-18, -8); g.lineTo(-9, 2); g.lineTo(0, -14); g.lineTo(9, 2); g.lineTo(18, -8); g.lineTo(18, 10); g.closePath(); g.fill(); g.fillStyle = '#e8261c'; g.beginPath(); g.arc(0, 2, 3, 0, 7); g.fill(); }
          g.restore();
          g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 93);
          g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(54, 56, 3, 0, 7); g.fill();
        });
      }
      function skyTex(key, stops) { return tex('sky' + key, 8, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); }); }

      // ---------------------------------------------------------------- the particles (one instanced mesh)
      const NP = 90;
      const pMesh = new T.InstancedMesh(T3.keep(new T.IcosahedronGeometry(0.5, 0)), T3.mat({ color: 0xffffff, lit: false }), NP);
      pMesh.frustumCulled = false; T3.add(pMesh);
      const parts = []; for (let i = 0; i < NP; i++) { parts.push({ t: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0.2, g: 18 }); pMesh.setColorAt(i, col.set(0xffffff)); }
      const pz = new T.Matrix4().makeScale(0, 0, 0), pdum = new T.Object3D();
      let pNext = 0;
      function burst(x, y, z, c, n, sp, o) {
        o = o || {};
        for (let i = 0; i < n; i++) {
          const p = parts[pNext]; pNext = (pNext + 1) % NP;
          const a = Math.random() * TAU, up = o.up == null ? 1 : o.up;
          p.t = p.t0 = (o.life || 0.6) * (0.7 + Math.random() * 0.6); p.x = x; p.y = y; p.z = z;
          p.vx = Math.cos(a) * sp * (o.ring ? 1 : Math.random()); p.vz = Math.sin(a) * sp * (o.ring ? 1 : Math.random()); p.vy = (o.ring ? 0.5 : Math.random()) * sp * up;
          p.s = (o.size || 0.22) * (0.7 + Math.random() * 0.6); p.g = o.grav == null ? 18 : o.grav;
          pMesh.setColorAt(pNext === 0 ? NP - 1 : pNext - 1, col.set(Array.isArray(c) ? c[i % c.length] : c));
        }
        pMesh.instanceColor.needsUpdate = true;
      }
      function partsUpdate(dt) {
        for (let i = 0; i < NP; i++) {
          const p = parts[i];
          if (p.t <= 0) { pMesh.setMatrixAt(i, pz); continue; }
          p.t -= dt; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          const k = Math.max(0, p.t / p.t0) * p.s;
          pdum.position.set(p.x, p.y, p.z); pdum.rotation.set(p.t * 7, p.t * 5, 0); pdum.scale.set(k, k, k); pdum.updateMatrix(); pMesh.setMatrixAt(i, pdum.matrix);
        }
        pMesh.instanceMatrix.needsUpdate = true;
      }

      // ---------------------------------------------------------------- blob shadows (one instanced mesh, up to 24)
      const shGeo = new T.PlaneGeometry(1, 1); shGeo.rotateX(-Math.PI / 2);
      const shMat = T3.mat({ map: TEX.shadow(), transparent: true, lit: false }); shMat.depthWrite = false; shMat.polygonOffset = true; shMat.polygonOffsetFactor = -2;
      const shMesh = new T.InstancedMesh(T3.keep(shGeo), shMat, 24); shMesh.frustumCulled = false; shMesh.renderOrder = 2; T3.add(shMesh);
      let shN = 0;
      function shadow(x, y, z, r) { if (shN >= 24) return; pdum.position.set(x, y + 0.04, z); pdum.rotation.set(0, 0, 0); pdum.scale.set(r * 2, 1, r * 2); pdum.updateMatrix(); shMesh.setMatrixAt(shN++, pdum.matrix); }
      function shadowsEnd() { for (let i = shN; i < 24; i++) shMesh.setMatrixAt(i, pz); shMesh.instanceMatrix.needsUpdate = true; shN = 0; }

      // ---------------------------------------------------------------- BOPPER (a round little hero: cap, rucksack, big boots)
      const BOP = (function () {
        const root = new T.Group(), m = new T.Group(); root.add(m); T3.add(root);
        const OR = 0xff9a32, CR = 0xffe2b0, BL = 0x2a5ae0, WH = 0xffffff, BR = 0x7a3a12, RD = 0xe8261c, BK = 0x141018, YE = 0xffd23a;
        const mesh = (P, parent) => { const me = new T.Mesh(T3.keep(merge(P)), matV()); (parent || m).add(me); return me; };
        // body (pivot: hips)
        const hips = new T.Group(); hips.position.y = 0.42; m.add(hips);
        const torso = mesh([pt(S.ball(14), OR, 0, 0.2, 0, 0.84, 0.86, 0.8), pt(S.ball(12), CR, 0, 0.16, -0.22, 0.56, 0.6, 0.4),
          pt(S.ball(10), RD, 0, 0.3, 0.36, 0.56, 0.62, 0.36), pt(S.box(), 0x9a1a14, 0, 0.36, 0.52, 0.34, 0.08, 0.1), pt(S.cyl(8), 0x5a2a12, 0.2, 0.4, 0.04, 0.05, 0.62, 0.05, 0.5), pt(S.cyl(8), 0x5a2a12, -0.2, 0.4, 0.04, 0.05, 0.62, 0.05, 0.5),
          pt(S.ball(8), YE, 0, 0.42, 0.55, 0.12, 0.12, 0.08)], hips);
        const head = new T.Group(); head.position.y = 0.56; hips.add(head);
        mesh([pt(S.ball(16), OR, 0, 0.32, 0, 0.94, 0.88, 0.9), pt(S.ball(12), CR, 0, 0.13, -0.33, 0.5, 0.32, 0.3), pt(S.ball(10), 0x5a1a10, 0, 0.23, -0.49, 0.17, 0.13, 0.13),
          pt(S.hemi(14), BL, 0, 0.5, 0.03, 0.98, 0.74, 0.98), pt(S.cyl(14), BL, 0, 0.52, -0.38, 0.86, 0.05, 0.52, -0.38), pt(S.cyl(14, 1.02), 0xffffff, 0, 0.5, 0.03, 0.99, 0.05, 0.99),
          pt(S.ball(10), WH, 0, 0.74, -0.26, 0.26, 0.26, 0.1, -0.6), pt(S.ball(8), YE, 0, 0.75, -0.28, 0.16, 0.18, 0.08, -0.6), pt(S.ball(8), BL, 0, 0.88, 0.03, 0.12, 0.1, 0.12),
          pt(S.ball(8), OR, 0.43, 0.5, 0.08, 0.2, 0.24, 0.12), pt(S.ball(8), OR, -0.43, 0.5, 0.08, 0.2, 0.24, 0.12),
          pt(S.box(), 0x3a1a0a, 0, 0.05, -0.43, 0.16, 0.03, 0.04), pt(S.box(), 0x3a1a0a, 0.09, 0.07, -0.42, 0.06, 0.03, 0.04, 0, 0, -0.5), pt(S.box(), 0x3a1a0a, -0.09, 0.07, -0.42, 0.06, 0.03, 0.04, 0, 0, 0.5)], head);
        const eyes = mesh([pt(S.ball(10), WH, 0.16, 0.36, -0.38, 0.21, 0.29, 0.13), pt(S.ball(10), WH, -0.16, 0.36, -0.38, 0.21, 0.29, 0.13), pt(S.ball(8), BK, 0.15, 0.34, -0.445, 0.1, 0.16, 0.04), pt(S.ball(8), BK, -0.15, 0.34, -0.445, 0.1, 0.16, 0.04),
          pt(S.ball(6), WH, 0.17, 0.38, -0.465, 0.035, 0.05, 0.02), pt(S.ball(6), WH, -0.13, 0.38, -0.465, 0.035, 0.05, 0.02)], head);
        const arm = s => { const g = new T.Group(); g.position.set(s * 0.38, 0.38, 0); hips.add(g); mesh([pt(S.ball(8), OR, 0, -0.02, 0, 0.24, 0.24, 0.24), pt(S.cyl(8), OR, 0, -0.17, 0, 0.2, 0.32, 0.2), pt(S.cyl(10), WH, 0, -0.31, 0, 0.27, 0.08, 0.27), pt(S.ball(10), WH, 0, -0.42, 0, 0.32, 0.3, 0.32), pt(S.ball(8), WH, s * 0.13, -0.38, -0.08, 0.13, 0.13, 0.13)], g); return g; };
        const leg = s => { const g = new T.Group(); g.position.set(s * 0.18, 0.02, 0); hips.add(g); mesh([pt(S.cyl(8), OR, 0, -0.1, 0, 0.18, 0.22, 0.18), pt(S.ball(10), BR, 0, -0.3, -0.07, 0.3, 0.24, 0.46, 0, 0, 0, 0.4), pt(S.cyl(10), WH, 0, -0.2, 0, 0.27, 0.07, 0.27)], g); return g; };
        return { root, m, hips, torso, head, eyes, armL: arm(1), armR: arm(-1), legL: leg(1), legR: leg(-1), blink: 2 };
      })();

      // ================================================================ the world kit
      // solids: boxes (oriented: ry) and round towers. y is the bottom when you make one; stored as a centre + half sizes.
      let WG = null, BK = null, WD = null; // the current world's group, its geometry buckets, its definition
      const BOXES = [], CYLS = [], MOVERS = [];
      const BUCKET = {
        v: { mat: matV }, vb: { mat: matVB },
        brick: { uv: 3, mat: () => mat('t_brick', { vcol: true, map: TEX.brick() }) },
        sandbrick: { uv: 3, mat: () => mat('t_sandbrick', { vcol: true, map: TEX.sandbrick() }) },
        wood: { uv: 2, mat: () => mat('t_wood', { vcol: true, map: TEX.wood() }) },
        crate: { uv: 1.8, mat: () => mat('t_crate', { vcol: true, map: TEX.crate() }) },
        stripe: { uv: 3, mat: () => mat('t_stripe', { vcol: true, map: TEX.stripe() }) },
        roof: { uv: 2, mat: () => mat('t_roof', { vcol: true, map: TEX.roof() }) },
        ginger: { uv: 3, mat: () => mat('t_ginger', { vcol: true, map: TEX.ginger() }) },
        hedge: { uv: 2, mat: () => mat('t_hedge', { vcol: true, map: TEX.hedge() }) },
        metal: { uv: 2, mat: () => mat('t_metal', { vcol: true, map: TEX.metal() }) },
        cobble: { uv: 4, mat: () => mat('t_cobble', { vcol: true, map: TEX.cobble() }) },
        ice: { uv: 3, mat: () => mat('t_ice', { vcol: true, map: TEX.ice() }) },
        detail: { uv: 4, mat: () => mat('t_detail', { vcol: true, map: TEX.detail() }) },
        sign: { uv: 1, mat: () => mat('t_sign', { vcol: true, map: TEX.sign() }) },
        belt: { uv: 2, mat: () => mat('t_belt', { vcol: true, map: (BELT = tex('belt', 32, 32, g => { g.fillStyle = '#3a3a44'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#ffd23a'; for (let x = 0; x < 32; x += 16) { g.beginPath(); g.moveTo(x + 12, 8); g.lineTo(x + 4, 16); g.lineTo(x + 12, 24); g.lineTo(x + 8, 24); g.lineTo(x, 16); g.lineTo(x + 8, 8); g.fill(); } })) }) },
      };
      let BELT = null;
      function buckets() {
        const B = {};
        return {
          add(key, part) { (B[key] || (B[key] = [])).push(part); },
          flush(into) { for (const k in B) { if (!B[k].length) continue; const spec = BUCKET[k]; const me = new T.Mesh(merge(B[k], spec.uv), spec.mat()); (into || WG).add(me); } },
        };
      }
      function solidBox(x, y, z, w, h, d, ry) { const b = { k: 'box', x, y: y + h / 2, z, hw: w / 2, hh: h / 2, hd: d / 2, ry: ry || 0 }; b.cs = Math.cos(b.ry); b.sn = Math.sin(b.ry); BOXES.push(b); return b; }
      function box(x, y, z, w, h, d, o) { // y = the bottom
        o = o || {}; const ry = o.ry || 0;
        const b = o.solid === false ? null : solidBox(x, y, z, w, h, d, ry);
        if (o.vis !== false) BK.add(o.t || 'v', ptM(S.box(), o.c == null ? 0xffffff : o.c, M(x, y + h / 2, z, 0, ry, 0, w, h, d), o.sh == null ? 0.3 : o.sh));
        if (b) Object.assign(b, o.props || {});
        return b;
      }
      function cyl(x, y, z, r, h, o) {
        o = o || {};
        const c = o.solid === false ? null : { k: 'cyl', x, z, r: o.cr || r, y0: y, y1: y + h };
        if (c) { CYLS.push(c); Object.assign(c, o.props || {}); }
        if (o.vis !== false) BK.add(o.t || 'v', ptM(S.cyl(o.seg || 14, o.top), o.c == null ? 0xffffff : o.c, M(x, y + h / 2, z, 0, 0, 0, r * 2, h, r * 2), o.sh == null ? 0.3 : o.sh));
        return c;
      }
      const deco = (part, key) => BK.add(key || 'v', part);
      // something that moves: its own mesh, a solid that follows it, and a function of time that places it
      function mover(kind, w, h, d, o, place) {
        const P = o.parts || [ptM(S.box(), o.c == null ? 0xffffff : o.c, M(0, 0, 0, 0, 0, 0, w, h, d), 0.3)];
        const spec = BUCKET[o.t || 'v'];
        const mesh = new T.Mesh(merge(P, spec.uv), spec.mat()); WG.add(mesh);
        const s = kind === 'box' ? { k: 'box', x: 0, y: 0, z: 0, hw: w / 2, hh: h / 2, hd: d / 2, ry: 0, cs: 1, sn: 0 } : { k: 'cyl', x: 0, z: 0, r: w, y0: 0, y1: 0, h };
        s.mv = true; s.mesh = mesh; s.place = place; Object.assign(s, o.props || {});
        (kind === 'box' ? BOXES : CYLS).push(s); MOVERS.push(s);
        place(s, 0); sync(s); s.px = s.x; s.py = s.k === 'box' ? s.y : s.y1; s.pz = s.z; s.pry = s.ry || 0;
        return s;
      }
      function sync(s) { if (s.k === 'box') { s.cs = Math.cos(s.ry); s.sn = Math.sin(s.ry); s.mesh.position.set(s.x, s.y, s.z); s.mesh.rotation.y = s.ry; } else { s.mesh.position.set(s.x, (s.y0 + s.y1) / 2, s.z); s.mesh.rotation.y = s.ry || 0; } }

      // terrain: a heightfield with vertex colours over a speckly detail texture (the N64 trick)
      function terrain(size, N, cx, cz, fn, colFn) {
        const g = new T.PlaneGeometry(size, size, N, N); g.rotateX(-Math.PI / 2);
        const pos = g.attributes.position, uv = g.attributes.uv, cl = new Float32Array(pos.count * 3), e = 0.4;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i) + cx, z = pos.getZ(i) + cz, y = fn(x, z);
          pos.setXYZ(i, x, y, z); uv.setXY(i, x / 4, z / 4);
          const sl = Math.hypot(fn(x + e, z) - fn(x - e, z), fn(x, z + e) - fn(x, z - e)) / (2 * e);
          const c = colFn(x, z, y, sl); cl[i * 3] = c[0]; cl[i * 3 + 1] = c[1]; cl[i * 3 + 2] = c[2];
        }
        g.setAttribute('color', new T.BufferAttribute(cl, 3)); g.computeVertexNormals(); g.computeBoundingSphere();
        const me = new T.Mesh(g, mat('t_detail', { vcol: true, map: TEX.detail() })); WG.add(me); return me;
      }
      const hexA = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
      const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
      // sky, clouds and far-off scenery (not fogged)
      function sky(stops, cloudN, cloudY, cloudCol) {
        const dome = new T.Mesh(new T.SphereGeometry(360, 16, 10), mat('sky_' + stops.map(s => s[1]).join(''), { map: skyTex(stops.map(s => s[1]).join(''), stops), lit: false, side: T.BackSide, fog: false }));
        dome.renderOrder = -2; WG.add(dome); WG.userData.dome = dome;
        if (cloudN) {
          const P = [], g = new T.PlaneGeometry(1, 1);
          for (let i = 0; i < cloudN; i++) { const a = i / cloudN * TAU + rnd() * 0.4, r = 200 + rnd() * 90, w = 50 + rnd() * 60; P.push(ptM(g, cloudCol || 0xffffff, M(Math.cos(a) * r, (cloudY || 70) + rnd() * 40, Math.sin(a) * r, 0, -a - Math.PI / 2, 0, w, w * 0.45, 1))); }
          const geo = merge(P, 1); const uvs = geo.attributes.uv; // plain 0..1 UVs per cloud
          for (let i = 0; i < uvs.count; i += 6) { const q = [[0, 1], [0, 0], [1, 1], [0, 0], [1, 0], [1, 1]]; for (let k = 0; k < 6; k++) uvs.setXY(i + k, q[k][0], q[k][1]); }
          const cm = new T.Mesh(geo, mat('clouds', { map: TEX.cloud(), vcol: true, lit: false, transparent: true, fog: false, side: T.DoubleSide })); cm.material.depthWrite = false; cm.renderOrder = -1; WG.add(cm); WG.userData.clouds = cm;
        }
      }
      function farRing(n, r0, r1, h0, h1, c0, c1, y0) { // distant hills/mountains: one unfogged mesh, lighter at the top
        const P = [];
        for (let i = 0; i < n; i++) { const a = i / n * TAU + rnd() * 0.3, r = r0 + rnd() * (r1 - r0), h = h0 + rnd() * (h1 - h0), w = h * (1.2 + rnd()); P.push(ptM(S.cone(7), i % 2 ? c0 : c1, M(Math.cos(a) * r, (y0 || 0) + h / 2 - 2, Math.sin(a) * r, 0, rnd() * 3, 0, w, h, w * 0.8), 0.55)); }
        const me = new T.Mesh(merge(P), mat('far', { vcol: true, fog: false })); WG.add(me);
      }
      function seaPlane(y, key, colr, opa) {
        const t = key === 'lava' ? TEX.lava() : TEX.water(); t.repeat.set(70, 70);
        const s = new T.Mesh(new T.PlaneGeometry(700, 700), mat('sea_' + key, { map: t, lit: false, transparent: opa < 1, opacity: opa, color: colr || 0xffffff })); s.rotation.x = -Math.PI / 2; s.position.y = y; WG.add(s);
        WG.userData.sea = t; return s;
      }

      // collectables. Coins: an instanced mesh per world (plus room for coins that pop out of baddies)
      const coinGeo = new T.CylinderGeometry(0.42, 0.42, 0.1, 14); coinGeo.rotateX(Math.PI / 2); coinGeo.userData.persist = true; T3.keep(coinGeo);
      const acornGeo = merge([pt(S.ball(14), 0xffc81a, 0, 0, 0, 1.1, 1.3, 1.1, 0, 0, 0, 0.25), pt(S.ball(14), 0x9a5a22, 0, 0.42, 0, 1.24, 0.6, 1.24, 0, 0, 0, 0.2), pt(S.cyl(6), 0x6a3a12, 0, 0.82, 0, 0.12, 0.36, 0.12, 0.2), pt(S.ball(8), 0xfff6c0, -0.22, 0.05, -0.42, 0.22, 0.32, 0.1)]); acornGeo.userData.persist = true; T3.keep(acornGeo);
      const matAcorn = T3.mat({ vcol: true, emissive: 0x4a3000 }), matGhost = T3.mat({ color: 0x8ab8ff, transparent: true, opacity: 0.45, emissive: 0x1a3a8a });
      let COINS = [], coinMesh = null, redMesh = null, REDS = [], ACS = [], ENS = [], NPCS = [], DOORS = [], TRIG = [], LIFE = [], MARK = null;
      const coin = (x, y, z) => COINS.push({ x, y, z, got: false });
      const coinLine = (x0, y0, z0, x1, y1, z1, n, gnd) => { for (let i = 0; i < n; i++) { const f = n > 1 ? i / (n - 1) : 0, x = lerp(x0, x1, f), z = lerp(z0, z1, f); coin(x, gnd ? gy(x, z) + 0.9 : lerp(y0, y1, f), z); } };
      const coinRing = (cx, cy, cz, r, n, gnd) => { for (let i = 0; i < n; i++) { const a = i / n * TAU, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; coin(x, gnd ? gy(x, z) + 0.9 : cy, z); } };
      const coinArc = (x0, z0, x1, z1, y0, top, n) => { for (let i = 0; i < n; i++) { const f = i / (n - 1); coin(lerp(x0, x1, f), y0 + Math.sin(f * Math.PI) * top, lerp(z0, z1, f)); } };
      const red = (x, y, z) => REDS.push({ x, y, z, got: false });
      const gy = (x, z) => Math.max(WD.ground(x, z), WD.water != null ? WD.water : -1e9);
      function acorn(id, name, x, y, z, o) { const a = Object.assign({ id, name, x, y, z, hidden: false, cond: null }, o || {}); ACS.push(a); return a; }
      function npc(kind, name, x, z, face, lines, o) { const n = Object.assign({ kind, name, x, y: WD.ground(x, z), z, face, lines, r: 2.4 }, o || {}); NPCS.push(n); return n; }
      function sign(x, z, face, lines, y) { return npc('sign', 'SIGN', x, z, face, lines, { y: y == null ? WD.ground(x, z) : y }); }
      const life = (x, y, z) => LIFE.push({ x, y, z, got: false });
      function enemy(kind, x, z, o) { const e = Object.assign({ kind, x, z, hx: x, hz: z, y: 0, a: rnd() * TAU, t: rnd() * 3, alive: true, dead: 0, hp: 1, r: 0.7, h: 1.3, range: 6 }, o || {}); e.y = e.y0 != null ? e.y0 : floorAt(x, z, 999)[0]; ENS.push(e); return e; }

      // ================================================================ the cast: merged models, made once
      const MOD = {};
      function model(kind) {
        if (MOD[kind]) return MOD[kind];
        if (kind === 'acorn') return acornGeo;
        const W_ = 0xffffff, BK = 0x141018;
        const eyes = (x, y, z, s, look) => [pt(S.ball(10), W_, x, y, z, s, s * 1.3, s * 0.6), pt(S.ball(10), W_, -x, y, z, s, s * 1.3, s * 0.6), pt(S.ball(8), BK, x + (look || 0), y - s * 0.05, z - s * 0.3, s * 0.45, s * 0.65, s * 0.3), pt(S.ball(8), BK, -x + (look || 0), y - s * 0.05, z - s * 0.3, s * 0.45, s * 0.65, s * 0.3)];
        let P;
        if (kind === 'grumpy' || kind === 'king') {
          P = [pt(S.ball(14), 0xe8b060, 0, 0.78, 0, 1.6, 1.25, 1.45, 0, 0, 0, 0.3), pt(S.hemi(14), 0xb8682a, 0, 0.88, 0, 1.62, 0.95, 1.47), pt(S.cyl(14), 0xc87a3a, 0, 0.88, 0, 1.6, 0.06, 1.45),
            pt(S.box(), 0xf0c880, 0, 1.33, 0, 1.0, 0.06, 0.1, 0.1), pt(S.box(), 0xf0c880, 0, 1.28, -0.3, 0.8, 0.06, 0.1, 0.4), pt(S.box(), 0xf0c880, 0, 1.28, 0.3, 0.8, 0.06, 0.1, -0.4),
            ...eyes(0.27, 0.86, -0.6, 0.3), pt(S.box(), 0x3a1a0a, 0.2, 1.08, -0.7, 0.4, 0.1, 0.08, 0, 0, 0.4), pt(S.box(), 0x3a1a0a, -0.2, 1.08, -0.7, 0.4, 0.1, 0.08, 0, 0, -0.4),
            pt(S.box(), 0x3a1a0a, 0, 0.52, -0.71, 0.32, 0.06, 0.05), pt(S.box(), 0x3a1a0a, 0.18, 0.47, -0.69, 0.12, 0.05, 0.05, 0, 0, 0.6), pt(S.box(), 0x3a1a0a, -0.18, 0.47, -0.69, 0.12, 0.05, 0.05, 0, 0, -0.6),
            pt(S.ball(8), 0xe0a050, 0.78, 0.72, -0.1, 0.34, 0.3, 0.34), pt(S.ball(8), 0xe0a050, -0.78, 0.72, -0.1, 0.34, 0.3, 0.34),
            pt(S.ball(8), 0xd8261c, 0.36, 0.13, -0.08, 0.44, 0.28, 0.62, 0, 0, 0, 0.3), pt(S.ball(8), 0xd8261c, -0.36, 0.13, -0.08, 0.44, 0.28, 0.62, 0, 0, 0, 0.3),
            pt(S.box(), 0xffffff, 0.36, 0.02, -0.08, 0.4, 0.06, 0.56), pt(S.box(), 0xffffff, -0.36, 0.02, -0.08, 0.4, 0.06, 0.56)];
          if (kind === 'king') P.push(pt(S.cyl(10, 1.25), 0xffd23a, 0, 1.68, 0, 0.9, 0.42, 0.9), ...[0, 1, 2, 3, 4].map(i => pt(S.cone(5), 0xffd23a, Math.sin(i * 1.256) * 0.48, 2.0, Math.cos(i * 1.256) * 0.48, 0.18, 0.3, 0.18)), pt(S.ball(8), 0xe8261c, 0, 1.72, -0.5, 0.16, 0.16, 0.1),
            pt(S.ball(12), 0xa8141a, 0, 0.75, 0.5, 1.7, 1.3, 0.5, 0.25), pt(S.ball(10), 0xffffff, 0, 1.22, 0.42, 1.6, 0.25, 0.6), pt(S.ball(10), 0xf0e8e0, 0, 0.38, -0.62, 0.8, 0.55, 0.4));
        } else if (kind === 'snipper' || kind === 'claws') {
          const c = kind === 'claws' ? 0xd8301c : 0xf04a2a;
          P = [pt(S.ball(12), c, 0, 0.45, 0, 1.3, 0.6, 1.0, 0, 0, 0, 0.35), pt(S.cyl(6), c, 0.18, 0.85, -0.25, 0.08, 0.4, 0.08), pt(S.cyl(6), c, -0.18, 0.85, -0.25, 0.08, 0.4, 0.08),
            pt(S.ball(8), W_, 0.18, 1.08, -0.25, 0.2, 0.22, 0.2), pt(S.ball(8), W_, -0.18, 1.08, -0.25, 0.2, 0.22, 0.2), pt(S.ball(6), BK, 0.18, 1.08, -0.35, 0.09, 0.11, 0.06), pt(S.ball(6), BK, -0.18, 1.08, -0.35, 0.09, 0.11, 0.06),
            ...[1, -1].flatMap(s => [pt(S.cyl(6), c, s * 0.62, 0.5, -0.32, 0.12, 0.4, 0.12, 0.9, 0, s * 0.5), pt(S.ball(10), c, s * 0.72, 0.6, -0.55, 0.42, 0.36, 0.48, 0, 0, 0, 0.3), pt(S.cone(6), c, s * 0.78, 0.68, -0.86, 0.2, 0.42, 0.14, -1.5, 0, 0), pt(S.cone(6), 0xffd0b0, s * 0.68, 0.54, -0.82, 0.14, 0.34, 0.1, -1.7, 0, 0)])];
          for (let i = 0; i < 3; i++) for (const s of [-1, 1]) P.push(pt(S.cyl(5), c, s * 0.66, 0.2, -0.1 + i * 0.24, 0.08, 0.55, 0.08, 0, 0, s * 0.85));
          if (kind === 'claws') P.push(pt(S.cyl(3), 0x1a1a22, 0, 1.3, -0.2, 0.9, 0.18, 0.75, 0, Math.PI, 0), pt(S.ball(8), 0x1a1a22, 0, 1.38, -0.2, 0.55, 0.34, 0.45), pt(S.ball(6), 0xffffff, 0, 1.4, -0.43, 0.16, 0.12, 0.06), pt(S.box(), BK, -0.18, 1.08, -0.38, 0.24, 0.24, 0.04));
        } else if (kind === 'chilly') {
          P = [pt(S.ball(12), 0xf4f8ff, 0, 0.55, 0, 1.15, 1.05, 1.15, 0, 0, 0, 0.2), pt(S.ball(12), 0xf4f8ff, 0, 1.35, 0, 0.82, 0.78, 0.82), ...[[-0.15, 1.45], [0.15, 1.45]].map(([x, y]) => pt(S.ball(6), BK, x, y, -0.38, 0.1, 0.1, 0.08)),
            pt(S.cone(6), 0xff8a1a, 0, 1.33, -0.55, 0.12, 0.4, 0.12, -1.57), pt(S.cyl(10), 0x2a3a8a, 0, 1.78, 0, 0.5, 0.4, 0.5), pt(S.cyl(10), 0x2a3a8a, 0, 1.62, 0, 0.8, 0.06, 0.8),
            pt(S.box(), 0x2a1a0a, 0.22, 1.6, -0.4, 0.2, 0.05, 0.04, 0, 0, -0.4), pt(S.box(), 0x2a1a0a, -0.22, 1.6, -0.4, 0.2, 0.05, 0.04, 0, 0, 0.4),
            pt(S.cyl(5), 0x6a3a1a, 0.6, 1.0, 0, 0.07, 0.8, 0.07, 0, 0, -1.0), pt(S.cyl(5), 0x6a3a1a, -0.6, 1.0, 0, 0.07, 0.8, 0.07, 0, 0, 1.0)];
        } else if (kind === 'boohoo' || kind === 'bigboo' || kind === 'hubert') {
          P = [pt(S.ball(14), 0xf4f4ff, 0, 0.9, 0, 1.2, 1.1, 1.2, 0, 0, 0, 0.2), pt(S.cyl(14, 1.0), 0xe8e8f8, 0, 0.35, 0, 1.18, 0.7, 1.18, 0, 0, 0, 0.3),
            ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => pt(S.cone(5), 0xe0e0f4, Math.sin(i * 0.785) * 0.5, -0.05, Math.cos(i * 0.785) * 0.5, 0.3, 0.3, 0.3, Math.PI)),
            pt(S.ball(8), BK, 0.22, 1.0, -0.52, 0.18, 0.3, 0.1), pt(S.ball(8), BK, -0.22, 1.0, -0.52, 0.18, 0.3, 0.1), pt(S.ball(8), 0x6a1a3a, 0, 0.66, -0.55, 0.3, 0.22, 0.1),
            pt(S.ball(8), 0xf4f4ff, 0.66, 0.7, -0.1, 0.32, 0.26, 0.3), pt(S.ball(8), 0xf4f4ff, -0.66, 0.7, -0.1, 0.32, 0.26, 0.3)];
          if (kind === 'bigboo') P.push(pt(S.ball(8), 0xff5aa8, 0.32, 1.5, -0.1, 0.42, 0.3, 0.3), pt(S.ball(8), 0xff5aa8, -0.32, 1.5, -0.1, 0.42, 0.3, 0.3), pt(S.ball(8), 0xff2a88, 0, 1.5, -0.1, 0.18, 0.18, 0.18));
          if (kind === 'hubert') P.push(pt(S.box(), 0x1a1a22, 0, 0.42, -0.58, 0.36, 0.16, 0.08), pt(S.ball(8), 0x1a1a22, 0, 0.42, -0.6, 0.12, 0.12, 0.08), pt(S.tor(0.12, 12), 0xffd23a, 0.22, 1.0, -0.56, 0.32, 0.32, 0.32));
        } else if (kind === 'tickbot' || kind === 'cog') {
          const c = kind === 'cog' ? 0xc87a3a : 0x9aa8c0;
          P = [pt(S.cyl(12), c, 0, 0.62, 0, 1.0, 0.9, 1.0, 0, 0, 0, 0.35), pt(S.hemi(12), c, 0, 1.06, 0, 0.96, 0.8, 0.96), pt(S.box(), 0xe8261c, 0, 0.98, -0.44, 0.6, 0.16, 0.12),
            pt(S.cyl(6), 0x5a5a6a, 0.22, 0.12, 0, 0.18, 0.3, 0.18), pt(S.cyl(6), 0x5a5a6a, -0.22, 0.12, 0, 0.18, 0.3, 0.18), pt(S.box(), 0x3a3a48, 0.22, 0.04, -0.08, 0.26, 0.1, 0.4), pt(S.box(), 0x3a3a48, -0.22, 0.04, -0.08, 0.26, 0.1, 0.4),
            pt(S.cyl(6), 0xd8b040, 0, 0.75, 0.58, 0.1, 0.3, 0.1, 1.57), pt(S.box(), 0xd8b040, 0, 0.75, 0.74, 0.5, 0.3, 0.06), pt(S.cyl(6), 0x5a5a6a, 0, 1.5, 0, 0.05, 0.3, 0.05), pt(S.ball(6), 0xff4a2a, 0, 1.66, 0, 0.12, 0.12, 0.12),
            ...[1, -1].flatMap(s => [pt(S.cyl(6), 0x5a5a6a, s * 0.6, 0.6, -0.1, 0.08, 0.5, 0.08, 0.5, 0, s * 0.5), pt(S.tor(0.12, 8), 0x5a5a6a, s * 0.72, 0.38, -0.25, 0.28, 0.28, 0.28)]), ...[0, 1, 2].map(i => pt(S.box(), 0x3a3a48, 0, 0.5 - i * 0.1, -0.5, 0.4, 0.04, 0.04)), pt(S.tor(0.06, 16), 0xd8b040, 0, 0.18, 0, 1.0, 1.0, 1.0, Math.PI / 2)];
          if (kind === 'cog') P.push(pt(S.box(), 0x3a2a1a, 0.16, 0.8, -0.5, 0.26, 0.06, 0.06, 0, 0, -0.3), pt(S.box(), 0x3a2a1a, -0.16, 0.8, -0.5, 0.26, 0.06, 0.06, 0, 0, 0.3), pt(S.tor(0.1, 12), 0xffd23a, 0.18, 1.0, -0.5, 0.3, 0.3, 0.3));
        } else if (kind === 'percy') {
          P = [pt(S.ball(12), 0x1a1a2a, 0, 0.75, 0, 1.0, 1.4, 0.95, 0, 0, 0, 0.2), pt(S.ball(12), 0xf8f8f8, 0, 0.7, -0.2, 0.75, 1.1, 0.6), ...eyes(0.15, 1.2, -0.38, 0.2), pt(S.cone(6), 0xffa81a, 0, 1.06, -0.52, 0.18, 0.3, 0.14, -1.57),
            pt(S.ball(8), 0xffa81a, 0.2, 0.05, -0.15, 0.3, 0.1, 0.45), pt(S.ball(8), 0xffa81a, -0.2, 0.05, -0.15, 0.3, 0.1, 0.45), pt(S.ball(8), 0x1a1a2a, 0.52, 0.75, 0, 0.18, 0.7, 0.4, 0, 0, 0.3), pt(S.ball(8), 0x1a1a2a, -0.52, 0.75, 0, 0.18, 0.7, 0.4, 0, 0, -0.3),
            pt(S.tor(0.14, 14), 0xe8261c, 0, 0.88, 0, 0.84, 0.84, 0.6, 1.57), pt(S.box(), 0xe8261c, 0.22, 0.66, 0.4, 0.16, 0.42, 0.06, 0.2)];
        } else if (kind === 'mayor') {
          P = [pt(S.ball(14), 0xe0b070, 0, 0.9, 0, 1.3, 1.4, 1.2, 0, 0, 0, 0.3), ...eyes(0.2, 1.25, -0.52, 0.24), pt(S.ball(8), 0xc8603a, 0, 1.08, -0.62, 0.22, 0.18, 0.18),
            pt(S.box(), 0xf8f8f8, 0.18, 0.96, -0.62, 0.32, 0.08, 0.06, 0, 0, -0.25), pt(S.box(), 0xf8f8f8, -0.18, 0.96, -0.62, 0.32, 0.08, 0.06, 0, 0, 0.25),
            pt(S.cyl(12), 0x1a1a22, 0, 1.98, 0, 0.7, 0.7, 0.7), pt(S.cyl(12), 0x1a1a22, 0, 1.64, 0, 1.1, 0.06, 1.1), pt(S.cyl(12), 0xe8261c, 0, 1.72, 0, 0.72, 0.12, 0.72),
            pt(S.cone(4), 0xe8261c, 0.13, 0.66, -0.6, 0.2, 0.22, 0.1, 0, 0, Math.PI / 2), pt(S.cone(4), 0xe8261c, -0.13, 0.66, -0.6, 0.2, 0.22, 0.1, 0, 0, -Math.PI / 2), pt(S.ball(6), 0xa8141a, 0, 0.66, -0.62, 0.1, 0.1, 0.08), pt(S.cyl(10), 0xffd23a, -0.32, 0.44, -0.55, 0.22, 0.05, 0.22, 1.3), pt(S.ball(6), 0x8a5a2a, 0, 1.5, -0.58, 0.2, 0.12, 0.1),
            ...[[-0.5, -0.2], [0.4, 0.1], [0.1, 0.5], [-0.25, 0.75]].map(([a, y]) => pt(S.ball(6), 0x8a5a2a, Math.sin(a) * 0.62, 0.9 + y * 0.5, -Math.cos(a) * 0.55, 0.12, 0.12, 0.08)),
            pt(S.ball(8), 0xe0b070, 0.32, 0.12, 0, 0.36, 0.24, 0.46), pt(S.ball(8), 0xe0b070, -0.32, 0.12, 0, 0.36, 0.24, 0.46)];
        } else if (kind === 'tortoise' || kind === 'shelly') {
          const sh = kind === 'shelly' ? 0x3a8ad0 : 0x4a8a3a;
          P = [pt(S.hemi(14), sh, 0, 0.3, 0, 1.6, 1.3, 1.9, 0, 0, 0, 0.3), pt(S.cyl(14), 0xc8a060, 0, 0.3, 0, 1.62, 0.12, 1.92), pt(S.ball(10), 0x9ac86a, 0, 0.75, -1.0, 0.6, 0.6, 0.65), ...eyes(0.13, 0.85, -1.22, 0.16),
            pt(S.ball(8), 0x9ac86a, 0.5, 0.15, -0.6, 0.3, 0.3, 0.3), pt(S.ball(8), 0x9ac86a, -0.5, 0.15, -0.6, 0.3, 0.3, 0.3), pt(S.ball(8), 0x9ac86a, 0.5, 0.15, 0.6, 0.3, 0.3, 0.3), pt(S.ball(8), 0x9ac86a, -0.5, 0.15, 0.6, 0.3, 0.3, 0.3)];
          if (kind === 'tortoise') P.push(pt(S.tor(0.1, 10), 0x2a2a2a, 0.13, 0.86, -1.3, 0.22, 0.22, 0.22), pt(S.tor(0.1, 10), 0x2a2a2a, -0.13, 0.86, -1.3, 0.22, 0.22, 0.22), pt(S.box(), 0xf0f0f0, 0, 0.55, -1.25, 0.2, 0.3, 0.08));
          else P.push(pt(S.ball(8), 0xff7ab0, 0, 1.12, -0.95, 0.3, 0.16, 0.2));
        } else if (kind === 'sign') {
          P = [pt(S.cyl(6), 0x7a4a22, 0, 0.6, 0, 0.18, 1.2, 0.18), pt(S.box(), 0xc8945a, 0, 1.25, 0, 1.6, 0.9, 0.14), pt(S.box(), 0x7a4a22, 0, 1.25, -0.08, 1.2, 0.08, 0.02), pt(S.box(), 0x7a4a22, 0, 1.45, -0.08, 0.9, 0.08, 0.02), pt(S.box(), 0x7a4a22, 0, 1.05, -0.08, 1.0, 0.08, 0.02)];
        } else if (kind === 'life') {
          P = [pt(S.cyl(16), 0x4ac84a, 0, 0, 0, 1.0, 0.24, 1.0, 1.57), ...[[0.2, 0.15], [-0.22, 0.05], [0.05, -0.25], [-0.1, 0.3], [0.28, -0.18]].map(([x, y]) => pt(S.ball(6), 0x5a2a12, x, y, -0.13, 0.14, 0.14, 0.08)), pt(S.tor(0.06, 16), 0x2a8a2a, 0, 0, 0, 1.0, 1.0, 1.0)];
        } else if (kind === 'chest') {
          P = [pt(S.box(), 0x9a5a2a, 0, 0.3, 0, 1.0, 0.6, 0.7, 0, 0, 0, 0.3), pt(S.box(), 0xffd23a, 0, 0.3, -0.36, 0.2, 0.26, 0.04), pt(S.box(), 0x5a3a1a, 0, 0.3, 0, 1.04, 0.08, 0.74)];
        } else if (kind === 'lid') { // hinged at its back edge (the origin)
          P = [pt(S.box(), 0xa8642a, 0, 0.12, -0.36, 1.04, 0.24, 0.74, 0, 0, 0, 0.3), pt(S.box(), 0x5a3a1a, 0, 0.12, -0.36, 1.08, 0.08, 0.78), pt(S.box(), 0xffd23a, 0, 0.06, -0.73, 0.2, 0.14, 0.04)];
        } else if (kind === 'snowball') { P = [pt(S.ball(8), 0xf4f8ff, 0, 0, 0, 0.5, 0.5, 0.5)];
        } else if (kind === 'plug') { P = [pt(S.box(), 0xbfeeff, 0, 0.3, 0, 1.3, 0.6, 1.3, 0, 0, 0, 0.3), pt(S.box(), 0xffffff, 0, 0.61, 0, 0.9, 0.04, 0.9)];
        } else if (kind === 'ring') { P = [pt(new T.CylinderGeometry(1, 1, 1, 40, 1, true), 0xffb02a, 0, 0, 0, 1, 1, 1)]; }
        const g = merge(P); g.userData.persist = true; T3.keep(g);
        return (MOD[kind] = g);
      }
      const ghostMat = T3.mat({ vcol: true, transparent: true, opacity: 0.88, emissive: 0x1a1a3a });
      function mesh(kind, x, y, z, s, m) { const me = new T.Mesh(model(kind), m || matV()); me.position.set(x, y, z); if (s) me.scale.setScalar(s); WG.add(me); return me; }

      // ================================================================ THE WORLDS
      const WN = { hub: 'BISCUIT ISLAND', cove: 'CUSTARD COVE', peaks: 'FROSTY FLAPJACK PEAKS', manor: 'GHOULISH GINGER MANOR', tower: 'TICK-TOCK TOWER', boss: 'THE BISCUIT BARREL' };
      const ORDER = ['cove', 'peaks', 'manor', 'tower', 'boss'];
      const NEED = { cove: 0, peaks: 3, manor: 7, tower: 12, boss: 18 };
      // ---- Biscuit Island (the hub)
      const PLX = -4, PLZ = 8;
      function hubG0(x, z) { const r = Math.hypot(x, z * 1.08); return -4 + sstep(46, 31, r) * 5.6 + 9.5 * ex(x, z, -14, -12, 120) + 2.6 * ex(x, z, 6, 18, 40) - 3.4 * ex(x, z, 11, 4, 26) + 0.4 * Math.sin(x * 0.3) * Math.cos(z * 0.27) * sstep(40, 25, r); }
      const PH = hubG0(PLX, PLZ);
      const LX = 18, LZ = -16, LB = hubG0(LX, LZ) - 0.5, LTOP = LB + 17, WX = -21, WZ = 16, WB = hubG0(WX, WZ) - 0.5, TRX = -3, TRZ = 24, TB = hubG0(TRX, TRZ) - 0.3, PDX = 11, PDZ = 4, PRZ = -6;
      const WORLDS = {};
      WORLDS.hub = {
        song: 'hub', fog: [0xa8d4f8, 50, 170], water: 0, killY: -20, spawn: [8, 31, 0], bound: 70,
        light: { amb: 0.8, sun: 0.75, sky: 0xf0f8ff, gnd: 0x5a7a4a, dir: [0.4, 1, 0.3] },
        ground: (x, z) => lerp(hubG0(x, z), PH, sstep(13, 10, Math.hypot(x - PLX, z - PLZ))),
        build() {
          sky([[0, '#2a6ae0'], [0.42, '#7ab8f8'], [0.52, '#d8ecff'], [1, '#d8ecff']], 9, 60);
          farRing(9, 150, 210, 12, 30, 0x5a9a5a, 0x4a8a6a, -2);
          seaPlane(0, 'water', 0xffffff, 0.82);
          const bed = new T.Mesh(new T.PlaneGeometry(700, 700), mat('seabed', { color: 0x1a5a9a, lit: false })); bed.rotation.x = -Math.PI / 2; bed.position.y = -4.3; WG.add(bed);
          const sand = hexA(0xffe6a0), grass1 = hexA(0x5ab83a), grass2 = hexA(0x7ac84a), rock = hexA(0xa89a88), wet = hexA(0xc8b080);
          terrain(112, 80, 0, 0, this.ground, (x, z, y, sl) => {
            if (y < 0.2) return wet; if (y < 0.9) return sand; if (y < 1.3) return mix3(sand, grass1, (y - 0.9) / 0.4);
            const g = mix3(grass1, grass2, 0.5 + 0.5 * Math.sin(x * 0.37 + z * 0.29) * Math.cos(z * 0.21));
            return sl > 0.9 ? mix3(g, rock, clamp((sl - 0.9) * 2, 0, 1)) : g;
          });
          // Acorn Plaza: paving, a fountain, and the five magic doors
          deco(ptM(S.cyl(30), 0xf0e8e0, M(PLX, PH - 0.12, PLZ, 0, 0, 0, 21, 0.3, 21), 0), 'cobble');
          cyl(PLX, PH, PLZ, 2.4, 0.7, { t: 'cobble', c: 0xe8e0f0 }); cyl(PLX, PH + 0.7, PLZ, 0.45, 1.7, { c: 0xd8d0e0 }); cyl(PLX, PH + 2.3, PLZ, 1.3, 0.3, { c: 0xd8d0e0, top: 1.4 });
          deco(ptM(S.cyl(20), 0x5ab8ff, M(PLX, PH + 0.62, PLZ, 0, 0, 0, 4.4, 0.04, 4.4)), 'vb'); deco(ptM(S.cyl(14), 0x8ad0ff, M(PLX, PH + 2.62, PLZ, 0, 0, 0, 2.3, 0.04, 2.3)), 'vb');
          ORDER.forEach((w, i) => {
            const a = Math.PI + (i - 2) * 0.5, x = PLX + Math.sin(a) * 9, z = PLZ + Math.cos(a) * 9, ry = a + Math.PI, fx = -Math.sin(a), fz = -Math.cos(a);
            const rx = Math.cos(ry), rz = -Math.sin(ry); // the door's local x axis
            for (const s of [-1, 1]) box(x + rx * s * 1.75, PH, z + rz * s * 1.75, 0.9, 4.4, 1.1, { ry, t: 'brick', c: 0xf0e8ff, props: { nocam: 1 } });
            box(x, PH + 4.4, z, 4.4, 0.9, 1.2, { ry, t: 'brick', c: 0xf0e8ff });
            deco(ptM(S.cyl(3), 0xd8c8f0, M(x, PH + 5.4, z, 0, ry + Math.PI / 2, Math.PI / 2, 1.2, 4.6, 1.2)), 'v');
            box(x - fx * 0.15, PH, z - fz * 0.15, 2.6, 4.4, 0.4, { ry, c: 0x5a3a2a });
            const pm = new T.Mesh(new T.PlaneGeometry(2.5, 3.9), mat('door' + i, { map: doorTex(i) })); pm.position.set(x + fx * 0.07, PH + 1.98, z + fz * 0.07); pm.rotation.y = ry; WG.add(pm);
            DOORS.push({ i, w, need: NEED[w], x, z, fx, fz, ry, y: PH });
          });
          // the lighthouse and its winding steps
          cyl(LX, LB, LZ, 2.5, LTOP - LB, { t: 'stripe', top: 0.82, cr: 2.6 });
          cyl(LX, LTOP - 0.4, LZ, 3.4, 0.4, { c: 0xb8b8b0 }); cyl(LX, LTOP, LZ, 1.3, 1.6, { c: 0xfff6a0, cr: 1.4 }); deco(ptM(S.cone(12), 0xe83a2a, M(LX, LTOP + 2.4, LZ, 0, 0, 0, 4, 1.6, 4)));
          deco(ptM(S.tor(0.06, 20), 0xf8f8f8, M(LX, LTOP + 0.6, LZ, Math.PI / 2, 0, 0, 6.6, 6.6, 6.6)));
          for (let i = 0; i < 17; i++) { const a = i * 0.62 + 2.2, y = LB + 1.1 + i * 0.98; box(LX + Math.cos(a) * 3.9, y - 0.45, LZ + Math.sin(a) * 3.9, 1.9, 0.45, 1.9, { t: 'wood' }); }
          // the windmill (climb the crates) with its sails turning
          box(WX, WB, WZ, 5, 7, 5, { t: 'brick' }); box(WX, WB + 7, WZ, 5.6, 0.6, 5.6, { t: 'wood', c: 0x9a7a5a });
          deco(ptM(S.cone(4), 0x8a3a2a, M(WX, WB + 9.3, WZ, 0, Math.PI / 4, 0, 6.6, 3.4, 6.6)));
          const sails = new T.Mesh(merge([0, 1, 2, 3].map(i => ptM(S.box(), 0xf8f0e0, new T.Matrix4().makeRotationZ(i * Math.PI / 2).multiply(M(0, 2.9, 0, 0, 0, 0, 0.9, 5.6, 0.12)))).concat([pt(S.cyl(8), 0x5a3a1a, 0, 0, 0, 0.5, 0.5, 0.5, Math.PI / 2)])), matV());
          sails.position.set(WX, WB + 5.6, WZ + 2.75); WG.add(sails); WG.userData.sails = sails;
          [[8.2, 1.3], [5.8, 2.6], [3.2, 3.9]].forEach(([dx, h], i) => { const gx = WX + dx, gz = WZ - 1 + i * 0.1; box(gx, hubG0(gx, gz) - 0.4, gz, 1.9, h + 0.4, 1.9, { t: 'crate' }); });
          // the big tree: its branches are steps
          cyl(TRX, TB, TRZ, 1.1, 12, { c: 0x8a5a2a, top: 0.75 }); deco(ptM(S.ball(12), 0x3aa83a, M(TRX, TB + 17.5, TRZ, 0, 0, 0, 10, 7, 10), 0.35));
          [[2.6, 2.2, 0], [0, 4.6, 2.6], [-2.6, 7, 0], [0, 9.4, -2.6], [2.4, 11.6, 0.4]].forEach(([dx, h, dz]) => box(TRX + dx, TB + h - 0.2, TRZ + dz, 2.2, 0.4, 2.2, { c: 0x8a5a2a }));
          box(TRX, TB + 13, TRZ, 3.4, 0.4, 3.4, { c: 0x3aa83a });
          // the pier (look underneath), the stepping stones out to sea, and the pond with its rafts
          for (let x = -34; x >= -47; x -= 3.2) for (const dz of [-1.2, 1.2]) deco(ptM(S.cyl(6), 0x6a4a2a, M(x, -0.5, PRZ + dz, 0, 0, 0, 0.5, 7, 0.5)));
          box(-40.5, 3.2, PRZ, 15, 0.4, 3, { t: 'wood' });
          [[33, 0.8, 2], [37, 1.3, -1], [41.5, 1.9, 1.5], [46, 2.4, -1.5], [50.5, 2.8, 0.5]].forEach(([x, h, z]) => cyl(x, -4, z, 1.35, h + 4, { c: 0xa8a8a0, top: 0.85, cr: 1.3 }));
          cyl(56, -4, 0.5, 3.6, 7, { c: 0x9a9a92, top: 0.8, cr: 3.0 });
          cyl(PDX, -3, PDZ, 1.0, 4.8, { c: 0x8a5a2a });
          for (const r of [{ ax: 4, bx: 9.1, ph: 0 }, { ax: 12.9, bx: 18, ph: Math.PI }]) mover('box', 2.4, 0.4, 2.4, { t: 'wood' }, (s, t) => { s.x = r.ax + (r.bx - r.ax) * (0.5 - Math.cos(t * 0.6 + r.ph) * 0.5); s.y = 0.45; s.z = PDZ; });
          // trees, flowers and fences
          for (let i = 0; i < 30; i++) {
            const a = rnd() * TAU, r = 8 + rnd() * 22, x = Math.cos(a) * r, z = Math.sin(a) * r, h = this.ground(x, z);
            if (h < 1.1 || (x < -28 && Math.abs(z - PRZ) < 5) || Math.hypot(x - LX, z - LZ) < 7 || Math.hypot(x - WX, z - WZ) < 9 || Math.hypot(x - PDX, z - PDZ) < 8 || Math.hypot(x - TRX, z - TRZ) < 7 || Math.hypot(x - PLX, z - PLZ) < 14 || Math.hypot(x - 8, z - 31) < 5) continue;
            if (i % 3) { cyl(x, h - 0.5, z, 0.3, 2.6, { c: 0x8a5a2a, cr: 0.4 }); deco(ptM(S.ball(10), [0x3ab03a, 0x4ac04a, 0x2a9a3a][i % 3], M(x, h + 3.2, z, 0, 0, 0, 3.2, 3.0, 3.2), 0.4)); }
            else for (let k = 0; k < 6; k++) deco(ptM(S.ball(6), [0xff4a8a, 0xffe04a, 0xffffff, 0xa86aff][k % 4], M(x + rnd() * 2.4 - 1.2, h + 0.25, z + rnd() * 2.4 - 1.2, 0, 0, 0, 0.35, 0.3, 0.35)));
          }
          for (let i = 0; i < 18; i++) { const a = -0.9 + i * 0.07, x = Math.cos(a) * 24, z = Math.sin(a) * 24; deco(ptM(S.box(), 0xe8d8b0, M(x, this.ground(x, z) + 0.5, z, 0, 0, 0, 0.2, 1, 0.2))); deco(ptM(S.box(), 0xe8d8b0, M(x, this.ground(x, z) + 0.75, z, 0, -a, 0, 0.12, 0.12, 1.7))); }
          // acorns
          acorn('light', 'TOP OF THE LIGHTHOUSE', LX, LTOP + 2.2, LZ - 2.4); acorn('hill', 'TOP OF THE BIG HILL', -14, hubG0(-14, -12) + 1.2, -12);
          acorn('mill', 'ON THE WINDMILL', WX, WB + 8.6, WZ); acorn('stones', 'OUT AT SEA', 56, 4.2, 0.5);
          acorn('pond', 'IN THE MIDDLE OF THE POND', PDX, 2.9, PDZ); acorn('tree', 'UP THE BIG TREE', TRX, TB + 14.3, TRZ);
          acorn('grump', 'STOMP ALL THE GRUMPIES', PLX, PH + 3.6, PLZ, { hidden: true, cond: 'enemies' }); acorn('pier', 'UNDER THE PIER', -35, Math.max(0, hubG0(-35, PRZ)) + 0.9, PRZ);
          // coins
          coinRing(2, 0, 2, 4, 8, true); coinLine(-1, 0, -6, -10, 0, -11, 6, true); coinRing(LX, 0, LZ, 5.4, 8, true); for (let i = 0; i < 5; i++) coin(-37 - i * 2.5, 4.5, PRZ);
          coinRing(-14, 0, -6, 3, 6, true); coinLine(20, 0, 14, 28, 0, 2, 5, true); coinRing(PDX, 0, PDZ, 7.6, 8, true); coinLine(-26, 0, -2, -26, 0, 10, 5, true);
          [[33, 0.8, 2], [37, 1.3, -1], [41.5, 1.9, 1.5], [46, 2.4, -1.5], [50.5, 2.8, 0.5]].forEach(([x, h, z]) => coin(x, h + 1, z));
          coinLine(8, 0, 27, 0, 0, 20, 5, true); coinRing(PLX, PH + 0.9, PLZ, 6.2, 10);
          // the Grumpies, the locals and the signs
          [[2, -8], [-18, -2], [10, -12], [21, 11], [-11, 24]].forEach(([x, z]) => enemy('grumpy', x, z, { range: 6 }));
          npc('mayor', 'MAYOR CRUMB', 5, 25, 2.6, () => mayorLines());
          npc('tortoise', 'OLD BARNABY', -29, -1, -1.2, ['OH! HELLO, YOUNG BOPPER. I WAS HAVING A LITTLE SNOOZE.', 'I SAW SOMETHING SHINY ROLL UNDER THE PIER, YOU KNOW. AND I HEARD THE GRUMPIES MUTTERING ABOUT AN ACORN THEY GUARD.', 'IF YOU STOMP ALL FIVE OF THEM, I EXPECT IT WILL TURN UP IN THE PLAZA FOUNTAIN. ZZZ...']);
          sign(PLX + 2.5, PLZ + 11.5, Math.PI + 0.3, ['ACORN PLAZA. THE MAGIC DOORS LEAD TO OTHER WORLDS.', 'EACH DOOR OPENS WHEN YOU HAVE ENOUGH GOLDEN ACORNS. THE NUMBER IS ON THE DOOR.']);
          sign(11, 28, 0.5, ['WELCOME TO BISCUIT ISLAND!', 'PRESS ' + L('b') + ' NEAR A SIGN OR A PERSON TO READ OR TALK. ' + L('l') + ' AND ' + L('r') + ' TURN THE CAMERA ROUND.', 'PRESS START TO PAUSE AND SEE WHICH ACORNS YOU HAVE FOUND.']);
          life(LX + 2.4, LTOP + 1.0, LZ + 1.2);
        },
      };
      // ---- Custard Cove (the beach)
      WORLDS.cove = {
        song: 'cove', fog: [0xb8e4ff, 55, 180], water: 0, killY: -20, spawn: [0, 27, 0], exitAt: [-5.5, 28.5], bound: 58,
        light: { amb: 0.85, sun: 0.8, sky: 0xffffff, gnd: 0xc8a870, dir: [0.5, 1, 0.2] },
        ground(x, z) {
          let h = 1.6 + 0.35 * Math.sin(x * 0.21) * Math.cos(z * 0.17);
          h -= 6 * sstep(33, 48, z); h -= 6 * sstep(37, 50, x);
          h += 13 * sstep(-27, -37, z) + 13 * sstep(-31, -41, x);
          h += 7.2 * sstep(9.5, 7, Math.hypot(x - 26, z + 21));
          return Math.max(h, -4.5);
        },
        build() {
          sky([[0, '#1a8ae8'], [0.42, '#6ac8ff'], [0.52, '#e0f6ff'], [1, '#e0f6ff']], 8, 55);
          farRing(8, 170, 230, 10, 26, 0x6aa86a, 0x8ab87a, -2);
          seaPlane(0, 'water', 0xa8f0ff, 0.8);
          const bed = new T.Mesh(new T.PlaneGeometry(700, 700), mat('seabed2', { color: 0x1a7ab0, lit: false })); bed.rotation.x = -Math.PI / 2; bed.position.y = -4.4; WG.add(bed);
          const sand = hexA(0xffe2a0), wet = hexA(0xd8b880), rock = hexA(0xb8987a), grass = hexA(0x7ac84a);
          terrain(130, 90, 2, -2, this.ground, (x, z, y, sl) => sl > 1.0 ? mix3(rock, hexA(0x9a7a6a), 0.5 + 0.5 * Math.sin(y * 1.3)) : y > 8 ? grass : y < 0.4 ? wet : mix3(sand, hexA(0xfff0c0), 0.5 + 0.5 * Math.sin(x * 0.5) * Math.sin(z * 0.43)));
          // the sandcastle
          const CB = 1.4;
          box(0, CB, -8, 12, 3, 12, { t: 'sandbrick' });
          for (let k = 0; k < 4; k++) box(0, CB, -2 + 1.2 * (3 - k) + 0.6, 3.4, 0.75 * (k + 1), 1.2, { t: 'sandbrick', c: 0xf8f0e0 });
          box(0, CB + 3, -8, 8, 2.4, 8, { t: 'sandbrick' }); box(0, CB + 5.4, -8, 4.4, 2.4, 4.4, { t: 'sandbrick' });
          for (const [x, z] of [[5, -13], [-5, -13], [5, -3], [-5, -3]]) { cyl(x, CB + 3, z, 1.1, 1.8, { t: 'sandbrick' }); for (let i = 0; i < 6; i++) deco(ptM(S.box(), 0xf0d898, M(x + Math.cos(i) * 0.9, CB + 5.0, z + Math.sin(i) * 0.9, 0, -i, 0, 0.4, 0.45, 0.4)), 'sandbrick'); }
          for (let i = -5; i <= 5; i += 2) for (const z of [-13.7, -2.3]) deco(ptM(S.box(), 0xf0d898, M(i, CB + 3.25, z, 0, 0, 0, 0.7, 0.5, 0.5)), 'sandbrick');
          deco(ptM(S.cyl(6), 0x8a5a2a, M(0, CB + 9.8, -9.4, 0, 0, 0, 0.12, 3, 0.12))); deco(ptM(S.cyl(3), 0xe8261c, M(0.7, CB + 10.6, -9.4, Math.PI / 2, 0, Math.PI / 2, 1.0, 0.1, 1.4)));
          // the shipwreck
          box(24, 0.6, 12, 14, 4.4, 5, { t: 'wood', c: 0xa87850 }); box(19.5, 5, 12, 4, 2.2, 4.4, { t: 'wood', c: 0x8a6040 });
          deco(ptM(S.cyl(3), 0xa87850, M(32.4, 2.8, 12, 0, 0, 0, 5, 4.4, 5)), 'wood'); deco(ptM(S.box(), 0x2a1a10, M(26, 2.4, 9.45, 0.2, 0, 0.3, 2.2, 1.4, 0.1)));
          cyl(24, 5, 12, 0.3, 11, { c: 0x7a4a22 }); cyl(24, 13.1, 12, 1.5, 0.4, { t: 'wood' }); deco(ptM(S.tor(0.06, 16), 0x6a3a1a, M(24, 14.1, 12, Math.PI / 2, 0, 0, 3.0, 3.0, 3.0)));
          deco(ptM(S.box(), 0xf0e8d0, M(24, 10, 12.4, 0, 0, 0.05, 0.1, 4, 5.2), 0.2)); deco(ptM(S.box(), 0x1a1a1a, M(24, 16.6, 12, 0, 0, 0, 0.05, 1, 1.6)));
          for (let i = 0; i < 9; i++) { const a = i * 0.75, y = 5 + 0.85 * (i + 1); box(24 + Math.cos(a) * 2.0, y - 0.3, 12 + Math.sin(a) * 2.0, 1.1, 0.3, 1.1, { t: 'wood' }); }
          box(15.6, 1.2, 9.6, 1.8, 1.8, 1.8, { t: 'crate' }); box(15.6, 1.2, 12, 1.8, 3.6, 1.8, { t: 'crate' });
          prop('chest', 24.8, 13.5, 12, -Math.PI / 2, 'cove');
          // the Chimney (two tall rocks to kick up between), Lookout Point, the clam and the tall palm
          box(13, gyRaw(this, 13, -21) - 0.6, -21, 1.6, 9.0 - gyRaw(this, 13, -21) + 0.6, 3.2, { c: 0xa88a72, t: 'detail' });
          box(16.4, gyRaw(this, 16.4, -21) - 0.6, -21, 1.6, 9.4 - gyRaw(this, 16.4, -21) + 0.6, 3.2, { c: 0xa88a72, t: 'detail' });
          const PT = this.ground(27, -19);
          cyl(27, PT - 0.2, -19, 1.1, 0.7, { c: 0xf08ab0, props: { bounce: 22 } }); deco(ptM(S.hemi(12), 0xf8a8c8, M(27, PT + 0.5, -19, -0.6, 0, 0, 2.0, 1.2, 2.0)));
          palm(24.5, -23.5, 8);
          // the stepping stones and the little island
          [[38, 1.0, 4], [41.5, 1.6, 7], [45, 2.2, 4.5], [48.6, 2.6, 7.5]].forEach(([x, h, z]) => cyl(x, -4.5, z, 1.3, h + 4.5, { c: 0xa8a098, top: 0.85, cr: 1.25 }));
          cyl(54, -4.5, 5, 4, 7.1, { c: 0xe8d098, top: 0.85, cr: 3.5 }); palm(55, 4, 6);
          // palms, umbrellas, towels, shells and rocks
          [[-22, 18], [-26, 4], [-16, 26], [12, 28], [28, -6], [-24, -18], [8, -22], [-10, -24], [33, 20]].forEach(([x, z], i) => palm(x, z, 6 + (i % 3)));
          for (const [x, z, c] of [[-10, 18, 0xe8261c], [10, 16, 0x2a8ae8]]) { const y = this.ground(x, z); deco(ptM(S.cyl(6), 0xf0f0f0, M(x, y + 1.3, z, 0, 0, 0, 0.12, 2.6, 0.12))); deco(ptM(S.cone(10), c, M(x, y + 2.8, z, 0, 0, 0, 3.6, 0.9, 3.6))); deco(ptM(S.box(), c, M(x + 1.2, y + 0.03, z + 1, 0, 0.3, 0, 1.2, 0.06, 2.2))); }
          for (let i = 0; i < 26; i++) { const x = -28 + rnd() * 60, z = -24 + rnd() * 52, y = this.ground(x, z); if (y < 0.5 || Math.hypot(x, z + 8) < 9) continue; deco(ptM(i % 2 ? S.ball(6) : S.dod(), i % 3 ? 0xffb0c8 : 0xa8a098, M(x, y + 0.1, z, 0, rnd() * 3, 0, 0.4 + rnd() * 0.5, 0.3, 0.4 + rnd() * 0.5))); }
          // acorns, red coins
          acorn('castle', 'KING OF THE SANDCASTLE', 0, CB + 9.0, -8); acorn('chest', 'CAPTAIN CLAWS\' CHEST', 24.8, 15.4, 12, { hidden: true, cond: 'chest' });
          acorn('crabs', 'SNIPPER SCRAP', -14, 3.2, 22, { hidden: true, cond: 'enemies' }); acorn('palm', 'ABOVE THE TALL PALM', 27, PT + 9.4, -19);
          acorn('reds', 'EIGHT RED COINS', 0, 3.2, 14, { hidden: true, cond: 'reds' }); acorn('c100', '100 COINS', 0, 0, 0, { hidden: true, cond: 'c100' });
          [[5, CB + 5.8, -13], [30, 5.9, 12], [23.2, 14.4, 12], [45, 3.3, 4.5], [54, 3.5, 5], [13, 10.0, -21], [0, 2.6, -17.5], [-27, 2.6, 10]].forEach(([x, y, z]) => red(x, y, z));
          // coins
          coinLine(0, 0, 24, 0, 0, 5, 8, true); coinRing(0, 2.5, -8, 8.5, 14, true); coinRing(0, CB + 6.3, -8, 3.1, 6);
          coinLine(-24, 0, 16, -24, 0, -14, 8, true); coinLine(18, 5.9, 12, 30, 5.9, 12, 6);
          for (const i of [1, 3, 5, 7]) { const a = i * 0.75; coin(24 + Math.cos(a) * 2.0, 5 + 0.85 * (i + 1) + 0.9, 12 + Math.sin(a) * 2.0); }
          coinLine(14.7, 3, -21, 14.7, 8.4, -21, 5); coinRing(26, PT + 0.9, -23, 3.2, 8);
          [[38, 1.0, 4], [41.5, 1.6, 7], [45, 2.2, 4.5], [48.6, 2.6, 7.5]].forEach(([x, h, z]) => coin(x, h + 1, z));
          coinLine(-18, 0, 24, -4, 0, 29, 6, true); coinLine(6, 0, 29, 20, 0, 23, 6, true); coinRing(-12, 0, 12, 3, 6, true); coinLine(30, 0, -6, 30, 0, 6, 6, true); coinLine(-20, 0, -22, 10, 0, -22, 8, true);
          // Snippers, the locals
          [[-12, 12], [-6, 20], [8, 6], [14, 24], [-20, 2], [6, -20]].forEach(([x, z]) => enemy('snipper', x, z, { range: 5, r: 0.8, h: 1.0 }));
          npc('claws', 'CAPTAIN CLAWS', 28, 12, Math.PI / 2, () => chestOpen.cove ? ['ARR, THAT BE ME TREASURE ALL RIGHT. KEEP IT, MATEY. I CAN\'T LIFT IT ANYWAY, ME CLAWS BE TOO SNIPPY.'] : ['ARR! AHOY THERE, BOPPER!', 'ME TREASURE CHEST BE STUCK UP IN THE CROW\'S NEST, AND THERE BE A GOLDEN ACORN IN IT.', 'CLIMB THE RIGGING ROUND THE MAST, THEN GIVE THAT CHEST A GOOD BUTT STOMP. JUMP, THEN PRESS ' + L('c') + ' IN THE AIR!'], { y: 5, r: 2.8 });
          npc('shelly', 'SHELLY', -6, 25, 0.3, ['HIYA! I\'M SHELLY. WELCOME TO CUSTARD COVE!', 'SEE THOSE TWO TALL ROCKS BY THE CLIFF? WE CALL THAT THE CHIMNEY.', 'JUMP AT ONE ROCK, THEN PRESS ' + L('a') + ' JUST AS YOU TOUCH IT TO KICK OFF. KEEP KICKING BETWEEN THEM AND UP YOU GO!', 'THERE\'S A BOUNCY CLAM UP ON LOOKOUT POINT. BOING!']);
          sign(2.6, 3.6, 0.2, ['KING OF THE SANDCASTLE: WHOEVER STANDS ON THE TOP TOWER RULES THE BEACH!']);
          sign(11, -18, -0.9, ['THE CHIMNEY. NO CLIMBING. (UNLESS YOU CAN WALL KICK.)']);
          life(54, 3.6, 3.2);
        },
      };
      function gyRaw(w, x, z) { return w.ground(x, z); }
      function palm(x, z, h) {
        const y = WD.ground(x, z); cyl(x, y - 0.3, z, 0.32, 0.6, { vis: false, cr: 0.35 }); CYLS[CYLS.length - 1].y1 = y + h;
        for (let i = 0; i < 6; i++) { const f = i / 6; deco(ptM(S.cyl(7, 0.85), 0x9a6a3a, M(x + f * 0.8, y + f * h + h / 12, z, 0, 0, -0.12, 0.6 - f * 0.25, h / 6 + 0.1, 0.6 - f * 0.25), 0.3)); }
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; deco(ptM(S.box(), i % 2 ? 0x2aa83a : 0x3ac04a, M(x + 0.8 + Math.cos(a) * 1.6, y + h + 0.1, z + Math.sin(a) * 1.6, 0, -a, 0.35, 3.4, 0.12, 1.0), 0.3)); }
        deco(ptM(S.ball(8), 0x6a4a1a, M(x + 0.8, y + h - 0.3, z, 0, 0, 0, 0.6, 0.6, 0.6)));
      }
      // ---- Frosty Flapjack Peaks (the snowy mountain)
      const PW = [{ R: 36, H: 6, a: Math.PI / 2 }, { R: 25, H: 6, a: Math.PI }, { R: 15, H: 6, a: -Math.PI / 2 }];
      WORLDS.peaks = {
        song: 'peaks', fog: [0xdce8f8, 45, 170], killY: -24, spawn: [0, 54, 0], exitAt: [-5.5, 55.5], bound: 80,
        light: { amb: 0.85, sun: 0.7, sky: 0xffffff, gnd: 0x8aa0c0, dir: [-0.4, 1, 0.5] },
        ice: (x, z) => Math.hypot(x - 34, z + 34) < 7,
        ground(x, z) {
          const r = Math.hypot(x, z), th = Math.atan2(z, x);
          let h = 0;
          for (const w of PW) { const d = wrapA(th - w.a), wd = 1.6 + 11 * Math.exp(-d * d / 0.05); h += w.H * sstep(w.R + wd / 2, w.R - wd / 2, r); }
          h += 2.6 * sstep(7, 1.5, r) + 0.12 * Math.sin(x * 0.4) * Math.cos(z * 0.33);
          return h - 40 * sstep(63, 66, r);
        },
        build() {
          sky([[0, '#5a8ad8'], [0.42, '#a8c8f0'], [0.52, '#eaf2ff'], [1, '#eaf2ff']], 7, 40);
          farRing(12, 160, 220, 40, 80, 0xd8e4f4, 0xb8c8e0, -40);
          const cl = new T.Mesh(new T.PlaneGeometry(800, 800), mat('cloudsea', { map: tile(tex('cloudsea1', 64, 32, (g, w, h) => { for (let i = 0; i < 9; i++) { const x = rnd() * w, y = rnd() * h, r = 6 + rnd() * 9; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }), 30), transparent: true, opacity: 0.9, lit: false, color: 0xf0f6ff })); cl.rotation.x = -Math.PI / 2; cl.position.y = -30; WG.add(cl);
          const under = new T.Mesh(new T.PlaneGeometry(800, 800), mat('cloudbase', { color: 0xc8d8f0, lit: false })); under.rotation.x = -Math.PI / 2; under.position.y = -36; WG.add(under);
          const snow = hexA(0xf4f8ff), blue = hexA(0xc8d8f4), rock = hexA(0x8a8a98), packed = hexA(0xe0e8f4);
          terrain(140, 104, 0, 0, this.ground, (x, z, y, sl) => y < -2 ? rock : sl > 1.1 ? mix3(rock, blue, 0.4 + 0.3 * Math.sin(y * 2)) : sl > 0.25 ? packed : mix3(snow, blue, 0.15 + 0.15 * Math.sin(x * 0.2 + z * 0.13)));
          // ledge out to the lonely iceberg
          box(64.5, -1.2, 0, 4, 1.2, 5, { t: 'ice', c: 0xe8f4ff }); cyl(76, -14, 0, 2.8, 14.4, { t: 'ice', c: 0xd8f0ff, top: 0.85, cr: 2.5 }); deco(ptM(S.cone(6), 0xe8f8ff, M(76, -16, 0, Math.PI, 0, 0, 5, 6, 5)), 'ice');
          // the summit snowman
          const SY = this.ground(0, 0);
          cyl(0, SY - 0.6, 0, 2.0, 23.4 - SY + 0.6, { vis: false }); cyl(0, 23.4, 0, 1.4, 2.5, { vis: false }); cyl(0, 25.9, 0, 1.0, 2.0, { vis: false }); cyl(0, 27.9, 0, 0.8, 1.3, { c: 0x1a1a22 });
          deco(ptM(S.ball(16), 0xf8fbff, M(0, 21.6, 0, 0, 0, 0, 4.8, 4.0, 4.8), 0.25)); deco(ptM(S.ball(16), 0xf8fbff, M(0, 24.6, 0, 0, 0, 0, 3.4, 3.0, 3.4), 0.2)); deco(ptM(S.ball(14), 0xf8fbff, M(0, 26.9, 0, 0, 0, 0, 2.4, 2.2, 2.4), 0.2));
          deco(ptM(S.cyl(14), 0x1a1a22, M(0, 27.95, 0, 0, 0, 0, 2.8, 0.15, 2.8))); deco(ptM(S.cyl(14), 0xe8261c, M(0, 28.25, 0, 0, 0, 0, 1.64, 0.25, 1.64)));
          deco(ptM(S.tor(0.25, 16), 0xe8261c, M(0, 25.8, 0, Math.PI / 2, 0, 0, 2.5, 2.5, 2.5))); deco(ptM(S.cone(8), 0xff8a1a, M(0, 26.9, -1.4, -Math.PI / 2, 0, 0, 0.36, 1.2, 0.36)));
          for (const s of [-1, 1]) { deco(ptM(S.ball(6), 0x1a1a22, M(s * 0.42, 27.3, -1.05, 0, 0, 0, 0.26, 0.26, 0.2))); deco(ptM(S.cyl(5), 0x6a3a1a, M(s * 2.2, 25.2, 0, 0, 0, s * 1.1, 0.14, 2.4, 0.14))); }
          // the igloo (its ice plug comes out with a ground pound)
          const IY = this.ground(-46, -18);
          cyl(-46, IY - 0.3, -18, 3.4, 3.3, { vis: false }); deco(ptM(S.hemi(16), 0xf0f8ff, M(-46, IY - 0.2, -18, 0, 0, 0, 7.4, 6.6, 7.4), 0.3), 'ice');
          deco(ptM(S.cyl(10), 0xe0eef8, M(-46, IY + 0.9, -14.6, Math.PI / 2, 0, 0, 2.4, 2.4, 2.0)), 'ice'); deco(ptM(S.cyl(10), 0x2a3a5a, M(-46, IY + 0.9, -13.55, Math.PI / 2, 0, 0, 1.7, 0.1, 1.7)));
          prop('plug', -46, IY + 3.0, -18, 0, 'peaks');
          // the frozen pond, an ice pillar, a big rock, pine trees, the race flag
          deco(ptM(S.cyl(24), 0xbfe8ff, M(34, this.ground(34, -34) + 0.04, -34, 0, 0, 0, 14, 0.08, 14), 0), 'ice');
          cyl(-40, this.ground(-40, 30) - 0.5, 30, 1.2, 5.1, { t: 'ice', c: 0xd8f0ff }); cyl(48, this.ground(48, 20) - 0.5, 20, 2, 3.0, { c: 0x8a8a98, t: 'detail' });
          for (let i = 0; i < 46; i++) {
            const a = rnd() * TAU, r = 39 + rnd() * 21, x = Math.cos(a) * r, z = Math.sin(a) * r;
            if (Math.hypot(x - 34, z + 34) < 10 || Math.hypot(x + 46, z + 18) < 8 || Math.hypot(x + 40, z - 30) < 4 || Math.hypot(x - 48, z - 20) < 5 || (x > 50 && Math.abs(z) < 7) || (Math.abs(x) < 8 && z > 40) || Math.abs(wrapA(a - Math.PI / 2)) < 0.25) continue;
            pine(x, z, 4 + rnd() * 3);
          }
          const FY = this.ground(0, 48); deco(ptM(S.cyl(6), 0xd8d8d8, M(-2.5, FY + 2, 48, 0, 0, 0, 0.16, 4, 0.16))); deco(ptM(S.cyl(6), 0xd8d8d8, M(2.5, FY + 2, 48, 0, 0, 0, 0.16, 4, 0.16)));
          const ban = new T.Mesh(new T.PlaneGeometry(5, 1), mat('finish', { map: tex('finish', 64, 16, g => { for (let x = 0; x < 64; x += 8) for (let y = 0; y < 16; y += 8) { g.fillStyle = ((x + y) / 8) % 2 ? '#111' : '#fff'; g.fillRect(x, y, 8, 8); } }), side: T.DoubleSide })); ban.position.set(0, FY + 3.6, 48); WG.add(ban);
          // acorns
          acorn('summit', 'SNOWMAN\'S SUMMIT', 0, 30.4, 0); acorn('race', 'RACE PERCY PENGUIN', 0, FY + 1.6, 46, { hidden: true, cond: 'race' });
          acorn('berg', 'LEAP TO THE LONELY BERG', 76, 1.6, 0); acorn('igloo', 'THE IGLOO\'S ICE PLUG', -46, IY + 5, -18, { hidden: true, cond: 'plug' });
          acorn('reds', 'EIGHT RED COINS', 6, FY + 1.4, 44, { hidden: true, cond: 'reds' }); acorn('c100', '100 COINS', 0, 0, 0, { hidden: true, cond: 'c100' });
          [[-40, this.ground(-40, 30) + 5.6, 30], [34, 1.0, -34], [30.5, 7.0, 0], [0, 13, 20], [0.9, 24.3, 1.0], [65.5, 1.0, 0], [0, 1.0, -50], [48, this.ground(48, 20) + 3.5, 20]].forEach(([x, y, z]) => red(x, y, z));
          // coins
          coinRing(0, 6.9, 0, 30.5, 20); coinRing(0, 12.9, 0, 20, 14); coinLine(-10, 0, 50, 10, 0, 50, 5, true); coinRing(34, 1.0, -34, 4.5, 8); coinRing(-46, 0, -18, 5.6, 8, true);
          coinLine(58, 0, 0, 63, 0, 0, 4, true); for (const w of PW) { const ca = Math.cos(w.a), sa = Math.sin(w.a); coinLine(ca * (w.R + 5), 0, sa * (w.R + 5), ca * (w.R - 5), 0, sa * (w.R - 5), 5, true); }
          coinRing(0, 0, 0, 3.4, 6, true); coinRing(-30, 0, 40, 4, 8, true);
          // Chilly Willies, Percy, signs
          [[21, 21], [-28, -10], [14, -14], [-16, 10], [30, 40]].forEach(([x, z]) => enemy('chilly', x, z, { r: 0.8, h: 1.9, still: true }));
          PERCY.home = [4, 5]; PERCY.y = this.ground(4, 5); PERCY.x = 4; PERCY.z = 5; PERCY.on = true;
          npc('percy', 'PERCY PENGUIN', 4, 5, 0, () => percyLines(), { y: this.ground(4, 5), percy: true });
          sign(3, 51, 0.2, ['FROSTY FLAPJACK PEAKS. MIND THE ICE.', 'THE MOUNTAIN GOES UP IN THREE BIG STEPS. LOOK FOR THE SLOPES WHERE THE SNOW IS PACKED DOWN.']);
          sign(60, 3, -1.57, ['THE LONELY BERG IS OUT THERE. TOO FAR TO JUMP? TRY A LONG JUMP:', 'RUN, HOLD ' + L('c') + ' AND PRESS ' + L('a') + ' AT THE SAME TIME!']);
          life(76, 2.2, 1.6);
        },
      };
      function pine(x, z, h) {
        const y = WD.ground(x, z); cyl(x, y - 0.3, z, 0.3, h * 0.4, { c: 0x6a4a2a, cr: 0.5 });
        for (let k = 0; k < 3; k++) { deco(ptM(S.cone(8), 0x2a6a4a, M(x, y + h * (0.35 + k * 0.22), z, 0, k, 0, h * (0.62 - k * 0.14), h * 0.42, h * (0.62 - k * 0.14)), 0.4)); deco(ptM(S.cone(8), 0xf8fbff, M(x, y + h * (0.47 + k * 0.22), z, 0, k + 0.4, 0, h * (0.44 - k * 0.12), h * 0.2, h * (0.44 - k * 0.12)))); }
      }
      function tile(t, n) { t.repeat.set(n, n); return t; }

      // ---- Ghoulish Ginger Manor (a gingerbread haunted house, at night)
      const MAZE = [[-44, -2, -24, -2], [-44, 22, -24, 22], [-44, -2, -44, 22], [-24, -2, -24, 8], [-24, 12, -24, 22], [-28, -2, -28, 16], [-32, 4, -32, 22], [-36, -2, -36, 16], [-40, 4, -40, 22]];
      WORLDS.manor = {
        song: 'manor', fog: [0x2a1a4a, 24, 100], killY: -20, spawn: [0, 40, 0], exitAt: [-5.5, 41.5], bound: 45, square: true,
        light: { amb: 0.6, sun: 0.6, sky: 0x8a8ad8, gnd: 0x3a2a4a, dir: [-0.5, 1, -0.4], sunCol: 0xc8d0ff },
        ground: (x, z) => 0.15 * Math.sin(x * 0.35) * Math.cos(z * 0.3),
        build() {
          sky([[0, '#05030f'], [0.4, '#1a1040'], [0.52, '#3a2a6a'], [1, '#2a1a4a']], 0);
          const st = []; for (let i = 0; i < 90; i++) { const a = rnd() * TAU, e = 0.15 + rnd() * 1.2; st.push(ptM(S.box(), 0xffffff, M(Math.cos(a) * Math.cos(e) * 300, Math.sin(e) * 300, Math.sin(a) * Math.cos(e) * 300, rnd(), rnd(), 0, 1.2, 1.2, 1.2))); }
          st.push(ptM(S.ball(16), 0xfff4c8, M(-150, 170, -220, 0, 0, 0, 40, 40, 40)));
          WG.add(new T.Mesh(merge(st), mat('stars', { vcol: true, lit: false, fog: false })));
          farRing(14, 140, 200, 20, 40, 0x1a1030, 0x24183a, -4);
          terrain(110, 60, 0, 0, this.ground, (x, z, y) => mix3(hexA(0x3a5a3a), hexA(0x4a3a5a), 0.5 + 0.5 * Math.sin(x * 0.2) * Math.cos(z * 0.17)));
          deco(ptM(S.box(), 0xffffff, M(0, 0.03, 13, 0, 0, 0, 4, 0.1, 54), 0), 'cobble');
          // the house: walls, three roof tiers, a chimney, porch, balcony, windows and icing
          box(0, 0, -20, 22, 10, 12, { t: 'ginger' });
          box(0, 10, -20, 22.6, 2, 12.6, { t: 'roof', c: 0xd8a0c8 }); box(0, 12, -20, 15, 2, 8, { t: 'roof', c: 0xd8a0c8 }); box(0, 14, -20, 8, 2, 4, { t: 'roof', c: 0xd8a0c8 });
          box(2.5, 16, -20, 1.6, 3.5, 1.6, { t: 'brick', c: 0xc8a090 });
          for (const y of [0.15, 10, 12, 14]) for (const z of [-26.35, -13.65]) deco(ptM(S.cyl(8), 0xfff4fa, M(0, y + (y > 1 ? 0 : 0), z, 0, 0, Math.PI / 2, 0.35, y > 1 ? (y === 10 ? 22.8 : y === 12 ? 15.2 : 8.2) : 22.2, 0.35)));
          for (const x of [-8, -4, 4, 8]) for (const y of [2.2, 6.6]) { if (y < 3 && Math.abs(x) < 5) continue; deco(ptM(S.box(), 0xffd86a, M(x, y + 0.9, -13.95, 0, 0, 0, 1.6, 1.8, 0.1)), 'vb'); deco(ptM(S.box(), 0x3a1a0a, M(x, y + 0.9, -13.9, 0, 0, 0, 0.12, 1.8, 0.08))); }
          deco(ptM(S.box(), 0x5a2a1a, M(0, 1.4, -13.9, 0, 0, 0, 1.8, 2.8, 0.12)));
          for (const s of [-1, 1]) { cyl(s * 2.6, 0, -12.2, 0.3, 3.0, { c: 0xffffff }); for (let k = 0; k < 6; k++) deco(ptM(S.tor(0.25, 10), 0xe8261c, M(s * 2.6, 0.3 + k * 0.5, -12.2, Math.PI / 2, 0, 0, 0.7, 0.7, 0.7))); }
          box(0, 3.0, -12.5, 6.4, 0.4, 3.2, { t: 'roof', c: 0xd8a0c8 });
          box(4.4, 0, -11.5, 1.2, 1.8, 1.2, { c: 0x8a8a9a, t: 'detail' }); deco(ptM(S.ball(8), 0x9a9aaa, M(4.4, 2.2, -11.5, 0, 0, 0, 0.9, 0.9, 0.9)));
          box(-6, 6.0, -13, 6, 0.4, 2.2, { t: 'wood', c: 0x9a6a4a }); for (let x = -8.8; x <= -3.2; x += 0.7) deco(ptM(S.cyl(5), 0xfff4fa, M(x, 6.8, -12, 0, 0, 0, 0.12, 0.8, 0.12))); deco(ptM(S.box(), 0xfff4fa, M(-6, 7.25, -12, 0, 0, 0, 6, 0.12, 0.15)));
          // the west tower (kick up between it and the house) and the haunted lift on the east side
          cyl(-16, 0, -18, 3, 16, { t: 'ginger' }); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; deco(ptM(S.box(), 0xfff4fa, M(-16 + Math.cos(a) * 2.7, 16.35, -18 + Math.sin(a) * 2.7, 0, -a, 0, 0.7, 0.7, 0.7))); }
          for (const y of [4, 9, 13]) deco(ptM(S.box(), 0xffd86a, M(-16, y, -14.96, 0, 0, 0, 0.9, 1.4, 0.1)), 'vb');
          mover('box', 2.6, 0.4, 2.6, { t: 'wood', c: 0x8a5a3a }, (s, t) => { s.x = 13.4; s.z = -20; s.y = 0.3 + 11.7 * (0.5 - 0.5 * Math.cos(t * TAU / 9)); });
          for (const dx of [-1.1, 1.1]) deco(ptM(S.cyl(4), 0x6a6a7a, M(13.4 + dx, 13.5, -20, 0, 0, 0, 0.08, 3, 0.08))); deco(ptM(S.box(), 0x4a2a1a, M(13.4, 15, -20, 0, 0, 0, 3.4, 0.4, 0.6)));
          box(13.4, 0, -22.3, 0.3, 15, 0.3, { c: 0x4a2a1a }); box(13.4, 0, -17.7, 0.3, 15, 0.3, { c: 0x4a2a1a });
          // the graveyard (Big Boohoo lives here), a crypt, dead trees
          for (let i = 0; i < 14; i++) { const x = 12 + (i % 5) * 4 + rnd(), z = 6 + Math.floor(i / 5) * 6 + rnd() * 2; box(x, 0, z, 1.1, 1.3 + rnd() * 0.5, 0.35, { c: 0x8a8a9a, t: 'detail', ry: rnd() * 0.3 - 0.15 }); deco(ptM(S.cyl(10), 0x8a8a9a, M(x, 1.55, z, Math.PI / 2, 0, 0, 1.1, 0.35, 0.8))); }
          box(26, 0, 22, 4, 3, 5, { c: 0x7a7a8a, t: 'detail' }); deco(ptM(S.box(), 0x9a9aaa, M(26, 3.15, 22, 0, 0, 0, 4.4, 0.3, 5.4)));
          for (const [x, z] of [[-14, 30], [16, -4], [34, 30], [-34, 34], [36, -20], [-8, 12]]) deadTree(x, z);
          // the hedge maze
          for (const [x0, z0, x1, z1] of MAZE) { const vert = x0 === x1; box((x0 + x1) / 2, 0, (z0 + z1) / 2, vert ? 0.9 : Math.abs(x1 - x0) + 0.9, 3.4, vert ? Math.abs(z1 - z0) + 0.9 : 0.9, { t: 'hedge' }); }
          // the fountain, the lanterns, pumpkins, the iron fence
          cyl(-20, 0, 10, 2.4, 0.7, { t: 'cobble', c: 0xb8b0c8 }); cyl(-20, 0.7, 10, 0.4, 1.8, { c: 0x9a92aa }); cyl(-20, 2.5, 10, 1.2, 0.3, { c: 0x9a92aa });
          deco(ptM(S.cyl(16), 0x5aff8a, M(-20, 0.62, 10, 0, 0, 0, 4.4, 0.04, 4.4)), 'vb');
          [[-30, -4], [-30, 28], [30, -6], [16, 34]].forEach(([x, z], i) => { cyl(x, 0, z, 0.15, 2.6, { c: 0x2a2a34, cr: 0.3 }); LAMPS.push({ x, z, lit: false, m: lampMesh(x, 2.85, z) }); });
          for (let i = 0; i < 12; i++) { const x = -38 + rnd() * 76, z = -6 + rnd() * 44; if (x < -22 && z < 24) continue; if (Math.abs(x) < 3) continue; deco(ptM(S.ball(10), 0xff7a1a, M(x, 0.4, z, 0, 0, 0, 0.9, 0.7, 0.9), 0.3)); deco(ptM(S.box(), 0xffe04a, M(x, 0.45, z - 0.42, 0, 0, 0, 0.36, 0.14, 0.05)), 'vb'); }
          for (let i = -46; i <= 46; i += 2) for (const [x, z] of [[i, -46], [i, 46], [-46, i], [46, i]]) { if (z === 46 && Math.abs(x) < 3) continue; deco(ptM(S.cyl(4), 0x1a1a24, M(x, 1.2, z, 0, 0, 0, 0.12, 2.4, 0.12))); deco(ptM(S.cone(4), 0x1a1a24, M(x, 2.5, z, 0, 0, 0, 0.2, 0.3, 0.2))); }
          for (const [x, z, w, d] of [[0, -46, 92, 0.12], [0, 46, 92, 0.12], [-46, 0, 0.12, 92], [46, 0, 0.12, 92]]) deco(ptM(S.box(), 0x1a1a24, M(x, 2.0, z, 0, 0, 0, w, 0.12, d)));
          // acorns, red coins, coins
          acorn('boohoo', 'BIG BOOHOO\'S GRAVEYARD', 20, 1.6, 14, { hidden: true, cond: 'boss' }); acorn('chimney', 'TOP OF THE CHIMNEY', 2.5, 20.7, -20);
          acorn('ghosts', 'GHOST HUNT', 0, 1.6, 24, { hidden: true, cond: 'enemies' }); acorn('lamps', 'LIGHT THE FOUR LANTERNS', -20, 3.8, 10, { hidden: true, cond: 'lamps' });
          acorn('reds', 'EIGHT RED COINS', -42, 1.6, 18, { hidden: true, cond: 'reds' }); acorn('c100', '100 COINS', 0, 0, 0, { hidden: true, cond: 'c100' });
          [[-26, 1.2, 20], [-30, 1.2, 0], [-34, 1.2, 20], [-38, 1.2, 0], [-42, 1.2, 1], [-16, 17, -18], [2.5, 4.4, -12.5], [26, 4, 22]].forEach(([x, y, z]) => red(x, y, z));
          coinLine(0, 0, 36, 0, 0, -10, 10, true); coinRing(-20, 0, 10, 4, 8, true); coinLine(-9, 12.9, -15, 9, 12.9, -15, 6); coinLine(-6, 14.9, -20, 6, 14.9, -20, 4);
          coinRing(16, 0, 10, 3, 6, true); coinRing(24, 0, 16, 3, 6, true); for (const x of [-26, -30, -34, -38]) coinLine(x, 0, 4, x, 0, 16, 4, true);
          [[-30, -4], [-30, 28], [30, -6], [16, 34]].forEach(([x, z]) => coinRing(x, 0, z, 2, 4, true)); coinLine(-8.5, 7.3, -13, -3.5, 7.3, -13, 3); coinLine(-12, 0, -11, 12, 0, -11, 8, true);
          [[-10, 20], [12, -4], [-18, -6], [30, 8], [-6, 30]].forEach(([x, z]) => enemy('boohoo', x, z, { y0: 1.0, fly: true, r: 0.8, h: 1.6, range: 8 }));
          npc('hubert', 'SIR HUBERT', 4, 36, -2.6, ['GOOD EVENING, SIR. WELCOME TO GHOULISH GINGER MANOR. I AM SIR HUBERT, THE BUTLER. I HAVE BEEN DEAD FOR TWO HUNDRED YEARS, BUT I STILL DO THE DUSTING.', 'THE YOUNGER GHOSTS ARE SHY. THEY CREEP UP WHEN YOUR BACK IS TURNED, AND HIDE THEIR FACES WHEN YOU LOOK AT THEM. WHILE THEY ARE HIDING, GIVE THEM A GOOD PUNCH.', 'THE LANTERNS IN THE GARDEN HAVE GONE OUT. TOUCH ALL FOUR TO LIGHT THEM AGAIN, WOULD YOU?', 'AND DO MIND HER LADYSHIP, BIG BOOHOO, IN THE GRAVEYARD. SHE HATES BEING WOKEN UP.'], { y: 1.0, ghost: true });
          sign(-21.5, 9.2, -1.3, ['THE HEDGE MAZE. SOME RED COINS GOT LOST IN HERE.']);
          sign(9, -11, 2.6, ['THE HAUNTED LIFT GOES UP TO THE ROOF. PROBABLY.']);
          life(-16, 17.2, -20);
        },
      };
      function deadTree(x, z) { cyl(x, 0, z, 0.4, 5, { c: 0x2a1a24, top: 0.5, cr: 0.5 }); for (let i = 0; i < 4; i++) { const a = i * 1.7; deco(ptM(S.cyl(5, 0.4), 0x2a1a24, M(x + Math.cos(a) * 0.8, 3.5 + i * 0.4, z + Math.sin(a) * 0.8, Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9, 0.3, 2.4, 0.3))); } }
      function lampMesh(x, y, z) { const m = new T.Mesh(merge([pt(S.box(), 0xffffff, 0, 0, 0, 0.6, 0.7, 0.6), pt(S.cone(4), 0x2a2a34, 0, 0.55, 0, 0.8, 0.4, 0.8, 0, 0.785)]), T3.mat({ vcol: true, color: 0x4a4a5a, emissive: 0x000000 })); m.position.set(x, y, z); WG.add(m); return m; }
      // ---- Tick-Tock Tower (a clockwork tower over the clouds at sunset)
      const tp = (th, R) => [Math.sin(th) * R, Math.cos(th) * R];
      WORLDS.tower = {
        song: 'tower', fog: [0xf0b0a0, 70, 240], killY: -26, spawn: [0, 10.5, -Math.PI / 2], exitAt: [-4.6, 10.6], bound: 40, safeOnly: true,
        light: { amb: 0.75, sun: 0.85, sky: 0xffe0c0, gnd: 0x8a5a7a, dir: [0.7, 0.8, 0.3], sunCol: 0xffe0b0 },
        ground: () => -999,
        build() {
          sky([[0, '#3a2a8a'], [0.4, '#e86a8a'], [0.5, '#ffc87a'], [1, '#ffe0a0']], 10, -10, 0xffd8c0);
          const cs = new T.Mesh(new T.PlaneGeometry(900, 900), mat('cloudsea2', { map: tile(tex('cloudsea', 64, 32, (g, w, h) => { g.fillStyle = 'rgba(255,220,200,.0)'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { const x = rnd() * w, y = rnd() * h, r = 6 + rnd() * 9; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,230,220,.95)'); gr.addColorStop(1, 'rgba(255,220,210,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }), 40), transparent: true, opacity: 0.95, lit: false, color: 0xffd8d0 }));
          cs.rotation.x = -Math.PI / 2; cs.position.y = -34; WG.add(cs);
          const base2 = new T.Mesh(new T.PlaneGeometry(900, 900), mat('cloudbase2', { color: 0xe8a8a8, lit: false })); base2.rotation.x = -Math.PI / 2; base2.position.y = -40; WG.add(base2);
          const fg = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = 150 + rnd() * 60, s = 14 + rnd() * 20; fg.push(ptM(S.tor(0.25, 14), 0xb88a5a, M(Math.cos(a) * r, -10 + rnd() * 60, Math.sin(a) * r, rnd(), rnd(), 0, s, s, s))); for (let k = 0; k < 8; k++) { const b = k / 8 * TAU; fg.push(ptM(S.box(), 0xb88a5a, M(Math.cos(a) * r, -10, Math.sin(a) * r, 0, 0, 0, 1, 1, 1))); } }
          WG.add(new T.Mesh(merge(fg.filter((p, i) => i % 9 === 0)), mat('fargears', { vcol: true, fog: false })));
          // the tower, its clock faces and real hands, the bell on top
          cyl(0, -12, 0, 6, 68, { t: 'brick', c: 0xf0e0c8, seg: 20 });
          for (const y of [8, 22, 36, 50]) deco(ptM(S.tor(0.2, 24), 0xc8a050, M(0, y, 0, Math.PI / 2, 0, 0, 12.4, 12.4, 6)), 'metal');
          cyl(0, -3, 0, 13, 3, { t: 'metal', seg: 24 }); cyl(0, 55.4, 0, 7.5, 0.6, { t: 'metal', seg: 20 });
          for (const [x, z] of [[3.6, 3.6], [-3.6, 3.6], [3.6, -3.6], [-3.6, -3.6]]) cyl(x, 56, z, 0.35, 5.6, { c: 0xd8b060 });
          deco(ptM(S.cone(4), 0x8a3a3a, M(0, 63.5, 0, 0, Math.PI / 4, 0, 11.5, 3.6, 11.5)), 'roof');
          const bell = new T.Mesh(merge([pt(S.cyl(14, 0.55), 0xd8a83a, 0, 0, 0, 2.6, 2.2, 2.6, 0, 0, 0, 0.3), pt(S.ball(10), 0xd8a83a, 0, 1.1, 0, 1.5, 0.8, 1.5), pt(S.ball(8), 0x8a6a2a, 0, -1.1, 0, 0.5, 0.5, 0.5)]), matV()); bell.position.set(0, 60, 0); WG.add(bell); WG.userData.bell = bell;
          for (const [y, a] of [[20, 0], [40, Math.PI]]) {
            const face = new T.Mesh(new T.CircleGeometry(4.6, 24), mat('clockface', { map: TEX.clock() })); const [fx, fz] = tp(a, 6.05); face.position.set(fx, y, fz); face.rotation.y = a; WG.add(face);
            const hands = new T.Group(); hands.position.set(fx * 1.01, y, fz * 1.01); hands.rotation.y = a; WG.add(hands);
            const hh = new T.Mesh(merge([pt(S.box(), 0x2a1a0a, 0, 1.2, 0, 0.35, 2.6, 0.08)]), matV()), mh = new T.Mesh(merge([pt(S.box(), 0x2a1a0a, 0, 1.7, 0.05, 0.22, 3.6, 0.08)]), matV());
            hands.add(hh); hands.add(mh); (WG.userData.hands = WG.userData.hands || []).push([hh, mh]);
          }
          // 1: steps
          for (let k = 0; k < 6; k++) { const th = 0.6 + 0.2 * k, [x, z] = tp(th, 9.5); box(x, k + 0.5, z, 2.4, 0.5, 2.4, { ry: th, t: 'metal' }); }
          // 2: spinning gears
          gear(2.0, 10, 7, 2.4, 0.7); gear(2.5, 10.5, 8.5, 2.4, -0.9);
          // 3: L1, the cable car to L2
          ledge(3.0, 10, 10); ledge(4.2, 10, 10);
          { const [ax, az] = tp(3.0, 10), [bx, bz] = tp(4.2, 10);
            const P = [pt(S.box(), 0xb88a5a, 0, 0, 0, 3, 0.5, 3), pt(S.cyl(4), 0x4a4a5a, 0, 2.9, 0, 0.1, 5.6, 0.1), pt(S.box(), 0x8a3a3a, 0, 5.8, 0, 0.8, 0.6, 1.2)];
            mover('box', 3, 0.5, 3, { parts: P, t: 'metal' }, (s, t) => { const f = 0.5 + 0.18 * Math.sin(t * 1.3); s.x = lerp(ax, bx, f); s.z = lerp(az, bz, f); s.y = 10; s.ry = Math.atan2(bx - ax, bz - az); });
            const ang = Math.atan2(bx - ax, bz - az), len = Math.hypot(bx - ax, bz - az); deco(ptM(S.box(), 0x3a3a48, M((ax + bx) / 2, 16.1, (az + bz) / 2, 0, ang, 0, 0.25, 0.25, len)));
            acorn('cable', 'CABLE CAR CATCH', (ax + bx) / 2, 13.6, (az + bz) / 2); coinLine(ax, 11, az, bx, 11, bz, 5); }
          // 4: lift up to L3
          { const [x, z] = tp(4.6, 10); mover('box', 3, 0.5, 3, { t: 'metal', c: 0xd8c0a0 }, (s, t) => { s.x = x; s.z = z; s.y = 15.75 + 6 * Math.sin(t * TAU / 8); }); for (let i = 0; i < 4; i++) coin(x, 13 + i * 2.3, z); }
          ledge(5.0, 10.5, 22);
          // 5: the clock arms sweep round at y 24
          for (const k of [0, 1]) mover('box', 13, 0.6, 2.2, { t: 'metal', c: 0x5a4a3a, parts: [pt(S.box(), 0x4a3a2a, 0, 0, 0, 13, 0.6, 2.2), pt(S.cone(3), 0x4a3a2a, 7.4, 0, 0, 2.2, 1.8, 0.6, 0, 0, -Math.PI / 2)] },
            (s, t) => { const ph = t * 0.32 + k * Math.PI, [x, z] = tp(ph, 12.5); s.x = x; s.z = z; s.y = 24; s.ry = ph - Math.PI / 2; });
          coinRing(0, 25.2, 0, 12.5, 8);
          ledge(1.2, 17, 26);
          // 6: the conveyor belt (pushes you back) to L5
          { const th = 1.8, [x, z] = tp(th, 16); box(x, 26.2, z, 11.6, 0.8, 3, { ry: th, t: 'belt', props: { belt: [-Math.cos(th) * 3.2, Math.sin(th) * 3.2] } }); coinLine(...(() => { const [ax, az] = tp(1.5, 16.4), [bx, bz] = tp(2.1, 16.4); return [ax, 28, az, bx, 28, bz]; })(), 6); }
          ledge(2.5, 15, 28);
          // 7: the Gear Deck, the kick-off ledge, the wall-kick pillar, the slow lift and L6
          { const [x, z] = tp(3.2, 13); cyl(x, 29.2, z, 5, 0.8, { t: 'metal', seg: 20 }); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; deco(ptM(S.box(), 0xc8a050, M(x + Math.cos(a) * 5.2, 29.6, z + Math.sin(a) * 5.2, 0, -a, 0, 0.8, 0.6, 0.9)), 'metal'); } coinRing(x, 31, z, 3, 10); }
          ledge(3.95, 7.5, 30, 2.6);
          { const th = 3.95, [x, z] = tp(th, 10.5); box(x, 30, z, 3, 16, 3, { ry: th, t: 'brick', c: 0xd8c8b0 }); const [cx, cz] = tp(th, 7.5); acorn('wall', 'WALL-KICK WALK', cx, 40, cz); coinLine(cx, 33, cz, cx, 44, cz, 4); }
          { const [x, z] = tp(3.55, 18.5); mover('box', 3, 0.5, 3, { t: 'metal', c: 0xd8c0a0 }, (s, t) => { s.x = x; s.z = z; s.y = 38 + 8.25 * Math.sin(t * TAU / 12); }); for (let i = 0; i < 5; i++) coin(x, 32 + i * 3, z); }
          ledge(3.75, 15, 46);
          // 8: gear stairs to the top
          [[4.45, 48, 0.8], [4.95, 50, -0.8], [5.45, 52, 0.9], [5.95, 54, -0.9]].forEach(([th, y, sp]) => gear(th, 10, y, 2.2, sp));
          // acorns, red coins, coins
          acorn('top', 'TOP OF THE TOWER', 0, 57.6, 0); acorn('bots', 'TICK-BOT TAKEDOWN', ...(() => { const [x, z] = tp(3.2, 13); return [x, 31.6, z]; })(), { hidden: true, cond: 'enemies' });
          acorn('reds', 'EIGHT RED COINS', -7.4, 1.6, 7.4, { hidden: true, cond: 'reds' }); acorn('c100', '100 COINS', 0, 0, 0, { hidden: true, cond: 'c100' });
          [[1.2, 9.5, 5], [2.5, 10.5, 9.5], [5.0, 10.5, 23], [2.15, 16.4, 28.2], [3.2, 13, 31], [3.75, 15, 47], [5.45, 10, 53], [Math.PI, 10.5, 1]].forEach(([th, R, y]) => { const [x, z] = tp(th, R); red(x, y, z); });
          for (let k = 0; k < 6; k++) { const [x, z] = tp(0.6 + 0.2 * k, 9.5); coin(x, k + 1.9, z); }
          for (const [th, R, y] of [[2.0, 10, 7.9], [2.5, 10.5, 9.4], [3.0, 10, 10.9], [5.0, 10.5, 22.9], [1.2, 17, 26.9], [2.5, 15, 28.9], [3.75, 15, 46.9]]) { const [x, z] = tp(th, R); coinRing(x, y, z, 1.1, 3); }
          [[4.45, 48], [4.95, 50], [5.45, 52], [5.95, 54]].forEach(([th, y]) => { const [x, z] = tp(th, 10); coin(x, y + 0.9, z); coin(x + 0.8, y + 0.9, z); });
          coinRing(0, 56.9, 0, 5, 8); coinRing(0, 0.9, 0, 10.5, 12);
          // tick-bots, Professor Cog
          ENS.length;
          [[3.0, 10, 10, 1.6], [2.5, 15, 28, 1.6], [3.2, 13, 30, 4], [3.2, 13, 30, 4], [3.2, 13, 30, 4]].forEach(([th, R, y, rr], i) => { const [x, z] = tp(th, R); enemy('tickbot', x + (i > 2 ? (i - 3.5) * 2 : 0), z, { y0: y, patrol: [x, z, rr], r: 0.7, h: 1.6 }); });
          npc('cog', 'PROFESSOR COG', 3.4, 10.4, 2.8, ['TICK... TOCK... AH! A VISITOR! I AM PROFESSOR COG. I WIND UP THE TOWER EVERY MORNING.', 'GO UP AND ROUND: THE STEPS, MY SPINNING GEARS, THE CABLE CAR, THE LIFT, THEN HOP ON THE BIG CLOCK HANDS AS THEY SWEEP ROUND.', 'THE TICK-BOTS HAVE GONE HAYWIRE. KNOCK THEM ALL OVER AND I SHALL GIVE YOU SOMETHING SHINY.', 'IF YOU ARE BRAVE, YOU CAN KICK YOUR WAY UP THE GAP BEHIND THE TALL PILLAR INSTEAD OF WAITING FOR THE SLOW LIFT.'], { y: 0 });
          sign(...tp(0.35, 11), 0.4, ['TICK-TOCK TOWER. DO NOT LOOK DOWN.'], 0);
          life(...(() => { const [x, z] = tp(1.2, 17); return [x, 27.4, z]; })());
        },
      };
      function gear(th, R, top, r, spin) {
        const [x, z] = tp(th, R), P = [pt(S.cyl(16), 0xc8a050, 0, 0, 0, r * 2, 0.6, r * 2)];
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; P.push(pt(S.box(), 0xb89040, Math.cos(a) * r, 0, Math.sin(a) * r, 0.6, 0.6, 0.6, 0, -a)); }
        P.push(pt(S.cyl(8), 0x8a6a2a, 0, 0.32, 0, 0.6, 0.1, 0.6));
        mover('cyl', r, 0.6, r, { parts: P, t: 'metal' }, (s, t) => { s.x = x; s.z = z; s.y0 = top - 0.6; s.y1 = top; s.ry = t * spin; s.spin = spin; });
      }
      function ledge(th, R, top, w) { const [x, z] = tp(th, R); box(x, top - 1, z, w || 4, 1, w || 4, { ry: th, t: 'metal' }); deco(ptM(S.box(), 0x8a6a3a, M(x, top - 1.3, z, 0, th, 0, (w || 4) * 0.6, 0.6, (w || 4) * 0.6))); }
      // ---- The Biscuit Barrel (King Grumpus's arena over the lava)
      WORLDS.boss = {
        song: 'boss', fog: [0x5a1a10, 40, 160], killY: -20, lava: 0, spawn: [0, 44, 0], exitAt: [-2.4, 45.6], bound: 60,
        light: { amb: 0.7, sun: 0.8, sky: 0xffa080, gnd: 0x6a1a10, dir: [0.3, 1, 0.5], sunCol: 0xffc090 },
        ground: () => -999,
        build() {
          sky([[0, '#1a0404'], [0.4, '#5a1208'], [0.52, '#c8481a'], [1, '#c8481a']], 0);
          farRing(10, 150, 220, 40, 90, 0x3a0a08, 0x2a0806, -6);
          seaPlane(0, 'lava', 0xffffff, 1);
          cyl(0, -6, 0, 18, 8, { t: 'cobble', c: 0xd8c8c8, seg: 28 }); deco(ptM(S.cyl(28, 0.8), 0x5a3a3a, M(0, -8, 0, 0, 0, 0, 36, 4, 36)), 'cobble');
          for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; cyl(Math.sin(a) * 15.8, 2, Math.cos(a) * 15.8, 1.1, 4.5, { t: 'brick', c: 0xd8b8a8, props: { pillar: true } }); deco(ptM(S.ball(8), 0xffd23a, M(Math.sin(a) * 15.8, 6.9, Math.cos(a) * 15.8, 0, 0, 0, 0.9, 0.9, 0.9))); }
          deco(ptM(S.box(), 0x8a1a1a, M(0, 2.05, 0, 0, 0, 0, 28, 0.1, 3), 0)); deco(ptM(S.box(), 0x8a1a1a, M(0, 2.05, 0, 0, Math.PI / 2, 0, 28, 0.1, 3), 0));
          box(0, 2, -16.5, 4, 1, 2.4, { c: 0xffd23a }); box(0, 3, -17.5, 4, 4, 0.6, { c: 0xa8141a });
          cyl(0, -6, 44, 4, 8, { t: 'cobble', c: 0xd8c8c8 }); cyl(0, -6, 36.5, 2, 8, { t: 'cobble', c: 0xd8c8c8 }); cyl(-1.5, -6, 24.5, 2, 8, { t: 'cobble', c: 0xd8c8c8 });
          mover('cyl', 2, 8, 2, { parts: [pt(S.cyl(16), 0xd8c8c8, 0, 0, 0, 4, 1, 4, 0, 0, 0, 0.3)], t: 'cobble' }, (s, t) => { s.x = 3 * Math.sin(t * 1.1); s.z = 30.5; s.y0 = 1.5; s.y1 = 2; s.ry = 0; });
          acorn('crown', 'THE CROWN ACORN', 0, 3.6, 0, { hidden: true, cond: 'boss' });
          coinRing(0, 2.9, 0, 10, 12); coinLine(0, 2.9, 41, 0, 2.9, 26, 5);
          sign(2.6, 42.4, 0.4, ['KING GRUMPUS LIVES HERE. GO AWAY.', '(HINT: WHEN HE IS DIZZY, JUMP ON HIS HEAD. OR BETTER, GROUND POUND IT!)'], 2);
          BOSS.reset();
        },
      };

      // ================================================================ progress (saved) and the visit (not saved)
      const prog = { got: {}, ac: {}, score: 0, lives: 4, opt: { mus: 1, cam: 1, easy: 0 }, hs: [], boss: 0, started: 0, w: 'hub', p: null, door: -1 };
      (function loadProg() {
        const s = K.load(); if (!s || typeof s !== 'object') return;
        prog.got = s.got && typeof s.got === 'object' ? s.got : {}; prog.ac = s.ac && typeof s.ac === 'object' ? s.ac : {};
        prog.score = Math.max(0, s.score | 0); prog.lives = s.lives != null ? clamp(s.lives | 0, 0, 99) : 4;
        if (s.opt) Object.assign(prog.opt, s.opt); if (Array.isArray(s.hs)) prog.hs = s.hs.slice(0, 8);
        prog.boss = s.boss | 0; prog.w = WORLDS[s.w] ? s.w : 'hub'; prog.p = Array.isArray(s.p) ? s.p : null; prog.door = s.door == null ? -1 : s.door;
        prog.started = s.v2 ? (s.started | 0) : (Object.keys(prog.got).length || s.score ? 1 : 0); // an old (one-island) save still counts
      })();
      const gotAc = id => curW === 'hub' ? !!prog.got[id] : !!(prog.ac[curW] && prog.ac[curW][id]);
      const nAc = () => Object.keys(prog.got).length + Object.keys(prog.ac).reduce((n, w) => n + Object.keys(prog.ac[w] || {}).length, 0);
      const nAcW = w => w === 'hub' ? Object.keys(prog.got).length : Object.keys(prog.ac[w] || {}).length;
      const TOTAL = 33;
      function saveNow() {
        if (demo) return;
        K.save({ v2: 1, started: prog.started, score: prog.score, got: prog.got, ac: prog.ac, lives: prog.lives, opt: prog.opt, hs: prog.hs, boss: prog.boss,
          w: curW === 'boss' ? 'hub' : curW, p: curW === 'boss' ? null : [+P.x.toFixed(2), +P.y.toFixed(2), +P.z.toFixed(2)], door: prog.door });
      }
      let tok0 = 0;
      function sendScore(final, title, text) {
        const sc = Math.min(prog.score, 20000, Math.floor(95 * (K.t - tok0 + 4)));
        tok0 = K.t;
        if (final) K.over(sc, { title, text }); else K.over(sc, { keep: true });
      }
      const myName = () => { let n = 'JACK'; try { if (window.Net && Net.me && Net.me.nick) n = String(Net.me.nick); } catch (e) {} return n.toUpperCase().replace(/[^A-Z0-9 _-]/g, '').slice(0, 10) || 'JACK'; };
      function addHs() { if (prog.score <= 0) return; prog.hs.push({ n: myName(), s: Math.min(prog.score, 20000), a: nAc() }); prog.hs.sort((a, b) => b.s - a.s); prog.hs = prog.hs.slice(0, 5); }
      const castN = (id, d) => { try { return (window.Cast && Cast.n(id)) || d; } catch (e) { return d; } };
      function table() {
        const M_ = [['DAVE', 14800, 29], ['LUKE', 11200, 22], ['JACKK', 8600, 17], ['CALLUM', 5200, 10], [castN('kidPoke', 'Tom'), 3100, 6], [castN('kidEp1', 'Sam'), 1800, 3], ['MOM', 600, 1]].map(([n, s, a]) => ({ n: String(n).toUpperCase().slice(0, 10), s, a, mate: 1 }));
        return M_.concat(prog.hs).sort((a, b) => b.s - a.s).slice(0, 8);
      }

      let curW = 'hub', demo = false;
      const visit = { coins: 0, reds: 0, kills: 0, t: 0, life50: 0 };
      let LAMPS = [], PROPS = [], chestOpen = {}, plugOut = {}, bossDown = false, raceWon = false;
      const HPMAX = () => prog.opt.easy ? 8 : 6;
      const P = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, face: 0, gnd: true, st: 'idle', stT: 0, chain: 0, chainT: 0, twirl: false, kicked: false, wallT: 0, wnx: 0, wnz: 0, punchN: 0, punchT: 0, inv: 0, hp: 6, plat: null, safe: [0, 0, 0], safeT: 0, run: 0, land: 0, ctrl: 0, yaw: 0, spin: 0, fallY: 0 };
      const IN = { x: 0, y: 0, a: false, aH: false, b: false, c: false, cH: false, l: false, r: false };
      function readInput() { const s = K.stick(); IN.x = s.x; IN.y = s.y; IN.a = K.pressed('a'); IN.aH = K.held('a'); IN.b = K.pressed('b'); IN.c = K.pressed('c') || K.pressed('x'); IN.cH = K.held('c') || K.held('x'); IN.l = K.pressed('l'); IN.r = K.pressed('r'); }

      // ================================================================ building and leaving worlds
      let coinMesh_ = null, redMesh_ = null, lifeMeshes = [], doorExit = null, snowM = [];
      const coinMat = T3.mat({ color: 0xffd23a, emissive: 0x6a4a00 }), redMat = T3.mat({ color: 0xff3a3a, emissive: 0x6a0a0a });
      function disposeWorld() {
        WG.traverse(o => { if (o.geometry && !o.geometry.userData.persist) o.geometry.dispose(); if (o.isInstancedMesh && o.dispose) o.dispose(); });
        T3.scene.remove(WG); WG = null;
      }
      function buildWorld(id) {
        if (WG) disposeWorld();
        WG = new T.Group(); T3.add(WG); BK = buckets(); WD = WORLDS[id]; curW = id;
        BOXES.length = 0; CYLS.length = 0; MOVERS.length = 0; COINS = []; REDS = []; ACS = []; ENS = []; NPCS = []; DOORS = []; LIFE = []; LAMPS = []; PROPS = []; SNOWB.length = 0;
        chestOpen = {}; plugOut = {}; bossDown = false; raceWon = false; PERCY.on = false; PERCY.st = 'idle'; BB.on = false;
        Object.assign(visit, { coins: 0, reds: 0, kills: 0, t: 0, life50: 0 });
        WD.build();
        if (WD.exitAt) exitDoorBuild();
        BK.flush();
        const f = T3.scene.fog; f.color.setHex(WD.fog[0]); f.near = WD.fog[1]; f.far = WD.fog[2];
        const l = WD.light; LT.hemi.color.setHex(l.sky); LT.hemi.groundColor.setHex(l.gnd); LT.hemi.intensity = l.amb; LT.sun.intensity = l.sun; LT.sun.color.setHex(l.sunCol || 0xffffff); LT.sun.position.set(...l.dir);
        coinMesh_ = new T.InstancedMesh(coinGeo, coinMat, COINS.length + 40); coinMesh_.frustumCulled = false; WG.add(coinMesh_);
        redMesh_ = new T.InstancedMesh(coinGeo, redMat, Math.max(1, REDS.length)); redMesh_.frustumCulled = false; WG.add(redMesh_);
        for (const a of ACS) { a.mesh = new T.Mesh(acornGeo, gotAc(a.id) ? matGhost : matAcorn); a.mesh.position.set(a.x, a.y, a.z); a.mesh.visible = !a.hidden; WG.add(a.mesh); }
        for (const e of ENS) { e.mesh = new T.Mesh(model(e.kind), e.kind === 'boohoo' ? ghostMat : matV()); e.mesh.position.set(e.x, e.y, e.z); WG.add(e.mesh); }
        for (const n of NPCS) { n.mesh = new T.Mesh(model(n.kind), n.ghost ? ghostMat : matV()); n.mesh.position.set(n.x, n.y, n.z); n.mesh.rotation.y = n.face; WG.add(n.mesh); if (n.percy) { PERCY.mesh = n.mesh; PERCY.npc = n; } else if (!n.ghost) CYLS.push({ k: 'cyl', x: n.x, z: n.z, r: n.kind === 'sign' ? 0.3 : 0.75, y0: n.y - 0.2, y1: n.y + (n.kind === 'sign' ? 1.75 : 1.6) }); }
        lifeMeshes = LIFE.map(o => { const m = new T.Mesh(model('life'), matV()); m.position.set(o.x, o.y, o.z); m.scale.setScalar(0.9); WG.add(m); return m; });
        snowM = []; for (let i = 0; i < 6; i++) { const m = new T.Mesh(model('snowball'), matV()); m.visible = false; WG.add(m); snowM.push(m); }
        if (id === 'manor') BB.init(); if (id === 'boss') BOSS.init();
      }
      function exitDoorBuild() {
        const [x, z] = WD.exitAt, sx = WD.spawn[0], sz = WD.spawn[1], d = Math.hypot(sx - x, sz - z) || 1, fx = (sx - x) / d, fz = (sz - z) / d, ry = Math.atan2(fx, fz), y = WD.ground(x, z) > -100 ? WD.ground(x, z) : floorAt(x, z, 99);
        const rx = Math.cos(ry), rz = -Math.sin(ry);
        for (const s of [-1, 1]) box(x + rx * s * 1.55, y, z + rz * s * 1.55, 0.6, 3.6, 0.8, { ry, t: 'brick', c: 0xf0e8ff, props: { nocam: 1 } });
        box(x, y + 3.6, z, 3.7, 0.6, 0.9, { ry, t: 'brick', c: 0xf0e8ff, props: { nocam: 1 } }); box(x - fx * 0.12, y, z - fz * 0.12, 2.5, 3.6, 0.3, { ry, c: 0x5a3a2a, props: { nocam: 1 } });
        const pm = new T.Mesh(new T.PlaneGeometry(2.4, 3.5), mat('doorhome', { map: tex('doorhome', 64, 96, g => { const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, '#6ab8ff'); gr.addColorStop(1, '#2a6ad8'); g.fillStyle = gr; g.fillRect(0, 0, 64, 96); g.fillStyle = '#5ab83a'; g.beginPath(); g.ellipse(32, 62, 24, 10, 0, 0, 7); g.fill(); g.fillStyle = '#ffe6a0'; g.fillRect(8, 62, 48, 4); g.fillStyle = '#e83a2a'; g.fillRect(40, 40, 5, 20); g.fillStyle = '#fff'; g.fillRect(40, 46, 5, 4); g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(54, 56, 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 93); }) }));
        pm.position.set(x + fx * 0.04, y + 1.78, z + fz * 0.04); pm.rotation.y = ry; WG.add(pm);
        doorExit = { x, z, y, fx, fz };
      }
      // a thing with its own mesh: the treasure chest, the igloo's ice plug
      function prop(kind, x, y, z, ry, w) {
        if (kind === 'chest') {
          const m = new T.Mesh(model('chest'), matV()); m.position.set(x, y, z); m.rotation.y = ry; WG.add(m);
          const lid = new T.Mesh(model('lid'), matV()); lid.position.set(0, 0.6, 0.35); m.add(lid);
          const b = solidBox(x, y, z, 1.0, 0.85, 0.7, ry); b.chest = w; PROPS.push({ kind, b, m, lid, w });
        } else if (kind === 'plug') {
          const m = new T.Mesh(model('plug'), T3.mat({ vcol: true, emissive: 0x2a6a8a })); m.position.set(x, y, z); WG.add(m);
          const b = solidBox(x, y, z, 1.3, 0.6, 1.3, 0); b.plug = w; PROPS.push({ kind, b, m, w });
        }
      }
      function poundOn(o) {
        if (!o) return;
        if (o.chest && !chestOpen[o.chest]) {
          chestOpen[o.chest] = true; const pr = PROPS.find(p => p.b === o); if (pr) pr.open = 0.001;
          K.sfx.seq([[67, 0.25], [71, 0.25], [74, 0.25], [79, 0.75]], { bpm: 300, vol: 0.09, wave: 'square' }); burst(o.x, o.y + 1, o.z, [0xffd23a, 0xffffff], 14, 6);
          reveal('chest');
        }
        if (o.plug && !plugOut[o.plug]) {
          plugOut[o.plug] = true; const pr = PROPS.find(p => p.b === o); if (pr) { pr.m.visible = false; const i = BOXES.indexOf(o); if (i >= 0) BOXES.splice(i, 1); }
          burst(o.x, o.y + 0.5, o.z, [0xbfe8ff, 0xffffff], 18, 7); K.sfx.noise(0.4, 0.15, 3000); reveal('plug');
        }
      }

      // ================================================================ collisions
      const FL = { h: 0, o: null };
      function floorAt(x, z, y) {
        let h = WD.ground(x, z), o = null;
        for (const b of BOXES) { const dx = x - b.x, dz = z - b.z; if (Math.abs(dx) > b.hw + b.hd + 0.4 || Math.abs(dz) > b.hw + b.hd + 0.4) continue; const lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs; if (Math.abs(lx) < b.hw + 0.22 && Math.abs(lz) < b.hd + 0.22) { const t = b.y + b.hh; if (t <= y + 0.55 && t > h) { h = t; o = b; } } }
        for (const c of CYLS) { const dx = x - c.x, dz = z - c.z; if (dx * dx + dz * dz < (c.r + 0.18) * (c.r + 0.18) && c.y1 <= y + 0.55 && c.y1 > h) { h = c.y1; o = c; } }
        FL.h = h; FL.o = o; return h;
      }
      function slopeAt(x, z) { const e = 0.3, g = WD.ground; return Math.hypot(g(x + e, z) - g(x - e, z), g(x, z + e) - g(x, z - e)) / (2 * e); }
      function pushOut(o, r, hgt, rec) { // o: anything with x, y, z
        let hit = false;
        for (const b of BOXES) {
          const top = b.y + b.hh, bot = b.y - b.hh;
          if (o.y >= top - 0.45 || o.y + hgt <= bot) continue;
          const dx = o.x - b.x, dz = o.z - b.z; if (Math.abs(dx) > b.hw + b.hd + r + 0.5 || Math.abs(dz) > b.hw + b.hd + r + 0.5) continue;
          const lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs, ox = b.hw + r - Math.abs(lx), oz = b.hd + r - Math.abs(lz);
          if (ox > 0 && oz > 0) {
            let px = 0, pz = 0; if (ox < oz) px = Math.sign(lx) * ox; else pz = Math.sign(lz) * oz;
            const wx = px * b.cs + pz * b.sn, wz = -px * b.sn + pz * b.cs; o.x += wx; o.z += wz; hit = true;
            if (rec) { const l = Math.hypot(wx, wz) || 1; rec(wx / l, wz / l); }
          }
        }
        for (const c of CYLS) {
          if (o.y >= c.y1 - 0.45 || o.y + hgt <= c.y0) continue;
          const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
          if (d < m && d > 0.0001) { o.x = c.x + dx / d * m; o.z = c.z + dz / d * m; hit = true; if (rec) rec(dx / d, dz / d); }
        }
        const bd = WD.bound || 70;
        if (WD.square) { o.x = clamp(o.x, -bd, bd); o.z = clamp(o.z, -bd, bd); } else { const R = Math.hypot(o.x, o.z); if (R > bd) { o.x *= bd / R; o.z *= bd / R; } }
        return hit;
      }
      const wallRec = (nx, nz) => { if (!P.gnd && P.st !== 'pound') { P.wallT = 0.22; P.wnx = nx; P.wnz = nz; } };

      // ================================================================ Bopper's moves
      const snd = {
        jump: k => K.sfx.tone([300, 360, 440, 260][k] || 300, 0.15, 'square', 0.06, 0, [700, 900, 1200, 600][k] || 700),
        coin: () => { K.sfx.tone(1318, 0.05, 'square', 0.05); K.sfx.tone(1760, 0.1, 'square', 0.05, 0.05); },
        hit: () => { K.sfx.tone(180, 0.12, 'square', 0.08, 0, 60); K.sfx.noise(0.15, 0.1, 900); },
        hurt: () => K.sfx.tone(420, 0.3, 'sawtooth', 0.07, 0, 110),
        step: () => K.sfx.noise(0.03, 0.025, 700),
        boing: () => K.sfx.tone(160, 0.35, 'triangle', 0.1, 0, 900),
        pound: () => { K.sfx.tone(90, 0.25, 'sine', 0.18, 0, 40); K.sfx.noise(0.2, 0.12, 500); },
        whoosh: () => K.sfx.noise(0.18, 0.05, 1800, 0, 'bandpass', 4000),
      };
      let shake = 0, flash = 0, msg = '', msgT = 0, msg2 = '', msgCol = '#ffd23a';
      const say = (s, t, s2, c) => { msg = s; msgT = t || 2; msg2 = s2 || ''; msgCol = c || '#ffd23a'; };
      function respawnAt(x, y, z, face) { Object.assign(P, { x, y, z, vx: 0, vy: 0, vz: 0, face, gnd: true, st: 'idle', stT: 0, chain: 0, twirl: false, wallT: 0, plat: null, ctrl: 0, yaw: face, spin: 0 }); floorAt(x, z, y + 1); if (FL.h > -100) P.y = FL.h; P.safe = [P.x, P.y, P.z]; camSnap(); }
      function hurt(n, fx, fz) {
        if (P.inv > 0 || demo || P.st === 'dead' || mode !== 'play') return;
        P.hp -= n; P.inv = 1.6; flash = 0.25; shake = 0.25; snd.hurt();
        const dx = P.x - fx, dz = P.z - fz, d = Math.hypot(dx, dz) || 1; P.vx = dx / d * 8; P.vz = dz / d * 8; P.vy = 8; P.gnd = false; P.st = 'hurt'; P.stT = 0; P.ctrl = 0.45;
        if (P.hp <= 0) die();
      }
      function die() { P.hp = 0; P.st = 'dead'; P.stT = 0; P.vy = 9; P.vx = P.vz = 0; K.music(null); K.sfx.seq([[72, 0.25], [67, 0.25], [64, 0.25], [60, 0.25], [55, 1]], { bpm: 220, vol: 0.09, wave: 'triangle' }); }
      function fallOut() { // into the void or the deep sea: two bites and back to the last safe spot
        if (demo) { respawnAt(...P.safe, P.face); return; }
        P.hp -= 2; flash = 0.3; if (P.hp <= 0) return die();
        say('WHOOPS!', 1.2); iris(() => { respawnAt(P.safe[0], P.safe[1], P.safe[2], P.face); P.inv = 1.4; });
      }
      function stepPlayer(dt) {
        P.stT += dt; if (P.chainT > 0) P.chainT -= dt; if (P.wallT > 0) P.wallT -= dt; if (P.inv > 0) P.inv -= dt; if (P.punchT > 0) P.punchT -= dt; if (P.ctrl > 0) P.ctrl -= dt; if (P.land > 0) P.land -= dt;
        if (P.st === 'dead') { P.vy -= 20 * dt; P.y += P.vy * dt; P.spin += dt * 10; if (P.stT > 2.2 && !fading) afterDeath(); return; }
        const cy = C.yaw, fx = -Math.sin(cy), fz = -Math.cos(cy), rx = Math.cos(cy), rz = -Math.sin(cy);
        let wx = fx * -IN.y + rx * IN.x, wz = fz * -IN.y + rz * IN.x, wl = Math.hypot(wx, wz); if (wl > 1) { wx /= wl; wz /= wl; wl = 1; }
        const sp = Math.hypot(P.vx, P.vz), wantF = Math.atan2(-wx, -wz);
        const gnd0 = WD.ground(P.x, P.z), wade = WD.water != null && P.gnd && P.y < WD.water + 0.05 && gnd0 > WD.water - 0.8;
        const onIce = P.gnd && (P.plat ? !!P.plat.ice : !!(WD.ice && WD.ice(P.x, P.z)));
        const TOP = 8.2 * (wade ? 0.6 : 1);
        if (P.gnd) {
          if (P.ctrl > 0 || P.st === 'punch' || (P.st === 'poundLand' && P.stT < 0.25)) { const k = Math.max(0, 1 - 9 * dt); P.vx *= k; P.vz *= k; if (P.st === 'punch' && P.stT > 0.28) P.st = 'idle'; if (P.st === 'poundLand' && P.stT >= 0.25) P.st = 'idle'; }
          else if (IN.cH) { P.st = 'crouch'; const k = Math.max(0, 1 - (onIce ? 1 : 7) * dt); P.vx *= k; P.vz *= k; if (wl > 0.1) P.face += wrapA(wantF - P.face) * Math.min(1, dt * 8); }
          else {
            const acc = (onIce ? 5 : 44) * dt; let dvx = wx * TOP * wl - P.vx, dvz = wz * TOP * wl - P.vz; const dl = Math.hypot(dvx, dvz); if (dl > acc) { dvx *= acc / dl; dvz *= acc / dl; }
            if (wl > 0.1 && sp > 6.5 && Math.abs(wrapA(wantF - P.face)) > 2.4 && !onIce) { P.st = 'skid'; P.stT = 0; K.sfx.noise(0.15, 0.05, 1200); }
            if (P.st === 'skid' && P.stT < 0.18) { const k = Math.max(0, 1 - 12 * dt); P.vx *= k; P.vz *= k; } else { P.vx += dvx; P.vz += dvz; if (P.st === 'skid') P.face = wantF; }
            if (wl > 0.1 && P.st !== 'skid') { const d = wrapA(wantF - P.face); P.face += sp < 2 ? d : d * Math.min(1, dt * 15); }
            if (P.st !== 'skid' || P.stT >= 0.18) P.st = Math.hypot(P.vx, P.vz) > 0.6 ? 'run' : 'idle';
          }
          if (!P.plat && WD.ground(P.x, P.z) > -100) { const sl = slopeAt(P.x, P.z); if (sl > 1.05) { const e = 0.3, g = WD.ground, gx = (g(P.x + e, P.z) - g(P.x - e, P.z)) / (2 * e), gz = (g(P.x, P.z + e) - g(P.x, P.z - e)) / (2 * e); P.vx -= gx * 30 * dt; P.vz -= gz * 30 * dt; P.st = 'slide'; } }
        } else if (P.ctrl <= 0 && P.st !== 'pound') {
          const k = P.st === 'long' ? 0.8 : P.st === 'wallkick' ? 1.5 : 3.2;
          if (wl > 0.1) { P.vx += (wx * TOP - P.vx) * Math.min(1, k * dt * wl); P.vz += (wz * TOP - P.vz) * Math.min(1, k * dt * wl); if (!['long', 'back', 'wallkick'].includes(P.st)) P.face += wrapA(wantF - P.face) * Math.min(1, dt * 7); }
        }
        // jump buttons
        if (P.buf > 0) { P.buf -= dt; if (P.gnd && P.ctrl <= 0) { IN.a = true; P.buf = 0; } }
        if (IN.a && !P.gnd && P.vy < 0 && P.wallT <= 0 && ['jump', 'jump2', 'fall'].includes(P.st)) { floorAt(P.x, P.z, P.y); if (P.y - FL.h < 1.3) { P.buf = 0.2; IN.a = false; } }
        if (IN.a) {
          if (P.gnd && P.ctrl <= 0 && P.st !== 'punch') {
            const s2 = Math.hypot(P.vx, P.vz);
            if (IN.cH && s2 > 3.5) { P.st = 'long'; P.vy = 9.5; const v = Math.max(s2 + 4, 13.5); P.vx = -Math.sin(P.face) * v; P.vz = -Math.cos(P.face) * v; snd.jump(3); snd.whoosh(); }
            else if (IN.cH) { P.st = 'back'; P.vy = 16; P.vx = Math.sin(P.face) * 3; P.vz = Math.cos(P.face) * 3; snd.jump(2); }
            else if (P.chainT > 0 && P.chain === 1) { P.st = 'jump2'; P.vy = 14; snd.jump(1); }
            else if (P.chainT > 0 && P.chain === 2 && s2 > 4) { P.st = 'jump3'; P.vy = 16.5; snd.jump(2); burst(P.x, P.y + 0.5, P.z, 0xffffff, 6, 3, { life: 0.4 }); }
            else { P.st = 'jump'; P.vy = 11.5; snd.jump(0); }
            if (P.plat && P.plat.mv && P.plat.k === 'box') { P.vx += (P.plat.x - P.plat.px) * 30; P.vz += (P.plat.z - P.plat.pz) * 30; }
            P.stT = 0; P.gnd = false; P.plat = null; P.twirl = false; P.chainT = 0;
          } else if (!P.gnd && P.ctrl <= 0) {
            if (P.wallT > 0 && P.st !== 'pound') {
              P.st = 'wallkick'; P.stT = 0; P.vy = 13; P.vx = P.wnx * 7.5; P.vz = P.wnz * 7.5; P.face = Math.atan2(-P.wnx, -P.wnz); P.wallT = 0; P.twirl = false; P.ctrl = 0.12;
              snd.jump(2); burst(P.x - P.wnx * 0.4, P.y + 0.6, P.z - P.wnz * 0.4, 0xffffff, 5, 3, { life: 0.35 }); visit.kicks = (visit.kicks || 0) + 1;
            } else if (!P.twirl && ['jump', 'jump2', 'jump3', 'fall', 'kick', 'wallkick', 'spring', 'back', 'hurt'].includes(P.st)) { P.twirl = true; P.st = 'twirl'; P.stT = 0; P.vy = Math.max(P.vy, 7.5); K.sfx.tone(700, 0.2, 'triangle', 0.06, 0, 1400); }
          }
        }
        if (IN.b) {
          const n = P.gnd && !demo ? nearTalk() : null;
          if (n) { startTalk(n); return; }
          if (P.gnd && P.st !== 'crouch' && P.ctrl <= 0) {
            P.punchN = P.punchT > 0 ? (P.punchN % 3) + 1 : 1; P.punchT = 0.45; P.st = 'punch'; P.stT = 0;
            const k = P.punchN === 3 ? 4.5 : 3; P.vx += -Math.sin(P.face) * k; P.vz += -Math.cos(P.face) * k; K.sfx.noise(0.08, 0.08, P.punchN === 3 ? 900 : 1600); attack(1.1, 1.0);
          } else if (!P.gnd && !P.kicked && P.st !== 'pound') { P.kicked = true; P.st = 'kick'; P.stT = 0; P.vx += -Math.sin(P.face) * 3; P.vz += -Math.cos(P.face) * 3; P.vy = Math.max(P.vy, 3); K.sfx.noise(0.1, 0.08, 1300); }
        }
        if (P.st === 'punch' && P.stT < 0.2) attack(1.1, 1.0);
        if (P.st === 'kick' && P.stT < 0.35) attack(0.9, 1.0);
        if (IN.c && !P.gnd && !['pound', 'dead', 'hurt'].includes(P.st)) { floorAt(P.x, P.z, P.y); if (P.y - FL.h > 0.9) { P.st = 'pound'; P.stT = 0; P.vx = P.vz = 0; P.vy = 0; K.sfx.tone(600, 0.25, 'square', 0.05, 0, 200); } }
        // gravity
        let g = 36;
        if (P.st === 'pound') { g = 0; if (P.stT < 0.28) { P.vy = 0; P.vx = P.vz = 0; } else P.vy = -32; }
        else if (['jump', 'jump2', 'jump3', 'back', 'wallkick', 'twirl'].includes(P.st) && IN.aH && P.vy > 0) g = 24;
        else if (P.st === 'spring' && P.vy > 0) g = 24;
        else if (P.st === 'long') g = 28;
        if (P.wallT > 0 && !P.gnd && P.vy < 0 && P.st !== 'pound') P.vy = Math.max(P.vy, -6);
        P.vy = Math.max(-32, P.vy - g * dt);
        // move: across (with the walls and steep ground), then up and down
        const ox = P.x, oz = P.z;
        let bx = 0, bz = 0; if (P.gnd && P.plat && P.plat.belt) { bx = P.plat.belt[0]; bz = P.plat.belt[1]; }
        const steps = Math.max(1, Math.ceil(Math.hypot(P.vx, P.vz) * dt / 0.3));
        for (let s = 0; s < steps; s++) {
          const px = P.x, pz = P.z; P.x += (P.vx + bx) * dt / steps; P.z += (P.vz + bz) * dt / steps;
          if (WD.ground(P.x, P.z) > -100) { const ng = WD.ground(P.x, P.z); if (ng > P.y + 0.6 || (ng > P.y + 0.05 && slopeAt(P.x, P.z) > 1.15)) { const mx = P.x - px, mz = P.z - pz, ml = Math.hypot(mx, mz) || 1; P.x = px; P.z = pz; if (!P.gnd) wallRec(-mx / ml, -mz / ml); } }
          pushOut(P, 0.42, 1.25, wallRec);
        }
        const oy = P.y; P.y += P.vy * dt;
        if (P.vy > 0) for (const b of BOXES) { const bot = b.y - b.hh, dx = P.x - b.x, dz = P.z - b.z, lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs; if (Math.abs(lx) < b.hw + 0.15 && Math.abs(lz) < b.hd + 0.15 && oy + 1.25 <= bot + 0.05 && P.y + 1.25 > bot) { P.y = bot - 1.25; P.vy = 0; K.sfx.tone(140, 0.08, 'square', 0.05); } }
        const gh = floorAt(P.x, P.z, Math.max(oy, P.y)), go = FL.o;
        if (P.y <= gh) land(gh, go);
        else if (P.gnd && P.vy <= 0 && P.y - gh < 0.42 && !(P.plat && P.plat.bounce)) { P.y = gh; P.plat = go; P.vy = 0; }
        else if (P.y > gh + 0.05) { if (P.gnd) { P.gnd = false; P.plat = null; if (!['jump', 'jump2', 'jump3', 'long', 'back', 'spring'].includes(P.st)) { P.st = 'fall'; P.stT = 0; } P.fallY = P.y; } }
        if (!P.gnd && P.vy < 0 && ['jump', 'jump2', 'wallkick', 'twirl', 'kick'].includes(P.st) && P.stT > 0.3 && P.st !== 'jump2') { /* keep pose */ }
        // the sea, the lava, the void
        if (WD.water != null && P.y < WD.water - 0.6 && WD.ground(P.x, P.z) < WD.water - 0.4) { burst(P.x, WD.water, P.z, [0x9ad8ff, 0xffffff], 14, 6); K.sfx.noise(0.5, 0.2, 800); return fallOut(); }
        if (WD.lava != null && P.y < WD.lava + 0.1 && P.st !== 'dead') { P.y = WD.lava + 0.1; P.vy = 17; P.gnd = false; P.st = 'burn'; P.stT = 0; P.ctrl = 1.4; const ddx = P.safe[0] - P.x, ddz = P.safe[2] - P.z, d = Math.hypot(ddx, ddz) || 1, v = Math.min(12, d / 1.5); P.vx = ddx / d * v; P.vz = ddz / d * v; burst(P.x, P.y, P.z, [0xffa82a, 0xff4a1a], 14, 6); K.sfx.tone(800, 0.4, 'sawtooth', 0.07, 0, 1600); if (!demo) { P.hp -= 1; P.inv = 0.6; flash = 0.3; if (P.hp <= 0) return die(); } }
        if (P.y < WD.killY) return fallOut();
        // the last safe place to stand
        if (P.gnd && !(P.plat && (P.plat.mv || P.plat.bounce)) && !wade && (P.plat || !WD.safeOnly)) { P.safeT += dt; if (P.safeT > 0.5) { P.safeT = 0; P.safe = [P.x, P.y, P.z]; } }
        P.run += dt * Math.hypot(P.vx, P.vz) * 1.9;
        if (P.gnd && Math.hypot(P.vx, P.vz) > 5 && (P.run % 3.14) < dt * Math.hypot(P.vx, P.vz) * 1.9) { snd.step(); if (Math.random() < 0.5) burst(P.x, P.y + 0.1, P.z, wade ? 0xbfe8ff : 0xd8d0c0, 2, 1.5, { life: 0.35, size: 0.15, grav: 2 }); }
      }
      function land(gh, o) {
        const was = P.st, vy = P.vy;
        P.y = gh; P.vy = 0; P.gnd = true; P.plat = o; P.twirl = false; P.kicked = false; P.wallT = 0; P.stT = 0;
        if (was === 'pound') { P.st = 'poundLand'; shake = 0.2; snd.pound(); burst(P.x, gh + 0.1, P.z, 0xe8e0d0, 12, 6, { ring: true, life: 0.4, grav: 0 }); poundOn(o); attack(0, 1.9, true); }
        else { P.chain = was === 'jump' ? 1 : was === 'jump2' ? 2 : 0; P.chainT = P.chain ? 0.3 : 0; P.st = 'idle'; if (vy < -16) { P.land = 0.14; burst(P.x, gh + 0.1, P.z, 0xd8d0c0, 5, 3, { life: 0.35, grav: 4 }); } if (vy < -5) K.sfx.noise(0.06, 0.04, 600); }
        if (o && o.bounce) { P.vy = o.bounce; P.gnd = false; P.plat = null; P.st = 'spring'; P.stT = 0; snd.boing(); o.squish = 0.3; burst(P.x, gh, P.z, 0xffb0d0, 8, 4); }
      }
      // punches, kicks, stomps and pounds against baddies
      function attack(reach, rad, pound) {
        const ax = P.x - Math.sin(P.face) * reach, az = P.z - Math.cos(P.face) * reach, ay = P.y + 0.6;
        for (const e of ENS) { if (!e.alive) continue; if (Math.hypot(e.x - ax, e.z - az) < rad + e.r * 0.6 && Math.abs(e.y + e.h * 0.5 - ay) < 1.6) defeat(e, pound ? 'pound' : 'punch'); }
        if (curW === 'manor') BB.hitTest(ax, ay, az, rad + 1.2);
        if (curW === 'manor') for (const L_ of LAMPS) if (!L_.lit && Math.hypot(L_.x - ax, L_.z - az) < rad + 0.6) lightLamp(L_);
      }
      function defeat(e, how) {
        if (!e.alive) return;
        e.alive = false; e.dead = 0.5; visit.kills++; prog.score += 25; snd.hit(); shake = Math.max(shake, 0.1);
        burst(e.x, e.y + e.h * 0.5, e.z, e.kind === 'boohoo' ? [0xffffff, 0xc8c8ff] : e.kind === 'chilly' ? 0xffffff : e.kind === 'tickbot' ? [0xc8c8d8, 0xffd23a] : [0xc8783a, 0xffd23a], 12, 6);
        for (let i = 0; i < 2; i++) { const a = Math.random() * TAU; COINS.push({ x: e.x + Math.cos(a) * 0.8, y: e.y + 1, z: e.z + Math.sin(a) * 0.8, got: false, pop: 0.5 }); }
        if (ENS.every(x => !x.alive)) reveal('enemies');
      }

      // ================================================================ baddies
      const SNOWB = [];
      function enemiesUpdate(dt, t) {
        for (const e of ENS) {
          const m = e.mesh;
          if (!e.alive) { if (e.dead > 0) { e.dead -= dt; const k = Math.max(0.01, e.dead * 2); m.scale.set(1 + (1 - k) * 0.5, k, 1 + (1 - k) * 0.5); if (e.dead <= 0) m.visible = false; } continue; }
          const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz), near = d < e.range && Math.abs(P.y - e.y) < 3 && P.st !== 'dead';
          let tx = 0, tz = 0, sp = 0;
          if (e.kind === 'grumpy' || e.kind === 'snipper') {
            if (near) { tx = dx / d; tz = dz / d; sp = e.kind === 'snipper' ? 3.0 : 3.3; }
            else { e.t -= dt; if (e.t < 0) { e.a += (rnd() - 0.5) * 2.5; e.t = 1 + rnd() * 2; } tx = Math.cos(e.a); tz = Math.sin(e.a); sp = 1.3; if (Math.hypot(e.x - e.hx, e.z - e.hz) > 6) { tx = e.hx - e.x; tz = e.hz - e.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; } }
            const nx = e.x + tx * sp * dt, nz = e.z + tz * sp * dt, ng = floorAt(nx, nz, e.y + 0.5);
            if (Math.abs(ng - e.y) < 0.8 && (WD.water == null || ng > WD.water + 0.4)) { e.x = nx; e.z = nz; e.y = ng; } else e.a += 2;
            const look = e.kind === 'snipper' ? Math.atan2(-tz, tx) : Math.atan2(-tx, -tz); // crabs walk sideways
            m.rotation.y += wrapA(look - m.rotation.y) * Math.min(1, dt * 8);
            m.position.set(e.x, e.y + Math.abs(Math.sin(t * (e.kind === 'snipper' ? 14 : 9) + e.hx)) * 0.12, e.z);
          } else if (e.kind === 'chilly') {
            e.y = floorAt(e.x, e.z, e.y + 0.5); m.position.set(e.x, e.y, e.z);
            if (d < 18 && Math.abs(P.y - e.y) < 8) { m.rotation.y += wrapA(Math.atan2(-dx, -dz) - m.rotation.y) * Math.min(1, dt * 4); e.t -= dt; if (e.t < 0) { e.t = 2.4; throwSnow(e); } }
            m.scale.y = 1 + Math.sin(t * 3 + e.hx) * 0.04;
          } else if (e.kind === 'boohoo') {
            const facing = d > 0.1 && (-Math.sin(P.face) * dx + -Math.cos(P.face) * dz) / d < -0.5; // Bopper is looking at it
            e.shy = facing && d < 14;
            if (!e.shy && near) { tx = dx / d; tz = dz / d; sp = 2.6; } else if (!e.shy) { e.t -= dt; if (e.t < 0) { e.a += (rnd() - 0.5) * 2; e.t = 2; } tx = Math.cos(e.a); tz = Math.sin(e.a); sp = 1; if (Math.hypot(e.x - e.hx, e.z - e.hz) > 7) { tx = e.hx - e.x; tz = e.hz - e.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; } }
            const o = { x: e.x + tx * sp * dt, y: e.y, z: e.z + tz * sp * dt }; pushOut(o, 0.6, 1.4); e.x = o.x; e.z = o.z;
            e.y = WD.ground(e.x, e.z) + 0.9 + Math.sin(t * 2 + e.hx) * 0.25;
            const look = e.shy ? Math.atan2(dx, dz) : Math.atan2(-dx, -dz);
            m.rotation.y += wrapA(look - m.rotation.y) * Math.min(1, dt * 5); m.position.set(e.x, e.y, e.z);
          } else if (e.kind === 'tickbot') {
            const [px, pz, pr] = e.patrol;
            if (near && d < 6 && Math.abs(P.y - e.y) < 1.5) { tx = dx / d; tz = dz / d; sp = 2.6; } else { tx = Math.cos(e.a); tz = Math.sin(e.a); sp = 1.6; }
            let nx = e.x + tx * sp * dt, nz = e.z + tz * sp * dt; if (Math.hypot(nx - px, nz - pz) > pr) { e.a += Math.PI * 0.75 + rnd(); nx = e.x; nz = e.z; }
            e.x = nx; e.z = nz; e.y = e.y0;
            m.rotation.y += wrapA(Math.atan2(-tx, -tz) - m.rotation.y) * Math.min(1, dt * 6); m.rotation.z = Math.sin(t * 10 + e.hx) * 0.08; m.position.set(e.x, e.y + Math.abs(Math.sin(t * 10 + e.hx)) * 0.06, e.z);
          }
          // touching Bopper
          if (P.st === 'dead' || demo) continue;
          if (d < e.r + 0.45 && P.y < e.y + e.h + 0.2 && P.y + 1.2 > e.y) {
            if (P.vy < -1 && P.y > e.y + e.h * 0.45) { defeat(e, 'stomp'); P.vy = IN.aH ? 14 : 10; P.gnd = false; P.st = 'jump'; P.stT = 0; P.twirl = false; }
            else if (P.st === 'pound' || P.st === 'kick' || P.st === 'long' || (P.st === 'punch' && P.stT < 0.25)) defeat(e, 'hit');
            else if (!(e.kind === 'boohoo' && e.shy)) hurt(1, e.x, e.z);
          }
        }
        // snowballs
        for (let i = SNOWB.length - 1; i >= 0; i--) {
          const s = SNOWB[i]; s.t += dt; s.vy -= 18 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.m.position.set(s.x, s.y, s.z);
          const hitP = Math.hypot(s.x - P.x, s.z - P.z) < 0.7 && s.y > P.y - 0.2 && s.y < P.y + 1.4;
          if (hitP) hurt(1, s.x - s.vx, s.z - s.vz);
          if (hitP || s.y < floorAt(s.x, s.z, s.y) || s.t > 3) { burst(s.x, s.y, s.z, 0xffffff, 6, 3, { life: 0.4 }); s.m.visible = false; SNOWB.splice(i, 1); }
        }
      }
      function throwSnow(e) {
        const m = snowM.find(x => !x.visible); if (!m) return; m.visible = true;
        const tt = 1.0, sx = e.x, sy = e.y + 1.8, sz = e.z;
        SNOWB.push({ m, x: sx, y: sy, z: sz, vx: (P.x - sx) / tt, vy: (P.y + 0.6 - sy + 9 * tt * tt) / tt, vz: (P.z - sz) / tt, t: 0 });
        K.sfx.noise(0.12, 0.05, 2000);
      }
      function lightLamp(L_) { if (L_.lit) return; L_.lit = true; L_.m.material.emissive.setHex(0xffb02a); L_.m.material.color.setHex(0xffe08a); burst(L_.x, 3, L_.z, [0xffd23a, 0xff8a1a], 10, 4); K.sfx.seq([[72, 0.25], [79, 0.5]], { bpm: 300, vol: 0.08 }); const n = LAMPS.filter(l => l.lit).length; say('LANTERN ' + n + ' OF 4', 1.5); if (n === 4) reveal('lamps'); }

      // ---- Percy the racing penguin (Frosty Flapjack Peaks)
      const PERCY = { on: false, st: 'idle', x: 0, y: 0, z: 0, i: 0, t: 0, mesh: null, npc: null, home: [4, 5],
        path: [[4, 5], [0, -9], [0, -15], [0, -20], [-14.1, -14.1], [-20, 0], [-25, 0], [-30.5, 0], [-21.6, 21.6], [0, 30.5], [0, 36], [0, 42], [0, 48]] };
      function percyLines() {
        if (gotAc('race') && PERCY.st !== 'lost') return ['YOU BEAT ME FAIR AND SQUARE, BOPPER. NOBODY BEATS PERCY! WELL. EXCEPT YOU.'];
        if (PERCY.st === 'race' || PERCY.st === 'count') return ['GO GO GO!'];
        const L0 = PERCY.st === 'lost' ? ['HA! TOO SLOW! FANCY ANOTHER GO?'] : ['ALL RIGHT? I\'M PERCY, THE FASTEST PENGUIN ON THE MOUNTAIN.', 'I BET YOU A GOLDEN ACORN I CAN BEAT YOU DOWN TO THE FLAG AT THE BOTTOM.'];
        return L0.concat(['ON YOUR MARKS... (NO SHORT CUTS. WELL, ANY SHORT CUTS YOU LIKE.)']);
      }
      function percyStart() { if (gotAc('race') && PERCY.st !== 'lost') return; PERCY.st = 'count'; PERCY.t = 3; PERCY.i = 0; PERCY.x = PERCY.home[0]; PERCY.z = PERCY.home[1]; raceWon = false; }
      function percyUpdate(dt) {
        if (!PERCY.mesh) return;
        const n = PERCY.npc;
        if (PERCY.st === 'count') { const before = Math.ceil(PERCY.t); PERCY.t -= dt; const now = Math.ceil(PERCY.t); if (now !== before && now > 0) { say(String(now), 0.9); K.sfx.tone(660, 0.15, 'square', 0.07); } if (PERCY.t <= 0) { PERCY.st = 'race'; PERCY.i = 1; say('GO!', 1); K.sfx.tone(1320, 0.3, 'square', 0.08); } }
        else if (PERCY.st === 'race') {
          const [tx, tz] = PERCY.path[PERCY.i], dx = tx - PERCY.x, dz = tz - PERCY.z, d = Math.hypot(dx, dz), sp = 6.7 * dt;
          if (d < sp) { PERCY.x = tx; PERCY.z = tz; PERCY.i++; if (PERCY.i >= PERCY.path.length) { PERCY.st = 'lost'; say('PERCY WINS!', 2.5, 'TALK TO HIM AT THE TOP FOR A REMATCH', '#ff8a8a'); K.sfx.seq([[67, 0.5], [62, 0.5], [55, 1]], { bpm: 200, vol: 0.08 }); PERCY.t = 3; } }
          else { PERCY.x += dx / d * sp; PERCY.z += dz / d * sp; PERCY.mesh.rotation.y = Math.atan2(-dx, -dz); }
          if (Math.hypot(P.x, P.z - 48) < 4 && P.y < 4) { PERCY.st = 'won'; raceWon = true; say('YOU WIN!', 2, 'PERCY: NOT FAIR! I HAD A FLIPPER CRAMP!'); reveal('race'); }
        } else if (PERCY.st === 'lost') { PERCY.t -= dt; if (PERCY.t <= 0 && Math.hypot(P.x - PERCY.x, P.z - PERCY.z) > 6) { PERCY.x = PERCY.home[0]; PERCY.z = PERCY.home[1]; PERCY.st = 'lostHome'; } }
        else if (PERCY.st === 'won') { /* stays at the flag, sulking */ }
        if (PERCY.st === 'lostHome') PERCY.st = 'lost';
        PERCY.y = WD.ground(PERCY.x, PERCY.z); n.x = PERCY.x; n.z = PERCY.z; n.y = PERCY.y;
        const sliding = PERCY.st === 'race' && slopeAt(PERCY.x, PERCY.z) > 0.25;
        PERCY.mesh.position.set(PERCY.x, PERCY.y + (sliding ? 0.3 : Math.abs(Math.sin(K.t * 12)) * (PERCY.st === 'race' ? 0.15 : 0)), PERCY.z); PERCY.mesh.rotation.x = sliding ? -1.3 : 0;
      }

      // ---- Big Boohoo (the Manor's graveyard)
      const BB = { on: false, st: 'sleep', x: 20, y: 1.5, z: 14, hp: 3, t: 0, a: 0, mesh: null, inv: 0,
        init() { this.on = true; this.st = 'sleep'; this.hp = 3; this.x = 20; this.z = 14; this.mesh = new T.Mesh(model('bigboo'), ghostMat); this.mesh.scale.setScalar(2.4); this.mesh.visible = false; WG.add(this.mesh); },
        update(dt, t) {
          if (!this.on || this.st === 'gone') return;
          const m = this.mesh, dx = P.x - this.x, dz = P.z - this.z, d = Math.hypot(dx, dz);
          if (this.st === 'sleep') { if (d < 10 && !gotAc('boohoo') && mode === 'play' && P.gnd) { m.visible = true; this.y = 1.5; this.st = 'intro'; startTalk({ name: 'BIG BOOHOO', lines: ['OOOOOH! WHO DARES TO WAKE ME FROM MY BEAUTY SLEEP?', 'A LITTLE ROUND BOY IN A HAT? I SHALL SCARE YOU ALL THE WAY BACK TO BISCUIT ISLAND!', '(LOOK AT HER AND SHE HIDES HER FACE. THAT\'S YOUR CHANCE: PUNCH HER OR JUMP ON HER!)'], done: () => { this.st = 'fight'; this.t = 0; K.music(SONGS.boss); } }); } else if (gotAc('boohoo') && !bossDown) { m.visible = false; } return; }
          if (this.st === 'intro') { m.position.set(this.x, this.y + Math.sin(t * 2) * 0.3, this.z); m.rotation.y = Math.atan2(dx, dz) + Math.PI; return; }
          if (this.st === 'pop') { this.t += dt; m.scale.setScalar(Math.max(0.01, 2.4 * (1 - this.t))); m.rotation.y += dt * 12; if (this.t >= 1) { this.st = 'gone'; m.visible = false; bossDown = true; reveal('boss'); for (let i = 0; i < 6; i++) COINS.push({ x: this.x + Math.cos(i) * 1.5, y: 1.4, z: this.z + Math.sin(i) * 1.5, got: false, pop: 0.5 }); K.music(SONGS.manor); } return; }
          this.t += dt; if (this.inv > 0) this.inv -= dt;
          const facing = d > 0.1 && (-Math.sin(P.face) * dx + -Math.cos(P.face) * dz) / d < -0.55;
          this.shy = facing && d < 16 && this.inv <= 0;
          const spd = 1 + (3 - this.hp) * 0.35;
          if (this.inv > 0) { this.a += dt * 1.5; const tx = P.x - Math.sin(this.a) * 11, tz = P.z - Math.cos(this.a) * 11; this.x += (tx - this.x) * Math.min(1, dt * 2); this.z += (tz - this.z) * Math.min(1, dt * 2); }
          else if (this.shy) { this.x -= dx / d * 0.6 * dt; this.z -= dz / d * 0.6 * dt; }
          else if (d > 3) { this.a += dt * 0.8 * spd; const R = 6 - Math.min(4, this.t % 5); const tx = P.x - Math.sin(this.a) * R, tz = P.z - Math.cos(this.a) * R; this.x += (tx - this.x) * Math.min(1, dt * 2.2 * spd); this.z += (tz - this.z) * Math.min(1, dt * 2.2 * spd); }
          else { this.x += dx / d * 4 * spd * dt; this.z += dz / d * 4 * spd * dt; }
          this.x = clamp(this.x, -42, 42); this.z = clamp(this.z, -42, 42);
          this.y = 1.2 + Math.sin(t * 2.2) * 0.3;
          m.position.set(this.x, this.y, this.z); m.rotation.y += wrapA((this.shy ? Math.atan2(dx, dz) : Math.atan2(-dx, -dz)) - m.rotation.y) * Math.min(1, dt * 5);
          m.visible = this.inv <= 0 || (this.inv * 12 | 0) % 2 === 0;
          if (P.st !== 'dead' && d < 2.4 && P.y < this.y + 3.2) {
            if (P.vy < -1 && P.y > this.y + 2.2) { this.hit(); P.vy = 13; P.gnd = false; P.st = 'jump'; P.stT = 0; }
            else if (!this.shy && this.inv <= 0) hurt(1, this.x, this.z);
          }
        },
        hitTest(x, y, z, r) { if (this.on && (this.st === 'fight') && this.inv <= 0 && Math.hypot(x - this.x, z - this.z) < r && Math.abs(y - this.y - 1.5) < 3) this.hit(); },
        hit() { if (this.inv > 0 || this.st !== 'fight') return; this.hp--; this.inv = 1.6; this.a = Math.atan2(this.x - P.x, this.z - P.z); snd.hit(); shake = 0.3; burst(this.x, this.y + 2, this.z, [0xffffff, 0xff8ac8], 16, 7); K.sfx.tone(900, 0.4, 'triangle', 0.08, 0, 200); prog.score += 100; if (this.hp <= 0) { this.st = 'pop'; this.t = 0; say('BIG BOOHOO VANISHED!', 2); } else say(['', 'OOOH! THAT TICKLED!', 'NOT THE HAIR!'][this.hp], 1.4, '', '#ffc8f0'); },
      };

      // ---- King Grumpus (the final boss)
      const BOSS = { st: 'throne', x: 0, y: 2, z: -13.5, hp: 3, t: 0, vx: 0, vz: 0, vy: 0, n: 0, mesh: null, stars: null, rings: [], face: 0,
        reset() {}, init() {
          this.st = 'throne'; this.x = 0; this.y = 3; this.z = -14; this.hp = 3; this.t = 0; this.n = 0; this.face = 0;
          this.mesh = new T.Mesh(model('king'), matV()); this.mesh.scale.setScalar(2.4); WG.add(this.mesh);
          this.stars = new T.Mesh(merge([0, 1, 2, 3, 4].map(i => pt(S.ico(), 0xffe04a, Math.cos(i * 1.256) * 1.4, 0, Math.sin(i * 1.256) * 1.4, 0.5, 0.5, 0.5))), matVB()); this.stars.visible = false; WG.add(this.stars);
          this.rings = [0, 1, 2].map(() => { const m = new T.Mesh(model('ring'), mat('shock', { vcol: true, emissive: 0xff6a00, transparent: true, opacity: 0.8, side: T.DoubleSide })); m.visible = false; WG.add(m); return { m, r: 0, on: false }; });
        },
        update(dt, t) {
          if (!this.mesh) return;
          const m = this.mesh, dx = P.x - this.x, dz = P.z - this.z, d = Math.hypot(dx, dz) || 0.01, sp = 3 + (3 - this.hp) * 1.0;
          this.t += dt;
          for (const R of this.rings) if (R.on) { R.r += dt * (9 + (3 - this.hp) * 1.5); R.m.scale.set(R.r, 0.7, R.r); R.m.position.set(R.x, 2.35, R.z); if (R.r > 20) { R.on = false; R.m.visible = false; } const pd = Math.hypot(P.x - R.x, P.z - R.z); if (Math.abs(pd - R.r) < 0.75 && P.y < 2.9 && P.st !== 'dead') hurt(1, R.x, R.z); }
          if (this.st === 'throne') { m.position.set(this.x, this.y + Math.abs(Math.sin(t * 1.5)) * 0.1, this.z); m.rotation.y = 0; if (Math.hypot(P.x, P.z) < 16.5 && P.y > 1 && mode === 'play' && P.gnd) { this.st = 'intro'; startTalk({ name: 'KING GRUMPUS', lines: ['WELL, WELL. IF IT ISN\'T THE LITTLE BOUNCER WHO\'S BEEN PINCHING MY ACORNS.', 'I COLLECTED THOSE FAIR AND SQUARE! BY STEALING THEM! FROM EVERYONE!', 'THE CROWN ACORN IS MINE, BOPPER. COME AND GET IT, IF YOU CAN JUMP OVER MY STOMPS!'], done: () => { this.st = 'hop'; this.t = 0; this.vy = 12; K.music(SONGS.boss); } }); } return; }
          if (this.st === 'intro') return;
          if (this.st === 'hop') { this.vy -= 30 * dt; this.y += this.vy * dt; this.x += (0 - this.x) * Math.min(1, dt * 2); this.z += (0 - this.z) * Math.min(1, dt * 2); if (this.y <= 2 && this.vy < 0) { this.y = 2; this.st = 'walk'; this.t = 0; this.land(); } }
          else if (this.st === 'walk') { this.face = Math.atan2(-dx, -dz); this.x += dx / d * sp * dt; this.z += dz / d * sp * dt; if (this.t > 2.2 - (3 - this.hp) * 0.3) { this.st = 'up'; this.t = 0; this.vy = 13; K.sfx.tone(200, 0.3, 'square', 0.06, 0, 500); } }
          else if (this.st === 'up') { this.vy -= 30 * dt; this.y += this.vy * dt; if (this.y <= 2 && this.vy < 0) { this.y = 2; this.land(); this.n++; this.t = 0; this.st = this.n % 2 === 0 ? 'aim' : 'walk'; } }
          else if (this.st === 'aim') { this.face = Math.atan2(-dx, -dz); if (this.t > 0.7) { this.st = 'charge'; this.t = 0; this.vx = dx / d * (11 + (3 - this.hp)); this.vz = dz / d * (11 + (3 - this.hp)); K.sfx.noise(0.6, 0.08, 400); } }
          else if (this.st === 'charge') {
            this.x += this.vx * dt; this.z += this.vz * dt; this.face = Math.atan2(-this.vx, -this.vz);
            let bonk = Math.hypot(this.x, this.z) > 14.4; for (const c of CYLS) if (c.pillar && Math.hypot(this.x - c.x, this.z - c.z) < c.r + 2.0) bonk = true;
            if (Math.random() < 0.5) burst(this.x, 2.2, this.z, 0xd8c0a0, 1, 2, { life: 0.4, grav: 2 });
            if (bonk) { const r = Math.hypot(this.x, this.z); if (r > 14.4) { this.x *= 14.4 / r; this.z *= 14.4 / r; } this.st = 'dizzy'; this.t = 0; shake = 0.4; K.sfx.tone(120, 0.4, 'square', 0.1, 0, 60); K.sfx.seq([[84, 0.25], [79, 0.25], [84, 0.25], [79, 0.25]], { bpm: 400, vol: 0.06, when: 0.3 }); }
            else if (this.t > 2.6) { this.st = 'walk'; this.t = 0; }
          }
          else if (this.st === 'dizzy') { if (this.t > 3.6 - (3 - this.hp) * 0.4) { this.st = 'walk'; this.t = 0; } }
          else if (this.st === 'hurt') { if (this.t > 0.9) { this.st = 'hop'; this.vy = 14; this.t = 0; } }
          else if (this.st === 'dead') { m.rotation.y += dt * 14; const k = Math.max(0.01, 2.4 * (1 - this.t / 1.6)); m.scale.setScalar(k); if (Math.random() < 0.6) burst(this.x, this.y + 2, this.z, [0xffd23a, 0xff6a1a, 0xffffff], 3, 8); if (this.t > 1.6) { this.st = 'gone'; m.visible = false; bossDown = true; reveal('boss'); K.music(null); } }
          if (this.st === 'gone') return;
          m.position.set(this.x, this.y, this.z); if (this.st !== 'dead') m.rotation.y += wrapA(this.face - m.rotation.y) * Math.min(1, dt * 6);
          m.rotation.z = this.st === 'dizzy' ? Math.sin(t * 6) * 0.15 : 0;
          this.stars.visible = this.st === 'dizzy'; if (this.stars.visible) { this.stars.position.set(this.x, this.y + 5.6, this.z); this.stars.rotation.y += dt * 4; }
          m.visible = this.st !== 'hurt' || (this.t * 14 | 0) % 2 === 0;
          // Bopper against the King: on his head when he's dizzy is a hit, anything else hurts
          if (P.st !== 'dead' && d < 2.6 && P.y < this.y + 4.6 && P.y + 1.2 > this.y && ['walk', 'charge', 'aim', 'dizzy', 'up', 'hop'].includes(this.st)) {
            if (this.st === 'dizzy' && P.vy < -1 && P.y > this.y + 3.4) { this.hit(P.st === 'pound'); P.vy = 15; P.gnd = false; P.st = 'jump'; P.stT = 0; P.twirl = false; }
            else if (this.st !== 'dizzy') hurt(1, this.x, this.z);
            else { const o = { x: P.x, y: P.y, z: P.z }; const dd = Math.hypot(P.x - this.x, P.z - this.z) || 1; P.x = this.x + (P.x - this.x) / dd * 2.65; P.z = this.z + (P.z - this.z) / dd * 2.65; }
          }
        },
        land() { shake = 0.35; snd.pound(); burst(this.x, 2.2, this.z, 0xd8c0a0, 16, 8, { ring: true, life: 0.5, grav: 0 }); const n = this.hp <= 1 ? 2 : 1; let k = 0; for (const R of this.rings) if (!R.on && k < n) { R.on = true; R.r = 1.5 - k * 2.5; R.x = this.x; R.z = this.z; R.m.visible = true; k++; } },
        hit(big) { this.hp--; this.st = this.hp <= 0 ? 'dead' : 'hurt'; this.t = 0; shake = 0.5; flash = 0.2; snd.hit(); K.sfx.tone(160, 0.6, 'sawtooth', 0.09, 0, 60); prog.score += 300; burst(this.x, this.y + 4, this.z, [0xffd23a, 0xffffff], 18, 8); say(this.hp <= 0 ? 'KING GRUMPUS IS BEATEN!' : ['', 'OOF! MY CROWN!', 'OW! MY ROYAL BOTTOM!'][this.hp], 2); },
      };

      // ================================================================ acorns, coins, the rest
      function reveal(cond) {
        let any = false;
        for (const a of ACS) if (a.hidden && a.cond === cond) {
          a.hidden = false; any = true;
          if (cond === 'c100') { a.x = P.x; a.y = P.y + 2.2; a.z = P.z; }
          a.mesh.position.set(a.x, a.y, a.z); a.mesh.visible = true; burst(a.x, a.y, a.z, [0xffd23a, 0xffffff], 18, 7);
        }
        if (any && !demo) { say('A GOLDEN ACORN APPEARED!', 2.2); K.sfx.seq([[79, 0.25], [83, 0.25], [86, 0.25], [91, 0.75]], { bpm: 300, vol: 0.09 }); }
      }
      let winA = null;
      function collectAcorn(a) {
        if (gotAc(a.id)) { a.mesh.visible = false; burst(a.x, a.y, a.z, 0x8ab8ff, 10, 4); K.sfx.tone(1200, 0.2, 'sine', 0.06); say('(YOU ALREADY HAD THAT ONE)', 1.4, '', '#bcd'); a.taken = true; return; }
        if (curW === 'hub') prog.got[a.id] = 1; else (prog.ac[curW] = prog.ac[curW] || {})[a.id] = 1;
        prog.score += 500; prog.started = 1; a.taken = true; winA = a; mode = 'win'; winT = 0; P.vx = P.vz = 0; K.music(null);
        K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 0.25], [91, 1.5]], { bpm: 360, vol: 0.1, wave: 'square' });
        K.sfx.seq([[60, 0.5], [64, 0.5], [67, 0.5], [72, 1.5]], { bpm: 180, vol: 0.08, wave: 'triangle' });
        if (curW === 'hub' && ['light', 'hill', 'mill', 'stones', 'pond', 'tree', 'grump', 'pier'].every(k => prog.got[k])) K.secret('rm.hop.all');
        if (a.id === 'wall') K.secret('rm.hop.wall');
        if (nAc() >= TOTAL) K.secret('rm.hop.every');
        saveNow();
      }
      function collectStuff(dt) {
        const py = P.y + 0.6;
        for (const a of ACS) if (!a.hidden && !a.taken && a.mesh.visible && Math.hypot(P.x - a.x, P.z - a.z) < 1.25 && Math.abs(py - a.y) < 1.5) { collectAcorn(a); if (mode === 'win') return; }
        for (const c of COINS) {
          if (c.got) continue; if (c.pop > 0) { c.pop -= dt; continue; }
          if (Math.abs(P.x - c.x) > 1 || Math.abs(P.z - c.z) > 1 || Math.abs(py - c.y) > 1.25) continue;
          c.got = true; visit.coins++; prog.score += 2; snd.coin(); if (P.hp < HPMAX()) P.hp++;
          if (visit.coins === 100) reveal('c100');
          if (Math.floor(visit.coins / 50) > visit.life50) { visit.life50 = Math.floor(visit.coins / 50); oneUp(); }
        }
        for (const r of REDS) {
          if (r.got || Math.abs(P.x - r.x) > 1 || Math.abs(P.z - r.z) > 1 || Math.abs(py - r.y) > 1.25) continue;
          r.got = true; visit.reds++; visit.coins += 2; prog.score += 20; if (P.hp < HPMAX()) P.hp = Math.min(HPMAX(), P.hp + 2);
          K.sfx.seq([[60 + visit.reds * 2, 0.25], [67 + visit.reds * 2, 0.5]], { bpm: 300, vol: 0.09, wave: 'square' }); burst(r.x, r.y, r.z, 0xff3a3a, 8, 4);
          say('RED COIN ' + visit.reds + ' OF ' + REDS.length, 1.4, '', '#ff6a6a');
          if (visit.reds === REDS.length) reveal('reds');
          if (visit.coins >= 100 && visit.coins - 2 < 100) reveal('c100');
        }
        LIFE.forEach((o, i) => { if (o.got || Math.hypot(P.x - o.x, P.z - o.z) > 1.1 || Math.abs(py - o.y) > 1.3) return; o.got = true; lifeMeshes[i].visible = false; oneUp(); });
        if (curW === 'manor') for (const L_ of LAMPS) if (!L_.lit && Math.hypot(P.x - L_.x, P.z - L_.z) < 0.9) lightLamp(L_);
      }
      function oneUp() { prog.lives = Math.min(99, prog.lives + 1); K.sfx.seq([[76, 0.25], [79, 0.25], [88, 0.25], [84, 0.25], [86, 0.25], [91, 0.5]], { bpm: 340, vol: 0.09, wave: 'square' }); say('1-UP!', 1.5, '', '#7aff7a'); }

      // ---- talking
      let dlg = null;
      function nearTalk() {
        let best = null, bd = 99;
        for (const n of NPCS) { const d = Math.hypot(P.x - n.x, P.z - n.z); if (d < n.r && Math.abs(P.y - n.y) < 2.5 && d < bd) { bd = d; best = n; } }
        return best;
      }
      function startTalk(n) {
        const lines = typeof n.lines === 'function' ? n.lines() : n.lines;
        dlg = { name: n.name, lines, i: 0, ch: 0, done: n.done || (n.percy ? () => percyStart() : null), npc: n };
        mode = 'dlg'; P.vx = P.vz = 0; if (n.x != null) { P.face = Math.atan2(-(n.x - P.x), -(n.z - P.z)); if (n.mesh && n.kind !== 'sign') n.mesh.rotation.y = Math.atan2(-(P.x - n.x), -(P.z - n.z)); }
        K.sfx.tone(880, 0.06, 'square', 0.05);
      }
      function dlgUpdate(dt) {
        const line = dlg.lines[dlg.i] || ''; const before = dlg.ch | 0; dlg.ch = Math.min(line.length, dlg.ch + dt * 60);
        if ((dlg.ch | 0) !== before && (dlg.ch | 0) % 3 === 0) K.sfx.tone(dlg.name === 'SIGN' ? 500 : 700 + (dlg.name.length % 5) * 60, 0.03, 'square', 0.025);
        if (K.pressed('a') || K.pressed('b') || K.pressed('start')) {
          if (dlg.ch < line.length) dlg.ch = line.length;
          else { dlg.i++; dlg.ch = 0; K.sfx.tone(660, 0.04, 'square', 0.04); if (dlg.i >= dlg.lines.length) { const f = dlg.done; dlg = null; mode = 'play'; if (f) f(); } }
        }
      }
      function mayorLines() {
        const n = nAc();
        if (prog.boss) return ['BOPPER! THE HERO OF BISCUIT ISLAND! WE\'RE PUTTING UP A STATUE OF YOU. IT\'S MADE OF SHORTBREAD.', n < TOTAL ? 'THERE ARE STILL ' + (TOTAL - n) + ' ACORNS OUT THERE SOMEWHERE, IF YOU FANCY A BIT MORE BOUNCING.' : 'ALL THIRTY-THREE ACORNS! I DON\'T KNOW WHAT TO SAY. HAVE A BISCUIT.'];
        const next = ORDER.find(w => NEED[w] > n);
        const L0 = n === 0 ? ['WELL HELLO THERE, BOPPER! I\'M MAYOR CRUMB.', 'DISASTER! KING GRUMPUS HAS PINCHED ALL THE GOLDEN ACORNS ON BISCUIT ISLAND AND HIDDEN THEM ALL OVER THE PLACE!', 'THERE ARE EIGHT RIGHT HERE ON THE ISLAND. HOW ABOUT THE TOP OF THE LIGHTHOUSE FOR A START?', 'THE MAGIC DOORS IN ACORN PLAZA LEAD TO FAR-OFF WORLDS WITH MORE ACORNS. THE FIRST ONE IS OPEN ALREADY.', 'PRESS ' + L('a') + ' TO JUMP. LAND AND PRESS IT AGAIN, AND AGAIN, FOR A TRIPLE JUMP!']
          : ['YOU\'VE FOUND ' + n + ' GOLDEN ACORN' + (n === 1 ? '' : 'S') + '! MARVELLOUS!'];
        if (next && n > 0) L0.push('THE DOOR TO ' + WN[next] + ' OPENS AT ' + NEED[next] + ' ACORNS. YOU NEED ' + (NEED[next] - n) + ' MORE.');
        if (!next) L0.push('YOU\'VE GOT ENOUGH TO OPEN KING GRUMPUS\'S DOOR! GO AND SHOW HIM WHAT FOR!');
        return L0;
      }

      // ================================================================ the camera: behind and above, turned with L / R in steps, kept out of walls
      const cam = T3.cam, C = { yaw: 0, want: 0, auto: 0, ty: 0, pos: V3(), look: V3(), dist: 9.5 };
      function camSnap() { C.yaw = C.want = P.face; C.ty = P.y; camUpdate(0, true); }
      function camUpdate(dt, snap) {
        if (!snap && !demo && mode === 'play') {
          if (IN.l) { C.want += Math.PI / 4; C.auto = 2.2; K.sfx.tone(760, 0.03, 'square', 0.04); }
          if (IN.r) { C.want -= Math.PI / 4; C.auto = 2.2; K.sfx.tone(760, 0.03, 'square', 0.04); }
        }
        if (C.auto > 0) C.auto -= dt;
        const sp = Math.hypot(P.vx, P.vz);
        if ((prog.opt.cam || demo) && C.auto <= 0 && sp > 3 && P.st !== 'dead') { const d = wrapA(P.face - C.want); if (Math.abs(d) < 2.3) C.want += d * Math.min(1, dt * 1.2); }
        C.yaw += wrapA(C.want - C.yaw) * (snap ? 1 : Math.min(1, dt * 7));
        if (snap || P.gnd || P.y < C.ty - 1 || P.y > C.ty + 4 || P.st === 'dead') C.ty += (P.y - C.ty) * (snap ? 1 : Math.min(1, dt * (P.gnd ? 6 : 3)));
        const tx = P.x, ty = C.ty + 1.4, tz = P.z;
        let wx = tx + Math.sin(C.yaw) * C.dist, wy = C.ty + 4.2, wz = tz + Math.cos(C.yaw) * C.dist;
        for (let k = 1; k <= 8; k++) { // pull in when something solid is in the way
          const f = k / 8, x = lerp(tx, wx, f), y = lerp(ty, wy, f), z = lerp(tz, wz, f);
          let hit = false; for (const b of BOXES) { if (b.mv || b.nocam) continue; const dx = x - b.x, dz = z - b.z, lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs; if (Math.abs(lx) < b.hw + 0.3 && Math.abs(lz) < b.hd + 0.3 && Math.abs(y - b.y) < b.hh + 0.3) { hit = true; break; } }
          if (!hit) for (const c of CYLS) if (!c.mv && Math.hypot(x - c.x, z - c.z) < c.r + 0.3 && y > c.y0 - 0.3 && y < c.y1 + 0.3) { hit = true; break; }
          if (hit) { const f2 = Math.max(0.15, (k - 1) / 8); wx = lerp(tx, wx, f2); wy = lerp(ty, wy, f2) + (1 - f2) * 1.5; wz = lerp(tz, wz, f2); break; }
        }
        const gg = WD.ground(wx, wz); if (gg > -100) wy = Math.max(wy, gg + 1.2); if (WD.water != null) wy = Math.max(wy, WD.water + 0.8);
        if (snap) { C.pos.set(wx, wy, wz); C.look.set(tx, ty - 0.2, tz); }
        else { const k = Math.min(1, dt * 8); C.pos.x += (wx - C.pos.x) * k; C.pos.y += (wy - C.pos.y) * k; C.pos.z += (wz - C.pos.z) * k; C.look.lerp(tv.set(tx, ty - 0.2, tz), Math.min(1, dt * 12)); }
        cam.position.copy(C.pos); if (shake > 0) cam.position.add(tv2.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake));
        cam.lookAt(C.look);
      }

      // ================================================================ the flow: title, menus, demo, worlds, pause, death, the ending
      let overSent = false, mode = 'title', menuI = 0, sub = null, subI = 0, idleT = 0, winT = 0, paused = false, pauseI = 0, card = null, overT = 0, endT = 0, fading = null, lockT = 0, demoT = 0, demoI = 0, demoJ = 0;
      const music = s => K.music(prog.opt.mus && s ? SONGS[s] : null);
      function iris(fn) { if (fading) return; fading = { t: 0, dur: 0.42, fn, done: false }; K.sfx.tone(520, 0.3, 'triangle', 0.05, 0, 160); }
      function spawnInWorld(w) { const s = WORLDS[w].spawn; respawnAt(s[0], 99, s[1], s[2]); const y = floorAt(s[0], s[1], 99); P.y = y; P.safe = [P.x, P.y, P.z]; camSnap(); }
      function enterWorld(w) {
        iris(() => { prog.door = ORDER.indexOf(w); buildWorld(w); spawnInWorld(w); P.hp = HPMAX(); P.inv = 0; mode = 'card'; card = { w, t: 0 }; K.music(null); K.sfx.seq([[72, 0.5], [79, 0.5], [84, 1]], { bpm: 200, vol: 0.08, wave: 'triangle' }); });
      }
      function toHubAtDoor(i) {
        buildWorld('hub'); const d = DOORS[i] || null;
        if (d) { respawnAt(d.x + d.fx * 3.2, PH, d.z + d.fz * 3.2, Math.atan2(-d.fx, -d.fz)); C.want = C.yaw = P.face + 1.9; camUpdate(0, true); } else spawnInWorld('hub');
        P.hp = HPMAX(); music('hub'); mode = 'play';
      }
      function leaveWorld() { const i = ORDER.indexOf(curW); iris(() => { toHubAtDoor(i); saveNow(); }); }
      function afterDeath() {
        prog.lives--;
        if (prog.lives < 0) { mode = 'over'; overT = 0; addHs(); prog.lives = 4; const w = curW; curW = 'hub'; K.save({ v2: 1, started: 1, score: prog.score, got: prog.got, ac: prog.ac, lives: 4, opt: prog.opt, hs: prog.hs, boss: prog.boss, w: 'hub', p: null, door: -1 }); curW = w; return; }
        iris(() => { if (curW === 'boss') buildWorld('boss'); spawnInWorld(curW); P.hp = HPMAX(); P.inv = 1; music(WORLDS[curW].song); mode = 'play'; saveNow(); });
      }
      function newGame() {
        Object.assign(prog, { got: {}, ac: {}, score: 0, lives: 4, boss: 0, started: 1, w: 'hub', p: null, door: -1 });
        buildWorld('hub'); spawnInWorld('hub'); P.hp = HPMAX(); mode = 'card'; card = { w: 'hub', t: 0 }; saveNow();
      }
      function continueGame() {
        const w = prog.w && prog.w !== 'boss' ? prog.w : 'hub';
        buildWorld(w);
        if (w === 'hub' && prog.p && isFinite(prog.p[0])) { respawnAt(prog.p[0], prog.p[1] + 0.5, prog.p[2], 0); } else spawnInWorld(w);
        P.hp = HPMAX(); mode = 'card'; card = { w, t: 0, back: true };
      }
      function toTitle() { started = false; demo = false; paused = false; if (curW !== 'hub') buildWorld('hub'); spawnInWorld('hub'); mode = 'title'; menuI = 0; sub = null; idleT = 0; music('title'); }
      function startDemo() { demo = true; mode = 'attract'; demoT = 0; demoI = 0; demoJ = 1; respawnAt(PLX + 2, PH, PLZ + 9, 0); P.hp = HPMAX(); music('hub'); }
      const DEMO = [[-4, 2], [6, -4], [14, -10], [20, -8], [16, 2], [10, 16], [2, 22], [-10, 20], [-16, 8], [-12, -4], [-4, 2]];
      function demoInput(dt) {
        const [tx, tz] = DEMO[demoI % DEMO.length], dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz);
        if (d < 2.5) demoI++;
        const fx = -Math.sin(C.yaw), fz = -Math.cos(C.yaw), rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw);
        IN.x = clamp((dx * rx + dz * rz) / (d || 1), -1, 1); IN.y = clamp(-(dx * fx + dz * fz) / (d || 1), -1, 1);
        demoJ -= dt; IN.a = false; IN.aH = P.vy > 0; IN.b = false; IN.c = false; IN.cH = false; IN.l = IN.r = false;
        if (demoJ <= 0 && P.gnd) { IN.a = true; demoJ = P.chain === 2 ? 2.2 : 0.05 + Math.random() * 0.15; }
        if (!P.gnd && P.st === 'jump3' && P.stT > 0.5 && Math.random() < 0.02) IN.a = true;
        if (P.gnd && Math.random() < 0.004) IN.b = true;
      }

      function menuItems() { return (prog.started ? ['CONTINUE (FILE A)'] : []).concat(['NEW GAME', 'HOW TO PLAY', 'OPTIONS', 'HIGH SCORES']); }
      const optItems = () => [['MUSIC', prog.opt.mus ? 'ON' : 'OFF'], ['AUTO CAMERA', prog.opt.cam ? 'ON' : 'OFF'], ['EASY MODE (MORE HEALTH)', prog.opt.easy ? 'ON' : 'OFF'], ['BACK', '']];
      function pauseItems() { return curW === 'hub' ? ['RESUME', 'BACK TO THE START', 'QUIT TO TITLE'] : ['RESUME', 'RESTART WORLD', 'LEAVE WORLD', 'QUIT TO TITLE']; }
      const up = () => K.pressed('up'), dn = () => K.pressed('down'), ok = () => K.pressed('a') || K.pressed('start'), back = () => K.pressed('b');
      const tick = () => K.sfx.tone(880, 0.04, 'square', 0.04), okS = () => K.sfx.tone(1320, 0.08, 'square', 0.05);
      let started = false, cheat = '';
      const CHEAT = 'LRLRB';
      function titleUpdate(dt) {
        const items = menuItems();
        if (K.any() || up() || dn() || K.pressed('l') || K.pressed('r')) idleT = 0; else idleT += dt;
        if (!started) { // the PRESS START screen (and a cheat code: L R L R B)
          for (const [b, ch] of [['l', 'L'], ['r', 'R'], ['b', 'B']]) if (K.pressed(b)) { cheat = (cheat + ch).slice(-5); if (cheat === CHEAT) { prog.opt.big = prog.opt.big ? 0 : 1; saveOpts(); K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.5]], { bpm: 300, vol: 0.09 }); say(prog.opt.big ? 'BIG HEAD MODE ON!' : 'BIG HEAD MODE OFF', 2); cheat = ''; } }
          if (K.pressed('start') || K.pressed('a')) { started = true; okS(); idleT = 0; }
          else if (idleT > 12) startDemo();
          return;
        }
        if (sub === 'howto') { if (ok() || back()) { subI++; tick(); if (subI > 1 || back()) sub = null; } return; }
        if (sub === 'scores') { if (ok() || back()) { sub = null; tick(); } return; }
        if (sub === 'erase') { if (up() || dn()) { subI = 1 - subI; tick(); } if (back()) { sub = null; tick(); } else if (ok()) { if (subI === 1) { okS(); sub = null; newGame(); } else { sub = null; tick(); } } return; }
        if (sub === 'options') {
          const n = optItems().length;
          if (up()) { subI = (subI + n - 1) % n; tick(); } if (dn()) { subI = (subI + 1) % n; tick(); }
          if (ok() || K.pressed('left') || K.pressed('right')) { if (subI === 3) { sub = null; tick(); } else { const k = ['mus', 'cam', 'easy'][subI]; prog.opt[k] = prog.opt[k] ? 0 : 1; okS(); if (k === 'mus') music('title'); saveOpts(); } }
          if (back()) sub = null; return;
        }
        if (idleT > 20) { started = false; idleT = 0; return; }
        if (up()) { menuI = (menuI + items.length - 1) % items.length; tick(); } if (dn()) { menuI = (menuI + 1) % items.length; tick(); }
        if (ok()) {
          const it = items[menuI]; okS();
          if (it === 'CONTINUE (FILE A)') continueGame();
          else if (it === 'NEW GAME') { if (prog.started) { sub = 'erase'; subI = 0; } else newGame(); }
          else if (it === 'HOW TO PLAY') { sub = 'howto'; subI = 0; } else if (it === 'OPTIONS') { sub = 'options'; subI = 0; } else if (it === 'HIGH SCORES') sub = 'scores';
        }
      }
      function saveOpts() { if (prog.started) saveNow(); else K.save({ v2: 1, started: 0, score: 0, got: {}, ac: {}, lives: 4, opt: prog.opt, hs: prog.hs, boss: 0, w: 'hub', p: null, door: -1 }); }

      // ---- world animation: sea, sails, clock hands, the bell, movers
      function worldAnim(dt, t) {
        if (WG.userData.sea) WG.userData.sea.offset.set(t * 0.015, t * 0.01);
        if (WG.userData.sails) WG.userData.sails.rotation.z += dt * 0.8;
        if (WG.userData.clouds) WG.userData.clouds.rotation.y += dt * 0.004;
        if (WG.userData.hands) { const d = new Date(), h = d.getHours() % 12 + d.getMinutes() / 60, mi = d.getMinutes() + d.getSeconds() / 60; for (const [hh, mh] of WG.userData.hands) { hh.rotation.z = -h / 12 * TAU; mh.rotation.z = -mi / 60 * TAU; } }
        if (WG.userData.bell) WG.userData.bell.rotation.z = Math.sin(t * 1.4) * 0.12;
        if (BELT) BELT.offset.x = -t * 0.8;
        for (const s of MOVERS) { s.px = s.x; s.pz = s.z; const ox = s.x, oy = s.k === 'box' ? s.y + s.hh : s.y1, oz = s.z, ory = s.ry || 0; s.place(s, t); sync(s);
          if (P.plat === s && P.gnd && mode !== 'title') { const dx = P.x - ox, dz = P.z - oz, dr = (s.ry || 0) - ory, c = Math.cos(dr), sn = Math.sin(dr); P.x = s.x + dx * c + dz * sn; P.z = s.z - dx * sn + dz * c; P.y = s.k === 'box' ? s.y + s.hh : s.y1; P.face += dr; P.yaw += dr; } }
        for (const c of CYLS) if (c.squish > 0) c.squish -= dt;
        for (const pr of PROPS) if (pr.open > 0 && pr.open < 1) { pr.open = Math.min(1, pr.open + dt * 3); pr.lid.rotation.x = 1.3 * pr.open; }
        lifeMeshes.forEach((m, i) => { m.rotation.y = t * 2; m.position.y = LIFE[i].y + Math.sin(t * 3 + i) * 0.15; });
        for (const a of ACS) if (a.mesh && a.mesh.visible && a !== winA) { a.mesh.rotation.y = t * 2 + a.x; a.mesh.position.y = a.y + Math.sin(t * 2.5 + a.x) * 0.2; }
      }
      function coinsDraw(t) {
        let i = 0;
        for (const c of COINS) { if (i >= coinMesh_.count) break; if (c.got) coinMesh_.setMatrixAt(i, pz); else { const k = c.pop > 0 ? 1 - c.pop * 2 : 0; pdum.position.set(c.x, c.y + Math.sin(t * 3 + i) * 0.08 + Math.max(0, k * -1.2), c.z); pdum.rotation.set(0, t * 3.4 + i * 0.4, 0); pdum.scale.set(1, 1, 1); pdum.updateMatrix(); coinMesh_.setMatrixAt(i, pdum.matrix); } i++; }
        for (; i < coinMesh_.count; i++) coinMesh_.setMatrixAt(i, pz);
        coinMesh_.instanceMatrix.needsUpdate = true;
        REDS.forEach((r, j) => { if (r.got) redMesh_.setMatrixAt(j, pz); else { pdum.position.set(r.x, r.y + Math.sin(t * 3 + j) * 0.1, r.z); pdum.rotation.set(0, t * 3.4 + j, 0); pdum.updateMatrix(); redMesh_.setMatrixAt(j, pdum.matrix); } });
        if (!REDS.length) redMesh_.setMatrixAt(0, pz);
        redMesh_.instanceMatrix.needsUpdate = true;
      }

      // ---- Bopper's poses
      function animBop(dt, t) {
        const B = BOP, sp = Math.hypot(P.vx, P.vz), st = P.st;
        B.root.position.set(P.x, P.y, P.z);
        P.yaw += wrapA(P.face - P.yaw) * Math.min(1, dt * 16);
        let yaw = P.yaw, rx = 0, rz = 0, sc = 1, hy = 0.42;
        const arm = [0, 0, 0, 0], leg = [0, 0, 0, 0]; // armL x,z  armR x,z / legL x,z legR x,z
        let headY = 0, headX = 0;
        if (P.gnd && (st === 'run' || st === 'idle' || st === 'skid')) {
          const amp = Math.min(1, sp / 7), ph = P.run;
          leg[0] = Math.sin(ph) * 1.1 * amp; leg[2] = -leg[0]; arm[0] = -Math.sin(ph) * 0.9 * amp; arm[2] = -arm[0]; arm[1] = 0.15 + 0.1 * amp; arm[3] = -arm[1];
          hy += Math.abs(Math.sin(ph)) * 0.09 * amp; rx = -0.2 * amp;
          if (sp < 0.6) { hy += Math.sin(t * 3) * 0.012; headY = Math.sin(t * 0.6) * 0.35 * clamp(P.stT - 2, 0, 1); arm[1] = 0.12; arm[3] = -0.12; }
          if (st === 'skid') { rx = 0.35; arm[0] = arm[2] = 1.2; leg[0] = 0.8; leg[2] = 0.2; }
        } else if (st === 'crouch') { hy = 0.3; sc = 0.86; leg[0] = leg[2] = 0.7; arm[0] = arm[2] = 0.5; rx = -0.1; }
        else if (st === 'slide') { hy = 0.3; leg[0] = leg[2] = 1.4; arm[1] = 1.0; arm[3] = -1.0; rx = 0.25; }
        else if (st === 'punch') { const n = P.punchN, k = Math.min(1, P.stT / 0.08) * (P.stT < 0.25 ? 1 : 0.4); if (n === 1) { arm[2] = 1.7 * k; arm[0] = -0.5; } else if (n === 2) { arm[0] = 1.7 * k; arm[2] = -0.5; } else { leg[2] = 1.8 * k; rx = 0.3 * k; arm[1] = 0.8; arm[3] = -0.8; } }
        else if (st === 'poundLand') { const k = Math.max(0, 1 - P.stT / 0.25); sc = 1 - k * 0.35; leg[0] = leg[2] = 0.5; arm[1] = 1.4; arm[3] = -1.4; }
        else if (st === 'jump' || st === 'jump2' || st === 'spring' || st === 'wallkick') {
          if (P.vy > 0) { arm[1] = st === 'jump' ? 2.2 : 2.9; arm[3] = -arm[1]; leg[0] = 0.9; leg[2] = -0.4; } else { arm[1] = 1.3 + Math.sin(t * 20) * 0.2; arm[3] = -arm[1]; leg[0] = 0.3; leg[2] = -0.2; }
          if (st === 'spring' || st === 'wallkick') yaw += P.stT < 0.4 ? P.stT / 0.4 * TAU : 0;
          if (P.wallT > 0 && P.vy < 0) { arm[1] = 2.8; arm[3] = -0.4; rx = 0.2; }
        }
        else if (st === 'jump3') { rx = P.stT < 0.75 ? -(P.stT / 0.75) * TAU : 0; arm[1] = P.stT < 0.75 ? 0.6 : 1.3; arm[3] = -arm[1]; leg[0] = leg[2] = P.stT < 0.75 ? 1.4 : 0.3; if (P.stT < 0.75 && (K.frame & 3) === 0) burst(P.x, P.y + 0.6, P.z, 0xffffff, 1, 0.5, { life: 0.3, grav: 0, size: 0.15 }); }
        else if (st === 'back') { rx = P.stT < 0.8 ? (P.stT / 0.8) * TAU : 0; arm[1] = 2.6; arm[3] = -2.6; leg[0] = leg[2] = 0.6; }
        else if (st === 'twirl') { yaw += (P.stT / 0.4) * TAU * 1.5; arm[1] = 1.6; arm[3] = -1.6; leg[0] = 0.2; if (P.stT > 0.45) P.st = 'fall'; }
        else if (st === 'long') { rx = -1.25; arm[0] = arm[2] = 2.9; leg[0] = leg[2] = -0.3; }
        else if (st === 'pound') { if (P.stT < 0.28) { rx = -(P.stT / 0.28) * TAU; sc = 0.85; leg[0] = leg[2] = 1.5; arm[0] = arm[2] = 1.2; } else { leg[0] = leg[2] = 1.3; arm[1] = 2.6; arm[3] = -2.6; } }
        else if (st === 'kick') { leg[0] = 1.6; leg[2] = -0.6; arm[1] = 1.2; arm[3] = -1.2; rx = 0.25; if (P.stT > 0.45) P.st = 'fall'; }
        else if (st === 'hurt' || st === 'burn') { rx = 0.5; arm[1] = 2.4; arm[3] = -2.4; leg[0] = -0.4; leg[2] = 0.5; if (st === 'burn' && (K.frame & 1)) burst(P.x, P.y + 0.3, P.z, 0x5a5a5a, 1, 1, { life: 0.5, grav: -3 }); if (P.gnd) P.st = 'idle'; }
        else if (st === 'dead') { yaw += P.spin; rx = 0.4; arm[1] = 2.6; arm[3] = -2.6; }
        else { if (P.vy > 0) { arm[1] = 2; arm[3] = -2; } else { arm[1] = 1.3 + Math.sin(t * 22) * 0.25; arm[3] = -arm[1]; } leg[0] = 0.3; leg[2] = -0.25; }
        if (mode === 'win') { yaw = Math.atan2(-(C.pos.x - P.x), -(C.pos.z - P.z)) + Math.PI; rx = 0; arm[1] = 2.9; arm[3] = -2.9; arm[0] = arm[2] = 0; leg[0] = 0.2; leg[2] = -0.2; hy = 0.42 + Math.max(0, Math.sin(Math.min(winT, 0.8) / 0.8 * Math.PI)) * 0.8; yaw += winT < 0.8 ? winT / 0.8 * TAU : 0; }
        if (P.land > 0) sc *= 1 - P.land * 1.6;
        B.m.rotation.set(rx, yaw, rz, 'YXZ'); B.m.scale.set(1 / Math.sqrt(sc), sc, 1 / Math.sqrt(sc));
        B.hips.position.y = hy; B.head.rotation.set(headX, headY, 0); B.head.scale.setScalar(prog.opt.big ? 1.7 : 1);
        B.armL.rotation.set(arm[0], 0, arm[1]); B.armR.rotation.set(arm[2], 0, arm[3]); B.legL.rotation.set(leg[0], 0, leg[1]); B.legR.rotation.set(leg[2], 0, leg[3]);
        B.blink -= dt; if (B.blink < 0) B.blink = 2 + Math.random() * 3; B.eyes.scale.y = B.blink < 0.12 ? 0.1 : 1; B.eyes.position.y = B.blink < 0.12 ? 0.34 : 0;
        B.root.visible = (P.inv <= 0 || (P.inv * 12 | 0) % 2 === 0) && !(mode === 'view' && VW && VW.m !== B.root);
      }

      // ================================================================ the main step
      function update(dt) {
        const t = K.t;
        if (fading) { fading.t += dt; if (!fading.done && fading.t >= fading.dur) { fading.done = true; fading.fn(); } if (fading.t >= fading.dur * 2) fading = null; }
        if (msgT > 0) msgT -= dt; if (flash > 0) flash -= dt; if (shake > 0) shake -= dt;
        worldAnim(dt, t); partsUpdate(dt);
        if (mode === 'view') { const v = VW; cam.position.set(v.x + Math.sin(v.ang) * v.dist, v.y + v.h, v.z + Math.cos(v.ang) * v.dist); cam.lookAt(v.x, v.y + v.look, v.z); if (v.m === BOP.root) { animBop(dt, t); } return; }
        if (mode === 'title') {
          titleUpdate(dt); if (mode !== 'title') return;
          const a = 1.25 + Math.sin(t * 0.13) * 0.65; C.pos.set(PLX + Math.sin(a) * 26, PH + 12 + Math.sin(t * 0.3) * 2, PLZ + Math.cos(a) * 26); cam.position.copy(C.pos); cam.lookAt(PLX, PH + 3, PLZ);
          P.x = PLX + 2; P.z = PLZ + 9; P.y = PH; P.face = t * 0.6; P.st = 'idle'; P.gnd = true; animBop(dt, t); BOP.root.position.y = PH + Math.abs(Math.sin(t * 3.2)) * 0.9; BOP.m.rotation.y = t * 0.8;
          enemiesIdle(dt, t); return;
        }
        if (mode === 'attract') {
          demoT += dt; if (K.any() || K.pressed('up') || K.pressed('down') || demoT > 28) { toTitle(); return; }
          demoInput(dt); stepPlayer(dt); enemiesUpdate(dt, t); animBop(dt, t); camUpdate(dt); return;
        }
        if (mode === 'card') { card.t += dt; if (card.t > 0.6 && (K.pressed('a') || K.pressed('start'))) { mode = 'play'; okS(); music(WORLDS[curW].song); if (card.w === 'hub' && !card.back && nAc() === 0) say('FIND THE GOLDEN ACORNS!', 2.5); } camUpdate(dt); animBop(dt, t); return; }
        if (mode === 'over') { overT += dt; P.vy = 0; if (overT > 3.2 && !overSent) { overSent = true; sendScore(true, 'GAME OVER', `${nAc()} OF ${TOTAL} GOLDEN ACORNS. THEY'RE SAVED: PICK CONTINUE ON THE TITLE SCREEN.`); } return; }
        if (mode === 'ending') { endingUpdate(dt, t); return; }
        if (mode === 'dlg') { dlgUpdate(dt); camUpdate(dt); animBop(dt, t); return; }
        if (mode === 'win') {
          winT += dt; animBop(dt, t);
          if (winA) { winA.mesh.material = matAcorn; winA.mesh.position.set(P.x, P.y + 2.3 + (BOP.hips.position.y - 0.42), P.z); winA.mesh.rotation.y = t * 4; }
          const fx = -Math.sin(P.face), fz = -Math.cos(P.face); C.pos.lerp(tv.set(P.x + fx * 5.5, P.y + 2.4, P.z + fz * 5.5), Math.min(1, dt * 4)); cam.position.copy(C.pos); cam.lookAt(P.x, P.y + 1.3, P.z);
          if (winT > 3.2 || (winT > 1.2 && K.pressed('a'))) {
            const id = winA.id; winA.mesh.visible = false; winA = null; mode = 'play'; P.st = 'idle'; C.want = C.yaw = Math.atan2(C.pos.x - P.x, C.pos.z - P.z);
            if (id === 'crown') { startEnding(); return; }
            music(WORLDS[curW].song); sendScore(false);
          }
          return;
        }
        // ---- playing
        if (K.pressed('start') && !fading) {
          paused = !paused; pauseI = 0; K.sfx.tone(paused ? 440 : 880, 0.06);
          if (paused) { K.music(null); saveNow(); } else music(WORLDS[curW].song);
          return;
        }
        if (paused) { pauseUpdate(); return; }
        if (fading) { animBop(dt, t); camUpdate(dt); return; }
        visit.t += dt; readInput();
        stepPlayer(dt);
        if (mode !== 'play') { animBop(dt, t); camUpdate(dt); return; }
        enemiesUpdate(dt, t); if (curW === 'peaks') percyUpdate(dt); if (curW === 'manor') BB.update(dt, t); if (curW === 'boss') BOSS.update(dt, t);
        if (P.st !== 'dead') collectStuff(dt);
        // the doors
        if (curW === 'hub') for (const d of DOORS) {
          if (Math.hypot(P.x - (d.x + d.fx * 0.5), P.z - (d.z + d.fz * 0.5)) < 1.25 && P.y < PH + 1.8) {
            if (nAc() >= d.need) { enterWorld(d.w); break; }
            else if (lockT <= 0) { say('THIS DOOR NEEDS ' + d.need + ' ACORNS', 2, 'YOU HAVE ' + nAc(), '#ffb0a0'); K.sfx.tone(160, 0.2, 'square', 0.06); lockT = 2; }
          }
        }
        if (lockT > 0) lockT -= dt;
        if (doorExit && curW !== 'hub' && visit.t > 1.5 && Math.hypot(P.x - (doorExit.x + doorExit.fx * 0.4), P.z - (doorExit.z + doorExit.fz * 0.4)) < 1.0 && Math.abs(P.y - doorExit.y) < 1.5) leaveWorld();
        animBop(dt, t); camUpdate(dt);
      }
      function enemiesIdle(dt, t) { for (const e of ENS) if (e.alive && e.mesh) e.mesh.position.y = e.y + Math.abs(Math.sin(t * 6 + e.hx)) * 0.08; }
      function pauseUpdate() {
        const it = pauseItems();
        if (up()) { pauseI = (pauseI + it.length - 1) % it.length; tick(); } if (dn()) { pauseI = (pauseI + 1) % it.length; tick(); }
        if (K.pressed('a')) {
          const c = it[pauseI]; okS(); paused = false;
          if (c === 'RESUME') music(WORLDS[curW].song);
          else if (c === 'RESTART WORLD') { const w = curW; iris(() => { buildWorld(w); spawnInWorld(w); P.hp = HPMAX(); music(WORLDS[w].song); }); }
          else if (c === 'BACK TO THE START') iris(() => { spawnInWorld('hub'); music('hub'); });
          else if (c === 'LEAVE WORLD') leaveWorld();
          else if (c === 'QUIT TO TITLE') { saveNow(); addHs(); saveNow(); sendScore(false); iris(() => toTitle()); }
        }
      }
      // ---- the ending
      const CREDITS = ['BOUNCE QUEST 64', '', 'STARRING', 'BOPPER', '', 'WITH', 'MAYOR CRUMB', 'OLD BARNABY', 'CAPTAIN CLAWS', 'SHELLY', 'PERCY PENGUIN', 'SIR HUBERT', 'PROFESSOR COG', 'BIG BOOHOO', 'AND', 'KING GRUMPUS (SORRY)', '', 'GAME DESIGN', 'THE BISCUIT SOFT TEAM', '', 'PLAY TESTERS', 'DAVE', 'LUKE', 'CALLUM', 'JACKK', '', 'TEA AND BISCUITS', 'MOM', '', 'THANK YOU FOR PLAYING!', '', '(C) 1999 BISCUIT SOFT'];
      function startEnding() { mode = 'ending'; endT = 0; prog.boss = 1; K.secret('rm.hop.king'); addHs(); music('ending'); saveNow(); }
      function endingUpdate(dt, t) {
        endT += dt;
        const a = t * 0.2; cam.position.set(Math.sin(a) * 16, 9, Math.cos(a) * 16); cam.lookAt(0, 3, 0);
        P.x = 0; P.z = 2; P.y = 2; P.st = 'idle'; P.face = Math.atan2(-cam.position.x, -cam.position.z) + Math.PI; winT = 1; animBop(dt, t); BOP.root.position.y = 2 + Math.abs(Math.sin(t * 4)) * 0.6;
        if (Math.random() < 0.15) burst((Math.random() - 0.5) * 30, 10 + Math.random() * 8, (Math.random() - 0.5) * 30, [0xff4a4a, 0xffd23a, 0x4ae0ff, 0x7aff7a][(Math.random() * 4) | 0], 14, 8, { life: 0.9, grav: 4 });
        if (endT > 4 && (K.pressed('start') || K.pressed('a')) || endT > 46) { sendScore(false); iris(() => { toHubAtDoor(4); saveNow(); say('KING GRUMPUS IS BEATEN!', 3, 'THERE MAY STILL BE ACORNS TO FIND...'); }); mode = 'play'; }
      }

      // ================================================================ the HUD
      function proj(x, y, z) { tv.set(x, y, z).project(cam); return [(tv.x + 1) / 2 * W, (1 - tv.y) / 2 * H, tv.z < 1 && tv.z > -1]; }
      function acIcon(x, y, s, c) { hud.fillStyle = c || '#ffc81a'; hud.beginPath(); hud.ellipse(x, y + s * 0.15, s * 0.5, s * 0.62, 0, 0, 7); hud.fill(); hud.fillStyle = '#8a5a22'; hud.beginPath(); hud.ellipse(x, y - s * 0.32, s * 0.62, s * 0.3, 0, 0, 7); hud.fill(); hud.fillStyle = '#fff6c0'; hud.fillRect(x - s * 0.25, y, s * 0.12, s * 0.25); }
      function coinIcon(x, y, r, c) { hud.fillStyle = '#6a4a00'; hud.beginPath(); hud.ellipse(x + 1, y + 1, r * 0.7, r, 0, 0, 7); hud.fill(); hud.fillStyle = c || '#ffd23a'; hud.beginPath(); hud.ellipse(x, y, r * 0.7, r, 0, 0, 7); hud.fill(); hud.fillStyle = 'rgba(255,255,255,.6)'; hud.fillRect(x - 1, y - r * 0.6, 1, r * 1.2); }
      function biscuit(x, y, r) {
        const n = HPMAX(), hp = clamp(P.hp, 0, n);
        hud.fillStyle = 'rgba(0,0,0,.35)'; hud.beginPath(); hud.arc(x + 1.5, y + 1.5, r, 0, 7); hud.fill();
        for (let i = 0; i < n; i++) {
          const a0 = -Math.PI / 2 + i / n * TAU, a1 = a0 + TAU / n;
          hud.fillStyle = i < hp ? (hp <= 2 && (K.t * 4 | 0) % 2 ? '#ff7a4a' : '#e8a850') : 'rgba(60,30,10,.45)';
          hud.beginPath(); hud.moveTo(x, y); hud.arc(x, y, i < hp ? r : r * 0.55, a0 + 0.04, a1 - 0.04); hud.closePath(); hud.fill();
        }
        hud.fillStyle = '#5a2a12'; for (let i = 0; i < hp; i++) { const a = -Math.PI / 2 + (i + 0.5) / n * TAU; hud.beginPath(); hud.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, 1.4, 0, 7); hud.fill(); }
        hud.strokeStyle = '#7a4a1a'; hud.lineWidth = 1; hud.beginPath(); hud.arc(x, y, r, 0, 7); hud.stroke();
      }
      function box2(x, y, w, h, a) { hud.fillStyle = `rgba(10,20,60,${a == null ? 0.75 : a})`; hud.fillRect(x + 2, y, w - 4, h); hud.fillRect(x, y + 2, w, h - 4); hud.strokeStyle = 'rgba(255,255,255,.7)'; hud.lineWidth = 1; hud.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); }
      function bigText(s, cx, y, size, c1, c2) {
        hud.save(); hud.textAlign = 'center'; hud.textBaseline = 'middle'; hud.font = `italic 900 ${size}px Arial Black,Arial,sans-serif`;
        for (let d = Math.max(2, size / 7 | 0); d > 0; d--) { hud.fillStyle = c2 || '#8a3a00'; hud.fillText(s, cx + d * 0.6, y + d); }
        const gr = hud.createLinearGradient(0, y - size / 2, 0, y + size / 2); gr.addColorStop(0, '#fff8c0'); gr.addColorStop(0.5, c1 || '#ffd23a'); gr.addColorStop(1, '#e88a1a'); hud.fillStyle = gr; hud.fillText(s, cx, y);
        hud.lineWidth = 1; hud.strokeStyle = 'rgba(255,255,255,.8)'; hud.strokeText(s, cx, y); hud.restore();
      }
      function wrap(s, n) { const out = []; let line = ''; for (const w of String(s).split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); } if (line) out.push(line); return out; }
      function logo(y) {
        bigText('BOUNCE QUEST', W / 2, y, 30);
        const cols = ['#e8261c', '#2a9a2a', '#2a5ae0', '#ffd23a'];
        hud.save(); hud.textAlign = 'center'; hud.textBaseline = 'middle'; for (let d = 5; d >= 0; d--) { hud.font = '900 34px Arial Black,Arial,sans-serif'; hud.fillStyle = d ? '#222' : cols[(K.t * 2 | 0) % 4]; hud.fillText('64', W / 2 + d * 0.5, y + 34 + d); } hud.restore();
      }
      function drawHud() {
        hud.clearRect(0, 0, W, H);
        if (mode === 'view') return;
        if (mode === 'title') return drawTitle();
        if (mode === 'card') return drawCard();
        if (mode === 'ending') return drawEnding();
        if (mode === 'attract') { if ((K.t * 2 | 0) % 2) F.center(hud, 'DEMO PLAY', W / 2, 16, '#fff', 1, true); logoSmall(); F.center(hud, 'PRESS START', W / 2, H - 20, '#ffd23a', 1, true); irisDraw(); return; }
        // counters
        acIcon(14, 15, 11); F.draw(hud, '✕ ' + nAc(), 23, 12, '#fff', 1, '#2a1a0a');
        coinIcon(14, 31, 5); F.draw(hud, '✕ ' + visit.coins, 23, 28, '#fff', 1, '#2a1a0a');
        if (REDS.length && visit.reds) { coinIcon(14, 46, 5, '#ff3a3a'); F.draw(hud, visit.reds + '/' + REDS.length, 23, 43, '#ff9a9a', 1, '#2a1a0a'); }
        biscuit(W - 22, 22, 15); F.draw(hud, 'BOPPER✕' + Math.max(0, prog.lives), W - 70, 42, '#fff', 1, '#2a1a0a');
        // talk / read prompts and door labels
        if (mode === 'play' && !paused) {
          const n = nearTalk(); if (n && P.gnd) { const [sx, sy, vis] = proj(n.x, n.y + (n.kind === 'sign' ? 2.4 : 2.6), n.z); if (vis) { box2(sx - 26, sy - 7, 52, 13, 0.8); F.center(hud, L('b') + (n.kind === 'sign' ? ' READ' : ' TALK'), sx, sy - 3, '#ffd23a', 1); } }
          if (curW === 'hub') for (const d of DOORS) { const dd = Math.hypot(P.x - d.x, P.z - d.z); if (dd < 9) { const [sx, sy, vis] = proj(d.x, d.y + 5.6, d.z); if (vis) { const open = nAc() >= d.need; F.center(hud, open ? WN[d.w] : '✕ ' + d.need, sx, sy, open ? '#fff' : '#ffb0a0', 1, true); if (!open) acIcon(sx - F.width('✕ ' + d.need) / 2 - 7, sy + 3, 8); } } }
          if (curW !== 'hub' && doorExit && Math.hypot(P.x - doorExit.x, P.z - doorExit.z) < 6) { const [sx, sy, vis] = proj(doorExit.x, doorExit.y + 4.6, doorExit.z); if (vis) F.center(hud, 'TO BISCUIT ISLAND', sx, sy, '#fff', 1, true); }
        }
        // boss bars
        if (curW === 'boss' && BOSS.mesh && ['walk', 'up', 'aim', 'charge', 'dizzy', 'hurt', 'hop'].includes(BOSS.st)) bossBar('KING GRUMPUS', BOSS.hp);
        if (curW === 'manor' && BB.on && BB.st === 'fight') bossBar('BIG BOOHOO', BB.hp);
        if (curW === 'peaks' && PERCY.st === 'race') { const d = Math.hypot(PERCY.x, PERCY.z - 48), me = Math.hypot(P.x, P.z - 48); F.center(hud, me < d ? 'YOU ARE AHEAD!' : 'PERCY IS AHEAD!', W / 2, H - 22, me < d ? '#7aff7a' : '#ff8a8a', 1, true); }
        if (msgT > 0 && mode !== 'win') { const k = msg.length > 16 ? 1 : 2; F.center(hud, msg, W / 2, 62, msgCol, k, '#3a1a00'); if (msg2) F.center(hud, msg2, W / 2, 62 + 9 * k + 4, '#fff', 1, true); }
        if (mode === 'win' && winA) { bigText('GOLDEN ACORN!', W / 2, 46, 24); F.center(hud, winA.name, W / 2, 70, '#fff', 1, true); F.center(hud, nAc() + ' OF ' + TOTAL, W / 2, H - 30, '#ffd23a', 2, '#3a1a00'); }
        if (mode === 'dlg' && dlg) drawDlg();
        if (mode === 'over') { hud.fillStyle = `rgba(0,0,0,${Math.min(0.7, overT * 0.4)})`; hud.fillRect(0, 0, W, H); bigText('GAME OVER', W / 2, H / 2 - 10, 30, '#ff6a4a', '#4a0a00'); F.center(hud, 'YOUR ACORNS ARE SAVED', W / 2, H / 2 + 20, '#fff', 1, true); }
        if (flash > 0) { hud.fillStyle = `rgba(255,255,255,${Math.min(0.6, flash)})`; hud.fillRect(0, 0, W, H); }
        if (paused) drawPause();
        irisDraw();
      }
      function logoSmall() { hud.save(); hud.globalAlpha = 0.85; hud.font = 'italic 900 14px Arial Black,Arial,sans-serif'; hud.textAlign = 'right'; hud.fillStyle = '#8a3a00'; hud.fillText('BOUNCE QUEST 64', W - 7, 21); hud.fillStyle = '#ffd23a'; hud.fillText('BOUNCE QUEST 64', W - 8, 20); hud.restore(); }
      function bossBar(name, hp) { box2(W / 2 - 60, H - 30, 120, 22, 0.7); F.center(hud, name, W / 2, H - 27, '#fff', 1); for (let i = 0; i < 3; i++) { hud.fillStyle = i < hp ? '#ff3a3a' : '#3a1a1a'; hud.fillRect(W / 2 - 33 + i * 23, H - 17, 20, 5); } }
      function drawDlg() {
        const x = 12, y = H - 70, w = W - 24, h = 60; box2(x, y, w, h, 0.82);
        if (dlg.name !== 'SIGN') { box2(x + 6, y - 9, F.width(dlg.name) + 12, 13, 0.95); F.draw(hud, dlg.name, x + 12, y - 6, '#ffd23a', 1); }
        const line = (dlg.lines[dlg.i] || '').slice(0, dlg.ch | 0); wrap(line, 47).slice(0, 5).forEach((l, i) => F.draw(hud, l, x + 9, y + 9 + i * 10, '#fff', 1));
        if ((dlg.ch | 0) >= (dlg.lines[dlg.i] || '').length && (K.t * 3 | 0) % 2) F.draw(hud, dlg.i < dlg.lines.length - 1 ? '↓' : '*', x + w - 14, y + h - 12, '#ffd23a', 1);
      }
      function drawPause() {
        hud.fillStyle = 'rgba(0,0,30,.62)'; hud.fillRect(0, 0, W, H);
        bigText('PAUSE', W / 2, 22, 20);
        F.center(hud, WN[curW] + '   ' + nAcW(curW) + '/' + (curW === 'hub' ? 8 : curW === 'boss' ? 1 : 6), W / 2, 40, '#bcd8ff', 1, true);
        ACS.forEach((a, i) => { const g = gotAc(a.id); acIcon(28, 58 + i * 12, 8, g ? '#ffc81a' : '#556'); F.draw(hud, a.name, 38, 55 + i * 12, g ? '#ffd23a' : '#cfd6e8', 1, true); });
        const it = pauseItems(), y0 = 162; box2(W / 2 - 70, y0 - 6, 140, it.length * 13 + 8, 0.85);
        it.forEach((s, i) => F.center(hud, (i === pauseI ? '→ ' : '') + s, W / 2, y0 + i * 13, i === pauseI ? '#fff' : '#9ab', 1));
        F.center(hud, 'TOTAL ' + nAc() + '/' + TOTAL + '   LIVES ' + prog.lives + '   SCORE ' + Math.min(prog.score, 20000), W / 2, H - 12, '#ffd23a', 1, true);
      }
      function drawTitle() {
        logo(52);
        if (sub === 'howto') return drawHowto();
        if (sub === 'options') { box2(30, 100, W - 60, 92, 0.85); F.center(hud, 'OPTIONS', W / 2, 108, '#ffd23a', 1); optItems().forEach(([a, b], i) => { F.draw(hud, (i === subI ? '→ ' : '  ') + a, 44, 126 + i * 14, i === subI ? '#fff' : '#9ab', 1); if (b) F.draw(hud, b, W - 66, 126 + i * 14, b === 'ON' ? '#7aff7a' : '#ff8a8a', 1); }); return; }
        if (sub === 'scores') { box2(40, 98, W - 80, 128, 0.85); F.center(hud, 'BOUNCE LEGENDS', W / 2, 106, '#ffd23a', 1); table().forEach((r, i) => { const me = !r.mate; F.draw(hud, (i + 1) + '. ' + r.n, 54, 122 + i * 12, me ? '#7aff7a' : '#fff', 1); F.draw(hud, String(r.s).padStart(5, ' '), W - 120, 122 + i * 12, '#ffd23a', 1); acIcon(W - 76, 125 + i * 12, 7); F.draw(hud, String(r.a), W - 68, 122 + i * 12, '#fff', 1); }); return; }
        if (sub === 'erase') { box2(40, 120, W - 80, 64, 0.9); F.center(hud, 'START AGAIN? YOUR ' + nAc() + ' ACORNS', W / 2, 130, '#fff', 1); F.center(hud, 'WILL BE LOST!', W / 2, 141, '#ff8a8a', 1); ['NO, KEEP THEM', 'YES, START AGAIN'].forEach((s, i) => F.center(hud, (i === subI ? '→ ' : '') + s, W / 2, 156 + i * 12, i === subI ? '#fff' : '#9ab', 1)); return; }
        if (!started) { if ((K.t * 2 | 0) % 2) F.center(hud, 'PRESS START', W / 2, 150, '#fff', 2, '#3a1a00'); if (msgT > 0) F.center(hud, msg, W / 2, 178, '#7aff7a', 1, true); F.center(hud, '(C) 1999 BISCUIT SOFT', W / 2, 212, '#e8f0ff', 1, true); F.center(hud, 'LICENSED BY ULTRA ENTERTAINMENT', W / 2, 224, '#bcd', 1, true); return; }
        const items = menuItems();
        items.forEach((it, i) => F.center(hud, (i === menuI ? '→ ' : '') + it + (i === menuI ? ' ←' : ''), W / 2, 132 + i * 13, i === menuI ? '#fff' : '#cde', 1, true));
        if (prog.started) { acIcon(W / 2 - 22, 210, 9); F.draw(hud, nAc() + ' / ' + TOTAL, W / 2 - 14, 207, '#ffd23a', 1, true); }
        F.center(hud, '(C) 1999 BISCUIT SOFT', W / 2, 226, '#e8f0ff', 1, true);
      }
      function drawHowto() {
        box2(10, 96, W - 20, 138, 0.88);
        const pg = subI === 0 ? [['THE MOVES', '#ffd23a'], ['RUN: STICK.   JUMP: ' + L('a')], ['LAND AND PRESS ' + L('a') + ' AGAIN: DOUBLE, THEN TRIPLE JUMP'], [L('a') + ' IN THE AIR: TWIRL (A LITTLE EXTRA LIFT)'], ['LONG JUMP: RUN, HOLD ' + L('c') + ', PRESS ' + L('a')], ['BACKFLIP: STAND STILL, HOLD ' + L('c') + ', PRESS ' + L('a')], ['GROUND POUND: ' + L('c') + ' IN THE AIR'], ['WALL KICK: JUMP AT A WALL, ' + L('a') + ' AS YOU TOUCH'], ['PUNCH, PUNCH, KICK: ' + L('b') + '.  TALK / READ: ' + L('b')], ['CAMERA: ' + L('l') + ' / ' + L('r') + '.   PAUSE: START']]
          : [['THE GOAL', '#ffd23a'], ['KING GRUMPUS HAS HIDDEN 33 GOLDEN ACORNS.'], ['8 ARE ON BISCUIT ISLAND. THE MAGIC DOORS'], ['IN ACORN PLAZA LEAD TO FOUR WORLDS WITH 6'], ['EACH, THEN TO THE KING HIMSELF.'], ['COINS MEND YOUR BISCUIT (YOUR HEALTH).'], ['8 RED COINS OR 100 COINS = AN ACORN TOO.'], ['TALK TO EVERYONE: THEY GIVE GOOD HINTS.'], ['KEYS: Z=' + L('a') + '  X=' + L('b') + '  C=' + L('c') + '  Q/E=' + L('l') + '/' + L('r')], ['ENTER=START. IT SAVES AS YOU GO.']];
        pg.forEach(([s, c], i) => (i === 0 ? F.center(hud, s, W / 2, 102, c, 1) : F.draw(hud, s, 18, 106 + i * 12, '#fff', 1)));
        F.center(hud, (subI + 1) + '/2  PRESS ' + L('a'), W / 2, H - 14, '#9ab', 1);
      }
      function drawCard() {
        const w = card.w, cols = { hub: ['#2a7ad8', '#5ab83a'], cove: ['#2a9ad8', '#f0d090'], peaks: ['#6a9ad8', '#f0f6ff'], manor: ['#1a1040', '#5a3a8a'], tower: ['#e86a5a', '#ffc87a'], boss: ['#3a0a08', '#c8481a'] }[w];
        const gr = hud.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); hud.fillStyle = gr; hud.fillRect(0, 0, W, H);
        hud.strokeStyle = '#c8a050'; hud.lineWidth = 6; hud.strokeRect(6, 6, W - 12, H - 12); hud.strokeStyle = '#7a5a1a'; hud.lineWidth = 2; hud.strokeRect(10, 10, W - 20, H - 20);
        const nm = WN[w]; bigText(nm, W / 2, 38, nm.length > 16 ? 17 : 22);
        const list = ACS; list.forEach((a, i) => { const g = gotAc(a.id); acIcon(48, 74 + i * 15, 10, g ? '#ffc81a' : 'rgba(255,255,255,.35)'); F.draw(hud, (i + 1) + '. ' + a.name, 60, 70 + i * 15, g ? '#ffe86a' : '#fff', 1, '#000'); });
        if (card.t > 0.6 && (K.t * 2 | 0) % 2) F.center(hud, 'PRESS ' + L('a'), W / 2, H - 26, '#fff', 1, '#000');
        F.center(hud, 'ACORNS ' + nAc() + ' / ' + TOTAL, W / 2, H - 40, '#ffd23a', 1, '#000');
      }
      function drawEnding() {
        if (endT < 7) { hud.fillStyle = `rgba(0,0,0,${Math.max(0, 0.5 - endT * 0.05)})`; hud.fillRect(0, 0, W, H); bigText('HOORAY!', W / 2, 40, 28); ['KING GRUMPUS HAS GIVEN BACK THE ACORNS', '(ALL RIGHT, YOU TOOK THEM). BISCUIT ISLAND', 'IS SAVED, AND IT IS TEA TIME.'].forEach((s, i) => F.center(hud, s, W / 2, 70 + i * 11, '#fff', 1, true)); return; }
        const y0 = H + 10 - (endT - 7) * 22; CREDITS.forEach((s, i) => { const y = y0 + i * 16; if (y > -10 && y < H + 10) F.center(hud, s, W / 2, y, i === 0 || CREDITS[i - 1] === '' ? '#ffd23a' : '#fff', i === 0 ? 2 : 1, true); });
        if (endT > 4) F.center(hud, 'START: SKIP', W - 40, H - 10, 'rgba(255,255,255,.6)', 1);
      }
      function irisDraw() {
        if (!fading) return;
        const k = fading.t < fading.dur ? 1 - fading.t / fading.dur : (fading.t - fading.dur) / fading.dur, r = Math.max(0, k) * 220;
        const [sx, sy] = mode === 'title' ? [W / 2, H / 2] : proj(P.x, P.y + 0.8, P.z);
        hud.save(); hud.fillStyle = '#000'; hud.beginPath(); hud.rect(0, 0, W, H); for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? r * 0.5 : r; i ? hud.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr) : hud.moveTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } hud.closePath(); hud.fill('evenodd'); hud.restore();
      }

      // ================================================================ draw
      function draw() {
        const t = K.t;
        coinsDraw(t);
        floorAt(P.x, P.z, P.y + 0.1); if (BOP.root.visible && FL.h > -100) shadow(P.x, FL.h, P.z, Math.max(0.25, 0.55 - (P.y - FL.h) * 0.03));
        for (const e of ENS) if (e.alive && e.mesh && e.mesh.visible && Math.hypot(e.x - P.x, e.z - P.z) < 40) { const h = e.kind === 'boohoo' ? WD.ground(e.x, e.z) : e.y; shadow(e.x, h, e.z, e.kind === 'boohoo' ? 0.6 : 0.75); }
        for (const n of NPCS) if (n.kind !== 'sign' && Math.hypot(n.x - P.x, n.z - P.z) < 30) shadow(n.x, n.ghost ? WD.ground(n.x, n.z) : n.y, n.z, 0.8);
        if (curW === 'boss' && BOSS.mesh && BOSS.mesh.visible) shadow(BOSS.x, 2, BOSS.z, 2.0);
        if (curW === 'manor' && BB.mesh && BB.mesh.visible) shadow(BB.x, WD.ground(BB.x, BB.z), BB.z, 1.6);
        shadowsEnd();
        T3.render(); drawHud();
      }

      // ---- off we go: the title screen over Biscuit Island
      buildWorld('hub'); spawnInWorld('hub'); camSnap(); music('title');
      let VW = null;
      function view(kind, ang, dist, h, look, s, st, stT, run) {
        if (VW && VW.m !== BOP.root) WG.remove(VW.m);
        const x = P.x, y = P.y, z = P.z; let m;
        if (kind === 'bopper') { m = BOP.root; P.st = st || 'idle'; P.stT = stT || 0; P.run = run || 0; P.vx = st === 'run' ? -7 : 0; P.vz = 0; P.vy = st && st.startsWith('jump') ? 3 : 0; P.gnd = !st || st === 'idle' || st === 'run' || st === 'punch' || st === 'crouch'; P.inv = 0; }
        else { m = new T.Mesh(model(kind), ['boohoo', 'bigboo', 'hubert'].includes(kind) ? ghostMat : kind === 'acorn' ? matAcorn : matV()); m.position.set(x, y, z); m.scale.setScalar(s || 1); WG.add(m); BOP.root.visible = false; }
        if (coinMesh_) coinMesh_.visible = redMesh_.visible = false;
        VW = { m, ang: ang || 0, dist: dist || 4, h: h == null ? 1.2 : h, look: look == null ? 0.7 : look, x, y, z }; mode = 'view';
      }
      window.__hopDbg = { view, P, prog, get mode() { return mode; }, get world() { return curW; }, ACS: () => ACS, ENS: () => ENS, BOSS, BB, PERCY, WORLDS, go(w) { buildWorld(w); spawnInWorld(w); mode = 'play'; music(WORLDS[w].song); }, tp(x, y, z) { respawnAt(x, y, z, P.face); }, air(x, y, z) { Object.assign(P, { x, y, z, vx: 0, vy: 0, vz: 0, gnd: false, st: 'fall', stT: 0 }); }, give(n) { for (let i = 0; i < n; i++) prog.ac['x' + (i / 6 | 0)] = Object.assign(prog.ac['x' + (i / 6 | 0)] || {}, { ['a' + i]: 1 }); }, reveal, visit, get paused() { return paused; } };
      return { update, draw, end() { if (mode === 'play' || mode === 'dlg' || mode === 'win') saveNow(); } };
    },
  });
})();

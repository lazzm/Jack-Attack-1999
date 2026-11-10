/* BOUNCE QUEST 64 (N64, in Jack's room): a proper 3D collect-a-thon. King Grumpus has pinched the golden acorns of
 * Biscuit Island and hidden them all over the place. Bopper hops round the island (9 acorns) and through the magic
 * doors in Acorn Plaza into eight worlds (Custard Cove, Frosty Flapjack Peaks, Ghoulish Ginger Manor, Tick-Tock Tower, Custard Grotto, Treacle Troubleworks, Sherbet Sandstorm, Marmalade Treetops),
 * six to eight named acorns in each, three outfit stages, three more in the enclosed Cocoa Coaster, then King Grumpus in the Biscuit Barrel for the Crown Acorn. 72 in all.
 * Moves: jump, land-and-jump-again for a double then triple jump, a twirl in the air, long jump (run, hold Z, press A),
 * side flip (reverse and jump while running), backflip (stand still, hold Z, press A), ground pound (Z in the air), wall kick (jump at a wall, press A as you touch
 * it), punch-punch-kick (B), jump kick (B in the air). Camera: L / R turn it round (like the yellow C buttons).
 * Health is a biscuit that loses a bite when you're hit; coins put bites back. Talk to people and read signs with B.
 * Progress (acorns, lives, options, the high-score table) is saved as you go: CONTINUE on the title carries on.
 * Low-resolution, foggy and Gouraud-shaded, like it should be. Original everything: characters, worlds, tunes. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const GID = 'n64.hop';
  const SECRETS = [
    ['rm.hop.king', 'Crumbs!', 'Somebody very grumpy is waiting behind the crowned door in Bounce Quest 64.'],
    ['rm.hop.every', 'Every Last Acorn', 'There are sixty-six golden acorns in Bounce Quest 64. Find the lot.'],
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
    coaster:{bpm:156,wave:'triangle',vol:.075,bassWave:'square',lead:[79,83,86,83,79,0,76,79,81,84,88,84,81,0,79,76,74,78,81,78,74,0,71,74,76,79,83,86,84,81,79,0,79,0,86,0,88,86,83,79,81,0,88,0,89,88,84,81,78,81,86,81,78,74,71,74,76,79,83,79,76,-1,0,0],bass:[48,0,55,0,52,0,55,0,53,0,60,0,57,0,60,0,50,0,57,0,54,0,57,0,48,0,55,0,52,55,59,55],drums:'o.x.o.x.o.xxo.x.'},
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
    grotto: { bpm: 88, wave: 'sine', vol: .085, bassWave: 'triangle',
      lead: [74,-1,0,81,-1,0,78,-1,76,-1,0,73,-1,0,69,-1,71,-1,0,78,-1,0,76,-1,74,-1,0,69,71,-1,73,-1,74,-1,0,81,-1,0,85,-1,83,-1,81,-1,78,-1,76,-1,74,-1,73,-1,71,-1,69,-1,74,-1,-1,-1,0,0,0,0],
      bass: [38,0,0,0,45,0,0,0,42,0,0,0,45,0,0,0,43,0,0,0,50,0,0,0,45,0,0,0,49,0,0,0], drums:'........x.......' },
    canopy:{bpm:132,wave:'triangle',vol:.075,bassWave:'triangle',lead:[72,0,76,79,81,79,76,74,72,-1,67,0,69,72,74,76,79,0,83,81,79,76,74,72,71,-1,74,76,79,74,71,67,69,0,72,76,77,76,72,69,67,-1,71,74,76,74,71,67,72,76,79,84,83,79,76,74,72,-1,0,67,69,71,72,0],bass:[48,0,55,0,52,0,55,0,43,0,50,0,47,0,50,0,45,0,52,0,48,0,52,0,43,0,50,0,47,0,55,0],drums:'x...o.x.x...o.x.'},
    canopyBoss:{bpm:144,wave:'square',vol:.055,bassWave:'triangle',lead:[60,0,63,67,66,63,60,-1,62,0,65,69,68,65,62,-1,63,0,67,70,69,67,63,0,62,65,69,68,65,62,60,-1],bass:[36,0,43,0,39,0,43,0,38,0,45,0,41,0,45,0],drums:'ox..x.o.ox..x.x.'},
    sands:{bpm:118,wave:'triangle',vol:.075,bassWave:'triangle',lead:[69,0,70,73,76,0,73,70,69,-1,0,76,77,76,73,0,67,0,69,70,73,0,70,69,67,-1,0,73,74,73,70,0,65,0,69,72,76,0,74,72,69,0,70,73,76,77,76,73,70,0,69,67,65,0,67,69,70,73,70,69,65,-1,0,0],bass:[45,0,52,0,48,0,52,0,43,0,50,0,47,0,50,0,41,0,48,0,45,0,48,0,40,0,47,0,44,0,47,0],drums:'o..xx...o.x...x.'},
    foundry:{bpm:126,wave:'triangle',vol:.07,bassWave:'square',lead:[67,0,70,72,0,75,74,0,72,70,67,0,65,0,67,0,63,0,67,70,0,74,72,0,70,67,65,0,63,-1,0,0,67,70,72,75,0,79,77,75,74,0,72,70,67,0,65,0,63,65,67,70,72,0,70,67,65,0,63,62,60,-1,0,0],bass:[36,0,43,0,39,0,43,0,41,0,48,0,43,0,46,0],drums:'o...x.o.o...x.x.'},
    foundryBoss:{bpm:148,wave:'square',vol:.04,bassWave:'triangle',lead:[60,0,63,0,67,66,63,0,58,0,62,0,65,64,62,0,60,0,67,0,70,69,67,0,63,0,62,58,60,-1,0,0],bass:[36,0,36,43,0,36,0,43,34,0,34,41,0,34,0,41],drums:'o.x.o...o.x.x...'},
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
      const T3 = K.three({ fov: 60, near: 0.15, far: 420, fogCol: 0xa8d4f8, fogNear: 50, fogFar: 170 }), T = T3.T, hud = K.hud, W = K.W, H = K.H;
      // Cartridge-local pixel ink: an opaque one-pixel keyline survives every scenery colour.
      const F = { width: K.font.width, draw(g, s, x, y, c, k) { k = k || 1; for (const [dx, dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]) K.font.draw(g, s, x + dx, y + dy, '#10101c', k); K.font.draw(g, s, x, y, c, k); }, center(g, s, x, y, c, k) { F.draw(g, s, x - F.width(s, k) / 2 + (k || 1) / 2, y, c, k); } };
      const LT = T3.lights({ amb: 0.8, sun: 0.75, dir: [0.4, 1, 0.3], skyCol: 0xf0f8ff, groundCol: 0x5a7a4a });
      let rnd = K.rnd(64), randomCount = 0;
      const V3 = (x, y, z) => new T.Vector3(x, y, z);
      const tv = new T.Vector3(), tv2 = new T.Vector3();
      const L = b => K.keyLabel ? K.keyLabel(b) : K.label(b);

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
        out.computeBoundingSphere(); out.computeBoundingBox();
        return out;
      }
      const MC = {}; // materials, made once
      const mat = (key, p) => MC[key] || (MC[key] = T3.mat(p));
      const matV = () => mat('v', { vcol: true });
      const matVB = () => mat('vb', { vcol: true, lit: false });

      // ---------------------------------------------------------------- textures (small, filtered texels; no screen-space blur)
      const TX = {};
      const tex = (key, w, h, paint) => TX[key] || (TX[key] = T3.tex(w, h, (g, width, height) => {
        // Texture cache warmth must never change trees, obstacles or patrol randomness.
        const worldRandom = rnd; let seed = 0x1999;
        for (let i = 0; i < key.length; i++) seed = (Math.imul(seed, 31) ^ key.charCodeAt(i)) >>> 0;
        rnd = K.rnd(seed);
        try { paint(g, width, height); } finally { rnd = worldRandom; }
      }));
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
        shadow: () => tex('shadow', 32, 32, g => { const gr = g.createRadialGradient(16, 16, 2, 16, 16, 15); gr.addColorStop(0, 'rgba(0,0,0,.72)'); gr.addColorStop(0.7, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }),
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
          const P = [['#2a9ad8', '#ffe08a'], ['#a8d0f0', '#ffffff'], ['#3a2a5a', '#c8a0ff'], ['#e88a3a', '#ffe0a0'], ['#5a0a0a', '#ffb02a'], ['#246c89', '#8bdad5'], ['#af7274','#8de0d0'],['#dcaa77','#8ce5db'],['#678c65','#efcb88']][k];
          const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, P[0]); gr.addColorStop(1, '#101020'); g.fillStyle = gr; g.fillRect(0, 0, 64, 96);
          g.save(); g.translate(32, 44);
          if (k === 0) { g.fillStyle = '#ffe08a'; g.beginPath(); g.ellipse(0, 26, 30, 10, 0, 0, 7); g.fill(); g.fillStyle = '#f08ab0'; g.beginPath(); for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI; g.lineTo(Math.cos(a) * 16, Math.sin(a) * 16 + 4); } g.fill(); g.strokeStyle = '#a04a70'; g.lineWidth = 1.5; for (let i = 1; i < 8; i++) { const a = Math.PI + i / 8 * Math.PI; g.beginPath(); g.moveTo(0, 4); g.lineTo(Math.cos(a) * 16, Math.sin(a) * 16 + 4); g.stroke(); } }
          else if (k === 1) { g.strokeStyle = '#fff'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -20); g.moveTo(0, -12); g.lineTo(-6, -17); g.moveTo(0, -12); g.lineTo(6, -17); g.stroke(); } }
          else if (k === 2) { g.fillStyle = '#f0f0ff'; g.beginPath(); g.arc(0, -4, 15, Math.PI, 0); g.lineTo(15, 16); for (let i = 0; i < 5; i++) g.lineTo(15 - (i + 0.5) * 6, i % 2 ? 16 : 11); g.lineTo(-15, 16); g.fill(); g.fillStyle = '#201030'; g.beginPath(); g.arc(-5, -4, 3, 0, 7); g.arc(5, -4, 3, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, 5, 3, 4, 0, 0, 7); g.fill(); }
          else if (k === 3) { g.fillStyle = '#fff8e0'; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -14); g.moveTo(0, 0); g.lineTo(10, 4); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.stroke(); }
          else if(k===8){g.fillStyle='#8c603c';g.fillRect(-4,-5,8,33);g.fillStyle='#91bc68';for(const [x,y]of [[-12,-9],[12,-9],[0,-23]]){g.beginPath();g.arc(x,y,12,0,7);g.fill();}g.strokeStyle='#ffe0a1';g.lineWidth=3;g.beginPath();g.moveTo(-26,9);g.lineTo(26,9);g.stroke();}else if(k===7){g.fillStyle='#f6d291';g.beginPath();g.moveTo(-25,22);g.lineTo(0,-23);g.lineTo(25,22);g.closePath();g.fill();g.strokeStyle='#99536a';g.lineWidth=3;for(let y=-5;y<23;y+=8){g.beginPath();g.moveTo(-10-y*.5,y);g.lineTo(10+y*.5,y);g.stroke();}g.fillStyle='#83dcd3';g.beginPath();g.arc(15,-17,7,0,7);g.fill();}else if(k===6){g.fillStyle='#ddab70';g.beginPath();g.ellipse(0,4,18,15,0,0,7);g.fill();g.fillStyle='#9be5da';g.fillRect(-20,-14,40,5);g.strokeStyle='#f6e6ba';g.lineWidth=4;g.beginPath();g.arc(21,2,9,-1.5,1.5);g.stroke();g.fillStyle='#302d45';g.fillRect(-8,-1,4,5);g.fillRect(5,-1,4,5);}
          else if (k === 5) { g.strokeStyle = '#b6fff2'; g.lineWidth = 3; for (const [x,y,r] of [[-12,17,9],[9,-2,13],[-8,-25,6]]) { g.beginPath(); g.arc(x,y,r,0,7); g.stroke(); } g.fillStyle='#f0d79a'; g.fillRect(-28,28,56,6); }
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
      function shadow(x, y, z, r, terrainContact) { if (shN >= 24) return; pdum.position.set(x, y + 0.055, z); pdum.rotation.set(0, 0, 0); if (terrainContact) { const e = 0.22, g = WD.ground; pdum.rotation.z = Math.atan((g(x + e, z) - g(x - e, z)) / (2 * e)); pdum.rotation.x = -Math.atan((g(x, z + e) - g(x, z - e)) / (2 * e)); } pdum.scale.set(r * 2, 1, r * 2); pdum.updateMatrix(); shMesh.setMatrixAt(shN++, pdum.matrix); }
      function shadowsEnd() { for (let i = shN; i < 24; i++) shMesh.setMatrixAt(i, pz); shMesh.instanceMatrix.needsUpdate = true; shN = 0; }

      // ---------------------------------------------------------------- BOPPER (a round little hero: cap, rucksack, big boots)
      const BOP = (function () {
        const root = new T.Group(), m = new T.Group(), heroMat = T3.mat({ vcol: true }); root.add(m); T3.add(root);
        const OR = 0xff9a32, CR = 0xffe2b0, BL = 0x2a5ae0, WH = 0xffffff, BR = 0x7a3a12, RD = 0xe8261c, BK = 0x141018, YE = 0xffd23a;
        const mesh = (P, parent) => { const me = new T.Mesh(T3.keep(merge(P)), heroMat); (parent || m).add(me); return me; };
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
        return { root, m, hips, torso, head, eyes, heroMat, armL: arm(1), armR: arm(-1), legL: leg(1), legR: leg(-1), blink: 2 };
      })();

      // ================================================================ the world kit
      // solids: boxes (oriented: ry) and round towers. y is the bottom when you make one; stored as a centre + half sizes.
      let WG = null, BK = null, WD = null; // the current world's group, its geometry buckets, its definition
      const BOXES = [], CYLS = [], MOVERS = [], CAM_MESHES = [];
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
          flush(into) { for (const k in B) { if (!B[k].length) continue; const spec = BUCKET[k]; const me = new T.Mesh(merge(B[k], spec.uv), spec.mat()); (into || WG).add(me); CAM_MESHES.push(me); } },
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
        const mesh = new T.Mesh(merge(P, spec.uv), spec.mat()); WG.add(mesh); CAM_MESHES.push(mesh);
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
      const coinGeo = T3.keep(merge([
        pt(S.cyl(12),0x999999,0,0,0,.84,.12,.84,Math.PI/2),
        ...[-1,1].flatMap(side=>[pt(new T.RingGeometry(.31,.405,12),0xffffff,0,0,side*.067,1,1,1,side<0?Math.PI:0),pt(S.cyl(4),0xe8e8e8,0,0,side*.079,.29,.025,.36,Math.PI/2,0,Math.PI/4)])
      ]));
      coinGeo.userData.persist=true;
      const libraryClothGeo=T3.keep(new T.BoxGeometry(1,1,1));libraryClothGeo.userData.persist=true;
      const coinSparkGeo=T3.keep(merge([pt(S.box(),0xffffff,0,0,0,.26,.045,.035),pt(S.box(),0xffffff,0,0,0,.045,.26,.035)]));
      coinSparkGeo.userData.persist=true;
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
      let signAtlas = null, signCanvas = null, signInk = null;
      const signCells = new Map();
      function letterSign(n) {
        if (!signAtlas) { signAtlas = T3.tex(512, 1024, g => { signCanvas = g.canvas; }); signAtlas.magFilter = T.NearestFilter; signInk = T3.mat({ map: signAtlas, lit: false }); }
        const label = n.lines[0].split(/[.:]/)[0], key = label.toUpperCase();
        if (!signCells.has(key)) {
          const slot = signCells.size; signCells.set(key, slot); const g = signCanvas.getContext('2d'), x = slot % 4 * 128, y = (slot / 4 | 0) * 64;
          g.fillStyle = '#392819'; g.fillRect(x, y, 128, 64); g.strokeStyle = '#ba8d52'; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, 124, 60);
          const bold = wrap(key,10), large = bold.length <= 2 && bold.every(s=>K.font.width(s,2)<=120), lines = large ? bold : wrap(key,19); lines.forEach((s,i)=>K.font.center(g,s,x+64,y+8+i*(large?20:10),'#ffe0a0',large?2:1));
          K.font.center(g, n.expressMarker?'HOP THE GAP':'READ SIGN', x + 64, y + 52, '#e8bf79', 1); signAtlas.needsUpdate = true;
        }
        const slot = signCells.get(key), u = slot % 4 / 4, v = 1 - ((slot / 4 | 0) + 1) / 16;
        for (const side of [-1, 1]) { const geo = new T.PlaneGeometry(1.54, 0.84), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, u + uv.getX(i) / 4, v + uv.getY(i) / 16); const face = new T.Mesh(geo, signInk); face.position.set(0, 1.25, side * 0.081); face.rotation.y = side < 0 ? Math.PI : 0; n.mesh.add(face); }
      }
      const life = (x, y, z) => LIFE.push({ x, y, z, got: false });
      function enemy(kind, x, z, o) { const e = Object.assign({ kind, x, z, hx: x, hz: z, y: 0, a: o && o.a != null ? o.a : rnd() * TAU, t: o && o.t != null ? o.t : rnd() * 3, alive: true, dead: 0, hp: 1, r: 0.7, h: 1.3, range: 6 }, o || {}); e.y = e.y0 != null ? e.y0 : floorAt(x, z, 999); ENS.push(e); return e; }

      // ================================================================ the cast: merged models, made once
      const MOD = {};
      function model(kind) {
        if (MOD[kind]) return MOD[kind];
        if (kind === 'acorn') return acornGeo;
        const W_ = 0xffffff, BK = 0x141018;
        const eyes = (x, y, z, s, look) => [pt(S.ball(10), W_, x, y, z, s, s * 1.3, s * 0.6), pt(S.ball(10), W_, -x, y, z, s, s * 1.3, s * 0.6), pt(S.ball(8), BK, x + (look || 0), y - s * 0.05, z - s * 0.3, s * 0.45, s * 0.65, s * 0.3), pt(S.ball(8), BK, -x + (look || 0), y - s * 0.05, z - s * 0.3, s * 0.45, s * 0.65, s * 0.3)];
        let P;
        if(kind==='budbug'){P=[pt(S.ball(10),0x749d55,0,.5,0,1.2,.8,1.45),pt(S.ball(8),0xd7b46a,0,.55,-.65,.75,.6,.6),...eyes(.16,.7,-.9,.15),pt(S.box(),0x456e55,0,.84,.1,.08,.08,1),...[-1,1].flatMap(q=>[pt(S.ball(8),0x9bc56b,q*.34,.73,.1,.7,.3,1.1,0,0,q*.25),...[-.3,.3].map(z=>pt(S.cyl(5),0x6f6344,q*.55,.22,z,.12,.6,.12,0,0,q*.7))])];}else if(kind==='branchboss'){P=[pt(S.ball(14),0xc38b4d,0,1,0,1.8,1.9,1.6),pt(S.hemi(14),0x7f5f41,0,1.75,0,2,.8,1.8),pt(S.cyl(8),0x88a866,0,2.2,0,.24,.65,.24,0,0,.3),...eyes(.3,1.4,-.75,.25),pt(S.box(),0x493e37,0,.95,-.81,.5,.06,.04),pt(S.cone(4),0xb54f55,0,.65,-.8,.34,.65,.12,0,0,Math.PI),...[-1,1].flatMap(q=>[pt(S.ball(8),0x6b6551,q*.47,.16,-.08,.7,.34,.8),pt(S.cyl(8),0x8e7249,q*.91,1,0,.22,1,.22,0,0,q*.4),pt(S.ball(8),0xe6d3a1,q*1.1,.65,0,.5,.5,.5)]),pt(S.box(),0xffe1a4,1.1,.75,-.28,.55,.5,.08,0,0,.2)];}else if(kind==='postmaster'||kind==='gardener'){P=[pt(S.ball(12),0x6a9e9f,0,.85,0,1,1.1,.8,0,0,0,.3),pt(S.hemi(14),0x7d9e67,0,.95,.3,1.15,.7,1.2,Math.PI/2),pt(S.cyl(14),0xd0bc82,0,.95,.3,1.17,.08,1.22,Math.PI/2),pt(S.ball(10),0xb4cc86,0,1.6,-.12,.75,.7,.7),...eyes(.18,1.7,-.44,.18),pt(S.ball(8),0xa8c47b,0,1.46,-.48,.45,.26,.32),pt(S.cyl(12),0x547b8d,0,2,-.12,.9,.24,.8),pt(S.box(),0xf2d8a1,0,1.94,-.45,.85,.06,.46),pt(S.box(),0xf4d08d,0,2.02,-.51,.14,.13,.025),...[-1,1].flatMap(q=>[pt(S.ball(8),0x6a9e9f,q*.56,1,-.05,.22,.6,.27),pt(S.ball(8),0xa8c47b,q*.56,.75,-.05,.24,.25,.25),pt(S.ball(8),0x6d5367,q*.23,.13,-.12,.4,.26,.6)]),pt(S.box(),0xc28c68,.55,.65,.03,.45,.6,.35),pt(S.box(),0xffe1a3,.55,.7,-.16,.25,.22,.035),pt(S.box(),0x87616d,.08,1,-.4,.09,1,.05,0,0,.6)];if(kind==='gardener')P.push(pt(S.box(),0xdbc08c,0,.76,-.43,.6,.8,.04),pt(S.cyl(12),0xddc588,0,1.95,-.12,1.35,.07,1.2),pt(S.ball(6),0xe2a387,.4,2.13,-.22,.25,.25,.15));}else if(kind==='scarab'){P=[pt(S.ball(12),0x4e9e9b,0,.52,0,1.55,.85,1.8,0,0,0,.3),pt(S.box(),0xf5d083,0,.88,0,.06,.12,1.3),pt(S.ball(10),0xa45d78,0,.5,-.8,.85,.6,.65),...eyes(.18,.65,-1.05,.18),...[-1,1].flatMap(q=>[-.5,0,.5].map(z=>pt(S.cyl(5),0x73526c,q*.7,.3,z,.12,.9,.12,0,0,q*.9)))];}else if(kind==='kettle'||kind==='foreman'){P=[pt(S.ball(12),0xbc8759,0,.8,0,1.5,1.2,1.35,0,0,0,.3),pt(S.cyl(12),0x685674,0,1.34,0,1.3,.12,1.2),...(kind==='kettle'?[pt(S.hemi(12),0xd8bb79,0,1.39,0,1.18,.36,1.1),pt(S.ball(8),0x765575,0,1.65,0,.25,.2,.25)]:[]),pt(S.tor(.1,12),0x705368,.76,.9,.05,.9,.9,.9,0,Math.PI/2),pt(S.cyl(8,.7),0xd7b16e,-.75,1,-.05,.34,.85,.34,0,0,-.9),...eyes(.24,1,-.61,.22),pt(S.box(),0x463049,0,.63,-.66,.3,.05,.04),...[-1,1].map(q=>pt(S.ball(8),0x486f78,q*.38,.17,-.07,.48,.32,.65))];
        } else if (kind === 'pearl') { P=[pt(S.ball(14),0xcef7ee,0,0,0,.8,.8,.8,0,0,0,.2),pt(S.ball(8),0xffffff,-.16,.18,-.3,.2,.2,.12)];
        } else if (kind === 'jelly') { P=[pt(S.hemi(12),0x9b9ee0,0,1,0,1.4,.9,1.4),pt(S.cyl(12),0x5c6fa8,0,.96,0,1.4,.12,1.4),...eyes(.2,1.15,-.5,.2),...[0,1,2,3,4,5].map(i=>pt(S.cyl(5),0x8ac6ca,Math.sin(i)*.42,.5,Math.cos(i)*.42,.12,.95,.12,0,0,Math.sin(i)*.2))];
        } else if (kind === 'grumpy' || kind === 'king') {
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
          P = [pt(S.cyl(6), 0x7a4a22, 0, 0.6, 0, 0.18, 1.2, 0.18), pt(S.box(), 0xc8945a, 0, 1.25, 0, 1.6, 0.9, 0.14), pt(S.box(), 0x7a4a22, 0, 1.25, 0, 1.68, 0.98, 0.1)];
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
      const WN = { canopy:'MARMALADE TREETOPS',sands:'SHERBET SANDSTORM',foundry:'TREACLE TROUBLEWORKS', snowhall:'THE COCOA COASTER', hub: 'BISCUIT ISLAND', cove: 'CUSTARD COVE', peaks: 'FROSTY FLAPJACK PEAKS', manor: 'GHOULISH GINGER MANOR', tower: 'TICK-TOCK TOWER', boss: 'THE BISCUIT BARREL', grotto: 'CUSTARD GROTTO' };
      const ORDER = ['cove', 'peaks', 'manor', 'tower', 'boss', 'grotto', 'foundry', 'sands', 'canopy'];
      const NEED = { cove: 0, peaks: 3, manor: 7, tower: 12, boss: 18, grotto: 5, foundry:15, sands:21, canopy:24 };
      // ---- Biscuit Island (the hub)
      const PLX = -4, PLZ = 8;
      function hubG0(x, z) { const r = Math.hypot(x, z * 1.08); return -4 + sstep(46, 31, r) * 5.6 + 9.5 * ex(x, z, -14, -12, 120) + 2.6 * ex(x, z, 6, 18, 40) - 3.4 * ex(x, z, 11, 4, 26) + 0.4 * Math.sin(x * 0.3) * Math.cos(z * 0.27) * sstep(40, 25, r); }
      const PH = hubG0(PLX, PLZ);
      const LX = 18, LZ = -16, LB = hubG0(LX, LZ) - 0.5, LTOP = LB + 17, WX = -21, WZ = 16, WB = hubG0(WX, WZ) - 0.5, TRX = -3, TRZ = 24, TB = hubG0(TRX, TRZ) - 0.3, PDX = 11, PDZ = 4, PRZ = -6;
      const WORLDS = {};
      function hubDoor(w,i){
            const a = Math.PI + (i - 2) * 0.5 + (i>=7?.5:0), x = PLX + Math.sin(a) * 9, z = PLZ + Math.cos(a) * 9, ry = a + Math.PI, fx = -Math.sin(a), fz = -Math.cos(a);
            const rx = Math.cos(ry), rz = -Math.sin(ry); // the door's local x axis
            for (const s of [-1, 1]) box(x + rx * s * 1.75, PH, z + rz * s * 1.75, 0.9, 4.4, 1.1, { ry, t: 'brick', c: 0xf0e8ff, props: { nocam: 1 } });
            box(x, PH + 4.4, z, 4.4, 0.9, 1.2, { ry, t: 'brick', c: 0xf0e8ff });
            deco(ptM(S.cyl(3), 0xd8c8f0, M(x, PH + 5.4, z, 0, ry + Math.PI / 2, Math.PI / 2, 1.2, 4.6, 1.2)), 'v');
            box(x - fx * 0.15, PH, z - fz * 0.15, 2.6, 4.4, 0.4, { ry, c: 0x5a3a2a });
            const pm = new T.Mesh(new T.PlaneGeometry(2.5, 3.9), mat('door' + i, { map: doorTex(i) })); pm.position.set(x + fx * 0.07, PH + 1.98, z + fz * 0.07); pm.rotation.y = ry; WG.add(pm);
            DOORS.push({ i, w, need: NEED[w], x, z, fx, fz, ry, y: PH });
      }
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
          // Acorn Plaza: paving, a fountain, and the magic doors
          deco(ptM(S.cyl(30), 0xf0e8e0, M(PLX, PH - 0.12, PLZ, 0, 0, 0, 21, 0.3, 21), 0), 'cobble');
          cyl(PLX, PH, PLZ, 2.4, 0.7, { t: 'cobble', c: 0xe8e0f0 }); cyl(PLX, PH + 0.7, PLZ, 0.45, 1.7, { c: 0xd8d0e0 }); cyl(PLX, PH + 2.3, PLZ, 1.3, 0.3, { c: 0xd8d0e0, top: 1.4 });
          deco(ptM(S.cyl(20), 0x5ab8ff, M(PLX, PH + 0.62, PLZ, 0, 0, 0, 4.4, 0.04, 4.4)), 'vb'); deco(ptM(S.cyl(14), 0x8ad0ff, M(PLX, PH + 2.62, PLZ, 0, 0, 0, 2.3, 0.04, 2.3)), 'vb');
          ORDER.slice(0,7).forEach(hubDoor);
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
          // the big tree: its branches are steps; the raised crown clears the victory jump.
          deco(ptM(S.cyl(8,.65),0x8a5a2a,M(TRX,TB+16.2,TRZ-1.85,-.32,0,0,.55,10.4,.55),.3));
          cyl(TRX, TB, TRZ, 1.1, 12, { c: 0x8a5a2a, top: 0.75 }); deco(ptM(S.ball(12), 0x3aa83a, M(TRX, TB + 22, TRZ, 0, 0, 0, 10, 7, 10), 0.35));
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
          npc('mayor', `MAYOR ${castN('mate1')}`, 5, 25, 2.6, () => mayorLines());
          npc('tortoise', `OLD ${castN('grandad')}`, -29, -1, -1.2, ['OH! HELLO, YOUNG BOPPER. I WAS HAVING A LITTLE SNOOZE.', 'I SAW SOMETHING SHINY ROLL UNDER THE PIER, YOU KNOW. AND I HEARD THE GRUMPIES MUTTERING ABOUT AN ACORN THEY GUARD.', 'IF YOU STOMP ALL FIVE OF THEM, I EXPECT IT WILL TURN UP IN THE PLAZA FOUNTAIN. ZZZ...']);
          sign(PLX + 2.5, PLZ + 11.5, Math.PI + 0.3, ['ACORN PLAZA. THE MAGIC DOORS LEAD TO OTHER WORLDS.', 'EACH DOOR OPENS WHEN YOU HAVE ENOUGH GOLDEN ACORNS. THE NUMBER IS ON THE DOOR.']);
          sign(11, 28, 0.5, ['WELCOME TO BISCUIT ISLAND!', 'PRESS ' + L('b') + ' NEAR A SIGN OR A PERSON TO READ OR TALK. ' + L('l') + ' AND ' + L('r') + ' TURN THE CAMERA ROUND.', 'PRESS START TO PAUSE AND SEE WHICH ACORNS YOU HAVE FOUND.', 'THE SOFT LANDINGS CLUB IS ACROSS THE BOARDWALK. THE COACH TEACHES EVERY MOVE.']);
          life(LX + 2.4, LTOP + 1.0, LZ + 1.2);
        },
      };
      // ---- Custard Cove (the beach)
      WORLDS.cove = {
        song: 'cove', fog: [0xb8e4ff, 55, 180], water: 0, killY: -20, spawn: [0, 27, 0], exitAt: [-5.5, 28.5], bound: 58,
        light: { amb: 0.65, sun: 0.62, sky: 0xfff8e8, gnd: 0xc8a870, dir: [0.5, 1, 0.2] },
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
          acorn('castle', 'KING OF THE SANDCASTLE', 0, CB + 9.0, -8); acorn('chest', `CAPTAIN ${castN('mate2')}' CHEST`, 24.8, 15.4, 12, { hidden: true, cond: 'chest' });
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
          npc('claws', `CAPTAIN ${castN('mate2')}`, 28, 12, Math.PI / 2, () => chestOpen.cove ? ['ARR, THAT BE ME TREASURE ALL RIGHT. KEEP IT, MATEY. I CAN\'T LIFT IT ANYWAY, ME CLAWS BE TOO SNIPPY.'] : ['ARR! AHOY THERE, BOPPER!', 'ME TREASURE CHEST BE STUCK UP IN THE CROW\'S NEST, AND THERE BE A GOLDEN ACORN IN IT.', 'CLIMB THE RIGGING ROUND THE MAST, THEN GIVE THAT CHEST A GOOD BUTT STOMP. JUMP, THEN PRESS ' + L('c') + ' IN THE AIR!'], { y: 5, r: 2.8 });
          npc('shelly', `${castN('sister')}`, -6, 25, 0.3, [`HIYA! I'M ${castN('sister')}. WELCOME TO CUSTARD COVE!`, 'SEE THOSE TWO TALL ROCKS BY THE CLIFF? WE CALL THAT THE CHIMNEY.', 'JUMP AT ONE ROCK, THEN PRESS ' + L('a') + ' JUST AS YOU TOUCH IT TO KICK OFF. KEEP KICKING BETWEEN THEM AND UP YOU GO!', 'THERE\'S A BOUNCY CLAM UP ON LOOKOUT POINT. BOING!']);
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
        light: { amb: 0.62, sun: 0.58, sky: 0xe8f2ff, gnd: 0x8aa0c0, dir: [-0.4, 1, 0.5] },
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
          acorn('summit', 'SNOWMAN\'S SUMMIT', 0, 30.4, 0); acorn('race', `RACE ${castN('mate3')} PENGUIN`, 0, FY + 1.6, 46, { hidden: true, cond: 'race' });
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
          npc('percy', `${castN('mate3')} PENGUIN`, 4, 5, 0, () => percyLines(), { y: this.ground(4, 5), percy: true });
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
          manorInterior();
          box(0, 10, -20, 22.6, 2, 12.6, { t: 'roof', c: 0xd8a0c8 }); box(0, 12, -20, 15, 2, 8, { t: 'roof', c: 0xd8a0c8 }); box(0, 14, -20, 8, 2, 4, { t: 'roof', c: 0xd8a0c8 });
          box(2.5, 16, -20, 1.6, 3.5, 1.6, { t: 'brick', c: 0xc8a090 });
          for (const y of [0.15, 10, 12, 14]) for (const z of [-26.35, -13.65]) deco(ptM(S.cyl(8), 0xfff4fa, M(0, y + (y > 1 ? 0 : 0), z, 0, 0, Math.PI / 2, 0.35, y > 1 ? (y === 10 ? 22.8 : y === 12 ? 15.2 : 8.2) : 22.2, 0.35)));
          for (const x of [-8, -4, 4, 8]) for (const y of [2.2, 6.6]) { if (y < 3 && Math.abs(x) < 5) continue; deco(ptM(S.box(), 0xffd86a, M(x, y + 0.9, -13.95, 0, 0, 0, 1.6, 1.8, 0.1)), 'vb'); deco(ptM(S.box(), 0x3a1a0a, M(x, y + 0.9, -13.9, 0, 0, 0, 0.12, 1.8, 0.08))); }

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
          [[-26, 1.2, 20], [-30, 1.2, 0], [-34, 1.2, 20], [-38, 1.2, 0], [-42, 1.2, 1], [-16, 17, -18], [4.9, 2.3, -20], [-6.5, 6.25, -21]].forEach(([x, y, z]) => red(x, y, z));
          coinLine(0, 0, 36, 0, 0, -10, 10, true); coinRing(-20, 0, 10, 4, 8, true); coinLine(-9, 12.9, -15, 9, 12.9, -15, 6); coinLine(-6, 14.9, -20, 6, 14.9, -20, 4);
          coinRing(16, 0, 10, 3, 6, true); coinRing(24, 0, 16, 3, 6, true); for (const x of [-26, -30, -34, -38]) coinLine(x, 0, 4, x, 0, 16, 4, true);
          [[-30, -4], [-30, 28], [30, -6], [16, 34]].forEach(([x, z]) => coinRing(x, 0, z, 2, 4, true)); coinLine(-8.5, 7.3, -13, -3.5, 7.3, -13, 3); coinLine(-12, 0, -11, 12, 0, -11, 8, true);
          [[-10, 20], [12, -4], [-18, -6], [30, 8], [-6, 30]].forEach(([x, z]) => enemy('boohoo', x, z, { y0: 1.0, fly: true, r: 0.8, h: 1.6, range: 8 }));
          enemy('boohoo',7,-22,{a:1.2,t:.7,y0:1.1,fly:true,r:.8,h:1.6,range:3});enemy('boohoo',-7,-18,{a:3.4,t:1.6,y0:6,fly:true,r:.8,h:1.6,range:3});
          npc('hubert', `${castN('mate4')}`, 4, 36, -2.6, [`GOOD EVENING, SIR. WELCOME TO GHOULISH GINGER MANOR. I AM ${castN('mate4')}, THE BUTLER. I HAVE BEEN DEAD FOR TWO HUNDRED YEARS, BUT I STILL DO THE DUSTING.`, 'THE YOUNGER GHOSTS ARE SHY. THEY CREEP UP WHEN YOUR BACK IS TURNED, AND HIDE THEIR FACES WHEN YOU LOOK AT THEM. WHILE THEY ARE HIDING, GIVE THEM A GOOD PUNCH.', 'THE LANTERNS IN THE GARDEN HAVE GONE OUT. TOUCH ALL FOUR TO LIGHT THEM AGAIN, WOULD YOU?', 'AND DO MIND HER LADYSHIP, BIG BOOHOO, IN THE GRAVEYARD. SHE HATES BEING WOKEN UP.'], { y: 1.0, ghost: true });
          sign(-21.5, 9.2, -1.3, ['THE HEDGE MAZE. SOME RED COINS GOT LOST IN HERE.']);
          sign(9, -11, 2.6, ['THE HAUNTED LIFT GOES UP TO THE ROOF. PROBABLY.']);
          life(-16, 17.2, -20);
        },
      };
      function manorInterior() {
        // The old solid facade becomes a real two-storey gingerbread house.
        box(0,-.2,-20,22,.4,12,{t:'wood',c:0xa58663});
        box(0,.2,-25.8,22,9.8,.4,{t:'ginger'});
        for(const side of [-1,1]){
          box(side*10.8,.2,-20,.4,9.8,12,{t:'ginger'});
          box(side*6.15,.2,-14,9.7,9.8,.4,{t:'ginger'});
          // Open arches lead from the foyer into the library and dining parlour.
          for(const [z,d] of [[-15.9,3.8],[-24.1,3.4]])box(side*2.8,.2,z,.32,4.6,d,{t:'wood',c:0x755443});
          box(side*6.75,4.8,-20,7.9,.3,11.2,{t:'wood',c:0x967553});
          for(const z of [-17,-23]){cyl(side*2.8,.2,z,.16,4.6,{c:0xe7cba2});cyl(side*2.8,5.1,z,.13,1.05,{c:0xe7cba2});}
          deco(pt(S.box(),0xe7cba2,side*2.8,6.15,-20,.12,.12,6.3));
        }
        box(0,3.25,-14,2.6,6.75,.4,{t:'ginger'});box(0,4.8,-24.6,5.6,.3,2.4,{t:'wood',c:0x967553});
        for(let i=1;i<=11;i++){const y=.2+(i-1)*.45,z=-16.5-i*.65;box(0,y,z,2.3,.45,.8,{t:'wood',c:i%2?0x9d7854:0x886343});if(i%2)for(const side of [-1,1])cyl(side*1.32,y+.45,z,.06,.95,{c:0xe9cca0});}
        for(const side of [-1,1])deco(pt(S.box(),0xe9cca0,side*1.32,3.45,-20.4,.12,.12,8.7,.6));
        // A fitted carpet and a library full of thick, individually bound books.
        libraryDressing();
        for(const side of [-1,1]){
          box(-10.1,.2,-20+side*3.3,.5,3.7,3,{t:'wood',c:0x563e31});
          for(let shelf=0;shelf<4;shelf++){box(-9.85,.35+shelf*.82,-20+side*3.3,1.05,.12,3.25,{t:'wood',c:0x7d6045});
            for(let b=0;b<7;b++){const z=-21.2+side*3.3+b*.36,h=.38+((b+shelf*2)%5)*.08;deco(pt(S.box(),[0x8b3648,0x53776a,0x5f578d,0xbc9150][b%4],-9.6,.5+shelf*.82+h/2,z,.48,h,.25,0,0,(b+shelf)%6===0?.15:0));deco(pt(S.box(),0xd8bd79,-9.35,.62+shelf*.82,z,.025,.04,.23));}}
        }
        // Dining table, four backed chairs and a solid three-arm candelabrum.
        box(6.3,1.15,-20,4.5,.2,2.1,{t:'wood',c:0xb28b58});
        for(const x of [4.35,8.25])for(const z of [-20.8,-19.2])box(x,.2,z,.2,.95,.2,{t:'wood',c:0x674b35});
        for(const z of [-22,-18])for(const x of [5.1,7.5]){box(x,.65,z,.95,.16,.9,{t:'wood',c:0x8c6045});box(x,.8,z+(z<-20?-.4:.4),.95,1.0,.12,{t:'wood',c:0x8c6045});for(const dx of [-.35,.35])for(const dz of [-.3,.3])box(x+dx,.2,z+dz,.12,.45,.12,{t:'wood',c:0x674b35});}
        cyl(6.3,1.35,-20,.18,.65,{c:0xb99a56});deco(pt(S.box(),0xb99a56,6.3,1.9,-20,1.4,.12,.12));
        for(const x of [5.7,6.3,6.9]){cyl(x,1.95,-20,.1,.4,{c:0xffe3ab});deco(pt(S.ball(8),0xffc167,x,2.42,-20,.12,.24,.12),'vb');}
        // Upstairs writing desks and a warm landing light, without modern effects.
        for(const x of [-6.5,6.5]){box(x,6.1,-24,3,.2,1.4,{t:'wood',c:0x97734b});for(const dx of [-1.25,1.25])box(x+dx,5.1,-24,.16,1,.9,{t:'wood',c:0x5a4032});deco(pt(S.box(),0xe2d0a5,x,6.315,-24,1.2,.025,.8));}
        for(const y of [3.15,7.4])for(const x of [-8,8]){deco(pt(S.box(),0xe6bd64,x,y,-14.22,1.5,1.7,.03),'vb');deco(pt(S.box(),0x51342c,x,y,-14.25,.08,1.7,.06));}
        for(const [x,y,z] of [[0,3,-20],[6.3,3,-20]]){const light=new T.PointLight(0xffc47c,.7,13);light.position.set(x,y,z);WG.add(light);}
        manorDoor();
      }
      function libraryDressing(){
        const rug=tex('libraryRug',64,64,g=>{
          g.fillStyle='#612a3c';g.fillRect(0,0,64,64);g.strokeStyle='#c39959';g.lineWidth=3;g.strokeRect(3,3,58,58);g.strokeStyle='#342943';g.lineWidth=2;g.strokeRect(8,8,48,48);
          for(let y=14;y<56;y+=12)for(let x=14;x<56;x+=12){g.fillStyle=(x+y)%24?'#a16c57':'#d6a563';g.beginPath();g.moveTo(x,y-4);g.lineTo(x+4,y);g.lineTo(x,y+4);g.lineTo(x-4,y);g.fill();}g.fillStyle='#d0ae75';for(let i=5;i<60;i+=4){g.fillRect(i,0,2,2);g.fillRect(i,62,2,2);}
        });
        const cloth=new T.Mesh(libraryClothGeo,mat('libraryCloth',{map:rug,color:0xeed4b6,emissive:0x26101b}));cloth.position.set(-6.4,.225,-20);cloth.scale.set(5.4,.03,6.3);WG.add(cloth);
        // A subdivided floor carries painted warm light, like a vertex-lit cartridge room.
        const g=new T.PlaneGeometry(7.4,10.8,10,14);g.rotateX(-Math.PI/2);const pos=g.attributes.position,colors=[];
        for(let i=0;i<pos.count;i++){const x=pos.getX(i)-6.6,z=pos.getZ(i)-20,f=Math.max(Math.exp(-((x+5.1)**2+(z+21.4)**2)/8),Math.exp(-((x+9.8)**2+(z+19.8)**2)/10));pos.setXYZ(i,x,.213,z);colors.push(.32+f*.53,.19+f*.37,.13+f*.2);g.attributes.uv.setXY(i,x/2,z/2);}
        g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const floor=new T.Mesh(g,mat('libraryFloor',{vcol:true,map:TEX.wood(),lit:false}));WG.add(floor);
        const brass=0xc29a58;
        for(const [x,z,y] of [[-10.25,-20,2.2],[-4.1,-25.35,2.5]]){
          deco(pt(S.box(),0x6b4b36,x,y,z,.35,.55,.18));deco(pt(S.cyl(8),brass,x+.18,y-.2,z,.12,.7,.12));
          deco(pt(S.cyl(10),brass,x+.18,y-.1,z,.5,.1,.5));candle(x+.18,y,z);
        }
        cyl(-5.1,.2,-21.4,.55,.8,{t:'wood',c:0x92734d});cyl(-5.1,1,-21.4,.8,.12,{t:'wood',c:0xb89767});candle(-5.1,1.15,-21.4);
        deco(pt(S.box(),0x5c735e,-4.75,1.16,-21.45,.48,.09,.65,0,.25));deco(pt(S.box(),0xe3ce9b,-4.75,1.21,-21.45,.4,.025,.59,0,.25));
        for(let i=0;i<3;i++){deco(pt(S.box(),[0x7d3b50,0x688d82,0xb58b54][i],-8.9,.29+i*.12,-18,.65,.1,.9,0,i*.23));deco(pt(S.box(),0xd5bd87,-8.9,.34+i*.12,-18,.58,.025,.8,0,i*.23));}
        const warm=new T.PointLight(0xffc078,1.15,9,1.4);warm.position.set(-6.8,2.9,-20);WG.add(warm);
      }
      function candle(x,y,z){
        deco(pt(S.cyl(8),0xe8cc96,x,y+.24,z,.15,.48,.15));deco(pt(S.cyl(6),0x473729,x,y+.51,z,.035,.08,.035));
        deco(pt(S.ico(),0xffb74c,x,y+.65,z,.18,.34,.18),'vb');deco(pt(S.ico(),0xffefb0,x,y+.62,z,.09,.2,.09),'vb');
      }
      function manorDoor() {
        const m=new T.Group(),leaf=new T.Mesh(merge([pt(S.box(),0x64412e,1.15,1.5,0,2.3,3,.2,0,0,0,.25),pt(S.box(),0x977044,1.15,1.7,.12,1.65,1.9,.05),pt(S.ball(8),0xe6bd64,1.95,1.4,.18,.16,.16,.16),pt(S.ball(8),0xe6bd64,1.95,1.4,-.18,.16,.16,.16)]),matV());m.position.set(-1.15,.2,-13.85);m.add(leaf);WG.add(m);CAM_MESHES.push(leaf);
        const b=solidBox(0,.2,-13.85,2.3,3,.2,0),p={kind:'manorDoor',m,b,x:-1.15,y:.2,z:-13.85,open:0,want:0};PROPS.push(p);syncDoor(p);
      }
      function syncDoor(p){const t=p.open*p.open*(3-2*p.open),a=t*Math.PI*.5;p.m.rotation.y=a;p.b.ry=a;p.b.cs=Math.cos(a);p.b.sn=Math.sin(a);p.b.x=p.x+Math.cos(a)*1.15;p.b.z=p.z-Math.sin(a)*1.15;}
      function nearManorDoor(){return PROPS.find(p=>p.kind==='manorDoor'&&Math.hypot(P.x-(p.x+1.15),P.z-p.z)<2.7&&Math.abs(P.y-p.y)<1.2);}
      function useManorDoor(p){p.want=p.want?0:1;P.vx=P.vz=0;K.sfx.noise(.12,.045,400);K.sfx.tone(p.want?180:130,.1,'triangle',.04);saveNow();}
      function manorSigns(){
        sign(-3.8,-16.5,.4,['THE HAUNTED LIBRARY.','PLEASE RETURN YOUR BOOKS BEFORE YOU BECOME A GHOST. LATE FEES CONTINUE AFTER DEATH.','THE STAIRS LEAD TO THE UPPER GALLERY. THE ROOF IS STILL REACHED BY THE LIFT OUTSIDE.'],.2);
        sign(9.4,-23.2,-.6,['THE MIDNIGHT DINING CLUB.','TONIGHT: INVISIBLE SOUP. TOMORROW: THE SAME SOUP, BUT COLDER.','GHOSTS HAVE BEEN LEAVING RED COINS ON THE TABLE AND IN THE UPSTAIRS STUDY.'],.2);
      }

      function deadTree(x, z) { cyl(x, 0, z, 0.4, 5, { c: 0x2a1a24, top: 0.5, cr: 0.5 }); for (let i = 0; i < 4; i++) { const a = i * 1.7; deco(ptM(S.cyl(5, 0.4), 0x2a1a24, M(x + Math.cos(a) * 0.8, 3.5 + i * 0.4, z + Math.sin(a) * 0.8, Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9, 0.3, 2.4, 0.3))); } }
      function lampMesh(x, y, z) { const m = new T.Mesh(merge([pt(S.box(), 0xffffff, 0, 0, 0, 0.6, 0.7, 0.6), pt(S.cone(4), 0x2a2a34, 0, 0.55, 0, 0.8, 0.4, 0.8, 0, 0.785)]), T3.mat({ vcol: true, color: 0x4a4a5a, emissive: 0x000000 })); m.position.set(x, y, z); WG.add(m); CAM_MESHES.push(m); return m; }
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
          const bell = new T.Mesh(merge([pt(S.cyl(14, 0.55), 0xd8a83a, 0, 0, 0, 2.6, 2.2, 2.6, 0, 0, 0, 0.3), pt(S.ball(10), 0xd8a83a, 0, 1.1, 0, 1.5, 0.8, 1.5), pt(S.ball(8), 0x8a6a2a, 0, -1.1, 0, 0.5, 0.5, 0.5)]), matV()); bell.position.set(0, 60, 0); WG.add(bell); CAM_MESHES.push(bell); WG.userData.bell = bell;
          // The hanging bell is a real ceiling, with enough head clearance on the landing.
          solidBox(0, 58.5, 0, 2.8, 3, 2.8, 0);
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
          npc('cog', `PROFESSOR ${castN('cousin')}`, 3.4, 10.4, 2.8, [`TICK... TOCK... AH! A VISITOR! I AM PROFESSOR ${castN('cousin')}. I WIND UP THE TOWER EVERY MORNING.`, 'GO UP AND ROUND: THE STEPS, MY SPINNING GEARS, THE CABLE CAR, THE LIFT, THEN HOP ON THE BIG CLOCK HANDS AS THEY SWEEP ROUND.', 'THE TICK-BOTS HAVE GONE HAYWIRE. KNOCK THEM ALL OVER AND I SHALL GIVE YOU SOMETHING SHINY.', 'IF YOU ARE BRAVE, YOU CAN KICK YOUR WAY UP THE GAP BEHIND THE TALL PILLAR INSTEAD OF WAITING FOR THE SLOW LIFT.'], { y: 0 });
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

            // ---- Custard Grotto: a complete swimming course, appended to preserve old world seeds.
      let GROT = null;
      WORLDS.grotto = {
        song: 'grotto', fog: [0x80b9cc, 28, 110], water: 0, swimEnabled: true, killY: -30, spawn: [0, 30, 0], exitAt: [-5.5, 32], bound: 38,
        light: { amb: 0.85, sun: 0.55, sky: 0xc3edf0, gnd: 0x326f83, dir: [-0.4, 1, 0.6] },
        ground(x, z) { const r = Math.hypot(x, z); return -12 + 7 * sstep(12, 22, r) + 8 * sstep(22, 31, r) + 4 * sstep(35, 40, r) + Math.sin(x * 0.24) * Math.cos(z * 0.19) * 0.35; },
        build() {
          sky([[0, '#205e84'], [0.4, '#6aafc4'], [0.6, '#bde0d9'], [1, '#bde0d9']], 0);
          terrain(88, 64, 0, 0, this.ground, (x, z, y, sl) => mix3(hexA(y > 0 ? 0xe9d4a0 : 0x71b0a4), hexA(0x54808b), clamp(sl * 0.45, 0, 0.8)));
          const water = seaPlane(0, 'grotto', 0x6ac7dc, 0.48); water.material.side = T.DoubleSide; water.material.depthWrite = false;
          GROT = { pearls: 0, gate: 0, pearlMeshes: [], gates: [], vents: [[-13, 7], [3, -18], [20, 8]], ventMeshes: [], bubbles: [] };
          // Tall faceted limestone walls, leaning spires and a wide open skylight.
          for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, r = 44 + rnd() * 2, x = Math.sin(a) * r, z = Math.cos(a) * r, y = this.ground(x, z), h = 9 + rnd() * 10;
            deco(ptM(S.dod(), i % 2 ? 0x8a9d93 : 0xa9b8a0, M(x, y + h * 0.35, z, rnd() * 0.2, a, 0.15, 12, h, 11), 0.4)); }
          for (const [x,z,h] of [[-29,-11,13],[26,-18,11],[-30,15,9],[26,23,8]]) { const y = this.ground(x,z); cyl(x,y,z,1.7,h,{c:0x8fa79b,t:'detail',top:.55}); deco(pt(S.cone(7),0xb4c4ac,x,y+h+1.8,z,3.1,3.6,3.1)); }
          // The dry roost has two generous landing steps for a surface breach.
          for (const [x,z,r,top] of [[-23,0,3.5,3.4],[-19,4,2.5,1.0],[-16,7,2.0,-.6]]) { const y=this.ground(x,z); cyl(x,y,z,r,top-y,{t:'detail',c:0xc6c6a0,top:.88}); }
          // A solid broken biscuit freighter, with ribs and open ends to swim through.
          box(0,-11,-9,6.2,.6,12,{t:'wood',c:0x8b6850});
          for (const side of [-1,1]) { box(side*3,-10.7,-9,.35,2.1,10,{t:'wood',c:0x79634d}); box(side*2.2,-10.6,-14,3,.4,3,{ry:side*.6,t:'wood',c:0x9b7854}); }
          for (let i=0;i<5;i++) { const z=-13+i*2; for(const side of [-1,1]) deco(pt(S.cyl(6),0x493d31,side*2.6,-9.3,z,.22,2.6,.22,0,0,side*.18)); deco(pt(S.box(),0xb59970,0,-10.25,z,5.6,.18,.22)); }
          box(-2.8,-8.6,-8,2.1,.22,3.5,{ry:-.25,t:'wood',c:0xa88b60,solid:false});
          cyl(2,-10.4,-12,.18,9,{t:'wood',c:0x806148}); deco(pt(S.box(),0x7b5b3e,2,-3.5,-12,5,.18,.2,0,.3,0));
          prop('chest',0,-10.3,-8,0,'grotto');
          // Coral fans and kelp have thickness and branch silhouettes, merged into the world kit.
          for (let i=0;i<24;i++) { const a=i*2.4, r=8+(i%5)*3.4, x=Math.sin(a)*r,z=Math.cos(a)*r,y=this.ground(x,z),c=i%2?0xb87394:0xd99c71;
            if(Math.abs(x)<4&&z<-3&&z>-16)continue;
            for(const side of [-1,0,1]) { deco(pt(S.cyl(6,.65),c,x+side*.3,y+.7,z,.18,1.5,.18,0,0,side*.45)); deco(pt(S.ball(8),c,x+side*.6,y+1.35,z,.36,.38,.36)); }
            for(let j=0;j<3;j++)deco(pt(S.box(),0x377f68,x+1+j*.25,y+.8+j*.3,z,.16,1.6+j*.6,.07,0,j*.6,.18));
          }
          const pearlAt=[[-15,-6.8,5],[4,-9.6,-18],[19,-3.8,11]];
          pearlAt.forEach(([x,y,z],i)=>{ const g=this.ground(x,z); cyl(x,g,z,1.1,.3,{c:0x806d98}); deco(pt(S.hemi(12),0xa99bbb,x,g+.25,z,2.1,.7,1.8,Math.PI,0,0)); const m=mesh('pearl',x,g+.85,z,.8,mat('pearl',{vcol:true,emissive:0x24485a})); GROT.pearlMeshes.push(m); });
          GROT.ventMesh = new T.InstancedMesh(new T.IcosahedronGeometry(.22,0),mat('ventBubble',{color:0xc9f8ee,lit:false}),15); GROT.ventMesh.frustumCulled=false; WG.add(GROT.ventMesh);
          const route=[[15,-4,5],[18,-6,-4],[11,-8,-14]].map(([x,y,z])=>[x,Math.max(y,this.ground(x,z)+2),z]); GROT.route=route;
          route.forEach(([x,y,z],i)=>{const m=new T.Mesh(new T.TorusGeometry(1.7,.16,6,18),mat('grottoGate',{color:0xffd170,emissive:0x372707}));m.position.set(x,y,z);m.rotation.y=i?-.7:0;WG.add(m);GROT.gates.push(m);});
          for (const [x,z] of GROT.vents) { const y=this.ground(x,z); cyl(x,y,z,.85,.35,{c:0x335c68}); deco(pt(S.tor(.14,12),0x8fe2df,x,y+.38,z,1.5,1.5,1.5,Math.PI/2));
            for(let i=0;i<5;i++)GROT.ventMeshes.push({x,z,y,i}); }
          // Five coin lanes encourage changing depth rather than scraping a flat floor.
          for(const [x,y,z,r] of [[-9,-4,14,6],[13,-6,4,6],[0,-8,-9,6],[-10,-8,-11,5],[0,-1.3,22,6]])coinRing(x,y,z,r,22,false);
          coinLine(0,3.9,31,-13,0.5,25,12,false);
          [[-12,-3,17],[13,-5,14],[23,-3,0],[16,-8,-16],[0,-10,-20],[-15,-7,-13],[-22,-1,-4],[-8,-4,3]].forEach(a=>red(...a));
          [[8,-7,7],[-13,-7,-12],[20,-5,-8],[1,-8,12]].forEach(([x,y,z])=>enemy('jelly',x,z,{y0:Math.max(y,this.ground(x,z)+1.2),range:3,r:.7,h:1.2}));
          acorn('dip','YOUR FIRST PROPER DIP',-10,-3,19);
          acorn('chest','THE CAPTAIN\'S LOST LUNCH',0,-8.4,-8,{hidden:true,cond:'chest'});
          acorn('pearls','THREE PEARLS FOR TEA',0,-5,1,{hidden:true,cond:'pearls'});
          acorn('current','RIDE THE CUSTARD CURRENT',10,-7,-16,{hidden:true,cond:'current'});
          acorn('roost','UP TO THE DRY ROOST',-23,4.8,0);
          acorn('reds','EIGHT RED SEA COINS',0,1.4,25,{hidden:true,cond:'reds'});
          acorn('c100','A HUNDRED SUNKEN COINS',0,2,0,{hidden:true,cond:'c100'});
          for(const c of COINS)c.y=Math.max(c.y,this.ground(c.x,c.z)+.85); for(const r of REDS)r.y=Math.max(r.y,this.ground(r.x,r.z)+1); for(const a of ACS)if(!['roost','chest'].includes(a.id))a.y=Math.max(a.y,this.ground(a.x,a.z)+1.2);
          sign(3,31,-.1,['CUSTARD GROTTO.','HOLD '+L('a')+' TO SWIM UP. HOLD '+L('c')+' TO DIVE. RELEASE THEM TO FLOAT. PRESS '+L('a')+' AT THE SURFACE TO LEAP OUT.','TAKE A BREATH AT THE SURFACE OR IN A COLUMN OF BUBBLES. COINS TOP UP YOUR AIR.']);
          sign(-8,28,.2,['THE SUNKEN LUNCH.','A CAPTAIN NEVER LEAVES WITHOUT A PACKED LUNCH. UNLESS THE BOAT SINKS.','SWIM TO THE CHEST IN THE WRECK AND PRESS '+L('b')+' TO OPEN IT.']);
          npc('claws',`CAPTAIN ${castN('mate2')}`,9,29,-.4,[`ARR, ${castN('me')}! I PARKED ME BOAT UNDER THE WATER. VERY SAFE FROM SEAGULLS.`, 'FIND ME THREE PEARLS, FOLLOW THE GOLD HOOPS THROUGH THE CURRENT, OR FETCH ME LUNCH FROM THE WRECK.','THE BUBBLE VENTS GIVE YOU A FRESH BREATH. DO NOT TRY BREATHING CUSTARD.']);
          life(-23,4.3,2);
        },
      };
      function grottoUpdate(dt) {
        if(!GROT)return;
        const q=GROT;
        q.pearlMeshes.forEach((m,i)=>{m.visible=!(q.pearls&(1<<i));if(m.visible&&Math.hypot(P.x-m.position.x,P.y+.6-m.position.y,P.z-m.position.z)<1.4){q.pearls|=1<<i;m.visible=false;snd.coin();say('PEARL '+[0,1,1,2,1,2,2,3][q.pearls]+' OF 3',1.6);burst(m.position.x,m.position.y,m.position.z,[0xb7f9ef,0xffffff],12,3);if(q.pearls===7)reveal('pearls');saveNow();}});
        const gate=q.route[q.gate];if(gate&&Math.hypot(P.x-gate[0],P.y+.7-gate[1],P.z-gate[2])<1.85){q.gate++;K.sfx.tone(700+q.gate*180,.2,'sine',.07);say('CURRENT HOOP '+q.gate+' OF 3',1.2);if(q.gate===3)reveal('current');saveNow();}
      }
      function grottoAnim(t) {
        if(!GROT)return;
        GROT.ventMeshes.forEach((b,i)=>{const top=-.3,span=top-b.y;pdum.position.set(b.x+Math.sin(t*2+b.i)*.25,b.y+((t*1.4+b.i*span/5)%span),b.z+Math.cos(t*1.8+b.i)*.2);pdum.rotation.set(0,t*.5,0);pdum.scale.setScalar(.9+(b.i%2)*.35);pdum.updateMatrix();GROT.ventMesh.setMatrixAt(i,pdum.matrix);}); GROT.ventMesh.instanceMatrix.needsUpdate=true;
        GROT.gates.forEach((m,i)=>{m.material=mat(i===GROT.gate?'grottoGateOn':'grottoGateOff',{color:i===GROT.gate?0xffd170:0x63958b,emissive:i===GROT.gate?0x4a3000:0x06100b});});
      }

      // Three permanent switch unlocks; the temporary outfits belong to the suspended player.
      const POWER_DEFS={
        brolly:{name:'BROLLY BONNET',world:'brolly',stage:'BROLLY BELFRY',color:0xf4bb55,need:null,portal:[-28,8],time:50},
        tin:{name:'TIN BISCUIT',world:'pantry',stage:'TIN PAN PANTRY',color:0x91bdca,need:'brolly',portal:[18,20],time:60},
        peek:{name:'PEEKABOO HOOD',world:'peekaboo',stage:'PEEKABOO PARLOUR',color:0xcaa1f2,need:'tin',portal:[-25,-18],time:45}
      };
      let POWER_RUN={rings:0,pressure:0,gate:0,ledger:false,safeLoot:false,phaseCross:0},powerBoxes=[],powerPortals=[],powerGates=[],powerSwitch=null,powerRings=[],powerLedger=null;
      const powerIconCache={};
      function powerIcon(k){if(!powerIconCache[k]){const g=T3.keep(makePowerIcon(k));g.userData.persist=true;powerIconCache[k]=g;}return powerIconCache[k];}
      function makePowerIcon(k){
        if(k==='brolly')return merge([pt(S.cone(8),0xf1bd58,0,.12,0,1.1,.32,1.1),pt(S.cyl(6),0xf8edcc,0,-.26,0,.06,.65,.06),pt(S.tor(.06,8),0xe88959,0,-.57,0,.22,.22,.22)]);
        if(k==='tin')return merge([pt(S.cyl(12),0xa8c1c8,0,-.02,0,.9,.48,.9),pt(S.cyl(12),0xe9f0dd,0,.25,0,1.04,.08,1.04),pt(S.ball(8),0x4c606d,0,.36,0,.25,.18,.25),...[-1,1].flatMap(x=>[-1,1].map(z=>pt(S.ball(6),0xeff4d4,x*.26,.17,z*.26,.1,.1,.1)))]);
        return merge([pt(S.cone(8),0xb39bcc,0,.14,0,.85,.85,.85),pt(S.tor(.05,10),0xf0d4ff,0,-.23,0,.85,.85,.85,Math.PI/2),pt(S.ico(),0xeadbff,-.38,.4,0,.15,.25,.12),pt(S.ico(),0xeadbff,.38,.4,0,.15,.25,.12)]);
      }
      function powerBox(k,x,y,z){
        const d=POWER_DEFS[k],m=new T.Mesh(merge([pt(S.box(),0xffffff,0,.9,0,.9,.7,.9),pt(S.box(),0x4c3b2a,0,.55,0,1,.12,1),pt(S.box(),0xf0ddb2,0,1.28,0,1,.1,1),...[-1,1].flatMap(a=>[-1,1].map(b=>pt(S.ball(6),0xf3d78d,a*.39,.95,b*.45,.12,.12,.06)))]),mat('outfitBox_'+k,{vcol:true,color:prog.powers[k]?d.color:0x5b6269,emissive:prog.powers[k]?0x15120b:0x05060a}));
        m.position.set(x,y,z);WG.add(m);CAM_MESHES.push(m);solidBox(x,y+.55,z,1,.78,1,0);cyl(x,y,z,.24,.55,{c:0x766246});const icon=new T.Mesh(powerIcon(k),matV());icon.position.set(0,1.7,0);m.add(icon);powerBoxes.push({k,x,y,z,m,icon});
      }
      function switchBuild(k,x,y,z){
        const d=POWER_DEFS[k];cyl(x,y,z,1.15,.22,{t:'metal',c:0x776149});const b=cyl(x,y+.22,z,.88,.34,{vis:false,props:{powerSwitch:k}});
        const m=new T.Mesh(merge([pt(S.cyl(14),d.color,0,.17,0,1.76,.34,1.76),pt(S.cyl(12),0xf8e6ae,0,.35,0,1.15,.04,1.15),pt(S.box(),0x594339,0,.39,0,.13,.05,.55),pt(S.box(),0x594339,0,.39,.3,.13,.05,.13)]),matV());m.position.set(x,y+.22,z);WG.add(m);powerSwitch={k,x,y:y+.56,z,m,b};m.scale.y=prog.powers[k]?.45:1;b.y1=b.y0+.34*m.scale.y;
      }
      function unlockPower(k){
        const d=POWER_DEFS[k];if(prog.powers[k]){say(d.name+' ALREADY UNLOCKED',1.6);return;}
        prog.powers[k]=1;shake=Math.max(shake,.16);burst(P.x,P.y+.7,P.z,[d.color,0xfff1bb],24,5,{life:.9});
        say(d.name+' UNLOCKED!',3,'MATCHING BOXES NOW WORK THROUGHOUT BISCUIT ISLAND.');K.sfx.seq([[72,.25],[79,.25],[83,.25],[86,.5],[91,1]],{bpm:280,vol:.1,wave:'triangle'});powerAnim(clock);saveNow();
      }
      function takePower(k){
        const d=POWER_DEFS[k];if(!prog.powers[k]){say('FIND THE '+d.stage+' SWITCH',2,'POUND IT TO WAKE THESE BOXES.');K.sfx.tone(160,.12,'square',.05);return;}
        P.power=k;P.powerT=d.time;P.gliding=false;P.air=30;P.airClock=0;burst(P.x,P.y+1,P.z,[d.color,0xffffff],18,3,{life:.65,grav:2});K.sfx.seq([[67,.15],[74,.15],[79,.4]],{bpm:300,vol:.075,wave:k==='tin'?'square':'triangle'});say(d.name+'!',1.8,k==='brolly'?'HOLD '+L('a')+' IN THE AIR TO GLIDE. '+L('c')+' FOLDS IT.':k==='tin'?'HEAVY BOOTS. WALK UNDERWATER. STAND ON WEIGHT PLATES.':'WALK THROUGH VIOLET GRILLES. KEEP AN EYE ON THE TIMER.');saveNow();
      }
      function powerInput(){
        if(!IN.b||P.st==='dead')return;const box=powerBoxes.find(b=>Math.hypot(P.x-b.x,P.z-b.z)<1.9&&Math.abs(P.y-b.y)<1.7);if(box){takePower(box.k);IN.b=false;}
      }
      function phaseGate(x,y,z,w,h,ry){
        ry=ry||0;const b=solidBox(x,y,z,w,h,.26,ry);b.phase=true;
        const pieces=[pt(S.box(),0xb1a0c5,0,h,0,w,.14,.3),pt(S.box(),0x9d87b2,0,.08,0,w,.16,.3)];for(let a=-w/2+.2;a<w/2;a+=.5)pieces.push(pt(S.cyl(6),0xc5a7dc,a,h/2,0,.11,h,.11));
        const m=new T.Mesh(merge(pieces),mat('phaseGrille',{vcol:true,transparent:true,opacity:.82,emissive:0x1d1029}));m.position.set(x,y,z);m.rotation.y=ry;m.material.depthWrite=false;m.userData.phase=true;WG.add(m);CAM_MESHES.push(m);powerGates.push({kind:'phase',b,m});return b;
      }
      function heavyVault(x,y,z,w,secret){
        box(x,y-.25,z,w+.8,.25,7,{t:'metal',c:0x778c8a});
        const front=WD.ground(x,z+7);for(let i=0;i<7;i++){const zz=z+6.5-i*.45,base=WD.ground(x,zz)-.15,top=lerp(front,y,(i+1)/7);if(top>base+.05)box(x,base,zz,w+.7,top-base,.85,{t:'metal',c:i%2?0x819590:0x697d79});}
        for(const side of [-1,1])box(x+side*(w/2+.15),y,z-1,.3,3.3,5,{t:'metal',c:0x778d99});box(x,y,z-3.6,w+.6,3.3,.3,{t:'metal',c:0x778d99});box(x,y+3.3,z-3.6,w+.6,.25,.35,{t:'metal',c:0x8a9fa4});
        const b=solidBox(x,y,z+1.5,w,3.3,.24,0),pieces=[];for(let a=-w/2+.2;a<w/2;a+=.48)pieces.push(pt(S.cyl(6),0xc6c7a0,a,1.65,0,.1,3.3,.1));pieces.push(pt(S.box(),0x978c58,0,3.3,0,w,.18,.3));
        const m=new T.Mesh(merge(pieces),matV());m.position.set(x,y,z+1.5);WG.add(m);CAM_MESHES.push(m);const loot=new T.Mesh(merge([pt(S.box(),0xcc9a50,0,0,0,1,.6,.8),pt(S.box(),0xf1d08a,0,.33,0,1.1,.1,.9),pt(S.box(),0x75482d,0,.1,-.43,.25,.18,.07)]),matV());loot.position.set(x,y+.5,z-1);WG.add(loot);powerGates.push({kind:'weight',b,m,y,secret,loot});
        cyl(x,y,z+3,1.15,.14,{c:0xc8a34d,props:{weightPlate:true}});deco(pt(S.box(),0x5b5b52,x,y+.15,z+3,1.5,.03,.24));deco(pt(S.box(),0x5b5b52,x,y+.15,z+3,.24,.03,1.5));
      }
      function windVisual(x,y,z,step){
        const parts=[];for(let i=0;i<4;i++)parts.push(pt(S.tor(.04,12),0xc1e8d4,x,y+1+i*step,z,2.3,2.3,2.3,Math.PI/2));
        const m=new T.Mesh(merge(parts),mat('windAir',{vcol:true,lit:false,transparent:true,opacity:.5}));m.material.depthWrite=false;WG.add(m); // air must never shorten the camera boom
      }
      function buildPowerContent(id){
        if(id==='hub')for(const [k,d] of Object.entries(POWER_DEFS)){
          const [x,z]=d.portal,y=WD.ground(x,z),m=new T.Mesh(new T.TorusGeometry(1.15,.17,6,16),mat('secretRing_'+k,{color:d.color,emissive:0x211923}));m.position.set(x,y+1.65,z);WG.add(m);
          for(let i=0;i<6;i++){const top=y-1.5+i*.3,base=Math.min(WD.ground(x,z+3.6),WD.ground(x,z-3.6),WD.ground(x+3.6,z),WD.ground(x-3.6,z))-1;cyl(x,base,z,3.5-i*.35,Math.max(.1,top-base),{t:'cobble',c:i%2?0xb3a88c:0xcbbf9d});}for(const a of [-1,1])cyl(x+a*1.4,y,z,.18,2.7,{t:'metal',c:d.color});cyl(x,y,z,1.7,.14,{t:'cobble',c:0xcbbf9d});
          const emblem=new T.Mesh(powerIcon(k),matV());emblem.position.set(x,y+1.6,z);WG.add(emblem);powerPortals.push({k,x,y,z,m,emblem});
          sign(x+2.8,z,0,[d.stage+'.',d.need?'THE '+POWER_DEFS[d.need].name+' SWITCH WAKES THIS SECRET STAGE.':'A SECRET STAGE! POUND ITS GREAT SWITCH TO WAKE THE BROLLY BOXES.','WALK THROUGH THE RING. RETURN THROUGH THE HOME PAINTING.'],y);
        }
        if(id==='cove'){
          const x=-32,z=14,y=WD.ground(x,z);powerBox('brolly',x+4,WD.ground(x+4,z+4),z+4);cyl(x,y,z,2,.25,{c:0x8eb8b7,t:'metal'});
          windVisual(x,y,z,1.6);
          cyl(x,10,-13,3,1.2,{t:'sandbrick',c:0xe5d7a4});for(const dx of [-2,0,2])deco(pt(S.ball(10),0xf0ebd5,x+dx,10,-13,3.3,1.7,4.3));acorn('brolly','OVER THE CUSTARD CLOUDS',x,12.6,-13,{power:'brolly'});
          sign(x+4,z+2,0,['THE BROLLY LIFT.','FETCH A BROLLY BONNET FROM THE BOX. STAND IN THE WIND TO LIFT OFF, THEN HOLD '+L('a')+' AND STEER TO THE CLOUD LEDGE.']);
        }
        if(id==='grotto'){
          powerBox('tin',-3,WD.ground(-3,30),30);const x=19,z=-10,y=Math.max(WD.ground(x-2,z-3),WD.ground(x+2,z+3))+.2;heavyVault(x,y,z,4,false);
          acorn('tin','THE HEAVY LUNCH SAFE',x,y+1.45,z+5,{hidden:true,cond:'weight',power:'tin'});sign(-5,29,0,['A PROPER HEAVY LUNCH.','TIN BISCUIT DOES NOT FLOAT. WEAR IT TO WALK TO THE WEIGHT PLATE AT THE EASTERN SAFE. KEEP BOTH BOOTS ON IT.']);
        }
        if(id==='manor'){
          powerBox('peek',-4.6,.2,-16.5);
          for(const side of [-1,1])box(-6.6+side*1.55,.2,-24.2,.24,3.5,2.8,{t:'wood',c:0x72583e});box(-6.6,3.7,-24.2,3.3,.2,2.8,{t:'wood',c:0x72583e});phaseGate(-6.6,.2,-22.8,2.9,3.5);powerBox('peek',-7.5,.2,-24.7);
          powerLedger=new T.Mesh(merge([pt(S.box(),0x70569c,0,0,0,.7,.12,.85),pt(S.box(),0xf7dca1,0,.08,0,.62,.08,.77),pt(S.box(),0xd8a651,0,.14,0,.08,.025,.55)]),mat('ledger',{vcol:true,emissive:0x2d193d}));powerLedger.position.set(-6.6,1.1,-24.1);WG.add(powerLedger);cyl(-6.6,.2,-24.1,.3,.83,{t:'wood',c:0x96714c});
          acorn('peek','THE OVERDUE AFTERLIFE',-6.4,1.7,-20,{hidden:true,cond:'ledger',power:'peek'});sign(-3.6,-24.2,0,['THE OVERDUE SHELF.','ONE BOOK HAS BEEN MISSING SINCE LAST TUESDAY. WALK THROUGH THE VIOLET GRILLE WITH A PEEKABOO HOOD AND FETCH THE GLOWING LEDGER.'],.2);
        }
      }
      for(const [k,d] of Object.entries(POWER_DEFS)){
        WN[d.world]=d.stage;
        WORLDS[d.world]={power:k,spawnY:k==='peek'?.2:undefined,song:k==='brolly'?'peaks':k==='tin'?'tower':'manor',spawn:[0,18,0],exitAt:[4,20],ground:(x,z)=>k==='brolly'?-70:0,killY:k==='brolly'?-25:-15,bound:38,square:true,safeOnly:k==='brolly',water:k==='tin'?7:null,swimEnabled:k==='tin',fog:k==='peek'?[0x211e3c,22,75]:k==='tin'?[0x56848d,20,80]:[0xb8dbe8,50,180],light:{sky:k==='peek'?0xb5a8d9:0xe2f6e6,gnd:0x63584b,amb:.75,sun:.65,dir:[.5,1,.4]},build(){
          if(k==='brolly'){
            sky([[0,'#517bb0'],[.5,'#bbdfdf'],[1,'#f3dfb3']],10,60,0xf3f0d7);farRing(16,140,230,35,90,0x668b9a,0x8aa7af,-30);
            deco(pt(S.cone(8),0x6b7f88,0,5,18,11.8,6,11.8,Math.PI));cyl(0,8,18,6,2,{t:'cobble',c:0xbdb597});box(0,9.56,10,4,.5,13,{t:'wood',c:0xb9a172});cyl(0,9,-1,5,1,{t:'cobble',c:0xbdb597});
            deco(pt(S.cone(8),0x72818a,0,5,-29,9.8,6,9.8,Math.PI));cyl(0,8,-29,5,2,{t:'cobble',c:0xc9ba94});for(const x of [-3,3])cyl(x,10,-30,.4,5,{t:'wood',c:0x8e765b});deco(pt(S.cone(8),0xdfa858,0,16,-30,9,2.5,6));deco(pt(S.cyl(12,.4),0xd4ac5e,0,14,-30,1.9,1.3,1.9));deco(pt(S.tor(.09,12),0xf2d68d,0,13.35,-30,1.9,1.9,1.9,Math.PI/2));deco(pt(S.ball(8),0x735239,0,13.15,-30,.35,.5,.35));deco(pt(S.cyl(6),0x695840,0,15,-30,.1,.8,.1));
            switchBuild(k,0,10,11);powerBox(k,1.2,10,8);powerBox(k,2.6,10,-29);sign(-3.4,14,.2,['BROLLY BELFRY.','JUMP, THEN '+L('c')+' TO POUND THE BIG SWITCH. PRESS '+L('b')+' BY THE MATCHING BOX. HOLD '+L('a')+' WHILE FALLING TO OPEN YOUR BROLLY.','FOLLOW THREE WIND HOOPS. THE BIG FAN AT THE EDGE GIVES YOU A LIFT.'],10);
            for(const [x,y,z] of [[0,19,-7],[0,17,-15],[0,15,-23]]){const m=new T.Mesh(new T.TorusGeometry(1.8,.13,6,16),mat('windHoop'+powerRings.length,{color:0xffe4a2,emissive:0x392d10}));m.position.set(x,y,z);WG.add(m);powerRings.push(m);}
            acorn('brolly','THE BROLLY POSTAL SERVICE',0,11.5,-29,{hidden:true,cond:'flight',power:'brolly'});
            windVisual(0,10,0,1.4);
          }else if(k==='tin'){
            terrain(75,20,0,0,this.ground,()=>hexA(0x708a82));sky([[0,'#234750'],[1,'#6fa8a4']],0);const surface=seaPlane(7,'pantry',0x8cc6c0,.48);surface.material.side=T.DoubleSide;surface.material.depthWrite=false;
            box(0,0,17,12,8,12,{t:'metal',c:0xa6af94});box(0,0,7,5,5,8,{t:'metal',c:0x8b9e94});switchBuild(k,0,8,15);powerBox(k,2.7,8,12);heavyVault(0,0,-16,6,true);
            for(const side of [-1,1]){box(side*12,0,-2,.7,11,50,{t:'metal',c:0x7d9a91});for(let i=0;i<5;i++){cyl(side*10.5,0,-20+i*8,.4,9,{t:'metal',c:0x9eae86});deco(pt(S.tor(.1,10),0xe5cc8a,side*10.5,8.8,-20+i*8,.8,.8,.8,Math.PI/2));}}
            for(const side of [-1,1])for(let i=0;i<4;i++){const x=side*8.5,z=9-i*9,h=2.6+(i%2)*1.1;cyl(x,0,z,1.15,h,{t:'metal',c:i%2?0xc5aa71:0x97b3a4});cyl(x,h,z,1.22,.16,{t:'metal',c:0xe9d7aa});deco(pt(S.box(),0x6e6651,x,1.1,z+1.14,1,.6,.04));}
            coinLine(0,1,3,0,1,-11,14);acorn('tin','BOTH BOOTS BEFORE BISCUITS',0,1.5,-11,{hidden:true,cond:'weight',power:'tin'});sign(-3.2,15,.1,['TIN PAN PANTRY.','POUND THE SWITCH, THEN TAKE TIN BISCUIT FROM THE BOX. IT SINKS AND NEVER NEEDS AIR.','WALK DOWN THE FLOODED AISLE. STAND ON THE BRASS PLATE UNTIL THE SAFE OPENS.'],8);
          }else{
            terrain(75,20,0,0,this.ground,()=>hexA(0x53516d));sky([[0,'#12182d'],[1,'#44416b']],0);
            for(const side of [-1,1]){box(side*8,0,-2,.6,7,52,{t:'ginger',c:0xa595b6});for(let i=0;i<6;i++){cyl(side*7,0,19-i*8,.25,4,{c:0x87799c});candle(side*7,4,19-i*8);}}
            box(0,7,-2,16.5,.6,52,{t:'wood',c:0x5c4f71});box(0,0,-28,16,7,.6,{t:'ginger',c:0xa595b6});switchBuild(k,0,0,15);powerBox(k,2.6,0,12);powerBox(k,3,0,-5);powerBox(k,3,0,-19);
            for(const side of [-1,1])for(const z of [9,-5,-19]){box(side*7.65,2,z,.08,2.3,1.7,{c:0xaca0cf,solid:false});box(side*7.55,2.1,z,.12,2.1,1.5,{c:0x554c78,solid:false});}for(const z of [10,-3,-17]){cyl(0,.01,z,2.3,.025,{c:0x88789f,solid:false});deco(pt(S.box(),0xbbaaab,0,.05,z,2.6,.03,.15));deco(pt(S.box(),0xbbaaab,0,.05,z,.15,.03,2.6));}
            phaseGate(0,0,1,15.8,7);phaseGate(0,0,-11,15.8,7);coinLine(0,1,10,0,1,-21,18);acorn('peek','NOW YOU SEE MY BISCUITS',0,1.5,-22,{power:'peek'});
            sign(-3.2,15,.1,['PEEKABOO PARLOUR.','POUND THE SWITCH. PRESS '+L('b')+' BY THE BOX FOR A PEEKABOO HOOD. WALK THROUGH THE VIOLET GRILLES.','ORDINARY WALLS AND FLOORS STAY SOLID. IF TIME RUNS OUT IN A GRILLE, IT SETS YOU SAFELY BESIDE IT.']);
          }
        }};
      }
      function powerUpdate(dt){
        if(P.powerT>0){const old=P.powerT;P.powerT=Math.max(0,old-dt);if(P.powerT<6&&Math.ceil(old)!==Math.ceil(P.powerT))K.sfx.tone(780,.055,'triangle',.045);if(!P.powerT){P.power=null;P.gliding=false;pushOut(P,.42,manorCamera()?1.9:1.25);if(P.gnd)P.safe=[P.x,P.y,P.z];say('OUTFIT TIME UP!',1.5);K.sfx.tone(260,.15,'triangle',.05);}}
        if(curW==='hub')for(const portal of powerPortals)if(Math.hypot(P.x-portal.x,P.z-portal.z)<.9&&Math.abs(P.y-portal.y)<1.8){const d=POWER_DEFS[portal.k];if(!d.need||prog.powers[d.need]){enterWorld(d.world);return;}if(lockT<=0){say('FIND THE '+POWER_DEFS[d.need].name+' SWITCH',2);lockT=2;}}
        if(P.power==='brolly'){
          const [x,z,y]=curW==='brolly'?[0,0,10]:curW==='cove'?[-32,14,WD.ground(-32,14)]:[999,999,0];
          if(Math.hypot(P.x-x,P.z-z)<2.8&&P.y>y-1&&P.y<y+(curW==='cove'?6:3)&&P.st!=='dead'&&!IN.cH){P.vy=curW==='cove'?26:19;P.gnd=false;P.st='glide';P.gliding=true;P.land=0;}
          const ring=powerRings[POWER_RUN.rings];if(ring&&Math.hypot(P.x-ring.position.x,P.y+1-ring.position.y,P.z-ring.position.z)<2.4){POWER_RUN.rings++;K.sfx.tone(720+POWER_RUN.rings*180,.12,'triangle',.07);if(POWER_RUN.rings===3)reveal('flight');saveNow();}
        }
        for(const gate of powerGates)if(gate.kind==='weight'){
          const b=gate.b;if(!POWER_RUN.gate&&P.power==='tin'&&P.gnd&&Math.hypot(P.x-b.x,P.z-(b.z+1.5))<1.3&&Math.abs(P.y-gate.y)<.5){POWER_RUN.pressure+=dt;if(POWER_RUN.pressure>.7){POWER_RUN.gate=1;say('THE HEAVY SAFE IS OPEN!',2);snd.pound();burst(b.x,gate.y+.3,b.z+1.5,0xffde8c,14,3);saveNow();}}else if(!POWER_RUN.gate)POWER_RUN.pressure=0;
          if(POWER_RUN.gate&&!POWER_RUN.safeLoot&&P.power==='tin'&&Math.hypot(P.x-gate.loot.position.x,P.z-gate.loot.position.z)<1.2&&Math.abs(P.y-gate.y)<1){POWER_RUN.safeLoot=true;reveal('weight');snd.coin();saveNow();}
        }
        if(curW==='peekaboo'&&P.power==='peek')powerGates.forEach((g,i)=>{if(g.kind==='phase'&&!(POWER_RUN.phaseCross&(1<<i))&&P.z<g.b.z-.6){POWER_RUN.phaseCross|=1<<i;K.sfx.tone(840+i*190,.12,'sine',.055);burst(P.x,P.y+.8,P.z,[0xddc9ff,0x9cbdd8],8,2,{life:.5,grav:0});}});
        if(powerLedger&&!POWER_RUN.ledger&&P.power==='peek'&&Math.hypot(P.x-powerLedger.position.x,P.z-powerLedger.position.z)<1.2&&Math.abs(P.y-.2)<1.5){POWER_RUN.ledger=true;powerLedger.visible=false;reveal('ledger');say('ONE VERY OVERDUE BOOK!',2);snd.coin();saveNow();}
      }
      function powerAnim(t){
        for(const box of powerBoxes){const on=!!prog.powers[box.k];box.icon.visible=on;box.icon.rotation.y=t*1.4;box.m.material.color.setHex(on?POWER_DEFS[box.k].color:0x5b6269);box.m.material.emissive.setHex(on?0x15120b:0x05060a);}
        if(powerSwitch){const s=powerSwitch;s.m.scale.y=prog.powers[s.k] ? .45 : 1;s.b.y1=s.b.y0+.34*s.m.scale.y;if(P.gnd&&P.plat===s.b)P.y=s.b.y1;}
        for(const p of powerPortals){const d=POWER_DEFS[p.k],on=!d.need||prog.powers[d.need];p.m.material.color.setHex(on?d.color:0x58606a);p.emblem.rotation.y=t*.7;}
        powerRings.forEach((m,i)=>m.material.color.setHex(i<POWER_RUN.rings?0x6aa387:0xffe4a2));
        for(const g of powerGates){if(g.kind==='weight'){g.b.open=!!POWER_RUN.gate;g.loot.visible=!POWER_RUN.safeLoot;g.m.position.y=g.y+(POWER_RUN.gate?3.6:0);}else{g.m.material.opacity=P.power==='peek'?.25:.82;}}
        if(powerLedger){powerLedger.visible=!POWER_RUN.ledger;powerLedger.rotation.y=Math.sin(t)*.12;}
      }

      const originalHeroParts=[];BOP.m.traverse(m=>{if(m.isMesh&&m!==BOP.eyes)originalHeroParts.push(m);});
      const heroTin=T3.mat({color:0xabbec3,emissive:0x13212a}),heroPeek=T3.mat({vcol:true,color:0xe7d0ff,emissive:0x39264b,transparent:true,opacity:.34});heroPeek.depthWrite=false;
      // Painted 32-pixel sky/floor bands give the tin its cartridge-era reflection.
      const tinEnv=new T.CubeTexture(Array.from({length:6},(_,face)=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');if(face===2||face===3){g.fillStyle=face===2?'#dbe3d0':'#6a6954';g.fillRect(0,0,32,32);}else{const gr=g.createLinearGradient(0,0,0,32);for(const [p,col]of [[0,'#4e7085'],[.3,'#c8e0dc'],[.45,'#f6edd2'],[.51,'#435d67'],[.75,'#8b998c'],[1,'#b6a87c']])gr.addColorStop(p,col);g.fillStyle=gr;g.fillRect(0,0,32,32);g.fillStyle='#f8efda';g.fillRect(0,10,32,2);}return c;}));tinEnv.magFilter=tinEnv.minFilter=T.NearestFilter;tinEnv.generateMipmaps=false;tinEnv.needsUpdate=true;heroTin.envMap=tinEnv;heroTin.combine=T.MixOperation;heroTin.reflectivity=.38;heroTin.needsUpdate=true;
      const bonnet=new T.Group();BOP.head.add(bonnet);bonnet.position.y=.8;
      const canopy=new T.Mesh(T3.keep(merge([pt(S.cone(8),0xffc369,0,.55,0,2.2,.42,2.2),pt(S.cyl(6),0xf2e4c3,0,.1,0,.06,.9,.06),pt(S.tor(.04,8),0xb87f65,0,.34,0,2.16,2.16,2.16,Math.PI/2)])),matV());bonnet.add(canopy);
      const tinHat=new T.Mesh(powerIcon('tin'),matV());tinHat.position.y=.85;BOP.head.add(tinHat);
      const peekHat=new T.Mesh(powerIcon('peek'),mat('peekHat',{vcol:true,transparent:true,opacity:.65,emissive:0x322047}));peekHat.material.depthWrite=false;peekHat.position.y=.85;BOP.head.add(peekHat);
      function powerHero(t){
        const active=P.power;
        for(const m of originalHeroParts)m.material=active==='tin'?heroTin:active==='peek'?heroPeek:BOP.heroMat;
        bonnet.visible=active==='brolly'&&mode!=='win';bonnet.scale.setScalar(P.gliding?1:.36);bonnet.rotation.z=P.gliding?Math.sin(t*4)*.045:0;
        tinHat.visible=active==='tin'&&mode!=='win';peekHat.visible=active==='peek'&&mode!=='win';peekHat.rotation.y=Math.sin(t)*.15;
        heroTin.emissive.setHex(0x13212a);heroPeek.opacity=mode==='win'?.85:P.powerT<6&&Math.sin(P.powerT*15)>0?.6:.34;
      }

      // ================================================================ the Biscuit Trials: one authored extra objective per course
      // Course IDs, original acorn IDs and old door thresholds deliberately remain unchanged.
      let TRIAL = null;
      const TRIALS = {
        cove: { name: 'THE BELL BUOY DASH', kind: 'route', time: 26, start: [32, 4], end: [54, 3.9, 5],
          route: [[38, 2.3, 4], [41.5, 2.9, 7], [45, 3.5, 4.5], [48.6, 3.9, 7.5], [54, 3.9, 5]], hint: 'POUND THE BRASS SWITCH BY THE SHORE. JUMP THROUGH FIVE BUOYS BEFORE THE BELL!' },
        peaks: { name: 'THE FLAPJACK POST RUN', kind: 'route', time: 38, start: [-4, 5], end: [4.5, null, 47],
          route: [[0, null, -15], [-20, null, 0], [-21.6, null, 21.6], [0, null, 30.5], [0, null, 48]], hint: 'THE SUMMIT POST SWITCH STARTS A DELIVERY. FOLLOW THE FIVE HOOPS DOWN THE PACKED SNOW.' },
        manor: { name: 'THE BUTLER BELL BLUES', kind: 'bells', start: [-5, -5], end: [0, null, -9],
          bells: [[-7.5, -9], [-2.5, -9], [2.5, -9], [7.5, -9]], tunes: [[0, 2, 1], [0, 2, 1, 3], [3, 0, 2, 1, 3]], hint: 'POUND THE COURTYARD SWITCH. LISTEN, THEN PLAY THE BELLS WITH YOUR PUNCH. THREE TUNES!' },
        tower: { name: 'CLOCK OUT BEFORE TEA', kind: 'route', time: 30, start: [-1.5, 10], end: [...(() => { const [x, z] = tp(3, 10); return [x, 11.6, z]; })()],
          route: [[...(() => { const [x,z]=tp(1,9.5); return [x,4.3,z]; })()], [...(() => { const [x,z]=tp(2,10); return [x,8.3,z]; })()], [...(() => { const [x,z]=tp(2.5,10.5); return [x,9.8,z]; })()], [...(() => { const [x,z]=tp(3,10); return [x,11.3,z]; })()]],
          hint: 'THE BASE SWITCH SLOWS THE CLOCKWORK. CLIMB THROUGH FOUR HOOPS BEFORE TEA TIME!' },
      };
      function buildTrial(w) {
        const d = TRIALS[w]; if (!d) return;
        TRIAL = { def: d, st: 'idle', t: 0, elapsed: 0, next: 0, round: 0, cursor: 0, note: 0, wait: 0.7, flash: [0, 0, 0, 0], gates: [], bells: [] };
        const [x, z] = d.start, y = floorAt(x, z, 99);
        cyl(x, y, z, 0.95, 0.25, { c: 0x6a4a2a, t: 'metal' });
        cyl(x, y + 0.25, z, 0.75, 0.32, { c: 0xc83228, props: { trial: true } });
        deco(ptM(S.tor(0.09, 12), 0xffd85a, M(x, y + 0.59, z, Math.PI / 2, 0, 0, 1.1, 1.1, 1.1)));
        // A raised exclamation mark is legible from every approach; all parts have depth.
        deco(pt(S.box(), 0xffed9a, x, y + 0.6, z - 0.07, 0.13, 0.06, 0.44)); deco(pt(S.box(), 0xffed9a, x, y + 0.6, z + 0.28, 0.13, 0.06, 0.13));
        TRIAL.switch = { x, y: y + 0.57, z };
        const route = d.route || [];
        TRIAL.route = route.map(([x, y, z]) => [x, y == null ? WD.ground(x, z) + 1.4 : y, z]);
        for (let gi = 0; gi < TRIAL.route.length; gi++) {
          const [x, y, z] = TRIAL.route[gi], prev = gi ? TRIAL.route[gi - 1] : [d.start[0], 0, d.start[1]], face = Math.atan2(x - prev[0], z - prev[2]);
          const m = new T.Mesh(T3.keep(new T.TorusGeometry(1.25, 0.13, 6, 14)), T3.mat({ color: 0x7898ac, emissive: 0x101820 })); m.position.set(x, y, z); m.rotation.y = face; m.userData.face = face; WG.add(m); TRIAL.gates.push(m);
          // Grounded striped feet make these course markers, not floating UI.
          for (const side of [-1, 1]) { const px = x + side * 0.98 * Math.cos(face), pz = z - side * 0.98 * Math.sin(face), base = floorAt(px, pz, y), top = y - 0.73; if (top > base) { deco(pt(S.cyl(6), 0xf4d070, px, (base + top) / 2, pz, 0.18, top - base, 0.18)); deco(pt(S.cyl(8), 0x775536, px, base + 0.04, pz, 0.36, 0.08, 0.36)); } }
        }
        for (let i = 0; i < (d.bells || []).length; i++) {
          const [x, z] = d.bells[i], y = WD.ground(x, z);
          cyl(x, y, z, 0.75, 0.28, { c: 0x594052, props: { bell: i } });
          const m = new T.Mesh(T3.keep(merge([
            pt(S.cyl(12, 0.4), 0xe0af52, 0, -0.97, 0, 1.05, 0.85, 1.05, 0, 0, 0, 0.25), pt(S.ball(10), 0xffd480, 0, -0.54, 0, 0.42, 0.22, 0.42),
            pt(S.tor(0.1, 12), 0x815326, 0, -1.38, 0, 1.05, 1.05, 1.05, Math.PI / 2), pt(S.ball(8), 0x6b4734, 0, -1.42, 0, 0.22, 0.22, 0.22),
            pt(S.cyl(6), 0x684457, 0, -0.22, 0, 0.1, 0.5, 0.1),
          ])), T3.mat({ vcol: true })); m.position.set(x, y + 1.9, z); WG.add(m); CAM_MESHES.push(m); TRIAL.bells.push(m);
          cyl(x, y + 0.28, z, 0.58, 1.2, { vis: false }); solidBox(x, y + 1.825, z, 1.5, 0.15, 0.22, 0);
          for (const side of [-1, 1]) { deco(pt(S.cyl(6), 0x684457, x + side * 0.67, y + 1.08, z, 0.1, 1.6, 0.1)); cyl(x + side * 0.67, y + 0.28, z, 0.07, 1.6, { vis: false }); }
          deco(pt(S.box(), 0xffeed0, x, y + 1.9, z, 1.5, 0.15, 0.22));
          // Carved note counts are original geometry, not letters on a flat card.
          for (let n = 0; n <= i; n++) deco(pt(S.box(), 0xf8dfb0, x + (n - i / 2) * 0.17, y + 0.3, z + 0.48, 0.08, 0.05, 0.2));
        }
        const [ax, ay, az] = d.end;
        acorn('trial', d.name, ax, ay == null ? WD.ground(ax, az) + 1.5 : ay, az, { hidden: true, cond: 'trial' });
        sign(x + 2.2, z + 2, 0, [d.name + '.', d.hint, d.kind === 'bells' ? 'LOW TO HIGH, LEFT TO RIGHT. THE NOTCHES ON THE PLINTHS COUNT ONE, TWO, THREE, FOUR.' : 'POUND THE SWITCH AGAIN TO RETRY. YOUR BEST DELIVERY TIME IS KEPT ON FILE A.'], y);
      }
      function trialStart() {
        if (!TRIAL || demo) return;
        Object.assign(TRIAL, { st: TRIAL.def.kind === 'bells' ? 'demo' : 'count', t: 3, elapsed: 0, next: 0, round: 0, cursor: 0, note: 0, wait: 0.75 });
        say(TRIAL.def.kind === 'bells' ? 'LISTEN TO THE BELLS...' : 'READY? THREE...', 1.1, TRIAL.def.kind === 'bells' ? 'PLAY THEM BACK WITH ' + L('b') : TRIAL.def.name);
        K.sfx.tone(660, 0.12, 'triangle', 0.08); saveNow();
      }
      function trialFinish() {
        TRIAL.st = 'done'; const best = prog.records[curW], time = +TRIAL.elapsed.toFixed(2);
        if (TRIAL.def.kind !== 'bells' && (!Number.isFinite(best) || time < best)) prog.records[curW] = time;
        reveal('trial'); saveNow();
      }
      function bellSound(i) { TRIAL.flash[i] = 0.5; K.sfx.tone([523.25, 659.25, 783.99, 1046.5][i], 0.4, 'sine', 0.12); K.sfx.tone([1046.5, 1318.5, 1568, 2093][i], 0.16, 'triangle', 0.025); }
      function chime(i) {
        if (!TRIAL || TRIAL.def.kind !== 'bells') return;
        bellSound(i); if (TRIAL.st !== 'listen') return;
        const tune = TRIAL.def.tunes[TRIAL.round];
        if (i !== tune[TRIAL.cursor]) { TRIAL.st = 'demo'; TRIAL.note = 0; TRIAL.cursor = 0; TRIAL.wait = 1.1; say('THE BUTLER: ONCE MORE, PLEASE!', 1.7, 'SAME TUNE. LISTEN...'); }
        else if (++TRIAL.cursor >= tune.length) { TRIAL.round++; TRIAL.cursor = 0; TRIAL.note = 0; TRIAL.wait = 1.1; if (TRIAL.round >= TRIAL.def.tunes.length) trialFinish(); else { TRIAL.st = 'demo'; say('LOVELY! A LONGER TUNE...', 1.2); } }
        saveNow();
      }
      function tryChime() {
        if (!TRIAL || TRIAL.def.kind !== 'bells') return false;
        const i = TRIAL.def.bells.findIndex(([x, z]) => Math.hypot(P.x - x, P.z - z) < 1.8 && Math.abs(P.y - WD.ground(x, z)) < 1.4);
        if (i < 0) return false; chime(i); return true;
      }
      function trialUpdate(dt) {
        const q = TRIAL; if (!q || demo) return;
        if (q.st === 'count') { const old = Math.ceil(q.t); q.t -= dt; if (Math.ceil(q.t) !== old) { say(q.t > 0 ? String(Math.ceil(q.t)) : 'GO!', 0.8); K.sfx.tone(q.t > 0 ? 660 : 1320, 0.12, 'square', 0.07); } if (q.t <= 0) { q.st = 'run'; q.t = q.def.time; } }
        else if (q.st === 'run') {
          q.t -= dt; q.elapsed += dt; const [x, y, z] = q.route[q.next];
          if (Math.hypot(P.x - x, P.z - z) < 1.55 && Math.abs(P.y + 0.8 - y) < 2.05) { burst(x, y, z, [0xffd85a, 0xffffff], 8, 4, { life: 0.4 }); q.next++; K.sfx.tone(700 + q.next * 110, 0.12, 'triangle', 0.08); if (q.next >= q.route.length) return trialFinish(); }
          if (q.t <= 0) { q.st = 'idle'; q.next = 0; say('THE BELL BEAT YOU!', 2, 'POUND THE SWITCH FOR ANOTHER GO', '#ffa88a'); K.sfx.seq([[67, 0.5], [64, 0.5], [60, 1]], { bpm: 260, vol: 0.07 }); }
        } else if (q.st === 'demo') { q.wait -= dt; if (q.wait <= 0) { const tune = q.def.tunes[q.round]; if (q.note < tune.length) { bellSound(tune[q.note++]); q.wait = 0.62; } else { q.st = 'listen'; say('YOUR TURN! ROUND ' + (q.round + 1) + ' OF 3', 2, L('b') + ' PLAYS THE NEAREST BELL'); } } }
      }
      function trialAnim(dt, t) {
        const q = TRIAL; if (!q) return;
        q.gates.forEach((m, i) => { const active = q.st === 'run' && i === q.next; m.material.color.setHex(active ? 0xffdc50 : i < q.next && q.st === 'run' ? 0x4f6059 : 0x7794a0); m.material.emissive.setHex(active ? 0x664410 : 0x000000); m.rotation.y = m.userData.face + Math.sin(t * 1.5 + i) * 0.04; });
        q.bells.forEach((m, i) => { q.flash[i] = Math.max(0, q.flash[i] - dt); m.material.emissive.setHex(q.flash[i] > 0 ? 0x88602a : 0); m.rotation.z = Math.sin((0.5 - q.flash[i]) * 30) * q.flash[i] * 0.3; });
      }

      // The Cocoa Coaster: arc-length physics in a solid, enclosed ice chute.
      // Geometry and movement sample the same centreline; the chase camera stays inside it.
      const SNOW_RUN=480,SNOW_END=4+SNOW_RUN,SNOW_POINTS=[];
      function snowWidth(z){const u=(z-4)/SNOW_RUN;return 6.4-1.8*sstep(.30,.40,u)*(1-sstep(.59,.69,u));}
      function snowCenter(z){const u=clamp((z-4)/SNOW_RUN,0,1);return {x:22*Math.sin(u*Math.PI*5)*Math.sin(u*Math.PI),y:40*(1-u)+1.2*Math.sin(u*Math.PI*6)*Math.sin(u*Math.PI),z:4+u*SNOW_RUN};}
      for(let i=0,s=0;i<=SNOW_RUN;i++){const p=snowCenter(4+i);if(i){const a=SNOW_POINTS[i-1];s+=Math.hypot(p.x-a.x,p.y-a.y,p.z-a.z);}SNOW_POINTS.push({...p,s});}
      const SNOW_LENGTH=SNOW_POINTS[SNOW_RUN].s;
      function snowAt(s){if(s<0){const a=snowAt(0);return {...a,x:a.x+a.tx*s,y:a.y+a.slope*s,z:a.z+a.tz*s};}s=clamp(s,0,SNOW_LENGTH);let lo=0,hi=SNOW_RUN;while(hi-lo>1){const m=(lo+hi)>>1;if(SNOW_POINTS[m].s<s)lo=m;else hi=m;}const a=SNOW_POINTS[lo],b=SNOW_POINTS[hi],f=(s-a.s)/(b.s-a.s||1),dx=b.x-a.x,dz=b.z-a.z,h=Math.hypot(dx,dz)||1;return{x:lerp(a.x,b.x,f),y:lerp(a.y,b.y,f),z:lerp(a.z,b.z,f),tx:dx/h,tz:dz/h,nx:dz/h,nz:-dx/h,slope:(b.y-a.y)/(b.s-a.s||1),angle:Math.atan2(-dx,-dz)};}
      // The Cocoa Express is a real second centreline, joined inside both mouths.
      const CUT_START=SNOW_LENGTH*.34,CUT_JOIN=SNOW_LENGTH*.66,CUT_POINTS=[];
      {const a=snowAt(CUT_START),d=snowAt(CUT_JOIN),p0={x:a.x-a.nx*3.3,y:a.y,z:a.z-a.nz*3.3},p3={x:d.x-d.nx*3.3,y:d.y,z:d.z-d.nz*3.3},p1={x:p0.x+a.tx*12,y:p0.y+a.slope*12,z:p0.z+a.tz*12},p2={x:p3.x-d.tx*12,y:p3.y-d.slope*12,z:p3.z-d.tz*12};let len=0;
        for(let i=0;i<=160;i++){const t=i/160,u=1-t,b=(k)=>u*u*u*p0[k]+3*u*u*t*p1[k]+3*u*t*t*p2[k]+t*t*t*p3[k],p={x:b('x'),y:b('y'),z:b('z')};if(i){const q=CUT_POINTS[i-1];len+=Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z);}CUT_POINTS.push({...p,s:len});}}
      const CUT_LENGTH=CUT_POINTS[160].s,CUT_GAP=[28,37];
      function cutAt(s){const v=clamp(s,0,CUT_LENGTH);let lo=0,hi=160;while(hi-lo>1){const m=(lo+hi)>>1;if(CUT_POINTS[m].s<v)lo=m;else hi=m;}const a=CUT_POINTS[lo],b=CUT_POINTS[hi],f=(v-a.s)/(b.s-a.s||1),dx=b.x-a.x,dz=b.z-a.z,h=Math.hypot(dx,dz)||1,p={s:v,x:lerp(a.x,b.x,f),y:lerp(a.y,b.y,f),z:lerp(a.z,b.z,f),tx:dx/h,tz:dz/h,nx:dz/h,nz:-dx/h,slope:(b.y-a.y)/(b.s-a.s||1),angle:Math.atan2(-dx,-dz)};if(s<0){p.x+=p.tx*s;p.z+=p.tz*s;p.y+=p.slope*s;}return p;}
      function cutAtZ(z){if(z<CUT_POINTS[0].z||z>CUT_POINTS[160].z)return null;let lo=0,hi=160;while(hi-lo>1){const m=(lo+hi)>>1;if(CUT_POINTS[m].z<z)lo=m;else hi=m;}const a=CUT_POINTS[lo],b=CUT_POINTS[hi];return cutAt(lerp(a.s,b.s,(z-a.z)/(b.z-a.z)));}
      function cutLow(s){return s>=CUT_GAP[0]&&s<=CUT_GAP[1]?-2.5:0;}
      function cutInside(x,y,z,pad=.15){const a=cutAtZ(z);if(!a)return false;const lane=(x-a.x)/a.nx,h=y-a.y;let lo=0,hi=160;while(hi-lo>1){const m=(lo+hi)>>1;if(CUT_POINTS[m].z<z)lo=m;else hi=m;}const distance=lerp(CUT_POINTS[lo].s,CUT_POINTS[hi].s,(z-CUT_POINTS[lo].z)/(CUT_POINTS[hi].z-CUT_POINTS[lo].z));const floor=cutLow(distance),w=h<4.8?3.2:h<7.7?lerp(3.2,2.35,(h-4.8)/2.9):lerp(2.35,0,h-7.7);return h>floor+Math.abs(lane)/22.5+pad&&h<8.7-pad&&Math.abs(lane)<w-pad;}
      // Subtract overlapping convex tunnel cells, leaving one sealed fork surface.
      // Both profiles are sampled on the same Z planes, so their intersections meet exactly.
      function snowTunnel(){const profile=[[-6.4,.65],[-5.4,.12],[0,0],[5.4,.12],[6.4,.65],[6.4,4.8],[4.7,7.7],[0,8.7],[-4.7,7.7],[-6.4,4.8]],pos=[],cols=[],uv=[];
        const section=(z,cut,outer)=>{const i=clamp(Math.floor(z-4),0,SNOW_RUN-1),q=cut?cutAtZ(z):snowAt(lerp(SNOW_POINTS[i].s,SNOW_POINTS[i+1].s,clamp(z-4-i,0,1)));if(!q)return null;const width=cut?3.2:snowWidth(z),gap=cut&&z>=cutAt(CUT_GAP[0]).z&&z<=cutAt(CUT_GAP[1]).z,low=gap?-2.72:0;return profile.map(([x,y],i)=>new T.Vector3(q.x+(x*width/6.4+Math.sign(x)*outer)*q.nx,q.y+y+(i<5?low:0)+(y<1?-outer:outer),z));};
        const planes=(a,b)=>{const center=new T.Vector3();for(const p of [...a,...b])center.add(p);center.multiplyScalar(1/20);const ps=[];for(let i=0;i<10;i++){const p=new T.Plane().setFromCoplanarPoints(a[i],b[i],b[(i+1)%10]);if(p.distanceToPoint(center)>0)p.negate();ps.push(p);}ps.push(new T.Plane(new T.Vector3(0,0,-1),a[0].z),new T.Plane(new T.Vector3(0,0,1),-b[0].z));return ps;};
        const split=(poly,plane)=>{const inside=[],outside=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=plane.distanceToPoint(a),db=plane.distanceToPoint(b);(da<=.00001?inside:outside).push(a);if((da<-.00001&&db>.00001)||(da>.00001&&db<-.00001)){const p=a.clone().lerp(b,da/(da-db));inside.push(p);outside.push(p);}}return[inside,outside];};
        const emit=(poly,c,reverse)=>{for(let i=1;i+1<poly.length;i++){const tri=reverse?[poly[0],poly[i+1],poly[i]]:[poly[0],poly[i],poly[i+1]];for(const p of tri){pos.push(p.x,p.y,p.z);cols.push(...hexA(c));uv.push(p.x*.16,p.z*.2+p.y*.1);}}};
        const surface=(poly,c,other,reverse)=>{if(!other){emit(poly,c,reverse);return;}let inside=poly;for(const plane of other){const parts=split(inside,plane);emit(parts[1],c,reverse);inside=parts[0];if(inside.length<3)break;}};
        const zs=new Set();for(let z=4;z<=SNOW_END;z+=2)zs.add(z);for(const q of CUT_POINTS)zs.add(q.z);for(const d of CUT_GAP)zs.add(cutAt(d).z);const steps=[...zs].filter(z=>z>=4&&z<=SNOW_END).sort((a,b)=>a-b).filter((z,i,a)=>!i||z-a[i-1]>.0001);
        for(let k=0;k+1<steps.length;k++){const z=steps[k],next=steps[k+1];for(const outer of [0,.28]){const a=section(z,false,outer),b=section(next,false,outer),c=section(z,true,outer),d=section(next,true,outer),mainPlanes=planes(a,b),cutPlanes=c&&d?planes(c,d):null;for(let j=0;j<10;j++){const n=(j+1)%10,col=outer?0x43566d:j<4?(Math.floor(z/24)%2?0xd8eaf2:0xc5dfea):j<7?0x6e91ae:0x4c6d91;surface([a[j],b[j],b[n],a[n]],col,cutPlanes,!!outer);if(c&&d)surface([c[j],d[j],d[n],c[n]],outer?0x4b5269:j<4?0xe6c287:j<7?0x6d9fae:0x4a6386,mainPlanes,!!outer);}}}
        for(const z of [4,SNOW_END]){const a=section(z,false,0),b=section(z,false,.28);for(let j=0;j<10;j++)emit([a[j],a[(j+1)%10],b[(j+1)%10],b[j]],0x8cacc1,false);}
        const chunks=new Map();for(let i=0;i<pos.length;i+=9){const key=Math.floor(((pos[i+2]+pos[i+5]+pos[i+8])/3-4)/32);if(!chunks.has(key))chunks.set(key,{p:[],c:[],u:[]});const b=chunks.get(key);for(let j=0;j<9;j++){b.p.push(pos[i+j]);b.c.push(cols[i+j]);}for(let j=0;j<6;j++)b.u.push(uv[i/9*6+j]);}
        SNOW.tunnelChunks=[];for(const [key,b]of chunks){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geo.setAttribute('color',new T.Float32BufferAttribute(b.c,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.u,2));geo.computeVertexNormals();geo.computeBoundingSphere();const mesh=new T.Mesh(geo,mat('coasterIce',{vcol:true,map:TEX.ice(),side:T.DoubleSide}));WG.add(mesh);CAM_MESHES.push(mesh);SNOW.tunnelChunks.push({mesh,lo:key*32+2,hi:key*32+38});}

        for(let d=5;d<CUT_LENGTH;d+=9){const a=cutAt(d);for(const lane of [-2.6,2.6]){deco(pt(S.box(),0x453948,a.x+a.nx*lane,a.y+2.4,a.z+a.nz*lane,.35,.65,.35));deco(pt(S.box(),0xffd785,a.x+a.nx*lane,a.y+2.4,a.z+a.nz*lane,.25,.4,.25));}if(d<CUT_GAP[0]-2||d>CUT_GAP[1]+2)deco(pt(S.box(),0xffdc8a,a.x,a.y+.05,a.z,.2,.06,2,0,a.angle,0));}
        for(const distance of CUT_GAP){const a=cutAt(distance);deco(pt(S.box(),0xf0b466,a.x,a.y+.13,a.z,6.4,.26,.45,0,a.angle,0));}
        const netBeam=(a,b,c)=>{const start=V3(...a),end=V3(...b),dir=end.clone().sub(start),length=dir.length(),q=new T.Quaternion().setFromUnitVectors(V3(0,0,1),dir.normalize()),m=new T.Matrix4().compose(start.add(end).multiplyScalar(.5),q,V3(.12,.12,length));deco(ptM(S.box(),c,m,.2));};
        const netPoint=(d,lane,lift=0)=>{const a=cutAt(d);return[a.x+a.nx*lane,a.y-2.56+Math.abs(lane)/22.5+lift,a.z+a.nz*lane];};
        for(let d=CUT_GAP[0]+.4;d<CUT_GAP[1];d+=.65){netBeam(netPoint(d,-3.15),netPoint(d,0),0x9c7966);netBeam(netPoint(d,0),netPoint(d,3.15),0x9c7966);}for(const lane of [-2,-1,0,1,2])netBeam(netPoint(CUT_GAP[0],lane,.018),netPoint(CUT_GAP[1],lane,.018),0xa6876a);
        const a=cutAt(4);for(const lane of [-2.8,2.8])deco(pt(S.box(),0xffcc7d,a.x+a.nx*lane,a.y+2,a.z+a.nz*lane,.28,4,.28));deco(pt(S.box(),0xe8bd76,a.x,a.y+4.05,a.z,5.9,.3,.4,0,a.angle,0));for(const side of [-1,1])deco(pt(S.box(),0x6d5974,a.x+a.nx*side*2.2,a.y+4.06,a.z+a.nz*side*2.2,.35,.33,.43,0,a.angle,0));
      }
      function snowFloor(x,z){if(z<4&&z>-23&&Math.abs(x)<11.3)return 40;if(z>SNOW_END-2&&z<SNOW_END+21&&Math.abs(x)<12)return 0;if(z<4||z>SNOW_END)return -100;const a=snowCenter(z),b=snowCenter(z+.1),h=Math.hypot(b.x-a.x,.1),lane=(x-a.x)*h/.1;let floor=Math.abs(lane)<snowWidth(z)+.3?a.y+Math.abs(lane)/45:Infinity;const c=cutAtZ(z);if(c){const l=(x-c.x)/c.nx;if(Math.abs(l)<3.2)floor=Math.min(floor,c.y+Math.abs(l)/22.5+cutLow(c.s));}return Number.isFinite(floor)?floor:-100;}
      function snowInside(x,y,z,pad=.15){if(cutInside(x,y,z,pad))return true;if(z<4&&z>-22)return Math.abs(x)<11-pad&&y>40+pad&&y<48.7-pad;if(z>=SNOW_END&&z<SNOW_END+20)return Math.abs(x)<12-pad&&y>pad&&y<9-pad;const a=snowCenter(z),b=snowCenter(z+.1),lane=(x-a.x)*Math.hypot(b.x-a.x,.1)/.1,h=y-a.y,w=h<4.8?6.4:h<7.7?lerp(6.4,4.7,(h-4.8)/2.9):lerp(4.7,0,(h-7.7));return z>=4&&z<SNOW_END&&h>Math.abs(lane)/45+pad&&h<8.7-pad&&Math.abs(lane)<w*snowWidth(z)/6.4-pad;}
      let SNOW=null,SCHOOL=null;
      function snowNew(){return{phase:'lodge',route:'main',cutS:0,cutUsed:false,recoverT:0,s:0,lane:0,laneV:0,speed:0,air:0,jvy:0,jumpBuf:0,hops:0,t:0,race:false,rivalS:0,rivalV:0,rivalAir:0,rivalJvy:0,rivalMask:0,bumps:0,bumpMask:0,mittens:0,finishT:0,mesh:null,mittMeshes:[]};}
      WORLDS.snowhall={song:'peaks',spawn:[0,-12,Math.PI],spawnY:40,bound:530,square:true,ground:snowFloor,killY:-20,fog:[0x344f79,35,90],light:{sky:0xd9eaff,gnd:0x3a405c,amb:.9,sun:.6,dir:[-.4,1,.3]},build(){
        SNOW=snowNew();sky([[0,'#243858'],[1,'#7389aa']],0,0);
        const Y=40;
        box(0,Y-.8,-9,22,.8,26,{t:'wood',c:0xc3a279});
        for(const x of [-11,11])box(x,Y,-9,.5,8.7,26,{t:'wood',c:0x86613e});
        box(0,Y,-22,22,8.7,.5,{t:'wood',c:0x86613e});box(0,Y+8.7,-9,22.5,.4,26.5,{t:'wood',c:0x6f4930});
        for(const x of [-8.9,8.9])box(x,Y,4,4.2,8.7,.55,{t:'ice',c:0x7c9fbd});
        for(const z of [-18,-11,-4]){box(0,Y+7.9,z,22,.4,.5,{t:'wood',c:0x483124});for(const x of [-10.65,10.65]){box(x,Y+2.4,z,.18,2.7,2.6,{c:0xc5e7ec,solid:false});box(x,Y+2.4,z,.25,.12,2.8,{c:0x765236,solid:false});box(x,Y+2.4,z,.25,2.8,.12,{c:0x765236,solid:false});}}
        // A thick woven rug, warm stove, cocoa counter, benches and drying racks.
        const fg=new T.PlaneGeometry(21.8,25.8,16,20);fg.rotateX(-Math.PI/2);const fp=fg.attributes.position,fc=[];for(let i=0;i<fp.count;i++){const x=fp.getX(i),z=fp.getZ(i)-9,warm=clamp(1.2*ex(x,z,-7,-16,24)+.7*ex(x,z,6,-16,18),0,1),c=mix3(hexA(0x8e796b),hexA(0xf0b86b),warm);fp.setXYZ(i,x,40.012,z);fc.push(...c);}fg.setAttribute('color',new T.Float32BufferAttribute(fc,3));fg.computeVertexNormals();WG.add(new T.Mesh(fg,mat('lodgePlanks',{vcol:true,map:TEX.wood()})));
        for(const z of [-13,-9,-5])for(const x of [-2,0,2])deco(pt(S.box(),0xd6ae76,x,Y+.032,z,.9,.005,.9,0,Math.PI/4,0));
        box(0,Y+.014,-10,10,.008,12,{c:0x804646,solid:false});for(const z of [-15,-13,-11,-9,-7,-5])box(0,Y+.024,z,9.4,.004,.13,{c:z%4?0xd6a369:0x3c788b,solid:false});
        for(const x of [-4.6,4.6])box(x,Y+.024,-10,.15,.004,11.5,{c:0xe3bd7d,solid:false});
        cyl(-7,Y,-17,1.1,2.4,{t:'metal',c:0x626a76});cyl(-7,Y+2.4,-17,1.2,.18,{c:0x313e4d});cyl(-7,Y+2.5,-17,.25,5.9,{c:0x414955});box(-7,Y+.4,-15.94,1.1,1.1,.14,{c:0xffa442,solid:false});
        for(let i=0;i<5;i++)box(-7,Y+.45+i*.2,-15.83,1.05,.08,.1,{c:0x3e3940,solid:false});
        box(6,Y,-17,5,1.6,2,{t:'wood',c:0x99643c});box(6,Y+1.6,-17,5.3,.18,2.2,{t:'wood',c:0xd5ac72});
        for(const x of [4.4,5.4,6.4,7.4]){cyl(x,Y+1.79,-17,.22,.45,{c:0xe3c18d,solid:false});deco(pt(S.tor(.12,8),0xb9774e,x+.25,Y+2,-17,.25,.25,.25,0,0,Math.PI/2));}
        for(const x of [-7,7]){box(x,Y+.9,-8,2.6,.25,5,{t:'wood',c:0xae7e50});for(const z of [-9.8,-6.2])for(const dx of [-.9,.9])box(x+dx,Y,z,.2,.9,.3,{t:'wood'});box(x+(x>0?1.2:-1.2),Y+1.15,-8,.18,1.5,5,{t:'wood'});}
        box(-7,Y,-3,3,3,1.5,{t:'wood',c:0x966746});for(let i=0;i<4;i++)box(-7,Y+.4+i*.7,-2.16,2.7,.12,.13,{c:0xd7b382,solid:false});
        for(let i=0;i<3;i++)box(-4.5-i*.9,Y,-3,1,.65+i*.65,1.8,{t:'crate'});
        const mittenSites=[[6,41.95,-17],[-7,43.3,-3],[-7,41.5,-8]];
        mittenSites.forEach(([x,y,z],i)=>{const m=new T.Mesh(merge([pt(S.ball(10),[0xf1ba65,0xc87874,0x66aaba][i],0,.3,0,.55,.7,.4),pt(S.ball(8),0xf3d8ad,.27,.23,0,.28,.38,.3),pt(S.cyl(8),0xf3d8ad,0,0,0,.55,.18,.42)]),matV());m.position.set(x,y,z);WG.add(m);SNOW.mittMeshes.push(m);});
        snowTunnel();
        for(let s=12;s<SNOW_LENGTH;s+=18){const a=snowAt(s),side=(Math.floor(s/18)%2?1:-1);deco(pt(S.box(),0x403b43,a.x+a.nx*side*5.9*snowWidth(a.z)/6.4,a.y+2.5,a.z+a.nz*side*5.9*snowWidth(a.z)/6.4,.55,.9,.55));deco(pt(S.box(),0xffcc78,a.x+a.nx*side*5.9*snowWidth(a.z)/6.4,a.y+2.55,a.z+a.nz*side*5.9*snowWidth(a.z)/6.4,.4,.55,.4));for(const lane of [-3,3])deco(pt(S.box(),0xf2d48c,a.x+a.nx*lane,a.y+.16,a.z+a.nz*lane,.12,.06,1.5,0,a.angle,0));}
        for(const f of [.29,.56,.79]){const a=snowAt(SNOW_LENGTH*f);deco(pt(S.box(),0xd9edf4,a.x,a.y+.22,a.z,9,.44,.6,0,a.angle,0));}
        for(let s=8;s<SNOW_LENGTH-8;s+=8){const a=snowAt(s),lane=Math.sin(s*.035)*2.5;coin(a.x+a.nx*lane,a.y+1,a.z+a.nz*lane);}
        box(0,-.7,SNOW_END+8,24,.7,25,{t:'ice',c:0xd4e4ee});for(const x of [-12,12])box(x,0,SNOW_END+8,.5,9,25,{t:'ice',c:0x728eaf});box(0,0,SNOW_END+20,24,9,.5,{t:'ice',c:0x728eaf});box(0,9,SNOW_END+8,24.5,.4,25,{t:'ice',c:0x526c92});
        for(const x of [-6.5,6.5])box(x,-.3,SNOW_END-2.5,.45,9.3,6.5,{vis:false,nograb:true});for(const x of [-9.7,9.7])box(x,-.3,SNOW_END-5,6.6,9.3,.6,{t:'ice',c:0x728eaf});
        const gb=box(0,-.2,SNOW_END-5.2,12.8,3,.5,{vis:false,props:{nograb:true}});gb.open=true;const gm=new T.Mesh(merge([pt(S.box(),0x806448,0,1.0,0,12.8,.35,.35),pt(S.box(),0xb09a72,0,2.5,0,12.8,.35,.35),...[-6,-4,-2,0,2,4,6].map(x=>pt(S.box(),0xd6bc88,x,1.4,0,.25,2.8,.35))]),matV());gm.position.set(0,-4,SNOW_END-5.2);WG.add(gm);SNOW.gate={b:gb,m:gm};
        for(const x of [-4,4])cyl(x,0,SNOW_END+5,.15,4,{c:0xdab66d});box(0,3.6,SNOW_END+5,8,.65,.15,{c:0xe8ca87,solid:false});
        for(let i=0;i<8;i++)box(-3.5+i,3.61,SNOW_END+5.1,.5,.5,.04,{c:i%2?0x344a67:0xffffe8,solid:false});
        acorn('finish','THE COCOA COASTER',-4,1.5,SNOW_END+10,{hidden:true,cond:'finish'});acorn('rival','FLIPPER CRAMP REMATCH',4,1.5,SNOW_END+10,{hidden:true,cond:'rival'});acorn('cocoa','THREE LOST MITTENS',0,41.4,-16,{hidden:true,cond:'cocoa'});
        npc('tortoise',castN('grandad')+' THE COCOA KEEPER',1,-18,.4,()=>['WELCOME TO THE COCOA COASTER! A CHUTE SO FAST THE COCOA GETS THERE BEFORE THE MUG.',SNOW.mittens===7?'THREE MITTENS! ONE OF THEM MUST BE A SPARE. YOUR ACORN IS ON THE RUG.':'FIND MY THREE LOST MITTENS. LOOK ON THE COUNTER, THE BENCH AND THE DRYING RACK.'],{y:40});
        npc('percy',castN('mate2')+' THE SLOPE SOAP',3,-1,0,()=>['I AM '+castN('mate2')+', THE SLOPE SOAP. CLEAN ROUND THE BENDS. FILTHY AT WINNING.','RACE ME TO THE CHECKERED ARCH! STEER LEFT AND RIGHT. HOLD '+L('c')+' OR PULL BACK TO BRAKE.','HOLD FORWARD TO TUCK. '+L('a')+' HOPS THE THREE SNOW RIDGES. THE LEFT COCOA EXPRESS IS SHORTER. MIND ITS GAP!'],{y:40,snowRival:true,done:()=>snowStart(true)});
        sign(-3,0,Math.PI,['COCOA COASTER. WALK INTO THE CHUTE FOR A PRACTICE RUN.','LEFT / RIGHT STEER. FORWARD TUCKS. '+L('c')+' OR BACK BRAKES. '+L('a')+' HOPS. THE CAMERA FOLLOWS THE CHUTE.'],40);
        sign(0,SNOW_END+14,0,['BACK TO THE FIRE. PRESS '+L('b')+' HERE TO RETURN TO THE LODGE.','RACE THE SLOPE SOAP FOR ANOTHER ACORN. THE SAME COURSE, THE SAME RULES.'],0);
        sign(0,-20,0,['BACK TO THE PEAKS. PRESS '+L('b')+' HERE TO GO OUTSIDE.'],40);const es=cutAt(4),plate=new T.Mesh(merge([pt(S.box(),0x7d5972,0,1.25,0,2.1,.9,.16),pt(S.box(),0xf1d29a,0,1.25,0,2.2,1,.1)]),matV());plate.position.set(es.x-es.tx*.26,es.y+2.95,es.z-es.tz*.26);plate.rotation.y=es.angle;plate.scale.x=1.4;letterSign({mesh:plate,lines:['COCOA EXPRESS.'],expressMarker:true});WG.add(plate);CAM_MESHES.push(plate);
      }};
      function snowStart(race){if(!SNOW)return;Object.assign(SNOW,{phase:race?'count':'run',route:'main',cutS:0,cutUsed:false,recoverT:0,race,s:0,lane:0,laneV:0,speed:4,air:0,jvy:0,jumpBuf:0,hops:0,t:race?3:0,rivalS:0,rivalV:4,rivalAir:0,rivalJvy:0,rivalMask:0,bumps:0,bumpMask:0,finishT:0});P.power=null;P.powerT=0;P.gnd=true;P.st='slide';P.stT=0;music('coaster');snowPlace();snowCamera(0,true);say(race?'READY TO LATHER?':'THE COCOA COASTER!',1.5,'LEFT / RIGHT STEER. FORWARD TUCKS. '+L('c')+' BRAKES. '+L('a')+' HOPS.');saveNow();}
      function snowPlace(){const q=SNOW,a=q.route==='cut'?cutAt(q.cutS):snowAt(q.s);P.x=a.x+a.nx*q.lane;P.z=a.z+a.nz*q.lane;P.y=a.y+Math.abs(q.lane)/(q.route==='cut'?22.5:45)+q.air;P.face=a.angle;P.yaw=a.angle;P.vx=a.tx*q.speed;P.vz=a.tz*q.speed;P.vy=q.jvy;P.gnd=q.air<=(q.route==='cut'?cutLow(q.cutS):0)+.0001;P.st=P.gnd?'slide':q.jvy>0?'jump':'fall';P.plat=null;}
      function snowStep(dt){const q=SNOW;if(!q||!['count','run','recover'].includes(q.phase))return false;
        q.jumpBuf=IN.a?.14:Math.max(0,q.jumpBuf-dt);
        if(q.phase==='recover'){q.t+=dt;q.recoverT+=dt;if(q.race)snowRivalStep(dt);if(q.recoverT>1&&!fading)iris({op:'snowRetry'});return true;}
        if(q.phase==='count'){q.t-=dt;P.vx=P.vz=P.vy=0;if(q.t<=0){q.phase='run';q.t=0;say('GO!',.8);K.sfx.tone(1100,.2,'square',.07);}else if(Math.ceil(q.t)!==Math.ceil(q.t+dt)){say(String(Math.ceil(q.t)),.8);K.sfx.tone(660,.1,'square',.06);}return true;}
        q.t+=dt;if(q.jumpBuf>0&&q.air<=(q.route==='cut'?cutLow(q.cutS):0)+.0001){q.hops++;P.stT=0;q.jvy=7.5;q.jumpBuf=0;snd.jump(0);}
        q.jvy-=22*dt;q.air=Math.max(q.route==='cut'?cutLow(q.cutS):0,q.air+q.jvy*dt);if(q.air===(q.route==='cut'?cutLow(q.cutS):0))q.jvy=0;
        const a=q.route==='cut'?cutAt(q.cutS):snowAt(q.s),ahead=q.route==='cut'?cutAt(q.cutS+2):snowAt(q.s+2),bend=wrapA(ahead.angle-a.angle)/2;
        const brake=IN.cH||IN.y>.3;q.speed=clamp(q.speed+(4-a.slope*18+(IN.y<-.4?2:0)-q.speed*.17-(brake?13:0))*dt,brake?4:7,26);
        q.laneV+=(IN.x*22+bend*q.speed*q.speed*.2)*dt;q.laneV*=Math.exp(-dt*3.4);q.lane+=q.laneV*dt;
        const edge=q.route==='cut'?2:snowWidth(snowAt(q.s).z)-1.05;if(Math.abs(q.lane)>edge){q.lane=clamp(q.lane,-edge,edge);q.laneV*=-.35;q.speed=Math.max(5,q.speed*.72);if(q.bumps<=0){snd.pound();burst(P.x,P.y+.4,P.z,0xd3edff,7,3,{life:.35});q.bumps=.35;}}q.bumps=Math.max(0,q.bumps-dt);
        const old=q.s;
        if(q.route==='cut'){q.cutS=Math.min(CUT_LENGTH,q.cutS+q.speed*dt);q.s=lerp(CUT_START,CUT_JOIN,q.cutS/CUT_LENGTH);
          if(q.cutS>=CUT_GAP[0]&&q.cutS<=CUT_GAP[1]+1&&q.air<-.05){q.cutS=Math.min(q.cutS,CUT_GAP[1]-.6);if(q.air<=-2.49){q.phase='recover';q.recoverT=0;q.speed=0;q.jvy=0;snd.boing();say('THE SAFETY NET!',2,'NO LIFE LOST. BACK TO THE APPROACH.');saveNow();}}
          if(q.cutS>=CUT_LENGTH){q.route='main';q.s=CUT_JOIN;q.lane-=3.3;q.cutUsed=true;prog.records.coasterCut=(prog.records.coasterCut||0)+1;say('COCOA EXPRESS CLEAR!',1.6);K.sfx.seq([[76,.2],[81,.2],[88,.5]],{bpm:300,vol:.07});saveNow();}
        }else{q.s=Math.min(SNOW_LENGTH,q.s+q.speed*dt);if(old<CUT_START&&q.s>=CUT_START&&q.lane<-2.1){const beyond=q.s-CUT_START;q.route='cut';q.cutS=beyond;q.lane+=3.3;q.air=Math.max(0,q.air);say('COCOA EXPRESS!',1.4,'HOP THE GAP. THE NET CATCHES A MISS.');}}

        [.29,.56,.79].forEach((f,i)=>{const s=SNOW_LENGTH*f;if(q.route!=='cut'&&old<s&&q.s>=s&&!(q.bumpMask&(1<<i))){q.bumpMask|=1<<i;if(q.air<.5){q.speed*=.68;K.sfx.noise(.12,.06,800);burst(P.x,P.y+.2,P.z,0xe6f4ff,7,3,{life:.3});}}});
        if(q.race)snowRivalStep(dt);
        snowPlace();P.run+=dt*q.speed;if(K.frame%8===0)burst(P.x-a.tx*.8,P.y+.08,P.z-a.tz*.8,0xe4f6ff,2,1,{grav:1,life:.25,size:.07});if(K.frame%50===0)K.sfx.noise(.12,.025+q.speed*.001,700+q.speed*50);
        if(q.s>=SNOW_LENGTH){q.phase='finish';music('peaks');q.gate.b.open=false;q.gate.m.position.y=0;q.speed=0;P.vx=P.vz=P.vy=0;P.gnd=true;P.st='idle';P.y=0;q.air=0;P.z=SNOW_END+2;reveal('finish');const key=q.race?'coasterRace':'coaster';prog.records[key]=Math.min(Number(prog.records[key])||999,q.t);if(q.race&&q.rivalS<SNOW_LENGTH){reveal('rival');say('YOU WIN! CLEAN AS A WHISTLE!',3,castN('mate2')+': I HAD A FLIPPER CRAMP!');}else say(q.race?'SOAP GETS THERE FIRST!':'COASTER COMPLETE!',3,'FETCH YOUR ACORN. '+L('b')+' BY THE SIGN RETURNS TO THE FIRE.');saveNow();}return true;
      }
      function snowRivalStep(dt){const q=SNOW;const r=snowAt(q.rivalS),turn=Math.abs(wrapA(snowAt(q.rivalS+4).angle-r.angle)),oldR=q.rivalS;for(const f of [.29,.56,.79])if(SNOW_LENGTH*f-q.rivalS>0&&SNOW_LENGTH*f-q.rivalS<3.8&&q.rivalAir===0)q.rivalJvy=7.5;q.rivalJvy-=22*dt;q.rivalAir=Math.max(0,q.rivalAir+q.rivalJvy*dt);if(q.rivalAir===0)q.rivalJvy=0;q.rivalV=clamp(q.rivalV+(5-r.slope*15-q.rivalV*.16-turn*8)*dt,6,23.8);q.rivalS=Math.min(SNOW_LENGTH,q.rivalS+q.rivalV*dt);[.29,.56,.79].forEach((f,i)=>{if(oldR<SNOW_LENGTH*f&&q.rivalS>=SNOW_LENGTH*f&&!(q.rivalMask&(1<<i))){q.rivalMask|=1<<i;if(q.rivalAir<.5)q.rivalV*=.68;}});}
      function snowUpdate(dt){if(!SNOW)return;const q=SNOW;if(q.phase==='lodge'&&P.z>2.4&&Math.abs(P.x)<5.5)snowStart(false);
        if(q.phase==='lodge')q.mittMeshes.forEach((m,i)=>{m.visible=!(q.mittens&(1<<i));if(m.visible&&Math.hypot(P.x-m.position.x,P.z-m.position.z)<1&&Math.abs(P.y+.7-m.position.y)<1.1){q.mittens|=1<<i;m.visible=false;snd.coin();if(q.mittens===7){reveal('cocoa');say('ALL THREE MITTENS!',2,'THE COCOA KEEPER HAS AN ACORN ON THE RUG.');}else say('MITTEN '+[0,1,1,2,1,2,2,3][q.mittens]+' OF 3',1.3);saveNow();}});
        const n=NPCS.find(n=>n.snowRival);if(n?.mesh){if(['count','run','recover'].includes(q.phase)||(q.phase==='finish'&&q.race)){if(q.phase==='finish')snowRivalStep(dt);const a=snowAt(q.rivalS),lane=1.5;n.x=a.x+a.nx*lane;n.y=a.y;n.z=a.z+a.nz*lane;n.mesh.position.set(n.x,n.y+(q.rivalS>=SNOW_LENGTH?0:.2+(q.rivalAir||0)),n.z);n.mesh.rotation.set(q.rivalS>=SNOW_LENGTH?0:-1.2,a.angle,0);n.mesh.visible=q.race;}else{n.x=3;n.y=40;n.z=-1;n.mesh.visible=true;n.mesh.position.set(3,40,-1);n.mesh.rotation.x=0;}}
      }
      function snowCull(){if(SNOW?.tunnelChunks)for(const c of SNOW.tunnelChunks)c.mesh.visible=c.lo<P.z+110&&c.hi>P.z-110;}
      function snowCamera(dt,snap){const q=SNOW;if(!q||!['count','run','recover'].includes(q.phase))return false;const a=q.route==='cut'?cutAt(q.cutS-5.8):snowAt(q.s-5.8),b=q.route==='cut'?cutAt(q.cutS+1.2):snowAt(q.s+1.2);C.pos.set(a.x+a.nx*q.lane*.65,a.y+3.1+q.air*.25,a.z+a.nz*q.lane*.65);C.look.set(P.x+b.tx*.8,P.y+.8,P.z+b.tz*.8);C.yaw=C.want=b.angle;C.ty=P.y;cam.position.copy(C.pos);cam.lookAt(C.look);const f=62+q.speed*.22;if(Math.abs(cam.fov-f)>.01){cam.fov=f;cam.updateProjectionMatrix();}return true;}
      function snowInput(){if(!SNOW||!IN.b||!P.gnd)return false;if(SNOW.phase==='finish'&&Math.hypot(P.x,P.z-(SNOW_END+14))<3){iris({op:'snowTop'});return true;}if(SNOW.phase==='lodge'&&Math.hypot(P.x,P.z+20)<3){iris({op:'snowOut'});return true;}return false;}

      // A real island playground: lessons only count after the coach starts them.
      const SCHOOL_LESSONS=[
        ['HOP','jump','PRESS {a}. LAND IN THE GOLD HOOP.',30,26,4.5],
        ['DOUBLE HOP','jump2','LAND FROM A HOP, THEN PRESS {a} AGAIN QUICKLY.',30,26,4.5],
        ['TRIPLE HOP','jump3','HOP TWICE, THEN RUN AND HOP AGAIN BEFORE THE CHAIN ENDS!',39,27,4.5],
        ['TWIRL','twirl','PRESS {a} AGAIN IN THE AIR. LAND IN THE HOOP.',30,26,4.5],
        ['LONG HOP','long','RUN RIGHT ALONG THE STRIPE. HOLD {c}, THEN PRESS {a}.',38,26,4.5],
        ['BACKFLIP','back','STAND STILL. HOLD {c}, THEN PRESS {a}.',30,26,4.5],
        ['SIDE FLIP','side','RUN, REVERSE DIRECTION AND PRESS {a} TOGETHER.',30,26,4.5],
        ['WALL KICK','wallkick','JUMP AT THE BLUE WALL. PRESS {a} AS YOU TOUCH IT.',35.5,22,4.5],
        ['GROUND POUND','pound','HOP ABOVE THE RED BUTTON. PRESS {c} IN THE AIR.',28,20,4.8],
        ['PUNCH','punch','FACE THE PADDED GRUMPY AND PRESS {b}.',28,31,4.5],
        ['LEDGE GRAB','climb','FALL AGAINST THE LOW LEDGE. {a} CLIMBS; {c} LETS GO.',40,31,7],
        ['CAMERA','camera','PRESS {l} OR {r} TO TURN THE VIEW. STAY IN THE HOOP.',32,19,4.5]
      ];
      function schoolHint(d){return d[2].replace(/\{([abclr])\}/g,(_,b)=>L(b));}
      function schoolNext(){for(let i=0;i<SCHOOL_LESSONS.length;i++)if(!(prog.school&(1<<i)))return i;return SCHOOL_LESSONS.length;}
      function buildSchool(){if(curW!=='hub')return;
        box(34,3.8,26,20,.7,20,{t:'wood',c:0xb99a6e});for(const x of [25,33,42])for(const z of [17,35])cyl(x,-3,z,.35,7.5,{t:'wood',c:0x735034});
        box(15,-.2,31,7,.8,4,{t:'wood',c:0xb5905d});for(const x of [12,15,18])for(const z of [29.3,32.7])cyl(x,-3,z,.22,3.6,{t:'wood',c:0x775137});
        for(let i=0;i<12;i++)box(18+i*.5,-.2,31,.65,.8+i*.35,4,{t:'wood',c:0xc39f6b});
        for(const z of [17,35])for(let x=25;x<=43;x+=3){box(x,4.5,z,.15,1.1,.15,{t:'wood'});if(x<42)box(x+1.5,5.2,z,3,.12,.12,{t:'wood',c:0xf0dca8});}
        for(let x=26;x<43;x+=2)box(x,4.51,26,.9,.025,.15,{c:0xf0d390,solid:false});
        const wall=box(39.8,4.5,22,1,5.8,5,{t:'brick',c:0x8cabc2});wall.schoolWall=true;
        box(41,4.5,31,4,2.5,4,{t:'crate',c:0xd0b18b});
        cyl(28,4.5,20,.85,.3,{c:0xc86e56,props:{schoolButton:true}});cyl(28,4.8,20,.6,.08,{c:0xffd57b,props:{schoolButton:true}});
        const dummy=new T.Mesh(model('grumpy'),matV());dummy.position.set(28,4.8,31);WG.add(dummy);cyl(28,4.5,31,.7,.3,{t:'wood',c:0x715244});
        const ring=new T.Mesh(S.tor(.09,20),mat('lessonRing',{color:0xffd66e,emissive:0x44300c}));ring.scale.setScalar(2.25);ring.rotation.x=Math.PI/2;WG.add(ring);
        SCHOOL={active:false,lesson:schoolNext(),seen:false,airborne:false,ring,dummy};
        npc('tortoise',castN('mate4')+' THE HOP COACH',32,17.8,Math.PI,()=>{const i=schoolNext();return i>=SCHOOL_LESSONS.length?['EVERY MOVE! YOUR FEET DESERVE A DIPLOMA. HAVE A GOLDEN ACORN!']:[prog.schoolMet||prog.school?(SCHOOL.active?'READY FOR ANOTHER GO?':'READY FOR THE NEXT MOVE?'):'WELCOME TO THE SOFT LANDINGS CLUB! I AM COACH '+castN('mate4')+'.', 'LESSON '+(i+1)+': '+SCHOOL_LESSONS[i][0]+'. '+schoolHint(SCHOOL_LESSONS[i]),'DO THE MOVE, THEN LAND IN THE GOLD HOOP. COME BACK TO ME FOR THE NEXT LESSON.'];},{y:4.5,coach:true,done:schoolStart});
        sign(25.5,29,-Math.PI/2,['SOFT LANDINGS CLUB. TWELVE LITTLE LESSONS, ONE BIG ACORN.','TALK TO THE COACH TO BEGIN. THE GOLD HOOP SHOWS WHERE TO FINISH. YOUR COMPLETED LESSONS ARE SAVED.'],4.5);
        sign(41,18,Math.PI,['WALL KICK CORNER. A REAL WALL, SOFT LANDINGS.'],4.5);
        acorn('school','SOFT LANDINGS DIPLOMA',32,6,20,{hidden:schoolNext()<SCHOOL_LESSONS.length,cond:'school'});schoolAnim();
      }
      function schoolStart(){if(!SCHOOL)return;const i=schoolNext();prog.schoolMet=true;SCHOOL.lesson=i;SCHOOL.seen=false;SCHOOL.airborne=false;SCHOOL.active=i<SCHOOL_LESSONS.length;if(!SCHOOL.active){reveal('school');return;}say('LESSON '+(i+1)+': '+SCHOOL_LESSONS[i][0],2,schoolHint(SCHOOL_LESSONS[i]));schoolAnim();saveNow();}
      function schoolAnim(){if(!SCHOOL)return;const q=SCHOOL,d=SCHOOL_LESSONS[q.lesson];q.ring.visible=!!q.active&&!!d;if(d)q.ring.position.set(d[3],d[5]+.12,d[4]);q.ring.material.color.setHex(q.seen?0x8aee9c:0xffd66e);}
      function schoolUpdate(){if(!SCHOOL?.active)return;const q=SCHOOL,d=SCHOOL_LESSONS[q.lesson];if(!d)return;const landed=!!q.airborne&&P.gnd;q.airborne=!P.gnd;const actionLesson=d[1]==='camera'||d[1]==='punch';const inYard=P.x>24&&P.x<45&&P.z>15&&P.z<37&&P.y>4.2;
        if(!inYard){q.seen=false;return;}
        if(d[1]==='camera'?(IN.l||IN.r):d[1]==='punch'?(P.st==='punch'&&Math.hypot(P.x-28,P.z-31)<2.2):d[1]==='pound'?false:P.st===d[1])q.seen=true;
        if(q.seen&&(landed||actionLesson)&&P.gnd&&Math.hypot(P.x-d[3],P.z-d[4])<2.8&&Math.abs(P.y-d[5])<.5){prog.school|=1<<q.lesson;q.active=false;schoolAnim();burst(P.x,P.y+.5,P.z,[0xffd77b,0x8deb99],12,3,{life:.6});K.sfx.seq([[72,.2],[76,.2],[84,.5]],{bpm:250,vol:.08});if(schoolNext()===SCHOOL_LESSONS.length){reveal('school');say('SOFT LANDINGS DIPLOMA!',3,'THE COACH HAS YOUR GOLDEN ACORN.');}else say('LESSON COMPLETE!',2,'PRESS '+L('b')+' BY THE COACH FOR THE NEXT ONE.');saveNow();}
        if(landed&&q.active&&q.seen&&!actionLesson){q.seen=false;say('TRY THAT MOVE AGAIN!',2,'LAND IN THE GOLD HOOP.');}
        schoolAnim();
      }
      function tryLedge(){if(P.gnd||P.vy>0||P.ledgeLock>0||IN.cH||P.power==='tin'||['pound','dead','hurt','ledge','climb'].includes(P.st))return false;const head=prog.opt.big?2.7:P.power==='peek'?2.2:1.95;
        for(let i=0;i<BOXES.length;i++){const b=BOXES[i];if(b.open||b.phase||b.nograb)continue;const top=b.y+b.hh;if(P.y<top-1.65||P.y>top-.85)continue;const dx=P.x-b.x,dz=P.z-b.z,lx=dx*b.cs-dz*b.sn,lz=dx*b.sn+dz*b.cs;let nx=0,nz=0;
          if(Math.abs(lx)<b.hw-.12&&Math.abs(Math.abs(lz)-b.hd)<.7)nz=Math.sign(lz);else if(Math.abs(lz)<b.hd-.12&&Math.abs(Math.abs(lx)-b.hw)<.7)nx=Math.sign(lx);else continue;
          const wx=nx*b.cs+nz*b.sn,wz=-nx*b.sn+nz*b.cs;if(P.vx*wx+P.vz*wz>-.15&&(-Math.sin(P.face)*wx-Math.cos(P.face)*wz)>-.4)continue;
          const x=nx?b.x+nx*(b.hw+.43)*b.cs+lz*b.sn:b.x+lx*b.cs+nz*(b.hd+.43)*b.sn,z=nx?b.z-nx*(b.hw+.43)*b.sn+lz*b.cs:b.z-lx*b.sn+nz*(b.hd+.43)*b.cs;
          if(floorAt(x,z,top-.7)>top-1.65)continue;const ex=x-wx*.95,ez=z-wz*.95;let room=true;for(const o of BOXES){if(o===b||o.open||o.phase)continue;const ox=ex-o.x,oz=ez-o.z;if(Math.abs(ox*o.cs-oz*o.sn)<o.hw+.35&&Math.abs(ox*o.sn+oz*o.cs)<o.hd+.35&&o.y-o.hh<top+head&&o.y+o.hh>top+.05){room=false;break;}}if(!room)continue;
          return catchLedge(i,'box',x,z,ex,ez,top,wx,wz);
        }
        for(let i=0;i<CYLS.length;i++){const c=CYLS[i],top=c.y1,dx=P.x-c.x,dz=P.z-c.z,d=Math.hypot(dx,dz);if(c.r<.8||P.y<top-1.65||P.y>top-.85||Math.abs(d-c.r)>.7||d<.01)continue;const nx=dx/d,nz=dz/d;if(P.vx*nx+P.vz*nz>-.15&&(-Math.sin(P.face)*nx-Math.cos(P.face)*nz)>-.4)continue;const x=c.x+nx*(c.r+.43),z=c.z+nz*(c.r+.43);if(floorAt(x,z,top-.7)>top-1.65)continue;const ex=x-nx*.95,ez=z-nz*.95;let clear=true;for(const b of BOXES){if(b.open||b.phase)continue;const ox=ex-b.x,oz=ez-b.z;if(Math.abs(ox*b.cs-oz*b.sn)<b.hw+.35&&Math.abs(ox*b.sn+oz*b.cs)<b.hd+.35&&b.y-b.hh<top+head&&b.y+b.hh>top+.05){clear=false;break;}}if(!clear)continue;for(const b of CYLS)if(b!==c&&Math.hypot(ex-b.x,ez-b.z)<b.r+.35&&b.y0<top+head&&b.y1>top+.05)clear=false;if(clear)return catchLedge(i,'cyl',x,z,ex,ez,top,nx,nz);}
        return tryTerrainLedge();
      }
      function ledgeClear(x,z,top,support){if(WD.ground(x,z)>top+.05)return false;const head=prog.opt.big?2.7:P.power==='peek'?2.2:1.95;
        for(const b of BOXES){if(b===support||b.open||b.phase&&P.power==='peek')continue;const dx=x-b.x,dz=z-b.z;if(Math.abs(dx*b.cs-dz*b.sn)<b.hw+.35&&Math.abs(dx*b.sn+dz*b.cs)<b.hd+.35&&b.y-b.hh<top+head&&b.y+b.hh>top+.05)return false;}
        for(const c of CYLS)if(c!==support&&Math.hypot(x-c.x,z-c.z)<c.r+.35&&c.y0<top+head&&c.y1>top+.05)return false;return true;
      }
      function dropLedge(l){P.ledge=null;P.ledgeLock=.25;P.st='fall';P.vx=clamp(l.vx||0,-12,12);P.vz=clamp(l.vz||0,-12,12);P.vy=Math.min(-2,l.vy||0);P.poundBuf=0;P.gnd=false;}
      function followLedge(l,s){const point=(q,p)=>{const a=q.ry||0,c=Math.cos(a),n=Math.sin(a);return{x:q.x+p[0]*c+p[1]*n,z:q.z-p[0]*n+p[1]*c,top:q.k==='box'?q.y+q.hh:q.y1};},h=point(s,l.attach.hang),e=point(s,l.attach.end),change=h.top-l.top;
        l.x=h.x;l.z=h.z;l.ex=e.x;l.ez=e.z;l.top=h.top;l.y=h.top-1.3;l.fromY+=change;P.face=Math.atan2(h.x-e.x,h.z-e.z);P.yaw=P.face;
        const time=curW==='tower'?motionClock:clock,rate=curW==='tower'&&TRIAL?.st==='run' ? .35 : 1,prev={...s},next={...s};s.place(prev,time-.001);s.place(next,time+.001);const p=point(prev,l.attach.hang),n=point(next,l.attach.hang);l.vx=(n.x-p.x)/.002*rate;l.vy=(n.top-p.top)/.002*rate;l.vz=(n.z-p.z)/.002*rate;
      }
      function tryTerrainLedge(){if(P.swimming||WD.swimEnabled&&P.y<(WD.water||0)-.5)return false;const dirs=[],speed=Math.hypot(P.vx,P.vz);if(speed>.5)dirs.push([P.vx/speed,P.vz/speed]);dirs.push([-Math.sin(P.face),-Math.cos(P.face)]);
        for(const [dx,dz] of dirs){let lo=0,hi=1.05,top=WD.ground(P.x+dx*hi,P.z+dz*hi);if(top<-100||P.y<top-1.65||P.y>top-.85||WD.ground(P.x,P.z)>top-1.8)continue;
          for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(WD.ground(P.x+dx*mid,P.z+dz*mid)>top-.35)hi=mid;else lo=mid;}
          const ex=P.x+dx*hi,ez=P.z+dz*hi;if(top-WD.ground(P.x+dx*(lo-.04),P.z+dz*(lo-.04))<1.8)continue;
          const valid=(x,z)=>WD.ground(x,z)>top-.35?1:0,gx=valid(ex+.06,ez)-valid(ex-.06,ez),gz=valid(ex,ez+.06)-valid(ex,ez-.06),len=Math.hypot(gx,gz);if(!len)continue;const nx=-gx/len,nz=-gz/len,x=ex+nx*.43,z=ez+nz*.43,tx=ex-nx*.52,tz=ez-nz*.52;
          top=WD.ground(tx,tz);if(top<-100||floorAt(x,z,top-.7)>top-1.65||!ledgeClear(tx,tz,top,null))continue;return catchLedge(-1,'terrain',x,z,tx,tz,top,nx,nz);
        }return false;
      }
      // The hang height and reaching arms meet the actual glove surface at the
      // rim, with the boots still below it. The same pose fits round ledges.
      function catchLedge(i,kind,x,z,ex,ez,top,nx,nz){P.ledge={i,kind,x,y:top-1.3,z,ex,ez,top,t:0,grabT:0,fromY:P.y};const support=(kind==='box'?BOXES:kind==='cyl'?CYLS:[])[i];if(support?.mv){const a=support.ry||0,c=Math.cos(a),sn=Math.sin(a),local=(px,pz)=>[(px-support.x)*c-(pz-support.z)*sn,(px-support.x)*sn+(pz-support.z)*c];P.ledge.attach={hang:local(x,z),end:local(ex,ez)};}P.x=x;P.z=z;P.vx=P.vy=P.vz=0;P.gnd=false;P.st='ledge';P.stT=0;P.gliding=false;P.face=Math.atan2(nx,nz);P.yaw=P.face;P.plat=null;P.wallT=0;K.sfx.tone(470,.065,'triangle',.06);return true;}
      function ledgeStep(dt){const l=P.ledge;if(!l||!['ledge','climb'].includes(P.st))return false;
        if(l.attach){const support=(l.kind==='box'?BOXES:CYLS)[l.i];if(!support){dropLedge(l);return false;}followLedge(l,support);if(!ledgeClear(l.ex,l.ez,l.top,support)||floorAt(l.x,l.z,l.top-.7)>l.y+.05){dropLedge(l);return false;}}
        if(P.st==='ledge'){P.x=l.x;P.z=l.z;l.grabT=Math.min(.1,(l.grabT||0)+dt);P.y=lerp(l.fromY??l.y,l.y,sstep(0,.1,l.grabT));P.vx=P.vy=P.vz=0;if(IN.c){dropLedge(l);IN.c=false;return false;}if(l.grabT>=.1&&P.grabBuf>0){P.st='climb';P.stT=0;l.t=0;P.grabBuf=0;K.sfx.tone(650,.08,'triangle',.05);}return true;}
        l.t+=dt;const lift=sstep(0,.18,l.t),across=sstep(.1,.32,l.t);P.x=lerp(l.x,l.ex,across);P.z=lerp(l.z,l.ez,across);P.y=lerp(l.y,l.top,lift);P.vx=P.vy=P.vz=0;
        if(l.t>=.32){P.y=l.top;P.gnd=true;P.plat=(l.kind==='cyl'?CYLS:BOXES)[l.i]||null;P.st='idle';P.stT=0;P.ledge=null;P.ledgeLock=.2;P.chain=P.chainT=0;P.land=.06;}return true;
      }

      // ---- Treacle Troubleworks. Appended to keep all old world seeds and indices stable.
      let FD = null;
      function foundryGround(x,z){const dx=Math.abs(x+18),dz=Math.abs(z-21);return dx<=4&&dz<=4&&dx+dz<=6.8?1.65:-150;}
      const FOUNDRY_VALVES=[[-33,2,-7],[-18,2,-26],[31,1,-21]];
      const FOUNDRY_GANTRY=[[14,1,8],[21,3,8],[28,5,8],[33,7,1],[33,9,-7],[27,11,-12]];
      WORLDS.foundry={song:'foundry',spawn:[0,34,0],spawnY:1,exitAt:[-10,36],ground:foundryGround,killY:-24,lava:-2,bound:52,square:true,
        fog:[0x72515f,45,130],light:{sky:0xffe7c6,gnd:0x463d63,amb:.85,sun:.75,dir:[-.5,1,.4]},build(){
          FD={valves:0,valveTimes:[-1,-1,-1],relay:'idle',elapsed:0,best:0,boss:{st:gotAc('foreman')?'gone':'idle',hp:gotAc('foreman')?0:3,t:0,n:0,ringId:0,met:false},waves:[],valveMeshes:[],steam:[]};
          sky([[0,'#493f69'],[.48,'#b07979'],[.62,'#eab29b'],[1,'#eab29b']],6,58,0xf9c8ac);
          farRing(11,100,155,20,35,0x66435d,0x9c646b,-7);seaPlane(-2,'lava',0x9f6026,1);
          // A real height-field mesa: capped rock geometry, vertical cliffs, no box/cylinder collider.
          const rim=[[-2.8,-4],[2.8,-4],[4,-2.8],[4,2.8],[2.8,4],[-2.8,4],[-4,2.8],[-4,-2.8]],pos=[],cols=[];
          const vertex=(x,y,z,c)=>{pos.push(x,y,z);const cc=new T.Color(c);cols.push(cc.r,cc.g,cc.b);};
          for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length],ax=a[0]-18,az=a[1]+21,bx=b[0]-18,bz=b[1]+21,c=i%2?0xc6b080:0xbca477;vertex(-18,1.65,21,0xd0bf8c);vertex(bx,1.65,bz,c);vertex(ax,1.65,az,c);for(const q of [[ax,1.65,az],[bx,1.65,bz],[bx,-6,bz],[ax,1.65,az],[bx,-6,bz],[ax,-6,az]])vertex(...q,q[1]>0?0x8f7561:0x4f4651);vertex(-18,-6,21,0x4f4651);vertex(ax,-6,az,0x4f4651);vertex(bx,-6,bz,0x4f4651);}
          const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(cols,3));geo.computeVertexNormals();const rock=new T.Mesh(geo,matV());WG.add(rock);CAM_MESHES.push(rock);coinRing(-18,2.6,21,2.5,9);
          const pad=(x,z,w,d,top=1)=>{box(x,-6,z,w,top+6,d,{t:'brick',c:0x78788b});box(x,top-.18,z,w+.1,.18,d+.1,{t:'metal',c:0xc4aba2});};
          pad(0,29,24,20);pad(0,5,18,29);pad(-25,-16,22,30,2);pad(25,-17,22,26);
          box(-14,0,0,13,1,4,{t:'metal',c:0xd7b866});for(const [x,h] of [[-11.7,.35],[-13,.7],[-14.2,1]])box(x,1,0,1.7,h,4,{t:'metal',c:0xc8b189});box(14,0,-14,13,1,4,{t:'metal',c:0xd7b866});
          box(0,0,-16,5,1,11,{t:'metal',c:0xc9ae70});box(0,1,-20.5,5,.5,3,{t:'metal',c:0xc9ae70});
          cyl(0,-6,-32,11,8,{t:'brick',c:0x8b8496,seg:28});deco(pt(S.tor(.035,32),0xffd68a,0,2.03,-32,21,21,21,Math.PI/2));
          // The foundry silhouette: hollow-looking but fully capped stacks, pipes and riveted vats.
          for(const [x,z,h] of [[-27,-21,20],[-16,-33,9],[37,-26,14]]){
            cyl(x,2,z,2.6,h,{t:'brick',c:0x9c6c70,seg:14});cyl(x,h+1.7,z,3.1,.4,{t:'metal',c:0xe1b47d});
            deco(pt(S.cyl(14),0x302d43,x,h+2.12,z,4.7,.05,4.7));
            for(let k=0;k<3;k++){const m=new T.Mesh(merge([pt(S.ball(8),0xd6b4ae,0,0,0,1.5,1.1,1.5)]),matV());WG.add(m);FD.steam.push({m,x,z,y:h+3,k});}
          }
          for(let i=0;i<18;i++){const a=1.1+i*.57,y=2+i*1.08;box(-27+Math.sin(a)*4.2,y-.3,-21+Math.cos(a)*4.2,2,.3,2,{t:'metal',c:i%2?0x83b4af:0xd3b87d});coin(-27+Math.sin(a)*4.2,y+.8,-21+Math.cos(a)*4.2);}
          box(-27,22,-21,6,.5,6,{t:'metal',c:0x83b4af});acorn('stack','THE TOP OF THE POPPING STACK',-27,23.2,-21);
          for(const [x,z] of [[-31,-15],[30,-26],[18,-26],[5,24],[-7,28]]){
            cyl(x,1,z,1.7,2,{t:'metal',c:0xc48c54});cyl(x,2.85,z,1.9,.25,{c:0x5c515b});
            deco(pt(S.tor(.06,12),0x76bdb8,x,3.15,z,2.5,2.5,2.5,Math.PI/2));
            deco(pt(S.cyl(8),0x486b75,x,2,z+2.3,.5,4,.5,Math.PI/2));
          }
          // Boiler pipe elbows, gauge faces and maintenance stripes make the route read as a working sweet factory.
          for(const [x,z] of [[-9,15],[10,-15],[-19,-3]]){
            solidBox(x,1.27,z,5,.66,.66,0);solidBox(x+2.5,1.6,z,.8,2.55,.8,0);
            deco(pt(S.cyl(8),0x789fa2,x,1.6,z,.65,5,.65,0,0,Math.PI/2));
            deco(pt(S.cyl(8),0x789fa2,x+2.5,2.8,z,.65,2.5,.65));
            deco(pt(S.ball(8),0x88aaa6,x+2.5,1.6,z,.8,.8,.8));
            deco(pt(S.cyl(12),0xe9d3a0,x+2.5,3.9,z-.35,.75,.16,.75,Math.PI/2));
            deco(pt(S.box(),0x4b465e,x+2.5,3.9,z-.45,.07,.42,.04,0,0,-.65));
          }
          // Two ferries and an elevator give safe alternative routes across the syrup.
          mover('box',4,.5,4,{t:'metal',c:0x77b8b0},(s,t)=>{s.x=-18+Math.sin(t*.45)*7;s.y=1.5;s.z=12;});
          mover('box',4,.5,4,{t:'metal',c:0x77b8b0},(s,t)=>{s.x=-28;s.y=1.75;s.z=5+Math.sin(t*.5)*9;});
          mover('box',4,.5,4,{t:'metal',c:0x77b8b0},(s,t)=>{s.x=17;s.y=2.75+Math.sin(t*.55)*1.5;s.z=-4;});
          FOUNDRY_GANTRY.forEach(([x,y,z],i)=>{box(x,-4,z,3.5,y+4,3.5,{t:'brick',c:0x65556e});box(x,y,z,5,.4,5,{t:'metal',c:0x91bcb4,props:{belt:i%2?[.8,0]:[0,.8]}});coinRing(x,y+1.3,z,1.1,5);});
          box(8,1.015,8,1.7,.03,3.5,{c:0xa2d9c8,solid:false});
          acorn('gantry','THE GREAT GANTRY TEA BREAK',27,12.8,-12,{hidden:true,cond:'gantry'});
          const starter=npc('tortoise',`SHIFT BOSS ${castN('mate1')}`,5,11,0,()=>gotAc('gantry')||FD.relay==='won'?['A PROPER TEA BREAK! NICE GANTRY WORK.']:['THE TEA IS GETTING COLD UP ON THE GANTRY!','THE MINT GANTRY STARTS ON YOUR RIGHT. JUMP FROM THE BRASS EDGE.','TAKE A SHORT RUN-UP FOR EACH GAP. HOLD '+L('a')+' FOR HEIGHT.','REACH THE TOP IN 45 SECONDS. READY? OFF YOU HOP!'],{y:1,done:()=>{if(gotAc('gantry'))return;FD.relay='run';FD.elapsed=0;P.inv=Math.max(P.inv,1);say('TEA BREAK DASH!',2,'45 SECONDS. FOLLOW THE MINT PLATFORMS.');saveNow();}});starter.foundryFriend=true;
          FOUNDRY_VALVES.forEach(([x,y,z],i)=>{cyl(x,y,z,1.1,.35,{t:'metal',c:0x638f97,props:{foundryValve:i}});const m=new T.Mesh(merge([pt(S.tor(.1,12),0xeab767,0,0,0,1.5,1.5,1.5,Math.PI/2),pt(S.box(),0xf5dd9b,0,0,0,1.5,.12,.12),pt(S.box(),0xf5dd9b,0,0,0,.12,.12,1.5)]),matV());m.position.set(x,y+.45,z);WG.add(m);FD.valveMeshes.push(m);coinRing(x,y+.9,z,2.3,8);});
          cyl(-25,2,-9,2.9,.4,{t:'metal',c:0xb58c74});FD.cooler=new T.Mesh(new T.CylinderGeometry(2.65,2.65,.06,20),mat('foundryCooler',{map:TEX.water(),color:0xffac68,emissive:0x53301b}));FD.cooler.position.set(-25,2.43,-9);WG.add(FD.cooler);deco(pt(S.tor(.06,20),0xeac589,-25,2.5,-9,5.8,5.8,5.8,Math.PI/2));
          acorn('valves','THREE TURNS FOR THE COOLER',-25,3.2,-9,{hidden:true,cond:'cooler'});
          acorn('foreman','THE BIG SOFTY COOLS DOWN',0,3.3,-27,{hidden:true,cond:'foreman'});
          acorn('reds','EIGHT RED HOT PAY PACKETS',0,2.3,24,{hidden:true,cond:'reds'});
          acorn('c100','A HUNDRED SWEET PENNIES',0,2.3,28,{hidden:true,cond:'c100'});
          for(const [x,y,z] of [[-8,2,35],[8,2,22],[-18,2.65,21],[-33,3,-4],[-27+Math.sin(6.23)*4.2,12.72,-21+Math.cos(6.23)*4.2],[28,6.4,8],[33,10.4,-7],[7,3,-29]])red(x,y,z);
          // More than 130 coins, spread across six readable route loops, not one farming ring.
          for(const [x,z,r,y] of [[0,29,8,2],[0,7,6,2],[-25,-15,7,3],[25,-19,7,2],[0,-32,8,3]])coinRing(x,y,z,r,14);
          coinLine(0,2,19,0,2,-17,15);coinLine(-20,3,-4,-33,3,-27,10);coinLine(17,2,-10,33,2,-23,10);
          for(const [x,z] of [[-5,10],[6,17],[-20,-9],[29,-16]])enemy('kettle',x,z,{range:10,st:'idle',t:0,h:1.4,y0:x<-10?2:1});
          const boss=npc('foreman',`FOREMAN ${castN('mate4')}`,0,-34,Math.PI,[`I'M FOREMAN ${castN('mate4')}. THEY CALL ME THE BIG SOFTY. I AM NOT SOFT!`,'HOP OVER MY STEAM RINGS. I NEED A LITTLE COOLING BREAK AFTER EACH BATCH.','WHEN MY LID TURNS BLUE, BACKFLIP ONTO IT AND GROUND POUND. THREE GOOD CLANGS. NO PUNCHING HOT METAL!'],{y:2,r:0,foundryBoss:true,done:()=>foundryBossStart()});
          FD.bossNpc=boss;FD.lidSolid=cyl(0,2,-34,1.65,3.63,{vis:false,props:{foundryLid:true}});
          sign(5,33,0,['TREACLE TROUBLEWORKS.','SIX ACORNS. HOT SYRUP BOUNCES YOU BACK TO SAFETY, BUT TAKES A BITE.','THE GREEN GANTRY IS EAST, THE POPPING STACK WEST. THE FOREMAN GUARDS THE FAR COOLING YARD.'],1);
          sign(-9,2,.6,['COOLING VALVES.','GROUND POUND ALL THREE BRASS WHEELS TO COOL THE TREACLE. THE LAST ONE IS OVER THE EAST BRIDGE.'],1);
          for(const x of [-.26,.26])deco(pt(S.box(),0x8ed9cf,x,2.025,-31.25,.24,.035,.55));
          sign(5,-23,0,['THE BIG SOFTY.','HE TELLS BEFORE EVERY STOMP. JUMP OVER THE RING.','THE MINT BOOTS FACE AWAY. HOLD '+L('c')+' AND PRESS '+L('a')+' TO BACKFLIP.','BLUE LID MEANS COOL. PRESS '+L('c')+' IN THE AIR TO POUND IT.'],2);
          life(-32,3,-29);life(30,2,-12);
        }};
      function foundryInit(){if(!FD)return;if(FD.boss.st==='gone')FD.lidSolid.y1=2;const n=FD.bossNpc;n.mesh.scale.setScalar(2.4);n.mesh.visible=FD.boss.st!=='gone';FD.lid=new T.Mesh(merge([pt(S.cyl(14),0x96e4e6,0,0,0,2.7,.16,2.7),pt(S.tor(.06,14),0xf6e3a2,0,.1,0,2.2,2.2,2.2,Math.PI/2)]),mat('foundryLid',{vcol:true,emissive:0x17465b}));FD.lid.position.set(0,5.55,-34);WG.add(FD.lid);FD.tell=new T.Mesh(new T.TorusGeometry(2.5,.06,5,32),mat('foundryTell',{color:0xffcc73,lit:false}));FD.tell.rotation.x=Math.PI/2;FD.tell.position.set(0,2.06,-34);WG.add(FD.tell);FD.ringMeshes=Array.from({length:5},()=>{const m=new T.Mesh(new T.TorusGeometry(1,.12,5,36),mat('foundryWave',{color:0xffeac4,lit:false}));m.rotation.x=Math.PI/2;WG.add(m);return m;});foundryAnim();}
      function foundryBossStart(){if(!FD||FD.boss.st==='gone')return;Object.assign(FD.boss,{st:'tell',t:0,n:0});C.want=C.yaw=Math.atan2(P.x,P.z+34);FD.waves=[];P.inv=Math.max(P.inv,1);music('foundryBoss');saveNow();}
      function foundryPound(o){if(!FD)return;if(Number.isInteger(o.foundryValve)){const bit=1<<o.foundryValve;if(!(FD.valves&bit)){FD.valves|=bit;FD.valveTimes[o.foundryValve]=clock;burst(o.x,o.y1+.3,o.z,[0x99e6d6,0xffffff],14,4);K.sfx.seq([[72, .25],[79,.25],[84,.5]],{bpm:280,vol:.08});say('COOLING VALVE '+(FD.valves.toString(2).split('1').length-1)+' TURNED',1.3);if(FD.valves===7)reveal('cooler');saveNow();}}
        if(o.foundryLid&&FD.boss.st==='vent'){const b=FD.boss;b.hp--;b.st=b.hp?'hurt':'defeated';b.t=0;FD.waves=[];shake=.24;flash=.12;prog.score+=200;burst(0,5.6,-34,[0xffd374,0xffffff],20,7);K.sfx.tone(130,.3,'triangle',.1,0,65);say(b.hp?'CLANG! '+b.hp+' TO GO!':'THE BIG SOFTY COOLS DOWN!',2);saveNow();}}
      function foundryUpdate(dt){if(!FD||P.st==='dead')return;const b=FD.boss;
        if(FD.relay==='run'){FD.elapsed+=dt;if(Math.hypot(P.x-27,P.z+12)<2.4&&P.y>11&&P.gnd){FD.relay='won';prog.records.foundry=Math.min(Number(prog.records.foundry)||999,FD.elapsed);reveal('gantry');saveNow();}else if(FD.elapsed>45){FD.relay='lost';say('THE TEA WENT COLD!',2,'TALK TO THE SHIFT BOSS TO TRY AGAIN.');}}
        if(!['idle','intro','gone','defeated'].includes(b.st)&&Math.hypot(P.x,P.z+32)>16){b.st='idle';b.t=0;b.n=0;FD.waves=[];music('foundry');}
        if(b.st==='idle'&&Math.hypot(P.x,P.z+32)<9&&P.gnd&&P.y>=1.8){if(b.met)foundryBossStart();else{b.met=true;b.st='intro';startTalk(FD.bossNpc);}return;}
        if(!['idle','intro','gone'].includes(b.st))b.t+=dt;
        if(b.st==='tell'&&b.t>=1.15){b.st='strike';b.t=0;FD.waves.push({r:.3,id:b.ringId++});shake=.16;K.sfx.noise(.2,.12,240);burst(0,2.1,-34,0xffebc2,12,5,{ring:true});}
        else if(b.st==='strike'&&b.t>=1.65){b.n++;b.st=b.n<5-b.hp?'tell':'vent';b.t=0;if(b.st==='vent'){say('THE LID IS COOL!',2,'BACKFLIP ONTO IT. THEN GROUND POUND.');K.sfx.tone(1050,.25,'sine',.07);}}
        else if(b.st==='vent'&&b.t>=5){b.st='tell';b.t=0;b.n=0;say('HEATING UP...',1.15,'STEP OFF THE LID. NEXT STOMP IS COMING.');}
        else if(b.st==='hurt'&&b.t>=1){b.st='tell';b.t=0;b.n=0;}
        else if(b.st==='defeated'&&b.t>=1.6){b.st='gone';FD.lidSolid.y1=2;reveal('foreman');music('foundry');saveNow();}
        for(const r of FD.waves){r.r+=dt*8;const d=Math.hypot(P.x,P.z+34);if(Math.hypot(P.x,P.z+32)<11.4&&Math.abs(d-r.r)<.55&&P.y<3.1&&P.y>1.5)hurt(1,0,-34);}FD.waves=FD.waves.filter(r=>r.r<14.5);
        if(['tell','strike'].includes(b.st)&&b.t>.85&&P.gnd&&P.plat===FD.lidSolid)hurt(1,0,-34);
        foundryAnim();
      }
      function foundryCamera(dt,snap){
        if(!FD||!['tell','strike','vent','hurt'].includes(FD.boss.st)||Math.hypot(P.x,P.z+32)>12.5)return false;
        C.yaw+=wrapA(C.want-C.yaw)*(snap?1:1-Math.exp(-dt*7));
        C.ty+=(P.y-C.ty)*(snap?1:1-Math.exp(-dt*6));const mx=P.x*.65,mz=P.z*.65-34*.35,my=(C.ty+1.1)*.65+4.4*.35,height=Math.max(8,C.ty+5.5),reach=13;
        WG.updateMatrixWorld(true);let best=-1,chosen=null,chosenYaw=C.yaw;
        for(const offset of [0,.65,-.65,1.3,-1.3,2,-2,Math.PI]){const a=C.yaw+offset,x=mx+Math.sin(a)*reach,z=mz+Math.cos(a)*reach;let room=1;for(const h of [.35,1.2,2])room=Math.min(room,cameraRoom(P.x,P.y+h,P.z,x,height,z));const score=room*12-Math.abs(offset)*.3;if(score>best){best=score;chosen=[x,height,z];chosenYaw=a;}if(offset===0&&room>=.995)break;}
        if(Math.abs(wrapA(chosenYaw-C.yaw))>.01){C.want=C.yaw=chosenYaw;}
        C.pos.set(...chosen);C.look.set(mx,my,mz);cam.position.copy(C.pos);cam.lookAt(C.look);return true;
      }
      function foundryAnim(){if(!FD?.lid)return;const b=FD.boss,n=FD.bossNpc,t=clock;
        FD.valveMeshes.forEach((m,i)=>{const f=FD.valves&(1<<i)?sstep(0,.3,t-(FD.valveTimes[i]??0)):0;m.rotation.y=f*Math.PI/2;m.scale.y=1-f*.55;});
        FD.cooler.material.color.setHex(FD.valves===7?0xa9ffe2:0xffac68);FD.cooler.material.emissive.setHex(FD.valves===7?0x164d56:0x53301b);
        FD.steam.forEach(({m,x,y,z,k})=>{const f=(t*.3+k/3)%1;m.position.set(x+Math.sin(t+k)*f,y+f*5,z);m.userData.steamScale=.6+f*2;m.scale.setScalar(m.userData.steamScale);});
        n.mesh.visible=b.st!=='gone';const squash=b.st==='tell'?Math.sin(Math.min(1,b.t/1.15)*Math.PI)*.09:b.st==='defeated'?Math.min(.99,b.t/1.6):0;n.mesh.scale.set(2.4*(1+squash*.5),2.4*(1-squash),2.4*(1+squash*.5));
        FD.lid.visible=!['gone','defeated'].includes(b.st);FD.lid.material.emissive.setHex(b.st==='vent'?0x3c9aaa:0x4f1d05);FD.lid.material.color.setHex(b.st==='vent'?0xc9ffff:0xe79559);FD.lid.position.y=5.55;
        FD.tell.visible=b.st==='tell';FD.tell.scale.setScalar(.7+Math.min(1,b.t/1.15)*1.7);
        FD.ringMeshes.forEach((m,i)=>{const r=FD.waves[i];m.visible=!!r;if(r){m.position.set(0,2.18,-34);m.scale.setScalar(r.r);}});
      }

      // ================================================================ progress (saved) and the visit (not saved)
      const prog = { school:0, schoolMet:false, powers: {}, records: {}, got: {}, ac: {}, score: 0, lives: 4, opt: { mus: 1, cam: 1, easy: 0 }, hs: [], boss: 0, started: 0, w: 'hub', p: null, door: -1 };
      (function loadProg() {
        const s = K.load(); if (!s || typeof s !== 'object') return;prog.school=(s.school|0)&4095;prog.schoolMet=!!s.schoolMet||prog.school>0;
        if(s.powers&&typeof s.powers==='object')for(const k of Object.keys(POWER_DEFS))if(Object.prototype.hasOwnProperty.call(s.powers,k))prog.powers[k]=s.powers[k]?1:0;
        if (s.records && typeof s.records === 'object') prog.records = s.records;
        prog.got = s.got && typeof s.got === 'object' ? s.got : {}; prog.ac = s.ac && typeof s.ac === 'object' ? s.ac : {};
        prog.score = Math.max(0, s.score | 0); prog.lives = s.lives != null ? clamp(s.lives | 0, 0, 99) : 4;
        if (s.opt) Object.assign(prog.opt, s.opt); if (Array.isArray(s.hs)) prog.hs = s.hs.slice(0, 8);
        prog.boss = s.boss | 0; prog.w = WORLDS[s.w] ? s.w : 'hub'; prog.p = Array.isArray(s.p) ? s.p : null; prog.door = s.door == null ? -1 : s.door;
        prog.started = s.v2 ? (s.started | 0) : (Object.keys(prog.got).length || s.score ? 1 : 0); // an old (one-island) save still counts
      })();
      const gotAc = id => curW === 'hub' ? !!prog.got[id] : !!(prog.ac[curW] && prog.ac[curW][id]);
      const nAc = () => Object.keys(prog.got).length + Object.keys(prog.ac).reduce((n, w) => n + Object.keys(prog.ac[w] || {}).length, 0);
      const nAcW = w => w === 'hub' ? Object.keys(prog.got).length : Object.keys(prog.ac[w] || {}).length;
      // ---- Sherbet Sandstorm: rolling terrain, wind lanes and a walkable stepped temple.
      let SS=null;
      const SAND_FLAGS=[[-25,25],[-34,1],[-28,-28],[25,-34],[32,12]],SAND_BELLS=[[-35,13],[33,-30],[-42,-19]];
      function sandGround(x,z){const dunes=2+1.7*Math.sin(x*.065)*Math.cos(z*.052)+6*ex(x,z,-32,-23,260)+8*ex(x,z,29,-30,250)+5*ex(x,z,34,23,180)+3*ex(x,z,-30,22,200),r=Math.max(Math.abs(x)/18,Math.abs(z+23)/18);const base=lerp(2,dunes,sstep(.85,1.5,r)),court=Math.max(Math.abs(x+35)/6.3,Math.abs(z+36)/5.8);return lerp(5.2,base,sstep(1,1.8,court));}
      WORLDS.sands={song:'sands',spawn:[0,54,0],exitAt:[-10,56],bound:77,square:true,ground:sandGround,killY:-35,fog:[0xe5bb9d,65,175],light:{sky:0xffead0,gnd:0x705274,amb:.85,sun:.8,dir:[-.4,1,.35]},build(){
        SS={bells:0,bellTimes:[-1,-1,-1],relay:'idle',elapsed:0,next:0,parcel:gotAc('parcel')?'delivered':'waiting',bellMeshes:[],flagMeshes:[],wind:[]};
        sky([[0,'#77528f'],[.4,'#dc9b97'],[.62,'#ffe0b0'],[1,'#ffe0b0']],5,76,0xffd7b5);farRing(12,145,200,15,35,0xbe9c9a,0x8b7394,-3);
        const sand=hexA(0xf4cd89),rose=hexA(0xc5968e),cream=hexA(0xffe5ad);terrain(164,112,0,0,sandGround,(x,z,y,sl)=>mix3(mix3(sand,cream,.3+.2*Math.sin(x*.5+z*.13)),rose,clamp(sl*.6,0,.5)));
        // Nine complete solid tiers, broad enough to choose an acrobatic route on any face.
        for(let i=0;i<9;i++){const width=28-i*2.5,y=2+i*1.2;box(0,y,-23,width,1.2,width,{t:'sandbrick',c:i%2?0xd0a384:0xe4bd8c});box(0,y+1.12,-23,width+.12,.08,width+.12,{t:'sandbrick',c:i%3?0xf3d69f:0x6a9e9e});}
        for(const [x,z] of [[-19,-5],[19,-5],[-19,-41],[19,-41]]){const y=sandGround(x,z);cyl(x,y,z,1.1,5,{t:'sandbrick',c:0xe2bd8e,seg:8,top:.75});deco(pt(S.cone(4),0x74c2bc,x,y+5.5,z,1.6,1,1.6,0,Math.PI/4));for(let j=0;j<3;j++)deco(pt(S.box(),0xaa6f83,x,y+1+j,z-.99,.45,.2,.04));}
        acorn('summit','THE SHERBET ON TOP',0,14.2,-23);
        // A half-buried open courtyard: walls have real thickness and the floor stays readable.
        const courtY=sandGround(-35,-36);box(-35,courtY-.1,-36,12,.3,11,{t:'sandbrick',c:0xe5c58d});for(const x of [-41,-29]){box(x,courtY,-36,.65,2.1,11,{t:'sandbrick',c:0xb89187});for(const z of [-40,-32])cyl(x,courtY,z,.65,4.5,{t:'sandbrick',c:0xd6b58d,seg:8});}box(-35,courtY,-41.5,12,2.1,.65,{t:'sandbrick',c:0xb89187});
        SS.parcelMesh=new T.Mesh(merge([pt(S.box(),0xc78e61,0,.4,0,.9,.7,.65),pt(S.box(),0xffe4af,0,.76,0,.65,.035,.5),pt(S.box(),0x6bb7af,.2,.79,0,.2,.035,.2),pt(S.box(),0x8f5b78,0,.4,-.34,.12,.7,.025)]),matV());WG.add(SS.parcelMesh);SS.parcelSite=[-35,courtY+.2,-37];
        acorn('parcel','RETURN TO SENDER',10,sandGround(10,43)+1.3,43,{hidden:true,cond:'parcel'});
        acorn('bells','THREE BELLS BEFORE TEA',-9,sandGround(-9,4)+1.3,4,{hidden:true,cond:'bells'});
        acorn('post','THE EXPRESS SAND POST',32,sandGround(32,12)+1.5,12,{hidden:true,cond:'post'});
        acorn('reds','EIGHT RED DESERT STAMPS',-4,sandGround(-4,46)+1.3,46,{hidden:true,cond:'reds'});
        acorn('c100','A HUNDRED SHERBET PENNIES',0,sandGround(0,47)+1.3,47,{hidden:true,cond:'c100'});
        SAND_BELLS.forEach(([x,z],i)=>{const y=sandGround(x,z);cyl(x,y-.1,z,2.8,.4,{t:'sandbrick',c:0xa18a8d});const b=cyl(x,y+.3,z,1.15,.3,{t:'metal',c:0x80c8be,props:{sandBell:i}});const m=new T.Mesh(merge([pt(S.tor(.09,14),0xf2cb85,0,0,0,1.65,1.65,1.65,Math.PI/2),pt(S.box(),0xf6dca0,0,0,0,1.6,.12,.1),pt(S.box(),0xf6dca0,0,0,0,.1,.12,1.6)]),matV());m.position.set(x,y+.65,z);WG.add(m);SS.bellMeshes.push(m);for(const dx of [-2.3,2.3]){box(x+dx,y,z+1.8,.35,3.7,.35,{t:'wood',c:0x7a5b64});}box(x,y+3.7,z+1.8,5,.3,.4,{t:'wood',c:0x7a5b64});deco(pt(S.hemi(12),0xe4ba72,x,y+3.1,z+1.8,1.2,1.1,1.2,Math.PI,0,0));coinRing(x,y+1.1,z,3.5,9);});
        SAND_FLAGS.forEach(([x,z],i)=>{const y=sandGround(x,z),m=new T.Mesh(S.tor(.07,20),mat('sandFlag'+i,{color:0xf5d88b,emissive:0x4b3420}));m.position.set(x,y+1.8,z);m.scale.setScalar(2);WG.add(m);SS.flagMeshes.push(m);for(const side of [-1,1])cyl(x+side*2.5,y,z,.16,3.5,{t:'wood',c:0x83596e});for(let k=0;k<=i;k++)deco(pt(S.box(),0x8ccfc2,x-1+i*.05+k*.38,y+.07,z,.2,.07,.7));});
        npc('postmaster','POSTMASTER '+castN('mate3'),6,46,0,()=>SS.parcel==='carry'?['MY LOST TEA PARCEL! THE STAMP SAYS FIRST CLASS. THE TEA SAYS LAST WEEK.','THANK YOU! YOUR ACORN IS BY THE POSTBAG.']:SS.parcel==='delivered'&&gotAc('post')?['THE POST IS IN. THE TEA IS OUT. A PERFECT AFTERNOON.']:gotAc('post')?['YOUR EXPRESS POST ROUND IS ALREADY IN!','MY TEA PARCEL IS STILL IN THE WESTERN RUINS. PRESS '+L('b')+' BESIDE IT AND BRING IT BACK.']:['SHERBET SANDSTORM. THE WIND DELIVERS EVERYTHING EXCEPT MY TEA.','THE GREEN WIND LANES PUSH ALONG THE SAND. YOU CAN STILL STEER AND HOP.','RUN THROUGH FIVE GOLD POST HOOPS IN ORDER. 55 SECONDS.','A LOST PARCEL IS IN THE WESTERN RUINS. PRESS '+L('b')+' BESIDE IT AND BRING IT BACK.','READY FOR THE POST ROUND? OFF YOU HOP!'],{y:sandGround(6,46),sandFriend:true,done:()=>{if(SS.parcel==='carry'){SS.parcel='delivered';reveal('parcel');snd.coin();}else if(!gotAc('post')){SS.relay='run';SS.elapsed=0;SS.next=0;P.inv=Math.max(P.inv,1);say('THE EXPRESS SAND POST!',2,'FOLLOW THE FIVE GOLD HOOPS. 55 SECONDS.');}saveNow();}});
        // Wind is strongest at each lane's centre and fades at its boundaries.
        for(const [x,z0,z1,dir] of [[-33,-39,35,-1],[32,-39,34,1]]){for(let z=z0;z<=z1;z+=4){const y=sandGround(x,z);for(const side of [-1,1])deco(pt(S.box(),0x8bc9b6,x+side*.4,y+.06,z,.15,.08,1.3,0,side*dir*.5));SS.wind.push({x,z,dir});}for(const z of [z0+5,z1-5]){const y=sandGround(x+5,z);cyl(x+5,y,z,.13,4.6,{t:'wood',c:0x8d6677});for(let k=0;k<4;k++)deco(pt(S.cyl(8,.8),k%2?0xf1d4a0:0x74bdb4,x+5,y+4.2,z+dir*(.3+k*.5),.65-k*.1,.6,.65-k*.1,Math.PI/2));}}
        SS.windMesh=new T.InstancedMesh(merge([pt(S.ico(),0xffe2a2,0,0,0,.09,.05,.5)]),matV(),SS.wind.length);SS.windMesh.frustumCulled=false;WG.add(SS.windMesh);
        for(const [x,z] of [[-14,30],[22,30],[-26,-12],[28,-14],[39,6]])enemy('scarab',x,z,{range:9,st:'idle',t:0,vx:0,vz:0,h:1.2,r:.75});
        for(const [x,z] of [[0,51],[-31,24],[-38,1],[-35,-36],[32,-30],[37,22],[-12,-5]])coinRing(x,sandGround(x,z)+1,z,4,12);
        for(const [x,z,dx,dz] of [[-32,30,0,-3],[33,-35,0,3],[-17,6,2,0]])for(let i=0;i<20;i++){const xx=x+dx*i,zz=z+dz*i;coin(xx,sandGround(xx,zz)+.9,zz);}
        for(let i=0;i<9;i++)coin(0,3.8+i*1.2,-8-i*1.25);
        for(const [x,z,y] of [[-7,43,null],[-35,17,null],[-38,-36,null],[0,-23,14.4],[33,-30,null],[37,22,null],[20,-40,null],[-22,-5,null]])red(x,y??sandGround(x,z)+1.2,z);
        for(const [x,z] of [[-46,31],[45,-39],[47,14],[-47,-7]]){const y=sandGround(x,z);cyl(x,y-.4,z,1.8,3.2,{t:'sandbrick',c:0xbe9c91,seg:7,top:.65});deco(pt(S.ball(10),0x8eb2aa,x,y+3,z,2.2,.9,2.2));}
        // Ribbed sugar cacti break the dune silhouettes; their feet are real solid trunks.
        for(const [x,z] of [[-45,45],[-22,35],[19,15],[46,-19],[-48,-28],[13,-49],[47,35],[-17,-48]]){const y=sandGround(x,z);cyl(x,y-.1,z,.5,3.8,{c:0x739f94,seg:8});for(const side of [-1,1]){deco(pt(S.cyl(8),0x81b6a1,x+side*.6,y+1.5,z,.55,1.2,.55,0,0,Math.PI/2));deco(pt(S.cyl(8),0x81b6a1,x+side*1.1,y+2,z,.55,1.2,.55));deco(pt(S.ball(8),0xd69aa0,x+side*1.1,y+2.65,z,.65,.35,.65));}deco(pt(S.hemi(8),0x91c2a9,x,y+3.8,z,.95,.6,.95));for(let k=0;k<4;k++)deco(pt(S.box(),0xb9d4a5,x-.25+k*.16,y+1.9,z-.46,.045,3.4,.04));}
        for(let i=-2;i<=2;i++)for(let k=-1;k<=1;k++)deco(pt(S.box(),(i+k)%2?0x82b9ac:0xc19191,-35+i*.8,courtY+.205,-36+k*.8,.55,.01,.55,0,Math.PI/4));
        sign(-6,51,0,['SHERBET SANDSTORM. SIX ACORNS.','THE TEMPLE IS NORTH. THE RUINS ARE NORTHWEST.','GREEN CHEVRONS MARK THE WIND LANES. THE GROUND IS ALWAYS SAFE SAND.'],sandGround(-6,51));sign(-29,30,0,['THE SHERBET STREAM.','FOLLOW THE CHEVRONS. STEER AGAINST THE WIND OR HOP OUT TO LEAVE IT.'],sandGround(-29,30));sign(-11,-2,0,['THREE BELLS BEFORE TEA.','POUND THE THREE MINT DRUMS. THE BRASS BELLS MARK EACH ONE.'],sandGround(-11,-2));life(40,sandGround(40,-4)+1,-4);sandsAnim();
      }};
      function sandsInput(){if(!SS||!P.gnd||SS.parcel!=='waiting')return false;const [x,y,z]=SS.parcelSite;if(Math.hypot(P.x-x,P.z-z)>2||Math.abs(P.y-y)>1.5)return false;SS.parcel='carry';IN.b=false;say('FIRST CLASS TEA!',2,'TAKE THE PARCEL TO THE POSTMASTER.');K.sfx.tone(950,.2,'triangle',.08);saveNow();return true;}
      function sandsPound(o){if(!SS||!Number.isInteger(o.sandBell))return;const bit=1<<o.sandBell;if(SS.bells&bit)return;SS.bells|=bit;SS.bellTimes[o.sandBell]=clock;K.sfx.seq([[69+o.sandBell*4,.3],[76+o.sandBell*4,.5]],{bpm:190,vol:.09,wave:'sine'});burst(o.x,o.y1+.2,o.z,[0xffe2a1,0x9ae0d3],12,4,{ring:true});if(SS.bells===7){reveal('bells');say('THREE BELLS! TEA TIME!',2);}else say('DING! FIND THE NEXT MINT DRUM.',1.5);saveNow();}
      function sandWind(x,y,z){if(!SS||!P.gnd||P.plat||Math.abs(z+2)>38||y-sandGround(x,z)>.8)return 0;return (-3.5*(1-sstep(2.5,5.5,Math.abs(x+33)))+3.5*(1-sstep(2.5,5.5,Math.abs(x-32))))*(1-sstep(34,38,Math.abs(z+2)));}
      function sandsUpdate(dt){if(!SS||P.st==='dead')return;
        if(P.gnd&&Math.abs(P.z+2)<38&&P.y-sandGround(P.x,P.z)<.8){for(const [x,dir] of [[-33,-1],[32,1]]){const f=1-sstep(2.5,5.5,Math.abs(P.x-x));if(f>0){if(K.frame%12===0)burst(P.x,P.y+.1,P.z,0xffdf9e,2,1,{size:.07,life:.3,grav:1});}}}
        if(SS.relay==='run'){SS.elapsed+=dt;const flag=SAND_FLAGS[SS.next];if(flag&&Math.hypot(P.x-flag[0],P.z-flag[1])<2.4&&Math.abs(P.y-sandGround(...flag))<3){SS.next++;snd.coin();burst(P.x,P.y+1,P.z,[0xffda8c,0x8bd7c5],10,3);if(SS.next===5){SS.relay='won';prog.records.sands=Math.min(Number(prog.records.sands)||999,SS.elapsed);reveal('post');say('THE POST IS IN!',2);saveNow();}else{say('POST HOOP '+SS.next+' OF 5',1.2);saveNow();}}else if(SS.elapsed>=55){SS.relay='lost';say('LAST POST!',2,'BACK TO THE POSTMASTER FOR ANOTHER ROUND.');saveNow();}}
        sandsAnim();
      }
      function sandsAnim(){if(!SS)return;SS.bellMeshes.forEach((m,i)=>{const f=SS.bells&(1<<i)?sstep(0,.3,clock-SS.bellTimes[i]):0;m.rotation.y=f*Math.PI/2;m.scale.y=1-f*.45;});SS.flagMeshes.forEach((m,i)=>{m.material.color.setHex(SS.relay==='run'&&SS.next===i?0xfff2ad:i<SS.next?0x83e1c4:0xcfa478);m.rotation.y=Math.sin(clock*1.5+i)*.12;});SS.wind.forEach(({x,z,dir},i)=>{const zz=z+((clock*4+i*.37)%4-2)*dir;pdum.position.set(x+Math.sin(i)*1.6,sandGround(x,zz)+.2,zz);pdum.rotation.set(0,0,0);pdum.scale.set(1,1,1);pdum.updateMatrix();SS.windMesh.setMatrixAt(i,pdum.matrix);});SS.windMesh.instanceMatrix.needsUpdate=true;const m=SS.parcelMesh;m.visible=SS.parcel!=='delivered';if(SS.parcel==='carry'){m.position.set(P.x+Math.cos(P.face)*.65-Math.sin(P.face)*.4,P.y+.55,P.z-Math.sin(P.face)*.65-Math.cos(P.face)*.4);m.rotation.y=P.face;}else{m.position.set(...SS.parcelSite);m.rotation.y=.2;}}

            // ---- Marmalade Treetops. Append worlds/doors so existing seeds and suspended supports stay stable.
      let CAN=null;
      const CAN_TREES=[[-23,7],[7,-21],[33,10]],CAN_TOP=23.6,CAN_BOSS=[34,-35];
      function canopyGround(x,z){const h=1+.55*Math.sin(x*.07)*Math.cos(z*.08)+1.6*ex(x,z,-40,-30,200);return lerp(1,h,sstep(12,18,Math.hypot(x-34,z+35)));}
      function canopyWalk(a,b,width=4.8){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),ry=Math.atan2(dx,dz);box((a[0]+b[0])/2,CAN_TOP-.4,(a[1]+b[1])/2,width,.4,len+1,{t:'wood',c:0xbd955e,ry});for(let i=0;i<=len;i+=3){const f=i/len,x=lerp(a[0],b[0],f),z=lerp(a[1],b[1],f);for(const side of [-1,1]){const xx=x+Math.cos(ry)*side*(width/2-.15),zz=z-Math.sin(ry)*side*(width/2-.15);deco(pt(S.cyl(5),0x987043,xx,CAN_TOP+.32,zz,.12,.65,.12));}coin(x,CAN_TOP+.85,z);}for(const side of [-1,1])deco(pt(S.cyl(6),0xe0c48e,(a[0]+b[0])/2+Math.cos(ry)*side*(width/2-.15),CAN_TOP+.58,(a[1]+b[1])/2-Math.sin(ry)*side*(width/2-.15),.08,len,.08,Math.PI/2,0,-ry));}
      WORLDS.canopy={song:'canopy',spawn:[0,49,0],exitAt:[-10,51],bound:73,square:true,ground:canopyGround,killY:-30,fog:[0xb4d5ac,48,145],light:{sky:0xfff1c4,gnd:0x365b56,amb:.9,sun:.75,dir:[-.5,1,.4]},build(){
        CAN={latches:0,latchTimes:[-1,-1,-1],sprout:gotAc('sprout')?'home':'nest',boss:{st:gotAc('manager')?'gone':'idle',hp:gotAc('manager')?0:3,t:0,n:0,met:false,tx:34,tz:-29},latchMeshes:[],lifts:[]};
        sky([[0,'#447d9c'],[.48,'#b8dfb2'],[.62,'#e8edbe'],[1,'#e8edbe']],6,85,0xffefd1);farRing(13,125,175,18,35,0x5c9683,0x83b58b,-3);
        const moss=hexA(0x72a367),gold=hexA(0xc5bb77);terrain(154,76,0,0,canopyGround,(x,z,y,sl)=>mix3(moss,gold,.25+.18*Math.sin(x*.28+z*.2)));
        CAN_TREES.forEach(([x,z],j)=>{const y=canopyGround(x,z);cyl(x,y-.3,z,2.8,30-y,{t:'wood',c:j%2?0x9c7047:0x88603e,top:.65,seg:12});for(let i=0;i<5;i++){const a=i*TAU/5;deco(pt(S.cyl(6,.2),0x8c6944,x+Math.sin(a)*2,y+.6,z+Math.cos(a)*2,1.2,4,1.2,Math.cos(a)*.9,0,-Math.sin(a)*.9));}
          // Open crowns sit above the walking routes; no foliage card can erase the hero.
          for(let k=0;k<4;k++){const a=k*TAU/4+j*.4;deco(pt(S.ball(10),[0x589b62,0x7caf63,0x9aba61][(j+k)%3],x+Math.sin(a)*4,33+k*.5,z+Math.cos(a)*4,8,4.8,8,0,j*.5,0,.4));}deco(pt(S.cyl(7,.6),0x986c42,x+3,27,z,1.2,10,1.2,0,0,-.75));
          cyl(x,CAN_TOP-.65,z,5.6,.65,{t:'wood',c:0xd0a96d,seg:18});deco(pt(S.tor(.012,20),0xf3d08e,x,CAN_TOP+.04,z,10.2,10.2,10.2,Math.PI/2));
          const lx=x+7.5,lz=z;const sw=cyl(x-4.1,CAN_TOP,z,1.05,.25,{t:'metal',c:0xd88b63,props:{canLatch:j}});const wheel=new T.Mesh(merge([pt(S.tor(.1,12),0xffd584,0,0,0,1.5,1.5,1.5,Math.PI/2),pt(S.box(),0xffedaf,0,0,0,1.4,.12,.12),pt(S.box(),0xffedaf,0,0,0,.12,.12,1.4)]),matV());wheel.position.set(sw.x,sw.y1+.1,sw.z);WG.add(wheel);CAN.latchMeshes.push(wheel);
          const lift=mover('box',4.6,.45,4.6,{t:'wood',c:0xe3b976,props:{canLift:j},parts:[pt(S.box(),0xd7a16b,0,0,0,4.6,.45,4.6),...[-1,1].map(s=>pt(S.box(),0x9d754a,s*2.15,.6,0,.18,1.2,4.6))]},(s,t)=>{const unlocked=CAN.latches&(1<<j),elapsed=Math.max(0,t-CAN.latchTimes[j]),f=unlocked?.5-.5*Math.cos(elapsed*.48):0;s.x=lx;s.z=lz;s.y=lerp(canopyGround(lx,lz)+.3,CAN_TOP-.225,f);});CAN.lifts.push(lift);
          canopyWalk([x+4,z],[lx,z],3.8);box(x+3.75,29.2,z,8.5,.45,.5,{t:'wood',c:0x986e47});box(lx,29.2,z,4.6,.45,4.6,{t:'wood',c:0xb28b56});
          coinRing(x,CAN_TOP+.9,z,4,12);
        });
        // A complete spiral, then a connected outward loop. A miss falls to safe moss.
        for(let i=0;i<18;i++){const a=1.55+i*.43,h=2+i*1.2,x=-23+Math.sin(a)*(i>=15?7.4:5.3),z=7+Math.cos(a)*(i>=15?7.4:5.3);box(x,h-.32,z,3.6,.32,3.6,{t:'wood',c:i%2?0xc1955d:0xdeb477});coin(x,h+.85,z);}
        canopyWalk([-27.5,7],[-27.5,-16.5]);canopyWalk([-27.5,-16.5],[37.5,-16.5]);canopyWalk([37.5,-16.5],[37.5,10]);for(const x of [-27.5,37.5])box(x,CAN_TOP-.4,-16.5,7,.4,7,{t:'wood',c:0xc6a06b});
        // A short inward ferry is an alternative return line, independent of the long outer walk.
        CAN.ferry=mover('box',5,.4,5,{t:'wood',c:0x86b68b,parts:[pt(S.ball(10),0x8cba79,0,-.12,0,5,.7,5),pt(S.box(),0x719b63,0,.18,0,.18,.08,4.6)]},(s,t)=>{const f=.5-.5*Math.cos(t*.35);s.x=lerp(-23,33,f);s.y=CAN_TOP-.2;s.z=lerp(13.5,16.5,f);});
        canopyWalk([-23,11.5],[-23,13.5],3.8);canopyWalk([33,14.5],[33,16.5],3.8);
        // A higher branch asks for ordinary chained jumps, with a broad crown underneath.
        [[3.5,24.8,-24],[0,26,-24],[-3.5,27.2,-24]].forEach(([x,y,z])=>box(x,y-.35,z,3.5,.35,3.5,{t:'wood',c:0xd6ac70}));acorn('skyline','THE MARMALADE SKYLINE',-3.5,28.5,-24);
        acorn('latches','THREE ROOTS HOME',-27.1,CAN_TOP+1.4,7,{hidden:true,cond:'latches'});acorn('sprout','THE LONG WAY HOME',7,canopyGround(7,44)+1.3,44,{hidden:true,cond:'sprout'});acorn('manager','THE BRANCH MANAGER RETIRES',34,2.4,-29,{hidden:true,cond:'manager'});acorn('reds','EIGHT RED LEAF MARKS',-5,canopyGround(-5,42)+1.3,42,{hidden:true,cond:'reds'});acorn('c100','A HUNDRED WOODLAND PENNIES',0,canopyGround(0,42)+1.3,42,{hidden:true,cond:'c100'});
        CAN.sproutSite=[33,CAN_TOP,14.2];CAN.sproutMesh=new T.Mesh(merge([pt(S.cyl(10,.8),0xc78160,0,.3,0,.65,.6,.65),pt(S.cyl(6),0x5d8655,0,.9,0,.1,.7,.1),pt(S.ball(8),0x9cc96e,-.2,1.1,0,.55,.18,.35,0,0,-.45),pt(S.ball(8),0x78af68,.2,1.25,0,.55,.18,.35,0,0,.45),pt(S.box(),0xffe2a5,0,.4,-.32,.3,.22,.03)]),matV());WG.add(CAN.sproutMesh);
        npc('gardener','KEEPER '+castN('mate3'),5,46,0,()=>CAN.sprout==='carry'?['MY LITTLE MARMALADE TREE! ALL THAT WAY DOWN WITHOUT A BRUISED LEAF.','THANK YOU. YOUR ACORN IS BESIDE THE POTTING BENCH.']:CAN.sprout==='home'?['ROOTS FIRMLY ON THE GROUND. THAT IS MY SORT OF ADVENTURE.']:['WELCOME TO MARMALADE TREETOPS. THE MOSS CATCHES A MISSED JUMP.','CLIMB THE WESTERN SPIRAL. THE ROPE WALKS JOIN ALL THREE CROWNS.','POUND THE THREE BRASS ROOT WHEELS. EACH WAKES A BASKET LIFT HOME.','MY LITTLE SPROUT IS ON THE EASTERN CROWN. OPEN ALL THREE ROOTS, THEN PRESS '+L('b')+' BESIDE ITS POT.','BRING IT BACK TO ME. THE LEAF FERRY IS A SHORT WAY HOME.'],{y:canopyGround(5,46),done:()=>{if(CAN.sprout==='carry'){CAN.sprout='home';reveal('sprout');snd.coin();saveNow();}}});
        box(9,canopyGround(9,46),46,3.5,1.1,1.5,{t:'wood',c:0xc39b65});for(let i=0;i<3;i++)deco(pt(S.cyl(8,.7),0xc78763,8+i,canopyGround(9,46)+1.35,46,.5,.5,.5));
        const by=canopyGround(...CAN_BOSS);cyl(34,by-.1,-35,10.5,.12,{t:'wood',c:0xbab67a,solid:false,seg:28});deco(pt(S.tor(.008,32),0xf8dc93,34,by+.08,-35,21,21,21,Math.PI/2));
        CAN.bossNpc=npc('branchboss','MANAGER '+castN('mate2'),34,-35,0,['I AM '+castN('mate2')+', THE BRANCH MANAGER. ALL LEAVES REQUIRE A FORM!','THE GOLD RING SHOWS WHERE MY BONKER NUT WILL LAND. MOVE WHEN IT APPEARS.','AFTER A BATCH I NEED TO SORT MY PAPERS. MY TIE TURNS BLUE.','THAT IS YOUR CHANCE: COME CLOSE AND PUNCH. THREE GOOD KNOCKS.'],{y:by,r:0,canBoss:true,done:()=>canopyBossStart()});CAN.body=cyl(34,by,-35,2.1,4.4,{vis:false,props:{canBossBody:true}});
        for(const [x,z] of [[-17,30],[17,26],[-39,-15],[45,1]])enemy('budbug',x,z,{y0:canopyGround(x,z),range:8,st:'idle',t:0,vx:0,vz:0,h:1.1,r:.65});
        for(const [x,z] of [[0,43],[-23,23],[-40,-15],[18,29],[40,-12]])coinRing(x,canopyGround(x,z)+.9,z,5,14);coinLine(-12,0,39,-35,0,20,14,true);coinLine(12,0,34,44,0,10,14,true);
        for(const [x,y,z] of [[-18,4.1,7],[-23,CAN_TOP+1,11.2],[-27.5,CAN_TOP+1,-16.5],[7,CAN_TOP+1,-16.8],[37.5,CAN_TOP+1,-8],[33,CAN_TOP+1,14.2],[-40,canopyGround(-40,-15)+1.1,-15],[18,canopyGround(18,29)+1.1,29]])red(x,y,z);
        for(const [x,z] of [[-47,32],[-45,-34],[48,36],[49,-48],[-12,-45]]){const y=canopyGround(x,z);cyl(x,y,z,1.1,12,{t:'wood',c:0x8c6848,seg:8});deco(pt(S.ball(10),0x83ab68,x,y+13,z,9,7,9));}
        for(const [x,z]of [[-37,33],[-12,-34],[43,30],[-43,3]])for(let i=0;i<3;i++){const xx=x+i*.8,zz=z+Math.sin(i)*.7,y=canopyGround(xx,zz);deco(pt(S.cyl(6),0xe5d6a0,xx,y+.45,zz,.2,.9,.2));deco(pt(S.hemi(10),i%2?0xe9b367:0xc98e65,xx,y+.9,zz,1.1,.7,1.1));}deco(pt(S.cyl(10,.8),0x6d9c86,10.5,canopyGround(9,46)+1.45,46,.65,.7,.65));deco(pt(S.tor(.06,10),0xd5ba7d,11,canopyGround(9,46)+1.6,46,.7,.7,.7));
        sign(-7,45,0,['MARMALADE TREETOPS. SIX ACORNS.','WESTERN SPIRAL UP. ROPE WALKS AROUND. THREE BRASS ROOT WHEELS OPEN BASKET LIFTS HOME.','MISSED A BRANCH? THE MOSS IS SAFE. YOUR PROGRESS STAYS.'],canopyGround(-7,45));sign(-15,15,0,['UP THE WESTERN TREE.','HOLD '+L('a')+' FOR HEIGHT. LAND, THEN JUMP AGAIN.','THE LIFT BESIDE THE CROWN NEEDS ITS BRASS ROOT WHEEL.'],canopyGround(-15,15));sign(20,-28,0,['THE BRANCH MANAGER.','MOVE OUT OF THE GOLD TARGET. THE BONKER NUT FALLS THERE.','BLUE TIE MEANS PAPERWORK. COME CLOSE AND PUNCH.'],canopyGround(20,-28));life(-31,canopyGround(-31,27)+1,27);canopyAnim();
      }};
      function canopyPound(o){if(!CAN||!Number.isInteger(o.canLatch))return;const i=o.canLatch,bit=1<<i;if(CAN.latches&bit)return;CAN.latches|=bit;CAN.latchTimes[i]=clock;K.sfx.seq([[72,.2],[79,.2],[84,.4]],{bpm:240,vol:.08});burst(o.x,o.y1,o.z,[0xffdf91,0x9bd2a2],15,4);say('ROOT '+(i+1)+' IS OPEN!',2,'BASKET LIFT OPEN TO THE FLOOR.');if(CAN.latches===7)reveal('latches');saveNow();}
      function canopyInput(){if(!CAN||CAN.sprout!=='nest'||!P.gnd)return false;const [x,y,z]=CAN.sproutSite;if(Math.hypot(P.x-x,P.z-z)>2||Math.abs(P.y-y)>1.5)return false;IN.b=false;if(CAN.latches!==7){say('OPEN ALL THREE ROOTS FIRST.',2,'THE LITTLE TREE NEEDS A SAFE WAY DOWN.');return true;}CAN.sprout='carry';say('HANDLE WITH LEAVES!',2,'TAKE THE SPROUT BACK TO THE KEEPER.');snd.coin();saveNow();return true;}
      function canopyBossStart(){if(!CAN||CAN.boss.st==='gone')return;msgT=0;Object.assign(CAN.boss,{st:'tell',t:0,n:0,tx:P.x,tz:P.z});P.inv=Math.max(P.inv,1);C.want=C.yaw=Math.atan2(P.x-34,P.z+35);music('canopyBoss');saveNow();}
      function canopyHit(ax,ay,az,rad){if(!CAN||CAN.boss.st!=='rest'||Math.hypot(ax-34,az+35)>rad+2||Math.abs(ay-2)>2)return;const b=CAN.boss;b.hp--;b.st=b.hp?'hurt':'defeated';b.t=0;prog.score+=250;shake=.15;flash=.1;burst(34,2.5,-35,[0xffd98a,0xa4dfca],18,5);snd.hit();say(b.hp?'PAPERWORK! '+b.hp+' KNOCKS LEFT!':'THE BRANCH IS UNDER NEW MANAGEMENT!',2);saveNow();}
      function canopyUpdate(dt){if(!CAN||P.st==='dead')return;const b=CAN.boss,d=Math.hypot(P.x-34,P.z+35);
        if(!['idle','intro','gone','defeated'].includes(b.st)&&(d>17||P.y>8)){b.st='idle';b.t=0;b.n=0;music('canopy');}
        if(b.st==='idle'&&d<9&&P.gnd&&P.y<3){if(b.met)canopyBossStart();else{b.met=true;b.st='intro';msgT=0;startTalk(CAN.bossNpc);}return;}
        if(!['idle','intro','gone'].includes(b.st))b.t+=dt;
        if(b.st==='tell'&&b.t>=1.05){b.st='throw';b.t=0;snd.whoosh();}
        else if(b.st==='throw'&&b.t>=.8){if(Math.hypot(P.x-b.tx,P.z-b.tz)<1.6&&Math.abs(P.y-canopyGround(b.tx,b.tz))<1.7)hurt(1,b.tx,b.tz);burst(b.tx,canopyGround(b.tx,b.tz)+.1,b.tz,[0xe5ba75,0x9cba74],12,4);K.sfx.noise(.15,.08,400);b.st='wait';b.t=0;}
        else if(b.st==='wait'&&b.t>=.6){b.n++;b.st=b.n<6-b.hp?'tell':'rest';b.t=0;if(b.st==='tell'){b.tx=P.x;b.tz=P.z;}else{say('BLUE TIE! PAPERWORK BREAK!',2,'COME CLOSE AND PUNCH.');K.sfx.tone(1100,.2,'sine',.07);}}
        else if(b.st==='rest'&&b.t>=6){b.st='tell';b.t=0;b.n=0;b.tx=P.x;b.tz=P.z;}
        else if(b.st==='hurt'&&b.t>=1){b.st='tell';b.t=0;b.n=0;b.tx=P.x;b.tz=P.z;}
        else if(b.st==='defeated'&&b.t>=1.5){b.st='gone';reveal('manager');music('canopy');saveNow();}canopyAnim();
      }
      function canopyInit(){if(!CAN)return;CAN.ropeMesh=new T.InstancedMesh(new T.CylinderGeometry(.5,.5,1,6),mat('canRopes',{color:0xd9bd83}),12);CAN.ropeMesh.frustumCulled=false;WG.add(CAN.ropeMesh);CAN.bossNpc.mesh.scale.setScalar(2.1);CAN.target=new T.Mesh(new T.TorusGeometry(1.6,.07,5,28),mat('canTarget',{color:0xffdb85,lit:false}));CAN.target.rotation.x=Math.PI/2;WG.add(CAN.target);CAN.conker=new T.Mesh(merge([pt(S.ball(12),0xae6d40,0,0,0,1.2,1.2,1.2),pt(S.hemi(10),0xe1b675,0,.4,0,1,.4,1)]),matV());WG.add(CAN.conker);CAN.tie=new T.Mesh(merge([pt(S.cone(4),0xaff4db,0,0,0,.7,.8,.12,0,0,Math.PI)]),mat('canTie',{vcol:true,emissive:0x285344}));CAN.tie.position.set(0,.65,-.86);CAN.tie.scale.set(.5,.8,1);CAN.bossNpc.mesh.add(CAN.tie);canopyAnim();}
      function canopyAnim(){if(!CAN)return;CAN.latchMeshes.forEach((m,i)=>{const f=CAN.latches&(1<<i)?sstep(0,.3,clock-CAN.latchTimes[i]):0;m.rotation.y=f*Math.PI/2;m.scale.y=1-f*.45;});const m=CAN.sproutMesh;m.visible=CAN.sprout!=='home'&&mode!=='win';if(CAN.sprout==='carry'){m.position.set(P.x+Math.cos(P.face)*.6,P.y+.55,P.z-Math.sin(P.face)*.6);m.rotation.y=P.face;}else m.position.set(...CAN.sproutSite);if(CAN.ropeMesh){let i=0;for(const s of CAN.lifts)for(const x of [-1.9,1.9])for(const z of [-1.9,1.9]){const bottom=s.y+.2,h=29.2-bottom;pdum.position.set(s.x+x,bottom+h/2,s.z+z);pdum.rotation.set(0,0,0);pdum.scale.set(.075,h,.075);pdum.updateMatrix();CAN.ropeMesh.setMatrixAt(i++,pdum.matrix);}CAN.ropeMesh.instanceMatrix.needsUpdate=true;}if(!CAN.target)return;const b=CAN.boss,n=CAN.bossNpc.mesh;CAN.body.y1=b.st==='gone'?CAN.body.y0:CAN.body.y0+4.4;n.visible=b.st!=='gone';n.scale.setScalar(b.st==='defeated'?Math.max(.01,2.1*(1-b.t/1.5)):2.1);n.rotation.y=Math.atan2(34-P.x,-35-P.z);CAN.tie.visible=b.st==='rest';CAN.target.visible=['tell','throw'].includes(b.st);CAN.target.position.set(b.tx,canopyGround(b.tx,b.tz)+.1,b.tz);CAN.target.scale.setScalar(b.st==='tell'?1+Math.sin(b.t*16)*.08:1);CAN.conker.visible=b.st==='throw';const f=clamp(b.t/.8,0,1);CAN.conker.position.set(lerp(34,b.tx,f),lerp(5,canopyGround(b.tx,b.tz)+.5,f)+Math.sin(f*Math.PI)*4,lerp(-35,b.tz,f));CAN.conker.rotation.set(clock*5,clock*3,0);}
      function canopyCamera(dt,snap){if(!CAN||!['intro','tell','throw','wait','rest','hurt'].includes(CAN.boss.st)||Math.hypot(P.x-34,P.z+35)>13)return false;C.yaw+=wrapA(C.want-C.yaw)*(snap?1:1-Math.exp(-dt*7));C.ty+=(P.y-C.ty)*(snap?1:1-Math.exp(-dt*7));const mx=lerp(P.x,34,.3),mz=lerp(P.z,-35,.3),my=lerp(C.ty+1,3.3,.3),height=Math.max(8,P.y+6);let best=-1,chosen;
        WG.updateMatrixWorld(true);for(const off of [0,.65,-.65,1.3,-1.3,2,-2,Math.PI]){const a=C.yaw+off,x=mx+Math.sin(a)*13,z=mz+Math.cos(a)*13,room=cameraRoom(P.x,P.y+.9,P.z,x,height,z),score=room*12-Math.abs(off)*.3;if(score>best){best=score;chosen=[x,height,z];}if(off===0&&room>=.995)break;}C.pos.set(...chosen);C.look.set(mx,my,mz);cam.position.copy(C.pos);cam.lookAt(C.look);return true;}

      const TOTAL = 72;
      // v2 progress/save keys stay intact; run is the separate suspension record.
      const disk = K.load() || {};
      let runCache = disk.run && disk.run.v === 1 && WORLDS[disk.run.w] ? disk.run : null;
      const copy = o => JSON.parse(JSON.stringify(o));
      const fields = (o, keys) => Object.fromEntries(keys.split(' ').filter(k => o[k] !== undefined).map(k => [k, o[k]]));
      const actorKeys = 'x y z a t alive dead hp shy inv st i n vx vy vz face on';
      const poseOf = o => o && ({ p: o.position.toArray(), r: o.rotation.toArray(), s: o.scale.toArray(), v: o.visible });
      function setPose(o, p) { if (o && p) { o.position.fromArray(p.p); o.rotation.fromArray(p.r); o.scale.fromArray(p.s); o.visible = p.v; } }
      function snapshot() {
        const player = Object.assign({}, P); delete player.plat;
        return copy({ v: 1, w: curW, time: clock, random: randomCount, player,
          plat: P.plat ? [P.plat.k, (P.plat.k === 'box' ? BOXES : CYLS).indexOf(P.plat)] : null,
          visit, mode, paused, pauseI, card, win: winA && winA.id, winT, endT, overT, overSent, result: lastResult,
          camera: Object.assign(fields(C, 'yaw want auto ty dist arm lift winYaw indoorAuto'), { pos: C.pos.toArray(), look: C.look.toArray() }),
          lens: { pos: cam.position.toArray(), quat: cam.quaternion.toArray(), fov: cam.fov },
          visuals: { enemies: ENS.map(e => poseOf(e.mesh)), npc: NPCS.map(n => poseOf(n.mesh)), boss: curW === 'boss' && poseOf(BOSS.mesh), stars: curW === 'boss' && poseOf(BOSS.stars), boo: curW === 'manor' && poseOf(BB.mesh), race: curW === 'peaks' && poseOf(PERCY.mesh), blink: BOP.blink },
          gotCoins: COINS.map((c, i) => c.got ? i : -1).filter(i => i >= 0),
          drops: COINS.slice(baseCoins), reds: REDS.map(r => !!r.got), lives: LIFE.map(l => !!l.got),
          acorns: ACS.map(a => [a.x, a.y, a.z, a.hidden, !!a.taken]),
          enemies: ENS.map(e => Object.assign(fields(e, actorKeys), { angle: e.mesh.rotation.y })),
          chestOpen, plugOut, bossDown, raceWon, trial: TRIAL && fields(TRIAL, 'st t elapsed next round cursor note flash wait'), motionClock, mission, props: PROPS.map(p => p.open || 0), propTargets: PROPS.map(p => p.want || 0), lamps: LAMPS.map(l => l.lit),
          boss: curW === 'boss' ? Object.assign(fields(BOSS, actorKeys), { rings: BOSS.rings.map(r => fields(r, 'r on x z')) }) : null,
          boo: curW === 'manor' ? fields(BB, actorKeys) : null,
          race: curW === 'peaks' ? fields(PERCY, actorKeys) : null,
          canopy:CAN&&{...fields(CAN,'latches latchTimes sprout'),boss:fields(CAN.boss,'st hp t n met tx tz')},sands:SS&&fields(SS,'bells bellTimes relay elapsed next parcel'),foundry:FD&&{...fields(FD,'valves valveTimes relay elapsed best'),boss:fields(FD.boss,'st hp t n ringId met'),waves:FD.waves}, coaster:SNOW&&fields(SNOW,'phase route cutS cutUsed recoverT s lane laneV speed air jvy jumpBuf hops t race rivalS rivalV rivalAir rivalJvy rivalMask bumps bumpMask mittens finishT'), school:SCHOOL&&fields(SCHOOL,'active lesson seen airborne'), powerRun:fields(POWER_RUN,'rings pressure gate ledger safeLoot phaseCross'), snow: SNOWB.map(s => fields(s, 'x y z vx vy vz t')), grotto: GROT && fields(GROT, 'pearls gate'),
          dlg: dlg && { name: dlg.name, lines: dlg.lines, i: dlg.i, ch: dlg.ch, npc: NPCS.indexOf(dlg.npc), race: !!dlg.npc?.percy },
          fade: fading && { t: fading.t, dur: fading.dur, done: fading.done, action: fading.action },
          feedback: { shake, flash, msg, msgT, msg2, msgCol },
        });
      }
      function saveNow() {
        if (demo || mode === 'view') return;
        if (prog.started && mode !== 'title' && mode !== 'attract' && fading?.action?.op !== 'title') runCache = snapshot();
        K.save({ v2: 1, school:prog.school, schoolMet:prog.schoolMet, started: prog.started, score: prog.score, got: prog.got, ac: prog.ac, records: prog.records, powers: prog.powers, lives: prog.lives, opt: prog.opt, hs: prog.hs, boss: prog.boss,
          w: runCache ? runCache.w : prog.w, p: runCache ? [runCache.player.x, runCache.player.y, runCache.player.z] : prog.p, door: prog.door, run: runCache,
          ui: fading?.action?.op === 'title' ? { quit: fields(fading, 't dur done action') } : mode === 'title' ? { title: true, started, menuI, sub, subI, idleT } : null });
      }
      function restoreRun(s) {
        if (!s || s.v !== 1 || !WORLDS[s.w] || !s.player || ![s.player.x, s.player.y, s.player.z].every(Number.isFinite)) return false;
        buildWorld(s.w); clock = s.time || 0; motionClock = s.motionClock == null ? clock : s.motionClock; mission = s.mission || 0; if(CAN&&s.canopy){Object.assign(CAN,fields(s.canopy,'latches latchTimes sprout'));Object.assign(CAN.boss,s.canopy.boss);canopyAnim();} if (TRIAL && s.trial) Object.assign(TRIAL, s.trial);
        for (const m of MOVERS) { m.place(m, curW === 'tower' ? motionClock : clock); sync(m); m.px = m.x; m.pz = m.z; }
        Object.assign(visit, s.visit); Object.assign(P, s.player); P.plat = null;
        chestOpen = s.chestOpen || {}; plugOut = s.plugOut || {}; bossDown = !!s.bossDown; raceWon = !!s.raceWon;
        PROPS.forEach((p, i) => { p.open = s.props?.[i] || 0; p.want = s.propTargets?.[i] ?? p.open; if(p.kind==='manorDoor')syncDoor(p); if (p.lid) p.lid.rotation.x = 1.3 * p.open; if (p.kind === 'plug' && plugOut[p.w]) { p.m.visible = false; const n = BOXES.indexOf(p.b); if (n >= 0) BOXES.splice(n, 1); } });
        if (s.plat) { P.plat = (s.plat[0] === 'box' ? BOXES : CYLS)[s.plat[1]] || null; floorAt(P.x,P.z,P.y+.05); if(FL.o&&Math.abs(FL.h-P.y)<.04)P.plat=FL.o; }
        for (const c of s.drops || []) COINS.push(Object.assign({}, c));
        for (const i of s.gotCoins || []) if (COINS[i]) COINS[i].got = true;
        REDS.forEach((r, i) => r.got = !!s.reds?.[i]);
        LIFE.forEach((l, i) => { l.got = !!s.lives?.[i]; lifeMeshes[i].visible = !l.got; });
        ACS.forEach((a, i) => { const q = s.acorns?.[i]; if (q) { [a.x, a.y, a.z, a.hidden, a.taken] = q; a.mesh.position.set(a.x, a.y, a.z); a.mesh.visible = !a.hidden && !a.taken; } });
        ENS.forEach((e, i) => { const q = s.enemies?.[i]; if (!q) return; Object.assign(e, q); e.mesh.position.set(e.x, e.y, e.z); e.mesh.rotation.y = q.angle || 0; e.mesh.visible = e.alive || e.dead > 0; });
        LAMPS.forEach((l, i) => { l.lit = !!s.lamps?.[i]; if (l.lit) { l.m.material.emissive.setHex(0xffb02a); l.m.material.color.setHex(0xffe08a); } });
        if (s.boss && curW === 'boss') { Object.assign(BOSS, fields(s.boss, actorKeys)); BOSS.mesh.position.set(BOSS.x, BOSS.y, BOSS.z); BOSS.mesh.rotation.y = BOSS.face; BOSS.mesh.visible = BOSS.st !== 'gone'; BOSS.mesh.scale.setScalar(BOSS.st === 'dead' ? Math.max(0.01, 2.4 * (1 - BOSS.t / 1.6)) : 2.4); BOSS.stars.visible = BOSS.st === 'dizzy'; BOSS.stars.position.set(BOSS.x, BOSS.y + 5.6, BOSS.z); BOSS.rings.forEach((r, i) => { Object.assign(r, s.boss.rings[i]); r.m.visible = r.on; r.m.position.set(r.x || 0, 2.35, r.z || 0); r.m.scale.set(r.r, 0.7, r.r); }); }
        if (s.boo && curW === 'manor') { Object.assign(BB, s.boo); BB.mesh.position.set(BB.x, BB.y, BB.z); BB.mesh.visible = !['sleep', 'gone'].includes(BB.st); }
        if (s.race && curW === 'peaks') { Object.assign(PERCY, s.race); PERCY.mesh.position.set(PERCY.x, PERCY.y, PERCY.z); PERCY.npc.x = PERCY.x; PERCY.npc.y = PERCY.y; PERCY.npc.z = PERCY.z; }
        SNOWB.length = 0; (s.snow || []).forEach((q, i) => { if (!snowM[i]) return; snowM[i].visible = true; snowM[i].position.set(q.x, q.y, q.z); SNOWB.push(Object.assign({}, q, { m: snowM[i] })); });
        canopyAnim();if(SS&&s.sands){Object.assign(SS,s.sands);sandsAnim();}if(FD&&s.foundry){Object.assign(FD,fields(s.foundry,'valves valveTimes relay elapsed best'));Object.assign(FD.boss,s.foundry.boss);FD.waves=s.foundry.waves||[];FD.lidSolid.y1=FD.boss.st==='gone'?2:5.63;}if(SNOW&&s.coaster){Object.assign(SNOW,s.coaster);SNOW.mittMeshes.forEach((m,i)=>m.visible=!(SNOW.mittens&(1<<i)));}if(SCHOOL&&s.school)Object.assign(SCHOOL,s.school);
        if (GROT && s.grotto) Object.assign(GROT, s.grotto);if(s.powerRun)Object.assign(POWER_RUN,s.powerRun);powerAnim(clock);
        mode = ['play', 'card', 'dlg', 'win', 'ending', 'over'].includes(s.mode) ? s.mode : 'play'; paused = !!s.paused; pauseI = s.pauseI || 0; card = s.card; winT = s.winT || 0; endT = s.endT || 0; overT = s.overT || 0; overSent = !!s.overSent; lastResult = s.result || null; winA = ACS.find(a => a.id === s.win) || null;
        dlg = null;
        if (s.dlg) { const d = s.dlg, npc = NPCS[d.npc] || { name: d.name }; let done = npc.done || (d.race ? () => percyStart() : null);
          if (curW === 'boss' && BOSS.st === 'intro') done = () => { BOSS.st = 'hop'; BOSS.t = 0; BOSS.vy = 12; music('boss'); };
          if (curW === 'manor' && BB.st === 'intro') done = () => { BB.st = 'fight'; BB.t = 0; music('boss'); };
          dlg = Object.assign({}, d, { npc, done });
        }
        fading = s.fade?.action ? Object.assign({}, s.fade, { fn: () => applyTransition(s.fade.action) }) : null;
        const c = s.camera; if (c) { Object.assign(C, fields(c, 'yaw want auto ty dist arm lift winYaw indoorAuto')); C.pos.fromArray(c.pos); C.look.fromArray(c.look); }
        if (s.feedback) ({ shake, flash, msg, msgT, msg2, msgCol } = s.feedback);
        if (s.visuals) BOP.blink = s.visuals.blink;
        worldAnim(0, clock); animBop(0, clock); trialAnim(0, clock);
        if (GROT) { GROT.pearlMeshes.forEach((m,i)=>m.visible=!(GROT.pearls&(1<<i))); grottoAnim(clock); }
        if (s.visuals) { const v = s.visuals; ENS.forEach((e, i) => setPose(e.mesh, v.enemies[i])); NPCS.forEach((n, i) => setPose(n.mesh, v.npc[i])); if (curW === 'boss') { setPose(BOSS.mesh, v.boss); setPose(BOSS.stars, v.stars); } if (curW === 'manor') setPose(BB.mesh, v.boo); if (curW === 'peaks') setPose(PERCY.mesh, v.race); } if (winA) winA.mesh.visible = true;
        if(SNOW){const n=NPCS.find(n=>n.snowRival);if(n?.mesh){n.x=n.mesh.position.x;n.z=n.mesh.position.z;n.y=['count','run','recover'].includes(SNOW.phase)||SNOW.phase==='finish'&&SNOW.race?snowAt(SNOW.rivalS).y:40;}}
        if (s.lens) { cam.position.fromArray(s.lens.pos); cam.quaternion.fromArray(s.lens.quat); cam.fov=s.lens.fov||60;cam.updateProjectionMatrix(); }
        else { cam.position.copy(C.pos); cam.lookAt(C.look); }
        cam.updateMatrixWorld(true); if(winA){animBop(0,clock);poseReward();}
        if (mode === 'over' && overSent && lastResult) K.over(lastResult.score, { title: lastResult.title, text: lastResult.text });
        if (Number.isSafeInteger(s.random) && s.random >= randomCount) while (randomCount < s.random) rnd();
        WG.updateMatrixWorld(true); music(paused || mode === 'win' || mode === 'card' || mode === 'over' ? null : mode === 'ending' ? 'ending' : playSong());
        return true;
      }
      let tok0 = 0;
      function sendScore(final, title, text) {
        const sc = Math.min(prog.score, 20000, Math.floor(95 * (K.t - tok0 + 4)));
        tok0 = K.t;
        if (final) { lastResult = { score: sc, title, text }; K.over(sc, { title, text }); } else K.over(sc, { keep: true });
      }
      const castN = id => { try { return String(window.Cast && Cast.n(id) || 'PLAYER').toUpperCase(); } catch (e) { return 'PLAYER'; } };
      const myName = () => castN('me');
      function addHs() { if (prog.score <= 0) return; prog.hs.push({ n: myName(), cast: 'me', s: Math.min(prog.score, 20000), a: nAc() }); prog.hs.sort((a, b) => b.s - a.s); prog.hs = prog.hs.slice(0, 5); }
      function table() {
        const rows = [['mate1', 14800, 29], ['mate2', 11200, 22], ['mate3', 8600, 17], ['mate4', 5200, 10], ['kidPoke', 3100, 6], ['kidEp1', 1800, 3], ['mom', 600, 1]].map(([id, s, a]) => ({ n: castN(id), s, a, mate: 1 }));
        return rows.concat(prog.hs.map(r => r.cast ? Object.assign({}, r, { n: castN(r.cast) }) : r)).sort((a, b) => b.s - a.s).slice(0, 8);
      }

      let curW = 'hub', demo = false;
      const visit = { coins: 0, reds: 0, kills: 0, t: 0, life50: 0 };
      let LAMPS = [], PROPS = [], chestOpen = {}, plugOut = {}, bossDown = false, raceWon = false;
      const HPMAX = () => prog.opt.easy ? 8 : 6;
      let clock = 0, motionClock = 0, mission = 0;
      const P = { ledge:null,ledgeLock:0,grabBuf:0,buf: 0, poundBuf: 0, coyote: 0, wallLock: 0, crouchT: 0, crouchSpeed: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, face: 0, gnd: true, st: 'idle', stT: 0, chain: 0, chainT: 0, twirl: false, kicked: false, wallT: 0, wnx: 0, wnz: 0, punchN: 0, punchT: 0, inv: 0, hp: 6, plat: null, safe: [0, 0, 0], safeT: 0, run: 0, land: 0, ctrl: 0, yaw: 0, spin: 0, fallY: 0, swimming: false, air: 30, airClock: 0, stroke: 0, power:null, powerT:0, gliding:false };
      const IN = { x: 0, y: 0, a: false, aH: false, b: false, c: false, cH: false, l: false, r: false };
      function readInput() { const s = K.stick(), mag = Math.hypot(s.x, s.y), scale = mag > 0.18 ? Math.min(1, (mag - 0.18) / 0.82) / mag : 0; IN.x = s.x * scale; IN.y = s.y * scale; IN.a = K.pressed('a'); IN.aH = K.held('a'); IN.b = K.pressed('b'); IN.c = K.pressed('c') || K.pressed('x'); IN.cH = K.held('c') || K.held('x'); IN.l = K.pressed('l'); IN.r = K.pressed('r'); }

      // ================================================================ building and leaving worlds
      let baseCoins = 0;
      let coinMesh_ = null, redMesh_ = null, coinSpark_ = null, coinScales = [], lifeMeshes = [], doorExit = null, snowM = [];
      const coinMat = T3.mat({ vcol:true, color: 0xffd35b, emissive: 0x291a02 }), redMat = T3.mat({ vcol:true, color: 0xff6262, emissive: 0x290707 });
      function disposeWorld() {
        WG.traverse(o => { if (o.geometry && !o.geometry.userData.persist) o.geometry.dispose(); if (o.isInstancedMesh && o.dispose) o.dispose(); });
        T3.scene.remove(WG); WG = null;
      }
      function buildWorld(id) {
        if (WG) disposeWorld();
        WG = new T.Group(); T3.add(WG); BK = buckets(); WD = WORLDS[id]; curW = id;
        const worldRandom = K.rnd(64 + Object.keys(WORLDS).indexOf(id) * 113); randomCount = 0; rnd = () => { randomCount++; return worldRandom(); }; CAM_MESHES.length = 0; doorExit = null; P.plat = null; clock = 0; motionClock = 0; TRIAL = null; GROT = null; SNOW = null; SCHOOL = null; FD = null; SS=null; CAN=null; msgT=0;msg=msg2=''; winA = null; dlg = null; card = null; mission = 0;
        BOXES.length = 0; CYLS.length = 0; MOVERS.length = 0; COINS = []; REDS = []; ACS = []; ENS = []; NPCS = []; DOORS = []; LIFE = []; LAMPS = []; PROPS = []; SNOWB.length = 0;
        chestOpen = {}; plugOut = {}; bossDown = false; raceWon = false; PERCY.on = false; PERCY.st = 'idle'; BB.on = false;
        Object.assign(visit, { coins: 0, reds: 0, kills: 0, t: 0, life50: 0, kicks: 0 });
        POWER_RUN={rings:0,pressure:0,gate:0,ledger:false,safeLoot:false,phaseCross:0};powerBoxes=[];powerPortals=[];powerGates=[];powerSwitch=null;powerRings=[];powerLedger=null;
        WD.build(); buildTrial(id); if(id==='manor')manorSigns();buildPowerContent(id);buildSchool();if(id==='hub')ORDER.slice(7).forEach((w,i)=>hubDoor(w,i+7));
        if (WD.exitAt) exitDoorBuild();
        BK.flush();
        T3.sky(id==='snowhall'?WD.fog[0]:0xa8d4f8);if(SNOW&&WG.userData.dome)WG.userData.dome.visible=false;
        const f = T3.scene.fog; f.color.setHex(WD.fog[0]); f.near = WD.fog[1]; f.far = WD.fog[2];
        const l = WD.light; LT.hemi.color.setHex(l.sky); LT.hemi.groundColor.setHex(l.gnd); LT.hemi.intensity = l.amb; LT.sun.intensity = l.sun; LT.sun.color.setHex(l.sunCol || 0xffffff); LT.sun.position.set(...l.dir);
        baseCoins = COINS.length;
        coinMesh_ = new T.InstancedMesh(coinGeo, coinMat, COINS.length + 40); coinMesh_.frustumCulled = false; WG.add(coinMesh_);
        redMesh_ = new T.InstancedMesh(coinGeo, redMat, Math.max(1, REDS.length)); redMesh_.frustumCulled = false; WG.add(redMesh_);
        coinSpark_=new T.InstancedMesh(coinSparkGeo,mat('coinSpark',{color:0xfff1bc,lit:false}),12);coinSpark_.frustumCulled=false;WG.add(coinSpark_);coinScales=[];
        for (const a of ACS) { a.mesh = new T.Mesh(acornGeo, gotAc(a.id) ? matGhost : matAcorn); a.mesh.position.set(a.x, a.y, a.z); a.mesh.visible = !a.hidden; WG.add(a.mesh); }
        for (const e of ENS) { e.mesh = new T.Mesh(model(e.kind), e.kind === 'boohoo' ? ghostMat : matV()); e.mesh.position.set(e.x, e.y, e.z); WG.add(e.mesh); }
        for (const n of NPCS) { n.mesh = new T.Mesh(model(n.kind), n.ghost ? ghostMat : matV()); n.mesh.position.set(n.x, n.y, n.z); n.mesh.rotation.y = n.face; WG.add(n.mesh); if(n.snowRival){const gear=new T.Mesh(merge([pt(S.hemi(12),0x76c5c9,0,1.42,0,.85,.5,.8),pt(S.box(),0xf4d17f,0,1.28,-.48,.62,.2,.12),pt(S.box(),0x415a72,0,1.29,-.55,.49,.12,.05)]),matV());n.mesh.add(gear);}if (n.kind === 'sign') { letterSign(n); CAM_MESHES.push(n.mesh); } if (n.percy) { PERCY.mesh = n.mesh; PERCY.npc = n; } else if (!n.ghost&&!n.snowRival&&!n.foundryBoss&&!n.canBoss) CYLS.push({ k: 'cyl', x: n.x, z: n.z, r: n.kind === 'sign' ? 0.3 : 0.75, y0: n.y - 0.2, y1: n.y + (n.kind === 'sign' ? 1.75 : ['postmaster','gardener'].includes(n.kind)?2.15:1.6) }); }
        lifeMeshes = LIFE.map(o => { const m = new T.Mesh(model('life'), matV()); m.position.set(o.x, o.y, o.z); m.scale.setScalar(0.9); WG.add(m); return m; });
        snowM = []; for (let i = 0; i < 6; i++) { const m = new T.Mesh(model('snowball'), matV()); m.visible = false; WG.add(m); snowM.push(m); }
        if (id === 'manor') BB.init(); if (id === 'boss') BOSS.init();foundryInit();canopyInit();
      }
      function exitDoorBuild() {
        const [x, z] = WD.exitAt, sx = WD.spawn[0], sz = WD.spawn[1], d = Math.hypot(sx - x, sz - z) || 1, fx = (sx - x) / d, fz = (sz - z) / d, ry = Math.atan2(fx, fz), y = WD.power ? floorAt(x,z,WD.spawnY==null?99:WD.spawnY) : WD.ground(x, z) > -100 ? WD.ground(x, z) : floorAt(x, z, 99);
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
          const lid = new T.Mesh(model('lid'), matV()); lid.position.set(0, 0.6, 0.35); m.add(lid); CAM_MESHES.push(m, lid);
          const b = solidBox(x, y, z, 1.0, 0.85, 0.7, ry); b.chest = w; PROPS.push({ kind, b, m, lid, w });
        } else if (kind === 'plug') {
          const m = new T.Mesh(model('plug'), T3.mat({ vcol: true, emissive: 0x2a6a8a })); m.position.set(x, y, z); WG.add(m); CAM_MESHES.push(m);
          const b = solidBox(x, y, z, 1.3, 0.6, 1.3, 0); b.plug = w; PROPS.push({ kind, b, m, w });
        }
      }
      function poundOn(o) {
        if (!o) return;
        foundryPound(o);sandsPound(o);canopyPound(o);
        if(o.schoolButton&&SCHOOL?.active&&SCHOOL_LESSONS[SCHOOL.lesson]?.[1]==='pound')SCHOOL.seen=true;
        if(o.powerSwitch)unlockPower(o.powerSwitch);
        if (o.trial) trialStart();
        if (Number.isInteger(o.bell)) chime(o.bell);
        if (o.chest && !chestOpen[o.chest]) {
          chestOpen[o.chest] = true; const pr = PROPS.find(p => p.b === o); if (pr) pr.open = 0.001;
          K.sfx.seq([[67, 0.25], [71, 0.25], [74, 0.25], [79, 0.75]], { bpm: 300, vol: 0.09, wave: 'square' }); burst(o.x, o.y + 1, o.z, [0xffd23a, 0xffffff], 14, 6);
          reveal('chest');
        }
        if (o.plug && !plugOut[o.plug]) {
          plugOut[o.plug] = true; const pr = PROPS.find(p => p.b === o); if (pr) { pr.m.visible = false; const i = BOXES.indexOf(o); if (i >= 0) BOXES.splice(i, 1); if (P.plat === o) P.plat = null; }
          burst(o.x, o.y + 0.5, o.z, [0xbfe8ff, 0xffffff], 18, 7); K.sfx.noise(0.4, 0.15, 3000); reveal('plug');
        }
      }

      // ================================================================ collisions
      const FL = { h: 0, o: null };
      function floorAt(x, z, y) {
        let h = WD.ground(x, z), o = null;
        for (const b of BOXES) { if(b.open||b.phase&&P.power==='peek')continue;const dx = x - b.x, dz = z - b.z; if (Math.abs(dx) > b.hw + b.hd + 0.4 || Math.abs(dz) > b.hw + b.hd + 0.4) continue; const lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs; if (Math.abs(lx) < b.hw + 0.22 && Math.abs(lz) < b.hd + 0.22) { const t = b.y + b.hh; if (t <= y + 0.55 && t > h) { h = t; o = b; } } }
        for (const c of CYLS) { const dx = x - c.x, dz = z - c.z; if (dx * dx + dz * dz < (c.r + 0.18) * (c.r + 0.18) && c.y1 <= y + 0.55 && c.y1 > h) { h = c.y1; o = c; } }
        FL.h = h; FL.o = o; return h;
      }
      function slopeAt(x, z) { const e = 0.3, g = WD.ground; return Math.hypot(g(x + e, z) - g(x - e, z), g(x, z + e) - g(x, z - e)) / (2 * e); }
      function pushOut(o, r, hgt, rec) { // o: anything with x, y, z
        let hit = false;
        for (const b of BOXES) {
          if(b.open||b.phase&&P.power==='peek')continue;
          const top = b.y + b.hh, bot = b.y - b.hh;
          if (o.y >= top - 0.45 - 1e-6 || o.y + hgt <= bot) continue;
          const dx = o.x - b.x, dz = o.z - b.z; if (Math.abs(dx) > b.hw + b.hd + r + 0.5 || Math.abs(dz) > b.hw + b.hd + r + 0.5) continue;
          const lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs, ox = b.hw + r - Math.abs(lx), oz = b.hd + r - Math.abs(lz);
          if (ox > 0 && oz > 0) {
            let px = 0, pz = 0; if (ox < oz) px = (lx < 0 ? -1 : 1) * ox; else pz = (lz < 0 ? -1 : 1) * oz;
            const wx = px * b.cs + pz * b.sn, wz = -px * b.sn + pz * b.cs; o.x += wx; o.z += wz; hit = true;
            if (rec) { const l = Math.hypot(wx, wz) || 1; rec(wx / l, wz / l); }
          }
        }
        for (const c of CYLS) {
          if (o.y >= c.y1 - 0.45 - 1e-6 || o.y + hgt <= c.y0) continue;
          const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
          if (d < m) { const nx = d > 0.0001 ? dx / d : 1, nz = d > 0.0001 ? dz / d : 0; o.x = c.x + nx * m; o.z = c.z + nz * m; hit = true; if (rec) rec(nx, nz); }
        }
        const bd = WD.bound || 70;
        if (WD.square) { o.x = clamp(o.x, -bd, bd); o.z = clamp(o.z, -bd, bd); } else { const R = Math.hypot(o.x, o.z); if (R > bd) { o.x *= bd / R; o.z *= bd / R; } }
        return hit;
      }
      const wallRec = (nx, nz) => { if (!P.gnd && P.st !== 'pound' && P.wallLock <= 0 && P.vx * nx + P.vz * nz < -0.5) { P.wallT = 0.18; P.wnx = nx; P.wnz = nz; } };

      // ================================================================ Bopper's moves
      const snd = {
        jump: k => K.sfx.tone([300, 360, 440, 260][k] || 300, 0.15, 'square', 0.06, 0, [700, 900, 1200, 600][k] || 700),
        coin: () => { K.sfx.tone(1318, 0.05, 'square', 0.05); K.sfx.tone(1760, 0.1, 'square', 0.05, 0.05); },
        hit: () => { K.sfx.tone(180, 0.12, 'square', 0.08, 0, 60); K.sfx.noise(0.15, 0.1, 900); },
        hurt: () => K.sfx.tone(420, 0.3, 'sawtooth', 0.07, 0, 110),
        step: () => {if(P.power==='tin'){K.sfx.tone(115,.07,'triangle',.055,0,65);K.sfx.tone(740,.04,'sine',.025);}else K.sfx.noise(0.03,0.025,700);},
        boing: () => K.sfx.tone(160, 0.35, 'triangle', 0.1, 0, 900),
        pound: () => { K.sfx.tone(90, 0.25, 'sine', 0.18, 0, 40); K.sfx.noise(0.2, 0.12, 500); },
        whoosh: () => K.sfx.noise(0.18, 0.05, 1800, 0, 'bandpass', 4000),
      };
      let shake = 0, flash = 0, msg = '', msgT = 0, msg2 = '', msgCol = '#ffd23a';
      const say = (s, t, s2, c) => { msg = s; msgT = t || 2; msg2 = s2 || ''; msgCol = c || '#ffd23a'; };
      function respawnAt(x, y, z, face) { Object.assign(P, { ledge:null,ledgeLock:0,grabBuf:0,x, y, z, vx: 0, vy: 0, vz: 0, face, gnd: true, st: 'idle', stT: 0, chain: 0, chainT: 0, buf: 0, poundBuf: 0, coyote: 0, crouchT: 0, wallLock: 0, twirl: false, kicked: false, wallT: 0, plat: null, ctrl: 0, yaw: face, spin: 0, swimming: false, air: 30, airClock: 0, stroke: 0, power:null, powerT:0, gliding:false }); floorAt(x, z, y + 1); if (FL.h > -100) P.y = FL.h; P.safe = [P.x, P.y, P.z]; camSnap(); }
      function hurt(n, fx, fz) {
        if(P.power==='tin'||P.power==='peek')return;
        if (P.inv > 0 || demo || P.st === 'dead' || mode !== 'play') return;
        P.hp -= n; P.inv = 1.6; flash = 0.25; shake = 0.25; snd.hurt();
        const dx = P.x - fx, dz = P.z - fz, d = Math.hypot(dx, dz) || 1; P.vx = dx / d * 8; P.vz = dz / d * 8; P.vy = 8; P.gnd = false; P.coyote = 0; P.st = 'hurt'; P.stT = 0; P.ctrl = 0.45;
        if (P.hp <= 0) die();
      }
      function die() { P.hp = 0; P.st = 'dead'; P.stT = 0; P.vy = 9; P.vx = P.vz = 0; K.music(null); K.sfx.seq([[72, 0.25], [67, 0.25], [64, 0.25], [60, 0.25], [55, 1]], { bpm: 220, vol: 0.09, wave: 'triangle' }); }
      function fallOut() { // into the void or the deep sea: two bites and back to the last safe spot
        if (demo) { respawnAt(...P.safe, P.face); return; }
        P.hp -= 2; flash = 0.3; if (P.hp <= 0) return die();
        say('WHOOPS!', 1.2); iris({ op: 'safe', pose: P.safe.slice(), face: P.face });
      }
      function swimPlayer(dt, wx, wz, wl) {
        P.swimming=true;P.gnd=false;P.plat=null;P.st='swim';P.wallT=P.chainT=P.coyote=P.buf=0;
        const speed=5.5,drag=1-Math.exp(-dt*4.2);
        let flowX=0,flowZ=0;const gate=GROT&&GROT.route[GROT.gate];
        if(gate&&Math.hypot(P.x-16,P.z+4)<13&&P.y<-2){const dx=gate[0]-P.x,dz=gate[2]-P.z,d=Math.hypot(dx,dz)||1;flowX=dx/d*1.5;flowZ=dz/d*1.5;}
        P.vx+=(wx*speed+flowX-P.vx)*drag;P.vz+=(wz*speed+flowZ-P.vz)*drag;
        if(wl>.1)P.face+=wrapA(Math.atan2(-wx,-wz)-P.face)*Math.min(1,dt*8);
        const surface=WD.water-.9, vertical=IN.cH?-4.1:IN.aH?4.6:clamp((surface-P.y)*.5,-1.5,.5);
        P.vy+=(vertical-P.vy)*(1-Math.exp(-dt*5));
        if(IN.a){P.stroke=.32;K.sfx.tone(330,.06,'sine',.025,0,470);if(P.y>surface-.5){P.swimming=false;P.st='jump';P.stT=0;P.vy=11;P.twirl=false;P.land=0;snd.jump(1);burst(P.x,WD.water,P.z,[0xc4f6ef,0xffffff],10,3,{grav:5});return;}}
        P.stroke=Math.max(0,(P.stroke||0)-dt);
        if(IN.b){const chest=PROPS.find(p=>p.kind==='chest'&&Math.hypot(P.x-p.b.x,P.z-p.b.z)<2.6&&Math.abs(P.y-p.b.y)<2);if(chest)poundOn(chest.b);else attack(1.1,1.3);}
        const oy=P.y,steps=Math.max(1,Math.ceil(Math.hypot(P.vx,P.vz)*dt/.3));
        for(let i=0;i<steps;i++){const x=P.x,z=P.z;P.x+=P.vx*dt/steps;P.z+=P.vz*dt/steps;if(WD.ground(P.x,P.z)>P.y+.65){P.x=x;P.z=z;}pushOut(P,.42,1.25);}
        P.y+=P.vy*dt;
        for(const b of BOXES){const bot=b.y-b.hh,dx=P.x-b.x,dz=P.z-b.z,lx=dx*b.cs-dz*b.sn,lz=dx*b.sn+dz*b.cs;if(P.vy>0&&Math.abs(lx)<b.hw+.15&&Math.abs(lz)<b.hd+.15&&oy+1.25<=bot+.05&&P.y+1.25>bot){P.y=bot-1.25;P.vy=0;}}
        const floor=floorAt(P.x,P.z,Math.max(oy,P.y));if(P.y<floor){P.y=floor;P.vy=Math.max(0,P.vy);}
        if(floor<surface&&P.y>surface){P.y=surface;P.vy=Math.min(P.vy,0);}
        const bubbles=GROT&&GROT.vents.some(([x,z])=>Math.hypot(P.x-x,P.z-z)<1.6);
        if(P.y+1.4>WD.water-.2||bubbles)P.air=Math.min(30,(P.air??30)+dt*14);else P.air=Math.max(0,(P.air??30)-dt);
        if(P.air<8&&Math.floor(P.air)!==Math.floor(P.air+dt))K.sfx.tone(600,.06,'triangle',.04);
        if(P.air<=0){P.airClock=(P.airClock||0)+dt;if(P.airClock>1.5){P.airClock=0;P.hp--;flash=.16;if(P.hp<=0)die();}}else P.airClock=0;
        P.run+=dt*(4+Math.hypot(P.vx,P.vz));
        if((K.frame%16)===0)burst(P.x,P.y+1.2,P.z,0xa8e4ed,1,.25,{grav:-.6,life:.7,size:.1});
      }

      function stepPlayer(dt) {
        P.ledgeLock=Math.max(0,(P.ledgeLock||0)-dt);P.grabBuf=IN.a&&!P.gnd?.14:Math.max(0,(P.grabBuf||0)-dt);
        // Remember an airborne press during the first few takeoff frames, until
        // there is room for the flip. Sample before jumping so grounded Z+A
        // still means backflip/long jump, without queuing a pound as well.
        if (P.gnd || ['pound', 'dead', 'hurt'].includes(P.st)) P.poundBuf = 0;
        else if (IN.c) P.poundBuf = 0.14;
        else P.poundBuf = Math.max(0, (P.poundBuf || 0) - dt);
        P.stT += dt; P.coyote = P.gnd ? 0.1 : Math.max(0, P.coyote - dt); P.wallLock = Math.max(0, P.wallLock - dt); P.buf = Math.max(0, P.buf - dt); P.crouchT = Math.max(0, P.crouchT - dt); if (P.chainT > 0) P.chainT -= dt; if (P.wallT > 0) P.wallT -= dt; if (P.inv > 0) P.inv -= dt; if (P.punchT > 0) P.punchT -= dt; if (P.ctrl > 0) P.ctrl -= dt; if (P.land > 0) P.land -= dt;
        if (P.st === 'dead') { P.vy -= 20 * dt; P.y += P.vy * dt; P.spin += dt * 10; if (P.stT > 2.2 && !fading) afterDeath(); return; }
        if(ledgeStep(dt)||snowStep(dt))return;
        const bodyH=manorCamera()?(prog.opt.big?2.65:P.power==='peek'?2.2:1.9):1.25;
        const cy = C.yaw, fx = -Math.sin(cy), fz = -Math.cos(cy), rx = Math.cos(cy), rz = -Math.sin(cy);
        let wx = fx * -IN.y + rx * IN.x, wz = fz * -IN.y + rz * IN.x, wl = Math.hypot(wx, wz); if (wl > 1) { wx /= wl; wz /= wl; wl = 1; }
        if (WD.swimEnabled && P.power!=='tin' && P.y < WD.water - .6 && WD.ground(P.x,P.z) < WD.water - .8 && !(P.st === 'jump' && P.vy > 0)) return swimPlayer(dt, wx, wz, wl);
        P.swimming = false; if (WD.swimEnabled) P.air = Math.min(30, (P.air ?? 30) + dt * 14);
        const sp = Math.hypot(P.vx, P.vz), wantF = Math.atan2(-wx, -wz);
        const gnd0 = WD.ground(P.x, P.z), wade = WD.water != null && P.gnd && P.y < WD.water + 0.05 && gnd0 > WD.water - 0.8;
        const onIce = P.gnd && (P.plat ? !!P.plat.ice : !!(WD.ice && WD.ice(P.x, P.z)));
        const WIND=sandWind(P.x,P.y,P.z);
        const TOP = 8.2 * (P.power==='tin'?.65:wade ? 0.6 : 1);
        if (P.gnd && !IN.cH) { P.crouchSpeed = sp; P.crouchT = 0.14; }
        if (P.gnd) {
          if (P.ctrl > 0 || P.st === 'punch' || (P.st === 'poundLand' && P.stT < 0.25)) { const k = Math.max(0, 1 - 9 * dt); P.vx *= k; P.vz *= k; if (P.st === 'punch' && P.stT > 0.28) P.st = 'idle'; if (P.st === 'poundLand' && P.stT >= 0.25) P.st = 'idle'; }
          else if (IN.cH) { P.st = 'crouch'; const k = Math.max(0, 1 - (onIce ? 1 : 7) * dt); P.vx *= k; P.vz *= k; if (wl > 0.1) P.face += wrapA(wantF - P.face) * Math.min(1, dt * 8); }
          else {
            const acc = (onIce ? 5 : 44) * dt; let dvx = wx * TOP - P.vx, dvz = wz * TOP + WIND - P.vz; const dl = Math.hypot(dvx, dvz); if (dl > acc) { dvx *= acc / dl; dvz *= acc / dl; }
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
        if(tryLedge()){ledgeStep(dt);return;}
        // A press just before touchdown or wall contact belongs to that move.
        // Holding jump never manufactures another press; coyote time is consumed on takeoff.
        if (!P.gnd && P.wallLock <= 0 && IN.a) {
          const probe = { x: P.x + P.vx * 0.07, y: P.y, z: P.z + P.vz * 0.07 };
          pushOut(probe, 0.44, bodyH, wallRec);
        }
        if (IN.a && !P.gnd && P.coyote <= 0 && P.vy < 0 && P.wallT <= 0 && P.st !== 'pound') {
          floorAt(P.x, P.z, P.y);
          if (P.y - FL.h < Math.max(0.45, -P.vy * 0.13)) { P.buf = 0.14; IN.a = false; }
        }
        if (P.buf > 0 && P.gnd && P.ctrl <= 0) IN.a = true;
        if (IN.a) {
          if ((P.gnd || P.coyote > 0 && P.st === 'fall') && P.ctrl <= 0 && P.st !== 'punch') {
            const s2 = Math.max(Math.hypot(P.vx, P.vz), IN.cH && P.crouchT > 0 ? P.crouchSpeed : 0);
            if (IN.cH && s2 > 3.5) { P.st = 'long'; P.vy = 9.5; const v = Math.max(s2 + 4, 13.5); P.vx = -Math.sin(P.face) * v; P.vz = -Math.cos(P.face) * v; snd.jump(3); snd.whoosh(); }
            else if (IN.cH) { P.st = 'back'; P.vy = 16; P.vx = Math.sin(P.face) * 3; P.vz = Math.cos(P.face) * 3; snd.jump(2); }
            else if(P.st==='skid'&&P.stT<.2&&s2>3.5){P.sideSign=wrapA(wantF-P.face)<0?-1:1;P.face=wantF;P.st='side';P.vy=15;P.vx=wx*5.8;P.vz=wz*5.8;snd.jump(2);snd.whoosh();burst(P.x,P.y+.5,P.z,0xffe4b8,5,2,{life:.3,size:.12});}
            else if (P.chainT > 0 && P.chain === 1) { P.st = 'jump2'; P.vy = 14; snd.jump(1); }
            else if (P.chainT > 0 && P.chain === 2 && s2 > 4) { P.st = 'jump3'; P.vy = 16.5; snd.jump(2); burst(P.x, P.y + 0.5, P.z, 0xffffff, 6, 3, { life: 0.4 }); }
            else { P.st = 'jump'; P.vy = 11.5; snd.jump(0); }
            if (P.plat && P.plat.mv && P.plat.k === 'box') { P.vx += (P.plat.x - P.plat.px) * 30; P.vz += (P.plat.z - P.plat.pz) * 30; }
            if(P.power==='tin')P.vy*=.7;
            P.stT = 0; P.gnd = false; P.plat = null; P.twirl = false; P.chainT = 0; P.coyote = 0; P.buf = 0; P.land = 0;
          } else if (!P.gnd && P.ctrl <= 0) {
            if (P.wallT > 0 && P.st !== 'pound') {
              P.st = 'wallkick'; P.stT = 0; P.vy = 13; P.vx = P.wnx * 7.5; P.vz = P.wnz * 7.5; P.face = Math.atan2(-P.wnx, -P.wnz); P.wallT = 0; P.wallLock = 0.2; P.coyote = 0; P.buf = 0; P.twirl = false; P.ctrl = 0.12;
              snd.jump(2); burst(P.x - P.wnx * 0.4, P.y + 0.6, P.z - P.wnz * 0.4, 0xffffff, 5, 3, { life: 0.35 }); visit.kicks = (visit.kicks || 0) + 1;
            } else if (!P.twirl && ['jump', 'jump2', 'jump3', 'fall', 'kick', 'wallkick', 'spring', 'back', 'side', 'hurt'].includes(P.st)) { P.twirl = true; P.st = 'twirl'; P.stT = 0; P.vy = Math.max(P.vy, 7.5); K.sfx.tone(700, 0.2, 'triangle', 0.06, 0, 1400); }
          }
        }
        if (IN.b) {
          if(curW==='peaks'&&P.gnd&&Math.hypot(P.x+46,P.z+13.4)<2){iris({op:'snowIn'});return;}
          if(snowInput()||sandsInput()||canopyInput())return;
          const door = P.gnd && nearManorDoor(); if(door){useManorDoor(door);return;}
          const rang = P.gnd && tryChime(), n = P.gnd && !demo && !rang ? nearTalk() : null;
          if (n) { startTalk(n); return; }
          if (P.gnd && P.st !== 'crouch' && P.ctrl <= 0) {
            P.punchN = P.punchT > 0 ? (P.punchN % 3) + 1 : 1; P.punchT = 0.45; P.st = 'punch'; P.stT = 0;
            const k = P.punchN === 3 ? 4.5 : 3; P.vx += -Math.sin(P.face) * k; P.vz += -Math.cos(P.face) * k; K.sfx.noise(0.08, 0.08, P.punchN === 3 ? 900 : 1600); attack(1.1, 1.0);
          } else if (!P.gnd && !P.kicked && P.st !== 'pound') { P.kicked = true; P.st = 'kick'; P.stT = 0; P.vx += -Math.sin(P.face) * 3; P.vz += -Math.cos(P.face) * 3; P.vy = Math.max(P.vy, 3); K.sfx.noise(0.1, 0.08, 1300); }
        }
        if (P.st === 'punch' && P.stT < 0.2) attack(1.1, 1.0);
        if (P.st === 'kick' && P.stT < 0.35) attack(0.9, 1.0);
        if (P.poundBuf > 0 && !P.gnd && !['pound', 'dead', 'hurt'].includes(P.st)) { floorAt(P.x, P.z, P.y); if (P.y - FL.h > 0.9) { P.poundBuf = 0; P.st = 'pound'; P.stT = 0; P.vx = P.vz = 0; P.vy = 0; K.sfx.tone(600, 0.25, 'square', 0.05, 0, 200); } }
        // gravity
        let g = 36;
        if (P.st === 'pound') { g = 0; if (P.stT < 0.28) { P.vy = 0; P.vx = P.vz = 0; } else P.vy = -32; }
        else if (['jump', 'jump2', 'jump3', 'back', 'side', 'wallkick', 'twirl'].includes(P.st) && IN.aH && P.vy > 0) g = 24;
        else if (P.st === 'spring' && P.vy > 0) g = 24;
        else if (P.st === 'long') g = 28;
        if (P.wallT > 0 && !P.gnd && P.vy < 0 && P.st !== 'pound') P.vy = Math.max(P.vy, -6);
        const wasGliding=P.gliding;P.gliding=P.power==='brolly'&&!P.gnd&&IN.aH&&!IN.cH&&P.st!=='pound'&&P.vy<1;
        if(P.gliding){if(!wasGliding)snd.whoosh();P.st='glide';g=6;P.vy=Math.max(P.vy,-2.5);P.vx+=(wx*10-P.vx)*Math.min(1,dt*2);P.vz+=(wz*10-P.vz)*Math.min(1,dt*2);}
        if(P.power==='tin')g*=1.5;
        P.vy = Math.max(P.gliding?-2.5:-32, P.vy - g * dt);
        // move: across (with the walls and steep ground), then up and down
        const ox = P.x, oz = P.z;
        let bx = 0, bz = 0; if (P.gnd && P.plat && P.plat.belt) { bx = P.plat.belt[0]; bz = P.plat.belt[1]; }
        const steps = Math.max(1, Math.ceil(Math.hypot(P.vx, P.vz) * dt / 0.3));
        for (let s = 0; s < steps; s++) {
          const px = P.x, pz = P.z; P.x += (P.vx + bx) * dt / steps; P.z += (P.vz + bz) * dt / steps;
          if (WD.ground(P.x, P.z) > -100) { const ng = WD.ground(P.x, P.z); if (ng > P.y + 0.6 || (ng > P.y + 0.05 && slopeAt(P.x, P.z) > 1.15)) { const mx = P.x - px, mz = P.z - pz, ml = Math.hypot(mx, mz) || 1; P.x = px; P.z = pz; if (!P.gnd) wallRec(-mx / ml, -mz / ml); } }
          pushOut(P, 0.42, bodyH, wallRec);
        }
        const oy = P.y; P.y += P.vy * dt;
        if (P.vy > 0) for (const b of BOXES) { const bot = b.y - b.hh, dx = P.x - b.x, dz = P.z - b.z, lx = dx * b.cs - dz * b.sn, lz = dx * b.sn + dz * b.cs; if (Math.abs(lx) < b.hw + 0.15 && Math.abs(lz) < b.hd + 0.15 && oy + bodyH <= bot + 0.05 && P.y + bodyH > bot) { P.y = bot - bodyH; P.vy = 0; K.sfx.tone(140, 0.08, 'square', 0.05); } }
        const gh = floorAt(P.x, P.z, Math.max(oy, P.y)), go = FL.o;
        if (P.y <= gh) { if (!P.gnd) land(gh, go); else { P.y = gh; P.vy = 0; P.plat = go; } }
        else if (P.gnd && P.vy <= 0 && P.y - gh < 0.42 && !(P.plat && P.plat.bounce)) { P.y = gh; P.plat = go; P.vy = 0; }
        else if (P.y > gh + 0.05) { if (P.gnd) { P.gnd = false; P.plat = null; if (!['jump', 'jump2', 'jump3', 'long', 'back', 'spring'].includes(P.st)) { P.st = 'fall'; P.stT = 0; } P.fallY = P.y; } }
        if (!P.gnd && P.vy < 0 && ['jump', 'jump2', 'wallkick', 'twirl', 'kick'].includes(P.st) && P.stT > 0.3 && P.st !== 'jump2') { /* keep pose */ }
        if(tryLedge()){ledgeStep(0);return;}
        // the sea, the lava, the void
        if (!WD.swimEnabled && WD.water != null && P.y < WD.water - 0.6 && WD.ground(P.x, P.z) < WD.water - 0.4) { burst(P.x, WD.water, P.z, [0x9ad8ff, 0xffffff], 14, 6); K.sfx.noise(0.5, 0.2, 800); return fallOut(); }
        if (WD.lava != null && P.y < WD.lava + 0.1 && P.st !== 'dead') { P.y = WD.lava + 0.1; P.vy = 17; P.gnd = false; P.st = 'burn'; P.stT = 0; P.ctrl = 1.4; const ddx = P.safe[0] - P.x, ddz = P.safe[2] - P.z, d = Math.hypot(ddx, ddz) || 1, v = Math.min(12, d / 1.5); P.vx = ddx / d * v; P.vz = ddz / d * v; burst(P.x, P.y, P.z, [0xffa82a, 0xff4a1a], 14, 6); K.sfx.tone(800, 0.4, 'sawtooth', 0.07, 0, 1600); if (!demo) { P.hp -= 1; P.inv = 0.6; flash = 0.3; if (P.hp <= 0) return die(); } }
        if (P.y < WD.killY) return fallOut();
        // the last safe place to stand
        if (P.gnd && !(P.plat && (P.plat.mv || P.plat.bounce)) && !wade && (P.plat || !WD.safeOnly)) { P.safeT += dt; if (P.safeT > 0.5) { P.safeT = 0; P.safe = [P.x, P.y, P.z]; } }
        P.run += dt * Math.hypot(P.vx, P.vz) * 1.9;
        if (P.gnd && Math.hypot(P.vx, P.vz) > 5 && (P.run % 3.14) < dt * Math.hypot(P.vx, P.vz) * 1.9) { snd.step(); if (Math.random() < 0.5) burst(P.x, P.y + 0.1, P.z, wade ? 0xbfe8ff : 0xd8d0c0, 2, 1.5, { life: 0.35, size: 0.15, grav: 2 }); }
      }
      function land(gh, o) {
        const was = P.st, vy = P.vy;
        P.y = gh; P.vy = 0; P.gnd = true; P.plat = o; P.twirl = false; P.kicked = false; P.wallT = 0; P.stT = 0; P.poundBuf = 0;
        if (was === 'pound') { P.st = 'poundLand'; shake = 0.2; snd.pound(); burst(P.x, gh + 0.1, P.z, 0xe8e0d0, 12, 6, { ring: true, life: 0.4, grav: 0 }); poundOn(o); attack(0, 1.9, true); }
        else { P.chain = was === 'jump' ? 1 : was === 'jump2' ? 2 : 0; P.chainT = P.chain ? 0.38 : 0; P.st = 'idle'; if (vy < -5) P.land = Math.min(0.13, -vy * 0.007); if (vy < -16) { burst(P.x, gh + 0.1, P.z, 0xd8d0c0, 5, 3, { life: 0.35, grav: 4 }); } if (vy < -5) K.sfx.noise(0.06, 0.04, 600); }
        if(P.power==='tin'&&vy<-5){shake=Math.max(shake,.13);K.sfx.tone(90,.13,'triangle',.09,0,45);burst(P.x,gh+.12,P.z,[0xaacfd1,0xd8e7cb],7,2,{ring:true,life:.35,grav:1});}
        if (o && o.bounce) { P.vy = o.bounce; P.gnd = false; P.plat = null; P.st = 'spring'; P.stT = 0; snd.boing(); o.squish = 0.3; burst(P.x, gh, P.z, 0xffb0d0, 8, 4); }
      }
      // punches, kicks, stomps and pounds against baddies
      function attack(reach, rad, pound) {
        const ax = P.x - Math.sin(P.face) * reach, az = P.z - Math.cos(P.face) * reach, ay = P.y + 0.6;
        for (const e of ENS) { if (!e.alive) continue; if (Math.hypot(e.x - ax, e.z - az) < rad + e.r * 0.6 && Math.abs(e.y + e.h * 0.5 - ay) < 1.6) defeat(e, pound ? 'pound' : 'punch'); }
        canopyHit(ax,ay,az,rad);
        if (curW === 'manor') BB.hitTest(ax, ay, az, rad + 1.2);
        if (curW === 'manor') for (const L_ of LAMPS) if (!L_.lit && Math.hypot(L_.x - ax, L_.z - az) < rad + 0.6) lightLamp(L_);
      }
      function defeat(e, how) {
        if (!e.alive) return;
        e.alive = false; e.dead = 0.5; if (!demo) { visit.kills++; prog.score += 25; } snd.hit(); shake = Math.max(shake, 0.1);
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
          const dx = P.x - e.x, dz = P.z - e.z, d = Math.hypot(dx, dz) || 0.001, near = d < e.range && Math.abs(P.y - e.y) < 3 && P.st !== 'dead';
          let tx = 0, tz = 0, sp = 0;
          if(e.kind==='budbug'){e.t+=dt;if(e.st==='idle'&&near&&e.t>1.2){e.st='tell';e.t=0;e.vx=dx/d*4.5;e.vz=dz/d*4.5;}else if(e.st==='tell'&&e.t>.9){e.st='hop';e.t=0;}else if(e.st==='hop'&&e.t>.8){e.st='rest';e.t=0;e.y=e.y0;}else if(e.st==='rest'&&e.t>1.2){e.st='idle';e.t=0;}if(e.st==='hop'){e.x+=e.vx*dt;e.z+=e.vz*dt;e.y=canopyGround(e.x,e.z)+Math.sin(Math.min(1,e.t/.8)*Math.PI)*1.4;}else e.y=canopyGround(e.x,e.z);m.position.set(e.x,e.y,e.z);m.rotation.y=Math.atan2(-e.vx,-e.vz);m.scale.set(1,e.st==='tell'?.72:1,1);}
          else if(e.kind==='scarab'){e.t+=dt;if(e.st==='idle'&&near&&e.t>1.3){e.st='tell';e.t=0;e.vx=dx/d*9;e.vz=dz/d*9;}else if(e.st==='tell'&&e.t>.85){e.st='charge';e.t=0;}else if(e.st==='charge'&&e.t>.8){e.st='rest';e.t=0;}else if(e.st==='rest'&&e.t>1){e.st='idle';e.t=0;}if(e.st==='charge'){const x=e.x+e.vx*dt,z=e.z+e.vz*dt,g=floorAt(x,z,e.y+.5);if(Math.abs(g-e.y)<.5&&Math.hypot(x-e.hx,z-e.hz)<11){e.x=x;e.z=z;e.y=g;}else{e.st='rest';e.t=0;}}if(e.st==='tell')m.rotation.y=Math.atan2(-e.vx,-e.vz);m.scale.set(1,e.st==='tell'?.8+Math.sin(e.t*22)*.06:1,1);m.position.set(e.x,e.y,e.z);}
          else if(e.kind==='kettle'){e.t+=dt;if(e.st==='idle'&&near&&e.t>1.7){e.st='tell';e.t=0;}else if(e.st==='tell'&&!near){e.st='idle';e.t=0;}else if(e.st==='tell'&&e.t>.9){throwSnow(e);e.st='idle';e.t=0;}if(near)m.rotation.y+=wrapA(Math.atan2(-dx,-dz)-m.rotation.y)*Math.min(1,dt*3);m.position.set(e.x,e.y,e.z);m.scale.setScalar(e.st==='tell'?1+Math.sin(e.t*18)*.06:1);}
          else if (e.kind === 'jelly') { e.y = e.y0 + Math.sin(t * 1.7 + e.a) * .9; m.position.set(e.x,e.y,e.z); m.rotation.z = Math.sin(t*2+e.a)*.12; } else if (e.kind === 'grumpy' || e.kind === 'snipper') {
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
            e.y = floorAt(e.x,e.z,(e.y0 ?? 1)+.5) + 0.9 + Math.sin(t * 2 + e.hx) * 0.25;
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
            else if(P.power==='tin')defeat(e,'hit');
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
        if (gotAc('race') && PERCY.st !== 'lost') return [`YOU BEAT ME FAIR AND SQUARE, BOPPER. NOBODY BEATS ${castN('mate3')}! WELL. EXCEPT YOU.`];
        if (PERCY.st === 'race' || PERCY.st === 'count') return ['GO GO GO!'];
        const L0 = PERCY.st === 'lost' ? ['HA! TOO SLOW! FANCY ANOTHER GO?'] : [`ALL RIGHT? I'M ${castN('mate3')}, THE FASTEST PENGUIN ON THE MOUNTAIN.`, 'I BET YOU A GOLDEN ACORN I CAN BEAT YOU DOWN TO THE FLAG AT THE BOTTOM.'];
        return L0.concat(['ON YOUR MARKS... (NO SHORT CUTS. WELL, ANY SHORT CUTS YOU LIKE.)']);
      }
      function percyStart() { if (gotAc('race') && PERCY.st !== 'lost') return; PERCY.st = 'count'; PERCY.t = 3; PERCY.i = 0; PERCY.x = PERCY.home[0]; PERCY.z = PERCY.home[1]; raceWon = false; }
      function percyUpdate(dt) {
        if (!PERCY.mesh) return;
        const n = PERCY.npc;
        if (PERCY.st === 'count') { const before = Math.ceil(PERCY.t); PERCY.t -= dt; const now = Math.ceil(PERCY.t); if (now !== before && now > 0) { say(String(now), 0.9); K.sfx.tone(660, 0.15, 'square', 0.07); } if (PERCY.t <= 0) { PERCY.st = 'race'; PERCY.i = 1; say('GO!', 1); K.sfx.tone(1320, 0.3, 'square', 0.08); } }
        else if (PERCY.st === 'race') {
          const [tx, tz] = PERCY.path[PERCY.i], dx = tx - PERCY.x, dz = tz - PERCY.z, d = Math.hypot(dx, dz), sp = 6.7 * dt;
          if (d < sp) { PERCY.x = tx; PERCY.z = tz; PERCY.i++; if (PERCY.i >= PERCY.path.length) { PERCY.st = 'lost'; say(`${castN('mate3')} WINS!`, 2.5, 'TALK AT THE TOP FOR A REMATCH', '#ff8a8a'); K.sfx.seq([[67, 0.5], [62, 0.5], [55, 1]], { bpm: 200, vol: 0.08 }); PERCY.t = 3; } }
          else { PERCY.x += dx / d * sp; PERCY.z += dz / d * sp; PERCY.mesh.rotation.y = Math.atan2(-dx, -dz); }
          if (Math.hypot(P.x, P.z - 48) < 4 && P.y < 4) { PERCY.st = 'won'; raceWon = true; say('YOU WIN!', 2, `${castN('mate3')}: NOT FAIR! I HAD A FLIPPER CRAMP!`); reveal('race'); }
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
          const m = this.mesh, dx = P.x - this.x, dz = P.z - this.z, d = Math.hypot(dx, dz) || 0.001;
          if (this.st === 'sleep') { if (d < 10 && !gotAc('boohoo') && mode === 'play' && P.gnd) { m.visible = true; this.y = 1.5; this.st = 'intro'; m.position.set(this.x, this.y, this.z); m.rotation.y = Math.atan2(-dx, -dz); startTalk({ name: 'BIG BOOHOO', lines: ['OOOOOH! WHO DARES TO WAKE ME FROM MY BEAUTY SLEEP?', 'A LITTLE ROUND BOY IN A HAT? I SHALL SCARE YOU ALL THE WAY BACK TO BISCUIT ISLAND!', '(LOOK AT HER AND SHE HIDES HER FACE. THAT\'S YOUR CHANCE: PUNCH HER OR JUMP ON HER!)'], done: () => { this.st = 'fight'; this.t = 0; music('boss'); } }); } else if (gotAc('boohoo') && !bossDown) { m.visible = false; } return; }
          if (this.st === 'intro') { m.position.set(this.x, this.y + Math.sin(t * 2) * 0.3, this.z); m.rotation.y = Math.atan2(dx, dz) + Math.PI; return; }
          if (this.st === 'pop') { this.t += dt; m.scale.setScalar(Math.max(0.01, 2.4 * (1 - this.t))); m.rotation.y += dt * 12; if (this.t >= 1) { this.st = 'gone'; m.visible = false; bossDown = true; reveal('boss'); for (let i = 0; i < 6; i++) COINS.push({ x: this.x + Math.cos(i) * 1.5, y: 1.4, z: this.z + Math.sin(i) * 1.5, got: false, pop: 0.5 }); music('manor'); } return; }
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
          for (const R of this.rings) if (R.on) { R.r += dt * (9 + (3 - this.hp) * 1.5); R.m.visible = R.r > 0; R.m.scale.set(Math.max(0, R.r), 0.7, Math.max(0, R.r)); R.m.position.set(R.x, 2.35, R.z); if (R.r > 20) { R.on = false; R.m.visible = false; } const pd = Math.hypot(P.x - R.x, P.z - R.z); if (Math.abs(pd - R.r) < 0.75 && P.y < 2.9 && P.st !== 'dead') hurt(1, R.x, R.z); }
          if (this.st === 'throne') { m.position.set(this.x, this.y + Math.abs(Math.sin(t * 1.5)) * 0.1, this.z); m.rotation.y = 0; if (Math.hypot(P.x, P.z) < 16.5 && P.y > 1 && mode === 'play' && P.gnd) { this.st = 'intro'; startTalk({ name: 'KING GRUMPUS', lines: ['WELL, WELL. IF IT ISN\'T THE LITTLE BOUNCER WHO\'S BEEN PINCHING MY ACORNS.', 'I COLLECTED THOSE FAIR AND SQUARE! BY STEALING THEM! FROM EVERYONE!', 'THE CROWN ACORN IS MINE, BOPPER. COME AND GET IT, IF YOU CAN JUMP OVER MY STOMPS!'], done: () => { this.st = 'hop'; this.t = 0; this.vy = 12; music('boss'); } }); } return; }
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
        if (gotAc(a.id)) { a.mesh.visible = false; burst(a.x, a.y, a.z, 0x8ab8ff, 10, 4); K.sfx.tone(1200, 0.2, 'sine', 0.06); say('(YOU ALREADY HAD THAT ONE)', 1.4, '', '#bcd'); a.taken = true;if(WD.power)leaveWorld(); return; }
        if (curW === 'hub') prog.got[a.id] = 1; else (prog.ac[curW] = prog.ac[curW] || {})[a.id] = 1;
        prog.score += 500; prog.started = 1; a.taken = true; winA = a; mode = 'win'; winT = 0; C.winYaw = null; P.vx = P.vz = 0; P.land = 0; K.music(null);
        K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 0.25], [91, 1.5]], { bpm: 360, vol: 0.1, wave: 'square' });
        K.sfx.seq([[60, 0.5], [64, 0.5], [67, 0.5], [72, 1.5]], { bpm: 180, vol: 0.08, wave: 'triangle' });
        if (curW === 'hub' && ['light', 'hill', 'mill', 'stones', 'pond', 'tree', 'grump', 'pier'].every(k => prog.got[k])) K.secret('rm.hop.all');
        if (a.id === 'wall') K.secret('rm.hop.wall');
        if (nAc() >= TOTAL) K.secret('rm.hop.every');
        saveNow();
      }
      function collectStuff(dt) {
        const py = P.y + 0.6;
        const need=ACS.find(a=>a.power&&P.power!==a.power&&!a.hidden&&!a.taken&&Math.hypot(P.x-a.x,P.z-a.z)<1.4&&Math.abs(py-a.y)<1.8);if(need&&msgT<=0)say('NEEDS '+POWER_DEFS[need.power].name,2,'FIND ITS SECRET SWITCH ON BISCUIT ISLAND.');
        for (const a of ACS) if (!a.hidden && !a.taken && a.mesh.visible && (!a.power||P.power===a.power) && Math.hypot(P.x - a.x, P.z - a.z) < 1.25 && Math.abs(py - a.y) < 1.5) { collectAcorn(a); if (mode === 'win') return; }
        for (const c of COINS) {
          if (c.got) continue; if (c.pop > 0) { c.pop -= dt; continue; }
          if (Math.abs(P.x - c.x) > 1 || Math.abs(P.z - c.z) > 1 || Math.abs(py - c.y) > 1.25) continue;
          c.got = true; if (WD.swimEnabled) P.air = Math.min(30, (P.air ?? 30) + 1); visit.coins++; prog.score += 2; snd.coin(); if (P.hp < HPMAX()) P.hp++;
          if (visit.coins === 100) reveal('c100');
          if (Math.floor(visit.coins / 50) > visit.life50) { visit.life50 = Math.floor(visit.coins / 50); oneUp(); }
        }
        for (const r of REDS) {
          if (r.got || Math.abs(P.x - r.x) > 1 || Math.abs(P.z - r.z) > 1 || Math.abs(py - r.y) > 1.25) continue;
          r.got = true; if (WD.swimEnabled) P.air = Math.min(30, (P.air ?? 30) + 2); visit.reds++; visit.coins += 2; prog.score += 20; if (P.hp < HPMAX()) P.hp = Math.min(HPMAX(), P.hp + 2);
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
        if (prog.boss) return ['BOPPER! THE HERO OF BISCUIT ISLAND! WE\'RE PUTTING UP A STATUE OF YOU. IT\'S MADE OF SHORTBREAD.', n < TOTAL ? 'THERE ARE STILL ' + (TOTAL - n) + ' ACORNS OUT THERE SOMEWHERE, IF YOU FANCY A BIT MORE BOUNCING.' : 'ALL '+TOTAL+' ACORNS! I DON\'T KNOW WHAT TO SAY. HAVE A BISCUIT.'];
        const next = ORDER.filter(w=>NEED[w]>n).sort((a,b)=>NEED[a]-NEED[b])[0];
        const L0 = n === 0 ? [`WELL HELLO THERE, BOPPER! I'M MAYOR ${castN('mate1')}.`, 'DISASTER! KING GRUMPUS HAS PINCHED ALL THE GOLDEN ACORNS ON BISCUIT ISLAND AND HIDDEN THEM ALL OVER THE PLACE!', 'THERE ARE NINE RIGHT HERE ON THE ISLAND. HOW ABOUT THE TOP OF THE LIGHTHOUSE FOR A START?', 'THE MAGIC DOORS IN ACORN PLAZA LEAD TO FAR-OFF WORLDS WITH MORE ACORNS. THE FIRST ONE IS OPEN ALREADY.', 'PRESS ' + L('a') + ' TO JUMP. LAND AND PRESS IT AGAIN, AND AGAIN, FOR A TRIPLE JUMP!']
          : ['YOU\'VE FOUND ' + n + ' GOLDEN ACORN' + (n === 1 ? '' : 'S') + '! MARVELLOUS!'];
        if(prog.ac.canopy?.manager)L0.push('THE BRANCH MANAGER HAS RETIRED! EVEN KING GRUMPUS CANNOT FILE HIS WAY OUT OF THIS ONE.');
        if(n>=NEED.boss)L0.push('KING GRUMPUS HAS LEFT THE CROWNED DOOR OPEN. GO AND SHOW HIM WHAT FOR!');
        if (next && n > 0) L0.push('THE DOOR TO ' + WN[next] + ' OPENS AT ' + NEED[next] + ' ACORNS. YOU NEED ' + (NEED[next] - n) + ' MORE.');
        return L0;
      }

      // ================================================================ camera: collision before smoothing, stable camera-relative steering
      const cam = T3.cam, C = { yaw: 0, want: 0, auto: 0, ty: 0, pos: V3(), look: V3(), dist: 9.5, arm: 1, lift: 0 };
      const camRay = new T.Raycaster(), camHits = [], camVisible = [], rayStart = V3(), rayDir = V3();
      function manorCamera(){return (curW==='hub'&&Math.hypot(P.x-PLX,P.z-PLZ)<14)||(curW==='canopy'&&CAN_TREES.some(([x,z])=>Math.hypot(P.x-x,P.z-z)<9))||(curW==='sands'&&Math.abs(P.x+35)<6.6&&Math.abs(P.z+36)<6.1)||(curW==='snowhall'&&SNOW&&!['count','run','recover'].includes(SNOW.phase))||curW==='manor'&&Math.abs(P.x)<10.6&&P.z<-14.1&&P.z>-25.6&&P.y<9;}
      // The first intersection of a capsule-sized boom with an oriented box/cylinder.
      function cameraRoom(ax, ay, az, bx, by, bz, geometry) {
        const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dy, dz) || 1, pad = .28;
        let limit = 1;
        let rayLo = 0, rayHi = 1;
        function clipAxis(p, v, h) {
          if (Math.abs(v) < 0.00001) return Math.abs(p) <= h;
          let a = (-h - p) / v, b = (h - p) / v;
          if (a > b) { const q = a; a = b; b = q; }
          rayLo = Math.max(rayLo, a); rayHi = Math.min(rayHi, b); return rayLo <= rayHi;
        }
        function slab(x, y, z, vx, vy, vz, hx, hy, hz) {
          rayLo = 0; rayHi = limit;
          if (!clipAxis(x, vx, hx) || !clipAxis(y, vy, hy) || !clipAxis(z, vz, hz)) return;
          if (rayHi > 0.01 && rayLo > 0.00001) limit = Math.min(limit, Math.max(0, rayLo - 0.08 / len));
        }
        for (const b of BOXES) { if(b.open||b.phase&&P.power==='peek')continue;const x = ax - b.x, z = az - b.z; slab(x * b.cs - z * b.sn, ay - b.y, x * b.sn + z * b.cs, dx * b.cs - dz * b.sn, dy, dx * b.sn + dz * b.cs, b.hw + pad, b.hh + pad, b.hd + pad); }
        for (const c of CYLS) {
          const x = ax - c.x, z = az - c.z, r = c.r + pad, A = dx * dx + dz * dz;
          let lo = 0, hi = limit;
          if (A < 0.00001) { if (x * x + z * z > r * r) continue; }
          else { const B = x * dx + z * dz, disc = B * B - A * (x * x + z * z - r * r); if (disc < 0) continue; const q = Math.sqrt(disc); lo = Math.max(lo, (-B - q) / A); hi = Math.min(hi, (-B + q) / A); }
          if (Math.abs(dy) < 0.00001) { if (ay < c.y0 - pad || ay > c.y1 + pad) continue; }
          else { let a = (c.y0 - pad - ay) / dy, b = (c.y1 + pad - ay) / dy; if (a > b) [a, b] = [b, a]; lo = Math.max(lo, a); hi = Math.min(hi, b); }
          if (lo <= hi && hi > 0.01 && lo > 0.00001) limit = Math.min(limit, Math.max(0, lo - 0.08 / len));
        }
        for (let i = 1, n = Math.ceil(len / 0.25); i <= n; i++) { const f = i / n; if (f > limit) break; const y = lerp(ay, by, f), x = lerp(ax, bx, f), z = lerp(az, bz, f); if (WD.ground(x, z) + 0.35 > y || WD.water != null && y < WD.water + 0.25 && !WD.swimEnabled) { limit = Math.max(0, (i - 1) / n); break; } }
        if (geometry !== false) {
          rayStart.set(ax, ay, az); rayDir.set(dx, dy, dz).normalize(); camRay.set(rayStart, rayDir); camRay.near = 0.12; camRay.far = len * limit + pad; camHits.length = 0;
          camVisible.length = 0; for (const o of CAM_MESHES) if (o.visible && (!o.parent || o.parent.visible)&&!(o.userData.phase&&P.power==='peek')) camVisible.push(o);
          camRay.intersectObjects(camVisible, false, camHits);
          if (camHits.length) limit = Math.min(limit, Math.max(0, (camHits[0].distance - pad) / len));
        }
        return limit;
      }
      function manorViewRoom(a){
        const x=P.x+Math.sin(a)*6,z=P.z+Math.cos(a)*6,y=Math.min(P.y+1.6,C.ty+1.6);let best=0;
        for(const h of [-.4,0,1.25,3.8])best=Math.max(best,cameraRoom(P.x,y,P.z,x,y+h,z,false)*Math.hypot(6,h));return best;
      }
      function limitManorOrbit(snap){
        const steering=Math.hypot(IN.x,IN.y)>.05, clearance=manorViewRoom(C.yaw);
        if(IN.l||IN.r)delete C.indoorAuto;else if(!snap&&C.indoorAuto&&(steering||IN.b)){C.want=C.yaw;delete C.indoorAuto;}
        // A released stick also permits recovery during a coasting jump. Cut out
        // of a critical wall squeeze rather than easing through the hero's body.
        if(clearance<3.3&&(snap||!steering&&!IN.b)){
          let angle=C.yaw,best=-1;for(let i=0;i<16;i++){const a=C.yaw+i/16*TAU,room=manorViewRoom(a),score=Math.min(6,room)-Math.abs(wrapA(a-C.yaw))*.35;if(room>3.5&&score>best){best=score;angle=a;}}
          if(best>=0){C.want=angle;if(snap||clearance<1.8){C.yaw=angle;delete C.indoorAuto;}else C.indoorAuto=true;C.auto=1;}
        }
        if(IN.l||IN.r){const delta=wrapA(C.want-C.yaw),steps=Math.max(1,Math.ceil(Math.abs(delta)/.065));let safe=C.yaw;for(let i=1;i<=steps;i++){const a=C.yaw+delta*i/steps;if(manorViewRoom(a)<3.5)break;safe=a;}C.want=safe;}
      }
      function camSnap() { delete C.indoorAuto; C.yaw = C.want = P.face; C.ty = P.y; C.arm = 1; C.lift = 0; C.auto = 0; camUpdate(0, true); }
      function camUpdate(dt, snap) {snowCull();
        const inside=manorCamera(),fov=FD&&['tell','strike','vent','hurt'].includes(FD.boss.st)&&Math.hypot(P.x,P.z+32)<12.5?72:inside?78:60;const nextFov=snap?fov:lerp(cam.fov,fov,1-Math.exp(-dt*7));if(Math.abs(cam.fov-nextFov)>.0001){cam.fov=nextFov;cam.updateProjectionMatrix();}
        if (!snap && !demo && mode === 'play') {
          if (IN.l || IN.r) { C.want += (IN.l ? 1 : -1) * Math.PI / 4; C.auto = 2.5; K.sfx.tone(760, 0.03, 'square', 0.04); }
        }
        if(snowCamera(dt,snap)||foundryCamera(dt,snap)||canopyCamera(dt,snap))return;
        if(inside)limitManorOrbit(snap);
        C.auto = Math.max(0, C.auto - dt);
        // Sideways/backwards running must not rotate the very axes the player is steering with.
        if ((prog.opt.cam || demo) && C.auto <= 0 && Math.hypot(P.vx, P.vz) > 3 && IN.y < -0.5 && Math.abs(IN.x) < 0.15) {
          const d = wrapA(P.face - C.want); if (Math.abs(d) < 0.7) C.want += d * (1 - Math.exp(-dt * 0.8));
        }
        C.yaw += wrapA(C.want - C.yaw) * (snap ? 1 : 1 - Math.exp(-dt * 9));
        const fy = P.gnd ? P.y : clamp(C.ty, P.y - 1.4, P.y + 0.7);
        C.ty += (fy - C.ty) * (snap ? 1 : 1 - Math.exp(-dt * (P.gnd ? 12 : 9)));
        // Let the indoor boom follow the smoothed jump height. Following the head
        // to a low ceiling would squeeze the lens straight into a somersault.
        const tx = P.x, ty = inside ? Math.min(P.y+1.6,C.ty+1.6) : Math.max(P.y + 0.8, C.ty + 1.1), tz = P.z, dist = (inside ? 6 : C.dist) + (P.st === 'long' ? 0.8 : 0);
        WG.updateMatrixWorld(true);
        const sx = Math.sin(C.yaw), sz = Math.cos(C.yaw), normalRoom = cameraRoom(tx, ty, tz, tx + sx * dist, ty + (inside?1.25:3.1), tz + sz * dist);
        const lift = inside ? 0 : normalRoom < 0.45 ? 1 : normalRoom > 0.65 ? 0 : C.lift;
        C.lift = snap ? lift : lerp(C.lift, lift, 1 - Math.exp(-dt * (lift ? 24 : 3)));
        const boom = lerp(dist, 0.035, C.lift);
        let dx = sx * boom, dy = lerp(inside?1.25:3.1, 6.7, C.lift), dz = sz * boom;
        let room = C.lift < 0.0001 ? normalRoom : cameraRoom(tx, ty, tz, tx + dx, ty + dy, tz + dz), length = Math.hypot(dx, dy, dz);
        if (room * length < 3.8) {
          // A low ceiling can make an interpolated pitch worse than either endpoint.
          // Try a flatter view and a straight overhead boom, keeping the steering yaw.
          for (const [reach, height] of (inside?[[dist,-.4],[dist,0],[dist,.4],[dist,2],[dist,2.7],[dist,3.8]]:[[dist, 1.25], [0.035, 6.7]])) {
            const x = sx * reach, z = sz * reach, f = cameraRoom(tx, ty, tz, tx + x, ty + height, tz + z), len = Math.hypot(reach, height);
            if (f * len > room * length + 0.05) { dx = x; dy = height; dz = z; room = f; length = len; }
          }
        }
        C.arm = snap || room < C.arm ? room : lerp(C.arm, room, 1 - Math.exp(-dt * 3.5));
        C.arm = Math.max(C.arm, Math.min(room, 3.8 / length));
        C.pos.set(tx + dx * C.arm, ty + dy * C.arm, tz + dz * C.arm);
        C.look.set(tx, inside?P.y+1:Math.max(P.y + 0.65, ty - 0.1), tz);
        cam.position.copy(C.pos);
        if (shake > 0) { const f = shake * shake * 0.5; cam.position.add(tv2.set(Math.sin(clock * 57) * f, Math.sin(clock * 71) * f, 0)); }
        cam.lookAt(C.look);
      }
      function introCamera(dt) {
        const boss = FD?{x:0,y:3,z:-34}:curW === 'manor' ? BB : BOSS, mx = (P.x + boss.x) / 2, mz = (P.z + boss.z) / 2, my = Math.max(P.y + 1.2, boss.y + 1.5);
        const sep = Math.hypot(P.x - boss.x, P.z - boss.z), base = Math.atan2(P.x - boss.x, P.z - boss.z), dist = Math.max(10, sep * 0.9 + 6);
        let best = -1, target = null;
        WG.updateMatrixWorld(true);
        for (const a of [base + 1.1, base - 1.1, base + 1.6, base - 1.6]) { const x = mx + Math.sin(a) * dist, z = mz + Math.cos(a) * dist, y = my + 3, f = cameraRoom(mx, my, mz, x, y, z); if (f > best) { best = f; target = [lerp(mx, x, f), lerp(my, y, f), lerp(mz, z, f)]; } }
        C.pos.lerp(tv.set(...target), 1 - Math.exp(-dt * 7)); cam.position.copy(C.pos); C.look.set(mx, my - 0.4, mz); cam.lookAt(C.look);
      }
      function friendlyCamera(dt,n){const mx=(P.x+n.x)/2,mz=(P.z+n.z)/2,my=Math.max(P.y,n.y)+1.05,base=Math.atan2(P.x-n.x,P.z-n.z),reach=7.2;let best=-1,target=null;for(const side of n.sandFriend?[-1.4,1.4,-1.0,1.0]:[-1.0,1.0,-1.4,1.4]){const a=base+side,x=mx+Math.sin(a)*reach,z=mz+Math.cos(a)*reach,y=my+1.9,f=Math.min(cameraRoom(mx,my,mz,x,y,z),cameraRoom(P.x,P.y+1.2,P.z,x,y,z),cameraRoom(n.x,n.y+1.2,n.z,x,y,z));if(f>best){best=f;target=[lerp(mx,x,f),lerp(my,y,f),lerp(mz,z,f)];}}C.pos.lerp(tv.set(...target),1-Math.exp(-dt*8));C.look.set(mx,my,mz);cam.position.copy(C.pos);cam.lookAt(C.look);cam.fov=68;cam.updateProjectionMatrix();}
      function poseReward() {
        const right = tv2.set(1,0,0).applyQuaternion(cam.quaternion), lift = BOP.hips.position.y - 0.42, side = prog.opt.big ? 1.4 : .95;
        winA.mesh.scale.setScalar(.8); winA.mesh.position.set(P.x + right.x * side, P.y + (prog.opt.big ? 3.4 : 2.65) + lift, P.z + right.z * side);
      }
      function rewardCamera(dt) {
        const bounce = Math.max(0,Math.sin(Math.min(winT,.8)/.8*Math.PI))*.8, targetY = P.y + (prog.opt.big ? 3 : 2.4) + bounce, reach = prog.opt.big ? 9.5 : 8.1, height = prog.opt.big ? 4.4 : 3.8;
        if (C.winYaw == null) {
          let best = -1, angle = C.yaw;
          for (let i = 0; i < 16; i++) { const a = C.yaw + i / 16 * TAU, x = P.x + Math.sin(a) * reach, z = P.z + Math.cos(a) * reach;
            // Choose for the entire celebration arc, so a rising head never drives the boom into a banner or beam.
            let room=1;for(const lift of [0,.4,.8])room=Math.min(room,cameraRoom(P.x,P.y+(prog.opt.big?3:2.4)+lift,P.z,x,P.y+height+lift,z));const score = room * 8 - Math.abs(wrapA(a - C.yaw)) * 0.02;
            if (score > best) { best = score; angle = a; }
          }
          C.winYaw = angle;
        }
        const a = C.winYaw == null ? C.yaw : C.winYaw, x = P.x + Math.sin(a) * reach, z = P.z + Math.cos(a) * reach;
        C.pos.set(x, P.y + height + bounce, z);
        const f = cameraRoom(P.x, targetY, P.z, C.pos.x, C.pos.y, C.pos.z);
        cam.position.set(lerp(P.x, C.pos.x, f), lerp(targetY, C.pos.y, f), lerp(P.z, C.pos.z, f));
        C.look.set(P.x,targetY,P.z);cam.lookAt(C.look);
        const rewardFov=curW==='snowhall'?68:60;cam.fov=clamp(2*Math.atan(Math.tan(rewardFov*Math.PI/360)/Math.max(.2,f))*180/Math.PI,rewardFov,95);cam.updateProjectionMatrix();
      }

      // ================================================================ the flow: title, menus, demo, worlds, pause, death, the ending
      let lastResult = null;
      let overSent = false, mode = 'title', menuI = 0, sub = null, subI = 0, idleT = 0, winT = 0, paused = false, pauseI = 0, card = null, overT = 0, endT = 0, fading = null, lockT = 0, demoT = 0, demoI = 0, demoJ = 0;
      const music = s => K.music(prog.opt.mus && s ? SONGS[s] : null);
      const playSong = () => CAN&&!['idle','intro','gone'].includes(CAN.boss.st)?'canopyBoss':FD&&!['idle','gone'].includes(FD.boss.st)?'foundryBoss': curW==='snowhall'&&SNOW&&['count','run','recover'].includes(SNOW.phase)?'coaster':curW === 'manor' && BB.st === 'fight' ? 'boss' : WORLDS[curW].song;
      function iris(action) { if (fading) return; fading = { t: 0, dur: 0.42, action, fn: () => applyTransition(action), done: false }; K.sfx.tone(520, 0.3, 'triangle', 0.05, 0, 160); }
      function applyTransition(a) {
        if(a.op==='snowRetry'){Object.assign(SNOW,{phase:'run',route:'main',s:CUT_START-16,cutS:0,lane:0,laneV:0,speed:4,air:0,jvy:0,jumpBuf:0,recoverT:0});snowPlace();snowCamera(0,true);mode='play';music('coaster');}
        else if(a.op==='snowIn'){buildWorld('snowhall');spawnInWorld('snowhall');mode='play';music('peaks');}
        else if(a.op==='snowTop'){Object.assign(SNOW,{phase:'lodge',s:0,speed:0,air:0,jvy:0});respawnAt(0,40,-10,Math.PI);mode='play';music('peaks');}
        else if(a.op==='snowOut'){buildWorld('peaks');respawnAt(-46,99,-11,0);mode='play';music('peaks');}
        else if (a.op === 'enter') { prog.door = ORDER.indexOf(a.w); buildWorld(a.w); spawnInWorld(a.w); P.hp = HPMAX(); P.inv = 0; mode = 'card'; card = { w: a.w, t: 0 }; K.music(null); K.sfx.seq([[72, 0.5], [79, 0.5], [84, 1]], { bpm: 200, vol: 0.08, wave: 'triangle' }); }
        else if(a.op==='secretBack'){buildWorld('hub');const d=POWER_DEFS[a.k],[x,z]=d.portal;respawnAt(x,WD.ground(x,z),z+3,0);mode='play';music('hub');}
        else if (a.op === 'safe') { respawnAt(...a.pose, a.face); P.inv = 1.4; }
        else if (a.op === 'hub') { toHubAtDoor(a.i); if (a.ending) say('KING GRUMPUS IS BEATEN!', 3, 'THERE MAY STILL BE ACORNS TO FIND...'); }
        else if (a.op === 'restart') { if (a.rebuild) buildWorld(a.w); spawnInWorld(a.w); P.hp = HPMAX(); P.inv = a.inv || 0; music(WORLDS[a.w].song); mode = 'play'; }
        else if (a.op === 'title') toTitle();
        saveNow();
      }
      function spawnInWorld(w) { const s = WORLDS[w].spawn,height=WORLDS[w].spawnY==null?99:WORLDS[w].spawnY; respawnAt(s[0], height, s[1], s[2]); const y = floorAt(s[0], s[1], height); P.y = y; P.safe = [P.x, P.y, P.z]; camSnap(); }
      function enterWorld(w) { iris({ op: 'enter', w }); }
      function toHubAtDoor(i) {
        buildWorld('hub'); const d = DOORS[i] || null;
        if (d) { respawnAt(d.x + d.fx * 3.2, PH, d.z + d.fz * 3.2, Math.atan2(-d.fx, -d.fz)); C.want = C.yaw = P.face + 1.9; camUpdate(0, true); } else spawnInWorld('hub');
        P.hp = HPMAX(); music('hub'); mode = 'play';
      }
      function leaveWorld() {if(curW==='snowhall'){iris({op:'snowOut'});return;} const k=WD.power;iris(k?{op:'secretBack',k}:{ op: 'hub', i: ORDER.indexOf(curW) }); }
      function afterDeath() {
        prog.lives--;
        if (prog.lives < 0) { mode = 'over'; overT = 0; overSent = false; lastResult = null; addHs(); prog.lives = 4; const w = curW; curW = 'hub'; K.save({ v2: 1, school:prog.school, schoolMet:prog.schoolMet, started: 1, score: prog.score, got: prog.got, ac: prog.ac, records: prog.records, powers: prog.powers, lives: 4, opt: prog.opt, hs: prog.hs, boss: prog.boss, w: 'hub', p: null, door: -1 }); curW = w; return; }
        iris({ op: 'restart', w: curW, rebuild: curW === 'boss', inv: 1 });
      }
      function newGame() {
        Object.assign(prog, { school:0, schoolMet:false, powers:{}, got: {}, ac: {}, score: 0, lives: 4, boss: 0, started: 1, w: 'hub', p: null, door: -1 });
        runCache = null; lastResult = null; overSent = false; paused = false; buildWorld('hub'); spawnInWorld('hub'); P.hp = HPMAX(); mode = 'card'; card = { w: 'hub', t: 0 }; saveNow();
      }
      function continueGame() {
        K.resume?.(); tok0 = K.t;
        if (runCache?.mode === 'over') { runCache = null; lastResult = null; overSent = false; buildWorld('hub'); spawnInWorld('hub'); P.hp = HPMAX(); paused = false; mode = 'card'; card = { w: 'hub', t: 0, back: true }; saveNow(); return; }
        if (runCache && restoreRun(copy(runCache))) return;
        const w = prog.w && prog.w !== 'boss' ? prog.w : 'hub';
        buildWorld(w);
        if (prog.p && prog.p.every(Number.isFinite)) { respawnAt(prog.p[0], prog.p[1] + 0.5, prog.p[2], 0); } else spawnInWorld(w);
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
        if (sub === 'howto') { if (ok() || back()) { subI++; tick(); if (subI > 3 || back()) sub = null; } return; }
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
      function saveOpts() { saveNow(); }

      // ---- world animation: sea, sails, clock hands, the bell, movers
      function worldAnim(dt, t) {
        if (WG.userData.sea) WG.userData.sea.offset.set(t * 0.015, t * 0.01);
        if (WG.userData.sails) WG.userData.sails.rotation.z = t * 0.8;
        if (WG.userData.clouds) WG.userData.clouds.rotation.y = t * 0.004;
        if (WG.userData.hands) { const d = new Date(), h = d.getHours() % 12 + d.getMinutes() / 60, mi = d.getMinutes() + d.getSeconds() / 60; for (const [hh, mh] of WG.userData.hands) { hh.rotation.z = -h / 12 * TAU; mh.rotation.z = -mi / 60 * TAU; } }
        if (WG.userData.bell) WG.userData.bell.rotation.z = Math.sin(t * 1.4) * 0.12;
        if (BELT) BELT.offset.x = -t * 0.8;
        for (const s of MOVERS) { s.px = s.x; s.pz = s.z; const ox = s.x, oy = s.k === 'box' ? s.y + s.hh : s.y1, oz = s.z, ory = s.ry || 0; s.place(s, curW === 'tower' ? motionClock : t); sync(s);
          if (P.plat === s && P.gnd && mode !== 'title') { const dx = P.x - ox, dz = P.z - oz, dr = (s.ry || 0) - ory, c = Math.cos(dr), sn = Math.sin(dr); P.x = s.x + dx * c + dz * sn; P.z = s.z - dx * sn + dz * c; P.y = s.k === 'box' ? s.y + s.hh : s.y1; P.face += dr; P.yaw += dr; } }
        for (const c of CYLS) if (c.squish > 0) c.squish -= dt;
        for (const pr of PROPS) { if(pr.kind==='manorDoor'){pr.open+=clamp(pr.want-pr.open,-dt*2,dt*2);syncDoor(pr);}else if(pr.open > 0 && pr.open < 1) { pr.open = Math.min(1, pr.open + dt * 3); pr.lid.rotation.x = 1.3 * pr.open; } }
        trialAnim(dt, t); grottoAnim(t);powerAnim(t);schoolAnim();foundryAnim();canopyAnim();if(SNOW?.gate){SNOW.gate.b.open=SNOW.phase!=='finish';SNOW.gate.m.position.y=SNOW.phase==='finish'?0:-4;}
        lifeMeshes.forEach((m, i) => { m.rotation.y = t * 2; m.position.y = LIFE[i].y + Math.sin(t * 3 + i) * 0.15; });
        for (const a of ACS) if (a.mesh && a.mesh.visible && a !== winA) { a.mesh.rotation.y = t * 2 + a.x; a.mesh.position.y = a.y + Math.sin(t * 2.5 + a.x) * 0.2; }
      }
      // Cosmetic only: never change a pickup's position, hitbox or saved state.
      function coinViewScale(c) {
        const ax=P.x-cam.position.x,ay=P.y+1-cam.position.y,az=P.z-cam.position.z,l2=ax*ax+ay*ay+az*az;
        const x=c.x-cam.position.x,y=c.y-cam.position.y,z=c.z-cam.position.z,d=Math.hypot(x,y,z),u=(x*ax+y*ay+z*az)/(l2||1);
        let scale=clamp((d-1.8)/1.6,0,1);
        if(u>0&&u<1.03){const off=Math.hypot(x-ax*u,y-ay*u,z-az*u),radius=.55+u*(mode==='win'?1.7:1.15);scale=Math.min(scale,clamp((off-radius)/.45,0,1));}
        return scale;
      }
      function coinsDraw(t) {
        let i=0,spark=0;
        for(const c of COINS){
          if(i>=coinMesh_.count)break;
          const sc=c.got?0:coinViewScale(c);coinScales[i]=sc;
          if(!sc)coinMesh_.setMatrixAt(i,pz);else{
            const k=c.pop>0?1-c.pop*2:0;pdum.position.set(c.x,c.y+Math.sin(t*3+i)*.08+Math.max(0,k*-1.2),c.z);pdum.rotation.set(0,t*3.4+i*.4,0);pdum.scale.setScalar(sc);pdum.updateMatrix();coinMesh_.setMatrixAt(i,pdum.matrix);
            const pulse=(t*1.7+i*.77)%7;
            if(pulse<.4&&spark<12){pdum.position.add(tv.set(.2,.24,0));pdum.quaternion.copy(cam.quaternion);pdum.scale.setScalar(sc*Math.sin(pulse/.4*Math.PI));pdum.updateMatrix();coinSpark_.setMatrixAt(spark++,pdum.matrix);}
          }i++;
        }
        for(;i<coinMesh_.count;i++)coinMesh_.setMatrixAt(i,pz);coinMesh_.instanceMatrix.needsUpdate=true;
        REDS.forEach((r,j)=>{const sc=r.got?0:coinViewScale(r);if(!sc)redMesh_.setMatrixAt(j,pz);else{pdum.position.set(r.x,r.y+Math.sin(t*3+j)*.1,r.z);pdum.rotation.set(0,t*3.4+j,0);pdum.scale.setScalar(sc);pdum.updateMatrix();redMesh_.setMatrixAt(j,pdum.matrix);}});
        if(!REDS.length)redMesh_.setMatrixAt(0,pz);redMesh_.instanceMatrix.needsUpdate=true;
        for(;spark<12;spark++)coinSpark_.setMatrixAt(spark,pz);coinSpark_.instanceMatrix.needsUpdate=true;
      }

      // ---- Bopper's poses
      function animBop(dt, t) {
        const B = BOP, sp = Math.hypot(P.vx, P.vz), st = P.st, hanging=st==='ledge'||st==='climb';
        B.root.position.set(P.x, P.y, P.z);
        P.yaw += wrapA(P.face - P.yaw) * Math.min(1, dt * 16);
        let yaw = P.yaw, rx = 0, rz = 0, sc = 1, hy = 0.42;
        const arm = [0, 0, 0, 0], leg = [0, 0, 0, 0]; // armL x,z  armR x,z / legL x,z legR x,z
        let headY = 0, headX = 0;
        if(hanging){hy=.3;arm[0]=arm[2]=2.45;arm[1]=.25;arm[3]=-.25;leg[0]=.2;leg[2]=.35;rx=-.08;}
        else if(st==='glide'){rx=-.15;arm[1]=1.8;arm[3]=-1.8;leg[0]=.3;leg[2]=-.3;hy+=Math.sin(t*4)*.025;}
        else if (st === 'swim') { rx = lerp(-.35,-1.15,clamp(((WD.water||0)-P.y-1)/1.5,0,1)) + clamp(P.vy / 6,-.75,.75); arm[0] = Math.sin(P.run*1.6)*1.1; arm[2] = -arm[0]; arm[1] = .9; arm[3] = -.9; leg[0] = Math.sin(P.run*2)*.45; leg[2] = -leg[0]; hy += Math.sin(P.run)*.04; }
        else if (P.gnd && (st === 'run' || st === 'idle' || st === 'skid')) {
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
        else if (st === 'jump3') { rx = P.stT < 0.75 ? -(P.stT / 0.75) * TAU : 0; arm[1] = P.stT < 0.75 ? 0.6 : 1.3; arm[3] = -arm[1]; leg[0] = leg[2] = P.stT < 0.75 ? 1.4 : 0.3; if (dt > 0 && P.stT < 0.75 && (K.frame & 3) === 0) burst(P.x, P.y + 0.6, P.z, 0xffffff, 1, 0.5, { life: 0.3, grav: 0, size: 0.15 }); }
        else if (st === 'back') { rx = P.stT < 0.8 ? (P.stT / 0.8) * TAU : 0; arm[1] = 2.6; arm[3] = -2.6; leg[0] = leg[2] = 0.6; }
        else if(st==='side'){rz=(P.sideSign||1)*Math.min(1,P.stT/.65)*TAU;arm[1]=1.9;arm[3]=-1.9;leg[0]=leg[2]=P.stT<.65?1.1:.3;}
        else if (st === 'twirl') { yaw += (P.stT / 0.4) * TAU * 1.5; arm[1] = 1.6; arm[3] = -1.6; leg[0] = 0.2; if (P.stT > 0.45) P.st = 'fall'; }
        else if (st === 'long') { rx = -1.25; arm[0] = arm[2] = 2.9; leg[0] = leg[2] = -0.3; }
        else if (st === 'pound') { if (P.stT < 0.28) { rx = -(P.stT / 0.28) * TAU; sc = 0.85; leg[0] = leg[2] = 1.5; arm[0] = arm[2] = 1.2; } else { leg[0] = leg[2] = 1.3; arm[1] = 2.6; arm[3] = -2.6; } }
        else if (st === 'kick') { leg[0] = 1.6; leg[2] = -0.6; arm[1] = 1.2; arm[3] = -1.2; rx = 0.25; if (P.stT > 0.45) P.st = 'fall'; }
        else if (st === 'hurt' || st === 'burn') { rx = 0.5; arm[1] = 2.4; arm[3] = -2.4; leg[0] = -0.4; leg[2] = 0.5; if (st === 'burn' && (K.frame & 1)) burst(P.x, P.y + 0.3, P.z, 0x5a5a5a, 1, 1, { life: 0.5, grav: -3 }); if (P.gnd) P.st = 'idle'; }
        else if (st === 'dead') { yaw += P.spin; rx = 0.4; arm[1] = 2.6; arm[3] = -2.6; }
        else { if (P.vy > 0) { arm[1] = 2; arm[3] = -2; } else { arm[1] = 1.3 + Math.sin(t * 22) * 0.25; arm[3] = -arm[1]; } leg[0] = 0.3; leg[2] = -0.25; }
        if (mode === 'win') { sc = 1; yaw = Math.atan2(-(cam.position.x - P.x), -(cam.position.z - P.z)); rx = 0; arm[1] = .8; arm[3] = -2.5; arm[0] = arm[2] = 0; leg[0] = 0.2; leg[2] = -0.2; hy = 0.42 + Math.max(0, Math.sin(Math.min(winT, 0.8) / 0.8 * Math.PI)) * 0.8; yaw += winT < 0.8 ? winT / 0.8 * TAU : 0; }
        if (P.land > 0) sc *= 1 - P.land * 1.6;
        B.m.rotation.set(rx, yaw, rz, 'YXZ'); tv.set(0,.9,0).applyEuler(B.m.rotation); B.m.position.set(-tv.x,.9-tv.y,-tv.z); B.m.scale.set(1 / Math.sqrt(sc), sc, 1 / Math.sqrt(sc));
        B.hips.position.y = hy; B.head.rotation.set(headX, headY, 0); B.head.scale.setScalar(prog.opt.big ? 1.7 : 1);
        B.armR.position.y = mode === 'win' ? .78 : .38; B.armR.scale.y = mode === 'win' ? 1.9 : hanging?1.4:1; B.armL.scale.y=hanging?1.4:1;
        B.armL.rotation.set(arm[0], 0, arm[1]); B.armR.rotation.set(arm[2], 0, arm[3]); B.legL.rotation.set(leg[0], 0, leg[1]); B.legR.rotation.set(leg[2], 0, leg[3]);
        B.blink -= dt; if (B.blink < 0) B.blink = 2 + Math.random() * 3; B.eyes.scale.y = B.blink < 0.12 ? 0.1 : 1; B.eyes.position.y = B.blink < 0.12 ? 0.34 : 0;
        B.heroMat.emissive.setHex(P.inv > 0 && (P.inv * 12 | 0) % 2 ? 0x603010 : 0x000000);
        powerHero(t);
        B.root.visible = !(mode === 'view' && VW && VW.m !== B.root);
      }

      // ================================================================ the main step
      function updateStep(dt) {
        if ((mode === 'play' || mode === 'win') && K.pressed('start') && !fading) { paused = !paused; pauseI = 0; K.sfx.tone(paused ? 440 : 880, 0.06); if (paused) K.music(null); else { K.resume?.(); music(mode === 'win' ? null : playSong()); } saveNow(); return; }
        if (paused) { pauseUpdate(); return; }
        if (!['dlg', 'card'].includes(mode) && !fading) { clock += dt; motionClock += dt * (curW === 'tower' && TRIAL?.st === 'run' ? 0.35 : 1); }
        const t = clock;
        if (fading) { fading.t += dt; if (!fading.done && fading.t >= fading.dur) { fading.done = true; fading.fn(); } if (fading.t >= fading.dur * 2) fading = null; }
        if (msgT > 0) msgT -= dt; if (flash > 0) flash -= dt; if (shake > 0) shake -= dt;
        if (!['dlg', 'card'].includes(mode)) { worldAnim(dt, t); partsUpdate(dt); }
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
        if (mode === 'card') { card.t += dt; card.sel = card.sel || 0; if (up() || dn()) { card.sel = (card.sel + ACS.length + (up() ? -1 : 1)) % ACS.length; tick(); } if (card.t > 0.6 && (K.pressed('a') || K.pressed('start'))) { mission = card.sel; mode = 'play'; K.resume?.(); okS(); music(WORLDS[curW].song); if (card.w === 'hub' && !card.back && nAc() === 0) say('FIND THE GOLDEN ACORNS!', 2.5); } camUpdate(dt); animBop(dt, t); return; }
        if (mode === 'over') { overT += dt; P.vy = 0; if (overT > 3.2 && !overSent) { overSent = true; sendScore(true, 'GAME OVER', `${nAc()} OF ${TOTAL} GOLDEN ACORNS. THEY'RE SAVED: PICK CONTINUE ON THE TITLE SCREEN.`); } return; }
        if (mode === 'ending') { endingUpdate(dt, t); return; }
        if (mode === 'dlg') { dlgUpdate(dt); if (mode === 'dlg' && (['BIG BOOHOO', 'KING GRUMPUS'].includes(dlg.name)||FD?.boss.st==='intro')) introCamera(dt);else if(mode==='dlg'&&(dlg.npc?.foundryBoss||dlg.npc?.foundryFriend||dlg.npc?.sandFriend||dlg.npc?.snowRival||dlg.npc?.coach||curW==='snowhall'&&dlg.npc?.kind==='tortoise'))friendlyCamera(dt,dlg.npc); else camUpdate(dt); animBop(dt, t); return; }
        if (mode === 'win') {
          winT += dt; rewardCamera(dt); animBop(dt, t);
          if (winA) { winA.mesh.material = matAcorn; poseReward(); winA.mesh.rotation.y = t * 4; }
          if (winT > 3.2 || (winT > 1.2 && K.pressed('a'))) {
            const id = winA.id; winA.mesh.visible = false; winA = null; mode = 'play'; P.st = 'idle'; C.want = C.yaw = Math.atan2(C.pos.x - P.x, C.pos.z - P.z);
            if (id === 'crown') { startEnding(); return; }
            music(WORLDS[curW].song); sendScore(false);if(WD.power)leaveWorld();
          }
          return;
        }
        // ---- playing
        if (fading) { animBop(dt, t); camUpdate(dt); return; }
        visit.t += dt; readInput();powerInput();
        stepPlayer(dt);
        snowUpdate(dt);schoolUpdate();foundryUpdate(dt);sandsUpdate(dt);canopyUpdate(dt);
        if (mode !== 'play') { animBop(dt, t); camUpdate(dt); return; }
        enemiesUpdate(dt, t); if (curW === 'peaks') percyUpdate(dt); if (curW === 'manor') BB.update(dt, t); if (curW === 'boss') BOSS.update(dt, t);
        if (P.st !== 'dead') { trialUpdate(dt); grottoUpdate(dt); powerUpdate(dt);powerAnim(t);collectStuff(dt); }
        if(mode==='win'){rewardCamera(dt);animBop(dt,t);poseReward();saveNow();return;}
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
          if (c === 'RESUME') music(mode === 'win' ? null : playSong());
          else if (c === 'RESTART WORLD') { mode = 'play'; iris({ op: 'restart', w: curW, rebuild: true }); }
          else if (c === 'BACK TO THE START') { mode = 'play'; iris({ op: 'restart', w: 'hub' }); }
          else if (c === 'LEAVE WORLD') leaveWorld();
          else if (c === 'QUIT TO TITLE') { saveNow(); addHs(); saveNow(); sendScore(false); iris({ op: 'title' }); }
        }
      }
      // ---- the ending
      const CREDITS = ['BOUNCE QUEST 64', '', 'STARRING', 'BOPPER', '', 'WITH', `MAYOR ${castN('mate1')}`, `OLD ${castN('grandad')}`, `CAPTAIN ${castN('mate2')}`, `${castN('sister')}`, `${castN('mate3')} PENGUIN`, `${castN('mate4')}`, `PROFESSOR ${castN('cousin')}`, 'BIG BOOHOO', 'AND', 'KING GRUMPUS (SORRY)', '', 'GAME DESIGN', 'THE BISCUIT SOFT TEAM', '', 'PLAY TESTERS', castN('mate1'), castN('mate2'), castN('mate3'), castN('mate4'), '', 'TEA AND BISCUITS', castN('mom'), '', 'THANK YOU FOR PLAYING!', '', '(C) 1999 BISCUIT SOFT'];
      function startEnding() { mode = 'ending'; endT = 0; prog.boss = 1; K.secret('rm.hop.king'); addHs(); music('ending'); saveNow(); }
      function endingUpdate(dt, t) {
        endT += dt;
        const a = t * 0.2; cam.position.set(Math.sin(a) * 16, 9, Math.cos(a) * 16); cam.lookAt(0, 3, 0);
        P.x = 0; P.z = 2; P.y = 2; P.st = 'idle'; P.face = Math.atan2(-cam.position.x, -cam.position.z); winT = 1; animBop(dt, t); BOP.root.position.y = 2 + Math.abs(Math.sin(t * 4)) * 0.6;
        if (Math.random() < 0.15) burst((Math.random() - 0.5) * 30, 10 + Math.random() * 8, (Math.random() - 0.5) * 30, [0xff4a4a, 0xffd23a, 0x4ae0ff, 0x7aff7a][(Math.random() * 4) | 0], 14, 8, { life: 0.9, grav: 4 });
        if (endT > 4 && (K.pressed('start') || K.pressed('a')) || endT > 46) { sendScore(false); iris({ op: 'hub', i: 4, ending: true }); mode = 'play'; }
      }

      // ================================================================ the HUD
      function proj(x, y, z) { tv.set(x, y, z).project(cam); return [(tv.x + 1) / 2 * W, (1 - tv.y) / 2 * H, tv.z < 1 && tv.z > -1]; }
      function acIcon(x, y, s, c) { hud.fillStyle = '#10101c'; hud.beginPath(); hud.ellipse(x, y + s * 0.12, s * 0.65 + 1, s * 0.7 + 1, 0, 0, 7); hud.fill(); hud.fillStyle = c || '#ffc81a'; hud.beginPath(); hud.ellipse(x, y + s * 0.15, s * 0.5, s * 0.62, 0, 0, 7); hud.fill(); hud.fillStyle = '#8a5a22'; hud.beginPath(); hud.ellipse(x, y - s * 0.32, s * 0.62, s * 0.3, 0, 0, 7); hud.fill(); hud.fillStyle = '#fff6c0'; hud.fillRect(x - s * 0.25, y, s * 0.12, s * 0.25); }
      function coinIcon(x, y, r, c) { hud.fillStyle = '#10101c'; hud.beginPath(); hud.ellipse(x, y, r * 0.7 + 1, r + 1, 0, 0, 7); hud.fill(); hud.fillStyle = '#6a4a00'; hud.beginPath(); hud.ellipse(x + 1, y + 1, r * 0.7, r, 0, 0, 7); hud.fill(); hud.fillStyle = c || '#ffd23a'; hud.beginPath(); hud.ellipse(x, y, r * 0.7, r, 0, 0, 7); hud.fill(); hud.fillStyle = 'rgba(255,255,255,.6)'; hud.fillRect(x - 1, y - r * 0.6, 1, r * 1.2); }
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
        hud.lineJoin = 'round'; hud.lineWidth = 3; hud.strokeStyle = '#171322'; hud.strokeText(s, cx, y);
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
        if (flash > 0) { hud.fillStyle = `rgba(255,255,255,${Math.min(0.6, flash)})`; hud.fillRect(0, 0, W, H); }
        if(paused){drawPause();irisDraw();return;}
        // counters
        acIcon(14, 15, 11); F.draw(hud, '✕ ' + nAc(), 23, 12, '#fff', 1, '#2a1a0a');
        coinIcon(14, 31, 5); F.draw(hud, '✕ ' + visit.coins, 23, 28, '#fff', 1, '#2a1a0a');
        if (REDS.length && visit.reds) { coinIcon(14, 46, 5, '#ff3a3a'); F.draw(hud, visit.reds + '/' + REDS.length, 23, 43, '#ff9a9a', 1, '#2a1a0a'); }
        biscuit(W - 22, 20, 13); F.draw(hud, 'LIVES✕' + Math.max(0, prog.lives), W - 56, 37, '#fff', 1, '#2a1a0a');
        const footer=[];
        // talk / read prompts and door labels
        if (mode === 'play' && !paused) {
          const door = nearManorDoor(); if(door)footer.push([L('b')+(door.want?' CLOSE DOOR':' OPEN DOOR'),'#ffe29c']);
          const n = nearTalk(); if (n && P.gnd && !powerBoxes.some(b=>Math.hypot(P.x-b.x,P.z-b.z)<1.9&&Math.abs(P.y-b.y)<1.7)) { const [sx, sy, vis] = proj(n.x, n.y + (n.kind === 'sign' ? 2.4 : 2.6), n.z); if (vis) { box2(sx - 26, sy - 7, 52, 13, 0.8); F.center(hud, L('b') + (n.kind === 'sign' ? ' READ' : ' TALK'), sx, sy - 3, '#ffd23a', 1); } }
          if(curW==='hub'){let chosen=null,near=9;for(const d of DOORS){const dd=Math.hypot(P.x-d.x,P.z-d.z);if(dd>=near)continue;const [sx,sy,vis]=proj(d.x,d.y+5.6,d.z);if(vis){chosen={d,sx,sy};near=dd;}}if(chosen){const {d,sx,sy}=chosen,open=nAc()>=d.need,text=open?WN[d.w]:'✕ '+d.need,width=F.width(text),x=clamp(sx,64+width/2,W-64-width/2),y=clamp(sy,5,52);F.center(hud,text,x,y,open?'#fff':'#ffb0a0',1,true);if(!open)acIcon(x-width/2-7,y+3,8);}}
          if (curW !== 'hub' && doorExit && Math.hypot(P.x - doorExit.x, P.z - doorExit.z) < 6) footer.push(['WALK INTO THE HOME PAINTING','#fff']);
        }
        if (mode === 'play' && TRIAL) {
          const q=TRIAL;
          if(q.st==='run'||q.st==='count')footer.push([q.st==='count'?'GET READY...':'HOOPS '+q.next+'/'+q.route.length+'   '+Math.max(0,Math.ceil(q.t))+' SECONDS',q.t<8?'#ffab80':'#ffe486']);
          else if(q.st==='listen')footer.push(['BELL TUNE '+(q.round+1)+'   '+q.cursor+'/'+q.def.tunes[q.round].length,'#ffe486']);
          else if(q.st==='demo')footer.push(['LISTEN... ROUND '+(q.round+1)+' OF 3','#ffe486']);
          if(P.gnd&&Math.hypot(P.x-q.switch.x,P.z-q.switch.z)<2.4&&Math.abs(P.y-q.switch.y)<1.8)footer.push(['JUMP THEN '+L('c')+': '+(q.st==='idle'?'START':'RETRY')+' TRIAL','#fff']);
        }
        if(mode==='play'&&CAN){if(CAN.sprout==='carry')footer.push(['SPROUT: BACK TO THE KEEPER','#efffc4']);else if(CAN.sprout==='nest'&&P.gnd&&Math.hypot(P.x-33,P.z-14.2)<2&&Math.abs(P.y-CAN_TOP)<1.5)footer.push([L('b')+' PICK UP SPROUT','#efffc4']);if(['tell','throw'].includes(CAN.boss.st))footer.push(['GOLD TARGET: MOVE OUT!','#ffe5a0']);else if(CAN.boss.st==='rest')footer.push(['BLUE TIE: COME CLOSE AND PUNCH!','#a7ffe0']);}
        if(mode==='play'&&SS){if(SS.parcel==='carry')footer.push(['TEA PARCEL: BACK TO THE POSTMASTER','#fff0b8']);else if(SS.parcel==='waiting'&&P.gnd){const [x,y,z]=SS.parcelSite;if(Math.hypot(P.x-x,P.z-z)<=2&&Math.abs(P.y-y)<=1.5)footer.push([L('b')+' PICK UP TEA PARCEL','#fff0b8']);}}
        if(mode==='play'&&SCHOOL?.active)footer.push(['LESSON '+(SCHOOL.lesson+1)+'/12: '+SCHOOL_LESSONS[SCHOOL.lesson][0],SCHOOL.seen?'#9fffbd':'#ffe6a0']);
        if(mode==='play'&&P.st==='ledge')footer.push([L('a')+' CLIMB   '+L('c')+' LET GO','#fff0b8']);
        if(mode==='play'&&curW==='peaks'&&Math.hypot(P.x+46,P.z+13.4)<4)footer.push([L('b')+' ENTER THE COCOA LODGE','#fff0ba']);
        if(mode==='play'&&SNOW){const q=SNOW;if(['count','run','recover'].includes(q.phase))footer.push([q.phase==='count'?'READY... '+Math.ceil(q.t):Math.round(q.speed*3)+' MPH   '+Math.round(q.s/SNOW_LENGTH*100)+'%   '+q.t.toFixed(1)+' SEC','#fff0c0']);if(q.phase==='run')footer.push([q.race?(q.s>=q.rivalS?'YOU ARE AHEAD!':castN('mate2')+' IS AHEAD!'):'STEER  '+L('c')+' BRAKE  '+L('a')+' HOP','#e1f1ff']);}
        if(mode==='play'&&SNOW?.phase==='finish'){const best=prog.records[SNOW.race?'coasterRace':'coaster'];footer.push(['TIME '+SNOW.t.toFixed(2)+'  BEST '+Number(best).toFixed(2)+' SECONDS','#fff0b8']);}
        if(mode==='play'&&curW==='peekaboo')footer.push(['GRILLES '+[0,1,1,2][POWER_RUN.phaseCross]+'/2','#e0cbff']);
        if(mode==='play'&&curW==='brolly')footer.push(['WIND HOOPS '+POWER_RUN.rings+'/3','#f7e6ad']);
        if(mode==='play'&&POWER_RUN.pressure>0&&!POWER_RUN.gate)footer.push(['WEIGHT PLATE '+Math.min(100,Math.floor(POWER_RUN.pressure/.7*100))+'%','#ffe0a0']);
        if(P.power&&mode==='play')footer.push([POWER_DEFS[P.power].name+' '+Math.ceil(P.powerT),P.powerT<6?'#ffb59a':'#fff0bd']);
        if(mode==='play'){const box=powerBoxes.find(b=>Math.hypot(P.x-b.x,P.z-b.z)<2.3&&Math.abs(P.y-b.y)<1.8);if(box)footer.push([L('b')+' '+(prog.powers[box.k]?'TAKE '+POWER_DEFS[box.k].name:'BOX ASLEEP'),'#ffe8ad']);}
        if(WD.swimEnabled&&mode==='play'){
          F.center(hud,'AIR '+Math.ceil(P.air??30),W/2,12,P.air<8?'#ffb48a':'#d0fff3',1);
          if(GROT)footer.push(['PEARLS '+[0,1,1,2,1,2,2,3][GROT.pearls]+'/3   CURRENT '+GROT.gate+'/3','#d0fff3']);
          if(P.swimming){footer.push([L('a')+' UP  '+L('c')+' DIVE','#fff']);if(PROPS.some(p=>p.kind==='chest'&&!chestOpen[p.w]&&Math.hypot(P.x-p.b.x,P.z-p.b.z)<2.6&&Math.abs(P.y-p.b.y)<2))footer.push([L('b')+' OPEN CHEST','#ffe299']);}
        }
        const kingBar=mode==='play'&&curW==='boss'&&BOSS.mesh&&['walk','up','aim','charge','dizzy','hurt','hop'].includes(BOSS.st),booBar=mode==='play'&&curW==='manor'&&BB.on&&BB.st==='fight',foundryBar=mode==='play'&&FD&&!['idle','intro','gone','defeated'].includes(FD.boss.st);
        if(foundryBar){bossBar('THE BIG SOFTY',FD.boss.hp);F.center(hud,FD.boss.st==='vent'?'COOL LID '+Math.max(0,5-FD.boss.t).toFixed(1):FD.boss.st==='tell'?'STOMP COMING!':'HOP THE STEAM RING',W/2,48,FD.boss.st==='vent'?'#bffff4':'#ffe3a0',1);}if(mode==='play'&&SS?.relay==='run')F.center(hud,'POST '+SS.next+'/5  '+Math.max(0,55-SS.elapsed).toFixed(1),W/2,38,'#fff3bf',1);if(mode==='play'&&FD?.relay==='run')F.center(hud,'TEA BREAK '+Math.max(0,45-FD.elapsed).toFixed(1),W/2,38,'#ddfff5',1);
        if(kingBar)bossBar('KING GRUMPUS',BOSS.hp);if(booBar)bossBar('BIG BOOHOO',BB.hp);
        if(mode==='play'&&curW==='peaks'&&PERCY.st==='race'){const d=Math.hypot(PERCY.x,PERCY.z-48),me=Math.hypot(P.x,P.z-48);footer.push([me<d?'YOU ARE AHEAD!':`${castN('mate3')} IS AHEAD!`,me<d?'#7aff7a':'#ff8a8a']);}
        footer.forEach(([text,color],i)=>F.center(hud,text,W/2,(kingBar||booBar||foundryBar?H-44:H-18)-i*12,color,1));
        if (msgT > 0 && mode !== 'win') { const k = msg.length > 16 ? 1 : 2; F.center(hud, msg, W / 2, 62, msgCol, k, '#3a1a00'); if (msg2) wrap(msg2, 48).forEach((s, i) => F.center(hud, s, W / 2, 62 + 9 * k + 4 + i * 10, '#fff', 1, true)); }
        if (mode === 'win' && winA) { bigText('GOLDEN ACORN!', W / 2, 64, 22); F.center(hud, winA.name, W / 2, 83, '#fff', 1, true); F.center(hud, nAc() + ' OF ' + TOTAL, W / 2, H - 30, '#ffd23a', 2, '#3a1a00'); if (winA.id === 'trial' && TRIAL) F.center(hud, TRIAL.def.kind === 'bells' ? 'ALL THREE TUNES!' : 'TIME ' + TRIAL.elapsed.toFixed(2) + '  BEST ' + Number(prog.records[curW]).toFixed(2), W / 2, H - 50, '#eef6ff', 1, '#261832'); }
        if (mode === 'dlg' && dlg) drawDlg();
        if (mode === 'over') { hud.fillStyle = `rgba(0,0,0,${Math.min(0.7, overT * 0.4)})`; hud.fillRect(0, 0, W, H); bigText('GAME OVER', W / 2, H / 2 - 10, 30, '#ff6a4a', '#4a0a00'); F.center(hud, 'YOUR ACORNS ARE SAVED', W / 2, H / 2 + 20, '#fff', 1, true); }
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
        F.center(hud, WN[curW] + '   ' + nAcW(curW) + '/' + ACS.length, W / 2, 40, '#bcd8ff', 1, true);
        ACS.forEach((a, i) => { const g = gotAc(a.id); acIcon(28, 58 + i * (ACS.length>8?11:12), 8, g ? '#ffc81a' : '#556'); F.draw(hud, a.name, 38, 55 + i * (ACS.length>8?11:12), g ? '#ffd23a' : '#cfd6e8', 1, true); });
        if (Number.isFinite(prog.records[curW])) F.center(hud, 'TRIAL BEST: ' + prog.records[curW].toFixed(2) + ' SECONDS', W / 2, ACS.length>7?153:143, '#ffe48a', 1, '#261832');
        const it = pauseItems(), y0 = ACS.length>7?168:162; box2(W / 2 - 70, y0 - 6, 140, it.length * 13 + 8, 0.85);
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
        box2(10, 96, W - 20, 130, 0.88);
        const pg = subI === 0 ? [['THE MOVES', '#ffd23a'], ['RUN: STICK.   JUMP: ' + L('a')], ['LAND AND PRESS ' + L('a') + ' AGAIN: DOUBLE, THEN TRIPLE JUMP'], ['AIR '+L('a')+': TWIRL. REVERSE + '+L('a')+': SIDE FLIP.'], ['LONG JUMP: RUN, HOLD ' + L('c') + ', PRESS ' + L('a')], ['BACKFLIP: STAND STILL, HOLD ' + L('c') + ', PRESS ' + L('a')], ['GROUND POUND: ' + L('c') + ' IN THE AIR'], ['WALL KICK: JUMP AT A WALL, ' + L('a') + ' AS YOU TOUCH'], ['PUNCH, PUNCH, KICK: ' + L('b') + '.  TALK / READ: ' + L('b')], ['CAMERA: ' + L('l') + ' / ' + L('r') + '.   PAUSE: START']]
          : subI === 1 ? [['THE GOAL', '#ffd23a'], ['KING GRUMPUS HAS HIDDEN '+TOTAL+' GOLDEN ACORNS.'], ['9 ARE ON BISCUIT ISLAND. THE MAGIC DOORS'], ['SEVEN COURSES, THREE SECRET SWITCH STAGES'], ['COCOA COASTER AND THE KING HAVE THE REST.'], ['COINS MEND YOUR BISCUIT (YOUR HEALTH).'], ['8 RED COINS OR 100 COINS = AN ACORN TOO.'], ['HANG ON A LEDGE: '+L('a')+' CLIMBS, '+L('c')+' DROPS.'], [L('a')+' JUMP '+L('b')+' PUNCH '+L('c')+' CROUCH'], [L('start')+' PAUSE. IT SAVES AS YOU GO.']]
          : subI===2 ? [['A PROPER DIP', '#ffd23a'], ['CUSTARD GROTTO OPENS WITH FIVE ACORNS.'], ['STICK: SWIM. HOLD '+L('a')+': UP. HOLD '+L('c')+': DIVE.'], ['RELEASE UP AND DIVE TO FLOAT GENTLY.'], ['AT THE SURFACE, PRESS '+L('a')+' AGAIN TO LEAP OUT.'], ['BUBBLE VENTS AND THE SURFACE REFILL AIR.'], ['COINS TOP UP AIR AND MEND YOUR BISCUIT.'], [L('b')+' OPENS THE CHEST IN THE WRECK.'], ['FIND THREE PEARLS. FOLLOW THE CURRENT HOOPS.'], ['IN THE MANOR, '+L('b')+' OPENS AND CLOSES THE DOOR.']]
          : [['DRESS FOR THE QUEST','#ffd23a'],['FIND THREE SECRET RINGS ON BISCUIT ISLAND.'],['POUND THEIR SWITCHES TO WAKE MATCHING BOXES.'],[L('b')+' BY A BOX: TAKE ITS TEMPORARY OUTFIT.'],['BROLLY BONNET: HOLD '+L('a')+' IN THE AIR TO GLIDE.'],['TIN BISCUIT: SINK, WALK AND WEIGH DOWN PLATES.'],['PEEKABOO HOOD: CROSS VIOLET GRILLES.'],['SWITCH UNLOCKS STAY ON FILE A.'],['OUTFIT TIMERS FREEZE ON PAUSE.'],['REVISIT THE COVE, GROTTO AND LIBRARY.']];
        pg.forEach(([s, c], i) => (i === 0 ? F.center(hud, s, W / 2, 102, c, 1) : F.draw(hud, s, 18, 106 + i * 12, '#fff', 1)));
        F.center(hud, (subI + 1) + '/4  PRESS ' + L('a'), W / 2, H - 10, '#9ab', 1);
      }
      function drawCard() {
        const w = card.w, cols = { canopy:['#457c78','#c6d38e'],sands:['#9c698f','#e8c38e'],foundry:['#57455f','#a98d64'],snowhall:['#384c71','#e2c498'], brolly:['#517bb0','#efc679'],pantry:['#285861','#afc49b'],peekaboo:['#25213d','#b9a1dc'],grotto: ['#125977', '#92d2c6'], hub: ['#2a7ad8', '#5ab83a'], cove: ['#2a9ad8', '#f0d090'], peaks: ['#6a9ad8', '#f0f6ff'], manor: ['#1a1040', '#5a3a8a'], tower: ['#e86a5a', '#ffc87a'], boss: ['#3a0a08', '#c8481a'] }[w];
        const gr = hud.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); hud.fillStyle = gr; hud.fillRect(0, 0, W, H);
        hud.strokeStyle = '#c8a050'; hud.lineWidth = 6; hud.strokeRect(6, 6, W - 12, H - 12); hud.strokeStyle = '#7a5a1a'; hud.lineWidth = 2; hud.strokeRect(10, 10, W - 20, H - 20);
        const nm = WN[w]; bigText(nm, W / 2, 38, nm.length > 16 ? 17 : 22);
        const list = ACS,row=list.length>8?11:list.length>7?12:15; list.forEach((a, i) => { const g = gotAc(a.id); acIcon(48, 74 + i * row, 10, g ? '#ffc81a' : 'rgba(255,255,255,.35)'); F.draw(hud, (i === (card.sel || 0) ? '> ' : (i + 1) + '. ') + a.name, 60, 70 + i * row, i === (card.sel || 0) ? '#ffd85a' : g ? '#ffe86a' : '#fff', 1, '#000'); });
        if (curW !== 'hub' && curW !== 'boss') { const a = ACS[card.sel || 0]; const hint = WORLDS[w].power ? 'POUND THE GREAT SWITCH. PRESS '+L('b')+' BY ITS BOX. USE YOUR NEW OUTFIT TO FINISH THE ROUTE.' : a.power ? 'THIS RETURN ROUTE NEEDS '+POWER_DEFS[a.power].name+'. FIND ITS SECRET SWITCH ON BISCUIT ISLAND.' : curW==='canopy'?({skyline:'CLIMB THE WESTERN SPIRAL. FOLLOW THE WALKS TO THE HIGH BOUGH.',latches:'POUND ALL THREE ROOT WHEELS TO WAKE THE BASKET LIFTS.',sprout:'OPEN THREE ROOTS. BRING THE EASTERN SPROUT BACK TO ITS KEEPER.',manager:'DODGE THE GOLD TARGETS. PUNCH DURING THE BLUE TIE BREAK.',reds:'SEARCH THE FOREST FLOOR, CROWNS AND CONNECTING WALKS.',c100:'FOLLOW BOTH THE FOREST AND CANOPY COIN ROUTES.'}[a.id]):curW==='sands'?({summit:'HOP UP THE NINE TEMPLE TIERS. EVERY SIDE OFFERS A ROUTE.',bells:'POUND THREE MINT DRUMS UNDER THE BRASS BELLS.',post:'ASK THE POSTMASTER. RUN THROUGH FIVE GOLD HOOPS IN ORDER.',parcel:'FIND THE TEA PARCEL IN THE NORTHWEST RUINS. BRING IT HOME.',reds:'LOOK ON DUNES, TEMPLE, COURTYARD AND BELL YARDS.',c100:'FOLLOW THE SAND COIN ROUTES. COINS MEND YOUR BISCUIT.'}[a.id]):curW==='foundry'?({stack:'FOLLOW THE STEPS AROUND THE POPPING STACK. HOLD '+L('a')+' FOR HEIGHT.',valves:'GROUND POUND THREE BRASS WHEELS TO COOL THE PAN.',gantry:'TALK TO THE SHIFT BOSS. RUN UP BEFORE EACH MINT GANTRY JUMP.',foreman:'HOP THE STEAM RINGS. BACKFLIP AND POUND THE BLUE LID.',reds:'SEARCH THE YARDS, STACK AND GANTRY FOR EIGHT RED PAY PACKETS.',c100:'FOLLOW EVERY FOUNDRY COIN TRAIL. COINS MEND YOUR BISCUIT.'}[a.id]):curW === 'grotto' ? ({dip:'HOLD '+L('c')+' TO DIVE. '+L('a')+' SWIMS UP. TAKE A BREATH AT THE SURFACE.',chest:'SWIM INTO THE WRECK AND PRESS '+L('b')+' BESIDE THE CHEST.',pearls:'FIND THREE SHINING PEARLS. BUBBLE VENTS REFILL YOUR AIR.',current:'FOLLOW THE THREE GOLD HOOPS UNDERWATER. LET THE CURRENT HELP.',roost:'PRESS '+L('a')+' AT THE SURFACE TO LEAP ONTO THE STEPPING ROCKS.'}[a.id] || 'EXPLORE EVERY DEPTH. COINS MEND YOUR BISCUIT AND TOP UP YOUR AIR.') : a.id === 'trial' ? TRIALS[curW].hint : a.id === 'c100' ? 'FOLLOW EVERY COIN TRAIL. COINS ALSO MEND YOUR BISCUIT.' : a.hidden ? 'TALK TO THE LOCALS AND LOOK FOR SOMETHING TO SET RIGHT.' : 'A SHINY ACORN IS WAITING UP THERE. LOOK FOR A WAY TO CLIMB.'; wrap(hint, 47).slice(0, 2).forEach((s, i) => F.center(hud, s, W / 2, 176 + i * 10, '#eef8ff', 1, '#000')); }
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
        snowCull();
        const t = clock;
        if (WD.swimEnabled) { const f = clamp((WD.water + .4 - cam.position.y) / 1.5,0,1); T3.scene.fog.color.setHex(WD.fog[0]).lerp(col.setHex(0x2e7c8d),f); T3.scene.fog.near = lerp(28,6,f); T3.scene.fog.far = lerp(110,48,f); }
        if(FD)for(const {m} of FD.steam){const a=cam.position,b=BOP.root.position,v=tv.set(b.x-a.x,b.y+1-a.y,b.z-a.z),len=v.lengthSq(),q=tv2.copy(m.position).sub(a),u=q.dot(v)/(len||1),off=q.addScaledVector(v,-u).length(),near=m.position.distanceTo(a);m.scale.setScalar(m.userData.steamScale*Math.min(clamp((near-2)/3,0,1),u>0&&u<1&&off<2.8?0:1));}
        coinsDraw(t);
        floorAt(P.x, P.z, P.y + 0.1); if (BOP.root.visible && FL.h > -100) shadow(P.x, FL.h, P.z, Math.max(0.38, 0.65 - (P.y - FL.h) * 0.018), !FL.o);
        for (const e of ENS) if (e.alive && e.mesh && e.mesh.visible && Math.hypot(e.x - P.x, e.z - P.z) < 40) { const h = e.kind === 'boohoo' ? floorAt(e.x,e.z,e.y) : e.y; shadow(e.x, h, e.z, e.kind === 'boohoo' ? 0.6 : 0.75); }
        for (const n of NPCS) if (!n.foundryBoss&&!n.canBoss&&n.kind !== 'sign' && Math.hypot(n.x - P.x, n.z - P.z) < 30) shadow(n.x, n.ghost ? WD.ground(n.x, n.z) : n.y, n.z, 0.8);
        if(FD&&FD.boss.st!=='gone')shadow(0,2,-34,2.3);
        if (curW === 'boss' && BOSS.mesh && BOSS.mesh.visible) shadow(BOSS.x, 2, BOSS.z, 2.0);
        if (curW === 'manor' && BB.mesh && BB.mesh.visible) shadow(BB.x, WD.ground(BB.x, BB.z), BB.z, 1.6);
        if(CAN&&CAN.bossNpc.mesh.visible)shadow(34,canopyGround(34,-35),-35,.85*CAN.bossNpc.mesh.scale.x);
        shadowsEnd();
        T3.render(); drawHud();
      }

      let saveT = 0;
      function update(dt) {
        if (K.restoring && (K.any() || K.pressed('up') || K.pressed('down') || K.pressed('left') || K.pressed('right') || K.pressed('l') || K.pressed('r'))) { K.resume?.(); tok0 = K.t; }
        updateStep(dt); saveT += dt;
        if (!demo && (saveT > 0.75 || K.any() || K.pressed('up') || K.pressed('down'))) { saveT = 0; saveNow(); }
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
      const onHide = () => saveNow();
      const onVisibility = () => { if (document.hidden) saveNow(); };
      addEventListener('pagehide', onHide); addEventListener('beforeunload', onHide); document.addEventListener('visibilitychange', onVisibility);
      if (K.restoring) {
        if (disk.ui?.title) { ({ started, menuI, sub, subI, idleT } = disk.ui); }
        else if (runCache) { restoreRun(copy(runCache)); if (disk.ui?.quit) fading = Object.assign({}, disk.ui.quit, { fn: () => applyTransition(disk.ui.quit.action) }); }
      }
      function screenBounds(o){
        const r={left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity},v=new T.Vector3();o.updateWorldMatrix(true,true);cam.updateMatrixWorld(true);
        o.traverseVisible(m=>{const a=m.geometry&&m.geometry.attributes.position;if(!a||!m.visible)return;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld).project(cam);const x=(v.x+1)*W/2,y=(1-v.y)*H/2;r.left=Math.min(r.left,x);r.right=Math.max(r.right,x);r.top=Math.min(r.top,y);r.bottom=Math.max(r.bottom,y);}});return r;
      }
      window.__hopDbg = { presentation:()=>({head:screenBounds(BOP.head),reward:winA&&screenBounds(winA.mesh)}), save: saveNow, snapshot, restore: restoreRun, C, cameraRoom, get clock() { return clock; }, get ui() { return { started, menuI, sub, subI, card }; }, get fading() { return fading && { t: fading.t, done: fading.done, action: fading.action }; }, doors: () => DOORS, solids: () => ({ boxes: BOXES, cyls: CYLS, movers: MOVERS }), npcs: () => NPCS, coins: () => COINS, reds: () => REDS, lamps: () => LAMPS, get grotto() { return GROT; }, get snow(){return SNOW;},snowAt,snowInside,cutAt,cutLength:CUT_LENGTH,cutStart:CUT_START,cutJoin:CUT_JOIN,cutGap:CUT_GAP,snowEnd:SNOW_END,snowLength:SNOW_LENGTH,get school(){return SCHOOL;},schoolLessons:SCHOOL_LESSONS,get canopy(){return CAN;},canopyGround,canopyTrees:CAN_TREES,canopyTop:CAN_TOP,get sands(){return SS;},sandGround,sandFlags:SAND_FLAGS,sandBells:SAND_BELLS,get foundry(){return FD;},get total(){return TOTAL;}, powerDefs:POWER_DEFS, get powerRun(){return POWER_RUN;},powerBoxes:()=>powerBoxes,powerPortals:()=>powerPortals,powerGates:()=>powerGates,get powerSwitch(){return powerSwitch;},coinClarity:()=>({scales:coinScales,coins:COINS.map(c=>({x:c.x,y:c.y,z:c.z,got:c.got})),faces:coinGeo.attributes.position.count/3}), get trial() { return TRIAL; }, props: () => PROPS, title: toTitle, view, P, prog, get mode() { return mode; }, get world() { return curW; }, ACS: () => ACS, ENS: () => ENS, BOSS, BB, PERCY, WORLDS, go(w) { buildWorld(w); spawnInWorld(w); mode = 'play'; music(WORLDS[w].song); }, tp(x, y, z) { respawnAt(x, y, z, P.face); }, air(x, y, z) { Object.assign(P, { x, y, z, vx: 0, vy: 0, vz: 0, gnd: false, st: 'fall', stT: 0 }); }, give(n) { for (let i = 0; i < n; i++) prog.ac['x' + (i / 6 | 0)] = Object.assign(prog.ac['x' + (i / 6 | 0)] || {}, { ['a' + i]: 1 }); }, reveal, visit, get paused() { return paused; } };
      return { update, draw, end() { saveNow();tinEnv.dispose(); removeEventListener('pagehide', onHide); removeEventListener('beforeunload', onHide); document.removeEventListener('visibilitychange', onVisibility); if (window.__hopDbg?.P === P) delete window.__hopDbg; } };
    },
  });
})();

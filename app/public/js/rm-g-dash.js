/* ZIP ADVENTURE (Dreamcast, in Jack's room): Zip the Hedgehog goes 3D. Doctor Chromedome is stuffing the island's
 * critters into wind-up robots, and Zip is having none of it. Five stages, one after another: EMERALD BAY (a boardwalk,
 * a loop, and a robot whale that chases you down the pier), NEON HIGHWAY (a city at night, rails to grind and a run
 * straight down the side of a skyscraper), FROSTBITE PEAK (an ice cave, then a snowboard race against an avalanche),
 * STARLIGHT CASINO (a neon track in space with bumpers, a corkscrew and a double loop) and the CHROME CRUSHER (the
 * Doctor's flying machine). Plus TRIAL (any stage you've reached, for best times and ranks) and the CHUM GARDEN, where
 * the critters you rescue live with your little pet Chums.
 * Moves: run (stick), jump (A), homing attack (A again in the air: it locks on to the nearest robot), spin dash (hold B,
 * let go), grind (land on a rail), tricks (A or B in the air off a ramp). Rings protect you: get hit with none and it's a
 * life. Saves to the Visual Memory card (so to speak): stages reached, ranks, badges, best times and your Chums.
 * Clean, bright and fast, the way the Dreamcast did it. Everything original: the hedgehog, the robots, the tunes. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const GID = 'dc.dash';
  const SECRETS = [
    ['rm.dash.whale', 'Thar She Blows', 'Outrun something very big and very wet in Zip Adventure.'],
    ['rm.dash.chum', 'Chum Champion', 'Raise a Chum in Zip Adventure until it is as happy as it can be.'],
    ['rm.dash.doctor', 'Chrome Plated', 'Send Doctor Chromedome packing at the end of Zip Adventure.'],
  ];
  for (const [id, n, h] of SECRETS) { try { if (window.Apps && Apps.defineSecret && !(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, h); } catch (e) {} }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const wrapA = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };

  // ================================================================ the tunes
  const SONGS = {
    title: { bpm: 150, wave: 'square', vol: 0.04, bassWave: 'sawtooth',
      lead: [76, 0, 79, 0, 83, -1, 81, 79, 76, 0, 74, 0, 76, -1, -1, 0, 72, 0, 76, 0, 79, -1, 78, 76, 74, -1, 71, 0, 74, -1, -1, 0, 76, 0, 79, 0, 83, -1, 84, 83, 81, 0, 79, 0, 81, -1, 83, 0, 84, 0, 83, 0, 81, 0, 79, -1, 76, 0, 79, -1, -1, -1],
      bass: [40, 0, 52, 40, 0, 40, 52, 0, 36, 0, 48, 36, 0, 36, 48, 0, 38, 0, 50, 38, 0, 38, 50, 0, 40, 0, 52, 40, 43, 0, 47, 0], drums: 'o.x.o.xxo.x.oox.' },
    bay: { bpm: 156, wave: 'square', vol: 0.04, bassWave: 'triangle',
      lead: [79, 0, 81, 83, 0, 79, 0, 76, -1, 0, 74, 76, 0, 79, -1, 0, 81, 0, 79, 81, 0, 83, 0, 86, -1, -1, 84, 0, 83, -1, -1, 0, 79, 0, 81, 83, 0, 79, 0, 76, -1, 0, 74, 76, 0, 72, -1, 0, 74, 0, 76, 79, 0, 76, 0, 74, -1, -1, 72, -1, -1, 0, 0, 0],
      bass: [43, 0, 43, 55, 0, 43, 55, 0, 40, 0, 40, 52, 0, 40, 52, 0, 36, 0, 36, 48, 0, 36, 48, 0, 38, 0, 38, 50, 0, 38, 50, 0], drums: 'o.x.o.x.o.x.oxx.' },
    city: { bpm: 140, wave: 'sawtooth', vol: 0.03, bassWave: 'square',
      lead: [69, 0, 72, 0, 76, 0, 72, 0, 74, -1, 72, 0, 69, -1, -1, 0, 67, 0, 71, 0, 74, 0, 71, 0, 72, -1, 71, 0, 67, -1, -1, 0, 69, 0, 72, 0, 76, 0, 79, 0, 81, -1, 79, 0, 76, -1, 74, 0, 72, 0, 74, 0, 76, -1, 72, 0, 69, -1, -1, -1, 0, 0, 0, 0],
      bass: [33, 33, 45, 33, 33, 45, 33, 45, 31, 31, 43, 31, 31, 43, 31, 43, 29, 29, 41, 29, 29, 41, 29, 41, 31, 31, 43, 31, 35, 35, 47, 35], drums: 'o.x.o.xxo.x.o.xx' },
    ice: { bpm: 132, wave: 'triangle', vol: 0.07, bassWave: 'triangle',
      lead: [76, -1, 79, -1, 83, -1, 88, -1, 86, -1, 83, -1, 81, -1, -1, -1, 74, -1, 78, -1, 81, -1, 86, -1, 84, -1, 81, -1, 79, -1, -1, -1, 76, -1, 79, -1, 83, -1, 88, -1, 91, -1, 88, -1, 86, -1, 83, -1, 81, -1, 79, -1, 78, -1, 74, -1, 76, -1, -1, -1, -1, -1, -1, -1],
      bass: [40, 0, 47, 0, 52, 0, 47, 0, 38, 0, 45, 0, 50, 0, 45, 0, 36, 0, 43, 0, 48, 0, 43, 0, 38, 0, 45, 0, 47, 0, 50, 0], drums: '..x...x...x.x.x.' },
    casino: { bpm: 128, wave: 'square', vol: 0.04, bassWave: 'triangle',
      lead: [72, 0, 76, 79, 0, 76, 72, 0, 77, 0, 81, 84, 0, 81, 77, 0, 76, 0, 79, 83, 0, 79, 76, 0, 74, -1, 77, -1, 79, -1, -1, 0, 72, 0, 76, 79, 0, 76, 72, 0, 77, 0, 81, 84, 0, 86, 84, 0, 83, 0, 79, 76, 0, 79, 83, 0, 84, -1, -1, -1, 0, 0, 0, 0],
      bass: [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 60, 0, 57, 0, 52, 0, 55, 0, 59, 0, 55, 0, 50, 0, 53, 0, 55, 0, 59, 0], drums: 'o..xo.x.o..xo.xx' },
    boss: { bpm: 172, wave: 'sawtooth', vol: 0.032, bassWave: 'square',
      lead: [64, 0, 64, 67, 0, 64, 70, 0, 69, 0, 67, 64, 0, 62, 64, 0, 64, 0, 64, 67, 0, 64, 72, 0, 71, 0, 70, 69, 0, 67, 69, 0],
      bass: [40, 40, 52, 40, 40, 52, 40, 52, 38, 38, 50, 38, 38, 50, 38, 50], drums: 'o.xxo.x.o.xxo.xx' },
    garden: { bpm: 104, wave: 'sine', vol: 0.09, bassWave: 'triangle',
      lead: [72, -1, 76, -1, 79, -1, 76, -1, 77, -1, 81, -1, 79, -1, -1, -1, 76, -1, 79, -1, 84, -1, 83, -1, 81, -1, 79, -1, 77, -1, 76, -1],
      bass: [48, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0], drums: '....x.......x...' },
    win: { bpm: 140, wave: 'square', vol: 0.05, bassWave: 'triangle', lead: [72, 76, 79, 84, -1, -1, 83, 84, -1, -1, -1, -1, 0, 0, 0, 0], bass: [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 55, 0, 0, 0] },
  };

  TV.game(GID, {
    three: true, stick: true, buttons: ['a', 'b'],
    help: 'Steer: arrows (Up: faster). Jump: Z, then Z again in the air for a homing attack. Spin dash: hold X, let go. Pause: Enter.',
    make(K) {
      const T3 = K.three({ fov: 66, near: 0.3, far: 700, fogCol: 0xa8d8ff, fogNear: 180, fogFar: 560 }), T = T3.T, hud = K.hud, F = K.font, W = K.W, H = K.H;
      const LT = T3.lights({ amb: 0.85, sun: 0.85, dir: [0.3, 1, 0.5], skyCol: 0xeaf6ff, groundCol: 0x6a8aa0 });
      let rnd = K.rnd(1014);
      const V3 = (x, y, z) => new T.Vector3(x, y, z);
      const tv = new T.Vector3();
      const L = b => K.label(b);

      // ---------------------------------------------------------------- merged, vertex-coloured parts (few draw calls)
      const _e = new T.Euler(), _q = new T.Quaternion(), _p = new T.Vector3(), _s = new T.Vector3();
      function M(x, y, z, rx, ry, rz, sx, sy, sz) { _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy, sz == null ? (sx == null ? 1 : sx) : sz); return new T.Matrix4().compose(_p, _q, _s); }
      const GC = {};
      const S = {
        box: () => GC.box || (GC.box = new T.BoxGeometry(1, 1, 1)),
        ball: s => GC['b' + (s || 12)] || (GC['b' + (s || 12)] = new T.SphereGeometry(0.5, s || 12, Math.max(6, ((s || 12) * 0.7) | 0))),
        cyl: (s, top) => GC['c' + (s || 12) + '_' + (top == null ? 1 : top)] || (GC['c' + (s || 12) + '_' + (top == null ? 1 : top)] = new T.CylinderGeometry(0.5 * (top == null ? 1 : top), 0.5, 1, s || 12)),
        cone: s => GC['k' + (s || 10)] || (GC['k' + (s || 10)] = new T.ConeGeometry(0.5, 1, s || 10)),
        tor: (t, s) => GC['t' + t + '_' + (s || 16)] || (GC['t' + t + '_' + (s || 16)] = new T.TorusGeometry(0.5, t, 8, s || 16)),
        ico: () => GC.ico || (GC.ico = new T.IcosahedronGeometry(0.5, 0)),
        oct: () => GC.oct || (GC.oct = new T.OctahedronGeometry(0.5, 0)),
        hemi: s => GC['h' + (s || 12)] || (GC['h' + (s || 12)] = new T.SphereGeometry(0.5, s || 12, 6, 0, TAU, 0, Math.PI / 2)),
      };
      const pt = (geo, c, x, y, z, sx, sy, sz, rx, ry, rz, sh) => ({ geo, c, m: M(x || 0, y || 0, z || 0, rx, ry, rz, sx, sy, sz), sh: sh || 0 });
      const ptM = (geo, c, m, sh) => ({ geo, c, m, sh: sh || 0 });
      const col = new T.Color();
      function merge(parts, uvMode) {
        let n = 0;
        const gs = parts.map(p => { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone(); g.applyMatrix4(p.m); n += g.attributes.position.count; return g; });
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), cl = new Float32Array(n * 3), uv = uvMode ? new Float32Array(n * 2) : null;
        let o = 0;
        gs.forEach((g, i) => {
          const P = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv ? g.attributes.uv.array : null, cnt = g.attributes.position.count, p = parts[i];
          pos.set(P, o * 3); nor.set(N, o * 3); col.set(p.c);
          let y0 = 1e9, y1 = -1e9; if (p.sh) for (let k = 0; k < cnt; k++) { const y = P[k * 3 + 1]; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          for (let k = 0; k < cnt; k++) {
            const f = p.sh ? 1 - p.sh * (1 - clamp((P[k * 3 + 1] - y0) / ((y1 - y0) || 1), 0, 1)) : 1;
            cl[(o + k) * 3] = col.r * f; cl[(o + k) * 3 + 1] = col.g * f; cl[(o + k) * 3 + 2] = col.b * f;
            if (uv) { if (uvMode === 'own' && U) { uv[(o + k) * 2] = U[k * 2] * (p.us || 1); uv[(o + k) * 2 + 1] = U[k * 2 + 1] * (p.vs || 1); } else { const nx = Math.abs(N[k * 3]), ny = Math.abs(N[k * 3 + 1]), nz = Math.abs(N[k * 3 + 2]), s = p.uv || uvMode; const x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2]; if (ny > nx && ny > nz) { uv[(o + k) * 2] = x / s; uv[(o + k) * 2 + 1] = z / s; } else if (nx > nz) { uv[(o + k) * 2] = z / s; uv[(o + k) * 2 + 1] = y / s; } else { uv[(o + k) * 2] = x / s; uv[(o + k) * 2 + 1] = y / s; } } }
          }
          o += cnt; g.dispose();
        });
        const out = new T.BufferGeometry();
        out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); out.setAttribute('color', new T.BufferAttribute(cl, 3));
        if (uv) out.setAttribute('uv', new T.BufferAttribute(uv, 2));
        out.computeBoundingSphere(); return out;
      }
      const MC = {};
      const mat = (key, p) => MC[key] || (MC[key] = T3.mat(p));
      const matV = () => mat('v', { vcol: true });
      const matVB = () => mat('vb', { vcol: true, lit: false });
      const ownMats = [];
      const shiny = () => MC.shiny || (MC.shiny = (() => { const m = new T.MeshPhongMaterial({ vertexColors: true, shininess: 60, specular: 0x555566 }); ownMats.push(m); return m; })());
      const TX = {};
      const tex = (key, w, h, paint) => TX[key] || (TX[key] = T3.tex(w, h, paint));
      const ring = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };

      // ---------------------------------------------------------------- particles: one instanced mesh
      const NP = 120, pMesh = new T.InstancedMesh(T3.keep(new T.OctahedronGeometry(0.5, 0)), T3.mat({ color: 0xffffff, lit: false }), NP);
      pMesh.frustumCulled = false; T3.add(pMesh);
      const parts = []; for (let i = 0; i < NP; i++) { parts.push({ t: 0, t0: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0.2, g: 18 }); pMesh.setColorAt(i, col.set(0xffffff)); }
      const pz = new T.Matrix4().makeScale(0, 0, 0), dum = new T.Object3D();
      let pN = 0;
      function burst(p, c, n, sp, o) {
        o = o || {};
        for (let i = 0; i < n; i++) {
          const q = parts[pN], idx = pN; pN = (pN + 1) % NP; const a = Math.random() * TAU, b = Math.random() * Math.PI - Math.PI / 2;
          q.t = q.t0 = (o.life || 0.6) * (0.7 + Math.random() * 0.6); q.x = p.x; q.y = p.y; q.z = p.z;
          q.vx = Math.cos(a) * Math.cos(b) * sp; q.vy = Math.abs(Math.sin(b)) * sp * (o.up == null ? 1 : o.up) + (o.vy || 0); q.vz = Math.sin(a) * Math.cos(b) * sp;
          if (o.dir) { q.vx += o.dir.x; q.vy += o.dir.y; q.vz += o.dir.z; }
          q.s = (o.size || 0.25) * (0.7 + Math.random() * 0.6); q.g = o.grav == null ? 18 : o.grav;
          pMesh.setColorAt(idx, col.set(Array.isArray(c) ? c[i % c.length] : c));
        }
        pMesh.instanceColor.needsUpdate = true;
      }
      function partsUpdate(dt) {
        for (let i = 0; i < NP; i++) {
          const q = parts[i]; if (q.t <= 0) { pMesh.setMatrixAt(i, pz); continue; }
          q.t -= dt; q.vy -= q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
          const k = Math.max(0, q.t / q.t0) * q.s; dum.position.set(q.x, q.y, q.z); dum.rotation.set(q.t * 8, q.t * 6, 0); dum.scale.set(k, k, k); dum.updateMatrix(); pMesh.setMatrixAt(i, dum.matrix);
        }
        pMesh.instanceMatrix.needsUpdate = true;
      }

      // ---------------------------------------------------------------- ZIP (blue, peach muzzle and belly, goggles up, yellow scarf, red trainers)
      const ZB = 0x2050d8, ZD = 0x163a9a, PE = 0xf4c890, RD = 0xe02828, YE = 0xf8d020, WH = 0xffffff, BK = 0x101018, GR = 0x8a8a96, GO = 0x5a3010, LE = 0x7ad0f0;
      const ZIP = (function () {
        const root = new T.Group(), m = new T.Group(); root.add(m); T3.add(root);
        const mk = (P, parent) => { const me = new T.Mesh(T3.keep(merge(P)), shiny()); (parent || m).add(me); return me; };
        const body = new T.Group(); body.position.y = 0.62; m.add(body);
        const torso = mk([pt(S.ball(14), ZB, 0, 0.28, 0.02, 0.78, 0.86, 0.72, 0, 0, 0, 0.25), pt(S.ball(12), PE, 0, 0.24, -0.2, 0.5, 0.62, 0.4), pt(S.tor(0.12, 16), YE, 0, 0.62, 0, 0.66, 0.66, 0.66, Math.PI / 2 + 0.15)], body);
        const head = new T.Group(); head.position.set(0, 0.78, -0.02); body.add(head);
        const Hp = [pt(S.ball(16), ZB, 0, 0.32, 0, 1.02, 0.96, 1.0, 0, 0, 0, 0.2)];
        [[0, 0.62, 0.22, 0.55, 1.15, -0.9], [0.0, 0.32, 0.5, 0.58, 1.3, -1.45], [0, 0.02, 0.4, 0.5, 1.0, -2.1], [0.34, 0.42, 0.3, 0.42, 0.95, -1.2], [-0.34, 0.42, 0.3, 0.42, 0.95, -1.2], [0.36, 0.12, 0.3, 0.38, 0.85, -1.8], [-0.36, 0.12, 0.3, 0.38, 0.85, -1.8]]
          .forEach(([x, y, z, r, len, a]) => { const A = -a; Hp.push(pt(S.cone(8), ZB, x, y + Math.cos(A) * len * 0.3, z + Math.sin(A) * len * 0.35, r, len, r * 0.8, A, 0, x * -0.6, 0.3)); });
        Hp.push(pt(S.ball(12), PE, 0, 0.16, -0.38, 0.6, 0.42, 0.42), pt(S.ball(8), BK, 0, 0.26, -0.6, 0.15, 0.12, 0.12),
          pt(S.box(), 0x8a3020, 0, 0.06, -0.55, 0.18, 0.04, 0.04), pt(S.cone(6), ZB, 0.32, 0.72, 0.02, 0.26, 0.42, 0.18, 0, 0, -0.35), pt(S.cone(6), ZB, -0.32, 0.72, 0.02, 0.26, 0.42, 0.18, 0, 0, 0.35),
          pt(S.cone(6), PE, 0.31, 0.7, -0.03, 0.14, 0.26, 0.08, 0, 0, -0.35), pt(S.cone(6), PE, -0.31, 0.7, -0.03, 0.14, 0.26, 0.08, 0, 0, 0.35),
          pt(S.tor(0.07, 20), GO, 0, 0.6, 0.0, 1.0, 1.0, 1.0, Math.PI / 2 - 0.35), pt(S.cyl(12), GO, 0.18, 0.7, -0.4, 0.3, 0.12, 0.3, -(Math.PI / 2 - 0.6)), pt(S.cyl(12), GO, -0.18, 0.7, -0.4, 0.3, 0.12, 0.3, -(Math.PI / 2 - 0.6)),
          pt(S.cyl(12), LE, 0.18, 0.72, -0.45, 0.22, 0.06, 0.22, -(Math.PI / 2 - 0.6)), pt(S.cyl(12), LE, -0.18, 0.72, -0.45, 0.22, 0.06, 0.22, -(Math.PI / 2 - 0.6)), pt(S.ball(6), WH, 0.22, 0.76, -0.47, 0.06, 0.06, 0.03));
        mk(Hp, head);
        const eyes = mk([pt(S.ball(12), WH, 0, 0.42, -0.4, 0.56, 0.4, 0.22), pt(S.ball(8), 0x2a8a3a, 0.12, 0.4, -0.5, 0.13, 0.22, 0.06), pt(S.ball(8), 0x2a8a3a, -0.12, 0.4, -0.5, 0.13, 0.22, 0.06),
          pt(S.ball(6), BK, 0.12, 0.4, -0.53, 0.07, 0.14, 0.04), pt(S.ball(6), BK, -0.12, 0.4, -0.53, 0.07, 0.14, 0.04), pt(S.ball(6), WH, 0.14, 0.45, -0.55, 0.035, 0.05, 0.02), pt(S.ball(6), WH, -0.1, 0.45, -0.55, 0.035, 0.05, 0.02)], head);
        const tailG = new T.Group(); tailG.position.set(0.1, 0.6, 0.3); body.add(tailG);
        const tail = mk([pt(S.box(), YE, 0, 0, 0.32, 0.24, 0.05, 0.62, 0, 0, 0, 0), pt(S.box(), 0xe8b810, 0.06, 0, 0.75, 0.2, 0.05, 0.4, 0, 0.3, 0)], tailG);
        const arm = s => { const g = new T.Group(); g.position.set(s * 0.36, 0.5, 0); body.add(g); mk([pt(S.cyl(8), PE, 0, -0.17, 0, 0.13, 0.36, 0.13), pt(S.ball(10), WH, 0, -0.4, 0, 0.27, 0.27, 0.27), pt(S.cyl(10), WH, 0, -0.3, 0, 0.24, 0.1, 0.24)], g); return g; };
        const leg = s => { const g = new T.Group(); g.position.set(s * 0.17, 0.05, 0); body.add(g); mk([pt(S.cyl(8), ZB, 0, -0.25, 0, 0.15, 0.5, 0.15), pt(S.ball(12), RD, 0, -0.56, -0.12, 0.34, 0.26, 0.64, 0, 0, 0, 0.25), pt(S.box(), WH, 0, -0.5, -0.1, 0.35, 0.08, 0.16), pt(S.box(), GR, 0, -0.67, -0.12, 0.32, 0.06, 0.62)], g); return g; };
        const armL = arm(1), armR = arm(-1), legL = leg(1), legR = leg(-1);
        const ballP = [pt(S.ball(14), ZB, 0, 0, 0, 1.3, 1.3, 1.3, 0, 0, 0, 0.2)]; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ballP.push(pt(S.cone(6), ZB, 0, Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.38, 0.6, 0.38, a + Math.PI / 2)); }
        ballP.push(pt(S.ball(8), PE, 0, 0, -0.45, 0.5, 0.5, 0.4), pt(S.box(), YE, 0, 0.0, 0.0, 1.36, 0.16, 0.2));
        const ball = new T.Mesh(T3.keep(merge(ballP)), shiny()); ball.position.y = 0.7; m.add(ball); ball.visible = false;
        const board = new T.Mesh(T3.keep(merge([pt(S.box(), 0xf04a8a, 0, 0, 0, 0.6, 0.08, 1.9, 0, 0, 0, 0.3), pt(S.cyl(12), 0xf04a8a, 0, 0, -0.95, 0.6, 0.08, 0.6), pt(S.cyl(12), 0xf04a8a, 0, 0, 0.95, 0.6, 0.08, 0.6), pt(S.box(), WH, 0, 0.05, 0, 0.12, 0.02, 2.2), pt(S.box(), 0x222222, 0, 0.07, -0.4, 0.5, 0.06, 0.12), pt(S.box(), 0x222222, 0, 0.07, 0.4, 0.5, 0.06, 0.12)])), shiny());
        board.position.y = 0.04; m.add(board); board.visible = false;
        const shT = tex('shadow', 32, 32, g => { const gr = g.createRadialGradient(16, 16, 2, 16, 16, 15); gr.addColorStop(0, 'rgba(0,0,30,.5)'); gr.addColorStop(1, 'rgba(0,0,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
        const sh = new T.Mesh(T3.keep(new T.PlaneGeometry(1.6, 1.6)), T3.mat({ map: shT, transparent: true, lit: false })); sh.material.depthWrite = false; sh.renderOrder = 2; T3.add(sh);
        return { root, m, body, torso, head, eyes, tailG, tail, armL, armR, legL, legR, ball, board, sh, blink: 2 };
      })();

      // ---------------------------------------------------------------- the robots, monitors, springs, rings
      const MOD = {};
      function model(kind) {
        if (MOD[kind]) return MOD[kind];
        let P;
        const eye = (x, y, z, s, c) => [pt(S.ball(10), WH, x, y, z, s, s, s * 0.6), pt(S.ball(8), c || BK, x, y, z - s * 0.28, s * 0.5, s * 0.5, s * 0.2)];
        if (kind === 'beetle') { // a wind-up ladybird robot with a big key
          P = [pt(S.hemi(16), 0xe02020, 0, 0.4, 0.05, 1.6, 1.3, 1.8, 0, 0, 0, 0.3), pt(S.cyl(16), 0x2a2a34, 0, 0.42, 0.05, 1.62, 0.12, 1.82), pt(S.box(), 0x1a1a22, 0, 0.9, 0.05, 0.06, 0.5, 1.7), pt(S.ball(12), 0x2a2a34, 0, 0.6, -0.85, 0.8, 0.6, 0.6),
            ...eye(0.2, 0.7, -1.1, 0.3, 0xff2a2a), ...eye(-0.2, 0.7, -1.1, 0.3, 0xff2a2a), ...[[0.4, 0.9, -0.2], [-0.4, 0.9, -0.2], [0.35, 0.9, 0.45], [-0.35, 0.9, 0.45]].map(([x, y, z]) => pt(S.ball(8), BK, x, y, z, 0.35, 0.1, 0.35)),
            pt(S.cyl(6), 0xc8c8d0, 0, 1.2, 0.3, 0.1, 0.5, 0.1), pt(S.tor(0.08, 12), 0xc8c8d0, 0.0, 1.55, 0.3, 0.6, 0.6, 0.6, 0, Math.PI / 2, 0),
            ...[-1, 1].flatMap(s => [0, 1, 2].map(i => pt(S.cyl(5), 0x2a2a34, s * 0.75, 0.2, -0.4 + i * 0.45, 0.08, 0.5, 0.08, 0, 0, s * 0.9)))];
        } else if (kind === 'bee') { // a hovering wind-up bee with a stinger cannon
          P = [pt(S.ball(14), 0xffd020, 0, 0, 0, 1.0, 0.9, 1.5, 0, 0, 0, 0.3), ...[-0.3, 0.1, 0.5].map(z => pt(S.cyl(14), 0x1a1a22, 0, 0, z, 0.95, 0.16, 0.95, Math.PI / 2)), pt(S.ball(10), 0x1a1a22, 0, 0.1, -0.75, 0.7, 0.65, 0.6),
            ...eye(0.18, 0.18, -1.0, 0.28, 0x2ad0ff), ...eye(-0.18, 0.18, -1.0, 0.28, 0x2ad0ff), pt(S.cone(8), 0xc8c8d0, 0, -0.25, 0.85, 0.3, 0.7, 0.3, Math.PI / 2 + 0.4), pt(S.cyl(5), BK, 0.15, 0.55, -0.7, 0.04, 0.4, 0.04, 0, 0, -0.3), pt(S.cyl(5), BK, -0.15, 0.55, -0.7, 0.04, 0.4, 0.04, 0, 0, 0.3)];
        } else if (kind === 'wings') { P = [pt(S.ball(10), 0xd8f4ff, 0.75, 0.35, 0, 1.1, 0.06, 0.55, 0, 0, 0.3), pt(S.ball(10), 0xd8f4ff, -0.75, 0.35, 0, 1.1, 0.06, 0.55, 0, 0, -0.3)];
        } else if (kind === 'roller') { // an armadillo robot that curls up and rolls at you
          P = [pt(S.ball(16), 0x3a6ad8, 0, 0.9, 0, 1.8, 1.7, 1.8, 0, 0, 0, 0.3), ...[-0.5, 0, 0.5].map(r => pt(S.tor(0.06, 20), 0xc8d8ff, 0, 0.9, 0, 1.78, 1.78, 1.78, 0, r, Math.PI / 2)), pt(S.ball(10), 0xc8c8d0, 0, 0.9, -0.85, 0.7, 0.6, 0.3), ...eye(0.2, 1.0, -0.95, 0.25, 0xffd020), ...eye(-0.2, 1.0, -0.95, 0.25, 0xffd020)];
        } else if (kind === 'monitor') { // an item box (a TV on a stand)
          P = [pt(S.box(), 0xd8d8e0, 0, 0.75, 0, 1.3, 1.3, 1.1, 0, 0, 0, 0.3), pt(S.box(), 0x1a2a3a, 0, 0.8, -0.56, 1.0, 0.9, 0.04), pt(S.box(), 0x8a8a96, 0, 0.07, 0, 1.0, 0.14, 0.8), pt(S.box(), 0xffffff, 0, 1.36, 0, 1.34, 0.06, 1.14)];
        } else if (kind === 'spring') {
          P = [pt(S.cyl(14), 0xe02828, 0, 0.2, 0, 2.0, 0.4, 2.0, 0, 0, 0, 0.3), ...[0, 1, 2].map(i => pt(S.tor(0.08, 14), 0xc8c8d0, 0, 0.5 + i * 0.18, 0, 1.3, 1.3, 1.3, Math.PI / 2))];
        } else if (kind === 'springtop') { P = [pt(S.cyl(14), 0xf8d020, 0, 0, 0, 1.9, 0.25, 1.9, 0, 0, 0, 0.2), pt(S.cyl(14), 0xffffff, 0, 0.13, 0, 1.2, 0.03, 1.2)];
        } else if (kind === 'lamp') { P = [pt(S.cyl(8), 0x3a3a48, 0, 1.6, 0, 0.24, 3.2, 0.24), pt(S.cyl(8), 0x3a3a48, 0, 0.1, 0, 0.6, 0.2, 0.6), pt(S.ball(10), 0xff3a1a, 0, 3.35, 0, 0.7, 0.7, 0.7)];
        } else if (kind === 'lampon') { P = [pt(S.cyl(8), 0x3a3a48, 0, 1.6, 0, 0.24, 3.2, 0.24), pt(S.cyl(8), 0x3a3a48, 0, 0.1, 0, 0.6, 0.2, 0.6), pt(S.ball(10), 0x3ae0ff, 0, 3.35, 0, 0.7, 0.7, 0.7)];
        } else if (kind === 'bumper') { P = [pt(S.cyl(20), 0x2a2a3a, 0, 0.4, 0, 2.6, 0.8, 2.6, 0, 0, 0, 0.3), pt(S.cyl(20), 0xff3ab0, 0, 1.0, 0, 2.3, 0.6, 2.3), pt(S.tor(0.12, 20), 0xffffff, 0, 1.32, 0, 2.0, 2.0, 2.0, Math.PI / 2), pt(S.ball(10), 0xffe04a, 0, 1.35, 0, 0.6, 0.3, 0.6)];
        } else if (kind === 'spikes') { P = [pt(S.box(), 0x6a6a76, 0, 0.1, 0, 3, 0.2, 1.2)]; for (let i = 0; i < 5; i++) P.push(pt(S.cone(4), 0xd8d8e0, -1.2 + i * 0.6, 0.6, 0, 0.45, 0.9, 0.45));
        } else if (kind === 'critter') { P = [pt(S.ball(10), 0xffffff, 0, 0.35, 0, 0.6, 0.55, 0.6), pt(S.ball(8), 0xffb04a, 0, 0.35, -0.32, 0.18, 0.12, 0.2), ...eye(0.12, 0.48, -0.25, 0.14), ...eye(-0.12, 0.48, -0.25, 0.14), pt(S.ball(8), 0xffffff, 0.3, 0.45, 0.05, 0.32, 0.12, 0.25, 0, 0, 0.5), pt(S.ball(8), 0xffffff, -0.3, 0.45, 0.05, 0.32, 0.12, 0.25, 0, 0, -0.5)];
        }
        const g = merge(P); g.userData.persist = true; T3.keep(g); return (MOD[kind] = g);
      }

      // ================================================================ the courses: built like roller coasters
      // a segment: [metres, turn (deg, + is left), climb (deg), sideways shift, { tw: corkscrew twist (deg), w: half width, gap, pier, wall }]
      let ST = null, SG = null, pts = [], LEN = 1, SEGS = [];
      function trace(course, w0) {
        pts = []; SEGS = [];
        let P = V3(0, 0, 0), Tt = V3(0, 0, -1), U = V3(0, 1, 0), Sx = V3(1, 0, 0), w = w0;
        const rot = (v, ax, a) => v.applyAxisAngle(ax, a);
        pts.push({ p: P.clone(), t: Tt.clone(), u: U.clone(), s: Sx.clone(), w, gap: false, bank: 0, twist: false });
        course.forEach(([len, yaw, climb, shift, ex]) => {
          ex = ex || {}; const n = Math.max(1, Math.round(len)), ya = (yaw || 0) * Math.PI / 180 / n, pa = (climb || 0) * Math.PI / 180 / n, ta = (ex.tw || 0) * Math.PI / 180 / n, sh = (shift || 0) / n;
          const s0 = pts.length - 1, wT = ex.w || w0, wS = w;
          SEGS.push({ s0, s1: s0 + n, ex, loop: Math.abs(climb || 0) >= 300, tw: !!ex.tw });
          for (let i = 0; i < n; i++) {
            if (ya) { const ax = U.clone(); rot(Tt, ax, ya); rot(Sx, ax, ya); }
            if (pa) { const ax = Sx.clone(); rot(Tt, ax, pa); rot(U, ax, pa); }
            if (ta) { const ax = Tt.clone(); rot(U, ax, ta); rot(Sx, ax, ta); }
            Tt.normalize(); U.normalize(); Sx.crossVectors(Tt, U).normalize(); U.crossVectors(Sx, Tt).normalize();
            P = P.clone().addScaledVector(Tt, 1).addScaledVector(Sx, sh);
            w = lerp(wS, wT, Math.min(1, (i + 1) / 10));
            pts.push({ p: P.clone(), t: Tt.clone(), u: U.clone(), s: Sx.clone(), w, gap: !!ex.gap, bank: Math.abs(climb || 0) >= 300 || ex.tw ? 0 : -(ya * n / len) * 9, loop: Math.abs(climb || 0) >= 300, twist: !!ex.tw, pier: !!ex.pier });
          }
          w = wT;
        });
        LEN = pts.length - 1;
      }
      const FR = () => ({ p: V3(), t: V3(), u: V3(), s: V3() });
      const tmpF = FR();
      function at(s, u, h, out) {
        out = out || tmpF;
        s = ST.ring ? ((s % LEN) + LEN) % LEN : clamp(s, 0, LEN - 0.001);
        const i = Math.floor(s), f = s - i, A = pts[i], B = pts[Math.min(LEN, i + 1)];
        out.t.copy(A.t).lerp(B.t, f).normalize(); out.u.copy(A.u).lerp(B.u, f).normalize(); out.s.crossVectors(out.t, out.u).normalize();
        const bank = A.bank + (B.bank - A.bank) * f; if (bank) { out.u.applyAxisAngle(out.t, bank * 0.06); out.s.crossVectors(out.t, out.u).normalize(); }
        out.p.copy(A.p).lerp(B.p, f).addScaledVector(out.s, u || 0).addScaledVector(out.u, h || 0);
        return out;
      }
      const ptAt = s => pts[clamp(Math.floor(ST.ring ? ((s % LEN) + LEN) % LEN : s), 0, LEN)];
      const halfW = s => ptAt(s).w;
      const isGap = s => !ST.ring && ptAt(s).gap;
      function orient(obj, fr, pos) { const mx = new T.Matrix4().makeBasis(fr.s, fr.u, fr.t.clone().negate()); obj.quaternion.setFromRotationMatrix(mx); obj.position.copy(pos || fr.p); }
      const mtxAt = (s, u, h, sx, sy, sz, ry) => { const f = at(s, u, h, FR()), mx = new T.Matrix4().makeBasis(f.s, f.u, f.t.clone().negate()); if (ry) mx.multiply(new T.Matrix4().makeRotationY(ry)); mx.setPosition(f.p); if (sx != null) mx.multiply(new T.Matrix4().makeScale(sx, sy, sz)); return mx; };

      // ---- a ribbon along the course: fA/fB give the two edges (u, h) at each point; gaps are skipped
      function ribbon(fA, fB, vScale, flipN, cond) {
        const pos = [], uv = [], o = FR(), a = V3(), b = V3();
        let prev = null;
        for (let i = 0; i <= LEN; i++) {
          const p = pts[i], ok = !p.gap && (!cond || cond(i, p));
          if (!ok) { prev = null; continue; }
          at(i, 0, 0, o); const [ua, ha] = fA(p, i), [ub, hb] = fB(p, i);
          a.copy(o.p).addScaledVector(o.s, ua).addScaledVector(o.u, ha); b.copy(o.p).addScaledVector(o.s, ub).addScaledVector(o.u, hb);
          const cur = [a.x, a.y, a.z, b.x, b.y, b.z, i / vScale];
          if (prev) {
            const [ax, ay, az, bx, by, bz, v0] = prev, v1 = cur[6];
            const quad = [[ax, ay, az, 0, v0], [bx, by, bz, 1, v0], [cur[0], cur[1], cur[2], 0, v1], [bx, by, bz, 1, v0], [cur[3], cur[4], cur[5], 1, v1], [cur[0], cur[1], cur[2], 0, v1]];
            if (flipN) quad.reverse();
            for (const q of quad) { pos.push(q[0], q[1], q[2]); uv.push(q[3], q[4]); }
          }
          prev = cur;
        }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); g.computeBoundingSphere();
        return g;
      }

      // ================================================================ the five stages (and the garden)
      const STAGES = [
        { id: 'bay', name: 'EMERALD BAY', song: 'bay', w: 4.6, par: 150, sky: [[0, '#1a6ae0'], [0.42, '#6ab4ff'], [0.52, '#e0f4ff'], [1, '#e0f4ff']], fog: [0xbfe4ff, 200, 600], light: { amb: 0.85, sun: 0.85, sky: 0xeaf6ff, gnd: 0x6a8aa0 },
          critter: 0xffffff, story: ['DOCTOR CHROMEDOME IS STUFFING THE ISLAND\'S', 'CRITTERS INTO WIND-UP ROBOTS. ZIP IS NOT', 'HAVING THAT. FIRST STOP: EMERALD BAY.'],
          course: [[70, 0, 0], [70, 35, 0], [80, -60, 0], [40, 0, -12], [50, 0, 12], [60, 25, 0], [40, 0, 0], [88, 0, 360, 9], [40, 0, 0], [110, -95, 0], [90, 0, 0], [60, 55, 0], [60, -55, 0], [40, 0, 0],
            [340, 0, 0, 0, { w: 3.8, pier: 1 }], [14, 0, 16, 0, { w: 3.8, pier: 1 }], [34, 0, -30, 0, { gap: 1 }], [16, 0, 14], [80, 30, 0], [60, -30, 0], [60, 0, 0], [88, 0, 360, -9], [70, 20, 0], [120, 0, 0]] },
        { id: 'city', name: 'NEON HIGHWAY', song: 'city', w: 5, par: 160, sky: [[0, '#05051a'], [0.42, '#1a1050'], [0.5, '#5a2a8a'], [1, '#2a1a4a']], fog: [0x2a1a4a, 160, 520], light: { amb: 0.6, sun: 0.7, sky: 0x8a8aff, gnd: 0x3a2a5a, sunCol: 0xffd0ff },
          critter: 0xffd0a0, story: ['THE DOCTOR\'S ROBOTS HAVE TAKEN OVER THE', 'CITY. ZIP HEADS FOR THE TOP OF THE TALLEST', 'TOWER, AND THEN STRAIGHT DOWN THE SIDE OF IT.'],
          course: [[60, 0, 0], [80, -30, 0], [60, 30, 0], [60, 0, 0], [14, 0, -84, 0, { wall: 1 }], [110, 0, 0, 0, { wall: 1, w: 6 }], [16, 0, 84, 0, { wall: 1 }], [80, 0, 0], [60, 40, 0], [60, -40, 0], [30, 0, 0],
            [36, 0, 0, 0, { gap: 1 }], [60, 0, 0], [88, 0, 360, 9], [60, 0, 0], [36, 0, 0, 0, { gap: 1 }], [80, -60, 0], [80, 50, 0], [40, 0, 0], [40, 0, 0, 0, { gap: 1 }], [120, 0, 0]] },
        { id: 'ice', name: 'FROSTBITE PEAK', song: 'ice', w: 5, par: 170, sky: [[0, '#4a7ad8'], [0.42, '#a8c8f0'], [0.52, '#f0f6ff'], [1, '#f0f6ff']], fog: [0xe8f0ff, 140, 520], light: { amb: 0.9, sun: 0.75, sky: 0xffffff, gnd: 0x8aa0c8 },
          critter: 0xe8f0ff, story: ['THE DOCTOR\'S BASE IS UP THE MOUNTAIN.', 'ZIP BORROWS A SNOWBOARD. WHAT COULD', 'POSSIBLY GO WRONG? (AN AVALANCHE.)'],
          course: [[60, 0, 0, 0, { w: 4.2, cave: 1 }], [60, 35, -4, 0, { w: 4.2, cave: 1 }], [60, -35, -4, 0, { w: 4.2, cave: 1 }], [60, 0, 8, 0, { w: 4.2, cave: 1 }], [30, 0, 0], [20, 0, -16, 0, { w: 7, board: 1 }],
            [80, 30, 0, 0, { w: 7 }], [70, -40, 0, 0, { w: 7 }], [12, 0, 28, 0, { w: 7, ramp: 1 }], [30, 0, -28, 0, { gap: 1 }], [70, 40, 0, 0, { w: 7 }], [70, -30, 0, 0, { w: 7 }], [12, 0, 28, 0, { w: 7, ramp: 1 }], [30, 0, -28, 0, { gap: 1 }],
            [90, 25, 0, 0, { w: 7 }], [80, -25, 0, 0, { w: 7 }], [12, 0, 28, 0, { w: 7, ramp: 1 }], [34, 0, -28, 0, { gap: 1 }], [60, 0, 0, 0, { w: 7 }], [24, 0, 16, 0, { w: 7 }], [90, 0, 0, 0, { w: 6 }]] },
        { id: 'casino', name: 'STARLIGHT CASINO', song: 'casino', w: 5, par: 170, lowg: 0.75, sky: [[0, '#02020a'], [0.45, '#0a0a2a'], [0.55, '#2a0a4a'], [1, '#100420']], fog: [0x100420, 200, 650], light: { amb: 0.7, sun: 0.8, sky: 0xffc8ff, gnd: 0x2a1a4a, sunCol: 0xfff0ff },
          critter: 0xffc8ff, story: ['THE DOCTOR\'S SPACE CASINO HANGS OVER THE', 'ISLAND. THE HOUSE ALWAYS WINS, THEY SAY.', 'NOT TONIGHT.'],
          course: [[60, 0, 0], [60, 30, 0], [60, -30, 0], [110, 0, 0, 0, { tw: 360 }], [40, 0, 0], [88, 0, 360, 9], [30, 0, 0], [88, 0, 360, -9], [60, 0, 0], [100, 90, 0, 0, { w: 7 }], [70, 0, 0, 0, { w: 8, bumpers: 1 }], [80, -90, 0, 0, { w: 7 }],
            [40, 0, 0], [36, 0, 0, 0, { gap: 1 }], [60, 0, 10], [60, 0, -10], [110, 0, 0, 0, { tw: -360 }], [80, 0, 0]] },
        { id: 'boss', name: 'THE CHROME CRUSHER', song: 'boss', w: 6, par: 120, ring: true, sky: [[0, '#0a0a1a'], [0.42, '#2a3a6a'], [0.52, '#e88a3a'], [1, '#e88a3a']], fog: [0x3a2a3a, 200, 600], light: { amb: 0.8, sun: 0.9, sky: 0xffe0c0, gnd: 0x3a3a5a, sunCol: 0xffe0b0 },
          critter: 0xffffff, story: ['THE DOCTOR HIMSELF, IN HIS CHROME CRUSHER.', 'RUN ROUND THE RING AND HOMING-ATTACK IT', 'WHEN IT SWOOPS LOW. MIND THE MISSILES!'],
          course: Array.from({ length: 36 }, () => [8, 10, 0]) },
      ];

      // ================================================================ building a stage: road, scenery, things on the course
      let SG_ = null; // the stage's group
      let RINGS = [], BOTS = [], SPRINGS = [], DASH = [], MONS = [], LAMPS = [], RAILS = [], BUMPERS = [], SPIKES = [], RAMPS = [], CRIT = [], GOAL = 0, CHASE = null, BOARD0 = 1e9;
      let ringMesh = null, lostMesh = null;
      const segAt = s => SEGS.find(g => s >= g.s0 && s < g.s1) || SEGS[SEGS.length - 1];
      const ROADTEX = {
        bay: g => { g.fillStyle = '#e8d6a8'; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 8) { g.fillStyle = y % 16 ? '#d8c08a' : '#e6d09c'; g.fillRect(6, y, 52, 7); g.fillStyle = '#a88a5a'; g.fillRect(6, y + 7, 52, 1); g.fillStyle = '#8a6a3a'; g.fillRect(10 + (y * 3) % 40, y + 3, 2, 2); } for (let y = 0; y < 64; y += 8) { g.fillStyle = (y / 8) % 2 ? '#1a5ae0' : '#ffffff'; g.fillRect(0, y, 6, 8); g.fillRect(58, y, 6, 8); } },
        city: g => { g.fillStyle = '#34343e'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 160; i++) { g.fillStyle = i % 2 ? '#3e3e4a' : '#2a2a34'; g.fillRect(Math.random() * 64 | 0, Math.random() * 64 | 0, 2, 2); } g.fillStyle = '#ffd23a'; g.fillRect(30, 4, 4, 24); g.fillStyle = '#e8e8f0'; g.fillRect(2, 0, 3, 64); g.fillRect(59, 0, 3, 64); },
        ice: g => { g.fillStyle = '#e8f4ff'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 40; i++) { g.strokeStyle = i % 2 ? 'rgba(160,200,240,.6)' : 'rgba(255,255,255,.9)'; g.beginPath(); const x = Math.random() * 64; g.moveTo(x, 0); g.lineTo(x + (Math.random() - 0.5) * 10, 64); g.stroke(); } g.fillStyle = '#9ad0ff'; g.fillRect(0, 0, 4, 64); g.fillRect(60, 0, 4, 64); },
        casino: g => { const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, '#5a1a9a'); gr.addColorStop(0.5, '#2a0a5a'); gr.addColorStop(1, '#5a1a9a'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = '#ffd23a'; g.font = 'bold 20px Arial'; g.textAlign = 'center'; g.fillText('♦', 32, 26); g.fillStyle = '#ff3ab0'; g.fillText('♥', 32, 58); g.fillStyle = '#3ae0ff'; g.fillRect(0, 0, 3, 64); g.fillRect(61, 0, 3, 64); },
        boss: g => { g.fillStyle = '#9aa0b0'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#6a7080'; g.lineWidth = 2; g.strokeRect(1, 1, 30, 30); g.strokeRect(33, 33, 30, 30); g.strokeRect(33, 1, 30, 30); g.strokeRect(1, 33, 30, 30); g.fillStyle = '#5a6070'; for (const [x, y] of [[5, 5], [27, 5], [5, 27], [27, 27], [37, 37], [59, 59], [37, 59], [59, 37]]) g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = '#ffd23a'; g.fillRect(0, 0, 4, 64); g.fillRect(60, 0, 4, 64); },
      };
      const KERB = { bay: ['#1a5ae0', '#ffd23a'], city: ['#ff3ab0', '#3ae0ff'], ice: ['#9ad0ff', '#ffffff'], casino: ['#ffd23a', '#ff3ab0'], boss: ['#ffd23a', '#2a2a34'] };
      function disposeStage() { if (!SG_) return; SG_.traverse(o => { if (o.geometry && !o.geometry.userData.persist) o.geometry.dispose(); if (o.isInstancedMesh && o.dispose) o.dispose(); }); T3.scene.remove(SG_); SG_ = null; }
      function buildStage(i) {
        disposeStage(); SG = STAGES[i]; ST = SG; SG_ = new T.Group(); T3.add(SG_); rnd = K.rnd(1014 + i * 77);
        trace(SG.course, SG.w);
        RINGS = []; BOTS = []; SPRINGS = []; DASH = []; MONS = []; LAMPS = []; RAILS = []; BUMPERS = []; SPIKES = []; RAMPS = []; CRIT = []; CHASE = null; BOARD0 = 1e9;
        GOAL = SG.ring ? 1e9 : LEN - 25;
        const f = T3.scene.fog; f.color.setHex(SG.fog[0]); f.near = SG.fog[1]; f.far = SG.fog[2];
        const l = SG.light; LT.hemi.color.setHex(l.sky); LT.hemi.groundColor.setHex(l.gnd); LT.hemi.intensity = l.amb; LT.sun.intensity = l.sun; LT.sun.color.setHex(l.sunCol || 0xffffff);
        // sky
        const sk = new T.Mesh(new T.SphereGeometry(650, 16, 10), mat('sky' + SG.id, { map: tex('sky' + SG.id, 8, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); SG.sky.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); }), lit: false, side: T.BackSide, fog: false }));
        sk.renderOrder = -2; SG_.add(sk); SG_.userData.sky = sk;
        // the road, its kerbs and its underside
        const rt = tex('road' + SG.id, 64, 64, ROADTEX[SG.id]); const roadM = mat('road' + SG.id, { map: rt, side: T.DoubleSide });
        SG_.add(new T.Mesh(ribbon(p => [-p.w - 0.6, 0], p => [p.w + 0.6, 0], 8), roadM));
        const kt = tex('kerb' + SG.id, 16, 16, g => { const [a, b] = KERB[SG.id]; for (let y = 0; y < 16; y += 8) for (let x = 0; x < 16; x += 8) { g.fillStyle = ((x + y) / 8) % 2 ? a : b; g.fillRect(x, y, 8, 8); } });
        const kerbM = mat('kerb' + SG.id, { map: kt, side: T.DoubleSide, emissive: SG.id === 'city' || SG.id === 'casino' ? 0x444444 : 0x000000 });
        SG_.add(new T.Mesh(ribbon(p => [-p.w - 0.6, 0], p => [-p.w - 0.6, 0.8], 2), kerbM)); SG_.add(new T.Mesh(ribbon(p => [p.w + 0.6, 0.8], p => [p.w + 0.6, 0], 2), kerbM));
        SG_.add(new T.Mesh(ribbon(p => [-p.w - 0.6, -0.6], p => [p.w + 0.6, -0.6], 8, true), mat('under' + SG.id, { color: { bay: 0x8a6a42, city: 0x3a3a48, ice: 0x8ab0d8, casino: 0x3a1a5a, boss: 0x5a6070 }[SG.id], side: T.DoubleSide })));
        // the things along the course
        populate();
        scenery();
        objectsBuild();
      }

      // ---- what goes where: a pattern every 30-ish metres, plus each stage's set pieces
      function populate() {
        const ringLine = (s0, u, n, gap, h) => { for (let i = 0; i < n; i++) RINGS.push({ s: s0 + i * (gap || 3), u, h: h || 1.1 }); };
        const ringArc = (s0, u, n, len, top, h0) => { for (let i = 0; i < n; i++) { const f = i / (n - 1); RINGS.push({ s: s0 + f * len, u, h: (h0 || 1.1) + Math.sin(f * Math.PI) * top }); } };
        const bot = (kind, s, u, h) => BOTS.push({ kind, s, u, h: h || (kind === 'bee' ? 3 : 0), alive: true, ph: rnd() * 6, s0: s, u0: u });
        const free = (s0, s1) => { for (let s = s0; s <= s1; s += 2) { const g = segAt(s); if (!g || g.loop || g.tw || isGap(s) || g.ex.ramp) return false; } return true; };
        if (SG.ring) { // the boss arena: rings all round, a few monitors
          for (let s = 0; s < LEN; s += 24) ringLine(s, [-3, 0, 3][(s / 24 | 0) % 3], 4);
          [40, 130, 220].forEach((s, i) => MONS.push({ s, u: [2, -2, 0][i], kind: ['rings', 'shield', 'rings'][i], alive: true }));
          return;
        }
        // set pieces
        for (const g of SEGS) {
          if (g.loop) { for (let s = g.s0 + 6; s < g.s1 - 4; s += 6) RINGS.push({ s, u: 0, h: 1.2 }); }
          if (g.tw) { let k = 0; for (let s = g.s0 + 4; s < g.s1 - 4; s += 5) RINGS.push({ s, u: Math.sin(k++ * 0.6) * 2.5, h: 1.2 }); }
          if (g.ex.gap) { const prev = SEGS[SEGS.indexOf(g) - 1]; if (!(prev && prev.ex.ramp) && !(prev && prev.ex.pier)) { RAILS.push({ s0: g.s0 - 10, s1: g.s1 + 8, u: 0, h: 0.7 }); ringLine(g.s0 - 6, 0, Math.floor((g.s1 - g.s0 + 12) / 4), 4, 2.0); } else { ringArc(g.s0, 0, 9, g.s1 - g.s0, 4, 2); } }
          if (g.ex.ramp) RAMPS.push(g.s1 - 1);
          if (g.ex.bumpers) for (let s = g.s0 + 10, k = 0; s < g.s1 - 6; s += 9, k++) for (const u of (k % 2 ? [-5, 0, 5] : [-2.5, 2.5])) { BUMPERS.push({ s, u }); ringLine(s + 4, u, 1); }
          if (g.ex.board && BOARD0 > 1e8) BOARD0 = g.s0;
          if (g.ex.pier && !CHASE) { const pg = SEGS.filter(x => x.ex.pier); CHASE = { kind: 'whale', s0: g.s0 + 20, s1: pg[pg.length - 1].s1, speed: 30, d: 30, on: false, done: false }; }
        }
        if (BOARD0 < 1e8) CHASE = { kind: 'avalanche', s0: BOARD0 + 30, s1: GOAL - 20, speed: 29, d: 34, on: false, done: false };
        // the rails along the city highway
        if (SG.id === 'city') { for (const g of SEGS) if (!g.loop && !g.ex.gap && !g.ex.wall && g.s1 - g.s0 >= 60 && g.s0 > 200) { RAILS.push({ s0: g.s0 + 8, s1: g.s1 - 8, u: -halfW(g.s0) + 0.6, h: 1.3 }); } }
        // a beat every 30-ish metres
        let k = 0;
        for (let s = 40; s < GOAL - 40; s += 28 + (rnd() * 12 | 0), k++) {
          if (!free(s, s + 22)) continue;
          if (CHASE && s > CHASE.s0 - 10 && s < CHASE.s1) { ringLine(s, [-2, 0, 2][k % 3], 5, 3); if (k % 3 === 1) SPIKES.push({ s: s + 16, u: [2, -2, 0][k % 3] }); continue; }
          if (s > BOARD0 && s < GOAL) { ringLine(s, [-3.5, 0, 3.5][k % 3], 5, 3); if (k % 2) bot('beetle', s + 18, [3, -3][k % 2 ? 1 : 0]); continue; }
          const hw = halfW(s), u = [-hw * 0.55, 0, hw * 0.55][k % 3], pat = (k * 7 + (rnd() * 5 | 0)) % 9;
          if (pat === 0 || pat === 5) { ringLine(s, u, 6); bot('beetle', s + 20, -u * 0.6 || 1.5); }
          else if (pat === 1) { DASH.push({ s, u: 0 }); ringLine(s + 5, 0, 6, 3); }
          else if (pat === 2) { SPRINGS.push({ s, u }); ringArc(s + 3, u, 9, 30, 6, 1.5); bot('bee', s + 16, u, 5.5); }
          else if (pat === 3) { ringLine(s, -u || 2, 5); MONS.push({ s: s + 16, u, kind: ['rings', 'shield', 'shoes', 'rings', 'life'][(k / 3 | 0) % 5], alive: true }); }
          else if (pat === 4) { bot('bee', s + 6, u, 3); bot('bee', s + 13, -u || 2, 3.5); bot('bee', s + 20, u, 3); ringLine(s, 0, 3); }
          else if (pat === 6) { SPIKES.push({ s: s + 10, u: u || 2 }); ringLine(s, -(u || 2), 7); }
          else if (pat === 7) { bot('roller', s + 18, 0); ringLine(s, hw * 0.6, 5); ringLine(s, -hw * 0.6, 5); }
          else { ringArc(s, 0, 8, 22, 3); bot('beetle', s + 22, u); }
        }
        for (let s = 260; s < GOAL - 80; s += 300) { if (!isGap(s) && !segAt(s).loop && !segAt(s).tw) LAMPS.push({ s, on: false }); }
        ringLine(GOAL - 60, 0, 10, 4);
      }

      // ---- scenery for each stage (merged into a handful of meshes)
      function scenery() {
        const P = [], Pb = [], fr = FR();
        const minY = Math.min(...pts.map(p => p.p.y)), maxY = Math.max(...pts.map(p => p.p.y));
        const side = (s, d, sign) => { at(s, 0, 0, fr); const sx = fr.s.x, sz = fr.s.z, l = Math.hypot(sx, sz) || 1; return [fr.p.x + sx / l * d * sign, fr.p.y, fr.p.z + sz / l * d * sign]; };
        const pillars = (c, base) => { for (let s = 10; s < LEN; s += 22) { const pp = ptAt(s); if (pp.loop || pp.twist || pp.gap) continue; at(s, 0, 0, fr); if (fr.u.y < 0.6) continue; const h = fr.p.y - base; if (h > 3) P.push(ptM(S.cyl(8), c, M(fr.p.x, base + h / 2 - 0.6, fr.p.z, 0, 0, 0, 1.4, h, 1.4), 0.4)); } };
        if (SG.id === 'bay' || SG.id === 'boss') {
          const SEA = minY - (SG.id === 'boss' ? 6 : 16), seaT = tex('sea', 64, 64, g => { g.fillStyle = '#1a8ad0'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 60; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.35)' : 'rgba(0,60,140,.3)'; g.fillRect(Math.random() * 64 | 0, Math.random() * 64 | 0, 6 + Math.random() * 8 | 0, 1); } }); seaT.repeat.set(80, 80);
          const sea = new T.Mesh(new T.PlaneGeometry(5000, 5000), mat('sea', { map: seaT, lit: false })); sea.rotation.x = -Math.PI / 2; sea.position.y = SEA; SG_.add(sea); SG_.userData.sea = seaT;
          pillars(0xd8d0c0, SEA);
          const c = pts[LEN >> 1].p;
          for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = 420 + rnd() * 80, h = 60 + rnd() * 80; P.push(ptM(S.cone(7), i % 2 ? 0x5a9a6a : 0x4a8a5a, M(c.x + Math.cos(a) * r, SEA + h / 2 - 4, c.z + Math.sin(a) * r, 0, rnd() * 3, 0, h * 1.4, h, h * 1.2), 0.5)); }
          if (SG.id === 'bay') {
            for (let s = 20; s < LEN; s += 24) for (const sg of [-1, 1]) { if (rnd() < 0.5 || ptAt(s).pier) continue; const [x, , z] = side(s, 22 + rnd() * 30, sg), r = 6 + rnd() * 8; P.push(ptM(S.cyl(12, 0.85), 0xf0dca0, M(x, SEA + 0.6, z, 0, 0, 0, r * 2, 2.4, r * 2), 0.3)); for (let k = 0; k < 1 + (rnd() * 3 | 0); k++) palm(P, x + (rnd() - 0.5) * r, SEA + 1.8, z + (rnd() - 0.5) * r, 7 + rnd() * 5); }
            for (let s = 0; s < LEN; s += 4) { const pp = ptAt(s); if (!pp.pier) continue; at(s, 0, 0, fr); for (const u of [-3.4, 3.4]) { at(s, u, 0, fr); P.push(ptM(S.cyl(6), 0x6a4a2a, M(fr.p.x, (fr.p.y + SEA) / 2, fr.p.z, 0, 0, 0, 0.45, fr.p.y - SEA + 1, 0.45))); } }
            const lh = side(LEN * 0.7, 120, 1); P.push(ptM(S.cyl(12, 0.75), 0xffffff, M(lh[0], SEA + 15, lh[2], 0, 0, 0, 7, 30, 7), 0.2)); Pb.push(ptM(S.cyl(12), 0xfff4a0, M(lh[0], SEA + 31.5, lh[2], 0, 0, 0, 4, 3, 4)));
          } else {
            const c0 = V3(0, 0, 0); for (const p of pts) c0.add(p.p); c0.divideScalar(pts.length);
            P.push(ptM(S.cyl(16, 0.7), 0x6a7080, M(c0.x, SEA + 20, c0.z, 0, 0, 0, 30, 40, 30), 0.4), ptM(S.cyl(16), 0x3a3a48, M(c0.x, SEA + 41, c0.z, 0, 0, 0, 22, 2, 22)), ptM(S.ball(12), 0xc8d0e0, M(c0.x, SEA + 46, c0.z, 0, 0, 0, 14, 10, 14), 0.2));
            Pb.push(ptM(S.box(), 0xff3a1a, M(c0.x, SEA + 44, c0.z + 11.5, 0, 0, 0, 4, 1, 0.2)));
          }
        } else if (SG.id === 'city') {
          const base = minY - 8, winT = tex('windows', 32, 64, g => { g.fillStyle = '#1a1a2a'; g.fillRect(0, 0, 32, 64); for (let y = 2; y < 64; y += 6) for (let x = 2; x < 32; x += 6) { g.fillStyle = Math.random() < 0.55 ? ['#ffe08a', '#a8e0ff', '#ffb0e0'][(Math.random() * 3) | 0] : '#2a2a3a'; g.fillRect(x, y, 4, 3); } });
          const ground = new T.Mesh(new T.PlaneGeometry(4000, 4000), mat('cityground', { color: 0x14141e })); ground.rotation.x = -Math.PI / 2; ground.position.y = base; SG_.add(ground);
          pillars(0x5a5a6a, base);
          const B = [];
          for (let s = 0; s < LEN; s += 18) for (const sg of [-1, 1]) { if (rnd() < 0.25) continue; const pp = ptAt(s); if (pp.loop) continue; const d = 16 + rnd() * 30, [x, y, z] = side(s, d, sg), w = 10 + rnd() * 12, h = Math.max(20, y - base + 10 + rnd() * 60); const b = ptM(S.box(), [0x4a4a6a, 0x5a4a7a, 0x3a4a6a][(rnd() * 3) | 0], M(x, base + h / 2, z, 0, rnd(), 0, w, h, w)); b.uv = 6; B.push(b); if (rnd() < 0.5) Pb.push(ptM(S.box(), [0xff3ab0, 0x3ae0ff, 0xffd23a, 0x7aff7a][(rnd() * 4) | 0], M(x, base + h * (0.5 + rnd() * 0.4), z, 0, rnd(), 0, w + 0.4, 1.2, w + 0.4))); }
          // the skyscraper Zip runs down
          const wg = SEGS.filter(g => g.ex.wall); if (wg.length) { const a = wg[0].s0, b = wg[wg.length - 1].s1; at((a + b) / 2, 0, -4, fr); const top = pts[a].p.y, bot = Math.min(pts[b].p.y, base); const tw = SG_.userData; const bb = ptM(S.box(), 0x5a5a7a, M(fr.p.x - fr.u.x * 6, (top + base) / 2, fr.p.z - fr.u.z * 6, 0, Math.atan2(fr.s.x, fr.s.z) + Math.PI / 2, 0, 18, top - base + 6, 18)); bb.uv = 6; B.push(bb); }
          SG_.add(new T.Mesh(merge(B, 6), mat('bld', { vcol: true, map: winT, emissive: 0x222233 })));
          const st = []; for (let i = 0; i < 120; i++) { const a = rnd() * TAU, e = 0.2 + rnd() * 1.1; st.push(ptM(S.box(), 0xffffff, M(Math.cos(a) * Math.cos(e) * 600, Math.sin(e) * 600, Math.sin(a) * Math.cos(e) * 600, 0, 0, 0, 2, 2, 2))); }
          st.push(ptM(S.ball(16), 0xfff4d0, M(-200, 300, -400, 0, 0, 0, 50, 50, 50))); SG_.add(new T.Mesh(merge(st), mat('stars', { vcol: true, lit: false, fog: false })));
        } else if (SG.id === 'ice') {
          const base = minY - 30;
          for (let i = 0; i < 14; i++) { const c = pts[(LEN * i / 14) | 0].p, a = rnd() * TAU, r = 260 + rnd() * 120, h = 120 + rnd() * 120; P.push(ptM(S.cone(7), i % 2 ? 0xe8f0ff : 0xc8d8f0, M(c.x + Math.cos(a) * r, base + h / 2, c.z + Math.sin(a) * r, 0, rnd() * 3, 0, h * 1.2, h, h), 0.5)); }
          // the cave: an ice tube over the first stretch, crystals
          SG_.add(new T.Mesh(ribbon(p => [-p.w - 0.6, 0.8], p => [-p.w - 2.6, 5], 6, false, (i, p) => i < (BOARD0 > 1e8 ? 0 : BOARD0 - 30)), mat('cave', { map: tex('icewall', 32, 32, g => { g.fillStyle = '#8ac8f0'; g.fillRect(0, 0, 32, 32); for (let i = 0; i < 12; i++) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(Math.random() * 32, 0); g.lineTo(Math.random() * 32, 32); g.stroke(); } }), side: T.DoubleSide, emissive: 0x1a3a5a })));
          SG_.add(new T.Mesh(ribbon(p => [p.w + 2.6, 5], p => [p.w + 0.6, 0.8], 6, false, (i, p) => i < (BOARD0 > 1e8 ? 0 : BOARD0 - 30)), mat('cave')));
          SG_.add(new T.Mesh(ribbon(p => [-p.w - 2.6, 5], p => [p.w + 2.6, 5], 6, true, (i, p) => i < (BOARD0 > 1e8 ? 0 : BOARD0 - 30)), mat('cave')));
          for (let s = 6; s < BOARD0 - 30; s += 7) for (const sg of [-1, 1]) { at(s, sg * (halfW(s) + 1.6), 0.5, fr); Pb.push(ptM(S.oct(), [0x7ad8ff, 0xb0f0ff, 0xc8b0ff][(rnd() * 3) | 0], M(fr.p.x, fr.p.y + rnd() * 2, fr.p.z, rnd(), rnd(), rnd(), 0.8, 2 + rnd() * 2, 0.8))); }
          // the snowfield under the snowboard run, and pine trees
          SG_.add(new T.Mesh(ribbon(p => [-30, -0.3], p => [30, -0.3], 10, false, (i, p) => i >= BOARD0 - 4), mat('snowfield', { color: 0xf4f8ff })));
          for (let s = BOARD0; s < LEN; s += 9) for (const sg of [-1, 1]) { if (rnd() < 0.4) continue; at(s, sg * (halfW(s) + 4 + rnd() * 20), 0, fr); const h = 5 + rnd() * 5; P.push(ptM(S.cyl(6), 0x6a4a2a, M(fr.p.x, fr.p.y + 0.8, fr.p.z, 0, 0, 0, 0.6, 1.8, 0.6))); for (let q = 0; q < 3; q++) P.push(ptM(S.cone(8), q === 2 ? 0xf4f8ff : 0x2a6a4a, M(fr.p.x, fr.p.y + h * (0.35 + q * 0.22), fr.p.z, 0, q, 0, h * (0.6 - q * 0.15), h * 0.42, h * (0.6 - q * 0.15)), 0.4)); }
        } else if (SG.id === 'casino') {
          const st = []; for (let i = 0; i < 260; i++) { const a = rnd() * TAU, e = (rnd() - 0.3) * 1.5; st.push(ptM(S.box(), [0xffffff, 0xffd0ff, 0xd0e0ff][i % 3], M(Math.cos(a) * Math.cos(e) * 600, Math.sin(e) * 600, Math.sin(a) * Math.cos(e) * 600, 0, 0, 0, 2.2, 2.2, 2.2))); }
          st.push(ptM(S.ball(20), 0xe88a3a, M(300, 120, -400, 0, 0, 0, 120, 120, 120), 0.5), ptM(S.tor(0.06, 40), 0xffd8a0, M(300, 120, -400, 1.2, 0, 0.3, 230, 230, 230)), ptM(S.ball(16), 0x5ab0ff, M(-350, -80, -200, 0, 0, 0, 60, 60, 60), 0.5));
          SG_.add(new T.Mesh(merge(st), mat('space', { vcol: true, lit: false, fog: false })));
          for (let s = 15; s < LEN; s += 24) for (const sg of [-1, 1]) { if (rnd() < 0.35) continue; const [x, y, z] = side(s, 18 + rnd() * 26, sg), k = (rnd() * 3) | 0, yy = y + (rnd() - 0.5) * 30;
            if (k === 0) { P.push(ptM(S.box(), 0xffffff, M(x, yy, z, rnd(), rnd(), rnd(), 6, 6, 6), 0.2)); for (let d = 0; d < 3; d++) Pb.push(ptM(S.ball(6), 0x1a1a22, M(x + (d - 1) * 1.6, yy + 3.05, z + (d - 1) * 1.6, 0, 0, 0, 1, 0.3, 1))); }
            else if (k === 1) { const c = [0xe02828, 0x2a5ae0, 0x1aa04a][(rnd() * 3) | 0]; P.push(ptM(S.cyl(16), c, M(x, yy, z, rnd(), 0, rnd(), 8, 1.2, 8), 0.3), ptM(S.cyl(16), 0xffffff, M(x, yy, z, 0, 0, 0, 5, 1.3, 5))); }
            else Pb.push(ptM(S.box(), [0xff3ab0, 0x3ae0ff, 0xffd23a][(rnd() * 3) | 0], M(x, yy, z, 0, rnd() * 3, 0, 4, 10, 0.4))); }
        }
        if (P.length) SG_.add(new T.Mesh(merge(P), matV()));
        if (Pb.length) SG_.add(new T.Mesh(merge(Pb), matVB()));
      }
      function palm(P, x, y, z, h) {
        for (let i = 0; i < 5; i++) { const f = i / 5; P.push(ptM(S.cyl(7, 0.85), 0x9a6a3a, M(x + f * f * 1.5, y + f * h + h / 10, z, 0, 0, -0.15, 0.7 - f * 0.25, h / 5 + 0.1, 0.7 - f * 0.25), 0.3)); }
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; P.push(ptM(S.box(), i % 2 ? 0x2aa83a : 0x3ac04a, M(x + 1.5 + Math.cos(a) * 2, y + h + 0.2, z + Math.sin(a) * 2, 0, -a, 0.4, 4.2, 0.15, 1.2), 0.3)); }
      }

      // ---- the objects: rings (instanced), robots, monitors, springs, lamps, rails, the goal, the chaser
      function objectsBuild() {
        const fr = FR();
        for (const r of RINGS) { at(r.s, r.u, r.h, fr); r.pos = fr.p.clone(); r.got = false; }
        const ringGeo = new T.TorusGeometry(0.55, 0.12, 8, 16);
        ringMesh = new T.InstancedMesh(ringGeo, mat('ring', { color: 0xffc81a, emissive: 0x8a5a00 }), Math.max(1, RINGS.length)); ringMesh.frustumCulled = false; SG_.add(ringMesh);
        lostMesh = new T.InstancedMesh(ringGeo, mat('ring'), 20); lostMesh.frustumCulled = false; SG_.add(lostMesh);
        for (const b of BOTS) { b.m = new T.Mesh(model(b.kind), shiny()); b.m.scale.setScalar(b.kind === 'roller' ? 0.9 : 0.85); if (b.kind === 'bee') { const w = new T.Mesh(model('wings'), mat('wing', { vcol: true, transparent: true, opacity: 0.7 })); b.m.add(w); b.w = w; } at(b.s, b.u, b.h, fr); orient(b.m, fr); b.m.rotateY(Math.PI); SG_.add(b.m); }
        for (const m of MONS) { m.m = new T.Mesh(monModel(m.kind), shiny()); at(m.s, m.u, 0, fr); orient(m.m, fr); m.m.rotateY(Math.PI); SG_.add(m.m); }
        for (const sp of SPRINGS) { const g = new T.Group(); g.add(new T.Mesh(model('spring'), shiny())); const top = new T.Mesh(model('springtop'), shiny()); top.position.y = 1.0; g.add(top); sp.top = top; at(sp.s, sp.u, 0, fr); orient(g, fr); SG_.add(g); }
        for (const L_ of LAMPS) { at(L_.s, halfW(L_.s) + 0.2, 0, fr); L_.m = new T.Mesh(model('lamp'), shiny()); orient(L_.m, fr); SG_.add(L_.m); }
        const flat = [], dashT = tex('dash', 32, 32, g => { g.fillStyle = '#ff3a1a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#ffe04a'; for (const y of [4, 16]) { g.beginPath(); g.moveTo(4, y + 10); g.lineTo(16, y); g.lineTo(28, y + 10); g.lineTo(22, y + 10); g.lineTo(16, y + 5); g.lineTo(10, y + 10); g.closePath(); g.fill(); } });
        for (const d of DASH) { const pp = ptM(new T.PlaneGeometry(3.4, 3.4), 0xffffff, mtxAt(d.s, d.u, 0.07).multiply(new T.Matrix4().makeRotationX(-Math.PI / 2))); flat.push(pp); }
        if (flat.length) SG_.add(new T.Mesh(merge(flat, 'own'), mat('dashpad', { map: dashT, lit: false })));
        const stat = [];
        for (const sp of SPIKES) stat.push(ptM(model('spikes'), 0xffffff, mtxAt(sp.s, sp.u, 0)));
        for (const b of BUMPERS) stat.push(ptM(model('bumper'), 0xffffff, mtxAt(b.s, b.u, 0)));
        for (const r of RAILS) for (let s = r.s0; s < r.s1; s += 2) { const a = at(s, r.u, r.h, FR()), b = at(Math.min(r.s1, s + 2), r.u, r.h, FR()), mid = a.p.clone().add(b.p).multiplyScalar(0.5), len = a.p.distanceTo(b.p) + 0.05; const q = new T.Quaternion().setFromUnitVectors(V3(0, 1, 0), b.p.clone().sub(a.p).normalize()); stat.push(ptM(S.cyl(8), 0xc8d0e0, new T.Matrix4().compose(mid, q, V3(0.22, len, 0.22)))); if (((s - r.s0) | 0) % 8 === 0) { const f2 = at(s, r.u, 0, FR()); stat.push(ptM(S.cyl(6), 0x5a5a6a, new T.Matrix4().compose(f2.p.clone().addScaledVector(f2.u, r.h / 2), new T.Quaternion().setFromUnitVectors(V3(0, 1, 0), f2.u), V3(0.12, r.h, 0.12)))); } }
        for (const s of RAMPS) { stat.push(ptM(S.box(), 0xffd23a, mtxAt(s - 2, 0, 0.05, halfW(s) * 2, 0.1, 1))); }
        if (stat.length) { const ms = merge(stat); SG_.add(new T.Mesh(ms, shiny())); }
        // the goal sign
        if (!SG.ring) { at(GOAL, 0, 0, fr); const g = new T.Group(); for (const x of [-halfW(GOAL) - 0.6, halfW(GOAL) + 0.6]) { const p = new T.Mesh(S.cyl(8), mat('goalpole', { color: 0x3a3a48 })); p.scale.set(0.5, 7, 0.5); p.position.set(x, 3.5, 0); g.add(p); }
          const gt = tex('goal', 128, 64, x => { const gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#3a8aff'); gr.addColorStop(1, '#1a3ab0'); x.fillStyle = gr; x.fillRect(0, 0, 128, 64); x.strokeStyle = '#ffd23a'; x.lineWidth = 6; x.strokeRect(3, 3, 122, 58); x.fillStyle = '#ffd23a'; x.font = 'italic 900 36px Arial Black,Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('GOAL', 64, 34); });
          const sign = new T.Mesh(new T.BoxGeometry(7, 3.4, 0.4), mat('goalsign', { map: gt, emissive: 0x222222 })); sign.position.y = 7.4; g.add(sign); orient(g, fr); SG_.add(g); SG_.userData.goal = sign; }
        // the chaser
        if (CHASE) { CHASE.m = new T.Mesh(CHASE.kind === 'whale' ? whaleModel() : avalancheModel(), CHASE.kind === 'whale' ? shiny() : matV()); CHASE.m.visible = false; SG_.add(CHASE.m); }
        if (SG.ring) bossBuild();
        critBuild();
      }
      function monModel(kind) {
        const key = 'mon_' + kind; if (MOD[key]) return MOD[key];
        const c = { rings: 0xffd23a, shield: 0x3aa0ff, shoes: 0xff3a3a, life: 0x2050d8 }[kind];
        const P = [pt(S.box(), 0xd8d8e0, 0, 0.75, 0, 1.3, 1.3, 1.1, 0, 0, 0, 0.3), pt(S.box(), 0x1a2a3a, 0, 0.8, -0.56, 1.0, 0.9, 0.04), pt(S.box(), 0x8a8a96, 0, 0.07, 0, 1.0, 0.14, 0.8)];
        if (kind === 'rings') P.push(pt(S.tor(0.12, 14), c, 0, 0.8, -0.6, 0.6, 0.6, 0.4)); else if (kind === 'shield') P.push(pt(S.ball(10), c, 0, 0.8, -0.58, 0.6, 0.6, 0.1)); else if (kind === 'shoes') P.push(pt(S.ball(10), c, 0, 0.75, -0.58, 0.6, 0.35, 0.1), pt(S.box(), 0xffffff, 0, 0.8, -0.6, 0.6, 0.08, 0.05)); else P.push(pt(S.ball(10), c, 0, 0.82, -0.58, 0.55, 0.55, 0.1), pt(S.ball(8), PE, 0, 0.72, -0.62, 0.3, 0.22, 0.06));
        const g = merge(P); g.userData.persist = true; T3.keep(g); return (MOD[key] = g);
      }
      function whaleModel() {
        if (MOD.whale) return MOD.whale;
        const P = [pt(S.ball(20), 0x2a4a8a, 0, 6, 0, 13, 11, 26, 0, 0, 0, 0.25), pt(S.ball(16), 0xd8e0f0, 0, 3.4, -4, 11, 6, 20), pt(S.box(), 0x1a1a2a, 0, 4.6, -12.6, 9, 0.6, 2.4),
          ...[-1, 1].flatMap(s => [pt(S.ball(10), 0xffffff, s * 3.8, 8.2, -9.6, 2.6, 2.6, 1.4), pt(S.ball(8), 0xff2a1a, s * 3.8, 8.2, -10.3, 1.3, 1.3, 0.6), pt(S.box(), 0x1a1a2a, s * 3.6, 9.6, -10.2, 3.2, 0.5, 0.4, 0, 0, s * 0.3), pt(S.ball(10), 0x2a4a8a, s * 7, 3, -2, 6, 1, 3, 0, 0.4 * s, s * 0.5)]),
          ...[-3, -1, 1, 3].map(x => pt(S.cone(4), 0xffffff, x * 1.0, 3.9, -12.2, 0.6, 1.0, 0.4, Math.PI)), pt(S.box(), 0x2a4a8a, 0, 7, 14, 3, 2, 8), pt(S.box(), 0x2a4a8a, 0, 7.6, 18, 12, 0.8, 4),
          ...[[-3, 10, 2], [3, 10, 2], [0, 11.5, -2], [-4.5, 8, 7], [4.5, 8, 7]].map(([x, y, z]) => pt(S.ball(6), 0xc8c8d0, x, y, z, 0.7, 0.7, 0.7)), pt(S.cyl(8), 0x8a8a96, 0, 11.6, 3, 1.2, 1.4, 1.2), pt(S.tor(0.2, 12), 0xc8c8d0, 0, 12.6, 3, 2.4, 2.4, 2.4, 0, Math.PI / 2, 0)];
        const g = merge(P); g.userData.persist = true; T3.keep(g); return (MOD.whale = g);
      }
      function avalancheModel() {
        if (MOD.aval) return MOD.aval;
        const P = []; for (let i = 0; i < 26; i++) P.push(pt(S.ball(10), i % 3 ? 0xf8fbff : 0xd8e4f8, (i % 9 - 4) * 3.4 + (rnd() - 0.5) * 2, 2 + (i / 9 | 0) * 3.5 + rnd() * 2, rnd() * 3, 6 + rnd() * 4, 5 + rnd() * 4, 6 + rnd() * 3, 0, 0, 0, 0.2));
        const g = merge(P); g.userData.persist = true; T3.keep(g); return (MOD.aval = g);
      }

      // ================================================================ the boss: the Doctor's CHROME CRUSHER
      const BOSS = { on: false, st: 'circle', s: 0, u: 0, h: 14, hp: 6, t: 0, inv: 0, m: null, miss: [], mm: [], marks: [] };
      function bossBuild() {
        const P = [pt(S.ball(20), 0xc8d0e0, 0, 0, 0, 5, 3.4, 5, 0, 0, 0, 0.3), pt(S.cyl(20), 0x5a6070, 0, -0.6, 0, 6.4, 1, 6.4), pt(S.ball(16), 0x9ad8ff, 0, 1.6, -0.8, 2.6, 2.2, 2.6),
          pt(S.ball(12), 0xf4c890, 0, 1.6, -0.8, 1.3, 1.4, 1.3), pt(S.box(), 0x8a3a1a, 0, 1.4, -1.45, 0.9, 0.18, 0.1), pt(S.ball(8), 0xffffff, 0.25, 1.85, -1.4, 0.32, 0.32, 0.2), pt(S.ball(8), 0xffffff, -0.25, 1.85, -1.4, 0.32, 0.32, 0.2), pt(S.ball(6), 0xe8e8f0, 0, 2.2, -0.8, 1.32, 0.6, 1.32),
          ...[0, 1, 2, 3].map(i => pt(S.cyl(8), 0xe02828, Math.cos(i * TAU / 4 + 0.785) * 3.1, -1.2, Math.sin(i * TAU / 4 + 0.785) * 3.1, 0.9, 1.2, 0.9)), pt(S.box(), 0xffd23a, 0, -0.1, -2.5, 3, 0.4, 0.3),
          ...[-1, 1].map(s => pt(S.box(), 0x8a8a96, s * 3.2, 0, 0, 1.4, 0.4, 2.6)), pt(S.cone(12), 0x5a6070, 0, -1.7, 0, 1.6, 1.2, 1.6, Math.PI)];
        BOSS.m = new T.Mesh(merge(P), shiny()); BOSS.m.scale.setScalar(0.85); SG_.add(BOSS.m);
        BOSS.mm = [0, 1, 2].map(() => { const m = new T.Mesh(merge([pt(S.cyl(8), 0xd8d8e0, 0, 0, 0, 0.5, 1.6, 0.5, 0, 0, 0, 0.3), pt(S.cone(8), 0xe02828, 0, 1.0, 0, 0.5, 0.5, 0.5)]), shiny()); m.visible = false; SG_.add(m); return m; });
        BOSS.marks = [0, 1, 2].map(() => { const m = new T.Mesh(new T.RingGeometry(1.6, 2.3, 24), mat('mark', { color: 0xff2a1a, lit: false, transparent: true, opacity: 0.8, side: T.DoubleSide })); m.visible = false; SG_.add(m); return m; });
        Object.assign(BOSS, { on: true, st: 'circle', t: 0, hp: 6, inv: 0, miss: [] });
      }
      function bossUpdate(dt) {
        if (!BOSS.on) return;
        const B = BOSS; B.t += dt; if (B.inv > 0) B.inv -= dt;
        const tgt = st => { B.st = st; B.t = 0; };
        if (B.st === 'circle') { B.s = Pz.s + 34; B.u += (Math.sin(K.t) * 3 - B.u) * dt; B.h += (13 - B.h) * dt * 2; if (B.t > 3.5 - (6 - B.hp) * 0.25) tgt(B.hp % 2 ? 'missiles' : 'swoop'); }
        else if (B.st === 'swoop') { B.s = Pz.s + 22 - Math.min(B.t, 1.4) * 6; B.h += (2.6 - B.h) * dt * 4; if (B.t > 3.2) tgt('rise'); }
        else if (B.st === 'rise') { B.s = Pz.s + 26; B.h += (14 - B.h) * dt * 3; if (B.t > 1) tgt('circle'); }
        else if (B.st === 'missiles') {
          B.s = Pz.s + 30; B.h += (12 - B.h) * dt * 2;
          if (B.t > 0.3 && !B.miss.length) { for (let i = 0; i < 3; i++) B.miss.push({ s: Pz.s + 26 + i * 9, u: clamp(Pz.u + (i - 1) * 2.5, -5, 5), t: 0, done: false }); K.sfx.tone(300, 0.4, 'sawtooth', 0.06, 0, 900); }
          if (B.t > 2.6) { B.miss = []; tgt(B.hp <= 3 ? 'swoop' : 'circle'); }
        } else if (B.st === 'hit') { B.h += (16 - B.h) * dt * 3; B.s = Pz.s + 30; if (B.t > 1.2) tgt(B.hp <= 0 ? 'dead' : 'circle'); }
        else if (B.st === 'dead') { B.h -= dt * 6; B.s = Pz.s + 30; if ((K.frame & 3) === 0) { at(B.s, B.u, B.h, fr2); burst(fr2.p, [0xffd23a, 0xff6a1a, 0xffffff, 0x5a5a5a], 8, 14); K.sfx.noise(0.3, 0.12, 900); } if (B.t > 2.6) { B.on = false; B.m.visible = false; bossBeaten(); return; } }
        B.miss.forEach((q, i) => { q.t += dt; const mk = B.marks[i], mm = B.mm[i]; at(q.s, q.u, 0.08, fr2); mk.visible = !q.done; orient(mk, fr2); mk.rotateX(Math.PI / 2); mk.scale.setScalar(1 + Math.sin(K.t * 12) * 0.08);
          const k = clamp(q.t / 1.6, 0, 1); at(lerp(B.s, q.s, k), lerp(B.u, q.u, k), lerp(B.h, 0, k) + Math.sin(k * Math.PI) * 6, fr2); mm.visible = !q.done; mm.position.copy(fr2.p);
          if (!q.done && q.t >= 1.6) { q.done = true; mm.visible = false; mk.visible = false; at(q.s, q.u, 0.5, fr2); burst(fr2.p, [0xffa82a, 0xff3a1a, 0x5a5a5a], 18, 10); K.sfx.noise(0.5, 0.18, 700); shake = Math.max(shake, 0.3); if (Math.abs(dS(Pz.s, q.s)) < 2.6 && Math.abs(Pz.u - q.u) < 2.6 && Pz.h < 2) hurt(); } });
        for (let i = B.miss.length; i < 3; i++) { B.mm[i].visible = false; B.marks[i].visible = false; }
        at(B.s, B.u, B.h, fr2); B.m.position.copy(fr2.p); orient(B.m, fr2, fr2.p); B.m.rotateY(Math.PI); B.m.rotateZ(Math.sin(K.t * 2) * 0.12);
        B.m.visible = B.st !== 'hit' || (B.t * 14 | 0) % 2 === 0;
        // touching it: from above or homing in is a hit, anything else hurts
        if (B.st !== 'dead' && B.inv <= 0 && Math.abs(dS(Pz.s, B.s)) < 3.6 && Math.abs(Pz.u - B.u) < 4 && Math.abs(Pz.h - B.h) < 3) {
          if (Pz.homing === B || (Pz.air && Pz.h > B.h + 0.5) || Pz.roll > 0) bossHit(); else hurt();
        }
      }
      function bossHit() { const B = BOSS; B.hp--; B.inv = 1.4; B.st = 'hit'; B.t = 0; Pz.homing = null; Pz.vh = 14; Pz.air = true; Pz.airJ = true; score += 500; shake = 0.4; flash = 0.25; at(B.s, B.u, B.h, fr2); burst(fr2.p, [0xffd23a, 0xffffff, 0x9ad8ff], 22, 12); K.sfx.tone(140, 0.5, 'square', 0.1, 0, 60); K.sfx.noise(0.3, 0.15, 1500); say(B.hp > 0 ? ['', 'CURSES!', 'MY BEAUTIFUL MACHINE!', 'STOP THAT!', 'OUCH! MY CHROME!', 'GRR!'][B.hp] : 'NOOOOOO!', 1.4); }
      const fr2 = FR();
      const dS = (a, b) => { let d = a - b; if (SG && SG.ring) d = ((d + LEN / 2) % LEN + LEN) % LEN - LEN / 2; return d; };

      // ================================================================ Zip on the course
      const Pz = { s: 2, u: 0, h: 0, vh: 0, v: 0, us: 0, air: false, airJ: false, homing: null, inv: 0, hurt: 0, run: 0, dead: 0, roll: 0, charge: 0, charging: false, grind: null, shield: false, shoes: 0, trick: 0, tricks: 0, fall: false, ramp: false, lastS: 0 };
      let score = 0, rings = 0, lives = 3, lvT = 0, check = 2, chain = 0, msg = '', msgT = 0, flash = 0, shake = 0, LOST = [], stageScore0 = 0, critN = 0, animals = 0;
      const say = (s, t) => { msg = s; msgT = t || 1.6; };
      function resetZip(s) { Object.assign(Pz, { s, u: 0, h: 0, vh: 0, v: 0, us: 0, air: false, airJ: false, homing: null, inv: 1.2, hurt: 0, dead: 0, roll: 0, charge: 0, charging: false, grind: null, trick: 0, tricks: 0, fall: false, lastS: s }); camInit = false; if (CHASE && !CHASE.done) { CHASE.on = false; CHASE.d = 30; CHASE.m.visible = false; } }
      const fx = { ding: () => { K.sfx.tone(1568, 0.06, 'square', 0.05); K.sfx.tone(2093, 0.12, 'square', 0.05, 0.05); } };
      function hurt() {
        if (Pz.inv > 0 || Pz.dead > 0 || mode !== 'play' || demo) return;
        if (Pz.shield) { Pz.shield = false; Pz.inv = 1.4; Pz.vh = 9; Pz.air = true; K.sfx.noise(0.3, 0.12, 2500); return; }
        if (rings > 0) {
          const n = Math.min(16, rings); rings = 0; Pz.inv = 2; Pz.hurt = 0.5; Pz.v *= 0.35; Pz.air = true; Pz.vh = 9; Pz.grind = null; Pz.homing = null;
          LOST = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; LOST.push({ s: Pz.s, u: Pz.u, h: Pz.h + 1, vs: Math.cos(a) * 7 + Pz.v * 0.2, vu: Math.sin(a) * 6, vh: 6 + Math.random() * 5, t: 0 }); }
          K.sfx.noise(0.3, 0.12, 3000, 0, 'highpass'); for (let i = 0; i < 6; i++) K.sfx.tone(1400 + Math.random() * 800, 0.05, 'square', 0.04, i * 0.05);
        } else die();
      }
      function die(fall) {
        if (Pz.dead > 0) return;
        Pz.dead = 2; lives--; Pz.v = 0; Pz.grind = null; Pz.homing = null; Pz.fall = !!fall; if (!fall) { Pz.air = true; Pz.vh = 14; } say(fall ? 'WHOOPS!' : 'OUCH!', 1.4); K.music(null);
        K.sfx.seq([[72, 0.25], [67, 0.25], [64, 0.25], [60, 1]], { bpm: 260, vol: 0.09, wave: 'triangle' });
      }
      function popBot(b) {
        b.alive = false; b.m.visible = false; chain = Pz.air ? chain + 1 : 1; const pts_ = [100, 200, 400, 800, 1000][Math.min(4, chain - 1)]; score += pts_; animals++;
        at(b.s, b.u, b.h + 1, fr2); burst(fr2.p, [0xff6a3a, 0xffd23a, 0xffffff], 14, 9); K.sfx.noise(0.25, 0.15, 1200); K.sfx.tone(220, 0.15, 'square', 0.06, 0, 880);
        freeCritter(b); if (chain > 1) say(pts_ + '!', 0.9);
      }
      function hitMon(m) { m.alive = false; m.m.visible = false; at(m.s, m.u, 1, fr2); burst(fr2.p, [0xffffff, 0xc8c8d0], 12, 7); K.sfx.noise(0.2, 0.12, 2200);
        if (m.kind === 'rings') { rings += 10; score += 100; for (let i = 0; i < 4; i++) fx.ding(); say('10 RINGS!', 1); } else if (m.kind === 'shield') { Pz.shield = true; say('SHIELD!', 1); K.sfx.tone(600, 0.4, 'sine', 0.08, 0, 1200); } else if (m.kind === 'shoes') { Pz.shoes = 12; say('SPEED SHOES!', 1); K.sfx.tone(400, 0.4, 'square', 0.06, 0, 1600); } else { lives++; K.sfx.seq([[76, 0.25], [79, 0.25], [88, 0.25], [84, 0.25], [86, 0.25], [91, 0.5]], { bpm: 340, vol: 0.09 }); say('1-UP!', 1.2); } }
      // freed critters hop away and go to the garden
      const CRITM = [];
      function critBuild() { CRITM.length = 0; for (let i = 0; i < 6; i++) { const m = new T.Mesh(model('critter'), mat('crit', { color: SG.critter, emissive: 0x222222 })); m.visible = false; SG_.add(m); CRITM.push({ m, t: 0, s: 0, u: 0, h: 0 }); } }
      function freeCritter(b) { const c = CRITM[critN++ % CRITM.length]; Object.assign(c, { t: 1.4, s: b.s, u: b.u, h: b.h + 0.5 }); c.m.visible = true; }
      function critUpdate(dt) { for (const c of CRITM) { if (c.t <= 0) continue; c.t -= dt; c.u += dt * 3 * Math.sign(c.u || 1); c.h = 0.5 + Math.abs(Math.sin(c.t * 9)) * 1.4; at(c.s, c.u, c.h, fr2); c.m.position.copy(fr2.p); c.m.rotation.y += dt * 4; if (c.t <= 0) c.m.visible = false; } }

      function targetFor() {
        let best = null, bd = 1e9;
        for (const b of BOTS) if (b.alive) { const d = b.s - Pz.s; if (d > -1 && d < 26 && Math.abs(b.u - Pz.u) < 8) { const dd = d + Math.abs(b.u - Pz.u) * 0.7 + Math.abs(b.h - Pz.h) * 0.3; if (dd < bd) { bd = dd; best = b; } } }
        for (const m of MONS) if (m.alive) { const d = m.s - Pz.s; if (d > -1 && d < 20 && Math.abs(m.u - Pz.u) < 6) { const dd = d + Math.abs(m.u - Pz.u); if (dd < bd) { bd = dd; best = m; m.h = 0.6; } } }
        if (BOSS.on && BOSS.inv <= 0 && (BOSS.st === 'swoop' || BOSS.h < 6)) { const d = dS(BOSS.s, Pz.s); if (d > -1 && d < 30) best = BOSS; }
        return best;
      }
      function stepZip(dt, IN) {
        const B = Pz;
        if (B.inv > 0) B.inv -= dt; if (B.hurt > 0) B.hurt -= dt; if (B.shoes > 0) B.shoes -= dt;
        if (B.dead > 0) {
          B.dead -= dt; if (!B.fall) { B.vh -= 30 * dt; B.h += B.vh * dt; } else { B.vh -= 30 * dt; B.h += B.vh * dt; }
          if (B.dead <= 0) { if (lives < 0) { lives = 0; return gameOver(); } rings = 0; resetZip(check); music(SG.song); }
          return;
        }
        const fr = at(B.s, 0, 0, frZ), slope = fr.t.y, seg = segAt(B.s), inLoop = seg.loop || seg.tw, board = B.s >= BOARD0, g = SG.lowg || 1;
        let sx = IN.x; if (camFront) sx = -sx;
        // speed
        const vMax = (B.shoes > 0 ? 44 : 34) + (IN.y < -0.3 ? 4 : 0) + (board ? 10 : 0);
        if (B.grind) { B.v -= 26 * slope * dt; B.v = Math.max(B.v, 22); if ((K.frame & 1) === 0) { at(B.s, B.u, B.h, fr2); burst(fr2.p, [0xffe04a, 0xffffff], 2, 3, { life: 0.3 }); } if ((K.frame % 6) === 0) K.sfx.noise(0.05, 0.03, 4000, 0, 'highpass'); }
        else if (!B.air || inLoop) {
          B.v -= 26 * slope * dt * (board ? 1.3 : 1);
          if (IN.y > 0.3 && !B.charging) B.v -= (board ? 14 : 30) * dt;
          else if (B.charging) B.v -= 30 * dt;
          else if (B.v < vMax) B.v += (B.v < 0 ? 30 : board ? 10 : 16) * dt;
          else B.v -= Math.min(B.v - vMax, 8 * dt);
          if (!inLoop && B.v < 4 && IN.y <= 0.3 && !B.charging) B.v = Math.max(B.v, 4);
        }
        if (B.v > 70) B.v = 70;
        // steering
        const steer = sx * (board ? 16 + Math.min(B.v, 40) * 0.3 : 12 + Math.min(B.v, 40) * 0.25);
        if (!B.grind) { B.us += (steer - B.us) * Math.min(1, dt * (board ? 6 : 10)); B.u += B.us * dt; }
        const hw = halfW(B.s); if (!isGap(B.s) && Math.abs(B.u) > hw) { B.u = Math.sign(B.u) * hw; B.us = 0; }
        // homing in
        const s0 = B.s;
        if (B.homing) {
          const T_ = B.homing, k = Math.min(1, dt * 14), th = T_ === BOSS ? BOSS.h : (T_.h || 0) + 0.4;
          B.s += dS(T_.s, B.s) * k + B.v * dt * 0.2; B.u += (T_.u - B.u) * k; B.h += (th - B.h) * k;
          if (Math.abs(dS(T_.s, B.s)) < 1.4 && Math.abs(T_.u - B.u) < 1.4 && Math.abs(th - B.h) < 1.6) {
            if (T_ === BOSS) bossHit(); else if (T_.kind && MONS.includes(T_)) { hitMon(T_); B.homing = null; B.vh = 11; B.airJ = true; } else { popBot(T_); B.homing = null; B.vh = 11; B.airJ = true; }
          } else if ((T_ !== BOSS && !T_.alive) || B.hTime > 0.8) B.homing = null;
          B.hTime = (B.hTime || 0) + dt;
        } else B.s += B.v * dt;
        if (!SG.ring && B.s < 1) { B.s = 1; B.v = Math.max(0, B.v); }
        // jump, homing attack, air dash, tricks
        if (IN.a) {
          if (B.grind) { B.grind = null; B.air = true; B.vh = 13; B.airJ = true; K.sfx.tone(300, 0.15, 'square', 0.06, 0, 900); }
          else if (!B.air) { B.air = true; B.vh = 13.5; B.airJ = true; B.charging = false; B.charge = 0; K.sfx.tone(300, 0.15, 'square', 0.06, 0, 900); }
          else if (B.ramp && B.tricks < 3) { trick(); }
          else if (B.airJ && !B.homing) {
            B.airJ = false; const t = targetFor();
            if (t) { B.homing = t; B.hTime = 0; K.sfx.noise(0.2, 0.15, 3000, 0, 'bandpass', 8000); }
            else { B.v += 10; B.vh = Math.max(B.vh, 3); K.sfx.noise(0.2, 0.12, 2000, 0, 'bandpass', 6000); at(B.s, B.u, B.h + 0.8, fr2); burst(fr2.p, 0x9ad8ff, 6, 3, { life: 0.3, grav: 0 }); }
          }
        }
        if (IN.b && B.air && B.ramp && B.tricks < 3) trick();
        // spin dash: hold B on the ground, let go to shoot off
        if (IN.bH && !B.air && !B.grind && !board) { if (!B.charging) { B.charging = true; B.charge = 0; } B.charge = Math.min(1, B.charge + dt * 1.4); if ((K.frame % 8) === 0) K.sfx.tone(200 + B.charge * 500, 0.08, 'sawtooth', 0.05, 0, 400 + B.charge * 800); }
        else if (B.charging) { B.charging = false; B.roll = 0.9; B.v = Math.max(B.v, 30 + B.charge * 30); K.sfx.tone(160, 0.3, 'sawtooth', 0.07, 0, 1200); K.sfx.noise(0.3, 0.1, 2000, 0, 'bandpass', 5000); at(B.s, B.u, 0.4, fr2); burst(fr2.p, 0xd8d8e8, 8, 4, { life: 0.4, grav: 2 }); B.charge = 0; }
        if (B.roll > 0) B.roll -= dt;
        // the air, the ground, the gaps, the rails
        if (B.grind) { const r = B.grind; B.u = r.u; B.h = r.h; if (B.s > r.s1 || B.s < r.s0) { B.grind = null; B.air = true; B.vh = 4; B.airJ = true; } }
        else if (B.air && !B.homing) {
          B.vh -= (IN.aH && B.vh > 0 ? 26 : 38) * g * dt; B.h += B.vh * dt;
          if (B.vh <= 0) for (const r of RAILS) if (B.s > r.s0 && B.s < r.s1 && Math.abs(B.u - r.u) < 1.2 && B.h <= r.h + 0.3 && B.h > r.h - 1) { B.grind = r; B.air = false; B.ramp = false; K.sfx.tone(900, 0.1, 'square', 0.05); break; }
          if (!B.grind && B.h <= 0 && !isGap(B.s)) { if (B.h > -2.5) { B.h = 0; B.vh = 0; B.air = false; B.airJ = false; B.ramp = false; B.trick = 0; } }
          if (!B.grind && B.h < -9) die(true);
        } else if (!B.air && isGap(B.s)) {
          let r0 = null; for (const r of RAILS) if (B.s > r.s0 && B.s < r.s1 && Math.abs(B.u - r.u) < 1.6) r0 = r;
          if (r0) { B.grind = r0; K.sfx.tone(900, 0.1, 'square', 0.05); } else { B.air = true; B.airJ = false; B.vh = 0; }
        } else if (!B.air) { for (const r of RAILS) if (r.h < 1 && B.s > r.s0 && B.s < r.s0 + 3 && Math.abs(B.u - r.u) < 1.2) { B.grind = r; K.sfx.tone(900, 0.1, 'square', 0.05); } }
        // ramps launch you
        for (const rs of RAMPS) if (s0 <= rs && B.s > rs && !B.air && B.v > 12) { B.air = true; B.vh = Math.max(11, B.v * 0.42); B.airJ = true; B.ramp = true; B.tricks = 0; K.sfx.tone(260, 0.3, 'square', 0.06, 0, 900); say(board ? 'TRICK TIME! PRESS ' + L('a') : 'JUMP!', 1); }
        // the loop: all the way round without rolling back
        for (const sg of SEGS) if (sg.loop) { if (s0 <= sg.s0 && B.s > sg.s0) { sg.in = true; sg.back = false; } if (B.s > sg.s0 && B.s < sg.s1 && B.v < 0) sg.back = true; if (sg.in && s0 < sg.s1 && B.s >= sg.s1) { sg.in = false; if (!sg.back) { score += 500; say('LOOP THE LOOP!', 1.4); K.secret('rm.dash.loop'); K.sfx.seq([[84, 0.25], [88, 0.25], [91, 0.5]], { bpm: 300, vol: 0.08 }); } } }
        // things on the course
        for (const d of DASH) if (Math.abs(B.s - d.s) < 1.8 && Math.abs(B.u - d.u) < 2 && B.h < 1 && B.v > 0 && B.v < 54) { B.v = 56; K.sfx.noise(0.4, 0.12, 1500, 0, 'bandpass', 6000); }
        for (const sp of SPRINGS) { if (sp.bounce > 0) sp.bounce -= dt; sp.top.position.y = 1.0 + Math.max(0, sp.bounce || 0) * 2.4; if (Math.abs(B.s - sp.s) < 1.5 && Math.abs(B.u - sp.u) < 1.6 && B.h < 1.2 && B.vh <= 0.5) { B.air = true; B.vh = 22; B.airJ = true; B.grind = null; sp.bounce = 0.3; K.sfx.tone(200, 0.3, 'square', 0.08, 0, 1200); } }
        for (const sp of SPIKES) if (Math.abs(B.s - sp.s) < 1.0 && Math.abs(B.u - sp.u) < 1.7 && B.h < 0.8) hurt();
        for (const b of BUMPERS) if (Math.abs(B.s - b.s) < 1.6 && Math.abs(B.u - b.u) < 1.7 && B.h < 1.6) { B.us = (B.u >= b.u ? 1 : -1) * 22; B.u = b.u + (B.u >= b.u ? 1.75 : -1.75); score += 10; K.sfx.tone(880, 0.12, 'square', 0.07, 0, 1760); at(b.s, b.u, 1.3, fr2); burst(fr2.p, [0xff3ab0, 0xffe04a], 6, 5); }
        for (const r of RINGS) if (!r.got && Math.abs(r.s - B.s) < 1.3 && Math.abs(r.u - B.u) < 1.3 && Math.abs(r.h - 1.1 - B.h) < 1.6) { r.got = true; rings++; score += 10; fx.ding(); burst(r.pos, 0xffe04a, 3, 4, { life: 0.35 }); }
        for (const q of LOST) if (q.t > 0.45 && Math.abs(q.s - B.s) < 1.4 && Math.abs(q.u - B.u) < 1.4 && Math.abs(q.h - 1 - B.h) < 1.6) { q.t = 99; rings++; fx.ding(); }
        for (const m of MONS) if (m.alive && Math.abs(m.s - B.s) < 1.3 && Math.abs(m.u - B.u) < 1.4 && B.h < 1.8) { if (B.air || B.roll > 0 || B.charging) { hitMon(m); if (B.air) { B.vh = 10; B.airJ = true; } } else { B.v = Math.min(B.v, 4); B.s = m.s - 1.3; } }
        for (const b of BOTS) {
          if (!b.alive) continue;
          if (Math.abs(b.s - B.s) < 60) {
            if (b.kind === 'beetle') b.u = b.u0 + Math.sin(K.t * 1.4 + b.ph) * 1.6;
            else if (b.kind === 'bee') b.h = 3 + Math.sin(K.t * 2 + b.ph) * 0.8;
            else if (b.kind === 'roller' && b.s - B.s < 40 && b.s > B.s) b.s -= 9 * dt;
            at(b.s, b.u, b.h, fr2); b.m.position.copy(fr2.p); if (b.w) b.w.rotation.y = Math.sin(K.t * 40) * 0.4;
            if (b.kind === 'roller') b.m.rotation.x -= dt * 8; b.m.visible = true;
          } else b.m.visible = Math.abs(b.s - B.s) < 220;
          if (Math.abs(b.s - B.s) < 1.4 && Math.abs(b.u - B.u) < 1.5 && Math.abs(b.h - B.h) < 1.7) {
            if ((B.air && B.hurt <= 0) || B.homing || B.roll > 0 || B.charging || (B.grind && b.kind !== 'roller')) { popBot(b); if (!B.homing && B.air) { B.vh = 10; B.airJ = true; } }
            else hurt();
          }
        }
        if (!B.air) chain = 0;
        for (const L_ of LAMPS) if (!L_.on && B.s > L_.s) { L_.on = true; check = L_.s; L_.m.geometry = model('lampon'); K.sfx.seq([[79, 0.25], [86, 0.5]], { bpm: 300, vol: 0.07 }); }
        // lost rings bounce about
        for (const q of LOST) { if (q.t > 3) continue; q.t += dt; q.vh -= 22 * dt; q.s += q.vs * dt; q.u = clamp(q.u + q.vu * dt, -halfW(q.s), halfW(q.s)); q.h += q.vh * dt; if (q.h < 0.6) { q.h = 0.6; q.vh = Math.abs(q.vh) * 0.6; } }
        // the chase (a robot whale, an avalanche)
        if (CHASE && !CHASE.done) {
          if (!CHASE.on && B.s > CHASE.s0) { CHASE.on = true; CHASE.d = 30; CHASE.m.visible = true; say(CHASE.kind === 'whale' ? 'RUN!!' : 'AVALANCHE!', 1.6); K.sfx.tone(80, 1.2, 'sawtooth', 0.1, 0, 40); shake = 0.6; }
          if (CHASE.on) {
            CHASE.d = clamp(CHASE.d + (B.v - CHASE.speed) * dt * 0.8, 4, 34);
            if (CHASE.d <= 5 && B.inv <= 0) { hurt(); CHASE.d = 18; }
            const cs = B.s - CHASE.d; at(cs, 0, CHASE.kind === 'whale' ? 1.5 + Math.abs(Math.sin(K.t * 1.6)) * 4 : 0, fr2); orient(CHASE.m, fr2); CHASE.m.rotateY(Math.PI);
            if (CHASE.kind === 'whale') { CHASE.m.rotateX(-0.15 + Math.sin(K.t * 1.6) * 0.15); if ((K.frame & 3) === 0) { at(cs + 9, (Math.random() - 0.5) * 6, 0.2, fr2); burst(fr2.p, [0xa8784a, 0x9ad8ff, 0xffffff], 4, 9, { up: 1.4 }); } }
            else { if ((K.frame & 1) === 0) { at(cs + 4, (Math.random() - 0.5) * 14, 2, fr2); burst(fr2.p, 0xffffff, 4, 8, { up: 1.2, size: 0.6 }); } }
            shake = Math.max(shake, 0.05);
            if (B.s >= CHASE.s1) { CHASE.done = true; CHASE.on = false; CHASE.m.visible = false; score += 1000; say(CHASE.kind === 'whale' ? 'SPLASH! YOU OUTRAN IT!' : 'MADE IT!', 2); if (CHASE.kind === 'whale') K.secret('rm.dash.whale'); at(B.s - 20, 0, -6, fr2); burst(fr2.p, [0x9ad8ff, 0xffffff], 30, 14, { up: 2 }); }
          }
        }
        if (!SG.ring && B.s >= GOAL && mode === 'play') goal();
        B.run += dt * Math.max(2, B.v) * 0.9;
      }
      function trick() { const B = Pz; B.tricks++; B.trick = 0.5; score += 200 * B.tricks; say(['', 'NICE!', 'COOL!', 'AWESOME!'][B.tricks], 0.8); K.sfx.tone(500 + B.tricks * 200, 0.15, 'square', 0.06, 0, 1600); }
      const frZ = FR();

      // ================================================================ the save (the memory card), the records
      const prog = { reach: 0, best: {}, badges: {}, chums: [], animals: 0, opt: { mus: 1, cam: 1 }, recs: [], cheat: 0, clear: 0 };
      (function () { const s = K.load(); if (!s || typeof s !== 'object') return; for (const k of Object.keys(prog)) if (s[k] != null && typeof s[k] === typeof prog[k]) prog[k] = s[k]; prog.reach = clamp(prog.reach | 0, 0, 5); })();
      let savingT = 0;
      function saveNow(show) { if (demo) return; K.save({ v2: 1, reach: prog.reach, best: prog.best, badges: prog.badges, chums: prog.chums, animals: prog.animals, opt: prog.opt, recs: prog.recs, cheat: prog.cheat, clear: prog.clear }); if (show) savingT = 1.4; }
      const nBadges = () => Object.keys(prog.badges).length;
      const myName = () => { let n = 'JACK'; try { if (window.Net && Net.me && Net.me.nick) n = String(Net.me.nick); } catch (e) {} return n.toUpperCase().replace(/[^A-Z0-9 _-]/g, '').slice(0, 10) || 'JACK'; };
      const castN = (id, d) => { try { return (window.Cast && Cast.n(id)) || d; } catch (e) { return d; } };
      function records() { const m = [['DAVE', 61200], ['CALLUM', 48800], ['LUKE', 40300], ['JACKK', 33100], [castN('kidCalc', 'Ben'), 21000], [castN('kidBand', 'Sam'), 12400], ['MOM', 2500]].map(([n, s]) => ({ n: String(n).toUpperCase().slice(0, 10), s, mate: 1 })); return m.concat(prog.recs).sort((a, b) => b.s - a.s).slice(0, 8); }
      function addRec(s) { if (s <= 0) return; prog.recs.push({ n: myName(), s: Math.min(99999, s) }); prog.recs.sort((a, b) => b.s - a.s); prog.recs = prog.recs.slice(0, 5); }
      let tok0 = 0;
      function sendScore(final, title, text) { const sc = Math.min(99999, score, Math.floor(480 * (K.t - tok0 + 4))); tok0 = K.t; if (final) K.over(sc, { title, text }); else K.over(sc, { keep: true }); }
      const RANKS = [['A', 12000], ['B', 9000], ['C', 6000], ['D', 3500], ['E', 0]];
      const rankOf = sc => RANKS.find(r => sc >= r[1])[0];

      // ================================================================ modes and menus
      let mode = 'title', demo = false, adv = false, stageI = 0, menuI = 0, subI = 0, idleT = 0, pressed = false, cheatBuf = '', paused = false, pauseI = 0, tally = null, loadT = 0, loadNext = null, storyT = 0, overT = 0, endT = 0;
      const music = s => K.music(prog.opt.mus && s ? SONGS[s] : null);
      const IN = { x: 0, y: 0, a: false, aH: false, b: false, bH: false };
      function readIn() { const s = K.stick(); IN.x = s.x; IN.y = s.y; IN.a = K.pressed('a'); IN.aH = K.held('a'); IN.b = K.pressed('b'); IN.bH = K.held('b'); }
      const tick = () => K.sfx.tone(880, 0.04, 'square', 0.04), okS = () => K.sfx.tone(1320, 0.08, 'square', 0.05);
      const up = () => K.pressed('up'), dn = () => K.pressed('down'), ok = () => K.pressed('a') || K.pressed('start'), back = () => K.pressed('b');
      const MENU = () => ['ADVENTURE', 'TRIAL', 'CHUM GARDEN', 'HOW TO PLAY', 'OPTIONS', 'RECORDS'];
      function startStage(i, isAdv) { adv = isAdv; stageI = i; mode = 'story'; storyT = 0; music(null); }
      function loadStage() { mode = 'loading'; loadT = 0; buildStage(stageI); resetZip(2); check = 2; rings = 0; lvT = 0; stageScore0 = score; LOST = []; Pz.shield = false; Pz.shoes = 0; }
      function beginPlay() { mode = 'play'; music(SG.song); say(SG.name, 2); }
      function goal() {
        mode = 'tally'; K.music(null); Pz.v = 0;
        const tb = Math.max(0, Math.round((SG.par - lvT) * 60)), rb = rings * 50;
        score += tb + rb; const st = score - stageScore0, rk = rankOf(st);
        tally = { t: 0, time: lvT, tb, rb, rings, st, rk, sent: false };
        const b = prog.best[SG.id] || {}; if (!b.sc || st > b.sc) b.sc = st; if (!b.t || lvT < b.t) b.t = Math.round(lvT * 10) / 10; if (!b.rk || 'ABCDE'.indexOf(rk) < 'ABCDE'.indexOf(b.rk)) b.rk = rk; prog.best[SG.id] = b;
        prog.badges[SG.id + '.clear'] = 1; if (rk === 'A') prog.badges[SG.id + '.a'] = 1;
        if (adv) prog.reach = Math.max(prog.reach, stageI + 1);
        prog.animals += animals; animals = 0;
        K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.5], [83, 0.25], [84, 1]], { bpm: 240, vol: 0.09 });
        saveNow(true);
      }
      function afterTally() {
        if (adv) {
          sendScore(false);
          if (stageI < 3) startStage(stageI + 1, true); else startStage(4, true);
        } else { sendScore(false); toMenu('trial'); }
      }
      function bossBeaten() { score += 5000 + rings * 100; if (!adv) { prog.badges['boss.clear'] = 1; prog.animals += animals; animals = 0; K.secret('rm.dash.doctor'); saveNow(true); sendScore(false); toMenu('trial'); say('DOCTOR BEATEN!', 2); return; } prog.reach = 5; prog.clear = 1; prog.badges['boss.clear'] = 1; prog.animals += animals; animals = 0; K.secret('rm.dash.doctor'); addRec(score); saveNow(true); mode = 'ending'; endT = 0; music('win'); }
      function gameOver() { mode = 'over'; overT = 0; K.music(null); prog.animals += animals; animals = 0; addRec(score); saveNow(true); }
      function toMenu(sub) { demo = false; paused = false; mode = 'menu'; subI = 0; menuI = sub === 'trial' ? 1 : 0; if (sub === 'trial') { mode = 'trial'; } if (!SG || SG.id !== 'bay') buildStage(0); resetZip(6); music('title'); }
      function toTitle() { toMenu(); mode = 'title'; pressed = false; idleT = 0; }
      function newAdventure() { score = 0; lives = 3; tok0 = K.t; startStage(0, true); }

      // ================================================================ the camera: behind (or in front, when something is chasing you)
      const cam = T3.cam, camPos = V3(), camUp = V3(0, 1, 0), camLook = V3(); let camInit = false, camFront = false;
      const c1 = FR(), c2 = FR();
      function camera(dt) {
        camFront = !!(CHASE && CHASE.on);
        if (Pz.dead > 0 && Pz.fall) { cam.lookAt(at(Pz.s, Pz.u, Pz.h, c2).p); return; }
        if (camFront) { at(Pz.s + 10, Pz.u * 0.4, 4 + Pz.h * 0.3, c1); at(Pz.s - 6, Pz.u * 0.6, 1.6 + Pz.h * 0.5, c2); }
        else { const back = 7 + Math.min(4, Math.max(0, Pz.v - 30) * 0.15); at(Pz.s - back, Pz.u * 0.6, 3.3 + Pz.h * 0.4, c1); at(Pz.s + 8, Pz.u * 0.8, 1.2 + Pz.h * 0.6, c2); }
        if (!camInit) { camPos.copy(c1.p); camUp.copy(c1.u); camLook.copy(c2.p); camInit = true; }
        camPos.lerp(c1.p, Math.min(1, dt * (camFront ? 5 : 9))); camUp.lerp(c1.u, Math.min(1, dt * 6)).normalize(); camLook.lerp(c2.p, Math.min(1, dt * 12));
        cam.position.copy(camPos); if (shake > 0) cam.position.add(tv.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake));
        cam.up.copy(camUp); cam.lookAt(camLook);
        const fov = 66 + Math.min(14, Math.max(0, Pz.v - 32) * 0.6); if (Math.abs(cam.fov - fov) > 0.2) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix(); }
      }

      // ================================================================ Zip's poses
      function placeZip() {
        at(Pz.s, Pz.u, Pz.h, c2); orient(ZIP.root, c2);
        const gnd = at(Pz.s, Pz.u, 0.05, c1), sh = ZIP.sh; sh.visible = !isGap(Pz.s) && mode !== 'garden'; const mx = new T.Matrix4().makeBasis(gnd.s, gnd.t, gnd.u); sh.quaternion.setFromRotationMatrix(mx); sh.position.copy(gnd.p);
        const k = Math.max(0.3, 1 - Pz.h * 0.08); sh.scale.set(k, k, 1);
        ZIP.root.visible = Pz.inv <= 0 || (Pz.inv * 14 | 0) % 2 === 0;
      }
      function animZip(dt, v, t) {
        const Z = ZIP, B = Pz, board = B.s >= BOARD0 && mode !== 'garden' && mode !== 'title' && !B.homing;
        const curled = !board && !B.grind && (B.homing || B.roll > 0 || B.charging || (B.air && B.airJ === false && B.vh > -4 && !B.ramp) || (B.air && B.vh > 0 && !B.ramp));
        Z.ball.visible = !!curled; Z.body.visible = !curled; Z.board.visible = board && !B.dead;
        Z.m.rotation.set(0, 0, 0); Z.m.position.set(0, board ? 0.12 : 0, 0);
        if (curled) { Z.ball.rotation.x -= dt * (B.charging ? 30 + B.charge * 30 : 26); Z.ball.position.y = B.charging ? 0.55 : 0.7; return; }
        const r = B.run * (v > 25 ? 1.6 : 1.2), sp = Math.min(1, v / 20), fast = v > 30;
        let lx = Math.sin(r) * 1.1 * sp, rxl = -lx, ax = -Math.sin(r) * 0.8 * sp, az = 0.12;
        if (fast && !board) { ax = 1.2; az = 0.35; }
        if (B.grind || board) { lx = 0.4; rxl = -0.2; ax = 0; az = 1.3; Z.m.rotation.y = board ? 1.2 : 0.9; }
        if (B.air && B.ramp) { Z.m.rotation.y = (board ? 1.2 : 0) + (B.trick > 0 ? (1 - B.trick / 0.5) * TAU : 0); if (B.trick > 0) B.trick -= dt; az = 1.6; lx = 0.6; rxl = 0.6; }
        if (B.hurt > 0 || B.dead > 0) { ax = -2.6; az = 0.6; lx = 0.6; rxl = -0.6; Z.m.rotation.x = 0.5; }
        Z.legL.rotation.set(lx, 0, 0); Z.legR.rotation.set(rxl, 0, 0);
        Z.armL.rotation.set(ax, 0, az); Z.armR.rotation.set(B.grind || board ? 0 : -ax, 0, -az);
        if (!board && !B.grind && !(B.hurt > 0)) Z.m.rotation.x = -Math.min(0.45, v * 0.012);
        Z.body.position.y = 0.62 + Math.abs(Math.sin(r)) * 0.07 * sp;
        Z.head.rotation.set(0, v < 1 ? Math.sin(t * 0.9) * 0.35 : 0, 0);
        Z.tailG.rotation.set(-0.3 - Math.min(1, v / 30) * 0.9 + Math.sin(t * 14) * 0.15 * (0.3 + sp), Math.sin(t * 9) * 0.25, 0);
        Z.blink -= dt; if (Z.blink < 0) Z.blink = 2 + Math.random() * 3; Z.eyes.scale.y = Z.blink < 0.12 ? 0.15 : 1; Z.eyes.position.y = Z.blink < 0.12 ? 0.36 : 0;
      }

      // ================================================================ the CHUM GARDEN
      const CHUMN = ['MOCHI', 'PIP', 'BLOB'];
      const GD = { x: 0, z: 8, vx: 0, vz: 0, y: 0, vy: 0, face: 0, yaw: 0, chums: [], fruit: [], carry: null, carryM: null, cam: V3(0, 5, 18) };
      function chumGeo(c) {
        const j = clamp(c.joy / 10, 0, 1), body = new T.Color(0x9ad0ff).lerp(new T.Color(c.joy >= 10 ? 0xffd23a : 0xffa8d8), j).getHex(), s = 0.8 + Math.min(c.age, 8) * 0.05;
        const P = [pt(S.ball(16), body, 0, 0.55 * s, 0, 1.0 * s, 0.95 * s, 0.9 * s, 0, 0, 0, 0.25), pt(S.ball(10), 0xffffff, 0, 0.45 * s, -0.32 * s, 0.6 * s, 0.5 * s, 0.3 * s),
          pt(S.ball(8), 0x1a1a2a, 0.17 * s, 0.68 * s, -0.4 * s, 0.14 * s, 0.2 * s, 0.08 * s), pt(S.ball(8), 0x1a1a2a, -0.17 * s, 0.68 * s, -0.4 * s, 0.14 * s, 0.2 * s, 0.08 * s), pt(S.ball(6), 0xffffff, 0.19 * s, 0.73 * s, -0.44 * s, 0.05, 0.06, 0.03), pt(S.ball(6), 0xffffff, -0.15 * s, 0.73 * s, -0.44 * s, 0.05, 0.06, 0.03),
          pt(S.ball(8), 0xff8ab0, 0.3 * s, 0.52 * s, -0.33 * s, 0.14, 0.08, 0.06), pt(S.ball(8), 0xff8ab0, -0.3 * s, 0.52 * s, -0.33 * s, 0.14, 0.08, 0.06), pt(S.cyl(5), 0x3a8a3a, 0, 1.1 * s, 0, 0.05, 0.3, 0.05), pt(S.ball(8), 0x5ac04a, 0.12, 1.28 * s, 0, 0.3, 0.06, 0.16, 0, 0, 0.4),
          pt(S.ball(8), body, 0.22 * s, 0.08, -0.05, 0.3 * s, 0.18, 0.36 * s), pt(S.ball(8), body, -0.22 * s, 0.08, -0.05, 0.3 * s, 0.18, 0.36 * s)];
        if (c.look.w) P.push(pt(S.ball(10), 0xffffff, 0.55 * s, 0.75 * s, 0.25 * s, 0.7 * s, 0.1, 0.4 * s, 0, 0.4, 0.5), pt(S.ball(10), 0xffffff, -0.55 * s, 0.75 * s, 0.25 * s, 0.7 * s, 0.1, 0.4 * s, 0, -0.4, -0.5));
        if (c.look.e) P.push(pt(S.ball(10), body, 0.25 * s, 1.15 * s, 0.05, 0.22, 0.6 * s, 0.14, 0, 0, -0.3), pt(S.ball(10), body, -0.25 * s, 1.15 * s, 0.05, 0.22, 0.6 * s, 0.14, 0, 0, 0.3));
        if (c.look.f) P.push(pt(S.cone(4), 0x5ad0ff, 0, 0.7 * s, 0.45 * s, 0.1, 0.6 * s, 0.5 * s, 0.4));
        return merge(P);
      }
      function gardenBuild() {
        disposeStage(); SG = { id: 'garden', w: 4, ring: false, song: 'garden' }; ST = SG; SG_ = new T.Group(); T3.add(SG_); BOARD0 = 1e9; CHASE = null; BOSS.on = false;
        const f = T3.scene.fog; f.color.setHex(0xd8f0ff); f.near = 40; f.far = 160; LT.hemi.color.setHex(0xffffff); LT.hemi.groundColor.setHex(0x6a8a5a); LT.hemi.intensity = 0.9; LT.sun.intensity = 0.8; LT.sun.color.setHex(0xfff4e0);
        const sk = new T.Mesh(new T.SphereGeometry(300, 16, 10), mat('skygarden', { map: tex('skygarden', 8, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#5ab0ff'); gr.addColorStop(0.45, '#bfe8ff'); gr.addColorStop(0.55, '#fff0e0'); gr.addColorStop(1, '#fff0e0'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); }), lit: false, side: T.BackSide, fog: false })); SG_.add(sk);
        const P = [pt(S.cyl(40), 0x6ac84a, 0, -0.5, 0, 48, 1, 48, 0, 0, 0, 0.3), pt(S.cyl(40, 0.9), 0x8a6a4a, 0, -3, 0, 49, 4.4, 49), pt(S.cyl(24), 0x4aa8ff, -10, 0.02, 6, 9, 0.06, 7), pt(S.cyl(24), 0xe8d8a8, -10, 0.0, 6, 10.4, 0.04, 8.4),
          pt(S.cyl(8), 0x8a5a2a, 9, 2.5, -8, 1.4, 5, 1.4, 0, 0, 0, 0.3), pt(S.ball(12), 0x3aa83a, 9, 7, -8, 8, 6, 8, 0, 0, 0, 0.35), pt(S.ball(12), 0x4ac04a, 7, 8.4, -6, 4, 3, 4),
          pt(S.box(), 0xb07a42, -8, 1.2, -12, 6, 2.4, 4, 0, 0.3, 0, 0.3), pt(S.cone(4), 0xe05a3a, -8, 3.3, -12, 8, 2.2, 6, 0, 0.3 + Math.PI / 4, 0), pt(S.box(), 0x5a3a1a, -8, 0.9, -9.9, 1.0, 1.8, 0.1, 0, 0.3, 0),
          pt(S.box(), 0xc88a4a, 11, 0.6, 6, 2.2, 1.2, 1.6, 0, 0, 0, 0.3), pt(S.box(), 0x8a5a2a, 11, 1.25, 6, 2.3, 0.1, 1.7)];
        for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; P.push(pt(S.box(), 0xffffff, Math.cos(a) * 22.5, 0.6, Math.sin(a) * 22.5, 0.2, 1.2, 0.2), pt(S.box(), 0xffffff, Math.cos(a + 0.08) * 22.5, 0.9, Math.sin(a + 0.08) * 22.5, 0.12, 0.12, 3.6, 0, -a, 0)); }
        for (let i = 0; i < 30; i++) { const a = rnd() * TAU, r = 4 + rnd() * 16; P.push(pt(S.ball(6), [0xff4a8a, 0xffe04a, 0xffffff, 0xa86aff][i % 4], Math.cos(a) * r, 0.2, Math.sin(a) * r, 0.4, 0.3, 0.4)); }
        P.push(pt(S.tor(0.2, 24), 0x3ae0ff, 0, 0.1, 17, 3, 3, 3, Math.PI / 2));
        SG_.add(new T.Mesh(merge(P), matV()));
        // the Chums: one to start, more as you get further
        const want = 1 + (prog.reach >= 2 ? 1 : 0) + (prog.reach >= 4 ? 1 : 0);
        while (prog.chums.length < want) prog.chums.push({ name: CHUMN[prog.chums.length], joy: 0, age: 0, look: { w: 0, e: 0, f: 0 }, n: 0 });
        GD.chums = prog.chums.map((c, i) => { const m = new T.Mesh(chumGeo(c), shiny()); const ch = { c, m, x: -3 + i * 3, z: -2, a: rnd() * TAU, t: 0, pet: 0, hop: rnd() * 3 }; m.position.set(ch.x, 0, ch.z); SG_.add(m); return ch; });
        GD.fruit = [0, 1, 2].map(i => { const m = new T.Mesh(merge([pt(S.ball(10), 0xff5a3a, 0, 0.35, 0, 0.6, 0.6, 0.6, 0, 0, 0, 0.3), pt(S.cyl(4), 0x5a3a1a, 0, 0.7, 0, 0.05, 0.2, 0.05), pt(S.ball(6), 0x4ac04a, 0.1, 0.75, 0, 0.2, 0.06, 0.12)]), shiny()); SG_.add(m); return { m, x: 7 + i * 1.5, z: -4.5 - i * 0.8, t: 0 }; });
        GD.carryM = { fruit: GD.fruit[0].m.geometry, crit: model('critter') }; GD.held = new T.Mesh(model('critter'), shiny()); GD.held.visible = false; SG_.add(GD.held);
        Object.assign(GD, { x: 0, z: 12, vx: 0, vz: 0, y: 0, vy: 0, face: 0, yaw: 0, carry: null }); GD.cam.set(0, 6, 22);
        ZIP.board.visible = false; ZIP.sh.visible = false;
      }
      function gardenUpdate(dt, t) {
        if (K.pressed('start')) { saveNow(true); toMenu(); return; }
        const s = K.stick(), cy = GD.yaw, fx = -Math.sin(cy), fz = -Math.cos(cy), rx = Math.cos(cy), rz = -Math.sin(cy);
        let wx = fx * -s.y + rx * s.x, wz = fz * -s.y + rz * s.x; const wl = Math.min(1, Math.hypot(wx, wz)); if (wl > 0.05) { const l = Math.hypot(wx, wz); wx /= l; wz /= l; }
        GD.vx += (wx * wl * 9 - GD.vx) * Math.min(1, dt * 8); GD.vz += (wz * wl * 9 - GD.vz) * Math.min(1, dt * 8);
        if (wl > 0.1) GD.face += wrapA(Math.atan2(-wx, -wz) - GD.face) * Math.min(1, dt * 12);
        GD.x += GD.vx * dt; GD.z += GD.vz * dt; const r = Math.hypot(GD.x, GD.z); if (r > 21.5) { GD.x *= 21.5 / r; GD.z *= 21.5 / r; }
        if (Math.hypot(GD.x - 9, GD.z + 8) < 1.6) { const d = Math.hypot(GD.x - 9, GD.z + 8); GD.x = 9 + (GD.x - 9) / d * 1.6; GD.z = -8 + (GD.z + 8) / d * 1.6; }
        if (K.pressed('a') && GD.y <= 0) { GD.vy = 11; K.sfx.tone(300, 0.15, 'square', 0.06, 0, 900); }
        GD.vy -= 34 * dt; GD.y = Math.max(0, GD.y + GD.vy * dt);
        if (wl > 0.1 && GD.y <= 0) GD.yaw += wrapA(GD.face - GD.yaw) * Math.min(1, dt * 1.2);
        // pick things up: fruit under the tree, a rescued critter from the crate
        if (!GD.carry) { for (const fr of GD.fruit) if (fr.t <= 0 && Math.hypot(GD.x - fr.x, GD.z - fr.z) < 1.2) { GD.carry = 'fruit'; fr.t = 20; fr.m.visible = false; K.sfx.tone(700, 0.1, 'square', 0.05); } if (!GD.carry && Math.hypot(GD.x - 11, GD.z - 6) < 2.2) { if (prog.animals > 0) { prog.animals--; GD.carry = 'crit'; K.sfx.tone(900, 0.1, 'square', 0.05); } else if ((K.frame % 90) === 0) say('NO CRITTERS YET: RESCUE SOME FROM ROBOTS!', 2); } }
        for (const fr of GD.fruit) { if (fr.t > 0) { fr.t -= dt; if (fr.t <= 0) fr.m.visible = true; } fr.m.position.set(fr.x, 0, fr.z); }
        GD.held.visible = !!GD.carry; if (GD.carry) { GD.held.geometry = GD.carryM[GD.carry]; GD.held.position.set(GD.x, GD.y + 2.3, GD.z); GD.held.rotation.y = t * 2; }
        // the Chums
        for (const ch of GD.chums) {
          const c = ch.c, dx = GD.x - ch.x, dz = GD.z - ch.z, d = Math.hypot(dx, dz);
          ch.t -= dt; if (ch.pet > 0) ch.pet -= dt;
          if (c.joy >= 5 && d > 3 && d < 12) { ch.x += dx / d * 3 * dt; ch.z += dz / d * 3 * dt; ch.a = Math.atan2(-dx, -dz); }
          else if (d > 2.5) { if (ch.t < 0) { ch.t = 1.5 + rnd() * 2; ch.a = rnd() * TAU; } ch.x -= Math.sin(ch.a) * 1.2 * dt; ch.z -= Math.cos(ch.a) * 1.2 * dt; }
          else ch.a = Math.atan2(-dx, -dz);
          const rr = Math.hypot(ch.x, ch.z); if (rr > 20) { ch.x *= 20 / rr; ch.z *= 20 / rr; ch.a += Math.PI; }
          ch.hop += dt * (c.joy >= 5 ? 9 : 5); ch.m.position.set(ch.x, Math.abs(Math.sin(ch.hop)) * (0.15 + c.joy * 0.03), ch.z); ch.m.rotation.y += wrapA(ch.a - ch.m.rotation.y) * Math.min(1, dt * 6);
          if (d < 1.8 && GD.carry) { const what = GD.carry; GD.carry = null; if (what === 'fruit') { c.joy = Math.min(10, c.joy + 2); c.age++; say(c.name + ' MUNCHES THE FRUIT!', 1.6); } else { c.joy = Math.min(10, c.joy + 3); const k = ['w', 'e', 'f'][c.n++ % 3]; c.look[k] = 1; say(c.name + ' LOOKS DIFFERENT!', 1.6); } chumRefresh(ch); hearts(ch); }
          if (d < 1.8 && K.pressed('b') && ch.pet <= 0) { ch.pet = 0.8; c.joy = Math.min(10, c.joy + 1); say(c.joy >= 10 ? c.name + ' LOVES YOU!' : 'PAT PAT PAT', 1.2); chumRefresh(ch); hearts(ch); }
          if (c.joy >= 10) K.secret('rm.dash.chum');
        }
        // Zip and the camera
        ZIP.root.quaternion.set(0, 0, 0, 1); ZIP.root.position.set(GD.x, GD.y, GD.z); ZIP.root.rotation.set(0, GD.face, 0); Pz.run += dt * Math.hypot(GD.vx, GD.vz) * 1.4; Pz.air = GD.y > 0; Pz.vh = GD.vy; Pz.ramp = false; Pz.inv = 0; ZIP.root.visible = true;
        animZip(dt, Math.hypot(GD.vx, GD.vz) * 2.4, t); if (GD.y > 0) { ZIP.ball.visible = true; ZIP.body.visible = false; ZIP.ball.rotation.x -= dt * 20; }
        const want = tv.set(GD.x + Math.sin(GD.yaw) * 8, 4.2, GD.z + Math.cos(GD.yaw) * 8); GD.cam.lerp(want, Math.min(1, dt * 5)); cam.position.copy(GD.cam); cam.up.set(0, 1, 0); cam.lookAt(GD.x, 1.2, GD.z);
      }
      function chumRefresh(ch) { ch.m.geometry.dispose(); ch.m.geometry = chumGeo(ch.c); saveNow(); }
      function hearts(ch) { burst(V3(ch.x, 1.6, ch.z), [0xff5a9a, 0xff8ab8], 8, 3, { grav: -2, life: 0.9 }); K.sfx.seq([[84, 0.25], [88, 0.5]], { bpm: 300, vol: 0.07, wave: 'sine' }); }

      // ================================================================ the main step
      function ringsDraw() {
        const spin = K.t * 4, s0 = Pz.s;
        RINGS.forEach((r, i) => { if (r.got || Math.abs(r.s - s0) > 170) { ringMesh.setMatrixAt(i, pz); return; } at(r.s, r.u, r.h, c1); dum.position.copy(r.pos); dum.up.copy(c1.u); dum.lookAt(tv.copy(r.pos).add(c1.s)); dum.rotateOnAxis(V3(0, 1, 0), spin); dum.scale.set(1, 1, 1); dum.updateMatrix(); ringMesh.setMatrixAt(i, dum.matrix); });
        ringMesh.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < 20; i++) { const q = LOST[i]; if (!q || q.t > 3 || (q.t > 2 && (K.frame & 2))) { lostMesh.setMatrixAt(i, pz); continue; } at(q.s, q.u, q.h, c1); dum.position.copy(c1.p); dum.rotation.set(0, spin * 2, 0); dum.updateMatrix(); lostMesh.setMatrixAt(i, dum.matrix); }
        lostMesh.instanceMatrix.needsUpdate = true;
      }
      function demoIn(dt) {
        IN.a = false; IN.b = false; IN.bH = false; IN.y = -0.5;
        let tu = 0, best = 99; for (const r of RINGS) if (!r.got && r.s > Pz.s + 2 && r.s - Pz.s < best) { best = r.s - Pz.s; tu = r.u; }
        IN.x = clamp((tu - Pz.u) * 0.6, -1, 1);
        for (const b of BOTS) if (b.alive && b.s > Pz.s && b.s - Pz.s < 9 && !Pz.air) IN.a = true;
        if (Pz.air && Pz.airJ && Pz.vh < 4 && targetFor()) IN.a = true;
      }
      function update(dt) {
        const t = K.t;
        partsUpdate(dt); if (msgT > 0) msgT -= dt; if (flash > 0) flash -= dt; if (shake > 0) shake -= dt; if (savingT > 0) savingT -= dt;
        if (SG_ && SG_.userData.sea) SG_.userData.sea.offset.set(t * 0.01, t * 0.006); if (SG_ && SG_.userData.goal) SG_.userData.goal.rotation.y = t * 1.5;
        if (mode === 'garden') { gardenUpdate(dt, t); return; }
        if (['title', 'menu', 'trial', 'opts', 'howto', 'records', 'story'].includes(mode)) {
          at(6, 0, 0, c1); orient(ZIP.root, c1); ZIP.root.rotateY(Math.PI + Math.sin(t * 0.8) * 0.4); Pz.s = 6; Pz.u = 0; Pz.h = 0; Pz.air = false; Pz.homing = null; Pz.roll = 0; Pz.charging = false; Pz.grind = null; Pz.inv = 0; Pz.dead = 0; ZIP.root.visible = true; animZip(dt, 0, t); ZIP.sh.visible = false;
          const a = t * 0.25; cam.up.set(0, 1, 0); cam.position.set(c1.p.x + Math.sin(a) * 6, c1.p.y + 2.2, c1.p.z + Math.cos(a) * 6); cam.lookAt(c1.p.x, c1.p.y + 1.3, c1.p.z); if (cam.fov !== 66) { cam.fov = 66; cam.updateProjectionMatrix(); }
          ringsDraw(); menuUpdate(dt); return;
        }
        if (mode === 'attract') { if (K.any() || K.pressed('up') || K.pressed('down') || lvT > 30 || Pz.dead > 0) { demo = false; toTitle(); return; } lvT += dt; demoIn(dt); stepZip(dt, IN); animZip(dt, Pz.v, t); placeZip(); camera(dt); ringsDraw(); return; }
        if (mode === 'loading') { loadT += dt; if (loadT > 1.6) beginPlay(); placeZip(); camInit = false; camera(dt); return; }
        if (mode === 'tally') { tally.t += dt; if (tally.t > 2.4 && (K.pressed('a') || K.pressed('start')) && !tally.sent) { tally.sent = true; afterTally(); } animZip(dt, 0, t); return; }
        if (mode === 'over') { overT += dt; if (overT > 3 && !overT.sent) { overT = -999; sendScore(true, 'GAME OVER', 'ZIP RAN OUT OF LIVES. YOUR RANKS AND CHUMS ARE SAVED.'); } return; }
        if (mode === 'ending') { endT += dt; const a = t * 0.3; cam.up.set(0, 1, 0); at(Pz.s, 0, 0, c1); cam.position.set(c1.p.x + Math.sin(a) * 8, c1.p.y + 3, c1.p.z + Math.cos(a) * 8); cam.lookAt(c1.p.x, c1.p.y + 1.2, c1.p.z); Pz.v = 0; Pz.air = false; animZip(dt, 0, t); placeZip(); if (Math.random() < 0.2) burst(V3(c1.p.x + (Math.random() - 0.5) * 30, c1.p.y + 12 + Math.random() * 8, c1.p.z + (Math.random() - 0.5) * 30), [0xff4a4a, 0xffd23a, 0x4ae0ff, 0x7aff7a][(Math.random() * 4) | 0], 16, 9, { life: 1, grav: 4 }); if ((endT > 5 && K.pressed('start')) || endT > 40) { endT = -999; sendScore(true, 'ADVENTURE CLEAR!', 'DOCTOR CHROMEDOME IS BEATEN. ' + nBadges() + ' BADGES. GO AND SAY HELLO TO YOUR CHUMS!'); } return; }
        // ---- playing
        if (K.pressed('start')) { paused = !paused; pauseI = 0; K.sfx.tone(paused ? 440 : 880, 0.06); if (paused) K.music(null); else music(SG.song); return; }
        if (paused) {
          const it = ['RESUME', 'RESTART STAGE', 'QUIT TO MENU'];
          if (up()) { pauseI = (pauseI + 2) % 3; tick(); } if (dn()) { pauseI = (pauseI + 1) % 3; tick(); }
          if (K.pressed('a')) { paused = false; okS(); if (pauseI === 0) music(SG.song); else if (pauseI === 1) { score = stageScore0; loadStage(); } else { if (adv) { addRec(score); saveNow(); sendScore(false); } toMenu(); } }
          return;
        }
        lvT += dt; readIn(); stepZip(dt, IN); if (SG.ring) { if (Pz.s >= LEN) { Pz.s -= LEN; RINGS.forEach(r => r.got = false); } bossUpdate(dt); } critUpdate(dt);
        animZip(dt, Pz.v, t); placeZip(); camera(dt); ringsDraw();
        if (Pz.shield && (K.frame & 1)) { at(Pz.s, Pz.u, Pz.h + 0.8, c2); burst(c2.p, 0x5ab8ff, 1, 1.5, { life: 0.3, grav: 0, size: 0.18 }); }
        if (Pz.shoes > 0 && Pz.v > 30 && (K.frame & 1)) { at(Pz.s - 0.5, Pz.u, 0.2, c2); burst(c2.p, 0xff6a3a, 1, 1, { life: 0.3, grav: 0 }); }
      }
      function menuUpdate(dt) {
        if (K.any() || up() || dn()) idleT = 0; else idleT += dt;
        if (mode === 'title') {
          for (const [b, ch] of [['up', 'U'], ['down', 'D'], ['left', 'L'], ['right', 'R'], ['a', 'A']]) if (K.pressed(b)) { cheatBuf = (cheatBuf + ch).slice(-5); if (cheatBuf === 'UDLRA') { prog.cheat = 1; saveNow(); K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.5]], { bpm: 300, vol: 0.09 }); say('STAGE SELECT: ALL STAGES OPEN!', 2.5); cheatBuf = ''; return; } }
          if (K.pressed('start')) { pressed = true; mode = 'menu'; menuI = 0; okS(); }
          if (idleT > 12) { demo = true; idleT = 0; stageI = 0; adv = false; buildStage(0); resetZip(2); lvT = 0; score = 0; rings = 0; mode = 'attract'; music('bay'); }
          return;
        }
        if (mode === 'story') { storyT += dt; if (storyT > 0.6 && ok()) { okS(); loadStage(); } return; }
        if (mode === 'howto' || mode === 'records') { if (ok() || back()) { if (mode === 'howto' && subI === 0 && !back()) { subI = 1; tick(); } else { mode = 'menu'; tick(); } } return; }
        if (mode === 'opts') { if (up() || dn()) { subI = (subI + 1) % 3; tick(); } if (ok() || K.pressed('left') || K.pressed('right')) { if (subI === 2) mode = 'menu'; else { const k = ['mus', 'cam'][subI]; prog.opt[k] = prog.opt[k] ? 0 : 1; if (k === 'mus') music('title'); saveNow(); } okS(); } if (back()) mode = 'menu'; return; }
        if (mode === 'trial') {
          const n = Math.min(5, prog.cheat ? 5 : Math.max(1, prog.reach + (prog.reach < 5 ? 1 : 0)));
          if (up()) { subI = (subI + 4) % 5; tick(); } if (dn()) { subI = (subI + 1) % 5; tick(); }
          if (back()) { mode = 'menu'; tick(); } else if (ok()) { if (subI < n) { okS(); score = 0; lives = 3; tok0 = K.t; startStage(subI, false); } else K.sfx.tone(160, 0.2, 'square', 0.06); }
          return;
        }
        const it = MENU();
        if (up()) { menuI = (menuI + it.length - 1) % it.length; tick(); } if (dn()) { menuI = (menuI + 1) % it.length; tick(); }
        if (back()) { mode = 'title'; pressed = false; tick(); return; }
        if (ok()) { okS(); const c = it[menuI];
          if (c === 'ADVENTURE') newAdventure(); else if (c === 'TRIAL') { mode = 'trial'; subI = 0; } else if (c === 'CHUM GARDEN') { mode = 'garden'; gardenBuild(); music('garden'); say('THE CHUM GARDEN', 2); } else if (c === 'HOW TO PLAY') { mode = 'howto'; subI = 0; } else if (c === 'OPTIONS') { mode = 'opts'; subI = 0; } else mode = 'records'; }
      }

      // ================================================================ the HUD (640 x 480)
      const mt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(Math.floor(s * 100) % 100).padStart(2, '0')}`;
      function big(s, x, y, size, c1, align, c2) {
        hud.save(); hud.font = `italic 900 ${size}px Arial Black,Arial,sans-serif`; hud.textAlign = align || 'center'; hud.textBaseline = 'middle';
        hud.lineWidth = Math.max(4, size / 6); hud.strokeStyle = c2 || '#0a2a80'; hud.lineJoin = 'round'; hud.strokeText(s, x, y);
        const gr = hud.createLinearGradient(0, y - size / 2, 0, y + size / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, c1 || '#ffd23a'); gr.addColorStop(1, c1 === '#fff' ? '#c8d8ff' : '#e88a1a'); hud.fillStyle = gr; hud.fillText(s, x, y); hud.restore();
      }
      const px = (s, x, y, c, k, sh) => F.draw(hud, s, x, y, c || '#fff', k || 2, sh === undefined ? '#0a2a80' : sh);
      const pxc = (s, x, y, c, k, sh) => F.center(hud, s, x, y, c || '#fff', k || 2, sh === undefined ? '#0a2a80' : sh);
      function panel(x, y, w, h, a) { hud.save(); hud.fillStyle = `rgba(10,40,140,${a == null ? 0.78 : a})`; hud.strokeStyle = '#ffd23a'; hud.lineWidth = 3; const r = 14; hud.beginPath(); hud.moveTo(x + r, y); hud.arcTo(x + w, y, x + w, y + h, r); hud.arcTo(x + w, y + h, x, y + h, r); hud.arcTo(x, y + h, x, y, r); hud.arcTo(x, y, x + w, y, r); hud.closePath(); hud.fill(); hud.stroke(); hud.restore(); }
      function ringIcon(x, y, r) { hud.save(); hud.strokeStyle = '#8a5a00'; hud.lineWidth = r * 0.55; hud.beginPath(); hud.ellipse(x + 1, y + 1, r * 0.75, r, 0, 0, 7); hud.stroke(); hud.strokeStyle = '#ffd23a'; hud.lineWidth = r * 0.42; hud.beginPath(); hud.ellipse(x, y, r * 0.75, r, 0, 0, 7); hud.stroke(); hud.restore(); }
      function zipHead(x, y, r) { hud.save(); hud.fillStyle = '#2050d8'; for (let i = 0; i < 4; i++) { hud.beginPath(); hud.moveTo(x - r * 0.2, y - r * 0.6 + i * r * 0.4); hud.lineTo(x - r * 1.7, y - r * 0.9 + i * r * 0.55); hud.lineTo(x - r * 0.3, y + i * r * 0.3); hud.fill(); } hud.beginPath(); hud.arc(x, y, r, 0, 7); hud.fill(); hud.fillStyle = '#f4c890'; hud.beginPath(); hud.ellipse(x + r * 0.35, y + r * 0.3, r * 0.6, r * 0.45, 0, 0, 7); hud.fill(); hud.fillStyle = '#fff'; hud.beginPath(); hud.ellipse(x + r * 0.3, y - r * 0.15, r * 0.45, r * 0.35, 0, 0, 7); hud.fill(); hud.fillStyle = '#1a1a2a'; hud.fillRect(x + r * 0.4, y - r * 0.3, r * 0.18, r * 0.3); hud.fillStyle = '#5a3010'; hud.fillRect(x - r * 0.9, y - r * 0.85, r * 1.7, r * 0.22); hud.fillStyle = '#7ad0f0'; hud.beginPath(); hud.arc(x + r * 0.35, y - r * 0.75, r * 0.22, 0, 7); hud.fill(); hud.restore(); }
      function logo(cx, cy, k) {
        hud.save(); hud.translate(cx, cy); hud.scale(k, k);
        hud.fillStyle = '#ffd23a'; hud.beginPath(); hud.moveTo(-250, -10); hud.lineTo(-170, -60); hud.lineTo(170, -60); hud.lineTo(250, -10); hud.lineTo(170, 40); hud.lineTo(-170, 40); hud.closePath(); hud.fill();
        const gr = hud.createLinearGradient(0, -52, 0, 32); gr.addColorStop(0, '#3a8aff'); gr.addColorStop(1, '#0a2aa0'); hud.fillStyle = gr; hud.beginPath(); hud.moveTo(-235, -10); hud.lineTo(-162, -52); hud.lineTo(162, -52); hud.lineTo(235, -10); hud.lineTo(162, 32); hud.lineTo(-162, 32); hud.closePath(); hud.fill();
        hud.font = 'italic 900 64px Arial Black,Arial,sans-serif'; hud.textAlign = 'center'; hud.textBaseline = 'middle'; hud.lineWidth = 8; hud.strokeStyle = '#0a2a80'; hud.strokeText('ZIP', 0, -14); hud.fillStyle = '#fff'; hud.fillText('ZIP', 0, -14);
        hud.font = 'italic 900 26px Arial Black,Arial,sans-serif'; hud.fillStyle = '#ffd23a'; hud.fillText('A D V E N T U R E', 0, 26); hud.restore();
        zipHead(cx - 190 * k, cy - 30 * k, 26 * k);
      }
      function drawHud() {
        hud.clearRect(0, 0, W, H);
        if (mode === 'title') {
          logo(W / 2, 130, 1);
          if ((K.t * 2 | 0) % 2) big('PRESS START', W / 2, 340, 34, '#fff');
          if (msgT > 0) pxc(msg, W / 2, 380, '#7aff7a', 2);
          pxc('BADGES ' + nBadges() + '/9', W / 2, 400, '#ffd23a', 2); pxc('(C) 1999 ZIP TEAM', W / 2, 432, '#cde', 2); pxc('PRODUCED UNDER LICENCE FROM DAYDREAM ENTERPRISES', W / 2, 452, '#9ab', 1, '#0a2a80');
        } else if (mode === 'menu') {
          logo(W / 2, 90, 0.7); const it = MENU(); panel(170, 168, 300, it.length * 38 + 26);
          it.forEach((s, i) => { const y = 196 + i * 38; if (i === menuI) { hud.fillStyle = 'rgba(255,210,58,.25)'; hud.fillRect(180, y - 16, 280, 32); } big(s, W / 2, y, 24, i === menuI ? '#ffd23a' : '#fff'); });
          pxc('STAGES REACHED ' + Math.min(5, prog.reach) + '/5   BADGES ' + nBadges() + '/9', W / 2, H - 30, '#fff', 2);
        } else if (mode === 'trial') {
          big('TRIAL', W / 2, 50, 40); panel(70, 90, W - 140, 330); const n = Math.min(5, prog.cheat ? 5 : Math.max(1, prog.reach + (prog.reach < 5 ? 1 : 0)));
          STAGES.forEach((sg, i) => { const y = 124 + i * 60, open = i < n, b = prog.best[sg.id]; if (i === subI) { hud.fillStyle = 'rgba(255,210,58,.25)'; hud.fillRect(84, y - 24, W - 168, 50); }
            big(open ? sg.name : '? ? ?', 100, y - 4, 24, i === subI ? '#ffd23a' : '#fff', 'left'); if (open && b) { px('BEST ' + (b.sc || 0) + '   ' + (b.t ? mt(b.t) : '--'), 110, y + 14, '#bcd8ff', 2); big(b.rk || '', W - 120, y, 34, b.rk === 'A' ? '#7aff7a' : '#ffd23a'); } });
          pxc(L('a') + ': GO    ' + L('b') + ': BACK', W / 2, H - 40, '#fff', 2);
        } else if (mode === 'opts') {
          big('OPTIONS', W / 2, 70, 40); panel(120, 130, W - 240, 170);
          [['MUSIC', prog.opt.mus ? 'ON' : 'OFF'], ['SPEED LINES', prog.opt.cam ? 'ON' : 'OFF'], ['BACK', '']].forEach(([a, b], i) => { big(a, 150, 170 + i * 46, 24, i === subI ? '#ffd23a' : '#fff', 'left'); if (b) big(b, W - 150, 170 + i * 46, 24, b === 'ON' ? '#7aff7a' : '#ff8a8a', 'right'); });
        } else if (mode === 'howto') {
          big('HOW TO PLAY', W / 2, 50, 40); panel(40, 90, W - 80, 340);
          const L1 = subI === 0 ? ['RUN: STICK. HOLD UP TO GO FASTER.', 'JUMP: ' + L('a') + '.  IN THE AIR, ' + L('a') + ' AGAIN = HOMING', 'ATTACK: ZIP FLIES AT THE NEAREST ROBOT', '(LOOK FOR THE TARGET MARK).', 'SPIN DASH: HOLD ' + L('b') + ', LET GO.', 'RAILS: LAND ON ONE TO GRIND. ' + L('a') + ' JUMPS OFF.', 'RAMPS: PRESS ' + L('a') + ' OR ' + L('b') + ' IN THE AIR FOR TRICKS.', 'RINGS KEEP YOU SAFE. NO RINGS + A HIT', '= A LIFE GONE.']
            : ['BLUE DASH PADS AND RED SPRINGS ZOOM YOU.', 'BREAK TV BOXES: RINGS, SHIELD, SHOES, 1-UP.', 'LAMP POSTS ARE CHECKPOINTS.', 'EVERY ROBOT HAS A CRITTER INSIDE. FREE', 'THEM, THEN VISIT THE CHUM GARDEN: CARRY', 'FRUIT AND CRITTERS TO YOUR CHUMS. ' + L('b') + ' = PAT.', 'KEYS: Z = ' + L('a') + '   X = ' + L('b') + '   ENTER = START', 'IT SAVES TO THE MEMORY CARD AS YOU GO.'];
          L1.forEach((s, i) => px(s, 64, 112 + i * 34, '#fff', 2)); pxc((subI + 1) + '/2   PRESS ' + L('a'), W / 2, H - 34, '#bcd8ff', 2);
        } else if (mode === 'records') {
          big('RECORDS', W / 2, 50, 40); panel(90, 90, W - 180, 360);
          records().forEach((r, i) => { px((i + 1) + '. ' + r.n, 120, 112 + i * 30, r.mate ? '#fff' : '#7aff7a', 2); px(String(r.s).padStart(6, ' '), W - 230, 112 + i * 30, '#ffd23a', 2); });
          pxc('BADGES ' + nBadges() + '/9   CRITTERS ' + prog.animals + '   CHUMS ' + prog.chums.length, W / 2, 380, '#bcd8ff', 2);
        } else if (mode === 'story') {
          hud.fillStyle = 'rgba(0,10,40,.82)'; hud.fillRect(0, 0, W, H); big((adv ? 'STAGE ' + (stageI + 1) + ': ' : '') + STAGES[stageI].name, W / 2, 120, 32);
          STAGES[stageI].story.forEach((s, i) => pxc(s, W / 2, 190 + i * 30, '#fff', 2)); if (storyT > 0.6 && (K.t * 2 | 0) % 2) big('PRESS ' + L('a'), W / 2, 380, 26, '#fff');
        } else if (mode === 'loading') {
          hud.fillStyle = '#000'; hud.fillRect(0, 0, W, H); const a = K.t * 6; for (let i = 0; i < 8; i++) { hud.globalAlpha = (i + 1) / 8; ringIcon(W - 80 + Math.cos(a - i * 0.3) * 24, H - 70 + Math.sin(a - i * 0.3) * 24, 9); } hud.globalAlpha = 1;
          big('NOW LOADING...', W - 140, H - 70, 26, '#fff', 'right'); pxc(['TIP: HOLD ' + L('b') + ' FOR A SPIN DASH.', 'TIP: ' + L('a') + ' TWICE TO HOME IN ON ROBOTS.', 'TIP: LAMP POSTS SAVE YOUR PLACE.', 'TIP: TRICKS OFF RAMPS SCORE BIG.', 'TIP: KEEP ONE RING AND YOU CAN NOT LOSE A LIFE.'][stageI % 5], W / 2, 200, '#bcd8ff', 2);
        } else if (mode === 'garden') {
          big('CHUM GARDEN', W / 2, 36, 28); GD.chums.forEach((ch, i) => { const x = 30 + i * 200; panel(x, 64, 180, 52, 0.6); px(ch.c.name, x + 12, 74, '#fff', 2); for (let k = 0; k < 10; k++) { hud.fillStyle = k < ch.c.joy ? '#ff5a9a' : 'rgba(255,255,255,.25)'; hud.beginPath(); hud.arc(x + 20 + k * 15, 102, 5, 0, 7); hud.fill(); } });
          px('CRITTERS IN THE CRATE: ' + prog.animals, 30, H - 60, '#fff', 2); px(GD.carry ? 'CARRYING: ' + (GD.carry === 'fruit' ? 'FRUIT' : 'A CRITTER') + '. TAKE IT TO A CHUM!' : 'FRUIT IS UNDER THE TREE. ' + L('b') + ' PATS A CHUM.', 30, H - 36, '#ffd23a', 2); px('START: LEAVE', W - 170, 20, '#fff', 2);
          if (msgT > 0) pxc(msg, W / 2, 150, '#fff', 3);
        } else drawPlay();
        if (savingT > 0) drawVM();
      }
      function drawVM() { // the memory card saving screen
        const x = W - 170, y = 20; panel(x - 10, y - 6, 160, 96, 0.85);
        hud.fillStyle = '#d8d8e0'; hud.fillRect(x, y + 6, 46, 70); hud.fillStyle = '#9aa0b0'; hud.fillRect(x, y + 66, 46, 10); hud.fillStyle = '#8ab878'; hud.fillRect(x + 6, y + 12, 34, 26);
        hud.fillStyle = '#20301a'; const f = (K.t * 4 | 0) % 2; for (const [a, b] of [[14, 18], [20, 16], [26, 18], [18, 24], [24, 24], [16 + f * 6, 30]]) hud.fillRect(x + a, y + b, 4, 4);
        hud.fillStyle = '#e02828'; hud.beginPath(); hud.arc(x + 14, y + 52, 5, 0, 7); hud.fill(); hud.fillStyle = '#2a2a34'; hud.fillRect(x + 26, y + 48, 12, 4);
        px('SAVING', x + 56, y + 14, '#fff', 2); px('MEMORY', x + 56, y + 38, '#ffd23a', 1); px('UNIT A-1', x + 56, y + 50, '#ffd23a', 1); px('DO NOT', x + 56, y + 66, '#bcd', 1); px('UNPLUG', x + 56, y + 76, '#bcd', 1);
      }
      function drawPlay() {
        if (mode === 'attract') { if ((K.t * 2 | 0) % 2) big('DEMO', W / 2, 60, 30, '#fff'); big('PRESS START', W / 2, H - 50, 26, '#fff'); }
        const ringCol = rings === 0 && (K.t * 3 | 0) % 2 ? '#ff3a3a' : '#ffd23a';
        big('SCORE', 24, 30, 22, '#ffd23a', 'left'); px(String(Math.min(99999, score)).padStart(6, ' '), 130, 22, '#fff', 3);
        big('TIME', 24, 62, 22, '#ffd23a', 'left'); px(mt(lvT), 130, 54, '#fff', 3);
        ringIcon(40, 96, 12); big('RINGS', 60, 96, 22, ringCol, 'left'); px(String(rings), 156, 88, '#fff', 3);
        zipHead(42, H - 38, 18); px('ZIP ✕ ' + Math.max(0, lives), 74, H - 46, '#fff', 3);
        if (Pz.shield) { hud.strokeStyle = 'rgba(90,184,255,.9)'; hud.lineWidth = 3; hud.beginPath(); hud.arc(42, H - 38, 24, 0, 7); hud.stroke(); }
        if (Pz.shoes > 0) px('SHOES ' + Math.ceil(Pz.shoes), 74, H - 72, '#ff8a6a', 2);
        if (!SG.ring) { const f = Math.min(1, Pz.s / GOAL); hud.fillStyle = 'rgba(0,0,40,.45)'; hud.fillRect(W - 230, 24, 200, 10); hud.fillStyle = '#ffd23a'; hud.fillRect(W - 230, 24, 200 * f, 10); zipHead(W - 230 + 200 * f, 29, 9); if (CHASE && CHASE.on) { const cf = Math.max(0, (Pz.s - CHASE.d) / GOAL); hud.fillStyle = CHASE.kind === 'whale' ? '#2a4a8a' : '#fff'; hud.fillRect(W - 230 + 200 * cf - 4, 20, 8, 18); } }
        if (prog.opt.cam && Pz.v > 40 && mode === 'play') { hud.strokeStyle = 'rgba(255,255,255,.55)'; hud.lineWidth = 2; for (let i = 0; i < 10; i++) { const y = (i * 53 + K.frame * 37) % H, x = i % 2 ? 6 : W - 70; hud.beginPath(); hud.moveTo(x, y); hud.lineTo(x + 64, y); hud.stroke(); } }
        // the lock-on mark for the homing attack
        if (Pz.air && Pz.airJ && !Pz.homing && !Pz.ramp) { const tg = targetFor(); if (tg) { const th = tg === BOSS ? BOSS.h : (tg.h || 0) + 0.8; at(tg.s, tg.u, th, c2); c2.p.project(cam); if (c2.p.z < 1) { const sx = (c2.p.x + 1) / 2 * W, sy = (1 - c2.p.y) / 2 * H, r = 22 + Math.sin(K.t * 20) * 3; hud.save(); hud.strokeStyle = '#ff3a3a'; hud.lineWidth = 3; hud.beginPath(); hud.arc(sx, sy, r, 0, 7); hud.stroke(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + K.t * 3; hud.beginPath(); hud.moveTo(sx + Math.cos(a) * (r - 8), sy + Math.sin(a) * (r - 8)); hud.lineTo(sx + Math.cos(a) * (r + 8), sy + Math.sin(a) * (r + 8)); hud.stroke(); } hud.restore(); } } }
        if (BOSS.on) { panel(W / 2 - 150, H - 56, 300, 40, 0.7); px('CHROME CRUSHER', W / 2 - 130, H - 46, '#fff', 2); for (let i = 0; i < 6; i++) { hud.fillStyle = i < BOSS.hp ? '#ff3a3a' : '#3a1a1a'; hud.fillRect(W / 2 + 30 + i * 18, H - 48, 14, 16); } }
        if (msgT > 0) big(msg, W / 2, 150, msg.length > 14 ? 30 : 44, '#ffd23a');
        if (flash > 0) { hud.fillStyle = `rgba(255,255,255,${Math.min(0.6, flash)})`; hud.fillRect(0, 0, W, H); }
        if (paused) { hud.fillStyle = 'rgba(0,0,40,.55)'; hud.fillRect(0, 0, W, H); big('PAUSE', W / 2, 140, 48); panel(W / 2 - 150, 200, 300, 150); ['RESUME', 'RESTART STAGE', 'QUIT TO MENU'].forEach((s, i) => big(s, W / 2, 232 + i * 44, 24, i === pauseI ? '#ffd23a' : '#fff')); }
        if (mode === 'tally' && tally) {
          panel(100, 96, W - 200, 300); big('ZIP GOT THROUGH', W / 2, 130, 30); big(SG.name, W / 2, 168, 26, '#fff');
          const Ls = [['TIME', mt(tally.time)], ['TIME BONUS', tally.tb], ['RING BONUS', tally.rb], ['STAGE SCORE', tally.st]];
          Ls.forEach(([a, b], i) => { if (tally.t > 0.3 * i) { px(a, 140, 204 + i * 32, '#fff', 3); const s = String(b); px(s, W - 140 - F.width(s, 3), 204 + i * 32, '#ffd23a', 3); } });
          if (tally.t > 1.5) { big('RANK', W / 2 - 50, 352, 30, '#fff'); big(tally.rk, W / 2 + 50, 352, 52 + Math.max(0, 1.8 - tally.t) * 40, tally.rk === 'A' ? '#7aff7a' : '#ffd23a'); }
          if (tally.t > 2.4 && (K.t * 2 | 0) % 2) pxc('PRESS ' + L('a'), W / 2, 410, '#fff', 2);
        }
        if (mode === 'over') { hud.fillStyle = 'rgba(0,0,0,.6)'; hud.fillRect(0, 0, W, H); big('GAME OVER', W / 2, H / 2, 56, '#ff6a4a', 'center', '#3a0000'); }
        if (mode === 'ending') {
          if (endT < 7) { big('YOU DID IT!', W / 2, 90, 44); ['DOCTOR CHROMEDOME ESCAPES IN A TINY POD,', 'SHAKING HIS FIST. THE CRITTERS ARE FREE', 'AND THE CHUMS HAVE NEW FRIENDS.'].forEach((s, i) => pxc(s, W / 2, 150 + i * 28, '#fff', 2)); }
          else { const C = ['ZIP ADVENTURE', '', 'STARRING', 'ZIP THE HEDGEHOG', '', 'AND', 'DOCTOR CHROMEDOME', 'THE CHROME CRUSHER', 'ONE VERY BIG ROBOT WHALE', '', 'CHUMS', 'MOCHI  PIP  BLOB', '', 'PLAY TESTERS', 'DAVE  LUKE  CALLUM  JACKK', '', 'SANDWICHES', 'MOM', '', 'THANK YOU FOR PLAYING!', '(C) 1999 ZIP TEAM']; const y0 = H + 10 - (endT - 7) * 40; C.forEach((s, i) => { const y = y0 + i * 34; if (y > -20 && y < H + 20) (i === 0 || C[i - 1] === '' ? big(s, W / 2, y, 28) : pxc(s, W / 2, y, '#fff', 2)); }); }
          if (endT > 5) px('START: SKIP', W - 170, H - 24, 'rgba(255,255,255,.7)', 2);
        }
      }

      // ================================================================ draw, and off we go
      function draw() { T3.render(); drawHud(); }
      buildStage(0); resetZip(6); music('title');
      window.__dashDbg = { get mode() { return mode; }, get P() { return Pz; }, get score() { return score; }, get rings() { return rings; }, get stage() { return SG && SG.id; }, prog, BOSS, get LEN() { return LEN; }, get GOAL() { return GOAL; }, get CHASE() { return CHASE; }, SEGS: () => SEGS, BOTS: () => BOTS, GD,
        go(i) { adv = true; stageI = i; loadStage(); beginPlay(); }, tp(s) { Pz.s = s; camInit = false; }, setMode(m) { mode = m; }, garden() { mode = 'garden'; gardenBuild(); },
        view(kind, ang, dist, h, look, s) { mode = 'view'; const m = kind === 'zip' ? ZIP.root : new T.Mesh(kind === 'whale' ? whaleModel() : kind.startsWith('mon_') ? monModel(kind.slice(4)) : model(kind), shiny()); if (m !== ZIP.root) { at(6, 0, 0, c1); m.position.copy(c1.p); m.scale.setScalar(s || 1); SG_.add(m); ZIP.root.visible = false; } else { at(6, 0, 0, c1); orient(ZIP.root, c1); ZIP.root.visible = true; } const p = m.position; cam.up.set(0, 1, 0); cam.position.set(p.x + Math.sin(ang) * dist, p.y + h, p.z + Math.cos(ang) * dist); cam.lookAt(p.x, p.y + look, p.z); return 1; } };
      return { update(dt) { if (mode === 'view') { hud.clearRect(0, 0, W, H); return; } update(dt); }, draw() { if (mode === 'view') { T3.render(); return; } draw(); }, end() { for (const m of ownMats) m.dispose(); disposeStage(); } };
    },
  });
})();

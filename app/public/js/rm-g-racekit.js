/* rm-g-racekit: shared bits for the racing games in Jack's room (KART KAOS 64, ANTI-GRAV 3000, MAD MINICAB).
 * Loaded on demand by those games (Apps.load). Everything is built from scratch with three.js:
 *   RoomRK.loop(T, pts, step)        a closed Catmull-Rom track: pts [[x, z, y?, width?, bank?], ...] resampled every `step`
 *        -> { N, P, D, R, U, W, S, L, C (curvature), nearest(x, z, hint, win) -> i, lat(i, x, z), at(i, lat, h) -> Vector3 }
 *   RoomRK.strip(T, L, a, b, o)      a ribbon along the track between lateral offsets a and b (numbers, or fn(i) -> number)
 *        o: { ya, yb (heights along U), v (texture metres per repeat), u0, u1, from, to (index range) }
 *   RoomRK.merge(T, parts)           [{ geo, m: Matrix4, c: Color|hex }] -> one BufferGeometry with vertex colours
 *   RoomRK.tex2(T3, w, h, paint)     a canvas texture (just T3.tex), RoomRK.mtof(m)
 *   RoomRK.kart(T, col, helmet) / RoomRK.ship(T, col, trim) / RoomRK.car(T, col)   low-poly models as one geometry */
(function () {
  'use strict';
  if (window.RoomRK) return;
  const RK = window.RoomRK = {};
  RK.mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  RK.loop = function (T, pts, step) {
    const n = pts.length, dense = [];
    const g = (i, k) => { const p = pts[((i % n) + n) % n]; return k < p.length ? p[k] : [0, 0, 0, 12, 0][k]; };
    for (let i = 0; i < n; i++) for (let s = 0; s < 24; s++) {
      const t = s / 24, t2 = t * t, t3 = t2 * t;
      const cr = k => 0.5 * ((2 * g(i, k)) + (-g(i - 1, k) + g(i + 1, k)) * t + (2 * g(i - 1, k) - 5 * g(i, k) + 4 * g(i + 1, k) - g(i + 2, k)) * t2 + (-g(i - 1, k) + 3 * g(i, k) - 3 * g(i + 1, k) + g(i + 2, k)) * t3);
      const lin = k => g(i, k) + (g(i + 1, k) - g(i, k)) * (t * t * (3 - 2 * t));
      dense.push([cr(0), cr(1), cr(2), lin(3), lin(4)]);
    }
    // resample at an even spacing
    const cum = [0]; for (let i = 1; i <= dense.length; i++) { const a = dense[i - 1], b = dense[i % dense.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); }
    const total = cum[dense.length], N = Math.max(8, Math.round(total / step)), st = total / N;
    const P = [], W = [], B = [], S = [];
    let j = 0;
    for (let i = 0; i < N; i++) {
      const d = i * st; while (cum[j + 1] < d) j++;
      const a = dense[j], b = dense[(j + 1) % dense.length], f = (d - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
      P.push(new T.Vector3(a[0] + (b[0] - a[0]) * f, a[2] + (b[2] - a[2]) * f, a[1] + (b[1] - a[1]) * f));
      W.push(a[3] + (b[3] - a[3]) * f); B.push(a[4] + (b[4] - a[4]) * f); S.push(d);
    }
    const D = [], R = [], U = [], C = [];
    const up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < N; i++) {
      const d = P[(i + 1) % N].clone().sub(P[(i + N - 1) % N]).normalize(); D.push(d);
      const flat = new T.Vector3(-d.z, 0, d.x).normalize(); // right, on the level
      const u = new T.Vector3().crossVectors(flat, d).normalize(); // up, square to the slope
      if (u.y < 0) u.negate();
      const bk = B[i] * Math.PI / 180;
      const r = flat.clone().multiplyScalar(Math.cos(bk)).addScaledVector(u, Math.sin(bk));
      const uu = new T.Vector3().crossVectors(r, d).normalize(); if (uu.y < 0) uu.negate();
      R.push(r); U.push(uu);
    }
    for (let i = 0; i < N; i++) { const a = D[(i + N - 2) % N], b = D[(i + 2) % N]; const ang = Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z); C.push(ang / (4 * st)); } // signed turn per metre
    const L = {
      N, P, D, R, U, W, S, C, L: total, step: st,
      wrap: i => ((i % N) + N) % N,
      nearest(x, z, hint, win) {
        let best = 0, bd = Infinity;
        if (hint == null || win == null || win >= N / 2) { for (let i = 0; i < N; i++) { const p = P[i], dd = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z); if (dd < bd) { bd = dd; best = i; } } return best; }
        for (let k = -win; k <= win; k++) { const i = ((hint + k) % N + N) % N, p = P[i], dd = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z); if (dd < bd) { bd = dd; best = i; } }
        return best;
      },
      lat(i, x, z) { const p = P[i], r = R[i]; const fx = new T.Vector3(r.x, 0, r.z).normalize(); return (x - p.x) * fx.x + (z - p.z) * fx.z; },
      along(i, x, z) { const p = P[i], d = D[i]; return (x - p.x) * d.x + (z - p.z) * d.z; },
      at(i, lat, h, out) { i = L.wrap(i); out = out || new T.Vector3(); return out.copy(P[i]).addScaledVector(R[i], lat).addScaledVector(U[i], h || 0); },
      // a smooth point along the track at a fractional index
      atf(fi, lat, h, out) { const i0 = Math.floor(fi), f = fi - i0, a = L.wrap(i0), b = L.wrap(i0 + 1); out = out || new T.Vector3();
        const pa = P[a], pb = P[b]; out.set(pa.x + (pb.x - pa.x) * f, pa.y + (pb.y - pa.y) * f, pa.z + (pb.z - pa.z) * f);
        const r = R[a].clone().lerp(R[b], f), u = U[a].clone().lerp(U[b], f); return out.addScaledVector(r, lat).addScaledVector(u, h || 0); },
    };
    return L;
  };

  RK.strip = function (T, L, a, b, o) {
    o = o || {};
    const from = o.from || 0, to = o.to == null ? L.N : o.to, closed = o.to == null && !o.from;
    const val = (f, i) => typeof f === 'function' ? f(i) : f;
    const pos = [], uv = [], idx = [];
    const cnt = closed ? L.N + 1 : (to - from + 1);
    const vlen = o.v || 10;
    for (let k = 0; k < cnt; k++) {
      const i = L.wrap(from + k), dist = closed && k === L.N ? L.L : (L.S[i] - (closed ? 0 : L.S[L.wrap(from)]) + (L.S[i] < L.S[L.wrap(from)] ? L.L : 0));
      for (const [lat, y, u] of [[val(a, i), val(o.ya || 0, i), o.u0 == null ? 0 : o.u0], [val(b, i), val(o.yb == null ? (o.ya || 0) : o.yb, i), o.u1 == null ? 1 : o.u1]]) {
        const p = L.at(i, lat, y); pos.push(p.x, p.y, p.z); uv.push(u, dist / vlen);
      }
      if (k < cnt - 1) { const q = k * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    // face the right way: the ribbon's normals should point along the track's up (walls: the inside)
    const nn = geo.attributes.normal, i0 = L.wrap(from), u = L.U[i0];
    const want = o.face ? L.R[i0].clone().multiplyScalar(o.face) : u;
    if (nn.getX(0) * want.x + nn.getY(0) * want.y + nn.getZ(0) * want.z < 0) {
      for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
      geo.setIndex(idx); geo.computeVertexNormals();
    }
    return geo;
  };

  RK.merge = function (T, parts) {
    const pos = [], nor = [], col = [], uv = [];
    const c = new T.Color();
    for (const p of parts) {
      let g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
      if (p.m) g.applyMatrix4(p.m);
      if (!g.attributes.normal) g.computeVertexNormals();
      const P = g.attributes.position.array, Nn = g.attributes.normal.array, Uv = g.attributes.uv ? g.attributes.uv.array : null;
      c.set(p.c == null ? 0xffffff : p.c);
      for (let i = 0; i < P.length; i++) { pos.push(P[i]); nor.push(Nn[i]); }
      for (let i = 0; i < P.length / 3; i++) { col.push(c.r, c.g, c.b); uv.push(Uv ? Uv[i * 2] : 0, Uv ? Uv[i * 2 + 1] : 0); }
      g.dispose();
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    return geo;
  };
  const M = (T, x, y, z, ry, sx, sy, sz, rx, rz) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx || 1, sy || 1, sz || 1));
  RK.M = M;

  // a kart (faces +z): tub, seat, engine, four fat wheels, a driver with a helmet
  RK.kart = function (T, col, helmet) {
    const box = (w, h, d) => new T.BoxGeometry(w, h, d), cyl = (r, h) => new T.CylinderGeometry(r, r, h, 10), ball = r => new T.SphereGeometry(r, 8, 6);
    const dark = 0x222222, P = [];
    P.push({ geo: box(1.9, 0.35, 3.0), m: M(T, 0, 0.45, 0), c: col });
    P.push({ geo: box(1.5, 0.3, 0.8), m: M(T, 0, 0.55, 1.6, 0.25), c: col });        // nose
    P.push({ geo: box(2.2, 0.25, 0.45), m: M(T, 0, 0.45, 1.85), c: 0xdddddd });       // front bumper
    P.push({ geo: box(1.0, 0.5, 0.8), m: M(T, 0, 0.75, -0.9), c: 0x333333 });         // engine
    P.push({ geo: box(0.9, 0.7, 0.2), m: M(T, 0, 0.95, -0.35, 0, 1, 1, 1, -0.3), c: 0x444444 }); // seat back
    P.push({ geo: cyl(0.12, 1.0), m: M(T, -0.35, 0.95, -1.5, 0, 1, 1, 1, Math.PI / 2), c: 0x888888 }); // exhausts
    P.push({ geo: cyl(0.12, 1.0), m: M(T, 0.35, 0.95, -1.5, 0, 1, 1, 1, Math.PI / 2), c: 0x888888 });
    for (const [x, z, r] of [[-1.05, 1.05, 0.42], [1.05, 1.05, 0.42], [-1.1, -1.05, 0.5], [1.1, -1.05, 0.5]]) {
      P.push({ geo: cyl(r, 0.5), m: M(T, x, r, z, 0, 1, 1, 1, 0, Math.PI / 2), c: dark });
      P.push({ geo: cyl(r * 0.5, 0.52), m: M(T, x, r, z, 0, 1, 1, 1, 0, Math.PI / 2), c: 0xcccccc });
    }
    P.push({ geo: box(0.8, 0.6, 0.5), m: M(T, 0, 1.05, 0), c: col });               // body
    P.push({ geo: ball(0.42), m: M(T, 0, 1.6, 0.05), c: helmet == null ? 0xffffff : helmet }); // helmet
    P.push({ geo: box(0.55, 0.16, 0.12), m: M(T, 0, 1.62, 0.42), c: 0x111111 });    // visor
    P.push({ geo: cyl(0.04, 1.0), m: M(T, 0, 0.95, 0.75, 0, 1, 1, 1, 0.9), c: 0x333333 }); // steering column
    return RK.merge(T, P);
  };
  // an anti-gravity racer (faces +z): a long wedge with fins and glowing engines
  RK.ship = function (T, col, trim) {
    const P = [];
    const g = new T.BufferGeometry();
    const v = [ // a wedge: nose at +z
      0, 0.15, 3.2, -1.2, 0.0, -1.6, 1.2, 0.0, -1.6, // bottom
      0, 0.15, 3.2, 1.2, 0.0, -1.6, 0, 0.75, -1.2,
      0, 0.15, 3.2, 0, 0.75, -1.2, -1.2, 0.0, -1.6,
      -1.2, 0.0, -1.6, 0, 0.75, -1.2, 1.2, 0.0, -1.6,
    ];
    g.setAttribute('position', new T.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
    P.push({ geo: g, c: col });
    P.push({ geo: new T.BoxGeometry(3.4, 0.12, 1.0), m: M(T, 0, 0.1, -1.0), c: trim });   // wings
    P.push({ geo: new T.BoxGeometry(0.12, 0.7, 0.9), m: M(T, -1.65, 0.4, -1.3), c: col });
    P.push({ geo: new T.BoxGeometry(0.12, 0.7, 0.9), m: M(T, 1.65, 0.4, -1.3), c: col });
    P.push({ geo: new T.BoxGeometry(0.5, 0.22, 0.9), m: M(T, 0, 0.55, 0.3), c: 0x2a3a5a }); // cockpit
    P.push({ geo: new T.BoxGeometry(0.5, 0.35, 0.3), m: M(T, -0.6, 0.25, -1.65), c: 0xffb040 });
    P.push({ geo: new T.BoxGeometry(0.5, 0.35, 0.3), m: M(T, 0.6, 0.25, -1.65), c: 0xffb040 });
    return RK.merge(T, P);
  };
  // a boxy 1999 minicab or a car for the traffic (faces +z)
  RK.car = function (T, col, cab) {
    const P = [], box = (w, h, d) => new T.BoxGeometry(w, h, d), cyl = (r, h) => new T.CylinderGeometry(r, r, h, 10);
    P.push({ geo: box(2.0, 0.7, 4.2), m: M(T, 0, 0.7, 0), c: col });
    P.push({ geo: box(1.8, 0.62, 2.2), m: M(T, 0, 1.36, -0.25), c: col });
    P.push({ geo: box(1.82, 0.42, 2.0), m: M(T, 0, 1.38, -0.25), c: 0x4a6a8a });      // windows
    P.push({ geo: box(2.02, 0.2, 0.2), m: M(T, 0, 0.55, 2.12), c: 0xcccccc });
    P.push({ geo: box(0.4, 0.2, 0.05), m: M(T, -0.65, 0.8, 2.11), c: 0xffffcc });
    P.push({ geo: box(0.4, 0.2, 0.05), m: M(T, 0.65, 0.8, 2.11), c: 0xffffcc });
    P.push({ geo: box(0.4, 0.2, 0.05), m: M(T, -0.65, 0.8, -2.11), c: 0xcc2222 });
    P.push({ geo: box(0.4, 0.2, 0.05), m: M(T, 0.65, 0.8, -2.11), c: 0xcc2222 });
    for (const [x, z] of [[-1.0, 1.35], [1.0, 1.35], [-1.0, -1.35], [1.0, -1.35]]) P.push({ geo: cyl(0.38, 0.3), m: M(T, x, 0.38, z, 0, 1, 1, 1, 0, Math.PI / 2), c: 0x1a1a1a });
    if (cab) { P.push({ geo: box(0.9, 0.3, 0.5), m: M(T, 0, 1.82, -0.2), c: 0xffe14a }); P.push({ geo: box(0.92, 0.12, 0.52), m: M(T, 0, 1.75, -0.2), c: 0x222222 }); }
    return RK.merge(T, P);
  };
  // ================================================================ additions (round 36): all new, nothing above changed
  // RoomRK.loft(T, secs)              a hull from cross-sections [{ z, p: [[x, y], ...] }] (same count each), capped, faceted
  // RoomRK.kart2(T, o)                a better kart with a proper driver: o { col, col2, skin, kind: kid|grot|dog|cat, hair, cap, helmet, shirt, num, low? }
  // RoomRK.ship2(T, o)                an anti-grav racer by design: o { col, trim, kind: 0..4, glow } -> { body, glow } geometries
  // RoomRK.sky(T3, o)                 a sky dome with a painted panorama: o { r, grad: [[stop, css]...], paint(g, w, h, horizonY) } -> mesh (.follow(cam))
  // RoomRK.fx(T3, o)                  particles in one draw call (own size + fade each): o { n, add, square, scale, maxPx? } -> { emit(...), update(dt), clear(), active (read-only) }
  // RoomRK.ghost                      .rec() -> { add(dt, x, y, z, yaw), str() } and .play(str) -> { len, at(t, out) } (a time-trial ghost, 10 samples a second)
  // RoomRK.dither(g, w, h, bits)      ordered (Bayer) dither + colour depth cut on a canvas: the PlayStation look
  RK.loft = function (T, secs) {
    const pos = [], n = secs[0].p.length;
    const V = (s, k) => { const q = secs[s].p[k % n]; return [q[0], q[1], secs[s].z]; };
    const tri = (a, b, c) => pos.push(...a, ...b, ...c);
    for (let s = 0; s < secs.length - 1; s++) for (let k = 0; k < n; k++) {
      const a = V(s, k), b = V(s, k + 1), c = V(s + 1, k + 1), d = V(s + 1, k);
      tri(a, d, c); tri(a, c, b);
    }
    const cap = (s, flip) => { const c = [0, 0, secs[s].z]; for (const q of secs[s].p) { c[0] += q[0] / n; c[1] += q[1] / n; } for (let k = 0; k < n; k++) { const a = V(s, k), b = V(s, k + 1); flip ? tri(c, a, b) : tri(c, b, a); } };
    cap(0, false); cap(secs.length - 1, true);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    // (make sure the faces point outwards: if the first one points in, flip them all)
    const P = g.attributes.position.array, N0 = g.attributes.normal.array;
    let cx = 0, cy = 0, cz = 0; for (let i = 0; i < P.length; i += 3) { cx += P[i]; cy += P[i + 1]; cz += P[i + 2]; } const m = P.length / 3; cx /= m; cy /= m; cz /= m;
    let out = 0; for (let i = 0; i < P.length; i += 9) { const mx = (P[i] + P[i + 3] + P[i + 6]) / 3 - cx, my = (P[i + 1] + P[i + 4] + P[i + 7]) / 3 - cy, mz = (P[i + 2] + P[i + 5] + P[i + 8]) / 3 - cz; out += mx * N0[i] + my * N0[i + 1] + mz * N0[i + 2]; }
    if (out < 0) { for (let i = 0; i < P.length; i += 9) for (let k = 0; k < 3; k++) { const t = P[i + 3 + k]; P[i + 3 + k] = P[i + 6 + k]; P[i + 6 + k] = t; } g.computeVertexNormals(); }
    return g;
  };
  const rr = (w, h, x, y) => [[-w / 2 + x, -h / 2 + y], [w / 2 + x, -h / 2 + y], [w / 2 + x, h / 2 + y], [-w / 2 + x, h / 2 + y]]; // a rectangle section
  const oct = (w, h, b, y) => { b = b || 0.3; return [[-w / 2 * (1 - b), -h / 2 + y], [w / 2 * (1 - b), -h / 2 + y], [w / 2, -h / 2 * (1 - b) + y], [w / 2, h / 2 * (1 - b) + y], [w / 2 * (1 - b), h / 2 + y], [-w / 2 * (1 - b), h / 2 + y], [-w / 2, h / 2 * (1 - b) + y], [-w / 2, -h / 2 * (1 - b) + y]]; };

  RK.kart2 = function (T, o) {
    o = o || {}; const low = !!o.low;
    const col = o.col == null ? 0xd82a1a : o.col, col2 = o.col2 == null ? 0xffffff : o.col2, skin = o.skin == null ? 0xf0c090 : o.skin;
    const box = (w, h, d) => new T.BoxGeometry(w, h, d), cyl = (r, h, s) => new T.CylinderGeometry(r, r, h, low ? Math.min(s || 12, 6) : (s || 12)), ball = (r, a, b) => new T.SphereGeometry(r, low ? Math.min(a || 10, 6) : (a || 10), low ? Math.min(b || 8, 4) : (b || 8));
    const P = [], add = (geo, m, c) => P.push({ geo, m, c });
    const dark = 0x1c1c22, chrome = 0xc8ccd4;
    // the body: a lofted tub with a pointy nose
    add(RK.loft(T, [{ z: 2.15, p: oct(1.0, 0.28, 0.4, 0.42) }, { z: 1.5, p: oct(1.4, 0.42, 0.35, 0.47) }, { z: 0.6, p: oct(1.75, 0.55, 0.3, 0.52) }, { z: -0.9, p: oct(1.8, 0.62, 0.3, 0.55) }, { z: -1.45, p: oct(1.5, 0.5, 0.3, 0.55) }]), null, col);
    add(box(2.3, 0.18, 0.5), M(T, 0, 0.36, 2.0), col2);                       // front bumper
    // Solid number plaques on both bumpers; chunky digits survive a 320x240 picture.
    for (const z of [2.27, -1.98]) {
      add(box(0.56, 0.38, 0.08), M(T, 0, 0.55, z), 0xfff4d8);
      if (o.num) {
        const digits = ['1111110', '0110000', '1101101', '1111001', '0110011', '1011011', '1011111', '1110000', '1111111'];
        const bars = [[0,.12,.2,.045],[.1,.06,.045,.12],[.1,-.06,.045,.12],[0,-.12,.2,.045],[-.1,-.06,.045,.12],[-.1,.06,.045,.12],[0,0,.2,.045]];
        bars.forEach(([x,y,w,h],i) => { if (digits[o.num % 9][i] === '1') add(box(w,h,.02), M(T,x*Math.sign(z),.55+y,z+Math.sign(z)*.051),0x18243a); });
      }
    }
    add(box(2.2, 0.16, 0.42), M(T, 0, 0.42, -1.75), col2);                    // rear bumper
    add(box(1.95, 0.08, 1.7), M(T, 0, 0.3, -0.1), 0x2a2a30);                  // floor pan
    for (const s of [-1, 1]) add(box(0.32, 0.36, 1.5), M(T, s * 0.98, 0.5, 0.1), col2); // side pods
    add(box(1.0, 0.45, 0.7), M(T, 0, 0.77, -1.15), 0x34343c);                 // engine
    add(box(1.1, 0.1, 0.8), M(T, 0, 1.02, -1.15), 0x55555e);
    for (let f = 0; !low && f < 4; f++) add(box(.9,.035,.055), M(T,0,1.085,-1.43+f*.18),chrome);
    add(cyl(.075,2.15,6), M(T,0,.48,-1.05,0,1,1,1,0,Math.PI/2),chrome); // rear axle
    // Boots sit in the footwell, with the knees connected to the seat.
    for (const side of [-1,1]) {
      add(box(.24,.25,.55),M(T,side*.26,.86,.16,0,1,1,1,-.18),0x293557);
      add(box(.27,.18,.4),M(T,side*.26,.7,.57),dark);
    }
    for (const s of [-1, 1]) add(cyl(0.11, 0.9, 8), M(T, s * 0.34, 0.92, -1.75, 0, 1, 1, 1, Math.PI / 2 - 0.2), chrome); // exhausts
    add(box(0.95, 0.55, 0.22), M(T, 0, 0.9, -0.55, 0, 1, 1, 1, -0.28), dark); // seat back
    add(box(0.95, 0.16, 0.7), M(T, 0, 0.72, -0.25), dark);                    // seat
    add(cyl(0.05, 0.75, 6), M(T, 0, 0.92, 0.7, 0, 1, 1, 1, 0.95), 0x333333);   // steering column
    add(new T.TorusGeometry(0.26, 0.05, low ? 3 : 5, low ? 8 : 12), M(T, 0, 1.16, 0.42, 0, 1, 1, 1, -0.65), 0x222222); // steering wheel
    // wheels: fat rubber, coloured hubs
    for (const [x, z, r, w] of [[-1.08, 1.25, 0.4, 0.42], [1.08, 1.25, 0.4, 0.42], [-1.12, -1.05, 0.5, 0.58], [1.12, -1.05, 0.5, 0.58]]) {
      add(cyl(r, w, 12), M(T, x, r, z, 0, 1, 1, 1, 0, Math.PI / 2), dark);
      add(cyl(r * 0.55, w + 0.04, 8), M(T, x, r, z, 0, 1, 1, 1, 0, Math.PI / 2), o.hub == null ? chrome : o.hub);
      add(cyl(r * 0.2, w + 0.08, 6), M(T, x, r, z, 0, 1, 1, 1, 0, Math.PI / 2), col);
    }
    // the driver
    const kind = o.kind || 'kid', shirt = o.shirt == null ? col : o.shirt;
    const hy = kind === 'grot' ? 1.62 : 1.78;
    add(box(0.78, 0.66, 0.5), M(T, 0, 1.18, -0.3, 0, 1, 1, 1, 0.1), shirt);   // body
    add(box(0.82, 0.14, 0.52), M(T, 0, 0.9, -0.28), o.belt == null ? 0x222244 : o.belt);
    for (const s of [-1, 1]) { add(box(0.18, 0.18, 0.62), M(T, s * 0.34, 1.26, 0.06, -s * 0.18, 1, 1, 1, 0.45), shirt); add(ball(0.12, 6, 5), M(T, s * 0.2, 1.17, 0.38), o.glove == null ? 0xffffff : o.glove); }
    add(cyl(0.13, 0.2, 8), M(T, 0, 1.56, -0.25), skin);                        // neck
    const headFrom = P.length;
    const eye = (x, y, z, s) => { add(box(0.13 * (s || 1), 0.16 * (s || 1), 0.05), M(T, x, y, z), 0xffffff); add(box(0.065 * (s || 1), 0.1 * (s || 1), 0.05), M(T, x, y - 0.01, z + 0.02), 0x101018); };
    if (kind === 'cat' || kind === 'dog' || kind === 'grot') {
      const fur = o.fur == null ? skin : o.fur;
      add(ball(0.42, 12, 9), M(T, 0, hy, -0.15, 0, 1, 0.92, 1), fur);
      if (kind === 'cat') {
        for (const s of [-1, 1]) { add(new T.ConeGeometry(0.16, 0.34, 4), M(T, s * 0.24, hy + 0.42, -0.18, 0, 1, 1, 1, 0, -s * 0.35), fur); add(new T.ConeGeometry(0.08, 0.2, 4), M(T, s * 0.24, hy + 0.4, -0.12, 0, 1, 1, 1, 0, -s * 0.35), 0xf0a0b0); }
        add(box(0.36, 0.2, 0.2), M(T, 0, hy - 0.12, 0.2), o.muzzle == null ? 0xf8f8f0 : o.muzzle); add(box(0.1, 0.07, 0.06), M(T, 0, hy - 0.04, 0.31), 0xf06a8a);
        for (const s of [-1, 1]) { add(box(0.15, 0.17, 0.05), M(T, s * 0.15, hy + 0.08, 0.36), 0xc8e83a); add(box(0.04, 0.14, 0.05), M(T, s * 0.15, hy + 0.08, 0.38), 0x101010); }
        for (const s of [-1, 1]) for (const k of [-1, 1]) add(box(0.32, 0.015, 0.015), M(T, s * 0.28, hy - 0.1 + k * 0.04, 0.27, 0, 1, 1, 1, 0, s * k * 0.15), 0xffffff); // whiskers
      } else if (kind === 'dog') {
        for (const s of [-1, 1]) add(box(0.14, 0.46, 0.26), M(T, s * 0.42, hy - 0.05, -0.18, 0, 1, 1, 1, 0, s * 0.25), o.ear == null ? 0x7a4a22 : o.ear);
        add(box(0.36, 0.26, 0.34), M(T, 0, hy - 0.12, 0.24), o.muzzle == null ? 0xe8c890 : o.muzzle); add(ball(0.08, 6, 5), M(T, 0, hy - 0.02, 0.42), 0x101010);
        eye(-0.15, hy + 0.1, 0.34); eye(0.15, hy + 0.1, 0.34);
        add(box(0.1, 0.03, 0.2), M(T, 0, hy - 0.3, 0.32), 0xe84a6a);
      } else { // a grot: big pointy ears, big grin, little pointy nose
        for (const s of [-1, 1]) add(new T.ConeGeometry(0.13, 0.85, 4), M(T, s * 0.62, hy + 0.12, -0.18, 0, 1, 1, 1, 0, -s * (Math.PI / 2 - 0.35)), fur);
        add(new T.ConeGeometry(0.08, 0.3, 4), M(T, 0, hy - 0.02, 0.44, 0, 1, 1, 1, Math.PI / 2), fur);
        for (const s of [-1, 1]) { add(box(0.15, 0.1, 0.05), M(T, s * 0.15, hy + 0.12, 0.37), 0xff3a1a); }
        add(box(0.42, 0.08, 0.06), M(T, 0, hy - 0.18, 0.37), 0x2a0a0a); add(box(0.36, 0.04, 0.07), M(T, 0, hy - 0.15, 0.38), 0xf8f8e0);
        add(cyl(0.3, 0.12, 8), M(T, 0, hy + 0.36, -0.15), o.cap == null ? 0x6a3a1a : o.cap); add(new T.ConeGeometry(0.22, 0.4, 8), M(T, 0, hy + 0.6, -0.15), o.cap == null ? 0x6a3a1a : o.cap);
      }
    } else { // a kid: a face, hair, a cap or a crash helmet
      add(ball(0.4, 12, 9), M(T, 0, hy, -0.15, 0, 1, 1.05, 1), skin);
      eye(-0.14, hy + 0.04, 0.22, 0.9); eye(0.14, hy + 0.04, 0.22, 0.9);
      add(box(0.18, 0.05, 0.05), M(T, 0, hy - 0.17, 0.22), 0x8a2a2a);
      if (o.glasses) { add(box(0.56, 0.05, 0.04), M(T, 0, hy + 0.05, 0.27), 0x222222); for (const s of [-1, 1]) add(new T.TorusGeometry(0.1, 0.025, 4, 8), M(T, s * 0.14, hy + 0.04, 0.27), 0x222222); }
      if (o.helmet != null) {
        add(new T.SphereGeometry(.46,low?8:12,low?4:7,0,Math.PI*2,0,Math.PI*.56), M(T,0,hy+.08,-.18),o.helmet);
        for (const side of [-1,1]) add(ball(.17,8,5),M(T,side*.36,hy-.03,-.14,0,.8,1,1),o.helmet);
        add(ball(.36,10,6),M(T,0,hy+.02,.17,0,1,.42,.4),o.visor == null ? 0x1a2a4a : o.visor);
        add(box(.25,.035,.025),M(T,-.06,hy+.08,.32),0xc8eeff);
        add(new T.SphereGeometry(.467,low?4:6,low?4:8,Math.PI/2-.1,.2,0,Math.PI*.56),M(T,0,hy+.08,-.18),col2);
      } else {
        // A top cap and rear hair leave the face visible, unlike a whole sphere over the eyes.
        add(new T.SphereGeometry(.425,low?8:12,low?4:6,0,Math.PI*2,0,Math.PI*.48),M(T,0,hy+.1,-.2,0,1,.8,1),o.hair == null ? 0x4a2a12 : o.hair);
        add(ball(.32,10,6),M(T,0,hy,-.35,0,1,.75,.55),o.hair == null ? 0x4a2a12 : o.hair);
        if (o.spiky) for (let k = 0; k < 5; k++) add(new T.ConeGeometry(0.1, 0.32, 4), M(T, (k - 2) * 0.15, hy + 0.42, -0.25 - Math.abs(k - 2) * 0.03, 0, 1, 1, 1, -0.5, (k - 2) * 0.25), o.hair == null ? 0x4a2a12 : o.hair);
        if (o.cap != null) { add(ball(0.43, 10, 5), M(T, 0, hy + 0.2, -0.17, 0, 1, 0.6, 1), o.cap); add(box(0.5, 0.05, 0.4), M(T, 0, hy + 0.2, 0.3), o.cap); add(box(0.14, 0.12, 0.05), M(T, 0, hy + 0.36, 0.22), 0xffffff); }
      }
    }
    { const c = new T.Vector3(0, hy - 0.1, -0.15), k = o.head || 1.2, S = new T.Matrix4().makeTranslation(c.x, c.y + 0.06, c.z).multiply(new T.Matrix4().makeScale(k, k, k)).multiply(new T.Matrix4().makeTranslation(-c.x, -c.y, -c.z));
      for (let n = headFrom; n < P.length; n++) P[n].m = S.clone().multiply(P[n].m || new T.Matrix4()); }
    if (o.flag) add(box(0.04, 1.1, 0.04), M(T, 0.62, 1.55, -1.5), 0x444444), add(box(0.04, 0.32, 0.5), M(T, 0.62, 1.95, -1.72), o.flag);
    const g = RK.merge(T, P); P.forEach(p => p.geo.dispose()); return g;
  };

  RK.ship2 = function (T, o) {
    o = o || {};
    const col = o.col == null ? 0xe8261c : o.col, trim = o.trim == null ? 0xffe14a : o.trim, glowC = o.glow == null ? 0x6ad8ff : o.glow, k = (o.kind | 0) % 5;
    const P = [], G = [], add = (geo, m, c) => P.push({ geo, m, c }), glow = (geo, m, c) => G.push({ geo, m, c: c == null ? glowC : c });
    const box = (w, h, d) => new T.BoxGeometry(w, h, d), dark = 0x22222a, canopy = o.canopy == null ? 0x4a8ae8 : o.canopy;
    const wedge = (w, h, len, y) => [{ z: len, p: oct(w * 0.12, h * 0.25, 0.4, y) }, { z: len * 0.55, p: oct(w * 0.55, h * 0.7, 0.35, y) }, { z: 0, p: oct(w, h, 0.3, y) }, { z: -len * 0.5, p: oct(w * 0.95, h * 0.9, 0.3, y) }];
    if (k === 0) { // DART: a long sharp nose, swept wings, twin fins
      add(RK.loft(T, wedge(1.5, 0.6, 3.4, 0.35)), null, col);
      add(RK.loft(T, [{ z: 0.9, p: rr(0.2, 0.1, 0, 0.3) }, { z: -1.2, p: rr(3.6, 0.14, 0, 0.25) }, { z: -1.8, p: rr(3.6, 0.12, 0, 0.25) }]), null, trim);
      add(RK.loft(T, [{ z: -0.2, p: oct(0.3, 0.2, 0.4, 0.72) }, { z: -1.4, p: oct(0.45, 0.4, 0.4, 0.8) }, { z: -1.9, p: oct(0.4, 0.35, 0.4, 0.78) }]), null, col);
      add(RK.loft(T, [{ z: -0.9, p: rr(0.08, 0.1, 0, 0.95) }, { z: -1.7, p: rr(0.1, 0.8, 0, 1.3) }, { z: -1.95, p: rr(0.1, 0.8, 0, 1.32) }]), null, trim);
      for (const s of [-1, 1]) { add(box(0.34, 0.3, 0.9), M(T, s * 0.72, 0.42, 0.2), dark); add(box(0.3, 0.04, 0.5), M(T, s * 1.0, 0.33, -1.0), 0xffffff); }
      for (const s of [-1, 1]) add(RK.loft(T, [{ z: -0.6, p: rr(0.08, 0.1, s * 1.55, 0.35) }, { z: -1.6, p: rr(0.1, 0.9, s * 1.6, 0.75) }, { z: -1.9, p: rr(0.1, 0.9, s * 1.62, 0.75) }]), null, col);
      add(RK.loft(T, [{ z: 1.3, p: oct(0.1, 0.05, 0.3, 0.6) }, { z: 0.6, p: oct(0.55, 0.3, 0.4, 0.7) }, { z: -0.2, p: oct(0.5, 0.25, 0.4, 0.7) }]), null, canopy);
      for (const s of [-1, 1]) { add(box(0.5, 0.42, 0.7), M(T, s * 0.5, 0.35, -1.95), dark); glow(box(0.36, 0.28, 0.2), M(T, s * 0.5, 0.35, -2.35)); }
    } else if (k === 1) { // TWIN: two pods joined by a wing, cockpit in the middle
      for (const s of [-1, 1]) add(RK.loft(T, [{ z: 2.6, p: oct(0.15, 0.15, 0.4, 0.3) }, { z: 1.6, p: oct(0.6, 0.55, 0.4, 0.35) }, { z: -1.4, p: oct(0.7, 0.6, 0.4, 0.35) }, { z: -1.9, p: oct(0.6, 0.5, 0.4, 0.35) }]).translate(s * 1.15, 0, 0), null, col);
      add(box(2.2, 0.12, 1.6), M(T, 0, 0.35, -0.3), trim);
      add(RK.loft(T, [{ z: 1.6, p: oct(0.1, 0.1, 0.3, 0.45) }, { z: 0.8, p: oct(0.7, 0.45, 0.4, 0.55) }, { z: -1.0, p: oct(0.7, 0.4, 0.4, 0.5) }]), null, col);
      add(RK.loft(T, [{ z: 0.9, p: oct(0.1, 0.05, 0.3, 0.75) }, { z: 0.4, p: oct(0.5, 0.25, 0.4, 0.8) }, { z: -0.4, p: oct(0.45, 0.2, 0.4, 0.8) }]), null, canopy);
      add(box(2.8, 0.08, 0.5), M(T, 0, 0.95, -1.7), trim); for (const s of [-1, 1]) add(box(0.08, 0.6, 0.4), M(T, s * 0.6, 0.65, -1.7), col);
      for (const s of [-1, 1]) glow(box(0.42, 0.42, 0.2), M(T, s * 1.15, 0.35, -2.0));
    } else if (k === 2) { // HEAVY: a chunky brick with intakes and four engines
      add(RK.loft(T, [{ z: 3.0, p: oct(1.1, 0.16, 0.3, 0.22) }, { z: 2.0, p: oct(1.7, 0.42, 0.25, 0.32) }, { z: 0.4, p: oct(2.0, 0.75, 0.25, 0.44) }, { z: -1.3, p: oct(2.0, 0.9, 0.25, 0.48) }, { z: -1.95, p: oct(1.8, 0.8, 0.25, 0.48) }]), null, col);
      add(RK.loft(T, [{ z: 2.2, p: oct(0.2, 0.1, 0.3, 0.55) }, { z: 0.8, p: oct(0.6, 0.35, 0.35, 0.82) }, { z: -1.9, p: oct(0.6, 0.4, 0.35, 0.95) }]), null, trim);
      add(box(2.6, 0.08, 0.7), M(T, 0, 0.16, 2.6), trim);
      for (const s of [-1, 1]) { add(RK.loft(T, [{ z: 1.4, p: rr(0.3, 0.3, s * 1.15, 0.42) }, { z: 0.2, p: rr(0.6, 0.56, s * 1.25, 0.45) }, { z: -1.6, p: rr(0.6, 0.6, s * 1.25, 0.45) }]), null, trim); add(box(0.44, 0.34, 0.1), M(T, s * 1.25, 0.46, 1.42), dark); }
      add(RK.loft(T, [{ z: 1.3, p: oct(0.2, 0.08, 0.3, 0.88) }, { z: 0.6, p: oct(0.9, 0.38, 0.4, 0.98) }, { z: -0.4, p: oct(0.8, 0.32, 0.4, 0.98) }]), null, canopy);
      add(box(2.6, 0.1, 0.55), M(T, 0, 1.45, -1.7), trim); for (const s of [-1, 1]) add(box(0.12, 0.55, 0.45), M(T, s * 0.8, 1.15, -1.7), dark); for (const s of [-1, 1]) add(box(0.08, 0.5, 0.6), M(T, s * 1.3, 1.25, -1.7), col);
      for (const x of [-0.75, -0.25, 0.25, 0.75]) glow(box(0.36, 0.36, 0.2), M(T, x, 0.46, -2.02));
    } else if (k === 3) { // NEEDLE: thin and long, canards at the front, tall fins at the back
      add(RK.loft(T, [{ z: 3.8, p: oct(0.08, 0.08, 0.4, 0.4) }, { z: 2.0, p: oct(0.6, 0.42, 0.4, 0.4) }, { z: -1.2, p: oct(0.9, 0.55, 0.4, 0.42) }, { z: -1.9, p: oct(0.8, 0.5, 0.4, 0.42) }]), null, col);
      add(box(1.4, 0.06, 0.4), M(T, 0, 0.42, 2.0), trim);
      add(RK.loft(T, [{ z: -0.2, p: rr(0.2, 0.06, 0, 0.35) }, { z: -1.4, p: rr(2.8, 0.08, 0, 0.32) }, { z: -1.9, p: rr(2.8, 0.08, 0, 0.32) }]), null, trim);
      for (const s of [-1, 1]) add(RK.loft(T, [{ z: -0.8, p: rr(0.08, 0.1, s * 1.35, 0.4) }, { z: -1.6, p: rr(0.1, 1.2, s * 1.4, 0.9) }, { z: -1.9, p: rr(0.1, 1.2, s * 1.42, 0.95) }]), null, col);
      add(RK.loft(T, [{ z: 1.4, p: oct(0.08, 0.05, 0.3, 0.6) }, { z: 0.7, p: oct(0.42, 0.26, 0.4, 0.68) }, { z: 0, p: oct(0.4, 0.22, 0.4, 0.68) }]), null, canopy);
      glow(box(0.5, 0.36, 0.2), M(T, 0, 0.42, -2.05));
    } else { // DELTA: one flat triangle of a wing
      add(RK.loft(T, [{ z: 3.0, p: rr(0.12, 0.12, 0, 0.35) }, { z: 0.5, p: oct(1.8, 0.4, 0.5, 0.35) }, { z: -1.6, p: oct(3.8, 0.45, 0.6, 0.35) }, { z: -1.9, p: oct(3.6, 0.4, 0.6, 0.35) }]), null, col);
      add(RK.loft(T, [{ z: 1.8, p: oct(0.1, 0.05, 0.3, 0.55) }, { z: 0.6, p: oct(0.6, 0.35, 0.4, 0.65) }, { z: -0.6, p: oct(0.55, 0.3, 0.4, 0.62) }]), null, canopy);
      for (const s of [-1, 1]) add(box(0.4, 0.06, 2.6), M(T, s * 0.8, 0.6, -0.4, s * 0.25), trim);
      add(box(0.1, 0.8, 0.8), M(T, 0, 0.85, -1.4), trim);
      for (const s of [-1, 1]) add(box(0.06, 0.08, 3.6), M(T, s * 1.0, 0.56, -0.2, s * -0.5), trim);
      add(box(3.5, 0.08, 0.12), M(T, 0, 0.55, -1.9), trim);
      for (const s of [-1, 0, 1]) glow(box(0.4, 0.26, 0.2), M(T, s * 0.9, 0.36, -1.98));
    }
    const body = RK.merge(T, P), gl = RK.merge(T, G); P.concat(G).forEach(p => p.geo.dispose());
    return { body, glow: gl };
  };

  RK.sky = function (T3, o) {
    o = o || {}; const T = T3.T, cut = o.cut || 0.6, w = o.w || 512, h = o.h || 256, hy = h * 0.5 / cut;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, hy); (o.grad || [[0, '#2a5ad0'], [1, '#bfe0ff']]).forEach(([s, cc]) => gr.addColorStop(s, cc));
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = o.below || (o.grad ? o.grad[o.grad.length - 1][1] : '#bfe0ff'); g.fillRect(0, hy, w, h - hy);
    if (o.paint) o.paint(g, w, h, hy);
    const tx = new T.CanvasTexture(c); tx.wrapS = T.RepeatWrapping; tx.wrapT = T.ClampToEdgeWrapping;
    if (T3.look === 'ps1') { tx.magFilter = T.NearestFilter; tx.minFilter = T.NearestFilter; tx.generateMipmaps = false; } else { tx.minFilter = T.LinearFilter; tx.generateMipmaps = false; }
    const geo = T3.keep(new T.SphereGeometry(o.r || 300, 32, 12, 0, Math.PI * 2, 0, Math.PI * cut));
    const mat = new T.MeshBasicMaterial({ map: tx, side: T.BackSide, fog: false, depthWrite: false });
    const m = new T.Mesh(geo, mat); m.renderOrder = -10; m.frustumCulled = false; T3.add(m);
    m.follow = cam => { m.position.copy(cam.position); if (o.lift) m.position.y += o.lift; };
    m.kill = () => { T3.scene.remove(m); mat.dispose(); tx.dispose(); };
    return m;
  };

  RK.fx = function (T3, o) {
    o = o || {}; const T = T3.T, n = o.n || 300;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), siz = new Float32Array(n);
    const vel = new Float32Array(n * 3), life = new Float32Array(n), max = new Float32Array(n), grav = new Float32Array(n), a0 = new Float32Array(n), s0 = new Float32Array(n), s1 = new Float32Array(n), drag = new Float32Array(n);
    for (let i = 0; i < n; i++) pos[i * 3 + 1] = -9999;
    const geo = new T.BufferGeometry();
    const pa = new T.BufferAttribute(pos, 3), ca = new T.BufferAttribute(col, 4), sa = new T.BufferAttribute(siz, 1);
    pa.setUsage(T.DynamicDrawUsage); ca.setUsage(T.DynamicDrawUsage); sa.setUsage(T.DynamicDrawUsage);
    geo.setAttribute('position', pa); geo.setAttribute('aCol', ca); geo.setAttribute('aSize', sa);
    const mat = new T.ShaderMaterial({
      uniforms: { uScale: { value: o.scale || 220 }, uSq: { value: o.square ? 1 : 0 }, uMaxSize: { value: o.maxPx || 1e9 } },
      vertexShader: 'attribute vec4 aCol; attribute float aSize; varying vec4 vC; uniform float uScale; uniform float uMaxSize;\nvoid main(){ vC = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(uMaxSize, aSize * uScale / max(0.2, -mv.z)); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying vec4 vC; uniform float uSq;\nvoid main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); float a = 1.0; if (uSq < 0.5) { if (d > 0.5) discard; a = smoothstep(0.5, 0.2, d); } gl_FragColor = vec4(vC.rgb, vC.a * a); }',
      transparent: true, depthWrite: false, blending: o.add ? T.AdditiveBlending : T.NormalBlending,
    });
    const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5; T3.add(pts);
    let head = 0, alive = 0; const cc = new T.Color();
    const fx = {
      pts, get active() { return !!alive; },
      // emit(x, y, z, vx, vy, vz, life seconds, colour, size, { g: gravity, grow: end size, a: alpha, drag })
      emit(x, y, z, vx, vy, vz, l, c, s, e) {
        const i = head; head = (head + 1) % n; e = e || {};
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
        life[i] = max[i] = l; grav[i] = e.g || 0; drag[i] = e.drag || 0; cc.set(c); col[i * 4] = cc.r; col[i * 4 + 1] = cc.g; col[i * 4 + 2] = cc.b; a0[i] = e.a == null ? 1 : e.a; col[i * 4 + 3] = a0[i];
        s0[i] = s; s1[i] = e.grow == null ? s : e.grow; siz[i] = s; alive = n;
      },
      update(dt) {
        if (!alive) return; let any = 0;
        for (let i = 0; i < n; i++) {
          if (life[i] <= 0) continue; any = 1;
          life[i] -= dt; if (life[i] <= 0) { pos[i * 3 + 1] = -9999; siz[i] = 0; col[i * 4 + 3] = 0; continue; }
          const k = life[i] / max[i], dr = drag[i] ? Math.max(0, 1 - drag[i] * dt) : 1;
          vel[i * 3 + 1] -= grav[i] * dt; vel[i * 3] *= dr; vel[i * 3 + 1] *= dr; vel[i * 3 + 2] *= dr;
          pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
          col[i * 4 + 3] = a0[i] * Math.min(1, k * 2.2); siz[i] = s1[i] + (s0[i] - s1[i]) * k;
        }
        if (!any) alive = 0;
        pa.needsUpdate = true; ca.needsUpdate = true; sa.needsUpdate = true;
      },
      clear() { for (let i = 0; i < n; i++) { life[i] = 0; pos[i * 3 + 1] = -9999; siz[i] = 0; } alive = 1; fx.update(0); },
      kill() { T3.scene.remove(pts); geo.dispose(); mat.dispose(); },
    };
    return fx;
  };

  const wrapA = a => { if (!isFinite(a)) return 0; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  RK.ghost = {
    rec() {
      const d = []; let acc = 0.1;
      return { d, add(dt, x, y, z, a) { acc += dt; while (acc >= 0.1) { acc -= 0.1; d.push(Math.round(x * 10), Math.round(y * 10), Math.round(z * 10), Math.round(wrapA(a) * 100)); } },
        str() { let p = [0, 0, 0, 0]; return d.map((v, i) => { const s = (v - p[i % 4]).toString(36); p[i % 4] = v; return s; }).join(','); } };
    },
    play(s) {
      const a = String(s || '').split(','), v = []; let p = [0, 0, 0, 0];
      for (let i = 0; i < a.length; i++) { const x = parseInt(a[i], 36); if (!isFinite(x)) break; p[i % 4] += x; v.push(p[i % 4]); }
      const n = Math.floor(v.length / 4);
      return { len: n * 0.1, n, at(t, out) {
        out = out || {}; if (!n) return null; const f = Math.max(0, t / 0.1), i0 = Math.min(n - 1, Math.floor(f)), i1 = Math.min(n - 1, i0 + 1), k = Math.min(1, f - i0);
        const g = (i, j) => v[i * 4 + j];
        out.x = (g(i0, 0) + (g(i1, 0) - g(i0, 0)) * k) / 10; out.y = (g(i0, 1) + (g(i1, 1) - g(i0, 1)) * k) / 10; out.z = (g(i0, 2) + (g(i1, 2) - g(i0, 2)) * k) / 10;
        const a0 = g(i0, 3) / 100, a1 = g(i1, 3) / 100; out.a = a0 + wrapA(a1 - a0) * k; out.done = f >= n - 1; return out; } };
    },
  };

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  RK.dither = function (g, w, h, bits) {
    const img = g.getImageData(0, 0, w, h), d = img.data, step = 256 >> (bits || 5);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, t = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * step;
      for (let c = 0; c < 3; c++) { const v = d[i + c] + t; d[i + c] = Math.max(0, Math.min(255, Math.round(v / step) * step)); }
    }
    g.putImageData(img, 0, 0);
  };
})();

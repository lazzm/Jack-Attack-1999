/* np-rig: the family as real 3D people (Mom, Dad, the little sister, the trick-or-treaters and the grown-up who walks
 * them round). People v2 (docs/PEOPLE.md): a friendly stylised design (big round heads, simple painted faces, chunky
 * hair masses, soft rounded bodies) instead of semi-realistic features on primitives.
 * Everything is made here: no model or image files. Each person is ONE skinned mesh (vertex colours + one small
 * per-person canvas atlas with the painted face, eye/mouth frames and clothes patterns; one material: one draw call)
 * plus a soft contact-shadow mesh on the same skeleton (a second call). Blinking and talking swap painted frames in the
 * shader (uniforms), like the late-90s games did with face textures: no extra geometry, no texture uploads.
 * Props (the paper, a mug, the yo-yo...) live inside that mesh on their own bones and are shown by scaling the bone.
 * Detail: two levels of mesh (near / far), lighter again on Low and Potato.
 *
 * The rig's own space is y-up centimetres, origin on the floor between the feet, facing +z. js/np-life.js puts the
 * group in the house (house space is y-down: the group carries scale.y = -1) and drives:
 *   rig.root(x, floorY, z, heading, speed)   where the body is (house coords; heading: forward = (sin h, cos h))
 *   rig.floor = (x, z) => house floor y       for the feet (stairs are steps)
 *   rig.set({ action, seat, look, carry })    what the person is doing; rig.talk(ms, text) moves the mouth
 *   rig.update(dt, near)                      poses the skeleton (near: face animation and the detailed mesh)
 * Walking plants each foot where it lands and keeps it there until it lifts (two-bone IK: no sliding), standing shifts
 * weight between planted feet, and turning on the spot takes little steps. */
(function () {
  'use strict';
  const T = window.THREE;
  if (!T || window.NPCRig) return;
  const D2R = Math.PI / 180, TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const angd = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const C = h => new T.Color(h);
  const wob = (t, s) => Math.sin(t * 1.3 + s) * 0.5 + Math.sin(t * 2.1 + s * 1.7) * 0.3 + Math.sin(t * 3.7 + s * 2.3) * 0.2;

  // ================================================================ the atlas layout (uv rects [u0, v0, w, h], v up)
  const CELL = {
    face: [0, 0.5, 0.5, 0.5], white: [0.875, 0.5, 0.125, 0.25], pelvis: [0.5, 0.5, 0.375, 0.25],
    torso: [0, 0, 0.5, 0.5], sleeve: [0.5, 0, 0.25, 0.5], legs: [0.75, 0, 0.25, 0.5],
    eye: i => [0.5 + i * 0.125, 0.875, 0.125, 0.125], mouth: i => [0.5 + i * 0.125, 0.75, 0.125, 0.125],
  };
  const WHITE_UV = [0.9375, 0.625];
  const EYE = { open: 0, half: 1, shut: 2, happy: 3 }, MOUTH = { smile: 0, small: 1, open: 2, oh: 3 };

  // ================================================================ geometry: everything is merged into one buffer
  function Geo(bones) {
    const P = [], N = [], Cl = [], SI = [], SW = [], I = [], UV = [], F = [];
    const bi = name => { const i = bones.indexOf(name); if (i < 0) throw new Error('np bone ' + name); return i; };
    // o: { cell: [u0, v0, w, h] maps the piece's own uv into the atlas; face: S (head coords for the painted face); noAO }
    function add(g, color, weights, o) {
      o = o || {};
      if (!g.attributes.normal) g.computeVertexNormals();
      const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, base = P.length / 3;
      const hp = o.face ? o.face.head : null;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ny = n.getY(i);
        P.push(x, y, z); N.push(n.getX(i), ny, n.getZ(i));
        const c = typeof color === 'function' ? color(x, y, z, n.getX(i), ny, n.getZ(i)) : color;
        // soft "ambient occlusion": faces turned down (under the chin, a hem, the hair) are a touch darker
        const ao = o.noAO ? 1 : 1 - 0.12 * Math.max(0, -ny);
        Cl.push(c.r * ao, c.g * ao, c.b * ao);
        if (o.cell && uv) { const r = o.cell; UV.push(r[0] + clamp(uv.getX(i), 0, 1) * r[2], r[1] + clamp(uv.getY(i), 0, 1) * r[3]); }
        else UV.push(WHITE_UV[0], WHITE_UV[1]);
        if (hp) { const zz = (z - hp.c[2]) / hp.r[2]; F.push((x - hp.c[0]) / hp.r[0], (y - hp.c[1]) / hp.r[1], smooth((zz - 0.12) / 0.3)); }
        else F.push(0, 0, 0);
        const w = typeof weights === 'function' ? weights(x, y, z) : Array.isArray(weights) ? weights : [[weights, 1]];
        let s = 0; for (const q of w) s += q[1];
        for (let k = 0; k < 4; k++) { const q = w[k]; SI.push(q ? bi(q[0]) : 0); SW.push(q && s ? q[1] / s : 0); }
      }
      if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) I.push(base + a[i]); }
      else for (let i = 0; i < p.count; i++) I.push(base + i);
      g.dispose();
    }
    function build() {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(Cl, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(UV, 2));
      g.setAttribute('npFace', new T.Float32BufferAttribute(F, 3));
      g.setAttribute('skinIndex', new T.Uint16BufferAttribute(SI, 4));
      g.setAttribute('skinWeight', new T.Float32BufferAttribute(SW, 4));
      g.setIndex(P.length / 3 > 65535 ? new T.Uint32BufferAttribute(I, 1) : new T.Uint16BufferAttribute(I, 1));
      g.computeBoundingSphere(); g.boundingSphere.radius += 45; // posed limbs reach past the bind pose
      g.computeBoundingBox();
      return g;
    }
    return { add, build, get tris() { return I.length / 3; } };
  }
  const xf = (g, p, r, s) => { // scale, rotate (degrees, XYZ), translate
    const m = new T.Matrix4().compose(V(p[0], p[1], p[2]), new T.Quaternion().setFromEuler(new T.Euler((r?.[0] || 0) * D2R, (r?.[1] || 0) * D2R, (r?.[2] || 0) * D2R, 'XYZ')), V(s?.[0] ?? 1, s?.[1] ?? 1, s?.[2] ?? 1));
    g.applyMatrix4(m); return g;
  };
  const ell = (p, r, seg, rot) => xf(new T.SphereGeometry(1, seg?.[0] || 10, seg?.[1] || 7), p, rot, r);
  // rounded box: true round edges with smooth normals
  function rbox(p, size, rad, rot, seg) {
    const [w, h, d] = size, n = seg || 2, g = new T.BoxGeometry(w, h, d, n, n, n), pos = g.attributes.position, nor = g.attributes.normal;
    const hx = w / 2 - rad, hy = h / 2 - rad, hz = d / 2 - rad, v = new T.Vector3(), q = new T.Vector3(), dd = new T.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      q.set(clamp(v.x, -hx, hx), clamp(v.y, -hy, hy), clamp(v.z, -hz, hz));
      dd.copy(v).sub(q); if (dd.lengthSq() > 1e-8) { dd.normalize(); v.copy(q).addScaledVector(dd, rad); nor.setXYZ(i, dd.x, dd.y, dd.z); }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.deleteAttribute('uv');
    return xf(g, p, rot);
  }
  // a tapered cylinder from a to b (closed)
  function tube(a, b, ra, rb, seg) {
    const A = V(...a), B = V(...b), d = B.clone().sub(A), L = d.length();
    const g = new T.CylinderGeometry(rb, ra, L, seg || 8, 1, false);
    g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize())).setPosition(A.clone().add(B).multiplyScalar(0.5)));
    g.deleteAttribute('uv');
    return g;
  }
  const mesh = (pos, idx, uv) => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); if (uv) g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  // a closed surface over a sphere-like grid: fn(azimuth, elevation) -> [x, y, z]. Azimuth 0 = front (+z), +90deg = +x.
  function grid(rows, cols, fn) {
    const pos = [], idx = [];
    pos.push(...fn(0, -Math.PI / 2));
    for (let r = 1; r < rows; r++) { const e = -Math.PI / 2 + Math.PI * r / rows; for (let c = 0; c < cols; c++) pos.push(...fn(c / cols * TAU, e)); }
    pos.push(...fn(0, Math.PI / 2));
    const top = pos.length / 3 - 1, at = (r, c) => 1 + (r - 1) * cols + (c % cols);
    for (let c = 0; c < cols; c++) idx.push(0, at(1, c + 1), at(1, c));
    for (let r = 1; r < rows - 1; r++) for (let c = 0; c < cols; c++) { const a = at(r, c), b = at(r, c + 1), cc = at(r + 1, c), d = at(r + 1, c + 1); idx.push(a, b, d, a, d, cc); }
    for (let c = 0; c < cols; c++) idx.push(top, at(rows - 1, c), at(rows - 1, c + 1));
    return mesh(pos, idx);
  }
  // A vertical loft through horizontal ellipses: rings [[y, cx, cz, halfWidth, halfDepth], ...] bottom to top.
  // With uv: u goes round (0.5 = front, 0/1 = the back seam, duplicated so the pattern never smears), v up the rings
  // by height. The seam's normals are averaged so it never shows.
  function loft(rings, seg, o) {
    o = o || {};
    const pos = [], idx = [], uv = [], R = rings.length, n = seg + 1, y0 = rings[0][0], y1 = rings[R - 1][0];
    for (const [y, cx, cz, hw, hd] of rings) for (let i = 0; i < n; i++) { const a = -Math.PI + i / seg * TAU; pos.push(cx + hw * Math.sin(a), y, cz + hd * Math.cos(a)); uv.push(i / seg, (y - y0) / ((y1 - y0) || 1)); }
    for (let j = 0; j < R - 1; j++) for (let i = 0; i < seg; i++) {
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
    const capIt = (ring, up, dome) => { // (its own vertices: one flat colour from the middle of the cell's edge, no smear)
      const [y, cx, cz] = rings[ring], ci = pos.length / 3, v = up ? 0.985 : 0.015; pos.push(cx, y + (up ? dome : -dome), cz); uv.push(0.5, v);
      for (let i = 0; i < n; i++) { const a = ring * n + i; pos.push(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]); uv.push(0.5, v); }
      for (let i = 0; i < seg; i++) { const a = ci + 1 + i, b = a + 1; if (up) idx.push(ci, a, b); else idx.push(ci, b, a); }
    };
    if (o.bottom !== false) capIt(0, false, o.bottomDome || 0);
    if (o.top !== false) capIt(R - 1, true, o.topDome || 0);
    const g = mesh(pos, idx, uv), nr = g.attributes.normal;
    for (let j = 0; j < R; j++) { const a = j * n, b = a + seg; const x = nr.getX(a) + nr.getX(b), y = nr.getY(a) + nr.getY(b), z = nr.getZ(a) + nr.getZ(b), l = Math.hypot(x, y, z) || 1; nr.setXYZ(a, x / l, y / l, z / l); nr.setXYZ(b, x / l, y / l, z / l); }
    return g;
  }
  // A thick shell over part of a loft (a collar, a skirt panel). Angles in degrees per ring (numbers or functions of the
  // ring index); 0 = front. `off` pushes the shell out from the rings.
  function shell(rings, a0, a1, seg, thick, off) {
    const pos = [], idx = [], R = rings.length, n = seg + 1, o = off || 0;
    const A0 = typeof a0 === 'function' ? a0 : () => a0, A1 = typeof a1 === 'function' ? a1 : () => a1;
    const pt = (ring, k, inner) => { const [y, cx, cz, hw, hd] = rings[ring], a = (A0(ring) + (A1(ring) - A0(ring)) * k / seg) * D2R, t = inner ? 0 : thick; return [cx + (hw + o + t) * Math.sin(a), y, cz + (hd + o + t) * Math.cos(a)]; };
    const strip = (rows, cols, at, flip) => {
      const b = pos.length / 3;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) pos.push(...at(r, c));
      for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
        const a = b + r * cols + c, bb = a + 1, cc = a + cols, d = cc + 1;
        if (flip) idx.push(a, d, bb, a, cc, d); else idx.push(a, bb, d, a, d, cc);
      }
    };
    strip(R, n, (r, c) => pt(r, c, false), false);
    strip(R, n, (r, c) => pt(r, c, true), true);
    strip(2, n, (r, c) => pt(0, c, r === 1), true);
    strip(2, n, (r, c) => pt(R - 1, c, r === 1), false);
    strip(R, 2, (r, c) => pt(r, 0, c === 1), true);
    strip(R, 2, (r, c) => pt(r, seg, c === 1), false);
    return mesh(pos, idx);
  }
  const torusArc = (p, r, tube_, arc, rot, s, seg, rs) => { const g = xf(new T.TorusGeometry(r, tube_, rs || 4, seg || 12, arc), p, rot, s); g.deleteAttribute('uv'); return g; };
  function surfRing(rings, y) { for (let i = 0; i < rings.length - 1; i++) { const a = rings[i], b = rings[i + 1]; if (y >= a[0] && y <= b[0]) { const t = (y - a[0]) / (b[0] - a[0]); return a.map((v, k) => lerp(v, b[k], t)); } } return (y < rings[0][0] ? rings[0] : rings[rings.length - 1]).slice(); }
  function surf(rings, y, a, out) { const r = surfRing(rings, y), s = Math.sin(a * D2R), c = Math.cos(a * D2R), o = out || 0; return [r[1] + (r[3] + o) * s, y, r[2] + (r[4] + o) * c]; }

  // ================================================================ the people
  // Real heights against 204 cm doors and 45 cm seats (Mom 163, Dad 178, the sister (9) 133, a trick-or-treater (7)
  // 122, the grown-up walking them 170), stylised: big round heads (about 5.5 heads tall for the grown-ups, 4.3 for the
  // children), short necks, soft chunky limbs, mitten hands, big shoes. head.r = skull radii; face = painted features in
  // face units (x / r.x, (y - c.y) / r.y): eye centre ex, ey and half size ew; mouth centre my, half size mw x mh.
  const PEOPLE = {
    mom: {
      H: 163, ankle: 7, knee: 43, hip: 80, hipX: 7.8, spine: 94, chest: 108, neck: 128, headY: 131.5,
      sh: [15.2, 123.5, -1], elbow: [17.6, 101, -2], wrist: [18.2, 80, -0.5], handLen: 13,
      head: { c: [0, 146.4, 0.6], r: [13.3, 15.0, 13.0], jaw: 0.2, cheek: 0.55, flat: 1.6, nose: 0.9, noseY: -0.24 },
      face: { ex: 0.305, ey: 0.0, ew: 0.155, my: -0.5, mw: 0.25, mh: 0.15, lash: 1, browY: 0.29, brow: 0.026, blush: 0.45, lip: '#b44a58' },
      foot: { len: 23, w: 9.2, h: 8, heel: -5 },
      skin: '#f2c6a4', blush: '#ee8f86', brow: '#5a3322', hair: '#6a3a26', hair2: '#80492f', iris: '#5c7a4a',
      torso: [[0, 14, 10], [0.13, 13.5, 9.7], [0.3, 13.2, 9.5], [0.48, 14.1, 10.1], [0.65, 14.8, 9.8], [0.8, 15, 8.9], [0.89, 13.9, 7.6], [0.95, 9.6, 6.2], [1, 5.6, 4.8]],
      limb: { arm: 1, leg: 1 }, step: 0.29, speed: 98,
    },
    dad: {
      H: 178, ankle: 7.5, knee: 47.5, hip: 88, hipX: 8.8, spine: 103, chest: 120, neck: 141.5, headY: 145,
      sh: [19.4, 137, -1], elbow: [21.6, 112, -2], wrist: [22.2, 87.5, -0.5], handLen: 14,
      head: { c: [0, 161, 0.6], r: [14.0, 15.4, 13.8], jaw: 0.1, cheek: 0.3, flat: 1.6, nose: 1.5, noseY: -0.22 },
      face: { ex: 0.3, ey: 0.03, ew: 0.145, my: -0.52, mw: 0.25, mh: 0.14, lash: 0, browY: 0.3, brow: 0.042, blush: 0.22, lip: '#8a4638' },
      foot: { len: 27.5, w: 10.8, h: 8.6, heel: -5.5 },
      skin: '#eab896', blush: '#de8a78', brow: '#3e2a1e', hair: '#4a3324', hair2: '#5c4130', iris: '#4f6687',
      torso: [[0, 16.2, 11.4], [0.15, 16.4, 11.8], [0.33, 16.8, 12], [0.5, 17.6, 11.8], [0.68, 18.6, 11.2], [0.82, 19, 10], [0.91, 17.4, 8.4], [0.96, 11.5, 6.8], [1, 6.4, 5.4]],
      limb: { arm: 1.12, leg: 1.12 }, step: 0.29, speed: 104,
    },
    sister: {
      H: 133, ankle: 5.8, knee: 32, hip: 61, hipX: 6.4, spine: 71, chest: 82, neck: 99.5, headY: 102.5,
      sh: [12.4, 96.5, -0.8], elbow: [13.8, 80, -1.2], wrist: [14.1, 62.5, -0.3], handLen: 10.5,
      head: { c: [0, 116.8, 0.6], r: [13.7, 14.6, 13.4], jaw: 0.08, cheek: 0.9, flat: 1.2, nose: 0.55, noseY: -0.3 },
      face: { ex: 0.31, ey: -0.1, ew: 0.17, my: -0.56, mw: 0.22, mh: 0.14, lash: 0.5, browY: 0.27, brow: 0.026, blush: 0.6, freckles: 1, lip: '#a24a44' },
      foot: { len: 19, w: 8, h: 7, heel: -4 },
      skin: '#f6cfb0', blush: '#f38f86', brow: '#9a6c3c', hair: '#b4834a', hair2: '#cc9c5e', iris: '#4a6ea6',
      torso: [[0, 11.2, 8.4], [0.14, 11, 8.3], [0.3, 11, 8.2], [0.48, 11.5, 8.3], [0.66, 12, 8], [0.82, 12.2, 7.4], [0.92, 11, 6.4], [0.97, 7.6, 5.4], [1, 4.8, 4.2]],
      limb: { arm: 0.86, leg: 0.84 }, step: 0.3, speed: 96,
    },
    // a trick-or-treater from down the road (about 7): js/season-halloween.js picks the costume, skin and hair
    kid: {
      H: 122, ankle: 5.5, knee: 28.5, hip: 54.5, hipX: 6.0, spine: 63.5, chest: 73.5, neck: 90, headY: 93,
      sh: [11.6, 87.5, -0.8], elbow: [12.8, 72.5, -1.2], wrist: [13.1, 56.5, -0.3], handLen: 10,
      head: { c: [0, 106.8, 0.6], r: [13.0, 14.0, 12.8], jaw: 0.06, cheek: 0.95, flat: 1.1, nose: 0.5, noseY: -0.3 },
      face: { ex: 0.31, ey: -0.1, ew: 0.175, my: -0.56, mw: 0.22, mh: 0.14, lash: 0, browY: 0.27, brow: 0.028, blush: 0.6, lip: '#9a4a40' },
      foot: { len: 18, w: 7.8, h: 6.6, heel: -3.8 },
      skin: '#f1c9a5', blush: '#ee8f86', brow: '#6a4a2a', hair: '#6a4426', hair2: '#80583a', iris: '#5a4a3a', hairStyle: 'short',
      torso: [[0, 10.6, 8], [0.14, 10.4, 7.9], [0.3, 10.4, 7.8], [0.48, 10.9, 7.9], [0.66, 11.4, 7.6], [0.82, 11.6, 7.1], [0.92, 10.5, 6.1], [0.97, 7.2, 5.1], [1, 4.6, 4]],
      limb: { arm: 0.82, leg: 0.8 }, step: 0.3, speed: 88,
    },
    // the grown-up who walks the trick-or-treaters round (a neighbour: not one of the family)
    grownup: {
      H: 170, ankle: 7.2, knee: 45.5, hip: 84, hipX: 8.4, spine: 98.5, chest: 113.5, neck: 134, headY: 137.5,
      sh: [17, 129.5, -1], elbow: [19.2, 106, -2], wrist: [19.8, 83, -0.5], handLen: 13.5,
      head: { c: [0, 153.4, 0.6], r: [13.6, 15.1, 13.4], jaw: 0.15, cheek: 0.45, flat: 1.6, nose: 1.2, noseY: -0.23 },
      face: { ex: 0.3, ey: 0.02, ew: 0.15, my: -0.51, mw: 0.25, mh: 0.14, lash: 0, browY: 0.3, brow: 0.036, blush: 0.35, lip: '#94483c' },
      foot: { len: 25, w: 10, h: 8.4, heel: -5 },
      skin: '#dca57c', blush: '#d47e6a', brow: '#2e2018', hair: '#2e2119', hair2: '#3c2c22', iris: '#4a3a2a',
      torso: [[0, 15.4, 11], [0.15, 15.4, 11.2], [0.33, 15.6, 11.4], [0.5, 16.4, 11.4], [0.68, 17.2, 10.8], [0.82, 17.4, 9.6], [0.91, 16, 8.2], [0.96, 10.6, 6.6], [1, 6, 5.2]],
      limb: { arm: 1.1, leg: 1.06 }, step: 0.29, speed: 92,
    },
  };
  const BONES = ['base', 'hips', 'spine', 'chest', 'neck', 'head', 'mouth', 'jaw', 'brow', 'eyeL', 'eyeR', 'lidL', 'lidR', 'hairL', 'hairR',
    'clavL', 'armL', 'foreL', 'handL', 'clavR', 'armR', 'foreR', 'handR', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR',
    'shBody', 'shL', 'shR', 'yoyo',
    'p_paper', 'p_mug', 'p_sponge', 'p_plate', 'p_spoon', 'p_can', 'p_mag', 'p_phone', 'p_remote', 'p_crayon', 'p_pad', 'p_bag', 'p_case', 'p_string', 'p_pail', 'p_raygun', 'p_torch'];
  const PARENT = { hips: 'base', spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck', mouth: 'head', jaw: 'head', brow: 'head', eyeL: 'head', eyeR: 'head', lidL: 'head', lidR: 'head', hairL: 'head', hairR: 'head',
    clavL: 'chest', armL: 'clavL', foreL: 'armL', handL: 'foreL', clavR: 'chest', armR: 'clavR', foreR: 'armR', handR: 'foreR',
    thighL: 'hips', shinL: 'thighL', footL: 'shinL', thighR: 'hips', shinR: 'thighR', footR: 'shinR',
    shBody: 'base', shL: 'base', shR: 'base', yoyo: 'base',
    p_paper: 'base', p_mug: 'handR', p_sponge: 'handR', p_plate: 'handL', p_spoon: 'handR', p_can: 'handR', p_mag: 'base', p_phone: 'handR', p_remote: 'handR', p_crayon: 'handR', p_pad: 'base', p_bag: 'chest', p_case: 'handR', p_string: 'base', p_pail: 'handR', p_raygun: 'handL', p_torch: 'handL' };
  const PROPS = BONES.filter(b => b.startsWith('p_')).map(b => b.slice(2));
  // only the props each person actually uses are built into their mesh (hidden props still cost triangles)
  const PROPS_FOR = { mom: ['mug', 'sponge', 'spoon', 'mag', 'can', 'phone'], dad: ['paper', 'mug', 'remote', 'sponge', 'case'], sister: ['mug', 'string', 'bag', 'crayon', 'pad'], kid: ['pail', 'raygun'], grownup: ['torch'] };

  // ---------------------------------------------------------------- the head: one smooth rounded surface
  function headShape(S) {
    const P = S.head, [cx, cy, cz] = P.c, [rx, ry, rz] = P.r;
    const raw = (a, el) => {
      const ce = Math.cos(el), x = ce * Math.sin(a), y = Math.sin(el), z = ce * Math.cos(a);
      const low = smooth(clamp(-y / 0.95, 0, 1));
      let px = x * rx * (1 - P.jaw * low * low), py = y * ry, pz = z * rz;
      if (z < 0) pz *= 1 - 0.1 * low; // the back of the skull rounds into the neck
      const ch = Math.exp(-(((Math.abs(x) - 0.58) / 0.3) ** 2 + ((y + 0.38) / 0.3) ** 2)); // full, round cheeks
      px += Math.sign(x) * P.cheek * ch; if (z > 0) pz += P.cheek * 0.5 * ch;
      if (z > 0.72) pz -= (z - 0.72) * P.flat; // a gently flattened face
      if (z > 0) pz += P.nose * z * z * Math.exp(-((x / 0.12) ** 2 + ((y - P.noseY) / 0.1) ** 2)); // a small soft nose
      return [cx + px, cy + py, cz + pz];
    };
    const front = (x, y) => { // the front surface z at (x, y): Newton steps on the angles
      let a = Math.asin(clamp((x - cx) / rx, -0.95, 0.95)), el = Math.asin(clamp((y - cy) / ry, -0.95, 0.95));
      for (let i = 0; i < 12; i++) { const p = raw(a, el); a += (x - p[0]) / (rx * Math.max(0.3, Math.cos(el))) * 0.8; el += (y - p[1]) / ry * 0.8; }
      return raw(a, el)[2];
    };
    return { fn: raw, raw, front };
  }

  // Joint positions (bind pose) for one person.
  function joints(S) {
    const J = {}, s = side => side === 'L' ? 1 : -1, hp = S.head, f = S.face;
    J.base = [0, 0, 0]; J.hips = [0, S.hip + 2, 0]; J.spine = [0, S.spine, -0.6]; J.chest = [0, S.chest, -1]; J.neck = [0, S.neck, -1.4]; J.head = [0, S.headY, -0.6];
    const shape = S.shape = headShape(S);
    S.eyeY = hp.c[1] + f.ey * hp.r[1];
    S.mouthY = hp.c[1] + f.my * hp.r[1];
    S.mouthZ = shape.front(0, S.mouthY);
    J.mouth = [0, S.mouthY, S.mouthZ - 0.3]; J.jaw = [0, S.mouthY - 0.5, S.mouthZ]; J.brow = [0, S.eyeY + 4, shape.front(0, S.eyeY + 4)];
    for (const side of ['L', 'R']) {
      const k = s(side), ex = f.ex * hp.r[0];
      J['eye' + side] = [k * ex, S.eyeY, shape.front(ex, S.eyeY) - 1]; J['lid' + side] = J['eye' + side].slice();
      J['hair' + side] = [k * (hp.r[0] + 0.8), hp.c[1] + 3.5, hp.c[2] - 2.5];
      J['clav' + side] = [k * 3.5, S.sh[1] + 0.5, S.sh[2]];
      J['arm' + side] = [k * S.sh[0], S.sh[1], S.sh[2]]; J['fore' + side] = [k * S.elbow[0], S.elbow[1], S.elbow[2]]; J['hand' + side] = [k * S.wrist[0], S.wrist[1], S.wrist[2]];
      J['thigh' + side] = [k * S.hipX, S.hip, 0]; J['shin' + side] = [k * (S.hipX - 0.6), S.knee, 0.6]; J['foot' + side] = [k * (S.hipX - 1), S.ankle, -0.4];
      J['sh' + side] = [k * (S.hipX - 1), 0, 0];
    }
    J.shBody = [0, 0, 0]; J.yoyo = [0, 0, 0];
    const hand = (side, dx, dy, dz) => { const h = J['hand' + side]; return [h[0] + dx, h[1] + dy, h[2] + dz]; };
    const L = S.handLen;
    J.p_paper = hand('L', -1.5, -L * 0.5, 2); J.p_mug = hand('R', 1.5, -L * 0.48, 2.5); J.p_sponge = hand('R', 0, -L * 0.55, 2); J.p_plate = hand('L', 0, -L * 0.55, 2);
    J.p_spoon = hand('R', 0, -L * 0.5, 2); J.p_can = hand('R', 0, -L * 0.5, 1); J.p_mag = hand('L', -1.5, -L * 0.5, 2); J.p_phone = hand('R', -1, -L * 0.48, 1);
    J.p_remote = hand('R', 0, -L * 0.52, 2); J.p_crayon = hand('R', 0, -L * 0.6, 1.5); J.p_pad = [0, 0, 0]; J.p_bag = [0, S.chest + 2, -12]; J.p_case = hand('R', 0, -L * 0.5, 0); J.p_string = hand('R', 0, -L * 0.62, 1.2);
    J.p_pail = hand('R', 0, -L * 0.62, 1.5); J.p_raygun = hand('L', 0, -L * 0.5, 2); J.p_torch = hand('L', 0, -L * 0.55, 2);
    return J;
  }

  const blend = (v, a, b, A, B) => { const t = smooth((v - a) / (b - a)); return t <= 0 ? [[A, 1]] : t >= 1 ? [[B, 1]] : [[A, 1 - t], [B, t]]; };

  // ================================================================ the painted atlas (one small canvas per person)
  // Cells are drawn in centimetres on the body (see each `frame`), so a button is round and a stripe is straight.
  const mixHex = (a, b, t) => '#' + C(a).lerp(C(b), t).getHexString();
  function painter(size) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d');
    // a cell in its own units: x from x0..x1 maps across, y from y0..y1 up (v up)
    function cell(r, x0, x1, y0, y1, fn) {
      g.save();
      g.setTransform(size * r[2] / (x1 - x0), 0, 0, -size * r[3] / (y1 - y0), size * r[0] - size * r[2] * x0 / (x1 - x0), size * (1 - r[1]) + size * r[3] * y0 / (y1 - y0));
      g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip(); fn(g); g.restore();
    }
    return { cv, g, cell, size };
  }
  // drawing helpers on a context in cell units
  const P2 = {
    fill(g, col, path) { g.fillStyle = col; g.beginPath(); path(g); g.fill(); },
    rect(g, x0, y0, x1, y1, col) { g.fillStyle = col; g.fillRect(x0, y0, x1 - x0, y1 - y0); },
    ell(g, x, y, rx, ry, col, rot) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); g.fill(); },
    stroke(g, col, w, path, cap) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = cap || 'round'; g.lineJoin = 'round'; g.beginPath(); path(g); g.stroke(); },
    dash(g, col, w, d, path) { g.save(); g.setLineDash(d); P2.stroke(g, col, w, path, 'butt'); g.restore(); },
    soft(g, x, y, r, col, a) { const c = C(col), s = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${s},${a})`); gr.addColorStop(0.55, `rgba(${s},${a * 0.6})`); gr.addColorStop(1, `rgba(${s},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); },
    stripesH(g, x0, x1, y0, y1, period, colA, colB, frac) { for (let y = y0; y < y1; y += period) { P2.rect(g, x0, y, x1, y + period * (frac || 0.5), colA); if (colB) P2.rect(g, x0, y + period * (frac || 0.5), x1, y + period, colB); } },
    ribsV(g, x0, x1, y0, y1, period, col, a) { g.save(); g.globalAlpha = a; for (let x = x0; x < x1; x += period) P2.rect(g, x, y0, x + period * 0.35, y1, col); g.restore(); },
  };

  // the face: base (cheeks, brows, nose shadow), 4 eye frames and 4 mouth frames
  function paintFace(A, S, O) {
    const hp = S.head, f = S.face, rx = hp.r[0], ry = hp.r[1], skin = S.skin, dark = '#1d130e';
    // base: centimetres from the head centre (x = the person's left), y up
    A.cell(CELL.face, -rx, rx, -ry, ry, g => {
      const ey = f.ey * ry, ex = f.ex * rx;
      for (const k of [1, -1]) P2.soft(g, k * (ex + 0.06 * rx), ey - 0.3 * ry, 0.17 * rx, S.blush, f.blush);
      const ny = (hp.noseY - 0.085) * ry; // a soft shadow under the little nose
      g.save(); g.globalAlpha = 0.22; P2.stroke(g, mixHex(skin, '#7a3a24', 0.6), 0.32, q => { q.moveTo(-0.55, ny + 0.2); q.quadraticCurveTo(0, ny - 0.18, 0.55, ny + 0.2); }); g.restore();
      if (f.freckles) { g.save(); g.globalAlpha = 0.26; for (const [x, y] of [[-3.3, -3.1], [-2.4, -3.7], [-4.0, -3.9], [3.2, -3.2], [2.3, -3.8], [4.0, -3.8]]) P2.ell(g, x * rx / 13.7, ey + y * 0.85, 0.17, 0.17, '#b06a3a'); g.restore(); }
      for (const k of [1, -1]) { // brows: short soft arches, the inner end a touch lower (friendly)
        const bx = k * ex, by = ey + f.browY * ry, w = 0.135 * rx;
        P2.stroke(g, S.brow, f.brow * ry, q => { q.moveTo(bx - k * w, by - 0.1); q.quadraticCurveTo(bx, by + 0.85, bx + k * w, by - 0.15); });
      }
      O.paintFace && O.paintFace(g, S, P2);
    });
    // eyes: a square box in cm, origin at the centre, x outwards (mirrored for the other eye)
    const side = 2 * f.ew * rx, a = 0.265 * side, b = 0.35 * side, iris = S.iris || '#4a3a2a', lid = mixHex(skin, '#5a3020', 0.1);
    const eyeBase = g => {
      const gr = g.createLinearGradient(0, b, 0, -b); gr.addColorStop(0, dark); gr.addColorStop(0.45, mixHex(dark, iris, 0.35)); gr.addColorStop(1, mixHex(iris, '#ffffff', 0.1));
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, a, b, 0, 0, TAU); g.fill();
      P2.ell(g, a * 0.28, b * 0.4, a * 0.42, b * 0.3, '#ffffff', -0.5);
      P2.ell(g, -a * 0.36, -b * 0.5, a * 0.16, b * 0.12, 'rgba(255,255,255,0.85)');
    };
    const lash = g => { if (f.lash) P2.stroke(g, dark, a * 0.2, q => { q.moveTo(a * 0.7, b * 0.62); q.quadraticCurveTo(a * 1.1, b * 0.85, a * (1.1 + 0.25 * f.lash), b * (0.98 + 0.1 * f.lash)); }); };
    const box = (i, fn) => A.cell(CELL.eye(i), -side / 2, side / 2, -side / 2, side / 2, fn);
    box(EYE.open, g => { eyeBase(g); if (f.lash) { P2.stroke(g, dark, a * 0.16, q => q.ellipse(0, 0, a, b, 0, Math.PI * 0.18, Math.PI * 0.82)); lash(g); } });
    box(EYE.half, g => {
      eyeBase(g);
      P2.fill(g, skin, q => { q.moveTo(-a * 1.4, b * 0.12); q.quadraticCurveTo(0, b * 0.32, a * 1.4, b * 0.12); q.lineTo(a * 1.4, b * 1.5); q.lineTo(-a * 1.4, b * 1.5); q.closePath(); });
      P2.stroke(g, dark, a * 0.2, q => { q.moveTo(-a * 1.02, b * 0.08); q.quadraticCurveTo(0, b * 0.3, a * 1.02, b * 0.08); }); lash(g);
    });
    box(EYE.shut, g => { P2.stroke(g, dark, a * 0.24, q => { q.moveTo(-a * 1.05, b * 0.05); q.quadraticCurveTo(0, -b * 0.5, a * 1.05, b * 0.05); }); if (f.lash) P2.stroke(g, dark, a * 0.18, q => { q.moveTo(a * 0.9, -b * 0.08); q.lineTo(a * 1.3, -b * 0.28); }); });
    box(EYE.happy, g => { P2.stroke(g, dark, a * 0.24, q => { q.moveTo(-a * 1.05, -b * 0.25); q.quadraticCurveTo(0, b * 0.75, a * 1.05, -b * 0.25); }); });
    // mouth: w x h cm box, origin at the centre
    const w = 2 * f.mw * rx, h = 2 * f.mh * ry, lip = f.lip || '#8a4638', edge = mixHex(skin, '#4a2018', 0.55), inside = '#3e1414', tongue = '#c8676a';
    const mbox = (i, fn) => A.cell(CELL.mouth(i), -w / 2, w / 2, -h / 2, h / 2, fn);
    const open = (g, hw, top, bot, teeth) => {
      const path = q => { q.moveTo(-hw, top); q.quadraticCurveTo(0, top - 0.25, hw, top); q.quadraticCurveTo(hw * 0.9, bot * 0.6, 0, bot); q.quadraticCurveTo(-hw * 0.9, bot * 0.6, -hw, top); q.closePath(); };
      P2.fill(g, inside, path);
      g.save(); g.beginPath(); path(g); g.clip(); P2.ell(g, 0, bot + 0.1 * (top - bot), hw * 0.62, (top - bot) * 0.35, tongue); if (teeth) P2.rect(g, -hw, top - 0.55, hw, top + 1, '#f6f1e8'); g.restore();
      P2.stroke(g, edge, 0.24, path);
    };
    mbox(MOUTH.smile, g => P2.stroke(g, lip, f.lash ? 0.38 : 0.32, q => { q.moveTo(-w * 0.23, h * 0.12); q.quadraticCurveTo(0, -h * 0.24, w * 0.23, h * 0.12); }));
    mbox(MOUTH.small, g => open(g, w * 0.15, h * 0.06, -h * 0.2, false));
    mbox(MOUTH.open, g => open(g, w * 0.19, h * 0.1, -h * 0.34, true));
    mbox(MOUTH.oh, g => { P2.ell(g, 0, -h * 0.06, w * 0.085, h * 0.17, inside); P2.stroke(g, edge, 0.24, q => q.ellipse(0, -h * 0.06, w * 0.085, h * 0.17, 0, 0, TAU)); });
    return { eye: [f.ex, f.ey, f.ew, f.ew * rx / ry], mouth: [0, f.my, f.mw, f.mh] };
  }
  // circumference of a ring (Ramanujan)
  const circ = (a, b) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  function paintAtlas(S, O, size, frames) {
    const A = painter(size), g = A.g;
    P2.rect(g, 0, 0, size, size, 'rgba(0,0,0,0)');
    A.cell(CELL.white, 0, 1, 0, 1, q => P2.rect(q, 0, 0, 1, 1, '#ffffff'));
    const uni = paintFace(A, S, O);
    // clothes: each cell in cm round the body (x = 0 at the front) and up it (rig height)
    const paint = O.paint || {};
    for (const [k, fr] of Object.entries(frames)) {
      A.cell(CELL[k], -fr.c / 2, fr.c / 2, fr.y0, fr.y1, q => {
        P2.rect(q, -fr.c, fr.y0 - 5, fr.c, fr.y1 + 5, fr.base || '#ffffff'); paint[k] && paint[k](q, S, fr, P2);
        if (k === 'torso') P2.rect(q, -fr.c, fr.y1 - 3.2, fr.c, fr.y1 + 5, O.neckline === 'skin' ? S.skin : O.neckline || mixHex(fr.base || '#ffffff', '#000000', 0.2));
      });
    }
    const tex = new T.CanvasTexture(A.cv);
    tex.anisotropy = 1; tex.needsUpdate = true;
    return { tex, uni };
  }

  // ================================================================ building a person
  // detail levels: 0 = near (Medium/High), 1 = far on Medium/High or near on Low/Potato, 2 = far on Low/Potato
  const LODS = [
    { head: [18, 26], hair: [26, 42], torso: 16, limb: 10, hand: 8, box: 3, ear: [8, 6], ell: [10, 7] },
    { head: [12, 18], hair: [18, 22], torso: 12, limb: 7, hand: 6, box: 2, ear: [6, 4], ell: [8, 6] },
    { head: [9, 12], hair: [12, 14], torso: 9, limb: 5, hand: 5, box: 1, ear: [5, 3], ell: [6, 4] },
  ];
  function lookFor(kind, look) {
    const S = Object.assign({}, PEOPLE[kind], look || {});
    S.face = Object.assign({}, PEOPLE[kind].face, look?.face || {});
    S.head = Object.assign({}, PEOPLE[kind].head);
    return S;
  }
  function buildPerson(kind, outfit, lod, look) {
    const S = lookFor(kind, look), J = joints(S), G = Geo(BONES), L = LODS[lod];
    const skin = C(S.skin), blushC = C(S.blush);
    const k = side => side === 'L' ? 1 : -1;
    const O = OUTFITS[kind][outfit] || OUTFITS[kind][Object.keys(OUTFITS[kind])[0]];
    const hp = S.head, [cx, cy, cz] = hp.c, [rx, ry] = hp.r;
    S.L = L; S.lod = lod;

    // ---- head (the face is painted: see paintFace), neck, ears
    G.add(grid(L.head[0], L.head[1], S.shape.fn), skin, 'head', { face: S, noAO: true });
    const nr = 0.31 * rx;
    G.add(loft([[S.neck - 5, 0, -1.2, nr + 0.6, nr + 0.3], [S.neck, 0, -1.1, nr, nr - 0.2], [cy - ry * 0.55, 0, -0.6, nr - 0.2, nr - 0.4]], L.limb, { bottom: false, top: false }),
      skin, (x, y) => blend(y, S.neck - 2, S.headY + 1, 'chest', 'head'));
    const hair = HAIR[S.hairStyle || kind] || HAIR.short;
    if (!hair.ears) for (const sd of ['L', 'R']) {
      const ex = k(sd) * rx * 0.97, s = rx / 13.3;
      G.add(ell([ex, S.eyeY - 1.6, cz - 1.4], [1.3 * s, 2.5 * s, 1.9 * s], L.ear, [0, k(sd) * 22, k(sd) * -6]), skin.clone().lerp(blushC, 0.25), 'head');
    }

    // ---- body: a soft torso, a pelvis, chunky limbs, mitten hands, big shoes
    const torsoW = (x, y) => {
      if (y > S.sh[1] - 9 && Math.abs(x) > S.sh[0] - 7) { const t = clamp((Math.abs(x) - (S.sh[0] - 7)) / 6, 0, 0.5) * clamp((y - (S.sh[1] - 9)) / 6, 0, 1); return [['chest', 1 - t], [x > 0 ? 'armL' : 'armR', t]]; }
      if (y > S.spine + 3) return blend(y, S.chest - 9, S.chest - 1, 'spine', 'chest');
      return blend(y, S.hip + 3, S.spine + 3, 'hips', 'spine');
    };
    S.torsoW = torsoW;
    const ty0 = S.hip + 2, ty1 = S.neck + 0.5;
    const torso = (O.torso || S.torso).map(([t, hw, hd]) => [lerp(ty0, ty1, t), 0, 0.3 + 0.9 * Math.sin(t * Math.PI) * (t < 0.9 ? 1 : 0.5), hw * (1 - 0.07 * smooth((t - 0.76) / 0.16)), hd]);
    S.torsoRings = torso;
    const mid = surfRing(torso, lerp(ty0, ty1, 0.6));
    const frames = { torso: { c: circ(mid[3], mid[4]), y0: ty0, y1: ty1, base: O.base?.torso } };
    G.add(loft(torso, L.torso, { bottomDome: 1, topDome: 1 }), C('#ffffff'), torsoW, { cell: CELL.torso });
    const hw0 = torso[0][3], hd0 = torso[0][4], pe = O.pelvisEase || 0;
    const pelvis = [[S.hip - 6.5, 0, 0.2, hw0 * 0.42 + pe, hd0 * 0.62 + pe], [S.hip - 2, 0, 0.2, hw0 * 0.94 + pe, hd0 * 0.88 + pe], [S.hip + 3, 0, 0.2, hw0 + 0.1 + pe, hd0 * 0.96 + pe], [S.hip + 8, 0, 0.3, hw0 + pe, hd0 + pe]];
    frames.pelvis = { c: circ(hw0, hd0), y0: S.hip - 6.5, y1: S.hip + 8, base: O.base?.pelvis };
    G.add(loft(pelvis, L.torso, { bottomDome: 0.6, top: false }), C('#ffffff'), (x, y) => {
      if (y < S.hip + 1 && Math.abs(x) > 3) { const t = clamp((S.hip + 1 - y) / 6, 0, 0.45); return [['hips', 1 - t], [x > 0 ? 'thighL' : 'thighR', t]]; }
      return blend(y, S.hip + 4, S.spine + 3, 'hips', 'spine');
    }, { cell: CELL.pelvis, noAO: true });
    const la = S.limb.arm, ll = S.limb.leg, se = O.sleeveEase || 0, le = O.legEase || 0;
    for (const sd of ['L', 'R']) {
      const a = J['arm' + sd], el = J['fore' + sd], wr = J['hand' + sd], kk = k(sd);
      const rings = [
        [wr[1] + 0.2, wr[0], wr[2], 2.8 * la + se * 0.6, 2.6 * la + se * 0.6],
        [(wr[1] + el[1]) * 0.5, (wr[0] + el[0]) * 0.5, (wr[2] + el[2]) * 0.5 - 0.2, 3.25 * la + se * 0.7, 3.05 * la + se * 0.7],
        [el[1], el[0], el[2], 3.45 * la + se * 0.8, 3.3 * la + se * 0.8],
        [(el[1] + a[1]) * 0.5, (el[0] + a[0]) * 0.5, (el[2] + a[2]) * 0.5, 3.85 * la + se, 3.85 * la + se],
        [a[1] - 3, a[0] - kk * 0.6, a[2], 4.2 * la + se, 4.4 * la + se],
        [a[1] - 0.6, a[0] - kk * 2.6, a[2] - 0.2, 3.0 * la + se * 0.5, 3.6 * la + se * 0.5],
      ];
      if (sd === 'L') frames.sleeve = { c: TAU * 3.5 * la, y0: rings[0][0], y1: rings[5][0], base: O.base?.sleeve, elbow: el[1] };
      G.add(loft(rings, L.limb, { topDome: 0.6, bottomDome: 0.3 }), C('#ffffff'), (x, y) => {
        if (y > a[1] - 3) return [['arm' + sd, 0.75], ['clav' + sd, 0.25]];
        if (y > el[1] + 3) return [['arm' + sd, 1]];
        if (y > el[1] - 3) return blend(y, el[1] - 3, el[1] + 3, 'fore' + sd, 'arm' + sd);
        return blend(y, wr[1] + 0.5, wr[1] + 3, 'hand' + sd, 'fore' + sd);
      }, { cell: CELL.sleeve });
      mitten(G, S, wr, kk, 'hand' + sd, O.gloves ? C(O.gloves) : skin, L);
      const t = J['thigh' + sd], kn = J['shin' + sd], an = J['foot' + sd];
      const legs = [
        [S.ankle + 1.4, an[0], an[2] + 0.3, 3.8 * ll + le * 0.8, 4.0 * ll + le * 0.8],
        [S.ankle + 7, an[0] + kk * 0.1, an[2] + 0.2, 3.9 * ll + le * 0.7, 4.2 * ll + le * 0.7],
        [(S.ankle + kn[1]) * 0.5 + 2, kn[0] * 0.98 + an[0] * 0.02, -0.4, 4.7 * ll + le * 0.6, 5.0 * ll + le * 0.6],
        [kn[1], kn[0], kn[2] + 0.2, 4.8 * ll + le * 0.6, 5.0 * ll + le * 0.6],
        [(kn[1] + S.hip) * 0.5, (kn[0] + t[0]) * 0.5 + kk * 0.3, 0.5, 6.2 * ll + le, 6.5 * ll + le],
        [S.hip - 3, t[0] - kk * 0.5, 0.5, 7.4 * ll + le, 7.5 * ll + le],
        [S.hip + 2, t[0] - kk * 0.9, 0.4, 7.6 * ll + le, 7.8 * ll + le],
      ];
      if (sd === 'L') frames.legs = { c: TAU * 5.6 * ll, y0: legs[0][0], y1: legs[6][0], base: O.base?.legs, knee: kn[1] };
      G.add(loft(legs, L.limb, { topDome: 0.5 }), C('#ffffff'), (x, y) => {
        if (y > S.hip - 3) return [['thigh' + sd, 0.7], ['hips', 0.3]];
        if (y > kn[1] + 4) return [['thigh' + sd, 1]];
        if (y > kn[1] - 4) return blend(y, kn[1] - 4, kn[1] + 4, 'shin' + sd, 'thigh' + sd);
        return [['shin' + sd, 1]];
      }, { cell: CELL.legs });
      (O.shoe || trainer('#2a2a30', '#e8e4dc'))(G, S, an, kk, 'foot' + sd, L);
    }
    S.hatted = !!O.hat;
    O.extra && O.extra(G, S, J, L, torso, pelvis);
    if (!O.noHair) hair.build(G, S, J, L, C(S.hair), C(S.hair2));
    buildProps(G, S, J, kind, L);
    return { geometry: G.build(), J, S, O, frames, tris: G.tris };
  }
  // a soft mitten hand (palm to fingertips in one loft, curled a little) and a thumb
  function mitten(G, S, wr, kk, bone, color, L) {
    const H = S.handLen, x = wr[0] - kk * 0.3, y = wr[1], z = wr[2];
    const r = [[y - H * 0.9, x - kk * 0.7, z + 1.3, H * 0.15, H * 0.17], [y - H * 0.78, x - kk * 0.5, z + 1.0, H * 0.21, H * 0.24], [y - H * 0.55, x - kk * 0.2, z + 0.5, H * 0.23, H * 0.27], [y - H * 0.3, x, z + 0.1, H * 0.21, H * 0.24], [y + H * 0.05, x, z - 0.1, H * 0.16, H * 0.18]];
    G.add(loft(r, L.hand, { bottomDome: H * 0.09, topDome: 0.2 }), color, bone);
    G.add(ell([x - kk * H * 0.04, y - H * 0.36, z + H * 0.24], [H * 0.09, H * 0.2, H * 0.1], [L.hand, 4], [24, 0, kk * 14]), color, bone);
  }
  // chunky shoes: a rounded body with a pale sole and an optional stripe, and the ankle collar
  const trainer = (upper, sole, trim) => (G, S, an, kk, bone, L) => {
    const f = S.foot, x = an[0] + kk * 0.2, Ln = f.len, zc = f.heel + Ln / 2, U = C(upper), So = C(sole), Tr = trim ? C(trim) : null;
    G.add(rbox([x, f.h * 0.48, zc], [f.w, f.h * 0.96, Ln], f.w * 0.44, [0, -kk * 4, 0], L.box), (px, py, pz) => py < 1.8 ? So : Tr && Math.abs(py - f.h * 0.52) < 0.75 && pz < zc + Ln * 0.3 ? Tr : U, bone);
    G.add(rbox([x, S.ankle + 0.8, an[2] - 0.6], [f.w * 0.86, 5, f.w * 0.94], 2.2, null, Math.min(L.box, 2)), U, bone);
  };
  const shoe = leather => (G, S, an, kk, bone, L) => {
    const f = S.foot, x = an[0] + kk * 0.2, Ln = f.len, zc = f.heel + Ln / 2, Le = C(leather), sole = C('#1a1411');
    G.add(rbox([x, f.h * 0.44, zc], [f.w * 0.94, f.h * 0.86, Ln], f.w * 0.42, [0, -kk * 4, 0], L.box), (px, py) => py < 1.5 ? sole : Le, bone);
    G.add(rbox([x, S.ankle + 0.4, an[2] - 0.8], [f.w * 0.82, 4.6, f.w * 0.9], 2, null, Math.min(L.box, 2)), Le, bone);
  };
  const onTorso = S => (x, y) => S.torsoW(x, y);

  // ---------------------------------------------------------------- clothes: painted cells (cm round and up the body)
  const den = { dark: '#4f74ae', mid: '#5f86c2', light: '#86a6d6', stitch: '#e3b54c' };
  const seams = (g, fr, P, col, a) => { g.save(); g.globalAlpha = a || 0.45; for (const x of [-fr.c / 4, fr.c / 4]) P.dash(g, col, 0.22, [0.9, 0.6], q => { q.moveTo(x, fr.y0); q.lineTo(x, fr.y1); }); g.restore(); };
  const knees = (g, fr, P) => { if (fr.knee) P.soft(g, 0, fr.knee + 1, 6.5, '#ffffff', 0.16); };
  const OUTFITS = {
    mom: {
      // a cosy berry cardigan open over a cream top, light-wash jeans, white trainers with a berry stripe
      day: {
        sleeveEase: 0.7, legEase: 0.8, neckline: 'skin',
        base: { torso: '#8a3358', sleeve: '#8a3358', pelvis: '#7593bf', legs: '#7896bd' },
        paint: {
          torso(g, S, fr, P) {
            const dark = '#6c2545', cream = '#f2e6cc', yB = fr.y0, yT = fr.y1, top = S.neck - 1;
            P.ribsV(g, -fr.c / 2, fr.c / 2, yB, yT, 1.1, '#4a1430', 0.13);
            const half = y => lerp(1.5, 6.8, smooth((y - yB) / (top - yB)));
            P.fill(g, cream, q => { q.moveTo(-1.5, yB - 2); for (let y = yB; y <= yT + 2; y += 1) q.lineTo(half(y), y); for (let y = yT + 2; y >= yB - 2; y -= 1) q.lineTo(-half(y), y); q.closePath(); });
            P.fill(g, S.skin, q => { q.moveTo(-6, yT + 3); q.lineTo(-5.2, yT); q.quadraticCurveTo(0, yT - 7, 5.2, yT); q.lineTo(6, yT + 3); q.closePath(); });
            g.save(); g.globalAlpha = 0.9; P.stroke(g, '#d9b860', 0.24, q => { q.moveTo(-4.6, yT - 3.6); q.quadraticCurveTo(0, yT - 8.4, 4.6, yT - 3.6); }); g.restore();
            for (const k of [1, -1]) P.stroke(g, dark, 1.2, q => { q.moveTo(k * 2.1, yB - 2); for (let y = yB; y <= yT + 2; y += 1) q.lineTo(k * (half(y) + 0.6), y); });
            for (let i = 0; i < 4; i++) { const y = yB + 6 + i * 6.4; P.ell(g, half(y) + 0.65, y, 0.6, 0.6, '#efdcaa'); P.ell(g, half(y) + 0.65, y, 0.2, 0.2, '#9c8248'); }
            P.rect(g, -fr.c, yB - 5, fr.c, yB + 3.8, dark); P.ribsV(g, -fr.c / 2, fr.c / 2, yB - 5, yB + 3.8, 0.9, '#3a0f22', 0.28);
            for (const k of [1, -1]) { const x0 = k > 0 ? 7.5 : -14, x1 = k > 0 ? 14 : -7.5; P.rect(g, x0, yB + 5, x1, yB + 11.5, '#7a2b4d'); P.rect(g, x0, yB + 10.2, x1, yB + 11.5, dark); }
          },
          sleeve(g, S, fr, P) { P.ribsV(g, -fr.c / 2, fr.c / 2, fr.y0, fr.y1, 1.0, '#4a1430', 0.13); P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 3.4, '#6c2545'); P.ribsV(g, -fr.c / 2, fr.c / 2, fr.y0 - 5, fr.y0 + 3.4, 0.8, '#3a0f22', 0.3); },
          pelvis(g, S, fr, P) { P.rect(g, -fr.c, fr.y1 - 2.4, fr.c, fr.y1 + 5, '#5f7eab'); P.ell(g, 0, fr.y1 - 1.2, 0.55, 0.55, '#c9b27a'); },
          legs(g, S, fr, P) { knees(g, fr, P); seams(g, fr, P, '#d9a441', 0.35); P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 2.6, '#8fabd0'); P.stroke(g, '#6683ad', 0.25, q => { q.moveTo(-fr.c, fr.y0 + 2.6); q.lineTo(fr.c, fr.y0 + 2.6); }); },
        },
        shoe: trainer('#f4f1ea', '#cfc8ba', '#b8476c'),
      },
    },
    dad: { work: dadShirt(false), home: dadShirt(true), weekend: dadWeekend() },
    sister: {
      // denim dungarees over a lilac-and-cream striped top, pink trainers
      play: {
        sleeveEase: 0.5, legEase: 1.0,
        base: { torso: '#fbf5eb', sleeve: '#fbf5eb', pelvis: den.mid, legs: den.mid },
        paint: {
          torso(g, S, fr, P) {
            P.stripesH(g, -fr.c, fr.c, fr.y0 - 5, fr.y1 + 5, 3, '#b59ad8', null, 0.5);
            const bt = S.chest + 3.5, x = 7, bk = fr.c / 2;
            P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 5.5, den.mid);
            P.rect(g, -x, fr.y0, x, bt, den.mid);
            P.dash(g, den.stitch, 0.22, [0.7, 0.45], q => { q.moveTo(-x + 0.7, fr.y0 + 5); q.lineTo(-x + 0.7, bt - 0.7); q.lineTo(x - 0.7, bt - 0.7); q.lineTo(x - 0.7, fr.y0 + 5); });
            P.rect(g, -3.4, bt - 7.2, 3.4, bt - 2, den.dark); P.dash(g, den.stitch, 0.2, [0.6, 0.4], q => { q.rect(-3, bt - 6.8, 6, 4.4); });
            for (const k of [1, -1]) { P.rect(g, k * 4.3, bt - 1, k * 6.9, fr.y1 + 5, den.mid); P.rect(g, k * (bk - 4.2), fr.y0 + 4, k * (bk - 6.8), fr.y1 + 5, den.mid); P.ell(g, k * 5.6, bt - 1.2, 0.85, 0.85, '#d9b45a'); P.ell(g, k * 5.6, bt - 1.2, 0.35, 0.35, '#a8863a'); }
          },
          sleeve(g, S, fr, P) { P.stripesH(g, -fr.c, fr.c, fr.y0 + 2.4, fr.y1 + 5, 3, '#b59ad8', null, 0.5); P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 2.4, '#b59ad8'); },
          legs(g, S, fr, P) { knees(g, fr, P); seams(g, fr, P, den.stitch, 0.5); P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 3.6, den.light); P.dash(g, den.stitch, 0.22, [0.6, 0.4], q => { q.moveTo(-fr.c, fr.y0 + 3); q.lineTo(fr.c, fr.y0 + 3); }); },
        },
        shoe: trainer('#ff8db6', '#f6f2ea', '#ffffff'),
      },
    },
  };
  function dadShirt(home) {
    const shirt = '#bccfe6', cuff = '#a9bfdc', tieC = '#8a2232', gold = '#c9a24a';
    return {
      sleeveEase: home ? 0.5 : 0.8, legEase: 1.4,
      base: { torso: shirt, sleeve: shirt, pelvis: '#3d424b', legs: '#3d424b' },
      paint: {
        torso(g, S, fr, P) {
          const yT = fr.y1, yB = fr.y0;
          P.ribsV(g, -fr.c / 2, fr.c / 2, yB, yT, 1.6, '#7f9cc2', 0.22);
          P.rect(g, -0.9, yB, 0.9, yT, '#b0c4de');
          for (let y = yB + 6; y < yT - (home ? 9 : 2); y += 5.5) P.ell(g, 0, y, 0.38, 0.38, '#f4f6f8');
          P.stroke(g, '#93abc9', 0.25, q => q.rect(4.2, S.chest + 1, 5.6, 6.4)); // a breast pocket (with a pen)
          P.rect(g, 5.2, S.chest + 5.5, 5.7, S.chest + 9, '#22303e');
          if (home) P.fill(g, S.skin, q => { q.moveTo(-3.6, yT + 2); q.lineTo(0, yT - 8); q.lineTo(3.6, yT + 2); q.closePath(); });
          P.rect(g, -fr.c, yB - 5, fr.c, yB + 3.4, '#2a1c13'); P.rect(g, -1.7, yB + 0.1, 1.7, yB + 3.2, '#c9b27a'); P.rect(g, -1.0, yB + 0.8, 1.0, yB + 2.5, '#2a1c13');
          // the tie: a neat knot at the collar (after work: loosened, lower and a bit skew)
          g.save(); const ky = home ? yT - 9 : yT - 1.5; if (home) { g.translate(0.6, ky); g.rotate(0.12); g.translate(-0.6, -ky); }
          const blade = q => { q.moveTo(-1.2, ky - 2.8); q.lineTo(1.2, ky - 2.8); q.lineTo(3.1, yB + 11); q.lineTo(0, yB + 8); q.lineTo(-3.1, yB + 11); q.closePath(); };
          P.fill(g, tieC, blade); g.save(); g.beginPath(); blade(g); g.clip(); for (let d = -40; d < 60; d += 2.4) P.stroke(g, gold, 0.55, q => { q.moveTo(-6, yB + d); q.lineTo(6, yB + d + 12); }, 'butt'); g.restore();
          P.fill(g, '#7a1b2a', q => { q.moveTo(-1.7, ky); q.lineTo(1.7, ky); q.lineTo(1.2, ky - 3); q.lineTo(-1.2, ky - 3); q.closePath(); });
          g.restore();
        },
        sleeve(g, S, fr, P) {
          P.ribsV(g, -fr.c / 2, fr.c / 2, fr.y0, fr.y1, 1.6, '#7f9cc2', 0.22);
          if (home) { P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.elbow - 1.5, S.skin); P.rect(g, -fr.c, fr.elbow - 1.5, fr.c, fr.elbow + 2.8, cuff); P.stroke(g, '#93abc9', 0.3, q => { q.moveTo(-fr.c, fr.elbow + 0.6); q.lineTo(fr.c, fr.elbow + 0.6); }); }
          else { P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 3.2, cuff); P.ell(g, 1.2, fr.y0 + 1.6, 0.35, 0.35, '#f4f6f8'); }
        },
        pelvis(g, S, fr, P) { P.rect(g, -0.15, fr.y0 + 2, 0.15, fr.y1, '#2e323a'); },
        legs(g, S, fr, P) { P.rect(g, -0.2, fr.y0, 0.2, fr.y1, '#4d535d'); P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 1.2, '#33373f'); },
      },
      shoe: shoe('#211b18'),
      extra: (G, S, J, L, torso) => dadCollar(G, S, torso, home, C(shirt), L),
    };
  }
  function dadWeekend() {
    const jumper = '#2f5a42', rib = '#244836', shirt = '#c3d3e6';
    return {
      sleeveEase: 1.0, legEase: 1.3,
      base: { torso: jumper, sleeve: jumper, pelvis: '#3e5679', legs: '#3e5679' },
      paint: {
        torso(g, S, fr, P) {
          P.ribsV(g, -fr.c / 2, fr.c / 2, fr.y0, fr.y1, 1.2, '#173526', 0.14);
          P.fill(g, shirt, q => { q.moveTo(-5.6, fr.y1 + 2); q.lineTo(0, fr.y1 - 11); q.lineTo(5.6, fr.y1 + 2); q.closePath(); });
          P.stroke(g, rib, 1.3, q => { q.moveTo(-5.9, fr.y1 + 2); q.lineTo(0, fr.y1 - 11.5); q.lineTo(5.9, fr.y1 + 2); });
          P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 4, rib); P.ribsV(g, -fr.c / 2, fr.c / 2, fr.y0 - 5, fr.y0 + 4, 0.9, '#0f2a1c', 0.3);
        },
        sleeve(g, S, fr, P) { P.ribsV(g, -fr.c / 2, fr.c / 2, fr.y0, fr.y1, 1.0, '#173526', 0.14); P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 3.6, rib); },
        pelvis(g, S, fr, P) { P.rect(g, -fr.c, fr.y1 - 2.4, fr.c, fr.y1 + 5, '#34496a'); P.dash(g, '#c9933a', 0.22, [0.8, 0.5], q => { q.moveTo(1.2, fr.y1 - 2.4); q.lineTo(1.2, fr.y0 + 3); }); },
        legs(g, S, fr, P) { seams(g, fr, P, '#c9933a', 0.4); knees(g, fr, P); },
      },
      shoe: shoe('#5a3a24'),
      extra: (G, S, J, L, torso) => dadCollar(G, S, torso, false, C(shirt), L, true),
    };
  }
  // the shirt collar: a band round the neck and two soft points
  function dadCollar(G, S, torso, open, shirt, L, under) {
    const y0 = S.neck - 1.6, nr = 0.31 * S.head.r[0];
    G.add(shell([[y0, 0, -1.2, nr + 1.3, nr + 1.0], [y0 + 2.6, 0, -1.1, nr + 0.9, nr + 0.6]], open ? 44 : 18, open ? 316 : 342, L.limb + 4, 0.4, 0), shirt, (x, y) => [['chest', 0.6], ['neck', 0.4]]);
    void under;
  }

  // ---------------------------------------------------------------- hair: chunky rounded masses
  // helmet(): a shell over the head's own surface; below the hairline (`line`, `end`: elevations in degrees by azimuth,
  // 0 = front) it tucks under the scalp with a soft rounded edge, never a notch.
  function helmet(S, L, o) {
    const P = S.head, [cx, cy, cz] = P.c, raw = S.shape.raw;
    return grid(L.hair[0], L.hair[1], (a, el) => {
      const A = angd(0, a), ab = Math.abs(A) / D2R;
      const p = raw(a, el), dx = p[0] - cx, dy = p[1] - cy, dz = p[2] - cz;
      const ed = el / D2R, end = o.end(ab), fk = smooth((o.face - ab) / 16);
      const cut = Math.max(end, lerp(end, o.line(A / D2R, ab), fk)), soft = (o.soft || 7) * 1.4;
      const tx = cx + dx * 0.88, ty = cy + dy * 0.88, tz = cz + dz * 0.88;
      if (ed < cut - soft) return [tx, ty, tz];
      const t = o.thick(ab, ed, A / D2R) * (0.5 + 0.5 * smooth((ed - cut + soft) / (soft * 1.6))) * (o.flat ? 1 - 0.85 * smooth((ed - 12) / 14) : 1); // thinning to a rounded edge (pressed flat under a hat)
      let x = cx + dx * (1 + t / P.r[0]), y = cy + dy * (1 + t / P.r[1]), z = cz + dz * (1 + t / P.r[2]);
      if (o.shape) [x, y, z] = o.shape(x, y, z, ab, ed, A / D2R);
      if (ed < cut) { const k = smooth((ed - (cut - soft)) / soft); x = lerp(tx, x, k); y = lerp(ty, y, k); z = lerp(tz, z, k); }
      return [x, y, z];
    });
  }
  // a bob that falls straight from the crown to `depth` (degrees) and flicks out at the ends
  const bobFall = (S, add, below) => (x, y, z, ab, ed) => {
    const [cx, , cz] = S.head.c, [rx, , rz] = S.head.r;
    if (ed < below && ab > 40) {
      const t = smooth((below - ed) / 22) * smooth((ab - 40) / 25), a = Math.atan2(x - cx, z - cz), s = Math.sin(a), c = Math.cos(a);
      const R = 1 / Math.sqrt((s / (rx + add)) ** 2 + (c / (rz + add)) ** 2) + (ed < -35 ? 0.8 * smooth((-35 - ed) / 15) : 0), rr = Math.hypot(x - cx, z - cz) || 0.01;
      const k = lerp(1, Math.max(1, R / rr), t); x = cx + (x - cx) * k; z = cz + (z - cz) * k;
    }
    return [x, y, z];
  };
  const shade = (h, h2, S) => { const [cx, cy, cz] = S.head.c; return (x, y, z) => (Math.sin(Math.atan2(x - cx, z - cz) * 9 + y * 0.12) > 0.55 ? h2 : h); };
  const HAIR = {
    mom: { ears: true, build(G, S, J, L, h, h2) { // a soft chin-length bob with a side-swept fringe
      const P = S.head, [cx, cy, cz] = P.c;
      G.add(helmet(S, L, { face: 78, soft: 9,
        line: (A, ab) => 27 + 7 * smooth((ab - 42) / 22) + 4 * smooth(A / 40) - 3 * Math.exp(-(((A + 30) / 26) ** 2)) - 52 * smooth((ab - 58) / 22),
        end: ab => -46 - 6 * smooth((ab - 100) / 70),
        thick: (ab, ed) => 1.5 + 0.9 * smooth((ab - 40) / 40) * (1 - 0.35 * smooth((ab - 120) / 50)) + 1.2 * smooth((ed - 20) / 50),
        shape: bobFall(S, 2.6, 8) }), shade(h, h2, S), (x, y) => y < cy - 6 ? [['head', 0.8], ['neck', 0.2]] : [['head', 1]]);
    } },
    dad: { build(G, S, J, L, h, h2) { // short back-and-sides, parted on his left, a small quiff; and his glasses
      const P = S.head, [cx, cy, cz] = P.c, base = shade(h, h2, S);
      G.add(helmet(S, L, { face: 80, soft: 12,
        line: (A, ab) => 35 + 5 * smooth(A / 30) - 4 * Math.exp(-(((A + 12) / 14) ** 2)) + 5 * Math.exp(-(((ab - 46) / 12) ** 2)) - 48 * smooth((ab - 52) / 28),
        end: ab => lerp(-12, -44, smooth((ab - 104) / 45)) + 24 * Math.exp(-(((ab - 98) / 15) ** 2)),
        thick: (ab, ed) => 1.6 + 0.5 * smooth((ab - 90) / 60) + 1.4 * smooth((ed - 20) / 45),
        shape: (x, y, z, ab, ed, A) => { if (ed > 22 && A > -40 && A < 50) { const b = Math.exp(-(((A - 4) / 26) ** 2)) * smooth((ed - 26) / 16) * (1 - smooth((ed - 62) / 20)); const k = 1 + 2.4 * b / P.r[1]; x = cx + (x - cx) * k; y = cy + (y - cy) * k; z = cz + (z - cz) * k; } return [x, y, z]; } }),
        base, (x, y) => y < cy - 8 ? [['head', 0.85], ['neck', 0.15]] : [['head', 1]]);
      const f = S.face, ex = f.ex * P.r[0], ey = S.eyeY, frame = C('#3b2c22'), rr = f.ew * P.r[0] * 1.25;
      for (const s of [1, -1]) {
        const fz = S.shape.front(ex, ey) + 1.1;
        G.add(torusArc([s * ex, ey - 0.1, fz], rr, 0.26, TAU, [0, s * 16, 0], [1.08, 0.86, 1], L.hand + 6, 4), frame, 'head', { noAO: true });
        const side = P.r[0] * 0.97 + 0.4, hx = s * (ex + rr * 1.06);
        G.add(tube([hx, ey + 0.4, fz - 0.6], [s * side, ey + 0.6, cz - 2], 0.24, 0.24, 4), frame, 'head', { noAO: true });
      }
      G.add(torusArc([0, ey + 0.2, S.shape.front(0, ey) + 1.3], ex - rr * 1.02, 0.22, Math.PI, [0, 0, 0], [1, 0.5, 1], 6, 4), frame, 'head', { noAO: true });
    } },
    sister: { build(G, S, J, L, h, h2) { // a straight fringe and two bunches with hair bobbles and butterfly clips
      const P = S.head, [cx, cy, cz] = P.c, st = shade(h, h2, S);
      G.add(helmet(S, L, { face: 80, soft: 7,
        line: (A, ab) => 20 + 6 * smooth((ab - 35) / 20) - 28 * smooth((ab - 55) / 25),
        end: ab => lerp(-2, -22, smooth((ab - 90) / 30)),
        thick: (ab, ed) => 1.5 + 0.8 * smooth((ed - 20) / 50) }), st, 'head');
      for (const s of [1, -1]) {
        const sd = s > 0 ? 'L' : 'R', b = J['hair' + sd];
        G.add(ell([b[0] + s * 3.6, b[1] - 3.8, b[2] - 0.6], [4.0, 6.8, 4.2], L.ell, [8, 0, s * 24]), st, 'hair' + sd);
        G.add(ell([b[0] + s * 0.5, b[1] + 0.2, b[2] - 0.3], [1.5, 1.7, 1.7], [6, 4]), C('#ffcf3a'), 'head', { noAO: true });
        const ca = s * 30, ce = 40, R = [P.r[0] + 1.8, P.r[1] + 1.6, P.r[2] + 1.8];
        const px = cx + R[0] * Math.cos(ce * D2R) * Math.sin(ca * D2R), py = cy + R[1] * Math.sin(ce * D2R), pz = cz + R[2] * Math.cos(ce * D2R) * Math.cos(ca * D2R), wing = s > 0 ? C('#ff5aa4') : C('#3cc4f0');
        for (const w of [1, -1]) G.add(ell([px + w * 1.0 * Math.cos(ca * D2R), py, pz - w * 1.0 * Math.sin(ca * D2R)], [1.3, 0.95, 0.4], [6, 4], [-ce, ca, w * 22]), wing, 'head', { noAO: true });
      }
    } },
    short: { build(G, S, J, L, h, h2) { // a child's short crop
      G.add(helmet(S, L, { face: 80, soft: 8, flat: S.hatted, line: (A, ab) => 24 + 6 * smooth((ab - 35) / 20) - 3 * Math.exp(-(((A - 20) / 16) ** 2)) - 28 * smooth((ab - 55) / 25), end: ab => lerp(2, -20, smooth((ab - 92) / 28)), thick: (ab, ed) => 1.3 + 0.9 * smooth((ed - 20) / 50) }), shade(h, h2, S), 'head');
    } },
    bob: { ears: true, build(G, S, J, L, h, h2) { // a child's bob with a fringe
      G.add(helmet(S, L, { face: 78, soft: 8, flat: S.hatted, line: (A, ab) => 21 + 7 * smooth((ab - 40) / 20) - 50 * smooth((ab - 58) / 22), end: ab => -34 - 6 * smooth((ab - 100) / 70), thick: (ab, ed) => 1.6 + 1.0 * smooth((ed - 15) / 50), shape: bobFall(S, 2.2, 6) }), shade(h, h2, S), (x, y) => [['head', 1]]);
    } },
    none: { build() {} },
    // the grown-up: neat short hair under a red bobble hat (it's cold out on Halloween)
    grownup: { build(G, S, J, L, h, h2) {
      const P = S.head, [cx, cy, cz] = P.c;
      G.add(helmet(S, LODS[Math.min(2, S.lod + 1)], { face: 80, soft: 6, line: () => 18, end: ab => lerp(2, -16, smooth((ab - 92) / 28)), thick: () => 1.2 }), shade(h, h2, S), 'head');
      G.add(helmet(S, L, { face: 200, soft: 4, line: () => 24, end: () => 24, thick: (ab, ed) => 3.4 + 0.4 * smooth((ed - 40) / 30) }), (x, y) => y < cy + P.r[1] * 0.62 ? C('#a82e2e') : C('#c23a3a'), 'head');
      G.add(ell([cx, cy + P.r[1] + 3.6, cz - 0.5], [3.4, 3.2, 3.4], L.ell), C('#f2ece0'), 'head');
    } },
  };
  HAIR.kid = HAIR.short;

  // ---------------------------------------------------------------- the trick-or-treaters' costumes (and the grown-up)
  function coneHat(G, S, L, col, h, brim, band) {
    const P = S.head, y0 = P.c[1] + P.r[1] * 0.42, cz = P.c[2] - 1, rr = [], base = C(col), bandC = band ? C(band) : null;
    for (let i = 0; i <= 6; i++) { const t = i / 6; rr.push([y0 + t * h, Math.sin(t * 2.2) * 3 * t, cz - t * 3.4, (P.r[0] + 3.2) * (1 - t) + 0.4, (P.r[2] + 3.2) * (1 - t) + 0.4]); }
    G.add(loft(rr, L.torso, { topDome: 0.8 }), bandC ? (x, y) => (y < y0 + 3.2 ? bandC : base) : base, 'head');
    if (brim) G.add(loft([[y0 - 0.6, 0, cz, P.r[0] + brim, P.r[2] + brim], [y0 + 0.4, 0, cz, P.r[0] + brim * 0.92, P.r[2] + brim * 0.92]], L.torso + 4), base, 'head');
  }
  function hood(G, S, L, col, ears) {
    const P = S.head, [cx, cy, cz] = P.c, rr = [], c = C(col);
    for (let i = 0; i <= 6; i++) { const t = i / 6, a = -Math.PI * 0.4 + t * Math.PI * 0.9; rr.push([cy + Math.sin(a) * (P.r[1] + 1.8), cx, cz - 0.6, Math.cos(a) * (P.r[0] + 1.8) + 0.4, Math.cos(a) * (P.r[2] + 1.8) + 0.4]); }
    G.add(shell(rr, 60, 300, L.torso + 4, 1.2, 0), c, 'head');
    if (ears) for (const sx of [-1, 1]) G.add(loft([[cy + P.r[1] * 0.62, sx * 6.2, cz - 1, 2.8, 1.6], [cy + P.r[1] + 6.5, sx * 7.6, cz - 1.6, 0.3, 0.3]], 6, { topDome: 0.2 }), ears === true ? c : C(ears), 'head');
  }
  const kidBase = (top, legs, extra) => Object.assign({ torso: top, sleeve: top, pelvis: legs, legs }, extra || {});
  const bones = (g, S, fr, P) => { // a skeleton suit: white bones printed on black
    const w = '#efeee6';
    P.rect(g, -1.1, fr.y0 + 2, 1.1, fr.y1 - 3, w);
    for (let i = 0; i < 4; i++) { const y = S.chest + 4 - i * 4.2; for (const k of [1, -1]) P.stroke(g, w, 1.5, q => { q.moveTo(k * 1.5, y); q.quadraticCurveTo(k * 6, y + 1.4, k * 8.2, y - 2.2); }); }
    P.fill(g, w, q => { q.moveTo(-8, fr.y0 + 5); q.quadraticCurveTo(0, fr.y0 - 1, 8, fr.y0 + 5); q.quadraticCurveTo(0, fr.y0 + 2.5, -8, fr.y0 + 5); });
  };
  const limbBone = (g, S, fr, P) => { P.rect(g, -0.9, fr.y0 + 3, 0.9, fr.y1 - 3, '#efeee6'); const m = (fr.y0 + fr.y1) / 2; P.ell(g, 0, fr.knee || fr.elbow || m, 1.6, 1.4, '#efeee6'); };
  const wraps = (g, fr, P, tilt) => { P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y1 + 5, '#e8e1cc'); for (let y = fr.y0 - 20; y < fr.y1 + 20; y += 3.1) P.stroke(g, '#c4b99c', 0.5, q => { q.moveTo(-fr.c, y); q.lineTo(fr.c, y + fr.c * tilt); }, 'butt'); };
  function costume(o) {
    return {
      noHair: !!o.noHair, hat: !!o.hat, sleeveEase: o.sleeveEase || 0.5, legEase: o.legEase || 0.8,
      base: kidBase(o.top, o.legs, o.base), paint: o.paint || {}, paintFace: o.face,
      shoe: o.shoe ? trainer(o.shoe, o.sole || '#e8e4dc', o.trim) : trainer('#2a2a30', '#e8e4dc'),
      extra: o.extra,
    };
  }
  OUTFITS.kid = {
    witch: costume({ hat: true, top: '#2a2433', legs: '#2a2433', shoe: '#1a1a1e', sole: '#3a3440',
      paint: { torso: (g, S, fr, P) => { P.rect(g, -fr.c, fr.y0 + 1.5, fr.c, fr.y0 + 4.5, '#e8761c'); P.ell(g, 3, fr.y0 + 3, 1.6, 1.6, '#e8761c'); },
        legs: (g, S, fr, P) => P.stripesH(g, -fr.c, fr.c, fr.y0 - 5, fr.y1 + 5, 4, '#8a44aa', '#22202a', 0.5) },
      extra: (G, S, J, L) => {
        const d = []; for (let i = 0; i <= 4; i++) { const t = i / 4; d.push([S.knee - 4 + t * (S.hip + 7 - S.knee + 4), 0, 0.4, lerp(17, 11.4, t), lerp(14, 8.4, t)]); }
        G.add(loft(d, L.torso, { bottomDome: -2 }), (x, y) => y < S.knee - 2 && Math.sin(Math.atan2(x, 1) * 9) > 0.6 ? C('#3a3046') : C('#2a2433'), (x, y) => blend(y, S.knee, S.hip + 4, 'hips', 'hips'));
        coneHat(G, S, L, '#1c1a24', 24, 7, '#7a3a9a');
      } }),
    ghost: costume({ top: '#f4f4ee', legs: '#3a3a44', noHair: true,
      extra: (G, S, J, L) => {
        const P = S.head, top = P.c[1] + P.r[1] + 1.4, sheet = C('#f6f6f0'), fold = C('#dcdcd2');
        const rows = [[S.knee - 8, 0, 1, 22, 18], [S.hip, 0, 1, 18.5, 14.5], [S.chest - 4, 0, 1, 16.5, 12.5], [S.sh[1], 0, 0.4, 16, 11.5], [S.neck + 2, 0, 0.4, P.r[0] + 1.8, P.r[2] + 1.6], [P.c[1] - 4, 0, P.c[2], P.r[0] + 2.2, P.r[2] + 2.2], [P.c[1] + 5, 0, P.c[2], P.r[0] + 1.9, P.r[2] + 1.9], [top - 2.5, 0, P.c[2], P.r[0] - 2.5, P.r[2] - 2.5]];
        G.add(loft(rows, L.torso + 4, { topDome: 2.6, bottomDome: -3 }), (x, y) => (Math.sin(Math.atan2(x, 1) * 7 + y * 0.05) > 0.72 ? fold : sheet), (x, y) => y > S.neck ? [['head', 0.7], ['chest', 0.3]] : y > S.chest - 4 ? [['chest', 1]] : blend(y, S.hip - 4, S.chest - 4, 'hips', 'chest'));
        const ez = P.c[2] + P.r[2] + 2.0, ey = S.eyeY + 0.5;
        for (const sx of [-1, 1]) G.add(ell([sx * 4.2, ey, ez], [2.1, 2.9, 0.8], L.ell), C('#141418'), 'head', { noAO: true });
        G.add(ell([0, ey - 7, ez - 0.6], [2.4, 1.6, 0.8], L.ell), C('#141418'), 'head', { noAO: true });
      } }),
    skeleton: costume({ top: '#17171b', legs: '#17171b', shoe: '#efeee6', sole: '#a8a8a0',
      paint: { torso: bones, sleeve: limbBone, legs: limbBone, pelvis: (g, S, fr, P) => P.rect(g, -6, fr.y1 - 3, 6, fr.y1, '#efeee6') },
      face: (g, S, P) => { // face paint: white with dark round eye patches and a little nose
        const f = S.face, rx = S.head.r[0], ry = S.head.r[1];
        g.save(); g.globalAlpha = 0.9; P.ell(g, 0, -1, rx * 0.86, ry * 0.86, '#f4f3ee'); g.restore();
        for (const k of [1, -1]) P.ell(g, k * f.ex * rx, f.ey * ry, f.ew * rx * 1.25, f.ew * rx * 1.4, '#2a2a30');
        P.fill(g, '#2a2a30', q => { q.moveTo(-0.9, (S.head.noseY - 0.02) * ry); q.lineTo(0.9, (S.head.noseY - 0.02) * ry); q.lineTo(0, (S.head.noseY + 0.1) * ry); q.closePath(); });
      } }),
    pumpkin: costume({ top: '#2f7a34', legs: '#2f7a34', shoe: '#1d3a1e',
      paint: { pelvis: (g, S, fr, P) => { // (the pelvis cell is the pumpkin's skin: the suit's own pelvis is inside it)
        P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y1 + 5, '#ef7d1c');
        for (let x = -fr.c / 2; x < fr.c / 2; x += fr.c / 16) { g.save(); g.globalAlpha = 0.35; P.stroke(g, '#b8540e', 1.4, q => { q.moveTo(x, fr.y0); q.lineTo(x, fr.y1); }); g.restore(); }
        const m = (fr.y0 + fr.y1) / 2 + 2, eye = (cxx) => P.fill(g, '#3a1a06', q => { q.moveTo(cxx - 3, m + 1); q.lineTo(cxx + 3, m + 1); q.lineTo(cxx, m + 5.5); q.closePath(); });
        eye(-5.5); eye(5.5); P.fill(g, '#3a1a06', q => { q.moveTo(-8, m - 4); for (let i = 0; i <= 8; i++) q.lineTo(-8 + i * 2, m - 4 - (i % 2 ? 2.2 : 0) - Math.sin(i / 8 * Math.PI) * 2); for (let i = 8; i >= 0; i--) q.lineTo(-8 + i * 2, m - 8 + (i % 2 ? 0 : 1.6) - Math.sin(i / 8 * Math.PI) * 2.4); q.closePath(); });
      } },
      extra: (G, S, J, L) => {
        const yc = (S.hip + S.chest) / 2 + 1, rr = []; for (let i = 0; i <= 8; i++) { const e = -Math.PI / 2 + Math.PI * i / 8; rr.push([yc + Math.sin(e) * 16, 0, 1.2, Math.max(0.6, Math.cos(e) * 19), Math.max(0.6, Math.cos(e) * 16.5)]); }
        G.add(loft(rr, L.torso + 4, {}), C('#ffffff'), (x, y) => blend(y, S.hip + 2, S.chest, 'hips', 'chest'), { cell: CELL.pelvis });
        const P = S.head, y0 = P.c[1] + P.r[1] - 1;
        G.add(loft([[y0 - 1, 0, P.c[2] - 1, 7.5, 7.5], [y0 + 1, 0, P.c[2] - 1, 7.4, 7.4], [y0 + 1.8, 0, P.c[2] - 1, 2.2, 2.2], [y0 + 6, 0.8, P.c[2] - 1.4, 1.4, 1.4]], L.limb + 3, { topDome: 0.5 }), C('#2f7a34'), 'head');
        G.add(ell([3.8, y0 + 2.4, P.c[2] - 1], [4, 0.6, 2.2], L.ell, [0, 0, -20]), C('#3f9a3e'), 'head');
      } }),
    spacecadet: costume({ top: '#c9ced6', legs: '#c9ced6', shoe: '#d63a2c', trim: '#ffffff', noHair: true,
      paint: { torso: (g, S, fr, P) => { P.rect(g, -fr.c, fr.y0 + 1, fr.c, fr.y0 + 4, '#d63a2c'); P.fill(g, '#f6d24a', q => { const cx0 = 4.5, cy0 = S.chest + 2; for (let i = 0; i < 10; i++) { const r = i % 2 ? 1.2 : 2.8, a = i / 10 * TAU; q.lineTo(cx0 + Math.sin(a) * r, cy0 + Math.cos(a) * r); } q.closePath(); }); P.rect(g, -fr.c / 2, fr.y0, -fr.c / 2 + 0.8, fr.y1, '#9aa0a8'); },
        sleeve: (g, S, fr, P) => P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 3.5, '#d63a2c') },
      extra: (G, S, J, L) => {
        const P = S.head, [cx, cy, cz] = P.c, rr = [];
        for (let i = 0; i <= 7; i++) { const t = i / 7, a = -Math.PI / 2 + 0.25 + t * (Math.PI - 0.25); rr.push([cy + Math.sin(a) * (P.r[1] + 2.6), cx, cz - 0.5, Math.cos(a) * (P.r[0] + 2.6) + 0.3, Math.cos(a) * (P.r[2] + 2.6) + 0.3]); }
        G.add(shell(rr, 56, 304, L.torso + 4, 1.2, 0), C('#eceff3'), 'head');
        G.add(torusArc([cx, cy - 0.8, cz + P.r[2] * 0.58], P.r[0] * 0.95, 0.9, TAU, [0, 0, 0], [1, 1.12, 0.5], L.torso + 4, 5), C('#d63a2c'), 'head');
        G.add(tube([cx + 5, cy + P.r[1] + 1.5, cz - 1], [cx + 7, cy + P.r[1] + 9, cz - 2], 0.35, 0.3, 4), C('#9aa0a8'), 'head');
        G.add(ell([cx + 7.2, cy + P.r[1] + 9.6, cz - 2], [1.4, 1.4, 1.4], L.ell), C('#ff4a3a'), 'head', { noAO: true });
      } }),
    wizard: costume({ hat: true, top: '#2a3a9a', legs: '#20204a', shoe: '#3a2a1a', sleeveEase: 1.4,
      paint: { torso: (g, S, fr, P) => { for (const [x, y] of [[-6, fr.y0 + 8], [5, fr.y0 + 15], [-2, fr.y0 + 22], [10, fr.y0 + 5], [-11, fr.y0 + 17], [14, fr.y0 + 20], [-15, fr.y0 + 6]]) star(g, P, x, y, 1.6); },
        sleeve: (g, S, fr, P) => { star(g, P, 0, fr.y0 + 8, 1.4); star(g, P, 3, fr.y0 + 17, 1.2); } },
      extra: (G, S, J, L) => {
        const d = []; for (let i = 0; i <= 4; i++) { const t = i / 4; d.push([S.ankle + 4 + t * (S.chest - S.ankle - 4), 0, 0.4, lerp(17, 11.2, t), lerp(14, 8.2, t)]); }
        const st = C('#f6d24a'), robe = C('#2a3a9a');
        G.add(loft(d, L.torso, { bottomDome: -2 }), (x, y, z) => (Math.sin(x * 1.1) * Math.sin(y * 0.9) * Math.sin(z * 1.3) > 0.86 ? st : robe), (x, y) => blend(y, S.hip - 4, S.chest - 2, 'hips', 'chest'));
        coneHat(G, S, L, '#2a3a9a', 26, 5, '#f6d24a');
        const P = S.head; G.add(ell([0, S.mouthY - 4.2, P.c[2] + P.r[2] * 0.66], [5.4, 6.2, 3.2], L.ell, [12, 0, 0]), C('#f2f2ea'), 'head');
      } }),
    mummy: costume({ top: '#e8e1cc', legs: '#e8e1cc', shoe: '#e8e1cc', sole: '#c4b99c',
      paint: { torso: (g, S, fr, P) => wraps(g, fr, P, 0.12), sleeve: (g, S, fr, P) => wraps(g, fr, P, -0.25), legs: (g, S, fr, P) => wraps(g, fr, P, 0.2), pelvis: (g, S, fr, P) => wraps(g, fr, P, 0.1) },
      noHair: true, extra: (G, S, J, L) => G.add(helmet(S, L, { face: 80, soft: 6, line: () => 22, end: ab => ab < 100 ? -10 : -40, thick: () => 0.9 }), (x, y, z) => (Math.sin(y * 1.6 + x * 0.3) > 0.7 ? C('#c4b99c') : C('#e8e1cc')), 'head'),
      face: (g, S, P) => { // bandages round the forehead and the chin, the eyes peeking out
        const ry = S.head.r[1], rx = S.head.r[0], f = S.face;
        for (const [y, t] of [[(f.ey + 0.42) * ry, 0.1], [(f.ey + 0.62) * ry, -0.08], [(f.my - 0.2) * ry, 0.06], [(f.my - 0.38) * ry, -0.1]]) { P.stroke(g, '#e8e1cc', 2.6, q => { q.moveTo(-rx, y - t * rx); q.lineTo(rx, y + t * rx); }, 'butt'); P.stroke(g, '#c4b99c', 0.3, q => { q.moveTo(-rx, y - t * rx - 1.2); q.lineTo(rx, y + t * rx - 1.2); }, 'butt'); }
      } }),
    bat: costume({ top: '#1a1a20', legs: '#1a1a20', shoe: '#141418', noHair: true,
      paint: { torso: (g, S, fr, P) => P.ell(g, 0, (fr.y0 + fr.y1) / 2, 6.5, 9, '#4a4a56') },
      extra: (G, S, J, L) => {
        hood(G, S, L, '#1a1a20', true);
        for (const sd of ['L', 'R']) {
          const kk = sd === 'L' ? 1 : -1, a = J['arm' + sd], el = J['fore' + sd], wr = J['hand' + sd], z = -3.2;
          // edge along the arm, then the scalloped lower edge back up to the side of the body
          const top = [[a[0] - kk * 2, a[1] - 2, 'arm' + sd], [el[0] + kk * 2.5, el[1], 'arm' + sd], [wr[0] + kk * 2.5, wr[1] - 2, 'fore' + sd]];
          const bot = [[wr[0] + kk * 11, wr[1] - 9, 'fore' + sd], [el[0] + kk * 9, (el[1] + wr[1]) / 2 - 8, 'fore' + sd], [a[0] + kk * 2, S.hip + 2, 'arm' + sd]];
          const pos = [], idx = [], wts = [];
          for (const d of [0, -0.7]) for (const p of top.concat(bot.slice().reverse())) { pos.push(p[0], p[1], z + d); wts.push(p[2]); }
          // fan per layer: top i, bot i (bot listed reversed after top)
          const quad = (o, flip) => { for (let i = 0; i < 2; i++) { const t0 = o + i, t1 = o + i + 1, b0 = o + 3 + i, b1 = o + 4 + i; flip ? idx.push(t0, b0, t1, t1, b0, b1) : idx.push(t0, t1, b0, t1, b1, b0); } };
          quad(0, kk < 0); quad(6, kk > 0);
          const g = mesh(pos, idx), wc = C('#24242e');
          let vi = 0; G.add(g, wc, () => [[wts[vi++ % wts.length], 1]]);
        }
      } }),
    dragon: costume({ top: '#3a9a3a', legs: '#3a9a3a', shoe: '#2a6a2a', noHair: true,
      paint: { torso: (g, S, fr, P) => { P.ell(g, 0, (fr.y0 + fr.y1) / 2 - 2, 6.5, 11, '#e6d27a'); for (let y = fr.y0 + 4; y < fr.y1 - 6; y += 3.2) P.stroke(g, '#c9b45a', 0.35, q => { q.moveTo(-5.5, y); q.quadraticCurveTo(0, y - 0.8, 5.5, y); }); } },
      extra: (G, S, J, L) => {
        for (let i = 0; i < 5; i++) { const y = S.hip + 6 + i * 6; G.add(loft([[y, 0, -7.4, 1.8, 2.4], [y + 3.4, 0, -10.6, 0.2, 0.2]], 5, { topDome: 0.1 }), C('#f0a020'), y > S.chest - 4 ? 'chest' : 'spine'); }
        G.add(tube([0, S.hip - 2, -7], [0, 8, -36], 5.2, 1.0, L.limb + 2), C('#3a9a3a'), 'hips');
        hood(G, S, L, '#3a9a3a', '#f2e6b0');
      } }),
  };
  function star(g, P, x, y, r) { P.fill(g, '#f6d24a', q => { for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.42 : r, a = i / 10 * TAU; q.lineTo(x + Math.sin(a) * rr, y + Math.cos(a) * rr); } q.closePath(); }); }
  OUTFITS.grownup = {
    // a navy duffel coat with toggles, a stripy scarf, dark trousers and boots, a torch for the dark road
    coat: {
      sleeveEase: 1.3, legEase: 1.2, pelvisEase: 1.2,
      base: { torso: '#34465e', sleeve: '#34465e', pelvis: '#34465e', legs: '#33343c' },
      paint: {
        torso(g, S, fr, P) {
          P.ribsV(g, -fr.c / 2, fr.c / 2, fr.y0, fr.y1, 0.8, '#26354a', 0.2);
          P.rect(g, -0.25, fr.y0 - 5, 0.25, fr.y1 - 4, '#26354a');
          for (let i = 0; i < 3; i++) { const y = fr.y0 + 6 + i * 9; P.rect(g, -2.8, y - 0.2, 2.8, y + 0.2, '#6a4a2a'); P.rect(g, -0.6, y - 1.6, 0.6, y + 1.6, '#e9dcc0'); }
          for (const k of [1, -1]) P.stroke(g, '#26354a', 0.4, q => q.rect(k > 0 ? 5 : -12, fr.y0 + 1, 7, 6));
        },
        sleeve: (g, S, fr, P) => P.rect(g, -fr.c, fr.y0 - 5, fr.c, fr.y0 + 4, '#2c3c52'),
        pelvis: (g, S, fr, P) => { P.rect(g, -0.25, fr.y0 - 5, 0.25, fr.y1 + 5, '#26354a'); const y = (fr.y0 + fr.y1) / 2; P.rect(g, -0.6, y - 1.6, 0.6, y + 1.6, '#e9dcc0'); },
      },
      shoe: shoe('#3a2a1e'),
      extra: (G, S, J, L, torso) => {
        // the coat's skirt down to the knee, the scarf round the neck with a hanging end
        const hw0 = torso[0][3], hd0 = torso[0][4], sk = [[S.knee + 4, 0, 0.6, hw0 + 4.4, hd0 + 3.8], [S.hip - 6, 0, 0.4, hw0 + 2.6, hd0 + 2.2], [S.hip + 6, 0, 0.3, hw0 + 1.3, hd0 + 1.2]];
        G.add(shell(sk, -179.5, 179.5, L.torso, 0.7, 0), (x, y, z, nx, ny, nz) => (y < S.knee + 6 && ny < -0.5 ? C('#26354a') : C('#34465e')), (x, y) => [['hips', 1]]); // (a thick shell: solid from inside too)
        const nr = 0.31 * S.head.r[0], ys = S.neck - 1.5, red = C('#c23a3a'), cream = C('#efe6d2');
        const stripes = (x, y) => (Math.floor(y / 2.2) % 2 ? red : cream);
        G.add(loft([[ys - 2, 0, -0.8, nr + 4, nr + 3.4], [ys + 1.5, 0, -0.9, nr + 3.4, nr + 2.8], [ys + 4, 0, -1, nr + 2.2, nr + 1.8]], L.limb + 4, { bottom: false, top: false }), stripes, (x, y) => [['chest', 0.7], ['neck', 0.3]]);
        const ez = surf(torso, ys - 10, 22, 0.8);
        G.add(rbox([ez[0], ys - 9, ez[2]], [4.4, 18, 1.2], 0.5, [-6, 22, 4], 1), (x, y) => (Math.floor(y / 2.2) % 2 ? red : cream), 'chest');
      },
    },
  };

  // ---------------------------------------------------------------- props (hidden by scaling their bone to zero)
  function buildProps(G, S, J, kind, L) {
    const at = b => J['p_' + b], want = new Set(PROPS_FOR[kind] || []), on = p => want.has(p);
    const paper = C('#ece8dc'), ink = C('#5a564c'), sg = L.limb + 2;
    if (on('paper')) { const P = at('paper'); for (const sx of [-1, 1]) G.add(rbox([P[0] + sx * 13, P[1], P[2] - Math.abs(sx) * 1.6], [26, 36, 0.45], 0.15, [0, sx * 9, 0], 1), (x, y) => { const lx = x - P[0], ly = y - P[1], col = Math.floor((lx + 40) / 3.3) % 2, row = Math.floor((ly + 40) / 1.15) % 2; return (ly > 12 && ly < 14.5) ? ink : (col && row && ly < 10 && Math.abs(lx) > 2 ? ink.clone().lerp(paper, 0.45) : paper); }, 'p_paper', { noAO: true }); }
    if (on('mug')) { const M = at('mug'); G.add(tube([M[0] + 3.2, M[1] - 4.5, M[2]], [M[0] + 3.2, M[1] + 4.5, M[2]], 3.5, 3.6, sg), (x, y) => y > M[1] + 4.2 ? C('#7a4a2a') : C('#d8493b'), 'p_mug'); G.add(torusArc([M[0] - 0.2, M[1], M[2]], 2.0, 0.55, Math.PI, [0, 0, 90], null, 6, 4), C('#d8493b'), 'p_mug'); }
    if (on('sponge')) { const Sp = at('sponge'); G.add(rbox([Sp[0], Sp[1] - 1, Sp[2] + 1.5], [4.6, 3.2, 8], 1.0, null, 1), (x, y) => y > Sp[1] - 0.3 ? C('#3c8a3e') : C('#f2d24a'), 'p_sponge'); }
    if (on('spoon')) { const Sw = at('spoon'); G.add(tube([Sw[0], Sw[1] + 3, Sw[2]], [Sw[0], Sw[1] - 22, Sw[2] + 3], 0.6, 0.55, 4), C('#c79a5c'), 'p_spoon'); G.add(ell([Sw[0], Sw[1] - 24, Sw[2] + 3.2], [1.9, 3.0, 0.8], [6, 4]), C('#c79a5c'), 'p_spoon'); }
    if (on('can')) { const Cn = at('can'), green = C('#3f8f4c'); G.add(rbox([Cn[0], Cn[1] - 13, Cn[2] + 3], [11, 15, 20], 3.2, null, 2), green, 'p_can'); G.add(tube([Cn[0], Cn[1] - 14, Cn[2] + 12], [Cn[0], Cn[1] - 6, Cn[2] + 30], 1.3, 0.9, 5), green, 'p_can'); G.add(ell([Cn[0], Cn[1] - 6, Cn[2] + 30.5], [2.2, 2.2, 1.0], [6, 4], [-60, 0, 0]), C('#2f6f3a'), 'p_can'); G.add(torusArc([Cn[0], Cn[1] - 3, Cn[2] + 2], 6.4, 0.9, Math.PI, [0, 90, 0], null, 8, 4), green, 'p_can'); }
    if (on('mag')) { const Mg = at('mag'); G.add(rbox([Mg[0], Mg[1], Mg[2]], [21, 28, 0.8], 0.25, [0, 0, 0], 1), (x, y) => y > Mg[1] + 10 ? C('#e64040') : (Math.floor(y) % 3 ? C('#f2efe4') : C('#7a7a70')), 'p_mag', { noAO: true }); }
    if (on('phone')) { const Ph = at('phone'); G.add(rbox([Ph[0], Ph[1] + 1, Ph[2] + 1], [2.4, 17, 4.6], 1.0, [6, 0, 0], 1), C('#e8e0c8'), 'p_phone'); }
    if (on('remote')) { const Rm = at('remote'); G.add(rbox([Rm[0], Rm[1] - 1.5, Rm[2] + 4], [4.2, 2, 15], 0.8, null, 1), (x, y, z) => y > Rm[1] - 0.6 && Math.floor(z) % 2 ? C('#9a9a9a') : C('#262626'), 'p_remote'); }
    if (on('crayon')) { const Cr = at('crayon'); G.add(tube([Cr[0], Cr[1] + 2, Cr[2]], [Cr[0], Cr[1] - 6, Cr[2] + 1.5], 0.45, 0.45, 4), C('#e2463c'), 'p_crayon'); }
    if (on('pad')) G.add(rbox([0, 0.4, 0], [30, 0.8, 21], 0.25, [0, 0, 0], 1), (x, y, z) => (Math.hypot(x - 4, z - 2) < 4.5 && Math.hypot(x - 4, z - 2) > 3.6) || (Math.abs(x + 6) < 0.6 && Math.abs(z) < 6) ? C('#2a8a4a') : C('#fbfaf4'), 'p_pad', { noAO: true });
    if (on('bag')) { const Bg = at('bag'); G.add(rbox([Bg[0], Bg[1] - 6, Bg[2] + 2], [20, 24, 9], 3, null, 1), (x, y) => y < Bg[1] - 13 ? C('#2a4a8a') : C('#d64262'), 'p_bag'); }
    if (on('case')) { const Bc = at('case'); G.add(rbox([Bc[0], Bc[1] - 16, Bc[2]], [9, 30, 42], 1.2, null, 1), (x, y) => y > Bc[1] - 2.5 ? C('#c9b27a') : C('#3a2618'), 'p_case'); G.add(torusArc([Bc[0], Bc[1] - 0.8, Bc[2]], 4, 0.6, Math.PI, [0, 90, 0], null, 6, 4), C('#2a1a10'), 'p_case'); }
    if (on('pail')) { const Pa = at('pail'); G.add(loft([[Pa[1] - 15.5, Pa[0], Pa[2] + 1, 5.4, 5.4], [Pa[1] - 13.5, Pa[0], Pa[2] + 1, 7.4, 7.4], [Pa[1] - 8, Pa[0], Pa[2] + 1, 7.8, 7.8], [Pa[1] - 4.6, Pa[0], Pa[2] + 1, 6.6, 6.6]], sg + 2, { topDome: -1.2 }), (x, y, z) => { const yy = y - (Pa[1] - 10); return (z - Pa[2] > 5 && (Math.abs(Math.abs(x - Pa[0]) - 2.6) < 1.1 && yy > 0.5 && yy < 2.6 || Math.abs(yy + 2) < 0.7 && Math.abs(x - Pa[0]) < 3.5)) ? C('#2a1606') : C('#f07a1a'); }, 'p_pail'); G.add(torusArc([Pa[0], Pa[1] - 4.6, Pa[2] + 1], 6.4, 0.32, Math.PI, [0, 90, 0], null, 8, 4), C('#1a1a1a'), 'p_pail'); }
    if (on('raygun')) { const Rg = at('raygun'); G.add(rbox([Rg[0], Rg[1] + 1, Rg[2] + 4], [2.2, 3.6, 10], 1, null, 1), C('#d63a2c'), 'p_raygun'); G.add(tube([Rg[0], Rg[1] + 1.5, Rg[2] + 9], [Rg[0], Rg[1] + 1.5, Rg[2] + 13], 0.9, 0.5, 5), C('#c9ced6'), 'p_raygun'); G.add(ell([Rg[0], Rg[1] + 1.5, Rg[2] + 13.4], [1.1, 1.1, 0.6], [6, 4]), C('#4af04a'), 'p_raygun', { noAO: true }); }
    if (on('torch')) { const Tc = at('torch'); G.add(tube([Tc[0], Tc[1] + 1, Tc[2] - 4], [Tc[0], Tc[1] + 1, Tc[2] + 9], 1.5, 1.6, 6), C('#2a3a6a'), 'p_torch'); G.add(tube([Tc[0], Tc[1] + 1, Tc[2] + 9], [Tc[0], Tc[1] + 1, Tc[2] + 12], 1.9, 2.4, 6), C('#c9ced6'), 'p_torch'); G.add(ell([Tc[0], Tc[1] + 1, Tc[2] + 12.1], [2.1, 2.1, 0.4], [6, 4]), C('#fff4c0'), 'p_torch', { noAO: true }); }
    if (on('string')) { const St = at('string'); G.add(tube([St[0], St[1], St[2]], [St[0], St[1] - 30, St[2]], 0.12, 0.12, 3), C('#f4f4f4'), 'p_string', { noAO: true }); G.add(xf(new T.CylinderGeometry(2.6, 2.6, 2.4, 10), [0, 0, 0], [0, 0, 90]), (x) => Math.abs(x) < 0.4 ? C('#f4f4f4') : C('#1fb0d8'), 'yoyo'); }
  }

  // ---------------------------------------------------------------- the contact shadow (soft blobs under the body and each foot)
  let blobTex = null;
  function blob() {
    if (blobTex) return blobTex;
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(0.45, 'rgba(0,0,0,.6)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); blobTex = new T.CanvasTexture(c); return blobTex;
  }
  function shadowGeo(S) {
    const G = Geo(BONES);
    const quad = (w, d, bone) => { const g = new T.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); g.translate(0, 0.35, 0); g.deleteAttribute('uv'); G.add(g, C('#000000'), bone, { noAO: true }); };
    quad(S.H * 0.36, S.H * 0.24, 'shBody'); quad(S.foot.w * 2.3, S.foot.len * 1.3, 'shL'); quad(S.foot.w * 2.3, S.foot.len * 1.3, 'shR');
    const g = G.build(), n = g.attributes.position.count, uv = new Float32Array(n * 2), pu = [0, 1, 1, 1, 0, 0, 1, 0];
    for (let i = 0; i < n; i++) { uv[i * 2] = pu[(i % 4) * 2]; uv[i * 2 + 1] = pu[(i % 4) * 2 + 1]; }
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    return g;
  }

  // ================================================================ the material: stock lighting + the painted face
  // One program for everybody (the same onBeforeCompile source); each person has their own material for their own atlas
  // and face-frame uniforms. The fragment picks the eye and mouth frames from the atlas (the old games' texture swap).
  const FACE_DECL = 'varying vec3 vNpFace;\nuniform vec4 npEye;\nuniform vec4 npMouth;\nuniform vec2 npEyeCell;\nuniform vec2 npMouthCell;\nuniform vec2 npGaze;\nuniform float npRim;\n';
  const FACE_FRAG = `
    if (vNpFace.z > 0.002) {
      vec2 npf = vNpFace.xy;
      vec4 npc = texture2D(map, vec2(0.0, 0.5) + clamp(npf * 0.25 + 0.25, 0.01, 0.49), -0.6);
      diffuseColor.rgb = mix(diffuseColor.rgb, npc.rgb, npc.a * vNpFace.z * step(max(abs(npf.x), abs(npf.y)), 0.94));
      vec2 npg = npf - npGaze;
      vec2 npe = (vec2(abs(npg.x), npg.y) - npEye.xy) / npEye.zw * 0.5 + 0.5;
      float npm = step(0.0, npe.x) * step(npe.x, 1.0) * step(0.0, npe.y) * step(npe.y, 1.0);
      npc = texture2D(map, npEyeCell + clamp(npe, 0.0, 1.0) * 0.125, -0.8);
      diffuseColor.rgb = mix(diffuseColor.rgb, npc.rgb, npc.a * npm * vNpFace.z);
      vec2 npq = (npf - npMouth.xy) / npMouth.zw * 0.5 + 0.5;
      npm = step(0.0, npq.x) * step(npq.x, 1.0) * step(0.0, npq.y) * step(npq.y, 1.0);
      npc = texture2D(map, npMouthCell + clamp(npq, 0.0, 1.0) * 0.125, -0.8);
      diffuseColor.rgb = mix(diffuseColor.rgb, npc.rgb, npc.a * npm * vNpFace.z);
    }`;
  // a soft warm rim (Medium/High: the Phong path): lifts the people off the walls, like the illustrated games did
  const RIM_FRAG = '\n  totalEmissiveRadiance += npRim * pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0) * diffuseColor.rgb;';
  function npCompile(shader) {
    Object.assign(shader.uniforms, this.userData.np);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 npFace;\nvarying vec3 vNpFace;').replace('#include <uv_vertex>', '#include <uv_vertex>\n  vNpFace = npFace;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + FACE_DECL).replace('#include <color_fragment>', '#include <color_fragment>' + FACE_FRAG).replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>' + RIM_FRAG);
  }
  function material(low, tex, uni) {
    const P = { vertexColors: true, skinning: true, map: tex };
    const m = low ? new T.MeshLambertMaterial(P) : new T.MeshPhongMaterial(Object.assign(P, { shininess: 6, specular: new T.Color('#0c0c0c') }));
    m.userData.np = { npEye: { value: new T.Vector4(...uni.eye) }, npMouth: { value: new T.Vector4(...uni.mouth) }, npEyeCell: { value: new T.Vector2(CELL.eye(0)[0], CELL.eye(0)[1]) }, npMouthCell: { value: new T.Vector2(CELL.mouth(0)[0], CELL.mouth(0)[1]) }, npGaze: { value: new T.Vector2() }, npRim: { value: low ? 0 : 0.12 } };
    m.onBeforeCompile = npCompile;
    return m;
  }
  let shadowMat = null;
  const shadowMaterial = () => shadowMat || (shadowMat = new T.MeshBasicMaterial({ map: blob(), color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false, skinning: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));

  const _q = new T.Quaternion(), _q2 = new T.Quaternion(), _v = new T.Vector3(), _v2 = new T.Vector3(), _v3 = new T.Vector3(), _m = new T.Matrix4(), _m2 = new T.Matrix4(), _e = new T.Euler();
  const _bx = new T.Vector3(), _by = new T.Vector3(), _bz = new T.Vector3(), UPV = new T.Vector3(0, 1, 0);
  // rotation basis: the segment's direction d (its -y axis in the rest frame) and the pole p (its +z)
  function basis(m, d, p) {
    _by.copy(d).negate(); _bz.copy(p); _bx.crossVectors(_by, _bz).normalize();
    return m.makeBasis(_bx, _by, _bz);
  }

  function create(kind, opts) {
    opts = opts || {};
    const low = opts.tier === 'low' || opts.tier === 'potato';
    const LOD = low ? [1, 2] : [0, 1], texSize = opts.tier === 'potato' ? 256 : 512; // [near, far] detail levels
    let outfit = opts.outfit && OUTFITS[kind][opts.outfit] ? opts.outfit : Object.keys(OUTFITS[kind])[0];
    // each outfit: its meshes (by detail level) and its painted atlas
    const outfits = {}, look = opts.look;
    const dress = name => {
      const o = outfits[name] || (outfits[name] = { geo: {}, tex: null, uni: null });
      if (!o.geo[lodNow]) { const b = buildPerson(kind, name, lodNow, look); o.geo[lodNow] = b.geometry; o.tris = o.tris || {}; o.tris[lodNow] = b.tris; if (!o.tex) { const a = paintAtlas(b.S, b.O, texSize, b.frames); o.tex = a.tex; o.uni = a.uni; } o.S = o.S || b.S; o.J = o.J || b.J; }
      return o;
    };
    let lodNow = LOD[0];
    const first = dress(outfit);
    const S = first.S, J = first.J;
    const bones = BONES.map(n => { const b = new T.Bone(); b.name = n; return b; }), B = {};
    BONES.forEach((n, i) => { B[n] = bones[i]; });
    for (const n of BONES) { const p = PARENT[n], j = J[n]; if (p) { B[p].add(B[n]); const pj = J[p]; B[n].position.set(j[0] - pj[0], j[1] - pj[1], j[2] - pj[2]); } else B[n].position.set(j[0], j[1], j[2]); }
    const mat = material(low, first.tex, first.uni), U = mat.userData.np;
    const body = new T.SkinnedMesh(first.geo[lodNow], mat);
    body.add(B.base); body.updateMatrixWorld(true);
    const skeleton = new T.Skeleton(bones);
    body.bind(skeleton);
    const shadow = new T.SkinnedMesh(shadowGeo(S), shadowMaterial());
    shadow.bind(skeleton, new T.Matrix4());
    shadow.renderOrder = 2;
    // bound in the rest pose; now put the props away
    const face = { eye: EYE.open, mouth: MOUTH.smile };
    const setFace = (eye, mouth) => {
      if (eye !== face.eye) { face.eye = eye; const c = CELL.eye(eye); U.npEyeCell.value.set(c[0], c[1]); }
      if (mouth !== face.mouth) { face.mouth = mouth; const c = CELL.mouth(mouth); U.npMouthCell.value.set(c[0], c[1]); }
    };
    const useLod = near => {
      const want = near ? LOD[0] : LOD[1]; if (want === lodNow && body.geometry === outfits[outfit].geo[lodNow]) return;
      lodNow = want; body.geometry = dress(outfit).geo[lodNow];
    };
    for (const p of PROPS) B['p_' + p].scale.setScalar(0);
    B.yoyo.scale.setScalar(0);
    body.userData.noPick = true; shadow.userData.noPick = true; shadow.userData.contactShadow = true;
    body.frustumCulled = true; shadow.frustumCulled = false;
    const group = new T.Group(); group.name = 'np.' + kind; group.scale.set(1, -1, 1); // house space is y-down; the rig is y-up
    group.add(body); group.add(shadow);
    // the pick volume (an invisible box round the body: F talks to them)
    const proxy = new T.Mesh(new T.BoxGeometry(S.H * 0.3, S.H * 0.92, S.H * 0.2), new T.MeshBasicMaterial({ visible: false }));
    proxy.position.set(0, S.H * 0.48, 0); proxy.userData.npc = kind; group.add(proxy);

    // rest frames for the limbs (two-bone IK writes world rotations from them)
    const segs = {};
    const restDir = (a, b) => V(J[b][0] - J[a][0], J[b][1] - J[a][1], J[b][2] - J[a][2]);
    for (const sd of ['L', 'R']) {
      segs['thigh' + sd] = { L: restDir('thigh' + sd, 'shin' + sd).length(), d0: restDir('thigh' + sd, 'shin' + sd).normalize(), p0: V(0, 0, 1) };
      segs['shin' + sd] = { L: restDir('shin' + sd, 'foot' + sd).length(), d0: restDir('shin' + sd, 'foot' + sd).normalize(), p0: V(0, 0, 1) };
      segs['arm' + sd] = { L: restDir('arm' + sd, 'fore' + sd).length(), d0: restDir('arm' + sd, 'fore' + sd).normalize(), p0: V(0, 0, -1) };
      segs['fore' + sd] = { L: restDir('fore' + sd, 'hand' + sd).length(), d0: restDir('fore' + sd, 'hand' + sd).normalize(), p0: V(0, 0, -1) };
      for (const k of ['thigh', 'shin', 'arm', 'fore']) { const s = segs[k + sd]; s.p0.addScaledVector(s.d0, -s.p0.dot(s.d0)).normalize(); s.inv = basis(new T.Matrix4(), s.d0, s.p0).clone().invert(); }
    }
    const legLen = segs.thighL.L + segs.shinL.L;

    // ---------------------------------------------------------------- state
    const st = {
      x: 0, y: 0, z: 0, h: 0, v: 0, t: Math.random() * 100,
      gait: 0, walking: false,
      feet: [{ x: 0, y: 0, z: 0, yaw: 0, swing: null, side: 1, lift: 0, stance: -1 }, { x: 0, y: 0, z: 0, yaw: 0, swing: null, side: -1, lift: 0, stance: -1 }],
      placed: false,
      action: null, seat: null, look: null, carry: false, props: {}, sitK: 0,
      talkUntil: 0, talkStart: 0, talkSeed: Math.floor(Math.random() * 9), talkText: '', mouth: 0,
      blinkAt: 1 + Math.random() * 3, blinkT: 0,
      gaze: { x: 0, y: 0 }, saccadeAt: 0, glanceAt: 3, glance: null,
      sm: {}, hairS: 0, hairV: 0, seed: Math.random() * 9, lean: Math.random() < 0.5 ? 1 : -1, wside: 0, glanceT: 0,
    };
    const floorFn = { f: null };
    const fwd = new T.Vector3();
    const forward = h => fwd.set(Math.sin(h), 0, Math.cos(h));
    function toRig(out, x, y, z) { // house coords -> rig space
      const dx = x - st.x, dz = z - st.z, c = Math.cos(st.h), s = Math.sin(st.h);
      return out.set(dx * c - dz * s, st.y - y, dx * s + dz * c);
    }
    const restPt = { x: 0, z: 0 };
    const footRest = (i, out) => { // where a foot stands when standing still (house coords)
      const f = st.feet[i], side = f.side * (S.hipX - 1.2), c = Math.cos(st.h), s = Math.sin(st.h);
      out.x = st.x + side * c; out.z = st.z - side * s; return out;
    };
    const floorAt = (x, z) => { const v = floorFn.f ? floorFn.f(x, z) : null; return v == null ? st.y : v; };
    function placeFeet() {
      for (let i = 0; i < 2; i++) { const f = st.feet[i]; footRest(i, restPt); f.x = restPt.x; f.z = restPt.z; f.y = floorAt(f.x, f.z); f.yaw = st.h + f.side * 0.12; f.swing = null; f.lift = 0; f.stance = -1; }
      st.placed = true;
    }

    function slerpTo(name, q, k) {
      const cur = st.sm[name] || (st.sm[name] = B[name].quaternion.clone());
      cur.slerp(q, k); B[name].quaternion.copy(cur);
    }
    const W = {};
    for (const n of BONES) W[n] = { p: new T.Vector3(), q: new T.Quaternion() };
    function fk(name) {
      const p = PARENT[name], w = W[name], pw = W[p], j = J[name], pj = J[p];
      w.q.copy(pw.q).multiply(B[name].quaternion);
      w.p.set(j[0] - pj[0], j[1] - pj[1], j[2] - pj[2]).applyQuaternion(pw.q).add(pw.p);
    }

    // two-bone IK in rig space: root joint, target, pole (where the middle joint goes) -> world rotations
    const ikMid = new T.Vector3(), ikT = new T.Vector3(), ikD = new T.Vector3(), ikP = new T.Vector3(), ikA = new T.Vector3(), ikB = new T.Vector3();
    function ik(rootP, target, upper, lower, pole, qUpper, qLower) {
      const L1 = upper.L, L2 = lower.L;
      ikD.copy(target).sub(rootP); let d = ikD.length();
      d = clamp(d, Math.abs(L1 - L2) + 0.5, L1 + L2 - 0.15); ikD.normalize();
      const cosA = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
      ikP.copy(pole).addScaledVector(ikD, -pole.dot(ikD)); if (ikP.lengthSq() < 1e-6) ikP.set(0, 0, 1).addScaledVector(ikD, -ikD.z); ikP.normalize();
      ikMid.copy(rootP).addScaledVector(ikD, L1 * cosA).addScaledVector(ikP, L1 * sinA);
      ikT.copy(rootP).addScaledVector(ikD, d);
      ikA.copy(ikMid).sub(rootP).normalize(); ikB.copy(ikT).sub(ikMid).normalize();
      _v.copy(ikP).addScaledVector(ikA, -ikP.dot(ikA)).normalize();
      qUpper.setFromRotationMatrix(basis(_m, ikA, _v).multiply(upper.inv));
      _v2.copy(ikP).addScaledVector(ikB, -ikP.dot(ikB)).normalize();
      qLower.setFromRotationMatrix(basis(_m2, ikB, _v2).multiply(lower.inv));
      return ikT;
    }

    const qT = new T.Quaternion(), qS = new T.Quaternion(), qA = new T.Quaternion(), qB = new T.Quaternion(), qF = new T.Quaternion();
    const tgt = new T.Vector3(), pole = new T.Vector3(), hipP = new T.Vector3(), tmp = new T.Vector3();
    const eul = (x, y, z, o) => _q.setFromEuler(_e.set(x * D2R, y * D2R, z * D2R, o || 'XYZ'));

    // ---------------------------------------------------------------- locomotion: plant, swing, step
    function gaitUpdate(dt) {
      const stepLen = S.H * S.step, cycle = 2 * stepLen, duty = 0.6;
      const moving = st.v > 4 && !st.seat;
      if (!st.placed) placeFeet();
      if (moving) {
        if (!st.walking) { // start: the foot further behind lifts first
          st.walking = true;
          const f0 = st.feet[0], f1 = st.feet[1], fw = forward(st.h);
          const back0 = (f0.x - st.x) * fw.x + (f0.z - st.z) * fw.z, back1 = (f1.x - st.x) * fw.x + (f1.z - st.z) * fw.z;
          const lead = back0 < back1 ? 0 : 1; st.gait = (duty - (lead ? 0.5 : 0) + 1) % 1;
          for (const f of st.feet) f.swing = null;
        }
        st.gait = (st.gait + st.v * dt / cycle) % 1;
        for (let i = 0; i < 2; i++) {
          const f = st.feet[i], p = (st.gait + (i ? 0.5 : 0)) % 1;
          if (p >= duty) {
            const s = (p - duty) / (1 - duty);
            if (!f.swing || f.swing.kind !== 'walk') f.swing = { kind: 'walk', x0: f.x, y0: f.y, z0: f.z, yaw0: f.yaw };
            // where it lands: the body at landing time, plus half the stance travel ahead
            const tLand = (1 - p) * cycle / Math.max(st.v, 1), fw = forward(st.h), ahead = st.v * tLand + duty * cycle * 0.5;
            const side = f.side * (S.hipX - 1.4), c = Math.cos(st.h), sn = Math.sin(st.h);
            const lx = st.x + fw.x * ahead + side * c, lz = st.z + fw.z * ahead - side * sn, ly = floorAt(lx, lz);
            const e = smooth(s), sw = f.swing;
            f.x = lerp(sw.x0, lx, e); f.z = lerp(sw.z0, lz, e);
            const stairs = Math.abs(ly - sw.y0) > 2;
            f.y = lerp(sw.y0, ly, smooth(clamp(s * 1.25 - 0.1, 0, 1))) - Math.sin(Math.PI * s) * (stairs ? 10 : 5.5);
            f.yaw = sw.yaw0 + angd(sw.yaw0, st.h + f.side * 0.1) * e; f.lift = Math.sin(Math.PI * s);
          } else { if (f.swing) { f.swing = null; f.y = floorAt(f.x, f.z); } f.lift = 0; }
          f.stance = p < duty ? p / duty : -1;
        }
      } else {
        if (st.walking) { st.walking = false; for (const f of st.feet) if (f.swing && f.swing.kind === 'walk') f.swing = { kind: 'step', t: 0, dur: 0.22, x0: f.x, y0: f.y, z0: f.z, yaw0: f.yaw }; }
        const busy = st.feet.some(f => f.swing);
        for (let i = 0; i < 2; i++) {
          const f = st.feet[i];
          if (!f.swing && !busy && !st.seat) {
            footRest(i, restPt); const err = Math.hypot(f.x - restPt.x, f.z - restPt.z), turn = Math.abs(angd(f.yaw, st.h + f.side * 0.12));
            const other = st.feet[1 - i]; footRest(1 - i, restPt); const oerr = Math.hypot(other.x - restPt.x, other.z - restPt.z) + Math.abs(angd(other.yaw, st.h + other.side * 0.12)) * 12;
            if ((err > 9 || turn > 0.5) && err + turn * 12 >= oerr - 0.01) f.swing = { kind: 'step', t: 0, dur: 0.3, x0: f.x, y0: f.y, z0: f.z, yaw0: f.yaw };
          }
          if (f.swing && f.swing.kind === 'step') {
            const sw = f.swing; sw.t += dt; const s = clamp(sw.t / sw.dur, 0, 1), e = smooth(s); footRest(i, restPt); const ly = floorAt(restPt.x, restPt.z);
            f.x = lerp(sw.x0, restPt.x, e); f.z = lerp(sw.z0, restPt.z, e); f.y = lerp(sw.y0, ly, e) - Math.sin(Math.PI * s) * 4;
            f.yaw = sw.yaw0 + angd(sw.yaw0, st.h + f.side * 0.12) * e; f.lift = Math.sin(Math.PI * s);
            if (s >= 1) { f.swing = null; f.y = ly; f.lift = 0; }
          } else if (!f.swing) f.lift = 0;
          f.stance = -1;
        }
      }
    }

    // ---------------------------------------------------------------- arms
    // FK arm pose: [flex (forward), abduct (out), twist, elbow bend, wrist flex, wrist turn]
    function armFK(sd, a, k) {
      const s = sd === 'L' ? 1 : -1;
      qA.setFromEuler(_e.set(-a[0] * D2R, s * a[2] * D2R, s * a[1] * D2R, 'XZY')); slerpTo('arm' + sd, qA, k); fk('arm' + sd);
      qB.setFromEuler(_e.set(-a[3] * D2R, 0, 0)); slerpTo('fore' + sd, qB, k); fk('fore' + sd);
      qF.setFromEuler(_e.set(a[4] * D2R, s * (a[5] || 0) * D2R, 0)); slerpTo('hand' + sd, qF, k); fk('hand' + sd);
    }
    function armIK(sd, target, poleDir, k, handQ) {
      fk('arm' + sd);
      ik(W['arm' + sd].p, target, segs['arm' + sd], segs['fore' + sd], poleDir, qA, qB);
      _q2.copy(W['clav' + sd].q).invert().multiply(qA); slerpTo('arm' + sd, _q2, k); fk('arm' + sd);
      _q2.copy(W['arm' + sd].q).invert().multiply(qB); slerpTo('fore' + sd, _q2, k); fk('fore' + sd);
      slerpTo('hand' + sd, handQ, k); fk('hand' + sd);
    }
    // the actions: ACT[name](t, H) with H = the hips' height now (stood or sat). Arms are FK arrays or
    // { ik: wrist target, pole: where the elbow goes, hand: wrist rotation }. Everything in rig space.
    const lap = H => ({ L: { ik: [-9.5, H + 9, 21], pole: [0.9, -0.3, -0.6], hand: [-70, 0, -8] }, R: { ik: [9.5, H + 9, 21], pole: [-0.9, -0.3, -0.6], hand: [-70, 0, 8] } });
    const table = H => (st.seat && st.seat.table) || H + 22;
    const mouthAt = H => S.mouthY - (S.hip + 2 - H);
    const ACT = {
      washup: (t, H) => ({ arms: { L: { ik: [-7 + Math.sin(t * 1.1) * 1.5, H + 2, 34], pole: [0.6, -0.4, -1], hand: [-30, 0, -20] }, R: { ik: [7 + Math.cos(t * 5) * 2.6, H + 2.5 + Math.sin(t * 5) * 1.6, 35 + Math.sin(t * 5) * 2], pole: [-0.6, -0.4, -1], hand: [-30, 0, 20] } }, lean: 9, lookR: [0, H + 2, 42], props: { sponge: 1 } }),
      cook: (t, H) => ({ arms: { L: { ik: [-17, H + 7, 27], pole: [0.8, -0.3, -1], hand: [-70, 0, 0] }, R: { ik: [7 + Math.cos(t * 3.4) * 3.2, H + 15, 33 + Math.sin(t * 3.4) * 3.2], pole: [-0.7, -0.4, -1], hand: [-10, 0, 0] } }, lean: 6, lookR: [5, H + 6, 40], props: { spoon: 1 } }),
      wipe: (t, H) => ({ arms: { L: { ik: [-15, H - 9, 31], pole: [0.8, -0.2, -1], hand: [-75, 0, 0] }, R: { ik: [9 + Math.cos(t * 2.6) * 9, H - 9.5, 37 + Math.sin(t * 2.6) * 6], pole: [-0.7, -0.3, -1], hand: [-80, 0, 0] } }, lean: 22, lookR: [6, H - 14, 40], props: { sponge: 1 } }),
      water: (t, H) => ({ arms: { L: [6, 8, 0, 25, 0], R: { ik: [12, H + 2 + Math.sin(t * 0.8) * 2, 30], pole: [-0.7, -0.5, -1], hand: [20 + Math.sin(t * 0.8) * 12, 0, 0] } }, lean: 6, lookR: [10, 0, 90], props: { can: 1 } }),
      phone: (t, H) => ({ arms: { R: { ik: [9, S.neck + 7 - (S.hip + 2 - H), 3], pole: [-0.2, -1, -0.5], hand: [-15, 75, 0] }, L: talkArm(t, 'L', 0.6) }, lean: 0, props: { phone: 1 } }),
      paper: (t, H) => ({ arms: { L: { ik: [-15, H + 24 + Math.sin(t * 0.4) * 0.6, 31], pole: [0.8, -0.6, -0.8], hand: [-60, -40, -10] }, R: { ik: [15, H + 24 + Math.sin(t * 0.4) * 0.6, 31], pole: [-0.8, -0.6, -0.8], hand: [-60, 40, 10] } }, lean: -4, lookR: [0, H + 30, 40], props: { paper: 1 } }),
      magazine: (t, H) => ({ arms: { L: { ik: [-9, H + 18, 27], pole: [0.8, -0.6, -0.8], hand: [-60, -30, 0] }, R: { ik: [8, H + 14, 25], pole: [-0.8, -0.6, -0.8], hand: [-40, 20, 0] } }, lean: -2, lookR: [-4, H + 22, 34], props: { mag: 1 } }),
      telly: (t, H) => ({ arms: lap(H), lean: -6, props: {} }),
      remote: (t, H) => ({ arms: { L: lap(H).L, R: { ik: [10, H + 14, 28], pole: [-0.9, -0.5, -0.6], hand: [-30, 0, 0] } }, lean: -8, props: { remote: 1 } }),
      tea: (t, H) => { const ph = t % 9, sip = ph < 2.4, s = smooth(Math.min(1, ph < 1.2 ? ph / 0.7 : (2.4 - ph) / 0.7)), tb = table(H); return { arms: { L: { ik: [-12, tb + 3, 27], pole: [0.9, -0.3, -0.7], hand: [-75, 0, 0] }, R: { ik: sip ? [lerp(11, 3, s), lerp(tb + 6, mouthAt(H) - 3, s), lerp(28, 12, s)] : [11, tb + 6, 28], pole: [-0.9, -0.5, -0.3], hand: [-20, 0, 0] } }, lean: 3, props: { mug: 1 } }; },
      draw: (t, H) => { const tb = table(H); return { arms: { L: { ik: [-9, tb + 3, 26], pole: [0.9, -0.4, -0.6], hand: [-80, 0, 0] }, R: { ik: [5 + Math.sin(t * 6) * 1.6, tb + 3.6 + Math.abs(Math.sin(t * 3)) * 0.5, 27 + Math.cos(t * 4.3) * 1.6], pole: [-0.9, -0.4, -0.6], hand: [-70, 0, 0] } }, lean: 16, lookR: [2, tb, 28], props: { crayon: 1, pad: 1 } }; },
      yoyo: (t, H) => { const ph = (t * 0.9) % 1, d = ph < 0.5 ? smooth(ph * 2) : 1 - smooth((ph - 0.5) * 2); return { arms: { L: [4, 6, 0, 14, 0], R: [42 + d * 6, 10, 0, 70 - d * 25, -10 + d * 30] }, yoyo: d, lean: 0, lookR: [8, H - 4, 30], props: { string: 1 } }; },
      carwash: (t, H) => ({ arms: { L: { ik: [-12, H + 16, 32], pole: [0.8, -0.3, -1], hand: [-80, 0, 0] }, R: { ik: [12 + Math.cos(t * 2.4) * 8, H + 12 + Math.sin(t * 2.4) * 6, 38], pole: [-0.8, -0.3, -1], hand: [-80, 0, 0] } }, lean: 14, lookR: [10, H + 10, 50], props: { sponge: 1 } }),
      sit: (t, H) => ({ arms: lap(H), lean: -3, props: {} }),
      doze: (t, H) => ({ arms: lap(H), lean: -8, props: {}, doze: 1 }),
      mug: (t, H) => { const ph = (t + st.talkSeed * 3) % 11, sip = ph < 2.4, s = smooth(Math.min(1, ph < 1.2 ? ph / 0.7 : (2.4 - ph) / 0.7)); return { arms: { L: [6, 7, 0, 22, 0], R: { ik: sip ? [lerp(9, 3, s), lerp(H + 20, mouthAt(H) - 3, s), lerp(22, 12, s)] : [9, H + 20, 22], pole: [-0.9, -0.6, -0.3], hand: [-15, 0, 0] } }, lean: 0, props: { mug: 1 } }; },
      reach: (t, H) => ({ arms: { R: { ik: [9, H + 13, 40], pole: [-0.8, -0.6, -0.4], hand: [-10, 0, -60] } }, lean: 4, props: {} }),
      carry: (t, H) => ({ arms: { L: { ik: [-13, H + 13, 24], pole: [0.9, -0.5, -0.5], hand: [-80, 0, 0] }, R: { ik: [13, H + 13, 24], pole: [-0.9, -0.5, -0.5], hand: [-80, 0, 0] } }, lean: -3, props: {} }),
      trick: (t, H) => ({ arms: { R: [18 + Math.sin(t * 1.3) * 3, 9, 0, 38, 0], L: st.props?.raygun ? [30, 12, 0, 45, -10] : [4, 7, 0, 16, 0] }, lean: 0, props: { pail: 1 } }),
      leave: () => ({ arms: null, props: kind === 'dad' ? { case: 1 } : kind === 'sister' ? { bag: 1 } : {} }),
      torch: (t, H) => ({ arms: { L: { ik: [15, H + 4 + Math.sin(t * 0.7) * 1.2, 20], pole: [0.6, -0.6, -0.6], hand: [-60, 0, 0] }, R: [4, 7, 0, 18, 0] }, lean: 0, props: { torch: 1 } }),
    };
    function talkArm(t, sd, amp) {
      const s = st.talkSeed + (sd === 'L' ? 0 : 7), g = 0.5 + 0.5 * Math.sin(t * 1.6 + s);
      return [10 + g * 26 * amp + wob(t * 2.2, s) * 5, 9 + wob(t * 1.4, s + 2) * 5, -12 + wob(t, s) * 8, 28 + g * 50 * amp, -8 + wob(t * 3, s) * 14, 30 + g * 40];
    }

    // ---------------------------------------------------------------- update
    const lookR = new T.Vector3();
    function update(dt, near) {
      st.t += dt; const t = st.t;
      const k = 1 - Math.exp(-dt * 9);
      gaitUpdate(dt);
      const seat = st.seat;
      // ---- hips: height, sway, bob, sitting
      st.sitK += ((seat ? 1 : 0) - st.sitK) * (1 - Math.exp(-dt * 3.2));
      const sitK = smooth(st.sitK);
      let hx = 0, hy = S.hip + 2, hz = 0, roll = 0, yaw = 0, pitch = 0;
      if (st.walking) {
        const g = st.gait * TAU, spd = clamp(st.v / S.speed, 0, 1.4);
        hy += -Math.cos(g * 2) * 1.1 * spd - 0.8 * spd; hx = Math.sin(g) * 1.3 * spd; roll = -Math.sin(g) * 2.2 * spd; yaw = Math.sin(g) * 5 * spd; pitch = 3 * spd;
      } else {
        // weight shifts slowly from foot to foot
        // a relaxed stance: weight on one leg (each person has a favourite side), drifting slowly, now and then swapping
        const ws = Math.sin(t * 0.33 + st.seed) * 0.5 + Math.sin(t * 0.13) * 0.3, side = Math.sin(t * 0.045 + st.seed) > -0.35 ? st.lean : -st.lean;
        st.wside += (side - st.wside) * (1 - Math.exp(-dt * 1.2));
        hx = st.wside * 1.7 + ws * 0.8; roll = st.wside * 3.4 + ws * 1.2; hy -= 0.8 + Math.abs(ws) * 0.3;
      }
      if (sitK > 0.001 && seat) {
        hx = lerp(hx, 0, sitK); hy = lerp(hy, seat.h + 7.5, sitK); hz = lerp(hz, seat.back ? -2 : 0, sitK); roll *= 1 - sitK; yaw *= 1 - sitK; pitch = lerp(pitch, seat.back ? -10 : -2, sitK);
      }
      // never stretch a leg: the hips drop if a foot is low (stairs, a wide stance)
      W.base.p.set(0, 0, 0); W.base.q.identity();
      const reach = legLen * 0.985;
      if (sitK < 0.5) for (let i = 0; i < 2; i++) {
        const f = st.feet[i];
        toRig(tmp, f.x, f.y, f.z); tmp.y += S.ankle;
        const jx = (i ? -1 : 1) * S.hipX + hx, dx = tmp.x - jx, dz = tmp.z - hz;
        const maxY = tmp.y + Math.sqrt(Math.max(0, reach * reach - dx * dx - dz * dz));
        if (hy - 2 > maxY) hy = maxY + 2;
      }
      B.hips.position.set(hx, hy, hz);
      const act = st.action && ACT[st.action] ? ACT[st.action](t, hy) : null;
      _q.setFromEuler(_e.set(pitch * D2R, yaw * D2R, roll * D2R, 'YXZ')); slerpTo('hips', _q, st.walking ? 1 : k);
      W.hips.p.copy(B.hips.position); W.hips.q.copy(B.hips.quaternion);
      // ---- spine/chest: counter-rotate the walk, lean into the action, breathe
      const lean = (act?.lean || 0) + (st.walking ? 2 : 0), breathe = Math.sin(t * 1.7) * 0.9;
      _q.setFromEuler(_e.set((lean * 0.45 + (seat ? (seat.back ? 4 : 2) : 0)) * D2R, -yaw * 0.6 * D2R, -roll * 0.5 * D2R, 'YXZ')); slerpTo('spine', _q, k); fk('spine');
      _q.setFromEuler(_e.set((lean * 0.55 - breathe * 0.6) * D2R, -yaw * 0.5 * D2R, -roll * 0.35 * D2R, 'YXZ')); slerpTo('chest', _q, k); fk('chest');
      for (const sd of ['L', 'R']) { _q.setFromEuler(_e.set(0, 0, (sd === 'L' ? 1 : -1) * breathe * 0.5 * D2R)); slerpTo('clav' + sd, _q, k); fk('clav' + sd); }
      // ---- legs: IK to the feet (or to the floor in front of the seat)
      for (let i = 0; i < 2; i++) {
        const f = st.feet[i], sd = i ? 'R' : 'L', s = i ? -1 : 1;
        hipP.set(J['thigh' + sd][0] - J.hips[0], J['thigh' + sd][1] - J.hips[1], J['thigh' + sd][2] - J.hips[2]).applyQuaternion(W.hips.q).add(W.hips.p);
        if (seat && sitK > 0.001) {
          const kz = seat.knee || (segs['thigh' + sd].L * 0.95);
          tgt.set(s * (S.hipX + 1.5), S.ankle, hz + kz + 3);
          toRig(tmp, f.x, f.y, f.z); tmp.y += S.ankle;
          tgt.lerp(tmp, 1 - sitK);
        } else {
          toRig(tgt, f.x, f.y, f.z); tgt.y += S.ankle;
          if (f.stance > 0.72) tgt.y += (f.stance - 0.72) / 0.28 * S.foot.len * 0.16; // toe-off: the heel rises
        }
        const fy = f.yaw - st.h; pole.set(Math.sin(fy) + s * 0.12, 0.05, Math.cos(fy));
        if (seat) pole.set(s * 0.12, 0.6, 1);
        ik(hipP, tgt, segs['thigh' + sd], segs['shin' + sd], pole, qT, qS);
        _q2.copy(W.hips.q).invert().multiply(qT); B['thigh' + sd].quaternion.copy(_q2);
        _q2.copy(qT).invert().multiply(qS); B['shin' + sd].quaternion.copy(_q2);
        let fp = 0; if (f.stance > 0.72) fp = (f.stance - 0.72) / 0.28 * 26; else if (f.stance >= 0 && f.stance < 0.12) fp = -(1 - f.stance / 0.12) * 8; else if (f.lift) fp = -6 * f.lift;
        if (seat) fp = lerp(fp, 0, sitK);
        qF.setFromEuler(_e.set(fp * D2R, fy, 0, 'YXZ'));
        _q2.copy(qS).invert().multiply(qF); B['foot' + sd].quaternion.copy(_q2);
      }
      // ---- arms
      const swing = st.walking ? clamp(st.v / S.speed, 0, 1.3) : 0, g = st.gait * TAU;
      const talking = performance.now() < st.talkUntil;
      for (const sd of ['L', 'R']) {
        const s = sd === 'L' ? 1 : -1;
        let a = act?.arms ? act.arms[sd] : null;
        if (!a && st.carry) a = ACT.carry(t, hy).arms[sd];
        if (!a && seat) a = ACT.sit(t, hy).arms[sd];
        if (!a && talking && (sd === 'R' || st.talkSeed % 2)) a = talkArm(t, sd, sd === 'R' ? 1 : 0.55);
        if (!a) { const sw = Math.sin(g + (sd === 'L' ? Math.PI : 0)) * 19 * swing; a = [6 + sw + wob(t * 0.4, s) * 1.5, 9 + wob(t * 0.3, s + 3) * 1.2 - 2 * swing, -12 * (1 - swing * 0.5), 24 + Math.max(0, sw) * 0.8 + 6 * swing, 10, -10]; }
        if (Array.isArray(a)) armFK(sd, a, k);
        else { tgt.set(a.ik[0], a.ik[1], a.ik[2]); pole.set(a.pole[0], a.pole[1], a.pole[2]).normalize(); armIK(sd, tgt, pole, k, eul(a.hand[0], a.hand[1], a.hand[2])); }
      }
      // ---- props
      const props = Object.assign({}, act?.props || {}, st.props || {});
      for (const p of PROPS) { const on = props[p] ? 1 : 0, b = B['p_' + p], cur = b.scale.x, nv = cur + (on - cur) * (1 - Math.exp(-dt * 12)); b.scale.setScalar(nv < 0.02 && !on ? 0 : nv); }
      if (props.pad) B.p_pad.position.set(0, table(hy) + 0.2, 30);
      if (props.string) { // the string hangs straight down from the fingers; the yo-yo rides its end
        const yo = act?.yoyo || 0, h = J.handR;
        tmp.set(0, -S.handLen * 0.9, 1.2).applyQuaternion(W.handR.q).add(W.handR.p);
        const len = 3 + yo * 28;
        B.p_string.position.copy(tmp); B.p_string.quaternion.identity(); B.p_string.scale.set(1, len / 30 * B.p_string.scale.x, 1);
        B.yoyo.position.set(tmp.x, tmp.y - len, tmp.z); B.yoyo.rotation.x = t * 30; B.yoyo.scale.setScalar(1);
      } else B.yoyo.scale.setScalar(0);
      // the paper and the magazine: held up between the hands, turned to face the reader
      for (const [p, wide] of [['paper', 1], ['mag', 0]]) {
        const b = B['p_' + p]; if (!b.scale.x) continue;
        const c = wide ? tmp.copy(W.handL.p).add(W.handR.p).multiplyScalar(0.5) : tmp.copy(W.handL.p);
        c.y += wide ? 9 : 8; if (!wide) c.x += 4;
        fk('head'); _v.copy(c).sub(W.head.p); _v.y *= 0.5; _v.normalize(); // the sheet's normal: from the eyes to the page
        _bx.crossVectors(UPV, _v).normalize(); _by.crossVectors(_v, _bx).normalize();
        _m.makeBasis(_bx, _by, _v); b.quaternion.setFromRotationMatrix(_m); b.position.copy(c).add(_v.multiplyScalar(-1.5));
      }
      // ---- head and eyes: look at something (the player when close), glance about now and then
      fk('neck');
      let look = null;
      if (st.look) { toRig(lookR, st.look.x, st.look.y, st.look.z); look = lookR; }
      else if (act?.lookR) look = lookR.set(act.lookR[0], act.lookR[1], act.lookR[2]);
      else {
        if (t > st.glanceAt) { st.glanceAt = t + 2.5 + Math.random() * 5; st.glance = Math.random() < 0.55 ? null : [(Math.random() - 0.5) * 140, S.neck + (Math.random() - 0.4) * 30, 120]; }
        if (st.glance) look = lookR.set(st.glance[0], st.glance[1], st.glance[2]);
      }
      let yawH = 0, pitchH = 0, lookYawRaw = 0, lookPitchRaw = 0;
      if (look) {
        tmp.copy(look).sub(W.neck.p); tmp.applyQuaternion(_q2.copy(W.chest.q).invert());
        yawH = Math.atan2(tmp.x, tmp.z); pitchH = Math.atan2(tmp.y - 6, Math.hypot(tmp.x, tmp.z)); lookYawRaw = yawH; lookPitchRaw = pitchH;
        if (Math.abs(yawH) > 1.7) { yawH = 0; pitchH = 0; lookYawRaw = 0; lookPitchRaw = 0; }
        yawH = clamp(yawH, -1.15, 1.15); pitchH = clamp(pitchH, -0.6, 0.45);
      }
      if (st.walking && !st.look) pitchH -= 0.08;
      if (act?.doze && !st.look) { yawH = 0.25; pitchH = 0.32; }
      const nod = talking ? Math.sin(t * 5.3) * 0.03 + Math.sin(t * 2.1) * 0.04 : 0;
      _q.setFromEuler(_e.set(-pitchH * 0.4, yawH * 0.4, 0, 'YXZ')); slerpTo('neck', _q, k * 0.7); fk('neck');
      _q.setFromEuler(_e.set(-pitchH * 0.6 - nod, yawH * 0.6, Math.sin(t * 0.21) * 0.03, 'YXZ')); slerpTo('head', _q, k * 0.7); fk('head');
      // the bunches bounce
      st.hairV += (-st.hairS * 40 - st.hairV * 4 + (st.walking ? Math.cos(g * 2) * 8 : 0)) * dt; st.hairS += st.hairV * dt;
      B.hairL.rotation.set(st.hairS * 0.05, 0, 0.05 + st.hairS * 0.06); B.hairR.rotation.set(st.hairS * 0.05, 0, -0.05 - st.hairS * 0.06);
      useLod(near);
      if (!near) { setFace(act?.doze ? EYE.shut : EYE.open, MOUTH.smile); U.npGaze.value.set(0, 0); return; } // far away: no face animation
      // the painted eyes lead the head a little and dart about now and then
      const holding = !!st.look;
      if (t > st.saccadeAt) {
        st.saccadeAt = t + (holding ? 0.6 + Math.random() * 1.6 : 0.4 + Math.random() * 2.2);
        const away = holding && Math.random() < 0.18; // now and then a quick look away while thinking
        st.gaze.x = away ? (Math.random() < 0.5 ? -1 : 1) * (0.1 + Math.random() * 0.06) : (Math.random() - 0.5) * (holding ? 0.04 : 0.16);
        st.gaze.y = away ? 0.02 + Math.random() * 0.04 : (Math.random() - 0.5) * (holding ? 0.03 : 0.08);
        if (away) st.saccadeAt = t + 0.35 + Math.random() * 0.3;
      }
      // the head turns most of the way; the painted eyes cover what's left so they meet your eyes
      const resY = holding ? clamp(lookYawRaw - yawH * 0.92, -0.6, 0.6) : yawH * 0.4, resP = holding ? clamp(lookPitchRaw - pitchH * 0.9, -0.5, 0.5) : pitchH * 0.4;
      U.npGaze.value.set(clamp(resY * 0.09 + st.gaze.x * 0.25, -0.05, 0.05), clamp(resP * 0.08 + st.gaze.y * 0.25, -0.035, 0.035));
      // blink (a quick shut frame); reading or washing up looks down with heavy lids; dozing: shut
      if (t > st.blinkAt) { st.blinkT = 0.15; st.blinkAt = t + 2 + Math.random() * 4.5; if (Math.random() < 0.15) st.blinkAt = t + 0.35; }
      let eye = EYE.open; if (!st.look && !talking && (st.action === 'paper' || st.action === 'draw' || st.action === 'magazine' || st.action === 'washup')) eye = EYE.half; if (act?.doze && !st.look) eye = EYE.shut;
      if (st.blinkT > 0) { st.blinkT -= dt; eye = EYE.shut; }
      // talking: mouth frames from the line's rhythm (syllable-ish beats, rounder on o/u, closed at punctuation)
      let open = 0, ch = ' ';
      if (talking) {
        const el = (performance.now() - st.talkStart) / 1000, text = st.talkText;
        const ci = Math.floor(el * 13.5); ch = text[ci] || ' ';
        const pause = /[.,!?;:]/.test(text[ci - 1] || '') || /[.,!?;:]/.test(ch);
        const beat = Math.abs(Math.sin(el * 11.5 + Math.sin(el * 3.1) * 1.4));
        open = pause ? 0.05 : clamp(beat * (/[aeiouAEIOU]/.test(ch) ? 1 : 0.6), 0, 1);
        if (el < 0.7 && /!/.test(text) && eye === EYE.open) eye = EYE.happy; // a cheery line starts with smiling eyes
      }
      st.mouth += (open - st.mouth) * (1 - Math.exp(-dt * 22));
      const m = st.mouth < 0.18 ? MOUTH.smile : st.mouth > 0.4 && /[oOuUwW]/.test(ch) ? MOUTH.oh : st.mouth > 0.58 ? MOUTH.open : MOUTH.small;
      setFace(eye, m);
    }

    // shadows: under the hips, and under each foot (fading as it lifts)
    function shadows() {
      const fy = floorAt(st.x, st.z);
      B.shBody.position.set(0, st.y - fy, 0); B.shBody.scale.setScalar(st.seat ? 1.15 : 1);
      for (let i = 0; i < 2; i++) {
        const f = st.feet[i], b = i ? B.shR : B.shL; toRig(tmp, f.x, floorAt(f.x, f.z), f.z);
        b.position.set(tmp.x, tmp.y, tmp.z + S.foot.len * 0.2); b.rotation.y = f.yaw - st.h; b.scale.setScalar(1 - (f.lift || 0) * 0.5);
      }
    }

    const rig = {
      kind, S, J, group, mesh: body, shadow, proxy, bones: B, st, face,
      get tris() { return outfits[outfit].tris[lodNow]; },
      get lod() { return lodNow; },
      get outfit() { return outfit; },
      setOutfit(name) {
        if (name === outfit || !OUTFITS[kind][name]) return;
        const o = dress(name); outfit = name; body.geometry = o.geo[lodNow]; mat.map = o.tex;
      },
      set floor(fn) { floorFn.f = fn; },
      root(x, y, z, h, v) { st.x = x; st.y = y; st.z = z; st.h = h; st.v = v || 0; group.position.set(x, y, z); group.rotation.y = h; },
      teleport(x, y, z, h) { rig.root(x, y, z, h, 0); st.walking = false; placeFeet(); st.sm = {}; },
      set(o) { if ('action' in o) st.action = o.action || null; if ('seat' in o) st.seat = o.seat || null; if ('look' in o) st.look = o.look || null; if ('carry' in o) st.carry = !!o.carry; if ('props' in o) st.props = o.props || {}; },
      talk(ms, text) { st.talkStart = performance.now(); st.talkUntil = st.talkStart + ms; st.talkText = String(text || ''); st.talkSeed = (st.talkSeed + 1) % 9; },
      hush() { st.talkUntil = 0; },
      get talking() { return performance.now() < st.talkUntil; },
      update(dt, near) {
        update(Math.min(dt, 0.1), near);
        shadows();
        const sitK = smooth(st.sitK); proxy.scale.set(1, lerp(1, 0.78, sitK), lerp(1, 2.2, sitK)); proxy.position.set(0, lerp(S.H * 0.48, S.H * 0.38, sitK), lerp(0, 6, sitK));
      },
      headWorld(out) { // house coords of the face (for look-at from others)
        const p = W.head.p, c = Math.cos(st.h), s = Math.sin(st.h);
        return out.set(st.x + p.x * c + p.z * s, st.y - p.y - 8, st.z - p.x * s + p.z * c);
      },
      dispose() { group.parent && group.parent.remove(group); for (const o of Object.values(outfits)) { for (const g of Object.values(o.geo)) g.dispose(); o.tex && o.tex.dispose(); } mat.dispose(); shadow.geometry.dispose(); proxy.geometry.dispose(); },
    };
    placeFeet();
    return rig;
  }

  window.NPCRig = { create, PEOPLE, LODS, OUTFITS: Object.fromEntries(Object.entries(OUTFITS).map(([k, v]) => [k, Object.keys(v)])), PROPS, BONES };
})();

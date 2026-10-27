/* np-rig: the family as real 3D people (Mom, Dad and the little sister). Everything is made here from primitives: no
 * model files, no textures. Each person is ONE skinned mesh (vertex colours, one material: one draw call) plus a soft
 * contact-shadow mesh on the same skeleton (a second call). Props (the paper, a mug, the yo-yo...) live inside that mesh
 * on their own bones and are shown by scaling the bone, so they cost nothing extra.
 *
 * The rig's own space is y-up centimetres, origin on the floor between the feet, facing +z. js/np-life.js puts the
 * group in the house (house space is y-down: the group carries scale.y = -1) and drives:
 *   rig.root(x, floorY, z, heading, speed)   where the body is (house coords; heading: forward = (sin h, cos h))
 *   rig.floor = (x, z) => house floor y       for the feet (stairs are steps)
 *   rig.set({ action, seat, look, carry })    what the person is doing; rig.talk(ms, text) moves the lips
 *   rig.update(dt, near)                      poses the skeleton (cheaper when far: no face detail)
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

  // ================================================================ geometry: everything is merged into one buffer
  function Geo(bones) {
    const P = [], N = [], Cl = [], SI = [], SW = [], I = [];
    const bi = name => { const i = bones.indexOf(name); if (i < 0) throw new Error('np bone ' + name); return i; };
    function add(g, color, weights, o) {
      o = o || {};
      if (!g.attributes.normal) g.computeVertexNormals();
      const p = g.attributes.position, n = g.attributes.normal, base = P.length / 3;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ny = n.getY(i);
        P.push(x, y, z); N.push(n.getX(i), ny, n.getZ(i));
        const c = typeof color === 'function' ? color(x, y, z, n.getX(i), ny, n.getZ(i)) : color;
        // soft "ambient occlusion": faces turned down (under the chin, a hem, the hair) are a touch darker
        const ao = o.noAO ? 1 : 1 - 0.14 * Math.max(0, -ny);
        Cl.push(c.r * ao, c.g * ao, c.b * ao);
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
  // ellipsoid
  const ell = (p, r, seg, rot) => xf(new T.SphereGeometry(1, seg?.[0] || 14, seg?.[1] || 10), p, rot, r);
  // rounded box: true round edges with smooth normals
  function rbox(p, size, rad, rot, seg) {
    const [w, h, d] = size, n = seg || 3, g = new T.BoxGeometry(w, h, d, n, n, n), pos = g.attributes.position, nor = g.attributes.normal;
    const hx = w / 2 - rad, hy = h / 2 - rad, hz = d / 2 - rad, v = new T.Vector3(), q = new T.Vector3(), dd = new T.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      q.set(clamp(v.x, -hx, hx), clamp(v.y, -hy, hy), clamp(v.z, -hz, hz));
      dd.copy(v).sub(q); if (dd.lengthSq() > 1e-8) { dd.normalize(); v.copy(q).addScaledVector(dd, rad); nor.setXYZ(i, dd.x, dd.y, dd.z); }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    return xf(g, p, rot);
  }
  // a tapered cylinder from a to b (closed)
  function tube(a, b, ra, rb, seg) {
    const A = V(...a), B = V(...b), d = B.clone().sub(A), L = d.length();
    const g = new T.CylinderGeometry(rb, ra, L, seg || 10, 1, false);
    g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize())).setPosition(A.clone().add(B).multiplyScalar(0.5)));
    return g;
  }
  const mesh = (pos, idx) => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  // a closed surface over a sphere-like grid: fn(azimuth, elevation) -> [x, y, z]. Azimuth 0 = front (+z), +90deg = +x.
  // No seams: the wrap column and the poles are shared, so normals are smooth everywhere.
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
  // a vertical loft through horizontal ellipses: rings [[y, cx, cz, halfWidth, halfDepth], ...] bottom to top
  function loft(rings, seg, o) {
    o = o || {};
    const pos = [], idx = [], R = rings.length;
    for (const [y, cx, cz, hw, hd] of rings) for (let i = 0; i < seg; i++) { const a = i / seg * TAU; pos.push(cx + hw * Math.sin(a), y, cz + hd * Math.cos(a)); }
    for (let j = 0; j < R - 1; j++) for (let i = 0; i < seg; i++) {
      const a = j * seg + i, b = j * seg + (i + 1) % seg, c = (j + 1) * seg + i, d = (j + 1) * seg + (i + 1) % seg;
      idx.push(a, b, d, a, d, c);
    }
    const capIt = (ring, up, dome) => {
      const [y, cx, cz] = rings[ring], ci = pos.length / 3; pos.push(cx, y + (up ? dome : -dome), cz);
      for (let i = 0; i < seg; i++) { const a = ring * seg + i, b = ring * seg + (i + 1) % seg; if (up) idx.push(ci, a, b); else idx.push(ci, b, a); }
    };
    if (o.bottom !== false) capIt(0, false, o.bottomDome || 0);
    if (o.top !== false) capIt(R - 1, true, o.topDome || 0);
    return mesh(pos, idx);
  }
  // Sharp colour bands on a loft: rings are added just either side of each boundary height.
  function banded(rings, ys) {
    const out = rings.slice(), at = y => { for (let i = 0; i < rings.length - 1; i++) { const a = rings[i], b = rings[i + 1]; if (y >= a[0] && y <= b[0]) { const t = (y - a[0]) / (b[0] - a[0]); return a.map((v, k) => lerp(v, b[k], t)); } } return null; };
    for (const y of ys) for (const d of [-0.04, 0.04]) { const r = at(y + d); if (r) out.push(r); }
    return out.sort((a, b) => a[0] - b[0]);
  }
  // the point on a loft at height y and angle a (degrees), pushed out by `out`
  function surf(rings, y, a, out) {
    let r = rings[0];
    for (let i = 0; i < rings.length - 1; i++) { const p = rings[i], q = rings[i + 1]; if (y >= p[0] && y <= q[0]) { const t = (y - p[0]) / (q[0] - p[0]); r = p.map((v, k) => lerp(v, q[k], t)); break; } if (y > q[0]) r = q; }
    const s = Math.sin(a * D2R), c = Math.cos(a * D2R), o = out || 0;
    return [r[1] + (r[3] + o) * s, y, r[2] + (r[4] + o) * c];
  }
  // A thick shell over part of a loft (a cardigan, a bib, a strap, a collar). Angles in degrees per ring
  // (numbers or functions of the ring index); 0 = front. `off` pushes the shell out from the rings.
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
  const torusArc = (p, r, tube_, arc, rot, s, seg) => xf(new T.TorusGeometry(r, tube_, 6, seg || 18, arc), p, rot, s);

  // ================================================================ the people
  // Measurements in cm. Mom 163, Dad 178, the little sister (9) 133: real scale against 204 cm doors and 45 cm seats.
  const PEOPLE = {
    mom: {
      H: 163, ankle: 7.5, knee: 46, hip: 85, hipX: 8.6, spine: 97, chest: 113, neck: 137, headY: 141.5,
      sh: [17.8, 130.5, -1.5], elbow: [19.8, 104.5, -2.5], wrist: [20.0, 81.5, -0.8], handLen: 16,
      head: { c: [0, 151.6, 0.6], r: [9.5, 10.9, 10.3], jaw: 0.3, chin: 1.3, drop: 0.9, flat: 1.4, cheek: 0.45, sock: 0.55 },
      eye: { x: 3.55, y: 151.0, r: 1.72, iris: '#4f6b47' }, foot: { len: 23.5, w: 8.6, h: 7, heel: -5 },
      skin: '#efc3a3', blush: '#e7978a', lips: '#b9606a', brow: '#53301f', hair: '#5b3424', hair2: '#74452f',
      step: 0.34, speed: 98,
    },
    dad: {
      H: 178, ankle: 8, knee: 50, hip: 93, hipX: 9.6, spine: 106, chest: 124, neck: 150, headY: 155,
      sh: [21, 144, -1.5], elbow: [23, 115, -3], wrist: [23.2, 89.5, -1], handLen: 18,
      head: { c: [0, 165.6, 0.4], r: [10.1, 11.7, 11.0], jaw: 0.22, chin: 1.5, drop: 1.2, flat: 1.5, cheek: 0.35, sock: 0.6 },
      eye: { x: 3.8, y: 164.8, r: 1.72, iris: '#4f6687' }, foot: { len: 27, w: 9.8, h: 7.6, heel: -5.5 },
      skin: '#e7b593', blush: '#d99079', lips: '#b07467', brow: '#3a281c', hair: '#3f2c20', hair2: '#523b2b',
      step: 0.34, speed: 104,
    },
    sister: {
      H: 133, ankle: 6.2, knee: 36, hip: 66, hipX: 7.0, spine: 75, chest: 88, neck: 105.5, headY: 108.5,
      sh: [14.0, 102.5, -1], elbow: [15.4, 83, -1.6], wrist: [15.5, 64.5, -0.4], handLen: 12,
      head: { c: [0, 119.0, 0.7], r: [9.5, 10.2, 9.9], jaw: 0.3, chin: 0.7, drop: 0.5, flat: 1.0, cheek: 0.75, sock: 0.45 },
      eye: { x: 3.45, y: 117.3, r: 1.92, iris: '#4a6ea6' }, foot: { len: 18.5, w: 7.2, h: 6.2, heel: -4 },
      skin: '#f5ceb0', blush: '#f09a8a', lips: '#cf7b7e', brow: '#8a6238', hair: '#b4864d', hair2: '#cba062',
      step: 0.33, speed: 96,
    },
  };
  const BONES = ['base', 'hips', 'spine', 'chest', 'neck', 'head', 'mouth', 'jaw', 'brow', 'eyeL', 'eyeR', 'lidL', 'lidR', 'hairL', 'hairR',
    'clavL', 'armL', 'foreL', 'handL', 'clavR', 'armR', 'foreR', 'handR', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR',
    'shBody', 'shL', 'shR', 'yoyo',
    'p_paper', 'p_mug', 'p_sponge', 'p_plate', 'p_spoon', 'p_can', 'p_mag', 'p_phone', 'p_remote', 'p_crayon', 'p_pad', 'p_bag', 'p_case', 'p_string'];
  const PARENT = { hips: 'base', spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck', mouth: 'head', jaw: 'head', brow: 'head', eyeL: 'head', eyeR: 'head', lidL: 'head', lidR: 'head', hairL: 'head', hairR: 'head',
    clavL: 'chest', armL: 'clavL', foreL: 'armL', handL: 'foreL', clavR: 'chest', armR: 'clavR', foreR: 'armR', handR: 'foreR',
    thighL: 'hips', shinL: 'thighL', footL: 'shinL', thighR: 'hips', shinR: 'thighR', footR: 'shinR',
    shBody: 'base', shL: 'base', shR: 'base', yoyo: 'base',
    p_paper: 'base', p_mug: 'handR', p_sponge: 'handR', p_plate: 'handL', p_spoon: 'handR', p_can: 'handR', p_mag: 'base', p_phone: 'handR', p_remote: 'handR', p_crayon: 'handR', p_pad: 'base', p_bag: 'chest', p_case: 'handR', p_string: 'base' };
  const PROPS = BONES.filter(b => b.startsWith('p_')).map(b => b.slice(2));

  // ---------------------------------------------------------------- the head: one sculpted surface
  function headShape(S) {
    const P = S.head, [cx, cy, cz] = P.c, [rx, ry, rz] = P.r, e = S.eye;
    const raw = (a, el) => {
      const ce = Math.cos(el), x = ce * Math.sin(a), y = Math.sin(el), z = ce * Math.cos(a);
      const low = smooth(clamp(-y / 0.92, 0, 1)), high = smooth(clamp(y / 0.9, 0, 1));
      let px = x * rx * (1 - P.jaw * low * low - 0.05 * high), py = y * ry, pz = z * rz;
      if (z > 0) { pz += P.chin * low * low * z; py -= P.drop * low * z; } else pz *= 1 - 0.2 * low;
      if (z > 0.62) pz -= (z - 0.62) * P.flat;
      if (z < 0 && y > -0.45) pz *= 1 + 0.07 * smooth((y + 0.45) / 0.9);
      const ch = Math.exp(-(((Math.abs(x) - 0.52) / 0.26) ** 2 + ((y + 0.3) / 0.26) ** 2));
      if (z > 0) { pz += P.cheek * ch; px += Math.sign(x) * P.cheek * 0.35 * ch; }
      return [cx + px, cy + py, cz + pz, z];
    };
    const fn = (a, el) => {
      const p = raw(a, el);
      if (p[3] > 0.25) for (const s of [1, -1]) { const dx = p[0] - s * e.x, dy = (p[1] - e.y) * 1.15, d2 = (dx * dx + dy * dy) / (e.r * e.r * 2.2); p[2] -= P.sock * Math.exp(-d2) * smooth((p[3] - 0.25) / 0.3); }
      return [p[0], p[1], p[2]];
    };
    // the front surface z at (x, y): Newton steps on the angles
    const front = (x, y) => {
      let a = Math.asin(clamp((x - cx) / rx, -0.95, 0.95)), el = Math.asin(clamp((y - cy) / ry, -0.95, 0.95));
      for (let i = 0; i < 12; i++) { const p = fn(a, el); a += (x - p[0]) / (rx * Math.max(0.3, Math.cos(el))) * 0.8; el += (y - p[1]) / ry * 0.8; }
      return fn(a, el)[2];
    };
    return { fn, raw, front };
  }

  // Joint positions (bind pose) for one person.
  function joints(S) {
    const J = {}, s = side => side === 'L' ? 1 : -1, e = S.eye, hp = S.head;
    J.base = [0, 0, 0]; J.hips = [0, S.hip + 2, 0]; J.spine = [0, S.spine, -0.6]; J.chest = [0, S.chest, -1]; J.neck = [0, S.neck, -1.4]; J.head = [0, S.headY, -0.6];
    const shape = S.shape = headShape(S);
    S.eyeZ = shape.front(e.x, e.y) + e.r * 0.42 - e.r;
    S.mouthY = e.y - (S.H > 150 ? 7.4 : 6.0);
    S.mouthZ = shape.front(0, S.mouthY);
    J.mouth = [0, S.mouthY, S.mouthZ - 0.3]; J.jaw = [0, S.mouthY - 0.5, S.mouthZ]; J.brow = [0, e.y + e.r + 1.4, shape.front(0, e.y + 2.4)];
    for (const side of ['L', 'R']) {
      const k = s(side);
      J['eye' + side] = [k * e.x, e.y, S.eyeZ]; J['lid' + side] = [k * e.x, e.y, S.eyeZ];
      J['hair' + side] = [k * (hp.r[0] + 0.8), hp.c[1] + 3.5, hp.c[2] - 2.5];
      J['clav' + side] = [k * 3.5, S.sh[1] + 0.5, S.sh[2]];
      J['arm' + side] = [k * S.sh[0], S.sh[1], S.sh[2]]; J['fore' + side] = [k * S.elbow[0], S.elbow[1], S.elbow[2]]; J['hand' + side] = [k * S.wrist[0], S.wrist[1], S.wrist[2]];
      J['thigh' + side] = [k * S.hipX, S.hip, 0]; J['shin' + side] = [k * (S.hipX - 0.8), S.knee, 0.6]; J['foot' + side] = [k * (S.hipX - 1.2), S.ankle, -0.4];
      J['sh' + side] = [k * (S.hipX - 1.2), 0, 0];
    }
    J.shBody = [0, 0, 0]; J.yoyo = [0, 0, 0];
    const hand = (side, dx, dy, dz) => { const h = J['hand' + side]; return [h[0] + dx, h[1] + dy, h[2] + dz]; };
    const L = S.handLen;
    J.p_paper = hand('L', -1.5, -L * 0.5, 2); J.p_mug = hand('R', 1.5, -L * 0.48, 2.5); J.p_sponge = hand('R', 0, -L * 0.55, 2); J.p_plate = hand('L', 0, -L * 0.55, 2);
    J.p_spoon = hand('R', 0, -L * 0.5, 2); J.p_can = hand('R', 0, -L * 0.5, 1); J.p_mag = hand('L', -1.5, -L * 0.5, 2); J.p_phone = hand('R', -1, -L * 0.48, 1);
    J.p_remote = hand('R', 0, -L * 0.52, 2); J.p_crayon = hand('R', 0, -L * 0.6, 1.5); J.p_pad = [0, 0, 0]; J.p_bag = [0, S.chest + 2, -14]; J.p_case = hand('R', 0, -L * 0.5, 0); J.p_string = hand('R', 0, -L * 0.62, 1.2);
    return J;
  }

  const blend = (v, a, b, A, B) => { const t = smooth((v - a) / (b - a)); return t <= 0 ? [[A, 1]] : t >= 1 ? [[B, 1]] : [[A, 1 - t], [B, t]]; };

  // ================================================================ building a person
  function buildPerson(kind, outfit, q) {
    const S = Object.assign({}, PEOPLE[kind]), J = joints(S), G = Geo(BONES);
    const sg = n => Math.max(6, Math.round(n * q));
    const skin = C(S.skin), lipC = C(S.lips), browC = C(S.brow), blush = C(S.blush);
    const k = side => side === 'L' ? 1 : -1;
    const O = OUTFITS[kind][outfit] || OUTFITS[kind][Object.keys(OUTFITS[kind])[0]];
    const e = S.eye, hp = S.head;

    // ---- head and neck
    const faceColor = (x, y, z) => {
      const c = skin.clone();
      for (const sx of [1, -1]) { const d = Math.hypot(x - sx * (e.x + 1.3), (y - (e.y - 3.4)) * 1.25); if (d < 3.4 && z > hp.c[2] + 4) c.lerp(blush, (1 - d / 3.4) * 0.5); }
      return c;
    };
    G.add(grid(sg(26), sg(36), S.shape.fn), faceColor, 'head');
    const nr = S.H > 150 ? 4.5 : 4.0;
    G.add(loft([[S.neck - 7, 0, -1.6, nr + 0.4, nr + 0.2], [S.neck - 1, 0, -1.3, nr, nr - 0.1], [S.headY + 2, 0, -0.8, nr - 0.2, nr - 0.2], [hp.c[1] - 4, 0, -0.4, nr - 0.4, nr - 0.4]], sg(14)),
      skin, (x, y) => blend(y, S.neck - 3, S.headY + 1, 'chest', 'head'));
    // ears
    for (const sd of ['L', 'R']) {
      const ex = k(sd) * (hp.r[0] * 0.97);
      G.add(ell([ex, e.y - 1.8, hp.c[2] - 1.6], [0.9, 2.6, 1.75], [12, 10], [0, k(sd) * 20, 0]), skin.clone().lerp(blush, 0.22), 'head');
      G.add(ell([ex + k(sd) * 0.35, e.y - 1.8, hp.c[2] - 1.2], [0.45, 1.7, 1.0], [8, 8], [0, k(sd) * 20, 0]), skin.clone().lerp(blush, 0.45).multiplyScalar(0.85), 'head', { noAO: true });
    }
    // nose: a soft wedge with a rounder tip
    const ns = kind === 'sister' ? 0.72 : 1, ny = e.y - 3.5 * (kind === 'sister' ? 0.85 : 1), nz = S.shape.front(0, ny);
    G.add(ell([0, ny + 1.2 * ns, nz - 0.25], [0.8 * ns, 2.0 * ns, 0.85 * ns], [10, 8], [-22, 0, 0]), skin.clone().lerp(blush, 0.12), 'head');
    G.add(ell([0, ny - 0.3 * ns, nz + 0.2 * ns], [1.15 * ns, 0.95 * ns, 0.95 * ns], [12, 8]), skin.clone().lerp(blush, 0.2), 'head');
    // eyes: white, iris ring, pupil, catchlight. They turn on their own bones; the lids rotate over them.
    for (const sd of ['L', 'R']) {
      const x = k(sd) * e.x, z = S.eyeZ, r = e.r, bone = 'eye' + sd;
      G.add(ell([x, e.y, z], [r, r, r], [14, 12]), C('#f6f2ea'), bone, { noAO: true });
      G.add(ell([x, e.y, z + r * 0.8], [r * 0.62, r * 0.64, r * 0.3], [14, 8]), (px, py) => Math.hypot(px - x, py - e.y) > r * 0.5 ? C(e.iris).multiplyScalar(0.62) : C(e.iris), bone, { noAO: true });
      G.add(ell([x, e.y, z + r * 0.95], [r * 0.3, r * 0.31, r * 0.14], [10, 6]), C('#120e0c'), bone, { noAO: true });
      G.add(ell([x + 0.3 * k(sd), e.y + 0.38, z + r * 1.05], [0.22, 0.22, 0.08], [6, 4]), C('#ffffff'), bone, { noAO: true });
      // the lid: a thick dome round the eyeball, its rim dark (the lashes). rotation.x: -42 open ... +36 shut.
      const lash = C(kind === 'dad' ? '#3c2a20' : '#22160f'), lidSkin = skin.clone().lerp(blush, 0.06);
      G.add(lidGeo(r).translate(x, e.y, z), (px, py) => (py - e.y < -r * 0.12 ? lash : lidSkin), 'lid' + sd, { noAO: true });
      // brow: a gentle arc
      const by = e.y + r + 1.45, bz = S.shape.front(x * 1.05, by) - 0.05;
      G.add(torusArc([x + k(sd) * 0.15, by - 1.6, bz], 2.2, kind === 'dad' ? 0.5 : kind === 'mom' ? 0.4 : 0.36, Math.PI * 0.62, [-10, k(sd) * 16, 90 - (Math.PI * 0.31) / D2R], [1.1, 1, 0.75]), browC, 'brow', { noAO: true });
    }
    // mouth: a dark inside that opens (mouth bone scales y), a hint of teeth, soft lips (lower one rides the jaw bone)
    const smile = (g, amt, x0) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) - x0; p.setY(i, p.getY(i) + amt * x * x); } g.computeVertexNormals(); return g; };
    const mw = S.H > 150 ? 2.15 : 1.75;
    G.add(smile(ell([0, S.mouthY, S.mouthZ - 0.45], [mw, 0.95, 0.75], [14, 8]), 0.035, 0), C('#4e1a20'), 'mouth', { noAO: true });
    G.add(smile(ell([0, S.mouthY + 0.55, S.mouthZ - 0.4], [mw * 0.68, 0.38, 0.5], [10, 6]), 0.03, 0), C('#efe9de'), 'mouth', { noAO: true });
    G.add(smile(ell([0, S.mouthY + 0.5, S.mouthZ - 0.15], [mw * 1.02, 0.42, 0.6], [14, 6]), 0.04, 0), skin.clone().lerp(lipC, 0.6), 'head', { noAO: true });
    G.add(smile(ell([0, S.mouthY - 0.55, S.mouthZ - 0.12], [mw * 0.86, 0.5, 0.62], [14, 6]), 0.03, 0), skin.clone().lerp(lipC, 0.75), 'jaw', { noAO: true });

    // ---- body
    const torsoW = (x, y) => {
      if (y > S.sh[1] - 9 && Math.abs(x) > S.sh[0] - 7) { const t = clamp((Math.abs(x) - (S.sh[0] - 7)) / 6, 0, 0.5) * clamp((y - (S.sh[1] - 9)) / 6, 0, 1); return [['chest', 1 - t], [x > 0 ? 'armL' : 'armR', t]]; }
      if (y > S.spine + 3) return blend(y, S.chest - 9, S.chest - 1, 'spine', 'chest');
      return blend(y, S.hip + 3, S.spine + 3, 'hips', 'spine');
    };
    S.torsoW = torsoW;
    const torso = O.torso(S);
    S.torsoRings = torso;
    G.add(loft(O.torsoBands ? banded(torso, O.torsoBands(S)) : torso, sg(28), { bottomDome: 1, topDome: 1.5 }), O.torsoColor(S), torsoW);
    const pelvis = O.pelvis(S);
    G.add(loft(pelvis, sg(26), { bottomDome: 0.6 }), O.pelvisColor(S), (x, y) => {
      if (y < S.hip + 1 && Math.abs(x) > 3) { const t = clamp((S.hip + 1 - y) / 6, 0, 0.45); return [['hips', 1 - t], [x > 0 ? 'thighL' : 'thighR', t]]; }
      return blend(y, S.hip + 4, S.spine + 3, 'hips', 'spine');
    }, { noAO: true });
    for (const sd of ['L', 'R']) {
      const a = J['arm' + sd], el = J['fore' + sd], wr = J['hand' + sd], kk = k(sd);
      const rings = O.arm(S, a, el, wr, kk);
      G.add(loft(O.armBands ? banded(rings, O.armBands(S)) : rings, sg(14), { topDome: 0.5, bottomDome: 0.3 }), O.armColor(S, a, el, wr), (x, y) => {
        if (y > a[1] - 3) return [['arm' + sd, 0.75], ['clav' + sd, 0.25]];
        if (y > el[1] + 3) return [['arm' + sd, 1]];
        if (y > el[1] - 3) return blend(y, el[1] - 3, el[1] + 3, 'fore' + sd, 'arm' + sd);
        return blend(y, wr[1] + 0.5, wr[1] + 3, 'hand' + sd, 'fore' + sd);
      });
      hand(G, S, wr, kk, 'hand' + sd, skin);
      const t = J['thigh' + sd], kn = J['shin' + sd], an = J['foot' + sd];
      const legs = O.leg(S, t, kn, an, kk);
      G.add(loft(O.legBands ? banded(legs, O.legBands(S)) : legs, sg(16), { topDome: 0.5 }), O.legColor(S), (x, y) => {
        if (y > S.hip - 3) return [['thigh' + sd, 0.7], ['hips', 0.3]];
        if (y > kn[1] + 4) return [['thigh' + sd, 1]];
        if (y > kn[1] - 4) return blend(y, kn[1] - 4, kn[1] + 4, 'shin' + sd, 'thigh' + sd);
        return [['shin' + sd, 1]];
      });
      O.shoe(G, S, an, kk, 'foot' + sd);
    }
    O.extra && O.extra(G, S, J, sg, torso, pelvis);
    HAIR[kind](G, S, J, sg, C(S.hair), C(S.hair2));
    buildProps(G, S, J, kind);
    return { geometry: G.build(), J, S, tris: G.tris };
  }
  // The eyelid dome: a thick spherical cap round the eyeball (centred on it), from the top down to 104 degrees.
  function lidGeo(r) {
    const ro = r * 1.1, ri = r * 1.02, th = 104 * D2R, rows = 8, cols = 18, pos = [], idx = [];
    const P = (rad, t, c) => { const ph = c / cols * TAU; return [rad * Math.sin(t) * Math.sin(ph), rad * Math.cos(t), rad * Math.sin(t) * Math.cos(ph)]; };
    const add = (rad, flip) => {
      const b = pos.length / 3; pos.push(0, rad, 0);
      for (let i = 1; i <= rows; i++) for (let c = 0; c < cols; c++) pos.push(...P(rad, th * i / rows, c));
      const at = (i, c) => b + 1 + (i - 1) * cols + (c % cols);
      for (let c = 0; c < cols; c++) flip ? idx.push(b, at(1, c), at(1, c + 1)) : idx.push(b, at(1, c + 1), at(1, c));
      for (let i = 1; i < rows; i++) for (let c = 0; c < cols; c++) { const a = at(i, c), bb = at(i, c + 1), cc = at(i + 1, c), d = at(i + 1, c + 1); flip ? idx.push(a, bb, d, a, d, cc) : idx.push(a, d, bb, a, cc, d); }
      return at;
    };
    const o = add(ro, false), inn = add(ri, true);
    for (let c = 0; c < cols; c++) { const a = o(rows, c), b = o(rows, c + 1), cc = inn(rows, c), d = inn(rows, c + 1); idx.push(a, cc, d, a, d, b); }
    const g = mesh(pos, idx);
    return g;
  }
  // a soft mitten hand: palm to fingertips in one loft (curled a little), and a thumb
  function hand(G, S, wr, kk, bone, color) {
    const L = S.handLen, x = wr[0] - kk * 0.4, y = wr[1], z = wr[2];
    const r = [[y - L * 0.98, x - kk * 0.9, z + 1.6, L * 0.06, L * 0.09], [y - L * 0.88, x - kk * 0.7, z + 1.2, L * 0.085, L * 0.155], [y - L * 0.66, x - kk * 0.3, z + 0.5, L * 0.1, L * 0.185], [y - L * 0.45, x, z + 0.1, L * 0.13, L * 0.195], [y - L * 0.22, x, z, L * 0.135, L * 0.175], [y - L * 0.02, x, z - 0.1, L * 0.125, L * 0.145], [y + L * 0.06, x, z - 0.1, L * 0.115, L * 0.13]];
    G.add(loft(r, 14, { bottomDome: L * 0.04, topDome: 0.2 }), color, bone);
    G.add(ell([x - kk * L * 0.05, y - L * 0.36, z + L * 0.2], [L * 0.065, L * 0.19, L * 0.075], [10, 8], [24, 0, kk * 14]), color, bone);
  }

  // ---------------------------------------------------------------- shared garment shapes
  const legRings = (S, t, kn, an, kk, wide, hem) => {
    const W = S.H / 163, e = wide || 0;
    return [
      [S.ankle + 1.4 - (hem ? 2.6 : 0), an[0], an[2] + 0.4, 3.1 * W + e * 0.8, 3.3 * W + e * 0.8],
      [S.ankle + 6, an[0] + kk * 0.1, an[2] + 0.2, 3.1 * W + e * 0.7, 3.4 * W + e * 0.7],
      [(S.ankle + kn[1]) * 0.5, kn[0] * 0.98 + an[0] * 0.02, -0.6, 4.2 * W + e * 0.6, 4.6 * W + e * 0.6],
      [kn[1] - 2, kn[0], kn[2] + 0.2, 4.2 * W + e * 0.6, 4.5 * W + e * 0.6],
      [kn[1] + 4, kn[0] + kk * 0.1, kn[2] + 0.4, 4.6 * W + e * 0.6, 4.9 * W + e * 0.6],
      [(kn[1] + S.hip) * 0.5, (kn[0] + t[0]) * 0.5 + kk * 0.3, 0.6, 5.8 * W + e, 6.1 * W + e],
      [S.hip - 4, t[0] - kk * 0.6, 0.6, 7.4 * W + e, 7.4 * W + e],
      [S.hip + 2, t[0] - kk * 0.9, 0.5, 7.6 * W + e, 7.8 * W + e],
    ];
  };
  const armRings = (S, a, el, wr, kk, ease) => {
    const W = S.H / 163, e = ease || 0;
    return [
      [wr[1] + 0.2, wr[0], wr[2], 2.25 * W + e * 0.4, 2.0 * W + e * 0.4],
      [wr[1] + 4, wr[0] + kk * 0.05, wr[2] - 0.2, 2.55 * W + e * 0.5, 2.3 * W + e * 0.5],
      [(wr[1] + el[1]) * 0.5, (wr[0] + el[0]) * 0.5, (wr[2] + el[2]) * 0.5 - 0.3, 3.05 * W + e * 0.6, 2.85 * W + e * 0.6],
      [el[1] - 1, el[0], el[2], 3.05 * W + e * 0.6, 2.85 * W + e * 0.6],
      [el[1] + 3, el[0] - kk * 0.1, el[2] + 0.1, 3.25 * W + e * 0.6, 3.15 * W + e * 0.6],
      [(el[1] + a[1]) * 0.5, (el[0] + a[0]) * 0.5, (el[2] + a[2]) * 0.5, 3.7 * W + e * 0.7, 3.75 * W + e * 0.7],
      [a[1] - 3, a[0] - kk * 0.5, a[2], 4.2 * W + e * 0.7, 4.5 * W + e * 0.7],
      [a[1] - 1.6, a[0] - kk * 2.4, a[2] - 0.2, 3.2 * W + e * 0.6, 4.0 * W + e * 0.6],
    ];
  };
  function trainer(G, S, an, kk, bone, upper, sole, trim) {
    const f = S.foot, x = an[0] + kk * 0.2, L = f.len, zc = f.heel + L / 2;
    G.add(rbox([x, f.h * 0.46, zc], [f.w, f.h * 0.92, L], f.w * 0.42, [0, -kk * 4, 0], 3), (px, py, pz) => py < 1.5 ? sole : (trim && (Math.abs(py - f.h * 0.55) < 0.6 || pz > zc + L * 0.38 && py > 2.2)) ? trim : upper, bone);
    G.add(rbox([x, S.ankle + 0.6, an[2] - 0.6], [f.w * 0.84, 5, f.w * 0.92], 2.2), upper, bone);
  }
  function shoe(G, S, an, kk, bone, leather) {
    const f = S.foot, x = an[0] + kk * 0.2, L = f.len, zc = f.heel + L / 2;
    G.add(rbox([x, f.h * 0.42, zc], [f.w * 0.92, f.h * 0.82, L], f.w * 0.4, [0, -kk * 4, 0], 3), (px, py) => py < 1.3 ? C('#17120f') : leather, bone);
    G.add(rbox([x, S.ankle + 0.3, an[2] - 0.8], [f.w * 0.8, 4.6, f.w * 0.88], 2), leather, bone);
  }
  // Each shell piece follows the torso's skinning so it bends with the body.
  const onTorso = S => (x, y) => S.torsoW(x, y);

  // ---------------------------------------------------------------- outfits
  const momTorso = S => [[S.hip + 2, 0, 0.6, 14.2, 9.8], [S.hip + 9, 0, 0.8, 13.3, 9.0], [S.spine + 4, 0, 0.8, 12.9, 8.7], [S.chest - 6, 0, 1.0, 13.6, 9.3], [S.chest + 1, 0, 1.7, 14.8, 10.1], [S.chest + 8, 0, 1.3, 15.2, 9.6], [S.sh[1] - 6, 0, 0.6, 15.7, 8.8], [S.sh[1] - 2, 0, -0.2, 16.6, 7.9], [S.sh[1] + 1.0, 0, -0.9, 14.4, 6.8], [S.sh[1] + 3.2, 0, -1.1, 10.0, 5.8], [S.neck - 0.5, 0, -1.3, 6.4, 5.0]];
  const dadTorso = S => [[S.hip + 2, 0, 1.2, 16.8, 11.8], [S.hip + 9, 0, 2.0, 16.6, 12.2], [S.spine + 3, 0, 2.2, 16.4, 12.0], [S.chest - 6, 0, 1.8, 17.0, 11.6], [S.chest + 2, 0, 1.6, 18.2, 11.6], [S.chest + 10, 0, 1.0, 19.2, 11.0], [S.sh[1] - 5, 0, 0.2, 20.0, 10.0], [S.sh[1] - 1, 0, -0.6, 20.6, 8.8], [S.sh[1] + 1.6, 0, -1.0, 17.4, 7.6], [S.sh[1] + 3.8, 0, -1.3, 11.6, 6.6], [S.neck - 0.5, 0, -1.4, 7.4, 5.8]];
  const sisTorso = S => [[S.hip + 2, 0, 0.8, 11.6, 8.4], [S.hip + 9, 0, 1.0, 11.3, 8.2], [S.spine + 3, 0, 0.9, 11.1, 8.0], [S.chest - 5, 0, 1.1, 11.5, 8.2], [S.chest + 2, 0, 1.2, 12.2, 8.3], [S.chest + 8, 0, 0.8, 12.6, 8.0], [S.sh[1] - 4, 0, 0.1, 12.6, 7.3], [S.sh[1] - 0.5, 0, -0.5, 13.4, 6.4], [S.sh[1] + 1.4, 0, -0.8, 11.2, 5.6], [S.neck - 0.5, 0, -1.1, 5.3, 4.3]];
  const OUTFITS = {
    mom: {
      // a cosy berry cardigan open over a cream top, light-wash high-waisted jeans, white trainers
      day: {
        torso: momTorso, torsoColor: S => (x, y) => C('#e9dcc2'),
        pelvis: S => [[S.hip - 4.5, 0, 0.0, 4.6, 5.6], [S.hip - 1.5, 0, -0.2, 13.0, 8.0], [S.hip + 3, 0, -0.1, 14.6, 8.8], [S.hip + 8, 0, 0.2, 13.9, 9.0]],
        pelvisColor: S => (x, y) => y > S.hip + 6.8 ? C('#6680a8') : C('#7896bd'),
        arm: (S, a, el, wr, kk) => armRings(S, a, el, wr, kk, 1.0), armBands: S => [S.wrist[1] + 3.2],
        armColor: S => (x, y) => y < S.wrist[1] + 3.2 ? C('#68283f') : C('#7d3250'),
        leg: (S, t, kn, an, kk) => legRings(S, t, kn, an, kk, 1.3, true), legBands: S => [S.ankle + 2.4],
        legColor: S => (x, y) => y < S.ankle + 2.4 ? C('#6b88b0') : C('#7896bd'),
        shoe: (G, S, an, kk, bone) => trainer(G, S, an, kk, bone, C('#f2efe8'), C('#c8c2b4'), C('#c25a74')),
        extra: (G, S, J, sg, torso) => {
          const cardi = C('#7d3250'), rib = C('#68283f');
          // the cardigan: a knitted shell open down the front in a V, with a ribbed hem and button band
          const rings = banded(torso.filter(r => r[0] <= S.neck), [S.hip + 6]).filter(r => r[0] >= S.hip + 1);
          const n = rings.length - 1, gap = i => { const y = rings[i][0]; return y > S.chest + 3 ? lerp(13, 34, (y - (S.chest + 3)) / (S.neck - S.chest - 3)) : lerp(9, 13, (y - S.hip) / (S.chest + 3 - S.hip)); };
          G.add(shell(rings, i => gap(i), i => 360 - gap(i), sg(32), 1.0, 0.25), (x, y) => y < S.hip + 6 ? rib : cardi, onTorso(S));
          // buttons on the band, two patch pockets
          for (let i = 0; i < 4; i++) { const y = S.hip + 10 + i * 6.4, a = lerp(9, 13, (y - S.hip) / (S.chest + 3 - S.hip)) + 2.5, p = surf(torso, y, a, 1.4); G.add(ell(p, [0.55, 0.55, 0.32], [8, 6], [0, a, 0]), C('#e6d4a8'), S.torsoW(p[0], y)[0][0]); }
          for (const s of [1, -1]) { const y0 = S.hip + 6.5, pr = [surf(torso, y0, s * 32, 0), surf(torso, y0 + 7, s * 32, 0)].map(p => [p[1], 0, 0, 0, 0]); void pr;
            const pk = banded(torso, []).filter(r => r[0] >= y0 - 0.1 && r[0] <= y0 + 7.1); if (pk.length >= 2) G.add(shell(pk, s > 0 ? 22 : -46, s > 0 ? 46 : -22, 6, 0.5, 1.3), rib, onTorso(S)); }
          // a thin gold chain at the neckline
          G.add(torusArc([0, S.neck - 3.3, 2.0], 4.2, 0.15, Math.PI, [-72, 0, 180]), C('#d8b860'), 'chest', { noAO: true });
        },
      },
    },
    dad: {
      work: dadShirt(false),
      home: dadShirt(true),
      // weekends: a bottle-green V-neck jumper over the shirt, dark jeans, brown shoes
      weekend: {
        torso: dadTorso, torsoColor: S => () => C('#c3d3e6'),
        pelvis: S => [[S.hip - 4.5, 0, 0.2, 5.4, 7.0], [S.hip - 1.5, 0, 0.2, 15.0, 9.4], [S.hip + 4, 0, 0.8, 16.6, 10.8], [S.hip + 8, 0, 1.2, 16.6, 11.6]],
        pelvisColor: S => () => C('#3e5679'),
        arm: (S, a, el, wr, kk) => armRings(S, a, el, wr, kk, 1.3), armBands: S => [S.wrist[1] + 3.4],
        armColor: S => (x, y) => y < S.wrist[1] + 3.4 ? C('#264a36') : C('#2f5a42'),
        leg: (S, t, kn, an, kk) => legRings(S, t, kn, an, kk, 1.7, true), legColor: S => () => C('#3e5679'),
        shoe: (G, S, an, kk, bone) => shoe(G, S, an, kk, bone, C('#4a3020')),
        extra: (G, S, J, sg, torso) => {
          const rings = banded(torso.filter(r => r[0] <= S.neck), [S.hip + 6]).filter(r => r[0] >= S.hip + 1);
          const gap = i => { const y = rings[i][0]; return y > S.chest + 1 ? lerp(0.05, 30, smooth((y - (S.chest + 1)) / (S.neck - S.chest - 1))) : 0.05; };
          G.add(shell(rings, i => gap(i), i => 360 - gap(i), sg(34), 1.1, 0.3), (x, y) => y < S.hip + 6 ? C('#264a36') : C('#2f5a42'), onTorso(S));
          dadCollar(G, S, torso, false, C('#c3d3e6'));
        },
      },
    },
    sister: {
      // denim dungarees over a lilac-and-cream striped top, pink trainers
      play: {
        torso: sisTorso,
        torsoBands: S => { const b = []; for (let y = S.hip + 4; y < S.neck; y += 2.7) b.push(y); return b; },
        torsoColor: S => (x, y) => (Math.floor((y - (S.hip + 4)) / 2.7) % 2 ? C('#b398d6') : C('#fbf5eb')),
        pelvis: S => [[S.hip - 4, 0, 0.2, 4.0, 5.0], [S.hip - 1.5, 0, 0.2, 10.8, 7.2], [S.hip + 4, 0, 0.4, 11.9, 8.0], [S.hip + 9, 0, 0.8, 11.8, 8.4]],
        pelvisColor: S => () => C('#5f86c2'),
        arm: (S, a, el, wr, kk) => armRings(S, a, el, wr, kk, 0.7),
        armBands: S => { const b = []; for (let y = S.wrist[1] + 2.2; y < S.sh[1] + 2; y += 2.7) b.push(y); return b; },
        armColor: S => (x, y) => y < S.wrist[1] + 2.2 ? C('#b398d6') : (Math.floor((y - (S.wrist[1] + 2.2)) / 2.7) % 2 ? C('#b398d6') : C('#fbf5eb')),
        leg: (S, t, kn, an, kk) => legRings(S, t, kn, an, kk, 1.3, true), legBands: S => [S.ankle + 0.6, S.ankle + 4.2],
        legColor: S => (x, y) => y < S.ankle + 4.2 && y > S.ankle + 0.6 ? C('#88a8d8') : C('#5f86c2'),
        shoe: (G, S, an, kk, bone) => trainer(G, S, an, kk, bone, C('#ff86b0'), C('#f6f2ea'), C('#ffffff')),
        extra: (G, S, J, sg, torso) => {
          const den = C('#5f86c2'), stitch = C('#e3b54c');
          // the bib follows the chest; straps go over the shoulders and down the back; brass buttons; a pocket
          const bibTop = S.chest + 4, rings = torso.filter(r => r[0] <= bibTop + 0.01);
          const R = rings.concat([surfRing(torso, bibTop)]).filter(r => r[0] >= S.hip + 1).sort((a, b) => a[0] - b[0]);
          G.add(shell(R, i => (R[i][0] < S.hip + 7 ? -179.9 : -38), i => (R[i][0] < S.hip + 7 ? 179.9 : 38), sg(26), 0.6, 0.2), (x, y) => Math.abs(y - (bibTop - 0.8)) < 0.35 ? stitch : den, onTorso(S));
          const pk = R.filter(r => r[0] >= S.chest - 6 && r[0] <= S.chest + 0.5);
          if (pk.length >= 2) G.add(shell(pk, -16, 16, 8, 0.45, 1.2), (x, y) => y > S.chest - 0.6 ? stitch : C('#5579b4'), onTorso(S));
          for (const s of [1, -1]) {
            const up = torso.filter(r => r[0] >= bibTop - 1);
            G.add(shell(up, s * 22, s * 34, 4, 0.7, 0.25), den, onTorso(S));
            const back = torso.filter(r => r[0] >= S.hip + 6);
            G.add(shell(back, 180 - s * 34, 180 - s * 22, 4, 0.7, 0.25), den, onTorso(S));
            const p = surf(torso, bibTop - 1.5, s * 28, 1.4); G.add(ell(p, [0.95, 0.95, 0.45], [10, 6], [0, s * 28, 0]), C('#d9b45a'), 'chest');
          }
        },
      },
    },
  };
  function surfRing(rings, y) { for (let i = 0; i < rings.length - 1; i++) { const a = rings[i], b = rings[i + 1]; if (y >= a[0] && y <= b[0]) { const t = (y - a[0]) / (b[0] - a[0]); return a.map((v, k) => lerp(v, b[k], t)); } } return rings[rings.length - 1].slice(); }
  // the shirt collar: a band round the neck base, open at the front, with two points
  function dadCollar(G, S, torso, open, shirt) {
    const y0 = S.neck - 2.2, nr = S.H > 150 ? 4.5 : 4.0;
    const band = [[y0, 0, -1.4, nr + 1.5, nr + 1.1], [y0 + 2.2, 0, -1.3, nr + 1.0, nr + 0.7], [y0 + 4.0, 0, -1.2, nr + 0.8, nr + 0.5]];
    G.add(shell(band, open ? 46 : 22, open ? 314 : 338, 20, 0.45, 0), shirt, (x, y) => [['chest', 0.6], ['neck', 0.4]]);
    for (const s of [1, -1]) {
      const p = surf(torso, S.neck - 2.6, s * (open ? 30 : 22), 0.45);
      G.add(rbox(p, [2.8, 2.6, 0.45], 0.2, [-30, s * (open ? 34 : 24), s * (open ? 52 : 40)], 2), shirt, 'chest');
    }
  }
  function dadShirt(home) {
    const shirt = C('#b9cde5'), cuff = C('#a7bdd8'), tieC = C('#7a1f2b'), stripe = C('#c8a24a'), skinC = C(PEOPLE.dad.skin);
    return {
      torso: dadTorso,
      torsoColor: S => (x, y, z) => {
        if (home && z > 3 && y > S.neck - 9 && Math.abs(x) < lerp(0.4, 3.4, clamp((y - (S.neck - 9)) / 7, 0, 1))) return skinC;
        return shirt;
      },
      pelvis: S => [[S.hip - 4.5, 0, 0.2, 5.4, 7.0], [S.hip - 1.5, 0, 0.2, 15.0, 9.4], [S.hip + 4, 0, 0.8, 16.6, 10.8], [S.hip + 8, 0, 1.2, 16.6, 11.6]],
      pelvisColor: S => () => C('#3b3f47'),
      arm: (S, a, el, wr, kk) => armRings(S, a, el, wr, kk, home ? 0.9 : 1.1),
      armBands: S => home ? [S.elbow[1] - 2.2, S.elbow[1] + 1.8] : [S.wrist[1] + 3],
      armColor: S => (x, y) => {
        if (home) { if (y < S.elbow[1] - 2.2) return skinC; if (y < S.elbow[1] + 1.8) return cuff; return shirt; }
        return y < S.wrist[1] + 3 ? cuff : shirt;
      },
      leg: (S, t, kn, an, kk) => legRings(S, t, kn, an, kk, 1.8, true), legColor: S => () => C('#3b3f47'),
      shoe: (G, S, an, kk, bone) => shoe(G, S, an, kk, bone, C('#1e1a18')),
      extra: (G, S, J, sg, torso, pelvis) => {
        dadCollar(G, S, torso, home, shirt);
        // the button placket down the front, a breast pocket
        const front = torso.filter(r => r[0] >= S.hip + 2 && r[0] <= S.neck - (home ? 6 : 2));
        G.add(shell(front, -4, 4, 2, 0.25, 0.05), C('#a9bed8'), onTorso(S));
        const pk = surfRing(torso, S.chest + 1), pk2 = surfRing(torso, S.chest + 7.5);
        G.add(shell([pk, pk2], 24, 40, 5, 0.3, 0.05), C('#adc2dc'), onTorso(S));
        // belt and buckle (on the trousers' waistband)
        const belt = pelvis.filter(r => r[0] >= S.hip + 4).concat([surfRing(pelvis, S.hip + 6.6)]).sort((a, b) => a[0] - b[0]).filter(r => r[0] >= S.hip + 4 && r[0] <= S.hip + 7);
        if (belt.length >= 2) G.add(shell(belt, -179.9, 179.9, sg(30), 0.5, 0.2), C('#2a1c13'), (x, y) => [['hips', 0.7], ['spine', 0.3]]);
        G.add(rbox(surf(pelvis, S.hip + 5.5, 0, 0.9), [3.8, 2.8, 0.7], 0.3), C('#c9b27a'), 'hips');
        // a wristwatch (left wrist)
        const w = J.handL;
        G.add(torusArc([w[0], w[1] + 2.8, w[2]], 2.5, 0.42, TAU, [90, 0, 0], [1, 1.12, 1]), C('#2b2620'), 'foreL');
        G.add(rbox([w[0] + 2.4, w[1] + 2.8, w[2]], [0.7, 2.0, 1.9], 0.3), C('#d9d2bc'), 'foreL');
        // the tie: knot at the collar, blade lying on the shirt (tight in the morning; loosened and lower after work)
        const ky = S.neck - (home ? 7.5 : 3.0), kz = surf(torso, ky, 0, 0.5)[2];
        G.add(rbox([0, ky, kz + 0.6], [2.9, 2.7, 1.6], 0.7, [-10, 0, 0]), tieC, 'chest');
        const blade = torso.filter(r => r[0] > S.hip + 4 && r[0] < ky - 1).concat([surfRing(torso, ky - 1), surfRing(torso, S.hip + 4)]).sort((a, b) => a[0] - b[0]);
        const wAt = i => { const y = blade[i][0], t = clamp((ky - 1 - y) / (ky - 1 - (S.hip + 4)), 0, 1); return lerp(5.5, 13.5, smooth(t * 1.15)) * (t > 0.96 ? lerp(1, 0.25, (t - 0.96) / 0.04) : 1); };
        G.add(shell(blade, i => -wAt(i) / 2, i => wAt(i) / 2, 4, 0.45, 0.35), (x, y) => (Math.floor((y * 0.8 + x * 0.8) / 1.6) % 3 === 0 ? stripe : tieC), onTorso(S));
      },
    };
  }

  // ---------------------------------------------------------------- hair: sculpted helmets with a real hairline
  // fn(a, e) on the head's directions; where the hair stops (`line`) the surface dips under the scalp.
  function helmet(S, sg, o) {
    const P = S.head, [cx, cy, cz] = P.c, raw = S.shape.raw;
    return grid(sg(o.rows || 40), sg(o.cols || 60), (a, el) => {
      const A = angd(0, a), ab = Math.abs(A) / D2R; // azimuth in degrees, 0 front, 180 back
      const p = raw(a, el), dx = p[0] - cx, dy = p[1] - cy, dz = p[2] - cz;
      const ed = el / D2R, end = o.end(ab), fk = smooth((o.face - ab) / 7);
      const cut = Math.max(end, lerp(end, o.line(A / D2R, ab), fk)), soft = o.soft || 6; // below `cut` the hair tucks under the scalp
      const tx = cx + dx * 0.86, ty = cy + dy * 0.86, tz = cz + dz * 0.86;
      if (ed < cut - soft) return [tx, ty, tz];
      const t = o.thick(ab, ed);
      let x = cx + dx * (1 + t / P.r[0]), y = cy + dy * (1 + t / P.r[1]), z = cz + dz * (1 + t / P.r[2]);
      if (o.shape) [x, y, z] = o.shape(x, y, z, ab, ed, A / D2R);
      if (ed < cut) { const k = smooth((ed - (cut - soft)) / soft); x = lerp(tx, x, k); y = lerp(ty, y, k); z = lerp(tz, z, k); }
      return [x, y, z];
    });
  }
  const HAIR = {
    mom: (G, S, J, sg, h, h2) => {
      const P = S.head, [cx, cy, cz] = P.c;
      const strand = (x, y, z) => (Math.sin(Math.atan2(x - cx, z - cz) * 14 + y * 0.15) > 0.5 ? h2 : h);
      // a soft chin-length bob with a side parting and a swept fringe
      G.add(helmet(S, sg, {
        face: 86,
        line: (A, ab) => 17 + 15 * smooth(ab / 84) - (A > 0 ? 6 * (1 - smooth(ab / 55)) : 0), // the fringe sweeps down on her left
        soft: 8,
        end: ab => -90,
        thick: (ab, ed) => 1.1 + (ed < 10 ? 0.9 : 0) + (ab > 70 ? 0.6 : 0),
        shape: (x, y, z, ab, ed) => {
          if (ed < 18 && ab > 64) { // the bob falls straight to the jaw, then flicks under
            const t = smooth((18 - ed) / 70), len = 12.5 * t;
            const rr = Math.hypot(x - cx, z - cz), k = (rr + 1.3 * t) / Math.max(rr, 0.1);
            x = cx + (x - cx) * k; z = cz + (z - cz) * k; y = Math.max(y, cy - len - 0.5) - (ed < -40 ? 0 : 0);
            if (y < cy - 6) y = cy - 6 - (cy - 6 - y) * 0.85;
          }
          return [x, y, z];
        },
      }), strand, (x, y) => y < cy - 6 ? [['head', 0.8], ['neck', 0.2]] : [['head', 1]]);
    },
    dad: (G, S, J, sg, h, h2) => {
      const P = S.head, [cx, cy, cz] = P.c, grey = C('#867a70');
      const col = (x, y, z) => (Math.abs(x - cx) > P.r[0] * 0.82 && y < cy + 2.5) ? grey.clone().lerp(h, 0.35) : (Math.sin(Math.atan2(x - cx, z - cz) * 16 + y * 0.2) > 0.6 ? h2 : h);
      // short back-and-sides, parted on his left, a little thin at the temples
      G.add(helmet(S, sg, {
        face: 84,
        line: (A, ab) => 27 + 6 * Math.exp(-(((ab - 38) / 13) ** 2)) - 22 * smooth((ab - 55) / 28),
        end: ab => ab < 108 ? 7 - 3 * smooth((ab - 84) / 20) : 4 - 40 * smooth((ab - 108) / 50),
        thick: (ab, ed, A) => 0.75 + 0.55 * smooth((ed - 30) / 40),
        soft: 9,
        shape: (x, y, z, ab, ed, A) => { if (ed > 40 && Math.abs(A - 32) < 4) { const k = 1 - Math.abs(A - 32) / 4; x -= (x - cx) * 0.035 * k; y -= (y - cy) * 0.035 * k; z -= (z - cz) * 0.035 * k; } return [x, y, z]; },
      }), col, 'head');
      // glasses: two rims, a bridge, arms back to the ears
      const e = S.eye, fz = S.eyeZ + e.r * 1.65 + 0.4, frame = C('#2c2622');
      for (const s of [1, -1]) {
        G.add(torusArc([s * e.x * 1.05, e.y - 0.2, fz], 2.3, 0.21, TAU, [0, 0, 0], [1.14, 0.84, 1], 24), frame, 'head', { noAO: true });
        const side = P.r[0] * 0.98 + 0.5;
        G.add(rbox([s * (e.x * 1.05 + 2.55), e.y + 0.1, fz - 0.4], [0.5, 0.55, 1.2], 0.2), frame, 'head', { noAO: true });
        G.add(tube([s * (e.x * 1.05 + 2.75), e.y + 0.1, fz - 0.9], [s * side, e.y + 0.2, cz - 1.5], 0.2, 0.2, 5), frame, 'head', { noAO: true });
      }
      G.add(torusArc([0, e.y + 0.1, fz + 0.15], 1.1, 0.18, Math.PI, [0, 0, 0], [1, 0.6, 1]), frame, 'head', { noAO: true });
    },
    sister: (G, S, J, sg, h, h2) => {
      const P = S.head, [cx, cy, cz] = P.c;
      const strand = (x, y, z) => (Math.sin(Math.atan2(x - cx, z - cz) * 14 + y * 0.2) > 0.55 ? h2 : h);
      // a straight fringe, the rest pulled back into two bunches
      G.add(helmet(S, sg, {
        face: 82,
        line: (A, ab) => 14 + 20 * smooth((ab - 48) / 30),
        end: ab => ab < 95 ? -6 : -28 - 6 * smooth((ab - 95) / 85),
        thick: (ab, ed) => 0.85 + 0.15 * smooth((55 - ab) / 15),
        soft: 4,
      }), strand, 'head');
      for (const s of [1, -1]) {
        const sd = s > 0 ? 'L' : 'R', b = J['hair' + sd];
        G.add(ell([b[0] + s * 3.0, b[1] - 3.2, b[2] - 0.4], [2.9, 6.4, 3.1], [14, 12], [10, 0, s * 20]), strand, 'hair' + sd);
        G.add(ell([b[0] + s * 4.3, b[1] - 8.6, b[2] - 0.6], [1.9, 2.6, 2.1], [12, 10], [0, 0, s * 24]), strand, 'hair' + sd);
        G.add(ell([b[0] + s * 0.6, b[1] + 0.2, b[2] - 0.2], [1.55, 1.55, 1.65], [12, 10]), C('#ffcf3a'), 'head', { noAO: true });
        // a butterfly clip above the fringe
        const ca = s * 34, ce = 34, rx = P.r[0] + 1.6, ry = P.r[1] + 1.4, rz = P.r[2] + 1.6;
        const px = cx + rx * Math.cos(ce * D2R) * Math.sin(ca * D2R), py = cy + ry * Math.sin(ce * D2R), pz = cz + rz * Math.cos(ce * D2R) * Math.cos(ca * D2R), wing = s > 0 ? C('#ff4f9c') : C('#36c0ee');
        for (const w of [1, -1]) G.add(ell([px + w * 0.9 * Math.cos(ca * D2R), py, pz - w * 0.9 * Math.sin(ca * D2R)], [1.2, 0.85, 0.35], [10, 6], [-ce, ca, w * 22]), wing, 'head', { noAO: true });
        G.add(ell([px, py, pz], [0.35, 0.85, 0.4], [6, 6], [-ce, ca, 0]), C('#ffffff'), 'head', { noAO: true });
      }
    },
  };

  // ---------------------------------------------------------------- props (hidden by scaling their bone to zero)
  function buildProps(G, S, J, kind) {
    const at = b => J['p_' + b];
    const paper = C('#ece8dc'), ink = C('#5a564c');
    // the newspaper, open, held at the sides: a folded broadsheet with columns of print
    const P = at('paper');
    for (const sx of [-1, 1]) G.add(rbox([P[0] + sx * 13, P[1], P[2] - Math.abs(sx) * 1.6], [26, 36, 0.45], 0.15, [0, sx * 9, 0], 1), (x, y) => { const lx = x - P[0], ly = y - P[1], col = Math.floor((lx + 40) / 3.3) % 2, row = Math.floor((ly + 40) / 1.15) % 2; return (ly > 12 && ly < 14.5) ? ink : (col && row && ly < 10 && Math.abs(lx) > 2 ? ink.clone().lerp(paper, 0.45) : paper); }, 'p_paper', { noAO: true });
    // a mug of tea
    const M = at('mug');
    G.add(tube([M[0] + 3.2, M[1] - 4.5, M[2]], [M[0] + 3.2, M[1] + 4.5, M[2]], 3.5, 3.6, 16), (x, y) => y > M[1] + 4.2 ? C('#7a4a2a') : C('#d8493b'), 'p_mug');
    G.add(torusArc([M[0] - 0.2, M[1], M[2]], 2.0, 0.55, Math.PI, [0, 0, 90]), C('#d8493b'), 'p_mug');
    // sponge and plate (washing up)
    const Sp = at('sponge'); G.add(rbox([Sp[0], Sp[1] - 1, Sp[2] + 1.5], [4.6, 3.2, 8], 1.0), (x, y) => y > Sp[1] - 0.3 ? C('#3c8a3e') : C('#f2d24a'), 'p_sponge');
    const Pl = at('plate'); G.add(xf(new T.CylinderGeometry(11, 7.5, 1.3, 24), [Pl[0] - 2, Pl[1] - 1, Pl[2] + 9], [0, 0, 90]), (x, y, z) => Math.abs(Math.hypot(y - (Pl[1] - 1), z - (Pl[2] + 9)) - 9.4) < 0.7 ? C('#3a6aa8') : C('#f6f4ee'), 'p_plate');
    // wooden spoon
    const Sw = at('spoon'); G.add(tube([Sw[0], Sw[1] + 3, Sw[2]], [Sw[0], Sw[1] - 22, Sw[2] + 3], 0.6, 0.55, 6), C('#c79a5c'), 'p_spoon'); G.add(ell([Sw[0], Sw[1] - 24, Sw[2] + 3.2], [1.9, 3.0, 0.8], [8, 6]), C('#c79a5c'), 'p_spoon');
    // watering can (green plastic)
    const Cn = at('can'), green = C('#3f8f4c');
    G.add(rbox([Cn[0], Cn[1] - 13, Cn[2] + 3], [11, 15, 20], 3.2), green, 'p_can'); G.add(tube([Cn[0], Cn[1] - 14, Cn[2] + 12], [Cn[0], Cn[1] - 6, Cn[2] + 30], 1.3, 0.9, 8), green, 'p_can');
    G.add(ell([Cn[0], Cn[1] - 6, Cn[2] + 30.5], [2.2, 2.2, 1.0], [10, 6], [-60, 0, 0]), C('#2f6f3a'), 'p_can'); G.add(torusArc([Cn[0], Cn[1] - 3, Cn[2] + 2], 6.4, 0.9, Math.PI, [0, 90, 0]), green, 'p_can');
    // a magazine (the TV listings)
    const Mg = at('mag'); G.add(rbox([Mg[0], Mg[1], Mg[2]], [21, 28, 0.8], 0.25, [0, 0, 0], 1), (x, y) => y > Mg[1] + 10 ? C('#e64040') : (Math.floor(y) % 3 ? C('#f2efe4') : C('#7a7a70')), 'p_mag', { noAO: true });
    // the cordless phone handset (cream)
    const Ph = at('phone'); G.add(rbox([Ph[0], Ph[1] + 1, Ph[2] + 1], [2.4, 17, 4.6], 1.0, [6, 0, 0]), C('#e8e0c8'), 'p_phone');
    // the telly remote
    const Rm = at('remote'); G.add(rbox([Rm[0], Rm[1] - 1.5, Rm[2] + 4], [4.2, 2, 15], 0.8), (x, y, z) => y > Rm[1] - 0.6 && Math.floor(z) % 2 ? C('#9a9a9a') : C('#262626'), 'p_remote');
    // a crayon, and the drawing pad (it lies on the table: it lives on the base bone)
    const Cr = at('crayon'); G.add(tube([Cr[0], Cr[1] + 2, Cr[2]], [Cr[0], Cr[1] - 6, Cr[2] + 1.5], 0.45, 0.45, 6), C('#e2463c'), 'p_crayon');
    G.add(rbox([0, 0.4, 0], [30, 0.8, 21], 0.25, [0, 0, 0], 1), (x, y, z) => (Math.hypot(x - 4, z - 2) < 4.5 && Math.hypot(x - 4, z - 2) > 3.6) || (Math.abs(x + 6) < 0.6 && Math.abs(z) < 6) ? C('#2a8a4a') : y > 0.7 && Math.abs(x - 6) < 5 && Math.abs(z + 5) < 0.5 ? C('#e2463c') : C('#fbfaf4'), 'p_pad', { noAO: true });
    // school bag (a small backpack) and Dad's briefcase
    const Bg = at('bag'); G.add(rbox([Bg[0], Bg[1] - 6, Bg[2] + 2], [kind === 'sister' ? 20 : 24, 24, 9], 3), (x, y) => y < Bg[1] - 13 ? C('#2a4a8a') : C('#d64262'), 'p_bag');
    const Bc = at('case'); G.add(rbox([Bc[0], Bc[1] - 16, Bc[2]], [9, 30, 42], 1.2), (x, y) => y > Bc[1] - 2.5 ? C('#c9b27a') : C('#3a2618'), 'p_case');
    G.add(torusArc([Bc[0], Bc[1] - 0.8, Bc[2]], 4, 0.6, Math.PI, [0, 90, 0]), C('#2a1a10'), 'p_case');
    // the yo-yo string (from the finger) and the yo-yo itself (its own bone: it goes up and down)
    const St = at('string'); G.add(tube([St[0], St[1], St[2]], [St[0], St[1] - 30, St[2]], 0.12, 0.12, 4), C('#f4f4f4'), 'p_string', { noAO: true });
    G.add(xf(new T.CylinderGeometry(2.6, 2.6, 2.4, 16), [0, 0, 0], [0, 0, 90]), (x) => Math.abs(x) < 0.4 ? C('#f4f4f4') : C('#1fb0d8'), 'yoyo');
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
    const quad = (w, d, bone) => { const g = new T.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); g.translate(0, 0.35, 0); G.add(g, C('#000000'), bone, { noAO: true }); };
    quad(S.H * 0.34, S.H * 0.22, 'shBody'); quad(S.foot.w * 2.3, S.foot.len * 1.3, 'shL'); quad(S.foot.w * 2.3, S.foot.len * 1.3, 'shR');
    const g = G.build(), n = g.attributes.position.count, uv = new Float32Array(n * 2), pu = [0, 1, 1, 1, 0, 0, 1, 0];
    for (let i = 0; i < n; i++) { uv[i * 2] = pu[(i % 4) * 2]; uv[i * 2 + 1] = pu[(i % 4) * 2 + 1]; }
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    return g;
  }

  // ================================================================ the rig: skeleton + procedural animation
  const mats = {};
  function material(low) {
    const key = low ? 'low' : 'std';
    if (mats[key]) return mats[key];
    const P = { vertexColors: true, skinning: true };
    mats[key] = low ? new T.MeshLambertMaterial(P) : new T.MeshPhongMaterial(Object.assign(P, { shininess: 8, specular: new T.Color('#121212') }));
    return mats[key];
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
    const low = opts.tier === 'low';
    const outfits = {}; let outfit = opts.outfit && OUTFITS[kind][opts.outfit] ? opts.outfit : Object.keys(OUTFITS[kind])[0];
    const first = buildPerson(kind, outfit, low ? 0.65 : 1);
    outfits[outfit] = first.geometry;
    const S = first.S, J = first.J;
    const bones = BONES.map(n => { const b = new T.Bone(); b.name = n; return b; }), B = {};
    BONES.forEach((n, i) => { B[n] = bones[i]; });
    for (const n of BONES) { const p = PARENT[n], j = J[n]; if (p) { B[p].add(B[n]); const pj = J[p]; B[n].position.set(j[0] - pj[0], j[1] - pj[1], j[2] - pj[2]); } else B[n].position.set(j[0], j[1], j[2]); }
    const body = new T.SkinnedMesh(first.geometry, material(low));
    body.add(B.base); body.updateMatrixWorld(true);
    const skeleton = new T.Skeleton(bones);
    body.bind(skeleton);
    const shadow = new T.SkinnedMesh(shadowGeo(S), shadowMaterial());
    shadow.bind(skeleton, new T.Matrix4());
    shadow.renderOrder = 2;
    // bound in the rest pose; now open the eyes, close the mouth and put the props away
    for (const sd of ['L', 'R']) B['lid' + sd].rotation.x = -40 * D2R;
    B.mouth.scale.set(1, 0.14, 1);
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
      sm: {}, hairS: 0, hairV: 0,
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
      leave: () => ({ arms: null, props: kind === 'dad' ? { case: 1 } : kind === 'sister' ? { bag: 1 } : {} }),
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
        const ws = Math.sin(t * 0.33 + st.talkSeed) * 0.8 + Math.sin(t * 0.13) * 0.4;
        hx = ws * 1.8; roll = ws * 2.6; hy -= Math.abs(ws) * 0.5;
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
        if (!a) { const sw = Math.sin(g + (sd === 'L' ? Math.PI : 0)) * 19 * swing; a = [3 + sw + wob(t * 0.4, s) * 1.5, 6 + wob(t * 0.3, s + 3) * 1.2, 0, 13 + Math.max(0, sw) * 0.8 + 5 * swing, 0]; }
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
      let yawH = 0, pitchH = 0;
      if (look) {
        tmp.copy(look).sub(W.neck.p); tmp.applyQuaternion(_q2.copy(W.chest.q).invert());
        yawH = Math.atan2(tmp.x, tmp.z); pitchH = Math.atan2(tmp.y - 6, Math.hypot(tmp.x, tmp.z));
        if (Math.abs(yawH) > 1.7) { yawH = 0; pitchH = 0; }
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
      if (!near) return; // far away: no face detail
      if (t > st.saccadeAt) { st.saccadeAt = t + 0.4 + Math.random() * 2.2; st.gaze.x = (Math.random() - 0.5) * 0.16; st.gaze.y = (Math.random() - 0.5) * 0.08; }
      const ey = clamp(yawH * 0.35 + st.gaze.x, -0.4, 0.4), ep = clamp(pitchH * 0.3 + st.gaze.y, -0.25, 0.25);
      for (const sd of ['L', 'R']) B['eye' + sd].rotation.set(-ep, ey, 0);
      // blink (lids rotate down over the eyes; reading looks down: heavier lids)
      if (t > st.blinkAt) { st.blinkT = 0.17; st.blinkAt = t + 2 + Math.random() * 4.5; if (Math.random() < 0.15) st.blinkAt = t + 0.35; }
      let lid = -40 - ep * 30; if (st.action === 'paper' || st.action === 'draw' || st.action === 'magazine' || st.action === 'washup') lid = -14; if (act?.doze) lid = 36;
      if (st.blinkT > 0) { st.blinkT -= dt; lid = lerp(lid, 38, Math.sin(clamp(1 - st.blinkT / 0.17, 0, 1) * Math.PI)); }
      for (const sd of ['L', 'R']) B['lid' + sd].rotation.set(lid * D2R, 0, 0);
      // talking: lip flap from the text's rhythm (syllable-ish beats, pauses at punctuation)
      let open = 0;
      if (talking) {
        const el = (performance.now() - st.talkStart) / 1000, text = st.talkText;
        const ci = Math.floor(el * 13.5), ch = text[ci] || ' ';
        const pause = /[.,!?;:]/.test(text[ci - 1] || '') || /[.,!?;:]/.test(ch);
        const beat = Math.abs(Math.sin(el * 11.5 + Math.sin(el * 3.1) * 1.4));
        open = pause ? 0.05 : clamp(beat * (/[aeiouAEIOU]/.test(ch) ? 1 : 0.6), 0, 1);
      }
      st.mouth += (open - st.mouth) * (1 - Math.exp(-dt * 22));
      B.mouth.scale.set(1 - st.mouth * 0.15, 0.14 + st.mouth * 1.0, 1);
      B.jaw.position.set(0, J.jaw[1] - J.head[1] - st.mouth * 1.3, J.jaw[2] - J.head[2]);
      B.brow.position.set(0, J.brow[1] - J.head[1] + (talking ? Math.max(0, Math.sin(t * 2.7)) * 0.4 : 0), J.brow[2] - J.head[2]);
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
      kind, S, J, group, mesh: body, shadow, proxy, bones: B, st, tris: first.tris,
      get outfit() { return outfit; },
      setOutfit(name) {
        if (name === outfit || !OUTFITS[kind][name]) return;
        if (!outfits[name]) outfits[name] = buildPerson(kind, name, low ? 0.65 : 1).geometry;
        outfit = name; body.geometry = outfits[name];
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
      dispose() { group.parent && group.parent.remove(group); for (const g of Object.values(outfits)) g.dispose(); shadow.geometry.dispose(); proxy.geometry.dispose(); },
    };
    placeFeet();
    return rig;
  }

  window.NPCRig = { create, PEOPLE, OUTFITS: Object.fromEntries(Object.entries(OUTFITS).map(([k, v]) => [k, Object.keys(v)])), PROPS, BONES };
})();

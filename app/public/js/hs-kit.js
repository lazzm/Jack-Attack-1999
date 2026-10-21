/* hs-kit: the 3D building kit for Jack's house (js/hs-world.js draws it, js/rm-room.js and js/hs-house.js build the rooms).
 * WebGL through three.js r128 (vendor/three.min.js). Everything is drawn from scratch: canvas textures, no models.
 *
 * COORDINATES (the same as the old CSS room and boot.js's PC, so the PC on the desk lines up): centimetres, x to the right,
 * y DOWN (the bedroom desk top is y = 0, the bedroom floor y = 73), z towards the front of the house. The world root is
 * flipped (scale.y = -1) so you build in these coordinates directly.
 *
 *   K.tex(key, w, h, paint(g, w, h), { rep:[x, y], near, clamp }) -> a cached CanvasTexture
 *   K.mat(spec) -> a cached material. spec: '#hex' | { c, map, e (emissive), em (emissive map), o (opacity), side: 2 (double),
 *        sh (shininess), sp (specular), basic: true (unlit), at (alphaTest), dw: false (no depth write), po (polygon offset) }
 *   K.batch() -> a Batch: static geometry merged per material (one draw call per material). batch.build(group)
 *   K.into(target, base?) -> a builder that adds to a Batch or straight into a Group (as meshes). Every call takes the
 *        position first and an options object last: { rx, ry, rz (degrees), sx, sy, sz, uv (world UV scale, cm per tile), sides }
 *     .box(x, y, z, w, h, d, m, o)   m: a material, or { f, b, l, r, t, u, all } per face (t = top, u = underneath)
 *     .rbox(x, y, z, w, h, d, r, m, o) a box with rounded (chamfered) edges, r = radius
 *     .cyl(x, y, z, rTop, rBot, h, seg, m, o)   m: material or { s (side), t, u }
 *     .ball(x, y, z, rx, ry, rz, m, seg, o)     .plane(x, y, z, w, h, m, o) (faces +z)   .disc(x, y, z, r, m, seg, o) (faces up)
 *     .lathe(x, y, z, [[r, y], ...], seg, m, o) (the profile goes from the top down)   .geo(geometry, x, y, z, m, o)
 *     .shadow(x, y, z, w, d, a, o)  a soft contact shadow lying on a surface (y = the surface)
 *     .at(x, y, z, ry) -> a builder for an object's own local space    .group -> the target group (when building into one) */
(function () {
  'use strict';
  const T = window.THREE; if (!T || window.HouseKit) return;
  const D2R = Math.PI / 180;

  // ================================================================ textures (canvas, cached by key)
  const TEX = {};
  let aniso = 4;
  function tex(key, w, h, paint, o) {
    if (TEX[key]) return TEX[key];
    o = o || {};
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    try { paint(g, w, h); } catch (e) { console.error('hs tex', key, e); }
    const t = new T.CanvasTexture(c);
    if (o.clamp) t.wrapS = t.wrapT = T.ClampToEdgeWrapping; else t.wrapS = t.wrapT = T.RepeatWrapping;
    if (o.rep) t.repeat.set(o.rep[0], o.rep[1]);
    if (o.near) { t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false; }
    else { t.anisotropy = aniso; t.minFilter = T.LinearMipmapLinearFilter; }
    if (!t.userData) t.userData = {}; t.userData.canvas = c; t.userData.g = g;
    return TEX[key] = t;
  }
  // a little value noise, for grain, fluff and dirt
  function rnd(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function speckle(g, w, h, n, cols, sz, seed) { const r = rnd(seed || 7); for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; const s = sz * (0.5 + r()); g.fillRect(r() * w, r() * h, s, s); } }
  // ready-made paints
  const PAINT = {
    wood(base, dark, lines) {
      return (g, w, h) => {
        g.fillStyle = base; g.fillRect(0, 0, w, h);
        const r = rnd(base.length * 31 + (lines || 0));
        for (let i = 0; i < (lines || 70); i++) {
          const y = r() * h, a = 0.05 + r() * 0.12; g.strokeStyle = `rgba(${dark},${a})`; g.lineWidth = 0.6 + r() * 2.2;
          g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / (30 + r() * 40) + i) * (2 + r() * 3)); g.stroke();
        }
        for (let i = 0; i < 4; i++) { const x = r() * w, y = r() * h; const gr = g.createRadialGradient(x, y, 1, x, y, 10 + r() * 14); gr.addColorStop(0, `rgba(${dark},.35)`); gr.addColorStop(1, `rgba(${dark},0)`); g.fillStyle = gr; g.fillRect(x - 30, y - 30, 60, 60); }
      };
    },
    noise(base, cols, n, sz) { return (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); speckle(g, w, h, n || 4000, cols, sz || 1.5); }; },
  };
  // a soft blob (contact shadows) and a fade strip (ambient occlusion where walls meet floors and ceilings)
  const blobTex = () => tex('blob', 128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 63); gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(0.45, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { clamp: true });
  const sqBlobTex = () => tex('sqblob', 128, 128, (g, w, h) => {
    const id = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = Math.max(0, Math.abs(x - 63.5) - 40) / 24, dy = Math.max(0, Math.abs(y - 63.5) - 40) / 24, d = Math.min(1, Math.hypot(dx, dy)); id.data[(y * w + x) * 4 + 3] = Math.round(200 * Math.pow(1 - d, 1.6)); }
    g.putImageData(id, 0, 0);
  }, { clamp: true });
  const fadeTex = () => tex('fade', 4, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.35, 'rgba(0,0,0,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { clamp: true });

  // ================================================================ materials (cached by their spec)
  const MATS = {};
  function mat(spec) {
    if (spec && spec.isMaterial) return spec;
    if (typeof spec === 'string' || typeof spec === 'number') spec = { c: spec };
    spec = spec || {};
    const key = JSON.stringify(spec, (k, v) => (v && v.isTexture) ? 'tex:' + v.uuid : v);
    if (MATS[key]) return MATS[key];
    const P = { color: new T.Color(spec.c != null ? spec.c : '#ffffff') };
    if (spec.map) P.map = spec.map;
    if (spec.o != null && spec.o < 1) { P.transparent = true; P.opacity = spec.o; }
    if (spec.tr) P.transparent = true;
    if (spec.side) P.side = spec.side === 2 ? T.DoubleSide : T.BackSide;
    if (spec.at) P.alphaTest = spec.at;
    if (spec.vc) P.vertexColors = true;
    let m;
    if (spec.basic) m = new T.MeshBasicMaterial(P);
    else {
      P.shininess = spec.sh != null ? spec.sh : 6; P.specular = new T.Color(spec.sp != null ? spec.sp : '#0c0c0c');
      if (spec.e) P.emissive = new T.Color(spec.e);
      if (spec.em) { P.emissiveMap = spec.em; if (!spec.e) P.emissive = new T.Color('#ffffff'); }
      if (spec.flat) P.flatShading = true;
      if (window.HouseQ === 'low' && !spec.sh) { delete P.shininess; delete P.specular; delete P.flatShading; m = new T.MeshLambertMaterial(P); } else // (Low graphics: the cheap, matte shader)
      m = new T.MeshPhongMaterial(P);
    }
    if (spec.dw === false) m.depthWrite = false;
    if (spec.po) { m.polygonOffset = true; m.polygonOffsetFactor = spec.po; m.polygonOffsetUnits = spec.po; }
    m.userData.spec = spec;
    return MATS[key] = m;
  }
  const shadowMat = a => mat({ c: '#000', map: blobTex(), basic: true, tr: true, o: a == null ? 0.999 : Math.min(0.999, a), dw: false, po: -2 });

  // ================================================================ merging static geometry: one draw call per material
  const _v = new T.Vector3(), _n = new T.Vector3(), _nm = new T.Matrix3();
  const FACE = ['r', 'l', 'u', 't', 'f', 'b']; // BoxGeometry's groups: +x -x +y(underneath: y is down) -y(top) +z -z
  function Batch() { this.parts = new Map(); }
  // m: a material, or (for grouped geometry) a function(groupIndex) -> material or null (skip)
  Batch.prototype.add = function (geo, m4, m, uvScale) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    _nm.getNormalMatrix(m4);
    const groups = g.groups && g.groups.length ? g.groups : [{ start: 0, count: P.count, materialIndex: 0 }];
    for (const gr of groups) {
      const mm = typeof m === 'function' ? m(gr.materialIndex) : m; if (!mm) continue;
      let part = this.parts.get(mm); if (!part) this.parts.set(mm, part = { pos: [], nrm: [], uv: [] });
      for (let i = gr.start; i < gr.start + gr.count; i++) {
        _v.fromBufferAttribute(P, i).applyMatrix4(m4); _n.fromBufferAttribute(N, i).applyMatrix3(_nm).normalize();
        part.pos.push(_v.x, _v.y, _v.z); part.nrm.push(_n.x, _n.y, _n.z);
        if (uvScale) { // world-space planar UVs (wood grain, wallpaper, carpet that tile at a real size)
          const ax = Math.abs(_n.x), ay = Math.abs(_n.y), az = Math.abs(_n.z);
          if (ay >= ax && ay >= az) part.uv.push(_v.x / uvScale, _v.z / uvScale);
          else if (ax >= az) part.uv.push(_v.z / uvScale, -_v.y / uvScale);
          else part.uv.push(_v.x / uvScale, -_v.y / uvScale);
        } else if (U) part.uv.push(U.getX(i), U.getY(i)); else part.uv.push(0, 0);
      }
    }
    if (g !== geo) g.dispose();
  };
  Batch.prototype.build = function (group, o) {
    o = o || {};
    const out = [];
    for (const [m, p] of this.parts) {
      if (!p.pos.length) continue;
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(p.pos, 3));
      geo.setAttribute('normal', new T.Float32BufferAttribute(p.nrm, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(p.uv, 2));
      geo.computeBoundingSphere(); geo.computeBoundingBox();
      const mesh = new T.Mesh(geo, m);
      if (m.transparent) mesh.renderOrder = 2;
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      if (o.pick) mesh.userData.pick = o.pick;
      group.add(mesh); out.push(mesh);
    }
    this.parts.clear();
    return out;
  };

  // ================================================================ the builder
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _s = new T.Vector3(), _p = new T.Vector3();
  function xform(base, x, y, z, o) {
    o = o || {};
    _e.set((o.rx || 0) * D2R, (o.ry || 0) * D2R, (o.rz || 0) * D2R, o.order || 'YXZ');
    _q.setFromEuler(_e); _p.set(x, y, z); _s.set(o.sx || 1, o.sy || 1, o.sz || 1);
    const m = new T.Matrix4().compose(_p, _q, _s);
    return base ? new T.Matrix4().multiplyMatrices(base, m) : m;
  }
  function into(target, base) {
    const isBatch = target instanceof Batch;
    const put = (geo, m4, m, o, faceSel) => {
      o = o || {};
      if (isBatch) { target.add(geo, m4, faceSel || mat(m), o.uv); geo.dispose(); return null; }
      // straight into a group: meshes (per face materials become a material array)
      let mm;
      if (faceSel) { mm = []; const n = Math.max(...geo.groups.map(gr => gr.materialIndex)) + 1; for (let i = 0; i < n; i++) mm.push(faceSel(i) || INVIS); }
      else mm = mat(m);
      if (o.uv) worldUV(geo, m4, o.uv);
      const mesh = new T.Mesh(geo, mm);
      mesh.matrixAutoUpdate = false; mesh.matrix.copy(m4); mesh.matrixWorldNeedsUpdate = true;
      if (mm.transparent) mesh.renderOrder = 2;
      target.add(mesh); return mesh;
    };
    const B = {
      group: isBatch ? null : target, batch: isBatch ? target : null, base,
      at(x, y, z, ry, o) { return into(target, xform(base, x, y, z, Object.assign({ ry }, o || {}))); },
      box(x, y, z, w, h, d, m, o) {
        o = o || {};
        const geo = new T.BoxGeometry(w, h, d); flipV(geo);
        const per = m && !m.isMaterial && typeof m === 'object' && (m.f || m.b || m.l || m.r || m.t || m.u || m.all);
        let sel = null;
        if (per || o.sides) { const sides = o.sides || 'ftrlub'; sel = i => { const k = FACE[i]; if (!sides.includes(k)) return null; return mat(per ? (m[k] || m.all) : m); }; }
        return put(geo, xform(base, x, y, z, o), m, o, sel);
      },
      rbox(x, y, z, w, h, d, r, m, o) { // a box with chamfered edges: the edges catch the light, so it reads as solid
        r = Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01);
        const geo = roundBox(w, h, d, r);
        return put(geo, xform(base, x, y, z, o), m, o);
      },
      cyl(x, y, z, rt, rb, h, seg, m, o) {
        o = o || {};
        const geo = new T.CylinderGeometry(rb, rt, h, seg || 16, 1, !!o.open); // (three's "top" is +y, which is our underneath)
        let sel = null;
        if (m && !m.isMaterial && typeof m === 'object' && (m.s || m.t || m.u)) sel = i => mat(i === 0 ? m.s : i === 1 ? (m.u || m.s) : (m.t || m.s));
        return put(geo, xform(base, x, y, z, o), m, o, sel);
      },
      ball(x, y, z, rx, ry, rz, m, seg, o) { const geo = new T.SphereGeometry(1, seg || 16, Math.max(6, ((seg || 16) * 0.66) | 0)); return put(geo, xform(base, x, y, z, Object.assign({}, o, { sx: rx, sy: ry, sz: rz })), m, o); },
      plane(x, y, z, w, h, m, o) { const geo = new T.PlaneGeometry(w, h); flipV(geo); return put(geo, xform(base, x, y, z, o), m, o); },
      disc(x, y, z, r, m, seg, o) { const geo = new T.CircleGeometry(r, seg || 24); { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setY(i, 1 - u.getY(i)); } return put(geo, xform(base, x, y, z, Object.assign({}, o || {}, { rx: (o && o.rx != null ? o.rx : 0) + 90 })), m, o); },
      lathe(x, y, z, pts, seg, m, o) {
        // pts: [[radius, y], ...] from the top down (y is down). Lathe wants them bottom-up in its own y-up space
        const v = pts.map(([r, yy]) => new T.Vector2(Math.max(0.001, r), yy));
        const geo = new T.LatheGeometry(v, seg || 16);
        return put(geo, xform(base, x, y, z, o), m, o);
      },
      geo(geo, x, y, z, m, o) { return put(geo, xform(base, x, y, z, o), m, o); },
      shadow(x, y, z, w, d, a, o) { // y is the surface it lies on; it floats a hair above
        const geo = new T.PlaneGeometry(w, d);
        const sq = o && o.sq;
        const m = sq ? mat({ c: '#000', map: sqBlobTex(), basic: true, tr: true, o: Math.min(0.999, a == null ? 0.9 : a), dw: false, po: -2 }) : shadowMat(a);
        return put(geo, xform(base, x, y - 0.12, z, Object.assign({}, o, { rx: 90 })), m, {});
      },
      wshadow(x, y, z, w, h, a, o) { // a soft shadow on a wall behind something (faces +z; turn it with ry)
        const geo = new T.PlaneGeometry(w, h);
        return put(geo, xform(base, x, y, z, o), mat({ c: '#000', map: sqBlobTex(), basic: true, tr: true, o: Math.min(0.999, a == null ? 0.6 : a), dw: false, po: -2 }), {});
      },
      ao(x, y, z, w, h, o) { // a darkening strip on a wall: from the edge at (x, y, z) fading over h; ry turns it to face along the wall
        const geo = new T.PlaneGeometry(w, h);
        return put(geo, xform(base, x, y, z, o), mat({ c: '#000', map: fadeTex(), basic: true, tr: true, o: (o && o.a) || 0.999, dw: false, po: -2 }), {});
      },
    };
    return B;
  }
  const INVIS = new T.MeshBasicMaterial({ visible: false });
  // PlaneGeometry's v runs bottom-up in y-up space: in our y-down world that would draw pictures upside down
  function flipV(geo) { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setY(i, 1 - u.getY(i)); }
  function worldUV(geo, m4, s) {
    const P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv; if (!U) return;
    _nm.getNormalMatrix(m4);
    for (let i = 0; i < P.count; i++) {
      _v.fromBufferAttribute(P, i).applyMatrix4(m4); _n.fromBufferAttribute(N, i).applyMatrix3(_nm);
      const ax = Math.abs(_n.x), ay = Math.abs(_n.y), az = Math.abs(_n.z);
      if (ay >= ax && ay >= az) U.setXY(i, _v.x / s, _v.z / s); else if (ax >= az) U.setXY(i, _v.z / s, -_v.y / s); else U.setXY(i, _v.x / s, -_v.y / s);
    }
  }
  // a rounded box: a box whose corners are pulled in (a cube sphere style mesh), so edges are soft
  function roundBox(w, h, d, r) {
    const seg = 3;
    const geo = new T.BoxGeometry(w, h, d, seg * 2 + 1, seg * 2 + 1, seg * 2 + 1);
    const P = geo.attributes.position, hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r, v = new T.Vector3(), c = new T.Vector3();
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i);
      c.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
      const N = geo.attributes.normal; v.sub(c);
      if (v.lengthSq() > 1e-9) { v.setLength(r); const n = v.clone().normalize(); N.setXYZ(i, n.x, n.y, n.z); }
      P.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z);
    }
    return geo;
  }

  // ================================================================ text and pictures onto canvases
  function wrapText(g, text, x, y, maxW, lh) {
    const words = String(text).split(/\s+/); let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; }
    if (line) g.fillText(line, x, y); return y + lh;
  }
  // an SVG string painted onto a texture once it has loaded (the texture shows `fill` until then)
  function svgTex(key, w, h, svg, fill) {
    const t = tex(key, w, h, g => { g.fillStyle = fill || '#333'; g.fillRect(0, 0, w, h); }, { clamp: true });
    if (t.userData.svgDone) return t; t.userData.svgDone = true;
    const img = new Image();
    img.onload = () => { const g = t.userData.g; g.clearRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h); t.needsUpdate = true; if (window.House && House.dirty) House.dirty(); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return t;
  }

  window.HouseKit = { T, D2R, tex, mat, shadowMat, batch: () => new Batch(), Batch, into, xform, roundBox, rnd, speckle, PAINT, wrapText, svgTex, blobTex, setAniso: a => { aniso = a; }, TEX, MATS };
})();

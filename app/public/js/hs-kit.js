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
 *     .rbox(x, y, z, w, h, d, r, m, o) a bevelled box: flat faces, a real rounded edge band of radius r (o.seg rows; per-face m as box)
 *     .cyl(x, y, z, rTop, rBot, h, seg, m, o)   m: material or { s (side), t, u }
 *     .ball(x, y, z, rx, ry, rz, m, seg, o)     .plane(x, y, z, w, h, m, o) (faces +z)   .disc(x, y, z, r, m, seg, o) (faces up)
 *     .lathe(x, y, z, [[r, y], ...], seg, m, o) (the profile goes from the top down)   .geo(geometry, x, y, z, m, o)
 *     .shadow(x, y, z, w, d, a, o)  the shared contact shadow lying on a surface (y = the surface): dark over the footprint,
 *        fading over the outer margin (o.m cm; o.sq for a rounded rectangle). Merged ones are flagged like single ones.
 *   Surface textures carry userData.worldUV (cm per tile): any material using one gets world-space UVs automatically.
 *   K.doorLeaf(pivot, o) a moulded four-panel door leaf with lever handles; K.shadowGeo / K.shadowMaterial for instancing.
 *     .at(x, y, z, ry) -> a builder for an object's own local space    .group -> the target group (when building into one) */
(function () {
  'use strict';
  const T = window.THREE; if (!T || window.HouseKit) return;
  const D2R = Math.PI / 180;
  const SURFACE_LIFT = 0.12; // cm: 1.2 mm, below a visible floating gap
  const restY = y => y - SURFACE_LIFT;
  // Opt-in diagnostics only; ordinary players pay no stack capture/storage cost.
  const auditBuild = (() => { try { return typeof localStorage !== 'undefined' && localStorage.getItem('jhp_world_audit') === '1'; } catch (e) { return false; } })();
  function auditSource() {
    if (!auditBuild) return null;
    const rows = (new Error().stack || '').split('\n');
    for (const row of rows) {
      const m = /\/([\w-]+\.js)(?:\?[^: ]*)?:(\d+):\d+/.exec(row);
      if (m && !/hs-kit|three/.test(m[1])) return m[1] + ':' + m[2];
    }
    return null;
  }

  // ================================================================ textures (canvas, cached by key)
  const TEX = {}, identityPaints = new Map();
  // Personal print can be built behind the account gate. Repaint only that ink
  // after Net has bound Cast, retaining all textures, geometry and house state.
  function repaintIdentity() {
    for (const [t, draw] of identityPaints) { draw(); t.needsUpdate = true; }
    window.House?.ui?.where(); window.House?.dirty?.();
  }
  if (window.Net) for (const event of ['welcome', 'loginOk', 'meOk']) Net.on(event, repaintIdentity);
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
    if (o.world) t.userData.worldUV = o.world; if (o.grain) t.userData.grain = true;
    if (o.identity) identityPaints.set(t, () => {
      c.width = w; c.height = h;
      try { paint(g, w, h); } catch (e) { console.error('hs identity tex', key, e); }
    });
    return TEX[key] = t;
  }
  // Anisotropic filtering for every mipmapped texture (the renderer's capability, capped per graphics tier).
  // refresh: also re-filter textures that already exist (one re-upload each, so only on a deliberate change).
  function setAniso(a, refresh) {
    aniso = Math.max(1, a | 0);
    if (!refresh) return;
    for (const k in TEX) { const t = TEX[k]; if (t.minFilter === T.NearestFilter || t.anisotropy === aniso) continue; t.anisotropy = aniso; t.needsUpdate = true; }
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
  // Contact-shadow ramps. The shadow meshes map their inner footprint to the texture's flat core (radius/edge
  // 0.25 of the texture) and only the outer margin to the fade, so the darkness reaches right up to an
  // object's edge whatever its size or aspect (the old single radial blob was nearly clear by the time it
  // got out from under the object, which is why props looked pasted on).
  const fall = t => { t = Math.min(1, Math.max(0, t)); const s = 1 - t; return s * s * (3 - 2 * s); };
  const ringTex = () => tex('shadow.ring', 128, 128, (g, w, h) => {
    const id = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - 63.5, y - 63.5) / 64; id.data[(y * w + x) * 4 + 3] = Math.round(235 * fall((d - 0.5) / 0.5)); }
    g.putImageData(id, 0, 0);
  }, { clamp: true });
  const sqBlobTex = () => tex('sqblob2', 128, 128, (g, w, h) => {
    const id = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = Math.max(0, Math.abs(x - 63.5) - 32) / 32, dy = Math.max(0, Math.abs(y - 63.5) - 32) / 32, d = Math.min(1, Math.hypot(dx, dy)); id.data[(y * w + x) * 4 + 3] = Math.round(225 * fall(d)); }
    g.putImageData(id, 0, 0);
  }, { clamp: true });
  // The fade margin (cm) for a shadow of overall size w x d: about a fifth of the smaller side, 0.6..10 cm.
  const shadowMargin = (w, d, m) => m != null ? Math.min(m, w / 2 - 0.01, d / 2 - 0.01) : Math.max(0.6, Math.min(10, Math.min(w, d) * 0.21));
  // A flat 4x4 "nine-slice" quad (facing +z like PlaneGeometry): the inner (w-2m) x (d-2m) is the flat core.
  function sliceGeo(w, d, m) {
    const xs = [-w / 2, -w / 2 + m, w / 2 - m, w / 2], ys = [d / 2, d / 2 - m, -d / 2 + m, -d / 2], st = [0, 0.25, 0.75, 1], pos = [], uv = [], idx = [];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { pos.push(xs[i], ys[j], 0); uv.push(st[i], st[j]); }
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const a = j * 4 + i; idx.push(a, a + 4, a + 1, a + 1, a + 4, a + 5); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setAttribute('normal', new T.Float32BufferAttribute(new Array(48).fill(0).map((_, k) => k % 3 === 2 ? 1 : 0), 3)); g.setIndex(idx); return g;
  }
  // An elliptical disc with a flat core out to (w/2-m, d/2-m) and a fading rim out to (w/2, d/2).
  function ringGeo(w, d, m) {
    const n = 28, pos = [0, 0, 0], uv = [0.5, 0.5], idx = [];
    for (const [rx, ry, ru] of [[w / 2 - m, d / 2 - m, 0.25], [w / 2, d / 2, 0.5]]) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(c * rx, s * ry, 0); uv.push(0.5 + c * ru, 0.5 + s * ru); }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(0, 1 + i, 1 + j, 1 + i, 1 + n + i, 1 + j, 1 + j, 1 + n + i, 1 + n + j); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setAttribute('normal', new T.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, k) => k % 3 === 2 ? 1 : 0), 3)); g.setIndex(idx); return g;
  }
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
  // Bias only deliberate surface-mounted print, never the whole scene. Keep
  // depth testing enabled: labels must not shine through walls or objects.
  const DECALS = new WeakMap();
  function decalMat(spec) {
    const base=mat(spec);if(DECALS.has(base))return DECALS.get(base);
    const m=base.clone();m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1;
    m.userData=Object.assign({},base.userData,{decal:true});DECALS.set(base,m);return m;
  }

  // ================================================================ merging static geometry: one draw call per material
  const _v = new T.Vector3(), _n = new T.Vector3(), _nm = new T.Matrix3();
  const FACE = ['r', 'l', 'u', 't', 'f', 'b']; // BoxGeometry's groups: +x -x +y(underneath: y is down) -y(top) +z -z
  function Batch() { this.parts = new Map(); }
  // m: a material, or (for grouped geometry) a function(groupIndex) -> material or null (skip)
  Batch.prototype.add = function (geo, m4, m, uvScale, source) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    _nm.getNormalMatrix(m4);
    const groups = g.groups && g.groups.length ? g.groups : [{ start: 0, count: P.count, materialIndex: 0 }];
    for (const gr of groups) {
      const mm = typeof m === 'function' ? m(gr.materialIndex) : m; if (!mm) continue;
      let part = this.parts.get(mm); if (!part) this.parts.set(mm, part = { pos: [], nrm: [], uv: [], sources: [] });
      if (source) part.sources.push({start:part.pos.length/3,count:gr.count,source});
      const scale = uvScale || worldScale(mm), p0 = part.pos.length;
      for (let i = gr.start; i < gr.start + gr.count; i++) {
        _v.fromBufferAttribute(P, i).applyMatrix4(m4); _n.fromBufferAttribute(N, i).applyMatrix3(_nm).normalize();
        part.pos.push(_v.x, _v.y, _v.z); part.nrm.push(_n.x, _n.y, _n.z);
        if (!scale) { if (U) part.uv.push(U.getX(i), U.getY(i)); else part.uv.push(0, 0); }
      }
      // world-space planar UVs (wood grain, wallpaper, carpet that tile at a real size, never stretched per face)
      if (scale) planarUV(part.pos, part.nrm, p0, part.pos.length, scale, isGrain(mm), part.uv);
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
      if (p.sources.length) mesh.userData.auditSources = p.sources;
      if (m.transparent) mesh.renderOrder = 2;
      if (m.userData.spec && m.userData.spec.cs) { mesh.userData.contactShadow = true; mesh.userData.noPick = true; } // (merged contact shadows: hidden with a carried prop, never picked)
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
      const source = auditSource();
      if (isBatch) { target.add(geo, m4, faceSel || mat(m), o.uv, source); geo.dispose(); return null; }
      // straight into a group: meshes (per face materials become a material array)
      let mm;
      if (faceSel) { mm = []; const n = Math.max(...geo.groups.map(gr => gr.materialIndex)) + 1; for (let i = 0; i < n; i++) mm.push(faceSel(i) || INVIS); }
      else mm = mat(m);
      if (o.uv || (Array.isArray(mm) ? mm.some(worldScale) : worldScale(mm))) worldUV(geo, m4, o.uv, i => Array.isArray(mm) ? mm[i] : mm);
      const mesh = new T.Mesh(geo, mm);
      if (source) mesh.userData.auditSource = source;
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
        const geo = roundBox(w, h, d, r, o && o.seg);
        // per-face materials work as for box(): { f, b, l, r, t, u, all } (each face keeps its own bevel band)
        const per = m && !m.isMaterial && typeof m === 'object' && (m.f || m.b || m.l || m.r || m.t || m.u || m.all);
        const sel = per ? (i => mat(m[FACE[i]] || m.all)) : null;
        if (per && geo.groups.length !== 6) return put(geo, xform(base, x, y, z, o), m.all || m.f, o);
        if (per) flipV(geo); // printed faces read the same way up as on box()
        return put(geo, xform(base, x, y, z, o), m, o, sel);
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
      // Closed plaster/timber panel. The decorated front stays exactly at
      // the requested plane; thickness goes behind it, away from the room.
      panel(x, y, z, w, h, depth, m, o) {
        const geo = new T.BoxGeometry(w, h, depth); geo.translate(0, 0, -depth / 2); flipV(geo);
        return put(geo, xform(base, x, y, z, o), m, o);
      },
      decal(x, y, z, w, h, m, o) { const geo=new T.PlaneGeometry(w,h);flipV(geo);return put(geo,xform(base,x,y,z,o),decalMat(m),o); },
      disc(x, y, z, r, m, seg, o) { const geo = new T.CircleGeometry(r, seg || 24); { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setY(i, 1 - u.getY(i)); } return put(geo, xform(base, x, y, z, Object.assign({}, o || {}, { rx: (o && o.rx != null ? o.rx : 0) + 90 })), m, o); },
      lathe(x, y, z, pts, seg, m, o) {
        // pts: [[radius, y], ...] from the top down (y is down). Lathe wants them bottom-up in its own y-up space
        const v = pts.map(([r, yy]) => new T.Vector2(Math.max(0.001, r), yy));
        const geo = new T.LatheGeometry(v, seg || 16);
        return put(geo, xform(base, x, y, z, o), m, o);
      },
      geo(geo, x, y, z, m, o) { return put(geo, xform(base, x, y, z, o), m, o); },
      // The shared contact shadow for anything resting on a surface. y is the surface it lies on (it floats
      // SURFACE_LIFT above it, under the lifted object, so it never z-fights). w x d is its whole extent; the
      // darkness is flat over the footprint and fades over the outer margin (o.m cm, default ~a fifth).
      // o.sq: a rounded rectangle (boxes, books, furniture) instead of an ellipse.
      shadow(x, y, z, w, d, a, o) {
        o = o || {};
        const m = shadowMargin(w, d, o.m), geo = o.sq ? sliceGeo(w, d, m) : ringGeo(w, d, m);
        const mt = mat({ c: '#000', map: o.sq ? sqBlobTex() : ringTex(), basic: true, tr: true, o: Math.min(0.999, a == null ? (o.sq ? 0.8 : 0.85) : a), dw: false, po: -2, cs: 1 });
        const mesh = put(geo, xform(base, x, y - SURFACE_LIFT, z, Object.assign({}, o, { rx: 90 })), mt, {});
        if (mesh) {mesh.userData.contactShadow = true; mesh.userData.noPick = true;}
        return mesh;
      },
      wshadow(x, y, z, w, h, a, o) { // a soft shadow on a wall behind something (faces +z; turn it with ry)
        o = o || {};
        const geo = sliceGeo(w, h, shadowMargin(w, h, o.m));
        return put(geo, xform(base, x, y, z, o), mat({ c: '#000', map: sqBlobTex(), basic: true, tr: true, o: Math.min(0.999, a == null ? 0.6 : a), dw: false, po: -2 }), {});
      },
      ao(x, y, z, w, h, o) { // a darkening strip on a wall: from the edge at (x, y, z) fading over h; ry turns it to face along the wall
        const geo = new T.PlaneGeometry(w, h);
        // rx:180 used to flip the entire wall strip out through the wall.
        // Keep its face inward: floor edges are darkest at +y; ceiling edges
        // need reversed UVs, not reversed geometry. Horizontal strips keep rx:90.
        o=Object.assign({},o||{});
        if(o.rx===180)o.rx=0;else if(!o.rx)flipV(geo);
        return put(geo, xform(base, x, y, z, o), mat({ c: '#000', map: fadeTex(), basic: true, tr: true, o: (o && o.a) || 0.999, dw: false, po: -2 }), {});
      },
    };
    return B;
  }
  const INVIS = new T.MeshBasicMaterial({ visible: false });
  // PlaneGeometry's v runs bottom-up in y-up space: in our y-down world that would draw pictures upside down
  function flipV(geo) { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setY(i, 1 - u.getY(i)); }
  // Surface textures (walls, carpet, wood) carry their real-world tile size in userData.worldUV (cm per tile):
  // any material using one gets world-space planar UVs automatically, so grain, carpet and wallpaper keep one
  // scale on every face of every model instead of being stretched across each face. userData.grain marks
  // directional textures (wood): a face's grain then runs along its longer side (legs and posts get
  // vertical grain, shelves horizontal). Callers can still pass o.uv to choose a scale themselves.
  const worldScale = m => (m && m.map && m.map.userData && m.map.userData.worldUV) || 0;
  const isGrain = m => !!(m && m.map && m.map.userData && m.map.userData.grain);
  function planarUV(pos, nrm, a, b, s, grain, out) {
    // a..b: a run of flat-array positions (x, y, z per vertex) and matching normals. A flat face (a box side,
    // including its bevel band) is projected along its own axis as a whole, so bevels never seam the grain;
    // curved runs (lathes, cylinders) fall back to choosing the axis per vertex.
    const axisOf = (x, y, z) => { const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z); return ay >= ax && ay >= az ? 1 : ax >= az ? 0 : 2; };
    let sx = 0, sy = 0, sz = 0; for (let k = a; k < b; k += 3) { sx += nrm[k]; sy += nrm[k + 1]; sz += nrm[k + 2]; }
    const n = (b - a) / 3, flat = n > 0 && Math.hypot(sx, sy, sz) / n > 0.8, fAxis = axisOf(sx, sy, sz);
    let rot = false;
    if (grain && flat) {
      let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
      for (let k = a; k < b; k += 3) {
        const u = fAxis === 0 ? pos[k + 2] : pos[k], v = fAxis === 1 ? pos[k + 2] : pos[k + 1];
        u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
      }
      rot = (v1 - v0) > (u1 - u0) * 1.15;
    }
    for (let k = a; k < b; k += 3) {
      const x = pos[k], y = pos[k + 1], z = pos[k + 2], ax = flat ? fAxis : axisOf(nrm[k], nrm[k + 1], nrm[k + 2]);
      let u, v;
      if (ax === 1) { u = x; v = z; } else if (ax === 0) { u = z; v = -y; } else { u = x; v = -y; }
      if (rot) out.push(v / s, u / s); else out.push(u / s, v / s);
    }
  }
  function worldUV(geo, m4, s, matFor) {
    const P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv; if (!U) return;
    _nm.getNormalMatrix(m4);
    const ranges = geo.index ? null : (geo.groups && geo.groups.length ? geo.groups : [{ start: 0, count: P.count, materialIndex: 0 }]);
    const vRanges = [];
    if (ranges) for (const gr of ranges) vRanges.push([gr.start, gr.start + gr.count, gr.materialIndex]);
    else if (geo.groups && geo.groups.length && geo.type === 'BoxGeometry') { // indexed boxes: each face owns a contiguous vertex block
      const per = P.count / 6; for (let f = 0; f < 6; f++) vRanges.push([f * per, (f + 1) * per, f]);
    } else vRanges.push([0, P.count, 0]);
    for (const [a, b, mi] of vRanges) {
      const mm = matFor ? matFor(mi) : null, sc = s || worldScale(mm); if (!sc) continue;
      const pos = [], nrm = [], uv = [];
      for (let i = a; i < b; i++) { _v.fromBufferAttribute(P, i).applyMatrix4(m4); _n.fromBufferAttribute(N, i).applyMatrix3(_nm).normalize(); pos.push(_v.x, _v.y, _v.z); nrm.push(_n.x, _n.y, _n.z); }
      planarUV(pos, nrm, 0, pos.length, sc, isGrain(mm), uv);
      for (let i = a; i < b; i++) U.setXY(i, uv[(i - a) * 2], uv[(i - a) * 2 + 1]);
    }
    U.needsUpdate = true;
  }
  // A bevelled box: flat faces with a real rounded edge band of radius r (seg rows per band; 1 = a chamfer).
  // The grid is placed exactly at the band boundaries (not spread evenly over the face), so the faces stay
  // flat and evenly lit and only the r-wide edge catches the light. UVs keep BoxGeometry's per-face layout,
  // re-spaced to the moved grid. Cheap: 108 triangles at seg 1, 300 at seg 2; merged by a Batch like any box.
  const ROUND = new Map();
  function roundBox(w, h, d, r, seg) {
    r = Math.max(0, Math.min(r, w / 2 - 0.005, h / 2 - 0.005, d / 2 - 0.005));
    if (r < 0.01) return new T.BoxGeometry(w, h, d);
    seg = seg || (r >= 1.2 ? 2 : 1);
    const S = 2 * seg + 1, per = (S + 1) * (S + 1);
    const coords = size => { const k = size.toFixed(4) + ':' + r.toFixed(4) + ':' + seg; if (ROUND.has(k)) return ROUND.get(k);
      const inner = size / 2 - r, c = [];
      for (let i = 0; i <= seg; i++) c.push(-inner - r * Math.tan((seg - i) / seg * Math.PI / 4));
      for (let i = 0; i <= seg; i++) c.push(inner + r * Math.tan(i / seg * Math.PI / 4));
      if (ROUND.size > 2000) ROUND.clear(); ROUND.set(k, c); return c; };
    const CW = coords(w), CH = coords(h), CD = coords(d);
    const geo = new T.BoxGeometry(w, h, d, S, S, S);
    const P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv;
    const at = (x, size) => Math.max(0, Math.min(S, Math.round((x / size + 0.5) * S)));
    const axes = [[CD, CH, d, h], [CD, CH, d, h], [CW, CD, w, d], [CW, CD, w, d], [CW, CH, w, h], [CW, CH, w, h]];
    const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
    for (let i = 0; i < P.count; i++) {
      const x = CW[at(P.getX(i), w)], y = CH[at(P.getY(i), h)], z = CD[at(P.getZ(i), d)];
      const [cu, cv, su, sv] = axes[Math.min(5, (i / per) | 0)];
      U.setXY(i, (cu[Math.round(U.getX(i) * S)] + su / 2) / su, 1 - (cv[Math.round((1 - U.getY(i)) * S)] + sv / 2) / sv);
      const cx = Math.max(-hx, Math.min(hx, x)), cy = Math.max(-hy, Math.min(hy, y)), cz = Math.max(-hz, Math.min(hz, z));
      let ox = x - cx, oy = y - cy, oz = z - cz; const L = Math.hypot(ox, oy, oz) || 1; ox /= L; oy /= L; oz /= L;
      N.setXYZ(i, ox, oy, oz); P.setXYZ(i, cx + ox * r, cy + oy * r, cz + oz * r);
    }
    return geo;
  }

  // Close a deformed indexed sheet with a back and perimeter, retaining UVs.
  // clothDepth lets animated quilts keep their thickness when their top moves.
  function thicken(geo,depth,normal){
    if(!geo.index||geo.attributes.clothDepth)return geo;
    const p=geo.attributes.position,u=geo.attributes.uv,n=p.count,pos=new Float32Array(n*6),uv=new Float32Array(n*4),offset=new Float32Array(n*2),idx=Array.from(geo.index.array),edges=new Map();
    for(let i=0;i<n;i++)for(let side=0;side<2;side++){const j=i+side*n;pos[j*3]=p.getX(i)-side*depth*(normal?normal[0]:0);pos[j*3+1]=p.getY(i)-side*depth*(normal?normal[1]:0);pos[j*3+2]=p.getZ(i)-side*depth*(normal?normal[2]:1);offset[j]=-side*depth;if(u){uv[j*2]=u.getX(i);uv[j*2+1]=u.getY(i)}}
    const out=idx.slice();for(let i=0;i<idx.length;i+=3){const[a,b,c]=idx.slice(i,i+3);out.push(a+n,c+n,b+n);for(const[x,y]of [[a,b],[b,c],[c,a]]){const key=Math.min(x,y)+':'+Math.max(x,y);if(edges.has(key))edges.delete(key);else edges.set(key,[x,y])}}
    for(const[a,b]of edges.values())out.push(a,a+n,b,b,a+n,b+n);
    geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setAttribute('clothDepth',new T.BufferAttribute(offset,1));geo.setIndex(out);geo.deleteAttribute('normal');geo.computeVertexNormals();geo.computeBoundingSphere();geo.computeBoundingBox();return geo;
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

  // A moulded four-panel interior door leaf (the 1990s pine-effect / painted kind) built into its hinge pivot:
  // the slab stays its own BoxGeometry mesh (door code measures its headroom); panel mouldings on both faces,
  // lever handles on roses and the hinge knuckles are merged into one draw per material.
  // o: { cx, cy, cz: leaf centre in the pivot's frame, w, h, t, along (width along x; else along z),
  //      leaf, mould, brass, hinge (materials), handleA / handleY (pivot-frame position of the handles),
  //      leverDir (+1/-1 along the width: the way the lever points), hingeA, hingeSide (+1/-1 face), glass (no top panels) }
  function doorLeaf(pv, o) {
    const along = o.along !== false, t2 = o.t / 2, w = o.w, h = o.h;
    const slab = into(pv).box(o.cx, o.cy, o.cz, along ? w : o.t, h, along ? o.t : w, o.leaf);
    const batch = new Batch(), B = into(batch).at(o.cx, o.cy, o.cz, along ? 0 : 90);
    const U = a => along ? a - o.cx : o.cz - a, dir = d => along ? d : -d;
    const panels = o.glass ? [[-0.17, 0.2], [0.17, 0.2]] : [[-0.17, -0.25], [0.17, -0.25], [-0.17, 0.2], [0.17, 0.2]];
    const ph = (h - 1) * 0.38, pw = w * 0.34, mw = 1.5, mt = 0.7;
    for (const s of [-1, 1]) {
      for (const [pu, pv2] of panels) {
        const px = pu * w * 1.5, py = (h - 1) * pv2, z = s * (t2 + mt / 2 - 0.15);
        B.rbox(px, py - ph / 2 + mw / 2, z, pw, mw, mt, 0.32, o.mould); B.rbox(px, py + ph / 2 - mw / 2, z, pw, mw, mt, 0.32, o.mould);
        B.rbox(px - pw / 2 + mw / 2, py, z, mw, ph - mw * 2 + 0.2, mt, 0.32, o.mould); B.rbox(px + pw / 2 - mw / 2, py, z, mw, ph - mw * 2 + 0.2, mt, 0.32, o.mould);
        B.box(px, py, s * (t2 + 0.03), pw - mw * 2 + 0.2, ph - mw * 2 + 0.2, 0.06, o.field || o.mould);
      }
      // lever on a round rose, pointing back towards the hinge
      const hu = U(o.handleA), hy = o.handleY - o.cy, lu = dir(o.leverDir || -1);
      B.cyl(hu, hy, s * (t2 + 0.3), 2.5, 2.5, 0.6, 20, o.brass, { rx: 90 });
      B.cyl(hu, hy, s * (t2 + 1.3), 0.55, 0.55, 1.6, 10, o.brass, { rx: 90 });
      B.rbox(hu + lu * 3.6, hy, s * (t2 + 2.15), 8.4, 1.4, 1.4, 0.5, o.brass);
      B.rbox(hu, hy + 5.5, s * (t2 + 0.15), 1.6, 3.2, 0.3, 0.1, o.brass);
    }
    if (o.hingeA != null) for (const fy of [0.12, 0.5, 0.88]) B.cyl(U(o.hingeA), -h / 2 + h * fy, (o.hingeSide || 1) * t2, 0.6, 0.6, 9, 10, o.hinge || o.brass);
    batch.build(pv);
    return slab;
  }
  // Unit contact-shadow pieces for code that places shadows itself (e.g. one instanced draw per room).
  // The geometry lies flat (normal up in the y-down world), centred, w x d with an m cm fade.
  function shadowGeo(sq, w, d, m) { const g = sq ? sliceGeo(w, d, shadowMargin(w, d, m)) : ringGeo(w, d, shadowMargin(w, d, m)); g.applyMatrix4(new T.Matrix4().makeRotationX(Math.PI / 2)); return g; }
  const shadowMaterial = (sq, a) => mat({ c: '#000', map: sq ? sqBlobTex() : ringTex(), basic: true, tr: true, o: Math.min(0.999, a == null ? 0.8 : a), dw: false, po: -2, cs: 1 });
  window.HouseKit = { T, D2R, SURFACE_LIFT, restY, tex, mat, shadowMat, shadowGeo, shadowMaterial, doorLeaf, batch: () => new Batch(), Batch, into, xform, roundBox, thicken, rnd, speckle, PAINT, wrapText, svgTex, blobTex, setAniso, TEX, MATS };
})();

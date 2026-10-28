/* hs-static: the house's static geometry, merged so one look (the best one) stays fast everywhere (docs/GRAPHICS.md).
 * After a room is built, its plain opaque meshes are merged per material, render order and ~3 m cell (so frustum culling
 * still works) into a handful of batches: hundreds of draw calls become tens. The ORIGINAL meshes stay exactly where they
 * were in the scene graph, on a layer the camera never draws, so picking (raycasters enable all layers), the owner's
 * editor, physics and every script that holds a reference keep working unchanged.
 * Self-healing: before each drawn frame verify() checks every merged source is still where, whether and how it was
 * (visible chain, world matrix, material, geometry, layers). If a script moves, hides, re-materials or re-layers one,
 * that batch dissolves for good and its originals draw again in the same frame. Nothing can go stale or vanish.
 *   HouseStatic.merge(group, { skip(obj) -> true to leave a subtree alone }) -> number of batches added
 *   HouseStatic.verify(group) -> true if any batch dissolved     HouseStatic.stats(group) -> { batches, sources, dissolved } */
(function () {
  'use strict';
  const T = window.THREE; if (!T || window.HouseStatic) return;
  const HIDDEN_MASK = 1 << 30, CELL = 300, BIG = 260, MAX_VERTS = 65535;
  const plainBeforeRender = T.Object3D.prototype.onBeforeRender, plainCompile = T.Material.prototype.onBeforeCompile;
  const _rel = new T.Matrix4(), _inv = new T.Matrix4(), _nm = new T.Matrix3(), _v = new T.Vector3(), _s = new T.Sphere();
  const merged = new WeakSet(), unstable = new WeakSet(), STATE = new WeakMap();
  let off = false; try { off = localStorage.getItem('jhp_hs_nomerge') === '1'; } catch (e) {}

  function plainMaterial(m) {
    return !!m && m.isMaterial && m.visible !== false && !m.transparent && !m.isShaderMaterial && !m.isRawShaderMaterial &&
      !m.morphTargets && !m.skinning && !m.displacementMap && (!m.defines || !Object.keys(m.defines).length) && (m.onBeforeCompile === plainCompile || !!m.userData?.houseSurface);
  }
  // Flat-coloured materials (no textures) that differ only in colour share one vertex-coloured material per "class":
  // the colour moves into a vertex attribute. This is the big saving (rooms are hundreds of distinct paint colours).
  const MAPS = ['map', 'emissiveMap', 'alphaMap', 'lightMap', 'aoMap', 'normalMap', 'bumpMap', 'specularMap', 'envMap', 'displacementMap'];
  const CLASSES = new Map();
  const MATERIAL_FIELDS = ['side','flatShading','shininess','depthWrite','depthTest','depthFunc','colorWrite','polygonOffset','polygonOffsetFactor','polygonOffsetUnits','alphaTest','fog','toneMapped','wireframe','vertexColors','lightMapIntensity','aoMapIntensity','bumpScale','displacementScale','displacementBias','normalMapType','reflectivity','refractionRatio','skinning','morphTargets','morphNormals','premultipliedAlpha','alphaToCoverage','blending','blendSrc','blendDst','blendEquation','blendSrcAlpha','blendDstAlpha','blendEquationAlpha','stencilWrite','stencilFunc','stencilRef','stencilWriteMask','stencilFuncMask','stencilFail','stencilZFail','stencilZPass'];
  const materialKey = m => MATERIAL_FIELDS.map(k => m[k]).join(',') + '|' + hex(m.specular) + '|' + (m.normalScale ? m.normalScale.x + ',' + m.normalScale.y : '') + '|' + (m.clippingPlanes ? m.clippingPlanes.map(p => p.normal.toArray().join(',') + ',' + p.constant).join(';') : '');
  const hex = c => c ? c.getHex() : -1;
  // Textured materials join a class too when they share the same texture objects (spot/grab clones of one material,
  // the same print in two colours); printed art keeps its own material (its fill changes per room pass).
  function flatClass(m) {
    if (!(m.isMeshPhongMaterial || m.isMeshLambertMaterial || m.isMeshBasicMaterial) || m.vertexColors || m.opacity !== 1 || m.wireframe || m.userData.print || (m.clippingPlanes && m.clippingPlanes.length)) return null;
    let maps = '';
    for (const k of MAPS) if (m[k]) { if (k === 'envMap' || !m[k].isTexture) return null; maps += k + m[k].id + ','; }
    return [materialKey(m), maps, m.type, m.side, m.flatShading ? 1 : 0, m.shininess, hex(m.specular), hex(m.emissive), m.emissiveIntensity, m.depthWrite ? 1 : 0, m.depthTest ? 1 : 0,
      m.polygonOffset ? m.polygonOffsetFactor + ',' + m.polygonOffsetUnits : 0, m.alphaTest, m.fog ? 1 : 0, m.colorWrite ? 1 : 0, m.toneMapped ? 1 : 0, m.customProgramCacheKey ? m.customProgramCacheKey() : ''].join('|');
  }
  function classMaterial(key, m) {
    let c = CLASSES.get(key);
    if (!c) { c = m.clone(); c.vertexColors = true; c.color.setRGB(1, 1, 1); c.userData = { staticClass: key }; c.needsUpdate = true; CLASSES.set(key, c); }
    return c;
  }
  // Program-upload counters can change after a context loss without changing the material appearance.
  function matState(m) { const s = { m, compile:m.onBeforeCompile, cache:m.customProgramCacheKey, defines:{...m.defines}, clipping:m.clippingPlanes, clipCount:m.clippingPlanes?.length||0, fields:MATERIAL_FIELDS.map(k=>m[k]), specular:hex(m.specular), nx:m.normalScale?.x, ny:m.normalScale?.y, color: hex(m.color), emissive: hex(m.emissive), ei: m.emissiveIntensity, visible: m.visible, opacity: m.opacity, transparent: m.transparent, maps: [] }; for (const k of MAPS) s.maps.push(m[k] || null); return s; }
  function matChanged(t) { const m = t.m; if(m.onBeforeCompile!==t.compile||m.customProgramCacheKey!==t.cache||m.clippingPlanes!==t.clipping||(m.clippingPlanes?.length||0)!==t.clipCount)return true;let defs=0;for(const k in m.defines){defs++;if(m.defines[k]!==t.defines[k])return true;}let savedDefs=0;for(const k in t.defines)savedDefs++;if(defs!==savedDefs)return true; for(let i=0;i<MATERIAL_FIELDS.length;i++)if(m[MATERIAL_FIELDS[i]]!==t.fields[i])return true; if (hex(m.specular)!==t.specular || m.normalScale?.x!==t.nx || m.normalScale?.y!==t.ny || hex(m.color) !== t.color || hex(m.emissive) !== t.emissive || m.emissiveIntensity !== t.ei || m.visible !== t.visible || m.opacity !== t.opacity || m.transparent !== t.transparent) return true; for (let i = 0; i < MAPS.length; i++) if ((m[MAPS[i]] || null) !== t.maps[i]) return true; return false; }
  function signature(g) {
    if (!g || !g.isBufferGeometry || g.isInstancedBufferGeometry || !g.attributes.position || !g.attributes.normal) return null;
    for (const k in g.morphAttributes) if (g.morphAttributes[k].length) return null;
    if (g.drawRange.start !== 0 || g.drawRange.count !== Infinity) return null;
    const names = Object.keys(g.attributes).sort(); let sig = '';
    for (const n of names) {
      const a = g.attributes[n];
      if (a.isInterleavedBufferAttribute || a.normalized || n === 'tangent' || !(a.array instanceof Float32Array)) return null;
      sig += n + a.itemSize + ';';
    }
    if (g.index && !(g.index.array instanceof Uint16Array || g.index.array instanceof Uint32Array)) return null;
    return sig;
  }
  // Mesh-level eligibility; the material is checked per geometry group.
  function plainMesh(o) {
    return o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && o.visible && o.layers.mask === 1 && o.frustumCulled &&
      o.onBeforeRender === plainBeforeRender && !merged.has(o) && !unstable.has(o) && !o.userData.staticBatch;
  }
  function geometryState(g) { return { attrs: Object.entries(g.attributes).map(([name,a]) => ({name,a,version:a.version})), index:g.index, indexVersion:g.index?.version, start:g.drawRange.start, count:g.drawRange.count, groups:g.groups.map(p=>({...p})) }; }
  function geometryChanged(g,s) {
    if (g.index !== s.index || g.index?.version !== s.indexVersion || g.drawRange.start !== s.start || g.drawRange.count !== s.count || g.groups.length !== s.groups.length) return true;
    for(let i=0;i<g.groups.length;i++){const a=g.groups[i],b=s.groups[i];if(a.start!==b.start||a.count!==b.count||a.materialIndex!==b.materialIndex)return true;}
    let n=0;for(const k in g.attributes)n++;if(n!==s.attrs.length)return true;
    for (const t of s.attrs) if (g.attributes[t.name] !== t.a || t.a.version !== t.version) return true;
    return false;
  }
  function snapshot(o, group) {
    const chain = []; for (let p = o.parent; p && p !== group; p = p.parent) chain.push(p);
    return { o, mask: o.layers.mask, mat: o.material, materials:Array.isArray(o.material)?o.material.slice():null, materialVisibility:[].concat(o.material).map(m=>m?.visible), geo: o.geometry, geometryState:geometryState(o.geometry), renderOrder:o.renderOrder, frustumCulled:o.frustumCulled, mw: Float64Array.from(o.matrixWorld.elements), chain, parents: chain.map(p => p.parent) };
  }

  let mergeMs = 0;
  function merge(group, opts) {
    if (off || !group) return 0;
    const t0 = performance.now();
    try { return mergeNow(group, opts); } finally { mergeMs += performance.now() - t0; }
  }
  function mergeNow(group, opts) {
    opts = opts || {};
    group.updateWorldMatrix(true, true);
    _inv.copy(group.matrixWorld).invert();
    const bins = new Map(), sources = [];
    const visit = (o, shown) => {
      if (o !== group && (opts.skip?.(o) || o.userData.staticBatch || unstable.has(o))) return;
      shown = shown && o.visible;
      if (shown && plainMesh(o)) {
        const sig = signature(o.geometry), mats = Array.isArray(o.material) ? o.material : [o.material];
        let ok = !!sig && mats.every(m => !m.isMaterial || !m.transparent);
        const groups = Array.isArray(o.material) ? o.geometry.groups : [{ start: 0, count: Infinity, materialIndex: 0 }];
        if (ok && Array.isArray(o.material) && !groups.length) ok = false;
        if (ok && groups.some(gr => { const m = mats[gr.materialIndex]; return m && m.visible !== false && !plainMaterial(m); })) ok = false;
        if (ok) {
          _rel.multiplyMatrices(_inv, o.matrixWorld);
          const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
          _s.copy(g.boundingSphere).applyMatrix4(_rel);
          const cell = _s.radius > BIG ? 'big' : Math.floor(_s.center.x / CELL) + ',' + Math.floor(_s.center.y / 400) + ',' + Math.floor(_s.center.z / CELL);
          const rel = _rel.clone(), flip = rel.determinant() < 0, src = snapshot(o, group);
          for (const gr of groups) {
            const m = mats[gr.materialIndex]; if (!m || m.visible === false) continue;
            const fc = !o.geometry.attributes.color && flatClass(m);
            const key = (fc ? 'class:' + fc : m.id) + '|' + o.renderOrder + '|' + sig + '|' + cell;
            let bin = bins.get(key); if (!bin) bins.set(key, bin = { m: fc ? classMaterial(fc, m) : m, flat: !!fc, renderOrder: o.renderOrder, list: [] });
            bin.list.push({ o, g, rel, flip, start: gr.start, count: gr.count, src, m });
          }
          sources.push(src);
          return; // (a mesh's children are not drawn by merging it; check them too)
        }
      }
      for (const c of o.children) visit(c, shown);
    };
    for (const c of group.children) visit(c, true);
    // A batch for a single draw saves nothing: leave lone meshes as they are.
    let made = 0;
    const host = group.userData.staticHost || (group.userData.staticHost = Object.assign(new T.Group(), { name: 'static-batches' }));
    if (!host.parent) { host.matrixAutoUpdate = false; group.add(host); }
    const state = STATE.get(group) || { batches: [], dissolved: 0, group, lastDissolve: 0, lastMerge: 0 }; STATE.set(group, state); state.lastMerge = performance.now();
    for (const bin of bins.values()) {
      // split so a 16-bit index is always enough. A lone single-material mesh is left as it is (merging saves nothing);
      // every part of a multi-material mesh is merged, so a source is hidden only when all of its faces are batched.
      let chunk = [], verts = 0;
      const flush = () => {
        if (chunk.length > 1 || chunk.length === 1 && Array.isArray(chunk[0].o.material)) { const b = build(bin, chunk); if (b) { host.add(b.mesh); state.batches.push(b); made++; } }
        chunk = []; verts = 0;
      };
      for (const p of bin.list) { const n = p.g.index ? p.g.attributes.position.count : Math.min(p.count, p.g.attributes.position.count - p.start); if (verts + n > MAX_VERTS) flush(); chunk.push(p); verts += n; }
      flush();
    }
    if (made) host.updateMatrixWorld(true); // (drawn correctly even when merged between updateMatrixWorld and render)
    return made;
  }

  function build(bin, parts) {
    const g0 = parts[0].g, names = Object.keys(g0.attributes);
    let nv = 0, ni = 0;
    for (const p of parts) {
      const pos = p.g.attributes.position;
      if (p.g.index) { nv += pos.count; ni += Math.min(p.count, p.g.index.count - p.start); }
      else { const c = Math.min(p.count, pos.count - p.start); nv += c; ni += c; }
    }
    if (!nv || !ni) return null;
    const out = {}; for (const n of names) out[n] = new Float32Array(nv * g0.attributes[n].itemSize);
    const col = bin.flat ? new Float32Array(nv * 3) : null, mats = new Map();
    const index = new Uint16Array(ni);
    let vb = 0, ib = 0;
    const srcs = new Set();
    for (const p of parts) {
      const g = p.g, pos = g.attributes.position, idx = g.index;
      const v0 = idx ? 0 : p.start, vc = idx ? pos.count : Math.min(p.count, pos.count - p.start);
      _nm.getNormalMatrix(p.rel);
      for (const n of names) {
        const a = g.attributes[n], s = a.itemSize, src = a.array, dst = out[n];
        for (let i = 0; i < vc; i++) {
          const si = (v0 + i) * s, di = (vb + i) * s;
          if (n === 'position') { _v.set(src[si], src[si + 1], src[si + 2]).applyMatrix4(p.rel); dst[di] = _v.x; dst[di + 1] = _v.y; dst[di + 2] = _v.z; }
          else if (n === 'normal') { _v.set(src[si], src[si + 1], src[si + 2]).applyMatrix3(_nm).normalize(); dst[di] = _v.x; dst[di + 1] = _v.y; dst[di + 2] = _v.z; }
          else for (let k = 0; k < s; k++) dst[di + k] = src[si + k];
        }
      }
      if (idx) {
        const end = Math.min(p.start + p.count, idx.count);
        for (let i = p.start; i < end; i += 3) {
          const a = idx.array[i] + vb, b = idx.array[i + 1] + vb, c = idx.array[i + 2] + vb;
          index[ib++] = a; if (p.flip) { index[ib++] = c; index[ib++] = b; } else { index[ib++] = b; index[ib++] = c; }
        }
      } else {
        for (let i = 0; i + 2 < vc; i += 3) {
          index[ib++] = vb + i; if (p.flip) { index[ib++] = vb + i + 2; index[ib++] = vb + i + 1; } else { index[ib++] = vb + i + 1; index[ib++] = vb + i + 2; }
        }
      }
      if (col) { const c = p.m.color; for (let i = 0; i < vc; i++) { const k = (vb + i) * 3; col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b; } }
      if (bin.flat && !mats.has(p.m)) mats.set(p.m, matState(p.m));
      vb += vc; srcs.add(p.src);
    }
    const geo = new T.BufferGeometry();
    for (const n of names) geo.setAttribute(n, new T.BufferAttribute(out[n], g0.attributes[n].itemSize));
    if (col) geo.setAttribute('color', new T.BufferAttribute(col, 3));
    geo.setIndex(new T.BufferAttribute(ib === index.length ? index : index.slice(0, ib), 1));
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    const mesh = new T.Mesh(geo, bin.m);
    mesh.name = 'static-batch'; mesh.matrixAutoUpdate = false; mesh.renderOrder = bin.renderOrder;
    mesh.userData.staticBatch = true; mesh.userData.noPick = true;
    const sources = [...srcs];
    for (const s of sources) { merged.add(s.o); s.o.layers.mask = HIDDEN_MASK; }
    return { mesh, sources, mats: [...mats.values()], live: true };
  }

  function changed(s, group) {
    const o = s.o;
    if (s.dead || o.layers.mask !== HIDDEN_MASK || o.material !== s.mat || o.geometry !== s.geo || geometryChanged(o.geometry,s.geometryState) || o.renderOrder !== s.renderOrder || o.frustumCulled !== s.frustumCulled || !o.visible) return true;
    if(s.materials){if(o.material.length!==s.materials.length)return true;for(let i=0;i<s.materials.length;i++)if(o.material[i]!==s.materials[i]||o.material[i]?.visible!==s.materialVisibility[i])return true;}
    const chain = s.chain;
    if (o.parent !== (chain.length ? chain[0] : group)) return true;
    for (let i = 0; i < chain.length; i++) { const p = chain[i]; if (!p.visible || p.parent !== s.parents[i]) return true; }
    const e = o.matrixWorld.elements, w = s.mw;
    for (let i = 0; i < 16; i++) if (e[i] !== w[i]) return true;
    return false;
  }
  const REASONS = {};
  function reason(s, group) {
    const o = s.o;
    if (o.layers.mask !== HIDDEN_MASK) return 'layers'; if (o.material !== s.mat) return 'material'; if (o.geometry !== s.geo || geometryChanged(o.geometry,s.geometryState)) return 'geometry';
    if (!o.visible) return 'hidden'; if (o.parent !== (s.chain.length ? s.chain[0] : group)) return 'reparented';
    for (let i = 0; i < s.chain.length; i++) { if (!s.chain[i].visible) return 'parent-hidden'; if (s.chain[i].parent !== s.parents[i]) return 'reparented'; }
    return 'moved';
  }
  function dissolve(b, state) {
    b.live = false; state.dissolved++; state.lastDissolve = performance.now();
    // whatever changed is animated or scripted: never merge it again (re-merging leaves it out)
    for (const s of b.sources) if (!s.dead && changed(s, state.group)) { unstable.add(s.o); const k = (state.group.name || '?') + ':' + reason(s, state.group) + (s.o.userData.thing || s.chain.some(p => p.userData.thing) ? ':thing' : ''); REASONS[k] = (REASONS[k] || 0) + 1; }
    if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
    b.mesh.geometry.dispose();
    for (const s of b.sources) { s.dead = true; merged.delete(s.o); if (s.o.layers.mask === HIDDEN_MASK) s.o.layers.mask = s.mask; }
  }
  // Call after scene.updateMatrixWorld(), before drawing the group.
  function verify(group) {
    const state = STATE.get(group); if (!state || !state.batches.length) return false;
    let any = false, again = true;
    while (again) {
      again = false;
      for (let i = state.batches.length - 1; i >= 0; i--) {
        const b = state.batches[i];
        let bad = false;
        for (let j = 0; j < b.mats.length; j++) if (matChanged(b.mats[j])) { bad = true; const k = (group.name || '?') + ':material-state'; REASONS[k] = (REASONS[k] || 0) + 1; for (const s of b.sources) if (s.mat === b.mats[j].m || Array.isArray(s.mat) && s.mat.includes(b.mats[j].m)) unstable.add(s.o); break; }
        if (!bad) for (let j = 0; j < b.sources.length; j++) if (changed(b.sources[j], group)) { bad = true; break; }
        if (bad) { dissolve(b, state); state.batches.splice(i, 1); any = again = true; }
      }
    }
    return any;
  }
  // Re-merge a drawn room after it has been quiet for 6 s since a batch dissolved (the unstable parts stay out),
  // and every 20 s pick up meshes added after the build (chores, deliveries). Cheap when there is nothing to do.
  function maintain(group, now) {
    const state = STATE.get(group); if (!state || off) return 0;
    if (state.lastDissolve > state.lastMerge && now - state.lastDissolve > 6000 || now - state.lastMerge > 20000) return merge(group);
    return 0;
  }
  function unmerge(group) { const state = STATE.get(group); if (!state) return; for (const b of state.batches) dissolve(b, state); state.batches.length = 0; }
  function stats(group) { const s = STATE.get(group); return s ? { batches: s.batches.length, sources: s.batches.reduce((n, b) => n + b.sources.length, 0), dissolved: s.dissolved } : { batches: 0, sources: 0, dissolved: 0 }; }
  window.HouseStatic = { merge, verify, maintain, unmerge, stats, REASONS, get ms() { return mergeMs; }, HIDDEN_MASK, get off() { return off; } };
})();

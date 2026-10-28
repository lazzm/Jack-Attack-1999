/* hs-glow: shape-hugging highlights for carrying (js/hs-world.js uses it; docs/PHYSICS.md section 4).
 * Nothing here is a flat square drawn over a target. Three cheap pieces, all in the room's own render pass (no extra
 * full-screen passes, so Low and phones pay only a few small draws while something is carried):
 *   - a rim glow on the target's own geometry: a soft additive fresnel sheen on its surfaces (the washing basket, the bin)
 *     plus an inverted-hull outline pushed out along smoothed normals, so the whole silhouette is ringed in gold;
 *   - a footprint ring "decal" lying on the surface under it, matching its shape (a circle for round things, a rounded
 *     rectangle otherwise), with a soft halo; all decals in ONE instanced draw;
 *   - for an empty accepting slot, a shallow footprint ring. Only the actual placement ghost copies the held model.
 * The placement ghost (green fits / red blocked / gold snaps in) uses the same fill + rim look on the carried thing.
 * Coordinates are the house's (cm, y down: the world root is flipped). */
(function () {
  'use strict';
  const T = window.THREE; if (!T || window.HouseGlow) return;

  // ---------------------------------------------------------------- one geometry for a whole model, in its own frame
  // position + normal + snorm (normals averaged over coincident corners: the hull swells without cracking at box edges)
  const cache = new WeakMap();
  function visibleGroups(o) {
    const mats = [].concat(o.material), g = o.geometry;
    if (!Array.isArray(o.material)) return mats[0] && mats[0].visible !== false && !(mats[0].transparent && mats[0].opacity < 0.2) ? [null] : [];
    return (g.groups.length ? g.groups : [{ start: 0, count: Infinity, materialIndex: 0 }]).filter(gr => { const m = mats[gr.materialIndex]; return m && m.visible !== false && !(m.transparent && m.opacity < 0.2); });
  }
  function merge(obj, o) {
    o = o || {};
    const hit = cache.get(obj); if (hit && !o.fresh) return hit;
    obj.updateWorldMatrix(true, true);
    const inv = new T.Matrix4().copy(obj.matrixWorld).invert(), m4 = new T.Matrix4(), nm = new T.Matrix3(), v = new T.Vector3(), n = new T.Vector3();
    const pos = [], nrm = [], max = o.maxTris || 9000;
    const walk = (fn) => o.all ? obj.traverse(fn) : obj.traverseVisible(fn);
    walk(m => {
      if (!m.isMesh || m.isInstancedMesh || m.userData.contactShadow || m.userData.noGlow || !m.geometry || !m.geometry.attributes.position) return;
      if (o.skip && o.skip(m)) return;
      const geo = m.geometry, P = geo.attributes.position, N = geo.attributes.normal, I = geo.index;
      m4.multiplyMatrices(inv, m.matrixWorld); nm.getNormalMatrix(m4);
      const flip = m4.determinant() < 0;
      for (const gr of visibleGroups(m)) {
        const total = I ? I.count : P.count, s = gr ? gr.start : 0, e = gr ? Math.min(total, gr.start + gr.count) : total;
        for (let i = s; i + 2 < e; i += 3) {
          if (pos.length / 9 >= max) return;
          const tri = [0, 1, 2].map(k => I ? I.getX(i + k) : i + k); if (flip) tri.reverse();
          for (const k of tri) {
            v.fromBufferAttribute(P, k).applyMatrix4(m4); pos.push(v.x, v.y, v.z);
            if (N) n.fromBufferAttribute(N, k).applyMatrix3(nm).normalize(); else n.set(0, -1, 0);
            nrm.push(n.x, n.y, n.z);
          }
        }
      }
    });
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
    // smoothed normals: the sum of every vertex normal at the same place (0.05 cm grid)
    const acc = new Map(), sn = new Float32Array(nrm.length), key = i => Math.round(pos[i] * 20) + ',' + Math.round(pos[i + 1] * 20) + ',' + Math.round(pos[i + 2] * 20);
    for (let i = 0; i < pos.length; i += 3) { const k = key(i); let a = acc.get(k); if (!a) acc.set(k, a = [0, 0, 0]); a[0] += nrm[i]; a[1] += nrm[i + 1]; a[2] += nrm[i + 2]; }
    for (let i = 0; i < pos.length; i += 3) { const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; sn[i] = a[0] / l; sn[i + 1] = a[1] / l; sn[i + 2] = a[2] / l; }
    geo.setAttribute('snorm', new T.BufferAttribute(sn, 3));
    geo.computeBoundingBox(); geo.computeBoundingSphere();
    geo.userData.tris = pos.length / 9;
    if (!o.fresh) cache.set(obj, geo);
    return geo;
  }

  // ---------------------------------------------------------------- shaders (work instanced and not: three adds USE_INSTANCING)
  const VERT = `
    attribute vec3 snorm;
    uniform float uGrow; uniform float uPx;
    varying vec3 vN; varying vec3 vV;
    void main() {
      vec4 p = vec4(position, 1.0); vec3 nn = normal, sn = snorm;
      #ifdef USE_INSTANCING
        p = instanceMatrix * p; nn = mat3(instanceMatrix) * nn; sn = mat3(instanceMatrix) * sn;
      #endif
      vec4 mv = modelViewMatrix * p;
      vec3 s = normalize(normalMatrix * sn);
      mv.xyz += s * (uGrow + uPx * max(0.0, -mv.z));
      vN = normalize(normalMatrix * nn); vV = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }`;
  const RIM = `
    uniform vec3 uColor; uniform float uStrength;
    varying vec3 vN; varying vec3 vV;
    void main() {
      float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
      float a = (0.03 + 0.97 * f * f * f * f) * uStrength;
      gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0));
    }`;
  const HULL = `
    uniform vec3 uColor; uniform float uStrength;
    void main() { gl_FragColor = vec4(uColor, clamp(uStrength, 0.0, 1.0)); }`;
  function rimMat(color, strength, o) {
    o = o || {};
    return new T.ShaderMaterial({
      uniforms: { uColor: { value: new T.Color(color) }, uStrength: { value: strength }, uGrow: { value: o.grow != null ? o.grow : 0.08 }, uPx: { value: 0 } },
      vertexShader: VERT, fragmentShader: RIM, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
    });
  }
  function hullMat(color, strength) {
    return new T.ShaderMaterial({
      uniforms: { uColor: { value: new T.Color(color) }, uStrength: { value: strength }, uGrow: { value: 0.35 }, uPx: { value: 0.0042 } },
      vertexShader: VERT, fragmentShader: HULL, transparent: true, depthWrite: false, side: T.BackSide,
    });
  }

  // footprint rings: one instanced plane, the shape drawn by a signed distance in the fragment shader
  const DECAL_V = `
    attribute vec4 aShape; attribute vec4 aCol;
    varying vec2 vP; varying vec4 vS; varying vec4 vC;
    void main() {
      vP = (uv - 0.5) * 2.0 * (aShape.xy + aShape.w); vS = aShape; vC = aCol;
      vec4 p = vec4(position, 1.0);
      #ifdef USE_INSTANCING
        p = instanceMatrix * p;
      #endif
      gl_Position = projectionMatrix * modelViewMatrix * p;
    }`;
  const DECAL_F = `
    uniform float uPulse;
    varying vec2 vP; varying vec4 vS; varying vec4 vC;
    void main() {
      float d;
      if (vS.z > 0.5) d = length(vP) - min(vS.x, vS.y);
      else { float r = min(4.0, 0.5 * min(vS.x, vS.y)); vec2 q = abs(vP) - vS.xy + vec2(r); d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      float line = 1.0 - smoothstep(0.35, 1.25, abs(d + 0.7));
      float halo = d > 0.0 ? exp(-d / max(1.0, vS.w * 0.4)) * 0.42 : 0.0;
      float fill = d < 0.0 ? 0.07 + 0.16 * smoothstep(-7.0, 0.0, d) : 0.0;
      float a = (line * 0.95 + halo + fill) * vC.a * uPulse;
      if (a < 0.004) discard;
      gl_FragColor = vec4(vC.rgb, clamp(a, 0.0, 1.0));
    }`;
  function decals(max) {
    const plane = new T.PlaneGeometry(1, 1); plane.rotateX(-Math.PI / 2); // in XZ
    const shape = new T.InstancedBufferAttribute(new Float32Array(max * 4), 4), col = new T.InstancedBufferAttribute(new Float32Array(max * 4), 4);
    shape.setUsage(T.DynamicDrawUsage); col.setUsage(T.DynamicDrawUsage);
    plane.setAttribute('aShape', shape); plane.setAttribute('aCol', col);
    const mat = new T.ShaderMaterial({ uniforms: { uPulse: { value: 1 } }, vertexShader: DECAL_V, fragmentShader: DECAL_F, transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const mesh = new T.InstancedMesh(plane, mat, max); mesh.count = 0; mesh.frustumCulled = false; mesh.renderOrder = 4;
    mesh.userData.noPick = true; mesh.raycast = () => {};
    const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), s = new T.Vector3(), c = new T.Color();
    let n = 0;
    return {
      mesh,
      begin() { n = 0; },
      // (x, y, z) the centre of the footprint ON the surface (y down), ry degrees, hx/hz half sizes, round, colour, strength
      add(x, y, z, ry, hx, hz, round, color, strength) {
        if (n >= max || ![x, y, z, hx, hz].every(Number.isFinite)) return;
        const margin = Math.max(3, Math.min(9, 0.35 * Math.max(hx, hz)));
        if (round) hx = hz = Math.max(hx, hz);
        p.set(x, y - 0.3, z); e.set(0, (ry || 0) * Math.PI / 180, 0); q.setFromEuler(e); s.set(2 * (hx + margin), 1, 2 * (hz + margin));
        mesh.setMatrixAt(n, m4.compose(p, q, s));
        shape.setXYZW(n, hx, hz, round ? 1 : 0, margin); c.set(color); col.setXYZW(n, c.r, c.g, c.b, strength);
        n++;
      },
      end(pulse) { mesh.count = n; mesh.visible = n > 0; mesh.instanceMatrix.needsUpdate = true; shape.needsUpdate = true; col.needsUpdate = true; mat.uniforms.uPulse.value = pulse; },
      hide() { n = 0; mesh.count = 0; mesh.visible = false; },
    };
  }

  window.HouseGlow = { merge, rimMat, hullMat, decals, GOLD: '#ffd84a', GREEN: '#8fdc6a', RED: '#e2553f' };
})();

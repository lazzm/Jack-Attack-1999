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
  // One look (docs/GRAPHICS.md): every authored texture uploads at full resolution with mipmaps and the renderer's
  // anisotropy (setAniso). There are no graphics tiers any more; setQuality() only re-applies filtering.
  let aniso = 8;
  const qualityTextures=new Set();
  function qualityTexture(t){
    if(!t||t.userData?.jackLive||!t.image)return;
    qualityTextures.add(t);
    const next=t.magFilter===T.NearestFilter||t.minFilter===T.NearestFilter?1:aniso;
    if(t.anisotropy!==next){t.anisotropy=next;t.needsUpdate=true;}
  }
  const qualityMaps=['map','emissiveMap','alphaMap','lightMap','aoMap','normalMap','roughnessMap','metalnessMap','specularMap','bumpMap'];
  // House surfaces keep their material identity (switches/props retain references) and r128's Phong program.
  function interiorUniforms(){const uniform=v=>({value:v});return {houseSky:uniform(new T.Color()),houseMain:uniform(new T.Color()),houseAccent:uniform(new T.Color()),houseSpill:uniform(new T.Color()),houseSun:uniform(new T.Color()),houseSunDir:uniform(new T.Vector3()),houseProjector0:uniform(new T.Matrix4()),houseProjector1:uniform(new T.Matrix4()),houseU:uniform([new T.Vector4(),new T.Vector4()]),houseV:uniform([new T.Vector4(),new T.Vector4()]),houseAperture:uniform([new T.Vector4(),new T.Vector4()]),housePlane:uniform([new T.Vector4(),new T.Vector4()])}}
  let interiorCheap=false;
  const INTERIOR_BAKES=new Map(),INTERIOR_SHADER={uniforms:{...interiorUniforms(),houseSunViewDir:{value:new T.Vector3()},houseBounds0:{value:new T.Vector4()},houseBounds1:{value:new T.Vector4()},houseClip0:{value:new T.Vector4()},houseClip1:{value:new T.Vector4()}}},interiorDark=new T.Color('#000');
  const interiorViewProjectors=[new T.Matrix4(),new T.Matrix4()],interiorViewTransform=new T.Matrix4(),interiorPlane=new T.Vector4();
  function interiorFor(r,camera){
    const state=INTERIOR_BAKES.get(r?.id),shared=INTERIOR_SHADER.uniforms;
    if(!state){shared.houseSun.value=interiorDark;return}
    for(const key in state.uniforms)shared[key].value=state.uniforms[key].value;
    shared.houseBounds0.value=state.uniforms.houseAperture.value[0];shared.houseBounds1.value=state.uniforms.houseAperture.value[1];
    // Phong already normalises its view-space normal. Transform the sun once
    // per room pass instead of a second normal transform on every vertex.
    const d=shared.houseSunDir.value;shared.houseSunViewDir.value.set(d.x,-d.y,d.z);
    if(camera){
      shared.houseSunViewDir.value.transformDirection(camera.matrixWorldInverse);
      interiorViewTransform.copy(camera.matrixWorld).transpose();
      for(let i=0;i<2;i++){
        const key=i?'houseProjector1':'houseProjector0',source=state.uniforms[key].value.elements,target=interiorViewProjectors[i].copy(state.uniforms[key].value).elements;
        for(const column of [0,1,3]){const offset=column*4;interiorPlane.fromArray(source,offset);interiorPlane.y=-interiorPlane.y;interiorPlane.applyMatrix4(interiorViewTransform);interiorPlane.toArray(target,offset)}
        shared[key].value=interiorViewProjectors[i];
      }
    }
    shared.houseClip0.value.fromArray(shared.houseProjector0.value.elements,12);
    shared.houseClip1.value.fromArray(shared.houseProjector1.value.elements,12);
  }
  function phongShader(shader){
    const state=INTERIOR_SHADER;
    Object.assign(shader.uniforms,state.uniforms);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      uniform vec3 houseSky,houseMain,houseAccent,houseSpill,houseSun,houseSunViewDir;
      uniform mat4 houseProjector0,houseProjector1;
      float houseApertureMask(mat4 projector,vec4 p){
        vec4 a=projector[2];if(a.y<=a.x||dot(projector[3],p)<.5)return 0.0;
        float u=dot(projector[0],p),v=dot(projector[1],p);
        if(u<a.x-4.0||u>a.y+4.0||v<a.z-4.0||v>a.w+4.0)return 0.0;
        float mask=smoothstep(a.x-4.0,a.x+4.0,u)*(1.0-smoothstep(a.y-4.0,a.y+4.0,u))*smoothstep(a.z-4.0,a.z+4.0,v)*(1.0-smoothstep(a.w-4.0,a.w+4.0,v));
        return mask*smoothstep(1.0,4.0,abs(u-(a.x+a.y)*.5));
      }
      vec3 houseWindowLight(vec3 surfaceNormal,vec3 viewPosition){
        if(dot(houseSun,vec3(1.0))<.001)return vec3(0.0);
        float facing=max(0.0,dot(surfaceNormal,-houseSunViewDir));
        if(facing==0.0)return vec3(0.0);
        vec4 p=vec4(-viewPosition,1.0);
        float sunMask=houseApertureMask(houseProjector0,p)+houseApertureMask(houseProjector1,p);
        return houseSun*min(1.0,sunMask)*facing;
      }`);
    // The real rig sun is black in baked rooms. Skip its zero contribution;
    // retain r128's branch-free point-light path and vertex interface.
    const direct=T.ShaderChunk.lights_fragment_begin.replace(/(\b(directionalLight)\s*=\s*\w+\[\s*i\s*\];)([\s\S]*?RE_Direct\( directLight, geometry, material, reflectedLight \);)/g,
      '$1\nif(any(notEqual($2.color,vec3(0.0)))){$3\n}');
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',direct);
    if(this.userData.pendant){
      // One material for the cord and shade, with the original cord's exact
      // diffuse/specular/shininess and no emission. Constant U selects the part.
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float houseCord=1.0-step(.125,vUv.x);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.9333333333333333),houseCord);`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        totalEmissiveRadiance*=1.0-houseCord;`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_phong_fragment>',T.ShaderChunk.lights_phong_fragment
        .replace('material.specularColor = specular;', 'material.specularColor = mix(specular,vec3(0.047058823529411764),houseCord);')
        .replace('material.specularShininess = shininess;','material.specularShininess = mix(shininess,6.0,houseCord);'));
    }
    let maps=T.ShaderChunk.lights_fragment_maps;
    if(this.userData.interiorShell){
      // The five original UNORM8 channels are preserved: RGB weights + AO in
      // one sample, with the fourth (doorway) weight fetched only when lit.
      maps=maps.replace(/vec3 lightMapIrradiance[^;]+;/,`vec3 houseDoorIrradiance=vec3(0.0);
        if(any(notEqual(houseSpill,vec3(0.0))))houseDoorIrradiance=texture2D(aoMap,vUv2).r*houseSpill;
        vec3 lightMapIrradiance = lightMapTexel.r*houseSky + lightMapTexel.g*houseMain + lightMapTexel.b*houseAccent + houseDoorIrradiance;`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',T.ShaderChunk.aomap_fragment.replace('texture2D( aoMap, vUv2 ).r','lightMapTexel.a'));
    }
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>',maps+'\nirradiance += PI*houseWindowLight(normal,vViewPosition);');
    interiorSun(shader,interiorCheap&&this.userData.interiorShell);
  }
  // All house surfaces project window coordinates at vertices. The last
  // adaptation rungs also skip shell specular work; lamp falloff stays per pixel.
  // No material identity, map, geometry or batch is changed by a step.
  function interiorAdapt(level,scene){
    const cheap=level>=4;if(cheap===interiorCheap)return;
    interiorCheap=cheap;
    scene?.traverse(o=>{for(const m of [].concat(o.material||[]))if(m.userData.interiorShell&&m.onBeforeCompile===phongShader)m.needsUpdate=true});
  }
  function interiorSun(shader,diffuse){
    // Projector coordinates are affine in position: perspective interpolation
    // preserves the exact window shape, including its soft edges and mullion.
    // Four interpolated scalars replace both fragment-stage matrices. Keep the
    // existing fragment normal so curved props retain exactly the same facing.
    const varyings='varying vec4 houseWindowUV;';
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>',`#include <common>
        ${varyings}uniform mat4 houseProjector0,houseProjector1;uniform vec3 houseSun;`)
      .replace('#include <project_vertex>',`#include <project_vertex>
        houseWindowUV=vec4(0.0);
        if(dot(houseSun,vec3(1.0))>=.001){
          vec4 houseP=vec4(mvPosition.xyz,1.0);
          houseWindowUV=vec4(dot(houseProjector0[0],houseP),dot(houseProjector0[1],houseP),dot(houseProjector1[0],houseP),dot(houseProjector1[1],houseP));
        }`);
    shader.fragmentShader=(shader.fragmentShader.slice(0,shader.fragmentShader.indexOf('uniform vec3 houseSky'))+shader.fragmentShader.slice(shader.fragmentShader.indexOf('#include <packing>')))
      .replace('#include <common>',`#include <common>
        ${varyings}uniform vec3 houseSky,houseMain,houseAccent,houseSpill,houseSun,houseSunViewDir;uniform vec4 houseBounds0,houseBounds1,houseClip0,houseClip1;
        float houseMask(vec4 a,vec2 uv,float side){
          if(a.y<=a.x||side<.5)return 0.0;
          float u=uv.x,v=uv.y;
          if(u<a.x-4.0||u>a.y+4.0||v<a.z-4.0||v>a.w+4.0)return 0.0;
          // Opposite soft edges never overlap: nearest-edge distance is
          // algebraically the same product, using two ramps instead of four.
          vec2 edge=min(uv-a.xz,a.yw-uv);
          vec2 ramp=smoothstep(vec2(-4.0),vec2(4.0),edge);
          return ramp.x*ramp.y*smoothstep(1.0,4.0,abs(u-(a.x+a.y)*.5));
        }
        vec3 houseWindowLight(vec3 surfaceNormal,vec3 viewPosition){
          if(dot(houseSun,vec3(1.0))<.001)return vec3(0.0);
          float facing=max(0.0,dot(surfaceNormal,-houseSunViewDir));
          if(facing<=0.0)return vec3(0.0);
          vec4 p=vec4(-viewPosition,1.0);
          float mask=houseMask(houseBounds0,houseWindowUV.xy,dot(houseClip0,p))+houseMask(houseBounds1,houseWindowUV.zw,dot(houseClip1,p));
          return houseSun*min(1.0,mask)*facing;
        }`);
    if(diffuse)shader.fragmentShader=shader.fragmentShader
      .replace('#include <lights_phong_pars_fragment>',T.ShaderChunk.lights_phong_pars_fragment.replace(/reflectedLight\.directSpecular \+= irradiance[^;]+;/,''))
      .replace('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )','#if 0');
  }
  function phongKey(){return 'house-interior-r7-'+(interiorCheap&&this.userData.interiorShell?'diffuse-':'pixel-')+(this.userData.interiorShell?'shell':'prop')+(this.userData.pendant?'-pendant':'')}
  function surfaceQuality(m){
    if(!m.isMeshPhongMaterial||!m.userData.houseSurface)return;
    if(m.onBeforeCompile!==phongShader){m.onBeforeCompile=phongShader;m.customProgramCacheKey=phongKey;m.flatShading=!!m.userData.spec?.flat;m.needsUpdate=true}
  }
  function cloneSurface(){const m=new T.MeshPhongMaterial().copy(this);m.clone=cloneSurface;surfaceQuality(m);if(this.userData.print)PRINTS.add(m);return m}
  function qualityMaterial(m){surfaceQuality(m);for(const key of qualityMaps)if(m[key])qualityTexture(m[key])}
  function setQuality(tier,scene){
    for(const key in TEX)qualityTexture(TEX[key]);
    if(scene)scene.traverse(o=>{if(Array.isArray(o.material)){for(const m of o.material)qualityMaterial(m)}else if(o.material)qualityMaterial(o.material)});
  }
  // Live images stay separate from their native game/interactive DOM canvases.
  function liveCanvas(source,cache,key,maxEdge){
    if(!source)return null;const scale=Math.min(1,maxEdge/Math.max(source.width,source.height));if(scale>=1)return source;
    let c=cache[key];if(!c)c=cache[key]=document.createElement('canvas');
    const w=Math.max(1,Math.floor(source.width*scale)),h=Math.max(1,Math.floor(source.height*scale));
    if(c.width!==w||c.height!==h){c.width=w;c.height=h}
    const g=c.getContext('2d');g.clearRect(0,0,w,h);g.drawImage(source,0,0,w,h);return c;
  }
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
    qualityTexture(t);return TEX[key] = t;
  }
  // Anisotropic filtering for every mipmapped texture (the renderer's capability, capped per graphics tier).
  // refresh: also re-filter textures that already exist (one re-upload each, so only on a deliberate change).
  function setAniso(a, refresh) {
    aniso = Math.max(1, a | 0);
    if (!refresh) return;
    const seen = new Set();
    const apply = t => { if (!t || seen.has(t)) return; seen.add(t); const next = (t.minFilter === T.NearestFilter || t.magFilter === T.NearestFilter) ? 1 : aniso; if (t.anisotropy !== next) { t.anisotropy = next; t.needsUpdate = true; } };
    for (const k in TEX) apply(TEX[k]);
    for (const t of qualityTextures) apply(t); // tier-managed textures (graphics stage 0)
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

  // Small, room-local light atlases for the plaster and floor finishes. Charts
  // come from the actual built planes (including the stair soffit), so window
  // holes stay holes, no decal crosses an opening, and no extra draws are needed.
  // These are indirect light / occlusion only; the existing rig still lights
  // movable things. Neither exterior materials nor saved game state is touched.
  // One queue for the house, not one budget per room. Yield after at most 3 ms
  // (checked every 32 texels), so a weak phone can draw and accept input between
  // slices. Only completed atlases upload; no geometry/material re-batching.
  const interiorJobs=[],workerJobs=new Map();let interiorTimer=0,interiorScheduled=false,interiorChannel=null,interiorSuspended=false,interiorWorker=null,workerWatch=0,workerFailed=false;
  const interiorWorkerUrl=typeof Worker==='function'&&document.currentScript?new URL('hs-light-worker.js',document.currentScript.src):null;
  if(interiorWorkerUrl)interiorWorkerUrl.search=new URL(document.currentScript.src).search;
  function releaseInteriorWorker(){
    if(workerWatch)clearTimeout(workerWatch);workerWatch=0;
    if(interiorWorker){interiorWorker.onmessage=interiorWorker.onerror=interiorWorker.onmessageerror=null;interiorWorker.terminate();interiorWorker=null}
  }
  function failInteriorWorker(reason){
    releaseInteriorWorker();workerFailed=true;
    for(const pending of workerJobs.values()){pending.stats.worker=false;pending.stats.fallback=reason;queueInterior(pending)}workerJobs.clear();
  }
  function watchInteriorWorker(){
    if(workerWatch)clearTimeout(workerWatch);
    workerWatch=setTimeout(()=>failInteriorWorker('timeout'),30000);
  }
  function workerInterior(job,payload){
    if(!interiorWorkerUrl||workerFailed){job.stats.fallback='unavailable';return false}
    try{
      if(!interiorWorker){
        const worker=interiorWorker=new Worker(interiorWorkerUrl);
        worker.onmessage=({data})=>{
          if(worker!==interiorWorker)return;const pending=workerJobs.get(data?.id);if(!pending)return;
          if(!ArrayBuffer.isView(data.light)||!ArrayBuffer.isView(data.ao)||data.light.length!==pending.bytes||data.ao.length!==pending.bytes||!ArrayBuffer.isView(data.packed)||!ArrayBuffer.isView(data.spill)||data.packed.length!==pending.bytes||data.spill.length!==pending.bytes/4){failInteriorWorker('message');return}
          workerJobs.delete(data.id);pending.stats.weightsMs=data.weightsMs;pending.stats.maxSliceMs=data.maxSliceMs;pending.complete(data);
          if(workerJobs.size)watchInteriorWorker();else releaseInteriorWorker();
        };
        worker.onerror=event=>{event.preventDefault();if(worker===interiorWorker)failInteriorWorker('error')};
        worker.onmessageerror=()=>{if(worker===interiorWorker)failInteriorWorker('message')};
      }
      workerJobs.set(payload.id,job);interiorWorker.postMessage(payload);watchInteriorWorker();return true;
    }catch(e){workerJobs.delete(payload.id);failInteriorWorker('start');job.stats.fallback='start';return false}
  }
  function closeInteriorChannel(){
    if(interiorChannel){interiorChannel.port1.onmessage=null;interiorChannel.port1.close();interiorChannel.port2.close();interiorChannel=null}
    if(interiorTimer)clearTimeout(interiorTimer);interiorTimer=0;interiorScheduled=false;
  }
  function scheduleInterior(){
    if(interiorSuspended||interiorScheduled||!interiorJobs.length)return;interiorScheduled=true;
    // Posted tasks yield to input/painting without a timer's background clamp.
    if(typeof MessageChannel==='function'){
      if(!interiorChannel){const channel=interiorChannel=new MessageChannel();channel.port1.onmessage=()=>{if(channel===interiorChannel)runInterior()}}
      interiorChannel.port2.postMessage(0);
    }else interiorTimer=setTimeout(runInterior,0);
  }
  function queueInterior(job){interiorJobs.push(job);scheduleInterior()}
  function runInterior(){
    interiorTimer=0;interiorScheduled=false;if(interiorSuspended)return;const start=performance.now(),worked=new Set();
    while(interiorJobs.length){const job=interiorJobs[0],t=performance.now();worked.add(job);const done=job.step();job.stats.weightsMs+=performance.now()-t;if(done)interiorJobs.shift();if(performance.now()-start>=3)break}
    const slice=performance.now()-start;for(const job of worked)job.stats.maxSliceMs=Math.max(job.stats.maxSliceMs,slice);
    if(interiorJobs.length)scheduleInterior();else closeInteriorChannel();
  }
  if(typeof addEventListener==='function'){
    addEventListener('pagehide',()=>{interiorSuspended=true;closeInteriorChannel();releaseInteriorWorker();for(const job of workerJobs.values()){job.stats.worker=false;job.stats.fallback='pagehide';interiorJobs.push(job)}workerJobs.clear()});
    addEventListener('pageshow',()=>{interiorSuspended=false;scheduleInterior()});
  }
  function bakeInterior(r) {
    const started=performance.now();
    const layouts = {
      bedroom: [-280,240,-56,250,-185,73], landing:[250,410,130,700,-185,73],
      hall:[205,410,60,700,95,353], cupboard:[331,409,251,570.625,95,353],
      lounge:[-280,195,305,700,95,353], kitchen:[-280,195,-176,295,95,353]
    }, bounds=layouts[r.id];
    if(!bounds||r.lightBake)return;
    const shellMaps=new Set(Object.entries(TEX).filter(([k])=>/^(?:art:)?(wallBlue|artex|carpetBlue|carpetBeige|carpetRed|lino|wallKitchen|wallpaperHall|wallpaperLounge)$/.test(k)||k==='hs.cupboard.plaster').map(([,t])=>t));
    const charts=[],byPlane=new Map(),receivers=[];
    const pos=new T.Vector3(),normal=new T.Vector3(),nm=new T.Matrix3();
    for(const mesh of r.group.children){
      if(!mesh.isMesh||!mesh.material?.isMeshPhongMaterial||!shellMaps.has(mesh.material.map)||mesh.material.transparent)continue;
      const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,verts=[];
      nm.getNormalMatrix(mesh.matrix);let previous=null,prevX=NaN,prevY=NaN,prevZ=NaN,prevDist=NaN;
      for(let i=0;i<p.count;i++){
        pos.fromBufferAttribute(p,i).applyMatrix4(mesh.matrix);normal.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();for(const k of ['x','y','z'])if(Math.abs(normal[k])<.0001)normal[k]=0;
        const ax=Math.abs(normal.x),ay=Math.abs(normal.y),az=Math.abs(normal.z),axis=ax>ay&&ax>az?0:ay>az?1:2;
        const u=axis===0?pos.z:pos.x,v=axis===1?pos.z:pos.y,dist=normal.dot(pos);
        const plane=Math.round(dist*10);let c=previous;
        if(normal.x!==prevX||normal.y!==prevY||normal.z!==prevZ||plane!==prevDist){const key=normal.toArray().map(v=>v.toFixed(3)).join(',')+':'+plane;c=byPlane.get(key);if(!c){c={index:charts.length,axis,n:normal.clone(),dist,u0:u,u1:u,v0:v,v1:v};byPlane.set(key,c);charts.push(c)}previous=c;prevX=normal.x;prevY=normal.y;prevZ=normal.z;prevDist=plane}
        c.u0=Math.min(c.u0,u);c.u1=Math.max(c.u1,u);c.v0=Math.min(c.v0,v);c.v1=Math.max(c.v1,v);verts.push({c,u,v});
      }
      receivers.push({mesh,verts});
    }
    if(!receivers.length)return;
    // Five centimetres per light texel, with two clamped gutter texels. Thin
    // risers and panel edges get small charts instead of wasting wall-sized tiles.
    const pad=2,pow2=v=>2**Math.ceil(Math.log2(Math.max(1,v)));
    for(const c of charts){c.w=Math.max(2,Math.ceil((c.u1-c.u0)/5)+1)+pad*2;c.h=Math.max(2,Math.ceil((c.v1-c.v0)/5)+1)+pad*2}
    const w=pow2(Math.max(...charts.map(c=>c.w),Math.sqrt(charts.reduce((a,c)=>a+c.w*c.h,0)*1.15)));
    let packX=0,packY=0,rowH=0;
    for(const c of charts.slice().sort((a,b)=>b.h-a.h)){if(packX+c.w>w){packX=0;packY+=rowH;rowH=0}c.x=packX;c.y=packY;packX+=c.w;rowH=Math.max(rowH,c.h)}
    const h=pow2(packY+rowH);
    const lightData=new Uint8Array(w*h*4),aoData=new Uint8Array(w*h);
    // AO is greyscale: one lossless channel avoids fetching four identical
    // bytes per texel. Phong reads only .r on WebGL 1 and 2.
    const aoFormat=window.House?.ren?.capabilities?.isWebGL2?T.RedFormat:T.LuminanceFormat;
    // Neutral occlusion during loading: the existing lamp rig and hemisphere
    // keep the room readable while the static weights finish in the background.
    aoData.fill(255);
    const texture=(data,format=T.RGBAFormat)=>{const t=new T.DataTexture(data,w,h,format);t.minFilter=t.magFilter=T.LinearFilter;t.generateMipmaps=false;t.flipY=false;t.needsUpdate=true;return t};
    // Retain the original CPU atlases for deterministic worker/fallback proof.
    // Only these two packed textures are bound to materials and uploaded.
    const packedData=new Uint8Array(lightData.length),spillData=new Uint8Array(aoData.length);
    for(let i=3;i<packedData.length;i+=4)packedData[i]=255;
    const light=texture(lightData),ao=texture(aoData,aoFormat),gpuLight=texture(packedData),gpuSpill=texture(spillData,aoFormat),clones=new Map();
    for(const {mesh,verts} of receivers){
      const uv=new Float32Array(verts.length*2);
      verts.forEach(({c,u,v},i)=>{uv[i*2]=(c.x+pad+.5+(u-c.u0)/Math.max(.01,c.u1-c.u0)*(c.w-pad*2-1))/w;uv[i*2+1]=(c.y+pad+.5+(v-c.v0)/Math.max(.01,c.v1-c.v0)*(c.h-pad*2-1))/h});
      mesh.geometry.setAttribute('uv2',new T.Float32BufferAttribute(uv,2));
      let m=clones.get(mesh.material);if(!m){m=mesh.material.clone();m.userData.interiorRoom=r.id;m.userData.interiorShell=true;m.lightMap=gpuLight;m.lightMapIntensity=1;m.aoMap=gpuSpill;m.aoMapIntensity=r.id==='cupboard'?.5:1;m.shininess=1;m.specular.set('#000');m.needsUpdate=true;clones.set(mesh.material,m)}mesh.material=m;
    }
    const chartMs=performance.now()-started;
    const [x0,x1,z0,z1,cy,fy]=bounds, H=window.House;
    const windows = r.id==='bedroom' ? H.REAR.bedroomWindows.map(a=>({axis:2,at:-56,u0:a.x0+5,u1:a.x1-5,y0:a.y0+5,y1:a.y1-5,sign:1})) : {
      landing:[{axis:0,at:410,u0:400,u1:480,y0:-80,y1:60,sign:-1}],
      hall:[{axis:2,at:700,u0:279,u1:321,y0:167,y1:245,sign:-1}],
      lounge:[{axis:2,at:700,u0:-164,u1:44,y0:156,y1:294,sign:-1}],
      kitchen:[{axis:2,at:-176,u0:-154,u1:-46,y0:149,y1:247,sign:1},{axis:0,at:195,u0:-154,u1:-86,y0:149,y1:229,sign:-1}]
    }[r.id]||[];
    const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
    const sources={
      bedroom:[[-20,-140,90],[window.Room?.lampSource?.x??-52.65,window.Room?.lampSource?.y??-33.65,window.Room?.lampSource?.z??-30]],
      landing:[[300,-150,400]],hall:[[300,130,200],[300,130,560]],
      cupboard:[[370,205,320],[368,258,386]],lounge:[[-60,125,500],[176,193,324]],kitchen:[[-60,105,120]]
    }[r.id];
    const main=r.id==='hall'||r.id==='cupboard'?sources:[sources[0]],accent=r.id==='bedroom'||r.id==='lounge'?[sources[1]]:[];
    const spills={hall:[['lounge','lounge',195,243,520],['kitchen','kitchen',195,243,190]],landing:[['bedroom','bedroom',250,-35,190],['hall',null,300,130,560]],bedroom:[['landing','bedroom',250,-35,190]],lounge:[['hall','lounge',195,243,520]],kitchen:[['hall','kitchen',195,243,190]],cupboard:[['hall','cupboard',331,243,315]]}[r.id]||[];
    const footprints=[];
    // Read the actual existing, fixed furniture shadow geometry. Movable props'
    // nested cards are left alone: carrying a chair must never leave a baked stain.
    for(const mesh of r.group.children){
      if(!mesh.userData.contactShadow||!mesh.geometry?.attributes.position)continue;
      const p=mesh.geometry.attributes.position,step=mesh.material.map===TEX.sqblob2?54:252;
      if(p.count%step)continue;
      for(let start=0;start<p.count;start+=step){
        let ax=Infinity,bx=-Infinity,az=Infinity,bz=-Infinity,ay=Infinity,by=-Infinity;
        for(let i=start;i<start+step;i++){pos.fromBufferAttribute(p,i).applyMatrix4(mesh.matrix);ax=Math.min(ax,pos.x);bx=Math.max(bx,pos.x);az=Math.min(az,pos.z);bz=Math.max(bz,pos.z);ay=Math.min(ay,pos.y);by=Math.max(by,pos.y)}
        if(Math.abs((ay+by)/2-fy)<1&&bx-ax>35&&bz-az>28){const inset=Math.min(9,(bx-ax)*.12,(bz-az)*.12);footprints.push([ax+inset,bx-inset,az+inset,bz-inset])}
      }
    }
    const lampWeight=(points,px,py,pz,n)=>{let a=0;for(const p of points){const dx=p[0]-px,dy=p[1]-py,dz=p[2]-pz,d2=dx*dx+dy*dy+dz*dz;if(d2>=220900)continue;const d=Math.sqrt(d2),cos=Math.max(0,(dx*n.x+dy*n.y+dz*n.z)/Math.max(1,d));a+=1/(1+d2/12100)*(.12+.88*cos)*(1-smooth(270,470,d))}return Math.min(1,a)};
    const spillPoints=spills.map(s=>[[s[2],s[3],s[4]]]),bluePoints=accent.length?accent:spillPoints[0]||[],alphaPoints=accent.length?spillPoints[0]||[]:spillPoints[1]||[];
    // Static RGBA channels: window bounce, ceiling pool, accent/door pool,
    // second doorway. Time and switches change uniforms, never these texels.
    function* weights(){let pixels=0;
    // A first GPU upload may happen between slices. Keep unfinished weights
    // separate from the neutral textures until the entire room is complete.
    const lightData=new Uint8Array(w*h*4),aoData=new Uint8Array(w*h*4),packed=new Uint8Array(w*h*4),spill=new Uint8Array(w*h);aoData.fill(255);for(let i=3;i<packed.length;i+=4)packed[i]=255;
    for(const c of charts)for(let y=0;y<c.h;y++)for(let x=0;x<c.w;x++){
      const u=c.u0+(c.u1-c.u0)*Math.max(0,Math.min(1,(x-pad)/(c.w-pad*2-1))),v=c.v0+(c.v1-c.v0)*Math.max(0,Math.min(1,(y-pad)/(c.h-pad*2-1)));
      if(c.axis===0)pos.set((c.dist-c.n.y*v-c.n.z*u)/c.n.x,v,u);else if(c.axis===1)pos.set(u,(c.dist-c.n.x*u-c.n.z*v)/c.n.y,v);else pos.set(u,v,(c.dist-c.n.x*u-c.n.y*v)/c.n.z);
      const px=pos.x,py=pos.y,pz=pos.z,stairFloor=r.id==='landing'&&px>=328&&pz>=250&&pz<=600?fy+(pz-250)*.8:fy,dx=Math.max(0,Math.min(px-x0,x1-px)),dz=Math.max(0,Math.min(pz-z0,z1-pz)),dy=Math.max(0,Math.min(py-(ceiling?ceiling[0]+ceiling[1]*px+ceiling[2]*pz:cy),stairFloor-py));
      const edge=c.axis===1?Math.min(dx,dz):Math.min(c.axis===0?dz:dx,dy);
      let shade=(.58+.42*smooth(0,72,edge))*(.72+.28*smooth(0,12,edge));
      // Each tread has its own dark riser junction, not one flat stair wash.
      if(r.id==='landing'&&py>fy+4&&c.axis===1&&c.v1-c.v0<45)shade*=.72+.28*smooth(0,16,pz-c.v0);
      const contactHeight=1-smooth(0,c.axis===1?8:95,Math.abs(fy-py));
      if(contactHeight>0)for(const b of footprints){const fx=Math.max(b[0]-px,0,px-b[1]),fz=Math.max(b[2]-pz,0,pz-b[3]),d2=fx*fx+fz*fz;if(d2<484)shade*=1-.58*(1-smooth(0,22,Math.sqrt(d2)))*contactHeight}
      const i=((c.y+y)*w+c.x+x)*4,dither=(((i/4*13)%17)/16-.5)*.8;
      aoData[i]=aoData[i+1]=aoData[i+2]=Math.round(Math.max(.14,shade)*255);aoData[i+3]=255;
      let sky=0;for(const a of windows){const lx=(a.axis===0?a.at:(a.u0+a.u1)/2)-px,lz=(a.axis===2?a.at:(a.u0+a.u1)/2)-pz,ly=(a.y0+a.y1)/2-py,d2=lx*lx+ly*ly+lz*lz,d=Math.sqrt(d2),cos=Math.max(0,(lx*c.n.x+ly*c.n.y+lz*c.n.z)/Math.max(1,d));sky+=1/(1+d2/24025)*(.23+.77*cos)}
      lightData[i]=Math.min(255,Math.round(sky*255+dither));lightData[i+1]=Math.round(lampWeight(main,px,py,pz,c.n)*255);
      lightData[i+2]=Math.round(lampWeight(bluePoints,px,py,pz,c.n)*(accent.length?1:.8)*255);
      lightData[i+3]=Math.round(lampWeight(alphaPoints,px,py,pz,c.n)*.8*255);
      packed[i]=lightData[i];packed[i+1]=lightData[i+1];packed[i+2]=lightData[i+2];packed[i+3]=aoData[i];spill[i/4]=lightData[i+3];
      if(++pixels%32===0)yield;
    }
    return {light:lightData,ao:aoData,packed,spill};
    }
    const uniforms=interiorUniforms();
    const stats={buildMs:0,chartMs,weightsMs:0,maxSliceMs:0,elapsedMs:0,ready:false,updateMs:0,maxUpdateMs:0,updates:0,staticAtlases:2,footprints:footprints.length};
    const state={uniforms};INTERIOR_BAKES.set(r.id,state);
    // Room render passes bind these uniforms once for the whole room. Furniture
    // keeps its original materials, controllers and static batching classes.
    let lastUpdate='';
    function update(){
      const t=performance.now(),date=window.OwnerTools?.now?.()||new Date(),hour=date.getHours()+date.getMinutes()/60,sun=window.Season?.sun?.()||{rise:7,set:18};
      const ph=document.getElementById('bootPower')?.classList,night=ph?.contains('rm-night'),dawn=ph?.contains('rm-dawn'),dusk=ph?.contains('rm-dusk');
      const daylight=night?.018:dawn?.32:dusk?.3:1,lamps=(typeof r.lights==='function'?r.lights():r.lights)||[];
      const key=hour+'|'+sun.rise+','+sun.set+'|'+daylight+'|'+lamps.map(l=>l.i).join(',')+'|'+spills.map(s=>[H.DOORS[s[1]]?.ang,typeof H.ROOMS[s[0]]?.lights==='function'?H.ROOMS[s[0]].lights().map(l=>l.i).join(','):'']).join(';');if(key===lastUpdate)return;lastUpdate=key;
      uniforms.houseSky.value.set(dusk?'#ffb56d':dawn?'#c5dbff':'#c4d9ff').multiplyScalar(daylight*.72);
      const match=points=>{let a=0;for(const p of points){const l=lamps.find(l=>Math.hypot(l.x-p[0],l.y-p[1],l.z-p[2])<6);if(l)a=Math.max(a,l.i||0)}return a};
      uniforms.houseMain.value.set('#ffd39a').multiplyScalar(match(main)*(r.id==='cupboard'?.28:1.6));
      const spillColour=(s,c)=>{c.set('#ffce96');if(!s){c.multiplyScalar(0);return}const door=s[1]?H.DOORS[s[1]]:null,open=door?Math.max(0,door.ang||0):1,other=H.ROOMS[s[0]],ls=(typeof other?.lights==='function'?other.lights():other?.lights)||[],warm=ls.some(l=>l.i>.4&&new T.Color(l.c||'#fff').r>new T.Color(l.c||'#fff').b);c.multiplyScalar(open*(warm?.62:daylight*.28))};
      if(accent.length)uniforms.houseAccent.value.set('#ffbe72').multiplyScalar(match(accent)*(r.id==='bedroom'?.65:2.1));else spillColour(spills[0],uniforms.houseAccent.value);
      spillColour(accent.length?spills[0]:spills[1],uniforms.houseSpill.value);
      const progress=Math.max(0,Math.min(1,(hour-sun.rise)/(sun.set-sun.rise))),drift=(progress-.5)*1.05,alt=.48+.62*Math.sin(progress*Math.PI),a0=windows[0],dir=uniforms.houseSunDir.value;
      if(a0?.axis===0)dir.set(a0.sign,alt,drift);else dir.set(drift,alt,a0?.sign||1);dir.normalize();
      const sunAmount=night?0:(dawn||dusk?.45:1)*Math.max(.1,Math.sin(progress*Math.PI));
      uniforms.houseSun.value.set(dusk?'#ffb15b':dawn?'#e5edff':'#ffe0a3').multiplyScalar(sunAmount*1.15);
      for(let i=0;i<2;i++){
        const a=windows[i];if(!a){uniforms.houseAperture.value[i].set(1,0,1,0);continue}
        const ds=a.axis===0?dir.x:dir.z;if(ds*a.sign<=.03){uniforms.houseAperture.value[i].set(1,0,1,0);continue}
        if(a.axis===0){uniforms.houseU.value[i].set(-dir.z/ds,0,1,dir.z/ds*a.at);uniforms.houseV.value[i].set(-dir.y/ds,1,0,dir.y/ds*a.at)}else{uniforms.houseU.value[i].set(1,0,-dir.x/ds,dir.x/ds*a.at);uniforms.houseV.value[i].set(0,1,-dir.y/ds,dir.y/ds*a.at)}
        uniforms.houseAperture.value[i].set(a.u0,a.u1,a.y0,a.y1);uniforms.housePlane.value[i].set(a.axis===0?a.sign:0,0,a.axis===2?a.sign:0,-a.at*a.sign);
      }
      // Matrix setters cache equal elements in r128; pure vector-array setters
      // upload on every material. These columns are the same aperture data.
      for(let i=0;i<2;i++){const m=uniforms[i?'houseProjector1':'houseProjector0'].value.elements,columns=[uniforms.houseU.value[i],uniforms.houseV.value[i],uniforms.houseAperture.value[i],uniforms.housePlane.value[i]];for(let c=0;c<4;c++){const v=columns[c],o=c*4;m[o]=v.x;m[o+1]=v.y;m[o+2]=v.z;m[o+3]=v.w}}
      stats.updateMs=performance.now()-t;stats.maxUpdateMs=Math.max(stats.maxUpdateMs,stats.updateMs);stats.updates++;
    }
    r.lightBake={update,charts:charts.length,width:w,height:h,light,ao,gpuLight,gpuSpill,stats};update();stats.buildMs=performance.now()-started;
    const work=weights(),job={stats,bytes:lightData.length,complete(data){
      const publishStart=performance.now();
      if(data){lightData.set(data.light);packedData.set(data.packed);spillData.set(data.spill);for(let i=0;i<aoData.length;i++)aoData[i]=data.ao[i*4]}
      light.needsUpdate=true;ao.needsUpdate=true;gpuLight.needsUpdate=true;gpuSpill.needsUpdate=true;stats.publishMs=performance.now()-publishStart;stats.ready=true;stats.elapsedMs=performance.now()-started;H.dirty();
    },step(){const result=work.next();if(!result.done)return false;this.complete(result.value);return true}};
    const ceiling=r.ceilingAt?[r.ceilingAt(0,0),r.ceilingAt(1,0)-r.ceilingAt(0,0),r.ceilingAt(0,1)-r.ceilingAt(0,0)]:null;
    stats.worker=workerInterior(job,{id:r.id,charts:charts.map(c=>({...c,n:c.n.toArray()})),w,h,bounds,windows,main,bluePoints,alphaPoints,accent:!!accent.length,footprints,ceiling});
    if(!stats.worker)queueInterior(job);stats.buildMs=performance.now()-started;
  }

  // ================================================================ materials (cached by their spec)
  const MATS = {}, PRINTS = new Set();
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
      // printed art (posters, prints, notices): its own picture as a dim emissive "bounce" fill, scaled per room by
      // hs-world.js (K.PRINTS) from the room's ambient and lamps, so paper reads clearly without glowing in the dark
      if (spec.pr && spec.map) { P.emissiveMap = spec.map; P.emissive = new T.Color('#ffffff'); P.emissiveIntensity = 0; P.specular = new T.Color('#000000'); P.shininess = 2; }
      m = new T.MeshPhongMaterial(P);m.userData.houseSurface=true;m.clone=cloneSurface;
    }
    if (spec.dw === false) m.depthWrite = false;
    if (spec.po) { m.polygonOffset = true; m.polygonOffsetFactor = spec.po; m.polygonOffsetUnits = spec.po; }
    m.userData.spec = spec;surfaceQuality(m);
    if (spec.pr && spec.map && m.isMeshPhongMaterial) { m.userData.print = true; PRINTS.add(m); }
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
    let slab;
    if(o.glazing){
      const g=o.glazing,shape=new T.Shape(),hole=new T.Path();
      shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w/2,h/2);shape.lineTo(-w/2,h/2);shape.closePath();
      hole.moveTo(-g.w/2,g.y-g.h/2);hole.lineTo(-g.w/2,g.y+g.h/2);hole.lineTo(g.w/2,g.y+g.h/2);hole.lineTo(g.w/2,g.y-g.h/2);hole.closePath();shape.holes.push(hole);
      const geo=new T.ExtrudeGeometry(shape,{depth:o.t,steps:1,bevelEnabled:false,curveSegments:1});geo.translate(0,0,-t2);
      slab=into(pv).at(o.cx,o.cy,o.cz,along?0:90).geo(geo,0,0,0,o.leaf);
    }else slab = into(pv).box(o.cx, o.cy, o.cz, along ? w : o.t, h, along ? o.t : w, o.leaf);
    // Contact anchors on the actual lever, in this leaf's hinge frame. Metadata
    // only: the same original solid geometry and draw batches are retained.
    pv.userData.handles = [-1, 1].map(side => along
      ? [o.handleA + (o.leverDir || -1) * 3.6, o.handleY, o.cz + side * (t2 + 2.15)]
      : [o.cx + side * (t2 + 2.15), o.handleY, o.handleA + (o.leverDir || -1) * 3.6]);
    const batch = new Batch(), B = into(batch).at(o.cx, o.cy, o.cz, along ? 0 : 90);
    const U = a => along ? a - o.cx : o.cz - a, dir = d => along ? d : -d;
    const panels = o.glass ? [[-0.17, 0.2], [0.17, 0.2]] : [[-0.17, -0.25], [0.17, -0.25], [-0.17, 0.2], [0.17, 0.2]];
    const ph = (h - 1) * 0.38, pw = w * 0.34, mw = 1.5, mt = 0.7;
    if(o.glazing){
      const g=o.glazing;
      // Real edge thickness, one shared glass material, and a bead on each face.
      B.box(0,g.y,0,g.w,g.h,.65,g.material);
      for(const s of [-1,1]){
        const z=s*(t2+.4),bead=o.mould;
        for(const x of [-1,1])B.rbox(x*(g.w/2+.5),g.y,z,1.4,g.h+2.4,1,.25,bead);
        for(const y of [-1,1])B.rbox(0,g.y+y*(g.h/2+.5),z,g.w,1.4,1,.25,bead);
      }
    }
    const vfxLevers=[];
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
      const first=(batch.parts.get(o.brass)?.pos.length||0)/3;
      B.rbox(hu + lu * 3.6, hy, s * (t2 + 2.15), 8.4, 1.4, 1.4, 0.5, o.brass);
      vfxLevers.push({first,count:batch.parts.get(o.brass).pos.length/3-first,x:along?o.handleA:o.cx,y:o.handleY,z:along?o.cz:o.handleA,along,dir:o.leverDir||-1});
      B.rbox(hu, hy + 5.5, s * (t2 + 0.15), 1.6, 3.2, 0.3, 0.1, o.brass);
    }
    if (o.hingeA != null) for (const fy of [0.12, 0.5, 0.88]) B.cyl(U(o.hingeA), -h / 2 + h * fy, (o.hingeSide || 1) * t2, 0.6, 0.6, 9, 10, o.hinge || o.brass);
    const built=batch.build(pv),brass=built.find(m=>m.material===o.brass);
    if(brass){const p=brass.geometry.attributes.position,n=brass.geometry.attributes.normal;pv.userData.vfxLevers={geometry:brass.geometry,ranges:vfxLevers,position:p.array.slice(),normal:n.array.slice()};}
    return slab;
  }
  // Unit contact-shadow pieces for code that places shadows itself (e.g. one instanced draw per room).
  // The geometry lies flat (normal up in the y-down world), centred, w x d with an m cm fade.
  function shadowGeo(sq, w, d, m) { const g = sq ? sliceGeo(w, d, shadowMargin(w, d, m)) : ringGeo(w, d, shadowMargin(w, d, m)); g.applyMatrix4(new T.Matrix4().makeRotationX(Math.PI / 2)); return g; }
  const shadowMaterial = (sq, a) => mat({ c: '#000', map: sq ? sqBlobTex() : ringTex(), basic: true, tr: true, o: Math.min(0.999, a == null ? 0.8 : a), dw: false, po: -2, cs: 1 });
  window.HouseKit = { interiorAdapt, interiorFor, bakeInterior, T, D2R, SURFACE_LIFT, restY, tex, mat, shadowMat, shadowGeo, shadowMaterial, doorLeaf, batch: () => new Batch(), Batch, into, xform, roundBox, thicken, rnd, speckle, PAINT, wrapText, svgTex, blobTex, setAniso, setQuality, liveCanvas, TEX, MATS, PRINTS };
})();

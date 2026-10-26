/* rm-3d: the 3D kit for the console games in Jack's room (three.js r128, already on the page). Loaded by rm-tv.js before a
 * game with `three: true`. K.three(o) gives:
 *   T (THREE), ren, scene, cam, look ('n64' | 'ps1' | 'dc')
 *   mat({ color, map, lit, emissive, side, transparent, opacity, vcol, flat })  a material in the console's style:
 *        ps1: wobbly snapped vertices, wonky (affine) textures, no texture smoothing
 *        n64: smooth blurry textures and thick fog;  dc: clean and bright
 *   tex(w, h, paint(g, w, h))  a canvas texture (filtered the console's way), tile(t, x, y) sets repeat
 *   fog(color, near, far), sky(color), lights({ amb, sun, dir:[x,y,z] })  quick setup (lights() returns {hemi, sun})
 *   box(w, h, d, m) / plane(w, h, m) / cyl(rt, rb, h, seg, m) / ball(r, seg, m) -> a mesh
 *   group() a THREE.Group added to the scene, add(obj) adds to the scene
 *   render()  draw the frame;  dispose() is automatic when the game ends
 * Everything is drawn from scratch: no models or textures are loaded. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV || TV.make3d) return;
  TV.make3d = function (K, o) {
    const T = window.THREE; if (!T) throw new Error('three.js is missing');
    const look = o.look === 'ps' ? 'ps1' : (o.look || 'n64');
    let ren;
    try { ren = new T.WebGLRenderer({ canvas: K.cv, antialias: o.antialias == null ? look === 'dc' : !!o.antialias, alpha: false, powerPreference: 'low-power' }); }
    catch (e) { throw new Error('no WebGL'); }
    ren.setPixelRatio(1); ren.setSize(K.W, K.H, false);
    ren.outputEncoding = T.LinearEncoding;
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(o.fov || 60, K.W / K.H, o.near || 0.1, o.far || 500);
    const mats = [], texs = [];
    const snap = new T.Vector2(K.W / 2, K.H / 2);
    function mat(p) {
      p = p || {};
      const P = { color: p.color != null ? p.color : 0xffffff, side: p.side || T.FrontSide, transparent: !!p.transparent, opacity: p.opacity == null ? 1 : p.opacity, vertexColors: !!p.vcol, fog: p.fog !== false };
      if (p.map) P.map = p.map;
      let m;
      if (p.lit === false) m = new T.MeshBasicMaterial(P);
      else { m = new T.MeshLambertMaterial(P); if (p.emissive != null) m.emissive = new T.Color(p.emissive); }
      if (p.flat && m.flatShading !== undefined) m.flatShading = true;
      if (look === 'ps1') {
        m.onBeforeCompile = sh => {
          sh.uniforms.uSnap = { value: snap };
          sh.vertexShader = 'uniform vec2 uSnap;\nvarying vec3 vAff;\n' + sh.vertexShader
            .replace('#include <project_vertex>', '#include <project_vertex>\n  gl_Position.xy = floor(gl_Position.xy / gl_Position.w * uSnap + 0.5) / uSnap * gl_Position.w;')
            .replace('#include <fog_vertex>', '#include <fog_vertex>\n#ifdef USE_MAP\n  vAff = vec3(vUv * gl_Position.w, gl_Position.w);\n#endif');
          sh.fragmentShader = 'varying vec3 vAff;\n' + sh.fragmentShader
            .replace('#include <map_fragment>', '#ifdef USE_MAP\n  vec4 texelColor = texture2D( map, vAff.xy / vAff.z );\n  texelColor = mapTexelToLinear( texelColor );\n  diffuseColor *= texelColor;\n#endif');
        };
        m.customProgramCacheKey = () => 'rmps1';
      }
      mats.push(m);
      return m;
    }
    function tex(w, h, paint) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); paint(g, w, h);
      const t = new T.CanvasTexture(c);
      if (look === 'ps1') { t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false; }
      else if (look === 'n64') { t.magFilter = T.LinearFilter; t.minFilter = T.LinearFilter; t.generateMipmaps = false; }
      else { t.magFilter = T.LinearFilter; t.minFilter = T.LinearMipmapLinearFilter; }
      t.wrapS = t.wrapT = T.RepeatWrapping;
      texs.push(t);
      return t;
    }
    const tile = (t, x, y) => { t.repeat.set(x, y == null ? x : y); return t; };
    function fog(color, near, far) { scene.fog = new T.Fog(color, near, far); sky(color); }
    function sky(color) { scene.background = new T.Color(color); }
    function lights(l) {
      l = l || {};
      const hemi = new T.HemisphereLight(l.skyCol || 0xffffff, l.groundCol || 0x404040, l.amb == null ? 0.75 : l.amb); scene.add(hemi);
      const sun = new T.DirectionalLight(l.sunCol || 0xffffff, l.sun == null ? 0.7 : l.sun); const d = l.dir || [0.5, 1, 0.3]; sun.position.set(d[0], d[1], d[2]); scene.add(sun);
      return { hemi, sun };
    }
    const geos = [];
    const keep = g => { geos.push(g); return g; };
    const kit = {
      T, ren, scene, cam, look, mat, tex, tile, fog, sky, lights,
      box: (w, h, d, m) => new T.Mesh(keep(new T.BoxGeometry(w, h, d)), m || mat()),
      plane: (w, h, m) => new T.Mesh(keep(new T.PlaneGeometry(w, h)), m || mat()),
      cyl: (rt, rb, h, seg, m) => new T.Mesh(keep(new T.CylinderGeometry(rt, rb, h, seg || 8)), m || mat()),
      ball: (r, seg, m) => new T.Mesh(keep(new T.SphereGeometry(r, seg || 8, Math.max(4, (seg || 8) * 0.75 | 0))), m || mat()),
      group() { const g = new T.Group(); scene.add(g); return g; },
      add(x) { scene.add(x); return x; },
      keep,
      render() { ren.render(scene, cam); },
      dispose() {
        scene.traverse(x => { if (x.geometry) x.geometry.dispose(); });
        for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); for (const t of texs) t.dispose();
        ren.dispose(); try { const ext = ren.getContext().getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (e) {}
      },
    };
    if (look === 'n64') fog(o.fogCol || 0x9ab8e8, o.fogNear || 30, o.fogFar || 140);
    else if (look === 'ps1') fog(o.fogCol || 0x000000, o.fogNear || 40, o.fogFar || 160);
    else fog(o.fogCol || 0xbfe0ff, o.fogNear || 120, o.fogFar || 420);
    return kit;
  };
})();

/* hs-world: THE HOUSE ENGINE. Jack's house is a real 3D place (WebGL, three.js r128) you walk round: his bedroom, the landing,
 * the stairs, the hall, the lounge, the kitchen and the cupboard under the stairs. The family PC on Jack's desk is still
 * boot.js's CSS 3D model (with the power button, the fly-in and the BIOS hand-over): it's drawn on top of the WebGL room and
 * the two cameras are kept exactly in step (in "hold" mode we drive boot.js's camera, in "follow" mode we copy it).
 *
 *   walking: W A S D / arrows (Shift to jog), mouse to look; F/I uses or looks closely, E/click picks up or places
 *   stations: the arrows at the sides jump to the good views of the room you're in
 *   holding: the real object rests in your hands; E/click places at a valid ghost, X drops, R/wheel turns, +/- moves
 *            nearer/further, Q/right click returns it; Esc opens the game menu
 *   the PC: press its power button (we sit down first); Q/F2 or the game menu stands up with the PC still running.
 *           F at the monitor sits back down; T locks the active screen in without restarting it
 * The content is built by js/rm-room.js (the bedroom: window.Room is the public API for other packs) and js/hs-house.js
 * (the rest of the house), with the kit in js/hs-kit.js. This file exports window.House (see the bottom). */
(function () {
  'use strict';
  const T = window.THREE, K = window.HouseKit;
  if(window.PCOnly?.desktopOnly){window.House={ok:false,live:false,dirty(){}};return;}
  const pb = document.getElementById('bootPower');
  if (!T || !K || !pb || window.House) return;
  const boot = document.getElementById('boot'), stage = pb.querySelector('.pc-stage'), cam = pb.querySelector('.pc-cam');
  const pbtn = pb.querySelector('.powerbtn'), html = document.documentElement;
  const BOOT = window.JHPBoot || 'room';
  const D2R = Math.PI / 180, PERSP = 115, GY = -24.55, GW = 30, GH = 22.5;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const angd = (a, b) => { let d = (b - a) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const EVS = {}; const emit = (ev, ...a) => (EVS[ev] || []).slice().forEach(fn => { try { fn(...a); } catch (e) { console.error(e); } });
  let controlsPaused=false,desktopFull=ls.get('jhp_hs_desktop_full',false)===true;

  // ================================================================ graphics: ONE look, the best one, on every device (owner, 2026-10-27; docs/GRAPHICS.md)
  // No options and no tiers: full-resolution mipmapped textures with anisotropy, Phong, the 5-lamp rig, MSAA and a sharp
  // drawing buffer (device pixels up to 2, 1.75 on handhelds). Speed comes from merging static geometry (js/hs-static.js),
  // culling and pacing. A device that still can't keep up is adapted INVISIBLY, one rung at a time (Q.adapt, ADAPT below):
  // draw distance, then per-pixel lamps, then screen refresh, then a small sharp resolution step (never below 0.85, and
  // only on dense displays where 0.85 is still more than one pixel per CSS pixel). Never the blurry low-resolution look.
  // Old per-device graphics settings (jhp_hs_gfx / jhp_hs_graphics) are dropped; the FPS counter survives as a hidden
  // debug option (localStorage jhp_hs_fps, or House.showFps(true)).
  const ADAPT = [
    { far: 0, lamps: 5, screenHz: 60, scale: 1 },     // 0: everything
    { far: 1, lamps: 5, screenHz: 30, scale: 1 },     // 1: shorter outdoor draw distance and portal depth, screens 30 Hz
    { far: 1, lamps: 3, screenHz: 30, scale: 1 },     // 2: the three strongest lamps light per pixel
    { far: 1, lamps: 3, screenHz: 20, scale: 1 },     // 3: screens 20 Hz
    { far: 1, lamps: 3, screenHz: 20, scale: .925 },  // 4: a small resolution step (dense displays only)
    { far: 1, lamps: 3, screenHz: 20, scale: .85 },   // 5: the floor
  ];
  const Q = (function () {
    const old = ls.get('jhp_hs_graphics', null);
    if (old && old.showFps === true && ls.get('jhp_hs_fps', null) == null) ls.set('jhp_hs_fps', true);
    ls.del('jhp_hs_gfx'); ls.del('jhp_hs_graphics'); // (retired settings: harmless to forget)
    const mob = !!window.PCOnly?.handheld;
    let gpu = '';
    try { const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); if (gl) { const d = gl.getExtension('WEBGL_debug_renderer_info'); gpu = d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : ''; gl.getExtension('WEBGL_lose_context')?.loseContext(); } } catch (e) {}
    // A software renderer is not a GPU: start it a few rungs down and without MSAA (tests run on one).
    const soft = /SwiftShader|llvmpipe|softpipe|Software/i.test(gpu);
    const saved = ls.get('jhp_hs_adapt', null), start = soft ? 3 : saved && saved.gpu === gpu && Number.isInteger(saved.level) ? Math.max(0, Math.min(ADAPT.length - 1, saved.level - 1)) : 0;
    return { tier: 'high', guess: 'high', auto: true, mob, soft, fps: 0, gpu, adapt: start, pinned: false, renderScale: 1, pixelRatio: 1, f: { n: 0, t: 0, low: 0 }, probe: 0 };
  })();
  const graphics = { showFps: ls.get('jhp_hs_fps', false) === true, backgroundFps: 10, decorations: false };
  const rung = () => ADAPT[Q.adapt] || ADAPT[0];
  const wantsAntialias = () => !Q.soft || ls.get('jhp_hs_msaa', false) === true; // (jhp_hs_msaa: benchmark MSAA on a software renderer)
  const wantedAniso = () => 8;
  window.HouseQ = Q.tier;
  // ================================================================ the renderer (a canvas under boot.js's stage, one over it)
  let cv = document.createElement('canvas'); cv.className = 'hs-gl'; cv.setAttribute('aria-hidden', 'true');
  let ren;
  try {
    ren = new T.WebGLRenderer({ canvas: cv, antialias: wantsAntialias(), powerPreference: 'high-performance', alpha: false });
    if (!ren.getContext()) throw new Error('no gl');
  } catch (e) { window.House = { ok: false }; return; }
  pb.insertBefore(cv, stage);
  try { if (!Q.gpu) { const gl = ren.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info'); Q.gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ''; } } catch (e) {}
  K.setQuality?.('high');Q.cap=Q.mob?60:120;Q.capMiss=0;
  let cv2 = document.createElement('canvas'); cv2.className = 'hs-gl2'; cv2.setAttribute('aria-hidden', 'true');
  // (a lost WebGL context, e.g. too many tabs: keep the page alive and redraw when it comes back)
  let ctxLost = false;
  function hookCtx(c) {
    c.addEventListener('webglcontextlost', ev => { ev.preventDefault(); if(c===cv||c===cv2)ctxLost = true; }, false);
    c.addEventListener('webglcontextrestored', () => { if(c!==cv&&c!==cv2)return;ctxLost = false; for (const k in K.MATS) K.MATS[k].needsUpdate = true; dirty(); }, false);
  }
  hookCtx(cv); hookCtx(cv2);
  function releaseGL(renderer){try{const gl=renderer?.getContext();if(gl&&!gl.isContextLost())gl.getExtension('WEBGL_lose_context')?.loseContext()}catch(e){}}
  // (the browser drops the oldest WebGL context when the PC's games have made too many: build a fresh renderer on a fresh canvas)
  function glLost() { try { return ctxLost || ren.getContext().isContextLost(); } catch (e) { return true; } }
  function rebuildGL() {
    try {
      const oldRenderer=ren, oc = cv, par = oc.parentNode, nc = document.createElement('canvas'); nc.className = oc.className; nc.setAttribute('aria-hidden', 'true');
      try { ren.dispose(); } catch (e) {}
      const nr = new T.WebGLRenderer({ canvas: nc, antialias: wantsAntialias(), powerPreference: 'high-performance', alpha: false });
      if (!nr.getContext() || nr.getContext().isContextLost()) return false;
      nr.setClearColor(0x050404, 1); nr.localClippingEnabled = true;
      if (par) par.replaceChild(nc, oc);
      cv = nc; ren = nr; hookCtx(nc); ctxLost = false;
      releaseGL(oldRenderer);
      if (window.House) window.House.ren = nr;
      if (ren2 || cv2.parentNode) { const oldForeground=ren2;try { oldForeground?.dispose(); } catch (e) {} const o2 = cv2, p2 = o2.parentNode; cv2 = document.createElement('canvas'); cv2.className = o2.className; cv2.setAttribute('aria-hidden', 'true'); hookCtx(cv2); if (p2) p2.removeChild(o2); ren2 = null;releaseGL(oldForeground); }
      K.setAniso(Math.min(wantedAniso(),ren.capabilities.getMaxAnisotropy()),true);
      scene.traverse(o => { const ms = o.material ? [].concat(o.material) : []; for (const m of ms) { m.needsUpdate = true; for (const k in m) { const t = m[k]; if (t && t.isTexture) t.needsUpdate = true; } } });
      for (const k in K.MATS) K.MATS[k].needsUpdate = true;
      measure(); dirty(); return true;
    } catch (e) { console.error(e); return false; }
  }
  var ren2 = null; // (made the first time something has to be drawn in front of the PC)
  K.setAniso(Math.min(wantedAniso(),ren.capabilities.getMaxAnisotropy()));
  ren.setClearColor(0x050404, 1);
  ren.localClippingEnabled = true;
  const scene = new T.Scene();
  const root = new T.Group(); root.scale.set(1, -1, 1); scene.add(root); // y is down in here (see hs-kit.js)
  // Two centimetres preserves depth precision while keeping the entire near
  // rectangle comfortably inside the player's 22 cm collision clearance.
  const camera = new T.PerspectiveCamera(45, 1, 2, 4000); camera.matrixAutoUpdate = false; camera.layers.set(0);
  // the lights: a fixed rig (a constant number of lights means no shader rebuilds), moved to suit the rooms on show
  const hemi = new T.HemisphereLight(0x8a90a8, 0x30261c, 0.55); scene.add(hemi); hemi.layers.enableAll();
  const sun = new T.DirectionalLight(0xffffff, 0); root.add(sun); root.add(sun.target); sun.layers.enableAll();
  const PL = Array.from({ length: 5 }, () => { const l = new T.PointLight(0xffffff, 0, 400, 2); root.add(l); l.layers.enableAll(); return l; });

  // ================================================================ the camera: one pose drives both WebGL and boot.js's CSS camera
  // pose: E (eye, cm), ry (yaw: + turns right), rx (pitch: - looks down), the CSS conventions boot.js uses
  const P = { x: 0, y: -50, z: 100, ry: -30, rx: -16, zm: 1 };
  let em = 10, vw = innerWidth, vh = innerHeight;
  const outdoorFog=new T.Fog(0xcedadf,1600,3000);
  function qualityView(){
    const fog=rung().far&&cur?.outside?outdoorFog:null,far=fog?fog.far:4000;
    scene.fog=fog;
    if(fog){const ph=window.HouseEnvironment?.phase;fog.color.set(ph==='night'?0x26344b:ph==='dusk'?0xd89774:ph==='dawn'?0xddb69a:0xcedadf)}
    if(camera.far!==far){camera.far=far;camera.updateProjectionMatrix()}
  }
  const S = new T.Matrix4().makeScale(1, -1, 1), _R = new T.Matrix4(), _M = new T.Matrix4(), _Rx = new T.Matrix4(), _Ry = new T.Matrix4();
  function measure() {
    vw = pb.clientWidth || innerWidth; vh = pb.clientHeight || innerHeight;
    em = parseFloat(getComputedStyle(stage).fontSize) || 10;
    // Sharp everywhere: device pixels up to 2 (1.75 on handhelds). The adaptive resolution step only exists on dense
    // displays (native >= 1.5), where even the 0.85 floor stays above one drawn pixel per CSS pixel.
    const native=Math.min(window.devicePixelRatio||1,Q.mob?1.75:2);
    Q.renderScale=native>=1.5?rung().scale:1;
    const pr=native*Q.renderScale;Q.pixelRatio=pr;
    // Resizing a canvas clears it. Only resize when the size really changed, and redraw at once when it did, so a
    // resolution step (dynamic resolution, a new front layer) never shows one black frame.
    const sized=ren.getPixelRatio()===pr&&cv.width===Math.floor(vw*pr)&&cv.height===Math.floor(vh*pr);
    if(!sized){ren.setPixelRatio(pr); ren.setSize(vw, vh, false);}
    // Held paper and live screen DOM stay sharp when the room scales down.
    if (ren2) { ren2.setPixelRatio(native); ren2.setSize(vw, vh, false); }
    camera.aspect = vw / vh; const wz0 = WZ; WZ = walkZoom(); if (Math.abs(P.zm - wz0) < 1e-6) P.zm = WZ; lensZm = 0; applyLens();
    dirty();
    if (!sized) try { if (live && !rendering && mode !== 'off') render(); } catch (e) { if (!(e instanceof ReferenceError)) console.error(e); }
  }
  let rendering = false;
  // the lens: P.zm 1 is the PC's lens (boot.js's CSS stage, perspective PERSP em: about 41 degrees vertical), used at the
  // desk and for the fly-in. Walking uses a wider lens, WZ: about 60 degrees vertical in landscape, at least 50 degrees
  // across in portrait (so a phone held upright still sees a room, not a slot), never wider than 95 degrees across.
  // Close-ups ease to their own longer lens on the camera-move curve. The CSS stage follows P.zm (cssCam).
  let lensZm = 0, WZ = 1;
  function walkZoom() { const f = Math.max(vw / 2 / Math.tan(47.5 * D2R), Math.min(vh / 2 / Math.tan(30 * D2R), vw / 2 / Math.tan(25 * D2R))); return f / (PERSP * em); }
  const lensFov = zm => 2 * Math.atan(vh / 2 / (PERSP * em * (zm || 1))) / D2R;
  function applyLens() { const z = P.zm || 1; if (z === lensZm) return; lensZm = z; camera.fov = lensFov(z); camera.updateProjectionMatrix(); }
  function rot(rx, ry) { return _R.copy(_Rx.makeRotationX(rx * D2R)).multiply(_Ry.makeRotationY(ry * D2R)); } // CSS rotateX(rx) rotateY(ry)
  function glCam(x, y, z, rx, ry) {
    const R = rot(rx, ry).transpose();
    _M.makeTranslation(x, y, z).multiply(R);
    camera.matrix.copy(S).multiply(_M).multiply(S);
    camera.updateMatrixWorld(true);
  }
  const f3 = n => (+n).toFixed(3);
  const cssPose={x:NaN,y:NaN,z:NaN,rx:NaN,ry:NaN,d:'',transform:''};
  function cssCam() {
    const d=f3(PERSP*(P.zm||1));if(cssPose.d!==d){cssPose.d=d;stage.style.perspective=d==='115.000'?'':d+'em';cssPose.x=NaN}
    if(cssPose.x===P.x&&cssPose.y===P.y&&cssPose.z===P.z&&cssPose.rx===P.rx&&cssPose.ry===P.ry&&cam.style.transform===cssPose.transform)return;
    cssPose.x=P.x;cssPose.y=P.y;cssPose.z=P.z;cssPose.rx=P.rx;cssPose.ry=P.ry;
    cssPose.transform=`translate3d(0em,0em,${d}em) rotateX(${f3(P.rx)}deg) rotateY(${f3(P.ry)}deg) translate3d(${f3(-P.x)}em,${f3(-P.y)}em,${f3(-P.z)}em)`;cam.style.transform=cssPose.transform;
  }
  // view-space z of a world point (negative = in front of the camera)
  function viewZ(x, y, z) { const a = P.ry * D2R, b = P.rx * D2R, dx = x - P.x, dy = y - P.y, dz = z - P.z; const z1 = -dx * Math.sin(a) + dz * Math.cos(a); return dy * Math.sin(b) + z1 * Math.cos(b); }
  // a world point to screen pixels (null when it's behind you)
  function toScreen(x, y, z, out) {
    const a = P.ry * D2R, b = P.rx * D2R, dx = x - P.x, dy = y - P.y, dz = z - P.z;
    const x1 = dx * Math.cos(a) + dz * Math.sin(a), z1 = -dx * Math.sin(a) + dz * Math.cos(a);
    const y2 = dy * Math.cos(b) - z1 * Math.sin(b), z2 = dy * Math.sin(b) + z1 * Math.cos(b);
    if (z2 > -1) return null;
    const k = PERSP * em * (P.zm || 1) / -z2,p=out||{};p.x=vw/2+x1*k;p.y=vh/2+y2*k;p.d=-z2;return p;
  }
  const fwd = () => { const a = P.ry * D2R, b = P.rx * D2R; return new T.Vector3(Math.sin(a) * Math.cos(b), -Math.sin(b), -Math.cos(a) * Math.cos(b)); };
  // the ray through a screen point, in our (y-down) world
  function rayAt(sx, sy) {
    const k = PERSP * em * (P.zm || 1), vx = (sx - vw / 2) / k, vy = (sy - vh / 2) / k; // view direction (vx, vy, -1)
    const R = rot(P.rx, P.ry).clone().transpose(); // view -> world
    const d = new T.Vector3(vx, vy, -1).applyMatrix4(R).normalize();
    return { o: new T.Vector3(P.x, P.y, P.z), d };
  }

  // boot.js's layout (where the PC sits) and the seated view at the desk (boot.js's own room view, without the sway)
  const Lb = () => (window.RoomCam && RoomCam.L) || { mx: -15, tx: 17, tz: -30, kx: -15, ux: 8, uz: 9.5, fx: 0, fy: -19, fz: -14, rx: -16, ry: -30, oy: -4, ox: 0 };
  function seatPose() {
    // A first-person seat in front of the glass, never the old side-on shot.
    const c=monitorCentre();return{x:c.x,y:c.y-4,z:c.z+90,rx:-3,ry:0,seat:1,lvl:'U',zm:1};
  }
  // where the camera is when the monitor's glass fills the window (the end of the fly-in)
  function fillPose() {
    const L = Lb(), kf = Math.max(vw / (GW * em), vh / (GH * em)) * 1.03;
    return { x: L.mx, y: GY, z: 0.02 + PERSP / kf, rx: 0, ry: 0, seat: 1, zm: 1 };
  }
  // boot.js asks for our pose when the power goes on, so the fly-in starts from exactly where we are
  const RC = window.RoomCam = Object.assign(window.RoomCam || {}, { fx: 0, fy: 0, fz: 0, rx: 0, ry: 0 });
  RC.pose = () => {
    const L = Lb(), R = rot(P.rx, P.ry), v = new T.Vector3(P.x - L.mx, P.y - GY, P.z - 0.02).applyMatrix4(R);
    return { t: [-v.x, -v.y, PERSP - v.z], rx: P.rx, ry: P.ry };
  };
  // follow mode: copy boot.js's camera (the fly-in, the switch-off pull-back, a restart)
  const RE = /translate3d\(([-\d.e]+)em,\s*([-\d.e]+)em,\s*([-\d.e]+)em\)\s*scale3d\(([-\d.e]+),[^)]*\)\s*rotateX\(([-\d.e]+)deg\)\s*rotateY\(([-\d.e]+)deg\)\s*translate3d\(([-\d.e]+)em,\s*([-\d.e]+)em,\s*([-\d.e]+)em\)/;
  function followCss() {
    const m = RE.exec(cam.style.transform || ''); if (!m) return false;
    const t = [+m[1], +m[2], +m[3]], k = +m[4] || 1, rx = +m[5], ry = +m[6], M = [-m[7], -m[8], -m[9]];
    const R = rot(rx, ry).clone().transpose(), v = new T.Vector3(-t[0] / k, -t[1] / k, (PERSP - t[2]) / k).applyMatrix4(R);
    P.x = M[0] + v.x; P.y = M[1] + v.y; P.z = M[2] + v.z; P.rx = rx; P.ry = ry;
    return true;
  }

  // ================================================================ rooms, doors and what's drawn
  const ROOMS = {}, DOORS = {};
  let cur = null; // the room you're in
  let worldLoading = false;
  onLoading();
  function onLoading() { (EVS.loading = EVS.loading || []).push(on => {worldLoading = !!on; if (on) {for (const k in keys) keys[k] = false; unlock();}}); }
  const LV = { U: 73, G: 353 }; // floor heights (y is down)
  function room(id, def) {
    const r = ROOMS[id] = Object.assign({ id, name: id, lvl: 'U', area: [], lights: [], stations: [], built: false, links: [] }, def);
    r.group = new T.Group(); r.group.name = id; r.group.visible = false; root.add(r.group);
    r.things = new T.Group(); r.group.add(r.things);
    r.supports = r.supports || []; r.walls = r.walls || null;
    // A bedroom prop may have been left in a room whose definition was lazy.
    for (const [tid, t] of pendingRestores) if (loadThings().t[tid][0] === id) { pendingRestores.delete(tid); restoreThing(t); }
    return r;
  }
  function buildRoom(r) {
    if (!r || r.built) return; r.built = true;
    try { if (r.build) r.build(r); } catch (e) { console.error('hs build', r.id, e); }
    emit('built', r.id);
    setTimeout(() => mergeRoom(r), 2500); // (after late additions; prewarm merges too)
  }
  const inArea = (r, x, z, lvl) => r.lvl === lvl && r.area.some(a => x >= a[0] && x <= a[2] && z >= a[1] && z <= a[3]);
  function roomAt(x, z, lvl) { // (the smallest room that has this spot in it: a cupboard inside a hall's outline is the cupboard)
    let best = null, ba = 1e12;
    for (const id in ROOMS) { const r = ROOMS[id]; if (!inArea(r, x, z, lvl)) continue; const a = r.area.reduce((n, q) => n + (q[2] - q[0]) * (q[3] - q[1]), 0); if (a < ba) { ba = a; best = r; } }
    return best;
  }
  function door(id, def) {
    const d = DOORS[id] = Object.assign({ id, open: false, rooms: [], ang: 0, swing: 95, ms: 650 }, def);
    if (d.rooms) d.rooms.forEach(rid => ROOMS[rid] && ROOMS[rid].links.push(id));
    d.ang = d.open ? 1 : 0;
    if (d.pivot) {
      root.add(d.pivot);
      d.pivot.rotation.y = 0; d.pivot.updateWorldMatrix(true,true);
      const b = new T.Box3().setFromObject(d.pivot);
      if (!b.isEmpty()) { d.closedBounds = {x0:b.min.x,z0:b.min.z,x1:b.max.x,z1:b.max.z}; d.portal = b.clone().expandByScalar(15); } // (the aperture, for portal culling)
      const leaf=d.pivot.children.find(o=>o.isMesh&&o.geometry?.type==='BoxGeometry');
      if(leaf){leaf.geometry.computeBoundingBox();d.headroom=leaf.geometry.boundingBox.max.y-leaf.geometry.boundingBox.min.y;d.floorY=-b.min.y;}
      d.pivot.rotation.y = d.ang * d.swing * D2R * (d.dir || 1);
    } // (the leaf is drawn whenever either room is: see visCalc)
    if (d.frame) root.add(d.frame); // shared static jambs never rotate with the leaf
    return d;
  }
  function setDoor(id, open, now) {
    const d = DOORS[id]; if (!d || d.open === !!open) return;
    d.open = !!open; grids.dirty = true;
    if (d.open) d.rooms.forEach(rid => buildRoom(ROOMS[rid]));
    const from = d.ang, to = d.open ? 1 : 0, t0 = performance.now(), ms = now ? 0 : d.ms;
    anims.set('door:' + id, n => {
      const k = ms ? Math.min(1, (n - t0) / ms) : 1; d.ang = from + (to - from) * ease(k);
      if (d.pivot) d.pivot.rotation.y = d.ang * d.swing * D2R * (d.dir || 1);
      if (k >= 1) { visCalc(); return false; } return true;
    });
    if (d.open) visCalc();
    sfxDoor(d.open);
    emit('door', id, d.open);
  }
  let visSet = new Set();
  let windowOnly=new Map(),doorOnly=new Map();
  const windowFrustum=new T.Frustum(),windowProjection=new T.Matrix4();
  function visCalc() { // the room you're in, and the rooms you can see into through open doors (and the ones they open onto)
    const vs = new Set(); if (cur) vs.add(cur.id);
    // Portal culling: a room seen only through doorways is drawn when every doorway on some route to it is on screen
    // (doorOnly: room -> routes, each a list of aperture boxes; a null route means always).
    doorOnly=new Map();
    const route=(id,chain)=>{let list=doorOnly.get(id);if(!list)doorOnly.set(id,list=[]);list.push(chain)};
    const walk = (r, depth, chain) => { if (!r) return; for (const did of r.links) { const d = DOORS[did]; if (!d || !(d.open || d.ang > 0.01 || d.always)) continue; const next=d.portal&&!d.always?chain.concat(d.portal):chain; for (const o of d.rooms) if (o!==(cur&&cur.id)&&(!vs.has(o)||doorOnly.has(o))) { const fresh=!vs.has(o); vs.add(o); route(o,next.length?next:null); if (fresh&&depth < (rung().far ? 0 : 1)) walk(ROOMS[o], depth + 1, next); } } };
    walk(cur, 0, []);
    if (cur && (cur.id === 'hall' || cur.id === 'landing' || cur.id === 'cupboard')) { for (const id of ['hall','landing']) { vs.add(id); if (id!==cur.id) route(id,null); } } // (the stairwell joins them: a wrong guess can never black the view out)
    // Glass is a permanent sight line, independent of the door beside it.
    // Keep logical visibility stable; rendering may skip windows off camera.
    const connected=new Set(vs);windowOnly=new Map();
    for(const id of connected)for(const view of ROOMS[id]?.windowViews||[]){
      const other=typeof view==='string'?view:view.room;if(!ROOMS[other])continue;vs.add(other);
      const boxes=[];
      if(!view.bounds)boxes.push(null);else for(const b of view.bounds)boxes.push(new T.Box3(new T.Vector3(b[0],-b[4],b[2]),new T.Vector3(b[3],-b[1],b[5])));
      if(connected.has(other)){if(doorOnly.has(other))for(const b of boxes)route(other,b?[b]:null);continue}
      const bounds=windowOnly.get(other)||[];bounds.push(...boxes);
      windowOnly.set(other,bounds);
    }
    for(const [id,list] of doorOnly)if(list.includes(null))doorOnly.delete(id);
    for (const id in ROOMS) { const r = ROOMS[id], on = vs.has(id); if (on) buildRoom(r); r.group.visible = on; }
    for (const id in DOORS) { const d = DOORS[id], on = d.rooms.some(o => vs.has(o)); if (d.pivot) d.pivot.visible = on; if (d.frame) d.frame.visible = on; }
    visSet = vs; lightsFor(); dirty();
  }
  // Each room owns its lighting state. The same small GPU rig is reused when
  // drawing it; crossing a doorway never reallocates another room's lights.
  const roomRigs = new Map();
  function roomRig(r) {
    if (!r) return null;
    let rig = roomRigs.get(r.id);
    if (!rig) {
      rig = { fresh:true, slots:PL.map(()=>({key:null,cur:0,t:null,l:null})),
        sky:new T.Color(),ground:new T.Color(),ambient:0,sun:0,sunColor:new T.Color(),
        targetSky:new T.Color(),targetGround:new T.Color(),targetSunColor:new T.Color(),targetAmbient:0,targetSun:0,sourceSun:null };
      roomRigs.set(r.id,rig);
    }
    return rig;
  }
  function lightsFor() {
    for (const id in ROOMS) {
      const r=ROOMS[id]; if (!r.built) continue;
      const rig=roomRig(r), all=[],cx=Number.isFinite(r.bx0)?(r.bx0+r.bx1)/2:0,cz=Number.isFinite(r.bz0)?(r.bz0+r.bz1)/2:0;
      for (const l of (typeof r.lights==='function'?r.lights():r.lights)) {
        if (l.i!=null && l.i<=0) continue;
        const distance=Math.hypot(l.x-cx,l.y-(LV[r.lvl]-120),l.z-cz),range=l.d||400;
        all.push(Object.assign({key:id+':'+l.x+','+l.y+','+l.z,score:(l.i==null?1:l.i)*Math.pow(Math.max(0,1-distance/range),2)},l));
      }
      all.sort((a,b)=>b.score-a.score);
      const active=rung().lamps,remaining=all.slice(0,active);
      rig.slots.forEach((s,i)=>{const j=i<active?remaining.findIndex(l=>l.key===s.key):-1;s.t=j<0?null:remaining.splice(j,1)[0]});
      rig.slots.forEach((s,i)=>{if(i<active&&!s.t&&remaining.length)s.t=remaining.shift()});
      const a=(typeof r.amb==='function'?r.amb():r.amb)||{sky:'#8a90a8',gnd:'#30261c',i:0.55};
      rig.targetSky.set(a.sky);rig.targetGround.set(a.gnd);rig.targetAmbient=a.i;
      const sl=typeof r.sun==='function'?r.sun():r.sun;rig.targetSun=sl?sl.i:0;if(sl){rig.sourceSun=Object.assign({},sl);rig.targetSunColor.set(sl.c)}
    }
    tickLights(0);
  }
  const colorGap=(a,b)=>Math.abs(a.r-b.r)+Math.abs(a.g-b.g)+Math.abs(a.b-b.b);
  function tickLights(dt) {
    let moving=false;
    for (const rig of roomRigs.values()) {
      const k=rig.fresh?1:Math.min(1,dt/0.14);
      for (const s of rig.slots) {
        if(s.t&&(s.key===s.t.key||s.cur<0.02||rig.fresh)){s.key=s.t.key;s.l=s.t}
        const target=s.t&&s.key===s.t.key?(s.t.i==null?1:s.t.i):0,d=target-s.cur;
        if(Math.abs(d)>0.003){s.cur+=d*k;moving=true}else s.cur=target;
      }
      if(colorGap(rig.sky,rig.targetSky)>0.003||colorGap(rig.ground,rig.targetGround)>0.003||colorGap(rig.sunColor,rig.targetSunColor)>0.003)moving=true;
      rig.sky.lerp(rig.targetSky,k);rig.ground.lerp(rig.targetGround,k);
      let d=rig.targetAmbient-rig.ambient;if(Math.abs(d)>0.003){rig.ambient+=d*k;moving=true}else rig.ambient=rig.targetAmbient;
      d=rig.targetSun-rig.sun;if(Math.abs(d)>0.003){rig.sun+=d*k;moving=true}else rig.sun=rig.targetSun;
      if(rig.sourceSun)rig.sunColor.lerp(rig.targetSunColor,k);
      rig.fresh=false;
    }
    if(moving)dirty();
  }
  function applyRoomRig(r) {
    const rig=roomRig(r);if(!rig)return;
    hemi.color.copy(rig.sky);hemi.groundColor.copy(rig.ground);hemi.intensity=rig.ambient;
    sun.intensity=rig.sun;sun.color.copy(rig.sunColor);
    if(rig.sourceSun){const l=rig.sourceSun;sun.position.set(l.x,l.y,l.z);sun.target.position.set(l.tx||0,l.ty||0,l.tz||0)}
    sun.updateMatrixWorld(true);sun.target.updateMatrixWorld(true);
    // Printed art gets a dim fill of its own picture, scaled by this room's ambient, daylight and lamps (K.PRINTS).
    let lamps=0;for(const sl of rig.slots)lamps+=sl.cur;const fill=Math.min(.2,.02+.09*rig.ambient+.035*Math.min(3,lamps)+.04*rig.sun);
    if(K.PRINTS)for(const m of K.PRINTS)m.emissiveIntensity=fill;
    for(let i=0;i<PL.length;i++){const pl=PL[i],s=rig.slots[i],l=s.l;pl.visible=i<rung().lamps;pl.intensity=s.cur;if(l){pl.position.set(l.x,l.y,l.z);pl.color.set(l.c||'#fff');pl.distance=l.d||400;pl.decay=2}pl.updateMatrixWorld(true)}
  }
  function lightingSnapshot(id) {
    const r=roomRigs.get(id);return r?{ambient:r.ambient,sky:r.sky.getHex(),ground:r.ground.getHex(),sun:r.sun,
      lights:r.slots.filter(s=>s.cur>0.003&&s.l).map(s=>({key:s.key,x:s.l.x,y:s.l.y,z:s.l.z,i:s.cur}))}:null;
  }
  function prewarm() { // build every room and push its textures/geometry to the GPU in one hidden pass, so nothing pops in later
    try {
      for (const id in ROOMS) buildRoom(ROOMS[id]);
      const vis = []; for (const id in ROOMS) { vis.push([ROOMS[id].group, ROOMS[id].group.visible]); ROOMS[id].group.visible = true; }
      for (const id in DOORS) if (DOORS[id].pivot) DOORS[id].pivot.visible = true;
      for (const id in ROOMS) mergeRoom(ROOMS[id]);
      for (const o of root.children) if (STATIC_ROOT.includes(o.name)) { if (!staticRoot.includes(o)) staticRoot.push(o); try { HouseStatic?.merge(o); } catch (e) { console.error('hs merge', o.name, e); } }
      K.setQuality?.('high',scene);
      compileVariants(Q.adapt);
      scene.traverse(o => { const m = o.material; if (m) [].concat(m).forEach(mm => { for (const k in mm) { const tx = mm[k]; if (tx && tx.isTexture && ren.initTexture) { try { ren.initTexture(tx); } catch (e) {} } } }); });
      ren.render(scene, camera);
      vis.forEach(([g, v]) => { g.visible = v; }); visCalc(); ren.render(scene, camera);
    } catch (e) { console.error('hs prewarm', e); }
  }
  // Merge each built room's static meshes (js/hs-static.js); incremental, so later additions join on the next pass.
  const STATIC_ROOT=['neighbourhood','family-house-roof'],staticRoot=[]; // (outdoor scenery hanging off the root, drawn with the room you're in)
  function mergeRoom(r){ if(!r||!r.built||!window.HouseStatic)return; try{ HouseStatic.merge(r.group); }catch(e){ console.error('hs merge', r.id, e); } }
  // Programs depend on the lamp count and fog: compile the variants a rung draws ahead of time, never at a doorway.
  const compiled=new Set();
  // (the outdoor-fog variant is only drawn outside: compiled now when there, otherwise in idle time shortly after)
  function compileVariants(level){
    const a=ADAPT[level]||ADAPT[0];
    const one=f=>{const key=a.lamps+':'+(f?1:0);if(compiled.has(key))return;compiled.add(key);const vis=PL.map(l=>l.visible),fog=scene.fog;
      try{scene.fog=f;for(let i=0;i<PL.length;i++)PL[i].visible=i<a.lamps;ren.compile(scene,camera)}catch(e){}
      scene.fog=fog;for(let i=0;i<PL.length;i++)PL[i].visible=vis[i]};
    one(null);
    if(a.far){if(cur?.outside)one(outdoorFog);else setTimeout(()=>(window.requestIdleCallback||setTimeout)(()=>one(outdoorFog)),3000)}
  }
  // Keep the merge fresh in idle time: re-batch a room once a scripted change has settled, adopt late additions.
  setInterval(()=>{if(!live||document.hidden||!window.HouseStatic)return;(window.requestIdleCallback||setTimeout)(()=>{const now=performance.now();for(const id of visSet){const r=ROOMS[id];if(r&&r.built)try{HouseStatic.maintain(r.group,now)}catch(e){console.error('hs merge',id,e)}}for(const g of staticRoot)if(g.visible)try{HouseStatic.maintain(g,now)}catch(e){}})},2000);
  let warmed = 0;
  function reveal() { // hold black while everything builds and uploads (never longer than ~5 s), then fade in once, fully drawn
    ui.fade(true, 0); const t0 = performance.now();
    const uncover = () => { ui.fade(false, 400); setTimeout(() => { const panel = document.getElementById('houseEntry'); if (panel) panel.remove(); html.classList.remove('house-entering'); }, 420); };
    const go = () => { if (!window.HouseRooms && performance.now() - t0 < 1500 && window.House && !warmed) return setTimeout(go, 100); prewarm(); warmed = 1; setTimeout(uncover, 60); };
    setTimeout(go, 30); setTimeout(() => ui.fade(false, 400), 5000);
    setTimeout(prewarm, 4000); // (rooms that load lazily, warmed behind the scenes)
    for (const ms of [10000, 30000]) setTimeout(() => (window.requestIdleCallback || setTimeout)(() => { for (const id in ROOMS) mergeRoom(ROOMS[id]); for (const o of staticRoot) try { HouseStatic.merge(o); } catch (e) {} }), ms); // (late additions: the drive, deliveries)
  }
  function relight() { lightsFor(); dirty(); }

  // ================================================================ walking: a grid per floor (5 cm cells), the stairs between them
  const GR = { x0: -360, z0: -600, cs: 5, nx: 180, nz: 360 }, RAD = 22;
  const grids = { U: null, G: null, dirty: true, walk: [], block: [], stairs: [], shells: {} };
  function walkRect(lvl, x0, z0, x1, z1, o) { grids.walk.push(Object.assign({ lvl, x0, z0, x1, z1 }, o || {})); grids.dirty = true; }
  function block(lvl, x0, z0, x1, z1, o) { const b = Object.assign({ lvl, x0, z0, x1, z1 }, o || {}); grids.block.push(b); grids.dirty = true; return b; }
  function stairs(def) { grids.stairs.push(def); grids.dirty = true; } // { x0, z0, x1, z1, y(x, z) }

  // ================================================================ physics: every collider has a real height (js/hs-physics.js, docs/PHYSICS.md)
  // Bodies (the things you can pick up) collide with the floor plan's walls, with block()s (furniture, from the floor up to
  // its top), with support() slabs (a desk top is a 3 cm slab you can slide a chair seat under) and with solid()s: the
  // precise parts of furniture that has room underneath. The player keeps the movement controller above; bodies join it
  // as a kinematic capsule's contacts (pushed when walked into, never trapping).
  const PH = window.HousePhysics ? HousePhysics.create({ floors: LV, stepUp: 8 }) : null;
  const solids = [];
  let physDirty = true, physWhen = '';
  // solid(lvl, x0, z0, x1, z1, top, bot, o): a static box from engine y top (higher) to bot (lower); o.when() toggles it
  function solid(lvl, x0, z0, x1, z1, top, bot, o) { const s = Object.assign({ lvl, x0, z0, x1, z1, top, bot }, o || {}); solids.push(s); physDirty = true; return s; }
  function blockSolid(b, floor) {
    if (b.solid === false) return null;
    let top = b.top;
    if (top == null && b.height != null) top = floor - b.height;
    if (top == null) { // furniture with a surface: solid up to its main (lowest) surface; otherwise floor to ceiling
      let best = null;
      for (const id in ROOMS) { const r = ROOMS[id]; if (r.lvl !== b.lvl) continue; for (const s of r.supports) { const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2; if (cx > b.x0 && cx < b.x1 && cz > b.z0 && cz < b.z1 && s.y < floor && (best == null || s.y > best)) best = s.y; } }
      top = best == null ? floor - 400 : best;
    }
    return { x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1, top, bot: floor + 1, kind: 'block' };
  }
  function physWhenKey() { let k = ''; for (const id in ROOMS) for (const s of ROOMS[id].supports) if (s.when) k += s.when() ? 1 : 0; for (const s of solids) if (s.when) k += s.when() ? 1 : 0; return k; }
  function rebuildPhysics() {
    physDirty = false; if (!PH) return;
    if (grids.dirty) rebuildGrids();
    physWhen = physWhenKey();
    for (const lvl of ['U', 'G']) {
      const floor = LV[lvl], regions = grids.walk.filter(w => w.lvl === lvl && (!w.door || DOORS[w.door].open));
      const list = HousePhysics.wallsFrom(regions, 80, floor - 420, floor + 1);
      for (const b of grids.block) if (b.lvl === lvl && !b.off) { const s = blockSolid(b, floor); if (s) list.push(s); }
      for (const id in ROOMS) { const r = ROOMS[id]; if (r.lvl !== lvl) continue; for (const s of r.supports) if (!s.when || s.when()) list.push({ x0: s.x0, z0: s.z0, x1: s.x1, z1: s.z1, top: s.y, bot: s.y + (s.thick || 2.5), kind: 'support' }); }
      for (const s of solids) if (s.lvl === lvl && (!s.when || s.when())) list.push(s);
      PH.setStatic(lvl, list);
    }
  }
  const physReady = () => { if (PH && (physDirty || grids.dirty)) rebuildPhysics(); return PH; };
  function rebuildGrids() {
    grids.dirty = false; physDirty = true;
    for (const lvl of ['U', 'G']) {
      const regions=grids.walk.filter(w=>w.lvl===lvl&&(!w.door||DOORS[w.door].open));
      grids.shells[lvl]={regions,edges:walkEdges(regions)};
      const g = new Uint8Array(GR.nx * GR.nz);
      const mark = (x0, z0, x1, z1, v) => { const i0 = clamp(Math.floor((x0 - GR.x0) / GR.cs), 0, GR.nx - 1), i1 = clamp(Math.ceil((x1 - GR.x0) / GR.cs) - 1, 0, GR.nx - 1), j0 = clamp(Math.floor((z0 - GR.z0) / GR.cs), 0, GR.nz - 1), j1 = clamp(Math.ceil((z1 - GR.z0) / GR.cs) - 1, 0, GR.nz - 1); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g[j * GR.nx + i] = v; };
      for (const w of grids.walk) if (w.lvl === lvl && (!w.door || DOORS[w.door].open)) mark(w.x0, w.z0, w.x1, w.z1, 1);
      for (const b of grids.block) if (b.lvl === lvl && !b.off) mark(b.x0, b.z0, b.x1, b.z1, 0);
      // Walkable regions on opposite sides of a thin wall can occupy the same
      // 5 cm cell. A closed leaf must block that union explicitly.
      for (const d of Object.values(DOORS)) if (!d.open && !d.always && d.closedBounds && d.rooms.some(id=>ROOMS[id]?.lvl===lvl)) {
        const b=d.closedBounds;mark(b.x0,b.z0,b.x1,b.z1,0);
      }
      // keep RAD away from anything solid
      const out = new Uint8Array(g.length), n = Math.ceil(RAD / GR.cs), off = [];
      for (let dj = -n; dj <= n; dj++) for (let di = -n; di <= n; di++) if (di * di + dj * dj <= n * n) off.push([di, dj]);
      for (let j = 0; j < GR.nz; j++) for (let i = 0; i < GR.nx; i++) {
        if (!g[j * GR.nx + i]) continue; let ok = 1;
        for (const [di, dj] of off) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= GR.nx || b >= GR.nz || !g[b * GR.nx + a]) { ok = 0; break; } }
        out[j * GR.nx + i] = ok;
      }
      grids[lvl] = out;
    }
  }
  const cellOk = (lvl, x, z) => { if (grids.dirty) rebuildGrids(); const i = Math.floor((x - GR.x0) / GR.cs), j = Math.floor((z - GR.z0) / GR.cs); return i >= 0 && j >= 0 && i < GR.nx && j < GR.nz && !!grids[lvl][j * GR.nx + i]; };
  // Exact boundaries of the union, including narrow doorway links. The grid is
  // retained for diagnostics; movement must not inherit its 5 cm stair-step edges.
  function walkEdges(regions) {
    const edges=[];
    for(const r of regions)for(const [axis,value,lo,hi,nx,nz] of [
      ['x',r.x0,r.z0,r.z1,1,0],['x',r.x1,r.z0,r.z1,-1,0],
      ['z',r.z0,r.x0,r.x1,0,1],['z',r.z1,r.x0,r.x1,0,-1]]){
      let spans=[[lo,hi]];
      for(const q of regions){
        if(q===r)continue;
        const a=axis==='x'?q.x0:q.z0,b=axis==='x'?q.x1:q.z1,normal=nx||nz;
        if(!(normal>0?a<value-.001&&b>=value-.001:a<=value+.001&&b>value+.001))continue;
        const c=axis==='x'?q.z0:q.x0,d=axis==='x'?q.z1:q.x1;
        spans=spans.flatMap(([s,e])=>d<=s||c>=e?[[s,e]]:[[s,Math.min(e,c)],[Math.max(s,d),e]].filter(([u,v])=>v-u>.001));
      }
      for(const [a,b]of spans)edges.push(axis==='x'?{x0:value,z0:a,x1:value,z1:b,nx,nz}:{x0:a,z0:value,x1:b,z1:value,nx,nz});
    }
    return edges;
  }
  function circleBox(x,z,x0,z0,x1,z1,radius=RAD) {
    let dx=x-clamp(x,x0,x1),dz=z-clamp(z,z0,z1),distance=Math.hypot(dx,dz);
    if(distance>=radius-.001)return null;
    if(distance<.00001){
      const sides=[[x-x0,-1,0],[x1-x,1,0],[z-z0,0,-1],[z1-z,0,1]].sort((a,b)=>a[0]-b[0]);
      return{nx:sides[0][1],nz:sides[0][2],depth:radius+sides[0][0]};
    }
    return{nx:dx/distance,nz:dz/distance,depth:radius-distance};
  }
  function shellContacts(x,z,lvl,radius=RAD) {
    if(grids.dirty)rebuildGrids();
    const shell=grids.shells[lvl],out=[];
    for(const e of shell.edges){
      const qx=clamp(x,Math.min(e.x0,e.x1),Math.max(e.x0,e.x1)),qz=clamp(z,Math.min(e.z0,e.z1),Math.max(e.z0,e.z1));
      const dx=x-qx,dz=z-qz,d=Math.hypot(dx,dz);
      // At a finite edge's endpoint the body may legally be beyond that edge's
      // infinite half-plane, in the neighbouring doorway. Its radial normal
      // still applies there; forcing the face normal creates a phantom corner.
      if(d<radius-.001)out.push({nx:d>.001?dx/d:e.nx,nz:d>.001?dz/d:e.nz,depth:radius-d});
    }
    for(const b of grids.block)if(b.lvl===lvl&&!b.off&&!(b.height!=null&&b.height<=8)){
      const c=circleBox(x,z,b.x0,b.z0,b.x1,b.z1,radius);if(c)out.push(c);
    }
    return out;
  }
  function floorClear(x,z,lvl) {
    if(grids.dirty)rebuildGrids();
    return grids.shells[lvl].regions.some(r=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1)&&!shellContacts(x,z,lvl).length;
  }
  const onStairs = (x, z) => grids.stairs.find(s => x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1);
  const doorPoint = new T.Vector3();
  function doorContacts(x,z,eye,lvl,radius=RAD) {
    const out=[];
    for (const d of Object.values(DOORS)) {
      const leaf=d.pivot?.children.find(o=>o.isMesh&&o.geometry?.type==='BoxGeometry');
      if(!leaf||d.always||!d.rooms.some(id=>ROOMS[id]?.lvl===lvl))continue;
      // Query the actual leaf in its own frame, including during a swing.
      // Expanding its thin rectangle keeps the camera/body clear on both sides.
      if(!d.solidQuery||d.solidQuery.angle!==d.ang){
        leaf.updateWorldMatrix(true,false);leaf.geometry.computeBoundingBox();
        d.solidQuery={angle:d.ang,inverse:new T.Matrix4().copy(leaf.matrixWorld).invert(),box:leaf.geometry.boundingBox.clone()};
      }
      const q=d.solidQuery,b=q.box;doorPoint.set(x,-eye,z).applyMatrix4(q.inverse);
      if(doorPoint.y>b.min.y&&doorPoint.y<b.max.y){
        const c=circleBox(doorPoint.x,doorPoint.z,b.min.x,b.min.z,b.max.x,b.max.z,radius);
        if(c){const normal=new T.Vector3(c.nx,0,c.nz).transformDirection(leaf.matrixWorld);out.push({nx:normal.x,nz:normal.z,depth:c.depth})}
      }
    }
    return out;
  }
  const doorObstructs=(x,z,eye,lvl)=>doorContacts(x,z,eye,lvl).length>0;
  function lowDoorAt(x,z,lvl,padding,fy) {
    for(const d of Object.values(DOORS)){
      const b=d.closedBounds;
      if(!d.open||!b||!(d.headroom<STAND)||Math.abs(fy-d.floorY)>20||!d.rooms.some(id=>ROOMS[id]?.lvl===lvl))continue;
      const alongX=b.x1-b.x0>b.z1-b.z0;
      const lo=d.lintelPlane??(alongX?b.z0:b.x0),hi=d.lintelPlane??(alongX?b.z1:b.x1);
      if(alongX?x>=b.x0&&x<=b.x1&&z>lo-padding&&z<hi+padding:z>=b.z0&&z<=b.z1&&x>lo-padding&&x<hi+padding)return d;
    }
    return null;
  }
  function headFitsDoor(x,z,lvl,fy,height){const d=lowDoorAt(x,z,lvl,RAD,fy);return !d||height<=d.headroom-4.5;}
  // the floor under (x, z) for someone standing at height y0 now (null: can't stand there)
  function floorAt(x, z, lvl, y0, eyeHeight) {
    const s = onStairs(x, z); let best = null;
    const cands = [];
    const inX = s && x >= s.x0 + RAD && x <= s.x1 - RAD, sy = inX ? s.y(x, z) : 0, mid = inX && z > s.m0 && z < s.m1; // (on the stairs: the ramp is the floor, bar the cupboard right under them)
    for (const L of [lvl, lvl === 'U' ? 'G' : 'U']) if (floorClear(x,z,L)) { if (mid && !(L === 'G' && LV.G - sy > 100)) continue; cands.push({ y: LV[L], lvl: L }); }
    if (inX) cands.push({ y: sy, lvl: sy < (LV.U + LV.G) / 2 ? 'U' : 'G' });
    for (const c of cands) if (Math.abs(c.y - y0) <= 45 && headFitsDoor(x,z,c.lvl,c.y,eyeHeight==null?W.eyeNow+W.jh:eyeHeight) && !doorObstructs(x,z,c.y-50,c.lvl) && !bodyBlocks(x,z,c.lvl,c.y,eyeHeight==null?W.eyeNow+W.jh:eyeHeight) && (!best || Math.abs(c.y - y0) < Math.abs(best.y - y0))) best = c;
    return best;
  }
  // The player's capsule against bodies: from the step height up to the top of the head (a crouch makes it shorter).
  const HEADROOM = 12;
  // (physAcc: every physics millisecond in a frame, solver and player queries together: House.physics.frameMs)
  let physAcc=0,physFrame=0;
  function bodyBlocks(x,z,lvl,feet,eye){const ph=PH&&(physDirty||grids.dirty?physReady():PH);return !!ph&&ph.playerBlocked(lvl,x,z,RAD,feet,feet-eye-HEADROOM);} // (untimed: hundreds of calls; tests/physics.mjs measures with the CPU profiler)
  function bodyContacts(x,z,radius){const ph=physReady();if(!ph)return [];const t0=performance.now(),out=ph.playerContacts(W.lvl,x,z,radius,W.fy,W.fy-W.eyeNow-W.jh-HEADROOM);for(const c of out){const b=ph.get(c.id);c.soft=!!b&&!b.fixed&&b.push>0.2}physAcc+=performance.now()-t0;return out;}
  const W = { x: 0, z: 100, lvl: 'U', fy: 73, eye: 143, eyeNow: 108, bob: 0, bobT: 0, vx: 0, vz: 0, jh: 0, jv: 0 };
  const STAND = 143, SITH = 108; // eye height standing (a teenager about 155 cm tall) and sitting on an ordinary chair

  // ================================================================ things you can click (spots), with a warm glow when you point at them
  const SPOTS = {};
  const pickables = []; // meshes
  function spot(id, def) {
    const s = SPOTS[id] = Object.assign(SPOTS[id] || {}, { id, range: 240 }, def);
    if (s.obj) adopt(s.obj, s);
    return s;
  }
  function adopt(obj, s) {
    obj.traverse(o => {
      if (!o.isMesh) return;
      o.userData.spot = s.id;
      if (!o.userData.own) { o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); o.userData.own = 1; }
      if (!pickables.includes(o)) pickables.push(o);
    });
  }
  function unspot(id) { const s = SPOTS[id]; if (!s) return; if (s.obj) s.obj.traverse(o => { const i = pickables.indexOf(o); if (i >= 0) pickables.splice(i, 1); }); delete SPOTS[id]; }
  let hot = null;
  function glow(id, on) {
    const s = SPOTS[id]; if (!s || !s.obj) return;
    s.obj.traverse(o => { if (!o.isMesh) return; for (const m of Array.isArray(o.material) ? o.material : [o.material]) { if (!m.emissive) continue; if (on) { if (!m.userData.e0) m.userData.e0 = m.emissive.clone(); m.emissive.setRGB(m.userData.e0.r + 0.13, m.userData.e0.g + 0.1, m.userData.e0.b + 0.05); } else if (m.userData.e0) m.emissive.copy(m.userData.e0); } });
    dirty();
  }
  function setHot(id) { if (hot === id) return; if (hot) glow(hot, false); hot = id; if (hot) glow(hot, true); }
  const ray = new T.Raycaster();
  const _o = new T.Vector3(), _d = new T.Vector3();
  // what's under a screen point: the nearest mesh of a visible room (walls block), and the spot it belongs to
  function pick(sx, sy, o) {
    o = o || {};
    const r = rayAt(sx, sy);
    _o.set(r.o.x, -r.o.y, r.o.z); _d.set(r.d.x, -r.d.y, r.d.z); // (three's world is y-up)
    ray.set(_o, _d); ray.far = o.far || 2000; ray.layers.enableAll();
    const list = [];
    for (const id of visSet) ROOMS[id].group.traverseVisible(m => { if (m.isMesh && !m.userData.noPick) list.push(m); });
    for (const id in DOORS) { const dp = DOORS[id].pivot; if (dp && dp.visible) dp.traverseVisible(m => { if (m.isMesh && !m.userData.noPick) list.push(m); }); } // (door leaves hang off the root, not a room's group: they must be pickable too)
    for (const d of Object.values(DOORS)) if (d.frame && d.frame.visible) d.frame.traverseVisible(m => { if (m.isMesh && !m.userData.noPick) list.push(m); });
    const hits = ray.intersectObjects(list, false);
    for (const h of hits) {
      if (o.skip && o.skip(h.object)) continue;
      const sid = h.object.userData.spot;
      const p = { x: h.point.x, y: -h.point.y, z: h.point.z };
      return { spot: sid && SPOTS[sid] && !SPOTS[sid].off ? sid : null, dist: h.distance, p, obj: h.object, n: h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : null };
    }
    return null;
  }

  // ================================================================ things you can pick up and put down (the grab system)
  const THINGS = {}, SNAPS = {}, pendingRestores = new Map();
  function insideFootprint(t,at,x,z,margin){const a=(at.ry||0)*D2R,dx=x-at.x,dz=z-at.z;return !!circleBox(dx*Math.cos(a)-dz*Math.sin(a),dx*Math.sin(a)+dz*Math.cos(a),-t.hx,-t.hz,t.hx,t.hz,margin);}
  function insideThing(t,x,z,margin){return insideFootprint(t,t.at,x,z,margin);}
  function floorPlacement(t,r,x,z,ry){
    const a=ry*D2R,hx=Math.abs(Math.cos(a))*t.hx+Math.abs(Math.sin(a))*t.hz,hz=Math.abs(Math.sin(a))*t.hx+Math.abs(Math.cos(a))*t.hz;
    const rect={x0:x-hx,z0:z-hz,x1:x+hx,z1:z+hz},over=b=>rect.x1>b.x0&&rect.x0<b.x1&&rect.z1>b.z0&&rect.z0<b.z1;
    if([[rect.x0,rect.z0],[rect.x0,rect.z1],[rect.x1,rect.z0],[rect.x1,rect.z1]].some(([xx,zz])=>!r.area.some(q=>xx>q[0]+2&&xx<q[2]-2&&zz>q[1]+2&&zz<q[3]-2)))return false;
    if(grids.block.some(b=>b.lvl===r.lvl&&!b.off&&over(b)))return false;
    if(grids.walk.some(w=>w.lvl===r.lvl&&w.door&&over({x0:w.x0-RAD-10,x1:w.x1+RAD+10,z0:w.z0-RAD-10,z1:w.z1+RAD+10})))return false;
    if(grids.stairs.some(s=>over({x0:s.x0-12,x1:s.x1+12,z0:s.z0-35,z1:s.z1+35})))return false;
    // Keep the monitor approach clear, even when the PC is switched off.
    if(t.id!=='chair'&&r.id==='bedroom'&&over({x0:-54,x1:30,z0:33,z1:100}))return false;
    if(W.lvl===r.lvl&&insideFootprint(t,{x,z,ry},W.x,W.z,RAD))return false;
    return !Object.values(THINGS).some(other=>other!==t&&other.obstacle&&!other.at.hide&&['rest','snap','fall'].includes(other.st)&&other.at.room===r.id&&over({x0:other.at.x-other.hx,z0:other.at.z-other.hz,x1:other.at.x+other.hx,z1:other.at.z+other.hz}));
  }
  function floorDropTarget(t,r,target,ry){
    if(floorPlacement(t,r,target.x,target.z,ry))return target;
    // Looking down projects the chair underneath the player's own feet.
    // Ease it just beyond that footprint instead of trapping it in hand.
    // This is not a free-space search: walls, doors and the PC stay protected.
    if(W.lvl!==r.lvl)return null;
    const a=ry*D2R;
    let dx=target.x-W.x,dz=target.z-W.z;
    if(!insideFootprint(t,{x:target.x,z:target.z,ry},W.x,W.z,RAD))return null;
    if(Math.hypot(dx,dz)<1){const f=fwd();dx=f.x;dz=f.z;if(Math.hypot(dx,dz)<.01){dx=Math.sin(P.ry*D2R);dz=-Math.cos(P.ry*D2R)}}
    const lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a);
    const scale=Math.min(Math.abs(lx)>.001?(t.hx+RAD+2)/Math.abs(lx):Infinity,Math.abs(lz)>.001?(t.hz+RAD+2)/Math.abs(lz):Infinity);
    const candidate=Object.assign({},target,{x:W.x+dx*scale,z:W.z+dz*scale});
    return Math.hypot(candidate.x-target.x,candidate.z-target.z)<=90&&floorPlacement(t,r,candidate.x,candidate.z,ry)?candidate:null;
  }
  function placementKeepsRoutes(t,r,target,ry) {
    // Reject a new room divider, including two individually legal chairs that
    // together seal its only passage. Compare the reachable floor before/after;
    // existing isolated pockets do not make every subsequent placement invalid.
    const cells=new Map(),cs=10,fy=LV[r.lvl];
    for(let x=Math.ceil(r.bx0/cs)*cs+2.5;x<r.bx1;x+=cs)for(let z=Math.ceil(r.bz0/cs)*cs+2.5;z<r.bz1;z+=cs){
      if(!r.area.some(a=>x>=a[0]&&x<=a[2]&&z>=a[1]&&z<=a[3]))continue;
      const f=floorAt(x,z,r.lvl,fy,Math.min(STAND,r.eye||STAND));
      if(f&&Math.abs(f.y-fy)<8)cells.set(x+','+z,{x,z,blocked:insideFootprint(t,{x:target.x,z:target.z,ry},x,z,RAD)});
    }
    if(!cells.size)return false;
    const px=W.lvl===r.lvl?W.x:target.x,pz=W.lvl===r.lvl?W.z:target.z;
    const seed=[...cells.values()].filter(c=>!c.blocked).sort((a,b)=>Math.hypot(a.x-px,a.z-pz)-Math.hypot(b.x-px,b.z-pz))[0];
    if(!seed)return false;
    const flood=avoid=>{const seen=new Set([seed.x+','+seed.z]),queue=[seed];for(let i=0;i<queue.length;i++){const c=queue[i];for(const [dx,dz]of [[cs,0],[-cs,0],[0,cs],[0,-cs]]){const k=(c.x+dx)+','+(c.z+dz),n=cells.get(k);if(n&&!seen.has(k)&&(!avoid||!n.blocked)){seen.add(k);queue.push(n)}}}return seen};
    const before=flood(false),after=flood(true);
    return [...before].every(k=>cells.get(k).blocked||after.has(k));
  }
  let held = null; // { id, d (distance), ry (extra turn), from (where it was), drag (furniture slid along the floor) }
  let saveT = 0;
  // A model's own bounds, in its own frame (y down, origin at its bottom centre), whatever its pose is now.
  function measureLocal(obj) {
    obj.updateWorldMatrix(true, true);
    const inv = new T.Matrix4().copy(obj.matrixWorld).invert(), box = new T.Box3(), m = new T.Matrix4();
    obj.traverse(o => { if (!o.isMesh || o.userData.contactShadow || !o.geometry) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(m.multiplyMatrices(inv, o.matrixWorld))); });
    if (box.isEmpty()) return { cx: 0, cz: 0, hx: 1, hz: 1, h: 1 };
    return { cx: (box.min.x + box.max.x) / 2, cz: (box.min.z + box.max.z) / 2, hx: Math.max(0.5, (box.max.x - box.min.x) / 2), hz: Math.max(0.5, (box.max.z - box.min.z) / 2), h: Math.max(0.5, box.max.y - Math.min(box.min.y, 0)) };
  }
  function thing(id, def) {
    const t = THINGS[id] = Object.assign({ id, kind: 'thing', label: id, st: 'rest', ry: 0, rx: 0, rz: 0, vy: 0 }, THINGS[id] || {}, def);
    const home = t.home; if (!t.at) t.at = Object.assign({}, home);
    if (!t.obj) t.obj = new T.Group();
    t.obj.userData.thing=1; // every grab-API object, including furniture
    const r = ROOMS[t.at.room] || ROOMS[home.room];
    (r ? r.things : root).add(t.obj);
    // its size (the object is built with its bottom centre at the origin)
    const bb = new T.Box3(); t.obj.updateWorldMatrix(true,true);
    t.obj.traverse(o => {if (o.isMesh && !o.userData.contactShadow) bb.expandByObject(o);});
    if (bb.isEmpty()) bb.setFromObject(t.obj);
    t.hx = Math.max(1, (bb.max.x - bb.min.x) / 2); t.hz = Math.max(1, (bb.max.z - bb.min.z) / 2); t.h = Math.max(0.5, bb.max.y - bb.min.y);
    // Some closed models have a foot/binding below their nominal origin.
    // Measure visible geometry so the shared clearance survives those details,
    // without changing their saved coordinates or including hidden case parts.
    const contactBounds=new T.Box3(),origin=new T.Vector3();t.obj.getWorldPosition(origin);
    t.obj.traverseVisible(o=>{if(o.isMesh&&!o.userData.contactShadow&&[].concat(o.material).some(m=>m.visible))contactBounds.expandByObject(o)});
    const trim=contactBounds.isEmpty()?0:Math.max(0,origin.y-contactBounds.min.y);
    t.bottomOffset=trim<=.5?trim:0; // fine binding/feet only; preserve deliberate soft-model anchors
    if (t.body && PH) { PH.remove(t.id); t.body = null; } // re-registered: measure again
    t.local = measureLocal(t.obj);
    place(t);
    spot(id, Object.assign({ label: t.label, obj: t.obj, grab: true, range: t.range || 230 }, def.spot || {}));
    return t;
  }
  const renderY=(t,y)=>K.restY(y)-(t.bottomOffset||0);
  const restOf=(t,objY)=>objY+K.SURFACE_LIFT+(t.bottomOffset||0); // the inverse of renderY
  // Soft tops (the duvet): the collider is a flat slab, the cloth is rumpled. A thing resting on the slab is drawn on the
  // cloth's real surface under its footprint (its highest point), so it never sinks out of sight or hovers over a dip.
  const SOFT = [], SOFT_PTS = [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]], softRay = new T.Raycaster(), _sd = new T.Vector3(0, -1, 0), _so = new T.Vector3();
  function soft(rid, x0, z0, x1, z1, y, o) { const s = Object.assign({ room: rid, x0, z0, x1, z1, y, meshes: [], base: y }, o || {}); SOFT.push(s); return s; }
  function softSurface(s, x, z) {
    if (s.find && !s.found) { const f = s.find(); if (f.length) { s.found = true; s.meshes.push(...f); } }
    const list = s.meshes.filter(m => { for (let o = m; o; o = o.parent) if (!o.visible) return false; return true; });
    _so.set(x, -(s.y - 60), z); softRay.set(_so, _sd); softRay.far = 120;
    const h = list.length ? softRay.intersectObjects(list, false)[0] : null;
    return h ? -h.point.y : s.base;
  }
  function softY(t, a) {
    if (!SOFT.length || !a || a.hide) return a.y;
    for (const s of SOFT) {
      if (s.room !== a.room || Math.abs(a.y - s.y) > 0.6 || a.x < s.x0 || a.x > s.x1 || a.z < s.z0 || a.z > s.z1) continue;
      const m = t.local || { cx: 0, cz: 0, hx: t.hx, hz: t.hz }, r = (a.ry || 0) * D2R, c = Math.cos(r), sn = Math.sin(r);
      let top = Infinity;
      for (const [u, v] of SOFT_PTS) { const lx = m.cx + u * m.hx * 0.8, lz = m.cz + v * m.hz * 0.8; top = Math.min(top, softSurface(s, a.x + lx * c + lz * sn, a.z - lx * sn + lz * c)); }
      return Number.isFinite(top) ? top : a.y;
    }
    return a.y;
  }
  function softChanged(rid) { for (const id in THINGS) { const t = THINGS[id]; if (t.at.room === rid && t.st === 'rest' && !t.at.hide && t.obj) t.obj.position.y = renderY(t, softY(t, t.at)); } dirty(); }
  function place(t) { const a = t.at; t.obj.position.set(a.x, renderY(t,softY(t,a)), a.z); t.obj.rotation.set((t.rx || 0) * D2R, (a.ry || 0) * D2R, (t.rz || 0) * D2R, 'YXZ'); if (t.swivel) t.swivel.rotation.y = (a.sw || 0) * D2R; t.obj.visible = !a.hide; syncBody(t); dirty(); }

  // ---------------------------------------------------------------- bodies: a thing resting in the world is a physics body
  const lvlOf = t => (ROOMS[t.at.room] || ROOMS[t.home && t.home.room] || { lvl: 'U' }).lvl;
  const MASS = { light: 0.4, medium: 1.5, heavy: 6 };
  function bodyFor(t) {
    if (!PH || !t.obj) return null;
    if (t.body) return t.body;
    const o = t.physics || {}, m = t.local || (t.local = measureLocal(t.obj));
    const parts = o.parts || [o.round ? { t: 'cyl', x: m.cx, z: m.cz, r: Math.max(m.hx, m.hz), lo: 0, hi: m.h } : { t: 'box', x: m.cx, z: m.cz, hx: m.hx, hz: m.hz, lo: 0, hi: m.h }];
    const tall = m.h > 2.6 * Math.min(m.hx, m.hz);
    t.body = PH.add(t.id, { lvl: lvlOf(t), x: t.at.x, y: t.at.y, z: t.at.z, ry: t.at.ry || 0, sw: t.at.sw || 0, parts, user: t,
      mass: o.mass != null ? o.mass : MASS[thingWeight(t)], mu: o.mu != null ? o.mu : 0.6, coast: o.coast != null ? o.coast : 0.25, push: o.push,
      tip: o.tip != null ? o.tip : tall ? 0.7 : 0.25, noStack: !!t.noStack, swing: o.swing, noSpin: !!o.noSpin, swDamp: o.swDamp || 0.9, active: false });
    t.body.restY = t.at.y;
    bodyState(t);
    return t.body;
  }
  function bodyState(t) {
    const b = t.body; if (!b) return;
    const drag = held && held.id === t.id && held.drag;
    const on = drag || ((t.st === 'rest' || t.st === 'snap') && !t.at.hide && !!ROOMS[t.at.room]);
    b.fixed = !!drag || !!t.fixed || t.st === 'snap'; // clicked into a slot: solid, but nothing shoves it out
    if (on !== b.active || !on) PH.setActive(b, on);
  }
  // The thing's pose (t.at) is the truth; put the body there and let it sleep (the story, a refresh, Mom tidying up).
  function syncBody(t, wake) {
    if (!PH) return null;
    const b = t.body || ((t.st === 'rest' || t.st === 'snap') && !t.at.hide && ROOMS[t.at.room] ? bodyFor(t) : null); if (!b) return null;
    b.lvl = lvlOf(t); b.x = t.at.x; b.y = t.at.y; b.z = t.at.z; b.ry = t.at.ry || 0; b.sw = t.at.sw || 0; b.restY = t.at.y;
    b.vx = b.vy = b.vz = b.wy = b.wsw = 0; b.tx = b.tz = b.tvx = b.tvz = 0; b.still = 0;
    PH.update(b); bodyState(t);
    b.anchored = false; // (re-checked by the solver the next time something wakes it)
    if (wake && b.active) PH.wake(b, true); else PH.awake.delete(b);
    return b;
  }
  // a body moved: the model follows it (with its tip and a chair's swivel), and it changes room when it crosses a doorway
  const _spinAx = new T.Vector3(), _spinQ = new T.Quaternion();
  function renderBody(t) {
    const b = t.body, a = t.at; if (!b) return;
    a.x = b.x; a.y = b.y; a.z = b.z; a.ry = b.ry; if (t.swivel) { a.sw = b.sw; t.swivel.rotation.y = b.sw * D2R; }
    const home = ROOMS[a.room]; // (only look for another room once it has left this one's floor)
    if (!home || home.lvl !== b.lvl || !inArea(home, b.x, b.z, b.lvl)) { const r = roomAt(b.x, b.z, b.lvl); if (r && r.id !== a.room && t.st !== 'held') { a.room = r.id; moveTo(t, r.id); } }
    let rx = (t.rx || 0) * D2R, rz = (t.rz || 0) * D2R, lift = 0;
    if (b.tx || b.tz) {
      const yaw = b.ry * D2R, lx = b.tx * Math.cos(yaw) - b.tz * Math.sin(yaw), lz = b.tx * Math.sin(yaw) + b.tz * Math.cos(yaw);
      rz += lx * D2R; rx -= lz * D2R; lift = Math.sin(Math.hypot(b.tx, b.tz) * D2R) * Math.min(b.rad, 30);
    }
    t.obj.position.set(b.x, renderY(t, b.grounded === false && PH.awake.has(b) ? b.y : softY(t, a)) - lift, b.z); t.obj.rotation.set(rx, b.ry * D2R, rz, 'YXZ');
    if (t.spin) { // a ball rolls: its inner group turns by the distance travelled over its radius (axis = up x motion)
      const lp = t.spinAt || (t.spinAt = { x: b.x, z: b.z }), dx = b.x - lp.x, dz = b.z - lp.z, d = Math.hypot(dx, dz); lp.x = b.x; lp.z = b.z;
      if (d > 0.01 && d < 60) { const yaw = b.ry * D2R, ax = -dz, az = dx, lx = ax * Math.cos(yaw) - az * Math.sin(yaw), lz = ax * Math.sin(yaw) + az * Math.cos(yaw); _spinAx.set(lx / d, 0, lz / d); _spinQ.setFromAxisAngle(_spinAx, d / (t.spinR || 10)); t.spin.quaternion.premultiply(_spinQ); }
    }
    const air = !b.grounded && PH.awake.has(b);
    if (t.airborne !== air) { t.airborne = air; t.obj.traverse(o => { if (o.userData.contactShadow) o.visible = !air && (t.st === 'rest' || t.st === 'snap'); }); }
    dirty();
  }
  const lastBump = new Map(), movedBodies = new Set();
  function flushMoved() { if (!movedBodies.size) return; for (const b of movedBodies) if (b.user) renderBody(b.user); movedBodies.clear(); }
  if (PH) {
    PH.onMove = b => { if (b.user) movedBodies.add(b); }; // (drawn once a frame: flushMoved)
    PH.onSleep = b => {
      const t = b.user; if (!t) return; renderBody(t);
      if (t.st !== 'rest') return;
      layerFor(t); saveThings(); emit('rest', t.id); rescueQ.add(t);
    };
    PH.onImpact = (b, v) => {
      const t = b.user, now = performance.now(); if (!t || now - (lastBump.get(t.id) || 0) < 140) return; lastBump.set(t.id, now);
      physicalSound('bump', { weight: thingWeight(t), speed: v });
    };
    PH.onPush = (b, got, speed) => {
      const t = b.user, now = performance.now(); if (!t || got < 0.2 || now - (lastBump.get('push:' + t.id) || 0) < 160) return; lastBump.set('push:' + t.id, now);
      physicalSound(t.physics?.castors ? 'roll' : 'scrape', { weight: thingWeight(t), speed });
    };
  }
  // the doors' leaves are kinematic boxes while they're open or swinging (a closed door is part of the wall)
  const _dm = new T.Matrix4(), _dc = new T.Vector3(), _dx = new T.Vector3();
  function doorKinematics() {
    for (const d of Object.values(DOORS)) {
      const leaf = d.pivot?.children.find(o => o.isMesh && o.geometry?.type === 'BoxGeometry'), lvl = ROOMS[d.rooms[0]]?.lvl;
      if (!leaf || !lvl || d.always) continue;
      if (!(d.ang > 0.01)) { if (d.physAng != null) { PH.setKinematic('door:' + d.id, lvl, null); d.physAng = null; } continue; }
      if (d.physAng === d.ang) continue; d.physAng = d.ang;
      leaf.updateWorldMatrix(true, false); leaf.geometry.computeBoundingBox();
      const bb = leaf.geometry.boundingBox; _dm.copy(root.matrixWorld).invert().multiply(leaf.matrixWorld);
      bb.getCenter(_dc).applyMatrix4(_dm); _dx.set(1, 0, 0).transformDirection(_dm);
      PH.setKinematic('door:' + d.id, lvl, { x: _dc.x, z: _dc.z, hx: (bb.max.x - bb.min.x) / 2, hz: (bb.max.z - bb.min.z) / 2, ry: Math.atan2(-_dx.z, _dx.x) / D2R, top: _dc.y - (bb.max.y - bb.min.y) / 2, bot: _dc.y + (bb.max.y - bb.min.y) / 2 });
    }
  }
  function tickPhysics(dt) {
    if (!PH) return false;
    physReady();
    if (performance.now() - (tickPhysics.when || 0) > 1000) { tickPhysics.when = performance.now(); if (physWhenKey() !== physWhen) physDirty = true; }
    doorKinematics();
    if (!PH.awake.size) { flushMoved(); return false; }
    PH.step(dt); flushMoved();
    return true;
  }

  // flat surfaces things can rest on: { room, x0, z0, x1, z1, y } (o.thick: how deep the slab is; default 2.5 cm)
  function support(rid, x0, z0, x1, z1, y, o) { const r = ROOMS[rid]; if (!r) return; r.supports.push(Object.assign({ x0, z0, x1, z1, y }, o || {})); physDirty = true; }
  function supportsAt(rid, x, z, except) { // every surface under (x, z): the room's own, and the tops of things resting there
    const out = []; const r = ROOMS[rid]; if (!r) return out;
    for (const s of r.supports) if (x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1 && !(s.when && !s.when())) out.push(s.y);
    for (const id in THINGS) { const o = THINGS[id]; if (o === except || o.st !== 'rest' || o.at.room !== rid || o.at.hide || o.noStack) continue; if (Math.abs(x - o.at.x) <= o.hx && Math.abs(z - o.at.z) <= o.hz) out.push(o.at.y - o.h); }
    out.push(LV[r.lvl]); // the floor
    return out;
  }
  // the highest surface at or below height y (y is down: "below" means a bigger y)
  function landY(rid, x, z, y, except) { const ys = supportsAt(rid, x, z, except).filter(s => s >= y - 0.5); return ys.length ? Math.min(...ys) : LV[(ROOMS[rid] || { lvl: 'U' }).lvl]; }
  function snapDef(id, def) { return SNAPS[id] = Object.assign({ id, r: 14 }, def); }
  const dragged = t => !!(t && (t.physics?.drag || t.drag));
  function grab(id, o) {
    const t = THINGS[id]; if (!t || held) return false;
    if (focusS?.o.seatId===id || t.canGrab && !t.canGrab()) return false;
    pendingRestores.delete(id); // a new grab supersedes an old deferred placement
    anims.delete('snap:' + id); anims.delete('set:' + id);
    const was = t.st === 'snap' || t.st === 'anim' ? t.snap : null;
    const drag = dragged(t) && t.st === 'rest' && !t.at.hide && !was;
    held = { id, d: clamp(o?.d || holdDistance(t), 25, 150), ry: o?.ry || 0, from: Object.assign({}, t.at), was, sx: t.at.x, sy: t.at.y, sz: t.at.z, drag, pry: P.ry, rel: (t.at.ry || 0) + P.ry, hand: null, hv: { x: 0, y: 0, z: 0 } };
    if (was) { const sn = SNAPS[was]; t.snap = null; if (sn && sn.onUnsnap) try { sn.onUnsnap(t); } catch (e) { console.error(e); } emit('unsnap', was, id); }
    t.st = 'held'; t.at.hide = false; t.obj.visible = true;
    aimPt = null; aimT = 0; GP.res = null; targetsAt = -Infinity; targetCount = 0; showTargets(null); // never inherit the previous object's shelf targets
    const b = t.body || (drag ? bodyFor(t) : null);
    if (b) { bodyState(t); if (!drag) PH.supportGone(b); else PH.awake.delete(b); }
    layerFor(t); // update the cached front-layer state too, even before a frame renders
    if (cur && t.obj.parent !== cur.things && !drag) cur.things.attach ? cur.things.add(t.obj) : 0;
    physicalSound('handle', {weight:thingWeight(t)});
    ui.holdBar(t); saveGrip();
    emit('grab', id);
    return true;
  }
  // How far in front of you a carried thing sits: small things close, big ones further, so each is a comfortable size.
  function holdDistance(t) { const m = t.local || { hx: t.hx, hz: t.hz, h: t.h }, R = Math.hypot(m.hx, m.hz, m.h / 2); return clamp(Math.max(t.holdD || 0, R * 1.9 + 18), 28, 120); }
  const _up = new T.Vector3(), _rt = new T.Vector3();
  // ---------------------------------------------------------------- the hold pose (owner, 2026-10-27/28)
  // What you carry is the real thing at its real size (owner: "size of things shouldn't change when holding"), held in
  // your hands low in front of you like a first-person game: its top edge just under the crosshair, tilted towards you,
  // big things running off the bottom of the frame, your forearms coming up to it from below ("why arms so long?").
  // How far out depends on its size (36 cm for a mug, up to arm's length for a monitor) and stays fixed while you hold it,
  // so it never changes size: picking it up, putting it down and inspecting only move it.
  // low: where a small thing's bottom edge sits (a fraction of the view from the top) when nothing is in the way
  const HOLD = { near: 36, far: 60, reach: 72, x: 0.02, gap: 0.075, low: 0.86, pad: 0.012, tiltSign: -1 };
  // tipped so you see a little of its top whichever way you look (as if your hands brought it up to show you), but
  // following your view only partly, so looking down at the floor still shows it held, not lying flat
  const holdTilt = () => clamp(24 + P.rx * 0.8, -32, 38);
  const _hm = new T.Matrix4(), _hmi = new T.Matrix4(), _hp = new T.Vector3(), _ho = new T.Vector3(), _vv = new T.Vector3(), _vb = new T.Box3();
  function holdSize(t) { const m = t.local || { hx: t.hx, hz: t.hz, h: t.h }; return Math.hypot(m.hx, m.hz, m.h / 2); }
  // its own bounding box, in its own space (from the meshes, so a flat game box is flat and a tall tower is tall)
  function localBox(t) {
    if (t._lb && t._lbObj === t.obj) return t._lb;
    const box = new T.Box3(); t.obj.updateWorldMatrix(true, true); // (in its own units: the stand-in's scale doesn't matter)
    const inv = new T.Matrix4().copy(t.obj.matrixWorld).invert();
    t.obj.traverse(o => { if (o.isMesh && o.geometry && !o.userData.contactShadow && !o.userData.questRim && !o.userData.hand && o.visible && [].concat(o.material).some(m => m && m.visible)) {
      // (vertex by vertex for ordinary props, so a turned part such as a cushion's piping doesn't inflate it; a box per part for big meshes)
      const m = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld), pos = o.geometry.attributes.position;
      if (pos && pos.count <= 6000 && !o.isInstancedMesh) { const v = new T.Vector3(); for (let i = 0; i < pos.count; i++) box.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(m)); }
      else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(m)); } } });
    if (box.isEmpty()) { const m = t.local || { cx: 0, cz: 0, hx: t.hx, hz: t.hz, h: t.h }; box.min.set(m.cx - m.hx, 0, m.cz - m.hz); box.max.set(m.cx + m.hx, m.h, m.cz + m.hz); }
    t._lb = box; t._lbObj = t.obj; return box;
  }
  // the carry panel's top edge and sides, as fractions of the view (read at most four times a second)
  let holdUi = null, holdUiAt = -1e9;
  function carryPanel(now) {
    if (now - holdUiAt < 250 && now >= holdUiAt) return holdUi;
    holdUiAt = now; const el = ui.el && ui.el.querySelector('.hs-hold'), r = el && !el.hidden && el.getBoundingClientRect();
    return holdUi = r && r.height ? { top: r.top / vh, l: r.left / vw, r: r.right / vw } : null;
  }
  function heldPos() {
    const t = THINGS[held.id], now = performance.now();
    const tanV = Math.tan(camera.fov * D2R / 2), tanH = tanV * camera.aspect;
    // the view, as a matrix (view space: x right, y up, -z ahead), and its inverse
    _hm.makeTranslation(P.x, P.y, P.z).multiply(rot(P.rx, P.ry).transpose()); _hm.premultiply(S).multiply(S); _hmi.copy(_hm).invert();
    // how big it looks turned the way it is now, and where its middle is from its origin
    t.obj.updateMatrixWorld(true);
    const lb = localBox(t), e = t.obj.matrixWorld.elements;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const lx of [lb.min.x, lb.max.x]) for (const ly of [lb.min.y, lb.max.y]) for (const lz of [lb.min.z, lb.max.z]) {
      _hp.set(lx, ly, lz).applyMatrix4(t.obj.matrixWorld).applyMatrix4(_hmi);
      x0 = Math.min(x0, _hp.x); x1 = Math.max(x1, _hp.x); y0 = Math.min(y0, _hp.y); y1 = Math.max(y1, _hp.y); z0 = Math.min(z0, _hp.z); z1 = Math.max(z1, _hp.z);
    }
    _ho.set(e[12], e[13], e[14]).applyMatrix4(_hmi);
    const w = x1 - x0, h = y1 - y0, ocx = (x0 + x1) / 2 - _ho.x, ocy = (y0 + y1) / 2 - _ho.y, ocz = (z0 + z1) / 2 - _ho.z;
    // (the carry panel only matters where it is under the middle of the view: on a desktop it sits in the corner)
    const panel = carryPanel(now), ghost = ghostRect(), mid = panel && panel.l < 0.62 && panel.r > 0.38, low = Math.min(HOLD.low, mid ? panel.top - HOLD.pad : 1), top0 = 0.5 + HOLD.gap;
    // how far out you hold it: chosen once per grip from its size (and the view), so it never changes size in your hands.
    // A small thing comes in close (36 cm) and sits between the crosshair and the carry panel; a big one goes out towards
    // arm's length (60 cm) and runs off the bottom; nothing is wider than ~85% of the view (a phone held upright).
    const key = vw + 'x' + vh;
    if (!held.vd || held.vdKey !== key) {
      const sz = lb.getSize(_vv), hp = Math.max(sz.y, 0.6 * Math.max(sz.x, sz.z)), wp = Math.max(sz.x, sz.z);
      held.vd = Math.min(HOLD.reach, Math.max(clamp(hp / (2 * tanV * Math.max(0.16, low - top0)), HOLD.near, HOLD.far), wp / (2 * tanH * 0.85)));
      held.vdKey = key;
    }
    const d = held.vd, hf = h / (2 * d * tanV), wf = w / (2 * d * tanH); // its height and width, as fractions of the view
    // where: just right of centre, its top just under the crosshair; a small thing low, just above the carry panel (so
    // your forearms run down behind it). It ducks under the ghost if the ghost is in the way (keeping 45% in view).
    let cx = 0.5 + HOLD.x, top = Math.max(top0, low - hf);
    if (ghost && top + hf > ghost.t && top < ghost.b && cx + wf / 2 > ghost.l && cx - wf / 2 < ghost.r) top = Math.max(top, Math.min(1 - hf * 0.45, ghost.b + HOLD.pad));
    // tipping it to pour (the watering can): bring it up and in, the spout just under the crosshair, so you see the stream
    const pourK = clamp(Math.abs(t.holdRoll || 0) / 30, 0, 1);
    if (pourK) { held.pour = Math.max(held.pour || 0, pourK); }
    if (held.pour) { const p = held.pour; cx += (0.5 - wf * 0.05 - cx) * p; top += (0.5 + 0.02 - top) * p; if (!pourK) held.pour = Math.max(0, held.pour - 0.04); }
    // your turning and steps: it trails a few degrees behind a fast turn and rides your stride
    const lagX = held.lry == null ? 0 : angd(held.lry, P.ry) * D2R, lagY = held.lrx == null ? 0 : (P.rx - held.lrx) * D2R;
    const walk = Math.min(1, Math.hypot(W.vx, W.vz) / 140), ph = (W.bobT || 0) * Math.PI;
    const yc = top + hf / 2;
    const vx = ((2 * cx - 1) * tanH - lagX * 0.9 + Math.sin(ph) * 0.006 * walk) * d, vy = ((1 - 2 * yc) * tanV - lagY * 0.9 - Math.abs(Math.cos(ph)) * 0.012 * walk) * d;
    // its origin, so that its middle sits there, back to the y-down world
    _hp.set(vx - ocx, vy - ocy, -d - ocz).applyMatrix4(_hm);
    held.box = { ocx, ocy, ocz, w, h };
    return { x: _hp.x, y: -_hp.y, z: _hp.z, k: 1, d };
  }
  // ---------------------------------------------------------------- your hands, while you carry something
  // Rounded 1999 mitts hold it by its sides (palms behind the sides, thumbs across the front, fingers behind it, like
  // holding a Game Lad). Small light things use one hand. Your forearms come up from below the screen, elbows at your
  // sides (no upper arm, no long reach): only a short tapered jumper sleeve and its cuff show. Real-hand sized, like the
  // thing they hold; they ride its lag and bob. That is what makes a thing read as carried, not lying in the room.
  const ARM = { skin: '#e7b28c', sleeve: '#34476f', cuff: '#45598a', hand: 12.5 }; // (hand: palm + fingers, cm)
  let arms = null; const _aw = new T.Vector3(), _aa = new T.Vector3(), _ad = new T.Vector3(), _ay = new T.Vector3(0, 1, 0);
  function carryHandGeometry(sd) {
    const positions = [], indices = [], inn = -sd;
    // A closed, softly rounded palm and curled fingers, with a joined thumb web.
    // Keeping each section in centimetres avoids stretched block-shaped fingers.
    const loft = (rings, n) => {
      const start = positions.length / 3;
      const axis = new T.Vector3(), u = new T.Vector3(), v = new T.Vector3(), ref = new T.Vector3(0, 0, 1);
      for (let i = 0; i < rings.length; i++) {
        const r = rings[i], prev = rings[Math.max(0, i - 1)], next = rings[Math.min(rings.length - 1, i + 1)];
        axis.set(next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]).normalize();
        u.crossVectors(axis, ref).normalize(); v.crossVectors(axis, u).normalize();
        for (let j = 0; j < n; j++) { const t = j / n * Math.PI * 2, x = Math.cos(t) * r[3], z = Math.sin(t) * r[4]; positions.push(r[0] + u.x * x + v.x * z, (r[1] + u.y * x + v.y * z) * .86, r[2] + u.z * x + v.z * z); }
        if (i) for (let j = 0; j < n; j++) { const a = start + (i - 1) * n + j, b = start + (i - 1) * n + (j + 1) % n, c = start + i * n + j, d = start + i * n + (j + 1) % n; indices.push(a, b, c, b, d, c); }
      }
      for (const end of [0, rings.length - 1]) {
        const r = rings[end], centre = positions.length / 3; positions.push(r[0], r[1] * .86, r[2]);
        for (let j = 0; j < n; j++) { const a = start + end * n + j, b = start + end * n + (j + 1) % n; indices.push(...(end ? [centre, a, b] : [centre, b, a])); }
      }
    };
    loft([[0,-4.6,0,1.05,1.55],[0,-3.2,0,1.35,2.2],[0,-2.4,-.1,1.65,2.6],[0,-1.8,-.15,1.72,2.7],[0,-1.35,-.15,1.57,2.55],[0,-.75,-.15,1.77,2.75],[0,-.25,-.2,1.62,2.6],[inn*.05,.35,-.3,1.8,2.8],[inn*.1,.85,-.35,1.65,2.65],[inn*.2,1.5,-.5,1.75,2.6],[inn*.3,2.3,-.9,1.6,2.2],[inn*.6,3,-1.5,1.2,1.65],[inn,3.2,-2,.65,.9],[inn*1.3,3.15,-2.4,.2,.3]],12);
    loft([[0,.4,1.0,1.05,1.15],[-inn*.75,1.0,2.15,1.0,1.1],[inn*.6,1.65,3.85,.95,.95],[inn*2.1,2.15,4.55,.85,.85],[inn*3.0,2.55,4.7,.6,.65],[inn*3.35,2.7,4.7,.16,.2]],10);
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); geo.setIndex(indices); geo.computeVertexNormals(); return geo;
  }
  function armsMesh() {
    if (arms) return arms;
    const g = new T.Group(); g.matrixAutoUpdate = false; g.userData.noPick = true; g.visible = false;
    const skin = K.mat({ c: ARM.skin, sh: 2 }), sleeve = K.mat({ c: ARM.sleeve, sh: 4 }), cuff = K.mat({ c: ARM.cuff, sh: 4 });
    const tube = new T.CylinderGeometry(1, 1.25, 1, 12, 1, false), cap = new T.CylinderGeometry(1, 1, 1, 12, 1), wrist = new T.CylinderGeometry(1, 1, 1, 12, 1);
    const part = (geo, m) => { const o = new T.Mesh(geo, m); o.userData.noPick = true; o.userData.hand = true; o.matrixAutoUpdate = true; o.layers.set(1); o.renderOrder = 7; g.add(o); return o; };
    g.userData.sides = [-1, 1].map(sd => ({ sd, palm: part(carryHandGeometry(sd), skin), wrist: part(wrist, skin), sleeve: part(tube, sleeve), cuff: part(cap, cuff) }));
    root.add(g); return arms = g;
  }
  function hideArms() { if (arms && arms.visible) { arms.visible = false; dirty(); } }
  function armsTick(t) {
    const b = held && held.box; if (!b || held.drag || t.st !== 'held' || inspection) return hideArms();
    const g = armsMesh(), k = t.obj.scale.x || 1, o = t.obj.position;
    // the thing's middle and half-size, in view space (x right, y up, -z ahead), where it actually is this frame
    _aw.set(o.x, -o.y, o.z).applyMatrix4(_hmi); const cx = _aw.x + b.ocx * k, cy = _aw.y + b.ocy * k, cz = _aw.z + b.ocz * k;
    const hh = b.h * k / 2, tanV = Math.tan(camera.fov * D2R / 2);
    // the hand: a real hand's size, like the thing it holds
    const L = ARM.hand, pl = L * 0.53;
    g.matrix.copy(S).multiply(_hm); g.matrixWorldNeedsUpdate = true; g.visible = true;
    // its outermost corners left and right, as it is turned now: each hand takes the one on its side
    t.obj.updateMatrixWorld(true); const lb = localBox(t), ex = [null, null], corners = []; let zf = -1e9;
    for (const lx of [lb.min.x, lb.max.x]) for (const ly of [lb.min.y, lb.max.y]) for (const lz of [lb.min.z, lb.max.z]) {
      const p = new T.Vector3(lx, ly, lz).applyMatrix4(t.obj.matrixWorld).applyMatrix4(_hmi); corners.push(p); zf = Math.max(zf, p.z);
    }
    const gripY = clamp(Math.max(cy - hh * .35, -.76 * tanV * -(zf - 1.4)), cy - hh * .8, cy + hh * .4);
    const edge = p => { if (!ex[0] || p.x < ex[0].x - 1e-6 || Math.abs(p.x - ex[0].x) < 1e-6 && p.z > ex[0].z) ex[0] = p.clone(); if (!ex[1] || p.x > ex[1].x + 1e-6 || Math.abs(p.x - ex[1].x) < 1e-6 && p.z > ex[1].z) ex[1] = p.clone(); };
    // Intersect the actual turned box at one grip height; opposite extreme corners can be at different heights.
    for (let i = 0; i < 8; i++) for (const bit of [1, 2, 4]) if (!(i & bit)) {
      const a = corners[i], b = corners[i | bit], dy = b.y - a.y;
      if (Math.abs(dy) < 1e-6) { if (Math.abs(a.y - gripY) < 1e-4) { edge(a); edge(b); } }
      else { const q = (gripY - a.y) / dy; if (q >= 0 && q <= 1) edge(a.clone().lerp(b, q)); }
    }
    if (!ex[0] || !ex[1]) for (const p of corners) edge(p);
    const size = lb.getSize(_vv), small = size.toArray().every(n => n * k <= L * 1.5), flat = size.z < Math.min(size.x, size.y) * .45;
    const contactPoints=t.handGrips||t.obj.userData.handGrips;
    const grips = contactPoints?.length ? contactPoints.map(p => new T.Vector3(...p).applyMatrix4(t.obj.matrixWorld).applyMatrix4(_hmi)).sort((a,b)=>a.x-b.x) : null;
    const toLocal = flat && !grips ? new T.Matrix4().copy(t.obj.matrixWorld).invert().multiply(_hm) : null;
    for (const a of g.userData.sides) {
      const sd = a.sd, c = grips ? grips[sd < 0 ? 0 : grips.length-1] : ex[sd < 0 ? 0 : 1], visible = grips ? grips.length>1 || sd>0 : !small || sd > 0;
      for (const m of [a.palm, a.wrist, a.sleeve, a.cuff]) m.visible = visible;
      if (!visible) continue;
      const px = c.x + sd * .2, py = grips ? c.y : gripY, lean = -sd * .1;
      let front = c.z;
      if (toLocal) {
        // On a turned case the outer corner can be its back corner. Put the thumb on the real front face.
        const ray = new T.Ray(new T.Vector3(px - sd * 2.1, py + 1.6, zf + 10), new T.Vector3(0, 0, -1)).applyMatrix4(toLocal);
        const hit = ray.intersectBox(lb, new T.Vector3());
        if (hit) front = hit.applyMatrix4(t.obj.matrixWorld).applyMatrix4(_hmi).z;
      }
      const pz = front - 3.8;
      a.palm.position.set(px, py, pz); a.palm.rotation.set(0, 0, lean); a.palm.scale.setScalar(1);
      // the wrist, then the forearm: down and back towards you to an elbow just below the bottom of the view, tucked in
      // close (forearms only; the elbow is off screen, so there is never an upper arm or a long straight reach)
      const wx = px + Math.sin(lean) * pl * 0.5, wy = py - Math.cos(lean) * pl * 0.5;
      const ez = pz * 0.85, ex2 = (wx / -pz) * -ez + sd * L * 0.16, ey = -tanV * -ez * 1.08 - L * 0.2;
      _aa.set(ex2, ey, ez); _aw.set(wx, wy, pz); _ad.subVectors(_aw, _aa); const len = _ad.length(); _ad.normalize();
      const r = L * .14, q = a.sleeve.quaternion.setFromUnitVectors(_ay, _ad);
      // a bit of wrist, then the sleeve from just below it, its cuff at the wrist end
      a.wrist.position.copy(_aw).addScaledVector(_ad, -L * 0.06); a.wrist.quaternion.copy(q); a.wrist.scale.set(r * 0.86, L * 0.2, r * 0.86);
      const s0 = L * 0.16, sl = Math.max(L * 0.3, len - s0); // (from s0 below the wrist all the way to the elbow)
      a.sleeve.position.copy(_aw).addScaledVector(_ad, -(s0 + sl / 2)); a.sleeve.scale.set(r * 1.05, sl, r * 1.05);
      a.cuff.position.copy(_aw).addScaledVector(_ad, -(s0 + L * 0.06)); a.cuff.quaternion.copy(q); a.cuff.scale.set(r * 1.18, L * 0.14, r * 1.18);
    }
  }
  // where the ghost (where it will land) is on screen, as fractions of the view
  function ghostRect() {
    if (!ghostGroup || !ghostGroup.visible) return null;
    _vb.setFromObject(ghostGroup); if (_vb.isEmpty()) return null;
    let l = 1e9, r = -1e9, t = 1e9, b = -1e9;
    for (const x of [_vb.min.x, _vb.max.x]) for (const y of [_vb.min.y, _vb.max.y]) for (const z of [_vb.min.z, _vb.max.z]) { const q = toScreen(x, -y, z); if (!q) return null; l = Math.min(l, q.x / vw); r = Math.max(r, q.x / vw); t = Math.min(t, q.y / vh); b = Math.max(b, q.y / vh); }
    return r < 0 || l > 1 || b < 0 || t > 1 ? null : { l, r, t, b };
  }
  // Where you're reaching to with it (held.d, which + / − and the wheel change): what slots and the ghost are matched
  // against. Below the line of sight and a little right, never through a wall (the pose before the hands drew it small).
  function reachPos() {
    const t = THINGS[held.id], f = fwd(), m = t.local || { cx: 0, cz: 0, hx: t.hx, hz: t.hz, h: t.h }, R = holdSize(t);
    let d = held.d;
    const hit = pick(vw / 2, vh / 2, { skip: m2 => m2.userData.spot === held.id || isThingMesh(m2), far: d + R + 2 });
    if (hit && hit.dist < d + R + 2) d = Math.max(0, hit.dist - R - 2);
    const a = P.ry * D2R; _rt.set(Math.cos(a), 0, Math.sin(a)); _up.crossVectors(_rt, f);
    const down = t.holdOffset ? t.holdOffset.down : R + 3 + d * 0.05, right = t.holdOffset ? t.holdOffset.right : Math.min(28, R * 0.9 + 8);
    return { x: P.x + f.x * d + _up.x * down + _rt.x * right, y: P.y + f.y * d + _up.y * down + m.h / 2, z: P.z + f.z * d + _up.z * down + _rt.z * right };
  }
  // Where the full-size thing would be for the same picture (a scale about the eye), kept short of walls and of you.
  function heldVirtual(t, clampToWorld) {
    const k = t.obj.scale.x || 1, o = t.obj.position;
    let vx = P.x + (o.x - P.x) / k, vy = P.y + (o.y - P.y) / k, vz = P.z + (o.z - P.z) / k;
    if (clampToWorld) {
      const R = holdSize(t), dist = Math.hypot(vx - P.x, vy - P.y, vz - P.z), ux = (vx - P.x) / dist, uy = (vy - P.y) / dist, uz = (vz - P.z) / dist;
      const q = toScreen(vx, vy, vz), hit = q && pick(q.x, q.y, { skip: m2 => m2.userData.spot === t.id || isThingMesh(m2), far: dist + R });
      // (no further than you could reach: a big thing drawn small would otherwise land two metres away when let go)
      let want = Math.min(dist, Math.max(120, (held ? held.d : 60) + R), hit ? hit.dist - R - 2 : dist);
      want = Math.max(want, RAD + R + 4);
      vx = P.x + ux * want; vy = P.y + uy * want; vz = P.z + uz * want;
    }
    return { x: vx, y: vy, z: vz };
  }
  // Release the held pose into the world; keep a real-size drop short of walls and the player's body.
  function unshrink(t, clampToWorld) {
    const k = t.obj.scale.x || 1; t._hk = false; if (k === 1 && !clampToWorld) return;
    const v = heldVirtual(t, clampToWorld); if (Number.isFinite(v.x + v.y + v.z)) t.obj.position.set(v.x, v.y, v.z); t.obj.scale.setScalar(1); t.obj.updateMatrixWorld(true); dirty();
  }
  const isThingMesh = m => { let o = m; while (o) { if (o.userData && o.userData.thing) return true; o = o.parent; } return false; };
  const isHeldMesh = m => {if(!held)return false;for(let o=m;o;o=o.parent)if(o===THINGS[held.id].obj||o===ghostGroup)return true;return false;};
  let aimPt = null, aimT = 0; // where the crosshair points (checked a few times a second while holding)
  const REACH = 260;
  // One crosshair raycast per pose serves the ghost, the highlighted slot and the "F opens the door" prompt.
  let cpKey = '', cpHit = null;
  function carryPick(fresh) {
    const key = [P.x, P.y, P.z, P.rx, P.ry, vw, vh, held && held.id].join();
    if (!fresh && key === cpKey) return cpHit;
    cpKey = key; cpHit = pick(vw / 2, vh / 2, { skip: isHeldMesh, far: Math.max(REACH, 300) });
    return cpHit;
  }
  function nearSnap(t, x, y, z, fresh) {
    let best = null;
    const now = performance.now();
    if (fresh || now - aimT > 120) { aimT = now; const h = carryPick(fresh); aimPt = h ? h.p : null; }
    const f = fwd();
    for (const id in SNAPS) {
      const s = SNAPS[id]; if (s.room && cur && s.room !== cur.id) continue;
      if (s.enabled && !s.enabled()) continue; if (s.accepts && !s.accepts(t.kind, t)) continue;
      if (s.aims && !s.aims(t)) continue;
      let d = Math.hypot(x - s.x, (y - t.h / 2) - s.y, z - s.z);
      if (aimPt) d = Math.min(d, Math.hypot(aimPt.x - s.x, aimPt.y - s.y, aimPt.z - s.z) + 2); // (pointing right at the slot counts too)
      // ...and so does the crosshair passing close by it, within reach
      const vx = s.x - P.x, vy = s.y - P.y, vz = s.z - P.z, along = vx * f.x + vy * f.y + vz * f.z;
      if (along > 10 && along < REACH) d = Math.min(d, Math.hypot(vx - f.x * along, vy - f.y * along, vz - f.z * along) + 4);
      if (d <= s.r && (!best || d < best.d)) best = { s, d };
    }
    return best && best.s;
  }
  // The footprint the ghost will stand on and the slot it will click into: drawn by showTargets (shape-hugging, js/hs-glow.js)
  const GL = window.HouseGlow, cg = { foot: null, snap: null, decals: null, objs: new Map(), floorDecals: null, list: [] };
  const isRound = t => !!(t && (t.round || t.physics && (t.physics.round || (t.physics.parts || []).length === 1 && t.physics.parts[0].t === 'cyl')));
  function floorAim(t){ const g = computeGhost(t, null, null, true); return g && !g.snap ? { target: g.ok ? { room: g.room, x: g.x, z: g.z, y0: g.y } : null, aim: { room: g.room, x: g.x, z: g.z, y0: g.y }, ry: g.ry, ok: g.ok, why: g.why, y: g.y } : null; }
  function floorGlow(p,t){ // the footprint the ghost will stand on: a ring the shape of its base (a circle for round things)
    if(!p){cg.foot=null;return}
    const m=t.local||{cx:0,cz:0,hx:t.hx,hz:t.hz},a=p.ry*D2R,ox=m.cx*Math.cos(a)+m.cz*Math.sin(a),oz=-m.cx*Math.sin(a)+m.cz*Math.cos(a);
    cg.foot={x:p.x+ox,y:p.y,z:p.z+oz,ry:p.ry,hx:m.hx+1,hz:m.hz+1,round:isRound(t),color:p.ok?GL.GREEN:GL.RED};
  }
  function snapGlow(s) { cg.snap = s || null; }

  // ---------------------------------------------------------------- the ghost: a see-through copy where the carried thing will land
  // green = it fits there, red = something's in the way, gold = it clicks into a highlighted place. Uses the physics colliders.
  const GP = { t: null, at: 0, res: null, key: '', route: null };
  // the ghost: a faint fill plus a fresnel rim on the carried thing's own shape (one merged geometry, two draws)
  const ghostFill = new T.MeshBasicMaterial({ color: 0x8fdc6a, transparent: true, opacity: 0.2, depthWrite: false }), ghostRim = GL.rimMat(GL.GREEN, 0.95);
  let ghostGroup = null, ghostFor = null;
  function ghostMesh(t) {
    if (ghostGroup && ghostFor === t) return ghostGroup;
    clearGhost();
    const g = ghostGroup = new T.Group(); ghostFor = t; g.userData.noPick = true; g.matrixAutoUpdate = true;
    const geo = GL.merge(t.obj, { fresh: true });
    for (const [mt, ro] of [[ghostFill, 6], [ghostRim, 7]]) { const m = new T.Mesh(geo, mt); m.userData.noPick = true; m.raycast = () => {}; m.renderOrder = ro; g.add(m); }
    g.visible = false; root.add(g);
    return g;
  }
  function clearGhost() { if (ghostGroup) { ghostGroup.parent?.remove(ghostGroup); ghostGroup.children[0]?.geometry.dispose(); ghostGroup = null; ghostFor = null; } }
  function showGhost(t, g) {
    if (!g) { if (ghostGroup) ghostGroup.visible = false; floorGlow(null); return; }
    const mesh = ghostMesh(t);
    const col = g.snap ? GL.GOLD : g.ok ? GL.GREEN : GL.RED; ghostFill.color.set(col); ghostRim.uniforms.uColor.value.set(col);
    ghostFill.opacity = g.snap ? 0.26 : g.ok ? 0.2 : 0.24; ghostRim.uniforms.uStrength.value = g.snap ? 1.1 : 0.95;
    mesh.position.set(g.x, renderY(t, g.snap ? g.y : softY(t, { room: g.room, x: g.x, y: g.y, z: g.z, ry: g.ry })), g.z); mesh.rotation.set((g.rx || 0) * D2R, (g.ry || 0) * D2R, (g.rz || 0) * D2R, 'YXZ');
    mesh.visible = true;
    floorGlow(g.snap ? null : g, t);
    dirty();
  }
  const WHY = { solid: "Something's in the way", door: "The door's in the way", player: "You're standing there", floor: 'It goes on the floor', path: 'That would block the way', far: 'Too far away', stairs: 'Not on the stairs', door_zone: 'Keep the doorway clear', pc: 'Keep the way to the PC clear' };
  function whyText(why) { if (!why) return ''; if (why.startsWith('body:')) { const o = THINGS[why.slice(5)]; const n = o ? (typeof o.label === 'function' ? o.label() : o.label) : 'Something'; return n + ' is in the way'; } return WHY[why] || "Something's in the way"; }
  function computeGhost(t, sx, sy, fresh) {
    const now = performance.now();
    if (!fresh && GP.res && GP.t === t && now - GP.at < 40) return GP.res;
    const o = reachPos(), sn = nearSnap(t, o.x, o.y, o.z, fresh); // (the reach point stays separate from the first-person model)
    let res;
    if (sn) { const p = sn.pose || { x: sn.x, y: sn.y, z: sn.z, ry: sn.ry || 0 }; res = { snap: sn, ok: true, room: sn.room || (cur && cur.id), x: p.x, y: p.y, z: p.z, ry: p.ry || 0, rx: p.rx || 0, rz: p.rz || 0 }; }
    else res = freeGhost(t, sx, sy);
    GP.t = t; GP.at = now; GP.res = res;
    return res;
  }
  function freeGhost(t, sx, sy) {
    const ph = physReady(), b = bodyFor(t), f = fwd(), m = t.local || { cx: 0, cz: 0, hx: t.hx, hz: t.hz, h: t.h };
    const ry = -P.ry + held.ry + (t.faceYou ? 180 : 0), R = Math.hypot(m.hx, m.hz);
    const hit = sx == null && sy == null ? carryPick() : pick(sx, sy, { skip: isHeldMesh, far: REACH });
    let x, z, fromY;
    if (hit && hit.n && hit.n.y > 0.6) { x = hit.p.x; z = hit.p.z; fromY = hit.p.y - 0.6;
      // aimed at a soft top (the duvet sags below the bed's slab in places): it goes on the bed, never through it and under
      const sf = SOFT.find(q => q.room === (cur && cur.id) && x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1 && Math.abs(hit.p.y - q.y) < 12); if (sf) fromY = Math.min(fromY, sf.y - 0.6); }
    else { // a wall, or nothing within reach: lower it from your hands, kept clear of the wall you're facing
      const hp = t.obj.position; x = hp.x; z = hp.z; fromY = restOf(t, hp.y);
      if (hit) { const back = Math.max(0, R + 2 - Math.hypot(hit.p.x - x, hit.p.z - z)); x -= f.x * back; z -= f.z * back; }
    }
    // never on yourself: ease it out to just beyond your feet
    const ox = x - W.x, oz = z - W.z, od = Math.hypot(ox, oz), need = RAD + R + 2;
    if (od < need) { const ux = od > 1 ? ox / od : Math.sin(P.ry * D2R), uz = od > 1 ? oz / od : -Math.cos(P.ry * D2R); x = W.x + ux * need; z = W.z + uz * need; }
    const r = roomAt(x, z, W.lvl) || roomOfPoint({ x, y: fromY, z }) || cur;
    const res = { snap: null, ok: false, why: null, room: r ? r.id : cur && cur.id, x, z, y: LV[W.lvl], ry, rx: t.rx || 0, rz: t.rz || 0 };
    if (!ph || !b || !r) { res.why = 'far'; return res; }
    if (Math.hypot(x - W.x, z - W.z) > REACH) { res.why = 'far'; return res; }
    const rest = ph.findRest(b, r.lvl, x, z, ry, fromY, t.id, b.sw);
    res.y = rest.y; res.ok = rest.ok; res.why = rest.why;
    if (res.ok && grids.stairs.some(s => x > s.x0 - 6 && x < s.x1 + 6 && z > s.z0 && z < s.z1 && r.lvl === 'U' && z > s.m0 - 30)) { res.ok = false; res.why = 'stairs'; }
    if (res.ok && t.floorOnly && !rest.onFloor) { res.ok = false; res.why = 'floor'; }
    if (res.ok && t.obstacle && rest.onFloor) { // furniture on the floor keeps doorways, the stairs and the way to the PC clear
      const why = floorRules(t, r, x, z, ry);
      if (why) { res.ok = false; res.why = why; }
      else { const key = [r.id, Math.round(x / 5), Math.round(z / 5), Math.round(ry / 15)].join(); if (GP.key !== key) { GP.key = key; GP.route = placementKeepsRoutes(t, r, { x, z }, ry); } if (!GP.route) { res.ok = false; res.why = 'path'; } }
    }
    if (res.ok && t.canPlace && t.canPlace({ room: res.room, x, z, y0: res.y }) === false) { res.ok = false; res.why = 'solid'; }
    return res;
  }
  function floorRules(t, r, x, z, ry) {
    const a = ry * D2R, hx = Math.abs(Math.cos(a)) * t.hx + Math.abs(Math.sin(a)) * t.hz, hz = Math.abs(Math.sin(a)) * t.hx + Math.abs(Math.cos(a)) * t.hz;
    const rect = { x0: x - hx, z0: z - hz, x1: x + hx, z1: z + hz }, over = b => rect.x1 > b.x0 && rect.x0 < b.x1 && rect.z1 > b.z0 && rect.z0 < b.z1;
    if (grids.walk.some(w => w.lvl === r.lvl && w.door && over({ x0: w.x0 - RAD - 10, x1: w.x1 + RAD + 10, z0: w.z0 - RAD - 10, z1: w.z1 + RAD + 10 }))) return 'door_zone';
    if (grids.stairs.some(s => over({ x0: s.x0 - 12, x1: s.x1 + 12, z0: s.z0 - 35, z1: s.z1 + 35 }))) return 'stairs';
    if (t.id !== 'chair' && r.id === 'bedroom' && over({ x0: -54, x1: 30, z0: 33, z1: 100 })) return 'pc';
    return null;
  }

  // ---------------------------------------------------------------- the places a carried thing can go glow, in their own shape
  // A slot that belongs to a thing (the washing basket, the bin: snap.glow = a THINGS id, an Object3D or a function giving
  // one) gets a rim and outline on its own geometry plus a footprint ring. Empty accepting slots get shallow rings;
  // the carried model appears only at its actual placement ghost. The active slot burns brighter. js/hs-glow.js.
  const TARGET_MAX = 48;
  let targetsAt = 0, targetCount = 0, targetsFor = null;
  const _tm = new T.Matrix4(), _tq = new T.Quaternion(), _te = new T.Euler(), _tp = new T.Vector3(), _ts = new T.Vector3(), _rootInv = new T.Matrix4(), _box = new T.Box3();
  function glowTarget(s) { // { obj, foot } for a slot that belongs to something, else null
    let g = s.glow; if (typeof g === 'function') { try { g = g(); } catch (e) { g = null; } }
    if (typeof g === 'string') {
      const t = THINGS[g]; if (!t || !t.obj || t.at.hide || !t.obj.visible || t.st === 'held') return null;
      const m = t.local || measureLocal(t.obj), a = (t.at.ry || 0) * D2R, round = isRound(t), cyl = round && t.physics && t.physics.parts && t.physics.parts[0];
      return { obj: t.obj, foot: { x: t.at.x + m.cx * Math.cos(a) + m.cz * Math.sin(a), y: t.at.y, z: t.at.z - m.cx * Math.sin(a) + m.cz * Math.cos(a), ry: t.at.ry || 0, hx: cyl ? cyl.r : m.hx, hz: cyl ? cyl.r : m.hz, round } };
    }
    if (g && g.isObject3D && g.visible !== false) {
      _box.setFromObject(g); if (_box.isEmpty()) return null; // (world space: the root flips y)
      return { obj: g, foot: { x: (_box.min.x + _box.max.x) / 2, y: -_box.min.y, z: (_box.min.z + _box.max.z) / 2, ry: 0, hx: (_box.max.x - _box.min.x) / 2, hz: (_box.max.z - _box.min.z) / 2, round: !!s.round } };
    }
    return null;
  }
  function objGlow(obj, active, now) {
    let e = cg.objs.get(obj);
    if (!e) {
      const geo = GL.merge(obj, { maxTris: 6000 });
      e = { rim: new T.Mesh(geo, GL.rimMat(GL.GOLD, 0.5, { grow: 0.12 })), hull: new T.Mesh(geo, GL.hullMat(GL.GOLD, 0.6)), used: false };
      for (const [m, ro] of [[e.hull, 4], [e.rim, 5]]) { m.matrixAutoUpdate = false; m.userData.noPick = true; m.raycast = () => {}; m.renderOrder = ro; m.frustumCulled = false; root.add(m); }
      cg.objs.set(obj, e);
    }
    e.used = true;
    const pulse = active ? 0.86 + 0.14 * Math.sin(now / 140) : 0.72 + 0.28 * Math.sin(now / 300);
    for (const m of [e.rim, e.hull]) { m.matrix.multiplyMatrices(_rootInv, obj.matrixWorld); m.matrixWorldNeedsUpdate = true; m.visible = true; }
    e.rim.visible = Q.tier !== 'potato';
    e.rim.material.uniforms.uStrength.value = (active ? 0.42 : 0.18) * pulse;
    e.hull.material.uniforms.uStrength.value = (active ? 0.95 : 0.55) * pulse;
    e.hull.material.uniforms.uColor.value.set(active ? '#ffe680' : GL.GOLD);
  }
  function showTargets(t, now) {
    if (!cg.decals) { cg.decals = GL.decals(TARGET_MAX); cg.decals.mesh.name = 'accepting-slot-glows'; root.add(cg.decals.mesh); cg.floorDecals = GL.decals(1); cg.floorDecals.mesh.name = 'placement-footprint'; root.add(cg.floorDecals.mesh); }
    if (!t) {
      cg.decals.hide(); for (const e of cg.objs.values()) e.rim.visible = e.hull.visible = false;
      cg.floorDecals.hide(); targetCount = 0; cg.list = []; targetsFor = null; return;
    }
    if (now - targetsAt > 350 || targetsFor !== t) {
      targetsAt = now; targetsFor = t; targetCount = 0; cg.list = [];
      for (const id in SNAPS) {
        if (targetCount >= TARGET_MAX) break;
        const s = SNAPS[id]; if (s.room && !visSet.has(s.room)) continue;
        if (s.enabled && !s.enabled()) continue; if (s.accepts && !s.accepts(t.kind, t)) continue;
        const p = s.pose || s, c = s.preview || p, b = s.box || [s.r * 0.9, 1.5, s.r * 0.9];
        if (![c.x, c.y, c.z, ...b].every(Number.isFinite) || Math.hypot(c.x - P.x, c.z - P.z) > 900) continue;
        const tg = glowTarget(s);
        // (an open slot's ring lies where the thing will rest; a hidden one's at the bottom of its box)
        const foot = tg ? tg.foot : { x: c.x, y: !s.hide && s.pose && Number.isFinite(p.y) ? p.y : c.y + b[1] / 2, z: c.z, ry: p.ry || 0, hx: b[0] / 2, hz: b[2] / 2, round: !!s.round };

        cg.list.push({ s, obj: tg && tg.obj, foot }); targetCount++;
      }
    }
    const D = cg.decals, pulse = 0.8 + 0.2 * Math.sin(now / 260);
    root.updateMatrix(); _rootInv.copy(root.matrix).invert(); // (the root's parent is the scene: its matrix is its world)
    D.begin();
    for (const e of cg.objs.values()) e.used = false;
    for (const it of cg.list) {
      const active = cg.snap === it.s, f = it.foot;
      D.add(f.x, f.y, f.z, f.ry, f.hx, f.hz, f.round, active ? '#ffe680' : GL.GOLD, active ? 1 : 0.62);
      if (it.obj) objGlow(it.obj, active, now);
    }
    D.end(pulse);
    const floor = cg.floorDecals; floor.begin();
    if (cg.foot && !cg.snap) { const f = cg.foot; floor.add(f.x, f.y, f.z, f.ry, f.hx, f.hz, f.round, f.color, 0.9); }
    floor.end(pulse);
    for (const e of cg.objs.values()) if (!e.used) e.rim.visible = e.hull.visible = false;
  }

  // ---------------------------------------------------------------- putting things down
  // E / click: set it down exactly where its ghost is (or into the highlighted place). X lets go: it drops from your hands.
  function drop(sx, sy, how) {
    if (!held) return false; const t = THINGS[held.id];
    if (held.drag) return letGo();
    const g = computeGhost(t, sx, sy, true);
    if (g.snap) return snapIn(t, g.snap);
    if (!g.ok) {
      if (how === 'api') return letGo(); // a pack letting go on the player's behalf: it must leave the hands
      ui.toast("Won't fit there", whyText(g.why) + '. Aim where the ghost turns green, X to drop it, or Q to put it back.');
      physicalSound('deny'); return false;
    }
    if (t.canPlace && t.canPlace({ room: g.room, x: g.x, z: g.z, y0: g.y }) === false) return false;
    setDown(t, g);
    return true;
  }
  function releaseHold() { held = null; hideArms(); ui.holdBar(null); snapGlow(null); floorGlow(null); showGhost(null); showTargets(null); GP.res = null; saveGrip(); }
  // the gentle place: a short glide from your hands down onto the spot, then it rests there (asleep: no settling wobble)
  function setDown(t, g, ms) {
    releaseHold(); unshrink(t);
    const p0 = { x: t.obj.position.x, y: t.obj.position.y, z: t.obj.position.z, ry: t.obj.rotation.y / D2R, rx: t.obj.rotation.x / D2R, rz: t.obj.rotation.z / D2R };
    const room = g.room || (cur && cur.id); if (ROOMS[room]) moveTo(t, room);
    t.st = 'anim'; const t0 = performance.now(), dur = ms == null ? 230 : ms, gy = renderY(t, softY(t, { room, x: g.x, y: g.y, z: g.z, ry: g.ry }));
    emit('place', t.id);
    anims.set('set:' + t.id, n => {
      const k = dur ? ease(Math.min(1, (n - t0) / dur)) : 1;
      t.obj.position.set(lerp(p0.x, g.x, k), lerp(p0.y, gy, k), lerp(p0.z, g.z, k));
      t.obj.rotation.set(lerp(p0.rx, g.rx || 0, k) * D2R, (p0.ry + angd(p0.ry, g.ry) * k) * D2R, lerp(p0.rz, g.rz || 0, k) * D2R, 'YXZ');
      if (k < 1) return true;
      t.st = 'rest'; t.at = { room, x: g.x, y: g.y, z: g.z, ry: g.ry, sw: t.at.sw || 0 }; t.rx = g.rx || 0; t.rz = g.rz || 0;
      place(t); layerFor(t);
      const b = t.body; if (b && PH.overlapping(b)) PH.wake(b); // somebody moved into the spot meanwhile: let physics sort it out
      physicalSound('handle', { weight: thingWeight(t), put: true });
      saveThings(); emit('rest', t.id); rescueQ.add(t);
      return false;
    });
    return true;
  }
  // X: let go. It leaves your hands with your hands' motion, falls, bounces a little and settles (or slides off an edge).
  function letGo() {
    if (!held) return false; const t = THINGS[held.id], drag = held.drag, hv = held.hv;
    releaseHold();
    if (drag) { t.st = 'rest'; const b = t.body; t.at.room = roomAt(b.x, b.z, b.lvl)?.id || t.at.room; bodyState(t); renderBody(t); syncBody(t); layerFor(t); physicalSound('handle', { weight: thingWeight(t), put: true }); saveThings(); emit('place', t.id); emit('rest', t.id); return true; }
    unshrink(t, true); // (full size where you saw it, kept out of walls and out of you)
    const o = t.obj.position, r = roomAt(o.x, o.z, W.lvl) || cur;
    t.st = 'rest'; t.at = { room: r.id, x: o.x, y: restOf(t, o.y), z: o.z, ry: t.obj.rotation.y / D2R, sw: t.at.sw || 0 };
    moveTo(t, r.id);
    const b = syncBody(t, true);
    if (b) { const k = Math.min(1, 140 / Math.max(1, Math.hypot(hv.x, hv.z))) * 0.6; b.vx = hv.x * k; b.vz = hv.z * k; b.vy = clamp(hv.y * 0.6, -150, 250); b.grounded = false; }
    layerFor(t); emit('place', t.id);
    return true;
  }
  function roomOfPoint(p) { for (const id of visSet) { const r = ROOMS[id]; if (r.area.some(a => p.x >= a[0] - 1 && p.x <= a[2] + 1 && p.z >= a[1] - 1 && p.z <= a[3] + 1) && Math.abs((p.y || LV[r.lvl]) - LV[r.lvl]) < 290) return r; } return null; }
  function moveTo(t, rid) { const r = ROOMS[rid]; if (r && t.obj.parent !== r.things) r.things.add(t.obj); }
  function snapIn(t, s) {
    const destination = Object.assign({}, s.pose || {x:s.x,y:s.y,z:s.z,ry:s.ry||0});
    if (s.onBegin && s.onBegin(t, destination) === false) return;
    releaseHold(); unshrink(t);
    const p0 = { x: t.obj.position.x, y: t.obj.position.y, z: t.obj.position.z, ry: t.obj.rotation.y / D2R, rx: t.obj.rotation.x / D2R, rz: t.obj.rotation.z / D2R };
    const p1 = destination;
    t.st = 'anim'; const t0 = performance.now(), ms = 380;
    if (t.body) bodyState(t);
    anims.set('snap:' + t.id, n => {
      const k = ease(Math.min(1, (n - t0) / ms));
      t.obj.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, renderY(t,p1.y), k), lerp(p0.z, p1.z, k));
      t.obj.rotation.set(lerp(p0.rx, p1.rx || 0, k) * D2R, (p0.ry + angd(p0.ry, p1.ry || 0) * k) * D2R, lerp(p0.rz, p1.rz || 0, k) * D2R, 'YXZ');
      if (k < 1) return true;
      t.st = 'snap'; t.snap = s.id; t.at = { room: s.room || (cur && cur.id), x: p1.x, y: p1.y, z: p1.z, ry: p1.ry || 0, hide: !!s.hide };
      t.rx = p1.rx || 0; t.rz = p1.rz || 0;
      if (s.hide) t.obj.visible = false;
      syncBody(t); // clicked in: a fixed solid at the slot's pose (or nothing, if the slot hides it)
      layerFor(t);
      physicalSound('handle', {weight:thingWeight(t),put:true});
      if (s.onSnap) try { s.onSnap(t); } catch (e) { console.error(e); }
      emit('snap', s.id, t.id); saveThings();
      return false;
    });
  }
  function putBack() { // Q / return action: it goes back where you got it from
    if (!held) return; const t = THINGS[held.id], f = held.from, was = held.was, drag = held.drag;
    releaseHold();
    if (was && SNAPS[was]) {const s=SNAPS[was];if(!s.accepts||s.accepts(t.kind,t)){t.at=f;return snapIn(t,s);}}
    const back = { room: f.room, x: f.x, y: f.y, z: f.z, ry: f.ry || 0, rx: t.rx || 0, rz: t.rz || 0 };
    // never back into thin air: if what it stood on has gone (or it was caught mid-fall), it lands on what's there now
    // (a thing that lives in mid-air, like a decoration hung up at home, keeps its authored pose)
    if (!drag && ROOMS[f.room] && !(t.home && f.room === t.home.room && Math.hypot(f.x - t.home.x, f.y - t.home.y, f.z - t.home.z) < 1) && physReady()) {
      const b = bodyFor(t); if (b) { const rest = PH.findRest(b, ROOMS[f.room].lvl, f.x, f.z, f.ry || 0, f.y - 0.5, t.id, b.sw); if (rest.y > f.y + 0.5) back.y = rest.y; }
    }
    if (drag) { t.st = 'rest'; bodyState(t); }
    setDown(t, back, drag ? 420 : 300);
    // (if something now stands where it was, physics nudges it clear when it lands: see setDown)
  }
  // Somewhere sensible to leave what you're carrying when you go to the PC or a screen: where its ghost is, else back.
  function setAside() {
    if (!held) return;
    const t = THINGS[held.id];
    if (held.drag) { letGo(); return; }
    const g = computeGhost(t, null, null, true);
    if (g && g.ok && !g.snap) setDown(t, g); else putBack();
  }
  // things in front of boot.js's PC (as you see it now) are drawn on the second canvas, over it; so is whatever you're holding
  function pcParts() { const L = Lb(); return [[L.mx - 19, -40, -19, L.mx + 19, 0, 1], [L.tx - 10, -42.3, L.tz - 17, L.tx + 10, 0, L.tz + 19], [L.kx - 15, -3.5, 6, L.kx + 15, 0, 17.5], [L.ux - 7, -3, L.uz - 8, L.ux + 7, 0, L.uz + 8]]; }
  function scrBox(x0, y0, z0, x1, y1, z1) {
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9, dd = 0, n = 0;
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) { const p = toScreen(x, y, z); if (!p) return null; a = Math.min(a, p.x); b = Math.min(b, p.y); c = Math.max(c, p.x); d = Math.max(d, p.y); dd += p.d; n++; }
    return { a, b, c, d, dep: dd / n };
  }
  function frontOf(t) {
    if ((t.st === 'held' && !(held && held.id === t.id && held.drag)) || t.st === 'inspect' || t.st === 'settle' || t.inspectFront) return true;
    if (t.frontAnchor && THINGS[t.frontAnchor]) return frontOf(THINGS[t.frontAnchor]);
    const a = t.at; if (a.hide || a.room !== 'bedroom' || !pcOn || mode === 'follow') return false;
    const tb = scrBox(a.x - t.hx, a.y - t.h, a.z - t.hz, a.x + t.hx, a.y, a.z + t.hz); if (!tb) return false;
    for (const q of pcParts()) {
      const pbx = scrBox(q[0], q[1], q[2], q[3], q[4], q[5]); if (!pbx) continue;
      if (tb.c < pbx.a || tb.a > pbx.c || tb.d < pbx.b || tb.b > pbx.d) continue; // not overlapping on screen
      const on = a.y <= q[1] + 1.5 && a.x + t.hx > q[0] && a.x - t.hx < q[3] && a.z + t.hz > q[2] && a.z - t.hz < q[5];
      if (on || tb.dep < pbx.dep - 2) return true;
    }
    return false;
  }
  function layerFor(t) {
    const shadowKey = t.st + (t.airborne ? '~' : '');
    if (t.shadowState !== shadowKey) {t.shadowState = shadowKey; t.obj.traverse(o => {if (o.userData.contactShadow) o.visible = !t.airborne && (t.st === 'rest' || t.st === 'snap' || (t.st === 'held' && held && held.id === t.id && held.drag));});}
    const f = frontOf(t); if (f === t.front) return; t.front = f; t.obj.traverse(o => o.layers.set(f ? 1 : 0));
  }
  // Big furniture (the chair, the beanbag) isn't lifted to your face: you take hold of it and slide it along the floor in
  // front of you. It collides with everything (so the chair tucks under the desk as far as its back allows) and pushes
  // lighter things out of the way. If it catches on something and you walk off, you let go of it.
  let dragSound = 0;
  function dragTick(t, dt) {
    const b = t.body; if (!b) { letGo(); return; }
    const a = P.ry * D2R, fx = Math.sin(a), fz = -Math.cos(a), reach = RAD + 12 + b.rad * 0.95; // (an arm's length: the chair's back never fills the view)
    const tx = W.x + fx * reach, tz = W.z + fz * reach;
    let mx = tx - b.x, mz = tz - b.z; const len = Math.hypot(mx, mz), cap = 260 * dt;
    if (len > cap) { mx *= cap / len; mz *= cap / len; }
    const x0 = b.x, z0 = b.z;
    if (len > 0.05) PH.tryMove(b, mx, mz);
    const want = held.rel - P.ry + held.ry, dr = clamp(angd(b.ry, want), -240 * dt, 240 * dt);
    if (Math.abs(dr) > 0.01) PH.tryTurn(b, dr, 0);
    renderBody(t);
    const moved = Math.hypot(b.x - x0, b.z - z0);
    if (moved > 0.25 && performance.now() > dragSound) { dragSound = performance.now() + 170; physicalSound(t.physics?.castors ? 'roll' : 'scrape', { weight: thingWeight(t), speed: moved / Math.max(dt, 1e-3) }); }
    if (Math.hypot(tx - b.x, tz - b.z) > reach + 55) { letGo(); ui.toast("It's caught", 'You let go of ' + (typeof t.label === 'function' ? t.label() : t.label).replace(/^(The|My) /, 'the ') + '. Press E on it to take hold again.'); }
  }
  // Contact shadows for grab-API props that do not model their own (phones, toys, boxes...): one instanced,
  // depth-write-free soft rectangle per prop, a single draw call per room. Shown only while the prop rests
  // upright on something; hidden while carried, falling, hidden or stood on edge in a shelf slot.
  const PROP_SHADOW = { geo: null, mat: null, m: new T.Matrix4(), q: new T.Quaternion(), e: new T.Euler(), s: new T.Vector3(), p: new T.Vector3() };
  function propShadowCandidate(t) {
    if (t.autoShadow !== undefined) return t.autoShadow;
    let own = false, mesh = false; t.obj.traverse(o => { if (o.userData.contactShadow) own = true; else if (o.isMesh) mesh = true; });
    return t.autoShadow = !own && mesh && !t.noAutoShadow && t.hx * t.hz < 1600 && t.hx > 1.2 && t.hz > 1.2;
  }
  function tickPropShadows() {
    for (const id in ROOMS) { const r = ROOMS[id]; if (r.propShadows) r.propShadows.userData.n = 0; }
    for (const id in THINGS) {
      const t = THINGS[id], r = ROOMS[t.at.room];
      if (!r || !r.group.visible || !propShadowCandidate(t)) continue;
      if (!(t.st === 'rest' || t.st === 'snap') || t.at.hide || !t.obj.visible || t.obj.parent !== r.things || Math.abs(t.rx || 0) > 20 || Math.abs(t.rz || 0) > 20) continue;
      let ms = r.propShadows;
      if (!ms) {
        if (!PROP_SHADOW.geo) { PROP_SHADOW.geo = K.shadowGeo(true, 1, 1, 0.24); PROP_SHADOW.mat = K.shadowMaterial(true, 0.62); }
        ms = r.propShadows = new T.InstancedMesh(PROP_SHADOW.geo, PROP_SHADOW.mat, 160); ms.name = 'prop-contact-shadows';
        ms.frustumCulled = false; ms.renderOrder = 2; ms.userData.noPick = true; ms.userData.contactShadow = true; ms.userData.n = 0; ms.count = 0; r.things.add(ms);
      }
      const n = ms.userData.n; if (n >= 160) continue;
      const o = t.obj.position, pad = Math.min(5, 0.8 + Math.min(t.hx, t.hz) * 0.35);
      PROP_SHADOW.e.set(0, t.obj.rotation.y, 0); PROP_SHADOW.q.setFromEuler(PROP_SHADOW.e);
      PROP_SHADOW.s.set(t.hx * 2 + pad * 2, 1, t.hz * 2 + pad * 2); PROP_SHADOW.p.set(o.x, o.y, o.z);
      ms.setMatrixAt(n, PROP_SHADOW.m.compose(PROP_SHADOW.p, PROP_SHADOW.q, PROP_SHADOW.s)); ms.userData.n = n + 1;
    }
    for (const id in ROOMS) { const ms = ROOMS[id].propShadows; if (!ms) continue; if (ms.count !== ms.userData.n) { ms.count = ms.userData.n; } ms.instanceMatrix.needsUpdate = true; }
  }
  function tickThings(dt) {
    let any = false;
    const now = performance.now();
    // a job, the story or Mom took it out of your hands: let the grip go quietly
    if (held && (!THINGS[held.id] || !['held', 'settle'].includes(THINGS[held.id].st))) { const t = THINGS[held.id]; releaseHold(); if (t && t._hk && t.st !== 'inspect') { t.obj.scale.setScalar(1); t._hk = false; } if (t && t.body) bodyState(t); }
    if (!held || held.drag) hideArms();
    if (!held) { snapGlow(null); floorGlow(null); if (ghostGroup) ghostGroup.visible = false; showTargets(null); }
    if (held) {
      const t = THINGS[held.id], live = !controlsPaused && (mode === 'walk' || mode === 'glide' || mode === 'focus' && focusS?.o.seatId) && !inspection;
      if (held.drag) { if (live) dragTick(t, dt); showGhost(null); snapGlow(null); showTargets(null); ui.carry(t, { drag: true }); }
      else {
        // the view the hands follow lags a little behind fast turns (a few degrees at most), then catches up
        const lag = 1 - Math.pow(0.0008, dt);
        held.lry = held.lry == null ? P.ry : held.lry + clamp(angd(held.lry, P.ry) * lag, -40, 40); if (Math.abs(angd(held.lry, P.ry)) > 7) held.lry = P.ry - Math.sign(angd(held.lry, P.ry)) * 7;
        held.lrx = held.lrx == null ? P.rx : held.lrx + (P.rx - held.lrx) * lag; if (Math.abs(P.rx - held.lrx) > 6) held.lrx = P.rx - Math.sign(P.rx - held.lrx) * 6;
        const hp = heldPos(), o = t.obj.position, follow = 1 - Math.pow(0.00002, dt);
        const v0 = heldVirtual(t, false);
        o.x += (hp.x - o.x) * follow; o.y += (hp.y - o.y) * follow; o.z += (hp.z - o.z) * follow;
        const k0 = t.obj.scale.x || 1; t.obj.scale.setScalar(k0 + (hp.k - k0) * Math.min(1, follow * 1.5)); t._hk = true;
        // the hands' motion, measured on the full-size picture (a camera jump is not a throw): X lets go with a little of it
        if (dt > 0) { const v1 = heldVirtual(t, false), jump = Math.hypot(v1.x - v0.x, v1.y - v0.y, v1.z - v0.z) > 60, sm = Math.min(1, dt * 12); if (jump) held.hv.x = held.hv.y = held.hv.z = 0; else { held.hv.x += ((v1.x - v0.x) / dt - held.hv.x) * sm; held.hv.y += ((v1.y - v0.y) / dt - held.hv.y) * sm; held.hv.z += ((v1.z - v0.z) / dt - held.hv.z) * sm; } }
        // facing you as you turn it, tipped back a little so you see its top and front, with a slow breathing sway
        const want = P.ry * -1 + held.ry + (t.faceYou ? 180 : 0), r0 = t.obj.rotation.y / D2R, turn = angd(held.lry, P.ry);
        t.obj.rotation.set((HOLD.tiltSign * holdTilt() + Math.sin(now / 900) * 1.2) * D2R, (r0 + angd(r0, want) * follow) * D2R, (turn * 0.6 + Math.sin(now / 1300) * 0.8 + (t.holdRoll || 0)) * D2R, 'YXZ'); // (holdRoll: a pack tilting it in your hand, e.g. pouring)
        const g = live && mode !== 'glide' ? computeGhost(t) : null;
        showGhost(t, g); snapGlow(g && g.snap || null); showTargets(live ? t : null, now); ui.carry(t, g); armsTick(t);
      }
      any = true;
    }
    for (const id in THINGS) {
      const t = THINGS[id];
      if (t.st === 'fall') { // an authored fall (a tape out of the video, a floppy out of the drive): play it, then it's a body again
        const a = t.at;
        t.vy += 1800 * dt; a.y += t.vy * dt;
        // (slide the last bit from where it was held to where it lands)
        const sk = Math.min(1, (now - t.t0) / 240); t.obj.position.x = lerp(t.fromX == null ? a.x : t.fromX, a.x, ease(sk)); t.obj.position.z = lerp(t.fromZ == null ? a.z : t.fromZ, a.z, ease(sk));
        // A slow frame adds up to 216 cm/s of gravity. Do not bounce forever
        // on that numerical contact velocity (the old fixed 160 threshold did).
        if (a.y >= t.landY) { a.y = t.landY; if (t.vy > Math.max(160,1800*dt)) { t.vy = -t.vy * 0.22; physicalSound('handle', {weight:thingWeight(t),put:true}); } else { t.vy = 0; if (sk >= 1) { t.st = 'rest'; t.fromX = t.fromZ = null; syncBody(t); layerFor(t); saveThings(); emit('rest', id); } } }
        t.obj.position.y = renderY(t,a.y);
        const r = t.obj.rotation; if(t.floorOnly){r.x=0;r.z=0}else{r.x *= 0.8; r.z *= 0.8;}
        any = true;
      }
      // (never leave a carried stand-in small once it has left your hands, whoever took it)
      if (t._hk && t.st !== 'held' && t.st !== 'settle' && t.st !== 'inspect' && !(held && held.id === id)) { t.obj.scale.setScalar(1); t._hk = false; any = true; }
      // anything that has fallen out of the world goes home
      if (t.st === 'rest' && (!ROOMS[t.at.room] || t.at.y > LV[ROOMS[t.at.room].lvl] + 30)) { t.at = Object.assign({}, t.home); moveTo(t, t.home.room); place(t); }
    }
    return any;
  }
  // Saved as [room, x, y, z, ry, snap, hide, extra]; extra holds a chair's swivel. A carried thing saves where it came
  // from, and the grip itself is remembered so a refresh hands it straight back (jhp_hs_held).
  const PV = 7; // 2: placements saved since the physics pass (older ones are checked against the new colliders once); 3: the bigger front garden; 4: the car 20 cm further from the gate, the thicker hedge; 5: the lounge's sofa and armchair moved; 6: approved 7 m front plot, car/roof and lounge props follow the revised geometry; 7: clear floor props from the new cat tree
  // The front plot (docs/HOUSE-SCALE.md, js/hs-house.js builds it): the garden runs from the house front (z 702) to the pavement
  // at FZ. Until pv 3 it was 4 m deep (FZ 1100) with Dad's car shrunk to 82% (OLD_CAR) to squeeze it in.
  // STREET: our pavement (FZ..FZ+145, 1.45 m), its kerb, a 5.6 m road, the far kerb and pavement; the opposite houses'
  // gardens start at farPave[1] (js/hs-environment.js builds the rest of the village from these).
  // PIERS: the brick gate piers (x; 33 cm square, their caps' top PIER_TOP above the ground) either side of the path gate
  // and the gateway. HEDGE: the clipped privet behind the front wall, z from HEDGE[0] to the wall's back at HEDGE[1].
  // CAR3 is where Dad's car stood in pv 3 (2.57); CAR4 (pv 4-5) 20 cm back from the gate piers; pv 6 drove it up to the
  // drive, with the owner's approved 7 m plot: about 110 cm clear from doorstep to boot and 107 cm from nose to gateway.
  const FRONT = Object.freeze({ FZ: 1400, STREET: Object.freeze({ pave: [1400, 1545], kerb: 1550, road: [1555, 2115], farKerb: 2120, farPave: [2125, 2270] }),
    PIERS: Object.freeze([231.5, 348.5, 636.5]), PIER_TOP: 124, HEDGE: Object.freeze([1328.5, 1384]),
    CAR: Object.freeze({ x: 500, y: 353, z: 1075, s: 1.04, roof: 126.9 }), CAR4: Object.freeze({ x: 488, y: 353, z: 980, s: 1.04 }), CAR3: Object.freeze({ x: 488, y: 353, z: 1000, s: 1.04 }), OLD_CAR: Object.freeze({ x: 430, z: 906, s: .82 }) });
  const CAT_TREE = Object.freeze({ x: -90, z: 224, half: 23, ry: 90 });
  // A placement saved before pv 3: whatever was in or on the old car moves with the car (same spot in the boot or on the
  // roof, scaled); whatever the bigger car now stands on is set down on the drive beside it. Everything else keeps its pose.
  // pv 4: in or on the v3 car -> the same spot on the car 20 cm further back; on the ground where the car now stands ->
  // beside it; on the lawn where the thicker hedge now grows -> just in front of the hedge. pv 6: the same for the car's
  // move up the drive (in or on it: it comes along; under it now: set down beside it).
  // pv 5: on the lounge floor where the sofa (-155..35, 562..647) or Dad's chair (55..164, 340..450) now stands -> out
  // in front of the sofa, on the way through.
  const LOUNGE5 = [[-157, 560, 37, 649], [53, 338, 166, 452]];
  function migratePlacement(at, from = 0) {
    if (at && at.room === 'bedroom' && from < 7 && Number.isFinite(at.x) && Number.isFinite(at.z) && at.y >= LV.U-6 && at.y <= LV.U+2 && Math.abs(at.x-CAT_TREE.x)<CAT_TREE.half && Math.abs(at.z-CAT_TREE.z)<CAT_TREE.half) {
      at.x=CAT_TREE.x+CAT_TREE.half+29; at.z=clamp(at.z,190,224); at.y=LV.U; return true;
    }
    if (at && at.room === 'lounge' && from < 5 && Number.isFinite(at.x) && Number.isFinite(at.z)) {
      // Raised props follow the old upholstery; floor props only move if the new furniture covers them.
      if (at.y < LV.G - 6 && at.y >= LV.G - 110) {
        if (at.x >= -162 && at.x <= 42 && at.z >= 516 && at.z <= 606) { at.x = -60 + (at.x + 60) * .95; at.z += 45; return true; }
        const a = -118 * Math.PI / 180, dx = at.x - 110, dz = at.z - 430, x = dx * Math.cos(a) - dz * Math.sin(a), z = dx * Math.sin(a) + dz * Math.cos(a);
        if (Math.abs(x) <= 47 && Math.abs(z) <= 44) { const b = -110 * Math.PI / 180; at.x = 110 + x * Math.cos(b) + z * Math.sin(b); at.z = 395 - x * Math.sin(b) + z * Math.cos(b); at.ry = (at.ry || 0) + 8; return true; }
      }
      if (at.y >= LV.G - 6 && LOUNGE5.some(([x0, z0, x1, z1]) => at.x > x0 && at.x < x1 && at.z > z0 && at.z < z1)) { at.x = clamp(at.x, -150, 40); at.z = 521; at.y = LV.G; return true; }
    }
    if (!at || at.room !== 'drive' || !Number.isFinite(at.x) || !Number.isFinite(at.z)) return false;
    const { CAR, CAR3, CAR4, OLD_CAR, FZ, HEDGE } = FRONT;
    const onCar = (c, x, z, sx = 92, sz = 210) => Math.abs((x - c.x) / c.s) <= sx && Math.abs((z - c.z) / c.s) <= sz;
    const beside = c => { at.x = c.x - 91 * c.s - 32; at.z = Math.min(Math.max(at.z, 780), FZ - 90); at.y = c.y; };
    const follow = (a, b) => { at.x += b.x - a.x; at.z += b.z - a.z; at.y += b.y - a.y; };
    let moved = false, riding = false; // riding: in or on the car, so it moves with the car again
    if (from < 3) {
      const lx = (at.x - OLD_CAR.x) / OLD_CAR.s, lz = (at.z - OLD_CAR.z) / OLD_CAR.s;
      if (Math.abs(lx) <= 92 && Math.abs(lz) <= 210) { const ly = (at.y - CAR3.y) / OLD_CAR.s; at.x = CAR3.x + lx * CAR3.s; at.z = CAR3.z + lz * CAR3.s; at.y = CAR3.y + ly * CAR3.s; moved = riding = true; }
      else if (Math.abs(at.x - CAR3.x) < 120 * CAR3.s && Math.abs(at.z - CAR3.z) < 230 * CAR3.s) { beside(CAR3); moved = true; }
    }
    if (from < 4) {
      if (riding || onCar(CAR3, at.x, at.z) && at.y < CAR3.y - 5) { const roof = at.y <= CAR3.y - 133.5 * CAR3.s + 2; follow(CAR3, CAR4); if (roof) at.y += (133.5 - CAR.roof) * CAR.s; moved = riding = true; }
      else if (onCar(CAR4, at.x, at.z, 100, 214)) { beside(CAR4); moved = true; }
      else if (at.x < FRONT.PIERS[0] && at.z > HEDGE[0] - 12 && at.z < FZ) { at.z = HEDGE[0] - 20; at.y = CAR.y; moved = true; }
    }
    if (from < 6) {
      if (riding || onCar(CAR4, at.x, at.z) && at.y < CAR4.y - 5) { follow(CAR4, CAR); moved = true; }
      else if (onCar(CAR, at.x, at.z, 100, 214)) { beside(CAR); moved = true; }
    }
    return moved;
  }

  function saveThings(immediate) {
    clearTimeout(saveT);
    const write = () => {
      saveT=0;
      // Keep records belonging to unbuilt rooms; saving the bedroom must not
      // erase the rest of the house, nor overwrite a deferred prop with its home.
      const previous = loadThings(), st = Object.assign({}, previous.t), op = Object.assign({}, previous.o);
      if ((previous.pv || 0) < PV) for (const id in st) { const r = st[id]; if (!Array.isArray(r) || r[5]) continue; const at = { room: r[0], x: r[1], y: r[2], z: r[3], ry: r[4] }; if (migratePlacement(at, previous.pv || 0)) st[id] = [r[0], +at.x.toFixed(1), +at.y.toFixed(1), +at.z.toFixed(1), at.ry ?? r[4]].concat(r.slice(5)); }
      for (const id in THINGS) {
        const t = THINGS[id]; if (t.noSave || pendingRestores.has(id)) continue;
        const carried = held && held.id === id && !held.drag, a = carried ? held.from : t.at, y = t.st==='fall'&&Number.isFinite(t.landY)?t.landY:a.y;
        const rec = [a.room, +a.x.toFixed(1), +y.toFixed(1), +a.z.toFixed(1), Math.round(a.ry || 0), carried ? (held.was || 0) : t.st === 'snap' ? t.snap : 0, a.hide ? 1 : 0];
        if (a.sw) rec.push({ sw: Math.round(a.sw) });
        st[id] = rec;
      }
      for (const id in OPEN) { if (OPEN[id].open) op[id] = 1; else delete op[id]; }
      loaded = {t:st,o:op,pv:PV};
      try { if (!(window.Apps && Apps.saveGame && Apps.saveGame('hs.things',loaded,{v:1})))ls.set('jhp_hs_things',{t:st,o:op,pv:PV,_savedAt:Date.now()}); } catch (e) {}
    };
    if (immediate === true) write(); else saveT = setTimeout(write, 600);
  }
  function saveGrip() { if (held && !held.drag && !held.was && THINGS[held.id]) ls.set('jhp_hs_held', { id: held.id, d: +held.d.toFixed(1), ry: held.ry, t: Date.now() }); else ls.del('jhp_hs_held'); }
  // After a refresh, what you were carrying is handed straight back (it was saved at the place you picked it up from).
  function resumeHeld() {
    const g = ls.get('jhp_hs_held', null); if (!g || !g.id) return;
    let tries = 0;
    const go = () => {
      const t = THINGS[g.id];
      if (held || (t && t.st !== 'rest')) { if (!held || held.id !== g.id) ls.del('jhp_hs_held'); return; }
      if (!t || mode !== 'walk' || !live || worldLoading || standing || glide || pb.classList.contains('on') && !stood && BOOT === 'wake') { if (++tries < 150) setTimeout(go, 400); else ls.del('jhp_hs_held'); return; }
      if (!grab(g.id, { d: g.d, ry: g.ry })) ls.del('jhp_hs_held');
    };
    setTimeout(go, 300);
  }
  let loaded = null;
  function loadThings() {
    if (loaded) return loaded;
    try {
      // Direct house entry runs before gamesave.js/Apps. Do not cache an empty
      // legacy fallback and later overwrite the visitor's real modern save.
      const entries=['jhp_gs_hs.things','jhp_gsl_hs.things'].map(k=>ls.get(k,null)).filter(e=>e&&e.f===1&&e.v===1&&e.s&&typeof e.s==='object');
      entries.sort((a,b)=>(+b.t||0)-(+a.t||0));
      const legacy=ls.get('jhp_hs_things',null),modern=entries[0];
      loaded=legacy&&(!modern||(+legacy._savedAt||0)>(+modern.t||0))?legacy:modern?modern.s:(window.Apps&&Apps.loadGame&&Apps.loadGame('hs.things',1))||{t:{},o:{}};
    } catch (e) { loaded = { t: {}, o: {} }; }
    migrateSave(loaded);
    return loaded;
  }
  // The bigger car (save v3) moves things saved in or on the old car. Done once, in memory, for the whole save
  // (rooms that aren't built yet too). Also repairs saves already marked v3 whose drive records were skipped
  // (2.57.0 left Dad's PC parts behind the bumper): a raised spot on the old car that's now outside the new one.
  function migrateSave(save) {
    if (!save || !save.t || save.pv0 !== undefined) return;
    const { CAR3, OLD_CAR } = FRONT, pv = save.pv || 0, old = pv < PV; save.pv0 = pv; // pv0: the version it was saved with (the physics nudge below still needs it)
    for (const id in save.t) {
      const r = save.t[id]; if (!Array.isArray(r) || r[5] || (r[0] !== 'drive' && r[0] !== 'lounge' && r[0] !== 'bedroom')) continue;
      const lx = (r[1] - OLD_CAR.x) / OLD_CAR.s, lz = (r[3] - OLD_CAR.z) / OLD_CAR.s;
      const stale = r[0] === 'drive' && pv === 3 && Math.abs(lx) <= 92 && Math.abs(lz) <= 210 && r[2] < CAR3.y - 5 && !(Math.abs(r[1] - CAR3.x) <= 92 * CAR3.s && Math.abs(r[3] - CAR3.z) <= 205 * CAR3.s);
      if (!old && !stale) continue;
      const at = { room: r[0], x: r[1], y: r[2], z: r[3], ry: r[4] };
      if (migratePlacement(at, stale ? 0 : pv)) save.t[id] = [r[0], +at.x.toFixed(1), +at.y.toFixed(1), +at.z.toFixed(1), at.ry ?? r[4], ...r.slice(5)];
    }
    save.pv = Math.max(pv, PV);
  }
  // Placements saved before the physics pass may now overlap a collider (furniture gained real parts): nudge them out once.
  const migrateQ = new Set();
  function migrateRestored() {
    if (!migrateQ.size || !physReady()) return;
    let moved = false;
    for (const t of migrateQ) {
      migrateQ.delete(t);
      if (t.st !== 'rest' || t.at.hide || !t.body || !ROOMS[t.at.room]) continue;
      if (!t.obstacle) continue; // only furniture saved where the new furniture colliders now stand; props keep their pose
      if (!PH.overlapping(t.body) && Math.abs(t.at.y - LV[lvlOf(t)]) <= 0.01) continue;
      const shift = PH.settle(t.body, 45); if (shift > 0.05) { renderBody(t); moved = true; }
    }
    if (moved) saveThings();
  }
  // The safety net: something left where nobody can see or reach it (sunk inside furniture, below the floor, through a
  // wall) is noticed on load and after it is put down or settles, and goes somewhere reachable: nudged clear and onto its
  // support if that's enough, else back where it lives. Authored poses (a thing still at its home) are never second-guessed.
  const rescueQ = new Set();
  const atHome = t => { const a = t.at, h = t.home; return !!h && a.room === h.room && Math.hypot(a.x - h.x, a.y - h.y, a.z - h.z) < 1; };
  function lostWhy(t) {
    const a = t.at; if (t.st !== 'rest' || a.hide || !t.obj || atHome(t)) return null;
    const r = ROOMS[a.room]; if (!r) return 'room';
    if (a.y > LV[r.lvl] + 0.5) return 'floor';
    if (!Object.values(ROOMS).some(q => q.lvl === r.lvl && q.area.some(ar => a.x >= ar[0] - 15 && a.x <= ar[2] + 15 && a.z >= ar[1] - 15 && a.z <= ar[3] + 15))) return 'wall';
    const b = t.body; if (PH && b && b.active && !t.fixed && !held?.drag && PH.overlapping(b) === 'solid') return 'inside';
    if (underOf(t)) return 'under';
    return null;
  }
  // Pushed deep under something low (the bed's base, 10 cm up): out of sight and out of reach.
  function underOf(t) {
    const a = t.at, r = ROOMS[a.room]; if (!r || !PH || dragged(t) || t.obstacle || t.h > 15) return null;
    const top = a.y - t.h, L = PH.levels[r.lvl]; if (!L) return null;
    for (const s of L.statics) {
      if (s.bot > top + 0.5 || s.bot < top - 25) continue; // its underside is just above the thing
      if (s.t !== 'box' || a.x < s.ax0 + 20 || a.x > s.ax1 - 20 || a.z < s.az0 + 20 || a.z > s.az1 - 20) continue; // and deep inside its plan
      return s;
    }
    return null;
  }
  function rescue(t) {
    const why = lostWhy(t); if (!why) return false;
    if (why === 'inside' && t.body) { PH.settle(t.body, 45); renderBody(t); if (!lostWhy(t)) { syncBody(t); saveThings(); emit('rest', t.id); return why; } }
    if (why === 'under') { // slide it out past the nearest edge, onto the floor in front of it
      const s = underOf(t), a = t.at, m = Math.max(t.hx, t.hz) + 6, out = [[s.ax0 - m - a.x, 0], [s.ax1 + m - a.x, 0], [0, s.az0 - m - a.z], [0, s.az1 + m - a.z]].sort((u, v) => Math.hypot(...u) - Math.hypot(...v));
      for (const [dx, dz] of out) { const r = roomAt(a.x + dx, a.z + dz, lvlOf(t)); if (!r || !cellOk(r.lvl, a.x + dx, a.z + dz)) continue; t.at = Object.assign({}, a, { room: r.id, x: a.x + dx, z: a.z + dz, y: LV[r.lvl] }); moveTo(t, r.id); place(t); layerFor(t); if (!lostWhy(t)) { saveThings(); emit('rest', t.id); return why; } }
    }
    const h = t.home; if (!h || !ROOMS[h.room]) return false;
    t.at = Object.assign({}, h); t.snap = h.snap && SNAPS[h.snap] ? h.snap : null; t.st = t.snap ? 'snap' : 'rest';
    moveTo(t, h.room); place(t); layerFor(t); saveThings(); emit('rest', t.id);
    return why;
  }
  function rescueQueued() {
    if (!rescueQ.size || !physReady()) return;
    for (const t of rescueQ) { rescueQ.delete(t); if (THINGS[t.id] === t && !(held && held.id === t.id)) { const why = rescue(t); if (why) console.info('[house] ' + t.id + ' was out of reach (' + why + '): put back somewhere reachable'); } }
  }
  function restoreThing(t) { // where this visitor left it last time
    const save = loadThings(), s = save.t[t.id]; if (!s) return;
    if (!ROOMS[s[0]]) { pendingRestores.set(t.id,t); return; }
    pendingRestores.delete(t.id);
    t.at = { room: s[0], x: s[1], y: s[2], z: s[3], ry: s[4], hide: !!s[6] };
    if (s[7] && typeof s[7] === 'object' && Number.isFinite(s[7].sw)) t.at.sw = s[7].sw;
    if (s[5] && SNAPS[s[5]]) {
      t.st = 'snap'; t.snap = s[5];
      const p = SNAPS[s[5]].pose || SNAPS[s[5]];
      t.at.x = p.x; t.at.y = p.y; t.at.z = p.z; t.at.ry = p.ry || 0;
      t.rx = p.rx || 0; t.rz = p.rz || 0;
    } else { t.st = 'rest'; if (save.pv0 < PV && (t.at.room === 'drive' || t.at.room === 'lounge')) migrateQ.add(t); }
    moveTo(t, t.at.room); place(t); layerFor(t);
    if (t.st === 'rest' && !t.at.hide && (save.pv0 ?? save.pv ?? 0) < PV) migrateQ.add(t);
    rescueQ.add(t);
  }
  function tidy(rid) { // everything back where it lives (Mom tidied up)
    for (const id in THINGS) { const t = THINGS[id]; if (rid && t.home.room !== rid && t.at.room !== rid) continue; pendingRestores.delete(id); if (held && held.id === id) releaseHold(); t.st = t.home.snap ? 'snap' : 'rest'; t.snap = t.home.snap || null; t.at = Object.assign({}, t.home); moveTo(t, t.home.room); place(t); layerFor(t); }
    emit('tidy', rid); saveThings(); dirty();
  }
  // things that open and shut: drawers, doors, lids (a hinge or a slide)
  const OPEN = {};
  function openable(id, def) {
    const o = OPEN[id] = Object.assign({ id, open: false, k: 0, ms: 450, type: 'hinge', axis: 'y', amt: 90 }, def);
    const st = loadThings().o || {}; if (st[id]) { o.open = true; o.k = 1; apply(o); }
    spot(id, { label: def.label || id, obj: def.pick || def.pivot, range: def.range || 230, act: () => toggle(id) });
    function apply(o) { const p = o.pivot; if (!p) return; const v = o.k * o.amt; if (o.type === 'slide') p.position[o.axis] = (o.base || 0) + v; else p.rotation[o.axis] = v * D2R; dirty(); }
    o.apply = () => apply(o);
    return o;
  }
  function toggle(id, want) {
    const o = OPEN[id]; if (!o) return;
    if (o.canToggle && !o.canToggle(!o.open)) return;
    o.open = want == null ? !o.open : !!want;
    // doors and drawers swing on the shared minimum-jerk curve; reversing mid-swing keeps the swing's momentum
    const from = o.k, to = o.open ? 1 : 0, t0 = performance.now(), v0 = anims.has('open:' + id) ? (o.vel || 0) : 0;
    const ms = Math.max(160, o.ms * (v0 ? Math.min(1, Math.abs(to - from) + .25) : 1));let last = t0, prev = from;
    anims.set('open:' + id, n => { const k = clamp((n - t0) / ms, 0, 1); o.k = clamp(from + (to - from) * H5(k) + v0 * ms * H1(k), 0, 1); if (n > last) { o.vel = (o.k - prev) / (n - last); prev = o.k; last = n; } o.apply(); if (k < 1) return true; o.k = to; o.vel = 0; o.apply(); return false; });
    if (o.sound !== false) { physicalSound(o.type==='slide'?'drawer':'door',{open:o.open}); }
    if (o.onToggle) try { o.onToggle(o.open); } catch (e) { console.error(e); }
    emit('open', id, o.open); saveThings();
  }

  // ================================================================ sound (only with the site's SFX switched on)
  let AC = null, OUT = null, NB = null;
  function ac() { if (!window.Sound || !Sound.effectsOn || controlsPaused) return null; if (!AC) { try { AC = Sound.unlock && Sound.unlock(); } catch (e) { AC = null; } if (!AC) return null; OUT = AC.createGain(); OUT.gain.value = 0.5; OUT.connect(Sound.output(AC)); } if (AC.state === 'suspended') AC.resume(); return AC; }
  const sfx = {
    tone(f, d, type, vol, when, to) { const c = ac(); if (!c || !(f > 0)) return; const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + d); g.gain.setValueAtTime(vol == null ? 0.1 : vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d); o.connect(g); g.connect(OUT); o.start(t); o.stop(t + d + 0.03); },
    noise(d, vol, f, when, type, to) { const c = ac(); if (!c) return; const t = c.currentTime + (when || 0); if (!NB) { NB = c.createBuffer(1, c.sampleRate, c.sampleRate); const a = NB.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; } const s = c.createBufferSource(); s.buffer = NB; const fl = c.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(f || 2000, t); if (to) fl.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + d); const g = c.createGain(); g.gain.setValueAtTime(vol == null ? 0.1 : vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d); s.connect(fl); fl.connect(g); g.connect(OUT); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.03); },
    ac, output: () => { ac(); return OUT; },
  };
  const physicalSound=(kind,o)=>window.Sound?.world?.(kind,o);
  function thingWeight(t) { return t.weight || (t.floorOnly || t.hx*t.hz*t.h>22000 ? 'heavy' : t.hx*t.hz*t.h<1600 ? 'light' : 'medium'); }
  function sfxDoor(open) { physicalSound('door',{open}); }
  function footSurface() {
    const stair=onStairs(W.x,W.z);
    if(stair&&W.z>stair.m0&&W.z<stair.m1)return 'stairs';
    if(cur?.id==='kitchen')return 'lino';
    if(cur?.outside){const grass=cur.id==='garden'?W.x<150&&W.z< -190:W.x< -25&&W.z>770;return grass?'grass':'paving';}
    return 'carpet'; // The hall and landing are visibly carpeted, like the bedroom.
  }
  function sfxStep() { if (cur?.id === 'drive') { window.Sound?.play('gravel'); return; } physicalSound('step',{surface:footSurface()}); }
  let nextClock=0,nextOutside=0,clockSide=0;
  function tickWorldSound(now) {
    if(controlsPaused||!['walk','focus','glide'].includes(mode)||!window.Sound?.effectsOn)return;
    if(now>=nextClock){nextClock=now+1000;const c=cur?.id==='kitchen'?[-278,145,120]:cur?.id==='lounge'?[-236,229,500]:null;if(c&&Math.hypot(P.x-c[0],P.y-c[1],P.z-c[2])<220)physicalSound('clock',{side:clockSide++%2});}
    if(now>=nextOutside){nextOutside=now+7000+Math.random()*8000;if(cur?.outside){physicalSound('road');const hour=new Date().getHours();if(hour>=7&&hour<20)physicalSound('bird');}}
  }

  // ================================================================ the state machine: what the house is doing
  // off: not shown | follow: boot.js drives the camera | walk: you're in charge | glide: the camera is moving to a view
  // view: a close-up or the telly is open (no walking) | sit / stand: getting on or off the PC
  let mode = 'off', live = false;
  const anims = new Map(); // key -> fn(now) returning true while it wants to carry on
  // ================================================================ MOTION: the one camera-move curve every "enter/leave something" moment uses
  // A move is a quintic (minimum-jerk) Hermite from the current pose to the target: it starts and lands with zero
  // velocity AND zero acceleration (no lurch, no bump on arrival), and when a move is interrupted (Q mid-glide,
  // a new target) the new move inherits the camera's current velocity, so it bends round instead of stopping dead.
  // Leaving retraces the arriving path: both ends are poses on the same straight line through pose space.
  // P.zm is the lens (1 = the walking field of view, >1 = slightly longer lens for close-ups), eased on the same curve.
  const MOTION = (() => {
    let reduce = ls.get('jhp_reduce_motion', null);
    if (typeof reduce !== 'boolean') { try { reduce = !!matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduce = false; } }
    // Shared timings (ms). Entering and leaving use the same duration so the reverse feels like the same move.
    const ms = { focus: 760, unfocus: 760, seat: 700, station: null, pc: 950, stand: 1050, inspect: 360, inspectEnd: 300, lock: 380, handheld: 760, reverseMin: 280 };
    return { ms, get reduce() { return reduce; }, set reduce(v) { reduce = !!v; ls.set('jhp_reduce_motion', reduce); html.classList.toggle('hs-reduce-motion', reduce); emit('motion', reduce); } };
  })();
  html.classList.toggle('hs-reduce-motion', MOTION.reduce);
  // Reduce motion: shorter moves, no arcs, no lens change, no handheld tilt. Nothing is skipped or cut.
  const motionMs = ms => MOTION.reduce ? Math.round(ms * 0.55) : ms;
  const H5 = s => s * s * s * (s * (s * 6 - 15) + 10), H5d = s => 30 * s * s * (s - 1) * (s - 1);
  const H1 = s => s * (1 + s * s * (-6 + s * (8 - 3 * s))), H1d = s => 1 + s * s * (-18 + s * (32 - 15 * s));
  const CH = ['x', 'y', 'z', 'rx', 'ry', 'zm'];
  const span = (a, b) => Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) + 0.6 * (Math.abs(angd(a.ry, b.ry)) + Math.abs((b.rx || 0) - (a.rx || 0))) + 120 * Math.abs((b.zm || WZ) - (a.zm || WZ));
  P.zm = 1;
  let glide = null, movingLock = false;
  // pose-space velocity (units per ms) of the move in progress, for velocity-continuous retargeting
  function glideVel(now) {
    const g = glide; if (!g || !g.ms) return null;
    const s = clamp((now - g.t0) / g.ms, 0, 1), to = typeof g.to === 'function' ? g.to() : g.to, v = {}, d5 = H5d(s) / g.ms, d1 = H1d(s);
    for (const c of CH) { const delta = c === 'ry' ? angd(g.from.ry, to.ry) : ((to[c] ?? (c === 'zm' ? WZ : g.from[c])) - g.from[c]); v[c] = delta * d5 + g.v0[c] * d1; }
    if (g.arc) v.y -= Math.cos(Math.PI * H5(s)) * Math.PI * d5 * g.arc;
    return v;
  }
  function setMoving(on) { if (on === movingLock) return; movingLock = on; html.classList.toggle('hs-moving', on); emit('moving', on); }
  function glideTo(to, o) {
    o = o || {};
    const now = performance.now(), prev = glide, v0 = prev ? glideVel(now) : null;
    if (glide && glide.onCancel) { const f = glide.onCancel; glide.onCancel = null; try { f(); } catch (e) {} }
    const from = { x: P.x, y: P.y, z: P.z, rx: P.rx, ry: P.ry, zm: P.zm || WZ };
    const tt = typeof to === 'function' ? to() : to;
    const dist = Math.hypot(tt.x - from.x, tt.y - from.y, tt.z - from.z), turn = Math.abs(angd(from.ry, tt.ry)) + Math.abs(tt.rx - from.rx);
    let ms = o.ms != null ? o.ms : clamp(420 + dist * 2.2 + turn * 3, 500, 1500);
    // Interrupted part-way (a reversal, or a new target): take the time the remaining distance deserves.
    if (prev && ms > 0) { const whole = span(prev.from, typeof prev.to === 'function' ? prev.to() : prev.to); if (whole > 1) ms = Math.max(MOTION.ms.reverseMin, ms * Math.min(1, Math.pow(span(from, tt) / whole, 0.7))); }
    ms = motionMs(ms);
    const vz = {}; for (const c of CH) vz[c] = v0 && ms ? v0[c] || 0 : 0;
    glide = { from, to, t0: now, ms, v0: vz, done: o.done, onCancel: o.cancel, lock: !!o.lock, arc: MOTION.reduce ? 0 : (o.arc || 0), at: o.at ? [].concat(o.at).map(a => ({ k: a.k, fn: a.fn })) : [], look: { rx: 0, ry: 0 }, kind: o.kind || '' };
    if (mode === 'walk' || mode === 'glide') mode = 'glide';
    setMoving(ms > 0 && (glide.lock || glide.kind === 'unfocus'));
    emit('move', 'start', glide.kind, ms);
    dirty();
    return glide;
  }
  function tickGlide(now) {
    if (!glide) return false;
    const g = glide, s = g.ms ? clamp((now - g.t0) / g.ms, 0, 1) : 1, e = H5(s), h = g.ms * H1(s), to = typeof g.to === 'function' ? g.to() : g.to;
    for (const c of ['x', 'y', 'z', 'rx']) P[c] = g.from[c] + (to[c] - g.from[c]) * e + g.v0[c] * h;
    P.ry = g.from.ry + angd(g.from.ry, to.ry) * e + g.v0.ry * h;
    P.zm = MOTION.reduce ? (to.zm ?? WZ) : g.from.zm + ((to.zm ?? WZ) - g.from.zm) * e + g.v0.zm * h; // (reduced motion: the lens cuts, it never zooms)
    if (g.arc) P.y -= Math.sin(Math.PI * e) * g.arc;
    // looking round during an unlocked move rides on top of it instead of cancelling it
    if (g.look.rx || g.look.ry) { P.rx = clamp(P.rx + g.look.rx, -78, 70); P.ry += g.look.ry; }
    for (const a of g.at) if (a.fn && s >= a.k) { const fn = a.fn; a.fn = null; try { fn(); } catch (e2) { console.error(e2); } if (glide !== g) return true; }
    if (s >= 1) {
      glide = null;
      if (MOTION.reduce || to.zm == null) P.zm = to.zm ?? WZ;
      const end = Object.assign({}, to, { rx: P.rx, ry: P.ry });
      // where you are now (if it's somewhere you could stand)
      setWalkFrom(end);
      if (mode === 'glide') mode = 'walk';
      setMoving(false);
      emit('move', 'settle', g.kind, g.ms);
      if (g.done) try { g.done(); } catch (e2) { console.error(e2); }
      if (!glide) resumeHeldKeys();
    }
    return true;
  }
  function setWalkFrom(p) {
    const lvl = p.lvl || (p.y > (LV.U + LV.G) / 2 - 60 ? 'G' : 'U');
    W.x = p.x; W.z = p.z; W.lvl = lvl;W.vx=W.vz=0;W.jh=W.jv=0;W.bob=0;
    const st = onStairs(p.x, p.z), guess = p.y + (p.seat ? SITH : STAND), sy = st ? st.y(p.x, p.z) : null;
    W.fy = sy != null && Math.abs(sy - guess) < Math.abs(LV[lvl] - guess) ? sy : LV[lvl];
    W.eyeNow = W.fy - p.y; W.seat = !!p.seat;
    roomCheck();
    W.eye = p.seat ? W.eyeNow : ((cur && cur.eye) || STAND);
  }
  function cancelGlide(force) { if (!glide || (glide.lock && !(force && glide.onCancel))) return false; const g = glide; glide = null; setWalkFrom(P); if (mode === 'glide') mode = 'walk'; setMoving(false); if (g.onCancel) try { g.onCancel(); } catch (e) {} return true; }
  // Keys held through a transition count once it lands: holding W while standing up walks you off, never a dead zone.
  const downKeys = new Set();
  addEventListener('keydown', ev => { if (!ev.repeat) downKeys.add(ev.key); }, true);
  addEventListener('keyup', ev => { downKeys.delete(ev.key); downKeys.delete(ev.key.length === 1 ? (ev.key === ev.key.toLowerCase() ? ev.key.toUpperCase() : ev.key.toLowerCase()) : ev.key); }, true);
  addEventListener('blur', () => downKeys.clear());
  function resumeHeldKeys() {
    if (mode !== 'walk' || controlsPaused || viewOpen()) return;
    const typing = document.activeElement?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
    if (typing) return;
    for (const k of downKeys) if (KEYMOVE[k]) keys[KEYMOVE[k]] = true;
    if (downKeys.has('Shift')) keys.run = true;
  }
  // T pressed while the screen it would fill is still arriving (raising the Game Lad, leaning in to the telly):
  // remembered, and applied the moment that screen is up. Pressing T again before then cancels it.
  let lockQueued = 0;
  function queueLock() { lockQueued = lockQueued ? 0 : performance.now() + 6000; return true; }
  // a screen you are on your way to: a focus that opens one (the consoles, the Game Lad) or sitting at the PC
  function screenArriving() {
    if (glide && glide.lock && (focusS?.o.screen || mode === 'sit' || mode === 'pcboot')) return true;
    return !!(focusS?.o.screen && mode === 'focus' && !window.ScreenLock?.available);
  }
  function tickQueuedLock(now) {
    if (!lockQueued) return;
    if (now > lockQueued || controlsPaused) { lockQueued = 0; return; }
    if (glide || !window.ScreenLock?.available) return;
    lockQueued = 0; if (!ScreenLock.current?.locked) ScreenLock.toggle(true);
  }

  // stations: the quick views of each room (room.stations: [{ id, n, x, y, z, rx, ry, seat }]; y = eye height or 'seat' for the desk)
  function stationPose(r, s) { if (s.pose) return s.pose(); return { x: s.x, y: s.y, z: s.z, rx: s.rx, ry: s.ry, seat: s.seat, lvl: r.lvl }; }
  let stIdx = -1;
  function goStation(i) {
    const r = cur; if (!r || !r.stations.length || !canAct()) return;
    i = (i + r.stations.length) % r.stations.length; stIdx = i;
    const s = r.stations[i];
    glideTo(stationPose(r, s), { done: () => emit('station', r.id, s.id) });
    ui.where(); sfx.tone(240, 0.03, 'square', 0.03);
  }
  function nearestStation() {
    const r = cur; if (!r || !r.stations.length) return -1;
    let best = -1, bd = 1e9;
    r.stations.forEach((s, i) => { const p = stationPose(r, s); const d = Math.hypot(p.x - P.x, p.z - P.z) + Math.abs(angd(P.ry, p.ry)) * 1.5; if (d < bd) { bd = d; best = i; } });
    return best;
  }
  const canAct = () => !controlsPaused && !worldLoading && live && (mode === 'walk' || mode === 'glide'||mode==='focus'&&focusS?.o.seatId) && !viewOpen();
  const viewOpen = () => !!pb.querySelector(':scope > .rm-view') || !!document.querySelector('html > .rm-live3d.on') || !!(ui.el && ui.el.querySelector('.hs-modal.on'));

  // ================================================================ which room you're in
  function roomCheck() {
    let r = roomAt(W.x, W.z, W.lvl) || cur;
    { const st = onStairs(W.x, W.z); // (height counts: on the stairs, or above the cupboard's ceiling, you're in the hall/landing, never the cupboard)
      if (st && W.x >= st.x0 && W.x <= st.x1 && (W.fy < LV.G - 20 || (r && r.id === 'cupboard' && W.fy < LV.G - 20))) r = ROOMS[W.fy < (LV.U + LV.G) / 2 ? 'landing' : 'hall'] || r;
      else if (r && r.id === 'cupboard' && W.fy < LV.G - 20) r = ROOMS.hall || r; }
    if (r !== cur) { const old = cur; cur = r; buildRoom(r); if (held && THINGS[held.id]) { r.things.add(THINGS[held.id].obj); THINGS[held.id].at.room = r.id; } visCalc(); stIdx = nearestStation(); ui.where(); if (!W.seat) W.eye = (r && r.eye) || STAND; emit('room', r && r.id, old && old.id); } // (what you're carrying comes with you)
  }

  // ================================================================ moving: keyboard and mouse look
  const keys = {};
  let crouchToggle = !!ls.get('jhp_hs_crouch_toggle', false);
  function crouchSetting(value) {
    if (typeof value === 'boolean') { crouchToggle = value; ls.set('jhp_hs_crouch_toggle', value); keys.crouch = false; dirty(); }
    return crouchToggle;
  }
  // The player as the physics world's kinematic capsule: from the step height to the top of the head.
  function syncPlayerBody() {
    if (!PH) return;
    if (!live || !['walk', 'glide', 'focus', 'inspect'].includes(mode)) { PH.player = null; PH.ghost.clear(); return; }
    const head = W.fy - W.eyeNow - W.jh - HEADROOM;
    PH.player = { lvl: W.lvl, x: W.x, z: W.z, r: RAD, feet: W.fy, head };
    const t0 = performance.now(); physReady(); PH.playerRegion(W.lvl, W.x, W.z, RAD + 60); PH.updateGhosts(W.lvl, W.x, W.z, RAD, W.fy, head); physAcc += performance.now() - t0;
  }
  // Sat in the desk chair, the seat and back swivel round with your view (the castors stay put).
  function seatSwivel() {
    const id = focusS?.o.seatId, t = id && THINGS[id]; if (!t || !t.swivel || !t.body || mode !== 'focus') return;
    const b = t.body, want = 180 - P.ry - b.ry, d = angd(b.sw, want);
    if (Math.abs(d) < 0.3) return;
    b.sw += d; PH.update(b); renderBody(t); saveThings();
  }
  function pushBodies(dx, dz, dt) {
    if (!PH || W.seat) return 0;
    const head = W.fy - W.eyeNow - W.jh - HEADROOM;
    if (PH.player) { PH.player.x = W.x; PH.player.z = W.z; PH.player.feet = W.fy; PH.player.head = head; PH.player.lvl = W.lvl; }
    const t0 = performance.now(), got = PH.playerPush(W.lvl, W.x, W.z, RAD, W.fy, head, dx, dz, dt); physAcc += performance.now() - t0;
    return got;
  }
  // The touch stick and drag-to-look (js/hs-touch.js) feed the same walking and view code as the keys and the mouse.
  const touchMove = { on: false, x: 0, y: 0, run: false };
  function touchSet(x, y, run) { const m = Math.hypot(x, y) > 1 ? Math.hypot(x, y) : 1; touchMove.x = clamp(x / m, -1, 1) || 0; touchMove.y = clamp(y / m, -1, 1) || 0; touchMove.run = !!run; touchMove.on = !!(touchMove.x || touchMove.y); if (touchMove.on) { if (glide) cancelGlide(); ui.crossOn(); } }
  function touchLook(dx, dy) {
    if (controlsPaused || worldLoading || !live) return false;
    if (mode === 'glide' && glide) { if (glide.lock) return false; glide.look.ry += dx; glide.look.rx -= dy; }
    else if (mode === 'walk' || mode === 'focus' && focusS?.o.seatId) { P.ry += dx; P.rx = clamp(P.rx - dy, -78, 70); }
    else return false;
    hoverQ = false; dirty(); return true;
  }
  const KEYMOVE = { w: 'f', W: 'f', ArrowUp: 'f', s: 'b', S: 'b', ArrowDown: 'b', a: 'l', A: 'l', ArrowLeft: 'l', d: 'r', D: 'r', ArrowRight: 'r' };
  let lastPt = { x: 0, y: 0, ok: false, mouse: false };
  const walkingFloor=(x,z)=>{
    if(window.ChoreKit?.tool?.canWalk?.(x,z)===false)return null;
    if(window.HouseFamily?.blocks?.(x,z,W.lvl))return null; // the family are solid too (js/np-life.js)
    const f=floorAt(x,z,W.lvl,W.fy);
    // Small thresholds are fine; stepping sideways off the flight must not
    // turn the legacy 45 cm pose-restore tolerance into a sudden camera drop.
    return f&&Math.abs(f.y-W.fy)<=8?f:null;
  };
  function movementContacts(x,z,radius=RAD) {
    const s=onStairs(x,z),ramp=s&&x>=s.x0+RAD&&x<=s.x1-RAD&&Math.abs(s.y(x,z)-W.fy)<=45;
    const out=ramp?[]:shellContacts(x,z,W.lvl,radius);
    out.push(...doorContacts(x,z,W.fy-50,W.lvl,radius));
    // The family are solid (js/np-life.js): a round contact, so you slide round someone instead of stopping dead.
    const fam=window.HouseFamily?.blocker?.(x,z,W.lvl,radius-RAD+.5);
    if(fam){const dx=x-fam.x,dz=z-fam.z,d=Math.hypot(dx,dz)||1;out.push({nx:dx/d,nz:dz/d,depth:Math.max(0,fam.r-d)})}
    // Things are physics bodies: the player's capsule meets their real parts (js/hs-physics.js).
    if(typeof bodyContacts==='function')out.push(...bodyContacts(x,z,radius));
    return out;
  }
  // Sweep in short increments, advance to contact, then project the remaining
  // displacement onto its plane. Two adjoining planes handle corners without
  // alternating X/Z decisions or throwing away the wall-tangent velocity.
  function moveCircle(dx,dz) {
    const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/3));
    for(let step=0;step<count;step++){
      let sx=dx/count,sz=dz/count;
      for(let iteration=0;iteration<3&&Math.hypot(sx,sz)>.0001;iteration++){
        const f=walkingFloor(W.x+sx,W.z+sz);
        if(f){W.x+=sx;W.z+=sz;W.fy=f.y;W.lvl=f.lvl;break}
        let lo=0,hi=1;
        for(let n=0;n<8;n++){const mid=(lo+hi)/2;if(walkingFloor(W.x+sx*mid,W.z+sz*mid))lo=mid;else hi=mid}
        W.x+=sx*lo;W.z+=sz*lo;sx*=1-lo;sz*=1-lo;
        // Query the contact point, with a half-millimetre skin. The attempted
        // endpoint normal on a rounded corner points too far around the curve
        // and would project the tangent back into the solid at our actual feet.
        const contacts=movementContacts(W.x,W.z,RAD+.05);
        if(!contacts.length){
          // Low lintels, tool restrictions and the edge of a stair ramp have
          // no vertical wall mesh; use their valid tangent as the contact plane.
          if(walkingFloor(W.x+sx,W.z))contacts.push({nx:0,nz:-Math.sign(sz)});
          else if(walkingFloor(W.x,W.z+sz))contacts.push({nx:-Math.sign(sx),nz:0});
          else{W.vx=W.vz=0;break}
        }
        let projected=false;
        // (a thing being shoved ahead of you keeps your walking speed: it is moving out of the way)
        for(const c of contacts){const dot=sx*c.nx+sz*c.nz;if(dot<0){sx-=c.nx*dot;sz-=c.nz*dot;projected=true}const velocity=W.vx*c.nx+W.vz*c.nz;if(velocity<0&&!c.soft){W.vx-=c.nx*velocity;W.vz-=c.nz*velocity}}
        if(!projected)break;
      }
    }
  }
  // The stair funnel: the flight is 75 cm between its strings, so your body (44 cm across) fits it only within the
  // middle 33 cm. Heading into the flight off-centre (at the head of the stairs, or at the foot), you are eased
  // sideways onto it, the way your feet find the stairs, instead of stopping dead on the top step's edge.
  function stairFunnel(dx,dz){
    if(Math.abs(dz)<1e-4||Math.abs(dz)<Math.abs(dx)*.35)return dx;
    const s=grids.stairs.find(q=>W.x>q.x0-10&&W.x<q.x1+RAD&&(dz>0?W.z>q.m0-60&&W.z<q.m0+6:W.z>q.m1-6&&W.z<q.m1+60));
    if(!s)return dx;
    const lo=s.x0+RAD+.5,hi=s.x1-RAD-.5;if(W.x>=lo&&W.x<=hi)return dx;
    const want=(W.x<lo?lo:hi)-W.x;return dx+Math.sign(want)*Math.min(Math.abs(want),Math.abs(dz)*.9);
  }
  let trappedTime=0;
  function recoverWalking(dt) {
    // An intentional stop against a wall is never a reason to teleport. Only
    // recover an invalid body position (old saves or a solid moved over it).
    if(walkingFloor(W.x,W.z)){trappedTime=0;return false}
    trappedTime+=dt;if(trappedTime<.25)return false;
    for(let radius=2;radius<=60;radius+=2)for(let i=0;i<32;i++){
      const a=i*Math.PI/16,x=W.x+Math.cos(a)*radius,z=W.z+Math.sin(a)*radius,f=walkingFloor(x,z);
      if(!f||Math.abs(f.y-W.fy)>8)continue;
      W.x=x;W.z=z;W.fy=f.y;W.lvl=f.lvl;W.vx=W.vz=0;trappedTime=0;return true;
    }
    return false;
  }
  function tickWalk(dt) {
    if (window.House && House.god) { const gr = House.god(dt); roomCheck(); return gr; } // (layout editor, hs-edit.js: noclip fly)
    let mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), mz = (keys.f ? 1 : 0) - (keys.b ? 1 : 0);
    const tm = typeof touchMove !== 'undefined' ? touchMove : null; // (the touch stick, js/hs-touch.js: analogue, -1..1; absent in the extracted unit test)
    if (tm?.on && !mx && !mz) { mx = tm.x; mz = tm.y; }
    const mag = Math.min(1, Math.hypot(mx, mz));
    const night = !!(window.HouseLife && HouseLife.quiet && HouseLife.quiet());
    const lintel=lowDoorAt(W.x,W.z,W.lvl,6,W.fy),nearLintel=keys.crouch&&lowDoorAt(W.x,W.z,W.lvl,RAD+40,W.fy),ducking=keys.crouch||!!lintel;
    if (!W.seat) W.eye = Math.max(60, ((cur && cur.eye) || STAND) - (keys.crouch ? 38 : 0)); // C: crouch
    if(lintel||nearLintel)W.eye=Math.min(W.eye,(lintel||nearLintel).headroom-10);
    const carrySpeed = held ? (THINGS[held.id]?.walkScale || 1) : 1;
    const sp = carrySpeed * (keys.run || tm?.on && tm.run ? 210 : night ? 62 : 140) * (W.seat ? 0 : 1) * (ducking ? 0.5 : 1); // (Shift: a jog, 1.5x. At night you creep anyway: Mom's asleep)
    const a = P.ry * D2R, fx = Math.sin(a), fz = -Math.cos(a), rx = Math.cos(a), rz = Math.sin(a);
    let tvx = 0, tvz = 0;
    if (mag > 0.05) {
      if (W.seat) { W.seat = false; W.eye = (cur && cur.eye) || STAND; emit('standup'); } // you get up off the chair / beanbag first
      const n = mag / Math.hypot(mx, mz);
      tvx = (fx * mz + rx * mx) * n * sp; tvz = (fz * mz + rz * mx) * n * sp;
    }
    const acc = 1 - Math.pow(0.0001, dt);
    W.vx += (tvx - W.vx) * acc; W.vz += (tvz - W.vz) * acc;
    const oldX=W.x,oldZ=W.z;
    const recovered=recoverWalking(dt);if(recovered)roomCheck();
    let spd = Math.hypot(W.vx, W.vz);
    if (spd > 1) {
      // Walking into a thing shoves it first (js/hs-physics.js); whatever it can't give way, the sweep below stops at.
      if(typeof pushBodies==='function')pushBodies(W.vx*dt,W.vz*dt,dt);
      moveCircle(stairFunnel(W.vx*dt,W.vz*dt),W.vz*dt);
      spd=Math.hypot(W.x-oldX,W.z-oldZ)/dt;
      if (stIdx >= 0 && spd > 40) { stIdx = -1; ui.where(); }
      // head bob and footsteps
      const ph = W.bobT; W.bobT += spd * dt / 62; const bob=Math.sin(W.bobT * Math.PI)*Math.min(1,spd/120)*1.4;W.bob+=(bob-W.bob)*Math.min(1,dt*18);
      if (Math.floor(ph) !== Math.floor(W.bobT)) { sfxStep(!!onStairs(W.x, W.z)); emit('step', W.x, W.z, spd); }
      roomCheck();
    } else W.bob *= 0.85;
    W.eyeNow += (W.eye - W.eyeNow) * Math.min(1, dt * 5);
    if (keys.jump) { keys.jump = false; if (W.jh <= 0.01 && !W.jv && !W.seat && !ducking && !(cur && cur.id === 'cupboard')) W.jv = 270; } // (a hop of about 37 cm)
    if (W.jv || W.jh > 0) { const d = Math.min(dt, 0.05); W.jv -= 980 * d; W.jh += W.jv * d; const ceiling=cur?.ceilingAt?.(W.x,W.z),clearance=Number.isFinite(ceiling)?W.fy-ceiling-W.eyeNow-4-Math.abs(W.bob):Infinity; const cap = Math.max(0, Math.min(40, 232 - W.eyeNow,clearance)); if (W.jh > cap) { W.jh = cap; W.jv = Math.min(W.jv, 0); } if (W.jh <= 0) { W.jh = 0; W.jv = 0; } }
    P.x = W.x; P.z = W.z; P.y = W.fy - W.eyeNow - W.bob - W.jh;
    return recovered || W.jh > 0 || spd > 1 || Math.abs(W.eye - W.eyeNow) > 0.3 || Math.abs(W.bob) > 0.05;
  }
  function onKey(ev) {
    if (!live) return;
    if (window.House && House.god) return; // (layout editor owns the keys)
    const gameHost=document.activeElement?.closest?.('.pcg-host');
    const typing=ev.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')||gameHost?.houseTyping?.();
    // Q/T belong to the house, including while a game owns the active screen.
    // Shift+T on the family TV remains its TEXT button.
    if(ev.key.toLowerCase()==='t'&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey&&!typing&&!ev.shiftKey&&screenArriving()){ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat)queueLock();return;}
    if(ev.key.toLowerCase()==='t'&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey&&!typing&&!(ev.shiftKey&&window.ScreenLock?.current?.type==='surface')&&window.ScreenLock?.available){ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat){lockQueued=0;ScreenLock.toggle();}return;}
    if(window.HousePause&&HousePause.handleEscape(ev))return;
    if(controlsPaused)return;
    const t = ev.target; if (typing) return;
    if(ev.key.toLowerCase()==='q'&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey&&held&&(['walk','glide'].includes(mode)||mode==='focus'&&focusS?.o.seatId)&&!viewOpen()){ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat)putBack();return;}
    if(ev.key.toLowerCase()==='q'&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey&&!typing&&window.HousePause?.canBack){ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat)HousePause.quickBack();return;}
    if(inspection&&(ev.key==='Tab'||(['Enter',' '].includes(ev.key)&&ev.target?.closest?.('.hs-inspection button'))))return;
    if(inspection&&(ev.ctrlKey||ev.metaKey||ev.altKey))return;
    if (inspection) {
      if (ev.key === 'Escape') endInspect();
      else {
        const s=inspection,k=ev.key.toLowerCase();let used=false;
        try {used=s.t.onInspectKey?.(ev)===true||ev.defaultPrevented;}catch(e){console.error(e)}
        if(!used){
          if((k==='f'||k==='enter')&&!ev.repeat){try{s.t.onInspectUse?.(s.t)}catch(e){console.error(e)}}
          else if(k==='arrowleft'||k==='arrowright'||k==='r'){s.yaw+=(k==='arrowleft'||ev.shiftKey?-1:1)*(k==='r'?45:10);poseInspect()}
          else if(k==='arrowup'||k==='arrowdown'){s.pitch+=(k==='arrowup'?-10:10);poseInspect()}
          else if(['+','=','-','_'].includes(k)){s.zoom=clamp(s.zoom+(['+','='].includes(k)?-.08:.08),.78,1.8);poseInspect()}
        }
      }
      ev.preventDefault(); ev.stopImmediatePropagation(); return;
    }
    if (focusS?.o.seatId && (KEYMOVE[ev.key] || ev.key===' ' || ev.key==='F2')) {ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat)unfocus();return;}
    if (mode === 'focus' && ev.key === 'Escape' && !viewOpen()) { ev.preventDefault(); ev.stopImmediatePropagation(); if (focusS && focusS.o.esc && focusS.o.esc() === false) return; unfocus(); return; }
    if (viewOpen() || (mode !== 'walk' && mode !== 'glide'&&!(mode==='focus'&&focusS?.o.seatId))) { if (mode === 'stand' || mode === 'sit') { ev.preventDefault(); ev.stopImmediatePropagation(); } return; }
    if (ui.modalOpen()) return;
    if (worldLoading) {ev.preventDefault(); return;}
    const k=ev.key;
    if(window.ChoreKit?.tool?.key?.(ev)){wantLock();return;}
    if (KEYMOVE[k]) { wantLock(); if (cancelGlide() || !glide) keys[KEYMOVE[k]] = true; ev.preventDefault(); ev.stopImmediatePropagation(); ui.crossOn(); return; }
    if (k === 'Shift') { keys.run = true; return; }
    if (k === ' ' && !(t && t.closest && t.closest('button'))) { ev.preventDefault(); ev.stopImmediatePropagation(); if (!ev.repeat) keys.jump = true; return; }
    if ((k === 'c' || k === 'C') && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { if (!ev.repeat) keys.crouch = crouchToggle ? !keys.crouch : true; ev.preventDefault(); ev.stopImmediatePropagation(); return; }
    if ((k === 'f' || k === 'F') && (ev.ctrlKey || ev.metaKey || ev.altKey)) return;
    if (k === 'f' || k === 'F' || k === 'e' || k === 'E' || k === 'i' || k === 'I' || k === 'Enter') {
      if (ev.repeat) { ev.preventDefault(); return; }
      if (t && t.closest && t.closest('button') && k === 'Enter') return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      if (held) {
        if(['e','E'].includes(k))drop(null,null,'user');else useHeld();
      } else useAt(vw/2,vh/2,true,(!['e','E'].includes(k))?'use':'grab');
      wantLock();return;
    }
    if (held && (k === 'x' || k === 'X') && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); ev.stopImmediatePropagation(); if (!ev.repeat) letGo(); return; }
    if (held && (k === 'r' || k === 'R')) { if (!ev.repeat) { held.ry += ev.shiftKey ? -45 : 45; physicalSound('turn'); dirty(); } ev.preventDefault(); return; }
    if (held && (k === '+' || k === '=' || k === ']')) { held.d = clamp(held.d + 10, 25, 150); return; }
    if (held && (k === '-' || k === '_' || k === '[')) { held.d = clamp(held.d - 10, 25, 150); return; }
    if (k === 'Escape') { if (held) { putBack(); ev.preventDefault(); ev.stopImmediatePropagation(); } else if (glide) { if (cancelGlide(true)) { ev.preventDefault(); ev.stopImmediatePropagation(); } } return; }
    if (k === 'Tab' && !ev.ctrlKey && !ev.altKey) { /* (Tab stays the browser's: the power button must stay reachable) */ }
  }
  function onKeyUp(ev) { const k = KEYMOVE[ev.key]; if (k) keys[k] = false; if (ev.key === 'Shift') keys.run = false; if (!crouchToggle && (ev.key === 'c' || ev.key === 'C')) keys.crouch = false; }
  addEventListener('keydown', onKey, true); addEventListener('keyup', onKeyUp, true);
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; touchSet(0, 0); try { if (document.pointerLockElement === cv) document.exitPointerLock(); } catch (e) {} });

  // pointers: drag to look, click to use
  const PT = new Map();
  const uiTarget = el => el && el.closest && el.closest('button,a,input,label,select,textarea,.rm-note,.rm-view,.hs-ui,.powerbtn,.pc-fs');
  pb.addEventListener('pointerdown', ev => {
    if (ev.pointerType && ev.pointerType!=='mouse')return;
    if (worldLoading || !live || mode === 'off' || mode === 'follow' || ev.button > 0 || uiTarget(ev.target)) return;
    PT.set(ev.pointerId, { x0: ev.clientX, y0: ev.clientY, x: ev.clientX, y: ev.clientY, ry0: P.ry, rx0: P.rx, drag: false, t0: performance.now(), type: ev.pointerType });
    if(mode==='focus'&&focusS?.o.seatId)wantLock();
    try { pb.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  // first-person mouse lock (desktop only): click in the room to lock, Esc lets go (the browser does that), drag-to-look still works unlocked
  const locked = () => !!cv && document.pointerLockElement === cv;
  function unlock() { try { if (document.pointerLockElement === cv) document.exitPointerLock(); } catch (e) {} }
  const lockHint = document.createElement('div'); lockHint.className = 'hs-lockhint'; lockHint.setAttribute('aria-hidden', 'true'); lockHint.textContent = 'Click to look around'; let lockHintT = 0;
  function plOK() { return !window.GameInput?.touch && !controlsPaused && !worldLoading && live && (mode === 'walk'||mode==='focus'&&focusS?.o.seatId) && !viewOpen() && !ui.modalOpen(); }
  let lockTry = 0, lockPending = false;
  function wantLock() {
    if (!plOK() || locked() || lockPending || performance.now() - lockTry < 350) return;
    lockTry = performance.now(); lockPending = true;
    try { const r = cv.requestPointerLock(); if (r && r.then) r.then(() => {lockPending = false;}, () => {lockPending = false;}); else setTimeout(() => {lockPending = false;}, 500); } catch (e) {lockPending = false;}
  }
  // capture the mouse whenever we can while walking (the browser only allows it on a click or key press, so: every one)
  const inRoom = () => !controlsPaused && live && (mode === 'walk' || mode === 'glide'||mode==='focus'&&focusS?.o.seatId) && !viewOpen();
  const freeIfPC = () => { if (!inRoom() && locked()) unlock(); }; // sitting down or leaving the room always gives the desktop mouse back
  setInterval(freeIfPC, 300);
  document.addEventListener('mousedown', freeIfPC, true);
  document.addEventListener('pointerlockchange', () => {
    const on = locked(); lockPending = false; clearTimeout(lockHintT); PT.clear();
    if (!on) for (const k in keys) keys[k] = false;
    ui.el.classList.toggle('locked', on); lockHint.classList.toggle('on', !on && inRoom());
    if (on) { lastPt = { x: vw / 2, y: vh / 2, ok: true, mouse: true }; setHot(null); ui.tip(null); }
    else { if (inRoom()) { if (!ui.el.contains(lockHint)) ui.el.appendChild(lockHint); lockHint.classList.add('on'); lockHintT = setTimeout(() => lockHint.classList.remove('on'), 4000); } hoverQ = false; }
  });
  pb.addEventListener('pointermove', ev => {
    if(controlsPaused||ev.pointerType&&ev.pointerType!=='mouse')return;
    if (locked()) {
      if (mode === 'walk' || mode === 'glide'||mode==='focus'&&focusS?.o.seatId) { if (mode === 'glide' && glide) { if (!glide.lock) { glide.look.ry += ev.movementX * 0.1; glide.look.rx -= ev.movementY * 0.1; } } else { P.ry += ev.movementX * 0.1; P.rx = clamp(P.rx - ev.movementY * 0.1, -78, 70); } dirty(); lastPt = { x: vw / 2, y: vh / 2, ok: true, mouse: true }; hoverQ = true; }
      return;
    }
    lastPt = { x: ev.clientX, y: ev.clientY, ok: true, mouse: ev.pointerType === 'mouse' };
    const p = PT.get(ev.pointerId);
    if (p) {
      p.x = ev.clientX; p.y = ev.clientY;
      const dx = p.x - p.x0, dy = p.y - p.y0;
      if (!p.drag && Math.hypot(dx, dy) > (p.type === 'mouse' ? 5 : 9)) { p.drag = true; if (mode === 'glide') cancelGlide(); p.ry0 = P.ry - 0; p.rx0 = P.rx; p.x0 = p.x; p.y0 = p.y; }
      if (p.drag && (mode === 'walk'||mode==='focus'&&focusS?.o.seatId)) {
        const k = 0.22 * 1366 / Math.max(800, vw);
        P.ry = p.ry0 + (p.x - p.x0) * k; P.rx = clamp(p.rx0 - (p.y - p.y0) * k, -78, 70);
        dirty();
      }
      return;
    }
    if (ev.pointerType === 'mouse') hoverQ = true;
  });
  const endPt = ev => {
    const p = PT.get(ev.pointerId); if (!p) return; PT.delete(ev.pointerId);
    if (ev.type === 'pointercancel') return;
    if (locked()) { if (!p.drag) { if (held) drop(null, null, 'user'); else useAt(vw / 2, vh / 2, true); } return; }
    if (!p.drag && performance.now() - p.t0 < 900) { if (held) drop(ev.clientX, ev.clientY, 'user'); else useAt(ev.clientX, ev.clientY); }
    // Resolve the original click before locking: acquiring on mousedown used
    // to turn an off-centre click into an action on the centre object.
    if (!p.drag && p.type === 'mouse' && ev.button === 0) wantLock();
  };
  pb.addEventListener('contextmenu',ev=>{if(held&&(['walk','glide'].includes(mode)||mode==='focus'&&focusS?.o.seatId)&&!controlsPaused&&!viewOpen()){ev.preventDefault();ev.stopPropagation();putBack()}});
  pb.addEventListener('pointerup', endPt); pb.addEventListener('pointercancel', endPt);
  // Wheel turns what you're carrying (15 degree clicks); Shift + wheel (or + / -) brings it nearer or further.
  pb.addEventListener('wheel', ev => { if (!live || !held || controlsPaused) return; ev.preventDefault(); const d = Math.sign(ev.deltaY || ev.deltaX); if (!d) return; if (ev.shiftKey && !held.drag) held.d = clamp(held.d - d * 8, 25, 150); else held.ry += d * 15; dirty(); }, { passive: false });
  pb.addEventListener('pointerleave', () => { setHot(null); ui.tip(null); });
  let hoverQ = false;
  function hover() {
    if (!lastPt.mouse || !canAct() || PT.size) return;
    const h=pick(lastPt.x,lastPt.y,held?{skip:o=>o.userData.spot===held.id}:undefined);
    carrySeat=held&&!focusS&&h&&THINGS[h.spot]?.seat&&h.dist<=SPOTS[h.spot].range?h.spot:null;
    const sid = h && h.spot && !(held && h.spot === held.id) ? h.spot : null;
    setHot(sid);
    const s = sid && SPOTS[sid];
    if (!held) ui.tip(s ? (typeof s.label === 'function' ? s.label() : s.label) + (s.grab&&!held&&h.dist<=s.range?' <i><span><kbd>E</kbd> Pick up</span>'+'<span><kbd>F</kbd> '+esc(actionLabel(THINGS[sid]))+'</span>'+'</i>' : '') : null, lastPt.x, lastPt.y, s && h.dist > s.range);
    pb.classList.toggle('hs-hot', !!sid);
  }
  // Ordinary interaction never moves the player. Screens/inspection own their
  // explicit camera transitions; a distant door is not a travel command.
  function useAt(sx, sy, center,action) {
    if (!canAct()) return;
    const h = pick(sx, sy);
    if (!h || !h.spot) { if (!center && h && h.dist < 1200) emit('miss', h); return; }
    const s = SPOTS[h.spot];
    const perform=()=>{const item=THINGS[s.id];if(action==='use'&&s.grab&&item){if(s.use&&s.act&&!item.use)act(s);else interact(item.id);}else if(action!=='use'&&s.remove)s.remove();else act(s);};
    if (h.dist > s.range) { ui.toast(typeof s.label==='function'?s.label():s.label,'Move closer, then press F or click.'); return; }
    perform();
  }
  function act(s) {
    if (!s) return;
    emit('click', s.id);
    if (s.grab && THINGS[s.id] && !s.use) { grab(s.id); return; }
    if (s.act) try { s.act(s.id); } catch (e) { console.error(e); }
  }
  // a good place to stand to use a thing: its own view, or a step towards it from where you are
  function viewFor(s, h) {
    if (s.view) return typeof s.view === 'function' ? s.view() : Object.assign({ lvl: (ROOMS[s.room] || cur).lvl }, s.view);
    const c = s.at ? s.at() : (h ? h.p : null); if (!c) return null;
    const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz) || 1, want = s.near || 95;
    let best = null;
    for (let k = want; k < d + 1; k += 10) { const x = c.x + dx / d * k, z = c.z + dz / d * k; if (cellOk(W.lvl, x, z)) { best = { x, z }; break; } }
    if (!best) return null;
    const ey = W.fy - STAND, ry = Math.atan2(c.x - best.x, -(c.z - best.z)) / D2R, rx = Math.atan2(-(c.y - ey), Math.hypot(c.x - best.x, c.z - best.z)) / D2R;
    return { x: best.x, y: ey, z: best.z, ry, rx: clamp(rx, -60, 40), lvl: W.lvl };
  }

  // Inspect the actual prop. Its temporary pose never replaces its saved home.
  let inspection = null;
  const actionLabel=t=>!t?.use||t.useLabel==='Inspect'?'Look closely':t.useLabel||'Use';
  let carrySeat=null;
  // F while carrying: doors, drawers, cupboards, the car boot, switches and seats you're aiming at work with your hands
  // full; aiming at nothing usable, F uses (or looks closely at) the thing you're carrying.
  const doorOf = s => { for (const d of Object.values(DOORS)) { if (!d.pivot || !s.obj) continue; for (let o = s.obj; o; o = o.parent) if (o === d.pivot) return d; } return null; };
  function verbFor(s) {
    // (a label can carry its own key hint as markup, like a person's "<i><span><kbd>F</kbd> Talk</span></i>": a verb is plain words)
    const raw = String(typeof s.label === 'function' ? s.label() : s.label || ''), hint = /<kbd>F<\/kbd>\s*([^<]+)/.exec(raw);
    const label = raw.replace(/\s*<i>[\s\S]*<\/i>\s*$/, '').replace(/<[^>]*>/g, '').replace(/\s*\(.*\)$/, ''), o = OPEN[s.id], d = doorOf(s);
    if (hint && /^talk$/i.test(hint[1].trim())) return 'Talk to ' + label;
    const low = label.replace(/^(The|My|Your) /, m => m.toLowerCase());
    if (o) return (o.open ? 'Close ' : 'Open ') + low.replace(/^./, c => c.toLowerCase());
    if (d) return d.open ? (/^Shut /.test(label) ? label : 'Shut the door') : 'Open ' + (/door/i.test(label) ? low : 'the door');
    if (/(^|\.)(car)?boot\b/.test(s.id)) return H_ROOMS_boot() ? 'Close the boot' : 'Open the boot';
    if (!label) return 'Use';
    return /^(Open|Shut|Close|Turn|Switch|Play|Read|Look|Sit|Use|Plug|Press|Answer|Pick|Put|Ring|Watch|Listen|Feed|Pet|Lie|Get|Take|Wind|Water|Empty|Check|Raid|Set|Talk|F:)/.test(label) ? label.replace(/^F:\s*/, '').replace(/^./, c => c.toUpperCase()) : 'Use ' + low.replace(/^./, c => c.toLowerCase());
  }
  const H_ROOMS_boot = () => !!ROOMS.drive?.carBoot?.open;
  function closedOpenable(s) { const o = OPEN[s.id], d = doorOf(s); if (o) return !o.open; if (d) return !d.open; if (/(^|\.)(car)?boot\b/.test(s.id)) return !H_ROOMS_boot(); return false; }
  let carryAim = null, carryAimAt = 0;
  function aimedAction(fresh) {
    if (!held) return null;
    const now = performance.now(); if (!fresh && now - carryAimAt < 140) return carryAim; carryAimAt = now;
    const h = carryPick(fresh); carryAim = null;
    if (!h || !h.spot) return null;
    const s = SPOTS[h.spot]; if (!s || s.off || h.dist > s.range) return null;
    const th = THINGS[h.spot];
    if (th) { if (th.seat && !focusS && (!held.drag || th.id === held.id)) carryAim = { kind: 'seat', s, th, label: held.drag ? 'Sit down' : 'Sit down with it' }; return carryAim; }
    if (s.grab || !s.act || s.carry === false) return null;
    // Something with its own job in your hands (the sweets bowl, the watering can, the phone) keeps F for that job;
    // with it you can still open a shut door, drawer or the boot, but F never shuts one in front of you.
    const t = THINGS[held.id];
    if (t && t.use && !/look closely|inspect/i.test(t.useLabel || '') && !closedOpenable(s)) return null;
    carryAim = { kind: 'act', s, label: verbFor(s) };
    return carryAim;
  }
  function useHeld() {
    if (!held) return false;
    const a = aimedAction(true), t = THINGS[held.id];
    if (a && a.kind === 'seat') { if (held.drag) { const id = held.id; letGo(); return sitOn(id); } return sitOn(a.th.id); }
    if (a) { act(a.s); return true; }
    if (held.drag && t.seat) { const id = held.id; letGo(); return sitOn(id); }
    return interact(held.id);
  }
  function interact(id){const t=THINGS[id];if(!t||controlsPaused||worldLoading)return false;return t.use?t.use(t):inspect(id);}
  function suspendGrip(id){if(!held||held.id!==id)return null;const grip=held;held=null;unshrink(THINGS[id]);ui.holdBar(null);snapGlow(null);floorGlow(null);return grip;}
  function restoreGrip(grip){if(!grip||held||!THINGS[grip.id])return false;held=grip;const t=THINGS[grip.id];t.st='held';t.inspectFront=false;layerFor(t);ui.holdBar(t);dirty();return true;}
  function inspect(id) {
    if (inspection || !(mode==='walk'||mode==='focus'&&focusS?.o.seatId) || worldLoading) return false;
    const t = THINGS[id]; if (!t || (held && held.id !== id)) return false;
    const auto = !held; // looked at where it lies (not from your hands): closing puts it back there
    if (!held && !grab(id)) return false;
    unshrink(t);const grip=held,seat=focusS?.o.seatId?focusS:null;held=null;t.st='inspect';unlock();
    for (const k in keys) keys[k] = false;
    ui.holdBar(null); snapGlow(null); floorGlow(null); ui.hush(); ui.tip(null); setMode('inspect');
    t.obj.updateWorldMatrix(true, true); const box = new T.Box3();
    t.obj.traverse(o => {if (o.isMesh && !o.userData.contactShadow) {o.geometry.computeBoundingBox(); const m = new T.Matrix4().copy(t.obj.matrixWorld).invert().multiply(o.matrixWorld); box.union(o.geometry.boundingBox.clone().applyMatrix4(m));}});
    const centre = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
    const panel = document.createElement('div'); panel.className = 'hs-inspection';
    const name = document.createElement('b'); name.textContent = typeof t.label === 'function' ? t.label() : t.label;
    const hint=document.createElement('span');hint.innerHTML='<span data-input-only="keyboard">'+(t.obj.userData.cube?'Drag a face: move · Right-drag: rotate':'Drag: rotate')+(t.issueId?'':' · <kbd>Arrows</kbd> Rotate')+' · <kbd>R</kbd> Turn · <kbd>+ / −</kbd> / Wheel: zoom · <kbd>Q</kbd> Back · <kbd>Esc</kbd> Menu</span><span data-input-only="touch">'+(t.obj.userData.cube?'Drag a face: move · Two fingers: turn and zoom':'Drag: turn it · Two fingers: zoom')+'</span>';
    const back = document.createElement('button'); back.type = 'button'; back.textContent='Back [Q]'; back.addEventListener('click', endInspect);
    panel.append(name, hint, back); ui.el.appendChild(panel);
    const ip = t.inspectPose || {};
    inspection = {t, grip, seat, auto, centre, panel, yaw: -P.ry + (ip.yaw ?? 24), pitch: ip.pitch ?? (id === 'gb' ? -80 : -18), zoom: ip.zoom ?? 1, radius: size.length() / 2, drag: null};
    if(t.onInspectUse){const use=document.createElement('button');use.type='button';use.textContent=(t.inspectUseLabel||'Use')+' [F]';use.dataset.inspectUse='';use.addEventListener('click',()=>{if(!controlsPaused)t.onInspectUse(t)});panel.insertBefore(use,back)}
    // the close-up eases in from where the thing was (no pop): same curve as the camera, short and quick
    { const ms=motionMs(MOTION.ms.inspect); if(ms){inspection.blend={t0:performance.now(),ms,p:t.obj.position.clone(),q:t.obj.quaternion.clone()};html.classList.add('hs-inspect-arriving');anims.set('inspect-blend',()=>{if(!inspection?.blend||mode!=='inspect'){if(inspection)inspection.blend=null;html.classList.remove('hs-inspect-arriving');return false}poseInspect();return !!inspection?.blend;});} }
    html.classList.add('hs-inspecting');layerFor(t);poseInspect();try{t.onInspectStart?.(panel)}catch(e){console.error(e)}return true;
  }
  function poseInspect() {
    const s = inspection; if (!s) return;
    const angle = camera.fov * D2R / 2, fit = Math.min(angle, Math.atan(Math.tan(angle) * vw / vh));
    const d = Math.max(10, s.radius / Math.sin(fit) * 1.24) * s.zoom, f = fwd(), t = s.t;
    t.obj.rotation.set(s.pitch * D2R, s.yaw * D2R, 0, 'YXZ');
    const offset = s.centre.clone().applyEuler(t.obj.rotation);
    t.obj.position.set(P.x + f.x * d - offset.x, P.y + f.y * d - offset.y, P.z + f.z * d - offset.z);
    if (s.blend) { const b = s.blend, k = clamp((performance.now() - b.t0) / b.ms, 0, 1), e = H5(k); t.obj.position.lerpVectors(b.p, t.obj.position.clone(), e); t.obj.quaternion.copy(b.q).slerp(t.obj.quaternion.clone(), e); if (k >= 1) { s.blend = null; html.classList.remove('hs-inspect-arriving'); } }
    t.obj.updateMatrixWorld(true); dirty();
  }
  function endInspect() {
    const s = inspection; if (!s) return;
    if (s.t.obj.userData.cube) s.t.obj.userData.cube.finish();
    s.panel.remove(); inspection = null; html.classList.remove('hs-inspecting');
    held=s.grip;s.t.st='held';setMode(s.seat?'focus':'walk');ui.holdBar(s.t);dirty();anims.delete('inspect-blend');html.classList.remove('hs-inspect-arriving');
    // back into the hand on an eased curve (the carry's own follow takes over once it is there)
    { const t=s.t,ms=motionMs(MOTION.ms.inspectEnd),p0=t.obj.position.clone(),q0=t.obj.quaternion.clone(),t0=performance.now(),qt=new T.Quaternion(),eu=new T.Euler(),v=new T.Vector3();
      if(ms&&held&&!held.drag){t.st='settle';anims.set('inspect-return:'+t.id,n=>{if(t.st!=='settle'||!held||held.id!==t.id){if(t.st==='settle'){t.st='held';if(!held){held=s.grip;putBack();}}return false}const k=clamp((n-t0)/ms,0,1),e=H5(k),hp=heldPos();t.obj.position.copy(p0).lerp(v.set(hp.x,hp.y,hp.z),e);t.obj.scale.setScalar(1+(hp.k-1)*e);t._hk=true;qt.setFromEuler(eu.set(HOLD.tiltSign*holdTilt()*D2R,(-P.ry+held.ry+(t.faceYou?180:0))*D2R,0,'YXZ'));t.obj.quaternion.copy(q0).slerp(qt,e);if(k<1)return true;t.st='held';layerFor(t);return false;});} }
    try { s.t.onInspectEnd?.(); } catch (e) { console.error(e); }
    emit('inspect-end',s.t.id);wantLock();
    if (s.auto && held && held.id === s.t.id && !held.drag) { anims.delete('inspect-return:' + s.t.id); s.t.st = 'held'; putBack(); }
  }
  document.addEventListener('pointerdown', ev => {
    const s=inspection;if(!s||controlsPaused||ev.target.closest('button,input,select,textarea,a,summary'))return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    // Touch: one finger turns it (or a cube face), two fingers pinch to zoom and turn it together.
    if(ev.pointerType==='touch'){(s.points||(s.points=new Map())).set(ev.pointerId,{x:ev.clientX,y:ev.clientY});if(s.points.size>1){const p=[...s.points.values()].slice(0,2);s.drag={two:true,x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,span:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),zoom:s.zoom,moved:true};return}}
    const ray = new T.Raycaster(); ray.layers.enableAll(); ray.setFromCamera(new T.Vector2(ev.clientX / vw * 2 - 1, 1 - ev.clientY / vh * 2), camera);
    const hit = ray.intersectObject(s.t.obj, true).find(h => h.object.userData.cubie);
    s.drag={id:ev.pointerId,x:ev.clientX,y:ev.clientY,startX:ev.clientX,startY:ev.clientY,button:ev.button,moved:false,hit:ev.button===0?hit:null};
  }, true);
  document.addEventListener('pointermove', ev => {
    const s = inspection, d = s && s.drag;
    if(s?.points?.has(ev.pointerId))s.points.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(d?.two&&!controlsPaused){ev.preventDefault();ev.stopImmediatePropagation();const p=[...s.points.values()].slice(0,2);if(p.length<2)return;const cx=(p[0].x+p[1].x)/2,cy=(p[0].y+p[1].y)/2,span=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);s.yaw=(s.yaw+(cx-d.x)*.45)%360;s.pitch=(s.pitch-(cy-d.y)*.45)%360;d.x=cx;d.y=cy;if(d.span>20&&span>20)s.zoom=clamp(d.zoom*d.span/span,.78,1.8);poseInspect();return}
    if(!d||d.id!==ev.pointerId||controlsPaused)return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    const x=ev.clientX,y=ev.clientY,dx=x-d.x,dy=y-d.y;if(Math.hypot(x-d.startX,y-d.startY)>5)d.moved=true;
    if (d.hit) {if (Math.hypot(dx, dy) > 22) {s.t.obj.userData.cube.drag(d.hit, dx, dy); s.drag = null;}}
    else {s.yaw = (s.yaw+dx*.45)%360; s.pitch = (s.pitch-dy*.45)%360; d.x=x;d.y=y;poseInspect();}
  }, true);
  const inspectUp=ev=>{const s=inspection;s?.points?.delete(ev.pointerId);const d=s?.drag;if(d?.two){if(!s.points.size)s.drag=null;return}if(!d||d.id!==ev.pointerId)return;s.drag=null;
    if(ev.type!=='pointerup'||controlsPaused||d.moved||d.button!==0||!s.t.onInspectClick)return;
    const ray=new T.Raycaster();ray.layers.enableAll();ray.setFromCamera(new T.Vector2(ev.clientX/vw*2-1,1-ev.clientY/vh*2),camera);
    const hit=ray.intersectObject(s.t.obj,true).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible||o.userData.contactShadow)return false;return true});
    try{s.t.onInspectClick(hit)}catch(e){console.error(e)}
  };
  document.addEventListener('pointerup',inspectUp);document.addEventListener('pointercancel',inspectUp);
  document.addEventListener('contextmenu', ev => {if (inspection) ev.preventDefault();});
  document.addEventListener('wheel', ev => {if (!inspection||controlsPaused) return; ev.preventDefault(); ev.stopImmediatePropagation(); inspection.zoom = clamp(inspection.zoom + Math.sign(ev.deltaY) * .08, .78, 1.8); poseInspect();}, {capture:true, passive:false});
  addEventListener('resize', poseInspect);

  // ================================================================ sitting down to use something (the telly, the phone, the fridge door)
  // focus(pose, { enter(), exit(), label }) glides you there; you can't walk until you get up (the button, or Esc)
  let focusS = null;
  function focus(pose, o) {
    o = o || {};
    const parent=focusS?.o.seatId&&['focus','walk'].includes(mode)?focusS:null;
    if ((focusS&&!parent) || !(mode==='walk'||mode==='glide'||parent) || viewOpen())return false;
    unlock();
    if(held&&!o.seatId)setAside(); // (a screen or the PC needs both hands: set it down where its ghost is, else back)
    focusS = {parent,back: { x: P.x, y: P.y, z: P.z, rx: P.rx, ry: P.ry, lvl: W.lvl, seat: W.seat }, o };
    for (const k in keys) keys[k] = false;
    glideTo(pose, { lock: true, ms: o.ms || MOTION.ms.focus, kind: o.kind || 'focus', at: o.at, cancel:()=>{if(focusS)unfocus()}, done: () => { if (!focusS) return; mode = 'focus'; html.classList.add('hs-focus'); ui.focusBar(o.label || 'Get up'); if (o.enter) try { o.enter(); } catch (e) { console.error(e); } } });
    return true;
  }
  function seatExit(p){
    const lvl=p.lvl||W.lvl,r=roomAt(p.x,p.z,lvl);
    if(!r)return null;
    for(let distance=0;distance<=90;distance+=5)for(let i=0;i<(distance?16:1);i++){
      const a=i*Math.PI/8,x=p.x+Math.sin(a)*distance,z=p.z+Math.cos(a)*distance;
      if(roomAt(x,z,lvl)?.id===r.id&&floorAt(x,z,lvl,LV[lvl]))return Object.assign({},p,{x,z,y:LV[lvl]-STAND,seat:0,lvl});
    }return null;
  }
  // Is a seat tucked under something (the desk top over the chair's seat)? Then it rolls out towards you before you sit.
  function tuckedUnder(t) {
    const b = t.body, ph = physReady(); if (!b || !ph) return false;
    const seat = b.wp.find(w => w.part.top) || b.wp[0];
    return ph.staticsNear(b.lvl, seat.ax0, seat.az0, seat.ax1, seat.az1).some(s => s.bot <= seat.top + 0.5 && s.bot > seat.top - 50 && ph._.footprint(seat, s));
  }
  // Roll it out towards you (about 2.5 cm a frame, a little further than the desk edge so the seat is clear to sit on).
  function pullOut(t, done) {
    const b = t.body; if (!b) return done();
    let n = 0, clear = 0;
    anims.set('pull:' + t.id, (now, dt) => {
      const dx = W.x - b.x, dz = W.z - b.z, d = Math.hypot(dx, dz) || 1, step = clamp((dt || 0.016) * 160, 1.5, 6);
      if (!tuckedUnder(t)) clear += step;
      b.ignorePlayer = true; // (you're about to sit in it: it may roll into where you stand)
      if (clear < 10 && n++ < 60) { const got = PH.tryMove(b, dx / d * step, dz / d * step); renderBody(t); if (n % 6 === 1) physicalSound(t.physics?.castors ? 'roll' : 'scrape', { weight: thingWeight(t), speed: 120 }); if (Math.hypot(got[0], got[1]) < 0.05) n = 99; return true; }
      b.ignorePlayer = false; t.at.room = roomAt(b.x, b.z, b.lvl)?.id || t.at.room; syncBody(t); saveThings(); done(); return false;
    });
  }
  function sitOn(id, saved) {
    const t=THINGS[id];if(t?.seat&&t.st==='held'){ui.toast('Put the seat down','E / Click places it. Then F sits down.');return false;}if(!t?.seat||!['rest','snap'].includes(t.st)||t.at.hide||t.at.room!==cur?.id||focusS)return false;
    if(!saved&&t.st==='rest'&&tuckedUnder(t)){pullOut(t,()=>{if(tuckedUnder(t)){ui.toast('No room to sit','Pull the chair out from under the desk first: E takes hold of it.');return;}sitOn(id,{pulled:1})});return true;}
    const at=t.at,yaw=(at.ry||0)+(t.swivel?at.sw||0:0),a=yaw*D2R,front=t.seat.front||0;
    const pose={x:at.x+Math.sin(a)*front,y:at.y-t.seat.eye,z:at.z+Math.cos(a)*front,rx:-4,ry:180-yaw,seat:1,lvl:cur.lvl};
    if(Number.isFinite(saved?.rx)&&Number.isFinite(saved?.ry)){pose.rx=saved.rx;pose.ry=saved.ry;}
    if(saved?.pulled)saved=null;
    const back=seatExit(saved?.back&&validPose(saved.back)?saved.back:Object.assign({},P,{lvl:W.lvl}));
    if(!back){ui.toast('No room to stand','Clear some floor beside the seat first.');return false;}
    if(!focus(pose,{seatId:id,label:'Stand up / WASD',enter:()=>{wantLock();dirty()}}))return false;
    if(back)focusS.back=back;
    ls.set('jhp_hs_furniture_seat',{id,back:focusS.back,rx:pose.rx,ry:pose.ry});if(stood)ls.set('jhp_hs_stand',{t:Date.now(),p:focusS.back});return true;
  }
  function resumeSeat(){const saved=ls.get('jhp_hs_furniture_seat',null);if(saved&&mode==='walk'&&!focusS)sitOn(saved.id,saved);}
  function unfocus(now) {
    if (!focusS) return; const f = focusS; focusS = null;
    if(f.o.seatId){ls.del('jhp_hs_furniture_seat');f.back=seatExit(f.back)||f.back;}
    html.classList.remove('hs-focus'); ui.focusBar(null);
    if (f.o.exit) try { f.o.exit(); } catch (e) { console.error(e); }
    mode='walk';glideTo(f.back,{lock:!!(f.o.seatId||f.parent),ms:now?0:(f.o.backMs||MOTION.ms.unfocus),kind:'unfocus',at:f.o.backAt,done:()=>{
      if(f.parent){focusS=f.parent;Object.assign(P,f.back);mode='focus';html.classList.add('hs-focus');ui.focusBar(focusS.o.label||'Get up');dirty()}
      else setWalkFrom(f.back);
      wantLock();
    }});
  }
  // a piece of page laid onto a flat thing in the room (perspective correct), so it's crisp and you can click it
  const SURF = new Set();
  function surface(el, quad, o) {
    o = o || {};
    const s = { el, quad, w: o.w || 400, h: o.h || 300, screen:!!o.screen, locked:false };
    el.classList.add('hs-surf'); el.style.width = s.w + 'px'; el.style.height = s.h + 'px';
    ui.el.appendChild(el); SURF.add(s); placeSurf(s); dirty();
    s.close = () => { SURF.delete(s); el.remove(); };
    return s;
  }
  // faceQuad(w, h, dist, dy, dx) -> a function giving the four corners (tl, tr, br, bl) of a w x h cm card held dist cm in front
  // of your eyes, dy cm below the eye line (y is down) and dx to the right, squared to your view
  function faceQuad(w, h, dist, dy, dx) {
    return () => {
      const f = fwd(), a = P.ry * D2R, rt = { x: Math.cos(a), y: 0, z: Math.sin(a) };
      const u = { x: rt.y * f.z - rt.z * f.y, y: rt.z * f.x - rt.x * f.z, z: rt.x * f.y - rt.y * f.x }; // "up" on the card (y is down, so it points to -y when level)
      const cx = P.x + f.x * dist + rt.x * (dx || 0) - u.x * (dy || 0), cy = P.y + f.y * dist - u.y * (dy || 0), cz = P.z + f.z * dist + rt.z * (dx || 0) - u.z * (dy || 0);
      const hw = w / 2, hh = h / 2;
      return [[cx - rt.x * hw + u.x * hh, cy - rt.y * hw + u.y * hh, cz - rt.z * hw + u.z * hh], [cx + rt.x * hw + u.x * hh, cy + rt.y * hw + u.y * hh, cz + rt.z * hw + u.z * hh], [cx + rt.x * hw - u.x * hh, cy + rt.y * hw - u.y * hh, cz + rt.z * hw - u.z * hh], [cx - rt.x * hw - u.x * hh, cy - rt.y * hw - u.y * hh, cz - rt.z * hw - u.z * hh]];
    };
  }
  function placeSurf(s) {
    s.el.classList.toggle('hs-surface-lock',s.locked);
    if(s.locked){const k=Math.min(vw/s.w,vh/s.h);s.el.style.visibility='';s.el.style.transform=`translate(${(vw-s.w*k)/2}px,${(vh-s.h*k)/2}px) scale(${k})`;return;}
    const q = (typeof s.quad === 'function' ? s.quad() : s.quad).map(p => toScreen(p[0], p[1], p[2]));
    if (q.some(p => !p)) { s.el.style.visibility = 'hidden'; return; }
    s.el.style.visibility = '';
    s.el.style.transform = 'matrix3d(' + homography(s.w, s.h, q).map(v => +v.toFixed(8)).join(',') + ')';
  }
  function surfaceScreen(full){const s=[...SURF].find(s=>s.screen);if(!s)return null;if(typeof full==='boolean'){s.locked=full;placeSurf(s);dirty()}return{locked:s.locked,width:s.w,height:s.h};}

  // ================================================================ the HUD (2D, kept small: where you are, the look arrows, notes)
  const ui = (function () {
    const el = document.createElement('div'); el.className = 'hs-ui rm-hud'; el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="hs-top"><span class="hs-title">YOUR HOUSE</span><span class="hs-where"></span></div>
      <canvas class="hs-map" width="84" height="84" aria-hidden="true"></canvas>
      <div class="hs-cross" aria-hidden="true"></div>
      <div class="hs-tip" aria-hidden="true"></div>
      <div class="hs-hold" hidden><small class="hs-hmode">CARRYING</small><span class="hs-hname"></span><span class="hs-hkeys"></span><small class="hs-carry-help">Wheel: turn · Right click / Q: return · Esc: menu</small><span class="hs-hbtn"><button type="button" data-h="near" aria-label="Nearer">&minus;</button><button type="button" data-h="far" aria-label="Further">+</button><button type="button" data-h="turn">Turn</button><button type="button" data-h="use" hidden></button><button type="button" data-h="put">Place [E]</button><button type="button" data-h="drop">Drop [X]</button><button type="button" data-h="back">Return [Q]</button></span></div>
      <button type="button" class="hs-getup" hidden><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13 3 6 10l7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Get up</span></button>
      <div class="hs-note rm-note"><b></b><p></p><button type="button" class="rm-x" aria-label="Close">&times;</button></div>
      <div class="hs-toast rm-toast"></div>
      <div class="hs-fade"></div>`;
    const $ = s => el.querySelector(s);
    let noteT=0,toastT=0,holdKey='',snapKey='',tipKey='',tipW=0,tipH=0;
    const note = $('.hs-note'), toastEl = $('.hs-toast'), tipEl = $('.hs-tip'), hold = $('.hs-hold');
    note.querySelector('.rm-x').addEventListener('click', () => note.classList.remove('on'));
    hold.addEventListener('click', ev => {
      const b = ev.target.closest('[data-h]'); if (!b || !held) return; const a = b.dataset.h, t = THINGS[held.id];
      if (a === 'near') held.d = clamp(held.d - 12, 25, 150); else if (a === 'far') held.d = clamp(held.d + 12, 25, 150);
      else if (a === 'turn') held.ry += 45; else if (a === 'inspect') interact(t.id); else if (a === 'put') drop(null, null, 'user'); else if (a === 'drop') letGo(); else if (a === 'back') putBack(); else if(a==='use'&&t)useHeld();
    });
    $('.hs-getup').addEventListener('click', () => unfocus());
    const map = $('.hs-map'), mg = map.getContext('2d');
    let crossT = 0;
    return {
      el,
      say(title,text,ms){if(inspection){let description=inspection.panel.querySelector('.hs-inspect-description');if(!description){description=document.createElement('p');description.className='hs-inspect-description';inspection.panel.appendChild(description)}description.innerHTML=text;note.classList.remove('on');return;}note.querySelector('b').textContent = title; note.querySelector('p').innerHTML = text; note.classList.add('on'); clearTimeout(noteT); noteT = setTimeout(() => note.classList.remove('on'), ms || Math.max(4500, String(text).length * 70)); },
      hush() { note.classList.remove('on'); },
      toast(title, text) { toastEl.innerHTML = `<b>${esc(title)}</b><span>${esc(text)}</span>`; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 4200); },
      tip(text,x,y,far,carry){if(!text||(held&&!carry)){tipEl.classList.remove('on','carry');tipKey='';return;}const content=carry?text:text+(far?' <small>(walk closer)</small>':text.includes('<kbd>E</kbd>')?'':' <small><kbd>F</kbd> '+((/^(Talk|Open|Shut|Close|Play|Read|Sit|Watch|Listen|Feed|Pet|Water|Answer|Ring)\b/.exec(text)||['Use'])[0])+'</small>'),key=content+'|'+vw+'|'+vh;tipEl.classList.add('on');tipEl.classList.toggle('carry',!!carry);if(key!==tipKey){tipKey=key;tipEl.innerHTML=content;tipW=tipEl.offsetWidth;tipH=tipEl.offsetHeight;}tipEl.style.transform=`translate(${clamp(x+14,8,Math.max(8,vw-tipW-8))}px,${clamp(carry?y-tipH-16:y+18,8,Math.max(8,vh-tipH-8))}px)`;},
      where() {
        const r = cur; if (!r) return;
        $('.hs-title').textContent = r.title || r.name.toUpperCase(); $('.hs-where').textContent = r.stations[stIdx] ? r.stations[stIdx].n : r.sub || '';
      },
      // The carry panel: what you've got, whether it fits where you're aiming, and the keys that do something right now.
      holdBar(t) {
        if(!t){hold.hidden=true;holdKey=snapKey='';carrySeat=null;hold.classList.remove('snap','fit','blocked','drag');el.classList.remove('holding');this.tip(null);return;}
        hold.hidden=false;el.classList.add('holding');hold.querySelector('[data-h=inspect]')?.remove();
        this.carry(t,held&&held.drag?{drag:true}:null);
      },
      carry(t,g){
        if(!t||hold.hidden)return;
        const a=aimedAction(),label=typeof t.label==='function'?t.label():t.label,drag=!!(g&&g.drag);
        const f=a?a.label:drag&&t.seat?'Sit down':actionLabel(t);
        let mode='CARRYING',cls='',help,keys;
        if(drag){mode='MOVING';cls='drag';keys=[['E','Let go'],['F',f],['R','Turn'],['Q','Return']];help='Walk to slide it along the floor · Wheel: turn · Esc: menu';}
        else if(g&&g.snap){const hint=String(g.snap.hint||'Place here').replace(/^(?:Click\/E to |Let go(?: to|:)\s*|E:\s*)/i,'');mode='PLACE HERE';cls='snap';keys=[['E',hint.charAt(0).toUpperCase()+hint.slice(1)],a?['F',a.label]:null,['X','Drop'],['Q','Return']];help='The gold outline shows where it goes';}
        else if(g&&g.ok){cls='fit';keys=[['E','Place'],['X','Drop'],['F',f],['R','Turn'],['Q','Return']];help='Green ghost: it fits there · Wheel: turn · Shift+Wheel: nearer/further';}
        else if(g){mode="WON'T FIT";cls='blocked';keys=[['X','Drop'],['F',f],['R','Turn'],['Q','Return']];help=whyText(g.why)+'. Aim somewhere clear.';}
        else{keys=[['E','Place'],['F',f],['R','Turn'],['Q','Return']];help='Wheel: turn · Right click / Q: return · Esc: menu';}
        keys=keys.filter(Boolean);
        if(a)this.tip('<kbd>F</kbd> '+esc(a.label),vw/2,vh/2,false,true);else if(tipEl.classList.contains('carry'))this.tip(null);
        const key=[t.id,label,mode,cls,help,keys.map(k=>k.join(':')).join(',')].join('|');
        if(key===holdKey)return;holdKey=key;snapKey=cls==='snap'?key:'';
        for(const c of ['snap','fit','blocked','drag'])hold.classList.toggle(c,c===cls);
        hold.querySelector('.hs-hmode').textContent=mode;hold.querySelector('.hs-hname').textContent=label;
        hold.querySelector('.hs-hkeys').innerHTML=keys.map(([k,v])=>'<span><kbd>'+k+'</kbd> '+esc(v)+'</span>').join('');
        hold.querySelector('.hs-carry-help').textContent=help;
        const use=hold.querySelector('[data-h=use]');use.hidden=false;use.textContent=f+' [F]';
        hold.querySelector('[data-h=put]').textContent=drag?'Let go [E]':'Place [E]';hold.querySelector('[data-h=drop]').hidden=drag;
      },
      snapHint(s){if(held)this.carry(THINGS[held.id],s?{snap:s,ok:true}:null);},
      crossOn() { el.classList.add('cross'); clearTimeout(crossT); crossT = setTimeout(() => el.classList.remove('cross'), 2500); },
      fade(on, ms) { const f = $('.hs-fade'); f.style.transitionDuration = (ms || 300) + 'ms'; f.classList.toggle('on', !!on); },
      modalOpen: () => !!el.querySelector('.hs-modal.on'),
      focusBar(label) { const b = $('.hs-getup'); b.hidden = !label; if (label) b.querySelector('span').innerHTML = esc(label) + ' <kbd>Q</kbd>'; el.classList.toggle('focus', !!label); },
      map() { // a tiny plan of the floor you're on, with you on it
        const r = cur; if (!r) return; const w = 84, h = 84;
        mg.clearRect(0, 0, w, h);
        const lvl = W.lvl, sc = 0.105, ox = 34, oz = 14; // (cm to px)
        mg.fillStyle = 'rgba(255,240,210,.07)'; mg.strokeStyle = 'rgba(216,207,184,.35)'; mg.lineWidth = 1;
        for (const id in ROOMS) { const q = ROOMS[id]; if (q.lvl !== lvl || q.noMap) continue; for (const a of q.area) { const x = ox + a[0] * sc, y = oz + a[1] * sc; mg.fillStyle = q === r ? 'rgba(255,216,74,.18)' : 'rgba(255,240,210,.06)'; mg.fillRect(x, y, (a[2] - a[0]) * sc, (a[3] - a[1]) * sc); mg.strokeRect(x + 0.5, y + 0.5, (a[2] - a[0]) * sc - 1, (a[3] - a[1]) * sc - 1); } }
        const x = ox + W.x * sc, y = oz + W.z * sc, a = P.ry * D2R;
        mg.fillStyle = 'rgba(255,216,74,.35)'; mg.beginPath(); mg.moveTo(x, y); mg.arc(x, y, 14, a - Math.PI / 2 - 0.5, a - Math.PI / 2 + 0.5); mg.closePath(); mg.fill();
        mg.fillStyle = '#ffd84a'; mg.beginPath(); mg.arc(x, y, 2.6, 0, Math.PI * 2); mg.fill();
      },
    };
  })();
  let uiIn = false;
  function uiMount() { if (uiIn) return; uiIn = true; html.appendChild(ui.el); }

  // ================================================================ drawing
  let need = true, raf = 0, lastT = 0, lastAmb = 0, lastDraw=0, frame = 0, viewing = false, viewT = 0, physMs = 0;
  const budgetPose={x:NaN,y:NaN,z:NaN,rx:NaN,ry:NaN};
  function dirty() { need = true; }
  const ambient = new Set(); // things that animate gently (the lava lamp, a telly): redrawn ~20 times a second
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.12, (now - (lastT || now)) / 1000); lastT = now;
    if (!live || document.hidden) return;
    screenEffort();tickLights(dt);tickWorldSound(now);
    const vo = viewOpen(); if (vo !== viewing) { viewing = vo; viewT = now; html.classList.toggle('hs-viewing', vo); if (vo) { setHot(null); ui.tip(null); unlock(); } }
    // (the consoles' telly is up: once it has settled, the room behind needn't be drawn)
    if (vo && now - viewT > 600 && document.querySelector('.rm-tvv.rm-hand.on:not(.bye)') && !pb.classList.contains('rm-tvon')) pb.classList.add('rm-tvon');
    if ((pb.classList.contains('rm-tvon') || pb.classList.contains('deep')) && !monitor) return; // (the telly's up, or we've flown into the PC)
    if (glLost() && !rebuildGL()) return; // (room's context was dropped: rebuilt now it's on show again)
    let moving = false;
    syncPlayerBody(); seatSwivel();
    if (mode === 'follow') moving = followCss();
    else {
      if (mode === 'glide' && !glide) mode = 'walk';
      if (tickGlide(now)) moving = true;
      else if (mode === 'walk'&&!controlsPaused) { let left = dt; while (left > 1e-4) { const st = Math.min(0.03, left); left -= st; if (tickWalk(st)) moving = true; } }
      // (a lens left long by an interrupted close-up relaxes back to the walking view)
      if (!glide && mode === 'walk' && P.zm !== WZ) { P.zm += (WZ - P.zm) * Math.min(1, dt * 9); if (Math.abs(P.zm - WZ) < 1e-3) P.zm = WZ; moving = true; }
    }
    tickQueuedLock(now);
    for (const [k, fn] of anims) { let more = false; try { more = fn(now, dt); } catch (e) { console.error(e); } if (!more) anims.delete(k); moving = true; }
    if (PH) { const t0 = performance.now(); migrateRestored(); rescueQueued(); if (tickPhysics(dt)) moving = true; physAcc += performance.now() - t0; physFrame = physAcc; physAcc = 0; physMs = physMs * 0.92 + physFrame * 0.08; }
    if (tickThings(dt)) moving = true;
    if (hoverQ && frame % 3 === 0) { hoverQ = false; hover(); }
    frame++;
    const ambOn = ambient.size && now - lastAmb > (monitor?Math.max(100,1000/graphics.backgroundFps):50);
    if (!moving && !need && !ambOn) return;
    const period=1000/(Q.mob?(Q.cap||60):120);
    if(now-lastDraw<period-1){if(moving)need=true;return}
    lastDraw=now;
    let ambientChanged=false;
    if (ambOn) { lastAmb = now; for (const fn of ambient) try { if(fn(now)!==false)ambientChanged=true; } catch (e) {} }
    if(!moving&&!need&&!ambientChanged)return;
    need = false;
    const changed=P.x!==budgetPose.x||P.y!==budgetPose.y||P.z!==budgetPose.z||P.rx!==budgetPose.rx||P.ry!==budgetPose.ry;
    const renderStart=performance.now();render();mainDraws++;recordFrame(now,performance.now()-renderStart);
    fpsTick(now,moving||(mode==='walk'&&changed)||!!(Q.probe&&now<Q.probe));
    budgetPose.x=P.x;budgetPose.y=P.y;budgetPose.z=P.z;budgetPose.rx=P.rx;budgetPose.ry=P.ry;
    if (frame % 6 === 0) ui.map();
  }
  const screenWorld=new T.Vector3(),screenBudgets=new WeakMap();
  function screenRate(background){const hz=rung().screenHz;return background?Math.min(hz,graphics.backgroundFps):hz}
  // Reused result per physical screen: visibility and footprint, with no readback.
  function screenBudget(screen,background=false,locked=false){
    if(!screen)return null;
    let b=screenBudgets.get(screen);if(!b){b={visible:false,pixels:0,maxSize:128,fps:12};screenBudgets.set(screen,b)}
    b.fps=screenRate(background);b.visible=false;
    if(locked)return b;
    for(let o=screen;o;o=o.parent)if(!o.visible)return b;
    const geo=screen.geometry;if(!geo)return b;if(!geo.boundingSphere)geo.computeBoundingSphere();
    screen.updateWorldMatrix(true,false);const e=screen.matrixWorld.elements;
    screenWorld.copy(geo.boundingSphere.center).applyMatrix4(screen.matrixWorld);
    // The local +Z face of both CRTs and the Game Lad points at the viewer.
    if((P.x-screenWorld.x)*e[8]+(-P.y-screenWorld.y)*e[9]+(P.z-screenWorld.z)*e[10]<0)return b;
    screenWorld.y=-screenWorld.y;
    const depth=-viewZ(screenWorld.x,screenWorld.y,screenWorld.z);if(depth<=2)return b;
    const scale=Math.max(Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]));
    const diameter=2*geo.boundingSphere.radius*scale*PERSP*em*(P.zm||1)/depth;
    const a=P.ry*D2R,rx=P.rx*D2R,dx=screenWorld.x-P.x,dy=screenWorld.y-P.y,dz=screenWorld.z-P.z,z1=-dx*Math.sin(a)+dz*Math.cos(a),k=PERSP*em*(P.zm||1)/depth;
    const x=vw/2+(dx*Math.cos(a)+dz*Math.sin(a))*k,y=vh/2+(dy*Math.cos(rx)-z1*Math.sin(rx))*k;
    b.pixels=diameter;b.visible=diameter>=64&&x+diameter/2>0&&y+diameter/2>0&&x-diameter/2<vw&&y-diameter/2<vh;
    const projected=Math.max(128,diameter*Q.pixelRatio*1.25);
    b.maxSize=Math.min(2048,Math.pow(2,Math.ceil(Math.log2(projected))));return b;
  }
  const perfFrames=new Float32Array(120),perfCosts=new Float32Array(120),perfSorted=new Float32Array(120);
  let perfIndex=0,perfCount=0,perfLast=0,perfTotal=0,perfEl=null;
  function recordFrame(now,cost){perfFrames[perfIndex]=perfLast?now-perfLast:0;perfCosts[perfIndex]=cost;perfLast=now;perfIndex=(perfIndex+1)%120;perfCount=Math.min(120,perfCount+1);perfTotal++}
  function framePercentile(values,p){for(let i=0;i<perfCount;i++)perfSorted[i]=values[i];const sorted=perfSorted.subarray(0,perfCount);sorted.sort();return sorted[Math.min(perfCount-1,Math.floor(perfCount*p))]||0}
  function perfSnapshot(){return{frames:perfTotal,tier:Q.tier,adapt:Q.adapt,adaptMax:ADAPT.length-1,scale:Q.renderScale,pixels:cv.width*cv.height,calls:ren.info.render.calls,triangles:ren.info.render.triangles,programs:ren.info.programs.length,frameP50:framePercentile(perfFrames,.5),frameP95:framePercentile(perfFrames,.95),renderP50:framePercentile(perfCosts,.5),cap:Q.mob?(Q.cap||60):120}}
  setInterval(()=>{
    if(!graphics.showFps||!live){if(perfEl)perfEl.hidden=true;return}
    if(!perfEl){perfEl=document.createElement('div');perfEl.className='hs-perf';perfEl.setAttribute('aria-hidden','true');ui.el.appendChild(perfEl)}
    perfEl.hidden=false;const s=perfSnapshot(),idle=performance.now()-perfLast>500;
    perfEl.textContent=(idle?'IDLE':Math.round(1000/(s.frameP50||1))+' FPS')+' · '+s.frameP50.toFixed(1)+' ms (95% '+s.frameP95.toFixed(1)+')\n'+s.calls+' draws · '+s.triangles+' tris · '+s.programs+' programs\n'+'RUNG '+s.adapt+' · '+Math.round(s.scale*100)+'% · '+cv.width+' × '+cv.height;
  },500);
  // Invisible adaptation. Only consecutive demanded frames count (ambient animation deliberately runs at 20 Hz and must
  // not be mistaken for a struggling device). Down a rung after two slow windows (< 40 FPS), at most every 4 s; back up
  // after 12 s at full pace and never within 20 s of a step down. The level is remembered per device and GPU.
  let lastR=0,goodBudget=0,slowBudget=0,lastDown=0,lastStep=0;
  function fpsTick(now,continuous){
    const f=Q.f;
    if(!continuous||backgroundCovered()){lastR=0;f.n=0;f.t=0;return}
    const d=lastR?(now-lastR)/1000:0;lastR=now;
    if(d>0&&d<.75){f.n++;f.t+=d}
    if(Q.probe&&now<Q.probe)dirty();else if(Q.probe)Q.probe=0;
    if(f.t<.9)return;
    Q.fps=Math.round(f.n/f.t);f.n=0;f.t=0;
    // Phones on Potato try a smooth 60 first (touch look and walking feel stepped at 30); a phone that can't hold it
    // steadily goes back to a locked 30 (stable beats uneven), and tries 60 again later when frames are cheap.
    if(Q.mob){
      if(Q.cap===60){if(Q.fps<50){if(++Q.capMiss>=2){Q.cap=30;Q.capMiss=0;Q.capRetry=now+30000}}else Q.capMiss=0}
      else if(now>(Q.capRetry||0)&&Q.fps>=29&&framePercentile(perfCosts,.5)<6){Q.cap=60;Q.capMiss=0}
    }
    if(Q.pinned)return;
    if(Q.fps<(Q.mob&&Q.cap===30?26:40)){
      goodBudget=0;
      if(++slowBudget>=2&&Q.adapt<ADAPT.length-1&&now-lastStep>4000){slowBudget=0;lastDown=lastStep=now;adaptTo(Q.adapt+1)}
    }else if(Q.fps>=55&&Q.adapt>0){
      slowBudget=0;
      if(++goodBudget>=12&&now-lastDown>20000&&now-lastStep>4000){goodBudget=0;lastStep=now;adaptTo(Q.adapt-1)}
    }else{goodBudget=0;slowBudget=0}
  }
  function adaptTo(level,o){
    level=clamp(level|0,0,ADAPT.length-1);o=o||{};
    if(o.pin!==undefined)Q.pinned=!!o.pin;
    if(level===Q.adapt&&!o.force)return Q.adapt;
    Q.adapt=level;Q.f.n=Q.f.t=0;lastR=0;
    if(!o.pin)ls.set('jhp_hs_adapt',{gpu:Q.gpu,level});
    compileVariants(level);
    for(let i=0;i<PL.length;i++)PL[i].visible=i<rung().lamps;
    qualityView();measure();visCalc();lightsFor();emit('gfx',Q.adapt);
    // (prepare the next rung's programs while idle, so a later step never hitches)
    if(level<ADAPT.length-1)(window.requestIdleCallback||setTimeout)(()=>compileVariants(level+1));
    return Q.adapt;
  }
  function graphicsGet(){return{tier:Q.tier,adapt:Q.adapt,pinned:Q.pinned,showFps:graphics.showFps,actualAntialias:!!ren.getContext().getContextAttributes().antialias,actualScale:Q.renderScale,pixelRatioActual:Q.pixelRatio}}
  function showFps(on){graphics.showFps=!!on;ls.set('jhp_hs_fps',graphics.showFps);return graphics.showFps}
  // Scratch records survive frames. New records are only made when a model or
  // material first appears (building, pickup highlight or an editor change).
  let anyFront = false,litSerial=0,nodeCount=0,materialCount=0;
  const litNodes=[],litMaterials=[],litIDs=[],litTransparentIDs=[];
  const litNodeCache=new WeakMap(),litMaterialCache=new WeakMap(),litRooms=new WeakSet(),litDoors=new WeakSet();
  function litNode(obj,on,owner){
    let n=litNodeCache.get(obj);if(!n){n={obj,on:false,restore:false,owner:null};litNodeCache.set(obj,n)}
    n.on=on;n.restore=obj.visible;n.owner=owner;litNodes[nodeCount++]=n;
    if(on&&ROOMS[owner]&&litIDs.indexOf(owner)<0)litIDs.push(owner);
  }
  function litDoor(obj,d){if(!obj)return;litDoors.add(obj);let on=false;for(const id of d.rooms)if(ROOMS[id]?._renderDrawn){on=true;break}litNode(obj,obj.visible&&on,d.lightRoom||d.rooms[0])}
  function litMaterial(m){
    let s=litMaterialCache.get(m);if(!s){s={m,on:true,serial:0};litMaterialCache.set(m,s)}
    if(s.serial===litSerial)return;s.serial=litSerial;s.on=m.visible;litMaterials[materialCount++]=s;
  }
  function litCollect(o){const ms=o.material;if(Array.isArray(ms)){for(let i=0;i<ms.length;i++)litMaterial(ms[i])}else if(ms)litMaterial(ms)}
  function litDistance(id){const a=ROOMS[id].area[0];return a?Math.hypot((a[0]+a[2])/2-P.x,(a[1]+a[3])/2-P.z):0}
  const litBackToFront=(a,b)=>ROOMS[b]._renderDistance-ROOMS[a]._renderDistance;
  function renderLit(renderer) {
    windowProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);windowFrustum.setFromProjectionMatrix(windowProjection);
    nodeCount=materialCount=0;litIDs.length=0;litTransparentIDs.length=0;litSerial++;
    for(const id in ROOMS){
      const r=ROOMS[id];let drawn=visSet.has(id);
      if(drawn&&!window.House?.god&&windowOnly.has(id)){
        drawn=false;const bounds=windowOnly.get(id);for(let i=0;i<bounds.length;i++)if(!bounds[i]||windowFrustum.intersectsBox(bounds[i])){drawn=true;break}
      }
      if(drawn&&!window.House?.god&&doorOnly.has(id)){
        drawn=false;const routes=doorOnly.get(id);
        for(let i=0;i<routes.length&&!drawn;i++){const chain=routes[i];let all=true;for(let j=0;j<chain.length;j++)if(!windowFrustum.intersectsBox(chain[j])){all=false;break}drawn=all}
      }
      r._renderDrawn=drawn;litRooms.add(r.group);litNode(r.group,r.group.visible&&drawn,id);
    }
    for(const id in DOORS){const d=DOORS[id];litDoor(d.pivot,d);litDoor(d.frame,d)}
    const owner=cur&&cur.id;
    for(const obj of root.children)if(!litRooms.has(obj)&&!litDoors.has(obj)&&!obj.isLight&&obj!==sun.target)litNode(obj,obj.visible,owner);
    for(const obj of scene.children)if(obj!==root&&!obj.isLight)litNode(obj,obj.visible,owner);
    scene.traverseVisible(litCollect);
    const clear=renderer.autoClear,update=scene.autoUpdate,autoReset=renderer.info.autoReset,background=scene.background;
    scene.updateMatrixWorld(true);scene.autoUpdate=false;
    // A merged source that moved, hid or changed dissolves its batch before this frame draws (js/hs-static.js).
    if(window.HouseStatic&&renderer===ren){for(let i=0;i<litIDs.length;i++)HouseStatic.verify(ROOMS[litIDs[i]].group);for(let i=0;i<staticRoot.length;i++)if(staticRoot[i].visible)HouseStatic.verify(staticRoot[i])}renderer.autoClear=false;renderer.info.autoReset=false;renderer.info.reset();
    renderer.clear(true,true,true);
    for(let i=0;i<litIDs.length;i++){const id=litIDs[i];ROOMS[id]._renderDistance=litDistance(id);litTransparentIDs.push(id)}
    litTransparentIDs.sort(litBackToFront);
    try {
      // All opaque surfaces before glass; depth remains shared between rooms.
      for(let pass=0;pass<2;pass++){
        const transparent=pass===1,order=transparent?litTransparentIDs:litIDs;
        for(let i=0;i<materialCount;i++){const s=litMaterials[i];s.m.visible=s.on&&!!s.m.transparent===transparent}
        for(let i=0;i<order.length;i++){
          const id=order[i];scene.background=renderer===ren&&!transparent&&id===litIDs[0]?background:null;
          for(let j=0;j<nodeCount;j++){const n=litNodes[j];n.obj.visible=n.on&&n.owner===id}
          applyRoomRig(ROOMS[id]);renderer.render(scene,camera);
        }
      }
    } finally {
      for(let i=0;i<nodeCount;i++){const n=litNodes[i];n.obj.visible=n.restore}
      for(let i=0;i<materialCount;i++){const s=litMaterials[i];s.m.visible=s.on}
      scene.background=background;renderer.autoClear=clear;scene.autoUpdate=update;renderer.info.autoReset=autoReset;
    }
  }
  function backgroundCovered(){if(monitor&&desktopFull&&!glass.lockAnim||window.RoomTV?.open_&&(RoomTV.covered?RoomTV.covered():RoomTV.lockIn()))return true;for(const s of SURF)if(s.screen&&s.locked)return true;return false}
  let backgroundHidden=false;
  function render() { rendering = true; try { renderNow(); } finally { rendering = false; } }
  function renderNow() {
    const covered=backgroundCovered();
    if(covered!==backgroundHidden||cv.style.display!==(covered?'none':'')){backgroundHidden=covered;cv.style.display=covered?'none':'';cv2.style.display=covered?'none':''}
    if(covered){if(stood||monitor)glassFit();for(const sf of SURF)placeSurf(sf);return}
    if (mode === 'follow' || mode === 'off') { P.zm = 1; if (cssPose.d !== '115.000') { cssPose.d = '115.000'; stage.style.perspective = ''; } }
    qualityView();applyLens();glCam(P.x, P.y, P.z, P.rx, P.ry);
    if (mode !== 'follow' && mode !== 'off') cssCam();
    pcVis(); tickPropShadows();
    // things in front of the PC (and the one in your hands) go on the canvas above it
    let front = false; for (const id in THINGS) { const t = THINGS[id]; if (t.obj.parent && t.obj.parent.parent && t.obj.parent.parent.visible) layerFor(t); if (t.front && t.obj.visible) front = true; }
    const ly = pcOn ? 1 : 0; for (const f of frontFx) { if (f.userData.ly !== ly) { f.userData.ly = ly; f.traverse(o => o.layers.set(ly)); } if (f.visible && pcOn) front = true; }
    camera.layers.set(0); renderLit(ren);
    if (front || anyFront) {
      // (measure() resizes, and so clears, the room canvas too: draw it again, or this frame shows black)
      if (!ren2) { makeFront(); camera.layers.set(0); renderLit(ren); }
      if (cv2.parentNode !== frontHost()) frontHost().appendChild(cv2);
      camera.layers.set(1); renderLit(ren2); camera.layers.set(0);
      anyFront = front;
    }
    if (stood || monitor) glassFit();
    for (const sf of SURF) placeSurf(sf);
  }
  function makeFront() { ren2 = new T.WebGLRenderer({ canvas: cv2, antialias: wantsAntialias(), alpha: true, premultipliedAlpha: true }); ren2.setClearColor(0x000000, 0); ren2.localClippingEnabled = true; measure(); }
  // The hand-held layer has its own GL context. Create it and compile the pick-up-able things' shaders into it
  // while nothing is happening, so the first raise/pick-up never stalls on a context or a shader link mid-move.
  function warmFront() {
    if (!live || ren2 || glide || mode !== 'walk' && mode !== 'monitor') return false;
    try {
      makeFront(); const saved = [];
      for (const id in THINGS) THINGS[id].obj.traverse(o => { saved.push([o, o.layers.mask]); o.layers.set(1); });
      camera.layers.set(1); renderLit(ren2); camera.layers.set(0);
      for (const [o, m] of saved) o.layers.mask = m;
      ren2.clear(true, true, true); need = true;
      return true;
    } catch (e) { console.error('front warm-up', e); return false; }
  }
  const frontFx = new Set(); // other layer-1 things (the PC's CD tray when it's out)
  const frontHost = () => stood ? html : pb;
  // boot.js's PC is only drawn when it's properly in front of you (CSS 3D can't draw things behind the camera)
  let pcOn = true;
  // Walking about, the PC is the room's own WebGL models (js/rm-room.js: House.pcGL), depth-sorted with everything else; boot.js's
  // CSS 3D PC only takes over while it flies in to the BIOS or pulls back out (from the seat, where the two line up exactly).
  function pcVis() {
    // The seated monitor view keeps the room's real CRT visible.  Only the
    // boot hand-over modes replace it with boot.js's CSS model.
    const on = mode === 'follow' || mode === 'off';
    if (on !== pcOn) { pcOn = on; pb.classList.toggle('hs-nopc', !on); }
    const g = window.House && House.pcGL; if (g) g.visible = !on && window.StoryAccess?.available !== false;
  }

  // ================================================================ boot.js: following it, holding it, and the power button
  function setMode(m) {
    const previous=mode;mode = m;if(previous!==m)emit('mode',m,previous); if (m !== 'walk' && m !== 'glide') unlock();
    RC.hold = m !== 'follow' && m !== 'off';
    pb.classList.toggle('hs-follow', m === 'follow'); html.classList.toggle('hs-follow', m === 'follow');
    dirty();
  }
  // Keep the live desktop on the 3D monitor once JackOS has finished loading.
  // The room canvas stays outside the transformed body, as it does when standing up.
  function monitorDesktop() {
    if (stood || standing || !boot || !bootOver) return false;
    if (monitor && mode === 'monitor') { glassFit(); return true; }
    monitor = true;
    preparePCView();
    html.classList.remove('hs-standing'); // also entered directly after an in-room logoff
    monitorSurfaceEl.classList.remove('pc-starting');
    body.classList.add('pc-monitor');
    Object.assign(P, monitorPose());
    setWalkFrom(Object.assign({ lvl: 'U' }, P));
    setMode('monitor');
    render();
    return true;
  }
  function bootPC() {
    const from = Object.assign({}, P);
    rememberPCEntry();
    monitor = true; stood = false; standing = false;
    html.classList.remove('hs-standing');
    preparePCView(); body.classList.add('pc-monitor');
    monitorSurfaceEl.classList.add('pc-starting');
    for (const id of ['bootBios', 'bootScan', 'bootSplash']) {
      const el = document.getElementById(id); if (el) monitorSurfaceEl.appendChild(el);
    }
    Object.assign(P, from); setMode('pcboot');
    glideTo(monitorPose, { lock: true, ms: MOTION.ms.pc, kind: 'sit' });
    return true;
  }
  function shutdownPC() {
    clearTimeout(escT); standBtn.classList.remove('hold');
    putAway(); monitor = false; stood = false; standing = false;
    anims.delete('stand'); glide = null;
    monitorSurfaceEl.style.visibility = 'hidden';
    monitorSurfaceEl.classList.remove('pc-starting');
    body.classList.remove('pc-monitor'); html.classList.remove('hs-standing');
    ls.del('jhp_hs_stand');
    setMode('shutdown'); emit('pcpower', false);
    html.classList.remove('pc-desktop-full');
    glideTo(pcExitPose, { lock: true, ms: 900 });
    return true;
  }
  function finishShutdown() {
    if (!live) return false;
    glide = null; monitor = stood = standing = false;
    const p = Object.assign({}, P, {y: LV.U - STAND, seat: 0, lvl: 'U'});
    Object.assign(P, p); setWalkFrom(p); html.classList.add('hs-standing');
    setMode('walk'); emit('pcpower', false); savePose(); saveThings(); dirty(); return true;
  }
  function start() { // the room is on show and the PC is off: you're sitting at the desk
    if (live) return; live = true;
    measure(); uiMount();
    html.classList.add('hs-live');
    const s = savedPose();
    if (!restorePose(s)) {
      // Enter the game standing in the room, not parked at the old tower intro.
      const entry = {x:40,y:LV.U-STAND,z:155,rx:-8,ry:-40,seat:0,lvl:'U'};
      Object.assign(P, entry); setWalkFrom(entry);
    }
    if (!cur) { cur = ROOMS.bedroom; buildRoom(cur); visCalc(); }
    reveal();
    render();
    setMode(BOOT === 'forced' || pb.classList.contains('auto') ? 'follow' : 'walk');
    stIdx = nearestStation(); ui.where();
    if (!raf) raf = requestAnimationFrame(loop);
    Q.probe = performance.now() + 2000;
    if (!ls.get('jhp_hs_walkhint', 0) && mode === 'walk') setTimeout(() => { if (mode !== 'walk' || ls.get('jhp_hs_walkhint', 0)) return; ls.set('jhp_hs_walkhint', 1); ui.say('Have a look round', '<b>W A S D</b> to walk, mouse to look. Shift to jog, <b>C</b> to crouch, Space to jump. <b>F</b> to use or play, <b>E</b> to pick up/remove/place, <b>F</b> also looks closely at objects; click their controls to use them. Click to place; <b>Esc</b>: game menu and put back.', 9000); }, 1400);
    emit('start');if(BOOT!=='wake'||stood)setTimeout(resumeSeat,0);resumeHeld(); // (it waits until you're standing in the room: a wake-and-stand refresh stands up first)
  }
  // Save grounded poses (not head-bob/jump offsets). Load the destination before
  // collision validation: downstairs rooms and their grids are created lazily.
  let poseT = 0;
  function walkingPose() {
    const d = {}; for (const id in DOORS) if (!DOORS[id].always) d[id] = !!DOORS[id].open;
    // Do not round across a collision-cell boundary while leaning on a wall.
    return {x:W.x, y:+(W.fy - W.eyeNow).toFixed(1), z:W.z, rx:+P.rx.toFixed(1), ry:+P.ry.toFixed(1), seat:W.seat ? 1 : 0, lvl:W.lvl, d};
  }
  function validPose(s) { return !!s && ['x','y','z','rx','ry'].every(k => Number.isFinite(s[k])) && ['U','G'].includes(s.lvl || 'U') && Math.abs(s.y) < 1000 && Math.abs(s.rx) <= 90; }
  function savePose() { if (!['walk','glide'].includes(mode) || stood) return; ls.set('jhp_hs_pose', Object.assign(walkingPose(), {t:Date.now()})); }
  function savedPose() { const s = ls.get('jhp_hs_pose', null); return BOOT !== 'forced' && validPose(s) ? s : null; }
  function restorePose(s) {
    if (!validPose(s)) return false;
    const lvl = s.lvl || 'U', r = roomAt(s.x, s.z, lvl); if (!r) return false;
    buildRoom(r);
    if (s.d && typeof s.d === 'object') for (const id in DOORS) {
      const d = DOORS[id]; if (d.always || typeof s.d[id] !== 'boolean') continue;
      d.open = s.d[id]; d.ang = d.open ? 1 : 0; anims.delete('door:' + id);
      if (d.pivot) d.pivot.rotation.y = d.ang * d.swing * D2R * (d.dir || 1);
    }
    grids.dirty = true;
    if (!s.seat && !floorAt(s.x, s.z, lvl, s.y + (r.eye || STAND),Math.max(60,LV[lvl]-s.y))) {
      // Older saves rounded to 0.1 cm. Recover that lost half-millimetre
      // inside the same room rather than discarding a standing pose.
      let recovered=null;
      for(const [dx,dz]of [[-.051,0],[.051,0],[0,-.051],[0,.051],[-.051,-.051],[-.051,.051],[.051,-.051],[.051,.051]]){
        const x=s.x+dx,z=s.z+dz;
        if(roomAt(x,z,lvl)===r&&floorAt(x,z,lvl,s.y+(r.eye||STAND),Math.max(60,LV[lvl]-s.y))){recovered=Object.assign({},s,{x,z});break;}
      }
      // An old pose may also touch a newly solid leaf/handle margin. Keep
      // the player standing in that room, using the nearest clear ring.
      if(!recovered)for(const radius of [2.5,5,7.5,10,15,22,30]){
        for(let i=0;i<16;i++){const a=i*Math.PI/8,x=s.x+Math.cos(a)*radius,z=s.z+Math.sin(a)*radius;if(roomAt(x,z,lvl)===r&&floorAt(x,z,lvl,s.y+(r.eye||STAND),Math.max(60,LV[lvl]-s.y))){recovered=Object.assign({},s,{x,z});break;}}
        if(recovered)break;
      }
      if(!recovered)return false;s=recovered;
    }
    Object.assign(P, {x:s.x,y:s.y,z:s.z,rx:s.rx,ry:s.ry});
    const old = cur; cur = r; W.vx = W.vz = W.jh = W.jv = W.bob = 0;
    setWalkFrom(s); visCalc(); stIdx = nearestStation(); ui.where();
    if (old !== r) emit('room', r.id, old && old.id);
    return true;
  }
  function saveStood() {
    if (!stood || standing || mode === 'sit') return;
    try {
      const seat=focusS?.o.seatId?focusS:focusS?.parent;const p=seat?.o.seatId?seat.back:['walk','glide'].includes(mode)?walkingPose():(ls.get('jhp_hs_stand',{})||{}).p;
      ls.set('jhp_hs_stand', {t:Date.now(), p}); localStorage.setItem('jhp_last', String(Date.now()));
    } catch (e) {}
  }
  function saveWalkState() { saveGrip();if(mode==='focus'&&focusS?.o.seatId)ls.set('jhp_hs_furniture_seat',{id:focusS.o.seatId,back:focusS.back,rx:P.rx,ry:P.ry});if(live&&saveT&&(!window.AccountGate||AccountGate.allowed))saveThings(true);savePose();saveStood(); }
  setInterval(saveStood, 1000); addEventListener('pagehide', saveWalkState);
  setInterval(() => { if (live && mode === 'walk' && Date.now() - poseT > 1500) { poseT = Date.now(); savePose(); } }, 2000);
  // pb's classes tell us what boot.js is up to
  new MutationObserver(() => {
    const c = pb.classList;
    if (!live && !c.contains('outro')) return;
    if ((c.contains('on') || c.contains('auto') || c.contains('outro')) && mode !== 'follow' && mode !== 'monitor' && mode !== 'pcboot' && mode !== 'shutdown' && !stood && !standing) {
      if (c.contains('outro')) ls.del('jhp_hs_pose'); // (switched off: the next start is at the desk)
      putAway(); setMode('follow');
    }
    if (c.contains('go')) ls.del('jhp_hs_pose');
  }).observe(pb, { attributes: true, attributeFilter: ['class'] });
  function putAway(){unlock();if(focusS?.o.seatId){focusS=null;html.classList.remove('hs-focus');ui.focusBar(null);}if(held)setAside(); glide = null; for (const k in keys) keys[k] = false; ui.hush(); ui.tip(null); setHot(null); }
  // boot.js calls bootPC directly: a single glide from the player's current
  // first-person pose to the glass. No intermediate side-on station.

  // ================================================================ STANDING UP from the PC while it's on (the live desktop on the monitor)
  let stood = false, standing = false, monitor = false;
  const body = document.body, monitorSurfaceEl = document.getElementById('monitorSurface') || body;
  let screenIdle=false,screenBackground=false;const pausedScreenSVG=new WeakSet();
  function screenDecorations(node,idle){
    if(node.nodeType!==1)return;
    const decorations=[...(node.matches('marquee,svg')?[node]:[]),...node.querySelectorAll('marquee,svg')];
    for(const el of decorations){
      if(el.tagName.toLowerCase()==='marquee'){if(idle)el.stop?.();else el.start?.()}
      else if(idle&&el.pauseAnimations&&!el.animationsPaused()){el.pauseAnimations();pausedScreenSVG.add(el)}
      else if(!idle&&pausedScreenSVG.has(el)){el.unpauseAnimations?.();pausedScreenSVG.delete(el)}
    }
  }
  // Only decorative presentation rests. Network handlers, message sounds,
  // clocks, application state and running games keep their normal lifecycle.
  function screenEffort(){
    const background=stood&&!monitor;
    if(background!==screenBackground){screenBackground=background;document.dispatchEvent(new CustomEvent('house-screen-effort',{detail:{idle:background}}))}
    const idle=background&&!graphics.decorations;
    if(idle===screenIdle)return;screenIdle=idle;html.classList.toggle('hs-screen-idle',idle);screenDecorations(monitorSurfaceEl,idle);
    emit('screen-effort',idle?'background':'interactive');
  }
  new MutationObserver(records=>{if(screenIdle)for(const r of records)for(const node of r.addedNodes)screenDecorations(node,true)}).observe(monitorSurfaceEl,{childList:true,subtree:true});

  function monitorCentre(){
    const g=window.House&&House.pcGL,gl=g&&g.userData.glass;
    if(gl){root.updateMatrixWorld(true);const m=new T.Matrix4().copy(root.matrixWorld).invert().multiply(g.matrixWorld);return new T.Vector3(gl.x,gl.y,gl.z).applyMatrix4(m)}
    return new T.Vector3(Lb().mx,GY,.06);
  }
  function rememberPCEntry(){const back=focusS?.o.seatId?focusS.back:null;if(back||mode==='walk'||mode==='glide')ls.set('jhp_hs_pc_return',Object.assign({},back||walkingPose(),{seat:0}));}
  function pcExitPose(){
    const saved=ls.get('jhp_hs_pc_return',null),c=monitorCentre();
    const candidates=[saved,{x:c.x,y:LV.U-STAND,z:115,rx:-10,ry:0,seat:0,lvl:'U'},{x:40,y:LV.U-STAND,z:155,rx:-8,ry:-40,seat:0,lvl:'U'}];
    for(const p of candidates)if(validPose(p)&&roomAt(p.x,p.z,p.lvl)?.id==='bedroom'&&floorAt(p.x,p.z,p.lvl,LV.U))return Object.assign({},p,{y:LV.U-STAND,seat:0});
    return candidates[2];
  }
  function desktopDisplay(full){
    if(typeof full!=='boolean')return desktopFull;
    const changed=desktopFull!==full;desktopFull=full;ls.set('jhp_hs_desktop_full',full);
    // LOCK IN on the PC grows the desktop out of the monitor glass (and back in): the room stays drawn until it lands
    if(changed&&live&&monitor&&mode==='monitor'){const ms=motionMs(MOTION.ms.lock),t0=performance.now();if(ms){glass.lockAnim={t0,ms,enter:full};html.classList.add('pc-lock-anim');physicalSound('lockin',{on:full});anims.set('pc-lock',n=>{glass.fitKey=null;dirty();if(n-t0<ms&&glass.lockAnim)return true;glass.lockAnim=null;html.classList.remove('pc-lock-anim');glass.fitKey=null;dirty();return false;});}}
    html.classList.toggle('pc-desktop-full',monitor&&desktopFull);if(live){glassFit();dirty();if(changed)dispatchEvent(new Event('resize'))}return desktopFull;
  }
  function pauseControls(on){controlsPaused=!!on;touchSet(0,0);window.Sound?.worldPause?.(on);if(AC&&OUT)OUT.gain.setTargetAtTime(on?0:.5,AC.currentTime,.012);for(const k in keys)keys[k]=false;W.vx=W.vz=0;PT.clear();if(inspection){inspection.drag=null;}if(on){unlock();setHot(null);ui.tip(null)}else wantLock();dirty();}
  // Fit the entire 4:3 glass with room for its curved bezel at every aspect.
  function monitorPose() {
    const g = window.House && House.pcGL, gl = g && g.userData.glass;
    const centre=monitorCentre();
    const width = gl && gl.w || GW, height = width * 3/4;
    const availableW=vw,availableH=vh;
    const distance = Math.max(width * PERSP * em / (availableW * .88), height * PERSP * em / (availableH * .82));
    return { x: centre.x, y: centre.y, z: centre.z + distance, rx: 0, ry: 0, seat: 1, lvl: 'U', zm: 1 };
  }
  function preparePCView() {
    if (window.Room && Room.prepare) Room.prepare();
    unlock(); live = true;
    for (const k of ['transform', 'clipPath', 'webkitClipPath', 'filter', 'opacity', 'visibility']) body.style[k] = '';
    html.classList.remove('pc-outro', 'pc-skip', 'pc-wake'); html.classList.add('pc-roomview', 'hs-live');
    if (boot.parentNode !== html) html.appendChild(boot);
    boot.className = 'hs-monitorboot'; boot.style.cssText = '';
    for (const c of boot.children) if (c !== pb) c.hidden = true;
    pb.hidden = false; pb.classList.remove('go', 'deep', 'rm-tvon', 'outro', 'auto');
    pb.classList.add('on', 'mon', 'ready');
    cv.hidden = false; cv.style.cssText = '';
    monitorSurfaceEl.style.width = '1024px'; monitorSurfaceEl.style.height = '768px';
    monitorSurfaceEl.style.visibility = ''; monitorSurfaceEl.style.clipPath = '';
    measure(); uiMount();
    if (!cur) cur = ROOMS.bedroom;
    if (cur) { buildRoom(cur); visCalc(); }
    ui.fade(false, 0); emit('pcpower', true);
    if (!raf) raf = requestAnimationFrame(loop);
    dirty();
  }
  let bootOver = false; (window.BootDone || Promise.resolve()).then(() => { bootOver = true; });
  const bootIsOver = () => bootOver || document.body.classList.contains('online') || !boot.isConnected; // (the dial-up's done: the desktop is up)
  function canStand() { return !inspection && mode !== 'shutdown' && bootIsOver() && !stood && !standing && !document.body.classList.contains('pc-power') && !!boot && !!window.Room && !pb.classList.contains('outro'); }
  const whyNotStand = () => ({ bootOver: bootIsOver(), stood, standing, pcPower: document.body.classList.contains('pc-power'), boot: !!boot, room: !!window.Room, outro: pb.classList.contains('outro') });
  function standUp(now) {
    if (!canStand()) return false;
    clearTimeout(escT); standBtn.classList.remove('hold');
    // Explicitly leaving the PC also leaves any PC game's input capture.
    // The background room poll still only owns the house canvas's lock.
    if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
    try { if (window.Apps && Apps.flushGames) Apps.flushGames(); } catch (e) {}
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const fp = monitor ? Object.assign({}, P) : null;
    putAway(); PT.clear(); W.vx = W.vz = 0;
    preparePCView();
    standing = true; stood = true; monitor = false;
    body.classList.remove('pc-monitor'); html.classList.add('hs-standing');
    W.lvl = 'U'; cur = ROOMS.bedroom; visCalc();
    setMode('stand');
    const sp = pcExitPose();html.classList.remove('pc-desktop-full');
    const from = fp || monitorPose(); Object.assign(P, from); glass.k = 1;
    const t0 = performance.now(), ms = now ? 0 : motionMs(MOTION.ms.stand);
    sfx.tone(120, 0.3, 'sine', 0.05); physicalSound('handle', {weight:'light'});
    setMoving(ms > 0); emit('move', 'start', 'stand', ms);
    anims.set('stand', n => {
      const k = ms ? Math.min(1, (n - t0) / ms) : 1, e = H5(k);
      P.x = lerp(from.x, sp.x, e); P.y = lerp(from.y, sp.y, e); P.z = lerp(from.z, sp.z, e); P.rx = lerp(from.rx, sp.rx, e); P.ry = from.ry + angd(from.ry, sp.ry) * e;
      if (k < 1) return true;
      standing = false; setWalkFrom(sp); setMode('walk'); stIdx = nearestStation(); ui.where();
      setMoving(false); emit('move', 'settle', 'stand', ms); resumeHeldKeys();
      emit('stood');
      if (!ls.get('jhp_hs_stoodhint', 0)) { ls.set('jhp_hs_stoodhint', 1); ui.say('The PC is still on', 'Everything on it keeps going. Walk round, then click the monitor (or press its power button... no, DON\'T) to sit back down.', 7000); }
      return false;
    });
    ls.set('jhp_hs_stand', { t: Date.now() });
    try { localStorage.setItem('jhp_last', String(Date.now())); } catch (e) {} // (a refresh while standing wakes the PC up, then we stand straight back up)
    return true;
  }
  function sitDown() {
    if (window.StoryAccess?.available === false) return;
    ls.del('jhp_hs_furniture_seat'); // back to the desktop: no BIOS, no boot, straight back in
    if (!stood || standing || mode === 'sit') return;
    rememberPCEntry();
    putAway(); setMode('sit'); ls.del('jhp_hs_stand');
    glideTo(monitorPose, { lock: true, ms: MOTION.ms.pc, kind: 'sit', done: finishSit });
  }
  function finishSit() {
    stood = false; standing = false; monitor = false;
    html.classList.remove('hs-standing');
    if (cv2.parentNode === html) pb.appendChild(cv2);
    ls.del('jhp_hs_stand');
    emit('sat');
    monitorDesktop();
  }
  // the page laid onto the monitor's glass (perspective correct: a homography as a CSS matrix3d)
  const glass = { k: 1, fitKey: null, checkedAt: 0 };
  // Cache pose (0..6), monitor matrix (7..22) and lens (23): zoom can change while the eye stays still.
  const glassValues=new Float64Array(24),glassMatrix=new T.Matrix4(),glassPoint=new T.Vector3(),glassQuad=Array.from({length:4},()=>({x:0,y:0,d:0})),glassTransform=new Array(16);
  let glassMode=null,glassMonitor=false,glassStood=false,glassFull=false,glassObject=null;
  function glassFit() {
    const full=monitor&&desktopFull,now=performance.now(),g0=window.House&&House.pcGL;
    let moved=glass.fitKey===null||glassMode!==mode||glassMonitor!==monitor||glassStood!==stood||glassFull!==full||glassObject!==g0;
    if(glassValues[0]!==vw||glassValues[1]!==vh||glassValues[2]!==P.x||glassValues[3]!==P.y||glassValues[4]!==P.z||glassValues[5]!==P.rx||glassValues[6]!==P.ry||glassValues[23]!==P.zm)moved=true;
    const elements=g0?.matrixWorld.elements;if(elements)for(let i=0;i<16;i++)if(glassValues[i+7]!==elements[i]){moved=true;break}
    if(!moved&&(monitor||now-glass.checkedAt<150))return;
    if(moved){glass.fitKey=(glass.fitKey||0)+1;glassMode=mode;glassMonitor=monitor;glassStood=stood;glassFull=full;glassObject=g0;glassValues[0]=vw;glassValues[1]=vh;glassValues[2]=P.x;glassValues[3]=P.y;glassValues[4]=P.z;glassValues[5]=P.rx;glassValues[6]=P.ry;glassValues[23]=P.zm;if(elements)for(let i=0;i<16;i++)glassValues[i+7]=elements[i]}
    const key=glass.fitKey;
    const logicalW=full?'100%':'1024px',logicalH=full?'100%':'768px';if(monitorSurfaceEl.style.width!==logicalW)monitorSurfaceEl.style.width=logicalW;if(monitorSurfaceEl.style.height!==logicalH)monitorSurfaceEl.style.height=logicalH;
    html.classList.toggle('pc-desktop-full',full);
    if(full&&!glass.lockAnim){monitorSurfaceEl.style.visibility='';monitorSurfaceEl.style.clipPath='';monitorSurfaceEl.style.transform='none';return;}
    // the glass is taken from the WebGL monitor itself (rm-room.js's pcGL: wherever it was built), in the engine's own y-down frame
    const g = House.pcGL, gl = g && g.userData.glass; let cx, cy, z = 0.05;
    if (gl) { glassMatrix.copy(House.root.matrixWorld).invert().multiply(g.matrixWorld); const o = glassPoint.set(gl.x, gl.y, gl.z).applyMatrix4(glassMatrix); cx = o.x; cy = o.y; z = o.z + 0.01; } else { const L = Lb(); cx = L.mx; cy = GY; }
    const sw = monitor || stood ? 1024 : vw, sh = monitor || stood ? 768 : vh;
    const screenW = gl && gl.w || 29.2, screenH = screenW * 3 / 4;
    const w = screenW / 2, h = screenH / 2;
    // the page keeps its shape and covers the glass (the spare is trimmed off by the clip)
    const cw = w, ch = h;
    const q=glassQuad;let outsideLeft=true,outsideRight=true,outsideTop=true,outsideBottom=true;
    for(let i=0;i<4;i++){
      const dx=i===0||i===3?-cw:cw,dy=i<2?-ch:ch;
      let projected;if(gl){glassPoint.set(gl.x+dx,gl.y+dy,gl.z+.01).applyMatrix4(glassMatrix);projected=toScreen(glassPoint.x,glassPoint.y,glassPoint.z,q[i])}else projected=toScreen(cx+dx,cy+dy,z,q[i]);
      if(!projected){monitorSurfaceEl.style.visibility='hidden';return}
      if(projected.x>=-4)outsideLeft=false;if(projected.x<=vw+4)outsideRight=false;if(projected.y>=-4)outsideTop=false;if(projected.y<=vh+4)outsideBottom=false;
    }
    if(outsideLeft||outsideRight||outsideTop||outsideBottom){monitorSurfaceEl.style.visibility='hidden';return}
    if (now-glass.checkedAt>=150 || glass.hid == null || glass.mode!==mode || Math.hypot(P.x-(glass.eyeX??P.x),P.y-(glass.eyeY??P.y),P.z-(glass.eyeZ??P.z))>20) {
      let hid = P.z < z + 2;
      if (!hid && !monitor) { const c = toScreen(cx, cy, z); if (c) { const distance=Math.hypot(P.x-cx,P.y-cy,P.z-z),h = pick(c.x, c.y, { skip: isThingMesh,far:Math.max(6,distance-8) }); hid = !!h && h.spot !== 'pc' && h.dist < distance - 8; } }
      glass.hid = hid;glass.checkedAt=now;glass.mode=mode;glass.eyeX=P.x;glass.eyeY=P.y;glass.eyeZ=P.z;
    }
    if (glass.hid) { monitorSurfaceEl.style.visibility = 'hidden'; return; }
    monitorSurfaceEl.style.visibility = '';
    if(!moved&&glass.fittedKey===key)return;
    let m;
    if (glass.lockAnim) { // between the glass and the whole window, on the shared curve
      const a = glass.lockAnim, k = clamp((now - a.t0) / a.ms, 0, 1), e = H5(a.enter ? k : 1 - k), F = [[0, 0], [vw, 0], [vw, vh], [0, vh]];
      const qi = q.map((c, i) => ({ x: lerp(c.x, F[i][0], e), y: lerp(c.y, F[i][1], e) }));
      m = full ? homography(vw, vh, qi, glassTransform) : homography(sw, sh, qi, glassTransform);
    } else m = homography(sw, sh, q,glassTransform);
    for(let i=0;i<16;i++)m[i]=Math.round(m[i]*1e8)/1e8;
    monitorSurfaceEl.style.transform = 'matrix3d(' + m.join(',') + ')';
    monitorSurfaceEl.style.clipPath = '';glass.fittedKey=key;
  }
  // rect (0,0)-(w,h) onto the quad q (tl, tr, br, bl), as a column-major matrix3d
  function homography(w, h, q, out) {
    const x0=q[0].x,y0=q[0].y,x1=q[1].x,y1=q[1].y,x2=q[2].x,y2=q[2].y,x3=q[3].x,y3=q[3].y;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, hh = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
    // unit square -> quad: [a b c; d e f; g hh 1]; then scale the page to the unit square
    const A = a / w, B = b / h, D = d / w, E = e / h, G = g / w, H = hh / h;
    const m=out||new Array(16);m[0]=A;m[1]=D;m[2]=0;m[3]=G;m[4]=B;m[5]=E;m[6]=0;m[7]=H;m[8]=0;m[9]=0;m[10]=1;m[11]=0;m[12]=c;m[13]=f;m[14]=0;m[15]=1;return m;
  }
  // F2 stands up immediately; Esc belongs to the game menu.
  let escT = 0;
  addEventListener('keydown', ev => {
    if(controlsPaused||window.HousePause?.open)return;
    const away = !live || mode === 'follow' || mode === 'monitor'; // (sat at the PC: the house isn't being walked round)
    if (ev.key === 'F2' && !stood && away && canStand() && !ev.repeat) { ev.preventDefault(); standUp(); return; }
  }, true);
  addEventListener('keyup', ev => { if (ev.key === 'Escape') { clearTimeout(escT); standBtn.classList.remove('hold'); } });
  const standBtn = document.createElement('button');
  standBtn.type = 'button'; standBtn.className = 'hs-standbtn'; standBtn.title = 'Stand up. The PC stays on. (Q / F2, or Esc > Back to the room.)';
  standBtn.setAttribute('aria-label', 'Stand up from the PC and go in your room. The PC stays on.');
  standBtn.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true"><path fill="#000" d="M4 1h7v1H4zM3 2h1v6H3zM11 2h1v6H11zM2 8h12v1H2zM2 9h1v2H2zM13 9h1v2H13zM3 11h10v1H3zM7 12h2v2H7zM4 14h8v1H4zM4 15h1v1H4zM11 15h1v1H11z"/><path fill="#1a3a9a" d="M4 2h7v6H4z"/><path fill="#3a6ad8" d="M5 3h2v4H5z"/><path fill="#808080" d="M3 9h10v2H3z"/><path fill="#c0c0c0" d="M3 9h10v1H3z"/></svg>';
  standBtn.addEventListener('click', () => standUp());
  // (it sits at the top-right corner of the desktop; only while the PC is on)
  const bootDone = window.BootDone || Promise.resolve();
  bootDone.then(() => {
    const ready = () => { if (!window.Room) return; const tray = document.getElementById('tray'), clk = document.getElementById('clock'); if (tray) tray.insertBefore(standBtn, clk && clk.parentNode === tray ? clk : null); startItems(); standHint(); monitorDesktop(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true}); else ready();
  });
  // Start > Stand up (at the top, where you'll see it)
  function startItems() {
    const sm = document.getElementById('startMenu'), first = sm && sm.querySelector('button'); if (!first || document.getElementById('smStand')) return;
    const item = (id, svg, text, fn) => { const b = document.createElement('button'); b.id = id; b.setAttribute('role', 'menuitem'); b.innerHTML = svg; b.appendChild(document.createTextNode(text)); b.addEventListener('click', ev => { ev.stopPropagation(); sm.classList.remove('open'); const sb = document.getElementById('startBtn'); if (sb) sb.classList.remove('on'); fn(); }); sm.insertBefore(b, first); return b; };
    item('smStand', standBtn.innerHTML.replace('width="16" height="16"', 'width="32" height="32"'), 'Stand up (the PC stays on)', () => { if (canStand()) standUp(); });
  }
  // the first time you're sat at the desktop: how to get up
  function standHint() {
    if (ls.get('jhp_hs_standhint', 0) || stood) return; ls.set('jhp_hs_standhint', 1);
    const b = document.createElement('div'); b.className = 'hs-standtip'; b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:6px;bottom:36px;z-index:30000;max-width:250px;padding:8px 26px 8px 10px;background:#ffffe1;color:#000;border:1px solid #000;font:11px Tahoma,Verdana,sans-serif;box-shadow:2px 2px 0 rgba(0,0,0,.35);cursor:pointer';
    b.innerHTML = '<b>Want a look round your room?</b><br>'+(window.GameInput?.touch?'Click STAND UP under the screen to walk around. The PC stays on. Walk back to the monitor and click USE to sit down.':'Press Q to lean back and walk around. The PC stays on. Walk back and press F at the monitor to sit down. F2, the chair button and Esc &gt; Back to the room also work.')+'<span style="position:absolute;right:6px;top:4px;font-weight:700">&times;</span>';
    b.addEventListener('click', () => b.remove()); monitorSurfaceEl.appendChild(b); setTimeout(() => b.remove(), 14000);
  }
  // a refresh while standing up: the PC wakes up as normal, and we stand straight back up
  // (and back after 10 hours or more with the PC left on: you come back into the room, the PC still on; sit down to carry on)
  const unhideStand = () => { html.classList.remove('pc-standwake'); if (live) { try { dirty(); render(); } catch (e) {} } }; setTimeout(unhideStand, 4000); setTimeout(unhideStand, 9000); // (failsafe: if the room never says it's ready, show it anyway and force a render)
  // ---- watchdog: the room "goes black" on some real PCs (canvas hidden / context lost / draws nothing / something over it): notice, repair, log
  let wdFrames=-1,mainDraws=0,wdStuck=0,wdBlack = 0, wdSent = false; // wdFrames: the main loop's room draws when last sampled (the watchdog's own samples and other layers don't count)
  function wdDiag(kase, extra) {
    let d = {};
    try {
      const r = cv.getBoundingClientRect(), cs = getComputedStyle(cv), e = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      d = { t: new Date().toISOString(), case: kase, w: Math.round(r.width), h: Math.round(r.height), conn: cv.isConnected, display: cs.display, vis: cs.visibility, op: cs.opacity, centre: e ? (e.tagName + (e.id ? '#' + e.id : '') + (e.className && e.className.baseVal === undefined ? '.' + e.className : '')) : null, tier: Q.tier, cam: [P.x, P.y, P.z].map(v => Math.round(v)), win: innerWidth + 'x' + innerHeight, gpu: Q.gpu, extra };
    } catch (e) { d = { t: new Date().toISOString(), case: kase, err: String(e) }; }
    const a = ls.get('jhp_hs_diag', []); a.push(d); ls.set('jhp_hs_diag', a.slice(-10));
    console.warn('[room] repaired: ' + kase, d);
    if (!wdSent) { wdSent = true; try { navigator.sendBeacon('/diag', JSON.stringify(d)); } catch (e) {} }
  }
  function wdSample() { // draw, then read the drawing buffer in the same task; true if anything is lit
    render();
    const gl = ren.getContext(), w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(4);
    if (!w || !h) return false;
    // The live desktop is DOM over dark CRT glass: central samples can all
    // correctly be dark. Include the bezel/room and distinguish actual glass
    // pixels from the renderer's clear colour before declaring a lost frame.
    for (const [fx, fy] of [[.5,.5],[.25,.5],[.75,.5],[.5,.25],[.5,.75],[.3,.3],[.7,.7],[.08,.5],[.92,.5],[.5,.08],[.5,.92]]) { gl.readPixels(Math.floor(w*fx),Math.floor(h*fy),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); if (px[0]+px[1]+px[2]>24 || Math.abs(px[0]-5)+Math.abs(px[1]-4)+Math.abs(px[2]-4)>6) return true; }
    return false;
  }
  function wdCheck() {
    if (!live || document.hidden || backgroundCovered() || ['off','follow','pcboot','shutdown'].includes(mode) || viewOpen() || pb.classList.contains('deep') || pb.classList.contains('rm-tvon')) { wdBlack = 0; return; }
    try {
      let bad = !cv.isConnected, why = '';
      if (!bad) { const r = cv.getBoundingClientRect(), cs = getComputedStyle(cv); bad = !r.width || !r.height || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05; }
      if (!bad) for (let n = cv.parentElement; n && n !== document.documentElement; n = n.parentElement) if (getComputedStyle(n).display === 'none') { bad = true; why = '#' + n.id; break; }
      if (bad) {
        const par = (stage && stage.parentNode === pb) ? pb : (cv.parentNode || pb);
        if (!cv.isConnected) par.insertBefore(cv, par.contains(stage) ? stage : null);
        { let top = cv; while (top.parentNode && top.parentNode !== document) top = top.parentNode; if (!top.isConnected && top.nodeType === 1) document.documentElement.appendChild(top); } // the whole boot layer was pulled out: put it back
        cv.style.display = 'block'; cv.style.visibility = 'visible'; cv.style.opacity = '1';
        for (let n = cv.parentElement; n && n !== document.documentElement; n = n.parentElement) if (getComputedStyle(n).display === 'none') { n.style.display = 'block'; }
        measure(); dirty(); render(); wdDiag('canvas-hidden', why); return;
      }
      if (glLost()) { const ok = rebuildGL(); wdDiag('context-lost', ok); return; }
      if(mainDraws===wdFrames&&!(need&&++wdStuck>=3))return;wdStuck=0; // a pending draw is the main loop's job; only sample if it stays stuck for ~4.5 s
      const lit = wdSample(); wdFrames=mainDraws;
      if (lit) wdBlack = 0;
      else if (++wdBlack >= 2) {
        wdBlack = 0; let fix = 'rooms';
        for (const id in ROOMS) { buildRoom(ROOMS[id]); ROOMS[id].group.visible = true; }
        if (![P.x, P.y, P.z, P.rx, P.ry].every(Number.isFinite) || !cur) { fix = 'camera-reset'; window.House.goRoom('bedroom', 0); }
        measure(); dirty(); const lit2 = wdSample(); wdDiag('draws-nothing', { fix, lit2 });
        if (lit2) visCalc();
      }
      const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      if (e && e !== cv && e !== cv2 && e.id && /^(boot|crt|saver)/i.test(e.id) && getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)') wdDiag('overdraw', e.id + '.' + e.className);
    } catch (e) { console.error(e); }
  }
  setInterval(wdCheck, 1500);
  bootDone.then(() => {
    const s = ls.get('jhp_hs_stand', null), away = (window.JHPAway || 0) > 10 * 3600000;
    if (BOOT !== 'wake' || (!away && !s)) { unhideStand(); return; }
    let tries = 0;
    const go = async () => {
      if (!canStand() && ++tries < 80) return setTimeout(go, 100);
      if (!canStand()) { unhideStand(); return; }
      try {
        // Register doors and collision before restoring a downstairs/outdoor pose.
        if (validPose(s && s.p) && window.Room && Room.ensureHouse) await Room.ensureHouse();
        const restored = () => { window.House.off('stood', restored); restorePose(s && s.p); dirty(); unhideStand(); resumeHeld(); };
        window.House.on('stood', restored);
        if (!standUp(true)) { window.House.off('stood', restored); unhideStand(); }
      } catch (e) { console.error(e); unhideStand(); }
      if (away) setTimeout(() => ui.say('You left the PC on', 'Your stuff is still on the screen. Click the monitor to sit back down.', 7000), 400);
    };
    setTimeout(go, window.JHPStood ? 0 : 1600);
  });

  // ================================================================ resizing, rotating, the tab going away
  addEventListener('resize', () => { if (!live) return; measure(); if (monitor) Object.assign(P, monitorPose()); else if (mode === 'walk' && W.seat && Math.abs(P.ry - seatPose().ry) < 1) { Object.assign(P, seatPose()); } dirty(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { lastT = 0;lastDraw=0;perfLast=0;perfCount=0;lastR=0; dirty(); } else { saveWalkState(); for (const k in keys) keys[k] = false; unlock(); } });

  // The diagnostic/placement grid covers the same complete plot as continuous walking and the family navigator.
  GR.nx=Math.ceil((740-GR.x0)/GR.cs);GR.nz=Math.ceil((FRONT.STREET.pave[1]-GR.z0)/GR.cs);grids.dirty=true;
  // ================================================================ the API
  window.House = {
    ok: true, FRONT, CAT_TREE, STAND, T, K, scene, root, camera, ren, P, W, LV, ROOMS, DOORS, SPOTS, THINGS, SNAPS, OPEN, sfx, ui,
    focus, unfocus, surface, faceQuad, inspect, endInspect, get focused() { return !!focusS; },
    room, buildRoom, door, setDoor, walkRect, block, solid, stairs, support, soft, softChanged, softs: SOFT, spot, unspot, thing, snap: snapDef, openable, toggle, tidy,
    restoreThing, rescue: t => { if (t) rescueQ.add(t); }, lostWhy, saveThings, saveWalkState, layerFor, frontFx, place,
    grab, drop: (sx, sy) => drop(sx, sy, 'api'), placeHeld: (sx, sy) => drop(sx, sy, 'user'), letGo, setAside, putBack, interact, suspendGrip, restoreGrip, resumeLook:wantLock, get seated(){return focusS?.o.seatId||focusS?.parent?.o.seatId||null;}, held: () => held && held.id, get grip() { return held ? { id: held.id, drag: !!held.drag, d: held.d, ry: held.ry } : null; },
    placement:()=>held&&!held.drag?floorAim(THINGS[held.id]):null, ghost:()=>held&&!held.drag?computeGhost(THINGS[held.id],null,null,true):null, act: id => act(SPOTS[id]), useAt,
    // the physics world (js/hs-physics.js): bodies, stats, and a few queries the tests and packs use
    physics: { get world() { return physReady(); }, get ms() { return physMs; }, get frameMs() { return physFrame; }, get awake() { return PH ? PH.awake.size : 0; }, body: id => THINGS[id] ? bodyFor(THINGS[id]) : null, tucked: id => !!THINGS[id] && tuckedUnder(THINGS[id]), wake: id => { const b = THINGS[id] && bodyFor(THINGS[id]); if (b) PH.wake(b); }, sync: id => THINGS[id] && syncBody(THINGS[id]), rebuild: () => { physDirty = true; return physReady(); } },
    warmFront, glideTo, goStation, cancelGlide, viewFor, setWalkFrom, seatPose, sitOn, resumeSeat, fillPose, get gliding() { return !!glide; },
    motion: { get ms() { return MOTION.ms; }, get reduce() { return MOTION.reduce; }, set reduce(v) { MOTION.reduce = v; }, scale: motionMs, H5, H5d, H1, H1d, lensFov, get moving() { return movingLock; }, glideVel: () => glideVel(performance.now()), queueLock, get lockQueued() { return !!lockQueued; } },
    toScreen, viewZ, pick, rayAt, fwd,
    on(ev, fn) { (EVS[ev] = EVS[ev] || []).push(fn); }, off(ev, fn) { const a = EVS[ev] || []; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); }, emit,
    say: (t, x, ms) => ui.say(t, x, ms), toast: (t, x) => ui.toast(t, x), hush: () => ui.hush(),
    dirty, relight, ambient, anims, visCalc,warmRooms:prewarm, start, standUp, sitDown, canStand, monitor: monitorDesktop, bootPC, shutdownPC, finishShutdown,
    touch: { move: touchSet, look: touchLook, get moving() { return touchMove.on; }, get state() { return { ...touchMove }; } },
    desktopDisplay,surfaceScreen,pauseControls,crouchSetting,get paused(){return controlsPaused;},
    Q,graphicsGet,showFps,adapt:adaptTo,screenRate,screenBudget, perf:perfSnapshot, get mode() { return mode; }, get live() { return live; }, get stood() { return stood; }, get screenEffort(){return stood&&!monitor?'background':'interactive';}, get here() { return cur && cur.id; }, get busy() { return !canAct(); },
    goRoom(id, st) { const r = ROOMS[id]; if (!r) return; buildRoom(r); const s = r.stations[st || 0]; if (s) { cur = r; visCalc(); stIdx = st || 0; glideTo(stationPose(r, s), { ms: 0 }); setWalkFrom(stationPose(r, s)); ui.where(); } },
    _: { HOLD, movementState:()=>({keys:{...keys},velocity:[W.vx,W.vz],contacts:movementContacts(W.x,W.z,RAD+.05),floor:walkingFloor(W.x,W.z)}),doorHeadroom:(x,z,lvl,fy)=>lowDoorAt(x,z,lvl,RAD+18,fy)?.headroom||null, whyNotStand, renderForBenchmark:render, setMode, rebuildGrids, cellOk, floorAt, grids, homography, glassFit, glass, seatPose, followCss, savedPose, finishSit, nearestStation, lightingSnapshot, get stIdx() { return stIdx; }, get glide() { return glide; }, get focusS() { return focusS; } },
  };
  // A detached snapshot for diagnostics: no scene objects or writable references escape.
  window.__jhpDebug = () => ({
    fps: Q.fps, story: window.st?.getState?.() ? JSON.parse(JSON.stringify(window.st.getState())) : null,
    renderer: { calls: ren.info.render.calls, triangles: ren.info.render.triangles,
      geometries: ren.info.memory.geometries, textures: ren.info.memory.textures },
    room: cur ? cur.id : null,
    camera: { x: P.x, y: P.y, z: P.z, rx: P.rx, ry: P.ry },
    held: held ? held.id : null, seated: !!(W.seat || focusS?.o.seatId || focusS?.parent?.o.seatId),
    pc: { mode, powered: !localStorage.getItem('jhp_off'), locked: desktopFull },
    windows: Array.from(document.querySelectorAll('.float,#browser')).map(el => ({
      id: el.id, title: el.querySelector('.tb .t')?.textContent?.trim().slice(0, 80) || '' })),
    version: window.Net?.me?.version || null,
  });
})();

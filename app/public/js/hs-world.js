/* hs-world: THE HOUSE ENGINE. Jack's house is a real 3D place (WebGL, three.js r128) you walk round: his bedroom, the landing,
 * the stairs, the hall, the lounge, the kitchen and the cupboard under the stairs. The family PC on Jack's desk is still
 * boot.js's CSS 3D model (with the power button, the fly-in and the BIOS hand-over): it's drawn on top of the WebGL room and
 * the two cameras are kept exactly in step (in "hold" mode we drive boot.js's camera, in "follow" mode we copy it).
 *
 *   walking: W A S D / arrow keys (Shift to hurry), mouse to look, F to interact; click/E are alternatives
 *   stations: the arrows at the sides jump to the good views of the room you're in
 *   holding: click a thing to pick it up; it floats in front of you. Click to put it down where you're looking, wheel (or
 *            the +/- buttons) to move it nearer or further, R to turn it; Esc opens the menu, including Put Back
 *   the PC: press its power button (we sit down first), or with it on, "Stand up" (Esc held down, or the chair button on the
 *           desktop) and the monitor in the room shows the live desktop; click the monitor to sit back down
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

  // ================================================================ graphics quality: Low / Medium / High, picked for this machine (or chosen: G in the house,
  // or Start > Room graphics). Low: pixel ratio 1, no antialiasing, matte materials, 3 lights, only the room you're in and the next.
  const QN = ['low', 'medium', 'high'], PRMAX = { low: 1, medium: 1.5, high: 2 };
  const Q = (function () {
    const want = ls.get('jhp_hs_gfx', 'auto'), n = navigator;
    const mob = false; // Device access is handled before the game loads.
    const mem = n.deviceMemory || 8, cores = n.hardwareConcurrency || 4, dpr = window.devicePixelRatio || 1;
    const t = mob || mem <= 2 || cores <= 2 ? 'low' : mem <= 4 || cores <= 4 || (dpr > 2 && screen.width * dpr > 3800) ? 'medium' : 'high';
    return { want, auto: !QN.includes(want), tier: QN.includes(want) ? want : t, guess: t, mob, fps: 0, gpu: '', renderScale:1, pixelRatio:1, f: { n: 0, t: 0, low: 0 }, probe: 0 };
  })();
  function graphicsDefaults(preset){return{preset,scale:1,dynamic:preset!=='high',antialias:['medium','high'].includes(preset)?'on':'off',pixelRatio:({low:1,medium:1.5,high:2})[preset]||2,anisotropy:({low:1,medium:4,high:8})[preset]||8,backgroundFps:10,decorations:false}}
  function cleanGraphics(value,base){
    const v=value&&typeof value==='object'?value:{};
    return{...base,scale:clamp(Number.isFinite(+v.scale)?+v.scale:base.scale,.5,1),dynamic:typeof v.dynamic==='boolean'?v.dynamic:base.dynamic,
      antialias:['auto','off','on'].includes(v.antialias)?v.antialias:base.antialias,pixelRatio:[1,1.5,2].includes(+v.pixelRatio)?+v.pixelRatio:base.pixelRatio,
      anisotropy:[1,4,8,16].includes(+v.anisotropy)?+v.anisotropy:base.anisotropy,backgroundFps:[5,10,20].includes(+v.backgroundFps)?+v.backgroundFps:base.backgroundFps,
      decorations:typeof v.decorations==='boolean'?v.decorations:base.decorations,preset:['auto','low','medium','high','custom'].includes(v.preset)?v.preset:base.preset};
  }
  let graphics=cleanGraphics(ls.get('jhp_hs_graphics',null),graphicsDefaults(Q.want));
  const wantsAntialias=()=>graphics.antialias==='on'||(graphics.antialias==='auto'&&!Q.auto&&Q.tier!=='low');
  // Low keeps cheap 2x anisotropic filtering: floors and long walls are seen at grazing angles everywhere.
  const wantedAniso=()=>Math.min(Math.max(graphics.anisotropy,Q.tier==='low'&&graphics.preset!=='custom'?2:1),Q.tier==='low'&&graphics.preset!=='custom'?2:16);
  window.HouseQ = Q.tier;
  // ================================================================ the renderer (a canvas under boot.js's stage, one over it)
  let cv = document.createElement('canvas'); cv.className = 'hs-gl'; cv.setAttribute('aria-hidden', 'true');
  let ren;
  try {
    ren = new T.WebGLRenderer({ canvas: cv, antialias: wantsAntialias(), powerPreference: 'high-performance', alpha: false });
    if (!ren.getContext()) throw new Error('no gl');
  } catch (e) { window.House = { ok: false }; return; }
  pb.insertBefore(cv, stage);
  try { // (a software renderer or a weak GPU: Low, whatever the rest of the machine says)
    const gl = ren.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info'); Q.gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    if (Q.auto && (/SwiftShader|llvmpipe|softpipe|Software|Mali-[34]|Adreno \(TM\) [345]\d\d|PowerVR SGX|GMA/i.test(Q.gpu) || ren.capabilities.maxTextureSize < 4096 || !ren.capabilities.floatFragmentTextures)) Q.tier = 'low';
    else if (Q.auto && Q.tier === 'high' && /Intel/i.test(Q.gpu) && !/Iris|Arc/i.test(Q.gpu)) Q.tier = 'medium';
  } catch (e) {}
  Q.guess=Q.tier;window.HouseQ = Q.tier;
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
  const PL = Array.from({ length: Q.tier === 'low' ? 3 : 5 }, () => { const l = new T.PointLight(0xffffff, 0, 400, 2); root.add(l); l.layers.enableAll(); return l; });

  // ================================================================ the camera: one pose drives both WebGL and boot.js's CSS camera
  // pose: E (eye, cm), ry (yaw: + turns right), rx (pitch: - looks down), the CSS conventions boot.js uses
  const P = { x: 0, y: -50, z: 100, ry: -30, rx: -16 };
  let em = 10, vw = innerWidth, vh = innerHeight;
  const S = new T.Matrix4().makeScale(1, -1, 1), _R = new T.Matrix4(), _M = new T.Matrix4(), _Rx = new T.Matrix4(), _Ry = new T.Matrix4();
  function measure() {
    vw = pb.clientWidth || innerWidth; vh = pb.clientHeight || innerHeight;
    em = parseFloat(getComputedStyle(stage).fontSize) || 10;
    const native=Math.min(window.devicePixelRatio||1,graphics.preset==='custom'?graphics.pixelRatio:Math.min(PRMAX[Q.tier]||1,graphics.pixelRatio));
    // Low graphics has a pixel budget as well as a DPR cap: a large desktop
    // viewport used to cost more than a phone even at the lowest setting.
    const base=Q.tier==='low'&&graphics.preset!=='custom'?Math.min(native,Math.sqrt(1024*768/(vw*vh))):native;
    const pr=base*graphics.scale*Q.renderScale;Q.pixelRatio=pr;
    ren.setPixelRatio(pr); ren.setSize(vw, vh, false);
    // Held paper and live screen DOM stay sharp when the room scales down.
    if (ren2) { ren2.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)); ren2.setSize(vw, vh, false); }
    camera.aspect = vw / vh; camera.fov = 2 * Math.atan(vh / 2 / (PERSP * em)) / D2R; camera.updateProjectionMatrix();
    dirty();
  }
  function rot(rx, ry) { return _R.copy(_Rx.makeRotationX(rx * D2R)).multiply(_Ry.makeRotationY(ry * D2R)); } // CSS rotateX(rx) rotateY(ry)
  function glCam(x, y, z, rx, ry) {
    const R = rot(rx, ry).transpose();
    _M.makeTranslation(x, y, z).multiply(R);
    camera.matrix.copy(S).multiply(_M).multiply(S);
    camera.updateMatrixWorld(true);
  }
  const f3 = n => (+n).toFixed(3);
  function cssCam() { cam.style.transform = `translate3d(0em,0em,${PERSP}em) rotateX(${f3(P.rx)}deg) rotateY(${f3(P.ry)}deg) translate3d(${f3(-P.x)}em,${f3(-P.y)}em,${f3(-P.z)}em)`; }
  // view-space z of a world point (negative = in front of the camera)
  function viewZ(x, y, z) { const a = P.ry * D2R, b = P.rx * D2R, dx = x - P.x, dy = y - P.y, dz = z - P.z; const z1 = -dx * Math.sin(a) + dz * Math.cos(a); return dy * Math.sin(b) + z1 * Math.cos(b); }
  // a world point to screen pixels (null when it's behind you)
  function toScreen(x, y, z) {
    const a = P.ry * D2R, b = P.rx * D2R, dx = x - P.x, dy = y - P.y, dz = z - P.z;
    const x1 = dx * Math.cos(a) + dz * Math.sin(a), z1 = -dx * Math.sin(a) + dz * Math.cos(a);
    const y2 = dy * Math.cos(b) - z1 * Math.sin(b), z2 = dy * Math.sin(b) + z1 * Math.cos(b);
    if (z2 > -1) return null;
    const k = PERSP * em / -z2; return { x: vw / 2 + x1 * k, y: vh / 2 + y2 * k, d: -z2 };
  }
  const fwd = () => { const a = P.ry * D2R, b = P.rx * D2R; return new T.Vector3(Math.sin(a) * Math.cos(b), -Math.sin(b), -Math.cos(a) * Math.cos(b)); };
  // the ray through a screen point, in our (y-down) world
  function rayAt(sx, sy) {
    const k = PERSP * em, vx = (sx - vw / 2) / k, vy = (sy - vh / 2) / k; // view direction (vx, vy, -1)
    const R = rot(P.rx, P.ry).clone().transpose(); // view -> world
    const d = new T.Vector3(vx, vy, -1).applyMatrix4(R).normalize();
    return { o: new T.Vector3(P.x, P.y, P.z), d };
  }

  // boot.js's layout (where the PC sits) and the seated view at the desk (boot.js's own room view, without the sway)
  const Lb = () => (window.RoomCam && RoomCam.L) || { mx: -15, tx: 17, tz: -30, kx: -15, ux: 8, uz: 9.5, fx: 0, fy: -19, fz: -14, rx: -16, ry: -30, oy: -4, ox: 0 };
  function seatPose() {
    // A first-person seat in front of the glass, never the old side-on shot.
    const c=monitorCentre();return{x:c.x,y:c.y-4,z:c.z+90,rx:-3,ry:0,seat:1,lvl:'U'};
  }
  // where the camera is when the monitor's glass fills the window (the end of the fly-in)
  function fillPose() {
    const L = Lb(), kf = Math.max(vw / (GW * em), vh / (GH * em)) * 1.03;
    return { x: L.mx, y: GY, z: 0.02 + PERSP / kf, rx: 0, ry: 0, seat: 1 };
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
      if (!b.isEmpty()) d.closedBounds = {x0:b.min.x,z0:b.min.z,x1:b.max.x,z1:b.max.z};
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
  let windowOnly=new Map();
  const windowFrustum=new T.Frustum(),windowProjection=new T.Matrix4();
  function visCalc() { // the room you're in, and the rooms you can see into through open doors (and the ones they open onto)
    const vs = new Set(); if (cur) vs.add(cur.id);
    const walk = (r, depth) => { if (!r) return; for (const did of r.links) { const d = DOORS[did]; if (!d || !(d.open || d.ang > 0.01 || d.always)) continue; for (const o of d.rooms) if (!vs.has(o)) { vs.add(o); if (depth < (Q.tier === 'low' ? 0 : 1)) walk(ROOMS[o], depth + 1); } } };
    walk(cur, 0);
    if (cur && (cur.id === 'hall' || cur.id === 'landing' || cur.id === 'cupboard')) { vs.add('hall'); vs.add('landing'); } // (the stairwell joins them: a wrong guess can never black the view out)
    // Glass is a permanent sight line, independent of the door beside it.
    // Keep logical visibility stable; rendering may skip windows off camera.
    const connected=new Set(vs);windowOnly=new Map();
    for(const id of connected)for(const view of ROOMS[id]?.windowViews||[]){
      const other=typeof view==='string'?view:view.room;if(!ROOMS[other])continue;vs.add(other);
      if(connected.has(other))continue;
      const bounds=windowOnly.get(other)||[];
      if(!view.bounds)bounds.push(null);else for(const b of view.bounds)bounds.push(new T.Box3(new T.Vector3(b[0],-b[4],b[2]),new T.Vector3(b[3],-b[1],b[5])));
      windowOnly.set(other,bounds);
    }
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
      const remaining=all.slice(0,PL.length);
      rig.slots.forEach(s=>{const j=remaining.findIndex(l=>l.key===s.key);s.t=j<0?null:remaining.splice(j,1)[0]});
      rig.slots.forEach(s=>{if(!s.t&&remaining.length)s.t=remaining.shift()});
      const a=(typeof r.amb==='function'?r.amb():r.amb)||{sky:'#8a90a8',gnd:'#30261c',i:0.55};
      rig.targetSky.set(a.sky);rig.targetGround.set(a.gnd);rig.targetAmbient=a.i;
      const sl=typeof r.sun==='function'?r.sun():r.sun;rig.targetSun=sl?sl.i:0;if(sl){rig.sourceSun=Object.assign({},sl);rig.targetSunColor.set(sl.c)}
    }
    tickLights(0);
  }
  function tickLights(dt) {
    let moving=false;
    for (const rig of roomRigs.values()) {
      const k=rig.fresh?1:Math.min(1,dt/0.14);
      for (const s of rig.slots) {
        if(s.t&&(s.key===s.t.key||s.cur<0.02||rig.fresh)){s.key=s.t.key;s.l=s.t}
        const target=s.t&&s.key===s.t.key?(s.t.i==null?1:s.t.i):0,d=target-s.cur;
        if(Math.abs(d)>0.003){s.cur+=d*k;moving=true}else s.cur=target;
      }
      const colorGap=(a,b)=>Math.abs(a.r-b.r)+Math.abs(a.g-b.g)+Math.abs(a.b-b.b);
      if(colorGap(rig.sky,rig.targetSky)>0.003||colorGap(rig.ground,rig.targetGround)>0.003||colorGap(rig.sunColor,rig.targetSunColor)>0.003)moving=true;
      rig.sky.lerp(rig.targetSky,k);rig.ground.lerp(rig.targetGround,k);
      for(const [value,target]of [['ambient','targetAmbient'],['sun','targetSun']]){const d=rig[target]-rig[value];if(Math.abs(d)>0.003){rig[value]+=d*k;moving=true}else rig[value]=rig[target]}
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
    PL.forEach((pl,i)=>{const s=rig.slots[i],l=s.l;pl.intensity=s.cur;if(l){pl.position.set(l.x,l.y,l.z);pl.color.set(l.c||'#fff');pl.distance=l.d||400;pl.decay=2}pl.updateMatrixWorld(true)});
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
      try { ren.compile(scene, camera); } catch (e) {}
      scene.traverse(o => { const m = o.material; if (m) [].concat(m).forEach(mm => { for (const k in mm) { const tx = mm[k]; if (tx && tx.isTexture && ren.initTexture) { try { ren.initTexture(tx); } catch (e) {} } } }); });
      ren.render(scene, camera);
      vis.forEach(([g, v]) => { g.visible = v; }); visCalc(); ren.render(scene, camera);
    } catch (e) { console.error('hs prewarm', e); }
  }
  let warmed = 0;
  function reveal() { // hold black while everything builds and uploads (never longer than ~5 s), then fade in once, fully drawn
    ui.fade(true, 0); const t0 = performance.now();
    const uncover = () => { ui.fade(false, 400); setTimeout(() => { const panel = document.getElementById('houseEntry'); if (panel) panel.remove(); html.classList.remove('house-entering'); }, 420); };
    const go = () => { if (!window.HouseRooms && performance.now() - t0 < 1500 && window.House && !warmed) return setTimeout(go, 100); prewarm(); warmed = 1; setTimeout(uncover, 60); };
    setTimeout(go, 30); setTimeout(() => ui.fade(false, 400), 5000);
    setTimeout(prewarm, 4000); // (rooms that load lazily, warmed behind the scenes)
  }
  function relight() { lightsFor(); dirty(); }

  // ================================================================ walking: a grid per floor (5 cm cells), the stairs between them
  const GR = { x0: -360, z0: -600, cs: 5, nx: 180, nz: 360 }, RAD = 22;
  const grids = { U: null, G: null, dirty: true, walk: [], block: [], stairs: [], shells: {} };
  function walkRect(lvl, x0, z0, x1, z1, o) { grids.walk.push(Object.assign({ lvl, x0, z0, x1, z1 }, o || {})); grids.dirty = true; }
  function block(lvl, x0, z0, x1, z1, o) { const b = Object.assign({ lvl, x0, z0, x1, z1 }, o || {}); grids.block.push(b); grids.dirty = true; return b; }
  function stairs(def) { grids.stairs.push(def); grids.dirty = true; } // { x0, z0, x1, z1, y(x, z) }
  function rebuildGrids() {
    grids.dirty = false;
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
    for (const c of cands) if (Math.abs(c.y - y0) <= 45 && headFitsDoor(x,z,c.lvl,c.y,eyeHeight==null?W.eyeNow+W.jh:eyeHeight) && !doorObstructs(x,z,c.y-50,c.lvl) && !Object.values(THINGS).some(t=>t.obstacle&&!t.at.hide&&(t.st==='rest'||t.st==='snap'||t.st==='fall')&&Math.abs(t.at.y-c.y)<25&&insideThing(t,x,z,RAD)) && (!best || Math.abs(c.y - y0) < Math.abs(best.y - y0))) best = c;
    return best;
  }
  const W = { x: 0, z: 100, lvl: 'U', fy: 73, eye: 128, eyeNow: 100, bob: 0, bobT: 0, vx: 0, vz: 0, jh: 0, jv: 0 };
  const STAND = 128, SITH = 100; // Jack's a 5-foot-ish kid: eyes about 128 cm up (sat: 100)

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
  let held = null; // { id, d (distance), ry (extra turn), from (where it was) }
  let saveT = 0;
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
    place(t);
    spot(id, Object.assign({ label: t.label, obj: t.obj, grab: true, range: t.range || 230 }, def.spot || {}));
    return t;
  }
  const renderY=(t,y)=>K.restY(y)-(t.bottomOffset||0);
  function place(t) { const a = t.at; t.obj.position.set(a.x, renderY(t,a.y), a.z); t.obj.rotation.set((t.rx || 0) * D2R, (a.ry || 0) * D2R, (t.rz || 0) * D2R, 'YXZ'); t.obj.visible = !a.hide; dirty(); }
  // flat surfaces things can rest on: { room, x0, z0, x1, z1, y }
  function support(rid, x0, z0, x1, z1, y, o) { const r = ROOMS[rid]; if (!r) return; r.supports.push(Object.assign({ x0, z0, x1, z1, y }, o || {})); }
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
  function grab(id) {
    const t = THINGS[id]; if (!t || held) return false;
    if (focusS?.o.seatId===id || t.canGrab && !t.canGrab()) return false;
    pendingRestores.delete(id); // a new grab supersedes an old deferred placement
    anims.delete('snap:' + id);
    const was = t.st === 'snap' || t.st === 'anim' ? t.snap : null;
    held = { id, d: clamp(t.holdD || 55, 30, 140), ry: 0, from: Object.assign({}, t.at), was, sx: t.at.x, sy: t.at.y, sz: t.at.z };
    if (was) { const sn = SNAPS[was]; t.snap = null; if (sn && sn.onUnsnap) try { sn.onUnsnap(t); } catch (e) { console.error(e); } emit('unsnap', was, id); }
    t.st = 'held'; t.at.hide = false; t.obj.visible = true;
    aimPt = null; aimT = 0; // never inherit the previous object's shelf target
    layerFor(t); // update the cached front-layer state too, even before a frame renders
    if (cur && t.obj.parent !== cur.things) cur.things.attach ? cur.things.add(t.obj) : 0;
    physicalSound('handle', {weight:thingWeight(t)});
    ui.holdBar(t);
    emit('grab', id);
    return true;
  }
  function heldPos() { // where the held thing floats: in front of your eyes, never through a wall
    const t = THINGS[held.id], f = fwd();
    let d = held.d;
    const radius = Math.hypot(t.hx,t.hz);
    const hit = pick(vw / 2, vh / 2, { skip: m => m.userData.spot === held.id || isThingMesh(m), far: d + radius + 2 });
    if (hit && hit.dist < d + radius + 2) d = Math.max(0, hit.dist - radius - 2);
    const right=t.holdOffset?.right||0,down=t.holdOffset?.down||0,angle=P.ry*D2R;
    // A large carton cannot fit between the eye and a nearby wall. Tuck it
    // below the eye instead of pulling its rear face through the camera.
    const tucked=d<radius+camera.near+2;
    return { x: P.x + f.x * d + Math.cos(angle)*right, y: tucked?Math.max(P.y+6,P.y+f.y*d)+t.h+down:P.y + f.y * d + t.h * 0.5 + 6 + down, z: P.z + f.z * d + Math.sin(angle)*right };
  }
  const isThingMesh = m => { let o = m; while (o) { if (o.userData && o.userData.thing) return true; o = o.parent; } return false; };
  const isHeldMesh = m => {if(!held)return false;for(let o=m;o;o=o.parent)if(o===THINGS[held.id].obj)return true;return false;};
  let aimPt = null, aimT = 0; // where the crosshair points (checked a few times a second while holding)
  function nearSnap(t, x, y, z, fresh) {
    let best = null;
    const now = performance.now();
    if (fresh || now - aimT > 120) { aimT = now; const h = pick(vw / 2, vh / 2, { skip: isHeldMesh, far: 260 }); aimPt = h ? h.p : null; }
    for (const id in SNAPS) {
      const s = SNAPS[id]; if (s.room && cur && s.room !== cur.id) continue;
      if (s.enabled && !s.enabled()) continue; if (s.accepts && !s.accepts(t.kind, t)) continue;
      let d = Math.hypot(x - s.x, (y - t.h / 2) - s.y, z - s.z);
      if (aimPt) d = Math.min(d, Math.hypot(aimPt.x - s.x, aimPt.y - s.y, aimPt.z - s.z) + 2); // (pointing right at the slot counts too)
      if (d <= s.r && (!best || d < best.d)) best = { s, d };
    }
    return best && best.s;
  }
  let snapHi = null;
  let floorHi=null;
  function floorAim(t,sx,sy){
    const hp=heldPos(),hit=pick(sx??vw/2,sy??vh/2,{skip:isHeldMesh,far:400});
    const point=hit&&hit.n?.y>.6?hit.p:hp,r=roomOfPoint(point)||cur,ry=-P.ry+held.ry;
    if(!r)return null;
    const target={room:r.id,x:point.x,z:point.z,y0:point.y};
    return{target:floorDropTarget(t,r,target,ry),aim:target,ry};
  }
  function floorGlow(p,t){
    if(!floorHi){floorHi=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({transparent:true,opacity:.22,depthWrite:false}));floorHi.userData.noPick=true;root.add(floorHi)}
    floorHi.visible=!!p;
    if(p){const q=p.target||p.aim;floorHi.material.color.set(p.target?'#8bc17b':'#c66b55');floorHi.position.set(q.x,LV[ROOMS[q.room].lvl]-.35,q.z);floorHi.scale.set(t.hx*2,.35,t.hz*2);floorHi.rotation.set(0,p.ry*D2R,0)}
  }
  function snapGlow(s) {
    if (!snapHi && !s) return;
    if (!snapHi) {
      snapHi = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.35, depthWrite: false }));
      // A shelf preview belongs in the room's depth buffer. The foreground
      // canvas has no walls/shelves to occlude it and makes it shine through.
      snapHi.userData.noPick = true; snapHi.renderOrder = 5; root.add(snapHi);
    }
    snapHi.visible = false;
    if (s) {
      const p = s.pose || s, c = s.preview || p, b = s.box || [s.r * 0.9, 1.5, s.r * 0.9];
      if (![c.x,c.y,c.z,...b].every(Number.isFinite) || b.some(n=>n<=0)) return;
      snapHi.position.set(c.x, c.y, c.z); snapHi.scale.set(b[0], b[1], b[2]);
      snapHi.rotation.set((p.rx || 0) * D2R, (p.ry || 0) * D2R, (p.rz || 0) * D2R, 'YXZ'); snapHi.visible = true;
    }
  }
  // put the held thing down: where you're looking (a surface), into a snap, or let it drop
  function drop(sx, sy) {
    if (!held) return; const t = THINGS[held.id], hp = heldPos();
    const sn = nearSnap(t, hp.x, hp.y, hp.z, true);
    if (sn) return snapIn(t, sn);
    let tgt = null;
    const hit = pick(sx == null ? vw / 2 : sx, sy == null ? vh / 2 : sy, { skip: isHeldMesh, far: 400 });
    if (hit && hit.n && hit.n.y > 0.6 && cur) { // a flat-ish surface you're pointing at (three's normals are y-up)
      const r = roomOfPoint(hit.p) || cur;
      const x = clamp(hit.p.x, r.bx0 + t.hx, r.bx1 - t.hx), z = clamp(hit.p.z, r.bz0 + t.hz, r.bz1 - t.hz);
      tgt = { room: r.id, x, z, y0: hit.p.y - 0.5 };
    }
    if (!tgt) { const r = roomOfPoint(hp) || cur; tgt = { room: r.id, x: clamp(hp.x, r.bx0 + t.hx, r.bx1 - t.hx), z: clamp(hp.z, r.bz0 + t.hz, r.bz1 - t.hz), y0: hp.y }; }
    const ry=t.obj.rotation.y/D2R;
    if(t.canPlace&&t.canPlace(tgt)===false)return false;
    let finalRy=ry;
    if(t.floorOnly){const p=floorAim(t,sx,sy);if(!p?.target){ui.toast('Not enough room','Red footprint: blocked. Aim at clear floor until it turns green, then E / Click to place. R turns the item.');return false;}tgt=p.target;finalRy=p.ry;}
    const r=ROOMS[tgt.room],y = t.floorOnly?LV[r.lvl]:landY(tgt.room, tgt.x, tgt.z, tgt.y0, t);
    if(t.obstacle&&Math.abs(y-LV[r.lvl])<8&&(!floorPlacement(t,r,tgt.x,tgt.z,finalRy)||!placementKeepsRoutes(t,r,tgt,finalRy))){
      ui.toast('Leave a clear path','That would block the way. The item goes back where you picked it up.');putBack();return false;
    }
    const startY = Math.min(hp.y, y - 0.5); // (it drops from where it is, or is set straight down)
    held = null; ui.holdBar(null); snapGlow(null);floorGlow(null);
    t.st = 'fall'; t.vy = 0; t.at = { room: tgt.room, x: tgt.x, y: startY, z: tgt.z, ry: finalRy };t.obj.rotation.y=finalRy*D2R;
    t.landY = y; t.fromX = hp.x; t.fromZ = hp.z; t.t0 = performance.now();
    moveTo(t, tgt.room);
    emit('place', t.id);saveThings();
  }
  function roomOfPoint(p) { for (const id of visSet) { const r = ROOMS[id]; if (r.area.some(a => p.x >= a[0] - 1 && p.x <= a[2] + 1 && p.z >= a[1] - 1 && p.z <= a[3] + 1) && Math.abs((p.y || LV[r.lvl]) - LV[r.lvl]) < 290) return r; } return null; }
  function moveTo(t, rid) { const r = ROOMS[rid]; if (r && t.obj.parent !== r.things) r.things.add(t.obj); }
  function snapIn(t, s) {
    const destination = Object.assign({}, s.pose || {x:s.x,y:s.y,z:s.z,ry:s.ry||0});
    if (s.onBegin && s.onBegin(t, destination) === false) return;
    held = null; ui.holdBar(null); snapGlow(null);floorGlow(null);
    const p0 = { x: t.obj.position.x, y: t.obj.position.y, z: t.obj.position.z, ry: t.obj.rotation.y / D2R, rx: t.obj.rotation.x / D2R, rz: t.obj.rotation.z / D2R };
    const p1 = destination;
    t.st = 'anim'; const t0 = performance.now(), ms = 380;
    anims.set('snap:' + t.id, n => {
      const k = ease(Math.min(1, (n - t0) / ms));
      t.obj.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, renderY(t,p1.y), k), lerp(p0.z, p1.z, k));
      t.obj.rotation.set(lerp(p0.rx, p1.rx || 0, k) * D2R, (p0.ry + angd(p0.ry, p1.ry || 0) * k) * D2R, lerp(p0.rz, p1.rz || 0, k) * D2R, 'YXZ');
      if (k < 1) return true;
      t.st = 'snap'; t.snap = s.id; t.at = { room: s.room || (cur && cur.id), x: p1.x, y: p1.y, z: p1.z, ry: p1.ry || 0, hide: !!s.hide };
      t.rx = p1.rx || 0; t.rz = p1.rz || 0;
      if (s.hide) t.obj.visible = false;
      layerFor(t);
      physicalSound('handle', {weight:thingWeight(t),put:true});
      if (s.onSnap) try { s.onSnap(t); } catch (e) { console.error(e); }
      emit('snap', s.id, t.id); saveThings();
      return false;
    });
  }
  function putBack() { // Q / return action: it goes back where you got it from
    if (!held) return; const t = THINGS[held.id], f = held.from, was = held.was;
    held = null; ui.holdBar(null); snapGlow(null);floorGlow(null);
    if (was && SNAPS[was]) {const s=SNAPS[was];if(!s.accepts||s.accepts(t.kind,t)){t.at=f;return snapIn(t,s);}}
    t.st = 'fall'; t.at = Object.assign({}, f, { y: f.y - 3, ry: f.ry || 0 }); t.landY = f.y; t.vy = 0; t.t0 = performance.now(); t.fromX = t.obj.position.x; t.fromZ = t.obj.position.z; t.obj.rotation.set((t.rx || 0) * D2R, (f.ry || 0) * D2R, (t.rz || 0) * D2R, 'YXZ'); moveTo(t, f.room);
  }
  // things in front of boot.js's PC (as you see it now) are drawn on the second canvas, over it; so is whatever you're holding
  function pcParts() { const L = Lb(); return [[L.mx - 19, -40, -19, L.mx + 19, 0, 1], [L.tx - 10, -42.3, L.tz - 17, L.tx + 10, 0, L.tz + 19], [L.kx - 15, -3.5, 6, L.kx + 15, 0, 17.5], [L.ux - 7, -3, L.uz - 8, L.ux + 7, 0, L.uz + 8]]; }
  function scrBox(x0, y0, z0, x1, y1, z1) {
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9, dd = 0, n = 0;
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) { const p = toScreen(x, y, z); if (!p) return null; a = Math.min(a, p.x); b = Math.min(b, p.y); c = Math.max(c, p.x); d = Math.max(d, p.y); dd += p.d; n++; }
    return { a, b, c, d, dep: dd / n };
  }
  function frontOf(t) {
    if (t.st === 'held' || t.st === 'inspect' || t.inspectFront) return true;
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
    if (t.shadowState !== t.st) {t.shadowState = t.st; t.obj.traverse(o => {if (o.userData.contactShadow) o.visible = t.st === 'rest' || t.st === 'snap';});}
    const f = frontOf(t); if (f === t.front) return; t.front = f; t.obj.traverse(o => o.layers.set(f ? 1 : 0));
  }
  // Contact shadows for grab-API props that do not model their own (phones, toys, boxes...): one instanced,
  // depth-write-free soft rectangle per prop, a single draw call per room. Shown only while the prop rests
  // upright on something; hidden while carried, falling, hidden or stood on edge in a shelf slot.
  const PROP_SHADOW = { geo: null, mat: null, m: new T.Matrix4(), q: new T.Quaternion(), e: new T.Euler(), s: new T.Vector3(), p: new T.Vector3(), zero: new T.Matrix4().makeScale(0, 0, 0) };
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
    if (!held) { snapGlow(null); if (floorHi) floorHi.visible = false; }
    for (const id in THINGS) {
      const t = THINGS[id];
      if (t.st === 'held' && held && held.id === id) {
        const hp = heldPos(), o = t.obj.position, k = 1 - Math.pow(0.0005, dt); // a little lag: it trails your view
        o.x += (hp.x - o.x) * k; o.y += (hp.y - o.y) * k; o.z += (hp.z - o.z) * k;
        const want = P.ry * -1 + held.ry + (t.faceYou ? 180 : 0), r0 = t.obj.rotation.y / D2R;
        t.obj.rotation.set(Math.sin(performance.now() / 700) * 0.04, (r0 + angd(r0, want) * k) * D2R, Math.sin(performance.now() / 900) * 0.03, 'YXZ');
        // Translation trails the view. Keep that intermediate path below the
        // eye too, until the whole item has cleared the near rectangle.
        if(Math.hypot(o.x-P.x,o.z-P.z)<Math.hypot(t.hx,t.hz)+camera.near+2&&o.y-t.h<P.y+4)o.y=P.y+t.h+6;
        const sn = !controlsPaused && mode === 'walk' ? nearSnap(t, o.x, o.y, o.z) : null; snapGlow(sn); ui.snapHint(sn);floorGlow(t.floorOnly&&!sn&&!controlsPaused&&mode==='walk'?floorAim(t):null,t);
        any = true;
      } else if (t.st === 'fall') {
        const a = t.at, now = performance.now();
        t.vy += 1800 * dt; a.y += t.vy * dt;
        // (slide the last bit from where it was held to where it lands)
        const sk = Math.min(1, (now - t.t0) / 240); t.obj.position.x = lerp(t.fromX == null ? a.x : t.fromX, a.x, ease(sk)); t.obj.position.z = lerp(t.fromZ == null ? a.z : t.fromZ, a.z, ease(sk));
        if (a.y >= t.landY) { a.y = t.landY; if (t.vy > 160) { t.vy = -t.vy * 0.22; physicalSound('handle', {weight:thingWeight(t),put:true}); } else { t.vy = 0; if (sk >= 1) { t.st = 'rest'; t.fromX = t.fromZ = null; layerFor(t); saveThings(); emit('rest', id); } } }
        t.obj.position.y = renderY(t,a.y);
        const r = t.obj.rotation; if(t.floorOnly){r.x=0;r.z=0}else{r.x *= 0.8; r.z *= 0.8;}
        any = true;
      }
      // anything that has fallen out of the world goes home
      if (t.st === 'rest' && (!ROOMS[t.at.room] || t.at.y > LV[ROOMS[t.at.room].lvl] + 30)) { t.at = Object.assign({}, t.home); place(t); moveTo(t, t.home.room); }
    }
    return any;
  }
  function saveThings(immediate) {
    clearTimeout(saveT);
    const write = () => {
      saveT=0;
      // Keep records belonging to unbuilt rooms; saving the bedroom must not
      // erase the rest of the house, nor overwrite a deferred prop with its home.
      const previous = loadThings(), st = Object.assign({}, previous.t), op = Object.assign({}, previous.o);
      for (const id in THINGS) { const t = THINGS[id]; if (t.noSave || pendingRestores.has(id)) continue; const a = t.at,y=t.st==='fall'&&Number.isFinite(t.landY)?t.landY:a.y; st[id] = [a.room, +a.x.toFixed(1), +y.toFixed(1), +a.z.toFixed(1), Math.round(a.ry || 0), t.st === 'snap' ? t.snap : 0, a.hide ? 1 : 0]; }
      for (const id in OPEN) { if (OPEN[id].open) op[id] = 1; else delete op[id]; }
      loaded = {t:st,o:op};
      try { if (!(window.Apps && Apps.saveGame && Apps.saveGame('hs.things',loaded,{v:1})))ls.set('jhp_hs_things',{t:st,o:op,_savedAt:Date.now()}); } catch (e) {}
    };
    if (immediate === true) write(); else saveT = setTimeout(write, 600);
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
    return loaded;
  }
  function restoreThing(t) { // where this visitor left it last time
    const s = loadThings().t[t.id]; if (!s) return;
    if (!ROOMS[s[0]]) { pendingRestores.set(t.id,t); return; }
    pendingRestores.delete(t.id);
    t.at = { room: s[0], x: s[1], y: s[2], z: s[3], ry: s[4], hide: !!s[6] };
    if (s[5] && SNAPS[s[5]]) {
      t.st = 'snap'; t.snap = s[5];
      const p = SNAPS[s[5]].pose || SNAPS[s[5]];
      t.at.x = p.x; t.at.y = p.y; t.at.z = p.z; t.at.ry = p.ry || 0;
      t.rx = p.rx || 0; t.rz = p.rz || 0;
    } else t.st = 'rest';
    moveTo(t, t.at.room); place(t); layerFor(t);
  }
  function tidy(rid) { // everything back where it lives (Mom tidied up)
    for (const id in THINGS) { const t = THINGS[id]; if (rid && t.home.room !== rid && t.at.room !== rid) continue; pendingRestores.delete(id); if (held && held.id === id) { held = null; ui.holdBar(null); } t.st = t.home.snap ? 'snap' : 'rest'; t.snap = t.home.snap || null; t.at = Object.assign({}, t.home); moveTo(t, t.home.room); place(t); layerFor(t); }
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
    const from = o.k, to = o.open ? 1 : 0, t0 = performance.now();
    anims.set('open:' + id, n => { const k = Math.min(1, (n - t0) / o.ms); o.k = from + (to - from) * ease(k); o.apply(); return k < 1; });
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
  let glide = null;
  function glideTo(to, o) {
    o = o || {};
    if (glide && glide.onCancel) { const f = glide.onCancel; glide.onCancel = null; try { f(); } catch (e) {} }
    const from = { x: P.x, y: P.y, z: P.z, rx: P.rx, ry: P.ry };
    const dist = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z), turn = Math.abs(angd(from.ry, to.ry)) + Math.abs(to.rx - from.rx);
    const ms = o.ms != null ? o.ms : clamp(420 + dist * 2.2 + turn * 3, 500, 1500);
    glide = { from, to, t0: performance.now(), ms, done: o.done, onCancel: o.cancel, lock: !!o.lock, arc: o.arc };
    if (mode === 'walk' || mode === 'glide') mode = 'glide';
    dirty();
    return glide;
  }
  function tickGlide(now) {
    if (!glide) return false;
    const g = glide, k = g.ms ? Math.min(1, (now - g.t0) / g.ms) : 1, e = ease(k), to = typeof g.to === 'function' ? g.to() : g.to;
    P.x = lerp(g.from.x, to.x, e); P.y = lerp(g.from.y, to.y, e) - (g.arc ? Math.sin(Math.PI * e) * g.arc : 0); P.z = lerp(g.from.z, to.z, e);
    P.rx = lerp(g.from.rx, to.rx, e); P.ry = g.from.ry + angd(g.from.ry, to.ry) * e;
    if (k >= 1) {
      glide = null;
      // where you are now (if it's somewhere you could stand)
      setWalkFrom(to);
      if (mode === 'glide') mode = 'walk';
      if (g.done) try { g.done(); } catch (e2) { console.error(e2); }
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
  function cancelGlide(force) { if (!glide || (glide.lock && !(force && glide.onCancel))) return false; const g = glide; glide = null; setWalkFrom(P); if (mode === 'glide') mode = 'walk'; if (g.onCancel) try { g.onCancel(); } catch (e) {} return true; }

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
  const KEYMOVE = { w: 'f', W: 'f', ArrowUp: 'f', s: 'b', S: 'b', ArrowDown: 'b', a: 'l', A: 'l', ArrowLeft: 'l', d: 'r', D: 'r', ArrowRight: 'r' };
  let lastPt = { x: 0, y: 0, ok: false, mouse: false };
  const walkingFloor=(x,z)=>{
    if(window.ChoreKit?.tool?.canWalk?.(x,z)===false)return null;
    const f=floorAt(x,z,W.lvl,W.fy);
    // Small thresholds are fine; stepping sideways off the flight must not
    // turn the legacy 45 cm pose-restore tolerance into a sudden camera drop.
    return f&&Math.abs(f.y-W.fy)<=8?f:null;
  };
  function movementContacts(x,z,radius=RAD) {
    const s=onStairs(x,z),ramp=s&&x>=s.x0+RAD&&x<=s.x1-RAD&&Math.abs(s.y(x,z)-W.fy)<=45;
    const out=ramp?[]:shellContacts(x,z,W.lvl,radius);
    out.push(...doorContacts(x,z,W.fy-50,W.lvl,radius));
    for(const t of Object.values(THINGS))if(t.obstacle&&!t.at.hide&&['rest','snap','fall'].includes(t.st)&&Math.abs(t.at.y-W.fy)<25){
      const a=(t.at.ry||0)*D2R,cs=Math.cos(a),sn=Math.sin(a),dx=x-t.at.x,dz=z-t.at.z,c=circleBox(dx*cs-dz*sn,dx*sn+dz*cs,-t.hx,-t.hz,t.hx,t.hz,radius);
      if(c)out.push({nx:c.nx*cs+c.nz*sn,nz:-c.nx*sn+c.nz*cs,depth:c.depth});
    }
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
        for(const c of contacts){const dot=sx*c.nx+sz*c.nz;if(dot<0){sx-=c.nx*dot;sz-=c.nz*dot;projected=true}const velocity=W.vx*c.nx+W.vz*c.nz;if(velocity<0){W.vx-=c.nx*velocity;W.vz-=c.nz*velocity}}
        if(!projected)break;
      }
    }
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
    const mag = Math.min(1, Math.hypot(mx, mz));
    const night = !!(window.HouseLife && HouseLife.quiet && HouseLife.quiet());
    const lintel=lowDoorAt(W.x,W.z,W.lvl,6,W.fy),nearLintel=keys.crouch&&lowDoorAt(W.x,W.z,W.lvl,RAD+18,W.fy),ducking=keys.crouch||!!lintel;
    if (!W.seat) W.eye = Math.max(60, ((cur && cur.eye) || STAND) - (keys.crouch ? 38 : 0)); // C: crouch
    if(lintel||nearLintel)W.eye=Math.min(W.eye,(lintel||nearLintel).headroom-10);
    const carrySpeed = held ? (THINGS[held.id]?.walkScale || 1) : 1;
    const sp = carrySpeed * (keys.run ? 210 : night ? 62 : 140) * (W.seat ? 0 : 1) * (ducking ? 0.5 : 1); // (Shift: a jog, 1.5x. At night you creep anyway: Mom's asleep)
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
      moveCircle(W.vx*dt,W.vz*dt);
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
    if(ev.key.toLowerCase()==='t'&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey&&!typing&&!(ev.shiftKey&&window.ScreenLock?.current?.type==='surface')&&window.ScreenLock?.available){ev.preventDefault();ev.stopImmediatePropagation();if(!ev.repeat)ScreenLock.toggle();return;}
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
        const item=THINGS[held.id];
        if(!['e','E'].includes(k))useHeld();else drop();
      } else useAt(vw/2,vh/2,true,(!['e','E'].includes(k))?'use':'grab');
      wantLock();return;
    }
    if (held && (k === 'r' || k === 'R')) { if (!ev.repeat) held.ry += ev.shiftKey ? -45 : 45; ev.preventDefault(); return; }
    if (held && (k === '+' || k === '=' || k === ']')) { held.d = clamp(held.d + 10, 25, 150); return; }
    if (held && (k === '-' || k === '_' || k === '[')) { held.d = clamp(held.d - 10, 25, 150); return; }
    if (k === 'Escape') { if (held) { putBack(); ev.preventDefault(); ev.stopImmediatePropagation(); } else if (glide) { if (cancelGlide(true)) { ev.preventDefault(); ev.stopImmediatePropagation(); } } return; }
    if ((k === 'g' || k === 'G') && !ev.ctrlKey && !ev.metaKey) { gfxNext(); return; }
    if (k === 'Tab' && !ev.ctrlKey && !ev.altKey) { /* (Tab stays the browser's: the power button must stay reachable) */ }
  }
  function onKeyUp(ev) { const k = KEYMOVE[ev.key]; if (k) keys[k] = false; if (ev.key === 'Shift') keys.run = false; if (!crouchToggle && (ev.key === 'c' || ev.key === 'C')) keys.crouch = false; }
  addEventListener('keydown', onKey, true); addEventListener('keyup', onKeyUp, true);
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; try { if (document.pointerLockElement === cv) document.exitPointerLock(); } catch (e) {} });

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
  function plOK() { return !controlsPaused && !worldLoading && live && (mode === 'walk'||mode==='focus'&&focusS?.o.seatId) && !viewOpen() && !ui.modalOpen(); }
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
      if (mode === 'walk' || mode === 'glide'||mode==='focus'&&focusS?.o.seatId) { if (mode === 'glide') cancelGlide(); P.ry += ev.movementX * 0.1; P.rx = clamp(P.rx - ev.movementY * 0.1, -78, 70); dirty(); lastPt = { x: vw / 2, y: vh / 2, ok: true, mouse: true }; hoverQ = true; }
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
    if (locked()) { if (!p.drag) { if (held) drop(); else useAt(vw / 2, vh / 2, true); } return; }
    if (!p.drag && performance.now() - p.t0 < 900) { if (held) drop(ev.clientX, ev.clientY); else useAt(ev.clientX, ev.clientY); }
    // Resolve the original click before locking: acquiring on mousedown used
    // to turn an off-centre click into an action on the centre object.
    if (!p.drag && p.type === 'mouse' && ev.button === 0) wantLock();
  };
  pb.addEventListener('contextmenu',ev=>{if(held&&(['walk','glide'].includes(mode)||mode==='focus'&&focusS?.o.seatId)&&!controlsPaused&&!viewOpen()){ev.preventDefault();ev.stopPropagation();putBack()}});
  pb.addEventListener('pointerup', endPt); pb.addEventListener('pointercancel', endPt);
  pb.addEventListener('wheel', ev => { if (!live || !held) return; ev.preventDefault(); held.d = clamp(held.d - Math.sign(ev.deltaY) * 8, 25, 150); }, { passive: false });
  pb.addEventListener('pointerleave', () => { setHot(null); ui.tip(null); });
  let hoverQ = false;
  function hover() {
    if (!lastPt.mouse || !canAct() || PT.size) return;
    const h=pick(lastPt.x,lastPt.y,held?{skip:o=>o.userData.spot===held.id}:undefined);
    carrySeat=held&&!focusS&&h&&THINGS[h.spot]?.seat&&h.dist<=SPOTS[h.spot].range?h.spot:null;
    const sid = h && h.spot && !(held && h.spot === held.id) ? h.spot : null;
    setHot(sid);
    const s = sid && SPOTS[sid];
    ui.tip(s ? (typeof s.label === 'function' ? s.label() : s.label) + (s.grab&&!held&&h.dist<=s.range?' <i><span><kbd>E</kbd> Pick up</span>'+'<span><kbd>F</kbd> '+esc(actionLabel(THINGS[sid]))+'</span>'+'</i>' : '') : null, lastPt.x, lastPt.y, s && h.dist > s.range);
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
  function useHeld(){if(!held)return false;const h=pick(vw/2,vh/2,{skip:o=>o.userData.spot===held.id}),seat=h&&THINGS[h.spot];if(!focusS&&seat?.seat&&h.dist<=SPOTS[h.spot].range)return sitOn(seat.id);return interact(held.id);}
  function interact(id){const t=THINGS[id];if(!t||controlsPaused||worldLoading)return false;return t.use?t.use(t):inspect(id);}
  function suspendGrip(id){if(!held||held.id!==id)return null;const grip=held;held=null;ui.holdBar(null);snapGlow(null);floorGlow(null);return grip;}
  function restoreGrip(grip){if(!grip||held||!THINGS[grip.id])return false;held=grip;const t=THINGS[grip.id];t.st='held';t.inspectFront=false;layerFor(t);ui.holdBar(t);dirty();return true;}
  function inspect(id) {
    if (inspection || !(mode==='walk'||mode==='focus'&&focusS?.o.seatId) || worldLoading) return false;
    const t = THINGS[id]; if (!t || (held && held.id !== id)) return false;
    if (!held && !grab(id)) return false;
    const grip=held,seat=focusS?.o.seatId?focusS:null;held=null;t.st='inspect';unlock();
    for (const k in keys) keys[k] = false;
    ui.holdBar(null); snapGlow(null); floorGlow(null); ui.hush(); ui.tip(null); setMode('inspect');
    t.obj.updateWorldMatrix(true, true); const box = new T.Box3();
    t.obj.traverse(o => {if (o.isMesh && !o.userData.contactShadow) {o.geometry.computeBoundingBox(); const m = new T.Matrix4().copy(t.obj.matrixWorld).invert().multiply(o.matrixWorld); box.union(o.geometry.boundingBox.clone().applyMatrix4(m));}});
    const centre = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
    const panel = document.createElement('div'); panel.className = 'hs-inspection';
    const name = document.createElement('b'); name.textContent = typeof t.label === 'function' ? t.label() : t.label;
    const hint=document.createElement('span');hint.innerHTML=(t.obj.userData.cube?'Drag a face: move · Right-drag: rotate':'Drag: rotate')+(t.issueId?'':' · <kbd>Arrows</kbd> Rotate')+' · <kbd>R</kbd> Turn · <kbd>+ / −</kbd> / Wheel: zoom · <kbd>Q</kbd> Back · <kbd>Esc</kbd> Menu';
    const back = document.createElement('button'); back.type = 'button'; back.textContent='Back [Q]'; back.addEventListener('click', endInspect);
    panel.append(name, hint, back); ui.el.appendChild(panel);
    const ip = t.inspectPose || {};
    inspection = {t, grip, seat, centre, panel, yaw: -P.ry + (ip.yaw ?? 24), pitch: ip.pitch ?? (id === 'gb' ? -80 : -18), zoom: ip.zoom ?? 1, radius: size.length() / 2, drag: null};
    if(t.onInspectUse){const use=document.createElement('button');use.type='button';use.textContent=(t.inspectUseLabel||'Use')+' [F]';use.dataset.inspectUse='';use.addEventListener('click',()=>{if(!controlsPaused)t.onInspectUse(t)});panel.insertBefore(use,back)}
    html.classList.add('hs-inspecting');layerFor(t);poseInspect();try{t.onInspectStart?.(panel)}catch(e){console.error(e)}return true;
  }
  function poseInspect() {
    const s = inspection; if (!s) return;
    const angle = camera.fov * D2R / 2, fit = Math.min(angle, Math.atan(Math.tan(angle) * vw / vh));
    const d = Math.max(10, s.radius / Math.sin(fit) * 1.24) * s.zoom, f = fwd(), t = s.t;
    t.obj.rotation.set(s.pitch * D2R, s.yaw * D2R, 0, 'YXZ');
    const offset = s.centre.clone().applyEuler(t.obj.rotation);
    t.obj.position.set(P.x + f.x * d - offset.x, P.y + f.y * d - offset.y, P.z + f.z * d - offset.z);
    t.obj.updateMatrixWorld(true); dirty();
  }
  function endInspect() {
    const s = inspection; if (!s) return;
    if (s.t.obj.userData.cube) s.t.obj.userData.cube.finish();
    s.panel.remove(); inspection = null; html.classList.remove('hs-inspecting');
    held=s.grip;s.t.st='held';setMode(s.seat?'focus':'walk');ui.holdBar(s.t);dirty();
    try { s.t.onInspectEnd?.(); } catch (e) { console.error(e); }
    emit('inspect-end',s.t.id);wantLock();
  }
  document.addEventListener('pointerdown', ev => {
    const s=inspection;if(!s||controlsPaused||ev.pointerType&&ev.pointerType!=='mouse'||ev.target.closest('button,input,select,textarea,a,summary'))return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    const ray = new T.Raycaster(); ray.layers.enableAll(); ray.setFromCamera(new T.Vector2(ev.clientX / vw * 2 - 1, 1 - ev.clientY / vh * 2), camera);
    const hit = ray.intersectObject(s.t.obj, true).find(h => h.object.userData.cubie);
    s.drag={id:ev.pointerId,x:ev.clientX,y:ev.clientY,startX:ev.clientX,startY:ev.clientY,button:ev.button,moved:false,hit:ev.button===0?hit:null};
  }, true);
  document.addEventListener('pointermove', ev => {
    const s = inspection, d = s && s.drag;
    if(!d||d.id!==ev.pointerId||controlsPaused)return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    const x=ev.clientX,y=ev.clientY,dx=x-d.x,dy=y-d.y;if(Math.hypot(x-d.startX,y-d.startY)>5)d.moved=true;
    if (d.hit) {if (Math.hypot(dx, dy) > 22) {s.t.obj.userData.cube.drag(d.hit, dx, dy); s.drag = null;}}
    else {s.yaw = (s.yaw+dx*.45)%360; s.pitch = (s.pitch-dy*.45)%360; d.x=x;d.y=y;poseInspect();}
  }, true);
  const inspectUp=ev=>{const s=inspection,d=s?.drag;if(!d||d.id!==ev.pointerId)return;s.drag=null;
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
    if(held&&!o.seatId)putBack();
    focusS = {parent,back: { x: P.x, y: P.y, z: P.z, rx: P.rx, ry: P.ry, lvl: W.lvl, seat: W.seat }, o };
    for (const k in keys) keys[k] = false;
    glideTo(pose, { lock: true, ms: o.ms || 750, cancel:()=>{if(focusS)unfocus()}, done: () => { if (!focusS) return; mode = 'focus'; html.classList.add('hs-focus'); ui.focusBar(o.label || 'Get up'); if (o.enter) try { o.enter(); } catch (e) { console.error(e); } } });
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
  function sitOn(id, saved) {
    const t=THINGS[id];if(t?.seat&&t.st==='held'){ui.toast('Put the seat down','E / Click places it. Then F sits down.');return false;}if(!t?.seat||!['rest','snap'].includes(t.st)||t.at.hide||t.at.room!==cur?.id||focusS)return false;
    const at=t.at,a=(at.ry||0)*D2R,front=t.seat.front||0;
    const pose={x:at.x+Math.sin(a)*front,y:at.y-t.seat.eye,z:at.z+Math.cos(a)*front,rx:-4,ry:180-(at.ry||0),seat:1,lvl:cur.lvl};
    if(Number.isFinite(saved?.rx)&&Number.isFinite(saved?.ry)){pose.rx=saved.rx;pose.ry=saved.ry;}
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
    mode='walk';glideTo(f.back,{lock:!!(f.o.seatId||f.parent),ms:now?0:650,done:()=>{
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
      <div class="hs-hold" hidden><small class="hs-hmode">CARRYING</small><span class="hs-hname"></span><span class="hs-hkeys"></span><small class="hs-carry-help">Wheel: distance · Right click / Q: return · Esc: menu</small><span class="hs-hbtn"><button type="button" data-h="near" aria-label="Nearer">&minus;</button><button type="button" data-h="far" aria-label="Further">+</button><button type="button" data-h="turn">Turn</button><button type="button" data-h="use" hidden></button><button type="button" data-h="put">Place [E]</button><button type="button" data-h="back">Return [Q]</button></span></div>
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
      else if (a === 'turn') held.ry += 45; else if (a === 'inspect') interact(t.id); else if (a === 'put') drop(); else if (a === 'back') putBack(); else if(a==='use'&&t)useHeld();
    });
    $('.hs-getup').addEventListener('click', () => unfocus());
    const map = $('.hs-map'), mg = map.getContext('2d');
    let crossT = 0;
    return {
      el,
      say(title,text,ms){if(inspection){let description=inspection.panel.querySelector('.hs-inspect-description');if(!description){description=document.createElement('p');description.className='hs-inspect-description';inspection.panel.appendChild(description)}description.innerHTML=text;note.classList.remove('on');return;}note.querySelector('b').textContent = title; note.querySelector('p').innerHTML = text; note.classList.add('on'); clearTimeout(noteT); noteT = setTimeout(() => note.classList.remove('on'), ms || Math.max(4500, String(text).length * 70)); },
      hush() { note.classList.remove('on'); },
      toast(title, text) { toastEl.innerHTML = `<b>${esc(title)}</b><span>${esc(text)}</span>`; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 4200); },
      tip(text,x,y,far){if(!text||held){tipEl.classList.remove('on');tipKey='';return;}const content=text+(far?' <small>(walk closer)</small>':text.includes('<kbd>E</kbd>')?'':' <small><kbd>F</kbd> Use</small>'),key=content+'|'+vw+'|'+vh;tipEl.classList.add('on');if(key!==tipKey){tipKey=key;tipEl.innerHTML=content;tipW=tipEl.offsetWidth;tipH=tipEl.offsetHeight;}tipEl.style.transform=`translate(${clamp(x+14,8,Math.max(8,vw-tipW-8))}px,${clamp(y+18,8,Math.max(8,vh-tipH-8))}px)`;},
      where() {
        const r = cur; if (!r) return;
        $('.hs-title').textContent = r.title || r.name.toUpperCase(); $('.hs-where').textContent = r.stations[stIdx] ? r.stations[stIdx].n : r.sub || '';
      },
      holdBar(t) {
        if(!t){hold.hidden=true;holdKey=snapKey='';carrySeat=null;hold.classList.remove('snap');el.classList.remove('holding');return;}
        const label=typeof t.label==='function'?t.label():t.label,key=[t.id,label,t.useLabel,!!t.use,carrySeat].join('|');
        if(!hold.hidden&&holdKey===key&&!snapKey)return;
        holdKey=key;snapKey='';hold.classList.remove('snap');hold.hidden=false;el.classList.add('holding');
        hold.querySelector('[data-h=inspect]')?.remove();
        hold.querySelector('.hs-hmode').textContent='CARRYING';hold.querySelector('.hs-hname').textContent=label;
        const action=carrySeat?'Sit down with item':actionLabel(t);
        hold.querySelector('.hs-hkeys').innerHTML='<span><kbd>E</kbd> Place</span><span><kbd>F</kbd> '+esc(action)+'</span><span><kbd>R</kbd> Turn</span><span><kbd>Q</kbd> Return</span>';
        const button=hold.querySelector('[data-h=use]');button.hidden=false;button.textContent=action+' [F]';
      },
      snapHint(s){
        if(!s){if(held)this.holdBar(THINGS[held.id]);return;}
        const hint=(s.hint||'Place here').replace(/^(?:Click\/E to |Let go(?: to|:)\s*)/i,''),key=s.id+'|'+hint;
        if(snapKey===key)return;snapKey=key;hold.classList.add('snap');hold.querySelector('.hs-hmode').textContent='PLACE HERE';
        hold.querySelector('.hs-hkeys').innerHTML='<span><kbd>E</kbd> '+esc(hint)+'</span><span><kbd>Q</kbd> Return</span>';
      },
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
  let need = true, raf = 0, lastT = 0, lastAmb = 0, frame = 0, budgetPose='', viewing = false, viewT = 0;
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
    if (mode === 'follow') moving = followCss();
    else {
      if (mode === 'glide' && !glide) mode = 'walk';
      if (tickGlide(now)) moving = true;
      else if (mode === 'walk'&&!controlsPaused) { let left = dt; while (left > 1e-4) { const st = Math.min(0.03, left); left -= st; if (tickWalk(st)) moving = true; } }
    }
    for (const [k, fn] of anims) { let more = false; try { more = fn(now, dt); } catch (e) { console.error(e); } if (!more) anims.delete(k); moving = true; }
    if (tickThings(dt)) moving = true;
    if (hoverQ && frame % 3 === 0) { hoverQ = false; hover(); }
    frame++;
    const ambOn = ambient.size && now - lastAmb > (monitor?Math.max(100,1000/graphics.backgroundFps):50);
    if (!moving && !need && !ambOn) return;
    if (ambOn) { lastAmb = now; for (const fn of ambient) try { fn(now); } catch (e) {} }
    need = false;
    const pose=[P.x,P.y,P.z,P.rx,P.ry].join(',');
    render(); fpsTick(now,moving||(mode==='walk'&&pose!==budgetPose)||!!(Q.probe&&now<Q.probe));budgetPose=pose;
    if (frame % 6 === 0) ui.map();
  }
  // Budget only consecutive demanded frames. Ambient animation deliberately
  // runs at 20 Hz and must not be mistaken for a struggling 20 FPS device.
  let lastR=0,goodBudget=0;
  function fpsTick(now,continuous){
    const f=Q.f;
    if(!continuous||backgroundCovered()){lastR=0;f.n=0;f.t=0;return}
    const d=lastR?(now-lastR)/1000:0;lastR=now;
    if(d>0&&d<.75){f.n++;f.t+=d}
    if(Q.probe&&now<Q.probe)dirty();else if(Q.probe)Q.probe=0;
    if(f.t<.9)return;
    Q.fps=Math.round(f.n/f.t);f.n=0;f.t=0;
    if(!graphics.dynamic)return;
    if(Q.fps<28){
      goodBudget=0;
      if(Q.auto&&Q.tier!=='low')setTier(QN[QN.indexOf(Q.tier)-1]);
      else if(Q.renderScale>.5){Q.renderScale=Math.max(.5,Q.renderScale-.125);measure()}
    }else if(Q.fps>52&&Q.renderScale<1){
      if(++goodBudget>=5){goodBudget=0;Q.renderScale=Math.min(1,Q.renderScale+.125);measure()}
    }else goodBudget=0;
  }
  function setTier(t, refresh) {
    Q.tier = t; window.HouseQ = t; K.setAniso(Math.min(wantedAniso(),ren.capabilities.getMaxAnisotropy()),refresh);
    if(ren.getContext().getContextAttributes().antialias!==wantsAntialias())rebuildGL();
    measure(); visCalc(); emit('gfx', t);
  }
  const gfxName = () => graphics.preset==='custom'?'Custom ('+Q.tier+')':(Q.auto ? 'Auto (' + Q.tier[0].toUpperCase() + Q.tier.slice(1) + ')' : Q.tier[0].toUpperCase() + Q.tier.slice(1));
  function gfxSet(want) { // 'auto' | 'low' | 'medium' | 'high', saved for next time
    graphics=graphicsDefaults(QN.includes(want)?want:'auto');ls.set('jhp_hs_graphics',graphics);
    Q.renderScale=1;Q.f.n=0;Q.f.t=0;lastR=0;goodBudget=0;
    Q.want = want; Q.auto = !QN.includes(want); ls.set('jhp_hs_gfx', want);
    setTier(Q.auto ? Q.guess : want, true); if (Q.auto) Q.probe = performance.now() + 2000;
    const lbl = document.getElementById('smGfx'); if (lbl) lbl.lastChild.textContent = 'Room graphics: ' + gfxName();
  }
  function graphicsGet(){return{...graphics,tier:Q.tier,actualAntialias:!!ren.getContext().getContextAttributes().antialias,actualScale:graphics.scale*Q.renderScale,pixelRatioActual:Q.pixelRatio}}
  function graphicsSet(patch){
    if(patch&&['auto','low','medium','high'].includes(patch.preset)){gfxSet(patch.preset);screenEffort();emit('graphics-options',graphicsGet());return graphicsGet()}
    graphics=cleanGraphics({...graphics,...patch,preset:'custom'},graphics);Q.auto=false;Q.want=Q.tier;Q.probe=0;Q.renderScale=1;Q.f.n=Q.f.t=0;lastR=0;goodBudget=0;
    ls.set('jhp_hs_gfx',Q.want);ls.set('jhp_hs_graphics',graphics);setTier(Q.tier,true);screenEffort();emit('graphics-options',graphicsGet());return graphicsGet();
  }
  function gfxNext() { const o = ['auto', 'low', 'medium', 'high'], i = o.indexOf(Q.auto ? 'auto' : Q.tier); gfxSet(o[(i + 1) % 4]); ui.toast('Graphics: ' + gfxName(), Q.auto ? 'Picked for this computer (press G to change)' : 'Press G to change'); }
  let anyFront = false;
  function renderLit(renderer) {
    windowProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);windowFrustum.setFromProjectionMatrix(windowProjection);
    const drawnRooms=new Set([...visSet].filter(id=>window.House?.god||!windowOnly.has(id)||windowOnly.get(id).some(b=>!b||windowFrustum.intersectsBox(b))));
    const roomGroups=new Set(Object.values(ROOMS).map(r=>r.group)),doorGroups=new Map();
    for(const d of Object.values(DOORS)){const data={owner:d.lightRoom||d.rooms[0],rooms:d.rooms};if(d.pivot)doorGroups.set(d.pivot,data);if(d.frame)doorGroups.set(d.frame,data);}
    const nodes=[],owners=new Set();
    for(const r of Object.values(ROOMS)){const on=r.group.visible&&drawnRooms.has(r.id);nodes.push({obj:r.group,on,restore:r.group.visible,owner:r.id});if(on)owners.add(r.id)}
    for(const [obj,{owner,rooms}]of doorGroups){const on=obj.visible&&rooms.some(id=>drawnRooms.has(id));nodes.push({obj,on,restore:obj.visible,owner});if(on)owners.add(owner)}
    const extraOwner=cur&&cur.id;
    for(const obj of root.children)if(!roomGroups.has(obj)&&!doorGroups.has(obj)&&!obj.isLight&&obj!==sun.target){nodes.push({obj,on:obj.visible,owner:extraOwner});if(obj.visible)owners.add(extraOwner)}
    for(const obj of scene.children)if(obj!==root&&!obj.isLight){nodes.push({obj,on:obj.visible,owner:extraOwner});if(obj.visible)owners.add(extraOwner)}
    const materials=new Map();scene.traverseVisible(o=>{for(const m of o.material?[].concat(o.material):[])if(!materials.has(m))materials.set(m,m.visible)});
    const clear=renderer.autoClear,update=scene.autoUpdate,autoReset=renderer.info.autoReset,background=scene.background;
    // Update static/dynamic transforms once, not once per room. Only the small
    // reused light rig changes during the passes; the depth buffer is shared.
    scene.updateMatrixWorld(true);scene.autoUpdate=false;renderer.autoClear=false;renderer.info.autoReset=false;renderer.info.reset();
    renderer.clear(true,true,true);
    const ids=[...owners].filter(id=>ROOMS[id]);
    const distance=id=>{const r=ROOMS[id],a=r.area[0]||[P.x,P.z,P.x,P.z];return Math.hypot((a[0]+a[2])/2-P.x,(a[1]+a[3])/2-P.z)};
    try {
      // All opaque surfaces first. Otherwise a translucent door/window in one
      // room would blend against black instead of the room behind its glass.
      for(const transparent of [false,true]){
        for(const [m,on]of materials)m.visible=on&&!!m.transparent===transparent;
        const order=transparent?ids.slice().sort((a,b)=>distance(b)-distance(a)):ids;
        for(const id of order){
          // The sky is drawn once, behind every room, never over the PC/front
          // canvas and never again in a later room's lighting pass.
          scene.background=renderer===ren&&!transparent&&id===ids[0]?background:null;
          for(const n of nodes)n.obj.visible=n.on&&n.owner===id;
          applyRoomRig(ROOMS[id]);renderer.render(scene,camera);
        }
      }
    } finally {
      for(const n of nodes)n.obj.visible=n.restore??n.on;
      for(const [m,on]of materials)m.visible=on;
      scene.background=background;renderer.autoClear=clear;scene.autoUpdate=update;renderer.info.autoReset=autoReset;
    }
  }
  function backgroundCovered(){return !!((monitor&&desktopFull)||(window.RoomTV?.open_&&RoomTV.lockIn())||[...SURF].some(s=>s.screen&&s.locked))}
  let backgroundHidden=false;
  function render() {
    const covered=backgroundCovered();
    if(covered!==backgroundHidden||cv.style.display!==(covered?'none':'')){backgroundHidden=covered;cv.style.display=covered?'none':'';cv2.style.display=covered?'none':''}
    if(covered){if(stood||monitor)glassFit();for(const sf of SURF)placeSurf(sf);return}
    glCam(P.x, P.y, P.z, P.rx, P.ry);
    if (mode !== 'follow' && mode !== 'off') cssCam();
    pcVis(); tickPropShadows();
    // things in front of the PC (and the one in your hands) go on the canvas above it
    let front = false; for (const id in THINGS) { const t = THINGS[id]; if (t.obj.parent && t.obj.parent.parent && t.obj.parent.parent.visible) layerFor(t); if (t.front && t.obj.visible) front = true; }
    const ly = pcOn ? 1 : 0; for (const f of frontFx) { if (f.userData.ly !== ly) { f.userData.ly = ly; f.traverse(o => o.layers.set(ly)); } if (f.visible && pcOn) front = true; }
    camera.layers.set(0); renderLit(ren);
    if (front || anyFront) {
      if (!ren2) { ren2 = new T.WebGLRenderer({ canvas: cv2, antialias: wantsAntialias(), alpha: true, premultipliedAlpha: true }); ren2.setClearColor(0x000000, 0); ren2.localClippingEnabled = true; measure(); }
      if (cv2.parentNode !== frontHost()) frontHost().appendChild(cv2);
      camera.layers.set(1); renderLit(ren2); camera.layers.set(0);
      anyFront = front;
    }
    if (stood || monitor) glassFit();
    for (const sf of SURF) placeSurf(sf);
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
    glideTo(monitorPose, { lock: true, ms: 950 });
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
    if (Q.auto) Q.probe = performance.now() + 2000;
    if (!ls.get('jhp_hs_walkhint', 0) && mode === 'walk') setTimeout(() => { if (mode !== 'walk' || ls.get('jhp_hs_walkhint', 0)) return; ls.set('jhp_hs_walkhint', 1); ui.say('Have a look round', '<b>W A S D</b> to walk, mouse to look. Shift to jog, <b>C</b> to crouch, Space to jump. <b>F</b> to use or play, <b>E</b> to pick up/remove/place, <b>F</b> also looks closely at objects; click their controls to use them. Click to place; <b>Esc</b>: game menu, settings and put back. <b>G</b>: graphics.', 9000); }, 1400);
    emit('start');if(BOOT!=='wake'||stood)setTimeout(resumeSeat,0);
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
  function saveWalkState() { if(mode==='focus'&&focusS?.o.seatId)ls.set('jhp_hs_furniture_seat',{id:focusS.o.seatId,back:focusS.back,rx:P.rx,ry:P.ry});if(live&&saveT&&(!window.AccountGate||AccountGate.allowed))saveThings(true);savePose();saveStood(); }
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
  function putAway(){unlock();if(focusS?.o.seatId){focusS=null;html.classList.remove('hs-focus');ui.focusBar(null);}if(held)putBack(); glide = null; for (const k in keys) keys[k] = false; ui.hush(); ui.tip(null); setHot(null); }
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
    html.classList.toggle('pc-desktop-full',monitor&&desktopFull);if(live){glassFit();dirty();if(changed)dispatchEvent(new Event('resize'))}return desktopFull;
  }
  function pauseControls(on){controlsPaused=!!on;window.Sound?.worldPause?.(on);if(AC&&OUT)OUT.gain.setTargetAtTime(on?0:.5,AC.currentTime,.012);for(const k in keys)keys[k]=false;W.vx=W.vz=0;PT.clear();if(inspection){inspection.drag=null;}if(on){unlock();setHot(null);ui.tip(null)}else wantLock();dirty();}
  // Fit the entire 4:3 glass with room for its curved bezel at every aspect.
  function monitorPose() {
    const g = window.House && House.pcGL, gl = g && g.userData.glass;
    const centre=monitorCentre();
    const width = gl && gl.w || GW, height = width * 3/4;
    const availableW=vw,availableH=vh;
    const distance = Math.max(width * PERSP * em / (availableW * .88), height * PERSP * em / (availableH * .82));
    return { x: centre.x, y: centre.y, z: centre.z + distance, rx: 0, ry: 0, seat: 1, lvl: 'U' };
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
    const t0 = performance.now(), ms = now ? 0 : 1100;
    sfx.tone(120, 0.3, 'sine', 0.05);
    anims.set('stand', n => {
      const k = ms ? Math.min(1, (n - t0) / ms) : 1, e = ease(k);
      P.x = lerp(from.x, sp.x, e); P.y = lerp(from.y, sp.y, e); P.z = lerp(from.z, sp.z, e); P.rx = lerp(from.rx, sp.rx, e); P.ry = from.ry + angd(from.ry, sp.ry) * e;
      if (k < 1) return true;
      standing = false; setWalkFrom(sp); setMode('walk'); stIdx = nearestStation(); ui.where();
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
    glideTo(monitorPose, { lock: true, ms: 900, done: finishSit });
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
  function glassFit() {
    const full=monitor&&desktopFull,now=performance.now(),g0=window.House&&House.pcGL;
    const key=[mode,monitor,stood,full,vw,vh,P.x,P.y,P.z,P.rx,P.ry,g0?.matrixWorld.elements.join(',')].join('|');
    if(glass.fitKey===key&&(monitor||now-glass.checkedAt<150))return;
    const moved=glass.fitKey!==key;glass.fitKey=key;
    const logicalW=full?'100%':'1024px',logicalH=full?'100%':'768px';if(monitorSurfaceEl.style.width!==logicalW)monitorSurfaceEl.style.width=logicalW;if(monitorSurfaceEl.style.height!==logicalH)monitorSurfaceEl.style.height=logicalH;
    html.classList.toggle('pc-desktop-full',full);
    if(full){monitorSurfaceEl.style.visibility='';monitorSurfaceEl.style.clipPath='';monitorSurfaceEl.style.transform='none';return;}
    // the glass is taken from the WebGL monitor itself (rm-room.js's pcGL: wherever it was built), in the engine's own y-down frame
    const g = House.pcGL, gl = g && g.userData.glass; let cx, cy, z = 0.05, glassMatrix = null;
    if (gl) { glassMatrix = new T.Matrix4().copy(House.root.matrixWorld).invert().multiply(g.matrixWorld); const o = new T.Vector3(gl.x, gl.y, gl.z).applyMatrix4(glassMatrix); cx = o.x; cy = o.y; z = o.z + 0.01; } else { const L = Lb(); cx = L.mx; cy = GY; }
    const sw = monitor || stood ? 1024 : vw, sh = monitor || stood ? 768 : vh;
    const screenW = gl && gl.w || 29.2, screenH = screenW * 3 / 4;
    const w = screenW / 2, h = screenH / 2;
    // the page keeps its shape and covers the glass (the spare is trimmed off by the clip)
    const cw = w, ch = h;
    const q = [[-cw,-ch],[cw,-ch],[cw,ch],[-cw,ch]].map(([dx,dy]) => {
      if (!glassMatrix) return toScreen(cx+dx,cy+dy,z);
      const p = new T.Vector3(gl.x+dx,gl.y+dy,gl.z+.01).applyMatrix4(glassMatrix);
      return toScreen(p.x,p.y,p.z);
    });
    if(q.some(p=>!p)||q.every(p=>p.x< -4)||q.every(p=>p.x>vw+4)||q.every(p=>p.y< -4)||q.every(p=>p.y>vh+4)){monitorSurfaceEl.style.visibility='hidden';return;}
    if (now-glass.checkedAt>=150 || glass.hid == null || glass.mode!==mode || Math.hypot(P.x-(glass.eyeX??P.x),P.y-(glass.eyeY??P.y),P.z-(glass.eyeZ??P.z))>20) {
      let hid = P.z < z + 2;
      if (!hid && !monitor) { const c = toScreen(cx, cy, z); if (c) { const distance=Math.hypot(P.x-cx,P.y-cy,P.z-z),h = pick(c.x, c.y, { skip: isThingMesh,far:Math.max(6,distance-8) }); hid = !!h && h.spot !== 'pc' && h.dist < distance - 8; } }
      glass.hid = hid;glass.checkedAt=now;glass.mode=mode;glass.eyeX=P.x;glass.eyeY=P.y;glass.eyeZ=P.z;
    }
    if (glass.hid) { monitorSurfaceEl.style.visibility = 'hidden'; return; }
    monitorSurfaceEl.style.visibility = '';
    if(!moved&&glass.fittedKey===key)return;
    let m = homography(sw, sh, q);
    monitorSurfaceEl.style.transform = 'matrix3d(' + m.map(v => +v.toFixed(8)).join(',') + ')';
    monitorSurfaceEl.style.clipPath = '';glass.fittedKey=key;
  }
  // rect (0,0)-(w,h) onto the quad q (tl, tr, br, bl), as a column-major matrix3d
  function homography(w, h, q) {
    const [x0, y0] = [q[0].x, q[0].y], [x1, y1] = [q[1].x, q[1].y], [x2, y2] = [q[2].x, q[2].y], [x3, y3] = [q[3].x, q[3].y];
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, hh = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
    // unit square -> quad: [a b c; d e f; g hh 1]; then scale the page to the unit square
    const A = a / w, B = b / h, D = d / w, E = e / h, G = g / w, H = hh / h;
    return [A, D, 0, G, B, E, 0, H, 0, 0, 1, 0, c, f, 0, 1];
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
  // Start > Stand up (at the top, where you'll see it), and Start > Room graphics
  function startItems() {
    const sm = document.getElementById('startMenu'), first = sm && sm.querySelector('button'); if (!first || document.getElementById('smStand')) return;
    const item = (id, svg, text, fn) => { const b = document.createElement('button'); b.id = id; b.setAttribute('role', 'menuitem'); b.innerHTML = svg; b.appendChild(document.createTextNode(text)); b.addEventListener('click', ev => { ev.stopPropagation(); sm.classList.remove('open'); const sb = document.getElementById('startBtn'); if (sb) sb.classList.remove('on'); fn(); }); sm.insertBefore(b, first); return b; };
    item('smStand', standBtn.innerHTML.replace('width="16" height="16"', 'width="32" height="32"'), 'Stand up (the PC stays on)', () => { if (canStand()) standUp(); });
    item('smGfx', '<svg viewBox="0 0 16 16" width="32" height="32" shape-rendering="crispEdges" aria-hidden="true"><path fill="#000" d="M1 2h14v10H1z"/><path fill="#c0c0c0" d="M2 3h12v8H2z"/><path fill="#008080" d="M3 4h10v6H3z"/><path fill="#ffd84a" d="M4 8h2v1H4zM7 6h2v3H7zM10 5h2v4h-2z"/><path fill="#808080" d="M6 12h4v2H6zM4 14h8v1H4z"/></svg>', 'Room graphics: ' + gfxName(), () => { gfxNext(); });
  }
  // the first time you're sat at the desktop: how to get up
  function standHint() {
    if (ls.get('jhp_hs_standhint', 0) || stood) return; ls.set('jhp_hs_standhint', 1);
    const b = document.createElement('div'); b.className = 'hs-standtip'; b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:6px;bottom:36px;z-index:30000;max-width:250px;padding:8px 26px 8px 10px;background:#ffffe1;color:#000;border:1px solid #000;font:11px Tahoma,Verdana,sans-serif;box-shadow:2px 2px 0 rgba(0,0,0,.35);cursor:pointer';
    b.innerHTML = '<b>Want a look round your room?</b><br>Press Q to lean back and walk around. The PC stays on. Walk back and press F at the monitor to sit down. F2, the chair button and Esc &gt; Back to the room also work.<span style="position:absolute;right:6px;top:4px;font-weight:700">&times;</span>';
    b.addEventListener('click', () => b.remove()); monitorSurfaceEl.appendChild(b); setTimeout(() => b.remove(), 14000);
  }
  // a refresh while standing up: the PC wakes up as normal, and we stand straight back up
  // (and back after 10 hours or more with the PC left on: you come back into the room, the PC still on; sit down to carry on)
  const unhideStand = () => { html.classList.remove('pc-standwake'); if (live) { try { dirty(); render(); } catch (e) {} } }; setTimeout(unhideStand, 4000); setTimeout(unhideStand, 9000); // (failsafe: if the room never says it's ready, show it anyway and force a render)
  // ---- watchdog: the room "goes black" on some real PCs (canvas hidden / context lost / draws nothing / something over it): notice, repair, log
  let wdBlack = 0, wdSent = false;
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
      const lit = wdSample();
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
        const restored = () => { window.House.off('stood', restored); restorePose(s && s.p); dirty(); unhideStand(); };
        window.House.on('stood', restored);
        if (!standUp(true)) { window.House.off('stood', restored); unhideStand(); }
      } catch (e) { console.error(e); unhideStand(); }
      if (away) setTimeout(() => ui.say('You left the PC on', 'Your stuff is still on the screen. Click the monitor to sit back down.', 7000), 400);
    };
    setTimeout(go, window.JHPStood ? 0 : 1600);
  });

  // ================================================================ resizing, rotating, the tab going away
  addEventListener('resize', () => { if (!live) return; measure(); if (monitor) Object.assign(P, monitorPose()); else if (mode === 'walk' && W.seat && Math.abs(P.ry - seatPose().ry) < 1) { Object.assign(P, seatPose()); } dirty(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { lastT = 0; dirty(); } else { saveWalkState(); for (const k in keys) keys[k] = false; unlock(); } });

  // ================================================================ the API
  window.House = {
    ok: true, T, K, scene, root, camera, ren, P, W, LV, ROOMS, DOORS, SPOTS, THINGS, SNAPS, OPEN, sfx, ui,
    focus, unfocus, surface, faceQuad, inspect, endInspect, get focused() { return !!focusS; },
    room, buildRoom, door, setDoor, walkRect, block, stairs, support, spot, unspot, thing, snap: snapDef, openable, toggle, tidy,
    restoreThing, saveThings, saveWalkState, layerFor, frontFx, place,
    grab, drop, putBack, interact, suspendGrip, restoreGrip, resumeLook:wantLock, get seated(){return focusS?.o.seatId||focusS?.parent?.o.seatId||null;}, held: () => held && held.id, placement:()=>held&&THINGS[held.id].floorOnly?floorAim(THINGS[held.id]):null, act: id => act(SPOTS[id]), useAt,
    glideTo, goStation, cancelGlide, viewFor, setWalkFrom, seatPose, sitOn, resumeSeat, fillPose, get gliding() { return !!glide; },
    toScreen, viewZ, pick, rayAt, fwd,
    on(ev, fn) { (EVS[ev] = EVS[ev] || []).push(fn); }, off(ev, fn) { const a = EVS[ev] || []; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); }, emit,
    say: (t, x, ms) => ui.say(t, x, ms), toast: (t, x) => ui.toast(t, x), hush: () => ui.hush(),
    dirty, relight, ambient, anims, visCalc, start, standUp, sitDown, canStand, monitor: monitorDesktop, bootPC, shutdownPC, finishShutdown,
    desktopDisplay,surfaceScreen,pauseControls,crouchSetting,get paused(){return controlsPaused;},
    Q,graphicsGet,graphicsSet, gfx: gfxSet, get mode() { return mode; }, get live() { return live; }, get stood() { return stood; }, get screenEffort(){return stood&&!monitor?'background':'interactive';}, get here() { return cur && cur.id; }, get busy() { return !canAct(); },
    goRoom(id, st) { const r = ROOMS[id]; if (!r) return; buildRoom(r); const s = r.stations[st || 0]; if (s) { cur = r; visCalc(); stIdx = st || 0; glideTo(stationPose(r, s), { ms: 0 }); setWalkFrom(stationPose(r, s)); ui.where(); } },
    _: { movementState:()=>({keys:{...keys},velocity:[W.vx,W.vz],contacts:movementContacts(W.x,W.z,RAD+.05),floor:walkingFloor(W.x,W.z)}),doorHeadroom:(x,z,lvl,fy)=>lowDoorAt(x,z,lvl,RAD+18,fy)?.headroom||null, whyNotStand, setMode, rebuildGrids, cellOk, floorAt, grids, homography, glassFit, glass, seatPose, followCss, savedPose, finishSit, nearestStation, lightingSnapshot, get stIdx() { return stIdx; }, get glide() { return glide; }, get focusS() { return focusS; } },
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

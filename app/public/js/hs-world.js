/* hs-world: THE HOUSE ENGINE. Jack's house is a real 3D place (WebGL, three.js r128) you walk round: his bedroom, the landing,
 * the stairs, the hall, the lounge, the kitchen and the cupboard under the stairs. The family PC on Jack's desk is still
 * boot.js's CSS 3D model (with the power button, the fly-in and the BIOS hand-over): it's drawn on top of the WebGL room and
 * the two cameras are kept exactly in step (in "hold" mode we drive boot.js's camera, in "follow" mode we copy it).
 *
 *   walking: W A S D / arrow keys (Shift to hurry), drag to look, click or E to use or pick up, the joystick on touch screens
 *   stations: the arrows at the sides jump to the good views of the room you're in
 *   holding: click a thing to pick it up; it floats in front of you. Click to put it down where you're looking, wheel (or
 *            the +/- buttons) to move it nearer or further, R to turn it, Esc to put it back where it was
 *   the PC: press its power button (we sit down first), or with it on, "Stand up" (Esc held down, or the chair button on the
 *           desktop) and the monitor in the room shows the live desktop; click the monitor to sit back down
 * The content is built by js/rm-room.js (the bedroom: window.Room is the public API for other packs) and js/hs-house.js
 * (the rest of the house), with the kit in js/hs-kit.js. This file exports window.House (see the bottom). */
(function () {
  'use strict';
  const T = window.THREE, K = window.HouseKit;
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
  const touchy = () => !!(window.matchMedia && (matchMedia('(hover:none)').matches || matchMedia('(pointer:coarse)').matches));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const EVS = {}; const emit = (ev, ...a) => (EVS[ev] || []).slice().forEach(fn => { try { fn(...a); } catch (e) { console.error(e); } });

  // ================================================================ graphics quality: Low / Medium / High, picked for this machine (or chosen: G in the house,
  // or Start > Room graphics). Low: pixel ratio 1, no antialiasing, matte materials, 3 lights, only the room you're in and the next.
  const QN = ['low', 'medium', 'high'], PRMAX = { low: 1, medium: 1.5, high: 2 };
  const Q = (function () {
    const want = ls.get('jhp_hs_gfx', 'auto'), n = navigator;
    const mob = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(n.userAgent || '') || touchy();
    const mem = n.deviceMemory || 8, cores = n.hardwareConcurrency || 4, dpr = window.devicePixelRatio || 1;
    const t = mob || mem <= 2 || cores <= 2 ? 'low' : mem <= 4 || cores <= 4 || (dpr > 2 && screen.width * dpr > 3800) ? 'medium' : 'high';
    return { want, auto: !QN.includes(want), tier: QN.includes(want) ? want : t, guess: t, mob, fps: 0, gpu: '', f: { n: 0, t: 0, low: 0 }, probe: 0 };
  })();
  window.HouseQ = Q.tier;
  // ================================================================ the renderer (a canvas under boot.js's stage, one over it)
  let cv = document.createElement('canvas'); cv.className = 'hs-gl'; cv.setAttribute('aria-hidden', 'true');
  let ren;
  try {
    ren = new T.WebGLRenderer({ canvas: cv, antialias: Q.tier !== 'low', powerPreference: Q.tier === 'low' ? 'default' : 'high-performance', alpha: false });
    if (!ren.getContext()) throw new Error('no gl');
  } catch (e) { window.House = { ok: false }; return; }
  pb.insertBefore(cv, stage);
  try { // (a software renderer or a weak GPU: Low, whatever the rest of the machine says)
    const gl = ren.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info'); Q.gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    if (Q.auto && (/SwiftShader|llvmpipe|softpipe|Software|Mali-[34]|Adreno \(TM\) [345]\d\d|PowerVR SGX|GMA/i.test(Q.gpu) || ren.capabilities.maxTextureSize < 4096 || !ren.capabilities.floatFragmentTextures)) Q.tier = 'low';
    else if (Q.auto && Q.tier === 'high' && /Intel/i.test(Q.gpu) && !/Iris|Arc/i.test(Q.gpu)) Q.tier = 'medium';
  } catch (e) {}
  window.HouseQ = Q.tier;
  let cv2 = document.createElement('canvas'); cv2.className = 'hs-gl2'; cv2.setAttribute('aria-hidden', 'true');
  // (a lost WebGL context, e.g. too many tabs: keep the page alive and redraw when it comes back)
  let ctxLost = false;
  function hookCtx(c) {
    c.addEventListener('webglcontextlost', ev => { ev.preventDefault(); ctxLost = true; }, false);
    c.addEventListener('webglcontextrestored', () => { ctxLost = false; for (const k in K.MATS) K.MATS[k].needsUpdate = true; dirty(); }, false);
  }
  hookCtx(cv); hookCtx(cv2);
  // (the browser drops the oldest WebGL context when the PC's games have made too many: build a fresh renderer on a fresh canvas)
  function glLost() { try { return ctxLost || ren.getContext().isContextLost(); } catch (e) { return true; } }
  function rebuildGL() {
    try {
      const oc = cv, par = oc.parentNode, nc = document.createElement('canvas'); nc.className = oc.className; nc.setAttribute('aria-hidden', 'true');
      try { ren.dispose(); } catch (e) {}
      const nr = new T.WebGLRenderer({ canvas: nc, antialias: Q.tier !== 'low', powerPreference: Q.tier === 'low' ? 'default' : 'high-performance', alpha: false });
      if (!nr.getContext() || nr.getContext().isContextLost()) return false;
      nr.setClearColor(0x050404, 1); nr.localClippingEnabled = true;
      if (par) par.replaceChild(nc, oc);
      cv = nc; ren = nr; hookCtx(nc); ctxLost = false;
      if (window.House) window.House.ren = nr;
      if (ren2 || cv2.parentNode) { try { if (ren2) ren2.dispose(); } catch (e) {} const o2 = cv2, p2 = o2.parentNode; cv2 = document.createElement('canvas'); cv2.className = o2.className; cv2.setAttribute('aria-hidden', 'true'); hookCtx(cv2); if (p2) p2.removeChild(o2); ren2 = null; }
      K.setAniso(Math.min({ low: 1, medium: 4, high: 8 }[Q.tier], ren.capabilities.getMaxAnisotropy()));
      scene.traverse(o => { const ms = o.material ? [].concat(o.material) : []; for (const m of ms) { m.needsUpdate = true; for (const k in m) { const t = m[k]; if (t && t.isTexture) t.needsUpdate = true; } } });
      for (const k in K.MATS) K.MATS[k].needsUpdate = true;
      measure(); dirty(); return true;
    } catch (e) { console.error(e); return false; }
  }
  var ren2 = null; // (made the first time something has to be drawn in front of the PC)
  K.setAniso(Math.min({ low: 1, medium: 4, high: 8 }[Q.tier], ren.capabilities.getMaxAnisotropy()));
  ren.setClearColor(0x050404, 1);
  ren.localClippingEnabled = true;
  const scene = new T.Scene();
  const root = new T.Group(); root.scale.set(1, -1, 1); scene.add(root); // y is down in here (see hs-kit.js)
  const camera = new T.PerspectiveCamera(45, 1, 6, 4000); camera.matrixAutoUpdate = false; camera.layers.set(0);
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
    const pr = Math.min(window.devicePixelRatio || 1, PRMAX[Q.tier] || 1);
    ren.setPixelRatio(pr); ren.setSize(vw, vh, false);
    if (ren2) { ren2.setPixelRatio(pr); ren2.setSize(vw, vh, false); }
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
    const L = Lb(), a = L.ry * D2R, b = L.rx * D2R, dx = L.mx - L.fx, dy = GY - L.fy, dz = -L.fz;
    const x1 = dx * Math.cos(a) + dz * Math.sin(a), z1 = -dx * Math.sin(a) + dz * Math.cos(a);
    const t = [x1 + (L.ox || 0), L.oy + dy * Math.cos(b) - z1 * Math.sin(b), dy * Math.sin(b) + z1 * Math.cos(b)];
    const R = rot(L.rx, L.ry).clone().transpose(), v = new T.Vector3(-t[0], -t[1], PERSP - t[2]).applyMatrix4(R);
    return { x: L.mx + v.x, y: GY + v.y, z: 0.02 + v.z, rx: L.rx, ry: L.ry, seat: 1 };
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
  const LV = { U: 73, G: 353 }; // floor heights (y is down)
  function room(id, def) {
    const r = ROOMS[id] = Object.assign({ id, name: id, lvl: 'U', area: [], lights: [], stations: [], built: false, links: [] }, def);
    r.group = new T.Group(); r.group.name = id; r.group.visible = false; root.add(r.group);
    r.things = new T.Group(); r.group.add(r.things);
    r.supports = r.supports || []; r.walls = r.walls || null;
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
    if (d.pivot) { root.add(d.pivot); d.pivot.rotation.y = d.ang * d.swing * D2R * (d.dir || 1); } // (the leaf is drawn whenever either room is: see visCalc)
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
  function visCalc() { // the room you're in, and the rooms you can see into through open doors (and the ones they open onto)
    const vs = new Set(); if (cur) vs.add(cur.id);
    const walk = (r, depth) => { if (!r) return; for (const did of r.links) { const d = DOORS[did]; if (!d || !(d.open || d.ang > 0.01 || d.always)) continue; for (const o of d.rooms) if (!vs.has(o)) { vs.add(o); if (depth < (Q.tier === 'low' ? 0 : 1)) walk(ROOMS[o], depth + 1); } } };
    walk(cur, 0);
    if (cur && (cur.id === 'hall' || cur.id === 'landing' || cur.id === 'cupboard')) { vs.add('hall'); vs.add('landing'); } // (the stairwell joins them: a wrong guess can never black the view out)
    for (const id in ROOMS) { const r = ROOMS[id], on = vs.has(id); if (on) buildRoom(r); r.group.visible = on; }
    for (const id in DOORS) { const d = DOORS[id]; if (d.pivot) d.pivot.visible = d.rooms.some(o => vs.has(o)); }
    visSet = vs; lightsFor(); dirty();
  }
  function lightsFor() { // the nearest lights of the rooms on show get the five point lights
    const all = [];
    for (const id of visSet) { const r = ROOMS[id]; for (const l of (typeof r.lights === 'function' ? r.lights() : r.lights)) all.push(Object.assign({ room: id, d2: (l.x - P.x) ** 2 + (l.z - P.z) ** 2 + (id === (cur && cur.id) ? 0 : 1e5) }, l)); }
    all.sort((a, b) => a.d2 - b.d2);
    PL.forEach((pl, i) => { const l = all[i]; PS[i].t = l ? { key: l.room + ':' + (l.x | 0) + ',' + (l.z | 0), l } : null; }); // (targets only: tickLights eases to them, so crossing a doorway never pops)
    const r = cur; const amb = r && (typeof r.amb === 'function' ? r.amb() : r.amb);
    if (amb) { HT.sky.set(amb.sky); HT.gnd.set(amb.gnd); HT.i = amb.i; } else { HT.sky.set(0x8a90a8); HT.gnd.set(0x30261c); HT.i = 0.55; }
    const sl = r && (typeof r.sun === 'function' ? r.sun() : r.sun);
    if (sl) { sun.position.set(sl.x, sl.y, sl.z); sun.target.position.set(sl.tx || 0, sl.ty || 0, sl.tz || 0); sun.color.set(sl.c); HT.sun = sl.i; } else HT.sun = 0;
    tickLights(0);
  }
  const PS = PL.map(() => ({ key: null, cur: 0, tgt: 0, t: null })), HT = { sky: new T.Color(), gnd: new T.Color(), i: 0.55, sun: 0 };
  let lightSnap = true;
  function tickLights(dt) { // ease every light to its target over ~0.4 s (a light that changes identity fades out, then the slot is reused)
    const k = lightSnap ? 1 : Math.min(1, dt / 0.14); let moving = false;
    PL.forEach((pl, i) => { const s = PS[i], t = s.t;
      if (t && (s.key === t.key || s.cur < 0.02)) { const l = t.l; s.key = t.key; pl.position.set(l.x, l.y, l.z); pl.color.set(l.c || '#fff'); pl.distance = l.d || 400; pl.decay = 2; s.tgt = l.i == null ? 1 : l.i; } else s.tgt = 0;
      const d = s.tgt - s.cur; if (Math.abs(d) > 0.003) { s.cur += d * k; moving = true; } else s.cur = s.tgt; pl.intensity = s.cur; });
    hemi.color.lerp(HT.sky, k); hemi.groundColor.lerp(HT.gnd, k); const dh = HT.i - hemi.intensity, ds = HT.sun - sun.intensity;
    if (Math.abs(dh) > 0.003) { hemi.intensity += dh * k; moving = true; } else hemi.intensity = HT.i;
    if (Math.abs(ds) > 0.003) { sun.intensity += ds * k; moving = true; } else sun.intensity = HT.sun;
    if (dt > 0 && lightSnap) lightSnap = false; if (moving) dirty();
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
    const go = () => { if (!window.HouseRooms && performance.now() - t0 < 1500 && window.House && !warmed) return setTimeout(go, 100); prewarm(); warmed = 1; setTimeout(() => ui.fade(false, 400), 60); };
    setTimeout(go, 30); setTimeout(() => ui.fade(false, 400), 5000);
    setTimeout(prewarm, 4000); // (rooms that load lazily, warmed behind the scenes)
  }
  function relight() { lightsFor(); dirty(); }

  // ================================================================ walking: a grid per floor (5 cm cells), the stairs between them
  const GR = { x0: -360, z0: -600, cs: 5, nx: 180, nz: 360 }, RAD = 22;
  const grids = { U: null, G: null, dirty: true, walk: [], block: [], stairs: [] };
  function walkRect(lvl, x0, z0, x1, z1, o) { grids.walk.push(Object.assign({ lvl, x0, z0, x1, z1 }, o || {})); grids.dirty = true; }
  function block(lvl, x0, z0, x1, z1, o) { const b = Object.assign({ lvl, x0, z0, x1, z1 }, o || {}); grids.block.push(b); grids.dirty = true; return b; }
  function stairs(def) { grids.stairs.push(def); grids.dirty = true; } // { x0, z0, x1, z1, y(x, z) }
  function rebuildGrids() {
    grids.dirty = false;
    for (const lvl of ['U', 'G']) {
      const g = new Uint8Array(GR.nx * GR.nz);
      const mark = (x0, z0, x1, z1, v) => { const i0 = clamp(Math.floor((x0 - GR.x0) / GR.cs), 0, GR.nx - 1), i1 = clamp(Math.ceil((x1 - GR.x0) / GR.cs) - 1, 0, GR.nx - 1), j0 = clamp(Math.floor((z0 - GR.z0) / GR.cs), 0, GR.nz - 1), j1 = clamp(Math.ceil((z1 - GR.z0) / GR.cs) - 1, 0, GR.nz - 1); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g[j * GR.nx + i] = v; };
      for (const w of grids.walk) if (w.lvl === lvl && (!w.door || DOORS[w.door].open)) mark(w.x0, w.z0, w.x1, w.z1, 1);
      for (const b of grids.block) if (b.lvl === lvl && !b.off) mark(b.x0, b.z0, b.x1, b.z1, 0);
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
  const onStairs = (x, z) => grids.stairs.find(s => x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1);
  // the floor under (x, z) for someone standing at height y0 now (null: can't stand there)
  function floorAt(x, z, lvl, y0) {
    const s = onStairs(x, z); let best = null;
    const cands = [];
    const inX = s && x >= s.x0 + 10 && x <= s.x1 - 6, sy = inX ? s.y(x, z) : 0, mid = inX && z > s.m0 && z < s.m1; // (on the stairs: the ramp is the floor, bar the cupboard right under them)
    for (const L of [lvl, lvl === 'U' ? 'G' : 'U']) if (cellOk(L, x, z)) { if (mid && !(L === 'G' && LV.G - sy > 100)) continue; cands.push({ y: LV[L], lvl: L }); }
    if (inX) cands.push({ y: sy, lvl: sy < (LV.U + LV.G) / 2 ? 'U' : 'G' });
    for (const c of cands) if (Math.abs(c.y - y0) <= 45 && (!best || Math.abs(c.y - y0) < Math.abs(best.y - y0))) best = c;
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
  const THINGS = {}, SNAPS = {};
  let held = null; // { id, d (distance), ry (extra turn), from (where it was) }
  let saveT = 0;
  function thing(id, def) {
    const t = THINGS[id] = Object.assign({ id, kind: 'thing', label: id, st: 'rest', ry: 0, rx: 0, rz: 0, vy: 0 }, THINGS[id] || {}, def);
    const home = t.home; if (!t.at) t.at = Object.assign({}, home);
    if (!t.obj) t.obj = new T.Group();
    const r = ROOMS[t.at.room] || ROOMS[home.room];
    (r ? r.things : root).add(t.obj);
    // its size (the object is built with its bottom centre at the origin)
    const bb = new T.Box3().setFromObject(t.obj);
    t.hx = Math.max(1, (bb.max.x - bb.min.x) / 2); t.hz = Math.max(1, (bb.max.z - bb.min.z) / 2); t.h = Math.max(0.5, bb.max.y - bb.min.y);
    place(t);
    spot(id, Object.assign({ label: t.label, obj: t.obj, grab: true, range: t.range || 230 }, def.spot || {}));
    return t;
  }
  function place(t) { const a = t.at; t.obj.position.set(a.x, a.y, a.z); t.obj.rotation.set((t.rx || 0) * D2R, (a.ry || 0) * D2R, (t.rz || 0) * D2R, 'YXZ'); t.obj.visible = !a.hide; dirty(); }
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
    if (t.canGrab && !t.canGrab()) return false;
    const was = t.st === 'snap' ? t.snap : null;
    held = { id, d: clamp(t.holdD || 55, 30, 140), ry: 0, from: Object.assign({}, t.at), was, sx: t.at.x, sy: t.at.y, sz: t.at.z };
    if (was) { const sn = SNAPS[was]; t.snap = null; if (sn && sn.onUnsnap) try { sn.onUnsnap(t); } catch (e) { console.error(e); } emit('unsnap', was, id); }
    t.st = 'held'; t.at.hide = false; t.obj.visible = true;
    t.obj.traverse(o => o.layers.set(1));
    if (cur && t.obj.parent !== cur.things) cur.things.attach ? cur.things.add(t.obj) : 0;
    sfx.tone(520, 0.05, 'triangle', 0.05); sfx.tone(780, 0.05, 'triangle', 0.04, 0.05);
    ui.holdBar(t);
    emit('grab', id);
    return true;
  }
  function heldPos() { // where the held thing floats: in front of your eyes, never through a wall
    const t = THINGS[held.id], f = fwd();
    let d = held.d;
    const hit = pick(vw / 2 + (lastPt.ok && !touchy() ? (lastPt.x - vw / 2) * 0.0 : 0), vh / 2, { skip: m => m.userData.spot === held.id || isThingMesh(m), far: d + 30 });
    if (hit && hit.dist < d + Math.max(t.hx, t.hz)) d = Math.max(18, hit.dist - Math.max(t.hx, t.hz) - 2);
    return { x: P.x + f.x * d, y: P.y + f.y * d + t.h * 0.5 + 6, z: P.z + f.z * d };
  }
  const isThingMesh = m => { let o = m; while (o) { if (o.userData && o.userData.thing) return true; o = o.parent; } return false; };
  let aimPt = null, aimT = 0; // where the crosshair points (checked a few times a second while holding)
  function nearSnap(t, x, y, z) {
    let best = null;
    const now = performance.now();
    if (now - aimT > 120) { aimT = now; const h = pick(vw / 2, vh / 2, { skip: m => isThingMesh(m), far: 260 }); aimPt = h ? h.p : null; }
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
  function snapGlow(s) {
    if (!snapHi) {
      snapHi = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.35, depthWrite: false }));
      snapHi.layers.set(1); snapHi.renderOrder = 5; root.add(snapHi);
    }
    snapHi.visible = !!s;
    if (s) { snapHi.position.set(s.x, s.y, s.z); const b = s.box || [s.r * 0.9, 1.5, s.r * 0.9]; snapHi.scale.set(b[0], b[1], b[2]); snapHi.rotation.y = (s.ry || 0) * D2R; }
  }
  // put the held thing down: where you're looking (a surface), into a snap, or let it drop
  function drop(sx, sy) {
    if (!held) return; const t = THINGS[held.id], hp = heldPos();
    const sn = nearSnap(t, hp.x, hp.y, hp.z);
    if (sn) return snapIn(t, sn);
    let tgt = null;
    const hit = pick(sx == null ? vw / 2 : sx, sy == null ? vh / 2 : sy, { skip: m => isThingMesh(m) && m.userData.spot === held.id, far: 400 });
    if (hit && hit.n && hit.n.y > 0.6 && cur) { // a flat-ish surface you're pointing at (three's normals are y-up)
      const r = roomOfPoint(hit.p) || cur;
      const x = clamp(hit.p.x, r.bx0 + t.hx, r.bx1 - t.hx), z = clamp(hit.p.z, r.bz0 + t.hz, r.bz1 - t.hz);
      tgt = { room: r.id, x, z, y0: hit.p.y - 0.5 };
    }
    if (!tgt) { const r = roomOfPoint(hp) || cur; tgt = { room: r.id, x: clamp(hp.x, r.bx0 + t.hx, r.bx1 - t.hx), z: clamp(hp.z, r.bz0 + t.hz, r.bz1 - t.hz), y0: hp.y }; }
    const y = landY(tgt.room, tgt.x, tgt.z, tgt.y0, t);
    const startY = Math.min(hp.y, y - 0.5); // (it drops from where it is, or is set straight down)
    held = null; ui.holdBar(null); snapGlow(null);
    t.st = 'fall'; t.vy = 0; t.at = { room: tgt.room, x: tgt.x, y: startY, z: tgt.z, ry: (t.obj.rotation.y / D2R) };
    t.landY = y; t.fromX = hp.x; t.fromZ = hp.z; t.t0 = performance.now();
    moveTo(t, tgt.room);
    emit('place', t.id);
  }
  function roomOfPoint(p) { for (const id of visSet) { const r = ROOMS[id]; if (r.area.some(a => p.x >= a[0] - 1 && p.x <= a[2] + 1 && p.z >= a[1] - 1 && p.z <= a[3] + 1) && Math.abs((p.y || LV[r.lvl]) - LV[r.lvl]) < 290) return r; } return null; }
  function moveTo(t, rid) { const r = ROOMS[rid]; if (r && t.obj.parent !== r.things) r.things.add(t.obj); }
  function snapIn(t, s) {
    held = null; ui.holdBar(null); snapGlow(null);
    const p0 = { x: t.obj.position.x, y: t.obj.position.y, z: t.obj.position.z, ry: t.obj.rotation.y / D2R, rx: t.obj.rotation.x / D2R, rz: t.obj.rotation.z / D2R };
    const p1 = s.pose || { x: s.x, y: s.y, z: s.z, ry: s.ry || 0 };
    t.st = 'anim'; const t0 = performance.now(), ms = 380;
    anims.set('snap:' + t.id, n => {
      const k = ease(Math.min(1, (n - t0) / ms));
      t.obj.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, p1.y, k), lerp(p0.z, p1.z, k));
      t.obj.rotation.set(lerp(p0.rx, p1.rx || 0, k) * D2R, (p0.ry + angd(p0.ry, p1.ry || 0) * k) * D2R, lerp(p0.rz, p1.rz || 0, k) * D2R, 'YXZ');
      if (k < 1) return true;
      t.st = 'snap'; t.snap = s.id; t.at = { room: s.room || (cur && cur.id), x: p1.x, y: p1.y, z: p1.z, ry: p1.ry || 0, hide: !!s.hide };
      t.rx = p1.rx || 0; t.rz = p1.rz || 0;
      if (s.hide) t.obj.visible = false;
      layerFor(t);
      sfx.tone(300, 0.06, 'square', 0.05); sfx.noise(0.08, 0.06, 1200);
      if (s.onSnap) try { s.onSnap(t); } catch (e) { console.error(e); }
      emit('snap', s.id, t.id); saveThings();
      return false;
    });
  }
  function putBack() { // Esc: it goes back where you got it from
    if (!held) return; const t = THINGS[held.id], f = held.from, was = held.was;
    held = null; ui.holdBar(null); snapGlow(null);
    if (was && SNAPS[was]) { t.at = f; return snapIn(t, SNAPS[was]); }
    t.st = 'fall'; t.at = Object.assign({}, f, { y: f.y - 3 }); t.landY = f.y; t.vy = 0; moveTo(t, f.room);
  }
  // things in front of boot.js's PC (as you see it now) are drawn on the second canvas, over it; so is whatever you're holding
  function pcParts() { const L = Lb(); return [[L.mx - 19, -40, -19, L.mx + 19, 0, 1], [L.tx - 10, -42.3, L.tz - 17, L.tx + 10, 0, L.tz + 19], [L.kx - 15, -3.5, 6, L.kx + 15, 0, 17.5], [L.ux - 7, -3, L.uz - 8, L.ux + 7, 0, L.uz + 8]]; }
  function scrBox(x0, y0, z0, x1, y1, z1) {
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9, dd = 0, n = 0;
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) { const p = toScreen(x, y, z); if (!p) return null; a = Math.min(a, p.x); b = Math.min(b, p.y); c = Math.max(c, p.x); d = Math.max(d, p.y); dd += p.d; n++; }
    return { a, b, c, d, dep: dd / n };
  }
  function frontOf(t) {
    if (t.st === 'held') return true;
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
  function layerFor(t) { const f = frontOf(t); if (f === t.front) return; t.front = f; t.obj.traverse(o => o.layers.set(f ? 1 : 0)); }
  function tickThings(dt) {
    let any = false;
    for (const id in THINGS) {
      const t = THINGS[id];
      if (t.st === 'held' && held && held.id === id) {
        const hp = heldPos(), o = t.obj.position, k = 1 - Math.pow(0.0005, dt); // a little lag: it trails your view
        o.x += (hp.x - o.x) * k; o.y += (hp.y - o.y) * k; o.z += (hp.z - o.z) * k;
        const want = P.ry * -1 + held.ry + (t.faceYou ? 180 : 0), r0 = t.obj.rotation.y / D2R;
        t.obj.rotation.set(Math.sin(performance.now() / 700) * 0.04, (r0 + angd(r0, want) * k) * D2R, Math.sin(performance.now() / 900) * 0.03, 'YXZ');
        const sn = nearSnap(t, o.x, o.y, o.z); snapGlow(sn); ui.snapHint(sn);
        any = true;
      } else if (t.st === 'fall') {
        const a = t.at, now = performance.now();
        t.vy += 1800 * dt; a.y += t.vy * dt;
        // (slide the last bit from where it was held to where it lands)
        const sk = Math.min(1, (now - t.t0) / 240); t.obj.position.x = lerp(t.fromX == null ? a.x : t.fromX, a.x, ease(sk)); t.obj.position.z = lerp(t.fromZ == null ? a.z : t.fromZ, a.z, ease(sk));
        if (a.y >= t.landY) { a.y = t.landY; if (t.vy > 160) { t.vy = -t.vy * 0.22; sfx.noise(0.05, 0.08, 500); } else { t.vy = 0; if (sk >= 1) { t.st = 'rest'; t.fromX = t.fromZ = null; layerFor(t); saveThings(); emit('rest', id); } } }
        t.obj.position.y = a.y;
        const r = t.obj.rotation; r.x *= 0.8; r.z *= 0.8;
        any = true;
      }
      // anything that has fallen out of the world goes home
      if (t.st === 'rest' && (!ROOMS[t.at.room] || t.at.y > LV[ROOMS[t.at.room].lvl] + 30)) { t.at = Object.assign({}, t.home); place(t); moveTo(t, t.home.room); }
    }
    return any;
  }
  function saveThings() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      const st = {};
      for (const id in THINGS) { const t = THINGS[id]; if (t.noSave) continue; const a = t.at; st[id] = [a.room, +a.x.toFixed(1), +a.y.toFixed(1), +a.z.toFixed(1), Math.round(a.ry || 0), t.st === 'snap' ? t.snap : 0, a.hide ? 1 : 0]; }
      const op = {}; for (const id in OPEN) if (OPEN[id].open) op[id] = 1;
      try { if (window.Apps && Apps.saveGame) Apps.saveGame('hs.things', { t: st, o: op }, { v: 1 }); else ls.set('jhp_hs_things', { t: st, o: op }); } catch (e) {}
    }, 600);
  }
  let loaded = null;
  function loadThings() {
    if (loaded) return loaded;
    try { loaded = (window.Apps && Apps.loadGame && Apps.loadGame('hs.things', 1)) || ls.get('jhp_hs_things', null) || { t: {}, o: {} }; } catch (e) { loaded = { t: {}, o: {} }; }
    return loaded;
  }
  function restoreThing(t) { // where this visitor left it last time
    const s = loadThings().t[t.id]; if (!s || !ROOMS[s[0]]) return;
    t.at = { room: s[0], x: s[1], y: s[2], z: s[3], ry: s[4], hide: !!s[6] };
    if (s[5] && SNAPS[s[5]]) { t.st = 'snap'; t.snap = s[5]; } else t.st = 'rest';
    moveTo(t, t.at.room); place(t); layerFor(t);
  }
  function tidy(rid) { // everything back where it lives (Mom tidied up)
    for (const id in THINGS) { const t = THINGS[id]; if (rid && t.home.room !== rid && t.at.room !== rid) continue; if (held && held.id === id) { held = null; ui.holdBar(null); } t.st = t.home.snap ? 'snap' : 'rest'; t.snap = t.home.snap || null; t.at = Object.assign({}, t.home); moveTo(t, t.home.room); place(t); layerFor(t); }
    saveThings(); dirty();
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
    if (o.sound !== false) { if (o.type === 'slide') sfx.noise(0.25, 0.05, 700, 0, 'bandpass', 300); else sfx.tone(o.open ? 160 : 120, 0.12, 'triangle', 0.05); }
    if (o.onToggle) try { o.onToggle(o.open); } catch (e) { console.error(e); }
    emit('open', id, o.open); saveThings();
  }

  // ================================================================ sound (only with the site's SFX switched on)
  let AC = null, OUT = null, NB = null;
  function ac() { if (!window.Sound || !Sound.on) return null; if (!AC) { try { AC = Sound.unlock && Sound.unlock(); } catch (e) { AC = null; } if (!AC) return null; OUT = AC.createGain(); OUT.gain.value = 0.5; OUT.connect(AC.destination); } if (AC.state === 'suspended') AC.resume(); return AC; }
  const sfx = {
    tone(f, d, type, vol, when, to) { const c = ac(); if (!c || !(f > 0)) return; const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + d); g.gain.setValueAtTime(vol == null ? 0.1 : vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d); o.connect(g); g.connect(OUT); o.start(t); o.stop(t + d + 0.03); },
    noise(d, vol, f, when, type, to) { const c = ac(); if (!c) return; const t = c.currentTime + (when || 0); if (!NB) { NB = c.createBuffer(1, c.sampleRate, c.sampleRate); const a = NB.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; } const s = c.createBufferSource(); s.buffer = NB; const fl = c.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(f || 2000, t); if (to) fl.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + d); const g = c.createGain(); g.gain.setValueAtTime(vol == null ? 0.1 : vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d); s.connect(fl); fl.connect(g); g.connect(OUT); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.03); },
    ac,
  };
  function sfxDoor(open) { sfx.noise(0.35, 0.06, open ? 500 : 380, 0, 'bandpass', open ? 900 : 200); if (!open) sfx.tone(90, 0.12, 'sine', 0.12, 0.3); }
  let stepSide = 0;
  function sfxStep(stair) { stepSide ^= 1; sfx.noise(0.07, stair ? 0.07 : 0.035, stair ? 520 : 260 + stepSide * 40); if (stair && Math.random() < 0.25) sfx.tone(180 + Math.random() * 60, 0.18, 'sawtooth', 0.012, 0.02, 140); }

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
    W.x = p.x; W.z = p.z; W.lvl = lvl;
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
  const canAct = () => live && (mode === 'walk' || mode === 'glide') && !viewOpen();
  const viewOpen = () => !!pb.querySelector(':scope > .rm-view') || !!(ui.el && ui.el.querySelector('.hs-modal.on'));

  // ================================================================ which room you're in
  function roomCheck() {
    let r = roomAt(W.x, W.z, W.lvl) || cur;
    { const st = onStairs(W.x, W.z); // (height counts: on the stairs, or above the cupboard's ceiling, you're in the hall/landing, never the cupboard)
      if (st && W.x >= st.x0 && W.x <= st.x1 && (W.fy < LV.G - 20 || (r && r.id === 'cupboard' && W.fy < LV.G - 20))) r = ROOMS[W.fy < (LV.U + LV.G) / 2 ? 'landing' : 'hall'] || r;
      else if (r && r.id === 'cupboard' && W.fy < LV.G - 20) r = ROOMS.hall || r; }
    if (r !== cur) { const old = cur; cur = r; buildRoom(r); if (held && THINGS[held.id]) { r.things.add(THINGS[held.id].obj); THINGS[held.id].at.room = r.id; } visCalc(); stIdx = nearestStation(); ui.where(); if (!W.seat) W.eye = (r && r.eye) || STAND; emit('room', r && r.id, old && old.id); } // (what you're carrying comes with you)
  }

  // ================================================================ moving: keys, the joystick, drag to look
  const keys = {};
  const KEYMOVE = { w: 'f', W: 'f', ArrowUp: 'f', s: 'b', S: 'b', ArrowDown: 'b', a: 'l', A: 'l', ArrowLeft: 'l', d: 'r', D: 'r', ArrowRight: 'r' };
  const joy = { x: 0, y: 0, on: false };
  let lastPt = { x: 0, y: 0, ok: false, mouse: false };
  function tickWalk(dt) {
    let mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), mz = (keys.f ? 1 : 0) - (keys.b ? 1 : 0);
    if (joy.on) { mx = joy.x; mz = -joy.y; }
    const mag = Math.min(1, Math.hypot(mx, mz));
    const night = !!(window.HouseLife && HouseLife.quiet && HouseLife.quiet());
    if (!W.seat) W.eye = Math.max(60, ((cur && cur.eye) || STAND) - (keys.crouch ? 38 : 0)); // (C / Ctrl: duck)
    const sp = (keys.run ? 210 : night ? 62 : 140) * (W.seat ? 0 : 1) * (keys.crouch ? 0.5 : 1); // (Shift: a jog, 1.5x. At night you creep anyway: Mom's asleep)
    const a = P.ry * D2R, fx = Math.sin(a), fz = -Math.cos(a), rx = Math.cos(a), rz = Math.sin(a);
    let tvx = 0, tvz = 0;
    if (mag > 0.05) {
      if (W.seat) { W.seat = false; W.eye = (cur && cur.eye) || STAND; emit('standup'); } // you get up off the chair / beanbag first
      const n = mag / Math.hypot(mx, mz);
      tvx = (fx * mz + rx * mx) * n * sp; tvz = (fz * mz + rz * mx) * n * sp;
    }
    const acc = 1 - Math.pow(0.0001, dt);
    W.vx += (tvx - W.vx) * acc; W.vz += (tvz - W.vz) * acc;
    const spd = Math.hypot(W.vx, W.vz);
    if (spd > 1) {
      const nx = W.x + W.vx * dt, nz = W.z + W.vz * dt;
      let f = floorAt(nx, nz, W.lvl, W.fy);
      if (!f && !floorAt(W.x, W.z, W.lvl, W.fy)) f = { y: W.fy, lvl: W.lvl }; // (somewhere you shouldn't be, e.g. an old saved spot: you can always walk out of it)
      if (f) { W.x = nx; W.z = nz; }
      else if ((f = floorAt(nx, W.z, W.lvl, W.fy))) { W.x = nx; W.vz *= 0.5; }
      else if ((f = floorAt(W.x, nz, W.lvl, W.fy))) { W.z = nz; W.vx *= 0.5; }
      else { W.vx = W.vz = 0; }
      if (f) { W.fy += (f.y - W.fy) * Math.min(1, dt * 14); W.lvl = f.lvl; }
      if (stIdx >= 0 && spd > 40) { stIdx = -1; ui.where(); }
      // head bob and footsteps
      const ph = W.bobT; W.bobT += spd * dt / 62; W.bob = Math.sin(W.bobT * Math.PI) * Math.min(1, spd / 120) * 1.4;
      if (Math.floor(ph) !== Math.floor(W.bobT)) { sfxStep(!!onStairs(W.x, W.z)); emit('step', W.x, W.z, spd); }
      roomCheck();
    } else W.bob *= 0.85;
    W.eyeNow += (W.eye - W.eyeNow) * Math.min(1, dt * 5);
    if (keys.jump) { keys.jump = false; if (W.jh <= 0.01 && !W.jv && !W.seat && !keys.crouch && !(cur && cur.id === 'cupboard')) W.jv = 270; } // (a hop of about 37 cm)
    if (W.jv || W.jh > 0) { const d = Math.min(dt, 0.05); W.jv -= 980 * d; W.jh += W.jv * d; const cap = Math.max(0, Math.min(40, 232 - W.eyeNow)); if (W.jh > cap) { W.jh = cap; W.jv = Math.min(W.jv, 0); } if (W.jh <= 0) { W.jh = 0; W.jv = 0; } }
    P.x = W.x; P.z = W.z; P.y = W.fy - W.eyeNow - W.bob - W.jh;
    return W.jh > 0 || spd > 1 || Math.abs(W.eye - W.eyeNow) > 0.3 || Math.abs(W.bob) > 0.05;
  }
  function onKey(ev) {
    if (!live) return;
    const t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (mode === 'focus' && ev.key === 'Escape' && !pb.querySelector(':scope > .rm-view')) { ev.preventDefault(); ev.stopImmediatePropagation(); if (focusS && focusS.o.esc && focusS.o.esc() === false) return; unfocus(); return; }
    if (pb.querySelector(':scope > .rm-view') || (mode !== 'walk' && mode !== 'glide')) { if (mode === 'stand' || mode === 'sit') { ev.preventDefault(); ev.stopImmediatePropagation(); } return; }
    if (ui.modalOpen()) return;
    const k = ev.key;
    if (KEYMOVE[k]) { if (cancelGlide() || !glide) keys[KEYMOVE[k]] = true; ev.preventDefault(); ev.stopImmediatePropagation(); ui.crossOn(); return; }
    if (k === 'Shift') { keys.run = true; return; }
    if (k === ' ' && !(t && t.closest && t.closest('button'))) { ev.preventDefault(); ev.stopImmediatePropagation(); if (held) drop(); else keys.jump = true; return; }
    if ((k === 'c' || k === 'C') && !ev.ctrlKey && !ev.metaKey || k === 'Control') { keys.crouch = true; if (k === 'Control') return; ev.preventDefault(); return; }
    if (k === 'e' || k === 'E' || k === 'Enter') {
      if (t && t.closest && t.closest('button') && k !== 'e' && k !== 'E') return; // (Enter/Space on a focused button is that button's)
      ev.preventDefault(); ev.stopImmediatePropagation();
      if (held) drop(); else useAt(hot && lastPt.mouse ? lastPt.x : vw / 2, hot && lastPt.mouse ? lastPt.y : vh / 2, true);
      return;
    }
    if (held && (k === 'f' || k === 'F')) { const t = THINGS[held.id]; if (t && t.use) { ev.preventDefault(); t.use(t); } return; }
    if (held && (k === 'r' || k === 'R')) { held.ry += ev.shiftKey ? -45 : 45; ev.preventDefault(); return; }
    if (held && (k === '+' || k === '=' || k === ']')) { held.d = clamp(held.d + 10, 25, 150); return; }
    if (held && (k === '-' || k === '_' || k === '[')) { held.d = clamp(held.d - 10, 25, 150); return; }
    if (k === 'Escape') { if (held) { putBack(); ev.preventDefault(); ev.stopImmediatePropagation(); } else if (glide) { if (cancelGlide(true)) { ev.preventDefault(); ev.stopImmediatePropagation(); } } return; }
    if ((k === 'g' || k === 'G') && !ev.ctrlKey && !ev.metaKey) { gfxNext(); return; }
    if (k === 'Tab' && !ev.ctrlKey && !ev.altKey) { /* (Tab stays the browser's: the power button must stay reachable) */ }
  }
  function onKeyUp(ev) { const k = KEYMOVE[ev.key]; if (k) keys[k] = false; if (ev.key === 'Shift') keys.run = false; if (ev.key === 'c' || ev.key === 'C' || ev.key === 'Control') keys.crouch = false; }
  addEventListener('keydown', onKey, true); addEventListener('keyup', onKeyUp, true);
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; joy.on = false; });

  // pointers: drag to look, click to use (one pointer looks; the joystick has its own)
  const PT = new Map();
  const uiTarget = el => el && el.closest && el.closest('button,a,input,label,select,textarea,.rm-note,.rm-view,.hs-ui,.powerbtn,.pc-fs');
  pb.addEventListener('pointerdown', ev => {
    if (!live || mode === 'off' || mode === 'follow' || ev.button > 0 || uiTarget(ev.target)) return;
    PT.set(ev.pointerId, { x0: ev.clientX, y0: ev.clientY, x: ev.clientX, y: ev.clientY, ry0: P.ry, rx0: P.rx, drag: false, t0: performance.now(), type: ev.pointerType });
    try { pb.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  // first-person mouse lock (desktop only): click in the room to lock, Esc lets go (the browser does that), drag-to-look still works unlocked
  const locked = () => !!cv && document.pointerLockElement === cv;
  function unlock() { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {} }
  const lockHint = document.createElement('div'); lockHint.className = 'hs-lockhint'; lockHint.setAttribute('aria-hidden', 'true'); lockHint.textContent = 'Click to look around'; let lockHintT = 0;
  function plOK() { return !touchy() && live && mode === 'walk' && !viewOpen() && !ui.modalOpen(); }
  function wantLock() { if (!plOK() || locked()) return; try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
  // capture the mouse whenever we can while walking (the browser only allows it on a click or key press, so: every one)
  document.addEventListener('mousedown', ev => { if (ev.button === 0 && !(ev.target.closest && ev.target.closest('button,a,input,select,textarea,.hs-ui,.rm-hud,[role=dialog]'))) wantLock(); }, true);
  let lockTry = 0; // (retry while moving: Chrome refuses a re-lock for about a second after Esc, so one try isn't enough)
  document.addEventListener('keydown', ev => { const n = performance.now(); if (n - lockTry > 250 && /^(Key[WASDEC]|Arrow|Space|ShiftLeft|ShiftRight)/.test(ev.code)) { lockTry = n; wantLock(); } }, true);
  document.addEventListener('pointerlockchange', () => {
    const on = locked(); clearTimeout(lockHintT);
    ui.el.classList.toggle('locked', on); lockHint.classList.toggle('on', !on && mode === 'walk');
    if (on) { lastPt = { x: vw / 2, y: vh / 2, ok: true, mouse: true }; setHot(null); ui.tip(null); }
    else { if (!ui.el.contains(lockHint)) ui.el.appendChild(lockHint); lockHint.classList.add('on'); lockHintT = setTimeout(() => lockHint.classList.remove('on'), 4000); hoverQ = false; }
  });
  pb.addEventListener('pointermove', ev => {
    if (locked()) {
      if (mode === 'walk' || mode === 'glide') { if (mode === 'glide') cancelGlide(); P.ry += ev.movementX * 0.1; P.rx = clamp(P.rx - ev.movementY * 0.1, -78, 70); dirty(); lastPt = { x: vw / 2, y: vh / 2, ok: true, mouse: true }; hoverQ = true; }
      return;
    }
    lastPt = { x: ev.clientX, y: ev.clientY, ok: true, mouse: ev.pointerType === 'mouse' };
    const p = PT.get(ev.pointerId);
    if (p) {
      p.x = ev.clientX; p.y = ev.clientY;
      const dx = p.x - p.x0, dy = p.y - p.y0;
      if (!p.drag && Math.hypot(dx, dy) > (p.type === 'mouse' ? 5 : 9)) { p.drag = true; if (mode === 'glide') cancelGlide(); p.ry0 = P.ry - 0; p.rx0 = P.rx; p.x0 = p.x; p.y0 = p.y; }
      if (p.drag && (mode === 'walk')) {
        const k = (p.type === 'mouse' ? 0.22 : 0.28) * 1366 / Math.max(800, vw) * (touchy() ? 1.15 : 1);
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
    if (!p.drag && p.type === 'mouse' && ev.button === 0) wantLock();
    if (!p.drag && performance.now() - p.t0 < 900) { if (held) drop(ev.clientX, ev.clientY); else useAt(ev.clientX, ev.clientY); }
  };
  pb.addEventListener('pointerup', endPt); pb.addEventListener('pointercancel', endPt);
  pb.addEventListener('wheel', ev => { if (!live || !held) return; ev.preventDefault(); held.d = clamp(held.d - Math.sign(ev.deltaY) * 8, 25, 150); }, { passive: false });
  pb.addEventListener('pointerleave', () => { setHot(null); ui.tip(null); });
  let hoverQ = false;
  function hover() {
    if (!lastPt.mouse || !canAct() || PT.size) return;
    const h = pick(lastPt.x, lastPt.y);
    const sid = h && h.spot && !(held && h.spot === held.id) ? h.spot : null;
    setHot(sid);
    const s = sid && SPOTS[sid];
    ui.tip(s ? (typeof s.label === 'function' ? s.label() : s.label) + (s.grab && !held ? ' <i>pick up</i>' : '') : null, lastPt.x, lastPt.y, s && h.dist > s.range);
    pb.classList.toggle('hs-hot', !!sid);
  }
  // using a thing: close enough, do it; too far, go over to it first
  function useAt(sx, sy, center) {
    if (!canAct()) return;
    const h = pick(sx, sy);
    if (!h || !h.spot) { if (!center && h && h.dist < 1200 && !touchy()) emit('miss', h); return; }
    const s = SPOTS[h.spot];
    if (h.dist > s.range && s.view !== false) {
      const v = viewFor(s, h);
      if (v) return glideTo(v, { done: () => act(s) });
    }
    act(s);
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

  // ================================================================ sitting down to use something (the telly, the phone, the fridge door)
  // focus(pose, { enter(), exit(), label }) glides you there; you can't walk until you get up (the button, or Esc)
  let focusS = null;
  function focus(pose, o) {
    o = o || {};
    if (focusS || !(mode === 'walk' || mode === 'glide') || viewOpen()) return false;
    if (held) putBack();
    focusS = { back: { x: P.x, y: P.y, z: P.z, rx: P.rx, ry: P.ry, lvl: W.lvl, seat: W.seat }, o };
    for (const k in keys) keys[k] = false; joy.on = false;
    glideTo(pose, { lock: true, ms: o.ms || 750, cancel: () => { if (!focusS) return; const f = focusS; focusS = null; glideTo(f.back, { ms: 500, done: () => setWalkFrom(f.back) }); }, done: () => { if (!focusS) return; mode = 'focus'; html.classList.add('hs-focus'); ui.focusBar(o.label || 'Get up'); if (o.enter) try { o.enter(); } catch (e) { console.error(e); } } });
    return true;
  }
  function unfocus(now) {
    if (!focusS) return; const f = focusS; focusS = null;
    html.classList.remove('hs-focus'); ui.focusBar(null);
    if (f.o.exit) try { f.o.exit(); } catch (e) { console.error(e); }
    mode = 'walk'; glideTo(f.back, { ms: now ? 0 : 650, done: () => setWalkFrom(f.back) });
  }
  // a piece of page laid onto a flat thing in the room (perspective correct), so it's crisp and you can click it
  const SURF = new Set();
  function surface(el, quad, o) {
    o = o || {};
    const s = { el, quad, w: o.w || 400, h: o.h || 300 };
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
    const q = (typeof s.quad === 'function' ? s.quad() : s.quad).map(p => toScreen(p[0], p[1], p[2]));
    if (q.some(p => !p)) { s.el.style.visibility = 'hidden'; return; }
    s.el.style.visibility = '';
    s.el.style.transform = 'matrix3d(' + homography(s.w, s.h, q).map(v => +v.toFixed(8)).join(',') + ')';
  }

  // ================================================================ the HUD (2D, kept small: where you are, the look arrows, notes)
  const ui = (function () {
    const el = document.createElement('div'); el.className = 'hs-ui rm-hud'; el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="hs-top"><span class="hs-title">JACK'S HOUSE</span><span class="hs-where"></span></div>
      <canvas class="hs-map" width="84" height="84" aria-hidden="true"></canvas>
      <div class="hs-cross" aria-hidden="true"></div>
      <div class="hs-tip" aria-hidden="true"></div>
      <div class="hs-hold" hidden><span class="hs-hname"></span><span class="hs-hkeys"></span><span class="hs-hbtn"><button type="button" data-h="near" aria-label="Nearer">&minus;</button><button type="button" data-h="far" aria-label="Further">+</button><button type="button" data-h="turn">Turn</button><button type="button" data-h="use" hidden></button><button type="button" data-h="put">Put down</button><button type="button" data-h="back">Put back</button></span></div>
      <button type="button" class="hs-getup" hidden><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13 3 6 10l7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Get up</span></button>
      <div class="hs-joy" aria-hidden="true"><i></i></div>
      <button type="button" class="hs-jump" style="display:none;position:fixed;right:14px;bottom:96px;width:62px;height:40px;border-radius:20px;border:2px solid #fff8;background:#0006;color:#fff;font:700 12px sans-serif;z-index:30001;touch-action:none">JUMP</button>
      <button type="button" class="hs-duck" style="display:none;position:fixed;right:14px;bottom:44px;width:62px;height:40px;border-radius:20px;border:2px solid #fff8;background:#0006;color:#fff;font:700 12px sans-serif;z-index:30001;touch-action:none">DUCK</button>
      <div class="hs-note rm-note"><b></b><p></p><button type="button" class="rm-x" aria-label="Close">&times;</button></div>
      <div class="hs-toast rm-toast"></div>
      <div class="hs-fade"></div>`;
    const $ = s => el.querySelector(s);
    let noteT = 0, toastT = 0;
    const note = $('.hs-note'), toastEl = $('.hs-toast'), tipEl = $('.hs-tip'), hold = $('.hs-hold');
    note.querySelector('.rm-x').addEventListener('click', () => note.classList.remove('on'));
    hold.addEventListener('click', ev => {
      const b = ev.target.closest('[data-h]'); if (!b || !held) return; const a = b.dataset.h, t = THINGS[held.id];
      if (a === 'near') held.d = clamp(held.d - 12, 25, 150); else if (a === 'far') held.d = clamp(held.d + 12, 25, 150);
      else if (a === 'turn') held.ry += 45; else if (a === 'put') drop(); else if (a === 'back') putBack(); else if (a === 'use' && t && t.use) t.use(t);
    });
    // the joystick (touch screens): bottom left
    const bJ = $('.hs-jump'), bD = $('.hs-duck'); if (touchy()) { bJ.style.display = bD.style.display = 'block'; }
    bJ.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); if (canAct()) keys.jump = true; });
    bD.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); keys.crouch = !keys.crouch; bD.style.background = keys.crouch ? '#fff6' : '#0006'; });
    const jEl = $('.hs-joy'), knob = jEl.firstElementChild; let jid = null;
    const jAt = ev => { const r = jEl.getBoundingClientRect(); let x = (ev.clientX - r.left) / r.width * 2 - 1, y = (ev.clientY - r.top) / r.height * 2 - 1; const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } joy.x = x; joy.y = y; joy.on = true; knob.style.transform = `translate(${(x * 30).toFixed(1)}px,${(y * 30).toFixed(1)}px)`; };
    jEl.addEventListener('pointerdown', ev => { if (!canAct()) return; ev.preventDefault(); ev.stopPropagation(); jid = ev.pointerId; try { jEl.setPointerCapture(jid); } catch (e) {} cancelGlide(); jAt(ev); });
    jEl.addEventListener('pointermove', ev => { if (ev.pointerId === jid) jAt(ev); });
    const jUp = ev => { if (ev.pointerId !== jid) return; jid = null; joy.on = false; joy.x = joy.y = 0; knob.style.transform = ''; };
    jEl.addEventListener('pointerup', jUp); jEl.addEventListener('pointercancel', jUp);
    $('.hs-getup').addEventListener('click', () => unfocus());
    const map = $('.hs-map'), mg = map.getContext('2d');
    let crossT = 0;
    return {
      el,
      say(title, text, ms) { note.querySelector('b').textContent = title; note.querySelector('p').innerHTML = text; note.classList.add('on'); clearTimeout(noteT); noteT = setTimeout(() => note.classList.remove('on'), ms || Math.max(4500, String(text).length * 70)); },
      hush() { note.classList.remove('on'); },
      toast(title, text) { toastEl.innerHTML = `<b>${esc(title)}</b><span>${esc(text)}</span>`; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 4200); },
      tip(text, x, y, far) { if (!text) { tipEl.classList.remove('on'); return; } tipEl.innerHTML = text + (far ? ' <small>(walk closer)</small>' : ''); tipEl.classList.add('on'); tipEl.style.transform = `translate(${Math.min(x + 14, vw - 160)}px,${y + 18}px)`; },
      where() {
        const r = cur; if (!r) return;
        $('.hs-title').textContent = r.title || r.name.toUpperCase(); $('.hs-where').textContent = r.stations[stIdx] ? r.stations[stIdx].n : r.sub || '';
      },
      holdBar(t) {
        if (!t) { hold.hidden = true; el.classList.remove('holding'); return; }
        hold.hidden = false; el.classList.add('holding');
        hold.querySelector('.hs-hname').textContent = typeof t.label === 'function' ? t.label() : t.label;
        hold.querySelector('.hs-hkeys').innerHTML = touchy() ? '' : 'Click: put it down &middot; R: turn &middot; Wheel: nearer/further &middot; Esc: put back' + (t.use ? ` &middot; <b>F</b>: ${esc(t.useLabel || 'use it')}` : '');
        const u = hold.querySelector('[data-h=use]'); u.hidden = !t.use; u.textContent = t.useLabel || 'Use';
      },
      snapHint(s) { hold.classList.toggle('snap', !!s); if (s) hold.querySelector('.hs-hkeys').innerHTML = `<b>${esc(s.hint || 'Let go to put it in')}</b>`; else if (held) this.holdBar(THINGS[held.id]); },
      crossOn() { el.classList.add('cross'); clearTimeout(crossT); crossT = setTimeout(() => el.classList.remove('cross'), 2500); },
      fade(on, ms) { const f = $('.hs-fade'); f.style.transitionDuration = (ms || 300) + 'ms'; f.classList.toggle('on', !!on); },
      modalOpen: () => !!el.querySelector('.hs-modal.on'),
      focusBar(label) { const b = $('.hs-getup'); b.hidden = !label; if (label) b.querySelector('span').textContent = label; el.classList.toggle('focus', !!label); },
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
  let need = true, raf = 0, lastT = 0, lastAmb = 0, frame = 0, viewing = false, viewT = 0;
  function dirty() { need = true; }
  const ambient = new Set(); // things that animate gently (the lava lamp, a telly): redrawn ~20 times a second
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.12, (now - (lastT || now)) / 1000); lastT = now;
    if (!live || document.hidden) return;
    tickLights(dt);
    const vo = viewOpen(); if (vo !== viewing) { viewing = vo; viewT = now; html.classList.toggle('hs-viewing', vo); if (vo) { setHot(null); ui.tip(null); unlock(); } }
    // (the consoles' telly is up: once it has settled, the room behind needn't be drawn)
    if (vo && now - viewT > 600 && pb.querySelector(':scope > .rm-tvv.on:not(.bye)') && !pb.classList.contains('rm-tvon')) pb.classList.add('rm-tvon');
    if (pb.classList.contains('rm-tvon') || pb.classList.contains('deep')) return; // (the telly's up, or we've flown into the PC)
    if (glLost() && !rebuildGL()) return; // (room's context was dropped: rebuilt now it's on show again)
    let moving = false;
    if (mode === 'follow') moving = followCss();
    else {
      if (mode === 'glide' && !glide) mode = 'walk';
      if (tickGlide(now)) moving = true;
      else if (mode === 'walk') { let left = dt; while (left > 1e-4) { const st = Math.min(0.03, left); left -= st; if (tickWalk(st)) moving = true; } }
    }
    for (const [k, fn] of anims) { let more = false; try { more = fn(now, dt); } catch (e) { console.error(e); } if (!more) anims.delete(k); moving = true; }
    if (tickThings(dt)) moving = true;
    if (hoverQ && frame % 3 === 0) { hoverQ = false; hover(); }
    frame++;
    const ambOn = ambient.size && now - lastAmb > 50;
    if (!moving && !need && !ambOn) return;
    if (ambOn) { lastAmb = now; for (const fn of ambient) try { fn(now); } catch (e) {} }
    need = false;
    render(); fpsTick(now);
    if (frame % 6 === 0) ui.map();
  }
  // the frame rate, from frames drawn back to back (idle frames aren't drawn at all). Auto: under ~40 fps for a while, a tier down
  let lastR = 0;
  function fpsTick(now) {
    const f = Q.f, d = (now - lastR) / 1000; lastR = now;
    if (d > 0 && d < 0.2) { f.n++; f.t += d; }
    if (Q.probe && now < Q.probe) dirty(); // (the first two seconds: keep drawing, to measure)
    if (f.t < 2) return;
    Q.fps = Math.round(f.n / f.t); f.n = 0; f.t = 0;
    const probing = Q.probe && now < Q.probe + 300; if (probing) Q.probe = 0;
    if (Q.auto && Q.fps < 40 && Q.tier !== 'low') { if (++f.low >= (probing ? 1 : 2)) { f.low = 0; setTier(QN[QN.indexOf(Q.tier) - 1]); } } else f.low = 0;
  }
  function setTier(t) {
    Q.tier = t; window.HouseQ = t; K.setAniso(Math.min({ low: 1, medium: 4, high: 8 }[t], ren.capabilities.getMaxAnisotropy()));
    measure(); visCalc(); emit('gfx', t);
  }
  const gfxName = () => (Q.auto ? 'Auto (' + Q.tier[0].toUpperCase() + Q.tier.slice(1) + ')' : Q.tier[0].toUpperCase() + Q.tier.slice(1));
  function gfxSet(want) { // 'auto' | 'low' | 'medium' | 'high', saved for next time
    Q.want = want; Q.auto = !QN.includes(want); ls.set('jhp_hs_gfx', want);
    setTier(Q.auto ? Q.guess : want); if (Q.auto) Q.probe = performance.now() + 2000;
    const lbl = document.getElementById('smGfx'); if (lbl) lbl.lastChild.textContent = 'Room graphics: ' + gfxName();
  }
  function gfxNext() { const o = ['auto', 'low', 'medium', 'high'], i = o.indexOf(Q.auto ? 'auto' : Q.tier); gfxSet(o[(i + 1) % 4]); ui.toast('Graphics: ' + gfxName(), Q.auto ? 'Picked for this computer (press G to change)' : 'Press G to change'); }
  let anyFront = false;
  function render() {
    glCam(P.x, P.y, P.z, P.rx, P.ry);
    if (mode !== 'follow' && mode !== 'off') cssCam();
    pcVis();
    // things in front of the PC (and the one in your hands) go on the canvas above it
    let front = false; for (const id in THINGS) { const t = THINGS[id]; if (t.obj.parent && t.obj.parent.parent && t.obj.parent.parent.visible) layerFor(t); if (t.front && t.obj.visible) front = true; }
    if (snapHi && snapHi.visible) front = true;
    const ly = pcOn ? 1 : 0; for (const f of frontFx) { if (f.userData.ly !== ly) { f.userData.ly = ly; f.traverse(o => o.layers.set(ly)); } if (f.visible && pcOn) front = true; }
    camera.layers.set(0); ren.render(scene, camera);
    if (front || anyFront) {
      if (!ren2) { ren2 = new T.WebGLRenderer({ canvas: cv2, antialias: true, alpha: true, premultipliedAlpha: true }); ren2.setClearColor(0x000000, 0); ren2.localClippingEnabled = true; measure(); }
      if (!cv2.parentNode) frontHost().appendChild(cv2);
      camera.layers.set(1); ren2.render(scene, camera); camera.layers.set(0);
      anyFront = front;
    }
    if (stood) glassFit();
    for (const sf of SURF) placeSurf(sf);
  }
  const frontFx = new Set(); // other layer-1 things (the PC's CD tray when it's out)
  const frontHost = () => stood ? html : pb;
  // boot.js's PC is only drawn when it's properly in front of you (CSS 3D can't draw things behind the camera)
  let pcOn = true;
  // Walking about, the PC is the room's own WebGL models (js/rm-room.js: House.pcGL), depth-sorted with everything else; boot.js's
  // CSS 3D PC only takes over while it flies in to the BIOS or pulls back out (from the seat, where the two line up exactly).
  function pcVis() {
    const on = mode === 'follow' || mode === 'off';
    if (on !== pcOn) { pcOn = on; pb.classList.toggle('hs-nopc', !on); }
    const g = window.House && House.pcGL; if (g && g.visible === on) g.visible = !on;
  }

  // ================================================================ boot.js: following it, holding it, and the power button
  function setMode(m) {
    mode = m; if (m !== 'walk' && m !== 'glide') unlock();
    RC.hold = m !== 'follow' && m !== 'off';
    pb.classList.toggle('hs-follow', m === 'follow'); html.classList.toggle('hs-follow', m === 'follow');
    dirty();
  }
  function start() { // the room is on show and the PC is off: you're sitting at the desk
    if (live) return; live = true;
    measure(); uiMount();
    html.classList.add('hs-live');
    const s = savedPose();
    if (s) { P.x = s.x; P.y = s.y; P.z = s.z; P.rx = s.rx; P.ry = s.ry; setWalkFrom(Object.assign({}, s, { seat: s.seat })); }
    else { Object.assign(P, seatPose()); setWalkFrom(Object.assign({ lvl: 'U' }, P)); }
    if (!cur) { cur = ROOMS.bedroom; buildRoom(cur); visCalc(); }
    reveal();
    setMode(BOOT === 'forced' || pb.classList.contains('auto') ? 'follow' : 'walk');
    stIdx = nearestStation(); ui.where();
    if (!raf) raf = requestAnimationFrame(loop);
    if (Q.auto) Q.probe = performance.now() + 2000;
    if (!ls.get('jhp_hs_walkhint', 0) && mode === 'walk') setTimeout(() => { if (mode !== 'walk' || ls.get('jhp_hs_walkhint', 0)) return; ls.set('jhp_hs_walkhint', 1); ui.say('Have a look round', touchy() ? 'Use the stick (bottom left) to walk, and drag to look round. Tap things to use them, or to pick them up.' : '<b>W A S D</b> (or the arrow keys) to walk, drag to look. Shift to jog, <b>C</b> to crouch. Click or <b>E</b> to use things or pick them up. <b>G</b>: graphics.', 9000); }, 1400);
    emit('start');
  }
  // remember where you were (a refresh while walking round puts you back there; a switch-off or a long gap starts at the desk)
  let poseT = 0;
  function savePose() { if (mode !== 'walk' || stood) return; ls.set('jhp_hs_pose', { x: +P.x.toFixed(1), y: +P.y.toFixed(1), z: +P.z.toFixed(1), rx: +P.rx.toFixed(1), ry: +P.ry.toFixed(1), seat: W.seat ? 1 : 0, lvl: W.lvl, t: Date.now() }); }
  function savedPose() { const s = ls.get('jhp_hs_pose', null); if (!s || Date.now() - s.t > 45 * 60000 || BOOT === 'forced') return null; if (!cellOk(s.lvl || 'U', s.x, s.z) && !s.seat) return null; if (ROOMS.bedroom && !inArea(ROOMS.bedroom, s.x, s.z, s.lvl || 'U')) return null; return s; }
  function saveStood() { if (stood && !standing) { try { ls.set('jhp_hs_stand', { t: Date.now(), p: mode === 'walk' ? { x: +P.x.toFixed(1), y: +P.y.toFixed(1), z: +P.z.toFixed(1), rx: +P.rx.toFixed(1), ry: +P.ry.toFixed(1), seat: W.seat ? 1 : 0, lvl: W.lvl } : (ls.get('jhp_hs_stand', {}) || {}).p }); localStorage.setItem('jhp_last', String(Date.now())); } catch (e) {} } }
  setInterval(saveStood, 1000); addEventListener('pagehide', saveStood);
  setInterval(() => { if (live && mode === 'walk' && Date.now() - poseT > 1500) { poseT = Date.now(); savePose(); } }, 2000);
  // pb's classes tell us what boot.js is up to
  new MutationObserver(() => {
    const c = pb.classList;
    if (!live && !c.contains('outro')) return;
    if ((c.contains('on') || c.contains('auto') || c.contains('outro')) && mode !== 'follow' && !stood && !standing) {
      if (c.contains('outro')) ls.del('jhp_hs_pose'); // (switched off: the next start is at the desk)
      putAway(); setMode('follow');
    }
    if (c.contains('go')) ls.del('jhp_hs_pose');
  }).observe(pb, { attributes: true, attributeFilter: ['class'] });
  function putAway() { unlock(); if (held) putBack(); glide = null; for (const k in keys) keys[k] = false; joy.on = false; ui.hush(); ui.tip(null); setHot(null); }
  // the power button: sit down at the desk first (from wherever you are), then it goes on, flying in from exactly here
  if (pbtn) pbtn.addEventListener('click', ev => {
    if (!live || mode === 'follow' || stood) return;
    const sp = seatPose(), far = Math.hypot(P.x - sp.x, P.y - sp.y, P.z - sp.z) > 3 || Math.abs(angd(P.ry, sp.ry)) > 2 || Math.abs(P.rx - sp.rx) > 2;
    if (!far && mode === 'walk') { putAway(); return; } // (boot.js takes it from here)
    ev.stopImmediatePropagation(); ev.preventDefault();
    if (mode === 'glide' && glide && glide.lock) return;
    putAway();
    glideTo(seatPose, { lock: true, ms: 900, done: () => { setWalkFrom(Object.assign({ seat: 1, lvl: 'U' }, seatPose())); render(); pbtn.click(); } });
  }, true);

  // ================================================================ STANDING UP from the PC while it's on (the live desktop on the monitor)
  let stood = false, standing = false, savedPb = null;
  const body = document.body;
  let bootOver = false; (window.BootDone || Promise.resolve()).then(() => { bootOver = true; });
  const bootIsOver = () => bootOver || document.body.classList.contains('online') || !boot.isConnected; // (the dial-up's done: the desktop is up)
  function canStand() { return bootIsOver() && !stood && !standing && !document.body.classList.contains('pc-power') && !!boot && !!window.Room && !pb.classList.contains('outro'); }
  const whyNotStand = () => ({ bootOver: bootIsOver(), stood, standing, pcPower: document.body.classList.contains('pc-power'), boot: !!boot, room: !!window.Room, outro: pb.classList.contains('outro') });
  function standUp(now) {
    if (!canStand()) return false;
    standing = true;
    try { if (window.Apps && Apps.flushGames) Apps.flushGames(); } catch (e) {}
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    savedPb = { cls: pb.className, hidden: pb.hidden, bootCls: boot.className, bootCss: boot.style.cssText, inDom: boot.isConnected, parent: boot.parentNode, next: boot.nextSibling, kids: [...boot.children].map(c => [c, c.hidden, c.style.display]) };
    [...boot.children].forEach(c => { c.style.display = c === pb ? '' : c.style.display; if (c !== pb) c.hidden = true; });
    boot.className = 'hs-standboot'; boot.style.cssText = '';
    pb.hidden = false; pb.className = 'bscreen powerscr on mon ready hs-stand';
    html.classList.add('pc-outro', 'hs-standing'); html.appendChild(boot);
    stood = true; live = true; measure(); uiMount(); html.classList.add('hs-live');
    if (!cur) { cur = ROOMS.bedroom; buildRoom(cur); }
    W.lvl = 'U'; cur = ROOMS.bedroom; visCalc();
    setMode('stand'); reveal();
    const sp = seatPose(), fp = fillPose();
    Object.assign(P, fp); glass.k = 0; // (the page starts full size and settles onto the glass)
    if (!raf) raf = requestAnimationFrame(loop);
    const t0 = performance.now(), ms = now ? 0 : 1100;
    sfx.tone(120, 0.3, 'sine', 0.05);
    anims.set('stand', n => {
      const k = ms ? Math.min(1, (n - t0) / ms) : 1, e = ease(k);
      P.x = lerp(fp.x, sp.x, e); P.y = lerp(fp.y, sp.y, e); P.z = lerp(fp.z, sp.z, e); P.rx = lerp(fp.rx, sp.rx, e); P.ry = lerp(fp.ry, sp.ry, e);
      glass.k = Math.min(1, k / 0.25);
      if (k < 1) return true;
      standing = false; setWalkFrom(Object.assign({ seat: 1, lvl: 'U' }, sp)); setMode('walk'); stIdx = nearestStation(); ui.where();
      emit('stood');
      if (!ls.get('jhp_hs_stoodhint', 0)) { ls.set('jhp_hs_stoodhint', 1); ui.say('The PC is still on', 'Everything on it keeps going. Walk round, then click the monitor (or press its power button... no, DON\'T) to sit back down.', 7000); }
      return false;
    });
    ls.set('jhp_hs_stand', { t: Date.now() });
    try { localStorage.setItem('jhp_last', String(Date.now())); } catch (e) {} // (a refresh while standing wakes the PC up, then we stand straight back up)
    return true;
  }
  function sitDown() { // back to the desktop: no BIOS, no boot, straight back in
    if (!stood || standing || mode === 'sit') return;
    putAway(); setMode('sit');
    const sp = seatPose();
    glideTo(sp, { lock: true, ms: 800, done: () => {
      mode = 'sit'; const fp = fillPose(), t0 = performance.now(), ms = 900;
      anims.set('sit', n => {
        const k = Math.min(1, (n - t0) / ms), e = ease(k);
        P.x = lerp(sp.x, fp.x, e); P.y = lerp(sp.y, fp.y, e); P.z = lerp(sp.z, fp.z, e); P.rx = lerp(sp.rx, fp.rx, e); P.ry = lerp(sp.ry, fp.ry, e);
        glass.k = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
        if (k < 1) return true;
        finishSit(); return false;
      });
    } });
  }
  function finishSit() {
    stood = false; live = false; setMode('off');
    body.style.transform = ''; body.style.clipPath = ''; body.style.webkitClipPath = '';
    html.classList.remove('pc-outro', 'hs-standing', 'hs-live');
    if (savedPb) {
      pb.className = savedPb.cls; pb.hidden = savedPb.hidden;
      savedPb.kids.forEach(([c, h, d]) => { c.hidden = h; c.style.display = d; });
      boot.className = savedPb.bootCls; boot.style.cssText = savedPb.bootCss;
      if (!savedPb.inDom) boot.remove(); else if (savedPb.parent) savedPb.parent.insertBefore(boot, savedPb.next);
    }
    if (cv2.parentNode === html) cv2.remove();
    ls.del('jhp_hs_stand');
    emit('sat');
  }
  // the page laid onto the monitor's glass (perspective correct: a homography as a CSS matrix3d)
  const glass = { k: 1 };
  function glassFit() {
    // the glass is taken from the WebGL monitor itself (rm-room.js's pcGL: wherever it was built), in the engine's own y-down frame
    const g = House.pcGL, gl = g && g.userData.glass; let cx, cy, z = 0.05;
    if (gl) { const M = new T.Matrix4().copy(House.root.matrixWorld).invert().multiply(g.matrixWorld); const o = new T.Vector3(gl.x, gl.y, gl.z).applyMatrix4(M); cx = o.x; cy = o.y; z = o.z + 0.01; } else { const L = Lb(); cx = L.mx; cy = GY; }
    const w = GW / 2, h = GH / 2;
    // the page keeps its shape and covers the glass (the spare is trimmed off by the clip)
    const pa = vw / vh, ga = GW / GH;
    const cw = pa > ga ? GH * pa / 2 : w, ch = pa > ga ? h : GW / pa / 2;
    const q = [[cx - cw, cy - ch], [cx + cw, cy - ch], [cx + cw, cy + ch], [cx - cw, cy + ch]].map(([x, y]) => toScreen(x, y, z));
    if (frame % 4 === 0 || glass.hid == null) {
      let hid = P.z < z + 2;
      if (!hid && mode === 'walk') { const c = toScreen(cx, cy, z); if (c) { const h = pick(c.x, c.y, { skip: isThingMesh }); hid = !!h && h.spot !== 'pc' && h.dist < c.d - 8; } }
      glass.hid = hid;
    }
    if (q.some(p => !p) || glass.hid) { body.style.visibility = 'hidden'; return; }
    body.style.visibility = '';
    let m = homography(vw, vh, q);
    if (glass.k < 1) m = m.map((v, i) => lerp(i % 5 === 0 ? 1 : 0, v, glass.k)); // (blending to/from the full-size page at the ends)
    body.style.transform = 'matrix3d(' + m.map(v => +v.toFixed(8)).join(',') + ')';
    const ix = pa > ga ? (1 - GW / (cw * 2)) / 2 * vw : 0, iy = pa > ga ? 0 : (1 - GH / (ch * 2)) / 2 * vh;
    const r = glass.k < 1 ? lerp(0, 1, glass.k) : 1;
    body.style.clipPath = `inset(${(iy * r).toFixed(1)}px ${(ix * r).toFixed(1)}px round ${(vw * 0.035 * r).toFixed(1)}px / ${(vh * 0.05 * r).toFixed(1)}px)`;
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
  // the way to stand up: hold Esc on the desktop for a moment, or the chair button
  let escT = 0;
  addEventListener('keydown', ev => {
    const away = !live || mode === 'follow'; // (sat at the PC: the house isn't being walked round)
    if (ev.key === 'F2' && !stood && away && canStand() && !ev.repeat) { ev.preventDefault(); standUp(); return; }
    if (ev.key !== 'Escape' || stood || !away || !canStand() || ev.repeat) return;
    clearTimeout(escT); escT = setTimeout(() => { if (canStand()) standUp(); }, 500);
    standBtn.classList.add('hold');
  }, true);
  addEventListener('keyup', ev => { if (ev.key === 'Escape') { clearTimeout(escT); standBtn.classList.remove('hold'); } });
  const standBtn = document.createElement('button');
  standBtn.type = 'button'; standBtn.className = 'hs-standbtn'; standBtn.title = 'Stand up (go in your room). The PC stays on. (Or hold Esc, or press F2.)';
  standBtn.setAttribute('aria-label', 'Stand up from the PC and go in your room. The PC stays on.');
  standBtn.innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true"><path fill="#000" d="M4 1h7v1H4zM3 2h1v6H3zM11 2h1v6H11zM2 8h12v1H2zM2 9h1v2H2zM13 9h1v2H13zM3 11h10v1H3zM7 12h2v2H7zM4 14h8v1H4zM4 15h1v1H4zM11 15h1v1H11z"/><path fill="#1a3a9a" d="M4 2h7v6H4z"/><path fill="#3a6ad8" d="M5 3h2v4H5z"/><path fill="#808080" d="M3 9h10v2H3z"/><path fill="#c0c0c0" d="M3 9h10v1H3z"/></svg>';
  standBtn.addEventListener('click', () => standUp());
  // (it sits at the top-right corner of the desktop; only while the PC is on)
  const bootDone = window.BootDone || Promise.resolve();
  bootDone.then(() => { setTimeout(() => { if (!window.Room) return; const tray = document.getElementById('tray'), clk = document.getElementById('clock'); if (tray) tray.insertBefore(standBtn, clk && clk.parentNode === tray ? clk : null); startItems(); standHint(); }, 1200); });
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
    b.innerHTML = '<b>Want a look round your room?</b><br>Start &gt; Stand up, the chair button down here, hold Esc or press F2. The PC stays on: walk back to the desk and click the monitor to sit back down.<span style="position:absolute;right:6px;top:4px;font-weight:700">&times;</span>';
    b.addEventListener('click', () => b.remove()); document.body.appendChild(b); setTimeout(() => b.remove(), 14000);
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
    for (const [fx, fy] of [[.5, .5], [.25, .5], [.75, .5], [.5, .25], [.5, .75], [.3, .3], [.7, .7]]) { gl.readPixels(Math.floor(w * fx), Math.floor(h * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); if (px[0] + px[1] + px[2] > 24) return true; }
    return false;
  }
  function wdCheck() {
    if (!live || document.hidden || mode === 'off' || mode === 'follow' || viewOpen() || pb.classList.contains('deep') || pb.classList.contains('rm-tvon')) { wdBlack = 0; return; }
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
  bootDone.then(() => { const s = ls.get('jhp_hs_stand', null), away = (window.JHPAway || 0) > 10 * 3600000; if (!(BOOT === 'wake' && (away || (s && Date.now() - s.t < 30 * 60000)))) unhideStand(); if (BOOT === 'wake' && (away || (s && Date.now() - s.t < 30 * 60000))) { let tries = 0; const go = () => { if (!canStand() && window.JHPStood && ++tries < 80) return setTimeout(go, 100); if (!canStand()) unhideStand(); if (canStand()) { let sp0 = !away && s && s.p; try { standUp(true); } catch (e) { console.error(e); unhideStand(); } { let did = false; (EVS.stood = EVS.stood || []).push(() => { if (did) return; did = true; if (sp0 && !(ROOMS.bedroom && inArea(ROOMS.bedroom, sp0.x, sp0.z, sp0.lvl || 'U'))) sp0 = null; /* (the rest of the house isn't loaded yet and its doors start shut: a refresh outside the bedroom puts you back by the desk, never in an undrawn room) */ if (sp0) { Object.assign(P, { x: sp0.x, y: sp0.y, z: sp0.z, rx: sp0.rx, ry: sp0.ry }); setWalkFrom(sp0); } dirty(); unhideStand(); }); } if (away) setTimeout(() => ui.say('You left the PC on', 'It\'s been on all this time (Dad will NOT be happy about the electric). Your stuff is still on the screen: click the monitor to sit back down.', 7000), 400); } }; setTimeout(go, window.JHPStood ? 0 : 1600); } });

  // ================================================================ resizing, rotating, the tab going away
  addEventListener('resize', () => { if (!live) return; measure(); if (mode === 'walk' && W.seat && Math.abs(P.ry - seatPose().ry) < 1) { Object.assign(P, seatPose()); } dirty(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { lastT = 0; dirty(); } else { for (const k in keys) keys[k] = false; } });

  // ================================================================ the API
  window.House = {
    ok: true, T, K, scene, root, camera, ren, P, W, LV, ROOMS, DOORS, SPOTS, THINGS, SNAPS, OPEN, sfx, ui,
    focus, unfocus, surface, faceQuad, get focused() { return !!focusS; },
    room, buildRoom, door, setDoor, walkRect, block, stairs, support, spot, unspot, thing, snap: snapDef, openable, toggle, tidy,
    restoreThing, saveThings, layerFor, frontFx, place,
    grab, drop, putBack, held: () => held && held.id, act: id => act(SPOTS[id]), useAt,
    glideTo, goStation, cancelGlide, viewFor, setWalkFrom, seatPose, fillPose, get gliding() { return !!glide; },
    toScreen, viewZ, pick, rayAt, fwd,
    on(ev, fn) { (EVS[ev] = EVS[ev] || []).push(fn); }, off(ev, fn) { const a = EVS[ev] || []; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); }, emit,
    say: (t, x, ms) => ui.say(t, x, ms), toast: (t, x) => ui.toast(t, x), hush: () => ui.hush(),
    dirty, relight, ambient, anims, visCalc, start, standUp, sitDown, canStand,
    Q, gfx: gfxSet, get mode() { return mode; }, get live() { return live; }, get stood() { return stood; }, get here() { return cur && cur.id; }, get busy() { return !canAct(); },
    goRoom(id, st) { const r = ROOMS[id]; if (!r) return; buildRoom(r); const s = r.stations[st || 0]; if (s) { cur = r; visCalc(); stIdx = st || 0; glideTo(stationPose(r, s), { ms: 0 }); setWalkFrom(stationPose(r, s)); ui.where(); } },
    _: { whyNotStand, setMode, rebuildGrids, cellOk, floorAt, grids, homography, glassFit, glass, seatPose, followCss, savedPose, finishSit, nearestStation, get stIdx() { return stIdx; }, get glide() { return glide; }, get focusS() { return focusS; } },
  };
})();

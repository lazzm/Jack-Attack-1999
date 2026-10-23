/* Switching on the family PC: power button, BIOS, ScanDisk, startup splash, then dialling JackNet.
 * Every page load starts with the PC switched off (?noboot skips it, for testing only). There is no Skip: it always plays out.
 * A refresh or a closed tab picks up where you left off once it's switched back on. */
(function () {
  if(window.PCOnly?.desktopOnly)return;
  const $ = id => document.getElementById(id);
  let booted = false, forced = '', clean = false;
  try {
    booted = localStorage.getItem('jhp_everbooted') === '1';
    forced = sessionStorage.getItem('jhp_forceboot') || ''; sessionStorage.removeItem('jhp_forceboot');
    clean = localStorage.getItem('jhp_clean') === '1'; // shut down properly last time? then no ScanDisk
    if (localStorage.getItem('jhp_everbooted') !== '1') clean = true; // a brand-new PC was never 'not shut down properly'
  } catch (e) {}
  let wasFs = '';
  try { wasFs = sessionStorage.getItem('jhp_fs') || ''; } catch (e) {}
  const fsNow = () => { try { sessionStorage.setItem('jhp_fs', (document.fullscreenElement || document.webkitFullscreenElement) ? '1' : '0'); } catch (e) {} };
  document.addEventListener('fullscreenchange', fsNow); document.addEventListener('webkitfullscreenchange', fsNow);
  let finish;
  window.BootDone = new Promise(r => { finish = r; });
  const boot = $('boot');
  // ---- the room: the tower, the monitor, the desk, and the camera maths (shared by switching on and switching off)
  const pb = $('bootPower'), pbtn = pb.querySelector('.powerbtn'), pstage = pb.querySelector('.pc-stage'), cam = pb.querySelector('.pc-cam');
  const mon = pb.querySelector('.pc-mon'), tower = pb.querySelector('.pc-tower'), kbd = pb.querySelector('.pc-kbd'), mouse = pb.querySelector('.pc-mouse');
  const glass = pb.querySelector('.pm-glass'), mini = pb.querySelector('.pm-text'), mstar = pb.querySelector('.pm-star');
  const still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  // where everything sits on the desk (em; y = 0 is the desk top) and where the camera looks from
  let L = null;
  function layout() {
    const tall = !!(window.matchMedia && matchMedia('(max-aspect-ratio: 3/4)').matches);
    const flat = !tall && !!(window.matchMedia && matchMedia('(max-height: 500px) and (min-aspect-ratio: 3/2)').matches); // a phone on its side: the caption goes to the right
    // (phones held upright get a tighter set: the tower tucked in behind, the mouse in front of it. Keep in step with tower.css.)
    L = tall ? { mx: -11, tx: 15, tz: -34, kx: -10, ux: 12, uz: 12, fx: 0.5, fy: -15, fz: -8, rx: -18, ry: -26, oy: -9, ox: 0 }
      : { mx: -15, tx: 17, tz: -30, kx: -15, ux: 8, uz: 9.5, fx: 0, fy: -19, fz: -14, rx: -16, ry: -30, oy: -4, ox: flat ? -13 : 0 };
    mon.style.transform = `translate3d(${L.mx}em,0,0)`;
    tower.style.transform = `translate3d(${L.tx}em,-21.6em,${L.tz}em)`;
    kbd.style.transform = `translate3d(${L.kx}em,0,11.5em)`;
    mouse.style.transform = `translate3d(${L.ux}em,0,${L.uz}em)`;
    (window.RoomCam = window.RoomCam || {}).L = L; // (js/hs-world.js: the house's camera needs to know where the PC sits)
  }
  // The camera always turns about the monitor's screen (so the zoom flies straight at it): the room view just puts that point
  // where it belongs in the picture. A dolly in plus a zoom: the dolly gives the parallax, the zoom keeps the speed even.
  // Same functions in the same order every time, so CSS can tween between the room view and the close-up.
  const GW = 30, GH = 22.5, GY = -24.55, PERSP = 115; // the glass (em), its centre's height above the desk, and .pc-stage's perspective
  const camAt = (x, y, z, k, rx, ry) => `translate3d(${x}em,${y}em,${z}em) scale3d(${k},${k},${k}) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${-L.mx}em,${-GY}em,-0.02em)`;
  function roomPos(rx, ry) { // where the screen sits when the camera looks at the middle of the desk (L.fx, L.fy, L.fz)
    const o = window.RoomCam || 0, a = ry * Math.PI / 180, b = rx * Math.PI / 180, dx = L.mx - L.fx - (o.fx || 0), dy = GY - L.fy - (o.fy || 0), dz = -L.fz - (o.fz || 0); // (RoomCam: js/rm-room.js looking round the bedroom)
    const x1 = dx * Math.cos(a) + dz * Math.sin(a), z1 = -dx * Math.sin(a) + dz * Math.cos(a);
    return [x1 + (L.ox || 0), L.oy + dy * Math.cos(b) - z1 * Math.sin(b), dy * Math.sin(b) + z1 * Math.cos(b)];
  }
  let vrx = 0, vry = 0; // the camera's current angles
  function roomView(rx, ry) {
    vrx = rx; vry = ry;
    const [x, y, z] = roomPos(rx, ry);
    return camAt(x.toFixed(2), y.toFixed(2), z.toFixed(2), 1, rx.toFixed(2), ry.toFixed(2));
  }

  // ---- switching off. desk.js shows its own switch-off (#crt) and reloads about 1.7 s later, after Shut Down, Restart or a crash.
  // Instead the camera pulls back out of the monitor: the picture (the page itself, scaled onto the glass) collapses to a line and
  // a dot, the LEDs go out, and the room is left exactly as the reloaded page starts it, so the reload doesn't show.
  let lastSd = '', outroing = false;
  document.addEventListener('submit', ev => {
    const c = ev.target && ev.target.querySelector && ev.target.querySelector('input[name=sd]:checked'); if (!c) return;
    lastSd = c.value;
    // Shut Down: remember it straight away (a reload from here on lands on the switched-off PC, until the power button's pressed)
    if (lastSd === 'off') { try { localStorage.setItem('jhp_off', '1'); } catch (e) {} forget(); }
  }, true);
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  function shot(x0, y0, z0, rx0, ry0, zEnd, sEnd, p, q) { // the camera, p of the way from the room view to facing the screen, q of the way zoomed in
    cam.style.transform = camAt((x0 * (1 - p)).toFixed(3), (y0 * (1 - p)).toFixed(3), (z0 * (1 - p) + zEnd * q).toFixed(3), Math.exp(sEnd * q).toFixed(4), (rx0 * (1 - p)).toFixed(3), (ry0 * (1 - p)).toFixed(3));
  }
  function outro() {
    if (outroing || !boot) return; outroing = true;
    forget(); // switching off (or restarting, or a crash): next time starts afresh
    if (window.House && House.ok && House.shutdownPC && House.shutdownPC()) return;
    const html = document.documentElement, body = document.body, off = lastSd === 'off';
    [...boot.children].forEach(c => { c.style.display = ''; c.hidden = c !== pb; });
    boot.className = ''; boot.style.cssText = '';
    pb.hidden = false; pb.className = 'bscreen powerscr on mon outro' + (off ? '' : ' auto');
    glass.className = 'pm-glass'; pbtn.classList.add('down');
    html.classList.add('pc-outro'); html.appendChild(boot); // outside <body>, so scaling the page doesn't scale the room
    layout();
    const vw = innerWidth, vh = innerHeight, em = parseFloat(getComputedStyle(pstage).fontSize) || 10;
    const k = Math.max(vw / (GW * em), vh / (GH * em)) * 1.03, dolly = 1.3, zEnd = PERSP * (1 - 1 / dolly), sEnd = Math.log(k / dolly);
    const [x0, y0, z0] = roomPos(L.rx, L.ry);
    // how far to pull back before the tube goes out: until the screen is about 4/5 of the window (wide or tall)
    const wide = q => GW * em * Math.exp(sEnd * q) * PERSP / (PERSP - zEnd * q), goal = 0.8 * Math.min(vw, vh * GW / GH);
    let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (wide(mid) > goal) hi = mid; else lo = mid; }
    const QA = lo;
    const at = (p, q) => shot(x0, y0, z0, L.rx, L.ry, zEnd, sEnd, p, q);
    const fit = (sx, sy) => { // lay the page over the glass (sx, sy squash it about the glass's middle: the tube switching off)
      // (kept inside the window: anything poking out would make a phone zoom the whole page out)
      const g = glass.getBoundingClientRect(), L0 = Math.max(0, g.left), T0 = Math.max(0, g.top), r = { left: L0, top: T0, width: Math.min(vw, g.right) - L0, height: Math.min(vh, g.bottom) - T0 };
      // the page keeps its shape: scaled to cover the glass, trimmed to it (rounded like the tube), then squashed as it goes out
      const c = Math.max(r.width / vw, r.height / vh), kx = c * sx, ky = c * sy;
      const ix = (vw * c - r.width) / 2 / c, iy = (vh * c - r.height) / 2 / c;
      body.style.transform = `translate(${(r.left + r.width / 2 - vw * kx / 2).toFixed(2)}px,${(r.top + r.height / 2 - vh * ky / 2).toFixed(2)}px) scale(${kx.toFixed(5)},${ky.toFixed(5)})`;
      body.style.clipPath = `inset(${iy.toFixed(1)}px ${ix.toFixed(1)}px round ${(0.05 * r.width / c).toFixed(1)}px / ${(0.08 * r.height / c).toFixed(1)}px)`;
    };
    at(1, 1); fit(1, 1);
    const t0 = performance.now(), A = still ? 300 : 420, B = still ? 300 : 380, C = still ? 650 : 850; // (reduced motion: a little quicker)
    (function frame(now) {
      const t = now - t0;
      if (t < A) { at(1, 1 - (1 - QA) * ease(t / A)); fit(1, 1); }                       // 1. pull back a little, still square on
      else if (t < A + B) {                                                              // 2. the picture collapses to a line, then a dot
        const u = (t - A) / B, sy = u < 0.55 ? Math.max(0.004, 1 - ease(u / 0.55)) : 0.004, sx = u < 0.55 ? 1 : Math.max(0.006, 1 - ease((u - 0.55) / 0.3));
        at(1, QA); fit(sx, sy);
        body.style.filter = `brightness(${(1 + 2.5 * Math.min(1, u / 0.5)).toFixed(2)})`;
        body.style.opacity = u < 0.8 ? '1' : (1 - (u - 0.8) / 0.2).toFixed(3);
        if (u > 0.5) pb.classList.add('dark');
      } else {                                                                           // 3. back out into the room, LEDs off
        body.style.opacity = '0';
        const u = Math.min(1, (t - A - B) / C), e = ease(u);
        at(1 - e, QA * (1 - e));
        if (u > 0.15) pb.classList.remove('mon');
        if (u > 0.55) { pb.classList.remove('on'); pbtn.classList.remove('down'); }
        if (u >= 1) return;
      }
      requestAnimationFrame(frame);
    })(t0);
  }
  // desk.js's "JackOS is shutting down..." screen gets the same painted sky as the splash
  const shut = $('shutdown'), shutSky = shut && shut.querySelector('.splash');
  if (shutSky && window.MutationObserver && !shutSky.querySelector('.sp-sky')) {
    const cv = document.createElement('canvas'), hz = document.createElement('div');
    cv.className = 'sp-sky'; cv.setAttribute('aria-hidden', 'true'); hz.className = 'sp-haze';
    shutSky.prepend(cv, hz);
    new MutationObserver(() => { if (!shut.hidden) { try { paintSky(cv); } catch (e) {} } }).observe(shut, { attributes: true, attributeFilter: ['hidden'] });
  }
  const crtEl = $('crt');
  if (crtEl && window.MutationObserver) new MutationObserver(() => { if (crtEl.classList.contains('off')) outro(); }).observe(crtEl, { attributes: true, attributeFilter: ['class'] });

  // ---- carrying on where you left off: a refresh or a closed tab remembers what was open (the JackNet Explorer page and
  // its scroll, and the programs and where they were) and puts it back after the next switch-on. Shut Down, Restart and
  // crashes start afresh, like a real computer.
  const RESUME = 'jhp_resume', tracked = [];
  let resume = null, saving = false, keep = true;
  const mode = window.JHPBoot || (/[?&]noboot/.test(location.search) ? 'skip' : forced ? 'forced' : 'room'); // (worked out by boot-early.js)
  try { resume = JSON.parse(localStorage.getItem(RESUME) || 'null'); } catch (e) {}
  if (mode !== 'wake') resume = null; // only a PC that was left on carries on where it was
  if (mode === 'old' || mode === 'room') try { localStorage.removeItem(RESUME); } catch (e) {}
  // a fresh start also means JackNet Explorer's home page, unless they followed a link straight to a page (a reload of our own
  // address, with the page JackNet Explorer put in it, doesn't count)
  if (mode !== 'wake' && mode !== 'skip' && location.hash) {
    let nav = ''; try { nav = (performance.getEntriesByType('navigation')[0] || {}).type || ''; } catch (e) {}
    if (nav === 'reload' || nav === 'back_forward' || forced) window.BootDone.then(() => { if (window.IE && IE.current !== 'home') IE.go('home'); });
  }
  const plain = a => { // an argument we can store and give back exactly (or undefined if not)
    if (a == null || typeof a === 'number' || typeof a === 'boolean') return { ok: true, v: a };
    if (typeof a === 'string') return { ok: a.length < 600, v: a };
    try { const j = JSON.stringify(a); return j && j.length < 1500 && Object.getPrototypeOf(a) === Object.prototype ? { ok: true, v: JSON.parse(j) } : { ok: false }; } catch (e) { return { ok: false }; }
  };
  function trackApps() { // remember which programs get opened (through Apps.open), with what
    if (!window.Apps || Apps.__boottrack) return; Apps.__boottrack = true;
    const open = Apps.open;
    Apps.open = function (id, arg) {
      const w = open.apply(this, arguments), a = plain(arg);
      const add = x => { if (x && x.el && !tracked.some(t => t.w === x)) tracked.push({ w: x, id, arg: a.v, ok: a.ok }); };
      if (w && typeof w.then === 'function') w.then(add, () => {}); else add(w);
      return w;
    };
  }
  function snapshot() {
    const pg = $('page'), br = $('browser'), ab = $('addrBar');
    const wins = tracked.filter(t => t.ok && !t.w.closed && t.w.el.isConnected).map(t => { const st = t.w.el.style; return { id: t.id, arg: t.arg, x: st.left, y: st.top, w: st.width, h: st.height, min: st.display === 'none' }; });
    return { t: Date.now(), sec: window.IE ? IE.current : '', url: ab ? ab.value : '', y: pg ? pg.scrollTop : 0, min: !!(br && br.classList.contains('min')), wins };
  }
  const save = () => { if (keep && saving) try { localStorage.setItem(RESUME, JSON.stringify(snapshot())); } catch (e) {} };
  const forget = () => { keep = false; try { localStorage.removeItem(RESUME); } catch (e) {} };
  function leaving() {
    let fb = ''; try { fb = sessionStorage.getItem('jhp_forceboot') || ''; } catch (e) {}
    if (fb) return forget(); // a restart or a crash on its way: start afresh
    if (!saving) return;
    save(); stamp(true);
    try { localStorage.setItem('jhp_clean', '1'); } catch (e) {} // a refresh isn't a crash: no ScanDisk for it
  }
  addEventListener('pagehide', leaving); addEventListener('beforeunload', leaving);
  // when they were last here (it decides between waking up and a switched-off PC next time): on any input, at most every 30 s
  let stamped = 0;
  function stamp(now) { const t = Date.now(); if (now || t - stamped > 30000) { stamped = t; try { localStorage.setItem('jhp_last', String(t)); } catch (e) {} } }
  const whenReady = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();
  window.BootDone.then(() => whenReady(() => {
    trackApps(); saving = true; stamp(true); setInterval(save, 10000);
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(e => addEventListener(e, () => stamp(), { passive: true, capture: true }));
  }));
  function restore(r) {
    if (!r) return;
    try {
      if (window.IE && !location.hash) { // (a link straight to a page wins)
        if (r.sec && r.sec !== 'secret' && r.sec !== 'error') { if (r.sec !== IE.current) IE.go(r.sec); }
        else if (r.url) IE.navigate(r.url);
        setTimeout(() => { const pg = $('page'); if (pg && r.y) pg.scrollTop = r.y; }, 700);
      }
      if (r.min) { const br = $('browser'), b = $('brMin'); if (br && b && !br.classList.contains('min')) b.click(); }
      (r.wins || []).forEach((s, i) => setTimeout(() => {
        if (!window.Apps || !Apps.apps || !Apps.apps[s.id]) return;
        const place = x => {
          if (!x || !x.el) return; const st = x.el.style, n = v => parseFloat(v);
          const dw = window.DesktopSurface ? DesktopSurface.width() : innerWidth, dh = window.DesktopSurface ? DesktopSurface.height() : innerHeight;
          if (s.w) st.width = Math.min(n(s.w), dw - 8) + 'px'; if (s.h) st.height = Math.min(n(s.h), dh - 50) + 'px';
          if (s.x) st.left = Math.max(0, Math.min(n(s.x), dw - 80)) + 'px'; if (s.y) st.top = Math.max(0, Math.min(n(s.y), dh - 80)) + 'px';
          if (s.min && x.min) x.min();
        };
        const w = Apps.open(s.id, s.arg);
        if (w && typeof w.then === 'function') w.then(place, () => {}); else place(w);
      }, 250 + i * 180));
    } catch (e) {}
  }

  // Initialise the reusable PC power state even on a wake. The room is not a web page to reload on shutdown.
  const quick = booted && !forced, fast = false, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  let skipped = false, gate = Promise.resolve(), openGate = () => {}, mirror = null, inWorldBoot = false;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, t0 = performance.now(), pressed = mode === 'wake';
  let handed = false, early = false, cycling = false;
  const roomOff = () => document.body.classList.remove('pc-power');
  window.PCPower = {
    off() {
      if (!window.House || !House.ok) return false;
      if (window.Apps && Apps.flushGames) Apps.flushGames();
      if (window.Desk && Desk.resetPC) Desk.resetPC();
      forget(); tracked.length = 0;
      cycling = false;
      timers.forEach(clearTimeout); timers.length = 0; pressed = skipped = handed = early = outroing = false; clean = true;
      if (mirror) mirror.disconnect();
      for (const e of document.querySelectorAll('#monitorSurface .float .ctl [aria-label="Close"],#monitorSurface .appwin [data-w=close]')) e.click();
      for (const id of ['shutdown','dimmer','bootBios','bootScan','bootSplash','standby','bsod','dos']) {const e = $(id); if (e) e.hidden = true;}
      $('biosText').textContent = ''; $('crt').classList.remove('off');
      document.querySelectorAll('#monitorSurface .closing').forEach(e => e.classList.remove('closing'));
      pb.classList.remove('on','mon','go','deep','outro','auto'); pbtn.classList.remove('down');
      document.body.classList.add('pc-power'); document.body.classList.remove('online');
      window.JHPBoot = 'forced'; return !!(window.House && House.finishShutdown && House.finishShutdown());
    },
    restart() {
      if (cycling) return true;
      let wasClean = true; try { wasClean = localStorage.getItem('jhp_clean') !== '0'; } catch (e) {}
      if (!this.off()) return false;
      cycling = true; clean = wasClean;
      later(() => power(true), 250);
      return true;
    }
  };
  pbtn.addEventListener('click', power);
  // straight after Start > Log Off the page reloads into the logon screen (js/site.js), and ?noboot (for testing) skips it all
  let relog = false; try { relog = sessionStorage.getItem('jhp_site_relogon') === '1'; } catch (e) {}
  if (!forced && (relog || /[?&]noboot/.test(location.search))) {
    // (after Log Off: keep a plain teal screen up until the logon is there, so the old desktop doesn't flash up in between)
    if (relog) { boot.style.background = '#008080'; [...boot.children].forEach(c => { c.style.display = 'none'; }); setTimeout(() => bootGone(), 4000); }
    else bootGone();
    finish(); return;
  }
  if (mode === 'wake') { // it was left on: the monitor wakes up from standby and everything is where it was (no logon box either)
    try { sessionStorage.setItem('jhp_booted', '1'); } catch (e) {}
    // The house takes over this same layer as soon as its scripts are ready;
    // an old full-page CRT wake animation would cover the room with black.
    setTimeout(() => { if (!window.House || !House.ok) { document.documentElement.classList.remove('pc-standwake'); boot.classList.add('gone'); setTimeout(bootGone, 400); } }, 1500);
    document.body.classList.add('online');
    finish();
    whenReady(() => setTimeout(() => restore(resume), 30));
    return;
  }
  try { sessionStorage.setItem('jhp_booted', '1'); localStorage.setItem('jhp_everbooted', '1'); localStorage.setItem('jhp_clean', '0'); } catch (e) {}

  // the boot layer also holds the 3D room (js/hs-world.js): never remove it while someone is standing/walking in the room
  function bootGone() { const h = document.documentElement; if (h.classList.contains('hs-standing') || h.classList.contains('hs-live')) { boot.classList.remove('gone'); return; } boot.remove(); }
  function done() {
    if (skipped) return; skipped = true;
    document.body.classList.remove('pc-power');
    timers.forEach(clearTimeout);
    // The splash is part of the boot layer; hide it before the room keeps that layer around.
    const splash = $('bootSplash'); if (splash) splash.hidden = true;
    if (!inWorldBoot) { boot.classList.add('gone'); setTimeout(() => bootGone(), 400); }
    const surface = $('monitorSurface'); if (surface) surface.classList.remove('pc-starting');
    // the JackNet network logon (js/site.js) comes up before the dial-up box; it auto-logs-on with a saved logon
    (window.JackLogon ? JackLogon.boot() : Promise.resolve()).then(dial, dial);
  }
  // no Skip: switching the PC on always plays out in full (Jack, 2026-10-20). (A wake after a refresh isn't a skip: the PC was on.)
  const sk = $('bootSkip'); if (sk) sk.remove();

  // ---- 0. the family PC and its monitor, sat on the desk. Only the tower's power button switches it on
  // (it's a real <button>, so Tab + Enter/Space work too). Pressing it also unlocks sound: browsers need a click first.
  // a switched-off PC in a dark room doesn't flicker: the CRT glass overlay (crt.js) stays off until the BIOS fills the screen
  document.body.classList.add('pc-power');
  try { if (localStorage.getItem('jhp_crt') === '0') pb.classList.add('nocrt'); } catch (e) {} // CRT glass switched off (Run > crt)
  const fsBox = $('bootFs'), root = document.documentElement;
  const canFs = !!(root.requestFullscreen || root.webkitRequestFullscreen) && document.fullscreenEnabled !== false;
  // (no Full screen box any more, and no automatic full screen on power-on: Jack, 2026-10-21)
  if (fsBox) try { fsBox.checked = localStorage.getItem('jhp_bootfs') !== '0'; } catch (e) {}
  if (fsBox && !canFs) fsBox.parentNode.hidden = true;
  if (fsBox) fsBox.parentNode.addEventListener('click', ev => ev.stopPropagation());
  if (fsBox) fsBox.addEventListener('change', () => { try { localStorage.setItem('jhp_bootfs', fsBox.checked ? '1' : '0'); } catch (e) {} });
  // full screen on a cold boot. After a shut down or restart (a reload, which always leaves full screen) only if they were in it.
  function goFull() {
    if (!canFs || !fsBox || !fsBox.checked || document.fullscreenElement || document.webkitFullscreenElement) return;
    if (forced && wasFs !== '1') return;
    const maxed = document.body.classList.contains('maxed');
    // JackNet Explorer maximises itself when the page goes full screen (F11 in its menu). Not for this one: keep the desktop showing.
    document.addEventListener('fullscreenchange', function once() {
      document.removeEventListener('fullscreenchange', once);
      setTimeout(() => { if (document.fullscreenElement && !maxed && document.body.classList.contains('maxed')) { const b = $('brMax'); if (b) b.click(); } }, 0);
    });
    try {
      const p = root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }
  // the camera drifts a few degrees towards the mouse or your finger
  const view = () => {
    const o = window.RoomCam || 0;
    if (o.hold) return; // (js/hs-world.js is driving the camera: walking round the house)
    cam.style.transform = roomView(L.rx + cy * 4 + (o.rx || 0), L.ry + cx * 9 + (o.ry || 0));
    cam.style.setProperty('--sl', (0.8 - cx * 0.06).toFixed(3));
  };
  function aim(ev) { tx = (ev.clientX / innerWidth - 0.5) * 2; ty = (ev.clientY / innerHeight - 0.5) * 2; }
  function sway(now) {
    const idle = Math.sin((now - t0) / 2600) * 0.12;
    cx += (tx + idle - cx) * 0.06; cy += (ty - cy) * 0.06;
    view();
    raf = requestAnimationFrame(sway);
  }
  layout(); view();
  (window.RoomCam = window.RoomCam || {}).view = () => { if (!pressed && pb.isConnected) view(); }; // (js/rm-room.js: redraw after looking round)
  addEventListener('resize', function rs() { if (!pb.isConnected) return removeEventListener('resize', rs); if (!pressed) { layout(); view(); } });
  if (!still && !pb.hidden && !forced) { pb.addEventListener('pointermove', aim); pb.addEventListener('pointerdown', aim); raf = requestAnimationFrame(sway); }

  // the little BIOS on the monitor is laid out so that, zoomed up to fill the screen, it sits exactly where the real one does
  function fitMini() {
    const em = parseFloat(getComputedStyle(pstage).fontSize) || 10, vw = innerWidth, vh = innerHeight;
    const k = Math.max(vw / (GW * em), vh / (GH * em)) * 1.03;
    const ox = (GW * em * k - vw) / 2, oy = (GH * em * k - vh) / 2;
    mini.style.cssText = `left:${(ox + 26) / k}px;top:${(oy + 22) / k}px;width:${(vw - 52) / k}px;font-size:${15 / k}px`;
    mstar.style.cssText = `right:${(ox + 30) / k}px;top:${(oy + 20) / k}px;font-size:${54 / k}px;text-shadow:0 0 ${12 / k}px #2a7ad8`;
    // the glass's own scanlines, sized so that zoomed right in they're exactly the full-screen CRT glass's (crt.js)
    glass.style.setProperty('--px', (1 / k).toFixed(4) + 'px');
    return k;
  }
  function power(auto) { // auto: a restart, nobody pressed anything
    if (pressed) return; pressed = true;
    layout(); keep = true; window.JHPBoot = 'room';
    try { localStorage.removeItem('jhp_off'); localStorage.setItem('jhp_last', String(Date.now())); } catch (e) {} // switched back on, including a refresh during BIOS
    if (auto !== true) { try { Sound.unlock(); } catch (e) {} Sound.play('thud'); }
    pstage.style.fontSize = getComputedStyle(pstage).fontSize; // so going full screen doesn't resize the room mid-zoom
    cancelAnimationFrame(raf); pb.removeEventListener('pointermove', aim);
    if (auto !== true) pbtn.classList.add('down');
    pb.classList.add('on');
    gate = new Promise(r => { openGate = r; });
    inWorldBoot = !!(window.House && House.ok && House.bootPC && House.bootPC());
    later(() => Sound.play('crt'), 260); // fans and the hard disk spinning up
    later(() => { pb.classList.add('mon'); fitMini(); glass.classList.add('warm'); }, 550); // the monitor gets a signal and warms up
    later(() => bios(!inWorldBoot), still ? 750 : 1150); // the BIOS starts on the monitor
    later(zoom, still || fast ? 1500 : 2000); // (with reduced motion it's a shorter, gentler move, but still a move)
    later(handover, 2000 + 3500); // (in case the animation frames stall, e.g. a background tab)
  }
  function zoom() { // the camera swings round to face the screen and moves in until the screen fills the window
    if (skipped || handed) return;
    if (inWorldBoot) { handover(); return; }
    const k = fitMini(), dolly = 1.3; // how much of it is the camera moving in (more looks fish-eyed up close); the rest is zoom
    const zEnd = PERSP * (1 - 1 / dolly), sEnd = Math.log(k / dolly), P0 = window.RoomCam && RoomCam.pose ? RoomCam.pose() : null, [x0, y0, z0] = P0 ? P0.t : roomPos(vrx, vry), rx0 = P0 ? P0.rx : vrx, ry0 = P0 ? P0.ry : vry; // (P0: wherever you're standing in the house)
    const T = still ? 1300 : fast ? 1650 : 2000, start = performance.now(), em = parseFloat(pstage.style.fontSize) || 10;
    pb.classList.add('go');
    (function frame(now) {
      if (skipped || pb.hidden) return;
      const t = Math.min(1, (now - start) / T), p = ease(Math.min(1, t / 0.8)), q = ease(t); // line up first, then the last of the zoom
      cam.style.transform = camAt((x0 * (1 - p)).toFixed(3), (y0 * (1 - p)).toFixed(3), (z0 * (1 - p) + zEnd * q).toFixed(3), Math.exp(sEnd * q).toFixed(4), (rx0 * (1 - p)).toFixed(3), (ry0 * (1 - p)).toFixed(3));
      if (t > 0.75) pb.classList.add('deep'); // by now only the screen is in view: stop drawing the rest
      // the last stretch is straight on (p = 1), so the real BIOS screen can ride in at the same size as the glass: the
      // monitor's own copy was drawn small and only gets stretched, which goes blurry this close
      // (from 0.6 it's within a few degrees of straight on, so the screen's centre just needs moving into place)
      if (t >= 0.6 && t < 1) { const z = z0 * (1 - p) + zEnd * q, f = PERSP / (PERSP - z); sharp(Math.exp(sEnd * q) * f / k, x0 * (1 - p) * em * f, y0 * (1 - p) * em * f); }
      if (t < 1) requestAnimationFrame(frame); else handover();
    })(start);
  }
  function sharp(s, dx, dy) {
    const scr = $('bootBios');
    if (!early) { // see-through, so the monitor's glass (its glow and scanlines) stays behind the sharp text; the small copy fades out
      early = true; scr.style.opacity = '0'; scr.style.background = 'transparent'; scr.style.transformOrigin = '50% 50%'; scr.hidden = false; void scr.offsetWidth;
      scr.style.transition = 'opacity .12s,background-color .25s'; scr.style.opacity = '1';
      for (const e of [mini, mstar]) { e.style.transition = 'opacity .12s'; e.style.opacity = '0'; }
    }
    scr.style.transform = `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) scale(${s.toFixed(4)})`;
  }
  function handover() { // swap the zoomed-in monitor for the real full-size BIOS screen (same text, same place)
    if (handed || skipped) return; handed = true;
    if (inWorldBoot) { roomOff(); openGate(); return; }
    const scr = $('bootBios');
    if (early) scr.style.transform = scr.style.background = ''; // (it fades to the real black as the full-screen glass comes in)
    else { scr.style.opacity = '0'; scr.hidden = false; void scr.offsetWidth; scr.style.transition = 'opacity .25s'; scr.style.opacity = '1'; }
    roomOff(); // (the full-screen CRT glass fades in with it)
    later(() => { pb.hidden = true; if (mirror) mirror.disconnect(); scr.style.transition = scr.style.opacity = scr.style.transformOrigin = ''; for (const e of [mini, mstar]) e.style.transition = e.style.opacity = ''; }, 320);
    later(() => openGate(), fast ? 450 : 900);
  }
  if (forced === 'bios') { pb.classList.add('auto'); later(() => power(true), 900); } else pb.classList.add('ready'); // a restart: the room, a pause, and it comes back on by itself

  // ---- 1. BIOS
  function bios(onMon) {
    const scr = $('bootBios'), out = $('biosText');
    if (onMon === true) { // copy the text onto the monitor as it appears (without the id, or the memory counter would count the copy)
      mirror = new MutationObserver(() => { mini.innerHTML = out.innerHTML.replace(/ id="memc"/g, ''); });
      mirror.observe(out, { childList: true, subtree: true, characterData: true });
    } else { scr.hidden = false; scr.classList.add('warm'); }
    Sound.play('beep');
    const lines = [
      ['JACKBIOS v4.51PG, Copyright (C) 1984-99', 0],
      ['', 0],
      ['Main Processor : JackCore II 450MHz', 150],
      ['Memory Testing : <span id="memc">0K</span>', 150],
    ];
    let t = 0;
    for (const [l, d] of lines) { t += d; later(() => { out.innerHTML += l + '\n'; }, t); }
    t += 100;
    later(() => { // count the memory up, like it always took forever to
      let k = 0;
      const iv = setInterval(() => { k = Math.min(65536, k + (quick ? 8192 : 2048)); const el = $('memc'); if (el) el.textContent = k + 'K'; if (k >= 65536) { clearInterval(iv); if (el) el.textContent = '65536K OK'; } }, 30);
      timers.push(iv);
    }, t);
    t += quick ? 300 : 1100;
    const rest = ['', 'Detecting IDE Primary Master   ... 6.4GB HARD DISK', 'Detecting IDE Primary Slave    ... None', 'Detecting IDE Secondary Master ... 32X CD-ROM', 'Detecting IDE Secondary Slave  ... None', '', 'Press DEL to enter SETUP'];
    for (const l of rest) { t += quick ? 60 : 220; later(() => { out.innerHTML += l + '\n'; }, t); }
    t += quick ? 300 : 900;
    later(() => gate.then(() => { if (skipped) return; scr.hidden = true; clean ? splash() : scandisk(); }), t); // waits for the zoom-in
  }

  // ---- 2. ScanDisk, because nobody ever shut it down properly
  function scandisk() {
    const scr = $('bootScan'); scr.hidden = false;
    const steps = ['Media descriptor', 'File allocation tables', 'Directory structure', 'File system', 'Free space', 'Surface scan'];
    const list = $('scanList');
    list.innerHTML = steps.map(s => `<div><span class="sm">&nbsp;</span> ${s}</div>`).join('');
    let i = 0;
    const tick = () => {
      const rows = list.children;
      if (i > 0) rows[i - 1].firstElementChild.innerHTML = '&#10003;';
      if (i < steps.length) { rows[i].firstElementChild.innerHTML = '&raquo;'; i++; later(tick, quick ? 120 : (i === steps.length ? 200 : 350)); }
      else surface();
    };
    tick();
    function surface() {
      let p = 0;
      const bar = $('scanBar'), pct = $('scanPct');
      const iv = setInterval(() => {
        p = Math.min(100, p + (quick ? 9 : 3) + Math.random() * 6);
        bar.style.width = p + '%'; pct.textContent = Math.floor(p) + '% complete';
        if (p >= 100) { clearInterval(iv); later(() => { scr.hidden = true; splash(); }, 400); }
      }, 70);
      timers.push(iv);
    }
  }

  // ---- 3. startup splash
  function paintSky(cv) { // soft, lumpy 1998 clouds: each one a heap of puffs, shaded blue-grey underneath and sunlit on top
    const w = Math.ceil(innerWidth * 1.18 / 2), h = Math.ceil(innerHeight / 2); // half size: softer, and quick to paint
    cv.width = w; cv.height = h;
    const c = cv.getContext && cv.getContext('2d'); if (!c) return;
    let seed = 1998; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const puff = (x, y, r, rgb, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.55, `rgba(${rgb},${a * 0.6})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
    const S = Math.min(w, h * 1.7), n = 15;
    for (let i = 0; i < n; i++) {
      const cx = (i + rnd() * 0.9) / n * w, cy = h * (0.04 + rnd() * 0.92), far = cy / h; // lower down = further away = flatter
      const cw = S * (0.1 + rnd() * 0.17) * (1.1 - far * 0.4), ch = cw * (0.5 - far * 0.2 + rnd() * 0.1);
      const pts = [];
      for (let j = 0, m = 55 + (rnd() * 40 | 0); j < m; j++) {
        const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
        const x = cx + Math.cos(a) * d * cw / 2, y = Math.min(cy + Math.sin(a) * d * ch / 2, cy + ch * 0.2); // a flattish bottom
        pts.push([x, y, (0.1 + rnd() * 0.14) * cw * (1.1 - 0.5 * d)]);
      }
      pts.sort((p, q) => p[1] - q[1]);
      pts.forEach(p => puff(p[0] + p[2] * 0.15, p[1] + p[2] * 0.35, p[2] * 1.15, '110,140,190', 0.22)); // the shady underside
      pts.forEach(p => puff(p[0], p[1], p[2], '228,237,250', 0.5));
      pts.forEach(p => { if (p[1] < cy + ch * 0.05) puff(p[0] - p[2] * 0.15, p[1] - p[2] * 0.3, p[2] * 0.62, '255,255,255', 0.5); }); // sunlit tops
    }
  }
  function splash() {
    const scr = $('bootSplash');
    try { paintSky(scr.querySelector('.sp-sky')); } catch (e) {}
    scr.hidden = false;
    later(() => Sound.play('startup'), 300);
    later(done, fast ? 1100 : quick ? 1500 : 3200); // the splash stays up while the boot screens fade away, so there's no black frame
  }

  // ---- 4. dial up JackNet
  function dial() {
    const body = document.createElement('div');
    const who = (window.Net && Net.me && Net.me.nick) || 'Guest';
    body.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:12px;align-items:flex-start">
      <svg viewBox="0 0 40 40" width="40" height="40" style="flex:none"><rect x="2" y="16" width="36" height="16" fill="#c0c0c0" stroke="#000"/><rect x="6" y="26" width="4" height="3" class="led a"/><rect x="12" y="26" width="4" height="3" class="led b"/><rect x="18" y="26" width="4" height="3" class="led c"/><path d="M8 12 Q20 2 32 12" stroke="#000" fill="none" stroke-width="2"/></svg>
      <div style="flex:1"><table style="font:12px var(--ui)"><tr><td style="width:80px">User name:</td><td><input type="text" value="${String(who).replace(/"/g, '')}" readonly style="width:150px"></td></tr><tr><td>Password:</td><td><input type="password" value="********" readonly style="width:150px"></td></tr><tr><td>Connect to:</td><td><b>JackNet 56K</b></td></tr></table>
      <div style="margin-top:8px">Status: <b id="dialStatus">Dialing...</b></div><div class="prog" style="margin-top:6px"><span style="display:flex;gap:2px" id="dialProg"></span></div></div></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="dialCancel">Cancel</button></div>`;
    const w = Desk.openWin('Connect To', body, 380);
    w.el.classList.add('dialwin');
    Sound.play('modem');
    const steps = [['Dialing...', 0], ['Dialing... (someone is on the phone)', quick ? 300 : 1300], ['Handshaking...', quick ? 600 : 2200], ['Verifying user name and password...', quick ? 1000 : 4200], ['Logging on to network...', quick ? 1300 : 5000]];
    const dt = [];
    for (const [s, ms] of steps) dt.push(setTimeout(() => { const el = $('dialStatus'); if (el) el.textContent = s; }, ms));
    const pi = setInterval(() => { const p = $('dialProg'); if (p && p.children.length < 26) p.appendChild(document.createElement('i')); }, quick ? 60 : 210);
    const end = () => {
      dt.forEach(clearTimeout); clearInterval(pi); w.close();
      Desk.toast('Connection established', 'Connected to JackNet at 49,333 bps. (It says 56K on the box.)', 5000);
      document.body.classList.add('online');
      cycling = false;
      if (inWorldBoot && window.House && House.ok) House.monitor();
      finish();
    };
    dt.push(setTimeout(end, fast ? 1000 : quick ? 1600 : 5800));
    body.querySelector('#dialCancel').addEventListener('click', end);
  }
})();

/* apps-fun: the JackOS 98 fun pack. Screen savers (with idle detection), Network Neighborhood + WinPopup,
 * Gubbinz the screen mate (and Gubbinz the Assistant), hidden web pages, loads of Run commands,
 * date events, My Briefcase, Online Services and the Jackotchi in the tray. */
(function () {
  'use strict';
  if (!window.Apps) return;
  const $ = id => document.getElementById(id);
  const esc = Apps.esc, store = Apps.store;
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const pad = (n, l) => String(n).padStart(l || 2, '0');
  const phone = () => innerWidth < 640 || matchMedia('(hover:none)').matches;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const booted = () => !$('boot');
  const play = n => { try { Sound.play(n); } catch (e) {} };
  // ?funtest=MMDD or ?funtest=MMDDHH pretends it's that day (and hour) for the date events
  const FT = location.search.match(/[?&]funtest=(\d{2})(\d{2})(\d{2})?/);
  const today = () => FT ? { m: +FT[1], d: +FT[2], md: +FT[1] * 100 + +FT[2], date: new Date(1999, +FT[1] - 1, +FT[2]) } : Desk.today99();
  const hourNow = () => FT && FT[3] ? +FT[3] : new Date().getHours();
  const d99 = () => { const t = today(); return pad(t.d) + '/' + pad(t.m) + '/99'; };
  const hhmm = () => { const d = new Date(); return d.getHours() + ':' + pad(d.getMinutes()); };
  const showBrowser = () => { const b = $('browser'); if (b) b.classList.remove('min'); };
  const nav = w => { showBrowser(); IE.navigate(w); };
  const S = (id, name, hint) => Apps.defineSecret('fun.' + id, name, hint);
  const got = id => Apps.secret('fun.' + id);
  const once = (k, fn) => { const seen = store.get('jhp_fun_once', {}); if (seen[k]) return false; seen[k] = 1; store.set('jhp_fun_once', seen); fn(); return true; };
  function seeded(str) { let x = 2166136261; for (const c of String(str)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); x |= 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; }

  // ================================================================ icons (chunky, hand-drawn, 32x32 viewBox)
  const I = {
    net: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="13" height="10" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="9" height="6" fill="#00a0a0"/><rect x="6" y="14" width="5" height="2" fill="#808080"/><rect x="17" y="12" width="13" height="10" fill="#c0c0c0" stroke="#000"/><rect x="19" y="14" width="9" height="6" fill="#00a0a0"/><rect x="21" y="22" width="5" height="2" fill="#808080"/><path d="M8 16v12h15v-4" stroke="#000" stroke-width="1.5" fill="none"/><rect x="2" y="26" width="28" height="3" fill="#ffd400" stroke="#7a5a00"/></svg>',
    pc: '<svg viewBox="0 0 32 32"><rect x="4" y="3" width="24" height="18" fill="#c0c0c0" stroke="#000"/><rect x="7" y="6" width="18" height="12" fill="#008080"/><path d="M9 8h6" stroke="#9ff" /><rect x="11" y="21" width="10" height="3" fill="#808080" stroke="#000"/><rect x="5" y="24" width="22" height="5" fill="#c0c0c0" stroke="#000"/><rect x="21" y="26" width="3" height="1" fill="#0c0"/></svg>',
    pcme: '<svg viewBox="0 0 32 32"><rect x="4" y="3" width="24" height="18" fill="#c0c0c0" stroke="#000"/><rect x="7" y="6" width="18" height="12" fill="#000080"/><path d="M12 9l4 3-4 3z" fill="#ffd400"/><rect x="11" y="21" width="10" height="3" fill="#808080" stroke="#000"/><rect x="5" y="24" width="22" height="5" fill="#c0c0c0" stroke="#000"/><rect x="21" y="26" width="3" height="1" fill="#0c0"/></svg>',
    pcoff: '<svg viewBox="0 0 32 32"><rect x="4" y="3" width="24" height="18" fill="#c0c0c0" stroke="#000"/><rect x="7" y="6" width="18" height="12" fill="#222"/><rect x="11" y="21" width="10" height="3" fill="#808080" stroke="#000"/><rect x="5" y="24" width="22" height="5" fill="#c0c0c0" stroke="#000"/><path d="M22 22l8 8M30 22l-8 8" stroke="#e10600" stroke-width="2"/></svg>',
    grotpc: '<svg viewBox="0 0 32 32"><rect x="3.5" y="2.5" width="25" height="19" fill="#d8d0b8" stroke="#000"/><path d="M4.5 3.5h23" stroke="#fff"/><rect x="6.5" y="5.5" width="19" height="13" fill="#0a1a3a" stroke="#808080"/><path d="M10 10l-3-3 1 5zM22 10l3-3-1 5z" fill="#3fa52c" stroke="#14300c" stroke-width=".6"/><ellipse cx="16" cy="12" rx="6" ry="5" fill="#3fa52c" stroke="#14300c" stroke-width=".7"/><ellipse cx="13.6" cy="11" rx="1.6" ry="1.8" fill="#fff"/><ellipse cx="18.4" cy="11" rx="1.6" ry="1.8" fill="#fff"/><circle cx="13.9" cy="11.3" r=".8"/><circle cx="18.7" cy="11.3" r=".8"/><path d="M13.5 14.4q2.5 1.8 5 0" stroke="#14300c" fill="none"/><rect x="11.5" y="21.5" width="9" height="2" fill="#b4ae98" stroke="#000"/><rect x="4.5" y="23.5" width="23" height="6" fill="#d8d0b8" stroke="#000"/><path d="M7 26.5h8" stroke="#555" stroke-width="1.4"/><rect x="23" y="25.5" width="2" height="1.5" fill="#3f3"/></svg>',
    world: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#2a7ad8" stroke="#003a80"/><path d="M8 10c3 1 4 4 7 3s2 5 5 5 2-6 6-6M6 20c4-1 5 3 9 2" stroke="#3a9a2a" stroke-width="3" fill="none"/><ellipse cx="16" cy="16" rx="6" ry="13" fill="none" stroke="#9fd0ff"/></svg>',
    group: '<svg viewBox="0 0 32 32"><circle cx="16" cy="13" r="10" fill="#2a7ad8" stroke="#003a80"/><path d="M8 10c3 1 4 4 7 3s4 3 7 1" stroke="#3a9a2a" stroke-width="3" fill="none"/><rect x="3" y="20" width="10" height="8" fill="#c0c0c0" stroke="#000"/><rect x="19" y="20" width="10" height="8" fill="#c0c0c0" stroke="#000"/><path d="M13 25h6" stroke="#000" stroke-width="1.5"/></svg>',
    share: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v16H2z" fill="#f2d16b" stroke="#7a5a00"/><path d="M2 12h28" stroke="#7a5a00"/><path d="M6 31c2-5 6-6 10-6h4v-3l6 5-6 5v-3h-4c-3 0-6 0-10 2z" fill="#3a6ad8" stroke="#000" stroke-width=".8"/></svg>',
    printer: '<svg viewBox="0 0 32 32"><rect x="8" y="3" width="16" height="9" fill="#fff" stroke="#555"/><rect x="3" y="12" width="26" height="11" rx="1" fill="#b8b8b8" stroke="#444"/><rect x="8" y="20" width="16" height="9" fill="#fff" stroke="#555"/><circle cx="25" cy="15" r="1.3" fill="#1a1"/><path d="M6 31c2-5 6-6 10-6h4v-3l6 5-6 5v-3h-4c-3 0-6 0-10 2z" fill="#3a6ad8" stroke="#000" stroke-width=".8"/></svg>',
    lockdir: Apps.ICON.lock,
    folder: Apps.ICON.folder, txt: Apps.ICON.txt, exe: Apps.ICON.exe, img: Apps.ICON.img,
    snd: '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M11 14h4l5-4v14l-5-4h-4z" fill="#ffd400" stroke="#000"/><path d="M22 13q2 4 0 8" stroke="#000" fill="none"/></svg>',
    popup: '<svg viewBox="0 0 32 32"><rect x="2" y="7" width="28" height="19" fill="#fff" stroke="#000"/><path d="M2 7l14 11 14-11" fill="#e8e8f8" stroke="#000"/><rect x="20" y="2" width="10" height="9" fill="#ffd400" stroke="#000"/><path d="M25 4v4M25 9v1" stroke="#000" stroke-width="1.5"/></svg>',
    brief: '<svg viewBox="0 0 32 32"><path d="M12 8V5h8v3" fill="none" stroke="#5a3a1a" stroke-width="2"/><rect x="3" y="8" width="26" height="19" rx="2" fill="#a0642a" stroke="#4a2a0a"/><path d="M3 15h26" stroke="#4a2a0a"/><rect x="13" y="13" width="6" height="5" fill="#ffd400" stroke="#7a5a00"/></svg>',
    online: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><path d="M2 12h28" stroke="#7a5a00"/><circle cx="20" cy="20" r="7" fill="#2a7ad8" stroke="#003a80"/><path d="M15 18c2 0 3 2 5 1s3 2 5 1" stroke="#3a9a2a" stroke-width="2" fill="none"/><path d="M8 26l4-6" stroke="#e10600" stroke-width="2"/></svg>',
    isp: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#ffd400" stroke="#7a5a00"/><circle cx="16" cy="16" r="5" fill="#fff" stroke="#7a5a00"/><path d="M5 12a12 12 0 0 1 8-8" stroke="#fff" stroke-width="2" fill="none"/></svg>',
    dos: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="24" fill="#000" stroke="#808080"/><rect x="2" y="4" width="28" height="4" fill="#000080"/><path d="M6 13l4 3-4 3" stroke="#c0c0c0" stroke-width="1.5" fill="none"/><rect x="12" y="18" width="6" height="2" fill="#c0c0c0"/></svg>',
    saver: '<svg viewBox="0 0 32 32"><rect x="3" y="3" width="26" height="20" fill="#c0c0c0" stroke="#000"/><rect x="6" y="6" width="20" height="14" fill="#000"/><circle cx="11" cy="10" r="1" fill="#fff"/><circle cx="20" cy="15" r="1" fill="#fff"/><circle cx="16" cy="9" r=".7" fill="#fff"/><circle cx="14" cy="16" r="2" fill="#e8381b"/><path d="M12 15l-3-2M16 15l3-2" stroke="#fff"/><rect x="11" y="23" width="10" height="3" fill="#808080"/><rect x="7" y="26" width="18" height="3" fill="#c0c0c0" stroke="#000"/></svg>',
    flag: '<svg viewBox="0 0 64 56"><g transform="skewY(-8)"><path d="M6 14q7-3 13 0t13 0v19q-7 3-13 0t-13 0z" fill="#e10600"/><path d="M34 14q7-3 13 0t13 0v19q-7 3-13 0t-13 0z" fill="#0a0"/><path d="M6 36q7-3 13 0t13 0v19q-7 3-13 0t-13 0z" fill="#0028c8"/><path d="M34 36q7-3 13 0t13 0v19q-7 3-13 0t-13 0z" fill="#ffd400"/></g></svg>',
    egg: '<svg viewBox="0 0 16 16"><ellipse cx="8" cy="9" rx="6" ry="6.5" fill="#ff7ac8" stroke="#000" stroke-width=".8"/><rect x="5" y="6" width="6" height="5" fill="#9bbc0f" stroke="#000" stroke-width=".5"/><circle cx="6" cy="13.5" r=".9" fill="#ffd400"/><circle cx="8" cy="14" r=".9" fill="#ffd400"/><circle cx="10" cy="13.5" r=".9" fill="#ffd400"/></svg>',
    note: '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" fill="#ffef80" stroke="#a08000"/><path d="M8 10h16M8 15h16M8 20h10" stroke="#a08000"/></svg>',
    ufo: '<svg viewBox="0 0 64 32"><ellipse cx="32" cy="12" rx="12" ry="9" fill="#9fd0ff" stroke="#000" stroke-opacity=".5"/><ellipse cx="32" cy="18" rx="30" ry="8" fill="#a0a0a8" stroke="#333"/><ellipse cx="32" cy="16" rx="22" ry="3" fill="#d0d0d8"/><circle cx="12" cy="20" r="2" fill="#ff0"/><circle cx="24" cy="23" r="2" fill="#0f0"/><circle cx="40" cy="23" r="2" fill="#f0f"/><circle cx="52" cy="20" r="2" fill="#0ff"/><rect x="29" y="8" width="2" height="2" fill="#0a0"/><rect x="33" y="8" width="2" height="2" fill="#0a0"/></svg>',
  };
  // the official JackOS 98 icons (icons.js) where they're the specific match
  if (window.JICON) Object.assign(I, { net: JICON.icon('network'), printer: JICON.icon('printer'), brief: JICON.icon('briefcase'), dos: JICON.icon('dos'), saver: JICON.icon('screensaver'), online: JICON.icon('online'), popup: JICON.icon('popup') , pc: JICON.icon('computer'), world: JICON.icon('entirenet'), group: JICON.icon('network') });
  const ico16 = s => `<span class="ff-i16">${s}</span>`;

  // ================================================================ 1. SCREEN SAVERS
  // Every saver is a factory(g, W, H, o) -> { frame(dt, t), gold?() }. o.k scales sizes (1 = 600px tall screen).
  const SAVERS = {};
  const SAVER_ORDER = ['Flying Saucers', 'Starfield Simulation', '3D Pipes', 'Mystify Your Mind', '3D Text', 'Marquee', 'Curves and Colors', 'Digital Rain'];
  // savers that were renamed: anything picked (or asked for) under its old name keeps working
  const OLDSAVER = { 'Flying Squigs': 'Flying Saucers', 'WAAAGH! Rain': 'Digital Rain' };
  try { const v = localStorage.getItem('jhp_saver'), q = v && v[0] === '"', raw = q ? JSON.parse(v) : v; if (raw && OLDSAVER[raw]) localStorage.setItem('jhp_saver', q ? JSON.stringify(OLDSAVER[raw]) : OLDSAVER[raw]); } catch (e) {}
  try { const sn = store.get('jhp_fun_ssseen', null); if (Array.isArray(sn) && sn.some(n => OLDSAVER[n])) store.set('jhp_fun_ssseen', sn.map(n => OLDSAVER[n] || n)); } catch (e) {}
  const saverText = () => String(store.get('jhp_fun_sstext', 'JACK ATTACK!') || 'JACK ATTACK!').slice(0, 24);

  // ---- Starfield Simulation: warp speed, Mr Sulu (it's a different show, Dave)
  SAVERS['Starfield Simulation'] = (g, W, H, o) => {
    const N = Math.round(Math.min(600, 90 + W * H / 2600)), st = [];
    const reset = (s, far) => { s.x = rnd(-1, 1); s.y = rnd(-1, 1); s.z = far ? rnd(0.7, 1) : rnd(0.04, 1); s.pz = s.z; };
    for (let i = 0; i < N; i++) { const s = {}; reset(s); st.push(s); }
    const cx = W / 2, cy = H / 2, F = Math.max(W, H) * 0.42;
    return { frame(dt) {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      for (const s of st) {
        s.pz = s.z; s.z -= dt * 0.32;
        if (s.z <= 0.03) { reset(s, true); continue; }
        const x = cx + s.x / s.z * F, y = cy + s.y / s.z * F;
        if (x < -10 || y < -10 || x > W + 10 || y > H + 10) { reset(s, true); continue; }
        const px = cx + s.x / s.pz * F, py = cy + s.y / s.pz * F, b = Math.min(1, (1 - s.z) * 1.4);
        g.strokeStyle = `rgba(255,255,255,${b.toFixed(2)})`; g.lineWidth = Math.max(1, (1 - s.z) * 3.2 * Math.max(0.4, o.k));
        g.beginPath(); g.moveTo(px, py); g.lineTo(x + 0.1, y + 0.1); g.stroke();
      }
    } };
  };

  // ---- Flying Saucers (was Flying Squigs; key renamed, old name aliased): little UFOs and steaming pies, drifting diagonally down the screen forever
  const SQ = (() => { // sprites are drawn once, then blitted
    const make = (w, ht, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = ht; fn(c.getContext('2d')); return c; };
    // a classic 1950s flying saucer: chrome disc, glass dome (little green pilot), rim lights that chase round each frame
    function saucer(g, f, gold) {
      const x = 42, y = 34;
      g.save(); g.translate(x, y); g.rotate(-0.16); g.translate(-x, -y);
      // under-glow
      const gl = g.createRadialGradient(x, y + 9, 2, x, y + 9, 24); gl.addColorStop(0, gold ? 'rgba(255,230,120,.55)' : 'rgba(120,255,160,.5)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.beginPath(); g.ellipse(x, y + 10, 26, 9, 0, 0, 7); g.fill();
      // dome (glass) with pilot
      const dg = g.createRadialGradient(x - 6, y - 16, 1, x, y - 8, 18); dg.addColorStop(0, '#f4ffff'); dg.addColorStop(0.35, gold ? '#fff2a8' : '#9ff0ff'); dg.addColorStop(1, gold ? '#b08a20' : '#2a7aa8');
      g.fillStyle = dg; g.beginPath(); g.ellipse(x, y - 3, 16, 18, 0, Math.PI, 0); g.closePath(); g.fill();
      g.fillStyle = '#4cb83a'; g.beginPath(); g.ellipse(x + 1, y - 4, 7, 4, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#5fd04a'; g.beginPath(); g.ellipse(x + 1, y - 9, 6, 6.5, 0, 0, 7); g.fill();
      g.strokeStyle = '#5fd04a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 2, y - 14); g.lineTo(x - 5, y - 19); g.moveTo(x + 4, y - 14); g.lineTo(x + 7, y - 19); g.stroke();
      g.fillStyle = '#ff4'; g.beginPath(); g.arc(x - 5, y - 19, 1.6, 0, 7); g.arc(x + 7, y - 19, 1.6, 0, 7); g.fill();
      g.fillStyle = '#000'; g.beginPath(); g.ellipse(x - 1.5, y - 10, 1.8, 2.6, 0, 0, 7); g.ellipse(x + 3.5, y - 10, 1.8, 2.6, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.fillRect(x - 2, y - 11, 1, 1); g.fillRect(x + 3, y - 11, 1, 1);
      g.strokeStyle = '#1a5a10'; g.lineWidth = 1; g.beginPath(); g.arc(x + 1, y - 6.5, 2, 0.2, Math.PI - 0.2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x - 9, y - 12, 2.4, 5, 0.5, 0, 7); g.fill();
      g.strokeStyle = gold ? '#7a5a00' : '#1a3a5a'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y - 3, 16, 18, 0, Math.PI, 0); g.stroke();
      // the disc: top face then the rim band
      const tg = g.createLinearGradient(0, y - 8, 0, y + 8);
      if (gold) { tg.addColorStop(0, '#fff8c0'); tg.addColorStop(0.45, '#ffd400'); tg.addColorStop(0.55, '#c08a00'); tg.addColorStop(1, '#6a4800'); }
      else { tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.45, '#c4cad4'); tg.addColorStop(0.55, '#7a8290'); tg.addColorStop(1, '#3a404a'); }
      g.fillStyle = tg; g.beginPath(); g.ellipse(x, y, 38, 10, 0, 0, 7); g.fill();
      g.strokeStyle = gold ? '#5a3a00' : '#22262e'; g.lineWidth = 1.5; g.stroke();
      g.strokeStyle = gold ? 'rgba(255,255,220,.8)' : 'rgba(255,255,255,.8)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y - 1, 30, 5.5, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      g.fillStyle = gold ? '#8a6200' : '#4a505a'; g.beginPath(); g.ellipse(x, y + 7, 15, 4, 0, 0, Math.PI); g.fill();
      // rim lights
      const cols = ['#ff3030', '#ffd400', '#30ff60', '#30c8ff'];
      for (let i = 0; i < 9; i++) {
        const t = Math.PI * (0.08 + i * 0.105), lx = x - Math.cos(t) * 33, ly = y + Math.sin(t) * 6.5;
        const on = (i + f) % 3 === 0, k = cols[(i + f) % 4];
        if (on) { g.fillStyle = k; g.globalAlpha = 0.35; g.beginPath(); g.arc(lx, ly, 4.5, 0, 7); g.fill(); g.globalAlpha = 1; }
        g.fillStyle = on ? '#fff' : k; g.beginPath(); g.arc(lx, ly, on ? 2.2 : 1.7, 0, 7); g.fill();
        if (!on) { g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 0.6; g.stroke(); }
      }
      g.restore();
    }
    const squig = [], gold = []; // (kept names) the six frames of the saucer, and the rare golden one
    for (let f = 0; f < 6; f++) {
      const bob = Math.sin(f / 6 * Math.PI * 2) * 1.5;
      const draw = gl => g => { g.translate(0, bob); saucer(g, f, gl); };
      squig.push(make(84, 64, draw(false))); gold.push(make(84, 64, draw(true)));
    }
    function pie(gl) {
      return make(84, 64, g => {
        // steam
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
        for (const sx of [32, 44, 56]) { g.beginPath(); g.moveTo(sx, 22); g.quadraticCurveTo(sx - 5, 16, sx, 10); g.quadraticCurveTo(sx + 5, 5, sx, 0); g.stroke(); }
        // dish
        g.fillStyle = '#9a9aa8'; g.beginPath(); g.moveTo(12, 40); g.lineTo(72, 40); g.lineTo(66, 54); g.lineTo(18, 54); g.closePath(); g.fill();
        g.fillStyle = '#c8c8d4'; g.fillRect(12, 38, 60, 4);
        // crust dome
        const grd = g.createLinearGradient(0, 22, 0, 42); grd.addColorStop(0, gl ? '#fff3a0' : '#f2c46b'); grd.addColorStop(1, gl ? '#d0a000' : '#b0742a');
        g.fillStyle = grd; g.beginPath(); g.moveTo(14, 40); g.quadraticCurveTo(16, 22, 42, 22); g.quadraticCurveTo(68, 22, 70, 40); g.closePath(); g.fill();
        g.strokeStyle = gl ? '#a07000' : '#7a4a1a'; g.lineWidth = 2;
        for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(20 + i * 12, 38); g.lineTo(28 + i * 12, 25); g.stroke(); }
        // a tiny green alien peeking out through a hole in the crust (he came for the pie)
        g.fillStyle = '#3a1a08'; g.beginPath(); g.ellipse(46, 31, 9, 4.5, 0, 0, 7); g.fill();
        g.fillStyle = '#5fd04a'; g.beginPath(); g.ellipse(46, 30, 6.5, 4.5, 0, Math.PI, 0); g.closePath(); g.fill();
        g.strokeStyle = '#5fd04a'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(43, 27); g.lineTo(40, 21); g.moveTo(49, 27); g.lineTo(52, 21); g.stroke();
        g.fillStyle = '#ffe14a'; g.beginPath(); g.arc(40, 21, 1.6, 0, 7); g.arc(52, 21, 1.6, 0, 7); g.fill();
        g.fillStyle = '#000'; g.beginPath(); g.ellipse(43.5, 29, 1.4, 2, 0, 0, 7); g.ellipse(48.5, 29, 1.4, 2, 0, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.fillRect(43, 28, 1, 1); g.fillRect(48, 28, 1, 1);
        g.fillStyle = gl ? '#d0a000' : '#b0742a'; g.beginPath(); g.ellipse(46, 31.5, 9, 2, 0, 0, Math.PI); g.fill();
        if (gl) { g.fillStyle = '#fff'; for (const [sx, sy] of [[20, 26], [64, 30], [36, 20]]) { g.fillRect(sx - 4, sy, 9, 1); g.fillRect(sx, sy - 4, 1, 9); } }
      });
    }
    return { squig, gold, pie: pie(false), gpie: pie(true) };
  })();
  SAVERS['Flying Saucers'] = (g, W, H, o) => {
    const sc = Math.max(0.28, Math.min(1.7, o.k * 1.2)), N = Math.max(5, Math.min(16, Math.round(W * H / 70000)));
    const list = [];
    const spawn = (first) => {
      const kind = Math.random() < 0.3 ? 'pie' : 'squig', goldy = Math.random() < (kind === 'pie' ? 0.06 : 0.025);
      const sp = (kind === 'pie' ? rnd(38, 55) : rnd(60, 110)) * sc;
      let x, y;
      for (let tries = 0; tries < 12; tries++) {
        if (first) { x = rnd(0, W + 200 * sc); y = rnd(-100 * sc, H); }
        else if (Math.random() < W / (W + H)) { x = rnd(W * 0.15, W + 80 * sc); y = -70 * sc; } else { x = W + 30 * sc; y = rnd(-70 * sc, H * 0.7); }
        if (!list.some(s => Math.abs(s.x - x) < 80 * sc && Math.abs(s.y - y) < 70 * sc)) break;
      }
      return { kind, gold: goldy, x, y, sp, f: Math.random() * 6, fr: rnd(9, 13) };
    };
    for (let i = 0; i < N; i++) list.push(spawn(true));
    return {
      frame(dt) {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        list.sort((a, b) => a.sp - b.sp);
        for (let i = 0; i < list.length; i++) {
          const s = list[i];
          s.x -= s.sp * dt; s.y += s.sp * dt * 0.55; s.f += dt * s.fr;
          if (s.x < -90 * sc || s.y > H + 10) { list[i] = spawn(false); continue; }
          const img = s.kind === 'pie' ? (s.gold ? SQ.gpie : SQ.pie) : (s.gold ? SQ.gold : SQ.squig)[Math.floor(s.f) % 6];
          g.drawImage(img, s.x, s.y, 84 * sc, 64 * sc);
        }
      },
      gold: () => list.some(s => s.gold && s.x > -40 && s.x < W && s.y > -30 && s.y < H),
    };
  };

  // ---- 3D Pipes: a plumber's nightmare, in pseudo-3D with shading and ball joints
  SAVERS['3D Pipes'] = (g, W, H, o) => {
    const NX = 16, NY = 11, NZ = 10, ZOFF = 9;
    const F = (W / 2) * (ZOFF + NZ / 2) / (NX / 2) * 0.92;
    const occ = new Uint8Array(NX * NY * NZ), key = (x, y, z) => (z * NY + y) * NX + x;
    const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    const HUES = [0, 120, 220, 50, 180, 300, 28, 90, 260];
    let pipe = null, used = 0, pipes = 0, acc = 0, fade = 0, turns = 0, plen = 0;
    const proj = (x, y, z) => { const Z = z + ZOFF; return [W / 2 + (x - NX / 2 + 0.5) * F / Z, H / 2 - (y - NY / 2 + 0.5) * F / Z, 0.2 * F / Z]; };
    const free = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < NX && y < NY && z < NZ && !occ[key(x, y, z)];
    const col = (hue, l) => `hsl(${hue},75%,${l}%)`;
    function ball(p, hue, r, squig) {
      const grd = g.createRadialGradient(p[0] - r * 0.4, p[1] - r * 0.4, r * 0.1, p[0], p[1], r);
      grd.addColorStop(0, squig ? '#ffb090' : col(hue, 88)); grd.addColorStop(0.45, squig ? '#e8381b' : col(hue, 50)); grd.addColorStop(1, squig ? '#5a0a00' : col(hue, 14));
      g.fillStyle = grd; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill();
      if (squig) { g.fillStyle = '#fff'; g.fillRect(p[0] - r * 0.5, p[1] - r * 0.35, r * 0.35, r * 0.35); g.fillRect(p[0] + r * 0.15, p[1] - r * 0.35, r * 0.35, r * 0.35); g.fillStyle = '#300'; g.fillRect(p[0] - r * 0.5, p[1] + r * 0.2, r, r * 0.25); }
    }
    function seg(a, b, hue) {
      const p1 = proj(...a), p2 = proj(...b), r = (p1[2] + p2[2]) / 2;
      let dx = p2[0] - p1[0], dy = p2[1] - p1[1]; const len = Math.hypot(dx, dy);
      if (len < 0.5) { ball(p2, hue, p2[2] * 1.05); return; } // heading straight at us: just a disc
      dx /= len; dy /= len; const nx = -dy, ny = dx;
      const grd = g.createLinearGradient(p1[0] + nx * r, p1[1] + ny * r, p1[0] - nx * r, p1[1] - ny * r);
      grd.addColorStop(0, col(hue, 12)); grd.addColorStop(0.3, col(hue, 48)); grd.addColorStop(0.45, col(hue, 86)); grd.addColorStop(0.65, col(hue, 45)); grd.addColorStop(1, col(hue, 10));
      g.fillStyle = grd; g.beginPath();
      g.moveTo(p1[0] + nx * p1[2], p1[1] + ny * p1[2]); g.lineTo(p2[0] + nx * p2[2], p2[1] + ny * p2[2]);
      g.lineTo(p2[0] - nx * p2[2], p2[1] - ny * p2[2]); g.lineTo(p1[0] - nx * p1[2], p1[1] - ny * p1[2]); g.closePath(); g.fill();
    }
    function newPipe() {
      for (let t = 0; t < 40; t++) {
        const x = ri(0, NX - 1), y = ri(0, NY - 1), z = ri(0, NZ - 1);
        if (free(x, y, z)) { occ[key(x, y, z)] = 1; used++; pipes++; pipe = { p: [x, y, z], d: pick(DIRS), hue: HUES[pipes % HUES.length] + ri(-8, 8) }; ball(proj(x, y, z), pipe.hue, proj(x, y, z)[2] * 1.15); return true; }
      }
      return false;
    }
    function clear() { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); occ.fill(0); used = 0; pipes = 0; pipe = null; }
    clear();
    function step() {
      if (!pipe && !newPipe()) { fade = 1; return; }
      if (++plen > 70 && Math.random() < 0.04) { const pp = proj(...pipe.p); ball(pp, pipe.hue, pp[2] * 1.15); pipe = null; plen = 0; return; }
      const [x, y, z] = pipe.p;
      let d = pipe.d;
      const ok = dd => free(x + dd[0], y + dd[1], z + dd[2]);
      if (!ok(d) || Math.random() < 0.2) { const opts = DIRS.filter(ok); if (!opts.length) { pipe = null; if (pipes > 9 || used > NX * NY * NZ * 0.45) fade = 1; return; } const nd = pick(opts); if (nd !== d) { const pp = proj(x, y, z); ball(pp, pipe.hue, pp[2] * 1.12, ++turns % 47 === 0); } d = nd; }
      const n = [x + d[0], y + d[1], z + d[2]];
      seg(pipe.p, n, pipe.hue);
      occ[key(...n)] = 1; used++; pipe.p = n; pipe.d = d;
    }
    return { frame(dt) {
      if (fade > 0) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 0, W, H); fade -= dt; if (fade <= 0) clear(); return; }
      acc += dt; while (acc > 0.04) { acc -= 0.04; step(); if (fade > 0) break; }
    } };
  };

  // ---- Mystify Your Mind: two bouncing polygons with ghostly trails
  SAVERS['Mystify Your Mind'] = (g, W, H, o) => {
    const sp = Math.max(60, Math.min(W, H) * 0.35);
    const shapes = [0, 1].map(i => ({ hue: i * 160, pts: [0, 1, 2, 3].map(() => ({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-1, 1) * sp, vy: rnd(-1, 1) * sp })), trail: [] }));
    let acc = 0;
    return { frame(dt) {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      acc += dt;
      for (const s of shapes) {
        for (const p of s.pts) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < 0 || p.x > W) { p.vx *= -1; p.x = Math.max(0, Math.min(W, p.x)); } if (p.y < 0 || p.y > H) { p.vy *= -1; p.y = Math.max(0, Math.min(H, p.y)); } }
        s.hue = (s.hue + dt * 22) % 360;
        if (acc > 0.045) { s.trail.unshift(s.pts.map(p => [p.x, p.y])); if (s.trail.length > 9) s.trail.pop(); }
        s.trail.forEach((tp, i) => {
          g.strokeStyle = `hsla(${s.hue},100%,60%,${(1 - i / 9).toFixed(2)})`; g.lineWidth = i ? 1 : 1.6;
          g.beginPath(); tp.forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.stroke();
        });
      }
      if (acc > 0.045) acc = 0;
    } };
  };

  // ---- 3D Text: the words spin and wobble in glorious extruded 3D (well, 2.5D)
  SAVERS['3D Text'] = (g, W, H, o) => {
    const txt = saverText(), fs = Math.max(14, Math.round(Math.min(W / (txt.length * 0.62 + 1), H / 3.2)));
    const font = `${fs}px Anton, Impact, "Arial Black", sans-serif`;
    const m = document.createElement('canvas').getContext('2d'); m.font = font;
    const tw = Math.ceil(m.measureText(txt).width) + 8, th = Math.ceil(fs * 1.3);
    const mk = fill => { const c = document.createElement('canvas'); c.width = tw; c.height = th; const x = c.getContext('2d'); x.font = font; x.textBaseline = 'middle'; x.fillStyle = fill(x); x.fillText(txt, 4, th / 2); return c; };
    const face = mk(x => { const gr = x.createLinearGradient(0, th * 0.15, 0, th * 0.85); gr.addColorStop(0, '#fff6a0'); gr.addColorStop(0.45, '#ffd400'); gr.addColorStop(0.55, '#e88a00'); gr.addColorStop(1, '#ffef60'); return gr; });
    const side = mk(() => '#7a1a00'), dark = mk(() => '#3a0800');
    let t = 0;
    return { frame(dt) {
      t += dt;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const a = Math.sin(t * 0.55) * 1.3 + (Math.floor(t / 23) % 2 ? (k => k * k * (3 - 2 * k))((t % 23) / 23) * Math.PI * 2 : 0), sx = Math.cos(a), sy = 0.82 + 0.18 * Math.cos(t * 1.3), depth = fs * 0.22;
      const cx = W / 2 + Math.sin(t * 0.37) * W * 0.12, cy = H / 2 + Math.sin(t * 0.53) * H * 0.18;
      const layers = 16, dx = Math.sin(a) * depth / layers, dy = Math.sin(t * 1.3) * depth * 0.4 / layers;
      for (let i = layers; i > 0; i--) {
        g.save(); g.translate(cx + dx * i, cy + dy * i); g.scale(sx, sy);
        g.drawImage(i > layers * 0.6 ? dark : side, -tw / 2, -th / 2); g.restore();
      }
      g.save(); g.translate(cx, cy); g.scale(sx, sy); g.drawImage(face, -tw / 2, -th / 2);
      const shade = 0.65 - Math.abs(sx) * 0.9; // edge-on = darker, like light falling across it
      if (shade > 0) { g.globalAlpha = Math.min(0.6, shade); g.drawImage(dark, -tw / 2, -th / 2); }
      g.restore();
    } };
  };

  // ---- Marquee: the words scroll across, a different height every pass
  SAVERS['Marquee'] = (g, W, H, o) => {
    const txt = saverText(), fs = Math.max(12, Math.round(H / 7));
    const COLS = [['#000080', '#ffd400'], ['#000', '#00e5ff'], ['#800000', '#fff'], ['#004000', '#b6ff00']];
    let x = W, y = H / 2, ci = 0;
    g.font = `italic bold ${fs}px "Times New Roman", Times, serif`;
    let tw = g.measureText(txt).width;
    return { frame(dt) {
      const [bg, fg] = COLS[ci % COLS.length];
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.font = `italic bold ${fs}px "Times New Roman", Times, serif`; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillText(txt, x + fs * 0.06, y + fs * 0.06);
      g.fillStyle = fg; g.fillText(txt, x, y);
      x -= dt * Math.max(60, W * 0.18);
      if (x < -tw) { x = W; y = rnd(fs, H - fs); ci++; tw = g.measureText(txt).width; }
    } };
  };

  // ---- Curves and Colors: sweeping Bezier ribbons that slowly change colour
  SAVERS['Curves and Colors'] = (g, W, H, o) => {
    const sp = Math.max(50, Math.min(W, H) * 0.3);
    const pts = [0, 1, 2, 3].map(() => ({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-1, 1) * sp, vy: rnd(-1, 1) * sp }));
    let hue = rnd(0, 360), t = 0;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    return { frame(dt) {
      t += dt;
      g.fillStyle = 'rgba(0,0,0,.035)'; g.fillRect(0, 0, W, H);
      for (let k = 0; k < 2; k++) {
        for (const p of pts) { p.x += p.vx * dt / 2; p.y += p.vy * dt / 2; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
        hue = (hue + dt * 12) % 360;
        g.lineWidth = Math.max(1, o.k * 1.6);
        g.strokeStyle = `hsl(${hue},100%,60%)`;
        g.beginPath(); g.moveTo(pts[0].x, pts[0].y); g.bezierCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y); g.stroke();
        g.strokeStyle = `hsl(${(hue + 180) % 360},100%,60%)`;
        g.beginPath(); g.moveTo(W - pts[0].x, H - pts[0].y); g.bezierCurveTo(W - pts[1].x, H - pts[1].y, W - pts[2].x, H - pts[2].y, W - pts[3].x, H - pts[3].y); g.stroke();
      }
    } };
  };

  // ---- Digital Rain (was WAAAGH! Rain): green glyphs pouring down the screen. Optional message typed in the middle.
  SAVERS['Digital Rain'] = (g, W, H, o) => {
    const fs = Math.max(7, Math.round(16 * Math.max(0.45, Math.min(1.2, o.k)))), cols = Math.ceil(W / fs);
    const GL = 'WAGHDKTEFZORMBSQNPX0123456789!#%&*+=<>/\\|:;'.split('');
    const WORDS = ['WAAAGH', 'JACKOS', 'RUPEES', 'Y2K', 'N64', 'TETRIS', 'MODEM', 'REBOOT', 'PIXEL', 'FLOPPY'];
    const drops = Array.from({ length: cols }, () => ({ y: rnd(-H, 0), sp: rnd(6, 16), word: null, wi: 0 }));
    const msg = o.msg || null; let mt = 0;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    return { frame(dt) {
      g.fillStyle = 'rgba(0,0,0,.09)'; g.fillRect(0, 0, W, H);
      g.font = `bold ${fs}px "Courier New", monospace`; g.textBaseline = 'top';
      for (let i = 0; i < cols; i++) {
        const d = drops[i], prev = Math.floor(d.y / fs);
        d.y += d.sp * fs * dt;
        const row = Math.floor(d.y / fs);
        if (row !== prev) {
          let ch = pick(GL);
          if (d.word) { ch = d.word[d.wi++]; if (d.wi >= d.word.length) d.word = null; } else if (Math.random() < 0.006) { d.word = pick(WORDS); d.wi = 0; }
          g.fillStyle = '#1f8f1f'; g.fillText(pick(GL), i * fs, (row - 1) * fs);
          g.fillStyle = d.word ? '#b6ff00' : '#d8ffd8'; g.fillText(ch, i * fs, row * fs);
        }
        if (d.y > H + rnd(0, H * 0.6)) { d.y = rnd(-H * 0.3, 0); d.sp = rnd(6, 16); }
      }
      if (msg) {
        mt += dt;
        let n = Math.floor(mt * 14), line = 0;
        while (line < msg.length - 1 && n > msg[line].length + 22) { n -= msg[line].length + 22; line++; }
        const s = msg[line].slice(0, n), f2 = Math.max(14, Math.round(W / 38));
        g.font = `bold ${f2}px "Courier New", monospace`; g.textBaseline = 'middle';
        const w2 = g.measureText(msg[line]).width;
        g.fillStyle = '#000'; g.fillRect(W / 2 - w2 / 2 - 14, H / 2 - f2, w2 + 28, f2 * 2);
        g.fillStyle = '#5f5'; g.fillText(s + ((mt * 2 | 0) % 2 ? '_' : ''), W / 2 - w2 / 2, H / 2);
      }
    } };
  };

  // ---- the runner: drives a saver on any canvas. Returns stop().
  function runSaver(canvas, name, full, opts) {
    const make = SAVERS[OLDSAVER[name] || name] || SAVERS['Flying Saucers'];
    const g = canvas.getContext('2d');
    let W = 0, H = 0, inst, raf = 0, last = 0, stopped = false;
    const build = () => {
      const r = canvas.getBoundingClientRect();
      W = canvas.width = Math.max(40, Math.round(full ? innerWidth : (r.width || canvas.width)));
      H = canvas.height = Math.max(30, Math.round(full ? innerHeight : (r.height || canvas.height)));
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      inst = make(g, W, H, Object.assign({ full, k: Math.min(W, H) / 600 }, opts || {}));
    };
    build();
    const frame = t => {
      if (stopped) return;
      if (!canvas.isConnected) { stop(); return; }
      raf = requestAnimationFrame(frame);
      if (!full && !canvas.getClientRects().length) { last = 0; return; } // preview hidden (window minimised): skip the work
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
      try { inst.frame(dt, t / 1000); } catch (e) { stop(); }
    };
    raf = requestAnimationFrame(frame);
    const onRes = () => build();
    if (full) addEventListener('resize', onRes);
    function stop() { stopped = true; cancelAnimationFrame(raf); if (full) removeEventListener('resize', onRes); }
    stop.inst = () => inst;
    return stop;
  }

  // ---- full screen + idle detection
  let ssOn = null, lastInput = Date.now();
  const rawGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  function saverName() { let v = rawGet('jhp_saver'); if (v && v[0] === '"') { try { v = JSON.parse(v); } catch (e) {} } return v == null ? 'Flying Saucers' : (OLDSAVER[v] || String(v)); }
  function saverWait() { const v = rawGet('jhp_saverwait'); if (v == null || v === '') return 3; const n = parseFloat(String(v).replace(/"/g, '')); return isFinite(n) ? Math.max(0, n) : 3; }
  function startSaver(name, opts) {
    if (ssOn) return;
    // the Plasma Ball downloaded from the website runs the site's own full-screen version when it is about
    if (name === PLASMA && window.Plasma && typeof Plasma.fullscreen === 'function' && !(opts && opts.preview)) { closeOverlays(); lastInput = Date.now(); try { Plasma.fullscreen(); } catch (e) {} return; }
    name = OLDSAVER[name] || name; name = SAVERS[name] ? name : 'Flying Saucers';
    closeOverlays();
    const el = h('div', 'ff-saver'); el.id = 'ffSaver'; el.setAttribute('aria-label', name + ' screen saver (press any key)');
    const c = document.createElement('canvas'); el.appendChild(c);
    document.body.appendChild(el);
    const stop = runSaver(c, name, true, opts);
    ssOn = { el, stop, name, t0: Date.now(), from: null };
    ssOn.timer = setTimeout(() => { if (ssOn && ssOn.el === el) got('saver60'); }, 60000);
    const seen = store.get('jhp_fun_ssseen', []);
    if (!seen.includes(name)) { seen.push(name); store.set('jhp_fun_ssseen', seen); }
    if (SAVER_ORDER.every(n => seen.includes(n))) got('saverall');
    if (opts && opts.pill) got('redpill');
  }
  function stopSaver() {
    const s = ssOn; if (!s) return;
    ssOn = null; lastInput = Date.now();
    clearTimeout(s.timer);
    const inst = s.stop.inst && s.stop.inst();
    if (s.name === 'Flying Saucers' && inst && inst.gold && inst.gold()) got('goldpie');
    s.stop();
    s.el.classList.add('bye');
    setTimeout(() => s.el.remove(), 320); // keep swallowing the rest of the click for a moment
  }
  function closeOverlays() { if (window.IE && IE.closeMenus) IE.closeMenus(); }
  function exitFrom(ev) {
    if (!ssOn) return false;
    const hard = ev.type === 'keydown' || ev.type === 'pointerdown';
    if (Date.now() - ssOn.t0 < 450) { if (hard) { ev.preventDefault(); ev.stopPropagation(); } return true; }
    if (ev.type === 'pointermove') {
      if (!ssOn.from) { ssOn.from = [ev.clientX, ev.clientY]; return true; }
      if (Math.hypot(ev.clientX - ssOn.from[0], ev.clientY - ssOn.from[1]) < 14) return true;
    } else if (hard) { ev.preventDefault(); ev.stopPropagation(); }
    stopSaver();
    return true;
  }
  ['keydown', 'pointerdown'].forEach(t => addEventListener(t, ev => { if (!exitFrom(ev)) lastInput = Date.now(); }, { capture: true }));
  ['wheel', 'touchstart'].forEach(t => addEventListener(t, ev => { if (!exitFrom(ev)) lastInput = Date.now(); }, { capture: true, passive: true }));
  addEventListener('pointermove', ev => { if (!exitFrom(ev)) lastInput = Date.now(); }, { capture: true, passive: true });
  addEventListener('click', ev => { if (ssOn || (ev.target && ev.target.closest && ev.target.closest('.ff-saver'))) { ev.preventDefault(); ev.stopPropagation(); } }, true);
  addEventListener('scroll', () => { lastInput = Date.now(); }, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lastInput = Date.now(); });
  const shown = id => { const e = $(id); return e && !e.hidden && getComputedStyle(e).display !== 'none'; };
  function idleBlocked() {
    if (document.hidden || !booted()) return true;
    if (['bsod', 'dos', 'standby', 'shutdown', 'saverFull', 'y2kEvent', 'dimmer', 'safeoff'].some(shown)) return true;
    const a = document.activeElement;
    if (a && a !== document.body && (a.tagName === 'CANVAS' || (a.closest && a.closest('.gbshell,[data-game],.game,.gamewin')))) return true;
    return false;
  }
  setInterval(() => {
    if (ssOn) return;
    const wait = saverWait(), name = saverName();
    if (!wait || /^\(?none\)?$/i.test(name) || !name) return;
    if (idleBlocked()) { if (document.hidden) lastInput = Date.now(); return; }
    if (Date.now() - lastInput > wait * 60000) startSaver(name);
  }, 4000);

  // ---- Plasma Ball (JackNet): a screen saver you download from the website. Once installed it lives in Display Properties too.
  const PLASMA = 'Plasma Ball (JackNet)', EXTRA_SAVERS = [];
  const plasmaInstalled = () => rawGet('jhp_scr_plasma') === '1';
  SAVERS[PLASMA] = (g, W, H) => {
    const sw = Math.max(32, Math.round(W / 6)), sh = Math.max(24, Math.round(H / 6));
    const off = document.createElement('canvas'); off.width = sw; off.height = sh;
    const og = off.getContext('2d'), img = og.createImageData(sw, sh), d = img.data;
    const pal = new Uint8ClampedArray(256 * 3);
    for (let i = 0; i < 256; i++) { const a = i / 256 * Math.PI * 2; pal[i * 3] = 128 + 127 * Math.sin(a); pal[i * 3 + 1] = 128 + 127 * Math.sin(a + 2.1); pal[i * 3 + 2] = 128 + 127 * Math.sin(a + 4.2); }
    let t = 0;
    return { frame(dt) {
      t += dt;
      const cx = sw / 2 + Math.sin(t * 0.7) * sw * 0.3, cy = sh / 2 + Math.cos(t * 0.5) * sh * 0.3;
      for (let y = 0, p = 0; y < sh; y++) for (let x = 0; x < sw; x++, p += 4) {
        const v = Math.sin(x * 0.11 + t) + Math.sin(y * 0.13 + t * 1.3) + Math.sin((x + y) * 0.07 + t * 0.6) + Math.sin(Math.hypot(x - cx, y - cy) * 0.12 - t * 2);
        const c = ((v + 4) * 32 | 0) & 255;
        d[p] = pal[c * 3]; d[p + 1] = pal[c * 3 + 1]; d[p + 2] = pal[c * 3 + 2]; d[p + 3] = 255;
      }
      og.putImageData(img, 0, 0);
      g.drawImage(off, 0, 0, W, H);
    } };
  };
  function installPlasma() {
    if (EXTRA_SAVERS.includes(PLASMA)) return;
    EXTRA_SAVERS.push(PLASMA);
    Apps.addProgram(['Accessories', 'Screen Savers', PLASMA], () => startSaver(PLASMA), I.saver);
    Apps.cmd(['plasma', 'ssplasma', 'plasmaball', 'plasma.scr'], () => setTimeout(() => startSaver(PLASMA), 250));
    window.dispatchEvent(new CustomEvent('jhp-savers'));
  }
  if (plasmaInstalled()) installPlasma();
  window.addEventListener('jhp-install', ev => { const d = (ev && ev.detail) || {}; if (d.kind === 'scr' && d.id === 'plasma') installPlasma(); });

  window.Savers = {
    list: () => SAVER_ORDER.concat(EXTRA_SAVERS),
    preview(canvas, name) { if (!canvas) return () => {}; return runSaver(canvas, SAVERS[OLDSAVER[name] || name] ? (OLDSAVER[name] || name) : 'Flying Saucers', false); },
    start(name, opts) { startSaver(name || saverName(), opts); },
    stop: stopSaver,
    configure(name) { if (!name || /text|marquee/i.test(name)) textSetup(); else Desk.msgbox('Display Properties', `${name} has no options you can set. It's perfect already.\n\n(The 3D Text and Marquee savers let you type your own words.)`, 'info'); },
    get running() { return ssOn ? ssOn.name : ''; },
  };
  function textSetup() {
    Desk.ask('3D Text Setup', 'Type the words for the 3D Text and Marquee screen savers (up to 20 letters):', saverText(), 20, v => {
      v = String(v || '').trim().toUpperCase(); if (!v) return;
      store.set('jhp_fun_sstext', v); got('sstext');
      Desk.toast('Display Properties', `Your screen saver now says "${v}". Very professional.`, 4000);
    });
  }
  const SSCMD = { 'Starfield Simulation': ['ssstars', 'starfield', 'ssstar'], 'Flying Saucers': ['flyingsquigs', 'ssflying', 'sssquigs', 'sssquig', 'flyingsaucers', 'sssaucers', 'sssaucer'], '3D Pipes': ['sspipes', 'ss3dpipes', 'pipes'], 'Mystify Your Mind': ['ssmyst', 'ssmystify', 'mystify'], '3D Text': ['sstext', 'ss3dtext', '3dtext'], 'Marquee': ['ssmarquee', 'marquee'], 'Curves and Colors': ['sscurves', 'curves'], 'Digital Rain': ['ssrain', 'sswaaagh', 'waaaghrain', 'digitalrain', 'ssdigital'] };
  for (const [n, cmds] of Object.entries(SSCMD)) Apps.cmd(cmds, () => setTimeout(() => startSaver(n), 250));
  Apps.cmd(['saver', 'screensaver', 'scr', 'ss'], () => setTimeout(() => startSaver(/^\(?none\)?$/i.test(saverName()) ? 'Flying Saucers' : saverName()), 250));
  Apps.cmd(['sstextsetup', 'saversetup', 'ssconfig'], textSetup);
  S('saver60', 'Couch potato', 'Some things are worth watching for a whole minute without touching the mouse');
  S('saverall', 'The full collection', 'Every screen saver deserves an audience. Watch them all');
  S('goldpie', 'Golden pie', 'Something rare and shiny flies with the saucers. Interrupt while it is on screen');
  S('sstext', 'Your name in lights', 'Make the spinning words say something else');
  S('redpill', 'Down the rabbit hole', 'Choose the red one');

  // ================================================================ a little Explorer-style folder window (used by several toys)
  // node: { name, type: 'dir'|'txt'|'share'|'printer'|'pc'|..., icon?, kids?: [] | () => [], text?, act?(), locked?, menu?(), props? }
  const TYPE_ICON = { dir: I.folder, txt: I.txt, share: I.share, printer: I.printer, pc: I.pc, exe: I.exe, img: I.img, snd: I.snd, group: I.group, lock: I.lockdir };
  const UP = '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M1 4h5l1 1.5h8V14H1z" fill="#f2d16b" stroke="#7a5a00"/><path d="M8 12V7M5.5 9.5 8 7l2.5 2.5" stroke="#000" stroke-width="1.4" fill="none"/></svg>';
  function folderWin(title, icon, root, o) {
    o = o || {};
    const b = h('div', 'ff-exp');
    b.innerHTML = `<div class="ff-tool"><button class="btn ff-up" type="button">${UP}<span>Up</span></button><button class="btn ff-open" type="button">Open</button>${(o.buttons || []).map((x, i) => `<button class="btn ff-xb" data-i="${i}" type="button">${x.icon ? ico16(x.icon) : ''}<span>${esc(x.label)}</span></button>`).join('')}<button class="btn ff-prop" type="button">Properties</button></div>
      <div class="ff-addr"><span>Address</span><div class="field ff-crumb"></div></div><div class="field ff-grid" tabindex="-1"></div>`;
    const w = Apps.win(title, b, { w: o.w || 500, h: o.h || 360, icon, menubar: true, status: true, minW: 260, minH: 200, onClose: o.onClose });
    const stack = [root];
    let sel = null;
    const cur = () => stack[stack.length - 1];
    const kidsOf = n => (typeof n.kids === 'function' ? n.kids() : n.kids) || [];
    function openNode(n) {
      if (!n) return;
      if (n.act) return n.act(n);
      if (n.locked) { Desk.msgbox(n.name, n.locked, 'warn'); return; }
      if (n.kids) { stack.push(n); sel = null; render(); if (n.secret) got(n.secret); return; }
      Apps.openFile(Object.assign({}, n, { type: n.type === 'txt' ? 'txt' : n.type }));
    }
    function props(n) {
      n = n || cur();
      if (n.props) return n.props();
      Desk.msgbox(n.name + ' Properties', n.kids ? `Type: Folder\nContains: ${kidsOf(n).length} object(s)\nShared: ${n.type === 'share' ? 'Yes (read only, thank goodness)' : 'No'}` : `Type: ${n.type === 'txt' ? 'Text Document' : 'File'}\nSize: ${n.size || '1 KB'}\nModified: ${n.date || d99()}`, 'info');
    }
    function render() {
      const c = cur(), kids = kidsOf(c), grid = b.querySelector('.ff-grid');
      const crumbs = stack.map((n, i) => `<a href="#" data-k="${i}">${esc(n.crumb || n.name)}</a>`).join(' <b>&rsaquo;</b> ');
      b.querySelector('.ff-crumb').innerHTML = ico16(c.icon || TYPE_ICON[c.type] || I.folder) + crumbs;
      b.querySelectorAll('.ff-crumb a').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); stack.length = +a.dataset.k + 1; sel = null; render(); }));
      b.querySelector('.ff-up').disabled = stack.length < 2;
      const keep = sel && kids.find(k => k === sel || (k.key && sel.key && k.key === sel.key));
      sel = keep || null;
      grid.innerHTML = '';
      if (!kids.length) grid.innerHTML = `<div class="ff-empty">${esc(c.empty || 'This folder is empty.')}</div>`;
      kids.forEach(n => {
        const btn = h('button', 'ff-ic' + (n === sel ? ' sel' : '') + (n.dim ? ' dim' : ''));
        btn.type = 'button';
        btn.innerHTML = (n.icon || TYPE_ICON[n.type] || I.txt) + `<span>${esc(n.name)}</span>`;
        let last = 0;
        btn.addEventListener('click', () => {
          grid.querySelectorAll('.ff-ic.sel').forEach(x => x.classList.remove('sel')); btn.classList.add('sel'); sel = n;
          const now = Date.now();
          if (now - last < 450) { last = 0; openNode(n); } else last = now;
          status();
        });
        btn.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); openNode(n); } });
        btn.addEventListener('contextmenu', ev => {
          ev.preventDefault(); btn.click();
          IE.menu([{ label: 'Open', act: () => openNode(n) }, ...(n.menu ? n.menu() : []), '-', { label: 'Properties', act: () => props(n) }], ev.clientX, ev.clientY);
        });
        if (n.key) btn.dataset.key = n.key;
        grid.appendChild(btn);
      });
      status();
      w.setTitle(c === root ? title : (c.crumb || c.name));
    }
    function status() { if (w.status) w.status.textContent = sel ? `${sel.name}${sel.note ? ' - ' + sel.note : ''}` : (o.status ? o.status(cur(), kidsOf(cur())) : `${kidsOf(cur()).length} object(s)`); }
    b.querySelector('.ff-up').addEventListener('click', () => { if (stack.length > 1) { stack.pop(); sel = null; render(); } });
    b.querySelector('.ff-open').addEventListener('click', () => sel ? openNode(sel) : Desk.msgbox(title, 'Click on something first, then press Open. (Or double-click it, like a pro.)', 'info'));
    b.querySelector('.ff-prop').addEventListener('click', () => props(sel));
    b.querySelectorAll('.ff-xb').forEach(x => x.addEventListener('click', () => o.buttons[+x.dataset.i].act(sel, api)));
    const api = { w, render, get sel() { return sel; }, get cur() { return cur(); }, push(n) { stack.push(n); sel = null; render(); } };
    Apps.menubar(w, [
      ['File', () => [{ label: 'Open', dis: !sel, act: () => openNode(sel) }, ...(o.fileMenu ? o.fileMenu(sel, api) : []), '-', { label: 'Properties', act: () => props(sel) }, '-', { label: 'Close', act: w.close }]],
      ['Edit', [{ label: 'Undo', dis: true, key: 'Ctrl+Z' }, '-', { label: 'Select All', key: 'Ctrl+A', act: () => Desk.toast(title, "You've selected everything. Now what?") }]],
      ['View', () => [{ label: 'Large Icons', rad: !b.classList.contains('list'), act: () => b.classList.remove('list') }, { label: 'List', rad: b.classList.contains('list'), act: () => b.classList.add('list') }, '-', { label: 'Refresh', key: 'F5', act: render }]],
      ['Help', [{ label: 'About ' + title, act: () => Desk.msgbox('About ' + title, o.about || `${title}\nJackOS 98\n\nIt shows you things. You click them.`, 'info') }]],
    ]);
    render();
    return api;
  }

  // ================================================================ 2. NETWORK NEIGHBORHOOD + WINPOPUP
  let online = [];
  const nnRenders = new Set();
  const nnRefresh = () => nnRenders.forEach(fn => { try { fn(); } catch (e) {} });
  Net.on('welcome', m => { if (m.online) { online = m.online; nnRefresh(); } });
  Net.on('online', m => { online = m.online || []; nnRefresh(); });
  const WHERE = { home: 'the front page', demos: 'the Games Arcade', grot: "Gubbinz's page", saver: 'the Screensaver page', reviews: 'the Reviews', cheats: 'the Cheats page', orks: 'the Hobby Corner', letters: 'the Letters page', art: 'the Art Wall', chat: 'the Chat Room', forums: 'the Forums', members: 'the Members list', error: 'a broken page', secret: 'a SECRET page' };
  const whereOf = o => o.where && String(o.where).startsWith('secret') ? 'a SECRET page (ooh)' : (WHERE[o.where] || 'somewhere on the site');
  const FILES = [
    ['cheats i made up.txt', "CHEATS I MADE UP (they don't work)\n\n- Press all the buttons at once for infinite lives\n- Hold Select and blow on the cartridge for a secret level\n- Shout HADOUKEN into the controller (don't, my sister laughed at me)\n- Turn it off and on again: works on everything\n"],
    ['band names.txt', "IDEAS FOR BAND NAMES\n\n1. The Floppy Disks\n2. Insert Coin\n3. 56K Warning\n4. Fatal Exception 0E\n5. The Millennium Bugs (TAKEN, Dave says his cousin's band is called that)\n6. Mom Says No\n\nInstruments we have: recorder, keyboard with a demo button, a bin.\n"],
    ['DO NOT READ.txt', "DO NOT READ THIS FILE\n\n\n\n\n\n\nIf you are reading this you are Dave.\nStop it Dave.\n"],
    ['christmas list.txt', "CHRISTMAS LIST\n\n1. Expansion Pak\n2. A new controller (Dave sat on mine)\n3. LEGO Star Wars X-wing (the big one)\n4. A Rubik's cube that comes already solved (JOKE)\n5. The internet but faster\n6. Pocket money (in advance)\n"],
    ['jokes.txt', "JOKES\n\nWhat do you call a computer that sings? A Dell... no wait. A COMPOSER.\nWhy was the floppy disk sad? It felt a bit 3.5.\nWhat's a robot's favourite snack? Micro chips. (Dave says it's rubbish. Dave is rubbish.)\n"],
    ['readme.txt', "README\n\nThis folder is shared so my cousin can copy my high scores.\nHe can't. They're .txt files. Anyone can type a high score.\nThat's not the point, Gary.\n"],
    ['high scores.txt', "MY HIGH SCORES (REAL)\n\nTetris: 112 lines\nSnake: 340\nMinesweeper (beginner): 14 seconds\nMinesweeper (expert): never finished. never will.\nBlobbit Lob: 61.2m\n"],
    ['essay FINAL final v3.txt', "My Summer Holidays\nby me\n\nOn my summer holidays I went to my nan's. It rained. We played cards. It rained more.\nThen I came home and played on the computer for 6 weeks.\n\nThe End.\n\n(Need 500 more words. Maybe describe the rain.)\n"],
    ['mixtape.txt', "MIXTAPE FOR THE CAR (side A)\n\n1. The Floppy Disks - 56K of Love\n2. DJ Pixel - Dial-Up Tone Remix\n3. The Go-Karts - Red Ones Go Faster\n4. Mom - Turn That Down (live)\n5. (taped off the radio, the DJ talks over the start, sorry)\n"],
    ['pet rock care.txt', "HOW TO LOOK AFTER YOUR PET ROCK\n\n- Feed: never\n- Walk: carry it\n- Bath: once a year\n- Tricks: sit, stay, play dead (very good at this one)\n\nMy rock is called Kevin. He is 4 billion years old.\n"],
    ['secret level map.txt', "SECRET LEVEL MAP\n\n  +-----+     +-----+\n  |START|-----| ??? |\n  +-----+     +--+--+\n                 |\n            +----+----+\n            | ROBOTS  |\n            | (loads) |\n            +---------+\n\nDave says the secret level is behind the waterfall. Dave says a lot of things.\n"],
    ['to do.txt', "TO DO\n\n[x] get to level 30\n[ ] homework\n[ ] tidy room (Mom said 'by Saturday' but which Saturday?)\n[x] paint 5 more Space Marines\n[ ] give Dave his controller back\n"],
  ];
  const BLOBS = [
    { name: 'holiday photo.bmp', type: 'img', size: '2,304 KB', act: n => Desk.msgbox(n.name, 'This picture is 2.3 MB. Over JackNet at 49,333 bps that will take about 6 minutes, and someone will pick up the phone halfway. Download cancelled.', 'warn') },
    { name: 'FREE GAMES.exe', type: 'exe', size: '12 KB', act: n => Desk.msgbox(n.name, "Gubbinz Anti-Virus 98 scanned this file. It's not free games. It's a picture of a duck. File quarantined (put in a little box).", 'warn') },
    { name: 'birthday.wav', type: 'snd', size: '88 KB', act: () => { [523, 523, 587, 523, 698, 659].forEach((f, i) => setTimeout(() => Sound.note(f, 0.22, 'square'), i * 260)); if (!Sound.on) Desk.toast('Sound Recorder', '(Your sound is off. Imagine a tinny birthday tune.)'); } },
    { name: 'SAVEGAME.SAV', type: 'txt', size: '32 KB', text: "This is a save game. It says you are on level 2 with 1 life.\nWhoever's computer this is: you need help. Practise more.\n" },
  ];
  function sharesFor(o) {
    const r = seeded(o.nick + '#'), nick = o.nick;
    const own = FILES.slice().sort(() => r() - 0.5).slice(0, 3 + Math.floor(r() * 3)).map(([name, text]) => ({ name, type: 'txt', text, size: (1 + Math.floor(r() * 9)) + ' KB' }));
    const docs = [{ name: 'homework (copied from Dave).txt', type: 'txt', size: '2 KB', text: "HISTORY HOMEWORK: THE ROMANS\n\n1. Why did the Romans build straight roads?\nBecause they didn't have any bendy ones.\n\n2. Name something the Romans gave us.\nCentral heating, baths, roads, and this homework.\n\n3. Who was Julius Caesar?\nA man who was mostly a salad.\n\n(copied from Dave. If any of this is wrong it is DAVE'S fault)\n\nTeacher's comment: See me. Both of you.\n" }, ...own];
    const kids = [{ name: 'SharedDocs', type: 'share', kids: docs }];
    if (r() < 0.7) kids.push({ name: 'Games', type: 'share', kids: [BLOBS[3], { name: 'cheats.txt', type: 'txt', text: 'GAME CHEATS\n\nUp, Up, Down, Down... no, I forgot the rest.\n' }] });
    if (r() < 0.6) kids.push({ name: 'Pics', type: 'share', kids: [BLOBS[0], { name: 'my dog.bmp', type: 'img', size: '1,880 KB', act: BLOBS[0].act }] });
    if (r() < 0.5) kids.push({ name: 'Music', type: 'share', kids: [BLOBS[2], { name: 'mixtape.txt', type: 'txt', text: FILES[8][1] }] });
    if (r() < 0.35) kids.push({ name: 'Downloads', type: 'share', kids: [BLOBS[1]] });
    kids.push({ name: 'Printer', type: 'printer', act: () => Desk.msgbox(`Printer on \\\\${nick}`, `Sending your page to ${nick}'s printer...\n\nError: Out of cyan. Always out of cyan.`, 'warn') });
    kids.push({ name: 'C', type: 'lock', icon: I.lockdir, locked: `\\\\${nick}\\C is not accessible.\n\nAccess is denied. (Their Mom set a password. It's probably the dog's name.)` });
    return kids;
  }
  const GROT_PC = { key: 'pc:grot', name: '\\\\GUBBINZ', type: 'pc', icon: I.grotpc, note: 'Comment: KEEP OUT (this means YOU)', secret: 'grotpc', kids: [
    { name: 'SNACKS', type: 'share', kids: [
      { name: 'toast recipy.txt', type: 'txt', text: "TOAST (serves 1 Gubbinz)\n\n1 bread\nput bread in toaster\nwait\nwait a bit more\nit is on fire now\nsay nothing\n\nEAT IT BEFORE JACK'S MOM SEES\n" },
      { name: 'tamagotchi names.txt', type: 'txt', text: "MY TAMAGOTCHIS\n\n- Chompy\n- Big Chompy\n- Little Chompy (forgot him in my school bag)\n- Kevin\n" },
    ] },
    { name: 'RUPEE STASH', type: 'lock', icon: I.lockdir, locked: "\\\\GUBBINZ\\RUPEE STASH is not accessible.\n\nOI! DAT'S MY ROOPEEZ! GET OWT!" },
    { name: 'Printer', type: 'printer', act: () => Desk.msgbox('Printer on \\\\GUBBINZ', "The printer is a little green fella with a crayon. He's on his tea break.", 'info') },
  ] };
  function computerNode(o) {
    const me = o.id === Net.me.id;
    return { key: 'pc:' + o.id, id: o.id, name: '\\\\' + o.nick + (me ? ' (you)' : ''), crumb: '\\\\' + o.nick, type: 'pc', icon: me ? I.pcme : I.pc, nick: o.nick, note: (me ? 'This computer' : 'Reading ' + whereOf(o)) + (o.member ? ' - JackNet member' : ''),
      kids: () => me ? [{ name: 'SharedDocs', type: 'share', kids: [{ name: 'this is you.txt', type: 'txt', text: "You are looking at your own computer, over the network.\n\nIt's like looking in a mirror. A slow, 56K mirror.\n" }] }, { name: 'Printer', type: 'printer', act: () => Desk.msgbox('Printer', 'Out of cyan. Even your own printer.', 'warn') }] : sharesFor(o),
      menu: () => [{ label: 'Send Message...', act: () => sendPopup(o) }, ...(!me && window.UhOh ? [{ label: 'Uh-Oh! Message...', act: () => UhOh.message(o.nick) }, { label: 'Add to Uh-Oh! Contacts', dis: !o.member, act: () => UhOh.add(o.nick) }] : [])],
      props: () => Desk.msgbox(`\\\\${o.nick} Properties`, `Computer name: ${o.nick}\nWorkgroup: JACKNET\nComment: ${me ? 'This is you!' : 'Currently reading ' + whereOf(o)}\nJackNet member: ${o.member ? 'Yes ★' : 'No (guest)'}\nConnection: 56K (allegedly)`, 'info'),
    };
  }
  const DAVE_PC = { key: 'pc:dave', name: '\\\\DAVE-PC', type: 'pc', icon: I.pcoff, dim: true, note: 'Not responding', act: () => { got('davepc'); Desk.msgbox('\\\\DAVE-PC', "\\\\DAVE-PC is not accessible.\n\nThe network path was not found. (Dave's Mom switched it off at the wall again. Something about 'the phone bill'.)", 'warn'); } };
  function netHood() {
    const jacknet = { name: 'JackNet', crumb: 'JackNet', type: 'group', icon: I.group, empty: 'Nobody else is on JackNet right now. Try again later!',
      kids: () => { const meFirst = online.slice().sort((a, b) => (b.id === Net.me.id) - (a.id === Net.me.id)); return meFirst.map(computerNode); } };
    const davesnet = { name: 'DAVESNET', type: 'group', icon: I.group, kids: [DAVE_PC] };
    const grotnet = { name: 'GUBBINZNET', type: 'group', icon: I.group, note: 'The little green helper\'s computer. Not a visitor.', kids: [GROT_PC] }; // a joke machine, kept out of the real-people list
    const root = { name: 'Entire Network', crumb: 'Entire Network', icon: I.world, kids: [jacknet, davesnet, grotnet] };
    const api = folderWin('Network Neighborhood', I.net, root, {
      w: 540, h: 380,
      buttons: [{ label: 'Send Message...', icon: I.popup, act: sel => sel && sel.type === 'pc' && sel.nick ? sendPopup({ id: sel.id, nick: sel.nick }) : sel === GROT_PC ? sendPopup({ id: -1, nick: 'GUBBINZ' }) : Desk.msgbox('Send Message', 'Click on a computer first, then press Send Message. (Each computer is a real person on the site right now!)', 'info') }],
      fileMenu: sel => [{ label: 'Send Message...', dis: !(sel && sel.type === 'pc'), act: () => sel.nick ? sendPopup({ id: sel.id, nick: sel.nick }) : sendPopup({ id: -1, nick: 'GUBBINZ' }) }, { label: 'Find Computer...', act: findComputer }],
      status: (c, kids) => c === jacknet ? `${kids.length} computer(s) on JackNet · live` : `${kids.length} object(s)`,
      about: 'Network Neighborhood\nJackOS 98\n\nEvery computer in JackNet is a real person on the site right now. Be nice!',
      onClose: () => nnRenders.delete(live),
    });
    api.push(jacknet);
    const live = () => { if (api.cur === jacknet) api.render(); };
    nnRenders.add(live);
    GROT_PC.menu = () => [{ label: 'Send Message...', act: () => sendPopup({ id: -1, nick: 'GUBBINZ' }) }];
    return api.w;
  }
  function findComputer() {
    Desk.ask('Find: Computer', 'Named:', '', 20, v => {
      v = String(v || '').trim().toLowerCase(); if (!v) return;
      const hit = online.find(o => o.nick.toLowerCase().includes(v));
      if (hit) Desk.msgbox('Find: Computer', `Found \\\\${hit.nick}! They're reading ${whereOf(hit)}.`, 'info');
      else if (/dave/.test(v)) DAVE_PC.act();
      else if (/gub|grot/.test(v)) { got('grotpc'); Desk.msgbox('Find: Computer', 'Found \\\\GUBBINZ. He is hiding under the desk.', 'info'); }
      else Desk.msgbox('Find: Computer', `The computer '${v.toUpperCase()}' was not found. Maybe their Mom needed the phone.`, 'warn');
    });
  }
  Apps.register('nethood', { single: true, cmd: ['nethood', 'network', 'network neighborhood', 'net view'], open: netHood });

  // ---- WinPopup: send
  const sentAt = [];
  function sendPopup(to) {
    const f = h('form', 'ff-pop');
    f.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${I.popup.replace('<svg', '<svg width="32" height="32" style="flex:none"')}<div style="flex:1;min-width:0"><div>To: <b>\\\\${esc(to.nick)}</b></div><div class="small" style="color:#555">This message will pop up on their screen right now.</div></div></div>
      <textarea maxlength="200" rows="4" aria-label="Message" placeholder="Type your message..."></textarea><div class="ff-left small">200 characters left</div>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="submit" style="min-width:72px">Send</button><button class="btn" type="button" style="min-width:72px">Cancel</button></div>`;
    const w = Apps.win('Send Message - WinPopup', f, { w: 360, icon: I.popup, noResize: true, noMax: true, escClose: true });
    const ta = f.querySelector('textarea'); setTimeout(() => ta.focus(), 30);
    ta.addEventListener('input', () => { f.querySelector('.ff-left').textContent = (200 - ta.value.length) + ' characters left'; });
    f.querySelector('button[type=button]').addEventListener('click', w.close);
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const text = ta.value.trim().slice(0, 200); if (!text) return;
      const now = Date.now();
      while (sentAt.length && now - sentAt[0] > 60000) sentAt.shift();
      if (sentAt.length && now - sentAt[sentAt.length - 1] < 8000) return Desk.msgbox('WinPopup', `Slow down! The network cable is only so long. Try again in ${Math.ceil((8000 - (now - sentAt[sentAt.length - 1])) / 1000)} seconds.`, 'warn');
      if (sentAt.length >= 5) return Desk.msgbox('WinPopup', "You've sent loads of messages this minute. Have a biscuit and try again in a bit.", 'warn');
      if (to.id === -1) { // the grot's computer is a machine on the network, not a person, so nobody reads messages on it
        sentAt.push(now); w.close(); got('grotmsg');
        Desk.msgbox('WinPopup', 'The message was delivered to \\\\GUBBINZ... but nobody is sitting at that computer. It is Gubbinz\'s computer, and he is busy playing Snake. (Messages only reach real people on JackNet.)', 'info');
        return;
      }
      if (to.id === Net.me.id) { sentAt.push(now); w.close(); got('selfmsg'); setTimeout(() => showPopup({ from: Net.me.nick, fromId: Net.me.id, text }, true), 600); return; }
      if (!online.some(o => o.id === to.id)) return Desk.msgbox('WinPopup', `The message could not be delivered. \\\\${to.nick} has logged off. (Probably called down for tea.)`, 'warn');
      if (!Net.send({ t: 'popup', to: to.id, text })) return Desk.msgbox('WinPopup', 'The message could not be sent. JackNet is not connected. (Is someone on the phone?)', 'warn');
      sentAt.push(now); w.close(); got('netsend'); play('click');
      Desk.toast('WinPopup', `Message sent to \\\\${to.nick}.`, 3000);
    });
    return w;
  }
  // ---- WinPopup: receive
  const ignored = new Set(), popWins = new Set();
  let missed = 0;
  function showPopup(m, local) {
    if (!m || ignored.has(m.fromId)) return;
    if (popWins.size >= 3) { missed++; Desk.toast('WinPopup', `${missed} more message(s) arrived but there's no room on the screen. Close some first!`, 4000); return; }
    const b = h('div', 'ff-pop');
    b.innerHTML = `<div class="ff-pophead">${I.popup.replace('<svg', '<svg width="32" height="32" style="flex:none"')}<div>Message from <b class="f"></b> to <b>YOU</b> on ${d99()} ${hhmm()}</div></div><div class="field ff-poptext"></div>
      <label class="ff-ign"><input type="checkbox"> Ignore messages from <span class="f"></span></label>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" style="min-width:72px">Reply</button><button class="btn" type="button" style="min-width:72px">Discard</button></div>`;
    b.querySelectorAll('.f').forEach(e => { e.textContent = m.from || 'Somebody'; });
    b.querySelector('.ff-poptext').textContent = String(m.text || '').slice(0, 200);
    const w = Apps.win('WinPopup', b, { w: 340, icon: I.popup, noResize: true, noMax: true, escClose: true, x: innerWidth - 360 - popWins.size * 24, y: 40 + popWins.size * 30, onClose: () => { popWins.delete(w); if (!popWins.size) missed = 0; } });
    popWins.add(w);
    const [reply, discard] = b.querySelectorAll('.btn');
    b.querySelector('input').addEventListener('change', e => { if (e.target.checked) ignored.add(m.fromId); else ignored.delete(m.fromId); });
    discard.addEventListener('click', w.close);
    reply.addEventListener('click', () => { w.close(); sendPopup({ id: m.fromId, nick: m.from || 'Somebody' }); });
    play('beep');
    if (!local) got('netgot');
  }
  Net.on('popup', m => showPopup(m, false));
  Apps.cmd(['winpopup', 'net send'], () => { const others = online.filter(o => o.id !== Net.me.id); if (!others.length) Desk.msgbox('WinPopup', "There's nobody else on JackNet right now to send a message to. Open Network Neighborhood when someone turns up!", 'info'); else netHood(); });
  S('netsend', 'net send', 'Pop a message up on a stranger\'s screen');
  S('netgot', 'You\'ve got popup', 'Someone, somewhere, writes to you');
  S('selfmsg', 'Talking to yourself', 'Send a message to the one computer that always answers');
  S('davepc', 'Switched off at the wall', 'Look for Dave on a network that is not JackNet');
  S('grotpc', 'Gubbinz on the LAN', 'Even the little green helper has a computer on the network');
  S('grotmsg', 'Nobody home', "Send a message to Gubbinz's computer");

  // ================================================================ 3. GUBBINZ ON THE DESKTOP (a screen mate)
  // Pixel art: 18x19 grot, mirrored halves. k outline, g green, G highlight, d shadow, r eye, w white, m mouth, b/B tunic, y belt.
  const GP = { k: '#14300c', g: '#3fa52c', G: '#7ad850', d: '#2a7a1a', r: '#ff2a1a', w: '#ffffff', m: '#3a0000', b: '#8a5a2a', B: '#5a3a1a', y: '#d0a040', p: '#000', s: '#e8381b', S: '#ff8a5a', z: '#ffffff', Y: '#ffe000' };
  const sym = s => s + s.split('').reverse().join('');
  const GBASE = ['.........', '......kkk', 'kk...kgGg', 'kgkk.kggg', '.kggkgggg', '..kgggggg', '...kkkggg', '.....krwg', '.....krrg', '.....kggd', '.....kgmw', '......kgg', '....kkbbb', '...kgkbBb', '...kgkbbb', '...kgkyyy', '....kkbbb', '.....kgk.', '....kkkk.'].map(sym);
  GBASE[8] = '.....krpggrpk.....'; // pupils looking the way he walks
  const ARM = { // right arm overlays (sprite coords); the left arm is the mirror image
    1: [[13, 12, 'g'], [13, 11, 'g'], [14, 11, 'g'], [14, 10, 'g'], [15, 10, 'g'], [15, 9, 'g'], [16, 9, 'g'], [16, 8, 'G'], [14, 12, 'k'], [15, 11, 'k'], [16, 10, 'k'], [17, 9, 'k'], [17, 8, 'k'], [16, 7, 'k'], [15, 8, 'k']],
    2: [[13, 12, 'g'], [14, 12, 'g'], [15, 11, 'g'], [16, 11, 'g'], [16, 10, 'g'], [17, 10, 'G'], [13, 13, 'k'], [14, 13, 'k'], [15, 12, 'k'], [16, 12, 'k'], [17, 11, 'k'], [17, 9, 'k'], [15, 10, 'k']],
  };
  function gFrame(pose, f) { // returns { R, dy, ex } in sprite coords
    const R = GBASE.slice(); let dy = 0; const ex = [];
    const armR = up => { for (let i = 13; i <= 16; i++) R[i] = R[i].slice(0, 12) + 'k.....'; ARM[up].forEach(p => ex.push(p)); };
    const armL = up => { for (let i = 13; i <= 16; i++) R[i] = '.....k' + R[i].slice(6); ARM[up || 1].forEach(([x, y, c]) => ex.push([17 - x, y, c])); };
    const shut = () => { R[7] = sym('.....kggg'); R[8] = sym('.....kkkg'); };
    switch (pose) {
      case 'walk':
        if (f % 2) { R[17] = '....kgk....kgk....'; R[18] = '...kkkk....kkkk...'; }
        else { R[17] = '......kgkkgk......'; R[18] = '.....kkkkkkkk.....'; dy = -1; }
        break;
      case 'sit': for (let i = 18; i > 1; i--) R[i] = R[i - 2]; R[0] = R[1] = '..................'; R[17] = sym('....kkbbb'); R[18] = '..kkkkk....kkkkk..'; break;
      case 'wave': armR(f % 2 ? 1 : 2); break;
      case 'jump': armR(1); armL(); R[17] = '......kgkkgk......'; R[18] = '......kk..kk......'; break;
      case 'dangle': armR(1); armL(); R[16] = sym('....kkbbb'); R[17] = f % 2 ? '.....kgk...kgk....' : '....kgk...kgk.....'; R[18] = f % 2 ? '.....kk.....kk....' : '....kk.....kk.....'; R[10] = sym('.....kmmm'); break;
      case 'eat': {
        R[10] = sym(f % 2 ? '.....kgmm' : '.....kgmw');
        // a slice of pizza: crust on top, cheese, two bits of pepperoni (he bites the corner off every few frames)
        const sq = [[7, 11, 'b'], [8, 11, 'y'], [9, 11, 'y'], [10, 11, 'b'], [7, 12, 'Y'], [8, 12, 's'], [9, 12, 'Y'], [10, 12, 'Y'], [8, 13, 'Y'], [9, 13, 's'], [8, 14, 'y']];
        sq.forEach(p => { if (!(f % 4 === 3 && p[0] > 9)) ex.push(p); });
        ex.push([6, 12, 'g'], [11, 12, 'g'], [6, 13, 'g'], [11, 13, 'g']);
        if (f % 2) ex.push([5 + (f % 3), 16, 'Y'], [12, 17 - (f % 2), 'y']);
        break;
      }
      case 'sleep': shut(); R[10] = sym('.....kggm'); for (let i = 18; i > 1; i--) R[i] = R[i - 2]; R[0] = R[1] = '..................'; R[17] = sym('....kkbbb'); R[18] = '..kkkkk....kkkkk..'; break;
      case 'yawn': shut(); R[9] = sym('.....kgmm'); R[10] = sym('.....kgmm'); R[11] = sym('......kmm'); armL(); break;
      case 'dizzy': R[7] = sym(f % 2 ? '.....kwrg' : '.....krwg'); R[8] = sym(f % 2 ? '.....krwg' : '.....kwrg'); R[10] = sym('.....kggm'); dy = f % 2; break;
      case 'angry': R[6] = sym('...kkkkkg'); R[7] = sym('.....kkrg'); R[8] = sym('.....krrg'); R[10] = sym('.....kwmw'); armR(f % 2 ? 1 : 2); dy = f % 2 ? -1 : 0; break;
      case 'happy': armR(1); armL(); R[10] = sym('.....kmww'); dy = f % 2 ? -2 : 0; break;
      default: break;
    }
    return { R, dy, ex };
  }
  const GW = 26, GH = 28, OX = 4, OY = 8; // canvas size and where the sprite sits in it
  function drawGrot(g, pose, f, t) {
    g.clearRect(0, 0, GW, GH);
    const { R, dy, ex } = gFrame(pose, f);
    const px = (x, y, c) => { if (c === '.' || !GP[c]) return; g.fillStyle = GP[c]; g.fillRect(OX + x, OY + y + dy, 1, 1); };
    R.forEach((row, y) => { for (let x = 0; x < row.length; x++) px(x, y, row[x]); });
    ex.forEach(([x, y, c]) => px(x, y, c));
    if (pose === 'sleep') { // floating zzz
      g.fillStyle = '#fff';
      const zs = [[0, 0], [1, 2.6]];
      zs.forEach(([o], i) => { const ph = ((t / 900) + i * 0.5) % 1, zx = 18 + i * 3 + Math.round(ph * 3), zy = 7 - Math.round(ph * 6); g.globalAlpha = 1 - ph; g.fillRect(zx, zy, 3, 1); g.fillRect(zx + 1, zy + 1, 1, 1); g.fillRect(zx, zy + 2, 3, 1); });
      g.globalAlpha = 1;
    }
    if (pose === 'dizzy') { // little stars round his head
      for (let i = 0; i < 3; i++) { const a = t / 260 + i * 2.1, sx = 13 + Math.round(Math.cos(a) * 8), sy = 6 + Math.round(Math.sin(a) * 2); g.fillStyle = '#ffe000'; g.fillRect(sx, sy - 1, 1, 3); g.fillRect(sx - 1, sy, 3, 1); }
    }
    if (pose === 'yawn' && f % 2) { g.fillStyle = '#fff'; g.fillRect(19, 8, 1, 1); g.fillRect(20, 6, 2, 1); }
  }
  // ---- the screen mate himself
  const mate = { el: null, cv: null, g: null, bubble: null, raf: 0, x: 0, y: 0, face: 1, mode: '', surf: null, timer: 0, acts: 0, maxActs: 5, sc: 2, pokes: [], night: false, visits: 0 };
  const tbTop = () => innerHeight - ((($('taskbar') || {}).offsetHeight) || 32);
  function climbable() {
    return [...document.querySelectorAll('.appwin, #browser')].filter(w => {
      if (!w.offsetParent && getComputedStyle(w).position !== 'fixed') return false;
      if (w.style.display === 'none' || w.classList.contains('min') || w.classList.contains('maxwin')) return false;
      const r = w.getBoundingClientRect();
      return r.width > 220 && r.top > 70 && r.top < tbTop() - 120 && r.left > -20 && r.right < innerWidth + 20;
    });
  }
  function say(text, ms) {
    if (!mate.el) return;
    if (!mate.bubble) { mate.bubble = h('div', 'ff-bubble'); document.body.appendChild(mate.bubble); }
    mate.bubble.textContent = text; mate.bubble.hidden = false;
    mate.sayUntil = performance.now() + (ms || 2200);
    placeBubble();
  }
  function placeBubble() {
    const b = mate.bubble; if (!b || b.hidden) return;
    const w = b.offsetWidth || 80, left = Math.max(4, Math.min(innerWidth - w - 4, mate.x - w / 2)), top = mate.y - GH * mate.sc - 8 - (b.offsetHeight || 20) + OY * mate.sc;
    b.style.transform = `translate(${Math.round(left)}px,${Math.round(Math.max(2, top))}px)`;
  }
  function setMode(mode, o) { Object.assign(mate, { mode, mt: 0, f: 0, tint: 0, fx: null }, o || {}); }
  function spawnMate(force, at) {
    if (mate.el) return false;
    if (binned && !at) return false; // he is in the Recycle Bin. Restore him (or empty it, if you dare)
    if (!force && (!booted() || document.hidden || ssOn || shown('bsod') || shown('dos') || shown('standby'))) return false;
    mate.sc = phone() ? 1.5 : 2;
    mate.night = hourNow() >= 23 || hourNow() < 5;
    const el = h('div', 'ff-mate'); el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'Gubbinz, the little green helper, walking about');
    const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH;
    cv.style.width = GW * mate.sc + 'px'; cv.style.height = GH * mate.sc + 'px';
    el.appendChild(cv); document.body.appendChild(el);
    Object.assign(mate, { el, cv, g: cv.getContext('2d'), acts: 0, maxActs: phone() ? 3 : ri(4, 7), surf: null, pokes: [], visits: mate.visits + 1 });
    mate.face = Math.random() < 0.5 ? 1 : -1;
    mate.x = mate.face > 0 ? -GW * mate.sc / 2 : innerWidth + GW * mate.sc / 2; mate.y = tbTop();
    setMode('walk', { tx: rnd(innerWidth * 0.2, innerWidth * 0.8), sp: phone() ? 30 : 42 });
    mate.stain = false; el.style.transformOrigin = '50% 85%';
    if (at) { mate.x = at.x; mate.y = at.y; mate.face = at.x < innerWidth / 2 ? 1 : -1; jumpTo(Math.max(30, Math.min(innerWidth - 30, at.x + mate.face * 120)), null); }
    wireMate(el);
    mate.last = 0; mate.raf = requestAnimationFrame(mateTick);
    return true;
  }
  function removeMate(quiet) {
    if (!mate.el) return;
    cancelAnimationFrame(mate.raf); mate.el.remove(); mate.el = null;
    if (mate.bubble) { mate.bubble.remove(); mate.bubble = null; }
    void quiet;
  }
  function scheduleMate(ms) {
    clearTimeout(mate.timer);
    const p = phone();
    mate.timer = setTimeout(() => { if (!spawnMate()) scheduleMate(30000); }, ms || (p ? rnd(480, 900) : rnd(110, 280)) * 1000);
  }
  function surfY() {
    if (!mate.surf) return tbTop();
    const w = mate.surf.el;
    if (!w.isConnected || w.style.display === 'none' || w.classList.contains('min') || w.classList.contains('maxwin')) return null;
    const r = w.getBoundingClientRect();
    if (r.top < 40 || r.width < 100) return null;
    mate.x = r.left + mate.surf.rel; mate.surf.lo = r.left + 12; mate.surf.hi = r.right - 40;
    return r.top;
  }
  function decide() {
    mate.acts++;
    const onWin = !!mate.surf, p = phone(), n = mate.night;
    const lo = onWin ? mate.surf.lo : 20, hi = onWin ? mate.surf.hi : innerWidth - 20;
    if (mate.acts > mate.maxActs) {
      if (onWin) return jumpTo(mate.x + mate.face * 40, null);
      const edge = mate.x < innerWidth / 2 ? -60 : innerWidth + 60;
      return setMode('walk', { tx: edge, sp: p ? 34 : 46, exit: true });
    }
    const r = Math.random();
    if (onWin && r < 0.3) return jumpTo(Math.max(20, Math.min(innerWidth - 20, mate.x + mate.face * rnd(30, 90))), null);
    if (!onWin && !p && r < 0.16) {
      const ws = climbable();
      if (ws.length) { const w = pick(ws), rr = w.getBoundingClientRect(); const tx = rnd(Math.max(rr.left + 30, 30), Math.min(rr.right - 80, innerWidth - 30)); return setMode('walk', { tx, sp: 46, then: () => { const r2 = w.getBoundingClientRect(); if (r2.top > 60) jumpTo(mate.x, { el: w, rel: mate.x - r2.left }); else decide(); } }); }
    }
    const opts = [['walk', 30], ['sit', 12], ['wave', 12], ['eat', 12], ['sleep', n ? 26 : 8], ['yawn', n ? 22 : 3]];
    let tot = opts.reduce((a, o) => a + o[1], 0), q = Math.random() * tot, pickd = 'walk';
    for (const [k, wgt] of opts) { if ((q -= wgt) < 0) { pickd = k; break; } }
    if (pickd === 'walk') return setMode('walk', { tx: rnd(lo, Math.max(lo + 10, hi)), sp: p ? 30 : 42 });
    const dur = { sit: rnd(2.5, 4.5), wave: 2.2, eat: 3.6, sleep: rnd(6, 10), yawn: 1.8 }[pickd];
    setMode('act', { pose: pickd, until: dur });
    if (pickd === 'wave') say(pick(["'Ello!", 'Hiya!', 'Wotcha!', 'It looks like you\'re waving! Want help?', 'Waaagh! (small one)']), 1800);
    if (pickd === 'eat') say(pick(['Pizza! Nom nom.', 'Mmm. Crunchy.', "Don't tell Jack's Mom.", 'Burp.']), 2400);
    if (pickd === 'yawn') say(pick(["*yaaawn* It's late...", 'Shouldn\'t we be in bed?', 'Zzz... wot? I was defragmentin.']), 2200);
  }
  function jumpTo(x, surf) {
    const x0 = mate.x, y0 = mate.y;
    let y1 = tbTop();
    if (surf) y1 = surf.el.getBoundingClientRect().top;
    const dist = Math.abs(y1 - y0), dur = 0.45 + Math.min(0.6, dist / 900);
    setMode('jump', { j: { x0, y0, x1: x, y1, dur, surf, peak: Math.min(y0, y1) - 40 - dist * 0.15 } });
    play('boing');
  }
  function mateTick(t) {
    if (!mate.el) return;
    mate.raf = requestAnimationFrame(mateTick);
    const dt = Math.min(0.05, mate.last ? (t - mate.last) / 1000 : 0.016); mate.last = t;
    mate.mt += dt;
    let pose = 'stand', fr = Math.floor(t / 220);
    switch (mate.mode) {
      case 'walk': {
        const sy = surfY(); if (sy == null) { setMode('fall', { vy: 0 }); mate.surf = null; break; }
        mate.y = sy;
        const dir = Math.sign(mate.tx - mate.x) || 1; mate.face = dir;
        mate.x += dir * mate.sp * dt; if (mate.surf) mate.surf.rel += dir * mate.sp * dt;
        pose = 'walk'; fr = Math.floor(t / (mate.sp > 80 ? 90 : 180));
        if ((dir > 0 && mate.x >= mate.tx) || (dir < 0 && mate.x <= mate.tx)) {
          if (mate.exit) { removeMate(); return; }
          const th = mate.then; mate.then = null; if (th) th(); else decide();
        }
        break;
      }
      case 'act': {
        const sy = surfY(); if (sy == null) { setMode('fall', { vy: 0 }); mate.surf = null; break; }
        mate.y = sy; pose = mate.pose; fr = Math.floor(t / (pose === 'eat' ? 260 : pose === 'dizzy' ? 160 : 420));
        if (mate.mt >= mate.until) { if (pose === 'dizzy') say(pick(['Ooh... my head...', 'Which way is up?', 'Do that again! No, don\'t.']), 1800); decide(); }
        break;
      }
      case 'jump': {
        const j = mate.j, k = Math.min(1, mate.mt / j.dur);
        mate.x = j.x0 + (j.x1 - j.x0) * k;
        const a = j.y0, b2 = j.peak, c = j.y1; mate.y = (1 - k) * (1 - k) * a + 2 * (1 - k) * k * b2 + k * k * c;
        mate.face = Math.sign(j.x1 - j.x0) || mate.face; pose = 'jump';
        if (k >= 1) { mate.surf = j.surf ? { el: j.surf.el, rel: mate.x - j.surf.el.getBoundingClientRect().left } : null; if (surfY() == null) { mate.surf = null; setMode('fall', { vy: 0 }); } else decide(); }
        break;
      }
      case 'fall': {
        const prevY = mate.y; mate.vy += 1500 * dt; mate.y += mate.vy * dt; pose = 'dangle'; fr = Math.floor(t / 120);
        let land = null;
        for (const w of climbable()) { const r = w.getBoundingClientRect(); if (prevY <= r.top && mate.y >= r.top && mate.x > r.left + 10 && mate.x < r.right - 30) { land = { y: r.top, surf: { el: w, rel: mate.x - r.left } }; break; } }
        if (!land && mate.y >= tbTop()) land = { y: tbTop(), surf: null };
        if (land) {
          mate.y = land.y; mate.surf = land.surf; play('thud');
          if (mate.dropH > 70 || mate.vy > 600) { setMode('act', { pose: 'dizzy', until: 3.2 }); got('dizzy'); say('Ow! Ooh, stars...', 1800); }
          else decide();
          mate.dropH = 0;
        }
        break;
      }
      case 'drag': pose = 'dangle'; fr = Math.floor(t / 110); break;
      case 'angry': pose = 'angry'; fr = Math.floor(t / 120); if (mate.mt > 1.2) { const edge = mate.x < innerWidth / 2 ? -60 : innerWidth + 60; mate.surf = null; mate.y = tbTop(); setMode('walk', { tx: edge, sp: 260, exit: true }); } break;
      case 'happy': pose = 'happy'; fr = Math.floor(t / 140); if (mate.mt > 1.1) decide(); break;
      case 'tantrum': { // stood on the rim of the Recycle Bin, going red, shaking and stamping
        pose = 'angry'; fr = Math.floor(t / 100);
        mate.x = mate.bx + Math.sin(t / 22) * 3; mate.fx = { rot: Math.sin(t / 60) * 8, sx: 1, sy: fr % 2 ? 0.94 : 1.04 };
        mate.tint = 0.3 + 0.2 * Math.sin(t / 70);
        if (mate.mt >= mate.until) { setMode('suck', { x0: mate.x, y0: mate.y, bx: mate.bx, by: mate.by, dur: 1.4 }); say('NOOOOOOO!', 1400); fwoop(); }
        break;
      }
      case 'suck': { // the bin wins: stretched, spun and vacuumed in
        const k = Math.min(1, mate.mt / mate.dur), e = k * k;
        mate.x = mate.x0 + (mate.bx - mate.x0) * e; mate.y = mate.y0 + (mate.by + GH * mate.sc * 0.6 - mate.y0) * e;
        mate.fx = { rot: e * 1080, sx: Math.max(0.04, (1 - e) * (1 - k * 0.5)), sy: Math.max(0.04, (1 - e) * (1 + k * 2.2)) };
        mate.tint = 0.3; pose = 'dangle'; fr = Math.floor(t / 80);
        if (k >= 1) { finishBin(); return; }
        break;
      }
    }
    if (!mate.el) return;
    drawGrot(mate.g, pose, fr, t);
    if (mate.tint) { const g2 = mate.g; g2.globalCompositeOperation = 'source-atop'; g2.fillStyle = `rgba(255,30,0,${mate.tint})`; g2.fillRect(0, 0, GW, GH); g2.globalCompositeOperation = 'source-over'; }
    if (mate.stain) { const g2 = mate.g; g2.fillStyle = 'rgba(90,60,20,.8)'; [[9, 21], [10, 21], [10, 22], [11, 22], [8, 23], [16, 20], [17, 21], [17, 22]].forEach(([x, y]) => g2.fillRect(x, y, 1, 1)); }
    const s = mate.sc, left = mate.x - GW * s / 2, top = mate.y - GH * s + 1;
    mate.el.style.transform = `translate(${Math.round(left)}px,${Math.round(top)}px)` + (mate.fx ? ` rotate(${mate.fx.rot.toFixed(1)}deg) scale(${mate.fx.sx.toFixed(3)},${mate.fx.sy.toFixed(3)})` : '');
    mate.cv.style.transform = mate.face < 0 ? 'scaleX(-1)' : '';
    if (mate.bubble && !mate.bubble.hidden) { if (t > mate.sayUntil) mate.bubble.hidden = true; else placeBubble(); }
  }
  function wireMate(el) {
    let down = null;
    el.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); if (mate.mode === 'tantrum' || mate.mode === 'suck') return; down ={ x: ev.clientX, y: ev.clientY, dragging: false }; try { el.setPointerCapture(ev.pointerId); } catch (e) {} });
    el.addEventListener('pointermove', ev => {
      if (!down) return;
      if (!down.dragging && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6) { down.dragging = true; setMode('drag'); mate.surf = null; say(pick(['PUT ME DOWN!', 'Oi! Wheee!', 'Not the ears!', "It looks like you're dragging me!"]), 1500); mate.y0drag = mate.y; }
      if (down.dragging) { mate.x = Math.max(10, Math.min(innerWidth - 10, ev.clientX)); mate.y = Math.max(GH * mate.sc, Math.min(tbTop(), ev.clientY + GH * mate.sc * 0.55)); const bi = binEl(); if (bi) bi.classList.toggle('ff-drop', overBin(ev.clientX, ev.clientY)); }
    });
    const up = ev => {
      if (!down) return;
      const d = down; down = null;
      if (d.dragging) {
        const bi = binEl(); if (bi) bi.classList.remove('ff-drop');
        if (ev.type === 'pointerup' && overBin(ev.clientX, ev.clientY)) return binHim();
        mate.dropH = tbTop() - mate.y; setMode('fall', { vy: 0 }); return;
      }
      poke();
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('click', ev => ev.stopPropagation());
  }
  function poke() {
    const now = Date.now();
    mate.pokes = mate.pokes.filter(p => now - p < 6000); mate.pokes.push(now);
    got('poke');
    if (mate.pokes.length >= 5) { got('angry'); setMode('angry'); say('RIGHT! THAT\'S IT! I\'M OFF!!!', 1600); play('waaagh'); return; }
    setMode('happy'); play('pet');
    say(pick(['Oi! That tickles!', "What? I'm busy!", "It looks like you're poking me. Need help?", "'Ello, boss!", 'Got any jelly babies?', "I wasn't doin nothin!", 'Hehehe.', 'Press Start to continue!']), 1800);
  }
  // keep out of the way of the saver and resizes
  addEventListener('resize', () => { if (mate.el && !mate.surf && mate.mode !== 'drag' && mate.mode !== 'jump') mate.y = tbTop(); });
  const startMate = () => scheduleMate((phone() ? rnd(240, 480) : rnd(50, 100)) * 1000);
  // he no longer strolls along the taskbar by himself (it didn't feel like a real PC); type gubbinz in Start > Run to call him
  void startMate;
  // ---- the Recycle Bin: drop him on it and in he goes (kicking and screaming). Restore brings him back; emptying it does not.
  const binEl = () => $('iconBin');
  function overBin(x, y) { const bi = binEl(); if (!bi || !bi.isConnected) return false; const r = bi.getBoundingClientRect(); return r.width > 0 && x > r.left - 14 && x < r.right + 14 && y > r.top - 20 && y < r.bottom + 10; }
  let binned = !!store.get('jhp_fun_binned', false);
  const GROT_ICO = '<svg viewBox="0 0 32 32"><path d="M4 12l5-2 1-5 4 3h4l4-3 1 5 5 2-5 3v8l-4 6h-6l-4-6v-8z" fill="#3fa52c" stroke="#14300c"/><rect x="11" y="13" width="3" height="3" fill="#ff2a1a"/><rect x="18" y="13" width="3" height="3" fill="#ff2a1a"/><path d="M11 21h10" stroke="#3a0000" stroke-width="2"/><path d="M12 21v2M16 21v2M20 21v2" stroke="#fff"/></svg>';
  const grotEntry = () => ({ id: 'gubbinz', from: 'C:/JACKOS/Desktop', node: { name: 'Gubbinz.grt', type: 'grt', size: '1 KB', date: d99(), svg: GROT_ICO }, confirm: "Are you sure you want to delete 'Gubbinz'?\n\n(He is looking at you through the lid.)", onRestore: releaseGrot, onEmpty: escapeGrot });
  function binHim() {
    const bi = binEl(), r = bi ? bi.getBoundingClientRect() : { left: 20, top: tbTop() - 90, width: 76, height: 70 };
    const cx = r.left + r.width / 2;
    mate.surf = null; mate.x = cx; mate.y = r.top + 13; // feet on the rim of the bin, clinging on
    got('binned'); play('waaagh');
    setMode('tantrum', { bx: cx, by: r.top + 34, until: 2.8 });
    say(pick(["OI! I'M NOT RUBBISH!", 'PUT ME DOWN!', "THAT'S A BIN! I'M NOT A FILE!", "NOOO! IT SMELLS OF HOMEWORK IN THERE!"]), 2600);
  }
  function fwoop() { for (let i = 0; i < 14; i++) setTimeout(() => { try { Sound.note(180 + i * i * 7, 0.09, 'sine'); } catch (e) {} }, i * 55); }
  function finishBin() {
    binned = true; store.set('jhp_fun_binned', true);
    removeMate(true);
    if (Apps.recycle) { Apps.recycle.put(grotEntry()); Apps.recycle.wobble(); }
    play('thud');
    Desk.toast('Recycle Bin', "Gubbinz has been sent to the Recycle Bin. He is not happy about it. You can hear him in there.", 5000);
  }
  function releaseGrot() { // Restore from the bin
    binned = false; store.set('jhp_fun_binned', false); got('grotrestore');
    const bi = binEl(), r = bi ? bi.getBoundingClientRect() : null;
    if (Apps.recycle) Apps.recycle.wobble();
    spawnMate(true, r ? { x: r.left + r.width / 2, y: r.top + 6 } : { x: 60, y: tbTop() });
    mate.stain = true;
    setTimeout(() => say(pick(['Urgh. Bin juice.', "I'm telling Jack about this.", 'That was a crisp packet. A WHOLE WEEK.', 'Never. Again.', 'Ctrl+Z! CTRL+Z!']), 2600), 500);
  }
  function escapeGrot() { // "deleted" along with the rest of the bin... you cannot delete a grot
    setTimeout(() => {
      if (mate.el) return;
      binned = false; store.set('jhp_fun_binned', false); got('grotescape');
      const bi = binEl(), r = bi ? bi.getBoundingClientRect() : null;
      if (Apps.recycle) Apps.recycle.wobble();
      play('boing');
      spawnMate(true, r ? { x: r.left + r.width / 2, y: r.top + 6 } : { x: 60, y: tbTop() });
      setTimeout(() => say(pick(["HA! You can't delete me! I'm a system file!", 'Deleted? ME? Nice try.', "I was only having a nap in there!", 'Extra life! 1-UP!']), 2800), 300);
    }, rnd(2500, 4500));
  }
  S('binned', 'Gubbinz in the bin', 'Somebody small can be dragged somewhere he really does not want to go');
  S('grotrestore', 'Bin juice', 'Fish him back out of the Recycle Bin');
  S('grotescape', "Can't delete Gubbinz", 'Empty the Recycle Bin with him in it. Go on. See what happens');
  if (binned && Apps.recycle) Apps.recycle.put(grotEntry());
  Apps.cmd(['gubbinz', 'grot', 'gubbinz.exe'], () => {
    got('summon');
    if (binned) return Desk.msgbox('Gubbinz.exe', 'Gubbinz is in the Recycle Bin. Somebody put him there.\n\nOpen the Recycle Bin and click Restore. (He will want a word.)', 'warn');
    if (mate.el) { say("I'm RIGHT HERE!", 2000); setMode('happy'); return; }
    spawnMate(true); setTimeout(() => say('You called, boss?', 2400), 400);
  });
  S('poke', 'Poke Gubbinz', 'Somebody small answers to his name in Start > Run. Say hello with your mouse');
  S('angry', 'Poked too far', 'Even little green fellas only have so much patience. Five pokes, maybe?');
  S('dizzy', 'Gubbinz gravity', 'Pick up the little green fella and let him go');
  S('summon', 'He comes when called', 'Type his name where commands go');

  // ---- Gubbinz the Assistant: pops up VERY rarely with a useless tip
  const TIPS = [
    "It looks like you're reading a website. Would you like me to read it LOUDER?",
    'Tip: To make your computer go faster, paint it red.',
    'Tip: You can save loads of time by never saving anything. Saving takes ages.',
    "It looks like you're moving the mouse. Would you like help moving the mouse?",
    'Tip: You turn the computer OFF by pressing START. Nobody knows why.',
    'Did you know? If you press Ctrl+Alt+Del twice, something happens. Don\'t.',
    'Tip: Toast is not compatible with JackOS 98. Do not insert toast into the floppy drive.',
    "It looks like you're writing a letter. Would you like me to eat it?",
    'Tip: Hidden pages are hiding on this site. Try typing words into the address bar. Like "webring".',
    "Tip: Dave's computer is never switched on. Never.",
    "Tip: Some commands in Start > Run are secret. 'xyzzy' is not one of them. (It is.)",
    'Tip: If the screen goes black and flying saucers turn up, wiggle the mouse. Or enjoy it.',
    "It looks like you're playing a game! Would you like me to stand in front of the screen?",
    'Tip: Blowing in the cartridge does not work on CD-ROMs. Please stop blowing in the CD-ROM.',
    'Did you know? A Game Boy runs for ages on 4 AA batteries. I run on biscuits.',
    'Tip: The Network Neighborhood has real people in it. Say hello! Nicely!',
  ];
  let asst = null, asstShown = false, asstNope = 0;
  function assistant(tip, force) {
    if (asst || (!force && (asstShown || ssOn || !booted() || document.hidden))) return;
    asstShown = true; got('assistant');
    const el = h('div', 'ff-asst');
    el.innerHTML = `<div class="ff-asst-say"><p></p><div class="ff-asst-btns"><button class="btn" type="button" data-a="more">Tell me more</button><button class="btn" type="button" data-a="opt">Options</button><button class="btn" type="button" data-a="bye">Go away</button></div></div><div class="ff-asst-box"><div class="tb"><span class="t">Gubbinz</span><span class="ctl"><button type="button" aria-label="Close" data-a="bye">x</button></span></div><canvas width="${GW}" height="${GH}"></canvas></div>`;
    document.body.appendChild(el);
    const p = el.querySelector('p'), cv = el.querySelector('canvas'), g = cv.getContext('2d');
    let i = TIPS.indexOf(tip); if (i < 0) i = ri(0, TIPS.length - 1);
    const show = () => { p.textContent = tip || TIPS[i]; tip = null; };
    show();
    let raf = 0, pose = 'wave', poseT = performance.now();
    const loop = t => { if (!el.isConnected) return; raf = requestAnimationFrame(loop); if (t - poseT > 2200 && pose === 'wave') pose = 'stand'; drawGrot(g, pose, Math.floor(t / 300), t); };
    raf = requestAnimationFrame(loop);
    const bye = () => { pose = 'wave'; el.classList.add('bye'); setTimeout(() => { cancelAnimationFrame(raf); el.remove(); asst = null; }, 600); };
    el.addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'more') { i = (i + 1) % TIPS.length; show(); pose = 'happy'; poseT = performance.now(); setTimeout(() => { pose = 'stand'; }, 900); play('pet'); }
      if (a.dataset.a === 'opt') { p.textContent = 'Options: Show tips: ALWAYS. Annoy level: MAXIMUM. You cannot change these. (You can, but I will not tell you how.)'; }
      if (a.dataset.a === 'bye') { if (++asstNope === 1 && Math.random() < 0.5) { p.textContent = "Are you sure? I've got LOADS more tips. Fine. FINE."; setTimeout(bye, 1600); } else bye(); }
    });
    asst = el; play('join');
  }
  setInterval(() => { if (!asstShown && performance.now() > 300000 && Math.random() < 1 / 12) assistant(); }, 600000);
  document.addEventListener('focusin', ev => { if (ev.target && ev.target.id === 'gbMsg' && !asstShown && Math.random() < 0.35) setTimeout(() => assistant("It looks like you're writing a letter! Would you like help?\n\n( ) Get help with writing the letter\n( ) Just eat the letter"), 900); });
  Apps.cmd(['assistant', 'tips', 'tip', 'helpme'], () => { if (asst) return; assistant(null, true); });
  S('assistant', 'Unhelpful helper', 'A very unhelpful helper turns up when you least need him. Or when you ask for help in the right box');

  // ================================================================ 4. HIDDEN WEB PAGES (type the word in the address bar)
  const RING = ['webring', 'area51', 'y2kbunker', 'cubeclub', 'tetris', 'grotdance', 'hamsterdance', 'gubbinzhome', 'dave', 'matrix', 'konami', 'netscape', 'bsod', 'credits', 'underconstruction', 'oldsite', 'secret', 'admin'];
  const RINGNAME = { webring: 'Nerd Kids WebRing Hub', area51: 'The Truth Is On This Website', y2kbunker: "Jack's Y2K Bunker", cubeclub: 'The Cube Club', tetris: 'Shrine of the Falling Blocks', grotdance: 'The Gubbinz Dance', hamsterdance: 'Do The Blobbit Dance', gubbinzhome: "Gubbinz's Homepage", dave: "Dave's Kool Page", matrix: 'Wake Up', konami: 'The Code', netscape: 'Wrong Browser!', bsod: 'Hall of Famous Crashes', credits: 'The Credits', underconstruction: 'Under Construction', oldsite: "Jack's Home Page (1999 edition)", secret: 'The Secret Page', admin: 'JackNet Admin' };
  const PAGEW = {}; // word -> canonical word (for aliases)
  let pageMusic = '';
  const hits = w => { const m = store.get('jhp_fun_hits', {}); m[w] = (m[w] || 0) + 1; store.set('jhp_fun_hits', m); return m[w]; };
  const lcd = (n, len) => `<span class="ff-hits" aria-label="${n} visitors">${String(n).padStart(len || 6, '0').split('').map(c => `<i>${c}</i>`).join('')}</span>`;
  const counter = (w, base) => `<div class="ff-counter">You are visitor number ${lcd((base || 0) + hits(w))}</div>`;
  const plink = (w, text) => `<a href="#" data-pg="${w}">${text || esc(RINGNAME[w] || w)}</a>`;
  const xlink = (url, text) => `<a href="#" data-ext="${esc(url)}">${text}</a>`;
  function ringFoot(w) {
    const i = Math.max(0, RING.indexOf(w)), prev = RING[(i + RING.length - 1) % RING.length], next = RING[(i + 1) % RING.length];
    return `<div class="ff-ring"><div class="ff-ringlogo"><b>N</b><b>E</b><b>R</b><b>D</b> <b>K</b><b>I</b><b>D</b><b>S</b> <span>WebRing</span></div>
      <div>This site is a member of the <b>Nerd Kids WebRing</b></div>
      <div class="ff-ringnav">[ ${plink(prev, '&laquo; Prev')} | ${plink('webring', 'Hub')} | <a href="#" data-pg="?random">Random</a> | ${plink(next, 'Next &raquo;')} ]</div></div>`;
  }
  function guestbook(w, seed) {
    const mine = (store.get('jhp_fun_gb', {})[w] || []);
    const all = [...mine.map(e => [e.n, e.t, e.d]), ...seed];
    return `<div class="ff-gb"><h3>Sign the Guestbook!</h3><form class="ff-gbform"><input type="text" maxlength="20" placeholder="Your name" aria-label="Your name"><input type="text" maxlength="80" placeholder="Your message" aria-label="Your message"><button class="btn" type="submit">Sign!</button></form>
      <div class="ff-gblist">${all.map(([n, t, d]) => `<div class="ff-gbe"><b>${esc(n)}</b> <small>${esc(d || '')}</small><div>${esc(t)}</div></div>`).join('')}</div></div>`;
  }
  document.addEventListener('submit', ev => {
    const f = ev.target.closest && ev.target.closest('.ff-gbform'); if (!f) return;
    ev.preventDefault();
    const [n, t] = [...f.querySelectorAll('input')].map(i => i.value.trim());
    if (!n || !t) return Desk.toast('Guestbook', 'Fill in your name AND a message!', 2500);
    const pg = f.closest('.ffp').dataset.w, all = store.get('jhp_fun_gb', {});
    all[pg] = [{ n, t, d: d99() }, ...(all[pg] || [])].slice(0, 8); store.set('jhp_fun_gb', all);
    const e = h('div', 'ff-gbe'); e.innerHTML = `<b></b> <small>${d99()}</small><div></div>`; e.querySelector('b').textContent = n; e.lastChild.textContent = t;
    f.nextElementSibling.prepend(e); f.reset(); play('pet');
    Desk.toast('Guestbook', 'Thanks for signing! (Only you can see it. It\'s a very private guestbook.)', 3500);
  });
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('.ffp [data-pg], .ffp [data-ext]'); if (!a) return;
    ev.preventDefault();
    if (a.dataset.ext) return IE.navigate(a.dataset.ext);
    let w = a.dataset.pg; if (w === '?random') { const cur = (document.querySelector('#s-secret > .ffp') || {}).dataset; w = pick(RING.filter(x => !cur || x !== cur.w)); }
    IE.navigate(w); play('click');
  });
  // a rAF loop that only runs while its page is showing; returns start()
  function animator(el, fn) {
    let on = false, last = 0;
    const tick = t => {
      if (!el.isConnected || !el.closest('.sec.on')) { on = false; return; }
      requestAnimationFrame(tick);
      if (!el.offsetParent) { last = 0; return; }
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t; fn(dt, t / 1000);
    };
    return () => { if (on) return; on = true; last = 0; requestAnimationFrame(tick); };
  }
  function page(word, title, cls, html, setup, sname, hint, aliases) {
    PAGEW[word] = word; (aliases || []).forEach(a => { PAGEW[a] = word; });
    S('pg.' + word, sname, hint);
    const make = () => {
      const el = h('div', 'ffp ' + cls); el.dataset.w = word;
      el.innerHTML = html(el);
      const start = setup ? setup(el) : null;
      el._start = typeof start === 'function' ? start : null;
      if (el._start) setTimeout(() => el._start(), 0);
      return el;
    };
    [word, ...(aliases || [])].forEach(w => IE.addPage(w, title, make));
  }
  document.addEventListener('section', e => {
    const d = String(e.detail || '');
    const el = document.querySelector('#s-secret > .ffp');
    if (d.startsWith('secret:')) { const w = PAGEW[d.slice(7)]; if (w) got('pg.' + w); }
    else if (d === 'secret' && el && el._start) el._start();
    if (pageMusic && (!el || el.dataset.w !== pageMusic || !d.startsWith('secret'))) { Sound.music.stop(); pageMusic = ''; }
    if (el && el._stop && !d.startsWith('secret')) el._stop();
  });
  function musicBtn(el, tune, label) {
    const b = el.querySelector('.ff-musicbtn'); if (!b) return;
    b.addEventListener('click', () => {
      if (pageMusic === el.dataset.w) { Sound.music.stop(); pageMusic = ''; b.textContent = '♫ Play the music!'; return; }
      if (!Sound.on) { Sound.on = true; document.dispatchEvent(new Event('sfxchange')); }
      Sound.music.play(tune); pageMusic = el.dataset.w; b.textContent = '■ Stop the music';
    });
  }
  // original chiptunes for the dance pages
  Sound.addTune('grotdance', { step: 0.14, hats: true,
    lead: [67, 0, 67, 70, 72, 0, 70, 67, 65, 0, 65, 67, 70, -1, 67, 0, 67, 0, 67, 70, 72, 0, 75, 72, 70, 0, 67, 65, 67, -1, -1, 0],
    bass: [43, 43, 50, 43, 41, 41, 48, 41, 43, 43, 50, 43, 46, 46, 41, 43] });
  Sound.addTune('squigdance', { step: 0.12, hats: true,
    lead: [72, 74, 76, 0, 76, 74, 72, 0, 79, 0, 76, 0, 72, -1, 0, 0, 74, 76, 77, 0, 77, 76, 74, 0, 79, 0, 77, 76, 74, -1, 72, 0],
    bass: [48, 55, 48, 55, 53, 60, 53, 55, 48, 55, 48, 55, 50, 57, 55, 48] });

  // pixel Blobbit for the dance pages: a round bouncy critter that squashes and stretches, with little ears, big eyes and a grin
  function drawSquigPx(g, f, col) {
    g.clearRect(0, 0, 16, 18);
    const sh = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))))); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
    const dark = sh(col, -0.62), light = sh(col, 0.45);
    const sq = [[6.4, 5.8, 0], [7.0, 5.2, 1], [5.8, 6.4, -1], [6.6, 5.6, 0]][f % 4], cx = 8, cy = 10 - sq[2];
    const top = Math.round(cy - sq[1]);
    // ears (drawn first so the body outline sits over their base)
    for (const ex of [-4, 3]) { g.fillStyle = dark; g.fillRect(cx + ex, top - 2, 3, 3); g.fillStyle = col; g.fillRect(cx + ex + 1, top - 1, 1, 2); }
    for (let y = 0; y < 18; y++) for (let x = 0; x < 16; x++) {
      const e = ((x + 0.5 - cx) / sq[0]) ** 2 + ((y + 0.5 - cy) / sq[1]) ** 2;
      if (e <= 1) { g.fillStyle = e > 0.7 ? dark : (x < cx - 1 && y < cy - 1 && e < 0.45 ? light : col); g.fillRect(x, y, 1, 1); }
    }
    g.fillStyle = '#fff'; g.fillRect(cx - 4, top + 1, 1, 1); // shine
    // big eyes (pupils swap side with the beat)
    g.fillStyle = '#fff'; g.fillRect(cx - 4, cy - 3, 3, 4); g.fillRect(cx + 1, cy - 3, 3, 4);
    g.fillStyle = '#000'; g.fillRect(cx - 4 + (f % 2), cy - 2, 2, 2); g.fillRect(cx + 1 + (f % 2), cy - 2, 2, 2);
    g.fillStyle = '#fff'; g.fillRect(cx - 4 + (f % 2), cy - 2, 1, 1); g.fillRect(cx + 1 + (f % 2), cy - 2, 1, 1);
    // rosy cheeks + grin
    g.fillStyle = '#ffb0c0'; g.fillRect(cx - 5, cy + 1, 1, 1); g.fillRect(cx + 4, cy + 1, 1, 1);
    g.fillStyle = dark; g.fillRect(cx - 2, cy + 2, 1, 1); g.fillRect(cx + 1, cy + 2, 1, 1); g.fillRect(cx - 1, cy + 3, 2, 1);
    // feet
    g.fillStyle = dark; const fy = Math.min(17, Math.round(cy + sq[1]));
    if (f % 2) { g.fillRect(cx - 4, fy, 3, 1); g.fillRect(cx + 2, fy - 1, 3, 1); } else { g.fillRect(cx - 5, fy - 1, 3, 1); g.fillRect(cx + 1, fy, 3, 1); }
  }
  const sprites = (n, cls, w, hgt) => Array.from({ length: n }, (_, i) => `<canvas class="${cls}" width="${w}" height="${hgt}" data-i="${i}"></canvas>`).join('');

  // ---- area51
  page('area51', 'THE TRUTH IS ON THIS WEBSITE', 'ff-a51', () => `
    <div class="ff-c"><div class="ff-ufo" role="button" tabindex="0" aria-label="A UFO. Click it?">${I.ufo}</div>
    <h1 class="ff-glow">THE TRUTH IS ON THIS WEBSITE</h1><p class="blink">*** CLASSIFIED *** CLASSIFIED *** CLASSIFIED ***</p>
    <marquee scrollamount="4">They are watching. They are probably watching. Somebody is definitely watching, because I can hear Dave breathing through the wall.</marquee></div>
    <div class="ff-cols"><div class="ff-box"><h3>SIGHTINGS LOG</h3><table class="ff-tbl"><tr><th>Date</th><th>Where</th><th>What</th></tr>
      <tr><td>12/03/99</td><td>Over the school field</td><td>A light. Moving. Dave says it was a plane. Dave WOULD say that.</td></tr>
      <tr><td>04/06/99</td><td>Back garden</td><td>Something took a bite out of the shed. Mom says it was rot. Rot doesn't have TEETH, Mom.</td></tr>
      <tr><td>21/09/99</td><td>Chip shop car park</td><td>Three lights in a triangle. Then they turned into a bus.</td></tr>
      <tr><td>??/??/99</td><td>Under my bed</td><td>Green, small, pointy ears. (Oh. That's just Gubbinz.)</td></tr></table></div>
    <div class="ff-box"><h3>EVIDENCE</h3><div class="ff-blurs"><figure><i></i><figcaption>Photo 1: UFO (blurry because it was going fast)</figcaption></figure><figure><i class="b2"></i><figcaption>Photo 2: The same UFO, or my thumb</figcaption></figure></div>
      <h3>HOW TO SPOT A UFO</h3><ol><li>Look up.</li><li>Keep looking up.</li><li>Ignore your neck hurting.</li><li>If it has wings and a flashing light, it's a plane. Probably.</li></ol></div></div>
    <p class="ff-c">TRUST NO ONE. (except Gubbinz. and maybe not Gubbinz.)</p>
    <p class="ff-c ff-small">See also: ${plink('y2kbunker', 'the Y2K Bunker')} &middot; ${plink('matrix', 'something weird')} &middot; ${xlink('http://www.thetruthisoutthere.infobahn', 'my mate\'s UFO page')}</p>
    ${counter('area51', 51)}${ringFoot('area51')}`, el => {
    let n = 0; const u = el.querySelector('.ff-ufo');
    const hit = () => { n++; play('zap'); u.classList.remove('wob'); void u.offsetWidth; u.classList.add('wob');
      if (n === 3) { u.classList.add('beam'); got('abducted'); Desk.toast('INCOMING TRANSMISSION', 'Greetings, Earth child. We have taken your cursor for study. You may keep the mouse.', 6000); document.body.classList.add('ff-nocursor'); setTimeout(() => { document.body.classList.remove('ff-nocursor'); u.classList.remove('beam'); }, 4000); } };
    u.addEventListener('click', hit); u.addEventListener('keydown', e => { if (e.key === 'Enter') hit(); });
  }, 'Area 51 (and a bit)', 'Some pages are only for those who know where the aliens are kept');
  S('abducted', 'Abducted!', 'Click something in the sky. Then again. And again');

  // ---- grotdance
  page('grotdance', 'THE GUBBINZ DANCE!!!', 'ff-gdance', () => `
    <h1 class="ff-c ff-rbw">THE GUBBINZ DANCE!!!</h1>
    <marquee scrollamount="7" class="ff-mq">DANCE GUBBINZ DANCE!!! &nbsp; &#9733; &nbsp; THE GUBBINZ DANCE!!! &nbsp; &#9733; &nbsp; STOMP STOMP BOOGIE &nbsp; &#9733;</marquee>
    <div class="ff-c"><button class="btn big ff-musicbtn" type="button">&#9835; Play the music!</button></div>
    <div class="ff-dancers">${sprites(12, 'ff-dg', GW, GH)}</div>
    <p class="ff-c">12 Gubbinzes dancing! &nbsp; Can YOU do the Gubbinz dance? Stick your arms up! Wave 'em about! Fall over!</p>
    <p class="ff-c ff-small">Music: <i>gubbinz_dance.mid</i> by Jack (it's original, I made it on the keyboard with the demo button off)</p>
    <p class="ff-c">If you liked this, you'll LOVE ${plink('hamsterdance', 'Do The Blobbit Dance')}!</p>
    ${counter('grotdance', 1999)}${ringFoot('grotdance')}`, el => {
    musicBtn(el, 'grotdance');
    const cvs = [...el.querySelectorAll('.ff-dg')].map(c => c.getContext('2d')), POSES = ['wave', 'happy', 'jump', 'walk', 'wave', 'dizzy'];
    return animator(el, (dt, t) => cvs.forEach((g, i) => { const beat = Math.floor(t * 3.4 + (i % 3)), pose = POSES[Math.floor((t / 2.4 + i * 0.37)) % POSES.length]; drawGrot(g, pose, beat, t * 1000); }));
  }, 'Gubbinz disco', 'The little green fella loves to dance. The address is the clue', ['gubbinzdance']);

  // ---- hamsterdance (Blobbits, of course)
  page('hamsterdance', 'DO THE BLOBBIT DANCE!!!', 'ff-sqd', () => `
    <h1 class="ff-c ff-rbw">DO THE BLOBBIT DANCE!!!</h1>
    <div class="ff-c"><button class="btn big ff-musicbtn" type="button">&#9835; Play the music!</button></div>
    <div class="ff-squigs">${sprites(32, 'ff-sq', 16, 18)}</div>
    <marquee scrollamount="9" class="ff-mq">BOING BOING BOING &nbsp; BLOBBITS BLOBBITS BLOBBITS &nbsp; DO THE BLOBBIT DANCE &nbsp; BOING BOING</marquee>
    <p class="ff-c"><b>FACT:</b> No Blobbits were harmed in the making of this page. One Blobbit was mildly annoyed.</p>
    <p class="ff-c ff-small">Blobbit animations drawn by Jack, pixel by pixel. Took ages. Music original. Please don't steal my Blobbits.</p>
    <p class="ff-c">Too much? Calm down at ${plink('tetris', 'the Shrine')}. Not enough? ${plink('grotdance', 'THE GUBBINZ DANCE')}!</p>
    ${counter('hamsterdance', 8812)}${ringFoot('hamsterdance')}`, el => {
    musicBtn(el, 'squigdance');
    const COLS = ['#e8381b', '#e8381b', '#d81b60', '#ff6a00'];
    const cvs = [...el.querySelectorAll('.ff-sq')].map(c => c.getContext('2d'));
    return animator(el, (dt, t) => cvs.forEach((g, i) => drawSquigPx(g, Math.floor(t * 6 + (i % 4)), COLS[i % 4])));
  }, 'Hamster fever', 'There was a famous dancing rodent page. This site has its own version, with Blobbits', ['squigdance', 'blobbitdance']);

  // ---- y2kbunker
  const Y2KLIST = ['Tins of beans (12)', 'A tin opener (the MANUAL sort!!!)', 'Torch + spare batteries', 'Candles (ask Mom first)', 'Bottled water', 'Board games (no batteries needed)', 'Some cash from the bank in case the cash machines go mad', 'Write down everyone\'s phone numbers on PAPER', 'Print out my high scores', 'Unplug the video recorder (just in case)'];
  page('y2kbunker', "Jack's Y2K Bunker", 'ff-y2k', () => {
    const t = today(), left = Math.max(0, Math.round((new Date(2000, 0, 1) - t.date) / 86400000)), done = store.get('jhp_fun_y2k', []);
    return `<div class="ff-c"><svg class="ff-bug" viewBox="0 0 32 24" width="96" height="72" aria-hidden="true"><rect x="10" y="6" width="12" height="14" fill="#2a2a2a"/><rect x="12" y="2" width="8" height="5" fill="#2a2a2a"/><rect x="13" y="3" width="2" height="2" fill="#f00"/><rect x="17" y="3" width="2" height="2" fill="#f00"/><path d="M10 9H5M10 13H4M10 17H5M22 9h5M22 13h6M22 17h5M14 2l-3-2M18 2l3-2" stroke="#2a2a2a" stroke-width="1.5"/><text x="16" y="16" font-size="6" fill="#ff0" text-anchor="middle" font-family="monospace">Y2K</text></svg>
      <h1>MILLENNIUM BUG SURVIVAL GUIDE</h1><div class="ff-y2kcount"><b>${left}</b> DAYS UNTIL THE YEAR 2000</div>
      <p class="blink">!!! DON'T PANIC !!! (but maybe panic a little bit)</p></div>
      <div class="ff-cols"><div class="ff-box"><h3>WHAT IS THE MILLENNIUM BUG?</h3><p>Loads of old computers only store the year as two numbers, to save memory. So 1999 is "99". When it goes to "00", some computers might think it's <b>1900</b>! Then they might go wrong. Or not. Nobody knows!!!</p>
        <p>Things that might go wrong: cash machines, video recorders, digital watches, my nan's microwave (it's already broken though).</p>
        <h3>IS YOUR STUFF Y2K READY?</h3><div class="row"><select class="ff-y2ksel" aria-label="Thing to test"><option>Video recorder</option><option>Toaster</option><option>Nan's microwave</option><option>Digital watch</option><option>Dave</option><option>Gubbinz</option><option>This computer</option></select><button class="btn ff-y2kgo" type="button">Test it!</button></div><p class="ff-y2kres"></p></div>
      <div class="ff-box"><h3>BUNKER CHECKLIST</h3>${Y2KLIST.map((x, i) => `<label class="ff-chk"><input type="checkbox" data-i="${i}"${done.includes(i) ? ' checked' : ''}> ${esc(x)}</label>`).join('')}<p class="ff-y2kok"></p></div></div>
      <p class="ff-c">Party plans for the 31st: see ${xlink('http://www.davesparty99.jnet', "Dave's party page")} (not finished). UFO-related doom: see ${plink('area51', 'the truth')}.</p>
      ${counter('y2kbunker', 2000)}${ringFoot('y2kbunker')}`;
  }, el => {
    const RES = { 'Video recorder': 'Y2K STATUS: Already flashing 00:00. Has been since 1994. NO CHANGE.', Toaster: 'Y2K STATUS: The toaster does not know what year it is. The toaster does not CARE. COMPLIANT.', "Nan's microwave": 'Y2K STATUS: Thinks it is 1900. Will cook your dinner in the style of 1900 (on a fire).', 'Digital watch': 'Y2K STATUS: Will say 01-01-00. Will still be 3 minutes slow.', Dave: 'Y2K STATUS: Dave does not know what year it is NOW. NOT COMPLIANT.', Gubbinz: 'Y2K STATUS: Gubbinz uses the "number of biscuits eaten" calendar. Totally safe. Woo-hoo!', 'This computer': 'Y2K STATUS: JackOS 98 is fully Y2K compliant! It will simply go back to 1999. Forever. (This is a feature.)' };
    el.querySelector('.ff-y2kgo').addEventListener('click', () => { const r = el.querySelector('.ff-y2kres'); r.textContent = 'Testing... beep... boop...'; setTimeout(() => { r.textContent = RES[el.querySelector('.ff-y2ksel').value]; play('beep'); }, 700); });
    const check = () => {
      const done = [...el.querySelectorAll('.ff-chk input')].filter(c => c.checked).map(c => +c.dataset.i); store.set('jhp_fun_y2k', done);
      const ok = done.length === Y2KLIST.length; el.querySelector('.ff-y2kok').innerHTML = ok ? '<b class="blink">YOU ARE Y2K READY!!!</b> See you in the year 2000. Bring beans.' : `${done.length} of ${Y2KLIST.length} ready.`;
      return ok;
    };
    el.querySelectorAll('.ff-chk input').forEach(c => c.addEventListener('change', () => { if (check()) { got('y2kready'); play('solve'); } }));
    check();
  }, 'Bunker down', 'Prepare for the Millennium Bug. The bunker has an address');
  S('y2kready', 'Y2K ready', 'Tick every box on the survival checklist');

  // ---- gubbinzhome (just "gubbinz" goes to his pet page, so his own homepage lives here)
  page('gubbinzhome', "GUBBINZ'S HOMEPAGE", 'ff-gub', () => `
    <h1 class="ff-c">WELCUM TO GUBBINZ HOMEPAGE!!!1</h1>
    <div class="ff-c"><canvas class="ff-gubme" width="${GW}" height="${GH}" aria-label="Gubbinz waving"></canvas></div>
    <p class="ff-c"><b>this iz MY PAGE.</b> i made it myself on Jack's komputer when he woz at skool. dont tell Jack.</p>
    <div class="ff-cols"><div class="ff-box"><h3>THINGS I LIKE</h3><ul><li>PIZZA</li><li>roopeez (shiny wunz)</li><li>Tetris (i got to level 2)</li><li>Jack's Game Boy (wen he's not lookin)</li><li>pressin the big red button on the front page</li></ul></div>
    <div class="ff-box"><h3>THINGS I DONT LIKE</h3><ul><li>baths</li><li>the hoover</li><li>DAVE <span class="blink">!!!</span></li><li>wen the komputer sez "illegal operashun". i woz NOT doin anyfin illegal</li></ul></div>
    <div class="ff-box"><h3>MY MATES</h3><ul><li>Pixel Pete (a Tamagotchi)</li><li>a rock (called Kevin)</li><li>Jack (he feeds me)</li><li>${plink('grotdance', 'THE GUBBINZ DANCE (my cousins)')}</li></ul></div></div>
    <p class="ff-c ff-big">REMEMBA: <span class="ff-red">ALWAYS BLOW ON THE CARTRIDGE</span></p>
    ${guestbook('gubbinzhome', [['Pixel Pete', 'nice page gubbinz. can i hav a jelly baby', '02/09/99'], ['Gubbinz', 'NO', '02/09/99'], ['Jack', 'Gubbinz how did you get on the internet', '05/09/99']])}
    <p class="ff-c">this page has been looked at ${lcd(hits('gubbinzhome') + 41, 4)} times. thats a LOT of roopeez.</p>${ringFoot('gubbinzhome')}`, el => {
    const g = el.querySelector('.ff-gubme').getContext('2d');
    return animator(el, (dt, t) => drawGrot(g, Math.floor(t / 3) % 2 ? 'wave' : 'happy', Math.floor(t * 4), t * 1000));
  }, "Gubbinz's homepage", 'The little green fella has his own homepage. Try his name in the address bar', ['gubbinzpage', 'grothome', 'gubbinz']);

  // ---- dave
  page('dave', "DAVE'S KOOL PAGE!!!", 'ff-dave', () => `
    <h1 class="ff-c ff-rbw">WELCOME 2 DAVE'S KOOL PAGE!!!</h1>
    <div class="ff-c"><span class="ff-ucsign">UNDER CONSTRUCTION</span></div>
    <div class="ff-jack">JACK SAYS: Dave. Yellow background + Comic Sans = actual eye damage. -J</div>
    <h3>ABOUT ME</h3><p>My name is Dave. I am the best at GoldenEye in our whole school. I have a dog called Biscuit and a cousin who has been on the telly (in the background).</p>
    <div class="ff-jack">JACK SAYS: He is NOT the best at GoldenEye. I beat him 12-3 on Facility. He picked Oddjob.</div>
    <h3>MY TOP 5 GAMES</h3><ol><li>GoldenEye</li><li>Mario Kart 64</li><li>GoldenEye again</li><li>That one with the dragon</li><li>Snake (on my dad's phone)</li></ol>
    <h3>MY KOOL LINKS</h3><ul><li>${xlink('http://www.daveskoollinks.jnet', 'More kool links')}</li><li>${xlink('http://www.biscuitthedog.webcom', 'My dog\'s page (coming soon)')}</li><li>${xlink('http://www.cheatz4u.w3b', 'CHEATZ 4 U')}</li><li>${plink('webring', 'Jack\'s webring thing (he made me put this here)')}</li></ul>
    <div class="ff-jack">JACK SAYS: Every link on this page is broken. Every. One.</div>
    <div class="ff-c"><button class="btn ff-davemidi" type="button">&#9835; Play my MIDI!</button></div>
    ${guestbook('dave', [["Dave's Mom", 'Lovely website David. Now come and get your tea.', '11/07/99'], ['Jack', 'this page is rubbish (the GoldenEye bit is funny though)', '12/07/99'], ['Dave', 'SHUT UP JACK', '12/07/99'], ['Biscuit', 'woof', '14/07/99']])}
    <p class="ff-c">This page has been viewed ${lcd(hits('dave') + 6, 3)} times (5 of them were me)</p>${ringFoot('dave')}`, el => {
    el.querySelector('.ff-davemidi').addEventListener('click', () => { Sound.note(440, 0.6, 'square'); Desk.toast('dave_theme.mid', "That's it. That's the whole song. It's one beep. -Jack", 4000); });
  }, "Dave's rubbish homepage", 'Jack\'s best mate has a homepage too. It is just his name');

  // ---- admin (a trap)
  page('admin', 'JackNet Admin Login', 'ff-admin', () => `
    <div class="ff-term"><pre>JACKNET MAINFRAME v1.99
=======================
AUTHORISED PERSONNEL ONLY
(that means Jack)
</pre><form class="ff-login" autocomplete="off"><label>USERNAME: <input type="text" maxlength="20" spellcheck="false"></label><label>PASSWORD: <input type="password" maxlength="20" autocomplete="off"></label><button class="btn" type="submit">LOG IN</button></form><pre class="ff-out" aria-live="polite"></pre></div>
    ${ringFoot('admin')}`, el => {
    const out = el.querySelector('.ff-out'), f = el.querySelector('.ff-login');
    let busy = false;
    f.addEventListener('submit', ev => {
      ev.preventDefault(); if (busy) return; busy = true;
      const pw = f.querySelectorAll('input')[1].value.trim().toLowerCase(); f.querySelectorAll('input')[1].value = '';
      const good = ['gubbinz', 'squig', 'squigs', 'waaagh', 'password'].includes(pw);
      const lines = ['> CONNECTING TO MAINFRAME...', '> BYPASSING FIREWALL... [##########] 100%', '> DECRYPTING PASSWORD...', '> CHECKING WITH MOM...', ''];
      let i = 0, c = 0; out.textContent = '';
      const iv = setInterval(() => {
        if (!el.isConnected) { clearInterval(iv); return; }
        if (i >= lines.length) {
          clearInterval(iv); busy = false;
          if (good) { out.innerHTML += '<b class="ff-granted">ACCESS GRANTED</b>\n\nWelcome, admin. You now have full access to:\n  - the biscuit tin\n\n(It\'s empty. Dave was here.)'; got('adminpass'); play('solve'); }
          else { out.innerHTML += '<b class="ff-denied blink">ACCESS DENIED</b>\n'; play('uhoh'); setTimeout(() => { if (el.isConnected) out.innerHTML += '\nNice try, hacker.\nThis incident has been reported to Jack\'s Mom.\nShe says: tidy your room.\n\n   (\\_/)\n  ( >.<)  &lt;-- Gubbinz, laughing at you\n  (")(")\n'; }, 1200); }
          return;
        }
        const L = lines[i]; c += 2; out.textContent = out.textContent.replace(/[^\n]*$/, '') + L.slice(0, c);
        if (c >= L.length) { out.textContent += '\n'; i++; c = 0; play('click'); }
      }, 35);
    });
  }, 'Hack the mainframe', 'Every website has a page for the person in charge. Try being in charge');
  S('adminpass', 'Inside job', 'The admin password is something small, green and obvious');

  // ---- webring hub
  const RINGDESC = { area51: 'UFOs, sightings, and a blurry photo of my thumb', y2kbunker: 'Survive the Millennium Bug! Beans!', cubeclub: 'Learn to solve the cube, layer by layer', tetris: 'A shrine to the falling blocks', grotdance: 'Dancing Gubbinzes. That\'s it. That\'s the site.', hamsterdance: 'Dancing Blobbits. Even more of it.', gubbinzhome: 'Written by Gubbinz. Spelling may vary.', dave: 'Dave\'s page. Sorry in advance.', matrix: 'Wake up...', konami: 'Do you know the code?', netscape: 'Are you using the right browser?', bsod: 'Famous crashes (and a free one)', credits: 'Who made all this', underconstruction: 'Coming soon!!!', oldsite: 'The old version of Jack\'s site', secret: 'There is no secret page', admin: 'Staff only. NO ENTRY.' };
  page('webring', 'The Nerd Kids WebRing', 'ff-wr', () => `
    <div class="ff-c"><div class="ff-ringbig"><span>NERD</span><span>KIDS</span><span>WEB</span><span>RING</span></div>
    <h1>The Nerd Kids WebRing</h1><p>Welcome to the hub! There are <b>${RING.length - 1}</b> sites in the ring (and a few that fell off).</p></div>
    <table class="ff-tbl ff-wrlist"><tr><th>#</th><th>Site</th><th>What's on it</th></tr>
      ${RING.filter(w => w !== 'webring').map((w, i) => `<tr><td>${i + 1}</td><td>${plink(w)}</td><td>${esc(RINGDESC[w] || '')}</td></tr>`).join('')}
      <tr class="dead"><td>-</td><td>${xlink('http://www.kevinspetrock.netz', "Kevin's Pet Rock Page")}</td><td>(site moved)</td></tr>
      <tr class="dead"><td>-</td><td>${xlink('http://members.freehost99.netz/~gary/', "Gary's Cheats")}</td><td>(Gary's cousin. Cheats are all made up.)</td></tr></table>
    <div class="ff-c"><button class="btn ff-join" type="button">Join the ring!</button></div>
    <p class="ff-c ff-small">Rules: 1. Must be made by a kid. 2. Must have at least one animated thing. 3. No being horrible. 4. Dave is allowed in but only because he asked nicely.</p>
    ${counter('webring', 300)}${ringFoot('webring')}`, el => {
    el.querySelector('.ff-join').addEventListener('click', () => Desk.msgbox('Join the Nerd Kids WebRing', 'Thanks! Your application has been sent to the ring master. By pigeon. Allow 6-8 weeks.', 'info'));
  }, 'Lord of the rings', 'Clubs of websites hold hands in a circle. There is a hub');

  // ---- cubeclub
  const CUBESTEPS = [
    ['1. The white cross', 'Make a white plus sign on top. The edge pieces have to match the centre colours on the sides too, not just be white. Take your time, there\'s no algorithm, just fiddling.'],
    ['2. The white corners', 'Turn the cube so white is on the BOTTOM. Find a white corner in the top layer, put it above where it needs to go (front-right), then do <code>R U R\' U\'</code> until it pops in the right way round. Repeat for all 4.'],
    ['3. The middle layer', 'Find an edge in the top layer with no yellow on it. Line it up with its centre. If it needs to go right: <code>U R U\' R\' U\' F\' U F</code>. If it needs to go left: <code>U\' L\' U L U F U\' F\'</code>.'],
    ['4. The yellow cross', 'Yellow is on top now. Do <code>F R U R\' U\' F\'</code>. You get a dot, then an L shape, then a line, then a cross. Hold the L at the back-left, and the line flat (left to right), before each go.'],
    ['5. Yellow on top', 'Do <code>R U R\' U R U2 R\'</code>. Look at the top again and repeat (turning the top layer to try different spots) until it\'s all yellow.'],
    ['6. Yellow corners in place', 'Find a corner that\'s in the right spot (even if twisted) and hold it at the front-right. Do <code>U R U\' L\' U R\' U\' L</code>. Repeat until all 4 corners are in the right spots.'],
    ['7. The last edges', 'Put a finished side at the BACK. Do <code>F2 U L R\' F2 L\' R U F2</code>. Do it again if needed. Then... IT\'S SOLVED!!! Scream a bit.'],
  ];
  page('cubeclub', 'THE CUBE CLUB', 'ff-cube', () => `
    <div class="ff-c"><div class="ff-cubelogo">${['#e10600', '#fff', '#0028c8', '#ffd400', '#0a0', '#ff8c00', '#0a0', '#e10600', '#fff'].map(c => `<i style="background:${c}"></i>`).join('')}</div><h1>THE CUBE CLUB</h1><p>For people who can solve it, people who nearly can, and people who peel the stickers off (DAVE).</p></div>
    <div class="ff-box"><h3>HOW TO READ THE MOVES</h3><p><code>R</code> = turn the right side clockwise (as if you're looking at it). <code>L</code> left, <code>U</code> up (top), <code>D</code> down (bottom), <code>F</code> front, <code>B</code> back. A dash like <code>R'</code> means anticlockwise. <code>2</code> means twice.</p></div>
    <h2>THE BEGINNER'S METHOD (layer by layer)</h2>${CUBESTEPS.map(([t, d]) => `<div class="ff-step"><b>${t}</b><p>${d}</p></div>`).join('')}
    <div class="ff-cols"><div class="ff-box"><h3>CLUB RECORDS</h3><table class="ff-tbl"><tr><td>Jack</td><td>1:52</td></tr><tr><td>Jack's cousin</td><td>3:10</td></tr><tr><td>Gubbinz</td><td>(ate a corner)</td></tr><tr><td>Dave</td><td>4:30 (peeled the stickers off, DISQUALIFIED)</td></tr></table>
      <p class="ff-small">Did you know? The world championship in 1982 was won in 22.95 seconds. TWENTY-TWO SECONDS. I can't even find the white edges in that time.</p></div>
      <div class="ff-box"><h3>SCRAMBLE GENERATOR</h3><p>Hold white on top, green at the front, and do this:</p><p class="ff-scr"></p><button class="btn ff-scrbtn" type="button">New scramble</button><p class="ff-small">Or have a go on the ${'<a href="#" data-go="demos">MegaCube in the Games Arcade</a>'} that everyone shares!</p></div></div>
    ${counter('cubeclub', 333)}${ringFoot('cubeclub')}`, el => {
    const gen = () => { el.querySelector('.ff-scr').textContent = scramble(); };
    el.querySelector('.ff-scrbtn').addEventListener('click', () => { gen(); play('turn'); }); gen();
  }, 'Cube clubber', 'Clubs for people who love twisty puzzles have their own pages');
  function scramble(n) {
    const F = ['R', 'L', 'U', 'D', 'F', 'B'], AX = { R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 }, out = [];
    let last = '', last2 = '';
    while (out.length < (n || 20)) { const f = pick(F); if (f === last || (AX[f] === AX[last] && f === last2)) continue; out.push(f + pick(['', "'", '2'])); last2 = last; last = f; }
    return out.join(' ');
  }

  // ---- tetris shrine
  const PIECES = { I: ['####'], O: ['##', '##'], T: ['###', '.#.'], S: ['.##', '##.'], Z: ['##.', '.##'], J: ['#..', '###'], L: ['..#', '###'] };
  const PCOL = { I: '#00e5ff', O: '#ffd400', T: '#a000f0', S: '#00d000', Z: '#e10600', J: '#0028c8', L: '#ff8c00' };
  page('tetris', 'Shrine of the Falling Blocks', 'ff-tet', () => `
    <div class="ff-fall" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 7.3) % 100}%;animation-delay:-${(i * 1.7) % 9}s;animation-duration:${7 + (i % 5)}s;background:${Object.values(PCOL)[i % 7]}"></i>`).join('')}</div>
    <div class="ff-c ff-z"><div class="ff-candles"><i></i><i></i><i></i></div><h1>THE SHRINE OF THE FALLING BLOCKS</h1><p><i>Here we honour the greatest game ever made. Please take your shoes off.</i></p></div>
    <div class="ff-box ff-z"><h3>THE HOLY FACTS</h3><ul><li>The game was invented in <b>1984</b> by a Russian computer scientist, <b>Alexey Pajitnov</b>, in Moscow.</li><li>The Game Boy version came out in <b>1989</b>. Mine has a crack in the screen and it still works. LEGEND.</li><li>The famous music (Music A) is an old Russian folk song called <b>Korobeiniki</b>.</li><li>Clearing 4 lines at once is called a TETRIS. It is the best feeling in the world. Fact.</li></ul></div>
    <div class="ff-box ff-z"><h3>THE SEVEN SACRED PIECES</h3><div class="ff-pieces">${Object.entries(PIECES).map(([k, rows]) => `<figure><div class="ff-pc" style="grid-template-columns:repeat(${rows[0].length},14px)">${rows.join('').split('').map(c => `<i style="${c === '#' ? 'background:' + PCOL[k] : 'visibility:hidden'}"></i>`).join('')}</div><figcaption>${k}</figcaption></figure>`).join('')}</div>
      <p class="ff-small">The long one is the I. It never comes when you need it. This is the ancient curse.</p></div>
    <div class="ff-box ff-z"><h3>A PRAYER TO THE LONG BAR</h3><p class="ff-c"><i>O Long Bar, four blocks in a row,<br>I have left a gap for thee, down below.<br>Come now, not later, I am at the top,<br>Come now, O Long Bar, before it all stops.</i></p></div>
    <p class="ff-c ff-z"><a href="#" data-go="demos"><b>&#9654; Play JACKTRIS in the Games Arcade</b></a> &middot; ${plink('cubeclub', 'the Cube Club')}</p>
    <div class="ff-z">${counter('tetris', 1984)}${ringFoot('tetris')}</div>`, null, 'Block worshipper', 'The greatest falling-block game has a shrine. Type its name');

  // ---- under construction
  const DIGGER = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 38 20 20 38 2 20z" fill="#ffd400" stroke="#000" stroke-width="2"/><circle cx="17" cy="12" r="2.5" fill="#000"/><path d="M17 15l-2 8 4 0 1 7M15 23l-3 6M16 17l6 3" stroke="#000" stroke-width="2.2" fill="none"/><path class="ff-shovel" d="M22 20l6 6" stroke="#000" stroke-width="1.6"/><path d="M27 25l3 3-2 1z" fill="#000"/><path d="M10 31h11" stroke="#000" stroke-width="2"/></svg>';
  page('underconstruction', 'UNDER CONSTRUCTION', 'ff-uc', () => `
    <div class="ff-ucgrid">${Array.from({ length: 6 }, (_, i) => `<div class="ff-ucs" style="animation-delay:-${i * 0.3}s">${DIGGER}<b>UNDER<br>CONSTRUCTION</b><span class="ff-lamp"></span></div>`).join('')}</div>
    <marquee class="ff-mq" scrollamount="6">&#9888; THIS PAGE IS UNDER CONSTRUCTION &#9888; CHECK BACK SOON!!! &#9888; HARD HATS MUST BE WORN &#9888; THIS PAGE IS UNDER CONSTRUCTION &#9888;</marquee>
    <p class="ff-c ff-big">COMING SOON!!!</p>
    <div class="ff-c"><div class="prog ff-ucprog"><span style="display:flex;gap:2px">${'<i></i>'.repeat(29)}</span></div><p>99% complete (since 1997)</p></div>
    <div class="ff-ucgrid">${Array.from({ length: 6 }, (_, i) => `<div class="ff-ucs" style="animation-delay:-${i * 0.45}s">${DIGGER}<b>SORRY<br>OUR MESS</b><span class="ff-lamp"></span></div>`).join('')}</div>
    <p class="ff-c ff-small">This page will have: something. Probably. Maybe a picture. ${plink('oldsite', 'The old site')} had one of these too.</p>
    ${counter('underconstruction', 97)}${ringFoot('underconstruction')}`, null, 'Hard hat area', 'Every 1999 site has a page that is not finished. Its name is what it says on the sign');

  // ---- matrix
  page('matrix', 'Wake up...', 'ff-mx', () => `<canvas class="ff-mxc" aria-hidden="true"></canvas><div class="ff-mxbox"><pre class="ff-mxt"></pre><div class="ff-pills" hidden><button class="ff-pill red" type="button">Red pill</button><button class="ff-pill blue" type="button">Blue pill</button></div></div>`, el => {
    const cv = el.querySelector('.ff-mxc'), out = el.querySelector('.ff-mxt'), pills = el.querySelector('.ff-pills');
    const LINES = ['Wake up, reader...', 'The JackNet has you...', 'Follow the white mouse.', '', 'Knock, knock.'];
    let stop = null, typer = 0;
    el.querySelector('.red').addEventListener('click', () => { Savers.start('Digital Rain', { pill: true, msg: ['Wake up, reader...', 'The JackNet has you...', 'Follow the white mouse...', 'Whoa.'] }); });
    el.querySelector('.blue').addEventListener('click', () => { Desk.toast('Blue pill', "You wake up in your bed. It was all a dream. Mom's shouting that tea's ready.", 5000); IE.go('home', 'click'); });
    el._stop = () => { if (stop) stop(); stop = null; clearInterval(typer); typer = 0; };
    return () => {
      if (!stop) stop = runSaver(cv, 'Digital Rain', false);
      if (typer) return;
      out.textContent = ''; pills.hidden = true;
      let i = 0, c = 0, wait = 0;
      typer = setInterval(() => {
        if (!el.isConnected) { el._stop(); return; }
        if (wait > 0) { wait--; return; }
        if (i >= LINES.length) { clearInterval(typer); typer = -1; pills.hidden = false; return; }
        const L = LINES[i];
        if (c < L.length) { out.textContent += L[c++]; play('click'); } else { out.textContent += '\n'; i++; c = 0; wait = 14; }
      }, 90);
    };
  }, 'Wake up', 'The film everyone saw this year has a page. One word');

  // ---- konami
  const KSEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  page('konami', 'THE CODE', 'ff-kon', () => `
    <h1 class="ff-c">THE CODE</h1><p class="ff-c">This page is locked. Enter <b>THE CODE</b> to continue. (Real gamers know it.)</p>
    <div class="ff-pad"><div class="ff-dpad"><button type="button" data-k="ArrowUp" aria-label="Up">&#9650;</button><button type="button" data-k="ArrowLeft" aria-label="Left">&#9664;</button><button type="button" data-k="ArrowRight" aria-label="Right">&#9654;</button><button type="button" data-k="ArrowDown" aria-label="Down">&#9660;</button></div><div class="ff-ab"><button type="button" data-k="b">B</button><button type="button" data-k="a">A</button></div></div>
    <p class="ff-c ff-kprog">&nbsp;</p>
    <div class="ff-kres" hidden><h2 class="ff-c ff-rbw">+30 LIVES!!!</h2>
      <div class="ff-box"><h3>ABOUT THE CODE</h3><p>Up, Up, Down, Down, Left, Right, Left, Right, B, A. It first turned up in a space shooter in the 80s (the programmer put it in because the game was too hard for him!) and then a run-and-gun game made it famous by giving you 30 lives.</p>
      <p>Now it works on loads of things. Including this computer. Try it on the desktop!</p></div>
      <p class="ff-c">More cheats: <a href="#" data-go="cheats">the Cheats page</a> &middot; ${plink('tetris', 'the Shrine')}</p></div>
    ${ringFoot('konami')}`, el => {
    let pos = 0;
    const prog = el.querySelector('.ff-kprog');
    const press = k => {
      if (!el.isConnected || !el.closest('.sec.on')) return;
      pos = k.toLowerCase() === KSEQ[pos].toLowerCase() ? pos + 1 : (k === KSEQ[0] ? 1 : 0);
      prog.textContent = pos ? '●'.repeat(pos) + '○'.repeat(KSEQ.length - pos) : ' ';
      play('click');
      if (pos === KSEQ.length) { pos = 0; el.querySelector('.ff-kres').hidden = false; el.classList.add('won'); got('konamicode'); play('solve'); }
    };
    el.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => press(b.dataset.k)));
    const onKey = ev => { if (!el.isConnected) { document.removeEventListener('keydown', onKey); return; } if (el.closest('.sec.on') && !/INPUT|TEXTAREA/.test((ev.target || {}).tagName || '')) press(ev.key); };
    document.addEventListener('keydown', onKey);
  }, 'The code', 'Up, up, down, down... the code has a name, and a page');
  S('konamicode', '+30 lives', 'Enter the famous code on the page that is all about it');

  // ---- netscape
  page('netscape', "You're using the WRONG BROWSER!", 'ff-ns', () => `
    <h1 class="ff-c blink">YOU'RE USING THE WRONG BROWSER!</h1>
    <p class="ff-c ff-big">This page is best viewed with <b>The Other Browser 4.7</b><br>at 800x600, in 256 colours, with a cup of tea.</p>
    <div class="ff-box"><p>We have detected that you are using: <b>JackNet Explorer 5</b>.</p><p>Some features of this page may not work, such as:</p><ul><li>Nothing. Everything works. It's a webpage with some writing on it.</li></ul></div>
    <div class="ff-box"><h3>THE BROWSER WARS: LIVE SCORES</h3><table class="ff-tbl"><tr><td>JackNet Explorer</td><td><span class="ff-bar" style="width:70%"></span></td></tr><tr><td>The Other Browser</td><td><span class="ff-bar b" style="width:28%"></span></td></tr><tr><td>A text-only one</td><td><span class="ff-bar c" style="width:2%"></span></td></tr></table><p class="ff-small">Scores made up by Jack.</p></div>
    <div class="ff-c"><button class="btn big ff-dl" type="button">Download The Other Browser (14.2 MB)</button><div class="ff-dlbox" hidden><div class="prog"><span style="display:flex;gap:2px" class="ff-dlbar"></span></div><p class="ff-dltxt"></p></div></div>
    <div class="ff-badges ff-c"><span>Best viewed with<br><b>ANY BROWSER</b></span><span>Made with<br><b>NOTEPAD</b></span><span>800 x 600<br><b>256 COLOURS</b></span><span>Y2K<br><b>READY?</b></span></div>
    ${counter('netscape', 470)}${ringFoot('netscape')}`, el => {
    const btn = el.querySelector('.ff-dl');
    btn.addEventListener('click', () => {
      btn.disabled = true; const box = el.querySelector('.ff-dlbox'), bar = el.querySelector('.ff-dlbar'), tx = el.querySelector('.ff-dltxt'); box.hidden = false;
      let n = 0; play('modem');
      const iv = setInterval(() => {
        if (!el.isConnected) { clearInterval(iv); return; }
        n++; if (n % 3 === 0 && bar.children.length < 9) bar.appendChild(document.createElement('i'));
        tx.textContent = `Downloading theotherbrowser.exe: ${(n * 0.04).toFixed(2)} MB of 14.2 MB. Time left: ${3 + Math.floor(n / 9)} hours ${12 + n} minutes`;
        if (n >= 30) { clearInterval(iv); tx.textContent = 'Download failed: connection lost. (Mom picked up the phone to ring Auntie Pat.)'; btn.disabled = false; play('uhoh'); }
      }, 200);
    });
  }, 'Browser wars', 'Somebody always says you are using the wrong browser. Type the name of the other one');

  // ---- bsod
  page('bsod', 'The Hall of Famous Crashes', 'ff-bsodp', () => `
    <div class="ff-c"><span class="ff-hd">JackOS</span></div>
    <h1 class="ff-c">THE HALL OF FAMOUS CRASHES</h1>
    <p>A fatal exception has occurred at this webpage. Just kidding. This is a museum of the greatest crashes of all time (on this computer).</p>
    <dl><dt>Fatal Exception 0E (the classic)</dt><dd>Happens when you've nearly finished something. Every time. It knows.</dd>
    <dt>The Great Floppy Disaster of '98</dt><dd>Dave's school project. Three weeks of work. One floppy disk. One fridge magnet. RIP.</dd>
    <dt>The Day Gubbinz Ate the RAM</dt><dd>Computer said "Not enough memory". Gubbinz said "burp". 16MB, gone.</dd>
    <dt>General Protection Fault</dt><dd>He was a general. He was not protecting anything. It was his fault.</dd>
    <dt>Illegal Operation</dt><dd>"This program has performed an illegal operation and will be shut down." I didn't do ANYTHING. I'm not a criminal.</dd>
    <dt>The Hourglass of Doom</dt><dd>Waited 45 minutes. Went for tea. Came back. Still an hourglass. Pressed the reset button. Lost my homework.</dd></dl>
    <div class="ff-c ff-crashbox"><p>WANT TO SEE ONE FOR REAL?</p><button class="btn big ff-crash" type="button">Crash my computer</button><p class="ff-small">*&nbsp;Press any key to continue _</p></div>
    ${counter('bsod', 404)}${ringFoot('bsod')}`, el => {
    el.querySelector('.ff-crash').addEventListener('click', () => Desk.msgbox('Crash my computer', 'Are you SURE you want to crash your computer? It will restart afterwards.', 'q', [['Yes, crash it!', () => { got('crashme'); setTimeout(() => Desk.bsod(), 400); }], ['No way']]));
  }, 'Crash museum', 'The blue screen has its own fan page. Type its four letters');
  S('crashme', 'Crash test dummy', 'Accept an offer you really should refuse');

  // ---- credits (a crawl through space)
  const CREDITS = [
    ['', 'Earlier this year, in a box room at the top of the stairs...'],
    ['h', 'JACK ATTACK! ONLINE'],
    ['', 'It is the last year of the century. All over the country, kids are locked in a long struggle against slow modems, homework and bedtimes.'],
    ['', 'In one small bedroom, one kid has built a whole website, a whole computer, a little green helper and a LOT of robots, armed with nothing but Notepad, 32MB of RAM and a family-size bag of crisps.'],
    ['', 'Now, with the Millennium Bug creeping ever closer, he must finish issue 8 before his Mom needs the phone back...'],
    ['s', 'THE CREDITS'],
    ['c', 'Written, drawn and coded by|JACK'], ['c', 'Helping (not helping)|GUBBINZ'], ['c', 'Beta testing (broke it twice)|DAVE'], ['c', 'Catering (fish fingers)|MOM'], ['c', 'Blobbits|THE BLOBBITS'],
    ['c', 'Modem|56K (49,333 bps on a good day)'], ['c', 'Hard drive|6.4 GB (after deleting homework)'], ['c', 'Special effects|A BOX OF CRAYONS'],
    ['c', 'No Blobbits were harmed|ONE WAS A BIT DIZZY'], ['c', 'Special thanks|YOU, FOR READING THIS'],
    ['s', 'THE END'], ['', '(or is it?)'],
  ];
  page('credits', 'The Credits', 'ff-cred', () => `<div class="ff-stars"></div><div class="ff-crawlwrap"><div class="ff-crawl">${CREDITS.map(([k, t]) => k === 'c' ? `<p class="cr"><small>${esc(t.split('|')[0])}</small><b>${esc(t.split('|')[1])}</b></p>` : `<p class="${k}">${esc(t)}</p>`).join('')}</div></div><div class="ff-credbtns"><button class="btn ff-again" type="button">Play again</button>${plink('webring', 'Back to the WebRing')}</div>`, el => {
    el.querySelector('.ff-again').addEventListener('click', () => { const c = el.querySelector('.ff-crawl'); c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; });
  }, 'Roll the credits', 'Every good thing ends with a list of who made it');

  // ---- secret ("there is no secret page")
  page('secret', 'There is no secret page', 'ff-nosec', () => `
    <h1 class="ff-c">THERE IS NO SECRET PAGE.</h1><p class="ff-c">Go away. There's nothing here. Nothing to see. Move along.</p>
    <p class="ff-white">OK fine, there's something. Psst: try typing <b>oldsite</b> in the address bar.</p>
    <div class="ff-gap"></div><p class="ff-c ff-grey">Still nothing.</p>
    <div class="ff-gap"></div><p class="ff-c ff-grey">Seriously. Stop scrolling.</p>
    <div class="ff-gap"></div><p class="ff-c ff-grey">You're very determined, aren't you?</p>
    <div class="ff-gap"></div><p class="ff-c ff-grey">Fine. There's a tiny dot on this page. That's all I'm saying.</p>
    <div class="ff-gap"></div><p class="ff-c"><a href="#" class="ff-dot" aria-label="a dot">.</a></p><p class="ff-c ff-dotmsg" hidden><b>You found the secret on the page with no secrets!</b><br>Here is a cookie: (::) <br>Now try ${plink('admin', 'a page you\'re not allowed on')}.</p>`, el => {
    el.querySelector('.ff-dot').addEventListener('click', ev => { ev.preventDefault(); el.querySelector('.ff-dotmsg').hidden = false; got('nosecret'); play('solve'); });
  }, 'No secret here', 'Type the most obvious word there is');
  S('nosecret', 'The dot', 'The page with no secret has a secret. Look closely, and keep scrolling');

  // ---- oldsite (January 1999)
  page('oldsite', "Jack's Home Page", 'ff-old', () => `
    <center><h1>Welcome to Jacks Home Page</h1></center><hr>
    <p>Hello and welcome to my home page on the World Wide Web. This is my first web page. I made it in Notepad.</p>
    <p>My name is Jack and I like:</p><ul><li>computer games</li><li>sci-fi films</li><li>my Rubiks cube</li><li>painting Warhammer</li></ul>
    <p><span class="ff-broken">[x] gubbinz.gif</span></p>
    <p>This page is <b>under construction</b>. More stuff coming soon!</p>
    <p>Links:</p><ul><li>${xlink('http://www.search99.find', 'A search engine')}</li><li>${plink('dave', 'my friend Dave (he has a page too now)')}</li></ul>
    <hr><p>You are visitor number: <b>${hits('oldsite') + 2}</b></p>
    <p><small>Last updated: 04/01/99 &middot; Best viewed in 640x480 &middot; email me: (no, my Mom said not to)</small></p>
    <p><a href="#" data-go="home">Click here for the NEW site!!!</a></p>`, null, 'Archaeologist', 'Sites change. The old one is still there if you ask for the old site');


  // ================================================================ desktop effects layer (snow, confetti, fireworks, bats, UFOs...)
  // One canvas over the desktop (under program windows, never catches clicks). Its loop only runs while an effect is alive.
  const FX = { cv: null, g: null, list: [], raf: 0, last: 0, W: 0, H: 0 };
  function fxSize() { if (!FX.cv) return; FX.W = FX.cv.width = innerWidth; FX.H = FX.cv.height = Math.max(100, tbTop()); }
  addEventListener('resize', fxSize);
  function fx(effect, top) {
    if (!FX.cv) { FX.cv = h('canvas', 'ff-fx'); FX.cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(FX.cv); FX.g = FX.cv.getContext('2d'); fxSize(); }
    if (top) FX.cv.classList.add('top');
    FX.list.push(effect);
    if (!FX.raf) { FX.last = 0; FX.raf = requestAnimationFrame(fxTick); }
    return effect;
  }
  function fxTick(t) {
    const dt = Math.min(0.05, FX.last ? (t - FX.last) / 1000 : 0.016); FX.last = t;
    const g = FX.g; g.clearRect(0, 0, FX.W, FX.H);
    FX.list = FX.list.filter(e => { if (e.dead) return false; try { return e.step(g, dt, FX.W, FX.H, t / 1000) !== false; } catch (er) { return false; } });
    if (FX.list.length) FX.raf = requestAnimationFrame(fxTick);
    else { FX.raf = 0; FX.cv.remove(); FX.cv = null; }
  }
  function snowFx(dur) {
    const flakes = [], pile = new Float32Array(Math.ceil(innerWidth / 4) + 2), n = phone() ? 45 : 110;
    let life = 0;
    for (let i = 0; i < n; i++) flakes.push({ x: rnd(0, innerWidth), y: rnd(-innerHeight, innerHeight), r: rnd(1, 3.2), s: rnd(25, 60), w: rnd(0, 6) });
    return fx({ kind: 'snow', step(g, dt, W, H, t) {
      life += dt; const ending = dur && life > dur;
      g.fillStyle = '#fff';
      let alive = 0;
      for (const f of flakes) {
        if (f.y > H + 5) { if (ending) continue; f.y = -5; f.x = rnd(0, W); }
        alive++;
        f.y += f.s * dt; f.x += Math.sin(t * 1.3 + f.w) * 14 * dt;
        const col = Math.max(0, Math.min(pile.length - 1, Math.floor(f.x / 4)));
        if (f.y >= H - pile[col] && !ending) { pile[col] = Math.min(12, pile[col] + f.r * 0.25); f.y = -5; f.x = rnd(0, W); }
        g.globalAlpha = 0.85; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
      if (ending) for (let i = 0; i < pile.length; i++) pile[i] = Math.max(0, pile[i] - dt * 3);
      g.beginPath(); g.moveTo(0, H);
      for (let i = 0; i < pile.length; i++) g.lineTo(i * 4, H - pile[i]);
      g.lineTo(W, H); g.closePath(); g.fillStyle = '#f4f8ff'; g.fill();
      return !(ending && !alive && pile.every(p => p <= 0.1));
    } });
  }
  function confettiFx(dur) {
    const bits = [], C = ['#e10600', '#0028c8', '#ffd400', '#0a0', '#f0f', '#00e5ff', '#ff8c00'];
    let life = 0;
    return fx({ step(g, dt, W, H) {
      life += dt;
      if (life < dur) for (let i = 0; i < 4; i++) bits.push({ x: rnd(0, W), y: -10, vx: rnd(-40, 40), vy: rnd(60, 160), a: rnd(0, 6), va: rnd(-8, 8), c: pick(C), s: rnd(4, 8) });
      for (const b of bits) { b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt; g.save(); g.translate(b.x, b.y); g.rotate(b.a); g.fillStyle = b.c; g.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); g.restore(); }
      for (let i = bits.length - 1; i >= 0; i--) if (bits[i].y > H + 10) bits.splice(i, 1);
      return life < dur || bits.length > 0;
    } }, true);
  }
  function fireworkFx(x) {
    const C = pick(['#ff3030', '#ffd400', '#30ff60', '#40a0ff', '#ff40ff', '#ffffff', '#ff9020']);
    const r = { x: x == null ? rnd(innerWidth * 0.15, innerWidth * 0.85) : x, y: tbTop(), vy: -rnd(380, 520), top: rnd(tbTop() * 0.15, tbTop() * 0.45) };
    const sparks = []; let boom = false;
    play('zap');
    return fx({ step(g, dt) {
      if (!boom) {
        r.y += r.vy * dt; g.fillStyle = '#ffe080'; g.fillRect(r.x - 1, r.y, 2, 6); g.fillStyle = 'rgba(255,200,120,.4)'; g.fillRect(r.x - 1, r.y + 6, 2, 12);
        if (r.y <= r.top) { boom = true; play('thud'); const n = ri(40, 70); for (let i = 0; i < n; i++) { const a = Math.PI * 2 * i / n, sp = rnd(80, 190); sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: rnd(1, 1.8) }); } }
        return true;
      }
      for (const s of sparks) { s.vy += 90 * dt; s.vx *= 0.985; s.x += s.vx * dt; s.y += s.vy * dt; s.l -= dt; if (s.l > 0) { g.globalAlpha = Math.min(1, s.l); g.fillStyle = C; g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3); } }
      g.globalAlpha = 1;
      return sparks.some(s => s.l > 0);
    } });
  }
  function batsFx(n) {
    const bats = Array.from({ length: n || 3 }, (_, i) => ({ x: -40 - i * rnd(40, 90), y: rnd(60, tbTop() * 0.6), sp: rnd(110, 170), ph: rnd(0, 6), wob: rnd(1, 2.5) }));
    return fx({ step(g, dt, W, H, t) {
      let alive = false;
      for (const b of bats) {
        b.x += b.sp * dt; const y = b.y + Math.sin(t * b.wob * 2 + b.ph) * 25; if (b.x < W + 40) alive = true;
        const fl = Math.sin(t * 16 + b.ph);
        g.fillStyle = '#1a1020';
        g.beginPath(); g.moveTo(b.x, y); g.quadraticCurveTo(b.x - 10, y - 12 * fl - 4, b.x - 20, y - 6 * fl); g.quadraticCurveTo(b.x - 14, y + 2, b.x - 10, y + 2); g.quadraticCurveTo(b.x - 6, y, b.x, y + 4);
        g.quadraticCurveTo(b.x + 6, y, b.x + 10, y + 2); g.quadraticCurveTo(b.x + 14, y + 2, b.x + 20, y - 6 * fl); g.quadraticCurveTo(b.x + 10, y - 12 * fl - 4, b.x, y); g.fill();
        g.beginPath(); g.arc(b.x, y + 1, 4, 0, 7); g.fill(); g.fillStyle = '#ff3030'; g.fillRect(b.x - 2, y, 1.5, 1.5); g.fillRect(b.x + 1, y, 1.5, 1.5);
      }
      return alive;
    } });
  }
  const svgImg = s => { const im = new Image(); im.src = 'data:image/svg+xml,' + encodeURIComponent(s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')); return im; };
  function ufoFx() {
    const im = svgImg(I.ufo); let x = -120, t0 = 0, beam = 0;
    return fx({ step(g, dt, W, H, t) {
      t0 += dt; const mid = W / 2 - 60;
      if (x < mid || t0 > 4.5) x += (t0 > 4.5 ? 420 : 240) * dt; else beam = Math.min(1, beam + dt * 2);
      if (t0 > 4.5) beam = Math.max(0, beam - dt * 3);
      const y = 70 + Math.sin(t * 3) * 8;
      if (beam > 0) { const gr = g.createLinearGradient(0, y + 30, 0, H); gr.addColorStop(0, `rgba(200,255,160,${0.55 * beam})`); gr.addColorStop(1, 'rgba(200,255,160,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x + 50, y + 34); g.lineTo(x + 70, y + 34); g.lineTo(x + 140, H); g.lineTo(x - 20, H); g.closePath(); g.fill(); }
      if (im.complete) g.drawImage(im, x, y, 120, 60);
      return x < W + 40;
    } }, true);
  }
  function discoFx(dur) {
    let life = 0; const C = ['255,40,40', '40,120,255', '40,255,80', '255,220,0', '255,40,255'];
    return fx({ step(g, dt, W, H, t) {
      life += dt; const k = Math.min(1, life, dur - life); if (k <= 0) return false;
      g.fillStyle = `rgba(0,0,20,${0.45 * k})`; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter';
      C.forEach((c, i) => { const x = W / 2 + Math.sin(t * (0.9 + i * 0.23) + i) * W * 0.4, y = H / 2 + Math.cos(t * (1.1 + i * 0.17) + i * 2) * H * 0.4, r = Math.min(W, H) * 0.2; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${0.5 * k})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); });
      g.globalCompositeOperation = 'source-over';
      // the mirror ball
      const bx = W / 2, by = 46; g.strokeStyle = '#888'; g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx, by - 22); g.stroke();
      for (let yy = -20; yy < 20; yy += 5) for (let xx = -20; xx < 20; xx += 5) if (xx * xx + yy * yy < 400) { const sh = (Math.sin(t * 6 + xx + yy * 1.3) + 1) / 2; g.fillStyle = `rgb(${150 + sh * 105},${150 + sh * 105},${170 + sh * 85})`; g.fillRect(bx + xx, by + yy, 4, 4); }
      return true;
    } }, true);
  }
  function eclipseFx(dur) {
    let life = 0;
    return fx({ step(g, dt, W, H) {
      life += dt; const k = Math.max(0, Math.min(1, life / 1.5, (dur - life) / 1.2)); if (life > dur) return false;
      g.fillStyle = `rgba(0,0,10,${0.82 * k})`; g.fillRect(0, 0, W, H);
      const sx = W * 0.72, sy = Math.min(140, H * 0.22), r = 38;
      const cor = g.createRadialGradient(sx, sy, r * 0.9, sx, sy, r * 2.6); cor.addColorStop(0, `rgba(255,250,220,${0.9 * k})`); cor.addColorStop(1, 'rgba(255,250,220,0)');
      g.fillStyle = cor; g.beginPath(); g.arc(sx, sy, r * 2.6, 0, 7); g.fill();
      const mx = sx + (1 - Math.min(1, life / 2)) * r * 2.2;
      g.fillStyle = '#05050a'; g.beginPath(); g.arc(mx, sy, r, 0, 7); g.fill();
      return true;
    } }, true);
  }
  function speedFx(dur) {
    let life = 0; const lines = Array.from({ length: 30 }, () => ({ y: rnd(0, 1), x: rnd(0, 1), l: rnd(60, 220), s: rnd(900, 1800) }));
    return fx({ step(g, dt, W, H) {
      life += dt; if (life > dur) return false;
      g.strokeStyle = 'rgba(225,6,0,.7)'; g.lineWidth = 3;
      for (const L of lines) { L.x -= L.s * dt / W; if (L.x < -0.3) { L.x = 1.1; L.y = rnd(0, 1); } g.beginPath(); g.moveTo(L.x * W, L.y * H); g.lineTo(L.x * W + L.l, L.y * H); g.stroke(); }
      return true;
    } }, true);
  }
  const bodyFlash = (cls, ms) => { document.body.classList.add(cls); setTimeout(() => document.body.classList.remove(cls), ms); };
  const htmlFlash = (cls, ms) => { const r = document.documentElement; r.classList.add(cls); setTimeout(() => r.classList.remove(cls), ms); };

  // ================================================================ 5. RUN COMMANDS (Start > Run...)
  // a black MS-DOS-style window that prints a script line by line
  function dosWin(title, script, o) {
    o = o || {};
    const b = h('div', 'ff-dos'), pre = h('pre'); b.appendChild(pre);
    const timers = [];
    const w = Apps.win(title, b, { w: o.w || 500, h: o.h || 300, icon: I.dos, onClose: () => timers.forEach(clearTimeout) });
    w.print = t => { pre.textContent += t + '\n'; b.scrollTop = 1e9; };
    let at = 0;
    (script || []).forEach(([ms, t]) => { at += ms; timers.push(setTimeout(() => { if (!w.closed) typeof t === 'function' ? t(w) : w.print(t); }, at)); });
    w.pre = pre; w.timers = timers;
    return w;
  }
  const C = (names, fn) => Apps.cmd(names, raw => setTimeout(() => fn(raw), 60)); // let the Run box close first

  // ---- winver: About JackOS 98 (click the flag 5 times...)
  function about() {
    const b = h('div', 'ff-about');
    b.innerHTML = `<div class="ff-abtop"><div class="ff-ablogo" role="button" tabindex="0" aria-label="JackOS logo">${window.JICON ? JICON.logo(64).replace('<svg ', '<svg style="width:64px;height:64px" ') : I.flag}</div><div class="ff-abtxt"><div class="ff-abname">Jack<b>OS</b><sup>98</sup></div><p>JackOS 98<br>Version 4.10.1999 (Second Edition, ish)<br>Copyright &copy; Jack 1998-1999</p><p>This product is licensed to:<br><b class="ff-abnick"></b><br>The family PC (upstairs)</p><hr><p>Physical memory available to JackOS: 65,024 KB RAM<br>System resources: 79% free<br>Bugs loose in the system: 3</p></div></div><div class="ff-abroll" hidden><div class="ff-abin"></div></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" style="min-width:72px">OK</button></div>`;
    b.querySelector('.ff-abnick').textContent = (Net.me && Net.me.nick) || 'Guest';
    const w = Apps.win('About JackOS', b, { w: 400, icon: I.pcme, noResize: true, noMax: true, noMin: true, escClose: true });
    b.querySelector('.btn').addEventListener('click', w.close);
    let n = 0;
    const logo = b.querySelector('.ff-ablogo');
    const tap = () => {
      n++; logo.classList.remove('wob'); void logo.offsetWidth; logo.classList.add('wob'); play('click');
      if (n === 5) {
        got('winver5'); play('solve');
        b.querySelector('.ff-abtxt').hidden = true; const roll = b.querySelector('.ff-abroll'); roll.hidden = false;
        roll.firstChild.innerHTML = ['<b>JackOS 98</b>', 'was brought to you by', '', '<b>Jack</b>', 'Chief Programmer, Artist,', 'Tea Boy', '', '<b>Gubbinz</b>', 'Quality Assurance (chewing)', '', '<b>Dave</b>', 'Bug Finder (mostly by causing them)', '', '<b>Mom</b>', 'Executive Producer of Tea', '', '<b>The Y2K Bug</b>', 'As itself', '', 'No pixels were harmed', 'in the making of this', 'operating system.', '', '<b>Thanks for clicking!</b>'].map(x => `<div>${x || '&nbsp;'}</div>`).join('');
      }
    };
    logo.addEventListener('click', tap); logo.addEventListener('keydown', e => { if (e.key === 'Enter') tap(); });
    return w;
  }
  Apps.register('winver', { single: true, cmd: ['winver', 'ver', 'about', 'winver.exe'], open: about });
  S('winver5', 'Hidden credits', 'Version boxes hide things. Click the logo, again and again');

  C(['xyzzy'], () => { got('xyzzy'); Desk.msgbox('xyzzy', 'Nothing happens.', 'info'); });
  C(['plugh'], () => Desk.msgbox('plugh', 'You are in a maze of twisty little folders, all alike. There is a little green fella here.', 'info'));
  S('xyzzy', 'Magic word', 'An old adventure game magic word. Nothing happens. Or does it?');
  C(['hello', 'hi', 'hey', 'hiya', 'hello?', 'hello world'], () => {
    setTimeout(() => { if (mate.el) { setMode('act', { pose: 'wave', until: 2.4 }); say(pick(['Hello yourself!', "'Ello 'ello!", 'Wotcha!']), 2400); } }, 500);
    Desk.toast('JackOS', 'Hello! Hello hello. (echo... echo...)', 3000);
  });
  C(['iddqd', 'idkfa', 'god', 'godmode'], raw => {
    got('iddqd'); bodyFlash('ff-god', 2600); play('solve');
    Desk.toast(raw.toUpperCase(), /idkfa/i.test(raw) ? 'All weapons and keys! You now own: 1 stapler, the shed key and a water pistol (empty).' : 'GOD MODE ON. You are now invincible. (Except to your Mom.)', 5000);
  });
  S('iddqd', 'Old-school cheater', 'Cheats from a famous 1993 shooter work here too. Try one where commands go');
  C(['matrix', 'wake up', 'the matrix'], () => startSaver('Digital Rain', { msg: ['Wake up, reader...', 'The JackNet has you...', 'Knock, knock.'] }));

  // ---- ping, tracert, ipconfig
  const pingLines = (host, ip, times, extra) => [[300, `\nPinging ${host} [${ip}] with 32 bytes of data:\n`], ...times.map(t => [rnd(700, 1200), typeof t === 'string' ? t : `Reply from ${ip}: bytes=32 time=${t}ms TTL=56`]), [600, `\nPing statistics for ${ip}:\n    Packets: Sent = ${times.length}, Received = ${times.filter(t => typeof t === 'number').length}, Lost = ${times.filter(t => typeof t !== 'number').length}${extra || ''}`]];
  C(['ping jacknet', 'ping jacklm.com', 'ping www.jacklm.com', 'ping jackattack.jnet', 'ping www.jackattack.jnet', 'ping jacknet.com'], () => dosWin('C:\\JACKOS\\ping.exe', pingLines('jacknet', '192.168.0.99', [1999, 2120, 'Request timed out. (Mom picked up the phone)', 1876], ' (25% loss, 100% Mom)\nApproximate round trip times in milli-seconds:\n    Minimum = 1876ms, Maximum = 2120ms, Average = 1998ms')));
  C(['ping dave', 'ping dave-pc', 'ping davesnet'], () => dosWin('C:\\JACKOS\\ping.exe', pingLines('DAVE-PC', '192.168.0.13', ['Request timed out.', 'Request timed out.', 'Request timed out.', "Request timed out. (It's switched off at the wall, mate.)"])));
  C(['ping gubbinz', 'ping grot'], () => dosWin('C:\\JACKOS\\ping.exe', pingLines('GUBBINZ', '192.168.0.66', ['Reply from 192.168.0.66: OI!', 'Reply from 192.168.0.66: STOP PINGIN ME', 'Reply from 192.168.0.66: I MEAN IT', 'Reply from 192.168.0.66: *throws a sock*'])));
  C(['ping localhost', 'ping 127.0.0.1'], () => dosWin('C:\\JACKOS\\ping.exe', pingLines('localhost', '127.0.0.1', [0, 0, 0, 0], "\n\nThat's you. You just pinged yourself. Hello, you!")));
  C(['ping'], () => dosWin('C:\\JACKOS\\ping.exe', [[100, 'Usage: ping <somewhere>\n\nTry: ping jacknet, ping dave, ping gubbinz, ping localhost']]));
  C(['tracert', 'tracert jacknet', 'traceroute', 'tracert jacklm.com'], () => dosWin('C:\\JACKOS\\tracert.exe', [[200, '\nTracing route to jacknet [192.168.0.99]\nover a maximum of 30 hops:\n'], [900, '  1   120 ms   118 ms   121 ms  jacks-modem.bedroom [192.168.0.2]'], [900, '  2   310 ms   305 ms   299 ms  phone-socket.hall [192.168.0.3]'], [1000, '  3   640 ms   601 ms   655 ms  telephone-exchange.down-the-road [10.0.0.1]'], [1100, '  4   890 ms   902 ms   877 ms  a-very-long-cable.under-the-sea [10.0.0.7]'], [1300, '  5     *        *        *     Request timed out. (Mom picked up the phone)'], [1100, '  6  1404 ms  1388 ms  1420 ms  pigeon-relay.rooftop [10.0.0.99]'], [900, '  7  1999 ms  1999 ms  1999 ms  jacknet.server.cupboard [192.168.0.99]'], [500, '\nTrace complete. (It went round the world and back to the cupboard.)']], { h: 320 }));
  function winipcfg() {
    const b = h('div', 'ff-ipc');
    let ip = '192.168.0.' + ri(20, 99);
    b.innerHTML = `<fieldset class="group"><legend class="lg">Ethernet Adapter Information</legend><select aria-label="Adapter"><option>JackNet 56K Modem (allegedly)</option><option>PPP Adapter</option><option>Two tin cans and a string</option></select>
      <table><tr><td>Adapter Address</td><td><span class="field ff-ipv">44-52-55-47-47-53</span></td></tr><tr><td>IP Address</td><td><span class="field ff-ipv ff-ip"></span></td></tr><tr><td>Subnet Mask</td><td><span class="field ff-ipv">255.255.255.0</span></td></tr><tr><td>Default Gateway</td><td><span class="field ff-ipv">192.168.0.1</span></td></tr></table></fieldset>
      <div class="ff-ipbtns"><button class="btn" data-a="ok" type="button">OK</button><button class="btn" data-a="rel" type="button">Release</button><button class="btn" data-a="ren" type="button">Renew</button><button class="btn" data-a="rela" type="button">Release All</button><button class="btn" data-a="rena" type="button">Renew All</button><button class="btn" data-a="more" type="button">More Info &gt;&gt;</button></div>`;
    const w = Apps.win('IP Configuration', b, { w: 380, icon: I.net, noResize: true, noMax: true, escClose: true });
    const ipEl = b.querySelector('.ff-ip'), show = () => { ipEl.textContent = ip; }; show();
    b.addEventListener('click', ev => {
      const a = (ev.target.closest('[data-a]') || {}).dataset; if (!a) return;
      if (a.a === 'ok') w.close();
      if (a.a === 'rel' || a.a === 'rela') { ip = '0.0.0.0'; show(); Desk.toast('IP Configuration', 'IP address released. It flew out of the window. Bye bye, IP address!', 3500); }
      if (a.a === 'ren' || a.a === 'rena') { ipEl.textContent = 'Renewing...'; setTimeout(() => { ip = '192.168.0.' + ri(2, 254); show(); play('pet'); }, 900); }
      if (a.a === 'more') Desk.msgbox('IP Configuration', `Host Name: ${(Net.me.nick || 'GUEST').toUpperCase()}\nDNS Servers: Mom (she knows everybody's number)\nNode Type: Broadcast (LOUDLY)\nLease Obtained: 01/01/99\nLease Expires: 31/12/99 23:59 (uh oh)`, 'info');
    });
    return w;
  }
  Apps.register('winipcfg', { single: true, cmd: ['ipconfig', 'winipcfg', 'ipconfig /all', 'winipcfg.exe'], open: winipcfg });

  // ---- telnet: an original ASCII space movie
  function telnet() {
    const COLS = 58, ROWS = 15;
    const SHIP = [' __', '|  \\___ ', '<[oo]___>'];
    const MOON = ['   .-""-.  ', '  /  o   \\ ', ' |    O   |', '  \\  o   / ', "   '-..-'  "];
    const SQ = ['(@@)', '<vv>'];
    const stars = Array.from({ length: 40 }, () => ({ x: ri(0, COLS - 1), y: ri(0, ROWS - 1), s: pick([0.3, 0.6, 1]), c: pick(['.', '.', '*', '+']) }));
    let f = 0;
    const w = dosWin('Telnet - jacknet.tv', [[0, 'Connecting to jacknet.tv...']], { w: Math.min(560, innerWidth - 8), h: 330 });
    const timer = setInterval(() => {
      if (w.closed) { clearInterval(timer); return; }
      f++;
      const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(' '));
      const put = (x, y, s) => { for (let i = 0; i < s.length; i++) { const xx = Math.round(x) + i; if (xx >= 0 && xx < COLS && y >= 0 && y < ROWS && s[i] !== ' ') grid[y][xx] = s[i]; } };
      for (const s of stars) { s.x -= s.s; if (s.x < 0) { s.x = COLS - 1; s.y = ri(0, ROWS - 1); } put(s.x, s.y, s.c); }
      let caption = '';
      if (f < 90) { MOON.forEach((l, i) => put(COLS - f * 0.25 - 4, 2 + i, l)); caption = 'Episode 1: Gubbinz in Space'; }
      if (f >= 20 && f < 150) { const sx = Math.min(16, (f - 20) * 0.5), sy = 8 + Math.round(Math.sin(f / 5)); SHIP.forEach((l, i) => put(sx, sy + i, l)); put(sx - 3, sy + 2, f % 2 ? '=-~' : '~=-'); if (f > 40) caption = 'Gubbinz goes looking for the Great Cheese Moon...'; }
      if (f >= 70 && f < 150) { for (let k = 0; k < 3; k++) { const qx = COLS - ((f - 70) * 0.7 + k * 14) % (COLS + 6), qy = 2 + k * 4; SQ.forEach((l, i) => put(qx, qy + i, l)); } caption = 'Watch out! Space invaders!'; }
      if (f >= 150) { const k = Math.min(1, (f - 150) / 40); MOON.forEach((l, i) => put(26, 5 + i, l)); SHIP.forEach((l, i) => put(4 + k * 20, 2 + Math.round(k * 1) + i, l)); if (f > 175) put(31, 3, '|>JACK'); caption = f > 175 ? 'He made it! The moon IS made of cheese. Lunch!' : 'Landing...'; }
      if (f >= 230) { clearInterval(timer); got('telnet'); w.pre.textContent = grid.map(r => r.join('')).join('\n') + '\n\n                    THE END\n     Thank you for watching JackNet TV. Goodnight!'; return; }
      w.pre.textContent = grid.map(r => r.join('')).join('\n') + '\n\n  ' + caption;
    }, 110);
  }
  C(['telnet', 'telnet jacknet.tv', 'telnet towel', 'tv', 'telnet jacknet'], telnet);
  S('telnet', 'Space movie', 'Old computers could watch films made of letters. Connect to one and watch to the end');

  // ---- format c: (don't panic)
  function format() {
    Desk.msgbox('Format - C:\\', 'WARNING: ALL DATA ON NON-REMOVABLE DISK DRIVE C: WILL BE LOST!\n\nThat includes homework, high scores, party.txt and Gubbinz.\n\nProceed with Format?', 'warn', [['Yes', () => {
      const b = h('div', 'ff-fmt'); b.innerHTML = `<p class="ff-fmtt">Formatting C:\\...</p><div class="prog"><span style="display:flex;gap:2px"></span></div><p class="ff-fmtf small" style="height:16px;overflow:hidden"></p>`;
      const w = Apps.win('Format - C:\\', b, { w: 360, icon: I.dos, noResize: true, noMax: true, noMin: true });
      const bar = b.querySelector('.prog span'), fl = b.querySelector('.ff-fmtf'), FILES2 = ['homework.doc', 'party.txt', 'high scores.txt', 'C:\\JACKOS\\*.*', 'my Pokemon card list', 'Gubbinz.exe', 'the Internet', 'the Recycle Bin (recycling it)', 'COMMAND.COM'];
      let i = 0; play('dice');
      const iv = setInterval(() => {
        if (w.closed) { clearInterval(iv); return; }
        i++; if (bar.children.length < 26) bar.appendChild(document.createElement('i'));
        fl.textContent = 'Deleting ' + FILES2[i % FILES2.length] + '...';
        if (i >= 28) {
          clearInterval(iv); w.close(); got('format'); play('solve');
          Desk.msgbox('Format Results', 'JUST KIDDING!!!\n\nFormat complete: 0 bytes deleted.\n\nMom put a padlock on the hard drive in 1998, after The Incident. Everything is fine. Gubbinz says hi.', 'info');
        }
      }, 140);
    }], ['No']]);
  }
  C(['format', 'format c:', 'format c', 'format c:\\', 'format c: /q', 'format a:'], raw => /a:/i.test(raw) ? Desk.msgbox('Format - A:\\', 'There is no disk in drive A:. Dave borrowed it. He never gives them back.', 'warn') : format());
  S('format', 'Formatted (not really)', 'The scariest command there is. Wipe the C: drive. Go on');
  C(['deltree', 'deltree c:\\JACKOS', 'deltree /y c:\\', 'deltree c:', 'deltree c:\\', 'deltree windows', 'rm -rf /', 'rm -rf'], raw => {
    if (/^rm/i.test(raw)) return Desk.msgbox('JackOS', "This isn't that kind of computer. Try 'deltree'. (Actually, don't.)", 'warn');
    Desk.msgbox('Deltree', 'Delete directory "C:\\JACKOS" and all its subdirectories? [yn]', 'q', [['Yes', () => {
      const icons = [...document.querySelectorAll('.icons .dicon')];
      icons.forEach((ic, i) => { ic.style.transition = `transform .9s cubic-bezier(.5,0,1,.5) ${i * 0.06}s, opacity .9s ${i * 0.06}s`; ic.style.transform = `translate(${ri(-40, 40)}px, ${innerHeight}px) rotate(${ri(-200, 200)}deg)`; ic.style.opacity = '0'; });
      play('thud');
      setTimeout(() => {
        icons.forEach(ic => { ic.style.transition = 'transform .6s ease-out, opacity .6s'; ic.style.transform = ''; ic.style.opacity = ''; });
        setTimeout(() => icons.forEach(ic => { ic.style.transition = ''; }), 700);
        got('deltree'); Desk.msgbox('Deltree', 'Deltree cancelled by Gubbinz.\n\nHe was asleep in C:\\JACKOS and he wasn\'t moving for anyone. Everything has been put back.', 'warn');
      }, 2600);
    }], ['No']]);
  });
  S('deltree', 'Tree surgeon', 'There is an old command for deleting a whole tree of folders. Gubbinz will not allow it');

  // ---- party, disco, red, flip, mirror, spin, shake, eclipse, snow...
  C(['party', 'party time', 'partytime', 'party!'], () => {
    got('party'); confettiFx(8); discoFx(8); bodyFlash('ff-party', 8000);
    if (Sound.on) { Sound.music.play('grotdance'); setTimeout(() => { if (Sound.music.playing === 'grotdance' && !pageMusic) Sound.music.stop(); }, 8000); }
    Desk.toast('PARTY!!!', "It's party time on JackOS! (Mom says turn it down.)", 5000);
    if (mate.el) { setMode('happy'); say('PARTY!!! Woo-hoo!', 2000); }
  });
  S('party', 'Party animal', "party.txt is a list of things to take to Dave's. Ask the computer for one instead");
  C(['disco', 'boogie', 'dance'], () => { discoFx(9); Desk.toast('Disco', 'Mirror ball: ON. Dance moves: questionable.', 3000); });
  C(['red', 'red ones go faster', 'red ones go fasta', 'redonesgofaster'], () => { got('red'); speedFx(2.6); bodyFlash('ff-speed', 2600); play('zap'); Desk.toast('RED ONES GO FASTER!', 'Everything is going 10% faster. (It is not.)', 3000); });
  S('red', 'Red ones go faster', "Every kid with a toy car knows which colour is fastest. Tell the computer");
  C(['flip', 'upside down', 'australia'], () => { got('flip'); htmlFlash('ff-flip', 5000); });
  S('flip', 'Topsy turvy', 'Ask the computer to turn everything over');
  C(['mirror'], () => htmlFlash('ff-mirror', 5000));
  C(['spin', 'barrel roll', 'do a barrel roll'], () => htmlFlash('ff-spin', 2100));
  C(['shake', 'earthquake'], () => { bodyFlash('shake', 2000); play('thud'); });
  C(['eclipse', 'solar eclipse'], () => { got('eclipse'); eclipseFx(5); Desk.toast('Total eclipse!', 'On 11/08/99 the Moon covered the Sun over Cornwall. It was cloudy. This one is better.', 6000); });
  S('eclipse', 'Totality', 'This summer the Moon covered the Sun. Make it happen again');
  let snowing = null;
  C(['snow', 'let it snow', 'winter'], () => { if (snowing && !snowing.dead) { snowing.dead = true; snowing = null; Desk.toast('Snow', 'Snow stopped. The council gritted the desktop.', 2500); } else { snowing = snowFx(40); Desk.toast('Snow', 'Let it snow! (type snow again to stop it)', 3000); } });
  C(['bonfire', 'fireworks', 'firework', 'bonfire night'], () => { for (let i = 0; i < 6; i++) setTimeout(() => fireworkFx(), i * 700 + rnd(0, 400)); });
  C(['bats', 'spooky', 'halloween', 'boo'], () => batsFx(5));
  C(['ufo', 'aliens', 'alien', 'x-files'], () => { ufoFx(); play('zap'); });
  C(['xmas', 'christmas', 'merry christmas'], () => tinsel(15000));
  C(['aprilfool', 'april fool', 'april fools'], () => htmlFlash('ff-flip', 3000));
  C(['gravity', 'newton'], () => {
    got('gravity');
    const icons = [...document.querySelectorAll('.icons .dicon')];
    icons.forEach((ic, i) => { const r = ic.getBoundingClientRect(); ic.style.transition = `transform 1.1s cubic-bezier(.6,0,.4,1.4) ${i * 0.05}s`; ic.style.transform = `translateY(${Math.max(0, tbTop() - r.bottom - 4)}px)`; });
    play('thud');
    setTimeout(() => { icons.forEach(ic => { ic.style.transition = 'transform .8s ease-in-out'; ic.style.transform = ''; }); setTimeout(() => icons.forEach(ic => { ic.style.transition = ''; }), 900); }, 6000);
  });
  S('gravity', 'Apple falls on head', "Switch on the great scientist's favourite force");
  C(['waaagh', 'waaagh!', 'waagh', 'waaaagh'], () => {
    const f = $('waaaghFlash'), by = $('waaaghFlashBy');
    if (by) by.textContent = 'a WAAAGH! just for you (from Start > Run)';
    if (f) f.style.display = 'flex'; document.body.classList.add('shake'); play('waaagh');
    setTimeout(() => { if (f) f.style.display = 'none'; document.body.classList.remove('shake'); }, 1800);
    if (mate.el) { setMode('happy'); say('WAAAGH!!!', 1800); }
  });

  // ---- little jokes
  let sudoN = 0;
  C(['sudo', 'su', 'sudo su', 'sudo -s', 'root'], () => {
    sudoN++;
    if (sudoN === 1) Desk.msgbox('sudo', 'Bad command or file name', 'warn');
    else if (sudoN === 2) Desk.msgbox('sudo', "Still a bad command. This isn't a big university computer, it's a family PC.", 'warn');
    else { got('sudo'); Desk.msgbox('sudo', 'FINE. You are now the super user of this computer.\n\nYour powers: you may choose what\'s for tea. (Mom has vetoed this.)', 'info'); }
  });
  S('sudo', 'Super user (sort of)', 'Ask for super powers. Keep asking');
  C(['beep', 'bell', 'ding'], () => { play('beep'); Desk.msgbox('Beep', Sound.on ? 'BEEP.' : "*beep*\n\n(Your sound is switched off, so I said it instead.)", 'info'); });
  C(['lorem', 'lorem ipsum'], () => Apps.openFile({ name: 'lorem.txt', type: 'txt', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n(This is pretend Latin that people use to fill up pages before the real words are written. Jack uses it for his homework sometimes. It has never worked.)\n' }));
  const FORTUNES = ['You will find your missing Pokemon card where you least expect it.', 'A long bar is coming. Leave a gap.', 'Your high score will be beaten. By Dave. Sorry.', 'Do not trust the toaster on 01/01/00.', 'Someone on JackNet is thinking about you. It is probably Gubbinz.', 'Today is a good day to clear 4 lines at once.', 'The Millennium Bug fears YOU.', 'You will soon tidy your room. (Your Mom wrote this one.)', 'Red ones go faster. Always.', 'Help! I am trapped in a fortune cookie factory!'];
  C(['cookie', 'cookies', 'fortune', 'fortune cookie'], () => Desk.msgbox('Fortune Cookie', 'You crack open the cookie. It says:\n\n"' + pick(FORTUNES) + '"\n\nLucky numbers: ' + Array.from({ length: 6 }, () => ri(1, 49)).sort((a, b) => a - b).join(', '), 'info'));
  let momN = 0, momT = 0;
  function mom() {
    clearTimeout(momT);
    const LINES = ["JACK! Tea's ready! Get off that computer!", "JACK! It's going COLD! I'm not telling you again!", "RIGHT. That's it. I'm unplugging the modem."];
    const i = Math.min(momN, 2);
    if (i === 2) {
      momN = 0; got('mom');
      Desk.msgbox('Mom', LINES[2], 'warn', [['Noooo!']]);
      setTimeout(() => { bodyFlash('ff-dim', 3500); Desk.toast('Connection lost', 'Disconnected from JackNet. Someone unplugged the modem.', 3500); play('crt'); }, 1200);
      setTimeout(() => Desk.toast('Connected', "Mom plugged it back in. She needed to ring Auntie Pat anyway.", 5000), 5200);
      return;
    }
    Desk.msgbox('Mom', LINES[i], 'warn', [['Coming!', () => { momN = 0; Desk.toast('Mom', 'Good. Wash your hands.', 3000); }], ['5 more minutes', () => { momN++; momT = setTimeout(mom, 20000); }]]);
  }
  C(['mom', 'mum', 'mother', 'tea'], raw => /tea/i.test(raw) && momN === 0 && Math.random() < 0.5 ? Desk.msgbox('Tea', "JackOS 98 does not support kettles. Mom says she'll make it. (She says 'make it yourself'.)", 'info') : mom());
  S('mom', 'Five more minutes', "Ask for Mom, then keep ignoring her until she does something about it");
  C(['coffee', 'brew', 'make coffee'], () => Desk.msgbox('Error 418', "Error 418: I'm a teapot.\n\nThis computer cannot make coffee. (That's a real error code! Somebody made it up for April Fools' Day 1998.)", 'warn'));
  C(['davespage', 'dave page', "dave's page"], () => { Desk.msgbox('Dave', "Dave is not available. He's grounded. (He'll be back on at 7. Here's his homepage instead.)", 'info'); setTimeout(() => nav('dave'), 300); });
  C(['jack', 'whois jack', 'finger jack'], () => Apps.openFile({ name: 'about jack.txt', type: 'txt', text: "ABOUT JACK\n==========\n\nLikes: video games, sci-fi, Star Wars, Pokemon, Rubik's cubes, Tetris, painting Warhammer models.\nDislikes: homework, the phone bill, people who say 'it's just a game'.\nBest mate: Dave (don't tell him).\nPet: Gubbinz (little, green, virtual, always hungry).\nSuperpower: can solve a Rubik's cube in under 2 minutes. On a good day.\nWeakness: the Long Bar never comes.\n\nMade this whole website. And this computer. Yes, really.\n" }));
  C(['rubik', 'rubiks', "rubik's", 'cube', 'scramble'], () => Desk.msgbox('Cube Scramble', 'Hold white on top, green at the front, and do this:\n\n' + scramble() + '\n\nThen try to solve it! (Stuck? Type "cubeclub" in the address bar.)', 'info', [['Play the MegaCube', () => { showBrowser(); IE.go('demos', 'click'); }], ['OK']]));
  C(['tetris', 'jacktris'], () => { showBrowser(); IE.go('demos', 'click'); Desk.toast('JACKTRIS', 'JACKTRIS is in the Games Arcade! The Long Bar is waiting. (Probably not.)', 4000); });
  C(['help', '?', 'commands', 'man'], () => Apps.openFile({ name: 'RUN HELP.txt', type: 'txt', text: "JACKOS 98: THINGS YOU CAN TYPE IN RUN\n=====================================\n\nwinver      About this computer\nping        Ping something (try: ping jacknet)\ntracert     Where does the internet go?\nipconfig    Your IP address (it's very secret)\ntelnet      Watch JackNet TV\nnethood     Network Neighborhood\nsnow        Let it snow\nparty       Do I need to explain?\nssstars     Screen savers: ssstars, sspipes, ssmyst, flyingsaucers...\ncookie      A fortune cookie\nhelp        This file\n\n...and LOADS more that aren't on this list.\nSome are cheats. Some are magic words. Some are Mom.\n\nTip: the address bar in JackNet Explorer has secrets too.\nTry: webring\n" }));
  C(['credits', 'thanks'], () => nav('credits'));
  C(['hamster', 'hamsterdance', 'squigdance'], () => nav('hamsterdance'));
  C(['y2k', 'millennium', 'millennium bug', 'y2kbunker'], () => nav('y2kbunker'));
  C(['area51', 'area 51'], () => nav('area51'));
  C(['webring', 'nerd kids'], () => nav('webring'));
  C(['open sesame', 'eject', 'eject d:', 'cdrom', 'cup holder'], () => {
    got('cdtray');
    const t = h('div', 'ff-tray'); t.innerHTML = '<div class="ff-trayin"><span class="ff-cd"></span><span class="ff-cup"></span></div>';
    document.body.appendChild(t); play('turn');
    setTimeout(() => { t.classList.add('out'); }, 30);
    Desk.toast('CD-ROM Drive (D:)', 'Tray opened. Please do not use it as a cup holder. (Somebody already did.)', 4500);
    setTimeout(() => { t.classList.remove('out'); play('turn'); setTimeout(() => t.remove(), 700); }, 4200);
  });
  S('cdtray', 'Cup holder', 'Say the magic words to open the cave. Or the CD drive');
  C(['time', 'clock'], () => Desk.msgbox('Time', `The time is ${hhmm()}.\n\nThe date is ${d99()}. It is always 1999. You get used to it.`, 'info'));
  C(['date', 'today', 'calendar'], () => Desk.msgbox('Date', `Today is ${d99()}.\n\nNext year: also 1999. Year after that: guess.`, 'info'));
  C(['whoami', 'who am i', 'me'], () => Desk.msgbox('whoami', `You are ${(Net.me && Net.me.nick) || 'a mysterious stranger'}.${Net.me && Net.me.member ? ' A proper JackNet member!' : ''}\n\nAlso: a person who types whoami into a family PC.`, 'info'));
  C(['exit', 'quit', 'logout', 'bye', 'escape'], () => Desk.msgbox('JackOS', "There is no escape. It's 1999. Forever.\n\n(Try Start > Shut Down if you really, really mean it.)", 'info'));
  C(['hack', 'hacker', 'hack the planet', 'hack jacknet', 'hacking'], () => {
    const w = dosWin('H4XX0R.EXE', [[200, 'H4XX0R.EXE v0.1 by an anonymous kid (it was Dave)\n'], [700, '> Hacking into the JackNet mainframe...'], [900, '> Downloading the Internet... 0.0001%'], [900, '> Guessing password: aaaa'], [150, '> Guessing password: aaab'], [150, '> Guessing password: aaac'], [150, '> Guessing password: (this could take a while)'], [1200, '> Bypassing the firewall... (it was a real fire. we put it out)'], [1100, '> ACCESS GRANTED: to Dave\'s calculator.'], [900, (ww) => { ww.print('\nYou are now a hacker. Please use your powers for good (homework).'); got('hack'); }]]);
    w.el.classList.add('ff-greenterm');
  });
  S('hack', 'l33t h4xx0r', 'Tell the computer you want to hack. It will let you. Sort of');
  C(['42', 'answer', 'meaning of life', 'the answer'], () => Desk.msgbox('Deep Thought', '42.\n\n(Now you just need the question.)', 'info'));
  C(['love', 'i love you', '<3'], () => Desk.msgbox('JackOS', 'JackOS loves you too. <3\n(In a strictly professional, operating-system sort of way.)', 'info'));
  C(['sing', 'music', 'play music'], () => { if (!Sound.on) return Desk.toast('Sing', "Your sound is off! Click the speaker by the clock first. (I'd be singing right now.)", 4000); Sound.music.play('theme'); setTimeout(() => { if (Sound.music.playing === 'theme' && !pageMusic) Sound.music.stop(); }, 12000); });
  C(['cls', 'clear', 'show desktop'], () => { const d = $('qlDesk'); if (d) d.click(); else Desk.toast('cls', 'Screen cleared. (Well, as cleared as it gets.)'); });
  C(['win', 'windows', 'win.com', 'startx'], () => Desk.msgbox('JackOS', "You're already in JackOS. It's working. Look! There's the Start button and everything.", 'info'));
  C(['jackattack', 'jack attack', 'jack attack!'], () => startSaver('3D Text'));

  // ================================================================ 6. TIME AND DATE EVENTS (the 1999 loop date + the real clock)
  function tinsel(ms) {
    if (document.querySelector('.ff-tinsel')) return;
    const t = h('div', 'ff-tinsel'); t.setAttribute('aria-hidden', 'true');
    t.innerHTML = Array.from({ length: 24 }, (_, i) => `<i style="left:${(i + 0.5) * 100 / 24}%;background:${['#e10600', '#ffd400', '#0028c8', '#0a0', '#f0f'][i % 5]};animation-delay:-${(i % 4) * 0.4}s"></i>`).join('');
    document.body.appendChild(t);
    if (ms) setTimeout(() => t.remove(), ms);
  }
  function stickyNote(text, id) {
    if (document.querySelector('.ff-sticky')) return;
    const n = h('div', 'ff-sticky'); n.setAttribute('role', 'note');
    n.innerHTML = `<button class="ff-stx" type="button" aria-label="Close note">x</button><p></p>`;
    n.querySelector('p').textContent = text;
    document.body.appendChild(n);
    n.style.left = Math.max(8, innerWidth - (phone() ? 175 : 240)) + 'px'; n.style.top = (phone() ? innerHeight * 0.45 : 40) + 'px';
    n.querySelector('.ff-stx').addEventListener('click', () => n.remove());
    let d = null;
    n.addEventListener('pointerdown', ev => { if (ev.target.closest('button')) return; d = { x: ev.clientX - n.offsetLeft, y: ev.clientY - n.offsetTop }; n.setPointerCapture(ev.pointerId); });
    n.addEventListener('pointermove', ev => { if (d) { n.style.left = Math.max(0, Math.min(innerWidth - 60, ev.clientX - d.x)) + 'px'; n.style.top = Math.max(0, Math.min(innerHeight - 80, ev.clientY - d.y)) + 'px'; } });
    n.addEventListener('pointerup', () => { d = null; });
    if (id) got(id);
  }
  function blackCat() {
    const c = h('div', 'ff-cat'); c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<svg viewBox="0 0 40 24" width="60" height="36"><path d="M6 12q-5-6 0-10" stroke="#111" stroke-width="2.5" fill="none" class="ff-tail"/><ellipse cx="17" cy="13" rx="11" ry="6" fill="#111"/><circle cx="30" cy="9" r="5.5" fill="#111"/><path d="M26 5l1-5 3 4zM31 4l3-4 1 5z" fill="#111"/><rect x="31" y="7.5" width="2" height="2" fill="#ffe000"/><rect x="28" y="7.5" width="2" height="2" fill="#ffe000"/><g class="ff-legs"><rect x="9" y="17" width="2.5" height="7" fill="#111"/><rect x="23" y="17" width="2.5" height="7" fill="#111"/></g><g class="ff-legs2"><rect x="13" y="17" width="2.5" height="7" fill="#111"/><rect x="26" y="17" width="2.5" height="7" fill="#111"/></g></svg>';
    document.body.appendChild(c);
    c.style.top = (tbTop() - 34) + 'px';
    setTimeout(() => c.remove(), 12500);
  }
  function dateEvents() {
    const t = today(), hr = hourNow();
    void stickyNote; // no sticky notes on the desktop (Jack's call)
    if (t.m === 12) { got('december'); if (!reduced()) setTimeout(() => { if (!snowing) snowing = snowFx(0); }, 3000); }
    if (t.md === 1225) setTimeout(() => { tinsel(0); got('christmas'); Desk.toast('Merry Christmas!', 'Happy Christmas from Jack, Gubbinz and the Blobbits! (Dave says it too, but he spelt it wrong.)', 7000); }, 4000);
    if (t.md === 1031) { got('halloween'); const go = () => { if (!document.hidden && !ssOn) batsFx(ri(2, 5)); setTimeout(go, rnd(30000, 70000)); }; setTimeout(go, 8000); }
    if (t.md === 1105) { got('bonfire'); const go = () => { if (!document.hidden && !ssOn) for (let i = 0, n = ri(1, 3); i < n; i++) setTimeout(() => fireworkFx(), i * 600); setTimeout(go, rnd(20000, 45000)); }; setTimeout(go, 6000); Desk.toast('Remember, remember...', "It's Bonfire Night! Keep your pets indoors and your Tamagotchis away from the sparklers.", 6000); }
    if (t.md === 401) setTimeout(() => once('aprilfool' + new Date().getFullYear(), () => { htmlFlash('ff-flip', 3000); setTimeout(() => { Desk.toast('APRIL FOOL!!!', 'Got you! Everything is the right way up again. Probably.', 5000); got('aprilfool'); }, 3100); }), 1500);
    if (t.md === 811) setTimeout(() => { eclipseFx(6); got('eclipse'); Desk.toast('The eclipse!', "It's 11 August 1999: a total eclipse of the Sun! (Don't look straight at it. Not even on a monitor.)", 7000); }, 10000);
    if (t.d === 13 && t.date.getDay() === 5) { got('friday13'); setTimeout(blackCat, 9000); }
  }
  if (booted()) setTimeout(dateEvents, 1500); else { const iv = setInterval(() => { if (booted()) { clearInterval(iv); setTimeout(dateEvents, 1500); } }, 1500); }
  S('bedtime', 'Past your bedtime', 'Visit the computer very late at night. Somebody will notice');
  S('december', 'Snow day', 'Come back in December');
  S('christmas', 'Christmas cracker', 'Visit on the big day in December');
  S('halloween', 'Spooky', 'Visit on the last night of October');
  S('bonfire', 'Remember, remember', 'Visit on the fifth of November');
  S('aprilfool', 'April Fool', 'Visit on the first of April (if you dare)');
  S('friday13', 'Unlucky for some', 'Visit on an unlucky Friday');

  // ================================================================ 7. DESKTOP TOYS: My Briefcase, Online Services, Jackotchi
  // ---- My Briefcase
  function briefcase() {
    const root = { name: 'My Briefcase', icon: I.brief, kids: [
      { name: 'homework FINAL final2.txt', type: 'txt', date: '01/10/99', text: "HOMEWORK (FINAL) (final2)\n\nThis is the final version.\nThe one called FINAL was not final.\nThis one is. Probably.\n\n(see also: homework FINAL final3.txt, which doesn't exist yet)\n" },
      { name: 'sandwich.txt', type: 'txt', date: '05/10/99', act: () => Desk.msgbox('sandwich.txt', "You opened the sandwich.\n\nIt's ham. It's from last Tuesday. The smell is escaping into the computer. Close it! CLOSE IT!", 'warn') },
      { name: 'things to remember.txt', type: 'txt', date: '12/09/99', text: "THINGS TO REMEMBER\n\n1. Remember the briefcase.\n2. \n3. (forgot)\n" },
      { name: 'spare floppy (blank).txt', type: 'txt', size: '0 KB', text: '' },
    ] };
    const api = folderWin('My Briefcase', I.brief, root, {
      w: 460, h: 300,
      buttons: [{ label: 'Update All', act: () => {
        const b = h('div'); b.innerHTML = '<p>Updating My Briefcase...</p><div class="prog"><span style="display:flex;gap:2px"></span></div>';
        const w = Apps.win('Update My Briefcase', b, { w: 320, icon: I.brief, noResize: true, noMax: true, noMin: true });
        let n = 0; const iv = setInterval(() => { if (w.closed) return clearInterval(iv); b.querySelector('span').appendChild(document.createElement('i')); if (++n >= 18) { clearInterval(iv); w.close(); got('briefcase'); Desk.msgbox('My Briefcase', '3 files are up to date.\n\n1 file (sandwich.txt) is more out of date than ever. It is now a science experiment.', 'info'); } }, 110);
      } }],
      about: 'My Briefcase\n\nKeeps your files in sync between your home computer and your school floppy disk. In theory.',
    });
    if (once('briefwelcome', () => {})) Desk.msgbox('Welcome to the Briefcase', "Welcome to My Briefcase!\n\n1. Copy files into the Briefcase.\n2. Take the Briefcase to school on a floppy disk.\n3. Leave the floppy on the bus.\n4. Cry.\n5. Click Update All. It won't help, but it's nice.", 'info');
    return api.w;
  }
  Apps.register('briefcase', { single: true, cmd: ['briefcase', 'my briefcase'], open: briefcase });
  S('briefcase', 'Up to date', 'Keep your briefcase in sync. Even the sandwich');

  // ---- Online Services: sign up for a pretend ISP (every sign-up ends in a joke, nothing real is asked for)
  const ISPS = [
    { id: 'squignet', name: 'NetPlanet 4.0', col: '#e8381b', tag: 'So easy, even your Nan can use it!', end: "Thank you for joining NetPlanet!\n\nYour FREE trial CD will arrive by post in 6-8 weeks.\nThen 40 more.\nThen hundreds.\n\nYou will use them as drinks coasters for the rest of your life." },
    { id: 'waaaghnet', name: 'FreeSurfa', col: '#2a7a1a', tag: 'FREE internet! (just pay the phone bill)', end: "WELCOME TO FREESURFA!\n\nYour email address is: surfer@freesurfa.jnet\nYour password is: password\n\nEverybody's password is password. The internet is free. The phone bill is not. Mom will find out." },
    { id: 'teeflink', name: 'RupeeLink Unlimited', col: '#c09000', tag: 'Unlimited* internet! (*limited)', end: "Dialling RupeeLink...\n\nConnection failed: somebody picked up the phone.\n\nYour Unlimited* account is ready. (*Unlimited means 10 minutes on Sundays, after 6pm, if it's not raining.)" },
    { id: 'dialadave', name: 'Dial-a-Dave', col: '#0028c8', tag: 'Ask Dave anything! (He might know.)', end: "Dialling Dave...\n\nDave answered.\n\nHe says he isn't an internet provider, he's eating his tea, and how did you get this number." },
    { id: 'grotmail', name: 'HotJack Free Email', col: '#7a5a2a', tag: 'FREE email! (Gubbinz reads it first)', end: "Welcome to HotJack!\n\nYour new address is: coolkid1999@hotjack.jnet\n(That one was taken, so you're coolkid1999_2_the_sequel@hotjack.jnet)\n\nGubbinz will read all your emails before you do. He's very nosy. FREE though!" },
  ];
  function ispWizard(isp) {
    const b = h('div', 'ff-wiz');
    const nick = String((Net.me && Net.me.nick) || 'Guest').replace(/[^A-Za-z0-9]/g, '').slice(0, 12) || 'Guest';
    const STEPS = [
      () => `<h3>Welcome to ${esc(isp.name)}!</h3><p>${esc(isp.tag)}</p><p>This wizard will sign you up in 4 easy steps. You'll be surfing the Information Superhighway in no time!</p><p class="ff-small">(Nothing you choose here goes anywhere. It's a pretend sign-up.)</p>`,
      () => `<h3>Choose your plan</h3>${[['£9.99 a month', '10 hours of internet. Then it just stops.'], ['£14.99 a month', '"Unlimited" (until your Mom sees the phone bill)'], ['FREE!', 'You only pay for the phone call. For ever. At peak rate.']].map(([p, d], i) => `<label class="ff-opt"><input type="radio" name="plan" ${i ? '' : 'checked'}> <b>${p}</b> - ${d}</label>`).join('')}`,
      () => `<h3>Pick a username</h3>${[nick.toLowerCase() + '1999', 'xx_' + nick.toLowerCase() + '_xx', nick.toLowerCase() + '_rulez', 'n64fan' + ri(100, 999)].map((u, i) => `<label class="ff-opt"><input type="radio" name="un" ${i ? '' : 'checked'}> ${esc(u)}</label>`).join('')}<h3>How will you pay?</h3>${['Pocket money', 'Rupees', 'An IOU'].map((p, i) => `<label class="ff-opt"><input type="radio" name="pay" ${i ? '' : 'checked'}> ${p}</label>`).join('')}`,
      () => `<h3>Connecting...</h3><p class="ff-wizdial">Dialling ${esc(isp.name)}...</p><div class="prog"><span style="display:flex;gap:2px" class="ff-wizbar"></span></div>`,
      () => `<h3>All done!</h3><p class="ff-wizend"></p>`,
    ];
    b.innerHTML = `<div class="ff-wizside" style="background:${isp.col}"><div class="ff-wizlogo">${I.isp}</div><b>${esc(isp.name)}</b></div><div class="ff-wizmain"><div class="ff-wizbody"></div><div class="ff-wizbtns"><button class="btn" data-a="back" type="button">&lt; Back</button><button class="btn" data-a="next" type="button">Next &gt;</button><button class="btn" data-a="cancel" type="button">Cancel</button></div></div>`;
    const w = Apps.win(isp.name + ' Sign-Up', b, { w: 460, icon: I.isp, noResize: true, noMax: true, escClose: true });
    let step = 0, timer = 0;
    const body = b.querySelector('.ff-wizbody'), back = b.querySelector('[data-a=back]'), next = b.querySelector('[data-a=next]');
    function show() {
      body.innerHTML = STEPS[step](); back.disabled = step === 0 || step >= 3; next.textContent = step === 4 ? 'Finish' : 'Next >'; next.disabled = step === 3;
      if (step === 3) {
        if (Sound.on) play('modem');
        let n = 0; timer = setInterval(() => { if (w.closed) return clearInterval(timer); const bar = b.querySelector('.ff-wizbar'); if (bar) bar.appendChild(document.createElement('i')); if (n === 8) b.querySelector('.ff-wizdial').textContent = 'Handshaking (eeee-ooo-krrrrsh)...'; if (++n >= 18) { clearInterval(timer); step = 4; show(); } }, 170);
      }
      if (step === 4) {
        b.querySelector('.ff-wizend').textContent = isp.end;
        const done = store.get('jhp_fun_isps', []); if (!done.includes(isp.id)) { done.push(isp.id); store.set('jhp_fun_isps', done); }
        got('isp'); if (ISPS.every(x => done.includes(x.id))) got('ispall');
      }
    }
    b.addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'cancel') { clearInterval(timer); w.close(); }
      if (a.dataset.a === 'back' && step > 0) { step--; show(); }
      if (a.dataset.a === 'next') { if (step === 4) w.close(); else { step++; show(); } }
    });
    show();
    return w;
  }
  function onlineServices() {
    const root = { name: 'Online Services', icon: I.online, kids: [...ISPS.map(isp => ({ name: isp.name, type: 'exe', icon: (window.JICON && { squignet: 'ringnet', waaaghnet: 'freesurfa', dialadave: 'phone', grotmail: 'mail' }[isp.id]) ? JICON.icon({ squignet: 'ringnet', waaaghnet: 'freesurfa', dialadave: 'phone', grotmail: 'mail' }[isp.id]) : I.isp.replace('#ffd400', isp.col), note: isp.tag, act: () => ispWizard(isp), props: () => Desk.msgbox(isp.name, `${isp.name}\n${isp.tag}\n\nSign-up wizard, 1999 edition.`, 'info') })),
      { name: 'About the Online Services.txt', type: 'txt', text: 'ONLINE SERVICES\n\nThese are the internet companies that came free on CDs stuck to the front of magazines.\nPick one and sign up! It is completely pretend.\n\nJack is already on JackNet, which is the best one. Obviously.\n' }] };
    return folderWin('Online Services', I.online, root, { w: 520, h: 320, about: 'Online Services\n\nGet connected to the Internet! (You are already connected to the Internet.)' }).w;
  }
  Apps.register('online', { single: true, cmd: ['online services', 'isp', 'signup'], open: onlineServices });
  S('isp', 'Signed up', 'Sign up for a pretend internet company in Online Services');
  S('ispall', 'Coaster collector', 'Sign up for every single one of them');

  // ---- Jackotchi: a tiny virtual grot in the system tray
  const GC = { el: null, w: null };
  const gcGet = () => store.get('jhp_fun_grotchi', null) || gcNew();
  function gcNew() { const n = Date.now(), s = { born: n, fed: n, played: n, cleaned: n, gen: (store.get('jhp_fun_grotchi', {}) || {}).gen + 1 || 1 }; store.set('jhp_fun_grotchi', s); return s; }
  function gcStats(s) {
    const hrs = k => (Date.now() - s[k]) / 3600000;
    return { hungry: Math.max(0, 4 - Math.floor(hrs('fed') / 3)), happy: Math.max(0, 4 - Math.floor(hrs('played') / 4)), poop: Math.min(3, Math.floor(hrs('cleaned') / 6)), age: Math.floor((Date.now() - s.born) / 86400000), gone: hrs('fed') > 72 };
  }
  function grotchi() {
    if (GC.w && !GC.w.closed) { GC.w.restore(); return GC.w; }
    const b = h('div', 'ff-gchi');
    b.innerHTML = `<div class="ff-egg"><div class="ff-lcd"><canvas width="${GW}" height="${GH}"></canvas><span class="ff-poo"></span><div class="ff-gst"></div></div><div class="ff-eggbtns"><button type="button" data-a="feed" aria-label="Feed">A</button><button type="button" data-a="play" aria-label="Play">B</button><button type="button" data-a="clean" aria-label="Clean">C</button></div><div class="ff-egglbl"><span>FEED</span><span>PLAY</span><span>CLEAN</span></div></div><p class="ff-gmsg small"></p>`;
    const w = Apps.win('Jackotchi', b, { w: 230, icon: I.egg.replace('viewBox="0 0 16 16"', 'viewBox="0 0 16 16"'), noResize: true, noMax: true, escClose: true, onClose: () => cancelAnimationFrame(raf) });
    GC.w = w;
    const g = b.querySelector('canvas').getContext('2d'), st = b.querySelector('.ff-gst'), msg = b.querySelector('.ff-gmsg'), poo = b.querySelector('.ff-poo');
    let pose = 'stand', poseUntil = 0, raf = 0;
    const draw = () => {
      let s = gcGet(); const k = gcStats(s);
      if (k.gone) { msg.textContent = 'Your Jackotchi got hungry and ran off to join the circus! A new egg has hatched.'; s = gcNew(); }
      const k2 = gcStats(s);
      st.innerHTML = `GRUB ${'\u2665'.repeat(k2.hungry)}${'\u2661'.repeat(4 - k2.hungry)}<br>FUN&nbsp; ${'\u2665'.repeat(k2.happy)}${'\u2661'.repeat(4 - k2.happy)}<br>AGE ${k2.age}d &middot; GEN ${s.gen}`;
      poo.textContent = '\u2668'.repeat(k2.poop);
      return k2;
    };
    let k = draw();
    const loop = t => { if (w.closed) return; raf = requestAnimationFrame(loop); if (!b.offsetParent) return; const p = t < poseUntil ? pose : (k.hungry < 2 ? 'sit' : k.happy < 2 ? 'sleep' : 'walk'); drawGrot(g, p, Math.floor(t / 400), t); };
    raf = requestAnimationFrame(loop);
    b.addEventListener('click', ev => {
      const a = ev.target.closest('[data-a]'); if (!a) return;
      const s = gcGet(), now = performance.now();
      if (a.dataset.a === 'feed') { s.fed = Date.now(); pose = 'eat'; msg.textContent = pick(['Nom! Pizza!', 'MORE!', 'Burp.']); got('grotchi'); }
      if (a.dataset.a === 'play') { s.played = Date.now(); pose = 'happy'; msg.textContent = pick(['Wheee!', 'Again!', 'He won. He always wins.']); }
      if (a.dataset.a === 'clean') { s.cleaned = Date.now(); pose = 'wave'; msg.textContent = 'All clean. He hates it.'; }
      poseUntil = now + 2500; store.set('jhp_fun_grotchi', s); k = draw(); play('pet'); trayState();
    });
    return w;
  }
  function trayState() { if (!GC.el) return; const k = gcStats(gcGet()); GC.el.classList.toggle('ff-beg', k.hungry < 2 || k.poop >= 2); GC.el.title = k.hungry < 2 ? 'Jackotchi is HUNGRY!' : 'Jackotchi (your tiny Gubbinz)'; }
  // the egg only lives in the tray once Jackotchi Virtual Pet is installed (it's a download, not part of the PC)
  const gcHave = () => !!(window.Setup && Setup.has && Setup.has('grotchi'));
  function trayIcon() {
    const tray = $('tray'); if (!tray) return;
    if (!gcHave()) { if (GC.el) { GC.el.remove(); GC.el = null; } return; }
    if (!GC.el) {
      const b = h('button', 'ff-traygc'); b.type = 'button'; b.innerHTML = I.egg; b.setAttribute('aria-label', 'Jackotchi');
      tray.insertBefore(b, $('clock') || null); GC.el = b;
      b.addEventListener('click', grotchi);
    }
    trayState();
  }
  (function gcStart(n) { if (window.Setup && Setup.has) trayIcon(); else if (n < 100) setTimeout(() => gcStart(n + 1), 200); })(0); // (setup.js loads after this file)
  document.addEventListener('setup', trayIcon); setInterval(trayIcon, 300000);
  Apps.register('grotchi', { single: true, cmd: ['jackotchi', 'grotchi', 'tamagotchi', 'virtual pet'], open: grotchi });
  S('grotchi', 'Tiny pet keeper', 'Something small lives by the clock. Feed it');

  // ================================================================ desktop icons + Start menu entries
  Apps.desktopIcon('Network Neighborhood', I.net, () => Apps.open('nethood'), 'iconNetHood');
  Apps.desktopIcon('My Briefcase', I.brief, () => Apps.open('briefcase'), 'iconBriefcase');
  Apps.desktopIcon('Online Services', I.online, () => Apps.open('online'), 'iconOnline');
  Apps.addProgram(['Accessories', 'Communications', 'Network Neighborhood'], 'nethood', I.net);
  Apps.addProgram(['Accessories', 'Communications', 'WinPopup'], () => Apps.run('winpopup'), I.popup);
  Apps.addProgram(['Accessories', 'Communications', 'IP Configuration'], 'winipcfg', I.net);
  Apps.addProgram(['Accessories', 'Communications', 'Telnet'], telnet, I.dos);
  Apps.addProgram(['Accessories', 'Jackotchi'], 'grotchi', I.egg);
  Apps.addProgram(['Online Services', 'Online Services'], 'online', I.online);
  ISPS.forEach(isp => Apps.addProgram(['Online Services', isp.name], () => ispWizard(isp), I.isp));
  SAVER_ORDER.forEach(n => Apps.addProgram(['Accessories', 'Screen Savers', n], () => startSaver(n), I.saver));
  Apps.addProgram(['Accessories', 'Screen Savers', '3D Text Setup...'], textSetup, I.saver);
  Apps.addProgram(['Accessories', 'System Tools', 'About JackOS'], 'winver', I.pcme);
  // a few files on the C: drive for the curious
  Apps.fs.add('C:/JACKOS', { name: 'SSAVERS.TXT', type: 'txt', date: '12/05/99', size: '1 KB', text: 'SCREEN SAVERS INSTALLED\n\n' + SAVER_ORDER.map(n => '  ' + n).join('\n') + '\n\nTip: you can start one straight away from Start > Run. Try "flyingsaucers" or "sspipes".\nThe 3D Text one says whatever you like: "sstextsetup".\n' });
  Apps.fs.add('C:/JACKOS', { name: 'WINPOPUP.TXT', type: 'txt', date: '30/06/99', size: '1 KB', text: 'WINPOPUP\n\nYou can send a little message to anybody on JackNet!\nOpen Network Neighborhood, pick a computer, and click Send Message.\n\nBe nice. Messages pop up on their screen straight away.\n(If someone is being a pain, tick "Ignore messages" on their message.)\n' });
})();

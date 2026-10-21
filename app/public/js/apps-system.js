/* JackOS 98 "system" pack: the bits that make the PC feel lived in.
 * Tray (volume, clock tip, Resource Meter, printer, Task Scheduler), desktop (right-click New, marquee select,
 * Arrange Icons, Active Desktop Channel Bar), random 1999 events (New Hardware Found, low virtual memory),
 * Welcome/Tip of the Day on boot, and the registry for the lazily loaded programs in system-*.js:
 * Task Manager, Device Manager, System Monitor, Resource Meter, Scheduled Tasks, Backup, Disk Cleanup,
 * Maintenance Wizard, Accessibility Wizard, Sound Recorder, Volume Control, Printers + spooler, JackOS Update,
 * Desktop Themes, JackOS Help, Welcome + Discover tour, Channels. */
(function () {
  'use strict';
  const A = window.Apps; if (!A) return;
  const $ = id => document.getElementById(id);
  const esc = A.esc, store = A.store;
  const K = k => 'jhp_system_' + k;
  const get = (k, d) => store.get(K(k), d), put = (k, v) => store.set(K(k), v);
  const sess = { get(k) { try { return sessionStorage.getItem(K(k)); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(K(k), v); } catch (e) {} } };
  const qs = (el, s) => el.querySelector(s), qsa = (el, s) => [...el.querySelectorAll(s)];
  const on = (el, ev, fn, o) => el.addEventListener(ev, fn, o);
  const h = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const touch = () => matchMedia('(hover:none)').matches;
  const S = id => A.secret('system.' + id);
  const toast = (t, x, ms) => Desk.toast(t, x, ms);
  const msg = (t, x, ic, b) => Desk.msgbox(t, x, ic, b);
  const fmt = n => Math.round(n).toLocaleString('en-GB');
  // double-click with a mouse, single tap on a touch screen
  function dbl(el, fn) { let last = 0; on(el, 'click', ev => { const now = Date.now(); if (touch() || now - last < 450) { last = 0; fn(ev); } else last = now; }); }

  // ================================================================ icons (32x32 viewBox, used at 16 and 32)
  const I = {
    welcome: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="20" fill="#000080" stroke="#000"/><path d="M8 9l7-1v6H8zM16 8l8-1v7h-8zM8 15h7v6l-7-1zM16 15h8v7l-8-1z" fill="#e10600"/><path d="M16 8l8-1v7h-8z" fill="#0a0"/><path d="M8 15h7v6l-7-1z" fill="#0028c8"/><path d="M16 15h8v7l-8-1z" fill="#ffd400"/><rect x="10" y="24" width="12" height="4" fill="#808080" stroke="#000"/></svg>',
    help: '<svg viewBox="0 0 32 32"><path d="M5 4h18l4 3v22H9l-4-3z" fill="#7a2a9a" stroke="#000"/><path d="M5 4v22h18V4" fill="#a050c0" stroke="#000"/><circle cx="14" cy="15" r="7" fill="#fff" stroke="#000"/><text x="14" y="19.5" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="12" fill="#000080">?</text></svg>',
    taskmgr: '<svg viewBox="0 0 32 32"><rect x="3" y="4" width="26" height="22" fill="#c0c0c0" stroke="#000"/><rect x="3" y="4" width="26" height="4" fill="#000080"/><rect x="6" y="11" width="20" height="12" fill="#000" stroke="#808080"/><path d="M7 20l3-2 3 1 3-6 3 3 3-5 3 2" stroke="#0f0" fill="none" stroke-width="1.5"/></svg>',
    devmgr: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="22" height="16" fill="#c0c0c0" stroke="#000"/><rect x="6" y="8" width="16" height="10" fill="#008080"/><rect x="9" y="22" width="10" height="3" fill="#808080" stroke="#000"/><rect x="18" y="16" width="12" height="12" fill="#ffd400" stroke="#000"/><path d="M20 26l2-6 2 3 2-4 2 7" stroke="#000" fill="none"/></svg>',
    sysmon: '<svg viewBox="0 0 32 32"><rect x="3" y="4" width="26" height="24" fill="#fff" stroke="#000"/><path d="M3 10h26M3 16h26M3 22h26" stroke="#ccc"/><path d="M4 24l5-6 4 3 5-12 4 7 6-5" stroke="#e10600" stroke-width="2" fill="none"/><path d="M4 26l6-2 5 1 5-5 5 2 3-2" stroke="#0028c8" stroke-width="1.5" fill="none"/></svg>',
    rsrc: '<svg viewBox="0 0 32 32"><rect x="4" y="3" width="24" height="26" fill="#c0c0c0" stroke="#000"/><rect x="8" y="7" width="4" height="18" fill="#fff" stroke="#000"/><rect x="14" y="7" width="4" height="18" fill="#fff" stroke="#000"/><rect x="20" y="7" width="4" height="18" fill="#fff" stroke="#000"/><rect x="8.5" y="13" width="3" height="11.5" fill="#0a0"/><rect x="14.5" y="11" width="3" height="13.5" fill="#0a0"/><rect x="20.5" y="17" width="3" height="7.5" fill="#ffd400"/></svg>',
    sched: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><rect x="7" y="12" width="14" height="13" fill="#fff" stroke="#000"/><rect x="7" y="12" width="14" height="3" fill="#e10600"/><circle cx="23" cy="22" r="6" fill="#fff" stroke="#000"/><path d="M23 18v4h3" stroke="#000" fill="none"/></svg>',
    backup: '<svg viewBox="0 0 32 32"><rect x="3" y="8" width="18" height="18" fill="#222" stroke="#000"/><rect x="7" y="8" width="10" height="6" fill="#bbb"/><rect x="6" y="17" width="12" height="9" fill="#eee"/><rect x="11" y="4" width="18" height="18" fill="#2a4aa0" stroke="#000"/><rect x="15" y="4" width="10" height="6" fill="#ccc"/><rect x="14" y="13" width="12" height="9" fill="#fff"/><path d="M16 16h8M16 19h6" stroke="#e10600"/></svg>',
    clean: '<svg viewBox="0 0 32 32"><rect x="2" y="15" width="22" height="10" fill="#c0c0c0" stroke="#000"/><rect x="5" y="20" width="8" height="2" fill="#000"/><rect x="19" y="20" width="3" height="2" fill="#0c0"/><path d="M28 2l-8 14" stroke="#8a4a1a" stroke-width="2.5"/><path d="M17 14l6 3-3 8-7-4z" fill="#ffd400" stroke="#000"/><path d="M14 22l3-6M17 24l3-6" stroke="#a07000"/></svg>',
    tuneup: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="22" height="16" fill="#c0c0c0" stroke="#000"/><rect x="6" y="8" width="16" height="10" fill="#000080"/><rect x="9" y="22" width="10" height="3" fill="#808080" stroke="#000"/><path d="M29 17l-9 9-2-2 9-9a4 4 0 0 1 2-6l-2 3 2 2 3-2a4 4 0 0 1-3 5z" fill="#808080" stroke="#000"/></svg>',
    access: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#2a7ad8" stroke="#000"/><circle cx="16" cy="8" r="2.5" fill="#fff"/><path d="M8 12h16M16 12v7l-4 7M16 19l4 7" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
    mic: '<svg viewBox="0 0 32 32"><rect x="12" y="3" width="8" height="15" rx="4" fill="#808080" stroke="#000"/><path d="M9 13v2a7 7 0 0 0 14 0v-2" fill="none" stroke="#000" stroke-width="1.5"/><path d="M16 22v5M11 28h10" stroke="#000" stroke-width="2"/><path d="M14 6h4M14 9h4M14 12h4" stroke="#c0c0c0"/></svg>',
    vol: '<svg viewBox="0 0 32 32"><path d="M4 12h6l8-7v22l-8-7H4z" fill="#ffd400" stroke="#000"/><path d="M21 11c2 2 2 8 0 10M24 8c4 4 4 12 0 16" stroke="#000" fill="none" stroke-width="1.5"/></svg>',
    printer: '<svg viewBox="0 0 32 32"><rect x="8" y="3" width="16" height="10" fill="#fff" stroke="#000"/><path d="M11 6h10M11 9h7" stroke="#808080"/><rect x="3" y="12" width="26" height="12" fill="#c8c0b0" stroke="#000"/><rect x="3" y="12" width="26" height="3" fill="#a8a090"/><rect x="7" y="21" width="18" height="8" fill="#fff" stroke="#000"/><circle cx="25" cy="17" r="1.5" fill="#0c0"/></svg>',
    printers: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><rect x="10" y="12" width="12" height="5" fill="#fff" stroke="#000"/><rect x="7" y="16" width="18" height="7" fill="#c8c0b0" stroke="#000"/><rect x="10" y="21" width="12" height="4" fill="#fff" stroke="#000"/></svg>',
    themes: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="24" height="18" fill="#c0c0c0" stroke="#000"/><rect x="5" y="7" width="18" height="12" fill="#5b16c9"/><circle cx="10" cy="11" r="2" fill="#ffd400"/><path d="M5 19l6-6 4 4 3-3 5 5z" fill="#0a0"/><path d="M18 18c4-5 12-5 12 2 0 3-3 3-4 2s-2 4-5 3-5-3-3-7z" fill="#f2c79a" stroke="#000"/><circle cx="21" cy="20" r="1.3" fill="#e10600"/><circle cx="24" cy="18" r="1.3" fill="#0028c8"/><circle cx="27" cy="20" r="1.3" fill="#0a0"/></svg>',
    update: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#2a7ad8" stroke="#003a80"/><path d="M5 12c7-3 15-3 22 0M5 20c7 3 15 3 22 0M16 3v26" stroke="#9fd0ff" fill="none"/><path d="M16 8v13M10 15l6 7 6-7" stroke="#fff" stroke-width="3.5" fill="none"/><path d="M16 8v13M10 15l6 7 6-7" stroke="#0a0" stroke-width="2" fill="none"/></svg>',
    y2k: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#fff" stroke="#000" stroke-width="2"/><path d="M16 6v10l6 4" stroke="#000" stroke-width="2" fill="none"/><rect x="3" y="20" width="26" height="9" fill="#e10600" stroke="#000"/><text x="16" y="27.5" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="8" fill="#fff">Y2K</text></svg>',
    channel: '<svg viewBox="0 0 32 32"><path d="M6 6a16 16 0 0 0 20 20z" fill="#c0c0c0" stroke="#000"/><path d="M16 16l8-8" stroke="#000" stroke-width="2"/><circle cx="25" cy="7" r="3" fill="#e10600" stroke="#000"/><path d="M4 28h14" stroke="#000" stroke-width="2"/></svg>',
    tip: '<svg viewBox="0 0 32 32"><path d="M16 3a9 9 0 0 0-5 16v4h10v-4a9 9 0 0 0-5-16z" fill="#ffff80" stroke="#000"/><path d="M12 26h8M13 29h6" stroke="#000" stroke-width="2"/><path d="M14 19l2-7 2 7" stroke="#a07000" fill="none"/></svg>',
    folder: A.ICON.folder, txt: A.ICON.txt, app: A.ICON.app,
    lnk: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" fill="#c0c0c0" stroke="#000"/><rect x="4" y="6" width="24" height="5" fill="#000080"/><rect x="8" y="14" width="8" height="8" fill="#fff" stroke="#000"/><rect x="2" y="20" width="10" height="10" fill="#fff" stroke="#000"/><path d="M4 28l5-5M6 23h3v3" stroke="#000" stroke-width="1.5" fill="none"/></svg>',
    reg: '<svg viewBox="0 0 32 32"><rect x="5" y="3" width="20" height="26" fill="#fff" stroke="#000"/><path d="M8 8h14M8 12h14M8 16h10" stroke="#000080"/><path d="M14 26c3-6 6-4 4-1s4-2 6-6" stroke="#0028c8" fill="none" stroke-width="1.5"/><path d="M24 16l6-6 2 2-6 6-3 1z" fill="#ffd400" stroke="#000"/></svg>',
    icw: '<svg viewBox="0 0 32 32"><rect x="2" y="8" width="18" height="14" fill="#c0c0c0" stroke="#000"/><rect x="4" y="10" width="14" height="9" fill="#008080"/><circle cx="23" cy="13" r="8" fill="#2a7ad8" stroke="#003a80"/><path d="M15 11c5-2 11-2 16 0M15 15c5 2 11 2 16 0M23 5v16" stroke="#9fd0ff" fill="none"/><path d="M2 26h28" stroke="#000" stroke-width="2"/></svg>',
  };
  // the official JackOS 98 icons (icons.js) where they're the specific match
  if (window.JICON) Object.assign(I, { welcome: JICON.icon('welcome'), help: JICON.icon('helpbook'), taskmgr: JICON.icon('taskmgr'), devmgr: JICON.icon('devmgr'), sysmon: JICON.icon('sysmon'), printer: JICON.icon('printer'), printers: JICON.icon('printer'), themes: JICON.icon('themes'), update: JICON.icon('update'), vol: JICON.icon('sound'), tip: JICON.icon('tip'), access: JICON.icon('access'), channel: JICON.icon('channels'), icw: JICON.icon('icw'), mic: JICON.icon('mic'), sched: JICON.icon('sched'), backup: JICON.icon('backup'), clean: JICON.icon('cleanup'), tuneup: JICON.icon('tuneup'), rsrc: JICON.icon('rsrc'), y2k: JICON.icon('y2k') });
  const mini = (svg, n) => svg.replace('<svg ', `<svg width="${n || 16}" height="${n || 16}" `);

  // ================================================================ small UI kit (shared with the lazy files)
  // JackOS 98 progress bar made of blocks; returns set(0..1)
  function bar(el) {
    el.classList.add('prog'); el.innerHTML = '<span style="display:flex;gap:2px"></span>';
    const s = el.firstChild; let last = -1;
    return f => { const w = el.clientWidth || 260, max = Math.max(1, Math.floor((w - 4) / 11)); const k = Math.round(clamp(f, 0, 1) * max); if (k !== last) { last = k; s.innerHTML = '<i></i>'.repeat(k); } };
  }
  // a 1999 progress run: bursts, pauses, a long think at 99%, then done
  function crawl(o) {
    let f = o.from || 0, stalled = false, alive = true, timer = 0;
    const total = o.ms || 6000, cap = o.stallAt == null ? 0.99 : o.stallAt;
    const step = () => {
      if (!alive || (o.alive && !o.alive())) { alive = false; return; }
      if (o.paused && o.paused()) { timer = setTimeout(step, 200); return; }
      if (f < cap) {
        const r = Math.random(), inc = r < 0.18 ? 0 : r < 0.88 ? 0.5 + Math.random() : 2.5 + Math.random() * 3;
        f = Math.min(cap, f + inc * 140 / total); o.set(f); timer = setTimeout(step, 140);
      } else if (!stalled) {
        stalled = true; o.set(f); if (o.onStall) o.onStall();
        timer = setTimeout(() => { if (!alive || (o.alive && !o.alive())) return; f = 1; o.set(1); if (o.done) o.done(); }, o.stallMs || 2400 + Math.random() * 2600);
      }
    };
    timer = setTimeout(step, 140);
    return { stop() { alive = false; clearTimeout(timer); }, get f() { return f; } };
  }
  // property-sheet tabs
  function tabs(host, list, start) {
    host.innerHTML = `<div class="sys-tabs" role="tablist">${list.map((t, i) => `<button type="button" role="tab" data-i="${i}">${esc(t[0])}</button>`).join('')}</div><div class="sys-tabpage"></div>`;
    const pg = qs(host, '.sys-tabpage'); let cur = -1, leave = null;
    const show = i => { if (leave) { try { leave(); } catch (e) {} leave = null; } cur = i; qsa(host, '.sys-tabs button').forEach((b, j) => b.classList.toggle('on', j === i)); pg.innerHTML = ''; leave = list[i][1](pg) || null; };
    qsa(host, '.sys-tabs button').forEach(b => on(b, 'click', () => show(+b.dataset.i)));
    show(start || 0);
    return { show, pg, get cur() { return cur; }, stop() { if (leave) leave(); leave = null; } };
  }
  // a dialog with HTML content and a row of buttons. fn returning false keeps it open.
  function dlg(title, html, buttons, o) {
    o = o || {};
    const b = h(html, 'sys-dlg' + (o.cls ? ' ' + o.cls : ''));
    const row = h('', 'row sys-btns'); b.appendChild(row);
    const w = A.win(title, b, { w: o.w || 340, icon: o.icon, noResize: true, noMax: true, noMin: !o.min, escClose: true, onClose: o.onClose, x: o.x, y: o.y });
    (buttons || [['OK']]).forEach(([label, fn], i) => {
      const bt = h('', 'btn', 'button'); bt.type = 'button'; bt.textContent = label; if (i === 0) bt.classList.add('sys-def');
      on(bt, 'click', () => { if (fn && fn(b, w) === false) return; w.close(); });
      row.appendChild(bt);
    });
    setTimeout(() => { const f = qs(b, 'input:not([type=checkbox]):not([type=radio]),select') || qs(row, 'button'); if (f && !touch()) f.focus(); }, 40);
    return { w, b };
  }
  // a JackOS 98 wizard: pages = [{ title, render(pg, data), next?(data, pg) -> false to stay | page index, last? }]
  function wizard(title, art, pages, o) {
    o = o || {};
    const data = o.data || {};
    const b = h(`<div class="sys-wiz"><div class="sys-wiz-art">${art}</div><div class="sys-wiz-pg"></div></div><div class="sys-wiz-hr"></div><div class="row sys-btns"><button type="button" class="btn" data-z="back">&lt; Back</button><button type="button" class="btn sys-def" data-z="next">Next &gt;</button><button type="button" class="btn" data-z="cancel">Cancel</button></div>`);
    const w = A.win(title, b, { w: o.w || 500, icon: o.icon, noResize: true, noMax: true, escClose: true, onClose: o.onClose });
    const pg = qs(b, '.sys-wiz-pg'), back = qs(b, '[data-z=back]'), next = qs(b, '[data-z=next]');
    const hist = []; let cur = 0;
    function show(i) {
      cur = i; const p = pages[i]; pg.innerHTML = p.title ? `<h3>${p.title}</h3>` : '';
      const inner = h('', 'sys-wiz-in'); pg.appendChild(inner); p.render(inner, data, w);
      back.disabled = !hist.length; next.textContent = p.last ? 'Finish' : 'Next >'; next.disabled = !!p.noNext;
    }
    on(back, 'click', () => { if (hist.length) show(hist.pop()); });
    on(next, 'click', () => {
      const p = pages[cur];
      const r = p.next ? p.next(data, pg, w) : undefined;
      if (r === false) return;
      if (p.last) { w.close(); if (o.finish) o.finish(data); return; }
      hist.push(cur); show(typeof r === 'number' ? r : cur + 1);
    });
    on(qs(b, '[data-z=cancel]'), 'click', () => { w.close(); if (o.cancel) o.cancel(data); });
    show(0);
    return { w, show, data, enableNext(v) { next.disabled = !v; }, get cur() { return cur; } };
  }
  // vertical slider (0..1); returns {el, set(v)}
  function vslider(v, onChange, o) {
    o = o || {};
    const el = h('<span class="sys-vs-track"></span><span class="sys-vs-thumb"></span>', 'sys-vs');
    el.tabIndex = 0; el.setAttribute('role', 'slider'); el.setAttribute('aria-label', o.label || 'Volume');
    const th = qs(el, '.sys-vs-thumb');
    const set = (nv, fire) => { v = clamp(nv, 0, 1); th.style.top = ((1 - v) * 100) + '%'; el.setAttribute('aria-valuenow', Math.round(v * 100)); if (fire && onChange) onChange(v); };
    let drag = false;
    const at = ev => { const r = DesktopSurface.rect(el), p = DesktopSurface.point(ev.clientX, ev.clientY); set(1 - (p.y - r.top - 6) / (r.height - 12), true); };
    on(el, 'pointerdown', ev => { ev.preventDefault(); drag = true; el.setPointerCapture(ev.pointerId); at(ev); el.focus(); });
    on(el, 'pointermove', ev => { if (drag) at(ev); });
    on(el, 'pointerup', () => { drag = false; if (o.end) o.end(v); });
    on(el, 'pointercancel', () => { drag = false; });
    on(el, 'keydown', ev => { const d = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05, PageUp: 0.2, PageDown: -0.2 }[ev.key]; if (d) { ev.preventDefault(); set(v + d, true); if (o.end) o.end(v); } });
    set(v);
    return { el, set, get v() { return v; } };
  }

  // ================================================================ the PC's pretend load (Task Manager, System Monitor, Resource Meter)
  const GAME_RE = /solitaire|freecell|pinball|mine|jacktris|tetris|squig|doom|game|grotchi|jackotchi|cube|chess|reversi|snake|invaders|zone/i;
  let pointerBusy = 0, lastBoost = 0;
  on(document, 'pointermove', () => { pointerBusy++; }, { passive: true });
  on(document, 'keydown', () => { pointerBusy += 3; });
  const LOAD = { cpu: 4, mem: 30, swap: 6, res: 80, user: 82, gdi: 78, kbIn: 0, kbOut: 0, game: false, wins: 0, hist: [], memHist: [], ticks: [] };
  function visibleWins() { return qsa(document, '.appwin').filter(w => w.style.display !== 'none'); }
  function sample() {
    const wins = qsa(document, '.appwin'), titles = wins.map(w => (qs(w, '.tb .t') || {}).textContent || '');
    const br = $('browser'), brOn = br && !br.classList.contains('min');
    const sec = window.IE ? IE.current : '';
    const saver = $('saverFull') && getComputedStyle($('saverFull')).display !== 'none';
    const game = titles.some(t => GAME_RE.test(t)) || (brOn && /demos|grot|cube|tris/.test(sec || '')) || saver;
    const n = wins.length + (brOn ? 1 : 0);
    let cpu = 2 + n * 1.6 + Math.min(30, pointerBusy * 0.35) + Math.random() * 5;
    if (game) cpu += 48 + Math.random() * 45;
    if (Math.random() < 0.06) cpu += 25 + Math.random() * 40; // something in the background woke up
    if (Date.now() < lastBoost) cpu += 50;
    pointerBusy = 0;
    LOAD.cpu = clamp(Math.round(cpu), 1, 100); LOAD.game = game; LOAD.wins = n;
    const mem = 27.5 + n * 3.1 + (game ? 13 : 0) + Math.random() * 1.2;
    LOAD.mem = Math.min(63.6, mem); LOAD.swap = Math.max(4, mem - 52 + 6 + Math.random() * 2);
    LOAD.res = clamp(Math.round(86 - n * 5.5 - (game ? 6 : 0)), 2, 99);
    LOAD.user = clamp(LOAD.res + 4, 3, 99); LOAD.gdi = clamp(Math.round(LOAD.res * 0.9 + 6), 3, 99);
    LOAD.kbIn = Net && Net.connected ? Math.max(0, (Math.random() < 0.3 ? Math.random() * 4.6 : Math.random() * 0.4)) : 0;
    LOAD.kbOut = LOAD.kbIn * 0.2 * Math.random();
    LOAD.hist.push(LOAD.cpu); LOAD.memHist.push(LOAD.mem); if (LOAD.hist.length > 240) { LOAD.hist.shift(); LOAD.memHist.shift(); }
    LOAD.ticks.forEach(fn => { try { fn(LOAD); } catch (e) {} });
  }
  LOAD.onTick = fn => { LOAD.ticks.push(fn); return () => { LOAD.ticks = LOAD.ticks.filter(x => x !== fn); }; };
  LOAD.boost = ms => { lastBoost = Date.now() + ms; };
  for (let i = 0; i < 60; i++) { LOAD.hist.push(2 + Math.round(Math.random() * 6)); LOAD.memHist.push(30 + Math.random()); }
  setInterval(sample, 1000);

  // ================================================================ lazy programs
  const P = {}; // id -> open(arg) provided by system-*.js
  const FILE_OF = {};
  function need(file) { return A.load('js/' + file); }
  function reg(id, file, cmd, single) {
    FILE_OF[id] = file;
    // programs may return an Apps.win, a {w} wrapper (wizards/dialogs) or nothing; Apps.open only wants a real window
    const asWin = w => (w && w.el && w.restore) ? w : (w && w.w && w.w.el) ? w.w : null;
    const def = { single: single !== false, cmd, open(arg) {
      if (P[id]) return asWin(P[id](arg));
      if (def._pending) return null; // already loading: one window is enough
      def._pending = true; document.body.classList.add('sys-wait');
      need(file).then(() => { def._pending = false; document.body.classList.remove('sys-wait'); if (!P[id]) throw new Error('missing ' + id); const w = asWin(P[id](arg)); if (def.single && w) def._w = w; })
        .catch(e => { def._pending = false; console.warn('[system] could not open ' + id, e); document.body.classList.remove('sys-wait'); if (P[id] || arg === '__auto') return; msg('JackOS', `Cannot find the file '${file.toUpperCase()}' (or one of its components).\n\nPlease insert the JackOS 98 CD-ROM and try again. (Check your modem is plugged in too.)`, 'warn'); });
      return null;
    } };
    A.register(id, def);
    return def;
  }
  const open = (id, arg) => A.open(id, arg);

  // ================================================================ tray icons
  const tray = $('tray'), clockEl = $('clock');
  function trayIcon(cls, svg, title, o) {
    const b = h(mini(svg, 16), 'sys-tray ' + cls, 'button'); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title);
    if (tray) tray.insertBefore(b, clockEl || null);
    if (o.click) on(b, 'click', ev => { ev.stopPropagation(); o.click(ev); });
    if (o.dbl) on(b, 'dblclick', ev => { ev.stopPropagation(); o.dbl(ev); });
    if (o.menu) on(b, 'contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); IE.menu(o.menu(), ev.clientX, ev.clientY - 10); });
    return b;
  }
  // ---- Volume: one click = the little slider, double click = Volume Control
  let volPop = null;
  const volume = () => get('vol', 0.8);
  function applyVol() { if (Sound.setVolume && audioReady) Sound.setVolume(volume()); }
  let audioReady = false;
  on(document, 'pointerdown', function first() { if (audioReady) return; audioReady = true; if (Math.abs(volume() - 0.8) > 0.01 || volume() === 0) applyVol(); }, { capture: true });
  function setSfx(v) { Sound.on = v; document.dispatchEvent(new Event('sfxchange')); }
  function volumePopup() {
    if (volPop) { closeVol(); return; }
    const p = h(`<div class="sys-vp-t">Volume</div><div class="sys-vp-s"></div><label class="sys-vp-m"><input type="checkbox" ${Sound.on ? '' : 'checked'}> <span>Mute</span></label>`, 'sys-volpop win');
    const sl = vslider(volume(), v => { put('vol', v); audioReady = true; applyVol(); if (v >= 0.999) S('loud'); }, { end: () => { if (Sound.on) Sound.play('beep'); } });
    qs(p, '.sys-vp-s').appendChild(sl.el);
    on(qs(p, 'input'), 'change', e => { setSfx(!e.target.checked); audioReady = true; applyVol(); if (Sound.on) Sound.play('click'); });
    DesktopSurface.root().appendChild(p); volPop = p;
    const r = DesktopSurface.rect($('sfxBtn'));
    p.style.left = clamp(r.left + r.width / 2 - 34, 4, DesktopSurface.width() - 76) + 'px';
    setTimeout(() => on(document, 'pointerdown', outVol, true), 0);
  }
  function outVol(ev) { if (volPop && !volPop.contains(ev.target) && !ev.target.closest('#sfxBtn')) closeVol(); }
  function closeVol() { if (volPop) volPop.remove(); volPop = null; document.removeEventListener('pointerdown', outVol, true); }
  // ---- clock tooltip (the date, 1999)
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dateLong = () => { const t = Desk.today99(); return `${DAYS[t.date.getDay()]}, ${t.d} ${MONTHS[t.m - 1]} 1999`; };
  let tipEl = null, tipT = 0;
  function showTip(el, text, ms) {
    hideTip(); tipEl = h('', 'sys-tooltip'); tipEl.textContent = text; DesktopSurface.root().appendChild(tipEl);
    const r = DesktopSurface.rect(el), tr = DesktopSurface.rect(tipEl);
    tipEl.style.left = clamp(r.right - tr.width, 2, DesktopSurface.width() - tr.width - 2) + 'px'; tipEl.style.top = (r.top - tr.height - 4) + 'px';
    if (ms) tipT = setTimeout(hideTip, ms);
  }
  function hideTip() { clearTimeout(tipT); if (tipEl) tipEl.remove(); tipEl = null; }
  if (clockEl) {
    let hov = 0;
    on(clockEl, 'pointerenter', ev => { if (ev.pointerType !== 'mouse') return; clockEl.removeAttribute('title'); hov = setTimeout(() => showTip(clockEl, dateLong() + (get('y2kpatched', false) ? '  \u2713 Y2K patched' : ''), 6000), 450); });
    on(clockEl, 'pointerleave', () => { clearTimeout(hov); hideTip(); });
    on(clockEl, 'click', ev => { if (ev.pointerType && ev.pointerType !== 'mouse' || touch()) showTip(clockEl, dateLong(), 3000); });
  }

  // ---- Resource Meter (only after you've run it once, like the real thing)
  const resIco = lvl => `<svg viewBox="0 0 32 32"><rect x="3" y="2" width="8" height="28" fill="#fff" stroke="#000"/><rect x="12" y="2" width="8" height="28" fill="#fff" stroke="#000"/><rect x="21" y="2" width="8" height="28" fill="#fff" stroke="#000"/>${[LOAD.res, LOAD.user, LOAD.gdi].map((v, i) => { const hh = Math.round(26 * v / 100); return `<rect x="${4 + i * 9}" y="${29 - hh}" width="6" height="${hh}" fill="${v < 15 ? '#e10600' : v < 35 ? '#ffd400' : '#0a0'}"/>`; }).join('')}</svg>`;
  let resBtn = null;
  function resTray(onoff) {
    put('rsrc', onoff);
    if (onoff && !resBtn) {
      resBtn = trayIcon('sys-tray-rsrc', resIco(), 'Resource Meter', { dbl: () => open('system.rsrcmtr'), click: () => { if (touch()) open('system.rsrcmtr'); }, menu: () => [{ label: 'Details', act: () => open('system.rsrcmtr') }, { label: 'Exit', act: () => resTray(false) }] });
    } else if (!onoff && resBtn) { resBtn.remove(); resBtn = null; }
  }
  let lowResWarned = false, lowVmWarned = false;
  LOAD.onTick(L => {
    if (resBtn) { resBtn.innerHTML = mini(resIco(), 16); resBtn.title = `System resources: ${L.res}% free\nUser resources: ${L.user}% free\nGDI resources: ${L.gdi}% free`; }
    if (L.res <= 12 && !lowResWarned) { lowResWarned = true; S('lowres'); msg('Resource Meter', `Your system is dangerously low on resources.\n\nSystem resources: ${L.res}% free.\n\nClose some programs. (You have ${L.wins} things open. Even Jack only has 6 open, and one of them is Gubbinz.)`, 'warn'); }
    if (L.res > 30) lowResWarned = false;
    if (L.wins >= 11 && !lowVmWarned && !sess.get('lowvm')) { lowVmWarned = true; sess.set('lowvm', '1'); lowVirtualMemory(); }
  });
  function lowVirtualMemory() {
    S('lowvm');
    msg('System Warning', pick([
      'Your system is low on virtual memory. JackOS is increasing the size of your virtual memory paging file.\n\nDuring this process, memory requests for some applications may be denied. (Gubbinz has been denied a second biscuit.)',
      'Your system is running low on virtual memory.\n\nTo ensure that JackOS runs properly, increase the size of your virtual memory paging file. (Or ask Mom for more RAM for Christmas. 32MB is about \u00a330.)',
      'Out of memory.\n\nJackOS tried to page some memory to disk, but the disk is full of Pokemon pictures.\n\nClose some windows and try again.',
    ]), 'warn');
  }
  // ---- printer in the tray (only while printing)
  let prnBtn = null;
  function printerTray(state) {
    if (state && !prnBtn) prnBtn = trayIcon('sys-tray-prn', I.printer, 'JackJet 500: printing', { dbl: () => open('system.printq'), click: () => { if (touch()) open('system.printq'); }, menu: () => [{ label: 'Open JackJet 500', act: () => open('system.printq') }] });
    if (prnBtn) { prnBtn.classList.toggle('sys-err', state === 'err'); prnBtn.title = state === 'err' ? 'JackJet 500: there is a problem with the printer' : 'JackJet 500: 1 or more documents pending'; }
    if (!state && prnBtn) { prnBtn.remove(); prnBtn = null; }
  }
  // ---- Task Scheduler (the tray icon, and the bit that actually runs things on time)
  const DEFAULT_TASKS = [
    { n: 'Feed Gubbinz', cmd: 'grotchi', when: 'daily', t: '16:00', on: true, last: '' },
    { n: 'Maintenance-Defragment programs', cmd: 'defrag', when: 'weekly', t: '00:00', on: true, last: '' },
    { n: 'Maintenance-ScanDisk', cmd: 'scandisk', when: 'weekly', t: '00:30', on: true, last: '' },
    { n: 'Maintenance-Disk cleanup', cmd: 'cleanmgr', when: 'monthly', t: '01:00', on: true, last: '' },
    { n: 'Tidy bedroom', cmd: '', when: 'daily', t: '10:00', on: false, last: 'Never', note: 'Could not start' },
    { n: 'Millennium', cmd: 'system.millennium', when: 'once', t: '23:59', on: true, last: 'Never', date: '31/12/1999' },
  ];
  const tasks = () => get('tasks', null) || DEFAULT_TASKS.map(t => Object.assign({}, t));
  const saveTasks = l => put('tasks', l);
  const todayKey = () => { const t = Desk.today99(); return t.d + '/' + t.m; };
  function runTask(t, why) {
    t.last = new Date().toTimeString().slice(0, 5) + ' ' + todayKey() + '/1999';
    if (!t.cmd) { toast('Task Scheduler', `"${t.n}" could not start.\n\nThe program was not found. (There is no program for tidying a bedroom.)`, 6000); return; }
    if (why !== 'now') toast('Task Scheduler', `Running scheduled task "${t.n}".`, 4000);
    if (t.cmd === 'system.millennium') { millennium(); return; }
    if (!A.run(t.cmd)) toast('Task Scheduler', `"${t.n}": cannot find '${t.cmd}'.`, 5000);
    S('sched');
  }
  function millennium() {
    S('millennium');
    msg('Millennium', 'Could not run "Millennium".\n\nThe scheduled date (31/12/1999 23:59) has not happened yet.\n\nIt will never happen. This computer lives in 1999.\n\nStatus: Waiting. (Forever.)', 'warn');
  }
  function schedTick(boot) {
    if (get('schedPaused', false) || get('schedOff', false) || !get('schedUsed', false)) return;
    const list = tasks(), now = new Date(), hm = now.toTimeString().slice(0, 5), key = todayKey(); let ch = false;
    list.forEach(t => {
      if (!t.on || !t.cmd || t.cmd === 'system.millennium') return;
      const due = (t.when === 'startup' && boot) || (t.when === 'daily' && t.t === hm && t.ran !== key) || (t.when === 'weekly' && t.t === hm && now.getDay() === 0 && t.ran !== key);
      if (due) { t.ran = key; runTask(t); ch = true; }
    });
    if (ch) saveTasks(list);
  }
  setInterval(() => schedTick(false), 20000);
  let schedBtn = null;
  function schedTray() {
    if (schedBtn) schedBtn.remove(); schedBtn = null;
    if (get('schedOff', false) || !get('schedUsed', false)) return; // a bare PC's tray stays bare until Scheduled Tasks is opened
    schedBtn = trayIcon('sys-tray-sched', window.JICON ? JICON.icon('sched') : '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="22" height="20" fill="#fff" stroke="#000"/><rect x="3" y="5" width="22" height="5" fill="#e10600" stroke="#000"/><path d="M7 14h4M13 14h4M19 14h3M7 18h4M13 18h4M7 22h4" stroke="#808080" stroke-width="2"/><circle cx="23" cy="22" r="7" fill="#fff" stroke="#000"/><path d="M23 18v4h3" stroke="#000" fill="none" stroke-width="1.5"/></svg>' + (get('schedPaused', false) ? '' : ''), get('schedPaused', false) ? 'Task Scheduler (paused)' : 'Task Scheduler', {
      dbl: () => open('system.sched'), click: () => { if (touch()) open('system.sched'); },
      menu: () => [{ label: 'Open Scheduled Tasks', act: () => open('system.sched') }, { label: get('schedPaused', false) ? 'Continue Task Scheduler' : 'Pause Task Scheduler', act: () => { put('schedPaused', !get('schedPaused', false)); schedTray(); } }, '-', { label: 'Notify Me of Missed Tasks', chk: true }, '-', { label: 'Stop Using Task Scheduler', act: () => msg('Task Scheduler', 'Stop Task Scheduler? None of your scheduled tasks will run. Gubbinz will not be fed at 4pm.', 'q', [['Yes', () => { put('schedOff', true); schedTray(); }], ['No']]) }],
    });
    if (get('schedPaused', false)) schedBtn.classList.add('sys-paused');
  }
  schedTray();

  // ================================================================ Start menu, clock and speaker take-overs (capture phase, so the old handlers never see it)
  const closeStart = () => { const sm = $('startMenu'); if (sm) sm.classList.remove('open'); const sb = $('startBtn'); if (sb) sb.classList.remove('on'); };
  on(window, 'click', ev => {
    const t = ev.target;
    if (!t || !t.closest) return;
    if (t.closest('#sfxBtn')) { ev.stopPropagation(); volumePopup(); return; }
    if (t.closest('#smHelp')) { ev.stopPropagation(); closeStart(); A.secret('help'); open('system.help'); return; }
    if (t.closest('#smUpdate')) { ev.stopPropagation(); closeStart(); A.secret('update'); open('system.update'); }
  }, true);
  on(window, 'dblclick', ev => {
    const t = ev.target; if (!t || !t.closest) return;
    if (t.closest('#clock')) { ev.stopPropagation(); hideTip(); if (!A.run('timedate.cpl')) open('system.datetime'); return; }
    if (t.closest('#sfxBtn')) { ev.stopPropagation(); closeVol(); open('system.sndvol'); }
  }, true);
  // window.print (JackNet Explorer's File > Print and the Print button) goes to the JackJet 500 now
  const realPrint = window.print ? window.print.bind(window) : null;
  window.print = function () { const t = (document.title || 'JACK ATTACK! Online').replace(/ - JackNet Explorer$/, ''); Spooler.print(t + '.htm', { pages: rnd(1, 3), owner: 'Jack' }); };
  const Spooler = window.Spooler = {
    // other packs can print too: Spooler.print('homework.txt', {pages: 2, owner: 'Jack', text: 'what to print'})
    print(doc, o) { return need('system-progs.js').then(() => P._spool && P._spool.print(String(doc || 'Untitled'), o || {})).catch(() => {}); },
    real: realPrint,
  };
  // Ctrl+Shift+Esc for Task Manager, F1 for Help
  on(document, 'keydown', ev => {
    const typing = ev.target.closest && ev.target.closest('input,textarea,select');
    if (ev.ctrlKey && ev.shiftKey && ev.key === 'Escape') { ev.preventDefault(); S('csesc'); open('system.taskmgr'); }
    else if (ev.key === 'F1' && !typing) { ev.preventDefault(); open('system.help'); }
  });

  // ================================================================ taskbar right-click: Cascade / Tile / Minimize All / Task Manager
  function arrange(how) {
    const ws = visibleWins(); if (!ws.length) return toast('Taskbar', 'There are no windows to arrange. Just the desktop, looking lovely.');
    const W = DesktopSurface.width(), H = DesktopSurface.height() - 36;
    ws.forEach((w, i) => {
      w.classList.remove('maxwin');
      if (how === 'cascade') { w.style.left = (8 + i * 24) % Math.max(60, W - 300) + 'px'; w.style.top = (8 + i * 24) % Math.max(60, H - 200) + 'px'; }
      else {
        const n = ws.length, cols = how === 'tileh' ? 1 : n, rows = how === 'tileh' ? n : 1;
        const cw = Math.floor(W / cols), rh = Math.floor(H / rows);
        w.style.left = (how === 'tileh' ? 0 : i * cw) + 'px'; w.style.top = (how === 'tileh' ? i * rh : 0) + 'px';
        w.style.width = Math.max(200, cw - 2) + 'px'; w.style.height = Math.max(120, rh - 2) + 'px';
      }
      w.style.zIndex = (window.JZ = (window.JZ || 2400) + 1);
    });
    window.dispatchEvent(new Event('resize'));
  }
  function minimizeAll() { visibleWins().forEach(w => { const b = qs(w, '[data-w=min]'); if (b) b.click(); else w.style.display = 'none'; }); const br = $('browser'); if (br && !br.classList.contains('min')) { const m = $('brMin'); if (m) m.click(); } }
  const winByTitle = t => qsa(document, '.appwin').find(w => (qs(w, '.tb .t') || {}).textContent === t);
  on(window, 'contextmenu', ev => {
    const t = ev.target; if (!t || !t.closest || ev.shiftKey) return;
    const tb = t.closest('#taskbar'); if (!tb) return;
    if (t.closest('#tray') && !t.closest('#clock')) return; // tray icons have their own menus
    ev.preventDefault(); ev.stopPropagation();
    const tbtn = t.closest('#tasks .tbtn');
    if (tbtn && tbtn.id !== 'taskBrowser') {
      const title = tbtn.lastChild ? tbtn.lastChild.textContent : tbtn.textContent, w = winByTitle(title);
      if (w) return IE.menu([{ label: 'Restore', dis: w.style.display !== 'none' && !w.classList.contains('maxwin'), act: () => { if (w.style.display === 'none') tbtn.click(); w.classList.remove('maxwin'); } }, { label: 'Minimize', dis: w.style.display === 'none', act: () => { const b = qs(w, '[data-w=min]'); if (b) b.click(); } }, { label: 'Maximize', dis: !qs(w, '[data-w=max]'), act: () => { if (w.style.display === 'none') tbtn.click(); w.classList.add('maxwin'); window.dispatchEvent(new Event('resize')); } }, '-', { label: 'Close', key: 'Alt+F4', act: () => { const b = qs(w, '[data-w=close]'); if (b) b.click(); } }], ev.clientX, ev.clientY - 100);
    }
    const items = [
      { label: 'Toolbars', sub: [{ label: 'Address', dis: true }, { label: 'Links', dis: true }, { label: 'Desktop', dis: true }, { label: 'Quick Launch', chk: true }, '-', { label: 'New Toolbar...', act: () => toast('New Toolbar', 'JackOS has enough toolbars. JackNet Explorer has eleven. Most of them came free with screensavers.') }] },
      '-', { label: 'Cascade windows', act: () => arrange('cascade') }, { label: 'Tile windows horizontally', act: () => arrange('tileh') }, { label: 'Tile windows vertically', act: () => arrange('tilev') }, '-',
      { label: 'Minimize All JackOS', act: minimizeAll }, { label: 'Task Manager...', act: () => open('system.taskmgr') }, '-',
    ];
    if (t.closest('#clock')) items.unshift({ label: 'Adjust Date/Time', act: () => { if (!A.run('timedate.cpl')) open('system.datetime'); } }, '-');
    items.push({ label: 'Properties', act: taskbarProps });
    IE.menu(items, ev.clientX, ev.clientY);
  }, true);
  function taskbarProps() {
    const d = dlg('Taskbar Properties', `<div class="sys-tbprev"><div class="sys-tbp-win"><b>Sound Recorder</b><span></span></div><div class="sys-tbp-bar"><span class="sys-tbp-start">Start</span><span class="sys-tbp-task">Sound Rec...</span><span class="sys-tbp-clock">12:45</span></div></div>
      <label class="sys-ck"><input type="checkbox" checked> Always on top</label><label class="sys-ck"><input type="checkbox" data-k="auto"> Auto hide</label><label class="sys-ck"><input type="checkbox"> Show small icons in Start menu</label><label class="sys-ck"><input type="checkbox" checked data-k="clock"> Show clock</label>`, [['OK', b => { if (qs(b, '[data-k=auto]').checked) toast('Taskbar Properties', 'Auto hide is off for your own good. Last time it hid, Jack lost the Start button for a whole weekend.', 6000); if (!qs(b, '[data-k=clock]').checked) toast('Taskbar Properties', 'The clock refuses to hide. It has a job to do.'); }], ['Cancel']], { w: 330, icon: I.app });
    return d.w;
  }

  // ================================================================ the desktop: New items, marquee select, Arrange Icons
  const desktop = $('desktop'), iconsBox = qs(document, '.icons');
  const DESK = get('desk', []); // [{t:'dir'|'txt'|'lnk', n, cmd?}]
  const saveDesk = () => put('desk', DESK);
  const deskIcons = new Map(); // item -> button
  const DIR = 'C:/JACKOS/Desktop';
  function itemIcon(it) { return it.t === 'dir' ? I.folder : it.t === 'txt' ? I.txt : I.lnk; }
  function openItem(it) {
    if (it.t === 'dir') return open('explorer', 'C:\\JACKOS\\Desktop\\' + it.n);
    if (it.t === 'txt') {
      const node = A.fs.get('C:/My Documents/' + it.n);
      return open('notepad', node && node.user ? { name: it.n, node, text: node.text } : { name: it.n, text: '' });
    }
    if (it.t === 'lnk') { if (!A.run(it.cmd)) msg(it.n, `Cannot find '${it.cmd}'.\n\nThe item this shortcut refers to has been changed or moved. (Or eaten.)`, 'warn'); }
  }
  function addDeskIcon(it) {
    const b = A.desktopIcon(it.n, itemIcon(it), () => openItem(it));
    b.dataset.sysd = '1'; deskIcons.set(it, b);
    on(b, 'contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); selectOnly(b); IE.menu([{ label: 'Open', act: () => openItem(it) }, it.t === 'dir' ? { label: 'Explore', act: () => openItem(it) } : null, '-', { label: 'Send To', sub: [{ label: '3\u00bd Floppy (A:)', act: () => toast('Send To', 'Copying to A:... the disk is full. It is always full. It has DOOM on it.') }, { label: 'My Briefcase', act: () => open('briefcase') }] }, '-', { label: 'Delete', act: () => delItem(it) }, { label: 'Rename', act: () => rename(it) }, '-', { label: 'Properties', act: () => itemProps(it) }].filter(Boolean), ev.clientX, ev.clientY); });
    on(b, 'keydown', ev => { if (ev.key === 'F2') { ev.preventDefault(); rename(it); } else if (ev.key === 'Delete') delItem(it); });
    if (it.t === 'dir') A.fs.dir(DIR + '/' + it.n);
    return b;
  }
  const selectOnly = b => { qsa(document, '.dicon.sel').forEach(x => x.classList.remove('sel')); if (b) b.classList.add('sel'); };
  function uniqueName(base, ext) { let n = base + (ext || ''), i = 2; while (DESK.some(d => d.n.toLowerCase() === n.toLowerCase())) n = `${base} (${i++})${ext || ''}`; return n; }
  function newItem(t, cmd, name) {
    const it = { t, n: name || (t === 'dir' ? uniqueName('New Folder') : t === 'txt' ? uniqueName('New Text Document', '.txt') : uniqueName('Shortcut to ' + cmd)) };
    if (cmd) it.cmd = cmd;
    DESK.push(it); saveDesk(); const b = addDeskIcon(it);
    if (get('arrange', '')) setTimeout(() => arrangeIcons(get('arrange', '')), 0);
    selectOnly(b); b.focus(); if (t !== 'lnk') setTimeout(() => rename(it), 30);
    if (t === 'dir') S('newfolder');
    Sound.play('click');
  }
  function rename(it) {
    const b = deskIcons.get(it); if (!b) return;
    const span = qs(b, 'span'); if (!span || qs(span, 'input')) return;
    const old = it.n, inp = h('', 'sys-ren', 'input'); inp.type = 'text'; inp.value = old; inp.maxLength = 40; inp.setAttribute('aria-label', 'New name');
    span.textContent = ''; span.appendChild(inp); inp.focus();
    const dot = it.t === 'txt' ? old.lastIndexOf('.') : -1; inp.setSelectionRange(0, dot > 0 ? dot : old.length);
    let done = false;
    const commit = keep => {
      if (done) return; done = true;
      let v = keep ? old : inp.value.trim().replace(/[\\/:*?"<>|]/g, '');
      if (!v) v = old;
      if (v !== old && DESK.some(d => d !== it && d.n.toLowerCase() === v.toLowerCase())) { msg('Error Renaming File', `Cannot rename ${old}: A file with the name you specified already exists. Specify a different filename.`, 'warn'); v = old; }
      if (it.t === 'dir' && v !== old) { const p = A.fs.get(DIR); if (p) { const n = (p.kids || []).find(k => k.name === old); if (n) n.name = v; } }
      it.n = v; saveDesk(); span.textContent = v;
      if (/^(orks?|waaagh!*|da boyz)$/i.test(v)) { S('orkfolder'); Sound.play('waaagh'); toast('WAAAGH!', 'A folder fit for Orks. Gubbinz salutes it.'); }
      if (it.t === 'txt' && !/\.\w{1,4}$/.test(v)) toast('Rename', 'If you change a filename extension, the file may become unusable. (It\'s fine. It\'s a text file. It\'ll cope.)', 5000);
    };
    on(inp, 'keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') { ev.preventDefault(); commit(false); b.focus(); } else if (ev.key === 'Escape') { commit(true); b.focus(); } });
    on(inp, 'blur', () => commit(false));
    on(inp, 'click', ev => ev.stopPropagation()); on(inp, 'dblclick', ev => ev.stopPropagation());
  }
  function delItem(it) {
    msg('Confirm File Delete', `Are you sure you want to send '${it.n}' to the Recycle Bin?`, 'q', [['Yes', () => {
      const i = DESK.indexOf(it); if (i >= 0) DESK.splice(i, 1); saveDesk();
      const b = deskIcons.get(it); if (b) b.remove(); deskIcons.delete(it);
      if (it.t === 'dir') { const p = A.fs.get(DIR); if (p) p.kids = (p.kids || []).filter(k => k.name !== it.n); }
      Sound.play('thud');
    }], ['No']]);
  }
  function itemProps(it) {
    const type = it.t === 'dir' ? 'File Folder' : it.t === 'txt' ? 'Text Document' : 'Shortcut', t = Desk.today99();
    const extra = it.t === 'lnk' ? `<tr><td>Target:</td><td><input type="text" value="${esc(it.cmd)}" readonly></td></tr>` : '';
    dlg(it.n + ' Properties', `<div class="row sys-prtop">${mini(itemIcon(it), 32)}<b>${esc(it.n)}</b></div><hr class="sys-hr"><table class="sys-kv"><tr><td>Type:</td><td>${type}</td></tr><tr><td>Location:</td><td>C:\\JACKOS\\Desktop</td></tr><tr><td>Size:</td><td>${it.t === 'dir' ? '0 bytes' : it.t === 'txt' ? '0 bytes (it\'s new!)' : '381 bytes'}</td></tr>${extra}<tr><td>Created:</td><td>${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}/99</td></tr></table>`, [['OK'], ['Cancel']], { w: 320, icon: itemIcon(it) });
  }
  function shortcutWizard() {
    const PROGS = [['Calculator', 'calc'], ['Character Map', 'charmap'], ['Disk Cleanup', 'cleanmgr'], ['FreeCell', 'freecell'], ['JackAmp', 'jackamp'], ['JackOS Help', 'winhelp'], ['JackOS Task Manager', 'taskmgr'], ['Notepad', 'notepad'], ['Paint', 'mspaint'], ['Scheduled Tasks', 'mstask'], ['Solitaire', 'sol'], ['Sound Recorder', 'sndrec32'], ['System Monitor', 'sysmon'], ['Gubbinz', 'gubbinz'], ['Screen saver', 'saver']];
    return wizard('Create Shortcut', window.JICON && JICON.wizArt ? JICON.wizArt('folder', 'url') : `<svg viewBox="0 0 100 160" width="100" height="160"><rect width="100" height="160" fill="#008080"/><rect x="14" y="40" width="72" height="56" fill="#c0c0c0" stroke="#000"/><rect x="14" y="40" width="72" height="10" fill="#000080"/><rect x="24" y="58" width="22" height="22" fill="#fff" stroke="#000"/><rect x="8" y="88" width="34" height="34" fill="#fff" stroke="#000" stroke-width="2"/><path d="M14 116l18-18M20 98h12v12" stroke="#000" stroke-width="4" fill="none"/></svg>`, [
      { render(pg, d) { pg.innerHTML = `<p>Type the location and name of the item you want to create a shortcut to. Or, search for the item by clicking Browse.</p><label class="sys-lbl">Command line:<div class="row" style="flex-wrap:nowrap"><input type="text" class="sys-cl" style="flex:1;min-width:0" value="${esc(d.cmd || '')}"><button type="button" class="btn sys-br">Browse...</button></div></label><div class="sys-brl field" hidden></div>`;
        const inp = qs(pg, '.sys-cl'), list = qs(pg, '.sys-brl');
        on(qs(pg, '.sys-br'), 'click', () => { list.hidden = !list.hidden; });
        list.innerHTML = PROGS.map(([n, c]) => `<button type="button" class="sys-li" data-c="${c}" data-n="${esc(n)}">${mini(I.app, 16)} ${esc(n)}</button>`).join('');
        qsa(list, '.sys-li').forEach(e => on(e, 'click', () => { inp.value = e.dataset.c; d.title = e.dataset.n; list.hidden = true; }));
        setTimeout(() => inp.focus(), 50); },
        next(d, pg) { const v = qs(pg, '.sys-cl').value.trim(); if (!v) { msg('Create Shortcut', 'Please type a command line. (Try "calc", "sol" or "gubbinz".)', 'warn'); return false; } d.cmd = v; if (!d.title || !PROGS.some(p => p[1] === v && p[0] === d.title)) d.title = 'Shortcut to ' + v.replace(/\.exe$/i, ''); } },
      { title: 'Select a Title for the Program', last: true, render(pg, d) { pg.innerHTML = `<label class="sys-lbl">Select a name for the shortcut:<input type="text" class="sys-ti" style="width:100%" maxlength="40" value="${esc(d.title)}"></label><p class="small">Click Finish to create the shortcut on the desktop.</p>`; }, next(d, pg) { d.title = qs(pg, '.sys-ti').value.trim() || d.title; } },
    ], { w: 460, icon: I.lnk, finish: d => newItem('lnk', d.cmd, uniqueName(d.title.replace(/[\\/:*?"<>|]/g, ''))) });
  }
  // ---- Arrange Icons
  const SYS_ORDER = ['iconMyComp', 'iconMyDocs', 'iconIe', 'iconBin', 'iconNetHood', 'iconOutlook', 'iconOnline', 'iconBriefcase'];
  function arrangeIcons(by) {
    if (!iconsBox) return;
    const kids = [...iconsBox.children].filter(e => e.classList.contains('dicon'));
    const label = e => (qs(e, 'span') || e).textContent.trim().toLowerCase();
    const kind = e => { const i = SYS_ORDER.indexOf(e.id); if (i >= 0) return i; if (e.dataset.sysd) { const it = [...deskIcons].find(([, b]) => b === e); return it ? (it[0].t === 'dir' ? 20 : it[0].t === 'lnk' ? 21 : 22) : 23; } return /\.(txt|doc)$/.test(label(e)) ? 22 : 10; };
    const size = e => label(e).length * 37 % 101;
    const cmp = by === 'type' ? (a, b) => kind(a) - kind(b) || label(a).localeCompare(label(b)) : by === 'size' ? (a, b) => size(a) - size(b) : by === 'date' ? (a, b) => (b.dataset.sysd ? 1 : 0) - (a.dataset.sysd ? 1 : 0) || kind(a) - kind(b) : (a, b) => (SYS_ORDER.includes(a.id) ? 0 : 1) - (SYS_ORDER.includes(b.id) ? 0 : 1) || (SYS_ORDER.includes(a.id) ? SYS_ORDER.indexOf(a.id) - SYS_ORDER.indexOf(b.id) : label(a).localeCompare(label(b)));
    kids.sort(cmp).forEach(e => iconsBox.appendChild(e));
  }
  // ---- marquee (rubber-band) selection
  if (desktop) on(desktop, 'pointerdown', ev => {
    if (ev.button !== 0 || ev.pointerType !== 'mouse' || (ev.target !== desktop && ev.target !== iconsBox)) return;
    selectOnly(null);
    const start = DesktopSurface.point(ev.clientX, ev.clientY), sx = start.x, sy = start.y; let box = null, n = 0;
    const move = e => {
      const p = DesktopSurface.point(e.clientX, e.clientY), x1 = Math.min(sx, p.x), y1 = Math.min(sy, p.y), x2 = Math.max(sx, p.x), y2 = Math.max(sy, p.y);
      if (!box) { if (Math.abs(p.x - sx) + Math.abs(p.y - sy) < 4) return; box = h('', 'sys-marq'); DesktopSurface.root().appendChild(box); }
      Object.assign(box.style, { left: x1 + 'px', top: y1 + 'px', width: (x2 - x1) + 'px', height: (y2 - y1) + 'px' });
      n = 0; qsa(document, '.icons .dicon').forEach(d => { const r = DesktopSurface.rect(d); const hit = r.right > x1 && r.left < x2 && r.bottom > y1 && r.top < y2; d.classList.toggle('sel', hit); if (hit) n++; });
    };
    const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); if (box) box.remove(); if (n >= 5) S('marquee'); };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  });
  // ---- the desktop right-click menu (replaces the old one)
  on(window, 'contextmenu', ev => {
    const t = ev.target; if (ev.shiftKey || !t || (t !== desktop && t !== iconsBox && !t.closest('.sys-chan-bg'))) return;
    ev.preventDefault(); ev.stopPropagation();
    const ar = get('arrange', '');
    IE.menu([
      { label: 'Active Desktop', sub: () => [{ label: 'View As Web Page', chk: get('web', false), act: () => webView(!get('web', false)) }, { label: 'Show Channel Bar', chk: !!chanBar, act: () => channelBar(!chanBar) }, '-', { label: 'Customize my Desktop...', act: () => { if (!A.run('desk.cpl')) open('system.themes'); } }, { label: 'Update Now', act: updateNow }] },
      '-',
      { label: 'Arrange Icons', sub: () => [['name', 'by Name'], ['type', 'by Type'], ['size', 'by Size'], ['date', 'by Date']].map(([k, l]) => ({ label: l, act: () => { put('arrange', ''); arrangeIcons(k); } })).concat(['-', { label: 'Auto Arrange', chk: !!ar, act: () => { put('arrange', ar ? '' : 'name'); if (!ar) arrangeIcons('name'); } }]) },
      { label: 'Line Up Icons', act: () => { arrangeIcons(get('arrange', '') || 'none'); toast('Line Up Icons', 'All icons are now in a perfectly straight line. They always were. The desktop is very tidy. Unlike the bedroom.'); } },
      '-', { label: 'Refresh', act: refreshDesk },
      '-', { label: 'Paste', dis: true }, { label: 'Paste Shortcut', dis: true }, { label: 'Undo Delete', dis: true },
      '-', { label: 'New', sub: () => [{ label: 'Folder', icon: mini(I.folder, 16), act: () => newItem('dir') }, { label: 'Shortcut', icon: mini(I.lnk, 16), act: shortcutWizard }, '-', { label: 'Text Document', icon: mini(I.txt, 16), act: () => newItem('txt') }, { label: 'Bitmap Image', act: () => open('mspaint') }, { label: 'Wave Sound', act: () => open('system.sndrec') }, { label: 'Briefcase', act: () => open('briefcase') }] },
      '-', { label: 'Properties', act: () => { if (!A.run('desk.cpl')) open('system.themes'); } },
    ], ev.clientX, ev.clientY);
  }, true);
  function refreshDesk() {
    if (!iconsBox) return;
    iconsBox.style.visibility = 'hidden'; const ch = $('sysChan'); if (ch) ch.style.visibility = 'hidden';
    setTimeout(() => { iconsBox.style.visibility = ''; if (ch) ch.style.visibility = ''; if (get('arrange', '')) arrangeIcons(get('arrange', '')); }, 160);
  }

  // ================================================================ Active Desktop: the Channel Bar and a web-view ticker
  const CHANNELS = [
    { id: 'guide', n: 'JackNet Channel Guide', c: ['#000080', '#3a6ed8'], g: '\u2605' },
    { id: 'onn', n: 'Desktop News Network', c: ['#1f5a12', '#8ad02a'], g: 'DNN' },
    { id: 'weather', n: 'WeatherWatch 2000', c: ['#0060c0', '#7ec8ff'], g: '\u2600' },
    { id: 'cheats', n: 'The Cheat Channel', c: ['#600060', '#e040e0'], g: 'CHT' },
    { id: 'telly', n: 'Telly Guide 99', c: ['#202020', '#808080'], g: 'TV' },
    { id: 'mom', n: 'Mom\'s Kitchen', c: ['#a03a1a', '#ffa64d'], g: 'MK' },
    { id: 'grotfm', n: 'Jack FM', c: ['#806000', '#ffd400'], g: 'FM' },
    { id: 'galaxy', n: 'Galaxy Far Away News', c: ['#000000', '#3040a0'], g: '\u2726' },
    { id: 'dave', n: 'Dave TV', c: ['#a00000', '#ff5050'], g: 'D' },
  ];
  let chanBar = null;
  function channelBar(show) {
    put('chanbar', !!show);
    if (!show) { if (chanBar) chanBar.remove(); chanBar = null; return; }
    if (chanBar || !desktop) return;
    chanBar = h(`<div class="sys-chan-grip" title="Drag to move"><span>Channel Bar</span><button type="button" class="sys-chan-x" aria-label="Close Channel Bar">x</button></div><div class="sys-chan-top">${mini(I.channel, 16)}<b>Channels</b></div>${CHANNELS.map(c => `<button type="button" class="sys-chan-b" data-c="${c.id}" style="--c1:${c.c[0]};--c2:${c.c[1]}"><i>${esc(c.g)}</i><span>${esc(c.n)}</span></button>`).join('')}`, 'sys-chan');
    chanBar.id = 'sysChan';
    const pos = get('chanpos', null); if (pos) { chanBar.style.right = 'auto'; chanBar.style.left = pos[0] + 'px'; chanBar.style.top = pos[1] + 'px'; }
    desktop.appendChild(chanBar);
    qsa(chanBar, '.sys-chan-b').forEach(b => on(b, 'click', () => { Sound.play('click'); open('system.channels', b.dataset.c); }));
    on(qs(chanBar, '.sys-chan-x'), 'click', ev => { ev.stopPropagation(); msg('Channel Bar', 'Do you want the Channel Bar to appear on your desktop the next time you start JackOS?', 'q', [['Yes', () => { chanBar.remove(); chanBar = null; }], ['No', () => channelBar(false)], ['Cancel']]); });
    const grip = qs(chanBar, '.sys-chan-grip'); let drag = null;
    on(grip, 'pointerdown', ev => { if (ev.target.closest('button')) return; const r = DesktopSurface.rect(chanBar), dr = DesktopSurface.rect(desktop), p = DesktopSurface.point(ev.clientX, ev.clientY); drag = { dx: p.x - r.left + dr.left, dy: p.y - r.top + dr.top }; grip.setPointerCapture(ev.pointerId); });
    on(grip, 'pointermove', ev => { if (!drag) return; const p = DesktopSurface.point(ev.clientX, ev.clientY), x = clamp(p.x - drag.dx, 0, DesktopSurface.width() - 120), y = clamp(p.y - drag.dy, 0, DesktopSurface.height() - 140); chanBar.style.right = 'auto'; chanBar.style.left = x + 'px'; chanBar.style.top = y + 'px'; });
    on(grip, 'pointerup', () => { if (drag) put('chanpos', [parseInt(chanBar.style.left, 10), parseInt(chanBar.style.top, 10)]); drag = null; });
    on(grip, 'pointercancel', () => { drag = null; });
  }
  // "View As Web Page": an Active Desktop component with the Desktop News Network ticker (headlines are shared by everyone)
  let webBox = null, onnUnwatch = null;
  const ONN_KEY = 'system.onn.news';
  const ONN_STOCK = ['KID PAINTS MICRO MACHINE RED, CLAIMS IT GOES FASTER', 'LOCAL BOY CATCHES 14 POKEMON, "STILL NEED MEW"', 'ROBOT WARS: HOUSE ROBOT WINS AGAIN, NOBODY SURPRISED', 'MODEM CONNECTS AT FULL 56K FOR FIRST TIME EVER, NOBODY BELIEVES IT', 'MILLENNIUM BUG "PROBABLY FINE" SAY EXPERTS WITH TORCHES', 'DAVE BEATS JACK AT GOLDENEYE, JACK DEMANDS RE-MATCH', 'CUBE SOLVED IN UNDER 3 MINUTES, CROWD (MOM) GOES WILD', 'PRINTER OUT OF CYAN AGAIN'];
  let onnLines = ONN_STOCK.slice();
  function webView(show) {
    put('web', !!show);
    if (!show) { if (webBox) webBox.remove(); webBox = null; if (onnUnwatch) onnUnwatch(); onnUnwatch = null; document.body.classList.remove('sys-web'); return; }
    if (webBox || !desktop) return;
    S('activedesk');
    document.body.classList.add('sys-web');
    webBox = h(`<div class="sys-ad-tb"><span>Desktop News Network - Active Desktop Item</span><button type="button" aria-label="Close" class="sys-ad-x">x</button></div><div class="sys-ad-body"><div class="sys-ad-logo">ONN</div><div class="sys-ad-tick"><span></span></div></div>`, 'sys-ad');
    desktop.appendChild(webBox);
    on(qs(webBox, '.sys-ad-x'), 'click', () => webView(false));
    on(qs(webBox, '.sys-ad-body'), 'click', () => open('system.channels', 'onn'));
    const draw = () => { if (!webBox) return; const s = qs(webBox, '.sys-ad-tick span'); s.textContent = onnLines.slice(-8).reverse().join('   \u2605   '); s.style.animationDuration = Math.max(18, s.textContent.length / 7) + 's'; };
    if (window.Net && Net.kv) {
      Net.kv.get([ONN_KEY]).then(v => { const l = v && v[ONN_KEY]; if (Array.isArray(l) && l.length) onnLines = ONN_STOCK.concat(l.map(e => String(e.text || '').toUpperCase().slice(0, 90))); draw(); });
      onnUnwatch = Net.kv.watch(ONN_KEY, ev => { if (ev.type === 'push' && ev.e) { onnLines.push(String(ev.e.text || '').toUpperCase().slice(0, 90)); draw(); } });
    }
    draw();
  }
  function updateNow() {
    toast('Active Desktop', 'Updating channels and desktop items... (49,333 bps. Please wait. Make a sandwich.)', 4000);
    setTimeout(() => { if (webBox) qs(webBox, '.sys-ad-tick span').style.animationName = 'none'; requestAnimationFrame(() => { if (webBox) qs(webBox, '.sys-ad-tick span').style.animationName = ''; }); toast('Active Desktop', 'Synchronization complete. Nothing has changed. It never does.', 4000); }, 4500);
  }

  // ================================================================ random 1999 happenings
  const HARDWARE = [
    ['Bug Detector (Plug and Play)', 'ok'], ['Plug and Play Monitor', 'same'], ['Unknown Device', 'crumb'], ['Gamepad (Dave\'s)', 'ok'], ['JackJet 500', 'forgot'],
    ['Hyperdrive Motivator', 'bad'], ['PCI Toaster', 'mom'], ['Universal Serial Bus Gubbinz', 'bad'], ['Joystick (it was always there)', 'ok'], ['3dfx Voodoo2 3D Accelerator', 'ok'],
  ];
  function newHardware(force) {
    const [name, kind] = pick(HARDWARE);
    const balloon = (title, text, ms) => { const b = toast(title, text, ms); if (b) on(b, 'click', () => { S('hardware'); open('system.devmgr'); }); };
    Sound.play('join');
    balloon('New Hardware Found', name, 4200);
    setTimeout(() => balloon('New Hardware Found', 'JackOS is installing the software for your new hardware...', 4200), 4600);
    setTimeout(() => {
      const text = { ok: `${name} is installed and ready to use.`, same: 'It was the same monitor. JackOS installed it again anyway. Just to be sure.', crumb: 'The Unknown Device was a crisp crumb in the USB port. It has been installed as "Crumb (Salt & Vinegar)".', forgot: 'The printer forgot it was already installed. It is installed again now. Twice.', bad: `JackOS could not find the driver for ${name}. It has been put in Device Manager with a yellow "!" on it.`, mom: 'The PCI Toaster has been found and disabled again (by Mom).' }[kind];
      balloon(kind === 'bad' ? 'Hardware Installation' : 'Hardware Installation', text, 6500);
    }, 9600);
    if (force) S('hardware');
  }
  setInterval(() => { if (document.hidden || $('boot')) return; const tk = (get('tick', 0) | 0) + 1; put('tick', tk); if (performance.now() < 240000) return; /* not while they're still saying hello */ if (Math.random() < 1 / 14) newHardware(); else if (Math.random() < 1 / 120) lowVirtualMemory(); }, 60000);

  // ================================================================ boot: Welcome on the first visit, Tip of the Day after that
  function afterLogon(fn, tries) {
    tries = tries || 0;
    if (document.querySelector('.logon') || document.querySelector('.dialwin') || $('boot')) { if (tries < 120) setTimeout(() => afterLogon(fn, tries + 1), 1000); return; }
    fn();
  }
  // a real boot sequence is on screen right now (not a ?noboot load, not a same-session reload)
  const realBoot = !!$('boot');
  const quietOpen = id => { if (document.querySelector('.appwin') || document.querySelector('.float:not(.dialwin)')) return; try { open(id, '__auto'); } catch (e) { console.warn('[system]', e); } };
  (window.BootDone || Promise.resolve()).then(() => {
    if (get('chanbar', DesktopSurface.width() >= 1180)) channelBar(true);
    if (get('web', false)) webView(true);
    if (get('rsrc', false)) resTray(true);
    if (get('arrange', '')) { setTimeout(() => arrangeIcons(get('arrange', '')), 600); setTimeout(() => arrangeIcons(get('arrange', '')), 4000); }
    const first = !sess.get('booted'); sess.set('booted', '1');
    if (first) setTimeout(() => schedTick(true), 5000);
    if (!realBoot || /[?&]nowelcome/.test(location.search)) return;
    const seenWelcome = get('welcomed', false);
    if (!seenWelcome || get('welcomeEvery', false)) setTimeout(() => afterLogon(() => { if (DesktopSurface.width() <= 600) { put('welcomed', true); toast('Welcome to JackOS 98', 'Take the tour any time: Start > Programs > Accessories > System Tools > Welcome To JackOS.', 7000); } else quietOpen('system.welcome'); }), 2500);
    else if (get('tips', true) && Math.random() < 0.6) setTimeout(() => afterLogon(() => quietOpen('system.tips')), 12000);
    // warm the cache for the big one once things are quiet
    setTimeout(() => need('system-progs.js').catch(() => {}), 15000);
  });
  // a saved Desktop Theme is put back on at start up
  const theme = get('theme', null);
  if (theme && theme.name && theme.name !== 'JackOS Standard') need('system-themes.js').then(() => window.SysThemes && SysThemes.restore(theme)).catch(e => console.warn('[system] theme', e));

  // ================================================================ programs (lazy) + Start menu + Run
  reg('system.welcome', 'system-welcome.js', ['welcome', 'welcome.exe', 'discover', 'tour']);
  reg('system.tips', 'system-welcome.js', ['tip of the day', 'tipofday']);
  reg('system.regwiz', 'system-welcome.js', ['regwiz', 'register', 'registration wizard']);
  reg('system.icw', 'system-welcome.js', ['icwconn1', 'internet connection wizard', 'connection wizard']);
  reg('system.channels', 'system-welcome.js', ['channels', 'channel guide', 'channel bar', 'onn']);
  reg('system.help', 'system-help.js', ['winhelp', 'winhlp32', 'hh', 'jackos help', 'help topics', 'helpdesk']);
  reg('system.taskmgr', 'system-progs.js', ['taskmgr', 'taskman', 'task manager', 'tm']);
  reg('system.devmgr', 'system-progs.js', ['devmgr', 'devmgmt', 'device manager', 'hardware']);
  reg('system.sysmon', 'system-progs.js', ['sysmon', 'system monitor', 'perfmon']);
  reg('system.rsrcmtr', 'system-progs.js', ['rsrcmtr', 'resource meter', 'resources']);
  reg('system.sched', 'system-progs.js', ['mstask', 'scheduled tasks', 'task scheduler', 'at', 'schedule']);
  reg('system.backup', 'system-progs.js', ['msbackup', 'backup', 'back up']);
  reg('system.cleanmgr', 'system-progs.js', ['cleanmgr', 'disk cleanup', 'cleanup']);
  reg('system.tuneup', 'system-progs.js', ['tuneup', 'maintenance wizard', 'maintenance']);
  reg('system.accwiz', 'system-progs.js', ['accwiz', 'accessibility wizard']);
  reg('system.sndrec', 'system-progs.js', ['sndrec32', 'sndrec', 'soundrec', 'sound recorder', 'record']);
  reg('system.sndvol', 'system-progs.js', ['sndvol32', 'sndvol', 'volume', 'volume control', 'mixer']);
  reg('system.printers', 'system-progs.js', ['printers', 'control printers', 'print manager']);
  reg('system.printq', 'system-progs.js', ['jackjet', 'jackjet 500', 'print queue', 'spooler']);
  reg('system.update', 'system-progs.js', ['wupdmgr', 'update', 'windows update', 'jackos update', 'updates']);
  reg('system.y2kpatch', 'system-progs.js', ['y2kpatch', 'y2k patch', 'y2kfix']);
  reg('system.datetime', 'system-progs.js', ['datetime']);
  reg('system.themes', 'system-themes.js', ['themes', 'desktop themes', 'plus', 'themes.exe']);
  // the existing Sound Recorder file and Start-menu shortcut (C:\Program Files\Accessories\SNDREC32.EXE) look for 'sndrec'
  A.register('sndrec', { cmd: [], open: arg => open('system.sndrec', arg) });
  A.cmd(['newfolder', 'md desktop'], () => newItem('dir'));
  A.cmd(['arrange icons'], () => arrangeIcons('name'));
  A.cmd(['minimize all', 'minimise all'], minimizeAll);
  A.cmd(['cascade'], () => arrange('cascade'));
  A.cmd(['tile'], () => arrange('tilev'));
  A.cmd(['newhardware', 'new hardware'], () => newHardware(true));
  A.cmd(['mem', 'virtual memory', 'swapfile'], () => lowVirtualMemory());
  A.cmd(['active desktop'], () => webView(!get('web', false)));
  A.cmd(['printtest', 'print test page', 'test page'], () => Spooler.print('Test Page', { pages: 1, owner: 'JackOS', test: true }));
  A.cmd(['pc load letter', 'mc feed a4'], () => { S('feeda4'); msg('JackJet 500', 'MC FEED A4\n\nTranslation (from the 112-page manual): "Manual Cassette: feed one sheet of A4." Nobody has ever understood this message without the manual. The manual is in the loft.', 'info'); });
  A.cmd(['tasks'], () => open('system.sched'));
  A.cmd(['f1'], () => open('system.help'));
  A.cmd(['hyperdrive', 'hyperdrive motivator'], () => open('system.devmgr', 'hyperdrive'));
  A.cmd(['millennium.job'], millennium);

  const ST = ['Accessories', 'System Tools'];
  [[[...ST, 'Welcome To JackOS'], 'system.welcome', I.welcome], [[...ST, 'JackOS Task Manager'], 'system.taskmgr', I.taskmgr], [[...ST, 'Device Manager'], 'system.devmgr', I.devmgr],
    [[...ST, 'System Monitor'], 'system.sysmon', I.sysmon], [[...ST, 'Resource Meter'], 'system.rsrcmtr', I.rsrc], [[...ST, 'Scheduled Tasks'], 'system.sched', I.sched],
    [[...ST, 'Backup'], 'system.backup', I.backup], [[...ST, 'Disk Cleanup'], 'system.cleanmgr', I.clean], [[...ST, 'Maintenance Wizard'], 'system.tuneup', I.tuneup],
    [[...ST, 'JackOS Update'], 'system.update', I.update], [[...ST, 'Y2K Compliance Patch'], 'system.y2kpatch', I.y2k],
    [['Accessories', 'Accessibility', 'Accessibility Wizard'], 'system.accwiz', I.access],
    [['Accessories', 'Entertainment', 'Sound Recorder'], 'system.sndrec', I.mic], [['Accessories', 'Entertainment', 'Volume Control'], 'system.sndvol', I.vol],
    [['Accessories', 'Desktop Themes'], 'system.themes', I.themes], [['Accessories', 'Printers'], 'system.printers', I.printers],
    [['Accessories', 'Communications', 'Internet Connection Wizard'], 'system.icw', I.icw], [['Accessories', 'Communications', 'Channel Guide'], 'system.channels', I.channel],
    [['Accessories', 'JackOS Help'], 'system.help', I.help], [['Accessories', 'Tip of the Day'], 'system.tips', I.tip], [['Accessories', 'Registration Wizard'], 'system.regwiz', I.reg],
  ].forEach(([p, id, ic]) => A.addProgram(p, id, ic));

  // ================================================================ files on C:
  const exe = (name, app, size, date) => ({ name, type: 'exe', app, size, date: date || '11/05/98' });
  [['C:/JACKOS', exe('TASKMGR.EXE', 'system.taskmgr', '88 KB', '14/02/99')], ['C:/JACKOS', exe('SYSMON.EXE', 'system.sysmon', '76 KB')], ['C:/JACKOS', exe('RSRCMTR.EXE', 'system.rsrcmtr', '12 KB')],
    ['C:/JACKOS', exe('CLEANMGR.EXE', 'system.cleanmgr', '60 KB')], ['C:/JACKOS', exe('TUNEUP.EXE', 'system.tuneup', '180 KB')], ['C:/JACKOS', exe('ACCWIZ.EXE', 'system.accwiz', '200 KB')],
    ['C:/JACKOS', exe('SNDVOL32.EXE', 'system.sndvol', '64 KB')], ['C:/JACKOS', exe('WELCOME.EXE', 'system.welcome', '210 KB')], ['C:/JACKOS', exe('WINHLP32.EXE', 'system.help', '300 KB')],
    ['C:/JACKOS', exe('WUPDMGR.EXE', 'system.update', '41 KB', '01/09/99')], ['C:/JACKOS', exe('MSTASK.EXE', 'system.sched', '96 KB')], ['C:/JACKOS', exe('REGWIZ.EXE', 'system.regwiz', '120 KB')],
    ['C:/JACKOS/UPDATES', exe('Y2KPATCH.EXE', 'system.y2kpatch', '1,999 KB', '01/09/99')], ['C:/Program Files/Accessories/Backup', exe('MSBACKUP.EXE', 'system.backup', '900 KB')],
    ['C:/Program Files/Plus! for JackOS', exe('THEMES.EXE', 'system.themes', '1.9 MB', '25/12/98')],
  ].forEach(([p, n]) => A.fs.add(p, n));
  A.fs.add('C:/JACKOS/UPDATES', { name: 'README.TXT', type: 'txt', size: '1 KB', date: '01/09/99', text: 'JACKOS UPDATE\n=============\n\nUpdates downloaded by JackOS Update live here.\nIt took 4 hours to download the Y2K patch at 28.8K.\nMom picked up the phone 3 times. We started again 3 times.\n\nRun Y2KPATCH.EXE to make this computer ready for the year 2000.\n(Warning: may cause 1900.)\n' });
  A.fs.add('C:/JACKOS/Tasks', { name: 'Millennium.job', type: 'txt', size: '1 KB', date: '31/12/98', text: 'SCHEDULED TASK: Millennium\n\nRun: PARTY.EXE\nSchedule: Once, at 23:59 on 31/12/1999\nNext run time: never (see Y2K.TXT)\nStatus: Waiting... and waiting...\n' });
  A.fs.add('C:/JACKOS/Tasks', { name: 'Feed Gubbinz.job', type: 'txt', size: '1 KB', date: '14/02/99', text: 'SCHEDULED TASK: Feed Gubbinz\n\nRun: JACKOTCHI.EXE\nSchedule: Every day at 16:00\nNotes: one biscuit. ONE. He will say he hasn\'t been fed. He has.\n' });
  A.fs.add('C:/JACKOS/Help', { name: 'JACKOS.CHM', type: 'exe', app: 'system.help', size: '1.2 MB', date: '11/05/98' });
  A.fs.add('C:/JACKOS/Help', { name: 'HELP_WHERE_IS_IT.TXT', type: 'txt', size: '1 KB', date: '19/06/99', text: 'Jack\'s note to self:\n\nThe REAL help is JackOS Help. Press F1. Or Start > Help.\nThe Index tab is the best one. Type a word and it finds stuff.\nThere is a topic in there that is not in the Contents.\nYou have to SEARCH for it. Hint: the magic word from the old adventure games.\n' });
  A.fs.add('C:/JACKOS/SYSTEM', { name: 'JACKJET.DRV', type: 'txt', size: '212 KB', date: '13/03/99', text: 'JackJet 500 Printer Driver v1.0\n\n(binary gibberish)\n\nMC FEED A4\nERR 50.2\nTRAY 1 HUNGRY\nLOAD A4 PLAIN PRESS GO\n\n(more gibberish)\n\nIf you can read this, the driver is upside down.\n' });
  A.fs.add('C:/JACKOS/Desktop', { name: 'desktop.ini', type: 'txt', size: '1 KB', date: '11/05/98', hidden: true, text: '[.ShellClassInfo]\nIconArea_Text=0x00FFFFFF\nChannelBar=Yes\nGubbinz=Somewhere on here\n' });
  A.fs.add('C:/My Documents', { name: 'Backup plan.txt', type: 'txt', size: '1 KB', date: '22/08/99', text: 'BACKUP PLAN\n\nBackup says I need 1,440 floppy disks to back up everything.\nI have 3 floppy disks.\nOne of them is Dave\'s and has DOOM on it.\n\nNew plan: don\'t break anything.\n' });

  // ================================================================ secrets
  [['welcome', 'The grand tour', 'Discover everything JackOS 98 has to offer. All of it. To the end.'],
    ['register', 'Officially registered', 'JackOS wants to know who you are'],
    ['helpbook', 'Bookworm', 'Read lots of the manual'],
    ['xyzzy', 'Nothing happens', 'Search the Help for a magic word'],
    ['helpweb', 'Online support', 'Ask the Help for help from the Web'],
    ['loud', 'Maximum volume', 'Turn it all the way up'],
    ['mutegub', 'Peace and quiet', 'One of the volume controls is not like the others'],
    ['lowres', 'Out of resources', 'Open far too much at once and watch the meter'],
    ['lowvm', 'Virtually out of memory', 'Run JackOS out of virtual memory'],
    ['printed', 'Hot off the press', 'Print something on the JackJet'],
    ['jam', 'Jam session', 'Pull out a paper jam with your own hands'],
    ['nopaper', 'Paperless office', 'Print until there is nothing left to print on'],
    ['feeda4', 'MC FEED A4', 'Ask what the printer\'s weirdest message means'],
    ['gubproc', 'He will not die', 'Try to end a certain process in Task Manager. Repeatedly.'],
    ['cpu100', 'Flat out', 'See the CPU hit 100% in Task Manager'],
    ['kernel', 'Do not end that', 'End the most important process of all'],
    ['csesc', 'Power user', 'A three-key shortcut for nerds'],
    ['irq', 'IRQ wrangler', 'Fix a hardware conflict by hand'],
    ['hyperdrive', 'It\'s not working!', 'Try to fix the strangest device in Device Manager'],
    ['hardware', 'Plug and Pray', 'Investigate some new hardware'],
    ['sched', 'Right on time', 'Make a scheduled task run'],
    ['millennium', 'Forever 1999', 'Try to run the Millennium early'],
    ['floppies', '1,440 floppies', 'Get to disk 3 of a very big backup'],
    ['cleanup', 'Spring clean', 'Finish a Disk Cleanup (it may take a while at the end)'],
    ['maint', 'Well maintained', 'Let the Maintenance Wizard do its thing'],
    ['accwiz', 'BIG TEXT', 'Make everything easier to read'],
    ['backwards', 'Backmasking', 'Play a recording the wrong way round'],
    ['theme', 'Interior decorator', 'Change the whole desktop theme'],
    ['allthemes', 'Theme park', 'Try every single desktop theme'],
    ['galaxy', 'A long time ago...', 'Visit a galaxy far away (on your desktop)'],
    ['newfolder', 'New Folder (2)', 'Make something new on the desktop'],
    ['orkfolder', 'Ork HQ', 'Name a desktop folder after Jack\'s favourite army'],
    ['marquee', 'Lasso', 'Draw a box around lots of desktop icons'],
    ['subscribe', 'Subscriber', 'Subscribe to a channel'],
    ['onn', 'Breaking news', 'Send a headline to the Desktop News Network'],
    ['activedesk', 'Active Desktop', 'View your desktop as a web page'],
    ['update', 'Fully patched', 'Download every critical update at 28.8K'],
    ['y2kpatch', 'Year 1900', 'Install the Y2K Compliance Patch and watch the clock'],
    ['tour', 'Tourist', 'Start the Discover JackOS 98 tour'],
    ['tips', 'Did you know...?', 'Read 15 Tips of the Day'],
  ].forEach(([id, n, hint]) => A.defineSecret('system.' + id, n, hint));

  // ================================================================ hand the kit to the lazy files
  window.SysPack = { P, I, K, get, put, sess, qs, qsa, on, h, esc, clamp, rnd, pick, touch, S, toast, msg, fmt, dbl, mini, bar, crawl, tabs, dlg, wizard, vslider, LOAD, need, open, tasks, saveTasks, runTask, schedTray, millennium, resTray, printerTray, channelBar, webView, CHANNELS, ONN_KEY, newHardware, lowVirtualMemory, arrangeIcons, minimizeAll, visibleWins, winByTitle, DAYS, MONTHS, dateLong, closeStart, desk: { newItem, shortcutWizard }, Spooler, setSfx, volume, applyVol: v => { put('vol', v); audioReady = true; applyVol(); } };

  // put back the user's own desktop items
  DESK.forEach(addDeskIcon);
})();

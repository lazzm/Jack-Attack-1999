/* apps-programs: the JackOS 98 programs pack. Calculator, Paint, JackAmp, Disk Defragmenter, ScanDisk, Registry Editor,
 * Control Panel (and all its applets), Phone Dialer, System Information, Clipboard Viewer and Character Map.
 * Everything is original. Everything is 1999. Nothing here talks to the network. */
(function () {
  'use strict';
  if (!window.Apps) return;
  const A = window.Apps, esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const h = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const qs = (el, s) => el.querySelector(s), qsa = (el, s) => [...el.querySelectorAll(s)];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const touchy = () => matchMedia('(hover:none)').matches;
  const nick = () => (window.Net && Net.me && Net.me.nick) || 'Jack';
  const on = (el, ev, fn) => el.addEventListener(ev, fn);
  const tap = (el, fn) => el && el.addEventListener('click', fn);
  // "double-click" that is a single tap on phones (like the desktop icons)
  const dbl = (el, fn) => { let last = 0; on(el, 'click', ev => { const now = Date.now(); if (now - last < 450 || touchy()) { last = 0; fn(ev); } else last = now; }); };
  const msg = (t, x, i, b) => Desk.msgbox(t, x, i || 'info', b);
  const toast = (t, x, ms) => Desk.toast(t, x, ms);
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const fmtN = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sizeWin = (w, px) => { w.el.style.width = Math.min(px, innerWidth - 8) + 'px'; const r = w.el.getBoundingClientRect(); if (r.right > innerWidth - 4) w.el.style.left = Math.max(4, innerWidth - r.width - 4) + 'px'; };
  const today = () => (Desk.today99 ? Desk.today99() : { m: 1, d: 1, md: 101, date: new Date(1999, 0, 1) });
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const d99 = () => { const t = today(); return String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99'; };

  // ================================================================ secrets
  const SEC = [
    ['calc1999', 'Party like it\'s... this year', 'Ask the Calculator about the best year ever'],
    ['calcfloat', 'Floating point', 'Add a tenth to two tenths. Simple, right?'],
    ['calcdiv0', 'Divide and conquer', 'Do the one sum your teacher said you can\'t'],
    ['calcfdiv', 'Pentium problems', 'An infamous division from 1994'],
    ['calchello', 'Upside-down hello', 'Some numbers look like words if you turn the calculator over'],
    ['calcy2k', 'Millennium maths', 'What comes after 1999?'],
    ['paintall', 'Renaissance kid', 'Use every single tool in Paint'],
    ['paintwall', 'Gallery opening', 'Hang your own art on the desktop'],
    ['paintsquig', 'Blobbit stampede', 'Stamp a whole herd of something in Paint'],
    ['jampall', 'Mixtape master', 'Listen to everything on the JackAmp playlist'],
    ['jampeq', 'Bass to the max', 'Push every EQ slider as far as it goes'],
    ['jamphidden', 'Hidden track', 'Keep poking the JackAmp logo'],
    ['defrag', 'Tidy disk, tidy mind', 'Sit through a whole defrag. All of it.'],
    ['defragcd', 'Nice try', 'Try to defragment something that cannot be defragmented'],
    ['scandisk', 'Thorough', 'Do a thorough check of the hard disk'],
    ['chk', 'Lost and found', 'Open what ScanDisk saved from a lost cluster'],
    ['regsecret', 'Do not edit', 'There is a registry key you were told not to touch'],
    ['bedtime', 'Past your bedtime', 'Try to change a setting that belongs to Mom'],
    ['konami', 'Registry cheater', 'Some cheats live in the registry'],
    ['redfaster', 'Go faster', 'Make the red ones go even faster'],
    ['hotdog', 'Mustard and ketchup', 'Pick the most famously garish colour scheme'],
    ['trails', 'Follow the leader', 'Give your mouse pointer a tail'],
    ['jackbox', 'Pop goes the Jack', 'Double-click quickly enough in the Mouse settings'],
    ['y2kyear', 'Time traveller', 'Try to set the clock to the year 2000'],
    ['uninstall', 'Some elements could not be removed', 'Try to uninstall something that refuses to go'],
    ['devmgr', 'Code 10', 'Investigate a broken device in Device Manager'],
    ['modem', 'AT commands', 'Ask the modem for more info'],
    ['password', 'Open sesame', 'Change your password (you need the old one, and there is a hint somewhere)'],
    ['dialmodem', 'Calling myself', 'Dial the number the modem dials'],
    ['speakclock', 'At the third stroke', 'Ring the number that tells the time'],
    ['premium', 'Premium rate', 'Ring a premium number (with permission!)'],
    ['charsquig', 'Spelling bee', 'Spell the name of a little bouncy critter in Character Map'],
    ['joycal', 'Calibrated', 'Calibrate a joystick'],
    ['hardware', 'Plug and Pray', 'Let JackOS look for new hardware'],
    ['resolution', 'Big screen dreams', 'Try a resolution your monitor can\'t handle'],
    ['drwatson', 'Elementary', 'Find the doctor in System Information'],
    ['crash', 'Crash test dummy', 'Some registry values should be left at 0'],
  ];
  SEC.forEach(([id, n, hint]) => A.defineSecret('prog.' + id, n, hint));
  const secret = id => A.secret('prog.' + id);

  // ================================================================ icons (32x32 viewBox, shown at 16 or 32)
  const I = {
    calc: '<svg viewBox="0 0 32 32"><rect x="6" y="2" width="20" height="28" fill="#c0c0c0" stroke="#000"/><rect x="9" y="5" width="14" height="6" fill="#cfe8cf" stroke="#000"/><path d="M15 8h6" stroke="#000"/><g fill="#000080"><rect x="9" y="14" width="4" height="3"/><rect x="14" y="14" width="4" height="3"/><rect x="9" y="19" width="4" height="3"/><rect x="14" y="19" width="4" height="3"/><rect x="9" y="24" width="4" height="3"/><rect x="14" y="24" width="4" height="3"/></g><rect x="19" y="14" width="4" height="8" fill="#e10600"/><rect x="19" y="24" width="4" height="3" fill="#e10600"/></svg>',
    paint: '<svg viewBox="0 0 32 32"><path d="M15 5C7 5 2 10 2 16s4 11 11 11c2 0 2-2 1-3s0-3 2-3h4c5 0 8-3 8-7 0-5-6-9-13-9z" fill="#f4e2b8" stroke="#000"/><circle cx="8" cy="14" r="2.3" fill="#e10600"/><circle cx="12" cy="9.5" r="2.3" fill="#ffd400"/><circle cx="18.5" cy="9.5" r="2.3" fill="#0028c8"/><circle cx="23" cy="14" r="2.3" fill="#0a0"/><path d="M30 3L19 19" stroke="#7a4a00" stroke-width="2.6"/><path d="M19 19l-4 6 6-4z" fill="#000"/></svg>',
    amp: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="24" rx="3" fill="#25252e" stroke="#000"/><rect x="4" y="6" width="24" height="20" rx="2" fill="none" stroke="#5a5a6a"/><path d="M19 6l-9 12h6l-3 9 10-13h-6z" fill="#3cff3c" stroke="#0a5a0a"/></svg>',
    defrag: '<svg viewBox="0 0 32 32"><rect x="2" y="7" width="28" height="20" fill="#c0c0c0" stroke="#000"/><g stroke="#000" stroke-width=".6"><rect x="5" y="10" width="5" height="5" fill="#000080"/><rect x="11" y="10" width="5" height="5" fill="#00ffff"/><rect x="17" y="10" width="5" height="5" fill="#00ffff"/><rect x="23" y="10" width="4" height="5" fill="#e10600"/><rect x="5" y="17" width="5" height="5" fill="#00ffff"/><rect x="11" y="17" width="5" height="5" fill="#5f9fd0"/><rect x="17" y="17" width="5" height="5" fill="#fff"/><rect x="23" y="17" width="4" height="5" fill="#0c0"/></g></svg>',
    scandisk: '<svg viewBox="0 0 32 32"><rect x="2" y="14" width="24" height="10" fill="#c0c0c0" stroke="#000"/><rect x="5" y="19" width="9" height="2" fill="#000"/><rect x="20" y="19" width="3" height="2" fill="#0c0"/><circle cx="20" cy="10" r="7" fill="#cfe8ff" fill-opacity=".7" stroke="#000" stroke-width="2"/><path d="M25 15l5 5" stroke="#7a4a00" stroke-width="3.5"/></svg>',
    regedit: '<svg viewBox="0 0 32 32"><g stroke="#000" stroke-width=".8"><path d="M9 3l7 3v8l-7-3z" fill="#2a5ad8"/><path d="M16 6l7-3v8l-7 3z" fill="#1a3a98"/><path d="M9 3l7-3 7 3-7 3z" fill="#7aa8ff"/><path d="M2 16l7 3v8l-7-3z" fill="#2a9a2a"/><path d="M9 19l7-3v8l-7 3z" fill="#1a6a1a"/><path d="M2 16l7-3 7 3-7 3z" fill="#8ad88a"/><path d="M16 16l7 3v8l-7-3z" fill="#d82a2a"/><path d="M23 19l7-3v8l-7 3z" fill="#982a1a"/><path d="M16 16l7-3 7 3-7 3z" fill="#ff8a7a"/></g></svg>',
    control: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><rect x="6" y="13" width="13" height="10" fill="#c0c0c0" stroke="#000"/><rect x="8" y="15" width="9" height="6" fill="#008080"/><path d="M27 12l-6 8" stroke="#555" stroke-width="2.5"/><path d="M20 19l-2 5 4-3z" fill="#e10600"/></svg>',
    phone: '<svg viewBox="0 0 32 32"><path d="M4 12c0-4 5-6 12-6s12 2 12 6v2h-6v-3h-12v3H4z" fill="#333" stroke="#000"/><path d="M8 15h16l3 12H5z" fill="#e8e0c8" stroke="#000"/><g fill="#555"><rect x="10" y="18" width="3" height="2"/><rect x="15" y="18" width="3" height="2"/><rect x="20" y="18" width="3" height="2"/><rect x="10" y="22" width="3" height="2"/><rect x="15" y="22" width="3" height="2"/><rect x="20" y="22" width="3" height="2"/></g></svg>',
    sysinfo: '<svg viewBox="0 0 32 32"><rect x="3" y="4" width="22" height="16" fill="#c0c0c0" stroke="#000"/><rect x="5" y="6" width="18" height="12" fill="#000080"/><rect x="8" y="22" width="12" height="4" fill="#808080" stroke="#000"/><circle cx="24" cy="22" r="7" fill="#fff" stroke="#000080" stroke-width="1.5"/><rect x="23" y="21" width="2" height="5" fill="#000080"/><rect x="23" y="17.5" width="2" height="2" fill="#000080"/></svg>',
    charmap: '<svg viewBox="0 0 32 32"><rect x="3" y="3" width="26" height="26" fill="#fff" stroke="#000"/><path d="M3 11h26M3 19h26M11 3v26M19 3v26" stroke="#808080"/><text x="7" y="10" font-family="Times New Roman,serif" font-size="8" fill="#000">A</text><text x="14" y="18" font-family="Times New Roman,serif" font-size="8" fill="#000080">&#223;</text><text x="22" y="26" font-family="Times New Roman,serif" font-size="8" fill="#e10600">&#169;</text></svg>',
    clip: '<svg viewBox="0 0 32 32"><rect x="5" y="4" width="22" height="26" rx="2" fill="#a0702a" stroke="#000"/><rect x="8" y="8" width="16" height="19" fill="#fff" stroke="#000"/><rect x="11" y="2" width="10" height="5" rx="1" fill="#c0c0c0" stroke="#000"/><path d="M11 13h10M11 17h10M11 21h7" stroke="#000080"/></svg>',
    mid: '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/><path d="M14 23V12l8-2v11" stroke="#000" stroke-width="1.6" fill="none"/><ellipse cx="12.5" cy="23" rx="2.5" ry="2" fill="#000"/><ellipse cx="20.5" cy="21" rx="2.5" ry="2" fill="#000"/></svg>',
    bmp: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="26" height="22" fill="#fff" stroke="#000"/><path d="M5 25l7-9 5 6 4-4 6 7z" fill="#2a9a2a"/><circle cx="22" cy="11" r="3" fill="#ffd400"/><path d="M28 2l-8 12" stroke="#7a4a00" stroke-width="2"/></svg>',
    warn: '<svg viewBox="0 0 16 16"><path d="M8 1l7 14H1z" fill="#ffd400" stroke="#000"/><rect x="7.2" y="5.5" width="1.6" height="5" fill="#000"/><rect x="7.2" y="11.5" width="1.6" height="1.6" fill="#000"/></svg>',
    folder: A.ICON.folder,
  };
  // the official JackOS 98 icons (icons.js) where they're the specific match
  if (window.JICON) Object.assign(I, { calc: JICON.icon('calc'), paint: JICON.icon('paint'), amp: JICON.icon('jackamp'), defrag: JICON.icon('defrag'), scandisk: JICON.icon('scandisk'), regedit: JICON.icon('regedit'), control: JICON.icon('control'), mid: JICON.icon('mid'), bmp: JICON.icon('bmp'), warn: JICON.icon('warning'), phone: JICON.icon('phone'), sysinfo: JICON.icon('sysinfo'), charmap: JICON.icon('charmap'), clip: JICON.icon('clipboard') });
  A.ICON.png = A.ICON.png || I.bmp; A.ICON.mid = A.ICON.mid || I.mid;

  // ================================================================ sound helpers
  // Sound effects respect the tray SFX toggle. This just reminds people the speaker is off.
  let sfxHinted = false;
  function sfxHint() { if (Sound.on || sfxHinted) return; sfxHinted = true; toast('Sound is off', 'Click the speaker in the system tray to hear sound effects (and the phone tones).', 5000); }
  function sfxOn(v) { Sound.on = v; document.dispatchEvent(new Event('sfxchange')); }
  const DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], '*': [941, 1209], 0: [941, 1336], '#': [941, 1477] };
  function dtmf(d, dur) { const p = DTMF[d]; if (!p) return; Sound.note(p[0], dur || 0.14, 'sine'); Sound.note(p[1], dur || 0.14, 'sine'); }

  // ================================================================ clipboard: the real one where the browser allows it, plus our own copy
  const Clip = {
    text: '', subs: [],
    set(t) { Clip.text = String(t); try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(Clip.text).catch(() => {}); } catch (e) {} Clip.emit(); },
    emit() { Clip.subs.forEach(f => { try { f(Clip.text); } catch (e) {} }); },
    async read() { try { if (navigator.clipboard && navigator.clipboard.readText) { const t = await navigator.clipboard.readText(); if (typeof t === 'string') { Clip.text = t; Clip.emit(); } } } catch (e) {} return Clip.text; },
  };
  on(document, 'copy', () => setTimeout(() => {
    const a = document.activeElement;
    let s = '';
    if (a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /text|search/.test(a.type))) && a.selectionStart != null) s = a.value.slice(a.selectionStart, a.selectionEnd);
    else s = String(document.getSelection() || '');
    if (s) { Clip.text = s; Clip.emit(); }
  }, 0));

  // ================================================================ property sheets: tabs + OK / Cancel / Apply
  // pages: [[tabName, (pageEl, ctx) => {}]]. ctx.dirty() lights up Apply, ctx.onApply(fn) runs on OK/Apply.
  function sheet(title, pages, o) {
    o = o || {};
    const b = h('', 'pgk-sheet');
    const tab0 = o.tab || 0;
    b.innerHTML = `<div class="tabs" role="tablist">${pages.map((p, i) => `<span role="tab" tabindex="0" class="${i === tab0 ? 'on' : ''}">${esc(p[0])}</span>`).join('')}</div><div class="pgk-pages"></div><div class="row pgk-btns"><button class="btn" data-b="ok">OK</button><button class="btn" data-b="cancel">Cancel</button>${o.noApply ? '' : '<button class="btn" data-b="apply" disabled>Apply</button>'}</div>`;
    const applyBtn = qs(b, '[data-b=apply]') || { disabled: true };
    const applies = [], closers = [];
    const ctx = { dirty() { applyBtn.disabled = false; }, onApply(fn) { applies.push(fn); }, onClose(fn) { closers.push(fn); }, w: null, b };
    const pagesEl = qs(b, '.pgk-pages');
    pages.forEach((p, i) => { const pg = h('', 'tabpage pgk-page' + (i === tab0 ? '' : ' off')); pagesEl.appendChild(pg); p[1](pg, ctx); });
    const tabs = qsa(b, '.tabs span');
    tabs.forEach((t, i) => { const sel = () => { tabs.forEach((x, j) => { x.classList.toggle('on', i === j); pagesEl.children[j].classList.toggle('off', i !== j); }); if (o.onTab) o.onTab(i); }; tap(t, sel); on(t, 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(); } }); });
    const w = A.win(title, b, { w: o.w || 404, icon: o.icon, noResize: true, noMax: true, noMin: true, escClose: true, onClose: () => { closers.forEach(f => f()); if (o.onClose) o.onClose(); } });
    ctx.w = w;
    const apply = () => { applies.forEach(fn => fn()); applyBtn.disabled = true; };
    tap(qs(b, '[data-b=ok]'), () => { apply(); w.close(); });
    tap(qs(b, '[data-b=cancel]'), w.close);
    if (qs(b, '[data-b=apply]')) tap(applyBtn, apply);
    return { w, b, ctx };
  }
  // a small plain dialog with buttons along the bottom; buttons: [[label, fn returning false to stay open]]
  function dialog(title, html, buttons, o) {
    o = o || {};
    const b = h(html, 'pg-dlg');
    const row = h('', 'row pg-dlgbtns'); b.appendChild(row);
    const w = A.win(title, b, { w: o.w || 340, icon: o.icon, noResize: true, noMax: true, noMin: true, escClose: true, onClose: o.onClose });
    (buttons || [['OK']]).forEach(([label, fn]) => { const bt = h('', 'btn', 'button'); bt.textContent = label; tap(bt, () => { if (fn && fn(b, w) === false) return; w.close(); }); row.appendChild(bt); });
    setTimeout(() => { const f = qs(b, 'input,select') || qs(row, 'button'); if (f) f.focus(); }, 40);
    return { w, b };
  }
  // a JackOS 98 progress bar: returns setter 0..1
  function progBar(el) { el.innerHTML = '<div class="prog"><span style="display:flex;gap:2px"></span></div>'; const s = qs(el, 'span'); let last = -1; return f => { const w = el.firstChild.clientWidth || 260; const n = Math.round(clamp(f, 0, 1) * Math.floor((w - 4) / 11)); if (n !== last) { last = n; s.innerHTML = '<i></i>'.repeat(n); } }; }

  // ================================================================ desktop: wallpapers, colour schemes, pointer trails (shared by Control Panel, Paint and the Registry)
  const svgUrl = s => `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" ' + s + '</svg>')}")`;
  const WALLS = { // name -> (colour) => CSS background
    '(None)': c => c,
    'Teal Classic': () => '',
    'Clouds': () => 'radial-gradient(ellipse 18% 7% at 20% 30%,#fff 60%,transparent 62%),radial-gradient(ellipse 12% 5% at 28% 27%,#fff 60%,transparent 62%),radial-gradient(ellipse 22% 8% at 75% 22%,#fff 60%,transparent 62%),radial-gradient(ellipse 14% 6% at 83% 26%,#fff 60%,transparent 62%),radial-gradient(ellipse 20% 7% at 55% 72%,#fff 60%,transparent 62%),radial-gradient(ellipse 13% 5% at 46% 75%,#fff 60%,transparent 62%),linear-gradient(#1c5bc9,#7eb6f0 55%,#cfe6ff)',
    'Blobbits': c => svgUrl(`width="64" height="64"><g stroke-width="1"><circle cx="10.4" cy="10.6" r="2.7" fill="#e8381b" stroke="#5a0a00"/><circle cx="21.6" cy="10.6" r="2.7" fill="#e8381b" stroke="#5a0a00"/><ellipse cx="16" cy="18" rx="9" ry="7.9" fill="#e8381b" stroke="#5a0a00"/><ellipse cx="12.2" cy="14.2" rx="2.3" ry="1.3" fill="#fff" fill-opacity=".55" stroke="none"/><ellipse cx="13.3" cy="17.6" rx="1.8" ry="2.3" fill="#fff" stroke="none"/><ellipse cx="18.7" cy="17.6" rx="1.8" ry="2.3" fill="#fff" stroke="none"/><circle cx="13.8" cy="18.0" r="1.0" fill="#000" stroke="none"/><circle cx="19.1" cy="18.0" r="1.0" fill="#000" stroke="none"/><path d="M13.8 21.4q2.2 2.0 4.5 0" fill="none" stroke="#5a0a00"/><circle cx="42.4" cy="42.6" r="2.7" fill="#d81b60" stroke="#4a0020"/><circle cx="53.6" cy="42.6" r="2.7" fill="#d81b60" stroke="#4a0020"/><ellipse cx="48" cy="50" rx="9" ry="7.9" fill="#d81b60" stroke="#4a0020"/><ellipse cx="44.2" cy="46.2" rx="2.3" ry="1.3" fill="#fff" fill-opacity=".55" stroke="none"/><ellipse cx="45.3" cy="49.5" rx="1.8" ry="2.3" fill="#fff" stroke="none"/><ellipse cx="50.7" cy="49.5" rx="1.8" ry="2.3" fill="#fff" stroke="none"/><circle cx="45.8" cy="50.0" r="1.0" fill="#000" stroke="none"/><circle cx="51.1" cy="50.0" r="1.0" fill="#000" stroke="none"/><path d="M45.8 53.4q2.2 2.0 4.5 0" fill="none" stroke="#4a0020"/><circle cx="46.9" cy="9.9" r="1.5" fill="#ff8a00" stroke="#6a3000"/><circle cx="53.1" cy="9.9" r="1.5" fill="#ff8a00" stroke="#6a3000"/><ellipse cx="50" cy="14" rx="5" ry="4.4" fill="#ff8a00" stroke="#6a3000"/><ellipse cx="47.9" cy="11.9" rx="1.3" ry="0.8" fill="#fff" fill-opacity=".55" stroke="none"/><ellipse cx="48.5" cy="13.8" rx="1.0" ry="1.3" fill="#fff" stroke="none"/><ellipse cx="51.5" cy="13.8" rx="1.0" ry="1.3" fill="#fff" stroke="none"/><circle cx="48.8" cy="14.0" r="0.6" fill="#000" stroke="none"/><circle cx="51.8" cy="14.0" r="0.6" fill="#000" stroke="none"/><path d="M48.8 15.9q1.2 1.1 2.5 0" fill="none" stroke="#6a3000"/><circle cx="10.9" cy="45.9" r="1.5" fill="#2a9ae8" stroke="#0a2a5a"/><circle cx="17.1" cy="45.9" r="1.5" fill="#2a9ae8" stroke="#0a2a5a"/><ellipse cx="14" cy="50" rx="5" ry="4.4" fill="#2a9ae8" stroke="#0a2a5a"/><ellipse cx="11.9" cy="47.9" rx="1.3" ry="0.8" fill="#fff" fill-opacity=".55" stroke="none"/><ellipse cx="12.5" cy="49.8" rx="1.0" ry="1.3" fill="#fff" stroke="none"/><ellipse cx="15.5" cy="49.8" rx="1.0" ry="1.3" fill="#fff" stroke="none"/><circle cx="12.8" cy="50.0" r="0.6" fill="#000" stroke="none"/><circle cx="15.8" cy="50.0" r="0.6" fill="#000" stroke="none"/><path d="M12.8 51.9q1.2 1.1 2.5 0" fill="none" stroke="#0a2a5a"/></g>`) + ' 0 0/64px 64px,' + c,
    'Camo': () => svgUrl(`width="120" height="120"><rect width="120" height="120" fill="#4a6a2a"/><path d="M10 20c20-15 40 5 30 20s-35 10-30-20zM70 10c25 0 30 25 10 30s-30-30-10-30zM20 80c15-10 35 0 30 20s-40 5-30-20zM80 70c20-5 35 15 25 30s-35 0-25-30z" fill="#2a3a1a"/><path d="M50 50c10-5 20 5 12 12s-20-5-12-12zM95 40c8-4 15 4 10 10s-15-2-10-10z" fill="#7a8a4a"/>`) + ' 0 0/120px 120px',
    'Bricks': () => svgUrl(`width="48" height="24"><rect width="48" height="24" fill="#a03a1a"/><path d="M0 0h48M0 12h48M0 24h48M12 0v12M36 0v12M0 12v12M24 12v12" stroke="#d8c8a8" stroke-width="2"/>`) + ' 0 0/48px 24px',
    'Black Thatch': () => 'repeating-linear-gradient(45deg,#000 0 3px,#333 3px 6px),#000',
    'Circuits': () => svgUrl(`width="80" height="80"><rect width="80" height="80" fill="#0a3a1a"/><g stroke="#3aaa5a" stroke-width="2" fill="none"><path d="M0 20h30l10 10v30h40M20 0v10l10 10M60 0v30h20M0 70h20l10-10"/></g><g fill="#c8c050"><circle cx="40" cy="60" r="3"/><circle cx="60" cy="30" r="3"/><circle cx="30" cy="20" r="3"/><circle cx="20" cy="70" r="3"/></g>`) + ' 0 0/80px 80px',
    'Starfield': () => 'radial-gradient(1px 1px at 10% 20%,#fff,transparent),radial-gradient(1px 1px at 30% 70%,#fff,transparent),radial-gradient(2px 2px at 50% 40%,#fff,transparent),radial-gradient(1px 1px at 70% 10%,#fff,transparent),radial-gradient(1px 1px at 90% 60%,#fff,transparent),radial-gradient(2px 2px at 80% 85%,#ff8,transparent),radial-gradient(1px 1px at 20% 90%,#fff,transparent) 0 0/200px 200px,#000010',
    'Rubik': () => svgUrl(`width="60" height="60"><g stroke="#000" stroke-width="2"><rect x="1" y="1" width="18" height="18" fill="#e10600"/><rect x="21" y="1" width="18" height="18" fill="#fff"/><rect x="41" y="1" width="18" height="18" fill="#0028c8"/><rect x="1" y="21" width="18" height="18" fill="#ffd400"/><rect x="21" y="21" width="18" height="18" fill="#0a0"/><rect x="41" y="21" width="18" height="18" fill="#ff7a00"/><rect x="1" y="41" width="18" height="18" fill="#0028c8"/><rect x="21" y="41" width="18" height="18" fill="#e10600"/><rect x="41" y="41" width="18" height="18" fill="#ffd400"/></g>`) + ' 0 0/60px 60px,#000',
    'Tartan': () => 'repeating-linear-gradient(90deg,rgba(0,0,0,.25) 0 6px,transparent 6px 24px,rgba(255,212,0,.5) 24px 26px,transparent 26px 48px),repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 6px,transparent 6px 24px,rgba(255,212,0,.5) 24px 26px,transparent 26px 48px),#8a1010',
    'Weave': c => 'repeating-linear-gradient(45deg,rgba(255,255,255,.18) 0 4px,transparent 4px 8px),repeating-linear-gradient(-45deg,rgba(0,0,0,.18) 0 4px,transparent 4px 8px),' + c,
    'Setup': () => 'linear-gradient(#000080,#0000ff 60%,#3a6aff)',
    'Hot Dog': () => 'repeating-linear-gradient(0deg,#ff0000 0 20px,#ffff00 20px 40px)',
    'Matrix': () => svgUrl(`width="40" height="60"><rect width="40" height="60" fill="#000"/><g fill="#0c0" font-family="monospace" font-size="10"><text x="2" y="10">1</text><text x="14" y="22">0</text><text x="26" y="12">7</text><text x="4" y="40">J</text><text x="18" y="50">K</text><text x="30" y="34">9</text></g>`) + ' 0 0/40px 60px',
    'Floppies': () => svgUrl(`width="56" height="56"><rect width="56" height="56" fill="#3a3a5a"/><rect x="8" y="8" width="26" height="26" fill="#111" stroke="#000"/><rect x="14" y="8" width="14" height="9" fill="#bbb"/><rect x="12" y="22" width="18" height="12" fill="#eee"/><path d="M14 26h14M14 29h10" stroke="#e10600"/>`) + ' 0 0/56px 56px',
    'Millennium': () => 'radial-gradient(circle at 25% 30%,#ffd400 0 2%,transparent 9%),radial-gradient(circle at 70% 25%,#ff2a6d 0 2%,transparent 10%),radial-gradient(circle at 55% 65%,#00e5ff 0 2%,transparent 11%),radial-gradient(circle at 15% 75%,#b6ff00 0 2%,transparent 8%),linear-gradient(#000020,#1a0a4a)',
    'Gubbinz': c => svgUrl(`width="80" height="80"><g transform="translate(20 18)"><rect x="6" y="8" width="28" height="24" fill="#3a9a2a" stroke="#000"/><path d="M6 14L-4 8v14zM34 14l10-6v14z" fill="#3a9a2a" stroke="#000"/><rect x="11" y="14" width="5" height="5" fill="#e10600"/><rect x="24" y="14" width="5" height="5" fill="#e10600"/><path d="M12 26h16" stroke="#fff" stroke-width="2" stroke-dasharray="2 2"/></g>`) + ' 0 0/80px 80px,' + c,
  };
  const WALL_KEYS = Object.keys(WALLS);
  const desktopEl = () => $('desktop');
  function wallCss(w) {
    if (!w) return '';
    if (w.img) return w.mode === 'Center' ? `url("${w.img}") center/auto no-repeat,${w.col || '#008080'}` : w.mode === 'Stretch' ? `url("${w.img}") center/100% 100% no-repeat,${w.col || '#008080'}` : `url("${w.img}") 0 0/auto repeat,${w.col || '#008080'}`;
    const f = WALLS[w.name]; return f ? f(w.col || '#008080') : '';
  }
  function setWall(w, quiet) {
    if (desktopEl()) desktopEl().style.background = wallCss(w);
    if (!quiet) { try { if (w) localStorage.setItem('jhp_prog_wall', JSON.stringify(w)); else localStorage.removeItem('jhp_prog_wall'); } catch (e) { toast('Display Properties', 'Your hard disk is full. The wallpaper will not be remembered after a restart.'); } }
  }
  const getWall = () => store.get('jhp_prog_wall', null);
  // wallpapers that were renamed: one picked under its old name keeps working
  const OLDWALL = { 'Squigs': 'Blobbits', 'Ork Camo': 'Camo' };
  try { const w0 = getWall(); if (w0 && OLDWALL[w0.name]) store.set('jhp_prog_wall', Object.assign({}, w0, { name: OLDWALL[w0.name] })); } catch (e) {}
  if (getWall()) setWall(getWall(), true);
  const wallNorm = s => String(s).toLowerCase().replace(/[^a-z]/g, '');
  const findWall = s => { const old = Object.keys(OLDWALL).find(k => wallNorm(k) === wallNorm(s)); return old ? OLDWALL[old] : WALL_KEYS.find(k => wallNorm(k) === wallNorm(s)); };

  const SCHEMES = { // [title1, title2, face]
    'JackOS Standard': ['#000080', '#1084d0', '#c0c0c0'],
    'Brick': ['#800000', '#c06040', '#c2bfa5'],
    'Desert': ['#008080', '#60b0b0', '#d5ccbb'],
    'Eggplant': ['#5a3070', '#9a70b0', '#90b0a8'],
    'High Contrast White': ['#000000', '#000000', '#ffffff'],
    'Hot Dog Stand': ['#ff0000', '#ff0000', '#ffff00'],
    'JackOS Purple': ['#5b16c9', '#ff2a6d', '#c0c0c0'],
    'Lilac': ['#5a4f9a', '#a49ad8', '#c8b8e8'],
    'Marine': ['#000080', '#3a6ea5', '#88c0b8'],
    'Matrix': ['#000000', '#00a000', '#b8c8b8'],
    'Army Green': ['#1f5a12', '#5ab02a', '#b9c8a0'],
    'Pumpkin': ['#602000', '#d07000', '#f0c878'],
    'Rainy Day': ['#4f6f8f', '#9fb8cf', '#b8c4cc'],
    'Spruce': ['#2f5f2f', '#6f9f6f', '#a0c0a0'],
    'Storm': ['#3a3a6a', '#7a7aaa', '#a8a8c0'],
    'Wheat': ['#808000', '#c0c060', '#e8e0b0'],
  };
  function applyScheme(name, save) {
    const s = SCHEMES[name] || SCHEMES['JackOS Standard'], r = document.documentElement.style;
    r.setProperty('--title1', s[0]); r.setProperty('--title2', s[1]); r.setProperty('--face', s[2]);
    if (save) store.set('jhp_prog_scheme', name);
    if (name === 'Hot Dog Stand' && save) secret('hotdog');
  }
  if (store.get('jhp_prog_scheme', null) === 'Ork Green') store.set('jhp_prog_scheme', 'Army Green'); // renamed scheme
  if (store.get('jhp_prog_scheme', null)) applyScheme(store.get('jhp_prog_scheme'), false);

  // pointer trails: a little queue of arrows following the real mouse
  const ARROW = '<svg viewBox="0 0 12 19" width="12" height="19"><path d="M.5.5v15l4-4 2.5 6 2-1-2.5-5.5H12z" fill="#fff" stroke="#000"/></svg>';
  const Trails = {
    n: 0, els: [], hist: [], x: -99, y: -99, raf: 0,
    set(n) {
      Trails.n = clamp(n | 0, 0, 7); store.set('jhp_prog_trails', Trails.n);
      Trails.els.forEach(e => e.remove()); Trails.els = [];
      for (let i = 0; i < Trails.n; i++) { const e = h(ARROW, 'pg-trail'); e.style.opacity = String(1 - (i + 1) / (Trails.n + 2)); document.body.appendChild(e); Trails.els.push(e); }
      cancelAnimationFrame(Trails.raf); if (Trails.n) Trails.raf = requestAnimationFrame(Trails.tick);
      if (Trails.n) secret('trails');
    },
    tick() {
      Trails.hist.unshift([Trails.x, Trails.y]); Trails.hist.length = Math.min(Trails.hist.length, Trails.n * 3 + 4);
      Trails.els.forEach((e, i) => { const p = Trails.hist[(i + 1) * 3] || Trails.hist[Trails.hist.length - 1]; const near = Math.abs(p[0] - Trails.x) + Math.abs(p[1] - Trails.y) < 3; e.style.transform = `translate(${p[0]}px,${p[1]}px)`; e.style.visibility = near ? 'hidden' : 'visible'; });
      Trails.raf = requestAnimationFrame(Trails.tick);
    },
  };
  on(document, 'pointermove', e => { if (e.pointerType === 'mouse') { Trails.x = e.clientX; Trails.y = e.clientY; } }, { passive: true });
  if (store.get('jhp_prog_trails', 0)) setTimeout(() => { const n = store.get('jhp_prog_trails', 0); Trails.n = 0; Trails.set(n); }, 0);

  // keyboard cursor blink rate (it really changes the speed of every blinking thing on the page)
  function setBlink(ms, save) { document.documentElement.style.setProperty('--pg-blink', ms + 'ms'); document.body.classList.toggle('pg-blinkrate', ms !== 1000); if (save) store.set('jhp_prog_blink', ms); }
  if (store.get('jhp_prog_blink', 1000) !== 1000) setBlink(store.get('jhp_prog_blink', 1000), false);
  if (store.get('jhp_prog_bigicons', false)) document.body.classList.add('pg-bigicons');

  // ================================================================ CALCULATOR
  A.register('calc', { cmd: ['calc', 'calculator'], open() {
    let sci = store.get('jhp_prog_calcsci', false), group = false, base = 10, ang = 'deg', inv = false, hyp = false, fe = false;
    let cur = 0, typed = null, stack = [], lastOp = null, lastArg = 0, mem = 0, err = '', justOp = false, hist = '';
    const PREC = { or: 1, xor: 2, and: 3, lsh: 4, '+': 5, '-': 5, '*': 6, '/': 6, mod: 6, pow: 7, root: 7 };
    const b = h('', 'pgc');
    const w = A.win('Calculator', b, { w: 262, icon: I.calc, menubar: true, noResize: true, noMax: true });
    w.el.tabIndex = -1;
    const BTN = (k, label, cls) => `<button class="btn pgc-k ${cls || ''}" data-k="${k}">${label}</button>`;
    function layout() {
      const d = (k, l) => BTN(k, l || k, 'pgc-d'), op = (k, l) => BTN(k, l || k, 'pgc-o'), fn = (k, l) => BTN(k, l, 'pgc-f'), m = (k, l) => BTN(k, l, 'pgc-m');
      b.className = 'pgc' + (sci ? ' sci' : '');
      if (!sci) {
        b.innerHTML = `<div class="pgc-disp field" aria-live="polite"></div><div class="pgc-top"><span class="pgc-mi field"></span>${BTN('bs', 'Backspace', 'pgc-o wide')}${BTN('ce', 'CE', 'pgc-o wide')}${BTN('c', 'C', 'pgc-o wide')}</div>
        <div class="pgc-grid std">${m('mc', 'MC')}${d(7)}${d(8)}${d(9)}${op('/')}${fn('sqrt', 'sqrt')}${m('mr', 'MR')}${d(4)}${d(5)}${d(6)}${op('*')}${fn('pct', '%')}${m('ms', 'MS')}${d(1)}${d(2)}${d(3)}${op('-')}${fn('inv1', '1/x')}${m('mp', 'M+')}${d(0)}${d('neg', '+/-')}${d('.', '.')}${op('+')}${op('=')}</div>`;
        sizeWin(w, 262);
      } else {
        b.innerHTML = `<div class="pgc-disp field" aria-live="polite"></div>
        <div class="pgc-modes"><span class="pgc-rg field">${['Hex', 'Dec', 'Oct', 'Bin'].map(x => `<label><input type="radio" name="pgcb" value="${x}" ${({ Hex: 16, Dec: 10, Oct: 8, Bin: 2 }[x]) === base ? 'checked' : ''}>${x}</label>`).join('')}</span><span class="pgc-rg field">${['Deg', 'Rad', 'Grad'].map(x => `<label><input type="radio" name="pgca" value="${x.toLowerCase()}" ${x.toLowerCase() === ang ? 'checked' : ''}>${x}</label>`).join('')}</span></div>
        <div class="pgc-top"><label class="pgc-chk"><input type="checkbox" class="pgc-inv">Inv</label><label class="pgc-chk"><input type="checkbox" class="pgc-hyp">Hyp</label><span class="pgc-pi field"></span><span class="pgc-mi field"></span>${BTN('bs', 'Backspace', 'pgc-o wide')}${BTN('ce', 'CE', 'pgc-o wide')}${BTN('c', 'C', 'pgc-o wide')}</div>
        <div class="pgc-grid sg">${fn('fe', 'F-E')}${fn('(', '(')}${fn(')', ')')}${m('mc', 'MC')}${d(7)}${d(8)}${d(9)}${op('/')}${op('mod', 'Mod')}${op('and', 'And')}
        ${fn('dms', 'dms')}${fn('exp', 'Exp')}${fn('ln', 'ln')}${m('mr', 'MR')}${d(4)}${d(5)}${d(6)}${op('*')}${op('or', 'Or')}${op('xor', 'Xor')}
        ${fn('sin', 'sin')}${fn('pow', 'x^y')}${fn('log', 'log')}${m('ms', 'MS')}${d(1)}${d(2)}${d(3)}${op('-')}${op('lsh', 'Lsh')}${op('not', 'Not')}
        ${fn('cos', 'cos')}${fn('x3', 'x^3')}${fn('fact', 'n!')}${m('mp', 'M+')}${d(0)}${d('neg', '+/-')}${d('.', '.')}${op('+')}${op('=')}${op('int', 'Int')}
        ${fn('tan', 'tan')}${fn('x2', 'x^2')}${fn('inv1', '1/x')}${fn('pi', 'pi')}${d('A')}${d('B')}${d('C')}${d('D')}${d('E')}${d('F')}</div>`;
        sizeWin(w, 470);
        qsa(b, 'input[name=pgcb]').forEach(r => on(r, 'change', () => setBase({ Hex: 16, Dec: 10, Oct: 8, Bin: 2 }[r.value])));
        qsa(b, 'input[name=pgca]').forEach(r => on(r, 'change', () => { ang = r.value; }));
        on(qs(b, '.pgc-inv'), 'change', e => { inv = e.target.checked; });
        on(qs(b, '.pgc-hyp'), 'change', e => { hyp = e.target.checked; });
      }
      qsa(b, '.pgc-k').forEach(k => on(k, 'click', () => { press(k.dataset.k); w.el.focus({ preventScroll: true }); }));
      show(); enable();
      setTimeout(() => { if (!w.closed) w.el.focus({ preventScroll: true }); }, 0);
    }
    function enable() {
      qsa(b, '.pgc-d').forEach(k => { const v = k.dataset.k; if (/^[0-9A-F]$/.test(v)) k.disabled = parseInt(v, 16) >= base; if (v === '.') k.disabled = base !== 10; });
      qsa(b, '.pgc-f').forEach(k => { if (!['(', ')', 'x2', 'x3', 'pow', 'fact', 'inv1'].includes(k.dataset.k)) k.disabled = base !== 10; if (k.dataset.k === 'inv1') k.disabled = sci && base !== 10; });
      qsa(b, 'input[name=pgca]').forEach(r => { r.disabled = base !== 10; });
    }
    const val = () => typed !== null ? (base === 10 ? parseFloat(typed) : parseInt(typed || '0', base)) || 0 : cur;
    function fmt(v) {
      if (!isFinite(v)) return null;
      if (base !== 10) { let n = Math.trunc(v); if (n < 0) n = (n >>> 0); return n.toString(base).toUpperCase(); }
      let s;
      if (fe || (v !== 0 && (Math.abs(v) >= 1e32 || Math.abs(v) < 1e-32))) { s = v.toExponential(); s = s.replace(/^(-?\d)(?:\.(\d+))?e([+-])(\d+)$/, (m, a, f, sg, e) => `${a}.${f || ''}e${sg}${e.padStart(3, '0')}`); return s; }
      s = String(v);
      if (/e/.test(s)) s = v.toFixed(20).replace(/0+$/, '');
      return s;
    }
    function grouped(s) {
      if (!group || !/^-?[0-9A-F]+/.test(s)) return s;
      const m = /^(-?)([0-9A-F]+)(.*)$/.exec(s); if (!m) return s;
      return m[1] + m[2].replace(/\B(?=([0-9A-F]{3})+(?![0-9A-F]))/g, base === 10 ? ',' : ' ') + m[3];
    }
    function show() {
      const d = qs(b, '.pgc-disp'); if (!d) return;
      let s;
      if (err) s = err;
      else if (typed !== null) s = typed;
      else s = fmt(cur);
      if (s === null) { err = 'Overflow'; s = err; }
      if (!err && base === 10 && !/[.e]/.test(s)) s += '.';
      d.textContent = err ? s : grouped(s);
      qsa(b, '.pgc-mi').forEach(e => { e.textContent = mem ? 'M' : ''; });
      const pi = qs(b, '.pgc-pi'); if (pi) { const n = stack.filter(f => f.paren).length; pi.textContent = n ? '(=' + n : ''; }
      if (sv) sv.save();
    }
    function setBase(n) { const v = val(); base = n; typed = null; cur = n === 10 ? v : Math.trunc(v); enable(); show(); }
    function apply(a, op, x) {
      switch (op) {
        case '+': return a + x; case '-': return a - x; case '*': return a * x;
        case '/': if (x === 0) throw new Error('div0'); return a / x;
        case 'mod': if (x === 0) throw new Error('div0'); return a % x;
        case 'pow': return Math.pow(a, x); case 'root': return Math.pow(a, 1 / x);
        case 'and': return (a & x); case 'or': return (a | x); case 'xor': return (a ^ x); case 'lsh': return inv ? a >> x : a << x;
      }
      return x;
    }
    const top = () => stack[stack.length - 1];
    function binop(op) {
      if (inv && op === 'pow') op = 'root';
      let v = val();
      if (justOp && top() && !top().paren) { top().op = op; hist = hist.slice(0, -1) + op; return; }
      while (top() && !top().paren && (!sci || PREC[top().op] >= PREC[op]) && !(op === 'pow' && top().op === 'pow')) { const f = stack.pop(); v = apply(f.v, f.op, v); }
      stack.push({ v, op }); cur = v; typed = null; justOp = true;
      if (!sci || base !== 10 || true) cur = v;
    }
    function equals() {
      let v = val();
      if (stack.length) {
        lastArg = v;
        while (stack.length) { const f = stack.pop(); if (f.paren) continue; lastOp = f.op; lastArg = v; v = apply(f.v, f.op, v); }
      } else if (lastOp && typed === null) v = apply(v, lastOp, lastArg);
      cur = v; typed = null;
    }
    const rad = x => ang === 'deg' ? x * Math.PI / 180 : ang === 'grad' ? x * Math.PI / 200 : x;
    const unrad = x => ang === 'deg' ? x * 180 / Math.PI : ang === 'grad' ? x * 200 / Math.PI : x;
    function fact(n) { if (n < 0 || n !== Math.floor(n)) throw new Error('inv'); if (n > 170) return Infinity; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
    function unary(k) {
      const x = val(); let r;
      switch (k) {
        case 'sqrt': if (x < 0) { toast('Calculator', 'Imaginary numbers are not supported. Only imaginary friends (hi, Gubbinz).'); throw new Error('inv'); } r = Math.sqrt(x); break;
        case 'pct': r = top() && !top().paren ? top().v * x / 100 : 0; break;
        case 'inv1': if (x === 0) throw new Error('div0'); r = 1 / x; break;
        case 'neg': r = -x; break;
        case 'x2': r = inv ? Math.sqrt(x) : x * x; break;
        case 'x3': r = inv ? Math.cbrt(x) : x * x * x; break;
        case 'fact': r = fact(x); break;
        case 'ln': if (!inv && x <= 0) throw new Error('inv'); r = inv ? Math.exp(x) : Math.log(x); break;
        case 'log': if (!inv && x <= 0) throw new Error('inv'); r = inv ? Math.pow(10, x) : Math.log10(x); break;
        case 'sin': r = hyp ? (inv ? Math.asinh(x) : Math.sinh(x)) : inv ? unrad(Math.asin(x)) : Math.sin(rad(x)); break;
        case 'cos': r = hyp ? (inv ? Math.acosh(x) : Math.cosh(x)) : inv ? unrad(Math.acos(x)) : Math.cos(rad(x)); break;
        case 'tan': r = hyp ? (inv ? Math.atanh(x) : Math.tanh(x)) : inv ? unrad(Math.atan(x)) : Math.tan(rad(x)); break;
        case 'int': r = inv ? x - Math.trunc(x) : Math.trunc(x); break;
        case 'not': r = ~Math.trunc(x); break;
        case 'pi': r = inv ? 2 * Math.PI : Math.PI; break;
        case 'dms': { if (inv) { const dd = Math.trunc(x), mm = Math.trunc((x - dd) * 100 + 1e-9), ss = ((x - dd) * 100 - mm) * 100; r = dd + mm / 60 + ss / 3600; } else { const dd = Math.trunc(x), mf = (x - dd) * 60, mm = Math.trunc(mf), ss = (mf - mm) * 60; r = dd + mm / 100 + ss / 10000; } break; }
      }
      if (Number.isNaN(r)) throw new Error('inv');
      if (Math.abs(r) < 1e-15 && /sin|cos|tan/.test(k)) r = 0; // sin(180) really is 0
      cur = r; typed = null;
      const ic = qs(b, '.pgc-inv'); if (ic && inv) { inv = false; ic.checked = false; }
      const hc = qs(b, '.pgc-hyp'); if (hc && hyp) { hyp = false; hc.checked = false; }
    }
    function eggs(before) {
      const r = cur;
      if (before === '1999' && !stack.length) {
        const t = today(), left = Math.round((new Date(2000, 0, 1) - t.date) / 86400000);
        secret('calc1999');
        msg('Calculator', `1999! The best year ever.\n\nOnly ${left} day${left === 1 ? '' : 's'} left until the year 2000 (if the Millennium Bug doesn't get us first).`, 'info');
      }
      if (before === '2000' && !stack.length) {
        secret('calcy2k'); err = 'Y2K ERROR: 1900'; show(); sfx('uhoh');
        setTimeout(() => { if (err.startsWith('Y2K')) { err = ''; cur = 1900; show(); toast('Calculator', 'Millennium Bug detected! 2000 rolled over to 1900. Please upgrade to JackOS 2000 (coming never).', 6000); } }, 1400);
      }
      if (r === 0.1 + 0.2 && r !== 0.3) { secret('calcfloat'); toast('Calculator', '0.1 + 0.2 = 0.30000000000000004? That\'s floating point, that is. Even computers are rubbish at fractions.', 7000); }
      if (/^4195835\/3145727$/.test(hist.replace(/\s/g, '')) || (Math.abs(r - 1.333820449136241) < 1e-12)) {
        secret('calcfdiv'); err = '1.333739068902037589'; show();
        setTimeout(() => { err = ''; show(); toast('Calculator', 'Oops, that was the 1994 Pentium FDIV bug. Your Pentium II has had it fixed. The real answer is 1.33382044913624...', 7000); }, 1500);
      }
      if (r === 7734 || r === 0.7734 || r === 77345 || r === 0.07734) { secret('calchello'); toast('Calculator', 'Turn your calculator upside down. It says hELLO! (The oldest joke in the playground.)', 6000); }
      if (r === 42) toast('Calculator', 'The answer to life, the universe and everything. (Now what was the question?)', 5000);
      if (r === 1337) toast('Calculator', '1337! You must be an elite hacker. Or Dave.', 4000);
      if (r === 3.14 || r === 3.1415 || r === 3.14159) toast('Calculator', 'Mmm, pie. (There is a pi button in Scientific mode, you know.)', 4000);
    }
    function fail(e) {
      if (e && e.message === 'div0') {
        err = 'Cannot divide by zero.'; stack = []; typed = null;
        if (secret('calcdiv0')) msg('Calculator', 'CALC caused a divide error in module JACKMATH.DLL at 0028:C0DE1999.\n\nGubbinz tried this once. He\'s still falling.', 'warn');
        sfx('uhoh');
      } else { err = 'Invalid input for function.'; typed = null; }
    }
    function press(k) {
      sfx('click');
      if (err && !['c', 'ce'].includes(k)) { err = ''; cur = 0; typed = null; stack = []; }
      try {
        if (/^[0-9A-F]$/.test(k)) {
          if (parseInt(k, 16) >= base) return;
          if (typed === null || typed === '0') typed = k; else if (typed.replace(/[-.]/g, '').length < 32) typed += k;
          justOp = false; hist += k;
        } else if (k === '.') {
          if (base !== 10) return;
          if (typed === null) typed = '0.'; else if (!typed.includes('.') && !typed.includes('e')) typed += '.';
          justOp = false; hist += '.';
        } else if (k === 'exp') { if (typed === null) typed = fmt(cur); if (!typed.includes('e')) typed += 'e+'; }
        else if (k === 'bs') { if (typed !== null) { typed = typed.slice(0, -1); if (typed === '' || typed === '-') typed = '0'; hist = hist.slice(0, -1); } }
        else if (k === 'ce') { typed = null; cur = 0; err = ''; }
        else if (k === 'c') { typed = null; cur = 0; stack = []; err = ''; lastOp = null; justOp = false; hist = ''; }
        else if (k === 'neg') { if (typed !== null) typed = typed.startsWith('-') ? typed.slice(1) : (typed === '0' ? typed : '-' + typed); else unary('neg'); }
        else if (k in PREC || k === 'pow') { binop(k); hist += k === '*' ? '*' : k === '/' ? '/' : k; }
        else if (k === '=') { const before = hist; equals(); justOp = false; eggs(before); hist = ''; }
        else if (k === '(') { stack.push({ paren: true }); typed = null; cur = 0; justOp = false; }
        else if (k === ')') { if (!stack.some(f => f.paren)) return; let v = val(); while (top() && !top().paren) { const f = stack.pop(); v = apply(f.v, f.op, v); } stack.pop(); cur = v; typed = null; }
        else if (k === 'mc') mem = 0;
        else if (k === 'mr') { cur = mem; typed = null; }
        else if (k === 'ms') { mem = val(); typed = null; cur = mem; }
        else if (k === 'mp') { mem += val(); typed = null; cur = val(); }
        else if (k === 'fe') { fe = !fe; if (typed !== null) { cur = val(); typed = null; } }
        else unary(k);
      } catch (e) { fail(e); }
      show();
      const kb = qs(b, `[data-k="${CSS.escape(k)}"]`); if (kb) { kb.classList.add('on'); setTimeout(() => kb.classList.remove('on'), 90); }
    }
    const KEYS = { Enter: '=', '=': '=', Escape: 'c', Delete: 'ce', Backspace: 'bs', ',': '.', '+': '+', '-': '-', '*': '*', '/': '/', '%': 'pct', '@': 'sqrt', r: 'inv1', F9: 'neg', '(': '(', ')': ')', '^': 'pow', p: 'pi', n: 'fact', s: 'sin', o: 'cos', t: 'tan', l: 'log', q: 'x2', '#': 'x3', '!': 'fact', '&': 'and', '|': 'or', '~': 'not', x: 'exp' };
    function feed(ch) { if (/^[0-9.]$/.test(ch)) press(ch); else if (/^[a-fA-F]$/.test(ch) && base === 16) press(ch.toUpperCase()); else if (KEYS[ch]) { if (sci || !['pi', 'fact', 'sin', 'cos', 'tan', 'log', 'x2', 'x3', '(', ')', 'pow', 'and', 'or', 'not', 'exp'].includes(KEYS[ch])) press(KEYS[ch]); } }
    on(w.el, 'keydown', ev => {
      if (ev.target.closest('input[type=text],textarea')) return;
      if (ev.ctrlKey && (ev.key === 'c' || ev.key === 'C')) { ev.preventDefault(); copy(); return; }
      if (ev.ctrlKey && (ev.key === 'v' || ev.key === 'V')) return; // the paste event handles it
      if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
      if (ev.key === 'Escape') { ev.stopPropagation(); }
      if (/^[0-9.]$/.test(ev.key) || KEYS[ev.key] || (base === 16 && /^[a-fA-F]$/.test(ev.key))) { ev.preventDefault(); feed(ev.key); }
    });
    on(w.el, 'paste', ev => { const t = (ev.clipboardData && ev.clipboardData.getData('text')) || ''; if (!t) return; ev.preventDefault(); pasteText(t); });
    function pasteText(t) { for (const ch of t.slice(0, 200)) { if (ch === 'c' || ch === 'C') { if (base !== 16) press('c'); else feed(ch); } else if (ch === 'e') press('exp'); else feed(ch); } }
    function copy() { const s = err ? '' : (typed !== null ? typed : fmt(cur)); Clip.set(s || '0'); toast('Calculator', `Copied ${s || '0'} to the Clipboard.`, 2000); }
    A.menubar(w, [
      ['Edit', [{ label: 'Copy', key: 'Ctrl+C', act: copy }, { label: 'Paste', key: 'Ctrl+V', act: () => Clip.read().then(t => t ? pasteText(t) : toast('Calculator', 'The Clipboard is empty (or JackOS isn\'t allowed to look). Try Ctrl+V.')) }]],
      ['View', () => [{ label: 'Standard', rad: !sci, act: () => { sci = false; base = 10; store.set('jhp_prog_calcsci', false); layout(); } }, { label: 'Scientific', rad: sci, act: () => { sci = true; store.set('jhp_prog_calcsci', true); layout(); } }, '-', { label: 'Digit grouping', chk: group, act: () => { group = !group; show(); } }]],
      ['Help', [{ label: 'Help Topics', act: () => Desk.notepad('Calculator Help.txt', CALC_HELP) }, '-', { label: 'About Calculator', act: () => msg('About Calculator', `JackOS Calculator\nVersion 4.10.1999\n\nThis product is licensed to:\n${nick()}\n\nPhysical memory available to JackOS: 65,536 KB\nSystem resources: 42% free\n\nCan count to 999,999,999,999,999,999,999,999,999,999,999.\nCannot do your maths homework for you.`, 'info') }]],
    ]);
    // the display, memory and the sum half done are kept (js/gamesave.js): the next Calculator opened carries on
    const sv = A.gameSaver ? A.gameSaver('calc', () => (err || (cur === 0 && typed === null && !stack.length && !mem)) ? null : { cur, typed, stack, lastOp, lastArg, mem, justOp, hist, base: sci ? base : 10, ang, group, fe }, { v: 1, delay: 400 }).watch(w) : null;
    const kept = sv && sv.load();
    if (kept && typeof kept.cur === 'number') {
      cur = kept.cur; typed = typeof kept.typed === 'string' ? kept.typed : null; stack = Array.isArray(kept.stack) ? kept.stack : []; lastOp = kept.lastOp || null; lastArg = +kept.lastArg || 0;
      mem = +kept.mem || 0; justOp = !!kept.justOp; hist = String(kept.hist || ''); base = [2, 8, 10, 16].includes(kept.base) ? kept.base : 10; ang = kept.ang || ang; group = !!kept.group; fe = !!kept.fe;
    }
    layout();
    setTimeout(() => w.el.focus({ preventScroll: true }), 30);
    return w;
  } });
  const CALC_HELP = `CALCULATOR HELP
===============

Click the buttons, or type on your keyboard:

  0-9 and .       numbers (comma works too)
  + - * /         add, take away, times, divide
  Enter or =      equals (press it again to repeat the last sum!)
  Esc             C  (clear everything)
  Delete          CE (clear what you just typed)
  Backspace       rub out the last digit
  %               percent      @   square root
  r               1/x          F9  +/-

Memory: MS stores the number, MR brings it back, M+ adds to it,
MC forgets it. An M appears in the little box when something is stored.

View > Scientific gives you sin, cos, tan, x^y, n!, logs, brackets,
and Hex/Oct/Bin for proper computer nerds. In Scientific mode the
sums do times and divide first (BODMAS!). In Standard mode it just
goes left to right, like a real pocket calculator.

Edit > Copy and Paste use the Clipboard. You can paste a whole
sum like 12*3= and it types it in for you.

Tip: some numbers do funny things. Try a few.
`;

  // ================================================================ PAINT
  const PAL = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
    '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'];
  const PW = 480, PH = 320;
  const TOOLS = [
    ['pencil', 'Pencil', '<path d="M3 13l1-3 7-7 2 2-7 7z" fill="#ffd400" stroke="#000" stroke-width=".8"/><path d="M3 13l1-3 2 2z" fill="#000"/>'],
    ['brush', 'Brush', '<path d="M13 2l1 1-5 6-2-1z" fill="#8a4a1a" stroke="#000" stroke-width=".6"/><path d="M7 8c-2 0-4 1-4 4 0 1-1 2-2 2 3 1 7 0 7-4z" fill="#0028c8" stroke="#000" stroke-width=".6"/>'],
    ['airbrush', 'Airbrush', '<rect x="6" y="6" width="6" height="9" rx="1" fill="#c0c0c0" stroke="#000" stroke-width=".7"/><rect x="7.5" y="3.5" width="3" height="2.5" fill="#000"/><g fill="#e10600"><circle cx="3" cy="2" r=".7"/><circle cx="5" cy="1.5" r=".7"/><circle cx="2" cy="4" r=".7"/><circle cx="4.5" cy="3.6" r=".7"/><circle cx="1.5" cy="6.3" r=".7"/></g>'],
    ['eraser', 'Eraser/Color Eraser', '<path d="M2 11l6-6 6 4-5 5H5z" fill="#fff" stroke="#000" stroke-width=".8"/><path d="M8 5l6 4v2l-6-4z" fill="#ff9ac0" stroke="#000" stroke-width=".6"/>'],
    ['fill', 'Fill With Color', '<path d="M3 8l5-5 5 5-5 5z" fill="#fff" stroke="#000" stroke-width=".8"/><path d="M5.5 10.5L8 8" stroke="#000" stroke-width=".6"/><path d="M13 8c1 2 2 3 1.5 4s-2 .5-2-1z" fill="#0028c8"/>'],
    ['picker', 'Pick Color', '<path d="M2 14l1-3 6-6 2 2-6 6z" fill="#fff" stroke="#000" stroke-width=".8"/><path d="M9 5l2-2 2 2-2 2z" fill="#000"/><path d="M2.5 13.5l1-1" stroke="#0028c8" stroke-width="1.6"/>'],
    ['text', 'Text', '<path d="M4 14L8 2l4 12M5.5 10h5" stroke="#000" stroke-width="1.6" fill="none"/>'],
    ['line', 'Line', '<path d="M2 14L14 2" stroke="#000" stroke-width="1.5"/>'],
    ['rect', 'Rectangle', '<rect x="2" y="4" width="12" height="8" fill="none" stroke="#000" stroke-width="1.2"/>'],
    ['ellipse', 'Ellipse', '<ellipse cx="8" cy="8" rx="6" ry="4.5" fill="none" stroke="#000" stroke-width="1.2"/>'],
    ['rrect', 'Rounded Rectangle', '<rect x="2" y="4" width="12" height="8" rx="3" fill="none" stroke="#000" stroke-width="1.2"/>'],
    ['stamp', 'Blobbit Stamp', '<circle cx="4.5" cy="4" r="1.6" fill="#e8381b" stroke="#5a0a00" stroke-width=".6"/><circle cx="11.5" cy="4" r="1.6" fill="#e8381b" stroke="#5a0a00" stroke-width=".6"/><ellipse cx="8" cy="9" rx="6.2" ry="5.4" fill="#e8381b" stroke="#5a0a00" stroke-width=".7"/><ellipse cx="5.6" cy="6.6" rx="1.4" ry=".8" fill="#ff9a7a"/><ellipse cx="6.2" cy="8.4" rx="1.2" ry="1.5" fill="#fff"/><ellipse cx="9.8" cy="8.4" rx="1.2" ry="1.5" fill="#fff"/><circle cx="6.5" cy="8.8" r=".65"/><circle cx="10.1" cy="8.8" r=".65"/><path d="M6.6 11.2q1.4 1.1 2.8 0" stroke="#5a0a00" stroke-width=".7" fill="none"/>'],
  ];
  // a Blobbit, as pixel art (r = red, R = shine, d = dark outline, w = eye white, k = pupil, p = rosy cheek)
  const SQUIG = ['..dd......dd..', '.dRRd....drrd.', '.drRddddddrrd.', 'drRRrrrrrrrrrd', 'drRwwrrrrwwrrd', 'drrwkrrrrwkrrd', 'drpwkrrrrwkprd', 'drrrrrrrrrrrrd', '.drrrdrrdrrrd.', '..drrrddrrrd..', '...dddddddd...', '...dd....dd...'];
  const SQC = { r: '#e8381b', R: '#ff9a7a', d: '#5a0a00', k: '#000000', w: '#ffffff', p: '#ffb0c0' };
  const PICS_KEY = 'jhp_prog_pics';
  const loadPics = () => store.get(PICS_KEY, []);
  function savePics(list) { try { localStorage.setItem(PICS_KEY, JSON.stringify(list)); return true; } catch (e) { return false; } }
  function picNode(p) { return { name: p.name, type: 'png', dataURL: p.data, date: p.date || d99(), size: '451 KB', painted: true }; }
  function syncPicFiles() {
    const dir = A.fs.dir('C:/My Documents/My Pictures');
    dir.kids = dir.kids.filter(k => !k.painted);
    loadPics().forEach(p => dir.kids.push(picNode(p)));
  }
  // a couple of pictures Jack already drew (made on demand so loading the site stays quick)
  function pixelArt(rows, pal, scale, bg) {
    const c = document.createElement('canvas'); c.width = PW; c.height = PH; const x = c.getContext('2d');
    x.fillStyle = bg || '#fff'; x.fillRect(0, 0, PW, PH);
    const ox = Math.floor((PW - rows[0].length * scale) / 2), oy = Math.floor((PH - rows.length * scale) / 2);
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(ox + i * scale, oy + j * scale, scale, scale); } }));
    return c;
  }
  const ORK_ART = ['....kkkkkkkkkk....', '...kggggggggggk...', '..kggggggggggggk..', 'kkggrrggggggrrggkk', 'kgggrrggggggrrgggk', '.kggggggggggggggk.', '..kggggkkkkggggk..', '..kgwkwkwkwkwkgk..', '..kggwkwkwkwkggk..', '...kggggggggggk...', '....kkkkkkkkkk....'];
  function premade() {
    const dir = A.fs.dir('C:/My Documents/My Pictures');
    const lazy = (name, make, date) => { const n = { name, type: 'png', date, size: '451 KB' }; let u = null; Object.defineProperty(n, 'dataURL', { get() { if (!u) { try { u = make().toDataURL(); } catch (e) { u = ''; } } return u; }, enumerable: true }); if (!dir.kids.some(k => k.name.toLowerCase() === name.toLowerCase())) dir.kids.push(n); };
    lazy('ork_doodle.bmp', () => { const c = pixelArt(ORK_ART, { k: '#000', g: '#3a9a2a', r: '#e10600', w: '#fff' }, 16, '#ffffe0'); const x = c.getContext('2d'); x.fillStyle = '#000'; x.font = 'bold 20px Comic Sans MS, cursive'; x.fillText('MY ORK BY JACK (age secret)', 60, 300); return c; }, '14/02/99');
    lazy('squig.bmp', () => { const c = pixelArt(SQUIG, SQC, 20, '#80ffff'); const x = c.getContext('2d'); x.fillStyle = '#000'; x.font = 'bold 18px Arial, sans-serif'; x.fillText('Blobbit (do not feed after midnight)', 90, 30); return c; }, '02/05/99');
  }

  A.register('mspaint', { cmd: ['mspaint', 'paint', 'pbrush'], open(arg) {
    const b = h('', 'pgp');
    b.innerHTML = `<div class="pgp-main"><div class="pgp-tools"><div class="pgp-tgrid">${TOOLS.map(([id, name, svg]) => `<button class="pgp-t" data-t="${id}" title="${name}" aria-label="${name}"><svg viewBox="0 0 16 16" width="16" height="16">${svg}</svg></button>`).join('')}</div><div class="pgp-opts"></div></div>
      <div class="pgp-area"><div class="pgp-wrap"><canvas class="pgp-c" width="${PW}" height="${PH}"></canvas><canvas class="pgp-o" width="${PW}" height="${PH}"></canvas></div></div></div>
      <div class="pgp-pal"><button class="pgp-cur" title="Click to swap colours" aria-label="Swap colours"><i class="bg"></i><i class="fg"></i></button><div class="pgp-cols">${PAL.map((c, i) => `<button class="pgp-col" data-c="${i}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}</div></div>`;
    const w = A.win('untitled - Paint', b, { w: 620, h: 520, icon: I.paint, menubar: true, status: true, minW: 300, minH: 300 });
    w.status.parentNode.insertAdjacentHTML('beforeend', '<span class="pgp-xy" style="flex:0 0 90px"></span>');
    const xyEl = qs(w.el, '.pgp-xy');
    const cv = qs(b, '.pgp-c'), ov = qs(b, '.pgp-o'), wrap = qs(b, '.pgp-wrap'), area = qs(b, '.pgp-area');
    const ctx = cv.getContext('2d', { willReadFrequently: true }), octx = ov.getContext('2d');
    let textBox = null, tool = 'pencil', prevTool = 'pencil', fg = '#000000', bg = '#ffffff', name = 'untitled', dirty = false;
    const opt = { brush: 1, eraser: 1, air: 1, line: 0, shape: 0, text: 1, stamp: 1 };
    const used = new Set(store.get('jhp_prog_painttools', []));
    let undo = [], redo = [], squigs = 0;
    const HELP = 'For Help, click Help Topics on the Help Menu.';
    w.status.textContent = HELP;
    function clear(col) { ctx.fillStyle = col || bg; ctx.fillRect(0, 0, PW, PH); }
    clear('#ffffff');
    let psv = null; // (the autosave, set up at the end)
    const snap = () => { undo.push(ctx.getImageData(0, 0, PW, PH)); if (undo.length > 25) undo.shift(); redo = []; dirty = true; if (psv) psv.save(); };
    function doUndo() { if (!undo.length) return; redo.push(ctx.getImageData(0, 0, PW, PH)); ctx.putImageData(undo.pop(), 0, 0); }
    function doRedo() { if (!redo.length) return; undo.push(ctx.getImageData(0, 0, PW, PH)); ctx.putImageData(redo.pop(), 0, 0); }
    function title() { w.setTitle(name + ' - Paint'); }
    function usedTool(t) { if (used.has(t)) return; used.add(t); store.set('jhp_prog_painttools', [...used]); if (used.size >= TOOLS.length) { secret('paintall'); toast('Paint', 'You have used every single tool. Jack would like you to paint his bedroom next.', 6000); } }

    // ---- scale the canvas down to fit (phones), never up
    function fit() { const avail = area.clientWidth - 8; const s = Math.min(1, avail / PW); wrap.style.width = Math.floor(PW * s) + 'px'; wrap.style.height = Math.floor(PH * s) + 'px'; b.classList.toggle('narrow', b.clientWidth < 470); }
    const ro = window.ResizeObserver ? new ResizeObserver(fit) : null; if (ro) ro.observe(b); else on(window, 'resize', fit);
    setTimeout(fit, 0);

    // ---- colours
    function colours() { qs(b, '.pgp-cur .fg').style.background = fg; qs(b, '.pgp-cur .bg').style.background = bg; }
    qsa(b, '.pgp-col').forEach(e => {
      on(e, 'click', () => { fg = PAL[e.dataset.c]; colours(); });
      on(e, 'contextmenu', ev => { ev.preventDefault(); bg = PAL[e.dataset.c]; colours(); });
      on(e, 'dblclick', () => editColour(+e.dataset.c));
    });
    tap(qs(b, '.pgp-cur'), () => { [fg, bg] = [bg, fg]; colours(); });
    colours();
    function editColour(i) {
      const c = PAL[i], rgb = [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16));
      const d = dialog('Edit Colors', `<div class="row" style="gap:10px;align-items:flex-start"><div class="pgp-ecprev field" style="width:60px;height:60px;background:${c}"></div><div>${['Red', 'Green', 'Blue'].map((n, j) => `<label class="row" style="flex-wrap:nowrap">${n}:<input type="range" min="0" max="255" value="${rgb[j]}" data-j="${j}" style="width:150px"><span class="pgp-ecv">${rgb[j]}</span></label>`).join('')}</div></div>`,
        [['OK', bx => { PAL[i] = hex(); qs(b, `.pgp-col[data-c="${i}"]`).style.background = PAL[i]; fg = PAL[i]; colours(); }], ['Cancel']], { w: 300, icon: I.paint });
      const hex = () => '#' + qsa(d.b, 'input').map(r => (+r.value).toString(16).padStart(2, '0')).join('');
      qsa(d.b, 'input').forEach(r => on(r, 'input', () => { r.nextElementSibling.textContent = r.value; qs(d.b, '.pgp-ecprev').style.background = hex(); }));
    }

    // ---- tool options box
    const OPTS = {
      brush: () => [0, 1, 2, 3].map(i => `<button data-o="brush" data-v="${i}"><i class="dot" style="width:${2 + i * 2}px;height:${2 + i * 2}px"></i></button>`).join(''),
      eraser: () => [0, 1, 2, 3].map(i => `<button data-o="eraser" data-v="${i}"><i class="sq" style="width:${4 + i * 2}px;height:${4 + i * 2}px"></i></button>`).join(''),
      air: () => [0, 1, 2].map(i => `<button data-o="air" data-v="${i}"><i class="spray">${'.'.repeat(3 + i * 2)}</i></button>`).join(''),
      line: () => [0, 1, 2, 3, 4].map(i => `<button data-o="line" data-v="${i}"><i class="ln" style="height:${i + 1}px"></i></button>`).join(''),
      shape: () => ['outline', 'outline + fill', 'fill'].map((n, i) => `<button data-o="shape" data-v="${i}" title="${n}"><i class="shp s${i}"></i></button>`).join(''),
      text: () => ['10', '14', '20', '28'].map((n, i) => `<button data-o="text" data-v="${i}">${n}pt</button>`).join(''),
      stamp: () => ['1x', '2x', '3x'].map((n, i) => `<button data-o="stamp" data-v="${i}">${n}</button>`).join(''),
    };
    const optFor = t => ({ brush: 'brush', eraser: 'eraser', airbrush: 'air', line: 'line', rect: 'shape', ellipse: 'shape', rrect: 'shape', text: 'text', stamp: 'stamp' }[t]);
    function renderOpts() {
      const o = optFor(tool), box = qs(b, '.pgp-opts');
      box.innerHTML = o ? OPTS[o]() : '';
      qsa(box, 'button').forEach(e => { if (+e.dataset.v === opt[e.dataset.o]) e.classList.add('on'); tap(e, () => { opt[e.dataset.o] = +e.dataset.v; renderOpts(); }); });
    }
    function setTool(t) { if (t !== 'picker') prevTool = tool === 'picker' ? prevTool : tool; tool = t; qsa(b, '.pgp-t').forEach(e => e.classList.toggle('on', e.dataset.t === t)); renderOpts(); commitText(); wrap.dataset.tool = t; w.status.textContent = TOOLS.find(x => x[0] === t)[1] + ': ' + ({ pencil: 'Draws a free-form line one pixel wide.', brush: 'Draws using a brush with the selected shape and size.', airbrush: 'Draws using an airbrush of the selected size.', eraser: 'Erases a portion of the picture, using the selected eraser shape.', fill: 'Fills an area with the current drawing color.', picker: 'Picks up a color from the picture for drawing.', text: 'Inserts text into the picture.', line: 'Draws a straight line with the selected line width.', rect: 'Draws a rectangle with the selected fill style.', ellipse: 'Draws an ellipse with the selected fill style.', rrect: 'Draws a rounded rectangle with the selected fill style.', stamp: 'Stamps a Blobbit. Blobbits not included. Actually they are.' }[t]); }
    qsa(b, '.pgp-t').forEach(e => tap(e, () => setTool(e.dataset.t)));
    setTool('pencil');

    // ---- pixel helpers (everything is aliased, like real 1999 Paint)
    const rgbOf = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    function lineP(x0, y0, x1, y1, plot) { const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (let n = 0; n < 4000; n++) { plot(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
    function disc(c, x, y, r, col) { c.fillStyle = col; if (r <= 0) { c.fillRect(x, y, 1, 1); return; } for (let j = -r; j <= r; j++) { const hw = Math.floor(Math.sqrt(r * r - j * j + r * 0.8)); c.fillRect(x - hw, y + j, hw * 2 + 1, 1); } }
    function square(c, x, y, s, col) { c.fillStyle = col; c.fillRect(x - Math.floor(s / 2), y - Math.floor(s / 2), s, s); }
    function shapeInside(kind, L, T, R, B2) {
      const W = R - L + 1, H = B2 - T + 1;
      if (kind === 'rect') return (x, y, k) => x >= L + k && x <= R - k && y >= T + k && y <= B2 - k;
      if (kind === 'ellipse') return (x, y, k) => { const rx = W / 2 - k, ry = H / 2 - k; if (rx <= 0 || ry <= 0) return false; const dx = (x + 0.5 - (L + W / 2)) / rx, dy = (y + 0.5 - (T + H / 2)) / ry; return dx * dx + dy * dy <= 1; };
      const rad = Math.min(10, W / 2, H / 2);
      return (x, y, k) => { const l = L + k, t = T + k, r = R - k, bt = B2 - k, rr = Math.max(0, rad - k); if (x < l || x > r || y < t || y > bt) return false; const cx = x < l + rr ? l + rr : x > r - rr ? r - rr : x, cy = y < t + rr ? t + rr : y > bt - rr ? bt - rr : y; const dx = x - cx, dy = y - cy; return dx * dx + dy * dy <= rr * rr + rr * 0.6; };
    }
    function drawShape(c, kind, x0, y0, x1, y1, a, bcol, toMain) {
      const L = Math.max(0, Math.min(x0, x1)), R = Math.min(PW - 1, Math.max(x0, x1)), T = Math.max(0, Math.min(y0, y1)), B2 = Math.min(PH - 1, Math.max(y0, y1));
      if (R < L || B2 < T) return;
      const ins = shapeInside(kind, Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)), lw = 1 + opt.line, mode = opt.shape;
      const img = toMain ? c.getImageData(L, T, R - L + 1, B2 - T + 1) : c.createImageData(R - L + 1, B2 - T + 1), d = img.data;
      const ca = rgbOf(a), cb = rgbOf(bcol);
      for (let y = T; y <= B2; y++) for (let x = L; x <= R; x++) {
        if (!ins(x, y, 0)) continue;
        const inner = ins(x, y, lw);
        let col = null;
        if (mode === 2) col = ca; else if (!inner) col = ca; else if (mode === 1) col = cb;
        if (!col) continue;
        const i = ((y - T) * (R - L + 1) + (x - L)) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      }
      c.putImageData(img, L, T);
    }
    function flood(x, y, col) {
      const img = ctx.getImageData(0, 0, PW, PH), d = img.data, i0 = (y * PW + x) * 4;
      const t = [d[i0], d[i0 + 1], d[i0 + 2]], c = rgbOf(col);
      if (t[0] === c[0] && t[1] === c[1] && t[2] === c[2]) return false;
      const same = i => d[i] === t[0] && d[i + 1] === t[1] && d[i + 2] === t[2] && d[i + 3] === 255;
      const st = [[x, y]];
      while (st.length) {
        let [px, py] = st.pop(); let i = (py * PW + px) * 4;
        while (px >= 0 && same(i)) { px--; i -= 4; }
        px++; i += 4; let up = false, dn = false;
        while (px < PW && same(i)) {
          d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
          if (py > 0) { const s = same(i - PW * 4); if (s && !up) { st.push([px, py - 1]); up = true; } else if (!s) up = false; }
          if (py < PH - 1) { const s = same(i + PW * 4); if (s && !dn) { st.push([px, py + 1]); dn = true; } else if (!s) dn = false; }
          px++; i += 4;
        }
      }
      ctx.putImageData(img, 0, 0); return true;
    }
    function stamp(x, y, s) { const sc = s + 1, w0 = SQUIG[0].length * sc, h0 = SQUIG.length * sc; SQUIG.forEach((r, j) => [...r].forEach((ch, i) => { if (SQC[ch]) { ctx.fillStyle = SQC[ch]; ctx.fillRect(x - (w0 >> 1) + i * sc, y - (h0 >> 1) + j * sc, sc, sc); } })); }

    // ---- text tool: a little box you type in, stamped onto the picture when you click elsewhere
    function commitText() {
      if (!textBox) return; const tb = textBox; textBox = null;
      const v = tb.input.value; tb.input.remove();
      if (!v.trim()) return;
      snap(); ctx.fillStyle = tb.col; ctx.font = `${tb.size}px Tahoma, Arial, sans-serif`; ctx.textBaseline = 'top';
      v.split('\n').forEach((ln, i) => ctx.fillText(ln, tb.x, tb.y + i * tb.size * 1.2));
      usedTool('text');
    }
    function placeText(x, y, col) {
      commitText();
      const size = [10, 14, 20, 28][opt.text] * 1.333 | 0, s = wrap.clientWidth / PW;
      const inp = document.createElement('textarea'); inp.className = 'pgp-text'; inp.rows = 1; inp.spellcheck = false;
      Object.assign(inp.style, { left: x * s + 'px', top: y * s + 'px', font: `${size * s}px Tahoma, Arial, sans-serif`, color: col, width: Math.min(220, (PW - x) * s) + 'px', height: (size * 1.5 * s + 6) + 'px' });
      wrap.appendChild(inp); textBox = { input: inp, x, y, col, size };
      on(inp, 'input', () => { inp.style.height = 'auto'; inp.style.height = inp.scrollHeight + 'px'; });
      on(inp, 'keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { inp.value = ''; commitText(); } });
      setTimeout(() => inp.focus(), 0);
    }

    // ---- the drawing itself
    let down = null, airT = 0;
    const posOf = ev => { const r = cv.getBoundingClientRect(); return [clamp(Math.floor((ev.clientX - r.left) * PW / r.width), 0, PW - 1), clamp(Math.floor((ev.clientY - r.top) * PH / r.height), 0, PH - 1)]; };
    on(cv.parentNode, 'contextmenu', ev => ev.preventDefault());
    on(ov, 'pointerdown', ev => {
      if (ev.button > 2 || ev.button === 1) return;
      ev.preventDefault();
      const [x, y] = posOf(ev), right = ev.button === 2, a = right ? bg : fg, z = right ? fg : bg;
      if (tool === 'text') { placeText(x, y, a); return; }
      commitText();
      if (tool === 'picker') { const p = ctx.getImageData(x, y, 1, 1).data; const c = '#' + [p[0], p[1], p[2]].map(v => v.toString(16).padStart(2, '0')).join(''); if (right) bg = c; else fg = c; colours(); usedTool('picker'); setTool(prevTool); return; }
      if (tool === 'fill') { const before = ctx.getImageData(0, 0, PW, PH); if (flood(x, y, a)) { undo.push(before); if (undo.length > 25) undo.shift(); redo = []; dirty = true; usedTool('fill'); } return; }
      snap();
      ov.setPointerCapture(ev.pointerId);
      down = { x0: x, y0: y, x, y, a, z };
      if (tool === 'pencil') { ctx.fillStyle = a; ctx.fillRect(x, y, 1, 1); }
      else if (tool === 'brush') disc(ctx, x, y, opt.brush, a);
      else if (tool === 'eraser') square(ctx, x, y, 4 + opt.eraser * 2 + 2, z);
      else if (tool === 'stamp') { stamp(x, y, opt.stamp); if (++squigs === 25) { secret('paintsquig'); toast('Paint', '25 Blobbits! That\'s a whole herd. Gubbinz wants one as a pet.'); } }
      else if (tool === 'airbrush') { const spray = () => { if (!down) return; const r = [4, 8, 12][opt.air]; ctx.fillStyle = down.a; for (let i = 0; i < 6 + opt.air * 4; i++) { const ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * r; ctx.fillRect(Math.round(down.x + Math.cos(ang) * rr), Math.round(down.y + Math.sin(ang) * rr), 1, 1); } }; spray(); airT = setInterval(spray, 30); }
    });
    on(ov, 'pointermove', ev => {
      const [x, y] = posOf(ev); xyEl.textContent = x + ',' + y;
      if (!down) return;
      const px = down.x, py = down.y; down.x = x; down.y = y;
      if (tool === 'pencil') { ctx.fillStyle = down.a; lineP(px, py, x, y, (u, v) => ctx.fillRect(u, v, 1, 1)); }
      else if (tool === 'brush') lineP(px, py, x, y, (u, v) => disc(ctx, u, v, opt.brush, down.a));
      else if (tool === 'eraser') lineP(px, py, x, y, (u, v) => square(ctx, u, v, 4 + opt.eraser * 2 + 2, down.z));
      else if (tool === 'line') { octx.clearRect(0, 0, PW, PH); const lw = opt.line + 1; lineP(down.x0, down.y0, x, y, (u, v) => square(octx, u, v, lw, down.a)); }
      else if (['rect', 'ellipse', 'rrect'].includes(tool)) { octx.clearRect(0, 0, PW, PH); let [x1, y1] = [x, y]; if (ev.shiftKey) { const s = Math.max(Math.abs(x - down.x0), Math.abs(y - down.y0)); x1 = down.x0 + Math.sign(x - down.x0 || 1) * s; y1 = down.y0 + Math.sign(y - down.y0 || 1) * s; } down.x1 = x1; down.y1 = y1; drawShape(octx, tool, down.x0, down.y0, x1, y1, down.a, down.z, false); }
      w.status.textContent = (tool === 'line' || /rect|ellipse/.test(tool)) ? `${Math.abs(x - down.x0) + 1}x${Math.abs(y - down.y0) + 1}` : w.status.textContent;
    });
    const up = ev => {
      if (!down) return;
      clearInterval(airT);
      const d = down; down = null; octx.clearRect(0, 0, PW, PH);
      if (tool === 'line') { const lw = opt.line + 1; lineP(d.x0, d.y0, d.x, d.y, (u, v) => square(ctx, u, v, lw, d.a)); }
      else if (['rect', 'ellipse', 'rrect'].includes(tool)) drawShape(ctx, tool, d.x0, d.y0, d.x1 != null ? d.x1 : d.x, d.y1 != null ? d.y1 : d.y, d.a, d.z, true);
      usedTool(tool);
    };
    on(ov, 'pointerup', up); on(ov, 'pointercancel', up);
    on(ov, 'pointerleave', () => { xyEl.textContent = ''; });

    // ---- image operations
    function transform(fn) { commitText(); snap(); const t = document.createElement('canvas'); t.width = PW; t.height = PH; t.getContext('2d').drawImage(cv, 0, 0); ctx.save(); fn(ctx); ctx.drawImage(t, 0, 0); ctx.restore(); }
    function invert() { commitText(); snap(); const img = ctx.getImageData(0, 0, PW, PH), d = img.data; for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; } ctx.putImageData(img, 0, 0); }
    function mono() { snap(); const img = ctx.getImageData(0, 0, PW, PH), d = img.data; for (let i = 0; i < d.length; i += 4) { const v = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) > 127 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; } ctx.putImageData(img, 0, 0); }
    function flipDlg() {
      dialog('Flip and Rotate', `<div class="group"><span class="lg">Flip or rotate</span><label style="display:block"><input type="radio" name="pgpf" value="h" checked> Flip <u>h</u>orizontal</label><label style="display:block"><input type="radio" name="pgpf" value="v"> Flip <u>v</u>ertical</label><label style="display:block"><input type="radio" name="pgpf" value="r"> <u>R</u>otate by angle 180&deg;</label></div>`,
        [['OK', bx => { const v = qs(bx, 'input:checked').value; transform(c => { if (v === 'h') { c.translate(PW, 0); c.scale(-1, 1); } else if (v === 'v') { c.translate(0, PH); c.scale(1, -1); } else { c.translate(PW, PH); c.scale(-1, -1); } }); }], ['Cancel']], { w: 260, icon: I.paint });
    }
    function attributes() {
      dialog('Attributes', `<p style="margin:0 0 6px">File last saved: ${name === 'untitled' ? 'Not Available' : d99()}<br>Size on disk: 451,254 bytes<br>Resolution: 72 x 72 dots per inch</p><div class="row"><label>Width: <input type="text" value="${PW}" size="4" readonly></label><label>Height: <input type="text" value="${PH}" size="4" readonly></label></div><div class="group"><span class="lg">Colors</span><label><input type="radio" name="pgpc" value="bw"> Black and white</label> <label><input type="radio" name="pgpc" value="col" checked> Colors</label></div><p class="small" style="margin:4px 0 0">(The picture is always ${PW} by ${PH}. Any bigger and it won't fit on a floppy.)</p>`,
        [['OK', bx => { if (qs(bx, 'input[value=bw]').checked) msg('Paint', 'Converting to black and white will lose colour information. This cannot be undone. (Well, it can. Ctrl+Z.)', 'q', [['OK', mono], ['Cancel']]); }], ['Cancel']], { w: 300, icon: I.paint });
    }
    // ---- files
    function load(node) {
      const im = new Image();
      im.onload = () => { snap(); clear('#fff'); ctx.drawImage(im, 0, 0); name = node.name; dirty = false; title(); undo = []; };
      im.src = node.dataURL;
    }
    function saveAs(cb) {
      Desk.ask('Save As', 'File name (it goes in My Pictures):', name === 'untitled' ? 'masterpiece' : name.replace(/\.bmp$/i, ''), 24, v => {
        v = String(v || '').trim().replace(/[\\/:*?"<>|]/g, '').toLowerCase(); if (!v) return;
        name = /\.bmp$/.test(v) ? v : v + '.bmp'; doSave(cb);
      });
    }
    function doSave(cb) {
      if (name === 'untitled') return saveAs(cb);
      commitText();
      const data = cv.toDataURL('image/png');
      let list = loadPics().filter(p => p.name !== name);
      list.unshift({ name, data, date: d99() });
      while (list.length > 15) list.pop();
      let ok = savePics(list);
      while (!ok && list.length > 1) { list.pop(); ok = savePics(list); }
      if (!ok) { msg('Paint', `There is not enough disk space to save ${name}. Try deleting some of Dave's shareware.`, 'warn'); return; }
      syncPicFiles(); dirty = false; title();
      toast('Paint', `Saved C:\\My Documents\\My Pictures\\${name}`, 2500);
      if (cb) cb();
    }
    function openDlg() {
      const pics = A.fs.dir('C:/My Documents/My Pictures').kids.filter(k => k.type === 'png');
      if (!pics.length) return msg('Open', 'There are no pictures in My Pictures yet. Draw one and save it!', 'info');
      const d = dialog('Open', `<div>Look in: <b>My Pictures</b></div><div class="field pgp-open">${pics.map((p, i) => `<button class="pgp-oi" data-i="${i}"><img alt="" src="" data-i="${i}"><span>${esc(p.name)}</span></button>`).join('')}</div>`,
        [['Open', bx => { const s = qs(bx, '.pgp-oi.sel'); if (!s) return false; load(pics[+s.dataset.i]); }], ['Delete', bx => { const s = qs(bx, '.pgp-oi.sel'); if (!s || !pics[+s.dataset.i].painted) { toast('Paint', s ? 'That picture is read-only. Jack drew it and he is very proud of it.' : 'Pick a picture first.'); return false; } savePics(loadPics().filter(p => p.name !== pics[+s.dataset.i].name)); syncPicFiles(); }], ['Cancel']], { w: 380, icon: I.paint });
      qsa(d.b, '.pgp-oi').forEach(e => { qs(e, 'img').src = pics[+e.dataset.i].dataURL; tap(e, () => { qsa(d.b, '.pgp-oi').forEach(x => x.classList.toggle('sel', x === e)); }); on(e, 'dblclick', () => { load(pics[+e.dataset.i]); d.w.close(); }); });
    }
    function confirmLose(then) { if (!dirty) return then(); msg('Paint', `Save changes to ${name}?`, 'q', [['Yes', () => doSave(then)], ['No', then], ['Cancel']]); }
    function wallpaper(mode) { commitText(); setWall({ img: cv.toDataURL('image/png'), mode, col: '#008080' }); secret('paintwall'); toast('Paint', 'Your picture is now the desktop wallpaper. Mom says it\'s lovely.', 3000); }
    A.menubar(w, [
      ['File', [{ label: 'New', key: 'Ctrl+N', act: () => confirmLose(() => { clear('#fff'); undo = []; redo = []; name = 'untitled'; dirty = false; title(); }) }, { label: 'Open...', key: 'Ctrl+O', act: () => confirmLose(openDlg) }, { label: 'Save', key: 'Ctrl+S', act: () => doSave() }, { label: 'Save As...', act: () => saveAs() }, '-', { label: 'Print Preview', act: () => msg('Paint', 'Printer: out of cyan. Always out of cyan.', 'warn') }, { label: 'Print...', key: 'Ctrl+P', act: () => msg('Print', 'Printing to Epson... the printer made a grinding noise and ate the paper.', 'warn') }, '-', { label: 'Set As Wallpaper (Tiled)', act: () => wallpaper('Tile') }, { label: 'Set As Wallpaper (Centered)', act: () => wallpaper('Center') }, '-', { label: 'Exit', act: () => w.close() }]],
      ['Edit', () => [{ label: 'Undo', key: 'Ctrl+Z', dis: !undo.length, act: doUndo }, { label: 'Repeat', key: 'Ctrl+Y', dis: !redo.length, act: doRedo }, '-', { label: 'Copy To Clipboard', act: () => { try { cv.toBlob(bl => { try { navigator.clipboard.write([new ClipboardItem({ 'image/png': bl })]).then(() => toast('Paint', 'Picture copied to the Clipboard.'), () => toast('Paint', 'JackOS is not allowed to put pictures on this Clipboard.')); } catch (e) { toast('Paint', 'JackOS is not allowed to put pictures on this Clipboard.'); } }); } catch (e) {} } }, { label: 'Clear Selection', key: 'Del', act: () => { snap(); clear(); } }]],
      ['View', [{ label: 'Tool Box', chk: true, act: () => { const t = qs(b, '.pgp-tools'); t.hidden = !t.hidden; setTimeout(fit, 0); } }, { label: 'Color Box', chk: true, act: () => { const t = qs(b, '.pgp-pal'); t.hidden = !t.hidden; } }, { label: 'Status Bar', chk: true, act: () => { const s = w.el.querySelector('.appstatus'); s.hidden = !s.hidden; } }]],
      ['Image', [{ label: 'Flip/Rotate...', key: 'Ctrl+R', act: flipDlg }, { label: 'Stretch/Skew...', key: 'Ctrl+W', act: () => msg('Stretch/Skew', 'Stretching is not supported. Skewing is not supported. Squishing is right out.', 'warn') }, { label: 'Invert Colors', key: 'Ctrl+I', act: invert }, { label: 'Attributes...', key: 'Ctrl+E', act: attributes }, { label: 'Clear Image', key: 'Ctrl+Shft+N', act: () => { commitText(); snap(); clear(); } }]],
      ['Colors', [{ label: 'Edit Colors...', act: () => editColour(Math.max(0, PAL.indexOf(fg))) }, { label: 'Swap Colours', act: () => { [fg, bg] = [bg, fg]; colours(); } }]],
      ['Help', [{ label: 'Help Topics', act: () => Desk.notepad('Paint Help.txt', PAINT_HELP) }, '-', { label: 'About Paint', act: () => msg('About Paint', `Paint for JackOS 98\nVersion 4.10.1999\n\nLicensed to: ${nick()}\n\nPictures are ${PW} x ${PH} pixels and 16.7 million colours, of which 28 are in the box.`, 'info') }]],
    ]);
    w.el.tabIndex = -1;
    on(w.el, 'keydown', ev => {
      if (ev.target.closest('textarea,input')) return;
      if (!ev.ctrlKey) { if (ev.key === 'Delete') { snap(); clear(); } return; }
      const k = ev.key.toLowerCase();
      const map = { z: doUndo, y: doRedo, s: () => doSave(), o: () => confirmLose(openDlg), i: invert, r: flipDlg, e: attributes, n: ev.shiftKey ? () => { snap(); clear(); } : () => confirmLose(() => { clear('#fff'); undo = []; name = 'untitled'; dirty = false; title(); }) };
      if (map[k]) { ev.preventDefault(); map[k](); }
    });
    // an unsaved picture is kept (js/gamesave.js, one for Paint, on this PC only): the next Paint opened without a file carries on.
    // (a window that never had changes leaves the save alone; saving to My Pictures or File > New forgets it)
    let owned = false;
    const pic = () => { let img = cv.toDataURL('image/png'); if (img.length > 380000) img = cv.toDataURL('image/jpeg', 0.85); return { img, name, fg, bg }; };
    const sv = A.gameSaver ? A.gameSaver('paint', () => { if (dirty) owned = true; return !owned ? undefined : dirty ? pic() : null; }, { v: 1, delay: 1200, live: true, max: 400000 }).watch(w) : null;
    if (sv) { psv = sv; on(b, 'pointerup', () => { if (dirty) sv.save(); }); on(w.el, 'keyup', () => { if (dirty) sv.save(); }); }
    const kept = sv && !(arg && arg.dataURL) && sv.load();
    if (arg && arg.dataURL) load(arg);
    else if (kept && typeof kept.img === 'string' && /^data:image\//.test(kept.img)) {
      const im = new Image();
      im.onload = () => { if (w.closed) return; clear('#fff'); ctx.drawImage(im, 0, 0); name = String(kept.name || 'untitled'); if (/^#[0-9a-f]{6}$/i.test(kept.fg || '')) fg = kept.fg; if (/^#[0-9a-f]{6}$/i.test(kept.bg || '')) bg = kept.bg; colours(); dirty = true; owned = true; title(); };
      im.src = kept.img;
    }
    return w;
  } });
  A.OPENERS.png = node => A.open('mspaint', node);
  const PAINT_HELP = `PAINT HELP
==========

LEFT click draws with the front colour. RIGHT click draws with the
back colour. Or click the little colour box (bottom left) to
swap them.

TOOLS
  Pencil       one pixel wide, for detail (eyes, teeth, etc.)
  Brush        thicker, pick a size underneath
  Airbrush     hold it down for spray paint (no real paint needed)
  Eraser       paints in the back colour
  Fill         pours paint into a closed shape
  Pick Color   click the picture to steal a colour
  Text         click, type, then click somewhere else
  Line         drag from one end to the other
  Rectangle, Ellipse, Rounded Rectangle
               drag to draw. Hold Shift for squares and circles.
               Pick outline, outline + fill, or fill underneath.
  Blobbit Stamp  a Blobbit. Everybody needs Blobbits.

Edit > Undo goes back lots of steps (Ctrl+Z). Repeat is Ctrl+Y.
Double-click a colour in the box to change it.

File > Save puts your picture in My Documents\\My Pictures.
File > Set As Wallpaper puts it on the desktop. Show your Mom.
`;

  // ================================================================ JACKAMP: tunes (all original, written as note names; '.' = rest, '-' = hold)
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const seq = s => s.split(/[\s|]+/).filter(Boolean).map(t => { if (t === '.') return 0; if (t === '-') return -1; const m = /^([A-G])([#b]?)(-?\d)$/.exec(t); if (!m) throw new Error('bad note ' + t); return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); });
  const TRACKS = [
    { id: 'squig_pie_shuffle', title: 'Pot Noodle Shuffle', loops: 4, step: 0.14, hats: true,
      lead: `E5 G5 . C6 B5 G5 E5 G5 | A5 - E5 A5 C6 - B5 A5 | F5 A5 C6 A5 F5 - E5 F5 | G5 - D5 G5 B5 A5 G5 - | E5 G5 C6 E6 D6 C6 G5 E5 | A5 C6 E6 C6 A5 - G5 A5 | F5 A5 D6 . G5 B5 D6 . | C6 - G5 E5 C5 - . . |
             A5 . A5 C6 F6 - C6 A5 | B5 . B5 D6 G6 - D6 B5 | G5 B5 E6 B5 G5 E5 G5 B5 | C6 - A5 - E5 - A5 C6 | F5 - A5 - C6 - F6 - | D6 C6 B5 A5 G5 F5 E5 D5 | E5 G5 C6 G5 E5 G5 C6 E6 | C6 - - . C5 . . .`,
      bass: `C3 G3 C3 G3 | A2 E3 A2 E3 | F2 C3 F2 C3 | G2 D3 G2 D3 | C3 G3 C3 G3 | A2 E3 A2 E3 | D3 A2 G2 D3 | C3 G2 C3 C3 | F2 C3 F2 C3 | G2 D3 G2 D3 | E3 B2 E3 B2 | A2 E3 A2 E3 | F2 C3 F2 C3 | G2 D3 G2 B2 | C3 G2 C3 G2 | C3 G2 C2 C2` },
    { id: 'dial_up_dreams', title: 'Dial-Up Dreams', loops: 3, step: 0.18, hats: true,
      lead: `A4 C5 E5 A5 E5 C5 A4 C5 | F4 A4 C5 F5 C5 A4 F4 A4 | G4 C5 E5 G5 E5 C5 G4 C5 | G4 B4 D5 G5 D5 B4 G4 B4 | E5 - - A5 G5 - E5 - | F5 - - E5 C5 - A4 - | D5 - G5 - B5 - A5 G5 | G#5 - - - E5 - - . |
             A5 C6 E6 C6 A5 E5 C5 E5 | A5 C6 F6 C6 A5 F5 C5 F5 | G5 C6 E6 C6 G5 E5 C5 E5 | B5 D6 G6 D6 B5 G5 D5 G5 | A5 - - - G5 E5 - . | F5 - - - E5 C5 - . | D5 - E5 - G5 - B5 - | A5 - - - - - . .`,
      bass: `A2 A2 E3 A2 | F2 F2 C3 F2 | C3 C3 G3 C3 | G2 G2 D3 G2 | A2 A2 E3 A2 | F2 F2 C3 F2 | G2 G2 D3 G2 | E2 E2 B2 E2 | A2 A2 E3 A2 | F2 F2 C3 F2 | C3 C3 G3 C3 | G2 G2 D3 G2 | A2 A2 E3 A2 | F2 F2 C3 F2 | G2 G2 D3 G2 | A2 E2 A2 A2` },
    { id: 'waaagh_anthem', title: 'Boss Level Anthem', loops: 4, step: 0.15, hats: true,
      lead: `E5 . E5 . G5 - E5 . | B5 - A5 G5 F#5 - E5 . | C6 . C6 . B5 - G5 . | A5 - G5 F#5 D5 - . . | E5 E5 G5 B5 E6 - B5 . | D6 - B5 G5 B5 - . . | C6 - B5 A5 D6 - C6 B5 | E6 - - - E5 . . . |
             A5 . A5 . A5 - C6 . | B5 . B5 . B5 - G5 . | C6 - E6 - D6 - C6 - | B5 - D#6 - F#6 - . . | E6 . D6 . B5 . G5 . | C6 . B5 . G5 . E5 . | F#5 - D#5 - B4 - D#5 F#5 | E5 - - - . . . .`,
      bass: `E2 E2 E3 E2 | E2 E2 B2 E2 | C2 C2 C3 C2 | D2 D2 D3 D2 | E2 E2 E3 E2 | E2 E2 B2 E2 | C2 C3 D2 D3 | E2 E3 E2 E2 | A2 A2 E2 A2 | E2 E2 B2 E2 | C2 C2 C3 C2 | B1 B1 B2 B1 | E2 E2 E3 E2 | C2 C2 C3 C2 | B1 B1 B2 B1 | E2 E2 E2 E2` },
    { id: 'rubik_rag', title: 'Rubik Rag', loops: 4, step: 0.13, hats: false,
      lead: `E5 G5 - C6 . A5 C6 - | C#6 . E6 - C#6 A5 G5 E5 | F#5 A5 - D6 . C6 A5 F#5 | G5 . B5 D6 - F6 E6 D6 | C6 - G5 E5 - C5 E5 G5 | Bb5 - G5 E5 C5 E5 G5 Bb5 | A5 - F5 C6 Ab5 - F5 C5 | E5 G5 C6 - D6 B5 G5 F5 |
             E5 . E5 G5 - E5 G5 C6 | C#6 - A5 E5 - G5 A5 C#6 | D6 . D6 A5 - F#5 A5 D6 | B5 - G5 D6 - B5 G5 F5 | E5 G#5 B5 D6 - B5 G#5 E5 | A5 - C6 E6 - C6 A5 E5 | F#5 A5 D6 . G5 B5 D6 F6 | E6 - C6 - G5 - C6 .`,
      bass: `C2 G2 C3 G2 | A1 E2 A2 E2 | D2 A2 D3 A2 | G1 D2 G2 D2 | C2 G2 C3 G2 | C2 G2 Bb2 G2 | F2 C3 F2 Ab2 | C2 G2 G1 D2 | C2 G2 C3 G2 | A1 E2 A2 E2 | D2 A2 D3 A2 | G1 D2 G2 D2 | E2 B2 E3 B2 | A1 E2 A2 E2 | D2 A2 G1 D2 | C2 G2 C2 C2` },
    { id: 'millennium_countdown', title: 'Millennium Countdown', loops: 3, step: 0.15, hats: true,
      lead: `D5 . D5 . D5 . F5 . | D5 . D5 . D5 . G5 . | D5 . F5 . Bb5 . A5 . | C5 . E5 . G5 . C6 . | D6 - A5 F5 D6 - A5 F5 | D6 - Bb5 F5 D6 - Bb5 F5 | E6 - C6 G5 E6 - C6 G5 | C#6 D6 E6 F6 G6 F6 E6 C#6 |
             F#6 - - D6 A5 - D6 F#6 | G6 - - D6 B5 - D6 G6 | E6 - G6 - A6 - G6 F#6 | F#6 - D6 - A5 - . . | B5 - D6 F#6 B6 - A6 F#6 | G6 - D6 B5 G5 - B5 D6 | E6 - A5 - C#6 - E6 - | D6 - - - D5 . . .`,
      bass: `D2 D3 D2 D3 | D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 | D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 | A1 A2 A1 A2 | D2 A2 D3 A2 | G1 D2 G2 D2 | E2 B2 A1 E2 | D2 A2 D3 A2 | B1 F#2 B2 F#2 | G1 D2 G2 D2 | A1 E2 A2 E2 | D2 A2 D2 D2` },
    { id: 'floppy_disk_funk', title: 'Floppy Disk Funk', loops: 4, step: 0.13, hats: true,
      lead: `G5 . . Bb5 . C6 . D6 | . F5 . G5 - . Bb5 G5 | E5 . . G5 . A5 . Bb5 | . A5 . G5 - . E5 . | D6 . D6 . C6 Bb5 . G5 | Bb5 . G5 F5 . G5 - . | C6 - A5 . D6 - C6 A5 | G5 - - . . . G6 . |
             G6 . F6 . D6 . C6 . | Bb5 . G5 . F5 G5 - . | E6 . D6 . C6 . Bb5 . | A5 . G5 . E5 G5 - . | D6 D6 . F6 . D6 . C6 | Bb5 . G5 . Bb5 C6 D6 . | C6 . A5 . F#5 . A5 C6 | G5 - - - . . . .`,
      bass: `G2 G3 Bb2 C3 | G2 G3 F2 G2 | C2 C3 E2 G2 | C2 C3 Bb2 C3 | G2 G3 Bb2 C3 | G2 G3 F2 G2 | A2 A2 D2 D3 | G2 G3 G2 F2 | G2 G3 Bb2 C3 | G2 G3 F2 G2 | C2 C3 E2 G2 | C2 C3 Bb2 C3 | G2 G3 Bb2 C3 | G2 G3 F2 G2 | A2 A2 D2 D3 | G2 D2 G2 G2` },
    { id: 'gubbinz_lullaby', title: 'Gubbinz Lullaby', loops: 2, step: 0.22, hats: false,
      lead: `A5 - - C6 A5 - F5 - | G5 - - E5 C5 - - . | F5 - - A5 D6 - C6 - | Bb5 - A5 - G5 - - . | A5 - - C6 F6 - E6 D6 | D6 - C6 - Bb5 - A5 - | G5 - A5 - Bb5 - E5 - | F5 - - - - - . . |
             D6 - - Bb5 F5 - Bb5 - | C6 - - A5 F5 - A5 - | Bb5 - A5 - G5 - D5 - | E5 - G5 - C6 - - . | A5 - C6 - F6 - - - | E6 - D6 - A5 - - . | G5 - Bb5 - E5 - G5 - | F5 - - - - - . .`,
      bass: `F2 C3 A2 C3 | C2 G2 E2 G2 | D2 A2 F2 A2 | Bb1 F2 D2 F2 | F2 C3 A2 C3 | Bb1 F2 D2 F2 | C2 G2 E2 G2 | F2 C3 F2 F2 | Bb1 F2 D2 F2 | F2 C3 A2 C3 | G1 D2 Bb1 D2 | C2 G2 E2 G2 | F2 C3 A2 C3 | D2 A2 F2 A2 | G1 D2 C2 G2 | F2 C3 F2 F2` },
    { id: 'pocket_money_polka', title: 'Pocket Money Polka', loops: 4, step: 0.12, hats: true,
      lead: `B5 A5 G5 A5 B5 . B5 . | A5 G5 F#5 G5 A5 . A5 . | B5 D6 G6 D6 B5 . G5 . | A5 - D5 - F#5 - A5 - | B5 A5 G5 A5 B5 . B5 . | C6 B5 C6 E6 G6 . E6 . | D6 C6 B5 C6 A5 . F#5 . | G5 - B5 - G5 . . . |
             E6 . E6 . G6 E6 C6 E6 | D6 . D6 . G6 D6 B5 D6 | C6 B5 A5 B5 C6 A5 F#5 A5 | B5 . G5 . D5 . G5 . | E6 D6 C6 D6 E6 . G6 . | D6 C6 B5 C6 D6 . G5 . | F#5 G5 A5 B5 C6 D6 E6 F#6 | G6 . D6 . G5 . . .`,
      bass: `G2 D3 G2 D3 | D2 A2 D2 C3 | G2 D3 G2 D3 | D2 A2 D2 C3 | G2 D3 G2 D3 | C2 G2 C2 G2 | D2 A2 D2 C3 | G2 D3 G2 G2 | C2 G2 C2 G2 | G2 D3 G2 D3 | D2 A2 D2 C3 | G2 D3 G2 D3 | C2 G2 C2 G2 | G2 D3 G2 D3 | D2 A2 D2 C3 | G2 D2 G2 G2` },
    { id: 'y2k_bug_boogie', title: 'Y2K Bug Boogie', loops: 4, step: 0.14, hats: true,
      lead: `E5 . G5 A5 . E5 C6 A5 | . G5 A5 . E5 . C5 . | E5 G5 A5 C6 A5 G5 E5 . | A5 - G5 - E5 - D#5 E5 | A5 . C6 D6 . A5 F#5 A5 | C6 - A5 - F#5 - D5 . | E5 . G5 A5 . E5 C6 A5 | . G5 E5 C5 A4 - . . |
             B5 - G#5 B5 E6 - D6 B5 | A5 - F#5 A5 D6 - C6 A5 | E5 A5 C#6 E6 C#6 A5 E5 C#5 | E5 - G#5 - B5 - D6 - | A5 . A5 . C6 A5 G5 E5 | C6 . C6 . D6 C6 A5 G5 | B5 G#5 E5 B4 D5 E5 G#5 B5 | A5 - - - A4 . . .`,
      bass: `A2 C#3 E3 F#3 | G3 F#3 E3 C#3 | A2 C#3 E3 F#3 | G3 F#3 E3 C#3 | D2 F#2 A2 B2 | C3 B2 A2 F#2 | A2 C#3 E3 F#3 | G3 F#3 E3 C#3 | E2 G#2 B2 C#3 | D2 F#2 A2 B2 | A2 C#3 E3 F#3 | E2 G#2 B2 D3 | A2 C#3 E3 F#3 | G3 F#3 E3 C#3 | E2 G#2 B2 D3 | A2 E2 A2 A2` },
    { id: 'bluescreen_blues', title: 'Bluescreen Blues', loops: 3, step: 0.2, hats: true,
      lead: `G5 - E5 - . B4 D5 E5 | G5 - A5 - C6 - A5 . | B5 - A5 G5 E5 - - . | D5 - E5 - G5 - E5 . | C6 - - B5 A5 - G5 - | E5 - G5 A5 - - . . | B5 - G5 - E5 - D5 E5 | G5 - - - E5 - . . | F#5 - A5 - B5 - D#6 - | C6 - B5 A5 G5 - E5 - | G5 - E5 - D5 - B4 - | D#5 - F#5 - A5 - B5 -`,
      bass: `E2 G2 B2 G2 | A2 C3 E3 C3 | E2 G2 B2 G2 | E2 G2 B2 D3 | A2 C3 E3 C3 | A2 C3 E3 C3 | E2 G2 B2 G2 | E2 G2 B2 G2 | B1 D#2 F#2 A2 | A2 C3 E3 C3 | E2 G2 B2 G2 | B1 D#2 F#2 A2` },
  ];
  TRACKS.forEach(t => { t.file = t.id + '.mid'; t.L = seq(t.lead); t.B = seq(t.bass); Sound.addTune('jamp_' + t.id, { lead: t.L, bass: t.B, step: t.step, hats: t.hats }); t.len = t.L.length * t.step * t.loops; });
  // Jack's site theme comes too, and a hidden bonus (the old Russian folk song, public domain)
  const BONUS = { id: 'korobeiniki', title: 'Korobeiniki (hidden bonus track)', file: 'korobeiniki_trad.mid', base: 'tris', step: 0.15, hats: false, loops: 4 };
  const THEME = { id: 'jack_attack_theme', title: 'JACK ATTACK! Theme', file: 'jack_attack_theme.mid', base: 'theme', step: 0.16, hats: true, loops: 3 };

  let jampApi = null;
  A.register('jackamp', { single: true, cmd: ['jackamp', 'winamp', 'jamp'], open(arg) {
    const list = TRACKS.slice(); list.push(THEME);
    if (store.get('jhp_prog_jamphidden', false)) list.push(BONUS);
    let cur = 0, playing = false, paused = false, posSteps = 0, t0 = 0, rotK = 0, shuffle = false, repeat = true, vol = store.get('jhp_prog_jampvol', 80), remain = false, vis = 0, logoClicks = 0, sel = 0;
    const played = new Set(store.get('jhp_prog_jampplayed', []));
    const b = h('', 'pga');
    b.innerHTML = `<div class="pga-main">
        <div class="pga-lcd"><div class="pga-lt"><span class="pga-state">&#9632;</span><span class="pga-time">0:00</span></div><canvas class="pga-vis" width="76" height="22" title="Click to change the visualisation"></canvas></div>
        <div class="pga-side"><div class="pga-marq"><span></span></div><div class="pga-info"><b class="pga-kb">128</b>kbps <b class="pga-kh">44</b>kHz <i class="pga-mono">mono</i><i class="pga-st on">stereo</i></div>
        <div class="pga-sl"><input type="range" class="pga-vol" min="0" max="100" value="${vol}" aria-label="Volume"><input type="range" class="pga-bal" min="-50" max="50" value="0" aria-label="Balance"><button class="pga-tg pga-eqb on">EQ</button><button class="pga-tg pga-plb on">PL</button></div></div>
        <input type="range" class="pga-seek" min="0" max="1000" value="0" aria-label="Seek">
        <div class="pga-ctl"><button class="pga-b" data-a="prev" aria-label="Previous">&#9198;</button><button class="pga-b" data-a="play" aria-label="Play">&#9654;</button><button class="pga-b" data-a="pause" aria-label="Pause">&#10074;&#10074;</button><button class="pga-b" data-a="stop" aria-label="Stop">&#9632;</button><button class="pga-b" data-a="next" aria-label="Next">&#9197;</button><button class="pga-b" data-a="eject" aria-label="Open file">&#9167;</button>
          <button class="pga-tg pga-shuf">SHUFFLE</button><button class="pga-tg pga-rep on">&#8635;</button><button class="pga-logo" title="JackAmp" aria-label="JackAmp logo">${I.amp}</button></div></div>
      <div class="pga-eq"><div class="pga-bar">JACKAMP EQUALIZER</div><div class="pga-eqtop"><button class="pga-tg pga-eqon on">ON</button><button class="pga-tg pga-auto">AUTO</button><canvas class="pga-curve" width="113" height="19"></canvas><button class="pga-tg pga-pre">PRESETS</button></div>
        <div class="pga-bands">${['PREAMP', '60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'].map((l, i) => `<label class="${i ? '' : 'pre'}"><input type="range" min="-12" max="12" value="0" data-i="${i}" aria-label="${l}"><span>${l}</span></label>`).join('')}</div></div>
      <div class="pga-pl"><div class="pga-bar">JACKAMP PLAYLIST EDITOR</div><div class="pga-list" tabindex="0"></div><div class="pga-plfoot"><button class="pga-tg" data-p="add">+ADD</button><button class="pga-tg" data-p="rem">-REM</button><button class="pga-tg" data-p="misc">MISC</button><span class="pga-tot"></span><button class="pga-tg" data-p="list">LIST</button></div></div>`;
    const w = A.win('JackAmp', b, { w: 300, icon: I.amp, cls: 'pga-win', noResize: true, noMax: true, onClose: () => { if (playing) Sound.music.stop(); cancelAnimationFrame(raf); clearInterval(mq); jampApi = null; } });
    const $b = s => qs(b, s);
    const ctxA = () => Sound.unlock && Sound.unlock();
    const fmtT = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const tr = () => list[cur];
    function tuneOf(t) { if (t.L) return { L: t.L, B: t.B }; return null; }
    // base tunes we did not write (theme, bonus) are played as they are, so they can only restart from the top
    function startAt(steps) {
      const t = tr(), c = ctxA(); if (!c) { toast('JackAmp', 'Your computer does not have a sound card. (Or this browser has no Web Audio.)'); return; }
      const T = tuneOf(t);
      if (T) {
        rotK = Math.floor(steps / 8) * 8 % T.L.length;
        const L = T.L.slice(rotK).concat(T.L.slice(0, rotK)), bk = (rotK / 2) % T.B.length, B = T.B.slice(bk).concat(T.B.slice(0, bk));
        Sound.addTune('_jamp', { lead: L, bass: B, step: t.step, hats: t.hats });
        posSteps = Math.floor(steps / 8) * 8;
      } else { posSteps = 0; rotK = 0; }
      Sound.music.play(T ? '_jamp' : t.base);
      t0 = c.currentTime + 0.05 - posSteps * t.step;
      playing = true; paused = false;
      setState();
    }
    const elapsed = () => { const c = ctxA(); if (!c) return 0; return playing ? Math.max(0, c.currentTime - t0) : posSteps * tr().step; };
    const lenOf = t => t.len || (t.base === 'theme' ? 64 * 0.16 * t.loops : 64 * 0.15 * t.loops);
    function play(i, fromUser) {
      if (i != null) { cur = (i + list.length) % list.length; posSteps = 0; }
      if (paused && i == null) { startAt(posSteps); return; }
      startAt(i != null ? 0 : posSteps);
      toast('JackAmp - Now playing', `${cur + 1}. Jack - ${tr().title} (${fmtT(lenOf(tr()))})`, 3500);
      marqText();
      render();
    }
    function stop() { if (playing) Sound.music.stop(); playing = false; paused = false; posSteps = 0; setState(); }
    function pause() { if (!playing) { if (paused) play(); return; } posSteps = Math.floor(elapsed() / tr().step); Sound.music.stop(); playing = false; paused = true; setState(); }
    function next(dir) { const n = shuffle ? (list.length > 1 ? (cur + rnd(1, list.length - 1)) % list.length : 0) : cur + (dir || 1); if (!repeat && !shuffle && (n >= list.length || n < 0)) { stop(); cur = 0; render(); return; } play(n); }
    function setState() { $b('.pga-state').innerHTML = playing ? '&#9654;' : paused ? '&#10074;&#10074;' : '&#9632;'; $b('.pga-state').classList.toggle('blink', paused); $b('.pga-kb').textContent = playing || paused ? pick(['128', '128', '160', '112']) : '128'; render(); }
    // ---- marquee: the classic scrolling song title
    let mqText = '', mqPos = 0, mqOverride = '', mqUntil = 0;
    function marqText() { mqText = `${cur + 1}. Jack - ${tr().title} (${fmtT(lenOf(tr()))})  ***  `; mqPos = 0; }
    marqText();
    const mq = setInterval(() => {
      const span = $b('.pga-marq span'); if (!span) return;
      if (mqOverride && Date.now() < mqUntil) { span.textContent = mqOverride; return; }
      mqOverride = '';
      mqPos = (mqPos + 1) % mqText.length; span.textContent = (mqText.slice(mqPos) + mqText.slice(0, mqPos)).slice(0, 34);
    }, 220);
    const flash = t => { mqOverride = t; mqUntil = Date.now() + 1200; const span = $b('.pga-marq span'); if (span) span.textContent = t; };
    // ---- the visualiser: fake, but driven by the very notes being played, so it bounces in time
    const vc = $b('.pga-vis'), vx = vc.getContext('2d');
    const bars = new Float32Array(19), peaks = new Float32Array(19);
    let lastStep = -1, raf = 0, lastLead = 72;
    function frame() {
      raf = requestAnimationFrame(frame);
      const t = tr(), T = tuneOf(t);
      if (playing && Sound.music.playing !== (T ? '_jamp' : t.base)) { playing = false; paused = false; posSteps = 0; setState(); toast('JackAmp', 'Something else started playing music, so JackAmp has stopped.', 3000); }
      const e = elapsed(), L = lenOf(t);
      if (playing) {
        const st = Math.floor(e / t.step);
        if (st !== lastStep && T) {
          for (let s = lastStep + 1; s <= st; s++) {
            if (s < 0) continue;
            const n = T.L[s % T.L.length];
            if (n > 0) { lastLead = n; const k = clamp(Math.round((n - 52) / 2.4), 3, 18); bars[k] = Math.min(1, bars[k] + 0.9); bars[k - 1] += 0.5; if (k < 18) bars[k + 1] += 0.45; bars[clamp(k - 2, 0, 18)] += 0.25; }
            if (s % 2 === 0) { const bn = T.B[(s / 2) % T.B.length]; const k = clamp(Math.round((bn - 28) / 3), 0, 7); bars[k] = Math.min(1, bars[k] + 0.8); bars[k + 1] += 0.4; }
            if (t.hats && s % 2 === 1) for (let k = 15; k < 19; k++) bars[k] += 0.25 + Math.random() * 0.2;
            if (s % 8 === 0) { bars[0] = 1; bars[1] = Math.min(1, bars[1] + 0.7); }
          }
          lastStep = st;
        } else if (!T && Math.random() < 0.3) bars[rnd(0, 18)] += 0.6;
        if (e >= L) { lastStep = -1; if (repeat || shuffle || cur < list.length - 1) next(1); else stop(); return; }
        if (e > 10 && !played.has(t.id)) { played.add(t.id); store.set('jhp_prog_jampplayed', [...played]); if (TRACKS.every(x => played.has(x.id))) { secret('jampall'); toast('JackAmp', 'You have listened to the whole mixtape! Jack would like a review for the Letters page.', 6000); } }
      } else lastStep = -1;
      for (let k = 0; k < 19; k++) { bars[k] = Math.min(1, bars[k]) * (playing ? 0.86 : 0.8); if (bars[k] > peaks[k]) peaks[k] = bars[k]; else peaks[k] = Math.max(0, peaks[k] - 0.02); }
      vx.fillStyle = '#000'; vx.fillRect(0, 0, 76, 22);
      if (vis === 0) {
        for (let k = 0; k < 19; k++) {
          const hh = Math.round(bars[k] * 21);
          for (let y = 0; y < hh; y++) { vx.fillStyle = y > 16 ? '#ff3a1a' : y > 11 ? '#ffd400' : '#2aff2a'; vx.fillRect(k * 4, 21 - y, 3, 1); }
          if (peaks[k] > 0.03) { vx.fillStyle = '#c0c0c0'; vx.fillRect(k * 4, 21 - Math.round(peaks[k] * 21), 3, 1); }
        }
      } else if (vis === 1) {
        const amp = Math.max(...bars) * 9, f = 440 * Math.pow(2, (lastLead - 69) / 12) / 120, ph = performance.now() / 40;
        vx.fillStyle = '#2aff2a';
        for (let x = 0; x < 76; x++) { const y = 11 + Math.round(Math.sin(x * f * 0.3 + ph) * amp * (0.6 + 0.4 * Math.sin(x * 0.7))); vx.fillRect(x, clamp(y, 0, 21), 1, 1); }
      }
      // time + seek
      const shown = remain ? '-' + fmtT(L - e) : fmtT(e);
      const tm = $b('.pga-time'); if (tm.textContent !== shown) tm.textContent = shown;
      const sk = $b('.pga-seek'); if (!seeking) sk.value = String(Math.round(Math.min(1, e / L) * 1000));
    }
    raf = requestAnimationFrame(frame);
    tap(vc, () => { vis = (vis + 1) % 3; flash(['SPECTRUM ANALYSER', 'OSCILLOSCOPE', 'VISUALISATION OFF'][vis]); });
    tap($b('.pga-time'), () => { remain = !remain; });
    // ---- buttons
    qsa(b, '.pga-b').forEach(x => tap(x, () => {
      const a = x.dataset.a;
      if (a === 'play') { if (playing) { startAt(0); } else play(paused ? null : cur); }
      else if (a === 'pause') pause(); else if (a === 'stop') stop();
      else if (a === 'next') next(1); else if (a === 'prev') next(-1);
      else if (a === 'eject') {
        const f = A.fs.dir('C:/My Documents/My Music');
        const d = dialog('Open file(s)', `<div>Look in: <b>My Music</b></div><div class="field pga-open">${f.kids.filter(k => k.type === 'mid').map(k => `<button class="xi" data-f="${esc(k.track)}">${I.mid}<span>${esc(k.name)}</span></button>`).join('')}</div>`, [['Cancel']], { w: 320, icon: I.amp });
        qsa(d.b, '[data-f]').forEach(e => tap(e, () => { if (playId(e.dataset.f)) d.w.close(); }));
      }
    }));
    tap($b('.pga-shuf'), e => { shuffle = !shuffle; e.target.classList.toggle('on', shuffle); flash('SHUFFLE: ' + (shuffle ? 'ON' : 'OFF')); });
    tap($b('.pga-rep'), e => { repeat = !repeat; e.currentTarget.classList.toggle('on', repeat); flash('REPEAT: ' + (repeat ? 'ON' : 'OFF')); });
    tap($b('.pga-eqb'), e => { const p = $b('.pga-eq'); p.hidden = !p.hidden; e.target.classList.toggle('on', !p.hidden); });
    tap($b('.pga-plb'), e => { const p = $b('.pga-pl'); p.hidden = !p.hidden; e.target.classList.toggle('on', !p.hidden); });
    tap($b('.pga-logo'), () => {
      logoClicks++; flash(['JACKAMP 2.0 MIDI EDITION', 'IT REALLY WHIPS THE COMPETITION', 'STOP POKING ME', 'OI!', 'FINE. HAVE A BONUS TRACK.'][Math.min(4, logoClicks - 1)]);
      if (logoClicks === 5 && !list.includes(BONUS)) { list.push(BONUS); store.set('jhp_prog_jamphidden', true); secret('jamphidden'); render(); toast('JackAmp', 'A hidden bonus track has appeared at the bottom of the playlist!', 5000); }
    });
    on($b('.pga-vol'), 'input', e => { vol = +e.target.value; store.set('jhp_prog_jampvol', vol); flash('VOLUME: ' + vol + '%'); if (Sound.setVolume) Sound.setVolume(vol / 100); });
    on($b('.pga-bal'), 'input', e => { const v = +e.target.value; flash('BALANCE: ' + (v === 0 ? 'CENTRE' : Math.abs(v) * 2 + '% ' + (v < 0 ? 'LEFT' : 'RIGHT'))); });
    let seeking = false;
    on($b('.pga-seek'), 'input', e => { seeking = true; flash('SEEK TO: ' + fmtT(lenOf(tr()) * e.target.value / 1000)); });
    on($b('.pga-seek'), 'change', e => { seeking = false; const t = tr(); if (!tuneOf(t)) { flash('CAN\'T SEEK THIS ONE'); return; } const steps = Math.floor(lenOf(t) * e.target.value / 1000 / t.step); if (playing) startAt(steps); else { posSteps = Math.floor(steps / 8) * 8; paused = true; setState(); } });
    // ---- EQ (for show, like most people's EQ)
    const curve = $b('.pga-curve').getContext('2d');
    function drawCurve() {
      const v = qsa(b, '.pga-bands input').slice(1).map(i => +i.value);
      curve.fillStyle = '#000'; curve.fillRect(0, 0, 113, 19); curve.strokeStyle = '#3cff3c'; curve.beginPath();
      v.forEach((y, i) => { const x = 4 + i * 11.7, yy = 9.5 - y * 0.7; if (i) curve.lineTo(x, yy); else curve.moveTo(x, yy); }); curve.stroke();
      curve.strokeStyle = '#555'; curve.beginPath(); curve.moveTo(0, 9.5); curve.lineTo(113, 9.5); curve.stroke();
      if (qsa(b, '.pga-bands input').every(i => +i.value === 12)) { secret('jampeq'); flash('BASS BOOSTED BEYOND 11'); toast('JackAmp', 'Every slider at maximum. The neighbours are banging on the wall.', 5000); }
    }
    qsa(b, '.pga-bands input').forEach(i => on(i, 'input', () => { drawCurve(); flash(`EQ: ${i.getAttribute('aria-label')} ${i.value > 0 ? '+' : ''}${i.value} DB`); }));
    drawCurve();
    const PRESETS = { Classical: [0, 0, 0, 0, 0, 0, -4, -4, -4, -6], Club: [0, 0, 5, 3, 3, 3, 2, 0, 0, 0], Dance: [6, 4, 1, 0, 0, -3, -4, -4, 0, 0], 'Full Bass': [9, 9, 9, 5, 1, -3, -6, -7, -7, -7], 'Max Everything': [12, 12, 10, 6, 0, -6, 0, 6, 10, 12], Rock: [5, 3, -3, -5, -2, 2, 5, 7, 7, 7], Techno: [5, 3, 0, -3, -3, 0, 5, 6, 6, 5], 'Reset (flat)': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    tap($b('.pga-pre'), e => { const r = e.target.getBoundingClientRect(); IE.menu(Object.keys(PRESETS).map(n => ({ label: n, act: () => { qsa(b, '.pga-bands input').slice(1).forEach((i, k) => { i.value = PRESETS[n][k]; }); drawCurve(); flash('EQ PRESET: ' + n.toUpperCase()); } })), r.left, r.bottom); });
    tap($b('.pga-eqon'), e => { e.target.classList.toggle('on'); flash('EQ ' + (e.target.classList.contains('on') ? 'ON' : 'OFF') + ' (YOU CAN\'T TELL THE DIFFERENCE)'); });
    tap($b('.pga-auto'), e => { e.target.classList.toggle('on'); flash('AUTO-LOAD PRESETS: ' + (e.target.classList.contains('on') ? 'ON' : 'OFF')); });
    // ---- playlist
    function render() {
      const el = $b('.pga-list');
      el.innerHTML = list.map((t, i) => `<div class="pga-it${i === cur ? ' cur' : ''}${i === sel ? ' sel' : ''}" data-i="${i}"><span>${i + 1}. Jack - ${esc(t.title)}</span><span>${fmtT(lenOf(t))}</span></div>`).join('');
      qsa(el, '.pga-it').forEach(it => { tap(it, () => { sel = +it.dataset.i; qsa(el, '.pga-it').forEach(x => x.classList.toggle('sel', x === it)); }); dbl(it, () => play(+it.dataset.i, true)); });
      const tot = list.reduce((s, t) => s + lenOf(t), 0);
      $b('.pga-tot').textContent = `${fmtT(elapsed())}/${fmtT(tot)}`;
    }
    on($b('.pga-list'), 'keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = clamp(sel + (e.key === 'ArrowDown' ? 1 : -1), 0, list.length - 1); render(); } else if (e.key === 'Enter') play(sel, true); });
    qsa(b, '[data-p]').forEach(x => tap(x, e => {
      const p = x.dataset.p, r = x.getBoundingClientRect();
      if (p === 'add') IE.menu([{ label: 'Add URL...', act: () => msg('JackAmp', 'Downloading MIDIs from JackNet takes ages on a 56K modem (about 3 minutes each). Mom needs the phone. Maybe later.', 'warn') }, { label: 'Add Dir...', act: () => toast('JackAmp', 'Everything in My Music is already on the playlist.') }, { label: 'Add File...', act: () => qs(b, '[data-a=eject]').click() }], r.left, r.top - 80);
      else if (p === 'rem') IE.menu([{ label: 'Remove Selected', act: () => { if (list.length <= 1) return toast('JackAmp', 'You can\'t remove the last song. Silence is not a genre.'); if (sel === cur && (playing || paused)) stop(); list.splice(sel, 1); if (cur >= list.length) cur = 0; sel = Math.min(sel, list.length - 1); marqText(); render(); } }, { label: 'Remove All', act: () => toast('JackAmp', 'Nice try. The songs stay.') }], r.left, r.top - 60);
      else if (p === 'misc') IE.menu([{ label: 'Sort by Title', act: () => { const c = tr(); list.sort((a2, b2) => a2.title.localeCompare(b2.title)); cur = list.indexOf(c); render(); } }, { label: 'Randomize List', act: () => { const c = tr(); for (let i = list.length - 1; i > 0; i--) { const j = rnd(0, i); [list[i], list[j]] = [list[j], list[i]]; } cur = list.indexOf(c); render(); } }, { label: 'File Info...', act: () => { const t = list[sel]; msg('MIDI File Info', `${t.file}\n\nTitle: ${t.title}\nArtist: Jack\nAlbum: JACK ATTACK! Cover Disc 7\nYear: 1999\nGenre: Chiptune\nLength: ${fmtT(lenOf(t))}\nSize: ${(t.L ? t.L.length : 64) * 9 + 214} bytes\nComment: made in my bedroom on the family PC`, 'info'); } }], r.left, r.top - 80);
      else if (p === 'list') IE.menu([{ label: 'New List', act: () => toast('JackAmp', 'The playlist is perfect. Jack spent hours on it.') }, { label: 'Save List...', act: () => toast('JackAmp', 'Saved as C:\\Program Files\\JackAmp\\mixtape.m3u') }], r.left, r.top - 60);
    }));
    function playId(id) { let i = list.findIndex(t => t.id === id); if (i < 0) { const t = TRACKS.concat([THEME, BONUS]).find(x => x.id === id); if (!t) return false; list.push(t); i = list.length - 1; } play(i, true); return true; }
    jampApi = { playId };
    render(); setState();
    if (arg && arg.track) playId(arg.track);
    return w;
  } });
  A.OPENERS.mid = node => { const was = jampApi; A.open('jackamp', node.track ? { track: node.track } : null); if (was && node.track) was.playId(node.track); };

  // ================================================================ DISK DEFRAGMENTER
  const DRIVES = [['C', 'Drive C  Physical drive', 'hd'], ['A', 'Drive A  3\u00bd Floppy', 'fd'], ['D', 'Drive D  CD-ROM', 'cd'], ['*', 'All Hard Drives', 'hd']];
  const DF_FILES = ['C:\\JACKOS\\SYSTEM\\KERNEL32.DLL', 'C:\\JACKOS\\EXPLORER.EXE', 'C:\\JACKOS\\SYSTEM\\GUBBINZ.VXD', 'C:\\JACKATAK\\ISSUE7\\COVER.BMP', 'C:\\GAMES\\JACKTRIS\\JACKTRIS.EXE', 'C:\\My Documents\\homework.doc (0 bytes)', 'C:\\JACKOS\\WIN386.SWP', 'C:\\Program Files\\JackAmp\\JACKAMP.EXE', 'C:\\JACKOS\\SYSTEM\\JOYSTICK.DRV', 'C:\\GAMES\\QUAKE2\\QUAKE2.EXE', 'C:\\JACKOS\\Temporary Internet Files\\pikachu_pic(3).gif', 'C:\\JACKOS\\SYSTEM\\Y2KFIX.DLL', 'C:\\My Documents\\Diary\\SECRET.TXT (no peeking)', 'C:\\JACKATAK\\SOUNDS\\HADOUKEN.WAV', 'C:\\JACKOS\\SYSTEM\\MODEM.VXD', 'C:\\My Documents\\My Music\\squig_pie_shuffle.mid', 'C:\\JACKOS\\SYSTEM\\USER.EXE', 'C:\\JACKOS\\FONTS\\COMIC.TTF', 'C:\\GAMES\\DAVES_SHAREWARE\\SETUP.EXE', 'C:\\JACKOS\\SYSTEM.DAT', 'C:\\JACKOS\\USER.DAT'];
  const DF_COL = { frag: '#5f9fd0', prog: '#5f9fd0', done: '#00ffff', opt: '#000080', lock: '#e10600', bad: '#000000', free: '#ffffff', read: '#00d000', write: '#ff2020' };
  const DF_LEGEND = [['frag', 'Fragmented data that hasn\'t been moved yet'], ['done', 'Data that has already been defragmented'], ['opt', 'Program files moved to the front (they start faster)'], ['lock', 'Data that will not be moved (system files)'], ['bad', 'Bad (damaged) area of the disk'], ['free', 'Free space'], ['read', 'Data that\'s currently being read'], ['write', 'Data that\'s currently being written']];
  function defragSelect() {
    const d = dialog('Select Drive', `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${I.defrag.replace('<svg', '<svg width="32" height="32" style="flex:none"')}<div><p style="margin:0 0 8px">Which drive do you want to defragment?</p><select class="pgd-drv" style="width:100%">${DRIVES.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select><p class="small pgd-free" style="margin:8px 0 0">Copyright &copy; 1981-1999 Jack, and also his Mom's computer.<br><br>Drive C: 6,423 MB total, 1,904 MB free.</p></div></div>`,
      [['OK', bx => { const v = qs(bx, '.pgd-drv').value; if (v === 'A') { msg('Disk Defragmenter', 'Drive A: is not ready. There is a floppy in there, but it\'s Dave\'s and it\'s write-protected. And it only has Doom shareware on it.', 'warn'); return false; } if (v === 'D') { secret('defragcd'); msg('Disk Defragmenter', 'Drive D: is a CD-ROM. You cannot defragment a CD-ROM. You can\'t even write on it. (Jack tried with a felt-tip.)', 'warn'); return false; } defragRun(); }], ['Exit'], ['Settings...', () => { defragSettings(); return false; }]], { w: 360, icon: I.defrag });
    on(qs(d.b, '.pgd-drv'), 'change', e => { qs(d.b, '.pgd-free').innerHTML = { C: 'Drive C: 6,423 MB total, 1,904 MB free.', A: 'Drive A: 1.44 MB. Mostly Doom.', D: 'Drive D: CD-ROM. Currently: JACK ATTACK! Cover Disc 7.', '*': 'Just the one hard drive, really. It\'s a big one though.' }[e.target.value]; });
  }
  function defragSettings() {
    const s = store.get('jhp_prog_defragset', { fast: true, check: true });
    dialog('Disk Defragmenter Settings', `<div class="group"><span class="lg">When defragmenting my hard drive:</span><label style="display:block"><input type="checkbox" class="pgd-s1" ${s.fast ? 'checked' : ''}> Rearrange program files so my programs start faster</label><label style="display:block"><input type="checkbox" class="pgd-s2" ${s.check ? 'checked' : ''}> Check the drive for errors</label><label style="display:block"><input type="checkbox" disabled> Defragment Gubbinz (not recommended)</label></div><div class="group"><span class="lg">I want to use these options:</span><label style="display:block"><input type="radio" name="pgdo" checked> This time only. Next time, use the defaults again.</label><label style="display:block"><input type="radio" name="pgdo"> Every time I defragment my hard drive.</label></div>`,
      [['OK', bx => { store.set('jhp_prog_defragset', { fast: qs(bx, '.pgd-s1').checked, check: qs(bx, '.pgd-s2').checked }); }], ['Cancel']], { w: 380, icon: I.defrag });
  }
  function defragRun() {
    const set = store.get('jhp_prog_defragset', { fast: true, check: true });
    const fast = /[?&]defragtest/.test(location.search);
    const N = 1440;
    // build a messy disk: system files at the front, data in fragments everywhere, some free gaps, a couple of bad sectors
    const blocks = [];
    const files = []; let fileId = 0;
    for (let i = 0; i < N; i++) blocks.push({ t: 'free' });
    for (let i = 0; i < 26; i++) blocks[i] = { t: 'lock' };
    [337, 338, 901, 1203].forEach(i => { blocks[i] = { t: 'bad' }; });
    for (let i = 0; i < 9; i++) { const j = rnd(200, N - 1); if (blocks[j].t === 'free') blocks[j] = { t: 'lock' }; }
    const freeIdx = () => { const f = []; blocks.forEach((b2, i) => { if (b2.t === 'free') f.push(i); }); return f; };
    let pool = freeIdx();
    // fill ~60% of the drive with fragmented files
    while (pool.length > N * 0.38) {
      const len = rnd(2, 14), prog = set.fast && fileId < 40, f = { id: fileId++, len, prog }; files.push(f);
      for (let k = 0; k < len && pool.length; k++) {
        let at;
        if (k && Math.random() < 0.55) { const prev = f.last + 1; at = pool.indexOf(prev); if (at < 0) at = rnd(0, pool.length - 1); } else at = rnd(0, pool.length - 1);
        const idx = pool.splice(at, 1)[0]; blocks[idx] = { t: prog ? 'prog' : 'frag', f: f.id, k }; f.last = idx;
      }
    }
    // the plan: lay files out in order from the front of the disk (program files first)
    const order = files.slice().sort((a, b2) => (b2.prog - a.prog) || a.id - b2.id);
    const queue = []; order.forEach(f => { blocks.forEach((b2, i) => { if (b2.f === f.id && (b2.t === 'frag' || b2.t === 'prog')) queue.push([f.id, b2.k]); }); });
    queue.sort((a, b2) => { const fa = order.findIndex(f => f.id === a[0]), fb = order.findIndex(f => f.id === b2[0]); return fa - fb || a[1] - b2[1]; });
    const total = queue.length;
    let qi = 0, wp = 0, paused = false, stopped = false, done = false, details = false, phase = set.check ? 'check' : 'go', checkT = 0, hl = {}, changedOnce = false, fakePct = -1, timer = 0, startT = Date.now();
    const b = h('', 'pgd');
    b.innerHTML = `<div class="pgd-top"><div class="pgd-sum">${I.defrag.replace('<svg', '<svg width="32" height="32"')}<div style="flex:1;min-width:0"><div class="pgd-what">Defragmenting Drive C</div><div class="pgd-bar"></div><div class="pgd-pct">0% Complete</div></div></div>
      <div class="row pgd-btns"><button class="btn" data-d="stop">Stop</button><button class="btn" data-d="pause">Pause</button><button class="btn" data-d="legend" hidden>Legend</button><button class="btn" data-d="det">Show Details</button></div></div>
      <div class="pgd-map field" hidden><canvas></canvas></div><div class="pgd-file small"></div>`;
    const w = A.win('Defragmenting Drive C', b, { w: 360, icon: I.defrag, status: true, noMax: true, noResize: true, onClose: () => { stopped = true; clearTimeout(timer); } });
    w.status.textContent = set.check ? 'Checking drive for errors...' : 'Reading drive information...';
    const setBar = progBar(qs(b, '.pgd-bar'));
    const cv = qs(b, '.pgd-map canvas'), cx = cv.getContext('2d');
    let cols = 60, cw = 8, ch = 9;
    function layoutMap() { const W = Math.min(560, innerWidth - 40); cols = Math.floor((W - 6) / cw); cv.width = cols * cw; cv.height = Math.ceil(N / cols) * ch; cv.style.width = cv.width + 'px'; drawAll(); }
    function cell(i) {
      const b2 = blocks[i], x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      const col = hl[i] ? DF_COL[hl[i]] : DF_COL[b2.t];
      cx.fillStyle = col; cx.fillRect(x, y, cw - 1, ch - 1);
      if (b2.t !== 'free' || hl[i]) { cx.fillStyle = 'rgba(255,255,255,.55)'; cx.fillRect(x, y, cw - 1, 1); cx.fillRect(x, y, 1, ch - 1); cx.fillStyle = 'rgba(0,0,0,.45)'; cx.fillRect(x, y + ch - 2, cw - 1, 1); cx.fillRect(x + cw - 2, y, 1, ch - 1); }
      else { cx.fillStyle = '#d8d8d8'; cx.fillRect(x + cw - 2, y, 1, ch - 1); cx.fillRect(x, y + ch - 2, cw - 1, 1); }
      if (b2.t === 'bad') { cx.fillStyle = '#e10600'; cx.fillRect(x + 2, y + 3, cw - 5, 1); }
    }
    function drawAll() { if (!details) return; cx.fillStyle = '#c0c0c0'; cx.fillRect(0, 0, cv.width, cv.height); for (let i = 0; i < N; i++) cell(i); }
    const pct = () => Math.floor(qi / total * 100);
    function updatePct() {
      const p = fakePct >= 0 ? fakePct : pct();
      qs(b, '.pgd-pct').textContent = `${p}% Complete`; setBar(p / 100); w.setTitle(`Defragmenting Drive C (${p}% Complete)`);
    }
    const flash = (i, kind) => { hl[i] = kind; if (details) cell(i); };
    const unflash = i => { delete hl[i]; if (details) cell(i); };
    // one move: read a run of blocks (green), then write them at the front (red), then they turn cyan
    function step() {
      if (stopped) return;
      if (paused) { timer = setTimeout(step, 200); return; }
      if (phase === 'check') { checkT++; w.status.textContent = `Checking drive for errors... ${Math.min(100, checkT * 4)}%`; setBar(checkT / 25); if (checkT >= 25) { phase = 'go'; w.status.textContent = 'Defragmenting file structure...'; } timer = setTimeout(step, fast ? 5 : 280); return; }
      if (qi >= total) return finish();
      const n = Math.min(total - qi, rnd(1, 2));
      const moves = [];
      for (let m = 0; m < n; m++) {
        const [fid, k] = queue[qi + m];
        while (wp < N && (blocks[wp].t === 'lock' || blocks[wp].t === 'bad' || blocks[wp].t === 'done' || blocks[wp].t === 'opt')) wp++;
        const src = blocks.findIndex(b2 => b2.f === fid && b2.k === k && (b2.t === 'frag' || b2.t === 'prog'));
        if (src < 0 || wp >= N) continue;
        moves.push([src, wp]);
        // swap whatever is at the write position out to where the source was
        const tmp = blocks[wp]; blocks[wp] = { t: blocks[src].t === 'prog' ? 'opt' : 'done', f: fid, k }; blocks[src] = src === wp ? blocks[wp] : tmp;
        wp++;
      }
      qi += n;
      if (!moves.length) { timer = setTimeout(step, 1); return; }
      if (!details) { updatePct(); flicker(); timer = setTimeout(step, fast ? 6 : 265); return; }
      moves.forEach(([s]) => flash(s, 'read'));
      timer = setTimeout(() => {
        if (stopped) return;
        moves.forEach(([s, d]) => { unflash(s); flash(d, 'write'); });
        timer = setTimeout(() => { if (stopped) return; moves.forEach(([, d]) => unflash(d)); updatePct(); flicker(); step(); }, fast ? 2 : 120);
      }, fast ? 2 : 145);
    }
    let fl = 0;
    function flicker() {
      if (++fl % 6 === 0) qs(b, '.pgd-file').textContent = 'Moving: ' + pick(DF_FILES);
      // the classic: the screen saver kicks in, writes to the disk, and the defragger starts again
      if (!changedOnce && pct() > 25 && Math.random() < 0.004) {
        changedOnce = true; fakePct = 0; w.status.textContent = 'Drive C\'s contents have changed. Disk Defragmenter is restarting...';
        const iv = setInterval(() => { if (stopped) return clearInterval(iv); fakePct += 2; if (fakePct >= pct()) { fakePct = -1; clearInterval(iv); w.status.textContent = 'Defragmenting file structure...'; } updatePct(); }, fast ? 5 : 120);
      }
      if (fl % 40 === 0 && fakePct < 0) w.status.textContent = pick(['Defragmenting file structure...', 'Optimizing file arrangement...', 'Moving program files to the front...', 'Defragmenting files...', 'Tidying up after Gubbinz...']);
    }
    function finish() {
      if (done) return; done = true; hl = {}; drawAll(); updatePct(); setBar(1);
      w.status.textContent = 'Defragmentation complete.'; qs(b, '.pgd-file').textContent = `Moved ${fmtN(total)} clusters in ${Math.round((Date.now() - startT) / 1000)} seconds. Your disk is lovely and tidy.`;
      qs(b, '[data-d=stop]').disabled = true; qs(b, '[data-d=pause]').disabled = true;
      sfx('solve'); secret('defrag');
      msg('Disk Defragmenter', 'Defragmentation of drive C: is complete.\n\nDo you want to quit Disk Defragmenter?', 'q', [['Yes', () => w.close()], ['No']]);
    }
    tap(qs(b, '[data-d=det]'), e => {
      details = !details; e.target.textContent = details ? 'Hide Details' : 'Show Details';
      qs(b, '.pgd-map').hidden = !details; qs(b, '[data-d=legend]').hidden = !details;
      sizeWin(w, details ? Math.min(590, innerWidth - 8) : 360); if (details) layoutMap();
    });
    tap(qs(b, '[data-d=pause]'), e => { paused = !paused; e.target.textContent = paused ? 'Resume' : 'Pause'; w.status.textContent = paused ? 'Defragmentation paused.' : 'Defragmenting file structure...'; });
    tap(qs(b, '[data-d=stop]'), () => {
      const was = paused; paused = true;
      dialog('Disk Defragmenter', `<div class="row" style="flex-wrap:nowrap;gap:10px">${I.defrag.replace('<svg', '<svg width="32" height="32" style="flex:none"')}<p style="margin:0">Do you want to stop defragmenting drive C:?<br><br>${pct()}% of the drive has been defragmented. If you stop now, Gubbinz will be very disappointed.</p></div>`,
        [['Resume', () => { paused = was; }], ['Select Drive...', () => { w.close(); defragSelect(); }], ['Exit', () => w.close()]], { w: 360, icon: I.defrag });
    });
    tap(qs(b, '[data-d=legend]'), () => dialog('Defrag Legend', `<div class="pgd-leg">${DF_LEGEND.map(([k, t]) => `<div class="row" style="flex-wrap:nowrap"><i style="background:${DF_COL[k]}"></i><span>${t}</span></div>`).join('')}</div>`, [['Close']], { w: 340, icon: I.defrag }));
    timer = setTimeout(step, 400);
    return w;
  }
  A.register('defrag', { cmd: ['defrag', 'dfrg'], open() { return defragSelect(); } });

  // ================================================================ SCANDISK
  const SD_FINDS = [
    'Found 1 bug in a lost cluster. It has been saved as C:\\FILE0000.CHK (it is still wriggling).',
    'Found 3 cross-linked files: HOMEWORK.DOC and GAMES.EXE were sharing the same cluster. GAMES.EXE won.',
    'Found 14 bytes of crisps in sector 2,044.',
    'Found a file dated 01/01/1900. The Millennium Bug has been here already.',
    'Found 2 invalid long file names: "DAVE_IS_A_NUMPTY.TXT" and "DO NOT OPEN!!!.TXT". They have been left alone.',
    'Found 1 bad sector (sticky). Probably Ribena.',
    'Found a folder that thinks it is a file. It has been given a cup of tea and a sit down.',
  ];
  A.register('scandisk', { single: true, cmd: ['scandisk', 'scandskw', 'chkdsk'], open() {
    const b = h('', 'pgs');
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${I.scandisk.replace('<svg', '<svg width="32" height="32" style="flex:none"')}<span>Select the drive(s) you want to check for errors:</span></div>
      <div class="field pgs-drives">${[['A', '3\u00bd Floppy (A:)', 'fd'], ['C', 'Jack\'s PC (C:)', 'hd'], ['D', 'Cover Disc 7 (D:)', 'cd']].map(([k, n, t]) => `<div class="pgs-dv${k === 'C' ? ' sel' : ''}" data-v="${k}" tabindex="0">${t === 'hd' ? A.ICON.drive : window.JICON ? JICON.icon(t === 'cd' ? 'cdrom' : 'floppy') : t === 'cd' ? '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#e8e8f0" stroke="#000"/><circle cx="16" cy="16" r="3" fill="#fff" stroke="#000"/><path d="M8 12a9 9 0 0 1 6-5" stroke="#f5b3ff" stroke-width="2" fill="none"/></svg>' : '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" fill="#222" stroke="#000"/><rect x="10" y="4" width="12" height="8" fill="#bbb"/><rect x="8" y="17" width="16" height="11" fill="#eee"/></svg>'}<span>${n}</span></div>`).join('')}</div>
      <div class="group"><span class="lg">Type of test</span><label style="display:block"><input type="radio" name="pgst" value="std" checked> <b>Standard</b><br><span class="small" style="margin-left:22px">(checks files and folders for errors)</span></label><label style="display:block;margin-top:4px"><input type="radio" name="pgst" value="th"> <b>Thorough</b><br><span class="small" style="margin-left:22px">(performs Standard test and scans disk surface for errors)</span></label><div class="row" style="justify-content:flex-end"><button class="btn pgs-opt">Options...</button></div></div>
      <label><input type="checkbox" class="pgs-fix" checked> Automatically <u>f</u>ix errors</label>
      <div class="pgs-prog"></div><div class="pgs-now small">&nbsp;</div>
      <div class="row pgs-btns"><button class="btn" data-s="start">Start</button><button class="btn" data-s="close">Close</button><button class="btn" data-s="adv">Advanced...</button></div>`;
    const w = A.win('ScanDisk - Jack\'s PC (C:)', b, { w: 380, icon: I.scandisk, noResize: true, noMax: true, onClose: () => { running = false; clearTimeout(tm); } });
    const set = progBar(qs(b, '.pgs-prog'));
    let drive = 'C', running = false, tm = 0;
    qsa(b, '.pgs-dv').forEach(e => tap(e, () => { qsa(b, '.pgs-dv').forEach(x => x.classList.toggle('sel', x === e)); drive = e.dataset.v; w.setTitle('ScanDisk - ' + qs(e, 'span').textContent); }));
    tap(qs(b, '[data-s=close]'), () => { if (running) { running = false; clearTimeout(tm); qs(b, '[data-s=start]').textContent = 'Start'; qs(b, '.pgs-now').textContent = 'Cancelled.'; set(0); } else w.close(); });
    tap(qs(b, '.pgs-opt'), () => dialog('Surface Scan Options', `<div class="group"><span class="lg">Areas of the disk to scan</span><label style="display:block"><input type="radio" name="pgso" checked> System and data areas</label><label style="display:block"><input type="radio" name="pgso"> System area only</label><label style="display:block"><input type="radio" name="pgso"> Data area only</label><label style="display:block"><input type="radio" name="pgso"> Under the bed (where the socks are)</label></div><label style="display:block"><input type="checkbox"> Do not perform write-testing</label><label style="display:block"><input type="checkbox"> Do not repair bad sectors in hidden and system files</label>`, [['OK'], ['Cancel']], { w: 340, icon: I.scandisk }));
    tap(qs(b, '[data-s=adv]'), () => dialog('ScanDisk Advanced Options', `<div class="pgs-adv"><div class="group"><span class="lg">Display summary</span><label><input type="radio" name="a1" checked> Always</label><br><label><input type="radio" name="a1"> Never</label><br><label><input type="radio" name="a1"> Only if errors found</label></div><div class="group"><span class="lg">Lost file fragments</span><label><input type="radio" name="a2"> Free</label><br><label><input type="radio" name="a2" checked> Convert to files</label><br><label><input type="radio" name="a2"> Feed to Gubbinz</label></div><div class="group"><span class="lg">Check files for</span><label><input type="checkbox" checked> Invalid file names</label><br><label><input type="checkbox" checked> Invalid dates and times (Y2K!)</label><br><label><input type="checkbox"> Duplicate names</label></div><div class="group"><span class="lg">Cross-linked files</span><label><input type="radio" name="a3" checked> Make copies</label><br><label><input type="radio" name="a3"> Delete</label><br><label><input type="radio" name="a3"> Ignore</label></div></div>`, [['OK'], ['Cancel']], { w: 380, icon: I.scandisk }));
    tap(qs(b, '[data-s=start]'), e => {
      if (running) return;
      if (drive === 'A') return msg('ScanDisk', 'ScanDisk cannot check drive A: because the disk is write-protected. (It\'s Dave\'s Doom disk. He\'d go mad.)', 'warn');
      if (drive === 'D') return msg('ScanDisk', 'ScanDisk cannot check drive D: because it is a CD-ROM. CD-ROMs are perfect. Unless you\'ve used one as a coaster.', 'warn');
      const thorough = qs(b, 'input[value=th]').checked, fix = qs(b, '.pgs-fix').checked, fast = /[?&]defragtest/.test(location.search);
      running = true; e.target.textContent = 'Running';
      const stages = [['Checking file allocation table...', 12], ['Checking folders...', 30], ['Checking files...', 26], ['Checking file system...', 14]];
      if (thorough) stages.push(['Checking surface scan...', 120]);
      const tot = stages.reduce((s, x) => s + x[1], 0); let k = 0, n = 0;
      const tick = () => {
        if (!running) return;
        if (k >= stages.length) { running = false; e.target.textContent = 'Start'; set(1); qs(b, '.pgs-now').textContent = 'Complete.'; return results(thorough, fix); }
        const [lab, len] = stages[k]; n++;
        const done = stages.slice(0, k).reduce((s, x) => s + x[1], 0) + n;
        qs(b, '.pgs-now').textContent = lab.startsWith('Checking surface') ? `Checking surface scan, cluster ${fmtN(Math.floor(n / len * 1568260))} of 1,568,260` : lab.startsWith('Checking folders') ? `Checking folders... ${pick(['C:\\JACKOS', 'C:\\GAMES', 'C:\\JACKATAK', 'C:\\My Documents', 'C:\\Program Files\\JackAmp', 'C:\\JACKOS\\SYSTEM'])}` : lab;
        set(done / tot);
        if (n >= len) { k++; n = 0; }
        tm = setTimeout(tick, fast ? 3 : 90 + Math.random() * 60);
      };
      tick();
    });
    function results(thorough, fix) {
      const finds = [SD_FINDS[0]]; const extra = SD_FINDS.slice(1).sort(() => Math.random() - 0.5).slice(0, thorough ? 3 : 1); finds.push(...extra);
      A.fs.add('C:/', { name: 'FILE0000.CHK', type: 'txt', date: d99(), size: '4 KB', secret: 'prog.chk', text: 'FILE0000.CHK\n\nThis file was recovered by ScanDisk from a lost cluster.\n\n...squelch... squelch...\n\n        ___\n     __/o o\\__\n    (  \\___/  )   <- one (1) bug\n     \\_______/\n\nIt seems happy. It has eaten 4 KB of your hard disk.\nDo not let Gubbinz find out about it.\n' });
      if (thorough) secret('scandisk');
      const out = `<p style="margin:0 0 6px"><b>ScanDisk ${fix ? 'found and fixed' : 'found'} ${finds.length} problem${finds.length > 1 ? 's' : ''} on this drive.</b></p><div class="field pgs-finds">${finds.map(f => `<div>&bull; ${esc(f)}</div>`).join('')}</div>
        <table class="pgs-tab"><tr><td>6,423,592,960</td><td>bytes total disk space</td></tr><tr><td>${thorough ? '4,096' : '0'}</td><td>bytes in bad sectors</td></tr><tr><td>1,859,584</td><td>bytes in 412 folders</td></tr><tr><td>2,654,208</td><td>bytes in 87 hidden files</td></tr><tr><td>4,421,992,448</td><td>bytes in 14,227 user files</td></tr><tr><td>1,997,086,720</td><td>bytes available on disk</td></tr><tr><td>4,096</td><td>bytes in each allocation unit</td></tr><tr><td>1,568,260</td><td>total allocation units on disk</td></tr><tr><td>487,570</td><td>available allocation units</td></tr><tr><td>1</td><td>bug (wriggling)</td></tr></table>`;
      dialog('ScanDisk Results - Jack\'s PC (C:)', out, [['Close']], { w: 400, icon: I.scandisk });
      store.set('jhp_prog_lastscan', d99());
    }
    return w;
  } });

  // ================================================================ REGISTRY EDITOR
  // keys are objects; values are strings (REG_SZ), numbers (DWORD), {b:'hex bytes'} (binary) or functions (live values)
  const bin = s => ({ b: s });
  const REG = {
    HKEY_CLASSES_ROOT: {
      '*': { shellex: { ContextMenuHandlers: { GubbinzSearch: { '': '{6969FEED-0000-SQUI-G000-000000000001}' } } } },
      '.bmp': { '': 'Paint.Picture', 'Content Type': 'image/bmp' },
      '.chk': { '': 'chkfile', 'Content Type': 'bug/wriggly' },
      '.doc': { '': 'homeworkfile', NeverOpened: 1 },
      '.exe': { '': 'exefile', 'Content Type': 'application/x-msdownload' },
      '.mid': { '': 'midfile', 'Content Type': 'audio/mid', PreferredPlayer: 'JackAmp' },
      '.squig': { '': 'squigfile', 'Content Type': 'animal/wriggly', 'Feed Before Opening': 1 },
      '.txt': { '': 'txtfile', 'Content Type': 'text/plain' },
      '.wav': { '': 'soundrec', 'Content Type': 'audio/wav' },
      '.y2k': { '': 'Millennium.Bug', 'Content Type': 'application/panic' },
      CLSID: {
        '{00021400-0000-0000-C000-000000000046}': { '': 'Desktop' },
        '{20D04FE0-3AEA-1069-A2D8-08002B30309D}': { '': 'My Computer' },
        '{645FF040-5081-101B-9F08-00AA002F954E}': { '': 'Recycle Bin', Contents: 'Dave\'s old save games, one sock' },
        '{D15C0DED-1999-0000-0000-00000000DAVE}': { '': 'Dave\'s Secret Object', InprocServer32: 'C:\\JACKOS\\SYSTEM\\DAVE.DLL', ThreadingModel: 'Apartment (Dave\'s house)' },
        '{FEEDFACE-0000-0000-0000-00000000GRUB}': { '': 'Gubbinz Food Bowl', Contents: 'Empty. Always empty.' },
      },
      exefile: { shell: { open: { command: { '': '"%1" %*' } } } },
      midfile: { shell: { play: { command: { '': 'C:\\Program Files\\JackAmp\\jackamp.exe "%1"' } } } },
      'Paint.Picture': { '': 'Bitmap Image', DefaultIcon: { '': 'C:\\JACKOS\\MSPAINT.EXE,1' }, shell: { open: { command: { '': 'C:\\JACKOS\\MSPAINT.EXE "%1"' } } } },
      txtfile: { '': 'Text Document', shell: { open: { command: { '': 'C:\\JACKOS\\NOTEPAD.EXE %1' } } } },
    },
    HKEY_CURRENT_USER: {
      AppEvents: { Schemes: { Apps: { '.Default': { SystemStart: { '.Current': { '': 'C:\\JACKOS\\MEDIA\\The JackOS Sound.wav' } }, SystemExit: { '.Current': { '': 'C:\\JACKOS\\MEDIA\\Byeee.wav' } }, SystemHand: { '.Current': { '': 'C:\\JACKOS\\MEDIA\\Uh-oh.wav' } } }, Gubbinz: { Hungry: { '.Current': { '': 'C:\\JACKOS\\MEDIA\\Tummy rumble.wav' } } } } } },
      'Control Panel': {
        Appearance: { 'Current': () => store.get('jhp_prog_scheme', 'JackOS Standard'), CustomColors: bin('ff ff ff 00 ff ff ff 00 00 80 00 00') },
        Colors: { ActiveTitle: '0 0 128', Background: '0 128 128', ButtonFace: '192 192 192', InactiveTitle: '128 128 128', Window: '255 255 255', WindowText: '0 0 0', Hilight: '0 0 128' },
        Cursors: { Arrow: '', Wait: 'C:\\JACKOS\\CURSORS\\hourglass_forever.ani', Squig: 'C:\\JACKOS\\CURSORS\\squig.ani' },
        Desktop: { Wallpaper: () => { const w = getWall(); return w ? (w.img ? 'C:\\My Documents\\My Pictures\\(painting).bmp' : w.name === '(None)' ? '(None)' : w.name) : 'Teal Classic'; }, TileWallpaper: '1', Pattern: '(None)', ScreenSaveActive: () => store.get('jhp_saver', '') ? '1' : '0', 'SCRNSAVE.EXE': () => store.get('jhp_saver', '') || '(None)', ScreenSaveTimeOut: () => String((+store.get('jhp_saverwait', 0) || 0) * 60), CursorBlinkRate: () => String(store.get('jhp_prog_blink', 1000) / 2), MenuShowDelay: '400', DragFullWindows: '1', IconSpacing: '75', SmoothScroll: bin('01 00 00 00') },
        International: { Locale: '00000809', sCountry: 'United Kingdom', sCurrency: '\u00a3', sShortDate: 'dd/MM/yy', sLongDate: 'dd MMMM yyyy', s1159: 'AM', s2359: 'PM', sLanguage: 'ENG' },
        Mouse: { DoubleClickSpeed: () => String(store.get('jhp_prog_dblspeed', 500)), MouseTrails: () => String(store.get('jhp_prog_trails', 0)), SwapMouseButtons: '0', MouseSpeed: '1' },
        Sound: { Beep: 'yes', ExtendedSounds: 'yes' },
      },
      Identities: { '{JACK-0000-0001}': { 'Username': 'Main Identity', 'Last Username': () => nick() } },
      Network: { Persistent: { G: { RemotePath: '\\\\DAVES-PC\\GAMES', UserName: 'DAVE', ProviderName: 'JackNet Networks' } } },
      RemoteAccess: { Default: 'JackNet 56K', 'Dial Count': 3, 'Redial Wait': 5, Profile: { 'JackNet 56K': { 'Last Speed': '49333 bps', 'Times Mom Picked Up The Phone': 1203 } } },
      Software: {
        Dave: { BorrowedGames: 'GoldenEye 007, Pokemon Blue, the good controller', OwesJack: '\u00a32.50 (since March)', Status: 'Best mate', LastSleepover: '28/08/99', FavouriteWeapon: 'Klobb (he is wrong)' },
        Gubbinz: { GubbinzHunger: 0x50, Happiness: 0x2a, Mood: 'Cheeky', FavouriteFood: 'Pizza', Teef: 0x0f, LastFed: 'Who knows', Version: '1.2', Naughtiness: 0xff },
        JackNet: { 'Explorer': { Main: { 'Start Page': 'http://www.jackattack.jnet/', 'Window Title': 'JackNet Explorer', 'Show_ToolBar': 'yes', 'Display Inline Images': 'yes', 'Toolbars Installed': () => String(window.OldPC && OldPC.toolbarItems ? OldPC.toolbarItems().length : 0) }, TypedURLs: { url1: 'http://www.jackattack.jnet/', url2: 'http://www.jackattack.jnet/cheats.htm' } }, DialUp: { Number: '0845 000 0000 (pretend)', Username: () => nick().toLowerCase(), Password: '********', ConnectSpeed: '56000 (it never is)' } },
        JackOS: {
          Cheats: { Konami: 0, Rainbow: 0, BigHead: 0, Note: 'Set Konami to 1. You didn\'t hear it from me.' },
          PasswordHint: 'my pet\'s name',
          TurboButton: 0,
          Tips: { Show: 1, Next: 42 },
          Explorer: { ShellState: bin('24 00 00 00 33 a8 00 00 00 00 00 00 00 00 00 00'), 'Show Hidden Files': 0 },
        },
        Mom: { BedTime: '8:30pm (9:00pm on Fridays)', ComputerTimeLeft: 30, HomeworkDone: 0, RoomTidy: 'No', DinnerReady: 'In 5 minutes (it has been 5 minutes for an hour)', PhoneNeeded: 1, Rules: 'No Internet after 7pm. No giving out your address. No feeding Gubbinz after midnight.' },
        Nan: { Birthday_Card_Money: '\u00a35', KnitsJumpers: 1, JumperColour: 'Brown' },
      },
    },
    HKEY_LOCAL_MACHINE: {
      Config: { '0001': { Display: { Settings: { Resolution: '800,600', BitsPerPixel: '16', 'fonts.fon': 'vgasys.fon' } } } },
      Enum: { PCI: { 'VEN_8086&DEV_7190': { '': 'Host bridge', DeviceDesc: 'Host-to-PCI bridge' } }, Root: { '*SQUIG01': { DeviceDesc: 'Bug Detector', ConfigFlags: bin('01 00 00 00'), Problem: 'Code 10: Gubbinz ate the driver' } }, USB: { ROOT_HUB: { DeviceDesc: 'USB Root Hub', Note: 'Nothing is plugged in. Nothing ever will be.' } } },
      HARDWARE: {
        DESCRIPTION: { System: { CentralProcessor: { '0': { Identifier: 'x86 Family 6 Model 5 Stepping 2', VendorIdentifier: 'GenuineIntel', '~MHz': 350, FeatureSet: bin('ff fb 83 01') } }, FloatingPointProcessor: { '0': { '': 'Present and correct' } } } },
        DEVICEMAP: { SERIALCOMM: { COM1: 'Serial Mouse', COM2: 'JackNet 56K Voice Modem' } },
      },
      Security: { Provider: { Note: 'Access denied. Ask Mom.' } },
      SOFTWARE: {
        Classes: { Note: 'See HKEY_CLASSES_ROOT. It is the same thing. Nobody knows why.' },
        Gubbinz: { 'Virtual Pet': { Version: '1.2', InstallDir: 'C:\\Program Files\\Gubbinz', Uninstallable: 0 } },
        JackAmp: { Version: '2.0 MIDI Edition', Skin: 'Base (black and green)', Volume: () => store.get('jhp_prog_jampvol', 80), 'Visualisation': 'Spectrum analyser' },
        JackOS: {
          CurrentVersion: { ProductName: 'JackOS 98', Version: '4.10.1999', VersionNumber: '4.10.1999', RegisteredOwner: () => nick(), RegisteredOrganization: 'JACK ATTACK! Online', ProductId: '19990-OEM-0031337-42', SystemRoot: 'C:\\JACKOS', ProgramFilesDir: 'C:\\Program Files', Run: { ScanRegistry: 'C:\\JACKOS\\scanregw.exe /autorun', SystemTray: 'SysTray.Exe', GubbinzUpdater: 'C:\\Program Files\\Gubbinz\\notavirus.exe', TaskMonitor: 'C:\\JACKOS\\taskmon.exe' }, Uninstall: { 'JackNet 56K': { DisplayName: 'JackNet 56K Dialler 2.1' }, Gubbinz: { DisplayName: 'Gubbinz Virtual Pet 1.2', NoRemove: 1 } } },
          DoNotEdit: { PinkySwear: 'I promise not to change this', Warning: 'Seriously. Don\'t.', 'Times Jack Has Edited This': 0 },
          RedOnesGoFaster: 1,
          Y2K: { Ready: 'Probably', Rollover: '31/12/99 23:59:59 -> 01/01/00 00:00:00 (fingers crossed)', BugsFound: 0, BugsHiding: 'Unknown' },
          Easter: { Eggs: 'Lots', Hint: 'Try calc. Try the phone. Try everything.' },
        },
      },
      SYSTEM: { CurrentControlSet: { Control: { CrashOnPurpose: 0, ComputerName: { ComputerName: { ComputerName: 'JACKS-PC' } }, 'Session Manager': { Note: 'Nothing to see here' }, TimeZoneInformation: { StandardName: 'GMT Standard Time', DaylightName: 'BST', Bias: 0 } }, Services: { VxD: { SQUIG: { StaticVxD: 'squig.vxd', Start: bin('00'), Wriggling: 1 }, MODEM: { StaticVxD: '*vcomm' }, VCACHE: { MinFileCache: 2048, MaxFileCache: 16384 } }, Class: { Modem: { '0000': { DriverDesc: 'JackNet 56K Voice Modem', AttachedTo: 'COM2', Init: 'AT&FE0V1&C1&D2S0=0' } } } } } },
    },
    HKEY_USERS: { '.DEFAULT': { Note: 'The default user. Very boring. Never plays games.' }, Jack: { Note: () => 'See HKEY_CURRENT_USER, ' + nick() + '.' } },
    HKEY_CURRENT_CONFIG: { Display: { Settings: { Resolution: '800,600', BitsPerPixel: '16', Monitor: '14 inch CRT (it hums)' } }, System: { CurrentControlSet: { Control: { Print: { Printers: { Default: 'Epson (out of cyan)' } } } } } },
    HKEY_DYN_DATA: { 'Config Manager': { Enum: { Note: 'Live data. Changes all the time.' } }, PerfStats: { StatData: { 'KERNEL\\CPUUsage': () => rnd(3, 99), 'KERNEL\\Threads': () => rnd(40, 70), 'VMM\\cpgFree': () => rnd(1000, 9000), 'Gubbinz\\Mischief': () => rnd(90, 100), 'JackNet\\BytesReceived': () => rnd(0, 4800) } } },
  };
  const keyOf = path => { let n = REG; for (const p of path.split('\\').slice(1)) { if (!n || typeof n !== 'object' || n.b || typeof n === 'function') return null; n = n[p]; } return n; };
  const isKey = v => v && typeof v === 'object' && !v.b;
  const typeOf = v => typeof v === 'number' ? 'dw' : (v && v.b != null) ? 'bin' : 'sz';
  // edits persist: path|name -> value, or deleted
  const regState = store.get('jhp_prog_reg', { set: {}, del: [], keys: [] });
  function regApplySaved() {
    for (const k of regState.keys) { let n = REG; for (const p of k.split('\\').slice(1)) { if (!isKey(n[p])) n[p] = {}; n = n[p]; } }
    for (const [pk, v] of Object.entries(regState.set)) { const [path, name] = pk.split('|'); const n = keyOf('My Computer\\' + path); if (isKey(n) && typeof n[name] !== 'function') n[name] = v; }
    for (const pk of regState.del) { const [path, name] = pk.split('|'); const n = keyOf('My Computer\\' + path); if (isKey(n)) delete n[name]; }
  }
  regApplySaved();
  const regSave = () => store.set('jhp_prog_reg', regState);
  const REG_NUM = v => typeof v === 'number' ? v : parseInt(v, 10) || 0;
  // values that do things when you change them. Return false to put the old value back.
  const REG_HOOKS = {
    'hkey_current_user\\control panel\\desktop|wallpaper': v => {
      const s = String(v).trim();
      const k = findWall(s);
      if (k) { setWall({ name: k, col: (getWall() || {}).col || '#008080' }); toast('Registry Editor', `Wallpaper changed to "${k}".`); return true; }
      if (s && s !== '(None)' && CSS.supports('color', s)) { setWall({ name: '(None)', col: s }); toast('Registry Editor', `Desktop colour changed to ${s}.`); return true; }
      msg('Registry Editor', `There is no wallpaper called "${s}". Try one of: ${WALL_KEYS.slice(1).join(', ')}. Or a colour, like red or #ff00ff.`, 'warn'); return false;
    },
    'hkey_current_user\\control panel\\appearance|current': v => { const k = Object.keys(SCHEMES).find(n => n.toLowerCase() === String(v).toLowerCase().trim()); if (!k) { msg('Registry Editor', 'Unknown scheme. Try: ' + Object.keys(SCHEMES).join(', '), 'warn'); return false; } applyScheme(k, true); return true; },
    'hkey_current_user\\control panel\\mouse|mousetrails': v => { Trails.set(REG_NUM(v)); toast('Registry Editor', REG_NUM(v) ? 'Pointer trails on. Wiggle the mouse!' : 'Pointer trails off.'); return true; },
    'hkey_current_user\\control panel\\mouse|doubleclickspeed': v => { store.set('jhp_prog_dblspeed', clamp(REG_NUM(v), 100, 900)); return true; },
    'hkey_current_user\\control panel\\desktop|cursorblinkrate': v => { setBlink(clamp(REG_NUM(v), 100, 1200) * 2, true); toast('Registry Editor', 'Blink rate changed. Everything that blinks now blinks at a different speed.'); return true; },
    'hkey_current_user\\software\\jackos\\cheats|konami': v => { const n = REG_NUM(v); document.body.classList.toggle('rainbow', !!n); if (n) { secret('konami'); toast('Registry Editor', 'Konami = 1. Rainbow mode ON! (+30 lives)'); } else toast('Registry Editor', 'Rainbow mode off.'); return true; },
    'hkey_current_user\\software\\jackos\\cheats|rainbow': v => REG_HOOKS['hkey_current_user\\software\\jackos\\cheats|konami'](v),
    'hkey_current_user\\software\\jackos\\cheats|bighead': v => { if (window.Stickmen && Stickmen.bigHeads) Stickmen.bigHeads(!!REG_NUM(v)); toast('Registry Editor', REG_NUM(v) ? 'BIG HEAD MODE. (Games > Stickman Stunts)' : 'Heads back to normal size.'); return true; },
    'hkey_current_user\\software\\gubbinz|gubbinzhunger': v => { const n = REG_NUM(v); msg('Gubbinz Virtual Pet', n > 0x50 ? `WARNING: GubbinzHunger is now ${n}. Gubbinz is VERY hungry. He is looking at your mouse cable. He is looking at YOU.` : n === 0 ? 'Gubbinz is completely full. He has fallen asleep on the keyboard. zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' : 'You can\'t make a virtual pet less hungry by editing the registry. You have to feed him. (He\'s on the Gubbinz page.)', 'warn'); return n !== 0 || true; },
    'hkey_current_user\\software\\mom|bedtime': () => { secret('bedtime'); msg('Mom', 'Mom has detected a change to BedTime.\n\nBedTime has been reset to 8:30pm. You are grounded. No computer for a week. (Starting tomorrow.)', 'warn'); return false; },
    'hkey_current_user\\software\\mom|computertimeleft': () => { secret('bedtime'); msg('Mom', 'Nice try. ComputerTimeLeft has been set to 0. Go and read a book.', 'warn'); return false; },
    'hkey_current_user\\software\\mom|homeworkdone': () => { msg('Mom', 'Changing a number does not do your homework. I checked.', 'warn'); return false; },
    'hkey_current_user\\software\\mom|roomtidy': () => { msg('Mom', 'I can SEE your room from here.', 'warn'); return false; },
    'hkey_current_user\\software\\dave|owesjack': v => { toast('Dave', /0|nothing|none/i.test(String(v)) ? 'Dave says thanks for letting him off. He still won\'t pay you back.' : 'Dave says he never borrowed any money. Dave is lying.'); return true; },
    'hkey_current_user\\software\\jackos|turbobutton': v => { toast('JackOS', REG_NUM(v) ? 'TURBO ON! The light on the front of the case is lit. Your PC is now exactly as fast as before.' : 'Turbo off. Your PC is still exactly as fast as before.', 5000); return true; },
    'hkey_local_machine\\software\\jackos|redonesgofaster': v => { const n = REG_NUM(v); if (n <= 0) { msg('Registry Editor', 'NOOO! If red ones don\'t go faster, what\'s the point of red paint? Putting it back for your own safety.', 'warn'); return false; } if (n > 1) { secret('redfaster'); toast('Vroom!', `Red ones now go ${n}x faster! Your PC feels faster already. (It isn't.)`, 5000); } return true; },
    'hkey_local_machine\\software\\jackos\\donotedit|pinkyswear': () => { secret('regsecret'); msg('Registry Editor', 'You broke the pinky swear.\n\nAs punishment, here is a secret: in the Control Panel, Passwords wants the old password, and the hint for it lives in HKEY_CURRENT_USER\\Software\\JackOS. Also try typing hklm into the JackNet Explorer address bar. You didn\'t hear it from me.', 'info'); return true; },
    'hkey_local_machine\\software\\jackos\\donotedit|warning': () => REG_HOOKS['hkey_local_machine\\software\\jackos\\donotedit|pinkyswear'](),
    'hkey_local_machine\\software\\jackos\\y2k|ready': v => { toast('Y2K', /yes|1|true/i.test(String(v)) ? 'Y2K compliance achieved! (Probably. Keep a torch handy on New Year\'s Eve.)' : 'Y2K readiness: still "probably".', 5000); return true; },
    'hkey_local_machine\\system\\currentcontrolset\\control|crashonpurpose': v => { if (!REG_NUM(v)) return true; msg('Registry Editor', 'Setting CrashOnPurpose to 1 will crash the computer on purpose. Are you sure?', 'warn', [['Yes', () => { secret('crash'); setTimeout(() => Desk.bsod && Desk.bsod(), 600); }], ['No']]); return false; },
    'hkey_local_machine\\config\\0001\\display\\settings|resolution': v => { if (/1[2-9]\d\d|[2-9]\d\d\d/.test(String(v))) { secret('resolution'); msg('Display', `Your 14 inch monitor makes a high-pitched whine at ${v}. Reverting to 800,600 before it pops.`, 'warn'); return false; } return true; },
  };
  REG_HOOKS['hkey_current_config\\display\\settings|resolution'] = REG_HOOKS['hkey_local_machine\\config\\0001\\display\\settings|resolution'];
  A.REG = REG; A.REG_HOOKS = REG_HOOKS; A.REG_SAVED = regState; // other packs add keys and hooks (js/sx.js: the Great JackNet Hunt's vault)
  let ICO_KEY = '<svg viewBox="0 0 16 16"><path d="M1 3h5l1 1.5h8V14H1z" fill="#f2d16b" stroke="#7a5a00"/></svg>', ICO_KEYO = '<svg viewBox="0 0 16 16"><path d="M1 3h5l1 1.5h7V6H4L1 13z" fill="#f2d16b" stroke="#7a5a00"/><path d="M4 6h11l-3 8H1z" fill="#f8e08a" stroke="#7a5a00"/></svg>';
  const ICO_SZ = '<svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="12" fill="#fff" stroke="#808080"/><text x="3" y="11" font-size="8" font-family="Arial" font-weight="bold" fill="#e10600">ab</text></svg>', ICO_BIN = '<svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="12" fill="#fff" stroke="#808080"/><text x="2" y="11" font-size="6.5" font-family="Arial" font-weight="bold" fill="#0028c8">011</text></svg>';
  let ICO_PC = '<svg viewBox="0 0 16 16"><rect x="1" y="2" width="12" height="9" fill="#c0c0c0" stroke="#000"/><rect x="2.5" y="3.5" width="9" height="6" fill="#008080"/><rect x="3" y="12" width="9" height="2" fill="#808080" stroke="#000" stroke-width=".5"/></svg>';
  if (window.JICON) { ICO_KEY = JICON.get('folder', 16); ICO_KEYO = JICON.get('folderOpen', 16); ICO_PC = JICON.get('computer', 16); }
  function regData(v) {
    if (typeof v === 'function') v = v();
    if (typeof v === 'number') return `0x${(v >>> 0).toString(16).padStart(8, '0')} (${v})`;
    if (v && v.b != null) return v.b;
    return v === '' ? '(value not set)' : `"${v}"`;
  }
  A.register('regedit', { single: true, cmd: ['regedit', 'regedt32'], open() {
    const b = h('', 'pgr');
    b.innerHTML = `<div class="pgr-tree field" tabindex="0"></div><div class="pgr-split"></div><div class="pgr-list field" tabindex="0"><div class="pgr-hd"><span>Name</span><span>Data</span></div><div class="pgr-rows"></div></div>`;
    const w = A.win('Registry Editor', b, { w: 640, h: 420, icon: I.regedit, menubar: true, status: true, minW: 300, minH: 240, onClose: () => clearInterval(live) });
    const tree = qs(b, '.pgr-tree'), rows = qs(b, '.pgr-rows');
    let curPath = 'My Computer', selVal = null, lastFind = '', findPos = null;
    const open = new Set(['My Computer']);
    function renderTree() {
      const out = [];
      (function walk(path, name, node, depth) {
        const kids = path === 'My Computer' ? Object.keys(REG) : Object.keys(node).filter(k => isKey(node[k])).sort((a, c) => a.localeCompare(c));
        const isOpen = open.has(path);
        out.push(`<div class="pgr-k${path === curPath ? ' sel' : ''}" data-p="${esc(path)}" style="padding-left:${depth * 16 + 2}px"><span class="pgr-pm">${kids.length ? (isOpen ? '&#8211;' : '+') : ''}</span>${path === 'My Computer' ? ICO_PC : isOpen ? ICO_KEYO : ICO_KEY}<span class="pgr-kn">${esc(name)}</span></div>`);
        if (isOpen) kids.forEach(k => walk(path + '\\' + k, k, path === 'My Computer' ? REG[k] : node[k], depth + 1));
      })('My Computer', 'My Computer', REG, 0);
      tree.innerHTML = out.join('');
      qsa(tree, '.pgr-k').forEach(e => {
        tap(qs(e, '.pgr-pm'), ev => { ev.stopPropagation(); toggle(e.dataset.p); });
        tap(e, () => select(e.dataset.p));
        on(e, 'dblclick', () => toggle(e.dataset.p));
        on(e, 'contextmenu', ev => { ev.preventDefault(); select(e.dataset.p); IE.menu(keyMenu(), ev.clientX, ev.clientY); });
      });
      const s = qs(tree, '.sel'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
    }
    function toggle(p) { if (open.has(p)) { open.delete(p); if (curPath.startsWith(p + '\\')) curPath = p; } else open.add(p); renderTree(); renderVals(); }
    function select(p) { curPath = p; selVal = null; if (touchy() && !open.has(p)) open.add(p); renderTree(); renderVals(); }
    function renderVals() {
      w.status.textContent = curPath;
      const n = curPath === 'My Computer' ? null : keyOf(curPath);
      if (!n) { rows.innerHTML = ''; return; }
      const names = Object.keys(n).filter(k => !isKey(n[k]));
      if (!names.includes('')) names.unshift('');
      rows.innerHTML = names.sort((a, c) => a === '' ? -1 : c === '' ? 1 : a.localeCompare(c)).map(k => { const v = n[k]; const t = v === undefined ? 'sz' : typeOf(typeof v === 'function' ? v() : v); return `<div class="pgr-v${k === selVal ? ' sel' : ''}" data-n="${esc(k)}" tabindex="-1"><span>${t === 'sz' ? ICO_SZ : ICO_BIN}${esc(k === '' ? '(Default)' : k)}</span><span>${esc(v === undefined ? '(value not set)' : regData(v))}</span></div>`; }).join('');
      qsa(rows, '.pgr-v').forEach(e => {
        tap(e, () => { selVal = e.dataset.n; qsa(rows, '.pgr-v').forEach(x => x.classList.toggle('sel', x === e)); });
        dbl(e, () => edit(e.dataset.n));
        on(e, 'contextmenu', ev => { ev.preventDefault(); selVal = e.dataset.n; renderVals(); IE.menu([{ label: 'Modify', act: () => edit(selVal) }, '-', { label: 'Delete', act: () => del(selVal) }, { label: 'Rename', act: () => rename(selVal) }], ev.clientX, ev.clientY); });
      });
    }
    const live = setInterval(() => { if (/HKEY_DYN_DATA/.test(curPath)) renderVals(); }, 1000);
    const pathKey = () => curPath.replace(/^My Computer\\/, '');
    const hookKey = name => (pathKey() + '|' + name).toLowerCase();
    function setVal(name, v) {
      const n = keyOf(curPath), old = n[name];
      n[name] = v;
      const hook = REG_HOOKS[hookKey(name)];
      if (hook && hook(v, old) === false) { if (old === undefined) delete n[name]; else n[name] = old; renderVals(); return; }
      if (typeof old !== 'function') { regState.set[pathKey() + '|' + name] = v; regState.del = regState.del.filter(x => x !== pathKey() + '|' + name); regSave(); }
      else n[name] = old; // live values stay live
      renderVals();
    }
    function edit(name) {
      if (curPath === 'My Computer') return;
      if (/HKEY_DYN_DATA/.test(curPath)) return msg('Registry Editor', 'That is live data. You can\'t edit the future. (Or the present.)', 'warn');
      if (/Security/.test(curPath)) return msg('Registry Editor', 'Cannot edit: Access is denied. Ask Mom.', 'warn');
      const n = keyOf(curPath); let v = n[name]; if (typeof v === 'function') v = v();
      const t = v === undefined ? 'sz' : typeOf(v);
      const nm = esc(name === '' ? '(Default)' : name);
      if (t === 'dw') {
        const d = dialog('Edit DWORD Value', `<label>Value <u>n</u>ame:<input type="text" readonly value="${nm}" style="width:100%"></label><div class="row" style="align-items:flex-start;margin-top:6px"><label style="flex:1">Value <u>d</u>ata:<input type="text" class="pgr-in" value="${(v >>> 0).toString(16)}" style="width:100%"></label><div class="group" style="margin:6px 0 0"><span class="lg">Base</span><label style="display:block"><input type="radio" name="pgrb" value="16" checked> Hexadecimal</label><label style="display:block"><input type="radio" name="pgrb" value="10"> Decimal</label></div></div>`,
          [['OK', bx => { const base = +qs(bx, 'input[name=pgrb]:checked').value, nv = parseInt(qs(bx, '.pgr-in').value, base); if (Number.isNaN(nv)) { toast('Registry Editor', 'That is not a number. Not even in hex.'); return false; } setVal(name, nv); }], ['Cancel']], { w: 330, icon: I.regedit });
        qsa(d.b, 'input[name=pgrb]').forEach(r => on(r, 'change', () => { const i = qs(d.b, '.pgr-in'), from = r.value === '10' ? 16 : 10, x = parseInt(i.value, from); if (!Number.isNaN(x)) i.value = x.toString(+r.value); }));
        setTimeout(() => qs(d.b, '.pgr-in').select(), 50);
      } else if (t === 'bin') {
        dialog('Edit Binary Value', `<label>Value <u>n</u>ame:<input type="text" readonly value="${nm}" style="width:100%"></label><label style="display:block;margin-top:6px">Value <u>d</u>ata:<textarea class="pgr-in mono" rows="3" style="width:100%">${esc(v.b)}</textarea></label>`,
          [['OK', bx => { const s = qs(bx, '.pgr-in').value.trim().toLowerCase(); if (!/^([0-9a-f]{2}\s*)*$/.test(s)) { toast('Registry Editor', 'Binary values are pairs of hex digits, like 0f a3 ff.'); return false; } setVal(name, bin(s.replace(/\s+/g, ' '))); }], ['Cancel']], { w: 340, icon: I.regedit });
      } else {
        const d = dialog('Edit String', `<label>Value <u>n</u>ame:<input type="text" readonly value="${nm}" style="width:100%"></label><label style="display:block;margin-top:6px">Value <u>d</u>ata:<input type="text" class="pgr-in" value="${esc(v || '')}" style="width:100%"></label>`,
          [['OK', bx => { setVal(name, qs(bx, '.pgr-in').value); }], ['Cancel']], { w: 340, icon: I.regedit });
        on(qs(d.b, '.pgr-in'), 'keydown', e => { if (e.key === 'Enter') qs(d.b, '.pg-dlgbtns .btn').click(); });
        setTimeout(() => qs(d.b, '.pgr-in').select(), 50);
      }
    }
    const SYS_ROOTS = /^My Computer\\HKEY_[A-Z_]+(\\|$)/;
    function del(name) {
      if (name == null) { // delete key
        if (curPath === 'My Computer' || /^My Computer\\HKEY_[A-Z_]+$/.test(curPath)) return msg('Registry Editor', 'Cannot delete the whole of ' + curPath.split('\\').pop() + '. JackOS would fall over. (And then Mom would make you fix it.)', 'warn');
        if (!regState.keys.includes(pathKey())) return msg('Registry Editor', `Cannot delete ${curPath.split('\\').pop()}: Error while deleting key. (Gubbinz is sitting on it.)`, 'warn');
        msg('Confirm Key Delete', 'Are you sure you want to delete this key and all of its subkeys?', 'q', [['Yes', () => { const parent = curPath.split('\\').slice(0, -1).join('\\'); delete keyOf(parent)[curPath.split('\\').pop()]; regState.keys = regState.keys.filter(k => k !== pathKey() && !k.startsWith(pathKey() + '\\')); regSave(); curPath = parent; renderTree(); renderVals(); }], ['No']]);
        return;
      }
      const n = keyOf(curPath); if (!n || name === '') return;
      const pk = pathKey() + '|' + name;
      if (typeof n[name] === 'function' || (REG_HOOKS[hookKey(name)] && !regState.set[pk])) return msg('Registry Editor', `Cannot delete ${name}: it is holding up something important. (Probably the Start button.)`, 'warn');
      msg('Confirm Value Delete', 'Are you sure you want to delete this value?', 'q', [['Yes', () => { delete n[name]; delete regState.set[pk]; if (!regState.del.includes(pk)) regState.del.push(pk); regSave(); selVal = null; renderVals(); }], ['No']]);
    }
    function rename(name) { if (!name) return; toast('Registry Editor', 'Renaming registry values confuses the programs that use them. Gubbinz has hidden the Rename button.'); }
    function newVal(type) {
      if (curPath === 'My Computer') return;
      const n = keyOf(curPath); let i = 1; while (n['New Value #' + i] !== undefined) i++;
      const name = 'New Value #' + i;
      setVal(name, type === 'dw' ? 0 : type === 'bin' ? bin('') : '');
      selVal = name; renderVals();
    }
    function newKey() {
      if (curPath === 'My Computer') return msg('Registry Editor', 'You can\'t add a new HKEY. There are exactly six. That\'s the rule.', 'warn');
      const n = keyOf(curPath); let i = 1; while (n['New Key #' + i]) i++;
      n['New Key #' + i] = {}; regState.keys.push(pathKey() + '\\New Key #' + i); regSave();
      open.add(curPath); curPath += '\\New Key #' + i; renderTree(); renderVals();
    }
    function find(again) {
      const go = q => {
        lastFind = q; const low = q.toLowerCase(); if (!low) return;
        const hits = [];
        (function walk(path, node) { for (const k of Object.keys(node)) { const v = node[k]; const p = path + '\\' + k; if (isKey(v)) { if (k.toLowerCase().includes(low)) hits.push([p, null]); walk(p, v); } else if (k.toLowerCase().includes(low) || String(typeof v === 'function' ? '' : (v && v.b) || v).toLowerCase().includes(low)) hits.push([path, k]); } })('My Computer', REG);
        if (!hits.length) return msg('Registry Editor', 'Finished searching through the registry.', 'info');
        let i = 0;
        if (findPos) { i = hits.findIndex(([p, k]) => p === findPos[0] && k === findPos[1]) + 1; if (i >= hits.length) { findPos = null; return msg('Registry Editor', 'Finished searching through the registry.', 'info'); } }
        const [p, k] = hits[i]; findPos = hits[i];
        const parts = p.split('\\'); for (let j = 1; j <= parts.length; j++) open.add(parts.slice(0, j).join('\\'));
        curPath = p; selVal = k; renderTree(); renderVals();
      };
      if (again && lastFind) return go(lastFind);
      findPos = null;
      dialog('Find', `<label>Find what: <input type="text" class="pgr-q" value="${esc(lastFind)}" style="width:100%"></label><div class="group"><span class="lg">Look at</span><label><input type="checkbox" checked> Keys</label> <label><input type="checkbox" checked> Values</label> <label><input type="checkbox" checked> Data</label></div>`,
        [['Find Next', bx => go(qs(bx, '.pgr-q').value.trim())], ['Cancel']], { w: 320, icon: I.regedit });
    }
    function keyMenu() { return [{ label: 'Expand', act: () => toggle(curPath) }, { label: 'New', sub: [{ label: 'Key', act: newKey }, '-', { label: 'String Value', act: () => newVal('sz') }, { label: 'Binary Value', act: () => newVal('bin') }, { label: 'DWORD Value', act: () => newVal('dw') }] }, '-', { label: 'Find...', act: () => find() }, '-', { label: 'Delete', act: () => del(null) }, { label: 'Rename', act: () => toast('Registry Editor', 'Keys cannot be renamed. They are very attached to their names.') }, '-', { label: 'Copy Key Name', act: () => { Clip.set(curPath.replace(/^My Computer\\/, '')); toast('Registry Editor', 'Key name copied.'); } }]; }
    A.menubar(w, [
      ['Registry', [{ label: 'Import Registry File...', act: () => msg('Import', 'Insert the floppy disk with the .REG file in drive A:. (Not Dave\'s Doom disk.)', 'info') }, { label: 'Export Registry File...', act: () => { const lines = ['REGEDIT4', '']; (function walk(path, node) { const vals = Object.keys(node).filter(k => !isKey(node[k])); if (vals.length) { lines.push('[' + path + ']'); vals.forEach(k => { let v = node[k]; if (typeof v === 'function') v = v(); lines.push((k === '' ? '@' : '"' + k + '"') + '=' + (typeof v === 'number' ? 'dword:' + (v >>> 0).toString(16).padStart(8, '0') : v && v.b != null ? 'hex:' + v.b.replace(/ /g, ',') : '"' + String(v).replace(/\\/g, '\\\\') + '"')); }); lines.push(''); } Object.keys(node).filter(k => isKey(node[k])).forEach(k => walk(path + '\\' + k, node[k])); })(pathKey(), curPath === 'My Computer' ? REG.HKEY_LOCAL_MACHINE.SOFTWARE.JackOS : keyOf(curPath)); Desk.notepad('export.reg', lines.join('\n')); } }, '-', { label: 'Connect Network Registry...', act: () => msg('Connect Network Registry', 'Connecting to \\\\DAVES-PC...\n\nDave\'s computer is switched off. His Mom unplugs it at 8 o\'clock.', 'warn') }, { label: 'Disconnect Network Registry...', dis: true }, '-', { label: 'Print...', key: 'Ctrl+P', act: () => msg('Print', 'Printing the whole registry would use 4,000 pages. And it\'s out of cyan.', 'warn') }, '-', { label: 'Exit', act: () => w.close() }]],
      ['Edit', () => [{ label: 'Modify', dis: selVal == null, act: () => edit(selVal) }, '-', { label: 'New', sub: [{ label: 'Key', act: newKey }, '-', { label: 'String Value', act: () => newVal('sz') }, { label: 'Binary Value', act: () => newVal('bin') }, { label: 'DWORD Value', act: () => newVal('dw') }] }, '-', { label: 'Delete', key: 'Del', act: () => del(selVal) }, { label: 'Rename', act: () => rename(selVal) }, '-', { label: 'Copy Key Name', act: () => Clip.set(pathKey()) }, '-', { label: 'Find...', key: 'Ctrl+F', act: () => find() }, { label: 'Find Next', key: 'F3', act: () => find(true) }]],
      ['View', [{ label: 'Status Bar', chk: true, act: () => { const s = w.el.querySelector('.appstatus'); s.hidden = !s.hidden; } }, '-', { label: 'Split', act: () => b.classList.toggle('pgr-swap') }, '-', { label: 'Refresh', key: 'F5', act: () => { renderTree(); renderVals(); } }]],
      ['Help', [{ label: 'Help Topics', act: () => Desk.notepad('Registry Editor Help.txt', 'REGISTRY EDITOR HELP\n====================\n\nThe registry is where JackOS keeps all its settings.\nIt is like the brain of the computer. A very messy brain.\n\nClick a folder (a "key") on the left to see its values on the right.\nDouble-click a value to change it.\n\nSome values really do things. Some are Mom\'s.\nIf in doubt: DON\'T. (But also: try it and see.)\n\nEdit > Find (Ctrl+F) searches everything. F3 finds the next one.\n') }, '-', { label: 'About Registry Editor', act: () => msg('About Registry Editor', `Registry Editor\nJackOS 98, version 4.10.1999\n\nLicensed to: ${nick()}\n\nKeys: lots\nValues: loads\nExplosions so far: 0`, 'info') }]],
    ]);
    on(w.el, 'keydown', e => {
      if (e.target.closest('input,textarea')) return;
      if (e.key === 'F3') { e.preventDefault(); find(true); } else if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); find(); }
      else if (e.key === 'F5') { e.preventDefault(); renderTree(); renderVals(); }
      else if (e.key === 'Delete') del(selVal);
      else if (e.key === 'Enter' && selVal != null) edit(selVal);
    });
    renderTree(); renderVals();
    if (!store.get('jhp_prog_regwarned', false)) {
      w.el.style.visibility = 'hidden';
      msg('Registry Editor', 'WARNING: Editing the registry can make your computer explode. Probably.\n\nIf you change the wrong thing, JackOS might stop working, Gubbinz might get hungry, and Mom might find out. Do you want to continue?', 'warn', [['Yes', () => { store.set('jhp_prog_regwarned', true); w.el.style.visibility = ''; w.focus(); }], ['No', () => w.close()]]);
    }
    return w;
  } });

  // ================================================================ CONTROL PANEL
  const CI = { // applet icons
    access: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#2a7ad8" stroke="#000"/><circle cx="16" cy="8" r="2.6" fill="#fff"/><path d="M8 12h16M16 12v7l-4 7M16 19l4 7" stroke="#fff" stroke-width="2.6" fill="none"/></svg>',
    hardware: '<svg viewBox="0 0 32 32"><rect x="3" y="6" width="20" height="16" fill="#c0c0c0" stroke="#000"/><rect x="5" y="8" width="16" height="12" fill="#000080"/><rect x="8" y="24" width="10" height="3" fill="#808080" stroke="#000"/><rect x="20" y="16" width="10" height="10" fill="#2a9a2a" stroke="#000"/><path d="M22 18v6M25 18v6M28 18v6" stroke="#ffd400"/></svg>',
    addrem: '<svg viewBox="0 0 32 32"><path d="M3 12l12-5 14 5v13l-14 5-12-5z" fill="#c8a060" stroke="#000"/><path d="M3 12l12 5 14-5M15 17v13" stroke="#000" fill="none"/><circle cx="22" cy="8" r="6" fill="#e8e8f0" stroke="#000"/><circle cx="22" cy="8" r="1.5" fill="#fff" stroke="#000"/></svg>',
    datetime: '<svg viewBox="0 0 32 32"><rect x="2" y="6" width="17" height="20" fill="#fff" stroke="#000"/><rect x="2" y="6" width="17" height="5" fill="#e10600"/><path d="M5 15h11M5 19h11M5 23h8" stroke="#808080"/><circle cx="22" cy="18" r="8" fill="#ffffe0" stroke="#000"/><path d="M22 12v6l4 2" stroke="#000" stroke-width="1.6" fill="none"/></svg>',
    display: '<svg viewBox="0 0 32 32"><rect x="3" y="3" width="26" height="20" fill="#c0c0c0" stroke="#000"/><rect x="5" y="5" width="22" height="16" fill="#008080"/><rect x="7" y="7" width="10" height="7" fill="#c0c0c0" stroke="#000" stroke-width=".6"/><rect x="7" y="7" width="10" height="2" fill="#000080"/><rect x="11" y="24" width="10" height="4" fill="#808080" stroke="#000"/></svg>',
    fonts: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><text x="7" y="25" font-family="Times New Roman,serif" font-size="15" font-weight="bold" fill="#000080">A</text><text x="17" y="25" font-family="Arial" font-size="11" fill="#e10600">a</text></svg>',
    joy: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="25" rx="13" ry="5" fill="#333" stroke="#000"/><rect x="14" y="8" width="4" height="16" fill="#555" stroke="#000"/><circle cx="16" cy="7" r="5" fill="#e10600" stroke="#000"/><circle cx="25" cy="24" r="2" fill="#ffd400"/></svg>',
    internet: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#1e6fd9" stroke="#003"/><path d="M6 13c6-4 14-4 20 0M5 19c7 3 15 3 22 0M16 4v24" stroke="#fff" stroke-width="1.5" fill="none"/><ellipse cx="16" cy="16" rx="17" ry="5.5" fill="none" stroke="#ffd400" stroke-width="2" transform="rotate(-20 16 16)"/></svg>',
    keyboard: '<svg viewBox="0 0 32 32"><rect x="1" y="10" width="30" height="14" rx="1" fill="#e0e0d8" stroke="#000"/><g fill="#999"><rect x="3" y="12" width="3" height="3"/><rect x="7" y="12" width="3" height="3"/><rect x="11" y="12" width="3" height="3"/><rect x="15" y="12" width="3" height="3"/><rect x="19" y="12" width="3" height="3"/><rect x="23" y="12" width="6" height="3"/><rect x="3" y="16" width="5" height="3"/><rect x="9" y="16" width="3" height="3"/><rect x="13" y="16" width="3" height="3"/><rect x="17" y="16" width="3" height="3"/><rect x="21" y="16" width="8" height="3"/><rect x="8" y="20" width="16" height="2.5"/></g></svg>',
    modem: '<svg viewBox="0 0 32 32"><rect x="2" y="12" width="28" height="11" rx="2" fill="#e0e0d8" stroke="#000"/><g fill="#0c0"><circle cx="7" cy="17" r="1.3"/><circle cx="11" cy="17" r="1.3"/><circle cx="15" cy="17" r="1.3" fill="#e10600"/><circle cx="19" cy="17" r="1.3"/></g><path d="M22 7c3 0 5 2 5 5M22 3c5 0 9 4 9 9" stroke="#000" fill="none"/></svg>',
    mouse: '<svg viewBox="0 0 32 32"><path d="M16 4c-6 0-9 4-9 10v6c0 6 4 9 9 9s9-3 9-9v-6c0-6-3-10-9-10z" fill="#e8e8e0" stroke="#000"/><path d="M7 14h18M16 4v10" stroke="#000"/><path d="M16 4c0-2 2-3 4-3" stroke="#000" fill="none"/></svg>',
    multimedia: '<svg viewBox="0 0 32 32"><path d="M3 12h5l7-6v20l-7-6H3z" fill="#c0c0c0" stroke="#000"/><circle cx="23" cy="20" r="7" fill="#e8e8f0" stroke="#000"/><circle cx="23" cy="20" r="1.5" fill="#fff" stroke="#000"/><path d="M18 9c2 1 3 3 3 5" stroke="#000" fill="none"/></svg>',
    network: '<svg viewBox="0 0 32 32"><rect x="2" y="3" width="12" height="9" fill="#c0c0c0" stroke="#000"/><rect x="3.5" y="4.5" width="9" height="6" fill="#008080"/><rect x="18" y="3" width="12" height="9" fill="#c0c0c0" stroke="#000"/><rect x="19.5" y="4.5" width="9" height="6" fill="#008080"/><path d="M8 12v8h16v-8M16 20v6" stroke="#000" stroke-width="1.5" fill="none"/><rect x="10" y="26" width="12" height="4" fill="#808080" stroke="#000"/></svg>',
    passwords: '<svg viewBox="0 0 32 32"><circle cx="10" cy="12" r="6" fill="#ffd400" stroke="#7a5a00" stroke-width="1.4"/><circle cx="10" cy="12" r="2" fill="#fff" stroke="#7a5a00"/><path d="M14 16l12 12M22 24l3-3M19 21l3-3" stroke="#7a5a00" stroke-width="2.4"/></svg>',
    power: '<svg viewBox="0 0 32 32"><rect x="4" y="9" width="20" height="14" rx="1" fill="#fff" stroke="#000"/><rect x="24" y="13" width="4" height="6" fill="#000"/><rect x="6" y="11" width="12" height="10" fill="#0c0"/><path d="M15 6l-4 9h5l-3 10" stroke="#e10600" stroke-width="2" fill="none"/></svg>',
    printers: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><rect x="9" y="12" width="14" height="5" fill="#fff" stroke="#000"/><rect x="6" y="16" width="20" height="8" fill="#b8b8b8" stroke="#000"/><rect x="9" y="22" width="14" height="5" fill="#fff" stroke="#000"/></svg>',
    regional: '<svg viewBox="0 0 32 32"><circle cx="14" cy="16" r="12" fill="#5aa0ff" stroke="#000"/><path d="M8 8c4 1 6 4 4 8s-6 3-6 8M18 6c-2 3 2 5 5 5s3 5 1 8" fill="#3a9a2a" stroke="#1a5a1a"/><rect x="20" y="20" width="11" height="8" fill="#fff" stroke="#000"/><path d="M20 24h11M25.5 20v8" stroke="#e10600" stroke-width="2"/></svg>',
    sounds: '<svg viewBox="0 0 32 32"><path d="M3 12h6l8-7v22l-8-7H3z" fill="#ffd400" stroke="#000"/><path d="M21 11c2 2 2 8 0 10M24 8c4 4 4 12 0 16M27 5c5 6 5 16 0 22" stroke="#000" fill="none" stroke-width="1.4"/></svg>',
    system: '<svg viewBox="0 0 32 32"><rect x="18" y="3" width="11" height="26" fill="#c0c0c0" stroke="#000"/><rect x="20" y="6" width="7" height="2" fill="#808080"/><rect x="20" y="10" width="7" height="2" fill="#808080"/><circle cx="23.5" cy="24" r="1.5" fill="#0c0"/><rect x="2" y="7" width="15" height="12" fill="#c0c0c0" stroke="#000"/><rect x="3.5" y="8.5" width="12" height="9" fill="#000080"/><rect x="5" y="21" width="9" height="3" fill="#808080" stroke="#000"/></svg>',
    gubbinz: '<svg viewBox="0 0 32 32"><rect x="8" y="9" width="16" height="15" fill="#3a9a2a" stroke="#000"/><path d="M8 13L2 9v9zM24 13l6-4v9z" fill="#3a9a2a" stroke="#000"/><rect x="11" y="13" width="3.5" height="3.5" fill="#e10600"/><rect x="17.5" y="13" width="3.5" height="3.5" fill="#e10600"/><path d="M11 20h10" stroke="#fff" stroke-width="2" stroke-dasharray="2 1.4"/></svg>',
  };
  if (window.JICON) Object.assign(CI, { datetime: JICON.icon('datetime'), display: JICON.icon('display'), fonts: JICON.icon('fonts'), joy: JICON.icon('joystick'), internet: JICON.icon('jacknet'), keyboard: JICON.icon('keyboard'), modem: JICON.icon('modem'), mouse: JICON.icon('mouse'), network: JICON.icon('network'), passwords: JICON.icon('key'), printers: JICON.icon('printer'), sounds: JICON.icon('sound'), system: JICON.icon('computer'), gubbinz: JICON.icon('gubbinz'), access: JICON.icon('access'), hardware: JICON.icon('addhw'), addrem: JICON.icon('addrem'), multimedia: JICON.icon('multimedia'), power: JICON.icon('power'), regional: JICON.icon('regional') });
  const mini = (svg, sz) => svg.replace('<svg', `<svg width="${sz || 32}" height="${sz || 32}"`);
  A.ui = { sheet, dialog, progBar, mini, h, CI, I, uninstallAnim: (n, after) => uninstall(n, after), FAKE_PROGS: () => FAKE_PROGS }; // shared with setup.js (Add/Remove Programs)
  const monitor = inner => `<div class="pgk-mon"><div class="pgk-scr">${inner || ''}</div><div class="pgk-stand"></div></div>`;
  const RES = ['640 by 480', '800 by 600', '1024 by 768', '1152 by 864', '1280 by 1024', '1600 by 1200'];

  function appletDisplay(tab) {
    let stopPrev = null;
    const SP = {};
    const S = sheet('Display Properties', [
      ['Background', (pg, c) => {
        const cur = getWall() || { name: 'Teal Classic', col: '#008080' };
        let sel = Object.assign({ mode: 'Tile' }, cur);
        const pics = loadPics();
        const SW = ['#008080', '#000080', '#000000', '#808080', '#800000', '#008000', '#800080', '#3a6ea5', '#c0c0c0', '#004040', '#5b16c9', '#ff2a6d'];
        pg.innerHTML = `${monitor()}<div class="pgk-cols"><div style="flex:1;min-width:150px">Select a wallpaper or a picture:<select size="7" class="pgk-wl" style="width:100%">${WALL_KEYS.map(k => `<option value="w:${esc(k)}">${esc(k)}</option>`).join('')}${pics.map(p => `<option value="p:${esc(p.name)}">${esc(p.name)}</option>`).join('')}</select></div><div style="width:120px"><label>Display:<select class="pgk-mode" style="width:100%"><option>Tile</option><option>Center</option><option>Stretch</option></select></label><div style="margin-top:6px">Colour:</div><div class="pgk-sw">${SW.map(s => `<button style="background:${s}" data-c="${s}" aria-label="${s}"></button>`).join('')}</div><button class="btn pgk-pat" style="margin-top:6px;width:100%">Pattern...</button></div></div>`;
        const list = qs(pg, '.pgk-wl'), scr = qs(pg, '.pgk-scr');
        list.value = sel.img ? (pics.find(p => p.data === sel.img) ? 'p:' + pics.find(p => p.data === sel.img).name : '') : 'w:' + (sel.name || 'Teal Classic');
        qs(pg, '.pgk-mode').value = sel.mode || 'Tile';
        const prev = () => { const css = wallCss(sel); scr.style.background = css || ''; if (!css) scr.style.background = 'var(--pgk-teal)'; };
        prev();
        on(list, 'change', () => { const v = list.value; if (v.startsWith('w:')) sel = { name: v.slice(2), col: sel.col || '#008080', mode: sel.mode }; else { const p = pics.find(x => x.name === v.slice(2)); if (p) sel = { img: p.data, col: sel.col || '#008080', mode: sel.mode || 'Tile' }; } prev(); c.dirty(); });
        on(qs(pg, '.pgk-mode'), 'change', e => { sel.mode = e.target.value; prev(); c.dirty(); });
        qsa(pg, '.pgk-sw button').forEach(x => tap(x, () => { sel.col = x.dataset.c; if (!sel.img && sel.name === 'Teal Classic') sel.name = '(None)'; if (!sel.img) list.value = 'w:' + sel.name; prev(); c.dirty(); }));
        tap(qs(pg, '.pgk-pat'), () => msg('Pattern', 'Patterns were so 1995. Pick a wallpaper instead! (Blobbits, Rubik, Tartan and Hot Dog are the best.)', 'info'));
        c.onApply(() => setWall(sel.name === 'Teal Classic' && !sel.img ? null : sel));
      }],
      ['Screen Saver', (pg, c) => {
        const S2 = window.Savers && Savers.list ? Savers.list() : null;
        const nameOf = x => typeof x === 'string' ? x : (x && (x.name || x.id)) || String(x);
        let raw = null; try { raw = localStorage.getItem('jhp_saver'); } catch (e) {}
        if (raw && raw[0] === '"') { try { raw = JSON.parse(raw); } catch (e) {} }
        let waitRaw = null; try { waitRaw = localStorage.getItem('jhp_saverwait'); } catch (e) {}
        const wait = waitRaw == null || waitRaw === '' ? 3 : (parseFloat(String(waitRaw).replace(/"/g, '')) || 0);
        pg.innerHTML = `${monitor('<canvas width="152" height="112"></canvas><span class="pgk-none"></span>')}${S2 ? `<div class="group"><span class="lg">Screen Saver</span><div class="row"><select class="pgk-ss" style="flex:1;min-width:120px"><option>(None)</option>${S2.map(x => `<option>${esc(nameOf(x))}</option>`).join('')}</select><button class="btn pgk-sset">Settings...</button><button class="btn pgk-sprev">Preview</button></div><div class="row" style="margin-top:6px"><label><input type="checkbox" disabled> Password protected</label><span style="flex:1"></span><label>Wait: <input type="number" class="pgk-wait" min="0" max="60" value="${wait}" style="width:52px"> minutes</label></div></div>` : '<p style="text-align:center"><b>(no screen savers installed)</b></p>'}<div class="group"><span class="lg">Energy saving features of monitor</span><div class="row" style="flex-wrap:nowrap">${mini(CI.power, 24)}<span style="flex:1">To adjust the power settings for your monitor, click Settings.</span><button class="btn pgk-pow">Settings...</button></div></div>`;
        tap(qs(pg, '.pgk-pow'), () => appletPower());
        if (!S2) return;
        const sel = qs(pg, '.pgk-ss'), cv = qs(pg, 'canvas'), none = qs(pg, '.pgk-none');
        sel.value = raw && [...sel.options].some(o => o.value === raw) ? raw : (raw === '(None)' ? '(None)' : (raw ? '(None)' : nameOf(S2[0])));
        if (raw == null && [...sel.options].some(o => o.value === 'Flying Saucers')) sel.value = 'Flying Saucers';
        const halt = () => { if (stopPrev) { try { stopPrev(); } catch (e) {} stopPrev = null; } };
        const preview = () => { halt(); const n = sel.value; const ctx2 = cv.getContext('2d'); ctx2.fillStyle = '#000'; ctx2.fillRect(0, 0, cv.width, cv.height); none.textContent = n === '(None)' ? '(None)' : ''; if (n !== '(None)' && !pg.classList.contains('off')) { try { const r = Savers.preview(cv, n); if (typeof r === 'function') stopPrev = r; } catch (e) {} } };
        SP.start = preview; SP.stop = halt;
        on(sel, 'change', () => { preview(); c.dirty(); });
        on(qs(pg, '.pgk-wait'), 'input', () => c.dirty());
        // a screen saver downloaded from the web (the Plasma Ball) turns up in the list the moment it is installed
        const refreshList = () => { const cur = sel.value, names = (Savers.list ? Savers.list() : []).map(nameOf); sel.innerHTML = '<option>(None)</option>' + names.map(n => `<option>${esc(n)}</option>`).join(''); sel.value = [...sel.options].some(o => o.value === cur) ? cur : '(None)'; };
        window.addEventListener('jhp-savers', refreshList); c.onClose(() => window.removeEventListener('jhp-savers', refreshList));
        tap(qs(pg, '.pgk-sset'), () => { if (Savers.configure && sel.value !== '(None)') Savers.configure(sel.value); else msg('Display Properties', 'This screen saver has no options that you can set.', 'info'); });
        tap(qs(pg, '.pgk-sprev'), () => { if (sel.value === '(None)') return; if (Savers.start) Savers.start(sel.value, { preview: true }); });
        c.onApply(() => { try { localStorage.setItem('jhp_saver', sel.value); localStorage.setItem('jhp_saverwait', String(clamp(Math.round(+qs(pg, '.pgk-wait').value || 0), 0, 60))); } catch (e) {} });
        c.onClose(() => halt());
      }],
      ['Appearance', (pg, c) => {
        let cur = store.get('jhp_prog_scheme', 'JackOS Standard');
        pg.innerHTML = `<div class="pgk-appv field"><div class="pgk-aw in"><div class="pgk-at">Inactive Window</div></div><div class="pgk-aw act"><div class="pgk-at">Active Window<span>_ &#9633; x</span></div><div class="pgk-am">Normal &nbsp; <u>Disabled</u> &nbsp; <span class="hl">Selected</span></div><div class="pgk-ab"><div class="pgk-awt">Window Text</div></div></div><div class="pgk-aw msgw"><div class="pgk-at">Message Box<span>x</span></div><div style="padding:4px">Message Text<br><span class="btn" style="display:inline-block;margin:4px 0 0 30px;padding:2px 10px">OK</span></div></div></div>
          <div class="row"><label style="flex:1;min-width:160px">Scheme:<select class="pgk-sch" style="width:100%">${Object.keys(SCHEMES).map(k => `<option>${esc(k)}</option>`).join('')}</select></label><button class="btn" style="align-self:flex-end" data-x="save">Save As...</button><button class="btn" style="align-self:flex-end" data-x="del">Delete</button></div>
          <div class="row" style="margin-top:6px"><label style="flex:1">Item:<select style="width:100%"><option>Desktop</option><option>Active Title Bar</option><option>Inactive Title Bar</option><option>Menu</option><option>Message Box</option><option>Window</option><option>Gubbinz</option></select></label><label>Size:<input type="text" value="18" size="2"></label><label>Colour:<input type="text" value="" size="3" readonly class="pgk-swatch"></label></div>`;
        const sel = qs(pg, '.pgk-sch'); sel.value = cur;
        const prev = () => { const s = SCHEMES[sel.value]; const v = qs(pg, '.pgk-appv'); v.style.setProperty('--p1', s[0]); v.style.setProperty('--p2', s[1]); v.style.setProperty('--pf', s[2]); qs(pg, '.pgk-swatch').style.background = s[0]; };
        prev();
        on(sel, 'change', () => { prev(); c.dirty(); });
        tap(qs(pg, '[data-x=save]'), () => toast('Display Properties', 'Your scheme is perfect as it is. (Saving is disabled while Gubbinz is choosing colours.)'));
        tap(qs(pg, '[data-x=del]'), () => msg('Display Properties', 'You cannot delete a built-in scheme. Not even Hot Dog Stand. Especially not Hot Dog Stand.', 'warn'));
        c.onApply(() => applyScheme(sel.value, true));
      }],
      ['Effects', (pg, c) => {
        const big = store.get('jhp_prog_bigicons', false);
        pg.innerHTML = `<div class="group"><span class="lg">Desktop icons</span><div class="row pgk-dicons">${['My Computer', 'Network Neighbourhood', 'Recycle Bin (full)', 'Recycle Bin (empty)'].map((n, i) => `<div class="pgk-di${i === 0 ? ' sel' : ''}">${mini([A.ICON.drive, CI.network, '<svg viewBox="0 0 32 32"><path d="M8 9h16l-2 20H10z" fill="#ddd" stroke="#000"/><path d="M6 9h20" stroke="#000" stroke-width="2"/><path d="M11 6h10v3H11z" fill="#f2d16b" stroke="#000"/></svg>', '<svg viewBox="0 0 32 32"><path d="M8 9h16l-2 20H10z" fill="#eee" stroke="#000"/><path d="M6 9h20" stroke="#000" stroke-width="2"/></svg>'][i])}<span>${n}</span></div>`).join('')}</div><div class="row" style="justify-content:flex-end"><button class="btn" data-e="chg">Change Icon...</button><button class="btn" data-e="def">Default Icon</button></div></div>
          <div class="group"><span class="lg">Visual effects</span><label style="display:block"><input type="checkbox" class="pgk-big" ${big ? 'checked' : ''}> Use large icons</label><label style="display:block"><input type="checkbox" checked> Show icons using all possible colours</label><label style="display:block"><input type="checkbox" checked> Animate windows, menus and lists</label><label style="display:block"><input type="checkbox"> Smooth edges of screen fonts</label><label style="display:block"><input type="checkbox" checked> Show window contents while dragging</label>${window.CRT ? `<label style="display:block"><input type="checkbox" class="pgk-crt" ${CRT.on ? 'checked' : ''}> Show CRT monitor glass (scanlines)</label>` : ''}</div>`;
        if (qs(pg, '.pgk-crt')) on(qs(pg, '.pgk-crt'), 'change', () => c.dirty());
        qsa(pg, '.pgk-di').forEach(e => tap(e, () => qsa(pg, '.pgk-di').forEach(x => x.classList.toggle('sel', x === e))));
        tap(qs(pg, '[data-e=chg]'), () => msg('Change Icon', 'The only other icon in SHELL32.DLL is a picture of a floppy disk. Gubbinz ate the rest.', 'info'));
        tap(qs(pg, '[data-e=def]'), () => toast('Display Properties', 'It already is the default icon. It has always been the default icon.'));
        on(qs(pg, '.pgk-big'), 'change', () => c.dirty());
        c.onApply(() => { const v = qs(pg, '.pgk-big').checked; store.set('jhp_prog_bigicons', v); document.body.classList.toggle('pg-bigicons', v); const crt = qs(pg, '.pgk-crt'); if (crt && window.CRT) CRT.set(crt.checked); });
      }],
      ['Settings', (pg, c) => {
        let r = store.get('jhp_prog_res', 1);
        pg.innerHTML = `${monitor('<div class="pgk-resscr"></div>')}<p style="margin:4px 0;text-align:center">Display:<br><b>Plug and Play Monitor (14 inch, it hums) on AGP 3D Accelerator (8MB)</b></p><div class="pgk-cols"><div class="group" style="flex:1;min-width:140px"><span class="lg">Colours</span><select class="pgk-col" style="width:100%"><option>16 Colours</option><option>256 Colours</option><option selected>High Colour (16 bit)</option><option>True Colour (24 bit)</option></select><div class="pgk-cbar"></div></div><div class="group" style="flex:1;min-width:140px"><span class="lg">Screen area</span><div class="row" style="flex-wrap:nowrap">Less<input type="range" class="pgk-res" min="0" max="5" value="${r}" style="flex:1;min-width:60px">More</div><div class="pgk-rl" style="text-align:center">${RES[r]} pixels</div></div></div><div class="row" style="justify-content:flex-end"><button class="btn pgk-adv">Advanced...</button></div>`;
        const rl = qs(pg, '.pgk-rl'), sl = qs(pg, '.pgk-res');
        const shrink = () => { const s = qs(pg, '.pgk-resscr'); const k = [1.25, 1, 0.78, 0.7, 0.62, 0.5][+sl.value]; s.style.transform = `scale(${k})`; };
        shrink();
        on(sl, 'input', () => { rl.textContent = RES[+sl.value] + ' pixels'; shrink(); c.dirty(); });
        on(qs(pg, '.pgk-col'), 'change', () => c.dirty());
        tap(qs(pg, '.pgk-adv'), () => msg('Advanced Display Properties', 'Font size: Small Fonts (96 dpi)\nRefresh rate: 75 Hz (the flicker is a feature)\nHardware acceleration: Full\n\nDon\'t touch any of this. Dave touched it once and his monitor went "pop".', 'info'));
        c.onApply(() => {
          const v = +sl.value, col = qs(pg, '.pgk-col').value;
          if (v >= 4) { secret('resolution'); msg('Display Properties', `JackOS will now test ${RES[v]}...\n\nYour 14 inch monitor makes a high-pitched whine and the picture rolls. Reverting to 800 by 600 before it pops.`, 'warn'); sl.value = 1; rl.textContent = RES[1] + ' pixels'; shrink(); store.set('jhp_prog_res', 1); return; }
          store.set('jhp_prog_res', v);
          if (v === 0) toast('Display Properties', '640 by 480: everything is HUGE. Like Nan\'s computer. (Not really; your screen didn\'t change.)', 5000);
          else if (v > 1) toast('Display Properties', `${RES[v]}: everything is tiny! Squint to use. (Not really. The website stays the same size.)`, 5000);
          if (col === '16 Colours') msg('Display Properties', 'You must restart your computer before the new colour settings will take effect. (16 colours is what Jack\'s old computer had. Everything was purple.)', 'info');
        });
      }],
    ], { icon: CI.display, w: 410, tab: tab || 0, onTab: i => { if (SP.start) { if (i === 1) setTimeout(SP.start, 0); else SP.stop(); } } });
    if ((tab || 0) === 1 && SP.start) SP.start();
    return S.w;
  }

  function appletMouse() {
    return sheet('Mouse Properties', [
      ['Buttons', (pg, c) => {
        let speed = store.get('jhp_prog_dblspeed', 500), last = 0, open = false;
        pg.innerHTML = `<div class="group"><span class="lg">Button configuration</span><div class="row" style="flex-wrap:nowrap;gap:10px"><div><label style="display:block"><input type="radio" name="pgkh" value="r" checked> Right-handed</label><label style="display:block"><input type="radio" name="pgkh" value="l"> Left-handed</label></div><div class="pgk-mouse">${mini(CI.mouse, 48)}</div><div class="small pgk-btxt">Left Button:<br>- Normal Select<br>- Normal Drag<br><br>Right Button:<br>- Context Menu<br>- Special Drag</div></div></div>
          <div class="group"><span class="lg">Double-click speed</span><div class="row" style="flex-wrap:nowrap;gap:10px"><div style="flex:1">Slow<input type="range" class="pgk-dbl" min="100" max="900" step="50" value="${1000 - speed}" style="width:100%">Fast</div><div class="pgk-jbox" tabindex="0" title="Test area: double-click me!"><div class="pgk-jack">${JACKBOX}</div><div class="pgk-lid"></div><div class="pgk-crate"></div></div></div><div class="small">Test area: double-click the box. If it pops open, the speed is right.</div></div>`;
        qsa(pg, 'input[name=pgkh]').forEach(r => on(r, 'change', () => { qs(pg, '.pgk-mouse').classList.toggle('lh', r.value === 'l' && r.checked); qs(pg, '.pgk-btxt').innerHTML = r.value === 'l' ? 'Left Button:<br>- Context Menu<br>- Special Drag<br><br>Right Button:<br>- Normal Select<br>- Normal Drag' : 'Left Button:<br>- Normal Select<br>- Normal Drag<br><br>Right Button:<br>- Context Menu<br>- Special Drag'; c.dirty(); }));
        on(qs(pg, '.pgk-dbl'), 'input', e => { speed = 1000 - +e.target.value; c.dirty(); });
        const box = qs(pg, '.pgk-jbox');
        on(box, 'pointerdown', e => { e.preventDefault(); const now = Date.now(); if (now - last <= speed) { last = 0; open = !open; box.classList.toggle('open', open); sfx(open ? 'boing' : 'thud'); if (open) secret('jackbox'); } else last = now; });
        c.onApply(() => { store.set('jhp_prog_dblspeed', speed); if (qs(pg, 'input[value=l]').checked) toast('Mouse Properties', 'Buttons swapped! (Not really. JackOS doesn\'t want to confuse you. Just hold the mouse in your other hand and pretend.)', 6000); });
      }],
      ['Pointers', (pg, c) => {
        pg.innerHTML = `<label>Scheme:<select style="width:100%" class="pgk-ps"><option>(None)</option><option>JackOS Standard</option><option>3D Pointers</option><option>Animated Hourglasses</option><option>Dinosaur Pointers (extra stompy)</option></select></label><div class="field pgk-plist">${[['Normal Select', '<svg viewBox="0 0 12 19" width="12" height="19"><path d="M.5.5v15l4-4 2.5 6 2-1-2.5-5.5H12z" fill="#fff" stroke="#000"/></svg>'], ['Help Select', '?'], ['Working In Background', '&#8987;'], ['Busy', '&#8987;'], ['Precision Select', '+'], ['Text Select', 'I'], ['Handwriting', '&#9998;'], ['Unavailable', '&#8856;'], ['Gubbinz Select', '&#9787;']].map(([n, g], i) => `<div class="pgk-pi${i === 0 ? ' sel' : ''}"><span>${n}</span><b>${g}</b></div>`).join('')}</div><div class="row" style="justify-content:flex-end;margin-top:6px"><label style="margin-right:auto"><input type="checkbox" checked> Enable pointer shadow</label><button class="btn" data-p="def">Use Default</button><button class="btn" data-p="br">Browse...</button></div>`;
        qsa(pg, '.pgk-pi').forEach(e => tap(e, () => qsa(pg, '.pgk-pi').forEach(x => x.classList.toggle('sel', x === e))));
        on(qs(pg, '.pgk-ps'), 'change', e => { c.dirty(); if (/Dinosaur/.test(e.target.value)) toast('Mouse Properties', 'Dinosaur pointers are for display purposes only. Real dinosaurs are extinct. Probably.'); });
        tap(qs(pg, '[data-p=br]'), () => msg('Browse', 'C:\\JACKOS\\CURSORS contains 1 file: hourglass_forever.ani. You don\'t want it.', 'info'));
        tap(qs(pg, '[data-p=def]'), () => toast('Mouse Properties', 'Pointers reset to the default. They look exactly the same.'));
        c.onApply(() => { if (window.OldPC && qs(pg, '.pgk-ps').value === 'Dinosaur Pointers (extra stompy)') toast('Mouse Properties', 'For more cursors, install the CursorMania! Toolbar. (Please don\'t.)'); });
        if (window.BridgeDL && BridgeDL.pointersTab) BridgeDL.pointersTab(pg, c); // animated cursors downloaded from the Web (bridge-dl.js)
      }],
      ['Motion', (pg, c) => {
        const t = store.get('jhp_prog_trails', 0);
        pg.innerHTML = `<div class="group"><span class="lg">Pointer speed</span><div class="row" style="flex-wrap:nowrap">Slow<input type="range" min="0" max="10" value="5" style="flex:1">Fast</div></div><div class="group"><span class="lg">Pointer trail</span><label style="display:block"><input type="checkbox" class="pgk-tr" ${t ? 'checked' : ''}> Show pointer trails</label><div class="row" style="flex-wrap:nowrap">Short<input type="range" class="pgk-trl" min="1" max="7" value="${t || 4}" style="flex:1">Long</div><div class="small">Wiggle the mouse after you press Apply!</div></div>`;
        on(qs(pg, '.pgk-tr'), 'change', () => c.dirty()); on(qs(pg, '.pgk-trl'), 'input', () => c.dirty());
        c.onApply(() => Trails.set(qs(pg, '.pgk-tr').checked ? +qs(pg, '.pgk-trl').value : 0));
      }],
      ['General', pg => { pg.innerHTML = `<div class="group"><span class="lg">Name</span><div class="row" style="flex-wrap:nowrap">${mini(CI.mouse, 24)}<span style="flex:1">Standard Serial Mouse (with ball, needs cleaning)</span><button class="btn pgk-chg">Change...</button></div></div><p class="small">Tip: if the pointer keeps jumping, take the ball out and pick the fluff off the little rollers. Gross but it works.</p>`; tap(qs(pg, '.pgk-chg'), () => msg('Select Device', 'Searching for compatible devices...\n\nFound: Standard Serial Mouse, a Game Boy (not compatible), Dave\'s Mouse (borrowed, must give back).', 'info')); }],
    ], { icon: CI.mouse, w: 400 }).w;
  }
  const JACKBOX = '<svg viewBox="0 0 40 48" width="40" height="48"><path d="M20 48c-6-3 6-6 0-9s6-6 0-9 6-6 0-9" stroke="#808080" stroke-width="2.5" fill="none"/><circle cx="20" cy="12" r="10" fill="#f2c79a" stroke="#000"/><path d="M10 9c2-8 18-8 20 0l-4-2-6 2-6-2z" fill="#e10600" stroke="#000"/><circle cx="16" cy="12" r="1.6"/><circle cx="24" cy="12" r="1.6"/><path d="M15 16c3 3 7 3 10 0" stroke="#000" fill="none"/><circle cx="20" cy="2" r="2" fill="#ffd400" stroke="#000"/></svg>';

  const SND_EVENTS = [['JackOS', null], ['Asterisk', 'beep'], ['Close program', 'click'], ['Critical Stop', 'uhoh'], ['Default sound', 'beep'], ['Exclamation', 'uhoh'], ['Exit JackOS', 'shutdown'], ['Maximise', 'turn'], ['Menu command', 'click'], ['Minimise', 'turn'], ['Open program', 'button'], ['Question', 'pet'], ['Start JackOS', 'startup'], ['JackNet', null], ['Connect', 'modem'], ['New Message', 'join'], ['Disconnect', 'thud'], ['Gubbinz', null], ['Gubbinz is hungry', 'boing'], ['Gubbinz is happy', 'pet'], ['WAAAGH!', 'waaagh'], ['Games', null], ['Dice roll', 'dice'], ['Puzzle solved', 'solve'], ['Zap', 'zap']];
  function appletSounds() {
    return sheet('Sounds Properties', [['Sounds', (pg, c) => {
      const map = store.get('jhp_prog_sounds', {});
      const NAMES = ['(None)', 'beep', 'boing', 'button', 'click', 'crt', 'dice', 'join', 'modem', 'pet', 'shutdown', 'solve', 'startup', 'thud', 'turn', 'uhoh', 'waaagh', 'zap'];
      pg.innerHTML = `<div>Events:</div><div class="field pgk-ev">${SND_EVENTS.map(([n, s], i) => s === null ? `<div class="pgk-evh">${mini(i ? CI.gubbinz : CI.sounds, 14)} ${n}</div>` : `<div class="pgk-evi${i === 1 ? ' sel' : ''}" data-i="${i}"><span class="pgk-spk">${(map[n] || s) !== '(None)' ? '&#128264;' : ''}</span>${esc(n)}</div>`).join('')}</div>
        <div class="group"><span class="lg">Sound</span><div class="row"><label style="flex:1">Name:<select class="pgk-sn" style="width:100%">${NAMES.map(n => `<option value="${n}">${n === '(None)' ? n : n + '.wav'}</option>`).join('')}</select></label><button class="btn pgk-play" style="align-self:flex-end" aria-label="Preview">&#9654; Preview</button></div></div>
        <div class="group"><span class="lg">Schemes</span><div class="row"><select class="pgk-sch" style="flex:1"><option>JackOS Default</option><option>No Sounds</option><option>Arcade Sounds (loud)</option><option>Robot Sounds</option><option>Utopia (just kidding)</option></select><button class="btn pgk-ssave">Save As...</button></div></div>
        <label><input type="checkbox" class="pgk-sfx" ${Sound.on ? 'checked' : ''}> Play sound effects (same as the speaker in the system tray)</label>`;
      let cur = 1;
      const sn = qs(pg, '.pgk-sn');
      const pickEv = i => { cur = i; qsa(pg, '.pgk-evi').forEach(x => x.classList.toggle('sel', +x.dataset.i === i)); sn.value = map[SND_EVENTS[i][0]] || SND_EVENTS[i][1]; };
      qsa(pg, '.pgk-evi').forEach(e => { tap(e, () => pickEv(+e.dataset.i)); on(e, 'dblclick', () => qs(pg, '.pgk-play').click()); });
      pickEv(1);
      on(sn, 'change', () => { map[SND_EVENTS[cur][0]] = sn.value; qs(pg, `.pgk-evi[data-i="${cur}"] .pgk-spk`).innerHTML = sn.value !== '(None)' ? '&#128264;' : ''; c.dirty(); });
      tap(qs(pg, '.pgk-play'), () => { if (sn.value === '(None)') return; if (!Sound.on) { toast('Sounds', 'Sound effects are switched off. Tick "Play sound effects" below (or click the speaker in the tray), then press Preview again.', 5000); return; } Sound.play(sn.value); });
      on(qs(pg, '.pgk-sch'), 'change', e => { const v = e.target.value; if (v === 'No Sounds') qs(pg, '.pgk-sfx').checked = false; else if (/Arcade|Robot|Default/.test(v)) qs(pg, '.pgk-sfx').checked = true; if (/Utopia/.test(v)) toast('Sounds', 'Utopia isn\'t installed. You\'d need the Plus! pack. Jack has no Plus! pack.'); c.dirty(); });
      tap(qs(pg, '.pgk-ssave'), () => toast('Sounds', 'Scheme saved as "Jack\'s Sounds (final) (2) (REAL final)".'));
      on(qs(pg, '.pgk-sfx'), 'change', () => c.dirty());
      c.onApply(() => { store.set('jhp_prog_sounds', map); const v = qs(pg, '.pgk-sfx').checked; if (v !== Sound.on) { sfxOn(v); if (v) sfx('startup'); } });
    }]], { icon: CI.sounds, w: 380 }).w;
  }

  function drawClock(cv) {
    const x = cv.getContext('2d'), W = cv.width, R = W / 2 - 4, d = new Date();
    x.clearRect(0, 0, W, W); x.save(); x.translate(W / 2, W / 2);
    x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill(); x.stroke();
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30; x.fillStyle = i % 5 ? '#808080' : '#000080'; const s = i % 5 ? 2 : 4; x.fillRect(Math.sin(a) * (R - 6) - s / 2, -Math.cos(a) * (R - 6) - s / 2, s, s); }
    const hand = (a, len, wd, col) => { x.save(); x.rotate(a); x.fillStyle = col; x.beginPath(); x.moveTo(-wd, 0); x.lineTo(0, -len); x.lineTo(wd, 0); x.lineTo(0, wd * 1.5); x.closePath(); x.fill(); x.restore(); };
    const s = d.getSeconds(), m = d.getMinutes() + s / 60, hr = d.getHours() % 12 + m / 60;
    hand(hr * Math.PI / 6, R * 0.5, 5, '#008080'); hand(m * Math.PI / 30, R * 0.75, 4, '#008080');
    x.strokeStyle = '#000'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(s * Math.PI / 30) * R * 0.85, -Math.cos(s * Math.PI / 30) * R * 0.85); x.stroke();
    x.restore();
  }
  function calGrid(m, d) {
    const first = new Date(1999, m - 1, 1).getDay(), days = new Date(1999, m, 0).getDate();
    let g = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(x => `<b>${x}</b>`).join('');
    for (let i = 0; i < first; i++) g += '<span></span>';
    for (let k = 1; k <= days; k++) g += `<span class="${k === d ? 'today' : ''}" data-d="${k}">${k}</span>`;
    return g;
  }
  function appletDateTime() {
    let tick = 0;
    const S = sheet('Date/Time Properties', [
      ['Date & Time', (pg, c) => {
        const t = today(); let m = t.m, d = t.d;
        pg.innerHTML = `<div class="pgk-cols"><div class="group" style="flex:1;min-width:170px"><span class="lg">Date</span><div class="row" style="flex-wrap:nowrap"><select class="pgk-month" style="flex:1">${MONTHS.map((n, i) => `<option value="${i + 1}" ${i + 1 === m ? 'selected' : ''}>${n}</option>`).join('')}</select><input type="number" class="pgk-yr" value="1999" min="1980" max="2099" style="width:64px"></div><div class="calgrid pgk-cal" style="margin-top:6px">${calGrid(m, d)}</div></div>
          <div class="group" style="width:150px"><span class="lg">Time</span><canvas class="pgk-clock" width="120" height="120"></canvas><input type="text" class="pgk-tm" readonly style="width:100%;text-align:center;margin-top:4px"></div></div><p class="small" style="margin:4px 0 0">Current time zone: GMT Standard Time</p>`;
        const cal = qs(pg, '.pgk-cal');
        const wire = () => qsa(cal, 'span[data-d]').forEach(e => tap(e, () => { d = +e.dataset.d; qsa(cal, 'span').forEach(x => x.classList.toggle('today', x === e)); c.dirty(); }));
        wire();
        on(qs(pg, '.pgk-month'), 'change', e => { m = +e.target.value; d = Math.min(d, new Date(1999, m, 0).getDate()); cal.innerHTML = calGrid(m, d); wire(); c.dirty(); });
        on(qs(pg, '.pgk-yr'), 'change', e => {
          const y = +e.target.value; if (y === 1999) return;
          e.target.value = 1999;
          if (y >= 2000) { secret('y2kyear'); msg('Date/Time Properties', `JackOS cannot set the year to ${y}.\n\nThe year 2000 has not happened yet. (And when it does, the clock will probably say 1900 anyway. Thanks, Millennium Bug.)`, 'warn'); }
          else msg('Date/Time Properties', `Going back to ${y}? Things were worse then. Fewer games. Staying in 1999.`, 'info');
        });
        const cl = qs(pg, '.pgk-clock'), tm = qs(pg, '.pgk-tm');
        const draw = () => { drawClock(cl); const n = new Date(); tm.value = n.toLocaleTimeString('en-GB'); };
        draw(); tick = setInterval(draw, 1000);
        c.onApply(() => { if (m !== t.m || d !== t.d) msg('Date/Time Properties', `JackOS changed the date to ${d} ${MONTHS[m - 1]} 1999... and then the CMOS battery (it's a little coin) changed it straight back. It's always today.`, 'info'); });
      }],
      ['Time Zone', (pg, c) => {
        pg.innerHTML = `<select style="width:100%" class="pgk-tz"><option>(GMT-08:00) Pacific Time (US &amp; Canada)</option><option>(GMT-05:00) Eastern Time (US &amp; Canada)</option><option selected>(GMT) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London</option><option>(GMT+01:00) Paris, Madrid, Rome, Berlin</option><option>(GMT+09:00) Tokyo, Osaka</option><option>(GMT+10:00) Sydney, Melbourne</option><option>(GMT+12:00) Pixel Island (unofficial)</option></select>
          <div class="pgk-map field"><svg viewBox="0 0 360 150" preserveAspectRatio="none"><rect width="360" height="150" fill="#000080"/><g fill="#2a9a2a"><path d="M20 30l60-10 30 20-10 30-30 10-10 30-20-10-10-40z"/><path d="M95 95l25 5 10 30-15 15-20-30z"/><path d="M160 25l40-5 10 15-15 10 5 20-30 5-15-20z"/><path d="M165 70l30 0 15 25-15 35-20-10-15-30z"/><path d="M210 20l90 0 20 25-20 25-40 5-30-10-25-15z"/><path d="M290 100l30 0 10 20-25 10-15-15z"/></g><rect class="pgk-band" x="172" y="0" width="16" height="150" fill="#ffd400" opacity=".45"/></svg></div>
          <label><input type="checkbox" checked> Automatically adjust clock for daylight saving changes</label>`;
        const off = { 0: -8, 1: -5, 2: 0, 3: 1, 4: 9, 5: 10, 6: 12 };
        on(qs(pg, '.pgk-tz'), 'change', e => { qs(pg, '.pgk-band').setAttribute('x', 172 + off[e.target.selectedIndex] * 15); c.dirty(); });
        c.onApply(() => { if (qs(pg, '.pgk-tz').selectedIndex !== 2) toast('Date/Time Properties', 'Time zone changed. The clock in the taskbar ignores you, because it knows you\'re in Britain really.', 5000); });
      }],
    ], { icon: CI.datetime, w: 400, onClose: () => clearInterval(tick) });
    return S.w;
  }

  // ---- Add/Remove Programs
  const FAKE_PROGS = ['JackNet 56K Dialler 2.1', 'Gubbinz Virtual Pet 1.2', 'DaveZip 6.3 (Shareware - day 412 of 30)', 'Dinosaur Encyclopaedia 98 (CD-ROM)', 'Y2K Fix-o-Matic 1.0', 'Typing Teacher Deluxe', 'Homework Helper 97 (never opened)', 'FREE Screen Saver Pack 3000', 'Blobbit Screen Mates', 'JackAmp 2.0 MIDI Edition', 'Desktop Fish Tank (no fish)', 'Encyclopaedia of Everything 1998 (6 CDs, disc 4 missing)'];
  function appletAddRemove(tab) {
    if (window.Setup && Setup.applet) return Setup.applet(tab); // the real installer (setup.js)
    return sheet('Add/Remove Programs Properties', [
      ['Install/Uninstall', (pg, c) => {
        const removed = () => store.get('jhp_prog_removed', []);
        pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${mini(CI.addrem)}<span>To install a new program from a floppy disk or CD-ROM drive, click Install.</span></div><div class="row" style="justify-content:flex-end"><button class="btn" data-a="inst">Install...</button></div><hr class="pgk-hr"><div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${mini(I.exe || A.ICON.exe)}<span>The following software can be automatically removed by JackOS. To remove a program or to modify its installed components, select it from the list and click Add/Remove.</span></div><div class="field pgk-prl"></div><div class="row" style="justify-content:flex-end"><button class="btn" data-a="rem">Add/Remove...</button></div>`;
        const lst = qs(pg, '.pgk-prl');
        function render() {
          const tb = window.OldPC && OldPC.toolbarItems ? OldPC.toolbarItems().map(t => t.label) : [];
          const items = [...tb.map(n => ['tb', n]), ...FAKE_PROGS.filter(n => !removed().includes(n)).map(n => ['fk', n])].sort((a, b2) => a[1].localeCompare(b2[1]));
          lst.innerHTML = items.map(([k, n], i) => `<div class="pgk-pr${i === 0 ? ' sel' : ''}" data-k="${k}" tabindex="-1">${esc(n)}</div>`).join('') || '<div class="pgk-pr" style="color:#808080">(nothing to remove!)</div>';
          qsa(lst, '.pgk-pr').forEach(e => { tap(e, () => qsa(lst, '.pgk-pr').forEach(x => x.classList.toggle('sel', x === e))); on(e, 'dblclick', () => qs(pg, '[data-a=rem]').click()); });
        }
        render();
        tap(qs(pg, '[data-a=inst]'), () => dialog('Install Program From Floppy Disk or CD-ROM', `<div class="row" style="flex-wrap:nowrap;gap:10px">${mini(CI.addrem)}<span>Insert the product's first installation floppy disk or CD-ROM, and then click Next.</span></div>`, [['Next >', () => { msg('Install', 'JackOS could not find an installation program on drive A: or D:. Drive D: has JACK ATTACK! Cover Disc 7 in it, which is already installed in your heart.', 'info'); }], ['Cancel']], { w: 360, icon: CI.addrem }));
        tap(qs(pg, '[data-a=rem]'), () => {
          const s = qs(lst, '.pgk-pr.sel'); if (!s || !s.dataset.k) return;
          const n = s.textContent;
          if (s.dataset.k === 'tb') { msg('Confirm File Deletion', `Are you sure you want to completely remove '${n}' and all of its components?`, 'q', [['Yes', () => { OldPC.uninstallByName(n); setTimeout(render, 50); }], ['No']]); return; }
          msg('Confirm File Deletion', `Are you sure you want to completely remove '${n}' and all of its components?`, 'q', [['Yes', () => uninstall(n, render)], ['No']]);
        });
      }],
      ['JackOS Setup', pg => {
        const C = [['Accessibility', '0.4', 1, 'Includes options to change keyboard, sound, display and mouse behaviour for people with mobility, hearing or visual impairments.'], ['Accessories', '12.6', 1, 'Includes Calculator, Paint, Character Map and other handy programs.'], ['Communications', '6.2', 1, 'Includes Phone Dialer and the JackNet 56K dialler.'], ['Desktop Themes', '24.8', 0, 'Wallpapers, sounds and icons that match. 24.8 MB! That\'s about 17 floppies.'], ['Internet Tools', '5.1', 1, 'JackNet Explorer and friends.'], ['Multimedia', '11.7', 1, 'JackAmp, sound schemes, and the CD player that plays music CDs.'], ['Online Services', '1.2', 0, 'Free trial CDs that came in the post. Lots of them.'], ['Gubbinz Support', '0.1', 1, 'Drivers for little green helpers. Required by Gubbinz.'], ['System Tools', '8.3', 1, 'Disk Defragmenter, ScanDisk, System Information and more.'], ['Y2K Survival Kit', '0.0', 0, 'A torch, some tins of beans and a note saying "good luck".']];
        pg.innerHTML = `<p style="margin:0 0 6px">To add or remove a component, select or clear the check box. A shaded box means only part of the component will be installed.</p><div>Components:</div><div class="field pgk-comp">${C.map(([n, sz, on2], i) => `<label class="pgk-ci${i === 0 ? ' sel' : ''}" data-i="${i}"><input type="checkbox" ${on2 ? 'checked' : ''}><span style="flex:1">${n}</span><span>${sz} MB</span></label>`).join('')}</div><p class="small" style="margin:6px 0">Space used by installed components: 47.6 MB<br>Space required: 0.0 MB<br>Space available on disk: 1,904.2 MB</p><div class="group"><span class="lg">Description</span><div class="pgk-cd" style="min-height:30px"></div></div><div class="row" style="justify-content:flex-end"><button class="btn pgk-cdet">Details...</button><button class="btn" disabled>Have Disk...</button></div>`;
        const desc = i => { qs(pg, '.pgk-cd').textContent = C[i][3]; };
        desc(0);
        qsa(pg, '.pgk-ci').forEach(e => { on(e, 'pointerdown', () => { qsa(pg, '.pgk-ci').forEach(x => x.classList.toggle('sel', x === e)); desc(+e.dataset.i); }); on(qs(e, 'input'), 'change', ev => { ev.target.checked = !ev.target.checked; msg('Insert Disk', 'Please insert the disk labelled \'JackOS 98 CD-ROM\', and then click OK. (It\'s in the drawer under the printer. Mom put it there "for safe keeping".)', 'info'); }); });
        tap(qs(pg, '.pgk-cdet'), () => msg('Details', 'This component is made of smaller components. Those are made of even smaller components. It\'s components all the way down.', 'info'));
      }],
      ['Startup Disk', pg => { pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start"><svg viewBox="0 0 32 32" width="32" height="32" style="flex:none"><rect x="4" y="4" width="24" height="24" fill="#222" stroke="#000"/><rect x="10" y="4" width="12" height="8" fill="#bbb"/><rect x="8" y="17" width="16" height="11" fill="#eee"/><path d="M10 21h12M10 24h8" stroke="#e10600"/></svg><span>If you have trouble starting JackOS, you can use a startup disk to start your computer, run diagnostic programs and fix any problems.<br><br>To create a startup disk, click Create Disk. You will need one floppy disk.</span></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn pgk-mk">Create Disk...</button></div><div class="pgk-mkp"></div>`; tap(qs(pg, '.pgk-mk'), () => msg('Insert Disk', 'Label a disk "JackOS Startup Disk" and insert it into drive A:.\n\nWarning: everything on the floppy will be erased. The only floppy in the house is Dave\'s Doom disk. Better not.', 'warn')); }],
    ], { icon: CI.addrem, w: 410 }).w;
  }
  function uninstall(n, after) {
    const gub = /Gubbinz/.test(n);
    const b = h(`<div class="row" style="flex-wrap:nowrap;gap:10px">${mini(CI.addrem)}<div style="flex:1"><div>Removing <b>${esc(n)}</b>...</div><div class="pgk-ub" style="margin-top:6px"></div><div class="small pgk-uf" style="margin-top:4px">&nbsp;</div></div></div>`);
    const w = A.win('Remove Programs From Your Computer', b, { w: 360, icon: CI.addrem, noResize: true, noMax: true, noMin: true });
    const set = progBar(qs(b, '.pgk-ub'));
    const FILES = ['Removing shared files...', 'Removing program files...', 'Removing folders...', 'Removing program registry entries...', 'Removing desktop icons...', 'Removing Start menu items...', 'Asking Gubbinz to let go of the file...'];
    let p = 0;
    const iv = setInterval(() => {
      if (w.closed) return clearInterval(iv);
      p += 0.04 + Math.random() * 0.05;
      if (gub && p > 0.92) { set(0.99); qs(b, '.pgk-uf').textContent = 'Gubbinz has bitten the uninstaller.'; clearInterval(iv); setTimeout(() => { w.close(); secret('uninstall'); msg('Gubbinz Virtual Pet', 'Gubbinz Virtual Pet cannot be removed.\n\nHe has reinstalled himself, eaten the uninstaller and is now sitting in C:\\JACKOS\\SYSTEM looking pleased with himself.', 'warn'); }, 900); return; }
      set(p); qs(b, '.pgk-uf').textContent = pick(FILES);
      if (p >= 1) {
        clearInterval(iv); set(1);
        setTimeout(() => { w.close(); const r = store.get('jhp_prog_removed', []); if (!r.includes(n)) r.push(n); store.set('jhp_prog_removed', r); secret('uninstall'); msg('Remove Programs From Your Computer', 'Uninstall successfully completed.\n\nSome elements could not be removed. You must remove them manually.', 'info'); if (after) after(); }, 400);
      }
    }, 220);
  }

  // ---- System
  const DEVICES = [
    ['CDROM', [['JACKATAK 32X CD-ROM', 0]]], ['Disk drives', [['GENERIC IDE DISK TYPE47 (6.4 GB)', 0], ['GENERIC NEC FLOPPY DISK', 0]]],
    ['Display adapters', [['AGP 3D Accelerator (8MB SGRAM)', 0]]], ['Floppy disk controllers', [['Standard Floppy Disk Controller', 0]]],
    ['Hard disk controllers', [['Primary IDE controller (dual fifo)', 0], ['Secondary IDE controller (dual fifo)', 0]]], ['Keyboard', [['Standard 102-key UK keyboard', 0]]],
    ['Modem', [['JackNet 56K Voice Modem', 0]]], ['Monitors', [['Plug and Play Monitor (14 inch, it hums)', 0]]], ['Mouse', [['Standard Serial Mouse', 0]]],
    ['Network adapters', [['Dial-Up Adapter', 0]]], ['Other devices', [['Bug Detector', 'Code 10', 'This device is not working properly because Gubbinz ate the driver. (Code 10)\n\nTo fix this, click Update Driver. Then hide the new driver somewhere Gubbinz can\'t reach.'], ['Unknown Device: GIZMO-1999', 'Code 28', 'The drivers for this device are not installed. (Code 28)\n\nJackOS asked it what it was. It said "beep boop". JackOS does not have a driver for beep boop.'], ['PCI Toaster', 'Code 22', 'This device is disabled. (Code 22)\n\nMom disabled it after the crumpet incident.'], ['Y2K Compliance Chip', 'Code 31', 'This device is not working properly because JackOS cannot load the drivers required for the year 2000. (Code 31)\n\nTry again on 1 January 2000. If the computer still works.']]],
    ['Ports (COM & LPT)', [['Communications Port (COM1)', 0], ['Communications Port (COM2)', 0], ['Printer Port (LPT1)', 0]]],
    ['Sound, video and game controllers', [['JackBlaster 16 PnP', 0], ['Gameport Joystick', 0], ['JackAmp Chiptune Engine', 0]]],
    ['System devices', [['System timer', 0], ['Direct memory access controller', 0], ['Programmable interrupt controller', 0], ['System CMOS/real time clock', 0], ['Numeric data processor', 0], ['PCI bus', 0], ['Plug and Play BIOS', 0], ['Gubbinz bus (8-bit, wobbly)', 0]]],
    ['Universal Serial Bus controller', [['USB Root Hub (nothing plugged in. Ever.)', 0]]],
  ];
  function appletSystem(tab) {
    return sheet('System Properties', [
      ['General', pg => {
        pg.innerHTML = `<div class="pgk-sysg"><div class="pgk-logo">${window.JICON ? '<div style="width:64px;margin:0 auto 6px">' + JICON.logo(64) + '</div>' : '<div class="flag"><i></i><i></i><i></i><i></i></div>'}<div class="pgk-lt"><i>JackOS</i><b>98</b></div></div><div><p><b>System:</b><br>&nbsp;&nbsp;JackOS 98<br>&nbsp;&nbsp;4.10.1999</p><p><b>Registered to:</b><br>&nbsp;&nbsp;<span class="pgk-nick"></span><br>&nbsp;&nbsp;JACK ATTACK! Online<br>&nbsp;&nbsp;19990-OEM-0031337-42</p><p><b>Computer:</b><br>&nbsp;&nbsp;GenuineIntel<br>&nbsp;&nbsp;Pentium(r) II Processor<br>&nbsp;&nbsp;350MHz<br>&nbsp;&nbsp;64.0MB RAM</p></div></div>`;
        qs(pg, '.pgk-nick').textContent = nick();
      }],
      ['Device Manager', pg => {
        const open = new Set(['Other devices']);
        pg.innerHTML = `<div class="row"><label><input type="radio" name="pgkdm" checked> View devices by type</label><label><input type="radio" name="pgkdm"> View devices by connection</label></div><div class="field pgk-dm"></div><div class="row pgk-dmb"><button class="btn" data-d="prop">Properties</button><button class="btn" data-d="ref">Refresh</button><button class="btn" data-d="rem">Remove</button><button class="btn" data-d="prn">Print...</button></div>`;
        const tree = qs(pg, '.pgk-dm'); let sel = null;
        const EX = '<span class="pgk-bang" title="Problem">!</span>';
        function render() {
          let out = `<div class="pgk-dn root">${mini(CI.system, 16)} Computer</div>`;
          DEVICES.forEach(([cat, devs]) => {
            const bad = devs.some(d => d[1]), isOpen = open.has(cat);
            out += `<div class="pgk-dn cat${sel === cat ? ' sel' : ''}" data-c="${esc(cat)}"><span class="pgr-pm">${isOpen ? '&#8211;' : '+'}</span>${mini(bad ? '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#ffd400" stroke="#000"/><text x="16" y="23" text-anchor="middle" font-size="20" font-weight="bold" font-family="Arial">?</text></svg>' : CI.hardware, 16)} ${esc(cat)}</div>`;
            if (isOpen) devs.forEach(d => { out += `<div class="pgk-dn dev${sel === d[0] ? ' sel' : ''}" data-d="${esc(d[0])}">${d[1] ? EX : '<span class="pgk-ok"></span>'}${esc(d[0])}</div>`; });
          });
          tree.innerHTML = out;
          qsa(tree, '.cat').forEach(e => { tap(e, () => { sel = e.dataset.c; if (open.has(sel)) open.delete(sel); else open.add(sel); render(); }); });
          qsa(tree, '.dev').forEach(e => { tap(e, () => { sel = e.dataset.d; qsa(tree, '.pgk-dn').forEach(x => x.classList.toggle('sel', x === e)); }); on(e, 'dblclick', () => props()); });
        }
        function props() {
          const d = DEVICES.flatMap(x => x[1]).find(x => x[0] === sel); if (!d) return;
          if (d[1]) secret('devmgr');
          dialog(d[0] + ' Properties', `<div class="row" style="flex-wrap:nowrap;gap:10px">${d[1] ? '<svg viewBox="0 0 32 32" width="32" height="32" style="flex:none"><circle cx="16" cy="16" r="13" fill="#ffd400" stroke="#000"/><text x="16" y="24" text-anchor="middle" font-size="22" font-weight="bold" font-family="Arial">!</text></svg>' : mini(CI.hardware)}<b>${esc(d[0])}</b></div><div class="row" style="margin:8px 0"><span style="width:110px">Device type:</span><span>${esc(DEVICES.find(x => x[1].includes(d))[0])}</span></div><div class="row"><span style="width:110px">Manufacturer:</span><span>${d[1] ? '(Unknown, possibly a robot)' : '(Standard devices)'}</span></div><div class="group"><span class="lg">Device status</span><div style="white-space:pre-wrap">${esc(d[2] || 'This device is working properly.')}</div></div><label><input type="checkbox" ${d[1] === 'Code 22' ? '' : 'checked'}> Original Configuration (Current)</label>`, [['OK'], ['Cancel'], ...(d[1] ? [['Update Driver...', () => { msg('Update Device Driver Wizard', 'JackOS searched for an updated driver on: Floppy disk drives, CD-ROM drive, and Microsoft... er, JackOS Update.\n\nJackOS was unable to locate a driver for this device. Gubbinz is suspiciously full.', 'warn'); return false; }]] : [])], { w: 360, icon: CI.system });
        }
        render();
        tap(qs(pg, '[data-d=prop]'), props);
        tap(qs(pg, '[data-d=ref]'), () => { tree.classList.add('pgk-busy'); setTimeout(() => { tree.classList.remove('pgk-busy'); toast('Device Manager', 'JackOS looked for new hardware. It found the same stuff. And a crisp.'); }, 900); });
        tap(qs(pg, '[data-d=rem]'), () => { if (!sel) return; msg('Confirm Device Removal', `Warning: you are about to remove "${sel}" from your system.\n\n(JackOS will just find it again next time you restart.)`, 'q', [['OK'], ['Cancel']]); });
        tap(qs(pg, '[data-d=prn]'), () => msg('Print', 'Printer is out of cyan. The device list is mostly cyan.', 'warn'));
      }],
      ['Hardware Profiles', pg => { pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px">${mini(CI.system)}<span>You can create hardware configurations to select from at startup. (For example: "Normal" and "Mom is using the scanner".)</span></div><div class="field" style="height:110px;padding:2px;margin:8px 0"><div class="pgk-pr sel">Original Configuration</div><div class="pgk-pr">Dave Is Round (both joysticks)</div></div><div class="row"><button class="btn" data-h="c">Copy...</button><button class="btn" data-h="r">Rename...</button><button class="btn" data-h="d">Delete</button></div>`; qsa(pg, '[data-h]').forEach(x => tap(x, () => toast('Hardware Profiles', 'Hardware profiles are locked while Gubbinz is plugged in.'))); }],
      ['Performance', pg => { pg.innerHTML = `<div class="group"><span class="lg">Performance status</span><table class="pgk-perf"><tr><td>Memory:</td><td>64.0 MB of RAM</td></tr><tr><td>System Resources:</td><td>42% free</td></tr><tr><td>File System:</td><td>32-bit</td></tr><tr><td>Virtual Memory:</td><td>32-bit</td></tr><tr><td>Disk Compression:</td><td>Not installed</td></tr><tr><td>PC Cards (PCMCIA):</td><td>No PC Card sockets are installed.</td></tr><tr><td>Bugs:</td><td>1 (in a lost cluster)</td></tr></table><p style="margin:8px 0 0">Your system is configured for optimal performance. (As optimal as 64MB gets.)</p></div><div class="group"><span class="lg">Advanced settings</span><div class="row"><button class="btn" data-p="fs">File System...</button><button class="btn" data-p="gr">Graphics...</button><button class="btn" data-p="vm">Virtual Memory...</button></div></div>`; tap(qs(pg, '[data-p=fs]'), () => msg('File System Properties', 'Typical role of this computer: Desktop computer (for games).\nRead-ahead optimisation: Full.\nSnack-ahead optimisation: None.', 'info')); tap(qs(pg, '[data-p=gr]'), () => msg('Advanced Graphics Settings', 'Hardware acceleration: Full. Moving this slider to "None" makes everything slow, like when Mom is downloading her emails.', 'info')); tap(qs(pg, '[data-p=vm]'), () => msg('Virtual Memory', 'Let JackOS manage my virtual memory settings (recommended).\n\nVirtual memory is like pretending your hard disk is RAM. It is slower. Much slower. You can hear it working.', 'info')); }],
    ], { icon: CI.system, w: 420, tab: tab || 0 }).w;
  }

  // ---- Fonts (a folder window, like the real one)
  const FONTS = [['Arial', 'Arial, Helvetica, sans-serif'], ['Arial Black', '"Arial Black", Arial, sans-serif'], ['Comic Sans MS', '"Comic Sans MS", "Comic Sans", cursive'], ['Courier New', '"Courier New", Courier, monospace'], ['Georgia', 'Georgia, serif'], ['Impact', 'Impact, "Arial Narrow Bold", sans-serif'], ['JackAttack Bangers', 'Bangers, var(--comic)'], ['JackAttack Headline', 'Anton, var(--mag)'], ['MS Sans Serif', '"MS Sans Serif", Tahoma, sans-serif'], ['Symbol', 'Symbol, serif'], ['Tahoma', 'Tahoma, Verdana, sans-serif'], ['Times New Roman', '"Times New Roman", Times, serif'], ['Trebuchet MS', '"Trebuchet MS", sans-serif'], ['Verdana', 'Verdana, sans-serif'], ['Wingdings', 'Wingdings, "Zapf Dingbats", serif'], ['Blobbit Script (Bold)', '"Comic Sans MS", cursive']];
  const allFonts = () => FONTS.concat(window.BridgeDL && BridgeDL.fontList ? BridgeDL.fontList() : []); // + fonts downloaded from the Web (bridge-dl.js)
  function fontsWindow() {
    const b = h(`<div class="pgk-fonts">${allFonts().map(([n]) => `<button class="pgk-fi" data-f="${esc(n)}"><svg viewBox="0 0 32 32" width="32" height="32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/><text x="9" y="24" font-family="Times New Roman,serif" font-size="14" font-weight="bold" fill="#000080">T</text><text x="16" y="27" font-family="Times New Roman,serif" font-size="12" font-weight="bold" fill="#808080">T</text></svg><span>${esc(n)}</span></button>`).join('')}</div>`);
    const w = A.win('Fonts', b, { w: 460, h: 320, icon: CI.fonts, menubar: true, status: true });
    w.status.textContent = allFonts().length + ' font(s) installed';
    const open1 = n => fontPreview(n);
    qsa(b, '.pgk-fi').forEach(e => { tap(e, () => { qsa(b, '.pgk-fi').forEach(x => x.classList.toggle('sel', x === e)); w.status.textContent = e.dataset.f + ' (TrueType)'; }); dbl(e, () => open1(e.dataset.f)); });
    A.menubar(w, [['File', [{ label: 'Open', act: () => { const s = qs(b, '.pgk-fi.sel'); if (s) open1(s.dataset.f); } }, { label: 'Install New Font...', act: () => msg('Add Fonts', 'No fonts found on drive A:. (Dave\'s Doom disk has a font on it, but it\'s just the word DOOM in red.)', 'info') }, '-', { label: 'Close', act: () => w.close() }]], ['View', [{ label: 'Large Icons', rad: true }, { label: 'List Fonts By Similarity', act: () => toast('Fonts', 'Most similar to Arial: Arial. Least similar: Wingdings.') }, '-', { label: 'Hide Variations (Bold, Italic, etc.)', chk: true }]], ['Help', [{ label: 'About JackOS 98', act: () => msg('About', 'JackOS 98\nFonts folder. Contains fonts.', 'info') }]]]);
    return w;
  }
  function fontPreview(n) {
    const f = allFonts().find(x => x[0] === n); if (!f) return;
    const b = h(`<div class="pgk-fp"><div class="row"><button class="btn" data-x="done">Done</button><button class="btn" data-x="print">Print</button></div><h2 style="font-family:${f[1]}">${esc(n)} (TrueType)</h2><p class="small">Typeface name: ${esc(n)}<br>File size: ${rnd(40, 300)} KB<br>Version: Version 1.99<br>Y2K compatible: Yes</p><hr><div style="font-family:${f[1]}"><p style="font-size:14px">abcdefghijklmnopqrstuvwxyz<br>ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>1234567890.:,;'"(!?)+-*/=</p>${[12, 18, 24, 36, 48, 60].map(s => `<p style="font-size:${s}px;margin:4px 0;white-space:nowrap"><small style="font:11px var(--ui)">${s}</small> The quick brown fox jumps over the lazy dog.</p>`).join('')}</div></div>`);
    const w = A.win(n + ' (TrueType)', b, { w: 520, h: 420, icon: CI.fonts });
    tap(qs(b, '[data-x=done]'), w.close); tap(qs(b, '[data-x=print]'), () => msg('Print', 'Out of cyan. The fox is black though, so... still no.', 'warn'));
    return w;
  }

  function appletGame() {
    return sheet('Game Controllers', [
      ['General', pg => {
        pg.innerHTML = `<div>Game Controllers:</div><div class="field pgk-gl"><div class="pgk-gr hd"><b>Controller</b><b>Status</b></div><div class="pgk-gr sel2"><span>2-axis, 4-button joystick</span><span>OK</span></div><div class="pgk-gr"><span>Dave's gamepad (borrowed)</span><span>Not connected</span></div></div><div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn" data-g="add">Add...</button><button class="btn" data-g="rem">Remove</button><button class="btn" data-g="prop">Properties</button></div>`;
        tap(qs(pg, '[data-g=add]'), () => msg('Add Game Controller', 'Available controllers: 2-axis 2-button joystick, 3-axis 4-button flight stick, Gamepad, "Custom...", A Lightsaber (toy).', 'info'));
        tap(qs(pg, '[data-g=rem]'), () => msg('Game Controllers', 'Remove the joystick? Then how would you play anything? No.', 'warn'));
        tap(qs(pg, '[data-g=prop]'), joyProps);
      }],
      ['Advanced', pg => { pg.innerHTML = `<div class="group"><span class="lg">Controller IDs</span><div class="row">Controller ID: <select><option>1</option><option>2</option></select> Controller: <b>2-axis, 4-button joystick</b></div></div><div class="group"><span class="lg">Port driver</span><select style="width:100%"><option>Standard Gameport</option><option>JackBlaster 16 Gameport</option></select></div><label><input type="checkbox"> Poll with interrupts enabled</label>`; }],
    ], { icon: CI.joy, w: 380, noApply: true }).w;
  }
  function joyProps() {
    let calStep = -1;
    const keyFns = [];
    const S_el = () => ({ addEventListener: (t, f) => keyFns.push([t, f]) });
    const S = sheet('2-axis, 4-button joystick Properties', [
      ['Settings', pg => {
        pg.innerHTML = `<p>If your joystick is not working properly, you may need to calibrate it. Click Calibrate and follow the instructions on the screen.</p><div class="pgk-cal2 field"></div><div class="row" style="justify-content:flex-end"><button class="btn pgk-calb">Calibrate...</button></div>`;
        const out = qs(pg, '.pgk-cal2');
        const STEPS = ['Move the handle to the upper left corner, then press a button (or click the box).', 'Move the handle to the lower right corner, then press a button.', 'Let the handle go so it springs back to the centre, then press a button.', 'Move it in circles a few times. Wheee! Then press a button.'];
        const showStep = () => { out.innerHTML = calStep < 0 ? '' : calStep >= STEPS.length ? '<b>Calibration complete!</b> Your joystick is now perfectly calibrated. It will drift again by Tuesday.' : `<b>Step ${calStep + 1} of ${STEPS.length}:</b> ${STEPS[calStep]}`; };
        tap(qs(pg, '.pgk-calb'), () => { calStep = 0; showStep(); });
        on(out, 'pointerdown', () => { if (calStep < 0 || calStep >= STEPS.length) return; calStep++; sfx('click'); showStep(); if (calStep >= STEPS.length) { secret('joycal'); sfx('solve'); } });
        on(S_el(), 'keydown', e => { if (/^[1-4 ]$/.test(e.key) && calStep >= 0 && calStep < STEPS.length) { calStep++; showStep(); if (calStep >= STEPS.length) secret('joycal'); } });
      }],
      ['Test', pg => {
        pg.innerHTML = `<div class="pgk-cols"><div><div>Axes</div><div class="pgk-joy field"><i class="pgk-xh"></i></div><div class="small pgk-xy">X: 0 Y: 0</div></div><div><div>Buttons</div><div class="pgk-jb">${[1, 2, 3, 4].map(i => `<button class="pgk-lamp" data-b="${i}" aria-label="Button ${i}">${i}</button>`).join('')}</div><p class="small">Move the mouse in the box. Press keys 1 to 4, or click the lights, to test the buttons.</p></div></div>`;
        const box = qs(pg, '.pgk-joy'), xh = qs(pg, '.pgk-xh'), xy = qs(pg, '.pgk-xy');
        const mv = e => { const r = box.getBoundingClientRect(); const x = clamp((e.clientX - r.left) / r.width, 0, 1), y = clamp((e.clientY - r.top) / r.height, 0, 1); xh.style.left = x * 100 + '%'; xh.style.top = y * 100 + '%'; xy.textContent = `X: ${Math.round((x - 0.5) * 65534)} Y: ${Math.round((y - 0.5) * 65534)}`; };
        on(box, 'pointermove', mv); on(box, 'pointerdown', e => { mv(e); lamp(1, true); }); on(box, 'pointerup', () => lamp(1, false));
        const lamp = (i, v) => { const l = qs(pg, `.pgk-lamp[data-b="${i}"]`); if (l) l.classList.toggle('on', v); };
        qsa(pg, '.pgk-lamp').forEach(l => { on(l, 'pointerdown', () => { lamp(l.dataset.b, true); sfx('click'); }); on(l, 'pointerup', () => lamp(l.dataset.b, false)); on(l, 'pointerleave', () => lamp(l.dataset.b, false)); });
        on(S_el(), 'keydown', e => { if (/^[1-4]$/.test(e.key)) lamp(e.key, true); });
        on(S_el(), 'keyup', e => { if (/^[1-4]$/.test(e.key)) lamp(e.key, false); });
      }],
    ], { icon: CI.joy, w: 400, tab: 1 });
    S.w.el.tabIndex = -1;
    keyFns.forEach(([t, f]) => S.w.el.addEventListener(t, f));
    setTimeout(() => S.w.el.focus({ preventScroll: true }), 30);
    return S.w;
  }

  function appletModems() {
    return sheet('Modems Properties', [
      ['General', pg => {
        pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px">${mini(CI.modem)}<span>The following modems are set up on this computer:</span></div><div class="field pgk-ml"><div class="pgk-pr sel">${mini(CI.modem, 16)} JackNet 56K Voice Modem</div></div><div class="row" style="justify-content:flex-end"><button class="btn" data-m="add">Add...</button><button class="btn" data-m="rem">Remove</button><button class="btn" data-m="prop">Properties</button></div><div class="group"><span class="lg">Dialling preferences</span>Dialling from: <b>New Location (Jack's bedroom)</b><br><span class="small">Click Dialling Properties to change how your calls are dialled.</span><div class="row" style="justify-content:flex-end"><button class="btn" data-m="dial">Dialling Properties</button></div></div>`;
        tap(qs(pg, '[data-m=add]'), () => msg('Install New Modem', 'JackOS will now try to detect your modem. Before continuing, you should: switch the modem on, and make sure Mom is not on the phone.\n\n...JackOS found: the same modem. You only have one.', 'info'));
        tap(qs(pg, '[data-m=rem]'), () => msg('Modems', 'Removing the modem would mean no Internet. No Internet means no JACK ATTACK! Online. Request denied.', 'warn'));
        tap(qs(pg, '[data-m=prop]'), modemProps);
        tap(qs(pg, '[data-m=dial]'), () => dialog('Dialling Properties', `<div class="group"><span class="lg">I am dialling from</span><select style="width:100%"><option>Jack's bedroom</option><option>Dave's house</option><option>Nan's (no phone socket upstairs)</option></select></div><div class="group"><span class="lg">How I dial from this location</span><label>To access an outside line, first dial: <input type="text" size="2"> for local</label><br><label><input type="checkbox"> To disable call waiting, dial: <input type="text" size="3" value="#43#"></label><br><label><input type="radio" name="pgkt" checked> Tone dial</label> <label><input type="radio" name="pgkt"> Pulse dial</label><br><label><input type="checkbox" checked> Check Mom is not on the phone first</label></div>`, [['OK'], ['Cancel']], { w: 380, icon: CI.modem }));
      }],
      ['Diagnostics', pg => {
        pg.innerHTML = `<p style="margin:0 0 6px">JackOS detected that the following ports have already been installed:</p><div class="field pgk-ml"><div class="pgk-gr"><b>Port</b><b>Installed</b></div><div class="pgk-gr pgk-pt" data-p="1"><span>COM1</span><span>Serial Mouse.</span></div><div class="pgk-gr pgk-pt sel" data-p="2"><span>COM2</span><span>JackNet 56K Voice Modem</span></div><div class="pgk-gr pgk-pt" data-p="3"><span>COM3</span><span>No modem installed.</span></div></div><div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn" data-m="drv">Driver</button><button class="btn" data-m="info">More Info...</button><button class="btn" data-m="help">Help</button></div>`;
        let port = 2;
        qsa(pg, '.pgk-pt').forEach(e => tap(e, () => { port = +e.dataset.p; qsa(pg, '.pgk-pt').forEach(x => x.classList.toggle('sel', x === e)); }));
        tap(qs(pg, '[data-m=drv]'), () => msg('Current Driver', port === 2 ? 'C:\\JACKOS\\SYSTEM\\SERIAL.VXD\nC:\\JACKOS\\SYSTEM\\JACKNET56.VXD (version 4.10.1999)' : 'C:\\JACKOS\\SYSTEM\\SERIAL.VXD', 'info'));
        tap(qs(pg, '[data-m=help]'), () => msg('Help', 'Modem not working? Check: 1) Is it plugged in? 2) Is the phone line plugged in? 3) Is Mom on the phone? It\'s usually 3.', 'info'));
        tap(qs(pg, '[data-m=info]'), () => {
          if (port !== 2) return msg('More Info', port === 1 ? 'The device on COM1 is a mouse. Mice do not respond to AT commands. JackOS tried.' : 'There is no modem on COM3. Just dust.', 'warn');
          const b = h('<div class="row" style="flex-wrap:nowrap;gap:10px">' + mini(CI.modem) + '<span>Please wait while JackOS communicates with your modem. This can take a few minutes.<br><span class="pgk-mw"></span></span></div>');
          const w = A.win('Please Wait', b, { w: 330, icon: CI.modem, noResize: true, noMax: true, noMin: true });
          sfx('beep'); let dots = 0;
          const iv = setInterval(() => { if (w.closed) return clearInterval(iv); qs(b, '.pgk-mw').textContent = 'AT' + ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7'][dots % 7] + '...'; dots++; if (dots > 9) { clearInterval(iv); w.close(); secret('modem'); modemInfo(); } }, 280);
        });
      }],
    ], { icon: CI.modem, w: 400, noApply: true }).w;
  }
  function modemInfo() {
    const AT = [['ATI1', '4A2C'], ['ATI2', 'OK'], ['ATI3', 'JackNet 56K Voice V.90 Rev 1.999'], ['ATI4', 'a007080284C6002F bc0000000 bd4440000'], ['ATI5', 'Country Code: United Kingdom (B4)'], ['ATI6', 'RCV56DPF L8570A Rev 47.1/47.1'], ['ATI7', 'Y2K bug detected on line: NO (phew)'], ['AT+FCLASS=?', '0,1,2,8'], ['AT+GMM', 'V90 Data/Fax/Voice/Gossip']];
    dialog('More Info...', `<div class="group"><span class="lg">Port Information</span><table class="pgk-perf"><tr><td>Port:</td><td>COM2</td></tr><tr><td>Interrupt:</td><td>3</td></tr><tr><td>Address:</td><td>2F8</td></tr><tr><td>UART:</td><td>NS 16550AN</td></tr><tr><td>Highest Speed:</td><td>115K Baud</td></tr></table></div><div class="group"><span class="lg">JackNet 56K Voice Modem</span><div>Identifier: SERENUM\\JKN5699</div><div class="field pgk-atc"><div class="pgk-gr"><b>Command</b><b>Response</b></div>${AT.map(([c, r]) => `<div class="pgk-gr"><span>${c}</span><span>${esc(r)}</span></div>`).join('')}</div></div>`, [['OK']], { w: 400, icon: CI.modem });
  }
  function modemProps() {
    return sheet('JackNet 56K Voice Modem Properties', [
      ['General', pg => { pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px">${mini(CI.modem)}<b>JackNet 56K Voice Modem</b></div><label class="row" style="margin-top:8px">Port: <select><option>Communications Port (COM2)</option></select></label><div class="group"><span class="lg">Speaker volume</span><div class="row" style="flex-wrap:nowrap">Off<input type="range" min="0" max="3" value="3" style="flex:1">High</div><div class="small">(Turning it off means you don't hear the screech. But where's the fun in that?)</div></div><div class="group"><span class="lg">Maximum speed</span><select style="width:100%"><option>57600</option><option selected>115200</option><option>230400 (in your dreams)</option></select><label><input type="checkbox"> Only connect at this speed</label></div>`; }],
      ['Connection', pg => { pg.innerHTML = `<div class="group"><span class="lg">Connection preferences</span><div class="row">Data bits: <select><option>8</option></select> Parity: <select><option>None</option></select> Stop bits: <select><option>1</option></select></div></div><div class="group"><span class="lg">Call preferences</span><label style="display:block"><input type="checkbox" checked> Wait for dial tone before dialling</label><label style="display:block"><input type="checkbox" checked> Cancel the call if not connected within <input type="text" value="60" size="2"> secs</label><label style="display:block"><input type="checkbox" checked> Disconnect a call if idle for more than <input type="text" value="30" size="2"> mins</label><label style="display:block"><input type="checkbox" checked> Hang up if Mom picks up the phone</label></div><div class="row"><button class="btn" data-x="port">Port Settings...</button><button class="btn" data-x="adv">Advanced...</button></div>`; tap(qs(pg, '[data-x=port]'), () => msg('Advanced Port Settings', 'Use FIFO buffers (requires 16550 compatible UART): yes.\nReceive buffer: High (14). Transmit buffer: High (16).\nGubbinz buffer: full.', 'info')); tap(qs(pg, '[data-x=adv]'), () => msg('Advanced Connection Settings', 'Extra settings: AT&FE0V1&C1&D2S0=0\n\nDon\'t ask what it means. Nobody knows. It came on a sticker on the bottom of the modem.', 'info')); }],
    ], { icon: CI.modem, w: 380 }).w;
  }

  function appletPasswords() {
    return sheet('Passwords Properties', [
      ['Change Passwords', pg => {
        pg.innerHTML = `<div class="group"><span class="lg">JackOS password</span><div class="row" style="flex-wrap:nowrap;gap:10px">${mini(CI.passwords)}<span style="flex:1">Click this button to change your JackOS password.</span></div><div class="row" style="justify-content:flex-end"><button class="btn" data-x="jack">Change JackOS Password...</button></div></div><div class="group"><span class="lg">Other passwords</span><div class="row" style="flex-wrap:nowrap;gap:10px">${mini(CI.passwords)}<span style="flex:1">Click this button to change your password for other password-protected services.</span></div><div class="row" style="justify-content:flex-end"><button class="btn" data-x="other">Change Other Passwords...</button></div></div>`;
        tap(qs(pg, '[data-x=jack]'), changePassword);
        tap(qs(pg, '[data-x=other]'), () => dialog('Select Password', `<p style="margin:0 0 6px">Select the password you want to change:</p><div class="field" style="height:80px;padding:2px"><div class="pgk-pr sel">JackNet Dial-Up</div><div class="pgk-pr">Screen Saver</div><div class="pgk-pr">Dave's PC (he told me it, it's DAVE)</div></div>`, [['Change...', () => { toast('Passwords', 'Passwords can only be changed while Mom is watching. She is not watching.'); }], ['Cancel']], { w: 320, icon: CI.passwords }));
      }],
      ['Remote Administration', pg => { pg.innerHTML = `<label><input type="checkbox" class="pgk-ra"> Enable Remote Administration of this server</label><div class="group"><span class="lg">Administrators</span><div class="field" style="height:70px;padding:2px"><div class="pgk-pr sel">Mom (always, whether you like it or not)</div></div></div>`; on(qs(pg, '.pgk-ra'), 'change', e => { if (e.target.checked) { e.target.checked = false; msg('Remote Administration', 'Remote Administration lets other people control this computer over the network. Mom already does this by shouting up the stairs.', 'info'); } }); }],
      ['User Profiles', pg => { pg.innerHTML = `<label style="display:block"><input type="radio" name="pgkup" checked> All users of this computer use the same preferences and desktop settings.</label><label style="display:block;margin-top:6px"><input type="radio" name="pgkup"> Users can customise their preferences and desktop settings. JackOS switches to your personal settings when you log in.</label><div class="group"><span class="lg">User profile settings</span><label style="display:block"><input type="checkbox" disabled> Include desktop icons and Network Neighbourhood contents</label><label style="display:block"><input type="checkbox" disabled> Include Start menu and Program groups</label></div><p class="small">(Everyone uses Jack's settings. Mom doesn't know how to change them. That's the plan.)</p>`; }],
    ], { icon: CI.passwords, w: 400 }).w;
  }
  function changePassword() {
    dialog('Change JackOS Password', `<div class="pgk-pwg"><label>Old password:</label><input type="password" class="pw0" autocomplete="off"><label>New password:</label><input type="password" class="pw1" autocomplete="off"><label>Confirm new password:</label><input type="password" class="pw2" autocomplete="off"></div>`,
      [['OK', bx => {
        const o = qs(bx, '.pw0').value.trim().toLowerCase(), n1 = qs(bx, '.pw1').value, n2 = qs(bx, '.pw2').value;
        if (o !== 'gubbinz') { msg('Change JackOS Password', 'The password you typed is incorrect. Please retype your old password. (Forgotten it? JackOS keeps a PasswordHint in the registry. Somewhere in HKEY_CURRENT_USER.)', 'warn'); return false; }
        if (n1 !== n2) { msg('Change JackOS Password', 'The new passwords you typed do not match. Type the new password in both boxes. Slowly.', 'warn'); return false; }
        if (/^password$/i.test(n1)) { msg('Change JackOS Password', 'That is the worst password in the world. It\'s Mom\'s password. Pick another one.', 'warn'); return false; }
        if (!n1) { msg('Change JackOS Password', 'A blank password! Very brave. Anyone can get in now. (They could anyway; this is JackOS.)', 'info'); }
        secret('password');
        msg('Change JackOS Password', 'Your JackOS password has been successfully changed. You will forget it by Tuesday.', 'info');
      }], ['Cancel']], { w: 340, icon: CI.passwords });
  }

  function appletPower() {
    return sheet('Power Management Properties', [
      ['Power Schemes', (pg, c) => {
        const sel = store.get('jhp_prog_power', 'Home/Office Desk');
        const SCH = { 'Home/Office Desk': [15, 30], 'Portable/Laptop': [5, 10], 'Always On': [0, 0], 'Arcade Mode (never sleeps, insert coin)': [0, 0], 'Mom Mode (everything off at 8:30pm)': [1, 1] };
        const opts = [[1, 'After 1 min'], [5, 'After 5 mins'], [15, 'After 15 mins'], [30, 'After 30 mins'], [60, 'After 1 hour'], [0, 'Never']];
        pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px">${mini(CI.power)}<span>Select the power scheme with the most appropriate settings for this computer.</span></div><div class="group"><span class="lg">Power schemes</span><select class="pgk-psch" style="width:100%">${Object.keys(SCH).map(k => `<option ${k === sel ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select><div class="row" style="justify-content:flex-end;margin-top:4px"><button class="btn" data-x="save">Save As...</button><button class="btn" data-x="del">Delete</button></div></div><div class="group"><span class="lg">Settings for this power scheme</span><label class="row" style="flex-wrap:nowrap"><span style="flex:1">Turn off monitor:</span><select class="pgk-mo">${opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label><label class="row" style="flex-wrap:nowrap;margin-top:4px"><span style="flex:1">Turn off hard disks:</span><select class="pgk-hd">${opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label></div>`;
        const sync = () => { const v = SCH[qs(pg, '.pgk-psch').value]; qs(pg, '.pgk-mo').value = v[0]; qs(pg, '.pgk-hd').value = v[1]; };
        sync();
        on(qs(pg, '.pgk-psch'), 'change', () => { sync(); c.dirty(); if (/Arcade/.test(qs(pg, '.pgk-psch').value)) toast('Power Management', 'INSERT COIN! This computer will NEVER sleep!'); });
        tap(qs(pg, '[data-x=save]'), () => toast('Power Management', 'Saved as "Jack\'s Scheme". It\'s the same as Always On.'));
        tap(qs(pg, '[data-x=del]'), () => msg('Power Management', 'You cannot delete Mom Mode. Mom put it there.', 'warn'));
        c.onApply(() => { store.set('jhp_prog_power', qs(pg, '.pgk-psch').value); if (/Mom Mode/.test(qs(pg, '.pgk-psch').value)) toast('Power Management', 'Mom Mode enabled. The computer will switch itself off at 8:30pm. (Not really. But be in bed anyway.)', 6000); });
      }],
      ['Advanced', pg => { pg.innerHTML = `<div class="group"><span class="lg">Options</span><label style="display:block"><input type="checkbox"> Always show icon on the taskbar</label><label style="display:block"><input type="checkbox"> Prompt for password when computer goes off standby</label><label style="display:block"><input type="checkbox" checked> Wake up when Gubbinz gets hungry</label></div><p class="small">To put the computer on standby, use Start > Shut Down > Stand by.</p>`; }],
    ], { icon: CI.power, w: 380 }).w;
  }

  function appletKeyboard() {
    return sheet('Keyboard Properties', [
      ['Speed', (pg, c) => {
        const blink = store.get('jhp_prog_blink', 1000);
        pg.innerHTML = `<div class="group"><span class="lg">Character repeat</span><div class="row" style="flex-wrap:nowrap">Repeat delay: Long<input type="range" min="0" max="3" value="1" style="flex:1">Short</div><div class="row" style="flex-wrap:nowrap">Repeat rate: Slow<input type="range" min="0" max="31" value="31" style="flex:1">Fast</div><label>Click here and hold down a key to test repeat rate:<input type="text" style="width:100%" placeholder="aaaaaaaaaaaaaaaaaaaaaa"></label></div><div class="group"><span class="lg">Cursor blink rate</span><div class="row" style="flex-wrap:nowrap"><span class="pgk-caret" aria-hidden="true"></span>None<input type="range" class="pgk-bl" min="0" max="10" value="${Math.round((1600 - blink) / 140)}" style="flex:1">Fast</div><div class="small">This changes the speed of every blinking thing in JackOS (try the NEW! labels on the website).</div></div>`;
        const bl = qs(pg, '.pgk-bl'), caret = qs(pg, '.pgk-caret');
        const ms = () => +bl.value === 0 ? 0 : 1600 - +bl.value * 140;
        const prev = () => { const m = ms(); caret.style.animationDuration = m ? m + 'ms' : '0s'; caret.classList.toggle('still', !m); };
        prev();
        on(bl, 'input', () => { prev(); c.dirty(); });
        c.onApply(() => { const m = ms(); setBlink(m || 99999, true); });
      }],
      ['Language', pg => { pg.innerHTML = `<div class="field" style="height:80px;padding:2px"><div class="pgk-gr"><b>Language</b><b>Layout</b></div><div class="pgk-gr sel"><span>En English (British)</span><span>United Kingdom</span></div></div><div class="row" style="margin-top:6px"><button class="btn" data-x="a">Add...</button><button class="btn" data-x="p">Properties...</button><button class="btn" data-x="r">Remove</button></div><div class="group"><span class="lg">Switch languages</span><label><input type="radio" name="pgkl" checked> Left Alt+Shift</label> <label><input type="radio" name="pgkl"> Ctrl+Shift</label> <label><input type="radio" name="pgkl"> None</label></div><label><input type="checkbox"> Enable indicator on taskbar</label>`; tap(qs(pg, '[data-x=a]'), () => msg('Add Language', 'Available: English (American), English (Australian), Ork (Gork and Mork dialects). Ork has no letter Q. Or vowels.', 'info')); tap(qs(pg, '[data-x=p]'), () => msg('Language Properties', 'Keyboard layout: United Kingdom. The " and @ are in the right places. (Americans have them swapped. Madness.)', 'info')); tap(qs(pg, '[data-x=r]'), () => msg('Keyboard', 'You can\'t remove the only language. You\'d have to type in pictures.', 'warn')); }],
      ['General', pg => { pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:10px">${mini(CI.keyboard)}<span style="flex:1">Keyboard type: <b>Standard 102-key UK keyboard</b><br><span class="small">(The S key is a bit sticky. That's Ribena.)</span></span><button class="btn pgk-kc">Change...</button></div>`; tap(qs(pg, '.pgk-kc'), () => msg('Select Device', 'Models: Standard 101/102-Key, Natural Keyboard (the bendy one), Keyboard With Extra Buttons That Do Nothing.', 'info')); }],
    ], { icon: CI.keyboard, w: 400 }).w;
  }

  function appletMultimedia() {
    return sheet('Multimedia Properties', [
      ['Audio', pg => { pg.innerHTML = `<div class="group"><span class="lg">Playback</span><div class="row" style="flex-wrap:nowrap;gap:8px">${mini(CI.sounds, 24)}<div style="flex:1">Volume:<input type="range" min="0" max="100" value="80" style="width:100%"></div></div><label class="row">Preferred device:<select style="flex:1"><option>JackBlaster 16 Wave Out</option></select></label></div><div class="group"><span class="lg">Recording</span><label class="row">Preferred device:<select style="flex:1"><option>JackBlaster 16 Wave In</option></select></label><div class="small">(The microphone is in the drawer. It's never been used. It's still in the plastic.)</div></div><label style="display:block"><input type="checkbox" checked> Show volume control on the taskbar</label>`; }],
      ['Video', pg => { pg.innerHTML = `<div class="pgk-vid field"><div class="pgk-vscr"><span>&#9654;</span></div></div><div class="group"><span class="lg">Show video in</span><label style="display:block"><input type="radio" name="pgkv" checked> Window <select><option>Original size</option><option>Double original size</option><option>1/4 of screen size</option></select></label><label style="display:block"><input type="radio" name="pgkv"> Full screen (very blocky)</label></div>`; }],
      ['MIDI', pg => { pg.innerHTML = `<div class="group"><span class="lg">MIDI output</span><label style="display:block"><input type="radio" name="pgkm" checked> Single instrument</label><div class="field" style="height:70px;padding:2px;margin:0 0 6px 20px">${['JackAmp Chiptune Engine 2.0', 'JackBlaster 16 MIDI Synth', 'MPU-401 Compatible'].map((n, i) => `<div class="pgk-pr${i === 0 ? ' sel' : ''}">${n}</div>`).join('')}</div><label style="display:block"><input type="radio" name="pgkm"> Custom configuration</label></div><div class="row" style="justify-content:flex-end"><button class="btn pgk-ani">Add New Instrument...</button></div><p class="small">Tip: JackAmp (Start > Programs > Accessories > Entertainment) plays all of Jack's MIDI files.</p>`; tap(qs(pg, '.pgk-ani'), () => msg('MIDI Instrument Installation Wizard', 'Connect the new instrument to the MIDI port on your sound card.\n\n(Jack does not have a keyboard. He has a recorder from school. It does not have a MIDI port.)', 'info')); qsa(pg, '.pgk-pr').forEach(e => tap(e, () => qsa(pg, '.pgk-pr').forEach(x => x.classList.toggle('sel', x === e)))); }],
      ['CD Music', pg => { pg.innerHTML = `<div class="row">CD-ROM drive: <select><option>D:</option></select></div><div class="group"><span class="lg">Headphone</span><div class="row" style="flex-wrap:nowrap">Low<input type="range" min="0" max="10" value="7" style="flex:1">High</div></div><label><input type="checkbox"> Enable digital CD audio for this CD-ROM device</label><p class="small">Current disc in D:: JACK ATTACK! Cover Disc 7 (data). There are no music tracks. There is one hidden track. Not really. Or is there.</p>`; }],
      ['Devices', pg => { pg.innerHTML = `<p style="margin:0 0 6px">Multimedia devices:</p><div class="field pgk-mmd">${['Audio Devices', 'MIDI Devices and Instruments', 'Mixer Devices', 'Line Input Devices', 'Media Control Devices', 'Video Compression Codecs', 'Audio Compression Codecs', 'Video Capture Devices', 'Joystick Devices', 'Robot Noise Devices'].map(n => `<div class="pgk-pr">+ ${mini(CI.multimedia, 14)} ${n}</div>`).join('')}</div><div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn pgk-mp">Properties</button></div>`; qsa(pg, '.pgk-pr').forEach(e => tap(e, () => qsa(pg, '.pgk-pr').forEach(x => x.classList.toggle('sel', x === e)))); tap(qs(pg, '.pgk-mp'), () => { const s = qs(pg, '.pgk-pr.sel'); msg('Properties', s && /Robot/.test(s.textContent) ? 'Robot Noise Device: beeping normally.' : 'This device is working properly. Probably.', 'info'); }); }],
    ], { icon: CI.multimedia, w: 400 }).w;
  }

  function appletNetwork() {
    return sheet('Network', [
      ['Configuration', pg => { pg.innerHTML = `<p style="margin:0 0 4px">The following network components are installed:</p><div class="field pgk-ml">${['Client for JackNet Networks', 'Dial-Up Adapter', 'TCP/IP -> Dial-Up Adapter', 'NetBEUI -> Dial-Up Adapter', 'File and printer sharing for Gubbinz'].map((n, i) => `<div class="pgk-pr${i === 0 ? ' sel' : ''}">${mini(i === 1 ? CI.modem : CI.network, 16)} ${n}</div>`).join('')}</div><div class="row" style="justify-content:flex-start;margin-top:6px"><button class="btn" data-n="add">Add...</button><button class="btn" data-n="rem">Remove</button><button class="btn" data-n="prop">Properties</button></div><label class="row" style="margin-top:6px">Primary Network Logon:<select style="flex:1"><option>Client for JackNet Networks</option><option>JackOS Logon</option></select></label><div class="row" style="margin-top:6px"><button class="btn" data-n="share">File and Print Sharing...</button></div>`; qsa(pg, '.pgk-pr').forEach(e => tap(e, () => qsa(pg, '.pgk-pr').forEach(x => x.classList.toggle('sel', x === e)))); tap(qs(pg, '[data-n=add]'), () => msg('Select Network Component Type', 'Client, Adapter, Protocol, Service... or Pizza. You have all of them already.', 'info')); tap(qs(pg, '[data-n=rem]'), () => msg('Network', 'Removing networking would mean no chatting with Dave. Not allowed.', 'warn')); tap(qs(pg, '[data-n=prop]'), () => msg('TCP/IP Properties', 'IP address: obtained automatically from JackNet.\nDNS: JackNet DNS.\nGateway: the phone socket behind the sofa.', 'info')); tap(qs(pg, '[data-n=share]'), () => dialog('File and Print Sharing', `<label style="display:block"><input type="checkbox"> I want to be able to give others access to my files.</label><label style="display:block"><input type="checkbox"> I want to be able to allow others to print to my printer(s).</label><p class="small">(Dave has asked for access to your files 14 times. Say no.)</p>`, [['OK'], ['Cancel']], { w: 340, icon: CI.network })); }],
      ['Identification', pg => { pg.innerHTML = `<p style="margin:0 0 8px">JackOS uses the following information to identify your computer on the network.</p><div class="pgk-pwg"><label>Computer name:</label><input type="text" value="JACKS-PC" maxlength="15"><label>Workgroup:</label><input type="text" value="JACKNET"><label>Computer Description:</label><input type="text" value="Jack's PC (do not touch - Mom)"></div>`; }],
      ['Access Control', pg => { pg.innerHTML = `<div class="group"><span class="lg">Control access to shared resources using:</span><label style="display:block"><input type="radio" name="pgkac" checked> Share-level access control</label><div class="small" style="margin-left:22px">Enables you to supply a password for each shared resource.</div><label style="display:block;margin-top:4px"><input type="radio" name="pgkac"> User-level access control</label><div class="small" style="margin-left:22px">Enables you to specify users and groups who have access to each shared resource. (Users: Jack. Groups: Jack.)</div></div>`; }],
    ], { icon: CI.network, w: 390 }).w;
  }

  function appletRegional() {
    const now = new Date(), t = today();
    return sheet('Regional Settings Properties', [
      ['Regional Settings', pg => { pg.innerHTML = `<p style="margin:0 0 6px">Many programs support international settings for numbers, currencies, times, and dates. Setting the regional settings below will change the way these programs display and sort these.</p><div class="pgk-map field" style="height:110px"><svg viewBox="0 0 360 150" preserveAspectRatio="none"><rect width="360" height="150" fill="#5aa0ff"/><path d="M160 25l40-5 10 15-15 10 5 20-30 5-15-20z" fill="#3a9a2a"/><path d="M168 30l4-6 4 4-2 8-4 2z" fill="#e10600"/><circle cx="172" cy="32" r="12" fill="none" stroke="#ffd400" stroke-width="2"/></svg></div><select style="width:100%"><option>English (British)</option><option>English (United States)</option><option>Ork</option></select>`; }],
      ['Number', pg => { pg.innerHTML = `<div class="pgk-ex">Appearance samples: Positive: <b>123,456,789.00</b> Negative: <b>-123,456,789.00</b></div><div class="pgk-pwg"><label>Decimal symbol:</label><input type="text" value="." size="2"><label>No. of digits after decimal:</label><input type="text" value="2" size="2"><label>Digit grouping symbol:</label><input type="text" value="," size="2"><label>Negative sign symbol:</label><input type="text" value="-" size="2"><label>Measurement system:</label><select><option>Metric (but Nan still uses feet)</option><option>U.S.</option></select></div>`; }],
      ['Currency', pg => { pg.innerHTML = `<div class="pgk-ex">Appearance samples: Positive: <b>\u00a3123,456,789.00</b> Negative: <b>-\u00a3123,456,789.00</b></div><div class="pgk-pwg"><label>Currency symbol:</label><input type="text" value="\u00a3" size="2"><label>Position of currency symbol:</label><select><option>\u00a31.1</option></select><label>Pocket money per week:</label><input type="text" value="\u00a33.00 (not enough)"></div>`; }],
      ['Time', pg => { pg.innerHTML = `<div class="pgk-ex">Time sample: <b>${now.toLocaleTimeString('en-GB')}</b></div><div class="pgk-pwg"><label>Time style:</label><select><option>HH:mm:ss</option><option>h:mm:ss tt</option></select><label>Time separator:</label><input type="text" value=":" size="2"><label>Bedtime:</label><input type="text" value="20:30 (non-negotiable)" readonly></div>`; }],
      ['Date', pg => { pg.innerHTML = `<div class="group"><span class="lg">Short date</span><div class="pgk-ex">Short date sample: <b>${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}/99</b></div><div class="pgk-pwg"><label>Short date style:</label><select><option>dd/MM/yy</option><option>dd/MM/yyyy</option></select><label>Date separator:</label><input type="text" value="/" size="2"></div><p class="small" style="color:#800000">Warning: two-digit years like "99" will turn into "00" next year. Some computers will think it's 1900. This is the famous Millennium Bug!</p></div><div class="group"><span class="lg">Long date</span><div class="pgk-ex">Long date sample: <b>${DAYS[t.date.getDay()]}, ${t.d} ${MONTHS[t.m - 1]} 1999</b></div></div>`; }],
    ], { icon: CI.regional, w: 410 }).w;
  }

  function appletGubbinz() {
    const hunger = (() => { const n = keyOf('My Computer\\HKEY_CURRENT_USER\\Software\\Gubbinz'); return n ? REG_NUM(n.GubbinzHunger) : 80; })();
    return sheet('Gubbinz Virtual Pet Properties', [
      ['Status', pg => { pg.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:12px">${mini(CI.gubbinz, 48)}<div><b>Gubbinz</b><br>Version 1.2 (Plug and Pray)<br>Mood: Cheeky<br>Favourite food: Pizza</div></div><div class="group"><span class="lg">Hunger</span><div class="pgk-hung"></div><div class="small">${hunger > 0x50 ? 'DANGER: very hungry. Hide the mouse cable.' : 'Peckish. Always peckish.'}</div></div>`; progBar(qs(pg, '.pgk-hung'))(clamp(hunger / 255, 0.05, 1)); }],
      ['Feeding', pg => { pg.innerHTML = `<p>Gubbinz lives on the JACK ATTACK! website. To feed him, visit his page.</p><div class="row" style="justify-content:center"><button class="btn big pgk-feed">Go to Gubbinz's page</button></div><p class="small">Do not feed after midnight. Do not get him wet. Actually, that's a different pet.</p>`; tap(qs(pg, '.pgk-feed'), () => { $('browser').classList.remove('min'); IE.go('grot', 'click'); }); }],
    ], { icon: CI.gubbinz, w: 360, noApply: true }).w;
  }

  function appletHardware() {
    const steps = [
      `<div class="pgk-wiz">${mini(CI.hardware, 48)}<div><b>Add New Hardware Wizard</b><p>This wizard installs the software for a new hardware device.</p><p>Before continuing, close any open programs. To continue, click Next.</p></div></div>`,
      `<div class="pgk-wiz">${mini(CI.hardware, 48)}<div><p>JackOS will now search for any new Plug and Play devices on your system.</p><p>Your screen may go blank during this process. This is normal. (So is screaming a bit.)</p></div></div>`,
      `<div class="pgk-wiz">${mini(CI.hardware, 48)}<div><p>Searching for new hardware...</p><div class="pgk-hwp"></div><p class="small pgk-hws">&nbsp;</p></div></div>`,
      `<div class="pgk-wiz">${mini(CI.gubbinz, 48)}<div><p>JackOS found the following new device:</p><p><b>Gubbinz, the little green helper (Plug and Pray)</b></p><p>He was hiding behind the computer. JackOS has installed the drivers. He ate two of them. To finish, click Finish.</p></div></div>`,
    ];
    let i = 0;
    const b = h('<div class="pgk-wbody"></div><div class="row pg-dlgbtns"><button class="btn" data-w2="back">&lt; Back</button><button class="btn" data-w2="next">Next &gt;</button><button class="btn" data-w2="cancel">Cancel</button></div>');
    const w = A.win('Add New Hardware Wizard', b, { w: 420, icon: CI.hardware, noResize: true, noMax: true, noMin: true, escClose: true });
    const nx = qs(b, '[data-w2=next]'), bk = qs(b, '[data-w2=back]');
    function show() {
      qs(b, '.pgk-wbody').innerHTML = steps[i]; bk.disabled = i === 0 || i === 2; nx.textContent = i === 3 ? 'Finish' : 'Next >'; nx.disabled = i === 2;
      if (i === 2) { const set = progBar(qs(b, '.pgk-hwp')); let p = 0; const iv = setInterval(() => { if (w.closed) return clearInterval(iv); p += 0.05; set(p); qs(b, '.pgk-hws').textContent = pick(['Looking behind the monitor...', 'Checking under the desk...', 'Asking the modem...', 'Poking the CD-ROM...', 'Something is moving...']); if (p >= 1) { clearInterval(iv); i = 3; show(); } }, 180); }
    }
    tap(nx, () => { if (i === 3) { secret('hardware'); w.close(); msg('System Settings Change', 'To finish setting up your new hardware, you must restart your computer.\n\nDo you want to restart your computer now?', 'q', [['Yes', () => toast('JackOS', 'Actually, let\'s not. Gubbinz is asleep on the power button.', 5000)], ['No']]); return; } i++; show(); });
    tap(bk, () => { i = Math.max(0, i - 1); show(); });
    tap(qs(b, '[data-w2=cancel]'), w.close);
    show();
    return w;
  }
  function accessibility() {
    return sheet('Accessibility Properties', [
      ['Keyboard', pg => { pg.innerHTML = `<div class="group"><span class="lg">StickyKeys</span><p style="margin:0">Use StickyKeys if you want to use Shift, Ctrl or Alt by pressing one key at a time.</p><label><input type="checkbox" class="pgk-sk"> Use StickyKeys</label></div><div class="group"><span class="lg">FilterKeys</span><p style="margin:0">Use FilterKeys if you want JackOS to ignore brief or repeated keystrokes (for example, a cat walking over the keyboard).</p><label><input type="checkbox"> Use FilterKeys</label></div><div class="group"><span class="lg">ToggleKeys</span><p style="margin:0">Use ToggleKeys if you want to hear tones when pressing Caps Lock, Num Lock and Scroll Lock.</p><label><input type="checkbox"> Use ToggleKeys</label></div>`; on(qs(pg, '.pgk-sk'), 'change', e => { if (e.target.checked) msg('StickyKeys', 'StickyKeys is on. (Tip: pressing Shift five times turns it on in real JackOS. Everybody has done this by accident in the middle of a game.)', 'info'); }); }],
      ['Sound', pg => { pg.innerHTML = `<div class="group"><span class="lg">SoundSentry</span><p style="margin:0">Use SoundSentry if you want JackOS to generate visual warnings when your system makes a sound.</p><label><input type="checkbox" class="pgk-ss2"> Use SoundSentry</label></div><div class="group"><span class="lg">ShowSounds</span><p style="margin:0">Use ShowSounds to tell your programs to display captions for the speech and sounds they make.</p><label><input type="checkbox"> Use ShowSounds</label></div>`; on(qs(pg, '.pgk-ss2'), 'change', e => { if (e.target.checked) { document.body.classList.add('pg-flash'); setTimeout(() => document.body.classList.remove('pg-flash'), 400); } }); }],
      ['Display', (pg, c) => { pg.innerHTML = `<div class="group"><span class="lg">High Contrast</span><p style="margin:0">Use this option if you want JackOS to use colours and fonts designed for easy reading.</p><label><input type="checkbox" class="pgk-hc" ${store.get('jhp_prog_scheme', '') === 'High Contrast White' ? 'checked' : ''}> Use High Contrast</label></div>`; on(qs(pg, '.pgk-hc'), 'change', () => c.dirty()); c.onApply(() => applyScheme(qs(pg, '.pgk-hc').checked ? 'High Contrast White' : 'JackOS Standard', true)); }],
      ['Mouse', pg => { pg.innerHTML = `<div class="group"><span class="lg">MouseKeys</span><p style="margin:0">Use MouseKeys if you want to control the pointer with the numeric keypad on your keyboard.</p><label><input type="checkbox"> Use MouseKeys</label></div><p class="small">Pointer trails are in Control Panel > Mouse > Motion.</p>`; }],
      ['General', pg => { pg.innerHTML = `<div class="group"><span class="lg">Automatic reset</span><label><input type="checkbox"> Turn off accessibility features after idle for <select><option>5</option></select> minutes</label></div><div class="group"><span class="lg">Notification</span><label style="display:block"><input type="checkbox" checked> Give warning message when turning a feature on</label><label style="display:block"><input type="checkbox" checked> Make a sound when turning a feature on or off</label></div>`; }],
    ], { icon: CI.access, w: 400 }).w;
  }
  function internetOptions() {
    const tools = qs(document, '#ieMenu [data-menu=tools]');
    if (tools && window.IE) {
      $('browser').classList.remove('min');
      tools.click();
      const it = qsa(document, '.menu button').find(x => /Internet Options/.test(x.textContent));
      if (it) { it.click(); return; }
      IE.closeMenus && IE.closeMenus();
    }
    msg('Internet Properties', 'Open JackNet Explorer and choose Tools > Internet Options.', 'info');
  }

  const APPLETS = [
    ['Accessibility Options', CI.access, 'Changes accessibility options for your computer.', accessibility],
    ['Add New Hardware', CI.hardware, 'Starts a wizard which helps you install new hardware.', appletHardware],
    ['Add/Remove Programs', CI.addrem, 'Sets up programs and creates shortcuts.', appletAddRemove],
    ['Date/Time', CI.datetime, 'Changes date, time and time zone information.', appletDateTime],
    ['Display', CI.display, 'Changes display settings: wallpaper, screen saver, colours and resolution.', () => appletDisplay(0)],
    ['Fonts', CI.fonts, 'Displays and manages fonts on your computer.', fontsWindow],
    ['Game Controllers', CI.joy, 'Adds, removes and changes settings of game controllers (joysticks).', appletGame],
    ['Gubbinz', CI.gubbinz, 'Changes settings for Gubbinz Virtual Pet 1.2. (He installed this himself.)', appletGubbinz],
    ['Internet', CI.internet, 'Configures your Internet display and connection settings.', internetOptions],
    ['Keyboard', CI.keyboard, 'Changes keyboard settings, including the cursor blink rate.', appletKeyboard],
    ['Modems', CI.modem, 'Installs a new modem and changes modem properties.', appletModems],
    ['Mouse', CI.mouse, 'Changes mouse settings: buttons, double-click speed, pointers and trails.', appletMouse],
    ['Multimedia', CI.multimedia, 'Changes settings for multimedia devices.', appletMultimedia],
    ['Network', CI.network, 'Configures network hardware and software.', appletNetwork],
    ['Passwords', CI.passwords, 'Changes passwords and security settings.', appletPasswords],
    ['Power Management', CI.power, 'Configures energy saving settings.', appletPower],
    ['Printers', CI.printers, 'Adds, removes and changes settings for printers.', () => msg('Printers', 'Printer: Epson Stylus Color 440. Status: Out of cyan. Always out of cyan.', 'warn')],
    ['Regional Settings', CI.regional, 'Changes how numbers, currencies, dates and times are displayed.', appletRegional],
    ['Sounds', CI.sounds, 'Changes the sound scheme and individual system sounds.', appletSounds],
    ['System', CI.system, 'Provides system information and changes advanced settings (Device Manager!).', () => appletSystem(0)],
  ];
  A.register('control', { single: true, cmd: ['control', 'control panel', 'controlpanel'], open() {
    const b = h(`<div class="pgk-cp"><div class="pgk-side"><div class="pgk-sh">${mini(I.control, 32)}<b>Control Panel</b></div><hr><div class="pgk-sd">Use the settings in Control Panel to personalise your computer.<br><br>Select an item to view its description.</div><div class="pgk-sl"><a href="#" data-l="update">JackOS Update</a><a href="#" data-l="tech">Technical Support</a></div></div><div class="pgk-icons">${APPLETS.map(([n, ic], i) => `<button class="pgk-ic" data-i="${i}">${mini(ic)}<span>${esc(n)}</span></button>`).join('')}</div></div>`);
    const w = A.win('Control Panel', b, { w: 600, h: 420, icon: I.control, menubar: true, status: true, minW: 260, minH: 200 });
    w.status.textContent = APPLETS.length + ' object(s)';
    const sd = qs(b, '.pgk-sd');
    qsa(b, '.pgk-ic').forEach(e => {
      const a = APPLETS[+e.dataset.i];
      tap(e, () => { qsa(b, '.pgk-ic').forEach(x => x.classList.toggle('sel', x === e)); sd.innerHTML = `<b>${esc(a[0])}</b><br><br>${esc(a[2])}`; w.status.textContent = a[2]; });
      dbl(e, () => a[3]());
      on(e, 'keydown', ev => { if (ev.key === 'Enter') a[3](); });
    });
    tap(qs(b, '[data-l=update]'), e => { e.preventDefault(); const u = $('smUpdate'); if (u) u.click(); });
    tap(qs(b, '[data-l=tech]'), e => { e.preventDefault(); A.open('dialer', 'jacknet'); });
    A.menubar(w, [
      ['File', [{ label: 'Open', act: () => { const s = qs(b, '.pgk-ic.sel'); if (s) APPLETS[+s.dataset.i][3](); } }, '-', { label: 'Create Shortcut', act: () => toast('Control Panel', 'Shortcut created on the desktop. (It\'s invisible. It\'s a very advanced shortcut.)') }, '-', { label: 'Close', act: () => w.close() }]],
      ['View', [{ label: 'Large Icons', rad: true }, { label: 'Small Icons', act: () => b.classList.toggle('pgk-small') }, '-', { label: 'as Web Page', chk: true, act: () => b.classList.toggle('pgk-noweb') }, '-', { label: 'Refresh', act: () => toast('Control Panel', 'Refreshed. Still 20 things in here.') }]],
      ['Go', [{ label: 'My Computer', act: () => A.open('explorer', 'C:') }, { label: 'Internet Call', act: () => A.open('dialer') }, { label: 'Home Page', act: () => { $('browser').classList.remove('min'); IE.go('home', 'click'); } }]],
      ['Help', [{ label: 'Help Topics', act: () => Desk.notepad('Control Panel Help.txt', 'CONTROL PANEL\n=============\n\nDouble-click an icon to change your settings.\n\nFavourite things to try:\n  Display    change the wallpaper and the colours (try Hot Dog Stand. Sorry.)\n  Mouse      pointer trails! and the jack-in-the-box\n  Sounds     preview every sound effect on the computer\n  System     Device Manager, where all the broken stuff lives\n  Modems     More Info asks the modem questions\n\nYou can also type these into Start > Run:\n  desk.cpl  main.cpl  mmsys.cpl  sysdm.cpl  timedate.cpl\n  appwiz.cpl  modem.cpl  joy.cpl  password.cpl  inetcpl.cpl  access.cpl\n') }, '-', { label: 'About JackOS 98', act: () => appletSystem(0) }]],
    ]);
    return w;
  } });
  A.cmd(['desk.cpl', 'display'], () => appletDisplay(0));
  A.cmd(['main.cpl', 'mouse'], appletMouse); A.cmd(['mmsys.cpl'], appletMultimedia); A.cmd(['sysdm.cpl'], () => appletSystem(0)); A.cmd(['devmgmt', 'device manager'], () => appletSystem(1));
  A.cmd(['timedate.cpl'], appletDateTime); A.cmd(['appwiz.cpl'], appletAddRemove); A.cmd(['modem.cpl'], appletModems); A.cmd(['joy.cpl'], appletGame);
  A.cmd(['password.cpl'], appletPasswords); A.cmd(['inetcpl.cpl'], internetOptions); A.cmd(['access.cpl'], accessibility); A.cmd(['intl.cpl'], appletRegional); A.cmd(['netcpl.cpl'], appletNetwork); A.cmd(['fonts'], fontsWindow); A.cmd(['sticpl.cpl', 'gubbinz.cpl'], appletGubbinz); A.cmd(['hdwwiz.cpl', 'sysdm.cpl,add new hardware'], appletHardware);

  // ================================================================ PHONE DIALER
  const MODEM_NO = '0735#1842*9'; // the number the modem dials (listen to it!)
  const SPEED = [['Dave', '01632 960123'], ['Tony\'s Pizza', '01632 960555'], ['JackNet support (50p/min!)', '0909 8790199'], ['Mom\'s work', '01632 960777'], ['Nan', '01632 960222'], ['Speaking Clock', '123'], ['Cinema times', '01632 960888'], ['(Empty)', '']];
  const KEYPAD = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', ''], ['#', '']];
  const clean = s => String(s || '').replace(/[^0-9*#]/g, '');
  const CALLS = { // number -> [who, lines]
    '01632960123': ['Dave', ['Ring ring... ring ring...', 'Dave\'s Mom: "Hello? Oh, hello love. He\'s having his tea. Shall I get him to ring you back?"', 'Dave (shouting in the background): "TELL HIM I\'VE GOT THE GOOD CONTROLLER!"', 'Dave\'s Mom: "He says he\'s got the good controller. Bye now!"']],
    '01632960555': ['Tony\'s Pizza', ['Ring ring...', 'Tony: "Tony\'s Pizza, what can I get you?"', 'You: "One large pepperoni please. And garlic bread."', 'Tony: "Thirty minutes. Cash on the door. Is your Mom paying?"', 'You: "...I\'ll ring back."']],
    '01632960777': ['Mom\'s work', ['Ring ring...', 'Receptionist: "Good afternoon, putting you through..."', 'Mom: "Hello? Is everything alright? You\'re not on the Internet, are you? I can\'t ring home when you\'re on the Internet!"', 'Mom: "Have you done your homework?"']],
    '01632960222': ['Nan', ['Ring ring... ring ring... ring ring... ring ring...', 'Nan: "Hello? HELLO? Who is it? Speak up!"', 'Nan: "Oh it\'s you! Are you eating properly? I\'ve knitted you a jumper. It\'s brown."', 'Nan: "I\'ll put a fiver in your birthday card. Don\'t tell your mother."']],
    '01632960888': ['Cinema times', ['Ring ring...', 'Recorded voice: "Welcome to the Multiplex information line. Please choose from the following options."', 'Recorded voice: "For this week\'s films, press 1. For prices, press 2. For a very long wait, press 3."', '(It has been reading the list for four minutes. You hang up.)']],
    '100': ['The Operator', ['Operator: "Operator services, how can I help?"', 'You: "Can I make a reverse charge call to Dave?"', 'Operator: "And who is paying for this call, caller?"', '(You hang up.)']],
    '192': ['Directory Enquiries', ['Directory Enquiries: "Which name, please?"', 'You: "Gubbinz."', 'Directory Enquiries: "...I have no listing for Gubbinz. Is that a business?"']],
    '1471': ['Last caller', ['Recorded voice: "Telephone number... 01632 960123... called today... at... 4:42 pm."', '(That\'s Dave. He rang while you were on the Internet and got the engaged tone. Again.)']],
    '07734': ['hELLO', ['(It\'s an upside-down word, not a phone number. Nobody answers. Try it on the Calculator!)']],
  };
  let dialerApi = null;
  A.register('dialer', { single: true, cmd: ['dialer', 'phone', 'phone dialer'], open(arg) {
    const sp = store.get('jhp_prog_speed', null) || SPEED;
    const b = h(`<div class="pgf"><div class="pgf-l"><label>Number to dial:</label><div class="row" style="flex-wrap:nowrap"><input type="text" class="pgf-num" list="pgfHist" autocomplete="off" inputmode="tel" style="flex:1;min-width:0"><datalist id="pgfHist"></datalist><button class="btn pgf-dial"><b>Dial</b></button></div>
      <div class="pgf-pad">${KEYPAD.map(([d, l]) => `<button class="btn pgf-k" data-d="${d}"><b>${d}</b><small>${l || '&nbsp;'}</small></button>`).join('')}</div></div>
      <div class="pgf-r group"><span class="lg">Speed dial</span>${sp.map(([n, num], i) => `<div class="row" style="flex-wrap:nowrap"><span class="pgf-n">${i + 1}</span><button class="btn pgf-sd" data-i="${i}" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(n)}">${esc(n)}</button></div>`).join('')}</div></div>`);
    const w = A.win('Phone Dialer', b, { w: 470, icon: I.phone, menubar: true, status: true, noResize: true, noMax: true, onClose: () => { dialerApi = null; } });
    w.status.textContent = Sound.on ? 'Ready. Press a key or a speed dial button.' : 'Ready. (Sound is off: click the tray speaker to hear the tones.)';
    const num = qs(b, '.pgf-num');
    const hist = () => { qs(b, '#pgfHist').innerHTML = store.get('jhp_prog_dialhist', []).map(h2 => `<option value="${esc(h2)}">`).join(''); };
    hist();
    qsa(b, '.pgf-k').forEach(k => on(k, 'pointerdown', e => { e.preventDefault(); num.value += k.dataset.d; dtmf(k.dataset.d); sfxHint(); }));
    on(num, 'keydown', e => { if (DTMF[e.key]) dtmf(e.key); if (e.key === 'Enter') { e.preventDefault(); dial(num.value); } });
    tap(qs(b, '.pgf-dial'), () => dial(num.value));
    qsa(b, '.pgf-sd').forEach(x => tap(x, () => { const [n, nn] = sp[+x.dataset.i]; if (!nn) return programSpeed(+x.dataset.i); num.value = nn; dial(nn, n); }));
    function programSpeed(i) {
      Desk.ask('Program Speed Dial', `Name for speed dial ${i + 1}:`, '', 20, n => { if (!String(n || '').trim()) return; Desk.ask('Program Speed Dial', 'Number to dial:', '', 16, nn => { if (!clean(nn)) return; sp[i] = [String(n).trim(), String(nn).trim()]; store.set('jhp_prog_speed', sp); qs(b, `.pgf-sd[data-i="${i}"]`).textContent = sp[i][0]; toast('Phone Dialer', 'Speed dial saved.'); }); });
    }
    let busy = false;
    function dial(raw, who) {
      const n = clean(raw); if (!n || busy) return;
      busy = true; sfxHint();
      const histL = [raw.trim(), ...store.get('jhp_prog_dialhist', []).filter(x => x !== raw.trim())].slice(0, 10); store.set('jhp_prog_dialhist', histL); hist();
      const log = store.get('jhp_prog_calllog', []); log.unshift([d99(), new Date().toTimeString().slice(0, 5), who || raw.trim()]); store.set('jhp_prog_calllog', log.slice(0, 30));
      w.status.textContent = 'Dialling ' + raw.trim() + '...';
      // dial tone, the digits, then ringing (or the modem answers)
      Sound.note(350, 0.5, 'sine'); Sound.note(440, 0.5, 'sine');
      [...n].forEach((d, i) => setTimeout(() => dtmf(d, 0.09), 600 + i * 130));
      const after = 600 + n.length * 130 + 300;
      setTimeout(() => {
        if (w.closed) { busy = false; return; }
        if (n === '999' || n === '112') { busy = false; w.status.textContent = 'Ready.'; return msg('Phone Dialer', '999 is for real emergencies only: fire, police or ambulance. Not for "Dave won\'t give my game back". Phone Dialer has not dialled it.', 'warn'); }
        if (n === clean(MODEM_NO)) { secret('dialmodem'); sfx('modem'); w.status.textContent = 'Connected to: JackNet 56K (your own modem!)'; setTimeout(() => { busy = false; msg('Phone Dialer', 'EEEE-AWWW-KSSHHH-DING-DING-BRRRRR!\n\nYou dialled the number your modem dials. It answered. It thinks you are a modem. You are now connected to yourself at 0 bps.', 'info'); }, 900); return; }
        if (/^0909/.test(n)) { busy = false; return premium(); }
        if (n === '123') { busy = false; return speakingClock(); }
        ring(2, () => call(CALLS[n] || [raw.trim(), pick([['Ring ring... ring ring... ring ring...', '(No answer. Everyone is out.)'], ['Beep... beep... beep...', '(Engaged. Probably someone else on the Internet.)'], ['A recorded voice: "The number you have dialled has not been recognised. Please check and try again."'], ['Ring ring...', 'Someone you don\'t know: "Hello?"', 'You: "Sorry, wrong number!"', '(You hang up very quickly.)']])]));
      }, after);
    }
    function ring(n, then) { w.status.textContent = 'Ringing...'; for (let i = 0; i < n; i++) { [0, 0.6].forEach(o => setTimeout(() => { Sound.note(400, 0.4, 'sine'); Sound.note(450, 0.4, 'sine'); }, (i * 3 + o) * 1000)); } setTimeout(then, n * 3000 - 800); }
    function call([who, lines], hold) {
      busy = true;
      const b2 = h(`<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start">${mini(I.phone)}<div style="flex:1"><b>Active call: ${esc(who)}</b> <span class="pgf-tm">0:00</span><div class="field pgf-talk"></div></div></div><div class="row pg-dlgbtns"><button class="btn pgf-hang">Hang Up</button></div>`);
      const cw = A.win('Active Call', b2, { w: 380, icon: I.phone, noResize: true, noMax: true, onClose: () => { clearInterval(iv); busy = false; w.status.textContent = 'Call ended.'; if (hold) Sound.music.stop(); } });
      const talk = qs(b2, '.pgf-talk'); let i = 0, s = 0;
      const iv = setInterval(() => { s++; qs(b2, '.pgf-tm').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); if (s % 2 === 1 && i < lines.length) { const p = document.createElement('p'); p.textContent = lines[i++]; talk.appendChild(p); talk.scrollTop = 1e9; } }, 1000);
      tap(qs(b2, '.pgf-hang'), cw.close);
      w.status.textContent = 'Connected: ' + who;
      return cw;
    }
    function premium() {
      msg('JackNet Support', 'WARNING: This is a premium rate number. Calls cost 50p per minute (more from mobiles).\n\nDid you ask permission from the person who pays the phone bill?', 'q', [['Yes, I asked', () => {
        secret('premium');
        ring(1, () => { try { Sound.music.play('jamp_gubbinz_lullaby'); } catch (e) {} call(['JackNet Support', ['Recorded voice: "Thank you for calling JackNet Support. Your call is important to us."', 'Recorded voice: "You are number 47 in the queue."', '(Hold music plays. It is quite good, actually.)', 'Recorded voice: "Have you tried turning it off and on again?"', 'Recorded voice: "You are number 46 in the queue."', '(You decide to hang up before the phone bill arrives.)']], true); });
      }], ['No', () => msg('Phone Dialer', 'Good call. Literally. Mom would go mad when the bill came.', 'info')]]);
    }
    function speakingClock() {
      secret('speakclock');
      const d = new Date(), t = d.getHours() % 12 || 12, m = d.getMinutes(), s = Math.ceil((d.getSeconds() + 5) / 10) * 10 % 60;
      const line = `At the third stroke, it will be ${t}:${String(m + (s === 0 ? 1 : 0)).padStart(2, '0')}${s ? ' and ' + s + ' seconds' : ' precisely'}.`;
      const cw = call(['Speaking Clock', [line, 'BEEP... BEEP... BEEP...', 'At the third stroke, it will be... (it goes on like this forever. It\'s quite relaxing.)']]);
      setTimeout(() => { if (cw.closed) return; [0, 1, 2].forEach(k => setTimeout(() => Sound.note(1000, 0.12, 'sine'), k * 1000)); }, 3200);
      try { if (Sound.on && window.speechSynthesis) { const u = new SpeechSynthesisUtterance(line); u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); } } catch (e) {}
    }
    A.menubar(w, [
      ['File', [{ label: 'Exit', act: () => w.close() }]],
      ['Edit', [{ label: 'Cut', act: () => { Clip.set(num.value); num.value = ''; } }, { label: 'Copy', act: () => Clip.set(num.value) }, { label: 'Paste', act: () => Clip.read().then(t => { num.value += clean(t) ? t : ''; }) }, '-', { label: 'Speed Dial...', act: () => { const i = sp.findIndex(x => !x[1]); programSpeed(i >= 0 ? i : 7); } }]],
      ['Tools', [{ label: 'Connect Using...', act: () => msg('Connect Using', 'Line: JackNet 56K Voice Modem\nAddress: Line 1 (the one in the hall)\n\n[x] Use Phone Dialer to handle voice call requests from other programs', 'info') }, { label: 'Dialling Properties...', act: () => appletModems() }, '-', { label: 'Show Log', act: () => Desk.notepad('Call Log.txt', 'PHONE DIALER CALL LOG\n=====================\n\n' + (store.get('jhp_prog_calllog', []).map(([d, t, n]) => `${d}  ${t}  ${n}`).join('\n') || '(no calls yet)') + '\n') }]],
      ['Help', [{ label: 'Help Topics', act: () => Desk.notepad('Phone Dialer Help.txt', 'PHONE DIALER\n============\n\nType a number and click Dial, or press the keypad buttons.\nSpeed dial buttons ring people with one click. Click an (Empty)\none to set it up.\n\nYou need sound switched on (tray speaker) to hear the tones.\n\nUseful numbers (1999, UK):\n  123   the Speaking Clock\n  1471  who rang you last\n  192   Directory Enquiries\n  100   the Operator\n  999   EMERGENCIES ONLY\n\nFun fact: you can hear the number the modem dials when it\nconnects. If you could dial it, what would happen?\n') }, '-', { label: 'About Phone Dialer', act: () => msg('About Phone Dialer', 'Phone Dialer for JackOS 98\nVersion 4.10.1999\n\nTone dialling: yes. Pulse dialling: only for Nan.', 'info') }]],
    ]);
    dialerApi = { dialSpeed(k) { const i = k === 'jacknet' ? 2 : +k; if (sp[i] && sp[i][1]) { num.value = sp[i][1]; dial(sp[i][1], sp[i][0]); } } };
    if (arg) setTimeout(() => dialerApi && dialerApi.dialSpeed(arg), 300);
    return w;
  } });

  // ================================================================ SYSTEM INFORMATION
  const SI = {
    'System Information': () => [['JackOS 98', '4.10.1999'], ['IE', 'JackNet Explorer 5.0'], ['Uptime', () => { const s = Math.floor(performance.now() / 1000); return `0:${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }], ['Normal mode', ''], ['On "JACKS-PC" as "' + nick() + '"', ''], ['GenuineIntel Pentium(r) II Processor (Deschutes core, 0.25 micron)', ''], ['Clock speed', '350MHz (3.5 x 100MHz front side bus)'], ['L1 cache', '32KB (16KB data + 16KB instruction)'], ['L2 cache', '512KB on the cartridge, running at half the CPU speed (175MHz)'], ['Instructions', 'MMX (MultiMedia eXtensions!)'], ['Slot', 'Slot 1 (it\'s a big cartridge, like a games console cart)'], ['64MB RAM', 'PC100 SDRAM, 1 x 64MB DIMM (2 slots free, waiting for birthday money)'], ['88% system resources free', ''], ['Page file', 'C:\\JACKOS\\WIN386.SWP (112MB)'], ['Available space on drive C', '1.86GB of 5.98GB (FAT32)'], ['BIOS', 'JackBIOS v1.999 (Y2K: "probably")'], ['Bugs', '1 (in a lost cluster)']],
    'Hardware Resources': () => [['Select a category on the left to see the hardware resources being used.', '']],
    'Conflicts/Sharing': () => [['IRQ 9', 'ACPI IRQ Holder for PCI IRQ Steering'], ['IRQ 9', 'AGP 3D Accelerator (sharing nicely)'], ['IRQ 12', 'Bug Detector - CONFLICT (it bit the mouse)']],
    'DMA': () => [['Channel 1', 'JackBlaster 16 PnP'], ['Channel 2', 'Standard Floppy Disk Controller'], ['Channel 4', 'Direct memory access controller'], ['Channel 5', 'JackBlaster 16 PnP (16-bit)']],
    'Forced Hardware': () => [['None', 'No devices are forced. Gubbinz is not a device. Officially.']],
    'I/O': () => [['0000-000F', 'Direct memory access controller'], ['0020-0021', 'Programmable interrupt controller'], ['0040-0043', 'System timer'], ['0060', 'Standard 102-key UK keyboard'], ['0070-0071', 'System CMOS/real time clock'], ['00F0-00FF', 'Numeric data processor'], ['0170-0177', 'Secondary IDE controller'], ['01F0-01F7', 'Primary IDE controller'], ['0201', 'Gameport Joystick'], ['0220-022F', 'JackBlaster 16 PnP'], ['02F8-02FF', 'Communications Port (COM2) - modem'], ['0330-0331', 'MPU-401 Compatible'], ['0378-037A', 'Printer Port (LPT1)'], ['03F0-03F5', 'Standard Floppy Disk Controller'], ['03F8-03FF', 'Communications Port (COM1) - mouse'], ['0B00-0B0F', 'Bug Detector (unexplained)']],
    'IRQs': () => [['IRQ 0', 'System timer'], ['IRQ 1', 'Standard 102-key UK keyboard'], ['IRQ 2', 'Programmable interrupt controller'], ['IRQ 3', 'Communications Port (COM2): JackNet 56K Voice Modem'], ['IRQ 4', 'Communications Port (COM1): Serial Mouse'], ['IRQ 5', 'JackBlaster 16 PnP'], ['IRQ 6', 'Standard Floppy Disk Controller'], ['IRQ 7', 'Printer Port (LPT1)'], ['IRQ 8', 'System CMOS/real time clock'], ['IRQ 9', 'ACPI IRQ Holder for PCI IRQ Steering'], ['IRQ 10', 'Universal Serial Bus controller'], ['IRQ 11', 'AGP 3D Accelerator (8MB)'], ['IRQ 12', 'Bug Detector (Code 10)'], ['IRQ 13', 'Numeric data processor'], ['IRQ 14', 'Primary IDE controller (dual fifo)'], ['IRQ 15', 'Secondary IDE controller (dual fifo)']],
    'Memory': () => [['00000000-0009FFFF', 'System board (640KB "ought to be enough for anybody")'], ['000A0000-000BFFFF', 'AGP 3D Accelerator'], ['000F0000-000FFFFF', 'System board BIOS'], ['00100000-03FFFFFF', 'System board extension for PnP BIOS (the other 63MB)'], ['E0000000-E7FFFFFF', 'AGP 3D Accelerator frame buffer']],
    'Components': () => [['Select a component on the left to see it.', '']],
    'Multimedia': () => [['Audio', 'JackBlaster 16 PnP (16-bit stereo, 44.1kHz)'], ['MIDI', 'OPL3-style FM synth + JackAmp Chiptune Engine 2.0'], ['Joystick', 'Gameport Joystick'], ['Speakers', 'Two little beige ones with a volume knob']],
    'Audio Codecs': () => [['IMA ADPCM', 'OK'], ['Microsoft ADPCM', 'OK'], ['GSM 6.10', 'OK'], ['MPEG Layer-3', 'OK (MP3s are 4MB each! That\'s 3 floppies.)'], ['Robot Voice Codec', 'OK']],
    'Video Codecs': () => [['Cinepak', 'OK (the blocky one)'], ['Indeo 3.2', 'OK'], ['Indeo 5', 'OK'], ['Video 1', 'OK']],
    'CD-ROM': () => [['Drive', 'D:'], ['Description', 'JACKATAK 32X CD-ROM'], ['Media loaded', 'JACK ATTACK! Cover Disc 7'], ['Transfer rate', '4,800 KB/s (32 x 150 KB/s, on a good day)'], ['Data integrity', 'OK (one sticky fingerprint)']],
    'Display': () => [['Adapter', 'AGP 3D Accelerator (AGP 2x)'], ['Video RAM', '8MB SGRAM'], ['3D', 'Hardware triangles! Thousands of them!'], ['Resolution', '800 x 600 x 16 bit, 75 Hz'], ['Monitor', '14 inch Plug and Play CRT (weighs as much as Dave)']],
    'Input': () => [['Keyboard', 'Standard 102-key UK keyboard'], ['Pointing device', 'Standard Serial Mouse (2 buttons, 1 ball, lots of fluff)']],
    'Modem': () => [['Modem', 'JackNet 56K Voice Modem'], ['Standard', 'V.90 (56K download, 33.6K upload)'], ['Real speed', '49,333 bps (if nobody picks up the phone)'], ['Port', 'COM2, IRQ 3, 2F8'], ['UART', '16550A']],
    'Network': () => [['Adapter', 'Dial-Up Adapter'], ['Protocol', 'TCP/IP'], ['Client', 'Client for JackNet Networks'], ['Workgroup', 'JACKNET']],
    'Ports': () => [['COM1', 'Serial Mouse'], ['COM2', 'JackNet 56K Voice Modem'], ['LPT1', 'Epson Stylus Color 440 (out of cyan)'], ['USB', '2 ports, nothing plugged in. One day.']],
    'Storage': () => [['C:', 'GENERIC IDE DISK TYPE47, 6.4GB, 5400 RPM, Ultra DMA/33, FAT32'], ['A:', '3\u00bd inch 1.44MB floppy'], ['D:', '32X CD-ROM'], ['Zip drive', 'Not installed (on the Christmas list)']],
    'Printing': () => [['Printer', 'Epson Stylus Color 440'], ['Port', 'LPT1'], ['Status', 'Out of cyan'], ['Pages printed', '312 (mostly game cheats)']],
    'Problem Devices': () => [['Bug Detector', 'Code 10: Gubbinz ate the driver'], ['Unknown Device: GIZMO-1999', 'Code 28: driver not installed (it says beep boop)'], ['PCI Toaster', 'Code 22: disabled by Mom'], ['Y2K Compliance Chip', 'Code 31: not ready for 2000']],
    'USB': () => [['USB Root Hub', 'Working'], ['Devices', 'None. Nobody has anything USB yet.']],
    'History': () => [['14/02/99', 'Installed: Gubbinz Virtual Pet 1.2'], ['01/04/99', 'Installed: FREE Smileys!!! Toolbar (didn\'t ask for it)'], ['28/06/99', 'Installed: JackAmp 2.0 MIDI Edition'], ['13/08/99', 'Installed: Y2K Fix-o-Matic 1.0 (it did nothing)'], [d99(), 'Today. You are looking at this.']],
    'System': () => [['Motherboard', 'Intel 440BX chipset, 100MHz FSB'], ['Power supply', '250W (the fan is LOUD)'], ['Case', 'Beige mini tower with a Turbo button (does nothing)'], ['CMOS battery', 'CR2032 coin cell'], ['Stickers', '"Designed for JackOS 98", "Pentium II inside", one Pikachu']],
    'Software Environment': () => [['Select an item on the left.', '']],
    'Drivers': () => [['VMM32.VXD', 'Virtual Machine Manager'], ['SQUIG.VXD', 'Bug support (wriggling)'], ['JACKNET56.VXD', 'Modem driver'], ['VCACHE.VXD', 'Disk cache'], ['GROT.VXD', 'Gubbinz kernel-mode pet (do not disturb)']],
    '16-bit Modules Loaded': () => [['KRNL386.EXE', '4.10.1999'], ['GDI.EXE', '4.10.1999'], ['USER.EXE', '4.10.1999'], ['MMSYSTEM.DLL', '4.10.1999'], ['WINSOCK.DLL', '4.10.1999']],
    '32-bit Modules Loaded': () => [['KERNEL32.DLL', '4.10.1999'], ['USER32.DLL', '4.10.1999'], ['GDI32.DLL', '4.10.1999'], ['SHELL32.DLL', '4.72.1999'], ['JACKMATH.DLL', '1.0 (it can divide, but not by zero)'], ['DAVE.DLL', '0.1 beta (unreliable)']],
    'Running Tasks': () => [['KERNEL32.DLL', ''], ['MSGSRV32.EXE', ''], ['MPREXE.EXE', ''], ['mmtask.tsk', ''], ['EXPLORER.EXE', ''], ['SYSTRAY.EXE', ''], ['GUBBINZ.EXE', '(not responding, eating)'], ['IEXPLORE.EXE', 'JackNet Explorer'], ...qsa(document, '.appwin .tb .t').map(t => [t.textContent.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + '.EXE', t.textContent])],
    'Startup Programs': () => [['ScanRegistry', 'C:\\JACKOS\\scanregw.exe /autorun'], ['TaskMonitor', 'C:\\JACKOS\\taskmon.exe'], ['SystemTray', 'SysTray.Exe'], ['LoadPowerProfile', 'Rundll32.exe powrprof.dll,LoadCurrentPwrScheme'], ['GubbinzUpdater', 'C:\\Program Files\\Gubbinz\\notavirus.exe (hmm)'], ['FREE Toolbar Helper', 'C:\\JACKOS\\SYSTEM\\toolbarhelper.exe (installs toolbars)']],
    'System Hooks': () => [['SYSTRAY.EXE', 'Hooks: keyboard'], ['GUBBINZ.EXE', 'Hooks: everything. He is very nosy.']],
    'OLE Registration': () => [['INI File', 'C:\\JACKOS\\JACKOS.INI'], ['Registry', 'see Registry Editor (regedit) for the scary details']],
  };
  const SI_TREE = [['System Information', 0], ['Hardware Resources', 1], ['Conflicts/Sharing', 2], ['DMA', 2], ['Forced Hardware', 2], ['I/O', 2], ['IRQs', 2], ['Memory', 2], ['Components', 1], ['Multimedia', 2], ['Audio Codecs', 3], ['Video Codecs', 3], ['CD-ROM', 3], ['Display', 2], ['Input', 2], ['Modem', 2], ['Network', 2], ['Ports', 2], ['Storage', 2], ['Printing', 2], ['Problem Devices', 2], ['USB', 2], ['History', 2], ['System', 2], ['Software Environment', 1], ['Drivers', 2], ['16-bit Modules Loaded', 2], ['32-bit Modules Loaded', 2], ['Running Tasks', 2], ['Startup Programs', 2], ['System Hooks', 2], ['OLE Registration', 2]];
  function msconfig() {
    const st = store.get('jhp_prog_msconfig', {});
    const STARTUP = ['ScanRegistry', 'TaskMonitor', 'SystemTray', 'LoadPowerProfile', 'GubbinzUpdater', 'FREE Toolbar Helper', 'Y2K Panic Button'];
    return sheet('System Configuration Utility', [
      ['General', pg => { pg.innerHTML = `<div class="group"><span class="lg">Startup selection</span><label style="display:block"><input type="radio" name="pgimc" checked> Normal startup - load all device drivers and software</label><label style="display:block"><input type="radio" name="pgimc"> Diagnostic startup - interactively load device drivers and software</label><label style="display:block"><input type="radio" name="pgimc"> Selective startup</label></div><div class="row"><button class="btn pgi-ext">Extract File...</button><button class="btn pgi-adv">Advanced...</button></div>`; tap(qs(pg, '.pgi-ext'), () => msg('Extract File', 'Insert the JackOS 98 CD-ROM. (It\'s still in the drawer under the printer.)', 'info')); tap(qs(pg, '.pgi-adv'), () => msg('Advanced Troubleshooting Settings', '[ ] Disable System ROM Breakpoint\n[ ] Disable Virtual HD IRQ\n[ ] Disable Gubbinz (cannot be ticked)', 'info')); }],
      ['Config.sys', pg => { pg.innerHTML = '<pre class="field pgi-pre">DEVICE=C:\\JACKOS\\HIMEM.SYS\nDEVICE=C:\\JACKOS\\EMM386.EXE NOEMS\nDOS=HIGH,UMB\nFILES=40\nBUFFERS=30\nDEVICEHIGH=C:\\SQUIG\\SQUIG.SYS /WRIGGLE\nREM DEVICE=C:\\DAVE\\DAVE.SYS (broke everything)</pre>'; }],
      ['Autoexec.bat', pg => { pg.innerHTML = '<pre class="field pgi-pre">@ECHO OFF\nPROMPT $P$G\nSET PATH=C:\\JACKOS;C:\\JACKOS\\COMMAND;C:\\GAMES\nSET BLASTER=A220 I5 D1 H5 T6\nLH C:\\JACKOS\\COMMAND\\MSCDEX.EXE /D:JACKCD /L:D\nREM ECHO HELLO WORLD\nGUBBINZ /QUIET (he is never quiet)</pre>'; }],
      ['System.ini', pg => { pg.innerHTML = '<pre class="field pgi-pre">[boot]\nshell=Explorer.exe\nsystem.drv=system.drv\ndrivers=mmsystem.dll power.drv\n\n[386Enh]\ndevice=*squig\nMinSPs=16\n\n[drivers]\nwave=mmsndsys.dll\nmidi=jackamp.drv</pre>'; }],
      ['Jackos.ini', pg => { pg.innerHTML = '<pre class="field pgi-pre">[windows]\nload=\nrun=\nNullPort=None\n\n[Desktop]\nWallpaper=(None)\nTileWallpaper=1\n\n[Gubbinz]\nHungry=1\nAlways=1</pre>'; }],
      ['Startup', (pg, c) => { pg.innerHTML = `<p style="margin:0 0 4px">Selected items run when JackOS starts:</p><div class="field pgi-st">${STARTUP.map(n => `<label class="pgk-ci"><input type="checkbox" data-n="${esc(n)}" ${st[n] === false ? '' : 'checked'}><span>${esc(n)}</span></label>`).join('')}</div>`; qsa(pg, 'input').forEach(x => on(x, 'change', () => { st[x.dataset.n] = x.checked; c.dirty(); if (x.dataset.n === 'GubbinzUpdater' && !x.checked) toast('System Configuration', 'Gubbinz has ticked himself back on.'); })); c.onApply(() => { st.GubbinzUpdater = true; store.set('jhp_prog_msconfig', st); msg('System Settings Change', 'You must restart your computer before the new settings will take effect. (Gubbinz is still on, by the way.)', 'info'); }); }],
    ], { icon: I.sysinfo, w: 420 }).w;
  }
  function drWatson() {
    secret('drwatson');
    const b = h(`<div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start"><svg viewBox="0 0 32 32" width="40" height="40" style="flex:none"><circle cx="16" cy="14" r="9" fill="#f2c79a" stroke="#000"/><path d="M6 10c2-8 18-8 20 0z" fill="#6a4a2a" stroke="#000"/><circle cx="12" cy="14" r="3" fill="none" stroke="#000"/><path d="M15 14h2" stroke="#000"/><circle cx="20" cy="14" r="3" fill="#cfe8ff" stroke="#000"/><path d="M8 30c0-6 16-6 16 0" fill="#808080" stroke="#000"/></svg><div><b>Dr. Watson for JackOS 98</b><p>Dr. Watson has taken a snapshot of your system and made a diagnosis:</p><div class="field" style="padding:6px;max-height:160px;overflow:auto">"Elementary, my dear ${esc(nick())}.<br><br>Your computer is slow because: Gubbinz is asleep in the CPU fan, 14 toolbars are fighting over JackNet Explorer, and your hard disk has never been defragmented.<br><br>Prescription: run Disk Defragmenter, remove the toolbars, and give Gubbinz a biscuit."</div></div></div><div class="row pg-dlgbtns"><button class="btn">Close</button></div>`);
    const w = A.win('Dr. Watson', b, { w: 400, icon: I.sysinfo, noResize: true, noMax: true });
    tap(qs(b, '.btn'), w.close);
    return w;
  }
  function sfc() {
    const b = h(`<p style="margin:0 0 8px">System File Checker verifies the integrity of your system files.</p><div class="pgi-bar"></div><div class="small pgi-now">&nbsp;</div><div class="row pg-dlgbtns"><button class="btn">Close</button></div>`);
    const w = A.win('System File Checker', b, { w: 360, icon: I.sysinfo, noResize: true, noMax: true });
    const set = progBar(qs(b, '.pgi-bar')); let p = 0;
    tap(qs(b, '.btn'), w.close);
    const iv = setInterval(() => { if (w.closed) return clearInterval(iv); p += 0.03; set(p); qs(b, '.pgi-now').textContent = 'Checking C:\\JACKOS\\SYSTEM\\' + pick(['KERNEL32.DLL', 'USER32.DLL', 'SQUIG.VXD', 'GROT.VXD', 'DAVE.DLL', 'JACKMATH.DLL', 'COMCTL32.DLL']); if (p >= 1) { clearInterval(iv); qs(b, '.pgi-now').textContent = 'Done.'; msg('Finished', 'System File Checker has finished verifying your files.\n\nNo files were found to be corrupted. One file was found to be chewed (GROT.VXD). It still works.', 'info'); } }, 120);
  }
  A.register('msinfo32', { single: true, cmd: ['msinfo32', 'msinfo', 'sysinfo', 'winmsd'], open() {
    const b = h('<div class="pgi-tree field" tabindex="0"></div><div class="pgi-view field"></div>', 'pgi');
    const w = A.win('System Information', b, { w: 640, h: 420, icon: I.sysinfo, menubar: true, status: true, minW: 300, minH: 220 });
    let cur = 'System Information', adv = false;
    const shut = new Set(['Hardware Resources', 'Software Environment', 'Multimedia']);
    function renderTree() {
      const out = []; let skip = 99;
      SI_TREE.forEach(([n, lvl], i) => {
        if (lvl > skip) return; skip = 99;
        const hasKids = SI_TREE[i + 1] && SI_TREE[i + 1][1] > lvl;
        if (hasKids && shut.has(n)) skip = lvl;
        out.push(`<div class="pgr-k${n === cur ? ' sel' : ''}" data-n="${esc(n)}" style="padding-left:${lvl * 14 + 2}px"><span class="pgr-pm">${hasKids ? (shut.has(n) ? '+' : '&#8211;') : ''}</span>${mini(lvl === 0 ? I.sysinfo : hasKids ? A.ICON.folder : '<svg viewBox="0 0 32 32"><rect x="5" y="3" width="22" height="26" fill="#fff" stroke="#000"/><path d="M9 10h14M9 15h14M9 20h10" stroke="#000080" stroke-width="2"/></svg>', 16)}<span class="pgr-kn">${esc(n)}</span></div>`);
      });
      qs(b, '.pgi-tree').innerHTML = out.join('');
      qsa(b, '.pgi-tree .pgr-k').forEach(e => { tap(qs(e, '.pgr-pm'), ev => { ev.stopPropagation(); const n = e.dataset.n; if (shut.has(n)) shut.delete(n); else shut.add(n); renderTree(); }); tap(e, () => { cur = e.dataset.n; renderTree(); view(); }); });
    }
    function view() {
      const rows = (SI[cur] || (() => [['(no information)', '']]))();
      qs(b, '.pgi-view').innerHTML = `<table class="pgi-tab">${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(typeof v === 'function' ? v() : v)}</td></tr>`).join('')}${adv && cur === 'System Information' ? '<tr><td colspan="2"><hr></td></tr><tr><td>Bogomips</td><td>699.59 (that\'s a lot of bogos)</td></tr><tr><td>Floating point</td><td>FDIV bug: not present (phew)</td></tr><tr><td>Overclockable?</td><td>Dave says yes. Mom says no.</td></tr>' : ''}</table>`;
      w.status.textContent = 'For Help, press F1';
    }
    A.menubar(w, [
      ['File', [{ label: 'Open...', act: () => msg('Open', 'No .NFO files found. (Except Dave\'s, and that\'s his computer, and it\'s rubbish.)', 'info') }, { label: 'Save...', act: () => toast('System Information', 'Saved to C:\\My Documents\\sysinfo.nfo') }, { label: 'Export...', act: () => Desk.notepad('sysinfo.txt', SI_TREE.map(([n]) => `[${n}]\n` + (SI[n] ? SI[n]().map(([k, v]) => `${k}\t${typeof v === 'function' ? v() : v}`).join('\n') : '')).join('\n\n')) }, '-', { label: 'Print...', act: () => msg('Print', 'Out of cyan.', 'warn') }, '-', { label: 'Exit', act: () => w.close() }]],
      ['Edit', [{ label: 'Copy', key: 'Ctrl+C', act: () => { Clip.set(qs(b, '.pgi-view').innerText); toast('System Information', 'Copied.'); } }, { label: 'Select All', act: () => { const r = document.createRange(); r.selectNodeContents(qs(b, '.pgi-view')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } }, { label: 'Find...', act: () => Desk.ask('Find', 'Find what:', '', 30, q => { q = String(q || '').toLowerCase(); const hit = SI_TREE.find(([n]) => n.toLowerCase().includes(q) || (SI[n] && SI[n]().some(r => (r[0] + ' ' + (typeof r[1] === 'function' ? '' : r[1])).toLowerCase().includes(q)))); if (hit) { cur = hit[0]; shut.clear(); renderTree(); view(); } else msg('Find', 'Cannot find "' + q + '".', 'info'); }) }]],
      ['View', () => [{ label: 'Current System Information', rad: true }, { label: 'System History', act: () => { cur = 'History'; shut.clear(); renderTree(); view(); } }, '-', { label: 'Basic', rad: !adv, act: () => { adv = false; view(); } }, { label: 'Advanced', rad: adv, act: () => { adv = true; view(); } }, '-', { label: 'Refresh', key: 'F5', act: view }]],
      ['Tools', [{ label: 'JackOS Report Tool', act: () => msg('JackOS Report Tool', 'Describe the problem: "It\'s slow and there\'s a little green fella in it."\n\nReport sent to: nobody. (There is no Internet connection right now. Mom is on the phone.)', 'info') }, { label: 'Update Wizard Uninstall', act: () => msg('Update Wizard Uninstall', 'There are no updates to uninstall. There are no updates at all. It\'s 1999 forever.', 'info') }, { label: 'System File Checker', act: sfc }, { label: 'Signature Verification Tool', act: () => msg('Signature Verification', 'Searching for unsigned files...\n\nFound 3 unsigned files: SQUIG.VXD, DAVE.DLL, GROT.VXD. Gubbinz has signed them with crayon.', 'warn') }, { label: 'Registry Checker', act: () => msg('Registry Checker', 'JackOS scanned the system registry and found no errors. The registry has already been backed up today. Would you like to back it up again?', 'q', [['Yes', () => toast('Registry Checker', 'Backed up. Twice now.')], ['No'], ['Open Registry Editor', () => A.open('regedit')]]) }, { label: 'Automatic Skip Driver Agent', act: () => msg('Automatic Skip Driver Agent', 'No problem drivers were found that need skipping. (The Bug Detector driver was skipped by Gubbinz, who ate it.)', 'info') }, { label: 'Dr Watson', act: drWatson }, { label: 'System Configuration Utility', act: msconfig }, { label: 'ScanDisk', act: () => A.open('scandisk') }, { label: 'Version Conflict Manager', act: () => msg('Version Conflict Manager', 'No version conflicts. Everything is version 4.10.1999. Even the toaster.', 'info') }, '-', { label: 'Disk Defragmenter', act: () => A.open('defrag') }, { label: 'Disk Cleanup', act: () => msg('Disk Cleanup for (C:)', 'You can use Disk Cleanup to free up to 14.2 MB of disk space on drive C.\n\nTemporary Internet Files: 12.1 MB\nRecycle Bin: 2.1 MB (Dave\'s old save games)\nTemporary files: 0 KB\n\nNothing was deleted because you\'re only looking.', 'info') }]],
      ['Help', [{ label: 'About System Information', act: () => msg('About System Information', `System Information for JackOS 98\nVersion 4.10.1999\n\nLicensed to ${nick()}.\n\nKnows everything about this computer. Tells nobody. Except you.`, 'info') }]],
    ]);
    on(w.el, 'keydown', e => { if (e.key === 'F5') { e.preventDefault(); view(); } });
    renderTree(); view();
    return w;
  } });
  A.cmd(['msconfig'], msconfig); A.cmd(['drwatson', 'drwtsn32'], drWatson); A.cmd(['sfc'], sfc);
  A.cmd(['scanreg', 'scanregw'], () => msg('Registry Checker', 'JackOS scanned the system registry and found no errors. The registry has already been backed up today.', 'info'));

  // ================================================================ CLIPBOARD VIEWER
  A.register('clipbrd', { single: true, cmd: ['clipbrd', 'clipboard', 'clipbook'], open() {
    const b = h(`<div class="pgb-bar row"><button class="btn pgb-p" title="Look at the real clipboard">Read Clipboard</button><span class="small">or press Ctrl+V in this window</span></div><div class="field pgb-view" tabindex="0"></div>`, 'pgb');
    const w = A.win('Clipboard Viewer', b, { w: 420, h: 300, icon: I.clip, menubar: true, status: true, minW: 240, minH: 160, onClose: () => { Clip.subs = Clip.subs.filter(f => f !== render); } });
    const view = qs(b, '.pgb-view');
    let mode = 'Text';
    function render() {
      const t = Clip.text;
      view.textContent = t ? (mode === 'OEM Text' ? t.toUpperCase() : mode === 'Hex' ? [...t.slice(0, 600)].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ') : t) : '';
      view.classList.toggle('empty', !t);
      if (!t) view.textContent = '(The Clipboard is empty. Copy some text anywhere on the computer - Ctrl+C - and it shows up here.)';
      w.status.textContent = t ? `${t.length} character${t.length === 1 ? '' : 's'} (${mode})` : 'Empty';
    }
    Clip.subs.push(render);
    on(w.el, 'paste', e => { const t = e.clipboardData && e.clipboardData.getData('text'); if (t != null) { e.preventDefault(); Clip.text = t; Clip.emit(); } });
    tap(qs(b, '.pgb-p'), () => Clip.read().then(() => { render(); if (!Clip.text) toast('Clipboard Viewer', 'JackOS is not allowed to peek at the real Clipboard here. Press Ctrl+V in this window instead.', 5000); }));
    A.menubar(w, [
      ['File', [{ label: 'Open...', act: () => msg('Open', 'There are no .CLP files. Nobody has ever saved one, in the history of computers.', 'info') }, { label: 'Save As...', act: () => { if (!Clip.text) return toast('Clipboard Viewer', 'Nothing to save.'); Desk.notepad('CLIPBRD.CLP', Clip.text); } }, '-', { label: 'Exit', act: () => w.close() }]],
      ['Edit', [{ label: 'Delete', key: 'Del', act: () => msg('Clear Clipboard', 'Clear the contents of the Clipboard?', 'q', [['Yes', () => { Clip.set(''); }], ['No']]) }]],
      ['Display', () => ['Auto', 'Text', 'OEM Text', 'Hex'].map(m => ({ label: m, rad: mode === m || (m === 'Auto' && mode === 'Text'), act: () => { mode = m === 'Auto' ? 'Text' : m; render(); } }))],
      ['Help', [{ label: 'About Clipboard Viewer', act: () => msg('About Clipboard Viewer', 'Clipboard Viewer for JackOS 98\n\nShows what you last copied. It\'s like a window into the computer\'s short-term memory, which is about as good as a goldfish\'s.', 'info') }]],
    ]);
    on(w.el, 'keydown', e => { if (e.key === 'Delete' && !e.target.closest('input')) Clip.set(''); });
    render();
    return w;
  } });

  // ================================================================ CHARACTER MAP
  const CP1252 = { 128: 8364, 130: 8218, 131: 402, 132: 8222, 133: 8230, 134: 8224, 135: 8225, 136: 710, 137: 8240, 138: 352, 139: 8249, 140: 338, 142: 381, 145: 8216, 146: 8217, 147: 8220, 148: 8221, 149: 8226, 150: 8211, 151: 8212, 152: 732, 153: 8482, 154: 353, 155: 8250, 156: 339, 158: 382, 159: 376 };
  const cmChar = c => c === 127 || (c > 127 && c < 160 && !CP1252[c]) ? ' ' : String.fromCharCode(CP1252[c] || c);
  A.register('charmap', { single: true, cmd: ['charmap', 'character map'], open() {
    const b = h(`<div class="row pgm-top"><label>Font: <select class="pgm-font">${allFonts().filter(f => !/Squig|Blobbit|Jack/.test(f[0])).map(f => `<option value="${esc(f[1])}">${esc(f[0])}</option>`).join('')}</select></label><label style="flex:1;min-width:150px;display:flex;gap:4px;align-items:center">Characters to copy: <input type="text" class="pgm-out" style="flex:1;min-width:0"></label><button class="btn" data-m="close">Close</button></div>
      <div class="row pgm-top" style="justify-content:flex-end"><button class="btn" data-m="sel">Select</button><button class="btn" data-m="copy">Copy</button></div>
      <div class="pgm-grid field"></div><div class="pgm-zoom" hidden></div>`, 'pgm');
    const w = A.win('Character Map', b, { w: 500, icon: I.charmap, status: true, noResize: true, noMax: true });
    const grid = qs(b, '.pgm-grid'), out = qs(b, '.pgm-out'), zoom = qs(b, '.pgm-zoom');
    let sel = 65;
    grid.innerHTML = Array.from({ length: 224 }, (_, i) => i + 32).map(c => `<span data-c="${c}">${esc(cmChar(c))}</span>`).join('');
    const font = () => qs(b, '.pgm-font').value;
    const applyFont = () => { grid.style.fontFamily = font(); zoom.style.fontFamily = font(); out.style.fontFamily = font(); };
    applyFont(); on(qs(b, '.pgm-font'), 'change', applyFont);
    function choose(c) { sel = c; qsa(grid, 'span').forEach(s => s.classList.toggle('sel', +s.dataset.c === c)); w.status.textContent = c === 32 ? 'Keystroke: Spacebar' : c < 128 ? `Keystroke: ${cmChar(c)}` : `Keystroke: Alt+0${c}`; }
    function add(c) { out.value += cmChar(c); check(); }
    function check() { if (/squig|blobbit/i.test(out.value)) { secret('charsquig'); toast('Character Map', /blobbit/i.test(out.value) ? 'B-L-O-B-B-I-T! You spelt it! Boing boing!' : 'S-Q-U-I-G! You spelt it! Very Warhammer.'); } }
    qsa(grid, 'span').forEach(s => {
      on(s, 'pointerdown', e => { const c = +s.dataset.c; choose(c); zoom.textContent = cmChar(c); zoom.hidden = false; const r = s.getBoundingClientRect(), br = b.getBoundingClientRect(); zoom.style.left = clamp(r.left - br.left - 12, 0, br.width - 44) + 'px'; zoom.style.top = (r.top - br.top - 40) + 'px'; });
      dbl(s, () => add(+s.dataset.c));
    });
    on(document, 'pointerup', () => { zoom.hidden = true; });
    on(out, 'input', check);
    tap(qs(b, '[data-m=sel]'), () => add(sel));
    tap(qs(b, '[data-m=copy]'), () => { if (!out.value) return; Clip.set(out.value); toast('Character Map', `Copied "${out.value.slice(0, 30)}" to the Clipboard.`, 2500); });
    tap(qs(b, '[data-m=close]'), w.close);
    on(w.el, 'keydown', e => { if (e.target === out) return; const k = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 32, ArrowUp: -32 }[e.key]; if (k) { e.preventDefault(); choose(clamp(sel + k, 32, 255)); } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(sel); } });
    w.el.tabIndex = -1; choose(65);
    return w;
  } });

  // ================================================================ Start menu, Run commands, files, pages
  [[['Accessories', 'Calculator'], 'calc', I.calc], [['Accessories', 'Paint'], 'mspaint', I.paint],
    [['Accessories', 'Communications', 'Phone Dialer'], 'dialer', I.phone],
    [['Accessories', 'Entertainment', 'JackAmp'], 'jackamp', I.amp],
    [['Accessories', 'System Tools', 'Character Map'], 'charmap', I.charmap], [['Accessories', 'System Tools', 'Clipboard Viewer'], 'clipbrd', I.clip],
    [['Accessories', 'System Tools', 'Disk Defragmenter'], 'defrag', I.defrag], [['Accessories', 'System Tools', 'ScanDisk'], 'scandisk', I.scandisk],
    [['Accessories', 'System Tools', 'System Information'], 'msinfo32', I.sysinfo], [['Accessories', 'System Tools', 'Registry Editor'], 'regedit', I.regedit],
    [['Accessories', 'System Tools', 'Control Panel'], 'control', I.control],
    [['JackAmp', 'JackAmp'], 'jackamp', I.amp],
  ].forEach(([p, id, ic]) => A.addProgram(p, id, ic));
  A.addProgram(['JackAmp', 'JackAmp on the Web'], () => { $('browser').classList.remove('min'); IE.navigate('jackamp'); }, A.ICON.app);
  A.addProgram(['JackAmp', 'Uninstall JackAmp'], () => window.Setup ? Setup.uninstall('jackamp') : msg('JackAmp Uninstaller', 'JackAmp loves you. Uninstall cancelled.', 'q'), A.ICON.app);
  A.addProgram(['JackAmp', 'Read Me'], () => Desk.notepad('JackAmp readme.txt', JAMP_README), A.ICON.txt);
  A.desktopIcon('JackAmp', mini(I.amp), () => A.open('jackamp'));

  const JAMP_README = `JACKAMP 2.0 (MIDI EDITION)
==========================

The best MIDI player in the world. Made by Jack. In his bedroom.

BUTTONS
  |<<  >  ||  []  >>|   previous, play, pause, stop, next
  ^                      open a file from My Music
  SHUFFLE / repeat       you know what these do
  EQ / PL                show the equaliser and playlist

Click the little visualiser to change it (spectrum, oscilloscope, off).
Click the time to see how much is left.
Double-click a song in the playlist to play it.

All songs written by Jack on the family PC. They are chiptunes,
which means they sound like a computer game. On purpose.

The volume slider is for show (use the knob on your speakers).
The EQ is ALSO for show. Most people's EQ is for show.

Hidden track? There might be one. JackAmp doesn't like being poked.
`;
  const exe = (name, app, size, arg) => ({ name, type: 'exe', app, arg, size: size || '96 KB', date: '11/05/98' });
  [['C:/JACKOS', exe('CALC.EXE', 'calc', '92 KB')], ['C:/JACKOS', exe('REGEDIT.EXE', 'regedit', '120 KB')], ['C:/JACKOS', exe('DEFRAG.EXE', 'defrag', '216 KB')], ['C:/JACKOS', exe('SCANDSKW.EXE', 'scandisk', '240 KB')],
    ['C:/JACKOS', exe('DIALER.EXE', 'dialer', '60 KB')], ['C:/JACKOS', exe('CHARMAP.EXE', 'charmap', '16 KB')], ['C:/JACKOS', exe('CLIPBRD.EXE', 'clipbrd', '18 KB')], ['C:/JACKOS', exe('CONTROL.EXE', 'control', '2 KB')],
    ['C:/Program Files/Accessories', exe('MSPAINT.EXE', 'mspaint', '338 KB')], ['C:/Program Files/JackAmp', exe('JACKAMP.EXE', 'jackamp', '1,999 KB')],
    ['C:/Program Files/Common Files/JackOS Shared/MSInfo', exe('MSINFO32.EXE', 'msinfo32', '20 KB')],
  ].forEach(([p, n]) => A.fs.add(p, n));
  A.fs.add('C:/Program Files/JackAmp', { name: 'readme.txt', type: 'txt', text: JAMP_README, size: '2 KB', date: '28/06/99' });
  A.fs.add('C:/Program Files/JackAmp/Skins', { name: 'how_to_make_skins.txt', type: 'txt', size: '1 KB', date: '28/06/99', text: 'HOW TO MAKE A JACKAMP SKIN\n\n1. Open Paint.\n2. Draw a really cool JackAmp.\n3. Realise there is no way to load it.\n4. Use the Base skin like everyone else.\n\n(Skins are coming in JackAmp 3.0. Release date: when Jack gets round to it.)\n' });
  A.fs.add('C:/', { name: 'SCANDISK.LOG', type: 'txt', size: '1 KB', date: d99(), text: 'Microsoft... er, JackOS ScanDisk\n\nScanDisk checked drive C for problems, with the following results:\n\nScanDisk did not find any problems with the directory structure.\nScanDisk did not find any problems with the file allocation table.\nScanDisk found a bad sector (sticky) and marked it.\nScanDisk found Gubbinz asleep in cluster 1999. ScanDisk let him sleep.\n\nLast thorough scan: never. Do one! (Start > Programs > Accessories > System Tools)\n' });
  const music = A.fs.dir('C:/My Documents/My Music');
  [...TRACKS, THEME].forEach(t => { if (!music.kids.some(k => k.name === t.file)) music.kids.push({ name: t.file, type: 'mid', track: t.id, size: Math.round((t.L ? t.L.length : 64) * 9 / 100 + 1) + ' KB', date: '28/06/99' }); });
  A.fs.add('C:/My Documents/My Music', { name: 'mixtape.m3u', type: 'txt', size: '1 KB', date: '28/06/99', text: '#EXTM3U\n' + [...TRACKS, THEME].map(t => `#EXTINF:${Math.round(t.len || 30)},Jack - ${t.title}\n${t.file}`).join('\n') + '\n' });
  premade(); syncPicFiles();
  if (window.IE && IE.addPage) {
    IE.addPage('jackamp', 'JackAmp - the best MIDI player in the world', () => `<div class="secretpage pg-page"><h1 class="pg-ph">${mini(I.amp, 48)} JackAmp 2.0</h1><p><b>It really whips the competition!</b></p><p>JackAmp is the MIDI player Jack wrote for his PC. It has a spectrum analyser, a playlist, an equaliser (for show) and ${TRACKS.length} original songs.</p><ul>${TRACKS.map(t => `<li>${esc(t.file)} - ${esc(t.title)}</li>`).join('')}</ul><p><b>DOWNLOAD:</b> jackamp20.exe (1,999 KB). <i>Estimated time on a 56K modem: 6 minutes. On a 28.8: go and make a sandwich.</i></p><p>${window.Setup && !Setup.has('jackamp') ? 'Not on this computer yet: click <b>Download now!</b> at the top of the page.' : 'Already installed on this computer: <b>Start &gt; Programs &gt; JackAmp</b>.'}</p><p class="small">Skins are coming soon. Probably. This page is best viewed in JackNet Explorer at 800 x 600.</p></div>`);
    IE.addPage('hklm', 'HKEY_LOCAL_MACHINE', () => `<div class="secretpage pg-page" style="background:#000;color:#0f0;font-family:Courier New,monospace;padding:16px"><h1 style="font-size:20px">HKEY_LOCAL_MACHINE\\SOFTWARE\\JackOS\\DoNotEdit</h1><p>You broke the pinky swear AND you typed it into the address bar. Respect.</p><p>Things the registry knows that you don't:</p><ul><li>RedOnesGoFaster = 1 (it's true, it's science)</li><li>There is a value that crashes the computer on purpose. Its name is very honest.</li><li>Mom's BedTime cannot be changed. Mom's BedTime has never been changed. Mom's BedTime is eternal.</li><li>Gubbinz's hunger can be set to 255. Do not do this near your mouse cable.</li><li>HKEY_CURRENT_USER\\Software\\JackOS\\Cheats has a Konami value.</li><li>The joystick in Control Panel can be calibrated. It will drift again by Tuesday.</li></ul><p>&gt; _</p></div>`);
  }
})();

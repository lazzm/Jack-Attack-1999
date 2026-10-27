/* apps-office: the JackOS 98 "office" pack. WordPad, Write, JackCalc (spreadsheet), Cardfile, Address Book, HyperTerminal
 * (with four fake BBSes), Calendar, Clock, Magnifier, Imaging, Object Packager, Program Manager, File Manager, Reversi,
 * Fax Cover Page Editor and JackMeeting. This file is the always-loaded part: the shared kit, icons, secrets, Start menu,
 * Run commands, file openers and the files on C:. The programs themselves live in js/office-*.js and load on first use. */
(function () {
  'use strict';
  if (!window.Apps || !window.Desk) return;
  const A = window.Apps, esc = A.esc, store = A.store;
  const K = window.OfficeKit = { A, esc, store, apps: {} };

  // ================================================================ little helpers
  const h = (html, cls, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const qs = (el, s) => el.querySelector(s), qsa = (el, s) => [...el.querySelectorAll(s)];
  const on = (el, ev, fn, o) => el.addEventListener(ev, fn, o);
  const tap = (el, fn) => el && el.addEventListener('click', fn);
  const touchy = () => matchMedia('(hover:none)').matches;
  const dbl = (el, fn) => { let last = 0; on(el, 'click', ev => { const now = Date.now(); if (now - last < 450 || touchy()) { last = 0; fn(ev); } else last = now; }); };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pad2 = n => String(n).padStart(2, '0');
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const msg = (t, x, i, b) => Desk.msgbox(t, x, i || 'info', b);
  const toast = (t, x, ms) => Desk.toast(t, x, ms);
  const today = () => (Desk.today99 ? Desk.today99() : { m: 1, d: 1, md: 101, date: new Date(1999, 0, 1) });
  const d99 = () => { const t = today(); return pad2(t.d) + '/' + pad2(t.m) + '/99'; };
  const mdOfDate = s => { const m = /^(\d\d)\/(\d\d)\/(\d\d)$/.exec(s || ''); return !m ? 0 : m[3] === '99' ? +m[2] * 100 + +m[1] : 0; };
  const happened = s => mdOfDate(s) <= today().md;
  const nick = () => (window.Net && Net.me && Net.me.nick) || 'Jack';
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const ext = name => ((/\.([a-z0-9]+)$/i.exec(name || '') || [])[1] || '').toLowerCase();
  const kb = n => Math.max(1, Math.ceil(n / 1024)) + ' KB';
  const nowTime = (secs) => { const d = new Date(); return d.getHours() + ':' + pad2(d.getMinutes()) + (secs ? ':' + pad2(d.getSeconds()) : ''); };
  Object.assign(K, { h, qs, qsa, on, tap, touchy, dbl, pick, clamp, rnd, pad2, sfx, msg, toast, today, d99, happened, nick, DAYS, MONTHS, ext, kb, nowTime });

  // ================================================================ icons: hand-drawn on a 16x16 grid
  const S16 = b => `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">${b}</svg>`;
  const SV = b => `<svg viewBox="0 0 16 16">${b}</svg>`;
  const PAGE = '<path d="M2.5 1.5h8l3 3v10h-11z" fill="#fff" stroke="#000"/><path d="M10.5 1.5v3h3" fill="#c0c0c0" stroke="#000"/>';
  const I = K.I = {
    wordpad: SV(PAGE + '<path d="M4 6h5M4 8h6M4 10h6M4 12h4" stroke="#000080"/><path d="M8.5 13.5l.8-2.6 4.6-4.6 1.8 1.8-4.6 4.6z" fill="#ffd400" stroke="#000" stroke-width=".6"/><path d="M8.5 13.5l.8-2.6 1.8 1.8z" fill="#000"/>'),
    write: SV('<rect x="2.5" y="1.5" width="10" height="13" fill="#fff" stroke="#000"/><path d="M4 4h7M4 6h7M4 8h4" stroke="#808080"/><path d="M8 15l1.2-4.8 3.6-3.6 2 2-3.6 3.6z" fill="#000080" stroke="#000" stroke-width=".5"/><path d="M9.6 12.6l1.6-1.6" stroke="#fff" stroke-width=".6"/>'),
    calc: S16('<rect x="1.5" y="1.5" width="13" height="12" fill="#fff" stroke="#000"/><rect x="2" y="2" width="12" height="2" fill="#008000"/><path d="M1.5 4.5h13M1.5 7.5h13M1.5 10.5h13M5.5 2v11.5M10.5 2v11.5" stroke="#a0a0a0"/><rect x="6" y="9" width="2" height="5" fill="#e10600"/><rect x="9" y="6" width="2" height="8" fill="#0028c8"/><rect x="12" y="8" width="2" height="6" fill="#ffd400"/><path d="M5.5 14.5h9" stroke="#000"/>'),
    cardfile: S16('<rect x="5.5" y="1.5" width="10" height="7" fill="#fff" stroke="#000"/><rect x="3.5" y="3.5" width="10" height="7" fill="#fff" stroke="#000"/><rect x="0.5" y="5.5" width="11" height="9" fill="#fff" stroke="#000"/><path d="M0.5 7.5h11" stroke="#e10600"/><path d="M2 10h7M2 12h5" stroke="#000080"/><path d="M5 2.5h5M7 4.5h4" stroke="#808080"/>'),
    abook: S16('<rect x="2.5" y="0.5" width="11" height="15" fill="#a02020" stroke="#000"/><rect x="4" y="2" width="8" height="12" fill="#fff"/><rect x="7" y="4" width="2" height="2" fill="#c8956a"/><rect x="6" y="4" width="4" height="1" fill="#4a2a0a"/><rect x="5" y="7" width="6" height="3" fill="#2a7ad8"/><path d="M5 12h6" stroke="#000080"/><path d="M1 3h3M1 6h3M1 9h3M1 12h3" stroke="#000"/>'),
    hyper: S16('<rect x="5.5" y="0.5" width="10" height="8" fill="#c0c0c0" stroke="#000"/><rect x="7" y="2" width="7" height="5" fill="#000"/><path d="M8 3.5h2M8 5.5h4" stroke="#0f0"/><rect x="8" y="9" width="5" height="1" fill="#808080"/><path d="M0.5 12.5c0-2 2-3 4.5-3s4.5 1 4.5 3v1h-2.5v-1.5h-4v1.5h-2.5z" fill="#e10600" stroke="#000"/><path d="M1.5 15.5l1-2h5l1 2z" fill="#a00000" stroke="#000"/>'),
    cal: S16('<rect x="1.5" y="2.5" width="13" height="12" fill="#fff" stroke="#000"/><rect x="2" y="3" width="12" height="3" fill="#e10600"/><rect x="4" y="1" width="1" height="3" fill="#000"/><rect x="11" y="1" width="1" height="3" fill="#000"/><g fill="#000080"><rect x="3" y="7" width="2" height="2"/><rect x="7" y="7" width="2" height="2"/><rect x="11" y="7" width="2" height="2"/><rect x="3" y="11" width="2" height="2"/><rect x="7" y="11" width="2" height="2"/></g><rect x="11" y="11" width="2" height="2" fill="#e10600"/>'),
    clock: SV('<circle cx="8" cy="8" r="7" fill="#008080" stroke="#000"/><circle cx="8" cy="8" r="5.6" fill="#fff"/><g fill="#000"><rect x="7.5" y="2.8" width="1" height="1.2"/><rect x="7.5" y="12" width="1" height="1.2"/><rect x="2.8" y="7.5" width="1.2" height="1"/><rect x="12" y="7.5" width="1.2" height="1"/></g><path d="M8 8V4.6M8 8l2.6 1.4" stroke="#000" stroke-width="1.2"/>'),
    magnify: SV('<circle cx="6.5" cy="6.5" r="4.6" fill="#cfe8ff" stroke="#000" stroke-width="1.4"/><path d="M10 10l4.6 4.6" stroke="#7a4a00" stroke-width="2.6"/><path d="M4.2 5.4a2.6 2.6 0 0 1 2-2" stroke="#fff" fill="none" stroke-width="1.2"/>'),
    imaging: S16('<rect x="0.5" y="1.5" width="13" height="10" fill="#fff" stroke="#000"/><path d="M1 11l4-5 3 3 2-2 3 4z" fill="#2a9a2a"/><rect x="9" y="3" width="2" height="2" fill="#ffd400"/><rect x="8.5" y="8.5" width="7" height="7" fill="#ffff80" stroke="#000"/><path d="M10 11h4M10 13h3" stroke="#808080"/>'),
    packager: SV('<path d="M1.5 5.5l6.5-3 6.5 3v7l-6.5 3-6.5-3z" fill="#c8956a" stroke="#000"/><path d="M1.5 5.5l6.5 3 6.5-3M8 8.5v7" stroke="#000" fill="none"/><path d="M4.7 4l6.6 3.1v2.4" stroke="#fff4c0" stroke-width="1.4" fill="none"/>'),
    progman: S16('<rect x="0.5" y="0.5" width="15" height="14" fill="#fff" stroke="#000"/><rect x="1" y="1" width="14" height="3" fill="#000080"/><rect x="1" y="1" width="3" height="3" fill="#c0c0c0"/><rect x="2" y="6" width="4" height="3" fill="#e10600" stroke="#000"/><rect x="9" y="6" width="4" height="3" fill="#ffd400" stroke="#000"/><rect x="2" y="10" width="4" height="3" fill="#008000" stroke="#000"/><rect x="9" y="10" width="4" height="3" fill="#2a7ad8" stroke="#000"/>'),
    winfile: S16('<rect x="2.5" y="0.5" width="11" height="15" fill="#c8a040" stroke="#000"/><rect x="4" y="2" width="8" height="6" fill="#f2d16b" stroke="#7a5a00"/><rect x="4" y="9" width="8" height="5" fill="#f2d16b" stroke="#7a5a00"/><rect x="7" y="4" width="2" height="1" fill="#000"/><rect x="7" y="11" width="2" height="1" fill="#000"/><rect x="5" y="1" width="5" height="2" fill="#fff" stroke="#000"/>'),
    reversi: S16('<rect x="0.5" y="0.5" width="15" height="15" fill="#008000" stroke="#000"/><path d="M8 1v14M1 8h14" stroke="#004000"/><circle cx="4.5" cy="4.5" r="2.6" fill="#fff" stroke="#000"/><circle cx="11.5" cy="11.5" r="2.6" fill="#fff" stroke="#000"/><circle cx="11.5" cy="4.5" r="2.6" fill="#000"/><circle cx="4.5" cy="11.5" r="2.6" fill="#000"/>').replace(' shape-rendering="crispEdges"', ''),
    fax: S16('<rect x="0.5" y="7.5" width="15" height="7" fill="#c0c0c0" stroke="#000"/><rect x="4.5" y="1.5" width="7" height="7" fill="#fff" stroke="#000"/><path d="M6 3.5h4M6 5.5h4" stroke="#000080"/><rect x="2" y="10" width="5" height="2" fill="#000"/><g fill="#404040"><rect x="10" y="9" width="1" height="1"/><rect x="12" y="9" width="1" height="1"/><rect x="10" y="11" width="1" height="1"/><rect x="12" y="11" width="1" height="1"/><rect x="10" y="13" width="1" height="1"/><rect x="12" y="13" width="1" height="1"/></g>'),
    meeting: S16('<rect x="0.5" y="0.5" width="15" height="11" fill="#c0c0c0" stroke="#000"/><rect x="2" y="2" width="12" height="8" fill="#2a5ad8"/><rect x="4" y="3" width="2" height="2" fill="#f2c79a"/><rect x="10" y="3" width="2" height="2" fill="#f2c79a"/><rect x="3" y="6" width="4" height="4" fill="#ffd400"/><rect x="9" y="6" width="4" height="4" fill="#3a9a2a"/><rect x="5" y="12" width="6" height="2" fill="#808080" stroke="#000"/><path d="M2 15.5h12" stroke="#000"/>'),
    ht: S16('<path d="M2.5 1.5h8l3 3v10h-11z" fill="#fff" stroke="#000"/><path d="M3.5 11.5c0-1.5 1.5-2.5 4.5-2.5s4.5 1 4.5 2.5v1h-2v-1h-5v1h-2z" fill="#e10600" stroke="#000"/><path d="M5 5h4M5 7h3" stroke="#000080"/>'),
    doc: SV(PAGE + '<path d="M4 7h7M4 9h7M4 11h7M4 13h5" stroke="#2a5ad8"/><rect x="4" y="3.5" width="5" height="2" fill="#2a5ad8"/>'),
    wri: SV(PAGE + '<path d="M4 7h7M4 9h7M4 11h5" stroke="#808080"/><text x="4" y="6" font-family="Times New Roman,serif" font-weight="bold" font-size="5" fill="#000080">W</text>'),
    sheet: S16('<path d="M2.5 1.5h8l3 3v10h-11z" fill="#fff" stroke="#000"/><path d="M10.5 1.5v3h3" fill="#c0c0c0" stroke="#000"/><path d="M3 7.5h10M3 10.5h10M3 13.5h10M6.5 5v9.5M9.5 5v9.5" stroke="#008000"/>'),
    crd: S16('<rect x="3.5" y="1.5" width="12" height="8" fill="#fff" stroke="#000"/><rect x="0.5" y="5.5" width="12" height="9" fill="#fff" stroke="#000"/><path d="M0.5 7.5h12" stroke="#e10600"/><path d="M2 10h7M2 12h5" stroke="#000080"/>'),
    tif: S16('<path d="M2.5 1.5h8l3 3v10h-11z" fill="#fff" stroke="#000"/><path d="M10.5 1.5v3h3" fill="#c0c0c0" stroke="#000"/><path d="M3 13l3-4 2 2 2-2 3 4z" fill="#2a9a2a"/><rect x="4" y="5" width="4" height="3" fill="#ffff80" stroke="#000"/>'),
    cpe: S16('<path d="M2.5 1.5h8l3 3v10h-11z" fill="#fff" stroke="#000"/><path d="M10.5 1.5v3h3" fill="#c0c0c0" stroke="#000"/><rect x="4" y="4" width="6" height="3" fill="#000"/><path d="M4 9h8M4 11h8M4 13h5" stroke="#808080"/>'),
    pkg: SV('<path d="M1.5 5.5l6.5-3 6.5 3v7l-6.5 3-6.5-3z" fill="#c8956a" stroke="#000"/><path d="M1.5 5.5l6.5 3 6.5-3M8 8.5v7" stroke="#000" fill="none"/>'),
    folder: A.ICON.folder,
    oldpc: '<svg viewBox="0 0 32 32"><rect x="4" y="2.5" width="24" height="19" fill="#e0d8b8" stroke="#000"/><rect x="4.5" y="3" width="23" height="1.5" fill="#fff"/><rect x="7" y="5.5" width="18" height="12.5" fill="#fff" stroke="#555"/><rect x="7.5" y="6" width="17" height="3" fill="#000080"/><rect x="7.5" y="6" width="3" height="3" fill="#c0c0c0"/><rect x="9" y="11" width="4" height="3" fill="#e10600" stroke="#000" stroke-width=".6"/><rect x="14" y="11" width="4" height="3" fill="#ffd400" stroke="#000" stroke-width=".6"/><rect x="19" y="11" width="4" height="3" fill="#008000" stroke="#000" stroke-width=".6"/><rect x="10" y="21.5" width="12" height="2" fill="#c8c0a0" stroke="#000"/><rect x="2" y="24" width="28" height="6" fill="#e0d8b8" stroke="#000"/><rect x="17" y="26" width="10" height="1.6" fill="#000"/><circle cx="6" cy="27" r="1" fill="#0c0"/><rect x="9" y="26" width="5" height="1" fill="#a09880"/></svg>',
    bbs: '<svg viewBox="0 0 32 32"><rect x="8" y="2.5" width="22" height="17" fill="#c0c0c0" stroke="#000"/><rect x="10.5" y="5" width="17" height="12" fill="#000"/><path d="M12 7.5h6M12 10h11M12 12.5h8" stroke="#00e5ff" stroke-width="1.4"/><rect x="12" y="14.5" width="3" height="1.5" fill="#ff40ff"/><rect x="16" y="19.5" width="6" height="2.5" fill="#808080" stroke="#000"/><path d="M1 24c0-4 4-6 9-6s9 2 9 6v2h-5v-3H6v3H1z" fill="#e10600" stroke="#000"/><path d="M3 30l2-4h10l2 4z" fill="#a00000" stroke="#000"/></svg>',
  };
  // the official JackOS 98 icons (icons.js) where they're the specific match
  if (window.JICON) Object.assign(I, { wordpad: JICON.icon('wordpad'), calc: JICON.icon('spreadsheet'), cardfile: JICON.icon('cardfile'), abook: JICON.icon('addressbook'), hyper: JICON.icon('hyperterm'), cal: JICON.icon('calendar'), clock: JICON.icon('clock'), magnify: JICON.icon('magnifier'), imaging: JICON.icon('picture'), packager: JICON.icon('package'), pkg: JICON.icon('package'), reversi: JICON.icon('reversi'), oldpc: JICON.icon('oldpc'), doc: JICON.icon('doc'), crd: JICON.icon('cardfile') });
  // Start > Documents and friends look up A.ICON by file type
  Object.assign(A.ICON, { doc: A.ICON.doc || I.doc, rtf: I.doc, wri: I.wri, xls: I.sheet, wks: I.sheet, crd: I.crd, ht: I.ht, tif: I.tif, cpe: I.cpe, cal: I.cal, wab: I.abook, pkg: I.pkg });

  // ================================================================ secrets
  const SEC = [
    ['wpsave', 'Desktop publisher', 'Save a document in WordPod'],
    ['wpbig', 'SEVENTY-TWO POINT', 'Make some words as big as WordPod allows'],
    ['wppreview', 'Saving trees', 'Look at a page before you print it'],
    ['wpplans', 'Invisible ink', 'Jack\'s plans have a part you can\'t see. Highlight everything'],
    ['wpstamp', 'Dear Diary 1999', 'Ask WordPod what the date is, in its longest form'],
    ['wpabout', 'Roll credits', 'Click a programmer\'s face over and over'],
    ['calcsum', 'Number cruncher', 'Make the spreadsheet add something up for you'],
    ['calcchart', 'Pie in the sky', 'Turn some numbers into a picture'],
    ['calclotus', 'Old habits', 'Type a formula the way Dad did on his old computer'],
    ['calccirc', 'Going round in circles', 'Make a cell depend on itself'],
    ['calcrich', 'Pocket money tycoon', 'Give Jack a million pounds (on paper)'],
    ['cardadd', 'Card shark', 'Add a card of your own to a Cardfile'],
    ['carddial', 'Autodial', 'Let Cardfile ring someone for you'],
    ['abgrot', 'Ex-directory', 'Look up the one contact with no phone number'],
    ['abadd', 'Little black book', 'Add someone to the Address Book'],
    ['bbsconnect', 'CONNECT 28800', 'Dial into a bulletin board'],
    ['bbsall', 'Board hopper', 'Visit every bulletin board in the phone book'],
    ['bbsdoor', 'Door-to-door', 'Play a game through a BBS door'],
    ['bbstrade', 'Space tycoon', 'Make 10,000 credits trading between the stars'],
    ['bbsdragon', 'Dragonfly slayer', 'Defeat the Great Red Dragonfly'],
    ['bbssysop', 'Who\'s the sysop?', 'Page the sysop and find out who is really typing'],
    ['bbsdl', '2400 baud of patience', 'Download a file all the way to the end'],
    ['bbsmom', 'NO CARRIER', 'Stay online long enough for someone to pick up the phone'],
    ['bbspost', 'First post!', 'Leave a message on a bulletin board for everyone to read'],
    ['bbssecret', 'Hidden door', 'One bulletin board isn\'t in the phone book'],
    ['calphantom', 'Big day', 'Look at the most important day of the summer'],
    ['caladd', 'Busy busy', 'Put something in Jack\'s diary'],
    ['caly2k', 'Off the edge', 'Try to look past the end of the calendar'],
    ['clocktitle', 'Look, no title!', 'Double-click a clock'],
    ['magnify', 'Eagle eye', 'Magnify the screen as much as possible'],
    ['imaging', 'Graffiti artist', 'Stamp something onto one of Jack\'s pictures'],
    ['packager', 'Boxed Gubbinz', 'Put Gubbinz in a box'],
    ['progdad', 'Dad\'s private stuff', 'Open the group on Dad\'s old computer that is meant to stay closed'],
    ['progexit', 'Exit JackOS', 'Leave JackOS... from inside JackOS'],
    ['winfile', 'Tree surgeon', 'Expand every branch in File Manager'],
    ['fax', 'Just the fax', 'Send a fax'],
    ['meeting', 'Video call (sort of)', 'Have a JackMeeting with another visitor'],
    ['writeread', 'Ancient scrolls', 'Read Dad\'s old readme in Write'],
    ['swreview', 'Seen it twice', 'Read Jack\'s Episode I review'],
  ];
  SEC.forEach(([id, n, hint]) => A.defineSecret('office.' + id, n, hint));
  const secret = K.secret = id => A.secret('office.' + id);

  // ================================================================ windows, dialogs, toolbars
  K.win = (title, body, o) => A.win(title, body, Object.assign({}, o, { cls: 'ofw' + (o && o.cls ? ' ' + o.cls : '') }));
  // fit a window to the screen after its content has been laid out
  K.fit = w => { const r = w.el.getBoundingClientRect(); if (r.right > innerWidth - 2) w.el.style.left = Math.max(0, innerWidth - r.width - 2) + 'px'; if (r.bottom > innerHeight - 34) w.el.style.top = Math.max(0, innerHeight - 34 - r.height) + 'px'; };
  // a small modal-ish dialog: buttons [[label, fn returning false to stay open, isDefault]]
  K.dialog = function (title, html, buttons, o) {
    o = o || {};
    const b = h('', 'of-dlg' + (o.cls ? ' ' + o.cls : ''), 'form');
    const main = h(html, 'of-dlgmain'); b.appendChild(main);
    const row = h('', 'of-dlgbtns' + (o.side ? ' side' : ''));
    if (o.side) { b.classList.add('of-dlgside'); } b.appendChild(row);
    const w = A.win(title, b, { w: o.w || 340, icon: o.icon, noResize: true, noMax: true, noMin: true, escClose: true, onClose: o.onClose, cls: 'ofdlgwin' });
    (buttons || [['OK']]).forEach(([label, fn], i) => {
      const bt = h('', 'btn', 'button'); bt.type = i === 0 ? 'submit' : 'button'; bt.textContent = label;
      if (i !== 0) tap(bt, () => { if (fn && fn(main, w) === false) return; w.close(); });
      row.appendChild(bt);
    });
    on(b, 'submit', ev => { ev.preventDefault(); const fn = (buttons || [['OK']])[0][1]; if (fn && fn(main, w) === false) return; w.close(); });
    setTimeout(() => { const f = qs(main, 'input:not([type=radio]):not([type=checkbox]),select,textarea') || qs(row, 'button'); if (f && !touchy()) { f.focus(); if (f.select && f.tagName === 'INPUT') f.select(); } }, 40);
    K.fit(w);
    return { w, b: main, form: b };
  };
  // toolbar: items [{t: 'Tooltip', i: svg, a: fn, id, tog}] or '|' separators or {el}
  K.toolbar = function (items, cls) {
    const bar = h('', 'of-tbar' + (cls ? ' ' + cls : ''));
    const btns = {};
    items.forEach(it => {
      if (it === '|') return bar.appendChild(h('', 'of-tsep', 'span'));
      if (it.el) return bar.appendChild(it.el);
      const b = h(it.i + (it.label ? `<span>${esc(it.label)}</span>` : ''), 'of-tb' + (it.label ? ' lbl' : ''), 'button');
      b.type = 'button'; b.title = it.t; b.setAttribute('aria-label', it.t);
      on(b, 'mousedown', ev => ev.preventDefault()); // keep the text selection where it is
      tap(b, () => { if (!b.disabled && it.a) it.a(b); });
      if (it.id) btns[it.id] = b;
      bar.appendChild(b);
    });
    bar.btns = btns;
    return bar;
  };
  // extra status-bar panes: returns the spans
  K.statusParts = (w, parts) => parts.map(p => { const s = h('', null, 'span'); s.textContent = p; if (/^(NUM|CAPS|SCRL)$/.test(p)) s.className = 'of-skey'; w.status.parentNode.appendChild(s); return s; });
  K.sel16 = svg => `<span class="of-i16">${svg}</span>`;

  // ================================================================ documents: Jack's (read-only, content loaded lazily) + the visitor's own (localStorage)
  const MD = 'C:/My Documents';
  K.MD = MD;
  const UKEY = 'jhp_office_docs';
  let UD = store.get(UKEY, {}); // 'c:/dir/name' -> { dir, name, kind, data, date }
  const keyOf = (dir, name) => (dir + '/' + name).toLowerCase();
  const plain = html => String(html || '').replace(/<(br|\/div|\/p|\/li|\/h\d)[^>]*>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  function userNode(rec) {
    const n = { name: rec.name, type: rec.kind, user: true, office: true };
    Object.defineProperties(n, {
      date: { get: () => (UD[keyOf(rec.dir, rec.name)] || rec).date, enumerable: true },
      size: { get: () => kb(JSON.stringify((UD[keyOf(rec.dir, rec.name)] || rec).data || '').length + 900), enumerable: true },
      text: { get: () => { const d = (UD[keyOf(rec.dir, rec.name)] || rec).data; return typeof d === 'string' ? d : d && d.html ? plain(d.html) : ''; }, enumerable: true },
      dataURL: { get: () => { const d = (UD[keyOf(rec.dir, rec.name)] || rec).data; return d && d.png || ''; }, enumerable: true },
      urec: { get: () => UD[keyOf(rec.dir, rec.name)] || rec },
    });
    return n;
  }
  Object.values(UD).forEach(rec => { try { A.fs.add(rec.dir, userNode(rec)); } catch (e) {} });
  K.saveUser = function (dir, name, kind, data) {
    const k = keyOf(dir, name), rec = { dir, name, kind, data, date: d99() };
    const prev = UD[k]; UD[k] = rec;
    try { localStorage.setItem(UKEY, JSON.stringify(UD)); }
    catch (e) { if (prev) UD[k] = prev; else delete UD[k]; msg('Disk Full', `There is not enough room on drive C: to save ${name}.\n\nDelete some of your own files, or empty the Recycle Bin and stop downloading pictures of spaceships.`, 'warn'); return null; }
    const ex = A.fs.get(dir + '/' + name);
    if (!ex || !ex.user) A.fs.add(dir, userNode(rec));
    return A.fs.get(dir + '/' + name);
  };
  K.deleteUser = node => { const r = node.urec; if (!r) return; delete UD[keyOf(r.dir, r.name)]; store.set(UKEY, UD); const d = A.fs.get(r.dir); if (d) d.kids = d.kids.filter(k => k !== node); };
  // the data inside a file: user files directly, Jack's files from the lazily loaded js/office-docs.js
  K.docs = () => A.load('js/office-docs.js').then(() => window.OfficeDocs || {});
  K.readDoc = node => {
    if (!node) return Promise.resolve(null);
    if (node.urec) return Promise.resolve(JSON.parse(JSON.stringify(node.urec.data)));
    if (node.ofk) return K.docs().then(D => { const v = D[node.ofk]; return typeof v === 'function' ? v() : JSON.parse(JSON.stringify(v == null ? null : v)); });
    if (node.type === 'txt' || node.text != null) return Promise.resolve(node.text || '');
    return Promise.resolve(null);
  };
  K.pathOf = node => { const p = A.fs.pathOf(node); return p ? p.replace(/\\/g, '/').replace(/\/[^/]*$/, '') : MD; };
  const badName = n => /[\\/:*?"<>|]/.test(n);
  const unlockedDirs = () => store.get('jhp_files_unlocked', {});

  // the common Open / Save As dialog. o: { mode: 'open'|'save', title, types: [[label, [exts]]], name, dir, icon }, cb(nodeOrTarget)
  K.fileDlg = function (o, cb) {
    let cur = (o.dir && A.fs.get(o.dir) ? o.dir : MD).replace(/\\/g, '/'), ti = o.typeIndex || 0;
    const save = o.mode === 'save';
    const b = h('', 'of-fd', 'form');
    b.innerHTML = `<div class="of-fdrow"><label>${save ? 'Save in:' : 'Look in:'}</label><select class="of-fdlook"></select><button class="btn of-fdup" type="button" title="Up One Level" aria-label="Up One Level"><svg viewBox="0 0 24 24"><path d="M1 6h8l2 2h12v14H1z" fill="#f2d16b" stroke="#7a5a00"/><path d="M12 19v-8M8 14l4-4 4 4" stroke="#000" stroke-width="2" fill="none"/></svg></button></div>
      <div class="field of-fdlist" role="listbox"></div>
      <div class="of-fdrow"><label for="ofFdName">File name:</label><input type="text" class="of-fdname" autocomplete="off" spellcheck="false"><button class="btn of-fdok" type="submit">${save ? 'Save' : 'Open'}</button></div>
      <div class="of-fdrow"><label>${save ? 'Save as type:' : 'Files of type:'}</label><select class="of-fdtype">${o.types.map((t, i) => `<option value="${i}"${i === ti ? ' selected' : ''}>${esc(t[0])}</option>`).join('')}</select><button class="btn of-fdx" type="button">Cancel</button></div>`;
    const w = A.win(o.title || (save ? 'Save As' : 'Open'), b, { w: 430, icon: o.icon, noResize: true, noMax: true, noMin: true, escClose: true, cls: 'ofdlgwin' });
    const list = qs(b, '.of-fdlist'), inp = qs(b, '.of-fdname'), look = qs(b, '.of-fdlook'), typ = qs(b, '.of-fdtype');
    const exts = () => o.types[ti][1];
    const iconOf = k => k.type === 'dir' ? (k.locked && !unlockedDirs()[k.name] ? A.ICON.lock : A.ICON.folder) : (A.ICON[ext(k.name)] || A.ICON[k.type] || A.ICON.txt);
    function draw() {
      const dir = A.fs.get(cur) || A.fs.get(MD);
      const parts = cur.split('/');
      look.innerHTML = parts.map((p, i) => `<option value="${esc(parts.slice(0, i + 1).join('/'))}"${i === parts.length - 1 ? ' selected' : ''}>${'\u00a0\u00a0'.repeat(i)}${esc(i === 0 ? 'Jack\'s PC (C:)' : p)}</option>`).join('');
      const ks = (dir.kids || []).filter(k => !k.hidden && (k.type === 'dir' || exts().includes('*') || exts().includes(ext(k.name)) || exts().includes('type:' + k.type)))
        .sort((a, c) => (a.type === 'dir') === (c.type === 'dir') ? a.name.localeCompare(c.name) : a.type === 'dir' ? -1 : 1);
      list.innerHTML = ks.map(k => `<button type="button" class="of-fdf" data-n="${esc(k.name)}" role="option">${K.sel16(iconOf(k))}<span>${esc(k.name)}</span></button>`).join('') || '<i class="of-fdempty">(no files of this type here)</i>';
    }
    function go(n) {
      const k = A.fs.get(cur + '/' + n);
      if (k && k.type === 'dir') {
        if (k.locked && !unlockedDirs()[k.name]) return msg(o.title || 'Open', `${n}\n\nThis folder is locked. (Jack's orders.)\n\nOpen it from My Computer if you know the password.`, 'warn');
        cur += '/' + k.name; if (save) inp.value = inp.value; else inp.value = ''; return draw();
      }
      if (save) {
        let nm = n.trim();
        if (!nm || /^\*/.test(nm)) return;
        if (badName(nm)) return msg('Save As', 'A filename cannot contain any of the following characters:\n\\ / : * ? " < > |', 'warn');
        if (!exts().includes(ext(nm))) nm += '.' + exts()[0];
        if (nm.length > 64) return msg('Save As', 'That filename is too long. Even for 1999.', 'warn');
        if (/^c:\/JACKOS/i.test(cur)) return msg('Save As', `You can't save in ${cur.replace(/\//g, '\\')}.\n\nDad says nobody saves anything in JACKOS. (Try My Documents.)`, 'warn');
        const ex = A.fs.get(cur + '/' + nm);
        if (ex && !ex.user) return msg('Save As', `${nm}\n\nAccess is denied. That's one of Jack's files. Pick another name.`, 'warn');
        const done = () => { w.close(); cb({ dir: cur, name: nm, ext: ext(nm), typeIndex: ti }); };
        if (ex) return msg('Save As', `${nm} already exists.\nDo you want to replace it?`, 'q', [['Yes', done], ['No']]);
        return done();
      }
      if (!k) return msg(o.title || 'Open', `${n}\nFile not found.\nPlease verify the correct file name was given.`, 'warn');
      w.close(); cb(k);
    }
    let lt = 0, ln = '';
    on(list, 'click', ev => { const e = ev.target.closest('.of-fdf'); if (!e) return; const n = e.dataset.n, now = Date.now(); qsa(list, '.of-fdf.sel').forEach(x => x.classList.remove('sel')); e.classList.add('sel'); const k = A.fs.get(cur + '/' + n); if (!(save && k && k.type === 'dir')) inp.value = n; if (touchy() || (n === ln && now - lt < 450)) { lt = 0; go(n); } else { lt = now; ln = n; } });
    on(look, 'change', () => { cur = look.value; draw(); });
    tap(qs(b, '.of-fdup'), () => { if (cur.split('/').length > 1) { cur = cur.replace(/\/[^/]+$/, ''); draw(); } });
    on(typ, 'change', () => { ti = +typ.value; if (save && inp.value) inp.value = inp.value.replace(/\.[a-z0-9]+$/i, '') + '.' + exts()[0]; draw(); });
    tap(qs(b, '.of-fdx'), w.close);
    on(b, 'submit', ev => { ev.preventDefault(); const v = inp.value.trim(); if (v) go(v); });
    inp.value = o.name || (save ? '' : '');
    draw(); K.fit(w);
    setTimeout(() => { if (!touchy()) { inp.focus(); inp.select(); } }, 40);
    return w;
  };
  // "save changes?" before closing a document window. w: win, isDirty(): bool, save(then)
  K.guardClose = (w, app, docName, isDirty, save) => {
    const btn = qs(w.el, '[data-w=close]');
    on(btn, 'click', ev => { if (!w.closed && isDirty()) { ev.stopImmediatePropagation(); K.askSave(app, docName(), save, () => w.close()); } }, true);
  };
  K.askSave = (app, name, save, then) => msg(app, `Save changes to ${name}?`, 'warn', [['Yes', () => save(then)], ['No', then], ['Cancel']]);

  // tiny markup for Jack's documents -> HTML. Lines: '# ' heading, '## ' sub, '> ' centre, '>> ' right, '* ' bullet, '---' rule.
  // Inline: **bold** //italic// __underline__ ~~strike~~ {c=red;s=24;f=Impact;b|text} {hide|white text} and \t for a tab.
  const FONTSTACK = K.FONTSTACK = {
    'Arial': 'Arial,Helvetica,"Liberation Sans",sans-serif', 'Arial Black': '"Arial Black",Arial,sans-serif', 'Book Antiqua': '"Book Antiqua",Palatino,"Palatino Linotype",Georgia,serif',
    'Comic Sans MS': '"Comic Sans MS","Comic Neue","Chalkboard SE",cursive', 'Courier New': '"Courier New",Courier,"Liberation Mono",monospace', 'Georgia': 'Georgia,"Times New Roman",serif',
    'Impact': 'Impact,"Anton","Arial Narrow Bold",sans-serif', 'Lucida Console': '"Lucida Console",Monaco,"Courier New",monospace', 'MS Sans Serif': '"MS Sans Serif",Tahoma,Geneva,sans-serif',
    'Tahoma': 'Tahoma,Verdana,Geneva,sans-serif', 'Times New Roman': '"Times New Roman",Times,"Liberation Serif",serif', 'Trebuchet MS': '"Trebuchet MS",Tahoma,sans-serif', 'Verdana': 'Verdana,Geneva,sans-serif',
  };
  const COLS = K.COLS = { black: '#000000', maroon: '#800000', green: '#008000', olive: '#808000', navy: '#000080', purple: '#800080', teal: '#008080', gray: '#808080', silver: '#c0c0c0', red: '#ff0000', lime: '#00ff00', yellow: '#ffff00', blue: '#0000ff', fuchsia: '#ff00ff', aqua: '#00ffff', white: '#ffffff' };
  function inline(s) {
    s = esc(s);
    s = s.replace(/\{([^|{}]*)\|([^{}]*)\}/g, (m, spec, body) => {
      if (spec === 'hide') return `<span class="of-hidden" style="color:#ffffff">${body}</span>`;
      const st = [];
      spec.split(';').forEach(p => { const [k, v] = p.split('='); if (k === 'c') st.push('color:' + (COLS[v] || v)); else if (k === 's') st.push('font-size:' + v + 'pt'); else if (k === 'f') st.push('font-family:' + (FONTSTACK[v.replace(/&#39;/g, "'")] || v)); else if (k === 'b') st.push('font-weight:bold'); else if (k === 'bg') st.push('background-color:' + (COLS[v] || v)); });
      return `<span style="${st.join(';').replace(/"/g, "'")}">${body}</span>`;
    });
    return s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\/\/(.+?)\/\//g, '<i>$1</i>').replace(/__(.+?)__/g, '<u>$1</u>').replace(/~~(.+?)~~/g, '<strike>$1</strike>').replace(/\t/g, '<span class="of-tab" contenteditable="false"></span>');
  }
  K.md = function (src) {
    const out = []; let ul = null;
    const flush = () => { if (ul) { out.push('<ul>' + ul.join('') + '</ul>'); ul = null; } };
    String(src || '').split('\n').forEach(line => {
      let m;
      if ((m = /^\* (.*)$/.exec(line))) { (ul = ul || []).push(`<li>${inline(m[1])}</li>`); return; }
      flush();
      if (line === '---') return out.push('<div style="text-align:center">' + inline('~ ~ ~ ~ ~ ~ ~ ~') + '</div>');
      if ((m = /^# (.*)$/.exec(line))) return out.push(`<div><span style="font-family:${FONTSTACK.Arial.replace(/"/g, "'")};font-size:18pt"><b>${inline(m[1])}</b></span></div>`);
      if ((m = /^## (.*)$/.exec(line))) return out.push(`<div><span style="font-family:${FONTSTACK.Arial.replace(/"/g, "'")};font-size:13pt"><b>${inline(m[1])}</b></span></div>`);
      if ((m = /^>> (.*)$/.exec(line))) return out.push(`<div style="text-align:right">${inline(m[1]) || '<br>'}</div>`);
      if ((m = /^> (.*)$/.exec(line))) return out.push(`<div style="text-align:center">${inline(m[1]) || '<br>'}</div>`);
      out.push(`<div>${inline(line) || '<br>'}</div>`);
    });
    flush();
    return out.join('');
  };
  // clean HTML from storage before it goes into an editor (strip anything that could run or fetch)
  K.clean = function (html) {
    const t = document.createElement('template'); t.innerHTML = String(html || '');
    t.content.querySelectorAll('script,style,iframe,object,embed,link,meta,form,input,button,textarea,select').forEach(e => e.remove());
    t.content.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => { const n = a.name.toLowerCase(); if (n.startsWith('on') || (n === 'src' && !/^data:image\//.test(a.value)) || n === 'href' || n === 'srcset') e.removeAttribute(a.name); }));
    return t.innerHTML;
  };

  // ================================================================ program registry with lazy loading
  // id -> { mod: 'wordpad' (loads js/office-wordpad.js, which sets OfficeKit.apps[id]), single }
  const DEF = {};
  K.launch = function (id, arg) {
    const d = DEF[id];
    if (d.single && d.w && !d.w.closed) { d.w.restore(); return d.w; }
    const go = () => { const fn = K.apps[id]; if (!fn) return msg('JackOS', `${d.title} could not start. A file it needs (OFFICE.DLL) is missing.`, 'warn'); const w = fn(arg); if (d.single && w) d.w = w; return w; };
    if (K.apps[id]) return go();
    document.body.classList.add('of-busy');
    A.load('js/office-' + d.mod + '.js').then(() => { document.body.classList.remove('of-busy'); go(); }, () => { document.body.classList.remove('of-busy'); msg(d.title, `Cannot find the file 'OFFICE-${d.mod.toUpperCase()}.DLL'.\n\nThe disk might be full of Pocket Critters screenshots. Try again in a minute.`, 'warn'); });
    return null;
  };
  function prog(id, mod, title, cmds, icon, menuPath, single) {
    DEF[id] = { mod, title, single, icon };
    A.register('office.' + id, { cmd: cmds, open: arg => K.launch(id, arg) });
    if (menuPath) A.addProgram(menuPath, 'office.' + id, icon);
  }
  const ACC = 'Accessories';
  prog('wordpad', 'wordpad', 'WordPod', ['wordpad', 'wordpd'], I.wordpad, [ACC, 'WordPod']);
  prog('write', 'wordpad', 'Write', ['write', 'write.exe'], I.write, null);
  prog('calc', 'sheet', 'JackCalc', ['jackcalc', 'jcalc', 'spreadsheet', 'sheet', 'wks'], I.calc, [ACC, 'Office Tools', 'JackCalc Spreadsheet']);
  prog('cardfile', 'pim', 'Cardfile', ['cardfile', 'cards file'], I.cardfile, [ACC, 'Office Tools', 'Cardfile']);
  prog('abook', 'pim', 'Address Book', ['wab', 'address book', 'addressbook', 'contacts'], I.abook, [ACC, 'Address Book']);
  prog('calendar', 'pim', 'Calendar', ['calendar', 'diary99', 'appointments'], I.cal, [ACC, 'Office Tools', 'Calendar'], true);
  prog('hyper', 'term', 'HyperTerminull', ['hypertrm', 'hyperterminal', 'hyper terminal', 'terminal', 'bbs'], I.hyper, [ACC, 'Communications', 'HyperTerminull']);
  prog('clock', 'tools', 'Clock', ['clock', 'clock.exe'], I.clock, [ACC, 'Clock']);
  prog('magnify', 'tools', 'Magnifier', ['magnify', 'magnifier', 'zoom'], I.magnify, [ACC, 'Accessibility', 'Magnifier'], true);
  prog('imaging', 'tools', 'Imaging', ['kodakimg', 'imaging', 'wangimg'], I.imaging, [ACC, 'Imaging']);
  prog('packager', 'tools', 'Object Packager', ['packager', 'objpack', 'object packager'], I.packager, [ACC, 'Office Tools', 'Object Packager']);
  prog('progman', 'tools', 'Program Manager', ['progman', 'program manager', 'win31', 'win 3.1', 'dads computer', "dad's computer"], I.progman, ['Dad\'s Old Computer', 'Program Manager'], true);
  prog('winfile', 'tools', 'File Manager', ['winfile', 'file manager', 'filemanager'], I.winfile, ['Dad\'s Old Computer', 'File Manager']);
  A.addProgram(['Dad\'s Old Computer', 'Reversi'], () => A.open('games.reversi'), I.reversi);
  prog('fax', 'tools', 'Fax Cover Page Editor', ['faxcover', 'fax', 'fax cover', 'cover page'], I.fax, [ACC, 'Fax', 'Cover Page Editor']);
  prog('meeting', 'tools', 'JackMeeting', ['jackmeeting', 'netmeeting', 'conf', 'meeting'], I.meeting, [ACC, 'Communications', 'JackMeeting'], true);
  A.addProgram(['Dad\'s Old Computer', 'Write'], 'office.write', I.write);
  A.addProgram(['Dad\'s Old Computer', 'Cardfile'], 'office.cardfile', I.cardfile);
  A.addProgram(['Dad\'s Old Computer', 'Clock'], 'office.clock', I.clock);
  A.addProgram(['Dad\'s Old Computer', 'Read Me'], () => openPath('C:/WIN31/README.WRI'), I.wri);
  A.addProgram([ACC, 'Fax', 'Send Fax...'], () => A.open('office.fax', { send: true }), I.fax);
  A.desktopIcon('Dad\'s Old PC', I.oldpc, () => A.open('office.progman'), 'iconOfficeProgman');
  A.cmd(['the grot hole', 'grothole', 'the byte hole', 'bytehole', 'byte hole'], () => A.open('office.hyper', { dial: 'grot' }));
  A.cmd(['atdt 01632 960743', 'atdt01632960743', '01632 960743', '01632960743'], () => A.open('office.hyper', { dial: 'squig' }));
  A.cmd(['dreamcast99', 'starbase', 'starbase 1999'], () => A.open('office.hyper', { dial: 'star' }));
  const openPath = p => { const n = A.fs.get(p); if (n) A.openFile(n); else msg('JackOS', `Cannot find '${p.replace(/\//g, '\\')}'.`, 'warn'); };
  K.openPath = openPath;

  // ================================================================ file types
  K.openDoc = (app, node) => A.open('office.' + app, { node });
  const prevDoc = A.OPENERS.doc, prevTxt = A.OPENERS.txt;
  A.OPENERS.doc = node => node.blocked && prevDoc ? prevDoc(node) : K.openDoc('wordpad', node);
  A.OPENERS.rtf = node => K.openDoc('wordpad', node);
  A.OPENERS.wri = node => K.openDoc('write', node);
  A.OPENERS.xls = A.OPENERS.wks = node => K.openDoc('calc', node);
  A.OPENERS.crd = node => K.openDoc('cardfile', node);
  A.OPENERS.wab = node => K.openDoc('abook', node);
  A.OPENERS.cal = node => K.openDoc('calendar', node);
  A.OPENERS.ht = node => A.open('office.hyper', { dial: node.bbs, node });
  A.OPENERS.tif = node => K.openDoc('imaging', node);
  A.OPENERS.cpe = node => K.openDoc('fax', node);
  A.OPENERS.pkg = node => K.openDoc('packager', node);
  // text files with a .doc / .wri name (like C:\HOMEWORK.DOC) open in WordPad / Write instead of Notepad
  if (prevTxt) A.OPENERS.txt = node => { const e = ext(node.name); if (!node.future && (e === 'doc' || e === 'rtf')) return K.openDoc('wordpad', node); if (!node.future && e === 'wri') return K.openDoc('write', node); return prevTxt(node); };

  // ================================================================ Jack's files on C: (content lives in js/office-docs.js)
  const LATER = [];
  function file(dir, name, type, date, ofk, extra) {
    const node = Object.assign({ name, type, date, ofk, size: (extra && extra.size) || (2 + (name.length * 7) % 23) + ' KB' }, extra || {});
    if (date && !happened(date)) LATER.push([dir, node]); else A.fs.add(dir, node);
    return node;
  }
  setInterval(() => { for (let i = LATER.length - 1; i >= 0; i--) if (happened(LATER[i][1].date)) { A.fs.add(LATER[i][0], LATER[i][1]); LATER.splice(i, 1); } }, 600000);
  const HW = MD + '/Homework', SS = MD + '/Spreadsheets', SW = MD + '/Intergalactic Battles', CF = MD + '/Cardfiles';
  A.fs.dir(SS).date = '05/01/99'; A.fs.dir(SW).date = '03/05/99'; A.fs.dir(CF).date = '20/01/99';
  // WordPad documents
  file(MD, 'Top Secret Plans.doc', 'doc', '02/10/99', 'plans', { secret: null });
  file(MD, 'Letter to Nan (thank you).doc', 'doc', '04/01/99', 'nan');
  file(MD, 'Christmas List 1999.doc', 'doc', '01/10/99', 'xmas');
  file(MD, 'JACK ATTACK issue 8 DRAFT.rtf', 'rtf', '11/10/99', 'issue8');
  file(HW, 'Geography - Volcanoes.doc', 'doc', '15/03/99', 'volcano');
  file(HW, 'English - persuasive letter.doc', 'doc', '27/04/99', 'persuade');
  file(HW, 'Computer Club - my web site.doc', 'doc', '09/06/99', 'website');
  file(HW, 'Book report - The Hobbet.doc', 'doc', '06/10/99', 'hobbit');
  file(SW, 'Episode I review (WRITTEN THE SAME NIGHT).doc', 'doc', '16/07/99', 'review', { secret: 'office.swreview' });
  file(SW, 'Gubbinz Wars - Episode I (a story).rtf', 'rtf', '24/07/99', 'fanfic');
  file(SW, 'Intergalactic Battles quiz for Dave.doc', 'doc', '20/05/99', 'swquiz');
  // spreadsheets
  file(SS, 'Pocket Money 1999.wks', 'wks', '31/01/99', 'money');
  file(SS, 'Gork Paint Pots.wks', 'wks', '23/01/99', 'paint');
  file(SS, 'Blockology Scores.wks', 'wks', '02/01/99', 'tetris');
  file(SS, 'Rubrick\'s Cube Times.xls', 'xls', '03/04/99', 'rubik');
  file(SS, 'Millennium Party Budget.xls', 'xls', '01/09/99', 'party');
  file(SW, 'Intergalactic Battles Toys.wks', 'wks', '03/05/99', 'swtoys');
  file(SW, 'Episode I Countdown.wks', 'wks', '01/01/99', 'countdown');
  // cardfiles, address book, calendar, connections
  file(CF, 'Mates.crd', 'crd', '20/01/99', 'mates');
  file(CF, 'Cheats.crd', 'crd', '27/02/99', 'cheats');
  file(CF, 'Intergalactic Battles Characters.crd', 'crd', '18/07/99', 'swcards');
  file('C:/JACKOS', 'Address Book.wab', 'wab', '10/12/98', null, { size: '18 KB' });
  file(MD, 'Jack\'s 1999 Diary.cal', 'cal', '01/01/99', null, { size: '6 KB' });
  const HT = 'C:/Program Files/Accessories/HyperTerminull';
  A.fs.dir(HT).date = '10/12/98';
  [['The Grot Hole.ht', 'grot'], ['Starbase 1999.ht', 'star'], ['Pixel Palace.ht', 'pixel'], ['Y2K Bunker.ht', 'bunker'], ['Dave\'s PC.ht', 'dave']].forEach(([n, b]) => file(HT, n, 'ht', '12/02/99', null, { bbs: b, size: '1 KB' }));
  file(HT, 'BBS list (from the magazine).txt', 'txt', '12/02/99', null, { text: `BULLETIN BOARDS - phone numbers from the back of a computer magazine
(and one from Dave's brother)

THE BYTE HOLE ........ 01632 960066  green screens, door games, a sysop who never sleeps
STARBASE 1999 ........ 01632 960197  sci-fi, Episode I chat, Star Trader 99 door
PIXEL PALACE ......... 01632 960321  games, cheats, shareware (2400 baud only!!!)
Y2K BUNKER ........... 01632 960200  for people who are worried about the year 2000
DAVE'S PC ............ 01632 960123  Dave's brother says it's a BBS. It is a phone.

Remember: modem speed 28800, 8-N-1, ANSI ON.
Remember: ONLY after 6pm (cheap rate). ONLY if Mom isn't expecting a call.
Remember: if the phone rings while you're online you get thrown off.

There's supposed to be a secret one. The number is "on a door". Whatever that means.
` });
  // Write (JackOS 3.1) files from Dad's old computer
  const W31 = 'C:/WIN31';
  Object.assign(A.fs.dir(W31), { date: '14/03/94' });
  file(W31, 'README.WRI', 'wri', '', 'readme', { date: '14/03/94', secret: 'office.writeread' });
  file(W31, 'DADSCV93.WRI', 'wri', '', 'cv', { date: '02/11/93' });
  file(W31, 'XMASLIST.WRI', 'wri', '', 'dadxmas', { date: '01/12/93' });
  file(W31, 'RECIPES.CRD', 'crd', '', 'recipes', { date: '20/02/94' });
  file(W31, 'ACCOUNTS.WKS', 'wks', '', 'accounts', { date: '30/04/94' });
  file(W31, 'PACKAGE.PKG', 'pkg', '', null, { date: '14/03/94', size: '3 KB' });
  [['PROGMAN.EXE', 'progman', '113 KB'], ['WINFILE.EXE', 'winfile', '146 KB'], ['CARDFILE.EXE', 'cardfile', '91 KB'], ['WRITE.EXE', 'write', '244 KB'], ['CLOCK.EXE', 'clock', '16 KB'], ['CALENDAR.EXE', 'calendar', '59 KB'], ['PACKAGER.EXE', 'packager', '76 KB']]
    .forEach(([n, id, size]) => A.fs.add(W31, { name: n, type: 'exe', app: 'office.' + id, date: '10/03/92', size }));
  A.fs.add(W31, { name: 'REVERSI.EXE', type: 'exe', app: 'games.reversi', date: '10/03/92', size: '15 KB' });
  const PFA = 'C:/Program Files/Accessories';
  [['WORDPOD.EXE', 'wordpad', '205 KB'], ['HYPERTRM.EXE', 'hyper', '28 KB'], ['MAGNIFY.EXE', 'magnify', '58 KB'], ['KODAKIMG.EXE', 'imaging', '507 KB'], ['JACKCALC.EXE', 'calc', '388 KB'], ['WAB.EXE', 'abook', '36 KB'], ['FAXCOVER.EXE', 'fax', '120 KB'], ['JMEET.EXE', 'meeting', '1.2 MB']]
    .forEach(([n, id, size]) => A.fs.add(n === 'HYPERTRM.EXE' ? HT : PFA, { name: n, type: 'exe', app: 'office.' + id, date: '10/12/98', size }));

  // who's on the site right now (BBS "who's online" and JackMeeting use it)
  K.online = [];
  if (window.Net && Net.on) Net.on('online', m => { if (m && Array.isArray(m.online)) K.online = m.online; });
  // files downloaded from the bulletin boards
  K.DL = HT + '/Received';
  const dlNode = d => ({ name: d.name, type: 'txt', date: d.date, size: d.size, text: d.text, dl: true });
  K.addDownload = d => { const list = store.get('jhp_office_dl', []).filter(x => x.name !== d.name); list.push(d); store.set('jhp_office_dl', list.slice(-30)); A.fs.add(K.DL, dlNode(d)); };
  A.fs.dir(K.DL).date = '12/02/99';
  store.get('jhp_office_dl', []).forEach(d => A.fs.add(K.DL, dlNode(d)));

  K.ready = true;
})();

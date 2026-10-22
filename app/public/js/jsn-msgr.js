/* JSN Messenger Service 1.0 (JSNMSGR.EXE): the contact list, the Instant Message windows, sign-in alerts and the
 * tray icon. Contacts are real JackNet members only (added by member name, member number or JackMail address).
 * Talks to mods/jsn.js. Everything from the wire is escaped before it touches the screen. Loaded by js/jsn.js. */
(function () {
  'use strict';
  if (window.JSNMsgr || !window.JSN || !window.Apps || !window.Net) return;
  const A = Apps, J = JSN, esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const qs = (el, s) => el.querySelector(s), qsa = (el, s) => [...el.querySelectorAll(s)];
  const pad = n => String(n).padStart(2, '0');
  const d99 = () => { const t = Desk.today99(); return pad(t.d) + '/' + pad(t.m) + '/99'; };
  const hhmm = ts => { const d = new Date(ts || Date.now()); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const touch = () => matchMedia('(hover:none)').matches;
  const S = id => A.secret('jsn.' + id);
  const ST = J.ST, people = J.people;
  const kindOf = st => (ST[st] || ST.FLN)[1];
  const label = st => (ST[st] || ST.FLN)[0];
  const icon = (st, sz) => people(kindOf(st), sz);
  const lc = s => String(s || '').toLowerCase();
  const okName = s => typeof s === 'string' && /^[A-Za-z0-9_\-]{2,16}$/.test(s);
  const mailOf = n => lc(n) + '@jackmail.webcom';
  const MY_ST = ['NLN', 'BSY', 'BRB', 'AWY', 'PHN', 'LUN', 'HDN'];
  const ENV = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="1" y="3.5" width="14" height="9.5" fill="#fff" stroke="#000"/><path d="M1 3.5l7 5.5 7-5.5" fill="#ffe680" stroke="#000"/></svg>';
  const I_ADD = '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><circle cx="6" cy="5" r="3" fill="#2fae3a" stroke="#000" stroke-width=".7"/><path d="M1 15q0-6.5 5-6.5t5 6.5z" fill="#2fae3a" stroke="#000" stroke-width=".7"/><path d="M12.5 3v6M9.5 6h6" stroke="#e01010" stroke-width="2"/></svg>';
  const I_SEND = '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><path d="M1 2h14v9H7l-4 3.5V11H1z" fill="#fff" stroke="#000" stroke-width=".8"/><path d="M3.5 5h9M3.5 7.5h6" stroke="#1a4ea8" stroke-width="1.2"/></svg>';

  // ================================================================ CSS
  if (!$('jsn-m-css')) {
    const st = h('style'); st.id = 'jsn-m-css';
    st.textContent = `
.jm{display:flex;flex-direction:column;height:100%;min-height:0;font:11px Tahoma,Verdana,sans-serif;color:#000}
.appwin > .appbody.jm-body{padding:0;display:flex;flex-direction:column}
.jm-tool{display:flex;gap:2px;padding:3px 4px;border-bottom:1px solid #808080;box-shadow:0 1px #fff;flex:none}
.jm-tool button{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:46px;padding:2px 4px;background:none;border:1px solid transparent;font:11px Tahoma,sans-serif;color:#000;cursor:pointer}
.jm-tool button:hover{border-color:#fff #808080 #808080 #fff}
.jm-tool button:active{border-color:#808080 #fff #fff #808080}
.jm-tool button:disabled{color:#808080;cursor:default;border-color:transparent}
.jm-tool button:disabled svg{opacity:.4}
.jm-main{flex:1;min-height:0;margin:4px;background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;overflow:auto;display:flex;flex-direction:column}
.jm-band{display:flex;align-items:center;gap:6px;padding:6px 8px;background:linear-gradient(90deg,#1a4ea8,#4f8ae0 60%,#9cc0f4);color:#fff;font:bold 12px Tahoma,sans-serif;flex:none}
.jm-band .jsn-logo{font-size:18px;letter-spacing:-1px}
.jm-band .jsn-logo:after{display:none}
.jm-me{display:flex;align-items:center;gap:4px;padding:6px 6px 2px;cursor:pointer;flex:none;border:0;background:none;font:11px Tahoma,sans-serif;text-align:left;color:#000;width:100%}
.jm-me b{font-size:12px}
.jm-me .jm-mst{color:#555}
.jm-me .jm-dd{margin-left:auto;font-size:9px}
.jm-mail{display:flex;align-items:center;gap:4px;padding:2px 6px 6px 8px;border-bottom:1px dotted #9aa;flex:none}
.jm-mail a{color:#0000ee;cursor:pointer;text-decoration:underline}
.jm-mail a.zero{color:#555}
.jm-list{padding:3px 2px 6px;flex:1}
.jm-grp{display:flex;align-items:center;gap:3px;width:100%;padding:3px 2px;border:0;background:none;font:bold 11px Tahoma,sans-serif;color:#1a3a8a;cursor:pointer;text-align:left}
.jm-grp i{font-style:normal;display:inline-block;width:9px;height:9px;border:1px solid #808080;font:bold 9px/8px monospace;text-align:center;color:#000;background:#fff}
.jm-row{display:flex;align-items:center;gap:4px;padding:2px 4px 2px 16px;min-height:20px;cursor:default;outline:0;user-select:none}
.jm-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jm-row em{font-style:normal;color:#555}
.jm-row.off{color:#555}
.jm-row.sel{background:#000080;color:#fff}.jm-row.sel em{color:#ddd}
.jm-row:focus-visible{outline:1px dotted #000}
.jm-none{padding:2px 4px 4px 18px;color:#808080;font-style:italic}
.jm-out{padding:18px 10px;text-align:center;line-height:1.5}
.jm-out a{color:#0000ee;text-decoration:underline;cursor:pointer;font-weight:bold}
.jm-out .big{display:block;margin:4px auto 10px}
.jm-out.busy .big svg{animation:jsnhop .5s steps(2) infinite}
@keyframes jsnhop{50%{transform:translateY(-4px)}}
.jm-dots:after{content:"";animation:jsndots 1.6s steps(4) infinite}
@keyframes jsndots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}
.jm-foot{display:flex;align-items:center;gap:6px;padding:2px 6px 4px;flex:none}
.jm-foot .jsn-logo{font-size:15px;letter-spacing:-1px}.jm-foot .jsn-logo:after{display:none}
.jm-foot a{color:#0000ee;text-decoration:underline;cursor:pointer}
.jc{display:flex;flex-direction:column;height:100%;min-height:0;gap:3px;font:11px Tahoma,Verdana,sans-serif}
.appwin > .appbody.jc-body{padding:4px;display:flex;flex-direction:column}
.jc-to{display:flex;align-items:center;gap:4px;padding:3px 4px;background:#fff;border:1px solid;border-color:#808080 #fff #fff #808080;flex:none;min-width:0}
.jc-to span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jc-to .jc-addr{color:#555}
.jc-warn{padding:2px 4px;color:#555;font-style:italic;flex:none}
.jc-log{flex:1;min-height:70px;overflow:auto;background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;padding:4px 6px;font:13px Arial,sans-serif;overflow-wrap:anywhere}
.jc-h{color:#555;margin-top:5px;font:12px Arial,sans-serif}
.jc-h:first-child{margin-top:0}
.jc-t{padding-left:14px;white-space:pre-wrap;color:#000}
.jc-t.mine{color:#000}
.jc-sys{color:#808080;font:italic 11px Tahoma,sans-serif;margin:5px 0 2px}
.jc-fail{color:#c00000;margin-top:5px;font:12px Arial,sans-serif}
.jc-t.gray{color:#808080}
.jc-send{display:flex;gap:4px;flex:none;align-items:stretch}
.jc-send textarea{flex:1;min-width:0;height:46px;resize:none;font:13px Arial,sans-serif;border:2px solid;border-color:#808080 #fff #fff #808080;padding:2px 4px}
.jc-send .btn{min-width:64px;font-weight:bold}
.tbtn.jsn-flash{animation:jsnflash 1s steps(1) infinite}
@keyframes jsnflash{50%{background:#000080;color:#fff}}
.jd{font:11px Tahoma,sans-serif;line-height:1.4}
.jd p{margin:0 0 7px}
.jd input[type=text]{width:100%;box-sizing:border-box}
.jd-pick{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px;max-height:84px;overflow:auto}
.jd-pick button{font:11px Tahoma,sans-serif;padding:1px 6px}
.jd-res{margin-top:8px;padding:6px;background:#fff;border:1px solid #808080;display:flex;gap:8px;align-items:flex-start}
.jd-res[hidden]{display:none}
.jd-btns{display:flex;justify-content:flex-end;gap:6px;margin-top:10px}
.jd-btns .btn{min-width:72px}
.jd-tabs{display:flex;gap:0;margin-bottom:-2px;position:relative;z-index:1}
.jd-tabs button{font:11px Tahoma,sans-serif;padding:3px 9px;border:2px solid;border-color:#fff #404040 transparent #fff;border-bottom:0;background:#c0c0c0;margin-top:2px;cursor:pointer}
.jd-tabs button.on{margin-top:0;padding-bottom:5px}
.jd-page{border:2px solid;border-color:#fff #404040 #404040 #fff;padding:10px;min-height:170px}
.jd-page label{display:flex;gap:5px;align-items:flex-start;margin:0 0 7px}
.jd-two{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center}
.jd-two select{width:100%;height:110px;font:11px Tahoma,sans-serif}
.jd-two .mid{display:flex;flex-direction:column;gap:6px}
.jd-ab{display:flex;gap:10px;align-items:flex-start}
.jd-ab button.pp{border:0;background:none;padding:0;cursor:pointer}
`;
    document.head.appendChild(st);
  }

  // ================================================================ state
  const M = {
    running: false, state: 'off', // off | connecting | on
    me: null, st: store.get('jhp_jsn_st', 'NLN'), contacts: new Map(), al: [], bl: [], reqs: [],
    convs: new Map(), list: null, tray: null, sel: null, closed: { on: false, off: false }, autoAway: false, wasOn: false, signTimer: 0,
  };
  if (!MY_ST.includes(M.st)) M.st = 'NLN';
  const prefs = () => J.prefs();
  const setPref = (k, v) => { const p = prefs(); p[k] = v; store.set('jhp_jsn_prefs', p); };

  // ================================================================ sound: a little "ding" (respects the speaker in the tray)
  let ac = null;
  function tone(f, d, at) {
    if (window.Sound && Sound.note) { setTimeout(() => { try { Sound.note(f, d, 'sine'); } catch (e) {} }, at); return; }
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const t = ac.currentTime + at / 1000, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(Sound.output(ac)); o.start(t); o.stop(t + d + 0.05); } catch (e) {}
  }
  function ding(kind) {
    if (!prefs().sound) return;
    if (kind === 'in') { tone(784, 0.14, 0); tone(1047, 0.14, 120); tone(1319, 0.3, 240); }
    else { tone(1319, 0.12, 0); tone(988, 0.35, 130); }
  }

  // ================================================================ toasts (bottom right, above the tray)
  function toasts() { let c = qs(document.body, '.jsn-toasts'); if (!c) { c = h('div', 'jsn-toasts'); c.setAttribute('aria-live', 'polite'); DesktopSurface.root().appendChild(c); } return c; }
  function toast(html, onClick, ms) {
    const c = toasts();
    while (c.children.length >= 3) c.firstChild.remove();
    const t = h('div', 'jsn-toast', `<div class="jt-h">${people('on', 14)}<span>JSN Messenger Service</span><button type="button" aria-label="Close">x</button></div><div class="jt-b"><span>${html}</span></div>`);
    const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 450); };
    qs(t, 'button').addEventListener('click', ev => { ev.stopPropagation(); kill(); });
    t.addEventListener('click', () => { kill(); if (onClick) onClick(); });
    c.appendChild(t);
    setTimeout(kill, ms || 5500);
    return t;
  }

  // ================================================================ talking to the server
  const send = m => Net.send(m);
  function signIn(quiet) {
    if (!M.running) return;
    if (!quiet && window.Guest && Guest.is()) return Guest.need('JSN Messenger', () => signIn(quiet));
    if (M.state !== 'off') return;
    if (!Net.connected) { if (!quiet) Desk.msgbox('JSN Messenger Service', 'JSN Messenger Service could not connect to the server.\n\nCheck that your computer is connected to the Internet (is Mom on the phone?), then try again.', 'warn'); return; }
    if (!Net.me.member) { if (!quiet) passport(); return; }
    M.state = 'connecting'; render();
    clearTimeout(M.signTimer);
    setTimeout(() => { if (M.state === 'connecting') send({ t: 'jsnIn', st: M.st }); }, quiet ? 300 : 1300);
    M.signTimer = setTimeout(() => { if (M.state === 'connecting') { M.state = 'off'; render(); if (!quiet) Desk.msgbox('JSN Messenger Service', 'The JSN Messenger Service server is not responding. Please try again later.', 'warn'); } }, 12000);
  }
  function signOut() {
    if (M.state === 'off') return;
    send({ t: 'jsnOut' });
    wentOff();
  }
  function wentOff() {
    M.state = 'off'; M.wasOn = false; M.autoAway = false;
    for (const c of M.contacts.values()) c.st = 'FLN';
    M.convs.forEach(cv => updConv(cv));
    render();
  }
  function passport() {
    Desk.msgbox('JSN Messenger Service', 'You need a JackNet Passport. Log on to JackNet first.\n\n(Every JackNet member has one: it\'s your member name and password. Guests can\'t sign in.)', 'info',
      [['Log On...', () => { if (window.JackLogon) JackLogon.show(); }], ['Cancel']]);
  }
  Net.on('jsnHi', m => {
    if (!M.running || !m || !m.me || !okName(m.me.name)) return;
    clearTimeout(M.signTimer);
    M.state = 'on'; M.wasOn = true;
    M.me = { name: m.me.name, no: m.me.no | 0 };
    if (MY_ST.includes(m.me.st)) M.st = m.me.st;
    M.contacts.clear();
    (Array.isArray(m.fl) ? m.fl : []).forEach(c => { if (c && okName(c.name)) M.contacts.set(lc(c.name), { name: c.name, no: c.no | 0, st: ST[c.st] ? c.st : 'FLN' }); });
    M.al = (Array.isArray(m.al) ? m.al : []).filter(okName); M.bl = (Array.isArray(m.bl) ? m.bl : []).filter(okName);
    (Array.isArray(m.rl) ? m.rl : []).forEach(r => { if (r && okName(r.name)) queueReq(r.name, r.no | 0); });
    S('signin');
    render(); M.convs.forEach(cv => updConv(cv));
  });
  Net.on('jsnBye', m => {
    if (M.state === 'off') return;
    wentOff();
    if (m && m.why === 'logoff') toast('You have been signed out of JSN Messenger because you logged off JackNet.', () => openList(), 6000);
  });
  Net.on('jsnErr', m => {
    const e = m && m.err;
    if (e === 'passport' || e === 'signin') { if (M.state !== 'off') wentOff(); if (e === 'passport' && M.running && !M.quietFail) passport(); return; }
    if (addDlg && !addDlg.w.closed) addDlg.result(e, m.to);
  });
  Net.on('jsnMe', m => { if (m && MY_ST.includes(m.st)) { M.st = m.st; store.set('jhp_jsn_st', m.st === 'AWY' && M.autoAway ? 'NLN' : m.st); render(); } });
  Net.on('jsnPres', m => {
    if (!m || !okName(m.name) || M.state !== 'on') return;
    const k = lc(m.name), c = M.contacts.get(k), st = ST[m.st] ? m.st : 'FLN';
    if (!c) return;
    const was = c.st; c.st = st;
    render();
    const cv = M.convs.get(k);
    if (cv) { updConv(cv); if (was !== 'FLN' && st === 'FLN') sys(cv, `${c.name} has signed out. Messages you send now can't be delivered.`); else if (was === 'FLN' && st !== 'FLN') sys(cv, `${c.name} has signed in.`); }
    if (m.sign && prefs().alerts) { S('toast'); ding('in'); toast(`<b>${esc(c.name)}</b> has just signed in.`, () => openConv(c.name), 6000); }
  });
  Net.on('jsnReq', m => { if (m && okName(m.name) && M.state === 'on') queueReq(m.name, m.no | 0); });
  Net.on('jsnLists', m => {
    if (!m) return;
    if (Array.isArray(m.al)) M.al = m.al.filter(okName);
    if (Array.isArray(m.bl)) M.bl = m.bl.filter(okName);
    if (privPaint) privPaint();
    render();
  });
  Net.on('jsnAdded', m => {
    const c = m && m.c; if (!c || !okName(c.name)) return;
    M.contacts.set(lc(c.name), { name: c.name, no: c.no | 0, st: ST[c.st] ? c.st : 'FLN' });
    render();
    if (!m.quiet && addDlg && !addDlg.w.closed) addDlg.result('ok', c);
  });
  Net.on('jsnDeleted', m => { if (m && typeof m.name === 'string') { M.contacts.delete(lc(m.name)); render(); } });
  Net.on('jsnAck', m => {
    const p = m && pend.get(String(m.cid)); if (!p) return; pend.delete(String(m.cid));
    if (m.ok) { if (!store.get('jhp_jsn_sent', 0)) store.set('jhp_jsn_sent', 1); S('firstim'); return; }
    const why = m.err === 'hidden' ? "(You can't send instant messages while you Appear Offline.)" : m.err === 'slow' ? '(Slow down! You are typing faster than the server.)' : '';
    fail(p.cv, p.text, why);
  });
  Net.on('jsnMsg', m => {
    if (!m || !okName(m.from) || typeof m.text !== 'string' || M.state !== 'on') return;
    const text = m.text.slice(0, 400);
    const k = lc(m.from);
    const fresh = !M.convs.has(k) || M.convs.get(k).w.closed;
    const cv = openConv(m.from, { quiet: true });
    line(cv, m.from, text);
    cv.w.status.textContent = `Last message received at ${hhmm(m.ts)} on ${d99()}.`;
    ding('msg');
    const top = cv.w.el.style.display !== 'none' && !cv.w.el.classList.contains('inactive') && (!Desk.isActive || Desk.isActive(cv.w.el));
    if (!top || fresh) {
      cv.w.task.classList.add('jsn-flash');
      if (prefs().alerts) toast(`<b>${esc(m.from)}</b> says:<br>${esc(text.length > 70 ? text.slice(0, 68) + '...' : text)}`, () => { cv.w.restore(); unflash(cv); }, 6000);
    }
  });
  Net.on('welcome', () => { if (M.running && M.state !== 'off') { const was = M.wasOn; wentOff(); M.wasOn = was; } if (M.running && (M.wasOn || prefs().autostart) && Net.me.member) { M.quietFail = true; signIn(true); setTimeout(() => { M.quietFail = false; }, 3000); } render(); });
  Net.on('_close', () => { if (M.state !== 'off') { const was = M.wasOn; wentOff(); M.wasOn = was; } });
  Net.on('loginOk', () => { if (M.running && M.state === 'off') signIn(true); });
  Net.on('you', m => { if (m && !m.member && M.state !== 'off') wentOff(); });

  function setStatus(st, auto) {
    if (!MY_ST.includes(st)) return;
    M.st = st; if (!auto) { M.autoAway = false; store.set('jhp_jsn_st', st); }
    const tried = new Set(store.get('jhp_jsn_tried', [])); tried.add(st); store.set('jhp_jsn_tried', [...tried]);
    if (MY_ST.every(x => tried.has(x))) S('status');
    if (M.state === 'on') send({ t: 'jsnSt', st }); else if (M.state === 'off' && !auto) signIn();
    render();
  }
  // "Show me as Away when I'm inactive for 5 minutes"
  let lastAct = Date.now();
  const IDLE = () => (M.idleMs || 5 * 60000);
  ['pointerdown', 'keydown', 'wheel'].forEach(ev => document.addEventListener(ev, () => {
    lastAct = Date.now();
    if (M.autoAway && M.state === 'on') { M.autoAway = false; setStatus('NLN', true); }
  }, { capture: true, passive: true }));
  setInterval(() => {
    if (M.state !== 'on' || !prefs().away || M.st !== 'NLN' || M.autoAway) return;
    if (Date.now() - lastAct > IDLE()) { M.autoAway = true; setStatus('AWY', true); S('idle'); }
  }, 5000);

  // ================================================================ the tray icon
  function trayDraw() {
    if (!M.tray) return;
    const st = M.state === 'on' ? M.st : 'FLN';
    M.tray.innerHTML = icon(st, 16);
    M.tray.classList.toggle('jsn-spin', M.state === 'connecting');
    const t = M.state === 'on' ? `JSN Messenger Service - ${label(M.st)}` : M.state === 'connecting' ? 'JSN Messenger Service - Signing in...' : 'JSN Messenger Service - Not signed in';
    M.tray.title = t; M.tray.setAttribute('aria-label', t);
  }
  function trayMenu() {
    return [{ label: 'Open JSN Messenger Service', act: openList },
      M.state === 'on' ? { label: 'My Status', sub: statusItems } : null,
      '-',
      M.state === 'off' ? { label: 'Sign In', act: () => signIn() } : { label: 'Sign Out', act: signOut },
      { label: 'Exit', act: () => stop() }].filter(Boolean);
  }
  function makeTray() {
    const tr = $('tray'); if (!tr || M.tray) return;
    M.tray = h('button', 'jsn-tray sys-tray'); M.tray.type = 'button';
    tr.insertBefore(M.tray, $('clock') || null);
    M.tray.addEventListener('click', ev => { ev.stopPropagation(); const un = [...M.convs.values()].find(cv => !cv.w.closed && cv.w.task.classList.contains('jsn-flash')); if (un) { un.w.restore(); unflash(un); return; } openList(); });
    M.tray.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); const r = M.tray.getBoundingClientRect(); IE.menu(trayMenu(), Math.max(4, r.left - 150), r.top - 120); });
    trayDraw();
  }
  const statusItems = () => MY_ST.map(k => ({ label: label(k), icon: icon(k), key: M.st === k ? '\u2714' : '', act: () => setStatus(k) }));

  // ================================================================ the contact list
  function mailCount() { const t = qs(document, '#tray .mg-tray'); const m = t && /(\d+)/.exec(t.title || ''); return m ? +m[1] : 0; }
  function openList() {
    if (!M.running) start();
    if (M.list && !M.list.closed) { M.list.restore(); return M.list; }
    const b = h('div', 'jm');
    const w = A.win('JSN Messenger Service', b, { w: 248, h: Math.min(470, DesktopSurface.height() - 60), menubar: true, status: true, icon: people('on', 16), minW: 200, minH: 260, x: DesktopSurface.width() - Math.min(248, DesktopSurface.width() - 8) - 8, y: 16, onClose: () => { M.list = null; } });
    w.body.classList.add('jm-body');
    M.list = w;
    A.menubar(w, [
      ['File', () => [
        M.state === 'off' ? { label: 'Sign In', act: () => signIn() } : { label: 'Sign Out', act: signOut },
        '-',
        { label: 'Send an Instant Message...', dis: M.state !== 'on', act: sendPicker },
        { label: 'Add a Contact...', dis: M.state !== 'on', act: addContact },
        '-',
        { label: 'Close', act: () => w.close() },
        { label: 'Exit', act: () => stop() },
      ]],
      ['Tools', () => [
        { label: 'My Status', dis: M.state === 'connecting', sub: statusItems },
        { label: 'Delete Contact', dis: M.state !== 'on' || !M.sel, act: () => M.sel && delContact(M.sel) },
        '-',
        { label: 'Options...', act: () => options(0) },
        { label: 'Privacy...', dis: M.state !== 'on', act: () => options(2) },
      ]],
      ['Help', [
        { label: 'Help Topics', act: help },
        { label: 'JSN Messenger Service on the Web', act: () => J.openSite('/messenger.html') },
        '-',
        { label: 'About JSN Messenger Service', act: about },
      ]],
    ]);
    render();
    return w;
  }
  function render() {
    trayDraw();
    const w = M.list; if (!w || w.closed) return;
    const b = qs(w.el, '.jm'); if (!b) return;
    const on = M.state === 'on';
    const all = [...M.contacts.values()].sort((a, b2) => a.name.localeCompare(b2.name));
    const onl = all.filter(c => c.st !== 'FLN'), off = all.filter(c => c.st === 'FLN');
    const row = c => `<div class="jm-row${c.st === 'FLN' ? ' off' : ''}${M.sel === lc(c.name) ? ' sel' : ''}" tabindex="0" role="option" data-k="${esc(lc(c.name))}" title="${esc(c.name)} &lt;${esc(mailOf(c.name))}&gt;">${icon(M.bl.includes(c.name) ? 'FLN' : c.st)}<span>${esc(c.name)}${c.st !== 'FLN' && c.st !== 'NLN' ? ` <em>(${esc(label(c.st))})</em>` : ''}${M.bl.some(x => lc(x) === lc(c.name)) ? ' <em>(Blocked)</em>' : ''}</span></div>`;
    const grp = (id, name, list, none) => `<button type="button" class="jm-grp" data-g="${id}"><i>${M.closed[id] ? '+' : '-'}</i>${name} (${list.length})</button>${M.closed[id] ? '' : list.length ? list.map(row).join('') : `<div class="jm-none">${none}</div>`}`;
    const n = mailCount();
    let main;
    if (on) main = `<button type="button" class="jm-me" data-me title="Click to change your status">${icon(M.st)}<b>${esc(M.me.name)}</b> <span class="jm-mst">(${esc(label(M.st))})</span><span class="jm-dd">&#9660;</span></button>
<div class="jm-mail">${ENV}<a data-mail class="${n ? '' : 'zero'}">${n} new e-mail message(s)</a></div>
<div class="jm-list" role="listbox" aria-label="Contacts">${grp('on', 'Online', onl, 'None of your contacts are online.')}${grp('off', 'Not Online', off, all.length ? 'Everyone is online!' : 'Click <b>Add</b> to add your mates by their JackNet member name or number.')}</div>`;
    else if (M.state === 'connecting') main = `<div class="jm-out busy"><span class="big">${people('on', 48)}</span><b>Signing in<span class="jm-dots"></span></b><br><span style="color:#555">Contacting the JSN Messenger Service</span></div>`;
    else main = `<div class="jm-out"><span class="big">${people('off', 48)}</span>You are not signed in.<br><br><a data-signin>Click here to sign in</a><br><br><span style="color:#555">${Net.me.member ? `You will sign in with your JackNet Passport: <b>${esc(Net.me.nick)}</b>` : 'You need a JackNet Passport. Log on to JackNet as a member first.'}</span></div>`;
    b.innerHTML = `<div class="jm-tool"><button type="button" data-a="add" ${on ? '' : 'disabled'}>${I_ADD}<span>Add</span></button><button type="button" data-a="send" ${on ? '' : 'disabled'}>${I_SEND}<span>Send</span></button><button type="button" data-a="status" ${M.state === 'connecting' ? 'disabled' : ''}>${icon(on ? M.st : 'FLN', 20)}<span>Status</span></button></div>
<div class="jm-main"><div class="jm-band">${J.LOGO_TXT}<span>Messenger Service</span></div>${main}</div>
<div class="jm-foot">${J.LOGO_TXT}<a data-site>Go to JSN</a></div>`;
    w.status.textContent = on ? `Signed in as ${M.me.name}` : M.state === 'connecting' ? 'Signing in...' : 'Not signed in';
    wireList(b);
  }
  function wireList(b) {
    b.addEventListener('click', ev => {
      const t = ev.target;
      const a = t.closest('[data-a]');
      if (a) { const k = a.dataset.a; if (k === 'add') addContact(); else if (k === 'send') { const c = M.sel && M.contacts.get(M.sel); if (c && c.st !== 'FLN') openConv(c.name); else sendPicker(); } else { const r = a.getBoundingClientRect(); IE.menu(statusItems(), r.left, r.bottom); } return; }
      if (t.closest('[data-signin]')) return signIn();
      if (t.closest('[data-site]')) return J.openSite('/');
      if (t.closest('[data-mail]')) return A.open('outlook');
      if (t.closest('[data-me]')) { const r = t.closest('[data-me]').getBoundingClientRect(); IE.menu(statusItems(), r.left + 20, r.bottom); return; }
      const g = t.closest('[data-g]'); if (g) { M.closed[g.dataset.g] = !M.closed[g.dataset.g]; render(); return; }
      const row = t.closest('.jm-row');
      if (row) { M.sel = row.dataset.k; qsa(b, '.jm-row').forEach(x => x.classList.toggle('sel', x === row)); if (touch()) rowAct(row.dataset.k, row); }
    });
    b.addEventListener('dblclick', ev => { const row = ev.target.closest('.jm-row'); if (row && !touch()) rowAct(row.dataset.k, row, true); });
    b.addEventListener('keydown', ev => { const row = ev.target.closest('.jm-row'); if (row && ev.key === 'Enter') rowAct(row.dataset.k, row, true); if (row && (ev.key === 'Delete')) delContact(row.dataset.k); });
    b.addEventListener('contextmenu', ev => { const row = ev.target.closest('.jm-row'); if (!row) return; ev.preventDefault(); M.sel = row.dataset.k; render(); IE.menu(rowMenu(row.dataset.k), ev.clientX, ev.clientY); });
  }
  function rowAct(k, row, dbl) {
    const c = M.contacts.get(k); if (!c) return;
    if (c.st !== 'FLN') return openConv(c.name);
    if (touch() && !dbl) { const r = row.getBoundingClientRect(); IE.menu(rowMenu(k), r.left + 30, r.bottom); return; }
    Desk.msgbox('JSN Messenger Service', `${c.name} is not online right now, so you can't send them an instant message.\n\nYou can send them an e-mail instead, or wait for the little pop-up that says they've signed in.`, 'info');
  }
  function rowMenu(k) {
    const c = M.contacts.get(k); if (!c) return [];
    const blocked = M.bl.some(x => lc(x) === k);
    return [{ label: 'Send an Instant Message', dis: c.st === 'FLN', act: () => openConv(c.name) },
      { label: 'Invite to a game...', dis: c.st === 'FLN' || !window.MP || !MP.peerByNick(c.name), act: () => MP.chooseGame(MP.peerByNick(c.name)) },
      { label: 'Send E-mail', act: () => { if (window.JackFiles && JackFiles.compose) { try { JackFiles.compose({ to: mailOf(c.name) }); return; } catch (e) {} } A.open('outlook'); } },
      '-',
      { label: blocked ? 'Unblock' : 'Block', act: () => setBlock(c.name, !blocked) },
      { label: 'Delete Contact', act: () => delContact(k) },
      '-',
      { label: 'Properties', act: () => Desk.msgbox(c.name + ' Properties', `Name: ${c.name}\nE-mail: ${mailOf(c.name)}\nJackNet member number: ${c.no || '?'}\nStatus: ${label(c.st)}${blocked ? '\n\nYou have blocked this person. They can\'t see when you are online or send you messages.' : ''}`, 'info') }];
  }
  function delContact(k) {
    const c = M.contacts.get(k); if (!c) return;
    Desk.msgbox('JSN Messenger Service', `Are you sure you want to delete ${c.name} from your contact list?`, 'q', [['Yes', () => { send({ t: 'jsnDel', name: c.name }); M.contacts.delete(k); if (M.sel === k) M.sel = null; render(); }], ['No']]);
  }
  function setBlock(name, on) {
    send({ t: 'jsnAllow', name, allow: !on });
    if (on) { S('block'); M.bl = M.bl.filter(x => lc(x) !== lc(name)).concat(name); M.al = M.al.filter(x => lc(x) !== lc(name)); }
    else { M.al = M.al.filter(x => lc(x) !== lc(name)).concat(name); M.bl = M.bl.filter(x => lc(x) !== lc(name)); }
    render(); if (privPaint) privPaint();
  }

  // ================================================================ dialogs: Add a Contact, Send to..., "X has added you", Options, About
  let addDlg = null;
  function addContact() {
    if (M.state !== 'on') return signIn();
    if (addDlg && !addDlg.w.closed) { addDlg.w.restore(); return; }
    const b = h('div', 'jd', `<p><b>Add a Contact</b></p><p>Type your contact's JackNet member name or member number, or their JackMail address:</p>
<form class="jd-f"><input type="text" class="jd-in" maxlength="40" autocomplete="off" spellcheck="false" aria-label="Member name or number" placeholder="e.g. Dave or 42 or dave@jackmail.webcom"></form>
<div class="jd-on"></div><div class="jd-res" hidden></div>
<div class="jd-btns"><button class="btn" type="button" data-b="ok">OK</button><button class="btn" type="button" data-b="x">Cancel</button></div>`);
    const w = A.win('Add a Contact', b, { w: 340, icon: people('on', 16), noResize: true, noMax: true, escClose: true });
    const inp = qs(b, '.jd-in'), res = qs(b, '.jd-res');
    const online = J.online.filter(o => o.member && okName(o.nick) && (!M.me || lc(o.nick) !== lc(M.me.name)) && !M.contacts.has(lc(o.nick)));
    if (online.length) { qs(b, '.jd-on').innerHTML = `<small>JackNet members on the site right now (click one):</small><div class="jd-pick">${online.slice(0, 30).map(o => `<button type="button" class="btn" data-pick="${esc(o.nick)}">${esc(o.nick)}</button>`).join('')}</div>`; }
    let busy = false;
    const go = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } busy = true; res.hidden = false; res.innerHTML = 'Looking them up<span class="jm-dots"></span>'; send({ t: 'jsnAdd', to: v }); };
    qs(b, '.jd-f').addEventListener('submit', ev => { ev.preventDefault(); go(); });
    b.addEventListener('click', ev => {
      const p = ev.target.closest('[data-pick]'); if (p) { inp.value = p.dataset.pick; go(); return; }
      const bt = ev.target.closest('[data-b]'); if (!bt) return;
      if (bt.dataset.b === 'x') w.close(); else if (busy === 'done') w.close(); else go();
    });
    setTimeout(() => inp.focus(), 30);
    addDlg = { w, result(kind, x) {
      busy = kind === 'ok' ? 'done' : false; res.hidden = false;
      if (kind === 'ok') {
        res.innerHTML = `${people(x.st === 'FLN' ? 'off' : 'on', 32)}<div><b>Success!</b> ${esc(x.name)} has been added to your contact list.${x.st === 'FLN' ? `<br><br><span style="color:#555">${esc(x.name)} will be asked to let you see them. Until they say yes (or while they're not signed in), they'll show as Not Online.</span>` : ''}</div>`;
        qs(b, '[data-b=ok]').textContent = 'Finish'; qs(b, '[data-b=x]').hidden = true; inp.value = '';
      } else res.innerHTML = { nouser: `Sorry, there is no JackNet member called <b>${esc(x || '')}</b>. Check the spelling, or ask them for their member number.`, self: "That's you! You can't add yourself. (Nice try.)", full: 'Your contact list is full! Delete somebody first.', slow: 'Slow down! Wait a few seconds and try again.' }[kind] || 'Something went wrong. Try again.';
    } };
  }
  function sendPicker() {
    if (M.state !== 'on') return signIn();
    const onl = [...M.contacts.values()].filter(c => c.st !== 'FLN').sort((a, b) => a.name.localeCompare(b.name));
    if (!onl.length) return Desk.msgbox('Send an Instant Message', 'None of your contacts are online right now.\n\nWhen somebody signs in, a little window pops up at the bottom of the screen.', 'info');
    const b = h('div', 'jd', `<p>Select the person you want to send an instant message to:</p><select size="6" style="width:100%;font:12px Tahoma,sans-serif">${onl.map((c, i) => `<option value="${esc(c.name)}"${i ? '' : ' selected'}>${esc(c.name)}${c.st !== 'NLN' ? ' (' + esc(label(c.st)) + ')' : ''}</option>`).join('')}</select><div class="jd-btns"><button class="btn" type="button" data-b="ok">OK</button><button class="btn" type="button" data-b="x">Cancel</button></div>`);
    const w = A.win('Send an Instant Message', b, { w: 300, icon: people('on', 16), noResize: true, noMax: true, escClose: true });
    const sel = qs(b, 'select');
    const ok = () => { const v = sel.value; w.close(); if (v) openConv(v); };
    sel.addEventListener('dblclick', ok);
    qs(b, '[data-b=ok]').addEventListener('click', ok); qs(b, '[data-b=x]').addEventListener('click', () => w.close());
  }
  const reqQ = []; let reqWin = null;
  function queueReq(name, no) { if (reqQ.some(r => lc(r.name) === lc(name)) || (reqWin && !reqWin.w.closed && lc(reqWin.name) === lc(name))) return; reqQ.push({ name, no }); nextReq(); }
  function nextReq() {
    if ((reqWin && !reqWin.w.closed) || !reqQ.length || M.state !== 'on') return;
    const r = reqQ.shift();
    const has = M.contacts.has(lc(r.name));
    const b = h('div', 'jd', `<div class="jd-ab">${people('on', 32)}<div><p><b>${esc(r.name)}</b> (${esc(mailOf(r.name))}) has added you to their contact list.</p><p>Do you want to:</p>
<label><input type="radio" name="jra" value="1" checked> Allow this person to see when you are online and contact you</label>
<label><input type="radio" name="jra" value="0"> Block this person from seeing when you are online and contacting you</label>
${has ? '' : '<label><input type="checkbox" class="jra-add" checked> Add this person to my contact list</label>'}</div></div><div class="jd-btns"><button class="btn" type="button" data-b="ok">OK</button></div>`);
    const w = A.win('JSN Messenger Service', b, { w: 380, icon: people('on', 16), noResize: true, noMax: true, noMin: true, onClose: () => setTimeout(nextReq, 300) });
    reqWin = { w, name: r.name };
    ding('in');
    qs(b, '[data-b=ok]').addEventListener('click', () => {
      const allow = qs(b, 'input[name=jra]:checked').value === '1', add = allow && !!(qs(b, '.jra-add') && qs(b, '.jra-add').checked);
      send({ t: 'jsnAllow', name: r.name, allow, add });
      if (!allow) S('block');
      w.close();
    });
  }
  let privPaint = null;
  function options(tab) {
    const p = prefs();
    const b = h('div', 'jd', `<div class="jd-tabs"><button type="button" data-t="0">Personal</button><button type="button" data-t="1">Preferences</button><button type="button" data-t="2">Privacy</button></div>
<div class="jd-page" data-p="0"><div class="jd-ab">${people('on', 32)}<div><p><b>My JackNet Passport</b></p><p>${M.me ? `Sign-in name: <b>${esc(M.me.name)}</b><br>E-mail: ${esc(mailOf(M.me.name))}<br>JackNet member number: ${M.me.no}` : Net.me.member ? `Sign-in name: <b>${esc(Net.me.nick)}</b>` : "You haven't got a Passport yet. Log on to JackNet as a member to get one (it's free!)."}</p><p style="color:#555">Your friends see your member name. To change it you'd need a whole new JackNet membership. (Choose wisely.)</p></div></div></div>
<div class="jd-page" data-p="1" hidden><label><input type="checkbox" data-o="autostart"> Run this program when JackOS starts</label><label><input type="checkbox" data-o="away"> Show me as "Away" when I'm inactive for 5 minutes</label><label><input type="checkbox" data-o="alerts"> Display alerts when contacts come online or send me a message</label><label><input type="checkbox" data-o="sound"> Play a sound (needs the speaker in the tray turned on)</label></div>
<div class="jd-page" data-p="2" hidden><p>My Allow List can see my online status and send me messages. My Block List can't.</p><div class="jd-two"><div><small>My Allow List</small><select multiple data-l="al"></select></div><div class="mid"><button class="btn" type="button" data-mv="bl">Block &gt;&gt;</button><button class="btn" type="button" data-mv="al">&lt;&lt; Allow</button></div><div><small>My Block List</small><select multiple data-l="bl"></select></div></div></div>
<div class="jd-btns"><button class="btn" type="button" data-b="ok">OK</button></div>`);
    const w = A.win('Options', b, { w: 380, icon: people('on', 16), noResize: true, noMax: true, escClose: true, onClose: () => { privPaint = null; } });
    const show = i => { qsa(b, '.jd-tabs button').forEach(x => x.classList.toggle('on', +x.dataset.t === i)); qsa(b, '.jd-page').forEach(x => { x.hidden = +x.dataset.p !== i; }); };
    show(tab | 0);
    qsa(b, '[data-o]').forEach(c => { c.checked = !!p[c.dataset.o]; c.addEventListener('change', () => setPref(c.dataset.o, c.checked)); });
    privPaint = () => { ['al', 'bl'].forEach(k => { const s = qs(b, `[data-l=${k}]`); s.innerHTML = M[k].slice().sort().map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join(''); }); };
    privPaint();
    b.addEventListener('click', ev => {
      const t = ev.target.closest('[data-t]'); if (t) return show(+t.dataset.t);
      const mv = ev.target.closest('[data-mv]');
      if (mv) { if (M.state !== 'on') return; const from = qs(b, `[data-l=${mv.dataset.mv === 'bl' ? 'al' : 'bl'}]`); [...from.selectedOptions].forEach(o => setBlock(o.value, mv.dataset.mv === 'bl')); return; }
      if (ev.target.closest('[data-b=ok]')) w.close();
    });
  }
  function about() {
    const b = h('div', 'jd', `<div class="jd-ab"><button type="button" class="pp" aria-label="The little people">${people('on', 48)}</button><div><p><b>JSN Messenger Service</b><br>Version 1.0 (build 99.0722)</p><p>Copyright &copy; 1999 JSN - the JackNet Network.<br>All rights reserved.</p><p>Sign in with your JackNet Passport. Only JackNet members can use the JSN Messenger Service.</p><p style="color:#555">Never tell anyone your password. Not even a really nice one.</p></div></div><div class="jd-btns"><button class="btn" type="button" data-b="ok">OK</button></div>`);
    const w = A.win('About JSN Messenger Service', b, { w: 340, icon: people('on', 16), noResize: true, noMax: true, noMin: true, escClose: true });
    let n = 0;
    qs(b, '.pp').addEventListener('click', () => { n++; ding('msg'); if (n === 5) { S('credits'); Desk.msgbox('JSN Messenger Service', 'JSN Messenger Service 1.0 was written in one long weekend by three programmers, a lot of crisps and a cat who kept pressing Send.\n\nThank you for chatting!', 'info'); } });
    qs(b, '[data-b=ok]').addEventListener('click', () => w.close());
  }
  function help() {
    Desk.notepad('JSN Messenger Help.txt', `JSN MESSENGER SERVICE 1.0 - HELP
================================

WHAT IS IT?
  JSN Messenger Service tells you when your friends are online and lets
  you send them instant messages. No more waiting for e-mails!

SIGNING IN
  You need a JackNet Passport (your JackNet member name and password).
  Log on to JackNet as a member, then click "Click here to sign in".
  Guests can't sign in. Sorry, Guest1234.

ADDING A CONTACT
  Click Add, then type their JackNet member name, member number, or
  JackMail address (name@jackmail.webcom). They get asked if they want
  to let you see them. Until they click Allow, they show as Not Online.

SENDING AN INSTANT MESSAGE
  Double-click someone in the Online list, type, and press Enter.

MY STATUS
  Click your own name to pick: Online, Busy, Be Right Back, Away,
  On The Phone, Out To Lunch or Appear Offline. Appear Offline means
  nobody can see you. Sneaky.

PRIVACY
  Tools > Privacy. People on your Block List can't see you or message
  you, and they aren't told.

SAFETY (IMPORTANT!)
  * Never tell anyone your password.
  * Never give out your address, phone number or what school you go to.
  * Only add people you actually know.
  * If someone is horrible, Block them and tell a grown-up.
`);
  }

  // ================================================================ Instant Message windows
  const pend = new Map(); let cidN = 0;
  function unflash(cv) { cv.w.task.classList.remove('jsn-flash'); }
  function stOf(name) { const c = M.contacts.get(lc(name)); return c ? c.st : (M.state === 'on' ? 'NLN' : 'FLN'); }
  function updConv(cv) {
    if (cv.w.closed) return;
    const st = stOf(cv.name);
    qs(cv.w.el, '.jc-to').innerHTML = `${icon(st)}<span>To: <b>${esc(cv.name)}</b> <span class="jc-addr">&lt;${esc(mailOf(cv.name))}&gt;</span>${st !== 'NLN' ? ` <span class="jc-addr">(${esc(label(st))})</span>` : ''}</span>`;
  }
  function openConv(name, o) {
    o = o || {};
    if (!okName(name)) return null;
    const k = lc(name);
    let cv = M.convs.get(k);
    if (cv && !cv.w.closed) { if (!o.quiet) { cv.w.restore(); unflash(cv); setTimeout(() => cv.ta.focus(), 20); } return cv; }
    const b = h('div', 'jc', `<div class="jc-to"></div><div class="jc-warn">Never tell anyone your password, or a credit card number, in an instant message conversation.</div><div class="jc-log" role="log" aria-live="polite"></div><form class="jc-send"><textarea maxlength="400" aria-label="Type your message"></textarea><button class="btn" type="submit">Send</button></form>`);
    const n = M.convs.size % 5;
    const w = A.win(name + ' - Instant Message', b, { w: 390, h: Math.min(340, DesktopSurface.height() - 70), menubar: true, status: true, icon: people('on', 16), minW: 260, minH: 220, x: Math.max(4, DesktopSurface.width() / 2 - 260 + n * 22), y: 40 + n * 22, onClose: () => M.convs.delete(k) });
    w.body.classList.add('jc-body');
    cv = { name: (M.contacts.get(k) || {}).name || name, w, log: qs(b, '.jc-log'), ta: qs(b, 'textarea'), lines: [] };
    M.convs.set(k, cv);
    A.menubar(w, [
      ['File', [{ label: 'Save As...', act: () => saveConv(cv) }, '-', { label: 'Close', act: () => w.close() }]],
      ['Edit', [{ label: 'Copy', act: () => { try { document.execCommand('copy'); } catch (e) {} } }, { label: 'Select All', act: () => { const r = document.createRange(); r.selectNodeContents(cv.log); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } }, '-', { label: 'Clear Conversation', act: () => { cv.log.innerHTML = ''; cv.lines = []; } }]],
      ['View', [{ label: 'Contact Properties', act: () => { const c = M.contacts.get(k); Desk.msgbox(cv.name + ' Properties', `Name: ${cv.name}\nE-mail: ${mailOf(cv.name)}${c ? '\nJackNet member number: ' + c.no : ''}\nStatus: ${label(stOf(cv.name))}`, 'info'); } }]],
      ['Help', [{ label: 'Help Topics', act: help }, { label: 'About JSN Messenger Service', act: about }]],
    ]);
    updConv(cv);
    w.status.textContent = '';
    qs(b, '.jc-send').addEventListener('submit', ev => { ev.preventDefault(); sendText(cv); });
    cv.ta.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); sendText(cv); } });
    w.el.addEventListener('pointerdown', () => unflash(cv));
    w.task.addEventListener('click', () => unflash(cv));
    if (!o.quiet) setTimeout(() => cv.ta.focus(), 30);
    return cv;
  }
  function line(cv, who, text, mine) {
    const hd = h('div', 'jc-h'); hd.textContent = who + ' says:';
    const t = h('div', 'jc-t' + (mine ? ' mine' : '')); t.textContent = text;
    cv.log.append(hd, t); cv.lines.push(`${who} says:\n    ${text}`);
    while (cv.log.childNodes.length > 400) cv.log.firstChild.remove();
    cv.log.scrollTop = cv.log.scrollHeight;
  }
  function sys(cv, text) { const d = h('div', 'jc-sys'); d.textContent = text; cv.log.appendChild(d); cv.lines.push(`[${text}]`); cv.log.scrollTop = cv.log.scrollHeight; }
  function fail(cv, text, why) {
    if (!cv || cv.w.closed) return;
    const a = h('div', 'jc-fail'); a.textContent = 'The following message could not be delivered to all recipients:';
    const t = h('div', 'jc-t gray'); t.textContent = text;
    cv.log.append(a, t); if (why) sys(cv, why);
    cv.lines.push('[could not be delivered: ' + text + ']');
    cv.log.scrollTop = cv.log.scrollHeight;
  }
  function sendText(cv) {
    const text = cv.ta.value.replace(/\s+$/, '').slice(0, 400);
    if (!text.trim()) return;
    cv.ta.value = '';
    line(cv, M.me ? M.me.name : Net.me.nick, text, true);
    if (M.state !== 'on') { fail(cv, text, 'You are not signed in to JSN Messenger Service.'); return; }
    if (stOf(cv.name) === 'FLN') { fail(cv, text, `${cv.name} is not online.`); return; }
    const cid = 'c' + (++cidN);
    pend.set(cid, { cv, text });
    if (!send({ t: 'jsnMsg', to: cv.name, text, cid })) { pend.delete(cid); fail(cv, text, 'Your connection to the server was lost.'); }
    setTimeout(() => { if (pend.has(cid)) { pend.delete(cid); fail(cv, text, 'The server did not answer.'); } }, 10000);
  }
  function saveConv(cv) {
    const name = `Conversation with ${cv.name}.txt`.replace(/[\\/:*?"<>|]/g, '');
    const text = `JSN Messenger Service - conversation with ${cv.name}\nSaved on ${d99()} at ${hhmm()}\n\n${cv.lines.join('\n')}\n`;
    try { A.fs.add('C:/My Documents', { name, type: 'txt', text, date: d99(), size: Math.max(1, Math.ceil(text.length / 1024)) + ' KB' }); } catch (e) {}
    Desk.toast('JSN Messenger Service', `Saved as C:\\My Documents\\${name}`, 4000);
  }

  // ================================================================ start / stop
  function start() {
    if (M.running) return;
    M.running = true;
    makeTray();
    if (Net.me.member) signIn(true); else trayDraw();
  }
  function stop() {
    if (!M.running) return;
    signOut();
    M.running = false;
    if (M.tray) { M.tray.remove(); M.tray = null; }
    M.convs.forEach(cv => cv.w.close()); M.convs.clear();
    if (M.list && !M.list.closed) M.list.close();
    if (reqWin && !reqWin.w.closed) reqWin.w.close();
  }
  setInterval(() => { if (M.list && !M.list.closed && M.state === 'on') { const a = qs(M.list.el, '[data-mail]'), n = mailCount(); if (a && a.textContent !== n + ' new e-mail message(s)') { a.textContent = n + ' new e-mail message(s)'; a.classList.toggle('zero', !n); } } }, 5000);

  window.JSNMsgr = { start, stop, openList, openConv, signIn, signOut, setStatus, state: M };
})();

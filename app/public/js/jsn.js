/* JSN - the JackNet Network: the big 1999 portal (http://www.jsn.jnet/) and JSN Messenger Service (JSNMSGR.EXE).
 * This always-loaded part registers the site, the program (only from its release day, 22/07/99, the day the real
 * MSN Messenger Service 1.0 came out), the tray icon, the Start menu entry, the What's New line and the secrets.
 * The portal pages live in js/jsn-portal.js and the messenger itself in js/jsn-msgr.js (both load when first needed).
 * Live messages go through the server mod mods/jsn.js (real JackNet members only, nothing is stored). */
(function () {
  'use strict';
  const A = window.Apps;
  if (!A || !window.IE || !IE.addSite || !window.Desk) return;
  const $ = id => document.getElementById(id);
  const esc = A.esc, store = A.store;
  const HOST = 'www.jsn.jnet', URL0 = 'http://' + HOST + '/';
  const REL_MD = 722; // 22 July
  const released = () => Desk.today99().md >= REL_MD;

  // ================================================================ art (original drawings: two little people, a chunky "jsn")
  const PCOL = { on: ['#2fae3a', '#f08a1c'], off: ['#9a9a9a', '#c4c4c4'], busy: ['#2fae3a', '#f08a1c'], away: ['#2fae3a', '#f08a1c'] };
  const OVER = {
    busy: '<circle cx="12.3" cy="12.3" r="3.3" fill="#e01010" stroke="#600" stroke-width=".7"/><path d="M10.4 12.3h3.8" stroke="#fff" stroke-width="1.3"/>',
    away: '<circle cx="12.3" cy="12.3" r="3.3" fill="#fff" stroke="#333" stroke-width=".7"/><path d="M12.3 10.3v2.2h1.6" stroke="#000" stroke-width=".8" fill="none"/>',
    phone: '<path d="M9.2 10.2q3-1.6 6.2 0l-.3 1.6-1.6-.2-.2-.9q-1-.3-2 0l-.2.9-1.6.2z" fill="#e01010" stroke="#600" stroke-width=".5"/><rect x="10" y="12.6" width="4.6" height="2.8" fill="#e01010" stroke="#600" stroke-width=".5"/>',
    wait: '<circle cx="12.3" cy="12.3" r="3.3" fill="#ffd400" stroke="#806000" stroke-width=".7"/><path d="M12.3 10.4v2.3M12.3 13.6v.6" stroke="#000" stroke-width="1"/>',
  };
  function people(kind, size) {
    const c = PCOL[kind] || PCOL.on, sz = size || 16;
    return `<svg viewBox="0 0 16 16" width="${sz}" height="${sz}" aria-hidden="true"><circle cx="10.6" cy="3.7" r="2.6" fill="${c[1]}" stroke="#000" stroke-width=".7"/><path d="M6.4 12.6q0-5.6 4.2-5.6t4.2 5.6z" fill="${c[1]}" stroke="#000" stroke-width=".7"/><circle cx="5.6" cy="6.3" r="2.8" fill="${c[0]}" stroke="#000" stroke-width=".7"/><path d="M1 15.4q0-6.2 4.6-6.2t4.6 6.2z" fill="${c[0]}" stroke="#000" stroke-width=".7"/><path d="M4.4 5.6h.1M6.8 5.6h.1" stroke="#000" stroke-width="1" stroke-linecap="round"/>${OVER[kind] || ''}</svg>`;
  }
  // status codes (what the server speaks) -> [label, icon kind]
  const ST = { NLN: ['Online', 'on'], BSY: ['Busy', 'busy'], BRB: ['Be Right Back', 'away'], AWY: ['Away', 'away'], PHN: ['On The Phone', 'phone'], LUN: ['Out To Lunch', 'away'], HDN: ['Appear Offline', 'off'], FLN: ['Not Online', 'off'] };
  const LOGO_TXT = '<span class="jsn-logo"><i>j</i><i>s</i><i>n</i></span>';

  // ================================================================ CSS (shared by the portal and the messenger)
  if (!$('jsn-css')) {
    const st = document.createElement('style'); st.id = 'jsn-css';
    st.textContent = `
.jsn-logo{font:italic 900 30px/1 "Arial Black",Arial,sans-serif;letter-spacing:-2px;display:inline-flex;align-items:flex-end;position:relative}
.jsn-logo i{font-style:inherit;text-shadow:2px 2px 0 rgba(0,0,0,.25)}
.jsn-logo i:nth-child(1){color:#e8401c}.jsn-logo i:nth-child(2){color:#1a6fd8}.jsn-logo i:nth-child(3){color:#2a9a2a}
.jsn-logo:after{content:"";position:absolute;left:-4px;right:-8px;top:46%;height:9px;border:2px solid #f2b400;border-color:#f2b400 transparent transparent;border-radius:50%;transform:rotate(-8deg)}
.jsn-tray{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;background:none;cursor:default}
.jsn-tray.jsn-spin svg{animation:jsnspin .9s steps(4) infinite}
@keyframes jsnspin{50%{transform:translateY(-2px)}}
.jsn-toasts{position:fixed;right:4px;bottom:34px;z-index:3600;display:flex;flex-direction:column-reverse;gap:4px;pointer-events:none;max-width:calc(100vw - 8px)}
.jsn-toast{pointer-events:auto;width:196px;max-width:calc(100vw - 8px);background:linear-gradient(#fdfdf8,#dfe8f6);border:1px solid #000;box-shadow:inset 1px 1px #fff,inset -1px -1px #8090a8,2px 2px 0 rgba(0,0,0,.35);font:11px Tahoma,Verdana,sans-serif;color:#000;cursor:pointer;animation:jsnup .45s ease-out}
.jsn-toast .jt-h{display:flex;align-items:center;gap:4px;padding:2px 3px;background:linear-gradient(90deg,#1a4ea8,#5c8de0);color:#fff;font-weight:bold}
.jsn-toast .jt-h button{margin-left:auto;width:14px;height:13px;padding:0;font:bold 9px/11px Tahoma,sans-serif;background:#c0c0c0;border:1px solid;border-color:#fff #404040 #404040 #fff;color:#000;cursor:pointer}
.jsn-toast .jt-b{display:flex;gap:7px;align-items:center;padding:8px 8px 10px;min-height:44px}
.jsn-toast .jt-b b{color:#0a2a8a}
.jsn-toast .jt-b span{overflow-wrap:anywhere}
.jsn-toast.out{transition:opacity .4s,transform .4s;opacity:0;transform:translateY(12px)}
@keyframes jsnup{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}
.jsn-wn{margin:0 0 8px;padding:4px 8px;border:2px dashed #e10600;background:#ffffd8;color:#000;font:bold 13px Arial,sans-serif;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.jsn-wn .new{background:#e10600;color:#ff0;padding:1px 5px;font:bold 11px Arial,sans-serif;animation:jsnblink 1s steps(1) infinite}
.jsn-wn a{color:#0000ee}
@keyframes jsnblink{50%{visibility:hidden}}
@media (prefers-reduced-motion:reduce){.jsn-toast,.jsn-tray.jsn-spin svg,.jsn-wn .new{animation:none}}
`;
    document.head.appendChild(st);
  }

  // ================================================================ secrets
  [['signin', 'Passport control', 'Sign in to a messenger that came out in the summer'],
    ['firstim', 'says:', 'Send a real instant message to a real JackNet member'],
    ['toast', 'Has just signed in', 'Be there when a mate signs in (bottom right!)'],
    ['status', 'Out To Lunch, Back In Five', 'Try every status the little people have'],
    ['block', 'Talk to the hand', 'Block somebody. (You can unblock them after.)'],
    ['idle', 'Gone for a biscuit', 'Leave the computer alone long enough to be marked Away'],
    ['home', 'Portal person', 'Make the big portal your home page'],
    ['stars', 'Written in the stars', 'Read every horoscope'],
    ['early', 'Coming this summer', 'Look for the messenger before it is out'],
    ['credits', 'Made in a weekend', 'Click the little people in the About box... a lot'],
  ].forEach(s => A.defineSecret('jsn.' + s[0], s[1], s[2]));

  // ================================================================ the messenger (lazy) + its tray icon
  const PID = 'jsn', APP = 'jsn.msgr';
  const installed = () => released() && (!window.Setup || !Setup.has || Setup.has(PID));
  const prefs = () => Object.assign({ autostart: true, alerts: true, away: true, sound: true }, store.get('jhp_jsn_prefs', {}) || {});
  let core = null;
  const loadCore = () => A.load('js/jsn-msgr.js').then(() => { core = window.JSNMsgr; return core; });
  let registered = false;
  function registerProgram() {
    if (registered || !released()) return;
    registered = true;
    try {
      if (window.Setup && Setup.product) Setup.product(PID, {
        n: 'JSN Messenger Service', v: '1.0', kb: 790, lic: 'Freeware', by: 'JSN - the JackNet Network', cat: 'net', sq: 5, rel: '22/07/99',
        d: 'See when your mates are online and send them instant messages that pop up straight away! Free from JSN. Sign in with your JackNet Passport.',
        note: 'Brand new today! Tell your friends. Then add them. Then talk to them. Then tell more friends.',
        home: 'http://' + HOST + '/messenger.html', apps: [APP], paths: ['JSN Messenger Service'], icons: [], cmds: ['jsnmsgr', 'msnmsgr', 'msmsgs'],
        def: false, launch: APP, exe: 'JSNMSGR.EXE', setup: 'jsnmsgr10.exe', dir: 'JSN Messenger Service', ic: 'user',
      });
    } catch (e) { console.error(e); }
    A.register(APP, { single: true, cmd: ['jsnmsgr', 'jsn messenger', 'msnmsgr', 'msmsgs'], open: () => loadCore().then(c => c.openList()) });
    A.addProgram(['JSN Messenger Service'], APP, people('on', 16));
    if (installed()) boot();
  }
  // start in the tray like it did (Run this program when JackOS starts)
  let booted = false;
  function boot() {
    if (booted || !installed() || !prefs().autostart) return;
    booted = true;
    const go = () => loadCore().then(c => c.start()).catch(e => console.error(e));
    const wait = () => { if ($('boot') || document.querySelector('.logon')) return setTimeout(wait, 1500); setTimeout(go, 1800); };
    wait();
  }
  document.addEventListener('setup', ev => {
    const d = ev.detail || {}; if (d.id !== PID) return;
    if (d.on) { booted = true; loadCore().then(c => c.start()); } // the wizard also launches it if "Run now" was ticked
    else if (core) core.stop();
  });
  // the day it comes out while the PC is on (or the pretend date moves)
  setInterval(() => { if (!registered && released()) registerProgram(); }, 60000);
  if (released()) registerProgram();
  else A.cmd(['jsnmsgr', 'msnmsgr'], () => { Desk.msgbox('JSNMSGR', `Cannot find the file 'JSNMSGR.EXE' (or one of its components).\n\n(JSN Messenger Service isn't out yet. JSN says: coming this summer!)`, 'warn'); A.secret('jsn.early'); return true; });

  // ================================================================ the portal (http://www.jsn.jnet/)
  const PAGES = {
    '/': 'JSN - the JackNet Network', '/messenger.html': 'JSN Messenger Service', '/chat.html': 'JSN Chat', '/horoscopes.html': 'JSN Horoscopes',
    '/channels.html': 'JSN Channels', '/help.html': 'JSN Help', '/about.html': 'About JSN',
  };
  const mk = path => () => {
    const el = document.createElement('div');
    el.innerHTML = `<p style="font:13px Arial,sans-serif;padding:18px;margin:0;background:#fff;color:#000;min-height:420px">Opening page http://${HOST}${esc(path)}...</p>`;
    A.load('js/jsn-portal.js').then(() => { if (window.JSNPortal) window.JSNPortal.render(path, el); })
      .catch(() => { el.innerHTML = `<div style="padding:18px;font:13px Arial,sans-serif;background:#fff;color:#000;min-height:300px"><h2>The page cannot be displayed</h2><p>${HOST} is busy right now. Click <b>Refresh</b> or try again later.</p></div>`; });
    return el;
  };
  const pages = {}; for (const p in PAGES) pages[p] = { title: PAGES[p], html: mk(p) };
  IE.addSite(HOST, { title: 'JSN - the JackNet Network', cat: 'comm', pages,
    desc: 'The JackNet Network: news, sport, weather, free JackMail, chat, horoscopes, shopping and the brand-new JSN Messenger. The busiest start page on the JackNet.' });
  const openSite = path => { const b = $('browser'); if (b) b.classList.remove('min'); const tb = $('taskBrowser'); if (tb) tb.hidden = false; IE.navigate('http://' + HOST + (path || '/')); };
  A.cmd(['jsn', 'jsn.jnet', 'www.jsn.jnet'], () => { openSite('/'); return true; });

  // ================================================================ the magazine's What's New: a little NEW! line from release day
  function whatsNew() {
    const ul = $('news'); if (!ul || !released() || $('jsnWn')) return;
    const d = document.createElement('div'); d.id = 'jsnWn'; d.className = 'jsn-wn';
    d.innerHTML = `<span class="new">NEW!</span><span><b>JSN Messenger</b> is out! It pops up when your mates log on to JackNet. Download it FREE from <a href="${URL0}messenger.html">www.jsn.jnet</a></span>`;
    d.querySelector('a').addEventListener('click', ev => { ev.preventDefault(); openSite('/messenger.html'); });
    ul.parentNode.insertBefore(d, ul);
  }
  document.addEventListener('section', ev => { if (ev.detail === 'home') whatsNew(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', whatsNew); else whatsNew();
  setInterval(whatsNew, 60000);

  // who's on the site right now (the messenger's Add a Contact box offers the members)
  let online = [];
  if (window.Net) { const setOn = m => { online = Array.isArray(m && m.online) ? m.online.filter(o => o && typeof o.nick === 'string') : []; }; Net.on('online', setOn); Net.on('welcome', setOn); }

  window.JSN = { HOST, released, installed, prefs, people, ST, LOGO_TXT, openSite, loadCore, REL: '22/07/99', get core() { return core; }, get online() { return online; }, onlineCount: () => online.length || +((document.getElementById('netCount') || {}).textContent || 0) || 0 };
})();

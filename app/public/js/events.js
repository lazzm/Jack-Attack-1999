/* events.js: JackNet Events (the always-loaded part; the rest loads when it is needed). Server: mods/events.js.
 *   What's On?            www.whatson.jnet           the weekly listings (TV-guide style) + CYBERTEXT, a teletext service
 *   Weekly events         Theme Night (Wed 7pm), Request Hour (Thu 8pm), LAN Night (Fri 8pm), Grand Quiz (Sun 7pm),
 *                         Cover CD Launch Party (first Sat, 6pm). UK clock time on the PC's 1999 calendar. Tray reminders.
 *   Listening Party       www.listeningparty.wubwub  Radio Jack plays ten original chiptunes IN SYNC for everyone   events-radio.js
 *   Byte                  www.bytepet.jnet           the JackNet's communal pet (e-Pet Tray 2000 puts it in the tray) events-pet.js
 *   The Millennium Vault  www.millenniumvault.jnet   time capsules, sealed until Y2K Night                          events-capsule.js
 *   NO CARRIER            a puzzle trail that starts in the page source of the home page (View > Source)       events-arg.js
 *   View > Source         every page's source now looks like a proper 1999 page (FONT tags, spacer GIFs, counters...)
 * Testing: ?evforce=lan|quiz|theme|cd|req starts that event now (only when the server runs with EVENTS_TEST=1),
 *   ?evlen=N its length in minutes, ?evend=id ends it, ?capforce=open|archive simulates Y2K Night for the vault,
 *   ?petgrow makes Byte grow a stage. ?date99=MM-DD&time=HH:MM:SS (seasons.js) moves the PC's own clock as usual. */
(function () {
  'use strict';
  const A = window.Apps; if (!A || !window.Desk || window.Ev) return;
  const esc = A.esc, store = A.store, $ = id => document.getElementById(id);
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const isMember = () => !!(window.Net && Net.me && Net.me.member);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const Q = new URLSearchParams(location.search);

  // ================================================================ state + the wire
  const hs = {};
  const emit = (t, d) => (hs[t] || []).forEach(fn => { try { fn(d); } catch (e) { console.error(e); } });
  let skew = 0, week = [], test = 0;
  const live = new Map();
  const Ev = window.Ev = {
    on(t, fn) { (hs[t] = hs[t] || []).push(fn); return () => { hs[t] = (hs[t] || []).filter(x => x !== fn); }; },
    emit, esc, h, sfx, store,
    send: m => !!(window.Net && Net.send(m)),
    now: () => Date.now() + skew,
    setSkew(s) { skew = s; },
    get week() { return week; }, get live() { return live; }, get test() { return test; },
    member: isMember,
    load: mod => A.load('js/events-cat.js').then(() => (mod ? A.load('js/events-' + mod + '.js') : null)),
    go(url) { const b = $('browser'); if (b) { b.classList.remove('min'); const tb = $('taskBrowser'); if (tb) tb.hidden = false; if (Desk.activate) Desk.activate(b); } IE.navigate(url); },
    secret: id => A.secret(id),
    // UK clock helpers (events run on UK time; the date shown is the PC's 1999 date)
    ukTime(ts) { try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ts)); } catch (e) { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); } },
    ago(ms) { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? s + ' sec' : s < 3600 ? Math.round(s / 60) + ' min' : Math.floor(s / 3600) + ' hr ' + Math.round((s % 3600) / 60) + ' min'; },
    nameOf: id => ({ theme: 'Hangout Theme Night', req: 'The Request Hour', lan: 'LAN Night', quiz: 'Grand Quiz Night', cd: 'Cover CD Launch Party' }[id] || id),
    room: id => Ev.load('guide').then(() => window.EvGuide && EvGuide.room(id)),
  };
  if (window.Net) {
    Net.on('welcome', () => { lastHere = '?'; setTimeout(testFlags, 800); }); // the server sends evHi on hello
    Net.on('evHi', m => { skew = (+m.now || Date.now()) - Date.now(); week = Array.isArray(m.week) ? m.week : []; test = m.test | 0; Ev.hist = Array.isArray(m.hist) ? m.hist : []; live.clear(); (m.live || []).forEach(L => live.set(L.id, L)); emit('week', week); emit('live', null); tray(); });
    Net.on('evStart', m => { if (!m.L) return; live.set(m.L.id, m.L); emit('live', m.L); tray(); startToast(m.L); Ev.send({ t: 'evHi' }); });
    Net.on('evLive', m => { if (!m.L) return; live.set(m.L.id, m.L); emit('live', m.L); tray(); });
    Net.on('evEnd', m => { live.delete(m.id); emit('end', m); emit('live', null); tray(); endToast(m); Ev.send({ t: 'evHi' }); });
    Net.on('evLaunch', m => emit('launch', m));
    for (const t of ['radNow', 'radCount', 'radSync', 'radReqOk', 'radErr', 'bpView', 'bpSay', 'bpGrow', 'bpPing', 'bpMile', 'capState', 'capWall', 'capOk', 'capErr', 'capN', 'capOpen', 'argRes', 'argHall']) Net.on(t, m => emit(t, m));
    Net.on('bpView', m => { petView = m; trayPet(); });
    Net.on('bpPing', () => { if (petTray) { petTray.classList.remove('ev-bounce'); void petTray.offsetWidth; petTray.classList.add('ev-bounce'); } });
    Net.on('capOpen', () => Desk.toast('THE MILLENNIUM VAULT IS OPEN!', 'Everyone\'s time capsules have been dug up! Read them all at www.millenniumvault.jnet (Start > Run > vault).', 9000));
  }
  function testFlags() {
    if (testFlags.done) return; testFlags.done = true;
    const f = Q.get('evforce'); if (f) Ev.send({ t: 'evForce', id: f, len: +Q.get('evlen') || 5 });
    const e = Q.get('evend'); if (e) Ev.send({ t: 'evForce', id: e, end: true });
    const c = Q.get('capforce'); if (c) Ev.send({ t: 'evForce', k: 'cap', v: c });
    if (Q.has('petgrow')) Ev.send({ t: 'evForce', k: 'pet', v: 'grow' });
  }

  // ================================================================ the look of the always-loaded bits
  const css = `
#tray .ev-tray{position:relative}
#tray .ev-tray svg{width:16px;height:16px;display:block}
#tray .ev-tray.ev-on svg{animation:evblink 1s steps(2) infinite}
#tray .ev-tray .ev-n{position:absolute;right:-4px;bottom:-3px;font:bold 8px/9px Verdana,Arial,sans-serif;color:#fff;background:#e10600;border:1px solid #fff;border-radius:6px;padding:0 2px;min-width:7px;text-align:center}
#tray .ev-bounce svg{animation:evhop .5s ease 2}
@keyframes evblink{50%{opacity:.35}}
@keyframes evhop{40%{transform:translateY(-4px)}}
@media (prefers-reduced-motion: reduce){#tray .ev-tray.ev-on svg,#tray .ev-bounce svg{animation:none}}
.ev-wait{font:12px Verdana,Arial,sans-serif;padding:20px;background:#fff;color:#000;min-height:300px}
`;
  const st = document.createElement('style'); st.id = 'evCss'; st.textContent = css; document.head.appendChild(st);

  // ================================================================ icons (hand-drawn, chunky)
  const ICO = {
    whatson: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="3" y="7" width="26" height="19" fill="#c0c0c0" stroke="#000"/><rect x="5" y="9" width="17" height="14" fill="#10204a"/><path d="M7 12h9M7 15h12M7 18h7M7 21h10" stroke="#ffd400"/><rect x="24" y="10" width="3" height="3" fill="#e10600" stroke="#000"/><rect x="24" y="15" width="3" height="2" fill="#000"/><rect x="24" y="19" width="3" height="2" fill="#000"/><path d="M12 7l-4-5M20 7l4-5" stroke="#000"/><rect x="8" y="26" width="3" height="3" fill="#000"/><rect x="21" y="26" width="3" height="3" fill="#000"/></svg>',
    room: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="3" y="5" width="26" height="23" fill="#fff" stroke="#000"/><rect x="3" y="5" width="26" height="6" fill="#e10600" stroke="#000"/><rect x="8" y="2" width="3" height="6" fill="#808080" stroke="#000"/><rect x="21" y="2" width="3" height="6" fill="#808080" stroke="#000"/><path d="M16 13l2 4 4 .5-3 3 .8 4.5-3.8-2-3.8 2 .8-4.5-3-3 4-.5z" fill="#ffd400" stroke="#a07000"/></svg>',
    tuner: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="2" y="10" width="28" height="17" fill="#3a3a4a" stroke="#000"/><path d="M8 10L22 3" stroke="#000" stroke-width="1.5"/><circle cx="10" cy="19" r="5" fill="#222" stroke="#c0c0c0"/><circle cx="10" cy="19" r="2" fill="#808080"/><rect x="18" y="13" width="10" height="5" fill="#a8ff60" stroke="#000"/><path d="M19 16h1M21 15v2M23 14v3M25 15v2" stroke="#204010"/><rect x="18" y="21" width="3" height="3" fill="#e10600"/><rect x="23" y="21" width="3" height="3" fill="#ffd400"/></svg>',
    pet: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="7" y="3" width="18" height="26" rx="8" fill="#ff8ad0" stroke="#000"/><rect x="10" y="7" width="12" height="10" fill="#c8f0d0" stroke="#000"/><rect x="13" y="10" width="2" height="2" fill="#000"/><rect x="17" y="10" width="2" height="2" fill="#000"/><path d="M13 14h6" stroke="#000"/><circle cx="11" cy="22" r="2" fill="#ffd400" stroke="#000"/><circle cx="16" cy="24" r="2" fill="#ffd400" stroke="#000"/><circle cx="21" cy="22" r="2" fill="#ffd400" stroke="#000"/></svg>',
    vault: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="3" y="4" width="26" height="24" fill="#808080" stroke="#000"/><rect x="5" y="6" width="22" height="20" fill="#a8a8b0" stroke="#404040"/><circle cx="16" cy="16" r="7" fill="#c0c0c8" stroke="#000"/><path d="M16 10v12M10 16h12M12 12l8 8M20 12l-8 8" stroke="#404040"/><circle cx="16" cy="16" r="2" fill="#ffd400" stroke="#000"/><rect x="26" y="9" width="3" height="4" fill="#404040"/><rect x="26" y="19" width="3" height="4" fill="#404040"/></svg>',
    board: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="3" y="4" width="22" height="16" fill="#fffbe0" stroke="#000"/><path d="M6 8h14M6 11h10M6 14h12" stroke="#000080"/><path d="M8 20l-3 6 7-6" fill="#fffbe0" stroke="#000"/><rect x="15" y="14" width="15" height="14" fill="#ffd400" stroke="#000"/><path d="M20 18a2.5 2.5 0 1 1 3 2.4V22" fill="none" stroke="#000" stroke-width="1.6"/><rect x="22" y="24" width="2" height="2" fill="#000"/></svg>',
    owl: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="2" y="2" width="28" height="28" fill="#101018" stroke="#000"/><path d="M9 8l3 3h8l3-3v14l-7 5-7-5z" fill="#8a6a3a" stroke="#000"/><circle cx="13" cy="15" r="3" fill="#ffd400" stroke="#000"/><circle cx="19" cy="15" r="3" fill="#ffd400" stroke="#000"/><rect x="12" y="14" width="2" height="2" fill="#000"/><rect x="18" y="14" width="2" height="2" fill="#000"/><path d="M15 18h2l-1 2z" fill="#ff8000"/></svg>',
  };
  Ev.ICO = ICO;
  const mini = (svg, n) => svg.replace('<svg', `<svg width="${n || 16}" height="${n || 16}"`);

  // ================================================================ the event tray icon + reminders
  let evTray = null;
  const REM = () => Object.assign({ theme: 1, req: 1, lan: 1, quiz: 1, cd: 1, on: 1 }, store.get('jhp_events_rem', {}));
  Ev.REM = REM; Ev.setRem = (k, v) => { const r = REM(); r[k] = v ? 1 : 0; store.set('jhp_events_rem', r); tray(); };
  const soon = () => week.filter(o => o.s - Ev.now() <= 15 * 60000 && o.e > Ev.now() && !live.has(o.id) && REM()[o.id]);
  function tray() {
    const tr = $('tray'); if (!tr) return;
    const on = [...live.values()], s = soon(), show = REM().on && (on.length || s.length);
    if (!show) { if (evTray) { evTray.remove(); evTray = null; } return; }
    if (!evTray) {
      evTray = h('button', 'ev-tray sys-tray'); evTray.type = 'button';
      tr.insertBefore(evTray, $('clock') || null);
      evTray.addEventListener('click', ev => { ev.stopPropagation(); const L = [...live.values()][0]; if (L) Ev.room(L.id); else Ev.go('http://www.whatson.jnet/'); });
      evTray.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); const r = evTray.getBoundingClientRect(); IE.menu([{ label: 'What\'s On This Week', act: () => Ev.go('http://www.whatson.jnet/') }, ...[...live.values()].map(L => ({ label: 'Join: ' + Ev.nameOf(L.id), act: () => Ev.room(L.id) })), '-', { label: 'Reminders on', chk: !!REM().on, act: () => Ev.setRem('on', !REM().on) }], Math.max(4, r.left - 150), r.top - 90); });
    }
    const L = on[0], n = on.reduce((a, x) => a + (x.here | 0), 0);
    evTray.classList.toggle('ev-on', !!L);
    evTray.innerHTML = mini(ICO.room) + (L && n ? `<span class="ev-n">${Math.min(99, n)}</span>` : '');
    const t = L ? `ON NOW: ${Ev.nameOf(L.id)} (${n} there). Click to join!` : s[0] ? `Coming up at ${Ev.ukTime(s[0].s)}: ${Ev.nameOf(s[0].id)}` : '';
    evTray.title = t; evTray.setAttribute('aria-label', t);
  }
  const told = store.get('jhp_events_told', {});
  function remind() {
    tray();
    if (!REM().on) return;
    const now = Ev.now();
    for (const o of week) {
      if (!REM()[o.id]) continue;
      const k = o.id + ':' + o.s, mins = Math.round((o.s - now) / 60000);
      if (o.s > now && o.s - now <= 10.5 * 60000 && !told[k]) {
        told[k] = 1; store.set('jhp_events_told', told);
        Desk.toast('JackNet Events', `${Ev.nameOf(o.id)} starts in ${Math.max(1, mins)} minute${mins === 1 ? '' : 's'}! Click the star in the tray at ${Ev.ukTime(o.s)} to join.`, 9000); sfx('beep');
      }
    }
    for (const k of Object.keys(told)) if (+k.split(':')[1] < now - 2 * 864e5) delete told[k];
  }
  function startToast(L) {
    if (!REM().on || !REM()[L.id]) return;
    Desk.toast('IT\'S ON!', `${Ev.nameOf(L.id)} has started. Click the flashing star in the tray to join in!`, 10000); sfx('join');
    A.secret('evt.event');
  }
  function endToast(m) {
    const r = m.res || {}, me = window.Net && Net.me && Net.me.nick;
    const won = (r.win || []).find(w => w[0] === me);
    if (won) Desk.toast('YOU WON!', `${Ev.nameOf(m.id)}: ${won[2] === 1 && won[1] === 0 ? 'the spot prize' : ['1st', '2nd', '3rd'][won[2] - 1] + ' place'}! Your prize is in your Rupee wallet.`, 10000);
  }
  setInterval(remind, 15000); setTimeout(remind, 4000);

  // am I at the event? (in the game, the quiz channel, the Hangout, the party room, or tuned in)
  let lastHere = '';
  const winOpen = re => [...document.querySelectorAll('.appwin')].some(w => w.style.display !== 'none' && re.test((w.querySelector('.tb .t') || {}).textContent || ''));
  function hereNow(id) {
    if (window.EvGuide && EvGuide.roomOpen(id)) return true;
    if (id === 'lan') return winOpen(/JackReal|JRT/i);
    if (id === 'quiz') return [...document.querySelectorAll('.ir-child.chan .ir-ct')].some(t => /^#quiznight\b/i.test(t.textContent || ''));
    if (id === 'theme') return window.IE && IE.current === 'hangout' && $('browser') && !$('browser').classList.contains('min');
    if (id === 'cd') return winOpen(/Cover CD|COVER CD/);
    if (id === 'req') return !!(window.EvRadio && EvRadio.playing);
    return false;
  }
  setInterval(() => {
    const L = [...live.values()].find(x => hereNow(x.id)), v = L ? L.id : '';
    if (live.has('theme') && window.IE && IE.current === 'hangout') Ev.load('guide').then(() => window.EvGuide && EvGuide.hangout());
    if (v !== lastHere) { if (lastHere && lastHere !== '?') Ev.send({ t: 'evHere', id: lastHere, on: false }); if (v) Ev.send({ t: 'evHere', id: v, on: true }); lastHere = v; }
  }, 4000);

  // ================================================================ View > Source: proper 1999 HTML
  // ie.js shows the page's real insides in Notepad; we swap that for what a 1999 page's source looked like. Comments in
  // the page survive (some webmasters hide things in them). Pages can bring their own: Ev.addSource(key, fn).
  const SRC = {};
  Ev.addSource = (key, fn) => { SRC[String(key).toLowerCase()] = fn; };
  const curKey = () => { if (!window.IE) return ''; if (IE.current !== 'secret') return 'mag:' + IE.current; return String(($('addrBar') || {}).value || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[#?].*$/, '').replace(/\/(index\.html?)?$/, '/'); };
  const hex = s => [...s].map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).join(' ');
  const HOME_NOTE = () => ['', '', '', '<!-- ================================================================ -->', '<!--  to whoever reads page source: hello. you are one of us.          -->', '<!--  my old board went quiet in \'96. it is still there, if you dial   -->', '<!--  the right address. here it is, the way we used to write it:      -->', `<!--  ${hex('www.nocarrier.cyb')}               -->`, '<!--  (two digits = one letter. 41 is A. you will work it out.)        -->', '<!--                                                   ~NIGHTOWL~     -->', '<!-- ================================================================ -->', '', ''];
  const NOISE = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META']);
  const RENAME = { SECTION: 'DIV', ARTICLE: 'DIV', HEADER: 'DIV', FOOTER: 'DIV', NAV: 'DIV', ASIDE: 'DIV', MAIN: 'DIV', FIGURE: 'DIV', FIGCAPTION: 'DIV', STRONG: 'B', EM: 'I', MARK: 'B', SPAN: '', LABEL: '', PICTURE: '', DETAILS: 'DIV', SUMMARY: 'B', DIALOG: 'DIV' };
  const BLOCK = /^(DIV|P|H[1-6]|UL|OL|LI|TABLE|TR|TD|TH|TBODY|THEAD|FORM|CENTER|BLOCKQUOTE|PRE|DL|DT|DD|FIELDSET|SELECT|OPTION|TEXTAREA)$/;
  const rgbHex = c => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c || ''); if (!m || m[4] === '0') return ''; return '#' + [m[1], m[2], m[3]].map(x => (+x).toString(16).padStart(2, '0')).join('').toUpperCase(); };
  function picFile(el) {
    let n = el.getAttribute('alt') || el.getAttribute('aria-label') || el.getAttribute('title') || '';
    if (!n) { const cls = String(typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '').split(/\s+/).filter(x => x.length > 2); n = cls.length ? cls[cls.length - 1] : el.tagName === 'CANVAS' ? 'snapshot' : 'image'; }
    n = n.toLowerCase().replace(/^[a-z]{1,3}-/, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20) || 'image';
    const r = el.getBoundingClientRect(); return [n + (r.width * r.height < 20000 ? '.gif' : '.jpg'), Math.round(r.width) || 32, Math.round(r.height) || 32];
  }
  function to99(root) {
    const out = []; let len = 0, cut = false;
    const put = (d, s) => { if (cut) return; const line = '  '.repeat(Math.min(d, 8)) + s; len += line.length; if (len > 90000) { cut = true; out.push('<!-- (the rest of this page did not fit on the floppy) -->'); return; } out.push(line); };
    const words = t => t.replace(/\s+/g, ' ').trim();
    const wrapT = (d, t) => { let l = ''; for (const w of t.split(' ')) { if ((l + ' ' + w).length > 96) { put(d, l); l = w; } else l = l ? l + ' ' + w : w; } if (l) put(d, l); };
    const ent = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00a3/g, '&pound;').replace(/\u00a9/g, '&copy;').replace(/\u00e9/g, '&eacute;').replace(/\u2026/g, '...').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-');
    function walk(n, d) {
      if (cut) return;
      if (n.nodeType === 8) { put(d, '<!--' + n.nodeValue + '-->'); return; }
      if (n.nodeType === 3) { const t = words(n.nodeValue); if (t) wrapT(d, ent(t)); return; }
      if (n.nodeType !== 1) return;
      const T = n.tagName.toUpperCase();
      if (NOISE.has(T) || n.hidden || (n.getAttribute && n.getAttribute('aria-hidden') === 'true' && !/^(SVG|CANVAS|IMG)$/.test(T))) return;
      if (T === 'SVG' || T === 'CANVAS' || T === 'IMG' || T === 'svg') { const [f, w, hh] = picFile(n); put(d, `<IMG SRC="images/${f}" WIDTH=${w} HEIGHT=${hh} BORDER=0 ALT="">`); return; }
      if (T === 'BR') { put(d, '<BR>'); return; }
      if (T === 'HR') { put(d, '<HR SIZE=2 NOSHADE>'); return; }
      if (T === 'BUTTON') { const v = words(n.textContent).slice(0, 40); if (v) put(d, `<INPUT TYPE="button" VALUE="${ent(v).replace(/"/g, '&quot;')}">`); return; }
      if (T === 'INPUT') { const ty = (n.type || 'text').toUpperCase(); put(d, ty === 'CHECKBOX' || ty === 'RADIO' ? `<INPUT TYPE="${ty}" NAME="${n.name || 'opt'}"${n.checked ? ' CHECKED' : ''}>` : `<INPUT TYPE="${ty === 'NUMBER' ? 'TEXT' : ty}" NAME="${n.name || 'q'}" SIZE=20>`); return; }
      if (T === 'TEXTAREA') { put(d, '<TEXTAREA NAME="msg" ROWS=4 COLS=40 WRAP=VIRTUAL></TEXTAREA>'); return; }
      let tag = own(RENAME, T) ? RENAME[T] : T;
      if (!/^[A-Z][A-Z0-9]*$/.test(tag || 'X')) tag = '';
      let attrs = '';
      if (tag === 'A') { const href = n.getAttribute('href') || (n.dataset && (n.dataset.go ? n.dataset.go + '.htm' : n.dataset.wp || n.dataset.wgo)) || '#'; attrs = ` HREF="${ent(String(href)).replace(/"/g, '%22')}"`; }
      if (tag === 'TD' || tag === 'TH') { if (n.colSpan > 1) attrs += ` COLSPAN=${n.colSpan}`; attrs += ' VALIGN=TOP'; }
      if (tag === 'TABLE') attrs = ' BORDER=0 CELLPADDING=4 CELLSPACING=0 WIDTH="100%"';
      if (/^H[1-3]$/.test(tag)) attrs = ' ALIGN=CENTER';
      // a coloured bit of text becomes a FONT tag, like it should
      let font = '';
      if (!tag && n.style && n.style.color) { const c = rgbHex(n.style.color); if (c) font = c; }
      if (!tag && n.classList && n.classList.contains('blink')) tag = 'BLINK';
      const block = BLOCK.test(tag);
      const kids = [...n.childNodes];
      const simple = kids.every(k => k.nodeType === 3 || (k.nodeType === 1 && /^(B|I|U|A|SMALL|BIG|SPAN|STRONG|EM|FONT|SUP|SUB|TT|CODE)$/i.test(k.tagName) && k.children.length === 0));
      const inner = () => kids.map(k => k.nodeType === 3 ? ent(words(k.nodeValue)) : (() => { const t2 = k.tagName.toUpperCase(), tg = own(RENAME, t2) ? RENAME[t2] : t2; const tx = ent(words(k.textContent)); const ha = tg === 'A' ? ` HREF="${ent(String(k.getAttribute('href') || (k.dataset && (k.dataset.go ? k.dataset.go + '.htm' : k.dataset.wp || k.dataset.wgo)) || '#')).replace(/"/g, '%22')}"` : ''; return tg ? `<${tg}${ha}>${tx}</${tg}>` : tx; })()).join(' ').replace(/\s+/g, ' ').trim();
      if (font) { put(d, `<FONT COLOR="${font}">${simple ? inner() : ''}${simple ? '</FONT>' : ''}`); if (!simple) { kids.forEach(k => walk(k, d + 1)); put(d, '</FONT>'); } return; }
      if (!tag) { if (simple) { const t = inner(); if (t) wrapT(d, t); } else kids.forEach(k => walk(k, d)); return; }
      if (simple && !block) { const t = inner(); if (t) wrapT(d, `<${tag}${attrs}>${t}</${tag}>`); return; }
      if (simple) { const t = inner(); if (!t && /^(DIV|P|TD|LI)$/.test(tag)) return; if (('<' + tag + attrs + '>' + t).length < 100) put(d, `<${tag}${attrs}>${t}</${tag}>`); else { put(d, `<${tag}${attrs}>`); wrapT(d + 1, t); put(d, `</${tag}>`); } return; }
      put(d, `<${tag}${attrs}>`); kids.forEach(k => walk(k, d + 1)); if (!/^(LI|P|TD|TR|OPTION|DT|DD)$/.test(tag) || true) put(d, `</${tag}>`);
    }
    walk(root, 1);
    return out.join('\n');
  }
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  Ev.wrap99 = (title, body, o) => {
    o = o || {};
    return ['<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">', '<HTML>', '<HEAD>', `<TITLE>${title}</TITLE>`, `<META NAME="GENERATOR" CONTENT="${o.gen || 'Notepad'}">`, `<META NAME="KEYWORDS" CONTENT="${o.kw || 'games, cheats, reviews, cool, free, 1999, best site'}">`, '<!-- made with Notepad -->', '<!-- best viewed at 800x600 with JackNet Explorer 5 -->', '</HEAD>', `<BODY BGCOLOR="${o.bg || '#FFFFFF'}" TEXT="${o.fg || '#000000'}" LINK="#0000FF" VLINK="#800080" ALINK="#FF0000"${o.bgimg ? ` BACKGROUND="${o.bgimg}"` : ''}>`, '<CENTER><IMG SRC="images/spacer.gif" WIDTH=1 HEIGHT=8 BORDER=0></CENTER>', ...(o.top || []), body, '', o.counter === false ? '' : '<P ALIGN=CENTER><IMG SRC="/cgi-bin/counter.cgi?ft=6&amp;df=hits.dat&amp;dd=C" WIDTH=88 HEIGHT=31 ALT="hit counter"><BR>', o.counter === false ? '' : '<FONT SIZE=1 FACE="Arial">Thanks for visiting!!! <BLINK>Sign my guestbook!</BLINK></FONT></P>', '</BODY>', '</HTML>', ''].join('\n');
  };
  function source99() {
    const k = curKey();
    if (SRC[k]) { try { const r = SRC[k](); if (r) return r; } catch (e) { console.error(e); } }
    const el = document.querySelector('.sec.on'); if (!el) return null;
    const title = document.title || 'JACK ATTACK!';
    const cs = getComputedStyle(el.firstElementChild || el), bg = rgbHex(cs.backgroundColor) || rgbHex(getComputedStyle($('page') || el).backgroundColor) || '#FFFFFF', fg = rgbHex(cs.color) || '#000000';
    const file = k.startsWith('mag:') ? (k === 'mag:home' ? 'index' : k.slice(4)) + '[1].htm' : (k.split('/').filter(Boolean).pop() || 'index').replace(/\.html?$/, '') + '[1].htm';
    const body = to99(el);
    return { name: file, text: Ev.wrap99(title, body, { bg, fg, top: k === 'mag:home' ? HOME_NOTE() : [], kw: k.startsWith('mag:') ? 'jack attack, games, cheats, reviews, gorks, intergalactic battles, cubes, blockology, gubbinz, 1999' : undefined }) };
  }
  Ev.source99 = source99;
  Ev.to99 = to99;
  if (Desk.notepad) {
    const np0 = Desk.notepad;
    Desk.notepad = function (name, text) {
      try {
        if (/\[1\]\.htm$/.test(String(name)) && /^<html>\n<head>\n<title>/.test(String(text)) && /Made in Notepad\. Honest\./.test(String(text))) {
          const r = source99();
          if (r) { A.secret('evt.source'); if (curKey() === 'mag:home') Ev.argStep(1); if (/backstage/.test(typeof r === 'string' ? r : r.text)) A.secret('web.source'); /* that page's own check reads the window's text, which a textarea doesn't have */ return np0.call(this, typeof r === 'string' ? name : r.name, typeof r === 'string' ? r : r.text); }
        }
      } catch (e) { console.error('view source', e); }
      return np0.apply(this, arguments);
    };
  }

  // ================================================================ the trail's progress (for the hint board)
  Ev.argStep = n => { const p = store.get('jhp_events_arg', { s: 0 }); if (n > (p.s | 0)) { p.s = n; if (!p.t0) p.t0 = Date.now(); store.set('jhp_events_arg', p); } if (n >= 2) Ev.send({ t: 'argMark', s: n }); };
  Ev.argProgress = () => store.get('jhp_events_arg', { s: 0 });

  // ================================================================ the web sites (pages fill themselves once their file has loaded)
  function page(mod, fn) {
    return () => {
      const el = h('div', 'ev-wait', `<p>Contacting host... Host contacted. Waiting for reply...<br>Receiving data at 3.4 KB/sec...</p>`);
      Ev.load(mod).then(() => { const M = window[fn.split('.')[0]], g = M && M[fn.split('.')[1]]; if (g) g(el); })
        .catch(e => { console.error(e); el.innerHTML = '<h2>The page cannot be displayed</h2><p>The server is not answering. Click <b>Refresh</b>, or try again later. (Mom might be on the phone.)</p>'; });
      return el;
    };
  }
  const SITES = [
    // host, title, desc, cat, file, renderer, { path: [title, index text] }, hidden
    ['www.whatson.jnet', "WHAT'S ON? The JackNet Listings", 'This week on the JackNet: LAN Night, the Grand Quiz, the Hangout Theme Night, the Request Hour and the Cover CD Launch Party. Times, prizes and who is there now. Plus CYBERTEXT, the text service.', 'news', 'guide', 'EvGuide.page',
      { '/': ["WHAT'S ON? This Week on the JackNet", 'listings what is on this week events lan night quiz night theme night request hour cover cd launch party prizes reminders tv guide'], '/text.html': ['CYBERTEXT - the JackNet text service', 'teletext text service pages index now and next radio pet vault page numbers fastext reveal'] }],
    ['www.listeningparty.wubwub', 'RADIO JACK LISTENING PARTY - Everybody Hears The Same Tune!', 'Radio Jack plays ten brand new chiptunes, in sync, for everyone on the JackNet at once. Request a tune and send a dedication. Thursday 8pm: the Request Hour!', 'fun', 'radio', 'EvRadio.page',
      { '/': ['RADIO JACK LISTENING PARTY', 'radio listening party chiptunes music tunes request dedication listeners now playing playlist tuner'] }],
    ['www.bytepet.jnet', "BYTE - The JackNet's Very Own Pet", 'One pet for the whole JackNet! Feed Byte, play with Byte, give Byte a bath. Byte grows up as everyone looks after it. It never dies (it just sulks a bit).', 'kids', 'pet', 'EvPet.page',
      { '/': ["BYTE - The JackNet's Pet", 'virtual pet byte egg bit nibble kilobyte megabyte feed play clean tuck in top carers e-pet tray'] }],
    ['www.millenniumvault.jnet', 'THE MILLENNIUM VAULT - Bury a Time Capsule!', 'Write a message (and draw a picture) for the year 2000. Every capsule is sealed in the vault until Y2K Night, then EVERYONE\'s capsules open at once.', 'comm', 'capsule', 'EvCap.page',
      { '/': ['THE MILLENNIUM VAULT', 'time capsule millennium year 2000 y2k message drawing bury sealed vault opens midnight'], '/archive.html': ['THE MILLENNIUM VAULT - Opened Capsules', 'archive opened capsules past millenniums'] }],
    ['www.puzzleboard.cyb', 'The Puzzle Board - Brain Teasers, Riddles & Stuck? Threads', 'A message board for people who like puzzles. Riddles, logic problems and a very long thread about some strange comments in the source of a games magazine\'s home page...', 'sci', 'arg', 'EvArg.board',
      { '/': ['The Puzzle Board', 'puzzles riddles brain teasers stuck hints help thread page source comments nightowl strange'] }],
    ['www.nocarrier.cyb', 'NO CARRIER', '', 'weird', 'arg', 'EvArg.bbs', { '/': ['NO CARRIER', ''] }, true],
    ['www.owlsnest.cyb', "The Owl's Nest", '', 'weird', 'arg', 'EvArg.nest', { '/': ["The Owl's Nest", ''] }, true],
  ];
  if (window.IE && IE.addSite) for (const [host, title, desc, cat, mod, fn, paths, hidden] of SITES) {
    const pages = {};
    for (const p in paths) pages[p] = { title: paths[p][0], html: page(mod, fn), text: hidden ? '' : paths[p][0] + '. ' + paths[p][1] };
    IE.addSite(host, hidden ? { title, pages, hidden: true, noindex: 'hide' } : { title, desc, cat, pages });
  }
  Ev.path = () => { const u = String(($('addrBar') || {}).value || ''); const m = /^https?:\/\/[^/]+(\/[^#?]*)?/i.exec(u); return (m && m[1]) || '/'; };

  // ================================================================ programs, Start menu, Run
  const G = ['JackNet Events'];
  A.register('evt.room', { single: false, cmd: ['eventroom', 'event room', 'events'], open: id => Ev.room(id || ([...live.values()][0] || {}).id || '') });
  A.register('evt.tuner', { single: true, cmd: ['tunorama', 'tunorama.exe', 'partytuner', 'listeningparty'], open: () => Ev.load('radio').then(() => EvRadio.tuner()) });
  A.register('evt.pet', { single: true, cmd: ['epet', 'epet2000', 'epet2000.exe', 'byte'], open: () => Ev.load('pet').then(() => EvPet.win()) });
  A.register('evt.owldesk', { single: true, cmd: ['owldesk', 'owldesk.exe'], open: () => Ev.load('arg').then(() => EvArg.desk()) });
  A.addProgram([...G, "What's On This Week"], () => Ev.go('http://www.whatson.jnet/'), ICO.whatson);
  A.addProgram([...G, 'CYBERTEXT (teletext)'], () => Ev.go('http://www.whatson.jnet/text.html'), ICO.whatson);
  A.addProgram([...G, 'Event Room'], 'evt.room', ICO.room);
  A.addProgram([...G, 'Tune-O-Rama Party Tuner'], 'evt.tuner', ICO.tuner);
  A.addProgram([...G, 'Byte (e-Pet Tray 2000)'], 'evt.pet', ICO.pet);
  A.addProgram([...G, 'The Millennium Vault'], () => Ev.go('http://www.millenniumvault.jnet/'), ICO.vault);
  A.addProgram([...G, 'The Puzzle Board'], () => Ev.go('http://www.puzzleboard.cyb/'), ICO.board);
  A.cmd(['whatson', "what's on", 'whats on', 'listings', 'tvguide'], () => Ev.go('http://www.whatson.jnet/'));
  A.cmd(['cybertext', 'teletext2'], () => Ev.go('http://www.whatson.jnet/text.html'));
  A.cmd(['vault', 'millennium vault', 'millenniumvault'], () => Ev.go('http://www.millenniumvault.jnet/'));
  A.cmd(['bytepet', 'jacknet pet'], () => Ev.go('http://www.bytepet.jnet/'));
  A.cmd(['puzzleboard', 'puzzles', 'stuck'], () => Ev.go('http://www.puzzleboard.cyb/'));
  A.cmd(['nocarrier', 'no carrier', 'atdt'], () => { Desk.msgbox('Dial-Up Networking', 'NO CARRIER\n\n(The line went quiet. Some boards can only be reached by their proper address.)', 'warn'); });
  A.desktopIcon("What's On", ICO.whatson, () => Ev.go('http://www.whatson.jnet/'), 'evIconWhatsOn');
  try {
    if (window.Setup && Setup.product) {
      Setup.product('evt.tuner', { n: 'Tune-O-Rama Party Tuner', v: '1.2', kb: 344, lic: 'Freeware', by: 'Radio Jack Interactive', cat: 'fun', sq: 5, rel: '05/06/99', ic: 'radio', def: false,
        d: 'Tune in to the Radio Jack Listening Party from your desktop! Hear exactly the same tune as everyone else on the JackNet, see who is listening and send requests with dedications.', note: 'Requires a sound card. Speakers recommended. Neighbours not consulted.',
        home: 'http://www.listeningparty.wubwub/', apps: ['evt.tuner'], paths: ['JackNet Events > Tune-O-Rama Party Tuner'], launch: 'evt.tuner', exe: 'TUNORAMA.EXE', dir: 'Tune-O-Rama' });
      Setup.product('evt.pettray', { n: 'e-Pet Tray 2000', v: '2.0', kb: 188, lic: 'Freeware', by: 'Byte Fan Club', cat: 'fun', sq: 5, rel: '14/08/99', ic: 'grotchi', def: false,
        d: 'Byte, the JackNet\'s very own pet, lives in your system tray! See how Byte is feeling at a glance, and feed, play and clean without opening a web page. Shared with everyone on the JackNet.', note: 'Byte does not need batteries. Byte needs crisps.',
        home: 'http://www.bytepet.jnet/', apps: ['evt.pet'], paths: ['JackNet Events > Byte (e-Pet Tray 2000)'], launch: 'evt.pet', exe: 'EPET2000.EXE', dir: 'e-Pet 2000' });
    }
  } catch (e) { console.error(e); }

  // ================================================================ Byte in the tray (once e-Pet Tray 2000 is installed)
  let petTray = null, petView = null;
  const MOODC = { happy: '#40d060', ok: '#30c0c0', hungry: '#ffb000', bored: '#a0a0ff', grubby: '#a08040', sleepy: '#8080c0', grumpy: '#ff5050', egg: '#f0f0d0' };
  const petIcon = mood => {
    const c = MOODC[mood] || '#30c0c0';
    if (mood === 'egg') return '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path d="M8 1c3 0 6 5 6 9s-3 5-6 5-6-1-6-5 3-9 6-9z" fill="#f8f0d0" stroke="#000"/><rect x="6" y="6" width="2" height="2" fill="#40c0c0"/><rect x="9" y="10" width="2" height="2" fill="#ff8ad0"/></svg>';
    const eyes = mood === 'sleepy' ? '<path d="M5 7h2M9 7h2" stroke="#000"/>' : mood === 'happy' ? '<path d="M5 7l1-1 1 1M9 7l1-1 1 1" stroke="#000" fill="none"/>' : mood === 'grumpy' ? '<path d="M5 6l2 1M11 6l-2 1" stroke="#000"/>' : '<rect x="5" y="6" width="2" height="2" fill="#000"/><rect x="9" y="6" width="2" height="2" fill="#000"/>';
    const mouth = mood === 'happy' || mood === 'ok' ? '<path d="M6 10h4M5 9h1M10 9h1" stroke="#000"/>' : mood === 'hungry' ? '<rect x="7" y="9" width="2" height="2" fill="#000"/>' : '<path d="M6 11h4M5 12h1M10 12h1" stroke="#000"/>';
    return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path d="M8 0v2" stroke="#000"/><rect x="7" y="0" width="2" height="1" fill="#ff3"/><rect x="2" y="3" width="12" height="11" rx="3" fill="${c}" stroke="#000"/><rect x="4" y="14" width="2" height="2" fill="#000"/><rect x="10" y="14" width="2" height="2" fill="#000"/>${eyes}${mouth}</svg>`;
  };
  Ev.petIcon = petIcon;
  const MOODT = { happy: 'happy!', ok: 'fine', hungry: 'hungry', bored: 'bored', grubby: 'a bit grubby', sleepy: 'sleepy', grumpy: 'grumpy (needs some love)', egg: 'an egg (keep it warm!)' };
  function trayPet() {
    const want = !!(window.Setup && Setup.has && Setup.has('evt.pettray'));
    if (!want) { if (petTray) { petTray.remove(); petTray = null; Ev.send({ t: 'bpSub', on: false }); } return; }
    const tr = $('tray'); if (!tr) return;
    if (!petTray) {
      petTray = h('button', 'ev-tray sys-tray ev-ptray'); petTray.type = 'button';
      tr.insertBefore(petTray, $('clock') || null);
      petTray.addEventListener('click', ev => { ev.stopPropagation(); A.open('evt.pet'); A.secret('evt.bytetray'); });
      petTray.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); const r = petTray.getBoundingClientRect(); IE.menu([{ label: 'Open Byte', act: () => A.open('evt.pet') }, '-', ...['feed', 'play', 'clean', 'pat'].map(a => ({ label: { feed: 'Feed', play: 'Play', clean: 'Clean', pat: 'Pat' }[a], act: () => { if (window.Guest && !Guest.need('Looking after Byte')) return; Ev.send({ t: 'bpAct', a }); } })), '-', { label: 'Visit www.bytepet.jnet', act: () => Ev.go('http://www.bytepet.jnet/') }], Math.max(4, r.left - 120), r.top - 150); });
      Ev.send({ t: 'bpSub', on: true });
    }
    const md = petView && petView.pet ? petView.pet.mood : 'ok';
    petTray.innerHTML = petIcon(md);
    const t = `Byte is ${MOODT[md] || 'fine'}`; petTray.title = t; petTray.setAttribute('aria-label', t);
  }
  Ev.on('bpSay', m => { if (!document.querySelector('.ep-win') && !document.querySelector('.sec.on .bp') && m.text) Desk.toast('Byte', m.text, 4000); });
  if (window.Net) Net.on('welcome', () => { petTray = petTray && petTray.isConnected ? petTray : null; if (petTray) Ev.send({ t: 'bpSub', on: true }); });
  setInterval(trayPet, 8000); setTimeout(trayPet, 2500);

  // ================================================================ files on C:
  const fs = A.fs;
  fs.add('C:/Program Files/JackNet Events', { name: 'README.TXT', type: 'txt', date: '01/09/99', size: '2 KB', text: `JACKNET EVENTS - WHAT'S ON EVERY WEEK
=====================================

All times are UK time. Your PC tells you when something is about to start
(look for the star in the system tray, next to the clock).

  WEDNESDAY  7pm  HANGOUT THEME NIGHT      a new theme every week, in the Hangout
  THURSDAY   8pm  THE REQUEST HOUR         Radio Jack: request a tune + dedication
  FRIDAY     8pm  JACKREAL TOURNAMENT      LAN Night! every frag counts
                  LAN NIGHT
  SUNDAY     7pm  GRAND QUIZ NIGHT         QuizJack in JackIRC #quiznight
  1st SATURDAY    COVER CD LAUNCH PARTY    6pm, pull a party popper!

Prizes are paid in Rupees (JackNet members only, joining is FREE).
The full listings: www.whatson.jnet   (or Start > Run > whatson)

Not into events? Right-click the star in the tray and untick "Reminders on".
` });
  fs.add('C:/My Documents', { name: 'Dear Millennium.txt', type: 'txt', date: '12/10/99', size: '1 KB', text: `Things to put in my Millennium Vault capsule (www.millenniumvault.jnet)
-----------------------------------------------------------------------
- my best Jacktris score (if I ever beat Dave's)
- a drawing of Gubbinz
- a message to me in the year 2000: DID THE COMPUTERS ALL BLOW UP?
- what a floppy disk is (in case nobody remembers)
- tell them about the Cube. They will not believe me.

It opens on Y2K night. EVERYONE's opens at once. Mom says I can stay up.
` });
  // the puzzle trail leaves a log in the temp folder (ROT13 in the page source of www.nocarrier.cyb points here)
  fs.add('C:/JACKOS/TEMP', { name: 'NOCARRIR.LOG', type: 'txt', date: '31/12/96', size: '3 KB', secret: 'arg.log', text: `NO CARRIER BBS - SESSION LOG (node 1)
=====================================
[23:41:02] ATZ
[23:41:02] OK
[23:41:03] AT&F1 S0=1
[23:41:03] OK
[23:41:09] RING
[23:41:15] CONNECT 14400/ARQ/V32BIS/LAPM/V42BIS
[23:41:16] LOGIN: NIGHTOWL
[23:41:18] PASSWORD: *********
[23:41:18] Welcome back, SysOp. 0 new messages. 1 caller today (you).
[23:41:30] SYSOP NOTES (read these, whoever you are):

    Sorry the board is closing. Phone bills, school, Mom. You know.
    I left something behind for anyone clever enough to look.
    Go and find my little program. It still works.
    No JackOS needed: it only runs at the old C:\\> prompt.
    Any key to stop it, once it starts.
    Look down the left-hand side of these notes for its name.

[23:58:59] Keep this word safe, you'll need it at the very end. WORD ONE: NEVER
[23:59:59] +++
[23:59:59] ATH0
[23:59:59] NO CARRIER
` });

  // ================================================================ MS-DOS: SIGNAL (the trail)
  const DOS = window.DOS;
  if (DOS) {
    DOS.progs = DOS.progs || {};
    DOS.progs.signal = async (sh, args) => {
      if (/\/\?/.test(args || '')) { sh.println('SIGNAL.EXE v0.9 (c) 1996 NIGHTOWL\n\nListens for a carrier and reports what it hears.\nOutput is in Morse code: dots, dashes, a space between letters.\nNo cheating with a radio ham. (Actually, that is allowed.)'); return; }
      A.secret('arg.signal'); Ev.argStep(4);
      const wait = ms => new Promise(r => setTimeout(r, ms));
      sh.println('SIGNAL.EXE v0.9 (c) 1996 NIGHTOWL');
      sh.println('Listening on COM2 (2400 baud)...'); await wait(500);
      const wave = ['.:\'\':..:\'\':..:\'\':..:\'\':..:\'\':..:', ':..:\'\':..:\'\':..:\'\':..:\'\':..:\'\':.'];
      for (let i = 0; i < 4; i++) { sh.println('  ' + wave[i % 2]); await wait(250); }
      sh.println('CARRIER DETECTED.');
      sh.println('Decoding... the carrier says:'); await wait(400);
      sh.println('');
      sh.println('  TUNE TO CYBERTEXT (the text service at www.whatson.jnet).');
      sh.println('  PAGE NUMBER FOLLOWS, ONE DIGIT AT A TIME:');
      sh.println('');
      sh.println('      --...     ...--     ....-');
      sh.println('');
      sh.println('  THEN PRESS REVEAL.');
      sh.println('');
      sh.println('NO CARRIER');
    };
  }

  // ================================================================ secrets
  [['evt.source', 'View Source, 1999 edition', 'Have a look under the bonnet of any web page (View > Source)'],
    ['evt.whatson', 'Couch potato', 'Read the JackNet listings for this week'],
    ['evt.ttx', 'Text service', 'Flick through a teletext service that is all about the JackNet'],
    ['evt.event', 'Party animal', 'Be online when a weekly JackNet event starts'],
    ['evt.join', 'Turned up', 'Join a live event from the Event Room'],
    ['evt.pop', 'POP!', 'Pull a party popper at a launch party'],
    ['evt.radio', 'In sync', 'Listen to the same tune as everyone else, at the same time'],
    ['evt.req', 'Request line', 'Request a tune with a dedication'],
    ['evt.byte', 'Pet sitter', 'Look after the JackNet\'s very own pet'],
    ['evt.bytetray', 'Pocket pet', 'Get the JackNet\'s pet into your system tray'],
    ['evt.bury', 'Dear Millennium', 'Bury a time capsule for the year 2000'],
    ['evt.draw', 'Cave painting', 'Draw a picture for the future'],
    ['evt.wall', 'Opened at midnight', 'Read everyone\'s time capsules when the vault opens'],
    ['arg.hex', 'Hex marks the spot', 'Somebody left a note in the source of the home page...'],
    ['arg.log', 'Captain\'s log', 'An old bulletin board left its log on your PC'],
    ['arg.signal', 'Carrier detected', 'Some programs only run at the C:\\> prompt'],
    ['arg.ttx', 'Reveal all', 'Hidden text on a page that is not in the index'],
    ['arg.bbs', 'Logged on', 'Log on to a bulletin board that closed in 1996'],
    ['arg.door', 'Door number seven', 'Not every door is on the menu'],
    ['arg.ring', 'Decoder ring', 'Every message he wrote started with his name'],
    ['arg.desk', 'Somebody else\'s desk', 'Run a program nobody installed'],
    ['arg.drawer', 'Nerd combination', 'Open a lock with three numbers every nerd knows'],
    ['arg.nest', 'The nest', 'Unscramble an address'],
    ['arg.solved', 'NO CARRIER... CARRIER DETECTED', 'Solve the whole puzzle trail'],
    ['arg.board', 'Stuck?', 'Ask the Puzzle Board for a hint'],
  ].forEach(s => A.defineSecret(s[0], s[1], s[2]));
})();

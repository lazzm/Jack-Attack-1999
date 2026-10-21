/* jw-world: JACKWORLD 99, the client program. One window: the room (a canvas drawn by js/jw-art.js), speech bubbles and
 * name tags on top, the chat bar and the big buttons underneath, and pop-out panels (Rooms, Catalogue, My Stuff,
 * Wardrobe, My Room, Help). The server (mods/jw.js) plans every walk and owns everything; we just draw it smoothly.
 * window.JWWorld.open(roomId?) */
(function () {
  'use strict';
  if (window.JWWorld) return;
  const A = window.Apps, C = window.JWCat, ART = window.JWArt, JW = window.JW;
  if (!A || !C || !ART || !JW) return;
  const esc = A.esc, store = A.store, STEP = C.STEP;
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };
  const now = () => Date.now();
  const member = () => !!(window.Net && Net.me && Net.me.member);
  const myId = () => (window.Net && Net.me ? Net.me.id : 0);
  const hash = s => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
  const fmt = n => Math.floor(+n || 0).toLocaleString('en-GB');
  const rp = n => JW.rp(n);
  const PREF = 'jhp_jw';
  const pref = (k, d) => { const o = store.get(PREF, {}) || {}; return k in o ? o[k] : d; };
  const setPref = (k, v) => { const o = store.get(PREF, {}) || {}; o[k] = v; store.set(PREF, o); };
  const FRI = () => { const d = new Date(); return d.getDay() === 5 && d.getHours() >= 18 && d.getHours() < 23; };
  const SCHOOL = () => { const d = new Date(), m = d.getHours() * 60 + d.getMinutes(); return d.getDay() >= 1 && d.getDay() <= 5 && m >= 15 * 60 + 20 && m < 18 * 60 + 30; };
  const ICONS = {
    rooms: '<svg viewBox="0 0 32 32"><path d="M4 10l12-6 12 6-12 6z" fill="#7ad06a" stroke="#000"/><path d="M4 10v10l12 6V16z" fill="#2f8a3a" stroke="#000"/><path d="M28 10v10l-12 6V16z" fill="#1e6e2a" stroke="#000"/><path d="M20 3l7 0v5l-2-1-2 2z" fill="#ffd400" stroke="#000" stroke-width=".7"/></svg>',
    cat: '<svg viewBox="0 0 32 32"><rect x="6" y="4" width="20" height="25" rx="1" fill="#d8342c" stroke="#000"/><rect x="9" y="7" width="14" height="9" fill="#fff" stroke="#000" stroke-width=".7"/><path d="M11 14l3-4 2 3 2-2 3 3z" fill="#3266d6"/><rect x="9" y="19" width="14" height="2" fill="#ffd400"/><rect x="9" y="23" width="9" height="2" fill="#ffd400"/><path d="M26 4v25" stroke="#7a1a1a" stroke-width="2"/></svg>',
    stuff: '<svg viewBox="0 0 32 32"><path d="M4 12h24v16H4z" fill="#a0703a" stroke="#000"/><path d="M4 12l3-7h18l3 7z" fill="#c8904a" stroke="#000"/><rect x="13" y="15" width="6" height="5" rx="1" fill="#ffd400" stroke="#000"/><path d="M4 20h24" stroke="#5a3a1a"/></svg>',
    look: '<svg viewBox="0 0 32 32"><rect x="11" y="13" width="10" height="11" fill="#3266d6" stroke="#000"/><rect x="12" y="24" width="3" height="5" fill="#3a3a44"/><rect x="17" y="24" width="3" height="5" fill="#3a3a44"/><rect x="11" y="3" width="10" height="10" fill="#f6d2b0" stroke="#000"/><rect x="11" y="2" width="10" height="4" fill="#5a3418"/><rect x="14" y="8" width="1.4" height="2" fill="#000"/><rect x="18" y="8" width="1.4" height="2" fill="#000"/><path d="M23 6l5-2v8l-5-2z" fill="#ffd400" stroke="#000" stroke-width=".6"/></svg>',
    home: '<svg viewBox="0 0 32 32"><path d="M3 15L16 4l13 11" fill="none" stroke="#000" stroke-width="2"/><path d="M6 14v14h20V14L16 6z" fill="#efe4c8" stroke="#000"/><rect x="13" y="19" width="6" height="9" fill="#a0703a" stroke="#000"/><rect x="8" y="16" width="4" height="4" fill="#9cc8ec" stroke="#000" stroke-width=".6"/><rect x="20" y="16" width="4" height="4" fill="#9cc8ec" stroke="#000" stroke-width=".6"/><path d="M14 8l2-2 2 2" fill="#d8342c"/></svg>',
    help: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#ffd400" stroke="#000"/><text x="16" y="22" text-anchor="middle" font-family="Arial Black,Arial" font-size="17" font-weight="bold">?</text></svg>',
    smile: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#ffd400" stroke="#000"/><circle cx="5.5" cy="6" r="1"/><circle cx="10.5" cy="6" r="1"/><path d="M4.5 9.5c2 2.4 5 2.4 7 0" fill="none" stroke="#000" stroke-width="1.2"/></svg>',
    heart: '<svg viewBox="0 0 16 16"><path d="M8 14S1 9.5 1 5.2C1 2.8 3 1.5 4.7 1.5 6.2 1.5 7.4 2.5 8 3.6 8.6 2.5 9.8 1.5 11.3 1.5 13 1.5 15 2.8 15 5.2 15 9.5 8 14 8 14z" fill="#e0306a" stroke="#000"/></svg>',
    book: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#3fa34a" stroke="#000"/><rect x="4" y="4" width="8" height="2" fill="#fff"/><rect x="4" y="8" width="6" height="1" fill="#fff"/><rect x="4" y="10" width="7" height="1" fill="#fff"/></svg>',
    lock: '<svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="7" fill="#ffd400" stroke="#000"/><path d="M5 7V5a3 3 0 016 0v2" fill="none" stroke="#000" stroke-width="1.4"/></svg>',
    bell: '<svg viewBox="0 0 16 16"><path d="M3 12h10l-1.5-2V7a3.5 3.5 0 00-7 0v3z" fill="#ffd400" stroke="#000"/><circle cx="8" cy="13.5" r="1.4"/></svg>',
    people: '<svg viewBox="0 0 16 16"><circle cx="5" cy="5" r="2.5" fill="#f6d2b0" stroke="#000" stroke-width=".7"/><rect x="2.5" y="8" width="5" height="6" fill="#d8342c" stroke="#000" stroke-width=".7"/><circle cx="11" cy="5" r="2.5" fill="#a8704a" stroke="#000" stroke-width=".7"/><rect x="8.5" y="8" width="5" height="6" fill="#3266d6" stroke="#000" stroke-width=".7"/></svg>',
    plus: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="5" fill="#fff" stroke="#000" stroke-width="1.4"/><path d="M11 11l4 4M4.5 7h5M7 4.5v5" stroke="#000" stroke-width="1.6"/></svg>',
    minus: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="5" fill="#fff" stroke="#000" stroke-width="1.4"/><path d="M11 11l4 4M4.5 7h5" stroke="#000" stroke-width="1.6"/></svg>',
    fit: '<svg viewBox="0 0 16 16"><path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4" fill="none" stroke="#000" stroke-width="1.6"/></svg>',
  };
  const PUBICO = { lobby: '#7a5a8a', arcade: '#2a1a4a', roof: '#5a5a6a', square: '#a8a090', park: '#5ab04a', beach: '#e8cf8a', space: '#14142a', peak: '#eef4ff', moon: '#a8a8ac', library: '#3a5a3a' };
  const EMOS = [['wave', 'Wave'], ['dance', 'Dance'], ['sit', 'Sit down'], ['jump', 'Jump'], ['laugh', 'Laugh'], ['cool', 'Be cool'], ['think', 'Think'], ['love', 'Love'], ['cry', 'Cry'], ['sleep', 'Snooze'], ['waaagh', 'WAAAGH!'], ['stand', 'Stand up']];

  // ================================================================ state
  let S = null; // the open window's everything
  const LOOK = { av: null };
  function myAv() {
    if (LOOK.av && C.avOk(LOOK.av)) return LOOK.av;
    const me = JW.me; if (me && me.av && C.avOk(me.av)) return (LOOK.av = me.av.slice());
    const saved = pref('av', null); if (saved && C.avOk(saved)) return (LOOK.av = saved);
    return (LOOK.av = C.avOf((Net.me && Net.me.nick) || 'guest' + Math.random()));
  }

  // ================================================================ the window
  function open(arg) {
    if (S && S.win && !S.win.closed) { S.win.restore(); S.win.focus(); if (arg && typeof arg === 'string') goRoom(arg); return S.win; }
    JW.css();
    const body = h('div', 'jw-app');
    body.innerHTML = `
      <div class="jw-view" tabindex="0" aria-label="The room. Click the floor to walk.">
        <canvas class="jw-cv"></canvas>
        <div class="jw-ov"></div>
        <div class="jw-bubs"></div>
        <div class="jw-roominfo" hidden></div>
        <div class="jw-hud" hidden></div>
        <div class="jw-zoom"><button type="button" data-z="in" title="Zoom in" aria-label="Zoom in">${ICONS.plus}</button><button type="button" data-z="out" title="Zoom out" aria-label="Zoom out">${ICONS.minus}</button><button type="button" data-z="fit" title="Fit the room in the window" aria-label="Fit room">${ICONS.fit}</button></div>
        <div class="jw-placebar" hidden></div>
        <div class="jw-pane" hidden></div>
        <div class="jw-loading"><div class="jw-logo">JACK<b>WORLD</b><small>99</small></div><div class="jw-lmsg">Connecting to the JackWorld server...</div><div class="jw-lbar"><i></i></div></div>
      </div>
      <form class="jw-chat" autocomplete="off">
        <button type="button" class="jw-emobtn" title="Moves and faces (wave, dance, sit...)" aria-label="Emotes">${ICONS.smile}</button>
        <input type="text" maxlength="140" placeholder="Type here to chat, then press Enter" aria-label="Say something">
        <button type="submit" class="btn jw-say">Say</button>
        <button type="button" class="btn jw-logb" title="What everyone has said (chat log)" aria-label="Chat log">Log</button>
      </form>
      <div class="jw-bar">
        <button type="button" data-p="rooms" title="Go to another room">${ICONS.rooms}<span>Rooms</span></button>
        <button type="button" data-p="cat" title="Buy furni with Rupees">${ICONS.cat}<span>Catalogue</span></button>
        <button type="button" data-p="stuff" title="Your furni (put it out in your room)">${ICONS.stuff}<span>My Stuff</span></button>
        <button type="button" data-p="look" title="Change how you look">${ICONS.look}<span>Wardrobe</span></button>
        <button type="button" data-p="home" title="Your own room">${ICONS.home}<span>My Room</span></button>
        <button type="button" data-p="help" title="How to play">${ICONS.help}<span>Help</span></button>
      </div>`;
    const win = A.win('JackWorld 99', body, { w: 920, h: 660, icon: JW.ICO.world.replace('<svg', '<svg width="16" height="16"'), status: true, minW: 300, minH: 360, onClose: close });
    S = {
      win, body, view: body.querySelector('.jw-view'), cv: body.querySelector('.jw-cv'), ov: body.querySelector('.jw-ov'), bubs: body.querySelector('.jw-bubs'), pane: body.querySelector('.jw-pane'),
      hud: body.querySelector('.jw-hud'), info: body.querySelector('.jw-roominfo'), placebar: body.querySelector('.jw-placebar'), load: body.querySelector('.jw-loading'),
      room: null, av: new Map(), cam: { z: 0, x: 0, y: 0, fit: true }, dpr: 1, hover: null, place: null, fx: [], balls: [], offs: [], dirty: true, raf: 0, frame: 0, lastFrame: 0,
      game: null, panel: '', want: typeof arg === 'string' ? arg : '', ringing: new Map(), ready: false, tour: new Set(pref('tour', [])), clicks: {},
    };
    S.g = S.cv.getContext('2d');
    wire(); bindUI(); resize();
    if (window.ResizeObserver) { S.ro = new ResizeObserver(() => resize()); S.ro.observe(S.view); } else window.addEventListener('resize', resize);
    loop();
    status('Connecting...');
    start();
    return win;
  }
  function close() {
    if (!S) return;
    JW.send({ t: 'jwOut' }); JW.playTune(-1);
    S.offs.forEach(f => f()); cancelAnimationFrame(S.raf); clearInterval(S.hudT); if (S.ro) S.ro.disconnect();
    S = null;
  }
  const status = t => { if (S && S.win.status) S.win.status.textContent = t; };
  function start() {
    const go = () => {
      if (!S) return;
      JW.send({ t: 'jwMe' });
      const first = !pref('made', false);
      const r = S.want || pref('room', 'lobby');
      if (first) { setTimeout(() => { if (S) { S.load.hidden = true; S.view.classList.add('jw-empty'); openPanel('look', { first: true }); } }, 300); return; }
      goRoom(C.PUB[r] || /^m\d+$/.test(r) ? r : 'lobby');
    };
    if (window.Net && Net.connected) setTimeout(go, 500); else { lmsg('Dialling up... (it\'s a 56K modem, be patient)'); const t = setInterval(() => { if (!S) return clearInterval(t); if (Net.connected) { clearInterval(t); go(); } }, 500); }
  }
  function lmsg(t) { if (!S) return; S.load.querySelector('.jw-lmsg').textContent = t; }
  function goRoom(id) {
    if (!S) return;
    S.going = id; lmsg('Going to ' + (C.PUB[id] ? C.PUB[id].n : 'a member\'s room') + '...');
    S.load.hidden = false; S.load.classList.add('on');
    JW.send({ t: 'jwGo', r: id, av: member() ? undefined : myAv(), secret: id === 'moon' && S.room && S.room.id === 'space' ? 1 : undefined });
  }

  // ================================================================ the wire (server -> us)
  function wire() {
    const on = (t, fn) => S.offs.push(JW.on(t, m => { if (S) fn(m); }));
    on('jwRoom', enterRoom);
    on('jwIn', m => { addAv(m.o); if (S.room) S.room.count = S.av.size; drawInfo(); if (S.panel === 'who') openPanel('who'); });
    on('jwOut', m => { const a = S.av.get(m.id); if (a) { S.av.delete(m.id); if (a.tag) a.tag.remove(); } drawInfo(); S.dirty = true; });
    on('jwMv', m => { const a = S.av.get(m.id); if (!a) return; setPath(a, m.p, m.d); });
    on('jwTp', m => { const a = S.av.get(m.id); if (!a) return; a.path = [[m.x, m.y]]; a.t0 = now(); a.from = null; puff(m.x, m.y, '#7ac0ff'); if (m.id === myId()) A.secret('jw.tele'); S.dirty = true; });
    on('jwSay', m => onSay(m));
    on('jwEmo', m => onEmo(m));
    on('jwAv', m => { const a = S.av.get(m.id); if (!a) return; a.av = m.av; a.nick = m.nick; a.member = !!m.m; S.dirty = true; });
    on('jwCarry', m => { const a = S.av.get(m.id); if (a) { a.carry = m.c; a.carryT = now() + 120000; S.dirty = true; } if (m.id === myId()) sfx('click'); });
    on('jwDing', () => sfx('beep'));
    on('jwJuke', m => { if (m.tune >= 0) { JW.playTune(m.tune, m.game ? 0 : 15000); if (!m.game && m.by) toast(`${m.by} put on "${JW.tunes[m.tune % JW.tunes.length]}" on the jukebox. (Turn your speakers on to hear it!)`); } else JW.playTune(-1); });
    on('jwF', m => { if (!S.room || S.room.pub) return; const R = S.room.R, i = R.f.findIndex(f => f.u === m.f.u); if (i >= 0) R.f[i] = m.f; else R.f.push(m.f); buildItems(); if (S.place && S.place.u === m.f.u) endPlace(); deco(); });
    on('jwFx', m => { if (!S.room || S.room.pub) return; S.room.R.f = S.room.R.f.filter(f => f.u !== m.u); buildItems(); });
    on('jwFs', m => { const it = S.room && S.room.items.find(x => (m.u != null ? x.u === m.u : x.i === m.i)); if (it) { it.s = m.s; if (it.F.use === 'dice') { it.roll = m.s ? 0 : now() + 900; } if (it.F.use === 'disco' && it.s) checkDance(); S.dirty = true; } });
    on('jwBallMv', m => { const it = S.room && S.room.items.find(x => (m.u != null ? x.u === m.u : x.i === m.i)); if (it) { it.ax = it.x; it.ay = it.y; it.at = now(); it.x = m.x; it.y = m.y; S.dirty = true; } });
    on('jwStyle', m => { if (!S.room || S.room.pub) return; S.room.R[m.k] = m.id; buildStatic(); });
    on('jwInfo2', m => { if (!S.room || S.room.pub) return; Object.assign(S.room.R, m); drawInfo(); if (S.panel === 'home') openPanel('home'); });
    on('jwLikes', m => { if (S.room && S.room.id === m.r) { S.room.R.likes = m.n; if (m.by === (Net.me && Net.me.nick)) { S.room.liked = true; A.secret('jw.like'); } drawInfo(); } });
    on('jwNo', m => onNo(m));
    on('jwWait', m => { lmsg(`Ding dong! You rang the doorbell of "${m.n}". Waiting for somebody to answer...`); A.secret('jw.bell'); sfx('beep'); });
    on('jwRing', m => ring(m));
    on('jwRang', m => { const el = S.ringing.get(m.id); if (el) { el.remove(); S.ringing.delete(m.id); } });
    on('jwKicked', m => { Desk.msgbox('JackWorld', m.clear ? 'A JackWorld Moderator has cleared that room. Off you go to the Lobby!' : `You've been asked to leave by ${m.by}. You can't go back in for 15 minutes.`, 'info'); });
    on('jwMade', m => { A.secret('jw.home'); JW.send({ t: 'jwMe' }); toast('Your room is ready! Taking you there now...'); goRoom(m.r); });
    on('jwBought', m => { sfx('solve'); A.secret('jw.buy'); if (m.rare) A.secret('jw.rare'); const F = C.FURNI[m.id]; toast(`Bought ${F ? F.n : 'furni'}${m.n > 1 ? ' x' + m.n : ''}! It's in My Stuff.${S.room && S.room.mine ? ' Press My Stuff to put it out.' : ''}`); if (S.panel === 'cat') refreshPanel(); });
    on('jwMe2', m => { if (JW.me) JW.me.st = m.st; if (S.panel === 'cat' || S.panel === 'home') refreshPanel(); });
    on('jwMe', () => { if (S.panel === 'cat' || S.panel === 'home' || S.panel === 'look') refreshPanel(); });
    on('jwNav', m => { if (S.panel === 'rooms') navList(m); });
    on('jwGb', m => { if (S.panel === 'gb') gbList(m); });
    on('jwKeys', m => { if (S.room && S.room.R) S.room.R.keys = m.keys; if (S.panel === 'home') openPanel('home'); });
    on('jwReported', () => toast('Thanks! Your report has gone to the JackWorld Moderators. They\'ll take a look.'));
    on('jwG', m => { S.game = m.g; if (m.g) { m.g.rt = now(); if (m.g.k === 'snow' && m.g.sc) { const me = m.g.sc.find(x => x.id === myId()); if (me) S.myBalls = me.b | 0; } } gameHud(); S.dirty = true; });
    on('jwBall', m => { S.balls.push({ x0: m.x0, y0: m.y0, x1: m.x1, y1: m.y1, t0: now(), T: m.T }); sfx('turn'); });
    on('jwHit', m => { const a = S.av.get(m.id); if (a) { a.dazed = now() + 2200; } fxAdd('splat', m.x, m.y); sfx('thud'); if (m.by === myId()) A.secret('jw.snow'); S.dirty = true; });
    on('jwSplat', m => { fxAdd('splat', m.x, m.y); });
    on('jwBalls', m => { S.myBalls = m.n; gameHud(); });
    on('jwErr', m => toast(m.msg, m.soft ? 2500 : 5000));
    on('jwStaff', m => { if (m.ok) { toast('Moderator mode ON.'); S.staff = true; openPanel('staff'); } else toast('Wrong moderator password.'); });
    on('jwReports', m => { if (S.panel === 'staff') staffList(m); });
    on('jwStaffNote', m => toast(m.msg));

    if (window.Net && !wire.once) { wire.once = 1; Net.on('welcome', () => reco()); Net.on('you', () => reco()); Net.on('loginOk', () => { setTimeout(() => { if (S && S.room) JW.send({ t: 'jwGo', r: S.room.id }); }, 1200); }); }
  }
  function reco() { if (S && S.room && Net.connected) setTimeout(() => { if (S && S.room) JW.send({ t: 'jwGo', r: S.room.id, av: member() ? undefined : myAv() }); }, 800); }
  function onNo(m) {
    S.load.classList.remove('on'); if (S.room) S.load.hidden = true;
    const W = { guest: 'Only JackNet members can visit members\' rooms. Joining is FREE (Start > Log Off, then pick a name and a password)!', gone: "That room doesn't exist any more.", kicked: "You've been asked to leave that room. Try again in a bit.", closed: 'That room has been closed by a Moderator for now.',
      shut: `"${m.n}" is locked. Only people with a spare key can get in.`, nobody: `Nobody's in to answer the doorbell at "${m.n}". Try again later!`, answer: `Sorry! Nobody let you in to "${m.n}".`, noanswer: `Nobody answered the door at "${m.n}".`, full: 'That room is full! Try again in a minute.' }[m.why] || "You can't go in there.";
    toast(W, 6000);
    if (!S.room || S.room.id === m.r) goRoom('lobby');
  }
  function ring(m) {
    sfx('beep');
    const el = h('div', 'jw-ring', `${ICONS.bell} <b>${esc(m.nick)}</b> is ringing the doorbell. Let them in? <button class="btn" data-a="1">Let in</button> <button class="btn" data-a="0">No</button>`);
    el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { JW.send({ t: 'jwAnswer', id: m.id, ok: b.dataset.a === '1' }); el.remove(); S.ringing.delete(m.id); }));
    S.view.appendChild(el); S.ringing.set(m.id, el);
    setTimeout(() => { if (el.isConnected) { el.remove(); S.ringing.delete(m.id); } }, 30000);
  }

  // ================================================================ entering a room
  function enterRoom(m) {
    const pub = !!C.PUB[m.id], P0 = C.PUB[m.id];
    const R = m.R || null, M = R ? C.MODELS.find(x => x[0] === R.md) || C.MODELS[0] : null;
    const map = pub ? P0.map : M[4];
    const old = S.room && S.room.id;
    S.room = { id: m.id, pub, P: P0, R, M, map, W: map[0].length, H: map.length, mine: !!m.mine, rights: !!m.rights, liked: !!m.liked, ps: m.ps || {}, items: [], door: pub ? P0.spawn : M[5] };
    S.av.forEach(a => a.tag && a.tag.remove()); S.av.clear(); S.bubs.innerHTML = ''; S.fx = []; S.balls = []; endPlace();
    for (const o of m.occ) addAv(o);
    buildItems(); buildStatic(); S.cam.fit = true; resize();
    S.game = m.game; if (m.game) m.game.rt = now(); gameHud();
    S.load.classList.remove('on'); S.load.hidden = true; S.ready = true; S.view.classList.remove('jw-empty');
    S.win.setTitle('JackWorld 99 - ' + (pub ? P0.n : R.n));
    status(pub ? `${P0.n} - ${P0.ds}` : `${R.n} (${R.on}'s room)`);
    setPref('room', m.id); setPref('made', true);
    drawInfo();
    A.secret('jw.first');
    if (pub && !P0.hidden) { S.tour.add(m.id); setPref('tour', [...S.tour]); if (C.PUB_ORDER.filter(id => !C.PUB[id].hidden).every(id => S.tour.has(id))) A.secret('jw.tour'); }
    S.libT = m.id === 'library' ? now() : 0;
    if (m.id === 'moon') { A.secret('jw.moon'); toast('You are walking on the MOON! (Low gravity: try /jump.)', 6000); }
    if (old !== m.id) { sfx('join'); const me = S.av.get(myId()); if (me) { me.hello = now() + 3500; } }
    if (!pref('guide', false) && !S.guided) { S.guided = true; setTimeout(guide, 900); }
    if (S.room.mine) deco();
    if (S.panel === 'home' || S.panel === 'stuff') refreshPanel();
    if (pub && m.id === 'roof' && FRI()) toast('IT\'S FRIDAY NIGHT DISCO ON THE ROOF!!! Type /dance and get on the floor!', 7000);
    S.dirty = true;
  }
  // everything standing in the room, for drawing and clicking
  function buildItems() {
    const r = S.room, items = [];
    if (r.pub) r.P.fix.forEach((f, i) => {
      const F = C.FURNI['furni.' + f[0]]; if (!F) return; const ov = r.ps[i] || {};
      if (typeof f[1] === 'string') items.push({ F, wall: f[1], x: f[2], z: f[3] | 0, i, s: ov.s | 0 });
      else items.push({ F, x: ov.x != null ? ov.x : f[1], y: ov.y != null ? ov.y : f[2], r: f[3] | 0, i, s: ov.s != null ? ov.s : (F.use === 'lamp' || F.use === 'tv' || F.use === 'disco' ? 1 : 0) });
    });
    else {
      items.push({ F: C.FURNI['furni.pub_door'], wall: 'L', x: r.door[1], z: 0, s: 0, door: 1 });
      for (const f of r.R.f) { const F = C.FURNI[f.id]; if (!F) continue; if (f.w) items.push({ F, wall: f.w, x: f.x, z: f.z | 0, u: f.u, s: f.s | 0 }); else items.push({ F, x: f.x, y: f.y, r: f.r | 0, u: f.u, s: f.s | 0 }); }
    }
    r.items = items; r.sitAt = new Map(); r.solid = new Set();
    for (const it of items) { if (it.wall) continue; for (const [x, y] of footprint(it)) { if (it.F.sit) r.sitAt.set(x + ',' + y, it); if (it.F.k === 'f' && !it.F.sit) r.solid.add(x + ',' + y); } }
    S.dirty = true;
  }
  const footprint = it => { const w = it.r ? it.F.d : it.F.w, d = it.r ? it.F.w : it.F.d, t = []; for (let x = it.x; x < it.x + w; x++) for (let y = it.y; y < it.y + d; y++) t.push([x, y]); return t; };
  function buildStatic() {
    const r = S.room; if (!r) return;
    const fl = r.pub ? r.P.floor : (C.FLOORS.find(x => x[0] === r.R.fl) || C.FLOORS[0])[3], wl = r.pub ? r.P.wall : (C.WALLS.find(x => x[0] === r.R.wl) || C.WALLS[0])[3];
    r.st = ART.room({ map: r.map, floor: fl, wall: wl, in: r.pub ? !!r.P.in : true, sky: r.pub ? r.P.sky : '', exits: r.pub ? r.P.exits.map(e => [e[0], e[1]]) : [r.door], rail: r.pub && r.id === 'roof' });
    r.night = ART.isNight(); r.stAt = new Date().getHours();
    r.water = []; r.disco = []; for (let y = 0; y < r.H; y++) for (let x = 0; x < r.W; x++) { const ch = r.map[y][x]; if (ch === 'w') r.water.push([x, y]); else if (ch === 'k') r.disco.push([x, y]); }
    S.view.style.background = r.st.bg ? `linear-gradient(${r.st.bg[0]} 50%, ${r.st.bg[1]} 50%)` : '#1a1424';
    S.dirty = true;
  }

  // ================================================================ people
  function addAv(o) {
    const a = S.av.get(o.id) || { id: o.id };
    Object.assign(a, { nick: o.nick, av: o.av, member: !!o.m, bot: !!o.bot, staff: !!o.st, emo: o.e || '', carry: o.c || '', carryT: o.c ? now() + 120000 : 0, dir: a.dir != null ? a.dir : 1 });
    a.path = o.p && o.p.length ? o.p : [[0, 0]]; a.t0 = now() + (o.d | 0); a.from = null;
    S.av.set(o.id, a); S.dirty = true;
    return a;
  }
  function setPath(a, p, d) {
    const t = now(), cur = avPos(a, t);
    a.from = { x: cur.fx, y: cur.fy, t };
    a.path = p; a.t0 = t + Math.max(0, d | 0);
    if (p.length > 1 || cur.fx !== p[0][0] || cur.fy !== p[0][1]) { a.emo = a.emo === 'dance' ? '' : a.emo === 'sit' || a.emo === 'sleep' || a.emo === 'cool' || a.emo === 'think' ? '' : a.emo; }
    S.dirty = true;
  }
  // where somebody is drawn: smooth along their path
  function avPos(a, t) {
    const p = a.path;
    if (a.from && t < a.t0) { const k = (t - a.from.t) / Math.max(1, a.t0 - a.from.t), tx = p[0][0], ty = p[0][1]; return { fx: a.from.x + (tx - a.from.x) * k, fy: a.from.y + (ty - a.from.y) * k, moving: true, dx: tx - a.from.x, dy: ty - a.from.y }; }
    const k = (t - a.t0) / STEP;
    if (k <= 0 || p.length < 2) return { fx: p[0][0], fy: p[0][1], moving: false };
    const i = Math.floor(k);
    if (i >= p.length - 1) { const l = p[p.length - 1], pr = p[p.length - 2]; return { fx: l[0], fy: l[1], moving: false, dx: l[0] - pr[0], dy: l[1] - pr[1] }; }
    const A0 = p[i], B0 = p[i + 1], f = k - i;
    return { fx: A0[0] + (B0[0] - A0[0]) * f, fy: A0[1] + (B0[1] - A0[1]) * f, moving: true, dx: B0[0] - A0[0], dy: B0[1] - A0[1] };
  }
  const dirOf = (dx, dy, old) => { const sx = dx - dy, sy = dx + dy; if (!sx && !sy) return old; if (sy > 0 || (sy === 0 && sx !== 0 && false)) return sx >= 0 ? 0 : 1; if (sy < 0) return sx >= 0 ? 3 : 2; return sx > 0 ? 0 : 1; };

  // ================================================================ drawing
  function resize() {
    if (!S) return;
    const r = S.view.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    S.vw = Math.max(1, r.width); S.vh = Math.max(1, r.height); S.dpr = dpr;
    S.cv.width = Math.round(S.vw * dpr); S.cv.height = Math.round(S.vh * dpr);
    S.cv.style.width = S.vw + 'px'; S.cv.style.height = S.vh + 'px';
    S.body.classList.toggle('jw-narrow', S.vw < 560);
    if (S.cam.fit) fitCam(); clampCam(); S.dirty = true;
  }
  function fitCam() {
    const r = S.room; if (!r || !r.st) return;
    const paneW = !S.pane.hidden && S.vw >= 560 ? Math.min(S.pane.offsetWidth + 8, S.vw * 0.6) : 0;
    const st = r.st, pad = 6, cw = S.vw - pad * 2 - paneW, chh = S.vh - pad * 2 - (S.vw < 560 ? 30 : 0);
    // only the interesting part: the floor and walls (not the empty backdrop margins)
    const bx0 = st.ox - r.H * 16 - 4, bx1 = st.ox + r.W * 16 + 4, by0 = st.oy - (r.pub && !r.P.in ? 70 : ART.WALLH + 16), by1 = st.oy + (r.W + r.H) * 8 + 12;
    let z = Math.min(cw / (bx1 - bx0), chh / (by1 - by0));
    z = z >= 2 ? Math.floor(z * 2) / 2 : Math.max(0.5, Math.round(z * 8) / 8);
    S.cam.z = z; S.cam.x = (bx0 + bx1) / 2 + paneW / 2 / z; S.cam.y = (by0 + by1) / 2 + (S.vw < 560 ? 12 / z : 0);
    S.cam.fit = true; S.cam.fitZ = z;
    if (S.vw < 560 && S.room && !S.room.small) { S.cam.z = Math.min(2, z * 1.45); S.cam.fit = false; S.cam.follow = true; }
  }
  function clampCam() { const r = S.room; if (!r || !r.st) return; S.cam.x = Math.max(0, Math.min(r.st.lw, S.cam.x)); S.cam.y = Math.max(0, Math.min(r.st.lh, S.cam.y)); }
  // logical (room) pixels <-> CSS pixels in the view
  const toView = (lx, ly) => [(lx - S.cam.x) * S.cam.z + S.vw / 2, (ly - S.cam.y) * S.cam.z + S.vh / 2];
  const toRoom = (vx, vy) => [(vx - S.vw / 2) / S.cam.z + S.cam.x, (vy - S.vh / 2) / S.cam.z + S.cam.y];
  const P = (x, y, z) => { const st = S.room.st; return [st.ox + (x - y) * 16, st.oy + (x + y) * 8 - (z || 0)]; };
  const tileAt = (lx, ly) => { const st = S.room.st, sx = lx - st.ox, sy = ly - st.oy; return [Math.floor((sx / 16 + sy / 8) / 2), Math.floor((sy / 8 - sx / 16) / 2)]; };

  function loop() {
    if (!S) return;
    S.raf = requestAnimationFrame(loop);
    if (S.win.el.style.display === 'none' || document.hidden || !S.room || !S.room.st) return;
    const t = now(), fr = Math.floor(t / 170);
    const moving = [...S.av.values()].some(a => avPos(a, t).moving || (a.jumpT && a.jumpT > t) || (a.dazed && a.dazed > t)) || S.balls.length || S.fx.length || S.place;
    const animFr = fr !== S.frame; S.frame = fr;
    if (S.cam.follow) { const me = S.av.get(myId()); if (me && me._p) { const tx = me._p[0], ty = me._p[1] - 24, dx = tx - S.cam.x, dy = ty - S.cam.y; if (Math.abs(dx) + Math.abs(dy) > 0.5) { S.cam.x += dx * 0.12; S.cam.y += dy * 0.12; clampCam(); S.dirty = true; } } }
    if (!S.dirty && !moving && !animFr) return;
    if (!S.dirty && !moving && animFr && !S.hasAnim) return;
    if (new Date().getHours() !== S.room.stAt) buildStatic();
    S.dirty = false;
    draw(t, fr);
  }
  function draw(t, fr) {
    const g = S.g, r = S.room, st = r.st, z = S.cam.z * S.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S.cv.width, S.cv.height);
    const ox = Math.round(S.cv.width / 2 - S.cam.x * z), oy = Math.round(S.cv.height / 2 - S.cam.y * z);
    g.setTransform(z, 0, 0, z, ox, oy); g.imageSmoothingEnabled = z < 1;
    g.drawImage(st.c, 0, 0);
    const drawS = (s, x, y, mir, alpha) => { if (alpha != null) g.globalAlpha = alpha; if (mir) { g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(-1, 1); g.drawImage(s.c, -s.ox, -s.oy); g.restore(); } else g.drawImage(s.c, Math.round(x - s.ox), Math.round(y - s.oy)); if (alpha != null) g.globalAlpha = 1; };
    let anim = false;
    // water and the rooftop's disco floor
    if (r.water.length) { const wf = Math.floor(t / 260) % 8; for (const [x, y] of r.water) { const s = ART.water((wf + x * 3 + y) % 8, r.night); const p = P(x, y); g.drawImage(s.c, Math.round(p[0] - s.ox), Math.round(p[1] - s.oy)); } anim = true; }
    if (r.disco.length) { const cs = FRI() || (S.game && S.game.k === 'chairs' && S.game.ph === 'music') ? ['#ff3aa0', '#3ae0ff', '#f2e22e', '#7aff4a', '#ff8a2a'] : ['#c03a80', '#2aa0c0', '#c0b02a', '#5ac03a', '#c06a2a']; const k = Math.floor(t / 400); for (const [x, y] of r.disco) { g.fillStyle = cs[(x * 3 + y * 7 + k) % cs.length]; const a = P(x, y), b = P(x + 1, y), c2 = P(x + 1, y + 1), d = P(x, y + 1); g.beginPath(); g.moveTo(a[0], a[1] + 1); g.lineTo(b[0] - 2, b[1]); g.lineTo(c2[0], c2[1] - 1); g.lineTo(d[0] + 2, d[1]); g.closePath(); g.fill(); } anim = true; }
    // rugs, then things on the walls
    const placing = S.place && S.place.u;
    for (const it of r.items) if (!it.wall && it.F.k === 'r' && !(placing && it.u === placing)) { const s = ART.furni(it.F, it.r, it.s, it.F.anim ? fr : 0); if (it.F.anim) anim = true; const p = P(it.x, it.y); it._s = s; it._p = p; drawS(s, p[0], p[1]); }
    for (const it of r.items) if (it.wall && !(placing && it.u === placing)) { const s = ART.wallItem(it.F, it.wall, it.s, it.F.anim ? fr : 0); if (it.F.anim) anim = true; const p = it.wall === 'R' ? P(it.x, 0, it.z) : P(0, it.x, it.z); it._s = s; it._p = p; drawS(s, p[0], p[1]); }
    // hover / walk-to tile
    if (S.hover && !S.place && S.hover.tile) { const [x, y] = S.hover.tile; if (walkable(x, y)) tileMark(g, x, y, 'rgba(255,255,255,.35)'); }
    // the depth-sorted bit: furni, people, game chairs, snowballs
    const L = [];
    for (const it of r.items) if (!it.wall && it.F.k !== 'r' && !(placing && it.u === placing)) {
      const w = it.r ? it.F.d : it.F.w, d = it.r ? it.F.w : it.F.d;
      let s = ART.furni(it.F, it.r, it.F.use === 'dice' && it.roll > t ? 1 + (fr % 6) : it.s, it.F.anim ? fr : 0); if (it.F.anim) anim = true;
      if (it.i != null && it.F.id === 'furni.pub_statue' && S.mayorHat) s = ART.furni(it.F, it.r, 1, 0);
      L.push({ k: it.x + it.y + (w + d) / 2 - 0.01, f() { const p = P(it.x, it.y); it._s = s; it._p = p; drawS(s, p[0], p[1]); } });
    }
    if (S.game && S.game.chairs) for (const ch of S.game.chairs) { const F = C.FURNI['furni.pub_xmchair']; L.push({ k: ch.x + ch.y + 1 - 0.01, f() { const s = ART.furni(F, 0, 0, 0), p = P(ch.x, ch.y); drawS(s, p[0], p[1], false, S.game.ph === 'music' ? 0.55 : 1); } }); }
    if (r.pub) for (const n of npcsHere()) L.push({ k: n.x + n.y + 1 + (n.sit ? 0.6 : 0), f() { drawNpc(g, n, t, fr, drawS); } });
    for (const a of S.av.values()) { const q = avPos(a, t); a._q = q; L.push({ k: q.fx + q.fy + 1 + (!q.moving && seatAt(Math.round(q.fx), Math.round(q.fy)) ? 0.6 : 0), f() { drawAv(g, a, q, t, fr, drawS); } }); if (q.moving) anim = true; }
    for (const b of S.balls) { const k = Math.min(1, (t - b.t0) / b.T), x = b.x0 + (b.x1 - b.x0) * k, y = b.y0 + (b.y1 - b.y0) * k; L.push({ k: x + y + 1.2, f() { const p = P(x + 0.5, y + 0.5, 18 + Math.sin(k * Math.PI) * 26); g.fillStyle = '#5a6a8a'; g.fillRect(Math.round(p[0]) - 3, Math.round(p[1]) - 2, 6, 5); g.fillStyle = '#ffffff'; g.fillRect(Math.round(p[0]) - 3, Math.round(p[1]) - 3, 5, 5); g.fillStyle = '#cfe0ff'; g.fillRect(Math.round(p[0]), Math.round(p[1]), 2, 2); const sh = P(x + 0.5, y + 0.5, 0); g.fillStyle = 'rgba(20,10,40,.25)'; g.fillRect(Math.round(sh[0]) - 3, Math.round(sh[1]) - 1, 6, 2); } }); }
    S.balls = S.balls.filter(b => t - b.t0 < b.T);
    L.sort((a, b) => a.k - b.k).forEach(o => o.f());
    // the ghost of what you're putting out
    if (S.place) drawGhost(g, t, fr, drawS);
    // particles (hearts, Zzz, splats, sparkles)
    drawFx(g, t);
    // night outside: darker, with pools of light from lamps
    if (r.pub && !r.P.in && r.night) { g.fillStyle = 'rgba(8,14,48,.42)'; g.fillRect(0, 0, st.lw, st.lh); }
    for (const it of r.items) { const s = it._s; if (s && s.glow && it._p) glow(g, it, s.glow); }
    for (const a of S.av.values()) if (a._glow) a._glow = 0;
    S.hasAnim = anim || S.av.size > 0;
    placeTags(t);
  }
  const glowC = {};
  function glow(g, it, gl) {
    const [gx, gy, gz, col, rad] = gl, w = it.r ? it.F.d : it.F.w, d = it.r ? it.F.w : it.F.d;
    let p; if (it.wall) p = it.wall === 'R' ? P(it.x + gx, gy, it.z + gz) : P(gy, it.x + gx, it.z + gz); else { const lx = it.r ? gy : gx, ly = it.r ? gx : gy; p = P(it.x + lx, it.y + ly, gz); }
    const k = col + rad; let c = glowC[k];
    if (!c) { c = document.createElement('canvas'); c.width = c.height = rad * 2; const q = c.getContext('2d'), gr = q.createRadialGradient(rad, rad, 0, rad, rad, rad); const v = ART.rgb(col); gr.addColorStop(0, `rgba(${v[0]},${v[1]},${v[2]},.34)`); gr.addColorStop(1, `rgba(${v[0]},${v[1]},${v[2]},0)`); q.fillStyle = gr; q.fillRect(0, 0, rad * 2, rad * 2); glowC[k] = c; }
    const op = g.globalCompositeOperation; g.globalCompositeOperation = 'lighter'; g.drawImage(c, Math.round(p[0] - rad), Math.round(p[1] - rad)); g.globalCompositeOperation = op;
  }
  function tileMark(g, x, y, col) { const a = P(x, y), b = P(x + 1, y), c = P(x + 1, y + 1), d = P(x, y + 1); g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1] + 0.5); g.lineTo(b[0] - 0.5, b[1]); g.lineTo(c[0], c[1] - 0.5); g.lineTo(d[0] + 0.5, d[1]); g.closePath(); g.stroke(); g.fillStyle = col.replace(/[\d.]+\)$/, '0.12)'); g.fill(); }
  const MCHAIR = () => C.FURNI['furni.pub_xmchair'];
  function seatAt(x, y) { const r = S.room, it = r.sitAt && r.sitAt.get(x + ',' + y); if (it) return it; if (S.game && S.game.chairs && S.game.chairs.some(c => c.x === x && c.y === y)) return { F: MCHAIR(), r: 0, s: 0, x, y }; return null; }
  function wearOf(a) { if (!a.member || !window.Econ || !Econ.wearOf) return null; const w = Econ.wearOf(a.nick); return w ? { hat: w.hat, face: w.face } : null; }
  function drawAv(g, a, q, t, fr, drawS) {
    const r = S.room;
    if (q.moving && (q.dx || q.dy)) a.dir = dirOf(q.dx, q.dy, a.dir);
    const tile = Math.round(q.fx) + ',' + Math.round(q.fy), seat = !q.moving && seatAt(Math.round(q.fx), Math.round(q.fy));
    let pose = q.moving ? 'walk' : 'stand', z = 0, dir = a.dir;
    if (seat && !(a.emo === 'dance')) { pose = 'sit'; dir = seat.r ? 0 : 1; const s = ART.furni(seat.F, seat.r, seat.s, 0); z = (s.seat || 10) - 12; }
    else if (!q.moving) { if (a.emo === 'sit' || a.emo === 'sleep') { pose = 'floor'; } else if (a.emo === 'dance') pose = 'dance'; else if (a.waveT > t) pose = 'wave'; else if (a.laughT > t) pose = 'laugh'; else if (a.makeT > t) { pose = 'floor'; } }
    if (a.jumpT > t) { const k = 1 - (a.jumpT - t) / (a.jumpBig ? 900 : 600); z += Math.sin(k * Math.PI) * (a.jumpBig ? 30 : 14) * (r.id === 'moon' ? 2 : 1); }
    if (r.id === 'moon' && q.moving) z += Math.abs(Math.sin(t / 220)) * 6;
    const wf = q.moving ? Math.floor(t / 110) : pose === 'dance' ? Math.floor(t / 200) : pose === 'wave' ? Math.floor(t / 160) : 0;
    const p = P(q.fx + 0.5, q.fy + 0.5, z), sh = P(q.fx + 0.5, q.fy + 0.5, 0);
    g.fillStyle = 'rgba(20,10,40,.28)'; g.beginPath(); g.ellipse(Math.round(sh[0]), Math.round(sh[1]), 9, 4, 0, 0, 7); g.fill();
    const { s, mirror } = ART.avatar(a.av, pose, dir, wf, wearOf(a));
    a._s = s; a._p = p; a._mir = mirror; a._z = z;
    drawS(s, p[0], p[1] + 4, mirror, a.bot && S.game && S.game.k === 'chairs' && S.game.pl && S.game.pl.some(x => x.id === a.id && x.out) ? 0.5 : null);
    // things in hand, dizzy stars, Zzz, being "me"
    if (a.carry && a.carryT > t && pose !== 'sit') { const hx = Math.round(p[0] + (mirror ? -9 : 9)), hy = Math.round(p[1] - 22); if (a.carry === 'ice') { g.fillStyle = '#e8b060'; g.fillRect(hx - 1, hy, 3, 5); g.fillStyle = '#ef6fb0'; g.fillRect(hx - 2, hy - 3, 5, 3); } else { g.fillStyle = '#d8342c'; g.fillRect(hx - 1, hy - 1, 4, 6); g.fillStyle = '#eeeae0'; g.fillRect(hx - 1, hy + 1, 4, 1); } }
    if (a.dazed > t) { for (let i = 0; i < 3; i++) { const an = t / 150 + i * 2.1; g.fillStyle = i % 2 ? '#ffe46a' : '#ffffff'; g.fillRect(Math.round(p[0] + Math.cos(an) * 9) - 1, Math.round(p[1] - 52 + Math.sin(an) * 3), 3, 3); } }
    if (a.emo === 'sleep' && !q.moving) { const k = (t / 900) % 1; g.fillStyle = '#ffffff'; ART.text && fxText(g, 'Z', p[0] + 8 + k * 6, p[1] - 50 - k * 14, '#ffffff', 1 - k); }
    if (a.emo === 'cool' && !q.moving) { g.fillStyle = '#1a1a1a'; const ey = Math.round(p[1] - 45 - (a.av[0] ? 2 : 0)); g.fillRect(Math.round(p[0]) - (mirror ? 6 : 5), ey, 12, 3); }
    if (a.emo === 'think' && !q.moving) { fxText(g, '...', p[0] - 4, p[1] - 58, '#ffffff', 1); }
    if (a.id === myId() && a.hello > t) { const by = Math.round(p[1] - 66 + Math.sin(t / 150) * 2); g.fillStyle = '#ffe46a'; g.beginPath(); g.moveTo(p[0] - 4, by); g.lineTo(p[0] + 4, by); g.lineTo(p[0], by + 5); g.fill(); g.strokeStyle = '#1a1a1a'; g.stroke(); }
  }
  function fxText(g, s, x, y, col, al) { g.globalAlpha = Math.max(0, Math.min(1, al)); g.font = 'bold 8px Tahoma, sans-serif'; g.fillStyle = '#1a1a2a'; g.fillText(s, Math.round(x) + 1, Math.round(y) + 1); g.fillStyle = col; g.fillText(s, Math.round(x), Math.round(y)); g.globalAlpha = 1; }
  // the regulars who hang about in public rooms (drawn by us; the server keeps their tiles clear)
  function npcsHere() {
    const r = S.room; if (!r.pub) return [];
    const out = [];
    for (const n of r.P.npcs) { if (n[5] === 'school' && !SCHOOL()) continue; if (n[5] === 'fri' && !FRI()) continue; out.push({ name: n[0], x: n[1], y: n[2], look: n[3], lines: n[4], sit: r.sitAt && r.sitAt.has(n[1] + ',' + n[2]), seat: r.sitAt && r.sitAt.get(n[1] + ',' + n[2]) }); }
    return out;
  }
  function drawNpc(g, n, t, fr, drawS) {
    const av = C.NPC_AV[n.look] || C.avOf(n.name);
    let pose = n.sit ? 'sit' : 'stand', z = 0, dir = hash(n.name) % 2;
    if (n.sit) { const s = ART.furni(n.seat.F, n.seat.r, 0, 0); z = (s.seat || 10) - 12; dir = n.seat.r ? 0 : 1; }
    if (n.look === 'dj' || (FRI() && S.room.id === 'roof')) pose = n.sit ? pose : 'dance';
    const wf = pose === 'dance' ? Math.floor(t / 200) : 0;
    const p = P(n.x + 0.5, n.y + 0.5, z), sh = P(n.x + 0.5, n.y + 0.5, 0);
    g.fillStyle = 'rgba(20,10,40,.28)'; g.beginPath(); g.ellipse(Math.round(sh[0]), Math.round(sh[1]), 9, 4, 0, 0, 7); g.fill();
    const { s, mirror } = ART.avatar(av, pose, dir, wf, null);
    n._s = s; drawS(s, p[0], p[1] + 4, mirror);
    S.npcHit = S.npcHit || []; S.npcHit.push({ n, s, p: [p[0], p[1] + 4], mir: mirror });
  }
  function drawGhost(g, t, fr, drawS) {
    const pl = S.place; if (!pl.at) return;
    const F = pl.F, ok = pl.ok;
    if (F.k === 'w') { const s = ART.wallItem(F, pl.at.w, 0, 0); const p = pl.at.w === 'R' ? P(pl.at.x, 0, pl.at.z) : P(0, pl.at.x, pl.at.z); drawS(s, p[0], p[1], false, 0.75); }
    else { const s = ART.furni(F, pl.r, 0, 0), p = P(pl.at.x, pl.at.y); drawS(s, p[0], p[1], false, ok ? 0.8 : 0.45); for (const [x, y] of footprint({ F, x: pl.at.x, y: pl.at.y, r: pl.r })) tileMark(g, x, y, ok ? 'rgba(80,255,120,.95)' : 'rgba(255,60,60,.95)'); }
  }

  // ================================================================ particles
  function fxAdd(k, x, y, extra) { S.fx.push(Object.assign({ k, x, y, t0: now() }, extra || {})); S.dirty = true; }
  function puff(x, y, col) { for (let i = 0; i < 8; i++) fxAdd('dot', x + 0.5, y + 0.5, { a: i / 8 * Math.PI * 2, col }); }
  function drawFx(g, t) {
    S.fx = S.fx.filter(f => t - f.t0 < (f.k === 'splat' ? 900 : 1600));
    for (const f of S.fx) {
      const k = (t - f.t0) / (f.k === 'splat' ? 900 : 1600);
      if (f.k === 'splat') { const p = P(f.x + 0.5, f.y + 0.5, 10); g.fillStyle = `rgba(255,255,255,${1 - k})`; for (let i = 0; i < 7; i++) { const an = i * 0.9; g.fillRect(Math.round(p[0] + Math.cos(an) * k * 14), Math.round(p[1] + Math.sin(an) * k * 7 - k * 6), 3, 3); } }
      else if (f.k === 'heart' || f.k === 'note' || f.k === 'tear' || f.k === 'waaagh') { const a = S.av.get(f.id); if (!a || !a._p) continue; const x = a._p[0] + (f.dx || 0), y = a._p[1] - 50 - k * 22; if (f.k === 'heart') fxText(g, '\u2665', x, y, '#ff4a8a', 1 - k); else if (f.k === 'note') fxText(g, '\u266A', x, y, '#ffe46a', 1 - k); else if (f.k === 'tear') { g.fillStyle = `rgba(120,190,255,${1 - k})`; g.fillRect(Math.round(a._p[0] + (a._mir ? -2 : 2)), Math.round(a._p[1] - 42 + k * 12), 2, 3); } else fxText(g, 'WAAAGH!', a._p[0] - 18, a._p[1] - 60 - k * 10, '#7aff4a', 1 - k * 0.7); }
      else if (f.k === 'dot') { const p = P(f.x, f.y, 20 + k * 20); g.fillStyle = f.col || '#ffffff'; g.globalAlpha = 1 - k; g.fillRect(Math.round(p[0] + Math.cos(f.a) * k * 18), Math.round(p[1] + Math.sin(f.a) * k * 9), 2, 2); g.globalAlpha = 1; }
    }
  }

  // ================================================================ name tags + speech bubbles (DOM, so text stays crisp)
  function exitAt(x, y) { const r = S.room; if (!r) return ''; if (r.pub) { const e = r.P.exits.find(q => q[0] === x && q[1] === y); return e ? e[3] : ''; } return x === r.door[0] && y === r.door[1] ? 'Leave this room (back to the Lobby)' : ''; }
  function placeTags(t) {
    if (S.hoverExit) { if (!S.exTag) { S.exTag = h('div', 'jw-tag jw-extag'); S.ov.appendChild(S.exTag); } S.exTag.hidden = false; S.exTag.textContent = '\u2192 ' + S.hoverExit.label; const q = P(S.hoverExit.tile[0] + 0.5, S.hoverExit.tile[1] + 0.5, 6), v = toView(q[0], q[1]); S.exTag.style.transform = `translate(${Math.round(v[0])}px,${Math.round(v[1])}px) translate(-50%,-100%)`; } else if (S.exTag) S.exTag.hidden = true;
    const hv = S.hover && S.hover.av;
    for (const a of S.av.values()) {
      const show = (hv && hv === a.id) || a.hello > t || (S.selAv === a.id);
      if (!show) { if (a.tag) a.tag.hidden = true; continue; }
      if (!a.tag) { a.tag = h('div', 'jw-tag'); S.ov.appendChild(a.tag); }
      a.tag.hidden = false;
      const lbl = a.nick + (a.bot ? ' (CPU)' : '') + (a.staff ? ' \u2605' : '');
      if (a.tag.textContent !== lbl) { a.tag.textContent = lbl; a.tag.classList.toggle('me', a.id === myId()); a.tag.classList.toggle('guest', !a.member && !a.bot); }
      if (a._p) { const v = toView(a._p[0], a._p[1] - 62 - (a.av && a.av[0] ? 6 : 0)); a.tag.style.transform = `translate(${Math.round(v[0])}px,${Math.round(v[1])}px) translate(-50%,-100%)`; }
    }
  }
  function headPic(a) { return a && a.av ? ART.headURL(a.av, a.member ? wearOf(a) : null) : ''; }
  function bubble(who, text, kind, at) {
    if (!S || !S.room) return;
    const el = h('div', 'jw-bub jw-bub-' + (kind || 'say'));
    const pic = who.av ? `<img src="${headPic(who)}" alt="">` : '';
    el.innerHTML = `${pic}<span><b>${esc(who.nick)}:</b> ${esc(text)}</span>`;
    S.bubs.appendChild(el);
    let x = S.vw / 2, y = S.vh * 0.32;
    if (at) { const v = toView(at[0], at[1]); x = v[0]; y = Math.min(S.vh - 60, Math.max(40, v[1])); }
    const w = el.offsetWidth, hh = el.offsetHeight + 4;
    x = Math.max(4, Math.min(S.vw - w - 4, x - w / 2));
    // everything already up there floats up out of the way
    for (const b of [...S.bubs.children]) if (b !== el) { b._y -= hh; b.style.transform = `translate(${b._x}px,${b._y}px)`; if (b._y < -40) b.remove(); }
    el._x = Math.round(x); el._y = Math.round(y - hh); el.style.transform = `translate(${el._x}px,${el._y + 8}px)`; el.style.opacity = '0';
    requestAnimationFrame(() => { el.style.opacity = ''; el.style.transform = `translate(${el._x}px,${el._y}px)`; });
    setTimeout(() => { el.classList.add('old'); }, 9000); setTimeout(() => el.remove(), 11000);
    while (S.bubs.children.length > 14) S.bubs.firstChild.remove();
  }
  function logLine(nick, text, k) { S.log = S.log || []; S.log.push({ n: nick, s: text, k, t: new Date() }); if (S.log.length > 80) S.log.shift(); if (S.panel === 'log') openPanel('log'); }
  function onSay(m) {
    if (m.k === 'npc') { bubble({ nick: m.nick, av: null }, m.s, 'npc'); logLine(m.nick, m.s, 'npc'); return; }
    const a = S.av.get(m.id); if (!a) return;
    logLine(a.nick, m.s, m.k);
    const at = a._p ? [a._p[0], a._p[1] - 60] : null;
    bubble(a, m.s, m.k === 'shout' ? 'shout' : m.k === 'whisper' ? 'whisper' : a.bot ? 'npc' : 'say', at);
    if (m.id !== myId()) sfx('click');
    if (/^brb\b|\bbrb\b/i.test(m.s) || /tea'?s ready/i.test(m.s)) { a.emo = 'sleep'; S.dirty = true; }
    else if (a.emo === 'sleep') a.emo = '';
    if (/\b(lol|rofl|haha+|lmao)\b/i.test(m.s)) { a.laughT = now() + 1600; S.dirty = true; }
    if (/^(hi|hello|hiya|alright|hey|wotcha)\b/i.test(m.s)) { a.waveT = now() + 1600; S.dirty = true; }
  }
  function onEmo(m) {
    const a = S.av.get(m.id); if (!a) return; const t = now();
    switch (m.e) {
      case 'wave': a.waveT = t + 2000; break;
      case 'jump': a.jumpT = t + 600; a.jumpBig = false; break;
      case 'bounce': a.jumpT = t + 900; a.jumpBig = true; sfx('boing'); break;
      case 'laugh': a.laughT = t + 2000; break;
      case 'love': for (let i = 0; i < 3; i++) setTimeout(() => fxAdd('heart', 0, 0, { id: a.id, dx: (i - 1) * 7 }), i * 250); break;
      case 'cry': for (let i = 0; i < 3; i++) setTimeout(() => fxAdd('tear', 0, 0, { id: a.id }), i * 400); break;
      case 'waaagh': fxAdd('waaagh', 0, 0, { id: a.id }); a.jumpT = t + 600; sfx('waaagh'); break;
      case 'make': a.makeT = t + 1200; break;
      case 'tele': puff(Math.round(a._q ? a._q.fx : 0), Math.round(a._q ? a._q.fy : 0), '#7ac0ff'); break;
      case 'dance': a.emo = 'dance'; if (a.id === myId()) checkDance(); break;
      case 'stand': a.emo = ''; break;
      default: a.emo = m.e;
    }
    S.dirty = true;
  }
  function checkDance() {
    const me = S.av.get(myId()); if (!me || me.emo !== 'dance') return;
    const q = avPos(me, now()), x = Math.round(q.fx), y = Math.round(q.fy);
    if (S.room.map[y] && S.room.map[y][x] === 'k') return A.secret('jw.dance');
    const it = S.room.items.find(i => i.F.use === 'disco' && i.s && i.x === x && i.y === y); if (it) A.secret('jw.dance');
  }
  function toast(t, ms) {
    if (!S) return Desk.toast('JackWorld', t, ms || 4000);
    const el = h('div', 'jw-toast', esc(t)); S.view.appendChild(el);
    [...S.view.querySelectorAll('.jw-toast')].reverse().forEach((e, i) => { e.style.transform = `translate(-50%, ${-i * 36}px)`; });
    setTimeout(() => el.classList.add('out'), ms || 4000); setTimeout(() => el.remove(), (ms || 4000) + 400);
  }

  // ================================================================ the room info box (bottom left) and the NPC chatter
  function drawInfo() {
    const r = S.room; if (!r) return; const el = S.info; el.hidden = false;
    const n = [...S.av.values()].filter(a => !a.bot).length;
    el.onclick = ev => { if (ev.target.closest('.jw-ri-n')) { if (S.panel === 'who') closePanel(); else openPanel('who'); } };
    if (r.pub) el.innerHTML = `<b>${esc(r.P.n)}</b><small>${esc(r.P.ds)}</small><button type="button" class="jw-ri-n" title="Who's in this room?">${ICONS.people} ${n} here</button>${FRI() && r.id === 'roof' ? '<span class="jw-fri">FRIDAY NIGHT DISCO!</span>' : ''}`;
    else {
      const R = r.R, lk = R.lock === 'bell' ? ICONS.bell : R.lock === 'shut' ? ICONS.lock : '';
      el.innerHTML = `<b>${lk}${esc(R.n)}</b><small>by <a href="#" data-prof="${esc(R.on)}">${esc(R.on)}</a>${R.ds ? ' &middot; ' + esc(R.ds) : ''}</small><button type="button" class="jw-ri-n" title="Who's in this room?">${ICONS.people} ${n} here</button><span class="jw-ri-btns"><button type="button" class="jw-like${r.liked ? ' on' : ''}" title="${r.mine ? 'Likes for your room' : r.liked ? 'You like this room' : 'Like this room'}" ${r.mine || r.liked ? 'disabled' : ''}>${ICONS.heart} ${fmt(R.likes)}</button><button type="button" class="jw-gbb" title="The room's guestbook">${ICONS.book} Guestbook</button>${r.mine ? `<button type="button" class="jw-setb" title="Room settings">${ICONS.home} Settings</button>` : ''}</span>`;
      const lb = el.querySelector('.jw-like'); if (lb) lb.addEventListener('click', () => { if (!member()) return toast('Join JackNet to like rooms!'); JW.send({ t: 'jwLike', r: r.id }); });
      el.querySelector('.jw-gbb').addEventListener('click', () => openPanel('gb'));
      const sb = el.querySelector('.jw-setb'); if (sb) sb.addEventListener('click', () => openPanel('home'));
      const pa = el.querySelector('[data-prof]'); if (pa) pa.addEventListener('click', ev => { ev.preventDefault(); profile(pa.dataset.prof); });
    }
  }
  setInterval(() => { // two whole minutes in the Library without saying a word: that counts as revising
    if (S && S.libT && S.room && S.room.id === 'library' && now() - S.libT > 120000) { S.libT = 0; A.secret('jw.revise'); toast('You sat quietly in the Library for two whole minutes. That definitely counts as revising.', 6000); }
  }, 3000);
  setInterval(() => { // the regulars chat now and then (everybody in the room sees the same line at the same time)
    if (!S || !S.room || !S.room.pub || document.hidden) return;
    const slot = Math.floor(Date.now() / 21000); if (S.npcSlot === slot) return; S.npcSlot = slot;
    const ns = npcsHere(); if (!ns.length) return;
    const hsh = hash(S.room.id + '|' + slot); if (hsh % 3) return;
    const n = ns[hsh % ns.length], line = n.lines[(hsh >>> 4) % n.lines.length];
    bubble({ nick: n.name, av: C.NPC_AV[n.look] }, line, 'npc', [P(n.x + 0.5, n.y + 0.5)[0], P(n.x + 0.5, n.y + 0.5)[1] - 60]);
  }, 2000);

  // ================================================================ clicking and pointing
  function bindUI() {
    const v = S.view;
    let down = null;
    v.addEventListener('pointerdown', ev => { if (ev.target !== S.cv && ev.target !== S.ov) return; down = { x: ev.clientX, y: ev.clientY, cx: S.cam.x, cy: S.cam.y, drag: false, id: ev.pointerId }; });
    v.addEventListener('pointermove', ev => {
      const r = v.getBoundingClientRect(), vx = ev.clientX - r.left, vy = ev.clientY - r.top;
      if (down && (Math.abs(ev.clientX - down.x) + Math.abs(ev.clientY - down.y) > 8)) {
        down.drag = true;
        if (!S.place) { S.cam.x = down.cx - (ev.clientX - down.x) / S.cam.z; S.cam.y = down.cy - (ev.clientY - down.y) / S.cam.z; S.cam.fit = false; S.cam.follow = false; clampCam(); S.dirty = true; }
      }
      if (ev.pointerType === 'mouse') hover(vx, vy);
      if (S.place && (ev.pointerType === 'mouse' || down)) placeAt(vx, vy);
    });
    v.addEventListener('pointerup', ev => {
      const d = down; down = null; if (!d || d.drag && !S.place) return;
      const r = v.getBoundingClientRect(); click(ev.clientX - r.left, ev.clientY - r.top);
    });
    v.addEventListener('pointerleave', () => { S.hover = null; S.dirty = true; v.style.cursor = ''; });
    v.addEventListener('wheel', ev => { ev.preventDefault(); zoom(ev.deltaY < 0 ? 1 : -1); }, { passive: false });
    v.addEventListener('keydown', ev => { if (S.place && (ev.key === 'r' || ev.key === 'R')) { rotatePlace(); ev.preventDefault(); } if (ev.key === 'Escape') { if (S.place) endPlace(); else closePanel(); } });
    v.querySelector('.jw-zoom').addEventListener('click', ev => { const b = ev.target.closest('[data-z]'); if (!b) return; if (b.dataset.z === 'fit') { S.cam.fit = true; S.cam.follow = false; fitCam(); if (S.vw < 560) { S.cam.z = S.cam.fitZ; S.cam.fit = true; S.cam.follow = false; } S.dirty = true; } else zoom(b.dataset.z === 'in' ? 1 : -1); });
    const form = S.body.querySelector('.jw-chat'), inp = form.querySelector('input');
    form.addEventListener('submit', ev => { ev.preventDefault(); const t = inp.value.trim(); if (!t) return; inp.value = ''; chat(t); });
    form.querySelector('.jw-logb').addEventListener('click', () => { if (S.panel === 'log') closePanel(); else openPanel('log'); });
    form.querySelector('.jw-emobtn').addEventListener('click', ev => { const r = ev.currentTarget.getBoundingClientRect(); IE.menu(EMOS.map(([e, l]) => ({ label: l, act: () => emoteMe(e) })), r.left, r.top - EMOS.length * 22 - 8); });
    S.body.querySelector('.jw-bar').addEventListener('click', ev => { const b = ev.target.closest('[data-p]'); if (!b) return; sfx('click'); if (S.panel === b.dataset.p) closePanel(); else openPanel(b.dataset.p); });
    // typing anywhere in the room goes in the chat box
    v.addEventListener('keypress', ev => { if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && document.activeElement === v) { inp.focus(); } });
  }
  function zoom(dir) { const zs = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4]; let i = zs.findIndex(z => z >= S.cam.z - 0.01); if (i < 0) i = zs.length - 1; i = Math.max(0, Math.min(zs.length - 1, i + dir)); S.cam.z = zs[i]; S.cam.fit = false; S.cam.follow = dir > 0 || S.cam.follow; if (S.cam.fitZ && S.cam.z <= S.cam.fitZ) { S.cam.fit = true; S.cam.follow = false; fitCam(); } clampCam(); S.dirty = true; }
  function walkable(x, y) { const r = S.room; if (!r || x < 0 || y < 0 || x >= r.W || y >= r.H) return false; const ch = r.map[y][x]; return ch !== 'x' && ch !== 'w' && !r.solid.has(x + ',' + y); }
  // what is under a point (people first, then furni, then the floor)
  function pickAt(vx, vy) {
    const r = S.room; if (!r || !r.st) return null;
    const [lx, ly] = toRoom(vx, vy);
    const avs = [...S.av.values()].filter(a => a._s && a._p).sort((a, b) => (b._q.fx + b._q.fy) - (a._q.fx + a._q.fy));
    for (const a of avs) { const sx = a._mir ? a._s.ox - (lx - a._p[0]) : lx - a._p[0] + a._s.ox, sy = ly - a._p[1] - 4 + a._s.oy; if (ART.hit(a._s, sx, sy)) return { av: a.id }; }
    for (const n of (S.npcHit || []).slice().reverse()) { const sx = n.mir ? n.s.ox - (lx - n.p[0]) : lx - n.p[0] + n.s.ox, sy = ly - n.p[1] + n.s.oy; if (ART.hit(n.s, sx, sy)) return { npc: n.n }; }
    const its = r.items.filter(it => it._s && it._p && it.F.k !== 'r').sort((a, b) => (a.wall ? -100 : 0) - (b.wall ? -100 : 0) || (b.x + (b.y || 0)) - (a.x + (a.y || 0)));
    for (const it of its) if (ART.hit(it._s, lx - it._p[0] + it._s.ox, ly - it._p[1] + it._s.oy)) return { it, tile: tileAt(lx, ly) };
    const tile = tileAt(lx, ly);
    const rug = r.items.find(it => it.F.k === 'r' && !it.wall && footprint(it).some(([x, y]) => x === tile[0] && y === tile[1]));
    return { tile, rug };
  }
  function hover(vx, vy) {
    if (!S.room || S.place) return;
    S.npcHit = S.npcHit || [];
    const p = pickAt(vx, vy); S.hover = p;
    const ex = p && p.tile && exitAt(p.tile[0], p.tile[1]); S.hoverExit = ex ? { label: ex, tile: p.tile } : null;
    S.view.style.cursor = p && (p.av || p.npc || (p.it && (p.it.F.use || S.room.rights))) ? 'pointer' : '';
    S.dirty = true;
  }
  function click(vx, vy) {
    if (!S.room) return;
    if (S.place) { placeAt(vx, vy); return confirmPlace(); }
    closeCard();
    const p = pickAt(vx, vy); if (!p) return;
    if (p.av != null) { const a = S.av.get(p.av); if (S.game && S.game.k === 'snow' && S.game.ph === 'play' && a.id !== myId()) { JW.send({ t: 'jwGame', a: 'throw', id: a.id }); return; } return avCard(a, vx, vy); }
    if (p.npc) return npcClick(p.npc, vx, vy);
    if (p.it && !(p.it.F.sit && !p.it.F.use) && !(p.it.F.k === 'r')) return itemClick(p.it, vx, vy);
    if (p.it && p.it.F.sit) { walkTo(p.it.x, p.it.y); return; }
    if (p.rug && p.rug.F.use && p.rug.F.use !== 'tramp' && p.rug.F.use !== 'ball') { /* a disco tile you can switch */ if (S.room.rights) itemClick(p.rug, vx, vy); }
    if (S.game && S.game.k === 'snow' && S.game.ph === 'play' && S.throwMode && p.tile) { JW.send({ t: 'jwGame', a: 'throw', x: p.tile[0], y: p.tile[1] }); return; }
    if (p.tile) walkTo(p.tile[0], p.tile[1]);
  }
  function walkTo(x, y) {
    const r = S.room; if (x < 0 || y < 0 || x >= r.W || y >= r.H) return;
    if (r.map[y][x] === 'x') return;
    JW.send({ t: 'jwWalk', x, y }); fxAdd('dot', x + 0.5, y + 0.5, { a: 0, col: '#ffffff' });
    S.selAv = 0;
  }
  function chat(t) {
    const cmd = t.match(/^\/(\w+)\s*(.*)$/);
    if (cmd) {
      const c = cmd[1].toLowerCase(), rest = cmd[2];
      if (EMOS.some(e => e[0] === c) || c === 'stand') return emoteMe(c);
      if (c === 'shout') return rest && JW.send({ t: 'jwSay', s: rest, k: 'shout' });
      if (c === 'w' || c === 'whisper') { const m = rest.match(/^(\S+)\s+(.+)$/); if (!m) return toast('Whisper like this: /w Name your message'); const a = [...S.av.values()].find(x => x.nick.toLowerCase() === m[1].toLowerCase()); if (!a) return toast(`${m[1]} isn't in this room.`); return JW.send({ t: 'jwSay', s: m[2], k: 'whisper', to: a.id }); }
      if (c === 'help') return openPanel('help');
      if (c === 'staff' || c === 'mod') { if (rest) return JW.send({ t: 'jwStaff', a: 'auth', token: rest }); if (JW.me && JW.me.staff) return openPanel('staff'); return toast('Moderators only!'); }
      if (c === 'go' || c === 'goto') { const id = Object.keys(C.PUB).find(k => k === rest.toLowerCase() || C.PUB[k].n.toLowerCase().includes(rest.toLowerCase())); if (id && !C.PUB[id].hidden) return goRoom(id); return toast('No public room called that.'); }
      if (c === 'me') return rest && JW.send({ t: 'jwSay', s: '*' + rest + '*' });
      return toast(`Don't know /${c}. Try /help`);
    }
    JW.send({ t: 'jwSay', s: t, k: 'say' });
    if (S.libT) S.libT = now();
  }
  function emoteMe(e) { JW.send({ t: 'jwEmo', e }); if (e === 'waaagh' && window.Sound) {} }

  // ================================================================ little pop-up cards (somebody, something)
  function closeCard() { const c = S.view.querySelector('.jw-card'); if (c) c.remove(); S.selAv = 0; }
  function card(html, vx, vy) {
    closeCard();
    const el = h('div', 'jw-card', html); S.view.appendChild(el);
    const w = el.offsetWidth, hh = el.offsetHeight;
    el.style.left = Math.max(4, Math.min(S.vw - w - 4, vx - w / 2)) + 'px'; el.style.top = Math.max(4, Math.min(S.vh - hh - 4, vy - hh - 20)) + 'px';
    el.querySelector('.jw-cx').addEventListener('click', closeCard);
    return el;
  }
  function avCard(a, vx, vy) {
    S.selAv = a.id; S.dirty = true;
    const me = a.id === myId(), r = S.room;
    const tags = [a.bot ? 'Computer player' : a.member ? 'JackNet member' : 'Guest', a.staff ? 'Moderator' : ''].filter(Boolean).join(' &middot; ');
    const btns = me ? [['look', 'Wardrobe'], ['dance', 'Dance'], ['wave', 'Wave']] : a.bot ? [['wave2', 'Wave at']] : [['wave2', 'Wave at'], ['whisper', 'Whisper'], a.member ? ['prof', 'Profile'] : null, a.member && member() ? ['trade', 'Trade'] : null, a.member ? ['room', 'Their room'] : null, ['report', 'Report'], !r.pub && r.rights || (JW.me && JW.me.staff) ? ['kick', 'Kick out'] : null, JW.me && JW.me.staff ? ['mute', 'Mute'] : null].filter(Boolean);
    const el = card(`<button class="jw-cx" type="button" aria-label="Close">x</button><div class="jw-ch"><img src="${headPic(a)}" alt=""><span><b>${esc(a.nick)}</b><small>${tags}</small></span></div><div class="jw-cb">${btns.map(([k, l]) => `<button type="button" class="btn" data-k="${k}">${l}</button>`).join('')}</div>`, vx, vy);
    el.addEventListener('click', ev => {
      const b = ev.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; closeCard();
      if (k === 'look') openPanel('look'); else if (k === 'dance' || k === 'wave') emoteMe(k);
      else if (k === 'wave2') { emoteMe('wave'); JW.send({ t: 'jwSay', s: `*waves at ${a.nick}*` }); }
      else if (k === 'whisper') { const inp = S.body.querySelector('.jw-chat input'); inp.value = `/w ${a.nick} `; inp.focus(); }
      else if (k === 'prof') profile(a.nick);
      else if (k === 'trade') { JW.send({ t: 'lootTNew', to: a.nick }); if (window.Loot) Loot.open('trade'); toast(`Opening the Trading Post with ${a.nick}... (in your Treasure Chest)`); }
      else if (k === 'room') { JW.send({ t: 'jwNav', tab: 'search', q: a.nick }); openPanel('rooms', { tab: 'search', q: a.nick }); }
      else if (k === 'report') reportDlg(a);
      else if (k === 'kick') Desk.msgbox('JackWorld', `Ask ${a.nick} to leave${r.pub ? '' : ' your room'}?`, 'q', [['Kick out', () => JW.send({ t: 'jwKick', id: a.id })], ['Cancel']]);
      else if (k === 'mute') Desk.msgbox('Moderator', `Mute ${a.nick}?`, 'q', [['10 minutes', () => JW.send({ t: 'jwStaff', a: 'mute', id: a.id, mins: 10 })], ['1 hour', () => JW.send({ t: 'jwStaff', a: 'mute', id: a.id, mins: 60 })], ['1 day', () => JW.send({ t: 'jwStaff', a: 'mute', id: a.id, mins: 1440 })], ['Cancel']]);
    });
  }
  function profile(name) { if (window.Community && Community.openProfile) { Community.openProfile(name); const b = document.getElementById('browser'); if (b) { b.classList.remove('min'); b.style.zIndex = (window.JZ = (window.JZ || 2400) + 1); } } }
  function reportDlg(a) {
    Desk.ask('Report to a Moderator', `What did ${a.nick} do? (Moderators will see what was said in the room just now.)`, '', 150, why => { if (why == null) return; JW.send({ t: 'jwReport', id: a.id, why: why || 'No reason given' }); });
  }
  function npcClick(n, vx, vy) {
    const line = n.lines[Math.floor(Math.random() * n.lines.length)];
    bubble({ nick: n.name, av: C.NPC_AV[n.look] }, line, 'npc', [P(n.x + 0.5, n.y + 0.5)[0], P(n.x + 0.5, n.y + 0.5)[1] - 60]);
    sfx('click');
  }
  function itemClick(it, vx, vy) {
    const F = it.F, r = S.room, mine = !r.pub && r.rights && it.u != null;
    // public-room surprises
    if (it.door) { walkTo(S.room.door[0], S.room.door[1]); nameTag('Back to the Lobby', vx, vy); return; }
    if (it.i != null) {
      if (F.id === 'furni.pub_statue') { S.clicks.statue = (S.clicks.statue | 0) + 1; if (S.clicks.statue >= 5 && !S.mayorHat) { S.mayorHat = true; S.dirty = true; A.secret('jw.mayor'); bubble({ nick: 'The Mayor', av: C.NPC_AV.mayor }, 'MY HAT! I asked you NOT to click my statue!', 'npc'); sfx('uhoh'); return; } }
      if (F.use === 'note') { A.secret('jw.bottle'); Desk.msgbox('A message in a bottle', 'Somebody has written on a scrap of paper:\n\n"To whoever finds this: I threw this in the sea in 1999. If you find it, write to me! (Not really, I\'m not giving out my address. Mom says never give out your address on the internet.)\n\nPS: there is a secret base on the Moon. The Space Station airlock is the way in. Don\'t tell anyone.\n\n- a kid on a beach"', 'info'); return; }
      if (F.use === 'grot') { A.secret('jw.grot'); bubble({ nick: 'Gubbinz', av: null }, ['Oi! Dis is MY town square!', 'Got any snacks? Squigs? Crisps?', 'Da Mayor\'s hat is well shiny. I want it.', 'WAAAGH! (quietly)'][Math.floor(Math.random() * 4)], 'npc'); sfx('waaagh'); return; }
      if (F.use === 'phone') { sfx('beep'); toast('You pick up the phone. "The number you have dialled has not been recognised." You put it down again.'); return; }
      if (F.use === 'arcade') { sfx('zap'); toast('INSERT COIN. (You have no 20p. You never have a 20p.)'); return; }
      if (F.use === 'notice') { noticeBoard(); return; }
    }
    if (F.use === 'tele' && !mine) { walkTo(it.x, it.y); return; }
    if (!F.use && !mine) { if (!it.wall) walkTo(it.x + (it.r ? 0 : 0), it.y + (it.r ? it.F.w : it.F.d)); nameTag(F.n, vx, vy); return; }
    const acts = [];
    if (F.use && !['tramp', 'ball', 'note', 'grot', 'phone', 'arcade', 'notice', 'tele'].includes(F.use)) acts.push(['use', { lamp: it.s ? 'Switch off' : 'Switch on', fire: it.s ? 'Switch off' : 'Light it', disco: it.s ? 'Switch off' : 'Switch on', pc: it.s ? 'Switch off' : 'Switch on', tv: 'Change channel', dice: 'Roll it!', juke: 'Play a tune', vend: F.art[0] === 'icecream' ? 'Get an ice cream' : 'Get a can of pop', bell: 'Ding!' }[F.use] || 'Use']);
    if (mine) { acts.push(['move', 'Move']); if (F.k !== 'w' && F.w !== F.d || F.k !== 'w' && F.w === F.d && F.w === 1) acts.push(['rot', 'Turn']); acts.push(['pick', 'Pick up']); }
    const el = card(`<button class="jw-cx" type="button" aria-label="Close">x</button><div class="jw-ch"><img class="jw-thumb" src="${ART.thumb(F.id, 48)}" alt=""><span><b>${esc(F.n)}</b><small>${esc(F.ds || '')}</small></span></div><div class="jw-cb">${acts.map(([k, l]) => `<button type="button" class="btn" data-k="${k}">${l}</button>`).join('')}</div>`, vx, vy);
    el.addEventListener('click', ev => {
      const b = ev.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; closeCard();
      if (k === 'use') { JW.send(it.u != null ? { t: 'jwUse', u: it.u } : { t: 'jwUse', i: it.i }); if (F.use === 'dice') sfx('dice'); }
      else if (k === 'move') beginPlace({ u: it.u, F, r: it.r | 0, wall: it.wall, x: it.x, y: it.y, z: it.z });
      else if (k === 'rot') JW.send({ t: 'jwPlace', u: it.u, x: it.x, y: it.y, r: it.r ? 0 : 1 });
      else if (k === 'pick') JW.send({ t: 'jwPick', u: it.u });
    });
  }
  function nameTag(t, vx, vy) { const el = h('div', 'jw-tag jw-ftag', esc(t)); S.ov.appendChild(el); el.style.transform = `translate(${Math.round(vx)}px,${Math.round(vy - 10)}px) translate(-50%,-100%)`; setTimeout(() => el.remove(), 1600); }
  function noticeBoard() {
    const day = Desk.today99(), wk = C.week(`1999-${String(day.m).padStart(2, '0')}-${String(day.d).padStart(2, '0')}`).no, F = C.rareOfWeek(wk);
    const rotw = JW.info && JW.info.rotw && JW.info.rotw[0];
    Desk.msgbox('The Lobby Notice Board', `*** WELCOME TO JACKWORLD! ***\n\nTHIS WEEK'S RARE: ${F.n} (${rp(F.p)}, only ${F.lim} will ever exist). In the Catalogue until Sunday night!\n\nROOM OF THE WEEK: ${rotw ? `"${rotw.n}" by ${rotw.on}` : 'not picked yet. Could be YOU!'}\n\nGAMES: Quiz Booth in the Pixel Arcade, Musical Chairs on the Rooftop, Snowball Fights up the Snowy Peak.\n\nFRIDAY NIGHT DISCO on the Rooftop, 6pm till 11pm!\n\nLOST: one sock. Possibly in the Ball Pit.\nFOR SWAPS: 2 x Bean Bag (Red). Ask Kirsty.\n\nRemember: be nice, never tell anybody your address, phone number or school, and press Report if anybody is horrible.`, 'info');
    JW.send({ t: 'jwInfo' });
  }

  // ================================================================ putting furni out
  function beginPlace(o) {
    closePanel(); closeCard();
    S.place = Object.assign({ at: null, ok: false, r: 0 }, o);
    if (o.x != null) { S.place.at = o.wall ? { w: o.wall, x: o.x, z: o.z | 0 } : { x: o.x, y: o.y }; S.place.ok = true; }
    const bar = S.placebar; bar.hidden = false;
    bar.innerHTML = `<b>${esc(o.F.n)}</b><span>${S.vw < 560 ? 'Press where it should go.' : 'Click where it should go.'}</span>${o.F.k === 'w' ? '<button type="button" class="btn" data-k="up">Higher</button><button type="button" class="btn" data-k="down">Lower</button>' : '<button type="button" class="btn" data-k="rot">Turn (R)</button>'}<button type="button" class="btn jw-ok" data-k="ok">Put it here</button><button type="button" class="btn" data-k="no">Cancel</button>`;
    bar.onclick = ev => { const b = ev.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; if (k === 'rot') rotatePlace(); else if (k === 'no') endPlace(); else if (k === 'ok') confirmPlace(true); else if (S.place && S.place.at && S.place.at.w) { S.place.at.z = Math.max(-24, Math.min(16, (S.place.at.z | 0) + (k === 'up' ? 4 : -4))); checkPlace(); } };
    checkPlace(); S.view.focus(); S.dirty = true;
  }
  function endPlace() { if (!S) return; S.place = null; S.placebar.hidden = true; S.dirty = true; }
  function rotatePlace() { if (!S.place || S.place.F.k === 'w') return; S.place.r = S.place.r ? 0 : 1; checkPlace(); }
  function placeAt(vx, vy) {
    const pl = S.place, r = S.room; if (!pl || !r.st) return;
    const [lx, ly] = toRoom(vx, vy);
    if (pl.F.k === 'w') {
      const st = r.st, sx = lx - st.ox;
      if (sx >= 0) pl.at = { w: 'R', x: Math.max(0, Math.min(r.W - pl.F.w, Math.floor(sx / 16 - pl.F.w / 2 + 0.5))), z: pl.at && pl.at.z | 0 };
      else pl.at = { w: 'L', x: Math.max(0, Math.min(r.H - pl.F.w, Math.floor(-sx / 16 - pl.F.w / 2 + 0.5))), z: pl.at && pl.at.z | 0 };
    } else { const [tx, ty] = tileAt(lx, ly); const w = pl.r ? pl.F.d : pl.F.w, d = pl.r ? pl.F.w : pl.F.d; pl.at = { x: Math.max(0, Math.min(r.W - w, tx - Math.floor((w - 1) / 2))), y: Math.max(0, Math.min(r.H - d, ty - Math.floor((d - 1) / 2))) }; }
    checkPlace();
  }
  function checkPlace() { // the same rules as the server (it checks again anyway)
    const pl = S.place, r = S.room; if (!pl || !pl.at || r.pub) { if (pl) pl.ok = false; S.dirty = true; return; }
    const F = pl.F, door = r.door;
    let ok = true;
    if (F.k === 'w') { for (let i = 0; i < F.w; i++) { const tx = pl.at.w === 'R' ? pl.at.x + i : 0, ty = pl.at.w === 'R' ? 0 : pl.at.x + i; if (!r.map[ty] || r.map[ty][tx] === 'x' || (pl.at.w === 'L' && ty === door[1])) ok = false; } for (const it of r.items) if (it.wall === pl.at.w && it.u !== pl.u && pl.at.x < it.x + it.F.w && it.x < pl.at.x + F.w && Math.abs((it.z | 0) - (pl.at.z | 0)) < 30) ok = false; }
    else for (const [x, y] of footprint({ F, x: pl.at.x, y: pl.at.y, r: pl.r })) {
      if (!r.map[y] || r.map[y][x] === 'x' || r.map[y][x] === undefined) ok = false;
      if (x === door[0] && y === door[1]) ok = false;
      for (const it of r.items) if (!it.wall && it.u !== pl.u && (F.k === 'r') === (it.F.k === 'r') && footprint(it).some(([a, b]) => a === x && b === y)) ok = false;
    }
    pl.ok = ok; const b = S.placebar.querySelector('.jw-ok'); if (b) b.disabled = !ok;
    S.dirty = true;
  }
  function confirmPlace(fromBtn) {
    const pl = S.place; if (!pl || !pl.at) return;
    if (!pl.ok) { if (fromBtn) toast("It won't fit there."); return; }
    if (S.vw < 560 && !fromBtn) return; // on a small screen: press "Put it here" to be sure
    if (pl.F.k === 'w') JW.send({ t: 'jwPlace', u: pl.u, w: pl.at.w, x: pl.at.x, z: pl.at.z | 0 });
    else JW.send({ t: 'jwPlace', u: pl.u, x: pl.at.x, y: pl.at.y, r: pl.r });
    sfx('thud');
  }
  function deco() { if (S.room && S.room.mine && S.room.R.f.length >= 10) A.secret('jw.deco'); }

  // ================================================================ panels
  function closePanel() { if (!S) return; S.pane.hidden = true; S.pane.innerHTML = ''; S.panel = ''; S.body.querySelectorAll('.jw-bar button').forEach(b => b.classList.remove('on')); if (S.cam.fit) { fitCam(); S.dirty = true; } }
  function refreshPanel() { if (S && S.panel) openPanel(S.panel, S.panelArg); }
  function openPanel(k, arg) {
    S.panel = k; S.panelArg = arg; closeCard();
    S.body.querySelectorAll('.jw-bar button').forEach(b => b.classList.toggle('on', b.dataset.p === k));
    const T = { rooms: 'Rooms', cat: 'The JackWorld Catalogue', stuff: 'My Stuff', look: 'Wardrobe', home: 'My Room', help: 'Help', gb: 'Guestbook', staff: 'Moderator Tools', log: 'Chat Log', who: "Who's Here" }[k] || k;
    S.pane.hidden = false; S.pane.className = 'jw-pane jw-p-' + k + (arg && arg.first ? ' jw-first' : '');
    S.pane.innerHTML = `<div class="jw-pt"><span>${esc(T)}</span><button type="button" class="jw-px" aria-label="Close">x</button></div><div class="jw-pb"></div>`;
    S.pane.querySelector('.jw-px').addEventListener('click', () => { closePanel(); if (arg && arg.first && !S.room) goRoom('lobby'); });
    const b = S.pane.querySelector('.jw-pb');
    ({ rooms: pRooms, cat: pCat, stuff: pStuff, look: pLook, home: pHome, help: pHelp, gb: pGb, staff: pStaff, log: pLog, who: pWho }[k] || (() => {}))(b, arg || {});
    if (S.cam.fit && S.room) { fitCam(); S.dirty = true; }
  }
  // ---- Rooms (the Navigator)
  function pRooms(b, arg) {
    const tab = arg.tab || S.navTab || 'pub'; S.navTab = tab;
    const T = [['pub', 'Public'], ['hot', 'Busy'], ['top', 'Top Rated'], ['new', 'New'], ['mine', 'Mine'], ['rotw', 'Room of the Week'], ['search', 'Search']];
    b.innerHTML = `<div class="jw-tabs">${T.map(([k, l]) => `<button type="button" data-t="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>${tab === 'search' ? `<form class="jw-search"><input type="text" maxlength="30" placeholder="Room name or owner" value="${esc(arg.q || S.navQ || '')}" aria-label="Search rooms"><button class="btn">Find</button></form>` : ''}<div class="jw-list"><p class="jw-dim">Loading the list...</p></div>`;
    b.querySelectorAll('[data-t]').forEach(x => x.addEventListener('click', () => openPanel('rooms', { tab: x.dataset.t })));
    const f = b.querySelector('.jw-search'); if (f) f.addEventListener('submit', ev => { ev.preventDefault(); S.navQ = f.querySelector('input').value; JW.send({ t: 'jwNav', tab: 'search', q: S.navQ }); });
    if (tab !== 'search' || arg.q || S.navQ) JW.send({ t: 'jwNav', tab, q: arg.q || S.navQ || '' });
  }
  function navList(m) {
    const L = S.pane.querySelector('.jw-list'); if (!L || m.tab !== S.navTab) return;
    if (!m.list.length) { L.innerHTML = `<p class="jw-dim">${{ hot: 'Nobody is in a member\'s room right now. Be the first: press My Room!', mine: 'You haven\'t got a room yet. Press My Room to make one (FREE for members).', rotw: 'No Room of the Week yet. Make your room amazing and it could be you!', search: 'No rooms found.' }[m.tab] || 'Nothing here yet.'}</p>`; return; }
    L.innerHTML = m.list.map(r => `<button type="button" class="jw-room" data-r="${esc(r.id)}"><span class="jw-rico" style="background:${r.pub ? PUBICO[r.id] : '#c0c0c0'}">${r.pub ? '' : r.lock === 'bell' ? ICONS.bell : r.lock === 'shut' ? ICONS.lock : ICONS.home}</span><span class="jw-rt"><b>${esc(r.n)}</b><small>${r.pub ? esc(r.ds) : `by ${esc(r.on)}${r.ds ? ' &middot; ' + esc(r.ds) : ''}`}${r.w ? ` &middot; Week ${r.w}` : ''}${r.g ? ` &middot; <i>${{ quiz: 'Quiz Booth', chairs: 'Musical Chairs', snow: 'Snowball Fights' }[r.g]}</i>` : ''}</small></span><span class="jw-ru" title="People in there">${r.u}</span>${r.pub ? '' : `<span class="jw-rl" title="Likes">${ICONS.heart}${r.lk}</span>`}</button>`).join('');
    L.querySelectorAll('[data-r]').forEach(x => x.addEventListener('click', () => { sfx('click'); goRoom(x.dataset.r); if (S.vw < 560) closePanel(); }));
  }
  // ---- the Catalogue
  function pCat(b, arg) {
    const pg = arg.pg || S.catPg || 'new'; S.catPg = pg;
    const md = (JW.me && JW.me.md) || Desk.today99().md, wk = (JW.me && JW.me.wk) || 1, bal = window.Econ ? Econ.bal : 0;
    const P0 = C.PAGES.find(p => p[0] === pg) || C.PAGES[0];
    let items = C.F.filter(f => !f.pub && !f.prize && f.pg === pg && (pg === 'rares' ? f.wk <= wk : true));
    let body = '';
    if (pg === 'new') {
      const rare = C.rareOfWeek(wk), left = JW.me && JW.me.rare ? JW.me.rare.left : rare.lim, picks = C.F.filter(f => !f.pub && !f.prize && !f.wk && C.inSea(f, md) && f.sea).concat(C.F.filter(f => f.pg === 'fun' && f.r >= 1)).slice(0, 6);
      const ends = C.week(`1999-${String(Math.floor(md / 100)).padStart(2, '0')}-${String(md % 100).padStart(2, '0')}`).sun, days = Math.max(0, Math.ceil((ends - Date.UTC(1999, Math.floor(md / 100) - 1, md % 100)) / 864e5));
      body = `<div class="jw-rare"><div class="jw-rare-h">THIS WEEK'S RARE</div><img src="${ART.thumb(rare.id, 96)}" alt=""><div><b>${esc(rare.n)}</b><p>${esc(rare.ds)}</p><p class="jw-price">${rp(rare.p)}</p><p class="jw-left">${left > 0 ? `<b>${left}</b> of ${rare.lim} left! Gone ${days ? `in ${days} day${days > 1 ? 's' : ''}` : 'at midnight'}.` : 'SOLD OUT!'}</p>${left > 0 ? `<button type="button" class="btn jw-buy" data-id="${rare.id}">Buy it!</button>` : ''}</div></div><p class="jw-dim">One rare a week, only on sale that week. One each. Numbered, so you'll know if you've got #1!</p><h4>Hot this week</h4><div class="jw-grid">${picks.map(itemTile).join('')}</div>`;
    } else if (pg === 'styles') {
      const st = (JW.me && JW.me.st) || { fl: [], wl: [] }, R = S.room && S.room.mine ? S.room.R : null;
      body = `<p class="jw-dim">Buy once, use for ever. ${R ? 'Click one to put it in your room.' : 'Go to your room to try them on.'}</p><h4>Floors</h4><div class="jw-grid">${C.FLOORS.map(([id, n, p, art]) => styleTile('fl', id, n, p, (st.fl || []).includes(id) || !p, R && R.fl === id, art)).join('')}</div><h4>Wallpaper</h4><div class="jw-grid">${C.WALLS.map(([id, n, p, art]) => styleTile('wl', id, n, p, (st.wl || []).includes(id) || !p, R && R.wl === id, art)).join('')}</div>`;
    } else if (pg === 'rooms') {
      const st = (JW.me && JW.me.st) || { md: [] }, R = S.room && S.room.mine ? S.room.R : null;
      body = `<p class="jw-dim">A bigger room for more furni and more mates. Anything that doesn't fit the new shape goes back in My Stuff.</p><div class="jw-models">${C.MODELS.map(([id, n, p, max, map]) => { const have = !p || (st.md || []).includes(id); return `<button type="button" class="jw-model${R && R.md === id ? ' on' : ''}" data-st="md" data-id="${id}"><img src="${modelPic(map)}" alt=""><b>${esc(n)}</b><small>${map[0].length} x ${map.length} tiles &middot; up to ${max} furni</small><span>${R && R.md === id ? 'You are here' : have ? 'Owned' : rp(p)}</span></button>`; }).join('')}</div>`;
    } else {
      if (pg === 'rares') items = items.slice().reverse();
      body = `<p class="jw-dim">${esc(P0[2])}</p><div class="jw-grid">${items.map(itemTile).join('')}</div>`;
    }
    b.innerHTML = `<div class="jw-cat"><div class="jw-catnav">${C.PAGES.map(([id, n]) => `<button type="button" data-pg="${id}" class="${id === pg ? 'on' : ''}">${esc(n)}</button>`).join('')}</div><div class="jw-catpg"><div class="jw-bal">You have <b>${member() ? (window.Econ && Econ.rupees ? Econ.rupees(bal, true) : rp(bal)) : '0 Rupees (guests can look, members can buy)'}</b></div>${body}<div class="jw-det" hidden></div></div></div>`;
    b.querySelectorAll('[data-pg]').forEach(x => x.addEventListener('click', () => openPanel('cat', { pg: x.dataset.pg })));
    b.querySelectorAll('.jw-it').forEach(x => x.addEventListener('click', () => detail(b, x.dataset.id)));
    b.querySelectorAll('.jw-buy').forEach(x => x.addEventListener('click', () => buy(x.dataset.id, 1)));
    b.querySelectorAll('[data-st]').forEach(x => x.addEventListener('click', () => styleBuy(x.dataset.st, x.dataset.id)));
    function itemTile(f) { const on = !f.wk || f.wk === wk ? C.inSea(f, md) : false; const R0 = window.LootCat ? LootCat.RAR[f.r] : null; return `<button type="button" class="jw-it r${f.r}${on ? '' : ' off'}" data-id="${f.id}" title="${esc(f.n)}"><img src="${ART.thumb(f.id, 64)}" alt=""><span>${esc(f.n)}</span><em>${on ? rp(f.p) : f.wk ? 'Sold out / gone' : 'Not in season'}</em>${f.r ? `<i style="background:${R0 ? R0.col : '#888'}"></i>` : ''}</button>`; }
  }
  function detail(b, id) {
    const F = C.FURNI[id], d = b.querySelector('.jw-det'); if (!F) return;
    const md = (JW.me && JW.me.md) || Desk.today99().md, wk = (JW.me && JW.me.wk) || 1, on = F.wk ? F.wk === wk : C.inSea(F, md);
    const R0 = window.LootCat ? LootCat.RAR[F.r] : { n: '', col: '#888' }, have = window.Loot && Loot.count ? Loot.count(F.id) : 0;
    d.hidden = false;
    d.innerHTML = `<button type="button" class="jw-cx" aria-label="Close">x</button><img src="${ART.thumb(F.id, 128)}" alt=""><div><b>${esc(F.n)}</b> <span class="jw-rb" style="background:${R0.col}">${esc(R0.n)}</span><p>${esc(F.ds)}</p><p class="jw-dim">${F.w} x ${F.d} ${F.k === 'w' ? '(goes on a wall)' : F.k === 'r' ? '(on the floor: walk on it)' : 'tile' + (F.w * F.d > 1 ? 's' : '')}${F.sit ? ' &middot; you can sit on it' : ''}${F.use ? ' &middot; click it to use it' : ''}${F.lim ? ` &middot; only ${F.lim} will ever exist` : ''}${have ? ` &middot; you have ${have}` : ''}</p>${on ? `<p class="jw-price">${rp(F.p)}</p><button type="button" class="btn jw-b1">Buy</button>${!F.wk && F.p <= 80 ? ' <button type="button" class="btn jw-b3">Buy 3</button>' : ''}` : `<p class="jw-dim">${F.wk ? (F.wk > wk ? 'Not released yet!' : 'This rare is gone from the Catalogue. Try JackBay or the Trading Post!') : 'Not in season right now.'}</p>`}</div>`;
    d.querySelector('.jw-cx').addEventListener('click', () => { d.hidden = true; });
    const b1 = d.querySelector('.jw-b1'); if (b1) b1.addEventListener('click', () => buy(F.id, 1));
    const b3 = d.querySelector('.jw-b3'); if (b3) b3.addEventListener('click', () => buy(F.id, 3));
    d.scrollIntoView && d.scrollIntoView({ block: 'nearest' });
  }
  function buy(id, n) {
    if (!member()) { if (window.Guest && Guest.need) Guest.need('Buying furni in JackWorld', () => buy(id, n)); else toast('Join JackNet (free!) to buy furni.'); return; }
    const F = C.FURNI[id]; if (!F) return;
    Desk.msgbox('JackWorld Catalogue', `Buy ${n > 1 ? n + ' x ' : ''}${F.n} for ${rp(F.p * n)}?`, 'q', [['Buy', () => JW.send({ t: 'jwBuy', id, n })], ['Cancel']]);
  }
  const swatch = {};
  function styleTile(k, id, n, p, have, on, art) {
    const key = k + id; if (!swatch[key]) {
      const c = document.createElement('canvas'); c.width = 48; c.height = 32; const g = c.getContext('2d');
      const map = ['...', '...'], room = ART.room({ map, floor: k === 'fl' ? art : ['boards', '#b98a52'], wall: k === 'wl' ? art : ['plain', '#efe4c8'], in: true });
      g.imageSmoothingEnabled = false; g.drawImage(room.c, k === 'fl' ? room.ox - 40 : room.ox - 40, k === 'fl' ? room.oy - 4 : room.oy - 74, 80, 54, 0, 0, 48, 32); swatch[key] = c.toDataURL();
    }
    return `<button type="button" class="jw-it jw-sw${on ? ' cur' : ''}" data-st="${k}" data-id="${id}"><img src="${swatch[key]}" alt=""><span>${esc(n)}</span><em>${on ? 'In use' : have ? 'Owned' : rp(p)}</em></button>`;
  }
  function modelPic(map) { const c = document.createElement('canvas'), room = ART.room({ map, floor: ['check', '#e8e0c8', '#c8b898'], wall: ['plain', '#9cc8ec'], in: true }); c.width = 96; c.height = 64; const g = c.getContext('2d'); g.drawImage(room.c, 0, 0, room.lw, room.lh, 0, 0, 96, 64 * room.lh / room.lw * 96 / 64 > 64 ? 64 : 96 * room.lh / room.lw); return c.toDataURL(); }
  function styleBuy(k, id) {
    if (!member()) return toast('Members can buy room styles. Joining is FREE!');
    const me = JW.me; if (!me || !me.room) return toast('Make your room first: press My Room!');
    const T = k === 'fl' ? C.FLOORS : k === 'wl' ? C.WALLS : C.MODELS, row = T.find(x => x[0] === id); if (!row) return;
    const have = !row[2] || (me.st && (me.st[k] || []).includes(id));
    const go = () => { JW.send({ t: 'jwStyle', k, id }); if (!(S.room && S.room.mine)) toast('Done! Go to your room to see it.'); };
    if (have) go(); else Desk.msgbox('JackWorld Catalogue', `Buy "${row[1]}" for ${rp(row[2])}? You can use it for ever.`, 'q', [['Buy', go], ['Cancel']]);
  }
  // ---- My Stuff (furni in the Treasure Chest)
  function pStuff(b) {
    if (!member()) { b.innerHTML = `<p>Your stuff lives in your Treasure Chest, and that's for JackNet members. Joining is FREE: Start &gt; Log Off, then pick a name and a password.</p>`; return; }
    const its = (window.Loot && Loot.me && Loot.me.it || []).filter(x => String(x.id).startsWith('furni.') && C.FURNI[x.id]);
    const free = its.filter(x => !x.lk), out = its.filter(x => x.lk === 'jw');
    const groups = {}; for (const x of free) (groups[x.id] = groups[x.id] || []).push(x);
    const inRoom = S.room && S.room.mine;
    b.innerHTML = `<p class="jw-dim">${inRoom ? 'Click something to put it out in your room.' : S.room && !S.room.pub && S.room.rights ? 'Click something to put it out.' : 'Go to <a href="#" data-home>your room</a> to put things out.'} ${out.length ? `(${out.length} already out in your room.)` : ''}</p>${Object.keys(groups).length ? `<div class="jw-grid">${Object.entries(groups).map(([id, xs]) => `<button type="button" class="jw-it r${C.FURNI[id].r}" data-id="${id}" data-u="${xs[0].u}"><img src="${ART.thumb(id, 64)}" alt=""><span>${esc(C.FURNI[id].n)}</span>${xs.length > 1 ? `<em>x${xs.length}</em>` : xs[0].s ? `<em>#${xs[0].s}</em>` : ''}</button>`).join('')}</div>` : `<p>Nothing here yet! Buy furni in the <a href="#" data-cat>Catalogue</a>, trade on the Trading Post, or win it on JackBay.</p>`}<p class="jw-dim">Things that are out in your room are locked, so they can't be traded until you pick them up again.</p>`;
    b.querySelectorAll('[data-u]').forEach(x => x.addEventListener('click', () => { if (!(S.room && !S.room.pub && S.room.rights)) return toast('Go to your room first (press My Room).'); beginPlace({ u: +x.dataset.u, F: C.FURNI[x.dataset.id], r: 0 }); }));
    const hm = b.querySelector('[data-home]'); if (hm) hm.addEventListener('click', ev => { ev.preventDefault(); openPanel('home'); });
    const ct = b.querySelector('[data-cat]'); if (ct) ct.addEventListener('click', ev => { ev.preventDefault(); openPanel('cat'); });
  }
  // ---- the Wardrobe
  function pLook(b, arg) {
    const av = (S.lookAv = S.lookAv && arg.keep ? S.lookAv : myAv().slice());
    const rows = [['Head', 0, ['A person'].concat(['Goblin', 'Ork', 'Blobbit', 'Space Marine', 'Robot', 'Alien', 'Ghost', 'Cat', 'Dragon', 'Smiley', 'Ninja', 'Wizard', 'Skull', 'Heart', 'Joypad', 'Cube'])], ['Skin', 1, C.AV.SKIN.map((c, i) => i < 6 ? '' : 'Alien green')], ['Hair', 2, C.AV.HAIR], ['Hair colour', 3, C.AV.HAIRC], ['Top', 4, C.AV.TOP], ['Top colour', 5, C.AV.COL], ['Bottoms', 6, C.AV.LEGS], ['Bottoms colour', 7, C.AV.COL], ['Shoes', 8, C.AV.SHOES]];
    let dir = S.lookDir | 0;
    b.innerHTML = `${arg.first ? '<p class="jw-hi"><b>Welcome to JackWorld!</b> First, make your person. You can change it any time in the Wardrobe.</p>' : ''}<div class="jw-look"><div class="jw-mirror"><canvas width="80" height="144"></canvas><div><button type="button" class="btn" data-d="-1" aria-label="Turn left">&lt;</button><button type="button" class="btn" data-d="1" aria-label="Turn right">&gt;</button></div></div><div class="jw-opts">${rows.map(([n, i, list]) => `<div class="jw-opt" data-i="${i}"><span>${n}</span><button type="button" class="btn" data-s="-1" aria-label="Previous ${n}">&lt;</button><em></em><button type="button" class="btn" data-s="1" aria-label="Next ${n}">&gt;</button></div>`).join('')}</div></div><p class="jw-dim">Hats and face things you wear in the Hangout (from the Rupee Emporium and JackLoot) show up on your JackWorld person too!</p><div class="jw-row"><button type="button" class="btn" data-k="rnd">Surprise me</button><button type="button" class="btn jw-ok" data-k="save">${arg.first ? 'Done: let me in!' : 'Save my look'}</button></div>`;
    const cv = b.querySelector('canvas'), g = cv.getContext('2d');
    const draw = () => {
      g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false;
      const { s, mirror } = ART.avatar(av, 'stand', [0, 1, 2, 3][dir], 0, member() ? (window.Econ && Econ.wearOf ? (Econ.wearOf(Net.me.nick) || null) : null) : null);
      g.save(); if (mirror) { g.translate(cv.width, 0); g.scale(-1, 1); } g.drawImage(s.c, 0, 0, s.w, s.h, 0, 0, s.w * 2, s.h * 2); g.restore();
      rows.forEach(([n, i, list]) => { const el = b.querySelector(`.jw-opt[data-i="${i}"] em`); const v = list[av[i]]; el.innerHTML = typeof v === 'string' && v && !v.startsWith('#') ? esc(v) : `<i style="background:${esc(v || C.AV.SKIN[av[i]] || '#ccc')}"></i>`; });
    };
    b.querySelectorAll('.jw-opt').forEach(o => o.addEventListener('click', ev => { const s = ev.target.closest('[data-s]'); if (!s) return; const i = +o.dataset.i, mx = C.AV.MAX[i]; av[i] = (av[i] + +s.dataset.s + mx + 1) % (mx + 1); draw(); sfx('click'); }));
    b.querySelectorAll('[data-d]').forEach(x => x.addEventListener('click', () => { dir = S.lookDir = (dir + +x.dataset.d + 4) % 4; draw(); }));
    b.querySelector('[data-k="rnd"]').addEventListener('click', () => { const r = C.avOf(Math.random()); for (let i = 0; i < 9; i++) av[i] = r[i]; if (Math.random() < 0.8) av[0] = 0; draw(); sfx('boing'); });
    b.querySelector('[data-k="save"]').addEventListener('click', () => {
      LOOK.av = av.slice(); setPref('av', av.slice()); setPref('made', true); JW.send({ t: 'jwAv', av: av.slice() }); A.secret('jw.look'); sfx('solve');
      if (JW.me) JW.me.av = av.slice();
      closePanel(); if (!S.room) goRoom(S.want || 'lobby'); else toast('Looking good!');
    });
    draw();
  }
  // ---- My Room
  function pHome(b) {
    if (!member()) { b.innerHTML = `<p><b>Members get their own room for FREE!</b></p><p>Decorate it with furni from the Catalogue, put a lock or a doorbell on it, give your mates spare keys, and get likes. The best room each week wins the Room of the Week Cup and 250 Rupees.</p><p>Join JackNet (it's free): Start &gt; Log Off, then pick a name and a password.</p>`; return; }
    const me = JW.me;
    if (!me || !me.room) {
      b.innerHTML = `<p><b>You haven't got a room yet!</b> Every JackNet member gets one for FREE: a little Shoebox room to start with (you can buy bigger rooms in the Catalogue).</p><form class="jw-make"><label>Call it: <input type="text" maxlength="30" value="${esc((Net.me.nick || 'My') + "'s Room")}"></label><button class="btn jw-ok">Make my room!</button></form>`;
      b.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); JW.send({ t: 'jwMake', n: b.querySelector('input').value }); });
      return;
    }
    const here = S.room && S.room.id === me.room, R = here ? S.room.R : null;
    if (!here) { b.innerHTML = `<p>Your room is waiting for you.</p><div class="jw-row"><button type="button" class="btn jw-ok" data-k="go">Go to my room</button></div><p class="jw-dim">Change its name, lock and style once you're in it.</p>`; b.querySelector('[data-k="go"]').addEventListener('click', () => goRoom(me.room)); return; }
    const st = me.st || { fl: [], wl: [] };
    b.innerHTML = `<form class="jw-set"><label>Name <input type="text" name="n" maxlength="30" value="${esc(R.n)}"></label><label>About it <input type="text" name="ds" maxlength="100" value="${esc(R.ds || '')}" placeholder="e.g. Come in for a chat and a cuppa!"></label>
      <label>Sort of room <select name="cat">${C.ROOM_CATS.map(([k, l]) => `<option value="${k}"${R.cat === k ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <fieldset><legend>Who can come in?</legend>${[['open', 'Anybody (open)'], ['bell', 'Ring the doorbell first'], ['shut', 'Locked (spare keys only)']].map(([k, l]) => `<label class="jw-rad"><input type="radio" name="lock" value="${k}"${R.lock === k ? ' checked' : ''}> ${l}</label>`).join('')}</fieldset>
      <div class="jw-row"><button class="btn jw-ok">Save</button></div></form>
      <h4>Floor and walls</h4><div class="jw-row"><select data-k="fl">${C.FLOORS.filter(f => !f[2] || (st.fl || []).includes(f[0])).map(f => `<option value="${f[0]}"${R.fl === f[0] ? ' selected' : ''}>${esc(f[1])}</option>`).join('')}</select><select data-k="wl">${C.WALLS.filter(f => !f[2] || (st.wl || []).includes(f[0])).map(f => `<option value="${f[0]}"${R.wl === f[0] ? ' selected' : ''}>${esc(f[1])}</option>`).join('')}</select><button type="button" class="btn" data-k="more">More styles...</button></div>
      <h4>Spare keys</h4><p class="jw-dim">People with a spare key can always come in, even when it's locked.</p><div class="jw-keys">${(R.keys || []).map(n => `<span>${esc(n)} <button type="button" data-unkey="${esc(n)}" aria-label="Take back ${esc(n)}'s key">x</button></span>`).join('') || '<i>Nobody has a key yet.</i>'}</div><form class="jw-addkey"><input type="text" maxlength="16" placeholder="Member name" aria-label="Member name"><button class="btn">Give a key</button></form>
      <p class="jw-dim">${ICONS.heart} ${fmt(R.likes)} likes &middot; ${fmt(R.vis)} visits &middot; ${R.f.length} of ${S.room.M[3]} furni &middot; <a href="#" data-k="size">Bigger room?</a></p>`;
    b.querySelector('.jw-set').addEventListener('submit', ev => { ev.preventDefault(); const f = new FormData(ev.target); JW.send({ t: 'jwSet', n: f.get('n'), ds: f.get('ds'), cat: f.get('cat'), lock: f.get('lock') }); toast('Saved!'); });
    b.querySelectorAll('select[data-k]').forEach(s => s.addEventListener('change', () => JW.send({ t: 'jwStyle', k: s.dataset.k, id: s.value })));
    b.querySelector('[data-k="more"]').addEventListener('click', () => openPanel('cat', { pg: 'styles' }));
    b.querySelector('[data-k="size"]').addEventListener('click', ev => { ev.preventDefault(); openPanel('cat', { pg: 'rooms' }); });
    b.querySelectorAll('[data-unkey]').forEach(x => x.addEventListener('click', () => JW.send({ t: 'jwKey', name: x.dataset.unkey, on: false })));
    b.querySelector('.jw-addkey').addEventListener('submit', ev => { ev.preventDefault(); const v = ev.target.querySelector('input').value.trim(); if (v) JW.send({ t: 'jwKey', name: v, on: true }); });
  }
  // ---- the guestbook
  function pGb(b) { b.innerHTML = '<p class="jw-dim">Loading...</p>'; JW.send({ t: 'jwGb', r: S.room.id }); }
  function gbList(m) {
    const b = S.pane.querySelector('.jw-pb'); if (!b) return;
    b.innerHTML = `<p><b>${esc(m.n)}</b></p>${member() ? `<form class="jw-sign"><textarea maxlength="200" rows="2" placeholder="Say something nice!" aria-label="Your message"></textarea><button class="btn jw-ok">Sign</button></form>` : '<p class="jw-dim">Members can sign guestbooks.</p>'}<div class="jw-gbl">${m.list.map(e => `<div class="jw-gbe"><b>${esc(e.by)}</b> <small>${new Date(e.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} 1999</small>${m.can ? ` <button type="button" data-del="${e.ts}" aria-label="Delete">x</button>` : ''}<p>${esc(e.s)}</p></div>`).join('') || '<p class="jw-dim">Nobody has signed yet. Be the first!</p>'}</div>`;
    const f = b.querySelector('.jw-sign'); if (f) f.addEventListener('submit', ev => { ev.preventDefault(); const v = f.querySelector('textarea').value.trim(); if (!v) return; JW.send({ t: 'jwSign', r: m.r, s: v }); A.secret('jw.gb'); });
    b.querySelectorAll('[data-del]').forEach(x => x.addEventListener('click', () => JW.send({ t: 'jwGbDel', r: m.r, ts: +x.dataset.del })));
  }
  // ---- the chat log and who's here
  function pLog(b) {
    const L = S.log || [];
    b.innerHTML = `<div class="jw-log">${L.map(l => `<div class="jw-ll jw-ll-${l.k}"><small>${String(l.t.getHours()).padStart(2, '0')}:${String(l.t.getMinutes()).padStart(2, '0')}</small> <b>${esc(l.n)}:</b> ${esc(l.s)}</div>`).join('') || '<p class="jw-dim">Nobody has said anything yet. Say hello!</p>'}</div>`;
    const lg = b.querySelector('.jw-log'); b.scrollTop = b.scrollHeight;
  }
  function pWho(b) {
    const list = [...S.av.values()].sort((x, y) => (x.id === myId() ? -1 : y.id === myId() ? 1 : x.nick.localeCompare(y.nick)));
    const npcs = S.room && S.room.pub ? npcsHere() : [];
    b.innerHTML = `<div class="jw-list">${list.map(a => `<button type="button" class="jw-room" data-av="${a.id}"><img class="jw-whoh" src="${headPic(a)}" alt=""><span class="jw-rt"><b>${esc(a.nick)}${a.id === myId() ? ' (you)' : ''}</b><small>${a.bot ? 'Computer player' : a.member ? 'JackNet member' : 'Guest'}${a.staff ? ' &middot; Moderator' : ''}</small></span></button>`).join('')}${npcs.map(n => `<div class="jw-room jw-npcrow"><img class="jw-whoh" src="${ART.headURL(C.NPC_AV[n.look] || C.avOf(n.name))}" alt=""><span class="jw-rt"><b>${esc(n.name)}</b><small>A JackWorld regular</small></span></div>`).join('')}</div>`;
    b.querySelectorAll('[data-av]').forEach(x => x.addEventListener('click', () => { const a = S.av.get(+x.dataset.av); if (!a || !a._p) return; const v = toView(a._p[0], a._p[1] - 30); closePanel(); avCard(a, v[0], v[1]); }));
  }
  // ---- help + the first-time guide
  function pHelp(b) {
    b.innerHTML = `<div class="jw-help">
      <p><b>Walk:</b> click the floor. <b>Sit:</b> click a chair, sofa or bench. <b>Talk:</b> type in the box at the bottom and press Enter.</p>
      <p><b>Moves:</b> press the smiley, or type <code>/wave</code> <code>/dance</code> <code>/sit</code> <code>/jump</code> <code>/laugh</code> <code>/cool</code> <code>/think</code> <code>/love</code> <code>/cry</code> <code>/sleep</code> <code>/waaagh</code> <code>/stand</code>. <code>/shout</code> to shout, <code>/w Name message</code> to whisper. Type <b>brb</b> and you'll snooze until you're back.</p>
      <p><b>People:</b> click somebody to wave, whisper, see their profile, trade or visit their room.</p>
      <p><b>Your room</b> (members): press <b>My Room</b>. Buy furni in the <b>Catalogue</b>, then put it out from <b>My Stuff</b>. Click your furni to move, turn or pick it up.</p>
      <p><b>Games:</b> the Quiz Booth (Pixel Arcade), Musical Chairs (Rooftop Disco) and Snowball Fights (Snowy Peak). Win Rupees!</p>
      <p><b>Rares:</b> a new limited rare every Monday. Once they're gone, they're GONE.</p>
      <p><b>Be safe:</b> never tell anybody your real name, address, phone number or school. If somebody is horrible, click them and press <b>Report</b>.</p>
      <div class="jw-row"><button type="button" class="btn" data-k="guide">Show me the tour again</button><button type="button" class="btn" data-k="web">www.jackworld.jnet</button></div></div>`;
    b.querySelector('[data-k="guide"]').addEventListener('click', () => { closePanel(); guide(); });
    b.querySelector('[data-k="web"]').addEventListener('click', () => JW.go('http://www.jackworld.jnet/help.html'));
  }
  function guide() {
    if (!S) return;
    const steps = [
      ['.jw-cv', 'This is the room. <b>Click the floor to walk.</b> Click a chair to sit down.'],
      ['.jw-chat input', 'Type here and press <b>Enter</b> to talk. Your words pop up in a bubble.'],
      ['.jw-emobtn', 'Press the smiley to <b>wave, dance, sit</b> and more.'],
      ['[data-p="rooms"]', '<b>Rooms</b> takes you anywhere: the Arcade, the Beach, the Rooftop Disco... or walk through the doors!'],
      ['[data-p="home"]', 'Members get their <b>own room</b>. Decorate it with furni from the <b>Catalogue</b>.'],
      ['[data-p="look"]', 'Change your look in the <b>Wardrobe</b>. Have fun and be nice!'],
    ];
    let i = 0;
    const tip = h('div', 'jw-tip'); S.body.appendChild(tip);
    const show = () => {
      if (!S || i >= steps.length) { tip.remove(); setPref('guide', true); if (S) S.body.querySelectorAll('.jw-glow').forEach(x => x.classList.remove('jw-glow')); return; }
      const [sel, txt] = steps[i], el = S.body.querySelector(sel); if (!el) { i++; return show(); }
      S.body.querySelectorAll('.jw-glow').forEach(x => x.classList.remove('jw-glow')); if (sel !== '.jw-cv') el.classList.add('jw-glow');
      tip.innerHTML = `<div>${txt}</div><div class="jw-row"><small>${i + 1} of ${steps.length}</small><button type="button" class="btn" data-k="skip">Skip</button><button type="button" class="btn jw-ok" data-k="next">${i === steps.length - 1 ? 'Got it!' : 'Next'}</button></div>`;
      const br = S.body.getBoundingClientRect(), er = el.getBoundingClientRect();
      const tw = Math.min(260, br.width - 16), cx = sel === '.jw-cv' ? br.width / 2 : er.left - br.left + er.width / 2;
      tip.style.width = tw + 'px'; tip.style.left = Math.max(8, Math.min(br.width - tw - 8, cx - tw / 2)) + 'px';
      const th = tip.offsetHeight;
      tip.style.top = (sel === '.jw-cv' ? br.height * 0.3 : Math.max(8, er.top - br.top - th - 12)) + 'px';
      tip.classList.toggle('down', sel !== '.jw-cv');
      tip.querySelector('[data-k="next"]').onclick = () => { i++; show(); };
      tip.querySelector('[data-k="skip"]').onclick = () => { i = steps.length; S.body.querySelectorAll('.jw-glow').forEach(x => x.classList.remove('jw-glow')); show(); };
    };
    show();
  }
  // ---- moderators
  function pStaff(b) {
    b.innerHTML = `<p class="jw-dim">Reports from players, with what was said in the room. Mute people who are being horrible; clear a room if it has got out of hand.</p><div class="jw-row"><button type="button" class="btn" data-k="clear">Clear this room</button><button type="button" class="btn" data-k="clearpick">Clear + pick up all furni</button><button type="button" class="btn" data-k="close">Clear + close for a day</button></div><div class="jw-staffl"><p class="jw-dim">Loading reports...</p></div>`;
    b.querySelector('[data-k="clear"]').addEventListener('click', () => JW.send({ t: 'jwStaff', a: 'clear', r: S.room.id }));
    b.querySelector('[data-k="clearpick"]').addEventListener('click', () => JW.send({ t: 'jwStaff', a: 'clear', r: S.room.id, pick: 1 }));
    b.querySelector('[data-k="close"]').addEventListener('click', () => JW.send({ t: 'jwStaff', a: 'clear', r: S.room.id, close: 1, rename: 1 }));
    JW.send({ t: 'jwStaff', a: 'reports' });
  }
  function staffList(m) {
    const L = S.pane.querySelector('.jw-staffl'); if (!L) return;
    L.innerHTML = (m.list.map(r => `<div class="jw-rep"><b>${esc(r.by)}</b> reported <b>${esc(r.who)}</b> in ${esc(r.rn)} <small>${new Date(r.ts).toLocaleString('en-GB')}</small><p>${esc(r.why)}</p><pre>${r.log.map(l => esc(`${l.n}: ${l.s}`)).join('\n')}</pre><button type="button" class="btn" data-mute="${esc(r.who)}">Mute ${esc(r.who)} 1 hour</button> <button type="button" class="btn" data-go="${esc(r.room)}">Go there</button> <button type="button" class="btn" data-dis="${r.ts}">Done</button></div>`).join('') || '<p>No reports. Hooray!</p>') + (m.mutes.length ? `<h4>Muted</h4>${m.mutes.map(([k, u]) => `<div>${esc(k.replace(/^m:/, ''))} until ${new Date(u).toLocaleTimeString('en-GB')} <button type="button" class="btn" data-unmute="${esc(k.replace(/^m:/, ''))}">Unmute</button></div>`).join('')}` : '');
    L.querySelectorAll('[data-mute]').forEach(x => x.addEventListener('click', () => JW.send({ t: 'jwStaff', a: 'mute', name: x.dataset.mute, mins: 60 })));
    L.querySelectorAll('[data-unmute]').forEach(x => x.addEventListener('click', () => JW.send({ t: 'jwStaff', a: 'unmute', name: x.dataset.unmute })));
    L.querySelectorAll('[data-go]').forEach(x => x.addEventListener('click', () => goRoom(x.dataset.go)));
    L.querySelectorAll('[data-dis]').forEach(x => x.addEventListener('click', () => JW.send({ t: 'jwStaff', a: 'dismiss', ts: +x.dataset.dis })));
  }

  // ================================================================ the games' heads-up displays
  function gameHud() {
    const g = S.game, el = S.hud;
    if (!g || !S.room || !S.room.pub) { el.hidden = true; return; }
    const left = () => Math.max(0, Math.ceil((g.t - g.now) / 1000 - (now() - g.rt) / 1000));
    el.hidden = false; el.className = 'jw-hud jw-hud-' + g.k;
    if (g.k === 'quiz') {
      if (g.ph === 'idle') el.innerHTML = `<b>QUIZ BOOTH</b><span>Eight questions. Stand on the pad of your answer!</span><button type="button" class="btn jw-ok" data-g="start">START THE QUIZ</button>`;
      else if (g.ph === 'q' || g.ph === 'reveal') el.innerHTML = `<b>QUESTION ${g.n} OF ${g.of}</b><span class="jw-q">${esc(g.q[0])}</span><div class="jw-ans">${g.q[1].map((a, i) => `<span class="p${i}${g.ph === 'reveal' && i === g.ans ? ' right' : ''}${g.ph === 'reveal' && i !== g.ans ? ' wrong' : ''}"><i>${'ABCD'[i]}</i>${esc(a)}</span>`).join('')}</div><span class="jw-time" data-tl>${g.ph === 'q' ? 'Get on a pad! ' + left() + 's' : 'The answer was ' + 'ABCD'[g.ans] + '!'}</span>${scores(g.sc)}`;
      else if (g.ph === 'end') { el.innerHTML = `<b>QUIZ OVER!</b><span>${g.res && g.res.win ? `${esc(g.res.win)} wins with ${g.res.p} right!` : 'Nobody got any right!'}</span>${payLine(g)}${scores(g.sc)}`; if (g.res && g.res.win && g.res.win === (Net.me && Net.me.nick)) A.secret('jw.quiz'); }
    } else if (g.k === 'chairs') {
      const me = g.pl && g.pl.find(p => p.id === myId());
      if (g.ph === 'idle') el.innerHTML = `<b>MUSICAL CHAIRS</b><span>When the music stops, RUN to a chair!</span><button type="button" class="btn jw-ok" data-g="start">PLAY</button>`;
      else if (g.ph === 'lobby') el.innerHTML = `<b>MUSICAL CHAIRS</b><span>Starting in <b data-tl>${left()}</b>s... ${g.pl.length} playing</span>${me ? '<span>You\'re in!</span>' : '<button type="button" class="btn jw-ok" data-g="join">JOIN</button>'}`;
      else {
        const msg = { music: '&#9835; Dance about! Don\'t touch the chairs!', scram: 'THE MUSIC STOPPED! GET A CHAIR!', result: g.res && g.res.outs && g.res.outs.length ? `Out: ${g.res.outs.map(esc).join(', ')}` : 'Everybody sat down!', end: g.res && g.res.win ? `${esc(g.res.win)} WINS!` : 'Game over!' }[g.ph] || '';
        el.innerHTML = `<b>MUSICAL CHAIRS &middot; ROUND ${g.round}</b><span class="jw-big${g.ph === 'scram' ? ' flash' : ''}">${msg}</span><span>${g.pl.filter(p => !p.out).length} left${me ? me.out ? ' (you\'re out: cheer them on!)' : ' (you\'re still in!)' : ''}</span>${g.ph === 'end' ? payLine(g) : ''}`;
        if (g.ph === 'end' && g.res && g.res.winId === myId()) A.secret('jw.chairs');
        if (g.ph === 'scram') sfx('uhoh');
      }
    } else if (g.k === 'snow') {
      const me = g.sc && g.sc.find(s => s.id === myId());
      if (g.ph === 'play') el.innerHTML = `<b>SNOWBALL FIGHT</b><span data-tl>${left()}s left</span><span class="jw-balls">Snowballs: ${'&#9679;'.repeat(S.myBalls | 0)}${'&#9675;'.repeat(5 - (S.myBalls | 0))}</span><div class="jw-row"><button type="button" class="btn jw-ok" data-g="make">Make a snowball</button></div><small>Click somebody to throw one at them!</small>${scores(g.sc)}`;
      else if (g.ph === 'end') el.innerHTML = `<b>SNOWBALL FIGHT OVER!</b><span>${g.res && g.res.win ? `${esc(g.res.win)} wins with ${g.res.p} hits!` : 'Nobody hit anybody!'}</span>${payLine(g)}${scores(g.sc)}`;
      else el.innerHTML = `<b>SNOWBALL FIGHT</b><span>Starting soon...</span>`;
    }
    el.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => { if (!Net.connected) return; JW.send({ t: 'jwGame', a: b.dataset.g }); sfx('click'); }));
    clearInterval(S.hudT); S.hudT = setInterval(() => { if (!S || !S.game) return clearInterval(S && S.hudT); const tl = S.hud.querySelector('[data-tl]'); if (tl) { const n = left(); if (g.k === 'quiz' && g.ph === 'q') tl.textContent = 'Get on a pad! ' + n + 's'; else if (g.k === 'snow' && g.ph === 'play') tl.textContent = n + 's left'; else if (g.k === 'chairs' && g.ph === 'lobby') tl.textContent = n; } }, 500);
  }
  function scores(sc) { if (!sc || !sc.length) return ''; return `<ol class="jw-sc">${sc.slice(0, 5).map(s => `<li${s.id === myId() ? ' class="me"' : ''}>${esc(s.n)} <b>${s.p}</b></li>`).join('')}</ol>`; }
  function payLine(g) { const amt = g.res && g.res.pays && g.res.pays[myId()]; return amt ? `<span class="jw-pay">+${rp(amt)}!</span>` : member() ? '' : '<span class="jw-dim">(Members win Rupees!)</span>'; }

  window.JWWorld = { open, get S() { return S; }, _dbg: () => S && { room: S.room && S.room.id, av: S.av.size, z: S.cam.z, game: S.game && S.game.ph, panel: S.panel } };
})();

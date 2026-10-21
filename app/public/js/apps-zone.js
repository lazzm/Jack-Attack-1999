/* apps-zone: the JackNet Gaming Zone, a 1999 online games lobby for JackOS 98.
 * This always-loaded part registers the program, the Start menu, desktop icon, Run commands, files, secrets and the
 * invite listener (so invites pop up even when the lobby is closed). The lobby, the games and the computer players
 * are lazy-loaded from js/zone-core.js and js/zone-games.js the first time they're needed. */
(function () {
  'use strict';
  if (!window.Apps || !window.Net) return;
  const Z = window.Zone = window.Zone || {};
  const esc = Apps.esc, store = Apps.store;
  const secret = id => { try { Apps.secret(id); } catch (e) {} };
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };
  Z.secret = secret; Z.sfx = sfx;

  // ================================================================ games, rooms and levels
  Z.LEVELS = ['Beginner', 'Intermediate', 'Expert'];
  Z.META = {
    reversi: { name: 'Reversi', rooms: ['The Kiddie Pool', 'Flip City', 'Corner Kings'] },
    checkers: { name: 'Checkers', rooms: ['Draughty Hall', 'King Me Club', 'The Grandmasters'] },
    c4: { name: 'Connect Four', rooms: ['Drop Zone', 'Four Play Cafe', 'Diagonal Alley'] },
    ships: { name: 'Battleships', rooms: ['Paddling Pool', 'Pirate Cove', 'Admiral\'s Table'] },
    ttt: { name: 'Noughts & Crosses', rooms: ['Back of the Maths Book', 'Wet Playtime', 'Unbeatables'] },
    gomoku: { name: 'Five in a Row', rooms: ['Graph Paper Gang', 'Five Alive', 'Gomoku Dojo'] },
    dots: { name: 'Dots and Boxes', rooms: ['Doodle Corner', 'Box Office', 'Chain Gang'] },
    bg: { name: 'Backgammon', rooms: ['The Tea Room', 'Pip Counters', 'High Rollers (no money!)'] },
    pong: { name: 'Saber Pong', rooms: ['Pod Race Lounge', 'Padawan Hangar', 'Dark Side Arena'] },
    chess: { name: 'Chess', rooms: ['Pawn Shop', 'The Knight Club', 'Deep Jack\'s Den'] },
  };
  Z.CPU = ['Gubbinz (CPU)', "Dave's Dad's 486 (CPU)", 'DEEP JACK 2000 (CPU)'];
  Z.CPU_R = [900, 1300, 1800];
  Z.QUICK = ['Hi all!', 'Anyone want a game?', 'Good luck!', 'Nice move!', 'Oops!', 'Thinking...', 'Hurry up please', 'Lag!!!',
    'Brb, Mom wants me', 'Brb, Mom needs the phone line', 'lol', 'gg', 'gg wp', 'Rematch?', 'Thanks for the game', 'That was close!',
    'Saw Episode I three times!!', 'Pod racing > homework', 'Jedi mind tricks don\'t work on me', 'Darth Maul is the coolest', 'Booyah!', 'Bye!'];

  // ================================================================ icons (hand-drawn, chunky, 1999)
  const S = s => `<svg viewBox="0 0 16 16" shape-rendering="crispEdges">${s}</svg>`;
  const I = Z.ICON = {
    zone32: '<svg viewBox="0 0 32 32"><circle cx="15" cy="13" r="11" fill="#2a6ad8" stroke="#00205a"/><path d="M6 9c4 2 6-1 9 1s3 5 7 3M5 16c3-1 5 2 8 1M15 2c-4 5-4 17 0 22M15 2c4 5 4 17 0 22M4 13h22" fill="none" stroke="#9fd0ff"/><path d="M8 7l3 1 1 3-2 2-3-1zM17 14l4-1 2 3-3 3-3-1z" fill="#3aa83a"/><rect x="17" y="21" width="12" height="6" fill="#222" stroke="#000"/><rect x="22" y="14" width="2" height="8" fill="#666" stroke="#000" stroke-width=".5"/><circle cx="23" cy="13" r="2.6" fill="#e01010" stroke="#600"/><circle cx="19.5" cy="24" r="1.2" fill="#ffd400"/><rect x="2" y="26" width="13" height="4" fill="#ffd400" stroke="#7a5a00"/><path d="M4 28h9" stroke="#7a5a00"/></svg>',
    zone16: S('<rect x="1" y="1" width="14" height="14" fill="#2a6ad8"/><path d="M1 6h14M1 10h14M5 1v14M11 1v14" stroke="#9fd0ff"/><rect x="8" y="10" width="7" height="5" fill="#222"/><rect x="11" y="5" width="1" height="5" fill="#000"/><rect x="10" y="3" width="3" height="3" fill="#e01010"/>'),
    reversi: S('<rect x="0" y="0" width="16" height="16" fill="#17803d"/><path d="M8 0v16M0 8h16" stroke="#0b4a22"/><circle cx="4" cy="4" r="3" fill="#111"/><circle cx="12" cy="4" r="3" fill="#eee" stroke="#888"/><circle cx="4" cy="12" r="3" fill="#eee" stroke="#888"/><circle cx="12" cy="12" r="3" fill="#111"/>'),
    checkers: S('<rect width="16" height="16" fill="#e9dcb4"/><path d="M0 0h4v4H0zM8 0h4v4H8zM4 4h4v4H4zM12 4h4v4h-4zM0 8h4v4H0zM8 8h4v4H8zM4 12h4v4H4zM12 12h4v4h-4z" fill="#2f6b3a"/><circle cx="6" cy="10" r="3.5" fill="#222" stroke="#000"/><circle cx="10" cy="6" r="3.5" fill="#efe6cf" stroke="#8a7a50"/>'),
    c4: S('<rect x="0" y="2" width="16" height="13" fill="#1e48c8"/><circle cx="3.5" cy="5.5" r="1.8" fill="#fff"/><circle cx="8" cy="5.5" r="1.8" fill="#fff"/><circle cx="12.5" cy="5.5" r="1.8" fill="#ffd400"/><circle cx="3.5" cy="11" r="1.8" fill="#e01010"/><circle cx="8" cy="11" r="1.8" fill="#ffd400"/><circle cx="12.5" cy="11" r="1.8" fill="#e01010"/>'),
    ships: S('<rect width="16" height="16" fill="#0f3b7a"/><path d="M0 12c2-1 3 1 5 0s3 1 5 0 3 1 6 0v4H0z" fill="#2a6ad8"/><path d="M2 9h12l-2 3H4z" fill="#8a8f98" stroke="#222" stroke-width=".6"/><rect x="6" y="5" width="4" height="4" fill="#8a8f98" stroke="#222" stroke-width=".6"/><rect x="7" y="2" width="1" height="3" fill="#222"/><circle cx="12" cy="3" r="2" fill="#ff3a00"/>'),
    ttt: S('<rect width="16" height="16" fill="#fbfbf2" stroke="#999"/><path d="M5.5 1v14M10.5 1v14M1 5.5h14M1 10.5h14" stroke="#222"/><path d="M1.5 1.5l3 3M4.5 1.5l-3 3M11.5 11.5l3 3M14.5 11.5l-3 3" stroke="#1a3cc8" stroke-width="1.2"/><circle cx="8" cy="8" r="1.6" fill="none" stroke="#d01818" stroke-width="1.2"/>'),
    gomoku: S('<rect width="16" height="16" fill="#fbfbf2" stroke="#999"/><path d="M0 4h16M0 8h16M0 12h16M4 0v16M8 0v16M12 0v16" stroke="#aac"/><path d="M1 13l2 2M3 13l-2 2M5 9l2 2M7 9l-2 2M9 5l2 2M11 5l-2 2M13 1l2 2M15 1l-2 2" stroke="#1a3cc8"/>'),
    dots: S('<rect width="16" height="16" fill="#fbfbf2" stroke="#999"/><rect x="3" y="3" width="5" height="5" fill="#c8d0f8"/><path d="M3 3h5v5H3zM8 8h5" fill="none" stroke="#1a3cc8" stroke-width="1.2"/><path d="M8 3v5M3 8v5" stroke="#d01818" stroke-width="1.2"/><path d="M2 2h2v2H2zM7 2h2v2H7zM12 2h2v2h-2zM2 7h2v2H2zM7 7h2v2H7zM12 7h2v2h-2zM2 12h2v2H2zM7 12h2v2H7zM12 12h2v2h-2z" fill="#111"/>'),
    bg: S('<rect width="16" height="16" fill="#5a3414"/><rect x="1" y="1" width="14" height="14" fill="#2f6b3a"/><path d="M1 1l1.5 6L4 1zM6 1l1.5 6L9 1zM10 15l1.5-6 1.5 6zM5 15l1.5-6L8 15z" fill="#c8402a"/><path d="M3.5 1L5 6 6.5 1zM12 1l1.5 5L15 1z" fill="#efe0b8"/><circle cx="12" cy="12" r="2" fill="#f4ead2" stroke="#000" stroke-width=".5"/>'),
    pong: S('<rect width="16" height="16" fill="#050818"/><rect x="2" y="3" width="2" height="7" fill="#2a8cff"/><rect x="2" y="10" width="2" height="2" fill="#999"/><rect x="12" y="6" width="2" height="7" fill="#ff2a2a"/><rect x="12" y="13" width="2" height="2" fill="#999"/><circle cx="8" cy="7" r="1.6" fill="#c8ffc8"/><rect x="6" y="12" width="1" height="1" fill="#fff"/><rect x="9" y="2" width="1" height="1" fill="#fff"/>'),
  };
  // the official JackOS 98 icons (icons.js) where they're the specific match
  I.chess = S('<rect width="16" height="16" fill="#ecd3a4"/><path d="M0 0h4v4H0zM8 0h4v4H8zM4 4h4v4H4zM12 4h4v4h-4zM0 8h4v4H0zM8 8h4v4H8zM4 12h4v4H4zM12 12h4v4h-4z" fill="#a8703f"/><path d="M4 14h8v-2l-1-1V7l1-1-2-2H6L4 6l1 1v4l-1 1z" fill="#fffbea" stroke="#000" stroke-width=".8"/><rect x="7" y="2" width="2" height="2" fill="#000"/>');
  if (window.JICON) Object.assign(I, { zone32: JICON.get('zone', 32), zone16: JICON.get('zone', 16), reversi: JICON.get('reversi', 16) });

  // ================================================================ secrets
  [['zone.logon', 'Pull up a chair', 'Sit down at a table in the Zone'],
    ['zone.firstwin', 'First online victory', 'Beat a real person over the Internet'],
    ['zone.nemesis', 'Nemesis', 'Beat the same person five times'],
    ['zone.spectate', 'Kibitzer', 'Watch somebody else\'s game'],
    ['zone.rematch', 'Best of three?', 'Ask for (and get) a rematch'],
    ['zone.forfeit', 'They ran away!', 'Win a game because your opponent legged it'],
    ['zone.timeout', 'Asleep at the keyboard', 'Let your turn timer run out'],
    ['zone.mom', 'Brb, Mom wants me', 'Every online gamer in 1999 has said it'],
    ['zone.cpuexpert', 'Silicon slayer', 'Beat the toughest computer player in the Zone'],
    ['zone.eclipse', 'Total eclipse', 'Finish a game of Reversi with 50 discs or more'],
    ['zone.triple', 'Triple jump', 'Take three pieces in one move at Checkers'],
    ['zone.diagonal', 'Sideways thinking', 'Win Connect Four with a diagonal'],
    ['zone.flawless', 'Unsinkable', 'Win Battleships without losing a single ship'],
    ['zone.stalemate', 'The only winning move', 'Draw five games of Noughts & Crosses against the toughest computer'],
    ['zone.hoarder', 'Box hoarder', 'Grab six boxes in one go'],
    ['zone.gammon', 'Gammon!', 'Win Backgammon before your opponent bears off a single checker'],
    ['zone.shutout', 'A disturbance in the score', 'Win Saber Pong without letting a single point in'],
    ['zone.allgames', 'Zone completionist', 'Play every game in the Zone at least once'],
    ['zone.chatty', 'Chatterbox', 'Say a lot in the lobby'],
    ['zone.ladder', 'Top of the ladder', 'Be number one on the Zone ladder'],
    ['zone.ping', 'Lag-o-meter', 'Measure your lag the old-fashioned way'],
    ['zone.dave', 'Dave\'s "cheat codes"', 'Dave swears there are cheats for the Zone. He wrote them down.'],
    ['zone.homepage', 'www.jacknetzone.jnet', 'The Zone has its own web site'],
    ['zone.splash', 'Patience of a Jedi', 'Sit through a whole intro without skipping it'],
    ['zone.plugin', 'Plugged in', 'Download a plug-in you already have'],
    ['zone.signup', 'Signed up', 'Give yourself a Zone face and a motto'],
    ['zone.cup', 'Cup runneth over', 'Enter this week\'s tournament'],
    ['zone.cupwin', 'Champion of the week', 'Win a whole tournament'],
    ['zone.shame', 'Name and shame', 'Find out who has been very naughty in the Zone'],
    ['zone.arcade', 'Insert coin', 'Play a Java game in the Zone\'s arcade room'],
    ['zone.profile', 'Look at me!', 'Look yourself up'],
    ['zone.news', 'Old news', 'Read the Zone\'s news archive'],
    ['zone.ad', 'Click here!!!', 'Fall for a banner advert'],
    ['zone.faq', 'Frequently asked accusations', 'Ask the FAQ about a certain someone\'s honesty'],
    ['zone.ignore', 'Do not disturb', 'Tell the Zone you don\'t want any invitations'],
  ].forEach(s => Apps.defineSecret(...s));

  // ================================================================ who's online (shared with the lazy-loaded lobby)
  Z.online = []; const onlineFns = [];
  Z.onOnline = fn => onlineFns.push(fn);
  const setOnline = list => { Z.online = Array.isArray(list) ? list : []; onlineFns.forEach(fn => { try { fn(Z.online); } catch (e) { console.error(e); } }); };
  Net.on('welcome', m => { if (m.online) setOnline(m.online); });
  Net.on('online', m => setOnline(m.online));
  Z.isOnline = id => Z.online.some(o => o.id === id);
  Z.nickOf = id => { const o = Z.online.find(x => x.id === id); return o ? o.nick : ''; };

  // relay with a client-side token bucket (the server allows ~12/s) so a burst never gets dropped
  let tokens = 16, lastFill = performance.now(), rq = [], rqTimer = 0;
  function flush() {
    const t = performance.now(); tokens = Math.min(16, tokens + (t - lastFill) / 1000 * 11); lastFill = t;
    while (rq.length && tokens >= 1) { tokens--; const [to, ch, d] = rq.shift(); Net.relay(to, ch, d); }
    if (rq.length && !rqTimer) rqTimer = setTimeout(() => { rqTimer = 0; flush(); }, 120);
    if (rq.length > 120) rq.splice(0, rq.length - 120);
  }
  Z.relay = (to, ch, d) => { if (!Net.connected) return false; rq.push([to, ch, d]); flush(); return true; };
  Z.rid = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  Z.okId = v => typeof v === 'string' && /^[a-z0-9]{4,12}$/.test(v);
  Z.opts = Object.assign({ hints: true, noinv: false, chatSnd: true }, store.get('jhp_zone_opts', {}));
  Z.saveOpts = () => store.set('jhp_zone_opts', Z.opts);
  Z.busy = () => false; // the lobby replaces this: true while you're in an online game

  // lazy-load the lobby and the games
  Z.boot = () => (Z._boot = Z._boot || Apps.load('js/games-chess.js').catch(() => {}).then(() => Apps.load('js/zone-games.js')).then(() => Apps.load('js/zone-core.js')).then(() => Apps.load('js/zone-site.js')).catch(e => { Z._boot = null; throw e; }));
  // a reload in the middle of an online game: load the Zone straight away so zone-core can re-open the board (resumeSaved)
  { const lv = store.get('jhp_zone_live', null); if (lv && typeof lv === 'object' && Date.now() - (lv.ts || 0) < 170000) Net.on('welcome', () => { if (!Z._boot) Z.boot().catch(() => {}); }); }

  // ================================================================ invitations (work even when the lobby is shut)
  const INV = Z.INV = { out: null, inbox: new Map(), accepted: new Map() };
  const gname = g => (Z.META[g] || {}).name || g;
  Net.onRelay('zone.inv', (d, m) => {
    if (!d || typeof d !== 'object' || typeof d.k !== 'string' || !Z.okId(d.iid) || !m || !m.fromId) return;
    const from = String(m.from || 'Someone').slice(0, 24);
    if (d.k === 'inv') {
      if (!Z.META[d.g] || !(d.lv === 0 || d.lv === 1 || d.lv === 2)) return;
      if (INV.inbox.size >= 3 || [...INV.inbox.values()].some(x => x.fromId === m.fromId)) return Z.relay(m.fromId, 'zone.inv', { k: 'dec', iid: d.iid, why: 'busy' });
      if (Z.opts.noinv) return Z.relay(m.fromId, 'zone.inv', { k: 'dec', iid: d.iid, why: 'noinv' });
      if (Z.busy()) { Desk.toast('JackNet Zone', `${from} wanted to play ${gname(d.g)}, but you're busy in a game.`, 5000); return Z.relay(m.fromId, 'zone.inv', { k: 'dec', iid: d.iid, why: 'busy' }); }
      const entry = { fromId: m.fromId, from, g: d.g, lv: d.lv, iid: d.iid, dlg: null, timer: 0 };
      INV.inbox.set(d.iid, entry);
      const answer = (yes, why) => {
        if (!INV.inbox.has(d.iid)) return; INV.inbox.delete(d.iid); clearTimeout(entry.timer);
        if (entry.dlg) { try { entry.dlg.close(); } catch (e) {} }
        if (!yes) return Z.relay(m.fromId, 'zone.inv', { k: 'dec', iid: d.iid, why: why || 'no' });
        Desk.toast('JackNet Zone', 'Connecting to the game...', 2500);
        Z.boot().then(() => { INV.accepted.set(m.fromId, { g: d.g, lv: d.lv, iid: d.iid, ts: Date.now() }); Z.relay(m.fromId, 'zone.inv', { k: 'acc', iid: d.iid }); })
          .catch(() => { Z.relay(m.fromId, 'zone.inv', { k: 'dec', iid: d.iid, why: 'error' }); Desk.msgbox('JackNet Zone', 'Could not download the game. Check your modem is plugged in and try again.', 'warn'); });
      };
      entry.dlg = Desk.msgbox('JackNet Gaming Zone', `${from} has invited you to play ${gname(d.g)} (${Z.LEVELS[d.lv]}).\n\nDo you want to play?`, 'q', [['Accept', () => answer(true)], ['Decline', () => answer(false)]]);
      try { entry.dlg.el.classList.add('zone-invdlg'); const x = entry.dlg.el.querySelector('.tb button'); if (x) x.addEventListener('click', () => answer(false), true); } catch (e) {}
      Desk.toast('JackNet Zone', `${from} wants to play ${gname(d.g)} with you!`, 6000);
      sfx('join');
      entry.timer = setTimeout(() => answer(false, 'timeout'), 30000);
      return;
    }
    if (d.k === 'can') { const e = INV.inbox.get(d.iid); if (e && e.fromId === m.fromId) { INV.inbox.delete(d.iid); clearTimeout(e.timer); try { e.dlg.close(); } catch (er) {} Desk.toast('JackNet Zone', `${from} cancelled the invitation.`, 3500); } return; }
    const o = INV.out; if (!o || o.iid !== d.iid || o.to !== m.fromId) return;
    if (d.k === 'acc') { INV.out = null; clearTimeout(o.timer); try { o.dlg.close(); } catch (e) {} o.cb(true); }
    if (d.k === 'dec') {
      INV.out = null; clearTimeout(o.timer); try { o.dlg.close(); } catch (e) {}
      const why = { busy: 'is busy playing something else', noinv: 'has invitations switched off', timeout: 'didn\'t answer (probably gone for their tea)', error: 'had a modem problem' }[d.why] || 'said no thanks';
      Desk.msgbox('JackNet Gaming Zone', `${from} ${why}.`, 'info');
      o.cb(false);
    }
  });
  // send an invite; cb(true) once they accept
  Z.invite = (peer, g, lv, cb) => {
    if (!Net.connected) return Desk.msgbox('JackNet Gaming Zone', 'You are not connected to JackNet. (Is somebody on the phone?)', 'warn');
    if (INV.out) return Desk.msgbox('JackNet Gaming Zone', 'You are already waiting for somebody to answer an invitation.', 'info');
    if (Z.busy()) return Desk.msgbox('JackNet Gaming Zone', 'Finish (or leave) your current game first!', 'info');
    const iid = Z.rid(), o = { iid, to: peer.id, g, lv, cb, timer: 0, dlg: null };
    INV.out = o;
    Z.relay(peer.id, 'zone.inv', { k: 'inv', iid, g, lv });
    const cancel = () => { if (INV.out !== o) return; INV.out = null; clearTimeout(o.timer); Z.relay(peer.id, 'zone.inv', { k: 'can', iid }); };
    o.dlg = Desk.msgbox('JackNet Gaming Zone', `Inviting ${peer.nick} to play ${gname(g)} (${Z.LEVELS[lv]})...\n\nWaiting for an answer.`, 'info', [['Cancel', cancel]]);
    try { const x = o.dlg.el.querySelector('.tb button'); if (x) x.addEventListener('click', cancel, true); } catch (e) {}
    o.timer = setTimeout(() => { if (INV.out !== o) return; cancel(); try { o.dlg.close(); } catch (e) {} Desk.msgbox('JackNet Gaming Zone', `No answer from ${peer.nick}. Maybe they've gone for their tea.`, 'info'); }, 35000);
    secret('zone.logon');
  };

  // ================================================================ the web site: http://www.jacknetzone.jnet/
  // The lobby, tables, ladders and chat are web pages inside JackNet Explorer. Sitting down or accepting an invite opens
  // the "Zone game client" as its own desktop window, like the real 1999 gaming zones.
  const HOST = 'www.jacknetzone.jnet', SITE_RE = /^site:(www\.)?jacknetzone\.jnet(\/.*)?$/i;
  Z.HOST = HOST;
  Z.goSite = path => { const br = document.getElementById('browser'); if (br) { br.classList.remove('min'); br.style.display = ''; } if (window.IE) IE.navigate('http://' + HOST + (path || '/')); };
  const PAGES = Z.sitePages = {};
  const T = t => 'JackNet Gaming Zone' + (t ? ' - ' + t : '');
  function page(path, title) {
    PAGES[path] = { title: T(title), path, html: () => {
      const el = document.createElement('div'); el.className = 'jz jz-loading';
      el.innerHTML = '<div class="jz-loadmsg">Connecting to the Zone... <span class="jz-blink">_</span></div>';
      const go = () => { el.classList.remove('jz-loading'); Z.site.render(path, el); };
      if (Z.site) go(); else Z.boot().then(() => { if (el.isConnected || true) go(); }).catch(() => { el.innerHTML = '<div class="jz-loadmsg">The Zone server is not answering. Try Refresh. (Mom might be on the phone.)</div>'; });
      return el;
    } };
    if (window.IE && IE.addPage) IE.addPage('jacknetzone.jnet' + path, T(title), () => { const el = document.createElement('div'); setTimeout(() => Z.goSite(path), 0); return el; }); // Back/Forward safety net
  }
  Z.sitePage = page;
  page('/', 'ENTER THE ZONE'); page('/home.html', 'Home'); page('/lobby.html', 'Main Lobby'); page('/games.html', 'Games'); page('/games/', 'Games');
  Object.keys(Z.META).forEach(g => { page(`/games/${g}.html`, Z.META[g].name); for (let lv = 0; lv < 3; lv++) page(`/rooms/${g}-${lv}.html`, `${Z.META[g].name}: ${Z.META[g].rooms[lv]}`); });
  [['/arcade.html', 'Java Arcade'], ['/ladders.html', 'Ladders'], ['/halloffame.html', 'Hall of Fame'], ['/shame.html', 'Wall of Shame'], ['/tournaments.html', 'Tournaments'],
    ['/chat.html', 'Lobby Chat'], ['/help.html', 'Help & FAQ'], ['/plugin.html', 'Download the Zone Plug-in'], ['/signup.html', 'Sign Up'], ['/news.html', 'News'], ['/multiplayer.html', 'Multiplayer']].forEach(([p, t]) => page(p, t));
  Z.profilePage = f => { const p = `/profile/${f}.html`; if (!PAGES[p]) page(p, 'Player Profile'); return 'http://' + HOST + p; };
  if (window.IE && IE.addSite) IE.addSite(HOST, { title: T(), pages: PAGES });

  // arriving and leaving the site: the Zone has its own look, so the magazine's banner and menu step aside
  let onZone = false, zBack = [], zFwd = [], zCur = null, zInternal = false;
  document.addEventListener('section', e => {
    const d = String(e.detail || ''), m = SITE_RE.exec(d);
    const was = onZone; onZone = !!m;
    document.body.classList.toggle('jz-site', onZone);
    if (onZone) {
      const path = (m[2] || '/').toLowerCase();
      if (zInternal) zInternal = false; else if (zCur && zCur !== path) { zBack.push(zCur); if (zBack.length > 60) zBack.shift(); zFwd = []; }
      zCur = path;
      if (Z.enterSite) Z.enterSite();
      secret('zone.homepage');
    } else {
      zBack = []; zFwd = []; zCur = null;
      if (was && Z.leaveSite) Z.leaveSite();
    }
    if (Z.siteSection) Z.siteSection(onZone);
  });
  const zStep = back => {
    if (!onZone || window.IE && IE.current !== 'secret') return false;
    const st = back ? zBack : zFwd; if (!st.length) return false;
    (back ? zFwd : zBack).push(zCur); zInternal = true; Z.goSite(st.pop()); return true;
  };
  window.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('#navBack, #navFwd'); if (!b) return;
    if (zStep(b.id === 'navBack')) { ev.stopImmediatePropagation(); ev.preventDefault(); }
  }, true);
  window.addEventListener('keydown', ev => { if (ev.altKey && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && zStep(ev.key === 'ArrowLeft')) { ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);
  // any element with data-jz="/path" (e.g. the GO TO THE ZONE banner on Jack Attack's Games page) jumps to the Zone
  document.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('[data-jz]'); if (!a) return; ev.preventDefault(); Z.goSite(a.getAttribute('data-jz') || '/'); });
  // the arcade's shared high scores arrive at start-up, before the Zone's pages have loaded
  Z.arcScores = {};
  Net.on('welcome', m => { if (m.scores && typeof m.scores === 'object') Z.arcScores = m.scores; });
  Net.on('scores', m => { if (m && typeof m.g === 'string') { Z.arcScores[m.g] = m.list; if (Z.changed) Z.changed(); } });

  // ================================================================ desktop, Start menu, Run: all Internet shortcuts now
  const SHORTCUT = '<path d="M1 21h11v10H1z" fill="#fff" stroke="#000"/><path d="M3 29l6-6M5 23h4v4" stroke="#000" stroke-width="1.6" fill="none"/>';
  I.zoneLnk = I.zone32.replace('</svg>', SHORTCUT + '</svg>');
  Apps.register('zone', { cmd: ['zone', 'zone.exe', 'gamingzone', 'jacknetzone', 'internetgames'], open(arg) { Z.goSite(arg && Z.META[arg] ? `/games/${arg}.html` : typeof arg === 'string' && arg[0] === '/' ? arg : '/'); } });
  Z.openLobby = g => Z.goSite(g && Z.META[g] ? `/games/${g}.html` : '/lobby.html');
  Apps.addProgram(['Games', 'Internet Games', 'JackNet Gaming Zone'], () => Z.goSite('/'), I.zone16);
  Apps.addProgram(['Games', 'Internet Games', 'Zone Java Arcade'], () => Z.goSite('/arcade.html'), I.zone16);
  Object.keys(Z.META).forEach(g => Apps.addProgram(['Games', 'Internet Games', 'Zone ' + Z.META[g].name], () => Z.goSite(`/games/${g}.html`), I[g]));
  Apps.desktopIcon('JackNet Zone', I.zoneLnk, () => Z.goSite('/'), 'iconZone');
  Object.keys(Z.META).forEach(g => Apps.cmd(['zone ' + g, 'zone ' + Z.META[g].name.toLowerCase()], () => Z.goSite(`/games/${g}.html`)));
  Apps.cmd(['zone arcade', 'javaarcade'], () => Z.goSite('/arcade.html'));

  // Run: "ping zone" measures real lag to the JackNet server, then exaggerates it like 1999
  Apps.cmd(['ping zone', 'ping www.jacknetzone.jnet', 'ping jacknet'], () => {
    secret('zone.ping');
    const lines = ['Pinging www.jacknetzone.jnet [10.0.0.56] with 32 bytes of data:', ''];
    const b = document.createElement('div');
    b.innerHTML = '<pre class="zone-ping"></pre><div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn">Close</button></div>';
    const pre = b.querySelector('pre');
    const w = Apps.win('MS-DOS Prompt - PING', b, { w: 460, noMax: true, icon: '<svg viewBox="0 0 16 16"><rect width="16" height="16" fill="#000"/><path d="M2 4l3 3-3 3" stroke="#c0c0c0" fill="none"/><path d="M7 11h6" stroke="#c0c0c0"/></svg>' });
    b.querySelector('.btn').addEventListener('click', w.close);
    const show = () => { pre.textContent = lines.join('\n'); };
    show(); let n = 0; const times = [];
    const one = () => {
      if (w.closed) return;
      if (n >= 4) {
        const mn = Math.min(...times), mx = Math.max(...times), avg = Math.round(times.reduce((a, b2) => a + b2, 0) / times.length);
        lines.push('', 'Ping statistics for 10.0.0.56:', '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),', 'Approximate round trip times in milli-seconds:', `    Minimum = ${mn}ms, Maximum = ${mx}ms, Average = ${avg}ms`, '', avg < 150 ? 'Verdict: LPB (Low Ping Boy). You will win every game of Saber Pong. Probably.' : 'Verdict: HPW (High Ping Wally). Get off the phone, Mom!');
        return show();
      }
      n++; const t0 = performance.now();
      const fin = ok => { const ms = Math.max(1, Math.round(performance.now() - t0)); if (ok) { times.push(ms); lines.push(`Reply from 10.0.0.56: bytes=32 time=${ms}ms TTL=56`); } else { times.push(999); lines.push('Request timed out.'); } show(); setTimeout(one, 700); };
      if (!Net.connected) return setTimeout(() => fin(false), 900);
      Net.kv.get(['zone.played']).then(v => fin(v && 'zone.played' in v));
    };
    setTimeout(one, 300);
  });

  // ================================================================ files on C:
  try {
    const D = 'C:/Program Files/JackNet Zone';
    Apps.fs.add(D, { name: 'ZONE.EXE', type: 'exe', app: 'zone', size: '412 KB', date: '14/05/99' });
    Apps.fs.add(D, { name: 'README.TXT', type: 'txt', size: '2 KB', date: '14/05/99', text: `JACKNET GAMING ZONE v1.9\n========================\n\nPlay FREE games against REAL PEOPLE over the Internet!\n\nGAMES: Reversi, Checkers, Connect Four, Battleships, Noughts & Crosses,\nFive in a Row, Dots and Boxes, Backgammon and Saber Pong (real time!).\n\nHOW TO PLAY\n1. Open the Zone (desktop icon, or Start > Programs > Games > Internet Games).\n2. Pick a game and a room on the left. Beginner, Intermediate or Expert.\n3. Sit down at an empty table. When somebody sits opposite you, the game starts.\n   Or click someone in the People list and press Invite.\n4. Nobody about? Press "Play the Computer". It never has to go for its tea.\n\nWATCHING: tables with a game on have a Watch button. You can't help\neither player. (You CAN shout "nooo" at the screen.)\n\nLADDER: win games to climb the ladder. Your rating starts at 1200.\nBeating someone rated higher than you is worth more.\n\nSYSTEM REQUIREMENTS: 486DX/66 or better, 8 MB RAM, 14.4K modem (28.8K\nrecommended), a phone line nobody else wants for at least 20 minutes.\n` });
    Apps.fs.add(D, { name: 'ETIQUETTE.TXT', type: 'txt', size: '1 KB', date: '14/05/99', text: `ZONE ETIQUETTE (please read, Mom made me write this)\n====================================================\n\n- Say hi when you sit down. Say gg when you finish. Win or lose.\n- Don't leave in the middle of a game just because you're losing.\n  The Zone gives the win to the other person anyway, so there's no point.\n- No swearing. The JackNet Nanny will turn it into stars.\n- Never give out your real name, address, phone number or school.\n  Not even if they say they're Jack. Especially if they say they're Jack.\n- "Brb" means BE RIGHT BACK. Not "be back in an hour after tea".\n- Being rubbish is allowed. Everyone was rubbish once. Except Dave,\n  who says he was born good at Checkers.\n` });
    Apps.fs.add(D, { name: 'ZONE.INI', type: 'txt', size: '1 KB', date: '02/08/99', text: `[Zone]\nServer=www.jacknetzone.jnet\nPort=28800\nModem=56K (connects at 26400 on a good day)\nSound=1\nShowLegalMoves=1\nAutoFlagLag=1\n\n[Ladder]\nStartRating=1200\nKFactor=32\n\n[Rooms]\nPong=Pod Race Lounge\n; Dave renamed this after we queued for Episode I tickets in July.\n; The queue went round the cinema TWICE. Worth it.\n` });
    Apps.fs.add(D, { name: 'LOBBY.LOG', type: 'txt', size: '3 KB', date: '19/10/99', hidden: true, text: `[19:02] *** You have entered the lobby.\n[19:02] <Dave> anyone 4 checkers\n[19:03] <Guest4471> asl\n[19:03] *** JackNet Nanny: Please don't ask people about themselves.\n[19:04] <Dave> jack r u there\n[19:04] <Jack> yeah\n[19:04] <Dave> checkers, expert room, table 1\n[19:05] <Dave> brb mom wants me\n[19:31] <Dave> back\n[19:31] <Jack> that was 26 minutes\n[19:31] <Dave> she wanted me a lot\n[19:40] *** Jack beat Dave at Checkers (no moves left).\n[19:40] <Dave> lag\n[19:40] <Jack> there's no lag in checkers dave\n[19:41] <Dave> mental lag\n` });
    const R = D + '/Rules';
    const rules = {
      'REVERSI.TXT': 'REVERSI\n=======\nPlace a disc so that you trap a line of your opponent\'s discs between\nyour new disc and one you already have. The trapped discs flip to your\ncolour. If you can\'t trap anything, you have to pass. When nobody can\nmove, the player with the most discs wins.\n\nJACK\'S TIP: corners can never be flipped. Get the corners.\nDon\'t go next to a corner unless you have to.',
      'CHECKERS.TXT': 'CHECKERS (English draughts rules)\n=================================\n- Black moves first. Pieces move diagonally forwards on the dark squares.\n- If you can jump an enemy piece, you MUST. If you land where you can jump\n  again, you must keep going.\n- Reach the far side to be crowned a King. Kings move forwards AND backwards\n  (one square at a time, these aren\'t those flying kings from abroad).\n- Getting crowned ends your move.\n- You lose if you have no pieces or no moves left.\n- 40 moves each with no captures and no men moving = a draw.',
      'CONNECT4.TXT': 'CONNECT FOUR\n============\nDrop discs into the columns. First to make four in a row - across, up\nand down or diagonally - wins. Full frame = draw.\n\nDAVE\'S TIP: "always go in the middle". This is actually a good tip.\nDon\'t tell him I said so.',
      'BATTLESH.TXT': 'BATTLESHIPS\n===========\nPlace your five ships: Mega Gunship (5), Battlewagon (4), Kroozer (3),\nSneaky Sub (3) and Patrol Dinghy (2). Then take turns firing at the\nenemy grid. Your computer answers HIT or MISS for you, honestly.\n\nANTI-CHEAT: before the battle each computer seals its fleet with a secret\ncode. Afterwards the fleets are revealed and checked. Nobody can move\ntheir ships mid-game, not even Dave.',
      'NOUGHTS.TXT': 'NOUGHTS & CROSSES and FIVE IN A ROW\n====================================\n3x3: three in a row wins. If you both play properly it\'s ALWAYS a draw.\n15x15: five (or more) in a row wins. Watch out for "open fours":\nthey can\'t be blocked at both ends.',
      'DOTS.TXT': 'DOTS AND BOXES\n==============\nTake turns drawing a line between two dots. Draw the fourth side of a\nbox and you win it AND have another go. Don\'t draw the third side of a\nbox unless you\'re feeling generous.',
      'BACKGAMM.TXT': 'BACKGAMMON\n==========\nRace all 15 of your checkers round the board into your home and bear\nthem off. You move by the dice. Doubles count four times.\n- You can\'t land on a point with 2 or more enemy checkers.\n- Land on a single enemy checker ("a blot") and it goes on the bar.\n- Checkers on the bar must come back in before anything else moves.\n- You must use both dice if you can. If you can only use one, use the\n  bigger one.\n- Win before your opponent bears any off = GAMMON (counts double).\nThere is no doubling cube. Mom says it looks like gambling.',
      'SABRPONG.TXT': 'SABER PONG\n==========\nReal-time space tennis! Knock the little droid past your opponent\'s\nlaser sword. Hit it near the end of the blade to send it off at an angle.\nFirst to 7. Drag on the screen, or use the arrow keys / W and S.\n\nJack and Dave invented this in the queue for Episode I (UK release,\n16 July 1999) using two rolled-up programmes and a crisp packet.',
    };
    Object.keys(rules).forEach(n => Apps.fs.add(R, { name: n, type: 'txt', size: '1 KB', date: '14/05/99', text: rules[n] }));
    Apps.fs.add('C:/My Documents', { name: 'dave zone cheats.txt', type: 'txt', size: '1 KB', date: '23/09/99', secret: 'zone.dave', text: `DAVES ZONE CHEATS (100% REAL!!!)\n================================\n\n1. Reversi: hold down Ctrl+Alt+R while placing a disc and it flips\n   EVERYTHING. (didnt work for me but it works for my cousin)\n\n2. Checkers: if you type KINGME in the chat all your pieces turn into\n   kings. (Jack says this is "not a thing". jack is jealous)\n\n3. Battleships: if you fire at the corners first you always win.\n   I lost 4 times doing this. the corners were EMPTY. they move them.\n\n4. Connect Four: go in the middle. (this one is actually true)\n\n5. Unplug your modem when you're losing and it doesn't count.\n   UPDATE: it does count. it gives them the win. my rating is 1103.\n\n6. Type "ping zone" in Start > Run to see if you are a LPB.\n   (Jack says LPB means Low Ping Boy. I think it means Lucky Pizza Buyer)\n` });
  } catch (e) {}

  // the old address (www.jackattack.jnet/zone) has moved to the Zone's own site
  if (window.IE && IE.addPage) IE.addPage('zone', 'This page has moved', () => {
    const el = document.createElement('div'); el.className = 'wpg wpg-moved';
    el.innerHTML = `<h2>The Zone has moved!</h2><p>The JackNet Gaming Zone now has its very own web site: <a href="http://${HOST}/">http://${HOST}/</a></p><p>Taking you there in 2 seconds. Please update your bookmarks!</p>`;
    setTimeout(() => { if (el.isConnected) Z.goSite('/'); }, 2000);
    return el;
  });
})();

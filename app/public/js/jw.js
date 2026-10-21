/* jw.js: JACKWORLD (the always-loaded part; the world, the web site and the drawings load when first needed).
 *   JackWorld 99            the client program (a download: Setup.product 'jw.client')            js/jw-world.js
 *   www.jackworld.jnet      the web site: news, download, the rare of the week, top rooms, rules  js/jw-web.js
 *   the drawings            isometric pixel art made by code                                     js/jw-art.js
 *   the catalogue           furni, rooms, rares, quiz (shared with the server, mods/jw.js)       js/jw-cat.js
 * Furni is JackLoot (type 'furni'): this file adds it to the loot catalogue and teaches the Treasure Chest to draw it.
 * window.JW: on(type, fn) -> off, emit, send(m), load(name), go(url), me (jwMe), info (jwInfo), open(roomId), ICO, tunes. */
(function () {
  'use strict';
  const A = window.Apps; if (!A || !window.Desk || window.JW) return;
  const esc = A.esc, $ = id => document.getElementById(id);
  const member = () => !!(window.Net && Net.me && Net.me.member);
  const STAMP = ((document.querySelector('script[src*="js/jw.js"]') || {}).src || '').split('?v=')[1] || '1';
  let cssOn = false;
  const css = () => { if (cssOn) return; cssOn = true; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/jw.css?v=' + STAMP; document.head.appendChild(l); };

  // ================================================================ the wire
  const evs = {};
  const emit = (t, d) => (evs[t] || []).slice().forEach(fn => { try { fn(d); } catch (e) { console.error(e); } });
  let me = null, info = null;
  const JW = window.JW = {
    get me() { return me; }, get info() { return info; }, get member() { return member(); },
    on(t, fn) { (evs[t] = evs[t] || []).push(fn); return () => { evs[t] = (evs[t] || []).filter(x => x !== fn); }; },
    emit, esc, css,
    send: m => !!(window.Net && Net.send(m)),
    load(name) { css(); return A.load('js/jw-cat.js').then(() => augment()).then(() => A.load('js/jw-art.js')).then(() => (name ? A.load('js/jw-' + name + '.js') : null)); },
    go(url) { const b = $('browser'); if (b) { b.classList.remove('min'); b.style.zIndex = (window.JZ = (window.JZ || 2400) + 1); } const tb = $('taskBrowser'); if (tb) tb.hidden = false; IE.navigate(url); },
    open(room) { if (window.Setup && Setup.has && !Setup.has(PID)) { Desk.msgbox('JackWorld', 'You need the JackWorld 99 program to go in. It\'s FREE: download it from www.jackworld.jnet!', 'info', [['Get it', () => JW.go('http://www.jackworld.jnet/download.html')], ['Cancel']]); return; } A.open('jw.world', room); },
    rp: n => (window.Econ && Econ.rp ? Econ.rp(n) : `${Math.floor(n)} Rupees`),
  };
  if (window.Net) {
    const T = ['jwRoom', 'jwIn', 'jwOut', 'jwMv', 'jwSay', 'jwEmo', 'jwTp', 'jwAv', 'jwAvOk', 'jwNo', 'jwWait', 'jwRing', 'jwRang', 'jwKicked', 'jwMade', 'jwInfo2', 'jwStyle', 'jwMe2', 'jwBought', 'jwF', 'jwFx', 'jwFs', 'jwBallMv', 'jwJuke', 'jwCarry', 'jwDing',
      'jwNav', 'jwLikes', 'jwGb', 'jwKeys', 'jwReported', 'jwStaff', 'jwReports', 'jwStaffNote', 'jwG', 'jwBall', 'jwHit', 'jwSplat', 'jwBalls', 'jwErr', 'jwRotw'];
    for (const t of T) Net.on(t, m => emit(t, m));
    Net.on('jwMe', m => { me = m; emit('jwMe', m); });
    Net.on('jwInfo', m => { info = m; emit('jwInfo', m); });
    Net.on('jwErr', m => { if (!(evs.jwErr || []).length) Desk.toast('JackWorld', m.msg, 5000); });
    Net.on('jwRotw', m => { Desk.toast('JackWorld', `YOUR ROOM "${m.n}" IS ROOM OF THE WEEK!!! You won 250 Rupees and the Room of the Week Cup.`, 12000); A.secret('jw.rotw'); });
    Net.on('loginOk', () => setTimeout(() => Net.send({ t: 'jwMe' }), 900));
    // a receipt in Outlook Express for every Catalogue order (and a proper certificate for a rare)
    Net.on('jwBought', m => {
      if (!window.Econ || !Econ.mail || !window.JWCat) return;
      const F = JWCat.FURNI[m.id]; if (!F) return;
      const who = (Net.me && Net.me.nick) || 'Member';
      if (m.rare) Econ.mail({ from: 'JackWorld Rares <rares@jackworld.jnet>', subj: `CERTIFICATE: ${F.n} #${m.ser || '?'} of ${F.lim}`, body: `*******************************************\n      JACKWORLD CERTIFICATE OF RARENESS\n*******************************************\n\nThis is to certify that\n\n   ${who}\n\nis the proud owner of\n\n   ${F.n}\n   Number ${m.ser || '?'} of only ${F.lim} ever made\n   (the rare for week ${F.wk} of 1999)\n\nPrice paid: ${JW.rp(m.cost || F.p)}\n\nLook after it. Once this week is over, nobody can buy one from us ever again. If you sell it on JackBay, please pass this certificate on too.\n\nSigned,\nThe JackWorld Crew\nwww.jackworld.jnet` });
      else if ((m.cost || F.p) >= 100) Econ.mail({ from: 'JackWorld Catalogue <catalogue@jackworld.jnet>', subj: `Your JackWorld order: ${F.n}${m.n > 1 ? ' x' + m.n : ''}`, body: `Hello ${who}!\n\nThanks for shopping at the JackWorld Catalogue. Here's your receipt:\n\n   ${F.n}${m.n > 1 ? ' x ' + m.n : ''} ...... ${JW.rp(m.cost || F.p * (m.n || 1))}\n\nIt's waiting for you in My Stuff (and in your Treasure Chest). Open JackWorld 99, go to your room and press My Stuff to put it out.\n\nNo refunds. No returns. No, you can't swap it for a different colour.\n\nThe JackWorld Crew\nwww.jackworld.jnet` });
    });
    Net.on('welcome', () => setTimeout(() => Net.send({ t: 'jwMe' }), 2200));
  }

  // ================================================================ furni in the Treasure Chest (JackLoot)
  let augmented = false;
  function augment() { if (augmented || !window.LootCat || !window.JWCat) return; augmented = true; JWCat.augment(window.LootCat); }
  A.load('js/jw-cat.js').then(() => { if (window.LootCat) augment(); else A.load('js/loot-cat.js').then(augment).catch(() => {}); }).catch(() => {});
  let artHooked = false;
  function hookArt() { // furni pictures for the Treasure Chest, the Trading Post and JackBay
    const LA = window.LootArt; if (!LA || artHooked || !window.JWArt) return;
    artHooked = true;
    const pic0 = LA.pic;
    LA.pic = id => (String(id).startsWith('furni.') && JWCat.FURNI[id] ? `<img class="jw-lootpic" src="${JWArt.thumb(id, 64)}" alt="">` : pic0(id));
    if (window.Loot && Loot.emit) Loot.emit('art');
  }
  const wantArt = () => JW.load().then(hookArt).catch(() => {});
  if (window.Loot) {
    Loot.ready.then(() => { augment(); const h = Loot.me && Loot.me.it && Loot.me.it.some(x => String(x.id).startsWith('furni.')); if (h) wantArt(); });
    Loot.on('me', m => { if (!artHooked && m && m.it && m.it.some(x => String(x.id).startsWith('furni.'))) wantArt(); });
    Loot.on('got', m => { if (!artHooked && m && m.its && m.its.some(x => String(x.id).startsWith('furni.'))) wantArt(); });
  }

  // ================================================================ tunes for jukeboxes and Musical Chairs (original)
  const TUNES = [
    { step: 0.14, lead: [72, 0, 72, 74, 76, 0, 79, 0, 76, 74, 72, 0, 67, 0, 69, 71, 72, 0, 72, 74, 76, 0, 79, 81, 79, 0, 76, 0, 74, 0, 0, 0], bass: [48, 48, 55, 55, 53, 53, 55, 55, 48, 48, 55, 55, 53, 55, 43, 43] },
    { step: 0.12, lead: [69, 72, 76, 72, 69, 72, 76, 79, 77, 74, 69, 74, 77, 74, 72, 71, 69, 72, 76, 81, 79, 76, 72, 76, 74, 71, 67, 71, 74, -1, 0, 0], bass: [45, 45, 52, 52, 50, 50, 50, 50, 45, 45, 52, 52, 43, 43, 50, 50] },
    { step: 0.16, lead: [76, -1, 74, 72, 74, -1, 76, -1, 79, -1, 76, -1, 74, -1, 0, 0, 72, -1, 74, 76, 72, -1, 69, -1, 67, -1, 69, 72, 74, -1, 0, 0], bass: [48, 52, 55, 52, 53, 57, 60, 57, 45, 48, 52, 48, 43, 47, 50, 47] },
    { step: 0.11, lead: [84, 0, 79, 0, 76, 0, 79, 84, 86, 0, 84, 0, 79, 0, 76, 79, 81, 0, 77, 0, 74, 0, 77, 81, 79, 76, 72, 76, 79, -1, 0, 0], bass: [48, 60, 48, 60, 50, 62, 50, 62, 53, 65, 53, 65, 55, 67, 55, 43] },
    { step: 0.15, lead: [67, 71, 74, 79, 78, 74, 71, 74, 76, 72, 69, 72, 74, -1, 71, 67, 64, 67, 71, 76, 74, 71, 67, 71, 69, 66, 62, 66, 67, -1, -1, 0], bass: [43, 43, 47, 47, 45, 45, 48, 48, 40, 40, 43, 43, 38, 38, 43, 43] },
    { step: 0.13, lead: [60, 64, 67, 72, 0, 72, 71, 69, 67, 0, 64, 67, 69, 67, 64, 62, 60, 64, 67, 72, 0, 74, 76, 77, 76, 74, 72, 71, 72, -1, 0, 0], bass: [36, 48, 36, 48, 41, 53, 41, 53, 43, 55, 43, 55, 36, 48, 43, 31] },
  ];
  const TUNE_NAMES = ['Dial Me Up (Club Mix)', 'Pixel Party', 'Rooftop Sunset', 'Hyper Hyper Joypad', 'Friday Feeling', 'Last Bus Home'];
  if (window.Sound && Sound.addTune) TUNES.forEach((t, i) => Sound.addTune('jw' + i, t));
  JW.tunes = TUNE_NAMES;
  let tuneT = 0;
  JW.playTune = (i, ms) => {
    clearTimeout(tuneT); if (!window.Sound || !Sound.music) return;
    if (i < 0 || !Sound.on) { if (Sound.music.playing && Sound.music.playing.startsWith('jw')) Sound.music.stop(); return; }
    Sound.music.play('jw' + (i % TUNES.length)); if (ms) tuneT = setTimeout(() => { if (Sound.music.playing && Sound.music.playing.startsWith('jw')) Sound.music.stop(); }, ms);
  };

  // ================================================================ icons
  const ICO = {
    world: '<svg viewBox="0 0 32 32"><path d="M16 3l13 7v13l-13 7-13-7V10z" fill="#3fa34a" stroke="#000"/><path d="M3 10l13 7 13-7" fill="none" stroke="#000"/><path d="M16 17v13" stroke="#000"/><path d="M16 3l13 7-13 7-13-7z" fill="#7ad06a"/><path d="M16 17v13l-13-7V10z" fill="#2f8a3a"/><path d="M16 17l13-7v13l-13 7z" fill="#1e6e2a"/><rect x="10.6" y="6.6" width="4" height="7" fill="#d8342c" stroke="#000" stroke-width=".6"/><circle cx="12.6" cy="5.4" r="2" fill="#f6d2b0" stroke="#000" stroke-width=".6"/><rect x="17.6" y="7.6" width="4" height="7" fill="#3266d6" stroke="#000" stroke-width=".6"/><circle cx="19.6" cy="6.4" r="2" fill="#a8704a" stroke="#000" stroke-width=".6"/><path d="M22 2h7v4h-4l-2 2v-2h-1z" fill="#fff" stroke="#000" stroke-width=".6"/></svg>',
    site: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#2f80ee" stroke="#000"/><path d="M5 12c4 2 6-2 9 1s-1 7 3 8 6 4 8 0M9 6c2 3 6 1 7 4" fill="none" stroke="#3fa34a" stroke-width="3"/><path d="M16 9l7 4-7 4-7-4z" fill="#ffd400" stroke="#000" stroke-width=".7"/></svg>',
  };
  JW.ICO = ICO;

  // ================================================================ the program (a download)
  const PID = 'jw.client';
  try {
    if (window.Setup && Setup.product) Setup.product(PID, {
      n: 'JackWorld 99', v: '1.0', kb: 3480, lic: 'Freeware', by: 'JackWorld Ltd', cat: 'net', sq: 5, rel: '04/01/99', def: false,
      d: 'A living, breathing chat world! Make a little pixel person, walk round the rooms, chat in speech bubbles, play Musical Chairs, Snowball Fights and the Quiz Booth, and get your OWN ROOM to decorate with furni from the Catalogue. Every Monday there is a brand new limited RARE.',
      note: 'Needs a 56K modem (it works on 28.8, just a bit slower). Pentium 133, 16 MB RAM, 640x480 with 256 colours. Members get their own room for FREE.',
      home: 'http://www.jackworld.jnet/', apps: ['jw.world'], paths: ['JackWorld >'], icons: ['jwIcon'], cmds: ['jackworld', 'jworld', 'jw'],
      launch: 'jw.world', exe: 'JWORLD.EXE', dir: 'JackWorld', ic: 'net', setup: 'jworld99.exe',
    });
  } catch (e) { console.error(e); }
  A.register('jw.world', { single: true, cmd: ['jackworld', 'jworld', 'jw'], open: arg => JW.load('world').then(() => window.JWWorld.open(arg)) });
  A.addProgram(['JackWorld', 'JackWorld 99'], 'jw.world', ICO.world);
  A.addProgram(['JackWorld', 'JackWorld on the Web'], () => JW.go('http://www.jackworld.jnet/'), ICO.site);
  A.desktopIcon('JackWorld', ICO.world, () => A.open('jw.world'), 'jwIcon');
  A.cmd(['jackworld.jnet', 'jackworldweb'], () => JW.go('http://www.jackworld.jnet/'));

  // ================================================================ the web site
  function page(fn) {
    return () => {
      const el = document.createElement('div'); el.className = 'jw-web jw-loading';
      el.innerHTML = '<p style="font:13px \'Courier New\',monospace;padding:18px;margin:0;background:#fff;color:#000;min-height:300px">Contacting www.jackworld.jnet... Host contacted. Waiting for reply...<br>Receiving data at 4.1 KB/sec...</p>';
      JW.load('web').then(() => { const W = window.JWWeb; if (W && W[fn]) { el.classList.remove('jw-loading'); W[fn](el); } })
        .catch(e => { console.error(e); el.innerHTML = '<div style="padding:18px;font:13px Arial,sans-serif;background:#fff;color:#000;min-height:300px"><h2>The page cannot be displayed</h2><p>The JackWorld server is not answering. Click <b>Refresh</b>, or try again later. (Somebody might be on the phone.)</p></div>'; });
      return el;
    };
  }
  const PAGES = { '/': ['home', ''], '/download.html': ['download', 'Download'], '/catalogue.html': ['cat', 'The Catalogue'], '/rares.html': ['rares', 'Rares Archive'], '/rooms.html': ['rooms', 'Top Rooms'],
    '/safety.html': ['safety', 'The JackWorld Way'], '/help.html': ['help', 'Help & FAQ'], '/news.html': ['news', 'News'], '/staff.html': ['staff', 'Staff Only'], '/fansites.html': ['fans', 'Fan Sites'] };
  if (window.IE && IE.addSite) {
    const pages = {}; for (const p in PAGES) pages[p] = { title: 'JackWorld' + (PAGES[p][1] ? ' - ' + PAGES[p][1] : ' - The Chat World Where YOU Live!'), html: page(PAGES[p][0]) };
    IE.addSite('www.jackworld.jnet', { title: 'JackWorld - The Chat World Where YOU Live!', desc: 'Make a pixel person, chat in speech bubbles, play games and decorate your very own room. Free to join! New rares every Monday.', cat: 'kids', pages });
  }

  // a signpost on the JACK ATTACK! home page
  function homeSign() {
    const s = document.querySelector('#s-home .gr-sign ul'); if (!s || s.querySelector('.jw-li')) return;
    const li = document.createElement('li'); li.className = 'jw-li ex-li';
    li.innerHTML = `${ICO.world}<span><a href="http://www.jackworld.jnet/" data-grgo="http://www.jackworld.jnet/">JackWorld 99</a><small>Make a pixel person, chat, play games and get your own room!</small></span>`;
    s.insertBefore(li, s.firstChild);
  }
  document.addEventListener('section', e => { if (String(e.detail || '') === 'home') setTimeout(homeSign, 500); });
  setTimeout(homeSign, 1800);

  // ================================================================ secrets
  [['jw.first', 'Welcome to JackWorld', 'Make a little pixel person and step inside a chat world'],
    ['jw.look', 'New Look', 'Change your look in the Wardrobe'],
    ['jw.home', 'Home Sweet Home', 'Get a room of your own'],
    ['jw.buy', 'Retail Therapy', 'Buy some furni from the Catalogue'],
    ['jw.deco', 'Interior Designer', 'Put ten things out in your room'],
    ['jw.rare', 'Rare Hunter', "Buy a weekly rare before they're gone"],
    ['jw.tour', 'Grand Tour', 'Visit every public room in JackWorld'],
    ['jw.moon', 'One Small Step', 'Some airlocks lead somewhere very quiet'],
    ['jw.snow', 'Splat!', 'Hit somebody with a snowball'],
    ['jw.chairs', 'Last One Sitting', 'Win when the music stops'],
    ['jw.quiz', 'Quiz Kid', 'Top the scores at the Quiz Booth'],
    ['jw.dance', 'Saturday Night Fever', 'Dance on a light-up floor'],
    ['jw.tele', 'Beam Me Up', 'Use a Tele-Booth'],
    ['jw.mayor', 'Hats Off', 'The Mayor asked you not to'],
    ['jw.bottle', 'Message Received', 'Somebody left something on the beach'],
    ['jw.like', 'Thumbs Up', "Like somebody else's room"],
    ['jw.gb', 'Wish You Were Here', "Sign a room's guestbook"],
    ['jw.bell', 'Ding Dong', "Ring somebody's doorbell"],
    ['jw.staff', 'Staff Only', 'Moderators have their own page'],
    ['jw.grot', 'A Grot in Town', 'Somebody small and green hangs about in Jacktown'],
    ['jw.revise', 'Actually Revised', 'Some rooms are for being quiet in. For quite a long time.'],
    ['jw.rotw', 'Room of the Week', 'Have the best room in JackWorld for a whole week'],
  ].forEach(([id, n, h]) => A.defineSecret(id, n, h));
})();

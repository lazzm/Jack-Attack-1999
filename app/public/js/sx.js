/* sx: SECRETS. The Great JackNet Hunt, the new Secrets Found tracker and a pile of new secrets all over the PC.
 * This always-loaded part is small: it registers the secrets, the Hunt's web sites (bodies in js/sx-hunt.js), the
 * clues that live on the PC (files, MS-DOS, the Registry, the phone, the bedroom, the magazine), the Run-box easter
 * eggs (effects in js/sx-eggs.js), the DOS toys (js/sx-dos.js) and the Secrets Found window (js/sx-tracker.js).
 *   The Great JackNet Hunt   www.greathunt.jnet   ten chapters, each ends in a KEY (a word); ten Golden Bytes; the
 *                            Hint Line (0909 879 0486); the Hall of Champions. The server (mods/sx.js) checks every
 *                            key and byte and hands out the rewards; it is the only place the answers are kept.
 * API (window.Sx): Sx.st (local progress), Sx.me (what the server said), Sx.tryKey(n, word) -> Promise, Sx.byte(id),
 *   Sx.hint(n, i, buy) -> Promise, Sx.hall() -> Promise, Sx.on(ev, fn), Sx.go(url), Sx.load(part), Sx.avail(n)
 * Local state: jhp_sx_hunt = { ch:{n:'WORD'|1}, lt:{n:'C'}, by:{id:ts}, t:{n:ts}, hs:{'n.i':text}, done, full, pos } */
(function () {
  'use strict';
  const A = window.Apps; if (!A || !window.Desk || window.Sx) return;
  const esc = A.esc, store = A.store, $ = id => document.getElementById(id);
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const secret = id => { try { return A.secret(id); } catch (e) { return false; } };
  const isMember = () => !!(window.Net && Net.me && Net.me.member);
  const HQ = 'www.greathunt.jnet', RING = 'www.huntersring.jnet';
  const load = part => A.load('js/sx-' + part + '.js');
  const catP = A.load('js/sx-cat.js').catch(() => null);

  // ================================================================ the secrets (prefix sx.)
  const SEC = [
    // the Great JackNet Hunt
    ['sx.h.join', 'The hunt is on!', 'Find the headquarters of a treasure hunt on the Web (a search engine knows about treasure)'],
    ['sx.h.c1', 'Under the bonnet', 'Find key 1 of the Great JackNet Hunt'],
    ['sx.h.c2', 'Shy files', 'Find key 2 of the Great JackNet Hunt'],
    ['sx.h.c3', 'Prompt and to the point', 'Find key 3 of the Great JackNet Hunt'],
    ['sx.h.c4', 'Busy bee', 'Find key 4 of the Great JackNet Hunt'],
    ['sx.h.c5', 'X marks the spot', 'Find key 5 of the Great JackNet Hunt'],
    ['sx.h.c6', 'Lift-off', 'Find key 6 of the Great JackNet Hunt'],
    ['sx.h.c7', 'Thirty lives', 'Find key 7 of the Great JackNet Hunt'],
    ['sx.h.c8', 'Ring-a-ring o\' websites', 'Find key 8 of the Great JackNet Hunt'],
    ['sx.h.c9', 'Line engaged', 'Find key 9 of the Great JackNet Hunt'],
    ['sx.h.c10', 'COUNTDOWN!', 'Find the tenth and last key of the Great JackNet Hunt'],
    ['sx.h.full', 'One hundred per cent', 'Finish EVERYTHING in the Great JackNet Hunt: every key and every Golden Byte'],
    ['sx.h.kit', 'Hunter\'s kit', 'Download the proper tools for a treasure hunt'],
    ['sx.h.hint', 'Calls cost 50p a minute', 'Ring a hint line (ask the person who pays the bill first)'],
    ['sx.h.shy', 'The shy poem', 'Read a poem that really doesn\'t want to be seen'],
    ['sx.h.decode', 'Decoder ring', 'Run a decoder at the C:\\> prompt'],
    ['sx.h.vault', 'Safe cracker', 'Open a vault that lives in the Registry'],
    ['sx.h.konami', 'Cheat activated', 'Do a very famous cheat code on a treasure hunt\'s front page'],
    ['sx.h.ring', 'All the way round', 'Visit every member of the Hunters\' Ring'],
    ['sx.h.white', 'White on white', 'Some words are written in white on a white page. Highlight them'],
    ['sx.h.hunters', 'Calling all hunters', 'Ring the number that spells a word on the keypad'],
    ['sx.h.robots', 'No robots allowed', 'Read the file that tells robots where they can\'t go'],
    ['sx.h.disk', 'The last file of 1999', 'Read the file on the disk at the very end of the hunt'],
    // the Golden Bytes (one secret each)
    ['sx.b.glint', 'Golden Byte: The Glint', 'Something gold sometimes glints on the desktop. Be quick'],
    ['sx.b.dos', 'Golden Byte: Hidden', 'A byte hides at the very top of C:'],
    ['sx.b.robots', 'Golden Byte: Robot-Proof', 'Robots aren\'t allowed to see one page. You are'],
    ['sx.b.reg', 'Golden Byte: The Drawer', 'There\'s a drawer in the Registry'],
    ['sx.b.phone', 'Golden Byte: On the Phone', 'You can ring some bytes'],
    ['sx.b.ring', 'Golden Byte: The Tiniest Link', 'A link the size of a full stop'],
    ['sx.b.note', 'Golden Byte: Captain\'s Log', 'Notepad keeps a log, if you know the old trick'],
    ['sx.b.clock', 'Golden Byte: Grumpy Clock', 'Annoy the clock'],
    ['sx.b.room', 'Golden Byte: Under the Bed?', 'Something gold in Jack\'s bedroom'],
    ['sx.b.mag', 'Golden Byte: Back Issue', 'A byte stuck between the pages of an old magazine'],
    // easter eggs in Start > Run
    ['sx.r.podbay', 'I\'m sorry, Dave', 'Ask the computer to open some doors. Very politely'],
    ['sx.r.daisy', 'Daisy, Daisy', 'Ask a famous film computer to sing'],
    ['sx.r.monolith', 'Full of stars', 'Something big and black from a 1968 film about space'],
    ['sx.r.warp', 'Make it so', 'Tell the PC to engage, like a starship captain'],
    ['sx.r.beam', 'Beam me up', 'Ask to be beamed up'],
    ['sx.r.vulcan', 'Live long and prosper', 'Give the PC a Vulcan greeting'],
    ['sx.r.hadouken', 'Fireball!', 'Shout a fighting-game special move'],
    ['sx.r.alert', '!', 'Call for a soldier who hides in cardboard boxes'],
    ['sx.r.catch', 'Gotta catch them all', 'Say the playground motto of 1999'],
    ['sx.r.activate', '3... 2... 1...', 'Start a robot fight'],
    ['sx.r.banzai', 'Banzai!', 'Charge a castle like a game show contestant'],
    ['sx.r.goodnews', 'Good news, everyone!', 'Say what the old professor says'],
    ['sx.r.thunderbirds', 'F.A.B.', 'Launch some puppets'],
    ['sx.r.moon', 'One small step', 'Say what was said on the Moon thirty years ago'],
    ['sx.r.dalek', 'EXTERMINATE!', 'Shout like a pepper pot from outer space'],
    ['sx.r.back', 'I\'ll be back', 'Say what a famous film robot says before he leaves'],
    ['sx.r.lego', 'Click, click, click', 'Ask for a box of building bricks'],
    ['sx.r.error', 'I AM ERROR', 'Introduce yourself the way a man in a 1988 game did'],
    ['sx.r.listen', 'Hey! Listen!', 'Say what the fairy says. Over and over'],
    ['sx.r.coin', 'Player One Ready', 'Put your money in, then press the button'],
    ['sx.r.gameover', 'Continue?', 'Tell the computer it is game over, then don\'t give up'],
    ['sx.r.invaders', 'They\'re coming!', 'Let the aliens in, row by row'],
    ['sx.r.pong', 'Bip. Bop.', 'Ask for the oldest video game you can think of'],
    ['sx.r.mario', 'Here we go!', 'Introduce a famous plumber'],
    ['sx.r.oddjob', 'Banned!', 'Pick the character that is banned at Dave\'s house'],
    ['sx.r.1999', 'Groundhog year', 'Ask the PC what year it is. Then ask again'],
    // MS-DOS toys
    ['sx.d.sl', 'Choo choo', 'Mistype a Dad-at-work command at the C:\\> prompt'],
    ['sx.d.eliza', 'Doctor, doctor', 'Talk to a very old computer therapist at the C:\\> prompt'],
    ['sx.d.cal', 'Every day of 1999', 'Ask the C:\\> prompt for a calendar'],
    ['sx.d.banner', 'BIG LETTERS', 'Make the C:\\> prompt print a banner'],
    // the desktop, the clock and everything else
    ['sx.t.leet', 'Leet o\'clock', 'Be at the PC at a very nerdy time of day'],
    ['sx.t.owl', 'Night owl', 'Be at the PC when it\'s way past bedtime'],
    ['sx.t.start', 'Start, stop, start', 'Open and close the Start menu over and over (and over)'],
    ['sx.t.windows', 'Window shopping', 'Have a dozen windows open at once'],
    ['sx.t.about', 'The Book of JackNet', 'The browser has an about page of its own. Type it'],
    ['sx.t.list', 'Taking stock', 'Look at your list of secrets'],
    ['sx.t.bulb', 'Bright idea', 'Use a hint bulb on a secret you can\'t find'],
  ];
  SEC.forEach(([id, n, h]) => A.defineSecret(id, n, h));

  // ================================================================ hunt progress (local) + the server
  const st = store.get('jhp_sx_hunt', {});
  for (const k of ['ch', 'lt', 'by', 't', 'hs']) if (!st[k] || typeof st[k] !== 'object') st[k] = {};
  const save = () => store.set('jhp_sx_hunt', st);
  const EV = {};
  const emit = (t, d) => (EV[t] || []).slice().forEach(fn => { try { fn(d); } catch (e) { console.error(e); } });
  const on = (t, fn) => { (EV[t] = EV[t] || []).push(fn); return () => { EV[t] = (EV[t] || []).filter(x => x !== fn); }; };
  const send = m => { try { return !!(window.Net && Net.send(m)); } catch (e) { return false; } };
  const BCODE = { glint: 'AURUM', dos: 'HIDN8', robots: 'NOBOT', reg: 'DRAW3', phone: 'RING5', ring: 'TINY1', note: 'DOTLOG', clock: 'TICKT', room: 'BEDBY', mag: 'BACK1' };
  const NCH = 10, NBYTE = Object.keys(BCODE).length;
  const nKeys = () => { let n = 0; for (let i = 1; i <= NCH; i++) if (st.ch[i]) n++; return n; };
  const nBytes = () => Object.keys(BCODE).filter(id => st.by[id]).length;
  const avail = n => n === 1 || !!st.ch[n - 1];
  let me = null, synced = false;
  const waiting = { res: {}, hint: {}, hall: [] };
  function waitFor(bag, k, ms) { return new Promise(res => { const t = setTimeout(() => { if (bag[k] === done) delete bag[k]; res({ err: 'offline' }); }, ms || 8000); const done = m => { clearTimeout(t); res(m); }; bag[k] = done; }); }
  function tryKey(n, word) {
    n = n | 0; if (!(n >= 1 && n <= NCH)) return Promise.resolve({ ok: 0 });
    if (!send({ t: 'sxTry', ch: n, a: String(word || '').slice(0, 40) })) return Promise.resolve({ err: 'offline' });
    return waitFor(waiting.res, n);
  }
  function gotKey(n, m, word) {
    const was = !!st.ch[n];
    st.ch[n] = String(word || st.ch[n] || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim() || 1;
    if (m.lt) st.lt[n] = m.lt;
    if (m.done) st.done = st.done || Date.now();
    if (m.full) st.full = st.full || Date.now();
    if (m.pos) st.pos = m.pos;
    if (n < NCH && !st.t[n + 1]) st.t[n + 1] = Date.now();
    save();
    secret('sx.h.c' + n);
    if (n === NCH) secret('sx.h.c10');
    fullCheck();
    if (!was) emit('key', n);
    emit('change');
  }
  function fullCheck() { if (nKeys() >= NCH && nBytes() >= NBYTE && (!isMember() || st.full)) secret('sx.h.full'); }
  function byte(id) {
    if (!BCODE[id]) return false;
    const fresh = !st.by[id];
    if (fresh) { st.by[id] = Date.now(); save(); }
    secret('sx.b.' + id);
    send({ t: 'sxByte', id, c: BCODE[id] });
    if (fresh) {
      sfx('solve');
      const n = nBytes();
      setTimeout(() => Desk.toast('\u2726 GOLDEN BYTE! \u2726', `${(window.SxCat && SxCat.BYTE[id] || {}).n || 'A Golden Byte'}: ${n} of ${NBYTE} found. (The Great JackNet Hunt: www.greathunt.jnet)`, 7000), 900);
      emit('change'); fullCheck();
    }
    return fresh;
  }
  function hint(n, i, buy) {
    if (!send({ t: 'sxHint', ch: n | 0, i: i | 0, buy: buy ? 1 : 0 })) return Promise.resolve({ err: 'offline' });
    return waitFor(waiting.hint, (n | 0) + '.' + (i | 0));
  }
  function hall() { if (!send({ t: 'sxHall' })) return Promise.resolve({ err: 'offline' }); return new Promise(res => { const t = setTimeout(() => res({ err: 'offline' }), 8000); waiting.hall.push(m => { clearTimeout(t); res(m); }); }); }
  if (window.Net) {
    Net.on('sxRes', m => { const n = m.ch | 0; if (m.ok) gotKey(n, m, pendingWord[n]); const f = waiting.res[n]; delete waiting.res[n]; if (f) f(m); });
    Net.on('sxHint', m => { const k = (m.ch | 0) + '.' + (m.i | 0); if (m.text) { st.hs[k] = m.text; save(); emit('change'); } const f = waiting.hint[k]; delete waiting.hint[k]; if (f) f(m); });
    Net.on('sxHall', m => { const l = waiting.hall; waiting.hall = []; l.forEach(f => f(m)); });
    Net.on('sxByteRes', m => { if (m.full) { st.full = st.full || Date.now(); save(); fullCheck(); } if (m.newFull) emit('full'); emit('change'); });
    Net.on('sxMe', m => {
      me = m.mem ? m : null;
      if (m.mem) {
        for (const n in m.ch || {}) { if (!st.ch[n]) st.ch[n] = 1; st.lt[n] = m.ch[n][0]; secret('sx.h.c' + n); }
        for (const id in m.by || {}) if (!st.by[id]) st.by[id] = m.by[id];
        Object.assign(st.hs, m.hs || {});
        for (const n in m.un || {}) if (!st.t[n] || m.un[n] < st.t[n]) st.t[n] = m.un[n];
        st.done = m.done || st.done || 0; st.full = m.full || 0; st.pos = m.pos || 0;
        save();
        // things found before logging on (or on another PC before the profile came over): let the server check them
        const ch = {}, by = {}; let any = false;
        for (let n = 1; n <= NCH; n++) if (st.ch[n] && !(m.ch || {})[n] && typeof st.ch[n] === 'string') { ch[n] = st.ch[n]; any = true; }
        for (const id in st.by) if (BCODE[id] && !(m.by || {})[id]) { by[id] = BCODE[id]; any = true; }
        if (any && !synced) { synced = true; setTimeout(() => send({ t: 'sxSync', ch, by }), 600); }
        fullCheck();
      }
      emit('me', m); emit('change');
    });
    Net.on('welcome', () => setTimeout(() => send({ t: 'sxMe' }), 1200));
    Net.on('loginOk', () => { synced = false; setTimeout(() => send({ t: 'sxMe' }), 900); });
  }
  const pendingWord = {};
  const Sx = window.Sx = {
    get st() { return st; }, get me() { return me; }, get member() { return isMember(); },
    nKeys, nBytes, avail, NCH, NBYTE, BCODE, on, emit, save, load, secret, esc, sfx, HQ, RING,
    tryKey(n, w) { pendingWord[n | 0] = w; return tryKey(n, w); },
    byte, hint, hall,
    go(url) { const b = $('browser'); if (b) { b.classList.remove('min'); b.style.zIndex = (window.JZ = (window.JZ || 2400) + 1); } IE.navigate(url); },
    cat: () => catP.then(() => window.SxCat),
  };

  // the Hunt's rewards are JackLoot exclusives: add them to the browser's copy of the catalogue (like js/grind.js does)
  catP.then(() => A.load('js/loot-cat.js')).then(() => {
    const L = window.LootCat, C = window.SxCat; if (!L || !C) return;
    for (const [id, name, r, type, art, d, xx] of C.LOOT) if (!L.ITEM[id]) { const it = Object.assign({ id, name, r, type, art, d, ex: 1 }, xx || {}); L.ITEMS.push(it); L.ITEM[id] = it; }
  }).catch(() => {});

  // ================================================================ the Hunt's web sites (bodies load from js/sx-hunt.js)
  const mk = (host, path) => () => {
    const el = document.createElement('div');
    el.className = 'sx-wait';
    el.innerHTML = `<p style="font:13px 'Courier New',monospace;padding:18px;margin:0;background:#fff;color:#000;min-height:420px">Contacting host: <b>${esc(host)}</b>...<br>Host contacted. Waiting for reply...</p>`;
    load('hunt').then(() => setTimeout(() => { if (window.SxHunt) SxHunt.render(host, path, el); }, 200))
      .catch(() => { el.innerHTML = `<div style="padding:18px;font:13px Arial,sans-serif;background:#fff;color:#000;min-height:300px"><h2>The page cannot be displayed</h2><p>The server at <b>${esc(host)}</b> took too long to answer. Click <b>Refresh</b>, or try again later.</p></div>`; });
    return el;
  };
  // [host, title, desc, cat, {path: [page title, words for the search engines]}, {hidden path: title}]
  const SITES = [
    [HQ, 'The Great JackNet Hunt - Hunt HQ', 'THE GREAT JACKNET HUNT! Ten keys hidden all over the JackNet and Jack\'s PC. Find them all, dig up the Millennium Disk and become a Hunt Champion. Treasure hunt, puzzles, clues, golden floppy.', 'games', {
      '/': ['Hunt HQ', 'great jacknet hunt treasure hunt puzzle clues keys hunt hq millennium disk golden floppy golden bytes treasure map champion'],
      '/guestbook.html': ['Hunters\' Guestbook', 'hunters guestbook sign hunt master tips treasure'],
      '/rules.html': ['The Rules', 'rules of the hunt keys words lock hint line fair play'],
      '/bytes.html': ['Golden Bytes', 'golden bytes ten little gold bytes hidden all over the pc'],
      '/hintline.html': ['The Hunt Hint Line', 'hint line phone 0909 stuck hints calls cost 50p a minute'],
      '/hall.html': ['Hall of Champions', 'hall of champions hunters who found every key'],
      '/kit.html': ['Hunter\'s Kit', 'hunters kit download decoder logbook notes tools'],
      '/robots.txt': ['robots.txt', 'robots user agent disallow'],
    }, { '/goldenbyte.html': 'Hunt HQ - ???', '/disk.html': 'THE MILLENNIUM DISK', '/answers.html': 'Hunt HQ - The Answers' }],
    [RING, 'The Hunters\' Ring', 'A webring for treasure hunters, puzzle people and anybody who likes finding things. Four member sites. Hunters ring webring golden floppy.', 'comm', {
      '/': ['The Hunters\' Ring - Hub', 'hunters ring webring hub member sites treasure hunt pieces'],
      '/join.html': ['Join the Ring', 'join the hunters ring webring code'],
    }],
    ['www.floppyfanclub.netz', 'The Floppy Fan Club', 'Everything about the humble floppy disk: 1.44 MB of joy. Best labels, the write-protect tab, and why you never leave one on the telly. Hunters\' Ring member.', 'hobby', {
      '/': ['The Floppy Fan Club', 'floppy disk 3.5 inch 1.44 mb write protect labels fan club hunters ring'] }],
    ['www.modemmuseum.w3b', 'The Modem Museum', 'From 300 baud to 56K: the history of the modem, with sound effects. Hunters\' Ring member.', 'sci', {
      '/': ['The Modem Museum', 'modem museum 300 baud 56k v.90 history dial up handshake noise hunters ring'] }],
    ['www.saverhall.zyne', 'The Screen Saver Hall of Fame', 'The greatest screen savers of all time: starfields, pipes, mazes and the famous flying toasters. Hunters\' Ring member.', 'fun', {
      '/': ['The Screen Saver Hall of Fame', 'screen saver hall of fame starfield pipes maze flying toasters hunters ring'] }],
    ['www.shinydisc.kidz', 'The Shiny Disc Club', 'CD-ROMs! Cover discs, 650 MB, what happens in the microwave (DON\'T). Hunters\' Ring member.', 'soft', {
      '/': ['The Shiny Disc Club', 'cd-rom cover disc 650 mb shiny disc club hunters ring'] }],
  ];
  if (window.IE && IE.addSite) for (const [host, title, desc, cat, paths, hid] of SITES) {
    const pages = {};
    for (const p in paths) pages[p] = { title: p === '/' ? title : title.replace(/ - .*$/, '') + ' - ' + paths[p][0], html: mk(host, p), text: paths[p][1] + ' ' + desc };
    // pages nobody links to: they answer when typed, but they're not in the list (so the search engines can't find them)
    const pg = !hid ? pages : new Proxy(pages, { get(t, p) { if (typeof p === 'string' && !(p in t) && hid[p]) return { title: hid[p], html: mk(host, p) }; return t[p]; } });
    IE.addSite(host, { title, desc, cat, pages: pg });
  }
  A.cmd(['greathunt', 'great hunt', 'jacknet hunt', 'the great jacknet hunt', 'great jacknet hunt', 'hunthq', 'hunt hq'], () => Sx.go('http://' + HQ + '/'));
  A.cmd(['huntersring', 'hunters ring', "hunters' ring"], () => Sx.go('http://' + RING + '/'));
  if (IE.addPage) IE.addPage('about:jacknet', 'The Book of JackNet', () => { secret('sx.t.about'); return `<div class="sx-book"><h1>The Book of JackNet</h1><p class="sx-v">Chapter 19, verse 99</p><p>And in the beginning there was the Modem, and the Modem did scream unto the night: <i>bee-doo-bee-doo-KSSSHHHH</i>.</p><p>And the Phone was taken from the Mom, and she was sore displeased, for she was expecting a call from the Nan.</p><p>And the pages did load, one picture at a time, from the top down, and the people did wait, and it was good.</p><p>And lo, there came forth the Hit Counter, and the Guestbook, and the spinning Globe, and the words UNDER CONSTRUCTION, and they were never finished, not one of them.</p><p>And it came to pass that the year was 1999, and the year was 1999 again, and it was always 1999, and nobody minded.</p><p class="sx-v">(Type <b>about:jacknet</b> again whenever you need reminding.)</p></div>`; });

  // ================================================================ the Hunter's Kit (a download, from Hunt HQ)
  const KIT_ICON = '<svg viewBox="0 0 32 32"><path d="M4 9h24v18H4z" fill="#8a5a2a" stroke="#000"/><path d="M4 9l3-5h18l3 5" fill="#b07a3a" stroke="#000"/><path d="M11 9V6h10v3" fill="none" stroke="#000"/><circle cx="16" cy="18" r="5" fill="#ffd400" stroke="#000"/><path d="M16 14v4l3 2" stroke="#000" fill="none"/><path d="M4 13h24" stroke="#5a3a1a"/></svg>';
  const HQ_ICON = '<svg viewBox="0 0 32 32"><path d="M3 5h26v22H3z" fill="#f3e2b3" stroke="#7a5a2a"/><path d="M7 21c4-6 7 2 11-4s5-2 8-6" stroke="#a03a1a" stroke-dasharray="2 2" fill="none" stroke-width="1.5"/><path d="M22 8l4 4M26 8l-4 4" stroke="#e10600" stroke-width="2"/><circle cx="8" cy="22" r="2" fill="#2a7ad8"/></svg>';
  A.register('sx.kit', { single: true, cmd: ['huntkit', 'hunters kit', "hunter's kit", 'huntkit.exe'], open: arg => load('hunt').then(() => SxHunt.kit(arg)) });
  A.addProgram(['The Great JackNet Hunt', 'Hunter\'s Kit'], 'sx.kit', KIT_ICON);
  A.addProgram(['The Great JackNet Hunt', 'Hunt HQ on the Web'], () => Sx.go('http://' + HQ + '/'), HQ_ICON);
  try {
    if (window.Setup && Setup.product) Setup.product('sx.kit', { n: 'Hunter\'s Kit 1.0', v: '1.0', kb: 420, lic: 'Freeware', by: 'Hunt HQ', cat: 'fun', sq: 5, rel: '01/01/99', ic: 'find', def: false,
      d: 'Everything a JackNet treasure hunter needs: the Hunt Logbook (every key, every Golden Byte), a decoder for backwards writing, Morse, the pilots\' alphabet and phone keypads, and a notepad for your clues.',
      note: 'Batteries not included. Torch not included. Treasure definitely not included.', home: 'http://' + HQ + '/kit.html', apps: ['sx.kit'], paths: ['The Great JackNet Hunt >'], launch: 'sx.kit', exe: 'HUNTKIT.EXE', dir: 'Hunter\'s Kit' });
  } catch (e) { console.error(e); }

  // ================================================================ clues on the PC: files
  const fs = A.fs;
  fs.dir('C:/My Documents/Hunt Stuff');
  fs.add('C:/My Documents/Hunt Stuff', { name: 'README.TXT', type: 'txt', date: '01/01/99', text: 'HUNT STUFF\n==========\n\nNothing to see in here.\n\nAbsolutely NOTHING hidden in this folder.\n\nNope. Definitely not. Go away.\n\n- Jack\n\n(PS. If you were a really good hunter you would know how to see things that are hiding.)' });
  fs.add('C:/My Documents/Hunt Stuff', { name: 'shh - dont look.txt', type: 'txt', date: '01/01/99', hidden: true, secret: 'sx.h.shy', text: 'A POEM FOR SHY FILES\nby Jack, aged "none of your business"\n\nGubbinz says there\'s something here,\nHiding where you cannot see.\nOnly those who look for shy things\nSee the files that shouldn\'t be.\nTake the first of every line...\n\n(and that is what you call a thing that is there but you can\'t see it. Whoooo. Spooky.)' });
  fs.add('C:/My Documents/Hunt Stuff', { name: 'shopping list.txt', type: 'txt', date: '27/12/98', text: 'THINGS I NEED FOR THE HUNT\n\n- a floppy disk (gold spray paint: borrow Dad\'s, ask later)\n- a torch\n- the big map from the hall cupboard\n- crisps (cheese and onion)\n- ten good hiding places\n- a way to stop Dave finding it first' });
  fs.dir('C:/HUNT');
  fs.add('C:/HUNT', { name: 'README.1ST', type: 'txt', date: '01/01/99', size: '1 KB', text: 'GREAT JACKNET HUNT - CHAPTER 3\n==============================\n\nThis is the DECODER. It only works at the C:\\> prompt\n(Start > Programs > MS-DOS Prompt).\n\nNot sure how a DOS program works? Ask it. Type its name\nwith /? on the end and it will tell you everything.\n\nThe key is in the decoder. Be careful: I scrambled it,\nin case Dave looks.\n\n- Jack' });
  fs.add('C:/HUNT', { name: 'DECODE.EXE', type: 'exe', date: '01/01/99', size: '9 KB', app: 'dos.run', arg: 'DECODE /?', dosprog: 'decode' });
  fs.add('C:/HUNT', { name: 'KEY3.TXT', type: 'txt', date: '01/01/99', size: '1 KB', text: 'Nice try!\n\nI\'m not going to just leave the key in a file called KEY3.TXT, am I?\n\nUse the DECODER.' });
  fs.add('C:/', { name: 'BYTE.BIN', type: 'sxb', sxb: 'dos', date: '01/01/99', size: '1 KB', hidden: true, text: '\u2726 GOLDEN BYTE \u2726\n\n01000111 01001111 01001100 01000100\n(that is GOLD, in binary)\n\nYou found a Golden Byte by looking at the files that hide. Well done!\nByte code: HIDN8\n\nThere are ten Golden Bytes in the Great JackNet Hunt: www.greathunt.jnet' });
  A.OPENERS.sxb = node => { if (node.sxb) byte(node.sxb); Desk.notepad(node.name, node.text || ''); };

  // ================================================================ clues on the PC: MS-DOS (DECODE, plus the toys in js/sx-dos.js)
  const DOS = window.DOS = window.DOS || {};
  DOS.progs = DOS.progs || {};
  const lazyDos = name => async (sh, args, node) => { try { await load('dos'); } catch (e) { sh.println('Not enough memory to run ' + name.toUpperCase() + '.'); return; } return window.SxDos && SxDos[name] ? SxDos[name](sh, args, node) : sh.println('Bad command or file name'); };
  ['decode', 'sl', 'eliza', 'doctor', 'cal', 'banner'].forEach(n => { if (!DOS.progs[n]) DOS.progs[n] = lazyDos(n); });
  // TYPE / MORE / EDIT the hidden byte at the prompt (the shell loads later, so we wrap it once it's there)
  function hookShell() {
    const Sh = window.DOS && DOS.Shell; if (!Sh || Sh.prototype._sxWrap) return !!Sh;
    const ex = Sh.prototype.exec; if (typeof ex !== 'function') return false;
    Sh.prototype.exec = function (line) {
      try {
        const mm = /^\s*(type|more|edit|copy)\s+("?)([^"\s]+)\2/i.exec(String(line || ''));
        if (mm && /byte\.bin$/i.test(mm[3]) && this.resolve) { const r = this.resolve(mm[3]); if (r && !r.err && r.node && r.node.sxb) setTimeout(() => byte(r.node.sxb), 400); }
      } catch (e) {}
      return ex.apply(this, arguments);
    };
    Sh.prototype._sxWrap = 1; return true;
  }
  { let tries = 0; const iv = setInterval(() => { if (hookShell() || ++tries > 900) clearInterval(iv); }, 2000); }

  // ================================================================ clues on the PC: the Registry (needs apps-programs.js's A.REG)
  function regSetup() {
    const R = A.REG, H = A.REG_HOOKS; if (!R || !H || R._sx) return;
    R._sx = 1;
    const sw = R.HKEY_CURRENT_USER.Software = R.HKEY_CURRENT_USER.Software || {};
    sw['Great JackNet Hunt'] = {
      '': 'Hunt HQ: http://www.greathunt.jnet/',
      Chapter: 4,
      Vault: { Locked: 1, Note: 'The vault is locked. To open it, change Locked to 0. Go on. I dare you.', Contents: '(locked)' },
      Hunters: { Jack: 'Hunt Master', Dave: 'Keeps trying to read the answers in the source code. (They aren\'t there. Ha.)', Callum: 'Hunter', Luke: 'Hunter', JackK: 'Hunter (the other Jack. No, not THAT Jack. The other one.)' },
    };
    const sm = R.HKEY_LOCAL_MACHINE.SOFTWARE = R.HKEY_LOCAL_MACHINE.SOFTWARE || {};
    sm['Great JackNet Hunt'] = { Bytes: { Drawer: 'Shut', Note: 'There are ten Golden Bytes. One of them is in this drawer. Change Drawer to Open.', Count: 10 } };
    const vault = sw['Great JackNet Hunt'].Vault, drawer = sm['Great JackNet Hunt'].Bytes;
    const openVault = () => { vault.Locked = 0; vault.Contents = 'A scrap of paper (double-click Note)'; vault.Note = 'The registry keeps its keys in files called HIVES. Bees keep something sweet in their hives. That is your key.'; };
    H['hkey_current_user\\software\\great jacknet hunt\\vault|locked'] = v => {
      const n = typeof v === 'number' ? v : parseInt(v, 10) || 0;
      if (n !== 0) { Desk.msgbox('The Vault', 'CLUNK. Still locked. (Locked has to be 0. Zero. Nothing. Nada.)', 'warn'); return false; }
      openVault(); secret('sx.h.vault'); sfx('solve');
      Desk.msgbox('The Vault', '*CLUNK* ...creeeeeak...\n\nThe vault swings open! Inside is a scrap of paper. It says:\n\n"The registry keeps its keys in files called HIVES.\n Bees keep something sweet in their hives.\n That is your key. (Key 4.)"\n\n- Jack', 'info');
      return true;
    };
    H['hkey_current_user\\software\\great jacknet hunt\\vault|note'] = () => { Desk.msgbox('The Vault', 'The note is written in felt tip. You can\'t rub it out. (Change Locked instead.)', 'warn'); return false; };
    H['hkey_local_machine\\software\\great jacknet hunt\\bytes|drawer'] = v => {
      if (!/^\s*open\s*$/i.test(String(v))) { Desk.msgbox('The Byte Drawer', 'The drawer rattles but stays shut. (It wants to be Open.)', 'warn'); return false; }
      drawer.Note = 'Empty now. You took the byte! Byte code: DRAW3';
      setTimeout(() => byte('reg'), 300);
      return true;
    };
    // an edit made in an earlier visit stays made
    const saved = (A.REG_SAVED && A.REG_SAVED.set) || {};
    if (saved['HKEY_CURRENT_USER\\Software\\Great JackNet Hunt\\Vault|Locked'] === 0) openVault();
    if (/^\s*open\s*$/i.test(saved['HKEY_LOCAL_MACHINE\\SOFTWARE\\Great JackNet Hunt\\Bytes|Drawer'] || '')) { drawer.Drawer = 'Open'; drawer.Note = 'Empty now. You took the byte! Byte code: DRAW3'; }
  }
  regSetup();

  // ================================================================ clues on the PC: the phone (Phone Dialer numbers the Hunt answers)
  const digits = s => String(s || '').replace(/[^0-9*#]/g, '');
  const PHONES = { '09098790486': 'hint', '4868377': 'hunters', '29837': 'bytes' };
  function phoneGrab(ev, inp) {
    const n = digits(inp && inp.value); const what = PHONES[n]; if (!what) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    load('hunt').then(() => SxHunt.call(what, inp.value.trim(), inp.closest('.appwin'))).catch(() => {});
  }
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('.pgf-dial'); if (!b) return; const w = b.closest('.pgf'); phoneGrab(ev, w && w.querySelector('.pgf-num')); }, true);
  document.addEventListener('keydown', ev => { if (ev.key !== 'Enter' || !ev.target.classList || !ev.target.classList.contains('pgf-num')) return; phoneGrab(ev, ev.target); }, true);

  // ================================================================ clues in the bedroom (js/rm-room.js's window.Room hook)
  const X0 = () => nKeys() > 0;
  function roomSetup(tries) {
    const R = window.Room;
    if (!R || !R.addClue || !R.spots) { if ((tries | 0) < 40) setTimeout(() => roomSetup((tries | 0) + 1), 1500); return; }
    const spots = R.spots(), pick = (re, dflt) => spots.find(s => re.test(s)) || dflt;
    if (!spots.length && (tries | 0) < 40) { setTimeout(() => roomSetup((tries | 0) + 1), 1500); return; }
    const poster = pick(/shuttle|space|rocket/i, pick(/poster/i, 'poster'));
    R.addClue(poster, { title: 'A note on the poster', when: () => avail(6) && !st.ch[6], text: '<i>"HUNT KEY 6: Eileen Collins has flown the shuttle twice, both times as the PILOT. On this mission (STS-93, Columbia) she\'s the first woman ever IN CHARGE. Her job title is the key!"</i>' });
    const cork = pick(/cork/i, '');
    if (cork) R.addClue(cork, { title: 'A flyer on the cork board', once: true, when: () => !X0(), text: 'Pinned over the cheats list: a flyer, in felt tip. <b>THE GREAT JACKNET HUNT!</b> Ten keys hidden all over the JackNet. Start at Hunt HQ: <b>www.greathunt.jnet</b>' });
    const drawer = pick(/drawer/i, pick(/bed|box|wardrobe/i, 'drawer'));
    R.addClue(drawer, { title: 'Something shiny...', once: true, when: () => !st.by.room, secret: 'sx.b.room', text: () => { setTimeout(() => byte('room'), 60); return 'Under the letters something glints: a tiny gold square with a label, <b>GOLDEN BYTE - BEDBY</b>. It\'s in your Hunt Logbook now!'; } });
  }
  roomSetup(0);

  // ================================================================ clues in the magazine (the main site's Cheats page, and Back Issue no.1's Cheats Corner)
  const css = (id, text) => { if ($(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = text; document.head.appendChild(s); };
  function cheatsClue(tries) {
    const box = document.querySelector('#s-cheats .cheat'); if (!box) { if ((tries | 0) < 20) setTimeout(() => cheatsClue((tries | 0) + 1), 400); return; }
    if ($('sxCheat')) return;
    const d = document.createElement('div'); d.className = 'cheat rumour'; d.id = 'sxCheat';
    d.innerHTML = '<h4>THE GREAT JACKNET HUNT (any PC) <span class="tag">PLAYGROUND RUMOUR</span></h4>Callum\'s cousin swears that if you go to the front page of Hunt HQ (<a href="http://www.greathunt.jnet/">www.greathunt.jnet</a>) and put in the most famous cheat code in the whole world, something happens. You know the one: <b>up, up, down, down, left, right, left, right, B, A</b>. (No keyboard? There\'s a little pad of buttons at the bottom of the page.) I haven\'t tested this one. Let me know!';
    box.parentNode.insertBefore(d, box);
  }
  function backIssueByte() {
    const page = $('s-secret'); if (!page || page.querySelector('.sx-magbyte')) return;
    const host = page.querySelector('.cx-page, .cx-body, article, .sitebody') || page.firstElementChild || page;
    const d = document.createElement('p'); d.className = 'sx-magbyte';
    d.innerHTML = 'Something is stuck to the bottom of this page with a bit of Blu-Tack... <button type="button" class="sx-goldbtn" title="Peel it off" aria-label="Peel off the shiny thing"></button>';
    host.appendChild(d);
    d.querySelector('button').addEventListener('click', ev => { ev.preventDefault(); ev.currentTarget.classList.add('sx-got'); d.lastChild.after(' A GOLDEN BYTE! (Byte code: BACK1)'); byte('mag'); }, { once: true });
  }
  document.addEventListener('section', ev => {
    const s = String(ev.detail || '');
    if (s === 'cheats') setTimeout(() => cheatsClue(0), 300);
    if (/^secret:backissues\/jan\/cheats$/i.test(s)) { let n = 0; const iv = setInterval(() => { const pg = $('s-secret'); if (++n > 25 || !pg || !/backissues\/jan\/cheats/i.test(($('addrBar') || {}).value || '')) return clearInterval(iv); if (pg.textContent.length > 400 && !pg.querySelector('.sx-magbyte')) backIssueByte(); }, 400); }
    if (s === 'site:' + HQ + '/' || s.startsWith('site:' + HQ + '/')) secret('sx.h.join');
  });

  // ================================================================ the desktop: a glint, a grumpy clock, the Start menu, too many windows
  // the glint: a golden byte flashes up somewhere on the visible desktop for a few seconds, every few minutes
  let glintEl = null;
  function glint() {
    if (st.by.glint || document.hidden || glintEl) return;
    if (!DesktopSurface.ready() || document.querySelector('.logon, .dialwin')) return;
    const dk = $('desktop'); if (!dk) return;
    for (let i = 0; i < 12; i++) {
      const x = 110 + Math.random() * Math.max(10, DesktopSurface.width() - 160), y = 40 + Math.random() * Math.max(10, DesktopSurface.height() - 120);
      const client = DesktopSurface.client(x, y);
      const at = document.elementFromPoint(client.x, client.y); if (!at || !(at === dk || at.id === 'desktop' || at.classList.contains('icons'))) continue;
      const b = glintEl = document.createElement('button'); b.type = 'button'; b.className = 'sx-glint'; b.title = ''; b.setAttribute('aria-label', 'Something shiny');
      b.style.left = Math.round(x) + 'px'; b.style.top = Math.round(y) + 'px';
      b.addEventListener('click', ev => { ev.stopPropagation(); b.classList.add('sx-got'); byte('glint'); setTimeout(() => { b.remove(); glintEl = null; }, 900); });
      DesktopSurface.root().appendChild(b);
      setTimeout(() => { if (glintEl === b && !b.classList.contains('sx-got')) { b.remove(); glintEl = null; } }, 9000);
      return;
    }
  }
  Sx._glint = () => { glintEl = null; glint(); };
  setTimeout(function g() { glint(); setTimeout(g, (150 + Math.random() * 210) * 1000); }, (100 + Math.random() * 80) * 1000);
  // the clock: ten quick clicks and it gets cross
  let clk = [];
  document.addEventListener('click', ev => {
    if (!ev.target.closest || !ev.target.closest('#clock')) return;
    const now = Date.now(); clk = clk.filter(t => now - t < 5000); clk.push(now);
    if (clk.length >= 10) { clk = []; const c = $('clock'); if (c) { const old = c.textContent; c.textContent = 'OI!'; c.classList.add('sx-cross'); setTimeout(() => { c.textContent = old; c.classList.remove('sx-cross'); }, 1600); } Desk.toast('Clock', 'STOP POKING ME. I\'m trying to keep time here. Look, take this and leave me alone: a GOLDEN BYTE (code TICKT).', 7000); byte('clock'); }
  }, true);
  // the Start menu: open it fifteen times in twenty seconds
  let starts = [];
  document.addEventListener('click', ev => {
    if (!ev.target.closest || !ev.target.closest('#startBtn')) return;
    const now = Date.now(); starts = starts.filter(t => now - t < 20000); starts.push(now);
    if (starts.length >= 15) { starts = []; if (secret('sx.t.start')) setTimeout(() => Desk.msgbox('JackOS', 'The Start button would like a little lie down.\n\n(Start. Stop. Start. Stop. That\'s how Dave drives his go-kart.)', 'info'), 300); }
  }, true);
  // a dozen windows at once, the nerdy time, the bedtime
  setInterval(() => {
    const n = [...document.querySelectorAll('.appwin')].filter(w => w.offsetParent !== null || w.classList.contains('min')).length;
    if (n >= 12 && secret('sx.t.windows')) Desk.toast('JackOS 98', `${n} windows open! This PC has 64MB of RAM and it is using ALL of it. (The hard drive is going crunch crunch crunch.)`, 7000);
    const d = new Date(), hm = d.getHours() * 100 + d.getMinutes();
    if (hm === 1337 && secret('sx.t.leet')) Desk.toast('13:37', 'It\'s LEET O\'CLOCK. Every nerd on the JackNet is checking their watch right now. 1337!', 7000);
    if (d.getHours() === 0 && !document.hidden && secret('sx.t.owl')) Desk.toast('Night owl', 'It\'s after midnight! If Mom sees the light under the door you are in SO much trouble. (Turn the monitor brightness down. That always works.)', 8000);
  }, 20000);
  // Notepad's old trick: a file that starts with .LOG gets the time and date added
  document.addEventListener('input', ev => {
    const ta = ev.target; if (!ta || ta.tagName !== 'TEXTAREA' || !ta.closest('.npwin')) return;
    if (!/^\.LOG(\r?\n)/.test(ta.value) || ta._sxLog) return;
    ta._sxLog = 1;
    const d = new Date(), t = Desk.today99(), p2 = n => String(n).padStart(2, '0');
    const stamp = `${p2(d.getHours() % 12 || 12)}:${p2(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'} ${p2(t.d)}/${p2(t.m)}/99`;
    const pos = ta.selectionStart; ta.value = ta.value.slice(0, pos) + stamp + '\n' + ta.value.slice(pos); ta.selectionStart = ta.selectionEnd = pos + stamp.length + 1;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    if (!st.by.note) setTimeout(() => { Desk.toast('Notepad', 'Notepad wrote the time and date, like a real captain\'s log. Something gold fell out of the menu bar too: a GOLDEN BYTE (code DOTLOG)!', 8000); byte('note'); }, 500);
  });

  // ================================================================ easter eggs in Start > Run (effects load from js/sx-eggs.js)
  const egg = id => raw => load('eggs').then(() => window.SxEggs && SxEggs[id] && SxEggs[id](raw)).catch(() => {});
  const EGGS = {
    podbay: ['open the pod bay doors', 'open the pod bay doors hal', 'open the pod bay doors please', 'open the pod bay doors please hal', 'open the pod bay doors, hal', 'pod bay doors'],
    daisy: ['daisy', 'daisy bell', 'hal', 'hal9000', 'hal 9000', 'hal-9000'],
    monolith: ['monolith', '2001', '2001 a space odyssey', 'my god its full of stars', "my god, it's full of stars", 'its full of stars', "it's full of stars"],
    warp: ['make it so', 'engage', 'warp 9', 'warp', 'warp factor 9', 'warp speed'],
    beam: ['beam me up', 'beam me up scotty', 'energize', 'energise'],
    vulcan: ['live long and prosper', 'llap', 'vulcan'],
    hadouken: ['hadouken', 'hadoken', 'fireball', 'shoryuken'],
    alert: ['snake', 'snake?', 'snaaake', 'snaaaake', 'metal gear', 'metal gear solid'],
    catch: ['gotta catch em all', "gotta catch 'em all", 'gotta catch them all', 'pokeball', 'poke ball'],
    activate: ['activate', '3 2 1 activate', '321 activate', 'cease', 'robot wars'],
    banzai: ['banzai', 'takeshis castle', "takeshi's castle", 'takeshi'],
    goodnews: ['good news everyone', 'good news, everyone', 'good news everyone!', 'futurama'],
    thunderbirds: ['thunderbirds are go', 'thunderbirds', 'fab', 'f.a.b.', 'f.a.b'],
    moon: ['one small step', 'one small step for man', 'apollo', 'apollo 11', 'houston', 'houston we have a problem', 'the eagle has landed'],
    dalek: ['exterminate', 'dalek', 'daleks', 'tardis', 'doctor who'],
    back: ["i'll be back", 'ill be back', 'i will be back', 'hasta la vista', 'hasta la vista baby', 'terminator'],
    lego: ['lego', 'bricks', 'knex', "k'nex"],
    error: ['i am error', 'i am error.'],
    listen: ['hey listen', 'hey! listen!', 'hey listen!', 'navi', 'listen'],
    coin: ['insert coin', 'insert coins', 'press start', 'player 1', 'player one'],
    gameover: ['game over', 'gameover', 'continue', 'continue?'],
    invaders: ['space invaders', 'invaders'],
    pong: ['pong'],
    mario: ["it's-a me", 'its a me', "it's a me", "it's-a me, mario", 'its a me mario', "it's a me mario", 'mario', 'here we go', 'wahoo'],
    oddjob: ['oddjob', 'odd job', '007', 'licence to kill', 'license to kill', 'slappers only'],
    year1999: ['1999', 'what year is it', 'what year is it?', 'year'],
  };
  for (const id in EGGS) { const names = EGGS[id].filter(c => !A.cmds[c]); if (names.length) A.cmd(names, egg(id)); }

  // ================================================================ the Secrets Found window (js/sx-tracker.js)
  const oldWin = A.secretsWindow;
  A.secretsWindow = function () { return load('tracker').then(() => window.SxTracker ? SxTracker.open() : oldWin()).catch(() => oldWin()); };
  A.cmd(['secrets', 'secrets found', 'my secrets'], () => A.secretsWindow());
  // hint bulbs for the tracker: one for every 15 minutes at the PC (while the page is showing), at most 9 saved up
  setInterval(() => {
    if (document.hidden) return;
    const b = store.get('jhp_sx_bulbs', null) || { n: 3, min: 0, got: Object.keys(A.found || {}).length, rev: {}, used: 0 };
    b.min = (b.min | 0) + 1; if (b.min % 15 === 0) { b.n = Math.min(9, (b.n | 0) + 1); if (window.SxTracker) setTimeout(SxTracker.redraw, 50); }
    store.set('jhp_sx_bulbs', b);
  }, 60000);

  // the news: Jack started the Hunt on 2 January (so it's in What's New all year), with a link to Hunt HQ
  try { const CAL = window.CAL = window.CAL || { posts: [], hype: [] }; CAL.posts.push(['01-02', 'SITE', '<b>THE GREAT JACKNET HUNT HAS STARTED!!!</b> I\'ve hidden ten keys all over the JackNet (and on my PC, and in my bedroom...). Find them all and dig up the Millennium Disk! <a href="#" data-sxgo="/">Go to Hunt HQ</a>.']); } catch (e) {}
  document.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('[data-sxgo]'); if (!a) return; ev.preventDefault(); Sx.go('http://' + HQ + a.dataset.sxgo); });

  // ================================================================ a hello, once, for people who have been here before
  setTimeout(() => {
    if (store.get('jhp_sx_hello', 0) || window.JHPEverBooted === false || nKeys()) return;
    store.set('jhp_sx_hello', Date.now());
    Desk.toast('THE GREAT JACKNET HUNT', 'Jack has hidden ten keys all over the JackNet and this PC. Find them all and dig up the Millennium Disk! Start at Hunt HQ: www.greathunt.jnet (or Start > Run > greathunt).', 11000);
  }, 240000);

  css('sxBaseCss', `
.sx-glint{position:fixed;z-index:5;width:14px;height:14px;padding:0;border:0;background:transparent;cursor:pointer;transform:translate(-50%,-50%)}
.sx-glint::before{content:"";position:absolute;inset:3px;background:#ffd400;box-shadow:0 0 0 1px #a07000,0 0 8px 3px rgba(255,220,60,.9);animation:sxglint 1.2s ease-in-out infinite}
.sx-glint::after{content:"";position:absolute;left:50%;top:-6px;bottom:-6px;width:2px;margin-left:-1px;background:linear-gradient(transparent,#fff,transparent);box-shadow:0 0 0 0 #fff;animation:sxglint 1.2s ease-in-out infinite;transform:rotate(45deg)}
.sx-glint.sx-got{animation:sxpop .8s ease-out forwards}
@keyframes sxglint{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}
@keyframes sxpop{to{transform:translate(-50%,-50%) scale(4);opacity:0}}
#clock.sx-cross{color:#e10600;font-weight:bold;animation:sxshake .1s linear 8}
@keyframes sxshake{50%{transform:translateX(2px)}}
.sx-goldbtn{display:inline-block;width:10px;height:10px;padding:0;margin:0 4px;vertical-align:middle;background:#ffd400;border:1px solid #a07000;box-shadow:0 0 6px 2px rgba(255,212,0,.8);cursor:pointer;animation:sxglint 1.4s ease-in-out infinite}
.sx-goldbtn.sx-got{animation:none;opacity:.3;cursor:default}
.sx-magbyte{font:italic 12px Arial,sans-serif;color:#666;margin:14px 0 4px}
.sx-book{max-width:560px;margin:30px auto;padding:20px 24px;background:#fbf3dc;color:#3a2a10;font:16px/1.6 Georgia,"Times New Roman",serif;border:1px solid #c8b07a;box-shadow:3px 3px 0 rgba(0,0,0,.2)}
.sx-book h1{font:bold 30px Georgia,serif;text-align:center;margin:0 0 4px;color:#7a1a0a}
.sx-book .sx-v{text-align:center;font-size:13px;color:#8a6a3a;font-style:italic}
`);
})();

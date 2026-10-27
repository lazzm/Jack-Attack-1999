/* JACK ATTACK! Online - everything that's shared between the people on the site. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n).toLocaleString('en-GB');
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const pane = $('pane');
  const hhmm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

  Net.on('err', m => Desk.toast('Oops', m.msg, 3500));
  // guests vs members (js/guest.js): it belongs right after js/net.js in index.html; until it's there, load it now
  if (!window.Guest && window.Apps) Apps.load('js/guest.js').catch(() => {});

  // =============================================================== activity feed ("LIVE" ticker)
  const feed = [];
  const throttle = {};
  function activity(html, key, ms) {
    if (key) { const now = Date.now(); if (now - (throttle[key] || 0) < (ms || 3000)) return; throttle[key] = now; }
    feed.unshift({ html, ts: new Date() });
    if (feed.length > 12) feed.length = 12;
    $('liveTicker').innerHTML = html;
    $('feedBox').innerHTML = feed.map(f => `<div><span style="color:#888">${hhmm(f.ts)}</span> ${f.html}</div>`).join('');
  }
  const who = n => '<b>' + esc(n) + '</b>';

  // =============================================================== presence
  let online = [];
  const NAMES = { home: 'Home', demos: 'Games', grot: 'Gubbinz', saver: 'Screensaver', reviews: 'Reviews', cheats: 'Cheats', orks: 'Hobby Corner', letters: 'Letters', art: 'Art Wall', chat: 'Chat', forums: 'Forums', members: 'Members', starwars: 'Intergalactic Battles', comics: 'Comics', top10: 'Top 10s', quiz: 'Quiz', polls: 'Polls', compo: 'Compo', penpals: 'Pen Pals', downloads: 'Downloads', links: 'Links', hangout: 'Hangout', login: 'Login' };
  function renderOnline() {
    const others = online.filter(o => o.id !== Net.me.id);
    $('netCount').textContent = online.length;
    $('readersOnline').textContent = others.length ? `${others.length} other${others.length > 1 ? 's' : ''} here now` : 'just you';
    const counts = {};
    for (const o of others) counts[o.where] = (counts[o.where] || 0) + 1;
    document.querySelectorAll('.mbtn').forEach(b => {
      const n = counts[b.dataset.go] || 0, el = b.querySelector('.here');
      el.textContent = n; el.classList.toggle('show', n > 0); el.title = n + ' here';
    });
    $('nickList').innerHTML = online.map(o => `<li class="${o.id === Net.me.id ? 'me' : ''}" style="color:${esc(o.col)}">${o.member ? `<span class="star" title="JackNet member">\u2605</span><a href="#" class="plink" data-profile="${esc(o.nick)}" style="color:${esc(o.col)}">${esc(o.nick)}</a>` : esc(o.nick)}${o.where && NAMES[o.where] ? ` <small>(${NAMES[o.where]})</small>` : ''}</li>`).join('');
  }
  Net.on('online', m => {
    const before = new Map(online.map(o => [o.id, o]));
    const now = new Map(m.online.map(o => [o.id, o]));
    if (before.size) {
      for (const [id, o] of now) if (!before.has(id) && id !== Net.me.id) { activity(`${who(o.nick)} turned up`); Sound.play('join'); }
      for (const [id, o] of before) if (!now.has(id) && id !== Net.me.id) activity(`${who(o.nick)} left`);
    }
    online = m.online; renderOnline();
  });
  Net.on('_close', () => { $('liveTicker').textContent = 'Connection lost... redialling...'; });
  let whereTimer = null, pageWord = '';
  document.addEventListener('section', ev => {
    const d = String(ev.detail || ''); pageWord = d.startsWith('secret:') ? d.slice(7) : '';
    clearTimeout(whereTimer); whereTimer = setTimeout(() => Net.send({ t: 'where', s: d }), 250);
    checkLoc();
  });

  // =============================================================== other people's cursors
  // You only see someone's arrow when you're in EXACTLY the same place: same page AND the same game / forum topic /
  // profile / hidden page. Positions are fractions of an anchor element (the game canvas, or the page content), so the
  // arrow points at the same thing even when the two of you are scrolled differently or have different-sized windows.
  const ghosts = new Map();
  const ARROW = '<svg viewBox="0 0 14 20"><path d="M1 1 L1 16 L5 12 L8 19 L10 18 L7 11 L13 11 Z" fill="COL" stroke="#000" stroke-width="1"/></svg>';
  const short = s => (hash(s) % 1679616).toString(36); // up to 4 chars
  const DEMO_ANCHOR = { tris: '.gbshell', cube: '#cubeHost', squig: '#squig', stick: '#stickzone', arcade: '#arcade' };
  // Only on JACK ATTACK! itself (its sections, the Games Arcade and Jack's own hidden pages): never on the other sites of the
  // fake web. And only when you're looking at the same part of the page (the key carries which screenful you're scrolled to).
  function location99() { const l = place99(); if (!l.key) return l; const pg = $('page'), vh = Math.max(200, pg.clientHeight); const v = Math.min(99, Math.floor((pg.scrollTop + vh / 2) / (vh * 0.8))); const k = l.key.length > 13 ? l.key.slice(0, 9) + short(l.key) : l.key; return { key: k + 'v' + v, anchor: l.anchor }; }
  function place99() { // -> { key (server keeps [a-z0-9-], 16 chars), anchor element }
    const sec = Desk.current || 'home';
    if (sec === 'secret') { const onMag = /^https?:\/\/(www\.)?(jackattack\.jnet|jacklm\.com)\//i.test($('addrBar').value || ''); return { key: pageWord && onMag ? ('pg-' + pageWord.replace(/[^a-z0-9]/g, '')).slice(0, 16) : '', anchor: $('s-secret') }; }
    if (sec === 'demos') {
      const d = document.querySelector('#s-demos .demo:not([hidden])'), which = d ? d.dataset.demo : '';
      const sub = which === 'arcade' ? (window.Arcade && Arcade.current) || 'arcade' : which;
      const a = d && DEMO_ANCHOR[which] && d.querySelector(DEMO_ANCHOR[which]);
      return { key: ('demos-' + sub).slice(0, 16), anchor: a && a.offsetWidth ? a : $('s-demos') };
    }
    if (sec === 'forums') { const w = window.Community && Community.where ? Community.where() : ''; return { key: ('forum' + (w ? '-' + w : '')).slice(0, 16), anchor: $('forumView') }; }
    if (sec === 'members') { const w = window.Community && Community.where ? Community.where('members') : ''; return { key: 'members' + (w ? '-' + short(w) : ''), anchor: $('memView') }; }
    const el = $('s-' + sec), sub = el && el.dataset.sub ? '-' + el.dataset.sub : ''; // new sections can set data-sub (e.g. which comic strip)
    return { key: (sec + sub).replace(/[^a-z0-9-]/g, '').slice(0, 16), anchor: el || pane };
  }
  let loc = { key: '', anchor: pane };
  function clearGhosts() { for (const gh of ghosts.values()) gh.el.remove(); ghosts.clear(); }
  function checkLoc() {
    const l = location99();
    loc.anchor = l.anchor;
    if (l.key === loc.key) return;
    const was = loc.key; loc = l; clearGhosts();
    if (was) Net.send({ t: 'c', s: was, x: -9, y: -9 }); // tell everyone my arrow has left wherever it was
  }
  setInterval(checkLoc, 400);
  function placeGhost(gh) {
    const a = loc.anchor && loc.anchor.isConnected ? loc.anchor : pane;
    const ar = a.getBoundingClientRect(), pr = pane.getBoundingClientRect(), vr = $('page').getBoundingClientRect();
    const cx = ar.left + gh.x * ar.width, cy = ar.top + gh.y * ar.height;
    const show = gh.x >= 0 && a.offsetWidth > 0 && cx >= Math.max(pr.left, vr.left) && cx <= Math.min(pr.right, vr.right) - 8 && cy >= Math.max(pr.top, vr.top) && cy <= Math.min(pr.bottom, vr.bottom) - 8;
    gh.el.style.display = show ? '' : 'none';
    if (show) { gh.el.style.left = (cx - pr.left) + 'px'; gh.el.style.top = (cy - pr.top) + 'px'; }
  }
  Net.on('c', m => {
    let gh = ghosts.get(m.id);
    if (!loc.key || m.s !== loc.key || !(m.x >= 0)) { if (gh) { gh.el.remove(); ghosts.delete(m.id); } return; }
    if (!gh) {
      const el = document.createElement('div'); el.className = 'ghost';
      el.innerHTML = ARROW.replace('COL', esc(m.col)) + '<span></span>';
      pane.appendChild(el); gh = { el, t: 0, x: 0, y: 0 }; ghosts.set(m.id, gh);
    }
    const sp = gh.el.querySelector('span'); sp.textContent = m.nick; sp.style.background = m.col;
    gh.x = Math.min(1.5, +m.x || 0); gh.y = Math.max(-0.5, Math.min(1.5, +m.y || 0)); gh.t = Date.now();
    placeGhost(gh);
  });
  const replace = () => ghosts.forEach(placeGhost);
  $('page').addEventListener('scroll', () => { checkLoc(); replace(); }, { passive: true });
  addEventListener('resize', replace);
  Net.on('gone', m => { const gh = ghosts.get(m.id); if (gh) { gh.el.remove(); ghosts.delete(m.id); } });
  setInterval(() => { for (const [id, gh] of ghosts) if (Date.now() - gh.t > 15000) { gh.el.remove(); ghosts.delete(id); } }, 5000);
  let lastCur = 0, curIn = false;
  pane.addEventListener('pointermove', ev => {
    const now = performance.now();
    if (now - lastCur < 90) return;
    lastCur = now;
    if (!loc.key) checkLoc();
    if (!loc.key) return;
    const a = loc.anchor && loc.anchor.isConnected ? loc.anchor : pane, r = a.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    const inside = !(x < 0 || x > 1.5 || y < -0.5 || y > 1.5);
    if (inside) Net.send({ t: 'c', s: loc.key, x: +x.toFixed(4), y: +y.toFixed(4) });
    else if (curIn) Net.send({ t: 'c', s: loc.key, x: -9, y: -9 });
    curIn = inside;
  }, { passive: true });
  pane.addEventListener('pointerleave', () => { if (curIn && loc.key) Net.send({ t: 'c', s: loc.key, x: -9, y: -9 }); curIn = false; });

  // =============================================================== welcome snapshot
  Net.on('welcome', m => {
    const s = String(m.visitorNo).padStart(6, '0');
    $('readerNo').innerHTML = [...s].map(c => '<b>' + c + '</b>').join('');
    $('readerNo').setAttribute('aria-label', String(m.visitorNo));
    online = m.online; renderOnline();
    Net.send({ t: 'where', s: Desk.current });
    setButton(m.button, m.buttonBy);
    renderWho();
    pet = m.pet; renderPet();
    setWaaagh(m.waaagh); $('wCount').textContent = fmt(m.waaaghs); $('wBy').textContent = m.waaaghLastBy || 'nobody';
    wallInit(m.wall, m.wallW, m.wallH);
    pollOptions = m.pollOptions; poll = m.poll; voted = m.voted; renderPoll();
    chatLog.innerHTML = ''; m.chat.forEach(addChat); addChat({ sys: true, text: `*** Now talking in #jackattack as ${m.nick}`, ts: Date.now() });
    gb = m.gb; gbTotal = m.gbTotal; gbShown = 6; renderGb();
    const others = m.online.length - 1;
    activity(others > 0 ? `You're not alone. ${others} other${others > 1 ? 's are' : ' is'} on the site right now.` : `Nobody else is here right now... but they will be.`);
  });

  // =============================================================== THE BUTTON
  function setButton(n, by) { $('btnCount').textContent = fmt(n); if (by) $('btnBy').textContent = by; }
  $('theButton').addEventListener('click', () => { Net.send({ t: 'btn' }); Sound.play('button'); });
  Net.on('btn', m => { setButton(m.n, m.by); if (m.by !== Net.me.nick) activity(`${who(m.by)} pressed the button`, 'btn', 4000); });

  // =============================================================== cube / scores / flings in the feed
  Net.on('cubeMv', m => { if (m.by !== Net.me.nick) activity(`${who(m.by)} is turning the MegaCube`, 'cube', 6000); });
  Net.on('cubeScrambled', m => activity(`${who(m.by)} SCRAMBLED the MegaCube!`));
  Net.on('cubeSolved', m => { activity(`${who(m.by)} SOLVED THE MEGACUBE!!!`); Desk.toast('MegaCube', m.by + ' solved the cube!', 6000); });
  Net.on('scores', m => { if (m.list[0]) activity(`Blobbit Lob high scores updated. Top lob: ${who(m.list[0].n)} ${(m.list[0].s / 10).toFixed(1)}m`); });
  Net.on('flings', () => activity('Somebody chucked a stickman', 'fling', 8000));

  // =============================================================== GUBBINZ THE GROT
  let pet = null, petSayUntil = 0;
  const LCD = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];
  const SAY = {
    feed: ["'Mmm, pizza!'", "'MORE! MORE!'", "'Burp. Ta very much.'", "'Is this Sunny Dee? NICE.'"],
    play: ["'Weeee! Again! AGAIN!'", "'I got the stick! I GOT THE STICK!'", "'Best. Game. EVER.'"],
    clean: ["'Oi! That's COLD!'", "'I'm all shiny now. Like a new Game Lad.'", "'Not the ears! NOT THE EARS!'"],
    hatch: ["'Wot? Where am I? Is there food?'"],
    hungry: ["'My belly's rumblin...'", "'Anyone got a jelly baby?'", "'So... hungry...'"],
    bored: ["'I'm bored. Can we play Blockology?'", "'Play with me!'"],
    dirty: ["'I smell like Dave's PE kit.'", "'There's flies on me. Again.'"],
    happy: ["'It looks like you're looking after a pet! Good job!'", "'Booyah! (a small one)'", "'Life's good when you've got snacks.'", "'When's Jack comin' back?'"],
  };
  const DID = { feed: 'fed Gubbinz', play: 'played fetch with Gubbinz', clean: 'hosed Gubbinz down', hatch: 'hatched a new Gubbinz' };
  function mood() {
    if (!pet) return 'happy';
    if (pet.food < 30) return 'hungry';
    if (pet.clean < 30) return 'dirty';
    if (pet.fun < 30) return 'bored';
    return 'happy';
  }
  function roman(n) { if (n >= 40) return String(n); let s = ''; for (const [v, l] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += l; n -= v; } return s; }
  function bar(id, v) { const b = $(id); b.firstElementChild.style.width = Math.max(0, Math.min(100, v)) + '%'; b.classList.toggle('low', v < 30); }
  function renderPet() {
    if (!pet) return;
    $('petName').textContent = (pet.dead ? 'R.I.P. ' : '') + 'GUBBINZ ' + roman(pet.gen);
    bar('barFood', pet.food); bar('barFun', pet.fun); bar('barClean', pet.clean);
    const hrs = (Date.now() - pet.born) / 3600000;
    $('petAge').textContent = pet.dead ? 'GONE TO THE BIG BIN' : 'AGE: ' + (hrs < 48 ? Math.floor(hrs) + ' HRS' : Math.floor(hrs / 24) + ' DAYS') + '  FED ' + pet.feeds + 'x';
    $('petBy').textContent = pet.lastBy || 'nobody';
    $('petDeaths').textContent = pet.deaths;
    $('petHatch').hidden = !pet.dead;
    document.querySelectorAll('[data-pet]').forEach(b => { if (b.dataset.pet !== 'hatch') b.disabled = pet.dead; });
    if (pet.dead) $('petSays').textContent = 'Gubbinz has died. Nobody fed him. Hatch a new one?';
    else if (Date.now() > petSayUntil) $('petSays').textContent = pick(SAY[mood()]);
  }
  Net.on('pet', m => {
    pet = m.pet;
    if (m.did && SAY[m.did]) {
      petSayUntil = Date.now() + 4000;
      $('petSays').textContent = pick(SAY[m.did]);
      if (m.by) activity(`${who(m.by)} ${DID[m.did]}`, 'pet', 2500);
      Sound.play('pet');
    }
    renderPet();
  });
  Net.on('petSay', m => { $('petSays').textContent = m.text; petSayUntil = Date.now() + 2000; });
  document.querySelectorAll('[data-pet]').forEach(b => b.addEventListener('click', () => Net.send({ t: 'pet', a: b.dataset.pet })));
  setInterval(() => { if (pet && !pet.dead && Date.now() > petSayUntil + 6000) { renderPet(); petSayUntil = Date.now() + 4000; } }, 4000);

  function drawPet(g, t, forceMood) {
    const P = (x, y, w, h, c) => { g.fillStyle = LCD[c]; g.fillRect(x, y, w, h); };
    P(0, 0, 48, 48, 3);
    if (!pet && !forceMood) return;
    if (pet && pet.dead && !forceMood) {
      P(14, 12, 20, 28, 1); P(16, 10, 16, 2, 1); P(18, 8, 12, 2, 1); P(16, 14, 16, 24, 2);
      g.fillStyle = LCD[0]; g.font = 'bold 7px monospace'; g.fillText('RIP', 18, 24);
      P(23, 28, 2, 8, 0); P(20, 30, 8, 2, 0); P(6, 40, 36, 2, 1);
      return;
    }
    const m = forceMood || mood(), bob = Math.floor(t / 500) % 2, blink = (t % 3200) < 150;
    const y0 = bob + (m === 'happy' && Math.floor(t / 250) % 8 < 2 ? -2 : 0);
    P(19, 38 + y0, 3, 5 - y0, 1); P(26, 38 + y0, 3, 5 - y0, 1); P(17, 42, 6, 2, 0); P(25, 42, 6, 2, 0);
    P(18, 28 + y0, 12, 11, 1); P(19, 29 + y0, 10, 9, 2); P(18, 33 + y0, 12, 1, 0);
    const wave = m === 'happy' ? (Math.floor(t / 300) % 2) * -3 : 0;
    P(14, 29 + y0 + wave, 4, 2, 1); P(13, 30 + y0 + wave, 2, 5, 1); P(30, 29 + y0, 4, 2, 1); P(33, 30 + y0, 2, 5, 1);
    P(17, 14 + y0, 14, 13, 1); P(18, 13 + y0, 12, 1, 1); P(18, 15 + y0, 12, 11, 2);
    for (let i = 0; i < 6; i++) { P(16 - i * 1.5, 16 + y0 - (i >> 1), 2, 4 - (i >> 2), 1); P(30 + i * 1.5, 16 + y0 - (i >> 1), 2, 4 - (i >> 2), 1); }
    if (blink) { P(20, 18 + y0, 3, 1, 0); P(25, 18 + y0, 3, 1, 0); }
    else { P(20, 17 + y0, 3, 3, 0); P(25, 17 + y0, 3, 3, 0); P(21, 17 + y0, 1, 1, 3); P(26, 17 + y0, 1, 1, 3); }
    if (m === 'bored' || m === 'hungry') { P(19, 16 + y0, 4, 1, 0); P(25, 16 + y0, 4, 1, 0); }
    P(23, 19 + y0, 2, 4, 1); P(24, 23 + y0, 1, 1, 1);
    if (m === 'happy') { P(20, 24 + y0, 8, 1, 0); P(19, 23 + y0, 1, 1, 0); P(28, 23 + y0, 1, 1, 0); P(21, 25 + y0, 1, 1, 3); P(26, 25 + y0, 1, 1, 3); }
    else { P(20, 25 + y0, 8, 1, 0); P(19, 26 + y0, 1, 1, 0); P(28, 26 + y0, 1, 1, 0); }
    if (m === 'hungry') { g.fillStyle = LCD[0]; g.font = 'bold 10px monospace'; g.fillText('!', 38, 12); }
    if (m === 'dirty' || (pet && pet.clean < 45 && !forceMood)) {
      P(36, 41, 6, 2, 1); P(37, 39, 4, 2, 1); P(38, 37, 2, 2, 1);
      const a = t / 300;
      P(Math.round(38 + Math.cos(a) * 4), Math.round(30 + Math.sin(a * 1.3) * 3), 1, 1, 0);
      P(Math.round(10 + Math.cos(a + 2) * 4), Math.round(20 + Math.sin(a * 1.1) * 3), 1, 1, 0);
    }
    if (m === 'bored') { g.fillStyle = LCD[1]; g.font = 'bold 7px monospace'; g.fillText('z', 36, 10 + bob); }
  }
  const petCtx = $('petCanvas').getContext('2d'), edCtx = $('edGrot').getContext('2d');
  (function petLoop(t) {
    t = t || 0;
    if (Desk.current === 'grot') drawPet(petCtx, t);
    if (Desk.current === 'home') drawPet(edCtx, t, 'happy');
    requestAnimationFrame(petLoop);
  })();

  // =============================================================== WAAAGH!
  function setWaaagh(v) { $('wFill').style.width = v + '%'; $('wPct').textContent = Math.floor(v) + '%'; }
  Net.on('waaaghLvl', m => { setWaaagh(m.v); if (m.v > 30) activity(`The WAAAGH! is building... ${Math.floor(m.v)}%`, 'wlvl', 5000); });
  $('waaaghBtn').addEventListener('click', () => { Net.send({ t: 'waaagh' }); Sound.play('click'); });
  Net.on('WAAAGH', m => {
    setWaaagh(0); $('wCount').textContent = fmt(m.n); $('wBy').textContent = m.by;
    $('waaaghFlashBy').textContent = `WAAAGH #${m.n} called by ${m.by}!`;
    $('waaaghFlash').style.display = 'flex';
    document.body.classList.add('shake');
    Sound.play('waaagh');
    activity(`${who(m.by)} called a WAAAGH!!!`);
    setTimeout(() => { $('waaaghFlash').style.display = 'none'; document.body.classList.remove('shake'); }, 2600);
  });

  // =============================================================== ART WALL
  const PAL = ['#ffffff', '#000000', '#808080', '#c0c0c0', '#ff0000', '#800000', '#ffff00', '#808000', '#00ff00', '#008000', '#00ffff', '#008080', '#0000ff', '#000080', '#ff00ff', '#800080'];
  const wc = $('wall'), wg = wc.getContext('2d');
  let wall = null, WW = 64, WH = 40, colour = 1, painting = false, lastCell = -1, paintCol = 1;
  const ink = { t: 14, last: Date.now() };
  function takeInk() { const now = Date.now(); ink.t = Math.min(30, ink.t + (now - ink.last) / 1000 * 14); ink.last = now; if (ink.t < 1) return false; ink.t--; return true; }
  function cell(i, c) { wg.fillStyle = PAL[c]; wg.fillRect((i % WW) * 10, Math.floor(i / WW) * 10, 10, 10); }
  function wallInit(str, w, h) { WW = w; WH = h; wall = str.split('').map(ch => parseInt(ch, 16)); wall.forEach((c, i) => cell(i, c)); }
  Net.on('px', m => { if (wall) { wall[m.i] = m.c; cell(m.i, m.c); } activity('Somebody is drawing on the Art Wall', 'px', 15000); });
  Net.on('wall', m => wallInit(m.wall, WW, WH));
  const palEl = $('palette');
  PAL.forEach((c, i) => {
    const b = document.createElement('b'); b.style.background = c; b.title = c; b.setAttribute('role', 'button'); b.setAttribute('aria-label', 'Colour ' + c); b.tabIndex = 0;
    b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); b.click(); } });
    if (i === colour) b.className = 'sel';
    b.addEventListener('click', () => { colour = i; palEl.querySelectorAll('b').forEach(x => x.className = ''); b.className = 'sel'; });
    palEl.appendChild(b);
  });
  function wallCellAt(ev) {
    const r = wc.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left) / r.width * WW), y = Math.floor((ev.clientY - r.top) / r.height * WH);
    return (x < 0 || y < 0 || x >= WW || y >= WH) ? -1 : y * WW + x;
  }
  function paint(i, c) {
    if (i < 0 || !wall || wall[i] === c) return;
    if (!takeInk()) { $('wallInfo').textContent = 'Out of ink! Slow down a bit.'; return; }
    wall[i] = c; cell(i, c);
    Net.send({ t: 'px', i, c });
  }
  function paintLine(a, b, c) {
    if (a < 0) return paint(b, c);
    let x0 = a % WW, y0 = Math.floor(a / WW); const x1 = b % WW, y1 = Math.floor(b / WW);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let n = 0; n < 200; n++) {
      paint(y0 * WW + x0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  wc.addEventListener('contextmenu', ev => ev.preventDefault());
  wc.addEventListener('pointerdown', ev => {
    wc.setPointerCapture(ev.pointerId);
    painting = true; paintCol = ev.button === 2 ? 0 : colour;
    lastCell = wallCellAt(ev); paint(lastCell, paintCol);
    $('wallInfo').textContent = 'Drawing in ' + PAL[paintCol];
  });
  wc.addEventListener('pointermove', ev => { if (!painting) return; const i = wallCellAt(ev); if (i !== lastCell && i >= 0) { paintLine(lastCell, i, paintCol); lastCell = i; } });
  const stopPaint = () => { painting = false; lastCell = -1; };
  wc.addEventListener('pointerup', stopPaint); wc.addEventListener('pointercancel', stopPaint);

  // =============================================================== POLL
  let poll = [], pollOptions = [], voted = -1;
  function renderPoll() {
    const total = poll.reduce((a, b) => a + b, 0), max = Math.max(1, ...poll);
    const box = $('pollBox'); box.innerHTML = '';
    pollOptions.forEach((o, i) => {
      const row = document.createElement('div'); row.className = 'pollrow';
      const lab = document.createElement(voted < 0 ? 'button' : 'span');
      lab.textContent = o;
      if (voted < 0) { lab.className = 'btn'; lab.addEventListener('click', () => Net.send({ t: 'vote', o: i })); }
      else if (i === voted) lab.style.fontWeight = 'bold';
      const wrap = document.createElement('div');
      const b = document.createElement('div'); b.className = 'pollbar'; b.style.width = (poll[i] / max * 100) + '%';
      wrap.appendChild(b);
      const n = document.createElement('span'); n.textContent = (total ? Math.round(poll[i] / total * 100) : 0) + '%';
      row.append(lab, wrap, n); box.appendChild(row);
    });
    $('pollNote').textContent = voted < 0 ? 'Click a game to vote. One vote per computer!' : `Thanks for voting! ${fmt(total)} vote${total === 1 ? '' : 's'} so far.`;
  }
  Net.on('poll', m => { poll = m.poll; renderPoll(); activity('Somebody voted for Game of the Year', 'poll', 10000); });
  Net.on('voted', m => { voted = m.o; renderPoll(); Sound.play('pet'); });

  // =============================================================== CHAT
  const chatLog = $('chatLog');
  function addChat(m) {
    const atBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 40;
    const ts = `[${hhmm(new Date(m.ts || Date.now()))}] `;
    const line = document.createElement('div');
    if (m.sys) { line.className = 'sys'; line.innerHTML = `<span class="ts">${ts}</span>${esc(String(m.text || '').replace(/\bORK INVADERS\b/g, 'SAUCER INVADERS').replace(/\bWHACK-A-GROT\b/g, 'WHACK-A-ROBOT').replace(/\bSQUIG LOB\b/g, 'BLOBBIT LOB'))}`; } // (old high-score lines in the log use the games' old names)
    else if (m.me) line.innerHTML = `<span class="ts">${ts}</span><span style="color:#9c009c">* ${esc(m.nick)} ${esc(m.text)}</span>`;
    else line.innerHTML = `<span class="ts">${ts}</span>&lt;<b style="color:${esc(m.col)}">${m.mem ? `<a href="#" class="plink" data-profile="${esc(m.nick)}" style="color:${esc(m.col)}">${esc(m.nick)}</a>` : esc(m.nick)}</b>&gt; ${esc(m.text)}`;
    chatLog.appendChild(line);
    while (chatLog.children.length > 120) chatLog.firstChild.remove();
    if (atBottom) chatLog.scrollTop = chatLog.scrollHeight;
  }
  Net.on('chat', m => {
    addChat(m.m);
    if (!m.m.sys && m.m.nick !== Net.me.nick) {
      const irc = window.JackIRC && JackIRC.open; // JackIRC (#jackattack) has its own sounds; the Hangout shows bubbles
      if (!irc) Sound.play('uhoh');
      activity(`${who(m.m.nick)} said something in #jackattack`, 'chat', 8000);
      if (!irc && Desk.current !== 'hangout') Desk.toast(m.m.nick + ' in #jackattack:', m.m.text.slice(0, 80), 3500);
    }
  });
  Net.on('chatClear', () => { chatLog.innerHTML = ''; });
  $('chatForm').addEventListener('submit', ev => {
    ev.preventDefault();
    let text = $('chatInput').value.trim();
    if (!text) return;
    let me = false;
    if (/^\/me\s+/i.test(text)) { me = true; text = text.replace(/^\/me\s+/i, ''); }
    else if (/^\/nick\b/i.test(text)) { $('chatInput').value = ''; logon(); return; }
    else if (window.SiteChat && SiteChat.command(text)) { $('chatInput').value = ''; return; }
    if (Net.send({ t: 'chat', text, me })) $('chatInput').value = '';
    else Desk.toast('Chat', 'Not connected. Redialling...');
  });
  Net.on('you', () => { renderWho(); renderOnline(); });

  // =============================================================== JackNet membership: you log on with the JackNet logon screen (boot / Start > Log Off / the site's [Log on])
  function renderWho() {
    const me = Net.me;
    $('whoami').innerHTML = me.member
      ? `You are <b>${esc(me.nick)}</b> <span class="star">\u2605 member #${me.no}</span>`
      : `You are <b>${esc(me.nick)}</b> (guest). <a href="#" data-jlogon>Log on or join</a> to pick your own name!`;
    $('logBtn').textContent = me.member ? 'Log off' : 'Log on / Join FREE';
    const gn = $('gbName');
    if (me.member) { gn.value = me.nick; gn.readOnly = true; $('gbNameNote').textContent = 'Signed as a JackNet member.'; }
    else { if (gn.readOnly) gn.value = ''; gn.readOnly = false; $('gbNameNote').textContent = ''; }
    document.dispatchEvent(new CustomEvent('jacknet-who'));
  }
  function logOff() { if (window.JackLogon) JackLogon.logoff(); }
  function logon() { if (window.JackLogon) JackLogon.show(); }
  Net.on('loginErr', m => { if (!(window.SiteLogin && SiteLogin.error(m.msg))) Desk.toast('JackNet', m.msg); });
  Net.on('loginOk', m => {
    renderWho(); renderOnline(); Sound.play('solve');
    if (window.SiteLogin) SiteLogin.ok(m);
    else Desk.toast('JackNet', m.isNew ? `Welcome to JackNet, ${m.nick}! You're member #${m.no}.` : `Welcome back, ${m.nick}!`);
  });
  $('logBtn').addEventListener('click', () => Net.me.member ? logOff() : logon());
  window.JackNetWeb = { logon, logOff, renderWho };

  // =============================================================== LETTERS
  const REPLIES = [
    "Cheers! Squirturtle forever.",
    "Ta very much! Gubbinz says hello. Well, he says 'OI', but he means hello.",
    "Brilliant letter. You win... nothing. Sorry, there's no budget.",
    "My mom read this and said it was lovely. So that's two of us.",
    "HADOOKEN! That's Street Frightener for 'thank you'.",
    "Have you tried blowing on the cartridge?",
    "Totally agree. Except the bit about Oddbob.",
    "This is going in the next issue. Whenever that is.",
    "Ace. Now go and feed Gubbinz.",
    "Can't argue with that. Well, I could, but I won't.",
    "Have you had a go on the MegaCube yet? Nobody can solve it.",
    "Gubbinz chewed the corner of your letter. Sorry about that.",
    "Best letter I've had all week!",
    "Funny, Dave said exactly the same thing.",
    "Red ones DO go faster. Science.",
    "Thanks for writing in! I'll be here. Probably.",
    "May the Farce be with you. (Sorry. Had to.)",
    "I've read this three times, like I've seen Episode I three times. Both worth it.",
    "Dark Mole would approve. He doesn't say much, but he'd nod.",
    "Did you know there's an Intergalactic Battles page now? Click Intergalactic Battles. Then write again.",
    "This is better than the peapod race commentary. And that bloke has two heads.",
    "Printed this out and stuck it on the fridge. Mom moved it. It's back.",
    "A letter! An actual letter! Gubbinz is doing a little dance.",
    "Red ones go faster, and so do people who write in. Fact.",
    "Have you done the Nerd Quiz yet? I bet you'd get ten out of ten. Prove it.",
    "Jar Jar Jams would've written something longer. Yours is better.",
    "Dave says he wrote one too. Dave's letter is not here. Draw your own conclusions.",
  ];
  let gb = [], gbTotal = 0, gbShown = 6;
  function ago(ts) {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' minutes ago';
    if (s < 86400) { const h = Math.round(s / 3600); return h + ' hour' + (h > 1 ? 's' : '') + ' ago'; }
    const d = Math.round(s / 86400);
    if (d < 60) return d + ' day' + (d > 1 ? 's' : '') + ' ago';
    const mo = Math.round(d / 30); return mo < 24 ? mo + ' months ago' : 'ages ago';
  }
  function letterEl(e, star) {
    const el = document.createElement('div'); el.className = 'letter' + (star ? ' star' : '');
    el.innerHTML = `<div class="lh"><span>${e.found === 'E-mail' ? '<span class="envbadge" title="Sent by e-mail">&#9993; E-MAIL</span>' : ''}${esc(e.name)}${e.from ? ', ' + esc(e.from) : ''}${star ? '<span class="starbadge">STAR LETTER</span>' : ''}</span><span>${ago(e.ts)}</span></div><div class="lb">${esc(e.msg)}</div><div class="ed"><b>JACK SAYS:</b> ${esc(REPLIES[hash(e.id) % REPLIES.length])}</div>`;
    return el;
  }
  function renderGb() {
    $('gbTotal').textContent = fmt(gbTotal);
    const list = $('gbList'); list.innerHTML = '';
    if (!gb.length) { list.innerHTML = '<p style="font:400 22px var(--comic)">No letters yet! Be the first!!!</p>'; $('gbMore').hidden = true; return; }
    const day = Math.floor(Date.now() / 86400000);
    const pool = gb.slice(0, 20), star = pool[hash('star' + day) % pool.length];
    list.appendChild(letterEl(star, true));
    for (const e of gb.filter(e => e !== star).slice(0, gbShown)) list.appendChild(letterEl(e, false));
    $('gbMore').hidden = gb.length - 1 <= gbShown;
  }
  $('gbMore').addEventListener('click', () => { gbShown += 6; renderGb(); });
  Net.on('gb', m => { gb.unshift(m.e); if (gb.length > 50) gb.length = 50; gbTotal = m.total; renderGb(); activity(`${who(m.e.name)} wrote a letter`); });
  Net.on('gbAll', m => { gb = m.gb; gbTotal = gb.length; renderGb(); });
  $('gbForm').addEventListener('submit', ev => {
    ev.preventDefault();
    const e = { t: 'gb', name: Net.me.member ? Net.me.nick : $('gbName').value, from: $('gbFrom').value, found: $('gbFound').value, msg: $('gbMsg').value };
    if (!e.name.trim() || !e.msg.trim()) return Desk.msgbox('Letters', 'Please write your name AND a letter!', 'warn');
    if (!Net.send(e)) Desk.toast('Letters', 'Not connected. Is someone on the phone?');
  });
  Net.on('gbOk', () => { $('gbMsg').value = ''; Desk.toast('Letters', 'Letter sent! Thanks for writing in.'); Sound.play('solve'); });

  Net.start();
})();

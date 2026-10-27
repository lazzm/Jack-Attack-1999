/* zone-site.js: www.jacknetzone.jnet, the JackNet Gaming Zone's web site (lazy-loaded with the rest of the Zone).
 * Lobby, rooms, live tables, ladders, profiles, the weekly cup, chat, help and the Java Arcade are all web pages inside
 * JackNet Explorer. Sitting down, accepting an invite or watching opens the Zone game client as a separate desktop window. */
(function () {
  'use strict';
  const Z = window.Zone, GM = Z.GAMES, esc = Apps.esc, store = Apps.store, secret = Z.secret, sfx = Z.sfx;
  const H = 'http://' + Z.HOST;
  const L = (path, html, cls) => `<a href="${H}${path}"${cls ? ` class="${cls}"` : ''}>${html}</a>`;
  const meNick = () => Net.me.nick || 'Me', meId = () => Net.me.id, fieldOf = Z.fieldOf;
  const today = () => (Desk.today99 ? Desk.today99() : { m: 1, d: 1 });
  const pad2 = n => String(n).padStart(2, '0');
  const LV_COL = ['#39ff14', '#ffd400', '#ff3030'];

  // ================================================================ little bits of art
  const BOLT = '<svg class="jz-bolt" viewBox="0 0 20 40" aria-hidden="true"><path d="M13 0L2 23h7L5 40 18 14h-7z" fill="#ffe600" stroke="#ff7a00" stroke-width="1.2"/></svg>';
  const FLAMES = (() => { // pixel flames: two frames that flicker
    const frame = seed => { let s = seed, out = ''; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; for (let x = 0; x < 60; x++) { const h = 3 + Math.floor(r() * 7); for (let y = 0; y < h; y++) { const c = y > h - 2 ? '#fff6a0' : y > h - 4 ? '#ffd400' : y > 2 ? '#ff8a00' : '#e01010'; out += `<rect x="${x}" y="${11 - y}" width="1" height="1" fill="${c}"/>`; } } return out; };
    return `<div class="jz-flames" aria-hidden="true"><svg viewBox="0 0 60 12" preserveAspectRatio="none" shape-rendering="crispEdges">${frame(7)}</svg><svg viewBox="0 0 60 12" preserveAspectRatio="none" shape-rendering="crispEdges">${frame(31)}</svg></div>`;
  })();
  const NEW = '<span class="jz-new">NEW!</span>';
  const chrome = (text, tag) => `<${tag || 'h2'} class="jz-chrome"><span>${text}</span></${tag || 'h2'}>`;
  const PAL = { g: '#3aa83a', r: '#e01010', w: '#ffffff', y: '#ffd400', s: '#a0a0a8', c: '#00e5ff', b: '#2a50d0', l: '#9bff3a', k: '#111', o: '#ff8a00', p: '#9030c0', d: '#2a6a1a', f: '#f2c79a' };
  const AVATARS = [
    ['Gremlin', 'g......ggg.gg.gg.gggggg..grggrg..gggggg..gwwwwg...gggg....g..g..'],
    ['Robot', '...yy.....ssss...ssssss..sccscc..ssssss..sbbbbs..ssssss...s..s..'],
    ['Alien', '..llll...llllll.lkkllkkllkkllkkl.llllll...l..l....llll......ll...'],
    ['Ghost', '..wwww...wwwwww.wbbwwbbwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.ww.ww.'],
    ['Cat', 'o......ooo....oooooooooookooookooooppooo.oooooo..oooooo...o..o..'],
    ['Rocket', '...rr.....rwwr....wbbw....wwww....wwww...rwwwwr.rr.yy.rr...yy...'],
    ['Gork', '.kkkkkk.kkkkkkkkddddddddddrddddrddddddddddwdwwdwd.dddddd...d..d..'],
    ['Droid', '..bbbb...bwwwwb..bwkwwb..bbbbbb..wwwwww..wbwwbw..wwwwww..k....k.'],
    ['Ninja', '..kkkk...kkkkkk.kkkkkkkkkffffffkkfkffkfkkkkkkkkk.kkkkkk...k..k..'],
    ['Dragon', 'r.....r.rr...rr..rrrrrr.rryrryrrrrrrrrrr.rwrwrr...rrrr....r..r..'],
    ['Wizard', '...pp.....pppp...pppppp.pppppppp.ffffff..fkffkf..fwwwwf...wwww..'],
    ['Blobbit', '..oooo...oooooo.okooooookoooooooowwwwwwoowowowoo.oooooo..o....o.'],
  ];
  function avatar(i, cls) {
    const a = AVATARS[((i % 12) + 12) % 12][1]; let r = '';
    for (let k = 0; k < 64; k++) { const ch = a[k]; if (ch && ch !== '.' && PAL[ch]) r += `<rect x="${k % 8}" y="${k >> 3}" width="1" height="1" fill="${PAL[ch]}"/>`; }
    return `<svg class="jz-av${cls ? ' ' + cls : ''}" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
  }
  const hashNick = n => { let h = 7; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const avOf = nick => { const t = Z.parseTag(Z.ladder.tag[fieldOf(nick)]); return t ? t.av : hashNick(nick) % 12; };
  const tagOf = nick => { const t = Z.parseTag(Z.ladder.tag[fieldOf(nick)]); return t ? t.text : ''; };
  const who = (nick, col) => `<a class="jz-who" href="${Z.profilePage(fieldOf(nick))}"${col ? ` style="color:${esc(col)}"` : ''}>${avatar(avOf(nick))}${esc(nick)}</a>`;

  // banner adverts for other places on the fake web
  const ADS = [
    ['www.hamstercam.webcom', 'HAMSTER CAM', Cast.t('LIVE!!! {hamster} is awake RIGHT NOW. Probably.'), '#ffd400', '#7a3a00'],
    ['www.gemexchange.grot', 'GEM EXCHANGE', 'Da only shop wot takes Rupees. Free delivery (by grot).', '#3aa83a', '#000'],
    ['www.podracinghq.jnet', 'PEAPODRACING HQ', 'Pods! Drivers! Proof that Sebulbar cheats!', '#ff8a00', '#200040'],
    ['www.jackmail.webcom', 'JackMail', 'FREE E-mail! 2 MB of space!!! Never delete again!', '#00e5ff', '#002a5a'],
    ['www.jacksearch.find', 'JackSearch', 'Search the whole Web. Well, this bit of it.', '#ffffff', '#5a0000'],
    ['www.jackattack.jnet', 'JACK ATTACK!', 'The games mag that Jack made. Issue 7 OUT NOW!', '#ff2a6d', '#1b0f3a'],
    ['www.davesplace.jnet', "DAVE'S KOOL PAGE 2", 'TOTAL CARNAGE. Bedroom wrestling. Mr Tiddles.', '#ff3030', '#000'],
    ['www.getrichquick.w3b', 'MAKE MONEY FAST', 'The secret THEY don\'t want you to know!!! (paper round)', '#39ff14', '#003300'],
    ['www.ecardz.kidz', 'eCardz!', 'Send a FREE animated card to a mate. Dancing cake!', '#ff9ad5', '#400030'],
  ];
  const ad = () => { const [host, a, b, fg, bg] = ADS[Math.floor(Math.random() * ADS.length)]; return `<a class="jz-ad" href="http://${host}/" style="--fg:${fg};--bg:${bg}"><b>${esc(a)}</b><span>${esc(b)}</span><i>CLICK HERE!</i></a>`; };

  // ================================================================ rooms, themes and news
  const THEME = { reversi: 'felt', checkers: 'wood', c4: 'frame', ships: 'sea', ttt: 'paper', gomoku: 'paper', dots: 'paper', bg: 'tea', pong: 'space', chess: 'wood' };
  const MOTTO = {
    reversi: ['Everyone was a beginner once. Even Dave.', 'Flip it and reverse it. Then flip it again.', 'Corners or bust. No crying.'],
    checkers: ['Shut the door, there\'s a draught. (Sorry.)', 'Crowned heads only. And people hoping to be.', 'Silence please. Grandmasters thinking.'],
    c4: ['Drop it like it\'s a disc.', 'Free squash for anyone who wins diagonally.', 'Where diagonals go to win.'],
    ships: ['Armbands compulsory.', 'Arrr. No peeking at the other grid, matey.', 'Admirals only. Salute before firing.'],
    ttt: ['Draw a grid. Draw it again. Draw.', 'It\'s raining. Nobody is going out. Noughts it is.', 'Undefeated. Also unwon. Lots of draws.'],
    gomoku: ['Squared paper is the best paper.', 'Five! Alive! Five! Alive!', 'Bow to your opponent. Then block their four.'],
    dots: ['Join the dots. Steal the boxes.', 'Every box counts. Some count more.', 'Long chains. Cold hearts.'],
    bg: ['Tea, biscuits and gentle dice.', 'We count every pip. Twice.', 'No money changes hands. Biscuits might.'],
    pong: ['The queue was SO long. Play while you wait.', 'Young sabers learn to block here.', 'Only the fastest wrists survive.'],
    chess: ['Pawns welcome. Even the ones who move backwards (they can\'t).', 'Knights, bishops and the odd robot. Mind your queen.', 'Deep Jack sometimes watches from the corner. He\'s judging you.'],
  };
  const NEWS = [ // [day, month, title, body] by ZoneMaster Gubbinz. Only posts up to "today" in 1999 are shown.
    [3, 1, 'Happy New Year from the Zone!', 'The Zone is open for 1999! This year we\'ve got more games, more rooms and less lag (Jack says that last bit is not a promise).'],
    [14, 2, 'Valentine\'s tournament: CANCELLED', 'Nobody signed up. Dave says he was "busy". Mom says that is fine.'],
    [1, 4, 'Ratings reset to 1,000,000!', 'April fool! They are still 1200. Dave believed it for two hours.'],
    [14, 5, 'Version 1.9 is OUT!', 'New: Battleships with sealed secret fleets, so NOBODY can move their ships halfway through. Not even Dave. ESPECIALLY not Dave.'],
    [19, 5, 'Episode I is out in America today', 'We have to wait till 16 July here. That is 58 more days of Reversi. The Peapod Race Lounge will open when the film does.'],
    [12, 6, 'Backgammon tables open', 'The Tea Room is now serving Backgammon. No doubling cube. Jack\'s Mom says it looks like gambling, and she is the boss.'],
    [16, 7, 'EPISODE I DAY! Spatula Pong is LIVE', 'It is finally out in the UK! To celebrate: Spatula Pong, a real-time space duel in the Peapod Race Lounge. Laser swords. A droid. Glory.'],
    [2, 8, 'Summer holidays = lag', 'Everyone is online at the same time. If it is laggy, blame the other kids. Or Mom on the phone.'],
    [11, 8, 'The eclipse!', 'The sun went out for a bit this morning. The Zone did not. That is called reliability.'],
    [3, 9, 'Back to school', 'Homework first, then Checkers. That is the rule. (Jack\'s Mom wrote this bit.)'],
    [20, 9, 'Weekly Reversi Cup starts!', 'Sign up on the Tournaments page. Eight players, one cup, no crying. Winners go in the Hall of Fame forever (well, till Dave finds the delete button).'],
    [12, 10, 'Wall of Shame updated', 'Somebody typed KINGME 400 times in Checkers. It is still not a cheat. They are on the Wall now.'],
    [31, 10, 'Spooky Zone!', 'All the robots are wearing sheets. Happy Halloween. Do not eat the pumpkin pie, it is made of actual pumpkin.'],
    [5, 11, 'Bonfire Night lag warning', 'Dogs are barking, modems are screaming. Play indoors.'],
    [1, 12, 'Y2K: is the Zone ready?', 'Jack says yes. Dave says the tables will turn into Noughts & Crosses at midnight. We will see.'],
    [24, 12, 'Merry Christmas from Gubbinz', 'If you got a new 56K modem for Christmas: welcome to the Zone! If you got socks: also welcome.'],
  ];
  const newsNow = () => { const t = today(); return NEWS.filter(([d, m]) => m < t.m || (m === t.m && d <= t.d)).reverse(); };
  const newsDate = ([d, m]) => `${pad2(d)}/${pad2(m)}/99`;
  const isNew = ([d, m]) => { const t = today(); return (new Date(1999, t.m - 1, t.d) - new Date(1999, m - 1, d)) / 864e5 <= 7; };

  // ================================================================ shared counters: hits, cup, hall of fame
  const live = { hits: 0, quits: 0, hof: [], cup: {}, lag: 0 };
  let sharedLoaded = false;
  function loadMine() {
    if (sharedLoaded) return; sharedLoaded = true;
    let hit = false; try { hit = sessionStorage.getItem('jhp_zone_hit') === '1'; sessionStorage.setItem('jhp_zone_hit', '1'); } catch (e) {}
    if (!hit) Net.kv.inc('zone.hits');
    const t0 = performance.now();
    Net.kv.get(['zone.hits', 'zone.quits', 'zone.hof', 'zone.cup']).then(v => {
      live.lag = Math.round(performance.now() - t0);
      if (!v || !Object.keys(v).length) { sharedLoaded = false; return; }
      live.hits = +v['zone.hits'] || live.hits; live.quits = +v['zone.quits'] || 0;
      live.hof = Array.isArray(v['zone.hof']) ? v['zone.hof'] : [];
      live.cup = v['zone.cup'] && typeof v['zone.cup'] === 'object' ? v['zone.cup'] : {};
      cupTidy(); Z.changed();
    });
  }
  // back after a dropped connection: anything put while we were away (a cup result, a signup) never reached us, so re-read it,
  // and send the cup result we couldn't send at the time
  Net.on('welcome', () => setTimeout(() => {
    const pend = store.get('jhp_zone_cuppend', null);
    if (Array.isArray(pend) && pend.length === 2 && Net.kv.put('zone.cup', pend[0], pend[1])) store.set('jhp_zone_cuppend', null);
    if (sharedLoaded) { sharedLoaded = false; loadMine(); }
  }, 1000));
  Net.kv.watch('zone.hits', ev => { if (ev.type === 'set') { live.hits = ev.v; Z.changed(); } });
  Net.kv.watch('zone.quits', ev => { if (ev.type === 'set') { live.quits = ev.v; Z.changed(); } });
  Net.kv.watch('zone.hof', ev => { if (ev.type === 'push') { live.hof.push(ev.e); Z.changed(); } });
  Net.kv.watch('zone.cup', ev => { if (ev.type === 'put') { if (ev.v === '') delete live.cup[ev.f]; else live.cup[ev.f] = ev.v; Z.changed(); cupCheck(); } });

  // ================================================================ the Weekly Reversi Cup: 8 players, knockout, stored in one shared map
  const week = () => { const t = today(); return Math.floor((new Date(1999, t.m - 1, t.d) - new Date(1999, 0, 1)) / 864e5 / 7) + 1; };
  const wk = () => 'w' + week();
  function cupPlayers() {
    const pre = wk() + '.p.', out = [];
    for (const f of Object.keys(live.cup)) if (f.startsWith(pre)) { const m = /^([0-9a-z]{1,12})\|(.{1,24})$/.exec(live.cup[f]); if (m) out.push({ f: f.slice(pre.length), ts: parseInt(m[1], 36) || 0, nm: m[2] }); }
    return out.sort((a, b) => a.ts - b.ts).slice(0, 8);
  }
  const cupStarted = () => !!live.cup[wk() + '.go'];
  function cupBracket() {
    const ps = cupPlayers(), seeds = []; for (let i = 0; i < 8; i++) seeds.push(ps[i] ? ps[i].f : null);
    const res = (r, i) => live.cup[`${wk()}.m.${r}.${i}`];
    const memo = {};
    const winner = (r, i) => { // undefined = not decided yet, null = nobody (two byes)
      const k = r + '.' + i; if (k in memo) return memo[k];
      const a = slot(r, 2 * i), b = slot(r, 2 * i + 1); let w;
      if (a === undefined || b === undefined) w = undefined; else if (a === null && b === null) w = null; else if (a === null) w = b; else if (b === null) w = a;
      else { const x = res(r, i); w = x === a || x === b ? x : undefined; }
      return (memo[k] = w);
    };
    const slot = (r, i) => r === 0 ? seeds[i] : winner(r - 1, i);
    const rounds = [0, 1, 2].map(r => [...Array(4 >> r).keys()].map(i => ({ r, i, a: slot(r, 2 * i), b: slot(r, 2 * i + 1), w: winner(r, i) })));
    return { ps, rounds, champ: winner(2, 0), nm: f => { const p = ps.find(x => x.f === f); return p ? p.nm : f; } };
  }
  function myCupMatch() {
    if (!cupStarted()) return null; const me = fieldOf(meNick()), br = cupBracket();
    for (const rd of br.rounds) for (const m of rd) if (m.w === undefined && m.a && m.b && (m.a === me || m.b === me)) return { ...m, opp: m.a === me ? m.b : m.a, oppNm: br.nm(m.a === me ? m.b : m.a) };
    return null;
  }
  function cupTidy() { // forget old weeks (a few at a time, politely)
    let n = 0; for (const f of Object.keys(live.cup)) if (!f.startsWith(wk() + '.') && n++ < 30) Net.kv.put('zone.cup', f, '');
  }
  function cupCheck() {
    const br = cupBracket(), me = fieldOf(meNick());
    if (cupStarted() && br.champ && br.champ === me) { const k = 'jhp_zone_cupwon_' + wk(); if (!store.get(k, 0)) { store.set(k, 1); Net.kv.push('zone.hof', `won the Weekly Reversi Cup (week ${week()} of 1999)`); secret('zone.cupwin'); } }
  }
  Z.onResult = r => { // a finished online game: was it my cup match?
    if (r.g !== 'reversi' || r.draw) return;
    const m = myCupMatch(); if (!m || fieldOf(r.opp) !== m.opp) return;
    const ck = `${wk()}.m.${m.r}.${m.i}`, cv = r.won ? fieldOf(meNick()) : m.opp;
    if (!Net.kv.put('zone.cup', ck, cv)) store.set('jhp_zone_cuppend', [ck, cv]);
    setTimeout(cupCheck, 800);
  };

  // ================================================================ the page frame
  const NAV = [['/lobby.html', 'LOBBY'], ['/games.html', 'GAMES'], ['/multiplayer.html', 'MULTIPLAYER'], ['/ladders.html', 'LADDERS'], ['/tournaments.html', 'TOURNAMENTS'], ['/chat.html', 'CHAT'], ['/help.html', 'HELP'], ['/signup.html', 'SIGN UP']];
  function frame(el, path, body, opts) {
    opts = opts || {};
    const navOn = p => path === p || (p === '/games.html' && /^\/(games|rooms)\//.test(path)) || (p === '/ladders.html' && /^\/(profile|halloffame)/.test(path));
    el.className = 'jz' + (opts.cls ? ' ' + opts.cls : '');
    el.innerHTML = `<div class="jz-top">${L('/home.html', `${BOLT}<span class="jz-logo"><small>JackNet</small><b>GAMING ZONE</b></span>${BOLT}`, 'jz-logolink')}${ad()}</div>
      ${FLAMES}
      <nav class="jz-nav">${NAV.map(([p, t]) => L(p, t, navOn(p) ? 'on' : '')).join('')}</nav>
      <div class="jz-strip" data-live="strip"></div>
      <div class="jz-body">${body}</div>
      <div class="jz-foot"><div class="jz-counter">You are visitor number <span class="jz-lcd" data-live="hits">000000</span></div>
        <div>${L('/home.html', 'Home')} | ${L('/lobby.html', 'Lobby')} | ${L('/arcade.html', 'Java Arcade')} | ${L('/halloffame.html', 'Hall of Fame')} | ${L('/shame.html', 'Wall of Shame')} | ${L('/news.html', 'News')} | ${L('/plugin.html', 'Plug-in')}</div>
        <div class="jz-small">Best viewed with JackNet Explorer 4+ at 800x600 in 256 colours. &copy; 1999 JackNet Gaming Zone. Run by ZoneMaster Gubbinz. Site by Jack (and Dave, the bad bits).</div>
        <div class="jz-badges"><span>JACKNET<br>EXPLORER 4</span><span>MADE ON A<br>486</span><span>Y2K<br>READY*</span><span>NO<br>FRAMES!</span></div></div>`;
    return el;
  }
  function strip() {
    const inZone = Z.everyone().filter(([, s]) => s.where !== 'away').length, my = Z.my;
    const st = my.where === 'seat' ? `You are sitting at ${Z.META[my.g].name}, ${esc(Z.META[my.g].rooms[my.lv])}, table ${my.t + 1}. Waiting for an opponent... <button class="jz-btn sm" data-act="stand">Stand up</button>` : my.where === 'game' ? `You are playing ${Z.META[my.g].name} v ${esc(my.opp)} (see the game window)` : my.where === 'watch' ? 'You are watching a game' : 'Pick a game and sit down!';
    return `<span class="jz-dot"></span> Members online: <b>${Z.online.length || 1}</b> &nbsp;|&nbsp; In the Zone: <b>${inZone}</b> &nbsp;|&nbsp; You: ${who(meNick())} <small>(${Z.ratingOf(meNick())})</small> &nbsp;|&nbsp; <span class="jz-st">${st}</span>${live.lag ? ` <small class="jz-lag">ping ${live.lag} ms</small>` : ''}`;
  }

  // who's online / people lists with invite forms
  function people(filter, max) {
    const all = Z.everyone().filter(([id, s]) => !filter || filter(id, s));
    const others = filter ? [] : Z.online.filter(o => o.id !== meId() && !Z.peers.has(o.id)).map(o => [o.id, { where: 'away' }, o.nick]);
    const list = all.concat(others).slice(0, max || 40);
    if (!list.length) return '<p class="jz-dim">Nobody here right now. Sit down at a table and they\'ll come!</p>';
    return `<table class="jz-ptab">${list.map(([id, s, nick]) => {
      const o = Z.online.find(x => x.id === id) || {}, mine = id === meId();
      const acts = mine ? '<small>(you)</small>' : `<button class="jz-btn sm" data-act="inv" data-id="${id}">Invite</button>${s.where === 'game' && s.gid ? ` <button class="jz-btn sm" data-act="watch" data-hid="${s.host ? id : s.hid}" data-gid="${esc(s.gid)}" data-g="${s.g}" data-lv="${s.lv}">Watch</button>` : ''}`;
      return `<tr><td>${who(nick, o.col)}${o.member ? ' <span class="jz-star" title="JackNet member">&#9733;</span>' : ''}<div class="jz-dim">${esc(Z.statusText(s))}</div></td><td class="jz-r">${acts}</td></tr><tr class="jz-invrow" data-for="${id}" hidden><td colspan="2"></td></tr>`;
    }).join('')}</table>`;
  }
  function invForm(row, id, g) {
    const td = row.querySelector('td') || row;
    td.innerHTML = `<div class="jz-invform">Invite <b>${esc(Z.nickOf(id))}</b> to <select data-k="g">${Z.ORDER.map(x => `<option value="${x}"${x === g ? ' selected' : ''}>${esc(Z.META[x].name)}</option>`).join('')}</select> in <select data-k="lv">${Z.LEVELS.map((n, i) => `<option value="${i}">${n}</option>`).join('')}</select> <button class="jz-btn sm" data-act="sendinv" data-id="${id}">Send invite!</button></div>`;
    row.hidden = !row.hidden;
  }
  function chatBox(n) {
    const lines = Z.chat.list.slice(-(n || 40));
    return lines.length ? lines.map(e => { const d = new Date(e.ts || Date.now()); return `<div class="jz-cl"><i>[${d.getHours()}:${pad2(d.getMinutes())}]</i> ${who(String(e.by || '?'), e.col)}: ${esc(Z.nanny(String(e.text || '')))}</div>`; }).join('') : '<div class="jz-dim">Nobody has said anything yet. Be the first! (Say hi.)</div>';
  }
  const chatForm = () => `<div class="jz-chatform"><select data-k="quick"><option value="">Quick chat...</option>${Z.QUICK.map(q => `<option>${esc(q)}</option>`).join('')}</select><input type="text" maxlength="200" data-k="say" placeholder="Type here and press Enter"><button class="jz-btn" data-act="say">Send</button><span class="jz-chatmsg"></span></div>`;
  function topPlayers(n) {
    const rows = Z.ladderList().slice(0, n);
    return rows.length ? `<ol class="jz-top5">${rows.map(r => `<li>${who(r.nm || r.f)} <b>${r.r}</b> <small>${r.w}W ${r.l}L</small></li>`).join('')}</ol>` : '<p class="jz-dim">Nobody on the ladder yet. Win an online game and you\'re on it!</p>';
  }
  function roomCount(g, lv) { return Z.everyone().filter(([, s]) => s.g === g && (lv == null || s.lv === lv) && (s.where === 'seat' || s.where === 'game')).length; }

  // ================================================================ pages
  const R = {};
  R['/'] = el => { // the splash intro
    el.className = 'jz jz-splash';
    let seen = false; try { seen = sessionStorage.getItem('jhp_zone_intro') === '1'; sessionStorage.setItem('jhp_zone_intro', '1'); } catch (e) {}
    el.innerHTML = `<div class="jz-sp">${L('/home.html', 'Skip intro &gt;&gt;', 'jz-skip')}<div class="jz-stars"></div>
      <div class="jz-sp-logo">${BOLT}<div><small>JackNet</small><b>GAMING ZONE</b></div>${BOLT}</div>
      <div class="jz-sp-type"></div>
      <div class="jz-sp-load"><span>LOADING ZONE</span><div class="jz-sp-bar"><i></i></div></div>
      ${L('/home.html', 'ENTER THE ZONE', 'jz-enter')}
      ${FLAMES}
      <div class="jz-sp-foot">10 games &middot; 30 rooms &middot; real people &middot; 0 pence &middot; requires JackNet Explorer 4+ and nerves of steel</div></div>`;
    const lines = ['10 GAMES.', 'REAL PEOPLE.', 'ZERO PENCE.', 'NO MERCY.', '(be nice though)'];
    const type = el.querySelector('.jz-sp-type'), bar = el.querySelector('.jz-sp-bar i'), enter = el.querySelector('.jz-enter');
    let k = 0, full = false; const t0 = performance.now();
    const tick = setInterval(() => {
      if (!el.isConnected) return clearInterval(tick);
      const t = performance.now() - t0, p = Math.min(1, t / (seen ? 1500 : 6000));
      bar.style.width = (p * 100) + '%';
      const n = Math.min(lines.length, Math.floor(p * lines.length + 0.3)); if (n !== k) { k = n; type.innerHTML = lines.slice(0, k).map(x => `<div>${esc(x)}</div>`).join(''); sfx('click'); }
      if (p >= 1 && !full) { full = true; enter.classList.add('ready'); el.querySelector('.jz-sp-load span').textContent = 'ZONE LOADED!'; clearInterval(tick); if (!seen) el.dataset.full = '1'; }
    }, 100);
    enter.addEventListener('click', () => { if (el.dataset.full === '1') secret('zone.splash'); }, true);
  };
  R['/home.html'] = el => {
    const news = newsNow().slice(0, 4), g = Z.ORDER[week() % Z.ORDER.length];
    frame(el, '/home.html', `<div class="jz-cols">
      <div class="jz-main">
        ${chrome('LATEST NEWS')}
        ${news.map((n, i) => `<div class="jz-news">${i === 0 && isNew(n) ? NEW : ''}<h3>${esc(n[2])}</h3><div class="jz-by">Posted ${newsDate(n)} by <b>ZoneMaster Gubbinz</b></div><p>${esc(n[3])}</p></div>`).join('')}
        <p>${L('/news.html', 'Older news &gt;&gt;')}</p>
        ${chrome('GAME OF THE WEEK')}
        <div class="jz-feat jz-th-${THEME[g]}">${Z.ICON[g].replace('<svg', '<svg class="jz-fico"')}<div><h3>${esc(Z.META[g].name)}</h3><p>${esc(GM[g].blurb)}</p><p>${L(`/games/${g}.html`, 'PLAY NOW &gt;&gt;', 'jz-btn')} <button class="jz-btn" data-act="cpu" data-g="${g}" data-lv="0">Play the computer</button></p></div></div>
        ${chrome('ALL THE GAMES')}
        <div class="jz-gl">${Z.ORDER.map(x => L(`/games/${x}.html`, `${Z.ICON[x]}<span>${esc(Z.META[x].name)}</span>${x === 'pong' ? NEW : ''}<i data-live="cnt" data-g="${x}"></i>`, 'jz-gtile')).join('')}${L('/arcade.html', `<span class="jz-java">JAVA</span><span>Java Arcade (9 games)</span>`, 'jz-gtile')}</div>
      </div>
      <div class="jz-side">
        <div class="jz-box"><h4>WHO'S ONLINE <span class="jz-live">LIVE</span></h4><div data-live="people"></div></div>
        <div class="jz-box"><h4>TOP PLAYERS</h4><div data-live="top"></div>${L('/ladders.html', 'Full ladders &gt;&gt;')}</div>
        <div class="jz-box"><h4>WEEKLY REVERSI CUP</h4><div data-live="cupmini"></div>${L('/tournaments.html', 'See the bracket &gt;&gt;')}</div>
        <div class="jz-box"><h4>LOBBY CHAT</h4><div class="jz-chatlog sm" data-live="chat6"></div>${L('/chat.html', 'Join the chat &gt;&gt;')}</div>
        <div class="jz-box jz-plug">${L('/plugin.html', '<b>FREE!</b> Download the Zone Plug-in 2.0 &gt;&gt;')}</div>
      </div></div>`);
  };
  R['/news.html'] = el => {
    secret('zone.news');
    frame(el, '/news.html', `${chrome('ZONE NEWS ARCHIVE')}<p class="jz-dim">Every post from ZoneMaster Gubbinz, newest first. Spelling is his own.</p>${newsNow().map((n, i) => `<div class="jz-news">${i === 0 && isNew(n) ? NEW : ''}<h3>${esc(n[2])}</h3><div class="jz-by">Posted ${newsDate(n)} by <b>ZoneMaster Gubbinz</b></div><p>${esc(n[3])}</p></div>`).join('')}`);
  };
  R['/lobby.html'] = el => {
    frame(el, '/lobby.html', `${chrome('MAIN LOBBY')}
      <p>Welcome to the Zone, <b>${esc(meNick())}</b>! Pick a room and sit at a table. When somebody sits opposite you, the <b>Zone game client</b> pops up on your desktop. Or invite someone from the list.</p>
      <div class="jz-cols"><div class="jz-main"><table class="jz-rooms"><tr><th>Game</th><th>Rooms</th></tr>${Z.ORDER.map(g => `<tr><td>${L(`/games/${g}.html`, `${Z.ICON[g]} ${esc(Z.META[g].name)}`, 'jz-gname')}</td><td>${Z.META[g].rooms.map((r, lv) => L(`/rooms/${g}-${lv}.html`, `<span class="jz-lv" style="background:${LV_COL[lv]}"></span>${esc(r)} <i data-live="cnt" data-g="${g}" data-lv="${lv}"></i>`, 'jz-room')).join(' ')}</td></tr>`).join('')}
        <tr><td>${L('/arcade.html', '<span class="jz-java">JAVA</span> Java Arcade', 'jz-gname')}</td><td>${L('/arcade.html', 'Snake, Jack Sweeper, Brick Bash, Saucer Invaders and 5 more', 'jz-room')}</td></tr></table></div>
      <div class="jz-side"><div class="jz-box"><h4>PEOPLE ONLINE <span class="jz-live">LIVE</span></h4><div data-live="people"></div></div>
        <div class="jz-box"><h4>LOBBY CHAT</h4><div class="jz-chatlog sm" data-live="chat6"></div>${chatForm()}</div></div></div>`);
  };
  R['/games.html'] = R['/games/'] = el => {
    frame(el, '/games.html', `${chrome('THE GAMES')}<div class="jz-cards">${Z.ORDER.map(g => `<div class="jz-card jz-th-${THEME[g]}">${Z.ICON[g].replace('<svg', '<svg class="jz-fico"')}<h3>${L(`/games/${g}.html`, esc(Z.META[g].name))}${g === 'pong' ? NEW : ''}</h3><p>${esc(GM[g].blurb)}</p><p class="jz-dim">Playing now: <b data-live="cnt" data-g="${g}">0</b></p><p>${L(`/games/${g}.html`, 'Rooms &gt;&gt;', 'jz-btn sm')} <button class="jz-btn sm" data-act="cpu" data-g="${g}" data-lv="0">vs Computer</button></p></div>`).join('')}
      <div class="jz-card jz-th-space"><span class="jz-java big">JAVA</span><h3>${L('/arcade.html', 'JAVA ARCADE')}</h3><p>Nine quick games with shared high-score tables. Snake ghosts included.</p><p>${L('/arcade.html', 'Insert coin &gt;&gt;', 'jz-btn sm')}</p></div></div>`);
  };
  function gamePage(g) {
    return el => {
      const M = Z.META[g], G = GM[g];
      const per = Object.keys(Z.ladder.prof).map(f => { const p = Z.parseProf(Z.ladder.prof[f]); return p && p.games[g] ? { f, nm: p.nm || f, ...p.games[g] } : null; }).filter(x => x && x.w).sort((a, b) => b.w - a.w).slice(0, 5);
      frame(el, `/games/${g}.html`, `<div class="jz-ghead jz-th-${THEME[g]}">${Z.ICON[g].replace('<svg', '<svg class="jz-fico big"')}<div><h2>${esc(M.name)}</h2><p>${esc(G.blurb)}</p></div></div>
        <div class="jz-cols"><div class="jz-main">${chrome('PICK A ROOM')}
          <table class="jz-rooms">${M.rooms.map((r, lv) => `<tr><td><span class="jz-lv" style="background:${LV_COL[lv]}"></span>${L(`/rooms/${g}-${lv}.html`, `<b>${esc(r)}</b>`)}<div class="jz-dim">${Z.LEVELS[lv]}. ${esc(MOTTO[g][lv])}</div></td><td class="jz-r"><b data-live="cnt" data-g="${g}" data-lv="${lv}">0</b> playing<br>${L(`/rooms/${g}-${lv}.html`, 'Enter &gt;&gt;', 'jz-btn sm')}</td></tr>`).join('')}</table>
          ${chrome('NOBODY ABOUT? PLAY THE COMPUTER')}<p>${[0, 1, 2].map(lv => `<button class="jz-btn" data-act="cpu" data-g="${g}" data-lv="${lv}">${esc(Z.CPU[lv])}<small>${Z.LEVELS[lv]}</small></button>`).join(' ')}</p>
          ${chrome('HOW TO PLAY')}<pre class="jz-rules">${esc(Z.rulesText(g))}</pre></div>
        <div class="jz-side"><div class="jz-box"><h4>TOP ${esc(M.name.toUpperCase())} PLAYERS</h4>${per.length ? `<ol class="jz-top5">${per.map(p => `<li>${who(p.nm)} <b>${p.w}</b> wins</li>`).join('')}</ol>` : '<p class="jz-dim">No wins yet. Yours could be the first!</p>'}</div>
          <div class="jz-box"><h4>IN THESE ROOMS <span class="jz-live">LIVE</span></h4><div data-live="people" data-g="${g}"></div></div></div></div>`);
    };
  }
  function roomPage(g, lv) {
    return el => {
      const M = Z.META[g];
      frame(el, `/rooms/${g}-${lv}.html`, `<div class="jz-roomhead jz-th-${THEME[g]}"><div class="jz-crumb">${L('/lobby.html', 'Lobby')} &gt; ${L(`/games/${g}.html`, esc(M.name))} &gt; ${esc(M.rooms[lv])}</div>
          <h2>${Z.ICON[g]} ${esc(M.rooms[lv])}</h2><p><span class="jz-lv" style="background:${LV_COL[lv]}"></span>${Z.LEVELS[lv]} room &middot; <i>"${esc(MOTTO[g][lv])}"</i></p></div>
        <div class="jz-cols"><div class="jz-main"><div class="jz-tables" data-live="tables" data-g="${g}" data-lv="${lv}"></div>
          <p class="jz-dim">Sit at a table. When somebody sits opposite you, the game starts in the <b>Zone game client</b> window. Tables with a game on can be watched.</p>
          <p><button class="jz-btn" data-act="cpu" data-g="${g}" data-lv="${lv}">&#9654; Play ${esc(Z.CPU[lv])}</button> ${L(`/games/${g}.html`, 'Rules', 'jz-btn')}</p></div>
        <div class="jz-side"><div class="jz-box"><h4>IN THIS ROOM <span class="jz-live">LIVE</span></h4><div data-live="people" data-g="${g}" data-lv="${lv}"></div></div>
          <div class="jz-box"><h4>EVERYONE ONLINE</h4><div data-live="people"></div></div>
          <div class="jz-box"><h4>LOBBY CHAT</h4><div class="jz-chatlog sm" data-live="chat6"></div>${chatForm()}</div></div></div>`, { cls: 'jz-room-' + THEME[g] });
    };
  }
  function tablesHtml(g, lv) {
    const all = Z.everyone(), here = all.filter(([, s]) => s.g === g && s.lv === lv && (s.where === 'seat' || s.where === 'game'));
    let out = '';
    for (let t = 0; t < 4; t++) {
      const seats = here.filter(([, s]) => s.t === t);
      const host = seats.find(([, s]) => s.where === 'game' && s.host) || seats.find(([, s]) => s.where === 'game');
      let a = null, b = null, status = 'Empty table. Sit down!', act = '';
      const seatBtn = who2 => who2 ? `<span class="jz-seat on">${who(who2[2], (Z.online.find(o => o.id === who2[0]) || {}).col)}${who2[0] === meId() ? ' <small>(you)</small>' : ''}</span>` : `<button class="jz-seat" data-act="sit" data-g="${g}" data-lv="${lv}" data-t="${t}">SIT HERE</button>`;
      if (host) {
        const hid = host[1].host ? host[0] : host[1].hid, guest = seats.find(([id, s]) => s.where === 'game' && id !== hid) || [0, {}, host[1].opp];
        const hs = seats.find(([id]) => id === hid) || host; a = hs; b = guest;
        const watchers = all.filter(([, s]) => s.where === 'watch' && s.gid === hs[1].gid).length;
        status = `<b class="jz-live">GAME ON</b>${watchers ? ` &middot; ${watchers} watching` : ''}`;
        if (hs[0] !== meId() && Z.my.where !== 'game') act = `<button class="jz-btn sm" data-act="watch" data-hid="${hid}" data-gid="${esc(hs[1].gid)}" data-g="${g}" data-lv="${lv}">Watch</button>`;
      } else {
        const w = seats.filter(([, s]) => s.where === 'seat'); a = w[0] || null; b = w[1] || null;
        if (a) status = a[0] === meId() ? 'Waiting for an opponent...' : `${esc(a[2])} wants a game!`;
        if (a && a[0] === meId()) act = '<button class="jz-btn sm" data-act="stand">Stand up</button>';
      }
      out += `<div class="jz-tbl${host ? ' busy' : ''}"><div class="jz-tno">TABLE ${t + 1}</div>${seatBtn(a)}<div class="jz-felt">${Z.ICON[g]}</div>${host ? `<span class="jz-seat on">${who(String(b[2] || '?'))}</span>` : seatBtn(b)}<div class="jz-tstat">${status} ${act}</div></div>`;
    }
    return out;
  }
  R['/arcade.html'] = el => {
    const names = (window.SiteArcade && SiteArcade.names) || {};
    const ids = (window.Arcade && Arcade.games) || [];
    frame(el, '/arcade.html', `<div class="jz-roomhead jz-th-space"><h2><span class="jz-java big">JAVA</span> THE JAVA ARCADE</h2><p>Nine quick games. High scores are <span class="jz-live">LIVE</span> and shared with everyone on JackNet. Other people playing Snake show up as ghosts!</p></div>
      <div class="jz-apick">${ids.map(id => `<button class="jz-btn sm${window.Arcade && Arcade.current === id ? ' on' : ''}" data-act="arc" data-id="${id}">${esc((names[id] || id).toUpperCase())}<i data-live="np" data-id="${id}"></i></button>`).join('')}</div>
      <div class="jz-arcmount"><p class="jz-dim">Loading the Java applet... (if nothing happens, your JackNet Explorer might need Java 1.1)</p></div>
      ${chrome('HIGH SCORES')}<div class="jz-hsgrid" data-live="hs"></div>`, { cls: 'jz-arcade' });
    mountArcade(el.querySelector('.jz-arcmount'));
  };
  R['/ladders.html'] = el => {
    frame(el, '/ladders.html', `${chrome('THE LADDERS')}<p>Everyone starts on <b>1200</b>. Beat someone rated higher than you to climb faster. Only games against real people count. ${L('/halloffame.html', 'Hall of Fame &gt;&gt;')}</p>
      <div class="jz-cols"><div class="jz-main"><div data-live="ladder"></div></div><div class="jz-side"><div data-live="pergame"></div></div></div>`);
  };
  R['/halloffame.html'] = el => {
    frame(el, '/halloffame.html', `${chrome('HALL OF FAME')}<div class="jz-hof">
      <div class="jz-box"><h4>CUP WINNERS</h4><div data-live="hof"></div></div>
      <div class="jz-box"><h4>TOP OF THE LADDER</h4><div data-live="top3"></div></div>
      <div class="jz-box"><h4>JAVA ARCADE RECORDS</h4><div data-live="arcrec"></div></div>
      <div class="jz-box"><h4>FOUNDERS</h4><ul class="jz-ul"><li><b>Jack</b> - built the Zone on a 486 in his bedroom</li><li><b>Dave</b> - tested it (lost)</li><li><b>ZoneMaster Gubbinz</b> - runs the place, eats the cables</li><li><b>Jack's Mom</b> - allowed it (on the condition of homework first)</li></ul></div></div>`);
  };
  R['/shame.html'] = el => {
    secret('zone.shame');
    const W = [['Dave', 'Typed KINGME 400 times during one game of Checkers. It is not a cheat. It never was.'], ['Mr Tiddles (a cat)', 'Walked across the keyboard in the Expert Reversi room. Somehow won.'], ['Guest4471', 'Asked everyone in the lobby how old they were. JackNet Nanny took him away.'], ['Jack\'s Dad', 'Picked up the phone in the middle of a Battleships final. Modem screamed. Nobody won.'], ['Gubbinz', 'Ate a Reversi disc. Claimed it was "a biscuit with no flavour".'], ['Dave (again)', 'Unplugged his modem when losing at Connect Fore. The Zone gave the other person the win. Dave now knows this.'], ['Kev', 'Tried to sink a Battleship by shouting coordinates at the monitor.'], ['Somebody', 'Named their pet rock "Checkers Champion". The rock has not played a single game.']];
    frame(el, '/shame.html', `${chrome('WALL OF SHAME')}<p>The Zone's most wanted. Cheats, quitters and people who say "lag" when they lose. <b>Rage-quits this year: <span data-live="quits">${live.quits}</span></b> <span class="jz-live">LIVE</span> (leaving a game early hands the win to the other player, so don't).</p>
      <div class="jz-shame">${W.map(([n, t], i) => `<div class="jz-wanted"><div class="jz-wt">WANTED</div>${avatar(i * 5 + 3, 'big')}<b>${esc(n)}</b><p>${esc(t)}</p><div class="jz-reward">REWARD: 1 Pot Noodlez</div></div>`).join('')}</div>
      <p class="jz-dim">Battleships fleets caught being moved mid-game: <b>0</b>. Every fleet is sealed with a secret code before the battle and checked afterwards. Nice try, Dave.</p>`);
  };
  R['/tournaments.html'] = el => {
    frame(el, '/tournaments.html', `${chrome('THE WEEKLY REVERSI CUP')}<p>Eight players. Knockout. Week <b>${week()}</b> of 1999. Sign up, and when the cup kicks off, challenge your opponent when you're both online (the Intermediate timer is used). The winner goes in the ${L('/halloffame.html', 'Hall of Fame')} forever.</p>
      <div data-live="cup"></div>`);
  };
  // every multiplayer thing on the PC and the web site (mp.js keeps the list and the live "playing now" counts)
  R['/multiplayer.html'] = el => {
    const KORDER = ['turn', 'race', 'cards', 'party', 'live', 'room', 'toy'];
    const KT = { turn: 'HEAD TO HEAD', race: 'RACES (same board for everybody)', cards: 'CARD TABLES', party: 'EVERYBODY AT ONCE', live: 'LIVE ACTION', room: 'HANG OUT', toy: 'SHARED TOYS' };
    frame(el, '/multiplayer.html', `${chrome('MULTIPLAYER')}<p>Everything on JackNet you can play <b>with other people</b>, right now. Press <b>Find a player</b> to invite somebody or put your name up in the <a href="#" data-act="mplobby">Who wants to play?</a> lobby. Every game in this list has <b>Game &gt; Play with someone...</b> too.</p>
      <p class="jz-dim">Modem dropped out? Don't panic. Your seat is kept for two minutes and the game carries on where you left off. (Even if Mom unplugs the phone to call Gran.)</p>
      <div class="jz-cols"><div class="jz-main" data-mp="list"></div><div class="jz-side"><div class="jz-box"><h4>WHO WANTS TO PLAY? <span class="jz-live">LIVE</span></h4><div data-mp="seeks"></div><p><button class="jz-btn sm" data-act="mplobby">Open the lobby</button></p></div>
      <div class="jz-box"><h4>MULTIPLAYER CHAMPS</h4><div data-mp="top"></div><p class="jz-dim">Online wins by JackNet members (both players' computers have to agree on the result).</p></div></div></div>`);
    const MPx = window.MP; if (!MPx) return;
    const draw = () => {
      if (!el.isConnected) return;
      const list = MPx.listing(), box = el.querySelector('[data-mp="list"]'), sk = el.querySelector('[data-mp="seeks"]'), tp = el.querySelector('[data-mp="top"]');
      if (box) box.innerHTML = KORDER.map(k => { const rows = list.filter(x => x.def.kind === k); if (!rows.length) return ''; return `<div class="jz-box"><h4>${KT[k]}</h4><table class="jz-ptab">${rows.map(x => { const d = x.def, have = MPx.installed(x.id); return `<tr><td>${d.icon || ''} <b>${esc(d.name)}</b> <small class="jz-dim">${esc(d.players)} players</small>${d.blurb ? `<div class="jz-dim">${esc(d.blurb)}</div>` : ''}</td><td class="jz-r">${x.n ? `<b style="color:#5f5">${x.n} playing now</b><br>` : '<span class="jz-dim">nobody yet</span><br>'}${!have ? '<button class="jz-btn sm" data-act="mpget">Get it</button>' : `${d.open ? `<button class="jz-btn sm" data-act="mpopen" data-g="${esc(x.id)}">Play</button>` : ''}${d.invite && d.invite !== 'open' ? ` <button class="jz-btn sm" data-act="mpfind" data-g="${esc(x.id)}">Find a player</button>` : ''}`}</td></tr>`; }).join('')}</table></div>`; }).join('');
      const seeks = MPx.now.seeks.filter(x => MPx.GAMES[x.g]);
      if (sk) sk.innerHTML = seeks.length ? `<table class="jz-ptab">${seeks.map((x, i) => `<tr><td>${who(x.nick)} wants <b>${esc(MPx.GAMES[x.g].name)}</b>${x.lost ? ' <small class="jz-dim">(reconnecting)</small>' : ''}</td><td class="jz-r">${x.id === meId() ? '<small>(you)</small>' : `<button class="jz-btn sm" data-act="mpjoin" data-i="${i}">Play!</button>`}</td></tr>`).join('')}</table>` : '<p class="jz-dim">Nobody is waiting for a game. Put your name up!</p>';
      if (tp) tp.innerHTML = MPx.now.top.length ? `<ol class="jz-top5">${MPx.now.top.slice(0, 8).map(r => `<li>${who(r[0])} <b>${r[1]}</b> wins</li>`).join('')}</ol>` : '<p class="jz-dim">Nobody yet. Win an online game!</p>';
      el._mpSeeks = seeks;
    };
    draw(); Net.send({ t: 'mpTop' });
    const off = MPx.onNow(() => draw()); offs.push(off);
  };
  R['/chat.html'] = el => {
    frame(el, '/chat.html', `${chrome('LOBBY CHAT')}<p class="jz-dim">The Zone's chat room. Be nice. No swearing (the JackNet Nanny turns it into stars). Never give out your real name, address, phone number or school.</p>
      <div class="jz-cols"><div class="jz-main"><div class="jz-chatlog big" data-live="chat"></div>${chatForm()}<p class="jz-dim">The chat refreshes itself. No need to press Refresh. (You can if you like. It's fun.)</p></div>
      <div class="jz-side"><div class="jz-box"><h4>IN THE ZONE <span class="jz-live">LIVE</span></h4><div data-live="people"></div></div></div></div>`);
  };
  R['/help.html'] = el => {
    const F = [['Is the Zone free?', 'Yes! 0 pence. Your phone bill is a different story. Ask before you go online.'], ['How do I play?', 'Go to GAMES, pick a game, pick a room, and press SIT HERE at a table. When somebody sits opposite you, the Zone game client window opens on your desktop. You can also press Invite next to someone\'s name.'],
      ['Nobody else is online. Now what?', 'Every game has Play the Computer. Gubbinz is easy, Dave\'s Dad\'s 486 is OK, and DEEP JACK 2000 is properly hard.'], ['What is a rating?', 'A number that says how good you are. Everyone starts on 1200. Win and it goes up. Lose and it goes down. Beat somebody better than you for loads of points.'],
      ['I lost. It was lag.', 'It was not lag.'], ['What if someone leaves halfway through?', 'You win! Leaving a game in progress counts as a loss for them. If their connection drops, the Zone stops the clock and waits two minutes for them to come back (modems wobble). If they never do, you get the win.'],
      ['Can people watch my game?', 'Yes, anybody can press Watch on your table. They can chat but they can\'t help either player. (They can shout "nooo" at their screen.)'], ['Is Dave a cheat?', 'Dave is on the Wall of Shame for typing KINGME 400 times. But every Battleships fleet is sealed with a secret code and checked at the end, every move is checked by both computers, and nobody has ever successfully cheated. Dave has tried. Dave has tried a LOT.'],
      ['Does it work on a Mac?', 'Dave\'s cousin has a see-through blue one. It works on that. Probably.'], ['Why does my modem scream?', 'That\'s how it says hello to the Internet. It\'s fine. Unless someone picks up the phone.'], ['Is the Zone Y2K ready?', 'Jack says yes. Dave says the tables will turn into Noughts & Crosses at midnight. We\'ll find out on 1 January 2000.']];
    frame(el, '/help.html', `${chrome('HELP &amp; FAQ')}<div class="jz-faq">${F.map(([q, a], i) => `<details data-faq="${i}"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
      ${chrome('ZONE ETIQUETTE')}<pre class="jz-rules">${esc((Apps.fs.find('ETIQUETTE.TXT') || {}).text || '')}</pre>
      ${chrome('SYSTEM REQUIREMENTS')}<ul class="jz-ul"><li>486DX/66 or better (Pent-Yum recommended)</li><li>8 MB RAM (16 MB for Spatula Pong)</li><li>14.4K modem (28.8K or faster recommended)</li><li>JackNet Explorer 4 or higher</li><li>A phone line nobody else wants for at least 20 minutes</li></ul>`);
    el.querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => { if (d.open && /Dave a cheat/.test(d.textContent)) secret('zone.faq'); }));
  };
  R['/plugin.html'] = el => {
    frame(el, '/plugin.html', `${chrome('DOWNLOAD THE ZONE PLUG-IN 2.0')}<div class="jz-dl"><div class="jz-dlbox"><b>ZONEPLUG.EXE</b> &middot; 1.4 MB &middot; for JackOS 98<br><small>Makes the Zone up to 0% faster! Adds 3D-ish discs! Required for nothing!</small></div>
      <p><button class="jz-btn big" data-act="dl">DOWNLOAD NOW!</button> <small class="jz-dim">Estimated time at 28.8K: about 7 minutes. At 56K: a bit less. At 14.4K: bring a sandwich.</small></p>
      <div class="jz-dlprog" hidden><div class="jz-dlbar"><i></i></div><div class="jz-dlmsg"></div></div></div>
      <p class="jz-dim">Mirror sites: ${L('/plugin.html', 'UK')} | ${L('/plugin.html', 'Europe')} | ${L('/plugin.html', 'Dave\'s house (slow)')}</p>`);
  };
  R['/signup.html'] = el => {
    const f = fieldOf(meNick()), t = Z.parseTag(Z.ladder.tag[f]) || { av: hashNick(meNick()) % 12, text: '' };
    frame(el, '/signup.html', `${chrome('SIGN UP / MY ZONE')}
      <p>Your Zone name is your JackNet name: <b>${esc(meNick())}</b>. ${Net.me.member ? 'You are a JackNet member, so your record stays with you.' : 'Guests get a new name every visit, so your record won\'t follow you. <a href="http://www.jackattack.jnet/login">Log on to JackNet</a> (it\'s FREE) to keep your ratings!'}</p>
      <form class="jz-form" onsubmit="return false"><fieldset><legend>Pick your Zone face</legend><div class="jz-avpick">${AVATARS.map(([n], i) => `<label title="${n}"><input type="radio" name="jzav" value="${i}"${i === t.av ? ' checked' : ''}>${avatar(i, 'big')}<span>${n}</span></label>`).join('')}</div></fieldset>
        <fieldset><legend>Your motto</legend><input type="text" maxlength="80" data-k="tag" value="${esc(t.text)}" placeholder="e.g. Corners or bust!"></fieldset>
        <fieldset><legend>Options</legend><label><input type="checkbox" data-k="noinv"${Z.opts.noinv ? ' checked' : ''}> Do not disturb (no invitations)</label><br><label><input type="checkbox" data-k="hints"${Z.opts.hints ? ' checked' : ''}> Show legal moves on the board</label><br><label><input type="checkbox" data-k="chatSnd"${Z.opts.chatSnd ? ' checked' : ''}> Beep when someone chats</label></fieldset>
        <p><button class="jz-btn big" data-act="save">SAVE MY ZONE PROFILE</button> <span class="jz-savemsg"></span></p></form>
      <p>${L(`/profile/${f}.html`, 'See my profile &gt;&gt;')}</p>`);
  };
  function profilePage(f) {
    return el => {
      const row = Z.parseRow(Z.ladder.rows[f]), prof = Z.parseProf(Z.ladder.prof[f]), hist = Z.parseHist(Z.ladder.hist[f]), tag = Z.parseTag(Z.ladder.tag[f]);
      const nm = (row && row.nm) || (prof && prof.nm) || (Z.online.find(o => fieldOf(o.nick) === f) || {}).nick || f;
      if (f === fieldOf(meNick())) secret('zone.profile');
      if (!row && !prof && !tag) { frame(el, '/profile/', `${chrome('PLAYER PROFILE')}<p>No record for <b>${esc(nm)}</b> yet. They haven't finished an online game. (Everyone has to start somewhere.)</p><p>${L('/ladders.html', '&lt;&lt; Back to the ladders')}</p>`); return; }
      const games = prof ? Z.ORDER.filter(g => prof.games[g] && (prof.games[g].w || prof.games[g].l)) : [];
      const fav = games.slice().sort((a, b) => (prof.games[b].w + prof.games[b].l) - (prof.games[a].w + prof.games[a].l))[0];
      const online = Z.online.find(o => fieldOf(o.nick) === f);
      const rank = Z.ladderList().findIndex(x => x.f === f) + 1;
      frame(el, '/profile/', `<div class="jz-prof">${avatar(tag ? tag.av : hashNick(nm) % 12, 'huge')}<div><h2>${esc(nm)}</h2>${tag && tag.text ? `<p class="jz-motto">"${esc(Z.nanny(tag.text))}"</p>` : ''}
          <p>${online ? `<span class="jz-dot"></span> <b>Online now</b> ${online.id !== meId() ? `<button class="jz-btn sm" data-act="inv" data-id="${online.id}">Invite</button>` : ''}` : '<span class="jz-dim">Offline</span>'}</p></div></div>
        <table class="jz-stat"><tr><th>Rating</th><td><b>${row ? row.r : 1200}</b>${rank ? ` (#${rank} on the ladder)` : ''}</td></tr><tr><th>Won / Lost</th><td>${row ? row.w : 0} / ${row ? row.l : 0}</td></tr><tr><th>Member since</th><td>${esc(prof ? prof.since : '?')}</td></tr><tr><th>Favourite game</th><td>${fav ? esc(Z.META[fav].name) : 'Not sure yet'}</td></tr></table>
        <div class="jz-invrow" data-for="${online ? online.id : 0}" hidden></div>
        <div class="jz-cols"><div class="jz-main">${chrome('RATING HISTORY', 'h3')}${histChart(hist)}</div>
        <div class="jz-side">${chrome('GAME BY GAME', 'h3')}<table class="jz-ptab">${games.length ? games.map(g => `<tr><td>${Z.ICON[g]} ${esc(Z.META[g].name)}</td><td class="jz-r">${prof.games[g].w}W ${prof.games[g].l}L</td></tr>`).join('') : '<tr><td class="jz-dim">No games yet</td></tr>'}</table></div></div>
        <p>${L('/ladders.html', '&lt;&lt; Back to the ladders')}</p>`);
    };
  }
  function histChart(h) {
    if (h.length < 2) return '<p class="jz-dim">Not enough games for a chart yet.</p>';
    const W = 300, Hh = 110, mn = Math.min(...h) - 10, mx = Math.max(...h) + 10, x = i => 10 + i * (W - 20) / (h.length - 1), y = v => Hh - 10 - (v - mn) / (mx - mn) * (Hh - 20);
    let grid = ''; for (let k = 0; k <= 4; k++) grid += `<line x1="0" x2="${W}" y1="${10 + k * (Hh - 20) / 4}" y2="${10 + k * (Hh - 20) / 4}" stroke="#063"/>`;
    return `<svg class="jz-chart" viewBox="0 0 ${W} ${Hh}">${grid}<polyline fill="none" stroke="#39ff14" stroke-width="2" points="${h.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/>${h.map((v, i) => `<rect x="${x(i) - 2}" y="${y(v) - 2}" width="4" height="4" fill="#00e5ff"/>`).join('')}<text x="4" y="12" fill="#9f9" font-size="9">${Math.round(mx)}</text><text x="4" y="${Hh - 2}" fill="#9f9" font-size="9">${Math.round(mn)}</text></svg><p class="jz-dim">Last ${h.length} ratings. Up is good.</p>`;
  }

  // ================================================================ live bits: re-drawn when anything changes
  const FMT = { sweep: s => s + ' sec', pong: s => s + ' pts', simon: s => s + ' rounds', hangman: s => s + ' words' };
  function fillLive(el) {
    el.querySelectorAll('[data-live]').forEach(n => {
      const k = n.dataset.live, d = n.dataset;
      if (k === 'strip') n.innerHTML = strip();
      else if (k === 'hits') n.textContent = String(live.hits || 0).padStart(6, '0');
      else if (k === 'people') { if (n.querySelector('.jz-invrow:not([hidden])')) return; const g = d.g, lv = d.lv == null ? null : +d.lv; const keep = [...n.querySelectorAll('.jz-invrow:not([hidden])')].map(r => r.dataset.for); n.innerHTML = people(g ? (id, s) => s.g === g && (lv == null || s.lv === lv) && s.where !== 'away' && s.where !== 'lobby' : null, 30); keep.forEach(id => { const r = n.querySelector(`.jz-invrow[data-for="${id}"]`); if (r) invForm(r, +id); }); }
      else if (k === 'cnt') n.textContent = roomCount(d.g, d.lv == null ? null : +d.lv) || (n.tagName === 'B' ? '0' : '');
      else if (k === 'top') n.innerHTML = topPlayers(5);
      else if (k === 'top3') n.innerHTML = topPlayers(3);
      else if (k === 'chat6' || k === 'chat') { const atBottom = n.scrollTop + n.clientHeight >= n.scrollHeight - 8; n.innerHTML = chatBox(k === 'chat' ? 40 : 6); if (atBottom || k === 'chat6') n.scrollTop = n.scrollHeight; }
      else if (k === 'tables') n.innerHTML = tablesHtml(d.g, +d.lv);
      else if (k === 'quits') n.textContent = live.quits || 0;
      else if (k === 'ladder') n.innerHTML = ladderHtml();
      else if (k === 'pergame') n.innerHTML = perGameHtml();
      else if (k === 'hof') n.innerHTML = live.hof.length ? `<ol class="jz-top5">${live.hof.slice().reverse().map(e => `<li>${who(String(e.by || '?'), e.col)} ${esc(String(e.text || ''))}</li>`).join('')}</ol>` : '<p class="jz-dim">No champions yet. The first Weekly Reversi Cup winner goes here!</p>';
      else if (k === 'arcrec' || k === 'hs') n.innerHTML = arcScoresHtml(k === 'arcrec');
      else if (k === 'np') { const l = window.SiteArcade ? SiteArcade.list(d.id) : []; n.textContent = l.length ? ` (${l.length} playing)` : ''; }
      else if (k === 'cupmini') n.innerHTML = cupMini();
      else if (k === 'cup') n.innerHTML = cupHtml();
    });
  }
  function ladderHtml() {
    const rows = Z.ladderList();
    if (!rows.length) return `<p class="jz-dim">${Z.ladder.loaded ? 'The ladder is empty! Win an online game to get on it.' : 'Loading the ladder...'}</p>`;
    const mine = fieldOf(meNick());
    return `<table class="jz-ladder"><tr><th>#</th><th>Player</th><th>Rating</th><th>W</th><th>L</th><th>%</th></tr>${rows.slice(0, 50).map((r, i) => `<tr${r.f === mine ? ' class="me"' : ''}><td>${i + 1}${i < 3 ? ' <span class="jz-medal m' + i + '"></span>' : ''}</td><td>${who(r.nm || r.f)}</td><td><b>${r.r}</b></td><td>${r.w}</td><td>${r.l}</td><td>${r.w + r.l ? Math.round(r.w / (r.w + r.l) * 100) : 0}</td></tr>`).join('')}</table>`;
  }
  function perGameHtml() {
    const all = Object.keys(Z.ladder.prof).map(f => ({ f, p: Z.parseProf(Z.ladder.prof[f]) })).filter(x => x.p);
    return Z.ORDER.map(g => { const top = all.filter(x => x.p.games[g] && x.p.games[g].w).sort((a, b) => b.p.games[g].w - a.p.games[g].w).slice(0, 3); return `<div class="jz-box"><h4>${Z.ICON[g]} ${esc(Z.META[g].name.toUpperCase())}</h4>${top.length ? `<ol class="jz-top5">${top.map(x => `<li>${who(x.p.nm || x.f)} <b>${x.p.games[g].w}</b> wins</li>`).join('')}</ol>` : '<p class="jz-dim">No wins yet.</p>'}</div>`; }).join('');
  }
  function arcScoresHtml(onlyTop) {
    const names = (window.SiteArcade && SiteArcade.names) || {}, ids = (window.Arcade && Arcade.games) || Object.keys(names).filter(k => k !== 'tris' && k !== 'squig');
    if (onlyTop) return `<ol class="jz-top5">${ids.map(id => { const e = (Z.arcScores[id] || [])[0]; return `<li>${esc(names[id] || id)}: ${e ? `<b>${esc(e.n)}</b> ${esc((FMT[id] || (s => s))(e.s))}` : '<i>nobody yet</i>'}</li>`; }).join('')}</ol>`;
    return ids.map(id => { const l = (Z.arcScores[id] || []).slice(0, 5); return `<div class="jz-hs"><h4>${esc(names[id] || id)}</h4><ol>${l.length ? l.map(e => `<li><b>${esc(e.n)}</b> ${esc((FMT[id] || (s => s))(e.s))}</li>`).join('') : '<li>nobody yet!</li>'}</ol></div>`; }).join('');
  }
  function cupMini() {
    const br = cupBracket();
    if (br.champ && cupStarted()) return `<p>Champion: ${who(br.nm(br.champ))} &#127942;</p>`;
    if (cupStarted()) return `<p>The cup is ON! ${br.ps.length} players.</p>`;
    return `<p>${br.ps.length} of 8 signed up for week ${week()}.</p>`;
  }
  function cupHtml() {
    const br = cupBracket(), me = fieldOf(meNick()), started = cupStarted(), inIt = br.ps.some(p => p.f === me), mm = myCupMatch();
    const names = f => f === null ? `<span class="jz-dim">${started ? 'BYE' : 'free slot'}</span>` : f === undefined ? '<span class="jz-dim">?</span>' : who(br.nm(f));
    let head = '';
    if (!started) head = `<p><b>${br.ps.length}</b> of 8 signed up: ${br.ps.map(p => who(p.nm)).join(', ') || '<span class="jz-dim">nobody yet</span>'}</p><p>${inIt ? '<button class="jz-btn" data-act="cupout">Withdraw</button>' : br.ps.length < 8 ? '<button class="jz-btn big" data-act="cupin">SIGN ME UP!</button>' : ''} ${br.ps.length >= 2 ? '<button class="jz-btn" data-act="cupgo">Kick off the cup!</button>' : '<span class="jz-dim">The cup can kick off once 2 people have signed up (it starts by itself at 8).</span>'}</p>`;
    else if (br.champ) head = `<p class="jz-champ">&#127942; CHAMPION: ${who(br.nm(br.champ))} &#127942;</p><p class="jz-dim">A new cup starts next week.</p>`;
    else if (mm) { const opp = Z.online.find(o => fieldOf(o.nick) === mm.opp && o.id !== meId()); const oldStart = Date.now() - (+live.cup[wk() + '.go'] || Date.now()) > 48 * 3600e3; head = `<p class="jz-yourmatch">Your match: ${who(meNick())} v ${who(mm.oppNm)}. ${opp ? `<button class="jz-btn big" data-act="cupplay" data-id="${opp.id}">CHALLENGE ${esc(opp.nick)}!</button>` : `<span class="jz-dim">${esc(mm.oppNm)} isn't online right now.</span>${oldStart ? ' <button class="jz-btn sm" data-act="cupwalk">Claim a walkover</button>' : ''}`}</p>`; }
    else head = '<p>The cup is under way! Watch the bracket fill up.</p>';
    const rn = ['QUARTER-FINALS', 'SEMI-FINALS', 'FINAL'];
    return `${head}<div class="jz-bracket">${br.rounds.map((rd, r) => `<div class="jz-round"><h5>${rn[r]}</h5>${rd.map(m => `<div class="jz-match${m.w !== undefined && m.w !== null ? ' done' : ''}"><div class="${m.w && m.w === m.a ? 'w' : ''}">${started || r === 0 ? names(m.a) : '?'}</div><div class="${m.w && m.w === m.b ? 'w' : ''}">${started || r === 0 ? names(m.b) : '?'}</div></div>`).join('')}</div>`).join('')}<div class="jz-round"><h5>CHAMPION</h5><div class="jz-match champ"><div>${br.champ ? who(br.nm(br.champ)) : '&#127942;'}</div></div></div></div>`;
  }

  // ================================================================ the arcade applet, borrowed from Jack Attack's Games page while you're here
  let arc = null; // { node, parent, next }
  function mountArcade(host) {
    const node = arc ? arc.node : document.querySelector('#s-demos .demo[data-demo="arcade"] .arcgrid');
    if (!node) { host.innerHTML = '<p class="jz-dim">The Java Arcade applet could not start. (Try going to Jack Attack\'s Games page first.)</p>'; return; }
    if (!arc) arc = { node, parent: node.parentNode, next: node.nextSibling };
    host.innerHTML = ''; host.appendChild(node);
    window.dispatchEvent(new Event('resize'));
  }
  function restoreArcade() {
    if (!arc || !arc.parent || arc.node.parentNode === arc.parent) return;
    arc.parent.insertBefore(arc.node, arc.next && arc.next.parentNode === arc.parent ? arc.next : null);
  }
  let arcPlaying = false;
  setInterval(() => { // spot somebody playing the arcade inside the Zone
    if (!arc || !arc.node.closest('.jz')) { arcPlaying = false; return; }
    if (window.Arcade && Arcade.mode === 'play' && !arcPlaying) { arcPlaying = true; secret('zone.arcade'); }
    const n = document.querySelector('#s-secret .jz-arcade'); if (n) n.querySelectorAll('[data-live="np"]').forEach(x => { const l = window.SiteArcade ? SiteArcade.list(x.dataset.id) : []; x.textContent = l.length ? ` (${l.length} playing)` : ''; });
  }, 1500);

  // ================================================================ rendering + actions
  let offs = [];
  function render(path, el) {
    offs.forEach(f => f()); offs = [];
    if (path !== '/arcade.html') restoreArcade();
    loadMine(); Z.loadShared(); Z.enterSite();
    let fn = R[path], m;
    if (!fn && (m = /^\/games\/([a-z0-9]+)\.html$/.exec(path)) && Z.META[m[1]]) fn = gamePage(m[1]);
    if (!fn && (m = /^\/rooms\/([a-z0-9]+)-([0-2])\.html$/.exec(path)) && Z.META[m[1]]) fn = roomPage(m[1], +m[2]);
    if (!fn && (m = /^\/profile\/([a-z0-9_.-]{1,24})\.html$/.exec(path))) fn = profilePage(m[1]);
    if (!fn) fn = R['/home.html'];
    fn(el);
    fillLive(el);
    if (!el.dataset.wired) { el.dataset.wired = '1'; wire(el); }
    const off = Z.onChange(() => { if (!el.isConnected) { off(); return; } if (/^\/profile\//.test(path) && !el.dataset.drawn && Z.ladder.loaded) { el.dataset.drawn = '1'; fn(el); } fillLive(el); });
    offs.push(off);
  }
  function wire(el) {
    el.addEventListener('click', ev => {
      const a = ev.target.closest('[data-act]'); if (!a) { if (ev.target.closest('.jz-ad')) secret('zone.ad'); return; }
      const d = a.dataset, act = d.act;
      if (act === 'cpu') { Z.playCpu(d.g, +d.lv); }
      else if (act === 'sit') { if (Z.sit(d.g, +d.lv, +d.t)) secret('zone.logon'); }
      else if (act === 'stand') Z.stand();
      else if (act === 'watch') Z.watch(+d.hid, d.gid, d.g, +d.lv);
      else if (act === 'inv') { const row = el.querySelector(`.jz-invrow[data-for="${d.id}"]`); const g = (/\/(?:games|rooms)\/([a-z0-9]+)/.exec($addr()) || [])[1]; if (row) invForm(row, +d.id, g); else { const t = Z.online.find(o => o.id === +d.id); if (t) Z.invite(t, 'reversi', 0, ok => { if (ok) Z.startHosted(t.id, t.nick, 'reversi', 0, { inv: true }); }); } }
      else if (act === 'sendinv') { const f = a.closest('.jz-invform'), g = f.querySelector('[data-k="g"]').value, lv = +f.querySelector('[data-k="lv"]').value, t = Z.online.find(o => o.id === +d.id); a.closest('.jz-invrow').hidden = true; if (t && Z.META[g]) Z.invite(t, g, lv, ok => { if (ok) Z.startHosted(t.id, t.nick, g, lv, { inv: true }); }); }
      else if (act === 'say') sayFrom(a.closest('.jz-chatform'));
      else if (act === 'mplobby') { ev.preventDefault(); if (window.MP) MP.lobby(); }
      else if (act === 'mpopen') { const x = window.MP && MP.GAMES[d.g]; if (x && x.open) x.open(); }
      else if (act === 'mpfind') { if (window.MP) MP.pick(d.g); }
      else if (act === 'mpget') { if (window.MP) MP.getSoftware(); }
      else if (act === 'mpjoin') { const x = el._mpSeeks && el._mpSeeks[+d.i]; if (x && window.MP) MP.join(x); }
      else if (act === 'arc') { if (window.Arcade) { Arcade.select(d.id); el.querySelectorAll('[data-act="arc"]').forEach(b => b.classList.toggle('on', b === a)); const c = document.getElementById('arcade'); if (c) c.focus(); } }
      else if (act === 'save') saveProfile(el);
      else if (act === 'dl') download(el, a);
      else if (act === 'cupin') { if (!Net.connected) return; Net.kv.put('zone.cup', `${wk()}.p.${fieldOf(meNick())}`, `${Date.now().toString(36)}|${String(meNick()).replace(/\|/g, '').slice(0, 24)}`); secret('zone.cup'); setTimeout(() => { if (cupPlayers().length >= 8 && !cupStarted()) Net.kv.put('zone.cup', wk() + '.go', String(Date.now())); }, 600); }
      else if (act === 'cupout') Net.kv.put('zone.cup', `${wk()}.p.${fieldOf(meNick())}`, '');
      else if (act === 'cupgo') { if (cupPlayers().length >= 2) Net.kv.put('zone.cup', wk() + '.go', String(Date.now())); }
      else if (act === 'cupplay') { const t = Z.online.find(o => o.id === +d.id); if (t) Z.invite(t, 'reversi', 1, ok => { if (ok) Z.startHosted(t.id, t.nick, 'reversi', 1, { inv: true }); }); }
      else if (act === 'cupwalk') { const mm = myCupMatch(); if (mm) Net.kv.put('zone.cup', `${wk()}.m.${mm.r}.${mm.i}`, fieldOf(meNick())); }
    });
    el.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches('[data-k="say"]')) { ev.preventDefault(); sayFrom(ev.target.closest('.jz-chatform')); } });
    el.addEventListener('change', ev => { if (ev.target.matches('[data-k="quick"]')) { const f = ev.target.closest('.jz-chatform'); if (ev.target.value) { f.querySelector('[data-k="say"]').value = ev.target.value; sayFrom(f); } ev.target.value = ''; } });
  }
  const $addr = () => (document.getElementById('addrBar') || {}).value || '';
  function sayFrom(f) {
    const inp = f.querySelector('[data-k="say"]'), msg = f.querySelector('.jz-chatmsg'), r = Z.chat.say(inp.value);
    msg.textContent = r === 'slow' ? 'Slow down! One message every 5 seconds (the modem needs a rest).' : r === 'offline' ? 'Not connected to JackNet!' : '';
    if (r === 'ok') inp.value = '';
  }
  function saveProfile(el) {
    const av = +((el.querySelector('input[name="jzav"]:checked') || {}).value || 0), text = Z.nanny(String(el.querySelector('[data-k="tag"]').value || '').replace(/[|\u0000-\u001f]/g, '').slice(0, 80));
    ['noinv', 'hints', 'chatSnd'].forEach(k => { Z.opts[k] = el.querySelector(`[data-k="${k}"]`).checked; }); Z.saveOpts();
    if (Z.opts.noinv) secret('zone.ignore');
    const ok = Net.kv.put('zone.tag', fieldOf(meNick()), `${av}|${text}`);
    el.querySelector('.jz-savemsg').textContent = ok ? 'Saved! Looking good.' : 'Could not save: not connected to JackNet.';
    if (ok) { secret('zone.signup'); sfx('solve'); }
  }
  function download(el, btn) {
    btn.disabled = true; const box = el.querySelector('.jz-dlprog'), bar = box.querySelector('i'), msg = box.querySelector('.jz-dlmsg'); box.hidden = false;
    const steps = ['Connecting to ftp.jacknetzone.jnet...', 'Downloading ZONEPLUG.EXE: 3 hours remaining', 'Downloading ZONEPLUG.EXE: 9 minutes remaining', 'Downloading ZONEPLUG.EXE: 4 days remaining (somebody picked up the phone)', 'Downloading ZONEPLUG.EXE: 2 seconds remaining', 'Installing...', 'Checking for older versions...'];
    let k = 0; const t = setInterval(() => {
      if (!el.isConnected) return clearInterval(t);
      k++; bar.style.width = Math.min(100, k * 15) + '%'; msg.textContent = steps[Math.min(steps.length - 1, k - 1)];
      if (k > steps.length) { clearInterval(t); bar.style.width = '100%'; msg.innerHTML = '<b>Done!</b> The Zone Plug-in 2.0 was already installed. It was always installed. It was inside you all along.'; secret('zone.plugin'); btn.disabled = false; sfx('solve'); }
    }, 650);
  }
  Z.siteSection = on => { if (!on) restoreArcade(); };
  Z.site = { render, restoreArcade };
  // the arcade goes home if Jack Attack's own Games page is opened
  document.addEventListener('section', e => { if (e.detail === 'demos') restoreArcade(); });
})();

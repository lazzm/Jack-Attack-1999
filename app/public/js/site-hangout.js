/* THE HANGOUT: a 90s avatar chat (think The Palace) on www.jackattack.jnet. Five pixel-art rooms, everyone on the site
 * shows up as their avatar, click to walk, chat bubbles, emotes, shared props (lava lamp, telly, fish, jukebox, band,
 * ball), a topic of the day, a daily question, and Gubbinz running trivia. Loaded the first time someone opens the page.
 * Positions/emotes go over Net.relay('site.hg'); speech is the normal JackNet chat; props live in Net.kv 'site.hg'. */
(function () {
  if (window.Hangout) return;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const sfx = n => window.Sound && Sound.play(n);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const me = () => Net.me;
  const myField = () => 'v' + String(Net.cid || 'x').replace(/[^a-z0-9]/g, '').slice(0, 16);
  const D = window.SITE_DATA || {};
  const t99 = Desk.today99();
  const inHang = () => window.IE && IE.current === 'hangout';
  const NAMES = { home: 'the home page', demos: 'the Games', grot: 'Gubbinz', saver: 'the Screensaver', reviews: 'Reviews', cheats: 'Cheats', orks: 'Hobby Corner', letters: 'Letters', art: 'the Art Wall', chat: 'the Chat Room', forums: 'the Forums', members: 'Members', starwars: 'Star Wars', comics: 'Comics', top10: 'Top 10s', quiz: 'the Quiz', polls: 'Polls', compo: 'the Compo', penpals: 'Pen Pals', downloads: 'Downloads', links: 'Links', login: 'the Login page' };

  // ================================================================ rooms
  const ROOMS = {
    den: { name: 'The Den', left: 'garden', right: 'arcade', floor: '#8a5a3a', wall: '#3a5a9a' },
    arcade: { name: 'Arcade Corner', left: 'den', right: 'spacebar', floor: '#2a2a3a', wall: '#1a0a3a' },
    spacebar: { name: 'The Space Bar', left: 'arcade', right: 'orkhut', floor: '#3a3a44', wall: '#0a0a1a' },
    orkhut: { name: 'The Workshop', left: 'spacebar', right: 'garden', floor: '#5a4a2a', wall: '#4a3a1a' },
    garden: { name: 'The Garden', left: 'orkhut', right: 'den', floor: '#3a9a2a', wall: '#7ec8ff' },
  };
  const ROOM_IDS = Object.keys(ROOMS);
  const EMO = new Set(['wave', 'dance', 'sit', 'waaagh', 'jump', 'laugh', 'bow', 'shrug', 'bounce']);

  // ================================================================ state
  const people = new Map(); // id -> {id,nick,col,member,where,room,x,y,av,s,away,t,el}
  let mine = { room: ROOM_IDS.includes(store.get('jhp_site_hgroom', 'den')) ? store.get('jhp_site_hgroom', 'den') : 'den', x: 0.3 + Math.random() * 0.4, y: 0.72 + Math.random() * 0.15, av: store.get('jhp_site_av', 0) | 0, s: '', away: '' };
  let props = {};
  let viewRoom = mine.room;

  // ================================================================ page
  const body = $('hgBody'); body.innerHTML = '';
  const TOPICS = ['Best four-player game on the N64?', 'Is Jar Jar actually OK?', 'What will you be doing at the Millennium?', 'Squirtle, Charmander or Bulbasaur? (Squirtle.)', 'Best Robot Wars robot ever?', 'What\'s your Tetris high score? (Be honest.)', 'Dreamcast or wait for the next PlayStation?', 'Best film of 1999 so far?', 'What should Gubbinz eat next?', 'Who would win: a Dalek or a Jedi?', 'What\'s the worst thing your Mom has said about your computer?', 'What modem have you got? Brag or weep.', 'Best cheat code of all time?', 'What are you getting for Christmas?', 'What\'s in YOUR bits box?', 'Favourite level in any game ever?', 'What will computers be like in the year 2000?', 'Best Saturday morning telly?', 'Red ones go faster: true or TRUE?', 'What\'s the hardest game you ever finished?', 'Rubik\'s cube: solved it or peeled the stickers?', 'What would you put on your own home page?', 'Best sci-fi telly show?', 'What\'s the best thing about 1999?', 'GoldenEye: is Oddjob allowed?', 'Game Boy or Game Boy Color?', 'Best lightsaber colour?', 'What\'s your screensaver?', 'Favourite sweets from the corner shop?', 'If you had a podracer, what colour?'];
  const QUESTIONS = ['What did you have for tea?', 'What game are you playing at the moment?', 'What\'s your favourite Pokémon?', 'If you could have any robot, what would it do?', 'What\'s the best thing on telly this week?', 'What would you name your own Pokemon?', 'What\'s your favourite word?', 'Describe your bedroom in five words.', 'What\'s the best Star Wars character?', 'What\'s your desktop wallpaper?', 'What\'s the last film you saw?', 'What\'s your dream console?', 'What will you do on 31/12/99?', 'Best crisp flavour?', 'What\'s your hidden talent?', 'Which game would you live inside?', 'What\'s in your pocket right now?', 'What\'s the funniest thing that happened at school this week?', 'Cats or dogs? Or Tamagotchis?', 'What\'s your favourite sound effect?', 'What\'s the best present you ever got?', 'What\'s your favourite level?', 'Name a song stuck in your head.', 'What\'s the best cheat code you know?', 'If you were a Robot Wars robot, what would your name be?', 'What did you build out of LEGO last?', 'What\'s your best Tetris tip?', 'Who\'s your favourite baddie?', 'What would you put in a time capsule for 2099?', 'What do you think the Millennium Bug will actually do?'];
  const day = Math.floor((t99.date - new Date(1999, 0, 1)) / 86400000);
  const topic = TOPICS[day % TOPICS.length], dq = QUESTIONS[(day * 7 + 3) % QUESTIONS.length], dqid = 'q' + day;
  const friday = t99.date.getDay() === 5;
  const top = h('div', 'hgtop', `<div class="hgtopic"><b>TOPIC OF THE DAY:</b> ${esc(topic)}</div>${friday ? '<div class="hgfri">★ IT\'S FRIDAY: FRIDAY NIGHT QUIZ! Gubbinz asks a question every 2 minutes from 7pm. Type the letter to answer! ★</div>' : ''}`);
  body.appendChild(top);
  const lay = h('div', 'hglay'); body.appendChild(lay);
  const left = h('div', 'hgleft'), right = h('div', 'hgright'); lay.append(left, right);
  const embed = h('div', 'javaembed hgembed');
  embed.innerHTML = `<div class="jlabel">&#9749; hangout.class <small>(Java applet: click to walk, click things to use them)</small></div><div class="hgroom" tabindex="0" aria-label="The Hangout room. Click to walk around."><canvas width="320" height="200" aria-hidden="true"></canvas><div class="hglayer"></div><button class="hgdoor l" type="button"></button><button class="hgdoor r" type="button"></button><div class="hgroomname"></div><div class="hgtip" hidden></div></div><div class="hgrooms"></div><div class="jcap">Applet hangout started</div>`;
  left.appendChild(embed);
  const roomEl = embed.querySelector('.hgroom'), cv = roomEl.querySelector('canvas'), g = cv.getContext('2d'), layer = roomEl.querySelector('.hglayer'), tip = roomEl.querySelector('.hgtip');
  const chat = h('div', 'hgchat', `<div class="hglog" role="log" aria-live="polite"></div><form id="hgForm" class="hgform" autocomplete="off"><input type="text" maxlength="200" placeholder="Say something! (or /help)" aria-label="Say something in the Hangout"><button class="btn" type="submit">Say</button></form><div class="hgemotes">${['wave', 'dance', 'sit', 'jump', 'laugh', 'waaagh'].map(e => `<button class="btn" type="button" data-emo="${e}">/${e}</button>`).join('')}<button class="btn" type="button" data-away>/away</button></div>`);
  left.appendChild(chat);
  const log = chat.querySelector('.hglog');
  right.innerHTML = `<table class="webtable hgwho"><tr><th colspan="3">WHO'S HERE <span class="live">LIVE</span></th></tr><tbody></tbody></table>
    <table class="webtable hgdq"><tr><th>QUESTION OF THE DAY</th></tr><tr><td><b>${esc(dq)}</b><form class="hgdqform" autocomplete="off"><input type="text" maxlength="120" placeholder="Your answer..."><button class="btn" type="submit">Answer</button></form><ul class="hgdqlist"></ul></td></tr></table>
    <table class="webtable hgjuke"><tr><th>JUKEBOX</th></tr><tr><td><div class="hgnow">Nothing playing.</div><div class="hgjukeform"><select aria-label="Pick a tune"></select><button class="btn" type="button">Play for everyone</button></div><div class="small">You'll only hear it with SFX on (the speaker by the clock).</div></td></tr></table>
    <table class="webtable hgtriv"><tr><th>GUBBINZ'S TRIVIA</th></tr><tr><td><div class="hgtq">Next question soon...</div><ol class="hgtscores"></ol></td></tr></table>`;

  // ================================================================ drawing the rooms (320x200 pixel art, original)
  const R = (x, y, w, hh, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(hh)); };
  const hour = () => new Date().getHours();
  const night = () => { const hr = hour(); return hr < 7 || hr >= 20; };
  function season() { const m = t99.m, d = t99.d; return m === 12 ? 'xmas' : (m === 10 && d >= 24) ? 'halloween' : (m === 11 && d <= 6) ? 'bonfire' : (m === 3 && d >= 30) || (m === 4 && d <= 5) ? 'easter' : (m === 8 && d === 11) ? 'eclipse' : (m === 7 && d >= 14 && d <= 20) ? 'ep1' : (m === 1 && d <= 2) ? 'newyear' : (m <= 2) ? 'winter' : ''; }
  let tick = 0;
  function drawRoom() {
    const id = viewRoom, rm = ROOMS[id], t = tick, sea = season();
    R(0, 0, 320, 200, rm.wall); R(0, 120, 320, 80, rm.floor);
    if (id === 'den') {
      for (let x = 0; x < 320; x += 16) R(x, 0, 8, 120, '#355590');
      R(0, 116, 320, 6, '#d8d0b0');
      // window
      R(130, 18, 60, 44, '#d8d0b0'); R(134, 22, 52, 36, night() ? '#0a0a3a' : '#9fd0ff'); R(159, 22, 2, 36, '#d8d0b0'); R(134, 39, 52, 2, '#d8d0b0'); if (night()) { R(140, 28, 1, 1, '#fff'); R(175, 32, 1, 1, '#fff'); R(166, 26, 2, 2, '#ffd'); }
      // posters
      R(20, 20, 34, 46, '#000'); R(23, 23, 28, 40, '#0a0a2a'); R(28, 40, 18, 2, '#ccc'); R(35, 36, 4, 10, '#ccc'); R(26, 56, 22, 3, '#ffd400');
      R(70, 26, 40, 30, '#ffd400'); g.fillStyle = '#e10600'; g.font = 'bold 9px monospace'; g.fillText('WAAAGH', 73, 44);
      // telly + N64
      R(206, 70, 50, 40, '#222'); R(210, 74, 42, 30, props.tv === '1' ? '#88a' : '#123');
      if (props.tv === '1') for (let i = 0; i < 40; i++) R(210 + ((i * 37 + t * 13) % 42), 74 + ((i * 17 + t * 7) % 30), 2, 1, i % 2 ? '#fff' : '#ccd');
      R(204, 110, 54, 10, '#5a3a20'); R(214, 104, 20, 6, '#555'); R(218, 103, 4, 2, '#e10600'); R(226, 103, 4, 2, '#2a7ad8');
      // lava lamp
      const on = props.lava === '1'; R(272, 92, 12, 28, '#333'); R(274, 70, 8, 24, on ? '#ff6ab8' : '#664'); R(272, 66, 12, 5, '#333');
      if (on) { R(276, 74 + (t * 2 % 16), 4, 4, '#ffd400'); R(275, 88 - (t % 12), 5, 3, '#ff8a00'); }
      // fish tank
      R(14, 92, 52, 30, '#3aa0d0'); R(14, 92, 52, 3, '#c0c0c0'); R(12, 120, 56, 6, '#5a3a20'); const fed = Date.now() - (+props.fish || 0) < 8000;
      for (let i = 0; i < 3; i++) { const fx = 18 + ((t * (i + 1) * 3 + i * 17) % 40), fy = fed ? 97 + i : 100 + i * 6; R(fx, fy, 6, 3, ['#ff8a00', '#ffd400', '#e10600'][i]); R(fx - 2, fy + 1, 2, 1, '#ff8a00'); }
      R(20, 116, 6, 4, '#2a9a2a'); R(50, 112, 3, 8, '#2a9a2a');
      // sofa
      R(90, 128, 90, 22, '#a02020'); R(86, 120, 98, 12, '#801818'); R(86, 128, 10, 26, '#801818'); R(174, 128, 10, 26, '#801818');
      if (sea === 'xmas') { R(290, 60, 4, 60, '#5a3a20'); for (let i = 0; i < 5; i++) R(280 - i * 0 + i * 0 - (5 - i) * 3 + 12, 60 + i * 12, (5 - i) * 6 + 6, 12, '#1a6a1a'); for (let i = 0; i < 8; i++) R(284 + (i * 7) % 20, 66 + i * 6, 2, 2, ['#e10600', '#ffd400', '#2a7ad8'][i % 3]); R(290, 54, 4, 4, '#ffd400'); }
      if (sea === 'halloween') { R(110, 112, 12, 10, '#ff8a00'); R(113, 115, 2, 2, '#000'); R(117, 115, 2, 2, '#000'); R(114, 119, 4, 1, '#000'); }
      if (sea === 'newyear') { g.fillStyle = '#ffd400'; g.font = 'bold 10px monospace'; g.fillText('HAPPY NEW YEAR', 120, 12); }
    } else if (id === 'arcade') {
      for (let x = 0; x < 320; x += 20) for (let y = 120; y < 200; y += 20) R(x + ((y / 20) % 2) * 10, y, 10, 10, '#1a1a2a');
      for (let i = 0; i < 3; i++) { const x = 30 + i * 60; R(x, 50, 40, 72, ['#e10600', '#2a7ad8', '#ffd400'][i]); R(x + 5, 56, 30, 24, '#000'); R(x + 8 + (t * (i + 2)) % 22, 64 + i * 4, 3, 3, '#3f3'); R(x + 5, 86, 30, 8, '#333'); R(x + 10, 88, 3, 3, '#e10600'); R(x + 20, 88, 3, 3, '#ffd400'); }
      g.fillStyle = '#ff2a6d'; g.font = 'bold 12px monospace'; g.fillText('ARCADE', 200, 30);
      // jukebox
      R(220, 52, 52, 70, '#c06030'); R(224, 56, 44, 26, '#ffd400'); g.fillStyle = props.juke ? ['#ff2a6d', '#00e5ff', '#b6ff00'][t % 3] : '#555'; g.fillRect(228, 60, 36, 18); R(226, 88, 40, 30, '#7a3a10'); for (let i = 0; i < 4; i++) R(230 + i * 9, 92, 6, 22, '#e8b060');
      if (props.juke) { g.fillStyle = '#fff'; g.font = '10px monospace'; g.fillText('♫', 280 + (t % 4), 60 - (t % 10)); }
    } else if (id === 'spacebar') {
      R(0, 0, 320, 120, '#0a0a1a'); for (let i = 0; i < 60; i++) R((i * 53) % 320, (i * 29) % 110, 1, 1, i % 5 ? '#889' : '#fff');
      R(40, 14, 240, 50, '#000'); R(44, 18, 232, 42, '#050520'); for (let i = 0; i < 30; i++) R(44 + ((i * 41 + t * (1 + i % 3)) % 232), 18 + (i * 13) % 42, 2, 1, '#ccf');
      R(170, 30, 30, 20, '#c9a060'); R(200, 38, 18, 4, '#a07840'); // a far-off planet
      R(20, 96, 180, 26, '#555'); R(20, 92, 180, 6, '#888'); for (let i = 0; i < 5; i++) R(30 + i * 34, 82, 6, 10, ['#3f3', '#4af', '#f6f', '#ff4', '#f80'][i]);
      // robot barman
      R(100, 66, 20, 18, '#aaa'); R(104, 70, 4, 4, props.band === '1' ? '#f33' : '#3cf'); R(112, 70, 4, 4, props.band === '1' ? '#f33' : '#3cf'); R(108, 60, 4, 6, '#aaa'); R(98, 84, 24, 8, '#777');
      // stage
      R(230, 96, 80, 26, '#3a1a4a'); R(230, 92, 80, 6, '#6a3a8a'); if (props.band === '1') { for (let i = 0; i < 3; i++) { const bx = 244 + i * 22, by = 72 + ((t + i) % 2) * 2; R(bx, by, 10, 18, ['#3a9a2a', '#c060c0', '#e8e8e8'][i]); R(bx + 2, by - 6, 6, 6, ['#3a9a2a', '#c060c0', '#e8e8e8'][i]); } R(230, 0, 2, 92, '#ff0a'); g.fillStyle = 'rgba(255,255,120,.15)'; g.fillRect(232, 0, 76, 120); }
      g.fillStyle = '#00e5ff'; g.font = 'bold 9px monospace'; g.fillText('OPEN 24 PARSECS', 8, 12);
      if (sea === 'ep1') { g.fillStyle = '#ffd400'; g.fillText('EPISODE I WEEK!!!', 200, 12); }
    } else if (id === 'orkhut') { // The Workshop: Jack's garage, where the cardboard battle robot is being built
      // breeze-block wall, strip light, concrete floor with an oil stain
      R(0, 0, 320, 120, '#8a8a7c'); for (let y = 0; y < 120; y += 12) { R(0, y, 320, 1, '#6a6a5e'); for (let x = (y / 12) % 2 ? 0 : 16; x < 320; x += 32) R(x, y, 1, 12, '#6a6a5e'); }
      R(0, 0, 320, 4, '#5a5a50'); R(96, 5, 128, 4, '#ddd'); R(98, 6, 124, 2, night() ? '#fff' : '#f4f4e0');       R(0, 114, 320, 6, '#5a5a50'); R(0, 120, 320, 80, '#7a786e'); for (let i = 0; i < 30; i++) R((i * 47) % 320, 124 + (i * 31) % 74, 6, 1, '#6e6c62'); R(150, 160, 34, 7, '#4e4c46'); R(156, 158, 20, 3, '#55534c');
      // the banner (hazard stripes, hand-painted)
      R(118, 18, 84, 38, '#111'); for (let i = 0; i < 21; i++) { R(119 + i * 4, 19, 2, 4, '#ffd400'); R(119 + i * 4, 51, 2, 4, '#ffd400'); }
      R(120, 23, 80, 28, '#ffd400'); R(120, 23, 80, 2, '#fff36a'); g.fillStyle = '#111'; g.font = 'bold 13px monospace'; g.fillText('WORKSHOP', 128, 40); g.font = 'bold 7px monospace'; g.fillText('MIND YOUR FINGERS', 125, 49);
      R(122, 12, 2, 7, '#333'); R(196, 12, 2, 7, '#333');
      // pegboard of tools on the left wall
      R(70, 62, 44, 34, '#c8a060'); for (let y = 65; y < 94; y += 4) for (let x = 73; x < 112; x += 4) R(x, y, 1, 1, '#8a6030');
      R(75, 66, 2, 14, '#888'); R(73, 64, 6, 4, '#aaa'); R(84, 66, 3, 12, '#c03030'); R(82, 64, 8, 3, '#555'); R(95, 64, 2, 16, '#a07040'); R(92, 63, 8, 4, '#777'); R(103, 66, 6, 2, '#e8b020'); R(104, 68, 2, 12, '#555');
      R(74, 85, 14, 2, '#bbb'); R(78, 83, 2, 6, '#bbb'); R(94, 84, 14, 8, '#2a7ad8'); R(96, 86, 10, 1, '#9fd0ff');
      // workbench with the half-built battle robot (cardboard, foil and a lot of tape)
      R(122, 88, 92, 6, '#a06a30'); R(122, 88, 92, 2, '#c88a48'); R(126, 94, 6, 26, '#6a4420'); R(204, 94, 6, 26, '#6a4420'); R(126, 108, 84, 3, '#6a4420');
      R(196, 80, 12, 8, '#555'); R(200, 77, 4, 4, '#777'); R(208, 82, 6, 2, '#777'); // vice
      const bz = (t % 8) < 4 ? 0 : 1;
      g.fillStyle = '#c8ccd4'; g.beginPath(); g.moveTo(136, 87); g.lineTo(146, 70); g.lineTo(150, 70); g.lineTo(150, 87); g.closePath(); g.fill(); g.fillStyle = '#eef'; g.fillRect(146, 71, 3, 1);
      R(150, 66, 38, 22, '#c8a070'); R(150, 66, 38, 2, '#e0c090'); R(186, 66, 2, 22, '#9a7448'); R(150, 85, 38, 3, '#9a7448');
      R(156, 70, 26, 9, '#c8ccd4'); R(157, 71, 24, 1, '#fff'); R(166, 66, 3, 22, '#e8e0a0'); R(160, 74, 4, 2, (t % 4) < 2 ? '#3f3' : '#0a0'); R(174, 74, 4, 2, '#e10600');
      R(153, 60, 30, 6, '#888'); R(154, 60, 28, 1, '#bbb'); R(184, 58 + bz, 3, 8, '#666'); R(182, 56 + bz, 7, 3, '#c03030');
      R(148, 80, 10, 10, '#222'); R(151, 83, 4, 4, '#777'); R(178, 80, 10, 10, '#222'); R(181, 83, 4, 4, '#777');
      g.fillStyle = '#111'; g.font = 'bold 6px monospace'; g.fillText('J-BOT', 157, 84);
      // oil-drum fire (for warming hands, and for burning toast)
      R(30, 98, 30, 24, '#3a5a8a'); R(30, 98, 30, 3, '#5a7aaa'); R(30, 106, 30, 2, '#2a4060'); R(30, 115, 30, 2, '#2a4060'); R(30, 98, 4, 24, '#4a6a9a'); R(54, 98, 6, 24, '#263a58'); R(36, 109, 6, 4, '#8a4a1a'); R(46, 102, 3, 3, '#8a4a1a');
      for (let i = 0; i < 7; i++) { const fh = 9 + ((t * (i + 3) + i * 5) % 10) - Math.abs(i - 3) * 1.5, fx = 32 + i * 4; R(fx - 1, 98 - fh * 0.5, 6, fh * 0.5, '#e8380a'); R(fx, 98 - fh, 3, fh, i % 2 ? '#ff6a00' : '#ff9a00'); R(fx + 1, 98 - fh - 2, 1, 2, '#ff6a00'); R(fx + 1, 98 - fh * 0.6, 2, fh * 0.6, '#ffd400'); R(fx + 1, 98 - fh * 0.3, 1, fh * 0.3, '#fff8b0'); }
      for (let i = 0; i < 3; i++) R(36 + ((t * 7 + i * 11) % 22), 82 - ((t * 3 + i * 9) % 18), 1, 1, '#ffd400');
      // shelf of cardboard robot helmets (Robot Wars night costumes)
      R(230, 52, 72, 4, '#7a4a20'); R(230, 52, 72, 1, '#a06a30'); R(234, 56, 2, 6, '#5a3410'); R(296, 56, 2, 6, '#5a3410');
      [['#c8a070', '#9a7448'], ['#c8ccd4', '#8a8e98'], ['#2a7ad8', '#1a4a90'], ['#e8381b', '#8a1a0a']].forEach(([c1, c2], i) => { const hx = 234 + i * 17; R(hx, 38, 13, 14, c1); R(hx, 38, 13, 1, '#fff8'); R(hx + 12, 38, 1, 14, c2); R(hx + 2, 43, 9, 3, '#111'); R(hx + 3, 44, 2, 1, '#3cf'); R(hx + 8, 44, 2, 1, '#3cf'); R(hx + 6, 33, 1, 5, '#555'); R(hx + 5, 31, 3, 2, i % 2 ? '#ffd400' : '#e10600'); });
      // the Blobbit's cage (it's a very happy Blobbit; it likes the fire)
      R(250, 92, 42, 30, '#2a2a2a'); R(250, 92, 42, 2, '#555'); R(252, 94, 38, 26, '#3a3a3a');
      const hop = (t % 6) < 2 ? 3 : 0, bx = 263, by = 105 - hop;
      R(bx + 1, by - 2, 3, 3, '#8a1a0a'); R(bx + 10, by - 2, 3, 3, '#8a1a0a'); R(bx, by, 14, 12, '#8a1a0a'); R(bx + 1, by + 1, 12, 10, '#e8381b'); R(bx + 2, by + 2, 3, 2, '#ff9a7a');
      R(bx + 3, by + 3, 3, 4, '#fff'); R(bx + 8, by + 3, 3, 4, '#fff'); R(bx + 4, by + 4, 2, 2, '#000'); R(bx + 9, by + 4, 2, 2, '#000'); R(bx + 5, by + 8, 4, 1, '#5a0a00'); R(bx + 2, by + 12, 3, 1, '#5a0a00'); R(bx + 9, by + 12, 3, 1, '#5a0a00');
      for (let i = 0; i < 7; i++) R(251 + i * 6.5, 92, 2, 30, '#999'); R(250, 120, 42, 2, '#555');
      // a stack of old tyres and a petrol can
      R(4, 104, 22, 6, '#222'); R(6, 106, 18, 2, '#444'); R(4, 110, 22, 6, '#1a1a1a'); R(6, 112, 18, 2, '#3a3a3a'); R(4, 116, 22, 5, '#222');
      R(220, 106, 12, 14, '#c01a1a'); R(222, 103, 4, 3, '#888'); R(221, 108, 3, 10, '#e84a3a');
      if (sea === 'bonfire' || sea === 'halloween') { R(88, 104, 12, 12, '#ff8a00'); R(91, 107, 2, 2, '#000'); R(95, 107, 2, 2, '#000'); R(91, 112, 6, 1, '#000'); R(93, 101, 2, 3, '#2a7a1a'); }
    } else if (id === 'garden') {
      const nt = night(); R(0, 0, 320, 120, nt ? '#0a0a3a' : sea === 'eclipse' ? '#2a3a5a' : '#7ec8ff');
      if (nt) { for (let i = 0; i < 40; i++) R((i * 61) % 320, (i * 23) % 100, 1, 1, '#fff'); R(270, 16, 14, 14, '#eee'); R(275, 16, 9, 9, '#0a0a3a'); }
      else if (sea === 'eclipse') { R(262, 12, 20, 20, '#fff8a0'); R(264, 13, 18, 18, '#000'); } else { R(262, 12, 20, 20, '#ffd400'); }
      if (sea === 'bonfire' && nt) for (let i = 0; i < 12; i++) { const fx = 60 + (i % 4) * 50, fy = 20 + Math.floor(i / 4) * 18; R(fx + ((t + i) % 6) - 3, fy + ((t * 2 + i) % 5), 2, 2, ['#f33', '#ff4', '#4af', '#f6f'][i % 4]); }
      for (let i = 0; i < 4; i++) { R(20 + i * 70, 40 + (i % 2) * 6, 40, 10, '#fff'); R(28 + i * 70, 34 + (i % 2) * 6, 22, 8, '#fff'); }
      R(0, 108, 320, 14, '#2a7a1a'); for (let x = 0; x < 320; x += 6) R(x, 104 + (x % 12 === 0 ? 0 : 2), 2, 6, '#2a7a1a');
      // shed
      R(10, 60, 60, 56, '#7a4a1a'); R(6, 52, 68, 10, '#5a2a0a'); R(30, 84, 18, 32, '#4a2a0a');
      // trampoline
      R(150, 140, 90, 6, '#222'); R(156, 146, 4, 20, '#777'); R(230, 146, 4, 20, '#777'); R(154, 138, 82, 4, '#2a7ad8');
      // ball
      const bx = 60 + (+String(props.ball || '0.5').split(',')[0] || 0.5) * 200; R(bx, 166, 10, 10, '#e10600'); R(bx + 2, 168, 3, 3, '#fff');
      if (sea === 'xmas' || sea === 'winter') { for (let i = 0; i < 50; i++) R((i * 37 + t * 2) % 320, (i * 19 + t * 3) % 200, 2, 2, '#fff'); R(0, 176, 320, 24, '#eef'); }
      if (sea === 'easter') for (let i = 0; i < 4; i++) R(90 + i * 50, 186, 6, 8, ['#ff8ac0', '#ffd400', '#7ec8ff', '#b6ff00'][i]);
    }
    // doors (drawn as arches at the edges)
    R(0, 70, 14, 52, '#2a1a0a'); R(2, 74, 10, 48, '#000'); R(306, 70, 14, 52, '#2a1a0a'); R(308, 74, 10, 48, '#000');
  }
  // what you can click on in each room: [x0,y0,x1,y1 (fractions), label, action]
  const HOT = {
    den: [[0.27, 0.6, 0.58, 0.78, 'Sofa: sit down', () => walkTo(0.42, 0.72, () => setSit('sit'))], [0.64, 0.35, 0.8, 0.55, 'Telly: switch over', () => toggleProp('tv')], [0.64, 0.5, 0.8, 0.6, 'N64: go and play', () => IE.go('demos', 'click')], [0.84, 0.32, 0.89, 0.6, 'Lava lamp: on/off', () => toggleProp('lava')], [0.04, 0.45, 0.21, 0.62, 'Fish tank: feed the fish', () => { Net.kv.put('site.hg', 'fish', String(Date.now())); say('* you sprinkle some fish food in. They go mental.'); }], [0.06, 0.1, 0.17, 0.33, 'Poster: the Star Wars page', () => IE.go('starwars', 'click')]],
    arcade: [[0.09, 0.25, 0.66, 0.61, 'Arcade cabinets: play a game', () => IE.go('demos', 'click')], [0.68, 0.26, 0.85, 0.61, 'Jukebox: pick a tune', () => right.querySelector('.hgjuke select').focus()]],
    spacebar: [[0.3, 0.3, 0.38, 0.46, 'Robot barman: order a drink', () => { const d = ['a glass of Um Bongo', 'a fizzy blue thing with a sparkler in it', 'a Millennium Milkshake (strawberry)', 'hot chocolate, it\'s cold in space', 'a "Nebula Fizz", which is just lemonade']; say(`* the robot barman pours you ${d[Math.floor(Math.random() * d.length)]}.`); sfx('pet'); }], [0.72, 0.36, 0.97, 0.62, 'Stage: start the band', () => toggleProp('band')], [0.14, 0.08, 0.86, 0.32, 'Window: look at the stars', () => say('* you look out at the stars. Somewhere out there, Dave\'s cousin is still lying.')]],
    orkhut: [[0.37, 0.07, 0.63, 0.3, 'Banner: give it a big shout', () => emote('waaagh', true)], [0.09, 0.4, 0.19, 0.61, 'Oil drum fire: warm your hands', () => say('* you warm your hands on the fire. Toasty. Smells of burnt toast.')], [0.78, 0.46, 0.91, 0.61, 'Cage: poke the Blobbit', () => { say('* you poke the Blobbit. It boings round the cage. Good Blobbit.'); sfx('boing'); }], [0.72, 0.18, 0.94, 0.27, 'Helmet rack: try one on', () => say('* you try on a cardboard robot helmet from the Robot Wars build. It\'s too big. You look brilliant.')]],
    garden: [[0.47, 0.67, 0.75, 0.85, 'Trampoline: bounce!', () => walkTo(0.6, 0.72, () => emote('bounce', true))], [0.15, 0.78, 0.85, 0.92, 'Ball: kick it', () => { const x = Math.random(); Net.kv.put('site.hg', 'ball', x.toFixed(2)); sfx('thud'); }], [0.03, 0.26, 0.22, 0.58, 'Shed: have a look', () => say('* the shed has a lawnmower, a broken bike and 40 tins of beans. Mom is READY.')]],
  };

  // ================================================================ people + avatars
  const avURL = i => (window.Community && Community.avatarURL ? Community.avatarURL(i | 0) : '');
  function person(id) {
    let p = people.get(id);
    if (!p) {
      const hs = hash(id);
      p = { id, nick: '?', col: '#000', member: false, where: '', room: 'den', x: 0.15 + (hs % 70) / 100, y: 0.7 + ((hs >> 7) % 20) / 100, av: 0, s: '', away: '', t: Date.now(), heard: false };
      p.el = h('div', 'hgav', '<img alt=""><span class="hgwear hgface"></span><span class="hgwear hghat"></span><span class="hgwear hgbadge"></span><span class="nm"></span><div class="bub" hidden></div>');
      people.set(id, p); layer.appendChild(p.el);
    }
    return p;
  }
  function place(p, instant) {
    const el = p.el, show = p.room === viewRoom;
    el.hidden = !show; if (!show) return;
    const cur = { x: parseFloat(el.style.left) / 100, y: parseFloat(el.style.top) / 100 };
    const d = isNaN(cur.x) ? 0 : Math.hypot(cur.x - p.x, (cur.y - p.y) * 0.6);
    el.style.transition = instant || !d ? 'none' : `left ${Math.min(2.5, d * 3)}s linear, top ${Math.min(2.5, d * 3)}s linear`;
    el.style.left = (p.x * 100) + '%'; el.style.top = (p.y * 100) + '%'; el.style.zIndex = String(Math.round(p.y * 100));
    const img = el.querySelector('img'), src = avURL(p.member ? p.av : 0); if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    img.alt = p.nick;
    const isMe = p.id === me().id, elsewhere = !isMe && p.where !== 'hangout';
    el.querySelector('.nm').textContent = p.nick + (p.away ? ' (away)' : elsewhere && NAMES[p.where] ? ` (on ${NAMES[p.where]})` : '');
    el.querySelector('.nm').style.background = p.col || '#000';
    if (window.Econ && Econ.wearOf) { // hats, face items and badges bought with Rupees (economy pack)
      const w = Econ.wearOf(p.nick) || {}, set = (cls, svg) => { const e = el.querySelector(cls); if (e.dataset.v !== svg) { e.innerHTML = svg; e.dataset.v = svg; } };
      set('.hghat', w.hat ? Econ.hatSvg(w.hat) : ''); set('.hgface', w.face ? Econ.faceSvg(w.face) : ''); set('.hgbadge', w.badge ? Econ.badgeSvg(w.badge) : '');
    }
    el.classList.toggle('me', isMe); el.classList.toggle('dim', elsewhere || !!p.away || !!p.lostAt); el.classList.toggle('sit', p.s === 'sit');
  }
  function renderAll(instant) { for (const p of people.values()) place(p, instant); renderWho(); renderRoomTabs(); }
  // a dropped connection isn't a goodbye: their avatar waits (greyed) for 90 seconds in case they come straight back
  const LOST_MS = 90000;
  function dropLost(id) { const p = people.get(id); if (!p) return; if (!p.lostAt) { p.lostAt = Date.now(); p.el.classList.add('dim'); p.el.title = p.nick + ' (connection dropped...)'; } else if (Date.now() - p.lostAt > LOST_MS) { p.el.remove(); people.delete(id); } }
  setInterval(() => { for (const [id, p] of [...people]) if (p.lostAt) dropLost(id); }, 10000);
  function syncOnline(list) {
    const ids = new Set(list.map(o => o.id));
    for (const [id] of [...people]) if (!ids.has(id)) dropLost(id);
    for (const o of list) {
      const known = people.has(o.id), wasLost = known && people.get(o.id).lostAt;
      const p = person(o.id);
      if (wasLost) { p.lostAt = 0; p.el.title = ''; }
      if ((!known || wasLost) && o.id !== me().id && inHang()) share(o.id); // tell (re)arrivals where I am
      p.nick = String(o.nick).slice(0, 16); p.col = String(o.col || '#000').slice(0, 9); p.member = !!o.member; p.where = o.where || '';
      if (o.id === me().id) Object.assign(p, { room: mine.room, x: mine.x, y: mine.y, av: mine.av, s: mine.s, away: mine.away, where: inHang() ? 'hangout' : p.where });
    }
    renderAll(true);
  }
  Net.on('online', m => syncOnline(m.online || []));

  // ================================================================ talking to the others
  let lastSend = 0, sendT = null;
  function share(to) {
    const now = performance.now();
    const go = () => { lastSend = performance.now(); Net.relay(to || 0, 'site.hg', { k: 'st', r: mine.room, x: +mine.x.toFixed(3), y: +mine.y.toFixed(3), av: mine.av | 0, s: mine.s, a: mine.away ? 1 : 0 }); };
    if (to) return go();
    clearTimeout(sendT); if (now - lastSend > 250) go(); else sendT = setTimeout(go, 260);
  }
  Net.onRelay('site.hg', (d, m) => {
    if (!d || typeof d !== 'object' || !people.has(m.fromId)) return;
    const p = people.get(m.fromId); p.t = Date.now();
    if (d.k === 'hi') { share(m.fromId); }
    if (d.k === 'st' || d.k === 'hi') {
      if (ROOM_IDS.includes(d.r)) { if (p.heard && p.room !== d.r && p.room === viewRoom && inHang()) sys(`${p.nick} went to ${ROOMS[d.r].name}.`); else if (p.heard && d.r === viewRoom && p.room !== d.r && inHang()) sys(`${p.nick} came in.`); p.room = d.r; }
      if (typeof d.x === 'number' && typeof d.y === 'number') { p.x = clamp(d.x, 0.04, 0.96); p.y = clamp(d.y, 0.58, 0.95); }
      if (Number.isInteger(d.av) && d.av >= 0 && d.av < 16) p.av = d.av;
      p.s = d.s === 'sit' ? 'sit' : ''; p.away = d.a ? 'away' : ''; p.heard = true;
      place(p); renderWho(); renderRoomTabs();
    } else if (d.k === 'em' && EMO.has(d.e)) { if (p.room === viewRoom) doEmote(p, d.e); }
  });
  Net.on('gone', m => { if (people.has(m.id)) { dropLost(m.id); renderWho(); } });
  // our own connection came back: say hello again (everyone answers with where they are) and catch up on the room
  Net.on('welcome', () => setTimeout(() => {
    if (inHang()) Net.relay(0, 'site.hg', { k: 'hi', r: mine.room, x: +mine.x.toFixed(3), y: +mine.y.toFixed(3), av: mine.av | 0, s: mine.s, a: mine.away ? 1 : 0 });
    Net.kv.get(['site.hg']).then(v => { if (v['site.hg'] && typeof v['site.hg'] === 'object') { props = v['site.hg']; drawRoom(); } });
  }, 800));

  // ================================================================ moving about
  function walkTo(x, y, then) {
    mine.x = clamp(x, 0.04, 0.96); mine.y = clamp(y, 0.6, 0.95); mine.s = '';
    const p = people.get(me().id); if (p) { Object.assign(p, { x: mine.x, y: mine.y, s: '' }); place(p); }
    share();
    if (then) setTimeout(then, 600);
  }
  function setSit(s) { mine.s = s; const p = people.get(me().id); if (p) { p.s = s; place(p); } share(); }
  function goRoom(r, fromLeft) {
    if (!ROOMS[r]) return;
    mine.room = r; viewRoom = r; store.set('jhp_site_hgroom', r); mine.x = fromLeft ? 0.08 : 0.92; mine.y = 0.78; mine.s = '';
    const p = people.get(me().id); if (p) Object.assign(p, { room: r, x: mine.x, y: mine.y, s: '' });
    sfx('turn'); drawRoom(); renderAll(true); share(); sys(`You walk into ${ROOMS[r].name}.`);
    if (r === 'garden') window.Apps && Apps.secret('site.hggarden');
    const seen = store.get('jhp_site_hgrooms', []); if (!seen.includes(r)) { seen.push(r); store.set('jhp_site_hgrooms', seen); } if (ROOM_IDS.every(x => seen.includes(x))) window.Apps && Apps.secret('site.hgtour');
  }
  const frac = ev => { const r = roomEl.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height]; };
  const hotAt = (x, y) => (HOT[viewRoom] || []).find(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
  roomEl.addEventListener('click', ev => {
    if (ev.target.closest('.hgdoor')) return;
    const [x, y] = frac(ev), hot = hotAt(x, y);
    if (hot) { hot[5](); return; }
    if (y > 0.58) walkTo(x, y);
  });
  roomEl.addEventListener('pointermove', ev => { if (ev.pointerType !== 'mouse') return; const [x, y] = frac(ev), hot = hotAt(x, y); roomEl.style.cursor = hot ? 'pointer' : y > 0.58 ? 'crosshair' : 'default'; tip.hidden = !hot; if (hot) { tip.textContent = hot[4]; tip.style.left = (x * 100) + '%'; tip.style.top = (y * 100) + '%'; } });
  roomEl.addEventListener('pointerleave', () => { tip.hidden = true; });
  const doorL = roomEl.querySelector('.hgdoor.l'), doorR = roomEl.querySelector('.hgdoor.r');
  doorL.addEventListener('click', () => goRoom(ROOMS[viewRoom].left, false)); doorR.addEventListener('click', () => goRoom(ROOMS[viewRoom].right, true));
  function renderRoomTabs() {
    const tabs = embed.querySelector('.hgrooms'), counts = {};
    for (const p of people.values()) if (p.where === 'hangout' || p.id === me().id) counts[p.room] = (counts[p.room] || 0) + 1;
    tabs.innerHTML = ROOM_IDS.map(r => r === viewRoom ? `<b>${ROOMS[r].name} (${counts[r] || 0})</b>` : `<a href="#" data-room="${r}">${ROOMS[r].name}</a> (${counts[r] || 0})`).join(' | ');
    doorL.textContent = '◀ ' + ROOMS[ROOMS[viewRoom].left].name; doorR.textContent = ROOMS[ROOMS[viewRoom].right].name + ' ▶';
    doorL.setAttribute('aria-label', 'Door to ' + ROOMS[ROOMS[viewRoom].left].name); doorR.setAttribute('aria-label', 'Door to ' + ROOMS[ROOMS[viewRoom].right].name);
    roomEl.querySelector('.hgroomname').textContent = ROOMS[viewRoom].name;
  }
  embed.querySelector('.hgrooms').addEventListener('click', ev => { const a = ev.target.closest('[data-room]'); if (a) { ev.preventDefault(); goRoom(a.dataset.room, true); } });

  // ================================================================ emotes + speech bubbles
  function doEmote(p, e) {
    const el = p.el; el.classList.remove('emo-' + (el.dataset.emo || 'x')); void el.offsetWidth; el.classList.add('emo-' + e); el.dataset.emo = e;
    clearTimeout(p.emoT); p.emoT = setTimeout(() => el.classList.remove('emo-' + e), 1800);
    if (e === 'waaagh' && p.room === viewRoom) { roomEl.classList.add('shake'); setTimeout(() => roomEl.classList.remove('shake'), 700); sfx('waaagh'); }
    if (e === 'sit') { p.s = 'sit'; place(p); }
  }
  function emote(e, chatToo) {
    const p = people.get(me().id); if (!p || !EMO.has(e)) return;
    if (e === 'sit') { setSit('sit'); }
    doEmote(p, e); Net.relay(0, 'site.hg', { k: 'em', e });
    if (chatToo && window.SiteChat) Net.send({ t: 'chat', text: e === 'bounce' ? 'bounces on the trampoline. Boing!' : SiteChat.EMOTES[e] || e, me: true });
  }
  function bubble(nick, text, isMe) {
    const p = [...people.values()].find(q => q.nick === nick); if (!p || p.room !== viewRoom) return;
    p.t = Date.now();
    const b = p.el.querySelector('.bub'); b.textContent = (isMe ? '* ' : '') + text; b.classList.toggle('act', !!isMe); b.hidden = false;
    clearTimeout(p.bubT); p.bubT = setTimeout(() => { b.hidden = true; }, Math.min(9000, 3000 + text.length * 60));
  }
  function line(html, cls) { const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40; const d = h('div', cls || '', html); log.appendChild(d); while (log.children.length > 150) log.firstChild.remove(); if (atBottom) log.scrollTop = log.scrollHeight; }
  const hhmm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  function sys(text) { line(`<span class="ts">[${hhmm(new Date())}]</span> ${esc(text)}`, 'sys'); }
  function say(text) { line(`<span class="ts">[${hhmm(new Date())}]</span> ${esc(text)}`, 'act'); }
  function bot(text) { line(`<span class="ts">[${hhmm(new Date())}]</span> &lt;<b style="color:#2a9a2a">Gubbinz</b>&gt; ${esc(text)}`, 'bot'); }
  function chatLine(m) {
    const ts = `<span class="ts">[${hhmm(new Date(m.ts || Date.now()))}]</span> `;
    if (m.sys) line(ts + esc(String(m.text || '').replace(/\bORK INVADERS\b/g, 'SAUCER INVADERS').replace(/\bWHACK-A-GROT\b/g, 'WHACK-A-ROBOT').replace(/\bSQUIG LOB\b/g, 'BLOBBIT LOB')), 'sys'); // (old high-score lines in the log use the games' old names)
    else if (m.me) line(ts + `<span class="act">* ${esc(m.nick)} ${esc(m.text)}</span>`);
    else line(ts + `&lt;<b style="color:${esc(m.col)}">${esc(m.nick)}</b>&gt; ${esc(m.text)}`);
  }
  // seed the log with what's already been said, then follow the live chat
  const old = $('chatLog'); if (old) [...old.children].slice(-40).forEach(n => { const c = n.cloneNode(true); c.querySelectorAll('a').forEach(a => a.replaceWith(document.createTextNode(a.textContent))); log.appendChild(c); });
  sys(`*** Welcome to THE HANGOUT. Topic: ${topic}`); log.scrollTop = log.scrollHeight;
  Net.on('chat', m => { const c = m.m; if (!c) return; chatLine(c); if (!c.sys) { bubble(c.nick, c.text, c.me); trivAnswer(c); } });
  chat.querySelector('form').addEventListener('submit', ev => {
    ev.preventDefault(); const inp = chat.querySelector('input'); let text = inp.value.trim(); if (!text) return;
    if (/^\/nick\b/i.test(text)) { inp.value = ''; if (window.JackLogon) JackLogon.show(); return; }
    if (window.SiteChat && SiteChat.command(text)) { inp.value = ''; return; }
    let meAct = false; if (/^\/me\s+/i.test(text)) { meAct = true; text = text.replace(/^\/me\s+/i, ''); }
    if (Net.send({ t: 'chat', text, me: meAct })) inp.value = ''; else Desk.toast('Hangout', 'Not connected. Redialling...');
  });
  chat.querySelector('.hgemotes').addEventListener('click', ev => { const b = ev.target.closest('[data-emo]'); if (b) SiteChat.command('/' + b.dataset.emo); else if (ev.target.closest('[data-away]')) SiteChat.command(SiteChat.away ? '/back' : '/away'); });

  // ================================================================ who's here (with idle times)
  function idle(ms) { const s = ms / 1000; return s < 60 ? 'active' : s < 3600 ? Math.floor(s / 60) + 'm idle' : Math.floor(s / 3600) + 'h idle'; }
  function renderWho() {
    const tb = right.querySelector('.hgwho tbody'); if (!tb) return;
    const list = [...people.values()].sort((a, b) => (b.where === 'hangout') - (a.where === 'hangout') || a.nick.localeCompare(b.nick));
    tb.innerHTML = list.map(p => `<tr><td><span style="color:${esc(p.col)}">●</span> ${p.member ? '★' : ''}${esc(p.nick)}${p.id === me().id ? ' <small>(you)</small>' : ''}</td><td>${p.where === 'hangout' || p.id === me().id ? esc(ROOMS[p.room].name) : esc(NAMES[p.where] || 'somewhere')}</td><td class="small">${p.away ? 'away' : p.id === me().id ? 'here' : idle(Date.now() - p.t)}</td></tr>`).join('') || '<tr><td colspan="3">Just you!</td></tr>';
  }
  setInterval(renderWho, 15000);

  // ================================================================ shared props (Net.kv 'site.hg')
  function toggleProp(k) { const v = props[k] === '1' ? '0' : '1'; props[k] = v; Net.kv.put('site.hg', k, v); drawRoom(); sfx('click'); }
  const TUNES = [['theme', 'The JackOS theme'], ['tris', 'Korobeiniki (the Tetris one)'], ['site_jacktris', 'JACKTRIS remix'], ['grotdance', 'The Gubbinz Dance'], ['squigdance', 'Blobbit Shuffle'], ['site_spacebar', 'Space Bar Swing'], ['site_orkmarch', 'Ork March']].filter(t => !window.Sound || !Sound.tunes || Sound.tunes().includes(t[0]) || t[0].startsWith('site_'));
  const jsel = right.querySelector('.hgjuke select'); jsel.innerHTML = TUNES.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('');
  let jukePlaying = '';
  function renderJuke(play) {
    const [k, ts, by] = String(props.juke || '').split('|'), tune = TUNES.find(t => t[0] === k);
    right.querySelector('.hgnow').innerHTML = tune ? `♫ Now playing: <b>${esc(tune[1])}</b>${by ? ` (picked by ${esc(by)})` : ''}` : 'Nothing playing.';
    if (play && tune && inHang() && window.Sound && Sound.on && Date.now() - (+ts || 0) < 120000) { Sound.music.play(k); jukePlaying = k; }
  }
  right.querySelector('.hgjuke .btn').addEventListener('click', () => {
    const k = jsel.value, tune = TUNES.find(t => t[0] === k); if (!tune) return;
    Net.kv.put('site.hg', 'juke', `${k}|${Date.now()}|${me().nick}`.slice(0, 120));
    if (window.SiteHappen) SiteHappen('juke', tune[1]); sfx('click');
    if (!(window.Sound && Sound.on)) Desk.toast('Jukebox', 'Turn SFX on (the speaker by the clock) to hear it!', 4000);
  });
  Net.kv.get(['site.hg', 'site.hg.triv']).then(v => { props = v['site.hg'] && typeof v['site.hg'] === 'object' ? v['site.hg'] : {}; triv = v['site.hg.triv'] && typeof v['site.hg.triv'] === 'object' ? v['site.hg.triv'] : {}; drawRoom(); renderJuke(false); renderTriv(); });
  Net.kv.watch('site.hg', ev => { if (ev.type !== 'put') return; props[ev.f] = ev.v; drawRoom(); if (ev.f === 'juke') renderJuke(true); if (ev.f === 'lava' && inHang() && viewRoom === 'den' && ev.by !== me().nick) sys(`${ev.by} switched the lava lamp ${ev.v === '1' ? 'on' : 'off'}.`); if (ev.f === 'band' && inHang() && ev.v === '1' && ev.by !== me().nick) sys(`${ev.by} got the band going in the Space Bar!`); });

  // ================================================================ question of the day (Net.kv.push 'site.dq': "qid|answer")
  let dqList = [];
  const dqUl = right.querySelector('.hgdqlist'), dqForm = right.querySelector('.hgdqform');
  function renderDq() { const rows = dqList.filter(e => String(e.text).startsWith(dqid + '|')).slice(-12).reverse(); dqUl.innerHTML = rows.map(e => `<li><b style="color:${esc(e.col || '#000')}">${esc(e.by)}:</b> ${esc(String(e.text).slice(dqid.length + 1))}</li>`).join('') || '<li><i>Nobody\'s answered yet. Go on!</i></li>'; if (store.get('jhp_site_dq', '') === dqid) dqForm.hidden = true; }
  dqForm.addEventListener('submit', ev => { ev.preventDefault(); const v = dqForm.querySelector('input').value.trim(); if (!v) return; if (Net.kv.push('site.dq', `${dqid}|${v}`.slice(0, 200))) { store.set('jhp_site_dq', dqid); dqForm.querySelector('input').value = ''; sfx('pet'); renderDq(); } });
  Net.kv.get(['site.dq']).then(v => { dqList = Array.isArray(v['site.dq']) ? v['site.dq'] : []; renderDq(); });
  Net.kv.watch('site.dq', ev => { if (ev.type === 'push') { dqList.push(ev.e); if (dqList.length > 40) dqList.shift(); renderDq(); } });

  // ================================================================ Gubbinz's trivia: same question at the same time for everyone (from the clock),
  // the first correct answer in the shared chat wins, and every client agrees because they all see the chat in the same order.
  let triv = {}, tSlot = -1, tWon = false;
  const QS = D.quiz || [];
  const period = () => { const hr = new Date().getHours(); return friday && hr >= 19 && hr < 23 ? 120000 : 300000; };
  const curQ = () => { const P = period(), slot = Math.floor(Date.now() / P); return { slot, P, q: QS.length ? QS[hash('t' + slot) % QS.length] : null, age: Date.now() - slot * P }; };
  const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/&eacute;/g, 'é').replace(/&amp;/g, '&').replace(/&pound;/g, '£');
  function renderTriv() {
    const rows = Object.entries(triv).map(([f, v]) => { const [s, n] = String(v).split('|'); return { f, s: +s || 0, n: n || '?' }; }).filter(r => r.s > 0).sort((a, b) => b.s - a.s).slice(0, 5);
    right.querySelector('.hgtscores').innerHTML = rows.map(r => `<li${r.f === myField() ? ' class="me"' : ''}>${esc(r.n)}: ${r.s}</li>`).join('') || '<li>No points yet!</li>';
  }
  Net.kv.watch('site.hg.triv', ev => { if (ev.type === 'put') { triv[ev.f] = ev.v; renderTriv(); } });
  function trivTick() {
    const c = curQ(); if (!c.q) return;
    const open = c.age < c.P * 0.6;
    if (c.slot !== tSlot) { tSlot = c.slot; tWon = false; if (inHang()) { bot(`TRIVIA TIME! ${strip(c.q[0])}  a) ${strip(c.q[1][0])}  b) ${strip(c.q[1][1])}  c) ${strip(c.q[1][2])}  d) ${strip(c.q[1][3])}  (type the letter!)`); sfx('beep'); } }
    right.querySelector('.hgtq').innerHTML = open ? `<b>${c.q[0]}</b><br>a) ${c.q[1][0]} b) ${c.q[1][1]} c) ${c.q[1][2]} d) ${c.q[1][3]}<br><small>Type the letter in the chat! ${Math.ceil((c.P * 0.6 - c.age) / 1000)}s left</small>` : `Next question in ${Math.ceil((c.P - c.age) / 1000)}s.`;
    if (!open && !tWon && c.age < c.P * 0.6 + 3000 && inHang()) { tWon = true; bot(`Time's up! It was ${'abcd'[c.q[2]]}) ${strip(c.q[1][c.q[2]])}. Nobody got it. Bunch of newbies.`); }
  }
  function trivAnswer(m) {
    const c = curQ(); if (!c.q || tWon || c.age >= c.P * 0.6 || m.me) return;
    const a = String(m.text).trim().toLowerCase().replace(/[).!]$/, '');
    const k = 'abcd'.indexOf(a); if (a.length !== 1 || k < 0) return;
    if (k === c.q[2]) {
      tWon = true; if (inHang()) bot(`${m.nick} got it! ${'abcd'[k]}) ${strip(c.q[1][k])}. One point to ${m.nick}. Get in!`);
      if (m.nick === me().nick) { const mineS = (+String(triv[myField()] || '0').split('|')[0] || 0) + 1; Net.kv.put('site.hg.triv', myField(), `${mineS}|${me().nick}`); if (window.SiteHappen) SiteHappen('triv'); sfx('solve'); }
    }
  }
  setInterval(() => { if (inHang()) trivTick(); }, 1000);

  // ================================================================ seasonal + loop
  let vis = true, raf = 0, lastDraw = 0;
  function loop(now) { if (!vis || !inHang()) { raf = 0; return; } if (now - lastDraw > 140) { lastDraw = now; tick++; drawRoom(); } raf = requestAnimationFrame(loop); }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  if (window.IntersectionObserver) new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) kick(); }).observe(roomEl);
  function enter() {
    const p = person(me().id); Object.assign(p, { nick: me().nick, col: me().col || '#000', member: !!me().member, where: 'hangout', room: mine.room });
    viewRoom = mine.room; drawRoom(); renderAll(true); kick();
    Net.relay(0, 'site.hg', { k: 'hi', r: mine.room, x: +mine.x.toFixed(3), y: +mine.y.toFixed(3), av: mine.av | 0, s: mine.s, a: mine.away ? 1 : 0 });
    if (window.SiteHappen) SiteHappen('hang', ROOMS[mine.room].name);
    if (me().member && !store.get('jhp_site_av_known', false)) Net.send({ t: 'profile', name: me().nick });
    trivTick();
  }
  document.addEventListener('section', ev => {
    if (ev.detail === 'hangout') enter();
    else { if (jukePlaying && window.Sound && Sound.music) { Sound.music.stop(); jukePlaying = ''; } const p = people.get(me().id); if (p) { p.where = String(ev.detail); place(p); } }
  });
  Net.on('profile', m => { if (m.p && m.p.me && Number.isInteger(m.p.avatar)) { mine.av = m.p.avatar; store.set('jhp_site_av', m.p.avatar); store.set('jhp_site_av_known', true); const p = people.get(me().id); if (p) { p.av = mine.av; p.member = true; place(p); } share(); } });
  document.addEventListener('econ-wear', () => { for (const p of people.values()) place(p, true); });
  Net.on('you', () => { const p = people.get(me().id); if (p) { p.nick = me().nick; p.member = !!me().member; place(p); } });
  setInterval(() => { if (inHang() && !document.hidden) share(); }, 20000);
  if (window.Apps) { Apps.defineSecret('site.hgtour', 'Grand tour', 'Visit every room in the Hangout'); Apps.defineSecret('site.hggarden', 'Fresh air', 'Find the garden'); }

  window.Hangout = {
    setAway(a) { mine.away = a; const p = people.get(me().id); if (p) { p.away = a; place(p); } share(); renderWho(); },
    emote(e) { if (EMO.has(e)) emote(e, false); },
    goRoom, get room() { return mine.room; }, get people() { return [...people.values()].map(p => ({ id: p.id, nick: p.nick, room: p.room, x: p.x, y: p.y, where: p.where })); },
  };
  syncOnline(window.SiteOnline || []);
  if (inHang()) enter();
})();

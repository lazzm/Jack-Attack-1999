/* hs-telly: THE FAMILY TELLY in the lounge (21-inch, on a black ash stand, a video recorder under it). Sit down in front of it
 * (too close: "you'll get square eyes!") with the remote: five channels of original parody programmes that change with the
 * time of day (news, cartoons, a quiz, a soap, robot fighting, the snooker, a maths lecture at night, the test card...),
 * TELLY-TEXT on the TEXT button (js/hs-ttx.js), subtitles on 888, and the video: real tapes you pick up off the shelf and push
 * into the slot (the house's grab system), play, rewind ("be kind"), fast forward, eject, and the TIMER (good luck).
 * The picture is one canvas: a texture on the 3D telly when you walk past, and laid crisply over the glass when you sit. */
(function () {
  'use strict';
  const H = window.House, R = window.Room, HR = window.HouseRooms;
  if (!H || !H.ok || !HR || window.HouseTelly) return;
  const K = H.K, T = H.T, A = window.HouseArt, D2R = Math.PI / 180, GY = 353;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const say = (t, x, ms) => H.say(t, x, ms);
  const secret = id => { try { R._.secret(id); } catch (e) {} };
  const life = () => window.HouseLife;
  const loadJs = src => (window.Apps && Apps.load) ? Apps.load(src) : new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  const KEY = 'jhp_hs_telly';
  const S = (() => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } })();
  S.tapes = S.tapes || {}; S.ch = S.ch || 1; S.vol = S.vol == null ? 6 : S.vol;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const W = 640, Hh = 480;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; cv.className = 'hs-tvpic';
  const g = cv.getContext('2d');
  const tex = new T.CanvasTexture(cv); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
  const room = () => HR.rooms.lounge;
  const st = { on: !!S.on, ch: S.ch, text: false, sub: false, vcr: S.vcr||null, play: 0, speed: [-12,0,1,10].includes(S.speed)?S.speed:0, menu: null, static: 0, osd: '', osdT: 0, mute: false };
  const savePlayback=()=>{S.on=st.on;S.vcr=st.vcr;S.speed=st.speed;S.ch=st.ch;save()};
  let ttx = null, ttxCv = null;

  // ================================================================ little drawing helpers (everything's original art)
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const lin = (x0, y0, x1, y1, s) => { const gr = g.createLinearGradient(x0, y0, x1, y1); s.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const txt = (s, x, y, size, col, al, font) => { g.font = font && font.includes('px') ? font : '900 ' + size + 'px "Arial Black",Arial,sans-serif'; g.fillStyle = col; g.textAlign = al || 'left'; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); };
  const person = (x, y, s, skin, top, hair, mouth) => { // a presenter, head and shoulders
    g.fillStyle = top; rr(x - 60 * s, y + 40 * s, 120 * s, 100 * s, 30 * s); g.fill();
    g.fillStyle = skin; g.fillRect(x - 12 * s, y + 20 * s, 24 * s, 26 * s); g.beginPath(); g.ellipse(x, y, 34 * s, 42 * s, 0, 0, 7); g.fill();
    g.fillStyle = hair; g.beginPath(); g.ellipse(x, y - 22 * s, 36 * s, 24 * s, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.arc(x - 12 * s, y - 2 * s, 3.4 * s, 0, 7); g.arc(x + 12 * s, y - 2 * s, 3.4 * s, 0, 7); g.fill();
    g.strokeStyle = '#7a3a2a'; g.lineWidth = 3 * s; g.beginPath(); g.ellipse(x, y + 18 * s, 10 * s, (mouth || 0) * 6 * s + 1.5, 0, 0, Math.PI); g.stroke();
  };
  const caption = (top, sub, col) => { g.fillStyle = col || 'rgba(10,20,90,.88)'; g.fillRect(40, 376, 560, 56); g.fillStyle = '#fff'; g.fillRect(40, 376, 8, 56); txt(top, 60, 400, 20, '#fff'); if (sub) txt(sub, 60, 424, 15, '#cde', 'left', '700 15px Arial,sans-serif'); };
  const dog = (n) => { g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '900 28px "Arial Black",Arial'; g.textAlign = 'right'; g.fillText(String(n), W - 26, 50); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.strokeRect(W - 60, 18, 40, 40); };
  const news99 = () => { const D = window.TTXData; if (!D) return null; const md = (life() && life().now99().md) || 1; return D.news.filter(x => D.md(x[0]) <= md).slice(-4).reverse(); };
  const chart99 = () => { const D = window.TTXData; if (!D) return null; const md = (life() && life().now99().md) || 1; const c = D.chart.filter(x => D.md(x[0]) <= md); return c[c.length - 1]; };

  // ================================================================ the programmes (t: seconds into it)
  const SHOW = {
    news(t, o) { // the newsreader
      g.fillStyle = lin(0, 0, 0, Hh, [[0, '#0a1a4a'], [1, '#1a3a8a']]); g.fillRect(0, 0, W, Hh);
      g.strokeStyle = 'rgba(120,170,255,.25)'; g.lineWidth = 1; for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(470, 170, 40 + i * 14, 120, 0, 0, 7); g.stroke(); } g.beginPath(); g.ellipse(470, 170, 160, 120, 0, 0, 7); g.stroke();
      person(240, 190, 1.4, '#e8c0a0', '#1a1a2a', o.hair || '#3a2a1a', Math.abs(Math.sin(t * 9)) * (Math.sin(t * 0.7) > -0.6 ? 1 : 0));
      g.fillStyle = '#c8a050'; g.fillRect(0, 330, W, 6); g.fillStyle = lin(0, 336, 0, Hh, [[0, '#2a2a3a'], [1, '#0a0a14']]); g.fillRect(0, 336, W, 144);
      const L = news99() || [['', o.title || 'THE NEWS', '']]; const it = L[Math.floor(t / 7) % L.length];
      caption(it[1], o.title || 'THE NEWS'); dog(o.ch);
      return (it[2] || '').split('. ')[0];
    },
    cartoon(t, o) { // SPACE DOG: a dog in a cardboard rocket
      g.fillStyle = lin(0, 0, 0, Hh, [[0, '#0a0430'], [1, '#3a1a6a']]); g.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 60; i++) { const x = (i * 97 + t * (20 + i % 5 * 20)) % W, y = (i * 53) % Hh; g.fillStyle = '#fff'; g.fillRect(W - x, y, 2, 2); }
      g.fillStyle = '#e8a040'; g.beginPath(); g.arc(520, 380, 90, 0, 7); g.fill(); g.fillStyle = '#c88030'; g.beginPath(); g.arc(490, 360, 20, 0, 7); g.arc(560, 410, 14, 0, 7); g.fill();
      const x = 220 + Math.sin(t * 1.3) * 60, y = 200 + Math.sin(t * 2.1) * 30, a = Math.sin(t * 1.3) * 0.15;
      g.save(); g.translate(x, y); g.rotate(a);
      g.fillStyle = '#ff8a20'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-90, -14 + i * 9); g.lineTo(-130 - Math.random() * 40, -10 + i * 7); g.lineTo(-90, -6 + i * 9); g.fill(); }
      g.fillStyle = '#c89a5a'; rr(-90, -40, 150, 80, 10); g.fill(); g.fillStyle = '#d82a2a'; g.beginPath(); g.moveTo(60, -40); g.lineTo(110, 0); g.lineTo(60, 40); g.fill();
      g.fillStyle = '#9ad8ff'; g.beginPath(); g.arc(10, -6, 26, 0, 7); g.fill();
      g.fillStyle = '#f4f0e0'; g.beginPath(); g.arc(10, -4, 18, 0, 7); g.fill(); g.fillStyle = '#5a3a1a'; g.beginPath(); g.ellipse(-4, -12, 8, 14, -0.5, 0, 7); g.ellipse(24, -12, 8, 14, 0.5, 0, 7); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.arc(4, -6, 2.4, 0, 7); g.arc(16, -6, 2.4, 0, 7); g.arc(10, 2, 3.6, 0, 7); g.fill();
      g.fillStyle = '#ff6a8a'; g.beginPath(); g.ellipse(10, 9, 3, 4 + Math.abs(Math.sin(t * 6)) * 3, 0, 0, 7); g.fill();
      g.restore();
      txt('SPACE DOG', 30, 60, 40, '#ffd84a'); dog(o.ch);
      return ['Woof! Ruff ruff!', 'Captain Barker, the Moon is made of biscuits!', 'Arooooo!', 'Fetch the stick, Space Dog! It\'s in ORBIT!'][Math.floor(t / 4) % 4];
    },
    quiz(t, o) { // WHO WANTS TO WIN A FIVER?
      g.fillStyle = '#05051a'; g.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + t * 0.2; g.strokeStyle = `rgba(80,120,255,${0.15 + 0.1 * Math.sin(t * 3 + i)})`; g.lineWidth = 14; g.beginPath(); g.moveTo(W / 2, 200); g.lineTo(W / 2 + Math.cos(a) * 500, 200 + Math.sin(a) * 500); g.stroke(); }
      g.fillStyle = 'rgba(20,30,120,.6)'; g.beginPath(); g.arc(W / 2, 200, 120, 0, 7); g.fill();
      person(200, 170, 0.9, '#e0b090', '#2a2a5a', '#5a3a1a', 0); person(440, 170, 0.9, '#d8a880', '#3a2a2a', '#222', Math.abs(Math.sin(t * 8)) * 0.7);
      const Q = ['What is 2 + 2?', 'Which is a vegetable?', 'What colour is the sky?', 'How many legs has a cat?'], O = [['3', '4', '5', 'Fish'], ['Carrot', 'Biscuit', 'Bus', 'Tuesday'], ['Blue', 'Plaid', 'Green', 'Toast'], ['4', '7', '2', 'A lot']];
      const k = Math.floor(t / 10) % 4;
      g.fillStyle = '#0a0a40'; g.strokeStyle = '#c8c8ff'; g.lineWidth = 2; rr(60, 300, 520, 50, 25); g.fill(); g.stroke(); txt(Q[k], W / 2, 333, 20, '#fff', 'center');
      O[k].forEach((a, i) => { const x = 60 + (i % 2) * 270, y = 362 + Math.floor(i / 2) * 50, lock = t % 10 > 7 && i === (k === 0 ? 1 : 0); g.fillStyle = lock ? '#e8a020' : '#0a0a40'; rr(x, y, 250, 40, 20); g.fill(); g.stroke(); txt('ABCD'[i] + ': ' + a, x + 20, y + 27, 17, lock ? '#000' : '#fff'); });
      txt('WHO WANTS TO WIN A FIVER?', W / 2, 50, 26, '#ffd84a', 'center'); dog(o.ch);
      return ['Is that your final answer?', 'You could phone a friend...', 'Ask the audience?', 'We\'ll be right back after the break!'][Math.floor(t / 5) % 4];
    },
    soap(t, o) { // COBBLE LANE: the pub, two people having words
      g.fillStyle = lin(0, 0, 0, Hh, [[0, '#4a2a1a'], [1, '#2a1a10']]); g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#6a3a1a'; g.fillRect(0, 300, W, 180); g.fillStyle = '#8a5a2a'; g.fillRect(0, 290, W, 14);
      for (let i = 0; i < 8; i++) { g.fillStyle = ['#a02a1a', '#2a6a2a', '#d8a020', '#2a3a8a'][i % 4]; g.fillRect(30 + i * 70, 120, 20, 60); g.fillStyle = '#d8c8a8'; g.fillRect(30 + i * 70, 112, 20, 10); }
      g.fillStyle = '#c8a040'; g.fillRect(0, 186, W, 6);
      const who = Math.floor(t / 3) % 2;
      person(190, 230, 1.1, '#e8c0a0', '#7a1a3a', '#c8a050', who === 0 ? Math.abs(Math.sin(t * 9)) : 0);
      person(450, 225, 1.15, '#d8b090', '#2a4a2a', '#2a1a10', who === 1 ? Math.abs(Math.sin(t * 9)) : 0);
      txt('COBBLE LANE', 24, 46, 26, '#ffe8c0'); dog(o.ch);
      return [['YOU\'RE NOT MY BROTHER!', 'I AM. I\'VE ALWAYS BEEN YOUR BROTHER.'], ['Who ate the last pork pie?', 'It wasn\'t me. ...It was me.'], ['Get out of my pub!', 'It\'s not your pub, it\'s the brewery\'s!'], ['There\'s something I need to tell you...', '(dramatic drums)']][Math.floor(t / 6) % 4][who];
    },
    robots(t, o) { // ROBO RUMBLE: the arena
      g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#3a3a3e'; g.beginPath(); g.moveTo(60, 420); g.lineTo(140, 160); g.lineTo(500, 160); g.lineTo(580, 420); g.fill();
      g.strokeStyle = '#d8b000'; g.lineWidth = 6; g.setLineDash([20, 14]); g.beginPath(); g.moveTo(60, 420); g.lineTo(140, 160); g.lineTo(500, 160); g.lineTo(580, 420); g.closePath(); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#5a1a1a'; g.fillRect(270, 180, 100, 14); // the pit
      const bot = (x, y, col, sp) => { g.save(); g.translate(x, y); g.fillStyle = col; rr(-40, -22, 80, 44, 8); g.fill(); g.fillStyle = '#222'; g.fillRect(-46, -26, 14, 12); g.fillRect(32, -26, 14, 12); g.fillRect(-46, 14, 14, 12); g.fillRect(32, 14, 14, 12); g.fillStyle = '#ccc'; g.save(); g.rotate(sp); g.fillRect(-30, -4, 60, 8); g.restore(); g.restore(); };
      const a = Math.sin(t * 0.9) * 120, b = Math.cos(t * 1.3) * 60;
      bot(320 - 70 + a * 0.5, 300 + b * 0.3, '#2a6ad0', t * 18); bot(320 + 80 - a * 0.4, 260 - b * 0.4, '#d02a1a', -t * 14);
      if (Math.sin(t * 5) > 0.8) for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(255,${200 + Math.random() * 55},80,.9)`; g.fillRect(320 + Math.random() * 60 - 30, 280 + Math.random() * 40 - 20, 3, 3); }
      txt('ROBO RUMBLE', W / 2, 60, 40, '#ff3a1a', 'center'); dog(o.ch);
      return ['3... 2... 1... ACTIVATE!', 'Ooh, that\'s gone straight into the pit!', 'The house robot is coming out!', 'Cease! ...CEASE!'][Math.floor(t / 5) % 4];
    },
    snooker(t, o) { // the snooker (Dad's favourite; it is on for nine hours)
      g.fillStyle = '#0a1a0a'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#4a2a10'; rr(60, 80, 520, 330, 18); g.fill(); g.fillStyle = '#1a7a2a'; g.fillRect(84, 104, 472, 282);
      g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.ellipse(320, 245, 220, 110, 0, 0, 7); g.fill();
      [[84, 104], [320, 98], [556, 104], [84, 386], [320, 392], [556, 386]].forEach(([x, y]) => { g.fillStyle = '#000'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); });
      for (let r = 0; r < 5; r++) for (let i = 0; i <= r; i++) { g.fillStyle = '#c01a1a'; g.beginPath(); g.arc(400 + r * 13, 245 - r * 7 + i * 14, 6.5, 0, 7); g.fill(); }
      [['#f0e010', 160, 200], ['#1a8a1a', 160, 290], ['#5a3a1a', 160, 245], ['#2a4ae0', 320, 245], ['#ff6aa8', 385, 245], ['#111', 500, 245]].forEach(([c, x, y]) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, 6.5, 0, 7); g.fill(); });
      const cx = 240 + Math.sin(t * 0.4) * 40; g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, 260, 6.5, 0, 7); g.fill();
      g.strokeStyle = '#c8a060'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx - 14 - Math.abs(Math.sin(t * 2)) * 20, 268); g.lineTo(cx - 260, 360); g.stroke();
      txt('WORLD SNOOKER', 30, 50, 22, '#fff'); txt('FRAME 14', 610, 50, 18, '#ffd84a', 'right'); dog(o.ch);
      return ['(whispering) He\'ll want to get on the pink here...', '(whispering) Oh, that\'s a lovely shot.', '(whispering) ...', '(polite clapping)'][Math.floor(t / 6) % 4];
    },
    letters(t, o) { // LETTERS AND NUMBERS, with the big clock
      g.fillStyle = '#0a2a5a'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#f4f0e0'; g.beginPath(); g.arc(W / 2, 170, 110, 0, 7); g.fill(); g.strokeStyle = '#2a2a2a'; g.lineWidth = 4; g.stroke();
      const k = (t % 30) / 30; g.fillStyle = '#4a8ad0'; g.beginPath(); g.moveTo(W / 2, 170); g.arc(W / 2, 170, 100, -Math.PI / 2, -Math.PI / 2 + k * Math.PI); g.closePath(); g.fill();
      g.strokeStyle = '#111'; g.lineWidth = 5; g.beginPath(); g.moveTo(W / 2, 170); g.lineTo(W / 2 + Math.cos(-Math.PI / 2 + k * Math.PI) * 100, 170 + Math.sin(-Math.PI / 2 + k * Math.PI) * 100); g.stroke();
      const L = 'MODEMSTAR'; for (let i = 0; i < 9; i++) { g.fillStyle = '#e8e8f0'; g.fillRect(52 + i * 60, 320, 52, 62); txt(L[i], 78 + i * 60, 366, 36, '#1a1a6a', 'center'); }
      txt('LETTERS AND NUMBERS', W / 2, 440, 24, '#ffd84a', 'center'); dog(o.ch);
      if (Math.floor(t) % 30 === 29) H.sfx.tone(523, 0.12, 'sine', 0.03);
      return ['Nine letters... thirty seconds...', 'I\'ve got an eight: "STREAMED"?', 'Dictionary corner?', 'And the time is UP.'][Math.floor(t / 8) % 4];
    },
    charts(t, o) { // TOP OF THE CHARTS (Friday nights): the number one, really
      g.fillStyle = '#05000a'; g.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 7; i++) { const a = Math.sin(t * 1.5 + i) * 0.4; g.fillStyle = `hsla(${(i * 50 + t * 60) % 360},90%,60%,.28)`; g.beginPath(); g.moveTo(80 + i * 80, 0); g.lineTo(80 + i * 80 + Math.sin(a) * 300 - 60, Hh); g.lineTo(80 + i * 80 + Math.sin(a) * 300 + 60, Hh); g.fill(); }
      for (let i = 0; i < 3; i++) { const x = 200 + i * 120, j = Math.abs(Math.sin(t * 4 + i)) * 14; g.fillStyle = '#111'; g.beginPath(); g.arc(x, 220 - j, 26, 0, 7); g.fill(); rr(x - 34, 250 - j, 68, 130, 18); g.fill(); }
      const c = chart99(); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 386, W, 60); txt('NUMBER ONE', 24, 410, 18, '#ffd84a'); txt(c ? (c[2] + ' - ' + c[1]).slice(0, 44) : 'THE MODEM BOYS - Beep Bop Connect', 24, 436, 18, '#fff', 'left', '700 18px Arial,sans-serif');
      txt('TOP OF THE CHARTS', W / 2, 52, 30, '#fff', 'center'); dog(o.ch);
      if (Math.floor(t * 4) % 4 === 0 && Math.floor(t * 4) !== st.beat) { st.beat = Math.floor(t * 4); H.sfx.tone(70, 0.1, 'sine', 0.05); }
      return '(screaming) ...and it\'s still NUMBER ONE!';
    },
    lecture(t, o) { // OPEN COLLEGE: a beard, a brown suit, a blackboard (it's on at 2am)
      g.fillStyle = '#5a5040'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#1a2a1a'; g.fillRect(40, 40, 400, 260); g.strokeStyle = '#8a6a3a'; g.lineWidth = 10; g.strokeRect(40, 40, 400, 260);
      g.fillStyle = '#e8e8d8'; g.font = '24px "Comic Sans MS",cursive'; g.textAlign = 'left'; ['dy/dx = 3x² + 2', '∫ f(x) dx', 'x = (-b ± √(b²-4ac)) / 2a'].forEach((s, i) => g.fillText(s, 70, 100 + i * 60));
      person(520, 260, 1.2, '#e0b890', '#6a4a2a', '#8a8a8a', Math.abs(Math.sin(t * 7)) * 0.6);
      g.fillStyle = '#9a9a9a'; g.beginPath(); g.ellipse(520, 300, 30, 26, 0, 0, Math.PI); g.fill();
      txt('OPEN COLLEGE', 30, 450, 22, '#e8d8a0'); dog(o.ch);
      return ['...and so the differential tends towards zero.', 'As we saw in Unit 7...', '(a long pause)', 'Next week: further integration.'][Math.floor(t / 7) % 4];
    },
    testcard(t) { // the test card (and a long tone)
      const cols = ['#fff', '#ff0', '#0ff', '#0f0', '#f0f', '#f00', '#00f', '#000'];
      cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * W / 8, 0, W / 8 + 1, Hh); });
      g.fillStyle = '#222'; g.beginPath(); g.arc(W / 2, Hh / 2, 150, 0, 7); g.fill();
      for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#fff' : '#000'; g.fillRect(W / 2 - 140 + i * 28, Hh / 2 - 30, 28, 60); }
      g.fillStyle = '#fff'; g.font = '900 30px Arial'; g.textAlign = 'center'; g.fillText('CLOSEDOWN', W / 2, Hh / 2 - 60); g.font = '700 18px Arial'; g.fillText('Programmes resume at 6.00am', W / 2, Hh / 2 + 70);
      return '(a long, high tone)';
    },
    pages(t, o) { // PAGES FROM TELLY-TEXT (the text service shown on the telly overnight, with some easy listening)
      if (ttx) { const pg = [100, 101, 300, 400, 501, 600, 802][Math.floor(t / 9) % 7]; if (ttx.page !== pg && !ttx.search && !st.text) { ttx.page = pg; ttx.build(); } ttx.tick(performance.now()); g.drawImage(ttxCv, 0, 0, W, Hh); }
      else { g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh); txt('PAGES FROM TELLY-TEXT', W / 2, Hh / 2, 24, '#ff0', 'center'); }
      return '(easy listening music)';
    },
    ads(t, o) { // an advert break
      const k = Math.floor(t / 8) % 4, tt = t % 8;
      if (k === 0) { g.fillStyle = '#ffd84a'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#d82a1a'; rr(220, 120 + Math.sin(tt * 3) * 10, 200, 260, 20); g.fill(); txt('CRUNCHOS', W / 2, 240, 40, '#fff', 'center'); txt('Now with 20% more crunch*', W / 2, 420, 20, '#333', 'center'); txt('*crunch not guaranteed', W / 2, 446, 12, '#333', 'center', '700 12px Arial,sans-serif'); return 'CRUNCHOS! They go CRUNCH!'; }
      if (k === 1) { g.fillStyle = '#3affd0'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#ff2a8a'; g.beginPath(); g.ellipse(W / 2, 260 + Math.abs(Math.sin(tt * 5)) * -80, 70, 70 - Math.abs(Math.cos(tt * 5)) * 20, 0, 0, 7); g.fill(); txt('BLOP!', W / 2, 110, 70, '#1a1a6a', 'center'); txt('The bouncing putty. Only £3.99!', W / 2, 430, 20, '#1a1a6a', 'center'); return 'BLOP! It bounces! It stretches! It gets stuck in the carpet!'; }
      if (k === 2) { g.fillStyle = lin(0, 0, 0, Hh, [[0, '#8ac8ff'], [0.6, '#e8f4ff'], [0.61, '#5a5a5a'], [1, '#3a3a3a']]); g.fillRect(0, 0, W, Hh); const x = (tt * 120) % (W + 300) - 200; g.fillStyle = '#c01a1a'; rr(x, 270, 220, 70, 20); g.fill(); g.fillStyle = '#9ad8ff'; g.fillRect(x + 50, 240, 110, 40); g.fillStyle = '#111'; g.beginPath(); g.arc(x + 50, 340, 22, 0, 7); g.arc(x + 170, 340, 22, 0, 7); g.fill(); txt('THE NEW ZOOMSTER 1.4', W / 2, 80, 30, '#1a1a1a', 'center'); txt('0% finance. Ask your dad.', W / 2, 440, 18, '#fff', 'center'); return 'Life\'s a journey. Enjoy the ride.'; }
      g.fillStyle = '#1a1a3a'; g.fillRect(0, 0, W, Hh); txt('KNOCKOUT CARPETS', W / 2, 120, 38, '#ffd84a', 'center'); txt('SALE NOW ON', W / 2, 220, 60, '#ff3a3a', 'center'); txt('Everything must go! Ends Sunday!', W / 2, 300, 22, '#fff', 'center'); return 'SALE! SALE! SALE! (it is always on)';
    },
    kids(t, o) { // HERE'S ONE I MADE EARLIER
      g.fillStyle = lin(0, 0, 0, Hh, [[0, '#3a9ad0'], [1, '#2a6ab0']]); g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#e8e0d0'; g.fillRect(0, 320, W, 160);
      person(170, 200, 1.1, '#e8c0a0', '#e82a6a', '#e8c040', Math.abs(Math.sin(t * 8)));
      g.fillStyle = '#d8d8d8'; g.fillRect(380, 200, 40, 120); g.fillStyle = '#e8a020'; g.beginPath(); g.moveTo(380, 200); g.lineTo(400, 160); g.lineTo(420, 200); g.fill(); g.fillStyle = '#2a6ad0'; g.fillRect(372, 300, 56, 20); // a washing-up bottle rocket
      g.fillStyle = '#fff'; g.font = '700 16px Arial'; g.textAlign = 'left';
      txt('MAKE IT!', 30, 50, 32, '#ffd84a'); dog(o.ch);
      return ['You will need: a washing-up bottle, some sticky-backed plastic...', '...and here\'s one I made earlier!', 'Ask a grown-up to help with the scissors.', 'Send us a photo of yours!'][Math.floor(t / 6) % 4];
    },
    weather(t, o) {
      g.fillStyle = '#1a5ab0'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#3a9a3a'; g.beginPath(); g.moveTo(300, 60); g.bezierCurveTo(380, 80, 360, 160, 400, 220); g.bezierCurveTo(440, 300, 420, 380, 360, 420); g.bezierCurveTo(300, 440, 250, 400, 270, 340); g.bezierCurveTo(230, 280, 270, 220, 250, 160); g.bezierCurveTo(240, 100, 270, 60, 300, 60); g.fill();
      const sym = (x, y, s) => { if (s === 0) { g.fillStyle = '#ffd400'; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); } else { g.fillStyle = '#e8e8f0'; g.beginPath(); g.arc(x - 12, y, 18, 0, 7); g.arc(x + 12, y - 6, 22, 0, 7); g.arc(x + 30, y + 4, 16, 0, 7); g.fill(); if (s === 2) { g.strokeStyle = '#7ab0ff'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x - 14 + i * 12, y + 22); g.lineTo(x - 20 + i * 12, y + 36); g.stroke(); } } } };
      const m = (life() && life().now99().m) || 6, wet = [1, 1, 2, 2, 0, 0, 0, 1, 0, 2, 2, 1][m - 1];
      sym(320, 120, wet); sym(340, 250, (wet + 1) % 3); sym(330, 370, wet);
      person(520, 300, 0.9, '#e8c0a0', '#5a2a6a', '#2a1a10', Math.abs(Math.sin(t * 8)));
      txt('THE WEATHER', 30, 50, 28, '#fff'); dog(o.ch);
      return ['Bit of a mixed bag tomorrow...', 'Don\'t forget your brolly!', 'Temperatures about average for the time of year.', 'And that\'s the weather.'][Math.floor(t / 6) % 4];
    },
    film(t, o) { // a very old black and white film
      g.fillStyle = '#888'; g.fillRect(0, 0, W, Hh); g.fillStyle = lin(0, 0, 0, Hh, [[0, '#cfcfcf'], [0.6, '#9a9a9a'], [0.61, '#6a6a6a'], [1, '#4a4a4a']]); g.fillRect(0, 0, W, Hh);
      const x = 120 + Math.sin(t * 0.5) * 30; g.fillStyle = '#222'; g.fillRect(x, 220, 30, 90); g.beginPath(); g.arc(x + 15, 205, 16, 0, 7); g.fill(); g.fillRect(x - 12, 186, 54, 6); g.fillRect(x + 2, 170, 26, 18);
      g.fillRect(470, 220, 30, 90); g.beginPath(); g.arc(485, 205, 16, 0, 7); g.fill(); g.fillRect(458, 186, 54, 6);
      for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`; g.fillRect(Math.random() * W, Math.random() * Hh, 1, Math.random() * 40); }
      dog(o.ch);
      return ['This town ain\'t big enough for the both of us.', 'Reach for the sky, partner.', '(dramatic music)', 'THE END'][Math.floor(t / 8) % 4];
    },
  };
  // ---- what's on: each channel by the time of day (the numbers on the remote: 1-5, and 0 for the video)
  function onNow(ch) {
    const L = life(), p = L ? L.part() : 'evening', n = L ? L.now99() : { dow: 3 }, m = new Date().getMinutes();
    const ad = (ch >= 3) && (m % 15 >= 12); // an advert break near the quarter hours
    if (ad) return ['ads', 'THE ADVERTS'];
    const T = {
      1: { night: ['testcard'], morning: ['news', 'BREAKFAST NEWS'], school: ['quiz', 'DAYTIME QUIZ'], day: ['film', 'THE AFTERNOON FILM'], after: ['cartoon', 'CHILDREN\'S TELLY'], tea: ['news', 'THE SIX O\'CLOCK NEWS'], evening: n.dow === 5 ? ['charts', 'TOP OF THE CHARTS'] : ['soap', 'COBBLE LANE'], late: ['news', 'THE LATE NEWS'] },
      2: { night: ['lecture', 'OPEN COLLEGE'], morning: ['cartoon', 'SPACE DOG'], school: ['lecture', 'SCHOOLS PROGRAMMES'], day: ['snooker', 'WORLD SNOOKER'], after: ['kids', 'MAKE IT!'], tea: ['cartoon', 'CARTOON TIME'], evening: ['robots', 'ROBO RUMBLE'], late: ['snooker', 'SNOOKER HIGHLIGHTS'] },
      3: { night: ['pages', 'PAGES FROM TELLY-TEXT'], morning: ['news', 'GOOD MORNING TELLY'], school: ['quiz', 'WHO WANTS TO WIN A FIVER?'], day: ['kids', 'SATURDAY MAKE IT!'], after: ['kids', 'TELLY CLUB'], tea: ['news', 'THE EVENING NEWS'], evening: ['quiz', 'WHO WANTS TO WIN A FIVER?'], late: ['film', 'LATE FILM'] },
      4: { night: ['film', 'THE ALL-NIGHT FILM'], morning: ['cartoon', 'WAKE UP CARTOONS'], school: ['lecture', 'SCHOOLS: MATHS'], day: ['letters', 'LETTERS AND NUMBERS'], after: ['letters', 'LETTERS AND NUMBERS'], tea: ['soap', 'BRICK STREET'], evening: ['news', 'NEWS AT SEVEN'], late: ['film', 'LATE FILM'] },
      5: { night: ['testcard'], morning: ['kids', 'MILKY TIME'], school: ['film', 'AFTERNOON FILM'], day: ['film', 'MATINEE'], after: ['cartoon', 'SPACE DOG (REPEAT)'], tea: ['weather', 'THE WEATHER'], evening: ['soap', 'FAMILY AFFAIRS... ER, FAIRS'], late: ['film', 'LATE FILM'] },
    }[ch] || {};
    return T[p] || ['testcard'];
  }

  // ================================================================ the video recorder and its tapes (things you pick up)
  const TAPES = [
    { id: 'vhs.robots', label: 'ROBO RUMBLE - DO NOT TAPE OVER!!', show: 'robots', len: 120, over: ['snooker', 30], col: '#f4f0e0' },
    { id: 'vhs.charts', label: 'TOP OF THE CHARTS XMAS 98', show: 'charts', len: 90, col: '#ffe680' },
    { id: 'vhs.dog', label: 'SPACE DOG eps 1-3', show: 'cartoon', len: 150, col: '#f4f0e0' },
    { id: 'vhs.mom', label: 'MOM\'S PROGRAMMES - DO NOT TOUCH', show: 'soap', len: 180, col: '#ffd0e0' },
    { id: 'vhs.dad', label: 'DAD - SNOOKER FINAL', show: 'snooker', len: 240, col: '#d8e8ff' },
    { id: 'vhs.blank', label: '???', show: 'secret', len: 60, col: '#f4f0e0' },
  ];
  const TAPE = {}; TAPES.forEach(t => { TAPE[t.id] = t; });
  // Chore tapes are the same physical format, not unplayable lookalikes.
  [['BASHIATORS - THE FINAL','robots'],['DOCTOR WHEN','cartoon'],['CHILDREN IN KNEAD','quiz'],['GALAXY WALK: THE NEXT SHIFT','cartoon'],['THE SNOWBLOKE','cartoon'],["MOM'S PROGRAMMES",'soap']].forEach(([label,show],i)=>{TAPE['ch.v.'+i]={id:'ch.v.'+i,label,show,len:240}});
  TAPE['ch.v.3'].show='galaxy';
  SHOW.galaxy=(t)=>{
    g.fillStyle='#111b2d';g.fillRect(0,0,W,Hh);g.fillStyle='#04070e';g.fillRect(45,40,550,210);
    for(let i=0;i<55;i++){g.fillStyle=i%4?'#c3cbd4':'#e2d6a9';g.fillRect(50+(i*73+t*3)%530,48+(i*47)%180,2,2)}
    g.fillStyle='#728e9e';g.beginPath();g.arc(470,125,62,0,7);g.fill();g.strokeStyle='#c9b97e';g.lineWidth=9;g.beginPath();g.ellipse(470,125,91,17,-.3,0,7);g.stroke();
    g.fillStyle='#343d4b';g.fillRect(0,280,W,200);g.fillStyle='#182330';g.fillRect(35,298,570,72);
    for(let i=0;i<26;i++){g.fillStyle=['#a67c4a','#568b91','#a3af92'][(i+Math.floor(t*2))%3];g.fillRect(48+i*21,310+(i%3)*14,15,6)}
    person(190,208,1.05,'#d5ad8e','#a98d4a','#4b352b',Math.abs(Math.sin(t*7))*.7);person(370,210,.92,'#d8b79b','#576f89','#242a2d',Math.abs(Math.cos(t*6))*.5);
    txt('GALAXY WALK',30,42,30,'#e7cf90');caption('THE NEXT SHIFT',"Captain's log: the kettle has boldly gone missing.");
    return ['Set course for the biscuit nebula.','Captain, the toaster cannot take much more!','We come in peace. And slippers.','Engage the washing-up drive.'][Math.floor(t/5)%4];
  };
  if(!TAPE[st.vcr]){st.vcr=null;st.speed=0}
  function tapeModel(t) { // a VHS cassette lying flat (18.7 x 10.3 x 2.5 cm), its label on top and on the spine
    const grp = new T.Group(); const B = K.into(grp);
    const lbl=A.printed('vhs.lbl.'+t.id,512,280,(gg,w,h)=>{gg.fillStyle='#151515';gg.fillRect(0,0,w,h);gg.fillStyle='#2a2a2a';gg.fillRect(60,145,392,100);gg.fillStyle='#777';for(const x of [160,352]){gg.beginPath();gg.arc(x,195,36,0,7);gg.fill();gg.fillStyle='#222';gg.beginPath();gg.arc(x,195,12,0,7);gg.fill();gg.fillStyle='#777'}gg.fillStyle=t.col;gg.fillRect(28,18,456,112);const art={'vhs.robots':'robots','vhs.dog':'critters','vhs.mom':'city','vhs.dad':'snooker','vhs.charts':'band','vhs.blank':'space'}[t.id],painted=window.PrintArt?.paint(gg,art,32,22,102,104);gg.fillStyle='#152b52';gg.font='700 24px "Courier New",monospace';K.wrapText(gg,t.label,painted?148:42,49,painted?322:428,29)},{clamp:true});
    const spine=K.tex('vhs.sp.'+t.id,512,72,(gg,w,h)=>{gg.fillStyle='#151515';gg.fillRect(0,0,w,h);gg.fillStyle=t.col;gg.fillRect(12,8,w-24,h-16);let size=30;do{gg.font='700 '+size+'px "Courier New",monospace';if(gg.measureText(t.label).width<=w-40)break;size--}while(size>14);gg.fillStyle='#152b52';gg.fillText(t.label,20,47)},{clamp:true});
    B.box(0, -1.25, 0, 18.7, 2.5, 10.3, { t: K.mat({ c: '#fff', map: lbl }), f: K.mat({ c: '#fff', map: spine }), all: K.mat({ c: '#1a1a1a', sh: 30, sp: '#333' }) });
    B.shadow(0, 0, 0, 21, 12, 0.45, { sq: true });
    return grp;
  }
  function tapes() {
    const r = room(); if (!r) return;
    if(r._tapes){restoreInserted();return;}r._tapes = 1;
    TAPES.forEach((t, i) => {
      const thing = H.thing(t.id, { kind: 'vhs', label: 'Video: ' + t.label, obj: tapeModel(t), home: { room: 'lounge', x: -60 + 27, y: GY - 3 - i * 2.5, z: 342, ry: (i % 2 ? 4 : -3) }, holdD: 42 });
      thing.obj.traverse(o => { o.userData.thing = 1; });
      H.restoreThing(thing);
    });
    // (the old flat tape spines on the shelf are now real tapes: hide the pick box)
    if (H.SPOTS['hs.tapes']) H.SPOTS['hs.tapes'].off = true;
    // the slot on the front of the video
    const v = r.vcr, front = v.position.z + 15.2;
    H.snap('vcr', { room: 'lounge', x: v.position.x - 6, y: v.position.y - 5, z: front + 4, r: 16, box: [21, 3, 4], accepts: k => k === 'vhs'||k==='chvhs', enabled: () => !st.vcr, hint: 'Let go to push the tape in', pose: { x: v.position.x - 6, y: v.position.y - 4, z: front - 8, ry: 0 }, hide: true,
      onSnap: t => { st.vcr=t.id;st.play=0;st.speed=1;st.ch=0;power(true);savePlayback();if(window.ChoreKit&&t.kind==='chvhs')ChoreKit.keep(t.id);H.sfx.noise(.4,.08,800,0,'bandpass',300);osd('PLAY');say('The video','Ker-chunk. Whirr. Playing '+esc(TAPE[t.id]?.label||'the tape')+'. Use the telly remote to pause, rewind or eject.',5000); },
      onUnsnap: () => { st.vcr=null;st.speed=0;savePlayback(); } });
    for (const t of TAPES) { const th = H.THINGS[t.id]; if (th && th.st === 'snap' && th.snap === 'vcr') st.vcr = t.id; }
    // a click on the video itself: eject (when there's a tape in)
    const s = H.SPOTS['hs.vcr']; if (s) s.act = () => { if (st.vcr) eject(); else open('vcr'); };
    restoreInserted();
  }
  function restoreInserted(){const t=st.vcr&&H.THINGS[st.vcr],s=H.SNAPS.vcr;if(!t||!s||!t.at.hide)return;t.st='snap';t.snap='vcr';t.at=Object.assign({room:'lounge',hide:true},s.pose);t.at.hide=true;H.place(t);if(st.on){room().tvScreen.material.map=tex;room().tvScreen.material.needsUpdate=true;}}
  function eject() {
    const id = st.vcr; if (!id) return; const t = H.THINGS[id], v = room().vcr, front = v.position.z + 15.2;
    st.vcr = null; st.speed = 0; t.snap = null; t.rx = 0; t.st = 'fall'; t.vy = 0; t.at = { room: 'lounge', x: v.position.x - 6, y: v.position.y - 8, z: front + 10, ry: 0 }; t.landY = GY - 1; t.fromX = v.position.x - 6; t.fromZ = front + 2; t.t0 = performance.now(); t.obj.visible = true;
    H.sfx.noise(0.3, 0.08, 700); H.sfx.tone(120, 0.1, 'square', 0.05, 0.2); osd('EJECT'); H.saveThings();
    savePlayback();if(window.ChoreKit&&t.kind==='chvhs')ChoreKit.keep(t.id);
  }
  const tapeT = () => st.vcr ? (S.tapes[st.vcr] || 0) : 0;
  function tapeFrame(dt) { // the tape moves: play, fast forward, rewind
    const t = TAPE[st.vcr]; if (!t) return;
    let p = S.tapes[t.id] || 0; p += dt * st.speed; if (p <= 0) { p = 0; if (st.speed < 0) { st.speed = 0; osd('STOP'); H.sfx.tone(100, 0.15, 'square', 0.05); secret('hs.vhs'); say('Be kind, rewind', 'Rewound all the way to the start. The video shop would be proud.'); } }
    const end = t.len + (t.over ? t.over[1] : 0);
    if (p >= end) { p = end; if (st.speed > 0) { st.speed = 0; osd('STOP'); } }
    S.tapes[t.id] = p;
  }

  // ================================================================ drawing a frame (the picture, the video's look, text, menus)
  let last = 0, showT0 = 0, curShow = '', subtitle = '';
  function frame(now) {
    const dt = Math.min(0.2, (now - (last || now)) / 1000); last = now;
    if (!st.on) { offPic(); return; }
    if (st.vcr && st.speed) tapeFrame(dt);
    const ch = st.ch;
    if (st.static > now) { noise(1); }
    else if (ch === 0) avPic(now);
    else {
      const [k, title] = onNow(ch); if (curShow !== k + ch) { curShow = k + ch; showT0 = now; }
      const t = (now - showT0) / 1000 + (Date.now() / 1000 % 600);
      subtitle = (SHOW[k] || SHOW.testcard)(t, { ch, title }) || '';
      if (st.osdT > now) txt(String(ch) + '  ' + (title || ''), 30, Hh - 24, 18, '#3aff6a', 'left', '700 18px "Courier New",monospace');
    }
    if (st.sub && subtitle && !st.text) { g.font = '700 22px Arial,sans-serif'; const w = Math.min(W - 40, g.measureText(subtitle).width + 24); g.fillStyle = '#000'; g.fillRect((W - w) / 2, Hh - 74, w, 34); txt(subtitle.slice(0, 60), W / 2, Hh - 49, 22, '#ffff2a', 'center', '700 22px Arial,sans-serif'); }
    if (st.text && ttx) { ttx.tick(now); if (!ttx.mix) g.drawImage(ttxCv, 0, 0, W, Hh); else g.drawImage(ttxCv, 0, 0, W, Hh); }
    if (st.menu) menuPic(now);
    if (st.osdT > now && st.osd) txt(st.osd, W - 30, 70, 30, '#3aff6a', 'right', '700 30px "Courier New",monospace');
    if (st.volT > now) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(150, 400, 340, 30); for (let i = 0; i < 10; i++) { g.fillStyle = i < S.vol ? '#3aff6a' : '#1a4a2a'; g.fillRect(160 + i * 33, 406, 28, 18); } }
    // the glass: scanlines and a soft vignette
    g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < Hh; y += 3) g.fillRect(0, y, W, 1);
    tex.needsUpdate = true;
  }
  function offPic() { g.fillStyle = '#0a0d0c'; g.fillRect(0, 0, W, Hh); const gr = g.createRadialGradient(W * 0.35, Hh * 0.3, 10, W / 2, Hh / 2, 420); gr.addColorStop(0, 'rgba(60,72,66,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.ellipse(200, 120, 160, 60, -0.4, 0, 7); g.fill(); tex.needsUpdate = true; }
  function noise(a) { const id = g.createImageData(160, 120); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255 * a; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } const c = document.createElement('canvas'); c.width = 160; c.height = 120; c.getContext('2d').putImageData(id, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, W, Hh); g.imageSmoothingEnabled = true; }
  function avPic(now) { // channel 0: the video (blue screen with nothing playing, the tape with its wobbles)
    const t = TAPE[st.vcr];
    if (!t) { g.fillStyle = '#1838b8'; g.fillRect(0, 0, W, Hh); txt('AV', 40, 70, 40, '#fff'); txt(st.vcr ? '' : 'NO TAPE', W / 2, Hh / 2, 28, '#fff', 'center'); return; }
    const p = tapeT();
    if (!st.speed && !p) { g.fillStyle = '#1838b8'; g.fillRect(0, 0, W, Hh); txt('VIDEO', 40, 70, 40, '#fff'); txt('PRESS PLAY', W / 2, Hh / 2, 28, '#fff', 'center'); return; }
    let show = t.show, at = p;
    if (t.over && p > t.len) { show = t.over[0]; at = p - t.len; }
    if (show === 'secret') secretTape(at); else subtitle = (SHOW[show] || SHOW.testcard)(at, { ch: '' }) || '';
    // the VHS look: a wobble, colour bleed, a tracking band, the play / rewind graphic
    const band = (now / 12) % (Hh + 80) - 40; g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, band, W, 6);
    if (st.speed !== 1 && st.speed !== 0) { for (let i = 0; i < 6; i++) { const y = (now / 3 + i * 83) % Hh; g.drawImage(cv, 0, y, W, 20, (Math.random() - 0.5) * 40, y, W, 20); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, y + 8, W, 2); } }
    if (st.speed === 0) { g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(0, Hh - 60, W, 8); }
    const lab = st.speed > 1 ? '►►' : st.speed < 0 ? '◄◄' : st.speed === 1 ? 'PLAY ►' : 'PAUSE';
    if (st.speed !== 1 || (p % 6) < 2) txt(lab, 30, 52, 26, '#fff', 'left', '700 26px "Courier New",monospace');
    const mm = Math.floor(p / 60), ss = Math.floor(p % 60); txt('0:' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0'), W - 30, Hh - 30, 22, '#fff', 'right', '700 22px "Courier New",monospace');
  }
  function secretTape(t) { // the tape with ??? on it: the family's Christmas 1998, from the camcorder
    g.fillStyle = lin(0, 0, 0, Hh, [[0, '#3a2a1a'], [1, '#1a1008']]); g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#2a5a2a'; g.beginPath(); g.moveTo(480, 80); g.lineTo(560, 380); g.lineTo(400, 380); g.fill(); for (let i = 0; i < 9; i++) { g.fillStyle = ['#ff2a2a', '#ffd400', '#2a8aff'][i % 3]; g.beginPath(); g.arc(440 + (i * 37) % 100, 160 + i * 24, 6, 0, 7); g.fill(); }
    person(220, 230, 1.0, '#e8c0a0', '#c01a1a', '#5a3a1a', Math.abs(Math.sin(t * 8)) * 0.8);
    g.fillStyle = '#2a8aff'; g.fillRect(150, 330, 140, 60); g.fillStyle = '#ffd400'; g.fillRect(212, 330, 16, 60); g.fillRect(150, 352, 140, 16);
    txt('DEC 25 1998', W - 30, Hh - 60, 24, '#ff8a3a', 'right', '700 24px "Courier New",monospace'); txt('REC ●', 30, 50, 22, '#ff3a3a', 'left', '700 22px "Courier New",monospace');
    subtitle = ['Dad: "Is it recording? Is the red light on?"', 'Jack: "A ULTRA 64?! YESSSSS!"', 'Gran: "Mind my sherry!"', 'Mom: "Say thank you to Father Christmas!"', '(The camera points at the carpet for a while.)'][Math.floor(t / 6) % 5];
    if (t > 12) secret('hs.ttx.hidden');
  }
  // ---- the video's on-screen menu: the TIMER (nobody has ever got this right)
  function menuPic(now) {
    const m = st.menu; g.fillStyle = 'rgba(10,20,120,.92)'; g.fillRect(40, 40, W - 80, Hh - 80);
    g.font = '700 22px "Courier New",monospace'; g.textAlign = 'left';
    const rows = m.kind === 'timer' ? [['PROG', '1'], ['DATE', m.f[0]], ['START', m.f[1]], ['STOP', m.f[2]], ['CH', m.f[3]], ['VPS/PDC', 'OFF']] : [['CLOCK SET', ''], ['TIME', m.f[0]], ['DATE', m.f[1]]];
    txt(m.kind === 'timer' ? 'TIMER RECORDING' : 'CLOCK SET', 70, 90, 24, '#ffff2a', 'left', '700 24px "Courier New",monospace');
    rows.forEach(([k, v], i) => { const sel = i === m.sel + 1; g.fillStyle = sel ? '#ffff2a' : '#fff'; g.fillText((sel ? '> ' : '  ') + k.padEnd(9) + v, 70, 140 + i * 36); });
    txt(m.msg || 'Use CH+/CH- and VOL+/VOL-.  OK: the PLAY button.', 70, Hh - 70, 16, '#cde', 'left', '700 16px Arial,sans-serif');
  }
  function menuKey(k) {
    const m = st.menu; if (!m) return false;
    const n = m.f.length;
    if (k === 'up') m.sel = (m.sel + n - 1) % n; else if (k === 'down') m.sel = (m.sel + 1) % n;
    else if (k === 'left' || k === 'right') { m.f[m.sel] = m.bump(m.sel, k === 'right' ? 1 : -1); }
    else if (k === 'ok') {
      if (m.kind === 'timer') { secret('hs.timer'); m.msg = 'SET! ...(blinks)... TIMER ERROR. You have recorded: the snooker.'; setTimeout(() => { st.menu = null; say('The video timer', 'It says it\'s set. It isn\'t. It never is. (Last time Dad set it, we got two hours of the snooker instead of the Grand Prix.)', 7000); }, 2200); }
      else { const L = life(); if (L && L.S) { L.S.vcr = 1; L.save(); } m.msg = 'CLOCK SET. It still flashes. Out of habit.'; setTimeout(() => { st.menu = null; }, 1600); }
    } else if (k === 'back') st.menu = null;
    return true;
  }
  function timerMenu() {
    const d = new Date(); let day = 1, h1 = 19, h2 = 20, ch = 2;
    st.menu = { kind: 'timer', sel: 0, f: ['--/--', '--:--', '--:--', '--'], bump(i, s) { if (i === 0) { day = (day + s + 31) % 31 || 31; return String(day).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); } if (i === 1) { h1 = (h1 + s + 24) % 24; return String(h1).padStart(2, '0') + ':00'; } if (i === 2) { h2 = (h2 + s + 24) % 24; return String(h2).padStart(2, '0') + ':00'; } ch = (ch + s + 5) % 5 || 5; return String(ch); } };
  }
  function clockMenu() { let hh = 12, mm = 0; st.menu = { kind: 'clock', sel: 0, f: ['12:00', '--/--/--'], bump(i, s) { if (i === 0) { mm = (mm + s * 5 + 60) % 60; if (mm === 0 && s > 0) hh = hh % 24 + 1; return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); } return '01/01/80'; } }; }
  function osd(s) { st.osd = s; st.osdT = performance.now() + 1500; }

  // ================================================================ sitting down with the remote
  let surf = null, remoteEl = null, loopRaf = 0;
  const tellyPose = () => ({ x: -60, y: GY - 74, z: 412, rx: -3, ry: 0, lvl: 'G', seat: 1 });
  function screenQuad() {
    const r = room(), s = r.tvScreen, out = []; s.updateMatrixWorld(true);
    for (const [x, y] of [[-25, -18.75], [25, -18.75], [25, 18.75], [-25, 18.75]]) { const v = new T.Vector3(x, y, 0.05); s.localToWorld(v); out.push([v.x, -v.y, v.z]); }
    return out;
  }
  function open(what) {
    tapes();
    if (!H.focus(tellyPose(), { label: 'Get up', enter: () => sitDown(what), exit: standUp, esc: () => { if (st.menu) { st.menu = null; return false; } } })) return;
  }
  function sitDown(what) {
    if (!st.on) power(true);
    if (what === 'vcr' && st.vcr) { st.ch = 0; }
    surf = H.surface(cv, screenQuad, { w: W, h: Hh, screen:true }); cv.classList.add('on');
    remote();
    if (!S.hint) { S.hint = 1; save(); say('The telly', 'Mom says don\'t sit so close or you\'ll get square eyes. The remote: numbers for the channels (its 0 button is the video), TEXT for TELLY-TEXT, and the coloured buttons for its links. Keyboard: 1-5 for channels, T for text, arrows for channels. Press 0 to LOCK IN; Esc opens the game menu.', 9000); }
    else if (life() && life().quiet()) say('The telly', 'It\'s late. Keep the volume DOWN or Dad will be down those stairs.', 4000);
    keysOn(true);
  }
  function standUp() { keysOn(false); if (surf) { surf.close(); surf = null; } cv.classList.remove('on'); if (remoteEl) { remoteEl.remove(); remoteEl = null; } st.menu = null; }
  function power(on) {
    st.on = on == null ? !st.on : on;
    const r = room(); if (r && r.tvLed) { const m = [].concat(r.tvLed.material)[0]; m.color.set(st.on ? '#2aff4a' : '#e01a1a'); m.emissive.set(st.on ? '#0a8a1a' : '#900'); m.userData.e0 = m.emissive.clone(); }
    if (st.on) { st.static = performance.now() + 350; H.sfx.noise(0.35, 0.05, 3000); H.sfx.tone(15700, 0.6, 'sine', 0.008); } else { H.sfx.tone(200, 0.1, 'sine', 0.04, 0, 60); }
    if (r && r.tvScreen) { r.tvScreen.material.map = st.on ? tex : A.t('screenOff'); r.tvScreen.material.needsUpdate = true; }
    HR.relight(); H.dirty();
    savePlayback();
  }
  function chan(n) { st.ch = n; S.ch = n; save(); st.static = performance.now() + 240; H.sfx.noise(0.2, 0.04, 2500); osd(n === 0 ? 'AV' : String(n)); st.osdT = performance.now() + 2200; curShow = ''; }
  function remote() {
    remoteEl = document.createElement('div'); remoteEl.className = 'hs-remote';
    const B = (k, l, c) => `<button type="button" data-k="${k}"${c ? ` class="${c}"` : ''}>${l}</button>`;
    remoteEl.innerHTML = `<div class="hs-rbody"><div class="hs-rtop">${B('power', '&#x23FB;', 'pw')}${B('text', 'TEXT', 'tx')}${B('mute', 'MUTE')}</div>
      <div class="hs-rnum">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => B(String(n), n)).join('')}${B('sub', '888', 'sm')}${B('0', '0')}${B('index', 'IDX', 'sm')}</div>
      <div class="hs-rfast">${B('r', '', 'fr')}${B('g', '', 'fg')}${B('y', '', 'fy')}${B('c', '', 'fc')}</div>
      <div class="hs-rmid">${B('chup', 'CH+')}${B('volup', 'VOL+')}${B('chdn', 'CH-')}${B('voldn', 'VOL-')}${B('reveal', '?', 'sm')}${B('mix', 'MIX', 'sm')}</div>
      <div class="hs-rvcr">${B('rew', '&#x25C4;&#x25C4;')}${B('play', '&#x25BA;')}${B('ff', '&#x25BA;&#x25BA;')}${B('stop', '&#x25A0;')}${B('eject', '&#x23CF;')}${B('timer', 'TIMER', 'sm')}</div>
      <div class="hs-rbrand">UNIVERSAL 4-IN-1</div></div>`;
    remoteEl.addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) press(b.dataset.k); });
    H.ui.el.appendChild(remoteEl);
  }
  function press(k) {
    H.sfx.tone(2400, 0.015, 'square', 0.02);
    if (!st.on && k !== 'power') { if (/^[0-9]$/.test(k) || k === 'chup' || k === 'chdn') { power(true); } else return; }
    if (st.menu && menuKey({ chup: 'up', chdn: 'down', volup: 'right', voldn: 'left', play: 'ok', stop: 'back' }[k] || k)) return;
    if (k === 'power') return power();
    if (k === 'text') { st.text = !st.text; if (st.text) ensureTtx(); return; }
    if (st.text && ttx && (/^[0-9]$/.test(k) || ['r', 'g', 'y', 'c', 'reveal', 'mix', 'index'].includes(k))) { ttx.key(k); return; }
    if (k === 'sub') { st.sub = !st.sub; osd(st.sub ? 'SUBTITLES' : 'SUBTITLES OFF'); return; }
    if (/^[0-9]$/.test(k)) { const n = +k; if (n <= 5) chan(n); else osd('NO SIGNAL'); return; }
    if (k === 'chup') return chan((st.ch + 1) % 6); if (k === 'chdn') return chan((st.ch + 5) % 6);
    if (k === 'volup' || k === 'voldn') { S.vol = Math.max(0, Math.min(10, S.vol + (k === 'volup' ? 1 : -1))); save(); st.volT = performance.now() + 1500; if (S.vol >= 8 && life() && life().quiet()) setTimeout(() => life().voice('DAD (from upstairs)', 'JACK! TURN THAT DOWN! IT\'S THE MIDDLE OF THE NIGHT!'), 900); return; }
    if (k === 'mute') { st.mute = !st.mute; osd(st.mute ? 'MUTE' : ''); return; }
    if (k === 'r' || k === 'g' || k === 'y' || k === 'c') { ensureTtx(); st.text = true; ttx.key(k); return; }
    if (k === 'index') { ensureTtx(); st.text = true; ttx.go(100); return; }
    // the video
    if (k === 'timer') { if (st.ch !== 0) chan(0); timerMenu(); return; }
    if (k === 'eject') return eject();
    if (!st.vcr && ['play', 'rew', 'ff', 'stop'].includes(k)) { osd('NO TAPE'); return; }
    if (k === 'play') { if (st.ch !== 0) chan(0); st.speed = 1; osd('PLAY'); H.sfx.noise(0.3, 0.04, 600); }
    if (k === 'stop') { st.speed = 0; osd('STOP'); }
    if (k === 'rew') { if (st.ch !== 0) chan(0); st.speed = -12; osd('REW'); H.sfx.noise(1.5, 0.03, 1200, 0, 'bandpass', 2400); }
    if (k === 'ff') { if (st.ch !== 0) chan(0); st.speed = 10; osd('FF'); H.sfx.noise(1.5, 0.03, 1200, 0, 'bandpass', 2400); }
    savePlayback();
  }
  function ensureTtx() {
    if (ttx || !window.TTX) { if (!window.TTX) Promise.all([window.TTXData ? 0 : loadJs('js/hs-ttx-data.js'), loadJs('js/hs-ttx.js')]).then(() => { if (!ttx && window.TTX) mkTtx(); }); return; }
  }
  function mkTtx() { ttxCv = document.createElement('canvas'); ttx = TTX.create(ttxCv, { onSecret: secret }); }
  function keysOn(on) { if (on) addEventListener('keydown', onKey, true); else removeEventListener('keydown', onKey, true); }
  function onKey(ev) {
    const t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    const M = { t: 'text', T: 'text', ArrowUp: 'chup', ArrowDown: 'chdn', ArrowRight: 'volup', ArrowLeft: 'voldn', r: 'r', g: 'g', y: 'y', b: 'c', p: 'play', ' ': 'play', s: 'stop', '[': 'rew', ']': 'ff', x: 'eject', i: 'index', '?': 'reveal', '/': 'reveal', m: 'mute', o: 'power' };
    const k = /^[0-9]$/.test(ev.key) ? ev.key : M[ev.key];
    if (!k) return; ev.preventDefault(); ev.stopImmediatePropagation(); press(k);
  }
  // ---- the picture keeps going: fast when you're watching, slowly on the 3D telly when you walk past
  let lastSlow = 0,lastSave=0;
  addEventListener('pagehide',savePlayback);document.addEventListener('visibilitychange',()=>{if(document.hidden)savePlayback()});
  H.ambient.add(now => {
    const r = room();if(st.on&&st.vcr&&now-lastSave>2000){lastSave=now;savePlayback()}
    if(!r||!st.on)return;
    if(!r.group.visible&&!surf){if(st.vcr&&st.speed){const dt=Math.min(.25,(now-(last||now))/1000);last=now;tapeFrame(dt)}return;}
    if (surf) return; // (the fast loop has it)
    if (now - lastSlow > 120) { lastSlow = now; frame(now); H.dirty(); }
  });
  function fast(now) { loopRaf = requestAnimationFrame(fast); if (surf && st.on) frame(now); else if (surf) offPic(); }
  loopRaf = requestAnimationFrame(fast);
  // ---- the TV guide on the coffee table: today's 1999 listings, the same as TELLY-TEXT p600
  function guide() {
    const show = () => { const D = window.TTXData, L = life(); if (!D) return; const n = L ? L.now99() : { dow: 3, md: 101 }, kind = n.dow === 6 ? 'sat' : n.dow === 0 ? 'sun' : 'week';
      const sp = D.tv.special.filter(x => D.md(x[0]) === n.md);
      say('TELLY TIMES (today)', (sp.length ? '<b>Don\'t miss:</b> ' + sp.map(x => esc(x[1] + ' ' + x[2] + ': ' + x[3])).join('; ') + '<br>' : '') + D.tv[kind].map(([c, l]) => `<b>${esc(c)}</b> ${l.slice(0, 3).map(x => esc(x[0] + ' ' + x[1])).join(', ')}`).join('<br>') + '<br><small>Dad has circled the snooker. Twice.</small>', 12000); };
    if (window.TTXData) show(); else loadJs('js/hs-ttx-data.js').then(show, () => {});
  }

  window.HouseTelly = { open(what) { if (what === 'tapes') { tapes(); say('Video tapes', 'Pick a tape up off the shelf and push it into the slot on the front of the video. Then sit down at the telly and press PLAY.', 6000); return; } open(what); }, guide, get on() { return st.on; }, phoneLine: n => window.TTX ? TTX.phoneLine(n) : null, press, st, tapes };
  tapes();
  if(st.on)power(true);
  loadJs('js/hs-ttx-data.js').catch(() => {});
})();

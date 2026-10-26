/* carta-encyc.js: JackCarta 99, the multimedia encyclopedia on CD-ROM (2 discs, one of them a coaster).
 * Intro, home screen, A-Z contents with search, categories, articles with pixel-art pictures and Related links,
 * a timeline, Media clips (canvas animations with sound) and the Quiz Keep castle game.
 * Articles live in js/carta-articles-a.js and js/carta-articles-b.js and load when the program opens. */
(function () {
  const C = window.Carta, A = window.Apps;
  const esc = C.esc, h = C.h;
  const CATS = [
    ['consoles', 'Consoles & Handhelds', '#b0106a', 'handheld'],
    ['games', 'Video Games', '#c80600', 'arcade'],
    ['hardware', 'PC Hardware', '#1f62b8', 'cpu'],
    ['computing', 'History of Computing', '#5b16c9', 'valve'],
    ['internet', 'The Internet', '#007070', 'globe'],
    ['films', 'Sci-Fi Films', '#303a70', 'film'],
    ['space', 'Space', '#10106a', 'saturn'],
    ['dinos', 'Dinosaurs', '#3a7a20', 'trex'],
    ['puzzles', 'Puzzles & Toys', '#d86a00', 'cube'],
    ['robots', 'Robots', '#4a5560', 'robot'],
    ['inventions', 'Inventions', '#9a7400', 'bulb'],
    ['y2k', 'Y2K & 1999', '#8a0000', 'y2k'],
  ];
  const CAT = {}; CATS.forEach(c => { CAT[c[0]] = { id: c[0], name: c[1], col: c[2], img: c[3] }; });
  // the encyclopedia's own rare articles (not on the A-Z list until you've found them)
  const RARE = [
    { id: 'x_squig', t: 'Squig', c: 'dinos', img: 'squig', rare: 'squig', rel: ['dinosaurs', 'fossils'], f: [['Scientific name', 'Squiggus bouncius (made up)'], ['Diet', 'Feet. Mostly.'], ['Real?', 'Unconfirmed']],
      x: 'The squig is a round, red, bouncy creature with far too many teeth. JackCarta\'s team of experts have never seen one, and no squig fossils have ever been dug up.\n\nHowever, one small green reader keeps writing in to say they are definitely real, they live in caves, and they are delicious in a pie.\n\nThis article was added by mistake. Please do not tell the [[dinosaurs]].' },
    { id: 'x_dave', t: 'Dave (a boy)', c: 'y2k', img: 'question', rare: 'dave', rel: ['year_1999', 'game_boy'], f: [['Famous for', 'Nothing yet'], ['Favourite character', 'The small one'], ['Written in', 'Crayon']],
      x: 'Dave is a boy who is not famous. He has written to JackCarta every month since 1998 asking to be included in the encyclopedia.\n\nDave says he is "the best at video games in the whole school" and "basically an inventor". JackCarta could not check either of these claims.\n\nThis is the only article in JackCarta 99 that was written in crayon and slipped into the disc box by hand. Nobody knows how it got onto the CD.' },
    { id: 'x_blank', t: 'This Page Intentionally Left Blank', c: 'y2k', img: 'blank', rare: 'blank', rel: [], f: [['Words', 'Very few'], ['Pictures', 'One (white)']],
      x: 'This page has been intentionally left blank.\n\n(Except for these words. And these ones. Oh dear, it isn\'t blank any more. Please ignore this page.)' },
    { id: 'x_grot', t: 'Grot', c: 'puzzles', img: 'grot', rare: 'grot', rel: ['x_squig', 'lego'], f: [['Size', 'Small'], ['Colour', 'Green'], ['Ears', 'Big and flappy']],
      x: 'A grot is a small green goblin-ish creature from a tabletop fantasy hobby, where people build and paint armies of little models: space mariners, elves, knights, robots and, yes, goblins. Grots are the smallest, sneakiest and most easily squashed of the goblins.\n\nThey are often painted by kids with very steady hands and very messy desks. Some people keep a "bits box" full of spare arms, heads and weapons.\n\nJackCarta was not able to interview a grot for this article. It kept trying to eat the microphone.' },
  ];
  const ZZZ = { id: 'x_zzz', t: 'Zzz', c: 'y2k', img: 'question', rare: 'zzz', rel: [], f: [['Position', 'Last'], ['Prize', 'One gold star']],
    x: '"Zzz" is the sound people make in comics when they fall asleep, and it is the very last entry in JackCarta 99.\n\nYou have read the encyclopedia all the way to the end! Well, scrolled to the end. That counts.\n\nHere is a gold star: ★\n\nNow go back to the start. There are lots of things you missed.' };
  // article id -> media clip
  const MEDIA_FOR = { modem: 'modem', morse_code: 'morse', solar_system: 'orbits', apollo_11: 'moonlanding', tyrannosaurus: 'roar', tetris: 'tetris', rubiks_cube: 'cube', sputnik: 'sputnik', y2k_bug: 'y2k', pong: 'pong', telephone: 'dialtone', bios: 'boot', floppy_disk: 'floppy', hale_bopp: 'comet', saturn_v: 'rocket', theremin: 'theremin', dinosaur_extinction: 'meteor' };
  const FACTS_EXTRA = ['A double-speed CD-ROM drive reads 300 KB every second.', 'JackCarta 99 would fill about 400 floppy disks.', 'Press the dice button for a random article.', 'Blue underlined words are links to other articles.'];

  const store = C.store;
  const read = new Set(store.get('e_read', []));
  const catsSeen = new Set(store.get('e_cats', []));
  const mediaSeen = new Set(store.get('e_media', []));
  const rareFound = new Set(store.get('e_rare', []));
  const sfx = (f, d, t) => Sound.note(f, d, t);
  const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const pick = (a, R) => a[Math.floor((R || Math.random)() * a.length)];
  const touch = () => matchMedia('(hover:none)').matches;

  // ================================================================ toolbar icons (16x16)
  const TI = {
    home: '<svg viewBox="0 0 16 16"><path d="M2 8l6-6 6 6v7H2z" fill="#ffd400" stroke="#000"/><rect x="6" y="10" width="4" height="5" fill="#7a4a1a" stroke="#000"/><path d="M1 8l7-7 7 7" fill="none" stroke="#e10600" stroke-width="2"/></svg>',
    back: '<svg viewBox="0 0 16 16"><path d="M2 8l6-6v4h6v4H8v4z" fill="#3a9a2a" stroke="#000"/></svg>',
    fwd: '<svg viewBox="0 0 16 16"><path d="M14 8L8 2v4H2v4h6v4z" fill="#3a9a2a" stroke="#000"/></svg>',
    list: '<svg viewBox="0 0 16 16"><rect x="2" y="1" width="12" height="14" fill="#fff" stroke="#000"/><path d="M4 4h8M4 7h8M4 10h8M4 13h5" stroke="#000080"/></svg>',
    cats: '<svg viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" fill="#e10600" stroke="#000"/><rect x="9" y="1" width="6" height="6" fill="#2a7ad8" stroke="#000"/><rect x="1" y="9" width="6" height="6" fill="#3a9a2a" stroke="#000"/><rect x="9" y="9" width="6" height="6" fill="#ffd400" stroke="#000"/></svg>',
    time: '<svg viewBox="0 0 16 16"><path d="M1 9h14" stroke="#000" stroke-width="2"/><circle cx="4" cy="9" r="2" fill="#e10600" stroke="#000"/><circle cx="9" cy="9" r="2" fill="#ffd400" stroke="#000"/><circle cx="13" cy="9" r="2" fill="#2a7ad8" stroke="#000"/><path d="M4 3v4M9 3v4M13 3v4" stroke="#000"/></svg>',
    media: '<svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="12" fill="#222" stroke="#000"/><path d="M6 5v6l5-3z" fill="#ffd400"/><path d="M1 4h2M1 8h2M1 12h2M13 4h2M13 8h2M13 12h2" stroke="#fff"/></svg>',
    castle: '<svg viewBox="0 0 16 16"><path d="M2 15V5h2v2h2V5h4v2h2V5h2v10z" fill="#b8b8b8" stroke="#000"/><path d="M7 15v-4h2v4z" fill="#4a2a0a"/><path d="M8 5V1l3 1-3 1" fill="#e10600" stroke="#000" stroke-width=".6"/></svg>',
    dice: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="2" fill="#fff" stroke="#000"/><circle cx="5" cy="5" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="11" cy="11" r="1.2"/><circle cx="11" cy="5" r="1.2"/><circle cx="5" cy="11" r="1.2"/></svg>',
    play: '<svg viewBox="0 0 16 16"><path d="M4 2v12l10-6z" fill="#000"/></svg>',
    stop: '<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" fill="#000"/></svg>',
  };

  // ================================================================ media clips: canvas animations with sound (128x96 internal)
  const MW = 128, MH = 96;
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
  const MEDIA = {};
  const clip = (id, o) => { MEDIA[id] = Object.assign({ id, dur: 10, ev: () => [] }, o); };
  // ---- modem handshake
  clip('modem', { title: 'Modem handshake', dur: 10, ev: () => [[0.05, () => Sound.play('modem')]],
    draw(p, t) {
      p.vgrad(0, 66, '#c9d3e8', '#a9b6d4'); p.rect(0, 66, MW, 30, '#a0703a'); p.rect(0, 66, MW, 1, '#c8955a');
      p.rect(10, 6, 108, 30, '#000'); p.rect(10, 6, 108, 1, '#555');
      const st = t < 1 ? 'OFF HOOK' : t < 2.2 ? 'DIALLING...' : t < 4.2 ? 'RINGING...' : t < 8.3 ? 'HANDSHAKE!' : 'CONNECTED 49,333 BPS';
      let prev = 21;
      for (let x = 0; x < 106; x++) {
        let y = 21; const k = t * 40 + x;
        if (t >= 1 && t < 2.2) y += Math.sin(k * 0.9) * 6 * (Math.floor(t * 10) % 2);
        else if (t >= 2.2 && t < 4.2) y += Math.sin(k * 0.3) * 4 * ((t % 0.9) < 0.4 ? 1 : 0);
        else if (t >= 4.2 && t < 8.3) y += Math.sin(k * (0.4 + (Math.floor(t * 3) % 4) * 0.25)) * 8 + (C.art.rng(Math.floor(k))() - 0.5) * 6;
        p.line(11 + x - 1, prev, 11 + x, y, '#30ff30'); prev = y;
      }
      p.text(12, 40, st, '#203060');
      p.rect(24, 52, 80, 16, '#d8d0c0'); p.rect(24, 52, 80, 2, '#f0e8d8'); p.rect(24, 66, 80, 2, '#a89c88');
      const R = C.art.rng(Math.floor(t * 12));
      ['HS', 'AA', 'CD', 'OH', 'RD', 'SD', 'TR', 'MR'].forEach((n, i) => {
        const on = n === 'MR' || n === 'TR' || (n === 'OH' && t > 0.5) || (n === 'HS' && t > 4.2) || (n === 'CD' && t > 8.3) || ((n === 'RD' || n === 'SD') && t > 4.2 && R() > 0.4);
        p.rect(28 + i * 9, 58, 4, 3, on ? (n === 'CD' ? '#0f0' : '#f22') : '#600');
      });
      p.text(94, 57, '56K', '#203060');
    } });
  // ---- Morse code
  const MORSE = { S: '...', O: '---' };
  clip('morse', { title: 'Morse code: S O S', dur: 9,
    seq() { if (this._s) return this._s; const u = 0.13, out = []; let t = 0.6; 'SOS SOS'.split('').forEach(ch => { if (ch === ' ') { t += u * 4; return; } [...MORSE[ch]].forEach(m => { const d = m === '.' ? u : u * 3; out.push([t, d, ch, m]); t += d + u; }); out.push([t, 0, ch, '/']); t += u * 2; }); return (this._s = out); },
    ev() { return this.seq().filter(e => e[1] > 0).map(e => [e[0], () => sfx(660, e[1], 'sine')]); },
    draw(p, t) {
      p.vgrad(0, 96, '#e8dcc0', '#d0c098'); p.rect(0, 70, MW, 26, '#7a4a1a'); p.rect(0, 70, MW, 1, '#9a6a3a');
      const s = this.seq(); const on = s.some(e => e[1] > 0 && t >= e[0] && t < e[0] + e[1]);
      p.rect(20, 62, 50, 8, '#5a3a1a'); p.rect(26, 58, 34, 3, '#c8a040'); p.rect(58, on ? 56 : 52, 8, 4, '#222'); p.ell(62, on ? 55 : 51, 5, 2, '#111'); p.line(30, 61, 58, on ? 57 : 54, '#c8a040');
      p.disc(98, 40, 10, on ? '#ffe060' : '#706040'); if (on) p.disc(98, 40, 14, 'rgba(255,230,80,.3)'); p.rect(94, 50, 8, 8, '#888');
      let code = '', txt = '';
      s.forEach(e => { if (t >= e[0]) { if (e[3] === '/') { txt += e[2]; code += ' '; } else code += e[3] === '.' ? '.' : '-'; } });
      p.text(6, 6, 'MORSE CODE', '#203060'); p.text(6, 16, code.slice(-30), '#e10600'); p.text(6, 28, txt.replace(/(...)(?=.)/g, '$1 '), '#000', 2);
    } });
  // ---- the solar system (not to scale!)
  const PLANETS = [[8, '#9a8a80', 1], [12, '#e8c878', 1.5], [16, '#2a7ad8', 1.5], [20, '#c8502a', 1], [27, '#c8986a', 3], [33, '#e8d8a0', 2.5], [38, '#90e0e8', 2], [42, '#3060e0', 2], [46, '#c0a890', 1]];
  clip('orbits', { title: 'The Solar System (not to scale!)', dur: 20,
    ev() { const N = [523, 587, 659, 784, 880, 1047]; const out = []; const R = C.art.rng(9); for (let t = 0.3; t < 20; t += 0.6) out.push([t, () => sfx(N[(R() * N.length) | 0], 0.5, 'triangle')]); return out; },
    draw(p, t) {
      p.fill('#03030f'); p.stars(50, 17);
      PLANETS.forEach(([r]) => { for (let a = 0; a < 6.28; a += 0.12) p.px(64 + Math.cos(a) * r * 1.3, 50 + Math.sin(a) * r * 0.9, '#223'); });
      p.disc(64, 50, 4, '#ffb000'); p.disc(64, 50, 2.5, '#ffe060');
      PLANETS.forEach(([r, c, s], i) => { const a = t * 6 / Math.pow(r / 8, 1.5) + i * 1.7; const x = 64 + Math.cos(a) * r * 1.3, y = 50 + Math.sin(a) * r * 0.9; p.disc(x, y, s, c); if (i === 5) p.line(x - 4, y, x + 4, y, '#c8b888'); });
      p.text(3, 3, 'THE SOLAR SYSTEM', '#ffd400'); p.text(3, 89, 'NINE PLANETS. NOT TO SCALE!', '#9fd0ff');
    } });
  // ---- Apollo 11 landing
  clip('moonlanding', { title: 'Apollo 11: the landing', dur: 14,
    ev() { const out = []; for (let t = 0.5; t < 10; t += 1.6) out.push([t, () => sfx(2525, 0.12, 'sine')]); out.push([10.4, () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => sfx(f, 0.3, 'triangle'), i * 160))]); return out; },
    draw(p, t) {
      p.fill('#000'); p.stars(40, 23); p.disc(104, 16, 8, '#1a5ac8'); p.ell(102, 14, 3, 2, '#3a9a2a'); p.ell(106, 19, 2, 1, '#fff');
      p.rect(0, 74, MW, 22, '#9a9a9a'); p.dither(0, 74, MW, 22, '#858585'); p.ell(20, 82, 8, 2, '#7a7a7a'); p.ell(100, 88, 10, 2, '#7a7a7a'); p.ell(70, 80, 4, 1, '#7a7a7a');
      const k = Math.min(1, t / 10.3), y = lerp(-20, 58, 1 - Math.pow(1 - k, 2.2)), x = 58;
      if (t > 8 && t < 11.5) { const d = Math.min(1, (t - 8) / 2) * (t > 10.4 ? Math.max(0, 1 - (t - 10.4)) : 1); p.ell(x + 6, 76, 30 * d, 4 * d, 'rgba(200,200,200,.6)'); }
      if (t < 10.3) { p.poly([[x + 2, y + 18], [x + 10, y + 18], [x + 6, y + 24 + Math.sin(t * 40) * 2]], '#ffd400'); }
      p.poly([[x, y], [x + 8, y - 4], [x + 13, y + 1], [x + 11, y + 8], [x + 1, y + 8]], '#c8c8d0'); p.rect(x + 4, y + 1, 3, 3, '#203060');
      p.rect(x - 2, y + 8, 16, 6, '#d8a020'); p.dither(x - 2, y + 8, 16, 6, '#b08010');
      p.line(x - 2, y + 13, x - 6, y + 19, '#888').line(x + 13, y + 13, x + 17, y + 19, '#888'); p.rect(x - 8, y + 19, 4, 1, '#888').rect(x + 15, y + 19, 4, 1, '#888');
      const alt = Math.max(0, Math.round((1 - k) * 500));
      p.text(3, 3, t < 10.4 ? 'ALTITUDE ' + alt + ' FT' : 'TOUCHDOWN!', t < 10.4 ? '#30ff30' : '#ffd400');
      if (t > 10.4) p.text(3, 11, '20 JULY 1969', '#fff');
    } });
  // ---- T. rex roar
  function rex(p, x, y, mouth, bob) {
    const c = '#4a8a3a', d = '#2a5a20'; y += bob;
    p.poly([[x - 26, y + 6], [x - 6, y - 2], [x - 4, y + 6], [x - 22, y + 9]], c); p.ell(x, y + 2, 11, 8, c); p.ell(x - 1, y + 4, 6, 4, '#8ac86a');
    p.poly([[x + 4, y - 10], [x + 22, y - 12], [x + 24, y - 6], [x + 6, y - 3]], c);
    p.poly([[x + 6, y - 3 + mouth * 0.2], [x + 22, y - 5 + mouth], [x + 20, y - 1 + mouth], [x + 6, y + 1]], c);
    for (let i = 0; i < 5; i++) p.px(x + 10 + i * 3, y - 6, '#fff');
    if (mouth > 2) p.poly([[x + 8, y - 5], [x + 22, y - 6], [x + 21, y - 5 + mouth], [x + 8, y - 1]], '#7a1010');
    p.px(x + 15, y - 10, '#fff').px(x + 16, y - 10, '#000'); p.rect(x + 7, y + 2, 4, 1, c).px(x + 11, y + 3, c);
    const s = Math.sin(bob * 3);
    p.rect(x - 4, y + 9, 4, 10 + s, d).rect(x - 6, y + 18 + s, 7, 2, d); p.rect(x + 3, y + 9, 4, 10 - s, c).rect(x + 2, y + 18 - s, 7, 2, c);
  }
  clip('roar', { title: 'Tyrannosaurus rex: ROAR!', dur: 8,
    ev() { const out = [0.6, 1.4, 2.2, 3.0, 3.8].map(t => [t, () => Sound.play('thud')]); for (let i = 0; i < 14; i++) out.push([4.5 + i * 0.1, () => { sfx(200 - i * 9, 0.14, 'sawtooth'); sfx(100 - i * 4, 0.14, 'square'); }]); return out; },
    draw(p, t) {
      const sh = t > 4.5 && t < 6 ? Math.round(Math.sin(t * 60) * 2) : 0;
      p.vgrad(0, 66, '#ffd890', '#ff9a60'); p.poly([[4 + sh, 66], [26 + sh, 36], [34 + sh, 36], [56 + sh, 66]], '#7a4a3a'); p.rect(26 + sh, 33, 8, 3, '#ff4000');
      p.rect(0, 66, MW, 30, '#4a8a2a'); p.dither(0, 66, MW, 30, '#3a7a20');
      const x = lerp(-30, 64, t / 4) + sh, bob = t < 4 ? Math.abs(Math.sin(t * 4)) * 2 : 0, mouth = t > 4.3 ? Math.min(8, (t - 4.3) * 16) * (t < 6.2 ? 1 : Math.max(0, 1 - (t - 6.2) * 2)) : 0;
      rex(p, x, 50, mouth, bob);
      if (t > 4.5 && t < 6.5) { p.text(70 + sh, 12, 'ROAAAR!', '#e10600', 2); }
      p.text(3, 88, 'TYRANNOSAURUS REX', '#fff');
    } });
  // ---- Tetris auto-play (with the old Russian folk song)
  const TET = { I: [[0, 0], [1, 0], [2, 0], [3, 0]], O: [[0, 0], [1, 0], [0, 1], [1, 1]], T: [[0, 0], [1, 0], [2, 0], [1, 1]], S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], L: [[0, 0], [1, 0], [2, 0], [0, 1]], J: [[0, 0], [1, 0], [2, 0], [2, 1]] };
  const TCOL = { I: '#00e5ff', O: '#ffd400', T: '#a020f0', S: '#3ad83a', Z: '#e10600', L: '#ff8000', J: '#2a40e0' };
  const rot = (cells, r) => { let c = cells; for (let i = 0; i < r; i++) c = c.map(([x, y]) => [-y, x]); const mx = Math.min(...c.map(q => q[0])), my = Math.min(...c.map(q => q[1])); return c.map(([x, y]) => [x - mx, y - my]); };
  function tetPlan() { // a tiny AI plays a few pieces; returns [{k, cells, x, land, t0, t1, cleared}]
    const Wd = 10, Hd = 16, grid = Array.from({ length: Hd }, () => Array(Wd).fill(0)), R = C.art.rng(1984), plan = []; let t = 0;
    const fits = (cells, x, y) => cells.every(([a, b]) => x + a >= 0 && x + a < Wd && y + b < Hd && (y + b < 0 || !grid[y + b][x + a]));
    for (let n = 0; n < 22; n++) {
      const k = 'IOTSZLJ'[(R() * 7) | 0]; let best = null;
      for (let r = 0; r < 4; r++) { const cells = rot(TET[k], r); for (let x = 0; x < Wd; x++) { if (!fits(cells, x, 0)) continue; let y = 0; while (fits(cells, x, y + 1)) y++; const g2 = grid.map(row => row.slice()); cells.forEach(([a, b]) => { g2[y + b][x + a] = 1; }); const full = g2.filter(row => row.every(v => v)).length; let holes = 0, agg = 0; for (let cx = 0; cx < Wd; cx++) { let seen = false; for (let cy = 0; cy < Hd; cy++) { if (g2[cy][cx]) { if (!seen) agg += Hd - cy; seen = true; } else if (seen) holes++; } } const sc = agg + holes * 7 - full * 12; if (!best || sc < best.sc) best = { sc, cells, x, y }; } }
      if (!best) break;
      const fall = (best.y + 2) * 0.05 + 0.2; plan.push({ k, cells: best.cells, x: best.x, y: best.y, t0: t, t1: t + fall });
      best.cells.forEach(([a, b]) => { grid[best.y + b][best.x + a] = k; });
      const keep = grid.filter(row => !row.every(v => v)), cl = Hd - keep.length; t += fall;
      if (cl) { plan[plan.length - 1].cleared = cl; t += 0.4; while (keep.length < Hd) keep.unshift(Array(Wd).fill(0)); keep.forEach((row, i) => { grid[i] = row; }); }
      plan[plan.length - 1].snap = grid.map(row => row.slice());
    }
    return plan;
  }
  clip('tetris', { title: 'Falling blocks (with music)', dur: 22, music: 'tris',
    ev() { return (this._p = this._p || tetPlan()).map(pc => [pc.t1, () => sfx(pc.cleared ? 880 : 140, pc.cleared ? 0.25 : 0.05, 'square')]); },
    draw(p, t) {
      const plan = this._p = this._p || tetPlan();
      p.fill('#000020'); p.stars(20, 5); const ox = 39, cs = 5;
      p.rect(ox - 1, 15, 52, 81, '#808080'); p.rect(ox, 15, 50, 80, '#101040');
      let snap = null, cur = null; for (const pc of plan) { if (t >= pc.t1) snap = pc.snap; else if (t >= pc.t0) { cur = pc; break; } }
      const B = (x, y, c) => { p.rect(ox + x * cs, 15 + y * cs, cs, cs, c); p.rect(ox + x * cs, 15 + y * cs, cs - 1, 1, 'rgba(255,255,255,.5)'); p.rect(ox + x * cs + cs - 1, 15 + y * cs, 1, cs, 'rgba(0,0,0,.4)'); };
      if (snap) snap.forEach((row, y) => row.forEach((v, x) => { if (v) B(x, y, TCOL[v]); }));
      if (cur) { const k = (t - cur.t0) / (cur.t1 - cur.t0 - 0.2); const y = Math.min(cur.y, Math.floor(lerp(-2, cur.y, k))); cur.cells.forEach(([a, b]) => { if (y + b >= 0) B(cur.x + a, y + b, TCOL[cur.k]); }); }
      p.text(3, 3, 'FALLING', '#ffd400'); p.text(3, 10, 'BLOCKS!', '#ffd400'); p.text(94, 3, 'LINES', '#9fd0ff');
      const lines = plan.filter(pc => t >= pc.t1 && pc.cleared).reduce((s, pc) => s + pc.cleared, 0); p.text(94, 10, String(lines), '#fff');
    } });
  // ---- Rubik's cube scramble and solve
  clip('cube', { title: "Rubrick's Cube: scramble and solve", dur: 12,
    moves() { if (this._m) return this._m; const R = C.art.rng(1974), m = []; for (let i = 0; i < 10; i++) m.push([(R() * 6) | 0, R() < 0.5]); return (this._m = m); },
    ev() { const out = []; for (let i = 0; i < 10; i++) out.push([0.6 + i * 0.45, () => { sfx(1400, 0.03, 'square'); sfx(900, 0.03, 'square'); }]); for (let i = 0; i < 10; i++) out.push([6 + i * 0.45, () => { sfx(1200, 0.03, 'square'); }]); out.push([10.8, () => Sound.play('solve')]); return out; },
    draw(p, t) {
      p.vgrad(0, 96, '#fff0c8', '#ffc870');
      const K = ['#fff', '#ffd400', '#e10600', '#ff8000', '#2a7ad8', '#3a9a2a'];
      const F = [Array(9).fill(0), Array(9).fill(2), Array(9).fill(4)]; // top, left, right
      const mv = this.moves(); const n = t < 6 ? Math.min(10, Math.floor((t - 0.6) / 0.45) + 1) : Math.max(0, 10 - Math.floor((t - 6) / 0.45) - 1);
      const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8]];
      for (let i = 0; i < Math.max(0, n); i++) { const [L, dir] = mv[i]; const idx = lines[L]; const a = idx.map(j => F[0][j]), b = idx.map(j => F[1][j]), c = idx.map(j => F[2][j]); const seq = dir ? [c, a, b] : [b, c, a]; idx.forEach((j, q) => { F[0][j] = seq[0][q]; F[1][j] = seq[1][q]; F[2][j] = seq[2][q]; }); idx.forEach((j, q) => { if ((i + q) % 3 === 0) F[1][j] = (F[1][j] + 1 + i) % 6; }); }
      if (n <= 0 && t > 6) { F[0].fill(0); F[1].fill(2); F[2].fill(4); }
      const face = (o, u, v, cs) => { for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const P = (a, b) => [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b]; p.poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], '#111'); p.poly([P(i + 0.12, j + 0.12), P(i + 0.88, j + 0.12), P(i + 0.88, j + 0.88), P(i + 0.12, j + 0.88)], K[cs[j * 3 + i]]); } };
      const wob = t < 6 && t > 0.6 ? Math.sin(t * 20) * 0.6 : 0;
      face([34, 34 + wob], [10, 5], [10, -5], F[0]); face([34, 34], [10, 5], [0, 11], F[1]); face([64, 49], [10, -5], [0, 11], F[2]);
      p.text(3, 3, t < 6 ? 'SCRAMBLING...' : t < 10.8 ? 'SOLVING...' : 'SOLVED!', '#203060');
      p.text(3, 89, '43 QUINTILLION POSITIONS', '#7a4a1a');
    } });
  // ---- Sputnik
  clip('sputnik', { title: 'Sputnik 1: beep... beep...', dur: 12,
    ev() { const out = []; for (let t = 0.5; t < 12; t += 0.6) out.push([t, () => sfx(1040, 0.3, 'sine')]); return out; },
    draw(p, t) {
      p.fill('#03030f'); p.stars(60, 31); p.disc(64, 60, 24, '#1a5ac8'); p.ell(56, 52, 8, 5, '#3a9a2a'); p.ell(72, 68, 6, 4, '#3a9a2a'); p.ell(64, 38, 6, 2, '#fff');
      const a = t * 0.9, x = 64 + Math.cos(a) * 50, y = 56 + Math.sin(a) * 22, front = Math.sin(a) > -0.2 || Math.abs(Math.cos(a)) > 0.5;
      for (let k = 0; k < 6.28; k += 0.08) p.px(64 + Math.cos(k) * 50, 56 + Math.sin(k) * 22, '#223355');
      if (front) { p.disc(x, y, 2.5, '#d8d8e0'); p.px(x - 1, y - 1, '#fff'); [[-7, 5], [-6, 7], [-3, 7], [-1, 7]].forEach(([dx, dy]) => p.line(x, y, x + dx, y + dy, '#aaa')); }
      const on = ((t - 0.5) % 0.6) < 0.3 && t > 0.5; if (on && front) p.ring(x, y, 5, 'rgba(255,255,160,.7)');
      p.text(3, 3, on ? 'BEEP!' : 'SPUTNIK 1', on ? '#ffd400' : '#9fd0ff'); p.text(3, 89, '4 OCTOBER 1957', '#fff');
    } });
  // ---- Y2K rollover
  clip('y2k', { title: 'Midnight, 31 December 1999', dur: 16,
    ev() { const out = []; for (let s = 0; s < 10; s++) out.push([s + 0.01, () => sfx(s >= 7 ? 1320 : 1500, s >= 7 ? 0.12 : 0.02, 'square')]); out.push([10, () => { Sound.play('uhoh'); C.secret('y2kroll'); }]); out.push([12.5, () => Sound.play('solve')]); return out; },
    draw(p, t) {
      if (t < 10) { p.fill('#101018'); p.rect(14, 22, 100, 44, '#000'); p.rect(14, 22, 100, 1, '#444'); const s = 50 + Math.floor(t); p.text(22, 28, '31/12/1999', '#ff3030', 2); p.text(30, 46, '23:59:' + String(s).padStart(2, '0'), '#ff3030', 2); p.text(3, 3, 'COUNTDOWN...', '#ffd400'); p.text(3, 86, 'IS YOUR VIDEO RECORDER READY?', '#888'); return; }
      if (t < 12.5) { const g = Math.floor(t * 12) % 2; p.fill(g ? '#0000a8' : '#000080'); p.text(10, 10, 'DATE: 01/01/1900', '#fff', 1); p.text(10, 20, 'ERROR: THE YEAR IS 1900??', '#ffd400'); p.text(10, 30, 'HORSES NOT FOUND.', '#fff'); const bx = lerp(-10, 120, (t - 10) / 2.5); p.ell(bx, 66, 6, 4, '#3a9a2a'); p.disc(bx + 6, 64, 3, '#3a9a2a'); p.px(bx + 7, 63, '#fff'); for (let i = 0; i < 3; i++) p.line(bx - 3 + i * 3, 69, bx - 5 + i * 3, 72 + (Math.floor(t * 10) + i) % 2, '#1f5e14'); p.text(30, 82, 'UH OH!', '#e10600', 2); return; }
      p.fill('#000018'); const R = C.art.rng(Math.floor(t * 3)); for (let i = 0; i < 4; i++) { const cx = 20 + R() * 88, cy = 14 + R() * 40, r = ((t * 3) % 1) * 14, col = ['#ff4040', '#ffd400', '#40ff40', '#40c0ff'][i]; for (let k = 0; k < 12; k++) p.px(cx + Math.cos(k / 12 * 6.28) * r, cy + Math.sin(k / 12 * 6.28) * r, col); }
      p.ctext(62, 'PHEW!', '#ffd400', 2); p.ctext(78, 'MOST COMPUTERS WERE FIXED', '#fff'); p.ctext(86, 'IN TIME. FINGERS CROSSED!', '#fff');
    } });
  // ---- Pong
  clip('pong', { title: 'Pong rally', dur: 15,
    ev() { const out = []; const T = 1.6; for (let t = T / 2; t < 15; t += T) out.push([t, () => sfx(490, 0.04, 'square')]); for (let t = 0.55; t < 15; t += 1.1) out.push([t, () => sfx(245, 0.04, 'square')]); return out; },
    draw(p, t) {
      p.fill('#000'); for (let y = 2; y < 94; y += 6) p.rect(63, y, 2, 3, '#fff'); p.rect(0, 0, MW, 2, '#fff').rect(0, 94, MW, 2, '#fff');
      const tri = (x, per) => { const f = (x / per) % 1; return f < 0.5 ? f * 2 : 2 - f * 2; };
      const bx = 10 + tri(t + 0.8, 3.2) * 106, by = 4 + tri(t + 0.55, 2.2) * 86;
      const py = y => Math.max(2, Math.min(78, y - 8));
      p.rect(6, py(by + Math.sin(t * 2) * 5), 3, 16, '#fff'); p.rect(119, py(by - Math.sin(t * 1.7) * 5), 3, 16, '#fff'); p.rect(bx, by, 3, 3, '#fff');
      p.text(44, 6, '0', '#fff', 2); p.text(76, 6, '0', '#fff', 2);
    } });
  // ---- telephone tones
  const DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], '*': [941, 1209], 0: [941, 1336], '#': [941, 1477] };
  const DIAL = '01632960999';
  clip('dialtone', { title: 'Telephone tones', dur: 10,
    ev() { const out = [[0.1, () => { sfx(350, 0.8, 'sine'); sfx(440, 0.8, 'sine'); }]]; [...DIAL].forEach((d, i) => out.push([1.2 + i * 0.3, () => { sfx(DTMF[d][0], 0.15, 'sine'); sfx(DTMF[d][1], 0.15, 'sine'); }])); [5, 7.5].forEach(t0 => [0, 0.6].forEach(o => out.push([t0 + o, () => { sfx(400, 0.4, 'sine'); sfx(450, 0.4, 'sine'); }]))); return out; },
    draw(p, t) {
      p.vgrad(0, 96, '#d0e0ff', '#a0b8e0');
      p.rect(36, 14, 56, 78, '#222'); p.rect(38, 16, 52, 74, '#e8e8e0'); p.rect(42, 19, 44, 10, '#9aa880');
      const n = t < 1.2 ? 0 : Math.min(DIAL.length, Math.floor((t - 1.2) / 0.3) + 1); p.text(44, 21, DIAL.slice(0, n).slice(-10), '#202010');
      const keys = '123456789*0#'; const cur = t >= 1.2 && t < 1.2 + DIAL.length * 0.3 && ((t - 1.2) % 0.3) < 0.15 ? DIAL[Math.floor((t - 1.2) / 0.3)] : null;
      [...keys].forEach((k, i) => { const x = 43 + (i % 3) * 14, y = 33 + ((i / 3) | 0) * 14; p.rect(x, y, 12, 11, k === cur ? '#ffd400' : '#fff'); p.rect(x, y + 10, 12, 1, '#888'); p.text(x + 4, y + 3, k === '*' ? '+' : k, '#000'); });
      p.text(3, 3, t < 1.2 ? 'DIAL TONE' : t < 4.6 ? 'DIALLING...' : t < 10 ? 'RING RING...' : '', '#203060');
      if (t > 9) p.text(3, 86, 'HELLO? MOM SPEAKING.', '#e10600');
    } });
  // ---- BIOS boot
  clip('boot', { title: 'Switching on a PC', dur: 10,
    ev() { const out = [[0.3, () => sfx(1000, 0.15, 'square')]]; const R = C.art.rng(3); for (let i = 0; i < 14; i++) out.push([3.6 + i * 0.12 + R() * 0.05, () => sfx(80 + R() * 40, 0.03, 'square')]); out.push([8.2, () => Sound.play('startup')]); return out; },
    draw(p, t) {
      if (t > 8) { p.fill('#008080'); const k = Math.min(1, (t - 8) / 0.6); p.ctext(36, 'JACKOS 98', `rgba(255,255,255,${k})`, 2); p.ctext(52, 'STARTING...', '#fff'); return; }
      p.fill('#000'); if (t < 0.3) return;
      p.text(3, 3, 'JACKBIOS (C) 1998', '#c0c0c0'); p.text(3, 11, 'PENT-YUM II 350MHZ', '#c0c0c0');
      const mem = Math.min(65536, Math.floor(Math.max(0, t - 0.6) / 2.2 * 65536 / 1024) * 1024); p.text(3, 22, 'MEMORY TEST: ' + mem + 'K' + (mem >= 65536 ? ' OK' : ''), '#fff');
      if (t > 3.2) p.text(3, 33, 'PRIMARY MASTER: 6.4GB', '#c0c0c0'); if (t > 4) p.text(3, 41, 'SECONDARY MASTER: CD-ROM', '#c0c0c0'); if (t > 4.8) p.text(3, 52, 'KEYBOARD... OK', '#c0c0c0'); if (t > 5.5) p.text(3, 60, 'MOUSE... OK', '#c0c0c0');
      if (t > 6.2) p.text(3, 74, 'STARTING JACKOS 98...', '#ffd400'); p.text(3, 89, 'PRESS DEL TO ENTER SETUP', '#888');
    } });
  // ---- floppy disk
  clip('floppy', { title: 'Reading a floppy disk', dur: 10,
    ev() { const out = [[1.5, () => Sound.play('thud')]]; const R = C.art.rng(11); for (let t = 2; t < 8; t += 0.09) { const f = 70 + R() * 60; out.push([t, () => sfx(f, 0.05, 'square')]); } out.push([8.2, () => Sound.play('uhoh')]); return out; },
    draw(p, t) {
      p.vgrad(0, 96, '#c9d3e8', '#a9b6d4'); p.rect(14, 46, 100, 30, '#d8d0c0'); p.rect(14, 46, 100, 2, '#f0e8d8'); p.rect(26, 56, 70, 6, '#222'); p.rect(100, 58, 6, 3, t > 2 && t < 8 && Math.floor(t * 8) % 2 ? '#30ff30' : '#104010');
      const k = Math.min(1, t / 1.5), dy = lerp(-10, 44, k);
      if (t < 1.6) { p.rect(34, dy - 30, 54, 50, '#222838'); p.rect(48, dy - 30, 24, 14, '#c8c8d0'); p.rect(42, dy - 4, 38, 22, '#fff'); p.text(46, dy, 'HOMEWORK', '#0028c8'); }
      else p.rect(36, 56, 50, 2, '#2a2a3a');
      p.text(3, 3, t < 1.6 ? 'INSERT DISK...' : t < 8 ? 'READING A: ' + Math.min(100, Math.floor((t - 2) / 6 * 100)) + '%' : 'NOT READY READING DRIVE A', t < 8 ? '#203060' : '#e10600');
      if (t > 8.2) { p.rect(6, 80, 116, 12, '#000080'); p.text(9, 84, 'ABORT, RETRY, FAIL?', '#fff'); }
    } });
  // ---- Comet Hale-Bopp
  clip('comet', { title: 'Comet Hail-Bop, 1997', dur: 14,
    ev() { const ch = [[262, 330, 392], [220, 262, 330], [175, 220, 262], [196, 247, 294]]; const out = []; for (let i = 0; i < 9; i++) out.push([0.2 + i * 1.5, () => ch[i % 4].forEach(f => sfx(f * 2, 1.4, 'sine'))]); return out; },
    draw(p, t) {
      p.vgrad(0, 96, '#020214', '#1a2a5a'); const R = C.art.rng(77); for (let i = 0; i < 70; i++) { const x = R() * MW, y = R() * 70, tw = Math.sin(t * 3 + i) > 0.7; p.px(x, y, tw ? '#fff' : '#8090c0'); }
      const cx = lerp(110, 60, t / 14), cy = lerp(20, 30, t / 14);
      for (let i = 0; i < 40; i++) { const f = i / 40; p.ell(cx - i * 1.4, cy - i * 0.4, 3 * (1 - f) + 1, 2 * (1 - f) + 0.5, `rgba(240,240,255,${0.45 * (1 - f)})`); }
      for (let i = 0; i < 30; i++) p.px(cx - i * 1.7, cy - i * 0.9 + Math.sin(i + t) * 0.5, `rgba(120,180,255,${0.7 - i / 45})`);
      p.disc(cx, cy, 2, '#fff');
      p.poly([[0, 96], [0, 76], [16, 70], [30, 78], [48, 68], [70, 80], [92, 72], [112, 78], [128, 70], [128, 96]], '#000');
      p.rect(96, 66, 6, 10, '#000').poly([[94, 66], [99, 60], [104, 66]], '#000'); p.px(98, 70, '#ffd400');
      p.text(3, 3, 'COMET HAIL-BOP', '#9fd0ff'); p.text(3, 10, '1997', '#9fd0ff');
    } });
  // ---- rocket launch
  clip('rocket', { title: 'Countdown and lift-off', dur: 14,
    ev() { const out = []; for (let s = 0; s < 10; s++) out.push([s + 0.05, () => sfx(880, 0.1, 'square')]); for (let i = 0; i < 30; i++) out.push([9 + i * 0.15, () => { sfx(50 + (i % 5) * 6, 0.2, 'sawtooth'); }]); return out; },
    draw(p, t) {
      const lift = t > 10 ? Math.pow(t - 10, 2) * 4 : 0, sh = t > 9 && t < 12 ? Math.round(Math.sin(t * 50)) : 0;
      p.vgrad(0, 96, lift > 30 ? '#2a5ab0' : '#4a90ff', '#c8e8ff'); p.rect(0, 86, MW, 10, '#6a6a6a');
      p.rect(80 + sh, 14, 6, 72, '#c84a2a'); for (let y = 16; y < 86; y += 8) p.line(80 + sh, y, 86 + sh, y + 8, '#8a2a1a');
      const ry = 20 - lift; p.rect(56 + sh, ry + 10, 14, 56, '#f8f8f8'); p.poly([[56 + sh, ry + 10], [63 + sh, ry - 4], [70 + sh, ry + 10]], '#f8f8f8'); p.rect(56 + sh, ry + 24, 14, 4, '#111').rect(56 + sh, ry + 44, 14, 3, '#111'); p.poly([[52 + sh, ry + 66], [56 + sh, ry + 56], [56 + sh, ry + 66]], '#333').poly([[74 + sh, ry + 66], [70 + sh, ry + 56], [70 + sh, ry + 66]], '#333');
      if (t > 9) { const fl = 8 + Math.sin(t * 40) * 3 + Math.min(20, (t - 9) * 10); p.poly([[57 + sh, ry + 66], [69 + sh, ry + 66], [63 + sh, ry + 66 + fl]], '#ffd400'); p.poly([[60 + sh, ry + 66], [66 + sh, ry + 66], [63 + sh, ry + 66 + fl * 0.6]], '#fff'); const sm = Math.min(1, (t - 9) / 1.5); p.ell(40, 86, 24 * sm, 6 * sm, '#e8e8e8').ell(90, 88, 26 * sm, 6 * sm, '#e0e0e0'); }
      if (t < 10) p.text(6, 6, String(10 - Math.floor(t)), '#e10600', 4); else p.text(6, 6, 'LIFT-OFF!', '#e10600', 2);
    } });
  // ---- theremin (try it: drag on the picture)
  clip('theremin', { title: 'The theremin (drag on the picture to play)', dur: 16, interactive: true,
    freq(t) { const tune = [392, 440, 494, 587, 523, 494, 440, 392, 330, 392, 349, 294]; const i = Math.floor(t / 1.3) % tune.length, f0 = tune[i], f1 = tune[(i + 1) % tune.length], k = (t % 1.3) / 1.3; return lerp(f0, f1, k < 0.75 ? 0 : (k - 0.75) * 4) * (1 + Math.sin(t * 34) * 0.012); },
    ev() { const out = []; for (let t = 0.2; t < 16; t += 0.07) { const tt = t; out.push([t, (st) => { if (!st.hand) sfx(this.freq(tt), 0.1, 'sine'); }]); } return out; },
    draw(p, t, st) {
      p.vgrad(0, 96, '#2a1040', '#100820'); for (let i = 0; i < 20; i++) p.px((i * 37) % MW, (i * 23) % 60, '#6a4a9a');
      const f = st.hand ? st.hand : this.freq(t);
      p.rect(30, 62, 60, 14, '#7a4a1a'); p.rect(30, 62, 60, 2, '#9a6a3a'); p.rect(40, 76, 4, 14, '#5a3a1a').rect(76, 76, 4, 14, '#5a3a1a');
      p.rect(86, 18, 2, 44, '#c8c8c8'); p.ell(26, 60, 6, 3, 'rgba(0,0,0,0)'); p.line(30, 66, 18, 60, '#c8c8c8').line(18, 60, 18, 56, '#c8c8c8');
      const hx = lerp(84, 40, (f - 200) / 900); p.ell(hx, 36, 5, 7, '#f2c79a'); p.rect(hx - 8, 38, 6, 3, '#f2c79a');
      let prev = 14; for (let x = 0; x < MW; x++) { const y = 14 + Math.sin(x * f / 2000 + t * 30) * 6; p.line(x - 1, prev, x, y, '#ff8ac0'); prev = y; }
      p.text(3, 89, Math.round(f) + ' HZ', '#ffd400'); p.text(60, 89, 'DRAG TO PLAY!', '#9fd0ff');
    } });
  // ---- the end of the dinosaurs
  clip('meteor', { title: 'The end of the dinosaurs', dur: 11,
    ev() { const out = []; for (let i = 0; i < 16; i++) out.push([1 + i * 0.25, () => sfx(900 - i * 50, 0.25, 'sawtooth')]); out.push([5, () => { Sound.play('thud'); for (let i = 0; i < 6; i++) sfx(60 - i * 5, 0.6, 'square'); }]); return out; },
    draw(p, t) {
      if (t > 5 && t < 5.4) { p.fill('#fff'); return; }
      p.fill('#05051a'); p.stars(40, 61);
      p.ell(64, 120, 90, 50, '#1a5ac8'); p.ell(40, 76, 20, 6, '#3a9a2a'); p.ell(90, 80, 14, 5, '#3a9a2a');
      if (t < 5) { const k = t / 5, x = lerp(130, 60, k), y = lerp(-10, 72, k), r = lerp(1, 5, k); for (let i = 0; i < 12; i++) p.disc(x + i * 2.2, y - i * 2.6, r * (1 - i / 14), `rgba(255,${130 + i * 8},0,${0.8 - i * 0.06})`); p.disc(x, y, r, '#6a5a50'); }
      else { const k = Math.min(1, (t - 5.4) / 3); p.ell(62, 74, 10 + k * 60, 4 + k * 24, `rgba(90,70,60,${0.5 + k * 0.4})`); p.ell(62, 74, 6 + k * 20, 3 + k * 8, `rgba(255,${120 + k * 60 | 0},0,${0.8 - k * 0.6})`); }
      p.text(3, 3, 'ABOUT 65 MILLION', '#ffd400'); p.text(3, 10, 'YEARS AGO...', '#ffd400');
      if (t > 8.5) { p.rect(0, 80, MW, 16, 'rgba(0,0,0,.7)'); p.ctext(83, 'BUT THE BIRDS SURVIVED.', '#fff'); p.ctext(90, 'BIRDS ARE DINOSAURS TOO!', '#9fd0ff'); }
    } });

  // a media player that runs one clip on a canvas; returns {play, stop, el}
  function mediaBox(key, onDone) {
    const m = MEDIA[key]; if (!m) return null;
    const el = h('div', 'ct-e-mbox');
    el.innerHTML = `<canvas class="ct-px ct-e-mcv" width="${MW}" height="${MH}"></canvas><div class="ct-e-mctl"><button class="btn ct-e-mb" data-m="play" type="button" aria-label="Play">${TI.play}</button><button class="btn ct-e-mb" data-m="stop" type="button" aria-label="Stop">${TI.stop}</button><div class="ct-e-mbar"><i></i></div><span class="ct-e-mt">0:00 / ${fmt(m.dur)}</span></div>`;
    const cv = el.querySelector('canvas'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const p = C.art.Painter(g, MW, MH), bar = el.querySelector('.ct-e-mbar i'), tm = el.querySelector('.ct-e-mt');
    let raf = 0, t0 = 0, last = -1, playing = false, evs = null; const st = { hand: 0 };
    const frame = now => {
      const t = Math.min(m.dur, (now - t0) / 1000);
      if (!evs) evs = m.ev.call(m).sort((a, b) => a[0] - b[0]);
      evs.forEach(e => { if (e[0] > last && e[0] <= t) { try { e[1](st); } catch (er) {} } });
      last = t;
      try { m.draw(p, t, st); } catch (er) {}
      bar.style.width = (t / m.dur * 100) + '%'; tm.textContent = fmt(t) + ' / ' + fmt(m.dur);
      if (t >= m.dur) { stop(true); return; }
      raf = requestAnimationFrame(frame);
    };
    function play() { stop(); if (!Sound.on) C.sfxHint('JackCarta 99'); playing = true; t0 = performance.now(); last = -0.001; if (m.music) Sound.music.play(m.music); raf = requestAnimationFrame(frame); el.classList.add('on'); mediaSeen.add(key); store.set('e_media', [...mediaSeen]); if (Object.keys(MEDIA).every(k => mediaSeen.has(k))) C.secret('allmedia'); }
    function stop(done) { cancelAnimationFrame(raf); if (playing && m.music && Sound.music.playing === m.music) Sound.music.stop(); playing = false; el.classList.remove('on'); if (done && onDone) onDone(); }
    el.querySelector('[data-m=play]').addEventListener('click', play);
    el.querySelector('[data-m=stop]').addEventListener('click', () => stop());
    if (m.interactive) {
      let tick = 0;
      const at = ev => { const r = cv.getBoundingClientRect(); return 200 + Math.max(0, Math.min(1, 1 - (ev.clientX - r.left) / r.width)) * 900; };
      cv.addEventListener('pointerdown', ev => { cv.setPointerCapture(ev.pointerId); st.hand = at(ev); if (!playing) play(); clearInterval(tick); tick = setInterval(() => { if (st.hand) sfx(st.hand, 0.1, 'sine'); }, 70); });
      cv.addEventListener('pointermove', ev => { if (st.hand) st.hand = at(ev); });
      const up = () => { st.hand = 0; clearInterval(tick); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    }
    m.draw(p, 0, st);
    return { el, play, stop, get playing() { return playing; } };
  }

  // ================================================================ the program
  C.mods.encyc = function (w, arg) {
    const root = h('div', 'ct-e');
    root.innerHTML = `
      <div class="ct-e-tb" role="toolbar">
        ${[['home', 'Home'], ['back', 'Back'], ['fwd', 'Forward'], ['list', 'Contents'], ['cats', 'Categories'], ['time', 'Timeline'], ['media', 'Media'], ['castle', 'Quiz Keep'], ['dice', 'Random']].map(([k, l]) => `<button type="button" class="ct-e-tbb" data-a="${k}" title="${l}"><span class="ct-e-tbi">${TI[k]}</span><span class="ct-e-tbl">${l}</span></button>`).join('')}
      </div>
      <div class="ct-e-main">
        <div class="ct-e-side">
          <div class="ct-e-sh"><span>Contents A-Z</span><button type="button" class="ct-e-sx" aria-label="Close contents">x</button></div>
          <input type="text" class="ct-e-q" placeholder="Type a word to search..." autocomplete="off" aria-label="Search articles">
          <div class="ct-e-list field" role="listbox"></div>
          <div class="ct-e-cnt"></div>
        </div>
        <div class="ct-e-view" tabindex="-1"></div>
      </div>
      <div class="ct-e-intro"><canvas class="ct-px" width="320" height="200"></canvas><div class="ct-e-introui"></div></div>`;
    w.body.appendChild(root);
    const $ = s => root.querySelector(s);
    const view = $('.ct-e-view'), list = $('.ct-e-list'), q = $('.ct-e-q'), side = $('.ct-e-side');
    let D = null, BY = {}, ALL = [], SORTED = [], cur = null, hist = [], hpos = -1, castle = null, curMedia = null, dice = store.get('e_dice', 0), konami = 0;
    const status = t => { if (w.status) w.status.textContent = t; };

    // narrow layout (phones and small windows)
    const ro = new ResizeObserver(() => { const nw = root.offsetWidth < 580; root.classList.toggle('ct-e-narrow', nw); if (!nw) root.classList.remove('ct-e-sideopen'); });
    ro.observe(root); w.cleanup.push(() => ro.disconnect());
    w.cleanup.push(() => { if (curMedia) curMedia.stop(); if (castle && castle.cleanup) castle.cleanup(); introStop(); });

    // ---------------------------------------------------------------- menus
    A.menubar(w, [
      ['File', [{ label: 'Print Article...', key: 'Ctrl+P', act: printArticle }, { label: 'Copy Article Text', act: copyArticle }, '-', { label: 'Exit', act: () => w.close() }]],
      ['View', () => [{ label: 'Home', act: () => go({ v: 'home' }) }, { label: 'Contents A-Z', act: toggleSide }, { label: 'Categories', act: () => go({ v: 'cats' }) }, { label: 'Timeline', act: () => go({ v: 'time' }) }, { label: 'Media Gallery', act: () => go({ v: 'media' }) }, '-', { label: 'Show Contents Pane', chk: !root.classList.contains('ct-e-noside'), act: () => root.classList.toggle('ct-e-noside') }]],
      ['Go', () => [{ label: 'Back', key: 'Alt+Left', dis: hpos <= 0, act: back }, { label: 'Forward', key: 'Alt+Right', dis: hpos >= hist.length - 1, act: fwd }, '-', { label: 'Random Article', act: random }, { label: 'Article of the Day', act: () => D && go({ v: 'art', id: aotd().id }) }]],
      ['Quiz', [{ label: 'Enter the Quiz Keep', act: () => go({ v: 'castle' }) }, { label: 'New Game', act: () => { castle = null; go({ v: 'castle' }); } }]],
      ['Help', [{ label: 'How to Use JackCarta', act: () => Desk.msgbox('JackCarta 99 Help', 'HOW TO USE JACKCARTA 99\n\n- Type in the box on the left to find an article.\n- Click blue words to jump to other articles.\n- Media articles have a PLAY button under the picture.\n- The Timeline goes back a LONG way. Scroll left.\n- The Quiz Keep: answer questions to open doors, find the key on each floor, climb the stairs and sit on the throne.\n\nTip: some articles only appear if you search for them.', 'info') }, '-', { label: 'About JackCarta 99', act: about }]],
    ]);
    function about() { Desk.msgbox('About JackCarta 99', `JackCarta 99\nThe Multimedia Encyclopedia for Curious Minds\nVersion 99.0  (2 discs)\n\n${ALL.length} articles, ${Object.keys(MEDIA).length} media clips, 1 castle.\n\nThis product is licensed to:\n  The family computer\n\nWarning: reading encyclopedias may cause you to know things.`, 'info'); }
    function printArticle() { if (!cur || cur.v !== 'art') return Desk.msgbox('Print', 'Open an article first, then print it.', 'info'); Desk.msgbox('Print', `Printing "${BY[cur.id].t}" on the inkjet...\n\nThe picture came out pink. You're out of cyan. You are ALWAYS out of cyan.`, 'info'); }
    function copyArticle() { if (!cur || cur.v !== 'art') return; const a = BY[cur.id]; const txt = a.t + '\n\n' + a.x.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (m0, id, l) => l || (BY[id] ? BY[id].t : id)); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => Desk.toast('JackCarta 99', 'Article copied! Paste it into your homework. (Then put it in your own words, or Mrs Hargreaves WILL notice.)'), () => {}); }

    // ---------------------------------------------------------------- navigation
    function go(state, noHist) {
      if (curMedia) { curMedia.stop(); curMedia = null; }
      if (castle && castle.pause && state.v !== 'castle') castle.pause();
      cur = state;
      if (!noHist) { hist = hist.slice(0, hpos + 1); hist.push(state); hpos = hist.length - 1; }
      root.classList.remove('ct-e-sideopen');
      ({ home: showHome, art: showArticle, cats: showCats, cat: showCat, time: showTime, media: showMedia, castle: showCastle }[state.v] || showHome)(state);
      $('[data-a=back]').disabled = hpos <= 0; $('[data-a=fwd]').disabled = hpos >= hist.length - 1;
      view.scrollTop = 0;
      list.querySelectorAll('.sel').forEach(e => e.classList.remove('sel'));
      if (state.v === 'art') { const li = list.querySelector(`[data-id="${state.id}"]`); if (li) { li.classList.add('sel'); if (!touch()) li.scrollIntoView({ block: 'nearest' }); } }
    }
    const back = () => { if (hpos > 0) { hpos--; go(hist[hpos], true); } };
    const fwd = () => { if (hpos < hist.length - 1) { hpos++; go(hist[hpos], true); } };
    const toggleSide = () => { if (root.classList.contains('ct-e-narrow')) root.classList.toggle('ct-e-sideopen'); else root.classList.toggle('ct-e-noside'); if (side.offsetParent) setTimeout(() => q.focus(), 30); };
    function random() {
      if (!D) return; dice++; store.set('e_dice', dice); Sound.play('dice');
      if (dice % 25 === 0 || Math.random() < 0.03) return go({ v: 'art', id: 'x_blank' });
      go({ v: 'art', id: pick(ALL.filter(a => !a.rare)).id });
    }
    const aotd = () => { const t = Desk.today99(); const day = Math.floor((t.date - new Date(1999, 0, 0)) / 864e5); const pool = ALL.filter(a => !a.rare); return pool[(day * 37) % pool.length]; };
    root.querySelectorAll('.ct-e-tbb').forEach(b => b.addEventListener('click', () => {
      Sound.play('click'); const a = b.dataset.a;
      if (!D && a !== 'list') return;
      ({ home: () => go({ v: 'home' }), back, fwd, list: toggleSide, cats: () => go({ v: 'cats' }), time: () => go({ v: 'time' }), media: () => go({ v: 'media' }), castle: () => go({ v: 'castle' }), dice: random })[a]();
    }));
    $('.ct-e-sx').addEventListener('click', () => root.classList.remove('ct-e-sideopen'));
    view.addEventListener('click', ev => {
      const l = ev.target.closest('[data-go]'); if (!l) return; ev.preventDefault();
      const id = l.dataset.go; if (l.dataset.cat) return go({ v: 'cat', id: l.dataset.cat });
      if (BY[id]) { Sound.play('click'); go({ v: 'art', id }); }
    });
    // keyboard: Alt+arrows, and a certain famous code
    const KON = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    w.el.addEventListener('keydown', ev => {
      konami = ev.key === KON[konami] || ev.key.toLowerCase() === KON[konami] ? konami + 1 : (ev.key === 'ArrowUp' ? (konami === 2 ? 2 : 1) : 0);
      if (konami === KON.length) { konami = 0; cheat(); }
      if (ev.altKey && ev.key === 'ArrowLeft') { ev.preventDefault(); back(); }
      if (ev.altKey && ev.key === 'ArrowRight') { ev.preventDefault(); fwd(); }
      if (ev.ctrlKey && (ev.key === 'p' || ev.key === 'P')) { ev.preventDefault(); printArticle(); }
    });
    let grotMode = false;
    function cheat() {
      C.secret('konami'); grotMode = !grotMode; root.classList.toggle('ct-e-grot', grotMode);
      Sound.play('waaagh');
      Desk.toast('JackCarta 99', grotMode ? 'CHEAT ACTIVATED: Gubbinz Mode! Every picture is now Gubbinz. Free key in the Quiz Keep, too.' : 'Gubbinz Mode off. The pictures are back to normal. Gubbinz is sulking.', 6000);
      if (castle) castle.freeKey = grotMode;
      if (cur) go(cur, true);
    }

    // ---------------------------------------------------------------- contents list + search
    function renderList(query) {
      query = (query || '').trim().toLowerCase();
      let items;
      if (!query) items = SORTED.filter(a => !a.rare || rareFound.has(a.id) || a.id === 'x_zzz');
      else {
        const rareHit = { squig: 'x_squig', squigs: 'x_squig', dave: 'x_dave', grot: 'x_grot', grots: 'x_grot', gubbinz: 'x_grot', blank: 'x_blank' }[query];
        if (rareHit) { BY[rareHit]._show = true; }
        const sc = a => { const t = a.t.toLowerCase(); if (t === query) return 0; if (t.startsWith(query)) return 1; if (t.includes(query)) return 2; if ((a.kw || '').toLowerCase().includes(query)) return 3; if (a.x.toLowerCase().includes(query)) return 4; return 9; };
        items = ALL.filter(a => (!a.rare || a.id === rareHit || rareFound.has(a.id)) && sc(a) < 9).sort((a, b) => sc(a) - sc(b) || a.t.localeCompare(b.t));
      }
      let letter = '';
      list.innerHTML = items.map(a => { const t0 = a.t.replace(/^The /, '')[0]; const L = /[a-z]/i.test(t0) ? t0.toUpperCase() : '#'; const head = !query && L !== letter ? (letter = L, `<div class="ct-e-lh">${L}</div>`) : ''; return head + `<div class="ct-e-li${a.rare ? ' rare' : ''}${read.has(a.id) ? ' read' : ''}" role="option" data-id="${a.id}"><span class="ct-e-dot" style="background:${CAT[a.c] ? CAT[a.c].col : '#888'}"></span>${a.m ? '<span class="ct-e-mi" title="Media">&#9654;</span>' : ''}${esc(a.t)}</div>`; }).join('') || `<div class="ct-e-none">No articles found for "${esc(query)}".<br><br>Try a shorter word. Or check the spelling. Or ask Dave. (Don't ask Dave.)</div>`;
      $('.ct-e-cnt').textContent = query ? `${items.length} found` : `${ALL.filter(a => !a.rare).length} articles`;
    }
    list.addEventListener('click', ev => { const li = ev.target.closest('.ct-e-li'); if (li) { Sound.play('click'); go({ v: 'art', id: li.dataset.id }); } });
    list.addEventListener('scroll', () => { if (!q.value && list.scrollTop + list.clientHeight >= list.scrollHeight - 4 && D) { if (!rareFound.has('x_zzz')) { list.querySelector('[data-id=x_zzz]') && list.querySelector('[data-id=x_zzz]').classList.add('glow'); } } });
    let qt = 0; q.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => renderList(q.value), 120); });
    q.addEventListener('keydown', ev => { if (ev.key === 'Enter') { renderList(q.value); const f = list.querySelector('.ct-e-li'); if (f) go({ v: 'art', id: f.dataset.id }); } });

    // ---------------------------------------------------------------- views
    const artCanvas = (key, cls) => { const cv = document.createElement('canvas'); cv.className = 'ct-px ' + (cls || ''); C.art.draw(grotMode ? 'grot' : key, cv); return cv; };
    // an article's own picture (drawn for that article only); no fitting picture -> a neutral title card, never a wrong picture
    function articlePic(a) {
      const cv = document.createElement('canvas'); cv.className = 'ct-px';
      if (grotMode) { C.art.draw('grot', cv); return { el: cv, cap: 'Gubbinz. Gubbinz Mode is on.' }; }
      const cap = C.art.drawArticle(a.id, cv);
      if (cap != null) return { el: cv, cap };
      const box = h('div', 'ct-e-noart', `<span>${esc(a.t)}</span>`); box.style.setProperty('--cc', (CAT[a.c] || { col: '#555' }).col);
      return { el: box, cap: null };
    }
    const linkify = s => esc(s).replace(/\[\[([a-z0-9_]+)(?:\|([^\]]+))?\]\]/g, (m0, id, label) => BY[id] && (!BY[id].rare || rareFound.has(id)) ? `<a href="#" class="ct-e-link" data-go="${id}">${label || esc(BY[id].t)}</a>` : `<span>${label || id.replace(/_/g, ' ')}</span>`);

    function showHome() {
      const a = aotd(), fact = pick(ALL.filter(x => !x.rare && x.f && x.f.length)), fr = fact ? pick(fact.f) : null;
      view.innerHTML = `<div class="ct-e-home">
        <div class="ct-e-banner"><div class="ct-e-logo">Jack<b>Carta</b><sup>99</sup></div><div class="ct-e-tag">The Multimedia Encyclopedia for Curious Minds</div></div>
        <div class="ct-e-hgrid">
          <div class="ct-e-hbox ct-e-aotd" data-go="${a.id}"><div class="ct-e-hh">Article of the Day</div><div class="ct-e-hpic"></div><b>${esc(a.t)}</b><p>${esc(a.x.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (m0, id, l) => l || (BY[id] ? BY[id].t : id)).split(/(?<=\.)\s/)[0])}</p><span class="ct-e-more">Read more &raquo;</span></div>
          <div class="ct-e-hcol">
            <div class="ct-e-hbox ct-e-dyk"><div class="ct-e-hh">Did You Know?</div><p>${fr ? `<b>${esc(fact.t)}</b> &mdash; ${esc(fr[0])}: ${esc(fr[1])}.` : esc(pick(FACTS_EXTRA))}</p>${fact ? `<a href="#" class="ct-e-link" data-go="${fact.id}">Find out more</a>` : ''}</div>
            <div class="ct-e-hbtns">
              <button type="button" class="ct-e-big" data-hb="cats"><span>${TI.cats}</span>Categories</button>
              <button type="button" class="ct-e-big" data-hb="time"><span>${TI.time}</span>Timeline</button>
              <button type="button" class="ct-e-big" data-hb="media"><span>${TI.media}</span>Media Gallery</button>
              <button type="button" class="ct-e-big ct-e-bigq" data-hb="castle"><span>${TI.castle}</span>Quiz Keep</button>
            </div>
            <div class="ct-e-hstat">You have read <b>${[...read].filter(id => BY[id]).length}</b> of <b>${ALL.filter(x => !x.rare).length}</b> articles.</div>
          </div>
        </div>
        <div class="ct-e-hcats">${CATS.map(c => `<button type="button" class="ct-e-hcat" data-go="" data-cat="${c[0]}" style="--cc:${c[2]}"><span class="ct-e-hci"></span><span>${esc(c[1])}</span></button>`).join('')}</div>
      </div>`;
      view.querySelector('.ct-e-hpic').appendChild(articlePic(a).el);
      view.querySelectorAll('.ct-e-hcat').forEach((b, i) => b.querySelector('.ct-e-hci').appendChild(artCanvas(CATS[i][3])));
      view.querySelectorAll('[data-hb]').forEach(b => b.addEventListener('click', () => { Sound.play('click'); go({ v: b.dataset.hb }); }));
      status(`JackCarta 99  |  ${ALL.filter(x => !x.rare).length} articles  |  Disc 1 of 2`); w.setTitle('JackCarta 99');
    }

    function showArticle(st) {
      const a = BY[st.id]; if (!a) return showHome();
      const cat = CAT[a.c] || { name: 'Miscellaneous', col: '#555' };
      if (a.rare && !rareFound.has(a.id)) { rareFound.add(a.id); store.set('e_rare', [...rareFound]); renderList(q.value); }
      if (a.rare && a.rare !== 'grot') C.secret(a.rare);
      if (!a.rare) { read.add(a.id); store.set('e_read', [...read]); catsSeen.add(a.c); store.set('e_cats', [...catsSeen]); if (read.size >= 30) C.secret('bookworm'); if (CATS.every(c => catsSeen.has(c[0]))) C.secret('allcats'); const li = list.querySelector(`[data-id="${a.id}"]`); if (li) li.classList.add('read'); }
      const rel = (a.rel || []).filter(id => BY[id] && (!BY[id].rare || rareFound.has(id)));
      view.innerHTML = `<article class="ct-e-art${a.id === 'x_blank' ? ' ct-e-blank' : ''}" style="--cc:${cat.col}">
        <header class="ct-e-ah"><a href="#" class="ct-e-chip" data-go="" data-cat="${a.c}">${esc(cat.name)}</a><h2>${esc(a.t)}</h2>${a.y ? `<span class="ct-e-yr">${a.y}</span>` : ''}</header>
        <div class="ct-e-abody">
          <aside class="ct-e-aside"><figure class="ct-e-fig"><div class="ct-e-pic"></div><figcaption></figcaption></figure>
            ${a.f && a.f.length ? `<table class="ct-e-facts"><caption>Fact File</caption>${a.f.map(r => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</table>` : ''}</aside>
          <div class="ct-e-text">${a.x.split(/\n\n+/).map(par => `<p>${linkify(par)}</p>`).join('')}</div>
          ${rel.length ? `<div class="ct-e-rel"><div class="ct-e-relh">Related articles</div>${rel.map(id => `<a href="#" class="ct-e-rl" data-go="${id}" style="--rc:${(CAT[BY[id].c] || cat).col}">${esc(BY[id].t)}</a>`).join('')}</div>` : ''}
        </div></article>`;
      const pic = view.querySelector('.ct-e-pic');
      const fc = view.querySelector('.ct-e-fig figcaption'), fig = view.querySelector('.ct-e-fig');
      if (a.m && MEDIA[a.m]) { curMedia = mediaBox(a.m); pic.appendChild(curMedia.el); pic.classList.add('media'); fc.innerHTML = '&#9654; <b>Media:</b> ' + esc(MEDIA[a.m].title); }
      else { const ap = articlePic(a); if (ap.cap == null) fig.remove(); else { pic.appendChild(ap.el); fc.innerHTML = '<b>Fig. ' + (SORTED.indexOf(a) + 1) + ':</b> ' + esc(ap.cap); } }
      status(`${cat.name}  |  ${a.t}${a.m ? '  |  Media article: press Play' : ''}`); w.setTitle('JackCarta 99 - ' + a.t);
      if (a.id === 'x_zzz') Sound.play('solve');
    }

    function showCats() {
      view.innerHTML = `<div class="ct-e-pad"><h2 class="ct-e-h2">Categories</h2><div class="ct-e-catgrid">${CATS.map(c => { const n = ALL.filter(a => a.c === c[0] && !a.rare).length; return `<button type="button" class="ct-e-catb" data-go="" data-cat="${c[0]}" style="--cc:${c[2]}"><span class="ct-e-cpic"></span><b>${esc(c[1])}</b><small>${n} article${n === 1 ? '' : 's'}</small></button>`; }).join('')}</div></div>`;
      view.querySelectorAll('.ct-e-cpic').forEach((s, i) => s.appendChild(artCanvas(CATS[i][3])));
      status('Categories: pick a subject'); w.setTitle('JackCarta 99 - Categories');
    }
    function showCat(st) {
      const c = CAT[st.id]; if (!c) return showCats();
      const items = ALL.filter(a => a.c === c.id && (!a.rare || rareFound.has(a.id))).sort((a, b) => (a.y || 0) - (b.y || 0) || a.t.localeCompare(b.t));
      view.innerHTML = `<div class="ct-e-pad" style="--cc:${c.col}"><h2 class="ct-e-h2 ct-e-cath">${esc(c.name)}</h2><div class="ct-e-cards">${items.map(a => `<button type="button" class="ct-e-card${read.has(a.id) ? ' read' : ''}" data-go="${a.id}"><span class="ct-e-cpic"></span><b>${esc(a.t)}</b><small>${a.y || '&nbsp;'}${a.m ? ' &#9654;' : ''}</small></button>`).join('')}</div></div>`;
      view.querySelectorAll('.ct-e-card').forEach((b, i) => b.querySelector('.ct-e-cpic').appendChild(articlePic(items[i]).el));
      status(`${c.name}: ${items.length} articles`); w.setTitle('JackCarta 99 - ' + c.name);
    }
    function showMedia() {
      const items = ALL.filter(a => a.m);
      view.innerHTML = `<div class="ct-e-pad"><h2 class="ct-e-h2">Media Gallery</h2><p class="ct-e-sub">Sounds and moving pictures! You have played <b>${[...mediaSeen].filter(k => MEDIA[k]).length}</b> of <b>${Object.keys(MEDIA).length}</b>.</p><div class="ct-e-cards">${items.map(a => `<button type="button" class="ct-e-card${mediaSeen.has(a.m) ? ' read' : ''}" data-go="${a.id}"><span class="ct-e-cpic"><span class="ct-e-play">&#9654;</span></span><b>${esc(MEDIA[a.m].title)}</b><small>${esc(a.t)}</small></button>`).join('')}</div></div>`;
      view.querySelectorAll('.ct-e-card').forEach((b, i) => b.querySelector('.ct-e-cpic').prepend(articlePic(items[i]).el));
      status('Media Gallery'); w.setTitle('JackCarta 99 - Media Gallery');
    }

    // ---------------------------------------------------------------- timeline
    function showTime() {
      const ev = (D.timeline || []).filter(e => BY[e[2]]).slice().sort((a, b) => a[0] - b[0]);
      const groups = []; ev.forEach(e => { const dec = e[0] < 1900 ? Math.floor(e[0] / 50) * 50 : Math.floor(e[0] / 10) * 10; let g = groups[groups.length - 1]; if (!g || g.dec !== dec) groups.push(g = { dec, ev: [] }); g.ev.push(e); });
      view.innerHTML = `<div class="ct-e-tlw"><div class="ct-e-tlhead"><h2 class="ct-e-h2">Timeline</h2><span class="ct-e-sub">Scroll sideways. History goes back further than you think...</span><span class="ct-e-tlnav"><button type="button" class="btn" data-tl="-1">&laquo; Earlier</button><button type="button" class="btn" data-tl="1">Later &raquo;</button></span></div>
        <div class="ct-e-tl"><div class="ct-e-tltrack">
          <div class="ct-e-tlcol ct-e-tldino"><div class="ct-e-tly">65,000,000 BC</div><button type="button" class="ct-e-tle ct-e-dinoev"><span class="ct-e-cpic"></span><b>The last dinosaurs</b><small>An asteroid hits the Earth. Bad day.</small></button></div>
          <div class="ct-e-tlcol ct-e-tlgap"><div class="ct-e-tly">&nbsp;</div><div class="ct-e-gap">~ about 65 million years of not much happening (from a computer point of view) ~</div></div>
          ${groups.map(g => `<div class="ct-e-tlcol"><div class="ct-e-tly">${g.dec < 1900 ? g.dec + '-' + (g.dec + 49) : g.dec + 's'}</div>${g.ev.map(e => `<button type="button" class="ct-e-tle" data-go="${e[2]}" style="--cc:${(CAT[BY[e[2]].c] || {}).col || '#555'}"><span class="ct-e-tlyr">${e[0]}</span>${esc(e[1])}</button>`).join('')}</div>`).join('')}
          <div class="ct-e-tlcol ct-e-tlnow"><div class="ct-e-tly">NOW</div><div class="ct-e-gap">You are here: 1999. What happens next? Nobody knows! (Probably more floppy disks.)</div></div>
        </div></div></div>`;
      const tl = view.querySelector('.ct-e-tl'), dino = view.querySelector('.ct-e-dinoev');
      dino.querySelector('.ct-e-cpic').appendChild(artCanvas('asteroid'));
      dino.addEventListener('click', () => { C.secret('dinotime'); Sound.play('thud'); go({ v: 'art', id: BY.dinosaur_extinction ? 'dinosaur_extinction' : (BY.dinosaurs ? 'dinosaurs' : ALL[0].id) }); });
      requestAnimationFrame(() => { const c = [...view.querySelectorAll('.ct-e-tlcol')].find(e => /19[4-5]0s/.test(e.textContent)); tl.scrollLeft = c ? c.offsetLeft - 20 : 600; });
      view.querySelectorAll('[data-tl]').forEach(b => b.addEventListener('click', () => tl.scrollBy({ left: +b.dataset.tl * tl.clientWidth * 0.8, behavior: 'smooth' })));
      tl.addEventListener('wheel', ev => { if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) { tl.scrollLeft += ev.deltaY; ev.preventDefault(); } }, { passive: false });
      let drag = null; tl.addEventListener('pointerdown', ev => { if (ev.pointerType !== 'mouse' || ev.target.closest('button')) return; drag = { x: ev.clientX, s: tl.scrollLeft }; }); tl.addEventListener('pointermove', ev => { if (drag) tl.scrollLeft = drag.s - (ev.clientX - drag.x); }); const end = () => { drag = null; }; tl.addEventListener('pointerup', end); tl.addEventListener('pointerleave', end);
      status(`Timeline: ${ev.length} events`); w.setTitle('JackCarta 99 - Timeline');
    }

    // ---------------------------------------------------------------- the Quiz Keep
    function showCastle() { if (!castle) castle = Keep(); castle.mount(view); w.setTitle('JackCarta 99 - Quiz Keep'); }
    function Keep() {
      const FLOORS = [
        { name: 'The Courtyard', cats: ['games', 'consoles', 'puzzles'], wall: '#8a8a7a', floor: '#6a7a4a', sky: true },
        { name: 'The Great Hall', cats: ['hardware', 'computing', 'internet', 'y2k'], wall: '#8a7a6a', floor: '#7a2a2a' },
        { name: 'The Library', cats: ['space', 'films', 'robots'], wall: '#6a6a7a', floor: '#4a3a6a' },
        { name: 'The Tower', cats: ['dinos', 'inventions', 'space', 'games'], wall: '#7a7a8a', floor: '#3a4a5a' },
      ];
      const S = { floor: 0, pos: 4, rooms: null, candles: 7, score: 0, wrongRow: 0, keys: 0, asked: new Set(), q: null, msg: '', won: false, dungeon: false, jest: 0, over: false };
      const K = { freeKey: grotMode };
      const RW = 128, RH = 80;
      let el = null, cv = null, g = null, p = null, raf = 0, paused = false;
      const quizPool = () => (D.quiz || []).filter(z => z && z.a && z.a.length === 4 && BY[z.art]);
      function newFloor() {
        const R = Math.random; const cells = [0, 1, 2, 3, 5, 6, 7, 8]; // pos 4 is the middle of a 3x3 grid; you start at the bottom middle (7)
        const keyAt = cells.filter(c => c !== 7)[Math.floor(R() * 7)]; let stairsAt; do { stairsAt = cells[Math.floor(R() * 8)]; } while (stairsAt === keyAt || stairsAt === 7);
        S.rooms = Array.from({ length: 9 }, (_, i) => ({ open: i === 7, key: i === keyAt, stairs: i === stairsAt, gold: i !== keyAt && i !== stairsAt && R() < 0.35, scroll: i !== keyAt && i !== stairsAt && R() < 0.3, seen: i === 7 }));
        S.pos = 7; S.keys = 0; S.msg = `Welcome to ${FLOORS[S.floor].name}! Find the key, then find the stairs.`;
      }
      function start() { Object.assign(S, { floor: 0, candles: 7, score: 0, wrongRow: 0, asked: new Set(), q: null, won: false, dungeon: false, over: false }); newFloor(); }
      start();
      const nb = (pos, d) => { const x = pos % 3, y = (pos / 3) | 0; const [dx, dy] = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[d]; const nx = x + dx, ny = y + dy; return nx < 0 || nx > 2 || ny < 0 || ny > 2 ? -1 : ny * 3 + nx; };
      function ask(target) {
        const pool = quizPool(); if (!pool.length) { S.rooms[target].open = true; return enter(target); }
        const fl = FLOORS[S.floor]; let cand = pool.filter(z => !S.asked.has(z.q) && fl.cats.includes(BY[z.art].c)); if (!cand.length) cand = pool.filter(z => !S.asked.has(z.q)); if (!cand.length) { S.asked.clear(); cand = pool; }
        const z = pick(cand); S.asked.add(z.q);
        const opts = z.a.map((t, i) => ({ t, ok: i === 0 })).sort(() => Math.random() - 0.5);
        S.q = { z, opts, target, done: false }; Sound.play('pet'); render();
      }
      function answer(i) {
        const Q = S.q; if (!Q || Q.done) return; Q.done = true; Q.pick = i;
        if (Q.opts[i].ok) { S.wrongRow = 0; S.score += 10 * (S.floor + 1); Q.result = 'right'; Sound.play('solve'); if (Q.target >= 0) S.rooms[Q.target].open = true; }
        else {
          S.wrongRow++; S.candles--; Q.result = 'wrong'; Sound.play('uhoh');
          if (S.candles <= 0) { S.over = true; C.secret('dungeon'); }
          else if (S.wrongRow >= 3) { S.dungeon = true; C.secret('dungeon'); }
        }
        render();
      }
      function next() {
        const Q = S.q; S.q = null;
        if (S.over) return render();
        if (S.dungeon) { S.wrongRow = 0; S.dungeon = false; S.pos = 7; S.msg = 'WHOOOSH! Down the chute, into the dungeon, and back to the start of this floor. Watch out for rats.'; Sound.play('boing'); return render(); }
        if (Q && Q.result === 'right') enter(Q.target); else { S.msg = 'The door stays shut. Try again with a new question, or try another door.'; render(); }
      }
      function enter(pos) {
        S.pos = pos; const r = S.rooms[pos]; r.seen = true; Sound.play('turn'); S.msg = '';
        if (r.key && !r.taken) { r.taken = true; S.keys = 1; S.msg = 'You found the KEY! Now find the stairs.'; Sound.play('join'); }
        else if (r.gold && !r.taken) { r.taken = true; S.score += 25; S.msg = 'Treasure! +25 points.'; Sound.play('pet'); }
        else if (r.scroll && !r.taken) { r.taken = true; const kp = S.rooms.findIndex(x => x.key), sp = S.rooms.findIndex(x => x.stairs); const where = i => ['top-left', 'top', 'top-right', 'left', 'middle', 'right', 'bottom-left', 'bottom', 'bottom-right'][i]; S.msg = S.keys ? `An old scroll says: "The stairs are in the ${where(sp)} room."` : `An old scroll says: "The key is hidden in the ${where(kp)} room."`; Sound.play('click'); }
        if (r.stairs) S.msg = (S.msg ? S.msg + ' ' : '') + (S.keys || K.freeKey ? 'The stairs! Climb up?' : 'The stairs are here, but the gate is locked. You need this floor\'s key.');
        render();
      }
      function climb() {
        if (!(S.keys || K.freeKey)) return;
        Sound.play('join');
        if (S.floor < FLOORS.length - 1) { S.floor++; S.candles = Math.min(7, S.candles + 2); newFloor(); render(); }
        else throne();
      }
      function throne() {
        const pool = quizPool().filter(z => !S.asked.has(z.q)); const z = pool.length ? pick(pool) : pick(quizPool());
        S.q = { z, opts: z.a.map((t, i) => ({ t, ok: i === 0 })).sort(() => Math.random() - 0.5), target: -1, done: false, final: true }; S.asked.add(z.q); render();
      }
      function move(d) {
        if (S.q || S.over || S.won) return;
        const t = nb(S.pos, d); if (t < 0) { S.msg = 'That way is a solid stone wall. Ow.'; Sound.play('thud'); return render(); }
        if (S.rooms[t].open) return enter(t);
        ask(t);
      }
      // ---- drawing the room
      function draw(now) {
        if (!p) return; const t = now / 1000, fl = FLOORS[S.floor], r = S.rooms[S.pos];
        if (S.won) { p.vgrad(0, RH, '#3a1060', '#a03070'); for (let i = 0; i < 30; i++) { const a = i / 30 * 6.28 + t; p.px(64 + Math.cos(a) * (30 + (i % 3) * 6), 40 + Math.sin(a) * 20, ['#ffd400', '#fff', '#ff8ac0'][i % 3]); } throne3(p, 64, 50); crown(p, 64, 20 + Math.sin(t * 3) * 2); p.ctext(70, 'ALL HAIL!', '#ffd400'); return; }
        if (S.over) { p.fill('#100808'); for (let x = 8; x < RW; x += 14) p.rect(x, 0, 3, RH, '#555'); p.ctext(30, 'THE DUNGEON', '#e10600', 2); p.ctext(52, 'GAME OVER', '#fff'); return; }
        // walls and floor in one-point perspective
        if (fl.sky) { p.vgrad(0, 22, '#6ab0ff', '#c8e8ff'); } else p.rect(0, 0, RW, 22, '#2a2420');
        p.rect(0, 22, RW, 36, fl.wall); for (let y = 22; y < 58; y += 6) for (let x = ((y / 6) % 2) * 8; x < RW; x += 16) p.rect(x, y, 15, 5, shade(fl.wall, -12));
        p.poly([[0, 0], [24, 22], [24, 58], [0, RH]], shade(fl.wall, -25)); p.poly([[RW, 0], [104, 22], [104, 58], [RW, RH]], shade(fl.wall, -30));
        p.poly([[0, RH], [24, 58], [104, 58], [RW, RH]], fl.floor); for (let i = 1; i < 6; i++) p.line(24 + i * 13.3, 58, -20 + i * 28, RH, shade(fl.floor, -15));
        if (fl.sky) p.rect(24, 0, 80, 22, 'rgba(0,0,0,0)');
        // doors: back wall = north, side walls = west/east, floor arrow = south
        const door = (d, x, y, ww, hh, side) => { const t2 = nb(S.pos, d); if (t2 < 0) return; const open = S.rooms[t2].open; if (side) { p.poly(side === 'w' ? [[6, 34], [16, 38], [16, 60], [6, 66]] : [[122, 34], [112, 38], [112, 60], [122, 66]], open ? '#1a1008' : '#6a3a1a'); if (!open) { p.line(side === 'w' ? 8 : 120, 40, side === 'w' ? 14 : 114, 42, '#3a2008'); p.px(side === 'w' ? 14 : 113, 50, '#ffd400'); } return; } p.rect(x, y, ww, hh, open ? '#1a1008' : '#6a3a1a'); p.ell(x + ww / 2, y, ww / 2, 4, open ? '#1a1008' : '#6a3a1a'); if (!open) { for (let i = 1; i < 4; i++) p.rect(x + i * ww / 4, y, 1, hh, '#4a2a0a'); p.px(x + ww - 3, y + hh / 2, '#ffd400'); } };
        door('n', 56, 36, 16, 22); door('w', 0, 0, 0, 0, 'w'); door('e', 0, 0, 0, 0, 'e');
        if (nb(S.pos, 's') >= 0) p.poly([[60, 74], [68, 74], [64, 79]], S.rooms[nb(S.pos, 's')].open ? '#ffd400' : '#888');
        // torches
        [[30, 34], [96, 34]].forEach(([x, y], i) => { p.rect(x, y, 2, 6, '#5a3a1a'); const f = Math.sin(t * 12 + i * 2) > 0 ? 1 : 0; p.poly([[x - 1, y], [x + 3, y], [x + 1, y - 5 - f]], '#ff8000'); p.px(x + 1, y - 2, '#ffd400'); });
        // things in the room
        if (r.stairs) { for (let i = 0; i < 5; i++) p.rect(82 - i * 2, 56 - i * 4, 16, 4, shade('#9a9a9a', -i * 8)); if (!(S.keys || K.freeKey)) { for (let x = 79; x < 98; x += 3) p.rect(x, 36, 1, 22, '#333'); } }
        if (r.key && !r.taken) keyArt(p, 40, 62 + Math.sin(t * 4)); if (r.gold && !r.taken) { p.rect(36, 62, 12, 7, '#7a4a1a'); p.rect(36, 61, 12, 2, '#ffd400'); p.disc(42, 61, 2, '#ffd400'); } if (r.scroll && !r.taken) { p.rect(38, 64, 10, 5, '#f0e0b0'); p.rect(37, 63, 2, 7, '#c8a870'); p.rect(47, 63, 2, 7, '#c8a870'); }
        jester(p, 22, 50, t, S.q ? 1 : 0);
        // HUD
        p.rect(0, 0, RW, 8, 'rgba(0,0,0,.55)'); p.text(2, 2, FLOORS[S.floor].name.toUpperCase(), '#ffd400'); p.text(96, 2, 'F' + (S.floor + 1) + '/4', '#fff');
      }
      function shade(c, d) { const n = parseInt(c.slice(1), 16); const f = v => Math.max(0, Math.min(255, v + d)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
      function keyArt(p2, x, y) { p2.ring(x, y, 3, '#ffd400', 2); p2.rect(x + 3, y - 1, 9, 2, '#ffd400'); p2.rect(x + 9, y + 1, 2, 3, '#ffd400'); p2.rect(x + 6, y + 1, 2, 2, '#ffd400'); }
      function crown(p2, x, y) { p2.poly([[x - 10, y + 8], [x - 10, y - 2], [x - 5, y + 3], [x, y - 5], [x + 5, y + 3], [x + 10, y - 2], [x + 10, y + 8]], '#ffd400'); p2.disc(x, y + 4, 1.5, '#e10600'); p2.disc(x - 6, y + 5, 1, '#2a7ad8'); p2.disc(x + 6, y + 5, 1, '#3a9a2a'); }
      function throne3(p2, x, y) { p2.rect(x - 12, y - 24, 24, 30, '#a01020'); p2.rect(x - 14, y - 26, 28, 4, '#ffd400'); p2.rect(x - 14, y + 4, 28, 6, '#7a4a1a'); p2.rect(x - 16, y - 8, 4, 18, '#ffd400').rect(x + 12, y - 8, 4, 18, '#ffd400'); }
      function jester(p2, x, y, t, talk) { // Jangles the Jester (an original character)
        const b = Math.sin(t * 3) * 1;
        p2.rect(x - 5, y + b, 10, 12, '#5b16c9'); p2.rect(x - 5, y + b, 5, 12, '#ffd400'); p2.rect(x - 3, y + 12 + b, 2, 6, '#5b16c9'); p2.rect(x + 1, y + 12 + b, 2, 6, '#ffd400');
        p2.disc(x, y - 4 + b, 4, '#f2c79a'); p2.px(x - 2, y - 5 + b, '#000').px(x + 1, y - 5 + b, '#000'); p2.rect(x - 1, y - 2 + b, 3, talk && Math.sin(t * 20) > 0 ? 2 : 1, '#a02020');
        p2.poly([[x - 5, y - 7 + b], [x - 11, y - 12 + b], [x - 1, y - 9 + b]], '#e10600'); p2.poly([[x + 5, y - 7 + b], [x + 11, y - 12 + b], [x + 1, y - 9 + b]], '#2a7ad8'); p2.disc(x - 11, y - 12 + b, 1, '#ffd400'); p2.disc(x + 11, y - 12 + b, 1, '#ffd400');
      }
      const loop = now => { if (paused || !el || !el.isConnected) { raf = 0; return; } draw(now); raf = requestAnimationFrame(loop); };
      // ---- the UI around the canvas
      function mount(container) {
        paused = false;
        container.innerHTML = '';
        el = h('div', 'ct-e-keep');
        el.innerHTML = `<div class="ct-e-kl"><div class="ct-e-kview"><canvas class="ct-px" width="${RW}" height="${RH}" aria-label="Castle room"></canvas></div>
          <div class="ct-e-kpad"><button type="button" class="btn" data-k="n" aria-label="North">&#9650;</button><button type="button" class="btn" data-k="w" aria-label="West">&#9664;</button><button type="button" class="btn ct-e-kup" data-k="up">Climb</button><button type="button" class="btn" data-k="e" aria-label="East">&#9654;</button><button type="button" class="btn" data-k="s" aria-label="South">&#9660;</button></div></div>
          <div class="ct-e-kr"><div class="ct-e-khud"></div><div class="ct-e-kmap"></div><div class="ct-e-kq"></div></div>`;
        container.appendChild(el);
        cv = el.querySelector('canvas'); g = cv.getContext('2d'); g.imageSmoothingEnabled = false; p = C.art.Painter(g, RW, RH);
        el.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; if (k === 'up') climb(); else move(k); }));
        cv.addEventListener('click', ev => { const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * RW, y = (ev.clientY - r.top) / r.height * RH; if (Math.abs(x - 22) < 9 && y > 36 && y < 70) { S.jest++; Sound.play('boing'); const lines = ['Hee hee! Answer well, climb high!', 'Oi! That tickles!', 'Stop poking the jester!', 'I\'m warning you...', 'OW! Fine! Here\'s a secret: the throne is comfy.']; S.msg = 'Jangles the Jester: "' + lines[Math.min(S.jest - 1, 4)] + '"'; if (S.jest >= 5) C.secret('jester'); render(); } });
        render(); if (!raf) raf = requestAnimationFrame(loop);
        status('Quiz Keep: answer questions to open doors. Find the key, climb the stairs, reach the throne!');
      }
      function render() {
        if (!el) return;
        const fl = FLOORS[S.floor];
        el.querySelector('.ct-e-khud').innerHTML = `<span><b>Floor ${S.floor + 1}:</b> ${esc(fl.name)}</span><span class="ct-e-kcand" title="Candles (lives)">${'<i></i>'.repeat(Math.max(0, S.candles))}${'<i class="out"></i>'.repeat(Math.max(0, 7 - S.candles))}</span><span>Score <b>${S.score}</b></span><span>${S.keys || K.freeKey ? '&#128273; Key' : 'No key'}</span>`;
        el.querySelector('.ct-e-kmap').innerHTML = `<div class="ct-e-kgrid">${S.rooms.map((r, i) => `<span class="${i === S.pos ? 'here' : r.open ? 'open' : ''}">${i === S.pos ? '&#9679;' : r.seen && r.stairs ? '&#8679;' : r.seen && r.key && !r.taken ? 'K' : ''}</span>`).join('')}</div><div class="ct-e-kmsg">${esc(S.msg || 'Pick a door. Every locked door asks a question.')}</div>`;
        const qb = el.querySelector('.ct-e-kq');
        el.querySelector('.ct-e-kup').disabled = !(S.rooms[S.pos].stairs && (S.keys || K.freeKey)) || !!S.q || S.won || S.over;
        el.querySelectorAll('[data-k=n],[data-k=s],[data-k=e],[data-k=w]').forEach(b => { b.disabled = !!S.q || S.over || S.won || nb(S.pos, b.dataset.k) < 0; });
        if (S.won) { qb.innerHTML = `<div class="ct-e-kwin"><b>You are the ruler of the Quiz Keep!</b><p>Final score: <b>${S.score}</b>. Jangles the Jester bows so low his hat falls off.</p><button type="button" class="btn" data-q="again">Play Again</button></div>`; }
        else if (S.over) { qb.innerHTML = `<div class="ct-e-kwin"><b>Out of candles!</b><p>It's dark, and you've been thrown in the dungeon. Score: <b>${S.score}</b>.</p><button type="button" class="btn" data-q="again">Try Again</button></div>`; }
        else if (S.q) {
          const Q = S.q;
          qb.innerHTML = `<div class="ct-e-kqq">${Q.final ? '<b class="ct-e-kfin">THE KING\'S QUESTION!</b>' : ''}<p>${esc(Q.z.q)}</p><div class="ct-e-kans">${Q.opts.map((o, i) => `<button type="button" class="btn ct-e-ka${Q.done ? (o.ok ? ' ok' : i === Q.pick ? ' bad' : '') : ''}" data-i="${i}" ${Q.done ? 'disabled' : ''}>${'ABCD'[i]}. ${esc(o.t)}</button>`).join('')}</div>${Q.done ? `<div class="ct-e-kres ${Q.result}">${Q.result === 'right' ? 'Correct! The door creaks open.' : S.dungeon ? 'Wrong three times in a row... the floor opens up!' : 'Wrong! A candle blows out.'} <a href="#" class="ct-e-link" data-go="${Q.z.art}">Read about it</a></div><button type="button" class="btn ct-e-knext" data-q="next">${Q.final && Q.result === 'right' ? 'Sit on the Throne!' : 'Continue'}</button>` : ''}</div>`;
          qb.querySelectorAll('.ct-e-ka').forEach(b => b.addEventListener('click', () => answer(+b.dataset.i)));
        } else qb.innerHTML = S.rooms[S.pos].stairs && (S.keys || K.freeKey) ? `<div class="ct-e-kqq"><p>The stairs go up to ${S.floor < 3 ? esc(FLOORS[S.floor + 1].name) : 'the THRONE ROOM'}.</p><button type="button" class="btn" data-q="climb">Climb the stairs</button></div>` : `<div class="ct-e-khelp">Use the arrows to walk through doors. Locked doors ask a question; answer it right to open them.</div>`;
        qb.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
          const a = b.dataset.q;
          if (a === 'again') { start(); render(); }
          else if (a === 'climb') climb();
          else if (a === 'next') { if (S.q && S.q.final) { if (S.q.result === 'right') { S.q = null; S.won = true; S.score += 100; S.msg = 'You sit on the throne. It is VERY comfy.'; C.secret('castle'); Sound.play('waaagh'); render(); } else { S.q = null; S.msg = 'Wrong! The King frowns. Come back when you\'re wiser. (Try the stairs again.)'; render(); } } else next(); }
        }));
      }
      return { mount, pause() { paused = true; }, cleanup() { paused = true; cancelAnimationFrame(raf); }, set freeKey(v) { K.freeKey = v; } };
    }

    // ---------------------------------------------------------------- the intro: "Please insert Disc 1"
    const intro = $('.ct-e-intro'), icv = intro.querySelector('canvas'), ig = icv.getContext('2d'); ig.imageSmoothingEnabled = false;
    const ip = C.art.Painter(ig, 320, 200), iui = intro.querySelector('.ct-e-introui');
    let iraf = 0, istart = 0, introDone = false, dataReady = false, skip = false;
    function introStop() { cancelAnimationFrame(iraf); }
    function introFrame(now) {
      const t = (now - istart) / 1000;
      ip.fill('#000010'); const R = C.art.rng(5); for (let i = 0; i < 90; i++) { const x = R() * 320, y = R() * 200, s = R(); ip.px((x - t * 20 * s + 640) % 320, y, s > 0.7 ? '#fff' : '#557'); }
      // the disc spins in, the globe rises, the letters drop
      const k = Math.min(1, t / 1.2); const dx = 160, dy = lerp(-60, 74, 1 - Math.pow(1 - k, 3));
      ip.disc(dx, dy, 44, '#b8c0d0'); ip.disc(dx, dy, 42, '#d8e0f0');
      for (let a = 0; a < 6.28; a += 0.05) { const aa = a + t * 4; for (let r = 18; r < 42; r += 3) if (Math.sin(a * 3 + r * 0.4) > 0.55) ip.px(dx + Math.cos(aa) * r, dy + Math.sin(aa) * r, `hsl(${(a * 115 + t * 90) % 360},80%,70%)`); }
      ip.disc(dx, dy, 14, '#1a5ac8'); ip.ell(dx - 4 + Math.sin(t) * 3, dy - 4, 5, 4, '#3a9a2a'); ip.ell(dx + 5 + Math.sin(t) * 3, dy + 4, 4, 3, '#3a9a2a'); ip.ring(dx, dy, 14, '#000');
      const title = 'JACKCARTA 99'; [...title].forEach((ch, i) => { const tt = t - 1.2 - i * 0.09; if (tt < 0) return; const y = Math.min(136, -20 + tt * 400); ip.text(160 - ip.textW(title, 3) / 2 + i * 12, y, ch, i >= 10 ? '#e10600' : '#ffd400', 3); });
      if (t > 2.6) ip.ctext(160, 'THE MULTIMEDIA ENCYCLOPEDIA', '#9fd0ff'); if (t > 3) ip.ctext(172, 'FOR CURIOUS MINDS', '#9fd0ff');
      if (t > 3.4) ip.ctext(190, (Math.floor(t * 2) % 2 ? 'CLICK TO START' : ''), '#fff');
      if ((t > 4.6 && dataReady) || (skip && dataReady)) return finishIntro();
      iraf = requestAnimationFrame(introFrame);
    }
    function playIntro() {
      iui.innerHTML = ''; istart = performance.now(); skip = false;
      [523, 659, 784, 1047, 988, 1319].forEach((f, i) => setTimeout(() => !w.closed && sfx(f, 0.25, 'square'), 1200 + i * 150));
      iraf = requestAnimationFrame(introFrame);
    }
    intro.addEventListener('click', ev => { if (!ev.target.closest('button')) skip = true; });
    function finishIntro() { if (introDone) return; introDone = true; introStop(); intro.classList.add('gone'); setTimeout(() => intro.remove(), 400); afterIntro(); }
    function insertDisc() { // the first time: the classic "wrong disc" dance
      ip.fill('#000010'); ip.ctext(90, 'JACKCARTA 99', '#ffd400', 2);
      iui.innerHTML = `<div class="ct-e-dlg win"><div class="tb"><span class="t">JackCarta 99</span></div><div class="ct-e-dlgb"><div class="row" style="flex-wrap:nowrap;gap:10px;align-items:flex-start"><span class="ct-e-cdico">${C.ICON.cdplayer}</span><span class="ct-e-dmsg">Please insert <b>JackCarta 99 Disc 1</b> into drive D: and click OK.</span></div><div class="row ct-e-dbtn"><button type="button" class="btn" data-d="ok">OK</button><button type="button" class="btn" data-d="d2">Use Disc 2</button><button type="button" class="btn" data-d="cancel">Cancel</button></div></div></div>`;
      let step = 0; const msg = iui.querySelector('.ct-e-dmsg');
      iui.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
        const d = b.dataset.d; Sound.play('click');
        if (d === 'cancel') { msg.innerHTML = 'JackCarta 99 cannot run without Disc 1. It\'s an encyclopedia. It needs the encyclopedia. Please insert <b>Disc 1</b>.'; return; }
        if (d === 'd2') { C.secret('disc2'); Sound.play('uhoh'); msg.innerHTML = 'That is <b>Disc 2</b>. Disc 2 has a crack in it and a tea ring on the label. Somebody used it as a <b>coaster</b>.<br><br>Please insert <b>Disc 1</b>.'; return; }
        if (step === 0) { step = 1; Sound.play('turn'); msg.innerHTML = '<span class="ct-spin ct-e-ispin"></span> Reading drive D:...'; setTimeout(() => { if (!w.closed) msg.innerHTML = 'The disc in drive D: is <b>JACK ATTACK! COVER DISC #7</b>. That is not JackCarta 99 Disc 1.<br><br>Please insert <b>Disc 1</b>. (Check under the sofa.)'; }, 1300); return; }
        if (step === 1) { step = 2; Sound.play('turn'); msg.innerHTML = '<span class="ct-spin ct-e-ispin"></span> Reading drive D:...'; setTimeout(() => { if (w.closed) return; store.set('e_intro', 1); playIntro(); }, 1100); }
      }));
    }
    function afterIntro() {
      status('Ready');
      if (arg === 'castle') go({ v: 'castle' }); else go({ v: 'home' });
    }
    C.api.encyc = { alive: () => !w.closed, take(a) { w.restore(); if (!introDone) { arg = a; return; } if (a === 'castle') go({ v: 'castle' }); else if (a && BY[a]) go({ v: 'art', id: a }); } };

    // ---------------------------------------------------------------- load everything
    if (store.get('e_intro', 0)) playIntro(); else insertDisc();
    status('Loading articles from Disc 1...');
    Promise.all([A.load('js/carta-art.js'), A.load('js/carta-articles-a.js').catch(() => 0), A.load('js/carta-articles-b.js').catch(() => 0), ...['games', 'tech', 'culture', 'nature'].map(k => A.load('js/carta-art-' + k + '.js').catch(() => 0))]).then(() => {
      if (w.closed) return;
      D = window.CartaData || { articles: [], quiz: [], timeline: [] };
      C.art.add({ // pictures for the encyclopedia's own rare articles
        x_squig: { cap: 'An artist\'s impression of a squig. No photos exist. (They eat cameras.)', draw(p, S) {
          p.vgrad(0, 72, '#3a2a3a', '#1a1018'); p.poly([[0, 0], [20, 0], [10, 18]], '#2a1a2a'); p.poly([[60, 0], [96, 0], [80, 22]], '#2a1a2a'); p.rect(0, 58, 96, 14, '#4a3a3a'); p.dither(0, 58, 96, 14, '#3a2a2a');
          p.odisc(48, 36, 20, '#e01010'); p.disc(42, 30, 12, '#ff4040'); p.px(36, 22, '#ffb0b0').px(37, 22, '#ffb0b0');
          p.odisc(40, 26, 4, '#fff'); p.odisc(56, 26, 4, '#fff'); p.disc(41, 27, 2, '#000'); p.disc(57, 27, 2, '#000');
          p.ell(48, 42, 14, 7, '#000'); for (let x = 36; x < 61; x += 4) { p.poly([[x, 36], [x + 3, 36], [x + 1.5, 40]], '#fff'); p.poly([[x + 1, 48], [x + 4, 48], [x + 2.5, 44]], '#fff'); }
          p.oell(38, 58, 6, 3, '#ffd400'); p.oell(58, 58, 6, 3, '#ffd400');
        } },
        x_dave: { cap: 'A self-portrait by Dave, in crayon. He has given himself muscles.', draw(p, S) {
          S.paper(p); const R = C.art.rng(42), wob = (x0, y0, x1, y1, c) => { for (let k = 0; k < 2; k++) p.line(x0 + (R() - 0.5) * 2, y0 + (R() - 0.5) * 2, x1 + (R() - 0.5) * 2, y1 + (R() - 0.5) * 2, c); };
          p.disc(84, 10, 7, '#ffd400'); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; wob(84 + Math.cos(a) * 9, 10 + Math.sin(a) * 9, 84 + Math.cos(a) * 13, 10 + Math.sin(a) * 13, '#ff9a00'); }
          p.ring(46, 20, 9, '#d06020', 1); p.px(42, 18, '#000').px(50, 18, '#000'); wob(42, 24, 50, 24, '#c01010');
          for (let x = 37; x < 56; x += 3) wob(x, 12, x + 1, 6, '#5a3010');
          wob(46, 29, 46, 50, '#1a40d0'); wob(46, 34, 30, 28, '#1a40d0'); wob(46, 34, 62, 28, '#1a40d0'); p.ring(28, 26, 4, '#1a40d0'); p.ring(64, 26, 4, '#1a40d0');
          wob(46, 50, 36, 66, '#1a40d0'); wob(46, 50, 56, 66, '#1a40d0'); p.rect(0, 67, 96, 5, '#3a9a2a');
          p.text(6, 6, 'DAVE', '#e01010', 2); p.text(6, 18, 'AGE: COOL', '#1a40d0');
        } },
        x_blank: { cap: 'Nothing. On purpose.', draw(p) { p.fill('#fff'); } },
        x_grot: { cap: 'A small green grot model, freshly painted, next to the paint pots.', draw(p, S) {
          S.room(p); [[8, '#e01010'], [20, '#3a9a2a'], [76, '#ffd400']].forEach(([x, c]) => { p.obox(x, 54, 10, 10, '#eee'); p.rect(x + 1, 55, 8, 3, c); });
          p.oell(48, 60, 14, 3, '#333'); const c = '#3a9a2a';
          p.opoly([[30, 22], [20, 14], [34, 26]], c); p.opoly([[66, 22], [76, 14], [62, 26]], c);
          p.oell(48, 26, 14, 11, c); p.odisc(42, 23, 3, '#fff'); p.odisc(54, 23, 3, '#fff'); p.px(42, 23, '#e01010').px(54, 23, '#e01010');
          p.rect(41, 30, 14, 3, '#000'); for (let x = 42; x < 55; x += 3) p.px(x, 30, '#fff');
          p.opoly([[38, 36], [58, 36], [60, 58], [36, 58]], '#7a4a1a'); p.thick(60, 40, 70, 30, '#888', 2); p.line(36, 42, 30, 50, c);
        } },
        x_zzz: { cap: 'Zzz. Somebody fell asleep reading the encyclopedia.', draw(p, S) {
          S.night(p, 5); p.disc(78, 14, 8, '#fff3b0'); p.disc(82, 11, 7, '#1a2a5a');
          p.obox(10, 44, 76, 20, '#5a3a8a'); p.obox(14, 38, 18, 8, '#fff'); p.oell(28, 40, 6, 5, '#f2c79a'); p.px(26, 40, '#000').px(30, 40, '#000');
          p.opoly([[30, 44], [70, 44], [74, 50], [26, 50]], '#2a7ad8'); p.obox(40, 30, 18, 12, '#1f3f9f'); p.rect(48, 31, 1, 10, '#fff');
          p.text(56, 16, 'Z', '#fff', 3); p.text(66, 8, 'Z', '#fff', 2); p.text(74, 3, 'Z', '#fff', 1);
        } },
      });
      const seen = new Set();
      ALL = D.articles.filter(a => a && a.id && a.t && a.x && !seen.has(a.id) && seen.add(a.id)).concat(RARE, [ZZZ]);
      BY = {}; ALL.forEach(a => { BY[a.id] = a; a.m = MEDIA[a.m] ? a.m : MEDIA_FOR[a.id]; });
      SORTED = ALL.filter(a => a.id !== 'x_zzz').sort((a, b) => a.t.replace(/^The /, '').localeCompare(b.t.replace(/^The /, ''))).concat([ZZZ]);
      renderList('');
      dataReady = true;
      if (!iraf && store.get('e_intro', 0) && !introDone && !iui.children.length) playIntro();
    }).catch(err => { if (window.console) console.warn('[carta]', err); Desk.msgbox('JackCarta 99', 'Error reading Disc 1. Blow on it and try again.', 'warn'); });
  };
})();

/* hs-ttx: TELLY-TEXT, the family telly's text service (press TEXT on the remote: js/hs-telly.js). An original teletext-style
 * service drawn on a canvas: a 40 x 25 grid, eight colours, blocky mosaic graphics (2 x 3 "sixels" a cell), double height,
 * flashing, hidden answers (REVEAL), coloured Fastext links, page numbers you key in (the header counts through the pages
 * while it "searches", like the real thing), sub-pages that turn over by themselves. Real 1999 news, sport, charts, films,
 * games and telly on their dates (js/hs-ttx-data.js); BEFUDDLED!, the quiz (p150: the server asks and checks, mods/hs.js);
 * holiday adverts, jokes, star signs, a Y2K countdown, and a couple of pages that aren't on any index.
 *   TTX.create(canvas, { onSecret, send }) -> { go(n), key(k), tick(now), page, mix, reveal, hold, draw() } */
(function () {
  'use strict';
  if (window.TTX) return;
  const D = () => window.TTXData;
  const W = 40, H = 25, CW = 16, CH = 20;
  const COL = ['#000000', '#ff2a1a', '#2aff2a', '#ffff2a', '#2a2aff', '#ff2aff', '#2affff', '#ffffff'];
  // control codes (the real ones + 0x80, so they can't be typed by accident): alpha colours, mosaic colours, and the rest
  const A = { r: '\x81', g: '\x82', y: '\x83', b: '\x84', m: '\x85', c: '\x86', w: '\x87' };
  const G = { r: '\x91', g: '\x92', y: '\x93', b: '\x94', m: '\x95', c: '\x96', w: '\x97' };
  const FLASH = '\x88', STEADY = '\x89', DBL = '\x8d', CONCEAL = '\x98', NEWBG = '\x9d', BLACKBG = '\x9c';
  const pad = (s, n) => { s = String(s); return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); };
  const vis = s => String(s).replace(/[\x80-\x9f]/g, ' '); // (for measuring)
  const center = (s, n) => { n = n || W; const v = vis(s).length; const l = Math.max(0, Math.floor((n - v) / 2)); return ' '.repeat(l) + s; };
  const clip = s => { let out = '', n = 0; for (const ch of String(s)) { if (n >= W) break; out += ch; n++; } return out; };
  function wrap(text, width) { const words = String(text).split(/\s+/); const lines = []; let l = ''; for (const w of words) { if ((l + ' ' + w).trim().length > width) { if (l) lines.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) lines.push(l); return lines; }
  // mosaic art: a picture made of '#' (on) and anything else (off), 2 pixels across and 3 down per cell -> rows of mosaic chars
  function mos(pic, col, lead) {
    const rows = []; const w = Math.max(...pic.map(r => r.length));
    for (let y = 0; y < pic.length; y += 3) {
      let s = (lead || '') + G[col || 'w'];
      for (let x = 0; x < w; x += 2) {
        const p = (dx, dy) => (pic[y + dy] || '')[x + dx] === '#' ? 1 : 0;
        const b = p(0, 0) | p(1, 0) << 1 | p(0, 1) << 2 | p(1, 1) << 3 | p(0, 2) << 4 | p(1, 2) << 6;
        s += String.fromCharCode(0x20 + (b & 0x1f) + (b & 0x40 ? 0x40 : 0));
      }
      rows.push(s);
    }
    return rows;
  }
  // a solid mosaic bar (a coloured strip, like a banner)
  const bar = (col, n) => G[col] + '\x7f'.repeat(n || 39);
  // a big title in double height on a coloured band: band colour, text colour, text
  const band = (bg, fg, text) => [A[bg] + NEWBG + DBL + A[fg] + pad(center(text, 36), 36), ''];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function t99() { let t; try { t = Desk.today99(); } catch (e) { const d = new Date(); t = { m: d.getMonth() + 1, d: d.getDate() }; } const d = t.m === 2 && t.d === 29 ? 28 : t.d; return { m: t.m, d: t.d, md: t.m * 100 + t.d, dow: new Date(1999, t.m - 1, d).getDay() }; }
  const nice = k => { const [m, d] = k.split('-').map(Number); return d + ' ' + MON[m - 1]; };

  // ================================================================ the pages
  const LOGO = mos([
    '#####.####.#....#....#...#....#####.####.#...#.#####',
    '..#...#....#....#.....#.#.......#...#.....#.#....#..',
    '..#...###..#....#......#........#...###....#.....#..',
    '..#...#....#....#......#........#...#.....#.#....#..',
    '..#...####.####.####...#........#...####.#...#...#..',
    '....................................................',
  ], 'y', ' ');
  const P = {};
  const page = (n, fn) => { P[n] = fn; };
  const foot = (r, g, y, b) => A.r + pad(r[0], 9) + A.g + pad(g[0], 9) + A.y + pad(y[0], 9) + A.c + pad(b[0], 9);
  const LINKS = (r, g, y, b) => ({ links: [r[1], g[1], y[1], b[1]], foot: foot(r, g, y, b) });
  const DEF = LINKS(['News', 101], ['Sport', 300], ['TV', 600], ['Index', 100]);
  page(100, () => {
    const t = t99();
    const rows = ['', ...LOGO, A.c + center('THE SERVICE FOR ALL THE FAMILY', 38), '',
      ...[['NEWS', 101, 'SPORT', 300], ['WEATHER', 400, 'CHARTS', 501], ['FILMS', 502, 'GAMES', 503], ['TV TIMES', 600, 'HOLIDAYS', 700], ['JOKES', 801, 'STARS', 802], ['YEAR 2000', 803, 'SUBTITLES', 888]].map(([a1, n1, a2, n2]) => A.y + a1 + A.w + '.'.repeat(13 - a1.length) + A.c + n1 + ' ' + A.y + a2 + A.w + '.'.repeat(13 - a2.length) + A.c + n2), '',
      ...band('m', 'w', 'BEFUDDLED! THE QUIZ  P150'),
      A.w + center('Ten questions a day. Beat the brain!', 38), '',
      A.g + ' TODAY: ' + A.w + DAYS[t.dow] + ' ' + t.d + ' ' + MON[t.m - 1] + ' 1999', ''];
    if (hallowOn()) rows.push(FLASH + A.y + ' NEW! ' + STEADY + A.r + 'HALLOWEEN' + A.w + '.......... ' + A.c + '450');
    return Object.assign({ rows }, LINKS(['News', 101], ['Sport', 300], ['Quiz', 150], ['TV', 600]));
  });
  // ---- news
  const newsNow = () => { const n = D().news, md = t99().md; return n.filter(x => D().md(x[0]) <= md).slice().reverse(); };
  page(101, () => {
    const L = newsNow().slice(0, 9);
    const rows = [...band('b', 'y', 'TELLY-TEXT NEWS'), A.c + ' The latest headlines', ''];
    L.forEach((x, i) => { rows.push(A.y + ' ' + (102 + i) + A.w + clip(' ' + x[1]).slice(0, 34)); rows.push(A.c + '      ' + nice(x[0])); });
    if (!L.length) rows.push(A.w + ' No news is good news.');
    return Object.assign({ rows }, LINKS(['Top story', 102], ['Sport', 300], ['Weather', 400], ['Index', 100]));
  });
  for (let i = 0; i < 9; i++) page(102 + i, () => {
    const x = newsNow()[i]; if (!x) return null;
    const rows = [...band('b', 'y', 'NEWS'), A.c + ' ' + nice(x[0]) + ' 1999', '', ...wrap(x[1], 36).map(l => DBL + A.y + ' ' + l).flatMap(l => [l, '']), ...wrap(x[2], 37).map(l => A.w + ' ' + l), '', A.c + ' More news: ' + A.y + (i < 8 ? (103 + i) : 101)];
    return Object.assign({ rows }, LINKS(['Next', i < 8 ? 103 + i : 101], ['Headlines', 101], ['Sport', 300], ['Index', 100]));
  });
  // ---- sport
  const sportNow = () => { const md = t99().md; return D().sport.filter(x => D().md(x[0]) <= md).slice().reverse(); };
  page(300, () => {
    const L = sportNow().slice(0, 6), rows = [...band('g', 'w', 'TELLY-TEXT SPORT'), ''];
    L.forEach(x => { rows.push(A.y + ' ' + x[1] + A.c + ' ' + nice(x[0])); wrap(x[2], 37).slice(0, 2).forEach(l => rows.push(A.w + ' ' + l)); });
    if (!L.length) rows.push(A.w + ' The football season rolls on...');
    rows.push(''); rows.push(A.c + ' Results ' + A.y + '301' + A.c + '   League table ' + A.y + '302');
    return Object.assign({ rows }, LINKS(['Results', 301], ['Table', 302], ['News', 101], ['Index', 100]));
  });
  page(301, () => {
    const rows = [...band('g', 'w', 'RESULTS OF 1999'), ''];
    sportNow().slice(0, 14).forEach(x => { rows.push(A.c + ' ' + pad(nice(x[0]), 7) + A.w + clip(x[2]).slice(0, 30)); });
    return Object.assign({ rows }, LINKS(['Sport', 300], ['Table', 302], ['News', 101], ['Index', 100]));
  });
  page(302, () => {
    const T = D().table, done = t99().md >= D().md(T.from);
    const rows = [...band('g', 'w', 'PREMIERSHIP'), ''];
    if (done) { rows.push(A.y + ' FINAL TABLE 1998-99' + A.w + '        Pts'); T.top.forEach((x, i) => rows.push(A.w + ' ' + (i + 1) + '. ' + pad(x[0], 24) + A.c + x[1])); rows.push(A.w + '   ...'); rows.push(''); rows.push(A.r + ' RELEGATED: ' + A.w + T.down.join(', ')); rows.push(''); rows.push(A.g + ' Man Utd: the Treble! League, FA Cup'); rows.push(A.g + ' and European Cup.'); }
    else { rows.push(A.w + ' The 1998-99 season is still going.'); rows.push(A.w + ' Man Utd and Arsenal are neck and'); rows.push(A.w + ' neck at the top. Final day: 16 May.'); }
    return Object.assign({ rows }, LINKS(['Sport', 300], ['Results', 301], ['News', 101], ['Index', 100]));
  });
  // ---- weather
  const SUN = mos(['....##....', '.#..##..#.', '..######..', '.########.', '##########', '.########.', '..######..', '.#..##..#.', '....##....'], 'y');
  const CLOUD = mos(['....####....', '..########..', '.##########.', '############', '############', '.##########.'], 'w');
  page(400, () => {
    const t = t99(), w = D().weather[t.m - 1], wet = /shower|rain|drizzle|wet|damp/i.test(w);
    const art = wet ? CLOUD : SUN;
    const rows = [...band('c', 'b', 'WEATHER'), '', ...art.map(r => '            ' + r), '', DBL + A.y + center(' TODAY: ' + DAYS[t.dow] + ' ' + t.d + ' ' + MON[t.m - 1], 36), '', ...wrap(w, 36).map(l => A.w + '  ' + l), '', A.c + '  OUTLOOK: ' + A.w + (t.m >= 5 && t.m <= 8 ? 'Staying warm.' : 'More of the same.'), t.m === 8 && t.d <= 11 ? A.y + '  ECLIPSE 11 AUG: don\'t look at the Sun!' : ''];
    return Object.assign({ rows }, DEF);
  });
  // ---- charts, films, games
  page(501, () => {
    const md = t99().md, c = D().chart.filter(x => D().md(x[0]) <= md), now = c[c.length - 1];
    const rows = [...band('m', 'w', 'THE CHARTS'), '', A.y + '  THIS WEEK\'S NUMBER ONE', ''];
    if (now) { wrap(now[2], 34).forEach(l => { rows.push(DBL + A.c + '  ' + l); rows.push(''); }); rows.push(A.w + '  by ' + now[1]); rows.push(A.g + '  (at No.1 since ' + nice(now[0]) + ')'); }
    else rows.push(A.w + '  Number one: still the Christmas hit!');
    rows.push(''); rows.push(A.y + '  EARLIER NUMBER ONES OF 1999');
    c.slice(-6, -1).reverse().forEach(x => rows.push(A.w + '  ' + clip(x[2]).slice(0, 22) + A.c + ' ' + clip(x[1]).slice(0, 12)));
    return Object.assign({ rows }, LINKS(['Films', 502], ['Games', 503], ['TV', 600], ['Index', 100]));
  });
  page(502, () => {
    const md = t99().md, f = D().films, out = f.filter(x => D().md(x[0]) <= md), soon = f.filter(x => D().md(x[0]) > md);
    const rows = [...band('r', 'y', 'AT THE PICTURES'), ''];
    if (soon[0]) { rows.push(A.y + ' COMING SOON'); soon.slice(0, 3).forEach(x => { rows.push(A.w + ' ' + clip(x[1]).slice(0, 28) + A.c + nice(x[0])); }); rows.push(''); }
    rows.push(A.y + ' OUT NOW (and recently)'); out.slice(-6).reverse().forEach(x => { rows.push(A.w + ' ' + clip(x[1]).slice(0, 37)); rows.push(A.c + '   ' + clip(x[2]).slice(0, 35)); });
    return Object.assign({ rows }, LINKS(['Charts', 501], ['Games', 503], ['TV', 600], ['Index', 100]));
  });
  page(503, () => {
    const md = t99().md, g = D().games, out = g.filter(x => D().md(x[0]) <= md), soon = g.filter(x => D().md(x[0]) > md);
    const rows = [...band('g', 'b', 'GAMES ZONE'), ''];
    rows.push(A.y + ' NEW IN THE SHOPS'); out.slice(-7).reverse().forEach(x => rows.push(A.c + ' ' + pad(x[1], 4) + A.w + clip(x[2]).slice(0, 28) + A.g + ' ' + nice(x[0]).split(' ')[1]));
    if (soon[0]) { rows.push(''); rows.push(A.y + ' COMING SOON'); soon.slice(0, 4).forEach(x => rows.push(A.c + ' ' + pad(x[1], 4) + A.w + clip(x[2]).slice(0, 28))); }
    rows.push(''); rows.push(A.m + ' CHEAT OF THE WEEK: ' + A.w + 'up up down down');
    return Object.assign({ rows }, LINKS(['Charts', 501], ['Films', 502], ['Quiz', 150], ['Index', 100]));
  });
  // ---- the telly
  const CHANS = ['BBC1', 'BBC2', 'ITV', 'C4', 'C5'];
  page(600, () => {
    const t = t99(), kind = t.dow === 6 ? 'sat' : t.dow === 0 ? 'sun' : 'week', sp = D().tv.special.filter(x => D().md(x[0]) === t.md);
    const rows = [...band('w', 'b', 'WHAT\'S ON TODAY'), A.c + ' ' + DAYS[t.dow] + ' ' + t.d + ' ' + MON[t.m - 1], ''];
    if (sp.length) { rows.push(FLASH + A.y + ' DON\'T MISS' + STEADY); sp.forEach(x => rows.push(A.w + ' ' + pad(x[1], 5) + A.c + pad(x[2], 8) + A.w + clip(x[3]).slice(0, 25))); rows.push(''); }
    CHANS.forEach((c, i) => rows.push(A.y + ' ' + pad(c, 6) + A.c + (601 + i)));
    rows.push(''); rows.push(A.w + ' Subtitles on page ' + A.y + '888');
    return Object.assign({ rows }, LINKS(['BBC1', 601], ['ITV', 603], ['C4', 604], ['Index', 100]));
  });
  CHANS.forEach((c, i) => page(601 + i, () => {
    const t = t99(), kind = t.dow === 6 ? 'sat' : t.dow === 0 ? 'sun' : 'week', L = (D().tv[kind].find(x => x[0] === c) || [c, []])[1].slice();
    if (c === 'ITV' && kind === 'week') L.push(t.md < D().md(D().tv.newsAtTenEnds) ? ['10.00', 'News at Ten'] : ['6.30', 'ITV Evening News']);
    if (c === 'BBC1' && t.dow === 5) L.push(['7.30', 'Top of the Pops']);
    if (c === 'BBC1' && t.dow === 6) L.push(['10.20', 'Match of the Day']);
    D().tv.special.filter(x => D().md(x[0]) === t.md && x[1] === c).forEach(x => L.push([x[2], x[3]]));
    const rows = [...band(['r', 'b', 'c', 'm', 'g'][i], 'w', c + ' TODAY'), A.c + ' ' + DAYS[t.dow] + ' ' + t.d + ' ' + MON[t.m - 1], ''];
    L.forEach(x => rows.push(A.y + ' ' + pad(x[0], 7) + A.w + clip(x[1]).slice(0, 30)));
    rows.push(''); rows.push(A.c + ' Times for most regions.');
    return Object.assign({ rows }, LINKS(['Next', i < 4 ? 602 + i : 601], ['All', 600], ['Charts', 501], ['Index', 100]));
  }));
  // ---- holidays (the adverts: fictional companies, fictional numbers you can ring on the landline)
  const HOL = [['MAJORCA', '7nts S/C', '149', 'Sun! Sea! Sangria for Mum and Dad!'], ['TENERIFE', '14nts H/B', '299', 'Pool with a slide. A BIG slide.'], ['FLORIDA', '14nts villa', '399', 'Theme parks! Alligators (look, don\'t touch)'], ['CORFU', '7nts B&B', '189', 'Last minute! Fly Saturday!'], ['ISLE OF WIGHT', '3nts caravan', '59', 'Ferry included. Rain not included.'], ['EURO DISNEY', '3nts + park', '219', 'Meet the mouse!']];
  page(700, () => {
    const rows = [...band('c', 'b', 'HOLIDAY BARGAINS'), A.w + ' From your local airport. Prices per', A.w + ' person. Subject to availability.', ''];
    HOL.forEach(x => { rows.push(A.y + ' ' + pad(x[0], 14) + A.c + pad(x[1], 13) + A.g + 'from £' + x[2]); rows.push(A.w + '   ' + clip(x[3]).slice(0, 35)); });
    rows.push(''); rows.push(FLASH + A.r + ' SUNSPOT TRAVEL' + STEADY + A.w + ' 01632 960700');
    return Object.assign({ rows }, LINKS(['Weather', 400], ['TV', 600], ['Jokes', 801], ['Index', 100]));
  });
  // ---- fun: jokes (the punchlines are hidden: press REVEAL), star signs, the millennium countdown
  const JOKES = [['Why did the computer go to the doctor?', 'It had a virus!'], ['What do you call a dinosaur with an extensive vocabulary?', 'A thesaurus.'], ['Why was the maths book sad?', 'It had too many problems.'], ['What do you call a fish with no eyes?', 'A fsh.'], ['How does a penguin build its house?', 'Igloos it together.'], ['Why did the cow go to space?', 'To see the moooon.'], ['What\'s orange and sounds like a parrot?', 'A carrot.'], ['Why can\'t a bicycle stand up by itself?', 'It\'s two tired.'], ['What do you call a sleeping bull?', 'A bulldozer.'], ['Why do bees hum?', 'They don\'t know the words.']];
  page(801, () => {
    const t = t99(), rows = [...band('y', 'r', 'JOKE OF THE DAY'), '', A.w + ' Press REVEAL for the punchline!', ''];
    const k = (t.md * 7) % JOKES.length;
    [JOKES[k], JOKES[(k + 3) % JOKES.length]].forEach(([q, a]) => { wrap(q, 36).forEach(l => rows.push(A.c + '  ' + l)); rows.push(A.y + CONCEAL + ' ' + a); rows.push(''); });
    return Object.assign({ rows }, LINKS(['Stars', 802], ['2000', 803], ['Quiz', 150], ['Index', 100]));
  });
  const SIGNS = ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'];
  const LUCK = ['A friend will ring you at a bad time.', 'Avoid the school dinners today.', 'You will find 20p down the sofa.', 'A games magazine holds the answer.', 'Someone is about to tape over your favourite programme.', 'Beware of little sisters.', 'Your homework will NOT do itself.', 'Lucky number: 64.', 'The phone bill is coming. Hide.', 'A surprise in the post. Probably a catalogue.', 'Today is a good day for cheat codes.', 'Wear your lucky socks.'];
  page(802, () => {
    const t = t99(), rows = [...band('m', 'y', 'YOUR STARS'), A.c + ' with Mystic Maureen', ''];
    SIGNS.forEach((s, i) => rows.push(A.y + ' ' + pad(s, 12) + A.w + clip(LUCK[(i + t.md) % LUCK.length]).slice(0, 25)));
    return Object.assign({ rows }, LINKS(['Jokes', 801], ['2000', 803], ['Quiz', 150], ['Index', 100]));
  });
  page(803, () => {
    const t = t99(), dl = Math.round((new Date(2000, 0, 1) - new Date(1999, t.m - 1, t.d)) / 864e5);
    const big = String(dl);
    const rows = [...band('b', 'w', 'THE MILLENNIUM'), '', A.y + center('DAYS TO GO UNTIL 2000:', 38), '', DBL + A.c + center(big, 36), '', '', A.w + ' Will the computers cope? The', A.w + ' "Millennium Bug" (Y2K) could confuse', A.w + ' old computers that store years as', A.w + ' just two numbers: 99 then... 00!', '', A.g + ' TOP TIP: ' + A.w + 'check your video recorder', A.w + ' (it still says 12:00 anyway).'];
    return Object.assign({ rows }, LINKS(['Jokes', 801], ['Stars', 802], ['News', 101], ['Index', 100]));
  });
  // ---- HALLOWEEN (only while the event is on: js/season-cat.js, the owner's 1999 clock too)
  const hallowOn = () => { try { if (window.Season) return Season.active().some(x => x.e.id === 'halloween99'); } catch (e) {} const md = t99().md; return md >= 1024 && md <= 1101; };
  const PUMPKIN = mos(['.....##.....', '..########..', '.##########.', '##.##..##.##', '############', '###.####.###', '.###....###.', '..########..'], 'y');
  page(450, () => {
    if (!hallowOn()) return null;
    const t = t99(), rows = [...band('r', 'y', 'HALLOWEEN ON TELLY-TEXT'), ...PUMPKIN.map(r => '              ' + r), ''];
    rows.push(A.y + ' SPOOKY FACTS');
    ['Halloween grew out of an old autumn festival marking the end of the harvest.', 'In Britain, lanterns used to be carved from turnips and swedes, not pumpkins.'].forEach(f => wrap(f, 36).forEach(l => rows.push(A.w + '  ' + l)));
    rows.push('', A.c + ' CLOCKS GO BACK: ' + A.w + (t.md < 1031 ? 'Sun 31 Oct, 2am' : 'last night!'), A.w + '  An extra hour in bed! It gets dark', A.w + '  by about half past four now.', '');
    rows.push(A.g + ' JOKE: ' + A.w + "What do you call a ghost's", A.w + '  mum and dad? ' + CONCEAL + A.y + 'TRANSPARENTS!', A.m + ' Press REVEAL for the answer.');
    return Object.assign({ rows }, LINKS(['Soup', 451], ['TV', 600], ['Jokes', 801], ['Index', 100]));
  });
  page(451, () => {
    if (!hallowOn()) return null;
    const rows = [...band('y', 'r', "MOM'S PUMPKIN SOUP"), '', A.c + ' Do not waste the scooped-out bits!', ''];
    ['1. Scoop the pumpkin flesh (not the stringy bits) into a pan with an onion and a potato.', '2. Cover with stock. Simmer for 20 minutes (a grown-up does the hob).', '3. Mash it or whizz it till smooth. A drop of milk.', '4. Seeds: rinse, pat dry, a pinch of salt, roast on a tray. Crunchy!'].forEach(f => { wrap(f, 36).forEach(l => rows.push(A.w + ' ' + l)); rows.push(''); });
    return Object.assign({ rows }, LINKS(['Halloween', 450], ['TV', 600], ['News', 101], ['Index', 100]));
  });
  // ---- the hidden pages (not on any index)
  page(199, () => ({ hidden: true, rows: [...band('r', 'w', 'ENGINEERING TEST PAGE'), '', ...[...'RGYBMCW'].map((c, i) => G['rgybmcw'[i]] + '\x7f'.repeat(38)), '', A.w + ' If you can read this, you have found', A.w + ' the TELLY-TEXT engineers\' page. It', A.w + ' is not on any index. Well done!', '', A.c + ' Secret word for the night shift:', A.y + CONCEAL + ' "WOBBLE"  (press REVEAL)', '', A.g + ' Please do not tell the producer.'], ...DEF }));
  page(777, () => ({ hidden: true, rows: [...band('y', 'r', 'LUCKY SEVENS'), '', ...mos(['#####.#####.#####', '....#.....#.....#', '...#.....#.....#.', '..#.....#.....#..', '.#.....#.....#...', '.#.....#.....#...'], 'y', '          '), '', A.w + ' You keyed in 777. Nothing happens.', A.w + ' ...', FLASH + A.g + ' JACKPOT!' + STEADY + A.w + ' (of nothing). Lucky you!'], ...DEF }));

  // ---- BEFUDDLED! the quiz (the server holds the questions and the answers: mods/hs.js)
  const HOST = mos(['..######..', '.#......#.', '#..#..#..#', '#........#', '#..####..#', '.#......#.', '..######..', '....##....', '..######..'], 'g');
  const quiz = { i: -1, q: null, res: null, score: 0, wait: false, err: '' };
  page(150, (T) => {
    const rows = [...band('m', 'w', 'BEFUDDLED!'), A.y + center('The quiz that frazzles your brain', 38), ''];
    if (!window.Net || !Net.send) { rows.push(A.w + ' BEFUDDLED! needs JackNet. Try later.'); return Object.assign({ rows }, DEF); }
    if (quiz.i < 0) {
      rows.push(...HOST.map(r => '              ' + r), '', A.w + ' Hello! I\'m PROFESSOR PUZZLEBOT. Ten', A.w + ' questions a day. Answer with the', A.w + ' coloured buttons:' + A.r + 'RED' + A.g + 'GREEN' + A.y + 'YELLOW' + A.c + 'BLUE', '', FLASH + A.y + center('PRESS RED TO PLAY', 38) + STEADY);
      return { rows, foot: A.r + 'Play     ' + A.g + '         ' + A.y + '         ' + A.c + 'Index    ', keys: { r: () => { quiz.i = 0; quiz.score = 0; ask(T); } }, links: [null, null, null, 100] };
    }
    if (quiz.wait || !quiz.q) { rows.push('', A.w + center('Asking the Professor...', 38)); if (quiz.err) rows.push(A.r + ' ' + quiz.err); return { rows, foot: A.c + '                           Index    ', links: [null, null, null, 100] }; }
    const q = quiz.q;
    rows.push(A.c + ' QUESTION ' + (quiz.i + 1) + ' OF ' + q.n + A.w + '      SCORE ' + quiz.score, '');
    wrap(q.q, 37).forEach(l => rows.push(A.w + ' ' + l)); rows.push('');
    const C = ['r', 'g', 'y', 'c'];
    q.o.forEach((o, k) => { const mark = quiz.res ? (k === quiz.res.right ? A.g + ' <- RIGHT' : k === quiz.res.a && !quiz.res.ok ? A.r + ' <- YOU' : '') : ''; rows.push(A[C[k]] + NEWBG + A.w + ' ' + 'ABCD'[k] + ' ' + BLACKBG + A.w + ' ' + clip(o).slice(0, 26) + mark); rows.push(''); });
    if (quiz.res) {
      rows.push(quiz.res.ok ? FLASH + A.g + '  CORRECT! ' + STEADY + A.w + (quiz.res.amt ? '+' + quiz.res.amt + ' Rupees' : '') : A.r + '  WRONG! ' + A.w + 'Bad luck.');
      if (quiz.i >= q.n - 1) rows.push(A.y + '  FINAL SCORE: ' + quiz.score + '/' + q.n + '  ' + (quiz.score === q.n ? 'GENIUS!' : quiz.score >= 7 ? 'BRAINY!' : quiz.score >= 4 ? 'NOT BAD!' : 'BEFUDDLED!'));
      else rows.push(A.c + '  Press any colour for the next one');
      return { rows, foot: A.r + 'Next     ' + A.g + 'Next     ' + A.y + 'Next     ' + A.c + 'Next     ', keys: { r: () => next(T), g: () => next(T), y: () => next(T), c: () => next(T) }, links: [null, null, null, null] };
    }
    return { rows, foot: A.r + 'A        ' + A.g + 'B        ' + A.y + 'C        ' + A.c + 'D        ', keys: { r: () => answer(T, 0), g: () => answer(T, 1), y: () => answer(T, 2), c: () => answer(T, 3) }, links: [null, null, null, null] };
  });
  function ask(T) { quiz.wait = true; quiz.res = null; quiz.err = ''; T.build(); try { Net.send({ t: 'hsQ', i: quiz.i }); } catch (e) { quiz.err = 'No connection.'; } setTimeout(() => { if (quiz.wait) { quiz.err = 'The Professor is thinking... (no answer from JackNet)'; T.build(); } }, 4000); }
  function answer(T, a) { if (!quiz.q || quiz.res || quiz.wait) return; quiz.wait = true; quiz.pend = a; try { Net.send({ t: 'hsA', i: quiz.i, a }); } catch (e) {} T.build(); }
  function next(T) { if (quiz.i >= (quiz.q ? quiz.q.n : 10) - 1) { quiz.i = -1; quiz.q = null; quiz.res = null; return T.build(); } quiz.i++; ask(T); }
  let netHooked = false, cur = null;
  function hookNet() {
    if (netHooked || !window.Net) return; netHooked = true;
    Net.on('hsQ', m => { if (m.i !== quiz.i) return; quiz.q = m; quiz.wait = false; if (m.prev) { quiz.res = { ok: m.prev.ok, right: m.prev.right, a: m.prev.a, amt: 0 }; } if (cur && cur.page === 150) cur.build(); });
    Net.on('hsA', m => { if (m.i !== quiz.i) return; quiz.wait = false; quiz.res = { ok: m.ok, right: m.right, a: quiz.pend, amt: m.amt }; quiz.score = m.score; if (m.all && cur && cur.opts.onSecret) cur.opts.onSecret('hs.bamboozle'); if (cur && cur.page === 150) cur.build(); });
  }

  // ================================================================ the renderer
  function create(cv, opts) {
    opts = opts || {};
    cv.width = W * CW; cv.height = H * CH;
    const g = cv.getContext('2d');
    const T = { page: 100, want: 0, typed: '', search: 0, sub: 0, mix: false, reveal: false, hold: false, opts, flashOn: true, rows: null, def: null, hidden: false };
    cur = T; hookNet();
    T.go = function (n) { n = +n; T.want = n; T.search = performance.now() + 400 + Math.random() * 900; T.typed = ''; T.reveal = false; T.draw(); };
    T.key = function (k) {
      if (/^[0-9]$/.test(k)) { if (T.typed.length >= 3) T.typed = ''; if (!T.typed && k === '0') return; T.typed += k; if (T.typed.length === 3) { const n = +T.typed; if (n >= 100 && n <= 899) T.go(n); else T.typed = ''; } T.draw(); return; }
      const ci = { r: 0, g: 1, y: 2, c: 3 }[k];
      if (ci != null) { if (T.def && T.def.keys && T.def.keys[k]) { T.def.keys[k](); return; } const l = T.def && T.def.links && T.def.links[ci]; if (l) T.go(l); return; }
      if (k === 'reveal') { T.reveal = !T.reveal; T.draw(); }
      if (k === 'hold') { T.hold = !T.hold; T.draw(); }
      if (k === 'mix') { T.mix = !T.mix; T.draw(); }
      if (k === 'index') T.go(100);
    };
    T.tick = function (now) {
      if (T.search && now >= T.search) { T.search = 0; T.page = T.want; T.sub = 0; T.build(); }
      const fl = Math.floor(now / 500) % 2 === 0; if (fl !== T.flashOn) { T.flashOn = fl; T.dirty = true; }
      if (T.search || T.dirty || Math.floor(now / 1000) !== T.sec) { T.sec = Math.floor(now / 1000); T.dirty = false; T.draw(now); return true; }
      return false;
    };
    T.build = function () {
      const fn = P[T.page];
      let p = fn ? fn(T) : null;
      if (!p) p = { rows: [...band('r', 'w', 'PAGE NOT AVAILABLE'), '', A.w + ' Page ' + T.page + ' is not in this', A.w + ' service at the moment.', '', A.c + ' Try the index on page ' + A.y + '100'], ...DEF };
      T.def = p; T.hidden = !!p.hidden;
      if (p.hidden && opts.onSecret) opts.onSecret('hs.ttx.hidden');
      if (T.page === 100 && opts.onSecret) opts.onSecret('hs.ttx');
      T.draw();
    };
    T.draw = function (now) {
      now = now || performance.now();
      if (!T.def) T.build();
      g.clearRect(0, 0, cv.width, cv.height);
      if (!T.mix) { g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height); }
      // the header: the page you asked for (or what you've typed), the service name, the date, the clock
      const d = window.OwnerTools?.now() || new Date(), t = t99();
      const shown = T.search ? (100 + Math.floor(now / 37) % 800) : T.page;
      const pn = T.typed ? 'P' + (T.typed + '---').slice(0, 3) : 'P' + (T.search ? T.want : T.page);
      const hdr = A.w + pad(pn, 5) + A.y + 'TELLY-TEXT ' + A.w + shown + ' ' + DAYS[t.dow] + String(t.d).padStart(2, '0') + MON[t.m - 1] + A.y + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
      row(0, hdr);
      if (!T.search || true) { const rows = T.def.rows || []; for (let r = 1; r < 24; r++) { if (row.skip === r) { row.skip = 0; continue; } row(r, rows[r - 1] || ''); } }
      row(24, (T.def && T.def.foot) || DEF.foot);
      if (T.hold) { g.fillStyle = '#ffff2a'; g.font = '700 14px Arial,sans-serif'; g.fillText('HOLD', cv.width - 52, cv.height - 26); }
    };
    // one row of 40 cells, with its control codes
    function row(r, s) {
      let fg = 7, bg = 0, gr = false, dh = false, flash = false, conceal = false, x = 0, dhRow = false;
      for (const ch of String(s)) { if (ch.charCodeAt(0) === 0x8d) dhRow = true; }
      const chars = [...String(s)];
      for (let i = 0; i < W; i++) {
        const ch = chars[i] || ' ', c = ch.charCodeAt(0);
        let draw = ch;
        if (c >= 0x80 && c <= 0x9f) {
          const k = c - 0x80;
          if (k >= 1 && k <= 7) { fg = k; gr = false; conceal = false; }
          else if (k >= 0x11 && k <= 0x17) { fg = k - 0x10; gr = true; conceal = false; }
          else if (k === 0x08) flash = true; else if (k === 0x09) flash = false;
          else if (k === 0x0d) dh = true; else if (k === 0x0c) dh = false;
          else if (k === 0x18) conceal = true;
          else if (k === 0x1d) bg = fg; else if (k === 0x1c) bg = 0;
          draw = ' ';
        }
        const px = i * CW, py = r * CH, hh = dhRow ? CH * 2 : CH;
        if (bg || !T.mix) { g.fillStyle = COL[bg]; g.fillRect(px, py, CW, hh); }
        if (draw === ' ' || (flash && !T.flashOn) || (conceal && !T.reveal)) continue;
        const cc = draw.charCodeAt(0);
        g.fillStyle = COL[fg];
        if (gr && ((cc >= 0x20 && cc < 0x40) || (cc >= 0x60 && cc < 0x80))) { // mosaic: 2 x 3 blocks
          const b = (cc - 0x20) & 0x1f | ((cc - 0x20) & 0x40 ? 0x20 : 0), bw = CW / 2, bh = hh / 3;
          const bits = [1, 2, 4, 8, 16, 32]; bits.forEach((bt, k) => { if (b & bt) g.fillRect(px + (k % 2) * bw, py + Math.floor(k / 2) * bh, Math.ceil(bw), Math.ceil(bh)); });
        } else {
          g.save(); g.translate(px, py); if (dhRow && dh) g.scale(1, 2);
          g.font = '700 17px "Lucida Console","Courier New",monospace'; g.textBaseline = 'top'; g.textAlign = 'left';
          if (T.mix && !bg) { g.fillStyle = '#000'; g.fillText(draw, 1.5, 2.5); g.fillStyle = COL[fg]; }
          g.fillText(draw, 1, 1.5);
          g.restore();
        }
      }
      if (dhRow) row.skip = r + 1;
    }
    T.build();
    return T;
  }
  // a phone number on the adverts: ringing it on the landline (js/hs-life.js asks)
  function phoneLine(n) {
    if (n === '01632960700') return ['Sunspot Travel', 'Recorded message: "All our holiday advisers are busy. Your call is important to us. Please hold." (Greensleeves plays. Forever.)'];
    if (n === '01632960150') return ['BEFUDDLED! hotline', '"Thank you for calling the BEFUDDLED! hotline. Calls cost 50p a minute. Please ask the bill payer\'s permission." You put the phone down VERY fast.'];
    return null;
  }
  window.TTX = { create, P, mos, A, G, phoneLine };
})();

/* seasons-art: the pixel art for the seasons (lazy, loaded by seasons-web.js). Every picture is drawn here as a little
 * character map, like a GIF made in a paint program in 1999, and turned into crisp SVG: SeasonsArt.sheet(name) gives a
 * horizontal "film strip" of the animation frames (a data: URL) that CSS steps through, like an animated GIF.
 * Also: the masthead scenery for the magazine, the FunCursor trail pictures and the Haunted Hill screen saver. All original. */
(function () {
  'use strict';
  if (window.SeasonsArt) return;

  // ---- one palette for everything (a 1999 "web safe"-ish set, plus a few in-betweens)
  const P = {
    k: '#000000', K: '#1a1024', d: '#4a4a52', S: '#808088', s: '#c0c0c8', W: '#dcdce8', w: '#ffffff',
    o: '#ff7a00', O: '#c84800', n: '#6a2400', y: '#ffd400', Y: '#fff27a', f: '#ffa800',
    r: '#e10600', R: '#8a0000', p: '#ff6ab8', q: '#ffb8d8', P: '#c0005a',
    g: '#3a9a1a', G: '#1a5a0a', l: '#8ad03a', b: '#2a6ad8', B: '#0a2a8a', c: '#7ae8ff', C: '#2ab8e8',
    v: '#9a5ad8', V: '#4a1a8a', t: '#d8a868', T: '#8a5a2a', u: '#5a3410', e: '#ffe0b0', m: '#e8c070',
  };

  // ---- map -> SVG: one <path> per colour, runs of the same character become one rectangle
  function svgOf(frames, pal, gap) {
    const h = frames[0].length, w = Math.max(...frames[0].map(r => r.length)), W = frames.length * w;
    const by = {};
    frames.forEach((rows, fi) => rows.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const ch = row[x]; let n = 1; while (x + n < row.length && row[x + n] === ch) n++;
        const col = pal[ch] || P[ch];
        if (ch !== '.' && ch !== ' ' && col) (by[col] = by[col] || []).push(`M${fi * w + x} ${y}h${n}v1h-${n}z`);
        x += n;
      }
    }));
    const body = Object.entries(by).map(([col, d]) => `<path fill="${col}" d="${d.join('')}"/>`).join('');
    return { w, h, n: frames.length, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" shape-rendering="crispEdges">${body}</svg>` };
  }
  const url = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  // ================================================================ the sprites ('.' = see-through)
  const S = {};
  // ---- Halloween
  const PUMP = F => [
    '.......G.......',
    '......Gg.......',
    '...nnnnnnnnn...',
    '.nnoooOoOooonn.',
    'noooOoooooOooon',
    'nooFOoooooOFoon',
    'noFFFoooooFFFon',
    'nooooOoFoOoooon',
    'noFooOoooOooFon',
    'nooFFoFFFoFFoon',
    'nooooFFFFFoooon',
    '.nnoooOoOooonn.',
    '...nnnnnnnnn...',
  ].map(r => r.replace(/F/g, F));
  S.pumpkin = { f: [PUMP('y'), PUMP('Y'), PUMP('f')] };
  S.pumpkinS = { f: [PUMP('y')] };
  S.bat = { f: [[
    'K..............K',
    'KK....K..K....KK',
    'KKK...KKKK...KKK',
    'KKKKK.KrrK.KKKKK',
    '.KKKKKKKKKKKKKK.',
    '..K.K.KKKK.K.K..',
    '.......KK.......',
  ], [
    '................',
    '......K..K......',
    '......KKKK......',
    '...KKKKrrKKKK...',
    '.KKKKKKKKKKKKKK.',
    'KKKK.KKKKKK.KKKK',
    'KK.....KK.....KK',
  ]] };
  const GH = (a, b) => [
    '.....SSSS.....',
    '...SSwwwwSS...',
    '..SwwwwwwwwS..',
    '.SwwwwwwwwwwS.',
    '.SwwkkwwkkwwS.',
    'SwwwkkwwkkwwwS',
    'SwwwwwwwwwwwwS',
    'SwwwwwkkwwwwwS',
    'SwwwwwkkwwwwwS',
    'SwwwwwwwwwwwwS',
    'SWwwwwwwwwwwWS',
    'SWWwwwwwwwwWWS',
    a, b,
  ];
  S.ghost = { f: [GH('SWWWSWWWWSWWWS', '.SS..SSSS..SS.'), GH('SWWSWWWWSWWWWS', '.SSS.SSS..SSS.')] };
  S.spider = { f: [[
    '.k.....k.',
    '..k...k..',
    'k..kkk..k',
    '.kkkkkkk.',
    '..krkrk..',
    '.kkkkkkk.',
    'k..k.k..k',
    '..k...k..',
  ]] };
  S.witchhat = { f: [[
    '.............Vk.....',
    '............VVk.....',
    '...........VvVk.....',
    '..........VvvVk.....',
    '.........VvvvVk.....',
    '........VvvvvVk.....',
    '.......VvvvvvVk.....',
    '......VoooooooVk....',
    '......VooyyyooVk....',
    '.....VvoyVVyovVk....',
    '.....VvvyyyyvvvVk...',
    'kVVVVVVVVVVVVVVVVVVk',
    '.kkkkkkkkkkkkkkkkkk.',
  ]] };
  S.cauldron = { f: [[
    '....l..l.....',
    '..l.lll.l....',
    '.llllllllll..',
    'kkkkkkkkkkkkk',
    '.kdddddddddk.',
    'kdddsddddddk.',
    'kddsdddddddk.',
    'kdddddddddkk.',
    '.kdddddddkk..',
    '..kkkkkkkk...',
    '..k.....k....',
  ]] };
  S.cobweb = { f: [[
    'SSSSSSSSSSSSSSSSSSSSSSSS',
    '.S.....S......S.......SS',
    '..S.....S.....S.....SS.S',
    '...S.....SSSSSSSSSSS...S',
    '....S.SSS.....S...S....S',
    '.....S...S....S..S....SS',
    '......SSSSS...S.S...SS.S',
    '.......S...SSSSS..SS...S',
    '........S....SS.SS.....S',
    '.........S...SSSSSSSSSSS',
    '..........S..S.S......SS',
    '...........S.S..S...SS.S',
    '............SS...SSS...S',
    '.............S...S.....S',
    '..............S..S....SS',
    '...............S.S..SS.S',
    '................SS.S...S',
    '.................SS....S',
    '..................S..SSS',
    '...................S...S',
    '....................S..S',
    '.....................S.S',
    '......................SS',
    '.......................S',
  ]] };
  S.grave = { f: [[
    '...SSSSSS...',
    '..SsssssdS..',
    '.SsssssssdS.',
    '.SssRIPssdS.'.replace('RIP', 'kkk'),
    '.SsssssssdS.',
    '.SsskssssdS.',
    '.SskkksssdS.',
    '.SsskssssdS.',
    '.SsssssssdS.',
    'gGgggGgggGgg',
  ]] };
  // ---- Bonfire Night
  const FIRE = (a, b, c) => [
    a,
    b,
    c,
    '....oyo.yo.oyo..',
    '...ooyyoyyooyoo.',
    '..ooyyYyyYyyyoo.',
    '..ooyYYYYYYyyoo.',
    '...oyYwYYwYYyo..',
    '..TuoyYYYYYyoTu.',
    '.TuTTuoyyyouTTu.',
    'TuuTTuuTTuuTTuuT',
    '.uTTuuTTuuTTuu..',
  ];
  S.bonfire = { f: [
    FIRE('.......o........', '......oo..o.....', '...o..oyo.oo..o.'),
    FIRE('........o.......', '...o...oy.......', '...oo.oyo..o.o..'),
    FIRE('......o.....o...', '......oo....oo..', '..o..oyoo.oyo...'),
  ] };
  S.rocket = { f: [[
    '..r..',
    '.rrr.',
    '.rwr.',
    '.rrr.',
    '.bbb.',
    '.bbb.',
    '.rrr.',
    '.rrr.',
    '..T..',
    '..T..',
    '..T..',
    '..T..',
    '..T..',
  ]] };
  // a firework: four frames of a bursting shell, worked out on a pixel grid (one per colour)
  function burst(col, col2) {
    const N = 15, c = 7, frames = [];
    [[0, 1.2], [2.6, 3.6], [4.6, 6], [5.6, 7.2]].forEach(([r0, r1], fi) => {
      const g = Array.from({ length: N }, () => Array(N).fill('.'));
      const put = (x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = ch; };
      if (fi === 0) { put(c, c, 'w'); put(c, c - 1, '1'); put(c, c + 1, '1'); put(c - 1, c, '1'); put(c + 1, c, '1'); }
      else for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6 + (fi === 3 ? 0.12 : 0);
        for (let r = r0; r <= r1; r += 0.9) put(c + Math.cos(a) * r, c + Math.sin(a) * r + (fi === 3 ? 0.8 : 0), r >= r1 - 0.5 ? (fi === 3 ? '2' : 'w') : '1');
      }
      frames.push(g.map(r => r.join('')));
    });
    return { f: frames, pal: { 1: col, 2: col2 || col } };
  }
  S.fwPink = burst('#ff4aff', '#a02aa0');
  S.fwGold = burst('#ffd400', '#c08000');
  S.fwCyan = burst('#3affff', '#1a8aa0');
  S.fwGreen = burst('#5aff5a', '#1a8a1a');
  S.sparkler = { f: [[
    '..y.w..',
    'w..y..y',
    '.yywyy.',
    'y.wYw.w',
    '.yywyy.',
    'w..y..y',
    '..y.Sw.',
    '....S..',
    '.....S.',
    '......S',
  ], [
    'w..y...',
    '..yw.y.',
    'y.yYy..',
    '.wwYwwy',
    '..yYy.w',
    '.y.w...',
    'w..ySw.',
    '....S..',
    '.....S.',
    '......S',
  ]] };
  // ---- Christmas
  S.snowflake = { f: [[
    '...w...',
    '.w.w.w.',
    '..www..',
    'wwwcwww',
    '..www..',
    '.w.w.w.',
    '...w...',
  ]] };
  S.holly = { f: [[
    '.G............G.',
    'GgG..........GgG',
    '.GggG......GggG.',
    'GgggggG..GgggggG',
    '.GgllgGrrGglggG.',
    'GgggGGrwrrGGgggG',
    '.GGG..rrRrr.GGG.',
    '.......rrR......',
  ]] };
  S.santahat = { f: [[
    '.......rrrr.........',
    '.....rrrrrrrr.......',
    '....rrrrrrrrRr......',
    '...rrrrrrrrrrRr.....',
    '...rrrrrrrrrrRRr....',
    '..rrrrrrrrrrrrRRr.ww',
    '..rrrrrrrrrrrrrRRwww',
    '.rrrrrrrrrrrrrr.wwWw',
    '.rrrrrrrrrrrrrr..ww.',
    'wwwwwwwwwwwwwwwww...',
    'wWwwWwwwWwwwWwwWw...',
    'wwwwwwwwwwwwwwwww...',
  ]] };
  S.tree = { f: [[
    '......y......',
    '.....yYy.....',
    '......y......',
    '.....GgG.....',
    '....GgrgG....',
    '...GgggggG...',
    '.....GgG.....',
    '....GgggG....',
    '...GgygggG...',
    '..GgggggbgG..',
    '....GgggG....',
    '...GgggrggG..',
    '..GgbgggggG..',
    '.GggggggyggG.',
    '.....TTT.....',
    '....uTTTu....',
  ], [
    '......y......',
    '.....yYy.....',
    '......y......',
    '.....GgG.....',
    '....GgygG....',
    '...GgggggG...',
    '.....GgG.....',
    '....GgggG....',
    '...GgrgggG...',
    '..GgggggyG...',
    '....GgggG....',
    '...GgggbggG..',
    '..GgrgggggG..',
    '.GggggggrggG.',
    '.....TTT.....',
    '....uTTTu....',
  ]] };
  S.present = { f: [[
    '...yy..yy...',
    '..y..yy..y..',
    '...yyyyyy...',
    'rrrrryyrrrrr',
    'rRrrryyrrrRr',
    'yyyyyyyyyyyy',
    'rrrrryyrrrrr',
    'rrrrryyrrrrr',
    'rRrrryyrrrRr',
    'rrrrryyrrrrr',
    'RRRRRyyRRRRR',
  ]] };
  S.snowman = { f: [[
    '....kkkkk.....',
    '....kkkkk.....',
    '...kkkkkkk....',
    '....wwwww.....',
    '...wwkwkww....',
    '...wwwowww....',
    '...wwkkkWw....',
    '....rrrrrr....',
    '..wwwwrwwwww..',
    '.wwwwwrwkwwwW.',
    '.wwwwwwwwwwwW.',
    '.wwwwwwwkwwwW.',
    '..wwwwwwwwWW..',
    '.wwwwwwwwwwwW.',
    'wwwwwwwkwwwwWW',
    'wwwwwwwwwwwwWW',
    '.WwwwwwwwwwWW.',
    '..WWWWWWWWWW..',
  ]] };
  S.stocking = { f: [[
    'wwwwwww...',
    'wWwwWww...',
    '.rrrrr....',
    '.rRrrr....',
    '.rrrrr....',
    '.rrrRr....',
    '.rrrrr....',
    '.rrrrrrr..',
    '.rrrrrrrrr',
    '.wwrrrrRrr',
    '..wwrrrrr.',
  ]] };
  // ---- New Year and the Millennium
  S.partyhat = { f: [[
    '.....yy.....',
    '....yYYy....',
    '.....yy.....',
    '.....bb.....',
    '....bppb....',
    '....pbbp....',
    '...bbppbb...',
    '...ppbbpp...',
    '..bbppbbpb..',
    '..ppbbppbp..',
    '.bbppbbppbb.',
    'yyyyyyyyyyyy',
  ]] };
  S.clock = { f: [[
    '....kkkkk....',
    '..kkyyyyykk..',
    '.kyywwkwwyyk.',
    '.kywwwkwwwyk.',
    'kywkwwkwwwkyk',
    'kywwwwkwwwwyk',
    'kykwwwkwwwkyk',
    'kywwwwwwwwwyk',
    'kywkwwwwwwkyk',
    '.kywwwwwwwyk.',
    '.kyywwkwwyyk.',
    '..kkyyyyykk..',
    '....kkkkk....',
  ]] };
  S.confetti = { f: [[
    'r...........b.....',
    '.......y..........',
    '...c.........p....',
    '...........l......',
    '.p......r.........',
    '..............y...',
    '......b...........',
    '.l..........c.....',
  ]] };
  S.bug = { f: [[
    '..k.....k..',
    '...k...k...',
    '....kkk....',
    '.k.kgggk.k.',
    '..kgykyggk.',
    '.kggggggk..',
    'k.kggggggk.',
    '..kgggggk.k',
    '.k.kgggk.k.',
    '....kkk....',
  ], [
    '...k...k...',
    '...k...k...',
    '....kkk....',
    'k..kgggk..k',
    '.kkgykyggkk',
    '..kggggggk.',
    '.kkggggggkk',
    'k.kgggggk..',
    '...kgggk..k',
    '....kkk....',
  ]] };
  // ---- Valentine's
  S.heart = { f: [[
    '.RR...RR.',
    'RrrR.RrrR',
    'RrwrRrrrR',
    'RrrrrrrrR',
    '.RrrrrrR.',
    '..RrrrR..',
    '...RrR...',
    '....R....',
  ]] };
  S.heartP = { f: [S.heart.f[0].map(r => r.replace(/r/g, 'p').replace(/R/g, 'P'))] };
  S.arrowheart = { f: [[
    'T..............w',
    '.T..RR...RR...w.',
    '..TRrrR.RrrR.w..',
    '...TwrrRrrrRw...',
    '...RTrrrrrrwR...',
    '....RrTrrrwR....',
    '.....RrrTwR.....',
    '......RrrR......',
    '.......RR.......',
    '................',
  ]] };
  // ---- Easter
  const EGG = (a, b, c) => [
    '...SS...',
    '..S' + a + a + 'S..',
    '.S' + a + a + a + a + 'S.',
    '.S' + b + b + b + b + 'S.',
    'S' + b + c + b + b + c + b + 'S',
    'S' + a + a + a + a + a + a + 'S',
    'S' + c + c + c + c + c + c + 'S',
    'S' + a + a + a + a + a + a + 'S',
    '.S' + a + a + a + a + 'S.',
    '..SSSS..',
  ];
  S.eggA = { f: [EGG('c', 'p', 'y')] };
  S.eggB = { f: [EGG('y', 'v', 'w')] };
  S.eggC = { f: [EGG('l', 'b', 'y')] };
  S.chick = { f: [[
    '....ffff....',
    '...fyyyyf...',
    '..fyykyyyf..',
    '..fyyyyyyoo.',
    '..fyyyyyf...',
    '.fyyyyyyyf..',
    'fyyyfyyyyyf.',
    'fyyyffyyyyf.',
    '.fyyyyyyyf..',
    '..fffffff...',
    '...o...o....',
  ], [
    '............',
    '....ffff....',
    '...fyyyyf...',
    '..fyykyyyf..',
    '..fyyyyyyoo.',
    '.fyyyyyyyf..',
    'fyyyyfyyyyf.',
    'fyyyffyyyyf.',
    '.fyyyyyyyf..',
    '..fffffff...',
    '..o.....o...',
  ]] };
  S.bunnyears = { f: [[
    '.ss.......ss.',
    'swws.....swws',
    'swqws...swqws',
    'swqws...swqws',
    'swqws...swqws',
    'swqws...swqws',
    'swqws...swqws',
    '.swqws.swqws.',
    '.swwws.swwws.',
    '..swws.swws..',
  ]] };
  S.daffodil = { f: [[
    '...yYy...',
    '..yYYYy..',
    '.yYoooYy.',
    '.yYoooYy.',
    '..yYYYy..',
    '...yYy...',
    '....g....',
    '..g.g....',
    '...gg....',
    '....g....',
  ]] };
  // ---- summer and the eclipse
  S.sun = { f: [[
    '.......y.......',
    '..y....y....y..',
    '...y..yyy..y...',
    '.....yyyyy.....',
    '....yyyyyyy....',
    '...yyyyyyyyy...',
    'yyyykkkykkkyyyy',
    '...ykkkkkkky...',
    '....yykyykyy...',
    '...yyyyyyyyy...',
    '....yyrrryy....',
    '.....yyyyy.....',
    '...y..yyy..y...',
    '..y....y....y..',
    '.......y.......',
  ]] };
  S.lolly = { f: [[
    '.rrrr.',
    'rrrrrr',
    'rrrrrr',
    'oooooo',
    'oooooo',
    'yyyyyy',
    'yyyyyy',
    'yyyyyy',
    '.yyyy.',
    '..tt..',
    '..tt..',
    '..tt..',
  ]] };
  S.beachball = { f: [[
    '...kkkk...',
    '..krrwbk..',
    '.krrrwbbk.',
    'krrrrwbbbk',
    'kyyywwwbbk',
    'kyyywwwggk',
    'kyyyywgggk',
    '.kyyywggk.',
    '..kyywgk..',
    '...kkkk...',
  ]] };
  S.bucket = { f: [[
    '..k......k..',
    '.k........k.',
    'kbbbbbbbbbbk',
    'kbcbbbbbbbbk',
    '.kbbbbbbbbk.',
    '.kbcbbbbbbk.',
    '.kbbbbbbbbk.',
    '..kbbbbbbk..',
    '..kkkkkkkk..',
  ]] };
  function eclipse() { // a black Moon over the Sun, the corona round it (a pixel ring with uneven streamers)
    const N = 25, c = 12, rows = [];
    for (let y = 0; y < N; y++) {
      let row = '';
      for (let x = 0; x < N; x++) {
        const dx = x - c, dy = y - c, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        const ray = 9.6 + 2.4 * Math.abs(Math.sin(a * 3 + 0.6)) + 1.2 * Math.abs(Math.cos(a * 5));
        row += r <= 7.6 ? 'k' : r <= 8.6 ? 'w' : r <= 9.6 ? 'Y' : r <= ray ? ((x + y) % 2 ? 'Y' : '.') : '.';
      }
      rows.push(row);
    }
    rows[c - 6] = rows[c - 6].slice(0, c + 7) + 'w' + rows[c - 6].slice(c + 8); // the "diamond ring"
    return { f: [rows] };
  }
  S.eclipse = eclipse();
  // ---- back to school
  S.apple = { f: [[
    '.....Tg...',
    '....T.gg..',
    '..rrTrr...',
    '.rrrrrrr..',
    'rrwrrrrrr.',
    'rwrrrrrrR.',
    'rrrrrrrrR.',
    'rrrrrrrRR.',
    '.rrrrrRR..',
    '..rRRRR...',
  ]] };
  S.pencil = { f: [[
    '.....................',
    'ppSyyyyyyyyyyyyyyttkk',
    'ppSYYYYYYYYYYYYYYtttk',
    'ppSyyyyyyyyyyyyyyttkk',
    '.....................',
  ]] };
  S.satchel = { f: [[
    '....TTTTTT....',
    '...T......T...',
    '..TuuuuuuuuT..',
    '.TtttttttttTu.',
    '.TtttyytttttT.',
    '.TTTTyyTTTTTT.',
    '.TttttttttttT.',
    '.TttttttttttT.',
    '.TttttttttttT.',
    '.TTTTTTTTTTTT.',
  ]] };

  // ---- sheets: SeasonsArt.sheet(name) -> { url, w, h, n } (cached)
  const CACHE = {};
  function sheet(name) {
    if (CACHE[name]) return CACHE[name];
    const s = S[name]; if (!s) return null;
    const o = svgOf(s.f, Object.assign({}, P, s.pal || {}));
    const one = o.n > 1 ? svgOf([s.f[0]], Object.assign({}, P, s.pal || {})).svg : o.svg; // the first frame on its own (badges, pointers)
    return CACHE[name] = { url: url(o.svg), svg: o.svg, still: url(one), stillSvg: one, w: o.w, h: o.h, n: o.n };
  }
  const img = (name, scale, cls) => { const s = sheet(name); if (!s) return ''; scale = scale || 1; return `<i class="ssw-spr${s.n > 1 ? ' ssw-anim' : ''}${cls ? ' ' + cls : ''}" style="--sw:${s.w * s.n * scale}px;width:${s.w * scale}px;height:${s.h * scale}px;background-image:${s.url};background-size:${s.w * s.n * scale}px ${s.h * scale}px;--n:${s.n}" aria-hidden="true"></i>`; };
  const inline = (name, scale) => { const s = sheet(name); if (!s) return ''; scale = scale || 1; return s.svg.replace('<svg ', `<svg style="width:${s.w * scale}px;height:${s.h * scale}px" viewBox="0 0 ${s.w} ${s.h}" `).replace(/ viewBox="0 0 \d+ \d+" width="\d+" height="\d+"/, ''); };

  // ================================================================ masthead scenery (wide SVGs that sit at the right of the banner)
  const pick = (seed => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; });
  function stars(n, w, h, seed, col) { const r = pick(seed); let o = ''; for (let i = 0; i < n; i++) o += `<rect x="${(r() * w) | 0}" y="${(r() * h) | 0}" width="${r() < 0.2 ? 2 : 1}" height="${r() < 0.2 ? 2 : 1}" fill="${col || '#fff'}" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`; return o; }
  const scene = (w, h, body) => url(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">${body}</svg>`);
  // Each scene is 600x100: the strip of "sky" above the headline ticker, to the left of the corner picture (the moon...).
  const SCENE = {
    halloween: () => scene(600, 100, `${stars(36, 600, 60, 7)}
      <path d="M0 100V84h50v-4h70v-6h80v-8h60v-6h80v6h70v8h60v6h60v4h70v16z" fill="#14061f"/>
      <g fill="#0a0212"><rect x="300" y="44" width="80" height="34"/><path d="M292 46l48-30 48 30z"/><rect x="312" y="20" width="10" height="18"/><rect x="348" y="28" width="22" height="20"/><path d="M344 30l15-12 15 12z"/>
      <rect x="236" y="48" width="4" height="26"/><path d="M238 52l-12-12m12 8l10-14m-10 22l-16 2" stroke="#0a0212" stroke-width="3"/></g>
      <g fill="#ffd400"><rect x="312" y="54" width="9" height="9"/><rect x="330" y="54" width="9" height="9"/><rect x="358" y="54" width="9" height="9"/><rect x="354" y="34" width="7" height="8"/><rect x="336" y="66" width="10" height="12" fill="#ff9a00"/></g>
      <g fill="#ffd400" opacity=".3"><rect x="310" y="52" width="13" height="13"/><rect x="328" y="52" width="13" height="13"/><rect x="356" y="52" width="13" height="13"/></g>
      <g fill="#0a0212">${[420, 446, 470, 498, 528].map((x, i) => `<rect x="${x}" y="${80 - (i % 2) * 3}" width="10" height="${14 + (i % 2) * 3}"/><rect x="${x + 2}" y="${77 - (i % 2) * 3}" width="6" height="3"/>`).join('')}
      ${Array.from({ length: 20 }, (_, i) => `<rect x="${40 + i * 8}" y="${84 - (i % 3)}" width="3" height="16"/>`).join('')}<rect x="40" y="88" width="160" height="3"/></g>`),
    bonfire: () => scene(600, 100, `${stars(30, 600, 60, 11)}
      <path d="M0 100V86h90v-3h140v-2h150v2h120v3h100v14z" fill="#0b0b18"/>
      <g fill="#0b0b18">${Array.from({ length: 32 }, (_, i) => `<rect x="${12 + i * 18}" y="${78 + (i % 2)}" width="4" height="22"/>`).join('')}<rect x="12" y="82" width="576" height="3"/><rect x="12" y="90" width="576" height="3"/></g>`),
    xmas: () => scene(600, 100, `${stars(30, 600, 40, 5)}
      <g fill="#14143a"><rect x="60" y="50" width="100" height="50"/><path d="M50 52l60-36 60 36z"/><rect x="130" y="18" width="12" height="24"/>
      <rect x="220" y="40" width="110" height="60"/><path d="M210 42l65-40 65 40z"/><rect x="240" y="6" width="12" height="24"/>
      <rect x="380" y="54" width="90" height="46"/><path d="M370 56l55-32 55 32z"/><rect x="446" y="22" width="10" height="24"/></g>
      <g fill="#fff"><path d="M50 52l60-36 60 36h-7l-53-31-53 31z"/><path d="M210 42l65-40 65 40h-7l-58-35-58 35z"/><path d="M370 56l55-32 55 32h-7l-48-27-48 27z"/><rect x="128" y="15" width="16" height="4"/><rect x="238" y="3" width="16" height="4"/><rect x="444" y="19" width="14" height="4"/></g>
      <g fill="#ffd400"><rect x="76" y="62" width="14" height="14"/><rect x="122" y="62" width="14" height="14"/><rect x="236" y="54" width="16" height="16"/><rect x="292" y="54" width="16" height="16"/><rect x="264" y="76" width="14" height="24" fill="#c0302a"/><rect x="398" y="66" width="12" height="12"/><rect x="436" y="66" width="12" height="12"/></g>
      <g fill="#14143a"><rect x="82" y="62" width="2" height="14"/><rect x="76" y="68" width="14" height="2"/><rect x="243" y="54" width="2" height="16"/><rect x="236" y="61" width="16" height="2"/><rect x="299" y="54" width="2" height="16"/><rect x="292" y="61" width="16" height="2"/></g>
      <path d="M0 100v-10q60-6 140-3t160 0 140-2 160 4v11z" fill="#fff"/><path d="M0 94q60-5 140-2t160 0 140-2 160 3" fill="none" stroke="#c8d8f0" stroke-width="2"/>`),
    newyear: () => scene(600, 100, `${stars(20, 600, 100, 3, '#ffd400')}
      <g fill="none" stroke-width="4"><path d="M30 0q24 20 6 40t14 50" stroke="#ff4aff"/><path d="M150 0q-18 24 8 44t-4 50" stroke="#3affff"/><path d="M270 0q24 20 0 44t14 50" stroke="#ffd400"/><path d="M390 0q-24 24 0 44t-8 50" stroke="#5aff5a"/><path d="M510 0q24 20 0 44t14 50" stroke="#ff7a00"/></g>`),
    millennium: () => scene(600, 100, `${stars(50, 600, 100, 9, '#ffe9a0')}
      <text x="330" y="88" font-family="Impact,'Arial Black',sans-serif" font-size="92" text-anchor="middle" fill="none" stroke="#ffd400" stroke-width="2.5" opacity=".6">2000</text>`),
    valentine: () => scene(600, 100, ''),
    easter: () => scene(600, 100, `<path d="M0 100V70q90-22 180-6t200-8 220 6v38z" fill="#3a9a1a"/><path d="M0 100V84q100-14 210-2t210-6 180 8v16z" fill="#2a7a12"/>
      ${[[40, 76], [130, 84], [230, 72], [330, 82], [440, 74], [540, 84]].map(([x, y]) => `<g><rect x="${x}" y="${y}" width="2" height="${100 - y}" fill="#1a5a0a"/><rect x="${x - 4}" y="${y - 6}" width="10" height="8" fill="#ffd400"/><rect x="${x - 1}" y="${y - 4}" width="4" height="4" fill="#ff7a00"/></g>`).join('')}`),
    summer: () => scene(600, 100, `<rect y="52" width="600" height="14" fill="#2a8ad8"/><rect y="54" width="600" height="2" fill="#bfe8ff"/><rect y="60" width="600" height="2" fill="#7ac8f8"/><rect y="66" width="600" height="34" fill="#f2d48a"/><rect y="72" width="600" height="2" fill="#e2bc6a"/>
      <g><rect x="90" y="44" width="4" height="46" fill="#8a5a2a"/><rect x="94" y="46" width="60" height="30" fill="#e10600"/><rect x="94" y="52" width="60" height="6" fill="#fff"/><rect x="94" y="64" width="60" height="6" fill="#fff"/><rect x="152" y="44" width="4" height="46" fill="#8a5a2a"/></g>
      <g transform="translate(260 62)"><rect x="0" y="16" width="56" height="16" fill="#e8c070"/><rect x="6" y="2" width="12" height="14" fill="#e8c070"/><rect x="38" y="2" width="12" height="14" fill="#e8c070"/><rect x="20" y="8" width="16" height="8" fill="#e8c070"/><rect x="6" y="0" width="3" height="3" fill="#e8c070"/><rect x="12" y="0" width="3" height="3" fill="#e8c070"/><rect x="38" y="0" width="3" height="3" fill="#e8c070"/><rect x="44" y="0" width="3" height="3" fill="#e8c070"/><rect x="27" y="-12" width="2" height="20" fill="#555"/><path d="M29-12h12l-12 7z" fill="#e10600"/></g>`),
    eclipse: () => scene(600, 100, `${stars(60, 600, 78, 13)}<path d="M0 100V84h60v-10h30v10h50v-6h40v-12h20v12h60v6h90v-8h24v8h70v-4h40v4h116v16z" fill="#05050c"/>`),
    backtoschool: () => scene(600, 100, `<g fill="#f0f0e0" opacity=".75" font-family="'Comic Sans MS','Comic Sans',cursive" font-size="17"><text x="20" y="26">2 + 2 = 4</text><text x="190" y="24">a&#178; + b&#178; = c&#178;</text><text x="40" y="62" font-size="15">Homework: page 42</text></g>
      <g fill="none" stroke="#f0f0e0" stroke-width="2" opacity=".75"><path d="M420 10l14 28h-28zM406 38h28v28h-28zM410 66l-4 10M430 66l4 10"/><circle cx="420" cy="50" r="5"/><path d="M270 60q14-20 28 0t28 0"/></g>
      <rect y="88" width="600" height="12" fill="#8a5a2a"/><rect y="88" width="600" height="3" fill="#b07a40"/><rect x="70" y="83" width="22" height="5" fill="#fff"/><rect x="130" y="85" width="12" height="3" fill="#ffd400"/>`),
  };

  // ================================================================ FunCursor trail pictures (tiny inline SVGs)
  const TRAILS = {
    halloween: ['pumpkinS', 'bat', 'ghost'], bonfire: ['sparkler', 'fwGold'], xmas: ['snowflake', 'holly'], millennium: ['clock', 'snowflake'], newyear: ['partyhat', 'confetti'],
    valentine: ['heart', 'heartP'], easter: ['eggA', 'eggB', 'eggC'], summer: ['sun', 'beachball'], eclipse: ['eclipse'], backtoschool: ['apple', 'pencil'],
  };
  function trail(key) {
    const names = TRAILS[key]; if (!names) return null;
    return names.map(n => { const s = sheet(n); const k = Math.min(1, 14 / Math.max(s.w, s.h)); return s.svg.replace('<svg ', `<svg style="width:${Math.round(s.w * k * 1.2)}px;height:${Math.round(s.h * k * 1.2)}px;vertical-align:top" preserveAspectRatio="xMinYMin meet" viewBox="0 0 ${s.w} ${s.h}" `).replace(/ viewBox="0 0 \d+ \d+" width="\d+" height="\d+"/, ''); });
  }

  // ================================================================ Haunted Hill: the Halloween screen saver
  // A moonlit hill with a haunted house (its windows flicker), pumpkins glowing in the graveyard, bats and a friendly ghost.
  // The scenery is drawn once into an off-screen canvas; each frame only copies it and moves a few sprites.
  function bitmap(name, frame) {
    const s = sheet(name), c = document.createElement('canvas'), map = S[name].f[frame || 0], pal = Object.assign({}, P, S[name].pal || {});
    c.width = s.w; c.height = s.h; const g = c.getContext('2d');
    map.forEach((row, y) => [...row].forEach((ch, x) => { const col = pal[ch]; if (ch !== '.' && col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } }));
    return c;
  }
  function hauntedHill(g, W, H, o) {
    const k = Math.max(1, Math.round(Math.min(W, H) / 150)), back = document.createElement('canvas');
    back.width = W; back.height = H;
    const b = back.getContext('2d');
    // sky: banded like a 256-colour GIF
    const bands = ['#0a0216', '#120428', '#1a0636', '#240a44', '#2e0e52', '#3a145e', '#4a1a66', '#5e2268'];
    bands.forEach((c, i) => { b.fillStyle = c; b.fillRect(0, Math.floor(i * H * 0.7 / bands.length), W, Math.ceil(H * 0.7 / bands.length) + 1); });
    b.fillStyle = '#6a2a66'; b.fillRect(0, H * 0.7, W, H * 0.3);
    const r = pick(17);
    for (let i = 0; i < 120; i++) { b.fillStyle = r() < 0.3 ? '#ffffff' : '#c8b8e8'; b.fillRect((r() * W) | 0, (r() * H * 0.6) | 0, k > 1 && r() < 0.3 ? 2 : 1, k > 1 && r() < 0.3 ? 2 : 1); }
    // the moon
    const mx = W * 0.74, my = H * 0.24, mr = Math.min(W, H) * 0.13;
    b.fillStyle = 'rgba(255,240,180,.08)'; b.beginPath(); b.arc(mx, my, mr * 1.7, 0, 7); b.fill();
    b.fillStyle = 'rgba(255,240,180,.12)'; b.beginPath(); b.arc(mx, my, mr * 1.3, 0, 7); b.fill();
    b.fillStyle = '#fff4c8'; b.beginPath(); b.arc(mx, my, mr, 0, 7); b.fill();
    b.fillStyle = '#e8d8a0'; [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.4, 0.12], [0.35, -0.35, 0.09]].forEach(([x, y, s]) => { b.beginPath(); b.arc(mx + x * mr, my + y * mr, s * mr, 0, 7); b.fill(); });
    // hills
    b.fillStyle = '#1a0828'; b.beginPath(); b.moveTo(0, H * 0.78); b.quadraticCurveTo(W * 0.3, H * 0.6, W * 0.55, H * 0.7); b.quadraticCurveTo(W * 0.8, H * 0.8, W, H * 0.72); b.lineTo(W, H); b.lineTo(0, H); b.fill();
    b.fillStyle = '#0c0414'; b.beginPath(); b.moveTo(0, H * 0.86); b.quadraticCurveTo(W * 0.25, H * 0.8, W * 0.5, H * 0.86); b.quadraticCurveTo(W * 0.75, H * 0.92, W, H * 0.84); b.lineTo(W, H); b.lineTo(0, H); b.fill();
    // the house on the hill
    const hx = W * 0.3, hy = H * 0.64, u = Math.max(4, Math.min(W, H) / 60);
    b.fillStyle = '#0c0414';
    b.fillRect(hx - u * 6, hy - u * 7, u * 12, u * 8); b.beginPath(); b.moveTo(hx - u * 7, hy - u * 7); b.lineTo(hx, hy - u * 12); b.lineTo(hx + u * 7, hy - u * 7); b.fill();
    b.fillRect(hx + u * 3, hy - u * 13, u * 2, u * 4); b.fillRect(hx - u * 10, hy - u * 4, u * 4, u * 5); b.beginPath(); b.moveTo(hx - u * 10.5, hy - u * 4); b.lineTo(hx - u * 8, hy - u * 7.5); b.lineTo(hx - u * 5.5, hy - u * 4); b.fill();
    // a crooked tree
    b.strokeStyle = '#0c0414'; b.lineWidth = u * 0.8; b.lineCap = 'square';
    const tx = W * 0.62, ty = H * 0.74;
    [[0, 0, 0, -u * 9], [0, -u * 6, -u * 4, -u * 10], [0, -u * 7, u * 5, -u * 11], [u * 5, -u * 11, u * 7, -u * 10], [-u * 4, -u * 10, -u * 6, -u * 9.5], [0, -u * 9, u * 1.5, -u * 12]].forEach(([a, c, d, e]) => { b.beginPath(); b.moveTo(tx + a, ty + c); b.lineTo(tx + d, ty + e); b.stroke(); });
    // gravestones and a fence
    for (let i = 0; i < 5; i++) { const gx = W * 0.44 + i * u * 4.5, gy = H * 0.86 - (i % 2) * u; b.fillStyle = '#3a3448'; b.fillRect(gx, gy - u * 3, u * 2.4, u * 3); b.fillRect(gx + u * 0.3, gy - u * 3.4, u * 1.8, u * 0.4); }
    b.fillStyle = '#0c0414'; for (let x = 0; x < W * 0.22; x += u * 1.6) b.fillRect(x, H * 0.84, u * 0.5, u * 3); b.fillRect(0, H * 0.85, W * 0.22, u * 0.4);
    const windows = [[-4, -5], [-1.5, -5], [2.5, -5], [-4, -2.5], [2.5, -2.5], [-8.6, -2.6]].map(([x, y]) => [hx + x * u, hy + y * u]);
    const pumpkins = [[W * 0.12, H * 0.92], [W * 0.5, H * 0.94], [W * 0.82, H * 0.9]].map(([x, y]) => [x, y]);
    const pf = [bitmap('pumpkin', 0), bitmap('pumpkin', 2)], bf = [bitmap('bat', 0), bitmap('bat', 1)], gf = [bitmap('ghost', 0), bitmap('ghost', 1)];
    const ps = Math.max(2, Math.round(Math.min(W, H) / 210)); // sprite pixel size: chunky, like a 320x240 GIF blown up
    const bats = Array.from({ length: 5 }, (_, i) => ({ x: Math.random() * W, y: H * (0.1 + Math.random() * 0.4), sp: (40 + Math.random() * 50) * k, ph: Math.random() * 6 }));
    const ghost = { x: -60, y: H * 0.55, t: 0 };
    let t = 0;
    g.imageSmoothingEnabled = false;
    return { frame(dt) {
      t += dt;
      g.drawImage(back, 0, 0);
      // windows flicker like candles
      windows.forEach(([x, y], i) => { const on = (Math.sin(t * (2 + i) + i * 3) + Math.sin(t * 7.3 + i)) > -1.2; g.fillStyle = on ? '#ffd400' : '#c88a00'; g.fillRect(x, y, u * 1.4, u * 1.6); g.fillStyle = '#0c0414'; g.fillRect(x + u * 0.65, y, u * 0.12, u * 1.6); });
      pumpkins.forEach(([x, y], i) => { const f = pf[(Math.sin(t * 6 + i * 2) > 0.6) ? 1 : 0]; g.fillStyle = 'rgba(255,160,0,.18)'; g.beginPath(); g.arc(x + 7 * ps, y + 4 * ps, 14 * ps, 0, 7); g.fill(); g.drawImage(f, x, y - 6 * ps, 15 * ps, 13 * ps); });
      // the friendly ghost floats across now and then
      ghost.t += dt; if (ghost.x > W + 80) { if (ghost.t > 8) { ghost.x = -60; ghost.t = 0; ghost.y = H * (0.45 + Math.random() * 0.2); } }
      else { ghost.x += 30 * k * dt; const gy = ghost.y + Math.sin(t * 2) * 10 * k; g.globalAlpha = 0.85; g.drawImage(gf[(t * 3 | 0) % 2], ghost.x, gy, 14 * ps * 1.25, 15 * ps * 1.25); g.globalAlpha = 1; }
      bats.forEach(bt => { bt.x += bt.sp * dt; if (bt.x > W + 40) { bt.x = -40; bt.y = H * (0.08 + Math.random() * 0.45); } const y = bt.y + Math.sin(t * 2 + bt.ph) * 14 * k; g.drawImage(bf[((t * 8 + bt.ph) | 0) % 2], bt.x, y, 16 * ps, 7 * ps); });
    } };
  }

  window.SeasonsArt = { P, S, sheet, img, inline, url, scene: k => SCENE[k] ? SCENE[k]() : '', trail, hauntedHill, bitmap, svgOf };
})();

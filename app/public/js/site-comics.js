/* JACK ATTACK! COMICS: "Jack & Co." strips, drawn in code. Lazily loaded by js/site.js (comics page + home "strip of the day").
 * Each panel is painted as chunky pixel art on a 128x104 canvas, scaled x3, then the lettering (speech bubbles, captions,
 * sound effects, signs) is drawn sharp on top at full size so it's easy to read. All original characters and writing. */
(function () {
  if (window.SiteComics) return;
  const LW = 128, LH = 104, S = 3, PW = LW * S, PH = LH * S, GUT = 14, G = 96;
  const lo = document.createElement('canvas'); lo.width = LW; lo.height = LH;
  const base = lo.getContext('2d'); let c = base;
  const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);

  // ================================================================ pixel helpers (low-res canvas)
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const P = (x, y, col) => R(x, y, 1, 1, col);
  function line(x0, y0, x1, y1, col, th) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); th = th || 1;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy, o = Math.floor(th / 2);
    for (let n = 0; n < 400; n++) { R(x0 - o, y0 - o, th, th, col); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  function oval(cx, cy, rx, ry, col) { for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01)))); R(cx - w, cy + y, w * 2 + 1, 1, col); } }
  function rrect(x, y, w, h, col) { R(x + 1, y, w - 2, h, col); R(x, y + 1, w, h - 2, col); }
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); };

  // ================================================================ THE CAST
  const CAST = {
    jack: { name: 'Jack', kid: 1, skin: '#f5c89a', hair: 'messy', hc: '#5a3216', cap: '#d81818', top: '#2a6fd0', pat: 'stripes', pc: '#ffffff', legs: '#2b3f86', shoes: '#f2f2f2',
      bio: 'Editor, writer, webmaster and only member of staff at JACK ATTACK! Online. Likes: Blockology, Intergalactic Battles, Rubrick\'s cubes, the ULTRA 64, sci-fi telly. Dislikes: the phone ringing during a download.' },
    dave: { name: 'Dave', kid: 1, tall: 2, ss: 1, skin: '#f7d0a8', hair: 'curtains', hc: '#e8c840', top: '#1f9a3a', pat: 'sport', pc: '#ffffff', legs: '#8a8a8a', shoes: '#222222',
      bio: 'Jack\'s best mate. Ultra Entertainment forever. Goldenballs champion (says Dave). Has a cousin who "works at Ultra Entertainment" (garden centre). Has never passed the car park test. Now draws his own comic. Nobody asked him to.' },
    kim: { name: 'Cousin Kim', kid: 1, fem: 1, skin: '#c98a5a', hair: 'bunches', hc: '#1a1a1a', bob: '#e10600', top: '#8a3ac0', pat: 'jacket', pc: '#c070f0', legs: '#2b3f86', shoes: '#ff6ab8',
      bio: 'Jack\'s cousin. Can do the Rubrick\'s cube in forty seconds. Knows every Pocket Critters, every cheat and every shortcut, and is annoyingly nice about it.' },
    mom: { name: 'Mom', fem: 1, lips: '#c8204a', skin: '#f5c89a', hair: 'curly', hc: '#a0401a', top: '#ff8ac0', pat: 'cardigan', pc: '#ffffff', legs: '#3a3a5a', shoes: '#600000',
      bio: 'Runs the house, the phone and the off switch. Needs the phone line at exactly the moment a download hits 99%. Every time. Secretly quite good at Blockology.' },
    dad: { name: 'Dad', skin: '#eebb99', hair: 'bald', hc: '#6a4a2a', glasses: 1, gl: '#5a3a2a', tache: 1, top: '#7a5a3a', pat: 'jumper', pc: '#c9a060', legs: '#555555', shoes: '#8a2a2a',
      bio: 'Has bought 40 tins of beans for the Millennium Bug. Calls the mouse "the clicker". Believes the computer can catch a cold. Unbeatable at Championship Mangler.' },
    gran: { name: 'Gran', short: 1, fem: 1, gl: '#a04a7a', skin: '#f2c8a8', hair: 'bun', hc: '#d0d0d0', glasses: 1, top: '#b090d0', pat: 'cardigan', pc: '#ffffff', skirt: '#5a4a7a', legs: '#c9a080', shoes: '#222222',
      bio: 'Knits. Bakes. Has the highest Blockology score in the family and will not give the Game Lad back. Carries a handbag that can stop a grown man.' },
    ali: { name: 'Mr Ali', skin: '#b07a4a', hair: 'neat', hc: '#111111', glasses: 1, beard: '#2e2a2a', gl: '#c8a040', gl2: '#e0c870', top: '#e8f0ff', pat: 'shirt', pc: '#c02020', legs: '#2a2a3a', shoes: '#111111',
      bio: 'Runs Computer Club on Tuesdays. Says it\'s for spreadsheets. Has the school\'s best Bugsweeper time and guards it with his life.' },
    luke: { name: 'Luke', kid: 1, ss: 1, skin: '#a8703e', hair: 'neat', hc: '#1a1010', top: '#d02030', pat: 'sport', pc: '#ffffff', legs: '#1a2a5a', shoes: '#f0f0f0',
      bio: 'Jack\'s mate. Ultra Entertainment till he dies. Goes in goal so he can lean on the post. Thinks the PlaySpace is "for people who don\'t like fun". Will tell you the football score whether you asked or not.' },
    otherjack: { name: 'JackK', kid: 1, skin: '#f0c090', hair: 'messy', hc: '#2a1a0a', cap: '#2a4ad0', capback: 1, top: '#2a9a4a', pat: 'stripes', pc: '#e8ffe8', legs: '#3a3a3a', shoes: '#202020',
      bio: 'Jack\'s mate. Also called Jack, which is why everyone calls him JackK (his JackNet name, and what he answers to at school). Wears his cap backwards so you can tell them apart. Has a homepage with a quiz on it. Refuses to be Jack Two.' },
    callum: { name: 'Callum', kid: 1, skin: '#f2c79a', hair: 'gelled', hc: '#7a4a1a', glasses: 1, gl: '#222233', top: '#22222c', pat: 'logo', pc: '#3c3', legs: '#3a4a6a', shoes: '#e8e8e8',
      bio: 'Has a 450MHz PC and will tell you. Has a proper mouse mat and will tell you. Thinks consoles are toys. His dad knows everyone, apparently. They are definitely going to the seaside this year. Any day now.' },
    shop: { name: 'The shop man', ss: 1, skin: '#e8b890', hair: 'neat', hc: '#5a3a1a', top: '#2a8a4a', pat: 'tabard', pc: '#ffd400', legs: '#333333', shoes: '#111111', bio: '' },
    biscuit: { name: 'Biscuit the cat', pet: 1, bio: 'The family cat. Ginger. Sleeps on the warm bit of the monitor. Has walked across the keyboard during every important piece of homework since 1997.' },
    gubbinz: { name: 'Gubbinz', grot: 1, bio: 'The little green helper who lives somewhere inside the website. Eats letters. Pops up when you least want him. Small, green, and convinced he runs the place.' },
    pc: { name: 'The Computer', thing: 1, bio: 'Pent-Yum II 350MHz, 64MB of RAM, 6.4GB hard drive, beige. Works perfectly until someone is watching. Then it crashes.' },
    modem: { name: 'The Modem', thing: 1, bio: '56K. Connects at 49,333 bps on a good day. Screams when it dials. Hangs up when anyone picks up the phone downstairs.' },
  };
  // The cousin, the Computer Club teacher and the cat are this visitor's own cast (js/cast.js): their names come from Cast, and
  // the cousin and the teacher are drawn as a boy or a girl, a man or a woman, to match. Each keeps the same colours and props.
  const CT = s => window.Cast ? Cast.t(s) : s, CG = id => window.Cast ? Cast.g(id) : 'f';
  const LOOK = {
    kim: { f: { fem: 1, hair: 'bunches', hc: '#1a1a1a', bob: '#e10600', shoes: '#ff6ab8' },
      m: { fem: 0, hair: 'short', hc: '#1a1a1a', cap: '#8a3ac0', capf: '#ffffff', capdot: '#ffd400', shoes: '#ffd400' } },
    ali: { m: { fem: 0, hair: 'neat', hc: '#111111', beard: '#2e2a2a', gl: '#c8a040', gl2: '#e0c870', top: '#e8f0ff', pat: 'shirt', pc: '#c02020', skirt: 0, legs: '#2a2a3a', lips: 0 },
      f: { fem: 1, hair: 'bob', hc: '#2a1810', beard: 0, gl: '#c8a040', gl2: '#e0c870', top: '#2f6a8a', pat: 'cardigan', pc: '#f4f4ff', skirt: '#2a2a3a', legs: '#6a4a34', lips: '#a8304a' } },
  };
  Object.assign(CAST.kim, LOOK.kim[CG('cousin')], { name: CT('Cousin {cousin.first}') });
  Object.assign(CAST.ali, LOOK.ali[CG('teacher')], { name: CT('{teacher}'), bio: CT('Runs Computer Club on Tuesdays. Says it\'s for spreadsheets. Has the school\'s best Bugsweeper time and guards it with {teacher.his} life.') });
  Object.assign(CAST.biscuit, { name: CT('{cat} the cat') });
  const CAST_ORDER = ['jack', 'dave', 'luke', 'otherjack', 'callum', 'kim', 'mom', 'dad', 'gran', 'ali', 'biscuit', 'gubbinz', 'pc', 'modem'];

  // ================================================================ backgrounds: a far wall with a bit of light and shade, furniture with a lit edge and
  // a shadow, and a floor that runs away from you (boards, tiles or carpet with perspective lines towards a vanishing point)
  const VX = 64; // where the floor lines meet (just above the middle of the panel)
  function dith(x, y, w, h, col) { for (let yy = 0; yy < h; yy++) for (let xx = (yy % 2); xx < w; xx += 2) P(x + xx, y + yy, col); }
  function wallShade(y1, col) { dith(0, 0, LW, 2, col); dith(0, y1 - 3, LW, 3, col); }
  function floor(col, col2, y, kind) {
    y = y || 82; R(0, y, LW, LH - y, col);
    if (kind === 'carpet') { for (let i = 0; i < 60; i++) P((i * 37) % LW, y + 2 + (i * 13) % (LH - y - 2), col2); R(0, y, LW, 1, shade(col, 0.8)); return; }
    if (kind === 'tiles') { const rows = [0, 3, 7, 12, 18, 25]; rows.forEach(r => R(0, y + r, LW, 1, col2)); for (let i = -8; i <= 8; i++) line(VX + i * 9, y, VX + i * 22, LH, col2); for (let r = 0; r < rows.length - 1; r++) for (let i = -8; i <= 8; i++) if ((i + r) % 2 === 0) { const x0 = VX + i * (9 + (22 - 9) * (rows[r] / (LH - y))), x1 = VX + (i + 1) * (9 + (22 - 9) * (rows[r] / (LH - y))); R(x0 + 1, y + rows[r] + 1, x1 - x0 - 1, rows[r + 1] - rows[r] - 1, shade(col, 0.93)); } return; }
    for (let i = -10; i <= 10; i++) line(VX + i * 8, y, VX + i * 20, LH, col2); // floorboards
    [4, 10, 18].forEach((r, k) => { for (let i = -10; i <= 10; i++) if ((i + k) % 3 === 0) { const t = r / (LH - y), sp = 8 + 12 * t; R(Math.round(VX + i * sp + 2), y + r, Math.round(sp - 3), 1, col2); } });
    R(0, y, LW, 1, shade(col, 0.75));
  }
  function skirting(y, col) { R(0, y, LW, 3, col); R(0, y, LW, 1, shade(col, 1.15)); R(0, y + 2, LW, 1, shade(col, 0.8)); }
  function windowSky(x, y, w, h, night) {
    R(x - 2, y - 2, w + 4, h + 4, '#e8e0c8'); R(x, y, w, h, night ? '#101a40' : '#8ecfff'); R(x, y + h - 5, w, 5, night ? '#16224c' : '#a8dcff');
    if (night) { P(x + 3, y + 3, '#fff'); P(x + w - 5, y + 5, '#fff'); P(x + w / 2, y + 2, '#ffd'); oval(x + w - 6, y + 7, 2, 2, '#fff8c0'); } else { R(x + 4, y + h - 9, 10, 3, '#fff'); R(x + 6, y + h - 11, 6, 2, '#fff'); R(x, y + h - 3, w, 3, '#7ab868'); }
    R(x + w / 2 - 1, y, 2, h, '#e8e0c8'); R(x, y + h / 2 - 1, w, 2, '#e8e0c8'); R(x - 3, y + h + 2, w + 6, 2, '#d8d0b8'); R(x - 2, y - 2, w + 4, 1, '#fff8e8');
  }
  function lightPatch(x, y, w, night) { if (night) return; base.fillStyle = 'rgba(255,248,210,.16)'; base.beginPath(); base.moveTo(x, y); base.lineTo(x + w, y); base.lineTo(x + w + 10, y + 12); base.lineTo(x + 6, y + 12); base.fill(); }
  function tv(x, y, o) {
    R(x, y, 32, 23, '#2a2a30'); R(x, y, 32, 1, '#4a4a54'); R(x + 2, y + 2, 26, 18, '#111'); const S = o.tv || '#2a4a8a';
    R(x + 3, y + 3, 24, 16, S);
    if (o.tvroll) { for (let i = 0; i < 16; i += 2) R(x + 3, y + 3 + i, 24, 1, '#b8b8b8'); R(x + 3, y + 9, 24, 3, '#555'); P(x + 8, y + 6, '#fff'); P(x + 20, y + 14, '#fff'); }
    else if (o.tvpic === 'car') { R(x + 3, y + 3, 24, 7, '#6ab0e8'); R(x + 3, y + 10, 24, 9, '#6a6a72'); for (let i = 0; i < 4; i++) R(x + 5 + i * 6, y + 14, 3, 1, '#fff'); R(x + 11, y + 11, 7, 3, '#e10600'); R(x + 12, y + 10, 4, 1, '#ff6a6a'); P(x + 11, y + 14, '#111'); P(x + 17, y + 14, '#111'); }
    else if (o.tvbox) { R(x + 3, y + 3, 24, 16, '#2a4a8a'); R(x + 3, y + 1, 11, 19, '#ffd400'); R(x + 4, y + 3, 9, 4, '#e10600'); oval(x + 8, y + 12, 3, 3, '#f0a040'); R(x + 15, y + 2, 11, 18, '#3a9adf'); R(x + 16, y + 4, 9, 3, '#fff'); R(x + 18, y + 10, 5, 6, '#e8e0c0'); R(x + 13, y + 9, 4, 1, '#ddd'); R(x + 24, y + 6, 4, 1, '#ddd'); }
    else if (!o.tv) { for (let i = 0; i < 5; i++) R(x + 5 + i * 5, y + 6 + (i % 2) * 5, 3, 3, '#7ec8ff'); }
    R(x + 4, y + 4, 6, 1, 'rgba(255,255,255,.35)'); R(x + 29, y + 4, 2, 2, '#e10600'); R(x + 29, y + 9, 2, 1, '#888'); R(x + 29, y + 12, 2, 1, '#888');
  }
  const BG = {
    bedroom(o) {
      R(0, 0, LW, 82, '#4a76c0'); for (let x = 0; x < LW; x += 8) R(x, 0, 3, 82, '#5482cc'); for (let x = 4; x < LW; x += 8) for (let y = 6; y < 76; y += 10) P(x + 1, y, '#6a96dc');
      wallShade(79, '#3a64aa');
      windowSky(46, 10, 30, 26, o.night); R(41, 7, 6, 36, '#c03030'); R(75, 7, 6, 36, '#c03030'); R(42, 7, 1, 36, '#e05050'); R(76, 7, 1, 36, '#e05050'); R(40, 5, 42, 2, '#7a4a2a');
      // posters: a starship in the stars and a grinning green face, pinned up
      R(6, 10, 22, 30, '#101028'); R(8, 12, 18, 26, '#18183a'); for (let i = 0; i < 6; i++) P(9 + i * 3, 14 + (i * 5) % 18, '#fff'); R(11, 24, 12, 3, '#bbb'); R(15, 22, 3, 7, '#bbb'); R(9, 34, 16, 2, '#ffd400'); P(7, 11, '#e10600'); P(26, 11, '#e10600');
      R(88, 12, 20, 16, '#ffd400'); R(90, 14, 16, 12, '#3a9a2a'); R(93, 17, 3, 2, '#e10600'); R(100, 17, 3, 2, '#e10600'); R(94, 22, 8, 1, '#fff'); for (let i = 0; i < 4; i++) P(95 + i * 2, 23, '#fff');
      // a shelf with a trophy and a cube
      R(6, 46, 26, 2, '#8a5a2e'); R(6, 48, 26, 1, '#5a3a1a'); R(9, 41, 4, 5, '#ffd400'); R(8, 40, 6, 2, '#ffd400'); R(17, 42, 4, 4, '#e10600'); R(17, 42, 2, 2, '#2a7ad8'); R(19, 44, 2, 2, '#ffd400'); R(24, 39, 6, 7, '#2a4a8a');
      skirting(78, '#e8e0c8');
      floor('#8a6a4a', '#76583a'); lightPatch(44, 82, 34, o.night);
      base.fillStyle = 'rgba(200,60,60,.55)'; base.fillRect(26, 92, 76, 9); dith(26, 92, 76, 9, 'rgba(255,220,120,.25)');
      if (!o.nobed) { R(96, 56, 32, 26, '#6a3e1e'); R(96, 56, 3, 26, '#8a5a2e'); R(99, 58, 29, 7, '#eeeef8'); R(99, 64, 29, 2, '#c8c8d8'); R(104, 62, 24, 16, '#d84848'); R(104, 62, 24, 2, '#f07070'); for (let i = 0; i < 4; i++) R(106 + i * 6, 66, 2, 11, '#f07070'); R(96, 82, 32, 2, 'rgba(0,0,0,.25)'); }
      R(2, 74, 14, 8, '#c03030'); R(3, 72, 12, 3, '#ffd400'); R(3, 76, 12, 1, '#fff'); R(2, 82, 14, 1, 'rgba(0,0,0,.25)'); // a pile of magazines
    },
    living(o) {
      R(0, 0, LW, 82, '#ecdcac'); for (let y = 4; y < 78; y += 10) for (let x = (y / 10 % 2) * 6; x < LW; x += 12) { P(x, y, '#d0a070'); P(x + 1, y + 1, '#c08a5a'); P(x - 1, y + 1, '#c08a5a'); P(x, y + 2, '#d0a070'); }
      wallShade(79, '#d8c890');
      R(8, 12, 18, 14, '#7a4a1a'); R(10, 14, 14, 10, '#7ec8ff'); R(10, 20, 14, 4, '#3a9a2a'); R(15, 17, 5, 3, '#fff'); // a picture of somewhere nice
      windowSky(92, 10, 26, 24, o.night);
      skirting(77, '#a07a4a');
      // telly on a cabinet, with the console and its pad on a lead
      R(4, 50, 36, 28, '#6a4a2a'); R(4, 50, 36, 2, '#8a6a3a'); R(6, 56, 32, 1, '#4a2a1a'); R(20, 58, 1, 18, '#4a2a1a'); P(17, 66, '#c9a060'); P(23, 66, '#c9a060');
      tv(6, 27, o);
      R(12, 47, 18, 4, '#555'); R(14, 46, 3, 1, '#e10600'); R(22, 46, 3, 1, '#2a7ad8'); line(20, 51, 44, 82, '#222');
      // lamp, with a warm glow
      if (o.night) { base.fillStyle = 'rgba(255,220,120,.18)'; base.beginPath(); base.arc(113, 42, 26, 0, 7); base.fill(); }
      R(112, 46, 2, 32, '#555'); R(106, 37, 14, 10, '#ffe080'); R(106, 37, 14, 2, '#fff0b0'); R(108, 76, 10, 3, '#555');
      floor('#a83434', '#922a2a', 82, 'carpet'); lightPatch(90, 82, 26, o.night);
      if (!o.nosofa) { R(42, 52, 68, 10, '#4a6a2a'); R(42, 52, 68, 2, '#5a7a3a'); R(46, 60, 60, 14, '#5a7a3a'); R(46, 60, 60, 2, '#6a8a4a'); R(74, 60, 1, 14, '#4a6a2a'); R(40, 56, 7, 22, '#4a6a2a'); R(105, 56, 7, 22, '#4a6a2a'); R(40, 56, 7, 2, '#6a8a4a'); R(105, 56, 7, 2, '#6a8a4a'); R(50, 56, 9, 6, '#c8a040'); R(92, 56, 9, 6, '#c03838'); R(50, 74, 4, 6, '#3a2a1a'); R(98, 74, 4, 6, '#3a2a1a'); R(42, 80, 70, 2, 'rgba(0,0,0,.25)'); }
    },
    kitchen(o) {
      R(0, 0, LW, 82, '#f8f0d8'); for (let y = 30; y < 60; y += 5) for (let x = (y / 5 % 2) * 5; x < LW; x += 10) { R(x, y, 9, 4, '#e8f4ff'); P(x, y, '#fff'); }
      wallShade(58, '#e8dcbc');
      // cupboards with handles, worktop with a kettle and a toaster
      R(0, 60, LW, 22, '#c08a50'); R(0, 57, LW, 4, '#e8e0c8'); R(0, 57, LW, 1, '#fff'); for (let x = 2; x < LW; x += 20) { R(x, 63, 18, 17, '#d09a60'); R(x, 63, 18, 1, '#e0b070'); R(x + 14, 69, 2, 5, '#7a4a1a'); }
      R(60, 49, 8, 8, '#c0c4cc'); R(61, 47, 6, 2, '#a0a4ac'); R(68, 51, 3, 3, '#a0a4ac'); R(76, 51, 10, 6, '#d02828'); R(78, 50, 2, 1, '#333'); R(82, 50, 2, 1, '#333');
      R(96, 12, 28, 70, '#f4f4f4'); R(96, 12, 2, 70, '#ffffff'); R(122, 12, 2, 70, '#d0d0d8'); R(96, 37, 28, 1, '#bbb'); R(118, 20, 2, 12, '#aaa'); R(118, 42, 2, 14, '#aaa'); // fridge
      R(101, 17, 4, 4, '#e10600'); R(108, 22, 6, 3, '#ffd400'); R(104, 26, 5, 5, '#fff'); R(105, 27, 3, 1, '#2a7ad8'); // magnets and a drawing
      windowSky(38, 4, 32, 22, o.night);
      // the phone on the wall, the most important object in this comic
      R(10, 26, 10, 14, '#e8e0c8'); R(10, 26, 10, 1, '#fff'); R(11, 27, 8, 4, '#bbb'); for (let i = 0; i < 3; i++) { R(12 + i * 2, 33, 1, 1, '#555'); R(12 + i * 2, 35, 1, 1, '#555'); }
      if (!o.offhook) { R(9, 24, 12, 3, '#e8e0c8'); R(9, 24, 12, 1, '#fff'); } for (let i = 0; i < 8; i++) P(15 + (i % 2), 40 + i * 2, '#999');
      floor('#e8dcc0', '#d0c4a6', 82, 'tiles'); R(0, 82, LW, 1, '#b89a68');
    },
    playground(o) {
      R(0, 0, LW, 50, '#8ecfff'); R(0, 0, LW, 6, '#7ec0f4'); R(10, 8, 16, 4, '#fff'); R(14, 6, 8, 2, '#fff'); R(80, 12, 20, 4, '#fff'); R(84, 10, 10, 2, '#fff');
      R(0, 24, LW, 42, '#b0503a'); for (let y = 26; y < 66; y += 4) for (let x = (y / 4 % 2) * 4; x < LW; x += 8) { R(x, y, 7, 3, '#c0603a'); P(x, y, '#d07050'); }
      R(0, 22, LW, 3, '#8a3a2a');
      for (let i = 0; i < 4; i++) { R(6 + i * 32, 30, 22, 18, '#e8e0c8'); R(8 + i * 32, 32, 18, 14, '#7ec8ff'); R(8 + i * 32, 32, 18, 3, '#a8dcff'); R(16 + i * 32, 32, 2, 14, '#e8e0c8'); R(6 + i * 32, 48, 22, 2, '#a89a80'); }
      R(0, 66, LW, 38, '#6a6a72'); for (let i = 0; i < 70; i++) P((i * 41) % LW, 68 + (i * 17) % 34, i % 2 ? '#7a7a82' : '#5e5e66'); R(0, 66, LW, 1, '#555');
      for (let i = 0; i < 4; i++) { R(30 + i * 11, 86, 10, 1, '#ffd400'); R(30 + i * 11, 86, 1, 10, '#ffd400'); } R(74, 86, 1, 10, '#ffd400'); for (let i = 0; i < 4; i++) P(34 + i * 11, 91, '#ffd400');
      R(110, 52, 14, 16, '#2a5a2a'); R(108, 50, 18, 3, '#1a4a1a'); R(110, 52, 2, 16, '#3a7a3a'); R(110, 68, 14, 2, 'rgba(0,0,0,.3)');
    },
    complab(o) {
      R(0, 0, LW, 82, '#d8e4d0'); R(0, 0, LW, 6, '#b8c4b0'); for (let x = 0; x < LW; x += 16) R(x, 6, 1, 76, '#cad8c2');
      wallShade(70, '#c4d2bc');
      R(6, 8, 40, 26, '#a07a4a'); R(8, 10, 36, 22, '#c9a060'); R(10, 12, 10, 8, '#fff'); R(22, 12, 12, 6, '#ffd400'); R(26, 22, 14, 8, '#7ec8ff'); R(12, 22, 8, 6, '#ff8ac0'); for (const [px, py] of [[14, 12], [27, 12], [32, 22], [15, 22]]) P(px, py, '#e10600'); // notice board
      R(58, 8, 64, 28, '#7a6040'); R(60, 10, 60, 24, '#2f6a44'); for (let i = 0; i < 4; i++) R(64, 14 + i * 5, 14 + (i * 9) % 20, 1, '#cfe8d8'); R(96, 14, 18, 1, '#cfe8d8'); R(96, 19, 12, 1, '#cfe8d8'); R(62, 34, 56, 2, '#a08060'); R(70, 33, 4, 1, '#fff'); // blackboard with chalk
      for (let i = 0; i < 4; i++) { const x = 8 + i * 30; R(x, 50, 24, 3, '#a07a4a'); R(x, 50, 24, 1, '#c09a6a'); R(x + 4, 37, 16, 13, '#d8d0b0'); R(x + 4, 37, 16, 1, '#f0e8d0'); R(x + 6, 39, 12, 8, i === 1 ? '#000080' : '#1a3a1a'); P(x + 7, 40, '#6a8a6a'); R(x + 6, 53, 2, 12, '#7a5a3a'); R(x + 16, 53, 2, 12, '#7a5a3a'); }
      floor('#8a98a8', '#7a8898', 70, 'tiles');
    },
    cinema(o) {
      R(0, 0, LW, LH, o.night ? '#151a3a' : '#5a6aa0'); for (let i = 0; i < 12; i++) P((i * 37) % LW, (i * 13) % 20, '#fff');
      R(6, 14, 116, 62, '#8a1a2a'); for (let x = 6; x < 122; x += 6) R(x, 30, 1, 46, '#7a1424'); R(6, 14, 116, 14, '#ffd400'); R(6, 26, 116, 2, '#c8a000'); for (let i = 0; i < 28; i++) P(8 + i * 4, i % 2 ? 15 : 25, i % 3 ? '#fff' : '#ff8a00');
      R(10, 32, 26, 34, '#c9a060'); R(12, 34, 22, 30, '#111'); R(14, 36, 18, 26, '#18183a'); R(17, 44, 12, 3, '#bbb'); R(22, 40, 2, 10, '#f33'); for (let i = 0; i < 5; i++) P(15 + i * 4, 38 + (i * 7) % 20, '#fff'); // poster
      R(92, 32, 26, 34, '#c9a060'); R(94, 34, 22, 30, '#111'); R(96, 36, 18, 26, '#2a1a1a'); R(100, 42, 10, 12, '#3a9a2a'); R(102, 45, 2, 2, '#e10600'); R(106, 45, 2, 2, '#e10600');
      R(44, 34, 40, 42, '#2a0a10'); R(46, 36, 17, 40, '#c9a060'); R(65, 36, 17, 40, '#c9a060'); R(48, 38, 13, 18, '#e8d8a0'); R(67, 38, 13, 18, '#e8d8a0'); R(60, 52, 2, 6, '#ffd400'); R(66, 52, 2, 6, '#ffd400');
      R(0, 76, LW, 28, '#8a8a8a'); for (let i = -6; i <= 6; i++) line(VX + i * 14, 76, VX + i * 30, LH, '#7a7a7a'); R(0, 84, LW, 1, '#7a7a7a'); R(0, 94, LW, 1, '#7a7a7a'); R(0, 76, LW, 1, '#6a6a6a');
      for (let i = 0; i < 4; i++) { R(4 + i * 34, 70, 2, 14, '#c9a060'); R(3 + i * 34, 69, 4, 2, '#e8c070'); } line(5, 72, 37, 74, '#c02030', 2); line(39, 74, 71, 72, '#c02030', 2);
    },
    shops(o) {
      R(0, 0, LW, 30, '#8ecfff'); R(0, 10, LW, 70, '#c9b090'); for (let y = 12; y < 80; y += 4) R(0, y, LW, 1, '#bba282'); R(0, 10, LW, 4, '#a08060');
      R(6, 16, 116, 12, '#0028c8'); R(6, 16, 116, 1, '#3a5ae8'); R(6, 27, 116, 1, '#001888'); // the shop sign (lettering added on top)
      R(8, 31, 112, 44, '#2a3a4a'); R(10, 33, 108, 40, '#9fd0ff'); base.fillStyle = 'rgba(255,255,255,.35)'; base.beginPath(); base.moveTo(14, 33); base.lineTo(26, 33); base.lineTo(16, 73); base.lineTo(10, 73); base.fill();
      for (let i = 0; i < 4; i++) { const x = 16 + i * 26; R(x, 50, 18, 22, ['#e10600', '#2a7ad8', '#ffd400', '#7a7a7a'][i]); R(x, 50, 18, 1, '#fff'); R(x + 2, 52, 14, 9, '#fff'); R(x + 4, 54, 10, 5, ['#3c3', '#e10600', '#2a7ad8', '#ffd400'][i]); R(x + 4, 65, 10, 3, '#000'); }
      R(16, 39, 20, 7, '#ff6ab8'); R(56, 38, 36, 9, '#fff'); R(58, 40, 32, 5, '#e10600'); R(10, 72, 108, 2, '#c8c8c8');
      R(0, 76, LW, 28, '#9a9a9a'); for (let i = -6; i <= 6; i++) line(VX + i * 12, 76, VX + i * 28, LH, '#888'); R(0, 86, LW, 1, '#888'); R(0, 98, LW, 1, '#888'); R(0, 76, LW, 1, '#7a7a7a');
    },
    park(o) {
      R(0, 0, LW, 70, o.dark ? '#2a3050' : '#8ecfff'); if (!o.dark) { R(0, 0, LW, 8, '#7ec0f4'); oval(104, 14, 7, 7, '#ffe060'); oval(104, 14, 5, 5, '#fff090'); R(10, 10, 18, 5, '#fff'); R(14, 7, 10, 3, '#fff'); R(54, 16, 16, 4, '#fff'); } else { oval(104, 14, 6, 6, '#fff8c0'); oval(105, 14, 6, 6, '#111'); }
      R(0, 44, LW, 12, o.dark ? '#304a30' : '#7ab868'); oval(30, 48, 30, 6, o.dark ? '#304a30' : '#7ab868'); oval(96, 47, 36, 6, o.dark ? '#2a442a' : '#6aa858'); // far hills
      R(0, 52, LW, 18, o.dark ? '#2a5a28' : '#5aa040');
      for (let i = 0; i < 5; i++) { R(9 + i * 28, 50, 3, 14, '#6a4a2a'); oval(10 + i * 28, 45, 11, 9, o.dark ? '#1a4a1a' : '#2a7a2a'); oval(7 + i * 28, 42, 6, 5, o.dark ? '#245a24' : '#3a8a3a'); }
      R(0, 66, LW, 38, o.dark ? '#2a6a28' : '#5ab040'); for (let i = 0; i < 60; i++) { P((i * 29) % LW, 70 + (i * 17) % 32, o.dark ? '#245a22' : '#4aa030'); P((i * 29 + 1) % LW, 69 + (i * 17) % 32, o.dark ? '#357a30' : '#6ac050'); }
      // the path, running away into the distance
      base.fillStyle = o.dark ? '#7a6a50' : '#d4bc88'; base.beginPath(); base.moveTo(0, 86); base.lineTo(LW, 86); base.lineTo(LW, 78); base.lineTo(0, 79); base.fill(); R(0, 78, LW, 1, o.dark ? '#5a4a30' : '#b8a070');
      if (!o.nobench) { R(90, 66, 30, 3, '#7a4a1a'); R(90, 66, 30, 1, '#9a6a2a'); R(90, 60, 30, 3, '#7a4a1a'); R(90, 60, 30, 1, '#9a6a2a'); R(92, 69, 2, 8, '#444'); R(116, 69, 2, 8, '#444'); R(90, 77, 30, 1, 'rgba(0,0,0,.25)'); }
      if (o.dark) { base.fillStyle = 'rgba(10,10,40,.35)'; base.fillRect(0, 0, LW, LH); }
    },
    daves(o) {
      R(0, 0, LW, 82, '#e08a30'); for (let y = 0; y < 82; y += 6) R(0, y, LW, 1, '#d07a20'); wallShade(79, '#c8701c');
      skirting(78, '#ffffff');
      R(8, 8, 20, 26, '#fff'); R(10, 10, 16, 22, '#1f9a3a'); R(14, 14, 8, 6, '#fff'); R(12, 24, 12, 1, '#fff'); R(17, 26, 2, 4, '#fff'); // football poster
      R(94, 10, 30, 70, '#5a3a1a'); R(94, 10, 2, 70, '#7a5a3a'); R(96, 12, 26, 16, '#3a6ad0'); R(96, 12, 26, 3, '#e8e8f8'); R(96, 44, 26, 16, '#c03030'); R(96, 44, 26, 3, '#e8e8f8'); R(94, 30, 30, 3, '#5a3a1a'); R(118, 10, 4, 70, '#5a3a1a'); for (let y = 34; y < 76; y += 6) R(119, y, 3, 1, '#7a5a3a'); // bunk bed with a ladder
      R(34, 68, 34, 12, '#7a5a3a'); R(34, 68, 34, 2, '#9a7a5a'); R(42, 72, 18, 4, '#555'); R(44, 71, 3, 1, '#e10600'); // telly stand and console
      tv(35, 45, o);
      floor('#5a5a8a', '#4a4a7a', 82, 'carpet');
      layer(() => { oval(80, 87, 12, 6, '#c81a1a'); oval(80, 83, 9, 4, '#d82a2a'); oval(77, 82, 4, 2, '#f05a5a'); R(72, 90, 16, 1, '#981010'); }); // beanbag
    },
    garage(o) {
      R(0, 0, LW, 82, '#8a8a7a'); for (let x = 0; x < LW; x += 10) R(x, 0, 1, 82, '#7a7a6a'); wallShade(80, '#76766a');
      R(6, 10, 40, 30, '#c9a060'); for (let i = 0; i < 18; i++) P(8 + (i * 7) % 36, 12 + (i * 5) % 26, '#7a5a3a'); R(10, 16, 2, 10, '#555'); R(8, 15, 6, 2, '#888'); R(20, 14, 8, 3, '#e10600'); R(23, 17, 2, 8, '#888'); R(32, 18, 3, 12, '#777'); R(38, 14, 4, 6, '#ffd400'); // pegboard and tools
      R(56, 14, 30, 2, '#6a4a2a'); for (let i = 0; i < 4; i++) { R(58 + i * 7, 8, 5, 6, ['#2a7ad8', '#e8e8e8', '#3a9a2a', '#c03030'][i]); R(58 + i * 7, 8, 5, 1, '#ccc'); } // paint tins on a shelf
      R(80, 50, 46, 6, '#7a4a1a'); R(80, 50, 46, 1, '#9a6a3a'); R(82, 56, 3, 26, '#5a3a1a'); R(120, 56, 3, 26, '#5a3a1a'); R(86, 44, 10, 6, '#2a7ad8'); R(100, 46, 14, 4, '#c0c0c0'); R(86, 66, 34, 2, '#6a4a2a');
      R(0, 82, LW, 22, '#a0a0a0'); for (let i = -6; i <= 6; i++) line(VX + i * 16, 82, VX + i * 32, LH, '#959595'); R(0, 82, LW, 1, '#8a8a8a'); oval(36, 94, 10, 3, '#808080'); oval(38, 94, 5, 1, '#707070'); // concrete, oil stain
    },
    hall(o) {
      R(0, 0, LW, 82, '#d8c8a8'); for (let x = 0; x < LW; x += 6) R(x, 44, 1, 34, '#c8b898'); R(0, 43, LW, 2, '#a08a6a'); wallShade(77, '#c8b898');
      R(40, 12, 40, 70, '#111'); R(42, 14, 36, 66, o.night ? '#101a40' : '#8ecfff'); if (o.night) { P(50, 20, '#fff'); P(70, 30, '#fff'); oval(66, 24, 3, 3, '#fff8c0'); for (let i = 0; i < 3; i++) R(46 + i * 10, 70, 6, 10, '#1a1a2a'); }
      R(80, 12, 4, 70, '#6a3a1a'); R(36, 12, 4, 70, '#6a3a1a'); R(36, 10, 48, 3, '#6a3a1a'); R(36, 10, 48, 1, '#8a5a3a');
      R(92, 20, 8, 8, '#ffe080'); R(92, 20, 8, 2, '#fff0b0'); R(95, 28, 2, 4, '#555'); if (o.night) { base.fillStyle = 'rgba(255,220,120,.2)'; base.beginPath(); base.arc(96, 26, 18, 0, 7); base.fill(); }
      R(104, 30, 18, 2, '#6a4a2a'); R(106, 32, 6, 16, '#2a4a8a'); R(114, 32, 6, 13, '#8a2a2a'); // coats on hooks
      skirting(77, '#8a6a4a');
      floor('#7a5a3a', '#6a4a2a'); R(46, 84, 28, 6, '#a02a2a'); dith(46, 84, 28, 6, '#c04040'); // doormat
      R(6, 56, 22, 26, '#7a4a1a'); R(6, 56, 22, 2, '#9a6a3a'); R(8, 60, 18, 8, '#5a3a1a'); R(8, 72, 18, 1, '#5a3a1a'); // the little phone table
    },
    space(o) {
      R(0, 0, LW, LH, '#05051a'); for (let i = 0; i < 40; i++) P((i * 61) % LW, (i * 23) % LH, '#1a1440'); for (let i = 0; i < 70; i++) P((i * 53) % LW, (i * 31) % LH, i % 7 ? '#88a' : '#fff');
      oval(100, 26, 16, 16, '#c06030'); oval(96, 22, 10, 9, '#d07a40'); oval(94, 19, 3, 2, '#f0a060'); R(86, 30, 26, 2, '#a85020'); line(76, 34, 124, 18, '#e0c080', 2); line(76, 36, 124, 20, '#a08050');
      oval(20, 82, 30, 14, '#2a1a4a'); oval(14, 78, 14, 6, '#3a2a5a');
    },
    plain(o) { R(0, 0, LW, LH, o.col || '#fffbe8'); },
    dark(o) { R(0, 0, LW, LH, '#05050a'); },
  };
  // ================================================================ layers: every character and prop is painted on its own layer, then stamped onto
  // the panel with a one-pixel ink outline round its silhouette. Arms, heads and bodies are separate layers, so they each get their own line.
  const mk = () => { const k = document.createElement('canvas'); k.width = LW; k.height = LH; return k; };
  const LYR = mk(), lyc = LYR.getContext('2d', { willReadFrequently: true }), OLN = mk(), olc = OLN.getContext('2d'), CHR = mk(), chc = CHR.getContext('2d');
  const INK = '#1e1626';
  let dst = base;
  function layer(fn) { const keep = c; c = lyc; lyc.clearRect(0, 0, LW, LH); try { fn(); } finally { c = keep; } stamp(dst); }
  function stamp(to) {
    const s = lyc.getImageData(0, 0, LW, LH).data, o = olc.createImageData(LW, LH), d = o.data, row = LW * 4;
    for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
      const i = y * row + x * 4; if (s[i + 3] > 60) continue;
      if ((x > 0 && s[i - 1] > 60) || (x < LW - 1 && s[i + 7] > 60) || (y > 0 && s[i - row + 3] > 60) || (y < LH - 1 && s[i + row + 3] > 60)) { d[i] = 30; d[i + 1] = 22; d[i + 2] = 38; d[i + 3] = 255; }
    }
    olc.putImageData(o, 0, 0); to.drawImage(OLN, 0, 0); to.drawImage(LYR, 0, 0);
  }
  // a rounded box (corners cut by two pixels)
  function blob(x, y, w, h, col) { R(x + 2, y, w - 4, 1, col); R(x + 1, y + 1, w - 2, 1, col); R(x, y + 2, w, h - 4, col); R(x + 1, y + h - 2, w - 2, 1, col); R(x + 2, y + h - 1, w - 4, 1, col); }

  // ================================================================ people: one rig, lots of poses and faces
  // Arms and legs are two-bone limbs (shoulder-elbow-hand, hip-knee-foot). A pose gives each arm either two angles (degrees from
  // straight down, + is the way they face) or a target for the hand next to part of the body (sh, hip, chin, eye, cheek), and
  // the elbow works itself out. Hands are little mittens with a thumb, open four-finger hands for waving, or a pointing finger.
  const POSES = {
    stand: { f: { a: [10, 3] }, b: { a: [-10, -3] } },
    point: { f: { a: [72, 88], h: 'point' }, b: { a: [-10, -3] } },
    wave: { f: { a: [118, 172], h: 'open' }, b: { a: [-10, -3] } },
    cheer: { f: { a: [128, 160], h: 'open' }, b: { a: [-112, -148], h: 'open' } },
    shrug: { f: { a: [25, 105], h: 'open' }, b: { a: [-25, -105], h: 'open' } },
    run: { f: { a: [55, 145], h: 'fist' }, b: { a: [-60, -15], h: 'fist' } },
    sit: { f: { t: [9, 'hip', -2] }, b: { t: [6, 'hip', -2] } },
    type: { f: { t: [12, 'sh', 6], h: 'fist' }, b: { t: [10, 'sh', 7], h: 'fist' } },
    pad: { f: { t: [7, 'sh', 7], h: 'grip' }, b: { t: [4, 'sh', 8], h: 'grip' } },
    hold: { f: { t: [10, 'sh', 4], h: 'grip' }, b: { a: [-10, -3] } },
    hold2: { f: { t: [8, 'sh', 6], h: 'grip' }, b: { t: [4, 'sh', 7], h: 'grip' } },
    holdup: { f: { a: [150, 172], h: 'grip' }, b: { a: [-112, -148], h: 'open' } },
    think: { f: { t: [5, 'chin', -1], h: 'fist' }, b: { t: [3, 'sh', 8] } },
    facepalm: { f: { t: [3, 'eye', 2], h: 'open' }, b: { a: [-6, -2] } },
    shock: { f: { a: [110, 168], h: 'open' }, b: { a: [-105, -165], h: 'open' } },
    slump: { f: { a: [4, 0] }, b: { a: [-4, 0] } },
    hug: { f: { t: [12, 'sh', 3], h: 'open' }, b: { t: [11, 'sh', 4], h: 'open' } },
    fall: { f: { a: [110, 150], h: 'open' }, b: { a: [-105, -150], h: 'open' } },
    sitfloor: { f: { t: [7, 'sh', 8], h: 'grip' }, b: { t: [4, 'sh', 9], h: 'grip' } },
    pointup: { f: { a: [160, 176], h: 'point' }, b: { a: [-10, -3] } },
    hips: { f: { t: [6, 'hip', -1], bend: 'out' }, b: { t: [-6, 'hip', -1], bend: 'out' } },
    cross: { f: { t: [-3, 'sh', 6], h: 'mitt' }, b: { t: [4, 'sh', 5] } },
    phone: { f: { t: [6, 'cheek', 1], h: 'grip' }, b: { a: [-10, -3] } },
  };
  const TWO_HANDS = { pcbox: 1, poster: 1, cables: 1, gameboy: 1, gbc: 1, tama: 1, mag: 1, notepad: 1, letter: 1, card: 1, list: 1, coins: 1, crisps: 1, glasses: 1, popcorn: 1, furby: 1, paint: 1 };
  // where does the elbow go? (two-bone IK; bend 'out' pushes the elbow away from the body, otherwise it drops downwards)
  function joint(sx, sy, tx, ty, L1, L2, bend, cx) {
    const dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 1;
    if (d >= L1 + L2 - 0.2) { const k = (L1 + L2) / d; return [sx + dx * L1 / d, sy + dy * L1 / d, sx + dx * k, sy + dy * k]; }
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), mx = sx + dx * a / d, my = sy + dy * a / d;
    const e1 = [mx - dy * h / d, my + dx * h / d], e2 = [mx + dy * h / d, my - dx * h / d];
    const pick = bend === 'out' ? (Math.abs(e1[0] - cx) > Math.abs(e2[0] - cx) ? e1 : e2) : (e1[1] > e2[1] ? e1 : e2);
    return [pick[0], pick[1], tx, ty];
  }
  function hand(hx, hy, dx, dy, type, skin, f) {
    const px = -dy, py = dx, s = (px * f - py) >= 0 ? 1 : -1, cx = Math.round(hx + dx * 0.7), cy = Math.round(hy + dy * 0.7);
    const at = (r, ang, len) => { const ca = Math.cos(ang), sa = Math.sin(ang), vx = dx * ca - dy * sa, vy = dx * sa + dy * ca; line(cx + vx * r, cy + vy * r, cx + vx * (r + len), cy + vy * (r + len), skin, 1); };
    if (type === 'open') { // a big friendly open hand: round palm, a thumb, and two finger creases
      const ox = Math.round(hx + dx * 1.6), oy = Math.round(hy + dy * 1.6); R(ox - 1, oy - 2, 3, 5, skin); R(ox - 2, oy - 1, 5, 3, skin);
      P(Math.round(ox + px * s * 3 - dx), Math.round(oy + py * s * 3 - dy), skin); P(Math.round(ox + px * s * 2.5 - dx * 0.5), Math.round(oy + py * s * 2.5 - dy * 0.5), skin);
      const cr = shade(skin, 0.78); for (const q of [-1, 1]) { P(Math.round(ox + px * q * 0.9 + dx * 1.6), Math.round(oy + py * q * 0.9 + dy * 1.6), cr); } return; }
    R(cx - 1, cy - 1, 3, 3, skin);
    if (type === 'point') { at(1.4, 0, 3.2); at(1, 1.2 * s, 1); return; }
    if (type === 'fist') { P(Math.round(cx + px * s * 1.6), Math.round(cy + py * s * 1.6), shade(skin, 0.92)); return; }
    P(Math.round(cx + px * s * 1.8 + dx * 0.4), Math.round(cy + py * s * 1.8 + dy * 0.4), skin); // the thumb on a mitten (and a grip)
  }
  // a whole arm: upper arm in sleeve colour, forearm in sleeve (or skin, for short sleeves), mitten at the end. Returns the hand.
  function limbArm(sx, sy, spec, f, len, sleeve, fore, skin, anchors, x, drawHand) {
    const r = d => d * Math.PI / 180, u = len / 2;
    let ex, ey, hx, hy;
    if (spec.t) { const [ddx, an, ddy] = spec.t, A = anchors[an] || anchors.sh; [ex, ey, hx, hy] = joint(sx, sy, x + f * ddx, A + ddy, u, u, spec.bend, x); }
    else { const [a1, a2] = spec.a; ex = sx + f * Math.sin(r(a1)) * u; ey = sy + Math.cos(r(a1)) * u; hx = ex + f * Math.sin(r(a2)) * u; hy = ey + Math.cos(r(a2)) * u; }
    R(sx - 1, sy - 1, 3, 3, sleeve); line(sx, sy, ex, ey, sleeve, 3); R(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3, fore === sleeve ? sleeve : fore); line(ex, ey, hx, hy, fore, 3);
    const dl = Math.hypot(hx - ex, hy - ey) || 1, H = { x: Math.round(hx), y: Math.round(hy), dx: (hx - ex) / dl, dy: (hy - ey) / dl, type: spec.h || 'mitt' };
    if (drawHand !== false) hand(H.x, H.y, H.dx, H.dy, H.type, skin, f);
    return H;
  }
  // a whole leg: thigh and shin, then a shoe pointing the way they face
  function limbLeg(hx, hy, kx, ky, fx, fy, col, shoe, f) {
    line(hx, hy, kx, ky, col, 4); line(kx, ky, fx, fy, col, 4);
    const sx = Math.round(fx) - (f > 0 ? 2 : 3); R(sx, Math.round(fy) - 1, 6, 3, shoe); R(sx, Math.round(fy) + 1, 6, 1, shade(shoe, 0.7));
  }

  // little pixel stamps: each row a string, '.' is see-through, the letters look up colours in pal (mirrored when flip)
  function pat(x0, y0, rows, pal, flip) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const ch = r[flip ? r.length - 1 - i : i]; if (ch !== '.') P(x0 + i, y0 + j, pal[ch]); } }); }
  const EYES = { // 4x5 boxes round each 2-pixel eye
    open: ['....', '.kw.', '.kk.', '.kk.', '....'], happy: ['....', '....', '.kk.', 'k..k', '....'], down: ['....', '....', 'k..k', '.kk.', '....'],
    line: ['....', '....', '....', 'kkkk', '....'], wide: ['.kk.', 'kwwk', 'kwkk', 'kwwk', '.kk.'], lid: ['....', '....', 'kkkk', '.kk.', '....'],
    angry: ['....', '....', '.kw.', '.kk.', '....'], x: ['....', 'k.k.', '.k..', 'k.k.', '....'], up: ['.kw.', '.kk.', '....', '....', '....'],
  };
  const MOUTHS = {
    neutral: ['mmm'], happy: ['m..m', '.mm.'], grin: ['iiiiii', 'iwwwwi', '.ippi.'], laugh: ['iiiiii', 'iwwwwi', 'ippppi', '.iiii.'],
    shock: ['.ii.', 'iiii', 'ippi', '.ii.'], yell: ['iiiiii', 'iwwwwi', 'iiiiii', 'iippii', '.iiii.'], angry: ['iiiii', 'iwiwi', 'iiiii'], sad: ['.mm.', 'm..m'],
    cry: ['.ii.', 'iiii', 'm..m'], ko: ['.m.m.', 'm.m.m'], worried: ['.m.m', 'm.m.'], smug: ['...m', 'mmm.'], think: ['.mm'], sleep: ['ii', 'ii'], wink: ['m..m', '.mm.'],
  };
  // faces: hx/hy/hw/hh is the head box, f the way they face (the face sits a pixel towards that side, three-quarter view)
  function face(k, hx, hy, hw, hh, f, ex) {
    const cx = hx + (hw >> 1), e1 = cx - 4 + f, e2 = cx + 2 + f, ey = hy + 6, my = hy + hh - 5, mc = cx + f;
    const BR = k.hair === 'bald' ? shade(k.hc, 0.7) : shade(k.hc || '#5a3a2a', 0.55);
    const pal = { k: INK, w: '#ffffff', m: k.lips || '#8a1e2a', i: '#40101a', p: '#e8606a', b: BR };
    const fl = f < 0, E = (x, kind, flip) => pat(x - 1, ey - 1, EYES[kind], pal, flip === undefined ? fl : flip);
    const brow = (x, rows) => pat(x - 1, ey - 3, rows, pal, false);
    const eyes = { happy: 'happy', laugh: 'happy', shock: 'wide', yell: 'angry', angry: 'angry', cry: 'down', ko: 'x', smug: 'lid', think: 'up', sleep: 'line' }[ex] || 'open';
    if (ex === 'wink') { E(e1, f > 0 ? 'open' : 'happy'); E(e2, f > 0 ? 'happy' : 'open'); } else { E(e1, eyes); E(e2, eyes); }
    if (k.fem && eyes !== 'wide') { P(e1 - 1, ey - 1 + (eyes === 'open' || eyes === 'angry' ? 0 : 2), INK); P(e2 + 2, ey - 1 + (eyes === 'open' || eyes === 'angry' ? 0 : 2), INK); }
    if (ex === 'angry' || ex === 'yell') { brow(e1, ['bb..', '..bb']); brow(e2, ['..bb', 'bb..']); }
    else if (ex === 'sad' || ex === 'worried' || ex === 'cry') { brow(e1, ['..bb', 'bb..']); brow(e2, ['bb..', '..bb']); }
    else if (ex === 'shock') { pat(e1 - 1, ey - 4, ['.bb.'], pal); pat(e2 - 1, ey - 4, ['.bb.'], pal); }
    else if (ex === 'smug' || ex === 'think') { const e = f > 0 ? e2 : e1; pat(e - 1, ey - 4, ['.bb.', 'b..b'], pal); }
    if (ex === 'happy' || ex === 'grin' || ex === 'laugh' || ex === 'wink') { R(e1 - 1, ey + 3, 2, 1, '#f4a08e'); R(e2 + 1, ey + 3, 2, 1, '#f4a08e'); }
    if (ex === 'cry') { R(e1, ey + 3, 1, 4, '#5ab0ff'); R(e2 + 1, ey + 3, 1, 3, '#5ab0ff'); }
    if (ex === 'worried') { const sx = f > 0 ? hx + 1 : hx + hw - 2; R(sx, hy + 3, 1, 2, '#9ad8ff'); R(sx - 1, hy + 5, 3, 1, '#5ab0ff'); }
    // nose: a darker pixel on the side they face
    const nx = cx + f * 2 + (f > 0 ? 1 : -1); P(nx, ey + 3, shade(k.skin, 0.78)); if (!k.kid) P(nx + f, ey + 3, shade(k.skin, 0.86));
    const m = MOUTHS[ex] || MOUTHS.neutral, w = m[0].length;
    pat(Math.round(mc - w / 2), my - (m.length > 3 ? 1 : 0), m, pal, fl);
  }
  function hair(k, hx, hy, hw, hh, f) {
    const H = k.hc, D = shade(H, 0.72), L = shade(H, 1.35), cx = hx + (hw >> 1), bk = f > 0 ? hx - 1 : hx + hw - 1, fr = f > 0 ? hx + hw - 2 : hx;
    switch (k.hair) {
      case 'messy': R(hx - 1, hy - 1, hw + 2, 4, H); R(hx, hy - 2, hw, 1, H); for (let i = 0; i < hw; i += 3) R(hx + i, hy - 3 - (i % 2), 2, 2, H); R(bk, hy + 2, 2, 6, H); for (let i = 0; i < 5; i++) R(hx + (f > 0 ? 6 : 3) + i * 2 - (f < 0 ? 0 : 0), hy + 3, 1, 1 + (i % 2), H); R(hx + 2, hy - 1, 5, 1, L); break;
      case 'curtains': R(hx - 1, hy - 2, hw + 2, 4, H); R(hx + 1, hy - 3, hw - 2, 1, H); R(hx - 1, hy + 2, (hw >> 1) - 1, 3, H); R(hx + (hw >> 1) + 1, hy + 2, (hw >> 1), 3, H); R(hx - 1, hy + 5, 2, 4, H); R(hx + hw - 1, hy + 5, 2, 4, H); R(cx - 1, hy, 2, 2, D); R(hx + 1, hy - 2, 4, 1, L); R(hx + hw - 5, hy - 2, 4, 1, L); break;
      case 'bunches': R(hx - 1, hy - 2, hw + 2, 5, H); R(hx + 1, hy - 3, hw - 2, 1, H); R(hx, hy + 3, hw, 1, H); R(bk, hy + 3, 2, 5, H); oval(hx - 3, hy + 6, 3, 3, H); oval(hx + hw + 2, hy + 6, 3, 3, H); R(hx - 1, hy + 4, 2, 2, k.bob); R(hx + hw - 1, hy + 4, 2, 2, k.bob); R(hx + 2, hy - 2, 5, 1, L); break;
      case 'curly': oval(cx, hy, (hw >> 1) + 3, 5, H); oval(f > 0 ? hx - 1 : hx + hw, hy + 7, 3, 6, H); oval(f > 0 ? hx + hw : hx - 1, hy + 4, 2, 3, H);
        for (const [dx, dy] of [[0, -2], [3, -3], [7, -3], [10, -2], [13, 0], [2, 1], [6, 0], [11, 2], [-2, 4], [-2, 8]]) P(f > 0 ? hx + dx : hx + hw - 1 - dx, hy + dy, D); P(f > 0 ? hx + 3 : hx + hw - 4, hy - 3, L); P(f > 0 ? hx + 4 : hx + hw - 5, hy - 3, L); break;
      case 'bald': R(bk - (f > 0 ? 0 : 0), hy + 4, 2, 5, H); R(f > 0 ? hx + hw - 1 : hx, hy + 4, 1, 3, H); R(cx - 3 - f, hy + 1, 2, 1, '#fff'); P(cx - 4 - f, hy + 2, '#fff'); break;
      case 'bun': R(hx - 1, hy - 1, hw + 2, 4, H); R(hx + 1, hy - 2, hw - 2, 1, H); R(bk, hy + 3, 2, 5, H); oval(cx, hy - 4, 4, 3, H); R(cx - 2, hy - 5, 2, 1, '#fff'); P(cx + 2, hy - 3, D); for (let i = 1; i < hw; i += 3) P(hx + i, hy + 1, D); break;
      case 'neat': R(hx - 1, hy - 2, hw + 2, 4, H); R(hx + 1, hy - 3, hw - 2, 1, H); R(bk, hy + 2, 2, 6, H); R(f > 0 ? hx + 3 : hx + hw - 5, hy - 2, 3, 1, L); P(f > 0 ? hx + 4 : hx + hw - 5, hy + 1, D); break;
      case 'short': R(hx - 1, hy - 2, hw + 2, 4, H); R(hx + 1, hy - 3, hw - 2, 1, H); R(bk, hy + 2, 2, 5, H); R(f > 0 ? hx + hw - 3 : hx + 1, hy + 2, 2, 1, H); P(f > 0 ? hx + hw - 2 : hx + 1, hy + 3, H); R(f > 0 ? hx + 2 : hx + hw - 6, hy - 2, 4, 1, L); P(bk + (f > 0 ? 1 : 0), hy + 7, D); break;
      case 'bob': R(hx - 1, hy - 2, hw + 2, 5, H); R(hx + 1, hy - 3, hw - 2, 1, H); R(f > 0 ? hx - 2 : hx + hw - 1, hy + 2, 3, 10, H); R(f > 0 ? hx + hw - 1 : hx, hy + 3, 1, 8, H);
        R(f > 0 ? hx : hx + 7, hy + 3, hw - 7, 1, H); R(f > 0 ? hx : hx + 10, hy + 4, 4, 1, H); P(f > 0 ? hx - 2 : hx + hw + 1, hy + 11, D); R(f > 0 ? hx - 1 : hx + hw - 1, hy + 11, 2, 1, D); P(f > 0 ? hx + hw - 1 : hx, hy + 10, D);
        R(f > 0 ? hx + 2 : hx + hw - 7, hy - 2, 5, 1, L); P(f > 0 ? hx + 1 : hx + hw - 2, hy - 1, L); R(f > 0 ? hx - 1 : hx + hw, hy + 4, 1, 5, L); P(cx + (f > 0 ? 3 : -4), hy - 2, D); break;
      case 'gelled': R(hx - 1, hy - 1, hw + 2, 4, H); for (let i = 0; i < 5; i++) line(hx + 1 + i * 3, hy - 1, hx + 1 + i * 3 + f * 2, hy - 5 - (i % 2) * 2, H, 2); R(bk, hy + 3, 2, 4, H); R(hx + 3, hy, 6, 1, L); break;
    }
  }
  function torso(k, x, y, w, h, f) {
    const T = k.top, D = shade(T, 0.8);
    R(x + 1, y, w - 2, 1, T); R(x, y + 1, w, h - 1, T); R(f > 0 ? x : x + w - 1, y + 1, 1, h - 1, D);
    if (k.pat === 'stripes') for (let yy = y + 3; yy < y + h - 1; yy += 3) R(x, yy, w, 1, k.pc);
    else if (k.pat === 'sport') { R(x + (w >> 1) - 2, y, 4, 2, k.pc); R(x + (w >> 1) - 1, y + 2, 2, 1, k.pc); R(x + 1, y + h - 3, w - 2, 1, shade(T, 0.75)); R(f > 0 ? x + w - 5 : x + 2, y + 4, 3, 3, '#fff'); P(f > 0 ? x + w - 4 : x + 3, y + 5, T); }
    else if (k.pat === 'jacket') { R(x + (w >> 1) - (f > 0 ? 0 : 1), y + 1, 1, h - 1, shade(T, 0.6)); R(x + (w >> 1) - 2, y, 4, 2, k.pc); R(x, y + h - 2, w, 2, k.pc); }
    else if (k.pat === 'cardigan') { R(x + (w >> 1) - 2, y, 4, h, k.pc); for (let yy = y + 2; yy < y + h; yy += 3) P(x + (w >> 1) + (f > 0 ? 2 : -3), yy, shade(T, 0.6)); }
    else if (k.pat === 'jumper') { for (let xx = 0; xx < w; xx++) P(x + xx, y + 5 + (xx % 2), k.pc); for (let xx = 1; xx < w; xx += 2) P(x + xx, y + 8, k.pc); R(x, y + h - 2, w, 2, D); R(x + (w >> 1) - 2, y, 4, 1, shade(T, 0.6)); }
    else if (k.pat === 'shirt') { R(x + (w >> 1) - 2, y, 4, 2, '#fff'); R(x + (w >> 1) - 1, y + 1, 2, h - 3, k.pc); P(x + (w >> 1) - 1, y + 1, shade(k.pc, 0.7)); R(f > 0 ? x + w - 4 : x + 2, y + 3, 2, 3, '#2a7ad8'); }
    else if (k.pat === 'tabard') { R(x + 2, y + 1, w - 4, h - 1, k.pc); R(x + 3, y + 5, w - 6, 2, '#fff'); }
    else if (k.pat === 'logo') { R(x + (w >> 1) - 2, y + 3, 5, 4, k.pc); P(x + (w >> 1), y + 4, '#22222c'); R(x + (w >> 1) - 2, y, 4, 1, '#44444c'); }
    else if (k.pat === 'plain') { R(x + (w >> 1) - 2, y, 4, 1, D); }
  }
  function person(k, o) {
    const f = o.f || 1, kid = !!k.kid;
    const legL = (kid ? 13 : 18) + (k.tall || 0) - (k.short ? 3 : 0), tw = kid ? 12 : 14, th = kid ? 12 : 16, hw = kid ? 16 : 14, hh = 15, armL = kid ? 14 : 17;
    const x = Math.round(o.x), gy = G + (o.y || 0);
    let pose = o.pose || 'stand';
    if (o.hold === 'phone' && pose === 'hold') pose = 'phone';
    else if (o.hold && TWO_HANDS[o.hold] && pose === 'hold') pose = 'hold2';
    else if (o.hold && pose === 'cheer' && o.hold !== 'saber') pose = 'holdup';
    const sitting = pose === 'sit' || pose === 'type', floorSit = pose === 'sitfloor' || (o.pad && pose === 'sitfloor');
    const hipY = sitting ? gy - 13 : floorSit ? gy - 4 : gy - legL - (pose === 'shock' ? 2 : 0);
    const topY = hipY - th, hy = topY - hh + 2, hx = x - (hw >> 1);
    const skin = k.skin, back = shade(k.top, 0.72), trous = k.legs, shoe = k.shoes, tB = shade(trous, 0.78);
    const A = POSES[pose] || POSES.stand, sy = topY + 3, sxF = x + f * ((tw >> 1) - 1), sxB = x - f * ((tw >> 1) - 1);
    const anchors = { sh: sy, hip: hipY, chin: hy + hh, eye: hy + 6, cheek: hy + 10 };
    const foreF = k.ss ? skin : k.top, foreB = k.ss ? shade(skin, 0.88) : back;
    if (sitting && !o.nochair) layer(() => { R(x - f * 7 - 1, hipY - 16, 3, 29, '#6a3e1e'); R(x - f * 7 - 1, hipY - 16, 3, 1, '#8a5a2e'); R(x - 8, hipY + 1, 16, 3, '#8a5a2e'); R(x - 7, hipY + 4, 2, 9, '#6a3e1e'); R(x + 5, hipY + 4, 2, 9, '#6a3e1e'); });
    // the far leg (when the legs are apart) and the far arm sit behind the body
    const legs = pose === 'run' || pose === 'fall';
    layer(() => {
      if (sitting) limbLeg(x - f * 2, hipY - 1, x + f * 6, hipY - 1, x + f * 6, gy - 2, tB, shade(shoe, 0.85), f);
      else if (floorSit) limbLeg(x - f, hipY - 1, x + f * 5, hipY - 8, x + f * 9, gy - 2, tB, shade(shoe, 0.85), f);
      else if (pose === 'run') limbLeg(x - f, hipY, x - f * 3, hipY + 6, x - f * 9, gy - 6, tB, shade(shoe, 0.85), f);
      else if (pose === 'fall') limbLeg(x - f, hipY, x - f * 5, hipY + 5, x - f * 8, gy - 1, tB, shade(shoe, 0.85), f);
    });
    let handB = null;
    layer(() => { handB = limbArm(sxB, sy, A.b, f, armL, back, foreB, shade(skin, 0.88), anchors, x); });
    layer(() => {
      if (sitting) { R(f > 0 ? x - 4 : x - 9, hipY - 3, 14, 5, trous); limbLeg(x + f, hipY - 1, x + f * 9, hipY - 1, x + f * 9, gy - 2, trous, shoe, f); }
      else if (floorSit) { R(x - 6, hipY - 3, 12, 5, trous); limbLeg(x + f * 2, hipY - 1, x + f * 8, hipY - 8, x + f * 12, gy - 2, trous, shoe, f); }
      else if (pose === 'run') { R(x - 5, hipY - 2, 10, 3, trous); limbLeg(x + f, hipY, x + f * 6, hipY + 5, x + f * 7, gy - 2, trous, shoe, f); }
      else if (pose === 'fall') { R(x - 5, hipY - 2, 10, 3, trous); limbLeg(x + f, hipY, x + f * 8, hipY + 3, x + f * 12, hipY + 7, trous, shoe, f); }
      else if (k.skirt) {
        R(x - 4, hipY, 3, legL, k.legs); R(x + 1, hipY, 3, legL, k.legs); R(x - 7, hipY - 2, 14, Math.round(legL * 0.62), k.skirt); R(x - 7, hipY - 2 + Math.round(legL * 0.62) - 1, 14, 1, shade(k.skirt, 0.75));
        R(x - 5 + (f > 0 ? 0 : -1), gy - 3, 5, 3, shoe); R(x + 1 + (f > 0 ? 0 : -1), gy - 3, 5, 3, shoe);
      } else {
        R(x - 5, hipY - 1, 10, 3, trous); R(x - 5, hipY, 4, legL - 1, trous); R(x + 1, hipY, 4, legL - 1, trous); R(x - 2, hipY, 1, 3, shade(trous, 0.7));
        R(x - 5 + (f > 0 ? 0 : -2), gy - 3, 6, 3, shoe); R(x + 1 + (f > 0 ? 0 : -2), gy - 3, 6, 3, shoe); R(x - 5 + (f > 0 ? 0 : -2), gy - 1, 6, 1, shade(shoe, 0.7)); R(x + 1 + (f > 0 ? 0 : -2), gy - 1, 6, 1, shade(shoe, 0.7));
      }
      R(x - 2, topY - 2, 4, 3, shade(skin, 0.85)); // neck
      torso(k, x - (tw >> 1), topY, tw, th, f);
    });
    layer(() => {
      blob(hx, hy, hw, hh, skin); c.clearRect(hx + 2, hy + hh - 1, 1, 1); c.clearRect(hx + hw - 3, hy + hh - 1, 1, 1); c.clearRect(hx, hy + hh - 3, 1, 1); c.clearRect(hx + hw - 1, hy + hh - 3, 1, 1);
      R(f > 0 ? hx - 1 : hx + hw - 1, hy + 6, 2, 3, skin); P(f > 0 ? hx : hx + hw - 1, hy + 7, shade(skin, 0.8)); // ear, round the back
      R(f > 0 ? hx + 1 : hx + hw - 2, hy + hh - 4, 1, 2, shade(skin, 0.9));
      if (k.beard) { R(hx + 1, hy + hh - 4, hw - 2, 4, k.beard === 1 ? k.hc : k.beard); R(hx, hy + 8, 2, 5, k.beard === 1 ? k.hc : k.beard); R(hx + hw - 2, hy + 8, 2, 5, k.beard === 1 ? k.hc : k.beard); }
      hair(k, hx, hy, hw, hh, f);
      face(k, hx, hy, hw, hh, f, o.ex || 'neutral');
      if (k.glasses) { const ey = hy + 6, F = k.gl || '#4a4a68', cx = hx + (hw >> 1); const Lt = k.gl2 || '#b8c8d8'; for (const ex of [cx - 4 + f, cx + 2 + f]) { R(ex - 2, ey - 2, 6, 1, F); R(ex - 1, ey + 3, 4, 1, Lt); R(ex - 2, ey - 1, 1, 4, Lt); R(ex + 3, ey - 1, 1, 4, Lt); P(ex - 1, ey - 1, '#ffffff'); } R(cx + f, ey - 2, 1, 1, F); R(f > 0 ? hx : hx + hw - 2, ey - 2, 2, 1, F); }
      if (k.tache) { const tx = hx + (hw >> 1) + f - 3; R(tx, hy + hh - 6, 6, 1, shade(k.hc, 0.8)); P(tx, hy + hh - 5, shade(k.hc, 0.8)); P(tx + 5, hy + hh - 5, shade(k.hc, 0.8)); }
      if (k.cap && !o.nocap) { const C = k.cap; R(hx + 2, hy - 4, hw - 4, 1, C); R(hx, hy - 3, hw, 2, C); R(hx - 1, hy - 1, hw + 2, 3, C); R(hx + 3, hy - 3, 4, 1, shade(C, 1.4)); R((f > 0) !== !!k.capback ? hx + hw - 2 : hx - 5, hy + 1, 7, 2, shade(C, 0.72)); R(hx - 1, hy + 1, hw + 2, 1, shade(C, 0.8)); P(hx + (hw >> 1), hy - 4, shade(C, 0.6));
        if (k.capf) { const fx0 = f > 0 ? hx + (hw >> 1) : hx + 1, fw = (hw >> 1) - 1; R(fx0, hy - 3, fw, 3, k.capf); R(fx0, hy - 3, fw, 1, shade(k.capf, 1.1)); R(fx0, hy - 1, fw, 1, shade(k.capf, 0.88)); if (k.capdot) { const bx = f > 0 ? fx0 + 2 : fx0 + fw - 4; R(bx, hy - 3, 2, 2, k.capdot); P(bx + (f > 0 ? 1 : 0), hy - 3, shade(k.capdot, 1.3)); } } }
      if (o.ex === 'ko' || o.dizzy) for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4, sx = x + Math.cos(a) * 11, sy2 = hy - 3 + Math.sin(a) * 3; R(sx - 1, sy2, 3, 1, '#ffd400'); R(sx, sy2 - 1, 1, 3, '#ffd400'); }
    });
    let handF = null;
    layer(() => {
      handF = limbArm(sxF, sy, A.f, f, armL, k.top, foreF, skin, anchors, x, false);
      const two = pose === 'hold2' || pose === 'pad' || floorSit && (o.pad || o.hold);
      const mx = two ? Math.round((handF.x + handB.x) / 2) : handF.x, my = two ? Math.round((handF.y + handB.y) / 2) : handF.y;
      if (pose === 'pad' || o.pad) prop('pad', mx, my);
      if (o.hold === 'phone') prop('phone', handF.x, handF.y, f);
      else if (o.hold) prop(o.hold, two ? mx + f : handF.x + f * 2, two ? my - 2 : handF.y - (pose === 'holdup' ? 4 : 2), f);
      hand(handF.x, handF.y, handF.dx, handF.dy, handF.type, skin, f); // the hand goes on last, so it grips whatever it's holding
    });
    if (pose === 'run') { for (let i = 0; i < 3; i++) R(x - f * (17 + i * 3) - (f < 0 ? 6 : 0), hipY - 9 + i * 6, 7, 1, '#fff'); }
    if (o.zzz) { overlays.push({ t: 'z', x: hx + hw + 2, y: hy - 2, size: 12, col: '#333' }, { t: 'Z', x: hx + hw + 6, y: hy - 8, size: 16, col: '#333' }); }
    if (k.text || o.text) overlays.push({ t: o.text || k.text, x: x, y: topY + th / 2 + 1, size: 10, col: '#fff', center: 1, bold: 1, stroke: '#000' });
    return { hx: x, hy: hy, r: [hx - 3, hy - 5, hx + hw + 3, hy + hh] };
  }
  // the family cat (named by js/cast.js): a ginger tabby, side-on
  function cat(o) {
    const f = o.f || 1, x = Math.round(o.x), y = G + (o.y || 0), O = '#f08a24', D = '#c25a14', L = '#ffb25a', W = '#fff4e0';
    const RF = (a, yy, w, h, col) => R(f > 0 ? x + a : x - a - w + 1, yy, w, h, col), PF = (a, yy, col) => RF(a, yy, 1, 1, col);
    if (o.pose === 'sleep') {
      layer(() => { oval(x, y - 4, 10, 4, O); R(x - 10, y - 1, 21, 1, O); RF(-8, y - 8, 3, 1, D); RF(-3, y - 9, 3, 1, D); RF(2, y - 8, 3, 1, D); RF(-10, y - 1, 16, 1, D); // loaf + tail round the front
        oval(f > 0 ? x + 8 : x - 8, y - 6, 5, 4, O); RF(5, y - 11, 2, 2, O); RF(10, y - 11, 2, 2, O); RF(8, y - 5, 4, 2, W); RF(6, y - 7, 2, 1, INK); RF(10, y - 7, 2, 1, INK); });
      overlays.push({ t: 'z', x: f > 0 ? x + 12 : x - 12, y: y - 15, size: 11, col: '#333' }); return { hx: x + f * 8, hy: y - 12, r: [x - 12, y - 12, x + 14, y] };
    }
    const ex = o.ex || 'neutral';
    layer(() => {
      // tail curling up behind
      line(x - f * 6, y - 2, x - f * 11, y - 3, O, 2); line(x - f * 11, y - 3, x - f * 13, y - 9, O, 2); line(x - f * 13, y - 9, x - f * 12, y - 13, O, 2); RF(-13, y - 13, 2, 2, D);
      // body
      oval(x - f, y - 6, 6, 6, O); R(x - 7, y - 2, 13, 2, O); RF(-6, y - 9, 2, 1, D); RF(-5, y - 6, 2, 1, D); RF(-6, y - 3, 2, 1, D); RF(-3, y - 11, 2, 1, D);
      RF(1, y - 8, 4, 6, W); // chest
      RF(1, y - 4, 2, 4, O); RF(4, y - 4, 2, 4, O); RF(1, y - 1, 2, 1, W); RF(4, y - 1, 2, 1, W); // front paws
      if (o.green) { RF(0, y - 1, 3, 1, '#3c9a2a'); RF(4, y - 1, 3, 1, '#3c9a2a'); RF(-6, y - 1, 3, 1, '#3c9a2a'); }
      // head: round, with upright ears and a little muzzle
      oval(x + f * 3, y - 15, 6, 5, O); RF(-2, y - 20, 4, 1, O); RF(-2, y - 21, 3, 1, O); RF(-2, y - 22, 1, 1, O); RF(5, y - 20, 4, 1, O); RF(6, y - 21, 3, 1, O); RF(8, y - 22, 1, 1, O); PF(-1, y - 20, '#ff9aa0'); PF(7, y - 20, '#ff9aa0');
      RF(1, y - 20, 1, 2, D); RF(3, y - 20, 1, 2, D); RF(5, y - 20, 1, 1, D); RF(-3, y - 15, 2, 1, D); RF(-3, y - 13, 2, 1, D);
      RF(3, y - 13, 5, 3, W); PF(5, y - 13, '#ff7a8a'); PF(4, y - 11, '#c25a14'); PF(6, y - 11, '#c25a14'); // muzzle + nose
      if (ex === 'shock') { RF(0, y - 18, 3, 3, '#e8ff60'); PF(1, y - 17, INK); RF(5, y - 18, 3, 3, '#e8ff60'); PF(6, y - 17, INK); RF(4, y - 12, 2, 2, '#40101a'); }
      else if (ex === 'smug' || ex === 'sleep') { RF(0, y - 16, 3, 1, INK); RF(5, y - 16, 3, 1, INK); RF(1, y - 17, 2, 1, '#a8d040'); RF(6, y - 17, 2, 1, '#a8d040'); }
      else { RF(1, y - 17, 2, 3, '#a8d040'); PF(1 + (f > 0 ? 1 : 0), y - 16, INK); PF(1 + (f > 0 ? 1 : 0), y - 15, INK); RF(5, y - 17, 2, 3, '#a8d040'); PF(5 + (f > 0 ? 1 : 0), y - 16, INK); PF(5 + (f > 0 ? 1 : 0), y - 15, INK); }
      RF(-4, y - 9, 3, 1, L);
    });
    return { hx: x + f * 3, hy: y - 21, r: f > 0 ? [x - 4, y - 23, x + 11, y - 9] : [x - 11, y - 23, x + 4, y - 9] };
  }
  // Gubbinz the grot: small, green, ears like a bat's, a grin with too many teeth
  function grot(o) {
    const f = o.f || 1, x = Math.round(o.x), y = G + (o.y || 0), Gc = '#4aa832', D = '#2e7a1e', L = '#7ad050', T = '#8a5a2a';
    const RF = (a, yy, w, h, col) => R(f > 0 ? x + a : x - a - w + 1, yy, w, h, col), PF = (a, yy, col) => RF(a, yy, 1, 1, col);
    const up = o.pose === 'cheer' || o.pose === 'shock', ex = o.ex || 'grin';
    layer(() => { line(x - f * 3, y - 16, x - f * (up ? 8 : 7), y - (up ? 27 : 9), D, 2); });
    layer(() => {
      R(x - 4, y - 8, 3, 7, D); R(x + 1, y - 8, 3, 7, D); RF(-5, y - 2, 5, 2, '#3a2a1a'); RF(1, y - 2, 5, 2, '#3a2a1a'); // legs + feet
      R(x - 5, y - 17, 10, 10, T); R(x - 5, y - 9, 10, 2, shade(T, 0.75)); for (let i = 0; i < 5; i++) P(x - 5 + i * 2, y - 7, T); RF(-2, y - 15, 3, 3, shade(T, 1.2)); // ragged tunic with a patch
      R(x - 2, y - 19, 4, 2, Gc);
    });
    layer(() => {
      // head: wide at the top, long nose, huge ears
      blob(x - 7, y - 31, 14, 12, Gc); R(x - 6, y - 31, 12, 2, L);
      line(x - 7, y - 26, x - 14, y - 32, Gc, 2); line(x - 7, y - 25, x - 12, y - 28, Gc, 2); P(x - 14, y - 33, Gc); P(x - 10, y - 28, '#ff9a9a');
      line(x + 6, y - 26, x + 13, y - 32, Gc, 2); line(x + 6, y - 25, x + 11, y - 28, Gc, 2); P(x + 13, y - 33, Gc); P(x + 9, y - 28, '#ff9a9a');
      RF(6, y - 26, 3, 2, Gc); PF(8, y - 25, D); // pointy nose
      if (ex === 'shock') { RF(-3, y - 29, 3, 3, '#fff'); PF(-2, y - 28, '#e10600'); RF(2, y - 29, 3, 3, '#fff'); PF(3, y - 28, '#e10600'); RF(-1, y - 23, 3, 3, '#300'); }
      else { RF(-3, y - 28, 3, 2, '#ffe040'); PF(-2 + (f > 0 ? 1 : 0), y - 28, '#e10600'); RF(2, y - 28, 3, 2, '#ffe040'); PF(3 + (f > 0 ? 1 : 0), y - 28, '#e10600'); RF(-4, y - 29, 4, 1, D); RF(2, y - 29, 4, 1, D); }
      if (ex === 'grin' || ex === 'happy' || ex === 'yell') { RF(-4, y - 24, 9, 3, '#300'); for (let i = 0; i < 4; i++) { PF(-4 + i * 2, y - 24, '#fff'); PF(-3 + i * 2, y - 22, '#fff'); } }
      else if (ex !== 'shock') RF(-3, y - 23, 6, 1, '#300');
    });
    layer(() => { line(x + f * 3, y - 16, x + f * (up ? 8 : 7), y - (up ? 27 : 9), Gc, 2); if (o.hold) prop(o.hold, x + f * 8, y - 13, f); });
    return { hx: x, hy: y - 32, r: [x - 15, y - 34, x + 15, y - 19] };
  }
  function pcDesk(o) {
    const x = Math.round(o.x), y = G + (o.y || 0), sc = o.ex || 'happy', f = o.f || 1;
    if (!o.nodesk) layer(() => { R(x - 23, y - 27, 46, 4, '#b07a40'); R(x - 23, y - 27, 46, 1, '#d09a5a'); R(x - 21, y - 23, 3, 23, '#7a4a1a'); R(x + 18, y - 23, 3, 23, '#7a4a1a'); });
    layer(() => { R(x + 9, y - 22, 9, 22, '#ddd5b5'); R(x + 9, y - 22, 1, 22, '#f0e8d0'); R(x + 11, y - 19, 6, 2, '#999080'); R(x + 11, y - 15, 6, 1, '#999080'); P(x + 16, y - 5, '#3c3'); R(x + 11, y - 9, 3, 1, '#999080'); });
    const mx = x - 13, my = y - 49;
    layer(() => {
      R(mx, my, 26, 21, '#ddd5b5'); R(mx, my, 26, 1, '#f0e8d0'); R(mx + 25, my + 1, 1, 20, '#b8b090'); R(mx + 2, my + 2, 22, 16, '#2a2a2a'); R(mx + 9, my + 21, 8, 2, '#c8c0a0'); R(mx + 5, my + 23, 16, 2, '#ddd5b5'); P(mx + 22, my + 19, '#3c3');
    });
    layer(() => { R(x - 12, y - 29, 19, 2, '#ece4cc'); R(x + 9, y - 29, 4, 2, '#ece4cc'); });
    const S0 = mx + 3, S1 = my + 3, B = '#3cf'; c = dst; // screens are drawn straight onto the picture (no outline)
    const sw = 20, sh = 14;
    const scr = () => {
      if (sc === 'crash') { R(S0, S1, sw, sh, '#0000aa'); R(S0 + 6, S1 + 2, 8, 2, '#aaa'); for (let i = 0; i < 4; i++) R(S0 + 2, S1 + 6 + i * 2, 5 + (i * 5) % 13, 1, '#fff'); }
      else if (sc === 'off') R(S0, S1, sw, sh, '#1a1a1a');
      else if (sc === 'mines') { R(S0, S1, sw, sh, '#c0c0c0'); R(S0, S1, sw, 2, '#000080'); for (let i = 0; i < 24; i++) { const mx2 = S0 + 2 + (i % 6) * 3, my2 = S1 + 3 + Math.floor(i / 6) * 3; R(mx2, my2, 2, 2, i % 5 === 2 ? '#e0e0e0' : '#a0a0a0'); if (i === 9) P(mx2, my2, '#e10600'); if (i === 14) P(mx2 + 1, my2, '#2a2aff'); } }
      else if (sc === 'tetris') { R(S0, S1, sw, sh, '#000'); const cs = ['#e10600', '#ffd400', '#3c3', '#3cf']; for (let i = 0; i < 9; i++) R(S0 + 4 + (i % 3) * 3, S1 + sh - 2 - Math.floor(i / 3) * 2, 3, 2, cs[i % 4]); R(S0 + 10, S1 + 2, 3, 2, '#c6f'); }
      else if (sc === 'game') { R(S0, S1, sw, sh, '#2a3aa0'); R(S0, S1 + 10, sw, 4, '#3a9a2a'); R(S0, S1 + 10, sw, 1, '#6ad04a'); R(S0 + 5, S1 + 6, 3, 4, '#e10600'); P(S0 + 6, S1 + 5, '#f5c89a'); R(S0 + 13, S1 + 5, 2, 5, '#ffd400'); P(S0 + 3, S1 + 2, '#fff'); P(S0 + 16, S1 + 3, '#fff'); }
      else if (sc === 'text' || sc === 'progress' || sc === 'jjj' || sc === 'cyan') {
        R(S0, S1, sw, sh, '#fff'); R(S0, S1, sw, 2, '#000080');
        if (sc === 'progress') { R(S0 + 1, S1 + 2, sw - 2, sh - 2, '#c0c0c0'); R(S0 + 2, S1 + 7, sw - 4, 3, '#fff'); R(S0 + 2, S1 + 7, Math.round((sw - 4) * (o.pct || 0.1)), 3, '#000080'); }
        else for (let i = 0; i < 5; i++) R(S0 + 2, S1 + 3 + i * 2, 6 + (i * 7) % 11, 1, sc === 'jjj' ? '#000' : '#666');
        if (sc === 'cyan') { R(S0 + 3, S1 + 4, 14, 7, '#c0c0c0'); R(S0 + 3, S1 + 4, 14, 1, '#000080'); P(S0 + 5, S1 + 7, '#e10600'); }
      } else { // the PC's own face
        const sad = sc === 'sad' || sc === 'sweat', F = sad ? B : '#3f3'; R(S0, S1, sw, sh, sad ? '#003a3a' : '#002a00');
        if (sc === 'shock') { R(S0 + 4, S1 + 3, 3, 3, F); R(S0 + 13, S1 + 3, 3, 3, F); R(S0 + 8, S1 + 8, 4, 3, F); }
        else { R(S0 + 5, S1 + 3, 2, 3, F); R(S0 + 13, S1 + 3, 2, 3, F); if (sad) { R(S0 + 6, S1 + 9, 8, 1, F); P(S0 + 5, S1 + 10, F); P(S0 + 14, S1 + 10, F); } else { P(S0 + 5, S1 + 8, F); R(S0 + 6, S1 + 9, 8, 1, F); P(S0 + 14, S1 + 8, F); } }
        if (sc === 'sweat') { P(mx - 2, my + 2, B); R(mx - 3, my + 3, 2, 2, B); P(mx + 28, my + 4, B); R(mx + 28, my + 5, 2, 2, B); }
      }
      P(S0 + 1, S1 + 1, 'rgba(255,255,255,.5)'); // a bit of glare
    };
    scr(); c = base;
    if (o.thermo) layer(() => { R(mx + 17, my + 12, 10, 1, '#fff'); R(mx + 26, my + 11, 2, 3, '#e10600'); });
    if (o.scarf) layer(() => { R(mx - 1, my + 18, 28, 3, '#e10600'); R(mx + 19, my + 19, 4, 9, '#e10600'); for (let i = 0; i < 28; i += 4) P(mx - 1 + i, my + 19, '#fff'); R(mx + 19, my + 27, 4, 1, '#fff'); });
    if (o.modem) modem({ x: x + 18, y: o.y || 0, ex: o.modem, desk: 1 });
    return { hx: x, hy: my, r: [mx, my, mx + 26, my + 18] };
  }
  function modem(o) {
    const x = Math.round(o.x), y = G + (o.y || 0) - (o.desk ? 27 : 0), ex = o.ex || 'neutral';
    layer(() => {
      R(x - 7, y - 7, 15, 7, '#ddd5b5'); R(x - 7, y - 7, 15, 1, '#f0e8d0'); R(x - 7, y - 1, 15, 1, '#a8a088');
      const on = ex !== 'off'; for (let i = 0; i < 4; i++) P(x - 6 + i * 2, y - 3, on ? (i === 3 ? '#e10600' : '#3c3') : '#555');
      if (ex === 'sad') { P(x + 2, y - 6, INK); P(x + 5, y - 6, INK); R(x + 2, y - 4, 4, 1, INK); P(x + 1, y - 3, INK); P(x + 6, y - 3, INK); }
      else if (ex === 'yell') { P(x + 2, y - 6, INK); P(x + 6, y - 6, INK); R(x + 3, y - 5, 3, 3, '#300'); }
      else if (ex === 'happy') { P(x + 2, y - 6, INK); P(x + 5, y - 6, INK); P(x + 2, y - 4, INK); R(x + 3, y - 3, 2, 1, INK); P(x + 5, y - 4, INK); }
      else { P(x + 2, y - 6, INK); P(x + 5, y - 6, INK); }
    });
    return { hx: x, hy: y - 8, r: [x - 7, y - 8, x + 8, y] };
  }
  // ================================================================ props
  function prop(name, x, y, f) {
    f = f || 1; x = Math.round(x); y = Math.round(y);
    const RF = (a, yy, w, h, col) => R(f > 0 ? x + a : x - a - w + 1, yy, w, h, col);
    const CUBE = ['#e10600', '#ffd400', '#2a7ad8', '#2ab040', '#ffffff', '#ff8a00'];
    switch (name) {
      case 'cube': R(x - 4, y - 4, 9, 9, '#151515'); for (let i = 0; i < 9; i++) R(x - 3 + (i % 3) * 3, y - 3 + Math.floor(i / 3) * 3, 2, 2, CUBE[(i * 5 + 2) % 6]); break;
      case 'cubedone': R(x - 4, y - 6, 9, 11, '#151515'); for (let i = 0; i < 9; i++) R(x - 3 + (i % 3) * 3, y - 3 + Math.floor(i / 3) * 3, 2, 2, '#e10600'); for (let i = 0; i < 3; i++) R(x - 3 + i * 3, y - 5, 2, 1, '#ffffff'); break;
      case 'gameboy': case 'gbc': { const B = name === 'gbc' ? '#8a3ac0' : '#c8c4b8'; R(x - 4, y - 6, 9, 12, B); R(x - 3, y - 5, 7, 5, '#4a4e5e'); R(x - 2, y - 4, 5, 3, name === 'gbc' ? '#b8f0ff' : '#9bbc0f'); if (name === 'gbc') { P(x - 1, y - 3, '#e10600'); P(x + 1, y - 2, '#ffd400'); }
        R(x - 3, y + 2, 3, 1, '#2a2a2a'); R(x - 2, y + 1, 1, 3, '#2a2a2a'); P(x + 2, y + 2, '#a02060'); P(x + 3, y + 1, '#a02060'); R(x + 3, y + 5, 1, 1, shade(B, 0.7)); break; }
      case 'pad': R(x - 5, y - 1, 11, 3, '#5a5a66'); R(x - 5, y + 1, 3, 3, '#5a5a66'); R(x + 3, y + 1, 3, 3, '#5a5a66'); P(x - 3, y, '#ddd'); P(x + 3, y - 1, '#e10600'); P(x + 2, y, '#ffd400'); P(x + 4, y, '#2a7ad8'); break;
      case 'floppy': R(x - 4, y - 4, 8, 8, '#20304a'); R(x - 2, y - 4, 4, 3, '#c8ccd4'); P(x + 1, y - 3, '#20304a'); R(x - 3, y + 1, 6, 3, '#ffffff'); R(x - 2, y + 2, 4, 1, '#8899cc'); break;
      case 'letter': case 'card': { const B = name === 'card' ? '#ff8ac0' : '#ffffff', L = name === 'card' ? '#c0407a' : '#9a9aa8'; R(x - 5, y - 3, 11, 7, B); line(x - 5, y - 3, x, y + 1, L); line(x, y + 1, x + 5, y - 3, L); if (name === 'card') { R(x - 1, y - 2, 3, 2, '#e10600'); R(x - 2, y - 2, 1, 1, '#e10600'); R(x + 2, y - 2, 1, 1, '#e10600'); P(x, y, '#e10600'); } else R(x + 3, y - 2, 2, 2, '#e10600'); break; }
      case 'ball': oval(x, y, 3, 3, '#ffffff'); R(x - 1, y - 1, 2, 2, '#222'); P(x + 2, y + 1, '#222'); P(x - 2, y + 2, '#222'); P(x + 1, y - 3, '#222'); break;
      case 'phone': line(x - f * 2, y - 5, x, y + 2, '#ece4cc', 1); RF(-4, y - 7, 3, 2, '#ece4cc'); RF(-1, y + 2, 3, 2, '#ece4cc'); for (let i = 0; i < 6; i++) RF(1 + (i % 2), y + 5 + i * 2, 1, 1, '#999'); break;
      case 'paint': R(x - 3, y - 3, 6, 6, '#e8e8e8'); R(x - 3, y - 3, 6, 2, '#3a9a2a'); R(x - 3, y + 1, 6, 1, '#bbb'); line(x + 2, y - 3, x + 5, y - 10, '#a07040'); P(x + 5, y - 11, '#3a9a2a'); break;
      case 'brush': line(x, y + 1, x + f * 4, y - 7, '#c08040'); RF(4, y - 9, 1, 2, '#3a9a2a'); break;
      case 'ork': R(x - 3, y - 8, 6, 5, '#3a9a2a'); P(x - 2, y - 6, '#e10600'); P(x + 1, y - 6, '#e10600'); R(x - 2, y - 4, 4, 1, '#fff'); R(x - 4, y - 3, 8, 5, '#7a4a1a'); R(x - 5, y - 3, 1, 3, '#3a9a2a'); R(x + 4, y - 3, 1, 3, '#3a9a2a'); R(x - 5, y + 2, 10, 2, '#555'); break;
      case 'mag': R(x - 5, y - 6, 10, 13, '#ffd400'); R(x - 4, y - 5, 8, 3, '#e10600'); R(x - 3, y - 1, 6, 5, '#2a7ad8'); R(x - 1, y, 2, 3, '#3c3'); R(x - 4, y + 5, 6, 1, '#000'); break;
      case 'mug': R(x - 3, y - 3, 5, 6, '#ffffff'); RF(2, y - 2, 2, 1, '#ffffff'); RF(3, y - 1, 1, 2, '#ffffff'); RF(2, y + 1, 2, 1, '#ffffff'); R(x - 2, y - 3, 3, 1, '#6a3a1a'); R(x - 3, y, 5, 1, '#e10600'); P(x - 1, y - 6, '#ccc'); P(x, y - 7, '#ccc'); break;
      case 'saber': R(x - 1, y - 1, 3, 5, '#9a9aa8'); P(x, y, '#333'); line(x, y - 2, x + f * 6, y - 16, '#bfe8ff', 2); line(x + f, y - 2, x + f * 7, y - 16, '#4ac0ff', 1); break;
      case 'handbag': R(x - 4, y - 1, 9, 7, '#7a2a4a'); R(x - 4, y - 1, 9, 2, '#9a3a5a'); line(x - 2, y - 1, x, y - 5, '#5a1a3a'); line(x, y - 5, x + 2, y - 1, '#5a1a3a'); P(x, y + 1, '#ffd400'); break;
      case 'flask': R(x - 2, y - 6, 5, 11, '#c0c8d0'); R(x - 2, y - 7, 5, 2, '#e10600'); R(x - 2, y - 2, 5, 3, '#2a7ad8'); P(x + 1, y - 5, '#fff'); break;
      case 'notepad': R(x - 4, y - 5, 9, 11, '#ffffff'); for (let i = 0; i < 4; i++) R(x - 3, y - 2 + i * 2, 7, 1, '#9ab0e0'); for (let i = 0; i < 4; i++) P(x - 3 + i * 2, y - 5, '#555'); R(x - 4, y - 5, 1, 11, '#e88'); break;
      case 'furby': oval(x, y, 5, 5, '#b08a6a'); R(x - 3, y - 7, 2, 4, '#b08a6a'); R(x + 2, y - 7, 2, 4, '#b08a6a'); P(x - 3, y - 7, '#ff6ab8'); P(x + 3, y - 7, '#ff6ab8'); oval(x, y + 1, 3, 3, '#f0e0c8');
        R(x - 3, y - 2, 3, 3, '#ffffff'); R(x + 1, y - 2, 3, 3, '#ffffff'); P(x - 2, y - 1, '#1a3a8a'); P(x + 2, y - 1, '#1a3a8a'); R(x - 1, y + 1, 3, 2, '#ffb000'); break;
      case 'tama': oval(x, y, 4, 5, '#ff6ab8'); R(x - 2, y - 3, 5, 4, '#b8c8a0'); P(x, y - 2, '#333'); for (let i = 0; i < 3; i++) P(x - 2 + i * 2, y + 3, '#ffd400'); break;
      case 'glasses': R(x - 5, y - 2, 11, 4, '#f8f8f0'); R(x - 4, y - 1, 3, 2, '#111'); R(x + 1, y - 1, 3, 2, '#111'); P(x, y + 1, '#f8f8f0'); line(x - 5, y - 1, x - 8, y - 3, '#f8f8f0'); break;
      case 'tins': { const rows = [4, 3, 2, 1]; let n = 0; rows.forEach((cnt, r) => { for (let i = 0; i < cnt; i++) { const tx = x - cnt * 3 + i * 6, ty = y - r * 7; R(tx, ty - 6, 5, 6, '#c8ccd0'); R(tx, ty - 5, 5, 3, ['#e8501b', '#2a7ad8', '#e8501b', '#3a9a2a'][(n++) % 4]); P(tx + 1, ty - 4, '#fff'); R(tx, ty - 6, 5, 1, '#e8eaee'); } }); break; }
      case 'trunk': R(x - 4, y - 70, 9, 70, '#6a4a2a'); R(x - 2, y - 70, 2, 70, '#7a5a3a'); for (let i = 0; i < 6; i++) R(x - 3 + (i % 2) * 4, y - 60 + i * 9, 2, 1, '#4a3018'); oval(x, y - 74, 18, 13, '#2a7a2a'); oval(x - 7, y - 82, 10, 7, '#3a8a3a'); oval(x + 8, y - 78, 8, 6, '#2f8030'); break;
      case 'pod': R(x - 16, y, 32, 6, f > 0 ? '#c0c8d0' : '#e8c040'); R(x - 12, y - 2, 24, 3, f > 0 ? '#a0a8b0' : '#c8a020'); R(x - 3, y - 3, 7, 2, '#7ac8ff'); R(x + f * 16 - (f > 0 ? 0 : 6), y + 1, 6, 4, '#555'); for (let i = 0; i < 4; i++) R(x - f * (20 + i * 4) - (f > 0 ? 3 : 0), y + 2, 3, 2, ['#ffd400', '#ff8a00', '#e10600', '#ff8a00'][i]); break;
      case 'plug': R(x - 3, y - 3, 7, 6, '#222'); R(x - 2, y - 6, 1, 3, '#c0c0c0'); R(x + 2, y - 6, 1, 3, '#c0c0c0'); R(x, y - 8, 1, 3, '#c0c0c0'); line(x, y + 3, x - f * 9, y + 12, '#222'); break; // a British plug: three pins
      case 'candle': R(x - 1, y - 7, 3, 8, '#fff8e0'); R(x - 2, y + 1, 5, 2, '#c0a040'); P(x, y - 8, '#333'); R(x, y - 11, 1, 3, '#ffd400'); P(x, y - 12, '#ff8a00'); break;
      case 'drill': RF(-2, y - 3, 9, 4, '#ffd400'); RF(-2, y - 3, 3, 4, '#333'); RF(7, y - 2, 4, 1, '#aaa'); RF(0, y + 1, 3, 4, '#ffd400'); RF(0, y + 4, 3, 1, '#333'); break;
      case 'list': R(x - 3, y - 4, 6, 4, '#ffffff'); for (let i = 0; i < 9; i++) { R(x - 3 + i * 2, y + i * 2, 6, 3, '#ffffff'); P(x - 2 + i * 2, y + 1 + i * 2, '#7a8ab8'); } break;
      case 'popcorn': R(x - 3, y - 2, 7, 7, '#e10600'); R(x - 2, y - 2, 1, 7, '#fff'); R(x + 1, y - 2, 1, 7, '#fff'); oval(x, y - 3, 4, 2, '#fff4c0'); P(x - 2, y - 5, '#fff4c0'); P(x + 2, y - 5, '#fff4c0'); P(x, y - 6, '#fff4c0'); break;
      case 'sleepingbag': R(x - 15, y - 6, 30, 7, '#2a6ad0'); R(x - 15, y - 6, 30, 1, '#4a8af0'); R(x + 9, y - 7, 7, 8, '#f0f0f8'); R(x - 15, y - 2, 24, 1, '#ffd400'); break;
      case 'deckchair': line(x - 6, y, x + 4, y - 14, '#8a5a2a', 2); line(x + 6, y, x - 4, y - 14, '#8a5a2a', 2); R(x - 5, y - 13, 10, 8, '#3a9adf'); for (let i = 0; i < 10; i += 3) R(x - 5 + i, y - 13, 1, 8, '#fff'); break;
      case 'box': R(x - 12, y - 18, 24, 18, '#c9a060'); R(x - 12, y - 18, 24, 2, '#a07a40'); R(x - 2, y - 18, 4, 18, '#d8b878'); R(x - 9, y - 10, 5, 3, '#a07a40'); R(x - 8, y - 9, 3, 1, '#7a5a2a'); break;
      case 'console': R(x - 13, y - 16, 26, 16, '#d8b070'); R(x - 13, y - 16, 26, 2, '#b89050'); R(x - 11, y - 13, 22, 11, '#f0eee8'); P(x + 9, y - 3, '#d8b070'); P(x - 11, y - 13, '#d8b070'); // a cardboard box, painted white (mostly)
        for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; P(x - 2 + Math.round(Math.cos(t) * 5), y - 9 + Math.round(Math.sin(t) * 3), '#3a3a8a'); } for (let i = 0; i < 4; i++) R(x - 9 + i * 5, y - 4, 3, 1, '#3a3a8a'); R(x + 7, y - 11, 2, 2, '#ff8a00'); break;
      case 'robot': // Sir Hoovers-a-Lot: a hoover on a skateboard, with angry LEDs
        R(x - 14, y - 4, 28, 2, '#8a5a2a'); oval(x - 9, y, 2, 2, '#222'); oval(x + 9, y, 2, 2, '#222');
        R(x - 10, y - 16, 16, 12, '#c02030'); R(x - 10, y - 16, 16, 2, '#e04050'); R(x - 8, y - 19, 8, 3, '#555'); R(x - 7, y - 13, 3, 2, '#ffe040'); R(x - 2, y - 13, 3, 2, '#ffe040'); P(x - 6, y - 12, '#e10600'); P(x - 1, y - 12, '#e10600');
        line(x + 6, y - 12, x + 12, y - 14, '#444', 2); line(x + 12, y - 14, x + 16, y - 7, '#444', 2); R(x + 13, y - 7, 7, 3, '#777'); for (let i = 0; i < 3; i++) P(x + 14 + i * 2, y - 4, '#ddd'); break;
      case 'pumpkin': oval(x, y - 4, 6, 5, '#ff8a00'); R(x - 1, y - 9, 2, 1, '#ff8a00'); R(x, y - 11, 1, 2, '#3a9a2a'); R(x - 3, y - 6, 2, 2, '#ffe040'); R(x + 2, y - 6, 2, 2, '#ffe040'); R(x - 3, y - 2, 7, 1, '#ffe040'); P(x - 2, y - 1, '#ffe040'); P(x + 2, y - 1, '#ffe040'); for (let i = -4; i <= 4; i += 4) R(x + i, y - 8, 1, 8, '#e07000'); break;
      case 'sweets': R(x - 4, y - 4, 8, 8, '#ffffff'); R(x - 4, y - 4, 8, 1, '#ddd'); for (const [a, b, col] of [[-2, -1, '#ff6ab8'], [1, -1, '#3c3'], [-1, 2, '#ffd400'], [2, 2, '#2a7ad8']]) R(x + a, y + b, 2, 2, col); break;
      case 'coins': for (const [a, b, col] of [[-3, 0, '#c8c8d0'], [1, 0, '#e8c040'], [-1, -2, '#c8c8d0'], [2, -3, '#a0602a'], [-2, 2, '#e8c040']]) { R(x + a, y + b, 3, 2, col); P(x + a, y + b, '#fff'); } P(x + 4, y + 2, '#2a7ad8'); break; // and a button
      case 'crisps': R(x - 4, y - 6, 8, 11, '#2a7ad8'); R(x - 4, y - 6, 8, 2, '#c8ccd0'); R(x - 4, y + 4, 8, 1, '#c8ccd0'); oval(x, y, 2, 2, '#ffd400'); break;
      case 'biscuit': oval(x, y, 3, 3, '#d8a050'); P(x - 1, y - 1, '#a06a20'); P(x + 1, y + 1, '#a06a20'); P(x + 1, y - 1, '#a06a20'); break;
      case 'tree': R(x - 1, y - 6, 3, 6, '#5a3a1a'); R(x - 4, y - 3, 9, 3, '#c02020'); for (let i = 0; i < 4; i++) R(x - 9 + i * 2, y - 10 - i * 6, 19 - i * 4, 6, '#1a6a2a'); oval(x, y - 34, 1, 1, '#ffd400'); for (let i = 0; i < 7; i++) P(x - 6 + (i * 5) % 13, y - 12 - (i * 7) % 20, ['#e10600', '#ffd400', '#2a7ad8', '#ffffff'][i % 4]); line(x - 7, y - 14, x + 6, y - 19, '#ffd400'); break;
      case 'present': R(x - 6, y - 9, 12, 9, '#2a7ad8'); R(x - 1, y - 9, 2, 9, '#ffd400'); R(x - 6, y - 6, 12, 2, '#ffd400'); R(x - 4, y - 11, 3, 2, '#ffd400'); R(x + 1, y - 11, 3, 2, '#ffd400'); break;
      case 'chair': R(x - 6, y - 14, 2, 14, '#7a4a1a'); R(x - 6, y - 6, 13, 2, '#9a6a2a'); R(x + 5, y - 6, 2, 6, '#7a4a1a'); break;
      case 'party': for (let i = 0; i < 11; i++) { const bx = 2 + i * 12; R(bx, 4 + (i % 2), 9, 2, ['#e10600', '#ffd400', '#2a7ad8', '#3c3'][i % 4]); R(bx + 2, 6 + (i % 2), 5, 2, ['#e10600', '#ffd400', '#2a7ad8', '#3c3'][i % 4]); P(bx + 4, 8 + (i % 2), ['#e10600', '#ffd400', '#2a7ad8', '#3c3'][i % 4]); } R(0, 3, LW, 1, '#ddd'); break;
      case 'seats': for (let i = 0; i < 6; i++) { R(4 + i * 21, y - 12, 18, 14, '#8a1020'); R(4 + i * 21, y - 12, 18, 2, '#b02030'); } break;
      case 'poster': R(x - 7, y - 6, 15, 11, '#ff8ac0'); R(x - 7, y + 2, 15, 3, '#e050a0'); oval(x - 3, y - 2, 2, 2, '#ffd400'); oval(x + 3, y - 3, 1, 1, '#c060e0'); oval(x + 5, y + 1, 2, 1, '#e86aa0'); P(x, y - 4, '#fff'); break; // a sunset solar system (no cyan)
      case 'cables': line(x - 5, y + 2, x + 4, y - 3, '#222', 1); line(x - 4, y - 2, x + 5, y + 3, '#e8e0c8', 1); line(x - 6, y, x + 6, y, '#2a7ad8', 1); R(x + 5, y - 4, 3, 2, '#c0c0c0'); R(x - 8, y + 1, 3, 3, '#ffd400'); oval(x, y + 5, 4, 1, '#333'); break;
      case 'pan': RF(-1, y, 4, 1, '#333'); RF(3, y - 1, 11, 3, '#2a2a2a'); RF(4, y - 2, 9, 1, '#555'); RF(5, y - 3, 7, 1, '#f0d890'); break;
      case 'pancake': oval(x, y, 9, 3, '#f0d080'); oval(x - 2, y - 1, 4, 1, '#d8a850'); P(x + 4, y, '#c08030'); for (let i = 0; i < 3; i++) P(x - 6 + i * 6, y + 3 + i % 2, '#f0d080'); break;
      case 'rocket': R(x - 3, y - 8, 7, 8, '#3a8a3a'); R(x - 2, y - 10, 5, 2, '#3a8a3a'); if (f === 2) { line(x, y - 10, x + 6, y - 20, '#c8a060'); R(x + 5, y - 25, 3, 6, '#e10600'); for (let i = 0; i < 4; i++) P(x + 4 + (i % 2) * 4, y - 28 - i * 3, '#bbb'); }
        else { R(x, y - 34, 1, 24, '#c8a060'); R(x - 2, y - 46, 5, 12, '#e10600'); R(x - 2, y - 44, 5, 2, '#ffd400'); R(x - 1, y - 48, 3, 2, '#ffd400'); P(x, y - 49, '#ffd400'); if (f === 3) for (let i = 0; i < 9; i++) P(x - 4 + (i * 5) % 9, y - 33 + (i * 3) % 7, ['#ffd400', '#ff8a00', '#fff'][i % 3]); } break;
      case 'pcbox': R(x - 6, y - 9, 12, 16, '#ddd5b5'); R(x - 6, y - 9, 12, 1, '#f0e8d0'); R(x - 4, y - 6, 8, 2, '#999080'); R(x - 4, y - 2, 8, 1, '#999080'); P(x + 3, y + 4, '#3c3'); break;
      case 'bubbles': for (let i = 0; i < 5; i++) oval(x + i * 3, y - i * 4, 1, 1, '#9fd0ff'); break;
    }
  }

  // ================================================================ a whole panel: background, cast, props, then the sharp lettering
  let overlays = [];
  function paint(p) {
    overlays = []; c = base; dst = base;
    base.imageSmoothingEnabled = false;
    (BG[p.bg] || BG.plain)(p.o || {});
    const heads = {}, all = [];
    for (const pr of p.pr || []) layer(() => prop(pr[0], pr[1], pr[2], pr[3]));
    for (const ch of p.c || []) {
      const [id, x, pose, ex, f, opt] = ch, o = Object.assign({ x, pose, ex, f: f || 1 }, opt || {});
      const k = Object.assign({}, CAST[id]); for (const key of ['top', 'pat', 'pc', 'text', 'glasses']) if (o[key] !== undefined) k[key] = o[key];
      const lift = o.tilt && Math.abs(o.tilt) > 1 ? 10 : 0; // lying down: keep them on the floor, not under it
      if (!o.tilt && !o.y && p.bg !== 'space' && p.bg !== 'dark' && id !== 'pc' && id !== 'modem') { base.fillStyle = 'rgba(20,10,30,.22)'; const sw2 = id === 'biscuit' ? 9 : 8; base.fillRect(Math.round(x) - sw2, G - 1, sw2 * 2 + 1, 2); base.fillRect(Math.round(x) - sw2 + 2, G + 1, sw2 * 2 - 3, 1); }
      chc.clearRect(0, 0, LW, LH); dst = chc;
      let hd;
      try { hd = id === 'biscuit' ? cat(o) : id === 'gubbinz' ? grot(o) : id === 'pc' ? pcDesk(o) : id === 'modem' ? modem(o) : person(k, o); } finally { dst = base; c = base; }
      if (o.tilt && Math.abs(o.tilt) <= 1) { // leaning: shear the rows (keeps the pixels crisp, unlike rotating)
        const t = Math.tan(o.tilt), off = y => Math.round((G - y) * t);
        for (let y = 0; y < LH; y++) { const dx = off(y); base.drawImage(CHR, 0, y, LW, 1, dx, y, LW, 1); }
        hd.hx += off(hd.hy); if (hd.r) { const d0 = off(hd.r[3]), d1 = off(hd.r[1]); hd.r = [hd.r[0] + Math.min(d0, d1), hd.r[1], hd.r[2] + Math.max(d0, d1), hd.r[3]]; }
      } else if (o.tilt) { // lying down: an exact quarter turn, so every pixel stays a pixel
        const a = Math.sign(o.tilt) * Math.PI / 2, X = Math.round(x), rot = (px, py) => [X + (px - X) * Math.cos(a) - (py - G) * Math.sin(a), G - lift + (px - X) * Math.sin(a) + (py - G) * Math.cos(a)];
        base.save(); base.translate(X, G - lift); base.rotate(a); base.translate(-X, -G); base.drawImage(CHR, 0, 0); base.restore();
        [hd.hx, hd.hy] = rot(hd.hx, hd.hy);
        if (hd.r) { const pts = [rot(hd.r[0], hd.r[1]), rot(hd.r[2], hd.r[1]), rot(hd.r[0], hd.r[3]), rot(hd.r[2], hd.r[3])]; hd.r = [Math.min(...pts.map(q => q[0])), Math.min(...pts.map(q => q[1])), Math.max(...pts.map(q => q[0])), Math.max(...pts.map(q => q[1]))]; }
      } else base.drawImage(CHR, 0, 0);
      heads[id] = hd; if (hd.r && id !== 'pc' && id !== 'modem') all.push(hd.r);
    }
    for (const pr of p.fr || []) layer(() => prop(pr[0], pr[1], pr[2], pr[3])); // props in front of people
    if (p.burst) { base.globalAlpha = 0.35; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; line(LW / 2 + Math.cos(a) * 40, LH / 2 + Math.sin(a) * 40, LW / 2 + Math.cos(a) * 80, LH / 2 + Math.sin(a) * 80, '#fff'); } base.globalAlpha = 1; }
    if (p.lightsOff) { base.fillStyle = 'rgba(0,0,20,.82)'; base.fillRect(0, 0, LW, LH); }
    if (p.dim) { base.fillStyle = 'rgba(0,0,40,' + p.dim + ')'; base.fillRect(0, 0, LW, LH); }
    Object.defineProperty(heads, '_all', { value: all, enumerable: false });
    return heads;
  }

  // ---------------------------------------------------------------- lettering (full resolution)
  const FONT = 'bold 15px "Comic Sans MS", "Chalkboard SE", "Trebuchet MS", Tahoma, sans-serif', LINEH = 18;
  const FX = '"Bangers", Impact, "Arial Black", sans-serif';
  function wrap(g, text, maxW) { const out = []; let ln = ''; for (const w of String(text).split(' ')) { const t = ln ? ln + ' ' + w : w; if (g.measureText(t).width > maxW && ln) { out.push(ln); ln = w; } else ln = t; } if (ln) out.push(ln); return out; }
  function cloud(g, x, y, w, h) {
    const pts = [], r = 11;
    for (let t = 0; t < w; t += 18) pts.push([x + t + 9, y], [x + t + 9, y + h]);
    for (let t = 0; t < h; t += 16) pts.push([x, y + t + 8], [x + w, y + t + 8]);
    g.lineWidth = 2.5; g.strokeStyle = '#000'; g.fillStyle = '#fff';
    for (const [px, py] of pts) { g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill(); g.stroke(); }
    for (const [px, py] of pts) { g.beginPath(); g.arc(px, py, r - 2, 0, Math.PI * 2); g.fill(); }
    g.fillRect(x, y, w, h);
  }
  function jag(g, x, y, w, h) { g.beginPath(); const pts = []; const n = 16; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = i % 2 ? 1 : 1.16; pts.push([x + w / 2 + Math.cos(a) * w / 2 * r, y + h / 2 + Math.sin(a) * h / 2 * r]); } g.moveTo(...pts[0]); pts.forEach(p => g.lineTo(...p)); g.closePath(); g.fill(); g.stroke(); }
  const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  // where should each bubble go? In reading order (top to bottom, left to right), as near its speaker as it can be, never over a face.
  function placeBubbles(g, p, heads, top, hard) {
    const faces = (heads._all || []).map(r => [r[0] * S - 3, r[1] * S - 3, r[2] * S + 3, r[3] * S + 3]);
    const fxr = (p.fx || []).map(([t, x, y, size]) => { g.font = `${size || 30}px ${FX}`; const w = g.measureText(t).width; return [x * S - w / 2 - 4, y * S - (size || 30) * 0.85, x * S + w / 2 + 4, y * S + 6]; });
    g.font = FONT;
    const placed = [];
    (p.s || []).forEach(([who, text, type]) => {
      const off = String(who).startsWith('off'), hd = heads[who];
      const sx = off ? (who.endsWith('L') ? 0 : PW) : (hd ? hd.hx : LW / 2) * S;
      const prev = placed[placed.length - 1];
      let best = null;
      for (const mw of [250, 225, 200, 175, 150, 125]) {
        const lines = wrap(g, text, Math.min(mw, PW - 24) - 22);
        const w = Math.ceil(Math.max(...lines.map(l => g.measureText(l).width)) + 24 + (type === 't' ? 10 : 0)), h = lines.length * LINEH + 14 + (type === 'y' ? 6 : 0);
        const y0 = Math.max(top + (type === 't' ? 12 : type === 'y' ? 14 : 6), prev ? prev.y + 14 : 0);
        for (let y = y0; y + h <= PH - (type === 'y' ? 16 : 8); y += 6) {
          for (let dx = 0; dx <= PW; dx += 12) for (const sg of dx ? [-1, 1] : [1]) {
            const mg = type === 'y' ? 20 : type === 't' ? 14 : 6, x = Math.round(Math.max(mg, Math.min(PW - w - mg, sx - w / 2 + sg * dx)));
            const rr = [x, y, x + w, y + h];
            if (placed.some(q => { const m = 8 + (q.type === 't' ? 12 : 0) + (type === 't' ? 12 : 0); return inter(rr, [q.x - m, q.y - m, q.x + q.w + m, q.y + q.h + m]) > 0; })) continue;
            if (hard.some(q => inter(rr, q) > 0)) continue;
            if (prev && x + w / 2 < prev.x + prev.w / 2 - 30 && y < prev.y + prev.h - 4) continue; // a bubble to the left must be lower down
            const big = type === 't' ? [x - 11, y - 11, x + w + 11, y + h + 11] : type === 'y' ? [x - 8, y - 8, x + w + 8, y + h + 8] : rr, faceHit = faces.reduce((a, q) => a + inter(big, q), 0);
            const cost = faceHit * 6 + fxr.reduce((a, q) => a + inter(rr, q), 0) * 0.6 + Math.abs(x + w / 2 - sx) * 0.5 + (y - y0) * 0.9 + (250 - mw) * 0.5 + lines.length * 6;
            if (!best || cost < best.cost) best = { x, y, w, h, lines, cost };
          }
          if (best && best.cost < (y - y0) * 0.9) break;
        }
        if (best && best.cost < 60) break;
      }
      if (!best) { const lines = wrap(g, text, PW - 50); const w = Math.max(...lines.map(l => g.measureText(l).width)) + 24, h = lines.length * LINEH + 14; best = { x: (PW - w) / 2, y: prev ? prev.y + prev.h + 6 : top + 6, w, h, lines }; }
      placed.push(Object.assign(best, { who, type, off, hd, sx }));
    });
    return placed;
  }
  function letter(g, p, heads, ox, oy) {
    g.save(); g.beginPath(); g.rect(ox, oy, PW, PH); g.clip();
    // signs, screen text, shirt text
    for (const o of (p.over || []).map(v => ({ t: v[0], x: v[1], y: v[2], size: v[3] || 12, col: v[4] || '#fff', center: 1, bold: 1 })).concat(overlays)) {
      g.font = `${o.bold ? 'bold ' : ''}${o.size}px ${o.font || 'Tahoma, Verdana, sans-serif'}`; g.textAlign = o.center ? 'center' : 'left'; g.textBaseline = 'middle';
      if (o.stroke) { g.lineWidth = 3; g.strokeStyle = o.stroke; g.strokeText(o.t, ox + o.x * S, oy + o.y * S); }
      g.fillStyle = o.col; g.fillText(o.t, ox + o.x * S, oy + o.y * S);
    }
    g.textBaseline = 'alphabetic';
    // sound effects
    for (const [t, x, y, size, col, rot] of p.fx || []) {
      g.save(); g.translate(ox + x * S, oy + y * S); g.rotate((rot || -8) * Math.PI / 180);
      g.font = `${(size || 30)}px ${FX}`; g.textAlign = 'center';
      g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = '#000'; g.strokeText(t, 0, 0); g.lineWidth = 3; g.strokeStyle = '#fff'; g.strokeText(t, 0, 0); g.fillStyle = col || '#ffd400'; g.fillText(t, 0, 0);
      g.restore();
    }
    // captions (yellow boxes) top and bottom
    g.font = 'italic bold 13px Georgia, "Times New Roman", serif';
    let capH = 0; const hard = [];
    const capBox = (txt, bottom) => {
      const lines = wrap(g, txt, PW - 30), hh = lines.length * 16 + 10, w = Math.min(PW - 8, Math.max(...lines.map(l => g.measureText(l).width)) + 16);
      const x = bottom ? PW - w - 4 : 4, y = bottom ? PH - hh - 4 : 4;
      g.fillStyle = '#fff3a0'; g.fillRect(ox + x, oy + y, w, hh); g.strokeStyle = '#000'; g.lineWidth = 2; g.strokeRect(ox + x, oy + y, w, hh);
      g.fillStyle = '#000'; g.textAlign = 'left'; lines.forEach((l, i) => g.fillText(l, ox + x + 8, oy + y + 16 + i * 16));
      return [x - 4, y - 4, x + w + 4, y + hh + 4];
    };
    if (p.cap) { const r = capBox(p.cap, 0); capH = r[3]; }
    if (p.capb) hard.push(capBox(p.capb, 1));
    // speech, thought, whisper and shouting bubbles
    const placed = placeBubbles(g, p, heads, capH, hard);
    g.font = FONT;
    for (const b of placed) {
      const { type, off, hd, sx } = b, bx = ox + b.x, by = oy + b.y, w = b.w, hgt = b.h;
      g.fillStyle = type === 'y' ? '#fff8c0' : '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2.5; g.setLineDash(type === 'w' ? [6, 4] : []);
      // the tail: from the bottom of the bubble down to the speaker's head, or out of the side if the bubble is level with their head
      const r = hd && hd.r ? hd.r.map(v => v * S) : null;
      let tipX, tipY, side = 0;
      if (off) { tipX = ox + (b.who.endsWith('L') ? 2 : PW - 2); tipY = Math.min(by + hgt + 26, oy + PH - 4); }
      else if (r && b.y + hgt > r[1] - 6) { side = sx < b.x + w / 2 ? -1 : 1; tipX = ox + (side < 0 ? r[2] + 2 : r[0] - 2); tipY = oy + Math.max(b.y + 10, Math.min(b.y + hgt - 6, (r[1] + r[3]) / 2)); }
      else { tipX = ox + Math.max(b.x + 10, Math.min(b.x + w - 10, sx)); tipY = oy + (r ? r[1] - 4 : PH * 0.55); if (tipY - (by + hgt) > 80) tipY = by + hgt + 80; }
      if (type === 't') {
        for (let k = 0; k < 3; k++) { const fx0 = bx + w / 2, fy0 = by + hgt, tx = fx0 + (tipX - fx0) * (k + 1) / 4, ty = fy0 + (tipY - fy0) * (k + 1) / 4; g.beginPath(); g.arc(tx, ty, 6 - k * 1.5, 0, Math.PI * 2); g.fill(); g.stroke(); }
        cloud(g, bx, by, w, hgt);
      } else {
        if (side) { const bxe = side < 0 ? bx : bx + w, ym = Math.max(by + 8, Math.min(by + hgt - 20, tipY - 6)); g.beginPath(); g.moveTo(bxe, ym); g.lineTo(tipX, tipY); g.lineTo(bxe, ym + 12); g.closePath(); g.fill(); g.stroke(); }
        else { const base0 = Math.max(bx + 12, Math.min(bx + w - 26, tipX - 6)); g.beginPath(); g.moveTo(base0, by + hgt - 2); g.lineTo(tipX, tipY); g.lineTo(base0 + 13, by + hgt - 2); g.closePath(); g.fill(); g.stroke(); }
        if (type === 'y') jag(g, bx - 6, by - 6, w + 12, hgt + 12); else { g.beginPath(); if (g.roundRect) g.roundRect(bx, by, w, hgt, 12); else g.rect(bx, by, w, hgt); g.fill(); g.stroke(); }
        g.setLineDash([]);
        // hide the join between tail and bubble
        if (side) { const bxe = side < 0 ? bx : bx + w, ym = Math.max(by + 8, Math.min(by + hgt - 20, tipY - 6)); g.fillRect(bxe - 3, ym + 2, 6, 9); }
        else { const base0 = Math.max(bx + 12, Math.min(bx + w - 26, tipX - 6)); g.fillRect(base0 + 2, by + hgt - 4, 10, 5); }
      }
      g.setLineDash([]);
      if (off) { const label = String(b.who).split(':')[1] || ''; if (label) { g.save(); g.font = 'bold 11px Tahoma, sans-serif'; g.fillStyle = '#ffd400'; g.lineWidth = 1.5; const lw = g.measureText(label).width + 8, lx = Math.max(ox + 2, Math.min(bx + 6, ox + PW - lw - 4)); g.fillRect(lx, by - 9, lw, 14); g.strokeRect(lx, by - 9, lw, 14); g.fillStyle = '#000'; g.textAlign = 'left'; g.fillText(label, lx + 4, by + 2); g.restore(); g.font = FONT; } }
      g.fillStyle = type === 'w' ? '#333' : '#000'; g.textAlign = 'center';
      b.lines.forEach((l, k) => g.fillText(l, bx + w / 2, by + 20 + (type === 'y' ? 3 : 0) + k * LINEH));
    }
    g.restore();
  }

  // ================================================================ DAVE'S COMIK: deliberately rubbish. Black biro on a page torn out of an exercise book.
  // Wobbly stick men, arrows labelling everything, crossings-out, spelling mistakes and a Ribena ring. Dave always wins.
  const BIRO = '#1d1d2b';
  function davePaper(g, x, y, w, h, seed, torn) {
    const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(seed + 11);
    g.save(); g.beginPath();
    if (torn) { g.moveTo(x + 10, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x + 10, y + h); for (let yy = h; yy > 0; yy -= 7) g.lineTo(x + 2 + r() * 10, y + yy); } else g.rect(x, y, w, h);
    g.closePath(); g.fillStyle = '#fbfaf0'; g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 6; g.shadowOffsetX = 2; g.shadowOffsetY = 2; g.fill(); g.restore();
    g.save();
    g.strokeStyle = '#b6cdee'; g.lineWidth = 1; for (let yy = y + 30; yy < y + h; yy += 22) { g.beginPath(); g.moveTo(x + (torn ? 12 : 0), yy); g.lineTo(x + w, yy); g.stroke(); }
    g.strokeStyle = '#ee9a9a'; g.beginPath(); g.moveTo(x + 46, y); g.lineTo(x + 46, y + h); g.stroke();
    g.restore();
  }
  function daveDraw(g, p, ox, oy, seed, paper) {
    const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(seed + 3);
    const wob = (x, y, k) => [x + (r() - 0.5) * (k || 5), y + (r() - 0.5) * (k || 5)];
    g.save(); g.beginPath(); g.rect(ox - 6, oy - 6, PW + 12, PH + 12); g.clip();
    if (paper) davePaper(g, ox, oy, PW, PH, seed, false);
    g.strokeStyle = BIRO; g.fillStyle = BIRO; g.lineCap = 'round'; g.lineJoin = 'round';
    const L = (a, b, c2, d, w) => { g.lineWidth = w || 2.4; g.beginPath(); g.moveTo(...wob(a, b)); const [mx, my] = wob((a + c2) / 2, (b + d) / 2, 4); g.quadraticCurveTo(mx, my, ...wob(c2, d)); g.stroke(); };
    const ring = (x, y, rad, w) => { g.lineWidth = w || 2.4; g.beginPath(); for (let k = 0; k <= 14; k++) { const a = k / 14 * Math.PI * 2 + 0.3, rr = rad + (r() - 0.5) * 3; k ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); };
    // biro handwriting, every letter a bit wonky. {x:word} gets scribbled out.
    const scrawl = (t, x, y, size) => {
      g.font = `bold ${size || 17}px "Comic Sans MS", "Chalkboard SE", "Trebuchet MS", sans-serif`; g.textAlign = 'left'; let cx = x;
      for (const part of String(t).split(/(\{x:[^}]*\})/)) {
        if (!part) continue; const crossed = part.startsWith('{x:'), txt = crossed ? part.slice(3, -1) : part, x0 = cx;
        for (const ch of txt) { g.save(); g.translate(cx, y + (r() - 0.5) * 4); g.rotate((r() - 0.5) * 0.3); g.fillText(ch, 0, 0); g.restore(); cx += g.measureText(ch).width + (r() - 0.35) * 1.6; }
        if (crossed) { g.lineWidth = 2; for (let pass = 0; pass < 2; pass++) { const yy = y - size * (0.25 + pass * 0.18); g.beginPath(); g.moveTo(x0 - 3, yy + (r() - 0.5) * 3); g.lineTo(cx + 2, yy + (r() - 0.5) * 3); g.stroke(); } }
      }
      return cx;
    };
    const arrow = (label, lx, ly, tx, ty) => { const ex = scrawl(label, lx, ly, 14); const sx = tx < lx ? lx - 4 : Math.min(ex + 4, lx + 60), sy = ly - 5; L(sx, sy, tx, ty, 2); const a = Math.atan2(ty - sy, tx - sx); L(tx, ty, tx - Math.cos(a - 0.5) * 11, ty - Math.sin(a - 0.5) * 11, 2); L(tx, ty, tx - Math.cos(a + 0.5) * 11, ty - Math.sin(a + 0.5) * 11, 2); };
    const stick = (x, label, o) => {
      o = o || {}; const big = o.big ? 1.25 : o.small ? 0.75 : 1, y = oy + PH - 46, X = ox + x, hr = 18 * big;
      ring(X, y - 96 * big, hr);
      L(X, y - 96 * big + hr, X + 2, y - 36 * big); L(X + 2, y - 36 * big, X - 18 * big, y); L(X + 2, y - 36 * big, X + 20 * big, y);
      if (o.up) { L(X, y - 72 * big, X - 26 * big, y - 104 * big); L(X, y - 72 * big, X + 28 * big, y - 104 * big); } else { L(X, y - 72 * big, X - 24 * big, y - 52 * big); L(X, y - 72 * big, X + 26 * big, y - 92 * big); }
      g.beginPath(); g.arc(X - 6 * big, y - 100 * big, 2.4, 0, 7); g.arc(X + 7 * big, y - 101 * big, 2.4, 0, 7); g.fill();
      g.lineWidth = 2.2; g.beginPath(); if (o.sad || o.cry) g.arc(X, y - 82 * big, 7 * big, Math.PI + 0.4, -0.4); else g.arc(X, y - 94 * big, 8 * big, 0.3, Math.PI - 0.3); g.stroke();
      if (o.cry) { L(X - 8 * big, y - 96 * big, X - 9 * big, y - 84 * big, 1.6); L(X + 8 * big, y - 96 * big, X + 10 * big, y - 82 * big, 1.6); }
      if (o.crown) { const cy = y - 96 * big - hr; g.lineWidth = 2.2; g.beginPath(); g.moveTo(...wob(X - 14, cy + 2, 2)); g.lineTo(X - 14, cy - 14); g.lineTo(X - 7, cy - 5); g.lineTo(X, cy - 16); g.lineTo(X + 7, cy - 5); g.lineTo(X + 14, cy - 14); g.lineTo(...wob(X + 14, cy + 2, 2)); g.stroke(); }
      if (o.hat) { const cy = y - 96 * big - hr + 2; L(X - 18, cy + 4, X + 16, cy - 2); L(X - 14, cy + 2, X + 22, cy - 28); L(X + 16, cy - 2, X + 22, cy - 28); ring(X + 24, cy - 30, 5, 2); }
      if (o.cap) { const cy = y - 96 * big - hr + 4; L(X - 16, cy + 2, X + 16, cy + 2); L(X - 14, cy + 2, X - 8, cy - 8); L(X - 8, cy - 8, X + 12, cy - 8); L(X + 12, cy - 8, X + 16, cy + 2); L(X + 16, cy + 2, X + 30, cy + 4); }
      if (o.pad) { g.lineWidth = 2.2; g.strokeRect(...wob(X + 20 * big, y - 98 * big, 2), 18, 10); }
      if (label) scrawl(label, X - label.length * 4, oy + PH - 18, 15);
    };
    const thing = (k, x, y, w) => {
      const X = ox + x, Y = oy + y;
      if (k === 'n64') { L(X, Y, X + 60, Y); L(X + 60, Y, X + 58, Y + 34); L(X + 58, Y + 34, X - 2, Y + 32); L(X - 2, Y + 32, X, Y); scrawl('ULTRA 64', X + 10, Y + 24, 17); L(X + 30, Y + 34, X + 40, Y + 60, 1.6); g.lineWidth = 2; g.strokeRect(X + 30, Y + 58, 24, 14); }
      else if (k === 'pc') { L(X, Y, X + 48, Y); L(X + 48, Y, X + 48, Y + 40); L(X + 48, Y + 40, X, Y + 40); L(X, Y + 40, X, Y); L(X + 8, Y + 8, X + 40, Y + 8, 1.6); L(X + 40, Y + 8, X + 40, Y + 30, 1.6); L(X + 40, Y + 30, X + 8, Y + 30, 1.6); L(X + 8, Y + 30, X + 8, Y + 8, 1.6); scrawl('zzz', X + 12, Y + 24, 12); }
      else if (k === 'trophy') { L(X - 16, Y, X + 16, Y); L(X - 16, Y, X - 10, Y + 26); L(X + 16, Y, X + 10, Y + 26); L(X - 10, Y + 26, X + 10, Y + 26); L(X, Y + 26, X, Y + 40); L(X - 12, Y + 42, X + 12, Y + 42); ring(X - 20, Y + 10, 6, 2); ring(X + 20, Y + 10, 6, 2); scrawl('1st', X - 10, Y + 18, 12); }
      else if (k === 'car') { L(X, Y + 20, X + 70, Y + 20); L(X + 4, Y + 20, X + 12, Y + 4); L(X + 12, Y + 4, X + 50, Y + 4); L(X + 50, Y + 4, X + 62, Y + 20); ring(X + 16, Y + 26, 8); ring(X + 56, Y + 26, 8); for (let k2 = 0; k2 < 3; k2++) L(X - 30 + k2 * 4, Y + 6 + k2 * 8, X - 8, Y + 6 + k2 * 8, 1.6); }
      else if (k === 'scribble') { g.lineWidth = 2.6; g.beginPath(); g.moveTo(X, Y); for (let k2 = 0; k2 < 34; k2++) g.lineTo(X + r() * (w || 80), Y + r() * 50); g.stroke(); }
      else if (k === 'present') { L(X, Y, X + 40, Y); L(X + 40, Y, X + 40, Y + 32); L(X + 40, Y + 32, X, Y + 32); L(X, Y + 32, X, Y); L(X + 20, Y, X + 20, Y + 32); ring(X + 13, Y - 6, 7, 2); ring(X + 27, Y - 6, 7, 2); }
      else if (k === 'sun') { ring(X, Y, 20); for (let k2 = 0; k2 < 8; k2++) { const a = k2 / 8 * 7; L(X + Math.cos(a) * 26, Y + Math.sin(a) * 26, X + Math.cos(a) * 38, Y + Math.sin(a) * 38, 2); } }
      else if (k === 'star') { g.lineWidth = 3; g.beginPath(); for (let k2 = 0; k2 <= 10; k2++) { const a = -Math.PI / 2 + k2 * Math.PI / 5, rr = k2 % 2 ? 26 : 62; const [px, py] = wob(X + Math.cos(a) * rr, Y + Math.sin(a) * rr, 6); k2 ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); scrawl('10/10', X - 24, Y + 8, 18); }
      else if (k === 'tv') { L(X, Y, X + 64, Y); L(X + 64, Y, X + 64, Y + 46); L(X + 64, Y + 46, X, Y + 46); L(X, Y + 46, X, Y); L(X + 6, Y + 6, X + 58, Y + 6, 1.4); L(X + 58, Y + 6, X + 58, Y + 40, 1.4); L(X + 58, Y + 40, X + 6, Y + 40, 1.4); L(X + 6, Y + 40, X + 6, Y + 6, 1.4); L(X + 20, Y, X + 10, Y - 16); L(X + 40, Y, X + 50, Y - 16); }
      else if (k === 'text') scrawl(w, X, Y, 15);
      else if (k === 'big') scrawl(w, X, Y, 30);
    };
    (p.write || []).forEach((t, i) => scrawl(t, ox + 14 + (r() - 0.5) * 4, oy + 30 + i * 22, i ? 15 : 19));
    for (const t of p.things || []) thing(...t);
    for (const [x, label, o] of p.men || []) stick(x, label, o);
    for (const [t, lx, ly, tx, ty] of p.arrows || []) arrow(t, ox + lx, oy + ly, ox + tx, oy + ty);
    if (p.tbc) scrawl('TO BE CONTINUDE...', ox + PW - 190, oy + PH - 14, 16);
    // the panel border: a wobbly biro box, gone over twice
    g.lineWidth = 2.6; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(...wob(ox + 3, oy + 3, 4)); g.lineTo(...wob(ox + PW - 3, oy + 4, 4)); g.lineTo(...wob(ox + PW - 4, oy + PH - 3, 4)); g.lineTo(...wob(ox + 3, oy + PH - 4, 4)); g.closePath(); g.stroke(); }
    g.restore();
  }
  // a Ribena ring: Dave puts his drink down on everything
  function stain(g, x, y) {
    g.save(); for (let k = 0; k < 3; k++) { g.strokeStyle = `rgba(150,60,120,${0.16 + k * 0.05})`; g.lineWidth = 5 - k * 1.5; g.beginPath(); g.ellipse(x + k, y, 38 - k * 2, 34 - k, 0.2, 0.3 + k, Math.PI * 1.85 + k * 0.3); g.stroke(); }
    g.fillStyle = 'rgba(150,60,120,.05)'; g.beginPath(); g.ellipse(x, y, 34, 30, 0.2, 0, 7); g.fill(); g.restore();
  }

  // ================================================================ laying out a strip on one canvas
  function layout(n, maxCols) { maxCols = maxCols || 3; if (n === 1) return 1; if (n === 4) return Math.min(2, maxCols); return Math.min(maxCols, n); }
  function drawStrip(cv, strip, opts) {
    opts = opts || {};
    const panels = opts.panels || strip.p, cols = layout(panels.length, opts.maxCols), rows = Math.ceil(panels.length / cols);
    cv.width = cols * PW + (cols + 1) * GUT; cv.height = rows * PH + (rows + 1) * GUT;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    if (strip.kind === 'dave') davePaper(g, 2, 2, cv.width - 4, cv.height - 4, panels.length, true); // one page, torn out of his rough book
    panels.forEach((p, i) => {
      const row = Math.floor(i / cols), inRow = Math.min(cols, panels.length - row * cols), shift = (cols - inRow) * (PW + GUT) / 2; // centre a short last row
      const ox = GUT + (i % cols) * (PW + GUT) + shift, oy = GUT + row * (PH + GUT);
      if (strip.kind === 'dave') { daveDraw(g, p, ox, oy, i * 7 + 1, false); const hsh = [...String(strip.id || '')].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0; if (i === hsh % panels.length) stain(g, ox + 70 + hsh % (PW - 140), oy + 90 + (hsh >> 4) % (PH - 160)); return; }
      const heads = paint(p);
      g.drawImage(lo, ox, oy, PW, PH);
      letter(g, p, heads, ox, oy);
      g.strokeStyle = '#000'; g.lineWidth = 4; g.strokeRect(ox - 1, oy - 1, PW + 2, PH + 2);
    });
    return cv;
  }
  function thumb(cv, strip, i) {
    const p = strip.p[i || 0]; cv.width = LW; cv.height = LH;
    const g = cv.getContext('2d');
    if (strip.kind === 'dave') { const big = document.createElement('canvas'); big.width = PW + 12; big.height = PH + 12; const bg2 = big.getContext('2d'); bg2.fillStyle = '#fff'; bg2.fillRect(0, 0, PW + 12, PH + 12); daveDraw(bg2, p, 6, 6, 1, true); g.imageSmoothingEnabled = true; g.drawImage(big, 0, 0, LW, LH); return cv; }
    paint(p); g.drawImage(lo, 0, 0); return cv;
  }
  function portrait(cv, id) {
    cv.width = 48; cv.height = 48; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const k = CAST[id];
    const bgc = { jack: '#9fd0ff', dave: '#ffe080', kim: '#e0c0ff', mom: '#ffd0e0', dad: '#d8c8a8', gran: '#e8e0ff', ali: '#d0f0d0', gavin: '#ffd0a0', luke: '#ffc8c8', otherjack: '#c8f0d0', callum: '#d0d0e8', biscuit: '#fff0d0', gubbinz: '#c8f0b0', pc: '#d0e0ff', modem: '#e8e8e8' }[id] || '#eee';
    overlays = []; R(0, 0, LW, LH, bgc);
    let hd;
    if (id === 'biscuit') hd = cat({ x: 64, ex: 'smug' }); else if (id === 'gubbinz') hd = grot({ x: 64, ex: 'grin' }); else if (id === 'pc') hd = pcDesk({ x: 64, ex: 'happy', nodesk: 0 }); else if (id === 'modem') hd = modem({ x: 64, y: -30, ex: 'happy' }); else hd = person(k, { x: 64, pose: 'stand', ex: 'happy', f: 1 });
    const size = id === 'modem' ? 24 : id === 'pc' ? 44 : id === 'biscuit' ? 28 : id === 'gubbinz' ? 34 : 32, r = hd.r || [hd.hx - 8, hd.hy, hd.hx + 8, hd.hy + 16];
    const cx = Math.max(size / 2, Math.min(LW - size / 2, (r[0] + r[2]) / 2)), cy = Math.max(size / 2, Math.min(LH - size / 2, (r[1] + r[3]) / 2 + (id === 'pc' ? 8 : id === 'modem' ? 0 : id === 'biscuit' ? 4 : 3)));
    g.drawImage(lo, cx - size / 2, cy - size / 2, size, size, 0, 0, 48, 48);
    return cv;
  }

  // ================================================================ THE STRIPS (released on their day in 1999). c: [who, x, pose, face, facing, {extras}], s: [who, words, type]
  // Running gags: Mom needs the phone line at the worst moment. Dad vs the computer. Callum's PC. Dave and Luke and Nintendo.
  // There are two Jacks (JackK is the one with the backwards cap). The PC crashes when it matters. The cat. And now and then, Dave's Comik.
  const STRIPS = [
    { id: 'euro', t: 'Invisible Money', d: '01/01', p: [
      { bg: 'park', c: [['callum', 22, 'point', 'smug', 1], ['jack', 58, 'stand', 'neutral', -1], ['dave', 82, 'stand', 'neutral', -1], ['luke', 108, 'stand', 'neutral', -1]], s: [['callum', 'From today, half of Europe has the same money. The Euro.']] },
      { bg: 'park', c: [['callum', 22, 'hips', 'smug', 1], ['dave', 80, 'think', 'think', -1]], s: [['dave', 'Can you buy an ULTRA 64 with it?'], ['callum', 'You can\'t even TOUCH it. It\'s only in computers till 2002.']] },
      { bg: 'park', c: [['luke', 26, 'shrug', 'neutral', 1], ['jack', 64, 'stand', 'smug', 1], ['callum', 102, 'stand', 'worried', -1]], s: [['luke', 'So it\'s money you can\'t see or spend.'], ['jack', 'Like my pocket money, then.']] } ] },
    { id: 'resolution', t: 'The Resolution', d: '04/01', p: [
      { bg: 'living', c: [['dad', 40, 'hold', 'happy', 1, { hold: 'notepad' }], ['jack', 88, 'stand', 'neutral', -1]], s: [['dad', 'New Year\'s resolution: I will UNDERSTAND the computer.'], ['jack', 'Good luck, Dad.']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 70, '', 'happy'], ['dad', 46, 'type', 'worried', 1]], s: [['dad', 'It says "press any key". Where\'s the ANY key?']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 70, '', 'sweat'], ['dad', 46, 'type', 'angry', 1], ['jack', 108, 'facepalm', 'sad', -1]], s: [['off:Mom:L', 'He said that last year.'], ['jack', 'And the year before.']], capb: '4th January. Resolution: broken.' } ] },
    { id: 'oneside', t: 'One Side', d: '16/01', p: [
      { bg: 'bedroom', c: [['jack', 50, 'hold', 'grin', 1, { hold: 'cube' }]], s: [['jack', 'I\'ve done one WHOLE side of the Rubrick\'s cube!']] },
      { bg: 'bedroom', c: [['jack', 34, 'stand', 'shock', 1], ['kim', 72, 'hold', 'smug', -1, { hold: 'cube' }]], s: [['kim', 'Can I have a go?']], fx: [['CLICK CLICK CLICK', 80, 30, 24, '#ffd400', -6]] },
      { bg: 'bedroom', c: [['jack', 34, 'stand', 'shock', 1], ['kim', 72, 'hold', 'happy', -1, { hold: 'cubedone' }]], s: [['kim', 'Forty seconds. There\'s a method. Want me to show you?']] },
      { bg: 'bedroom', c: [['jack', 46, 'hold', 'angry', 1, { hold: 'cube' }], ['biscuit', 100, 'sit', 'smug', -1]], s: [['jack', 'No! I\'m working it out MYSELF.'], ['biscuit', '...he peeled the stickers off last time.', 't']] } ] },
    { id: 'banana', t: 'Incoming!', d: '30/01', p: [
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'game'], ['jack', 40, 'type', 'grin', 1], ['dave', 96, 'stand', 'happy', -1]], s: [['dave', 'Worms! My team\'s called THE DAVE ARMY.'], ['jack', 'Mine\'s called DAVE\'S DOOMED.']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'game'], ['jack', 40, 'type', 'smug', 1], ['dave', 96, 'shock', 'shock', -1]], s: [['jack', 'Banana bomb. Bye bye, Dave Army.']], fx: [['BOOM!', 64, 22, 40, '#ff8a00', -10]] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['jack', 30, 'stand', 'neutral', 1], ['dave', 58, 'stand', 'neutral', 1], ['mom', 104, 'hips', 'angry', -1]], s: [['mom', 'What on EARTH was that explosion?'], ['jack', 'A sheep.'], ['dave', 'A really good sheep.']] } ] },
    { id: 'valentine', t: 'Secret Admirer', d: '14/02', single: 1, p: [
      { bg: 'living', c: [['jack', 46, 'hold', 'shock', 1, { hold: 'card' }], ['gran', 90, 'stand', 'smug', -1]], s: [['jack', 'A Valentine! From a SECRET admirer!'], ['gran', 'Ooh, how exciting.']], capb: 'It was signed "love from Gran xxx". In biro. With her address.' } ] },
    { id: 'pancake', t: 'Flipping Champion', d: '16/02', p: [
      { bg: 'kitchen', c: [['mom', 40, 'hold', 'happy', 1, { hold: 'pan' }], ['dad', 86, 'stand', 'smug', -1]], s: [['dad', 'Stand back, love. I was pancake-flipping champion of 1974.']] },
      { bg: 'kitchen', c: [['dad', 50, 'holdup', 'grin', 1, { hold: 'pan' }], ['jack', 96, 'stand', 'worried', -1]], fx: [['FLOOMP!', 64, 26, 36, '#ffd400', -8]] },
      { bg: 'kitchen', c: [['dad', 30, 'stand', 'think', 1, { hold: 'pan' }], ['mom', 64, 'stand', 'think', 1], ['jack', 98, 'stand', 'think', -1]], fr: [['pancake', 100, 4]], s: [['dad', 'Has anyone seen the pancake?']], capb: 'It came down in April.' } ] },
    { id: 'snake', t: 'Tactical Espionage Biscuits', d: '27/02', p: [
      { bg: 'kitchen', c: [['jack', 50, 'stand', 'smug', 1]], s: [['jack', 'Mission: the biscuit tin. Nobody must see me.']], fr: [['box', 92, G]] },
      { bg: 'kitchen', c: [['mom', 30, 'stand', 'neutral', 1, { hold: 'mug' }]], fr: [['box', 90, G]], fx: [['!', 90, 58, 40, '#e10600', 0]] },
      { bg: 'kitchen', c: [['mom', 34, 'cross', 'smug', 1], ['jack', 88, 'hold', 'worried', -1, { hold: 'biscuit' }]], s: [['mom', 'Nice try, soldier. Homework.'], ['jack', 'How did you know?'], ['mom', 'Boxes don\'t breathe, love.']] } ] },
    { id: 'trailer', t: 'The Download', d: '12/03', sunday: 1, p: [
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'progress', 1, { pct: 0.01, modem: 'yell' }], ['jack', 36, 'type', 'grin', 1]], s: [['jack', 'The new Intergalactic Battles trailer! Only 25 megabytes!']], fx: [['SKREEEE-BONG', 92, 26, 22, '#3cf', 6]] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'progress', 1, { pct: 0.3, modem: 'neutral' }], ['jack', 36, 'type', 'sleep', 1, { zzz: 1 }]], cap: 'One hour later...', over: [['31%', 64, 58, 13, '#000']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'progress', 1, { pct: 0.99, modem: 'happy' }], ['jack', 36, 'type', 'grin', 1]], cap: 'Two hours and thirty-nine minutes later...', s: [['jack', '99%! NEARLY!']], over: [['99%', 64, 58, 13, '#000']] },
      { bg: 'kitchen', o: { offhook: 1 }, c: [['mom', 26, 'hold', 'happy', 1, { hold: 'phone' }]], s: [['mom', 'I\'ll just give Auntie Pat a quick ring.']], fx: [['click', 20, 40, 18, '#fff', 0]] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'sad', 1, { modem: 'sad' }], ['jack', 36, 'shock', 'shock', 1, { nochair: 1 }]], s: [['jack', 'NOOOOOOOO!!!', 'y']], over: [['NO CARRIER', 64, 62, 10, '#3cf']] },
      { bg: 'kitchen', o: { offhook: 1 }, c: [['mom', 30, 'hold', 'happy', 1, { hold: 'phone' }], ['jack', 90, 'slump', 'cry', -1]], s: [['mom', 'Auntie Pat says hello, love!']] } ] },
    { id: 'mothersday', t: 'Card Trick', d: '14/03', p: [
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'text'], ['jack', 36, 'type', 'grin', 1]], s: [['jack', 'A Mother\'s Day card. Made in Paint. Four hours.']] },
      { bg: 'kitchen', c: [['mom', 40, 'hold', 'laugh', 1, { hold: 'card' }], ['jack', 90, 'stand', 'happy', -1]], s: [['mom', 'Oh, it\'s LOVELY! Wait till I tell your Auntie Pat!']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'sad', 1, { modem: 'sad' }], ['jack', 36, 'type', 'sad', 1]], over: [['NO CARRIER', 64, 62, 10, '#3cf']], s: [['off:Mom (downstairs):R', '...and he did it ALL on the COMPUTER, Pat...']], capb: 'Two hours. Every time.' } ] },
    { id: 'club', t: 'Computer Club', d: '23/03', p: [
      { bg: 'complab', c: [['ali', 64, 'point', 'happy', -1]], s: [['ali', 'Welcome to Computer Club! Today: SPREADSHEETS.']], fx: [['GROAN', 30, 76, 24, '#ffd400', -6]] },
      { bg: 'complab', c: [['pc', 68, '', 'mines'], ['jack', 40, 'type', 'smug', 1], ['dave', 104, 'point', 'grin', -1]], s: [['dave', 'Psst. Is it on?', 'w'], ['jack', 'Bugsweeper\'s on.', 'w']] },
      { bg: 'complab', c: [['pc', 58, '', 'mines'], ['jack', 30, 'type', 'shock', 1], ['ali', 100, 'hips', 'smug', -1]], s: [['ali', 'That\'s a very... interesting... spreadsheet, boys.']] },
      { bg: 'complab', c: [['pc', 92, '', 'mines'], ['jack', 18, 'stand', 'shock', 1], ['dave', 40, 'stand', 'shock', 1], ['ali', 66, 'type', 'angry', 1]], s: [['ali', 'Shift up. I\'ve got a best time to beat.']], capb: '{teacher}\'s record: 61 seconds. Nobody has ever seen {teacher.him} do a spreadsheet.' } ] },
    { id: 'aprilfool', t: 'April Fool', d: '01/04', p: [
      { bg: 'playground', c: [['jack', 26, 'stand', 'worried', 1], ['dave', 78, 'stand', 'neutral', -1], ['luke', 104, 'stand', 'neutral', -1]], s: [['jack', 'Lads... it\'s in the paper. Ultra Entertainment are only making PC games now.']] },
      { bg: 'playground', c: [['dave', 44, 'shock', 'shock', 1], ['luke', 82, 'shock', 'cry', -1]], s: [['luke', 'NOT MARLO!!!', 'y']], fr: [['gameboy', 66, 92]], fx: [['CLATTER', 64, 80, 22, '#ffd400', 4]] },
      { bg: 'playground', c: [['dave', 10, 'fall', 'ko', -1, { tilt: 1.57 }], ['callum', 76, 'cheer', 'laugh', 1], ['jack', 110, 'shrug', 'worried', -1]], s: [['callum', 'FINALLY! Welcome to PROPER games!'], ['jack', '...April Fool?']] } ] },
    { id: 'jjj', t: 'Homework', d: '10/04', p: [
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'text'], ['jack', 36, 'type', 'happy', 1]], s: [['jack', 'Last sentence... DONE. Time for crisps.']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'jjj'], ['biscuit', 66, 'sit', 'smug', 1, { y: -26 }]], fx: [['jjjjjjjjjjjj', 64, 22, 22, '#9fd0ff', 0]] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'jjj'], ['jack', 30, 'hold', 'shock', 1, { hold: 'crisps', nochair: 1 }], ['biscuit', 66, 'sleep', 'sleep', 1, { y: -26 }]], s: [['jack', '{cat.NAME}! You SAVED it! It\'s nine pages of "j"!']], over: [['jjjjjjjj.doc', 64, 55, 8, '#000']] } ] },
    { id: 'floppy', t: 'One Point Four Four', d: '17/04', p: [
      { bg: 'bedroom', o: { nobed: 1 }, c: [['dad', 90, 'hold', 'happy', -1, { hold: 'floppy' }], ['jack', 40, 'stand', 'neutral', 1]], s: [['dad', 'Here. 1.44 megabytes. Plenty for an essay.']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'sad'], ['jack', 36, 'type', 'worried', 1]], over: [['DISK FULL', 64, 58, 11, '#e10600']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['dad', 40, 'think', 'neutral', 1], ['jack', 90, 'stand', 'smug', -1]], s: [['dad', 'How many photos of the CAT are in this essay?'], ['jack', 'Forty. It\'s about the Romans.']] } ] },
    { id: 'davecomik2', t: 'Dave\'s Comik 2 (by Dave)', d: '22/04', kind: 'dave', p: [
      { write: ['DAVES COMIK 2!!!', 'now in {x:colour} biro (felt tips at lukes)'], men: [[200, 'me', { crown: 1 }]], arrows: [['me (best)', 250, 150, 214, 190]] },
      { write: ['me and luke play the', 'ULTRA 64 it is the best thing'], things: [['n64', 150, 160]], men: [[70, 'me', {}], [310, 'luke', { small: 1 }]], arrows: [['the best thing', 236, 120, 196, 160]] },
      { write: ['callum says PC is better'], things: [['pc', 260, 150]], men: [[110, 'callum', { sad: 1 }]], arrows: [['callum (wrong)', 150, 110, 128, 150], ['boring box', 250, 130, 280, 150]] },
      { write: ['THE END', 'luke came 2nd. i came 1st.'], things: [['trophy', 190, 120]], men: [[300, 'me', { up: 1 }]] } ], note: 'Dave did another one. He says it\'s in colour. It is not in colour. - Jack' },
    { id: 'virus', t: 'Virus Alert', d: '26/04', p: [
      { bg: 'living', c: [['dad', 46, 'hold', 'shock', 1, { hold: 'mag' }]], s: [['dad', 'It says here a computer virus goes off TODAY.']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 70, '', 'sad', 1, { scarf: 1 }], ['dad', 34, 'stand', 'worried', 1], ['jack', 108, 'stand', 'neutral', -1]], s: [['jack', 'Dad, it\'s not THAT kind of virus.'], ['dad', 'Better safe than sorry.']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 70, '', 'happy', 1, { scarf: 1, thermo: 1 }], ['dad', 34, 'stand', 'happy', 1]], s: [['dad', 'There. No temperature.']], fx: [['achoo', 98, 30, 20, '#fff', 8]] } ] },
    { id: 'daydream', t: 'Daydreamer', d: '07/05', p: [
      { bg: 'complab', c: [['jack', 50, 'think', 'happy', 1]], s: [['jack', 'Only ten weeks till the new Intergalactic Battles...', 't']] },
      { bg: 'space', fr: [['pod', 54, 77, 1]], c: [['jack', 54, 'cheer', 'grin', 1, { y: -20, hold: 'saber' }]], s: [['jack', 'Jack, ace pilot of the galaxy! Nobody is faster!']], fx: [['WHOOSH', 30, 80, 26, '#6cf', -4]] },
      { bg: 'space', fr: [['pod', 74, 81, -1], ['pod', 28, 91, 1]], c: [['callum', 74, 'point', 'smug', -1, { y: -16 }], ['jack', 28, 'shock', 'shock', 1, { y: -6 }]], s: [['callum', 'Move, loser! My spaceship\'s got 450 MEGAHERTZ.']] },
      { bg: 'complab', c: [['jack', 40, 'stand', 'shock', 1], ['ali', 90, 'point', 'angry', -1]], s: [['ali', 'JACK! What is the capital of France?'], ['jack', '...Tattyween?']] } ] },
    { id: 'tama', t: 'Eggbert', d: '15/05', p: [
      { bg: 'playground', c: [['kim', 34, 'hold', 'happy', 1, { hold: 'tama' }], ['jack', 76, 'stand', 'neutral', -1]], s: [['kim', 'My Eggbert is forty days old.']] },
      { bg: 'playground', c: [['jack', 40, 'stand', 'sad', 1], ['dave', 86, 'stand', 'neutral', -1]], s: [['jack', 'Mine died. I took it swimming.'], ['dave', 'Mine ran away.']] },
      { bg: 'playground', c: [['kim', 30, 'shrug', 'angry', 1], ['dave', 86, 'stand', 'smug', -1]], s: [['kim', 'They CAN\'T run away, Dave.'], ['dave', 'It\'s in the garden somewhere. Beeping.']] } ] },
    { id: 'overthere', t: 'No Spoilers', d: '19/05', p: [
      { bg: 'playground', c: [['callum', 26, 'point', 'smug', 1], ['jack', 66, 'stand', 'neutral', -1], ['otherjack', 92, 'stand', 'neutral', -1], ['dave', 116, 'stand', 'neutral', -1]], s: [['callum', 'Episode I is out in America TODAY. My cousin\'s seen it.']] },
      { bg: 'playground', c: [['callum', 26, 'hips', 'smug', 1], ['jack', 66, 'shock', 'shock', -1], ['otherjack', 92, 'shock', 'shock', -1], ['dave', 116, 'shock', 'yell', -1]], s: [['callum', 'I\'ll only tell you ONE thing...'], ['jack', 'LA LA LA LA LA!', 'y']] },
      { bg: 'playground', c: [['callum', 26, 'shrug', 'worried', 1], ['jack', 66, 'facepalm', 'yell', -1], ['otherjack', 92, 'facepalm', 'yell', -1], ['dave', 116, 'facepalm', 'yell', -1]], s: [['callum', '...he said the popcorn was quite salty.']], fx: [['LA LA LA', 90, 52, 22, '#fff', 6]] } ] },
    { id: 'gubbinzmail', t: 'Fan Mail', d: '22/05', p: [
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'happy'], ['jack', 36, 'type', 'happy', 1]], s: [['jack', 'Forty letters on my website this week! Let\'s read them...']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'shock'], ['gubbinz', 66, 'stand', 'grin', 1, { y: -27, hold: 'letter' }], ['jack', 30, 'type', 'shock', 1]], fx: [['MUNCH', 92, 30, 26, '#3c3', 8]] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'off'], ['gubbinz', 66, 'stand', 'happy', 1, { y: -27 }], ['jack', 30, 'facepalm', 'angry', 1, { nochair: 1 }]], s: [['jack', 'Gubbinz! Those were for ME!'], ['gubbinz', 'Dey was all fan mail. For ME. Burp.']] } ] },
    { id: 'injurytime', t: 'Injury Time', d: '26/05', p: [
      { bg: 'living', o: { night: 1, tv: '#2a8a3a' }, c: [['dad', 70, 'stand', 'neutral', -1], ['jack', 96, 'stand', 'worried', -1], ['luke', 118, 'stand', 'worried', -1]], s: [['dad', 'One-nil down. Ninety minutes up. It\'s over, lads. Bed.']] },
      { bg: 'playground', c: [['luke', 34, 'cheer', 'laugh', 1], ['jack', 82, 'stand', 'shock', -1]], cap: 'The next morning.', s: [['luke', 'TWO GOALS IN INJURY TIME!!!', 'y'], ['jack', 'WHAT?!']] },
      { bg: 'kitchen', c: [['dad', 40, 'hold', 'smug', 1, { hold: 'mug' }], ['jack', 92, 'stand', 'angry', -1]], s: [['dad', 'Never leave before the final whistle, son. I\'ve always said that.']] } ] },
    { id: 'gran', t: 'Gran vs Blockology', d: '29/05', p: [
      { bg: 'living', c: [['gran', 46, 'hold', 'neutral', 1, { hold: 'gameboy' }], ['jack', 90, 'point', 'happy', -1]], s: [['gran', 'What\'s this Game Lad thing, then?'], ['jack', 'Just turn the shapes and make lines, Gran.']] },
      { bg: 'living', o: { night: 1 }, c: [['gran', 56, 'hold', 'angry', 1, { hold: 'gameboy' }], ['jack', 96, 'slump', 'sleep', -1, { zzz: 1 }]], cap: 'Five hours later...', fx: [['beep boop', 32, 40, 18, '#9bbc0f', 0]] },
      { bg: 'living', o: { night: 1 }, c: [['gran', 46, 'cheer', 'grin', 1, { hold: 'gameboy' }], ['jack', 92, 'stand', 'shock', -1]], s: [['gran', 'LEVEL 20! GET IN!!!', 'y']] },
      { bg: 'living', o: { night: 1 }, c: [['gran', 40, 'hold', 'smug', 1, { hold: 'gameboy' }], ['jack', 90, 'stand', 'sad', -1]], s: [['jack', 'Can I have it back now, Gran?'], ['gran', 'Get your own, love.']] } ] },
    { id: 'matrix', t: 'There Is No Ball', d: '12/06', p: [
      { bg: 'park', c: [['jack', 44, 'stand', 'grin', 1], ['dave', 84, 'stand', 'grin', -1]], s: [['dave', 'THE MODEMTRIX! Best film EVER.'], ['jack', 'Do the bit where he dodges!']] },
      { bg: 'park', c: [['dave', 76, 'stand', 'smug', -1, { tilt: 0.55 }], ['jack', 26, 'point', 'grin', 1, { hold: 'ball' }]], s: [['dave', 'Throw it. I\'ll dodge it in slow motion.']], fx: [['sloooow', 104, 40, 18, '#fff', 0]] },
      { bg: 'park', c: [['dave', 66, 'fall', 'ko', -1, { tilt: 1.57 }], ['jack', 26, 'shrug', 'neutral', 1]], fr: [['ball', 118, 84]], s: [['dave', 'There... is no... ball...'], ['jack', 'There was a ball.']], fx: [['BONK', 104, 58, 30, '#ffd400', 10]] } ] },
    { id: 'carpark', t: 'The Car Park', d: '26/06', p: [
      { bg: 'daves', o: { tvpic: 'car' }, c: [['dave', 82, 'sitfloor', 'angry', -1, { pad: 1, y: -4 }]], s: [['dave', 'Burnout, 180, slalom... in ONE MINUTE?!']] },
      { bg: 'daves', o: { tvpic: 'car' }, c: [['dave', 82, 'sitfloor', 'sad', -1, { pad: 1, y: -4 }]], cap: 'Two weeks later.', s: [['dave', 'Still the car park.']] },
      { bg: 'daves', o: { tvpic: 'car' }, c: [['dad', 82, 'sitfloor', 'smug', -1, { pad: 1, y: -4 }], ['dave', 112, 'stand', 'neutral', -1]], s: [['dad', 'Let me have a go. I drive every day.']] },
      { bg: 'daves', o: { tv: '#e10600' }, c: [['dad', 82, 'sitfloor', 'shock', -1, { pad: 1, y: -4 }], ['dave', 112, 'stand', 'smug', -1]], s: [['dad', 'Why am I upside down? Where\'s the BRAKE?']], fx: [['CRASH!', 50, 22, 34, '#ff8a00', -8]] } ] },
    { id: 'davestrip', t: 'Guest Strip: Dave\'s Comik (by Dave)', d: '03/07', kind: 'dave', p: [
      { write: ['DAVES COMIK!!!', 'by dave (not jack)'], things: [['sun', 330, 50]], men: [[110, 'me', { crown: 1 }], [270, 'jack', { small: 1 }]], arrows: [['me', 150, 120, 124, 160]] },
      { write: ['this is me i am the best', 'at {x:goldneye} {x:goldenay} goldenballs'], men: [[190, '', { up: 1, big: 1 }]], things: [['trophy', 300, 150]], arrows: [['me (best)', 60, 150, 166, 170]] },
      { write: ['this is jack he is', '{x:rubbish} rubish (sorry jack)'], men: [[120, 'jack', { sad: 1 }], [270, 'odjob', {}]], arrows: [['(alowed)', 300, 112, 280, 140]] },
      { write: ['THE END', 'the next one will be in colour'], things: [['star', 192, 190]] } ], note: 'Dave asked if he could do a comic. I said yes. I regret it. - Jack' },
    { id: 'queue', t: 'The Queue', d: '15/07', sunday: 1, p: [
      { bg: 'cinema', o: { night: 1 }, c: [['jack', 30, 'sitfloor', 'grin', 1], ['dave', 70, 'sitfloor', 'happy', -1]], fr: [['sleepingbag', 50, 98]], cap: '6am. Opening day.', s: [['jack', 'First in the queue for Episode I!']] },
      { bg: 'cinema', c: [['jack', 22, 'sitfloor', 'neutral', 1], ['kim', 70, 'hold', 'happy', -1, { hold: 'flask' }]], s: [['kim', 'Second! I brought hot chocolate.']] },
      { bg: 'cinema', c: [['jack', 22, 'sitfloor', 'shock', 1], ['gran', 76, 'stand', 'happy', -1]], fr: [['deckchair', 100, 96]], s: [['gran', 'Third! I liked the one with the teddy bears.'], ['jack', 'GRAN?!']] },
      { bg: 'cinema', c: [['ali', 60, 'hold', 'worried', 1, { hold: 'saber' }]], cap: 'Midday.', s: [['ali', 'I\'m only here for my nephew. He\'s... in the toilet.']] },
      { bg: 'cinema', c: [['callum', 34, 'point', 'smug', 1], ['jack', 90, 'stand', 'angry', -1]], s: [['callum', 'My dad knows the manager. I\'m going in FIRST.']] },
      { bg: 'cinema', c: [['callum', 56, 'fall', 'ko', 1, { tilt: -1.2 }], ['gran', 96, 'hold', 'angry', -1, { hold: 'handbag' }]], fx: [['THWACK!', 50, 30, 36, '#ffd400', -10]], s: [['gran', 'Back of the queue, young man.']] },
      { bg: 'cinema', c: [['jack', 26, 'run', 'grin', 1], ['dave', 54, 'run', 'grin', 1], ['kim', 82, 'run', 'happy', 1], ['gran', 110, 'run', 'grin', 1]], fx: [['DOORS OPEN!!!', 64, 22, 28, '#3c3', -4]] },
      { bg: 'dark', c: [['jack', 30, 'sit', 'grin', 1, { nochair: 1, hold: 'popcorn' }], ['dave', 62, 'sit', 'shock', 1, { nochair: 1 }], ['gran', 96, 'sit', 'sleep', 1, { nochair: 1, zzz: 1 }]], fr: [['seats', 0, 104]], s: [['jack', 'It\'s starting!!!', 'w'], ['dave', 'Shhhh!', 'w']], dim: 0 } ] },
    { id: 'gbc', t: 'In Colour', d: '31/07', p: [
      { bg: 'park', c: [['luke', 40, 'hold', 'grin', 1, { hold: 'gbc' }], ['jack', 88, 'stand', 'neutral', -1]], s: [['luke', 'Game Lad Color! It\'s in COLOUR!']] },
      { bg: 'park', c: [['luke', 40, 'hold', 'happy', 1, { hold: 'gbc' }], ['jack', 88, 'shrug', 'smug', -1]], s: [['jack', 'So is real life.']] },
      { bg: 'park', c: [['luke', 40, 'hold', 'smug', 1, { hold: 'gbc' }], ['jack', 88, 'think', 'worried', -1]], s: [['luke', 'Real life hasn\'t got Blockology in it.'], ['jack', '...fair point. Can I have a go?']] } ] },
    { id: 'memcard', t: 'Fifteen Blocks', d: '07/08', p: [
      { bg: 'living', c: [['jack', 64, 'sitfloor', 'angry', -1, { pad: 1 }]], s: [['jack', 'Why is my memory card FULL? I had three saves!']] },
      { bg: 'living', o: { tv: '#202060' }, c: [['jack', 64, 'sitfloor', 'shock', -1, { pad: 1 }]], over: [['DAVE 1  DAVE 2  DAVE 3', 22, 35, 7, '#fff'], ['DAVE 4  DAVE 5  ...  DAVE 15', 22, 41, 7, '#fff']] },
      { bg: 'living', c: [['jack', 34, 'stand', 'angry', 1], ['dave', 88, 'stand', 'smug', -1]], s: [['jack', 'DAVE. What are all these?'], ['dave', 'Backups. Of the car park.']] } ] },
    { id: 'eclipse', t: 'The Eclipse', d: '11/08', p: [
      { bg: 'park', c: [['mom', 40, 'hold', 'angry', 1, { hold: 'glasses' }], ['jack', 84, 'stand', 'neutral', -1]], s: [['mom', 'NOBODY looks at the sun without these. Understood?']] },
      { bg: 'park', o: { dark: 1 }, c: [['dad', 28, 'stand', 'shock', 1], ['jack', 60, 'stand', 'shock', 1], ['dave', 96, 'stand', 'shock', -1]], s: [['dad', 'It\'s gone dark at elevenses!']], capb: 'The birds went quiet.' },
      { bg: 'park', o: { nobench: 1 }, pr: [['trunk', 30, 96]], c: [['dave', 82, 'fall', 'ko', 1, { tilt: -1.2, glasses: 1 }]], fx: [['CLONK', 64, 30, 34, '#ffd400', -6]], s: [['dave', 'Is it over yet? Why is there a tree?']], capb: 'Dave kept the glasses on all day. Just in case.' } ] },
    { id: 'greentide', t: 'The Green Tide', d: '21/08', p: [
      { bg: 'bedroom', c: [['jack', 50, 'sit', 'worried', 1, { hold: 'brush' }]], fr: [['ork', 74, 70], ['paint', 84, 72]], s: [['jack', 'Steady... steady... the last eye...']] },
      { bg: 'bedroom', c: [['jack', 50, 'sit', 'shock', 1], ['biscuit', 84, 'sit', 'shock', -1, { y: -16, green: 1 }]], fx: [['SPLAT!', 84, 40, 34, '#3c3', 8]] },
      { bg: 'living', c: [['biscuit', 50, 'sit', 'smug', 1, { green: 1 }], ['jack', 90, 'stand', 'worried', -1]], s: [['off:Mom:L', 'WHY ARE THERE GREEN PAWPRINTS ON MY SOFA?', 'y'], ['jack', 'It\'s... modern art?']] } ] },
    { id: 'davecomik3', t: 'Dave\'s Comik 3: The Car Park (by Dave)', d: '02/09', kind: 'dave', p: [
      { write: ['DAVES COMIK 3', 'i beat the car park!!!!'], things: [['car', 150, 170]], arrows: [['me in car', 40, 140, 160, 175]] },
      { write: ['100% TRUE', 'luke saw (luke was at his nans)'], things: [['scribble', 120, 140, 140]], arrows: [['{x:crash} not a crash', 40, 240, 140, 190]] },
      { write: ['then i did a 180', 'and a burnout and a {x:slarlom}', '{x:slalom} wiggle'], things: [['car', 210, 190]], men: [[90, 'me', { crown: 1 }]] },
      { write: ['the car park was', 'scared of me'], things: [['big', 60, 200, 'THE END?']], tbc: 1 } ] },
    { id: 'bug', t: 'Prepared', d: '04/09', p: [
      { bg: 'kitchen', c: [['dad', 50, 'hold', 'happy', 1, { hold: 'candle' }]], fr: [['tins', 96, 92]], s: [['dad', 'When the Millennium Bug comes, this family will be READY.']] },
      { bg: 'kitchen', c: [['dad', 40, 'stand', 'neutral', 1], ['jack', 88, 'shrug', 'neutral', -1]], fr: [['tins', 68, 92]], s: [['jack', 'Dad, it just makes old computers think it\'s 1900.']] },
      { bg: 'kitchen', c: [['dad', 40, 'point', 'smug', 1], ['jack', 88, 'think', 'worried', -1]], fr: [['tins', 68, 92]], s: [['dad', 'Exactly. And in 1900 there WERE no computers. So where do they go?'], ['jack', '...I can\'t argue with that.']] } ] },
    { id: 'jackone', t: 'Jack One', d: '08/09', p: [
      { bg: 'complab', c: [['ali', 22, 'point', 'neutral', 1], ['jack', 74, 'stand', 'happy', -1], ['otherjack', 104, 'stand', 'happy', -1]], cap: 'First week back.', s: [['ali', 'Jack, give these out, please.'], ['jack', 'Yes {teacher.sir}?'], ['otherjack', 'Yes {teacher.sir}?']] },
      { bg: 'complab', c: [['ali', 22, 'stand', 'worried', 1], ['jack', 74, 'point', 'smug', 1], ['otherjack', 104, 'hips', 'angry', -1]], s: [['jack', 'He means you, Jack K.'], ['otherjack', 'No he doesn\'t. YOU\'RE the spare Jack.']] },
      { bg: 'complab', c: [['ali', 22, 'facepalm', 'angry', 1], ['jack', 74, 'point', 'yell', 1], ['otherjack', 104, 'point', 'yell', -1]], s: [['ali', 'Fine. You\'re Jack One and Jack Two.'], ['jack', 'I\'M Jack One!', 'y']] } ] },
    { id: 'dreamcastusa', t: 'Imported', d: '18/09', p: [
      { bg: 'playground', c: [['callum', 40, 'point', 'smug', 1], ['jack', 84, 'stand', 'shock', -1], ['dave', 108, 'stand', 'shock', -1]], s: [['callum', 'My uncle sent me a Daydream from America. I\'ve had it TEN DAYS.']] },
      { bg: 'playground', c: [['dave', 40, 'think', 'neutral', 1], ['callum', 88, 'stand', 'worried', -1]], s: [['dave', 'Does an American one work on our tellies?'], ['callum', 'It\'s... FINE.']] },
      { bg: 'living', o: { tv: '#888', tvroll: 1 }, c: [['callum', 70, 'shrug', 'worried', -1]], s: [['callum', 'It\'s meant to look like this. It\'s ARTISTIC.']], capb: 'Black and white. And it rolled.' } ] },
    { id: 'millionaire', t: 'Ring a Mate', d: '21/09', p: [
      { bg: 'living', o: { night: 1, tv: '#3a2a8a' }, c: [['dad', 56, 'point', 'shock', -1], ['mom', 84, 'stand', 'worried', -1], ['jack', 112, 'stand', 'neutral', -1]], s: [['dad', 'It\'s B! FINAL ANSWER! Lock it in!'], ['jack', 'Dad. You\'re not ON it.']] },
      { bg: 'living', o: { night: 1, tv: '#3a2a8a' }, c: [['dad', 56, 'facepalm', 'worried', -1], ['mom', 90, 'hold', 'happy', -1, { hold: 'phone' }]], s: [['dad', 'I don\'t KNOW! Fifty-fifty!'], ['mom', 'Ring a Mate! I\'ll ring Pat. She\'ll know.']] },
      { bg: 'bedroom', o: { nobed: 1, night: 1 }, c: [['pc', 64, '', 'sad', 1, { modem: 'sad' }], ['jack', 36, 'type', 'cry', 1]], over: [['NO CARRIER', 64, 62, 10, '#3cf']], s: [['jack', 'Every. Single. Time.']] } ] },
    { id: 'cyan', t: 'Out of Cyan', d: '25/09', p: [
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'text'], ['jack', 36, 'type', 'happy', 1]], s: [['jack', 'My Solar System poster is DONE. Print!']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'cyan'], ['jack', 36, 'type', 'shock', 1]], over: [['OUT OF CYAN', 64, 58, 9, '#000080']], fx: [['BEEP BEEP BEEP', 64, 22, 22, '#e10600', -4]] },
      { bg: 'complab', c: [['ali', 40, 'hold', 'think', 1, { hold: 'poster' }], ['jack', 90, 'stand', 'worried', -1]], s: [['ali', 'Jack, why is the sea pink? And Neptune? And the sky?'], ['jack', 'It\'s a sunset solar system, {teacher.sir}.']] } ] },
    { id: 'pokemon', t: 'Gotta Pick \'Em All', d: '05/10', sunday: 1, p: [
      { bg: 'shops', c: [['jack', 26, 'stand', 'grin', 1], ['kim', 56, 'stand', 'happy', 1], ['dave', 86, 'stand', 'grin', 1], ['shop', 116, 'stand', 'neutral', -1]], over: [['GAMES \'N\' THAT', 64, 22, 12, '#ffd400']], s: [['shop', 'Pocket Critters! Moss and Puddle! Out today!']] },
      { bg: 'bedroom', c: [['jack', 50, 'sitfloor', 'grin', 1, { hold: 'gameboy' }]], s: [['jack', 'Starter Pocket Critters... I choose SQUIRTURTLE.']] },
      { bg: 'daves', c: [['dave', 50, 'sitfloor', 'grin', 1, { hold: 'gameboy' }]], s: [['dave', 'Starter Pocket Critters... I choose SQUIRTURTLE.']] },
      { bg: 'kitchen', o: { offhook: 1 }, c: [['jack', 40, 'hold', 'happy', 1, { hold: 'phone' }]], s: [['jack', 'Which one did you pick?'], ['off:Dave (on the phone):R', 'SQUIRTURTLE!']] },
      { bg: 'playground', c: [['kim', 40, 'facepalm', 'angry', 1], ['jack', 78, 'stand', 'happy', -1], ['dave', 106, 'stand', 'happy', -1]], s: [['kim', 'You pick DIFFERENT ones so you can TRADE!']] },
      { bg: 'playground', c: [['jack', 50, 'stand', 'shock', 1], ['dave', 82, 'stand', 'shock', -1]], s: [['jack', '...'], ['dave', '...'], ['off:Mom:R', 'WHO has been on the phone for an HOUR?', 'y']] } ] },
    { id: 'dreamcast', t: 'Saving Up', d: '14/10', p: [
      { bg: 'shops', c: [['jack', 40, 'stand', 'grin', 1], ['dave', 80, 'stand', 'grin', -1]], over: [['GAMES \'N\' THAT', 64, 22, 12, '#ffd400'], ['DAYDREAM £199.99', 74, 42, 9, '#e10600']], s: [['jack', 'The Daydream is out! It\'s got a MODEM in it!']] },
      { bg: 'shops', c: [['jack', 44, 'hold', 'worried', 1, { hold: 'coins' }], ['dave', 82, 'hold', 'worried', -1, { hold: 'coins' }]], s: [['dave', 'How much have we got?'], ['jack', 'Three pounds forty-seven. And a button.']] },
      { bg: 'shops', c: [['jack', 44, 'think', 'neutral', 1], ['dave', 82, 'think', 'neutral', -1]], s: [['dave', 'So we need about £196 more.'], ['jack', 'Christmas.'], ['dave', 'Which one?']] } ] },
    { id: 'robot1', t: 'Robo Rumble (Part 1)', d: '23/10', p: [
      { bg: 'garage', c: [['jack', 40, 'cheer', 'grin', 1], ['dave', 84, 'cheer', 'grin', -1]], s: [['jack', 'We are building a robot. For ROBO RUMBLE.']] },
      { bg: 'garage', c: [['dave', 46, 'hold', 'grin', 1, { hold: 'drill' }], ['jack', 94, 'stand', 'worried', -1]], fx: [['BZZZZT', 70, 30, 30, '#ffd400', -8]], s: [['jack', 'Is that your dad\'s drill?']] },
      { bg: 'garage', c: [['jack', 30, 'point', 'grin', 1], ['dave', 106, 'stand', 'grin', -1]], fr: [['robot', 68, 94]], s: [['jack', 'Behold: SIR HOOVERS-A-LOT! Part Vacuum. Part skateboard. ALL fury.']] },
      { bg: 'garage', c: [['jack', 30, 'shock', 'shock', 1], ['biscuit', 104, 'sit', 'shock', -1]], fr: [['robot', 70, 94]], fx: [['WHIRRRR', 70, 54, 24, '#e10600', 6]], s: [['jack', 'It\'s ALIVE! It\'s... going for the cat!']], capb: 'TO BE CONTINUED...' } ] },
    { id: 'robot2', t: 'Robo Rumble (Part 2)', d: '30/10', p: [
      { bg: 'kitchen', c: [['biscuit', 30, 'sit', 'shock', 1], ['dave', 104, 'run', 'shock', -1]], fr: [['robot', 70, 94]], cap: 'Previously: a robot. A cat. Trouble.', fx: [['VRRRRM', 70, 50, 26, '#ffd400', 0]] },
      { bg: 'living', c: [['dad', 96, 'fall', 'shock', 1, { tilt: -1.4, dizzy: 1 }]], fr: [['robot', 28, 94]], fx: [['CRASH!', 64, 26, 36, '#ff8a00', -8]] },
      { bg: 'living', o: { nosofa: 1 }, c: [['mom', 30, 'stand', 'shock', 1], ['jack', 104, 'stand', 'worried', -1]], fr: [['robot', 66, 94]], s: [['mom', 'Is it... HOOVERING the carpet?'], ['jack', 'It does that when it\'s angry.']] },
      { bg: 'living', o: { nosofa: 1 }, c: [['mom', 34, 'stand', 'happy', 1], ['jack', 90, 'stand', 'shock', -1], ['dave', 114, 'stand', 'shock', -1]], s: [['mom', 'Boys. Can you make me ANOTHER one?']] } ] },
    { id: 'halloween', t: 'Trick or Treat', d: '31/10', single: 1, p: [
      { bg: 'hall', o: { night: 1 }, c: [['jack', 40, 'pointup', 'grin', 1, { hold: 'saber', nocap: 1, top: '#8a5a3a', pat: 'plain' }], ['dave', 76, 'stand', 'happy', 1], ['gran', 112, 'stand', 'happy', -1]], fr: [['console', 76, 84], ['pumpkin', 18, 92]], s: [['gran', 'Ooh! A little monk and a... cardboard box?'], ['dave', 'I\'m a DAYDREAM.']] } ] },
    { id: 'bonfire', t: 'The Big One', d: '05/11', p: [
      { bg: 'park', o: { dark: 1, nobench: 1 }, c: [['callum', 30, 'point', 'smug', 1], ['jack', 80, 'stand', 'neutral', -1], ['luke', 106, 'stand', 'neutral', -1]], fr: [['rocket', 58, 96]], s: [['callum', 'My dad\'s rocket cost TWENTY QUID. It\'s called the MEGA-NOVA.']] },
      { bg: 'park', o: { dark: 1, nobench: 1 }, c: [['callum', 30, 'cheer', 'grin', 1], ['jack', 80, 'stand', 'shock', -1], ['luke', 106, 'stand', 'shock', -1]], fr: [['rocket', 58, 96, 3]], fx: [['FZZZZZZZZ...', 64, 40, 28, '#ffd400', -6]] },
      { bg: 'park', o: { dark: 1, nobench: 1 }, c: [['callum', 30, 'shrug', 'worried', 1], ['jack', 80, 'stand', 'smug', -1], ['luke', 106, 'stand', 'smug', -1]], fr: [['rocket', 58, 96, 2]], fx: [['pff.', 64, 30, 18, '#fff', 0]], s: [['luke', 'Is that it?'], ['callum', 'It looks better on PC.']] } ] },
    { id: 'tetrisbrain', t: 'Blockology Brain', d: '06/11', single: 1, p: [
      { bg: 'bedroom', o: { night: 1 }, c: [['jack', 24, 'think', 'worried', 1]], s: [['jack', 'If you turned the fridge round, it\'d fit next to the sofa... and the car could go there... and the whole street would CLEAR...', 't']], capb: 'Day four of the Blockology holiday. Jack sees shapes everywhere.' } ] },
    { id: 'furby', t: 'Me Sleep Now', d: '13/11', p: [
      { bg: 'bedroom', o: { night: 1 }, c: [['kim', 40, 'hold', 'happy', 1, { hold: 'furby' }], ['jack', 90, 'stand', 'neutral', -1]], s: [['kim', 'Can you mind my Furbo tonight? He\'s ever so sweet.']] },
      { bg: 'bedroom', o: { night: 1 }, c: [['jack', 50, 'sitfloor', 'shock', 1]], fr: [['furby', 88, 84]], cap: '3am.', s: [['off:Furbo:R', 'Kah may-may! Me HUNGRY! Me LOVE YOU!']], dim: 0.35 },
      { bg: 'kitchen', c: [['kim', 40, 'stand', 'shock', 1], ['jack', 92, 'cross', 'smug', -1]], s: [['kim', 'Jack, why is my Furbo in the FREEZER?'], ['jack', 'He knows what he did.']] } ] },
    { id: 'davecomik4', t: 'Dave\'s Comik 4: The Tornament (by Dave)', d: '19/11', kind: 'dave', p: [
      { write: ['DAVES COMIK 4', 'the goldenballs {x:tornament} {x:turnament}', 'tornament'], men: [[60, 'me', { crown: 1 }], [150, 'luke', {}], [240, 'jack', {}], [330, 'jackk', { small: 1 }]] },
      { write: ['the scores'], things: [['text', 70, 110, 'DAVE ........ 100'], ['text', 70, 140, 'LUKE ......... 2'], ['text', 70, 170, 'JACKK ........ 1'], ['text', 70, 200, 'JACK ......... {x:4} 0']], arrows: [['(i won)', 260, 110, 220, 104]] },
      { write: ['jack said i cheated', 'with odjob. ODJOB IS', 'ALOWED.'], men: [[260, 'jack', { cry: 1 }]] },
      { write: ['me (still best)'], things: [['trophy', 120, 120], ['trophy', 200, 120]], men: [[300, '', { crown: 1, up: 1 }]], tbc: 1 } ], note: 'For the record: Oddbob is not allowed. Everyone knows Oddbob is not allowed. - Jack' },
    { id: 'screenwatch', t: 'Screen Watcher', d: '20/11', p: [
      { bg: 'living', c: [['jack', 54, 'pad', 'grin', -1], ['dave', 76, 'pad', 'smug', -1], ['luke', 98, 'pad', 'happy', -1], ['otherjack', 118, 'pad', 'neutral', -1]], s: [['dave', 'I\'m sneaking round the back. Nobody look.']] },
      { bg: 'living', c: [['jack', 66, 'pad', 'smug', -1, { tilt: 0.25 }]], s: [['jack', '...he\'s behind the crates, top left.', 't']] },
      { bg: 'living', c: [['jack', 58, 'pad', 'grin', -1], ['dave', 98, 'point', 'angry', -1]], s: [['dave', 'SCREEN WATCHER!!!', 'y']] },
      { bg: 'living', o: { tvbox: 1 }, c: [['jack', 56, 'pad', 'neutral', -1], ['dave', 78, 'pad', 'smug', -1], ['gran', 112, 'stand', 'think', -1]], s: [['gran', 'Is this a video game or a quiz show?']], capb: 'New rule: cereal boxes over everyone else\'s bit of the telly.' } ] },
    { id: 'phonebill', t: 'The Phone Bill', d: '27/11', vote: 1, p: [
      { bg: 'kitchen', c: [['dad', 50, 'hold', 'shock', 1, { hold: 'letter' }]], s: [['dad', 'TWO HUNDRED AND FOURTEEN POUNDS?!', 'y']] },
      { bg: 'kitchen', c: [['dad', 30, 'cross', 'angry', 1], ['mom', 64, 'hips', 'angry', 1], ['jack', 104, 'stand', 'worried', -1]], s: [['mom', 'Who\'s been on the Internet in the DAYTIME?']] } ],
      endings: [
        { label: 'A: Blame the modem', p: { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'sad', 1, { modem: 'sad' }], ['jack', 30, 'point', 'worried', 1, { nochair: 1 }]], s: [['jack', 'It was the MODEM! It dials by itself!']], fx: [['beep?', 94, 50, 18, '#3cf', 0]] } },
        { label: 'B: Blame the cat', p: { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'game'], ['biscuit', 66, 'sit', 'smug', 1, { y: -26 }], ['jack', 26, 'point', 'grin', 1]], s: [['jack', '{cat}\'s been chatting to cats in America!']] } },
        { label: 'C: Blame Auntie Pat', p: { bg: 'kitchen', o: { offhook: 1 }, c: [['jack', 30, 'point', 'smug', 1], ['mom', 90, 'hold', 'worried', -1, { hold: 'phone' }]], s: [['jack', 'Mom. Look at the itemised bit. Who\'s THAT number?'], ['mom', '...I\'ll ring you back, Pat.']] } },
      ] },
    { id: 'lan', t: 'The LAN Party', d: '04/12', sunday: 1, p: [
      { bg: 'daves', c: [['jack', 30, 'hold', 'grin', 1, { hold: 'pcbox' }], ['callum', 62, 'hold', 'smug', 1, { hold: 'pcbox' }], ['dave', 104, 'cheer', 'grin', -1]], s: [['dave', 'The first ever LAN party! At MY house!']] },
      { bg: 'daves', c: [['jack', 50, 'sitfloor', 'angry', 1, { hold: 'cables' }]], s: [['jack', 'Which cable goes in which hole?'], ['off:Callum:R', 'All of them. Obviously.']] },
      { bg: 'daves', c: [['pc', 40, '', 'sweat', 1], ['pc', 96, '', 'sweat', 1]], cap: 'Two hours later.', over: [['Connecting...', 40, 58, 9, '#3cf'], ['Connecting...', 96, 58, 9, '#3cf']] },
      { bg: 'daves', c: [['jack', 30, 'cheer', 'grin', 1], ['callum', 96, 'cheer', 'grin', -1]], s: [['jack', 'IT WORKS!!!', 'y']] },
      { bg: 'daves', c: [['pc', 40, '', 'game'], ['pc', 96, '', 'game'], ['jack', 22, 'type', 'grin', 1, { nochair: 1 }], ['callum', 116, 'type', 'grin', -1, { nochair: 1 }]], fx: [['READY... FIGHT!', 64, 24, 26, '#e10600', -4]], s: [['off:Dave:R', 'Is it better than Goldenballs yet?']] },
      { bg: 'daves', c: [['pc', 40, '', 'off'], ['pc', 96, '', 'off'], ['jack', 22, 'shock', 'shock', 1], ['callum', 116, 'shock', 'shock', -1]], dim: 0.5, s: [['off:Dave\'s Mom:L', 'Just doing the hoovering, boys!']], fx: [['VRRRRR', 64, 80, 22, '#fff', 0]] } ] },
    { id: 'bsod', t: 'The Worst Moment', d: '11/12', p: [
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'happy'], ['jack', 36, 'type', 'grin', 1]], s: [['jack', 'Final boss. Forty hours. Last save: Tuesday. HERE WE GO.']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'crash'], ['jack', 36, 'type', 'shock', 1]], fx: [['BWONNNG', 92, 24, 26, '#6cf', 6]], over: [['FATAL ERROR', 64, 58, 9, '#fff']] },
      { bg: 'bedroom', o: { nobed: 1 }, c: [['pc', 64, '', 'happy'], ['jack', 36, 'hug', 'cry', 1, { nochair: 1 }]], s: [['jack', 'Please. I\'ll never call you beige again.'], ['pc', ':)']] } ] },
    { id: 'list', t: 'The List', d: '18/12', p: [
      { bg: 'living', c: [['jack', 30, 'hold', 'grin', 1, { hold: 'list' }], ['gran', 96, 'stand', 'happy', -1]], s: [['jack', 'My Christmas list. Only a FEW things on it.']] },
      { bg: 'living', c: [['gran', 60, 'hold', 'think', 1, { hold: 'notepad' }]], s: [['gran', '"A Hoodoo3." What on earth is a Hoodoo3, love?'], ['off:Jack:R', 'A graphics card!']] },
      { bg: 'living', o: { night: 1 }, c: [['gran', 60, 'sit', 'smug', 1, { hold: 'notepad' }]], s: [['gran', 'Lovely. I\'ll knit you one.']], fx: [['click clack click', 64, 30, 18, '#fff', 0]] } ] },
    { id: 'davecomik5', t: 'Dave\'s Chrismas Comik (by Dave)', d: '21/12', kind: 'dave', p: [
      { write: ['DAVES CHRISMAS COMIK', 'dear farther chrismas i want:', '1. every ULTRA 64 game', '2. {x:a daydream} a nother ULTRA 64 (spare)'], things: [['n64', 260, 170]] },
      { write: ['this is santa (real)'], men: [[200, 'santa', { hat: 1, big: 1 }]], things: [['present', 290, 210]], arrows: [['ULTRA 64 games', 270, 120, 300, 200]] },
      { write: ['and this is jack', 'he got {x:a} socks'], men: [[200, 'jack', { cry: 1 }]] },
      { write: ['MERY CHRISMAS', 'from dave (best)', 'P.S. luke is 2nd best'], things: [['star', 250, 210]] } ], note: 'I did not get socks. Gran knitted me a graphics card. - Jack' },
    { id: 'xmas', t: 'Christmas Day', d: '25/12', single: 1, p: [
      { bg: 'living', o: { tv: '#2a5a2a' }, c: [['jack', 50, 'cheer', 'grin', 1, { nocap: 1, top: '#c02020', pat: 'jumper', pc: '#fff', text: 'HOODOO3' }], ['gran', 96, 'stand', 'happy', -1]], fr: [['tree', 116, 96], ['present', 26, 96]], s: [['jack', 'It\'s the best jumper I\'ve ever had!'], ['gran', 'It\'s got 16 megabytes of wool, love.']] } ] },
    { id: 'caption', t: 'Write Your Own Caption!', d: '28/12', single: 1, caption: 1, p: [
      { bg: 'kitchen', c: [['dad', 60, 'cheer', 'shock', 1, { y: -10, hold: 'candle' }], ['biscuit', 104, 'sit', 'smug', -1], ['gubbinz', 20, 'stand', 'grin', 1]], fr: [['chair', 60, 96], ['tins', 96, 96]] } ] },
    { id: 'countdown', t: 'Ten, Nine, Eight...', d: '31/12', p: [
      { bg: 'daves', o: { tv: '#000' }, c: [['jack', 26, 'cheer', 'grin', 1], ['dave', 52, 'cheer', 'grin', 1], ['luke', 78, 'cheer', 'happy', 1], ['gran', 108, 'cheer', 'grin', -1]], pr: [['party', 0, 0]], s: [['dave', '10! 9! 8! 7!', 'y']] },
      { bg: 'daves', c: [['jack', 26, 'cheer', 'grin', 1], ['dad', 60, 'stand', 'worried', 1, { hold: 'candle' }], ['gran', 108, 'cheer', 'grin', -1]], pr: [['party', 0, 0]], s: [['jack', '3! 2! 1!', 'y']] },
      { bg: 'dark', c: [], lightsOff: 1, s: [['off:Everyone:L', '!!!!!!!!!', 'y']], fx: [['THE BUG!!!', 64, 60, 34, '#e10600', -6]] },
      { bg: 'daves', c: [['dad', 50, 'hold', 'worried', 1, { hold: 'plug' }], ['gran', 98, 'cheer', 'grin', -1]], pr: [['party', 0, 0]], s: [['dad', 'Sorry. Tripped over the plug.'], ['gran', 'HAPPY NEW YEAR!!!']] } ] },
  ];
  for (let i = 0; i < STRIPS.length; i++) STRIPS[i] = window.Cast ? Cast.deep(STRIPS[i]) : STRIPS[i]; // {teacher}, {cat.NAME}... in this visitor's names
  STRIPS.forEach(s => { const [d, m] = s.d.split('/').map(Number); s.md = m * 100 + d; });
  STRIPS.sort((a, b) => a.md - b.md);

  window.SiteComics = { STRIPS, CAST, CAST_ORDER, drawStrip, thumb, portrait, PW, PH, LW, LH, paint, letter, layout };
})();

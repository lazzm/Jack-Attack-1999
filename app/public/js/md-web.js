/* md-web: www.jackmud.jnet, JackMUD's home page (lazy, after js/md-term.js). The pages, the hand-drawn map of the realm,
 * the class portraits, the live Who's Online and Hall of Heroes, and the "Java" web client (an applet in a grey box,
 * like every MUD's web page had in 1998: no JackOS 98 windows in here, just plain Java widgets). */
(function () {
  'use strict';
  if (window.MDWeb || !window.MDTerm) return;
  const A = window.Apps, esc = A.esc, T = window.MDTerm, MD = window.MD;
  const H = 'http://www.jackmud.jnet';
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const fmt = n => Math.floor(+n || 0).toLocaleString('en-GB');
  // a page's own timers and listeners stop when the page goes
  function live(el) {
    const offs = [];
    const L = { on(t, fn) { offs.push(MD.on(t, m => { if (el.isConnected) fn(m); })); return L; }, every(fn, ms) { const id = setInterval(() => { if (el.isConnected && !document.hidden) fn(); }, ms); offs.push(() => clearInterval(id)); return L; }, add(f) { offs.push(f); return L; } };
    const w = setInterval(() => { if (!el.isConnected) { clearInterval(w); offs.splice(0).forEach(f => { try { f(); } catch (e) {} }); } }, 1500);
    return L;
  }

  // ================================================================ art
  // the logo: chunky pixel letters, gold with a dark outline and a red drop shadow
  const FONT = {
    J: ['..###', '....#', '....#', '....#', '#...#', '#...#', '.###.'], A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  };
  function logo(text, px) {
    px = px || 7; let x = 0; const R = [];
    for (const ch of text) { const g = FONT[ch]; if (!g) { x += 3; continue; } g.forEach((row, y) => [...row].forEach((c, i) => { if (c === '#') R.push([x + i, y]); })); x += 6; }
    const w = x - 1, hgt = 7;
    const cells = (dx, dy, fill, extra) => R.map(([a, b]) => `<rect x="${a * px + dx}" y="${b * px + dy}" width="${px + (extra || 0)}" height="${px + (extra || 0)}" fill="${fill}"/>`).join('');
    return `<svg class="mdw-logo" viewBox="-6 -6 ${w * px + 20} ${hgt * px + 20}" role="img" aria-label="JackMUD"><defs><linearGradient id="mdwGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6a8"/><stop offset=".45" stop-color="#ffd400"/><stop offset=".55" stop-color="#e8a000"/><stop offset="1" stop-color="#a86000"/></linearGradient></defs>
      ${cells(5, 5, '#5a0000')}${cells(-3, -3, '#1a0a00', 6)}<g fill="url(#mdwGold)">${R.map(([a, b]) => `<rect x="${a * px}" y="${b * px}" width="${px}" height="${px}"/>`).join('')}</g>${R.map(([a, b]) => `<rect x="${a * px + 1}" y="${b * px + 1}" width="${Math.max(1, px / 3)}" height="${Math.max(1, px / 3)}" fill="#fffbe0" opacity=".55"/>`).join('')}</svg>`;
  }
  // the header picture: a castle on a hill under the stars (and a little moon with a station going past)
  function sky(seed) {
    let s = seed || 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const stars = Array.from({ length: 70 }, () => `<rect x="${(r() * 760) | 0}" y="${(r() * 120) | 0}" width="${r() < 0.15 ? 2 : 1}" height="${r() < 0.15 ? 2 : 1}" fill="#fff" opacity="${(0.35 + r() * 0.65).toFixed(2)}"/>`).join('');
    return `<svg class="mdw-sky" viewBox="0 0 760 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="mdwNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05051a"/><stop offset=".7" stop-color="#1a1050"/><stop offset="1" stop-color="#3a1a5a"/></linearGradient></defs>
      <rect width="760" height="170" fill="url(#mdwNight)"/>${stars}
      <circle cx="670" cy="38" r="20" fill="#f4e8a0"/><circle cx="662" cy="33" r="4" fill="#d8c870"/><circle cx="676" cy="46" r="3" fill="#d8c870"/><circle cx="672" cy="30" r="2" fill="#d8c870"/>
      <g transform="translate(600 20)"><rect x="0" y="4" width="14" height="3" fill="#9fb0c8"/><rect x="5" y="0" width="4" height="11" fill="#c8d4e8"/><rect x="-6" y="5" width="6" height="1" fill="#55a0ff"/><rect x="14" y="5" width="6" height="1" fill="#55a0ff"/></g>
      <path d="M0 150 Q120 118 250 136 T520 128 T760 140 V170 H0z" fill="#1a1a3a"/>
      <path d="M0 160 Q160 140 330 152 T760 156 V170 H0z" fill="#0d0d22"/>
      <g fill="#0a0a18"><path d="M300 150v-46h10v-12h8v12h10v-8h8v8h10v-26l-6-8h22l-6 8v26h10v-8h8v8h10v-12h8v12h10v46z"/><rect x="342" y="56" width="16" height="22"/><path d="M338 56l12-18 12 18z"/><rect x="430" y="96" width="10" height="56"/><path d="M426 96l9-14 9 14z"/></g>
      <g fill="#ffd400" opacity=".85"><rect x="347" y="62" width="6" height="7"/><rect x="318" y="118" width="4" height="6"/><rect x="380" y="118" width="4" height="6"/><rect x="433" y="104" width="4" height="5"/><rect x="349" y="96" width="5" height="8"/></g>
      <circle cx="350" cy="66" r="0" fill="#fff"/><path d="M350 40v-14" stroke="#0a0a18" stroke-width="2"/><path d="M350 26l12 4-12 4z" fill="#e10600"/>
      <g fill="#0a0a18"><path d="M40 160l14-34 14 34zM60 160l18-46 18 46zM90 160l12-28 12 28z"/><path d="M640 160l16-40 16 40zM664 160l12-30 12 30zM700 160l18-46 18 46z"/></g></svg>`;
  }
  // the four classes, drawn chunky
  const CLASSART = {
    knight: '<svg viewBox="0 0 64 64"><path d="M32 6c-9 0-16 7-16 17v13h32V23c0-10-7-17-16-17z" fill="#c8d0dc" stroke="#000" stroke-width="2"/><path d="M20 24h24v5H20z" fill="#2a2a3a"/><path d="M32 6v30" stroke="#8a94a6" stroke-width="2"/><path d="M33 5c5-5 12-3 14 2-6-2-10 0-14 3z" fill="#e10600" stroke="#000"/><path d="M14 38h36l-4 22H18z" fill="#9aa4b6" stroke="#000" stroke-width="2"/><path d="M8 34l12 4v16l-12 4z" fill="#2a5ad8" stroke="#000" stroke-width="2"/><path d="M12 40v12M9 46h7" stroke="#ffd400" stroke-width="2"/><path d="M50 26l6-14 2 1-5 15" fill="#e8e8f0" stroke="#000"/><rect x="47" y="27" width="9" height="3" fill="#8a5a2a" stroke="#000"/></svg>',
    wizard: '<svg viewBox="0 0 64 64"><path d="M32 2l14 26H18z" fill="#2a2a9a" stroke="#000" stroke-width="2"/><path d="M12 30h40l-4-4H16z" fill="#2a2a9a" stroke="#000" stroke-width="2"/><g fill="#ffd400"><circle cx="30" cy="14" r="1.6"/><circle cx="36" cy="21" r="1.6"/><circle cx="27" cy="23" r="1.2"/></g><circle cx="32" cy="35" r="7" fill="#f0c090" stroke="#000" stroke-width="2"/><path d="M24 38c2 12 14 12 16 0-4 3-12 3-16 0z" fill="#f4f4f4" stroke="#000"/><path d="M18 44h28l4 18H14z" fill="#5a2a9a" stroke="#000" stroke-width="2"/><path d="M52 18v42" stroke="#8a5a2a" stroke-width="3"/><circle cx="52" cy="16" r="5" fill="#55ffff" stroke="#000" stroke-width="1.6"/><path d="M47 9l-3-3M57 9l3-3M52 8V4" stroke="#55ffff" stroke-width="1.6"/></svg>',
    ranger: '<svg viewBox="0 0 64 64"><path d="M32 6c-11 0-17 9-17 20v8h34v-8c0-11-6-20-17-20z" fill="#2f7a2a" stroke="#000" stroke-width="2"/><path d="M22 26c0-6 4-10 10-10s10 4 10 10v8H22z" fill="#f0c090" stroke="#000" stroke-width="2"/><path d="M26 25h4M34 25h4" stroke="#000" stroke-width="2"/><path d="M28 31q4 3 8 0" stroke="#000" fill="none" stroke-width="1.6"/><path d="M14 36h36l-3 24H17z" fill="#3a8a2a" stroke="#000" stroke-width="2"/><path d="M20 36l12 10 12-10" stroke="#1a4a1a" stroke-width="2" fill="none"/><path d="M52 8q14 22 0 46" fill="none" stroke="#8a5a2a" stroke-width="3"/><path d="M52 8v46" stroke="#ddd" stroke-width="1"/><path d="M40 31h20M57 28l3 3-3 3" stroke="#000" stroke-width="1.6" fill="none"/><path d="M42 29l-3 2 3 2" fill="#e10600" stroke="#000" stroke-width=".8"/></svg>',
    bard: '<svg viewBox="0 0 64 64"><path d="M18 18c0-8 6-12 14-12s14 4 14 12z" fill="#e10600" stroke="#000" stroke-width="2"/><path d="M44 12c6-4 12 0 10 6-4-4-8-2-10 0z" fill="#ffd400" stroke="#000"/><circle cx="32" cy="26" r="9" fill="#f0c090" stroke="#000" stroke-width="2"/><path d="M27 24h2M35 24h2" stroke="#000" stroke-width="2"/><path d="M27 29q5 5 10 0" stroke="#000" fill="none" stroke-width="1.8"/><path d="M14 38h36l-3 22H17z" fill="#ffd400" stroke="#000" stroke-width="2"/><path d="M14 38l9 11 9-11 9 11 9-11" fill="none" stroke="#e10600" stroke-width="3"/><ellipse cx="20" cy="50" rx="9" ry="7" fill="#c87a2a" stroke="#000" stroke-width="2"/><circle cx="20" cy="50" r="2.4" fill="#3a1a0a"/><path d="M25 46l16-14" stroke="#8a5a2a" stroke-width="3.4"/><path d="M50 30l2 8M54 22l3 6" stroke="#55ffff" stroke-width="2.4" stroke-linecap="round"/><circle cx="50" cy="39" r="2.4" fill="#55ffff"/><circle cx="57" cy="29" r="2.4" fill="#55ffff"/></svg>',
  };
  const CLASSES = [
    ['knight', 'Knight', '#2a5ad8', 'The tough one', 'Most HP, best armour. Stands at the front and takes the hits so everyone else doesn\'t have to.', [5, 1, 4, 2], [['BASH', 1, 'A shield wallop. Big damage, and monsters can end up seeing stars.'], ['GUARD', 5, 'Raise your shield: the next two hits bounce right off.']]],
    ['wizard', 'Wizard', '#7a3ac8', 'The clever one', 'Not much good at punching, but ZAP never misses and it really hurts. Keep an eye on your MP!', [2, 5, 1, 5], [['ZAP', 1, 'A crackling bolt of purple magic. Never misses.'], ['FROST', 5, 'Freezes a monster solid for two rounds. Like a fish finger.']]],
    ['ranger', 'Ranger', '#2f8a2a', 'The all-rounder', 'Good at everything, brilliant with a bow. A great first class if you can\'t decide.', [4, 2, 3, 3], [['SHOOT', 1, 'An arrow with extra oomph. Hardly ever misses.'], ['VOLLEY', 5, 'Three arrows, one after another. Thwip thwip thwip!']]],
    ['bard', 'Bard', '#d89a00', 'The team player', 'Plays songs that heal the whole party and send monsters to sleep. Every party wants a bard.', [3, 4, 2, 4], [['SING', 1, 'A catchy healing song for you and your whole party.'], ['LULLABY', 5, 'Sends a monster off to sleep for a few rounds. Zzz.']]],
  ];
  const STATN = ['Health', 'Magic', 'Armour', 'Damage'];
  const ICON = {
    rooms: '<svg viewBox="0 0 32 32"><rect x="3" y="9" width="26" height="20" fill="#8a5a2a" stroke="#000"/><path d="M1 10L16 2l15 8z" fill="#c84a2a" stroke="#000"/><rect x="13" y="18" width="6" height="11" fill="#3a1a0a"/><rect x="6" y="13" width="5" height="5" fill="#ffd400" stroke="#000"/><rect x="21" y="13" width="5" height="5" fill="#ffd400" stroke="#000"/></svg>',
    quests: '<svg viewBox="0 0 32 32"><path d="M6 3h18l3 3v23H6z" fill="#f4e8c8" stroke="#000"/><path d="M10 10h12M10 15h12M10 20h8" stroke="#8a5a2a" stroke-width="1.6"/><circle cx="23" cy="24" r="5" fill="#e10600" stroke="#000"/><path d="M21 22l4 4M25 22l-4 4" stroke="#ffd400" stroke-width="1.4"/></svg>',
    friends: '<svg viewBox="0 0 32 32"><circle cx="11" cy="11" r="5" fill="#55ffff" stroke="#000"/><path d="M2 28c1-7 5-10 9-10s8 3 9 10z" fill="#55ffff" stroke="#000"/><circle cx="22" cy="12" r="5" fill="#ffd400" stroke="#000"/><path d="M13 29c1-7 5-10 9-10s8 3 9 10z" fill="#ffd400" stroke="#000"/></svg>',
    faint: '<svg viewBox="0 0 32 32"><path d="M4 22h24v6H4z" fill="#fff" stroke="#000"/><path d="M4 22c0-5 4-7 8-7h8c4 0 8 2 8 7" fill="#e8e8ff" stroke="#000"/><circle cx="10" cy="17" r="4" fill="#f0c090" stroke="#000"/><text x="17" y="12" font-family="Arial Black,Arial" font-size="9" fill="#2a5ad8">Z</text><text x="23" y="7" font-family="Arial Black,Arial" font-size="7" fill="#2a5ad8">z</text></svg>',
    java: '<svg viewBox="0 0 32 32"><path d="M7 14h16v8c0 4-3 7-8 7s-8-3-8-7z" fill="#fff" stroke="#000" stroke-width="1.4"/><path d="M23 16c4 0 5 4 1 6" fill="none" stroke="#000" stroke-width="1.6"/><path d="M12 11c-2-2 2-3 0-6M17 11c-2-2 2-3 0-6" stroke="#808080" stroke-width="1.4" fill="none"/><ellipse cx="15" cy="15" rx="7" ry="1.4" fill="#7a4a1a"/></svg>',
    telnet: '<svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="22" fill="#000" stroke="#808080"/><path d="M6 10l4 3-4 3" stroke="#55ff55" stroke-width="1.6" fill="none"/><path d="M12 17h8" stroke="#55ff55" stroke-width="1.6"/><rect x="10" y="26" width="12" height="3" fill="#808080"/></svg>',
  };
  const ico = (k, s) => ICON[k].replace('<svg', `<svg width="${s || 32}" height="${s || 32}"`);

  // ================================================================ the Bestiary: pixel monsters (rows of letters -> SVG squares)
  const PAL = { k: '#111', w: '#fff', g: '#c8c8c8', G: '#808080', D: '#505050', o: '#ff8a00', O: '#c05a00', r: '#e10600', R: '#8a0010', y: '#ffd400', Y: '#c89a00', b: '#2a5ad8', B: '#14306a', h: '#8a5a2a', H: '#5a3a1a', p: '#ff70b0', P: '#c0306a', v: '#9a4ae0', V: '#5a1a9a', n: '#3aa02a', N: '#1a5a10', c: '#55ffff', C: '#1a8a9a', s: '#d8c8a0', m: '#f0c090', l: '#7ad04a', t: '#ffe8a0', z: '#2a2a2a', e: '#55ff55', E: '#108a10' };
  function pix(rows, s) {
    const hgt = rows.length, wd = Math.max(...rows.map(r => r.length)); let o = '';
    rows.forEach((row, y) => { let x = 0; while (x < row.length) { const ch = row[x]; if (!PAL[ch]) { x++; continue; } let n = 1; while (row[x + n] === ch) n++; o += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${PAL[ch]}"/>`; x += n; } });
    return `<svg class="mdw-pix" viewBox="0 0 ${wd} ${hgt}" width="${wd * s}" height="${hgt * s}" shape-rendering="crispEdges" aria-hidden="true">${o}</svg>`;
  }
  const BEASTS = [
    ['A honking goose', 'Floppy Fields', 2, 'The most dangerous animal in the realm. Everybody knows it. It HONKS, it hisses like a punctured tyre, and it will chase you across a whole field for no reason at all. Farmer Giles has four. He would like none.', [
      '................', '.......kkkk.....', '......kwwwwk....', '.....kwwkwwk....', '..kkkkwwwwwk....', '.kooooowwwwk....', '..kkOOkwwwk.....', '......kwwwk.....', '......kwwwk.....', '.....kwwwwwkkk..', '...kkwwwwwwwwwk.', '..kwwwwgwwwwwwwk', '..kwwwwwggwwwwk.', '...kwwwwwwwwwk..', '....kkkkkkkkk...', '.....ko..ko.....', '....koo.koo.....']],
    ['A sock gremlin', 'The Sewers', 3, 'Small, hairy and wearing six odd socks: one on each hand and foot and two on its ears. This is where your socks go. Every single one. It sniffs them. Nobody knows why.', [
      '...rr.....rr....', '..rwwr...rwwr...', '..rrrr...rrrr...', '..kkhhhhhhhkk...', '.khhhhhhhhhhhk..', '.khykhhhhhykhk..', '.khhhhhhhhhhhk..', '.khhkkkkkkkhhk..', '.khhkwkwkwkhhk..', '..khhhhhhhhhk...', 'bbkkhhhhhhhkkbb.', 'bbb.khhhhhk.bbb.', '.....khkhk......', '....rrr.rrr.....', '....rrr.rrr.....']],
    ['King Ratbag', 'The Sewers (the throne room)', 7, 'The biggest rat in Baudby, in a cape made from an old curtain and a crown made from a jelly mould. He sits on a throne of shopping trolleys and waves a toilet brush about. Ew.', [
      '....y.y.y.......', '....yyyyy.......', '...kGGGGGk......', '..kGGGGGGGk.....', '.pkGkGGGkGkp....', '.ppGGGGGGGpp....', '..kGGGkGGGk.....', '...kGGpGGk......', '..RRkGGGkRR.....', '.RRRRGGGRRRR....', '.RRRRGGGRRRRgg..', '.RRRRGGGRRRR.gg.', '.RRRRkkkRRRR..gg', '..RR.k.k.RR...gk', '.....k.k......kk']],
    ["Squidgy", 'The Isle of Spam (the grotto)', 9, "The Kraken's little cousin: an octopus the size of a bouncy castle, bright pink, with a cheeky grin. Pinches Old Barnacle Bill's dinner every night. Squirts ink when he's losing. And when he's winning.", [
      '.....kkkkkk.....', '...kkppppppkk...', '..kppppppppppk..', '.kpppwwppwwpppk.', '.kppwkwppwkwppk.', '.kpppwwppwwpppk.', '.kpppppppppppk..', '.kppPkkkkkkPpk..', '..kpPPPPPPPpk...', '.kpk.kppppk.kpk.', 'kpk.kpk.kpk.kpk.', 'kp.kpk..kpk..kpk', 'kpkpk....kpk.kp.', '.kpk.....kpkpk..', '..........kk....']],
    ['The Great Buffer Beast', 'The Caves of Lag', 11, 'A giant spinning hourglass with a loading bar for a mouth. Everything near it goes... very... slow. It is why spells take ages to load and why your downloads are always on 3%.', [
      '..kkkkkkkkkkkk..', '..kYYYYYYYYYYk..', '...ktttttttttk..', '...kwkttttwkk...', '....kkttttkk....', '.....kttttk.....', '......kttk......', '......kytk......', '.....kkykkk.....', '....kebbbbbk....', '...kebbbbbbbk...', '...keeeeeeeek...', '..kYYYYYYYYYYk..', '..kkkkkkkkkkkk..']],
    ['Floppitha the dragon', 'Mount Megabyte', 0, "Not a monster at all! A very kind dragon who collects floppy disks and reads computer magazines through her spectacles. She hasn't eaten anyone since 1742. She has lost her save game.", [
      '....kk.....kk...', '...kvvk...kvvk..', '...kvvvkkkvvvk..', '..kvvvvvvvvvvvk.', '..kvkkkvvkkkvvk.', '.kvkcwkkkcwkvvk.', '.kvvkkkvvkkkvvk.', '.kvvvvvvvvvvvvk.', 'kvvvvvvvvvvvvVk.', 'kvVVVkvvvvvvVVk.', 'kvVrrkvvvvvVVk..', '.kVVVVvvvVVVk...', '..kkVVVVVVVk....', '....kkkkkkk.....']],
    ['The Asteroid Muncher', 'The Moon', 16, 'A long, lumpy space worm with a mouth like a cement mixer. It has eaten three craters, a satellite and most of a mountain of moon cheese. It burps moon dust.', [
      '...........kkk..', '.........kkGGGk.', '........kGGGGGGk', '.......kGkGGGGGk', '..kkk..kGGGGGkkk', '.kGGGkkGGGGGkwwk', 'kGDGGGGGDGGGkwk.', 'kGGGDGGGGGDGkkk.', 'kGDGGGDGGGGGGGk.', '.kGGGGGGGDGGGk..', '..kkkGGGGGGkk...', '.....kkkkkk.....']],
    ['THE MILLENNIUM BUG', 'The Old Server Room', 18, 'A gigantic metal beetle covered in flashing clock digits, all stuck on 00:00. It wants every clock in the world to think it is 1900 when the year 2000 arrives. Nobody knows what will happen if it wins. Let\'s not find out.', [
      '..k..........k..', '...k........k...', '....kkkkkkkk....', '...kGGGGGGGGk...', '..kGgggggggggGk.', '.kGgkkkkkkkkgGk.', 'kGgkeekeeke.kgGk', 'kGgkekkekkekgGk.', 'kGgkeekeekekgGk.', '.kGgkkkkkkkkgGk.', 'k.kGgggggggggk.k', '.k.kGGGGGGGGk.k.', 'k...kkkkkkkk...k', '...k........k...']],
  ];
  function bestiary(el) {
    frame(el, '/bestiary.html', `<h1>The Bestiary</h1><p class="mdw-lead">A field guide to the creatures of JackMUD, drawn by JackK in the back of his maths book. Type <code>CONSIDER</code> before you fight anything!</p>
      <div class="mdw-beasts">${BEASTS.map(([n, where, lv, d, rows]) => `<article class="mdw-beast"><div class="mdw-bpic">${pix(rows, 6)}</div><div><h2>${esc(n)}</h2><div class="mdw-bmeta"><span>${esc(where)}</span>${lv ? `<b>level ${lv}</b>` : '<b class="mdw-friend">friendly!</b>'}</div><p>${esc(d)}</p></div></article>`).join('')}</div>
      <p class="mdw-small">Also spotted: stroppy squirrels, runaway lawnmowers, jelly wobblers, buffering bats, lag goblins, crystal crabs, frost wolves, empty suits of armour, angry space tomatoes, zorbs, bit bugs and one very confused runaway spreadsheet.</p>`);
  }

  // ================================================================ the page frame
  const NAV = [['/', 'Home'], ['/play.html', 'Play Now'], ['/newbie.html', 'Newbie Guide'], ['/classes.html', 'Classes'], ['/map.html', 'World Map'], ['/who.html', "Who's On"], ['/heroes.html', 'Hall of Heroes'], ['/bestiary.html', 'Bestiary'], ['/news.html', 'News'], ['/download.html', 'MUDdy 98'], ['/rules.html', 'Rules']];
  function frame(el, path, main, o) {
    o = o || {};
    el.className = 'mdw';
    el.innerHTML = `<div class="mdw-page">
      <header class="mdw-head">${sky(path.length * 31 + 7)}<div class="mdw-head-in">${logo('JACKMUD', 7)}<div class="mdw-tag">Swords, Sorcery and Slow Modems</div></div></header>
      <nav class="mdw-nav">${NAV.map(([p, l]) => `<a href="${H}${p}"${p === path ? ' class="on"' : ''}>${l}</a>`).join('')}</nav>
      <div class="mdw-cols"><main class="mdw-main">${main}</main>${o.wide ? '' : side()}</div>
      <footer class="mdw-foot"><p><a href="${H}/">JackMUD</a> &middot; telnet <b>mud.jacknet.jnet</b> port <b>4000</b> &middot; <a href="${H}/rules.html">Rules</a></p>
        <p>You are visitor number <span class="mdw-ctr"><i>0</i><i>0</i><i>0</i><i>0</i><i>0</i></span> since 10/10/98.</p>
        <p class="mdw-best"><span class="mdw-badge">Best viewed in <b>JackNet Explorer 4</b> at 800x600</span> <span class="mdw-badge mdw-badge2">Java <b>ENHANCED</b></span> <span class="mdw-badge mdw-badge3">Y2K <b>READY</b></span></p>
        <p class="mdw-copy">&copy; 1998-1999 Jack (Implementor). All monsters are fictional. No geese were harmed (they won).</p></footer></div>`;
    sideFill(el);
    counter(el, path === '/');
    return el;
  }
  function side() {
    return `<aside class="mdw-side">
      <div class="mdw-box mdw-connect"><h3>Play JackMUD</h3><a class="mdw-big" href="${H}/play.html">${ico('java', 22)}<span>Play in your browser</span></a><a class="mdw-big mdw-big2" href="telnet://mud.jacknet.jnet:4000">${ico('telnet', 22)}<span>Telnet: mud.jacknet.jnet <b>4000</b></span></a><p class="mdw-small">or in JACK-DOS: <code>telnet mud.jacknet.jnet 4000</code></p></div>
      <div class="mdw-box"><h3>Who's on now <span class="mdw-livedot" title="Live"></span></h3><div class="mdw-whoside">Asking the server...</div><p class="mdw-small"><a href="${H}/who.html">Full list &raquo;</a></p></div>
      <div class="mdw-box mdw-vote"><h3>Vote for us!</h3><p>JackMUD is on the <b>Top 100 MUDs</b> list! Vote every day and we go up. (We are number 74. Come ON.)</p><div class="mdw-vbtn">TOP <b>100</b> MUDS<br><small>CLICK TO VOTE</small></div></div>
    </aside>`;
  }
  function sideFill(el) {
    const box = el.querySelector('.mdw-whoside'); if (!box) return;
    const draw = m => { const L = m.list || []; box.innerHTML = L.length ? `<ul class="mdw-wholist">${L.slice(0, 8).map(x => `<li><b>${esc(x.n)}</b> <span>lv ${x.lv} ${esc(x.c)}</span></li>`).join('')}</ul>${L.length > 8 ? `<p class="mdw-small">...and ${L.length - 8} more</p>` : ''}` : '<p class="mdw-small">Nobody right now. Be the first!</p>'; };
    live(el).on('mdWho', draw).every(() => Net.send({ t: 'mdWho' }), 10000);
    setTimeout(() => Net.send({ t: 'mdWho' }), 200);
    const v = el.querySelector('.mdw-vbtn'); if (v) v.addEventListener('click', () => { v.innerHTML = 'THANK YOU!<br><small>WE ARE NOW 73RD</small>'; sfx('solve'); });
  }
  function counter(el, inc) {
    const c = el.querySelector('.mdw-ctr'); if (!c || !window.Net || !Net.kv) return;
    if (inc) { try { if (!sessionStorage.getItem('jhp_md_hit')) { sessionStorage.setItem('jhp_md_hit', '1'); Net.kv.inc('md.hits'); } } catch (e) {} }
    Net.kv.get('md.hits').then(v => { const n = (+v['md.hits'] || 0) + 4211; c.innerHTML = String(n).padStart(6, '0').split('').map(d => `<i>${d}</i>`).join(''); });
  }

  // ================================================================ home
  function home(el) {
    frame(el, '/', `
      <section class="mdw-hero"><div class="mdw-hero-txt"><h1>Welcome, adventurer!</h1>
        <p><b>JackMUD</b> is a game made of words that loads of people play at the same time, live, over the JackNet. You walk around a whole world by typing (<b>NORTH</b>, <b>LOOK</b>, <b>TALK TO THE TROLL</b>), and the other people you meet are real players, maybe even your mates from school.</p>
        <p>There's a town to explore, a newbie school, quests, monsters, magic, a dragon, pirates, a rocket to the Moon, and the Millennium Bug itself lurking under the Clock Tower. It's free. It's friendly. Nobody dies (you just faint).</p>
        <div class="mdw-ctas"><a class="mdw-cta" href="${H}/play.html">${ico('java', 26)}<span><b>PLAY NOW</b><small>in your web browser</small></span></a><a class="mdw-cta mdw-cta2" href="${H}/newbie.html"><span><b>NEW? START HERE</b><small>the newbie guide</small></span></a></div></div></section>
      <section class="mdw-feats">
        <div>${ico('rooms', 40)}<b>137 rooms</b><span>From Baudby's Market Square to the Cheese Mines of the Moon.</span></div>
        <div>${ico('quests', 40)}<b>20 quests</b><span>Lost kittens, pirate treasure, a dragon's save game. Tiny Rupee rewards for JackNet members!</span></div>
        <div>${ico('friends', 40)}<b>Play together</b><span>Form a party, share the XP, chat, shout, wave, dance. Bards heal everyone.</span></div>
        <div>${ico('faint', 40)}<b>Nobody dies</b><span>Run out of HP and you just faint. A friendly owl flies you to the temple. Aww.</span></div>
      </section>
      <section class="mdw-panel"><h2>Three ways to play</h2>
        <ol class="mdw-ways"><li><b>Right here in your browser.</b> Our Java client works in JackNet Explorer 4. <a href="${H}/play.html">Play now &raquo;</a></li>
        <li><b>Telnet</b>, like a proper MUDder: Start &gt; Programs &gt; Accessories &gt; Communications &gt; Telnet, then Connect &gt; Remote System, Host Name <code>mud.jacknet.jnet</code>, Port <code>4000</code>. Or just <a href="telnet://mud.jacknet.jnet:4000">click here</a>.</li>
        <li><b>MUDdy 98</b>, the MUD client that draws a map for you. <a href="${H}/download.html">Download it free &raquo;</a></li></ol></section>
      <section class="mdw-panel mdw-latest"><h2>Latest news</h2>${NEWS.slice(0, 3).map(newsItem).join('')}<p><a href="${H}/news.html">All the news &raquo;</a></p></section>
      <section class="mdw-panel mdw-jack"><h2>A word from the Implementor</h2><p>Hi! I'm Jack and I made JackMUD. I started it in the summer holidays after playing loads of other MUDs (at 2p a minute, my Mom has views on this). Dave did the sewers, Callum did the server room (sorry), Luke did the arcade and JackK did the whole Isle of Spam. If you find a bug, tell me. If you find my secret room, DON'T tell Dave.</p><p class="mdw-sig">- Jack</p></section>`);
  }
  const NEWS = [
    ['12/12/98', 'The Old Server Room is open!', "Old Tom Tick at the Clock Tower will give the key to heroes who have sorted out the socks AND the Caves of Lag. Down there: bit bugs, runaway spreadsheets, and THE MILLENNIUM BUG. Callum designed it so it's very hard. Take a party. Take a bard."],
    ['28/11/98', 'SPACE!', 'Orbital Station 99 and the Moon are open! Pass Dr Countdown\'s astronaut exam at the Rocket Range (east of Floppy Fields) and blast off. The Moon is made of cheese. Something is eating it.'],
    ['14/11/98', 'The Isle of Spam is finished', "JackK's island is done: a pirate camp, a lighthouse, buried treasure, crabs (sideways) and Squidgy, the Kraken's little cousin. The Soggy Biscuit sails from the docks whenever you like. Free."],
    ['01/11/98', 'Bug fixes', 'Geese can no longer follow you into the bank (sorry, Mr Penny). The Guess-O-Tron now actually picks a random number (sorry, Luke). Dennis the training dummy no longer levels up.'],
    ['24/10/98', 'Bards!', 'The fourth class is here. Bards SING to heal their whole party and LULLABY monsters to sleep. Melody Strum at the Bards\' Bandstand on Guild Row has instruments for sale.'],
    ['10/10/98', 'JACKMUD IS OPEN!', 'After a whole summer of typing, JackMUD is open to everyone! Telnet to mud.jacknet.jnet port 4000. Tell your mates. Tell your mates\' mates. Please don\'t tell my maths teacher.'],
  ];
  const newsItem = ([d, t, x]) => `<article class="mdw-news"><div class="mdw-date">${d}</div><div><b>${esc(t)}</b><p>${esc(x)}</p></div></article>`;
  function news(el) { frame(el, '/news.html', `<h1>News &amp; Updates</h1>${NEWS.map(newsItem).join('')}<p class="mdw-small">Got an idea for an area? Send it to Jack. Please don't ring the house.</p>`); }

  // ================================================================ the Java client
  function applet(o) {
    o = o || {};
    const el = document.createElement('div'); el.className = 'mdw-applet' + (o.small ? ' mdw-applet-sm' : '');
    el.innerHTML = `<div class="mdw-aload"><div class="mdw-acup">${ico('java', 44)}</div><div class="mdw-atxt">Loading Java applet...</div><div class="mdw-abar"><i></i></div><div class="mdw-asmall">JackMUDClient.class (38 KB)</div></div>`;
    let started = false;
    const start = () => {
      if (started || !el.isConnected) return; started = true;
      el.innerHTML = `<div class="mdw-ahead"><span class="mdw-atitle">JackMUD Java Client 1.02</span><span class="mdw-alamp"><i></i><b>Not connected</b></span><button type="button" class="mdw-ab mdw-aconn">Connect</button><button type="button" class="mdw-ab mdw-adisc" disabled>Disconnect</button></div><div class="mdw-abody"><div class="mdw-aterm"></div><div class="mdw-apanel"></div></div><div class="mdw-astatus">Applet JackMUDClient started</div>`;
      const term = T.term({ skin: 'awt', onLine: t => { if (S) S.send(t); else term.info('(Click Connect first!)'); }, onCols: c => { if (S) S.cols(c); } });
      const pan = T.panel({ skin: 'awt', send: c => { if (S) term.send(c); } });
      el.querySelector('.mdw-aterm').appendChild(term.el); el.querySelector('.mdw-apanel').appendChild(pan.el);
      let S = null;
      const status = t => { el.querySelector('.mdw-astatus').textContent = t; };
      const setOn = on => { el.querySelector('.mdw-aconn').disabled = on; el.querySelector('.mdw-adisc').disabled = !on; el.querySelector('.mdw-alamp').classList.toggle('on', on); el.querySelector('.mdw-alamp b').textContent = on ? 'Connected' : 'Not connected'; term.setLive(on); if (!on) pan.off(); };
      const sink = { write: s => term.write(s), prompt: p => term.prompt(p), info: s => term.info(s), cols: () => term.cols(), stat: st => pan.stat(st), end: why => { S = null; setOn(false); term.info('\n*** ' + why); status('Disconnected: ' + why); } };
      const connect = () => { if (S) return; setOn(true); status('Connecting to mud.jacknet.jnet:4000...'); term.info('Opening socket to mud.jacknet.jnet:4000...'); setTimeout(() => { if (!el.isConnected) return; S = T.session(sink, 'web'); status('Connected to mud.jacknet.jnet:4000'); if (!T.phone()) term.focus(); }, 600); };
      el.querySelector('.mdw-aconn').addEventListener('click', connect);
      el.querySelector('.mdw-adisc').addEventListener('click', () => { if (S) S.close(false, 'Disconnected.'); });
      setOn(false);
      term.info('JackMUD Java Client 1.02 ready.');
      term.info('Click CONNECT to start. Type commands in the box at the bottom, or click the buttons.\n');
      // leaving the page hangs up (the applet is "destroyed")
      live(el).add(() => { if (S) S.close(false, 'Applet stopped.'); term.destroy(); });
      if (o.auto) connect();
    };
    // Java takes its time, as it always did (quicker the second time: it's in the cache)
    let cached = false; try { cached = !!sessionStorage.getItem('jhp_md_java'); sessionStorage.setItem('jhp_md_java', '1'); } catch (e) {}
    const bar = el.querySelector('.mdw-abar i'), txt = el.querySelector('.mdw-atxt'); let p = 0;
    const steps = cached ? 6 : 22;
    const iv = setInterval(() => {
      if (!el.isConnected) return clearInterval(iv);
      p++; bar.style.width = Math.min(100, Math.round(p / steps * 100)) + '%';
      if (p === Math.round(steps * 0.4)) txt.textContent = 'Starting Java virtual machine...';
      if (p === Math.round(steps * 0.75)) txt.textContent = 'Applet JackMUDClient loaded.';
      if (p >= steps) { clearInterval(iv); start(); }
    }, 110);
    return el;
  }
  function play(el) {
    frame(el, '/play.html', `<h1>Play JackMUD</h1>
      <p class="mdw-lead">Click <b>Connect</b>. If you're a JackNet member, your character is saved on the server (log on first: Start &gt; Log Off, then pick a name). Guests can play too, but guests are forgotten when they leave.</p>
      <div class="mdw-applet-slot"></div>
      <div class="mdw-tips"><div><b>New?</b> You start at the Adventurers' Academy. Follow the lessons: they teach you everything in about five minutes.</div><div><b>Stuck?</b> Type <code>HELP</code>. Type <code>QUESTS</code> to see what to do next. Click any <b>WHITE CAPITAL WORDS</b> to type them.</div><div><b>Mom needs the phone?</b> Type <code>QUIT</code>. Members are saved automatically.</div></div>
      <p class="mdw-small">Problems with Java? Use Telnet instead: Start &gt; Programs &gt; Accessories &gt; Communications &gt; Telnet, host <code>mud.jacknet.jnet</code>, port <code>4000</code>. Or <a href="${H}/download.html">download MUDdy 98</a>.</p>`, { wide: true });
    el.querySelector('.mdw-applet-slot').appendChild(applet());
  }

  // ================================================================ newbie guide
  function newbie(el) {
    const cmd = (c, d) => `<tr><td><code>${c}</code></td><td>${d}</td></tr>`;
    frame(el, '/newbie.html', `<h1>The Newbie Guide</h1>
      <p class="mdw-lead">Never played a MUD? Brilliant, you're going to love it. Read this, it takes two minutes.</p>
      <h2>What's a MUD?</h2><p>A <b>Multi-User Dungeon</b>: a game made of words. The computer tells you where you are, and you type what you want to do. Everybody else playing is in the same world at the same time, so when someone walks into your room, that's a real person!</p>
      <div class="mdw-shot"><pre><span class="f14">Market Square</span>  <span class="f8">[Baudby]</span>
  You are standing in the bustling heart of Baudby. Stalls with stripy awnings sell everything from turnips to floppy disks...
<span class="f10">Exits: <span class="f15">north</span>, <span class="f15">east</span>, <span class="f15">south</span>, <span class="f15">west</span></span>
<span class="f11">The Town Crier, in a red coat and tricorn hat, rings a handbell.</span>
<span class="f9">A scruffy pigeon is pecking at a dropped chip.</span>
<span class="f6">Dave the Knight is standing here.</span>
<span class="f8">[</span><span class="f10">45</span><span class="f8">/</span><span class="f7">45hp </span><span class="f14">8</span><span class="f8">/</span><span class="f7">8mp </span><span class="f13">32%xp</span><span class="f8">]</span> <span class="f15">&gt;</span> <span class="f15">talk crier</span><span class="mdw-cur"></span></pre><div class="mdw-shotkey"><p><span class="f11">Yellow</span> = people. TALK to them.</p><p><span class="f9">Red</span> = monsters. You can fight them.</p><p><span class="f6">Cyan</span> = other players. Say hi!</p><p><span class="f10">Green</span> = the ways out.</p><p>The bit in brackets is your health (HP), magic (MP) and how close you are to the next level.</p></div></div>
      <h2>Your first ten minutes</h2><ol class="mdw-steps"><li>Connect and pick a <a href="${H}/classes.html">class</a>. (Can't decide? Ranger.)</li><li>You wake up at the <b>Adventurers' Academy</b>. Type <code>LOOK</code>.</li><li>Do your lessons: <code>QUESTS</code> tells you the next one. Talk to the teachers, grab your scarf, bonk Dennis the training dummy.</li><li>Graduate, walk out of the gates, and you're in <b>Baudby</b>. Talk to <b>everybody</b>. They need your help.</li><li>Buy some <b>Fizz Pop</b> (it heals you) and go and sort out Farmer Giles' geese.</li></ol>
      <h2>The commands you'll use most</h2><table class="mdw-table">${cmd('N S E W U D', 'Walk north, south, east, west, up, down')}${cmd('LOOK (or L)', 'Look around. LOOK FOUNTAIN looks at the fountain.')}${cmd('MAP', 'A map of where you\'ve been')}${cmd('TALK person', 'Say hello to someone (and get quests)')}${cmd('ASK person ABOUT thing', 'Find out more')}${cmd('QUESTS', 'Your quest journal: what to do next')}${cmd('KILL monster', 'Start a fight (CONSIDER it first!)')}${cmd('FLEE', 'Run away!')}${cmd('INV / EQ', 'What you\'re carrying / wearing')}${cmd('GET / DROP / WEAR / WIELD', 'Look after your stuff')}${cmd('DRINK FIZZ', 'Heal up')}${cmd('REST', 'Get better three times faster')}${cmd('LIST / BUY / SELL', 'In shops')}${cmd('SAY / SHOUT / TELL name', 'Chat to the room / everyone / one person')}${cmd('WHO', 'Who\'s playing')}${cmd('RECALL', 'Zap back to Market Square')}${cmd('HELP', 'Everything else')}${cmd('QUIT', 'Leave (you\'re saved)')}</table>
      <h2>Top tips from Jack</h2><ul class="mdw-list"><li>Put your gold in the <b>bank</b>. If you faint you drop some of what's in your pockets.</li><li>Every room has secrets. If the description mentions something, <code>LOOK</code> at it. Some places need a <code>SEARCH</code>.</li><li>Play with your mates: <code>PARTY INVITE dave</code>. You share XP and the bard heals everyone.</li><li>Members get a few <b>Rupees</b> for quests and big bosses (it's capped, so no farming, Callum).</li><li>Press the <b>Up arrow</b> to repeat a command. Type <code>!</code> to do the last thing again.</li></ul>`);
  }

  // ================================================================ classes
  function classes(el) {
    frame(el, '/classes.html', `<h1>The Four Classes</h1><p class="mdw-lead">You pick one when you start. Every class can finish every quest, so just pick the one that sounds most fun.</p>
      <div class="mdw-classes">${CLASSES.map(([id, n, col, tag, d, st, sk]) => `<article class="mdw-class" style="--cc:${col}"><div class="mdw-cart">${CLASSART[id]}</div><div class="mdw-cbody"><h2>${n}</h2><div class="mdw-ctag">${tag}</div><p>${d}</p>
        <div class="mdw-stats">${STATN.map((s, i) => `<div><span>${s}</span><b>${'<i class="on"></i>'.repeat(st[i])}${'<i></i>'.repeat(5 - st[i])}</b></div>`).join('')}</div>
        <ul class="mdw-skills">${sk.map(([s, lv, x]) => `<li><code>${s}</code> <small>level ${lv}</small> ${x}</li>`).join('')}</ul></div></article>`).join('')}</div>`);
  }

  // ================================================================ the map of the realm
  function realmMap() {
    const area = (x, y, name, lv, href) => `<a href="${H}/play.html" class="mdw-mlink"><g class="mdw-area"><text x="${x}" y="${y}" class="mdw-mt" text-anchor="middle">${name}</text><text x="${x}" y="${y + 14}" class="mdw-ml" text-anchor="middle">${lv}</text></g></a>`;
    const tree = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})"><path d="M0 -14l-8 12h4l-6 9h20l-6-9h4z" fill="#2f6a2a" stroke="#1a3a10" stroke-width="1"/><rect x="-1.5" y="7" width="3" height="4" fill="#6a3a1a"/></g>`;
    const mtn = (x, y, s, snow) => `<g transform="translate(${x} ${y}) scale(${s || 1})"><path d="M-18 10L0 -18 18 10z" fill="#8a7a6a" stroke="#3a2a1a" stroke-width="1.4"/><path d="M0 -18l-6 9 3 2 3-3 3 3 3-2z" fill="${snow ? '#fff' : '#a89888'}"/></g>`;
    let trees = ''; [[92, 205], [110, 222], [76, 228], [130, 205], [98, 248], [140, 236], [62, 258], [118, 266], [150, 262], [84, 282], [44, 232]].forEach(([x, y], i) => { trees += tree(x, y, 0.9 + (i % 3) * 0.12); });
    return `<svg class="mdw-map" viewBox="0 0 640 480" role="img" aria-label="Hand-drawn map of the lands of JackMUD">
      <defs><filter id="mdwRough"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>
        <radialGradient id="mdwParch" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#f7ecc8"/><stop offset=".75" stop-color="#ead7a2"/><stop offset="1" stop-color="#c9a865"/></radialGradient>
        <pattern id="mdwWave" width="26" height="12" patternUnits="userSpaceOnUse"><path d="M2 8q4-5 8 0t8 0" fill="none" stroke="#5a8aa8" stroke-width="1.1" opacity=".6"/></pattern></defs>
      <rect x="8" y="8" width="624" height="464" rx="6" fill="url(#mdwParch)" stroke="#7a5a2a" stroke-width="3" filter="url(#mdwRough)"/>
      <path d="M8 360 Q160 336 300 372 T632 350 V472 H8z" fill="#9cc4d8" opacity=".75"/><path d="M8 360 Q160 336 300 372 T632 350 V472 H8z" fill="url(#mdwWave)"/>
      <path d="M8 360 Q160 336 300 372 T632 350" fill="none" stroke="#5a7a8a" stroke-width="1.6"/>
      <g class="mdw-paths" fill="none" stroke="#8a5a2a" stroke-width="2" stroke-dasharray="4 5"><path d="M320 132 V178"/><path d="M290 214 H170"/><path d="M352 214 H440"/><path d="M470 200 Q480 160 470 128"/><path d="M490 110 Q520 96 540 108"/><path d="M320 252 V346"/><path d="M320 380 Q330 404 360 410"/><path d="M528 236 Q560 210 586 160"/></g>
      ${trees}
      <g transform="translate(305 70)"><rect x="-26" y="10" width="52" height="34" fill="#c84a2a" stroke="#3a1a0a" stroke-width="1.4"/><path d="M-30 12L0 -8 30 12z" fill="#7a3a2a" stroke="#3a1a0a" stroke-width="1.4"/><rect x="-6" y="28" width="12" height="16" fill="#3a1a0a"/><rect x="-20" y="18" width="8" height="7" fill="#ffd400" stroke="#3a1a0a"/><rect x="12" y="18" width="8" height="7" fill="#ffd400" stroke="#3a1a0a"/><path d="M0 -8v-8" stroke="#3a1a0a" stroke-width="1.4"/><path d="M0 -16l9 3-9 3z" fill="#7a3ac8"/></g>
      <g transform="translate(320 214)"><rect x="-38" y="-18" width="76" height="40" fill="#b8a888" stroke="#3a2a1a" stroke-width="1.6"/><path d="M-38 -18v-8h8v4h8v-4h8v4h8v-4h8v4h8v-4h8v4h8v-4h8v8" fill="#b8a888" stroke="#3a2a1a" stroke-width="1.6"/><rect x="-6" y="-46" width="12" height="30" fill="#c8b898" stroke="#3a2a1a" stroke-width="1.6"/><path d="M-9 -46l9-12 9 12z" fill="#7a3a2a" stroke="#3a2a1a" stroke-width="1.4"/><circle cx="0" cy="-34" r="4" fill="#fff8e0" stroke="#3a2a1a"/><path d="M0 -34v-3M0 -34h2" stroke="#000" stroke-width=".8"/><rect x="-6" y="6" width="12" height="16" fill="#5a3a1a"/><circle cx="-20" cy="0" r="5" fill="#9cc4d8" stroke="#3a2a1a"/></g>
      <g transform="translate(470 222)"><rect x="-10" y="-6" width="20" height="22" fill="#fff8e0" stroke="#3a2a1a" stroke-width="1.2"/><path d="M0 -6l-14-14M0 -6l14 -14M0 -6l-14 10M0 -6l14 10" stroke="#5a3a1a" stroke-width="2"/><path d="M-26 22h52" stroke="#3a7a2a" stroke-width="5" stroke-linecap="round" opacity=".7"/></g>
      <g transform="translate(586 160)"><path d="M0 -26q7 8 7 24h-14q0-16 7-24z" fill="#fff" stroke="#3a2a1a" stroke-width="1.4"/><path d="M-7 -2l-6 8h6zM7 -2l6 8h-6z" fill="#e10600" stroke="#3a2a1a"/><rect x="-14" y="6" width="28" height="4" fill="#808080" stroke="#3a2a1a"/></g>
      <g>${mtn(452, 108, 1.1)}${mtn(482, 100, 0.9)}${mtn(430, 120, 0.8)}<path d="M470 116a8 8 0 0 1 16 0z" fill="#1a1a1a"/></g>
      <g>${mtn(560, 82, 1.9, 1)}${mtn(530, 98, 1.2, 1)}${mtn(596, 96, 1.1, 1)}<g transform="translate(566 56)"><rect x="-8" y="-6" width="16" height="12" fill="#a898c8" stroke="#2a1a3a"/><path d="M-8 -6v-4h4v2h4v-2h4v2h4v-4" fill="#a898c8" stroke="#2a1a3a"/><path d="M8 0q10 -10 18 -2" stroke="#7a3ac8" stroke-width="3" fill="none"/></g></g>
      <g transform="translate(360 418)"><ellipse rx="56" ry="20" fill="#e8d498" stroke="#8a6a2a" stroke-width="1.6"/><path d="M-20 -8q-2-18 6-26M-14 -34q-10-2-16 4M-14 -34q8-6 16-2M-14 -34q-2 6-2 10" stroke="#2f6a2a" stroke-width="3" fill="none"/><path d="M-20 -8q-2-18 6-26" stroke="#6a3a1a" stroke-width="2.4" fill="none"/><rect x="26" y="-30" width="7" height="22" fill="#fff" stroke="#8a2a1a"/><rect x="26" y="-24" width="7" height="4" fill="#e10600"/><rect x="26" y="-16" width="7" height="4" fill="#e10600"/><path d="M8 4l5 5M13 4l-5 5" stroke="#c00000" stroke-width="2.2"/></g>
      <g transform="translate(250 404)"><path d="M-16 0h32l-6 8h-20z" fill="#7a4a1a" stroke="#3a1a0a"/><path d="M0 0v-22" stroke="#3a1a0a" stroke-width="1.6"/><path d="M1 -22q12 9 0 18z" fill="#fff" stroke="#3a1a0a"/></g>
      <g transform="translate(150 410)"><circle r="10" fill="#e070a0" stroke="#5a1a3a" stroke-width="1.4"/><path d="M-8 6q-6 10-12 6M-3 9q-2 10-8 10M3 9q2 10 8 10M8 6q6 10 12 6" stroke="#e070a0" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="-3" cy="-2" r="2" fill="#fff"/><circle cx="3" cy="-2" r="2" fill="#fff"/></g>
      <g transform="translate(98 72)"><circle r="26" fill="#f4e8a0" stroke="#8a7a3a" stroke-width="1.4"/><circle cx="-8" cy="-6" r="5" fill="#d8c870"/><circle cx="9" cy="8" r="4" fill="#d8c870"/><circle cx="6" cy="-10" r="2.4" fill="#d8c870"/></g>
      <g transform="translate(200 150)"><rect x="-12" y="-3" width="24" height="6" fill="#c8d4e8" stroke="#3a4a5a"/><rect x="-3" y="-10" width="6" height="20" fill="#dfe8f6" stroke="#3a4a5a"/><path d="M-26 0h14M12 0h14" stroke="#2a5ad8" stroke-width="4"/></g>
      <path d="M186 146 Q140 130 118 92" fill="none" stroke="#5a5a8a" stroke-width="1.4" stroke-dasharray="2 4"/>
      <g transform="translate(320 300)"><rect x="-30" y="-12" width="60" height="24" rx="12" fill="#6a6a5a" stroke="#2a2a1a" stroke-width="1.4"/><ellipse rx="22" ry="7" fill="#2a2a1a"/><path d="M-12 -2c4-4 8 4 12 0s8 4 12 0" stroke="#9a9a7a" stroke-width="1.6" fill="none"/></g>
      ${area(305, 128, 'The Academy', 'start here!')}${area(320, 258, 'BAUDBY', 'the town')}${area(98, 300, 'Whispering Woods', 'lv 2-6')}${area(470, 254, 'Floppy Fields', 'lv 1-5')}${area(586, 186, 'Rocket Range', 'to space!')}${area(458, 140, 'Caves of Lag', 'lv 7-11')}${area(562, 118, 'Mt Megabyte', 'lv 9-14')}${area(320, 326, 'The Sewers', 'lv 3-7 (underground)')}${area(360, 456, 'Isle of Spam', 'lv 5-9')}${area(98, 116, 'The Moon', 'lv 12-16')}${area(200, 174, 'Station 99', 'lv 10-15')}${area(150, 446, 'Squidgy!', 'lv 9')}
      <g transform="translate(560 420)" class="mdw-rose"><circle r="28" fill="none" stroke="#7a5a2a" stroke-width="1.2"/><path d="M0 -30L5 -5 0 0-5 -5z" fill="#c00000"/><path d="M0 30L5 5 0 0-5 5zM30 0L5 5 0 0 5 -5zM-30 0L-5 5 0 0-5 -5z" fill="#5a3a1a"/><text y="-34" text-anchor="middle" class="mdw-ml">N</text></g>
      <text x="320" y="34" text-anchor="middle" class="mdw-mtitle">The Lands of JackMUD</text>
      <text x="40" y="350" class="mdw-ml" transform="rotate(-6 40 350)">here be geese</text>
      <g transform="translate(250 214)"><text class="mdw-ml" x="-28" y="-6">W Gate</text></g>
      <g transform="translate(344 178)"><ellipse rx="6" ry="4.4" fill="#c00000" stroke="#3a0000"/><path d="M-6 -3l-3-3M-6 3l-3 3M6 -3l3-3M6 3l3 3M0 -4v8" stroke="#3a0000" stroke-width="1"/><text x="10" y="4" class="mdw-ml mdw-y2k">the Bug!</text></g>
    </svg>`;
  }
  function map(el) {
    frame(el, '/map.html', `<h1>Map of the Realm</h1><p class="mdw-lead">Drawn by JackK (who draws maps of everything). Inside the game, type <code>MAP</code> to see the rooms around you, or get <a href="${H}/download.html">MUDdy 98</a> which draws the map as you walk.</p>
      <div class="mdw-mapwrap">${realmMap()}</div>
      <table class="mdw-table mdw-areas"><tr><th>Where</th><th>Level</th><th>How to get there</th></tr>
      <tr><td>The Adventurers' Academy</td><td>1</td><td>Where everyone starts. Lessons, a tuck shop, Dennis the dummy.</td></tr>
      <tr><td>Baudby</td><td>any</td><td>South of the Academy. Shops, bank, inn, temple, guilds, arcade, cyber café.</td></tr>
      <tr><td>Floppy Fields</td><td>1-5</td><td>Out of the East Gate. Geese, bunnies, beehives, the Rocket Range.</td></tr>
      <tr><td>Whispering Woods</td><td>2-6</td><td>Out of the West Gate. Granny Byte, the troll bridge, Big Ted.</td></tr>
      <tr><td>The Sewers</td><td>3-7</td><td>Down the ladder in the Back Alley. Sock gremlins and their king.</td></tr>
      <tr><td>The Isle of Spam</td><td>5-9</td><td>The Soggy Biscuit sails from the Docks (south of town).</td></tr>
      <tr><td>The Grumbly Hills &amp; Caves of Lag</td><td>6-11</td><td>North of Windy Hill. Gloomy Gus rows you over the lake.</td></tr>
      <tr><td>Mount Megabyte</td><td>9-14</td><td>East of the Windy Ledge. A yeti called Spaghetti. A dragon.</td></tr>
      <tr><td>Orbital Station 99 &amp; the Moon</td><td>10-16</td><td>Pass the astronaut exam at the Rocket Range, then BOARD and LAUNCH.</td></tr>
      <tr><td>The Old Server Room</td><td>14-20</td><td>Under the Clock Tower. Old Tom Tick has the key. Bring friends.</td></tr></table>`);
  }

  // ================================================================ who's on / hall of heroes
  const VIA = { tel: 'Telnet', dos: 'JACK-DOS', web: 'Java', app: 'MUDdy 98' };
  function who(el) {
    frame(el, '/who.html', `<h1>Who's On Right Now <span class="mdw-livedot"></span></h1><p class="mdw-lead">Everyone in JackMUD this very second. This page updates itself.</p><div class="mdw-who">Asking mud.jacknet.jnet...</div><p class="mdw-small">Want to join them? <a href="${H}/play.html">Play now</a> or <a href="telnet://mud.jacknet.jnet:4000">telnet in</a>.</p>`);
    const box = el.querySelector('.mdw-who');
    const draw = m => { const L = m.list || []; box.innerHTML = L.length ? `<table class="mdw-table mdw-whot"><tr><th>Name</th><th>Level</th><th>Class</th><th>Where</th><th>Playing on</th></tr>${L.map(x => `<tr><td><b>${esc(x.n)}</b>${x.t ? ' <small>' + esc(x.t) + '</small>' : ''}${x.g ? ' <small class="mdw-guest">(guest)</small>' : ''}</td><td class="mdw-num">${x.lv}</td><td>${esc(x.c)}</td><td>${esc(x.a)}</td><td>${VIA[x.v] || 'Telnet'}</td></tr>`).join('')}</table><p>${L.length} adventurer${L.length === 1 ? '' : 's'} online.</p>` : '<div class="mdw-empty">Nobody is playing right now. The geese are winning. <a href="' + H + '/play.html">Go and stop them!</a></div>'; };
    live(el).on('mdWho', draw).every(() => Net.send({ t: 'mdWho' }), 6000);
    setTimeout(() => Net.send({ t: 'mdWho' }), 100);
  }
  function heroes(el) {
    frame(el, '/heroes.html', `<h1>The Hall of Heroes</h1><p class="mdw-lead">The top twenty JackNet members in JackMUD, by level. (Guests aren't saved, so they can't be heroes. Join JackNet, it's free.)</p><div class="mdw-hof">Fetching the scrolls...</div>`);
    const box = el.querySelector('.mdw-hof');
    live(el).on('mdTop', m => {
      const L = m.list || [];
      box.innerHTML = L.length ? `<table class="mdw-table mdw-hoft"><tr><th>#</th><th>Hero</th><th>Level</th><th>Class</th><th>Quests</th><th>Monsters</th></tr>${L.map((x, i) => `<tr class="${i < 3 ? 'mdw-top' + (i + 1) : ''}"><td class="mdw-num">${i + 1}</td><td><b>${esc(x.n)}</b>${x.t ? ' <small>' + esc(x.t) + '</small>' : ''}</td><td class="mdw-num">${x.lv}</td><td>${esc(x.c)}</td><td class="mdw-num">${x.q}/${m.quests}</td><td class="mdw-num">${fmt(x.k)}</td></tr>`).join('')}</table>` : '<div class="mdw-empty">The Hall is empty! Be the first hero of JackMUD.</div>';
    });
    setTimeout(() => Net.send({ t: 'mdTop' }), 100);
  }

  // ================================================================ download + rules
  function download(el) {
    const has = window.Setup && Setup.has && Setup.has('md.muddy');
    frame(el, '/download.html', `<h1>MUDdy 98</h1><p class="mdw-lead">The MUD client for people who are fed up of typing NORTH. <b>Freeware!</b></p>
      <div class="mdw-dl"><div class="mdw-dlshot" aria-hidden="true"><div class="mdw-dlbar"><i></i><span>MUDdy 98 - JackMUD</span></div><div class="mdw-dlin"><div class="mdw-dlterm"><span class="f14">Giles' Farmyard</span><br><span class="f7">A muddy farmyard surrounded by a red barn...</span><br><span class="f10">Exits: west, north, east</span><br><span class="f11">Farmer Giles leans on the gate.</span><br><span class="f9">A honking goose stretches its neck out at you.</span></div><div class="mdw-dlpan"><div class="mdw-dlbars"><i style="--w:80%;--c:#3c3"></i><i style="--w:55%;--c:#3cf"></i><i style="--w:30%;--c:#c3c"></i></div><div class="mdw-dlmap"><b style="left:40%;top:40%" class="me"></b><b style="left:20%;top:40%"></b><b style="left:60%;top:40%"></b><b style="left:40%;top:15%"></b><b style="left:60%;top:15%"></b></div><div class="mdw-dlcomp"><i></i><i class="o"></i><i></i><i class="o"></i><i class="c"></i><i class="o"></i><i></i><i></i><i></i></div></div></div></div>
        <div class="mdw-dltxt"><ul class="mdw-list"><li>A <b>map</b> that draws itself as you explore</li><li>A clickable <b>compass</b> (it lights up the ways you can go)</li><li><b>Health, magic and XP bars</b>, and a health bar for whatever you're fighting</li><li><b>Who's here</b>: click people to talk, monsters to fight, things to pick up</li><li>Colour schemes (green screen! amber!) and big text</li></ul>
          <table class="mdw-table mdw-dltab"><tr><td>File</td><td>MUDDY98.EXE (Setup)</td></tr><tr><td>Size</td><td>1.4 MB (about 7 minutes on a 28.8 modem)</td></tr><tr><td>Version</td><td>1.3 (14/12/98)</td></tr><tr><td>Licence</td><td>Freeware</td></tr><tr><td>Works on</td><td>JackOS 95, 98, and probably your toaster</td></tr></table>
          <p><button type="button" class="mdw-dlbtn">${has ? 'Open MUDdy 98' : 'Download MUDdy 98 now'}</button></p></div></div>`);
    el.querySelector('.mdw-dlbtn').addEventListener('click', () => {
      if (window.Setup && Setup.has && Setup.has('md.muddy')) A.open('md.muddy');
      else if (window.Setup && Setup.download) Setup.download('md.muddy');
      else A.open('md.muddy');
    });
  }
  function rules(el) {
    frame(el, '/rules.html', `<h1>The Rules</h1><p class="mdw-lead">JackMUD is for everyone. Keep it that way.</p>
      <ol class="mdw-steps mdw-rules"><li><b>Be nice.</b> Help newbies. We were all newbies once.</li><li><b>No swearing.</b> The word filter will catch you anyway, and my Mom reads the logs.</li><li><b>Never tell anyone your real address, phone number or school.</b> Not even a little bit. Not even if they say they're the Implementor. (I will never ask.)</li><li><b>Don't spam SHOUT.</b> People are trying to have a quiet adventure.</li><li><b>No fighting other players.</b> You can't anyway. Hug them instead.</li><li>If somebody is being horrible, <b>tell a grown-up</b> and stop playing with them.</li><li><b>QUIT properly</b> before someone needs the phone.</li></ol>
      <p>Breaking the rules gets you disconnected by the Implementor (that's me). Keeping them gets you a lovely time. Your choice!</p><p class="mdw-sig">- Jack</p>`);
  }

  window.MDWeb = { home, play, newbie, classes, map, who, heroes, news, download, rules, bestiary, applet, logo };
})();

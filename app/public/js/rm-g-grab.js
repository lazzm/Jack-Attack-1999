/* GRABBO LAND (Game Boy, in Jack's room): a greedy treasure-hunting platformer. GRABBO (hard hat, enormous moustache,
 * no manners at all) barges across Grabbo Island: Sandy Bay, Coconut Cliffs, Fudge Forest, Drippy Cave, the wreck of
 * the Soggy Biscuit and Castle Hogsworth, then takes on KING HOGSWORTH himself for the island's treasure.
 * A jumps, B shoulder-barges (smashes blocks, bowls baddies over), Down in the air butt-stomps through cracked floors,
 * Up climbs ladders and opens the goal door. Jump on a baddie to bonk it, walk into it to pick it up, B throws it.
 * Grabbo never dies, he drops coins. Bees puff him up, flames set him running, falling weights squash him flat (and
 * all three are handy). Every level hides a key and a locked treasure chest. The map saves itself: CONTINUE on the
 * title screen. Four shades only (the Game Lad's own colours). All art, music and everything else is original. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const W = 160, H = 144, TS = 16, HUDH = 10, VH = H - HUDH;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ================================================================ music (16th-note steps, written as note names)
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const tune = s => s.trim().split(/\s+/).map(t => t === '.' ? 0 : t === '-' ? -1 : 12 * (+t[t.length - 1] + 1) + NOTE[t[0]] + (t[1] === '#' ? 1 : 0));
  const song = (name, bpm, lead, bass, drums, vol) => ({ name, bpm, wave: 'square', bassWave: 'triangle', vol: vol || 0.045, lead: tune(lead), bass: tune(bass), drums });
  const SONGS = {
    title: song('title', 150,
      `c5 . e5 . g5 . c6 . b5 . g5 . e5 . g5 .  a5 . f5 . a5 . c6 . b5 - - . g5 . . .  c5 . e5 . g5 . c6 . d6 . c6 . b5 . a5 .  g5 . e5 . d5 . f5 . e5 - - - c5 . . .`,
      `c3 . c4 . g3 . c4 . c3 . c4 . g3 . c4 .  f3 . f4 . c4 . f4 . g3 . g4 . d4 . g4 .  a3 . a4 . e4 . a4 . f3 . f4 . c4 . f4 .  g3 . g4 . d4 . g4 . c3 . g3 . c3 . . .`,
      'o...x...o.o.x...'),
    map: song('map', 112,
      `g5 . . d5 . . g5 . a5 . b5 . . . a5 .  g5 . . e5 . . c5 . d5 . . . . . . .  e5 . . g5 . . c6 . b5 . a5 . g5 . e5 .  f#5 . . a5 . . d5 . g5 - - - . . . .`,
      `g3 . . . d4 . . . g3 . . . d4 . . .  c3 . . . g3 . . . d3 . . . a3 . . .  c3 . . . g3 . . . e3 . . . b3 . . .  d3 . . . a3 . . . g3 . d3 . g2 . . .`,
      'o.......x.......'),
    beach: song('beach', 150,
      `e5 . g5 . c6 . g5 c6 - . g5 . e5 . f5 .  g5 . f5 . e5 . c5 e5 - . . . d5 . . .  f5 . a5 . d6 . a5 d6 - . a5 . f5 . e5 .  d5 . e5 . f5 . b4 c5 - . . . . . . .
       e5 . g5 . c6 . g5 c6 - . g5 . e5 . f5 .  g5 . f5 . e5 . c5 e5 - . . . d5 . . .  f5 . e5 . d5 . g5 . f5 . e5 . d5 . b4 .  c5 - - . g4 . c5 . . . . . . . . .`,
      `c3 . . c3 . . g3 . c3 . . c3 . . g3 .  c3 . . c3 . . g3 . g3 . . g3 . . d4 .  f3 . . f3 . . c4 . f3 . . f3 . . c4 .  g3 . . g3 . . d4 . c3 . . g3 . c3 . .`,
      'o..x..o.o..x.xx.'),
    cliffs: song('cliffs', 140,
      `d5 . . a5 . . g5 . f5 . e5 . d5 . . .  c5 . . g5 . . f5 . e5 . d5 . c5 . . .  d5 . f5 . a5 . d6 . c6 . a5 . g5 . a5 .  f5 . e5 . d5 . e5 . d5 - - - . . . .`,
      `d3 . d3 . a3 . d3 . d3 . d3 . a3 . d4 .  c3 . c3 . g3 . c3 . c3 . c3 . g3 . c4 .  a#2 . a#2 . f3 . a#2 . c3 . c3 . g3 . c3 .  d3 . a3 . d3 . a3 . d3 . . . a2 . . .`,
      'o...x.o.o...x...'),
    forest: song('forest', 132,
      `g5 . b5 . d6 . b5 . c6 . a5 . . . . .  a5 . c6 . e6 . c6 . d6 . b5 . . . . .  e5 . g5 . e5 . d5 . c5 . e5 . g5 . c6 .  b5 . a5 . f#5 . a5 . g5 - - - . . . .`,
      `g2 . . g3 . . d3 . g2 . . g3 . . d3 .  a2 . . a3 . . e3 . g2 . . g3 . . d3 .  c3 . . c4 . . g3 . c3 . . c4 . . g3 .  d3 . . d4 . . a3 . g2 . d3 . g2 . . .`,
      'o..xo.x.o..xo.xx'),
    cave: song('cave', 100,
      `a4 . . . c5 . . . e5 . . . d5 . c5 .  b4 . . . . . . . g#4 . . . . . . .  a4 . . . c5 . . . e5 . . . a5 . g5 .  f5 . . . e5 . . . d5 . c5 . b4 . . .`,
      `a2 . . . a2 . . . a2 . . . a2 . . .  e2 . . . e2 . . . e2 . . . e2 . . .  f2 . . . f2 . . . c3 . . . c3 . . .  d3 . . . d3 . . . e2 . . . e2 . . .`,
      'o.......x.......'),
    ship: song('ship', 168,
      `d5 . . a4 . . d5 . f5 . . e5 . . d5 .  c5 . . a4 . . c5 . e5 . . d5 . . c5 .  d5 . . a4 . . d5 . f5 . . a5 . . g5 .  f5 . . e5 . . c#5 . d5 - - - . . . .`,
      `d3 . . a3 . . d3 . d3 . . a3 . . d3 .  c3 . . g3 . . c3 . a2 . . e3 . . a2 .  d3 . . a3 . . d3 . f3 . . c4 . . f3 .  a2 . . e3 . . a2 . d3 . . a3 . d3 . .`,
      'o..x..o.o..x..x.'),
    castle: song('castle', 120,
      `e5 . . e5 g5 . . e5 b5 . a5 . g5 . f#5 .  e5 . . . . . b4 . e5 . . . . . . .  c6 . . c6 b5 . . a5 g5 . a5 . b5 . . .  a5 . g5 . f#5 . d#5 . e5 - - - . . . .`,
      `e3 . e3 . e3 . e3 . e3 . e3 . e3 . e3 .  c3 . c3 . c3 . c3 . b2 . b2 . b2 . b2 .  a2 . a2 . a2 . a2 . e3 . e3 . e3 . e3 .  b2 . b2 . b2 . b2 . e3 . b2 . e3 . . .`,
      'o...x...o.o.x...'),
    boss: song('boss', 176,
      `a5 . a5 . c6 . a5 . e6 . d6 . c6 . b5 .  a5 . a5 . c6 . a5 . g5 . g5 . f5 . e5 .  f5 . f5 . a5 . f5 . c6 . b5 . a5 . g#5 .  a5 . e5 . a5 . b5 . c6 . b5 . a5 . e5 .`,
      `a2 a3 a2 a3 a2 a3 a2 a3 a2 a3 a2 a3 a2 a3 a2 a3  a2 a3 a2 a3 a2 a3 a2 a3 g2 g3 g2 g3 g2 g3 g2 g3  f2 f3 f2 f3 f2 f3 f2 f3 e2 e3 e2 e3 e2 e3 e2 e3  a2 a3 a2 a3 e2 e3 e2 e3 a2 a3 a2 a3 e2 e3 e2 e3`,
      'o.x.oxx.o.x.oxxx'),
    ending: song('ending', 120,
      `c5 . e5 . g5 . c6 - - - b5 . a5 . g5 .  f5 . a5 . c6 . f6 - - - e6 . d6 . c6 .  b5 . c6 . d6 . g5 . c6 . d6 . e6 - - .  d6 . c6 . b5 . d6 . c6 - - - - - - .`,
      `c3 . g3 . c4 . g3 . c3 . g3 . c4 . g3 .  f3 . c4 . f4 . c4 . f3 . c4 . f4 . c4 .  g3 . d4 . g4 . d4 . g3 . d4 . g4 . d4 .  g3 . d4 . g3 . d4 . c3 . g3 . c4 . . .`,
      'o...x...o...x.x.'),
  };

  // ================================================================ the levels: 16x16 tiles, built from 16-wide segments
  // .  air         #  ground       %  hard block     =  plank (stand on it, jump up through)    H  ladder
  // B  block (barge it, stomp it, throw a baddie at it)   S  cracked floor (butt-stomp only)   F  fire block (only a
  // burning Grabbo breaks it)    ?  coin block    ^  spikes    T  wall torch (sets you alight)    ~ w  water
  // o  coin    O  big coin (10)   k  key   C  chest   D  goal door   P  start   !  sign   "  |  Y  scenery
  // 1 crab   2 hedgehog (spiky)   3 bee (puffs you up)   4 ember (sets you alight)   5 thumper (squashes you)   6 gull
  // 7 spear guard   K  the king
  // levels are built from rectangles: r(char, x, y, w, h) fills, s(string, x, y) writes along a row (' ' skips)
  function build(w, h, fn) {
    const g = Array.from({ length: h }, () => Array(w).fill('.'));
    const b = { r(ch, x, y, ww, hh) { for (let j = 0; j < (hh || 1); j++) for (let i = 0; i < (ww || 1); i++) if (g[y + j] && x + i >= 0 && x + i < w) g[y + j][x + i] = ch; return b; },
      s(str, x, y) { for (let i = 0; i < str.length; i++) if (str[i] !== ' ' && g[y] && x + i < w) g[y][x + i] = str[i]; return b; },
      arc(x, y, n) { for (let i = 0; i < n; i++) { const yy = y - Math.round(Math.sin(i / (n - 1) * Math.PI) * 2); if (g[yy]) g[yy][x + i] = 'o'; } return b; },
      palm(x, y) { b.s('Y', x, y); for (let yy = y + 1; yy < h && g[yy][x] === '.'; yy++) g[yy][x] = '|'; return b; },
      pit(x, y, ww) { b.r('.', x, y, ww, 99).r('~', x, y + 1, ww, 1).r('w', x, y + 2, ww, 99); return b; } };
    fn(b);
    return g.map(r => r.join(''));
  }
  const LEVELS = [
    { name: 'SANDY BAY', theme: 'beach', song: 'beach', tr: 'GOLDEN BUCKET',
      signs: ['HI GRABBO! LEFT/RIGHT TO WALK. PRESS {A} TO JUMP. GRAB EVERY COIN!',
        'JUMP ON A BADDIE TO BONK IT. THEN WALK INTO IT TO PICK IT UP, AND PRESS {B} TO THROW!',
        'PRESS {B} TO BARGE! IT SMASHES BLOCKS AND BOWLS BADDIES RIGHT OVER.',
        'IN THE AIR, PRESS DOWN TO BUTT-STOMP. IT CRUNCHES THROUGH CRACKED FLOORS!',
        'HEDGEHOGS ARE TOO SPIKY TO JUMP ON. BARGE THEM! GOT THE KEY? TOUCH THE CHEST!',
        'PRESS UP AT THE GOAL DOOR TO FINISH. GREEDY GUTS!'],
      rows: build(120, 16, b => {
        b.r('#', 0, 12, 120, 4).palm(2, 7).s('P', 4, 11).s('!', 7, 11).arc(10, 10, 5);
        b.r('#', 16, 10, 7, 2).s('ooooo', 17, 8).s('1', 27, 11).s('!', 24, 11).s('"', 20, 11);
        b.s('!', 30, 11).r('B', 33, 10, 2, 2).s('oooo', 36, 11).s('oooo', 36, 10).palm(41, 7).arc(42, 9, 5);
        b.pit(47, 12, 3).arc(46, 9, 5).r('#', 51, 10, 8, 2).s('???', 52, 7).s('1', 56, 9).s('oo', 60, 10).palm(62, 7);
        b.s('!', 64, 11).r('.', 64, 13, 12, 2).r('S', 67, 12, 2, 1).r('H', 64, 12, 1, 3).s('oooooo', 66, 14).s('k', 74, 14).s('"', 70, 11);
        b.s('!', 78, 11).s('2', 82, 11).r('=', 80, 8, 4, 1).s('oooo', 80, 7).r('#', 86, 10, 5, 2).s('C', 88, 9).s('O', 88, 5).s('6', 94, 4).arc(92, 10, 7);
        b.s('1', 102, 11).r('B', 105, 11, 1, 1).s('ooo', 106, 11).s('oo', 106, 10).s('!', 110, 11).s('O', 113, 9).s('D', 116, 11).palm(118, 7);
      }) },
    { name: 'COCONUT CLIFFS', theme: 'cliffs', song: 'cliffs', tr: 'GOLD COCONUT',
      signs: ['GULLS LOVE SHINY THINGS. JUMP ON THEIR HEADS, OR BARGE THEM INTO THE SEA!',
        'BONK THAT CRAB, PICK IT UP, AND THROW IT AT THOSE BLOCKS. GO ON!',
        'BIG GAP? BARGE, AND PRESS {A} WHILE YOU BARGE FOR A MEGA LEAP!',
        'COCONUTS ARE NOT TREASURE. NICE TRY, GRABBO.'],
      rows: build(130, 20, b => {
        b.r('#', 0, 16, 26, 4).palm(1, 11).s('P', 3, 15).s('!', 6, 15).arc(9, 14, 5).s('6', 14, 8).s('1', 20, 15).s('"', 17, 15);
        b.r('#', 20, 13, 6, 3).s('oooo', 21, 11).r('H', 25, 9, 1, 4).r('#', 26, 9, 12, 11).s('!', 27, 8).s('1', 32, 8).arc(28, 6, 6).r('B', 36, 7, 2, 2).s('oo', 35, 4);
        b.pit(38, 16, 24).r('#', 41, 11, 2, 9).r('#', 46, 11, 2, 9).r('#', 51, 10, 2, 10).r('#', 56, 11, 3, 9).s('!', 41, 10);
        b.arc(38, 8, 5).arc(44, 8, 5).s('O', 51, 6).arc(49, 8, 5).arc(54, 9, 5).s('6', 48, 3).s('6', 58, 5);
        b.r('#', 62, 10, 22, 10).r('.', 65, 12, 16, 3).r('S', 70, 10, 2, 2).r('H', 66, 10, 1, 5).s('k', 79, 14).s('oooooo', 68, 14).s('2', 76, 9).arc(63, 8, 7).s('??', 75, 6).s('"', 81, 9);
        b.r('#', 84, 10, 6, 10).r('#', 90, 4, 3, 16).r('H', 89, 4, 1, 6).s('C', 91, 3).s('O', 86, 7).s('6', 96, 2).s('oo', 86, 5);
        b.r('#', 93, 13, 12, 7).s('1', 99, 12).arc(94, 11, 6).palm(103, 8).s('!', 96, 12);
        b.pit(105, 13, 4).arc(104, 10, 7).r('#', 109, 13, 5, 7).r('#', 114, 11, 16, 9).s('6', 116, 4).s('1', 120, 10).s('!', 123, 10).s('D', 126, 10).arc(109, 10, 5).s('O', 118, 7).s('ooo', 120, 8).r('H', 113, 11, 1, 2);
      }) },
    { name: 'FUDGE FOREST', theme: 'forest', song: 'forest', tr: 'HONEY CROWN',
      signs: ['BEES! ONE STING AND YOU PUFF UP AND FLOAT. STEER WITH LEFT/RIGHT, AND {A} LETS THE AIR OUT.',
        'SOMETHING SHINY IN THAT OLD STUMP... BARGE IN ROUND THE BACK!',
        'COINS UP IN THE TREES? A BEE COULD GIVE YOU A LIFT...',
        'HONEY? NO THANKS. MONEY? YES PLEASE!'],
      rows: build(130, 20, b => {
        b.r('#', 0, 17, 130, 3).s('P', 3, 16).s('!', 6, 16);
        for (const x of [11, 34, 60, 82, 104, 118]) b.palm(x, 9);
        b.s('3', 18, 14).arc(16, 15, 6).r('#', 22, 15, 4, 2).s('oo', 23, 13);
        b.r('=', 14, 6, 6, 1).s('oooooo', 14, 5).r('=', 22, 3, 5, 1).s('ooooo', 22, 2).r('=', 29, 6, 5, 1).s('O', 31, 4).r('=', 37, 3, 6, 1).s('k', 40, 2).s('oo', 38, 2);
        b.s('2', 28, 16).s('???', 29, 13).s('3', 38, 14).r('^', 42, 16, 3, 1).arc(40, 13, 6).r('B', 48, 14, 1, 3).arc(50, 15, 5).s('2', 54, 16);
        b.r('#', 57, 15, 3, 2).r('#', 60, 12, 10, 5).r('.', 61, 14, 8, 3).r('B', 69, 15, 1, 2).s('C', 62, 16).s('ooo', 64, 16).s('!', 55, 16).arc(61, 10, 8).s('"', 71, 16);
        b.pit(72, 17, 3).arc(71, 14, 5).s('2', 78, 16).s('!', 84, 16).s('3', 88, 14).r('#', 88, 5, 8, 1).s('oooooooo', 88, 4).s('O', 92, 2).s('??', 92, 13).r('#', 90, 15, 3, 2).s('oo', 90, 13);
        b.r('B', 98, 14, 2, 3).arc(100, 15, 5).s('3', 106, 13).r('=', 108, 9, 4, 1).s('oooo', 108, 8).s('2', 112, 16).s('^^', 114, 16, 1).arc(113, 13, 5).s('!', 120, 16).s('D', 126, 16).s('O', 123, 13);
      }) },
    { name: 'DRIPPY CAVE', theme: 'cave', song: 'cave', tr: 'MOON CRYSTAL',
      signs: ['OUCH, FLAMES! TOUCH ONE AND YOU RUN ABOUT ON FIRE. A HOT GRABBO SMASHES FIRE BLOCKS!',
        'A FLAME UP THERE... AND A FIRE BLOCK. HMMM!',
        'A SECRET CELLAR? THE FLOOR HERE LOOKS CRACKED...',
        'NEARLY OUT! MIND THE HOT STUFF. OR DON\'T. YOUR CHOICE.'],
      rows: build(130, 18, b => {
        b.r('#', 0, 0, 130, 2).r('#', 0, 14, 130, 4).s('P', 3, 13).s('!', 6, 13).s('T', 12, 12).r('F', 18, 10, 2, 4).arc(21, 12, 5).s('"', 26, 13).s('4', 29, 13).s('ooo', 26, 10);
        b.r('#', 31, 11, 4, 3).s('oo', 32, 9).pit(36, 14, 6).r('=', 37, 11, 2, 1).r('=', 40, 10, 2, 1).s('oo', 37, 9).s('oo', 40, 8);
        b.s('!', 43, 13).r('H', 44, 7, 1, 7).r('#', 45, 7, 10, 1).s('T', 47, 6).r('F', 52, 4, 1, 3).r('#', 52, 3, 4, 1).r('#', 55, 4, 1, 3).s('k', 53, 6).s('O', 54, 6).s('ooo', 48, 4);
        b.s('4', 51, 13).arc(46, 12, 6).s('2', 62, 13).s('???', 64, 10).s('"', 70, 13).arc(66, 12, 5).r('#', 72, 12, 3, 2).s('oo', 72, 10);
        b.s('!', 77, 13).r('.', 79, 15, 15, 2).r('S', 81, 14, 2, 1).s('T', 84, 16).r('F', 88, 15, 1, 2).s('C', 91, 16).s('ooo', 85, 15).r('H', 93, 14, 1, 3).s('oo', 89, 16);
        b.s('4', 100, 13).s('T', 105, 12).r('F', 109, 11, 1, 3).arc(110, 12, 5).s('O', 113, 10).s('4', 116, 13).s('!', 119, 13).s('D', 125, 13).arc(96, 11, 5).s('"', 122, 13);
        for (const x of [9, 24, 33, 58, 71, 97, 113, 123]) b.s('|', x, 2);
      }) },
    { name: 'SOGGY BISCUIT', theme: 'ship', song: 'ship', tr: 'CAPTAIN\'S TEAPOT',
      signs: ['AHOY! BIG WEIGHTS SQUASH YOU FLAT. FLAT GRABBOS FLUTTER, AND SLIDE UNDER TINY GAPS!',
        'THE CAPTAIN KEEPS HIS BEST STUFF BELOW DECK.',
        'PIRATE GUARDS POKE FROM THE FRONT. BONK THEIR HEADS!',
        'LAND AHOY! WELL, A DOOR AHOY.'],
      rows: build(130, 16, b => {
        b.r('~', 0, 14, 130, 1).r('w', 0, 15, 130, 1).r('#', 0, 11, 8, 5).s('P', 2, 10).s('!', 5, 10);
        b.r('#', 8, 9, 114, 5).arc(9, 8, 6);
        b.r('|', 20, 1, 1, 8).r('H', 21, 2, 1, 7).r('=', 17, 2, 7, 1).s('ooooo', 17, 1).s('O', 24, 1).s('6', 28, 3).s('1', 26, 8).s('"', 16, 8);
        b.r('%', 34, 2, 3, 1).s('5', 35, 5).r('H', 39, 5, 1, 4).r('#', 40, 5, 10, 3).arc(41, 4, 8).s('ooooooo', 41, 8).s('k', 48, 8).s('7', 53, 8);
        b.s('!', 58, 8).r('.', 60, 10, 20, 3).r('S', 62, 9, 2, 1).s('C', 76, 12).s('1', 69, 12).s('oooooo', 64, 12).r('H', 79, 9, 1, 4).s('6', 66, 3).s('??', 70, 5).arc(63, 7, 7);
        b.r('|', 84, 1, 1, 8).r('H', 85, 2, 1, 7).r('=', 82, 3, 6, 1).s('ooooo', 82, 2).s('!', 88, 8).s('7', 93, 8).s('"', 90, 8);
        b.r('%', 96, 2, 4, 1).s('5', 97, 5).r('H', 100, 6, 1, 3).r('#', 101, 6, 6, 2).s('oOoooo', 101, 8).s('ooo', 102, 5).s('6', 105, 2).s('1', 111, 8).s('!', 114, 8).s('D', 117, 8).arc(108, 7, 5);
      }) },
    { name: 'CASTLE HOGSWORTH', theme: 'castle', song: 'castle', tr: 'DIAMOND TOASTER',
      signs: ['CASTLE HOGSWORTH! THE KING\'S GUARDS ARE EVERYWHERE. GRAB EVERYTHING THAT ISN\'T NAILED DOWN!',
        'NO WAY ROUND THAT FIRE BLOCK... UNLESS YOU\'RE ON FIRE.',
        'THE KING\'S TREASURE CELLAR IS DOWN THERE SOMEWHERE...',
        'THE KING\'S ROOM IS UP AHEAD. DEEP BREATH, GRABBO.'],
      rows: build(130, 20, b => {
        b.r('#', 0, 0, 130, 2).r('#', 0, 15, 130, 5).s('P', 3, 14).s('!', 6, 14).s('7', 12, 14).arc(8, 12, 5);
        b.r('^', 16, 14, 9, 1).r('=', 17, 11, 2, 1).r('=', 21, 10, 2, 1).r('=', 24, 12, 1, 1).s('oo', 17, 9).s('oo', 21, 8).s('7', 28, 14).s('"', 26, 14);
        b.r('%', 32, 2, 3, 1).s('5', 33, 8).r('H', 37, 10, 1, 5).r('#', 38, 10, 7, 4).s('ooooooo', 38, 14).s('O', 41, 14).arc(38, 8, 7).r('%', 46, 2, 3, 1).s('5', 47, 8);
        b.s('!', 50, 14).s('T', 53, 14).r('F', 58, 11, 1, 4).arc(59, 13, 5).s('?', 56, 10).s('"', 62, 14);
        b.r('H', 66, 5, 1, 10).r('#', 67, 5, 9, 1).s('7', 73, 4).s('k', 75, 4).s('oooo', 68, 3).r('^', 69, 14, 4, 1).arc(67, 12, 7);
        b.s('!', 80, 14).r('.', 83, 16, 14, 2).r('S', 87, 15, 2, 1).r('H', 84, 15, 1, 3).s('C', 95, 17).s('2', 91, 17).s('ooooo', 86, 17);
        b.s('7', 102, 14).s('???', 104, 11).r('^', 108, 14, 3, 1).arc(107, 11, 5).s('7', 115, 14).s('!', 119, 14).s('D', 125, 14).s('O', 122, 12).s('"', 112, 14);
        for (const x of [10, 30, 52, 78, 100, 120]) b.r('|', x, 2, 1, 2);
      }) },
    { name: 'THE KING\'S ROOM', theme: 'castle', song: 'boss', boss: true, signs: [],
      rows: build(10, 9, b => { b.r('%', 0, 0, 10, 1).r('%', 0, 0, 1, 9).r('%', 9, 0, 1, 9).r('#', 0, 8, 10, 1).r('=', 1, 4, 2, 1).r('=', 7, 4, 2, 1).s('P', 2, 7).s('K', 7, 7); }) },
  ];
  const TREASURES = ['GOLDEN BUCKET', 'GOLD COCONUT', 'HONEY CROWN', 'MOON CRYSTAL', 'CAPTAIN\'S TEAPOT', 'DIAMOND TOASTER'];
  const MATES = [['DAVE', 7350], ['LUKE', 5480], ['JACK', 3920], ['CAL', 2210], ['JK', 1460], ['MOM', 120]];
  const NAMES = ['JACK', 'BIG JACK', 'JACK2', 'DAVE SUX', 'ASDF', 'TEST', 'GRABBO', 'JACK!!!'];

  TV.game('gb.grab', {
    buttons: ['a', 'b'], v: 1,
    help: 'Walk: arrows. Jump: Z. Barge: X. Butt-stomp: Down in the air. Ladders and doors: Up. Pause: Enter.',
    make(K) {
      const g = K.g, P = K.pal, F = K.font;
      const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
      const rect = (x, y, w, h, c) => { g.fillStyle = P[c]; g.fillRect(x, y, w, h); };
      const txt = (s, x, y, c) => F.draw(g, s, x, y, P[c == null ? 3 : c]);
      const ctr = (s, y, c, cx) => F.center(g, s, cx == null ? W / 2 : cx, y, P[c == null ? 3 : c]);
      const lab = s => s.replace(/\{(\w+)\}/g, (m, b) => K.label(b));
      function wrap(s, n) { const out = []; let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; }
      function box(x, y, w, h) { rect(x, y, w, h, 3); rect(x + 1, y + 1, w - 2, h - 2, 0); rect(x + 2, y + 2, w - 4, h - 4, 3); rect(x + 3, y + 3, w - 6, h - 6, 0); }
      let seed = 1; const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed >>> 8) / 16777216; };
      const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + (s | 0) * 2147483647) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

      // ============================================================ pixel art: patches of shade digits, 0 lightest .. 3 darkest
      function paint(w, h, parts) {
        const a = new Uint8Array(w * h);
        for (const [ox, oy, list] of parts) for (const [x, y, s] of list) for (let i = 0; i < s.length; i++) {
          const c = s.charCodeAt(i) - 48; if (c < 0 || c > 3) continue; const X = ox + x + i, Y = oy + y; if (X >= 0 && X < w && Y >= 0 && Y < h) a[Y * w + X] = c + 1;
        }
        return { w, h, a };
      }
      function canv(img, flip, map, vflip) {
        const c = mkc(img.w, img.h), x = c.getContext('2d');
        for (let y = 0; y < img.h; y++) for (let i = 0; i < img.w; i++) {
          const v = img.a[y * img.w + i]; if (!v) continue;
          let run = 1; while (i + run < img.w && img.a[y * img.w + i + run] === v) run++;
          x.fillStyle = P[map ? map[v - 1] : v - 1];
          const X = flip ? img.w - i - run : i; x.fillRect(X, vflip ? img.h - 1 - y : y, run, 1); i += run - 1;
        }
        return c;
      }
      const both = (img, map) => [canv(img, false, map), canv(img, true, map)]; // [facing right, facing left]
      const FLASH = [0, 0, 0, 0];

      // ---- GRABBO (drawn facing right; parts in "stand" coordinates, a 24x27 figure placed in a 32x32 cell)
      const G_HEAD = [
        [8, 0, '33333333'], [6, 1, '330000000133'], [5, 2, '30000000001113'], [4, 3, '3000000000011113'], [4, 4, '3000000000111113'],
        [3, 5, '322222222222222223'], [3, 6, '311111111111111113'], [3, 7, '3333333333333333333'],
        [4, 8, '33100000300333333'], [4, 9, '331000003003001113'], [4, 10, '310000000003011113'], [4, 11, '300000000003111123'],
        [4, 12, '3000333333333333333'], [4, 13, '303333333333333333333'], [4, 14, '3033030000000333.33'], [4, 15, '30003333333333310'], [4, 16, '3100031111113100'],
      ];
      const G_HV = { n: [], blink: [[11, 9, '33'], [12, 8, '0']], ouch: [[11, 8, '30'], [11, 9, '03'], [11, 10, '3']], dizzy: [[11, 8, '303'], [11, 9, '030'], [11, 10, '303']], grin: [[11, 9, '303'], [12, 8, '3']] };
      const G_TORSO = [[4, 17, '33113333333311133'], [3, 18, '3111122222222211113'], [4, 19, '31112022220211113'], [4, 20, '31122222222222113'], [4, 21, '3122222222222213'], [5, 22, '32222222222223'], [6, 23, '3222233222223']];
      const G_FB = [[1, 0, '333'], [0, 1, '30003'], [0, 2, '30013'], [1, 3, '333']];
      const G_FF = [[1, 0, '333'], [0, 1, '30003'], [0, 2, '31003'], [1, 3, '333']];
      const G_BB = [[1, 0, '333333'], [0, 1, '3322223'], [0, 2, '33333333']];
      const G_BF = [[1, 0, '3333333'], [0, 1, '33322223'], [0, 2, '333333333']];
      const GPOSE = {
        stand: { h: [0, 0], t: [0, 0], fb: [0, 19], ff: [19, 19], bb: [4, 24], bf: [12, 24] },
        stand2: { h: [0, 1], t: [0, 0], fb: [0, 20], ff: [19, 20], bb: [4, 24], bf: [12, 24] },
        blink: { h: [0, 0], t: [0, 0], fb: [0, 19], ff: [19, 19], bb: [4, 24], bf: [12, 24], hv: 'blink' },
        walk0: { h: [0, 0], t: [0, 0], fb: [1, 18], ff: [18, 20], bb: [2, 24], bf: [14, 23] },
        walk1: { h: [0, 1], t: [0, 1], fb: [0, 20], ff: [19, 20], bb: [4, 24], bf: [12, 24] },
        walk2: { h: [0, 0], t: [0, 0], fb: [-1, 20], ff: [20, 18], bb: [6, 23], bf: [10, 24] },
        jump: { h: [0, -1], t: [0, -1], fb: [-1, 12], ff: [20, 12], bb: [4, 22], bf: [12, 21] },
        fall: { h: [0, 0], t: [0, 0], fb: [-1, 15], ff: [20, 15], bb: [3, 24], bf: [13, 24] },
        barge0: { h: [4, 2], t: [2, 1], fb: [-2, 17], ff: [17, 19], bb: [1, 24], bf: [15, 24] },
        barge1: { h: [4, 3], t: [2, 2], fb: [-1, 18], ff: [17, 20], bb: [3, 23], bf: [13, 24] },
        stomp: { h: [0, 2], t: [0, 1], fb: [-1, 13], ff: [20, 13], bb: [5, 22], bf: [11, 22] },
        land: { h: [0, 3], t: [0, 2], fb: [-1, 21], ff: [20, 21], bb: [2, 24], bf: [14, 24] },
        hurt: { h: [-2, 0], t: [0, 0], fb: [-3, 10], ff: [21, 10], bb: [3, 23], bf: [13, 24], hv: 'ouch' },
        carry0: { h: [0, 0], t: [0, 0], fb: [1, -3], ff: [18, -3], bb: [4, 24], bf: [12, 24] },
        carry1: { h: [0, 1], t: [0, 1], fb: [1, -2], ff: [18, -2], bb: [2, 24], bf: [14, 23] },
        carry2: { h: [0, 0], t: [0, 0], fb: [1, -3], ff: [18, -3], bb: [6, 23], bf: [10, 24] },
        throw: { h: [2, 0], t: [1, 0], fb: [16, 16], ff: [21, 13], bb: [3, 24], bf: [13, 24] },
        win: { h: [0, 0], t: [0, 0], fb: [-2, 9], ff: [21, 9], bb: [4, 24], bf: [12, 24], hv: 'grin' },
        win2: { h: [0, -1], t: [0, -1], fb: [-2, 7], ff: [21, 7], bb: [4, 22], bf: [12, 22], hv: 'grin' },
        dizzy: { h: [0, 1], t: [0, 0], fb: [0, 20], ff: [19, 20], bb: [4, 24], bf: [12, 24], hv: 'dizzy' },
        fire0: { h: [1, 0], t: [0, 0], fb: [-2, 11], ff: [21, 13], bb: [2, 24], bf: [14, 23], hv: 'ouch' },
        fire1: { h: [1, 1], t: [0, 1], fb: [-2, 13], ff: [21, 11], bb: [6, 23], bf: [10, 24], hv: 'ouch' },
        bonk: { h: [-2, 1], t: [-1, 0], fb: [-3, 12], ff: [20, 15], bb: [2, 24], bf: [12, 23], hv: 'dizzy' },
      };
      function grabPose(p) {
        const o = [4, 5], at = (q, d) => [o[0] + q[0] + (d ? d[0] : 0), o[1] + q[1] + (d ? d[1] : 0)];
        const head = G_HEAD.concat(G_HV[p.hv || 'n']);
        return paint(32, 32, [[...at(p.fb), G_FB], [...at(p.bb), G_BB], [...at(p.bf), G_BF], [...at(p.t), G_TORSO], [...at(p.h), head], [...at(p.ff), G_FF]]);
      }
      // the back view (climbing ladders, going through doors); the other step is the same picture flipped
      const G_BACK = paint(32, 32, [[4, 7, [
        [8, 0, '33333333'], [6, 1, '330000001133'], [5, 2, '30000000111113'], [4, 3, '3000000011111113'], [4, 4, '3000000011111113'], [4, 5, '3222222222222223'], [4, 6, '3333333333333333'],
        [5, 7, '30333333333303'], [5, 8, '30333333333303'], [6, 9, '333333333333'], [5, 10, '31111111111113'],
        [4, 11, '3111211111121113'], [4, 12, '3111121111211113'], [4, 13, '3111112112111113'], [4, 14, '3222222222222223'], [4, 15, '3222222222222223'], [5, 16, '32222222222223'], [6, 17, '3222233222223'],
        [5, 18, '333333..333333'], [4, 19, '33222233222233'], [4, 20, '33333333333333'],
        [1, -4, '333'], [0, -3, '30003'], [0, -2, '30013'], [1, -1, '333'], [1, 0, '3113'], [2, 1, '3113'], [2, 2, '3113'], [3, 3, '3113'], [3, 4, '3113'], [3, 5, '311'], [3, 6, '31'], [3, 7, '31'], [3, 8, '31'], [3, 9, '31'],
        [20, 3, '333'], [19, 4, '30003'], [19, 5, '31003'], [20, 6, '333'], [19, 7, '3113'], [19, 8, '3113'], [18, 9, '3113'], [17, 10, '3113'],
      ]]]);
      // a squashed-flat Grabbo, made from the standing one
      function squash(img) {
        const w = 36, h = 10, a = new Uint8Array(w * h);
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const sx = 4 + Math.floor(i * 24 / w), sy = 5 + Math.floor(j * 27 / h); a[j * w + i] = img.a[sy * 32 + sx]; }
        for (let i = 0; i < w; i++) { if (a[i]) a[i] = 4; if (a[(h - 1) * w + i]) a[(h - 1) * w + i] = 4; }
        return { w, h, a };
      }
      // a puffed-up Grabbo: a big round balloon with his face on the front
      function puffArt() {
        const w = 30, h = 30, a = new Uint8Array(w * h), cx = 14.5, cy = 16.5, r = 12.5;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d > r) continue;
          const lit = Math.hypot(x + 0.5 - (cx - 4), y + 0.5 - (cy - 5));
          a[y * w + x] = d > r - 1.2 ? 4 : lit > 13 ? 3 : lit > 9 ? ((x + y) % 2 ? 2 : 1) : 1;
          if (lit < 3) a[y * w + x] = 1;
        }
        const img = { w, h, a };
        const over = paint(w, h, [[0, 0, [
          [10, 0, '3333333'], [8, 1, '3300000133'], [7, 2, '300000001113'], [6, 3, '32222222222223'], [5, 4, '3111111111111113'], [5, 5, '33333333333333333'],
          [17, 8, '3'], [17, 9, '3'], [20, 8, '3333'], [19, 9, '300113'], [19, 10, '3011113'], [19, 11, '3111123'], [20, 12, '33333'],
          [11, 13, '33333333333333333'], [10, 14, '33333.333333.3333'], [15, 16, '3000003'], [16, 17, '33333'],
          [0, 14, '333'], [0, 15, '3003'], [0, 16, '333'], [27, 18, '333'], [26, 19, '3003'], [27, 20, '333'],
          [9, 27, '3333'], [17, 27, '3333'], [9, 28, '3223'], [17, 28, '3223'], [9, 29, '3333'], [17, 29, '3333'],
        ]]]);
        for (let i = 0; i < w * h; i++) if (over.a[i]) a[i] = over.a[i];
        return img;
      }
      // the little flame that dances on a burning Grabbo's head (and the wall torches)
      const FLAME = [
        paint(12, 14, [[0, 0, [[5, 0, '3'], [4, 1, '303'], [3, 2, '3003'], [2, 3, '300103'], [1, 4, '3001103'], [1, 5, '30011103'], [0, 6, '3001111033'], [0, 7, '3011221103'], [0, 8, '3012222103'], [0, 9, '3012222103'], [1, 10, '30122103'], [2, 11, '301103'], [3, 12, '3333']]]]),
        paint(12, 14, [[0, 0, [[7, 0, '3'], [6, 1, '303'], [3, 2, '3.3003'], [2, 3, '303003'], [2, 4, '3001103'], [1, 5, '30011103'], [1, 6, '30111103'], [0, 7, '3011221103'], [0, 8, '3012222103'], [0, 9, '3012222103'], [1, 10, '30122103'], [2, 11, '301103'], [3, 12, '3333']]]]),
      ];

      // ---- the baddies (drawn facing right)
      const EART = {
        crab: [
          [[1, 1, '33'], [14, 1, '33'], [0, 2, '3003'], [13, 2, '3003'], [0, 3, '30.3'], [14, 3, '3.03'], [0, 4, '3003'], [14, 4, '3003'], [1, 5, '303'], [14, 5, '303'],
            [5, 3, '33..33'], [5, 4, '30..03'], [5, 5, '33..33'], [6, 6, '3..3'], [2, 6, '3'], [15, 6, '3'], [2, 7, '33333333333333'],
            [1, 8, '3100000000000113'], [0, 9, '310000000000011113'], [0, 10, '311000000001111113'], [0, 11, '311111111111111123'], [1, 12, '3222222222222223'], [2, 13, '33333333333333'],
            [2, 14, '3.3..3....3..3.3'], [1, 15, '3...3......3...3']],
          [[1, 2, '33'], [14, 2, '33'], [0, 3, '3003'], [13, 3, '3003'], [0, 4, '3003'], [14, 4, '3003'], [1, 5, '303'], [14, 5, '303'],
            [5, 3, '33..33'], [5, 4, '30..03'], [5, 5, '33..33'], [6, 6, '3..3'], [2, 6, '3'], [15, 6, '3'], [2, 7, '33333333333333'],
            [1, 8, '3100000000000113'], [0, 9, '310000000000011113'], [0, 10, '311000000001111113'], [0, 11, '311111111111111123'], [1, 12, '3222222222222223'], [2, 13, '33333333333333'],
            [1, 14, '3..3..3....3..3..3'], [2, 15, '3..3........3..3']],
        ],
        spiker: [
          [[5, 2, '3.3.3'], [3, 3, '3.333.3.3'], [2, 4, '3333233323'], [1, 5, '3322222222233'], [1, 6, '32222222222223'], [0, 7, '3222222222200033'], [0, 8, '32222222220000013'], [0, 9, '322222222003000013'],
            [0, 10, '322222222000000033'], [1, 11, '3222222221000013'], [1, 12, '322222221111133'], [2, 13, '3333333333333'], [3, 14, '303...303'], [3, 15, '333...333']],
          [[5, 2, '3.3.3'], [3, 3, '3.333.3.3'], [2, 4, '3333233323'], [1, 5, '3322222222233'], [1, 6, '32222222222223'], [0, 7, '3222222222200033'], [0, 8, '32222222220000013'], [0, 9, '322222222003000013'],
            [0, 10, '322222222000000033'], [1, 11, '3222222221000013'], [1, 12, '322222221111133'], [2, 13, '3333333333333'], [2, 14, '303.....303'], [2, 15, '333.....333']],
        ],
        bee: [
          [[3, 0, '333'], [9, 0, '333'], [2, 1, '30003'], [8, 1, '30003'], [2, 2, '300003'], [8, 2, '300003'], [3, 3, '33333333'], [3, 4, '3000003333'], [2, 5, '30022200303'], [1, 6, '3002220000033'], [1, 7, '3002220003003'],
            [1, 8, '3002220000013'], [2, 9, '30222000113'], [3, 10, '333333333'], [4, 11, '3..3'], [0, 7, '3']],
          [[2, 2, '3333'], [9, 2, '3333'], [1, 3, '3000033'], [8, 3, '300003'], [3, 4, '3000003333'], [2, 5, '30022200303'], [1, 6, '3002220000033'], [1, 7, '3002220003003'],
            [1, 8, '3002220000013'], [2, 9, '30222000113'], [3, 10, '333333333'], [5, 11, '3..3'], [0, 7, '3']],
        ],
        ember: [
          [[7, 0, '3'], [6, 1, '303'], [4, 2, '3.303'], [3, 3, '30300033'], [3, 4, '3000003003'], [2, 5, '300000000003'], [2, 6, '300100001003'], [2, 7, '301310013103'], [2, 8, '300100001003'], [2, 9, '300011110003'], [3, 10, '3001331003'], [3, 11, '3000110003'], [4, 12, '33000033'], [6, 13, '3333']],
          [[5, 0, '3'], [5, 1, '303'], [6, 2, '303.3'], [3, 3, '33000303'], [3, 4, '3003000003'], [2, 5, '300000000003'], [2, 6, '300100001003'], [2, 7, '301310013103'], [2, 8, '300100001003'], [2, 9, '300011110003'], [3, 10, '3001331003'], [3, 11, '3000110003'], [4, 12, '33000033'], [6, 13, '3333']],
        ],
        gull: [
          [[5, 0, '33'], [4, 1, '3003'], [4, 2, '30003'], [5, 3, '30003'], [5, 4, '300033'], [1, 5, '333300000333'], [0, 6, '30000000000033'], [1, 7, '33000000003303'], [3, 8, '3330000000113'], [5, 9, '3333333333'], [12, 6, '3333'], [13, 7, '3113']],
          [[1, 3, '333'], [0, 4, '30003'], [1, 5, '3000033333'], [1, 6, '3000000000333'], [2, 7, '330000000003303'], [3, 8, '33000000000113'], [5, 9, '3000003333'], [6, 10, '300033'], [6, 11, '30033'], [7, 12, '333'], [13, 7, '3113'], [14, 8, '33']],
        ],
        guard: [
          [[4, 0, '3333'], [2, 1, '33000033'], [1, 2, '3000000003'], [1, 3, '3333333333'], [1, 4, '3000003003'], [0, 5, '30000003003'], [0, 6, '300000000033'], [0, 7, '3000000033'], [1, 8, '32222222233'], [1, 9, '32022020223'],
            [1, 10, '3222222223'], [2, 11, '322222223'], [2, 12, '33333333'], [2, 13, '303..303'], [2, 14, '333..333'], [10, 7, '3333333333'], [10, 8, '3111111131'], [17, 6, '33'], [18, 7, '3'], [17, 9, '33']],
          [[4, 1, '3333'], [2, 2, '33000033'], [1, 3, '3000000003'], [1, 4, '3333333333'], [1, 5, '3000003003'], [0, 6, '30000003003'], [0, 7, '300000000033'], [0, 8, '3000000033'], [1, 9, '32222222233'], [1, 10, '32022020223'],
            [1, 11, '3222222223'], [2, 12, '322222223'], [2, 13, '3333333'], [1, 14, '303.303'], [1, 14, '333'], [10, 8, '3333333333'], [10, 9, '3111111131'], [17, 7, '33'], [18, 8, '3'], [17, 10, '33']],
        ],
      };
      const ESZ = { crab: [18, 16], spiker: [18, 16], bee: [14, 12], ember: [14, 14], gull: [18, 13], guard: [22, 15] };
      const ESPR = {}, ESPRF = {}, ESPRV = {};
      for (const k in EART) {
        ESPR[k] = EART[k].map(p => both(paint(ESZ[k][0], ESZ[k][1], [[0, 0, p]])));
        ESPRF[k] = EART[k].map(p => both(paint(ESZ[k][0], ESZ[k][1], [[0, 0, p]]), FLASH));
        ESPRV[k] = EART[k].map(p => { const im = paint(ESZ[k][0], ESZ[k][1], [[0, 0, p]]); return [canv(im, false, null, true), canv(im, true, null, true)]; });
      }
      const THUMP = [0, 1].map(f => canv(paint(20, 18, [[0, 0, [
        [0, 0, '33333333333333333333'], [0, 1, '30000000000000000013'], [0, 2, '30111111111111111123'],
        f ? [0, 3, '30133311111111333123'] : [0, 3, '30111111111111111123'], f ? [0, 4, '30113331111113331123'] : [0, 4, '30133331111113333123'],
        [0, 5, '30111300311300311123'], [0, 6, '30111300311300311123'], [0, 7, '30111133311333111123'], [0, 8, '30111111111111111123'],
        f ? [0, 9, '30111133333333111123'] : [0, 9, '30111111333311111123'], f ? [0, 10, '30111300000000311123'] : [0, 10, '30111113000031111123'], f ? [0, 11, '30111133333333111123'] : [0, 11, '30111111333311111123'],
        [0, 12, '30111111111111111123'], [0, 13, '30222222222222222223'], [0, 14, '33333333333333333333'], [0, 15, '30303030303030303030'], [0, 16, '3.3.3.3.3.3.3.3.3.3.'],
      ]]])));

      // ---- the king (a big round royal pig, 44x36, facing right), drawn with code and outlined
      function kingArt(face, step) {
        const w = 44, h = 36, a = new Uint8Array(w * h), put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = c + 1; };
        const ell = (cx, cy, rx, ry, fn) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) put(x, y, fn(dx, dy, x, y)); } };
        // the cape behind, the legs, the body
        ell(10, 21, 9, 10, (dx, dy, x, y) => (x + y) % 2 && dy > 0.2 ? 3 : 2);
        const lg = step ? [[13, -1], [25, 1]] : [[14, 0], [24, 0]];
        for (const [lx, ly] of lg) { for (let y = 28 + ly; y < 34 + Math.min(0, ly); y++) for (let x = lx; x < lx + 6; x++) put(x, y, y > 31 + Math.min(0, ly) ? 3 : x === lx ? 1 : 2); }
        ell(21, 19, 16, 12, (dx, dy) => { const l = (dx + 0.45) ** 2 + (dy + 0.55) ** 2; return l < 0.12 ? 0 : l < 0.9 ? 1 : l < 1.5 ? ((Math.round((dx + 2) * 40) + Math.round((dy + 2) * 40)) % 2 ? 1 : 2) : 2; });
        ell(26, 24, 8, 5, (dx, dy) => dy < -0.4 ? 1 : 0);
        // ear, snout, eye, tusk
        for (let y = 0; y < 6; y++) for (let x = 0; x <= 5 - y; x++) put(24 + x, 9 - y + 1, y < 2 ? 1 : 2);
        ell(36, 18, 4.5, 4, (dx, dy) => dy < -0.5 ? 0 : 1);
        put(35, 18, 3); put(37, 18, 3); put(35, 19, 3); put(37, 19, 3);
        const eye = { n: [[29, 12, '30'], [29, 13, '33']], mad: [[28, 11, '33'], [29, 12, '33'], [29, 13, '33']], dizzy: [[28, 11, '3.3'], [29, 12, '3'], [28, 13, '3.3']], hurt: [[28, 11, '3'], [29, 12, '33'], [28, 13, '3']] }[face];
        for (const [x, y, str] of eye) for (let i = 0; i < str.length; i++) if (str[i] !== '.') put(x + i, y, +str[i]);
        const mouth = { n: [[30, 22, '3333'], [31, 23, '0']], mad: [[29, 22, '33333'], [29, 23, '30003'], [30, 24, '333']], dizzy: [[30, 23, '3.3.3']], hurt: [[29, 22, '3333'], [29, 23, '3003'], [30, 24, '33']] }[face];
        for (const [x, y, str] of mouth) for (let i = 0; i < str.length; i++) if (str[i] !== '.') put(x + i, y, +str[i]);
        put(33, 21, 0); put(33, 20, 0);
        // the crown (with gems)
        const crown = ['3.3.3.3.3', '303030303', '300000003', '302020203', '300000003', '333333333'];
        crown.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') put(14 + x, y + 1, +r[x]); });
        // the curly tail
        put(3, 15, 3); put(2, 14, 3); put(2, 13, 3); put(3, 12, 3);
        const b = a.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (b[i]) continue; if ((x > 0 && b[i - 1]) || (x < w - 1 && b[i + 1]) || (y > 0 && b[i - w]) || (y < h - 1 && b[i + w])) a[i] = 4; }
        return { w, h, a };
      }
      const KSPR = {};
      for (const f of ['n', 'mad', 'dizzy', 'hurt']) for (const l of [0, 1]) { const im = kingArt(f, l); KSPR[f + l] = both(im); KSPR[f + l + 'w'] = both(im, FLASH); }
      const KING_FLAT = (() => { const im = kingArt('dizzy', 0), o = { w: im.w, h: im.h, a: new Uint8Array(im.w * im.h) }; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) o.a[(im.h - 1 - y) * im.w + x] = im.a[y * im.w + x]; return both(o); })();

      // ---- coins, keys, chests, doors, signs, treasures, bits
      const COIN = [
        paint(8, 10, [[0, 0, [[2, 0, '3333'], [1, 1, '300013'], [0, 2, '30031113'], [0, 3, '30311113'], [0, 4, '30311113'], [0, 5, '30311113'], [0, 6, '30311123'], [0, 7, '30011223'], [1, 8, '311223'], [2, 9, '3333']]]]),
        paint(8, 10, [[0, 0, [[2, 0, '333'], [1, 1, '30013'], [1, 2, '30313'], [1, 3, '30313'], [1, 4, '30313'], [1, 5, '30313'], [1, 6, '30313'], [1, 7, '30123'], [1, 8, '31123'], [2, 9, '333']]]]),
        paint(8, 10, [[0, 0, [[3, 0, '33'], [3, 1, '33'], [3, 2, '33'], [3, 3, '33'], [3, 4, '33'], [3, 5, '33'], [3, 6, '33'], [3, 7, '33'], [3, 8, '33'], [3, 9, '33']]]]),
      ].map(i => canv(i));
      const COINSEQ = [0, 0, 0, 1, 2, 1];
      const BIGCOIN = [
        canv(paint(16, 16, [[0, 0, [[4, 0, '33333333'], [2, 1, '3300000013'], [1, 2, '300000001113'], [1, 3, '300033331113'], [0, 4, '30003000031113'], [0, 5, '3003000000311113'],
          [0, 6, '3003000033311113'], [0, 7, '3003000003311113'], [0, 8, '3003000003311123'], [0, 9, '3003000003311123'], [0, 10, '3000300033111123'], [1, 11, '30003333111223'], [1, 12, '300011111122 3'.replace(' ', '')], [2, 13, '3311111222 3'.replace(' ', '')], [4, 14, '33333333']]]])),
        canv(paint(16, 16, [[0, 0, [[5, 0, '333333'], [4, 1, '30000013'], [3, 2, '3000001113'], [3, 3, '3003311113'], [3, 4, '3030011113'], [3, 5, '3030001113'], [3, 6, '3030331113'], [3, 7, '3030031113'], [3, 8, '3030031123'], [3, 9, '3030031123'],
          [3, 10, '3003311123'], [3, 11, '3001111223'], [4, 12, '31112223'], [4, 13, '31122233'.slice(0, 7) + '3'], [5, 14, '333333']]]])),
        canv(paint(16, 16, [[0, 0, [[6, 0, '3333'], [6, 1, '3003'], [6, 2, '3003'], [6, 3, '3013'], [6, 4, '3013'], [6, 5, '3013'], [6, 6, '3013'], [6, 7, '3013'], [6, 8, '3013'], [6, 9, '3013'], [6, 10, '3013'], [6, 11, '3113'], [6, 12, '3123'], [6, 13, '3123'], [6, 14, '3333']]]])),
      ];
      const KEY = canv(paint(16, 8, [[0, 0, [[1, 0, '3333'], [0, 1, '300013'], [0, 2, '30330133333333'], [0, 3, '303.31000000003'], [0, 4, '303301111111113'], [0, 5, '300013333131313'], [1, 6, '3333..3.3.3']]]]));
      const CHEST = [
        canv(paint(18, 16, [[0, 0, [[2, 0, '33333333333333'], [1, 1, '3000000000000013'], [0, 2, '300111111111111023'], [0, 3, '301111111111111123'], [0, 4, '301111111111111123'], [0, 5, '333333333333333333'],
          [0, 6, '322223300033222223'], [0, 7, '311113000003111113'], [0, 8, '311113003003111113'], [0, 9, '311113300333111113'], [0, 10, '311111300031111113'],
          [0, 11, '311111333331111113'], [0, 12, '322222222222222223'], [0, 13, '311111111111111113'], [0, 14, '322222222222222223'], [0, 15, '333333333333333333']]]])),
        canv(paint(18, 16, [[0, 0, [[1, 0, '3333333333333333'], [0, 1, '322222222222222223'], [0, 2, '323333333333333323'], [0, 3, '330000000000000033'], [0, 4, '300100010001000103'], [0, 5, '333333333333333333'],
          [0, 6, '322222233322222223'], [0, 7, '311111130311111113'], [0, 8, '311111133311111113'], [0, 9, '311111111111111113'], [0, 10, '311111111111111113'],
          [0, 11, '311111111111111113'], [0, 12, '322222222222222223'], [0, 13, '311111111111111113'], [0, 14, '322222222222222223'], [0, 15, '333333333333333333']]]])),
      ];
      const DOOR = [0, 1].map(open => canv(paint(20, 32, [[0, 0, [
        [5, 0, '3333333333'], [3, 1, '33000000001133'], [2, 2, '3001111111111203'], [1, 3, '300133333333331023'], [1, 4, '3013' + (open ? '3333333333' : '1111111111') + '3123'],
        [0, 5, '3001' + (open ? '3333333333' : '1222222221') + '31023'].slice(0, 20), [0, 6, '3013' + (open ? '3333333333' : '1222222221') + '3123'], [0, 7, '30131' + (open ? '333333333' : '222222221') + '3123'],
        ...Array.from({ length: 22 }, (_, i) => [0, 8 + i, (i === 10 ? '30131' + (open ? '333333333' : '222222033') + '3123' : '30131' + (open ? '333333333' : (i % 6 === 5 ? '111111111' : '222122221')) + '3123')]),
        [0, 30, '33333333333333333333'], [0, 31, '32222222222222222223'],
      ]]])));
      const SIGN = canv(paint(16, 16, [[0, 0, [[1, 0, '33333333333333'], [0, 1, '3000000000000013'], [0, 2, '3033330333033013'], [0, 3, '3000000000000013'], [0, 4, '3033033333033013'], [0, 5, '3000000000000013'],
        [0, 6, '3111111111111123'], [0, 7, '3333333333333333'], [7, 8, '33'], [7, 9, '31'], [7, 10, '31'], [7, 11, '31'], [7, 12, '31'], [7, 13, '31'], [6, 14, '3113'], [5, 15, '333333']]]]));
      const TREASURE_ART = [
        [[3, 1, '3333333333'], [2, 2, '300000000003'], [2, 3, '333333333333'], [3, 4, '3011111113'], [3, 5, '3011111113'], [3, 6, '3013331113'], [3, 7, '3013031113'], [4, 8, '30133113'], [4, 9, '30111113'], [4, 10, '31111123'], [5, 11, '322223'], [5, 12, '333333'], [0, 0, '3'], [1, 1, '3'], [12, 0, '33'], [13, 1, '3']],
        [[5, 1, '333333'], [3, 2, '3300001133'], [2, 3, '300001111113'], [1, 4, '30031131111113'], [1, 5, '30003111311113'], [1, 6, '30111111111123'], [1, 7, '31111111111123'], [1, 8, '31111111111223'], [2, 9, '311111112223'], [3, 10, '3312222233'], [5, 11, '333333'], [7, 0, '33']],
        [[2, 1, '3.33.33.3'], [2, 2, '303303303'], [2, 3, '30030030033'.slice(0, 9)], [2, 4, '300000003'], [1, 5, '33333333333'], [1, 6, '30000000003'], [0, 7, '3011111111113'], [0, 8, '3011133311113'], [0, 9, '3011111111123'], [1, 10, '31111111223'], [2, 11, '322222223'], [3, 12, '3333333']],
        [[6, 0, '33'], [5, 1, '3003'], [4, 2, '300013'], [3, 3, '30001113'], [2, 4, '3000011113'], [2, 5, '3000111123'], [2, 6, '3001111223'], [2, 7, '3011112223'], [3, 8, '30112223'], [4, 9, '311223'], [5, 10, '3123'], [6, 11, '33'], [0, 3, '3'], [12, 6, '3'], [13, 2, '3']],
        [[6, 0, '333'], [5, 1, '30003'], [3, 2, '333333333'], [2, 3, '30000000013'], [0, 4, '33300000001133'], [0, 5, '3.300000001113'], [0, 6, '3.311111111123'], [1, 7, '33111111111233'], [3, 8, '31111112223'], [3, 9, '32222222223'], [4, 10, '333333333']],
        [[1, 2, '333333333333'], [0, 3, '30000000000013'], [0, 4, '30333033303313'], [0, 5, '30000000000013'], [0, 6, '31111111111113'], [0, 7, '31111111113313'], [0, 8, '31111111113013'], [0, 9, '31111111111113'], [0, 10, '32222222222223'], [1, 11, '333333333333'], [2, 12, '33'], [11, 12, '33'], [3, 0, '3.3'], [8, 0, '3.3'], [4, 1, '3'], [9, 1, '3']],
      ].map(p => canv(paint(15, 13, [[0, 0, p]])));
      const MONEYBAG = canv(paint(22, 22, [[0, 0, [[8, 0, '333333'], [7, 1, '30000003'], [8, 2, '3011113'], [9, 3, '33333'], [7, 4, '330000033'], [5, 5, '3300000001133'], [4, 6, '330000000011133'], [3, 7, '30000033333111113'.slice(0, 15)],
        [2, 8, '3000003300031111 3'.replace(' ', '')], [2, 9, '300000300000311113'], [1, 10, '30000000333000111113'.slice(0, 19)], [1, 11, '30000000000300111123'.slice(0, 19)], [1, 12, '3000000300030111112 3'.replace(' ', '').slice(0, 19)], [1, 13, '3000000033301111122 3'.replace(' ', '').slice(0, 19)],
        [1, 14, '3001111111111111223'], [1, 15, '3011111111111112223'], [2, 16, '31111111111122223'], [3, 17, '322222222222223'], [4, 18, '3333333333333']]]]));
      const STAR = canv(paint(7, 7, [[0, 0, [[3, 0, '3'], [2, 1, '303'], [0, 2, '3300033'], [1, 3, '30003'], [1, 4, '30303'], [0, 5, '33.33'], [0, 6, '3...3']]]]));
      const SPARK = [canv(paint(5, 5, [[0, 0, [[2, 0, '3'], [2, 1, '0'], [0, 2, '30003'], [2, 3, '0'], [2, 4, '3']]]])), canv(paint(5, 5, [[0, 0, [[0, 0, '3...3'], [1, 1, '0.0'], [2, 2, '0'], [1, 3, '0.0'], [0, 4, '3...3']]]]))];
      const PUFFS = [canv(paint(6, 6, [[0, 0, [[1, 0, '3333'], [0, 1, '300003'], [0, 2, '300013'], [0, 3, '301113'], [0, 4, '311113'], [1, 5, '3333']]]])), canv(paint(4, 4, [[0, 0, [[0, 0, '3333'], [0, 1, '3013'], [0, 2, '3113'], [0, 3, '3333']]]])), canv(paint(2, 2, [[0, 0, [[0, 0, '33'], [0, 1, '33']]]]))];
      const SMOKE = [canv(paint(8, 8, [[0, 0, [[2, 0, '3333'], [1, 1, '322223'], [0, 2, '32222223'], [0, 3, '32222223'], [0, 4, '32222223'], [0, 5, '32222223'], [1, 6, '322223'], [2, 7, '3333']]]])), canv(paint(6, 6, [[0, 0, [[1, 0, '3333'], [0, 1, '322223'], [0, 2, '322223'], [0, 3, '322223'], [0, 4, '322223'], [1, 5, '3333']]]]))];
      const CHUNK = canv(paint(6, 6, [[0, 0, [[0, 0, '33333'], [0, 1, '300113'], [0, 2, '301123'], [0, 3, '311223'], [0, 4, '322223'], [1, 5, '33333']]]]));
      const DROP = canv(paint(4, 6, [[0, 0, [[1, 0, '33'], [1, 1, '33'], [0, 2, '3113'], [0, 3, '3013'], [0, 4, '3113'], [1, 5, '33']]]]));
      const HUDCOIN = canv(paint(7, 8, [[0, 0, [[1, 0, '00000'], [0, 1, '0011100'], [0, 2, '0101110'], [0, 3, '0101110'], [0, 4, '0101110'], [0, 5, '0101110'], [0, 6, '0011100'], [1, 7, '00000']]]]), null, [0, 1, 2, 3]);
      const HUDKEY = canv(paint(10, 6, [[0, 0, [[0, 0, '000'], [0, 1, '0.0000000'], [0, 2, '0.0000000'], [0, 3, '000..0.0']]]]));
      const HUDCHEST = canv(paint(9, 7, [[0, 0, [[0, 0, '000000000'], [0, 1, '011111110'], [0, 2, '000000000'], [0, 3, '011101110'], [0, 4, '011101110'], [0, 5, '011111110'], [0, 6, '000000000']]]]));
      const BUBBLE = canv(paint(11, 11, [[0, 0, [[2, 0, '3333333'], [1, 1, '300000003'], [0, 2, '30000300003'], [0, 3, '30000300003'], [0, 4, '30000300003'], [0, 5, '30000300003'], [0, 6, '30000000003'], [0, 7, '30000300003'], [1, 8, '300000003'], [2, 9, '33303333'], [4, 10, '33']]]]));
      const UPARROW = canv(paint(11, 11, [[0, 0, [[2, 0, '3333333'], [1, 1, '300030003'], [0, 2, '30003330003'], [0, 3, '30033333003'], [0, 4, '30333333303'], [0, 5, '30003330003'], [0, 6, '30003330003'], [0, 7, '30003330003'], [1, 8, '300000003'], [2, 9, '33303333'], [4, 10, '33']]]]));

      // the Grabbo cells
      const GSPR = {};
      for (const k in GPOSE) { const im = grabPose(GPOSE[k]); GSPR[k] = both(im); if (k === 'stand' || k === 'blink') GSPR[k === 'stand' ? 'char' : 'char2'] = both(im, [2, 3, 3, 3]); if (k === 'stand') GSPR.flat = both(squash(im)); }
      GSPR.back = both(G_BACK);
      GSPR.puff = both(puffArt());
      const FLAMES = FLAME.map(f => canv(f));

      // ============================================================ tiles, by theme
      const TID = { '.': 0, '#': 1, '=': 2, H: 3, B: 4, S: 5, F: 6, '?': 7, '^': 9, T: 10, '~': 11, w: 12, '"': 13, '|': 14, Y: 15, '%': 16 };
      const SOLID = new Uint8Array(32); for (const t of [1, 4, 5, 6, 7, 8, 16, 17]) SOLID[t] = 1;
      const THEMES = {
        beach: { sky: 0 }, cliffs: { sky: 0 }, forest: { sky: 0 }, cave: { sky: 2 }, ship: { sky: 0 }, castle: { sky: 1 },
      };
      // hand-drawn 16x16 ground: [top, body, body2] per theme
      const GTILE = {
        beach: [['3333333333333333', '0000000000000000', '0000010000000000', '0100000000001000', '0000000100000000', '1001001110100110', '1111111111111111', '1111121111111111', '1111111111111211', '1111111111111111', '1121111111111111', '1111111111211111', '1111111111111111', '1111111211111111', '1111111111111112', '1111111111111111'], ['1111111111111111', '1111111112111111', '1211111111111111', '1111111111111111', '1111111111111121', '1111121111111111', '1111111111111111', '1111111111211111', '1111111111111111', '1111111111111111', '1121111111111111', '1111111111111111', '1111111111112111', '1111111111111111', '1111112111111111', '1111111111111111'], ['1111111111111111', '1111111111111111', '1111111111111111', '1111112111111111', '1111111111111111', '1111111111111111', '1111111111133111', '1111111111300311', '1111111113001031', '1112111113010131', '1111111111333311', '1111111111111111', '1111111111111121', '1111111111111111', '1121111111111111', '1111111111111111']],
        cliffs: [['3333333333333333', '1101110111011101', '1111111111111111', '3131313113131313', '2333232333323323', '2222222232222222', '1112222322222111', '1122222322221122', '1222222322211222', '2222222322112222', '3333333233322223', '2111111132222222', '2112222223222222', '2122222223222222', '2222222223222222', '3333333333233333'], ['2222222322222222', '1112222322222111', '1122222322221122', '1222222322211222', '2222222322112222', '3333333233322223', '2111111132222222', '2112222223222222', '2122222223222222', '2222222223222222', '3333333333233333', '2222321111111132', '2222312222222132', '2222312222222232', '2222322222222232', '3333333333333333']],
        forest: [['3333333333333333', '1011101110111011', '1111111111111111', '1131111311131111', '3323333233323333', '2222232222222222', '2222222222223222', '2232222222222222', '2222222233322222', '2222222311132222', '2222222311132222', '2222222233322232', '2322222222222222', '2222222222222222', '2222223222222222', '2222222222222322'], ['2222222222222222', '2222223222222222', '2222222222222322', '2332222222222222', '3113222222222222', '3113222232222222', '2332222222222222', '2222222222222222', '2222232222222222', '2222222333222222', '2222223111322222', '2232223111322222', '2222222333222232', '2222222222222222', '2223222222223222', '2222222222222222']],
        cave: [['3333333333333333', '0011000100110001', '1111111111111111', '2112221111222112', '3223332222333223', '2332223333222232', '2222231111322222', '2222311222232222', '3333112222223333', '1113122222223111', '2221322222232222', '2222233333322222', '2222222322222222', '2233332232223333', '2311113223231112', '3112222322311222'], ['2222223333222222', '2222231111322222', '2222311222232222', '3333112222223333', '1113122222223111', '2221322222232222', '2222233333322222', '2222222322222222', '2233332232223333', '2311113223231112', '3112222322311222', '3122222232312222', '3122222232312222', '2322222322231222', '2233333222223322', '2222223222222233']],
        ship: [['3333333333333333', '0000000000000000', '1111111131111111', '1121111131111211', '2222222232222222', '3333333333333333', '1111311111111111', '1111311111121111', '2222322222222222', '3333333333333333', '1111111111113111', '1211111111113111', '2222222222223222', '3333333333333333', '1111111311111111', '1111111311111111']],
      };
      const tileCache = {};
      function tileset(theme) {
        if (tileCache[theme]) return tileCache[theme];
        const T = {}, mk = fn => { const c = mkc(16, 16), x = c.getContext('2d'); fn((px, py, col, w, h) => { x.fillStyle = P[col]; x.fillRect(px, py, w || 1, h || 1); }, x); return c; };
        // ground: body texture + top cap + side edges (16 combinations of exposed sides)
        const GT = GTILE[theme];
        const body = (p, v) => {
          if (GT) { const d = GT[Math.min(GT.length - 1, 1 + (v && GT[2] ? 1 : 0))] || GT[0]; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, +d[y][x]); return; }
          for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const row = y >> 2, bx = (x + (row % 2) * 4) % 8; p(x, y, y % 4 === 3 || bx === 7 ? 2 : y % 4 === 0 || bx === 0 ? 0 : 1); }
        };
        const capTop = p => {
          if (GT) { const d = GT[0]; for (let y = 0; y < (theme === 'ship' ? 2 : 16); y++) for (let x = 0; x < 16; x++) p(x, y, +d[y][x]); return; }
          for (let x = 0; x < 16; x++) { p(x, 0, 3); p(x, 1, 0); p(x, 2, 1); p(x, 3, 3); }
        };
        T.ground = [];
        for (let m = 0; m < 16; m++) T.ground.push([0, 1].map(v => mk(p => {
          body(p, v); if (m & 1) capTop(p);
          if (m & 2) { for (let y = 0; y < 16; y++) { p(0, y, 3); if (!(m & 1) || y > 1) p(1, y, theme === 'castle' ? 1 : 2); } }
          if (m & 4) { for (let y = 0; y < 16; y++) { p(15, y, 3); if (!(m & 1) || y > 1) p(14, y, 2); } }
          if (m & 8) { for (let x = 0; x < 16; x++) { p(x, 15, 3); p(x, 14, 2); } }
          if ((m & 3) === 3) { p(0, 0, 0 - 0); p(0, 0, 3); p(1, 0, 3); p(0, 1, 3); }
        })));
        const bevel = (p, f, hi, lo) => { p(0, 0, 3, 16, 16); p(1, 1, f, 14, 14); p(1, 1, hi, 14, 1); p(1, 1, hi, 1, 14); p(1, 14, lo, 14, 1); p(14, 1, lo, 1, 14); };
        T.block = mk(p => { bevel(p, 1, 0, 2); p(4, 3, 3, 1, 3); p(5, 6, 3, 2, 1); p(7, 7, 3, 1, 2); p(10, 9, 3, 1, 3); p(9, 12, 3, 2, 1); p(3, 10, 2, 2, 1); p(11, 4, 2, 1, 1); });
        T.stomp = mk(p => { bevel(p, 2, 1, 3); p(2, 2, 1, 1, 1); for (let i = 0; i < 4; i++) { p(6, 3 + i, 0, 4, 1); } p(4, 7, 0, 8, 1); p(5, 8, 0, 6, 1); p(6, 9, 0, 4, 1); p(7, 10, 0, 2, 1); p(5, 12, 3, 2, 1); p(9, 13, 3, 3, 1); p(3, 13, 3, 1, 1); });
        T.fire = mk(p => { bevel(p, 1, 0, 2); const fl = ['....3....', '...303...', '..3003.3.', '..300303.', '.3001003.', '.3011103.', '30112110 3'.replace(' ', ''), '30122210'.padEnd(9, '3'), '.3022203.', '..33333..']; fl.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') p(3 + x, 3 + y, +r[x]); }); });
        T.coinblk = [0, 1].map(f => mk(p => { bevel(p, 0, 0, 2); p(1, 1, 3, 1, 1); p(14, 1, 3, 1, 1); p(1, 14, 3, 1, 1); p(14, 14, 3, 1, 1); p(2, 2, f ? 0 : 1, 1, 1); const c = ['.333.', '30013', '30113', '30113', '30113', '30123', '31123', '.333.']; c.forEach((r, y) => { for (let x = 0; x < 5; x++) if (r[x] !== '.') p(5 + x + (f ? 1 : 0), 4 + y, +r[x]); }); }));
        T.used = mk(p => { bevel(p, 2, 1, 3); p(3, 3, 3, 1, 1); p(12, 3, 3, 1, 1); p(3, 12, 3, 1, 1); p(12, 12, 3, 1, 1); });
        T.hard = mk(p => { bevel(p, 2, 1, 3); p(3, 3, 1, 10, 1); p(3, 3, 1, 1, 10); p(4, 12, 3, 9, 1); p(12, 4, 3, 1, 9); p(6, 6, 3, 4, 4); p(7, 7, 1, 2, 2); });
        T.plank = mk(p => {
          if (theme === 'cave' || theme === 'castle') { p(0, 0, 3, 16, 6); p(0, 1, 0, 16, 1); p(0, 2, 1, 16, 3); for (let x = 2; x < 16; x += 5) p(x, 2, 2, 1, 3); p(2, 6, 3, 3, 2); p(11, 6, 3, 3, 2); p(3, 6, 2, 1, 1); p(12, 6, 2, 1, 1); }
          else if (theme === 'forest') { p(0, 0, 3, 16, 6); p(0, 1, 1, 16, 1); p(0, 2, 2, 16, 3); for (let x = 1; x < 16; x += 4) p(x, 3, 1, 2, 1); p(5, 6, 3, 2, 3); p(4, 6, 2, 1, 2); }
          else { p(0, 0, 3, 16, 6); p(0, 1, 0, 16, 1); p(0, 2, 1, 16, 3); p(7, 1, 3, 1, 5); p(15, 1, 3, 1, 5); p(3, 3, 3, 1, 1); p(11, 3, 3, 1, 1); p(2, 6, 3, 2, 3); p(12, 6, 3, 2, 3); }
        });
        T.ladder = mk(p => { const rope = theme === 'ship' || theme === 'beach' || theme === 'cliffs'; for (let y = 0; y < 16; y++) { p(2, y, 3, 2, 1); p(12, y, 3, 2, 1); if (rope && y % 4 === 0) { p(2, y, 1); p(13, y, 1); } } for (let y = 2; y < 16; y += 5) { p(2, y, 3, 12, 3); p(3, y + 1, rope ? 1 : 0, 10, 1); } });
        T.spike = mk(p => { for (let i = 0; i < 4; i++) { const x = i * 4; for (let y = 0; y < 8; y++) { const w = Math.floor(y / 2) + 1; p(x + 2 - Math.floor(w / 2), 8 + y, 3, w + (w % 2 ? 0 : 0), 1); if (y > 1) p(x + 2 - Math.floor(w / 2) + 1, 8 + y, 0, 1, 1); } } p(0, 15, 3, 16, 1); });
        T.torch = [0, 1].map(f => mk((p, x) => { p(6, 10, 3, 4, 6); p(7, 11, 1, 2, 4); p(4, 9, 3, 8, 2); p(5, 9, 2, 6, 1); x.drawImage(FLAMES[f], 2, -3); }));
        T.water = [0, 1, 2, 3].map(f => mk(p => { for (let x = 0; x < 16; x++) { const y = 2 + Math.round(Math.sin((x + f * 4) / 16 * Math.PI * 2) * 1.5); p(x, y, 3); p(x, y + 1, 0); for (let yy = y + 2; yy < 16; yy++) p(x, yy, (x + yy + f) % 4 === 0 ? 2 : 1); } }));
        T.deep = [0, 1].map(f => mk(p => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, (x * 3 + y * 5 + f * 8) % 13 === 0 ? 1 : (x + y) % 2 ? 2 : 1); }));
        T.deco = mk(p => {
          if (theme === 'beach') { const s = ['....333.....', '...30003....', '..3001003...', '.300101003..', '.301010103..', '.333333333..']; s.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') p(2 + x, 10 + y, +r[x]); }); }
          else if (theme === 'forest' || theme === 'cliffs') { const s = ['...333....', '..30003...', '.3000003..', '.3333333..', '...323....', '...323....', '...333....']; s.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') p(3 + x, 9 + y, +r[x]); }); }
          else if (theme === 'cave') { const s = ['.....3....', '....303...', '...30013..', '..300113..', '..301123..', '.3011223..', '.3333333..']; s.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') p(3 + x, 9 + y, +r[x]); }); }
          else if (theme === 'ship') { const s = ['..333333..', '.32222223.', '3211111123', '3222222223', '.32222223.', '..333333..']; s.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') p(3 + x, 10 + y, +r[x]); }); }
          else { const s = ['...3...', '..303..', '..303..', '.33333.', '.30003.', '.30003.', '.30003.', '3333333']; s.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') p(4 + x, 8 + y, +r[x]); }); }
        });
        T.trunk = mk(p => {
          if (theme === 'ship') { p(5, 0, 3, 6, 16); p(6, 0, 1, 4, 16); p(6, 0, 0, 1, 16); for (let y = 3; y < 16; y += 6) p(5, y, 3, 6, 1); }
          else if (theme === 'castle') { p(3, 0, 3, 10, 16); p(4, 0, 2, 8, 16); p(5, 0, 1, 2, 16); }
          else if (theme === 'cave') { p(6, 0, 3, 4, 16); p(7, 0, 2, 2, 16); }
          else for (let y = 0; y < 16; y++) { const o = theme === 'beach' ? Math.round(Math.sin(y / 5) * 1) : 0; p(5 + o, y, 3, 6, 1); p(6 + o, y, y % 4 === 0 ? 3 : 1, 4, 1); p(7 + o, y, y % 4 === 0 ? 3 : 0, 1, 1); }
        });
        tileCache[theme] = T; return T;
      }
      // a palm / tree top (drawn over the tiles round a 'Y')
      // palm and tree crowns: drawn with code, then outlined
      function outlined(w, h, fn) {
        const a = new Uint8Array(w * h), put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) a[y * w + x] = c + 1; };
        fn(put); const b = a.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (b[i]) continue; if ((x > 0 && b[i - 1]) || (x < w - 1 && b[i + 1]) || (y > 0 && b[i - w]) || (y < h - 1 && b[i + w])) a[i] = 4; }
        return canv({ w, h, a });
      }
      const PALMTOP = outlined(48, 28, put => {
        const cx = 24, cy = 10;
        const frond = (dir, len, lift, droop) => {
          for (let t = 0; t <= len; t += 0.5) {
            const x = cx + dir * t, y = cy - lift * t + droop * t * t / len, th = Math.max(1, 3.2 * (1 - t / len) + 0.8);
            for (let k = 0; k < th; k++) put(x, y + k, k === 0 ? 0 : 1);
            if ((t | 0) % 2 === 0 && t > 3) { put(x, y + th, 1); put(x, y + th + 1, 2); }
          }
        };
        frond(-1, 21, 0.45, 13); frond(1, 21, 0.45, 13); frond(-1, 15, 0.9, 12); frond(1, 15, 0.9, 12); frond(-1, 10, -0.2, 10); frond(1, 10, -0.2, 10);
        for (const [x, y] of [[cx - 3, cy + 3], [cx + 2, cy + 4], [cx - 1, cy + 6]]) for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= 4) put(x + xx, y + yy, xx + yy < -1 ? 1 : 2);
      });
      const TREETOP = outlined(56, 40, put => {
        const blobs = [[28, 20, 16], [14, 24, 10], [42, 24, 11], [21, 12, 10], [36, 11, 10], [28, 7, 8]];
        for (let y = 0; y < 40; y++) for (let x = 0; x < 56; x++) {
          let inB = -1; for (let i = 0; i < blobs.length; i++) { const [bx, by, r] = blobs[i]; if (Math.hypot(x - bx, y - by) < r) inB = i; }
          if (inB < 0) continue;
          const [bx, by, r] = blobs[inB], lx = (x - bx + r * 0.45) / r, ly = (y - by + r * 0.45) / r, lit = lx * lx + ly * ly;
          const rim = Math.hypot(x - bx, y - by) > r - 1.3;
          put(x, y, rim && y > by ? 3 : lit < 0.25 ? 0 : lit < 0.7 ? 1 : lit < 1.1 ? ((x + y) % 2 ? 1 : 2) : 2);
        }
      });
      // ============================================================ backgrounds: bands that scroll at their own speeds (line scroll)
      const bgCache = {};
      function backdrop(theme) {
        if (bgCache[theme]) return bgCache[theme];
        const bands = [], band = (y, h, fx, fn) => { const c = mkc(256, h), x = c.getContext('2d'); fn((px, py, col, w, hh) => { x.fillStyle = P[col]; x.fillRect(px, py, w || 1, hh || 1); }, x); bands.push({ c, y, h, fx }); };
        const cloud = (p, cx, cy, s) => {
          const blobs = [[0, 0, 7], [-8, 3, 5], [8, 2, 6], [15, 4, 4], [-14, 5, 3]].map(b => [cx + b[0] * s, cy + b[1] * s, b[2] * s]);
          for (let y = -10; y < 12; y++) for (let x = -24; x < 26; x++) {
            let inside = false, edge = false; for (const [bx, by, r] of blobs) { const d = Math.hypot(cx + x - bx, cy + y - by); if (d < r) inside = true; else if (d < r + 1) edge = true; }
            if (cy + y > cy + 6 * s) { if (inside) edge = true; inside = false; }
            const X = (cx + x + 256) % 256; if (inside) p(X, cy + y, (y > 3 * s && (x + y) % 2) ? 1 : 0); else if (edge) p(X, cy + y, 1);
          }
        };
        const hills = (p, base, amp, per, col, dither, seedv, h) => { for (let x = 0; x < 256; x++) { const top = Math.round(base - amp * (0.6 * Math.sin((x + seedv) / per * Math.PI * 2) + 0.4 * Math.sin((x * 2.3 + seedv) / per * Math.PI * 2))); for (let y = Math.max(0, top); y < h; y++) p(x, y, y === top ? 3 : (dither && (x + y) % 2) ? col + 1 : col); } };
        const sea = (p, y0, h, isle) => { // a calm sea: a dark horizon, rows of little wave glints, an island far away
          for (let y = y0; y < h; y++) for (let x = 0; x < 256; x++) p(x, y, y === y0 ? 2 : 1);
          for (let y = y0 + 3; y < h; y += 4) { const k = (y - y0) >> 2, step = 9 + k * 3; for (let x = ((y * 7) % step); x < 256; x += step) p(x, y, 0, 2 + (k >> 1), 1); }
          if (isle) { for (let x = 0; x < 70; x++) { const t = Math.round(10 * Math.sin(x / 70 * Math.PI) + 3 * Math.sin(x / 9)); for (let y = -t; y < 0; y++) p(150 + x, y0 + y, y === -t ? 3 : 2); }
            p(170, y0 - 21, 3, 3, 9); p(171, y0 - 19, 0, 1, 6); p(169, y0 - 23, 3, 5, 2); p(170, y0 - 22, 0, 3, 1);
            for (let y = 0; y < 8; y++) p(64 - (y >> 1), y0 - 10 + y, 0, (y >> 1) + 1, 1); p(64, y0 - 11, 3, 1, 11); p(58, y0, 3, 10, 1); p(59, y0 + 1, 3, 8, 1); }
        };
        if (theme === 'beach' || theme === 'ship') {
          band(0, 56, 0.06, p => { cloud(p, 40, 20, 1); cloud(p, 150, 32, 0.75); cloud(p, 215, 12, 1.1); });
          band(46, 90, 0.16, p => sea(p, 24, 90, true));
        } else if (theme === 'cliffs') {
          band(0, 50, 0.06, p => { cloud(p, 60, 16, 1); cloud(p, 180, 26, 0.9); });
          band(30, 80, 0.15, p => { // far mountains with snowy tops
            for (let x = 0; x < 256; x++) { const top = Math.round(34 - 22 * Math.abs(Math.sin((x + 20) / 256 * Math.PI * 3)) - 4 * Math.sin(x / 7)); for (let y = Math.max(0, top); y < 80; y++) p(x, y, y === top ? 2 : y < top + 5 + ((x * 3) % 4) ? 0 : 1); }
          });
          band(66, 90, 0.32, p => { // nearer cliffs: blocky rock faces
            for (let x = 0; x < 256; x++) { const top = 14 + Math.round(10 * Math.sin(x / 40) + 6 * Math.sin(x / 13)) - ((x >> 4) % 3) * 2; for (let y = Math.max(0, top); y < 90; y++) { const edge = y === top, crack = (x % 16 === 0 && y > top + 2) || ((y - top) % 12 === 0 && y > top); p(x, y, edge ? 3 : crack ? 3 : (x % 16 < 3 && y > top + 1) ? 1 : 2); } }
          });
        } else if (theme === 'forest') {
          band(0, 150, 0.08, p => { // far woods: pale trunks under a soft canopy
            for (let x = 0; x < 256; x++) { const h = 26 + Math.round(6 * Math.sin(x / 11) + 4 * Math.sin(x / 5)); for (let y = 0; y < h; y++) p(x, y, y === h - 1 ? 2 : 1); }
            for (let t = 0; t < 8; t++) { const x0 = t * 32 + 10 + (t % 3) * 4; for (let y = 20; y < 150; y++) { p(x0, y, 1, 5, 1); if (y % 9 === 0) p(x0 + 1, y, 0, 2, 1); } }
          });
          band(0, 150, 0.25, p => { // big trunks, with bark and a lit edge
            for (let t = 0; t < 3; t++) { const x0 = t * 86 + 30, w = 14; for (let y = 0; y < 150; y++) for (let x = 0; x < w; x++) p(x0 + x, y, x === 0 || x === w - 1 ? 3 : x < 3 ? 1 : ((x * 5 + (y >> 2) * 3) % 11 === 0 || (y % 13 === 0 && x > 4 && x < 10)) ? 3 : 2); }
            for (let x = 0; x < 256; x++) { const h = 16 + Math.round(5 * Math.sin(x / 8) + 3 * Math.sin(x / 3.3)); for (let y = 0; y < h; y++) p(x, y, y === h - 1 ? 3 : (x * 7 + y * 3) % 9 === 0 ? 1 : 2); }
          });
        } else if (theme === 'cave') {
          band(0, 140, 0.15, p => { for (let x = 0; x < 256; x++) for (let y = 0; y < 140; y++) if ((x * 7 + y * 3) % 29 === 0) p(x, y, 3); for (let i = 0; i < 9; i++) { const x0 = i * 29 + 7, h = 18 + (i * 37) % 30; for (let y = 0; y < h; y++) { const w = Math.max(1, Math.round((1 - y / h) * 7)); p(x0 - w, y, 3, w * 2, 1); } } });
          band(30, 120, 0.3, p => { for (let i = 0; i < 6; i++) { const x0 = i * 43 + 15; for (let y = 0; y < 120; y++) for (let x = 0; x < 12; x++) if (((x + y) % 2 === 0 || x > 7) && Math.abs(x - 6) < 6 - Math.abs(Math.sin(y / 9)) * 2) p(x0 + x, y, 3); } for (let i = 0; i < 12; i++) { const x0 = (i * 53) % 256, y0 = 20 + (i * 31) % 90; p(x0, y0, 1); p(x0 - 1, y0 + 1, 1, 3, 1); p(x0, y0 + 2, 0); } });
        } else {
          band(0, 160, 0.25, p => {
            for (let y = 0; y < 160; y++) for (let x = 0; x < 256; x++) { const row = y >> 3, bx = (x + (row % 2) * 8) % 16; p(x, y, y % 8 === 7 || bx === 15 ? 2 : 1); }
            for (let i = 0; i < 4; i++) { const x0 = i * 64 + 22; for (let y = 34; y < 74; y++) for (let x = 0; x < 20; x++) { const d = y < 44 ? Math.hypot(x - 9.5, y - 44) : 0; if (d > 10) continue; p(x0 + x, y, d > 9 || x === 0 || x === 19 || y === 73 ? 3 : 3); } p(x0 + 12, 42, 0, 3, 3); p(x0 + 11, 43, 0, 1, 1); p(x0 + 4, 60, 1, 1, 1); p(x0 + 8, 52, 1, 1, 1);
              for (let y = 80; y < 112; y++) { const w = y < 104 ? 10 : 10 - (y - 104); p(x0 + 10 - w / 2, y, y === 80 ? 3 : 2, w, 1); p(x0 + 10 - w / 2, y, 3, 1, 1); p(x0 + 10 + w / 2 - 1, y, 3, 1, 1); } p(x0 + 7, 88, 0, 6, 6); p(x0 + 8, 89, 1, 4, 4); }
          });
        }
        return (bgCache[theme] = bands);
      }

      // ============================================================ save, score, reports
      const blank = () => ({ name: 'JACK', lv: Array.from({ length: 7 }, () => ({ d: 0, c: 0, tr: 0 })), at: 0, boss: 0, play: 0, hi: null });
      let S = K.load(); const hadSave = !!(S && S.lv);
      if (!hadSave) S = null;
      let HI = (S && S.hi) || MATES.map(([n, s]) => ({ n, s, m: 1 }));
      const score = st => st ? st.lv.reduce((a, l) => a + l.c + (l.tr ? 500 : 0) + (l.d ? 150 : 0), 0) + (st.boss ? 3000 : 0) : 0;
      const nTreasure = st => st.lv.slice(0, 6).filter(l => l.tr).length;
      function persist() { if (!S) return; S.hi = HI; K.save(S); }
      let lastRep = { t: 0, sc: 0 };
      function report() { // keep the server up to date at milestones, spaced so it can believe us
        if (!S) return; const sc = score(S); if (sc <= lastRep.sc) return;
        if (K.t - lastRep.t < Math.max(32, sc / 250 + 8)) return;
        K.over(sc, { keep: true }); lastRep = { t: K.t, sc };
      }
      const safeAt = sc => lastRep.t + sc / 250 + 1.5; // when a final score will be believed

      // ============================================================ sound effects
      const sfx = {
        jump() { K.sfx.tone(330, 0.12, 'square', 0.07, 0, 700); },
        land() { K.sfx.noise(0.05, 0.08, 700); },
        coin() { K.sfx.tone(988, 0.05, 'square', 0.06); K.sfx.tone(1319, 0.18, 'square', 0.06, 0.05); },
        big() { K.sfx.seq([[84, 0.25], [88, 0.25], [91, 0.25], [96, 0.75]], { bpm: 500, vol: 0.07 }); },
        barge() { K.sfx.noise(0.18, 0.12, 900, 0, 'lowpass', 300); K.sfx.tone(160, 0.12, 'square', 0.07, 0, 90); },
        smash() { K.sfx.noise(0.22, 0.2, 2200, 0, 'lowpass', 300); K.sfx.tone(140, 0.14, 'square', 0.08, 0, 50); },
        bonk() { K.sfx.tone(110, 0.16, 'square', 0.12, 0, 55); K.sfx.noise(0.08, 0.12, 400); },
        stompGo() { K.sfx.tone(900, 0.12, 'square', 0.06, 0, 300); },
        stomp() { K.sfx.noise(0.35, 0.22, 600, 0, 'lowpass', 80); K.sfx.tone(90, 0.25, 'square', 0.1, 0, 40); },
        stun() { K.sfx.tone(700, 0.1, 'square', 0.08, 0, 250); },
        bowl() { K.sfx.tone(300, 0.25, 'square', 0.07, 0, 1200); },
        pop() { K.sfx.noise(0.08, 0.1, 3000, 0, 'highpass'); K.sfx.tone(1200, 0.06, 'square', 0.05); },
        hurt() { K.sfx.tone(440, 0.25, 'square', 0.09, 0, 110); K.sfx.seq([[0, 0.5], [93, 0.25], [88, 0.25], [93, 0.25]], { bpm: 600, vol: 0.05 }); },
        puff() { K.sfx.tone(180, 0.5, 'triangle', 0.14, 0, 800); },
        fire() { K.sfx.noise(0.6, 0.12, 3000, 0, 'bandpass', 900); K.sfx.tone(600, 0.3, 'square', 0.06, 0, 1400); },
        flat() { K.sfx.tone(500, 0.18, 'square', 0.09, 0, 80); K.sfx.tone(140, 0.3, 'triangle', 0.12, 0.12, 240); },
        unflat() { K.sfx.tone(200, 0.15, 'square', 0.07, 0, 700); },
        splash() { K.sfx.noise(0.4, 0.18, 1600, 0, 'bandpass', 400); },
        key() { K.sfx.seq([[79, 0.25], [83, 0.25], [86, 0.25], [91, 0.75]], { bpm: 420, vol: 0.08 }); },
        locked() { K.sfx.tone(196, 0.1, 'square', 0.08); K.sfx.tone(185, 0.2, 'square', 0.08, 0.11); },
        treasure() { K.sfx.seq([[67, 0.25], [72, 0.25], [76, 0.25], [79, 0.5], [76, 0.25], [79, 0.25], [84, 1.5]], { bpm: 300, vol: 0.09 }); K.sfx.seq([[48, 1], [55, 1], [60, 2]], { bpm: 300, vol: 0.09, wave: 'triangle' }); },
        clear() { K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.5], [79, 0.25], [84, 1]], { bpm: 300, vol: 0.09 }); },
        door() { K.sfx.tone(200, 0.15, 'square', 0.07, 0, 300); K.sfx.tone(300, 0.2, 'square', 0.07, 0.15, 150); },
        menu() { K.sfx.tone(880, 0.04, 'square', 0.06); },
        pick() { K.sfx.tone(1320, 0.08, 'square', 0.07); },
        hup() { K.sfx.tone(260, 0.08, 'square', 0.07, 0, 520); },
        throw() { K.sfx.noise(0.12, 0.1, 2000, 0, 'bandpass', 600); K.sfx.tone(500, 0.1, 'square', 0.06, 0, 200); },
        oink() { K.sfx.tone(180, 0.18, 'sawtooth', 0.1, 0, 120); K.sfx.tone(160, 0.25, 'sawtooth', 0.1, 0.2, 90); },
        quake() { K.sfx.noise(0.5, 0.25, 400, 0, 'lowpass', 60); K.sfx.tone(60, 0.4, 'square', 0.1, 0, 35); },
      };

      // ============================================================ fades (Game Boy style: dither to the lightest shade)
      const DPAT = [];
      for (let l = 1; l < 4; l++) { const c = mkc(4, 4), x = c.getContext('2d'), B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]; x.fillStyle = P[0]; for (let y = 0; y < 4; y++) for (let i = 0; i < 4; i++) if (B[y][i] < l * 4) x.fillRect(i, y, 1, 1); DPAT[l] = c; }
      const fd = { t: 0, fn: null };
      function fadeTo(fn) { if (fd.fn || fd.t) return; fd.fn = fn; fd.t = 1; }
      function fadeStep() { if (!fd.t) return false; fd.t++; if (fd.t === 10 && fd.fn) { const f = fd.fn; fd.fn = null; f(); } if (fd.t >= 19) { fd.t = 0; } return true; }
      function fadeDraw() {
        if (!fd.t) return; const l = fd.t <= 9 ? Math.ceil(fd.t / 2.25) : Math.ceil((19 - fd.t) / 2.25); if (l <= 0) return;
        if (l >= 4) { rect(0, 0, W, H, 0); return; }
        const c = DPAT[l]; for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) g.drawImage(c, x, y);
      }

      // ============================================================ the level
      let LV = null, mode = 'title', paused = false, pauseSel = 0;
      const pl = { x: 0, y: 0, vx: 0, vy: 0, face: 1, st: 'n', t: 0, ground: false, coyote: 0, inv: 0, carry: null, dash: false, timer: 0, anim: 0, safeX: 0, safeY: 0, cool: 0, sub: 0, air: 0, ladderX: 0, stompT: 0, bargeT: 0, h: 22 };
      const HW = 6;
      const cam = { x: 0, y: 0, look: 0, shake: 0 };
      let ents = [], coins = [], parts = [], pops = [];
      let banner = { s: '', t: 0, big: false }, sign = -1, levelCoins = 0, gotKey = false, gotTr = false, chestOpen = false, levelT = 0, levelIdx = 0, boss = null, ending = null;
      const PMAX = 80; for (let i = 0; i < PMAX; i++) parts.push({ on: false });
      function part(kind, x, y, vx, vy, life, extra) { for (const p of parts) if (!p.on) { p.on = true; p.k = kind; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.life = life; p.e = extra || 0; return p; } return null; }
      function pop(s, x, y) { pops.push({ s, x, y, t: 0 }); if (pops.length > 6) pops.shift(); }
      function say(s, t, big) { banner = { s, t: t || 120, big: !!big }; }

      function tileAt(tx, ty) { if (tx < 0 || tx >= LV.w || ty < 0) return 17; if (ty >= LV.h) return 0; return LV.t[ty * LV.w + tx]; }
      const isSolid = (tx, ty) => SOLID[tileAt(tx, ty)] === 1;
      function isPlat(tx, ty) { const t = tileAt(tx, ty); return t === 2 || (t === 3 && tileAt(tx, ty - 1) !== 3); }
      function setTile(tx, ty, t) { if (tx < 0 || ty < 0 || tx >= LV.w || ty >= LV.h) return; LV.t[ty * LV.w + tx] = t; refreshTile(tx, ty); refreshTile(tx - 1, ty); refreshTile(tx + 1, ty); refreshTile(tx, ty + 1); refreshTile(tx, ty - 1); }

      function loadLevel(i) {
        levelIdx = i; const L = LEVELS[i]; const rows = L.rows || (L.rows = joinSegs(L.segs));
        const w = Math.max(...rows.map(r => r.length)), h = rows.length;
        TS0 = tileset(L.theme); BG = backdrop(L.theme); boss = null;
        LV = { def: L, w, h, t: new Uint8Array(w * h), item: new Uint8Array(w * h), q: new Uint8Array(w * h), cv: new Array(w * h), signs: [], theme: L.theme, door: null, boss: !!L.boss };
        ents = []; coins.length = 0; for (const p of parts) p.on = false; pops.length = 0;
        let signN = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const ch = rows[y][x] || '.', i2 = y * w + x;
          if (TID[ch] != null) LV.t[i2] = TID[ch];
          else if (ch === 'o') LV.item[i2] = 1;
          else if (ch === 'O') LV.item[i2] = 2;
          else if (ch === 'P') { pl.x = x * TS + 8; pl.y = (y + 1) * TS; }
          else if (ch === '!') LV.signs.push({ x: x * TS + 8, y: (y + 1) * TS, s: L.signs[signN++] || '', seen: false });
          else if (ch === 'D') LV.door = { x: x * TS + 8, y: (y + 1) * TS, open: 0 };
          else if (ch === 'k') ents.push({ k: 'key', x: x * TS + 8, y: (y + 1) * TS - 2, hw: 7, h: 10, st: 'idle', t: 0 });
          else if (ch === 'C') ents.push({ k: 'chest', x: x * TS + 8, y: (y + 1) * TS, hw: 9, h: 16, st: 'shut', t: 0 });
          else if (ch === 'K') { boss = makeBoss(x * TS + 8, (y + 1) * TS); }
          else if (ch >= '1' && ch <= '7') ents.push(makeEnemy(+ch, x * TS + 8, (y + 1) * TS));
          if (ch === '?') LV.q[i2] = 5;
        }
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) refreshTile(x, y);
        pl.vx = pl.vy = 0; pl.face = 1; pl.st = 'n'; pl.t = 0; pl.inv = 0; pl.carry = null; pl.dash = false; pl.cool = 0; pl.safeX = pl.x; pl.safeY = pl.y; pl.h = 22;
        levelCoins = 0; gotKey = false; gotTr = false; chestOpen = false; levelT = 0; banner.t = 0; sign = -1; paused = false;
        cam.x = clamp(pl.x - W / 2, 0, w * TS - W); cam.y = clamp(pl.y - 96, 0, Math.max(0, h * TS - VH)); cam.look = 0; cam.shake = 0;
        mode = 'level'; K.music(L.boss ? null : SONGS[L.song]);
        if (LV.boss) { say('KING HOGSWORTH!', 150, true); }
        else say(L.name, 110, true);
      }
      let TS0 = null, BG = null;
      function refreshTile(x, y) {
        if (!LV || x < 0 || y < 0 || x >= LV.w || y >= LV.h) return;
        const T = TS0 || tileset(LV.def.theme), t = LV.t[y * LV.w + x], i = y * LV.w + x;
        let c = null;
        if (t === 1) { const air = (dx, dy) => { const n = tileAt(x + dx, y + dy); return n !== 1 && n !== 17 && n !== 16; }; const m = (air(0, -1) ? 1 : 0) | (air(-1, 0) ? 2 : 0) | (air(1, 0) ? 4 : 0) | (air(0, 1) && y + 1 < LV.h ? 8 : 0); c = T.ground[m][(x * 7 + y * 3) % 5 === 0 ? 1 : 0]; }
        else if (t === 2) c = T.plank; else if (t === 3) c = T.ladder; else if (t === 4) c = T.block; else if (t === 5) c = T.stomp; else if (t === 6) c = T.fire;
        else if (t === 7) c = T.coinblk; else if (t === 8) c = T.used; else if (t === 9) c = T.spike; else if (t === 10) c = T.torch; else if (t === 11) c = T.water; else if (t === 12) c = T.deep;
        else if (t === 13) c = T.deco; else if (t === 14) c = T.trunk; else if (t === 16) c = T.hard;
        LV.cv[i] = c;
      }

      // ---- baddies
      function makeEnemy(n, x, y) {
        const k = ['', 'crab', 'spiker', 'bee', 'ember', 'thump', 'gull', 'guard'][n];
        const e = { k, x, y, vx: 0, vy: 0, face: -1, st: 'go', t: (x * 7) % 60, hw: 7, h: 12, hx: x, hy: y, flash: 0, dead: false, ground: false };
        if (k === 'bee') { e.y = y - 12; e.hy = e.y; e.h = 10; e.hw = 6; }
        if (k === 'gull') { e.y = y; e.hy = y; e.h = 10; e.hw = 7; }
        if (k === 'thump') { e.hw = 10; e.h = 18; e.y = y; e.hy = y; e.top = y; e.st = 'wait'; }
        if (k === 'ember') { e.h = 12; e.hw = 6; }
        if (k === 'guard') { e.h = 14; e.hw = 7; }
        return e;
      }
      const carryable = e => e.k === 'crab' || e.k === 'spiker' || e.k === 'bee' || e.k === 'gull' || e.k === 'guard';
      function moveX(o, dx, hw, h, hit) {
        if (!dx) return false; o.x += dx;
        const top = Math.floor((o.y - h + 0.5) / TS), bot = Math.floor((o.y - 0.5) / TS);
        const edge = dx > 0 ? o.x + hw : o.x - hw, tx = Math.floor(dx > 0 ? (edge - 0.001) / TS : edge / TS);
        let blocked = false;
        for (let ty = top; ty <= bot; ty++) if (isSolid(tx, ty)) { if (hit && hit(tx, ty)) continue; blocked = true; }
        if (blocked) { o.x = dx > 0 ? tx * TS - hw : (tx + 1) * TS + hw; return true; }
        return false;
      }
      function moveY(o, dy, hw, h, hitDown, hitUp) {
        if (!dy) return false; const oy = o.y; o.y += dy;
        const l = Math.floor((o.x - hw + 0.5) / TS), r = Math.floor((o.x + hw - 0.5) / TS);
        if (dy > 0) {
          const ty = Math.floor((o.y - 0.001) / TS); let land = false;
          for (let tx = l; tx <= r; tx++) { if (isSolid(tx, ty)) { if (hitDown && hitDown(tx, ty)) continue; land = true; } else if (isPlat(tx, ty) && oy <= ty * TS + 0.01 && !(o === pl && pl.st === 'climb')) land = true; }
          if (land) { o.y = ty * TS; return true; }
        } else {
          const ty = Math.floor((o.y - h) / TS); let bump = false;
          for (let tx = l; tx <= r; tx++) if (isSolid(tx, ty)) { if (hitUp) hitUp(tx, ty); bump = true; }
          if (bump) { o.y = (ty + 1) * TS + h; return true; }
        }
        return false;
      }
      const onFloor = (x, y) => { const ty = Math.floor(y / TS); return isSolid(Math.floor(x / TS), ty) || tileAt(Math.floor(x / TS), ty) === 2; };

      // ---- breaking things
      function smash(tx, ty, how) {
        const t = tileAt(tx, ty);
        if (t === 7) { bumpQ(tx, ty); return false; }
        if (t === 4 || (t === 5 && how === 'stomp') || (t === 6 && how === 'fire') || (t === 4 && how)) {
          setTile(tx, ty, 0); sfx.smash(); cam.shake = Math.max(cam.shake, 4);
          const cx = tx * TS + 8, cy = ty * TS + 8;
          for (let i = 0; i < 4; i++) part('chunk', cx + (i % 2 ? 4 : -4), cy + (i < 2 ? -4 : 4), (i % 2 ? 1 : -1) * (0.8 + rnd()), -2.5 - (i < 2 ? 1 : 0) - rnd(), 60);
          if ((tx * 5 + ty * 3) % 3 === 0 && t === 4) spawnCoin(cx, cy, 0, -3, 1, true);
          return true;
        }
        return false;
      }
      function bumpQ(tx, ty) {
        const i = ty * LV.w + tx; if (LV.t[i] !== 7) return;
        LV.q[i]--; spawnCoin(tx * TS + 8, ty * TS - 4, 0, -3.5, 1, true);
        LV.bump = { tx, ty, t: 8 };
        if (LV.q[i] <= 0) setTile(tx, ty, 8);
      }
      function spawnCoin(x, y, vx, vy, val, auto) {
        if (auto) { levelCoins += val; sfx.coin(); part('flyc', x, y, 0, -3, 24); return; }
        coins.push({ x, y, vx, vy, t: 0, val, h: 8 });
        if (coins.length > 30) coins.shift();
      }
      function bowl(e, dir) {
        if (e.dead || e.st === 'bowled') return;
        e.st = 'bowled'; e.vx = dir * 2.2; e.vy = -3.6; e.t = 0; e.flash = 8; sfx.bowl(); cam.shake = Math.max(cam.shake, 3);
        for (let i = 0; i < 3; i++) part('star', e.x, e.y - e.h / 2, (rnd() - 0.5) * 3, -1 - rnd() * 2, 30);
        if (pl.carry === e) pl.carry = null;
      }
      function stun(e) { if (e.dead || e.st === 'bowled') return; e.st = 'stun'; e.t = 0; e.vx = 0; e.vy = e.k === 'bee' || e.k === 'gull' ? 0.5 : -2; sfx.stun(); part('star', e.x, e.y - e.h, 0, -1.5, 24); }

      // ---- coins: drop them when hurt
      function loseCoins(n) {
        const lost = Math.min(levelCoins, n); levelCoins -= lost;
        for (let i = 0; i < Math.min(lost, 10); i++) { const a = -Math.PI / 2 + (i / Math.max(1, Math.min(lost, 10) - 1) - 0.5) * 2.4; coins.push({ x: pl.x, y: pl.y - 14, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 3.2 - 0.5, t: 0, val: Math.ceil(lost / Math.min(lost, 10)), h: 8, life: 150 }); }
        if (lost) pop('-' + lost, pl.x, pl.y - 30);
      }
      function hurt(fromX) {
        if (pl.inv > 0 || pl.st === 'hurt' || pl.st === 'door' || pl.st === 'fire' || pl.st === 'char' || pl.st === 'puff') return;
        dropCarry(); sfx.hurt(); cam.shake = 6;
        pl.st = 'hurt'; pl.t = 0; pl.face = fromX > pl.x ? 1 : -1; pl.vx = -pl.face * 1.8; pl.vy = -3; pl.inv = 100; pl.dash = false;
        loseCoins(10);
      }
      function dropCarry() { if (pl.carry) { const e = pl.carry; pl.carry = null; e.st = 'stun'; e.t = 120; e.x = pl.x; e.y = pl.y - 24; e.vy = -1; } }
      function setState(st) {
        if (pl.st === 'flat' || pl.st === 'puff' || pl.st === 'fire' || pl.st === 'char' || pl.st === 'door') return false;
        dropCarry(); pl.st = st; pl.t = 0; pl.dash = false; return true;
      }
      function catchFire() { if (setState('fire')) { sfx.fire(); pl.vy = -2.5; pl.vx = 0; say('HOT! HOT! HOT!', 60); } }
      function getFlat() { if (pl.st === 'flat') { pl.t = 0; return; } if (setState('flat')) { sfx.flat(); pl.vx = 0; cam.shake = 5; pop('SPLAT!', pl.x, pl.y - 16); } }
      function getPuffed() { if (setState('puff')) { sfx.puff(); pl.vy = -1; pop('POOMF!', pl.x, pl.y - 34); } }

      // ============================================================ Grabbo
      function updPlayer() {
        const L = K.held('left'), R = K.held('right'), U = K.held('up'), D = K.held('down'), A = K.pressed('a'), Ah = K.held('a'), B = K.pressed('b');
        const dir = (R ? 1 : 0) - (L ? 1 : 0);
        pl.t++; if (pl.inv > 0) pl.inv--; if (pl.cool > 0) pl.cool--;
        const st = pl.st;
        pl.h = st === 'flat' ? 9 : 22;
        if (st === 'door') { pl.vx = 0; if (pl.t === 1) sfx.door(); if (LV.door) LV.door.open = Math.min(1, pl.t / 10); if (pl.t > 50) levelDone(); return; }
        if (st === 'hurt') {
          pl.vy = Math.min(pl.vy + 0.25, 4); stepX(pl.vx); stepY();
          if (pl.ground) pl.vx *= 0.8;
          if (pl.t > 34) { pl.st = 'n'; pl.t = 0; } return;
        }
        if (st === 'bonk') {
          pl.vy = Math.min(pl.vy + 0.25, 4); stepX(pl.vx); stepY(); if (pl.ground) pl.vx *= 0.75;
          if (pl.t > 30 && pl.ground) { pl.st = 'n'; pl.t = 0; } return;
        }
        if (st === 'dizzy') { pl.vx *= 0.8; pl.vy = Math.min(pl.vy + 0.25, 4); stepX(pl.vx); stepY(); if (pl.t % 12 === 0) part('star', pl.x + Math.cos(pl.t / 6) * 10, pl.y - 30, 0, -0.3, 14); if (pl.t > 60) { pl.st = 'n'; pl.t = 0; } return; }
        if (st === 'land') { pl.vx *= 0.7; pl.vy = Math.min(pl.vy + 0.25, 4); stepY(); if (pl.t > 10) { pl.st = 'n'; pl.t = 0; } return; }
        if (st === 'char') { pl.vx = 0; pl.vy = Math.min(pl.vy + 0.25, 4); stepY(); if (pl.t % 10 === 0) part('smoke', pl.x + (rnd() - 0.5) * 12, pl.y - 26, 0, -0.6, 40); if (pl.t === 20) pop('COUGH!', pl.x, pl.y - 34); if (pl.t > 70) { pl.st = 'n'; pl.t = 0; pl.inv = 30; } return; }
        if (st === 'fire') {
          if (pl.t < 26) { pl.vx = 0; pl.vy = Math.min(pl.vy + 0.25, 4); stepY(); if (pl.ground && pl.t % 8 === 0) pl.vy = -2; }
          else {
            pl.vx = pl.face * 2.1;
            if (A && pl.ground) { pl.vy = -4.2; sfx.jump(); }
            pl.vy = Math.min(pl.vy + 0.25, 4.5);
            if (stepX(pl.vx, 'fire')) { pl.face = -pl.face; sfx.bonk(); }
            stepY();
          }
          if (pl.t % 4 === 0) part('ember', pl.x + (rnd() - 0.5) * 8, pl.y - 26, (rnd() - 0.5) * 0.6, -1, 20);
          if (pl.t > 250) { pl.st = 'char'; pl.t = 0; sfx.pop(); for (let i = 0; i < 5; i++) part('smoke', pl.x + (rnd() - 0.5) * 16, pl.y - 20, (rnd() - 0.5), -0.8, 40); }
          return;
        }
        if (st === 'puff') {
          pl.vx += (dir * 0.8 - pl.vx) * 0.08; pl.vy += (-0.7 - pl.vy) * 0.05;
          stepX(pl.vx); if (stepY() && pl.vy < 0) pl.vy = 0.3;
          if (pl.t % 30 === 0) part('puff', pl.x - pl.face * 12, pl.y - 6, -pl.face * 0.3, 0.3, 20);
          if (A || pl.t > 330) { pl.st = 'n'; pl.t = 0; pl.vy = 0; sfx.unflat(); pop('PFFT!', pl.x, pl.y - 30); for (let i = 0; i < 4; i++) part('puff', pl.x + (rnd() - 0.5) * 20, pl.y - 12, (rnd() - 0.5) * 2, -rnd(), 20); }
          return;
        }
        if (st === 'flat') {
          if (dir) pl.face = dir;
          pl.vx += (dir * 0.8 - pl.vx) * 0.15;
          if (pl.ground && A) { pl.vy = -2.6; sfx.jump(); }
          pl.vy = Math.min(pl.vy + (pl.vy > 0 ? 0.06 : 0.18), 0.75);
          stepX(pl.vx + (pl.ground ? 0 : Math.sin(pl.t / 8) * 0.4)); stepY();
          if (pl.t > 300) { // back to normal: needs room to stand up
            const l = Math.floor((pl.x - HW + 0.5) / TS), r = Math.floor((pl.x + HW - 0.5) / TS), top = Math.floor((pl.y - 22) / TS);
            let room = true; for (let tx = l; tx <= r; tx++) for (let ty = top; ty < Math.floor((pl.y - 1) / TS); ty++) if (isSolid(tx, ty)) room = false;
            if (room) { pl.st = 'n'; pl.t = 0; sfx.unflat(); pop('BOING!', pl.x, pl.y - 30); pl.inv = 20; }
          }
          return;
        }
        if (st === 'climb') {
          pl.vx = 0; const dy = (D ? 1 : 0) - (U ? 1 : 0); pl.anim += Math.abs(dy);
          pl.x += (pl.ladderX - pl.x) * 0.5;
          if (A) { pl.st = 'n'; pl.t = 0; pl.vy = -3.6; pl.vx = dir * 1.2; if (dir) pl.face = dir; sfx.jump(); return; }
          const mid = Math.floor((pl.y - 6) / TS), cx = Math.floor(pl.ladderX / TS);
          if (dy < 0) {
            if (isSolid(cx, Math.floor((pl.y - pl.h - 1.2) / TS))) return; // a ceiling
            pl.y -= 1.1;
            if (tileAt(cx, Math.floor((pl.y - 0.5) / TS)) !== 3) { pl.y = Math.ceil(pl.y / TS) * TS; pl.st = 'n'; pl.ground = true; pl.vy = 0; return; } // reached the top
          } else if (dy > 0) { if (moveY(pl, 1.3, HW, pl.h)) { pl.st = 'n'; pl.ground = true; return; } if (tileAt(cx, mid) !== 3 && tileAt(cx, Math.floor((pl.y - 1) / TS)) !== 3) { pl.st = 'n'; } }
          return;
        }
        // ---- normal running about (and barging, stomping)
        if (st === 'n') {
          const max = pl.carry ? 1.1 : 1.3;
          if (dir) { pl.face = dir; if (pl.dash && dir !== Math.sign(pl.vx)) pl.dash = false; }
          if (!pl.dash) { const acc = pl.ground ? 0.16 : 0.1; if (dir) pl.vx += clamp(dir * max - pl.vx, -acc, acc); else pl.vx *= pl.ground ? 0.72 : 0.94; if (Math.abs(pl.vx) < 0.05) pl.vx = 0; }
          if (pl.ground) pl.coyote = 6; else if (pl.coyote > 0) pl.coyote--;
          if (A && pl.coyote > 0) { pl.vy = -4.5; pl.coyote = 0; pl.ground = false; sfx.jump(); pl.jumpHeld = true; }
          if (!Ah) pl.jumpHeld = false;
          if (pl.vy < -1.4 && !pl.jumpHeld) pl.vy += 0.35;
          // ladders
          const lt = (dx, dy) => tileAt(Math.floor((pl.x + dx) / TS), Math.floor((pl.y + dy) / TS));
          if (!pl.carry && (U && (lt(0, -6) === 3 || lt(0, -20) === 3)) || (!pl.carry && D && pl.ground && lt(0, 2) === 3)) {
            pl.st = 'climb'; pl.ladderX = Math.floor(pl.x / TS) * TS + 8; pl.vx = pl.vy = 0; pl.dash = false; if (D && pl.ground) pl.y += 3; return;
          }
          // the goal door
          if (U && pl.ground && LV.door && Math.abs(pl.x - LV.door.x) < 9 && Math.abs(pl.y - LV.door.y) < 4 && !pl.carry) { pl.st = 'door'; pl.t = 0; pl.x = LV.door.x; return; }
          if (B && pl.cool <= 0) {
            if (pl.carry) throwIt();
            else { pl.st = 'barge'; pl.t = 0; pl.bargeAir = !pl.ground; sfx.barge(); if (!pl.ground) pl.vy = Math.min(pl.vy, -0.5); pl.dash = false; return; }
          }
          if (D && !pl.ground && !pl.carry && pl.t > 2) { pl.st = 'stomp'; pl.t = 0; pl.vx = 0; pl.vy = -1.2; sfx.stompGo(); return; }
          pl.vy = Math.min(pl.vy + 0.25, 4.5);
          stepX(pl.vx); const was = pl.ground, vy0 = pl.vy; stepY();
          if (pl.ground && !was && vy0 > 2) { sfx.land(); part('dust', pl.x - 6, pl.y - 2, -0.4, -0.2, 16); part('dust', pl.x + 6, pl.y - 2, 0.4, -0.2, 16); }
          if (pl.ground) { pl.dash = false; pl.air = 0; } else pl.air++;
          return;
        }
        if (st === 'barge') {
          const run = pl.t < 4 ? 1.6 + pl.t * 0.3 : 2.7;
          pl.vx = pl.face * run;
          if (A && pl.ground) { pl.st = 'n'; pl.t = 0; pl.vy = -4.5; pl.dash = true; pl.jumpHeld = true; pl.ground = false; sfx.jump(); return; }
          pl.vy = Math.min(pl.vy + (pl.bargeAir ? 0.12 : 0.25), 4);
          if (stepX(pl.vx, 'barge')) { // into a wall
            pl.st = 'bonk'; pl.t = 0; pl.vx = -pl.face * 1.3; pl.vy = -2.4; sfx.bonk(); cam.shake = 6; pop('BONK!', pl.x + pl.face * 10, pl.y - 30);
            for (let i = 0; i < 3; i++) part('star', pl.x + pl.face * 8, pl.y - 26, (rnd() - 0.5) * 2, -1 - rnd(), 26);
            return;
          }
          stepY();
          if (pl.t % 4 === 0 && pl.ground) part('dust', pl.x - pl.face * 8, pl.y - 2, -pl.face * 0.5, -0.3, 14);
          if (pl.t > (pl.bargeAir ? 20 : 28)) { pl.st = 'n'; pl.t = 0; pl.cool = 6; pl.vx = pl.face * 1.3; }
          return;
        }
        if (st === 'stomp') {
          if (pl.t < 8) { pl.vy = 0; return; }
          pl.vy = 5.5;
          let broke = false;
          const landed = moveY(pl, pl.vy, HW, pl.h, (tx, ty) => { const t = tileAt(tx, ty); if (t === 4 || t === 5) { smash(tx, ty, 'stomp'); broke = true; return true; } if (t === 7) { bumpQ(tx, ty); } return false; });
          if (broke) { cam.shake = 6; }
          if (landed) {
            pl.ground = true; pl.vy = 0; pl.st = 'land'; pl.t = 0; sfx.stomp(); cam.shake = 8;
            for (let i = 0; i < 4; i++) part('dust', pl.x + (i < 2 ? -1 : 1) * (6 + i * 3), pl.y - 2, (i < 2 ? -1 : 1) * (0.6 + i * 0.3), -0.4, 20);
            quake(pl.x, pl.y);
          } else pl.ground = false;
          if (pl.y > LV.h * TS + 40) fellOut();
          return;
        }
      }
      // horizontal move with the special powers: barge/fire smash blocks
      function stepX(dx, how) {
        return moveX(pl, dx, HW, pl.h, how ? (tx, ty) => {
          const t = tileAt(tx, ty);
          if (how === 'fire' && (t === 6 || t === 4)) return smash(tx, ty, 'fire');
          if (how === 'barge' && t === 4) return smash(tx, ty, 'barge');
          if (how === 'barge' && t === 7) { bumpQ(tx, ty); return false; }
          return false;
        } : null);
      }
      function stepY() {
        const vy = pl.vy;
        const hit = moveY(pl, vy, HW, pl.h, null, (tx, ty) => { const t = tileAt(tx, ty); if (t === 7) bumpQ(tx, ty); else if (t === 4 && pl.st !== 'puff') smash(tx, ty, 'head'); else if (vy < -2) sfx.bonk(); });
        if (hit) { if (vy > 0) { pl.ground = true; } pl.vy = 0; } else if (vy > 0 || vy < 0) pl.ground = false;
        if (pl.ground && !hit) pl.ground = false;
        if (pl.ground && pl.st !== 'puff' && isSolid(Math.floor(pl.x / TS), Math.floor(pl.y / TS))) { pl.safeX = pl.x; pl.safeY = pl.y; }
        if (pl.y > LV.h * TS + 40) fellOut();
        return hit;
      }
      function fellOut() {
        pl.x = pl.safeX; pl.y = pl.safeY; pl.vx = pl.vy = 0; pl.st = 'n'; pl.t = 0; pl.inv = 90; dropCarry(); pl.carry = null;
        sfx.splash(); cam.shake = 6; const lost = Math.min(levelCoins, 10); levelCoins -= lost; say(lost ? 'SPLOSH! -' + lost + ' COINS' : 'SPLOSH!', 80);
      }
      function quake(x, y) {
        for (const e of ents) { if (e.dead || !e.ground || e.st === 'bowled' || e.k === 'thump' || e.k === 'ember' || e.k === 'key' || e.k === 'chest' || e.k === 'bag') continue; if (Math.abs(e.x - x) < 56 && Math.abs(e.y - y) < 20) stun(e); }
      }
      function throwIt() {
        const e = pl.carry; pl.carry = null; if (!e) return;
        e.st = 'thrown'; e.t = 0; e.x = pl.x + pl.face * 8; e.y = pl.y - 14; e.vx = pl.face * 3.4; e.vy = -1.6; e.face = pl.face; sfx.throw();
        pl.throwT = 14; pl.cool = 10;
      }

      // ---- baddies: thinking and touching
      function updEnemy(e) {
        e.t++; if (e.flash > 0) e.flash--;
        if (e.k === 'key' || e.k === 'chest') return updThing(e);
        if (e.k === 'bag') return updBag(e);
        if (e.st === 'bowled') { e.x += e.vx; e.y += e.vy; e.vy += 0.2; if (e.t > 48) { e.dead = true; sfx.pop(); for (let i = 0; i < 5; i++) part('star', e.x, e.y - 6, Math.cos(i * 1.26) * 1.6, Math.sin(i * 1.26) * 1.6 - 0.5, 24); coins.push({ x: e.x, y: e.y - 6, vx: 0, vy: -3, t: 0, val: 1, h: 8 }); } return; }
        if (e.st === 'carried') { e.x = pl.x; e.y = pl.y - 23; e.face = pl.face; return; }
        if (e.st === 'thrown') {
          e.vy = Math.min(e.vy + 0.15, 4);
          const hitWall = moveX(e, e.vx, e.hw, e.h, (tx, ty) => smash(tx, ty, 'throw'));
          moveY(e, e.vy, e.hw, e.h, (tx, ty) => tileAt(tx, ty) === 4 ? smash(tx, ty, 'throw') : false);
          if (hitWall || e.t > 120) { bowl(e, -Math.sign(e.vx)); e.vx *= -0.5; return; }
          for (const o of ents) if (o !== e && !o.dead && o.st !== 'bowled' && o.k !== 'key' && o.k !== 'chest' && o.k !== 'bag' && o.k !== 'thump' && overlap(e, o)) { if (o.k === 'ember') { o.dead = true; for (let i = 0; i < 4; i++) part('smoke', o.x, o.y - 6, (rnd() - 0.5) * 2, -1, 30); sfx.pop(); } else bowl(o, Math.sign(e.vx)); bowl(e, -Math.sign(e.vx)); pop('BOWLED!', o.x, o.y - 20); break; }
          if (e.y > LV.h * TS + 30) e.dead = true;
          return;
        }
        if (e.st === 'stun') {
          e.vy = Math.min(e.vy + 0.2, 3.5); moveX(e, e.vx, e.hw, e.h); e.vx *= 0.9;
          e.ground = moveY(e, e.vy, e.hw, e.h); if (e.ground) e.vy = 0;
          if (e.y > LV.h * TS + 30) { e.dead = true; return; }
          if (e.t > 300) { e.st = 'go'; e.t = 0; if (e.k === 'bee' || e.k === 'gull') { e.vy = -1.5; } part('star', e.x, e.y - e.h, 0, -1, 16); }
          return;
        }
        switch (e.k) {
          case 'crab': case 'spiker': case 'guard': {
            const sp = e.k === 'crab' ? 0.4 : e.k === 'spiker' ? 0.45 : 0.35;
            if (e.k === 'guard') { // pokes his spear when Grabbo's close in front
              const near = Math.abs(pl.y - e.y) < 24 && (pl.x - e.x) * e.face > 0 && Math.abs(pl.x - e.x) < 46;
              if (e.poke > 0) { e.poke--; e.vx = 0; } else if (near && e.t > 60) { e.poke = 40; e.t = 0; K.sfx.tone(600, 0.06, 'square', 0.05); }
              else e.vx = e.face * sp;
            } else e.vx = e.face * sp;
            e.vy = Math.min(e.vy + 0.25, 4);
            if (moveX(e, e.vx, e.hw, e.h)) e.face = -e.face;
            e.ground = moveY(e, e.vy, e.hw, e.h); if (e.ground) e.vy = 0;
            if (e.ground && !onFloor(e.x + e.face * (e.hw + 1), e.y + 1)) e.face = -e.face;
            break;
          }
          case 'bee': {
            const dx = pl.x - e.x, dy = pl.y - 14 - e.y, near = Math.abs(dx) < 64 && Math.abs(dy) < 72 && pl.st !== 'puff';
            if (near) { e.vx += Math.sign(dx) * 0.04; e.vy += Math.sign(dy) * 0.03; } else { e.vx += Math.sign(e.hx + Math.sin(e.t / 60) * 30 - e.x) * 0.03; e.vy += Math.sign(e.hy + Math.sin(e.t / 13) * 6 - e.y) * 0.04; }
            e.vx = clamp(e.vx, -0.7, 0.7); e.vy = clamp(e.vy, -0.6, 0.6); if (Math.abs(e.vx) > 0.1) e.face = Math.sign(e.vx);
            moveX(e, e.vx, e.hw, e.h); moveY(e, e.vy, e.hw, e.h); e.ground = false;
            break;
          }
          case 'gull': {
            if (e.sw > 0) { e.sw++; const k = e.sw / 70; e.x += e.face * 1.6; e.y = e.hy + Math.sin(k * Math.PI) * e.dive; if (e.sw >= 70) { e.sw = 0; e.t = 0; } }
            else { e.x += e.face * 0.8; if (Math.abs(e.x - e.hx) > 72) { e.face = Math.sign(e.hx - e.x); e.x += e.face; } e.y = e.hy + Math.sin(e.t / 20) * 2;
              const dx = pl.x - e.x; if (e.t > 50 && dx * e.face > 10 && dx * e.face < 50 && pl.y > e.y + 10 && pl.y - e.y < 90) { e.sw = 1; e.dive = clamp(pl.y - 6 - e.hy, 10, 80); e.hy0 = e.hy; K.sfx.tone(1400, 0.15, 'square', 0.04, 0, 900); } }
            e.ground = false;
            break;
          }
          case 'ember': {
            e.vy = Math.min(e.vy + 0.18, 4);
            if (e.ground && e.t > 50) { e.vy = -3.4; e.vx = Math.sign(pl.x - e.x || 1) * 0.6; e.t = 0; e.ground = false; }
            if (moveX(e, e.vx, e.hw, e.h)) e.vx = -e.vx;
            const land = moveY(e, e.vy, e.hw, e.h); if (land && e.vy > 0) { e.ground = true; e.vx = 0; } if (land) e.vy = 0;
            if (e.y > LV.h * TS + 30) e.dead = true;
            if (e.t % 6 === 0) part('ember', e.x + (rnd() - 0.5) * 6, e.y - 10, 0, -0.6, 14);
            break;
          }
          case 'thump': {
            if (e.st === 'wait') { e.y = e.top; if (Math.abs(pl.x - e.x) < 20 && pl.y > e.y && pl.y - e.y < 140 && e.t > 30) { e.st = 'fall'; e.vy = 0; e.t = 0; } }
            else if (e.st === 'fall') { e.vy = Math.min(e.vy + 0.35, 6); if (moveY(e, e.vy, e.hw, e.h)) { e.st = 'rest'; e.t = 0; sfx.quake(); cam.shake = 7; part('dust', e.x - 10, e.y - 2, -0.6, -0.3, 18); part('dust', e.x + 10, e.y - 2, 0.6, -0.3, 18); } }
            else if (e.st === 'rest') { if (e.t > 50) { e.st = 'up'; e.t = 0; } }
            else if (e.st === 'up') { e.y -= 0.7; if (e.y <= e.top) { e.y = e.top; e.st = 'wait'; e.t = 0; } }
            break;
          }
        }
      }
      const overlap = (a, b) => Math.abs(a.x - b.x) < a.hw + b.hw && a.y - a.h < b.y && b.y - b.h < a.y;
      function touch(e) {
        if (e.dead || e.st === 'bowled' || e.st === 'carried' || e.st === 'thrown' || e.k === 'key' || e.k === 'chest' || e.k === 'bag') return;
        const me = { x: pl.x, y: pl.y, hw: HW, h: pl.h };
        if (e.k === 'thump') {
          const box = { x: e.x, y: e.y, hw: e.hw, h: e.h };
          if (!overlap(me, box)) return;
          if (e.st === 'fall' && pl.y > e.y - 8) getFlat();
          else if (pl.st !== 'flat' && pl.st !== 'puff') { pl.x += pl.x < e.x ? -1.5 : 1.5; pl.vx = 0; }
          return;
        }
        if (!overlap(me, e)) {
          if (e.k === 'guard' && e.poke > 8 && e.poke < 34 && e.st === 'go' && pl.st !== 'flat' && pl.st !== 'puff' && pl.st !== 'fire' && pl.st !== 'char') { const tip = { x: e.x + e.face * 18, y: e.y - 5, hw: 6, h: 5 }; if (overlap(me, tip)) { if (pl.st === 'barge') { pl.st = 'bonk'; pl.t = 0; pl.vx = -pl.face * 1.5; pl.vy = -2.4; sfx.bonk(); } else hurt(e.x); } }
          return;
        }
        const st = pl.st;
        if (st === 'fire') { if (e.k !== 'ember') bowl(e, Math.sign(e.x - pl.x) || 1); return; }
        if (st === 'puff' || st === 'flat' || st === 'char' || st === 'door') { if (e.k === 'ember' && st !== 'char' && st !== 'door') catchFire(); return; }
        if (e.st === 'stun') {
          if (st === 'barge') { e.st = 'thrown'; e.vx = pl.face * 3.6; e.vy = -1; e.face = pl.face; e.t = 0; sfx.throw(); return; }
          if (!pl.carry && carryable(e) && st !== 'hurt' && st !== 'climb' && st !== 'stomp') { pl.carry = e; e.st = 'carried'; sfx.pick(); pop('HUP!', pl.x, pl.y - 34); return; }
          return;
        }
        if (e.k === 'ember') { catchFire(); return; }
        if (e.k === 'bee') { if (st === 'barge') { bowl(e, pl.face); return; } if (pl.vy > 0 && pl.y < e.y - 2 && st !== 'hurt') { stun(e); pl.vy = K.held('a') ? -4.6 : -3; return; } getPuffed(); return; }
        const fromAbove = (pl.vy > 0 || st === 'stomp') && pl.y - pl.vy <= e.y - e.h + 6;
        if (st === 'barge') {
          if (e.k === 'guard' && e.face === -pl.face) { pl.st = 'bonk'; pl.t = 0; pl.vx = -pl.face * 1.5; pl.vy = -2.4; sfx.bonk(); pop('CLANG!', e.x, e.y - 22); e.vx = 0; e.x += pl.face * 4; return; }
          bowl(e, pl.face); pop(['BOWLED!', 'BOSH!', 'WALLOP!'][(e.x | 0) % 3], e.x, e.y - 20); return;
        }
        if (fromAbove && st !== 'hurt') {
          if (e.k === 'spiker') { hurt(e.x); pl.vy = -3.5; pop('OUCH!', pl.x, pl.y - 30); return; }
          stun(e); pl.vy = K.held('a') ? -4.6 : -3; pl.ground = false; if (pl.st === 'stomp') { pl.st = 'n'; pl.t = 3; }
          pop('BONK!', e.x, e.y - 18); return;
        }
        hurt(e.x);
      }
      function updThing(e) {
        const me = { x: pl.x, y: pl.y, hw: HW, h: pl.h };
        if (e.k === 'key') {
          if (e.st === 'idle') { if (e.t % 40 === 0) part('spark', e.x + (rnd() - 0.5) * 14, e.y - 4 - rnd() * 8, 0, -0.2, 20); if (pl.st !== 'door' && overlap(me, e)) { e.st = 'got'; e.t = 0; gotKey = true; sfx.key(); say('GOT THE KEY!', 100); } }
          else if (e.t > 40) e.dead = true;
          return;
        }
        if (e.k === 'chest') {
          if (e.st === 'shut' && overlap(me, { x: e.x, y: e.y, hw: e.hw + 2, h: e.h })) {
            if (gotKey) { e.st = 'open'; e.t = 0; chestOpen = true; sfx.treasure(); K.music(null); cam.shake = 3; }
            else if (!e.told || e.told < K.t - 4) { e.told = K.t; sfx.locked(); say('LOCKED! FIND THE KEY...', 90); }
          }
          if (e.st === 'open') {
            if (e.t % 5 === 0 && e.t < 90) part('spark', e.x + (rnd() - 0.5) * 20, e.y - 20 - rnd() * 16, 0, -0.4, 22);
            if (e.t === 60) { gotTr = true; say('TREASURE! ' + LEVELS[levelIdx].tr + '!', 150, true); }
            if (e.t === 150) K.music(SONGS[LEVELS[levelIdx].song]);
          }
        }
      }
      function levelDone() {
        mode = 'clear'; clr = { t: 0, n: 0, shown: 0, best: false };
        K.music(null); sfx.clear();
      }
      let clr = null;

      // ---- one step of the level
      function updLevel() {
        if (K.pressed('start') && pl.st !== 'door') { paused = !paused; pauseSel = 0; sfx.menu(); if (paused) K.music(null); else K.music(SONGS[LEVELS[levelIdx].song]); }
        if (paused) {
          if (K.pressed('up') || K.pressed('down')) { pauseSel = 1 - pauseSel; sfx.menu(); }
          if (K.pressed('a')) { sfx.pick(); if (pauseSel === 0) { paused = false; K.music(SONGS[LEVELS[levelIdx].song]); } else { paused = false; fadeTo(() => toMap(false)); } }
          if (K.pressed('b')) { paused = false; K.music(SONGS[LEVELS[levelIdx].song]); }
          return;
        }
        levelT++;
        updPlayer();
        if (pl.throwT > 0) pl.throwT--;
        for (const e of ents) { if (!e.dead) { updEnemy(e); if (!e.dead && pl.st !== 'door') touch(e); } }
        if (boss) updBoss();
        if (ents.some(e => e.dead)) ents = ents.filter(e => !e.dead);
        // coins in the level (tiles) and loose ones
        const l = Math.floor((pl.x - HW) / TS), r = Math.floor((pl.x + HW - 1) / TS), t0 = Math.floor((pl.y - pl.h) / TS), b0 = Math.floor((pl.y - 1) / TS);
        for (let ty = t0; ty <= b0; ty++) for (let tx = l; tx <= r; tx++) {
          if (tx < 0 || ty < 0 || tx >= LV.w || ty >= LV.h) continue; const i = ty * LV.w + tx, it = LV.item[i]; if (!it) continue;
          if (it === 1) { const cx = tx * TS + 8, cy = ty * TS + 8; if (Math.abs(cx - pl.x) > HW + 3 || cy < pl.y - pl.h - 4 || cy > pl.y + 4) continue; }
          LV.item[i] = 0; const v = it === 2 ? 10 : 1; levelCoins += v; if (it === 2) { sfx.big(); pop('+10', tx * TS + 8, ty * TS); } else sfx.coin();
          part('spark', tx * TS + 8, ty * TS + 8, 0, 0, 12);
        }
        for (let i = coins.length - 1; i >= 0; i--) {
          const c = coins[i]; c.t++;
          c.vy = Math.min(c.vy + 0.2, 4); c.x += c.vx; if (isSolid(Math.floor(c.x / TS), Math.floor((c.y - 4) / TS))) { c.x -= c.vx; c.vx = -c.vx * 0.6; }
          if (moveY(c, c.vy, 3, 8)) { c.vy = c.vy > 1 ? -c.vy * 0.5 : 0; c.vx *= 0.8; }
          if (c.t > 16 && Math.abs(c.x - pl.x) < HW + 4 && c.y > pl.y - pl.h - 4 && c.y - 8 < pl.y && pl.st !== 'door') { levelCoins += c.val; sfx.coin(); coins.splice(i, 1); continue; }
          if ((c.life && c.t > c.life) || c.t > 600 || c.y > LV.h * TS + 20) coins.splice(i, 1);
        }
        // hazards: spikes, torches, water
        if (pl.st !== 'door') {
          const tl = Math.floor((pl.x - HW + 2) / TS), tr = Math.floor((pl.x + HW - 2) / TS);
          for (let tx = tl; tx <= tr; tx++) {
            const feet = tileAt(tx, Math.floor((pl.y - 3) / TS)), mid = tileAt(tx, Math.floor((pl.y - 12) / TS));
            if (feet === 9 && pl.st !== 'puff' && pl.st !== 'fire') { if (pl.inv <= 0) { hurt(pl.x - pl.face); pl.vy = -3.8; } else if (pl.vy > 0) pl.vy = -2.5; }
            if ((mid === 10 || feet === 10) && pl.st !== 'fire' && pl.st !== 'char') catchFire();
            if (feet === 11 || feet === 12) { if (pl.st === 'fire') { pl.st = 'n'; pl.t = 0; for (let i = 0; i < 4; i++) part('smoke', pl.x, pl.y - 10, (rnd() - 0.5) * 2, -1, 30); } fellOut(); break; }
          }
        }
        // signs
        sign = -1; for (let i = 0; i < LV.signs.length; i++) { const s = LV.signs[i]; if (Math.abs(s.x - pl.x) < 12 && Math.abs(s.y - pl.y) < 20) { sign = i; s.seen = true; } }
        // camera
        cam.look += (pl.face * 22 - cam.look) * 0.04;
        const tx = clamp(pl.x - W / 2 + cam.look, 0, LV.w * TS - W);
        cam.x += (tx - cam.x) * 0.15;
        const ground = pl.ground || pl.st === 'climb' || pl.st === 'puff' || pl.st === 'flat';
        const want = pl.y - 92, maxY = Math.max(0, LV.h * TS - VH);
        let ty = cam.y; if (ground) ty = want; if (pl.y - cam.y < 46) ty = pl.y - 46; if (pl.y - cam.y > 118) ty = pl.y - 118;
        cam.y += (clamp(ty, 0, maxY) - cam.y) * (ground ? 0.1 : 0.2);
        if (cam.shake > 0) cam.shake--;
        if (banner.t > 0) banner.t--;
        for (const p of parts) if (p.on) { p.t++; p.x += p.vx; p.y += p.vy; if (p.k === 'chunk' || p.k === 'flyc') p.vy += 0.22; if (p.k === 'star') p.vy += 0.08; if (p.t >= p.life) p.on = false; }
        for (const q of pops) q.t++;
        if (pops.length && pops[0].t > 50) pops.shift();
      }

      // ============================================================ the king (the last stage)
      function makeBoss(x, y) { return { x, y, vx: 0, vy: 0, face: -1, st: 'intro', t: 0, hp: 6, hw: 15, h: 30, flash: 0, ground: false, hits: 0, y0: y, legs: 0, leaps: 0 }; }
      function updBoss() {
        const b = boss; b.t++; if (b.flash > 0) b.flash--;
        const grav = () => { b.vy = Math.min(b.vy + 0.3, 6); const was = b.ground; b.ground = moveY(b, b.vy, b.hw, b.h); if (b.ground) { if (!was && b.vy > 3) { sfx.quake(); cam.shake = 10; if (b.st === 'leap') { if (pl.ground && pl.st !== 'door') { if (setState('dizzy')) pop('WOBBLE!', pl.x, pl.y - 34); } part('dust', b.x - 14, b.y - 2, -1, -0.3, 22); part('dust', b.x + 14, b.y - 2, 1, -0.3, 22); } } b.vy = 0; } };
        const toward = () => Math.sign(pl.x - b.x) || 1;
        switch (b.st) {
          case 'intro': // drops in from the ceiling
            if (b.t === 1) { b.y = b.y0 - 150; b.vy = 0; b.ground = false; }
            if (!b.ground) { b.vy = Math.min(b.vy + 0.3, 7); b.y += b.vy; if (b.y >= b.y0) { b.y = b.y0; b.vy = 0; b.ground = true; sfx.quake(); cam.shake = 12; part('dust', b.x - 14, b.y - 2, -1, -0.3, 22); part('dust', b.x + 14, b.y - 2, 1, -0.3, 22); } }
            if (b.t === 70) { sfx.oink(); pop('OINK!', b.x, b.y - 40); } if (b.t > 110) { b.st = 'walk'; b.t = 0; K.music(SONGS.boss); } break;
          case 'walk': { b.face = toward(); const far = Math.abs(pl.x - b.x) > 58; b.vx = far ? b.face * (b.hp <= 2 ? 0.8 : 0.55) : 0; moveX(b, b.vx, b.hw, b.h); grav(); b.legs += Math.abs(b.vx);
            if (b.t > (b.hp <= 2 ? 50 : 80) || (!far && b.t > 24)) { b.t = 0; b.st = b.hp <= 4 && (b.hits % 2 === 1 || b.hp <= 2) && b.leaps < (b.hp <= 2 ? 2 : 1) ? 'leap' : 'paw'; if (b.st === 'leap') { b.leaps = (b.leaps || 0) + 1; b.vy = -6.2; b.vx = clamp((pl.x - b.x) / 44, -2.4, 2.4); sfx.oink(); } else b.leaps = 0; }
            break; }
          case 'leap': moveX(b, b.vx, b.hw, b.h); grav(); if (b.ground && b.t > 4) { b.st = 'walk'; b.t = 0; b.vx = 0; } break;
          case 'paw': b.vx = 0; b.face = toward(); grav(); if (b.t % 10 === 0) { part('dust', b.x - b.face * 10, b.y - 2, -b.face * 0.8, -0.5, 16); K.sfx.noise(0.06, 0.08, 800); } if (b.t % 20 === 0) part('smoke', b.x + b.face * 16, b.y - 22, b.face * 0.5, -0.5, 26);
            if (b.t > (b.hp <= 2 ? 26 : 42)) { b.st = 'charge'; b.t = 0; sfx.oink(); } break;
          case 'charge': b.vx = b.face * (b.hp <= 2 ? 3.2 : b.hp <= 4 ? 2.8 : 2.4); grav(); b.legs += 3;
            if (b.t % 5 === 0) part('dust', b.x - b.face * 12, b.y - 2, -b.face * 0.6, -0.3, 14);
            if (moveX(b, b.vx, b.hw, b.h)) { b.st = 'dizzy'; b.t = 0; b.vx = -b.face * 1.5; b.vy = -2.5; sfx.bonk(); cam.shake = 12; pop('THUD!', b.x + b.face * 16, b.y - 30); }
            break;
          case 'dizzy': grav(); if (b.ground) b.vx *= 0.85; moveX(b, b.vx, b.hw, b.h); if (b.t % 14 === 0) part('star', b.x + Math.cos(b.t / 7) * 14, b.y - b.h - 8, 0, -0.3, 14);
            if (b.t > (b.hp <= 2 ? 120 : 150)) { b.st = 'walk'; b.t = 0; } break;
          case 'hurt': grav(); moveX(b, b.vx, b.hw, b.h); if (b.ground) b.vx *= 0.9; if (b.t > 40) { b.st = b.hp <= 0 ? 'faint' : 'walk'; b.t = 0; if (b.hp <= 0) { K.music(null); say('KING HOGSWORTH FAINTED!', 200, true); } } break;
          case 'faint': grav(); b.vx = 0; if (b.t % 20 === 0) part('star', b.x + Math.cos(b.t / 9) * 14, b.y - 18, 0, -0.3, 18);
            if (b.t === 60) { ents.push({ k: 'bag', x: b.x < W / 2 ? b.x + 40 : b.x - 40, y: 40, vy: 0, hw: 10, h: 18, st: 'fall', t: 0 }); sfx.big(); }
            break;
        }
        // Grabbo and the king
        if (b.st === 'faint' || b.st === 'intro' && b.t < 60) { /* */ }
        else if (pl.st !== 'door') {
          const me = { x: pl.x, y: pl.y, hw: HW, h: pl.h };
          if (overlap(me, b)) {
            const above = (pl.vy > 0 || pl.st === 'stomp') && pl.y - pl.vy <= b.y - b.h + 8;
            if (b.st === 'dizzy' && (above || pl.st === 'barge' || pl.st === 'fire')) {
              b.hp--; b.hits++; b.st = 'hurt'; b.t = 0; b.flash = 30; b.vx = (above ? toward() * -1 : pl.face) * 2; b.vy = -3.5; sfx.bowl(); sfx.oink(); cam.shake = 10;
              pop(b.hp > 0 ? ['OOF!', 'SQUEAL!', 'OW OW OW!', 'NOT THE CROWN!', 'OINK!'][b.hits % 5] : 'K.O.!', b.x, b.y - 40);
              for (let i = 0; i < 3; i++) coins.push({ x: b.x, y: b.y - 20, vx: (i - 1) * 1.4, vy: -3.5, t: 0, val: 10, h: 8, big: true });
              if (above) { pl.vy = -4.6; pl.st = 'n'; pl.t = 3; pl.ground = false; } else { pl.st = 'bonk'; pl.t = 0; pl.vx = -pl.face * 1.4; pl.vy = -2.6; }
            } else if (b.st !== 'hurt' && b.st !== 'dizzy') { hurt(b.x); pl.vx = (pl.x < b.x ? -1 : 1) * 2.4; }
            else if (b.st === 'dizzy' && pl.st === 'n') { pl.x += pl.x < b.x ? -1 : 1; }
          }
        }
      }
      function updBag(e) { // the king's treasure sack
        if (e.st === 'fall') { e.vy = Math.min(e.vy + 0.2, 4); if (moveY(e, e.vy, e.hw, e.h)) { e.st = 'sit'; sfx.land(); cam.shake = 4; } }
        if (e.st === 'sit' && overlap({ x: pl.x, y: pl.y, hw: HW, h: pl.h }, e)) { e.dead = true; K.secret('lk.grab.boss'); bossWon(); }
        if (e.t % 12 === 0) part('spark', e.x + (rnd() - 0.5) * 20, e.y - rnd() * 18, 0, -0.3, 18);
      }

      // ============================================================ drawing the level
      function drawLevel() {
        const sx = cam.shake ? Math.round((rnd() - 0.5) * cam.shake * 0.7) : 0, sy = cam.shake ? Math.round((rnd() - 0.5) * cam.shake * 0.7) : 0;
        const cx = Math.round(cam.x) + sx, cy = Math.round(cam.y) + sy;
        const th = THEMES[LV.theme];
        rect(0, HUDH, W, VH, th.sky);
        for (const b of BG) { const ox = ((Math.round(cx * b.fx) % 256) + 256) % 256, y = HUDH + b.y - Math.round(cy * 0.35); if (y > H || y + b.h < HUDH) continue; g.drawImage(b.c, -ox, y); g.drawImage(b.c, 256 - ox, y); }
        const x0 = Math.floor(cx / TS), y0 = Math.floor(cy / TS), x1 = Math.min(LV.w - 1, x0 + 10), y1 = Math.min(LV.h - 1, y0 + 9);
        const fr = K.frame;
        for (let ty = Math.max(0, y0); ty <= y1; ty++) for (let tx = Math.max(0, x0); tx <= x1; tx++) {
          const i = ty * LV.w + tx; let c = LV.cv[i]; const px = tx * TS - cx, py = ty * TS - cy + HUDH;
          if (c) {
            if (Array.isArray(c)) { const t = LV.t[i]; c = t === 11 ? c[(fr >> 3) % 4] : t === 12 ? c[(fr >> 5) % 2] : t === 10 ? c[(fr >> 3) % 2] : t === 7 ? c[(fr >> 4) % 2 && (fr % 64) < 16 ? 1 : 0] : c[0]; }
            let by = py; if (LV.bump && LV.bump.tx === tx && LV.bump.ty === ty) by -= LV.bump.t > 4 ? 8 - LV.bump.t : LV.bump.t;
            g.drawImage(c, px, by);
          }
          const it = LV.item[i];
          if (it === 1) { const f = COINSEQ[((fr >> 3) + tx + ty) % 6]; g.drawImage(COIN[f], px + 4, py + 3 + (((fr >> 4) + tx) % 2)); }
          else if (it === 2) g.drawImage(BIGCOIN[[0, 0, 0, 0, 1, 2, 1][((fr >> 3) + tx) % 7]], px, py);
          if (LV.t[i] === 15) { if (LV.theme === 'beach' || LV.theme === 'cliffs') g.drawImage(PALMTOP, px - 16, py - 2); else g.drawImage(TREETOP, px - 20, py - 18); }
        }
        // the palms/trees whose tops start off-screen above
        if (LV.bump && --LV.bump.t <= 0) LV.bump = null;
        // the goal door and signs
        if (LV.door) { const d = LV.door; g.drawImage(DOOR[d.open > 0.5 ? 1 : 0], d.x - 10 - cx, d.y - 32 - cy + HUDH); if (Math.abs(pl.x - d.x) < 24 && Math.abs(pl.y - d.y) < 8 && pl.st !== 'door' && (fr >> 4) % 2) g.drawImage(UPARROW, d.x - 5 - cx, d.y - 50 - cy + HUDH); }
        for (const s of LV.signs) { g.drawImage(SIGN, s.x - 8 - cx, s.y - 16 - cy + HUDH); if (!s.seen && (fr >> 4) % 2) g.drawImage(BUBBLE, s.x - 5 - cx, s.y - 30 - cy + HUDH); }
        // loose coins
        for (const c of coins) { if (c.life && c.t > c.life - 50 && (fr >> 2) % 2) continue; if (c.big) g.drawImage(BIGCOIN[0], c.x - 8 - cx, c.y - 14 - cy + HUDH); else g.drawImage(COIN[COINSEQ[((fr >> 2) + (c.x | 0)) % 6]], c.x - 4 - cx, c.y - 10 - cy + HUDH); }
        // things and baddies
        for (const e of ents) drawEnt(e, cx, cy);
        if (boss) drawBoss(cx, cy);
        drawGrabbo(cx, cy);
        if (pl.carry) drawEnt(pl.carry, cx, cy, true);
        // particles
        for (const p of parts) if (p.on) {
          const x = Math.round(p.x - cx), y = Math.round(p.y - cy) + HUDH;
          if (p.k === 'dust' || p.k === 'puff') g.drawImage(PUFFS[Math.min(2, Math.floor(p.t / p.life * 3))], x - 3, y - 3);
          else if (p.k === 'chunk') g.drawImage(CHUNK, x - 3, y - 3);
          else if (p.k === 'star') { if (p.t < p.life - 6 || (fr >> 1) % 2) g.drawImage(STAR, x - 3, y - 3); }
          else if (p.k === 'spark') g.drawImage(SPARK[(p.t >> 2) % 2], x - 2, y - 2);
          else if (p.k === 'smoke') g.drawImage(SMOKE[p.t > p.life / 2 ? 1 : 0], x - 4, y - 4);
          else if (p.k === 'ember') { g.fillStyle = P[(p.t >> 2) % 2 ? 0 : 3]; g.fillRect(x, y, 2, 2); }
          else if (p.k === 'flyc') g.drawImage(COIN[COINSEQ[(p.t >> 1) % 6]], x - 4, y - 5);
          else if (p.k === 'drop') g.drawImage(DROP, x - 2, y - 3);
        }
        for (const q of pops) { const y = Math.round(q.y - cy - Math.min(q.t, 20) * 0.6) + HUDH, w0 = F.width(q.s), x = clamp(Math.round(q.x - cx), w0 / 2 + 3, W - w0 / 2 - 3); if (q.t > 40 && (fr >> 1) % 2) continue; const w = F.width(q.s); rect(x - w / 2 - 2, y - 2, w + 3, 11, 3); F.draw(g, q.s, x - w / 2, y, P[0]); }
        drawHud();
        if (sign >= 0 && !paused) { const s = LV.signs[sign], lines = wrap(lab(s.s), 24), h = lines.length * 9 + 9, y = pl.y - cy > 80 ? HUDH + 4 : H - h - 2; box(2, y, W - 4, h); lines.forEach((l, i) => txt(l, 8, y + 5 + i * 9)); }
        if (banner.t > 0) { const lines = wrap(banner.s, 22), h = lines.length * 9 + 9; const y = banner.big ? 40 : HUDH + 14; if (banner.big || (fr >> 3) % 4 || banner.t > 30) { box(W / 2 - 74, y, 148, h); lines.forEach((l, i) => ctr(l, y + 5 + i * 9)); } }
        if (paused) {
          box(20, 36, 120, 76); ctr('PAUSED', 44); ctr(LV.def.name, 56, 2);
          txt((pauseSel === 0 ? '→' : ' ') + 'CARRY ON', 34, 72); txt((pauseSel === 1 ? '→' : ' ') + 'BACK TO MAP', 34, 84);
          ctr('START: CARRY ON', 98, 2);
        }
      }
      function drawEnt(e, cx, cy, held) {
        if (e.dead) return; const fr = K.frame;
        const x = Math.round(e.x - cx), y = Math.round(e.y - cy) + HUDH;
        if (e.k === 'key') { if (e.st === 'got') { if ((fr >> 1) % 2) g.drawImage(KEY, x - 8, y - 10 - Math.min(e.t, 20)); } else g.drawImage(KEY, x - 8, y - 10 + Math.round(Math.sin(fr / 12) * 2)); return; }
        if (e.k === 'chest') {
          g.drawImage(CHEST[e.st === 'open' ? 1 : 0], x - 9, y - 16);
          if (e.st === 'open' && e.t < 150) { const ty = y - 18 - Math.min(e.t, 40) * 0.5; g.drawImage(TREASURE_ART[Math.min(5, levelIdx)], x - 7, Math.round(ty) - 6); }
          return;
        }
        if (e.k === 'bag') { g.drawImage(MONEYBAG, x - 11, y - 20); return; }
        if (e.k === 'thump') { if (e.st === 'wait' || e.st === 'up') { for (let yy = e.top - 400; yy < e.y - 18; yy += 4) { if (yy - cy + HUDH < HUDH - 4) continue; rect(x - 1, Math.round(yy - cy) + HUDH, 2, 2, 3); } } else { for (let yy = e.top - 400; yy < e.top - 18; yy += 4) { if (yy - cy + HUDH < HUDH - 4) continue; rect(x - 1, Math.round(yy - cy) + HUDH, 2, 2, 3); } } g.drawImage(THUMP[e.st === 'fall' || e.st === 'rest' ? 1 : 0], x - 10, y - 18); return; }
        const sz = ESZ[e.k], f = e.k === 'ember' ? (fr >> 3) % 2 : e.k === 'bee' ? (fr >> 2) % 2 : e.k === 'gull' ? (e.sw ? 1 : (fr >> 4) % 2) : e.st === 'go' ? ((e.t >> 3) % 2) : 0;
        const dir = e.face > 0 ? 0 : 1;
        let set = ESPR[e.k];
        if (e.st === 'stun' || e.st === 'carried' || e.st === 'thrown' || (e.st === 'bowled' && (e.t >> 2) % 2)) set = ESPRV[e.k];
        if (e.flash > 0 && (fr >> 1) % 2) set = ESPRF[e.k];
        let ox = 0; if (e.st === 'stun' && e.t > 240) ox = (fr >> 1) % 2 ? 1 : -1;
        g.drawImage(set[f][dir], x - (sz[0] >> 1) + ox, y - sz[1]);
        if (e.k === 'guard' && e.st === 'go' && e.poke > 8 && e.poke < 34) { const sx2 = e.face > 0 ? x + 12 : x - 20; rect(sx2, y - 7, 8, 2, 3); rect(e.face > 0 ? sx2 + 8 : sx2 - 3, y - 9, 3, 6, 3); rect(e.face > 0 ? sx2 + 8 : sx2 - 2, y - 8, 2, 4, 0); }
        if (e.st === 'stun' && (fr >> 3) % 2) g.drawImage(STAR, x - 3 + Math.round(Math.cos(fr / 8) * 6), y - sz[1] - 6);
      }
      function drawGrabbo(cx, cy) {
        const st = pl.st, fr = K.frame, d = pl.face > 0 ? 0 : 1;
        if (pl.inv > 0 && st !== 'hurt' && (fr >> 1) % 2) return;
        let k = 'stand';
        const moving = Math.abs(pl.vx) > 0.2;
        if (st === 'n') {
          if (pl.throwT > 0) k = 'throw';
          else if (pl.carry) k = !pl.ground ? 'carry0' : moving ? ['carry1', 'carry0', 'carry2', 'carry0'][(fr >> 3) % 4] : 'carry0';
          else if (!pl.ground) k = pl.vy < 0 ? 'jump' : 'fall';
          else if (moving) k = ['walk0', 'walk1', 'walk2', 'walk1'][(fr >> 3) % 4];
          else k = (fr % 180) < 8 ? 'blink' : (fr >> 5) % 2 ? 'stand2' : 'stand';
        } else if (st === 'barge') k = (pl.t >> 2) % 2 ? 'barge1' : 'barge0';
        else if (st === 'stomp') k = 'stomp';
        else if (st === 'land') k = 'land';
        else if (st === 'hurt') k = 'hurt';
        else if (st === 'bonk') k = 'bonk';
        else if (st === 'dizzy') k = 'dizzy';
        else if (st === 'fire') k = pl.t < 26 ? 'hurt' : (fr >> 2) % 2 ? 'fire0' : 'fire1';
        else if (st === 'char') k = (fr % 60) < 6 ? 'char2' : 'char';
        else if (st === 'climb' || st === 'door') k = 'back';
        else if (st === 'flat') k = 'flat';
        else if (st === 'puff') k = 'puff';
        const x = Math.round(pl.x - cx), y = Math.round(pl.y - cy) + HUDH;
        if (k === 'flat') { const wob = pl.ground ? 0 : Math.round(Math.sin(pl.t / 6) * 2); g.drawImage(GSPR.flat[d], x - 18, y - 10 + wob); return; }
        if (k === 'puff') { const s = Math.round(Math.sin(pl.t / 10)); g.drawImage(GSPR.puff[d], x - 15, y - 28 + s); return; }
        if (k === 'back') { const fl = st === 'climb' ? ((pl.anim >> 3) % 2) : 0; if (st === 'door' && pl.t > 26) return; g.drawImage(GSPR.back[fl], x - 16, y - 32); return; }
        g.drawImage(GSPR[k][d], x - 16 + (d ? 0 : 0), y - 32);
        if (st === 'fire') { const fl = FLAMES[(fr >> 2) % 2]; g.drawImage(fl, x - 6 + (pl.face > 0 ? 1 : -1), y - 44); }
        if (st === 'barge' && (fr >> 1) % 2) { for (let i = 0; i < 3; i++) rect(x - pl.face * (16 + i * 5) - 2, y - 22 + i * 6, 4, 1, 3); }
      }
      function drawBoss(cx, cy) {
        const b = boss, fr = K.frame; const x = Math.round(b.x - cx), y = Math.round(b.y - cy) + HUDH;
        let f = b.st === 'dizzy' || b.st === 'faint' ? 'dizzy' : b.st === 'hurt' ? 'hurt' : b.st === 'charge' || b.st === 'paw' || b.st === 'leap' ? 'mad' : 'n';
        const l = (b.st === 'walk' || b.st === 'charge') ? ((b.legs >> 3) % 2) : 0;
        const set = KSPR[f + l + (b.flash > 0 && (fr >> 1) % 2 ? 'w' : '')], d = b.face > 0 ? 0 : 1;
        if (b.st === 'faint') { g.drawImage(KING_FLAT[d], x - 22, y - 34); return; }
        g.drawImage(set[d], x - 22, y - 36 + (b.st === 'paw' && (fr >> 2) % 2 ? 1 : 0));
      }
      function drawHud() {
        rect(0, 0, W, HUDH, 3);
        g.drawImage(HUDCOIN, 2, 1); txt('x' + String(levelCoins).padStart(3, '0'), 10, 2, 0);
        if (gotKey) g.drawImage(HUDKEY, 46, 2); if (gotTr) g.drawImage(HUDCHEST, 58, 1);
        if (boss) { txt('KING', 72, 2, 0); for (let i = 0; i < 6; i++) rect(98 + i * 9, 2, 7, 6, i < boss.hp ? 0 : 2); }
        else { const s = Math.floor(levelT / 60), tt = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); txt(LEVELS[levelIdx].name.split(' ')[0], 72, 2, 1); txt(tt, W - F.width(tt) - 2, 2, 0); }
      }

      // ============================================================ after a level: the tally, then the map
      function updClear() {
        clr.t++;
        if (clr.t === 30) pl.st = 'n';
        if (clr.t > 40 && clr.shown < levelCoins) { clr.shown = Math.min(levelCoins, clr.shown + Math.max(1, Math.ceil(levelCoins / 60))); if (clr.t % 3 === 0) K.sfx.tone(1200 + (clr.shown % 5) * 60, 0.03, 'square', 0.04); }
        if (clr.t > 60 && clr.shown >= levelCoins && (K.pressed('a') || K.pressed('start'))) fadeTo(() => toMap(true));
      }
      function drawClear() {
        rect(0, 0, W, H, 0);
        for (let y = 0; y < H; y += 8) for (let x = ((y >> 3) % 2) * 8; x < W; x += 16) rect(x, y, 8, 8, 1);
        box(10, 8, 140, 128);
        ctr('COURSE CLEAR!', 16); ctr(LEVELS[levelIdx].name, 27, 2);
        const fr = K.frame; g.drawImage(GSPR[(fr >> 4) % 2 ? 'win' : 'win2'][0], 64, 38);
        g.drawImage(HUDCOIN, 30, 77); txt('COINS', 40, 78); txt(String(clr.shown), 128 - F.width(String(clr.shown)), 78);
        const L = S.lv[levelIdx];
        txt('BEST', 40, 89, 2); txt(String(Math.max(L.c, levelCoins)), 128 - F.width(String(Math.max(L.c, levelCoins))), 89, 2);
        txt('TREASURE', 30, 102); if (gotTr || L.tr) { g.drawImage(TREASURE_ART[levelIdx], 113, 98); } else txt('???', 110, 102, 2);
        const s = Math.floor(levelT / 60); txt('TIME ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), 30, 114, 2);
        if (clr.t > 60 && clr.shown >= levelCoins && (fr >> 4) % 2) ctr('PRESS ' + K.label('a'), 124);
      }
      function toMap(cleared) {
        if (cleared) {
          const L = S.lv[levelIdx], first = !L.d; L.d = 1; L.c = Math.max(L.c, levelCoins); if (gotTr) L.tr = 1;
          if (first && levelIdx < 6) mp.go = levelIdx + 1;
          if (nTreasure(S) >= 6) K.secret('lk.grab.hoard');
        }
        S.at = levelIdx; persist(); if (cleared) report();
        LV = null; boss = null; enterMap();
      }

      // ============================================================ the island map
      const NODES = [[22, 92], [44, 62], [74, 80], [98, 50], [134, 92], [122, 26], [144, 18]];
      const NODE_NAMES = ['SANDY BAY', 'COCONUT CLIFFS', 'FUDGE FOREST', 'DRIPPY CAVE', 'SOGGY BISCUIT', 'CASTLE HOGSWORTH', 'THE KING\'S ROOM'];
      const PATHS = [[[22, 92], [30, 74], [44, 62]], [[44, 62], [58, 76], [74, 80]], [[74, 80], [92, 68], [98, 50]], [[98, 50], [118, 64], [124, 80], [134, 92]], [[134, 92], [142, 60], [122, 26]], [[122, 26], [134, 16], [144, 18]]];
      const mp = { at: 0, x: 22, y: 92, path: null, pi: 0, dir: 1, go: -1, menu: false, sel: 0, t: 0 };
      let MAPCV = null;
      function mapArt() {
        if (MAPCV) return MAPCV;
        const c = mkc(160, 134), x = c.getContext('2d'), p = (px, py, col, w, h) => { x.fillStyle = P[col]; x.fillRect(px, py, w || 1, h || 1); };
        p(0, 0, 0, 160, 134);
        for (let y = 0; y < 134; y += 6) for (let i = (y * 7) % 13; i < 160; i += 13) { p(i, y, 1, 3, 1); p(i + 1, y - 1, 1, 1, 1); }
        // the island: a lumpy blob
        const blobs = [[30, 86, 24, 20], [52, 66, 22, 18], [78, 76, 26, 20], [100, 52, 24, 22], [120, 34, 22, 18], [140, 24, 16, 14], [112, 74, 18, 14], [60, 92, 20, 12]];
        const inIsl = (px, py) => blobs.some(([bx, by, rx, ry]) => ((px - bx) / rx) ** 2 + ((py - by) / ry) ** 2 < 1);
        for (let py = 0; py < 134; py++) for (let px = 0; px < 160; px++) {
          if (!inIsl(px, py)) { if (inIsl(px + 2, py) || inIsl(px - 2, py) || inIsl(px, py + 2) || inIsl(px, py - 2)) p(px, py, (px + py) % 2 ? 0 : 1); continue; }
          const edge = !inIsl(px + 1, py) || !inIsl(px - 1, py) || !inIsl(px, py + 1) || !inIsl(px, py - 1), sand = !inIsl(px + 4, py + 2) || !inIsl(px - 4, py + 2) || !inIsl(px, py + 5);
          p(px, py, edge ? 3 : sand ? ((px * 3 + py) % 7 === 0 ? 1 : 0) : ((px * 5 + py * 3) % 11 === 0 ? 2 : 1));
        }
        // forest: tree blobs round node 2
        for (const [tx, ty] of [[66, 70], [72, 66], [80, 68], [86, 74], [64, 80], [84, 84], [70, 88]]) { for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++) { const d = Math.hypot(xx, yy); if (d < 4.3) p(tx + xx, ty + yy, d > 3.3 ? 3 : (xx < 0 && yy < 0) ? 1 : 2); } p(tx, ty + 5, 3, 1, 2); }
        // mountains with the cave
        for (const [mx, my, s] of [[92, 44, 16], [108, 42, 12], [100, 38, 14]]) for (let yy = 0; yy < s; yy++) { const w = yy; p(mx - w, my - s + yy, 3, 1, 1); p(mx + w, my - s + yy, 3, 1, 1); for (let xx = -w + 1; xx < w; xx++) p(mx + xx, my - s + yy, yy < 3 ? 0 : xx < 0 ? 1 : 2); }
        p(96, 44, 3, 5, 4); p(97, 43, 3, 3, 1);
        // palms on the beach
        for (const [tx, ty] of [[12, 82], [18, 100], [36, 100]]) { p(tx, ty, 3, 1, 6); p(tx - 3, ty - 1, 3, 7, 1); p(tx - 4, ty, 3, 1, 1); p(tx + 3, ty, 3, 1, 1); p(tx - 1, ty - 2, 3, 3, 1); }
        // cliffs
        for (let i = 0; i < 4; i++) { p(36 + i * 5, 52 + (i % 2) * 2, 3, 4, 1); p(37 + i * 5, 53 + (i % 2) * 2, 2, 2, 3); }
        // the shipwreck in the bay
        const ship = ['......3.......', '.....303......', '....30003.....', '...3000003....', '..300000003...', '......3.......', '3333333333333.', '32222222222223', '.322232232223.', '..3333333333..'];
        ship.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.') p(128 + xx, 94 + yy, +r[xx]); });
        // the castle
        const cas = ['3.3...3.3...3.3', '333...333...333', '303...303...303', '303333303333303', '300000000000003', '300030000030003', '300333000333003', '300333000333003', '300000333000003', '300003303300003', '333333333333333'];
        cas.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.') p(114 + xx, 8 + yy, +r[xx]); });
        p(119, 2, 3, 1, 6); p(120, 2, 3, 4, 1); p(120, 3, 0, 3, 1); p(120, 4, 3, 4, 1);
        // the king's tower
        const tw = ['3.3.3', '33333', '30003', '30303', '30003', '33333'];
        tw.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.') p(142 + xx, 8 + yy, +r[xx]); });
        return (MAPCV = c);
      }
      const unlocked = i => i === 0 || (S.lv[i - 1] && S.lv[i - 1].d);
      function enterMap() {
        mode = 'map'; mp.menu = false; mp.t = 0; mp.path = null; mp.at = clamp(S.at || 0, 0, 6); mp.x = NODES[mp.at][0]; mp.y = NODES[mp.at][1];
        K.music(SONGS.map);
        if (mp.go >= 0 && mp.go <= 6) { startWalk(mp.go); mp.go = -1; }
      }
      function startWalk(to) {
        if (to < 0 || to > 6 || to === mp.at || !unlocked(to)) return false;
        const fwd = to > mp.at, pts = fwd ? PATHS[mp.at] : PATHS[to].slice().reverse();
        mp.path = pts; mp.pi = 0; mp.to = to; return true;
      }
      function updMap() {
        mp.t++;
        if (mp.menu) {
          const items = ['CARRY ON', 'HOW TO PLAY', 'HIGH SCORES', 'SAVE & QUIT'];
          if (K.pressed('up')) { mp.sel = (mp.sel + 3) % 4; sfx.menu(); } if (K.pressed('down')) { mp.sel = (mp.sel + 1) % 4; sfx.menu(); }
          if (K.pressed('b') || K.pressed('start')) { mp.menu = false; sfx.menu(); }
          if (K.pressed('a')) { sfx.pick(); const it = items[mp.sel]; if (it === 'CARRY ON') mp.menu = false; else if (it === 'HOW TO PLAY') { how = { page: 0, back: 'map' }; mode = 'how'; } else if (it === 'HIGH SCORES') { scoresBack = 'map'; mode = 'scores'; } else { persist(); fadeTo(() => results(false)); } }
          return;
        }
        if (mp.path) {
          const [tx, ty] = mp.path[mp.pi + 1] || mp.path[mp.pi]; const dx = tx - mp.x, dy = ty - mp.y, d = Math.hypot(dx, dy);
          if (d < 1.2) { mp.x = tx; mp.y = ty; mp.pi++; if (mp.pi >= mp.path.length - 1) { mp.path = null; mp.at = mp.to; S.at = mp.at; persist(); K.sfx.tone(660, 0.05, 'square', 0.05); } }
          else { mp.x += dx / d * 1.1; mp.y += dy / d * 1.1; mp.face = dx < -0.1 ? -1 : dx > 0.1 ? 1 : mp.face; }
          return;
        }
        if (K.pressed('right') || K.pressed('up')) { if (startWalk(mp.at + 1)) sfx.menu(); else if (mp.at < 6) { sfx.locked(); } }
        if (K.pressed('left') || K.pressed('down')) { if (startWalk(mp.at - 1)) sfx.menu(); }
        if (K.pressed('start')) { mp.menu = true; mp.sel = 0; sfx.menu(); }
        if (K.pressed('a')) { sfx.pick(); const i = mp.at; fadeTo(() => loadLevel(i)); }
      }
      function drawMap() {
        g.drawImage(mapArt(), 0, HUDH);
        const fr = K.frame;
        // twinkling sea
        for (let i = 0; i < 6; i++) { const sx = (i * 53 + (fr >> 3)) % 160, sy = HUDH + 6 + ((i * 41) % 110); if (!(fr >> 4 & 1) ^ (i & 1)) rect(sx, sy, 2, 1, 1); }
        // paths: dotted lines (only the open ones)
        for (let i = 0; i < PATHS.length; i++) { if (!unlocked(i + 1)) continue; const pts = PATHS[i]; for (let j = 0; j < pts.length - 1; j++) { const [ax, ay] = pts[j], [bx, by] = pts[j + 1], n = Math.ceil(Math.hypot(bx - ax, by - ay) / 4); for (let k = 1; k < n; k++) rect(Math.round(ax + (bx - ax) * k / n) - 1, Math.round(ay + (by - ay) * k / n) - 1 + HUDH, 2, 2, 3); } }
        NODES.forEach(([nx, ny], i) => {
          const y = ny + HUDH, open = unlocked(i), L = S.lv[i];
          rect(nx - 4, y - 3, 8, 6, 3); rect(nx - 3, y - 4, 6, 8, 3); rect(nx - 3, y - 2, 6, 4, open ? (L.d ? 3 : 0) : 2); rect(nx - 2, y - 3, 4, 6, open ? (L.d ? 3 : 0) : 2);
          if (L.d) { rect(nx - 1, y - 2, 2, 4, 0); }
          if (L.tr) { rect(nx + 3, y - 9, 5, 4, 3); rect(nx + 4, y - 8, 3, 2, 1); }
          if (open && !L.d && (fr >> 4) % 2) rect(nx - 1, y - 1, 2, 2, 3);
        });
        // Grabbo on the map (a little him)
        const gx = Math.round(mp.x), gy = Math.round(mp.y) + HUDH, hop = mp.path ? ((fr >> 3) % 2) : 0;
        g.drawImage(MINI[mp.face < 0 ? 1 : 0], gx - 8, gy - 17 - hop);
        // the top bar and the info box
        rect(0, 0, W, HUDH, 3); txt(S.name, 2, 2, 0); const sc = String(score(S)); txt(sc, W - F.width(sc) - 2, 2, 0);
        box(0, H - 36, W, 36);
        const L = S.lv[mp.at];
        ctr(NODE_NAMES[mp.at], H - 30);
        if (mp.at === 6) ctr(S.boss ? 'THE KING IS BEATEN!' : (L.d ? '' : 'THE KING IS WAITING...'), H - 20, 2);
        else { g.drawImage(HUDCOIN, 12, H - 21); txt(L.c ? String(L.c) : '-', 21, H - 20); txt('TREASURE', 64, H - 20, 2); if (L.tr) g.drawImage(TREASURE_ART[mp.at], 116, H - 24); else txt('???', 116, H - 20, 2); }
        if ((fr >> 5) % 2) ctr(K.label('a') + ': GO   START: MENU', H - 11, 2); else ctr('TREASURES ' + nTreasure(S) + '/6', H - 11, 2);
        if (mp.menu) { box(28, 30, 104, 60); ['CARRY ON', 'HOW TO PLAY', 'HIGH SCORES', 'SAVE & QUIT'].forEach((s, i) => txt((i === mp.sel ? '→' : ' ') + s, 36, 38 + i * 12)); }
      }
      const MINI = both(paint(16, 18, [[0, 0, [[4, 0, '333333'], [3, 1, '30000113'], [2, 2, '3000011113'], [1, 3, '322222222223'], [1, 4, '311111111111133'.slice(0, 13)], [1, 5, '333333333333'], [2, 6, '3100303001113'.slice(0, 12)], [2, 7, '30000301111133'.slice(0, 13)],
        [2, 8, '3003333333333'], [2, 9, '3033300033'], [2, 10, '333333333'], [1, 11, '3112222113'], [0, 12, '30122222103'], [1, 13, '3222222223'], [1, 14, '3333..3333'], [1, 15, '3223..3223'], [1, 16, '3333..3333']]]]));

      // ============================================================ title, name entry, how to play, high scores, results, ending
      let tsel = 0, how = { page: 0, back: 'title' }, scoresBack = 'title', confirmNew = false;
      const nm = { s: 'JACK', cx: 0, cy: 0, def: 0 };
      const KEYS = ['ABCDEFGH', 'IJKLMNOP', 'QRSTUVWX', 'YZ!2? ', '← END'];
      let LOGO = null;
      function logoArt() { // GRABBO in big bevelled block letters: the 5x7 font drawn small, read back, scaled up by hand
        if (LOGO) return LOGO;
        const word = 'GRABBO', s = 3, sw = word.length * 6, shh = 8;
        const tmp = mkc(sw, shh), tx = tmp.getContext('2d'); F.draw(tx, word, 0, 0, '#000', 1);
        const small = new Uint8Array(sw * shh);
        if (tmp.px) { for (let i = 0; i < sw * shh; i++) small[i] = (tmp.px[i] >>> 24) ? 1 : 0; }
        else { const id = tx.getImageData(0, 0, sw, shh).data; for (let i = 0; i < sw * shh; i++) small[i] = id[i * 4 + 3] > 127 ? 1 : 0; }
        const c = mkc(sw * s + 8, 7 * s + 8), x = c.getContext('2d');
        const at = (px, py) => { const sx = Math.floor((px - 3) / s), sy = Math.floor((py - 3) / s); return sx >= 0 && sy >= 0 && sx < sw && sy < 7 && !!small[sy * sw + sx]; };
        for (let py = 0; py < c.height; py++) for (let px = 0; px < c.width; px++) {
          if (at(px, py)) { const top = !at(px, py - 1), left = !at(px - 1, py), bot = !at(px, py + 1), right = !at(px + 1, py); x.fillStyle = P[top || left ? 0 : bot || right ? 2 : ((py % s) < s / 2 ? 0 : 1)]; x.fillRect(px, py, 1, 1); }
          else if (at(px - 1, py - 1) || at(px - 2, py - 2) || at(px - 1, py) || at(px, py - 1) || at(px + 1, py) || at(px, py + 1) || at(px - 1, py - 2) || at(px - 2, py - 1)) { x.fillStyle = P[3]; x.fillRect(px, py, 1, 1); }
        }
        return (LOGO = c);
      }
      function updTitle() {
        const items = hadSaveNow() ? ['CONTINUE', 'NEW GAME', 'HIGH SCORES', 'HOW TO PLAY'] : ['NEW GAME', 'HIGH SCORES', 'HOW TO PLAY'];
        if (confirmNew) {
          if (K.pressed('up') || K.pressed('down') || K.pressed('left') || K.pressed('right')) { tsel = 1 - tsel; sfx.menu(); }
          if (K.pressed('b')) { confirmNew = false; tsel = 1; sfx.menu(); }
          if (K.pressed('a') || K.pressed('start')) { sfx.pick(); if (tsel === 0) { confirmNew = false; startName(); } else { confirmNew = false; tsel = 1; } }
          return;
        }
        if (!titleIn) { if (K.pressed('start') || K.pressed('a')) { titleIn = true; tsel = 0; sfx.pick(); } return; }
        if (K.pressed('up')) { tsel = (tsel + items.length - 1) % items.length; sfx.menu(); } if (K.pressed('down')) { tsel = (tsel + 1) % items.length; sfx.menu(); }
        if (K.pressed('b')) { titleIn = false; sfx.menu(); }
        if (K.pressed('a') || K.pressed('start')) {
          sfx.pick(); const it = items[tsel];
          if (it === 'CONTINUE') fadeTo(() => { S = K.load() || S; HI = S.hi || HI; enterMap(); });
          else if (it === 'NEW GAME') { if (hadSaveNow()) { confirmNew = true; tsel = 1; } else startName(); }
          else if (it === 'HIGH SCORES') { scoresBack = 'title'; mode = 'scores'; }
          else { how = { page: 0, back: 'title' }; mode = 'how'; }
        }
      }
      let titleIn = false;
      const hadSaveNow = () => { const s = K.load(); return !!(s && s.lv && (s.lv.some(l => l.d) || s.at > 0)); };
      function startName() { nm.def = Math.floor(Math.random() * NAMES.length); nm.s = NAMES[nm.def]; nm.cx = 0; nm.cy = 4; nm.fresh = true; mode = 'name'; }
      function updName() {
        if (K.pressed('select')) { nm.def = (nm.def + 1) % NAMES.length; nm.s = NAMES[nm.def]; nm.fresh = true; sfx.menu(); }
        if (K.pressed('up')) { nm.cy = (nm.cy + 4) % 5; sfx.menu(); } if (K.pressed('down')) { nm.cy = (nm.cy + 1) % 5; sfx.menu(); }
        if (K.pressed('left')) { nm.cx = (nm.cx + 7) % 8; sfx.menu(); } if (K.pressed('right')) { nm.cx = (nm.cx + 1) % 8; sfx.menu(); }
        const row = KEYS[nm.cy]; let ch = nm.cy === 4 ? (nm.cx < 4 ? 'DEL' : 'END') : (row[nm.cx] || null);
        if (nm.cy === 3 && nm.cx >= row.length) ch = null;
        const del = () => { nm.s = nm.s.slice(0, -1); nm.fresh = false; sfx.menu(); };
        if (K.pressed('b')) del();
        if (K.pressed('start') || (K.pressed('a') && ch === 'END')) { if (!nm.s.trim()) nm.s = 'GRABBO'; sfx.pick(); newGame(nm.s.trim().slice(0, 8)); return; }
        if (K.pressed('a') && ch) { if (ch === 'DEL') del(); else { if (nm.fresh) { nm.s = ''; nm.fresh = false; } if (nm.s.length < 8) { nm.s += ch; K.sfx.tone(1000, 0.04, 'square', 0.05); } if (nm.s.length >= 8) { nm.cy = 4; nm.cx = 5; } } }
      }
      function newGame(name) {
        const keepHi = HI; S = blank(); S.name = name; HI = keepHi; lastRep = { t: K.t, sc: 0 }; lastRep.t = 0;
        persist(); fadeTo(() => { enterMap(); story = 90; });
      }
      let story = 0;
      function drawName() {
        rect(0, 0, W, H, 0); box(4, 4, 152, 28); ctr('WHO IS PLAYING?', 10, 2);
        const s = nm.s + ((K.frame >> 4) % 2 && nm.s.length < 8 ? '_' : ''); ctr(s, 20);
        for (let r = 0; r < 5; r++) { const row = KEYS[r]; if (r === 4) { txt((nm.cy === 4 && nm.cx < 4 ? '→' : ' ') + 'DEL', 24, 46 + r * 14); txt((nm.cy === 4 && nm.cx >= 4 ? '→' : ' ') + 'END', 92, 46 + r * 14); continue; }
          for (let c = 0; c < row.length; c++) { const x = 14 + c * 17, y = 46 + r * 14; if (nm.cy === r && nm.cx === c) { rect(x - 3, y - 3, 13, 13, 3); F.draw(g, row[c] === ' ' ? '_' : row[c], x + 1, y, P[0]); } else txt(row[c] === ' ' ? '_' : row[c], x + 1, y); } }
        txt('SELECT: SILLY NAME', 8, 122, 2); txt('START: DONE', 8, 132, 2);
      }
      function updHow() { if (K.pressed('a') || K.pressed('right')) { sfx.menu(); how.page++; if (how.page > 2) mode = how.back; } if (K.pressed('b') || K.pressed('left')) { sfx.menu(); if (how.page > 0) how.page--; else mode = how.back; } }
      function drawHow() {
        rect(0, 0, W, H, 0); box(0, 0, W, H); ctr('HOW TO PLAY ' + (how.page + 1) + '/3', 7, 2);
        const fr = K.frame, A = K.label('a'), B = K.label('b'), X = 40;
        if (how.page === 0) {
          g.drawImage(GSPR[['walk0', 'walk1', 'walk2', 'walk1'][(fr >> 3) % 4]][0], 4, 16); txt('ARROWS: WALK', X, 22); txt(A + ': JUMP', X, 32);
          g.drawImage(GSPR[(fr >> 2) % 2 ? 'barge0' : 'barge1'][0], 4, 44); txt(B + ': BARGE! SMASH', X, 50); txt('BLOCKS AND BOWL', X, 59); txt('BADDIES OVER', X, 68);
          g.drawImage(GSPR.stomp[0], 4, 74); txt('DOWN IN THE AIR:', X, 80); txt('BUTT-STOMP THROUGH', X, 89); txt('CRACKED FLOORS', X, 98);
          g.drawImage(GSPR.back[(fr >> 4) % 2], 4, 102); txt('UP: LADDERS, DOORS', X, 110); txt('START: PAUSE', X, 119);
          txt('ARROWS: PAGE  ' + A + ': NEXT', 14, 131, 2);
        } else if (how.page === 1) {
          g.drawImage(ESPRV.crab[0][0], 10, 26); txt('JUMP ON A BADDIE', X, 20); txt('TO BONK IT. WALK', X, 29); txt('INTO IT TO PICK IT', X, 38); txt('UP, ' + B + ' THROWS IT!', X, 47);
          g.drawImage(HUDCOIN, 14, 66); txt('GET HURT AND YOU', X, 62); txt('DROP COINS. GRAB', X, 71); txt('THEM BACK, QUICK!', X, 80);
          g.drawImage(KEY, 8, 97); txt('EVERY LEVEL HIDES', X, 94); txt('A KEY AND A CHEST', X, 103); txt('FIND ALL SIX!', X, 112);
          txt('ARROWS: PAGE  ' + A + ': NEXT', 14, 131, 2);
        } else {
          g.drawImage(GSPR.puff[0], 4, 14); txt('BEES PUFF YOU UP:', X, 18); txt('FLOAT TO HIGH BITS', X, 27); txt(A + ' LETS THE AIR OUT', X, 36);
          g.drawImage(GSPR.fire0[0], 4, 50); g.drawImage(FLAMES[(fr >> 2) % 2], 15, 38); txt('FLAMES MAKE YOU', X, 54); txt('RUN ABOUT. YOU CAN', X, 63); txt('SMASH FIRE BLOCKS!', X, 72);
          g.drawImage(GSPR.flat[0], 2, 92); txt('WEIGHTS SQUASH YOU', X, 86); txt('FLAT: FLUTTER DOWN', X, 95); txt('AND SLIDE UNDER', X, 104); txt('TINY GAPS', X, 113);
          ctr('YOU NEVER DIE. GREED!', 126, 2);
        }
      }
      function updScores() { if (K.pressed('a') || K.pressed('b') || K.pressed('start')) { sfx.menu(); mode = scoresBack; } }
      function drawScores(hl) {
        rect(0, 0, W, H, 0); box(0, 0, W, H); ctr('BEST GRABBERS', 9); g.drawImage(MONEYBAG, 4, 2); g.drawImage(MONEYBAG, W - 26, 2);
        const list = HI.slice(0, 8);
        list.forEach((e, i) => { const y = 32 + i * 12, me = hl && e === hl; if (me && (K.frame >> 3) % 2) rect(8, y - 2, 144, 11, 1); txt((i + 1) + '.', 14, y, me ? 3 : 2); txt(e.n, 32, y); const s = String(e.s); txt(s, 146 - F.width(s), y); });
        if (mode === 'scores') ctr('PRESS ' + K.label('a'), 132, 2);
      }
      // the end of a go: the score, the table, and then the runtime's score card
      let res = null;
      function results(won) {
        const sc = score(S);
        let me = HI.find(e => e.f && e.f === S.fid);
        if (!S.fid) S.fid = Math.random().toString(36).slice(2, 8);
        if (!me) { me = { n: S.name, s: sc, f: S.fid }; HI.push(me); } else { me.s = Math.max(me.s, sc); me.n = S.name; }
        HI.sort((a, b) => b.s - a.s); if (HI.length > 8) HI = HI.filter((e, i) => i < 8 || e === me).slice(0, 9);
        persist();
        res = { t: 0, sc, won, me, rank: HI.indexOf(me) + 1 };
        mode = 'results'; K.music(won ? SONGS.ending : SONGS.title);
      }
      function updResults() {
        res.t++;
        const ready = K.t >= safeAt(res.sc);
        if (res.t > 60 && ready && (K.pressed('a') || K.pressed('start'))) {
          const cl = S.lv.slice(0, 6).filter(l => l.d).length, coinsAll = S.lv.reduce((a, l) => a + l.c, 0);
          K.over(res.sc, { title: res.won ? 'GRABBO LAND COMPLETE!' : 'SAVED! SEE YOU SOON, GRABBO', text: `${cl}/6 LEVELS  ${nTreasure(S)}/6 TREASURES  ${coinsAll} COINS${S.boss ? '  KING BEATEN!' : ''}` });
          mode = 'over';
        }
      }
      function drawResults() {
        if (res.t < 150) {
          rect(0, 0, W, H, 0); box(6, 6, 148, 132); ctr(res.won ? 'WHAT A HAUL!' : 'GAME SAVED', 14); ctr(S.name, 25, 2);
          const L = S.lv, coinsAll = L.reduce((a, l) => a + l.c, 0), cl = L.filter(l => l.d).length;
          const rows = [['COINS', coinsAll], ['TREASURES x500', nTreasure(S) * 500], ['LEVELS x150', cl * 150], ['THE KING', S.boss ? 3000 : 0]];
          rows.forEach(([a, b], i) => { if (res.t < 20 + i * 18) return; txt(a, 16, 44 + i * 13); const s = String(b); txt(s, 144 - F.width(s), 44 + i * 13); });
          if (res.t > 100) { rect(16, 98, 128, 1, 3); txt('TOTAL', 16, 104); const s = String(res.sc); txt(s, 144 - F.width(s), 104); }
          for (let i = 0; i < 6; i++) if (S.lv[i].tr) g.drawImage(TREASURE_ART[i], 13 + i * 23, 118);
          return;
        }
        drawScores(res.me);
        if (res.t > 60) { const ready = K.t >= safeAt(res.sc); if (ready) { if ((K.frame >> 4) % 2) ctr('PRESS ' + K.label('a'), 132, 3); } else { const k = clamp(1 - (safeAt(res.sc) - K.t) / Math.max(1, safeAt(res.sc) - lastRep.t), 0, 1); txt('SAVING', 20, 132, 2); rect(60, 133, 80, 5, 3); rect(61, 134, Math.round(78 * k), 3, 1); } }
      }
      function bossWon() { S.boss = 1; S.lv[6].d = 1; S.lv[6].c = Math.max(S.lv[6].c, levelCoins); persist(); report(); K.music(null); sfx.treasure(); ending = { t: 0 }; setTimeout0(() => fadeTo(() => { mode = 'ending'; K.music(SONGS.ending); })); }
      const later = []; const setTimeout0 = f => later.push([K.t + 2.2, f]);
      const HOUSES = [[0, 'A BIRD HOUSE'], [600, 'A GARDEN SHED'], [1100, 'A BEACH HUT'], [1600, 'A BIG POSH HOUSE'], [2200, 'HIS VERY OWN CASTLE!']];
      function updEnding() { ending.t++; if (ending.t > 420 && (K.pressed('a') || K.pressed('start'))) fadeTo(() => results(true)); }
      function drawEnding() {
        const t = ending.t, fr = K.frame; rect(0, 0, W, H, 0);
        const coinsAll = S.lv.reduce((a, l) => a + l.c, 0); let hi = 0; for (let i = 0; i < HOUSES.length; i++) if (coinsAll >= HOUSES[i][0]) hi = i;
        for (let i = 0; i < 12; i++) { const x = (i * 37 + t) % 170 - 5, y = (i * 23 + t * (1 + i % 3)) % 150; g.drawImage(COIN[COINSEQ[((fr >> 2) + i) % 6]], x, y - 10); }
        if (t < 200) { box(10, 10, 140, 40); ctr('GRABBO GRABBED', 18); ctr('THE KING\'S TREASURE!', 28); ctr('THE ISLAND IS HIS!', 38, 2); g.drawImage(GSPR[(fr >> 4) % 2 ? 'carry0' : 'carry1'][0], 64, 84); g.drawImage(MONEYBAG, 69, 62 + ((fr >> 4) % 2)); rect(0, 116, W, 28, 1); rect(0, 116, W, 1, 3); return; }
        box(4, 6, 152, 44); ctr('WITH ' + coinsAll + ' COINS', 14); ctr('GRABBO BOUGHT...', 25); if (t > 260) ctr(HOUSES[hi][1], 37, 2);
        rect(0, 116, W, 28, 1); rect(0, 116, W, 1, 3);
        if (t > 260) drawHouse(hi, 80, 116);
        g.drawImage(GSPR[(fr >> 4) % 2 ? 'win' : 'win2'][1], 118, 86);
        if (t > 420 && (fr >> 4) % 2) ctr('THE END   PRESS ' + K.label('a'), 132, 3);
      }
      function drawHouse(n, cx, by) {
        const R = (x, y, w, h, c) => rect(cx + x, by + y, w, h, c);
        if (n === 0) { R(-1, -40, 2, 40, 3); R(-10, -54, 20, 14, 3); R(-9, -53, 18, 12, 0); R(-12, -58, 24, 4, 3); R(-2, -50, 4, 4, 3); }
        else if (n === 1) { R(-20, -28, 40, 28, 3); R(-19, -27, 38, 27, 1); R(-22, -34, 44, 6, 3); R(-5, -18, 10, 18, 3); R(-4, -17, 8, 17, 2); for (let i = -18; i < 18; i += 6) R(i, -27, 1, 9, 2); }
        else if (n === 2) { R(-24, -32, 48, 32, 3); R(-23, -31, 46, 31, 0); for (let i = -22; i < 22; i += 4) R(i, -31, 2, 31, 1); R(-28, -42, 56, 10, 3); R(-26, -41, 52, 8, 2); R(-6, -20, 12, 20, 3); R(-18, -24, 8, 8, 3); R(10, -24, 8, 8, 3); }
        else if (n === 3) { R(-36, -44, 72, 44, 3); R(-35, -43, 70, 43, 0); R(-40, -56, 80, 12, 3); R(-38, -55, 76, 10, 2); for (let i = -30; i < 30; i += 14) { R(i, -38, 9, 9, 3); R(i + 1, -37, 7, 7, 1); R(i, -22, 9, 9, 3); R(i + 1, -21, 7, 7, 1); } R(-6, -18, 12, 18, 3); R(24, -66, 6, 10, 3); }
        else { R(-44, -50, 88, 50, 3); R(-43, -49, 86, 49, 1); for (let i = -44; i < 44; i += 8) R(i, -56, 5, 6, 3); for (const sx of [-50, 34]) { R(sx, -72, 16, 72, 3); R(sx + 1, -71, 14, 71, 0); for (let i = 0; i < 16; i += 5) R(sx + i, -78, 3, 6, 3); R(sx + 5, -60, 6, 8, 3); } R(-10, -28, 20, 28, 3); R(-9, -27, 18, 27, 2); R(-1, -92, 2, 20, 3); R(1, -92, 10, 6, 3); R(2, -91, 8, 4, 0); }
      }

      // ============================================================ the title screen
      function drawTitle() {
        const fr = K.frame, t = K.t;
        rect(0, 0, W, H, 0);
        // sky, a far sea, the beach
        for (let y = 64; y < 78; y += 2) rect(0, y, W, 1, 1);
        rect(0, 78, W, 26, 1); for (let i = 0; i < 12; i++) rect(((i * 37 + (fr >> 2)) % 176) - 8, 82 + (i * 7) % 20, 6, 1, 0);
        rect(0, 104, W, 40, 0); rect(0, 104, W, 1, 2); for (let i = 0; i < 16; i++) rect((i * 23) % 160, 110 + (i * 11) % 24, 1, 1, 2);
        // a big golden heap on the left with Grabbo on top
        for (let y = 0; y < 22; y++) { const w = Math.round(Math.sqrt(Math.max(0, 484 - (22 - y) * (22 - y))) * 1.5); rect(44 - w, 112 + y - 2, w * 2, 1, 3); rect(44 - w + 1, 112 + y - 1, w * 2 - 2, 1, (y % 3 === 0) ? 0 : 1); }
        for (let i = 0; i < 10; i++) { const x = 14 + (i * 29) % 58, y = 114 + (i * 13) % 16; g.drawImage(COIN[COINSEQ[((fr >> 3) + i) % 6]], x, y); }
        g.drawImage(TREASURE_ART[1], 8, 120); g.drawImage(TREASURE_ART[3], 66, 118);
        const big = GSPR[(fr % 200) < 8 ? 'blink' : (fr >> 5) % 2 ? 'stand' : 'stand2'][0];
        g.drawImage(big, 0, 0, 32, 32, 12, 52, 64, 64);
        // the logo
        const L = logoArt(), ly = 6 + Math.round(Math.sin(t * 2) * 1.5);
        g.drawImage(L, (W - L.width) / 2, ly);
        rect(52, ly + 29, 56, 11, 3); rect(53, ly + 30, 54, 9, 0); ctr('L A N D', ly + 31, 3);
        // falling coins
        for (let i = 0; i < 5; i++) { const x = 90 + (i * 41 + 13) % 60, y = ((t * 40 + i * 37) % 90) - 10; g.drawImage(COIN[COINSEQ[((fr >> 2) + i) % 6]], x, Math.round(y) + 44); }
        rect(0, 135, W, 9, 3); ctr('(C) 1999 GREEDY GOBLIN', 136, 0);
        if (confirmNew) { box(10, 44, 140, 54); ctr('START A NEW GAME?', 52); ctr('YOUR OLD FILE', 63, 2); ctr('WILL BE WIPED!', 72, 2); txt((tsel === 0 ? '→' : ' ') + 'YES', 34, 85); txt((tsel === 1 ? '→' : ' ') + 'NO', 94, 85); return; }
        if (!titleIn) { if ((fr >> 5) % 2) { box(78, 108, 78, 17); ctr('PRESS START', 113, 3, 117); } return; }
        const items = hadSaveNow() ? ['CONTINUE', 'NEW GAME', 'HIGH SCORES', 'HOW TO PLAY'] : ['NEW GAME', 'HIGH SCORES', 'HOW TO PLAY'];
        const h = items.length * 11 + 8; box(78, 130 - h, 80, h);
        items.forEach((s, i) => txt((i === tsel ? '→' : ' ') + s, 84, 135 - h + i * 11));
      }

      // ============================================================ the runtime hooks
      K.music(SONGS.title);
      const step = () => {
        for (let i = later.length - 1; i >= 0; i--) if (K.t >= later[i][0]) { const f = later[i][1]; later.splice(i, 1); f(); }
        if (fadeStep()) return;
        if (S && (mode === 'level' || mode === 'map')) S.play = (S.play || 0) + 1 / 60;
        switch (mode) {
          case 'title': updTitle(); break;
          case 'name': updName(); break;
          case 'how': updHow(); break;
          case 'scores': updScores(); break;
          case 'map': if (story > 0) { story--; if (K.pressed('a') || K.pressed('start')) story = 0; break; } updMap(); break;
          case 'level': updLevel(); break;
          case 'clear': updClear(); break;
          case 'ending': updEnding(); break;
          case 'results': updResults(); break;
        }
      };
      K.dbg = {
        get S() { return S; }, set S(v) { S = v; }, pl, get LV() { return LV; }, get mode() { return mode; }, get ents() { return ents; }, get boss() { return boss; }, mp, get levelCoins() { return levelCoins; }, set levelCoins(v) { levelCoins = v; },
        get gotKey() { return gotKey; }, set gotKey(v) { gotKey = v; }, get HI() { return HI; }, get res() { return res; }, cam, LEVELS, score: () => score(S), lastRep,
        warp(i, x, y) { if (!S) { S = blank(); persist(); } loadLevel(i); if (x != null) { pl.x = pl.safeX = x * TS + 8; pl.y = pl.safeY = (y + 1) * TS; cam.x = clamp(pl.x - W / 2, 0, LV.w * TS - W); cam.y = clamp(pl.y - 92, 0, Math.max(0, LV.h * TS - VH)); } }, clearBaddies() { ents = ents.filter(e => e.k === 'key' || e.k === 'chest' || e.k === 'bag'); },
        map() { if (!S) { S = blank(); persist(); } enterMap(); }, results, done: () => levelDone(), toMap,
      };
      return {
        update() { step(); },
        draw() {
          K.hud.clearRect(0, 0, W, H);
          switch (mode) {
            case 'title': drawTitle(); break;
            case 'name': drawName(); break;
            case 'how': drawHow(); break;
            case 'scores': drawScores(null); break;
            case 'map': drawMap(); if (story > 0) { box(8, 30, 144, 60); ['KING HOGSWORTH HAS', 'PINCHED ALL THE', 'ISLAND\'S TREASURE.', 'GRABBO WANTS IT. ALL.'].forEach((l, i) => ctr(l, 38 + i * 11, i === 3 ? 3 : 2)); } break;
            case 'level': drawLevel(); break;
            case 'clear': drawClear(); break;
            case 'ending': drawEnding(); break;
            case 'results': case 'over': if (res) drawResults(); break;
          }
          fadeDraw();
        },
        end() { if (S) persist(); },
      };
    },
  });
})();

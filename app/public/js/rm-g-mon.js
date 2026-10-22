/* POCKET CRITTERS: MOSS VERSION (Game Boy, in Jack's room). Pick a starter critter at Professor Bramble's lab, walk the
 * long grass of Route 1 and the Whispering Woods, catch wild critters in Critter Cubes, beat Jack's mates in battles and
 * win the Moss Badge from Hazel at the Moss Town Gym. 16 original critters, six types, levels, evolutions, a Critterdex.
 * Arrows walk, A (Z) talks and picks, B (X) goes back, Start (Enter) opens the menu (Critterdex, Party, Bag, Save).
 * The game saves itself (K.save, key rm.gb.mon): CONTINUE on the title screen. Everything here is original. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;

  // ================================================================ critters, moves and types: the shared rule book (js/lk-crit.js,
  // also read by the server's Cable Club referee, mods/lk.js)
  const LC = window.LkCrit; if (!LC) return;
  try { if (window.Apps && Apps.defineSecret && !(Apps.secrets && Apps.secrets['rm.mon.bay'])) Apps.defineSecret('rm.mon.bay', 'Splash Badge', 'There is a second gym in Pocket Critters, out past the cave.'); } catch (e) {} // (G)
  const { TYPES, CHART, eff, MOVES, NSP, stat, maxhp, expAt, movesAt } = LC;
  // ---- (G) THE FUNNY CRITTERS: a display layer over the shared rule book. Same ids, types, stats, learnsets, evolutions and
  // catch rates (so saves and the link cable are untouched): only the name, the Critterdex words, the art and a Game Boy
  // Color palette per critter change. [light, colour, dark, outline]; art: 1 colour, 2 dark, 3 outline, 4 light.
  const FUNNY = {
    0: ['CRESSHEAD', 'My Year 7 science project. I drew a face on an eggshell and grew cress for hair. Then it got up and walked off.', ['#f8f0d8', '#58b848', '#287028'],
      D => { D.e(16, 21, 8, 10, 4); for (let x = 9; x <= 23; x += 2) { const k = (x >> 1) % 3 - 1, top = 4 + (x * 7) % 4; D.l(x, 13, x + k, top, 1); D.p(x + k - 1, top, 1); D.p(x + k + 1, top + 1, 1); } D.r(8, 12, 17, 2, 1); D.eye(12, 18); D.eye(18, 18); D.l(13, 24, 18, 24, 3); D.p(12, 23, 3); D.p(19, 23, 3); D.e(12, 31, 3, 1, 2); D.e(20, 31, 3, 1, 2); }],
    1: ['CRESSAURUS', 'A CRESSHEAD that ate too much compost. Its hair needs mowing every Sunday. Mom makes it sleep in the shed.', ['#f8f0d8', '#58b848', '#287028'],
      D => { D.e(16, 22, 11, 9, 4); D.e(16, 12, 12, 6, 1); for (let i = 0; i < 7; i++) D.t(6 + i * 3.4, 10, 8 + i * 3.4, 1 + (i % 2) * 2, 10 + i * 3.4, 10, 1); D.eye(11, 17); D.eye(19, 17); D.r(11, 24, 10, 2, 3); D.p(12, 24, 4); D.p(15, 24, 4); D.p(18, 24, 4); D.e(4, 22, 3, 2, 4); D.e(28, 22, 3, 2, 4); D.e(10, 31, 4, 1.5, 2); D.e(22, 31, 4, 1.5, 2); }],
    2: ['WELLYBOB', 'A lost welly boot full of rainwater. It squelches when it walks. Nobody has ever found the other one.', ['#b0e0f8', '#f0c828', '#a07810'],
      D => { D.r(9, 6, 11, 20, 1); D.e(19, 26, 11, 4.5, 1); D.r(7, 29, 24, 2, 3); D.r(9, 8, 11, 2, 2); D.e(14.5, 6, 5.5, 1.6, 4); D.eye(11, 13); D.eye(16, 13); D.l(12, 19, 16, 19, 3); D.p(11, 18, 3); D.p(17, 18, 3); D.p(22, 4, 4); D.p(23, 2, 4); }],
    3: ['WELLYKONG', 'A welly as big as a wheelie bin. When it jumps in a puddle the whole street gets wet. It thinks this is hilarious.', ['#b0e0f8', '#e84030', '#901818'],
      D => { D.r(6, 4, 15, 23, 1); D.e(19, 26, 12, 5, 1); D.r(4, 29, 27, 2, 3); D.r(6, 7, 15, 2, 2); D.e(13.5, 4, 7, 2, 4); D.e(4, 17, 3, 5, 1); D.e(24, 14, 3, 4, 1); D.eye(9, 12); D.eye(15, 12); D.l(8, 10, 11, 11, 3); D.l(16, 11, 19, 10, 3); D.r(9, 18, 9, 3, 3); D.p(10, 18, 4); D.p(16, 18, 4); }],
    4: ['TOASTIE', 'A cheese toastie that got left in the toastie maker. The cheese inside is hotter than the sun. Do NOT bite it.', ['#f8e068', '#d89048', '#8a4818'],
      D => { D.r(7, 10, 18, 17, 1); D.e(16, 10, 9, 5, 1); for (let i = 0; i < 3; i++) D.l(9 + i * 5, 26, 14 + i * 5, 12, 2); D.r(6, 17, 2, 6, 4); D.r(24, 15, 2, 8, 4); D.p(6, 23, 4); D.p(25, 23, 4); D.eye(11, 15); D.eye(19, 15); D.e(16, 21, 3, 2, 3); D.p(16, 20, 4); D.l(12, 2, 13, 6, 4); D.l(18, 1, 19, 5, 4); D.l(23, 3, 22, 6, 4); }],
    5: ['TOASTRON', 'A huge chrome toaster on legs. It pops out flaming toast when it gets cross. It is always a bit cross.', ['#f8f8f8', '#b8c0d0', '#586078'],
      D => { D.r(4, 11, 24, 17, 1); D.e(16, 11, 12, 3, 1); D.r(10, 2, 4, 8, 2); D.r(19, 1, 4, 9, 2); D.r(8, 9, 6, 3, 3); D.r(18, 9, 6, 3, 3); D.r(28, 15, 3, 6, 2); D.r(8, 15, 5, 5, 4); D.r(19, 15, 5, 5, 4); D.r(10, 17, 2, 2, 3); D.r(21, 17, 2, 2, 3); D.r(10, 23, 12, 2, 3); D.r(8, 28, 3, 3, 3); D.r(21, 28, 3, 3, 3); }],
    6: ['DUSTBUNNY', 'Lives in the PE cupboard behind the crash mats. Made of fluff, hair and one lost verruca sock. Sneezes a lot.', ['#f0f0f0', '#b8b0b0', '#686068'],
      D => { D.e(16, 21, 10, 9, 1); for (let i = 0; i < 18; i++) { const a = i / 18 * 6.28; D.p(16 + Math.cos(a) * 11, 21 + Math.sin(a) * 10, 1); } D.e(11, 8, 2.5, 6, 1); D.e(11, 9, 1, 4, 4); D.eye(12, 19); D.mirror(); D.p(15, 23, 3); D.p(16, 23, 3); D.e(9, 25, 2, 1.5, 4); D.e(23, 25, 2, 1.5, 4); D.p(26, 11, 4); D.p(5, 13, 4); }],
    7: ['CRISPIT', 'A crisp-packet gremlin. It rustles. It nicks the last crisp out of every bag in the canteen, then blames you.', ['#f8f0a0', '#3860d8', '#182878'],
      D => { D.r(9, 6, 14, 22, 1); D.r(8, 8, 16, 18, 1); for (let x = 8; x < 24; x += 2) { D.p(x, 5, 3); D.p(x + 1, 28, 3); } D.r(9, 13, 14, 7, 4); D.eye(12, 14); D.eye(17, 14); D.l(13, 18, 18, 18, 3); D.p(14, 19, 4); D.p(17, 19, 4); D.e(5, 19, 2.5, 2, 4); D.l(6, 17, 8, 16, 1); D.e(27, 21, 2, 2, 4); }],
    8: ['DIALUP', 'A modem that went feral. When it is cross it screams SKREEE-DONK-KSSHH. Mom cannot use the phone while it is online.', ['#f8f8a0', '#d0c8b0', '#787060'],
      D => { D.r(3, 14, 26, 12, 1); D.r(3, 14, 26, 2, 4); D.r(3, 24, 26, 2, 2); for (let i = 0; i < 5; i++) D.p(7 + i * 3, 22, 4); D.eye(8, 16); D.eye(21, 16); D.e(16, 19, 4, 2.5, 3); D.l(27, 24, 31, 29, 3); D.l(31, 29, 28, 31, 3); D.l(4, 10, 7, 13, 4); D.l(16, 6, 16, 11, 4); D.l(25, 9, 22, 12, 4); D.l(11, 8, 12, 12, 4); }],
    9: ['GOBSTOPPA', 'A gobstopper that has been down the back of the sofa since 1994. It is covered in fluff and very, very hard.', ['#f8b8d8', '#e05898', '#902858'],
      D => { D.e(16, 19, 11, 11, 1); D.l(6, 15, 26, 15, 4); D.l(5, 20, 27, 20, 2); D.l(7, 25, 25, 25, 4); D.eye(12, 16); D.eye(18, 16); D.l(14, 23, 18, 22, 3); D.p(4, 9, 2); D.p(27, 10, 2); D.p(25, 29, 2); D.p(6, 28, 2); }],
    10: ['JAWBUSTA', 'A GOBSTOPPA that kept growing. It changes colour every time somebody licks it. Nobody has licked it. Ever.', ['#c8f0f8', '#40b0d0', '#206888'],
      D => { D.e(16, 17, 13, 13, 1); D.l(4, 10, 28, 10, 4); D.l(3, 15, 29, 15, 2); D.l(5, 26, 27, 26, 4); D.eye(10, 12); D.eye(20, 12); D.l(8, 9, 12, 10, 3); D.l(19, 10, 23, 9, 3); D.r(9, 19, 14, 5, 3); for (let i = 0; i < 4; i++) D.p(10 + i * 4, 19, 4); for (let i = 0; i < 3; i++) D.p(12 + i * 4, 23, 4); D.e(10, 30, 3, 1.5, 2); D.e(22, 30, 3, 1.5, 2); }],
    11: ['GRAVYBLOB', 'Mystery meat from school dinners, floating in gravy. Nobody knows what animal it used to be. It does not know either.', ['#e8d8a0', '#b07848', '#603818'],
      D => { D.e(16, 26, 14, 5, 2); D.e(16, 25, 11, 3, 1); D.e(16, 18, 8, 7, 1); D.e(13, 15, 3, 2, 4); D.eye(12, 17); D.eye(18, 17); D.l(13, 22, 18, 22, 3); D.p(5, 25, 4); D.p(26, 27, 4); D.p(9, 28, 4); D.p(22, 24, 4); D.l(16, 10, 17, 7, 4); }],
    12: ['BUZZWOT', 'The wasp from the school field. It turns up at every packed lunch and will not go away. Do not flap your arms.', ['#e8f8f8', '#f0c818', '#806010'],
      D => { D.e(20, 21, 8, 5, 1); for (let x = 16; x <= 24; x += 4) D.r(x, 16, 2, 10, 3); D.t(27, 19, 31, 21, 27, 23, 3); D.e(9, 18, 5, 5, 1); D.e(17, 10, 3, 6, 4); D.e(23, 11, 3, 5, 4); D.eye(7, 16); D.eye(10, 16); D.l(7, 13, 4, 8, 3); D.l(10, 13, 11, 8, 3); D.l(8, 22, 10, 22, 3); D.l(14, 25, 12, 29, 3); D.l(18, 26, 17, 30, 3); D.l(22, 26, 23, 30, 3); }],
    13: ['BEEPLET', 'A keyring pet nobody fed. It ran away to the woods and now it beeps at 3 o\'clock in the morning for no reason.', ['#d0f0c0', '#f070b0', '#902060'],
      D => { D.e(16, 19, 9, 11, 1); D.e(16, 5, 3, 3, 2); D.r(11, 12, 10, 8, 4); D.p(13, 14, 3); D.p(18, 14, 3); D.l(14, 17, 17, 17, 3); D.e(12, 25, 1.5, 1.5, 3); D.e(16, 26, 1.5, 1.5, 3); D.e(20, 25, 1.5, 1.5, 3); D.e(11, 31, 2, 1, 2); D.e(21, 31, 2, 1, 2); }],
    14: ['MEGABEEP', 'A BEEPLET that got fed AND cleaned up after. Now it is massive, and it STILL beeps at 3 in the morning.', ['#d0f0c0', '#8058e0', '#402890'],
      D => { D.e(16, 18, 12, 13, 1); D.r(9, 9, 14, 10, 4); D.l(11, 11, 14, 13, 3); D.l(21, 11, 18, 13, 3); D.r(12, 15, 8, 2, 3); D.e(4, 19, 3, 4, 1); D.e(28, 19, 3, 4, 1); for (const x of [10, 16, 22]) D.e(x, 25, 2, 2, 3); D.l(16, 1, 16, 5, 3); D.e(16, 1, 1.5, 1.5, 4); D.e(10, 31, 3, 1, 2); D.e(22, 31, 3, 1, 2); }],
    15: ['MOULDSOCK', 'A PE sock left in a bag all summer holidays. It grew moss. Then it grew legs. Then it grew an attitude.', ['#f0f0e0', '#88b858', '#486828'],
      D => { D.r(9, 3, 10, 18, 1); D.e(18, 23, 10, 6, 1); D.e(10, 22, 3, 4, 1); D.r(9, 3, 10, 2, 4); D.r(9, 6, 10, 1, 4); D.e(13, 16, 3, 2, 2); D.e(21, 25, 4, 2, 2); D.e(15, 27, 2, 1.5, 2); D.eye(11, 9); D.eye(15, 9); D.l(12, 14, 15, 13, 3); D.p(25, 7, 3); D.p(27, 5, 3); D.p(4, 11, 3); }],
    16: ['BANGERBOY', 'A bonfire-night sausage that rolled off the barbecue and kept on going. It sizzles when it is happy. And when it is sad.', ['#f8c890', '#c86838', '#783018'],
      D => { D.e(16, 19, 13, 6, 1); D.e(4, 19, 2, 4, 2); D.e(28, 19, 2, 4, 2); D.l(8, 16, 10, 22, 2); D.l(22, 16, 24, 22, 2); D.eye(12, 17); D.eye(18, 17); D.l(13, 22, 18, 22, 3); D.l(10, 25, 8, 30, 3); D.l(22, 25, 24, 30, 3); D.l(10, 6, 11, 10, 4); D.l(16, 4, 16, 9, 4); D.l(22, 6, 21, 10, 4); }],
    17: ['PLUGLET', 'Lives down the bath plughole and makes the gurgling noise when the water goes. It will try to grab your rubber duck.', ['#e0f0f8', '#58a0a8', '#285860'],
      D => { D.e(16, 26, 13, 5, 2); D.e(16, 26, 9, 3, 3); D.e(16, 18, 6, 8, 1); D.e(13, 22, 2, 2, 1); D.l(13, 12, 11, 6, 1); D.l(19, 12, 21, 6, 1); D.e(11, 5, 2.5, 2.5, 4); D.e(21, 5, 2.5, 2.5, 4); D.p(11, 5, 3); D.p(21, 5, 3); D.l(14, 20, 18, 20, 3); D.e(5, 25, 1.5, 1, 4); D.e(27, 25, 1.5, 1, 4); }],
    18: ['DRAINKING', 'The boss of every plughole in town. If your sink is blocked, it is sitting in there, looking smug about it.', ['#f8e868', '#40a888', '#205848'],
      D => { D.e(16, 21, 12, 10, 1); D.e(16, 29, 14, 3, 2); for (let i = 0; i < 4; i++) D.t(8 + i * 5, 9, 10 + i * 5, 3, 12 + i * 5, 9, 4); D.r(8, 9, 16, 3, 4); D.eye(11, 15); D.eye(18, 15); D.l(12, 22, 19, 22, 3); D.l(24, 12, 27, 20, 3); D.e(27, 22, 2.5, 2.5, 3); }],
    19: ['KETTLEKID', 'Lives in the kettle and pops out when you make a cup of tea. Gran says it is the best-behaved critter she knows.', ['#f8f8f8', '#e86858', '#882828'],
      D => { D.e(15, 21, 10, 9, 1); D.r(7, 12, 16, 4, 1); D.e(15, 11, 6, 2, 2); D.e(15, 8, 2, 1.5, 3); D.t(24, 18, 31, 11, 26, 22, 1); D.l(4, 14, 2, 20, 3); D.l(2, 20, 5, 26, 3); D.eye(11, 18); D.eye(17, 18); D.l(12, 24, 16, 24, 3); D.e(28, 5, 3, 2, 4); D.e(24, 2, 2, 1.5, 4); D.e(30, 1, 1.5, 1, 4); }],
    20: ['Y2K BUG', 'Everybody says it will make all the computers go wrong on New Year\'s Eve. Really it just wants a cuddle.', ['#c8f8c8', '#606878', '#303040'],
      D => { D.e(16, 19, 10, 8, 1); D.r(10, 15, 12, 7, 4); for (const x of [11, 17]) { D.r(x, 16, 4, 1, 3); D.r(x, 20, 4, 1, 3); D.r(x, 16, 1, 5, 3); D.r(x + 3, 16, 1, 5, 3); } D.e(16, 9, 5, 4, 1); D.eye(13, 8); D.eye(17, 8); D.l(13, 6, 10, 1, 3); D.l(19, 6, 22, 1, 3); for (const y of [16, 20, 24]) { D.l(6, y, 2, y + 2, 3); D.l(26, y, 30, y + 2, 3); } }],
    21: ['MEGASTOPPA', 'A JAWBUSTA only grows this big after a trip down a link cable. It weighs as much as a bus. A double-decker one.', ['#f8e0a8', '#d8a038', '#805818'],
      D => { D.e(16, 16, 15, 15, 1); D.l(2, 8, 30, 8, 4); D.l(1, 14, 31, 14, 2); D.l(2, 22, 30, 22, 4); D.l(4, 27, 28, 27, 2); D.eye(9, 11); D.eye(20, 11); D.l(7, 8, 11, 9, 3); D.l(19, 9, 23, 8, 3); D.r(9, 17, 14, 4, 3); D.p(11, 17, 4); D.p(15, 17, 4); D.p(19, 17, 4); D.l(24, 3, 27, 7, 3); D.l(27, 7, 26, 10, 3); }],
    22: ['GRAVYLAKE', 'A GRAVYBLOB that came down a link cable. A whole lake of gravy with a face. It smells like Sunday dinner.', ['#e8d8a0', '#985828', '#502810'],
      D => { D.e(16, 24, 15, 7, 2); D.e(16, 22, 14, 6, 1); D.e(16, 14, 9, 8, 1); D.eye(11, 13); D.eye(19, 13); D.e(15, 19, 4, 2, 3); D.e(5, 22, 2, 2, 4); D.e(26, 23, 2, 2, 4); D.e(21, 27, 2, 1.5, 4); D.l(9, 6, 10, 2, 4); D.l(16, 5, 16, 1, 4); D.l(23, 6, 22, 2, 4); }],
  };
  const SP = LC.SP.map(x => FUNNY[x.i] ? Object.assign({}, x, { n: FUNNY[x.i][0], dex: FUNNY[x.i][1] }) : x);
  const FUNPAL = s => FUNNY[s] ? [FUNNY[s][2][0], FUNNY[s][2][1], FUNNY[s][2][2], '#201418'] : null;
  // a few moves get funnier names on screen (the keys stay the same, so link battles still agree)
  const MVN = { POUNCE: 'BELLY FLOP', GLARE: 'THE EVILS', SNOOZE: 'LIE-IN', 'QUICK PECK': 'QUICK POKE', 'LEAF LICK': 'LEAF SLAP', 'MOSS BLAST': 'COMPOST HEAP', 'SPORE CLOUD': 'PONG CLOUD',
    'BUBBLE POP': 'BATH BOMB', 'CINDER SPIT': 'HOT SAUCE', 'FLARE UP': 'BONFIRE', ZAP: 'STATIC SHOCK', 'STATIC POP': 'FAX BLAST', THUNDERCLAP: 'MODEM SCREAM', 'PEBBLE TOSS': 'ACORN QUEST TOSS',
    'ROCK SLAM': 'BODY SLAM', HARDEN: 'TENSE UP', LANDSLIDE: 'AVALANCHE', 'EEL WHIP': 'WIRE WHIP', STINGLE: 'STINGY STING' };
  const mvN = m => MVN[m] || m;
  // Game Boy Color palettes: the text boxes per cartridge, the map tiles, the people
  const UIPAL = { moss: ['#f8f8f0', '#b8e0a8', '#488860', '#182820'], puddle: ['#f8f8ff', '#b8d0f8', '#4868b0', '#181c38'] };
  const TPAL = {
    '.': ['#c8f0a0', '#78c060', '#3a8040', '#183818'], ',': ['#f0e0b0', '#d0b880', '#907848', '#403020'], f: ['#c8f0a0', '#78c060', '#e85878', '#183818'],
    '"': ['#c8f0a0', '#58b050', '#287030', '#103010'], '~': ['#a8d8f0', '#58a0c8', '#287048', '#102818'], T: ['#c8f0a0', '#58a848', '#2a6830', '#3a2010'],
    W: ['#d0f0ff', '#5898e0', '#2858a8', '#102040'], R: ['#f8c0a0', '#e05838', '#a02818', '#401008'], '#': ['#f8f0e0', '#d8c8a8', '#988868', '#403828'],
    O: ['#f8f8ff', '#90c0f0', '#988868', '#403828'], D: ['#f8d8a0', '#c88848', '#804818', '#301808'], S: ['#c8f0a0', '#78c060', '#906838', '#302010'],
    X: ['#f8f0e8', '#d8b8a8', '#a07868', '#402828'], _: ['#f8e8c8', '#d8b888', '#a07848', '#402818'], m: ['#f8e8c8', '#e07858', '#a03828', '#401010'],
    K: ['#f8f0d0', '#e0a040', '#a04030', '#402010'], P: ['#f8e8c8', '#80b0e0', '#606878', '#202028'], M: ['#f8e8c8', '#f080a0', '#a04060', '#301020'],
    t: ['#f8e8c8', '#d09858', '#905828', '#382010'], C: ['#f8e8c8', '#c8a0e0', '#7858a8', '#281838'], b: ['#f8f8f8', '#e86868', '#a03030', '#381010'],
    Q: ['#f8e8c8', '#78c860', '#3a8040', '#704828'], H: ['#f8e8c8', '#68b850', '#2a7030', '#102810'],
    '=': ['#e0d0b8', '#b8a088', '#806850', '#302418'], V: ['#d8c8b0', '#a89078', '#685040', '#201810'], E: ['#d8c8b0', '#a89078', '#685040', '#100808'],
    ':': ['#f8f0c0', '#e8d090', '#b09858', '#403820'], F: ['#c8f0a0', '#78c060', '#a87848', '#382010'], B: ['#e0d0b8', '#b8a088', '#806850', '#302418'],
  };
  const PCOL = { kid2: ['#f8d0a8', '#f8d0a8', '#e83828', '#181818'], mom: ['#f8d0b0', '#e86098', '#8a4a28', '#181818'], prof: ['#f8e8d8', '#a8a8b8', '#6a5a48', '#181818'],
    nurse: ['#f8e0d8', '#f8b0c8', '#e86890', '#181818'], clerk: ['#f8d0a8', '#58a0e0', '#2a6a30', '#181818'], kid: ['#f8d0a8', '#f0c030', '#7a4a20', '#181818'],
    girl: ['#f0c8a0', '#f8a0c0', '#d05080', '#181818'], jackk: ['#f8d0a8', '#40a0f0', '#2050a0', '#181818'], hazel: ['#f8d0b0', '#68b848', '#2a7a2a', '#181818'],
    old: ['#f8e0d0', '#a0a0a8', '#5a6a8a', '#181818'], linklass: ['#f8d0b0', '#f0d040', '#a040c0', '#181818'], luke: ['#f8d0a8', '#e83828', '#2858c8', '#181818'],
    dave: ['#e8b890', '#58b848', '#2a6a2a', '#181818'], callum: ['#f8d0a8', '#f8a040', '#5a3a20', '#181818'], gardener: ['#f8d0a8', '#78c050', '#8a5a28', '#181818'],
    camper: ['#f8d0a8', '#e8a030', '#3a7a3a', '#181818'], birder: ['#f8d0b0', '#90b8e0', '#5a7a40', '#181818'],
    minidave: ['#e8b890', '#f8f8f8', '#38a838', '#181818'], minijackk: ['#f8d0a8', '#f8f8f8', '#3878e8', '#181818'], hiker: ['#f0c098', '#c8a060', '#8a4a20', '#181818'],
    sailor: ['#f8d0a8', '#f8f8f8', '#2848a8', '#181818'], nora: ['#f8d0b0', '#58c8f0', '#2068b8', '#181818'], swimmer: ['#f0c8a0', '#f8e040', '#e05030', '#181818'],
    dinner: ['#f8e0d0', '#f8f8f8', '#5aa0d0', '#181818'], ice: ['#f8d0a8', '#f8c0d8', '#d84878', '#181818'] };
  const OCOL = { ball: ['#f8f8f8', '#e84040', '#a02020', '#181818'], cube: ['#f8f8f8', '#58a0e0', '#2858a0', '#181818'] };
  const ITEMS = { CUBE: ['CRITTER CUBE', 150, 'Throw at a tired wild critter to catch it.'], CAKE: ['BERRY CAKE', 100, 'Heals 20 HP.'], BIG: ['BIG CAKE', 300, 'Heals 60 HP.'], PEP: ['PEP BUN', 600, 'Wakes a fainted critter up with half its HP.'] };
  const ITEM_ORDER = ['CUBE', 'CAKE', 'BIG', 'PEP'];
  const uid = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  function mon(s, lv) { const c = { s, lv, exp: expAt(lv), moves: movesAt(s, lv), id: uid() }; c.hp = maxhp(c); return c; }
  const nameOf = c => SP[c.s].n;

  // ================================================================ the world: maps (16x16 tiles)
  // . grass  , path  " long grass  ~ reeds (long grass by the pond)  T tree  W water  R roof  # wall  O window  D door  S sign  f flowers
  // inside: X wall  _ floor  m mat (the way out)  K books  P telly / computer  M healing machine  t table  C counter  b bed  Q plant  H hedge
  const MAPS = {
    town: { name: 'MOSS TOWN', out: 'T', song: 'town', rows: [
      'TTTTTTTTT,,TTTTTTTTT',
      'T.......f,,f.......T',
      'T.RRRR..f,,f..RRRR.T',
      'T.RRRR...,,...RRRR.T',
      'T.#OD#...,,...#DO#.T',
      'T...,....,,....,...T',
      'T...,,,,,,,,,,,,...T',
      'T........,,........T',
      'T.RRRRR..,,...RRRR.T',
      'T.RRRRR..,,...RRRR.T',
      'T.#O#D#.S,,...#D#O.T',
      'T....,...,,....,...T',
      'T....,,,,,,,,,,,...T',
      'T.RRRRRR.,,...WWWW.T',
      'T.RRRRRR.,,...WWWW.T',
      'T.##OD##.,,.S.WWWW.T',
      'T....,,,,,,ff......T',
      'TTTTTTTTTTTTTTTTTTTT'] },
    route: { name: 'ROUTE 1', out: 'T', song: 'route', grass: [[6, 2, 4, 45], [7, 2, 3, 40], [8, 3, 3, 15]], rows: [
      'TTTTTT,,TTTTTT',
      'T...."",,"...T',
      'T..""",,"""..T',
      'T.""""..""""fT',
      'T.""""..""""TT',
      'TT....,,....TT',
      'TTTT..,,..TTTT',
      'T.....,,.....T',
      'T.S...,,.""".T',
      'T.....,,.""".T',
      'TTTT..,,.""".T',
      'T"""".,,.....T',
      'T"""".,,..TTTT',
      'T"""".,,.....T',
      'T.....,,..f..T',
      'TTT...,,...TTT',
      'T.""".,,.""".T',
      'T.""".,,.""".T',
      'T.""".,,.""".T',
      'T.....,,.....T',
      'TTTTT.,,.TTTTT',
      'T.....,,.....T',
      'T"""".,,.""""T',
      'T"""".,,.""""T',
      'T.....,,.....T',
      'T.f...,,...f.T',
      'TT....,,....TT',
      'TTT...,,...TTT',
      'TTTT..,,..TTTT',
      'TTTTTT,,TTTTTT'] },
    woods: { name: 'WHISPERING WOODS', out: 'T', song: 'woods', grass: [[12, 5, 7, 28], [13, 5, 7, 24], [9, 5, 7, 18], [6, 6, 6, 10], [8, 6, 7, 12], [16, 6, 7, 9], [15, 7, 8, 6]], reeds: [[11, 5, 8, 70], [13, 6, 7, 30]], rows: [
      'TTTTEETTTTTTTTTT',
      'TT""..TTTT..""TT',
      'T"""".TTTT.""""T',
      'T""""..""..""""T',
      'T..TT......TT..T',
      'T..TT.WWWW.TT..T',
      'T....~WWWW~....T',
      'T"".~~WWWW~~.""T',
      'T"".~~~~~~~~.""T',
      'T""..........""T',
      'TTT..TT..TT..TTT',
      'T....TT..TT....T',
      'T.""""....""""TT',
      'T.""""....""""TT',
      'T......TT......T',
      'TT""...TT...""TT',
      'T"""".......""TT',
      'T""""......""".T',
      'TTTTTT....TTTTTT',
      'TTTTTTT,,TTTTTTT'] },
    house: { name: 'HOME', out: 'X', song: 'home', inside: 1, rows: [
      'XXXXXXXXXX',
      'XKKP__b__X',
      'X________X',
      'X__tt____X',
      'X__tt__Q_X',
      'X________X',
      'X________X',
      'XXXXmmXXXX'] },
    lab: { name: 'BRAMBLE LAB', out: 'X', song: 'home', inside: 1, rows: [
      'XXXXXXXXXX',
      'XKKKPPKKKX',
      'X________X',
      'X__ttt___X',
      'X________X',
      'X_Q____Q_X',
      'X________X',
      'XXXXmmXXXX'] },
    centre: { name: 'CRITTER CENTRE', out: 'X', song: 'home', inside: 1, rows: [
      'XXXXXXXXXX',
      'XKM_____PX',
      'XCCCCCC__X',
      'X________X',
      'X_Q___Q__X',
      'X________X',
      'X________X',
      'XXXXmmXXXX'] },
    shop: { name: 'CORNER SHOP', out: 'X', song: 'home', inside: 1, rows: [
      'XXXXXXXXXX',
      'XKKKKKKKKX',
      'X________X',
      'XC_______X',
      'X________X',
      'X_Q__Q___X',
      'X________X',
      'XXXXmmXXXX'] },
    gym: { name: 'MOSS TOWN GYM', out: 'X', song: 'gym', inside: 1, rows: [
      'XXXXXXXXXX',
      'X_Q____Q_X',
      'X________X',
      'XHHH__HHHX',
      'X________X',
      'X__HHHH__X',
      'X________X',
      'XHHH__HHHX',
      'X________X',
      'X_Q____Q_X',
      'X________X',
      'XXXXmmXXXX'] },
  };
  // ---- (G) the new bit of the island: GRUMBLY CAVE (through the top of the woods), ROUTE 2 and PEBBLE BAY, with its gym
  // = cave floor  V rock  E cave mouth  B boulder  : sand  F fence
  const inside = rows => rows.slice();
  Object.assign(MAPS, {
    cave: { name: 'GRUMBLY CAVE', out: 'V', song: 'cave', cave: 1, grass: [[9, 10, 13, 35], [8, 10, 12, 25], [13, 11, 13, 20], [11, 11, 13, 15], [6, 10, 12, 5]], rows: [
      'VVVVVV==VVVVVV',
      'VV==========VV',
      'V===BB====B==V',
      'V==VVV==VVV==V',
      'V==V======V==V',
      'V====BB======V',
      'VVV======VV==V',
      'V=====VV=====V',
      'V=B===VV==B==V',
      'V=====VV=====V',
      'VV====B=====VV',
      'V======VVV===V',
      'V==BB========V',
      'V======VV====V',
      'VVVV==VVVVVVVV',
      'VVVV==VVVVVVVV'] },
    route2: { name: 'ROUTE 2', out: 'T', song: 'route', grass: [[7, 12, 15, 30], [12, 13, 15, 20], [16, 13, 16, 15], [15, 13, 15, 10], [6, 12, 14, 15], [13, 12, 14, 10]], rows: [
      'TTTTTT,,TTTTTT',
      'T""".,,,,.""fT',
      'T""".,..,.""TT',
      'T....,..,....T',
      'TFFF.,..,.FFFT',
      'T....,,,,....T',
      'T.S..,......"T',
      'T""".,..."""TT',
      'T""".,..."""TT',
      'T....,,,,,,..T',
      'TT...F...,...T',
      'T""".F...,"""T',
      'T""".F...,"""T',
      'T....F...,...T',
      'T..f.....,.f.T',
      'TTT...,,,,.TTT',
      'T"""..,..."""T',
      'T"""..,..."""T',
      'T.....,......T',
      'TTTTTT,,TTTTTT'] },
    bay: { name: 'PEBBLE BAY', out: 'F', song: 'bay', rows: [
      'WWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWW',
      '::::::::::::::::::',
      'F.RRRRR....,RRRR.F',
      'F.RRRRR....,RRRR.F',
      'F.#O#D#.S..,#DO#.F',
      'F....,.....,..,..F',
      'F....,,,,,,,,,,..F',
      'F.........,......F',
      'F.RRRRRR..,..f.f.F',
      'F.RRRRRR..,......F',
      'F.##OD##..,..RRR.F',
      'F....,....,..#D#.F',
      'F....,,,,,,,,,,..F',
      'F.f......,,.....fF',
      'FFFFFFFFF,,FFFFFFF'] },
    centre2: { name: 'CRITTER CENTRE', out: 'X', song: 'home', inside: 1, rows: inside(MAPS.centre.rows) },
    shop2: { name: 'ROCK SHOP', out: 'X', song: 'home', inside: 1, rows: inside(MAPS.shop.rows) },
    bayhouse: { name: 'NAN\'S BUNGALOW', out: 'X', song: 'home', inside: 1, rows: inside(MAPS.house.rows) },
    gym2: { name: 'PEBBLE BAY GYM', out: 'X', song: 'gym', inside: 1, rows: [
      'XXXXXXXXXX',
      'X_Q____Q_X',
      'X________X',
      'XWWW__WWWX',
      'X________X',
      'X__WWWW__X',
      'X________X',
      'XWWW__WWWX',
      'X________X',
      'X_Q____Q_X',
      'X________X',
      'XXXXmmXXXX'] },
  });
  for (const k in MAPS) { const m = MAPS[k]; m.id = k; m.h = m.rows.length; m.w = m.rows[0].length; }
  // where doors and edges lead: [map, x, y] -> [map, x, y, facing]
  const WARPS = [
    ['town', 4, 4, 'house', 4, 6, 'up'], ['house', 4, 7, 'town', 4, 5, 'down'], ['house', 5, 7, 'town', 4, 5, 'down'],
    ['town', 15, 4, 'shop', 4, 6, 'up'], ['shop', 4, 7, 'town', 15, 5, 'down'], ['shop', 5, 7, 'town', 15, 5, 'down'],
    ['town', 5, 10, 'lab', 4, 6, 'up'], ['lab', 4, 7, 'town', 5, 11, 'down'], ['lab', 5, 7, 'town', 5, 11, 'down'],
    ['town', 15, 10, 'centre', 4, 6, 'up'], ['centre', 4, 7, 'town', 15, 11, 'down'], ['centre', 5, 7, 'town', 15, 11, 'down'],
    ['town', 5, 15, 'gym', 4, 10, 'up'], ['gym', 4, 11, 'town', 5, 16, 'down'], ['gym', 5, 11, 'town', 5, 16, 'down'],
    ['town', 9, 0, 'route', 6, 28, 'up'], ['town', 10, 0, 'route', 7, 28, 'up'], ['route', 6, 29, 'town', 9, 1, 'down'], ['route', 7, 29, 'town', 10, 1, 'down'],
    ['route', 6, 0, 'woods', 7, 18, 'up'], ['route', 7, 0, 'woods', 8, 18, 'up'], ['woods', 7, 19, 'route', 6, 1, 'down'], ['woods', 8, 19, 'route', 7, 1, 'down'],
  ];
  WARPS.push( // (G) the cave, route 2 and the bay
    ['woods', 4, 0, 'cave', 4, 14, 'up'], ['woods', 5, 0, 'cave', 5, 14, 'up'], ['cave', 4, 15, 'woods', 4, 1, 'down'], ['cave', 5, 15, 'woods', 5, 1, 'down'],
    ['cave', 6, 0, 'route2', 6, 18, 'up'], ['cave', 7, 0, 'route2', 7, 18, 'up'], ['route2', 6, 19, 'cave', 6, 1, 'down'], ['route2', 7, 19, 'cave', 7, 1, 'down'],
    ['route2', 6, 0, 'bay', 9, 14, 'up'], ['route2', 7, 0, 'bay', 10, 14, 'up'], ['bay', 9, 15, 'route2', 6, 1, 'down'], ['bay', 10, 15, 'route2', 7, 1, 'down'],
    ['bay', 5, 5, 'centre2', 4, 6, 'up'], ['centre2', 4, 7, 'bay', 5, 6, 'down'], ['centre2', 5, 7, 'bay', 5, 6, 'down'],
    ['bay', 13, 5, 'shop2', 4, 6, 'up'], ['shop2', 4, 7, 'bay', 13, 6, 'down'], ['shop2', 5, 7, 'bay', 13, 6, 'down'],
    ['bay', 5, 11, 'gym2', 4, 10, 'up'], ['gym2', 4, 11, 'bay', 5, 12, 'down'], ['gym2', 5, 11, 'bay', 5, 12, 'down'],
    ['bay', 14, 12, 'bayhouse', 4, 6, 'up'], ['bayhouse', 4, 7, 'bay', 14, 13, 'down'], ['bayhouse', 5, 7, 'bay', 14, 13, 'down'],
  );
  const warpAt = (m, x, y) => WARPS.find(w => w[0] === m && w[1] === x && w[2] === y);
  const SOLID = new Set(['T', 'W', 'R', '#', 'O', 'S', 'X', 'K', 'P', 'M', 't', 'C', 'b', 'Q', 'H', 'V', 'B', 'F']);
  const SIGNS = {
    'route2:2,6': 'ROUTE 2. North: PEBBLE BAY. South: GRUMBLY CAVE. Mind the wasps.',
    'bay:8,5': 'PEBBLE BAY. Sea, sand and sticks of rock. GYM LEADER: CAPTAIN NORA.',
    'town:8,10': 'MOSS TOWN. Where the grass is greener (and longer, and full of critters).',
    'town:12,15': 'MOSS TOWN GYM. Leader: HAZEL. "As tough as old boots!"',
    'route:2,8': 'ROUTE 1. North: WHISPERING WOODS. South: MOSS TOWN.',
  };
  // people and things. st: how they look. sight: trainers spot you this many tiles away
  const PEOPLE = {
    mom: { hair: 2, long: 1, shirt: 1, dress: 1 }, prof: { hair: 1, shirt: 4, coat: 1 }, nurse: { hair: 2, hat: 4, shirt: 4, dress: 1 }, clerk: { hair: 3, shirt: 2, cap: 1 },
    kid: { hair: 3, shirt: 1 }, girl: { hair: 3, long: 1, shirt: 2, dress: 1 }, jackk: { hair: 3, spiky: 1, shirt: 1 }, hazel: { hair: 2, bun: 1, shirt: 2, dress: 1 }, old: { hair: 4, shirt: 2 },
    linklass: { hair: 1, long: 1, shirt: 3, dress: 1, hat: 3 },
    luke: { hair: 2, cap: 1, shirt: 1 }, dave: { hair: 3, shirt: 2 }, callum: { hair: 1, shirt: 3 }, gardener: { hair: 2, hat: 2, shirt: 1 }, camper: { hair: 3, cap: 1, shirt: 2 }, birder: { hair: 1, long: 1, shirt: 3, dress: 1 },
  };
  Object.assign(PEOPLE, { minidave: { hair: 3, cap: 1, capCol: 1, shirt: 2 }, minijackk: { hair: 3, spiky: 1, cap: 1, capCol: 1, shirt: 2 }, hiker: { hair: 2, hat: 2, shirt: 1 },
    sailor: { hair: 3, hat: 4, shirt: 2 }, nora: { hair: 2, long: 1, shirt: 2, dress: 1 }, swimmer: { hair: 1, shirt: 1 }, dinner: { hair: 2, hat: 4, shirt: 1, dress: 1 }, ice: { hair: 3, long: 1, shirt: 2 } });
  for (const k in PCOL) if (PEOPLE[k]) PEOPLE[k].col = PCOL[k];
  const NPCS = {
    town: [
      { id: 'tipgirl', x: 12, y: 7, dir: 'down', st: 'girl', wander: 1, talk: ['Critters get tired after a scrap. When their HP bar goes red, throw a CRITTER CUBE!'] },
      { id: 'oldman', x: 3, y: 12, dir: 'right', st: 'old', talk: ['In my day we didn\'t have critters. We had a stick. And we were GRATEFUL for the stick.'] },
      { id: 'blowkid', x: 17, y: 5, dir: 'left', st: 'kid', wander: 1, talk: ['My big brother says if your game won\'t work, you blow on the cartridge. Works every time!'] },
      { id: 'pondgirl', x: 13, y: 12, dir: 'down', st: 'girl', talk: ['Muddy critters live by the pond in the WHISPERING WOODS. They hide in the reeds.'] },
    ],
    house: [{ id: 'mom', x: 6, y: 3, dir: 'left', st: 'mom', mom: 1 }],
    lab: [
      { id: 'prof', x: 6, y: 2, dir: 'down', st: 'prof', prof: 1 },
      { id: 'jackk', x: 8, y: 4, dir: 'left', st: 'jackk', rival: 1 },
      { id: 'cube0', x: 3, y: 3, obj: 'cube', starter: 0 }, { id: 'cube1', x: 4, y: 3, obj: 'cube', starter: 2 }, { id: 'cube2', x: 5, y: 3, obj: 'cube', starter: 4 },
    ],
    centre: [{ id: 'nurse', x: 3, y: 1, dir: 'down', st: 'nurse', nurse: 1 }, { id: 'centrekid', x: 6, y: 5, dir: 'left', st: 'kid', talk: ['That PC in the corner talks to PROFESSOR BRAMBLE\'s PC. If your party is full, new critters get sent there.', 'The lady by the wall runs the CABLE CLUB. Get a LINK CABLE and you can trade with your mates on JackNet!'] },
      { id: 'cable', x: 8, y: 3, dir: 'left', st: 'linklass', cable: 1 }],
    shop: [{ id: 'clerk', x: 1, y: 2, dir: 'down', st: 'clerk', shop: 1 }, { id: 'shopgirl', x: 6, y: 4, dir: 'up', st: 'girl', talk: ['I\'m saving up for a BIG CAKE. My critter is very greedy.'] }],
    route: [
      { id: 'luke', x: 9, y: 7, dir: 'left', st: 'luke', sight: 4, tr: { name: 'LUKE', team: [[6, 4], [7, 5]], money: 120,
        pre: 'LUKE: Oi, JACK! I\'ve read every critter magazine there is. Let\'s battle!', win: 'LUKE: Aw, man. I\'m going back to reading.', after: 'LUKE: You should check the long grass up north. There are critters that glow!' } },
      { id: 'cake1', x: 12, y: 3, obj: 'ball', item: 'CAKE', n: 1 },
      { id: 'cube5', x: 1, y: 13, obj: 'ball', item: 'CUBE', n: 2 },
    ],
    woods: [
      { id: 'dave', x: 2, y: 14, dir: 'right', st: 'dave', sight: 5, tr: { name: 'DAVE', team: [[12, 7], [9, 7]], money: 200,
        pre: 'DAVE: JACK! I\'ve been training out here ALL morning. Prepare to lose!', win: 'DAVE: How?! I had the best ones!', after: 'DAVE: There\'s a really rare bush critter round here. It looks just like a bush. That\'s the problem.' } },
      { id: 'callum', x: 12, y: 9, dir: 'left', st: 'callum', sight: 6, tr: { name: 'CALLUM', team: [[8, 8], [13, 7]], money: 220,
        pre: 'CALLUM: I normally play on my PC, but this is all right. Battle?', win: 'CALLUM: Lag. That was lag.', after: 'CALLUM: HAZEL at the gym loves MOSS critters. EMBER ones are good against her. Or so I read.' } },
      { id: 'big1', x: 11, y: 1, obj: 'ball', item: 'BIG', n: 1 },
      { id: 'cube3', x: 5, y: 2, obj: 'ball', item: 'CUBE', n: 3 },
      { id: 'pep1', x: 14, y: 17, obj: 'ball', item: 'PEP', n: 1 },
    ],
    gym: [
      { id: 'rosie', x: 1, y: 8, dir: 'right', st: 'gardener', sight: 7, tr: { name: 'GARDENER ROSIE', team: [[12, 9], [6, 9]], money: 250,
        pre: 'ROSIE: Wipe your feet! Nobody tramples HAZEL\'s gym without a battle!', win: 'ROSIE: My begonias are ashamed of me.', after: 'ROSIE: HAZEL\'s critters are proper tough. Stock up on cakes!' } },
      { id: 'tom', x: 8, y: 6, dir: 'left', st: 'camper', sight: 7, tr: { name: 'CAMPER TOM', team: [[11, 9], [13, 9]], money: 250,
        pre: 'TOM: I\'ve camped in these woods for three whole nights. Well, the garden.', win: 'TOM: Back to my tent, then.', after: 'TOM: Ever had a GLOWGRUB in your tent? Best night light ever.' } },
      { id: 'edna', x: 1, y: 4, dir: 'right', st: 'birder', sight: 7, tr: { name: 'BIRDER EDNA', team: [[7, 10], [7, 10]], money: 260,
        pre: 'EDNA: Shh! I\'m watching the PUFFPIPS. Oh, you want a battle. Fine.', win: 'EDNA: You scared the birds off. Well done.', after: 'EDNA: HAZEL is just up there. Good luck, dear.' } },
      { id: 'hazel', x: 4, y: 1, dir: 'down', st: 'hazel', leader: 1, tr: { name: 'LEADER HAZEL', team: [[12, 10], [15, 12]], money: 600,
        pre: 'HAZEL: Welcome to the MOSS TOWN GYM! I\'m HAZEL. My critters grow slow and steady and they are as tough as old boots. Ready?', win: 'HAZEL: Well I never! You\'ve earned this.', after: 'HAZEL: Keep training, JACK. There are critters out there you haven\'t even dreamed of.' } },
    ],
  };

  // ---- (G) who lives in the new places
  NPCS.woods.push({ id: 'cavekid', x: 5, y: 2, dir: 'down', st: 'kid', talk: ['That hole up there is GRUMBLY CAVE. It grumbles. Critters that like the dark live in it.', 'PEBBLE BAY is out the other side. My Nan lives there. She makes the best rock cakes.'] });
  Object.assign(NPCS, {
    cave: [
      { id: 'hiker', x: 8, y: 4, dir: 'left', st: 'hiker', sight: 4, tr: { name: 'HIKER BERT', team: [[9, 14], [10, 16]], money: 300,
        pre: 'BERT: Rocks! I love rocks! Want to see my rocks? They battle!', win: 'BERT: My rocks! My lovely rocks!', after: 'BERT: GOBSTOPPAS live in here. They are rock hard. And a bit fluffy.' } },
      { id: 'cube6', x: 2, y: 1, obj: 'ball', item: 'CUBE', n: 3 }, { id: 'pep2', x: 11, y: 4, obj: 'ball', item: 'PEP', n: 1 }, { id: 'big2', x: 1, y: 9, obj: 'ball', item: 'BIG', n: 1 },
    ],
    route2: [
      { id: 'minidave', x: 3, y: 9, dir: 'right', st: 'minidave', sight: 5, tr: { name: 'MINI-DAVE', team: [[6, 13], [9, 14]], money: 220,
        pre: 'MINI-DAVE: I\'m DAVE\'s little brother. Everybody calls me MINI-DAVE. I\'m going to be WAY better than him!', win: 'MINI-DAVE: Don\'t tell DAVE. He\'ll do the laugh.', after: 'MINI-DAVE: DAVE says the gym in PEBBLE BAY is all puddles. Bring something that isn\'t scared of a bath.' } },
      { id: 'dinnerdot', x: 11, y: 6, dir: 'left', st: 'dinner', sight: 6, tr: { name: 'DINNER LADY DOT', team: [[11, 15], [11, 16]], money: 260,
        pre: 'DOT: You\'ll eat your GRAVYBLOB and you\'ll LIKE it!', win: 'DOT: Well! No pudding for you.', after: 'DOT: Nobody knows what\'s in the gravy. Not even me, love.' } },
      { id: 'minijackk', x: 12, y: 13, dir: 'left', st: 'minijackk', sight: 6, tr: { name: 'MINI-JACKK', team: [[13, 14], [16, 15]], money: 240,
        pre: 'MINI-JACKK: Cap on backwards means I\'m serious. I\'m JACKK\'s little brother. Battle!', win: 'MINI-JACKK: My cap must have been on the wrong way round.', after: 'MINI-JACKK: Our JACKK says you\'re all right. For a JACK.' } },
      { id: 'ivy', x: 5, y: 16, dir: 'right', st: 'ice', sight: 4, tr: { name: 'ICE CREAM IVY', team: [[7, 15], [12, 15]], money: 240,
        pre: 'IVY: Ninety-nine with a flake? No? A BATTLE then!', win: 'IVY: Brain freeze...', after: 'IVY: The BUZZWOTS keep nicking my flakes.' } },
      { id: 'big3', x: 11, y: 18, obj: 'ball', item: 'BIG', n: 1 }, { id: 'cake3', x: 12, y: 1, obj: 'ball', item: 'CAKE', n: 2 },
    ],
    bay: [
      { id: 'sailorkid', x: 4, y: 8, dir: 'right', st: 'sailor', wander: 1, talk: ['Ahoy! The sea round PEBBLE BAY is full of WELLYBOBS. They wash up after a storm.'] },
      { id: 'rockgirl', x: 15, y: 7, dir: 'left', st: 'ice', wander: 1, talk: ['A stick of rock with PEBBLE BAY written all the way through it! How do they DO that?'] },
      { id: 'baysign', x: 1, y: 2, dir: 'down', st: 'old', talk: ['The tide comes in, the tide goes out. I just sit here. Lovely.'] },
    ],
    centre2: [{ id: 'nurse2', x: 3, y: 1, dir: 'down', st: 'nurse', nurse: 1 }, { id: 'centre2kid', x: 6, y: 5, dir: 'left', st: 'kid', talk: ['CAPTAIN NORA\'s critters are all PUDDLE types. MOSS critters soak them right up!'] }],
    shop2: [{ id: 'clerk2', x: 1, y: 2, dir: 'down', st: 'clerk', shop: 1 }, { id: 'shop2girl', x: 6, y: 4, dir: 'up', st: 'girl', talk: ['I came in for a stick of rock and left with six BERRY CAKES. Again.'] }],
    bayhouse: [{ id: 'nan', x: 6, y: 3, dir: 'left', st: 'old', talk: ['NAN: Ooh, a visitor! Have a rock cake, dear. Mind your teeth, they\'re a bit... rocky.', 'NAN: When I was a girl, we didn\'t have critters. We had a GOBSTOPPA and we made it last a year.'] }],
    gym2: [
      { id: 'swimsal', x: 1, y: 8, dir: 'right', st: 'swimmer', sight: 7, tr: { name: 'SWIMMER SAL', team: [[2, 16], [11, 17]], money: 300,
        pre: 'SAL: No running by the pool! Unless it\'s to a battle!', win: 'SAL: Glug.', after: 'SAL: CAPTAIN NORA\'s at the top. She\'s never once been seasick.' } },
      { id: 'sailorstu', x: 8, y: 6, dir: 'left', st: 'sailor', sight: 7, tr: { name: 'SAILOR STU', team: [[17, 17], [2, 17]], money: 300,
        pre: 'STU: I\'ve sailed the seven seas! Well. The paddling pool.', win: 'STU: Abandon ship!', after: 'STU: PLUGLETS gurgle when they\'re happy. Or hungry. Or cross.' } },
      { id: 'nora', x: 4, y: 1, dir: 'down', st: 'nora', leader: 2, tr: { name: 'CAPTAIN NORA', team: [[11, 18], [17, 18], [3, 21]], money: 900,
        pre: 'NORA: Welcome aboard the PEBBLE BAY GYM! My critters were raised in rock pools and rainy days. Ready to get soaked?', win: 'NORA: Well, shiver me timbers! The SPLASH BADGE is yours.', after: 'NORA: Two badges, JACK! You\'re a proper critter trainer now. Your Mom will be chuffed.' } },
    ],
  });

  // ================================================================ music (original, Game Boy style). Written in eighths, played as 16ths.
  const ex = a => { const o = []; for (const n of a) { if (n > 0) o.push(n, -1); else if (n === -1) o.push(-1, -1); else o.push(0, 0); } return o; };
  const SONGS = {
    town: { bpm: 120, vol: 0.045, lead: ex([72, 76, 79, 76, 77, 81, 79, -1, 76, 74, 72, 74, 76, -1, -1, 0, 72, 76, 79, 76, 77, 81, 84, -1, 83, 79, 77, 74, 72, -1, -1, 0]),
      bass: ex([48, 0, 55, 0, 53, 0, 55, 0, 48, 0, 55, 0, 43, 0, 55, 0, 48, 0, 55, 0, 53, 0, 57, 0, 55, 0, 50, 0, 48, 0, 0, 0]) },
    home: { bpm: 96, vol: 0.04, lead: ex([76, -1, 74, 72, 74, -1, 79, -1, 77, 76, 74, -1, 72, -1, -1, 0, 76, -1, 74, 72, 74, 76, 77, -1, 76, 74, 71, -1, 72, -1, -1, 0]),
      bass: ex([48, 0, 52, 0, 53, 0, 55, 0, 50, 0, 53, 0, 48, 0, 52, 0, 48, 0, 52, 0, 53, 0, 50, 0, 55, 0, 43, 0, 48, 0, 0, 0]) },
    route: { bpm: 140, vol: 0.045, lead: ex([67, -1, 71, 74, 72, 71, 69, -1, 71, -1, 67, -1, 64, 66, 67, -1, 67, -1, 71, 74, 76, 74, 72, 71, 69, 71, 72, 69, 67, -1, -1, 0]),
      bass: ex([43, 50, 43, 50, 48, 55, 48, 55, 43, 50, 43, 50, 40, 47, 40, 47, 43, 50, 43, 50, 48, 55, 48, 55, 50, 57, 50, 57, 43, 50, 43, 0]) },
    woods: { bpm: 100, vol: 0.045, lead: ex([62, -1, 65, 69, 67, -1, 65, -1, 64, -1, 62, -1, 61, -1, -1, 0, 62, -1, 65, 69, 72, -1, 70, 69, 67, 65, 64, 61, 62, -1, -1, 0]),
      bass: ex([38, 0, 45, 0, 38, 0, 45, 0, 37, 0, 45, 0, 37, 0, 45, 0, 38, 0, 45, 0, 34, 0, 41, 0, 33, 0, 40, 0, 38, 0, 0, 0]) },
    gym: { bpm: 150, vol: 0.045, lead: ex([69, 72, 69, 76, -1, 74, 72, -1, 71, 72, 74, 72, 71, -1, 67, -1, 69, 72, 69, 76, -1, 77, 79, -1, 77, 76, 74, 71, 69, -1, -1, 0]),
      bass: ex([45, 52, 45, 52, 45, 52, 45, 52, 43, 50, 43, 50, 43, 50, 43, 50, 41, 48, 41, 48, 43, 50, 43, 50, 40, 47, 40, 47, 45, 52, 45, 0]) },
    battle: { bpm: 172, vol: 0.05, drums: 'o.x.o.x.o.x.oox.', lead: ex([69, 72, 76, 72, 69, 72, 76, 79, 77, 76, 74, 72, 71, 72, 74, -1, 69, 72, 76, 72, 69, 72, 76, 81, 79, 77, 76, 74, 76, -1, -1, -1]),
      bass: ex([45, 45, 57, 45, 45, 45, 57, 45, 41, 41, 53, 41, 43, 43, 55, 43, 45, 45, 57, 45, 45, 45, 57, 45, 40, 40, 52, 40, 40, 52, 40, 52]) },
    leader: { bpm: 184, vol: 0.05, drums: 'o.xoo.x.o.xoo.xx', lead: ex([64, 67, 71, 74, 72, 71, 67, 71, 69, 72, 76, 79, 77, 76, 72, 76, 64, 67, 71, 74, 76, 74, 71, 74, 72, 71, 69, 68, 69, -1, 0, 0]),
      bass: ex([40, 40, 52, 40, 40, 40, 52, 40, 45, 45, 57, 45, 45, 45, 57, 45, 40, 40, 52, 40, 43, 43, 55, 43, 45, 45, 44, 44, 45, 45, 57, 45]) },
    club: { bpm: 112, vol: 0.045, lead: ex([76, 79, 83, 79, 81, -1, 79, -1, 76, 74, 76, 79, 74, -1, -1, 0, 76, 79, 83, 86, 84, -1, 83, 81, 79, 81, 83, 79, 76, -1, -1, 0]),
      bass: ex([40, 47, 40, 47, 45, 52, 45, 52, 43, 50, 43, 50, 38, 45, 38, 45, 40, 47, 40, 47, 45, 52, 45, 52, 43, 50, 47, 50, 40, 47, 40, 0]) },
    title: { bpm: 132, vol: 0.05, lead: ex([72, -1, 79, -1, 77, 76, 74, 76, 72, -1, 67, -1, 69, 71, 72, -1, 74, -1, 77, -1, 76, 74, 72, 74, 79, -1, -1, 77, 76, -1, -1, 0]),
      bass: ex([48, 55, 48, 55, 53, 60, 53, 60, 48, 55, 48, 55, 45, 52, 45, 52, 50, 57, 50, 57, 53, 60, 53, 60, 55, 62, 55, 62, 48, 55, 48, 0]) },
  };

  SONGS.cave = { bpm: 92, vol: 0.045, lead: ex([64, -1, 0, 67, 66, -1, 0, 0, 64, -1, 0, 71, 70, -1, -1, 0, 62, -1, 0, 65, 64, -1, 0, 0, 62, 64, 65, 67, 64, -1, -1, 0]),
    bass: ex([40, 0, 40, 0, 47, 0, 40, 0, 40, 0, 40, 0, 46, 0, 40, 0, 38, 0, 38, 0, 45, 0, 38, 0, 38, 0, 40, 0, 41, 0, 40, 0]) };
  SONGS.bay = { bpm: 128, vol: 0.045, lead: ex([72, 76, 79, 81, 79, -1, 76, -1, 77, 81, 84, 81, 79, -1, -1, 0, 76, 79, 84, 86, 84, -1, 81, 79, 77, 76, 74, 76, 72, -1, -1, 0]),
    bass: ex([48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 55, 0, 50, 0, 48, 0, 55, 0, 52, 0, 57, 0, 53, 0, 50, 0, 48, 0, 0, 0]) };

  // ================================================================ the link cable: what JackNet's Cable Club (mods/lk.js) says
  const LINK = { q: [], list: [], hello: null, up: false };
  if (window.Net) {
    for (const t of ['lkHello', 'lkList', 'lkAsk', 'lkNo', 'lkStart', 'lkEnd', 'lkOffer', 'lkOk', 'lkGot', 'lkBStart', 'lkTurn', 'lkBEnd', 'lkReady', 'lkErr']) Net.on(t, m => {
      if (t === 'lkHello') LINK.hello = m; else if (t === 'lkList') LINK.list = m.list || [];
      if (t === 'lkList' || t === 'lkOk' || t === 'lkReady') return; // (state only: nothing waits for these)
      if (LINK.up || t === 'lkGot' || t === 'lkHello') { LINK.q.push(m); if (LINK.q.length > 60) LINK.q.shift(); }
    });
  }
  const lsend = m => { try { if (window.Net) Net.send(m); } catch (e) {} };
  const member = () => !!(window.Net && Net.me && Net.me.member);

  // the two cartridges: Moss Version (Jack's) and Puddle Version (JackK's). Same island, different critters in the grass.
  function cart(VER) { const VV = LC.VERSIONS[VER], PUD = VER === 'puddle'; return {
    buttons: ['a', 'b'], v: 1,
    help: 'Walk: arrows. A (talk, choose): Z. B (back, run): X. Menu: Enter.',
    make(K) {
      const g = K.g, P = UIPAL[VER] || K.pal, F = K.font, W = K.W, H = K.H; // (a Game Lad COLOUR cartridge: its own colours)
      const rand = Math.random, ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
      const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

      // ============================================================ pixel art: critters (32x32), people (16x16), tiles (16x16)
      function grid(n) {
        const a = new Uint8Array(n * n);
        const set = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && x < n && y >= 0 && y < n) a[y * n + x] = c; };
        const D = {
          a, n, p: set,
          e(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) set(x, y, c); } },
          r(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); },
          t(x1, y1, x2, y2, x3, y3, c) {
            const minx = Math.floor(Math.min(x1, x2, x3)), maxx = Math.ceil(Math.max(x1, x2, x3)), miny = Math.floor(Math.min(y1, y2, y3)), maxy = Math.ceil(Math.max(y1, y2, y3));
            const s = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
            for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) { const px = x + 0.5, py = y + 0.5, d1 = s(x1, y1, x2, y2, px, py), d2 = s(x2, y2, x3, y3, px, py), d3 = s(x3, y3, x1, y1, px, py); if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) set(x, y, c); }
          },
          l(x1, y1, x2, y2, c) { const n2 = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) || 1; for (let i = 0; i <= n2; i++) set(Math.round(x1 + (x2 - x1) * i / n2), Math.round(y1 + (y2 - y1) * i / n2), c); },
          eye(x, y) { D.r(x, y, 2, 3, 3); set(x, y, 4); },
          mirror() { for (let y = 0; y < n; y++) for (let x = 0; x < n / 2; x++) { const v = a[y * n + x]; if (v && !a[y * n + n - 1 - x]) a[y * n + n - 1 - x] = v; } },
          flipX() { for (let y = 0; y < n; y++) for (let x = 0; x < n / 2; x++) { const i = y * n + x, j = y * n + n - 1 - x, v = a[i]; a[i] = a[j]; a[j] = v; } },
          finish(shade) { // rim shading low-right, then an outline round everything
            if (shade) { const b = a.slice(); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = y * n + x; if (b[i] !== 1) continue; const below = y + 2 >= n || !b[(y + 2) * n + x], right = x + 1 >= n || !b[i + 1]; if (below || (right && (x + y) % 2)) a[i] = 2; } }
            const b = a.slice(); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = y * n + x; if (b[i]) continue; if ((x > 0 && b[i - 1]) || (x < n - 1 && b[i + 1]) || (y > 0 && b[i - n]) || (y < n - 1 && b[i + n])) a[i] = 3; }
          },
        };
        return D;
      }
      function toCanvas(D, pal) {
        const n = D.n, c = mkc(n, n), x = c.getContext('2d'), col = pal ? [null, pal[1], pal[2], pal[3], pal[0]] : [null, P[1], P[2], P[3], P[0]];
        for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) { const v = D.a[y * n + i]; if (v) { x.fillStyle = col[v]; x.fillRect(i, y, 1, 1); } }
        return c;
      }
      // each critter, drawn into a 32x32 grid (1 body, 2 shade, 3 dark, 4 light). Left half, then mirrored where it's symmetrical
      const ART = [
        D => { D.e(16, 21, 9, 8, 1); D.e(16, 24, 5, 4, 4); D.r(15, 9, 2, 5, 2); D.t(15, 13, 6, 7, 12, 14, 1); D.l(14, 12, 9, 8, 2); D.eye(11, 18); D.p(15, 24, 3); D.e(11, 29, 3, 2, 2); D.mirror(); },
        D => { D.e(16, 20, 13, 9, 1); D.e(16, 13, 10, 4, 2); D.e(9, 11, 3, 3, 2); D.e(16, 8, 3, 3, 2); D.p(9, 10, 4); D.eye(10, 18); D.l(11, 24, 15, 25, 3); D.e(16, 25, 6, 3, 4); D.r(6, 25, 4, 5, 2); D.mirror(); },
        D => { D.e(16, 22, 9, 8, 1); D.t(16, 5, 8, 19, 24, 19, 1); D.eye(12, 19); D.p(15, 26, 3); D.e(6, 22, 3, 2, 2); D.mirror(); D.p(12, 11, 4); D.p(12, 12, 4); D.p(13, 10, 4); },
        D => { D.e(16, 22, 14, 8, 1); D.e(9, 14, 4, 4, 1); D.eye(8, 13); D.l(5, 24, 15, 25, 3); D.e(16, 27, 8, 2, 4); D.p(11, 20, 2); D.p(13, 21, 2); D.r(3, 27, 4, 3, 2); D.mirror(); },
        D => { D.e(16, 24, 8, 7, 1); D.e(16, 15, 8, 7, 1); D.e(9, 9, 3, 3, 1); D.p(9, 9, 2); D.eye(12, 14); D.p(15, 18, 3); D.t(16, 1, 12, 9, 20, 9, 2); D.t(16, 4, 14, 9, 18, 9, 4); D.e(11, 30, 3, 2, 2); D.e(16, 25, 4, 4, 4); D.mirror(); },
        D => { D.e(16, 22, 12, 9, 1); D.e(16, 12, 8, 7, 1); D.e(9, 6, 3, 3, 1); D.eye(12, 11); D.p(15, 15, 3); D.t(3, 9, 1, 19, 9, 16, 2); D.t(4, 12, 3, 18, 7, 16, 4); D.e(16, 24, 6, 5, 4); D.r(7, 28, 4, 3, 2); D.mirror(); },
        D => { D.e(16, 24, 8, 7, 1); D.e(16, 16, 7, 6, 1); D.e(12, 6, 2, 6, 1); D.r(12, 3, 1, 6, 2); D.eye(12, 15); D.p(15, 18, 3); D.e(16, 25, 4, 3, 4); D.mirror(); D.e(25, 26, 3, 3, 4); },
        D => { D.e(16, 20, 10, 9, 1); D.e(6, 21, 3, 5, 2); D.t(14, 19, 18, 19, 16, 23, 2); D.eye(11, 16); D.t(16, 5, 13, 12, 19, 12, 2); D.r(12, 28, 2, 3, 3); D.e(16, 24, 5, 4, 4); D.mirror(); },
        D => { D.e(16, 22, 7, 7, 1); D.e(16, 15, 6, 5, 1); D.l(12, 11, 9, 7, 3); D.l(9, 7, 12, 4, 3); D.eye(13, 14); D.p(10, 19, 2); D.p(11, 19, 2); D.mirror(); D.l(23, 25, 28, 21, 2); D.l(28, 21, 25, 19, 2); D.l(25, 19, 30, 15, 2); },
        D => { D.e(16, 20, 11, 9, 2); D.e(14, 17, 8, 6, 1); D.eye(11, 18); D.l(9, 16, 13, 17, 3); D.l(13, 24, 16, 24, 3); D.mirror(); D.l(21, 13, 24, 17, 3); D.l(8, 22, 10, 25, 3); },
        D => { D.e(16, 18, 12, 11, 2); D.e(14, 14, 9, 7, 1); D.e(3, 20, 3, 5, 2); D.eye(11, 15); D.l(9, 13, 13, 14, 3); D.l(12, 22, 16, 21, 3); D.r(8, 27, 4, 4, 2); D.mirror(); D.l(20, 8, 23, 13, 3); },
        D => { D.e(16, 22, 12, 7, 1); D.e(16, 29, 14, 2, 2); D.eye(11, 20); D.r(10, 19, 3, 1, 2); D.l(13, 25, 16, 25, 3); D.mirror(); D.p(8, 14, 2); D.p(8, 15, 2); D.p(23, 16, 2); },
        D => { D.e(22, 21, 7, 5, 1); D.r(19, 17, 2, 9, 2); D.r(23, 17, 2, 9, 2); D.e(13, 18, 5, 5, 1); D.e(8, 15, 4, 4, 1); D.e(14, 10, 5, 3, 4); D.e(19, 9, 5, 3, 4); D.t(28, 19, 32, 21, 28, 23, 3); D.p(7, 14, 3); D.p(6, 14, 3); D.l(6, 11, 4, 7, 3); D.r(10, 23, 1, 4, 3); D.r(14, 23, 1, 4, 3); },
        D => { D.e(8, 22, 4, 4, 1); D.e(14, 22, 4, 4, 1); D.e(20, 22, 4, 4, 1); D.e(25, 18, 5, 5, 1); D.p(27, 17, 3); D.p(27, 18, 3); D.e(3, 22, 3, 3, 4); D.p(3, 22, 2); for (const x of [8, 14, 20]) D.r(x, 26, 1, 2, 3); D.l(27, 13, 29, 10, 3); },
        D => { D.e(8, 14, 7, 8, 1); D.e(9, 25, 5, 5, 1); D.e(8, 14, 3, 3, 2); D.p(8, 14, 4); D.e(9, 25, 2, 2, 2); D.e(16, 18, 3, 9, 2); D.l(15, 9, 11, 3, 3); D.p(14, 12, 3); D.mirror(); },
        D => { D.e(16, 19, 12, 10, 1); D.e(9, 13, 5, 4, 2); D.e(16, 10, 5, 3, 2); D.t(3, 16, 6, 14, 6, 18, 3); D.t(8, 6, 10, 9, 7, 10, 3); D.t(5, 25, 8, 23, 8, 27, 3); D.eye(12, 18); D.l(13, 24, 16, 23, 3); D.mirror(); },
        D => { D.r(13, 10, 6, 18, 1); D.e(16, 8, 5, 5, 2); D.t(16, 0, 12, 7, 20, 7, 2); D.t(16, 3, 14, 7, 18, 7, 4); D.eye(13, 14); D.p(15, 19, 3); D.r(9, 15, 4, 1, 3); D.r(11, 28, 2, 3, 3); D.mirror(); },
        // ---- the Puddle Version's critters, and the two that only change down a link cable
        D => { D.e(16, 22, 11, 8, 1); D.e(10, 13, 4, 4, 1); D.e(10, 12, 2, 2, 4); D.r(10, 12, 1, 2, 3); D.e(16, 26, 6, 2, 4); D.l(9, 23, 16, 25, 3); D.e(7, 29, 4, 2, 2); D.p(7, 20, 2); D.p(12, 18, 2); D.mirror(); },
        D => { D.e(16, 21, 14, 9, 1); D.e(9, 11, 5, 5, 1); D.e(9, 10, 2, 2, 4); D.r(9, 10, 1, 2, 3); D.e(16, 27, 7, 3, 4); D.l(5, 23, 15, 25, 3); D.p(12, 17, 2); D.p(14, 15, 2); D.p(7, 19, 2); D.p(10, 21, 2); D.e(5, 29, 5, 2, 2); D.mirror(); },
        D => { D.e(16, 19, 10, 7, 1); D.e(9, 15, 5, 5, 1); D.e(16, 12, 6, 5, 1); D.e(11, 11, 2, 2, 4); D.eye(12, 17); D.l(14, 22, 16, 22, 3); D.r(11, 25, 2, 4, 2); D.r(9, 28, 4, 1, 3); D.mirror(); D.e(20, 5, 3, 3, 4); D.e(24, 2, 2, 2, 4); D.e(9, 4, 2, 2, 4); },
        D => { for (let i = 0; i < 12; i++) D.e(4 + i * 2, 21 + Math.sin(i * 0.7) * 5, 3, 3, 1); D.e(27, 15, 4, 4, 1); D.eye(27, 13); D.p(30, 16, 3); D.p(29, 17, 3); for (let i = 1; i < 12; i += 3) D.p(4 + i * 2, 19 + Math.sin(i * 0.7) * 5, 4); D.l(25, 5, 27, 8, 2); D.l(27, 8, 25, 9, 2); D.l(25, 9, 28, 11, 2); D.l(2, 10, 4, 13, 2); D.l(4, 13, 2, 14, 2); },
        D => { D.e(16, 19, 14, 12, 2); D.e(14, 15, 10, 8, 1); D.e(4, 22, 4, 6, 2); D.eye(11, 15); D.l(9, 13, 13, 14, 3); D.l(11, 23, 16, 22, 3); D.r(8, 28, 5, 4, 2); D.l(14, 6, 16, 10, 3); D.mirror(); D.l(22, 9, 25, 14, 3); D.l(7, 18, 9, 20, 3); },
        D => { D.e(16, 22, 14, 9, 1); D.e(16, 30, 15, 2, 2); D.e(16, 15, 9, 6, 1); D.eye(11, 17); D.r(10, 16, 3, 1, 2); D.l(12, 23, 16, 24, 3); D.mirror(); D.e(7, 8, 2, 2, 4); D.e(24, 6, 3, 3, 4); D.e(20, 2, 1.5, 1.5, 4); D.p(8, 20, 2); D.p(22, 25, 2); D.p(14, 27, 2); },
      ];
      const artOf = s => FUNNY[s] ? FUNNY[s][3] : ART[s];
      const sprC = {}, sprite = s => sprC[s] || (sprC[s] = (() => { const D = grid(32); artOf(s)(D); D.finish(true); return toCanvas(D, FUNPAL(s)); })());
      const sprF = {}, spriteF = s => sprF[s] || (sprF[s] = (() => { const D = grid(32); artOf(s)(D); D.finish(true); D.flipX(); return toCanvas(D, FUNPAL(s)); })());
      // people: dir down / up / left / right, two walking frames
      function personArt(st, dir, fr) {
        const D = grid(16), skin = 4, hair = st.hair || 3, shirt = st.shirt || 2;
        const side = dir === 'left' || dir === 'right';
        D.e(8, 5, 4, 3.8, skin);
        if (dir === 'up') D.e(8, 5, 4, 3.8, hair);
        else {
          for (let y = 1; y <= 3; y++) for (let x = 4; x <= 11; x++) if (D.a[y * 16 + x]) D.p(x, y, hair);
          if (side) { D.r(8, 2, 4, 5, hair); }
          if (st.long) { D.r(4, 4, 1, 6, hair); D.r(11, 4, 1, 6, hair); }
          if (st.spiky) { D.p(5, 0, hair); D.p(8, 0, hair); D.p(11, 0, hair); }
        }
        if (st.cap) { D.r(4, 1, 8, 2, st.capCol || 2); if (dir === 'down') D.r(3, 3, 10, 1, st.capCol || 2); else if (side) D.r(3, 3, 4, 1, st.capCol || 2); }
        if (st.hat) { D.r(5, 0, 6, 2, st.hat); D.r(3, 2, 10, 1, st.hat); }
        if (st.bun) D.e(8, 1, 2, 1.5, hair);
        if (dir === 'down') { D.p(6, 5, 3); D.p(9, 5, 3); }
        else if (side) D.p(5, 5, 3);
        D.r(5, 9, 6, 4, shirt);
        if (st.coat) { D.r(4, 9, 8, 5, 4); D.r(7, 9, 2, 4, 2); }
        if (st.dress) D.r(4, 12, 8, 2, shirt);
        const sw = fr ? 1 : 0;
        if (!side) { D.r(4, 9 + sw, 1, 3, shirt); D.r(11, 10 - sw, 1, 3, shirt); D.p(4, 12 + sw, skin); D.p(11, 13 - sw, skin); }
        else { D.r(7 + (fr ? 1 : 0), 10, 2, 3, shirt); D.p(7 + (fr ? 1 : 0), 13, skin); }
        if (!side) { D.r(5, 13, 2, fr ? 2 : 3, 3); D.r(9, 13, 2, fr ? 3 : 2, 3); }
        else { D.r(5 + (fr ? -1 : 0), 13, 2, 3, 3); D.r(8 + (fr ? 1 : 0), 13, 2, 3, 3); }
        D.finish(false);
        if (dir === 'right') D.flipX();
        return toCanvas(D, st.col);
      }
      const pplC = {}, person = (k, dir, fr) => { const key = k + dir + fr; return pplC[key] || (pplC[key] = personArt(PEOPLE[k], dir, fr)); };
      const objC = {};
      function objArt(k) {
        if (objC[k]) return objC[k];
        const D = grid(16);
        if (k === 'ball') { D.e(8, 9, 5, 5, 1); D.r(3, 9, 11, 1, 3); D.e(8, 9, 1.6, 1.6, 4); D.p(6, 6, 4); }
        else { D.r(4, 5, 8, 8, 1); D.r(4, 5, 8, 2, 4); D.r(7, 5, 2, 8, 2); D.p(8, 9, 4); }
        D.finish(false); return objC[k] = toCanvas(D, OCOL[k]);
      }
      // tiles
      const tileC = {};
      function tileArt(ch, fr) {
        const key = ch + (fr || 0); if (tileC[key]) return tileC[key];
        const c = mkc(16, 16), x = c.getContext('2d'), TP = TPAL[ch] || P;
        const f = (col, a, b, w, h) => { x.fillStyle = TP[col]; x.fillRect(a, b, w, h); };
        const grassBase = () => { f(0, 0, 0, 16, 16); f(1, 3, 4, 1, 2); f(1, 4, 3, 1, 1); f(1, 11, 10, 1, 2); f(1, 12, 9, 1, 1); f(1, 7, 13, 1, 1); };
        switch (ch) {
          case '.': grassBase(); break;
          case ',': f(0, 0, 0, 16, 16); for (let i = 0; i < 6; i++) f(1, (i * 7 + 3) % 15, (i * 5 + 2) % 15, 1, 1); break;
          case 'f': grassBase(); for (const [a, b] of [[4, 4], [11, 10]]) { f(2, a - 1, b, 3, 1); f(2, a, b - 1, 1, 3); f(0, a, b, 1, 1); } break;
          case '"': case '~':
            f(ch === '~' ? 1 : 0, 0, 0, 16, 16);
            for (let i = 0; i < 4; i++) { const a = (i % 2) * 8, b = (i >> 1) * 8; f(2, a + 1, b + 2, 1, 6); f(2, a + 3, b, 1, 8); f(2, a + 5, b + 2, 1, 6); f(1, a + 2, b + 4, 1, 4); f(1, a + 4, b + 3, 1, 5); }
            break;
          case 'T': f(0, 0, 0, 16, 16); x.fillStyle = TP[2]; x.beginPath(); x.arc(8, 6, 7, 0, 7); x.fill(); f(1, 4, 2, 3, 2); f(1, 9, 4, 2, 2); f(1, 5, 6, 2, 1); f(3, 7, 12, 2, 4); f(3, 2, 11, 12, 1); break;
          case 'W': f(1, 0, 0, 16, 16); { const o = fr ? 4 : 0; f(0, (2 + o) % 16, 4, 5, 1); f(0, (9 + o) % 16, 10, 5, 1); f(2, (6 + o) % 16, 13, 4, 1); } break;
          case 'R': f(2, 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { f(3, 0, y + 3, 16, 1); for (let i = (y / 4 % 2) * 4; i < 16; i += 8) f(3, i, y, 1, 3); } f(1, 0, 0, 16, 1); break;
          case '#': f(0, 0, 0, 16, 16); f(1, 0, 5, 16, 1); f(1, 0, 11, 16, 1); f(1, 4, 0, 1, 5); f(1, 12, 6, 1, 5); f(1, 6, 12, 1, 4); f(2, 0, 15, 16, 1); break;
          case 'O': tileArt('#'); x.drawImage(tileC['#0'], 0, 0); f(3, 3, 3, 10, 9); f(1, 4, 4, 8, 7); f(0, 5, 5, 2, 2); f(3, 7, 4, 1, 7); f(3, 4, 7, 8, 1); break;
          case 'D': f(2, 0, 0, 16, 16); f(3, 2, 1, 12, 15); f(2, 3, 2, 10, 14); f(1, 4, 3, 3, 5); f(1, 9, 3, 3, 5); f(0, 10, 9, 2, 2); break;
          case 'S': grassBase(); f(3, 7, 9, 2, 7); f(3, 2, 3, 12, 7); f(1, 3, 4, 10, 5); f(2, 4, 5, 6, 1); f(2, 4, 7, 4, 1); break;
          case 'X': f(3, 0, 0, 16, 16); f(2, 0, 12, 16, 4); f(1, 0, 15, 16, 1); break;
          case '_': f(0, 0, 0, 16, 16); f(1, 0, 7, 16, 1); f(1, 0, 15, 16, 1); f(1, 5, 0, 1, 7); f(1, 12, 8, 1, 7); break;
          case 'm': f(0, 0, 0, 16, 16); f(2, 1, 2, 14, 12); f(1, 2, 3, 12, 10); f(2, 3, 5, 10, 1); f(2, 3, 9, 10, 1); break;
          case 'K': f(2, 0, 0, 16, 16); for (let y = 1; y < 16; y += 7) { f(3, 0, y + 5, 16, 1); for (let i = 1; i < 15; i += 3) f(i % 2 ? 0 : 1, i, y, 2, 5); } break;
          case 'P': f(0, 0, 0, 16, 16); f(3, 2, 2, 12, 10); f(1, 3, 3, 10, 8); f(0, 4, 4, 3, 2); f(2, 6, 12, 4, 2); f(3, 4, 14, 8, 1); break;
          case 'M': f(0, 0, 0, 16, 16); f(3, 1, 3, 14, 12); f(1, 2, 4, 12, 6); for (let i = 0; i < 6; i++) f(i % 2 ? 0 : 2, 3 + i * 2, 6, 1, 2); f(2, 3, 11, 10, 3); break;
          case 't': f(0, 0, 0, 16, 16); f(3, 0, 2, 16, 12); f(1, 1, 3, 14, 9); f(0, 2, 4, 6, 1); f(3, 2, 14, 2, 2); f(3, 12, 14, 2, 2); break;
          case 'C': f(0, 0, 0, 16, 16); f(3, 0, 2, 16, 13); f(1, 0, 3, 16, 4); f(2, 0, 7, 16, 8); f(0, 0, 3, 16, 1); break;
          case 'b': f(0, 0, 0, 16, 16); f(3, 1, 0, 14, 16); f(0, 2, 1, 12, 4); f(1, 2, 6, 12, 9); f(2, 2, 6, 12, 1); break;
          case 'Q': f(0, 0, 0, 16, 16); x.fillStyle = TP[2]; x.beginPath(); x.arc(8, 6, 5, 0, 7); x.fill(); f(1, 5, 3, 2, 2); f(3, 5, 10, 6, 5); f(2, 6, 11, 4, 3); break;
          case 'H': f(0, 0, 0, 16, 16); f(3, 0, 2, 16, 14); f(2, 1, 3, 14, 12); for (let i = 0; i < 6; i++) f(1, 2 + (i * 5) % 12, 4 + (i * 3) % 9, 2, 2); break;
          // (G) the cave, the beach and the bay
          case '=': f(0, 0, 0, 16, 16); f(1, 3, 4, 2, 1); f(1, 11, 9, 3, 1); f(2, 6, 12, 2, 1); f(1, 13, 2, 1, 1); f(2, 2, 10, 1, 1); break;
          case 'V': case 'E': f(1, 0, 0, 16, 16); f(0, 1, 1, 6, 3); f(0, 9, 7, 5, 3); f(2, 0, 5, 7, 1); f(2, 7, 0, 1, 7); f(2, 8, 11, 8, 1); f(2, 3, 12, 1, 4); f(3, 0, 15, 16, 1);
            if (ch === 'E') { x.fillStyle = TP[3]; x.beginPath(); x.ellipse(8, 11, 6, 6, 0, Math.PI, 0); x.fill(); f(3, 2, 11, 12, 5); } break;
          case ':': f(0, 0, 0, 16, 16); for (let i = 0; i < 7; i++) f(i % 2 ? 1 : 2, (i * 7 + 2) % 15, (i * 5 + 3) % 15, 1, 1); f(1, 4, 9, 3, 1); break;
          case 'F': f(0, 0, 0, 16, 16); f(1, 3, 4, 1, 2); f(1, 11, 10, 1, 2); f(2, 1, 3, 3, 11); f(2, 12, 3, 3, 11); f(2, 0, 5, 16, 2); f(2, 0, 10, 16, 2); f(3, 1, 13, 3, 1); f(3, 12, 13, 3, 1); break;
          case 'B': f(0, 0, 0, 16, 16); x.fillStyle = TP[3]; x.beginPath(); x.arc(8, 9, 7, 0, 7); x.fill(); x.fillStyle = TP[1]; x.beginPath(); x.arc(8, 8.5, 6, 0, 7); x.fill(); f(0, 4, 4, 3, 2); f(2, 7, 11, 5, 2); break;
          default: f(0, 0, 0, 16, 16);
        }
        return tileC[key] = c;
      }

      // ============================================================ the save (everything that matters lives in S)
      let S = null;
      const fresh = () => ({ v: 1, map: 'house', x: 4, y: 5, dir: 'up', party: [], box: [], bag: { CUBE: 0, CAKE: 1, BIG: 0, PEP: 0 }, money: 300, f: {}, seen: {}, caught: {}, beaten: {}, taken: {}, badges: 0, play: 0 });
      const saved = (() => { const s = K.load(); return s && s.v === 1 && Array.isArray(s.party) ? s : null; })();
      let saveT = 0;
      function save() { if (!S) return; S.x = pl.x; S.y = pl.y; S.dir = pl.dir; S.map = map.id; K.save(S); }
      const alive = () => S.party.filter(c => c.hp > 0);
      const healAll = () => { for (const c of S.party) c.hp = maxhp(c); };
      function score() {
        const lv = S.party.reduce((n, c) => n + c.lv, 0) + S.box.reduce((n, c) => n + c.lv, 0);
        return Object.keys(S.caught).length * 50 + S.badges * 500 + Object.keys(S.beaten).length * 100 + Math.min(lv, 150) * 2;
      }
      // progress reports to JackNet (spaced out: the server checks points per second since the last one)
      let lastRep = { t: 0, sc: 0 }, pending = false, finalDone = false;
      function report(force) {
        if (!S) return;
        const sc = score(); if (sc <= lastRep.sc) { pending = false; return; }
        if (!force && (map.id === 'gym' || K.t - lastRep.t < sc / 40 + 8)) { pending = true; return; }
        K.over(sc, { keep: true }); lastRep = { t: K.t, sc }; pending = false;
      }

      // ============================================================ the script runner (generators: yield a task, get its result)
      let script = null, task = null, mode = 'title';
      function run(gen) { script = gen; step(undefined); }
      function step(v) {
        for (;;) {
          if (!script) return;
          let r; try { r = script.next(v); } catch (e) { console.error(e); script = null; task = null; mode = S ? 'world' : 'title'; return; }
          if (r.done) { script = null; task = null; return; }
          task = r.value;
          if (!task || task.now) { v = task ? task.value : undefined; continue; }
          return;
        }
      }
      function runTask() {
        if (!task) return false;
        const res = task.update();
        if (res !== undefined) { task = null; step(res === NOTHING ? undefined : res); }
        return true;
      }
      const NOTHING = {};
      // ---- text: a box at the bottom, typed out, A or B for the next page
      function wrap(text, w) {
        const out = []; for (const para of String(text).split('\n')) { let line = ''; for (const word of para.split(' ')) { if ((line + (line ? ' ' : '') + word).length > w) { if (line) out.push(line); line = word; } else line += (line ? ' ' : '') + word; } out.push(line); }
        return out;
      }
      function box(x, y, w, h) { g.fillStyle = P[3]; g.fillRect(x, y, w, h); g.fillStyle = P[0]; g.fillRect(x + 1, y + 1, w - 2, h - 2); g.fillStyle = P[3]; g.fillRect(x + 3, y + 3, w - 6, h - 6); g.fillStyle = P[0]; g.fillRect(x + 4, y + 4, w - 8, h - 8); }
      let held = null; // text that stays up under a choice
      function drawText(lines, n, arrow) {
        box(0, 96, 160, 48);
        let left = n == null ? 1e9 : n;
        lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, left)); left -= l.length; F.draw(g, s, 9, 106 + i * 14, P[3]); });
        if (arrow && (K.frame >> 4) % 2) F.draw(g, '↓', 146, 132, P[3]);
      }
      function say(text, o) {
        o = o || {};
        const lines = wrap(text, 23), pages = []; for (let i = 0; i < lines.length; i += 2) pages.push(lines.slice(i, i + 2));
        let pi = 0, ch = 0;
        return {
          update() {
            const pg = pages[pi], total = pg.join('').length;
            if (ch < total) { ch += (K.frame % 2 ? 1 : 0) + (K.held('a') || K.held('b') ? 2 : 1); if (K.pressed('a') || K.pressed('b')) ch = total; if (ch >= total && o.hold && pi === pages.length - 1) { held = pg; return NOTHING; } return; }
            if (o.hold && pi === pages.length - 1) { held = pg; return NOTHING; }
            if (K.pressed('a') || K.pressed('b')) { K.sfx.tone(1200, 0.03, 'square', 0.05); pi++; ch = 0; if (pi >= pages.length) return NOTHING; }
          },
          draw() { drawText(pages[pi], ch, ch >= pages[pi].join('').length && !o.hold); },
        };
      }
      // ---- a list to choose from. Returns the index (or -1 for B)
      function menu(items, o) {
        o = o || {}; let i = o.start || 0; const n = items.length;
        const w = o.w || Math.max(...items.map(s => s.length)) * 6 + 22, rows = o.rows || n, lh = o.lh || 12, hh = rows * lh + 10;
        const x = o.x != null ? o.x : W - w, y = o.y != null ? o.y : (o.under ? 96 - hh : 0);
        let top = 0;
        return {
          update() {
            if (o.cols) { if (K.pressed('up') || K.pressed('down')) { i = i % rows ? i - 1 : Math.min(n - 1, i + 1); K.sfx.tone(900, 0.02, 'square', 0.04); } }
            else {
              if (K.pressed('up')) { i = (i + n - 1) % n; K.sfx.tone(900, 0.02, 'square', 0.04); }
              if (K.pressed('down')) { i = (i + 1) % n; K.sfx.tone(900, 0.02, 'square', 0.04); }
            }
            if (o.cols && K.pressed('right')) i = Math.min(n - 1, i + rows);
            if (o.cols && K.pressed('left')) i = Math.max(0, i - rows);
            if (i < top) top = i; if (i >= top + rows && !o.cols) top = i - rows + 1;
            if (o.onMove) o.onMove(i);
            if (K.pressed('a')) { K.sfx.tone(1400, 0.04, 'square', 0.06); held = null; return i; }
            if (K.pressed('b') && o.cancel !== false) { K.sfx.tone(600, 0.04, 'square', 0.05); held = null; return -1; }
          },
          draw() {
            if (o.under) o.under(); if (held) drawText(held);
            if (o.cols) {
              box(x, y, w, hh);
              items.forEach((s, j) => { const cx = x + 8 + Math.floor(j / rows) * (o.colW || 36), cy = y + 7 + (j % rows) * lh; F.draw(g, (j === i ? '>' : ' ') + s, cx - 2, cy, P[3]); });
            } else {
              box(x, y, w, hh);
              for (let j = top; j < Math.min(n, top + rows); j++) F.draw(g, (j === i ? '>' : ' ') + items[j], x + 6, y + 7 + (j - top) * lh, P[3]);
            }
            if (o.after) o.after(i);
          },
        };
      }
      const wait = n => ({ update() { if (--n <= 0) return NOTHING; } });
      const fn = (u, d) => ({ update: u, draw: d });
      function* msg(t) { yield say(t); }
      function* ask(t, opts) { yield say(t, { hold: true }); return yield menu(opts || ['YES', 'NO'], { under: null, y: 96 - ((opts || [0, 0]).length * 12 + 10), cancel: true }); }
      // fades: an ordered dither of the lightest shade
      const fadePat = [];
      function pat(level) {
        if (fadePat[level]) return fadePat[level];
        const c = mkc(4, 4), x = c.getContext('2d'), B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
        x.fillStyle = P[0]; for (let y = 0; y < 4; y++) for (let i = 0; i < 4; i++) if (B[y][i] < level * 4) x.fillRect(i, y, 1, 1);
        return fadePat[level] = g.createPattern(c, 'repeat');
      }
      let fadeLv = 0;
      const fade = (out, col) => { let t = 0; return fn(() => { t++; fadeLv = out ? Math.min(4, t >> 1) : Math.max(0, 4 - (t >> 1)); if (t >= 9) return NOTHING; }); };
      function drawFade() { if (fadeLv > 0) { g.fillStyle = fadeLv >= 4 ? P[0] : pat(fadeLv); g.fillRect(0, 0, W, H); } }

      // ============================================================ the overworld
      let map = MAPS.house, npcs = [];
      const pl = { x: 4, y: 5, dir: 'up', mx: 0, my: 0, moving: 0, fr: 0, turn: 0 };
      const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const opp = { up: 'down', down: 'up', left: 'right', right: 'left' };
      const tileAt = (m, x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h) ? m.out : m.rows[y][x];
      function loadMap(id, x, y, dir) {
        map = MAPS[id]; pl.x = x; pl.y = y; if (dir) pl.dir = dir; pl.mx = pl.my = 0; pl.moving = 0;
        npcs = (NPCS[id] || []).filter(n => !(n.obj === 'ball' && S.taken[n.id]) && !(n.obj === 'cube' && S.f.starter)).map(n => Object.assign({ mx: 0, my: 0, dir: n.dir || 'down', home: [n.x, n.y], wt: 60 + ri(0, 120) }, n));
        if (id === 'lab' && S.f.starter && !S.f.rivalGone) { /* JackK stays until after the battle */ }
        if (id === 'lab' && S.f.rivalGone) npcs = npcs.filter(n => !n.rival);
        S.map = id;
        playSong();
      }
      function playSong() { K.music(SONGS[map.song] || SONGS.town); }
      const npcAt = (x, y) => npcs.find(n => n.x === x && n.y === y);
      const blocked = (x, y) => SOLID.has(tileAt(map, x, y)) || !!npcAt(x, y) || (pl.x === x && pl.y === y);
      function interactFace() {
        const [dx, dy] = DIRS[pl.dir]; let tx = pl.x + dx, ty = pl.y + dy;
        let n = npcAt(tx, ty);
        if (!n && tileAt(map, tx, ty) === 'C') { n = npcAt(tx + dx, ty + dy); }
        if (n) return run(talkTo(n));
        const t = tileAt(map, tx, ty), sk = `${map.id}:${tx},${ty}`;
        if (t === 'S' && SIGNS[sk]) return run(msg(SIGNS[sk]));
        const words = { K: 'Shelves full of books. "CRITTERS AND HOW TO CUDDLE THEM", "MOSS: A HISTORY"...', P: map.id.startsWith('centre') ? null : map.id === 'lab' ? 'A big humming computer. It is cleverer than you. (It plays chess.)' : 'The telly. There\'s a cartoon on about a boy and his critter. Classic.',
          M: 'A machine that makes critters feel better. It goes PING.', b: 'Your bed. You had a dream about a GIANT critter last night.', t: map.id === 'lab' ? 'A tidy table. The Professor\'s cup of tea has gone cold.' : 'The kitchen table. There\'s a plate of biscuits. Mom has counted them.', Q: 'A pot plant. It\'s a bit droopy.' };
        if (t === 'P' && map.id.startsWith('centre')) return run(pcScript());
        if (words[t]) return run(msg(words[t]));
      }
      function tryStep(dir) {
        const [dx, dy] = DIRS[dir], nx = pl.x + dx, ny = pl.y + dy;
        pl.dir = dir;
        // Mom's rule: no long grass without a critter
        if (map.id === 'town' && ny === 0 && !S.f.starter) return run(noCritter());
        if (blocked(nx, ny)) { if (!pl.bump) { K.sfx.tone(90, 0.05, 'square', 0.06); pl.bump = 12; } return; }
        pl.x = nx; pl.y = ny; pl.mx = -dx * 16; pl.my = -dy * 16; pl.moving = 1; pl.fr ^= 1;
      }
      function arrived() {
        const w = warpAt(map.id, pl.x, pl.y);
        if (w) return run(warpTo(w));
        if (trainerSees()) return;
        const t = tileAt(map, pl.x, pl.y);
        if ((t === '"' || t === '~' || (map.cave && t === '=')) && S.party.length && rand() < (map.cave ? 0.07 : 0.11)) return run(wild(t === '~'));
      }
      function* warpTo(w) {
        K.sfx.tone(400, 0.08, 'square', 0.06, 0, 200);
        yield fade(true);
        save();
        loadMap(w[3], w[4], w[5], w[6]);
        save();
        yield fade(false);
        report();
      }
      function* noCritter() {
        yield* msg('MOM: JACK! Don\'t you go in that long grass without a critter of your own!');
        yield* walkPlayer('down', 1);
      }
      const walkPlayer = function* (dir, n) {
        for (let i = 0; i < n; i++) {
          const [dx, dy] = DIRS[dir]; pl.dir = dir; if (blocked(pl.x + dx, pl.y + dy)) break;
          pl.x += dx; pl.y += dy; pl.mx = -dx * 16; pl.my = -dy * 16; pl.fr ^= 1;
          yield fn(() => { const s = 2; if (pl.mx) pl.mx += pl.mx > 0 ? -s : s; if (pl.my) pl.my += pl.my > 0 ? -s : s; if (!pl.mx && !pl.my) return NOTHING; });
        }
        pl.dir = pl.dir;
      };
      const walkNpc = function* (n, dir, steps) {
        for (let i = 0; i < steps; i++) {
          const [dx, dy] = DIRS[dir]; n.dir = dir; n.x += dx; n.y += dy; n.mx = -dx * 16; n.my = -dy * 16; n.fr = (n.fr || 0) ^ 1;
          yield fn(() => { if (n.mx) n.mx += n.mx > 0 ? -2 : 2; if (n.my) n.my += n.my > 0 ? -2 : 2; if (!n.mx && !n.my) return NOTHING; });
        }
      };
      // trainers spot you along the way they're facing
      function trainerSees() {
        for (const n of npcs) {
          if (!n.tr || !n.sight || S.beaten[n.id]) continue;
          const [dx, dy] = DIRS[n.dir];
          for (let k = 1; k <= n.sight; k++) {
            const x = n.x + dx * k, y = n.y + dy * k;
            if (x === pl.x && y === pl.y) { run(spotted(n, k)); return true; }
            if (SOLID.has(tileAt(map, x, y)) || npcAt(x, y)) break;
          }
        }
        return false;
      }
      let bang = null;
      function* spotted(n, dist) {
        bang = n; K.sfx.seq([[84, 0.25], [88, 0.5]], { bpm: 300, vol: 0.08 });
        yield wait(40); bang = null;
        if (dist > 1) yield* walkNpc(n, n.dir, dist - 1);
        pl.dir = opp[n.dir];
        yield* trainerBattle(n);
      }
      function* trainerBattle(n) {
        if (S.beaten[n.id]) return yield* msg(n.tr.after);
        if (!alive().length) return yield* msg('Your critters are too tired to battle! Get them healed first.');
        K.music(n.leader ? SONGS.leader : SONGS.battle);
        yield* msg(n.tr.pre);
        const team = n.tr.team.map(([s, lv]) => mon(s, lv));
        const res = yield* battle(team, n);
        if (res === 'win') {
          S.beaten[n.id] = 1;
          yield* msg(n.tr.win);
          S.money += n.tr.money; yield* msg(`JACK got ${n.tr.money}P for winning!`);
          if (n.leader) yield* badge(n.leader);
          else { save(); report(); }
        } else if (res === 'lose') yield* blackout();
        playSong();
      }
      function* talkTo(n) {
        if (n.dir && !n.obj) n.dir = opp[pl.dir];
        if (n.obj === 'ball') {
          S.taken[n.id] = 1; npcs = npcs.filter(x => x !== n);
          S.bag[n.item] = (S.bag[n.item] | 0) + n.n;
          K.sfx.seq([[79, 0.25], [83, 0.25], [86, 0.5]], { bpm: 260, vol: 0.08 });
          yield* msg(`JACK found ${n.n > 1 ? n.n + ' ' : ''}${ITEMS[n.item][0]}${n.n > 1 ? 'S' : ''}!`);
          return;
        }
        if (n.obj === 'cube') return yield* pickStarter(n);
        if (n.mom) return yield* momTalk();
        if (n.prof) return yield* profTalk();
        if (n.rival) return yield* rivalTalk(n);
        if (n.nurse) return yield* nurseTalk();
        if (n.cable) return yield* cableClub();
        if (n.shop) return yield* shopTalk();
        if (n.tr) return yield* trainerBattle(n);
        for (const t of n.talk || []) yield* msg(t);
      }
      function* momTalk() {
        if (!S.f.starter) { yield* msg('MOM: Morning, love! PROFESSOR BRAMBLE popped round. He\'s waiting for you at his lab. Off you go!'); return; }
        yield* msg('MOM: JACK! You look shattered. Sit down and have a rest, and give your critters a cuddle.');
        yield fade(true); healAll(); K.sfx.seq([[76, 0.5], [79, 0.5], [76, 0.5], [72, 0.5], [74, 1], [79, 2]], { bpm: 220, vol: 0.08 }); yield wait(50); yield fade(false);
        yield* msg('MOM: There. All better. Now don\'t stay out too late!');
        save();
      }
      function* profTalk() {
        if (!S.f.starter) return yield* msg('PROF BRAMBLE: Ah, JACK! On the table are three CRITTER CUBES, each with a critter inside. Go on, pick one!');
        if (!S.f.dex) return;
        if (S.badges) { // after the badge: the spare starters nobody picked
          const spare = [0, 2, 4].filter(x => !S.caught[x] && !S.caught[x + 1]);
          if (spare.length) {
            const s0 = spare[0];
            yield* msg(`PROF BRAMBLE: A MOSS BADGE! Well done, JACK. You know, there's a CRITTER CUBE nobody ever picked. ${SP[s0].n} would love a trainer like you.`);
            const c = mon(s0, 5); S.seen[s0] = 1; S.caught[s0] = 1;
            if (S.party.length < 6) S.party.push(c); else S.box.push(c);
            K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]], { bpm: 220, vol: 0.09 });
            yield* msg(`JACK got ${SP[s0].n}!${S.party.includes(c) ? '' : ' (It went to the PC.)'}`);
            save(); report(); return;
          }
        }
        const n = Object.keys(S.caught).length;
        yield* msg(`PROF BRAMBLE: How's your CRITTERDEX? ${n} caught! ${n >= NSP ? 'All of them! You\'re a proper critter expert!' : n >= 8 ? 'Brilliant work. Keep it up!' : 'Keep at it. The WHISPERING WOODS are full of them.'}`);
        if (n < NSP && n >= 6) yield* msg(`PROF BRAMBLE: Some critters only live in the ${PUD ? 'MOSS' : 'PUDDLE'} VERSION, you know. And some only change after a trip down a LINK CABLE! Try the CABLE CLUB at the CRITTER CENTRE.`);
      }
      function* rivalTalk(n) {
        if (!S.f.starter) return yield* msg('JACKK: The Prof said I could have one too. But you can choose first. Go on. (Not that one. Joking!)');
        yield* msg('JACKK: My critter is going to be the best one in the whole of Moss Town!');
      }
      function* pickStarter(n) {
        if (S.f.starter) return;
        const sp = SP[n.starter];
        mode = 'show'; showSp = n.starter;
        const r = yield* ask(`So you want ${sp.n}, the ${sp.t} critter?`);
        mode = 'world';
        if (r !== 0) return;
        const c = mon(n.starter, 5);
        S.party.push(c); S.f.starter = n.starter + 1; S.seen[c.s] = 1; S.caught[c.s] = 1;
        npcs = npcs.filter(x => !(x.obj === 'cube' && x.starter === n.starter));
        K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]], { bpm: 220, vol: 0.09 });
        yield* msg(`JACK got ${sp.n}!`);
        // JackK picks the one that beats yours
        const beats = { 0: 4, 2: 0, 4: 2 }[n.starter];
        const rv = npcs.find(x => x.rival);
        yield* msg(`JACKK: Then I'll have this one!`);
        npcs = npcs.filter(x => !(x.obj === 'cube' && x.starter === beats));
        S.f.rival = beats;
        yield* msg(`JACKK got ${SP[beats].n}!`);
        if (rv) { rv.dir = 'left'; pl.dir = 'right'; }
        yield* msg('JACKK: Right. Let\'s see whose is best! Battle!');
        const res = yield* battle([mon(beats, 4)], { name: 'JACKK', money: 100, rival: true, id: 'jackk' });
        healAll();
        if (res === 'win') { S.beaten.jackk = 1; yield* msg('JACKK: What?! Mine was meant to be the best one! I\'m going to train SO hard.'); S.money += 100; }
        else yield* msg('JACKK: Ha! Better luck next time, JACK! (Don\'t worry, your critter\'s all right. The Prof fixed it up.)');
        if (rv) { yield* walkNpc(rv, 'down', 2); yield* walkNpc(rv, 'left', 3); npcs = npcs.filter(x => x !== rv); }
        S.f.rivalGone = 1; npcs = npcs.filter(x => x.obj !== 'cube');
        yield* msg('PROF BRAMBLE: Splendid! Now, take these. FIVE CRITTER CUBES! Throw one at a tired wild critter to catch it.');
        S.bag.CUBE = (S.bag.CUBE | 0) + 5; S.f.dex = 1;
        yield* msg('PROF BRAMBLE: And this is a CRITTERDEX. It fills itself in as you meet critters. Press START to look at it. Catch them all, JACK!');
        yield* msg('PROF BRAMBLE: The long grass on ROUTE 1 is just north of town. When you\'re ready, HAZEL at the GYM gives a badge to strong trainers.');
        save(); report();
      }
      function* nurseTalk() {
        const r = yield* ask('NURSE JUNIPER: Welcome to the CRITTER CENTRE! Shall I make your critters feel better?');
        if (r !== 0) return yield* msg('NURSE JUNIPER: Come back any time!');
        yield* msg('NURSE JUNIPER: Pop them in the machine...');
        healAll(); K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1], [0, 0.5], [79, 0.5], [84, 2]], { bpm: 240, vol: 0.09 }); yield wait(70);
        yield* msg('NURSE JUNIPER: All done! Your critters are fighting fit. Bye bye!');
        save();
      }
      function* shopTalk() {
        yield* msg('SHOPKEEPER: Hiya! What can I get you?');
        for (;;) {
          const list = ITEM_ORDER.map(k => `${ITEMS[k][0]} ${ITEMS[k][1]}P`);
          const i = yield menu(list.concat(['NO THANKS']), { x: 0, y: 0, w: 160, after: j => { box(0, 72, 160, 24); F.draw(g, `MONEY ${S.money}P`, 8, 81, P[3]); if (j < ITEM_ORDER.length) { /* */ } } });
          if (i < 0 || i >= ITEM_ORDER.length) break;
          const k = ITEM_ORDER[i], price = ITEMS[k][1];
          if (S.money < price) { yield* msg('SHOPKEEPER: Ooh, you can\'t afford that, love.'); continue; }
          S.money -= price; S.bag[k] = (S.bag[k] | 0) + 1; K.sfx.tone(1600, 0.06, 'square', 0.06); K.sfx.tone(2000, 0.08, 'square', 0.06, 0.07);
          yield* msg(`Here you go: one ${ITEMS[k][0]}. ${ITEMS[k][2]}`);
        }
        save();
        yield* msg('SHOPKEEPER: Ta-ra!');
      }
      function* pcScript() {
        yield* msg('JACK switched on the PC. It\'s connected to PROF BRAMBLE\'s PC!');
        for (;;) {
          const i = yield menu(['TAKE OUT', 'PUT IN', 'SWITCH OFF'], { x: 0, y: 0 });
          if (i === 0) {
            if (!S.box.length) { yield* msg('There are no critters stored in the PC.'); continue; }
            if (S.party.length >= 6) { yield* msg('Your party is full!'); continue; }
            const j = yield menu(S.box.map(c => `${nameOf(c)} L${c.lv}`), { x: 0, y: 0, w: 120, rows: 7 });
            if (j >= 0) { const c = S.box.splice(j, 1)[0]; c.hp = maxhp(c); S.party.push(c); yield* msg(`${nameOf(c)} joined your party.`); }
          } else if (i === 1) {
            if (S.party.length <= 1) { yield* msg('You can\'t put your last critter away!'); continue; }
            const j = yield* partyScreen('pick');
            if (j >= 0) { const c = S.party.splice(j, 1)[0]; S.box.push(c); yield* msg(`${nameOf(c)} went into the PC.`); }
          } else break;
        }
        save();
      }
      function* blackout() {
        yield* msg('JACK has no critters left that can battle!');
        yield* msg('JACK ran all the way home to MOM...');
        yield fade(true);
        S.money = Math.floor(S.money / 2); healAll();
        loadMap('house', 4, 4, 'up');
        save();
        yield fade(false);
        yield* msg('MOM: Oh, JACK! You poor thing. Come here. There. Your critters are all better now.');
      }
      function* wild(reeds) {
        const tbl = (reeds ? map.reeds : map.grass) || map.grass;
        let r = rand() * tbl.reduce((n, e) => n + e[3], 0), e = tbl[0]; for (const x of tbl) { r -= x[3]; if (r <= 0) { e = x; break; } }
        const foe = mon(VV.swap[e[0]] != null ? VV.swap[e[0]] : e[0], ri(e[1], e[2]));
        K.music(SONGS.battle);
        const res = yield* battle([foe], null);
        if (res === 'lose') yield* blackout();
        playSong();
      }

      // ============================================================ battles
      let B = null, showSp = 0;
      const stage = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
      function damage(a, d, mv, as, ds) {
        const M = MOVES[mv], mine = c => S.party.includes(c); // (your own critters are a bit better trained: x1.15)
        const A = stat(a, 1) * stage(as.atk) * (mine(a) ? 1.15 : 1), D = stat(d, 2) * stage(ds.def) * (mine(d) ? 1.15 : 1);
        let n = Math.floor(((2 * a.lv / 5 + 2) * M[1] * A / D) / 50) + 2;
        if (M[0] === SP[a.s].t) n *= 1.5;
        const e = eff(M[0], SP[d.s].t); n *= e;
        const crit = rand() < 1 / 16; if (crit) n *= 1.5;
        n *= 0.85 + rand() * 0.15;
        return { n: Math.max(1, Math.floor(n)), e, crit };
      }
      const anim = (frames, f) => { let t = 0; return fn(() => { f(t / frames); if (++t > frames) return NOTHING; }); };
      function* bmsg(t) { yield say(t); }
      function* hpTo(side, to) { // the HP bar slides
        const k = side === 'foe' ? 'foeHp' : 'meHp';
        yield fn(() => { const d = to - B[k]; if (Math.abs(d) <= 0.5) { B[k] = to; return NOTHING; } B[k] += Math.sign(d) * Math.max(0.5, Math.abs(d) / 10); });
      }
      function* battle(foes, tr) {
        const prevMode = mode; mode = 'battle';
        const first = S.party.findIndex(c => c.hp > 0);
        B = { foes, fi: 0, foe: foes[0], mi: first, foeVis: false, meVis: false, foeHp: foes[0].hp, meHp: 0, foeX: -80, meX: 120, foeBlink: 0, meBlink: 0, foeDx: 0, meDx: 0, cube: null, sf: { atk: 0, def: 0 }, sm: { atk: 0, def: 0 }, tr, seenIn: new Set([first]), evolve: [] };
        S.seen[B.foe.s] = 1;
        B.foeVis = true;
        yield anim(40, t => { B.foeX = -80 + t * 80; B.meX = 120 - t * 120; });
        if (tr) { yield* bmsg(`${tr.name} wants to battle!`); yield* bmsg(`${tr.name} sent out ${nameOf(B.foe)}!`); }
        else yield* bmsg(`A wild ${nameOf(B.foe)} appeared!`);
        B.meVis = true; B.meHp = me().hp; B.meX = 0;
        K.sfx.tone(500, 0.1, 'square', 0.06, 0, 900);
        yield* bmsg(`Go! ${nameOf(me())}!`);
        let result = null;
        while (!result) {
          const act = yield* chooseAction();
          result = yield* turn(act);
        }
        // tidy up: evolutions happen after the battle
        mode = prevMode === 'battle' ? 'world' : prevMode;
        const evo = B.evolve.slice(); B = null;
        for (const c of evo) yield* evolve(c);
        if (result !== 'lose') save();
        return result;
      }
      const team = () => (B && B.link ? B.link.team : S.party);
      const me = () => team()[B.mi];
      function* chooseAction() {
        for (;;) {
          held = wrap(`What will ${nameOf(me())} do?`, 13);
          const i = yield menu(['FIGHT', 'BAG', 'CRIT', 'RUN'], { x: 80, y: 96, w: 80, rows: 2, cols: true, colW: 38, cancel: false, under: () => { box(0, 96, 160, 48); held.forEach((l, j) => F.draw(g, l, 9, 106 + j * 14, P[3])); } });
          held = null;
          if (i === 0) {
            const mv = me().moves;
            const j = yield menu(mv.map(mvN), { x: 0, y: 96, w: 104, rows: 4, lh: 9, after: k => { box(100, 96, 60, 48); const M = MOVES[mv[k]]; F.draw(g, 'TYPE/', 106, 103, P[3]); F.draw(g, M[0], 106, 114, P[3]); F.draw(g, M[1] ? 'POW ' + M[1] : 'EFFECT', 106, 127, P[3]); } });
            if (j >= 0) return { k: 'move', m: mv[j] };
          } else if (i === 1) {
            const it = yield* bagScreen(true);
            if (it) return it;
          } else if (i === 2) {
            const j = yield* partyScreen('battle');
            if (j >= 0) {
              if (j === B.mi) { yield* bmsg(`${nameOf(me())} is already out!`); continue; }
              if (S.party[j].hp <= 0) { yield* bmsg('That one has fainted!'); continue; }
              return { k: 'switch', i: j };
            }
          } else if (i === 3) return { k: 'run' };
        }
      }
      function* useMove(atkSide, mv) {
        const a = atkSide === 'me' ? me() : B.foe, d = atkSide === 'me' ? B.foe : me();
        const as = atkSide === 'me' ? B.sm : B.sf, ds = atkSide === 'me' ? B.sf : B.sm, M = MOVES[mv];
        yield* bmsg(`${atkSide === 'foe' ? (B.tr ? 'Foe ' : 'Wild ') : ''}${nameOf(a)} used ${mvN(mv)}!`);
        // lunge
        yield anim(10, t => { const v = Math.sin(t * Math.PI) * 8; if (atkSide === 'me') B.meDx = v; else B.foeDx = -v; });
        if (rand() * 100 >= M[2]) { yield* bmsg('But it missed!'); return; }
        const fx = M[3];
        if (!M[1]) {
          K.sfx.tone(700, 0.15, 'square', 0.07, 0, fx && fx.endsWith('+') ? 1200 : 300);
          if (fx === 'heal') { const amt = Math.ceil(maxhp(a) / 2); if (a.hp >= maxhp(a)) return yield* bmsg('But its HP is already full!'); a.hp = Math.min(maxhp(a), a.hp + amt); yield* hpTo(atkSide, a.hp); return yield* bmsg(`${nameOf(a)} had a little nap and feels better!`); }
          const self = fx.endsWith('+'), st = self ? as : ds, key = fx.startsWith('atk') ? 'atk' : 'def', dir = self ? 1 : -1;
          if ((dir > 0 && st[key] >= 6) || (dir < 0 && st[key] <= -6)) return yield* bmsg('Nothing happened!');
          st[key] += dir;
          return yield* bmsg(`${self ? nameOf(a) : nameOf(d)}'s ${key === 'atk' ? 'ATTACK' : 'DEFENCE'} ${dir > 0 ? 'went up!' : 'fell!'}`);
        }
        const r = damage(a, d, mv, as, ds);
        K.sfx.noise(0.12, 0.2, r.e > 1 ? 3000 : 1500);
        yield anim(24, t => { const b = (t * 6 | 0) % 2; if (atkSide === 'me') B.foeBlink = b; else B.meBlink = b; B.hitFx = { on: atkSide === 'me' ? 'foe' : 'me', ty: M[0], t }; }); B.hitFx = null;
        B.foeBlink = B.meBlink = 0;
        d.hp = Math.max(0, d.hp - r.n);
        yield* hpTo(atkSide === 'me' ? 'foe' : 'me', d.hp);
        if (r.crit) yield* bmsg('A critical hit!');
        if (r.e > 1) yield* bmsg('It\'s super effective!'); else if (r.e < 1) yield* bmsg('It\'s not very effective...');
      }
      function* turn(act) {
        const foeMv = (() => { const mv = B.foe.moves; const dmgMoves = mv.filter(m => MOVES[m][1] > 0); if (dmgMoves.length && rand() < 0.75) { const best = dmgMoves.sort((x, y) => eff(MOVES[y][0], SP[me().s].t) * MOVES[y][1] - eff(MOVES[x][0], SP[me().s].t) * MOVES[x][1]); return rand() < 0.6 ? best[0] : best[ri(0, best.length - 1)]; } return mv[ri(0, mv.length - 1)]; })();
        if (act.k === 'run') {
          if (B.tr) { yield* bmsg('No running away from a trainer battle!'); return null; }
          if (stat(me(), 3) >= stat(B.foe, 3) || rand() < 0.5) { K.sfx.tone(600, 0.15, 'square', 0.06, 0, 200); yield* bmsg('Got away safely!'); return 'run'; }
          yield* bmsg('Couldn\'t get away!');
        } else if (act.k === 'switch') {
          yield* bmsg(`Come back, ${nameOf(me())}!`); B.meVis = false; B.sm = { atk: 0, def: 0 };
          B.mi = act.i; B.seenIn.add(act.i); B.meHp = me().hp; B.meVis = true; yield* bmsg(`Go! ${nameOf(me())}!`);
        } else if (act.k === 'item') {
          const r = yield* useItemBattle(act);
          if (r) return r;
        } else if (act.k === 'move') {
          const meFirst = MOVES[act.m][3] === 'first' || (MOVES[foeMv][3] !== 'first' && stat(me(), 3) * stage(0) >= stat(B.foe, 3));
          const order = meFirst ? [['me', act.m], ['foe', foeMv]] : [['foe', foeMv], ['me', act.m]];
          for (const [side, mv] of order) {
            if ((side === 'me' ? me() : B.foe).hp <= 0) continue;
            yield* useMove(side, mv);
            const r = yield* faints(); if (r) return r;
          }
          return null;
        }
        // the foe's go (after switching, items, failing to run)
        yield* useMove('foe', foeMv);
        return yield* faints();
      }
      function* faints() {
        if (B.foe.hp <= 0) {
          K.sfx.tone(300, 0.4, 'square', 0.08, 0, 60);
          yield anim(16, t => { B.foeDy = t * 40; }); B.foeVis = false; B.foeDy = 0;
          yield* bmsg(`${B.tr ? 'Foe ' : 'Wild '}${nameOf(B.foe)} fainted!`);
          yield* gainExp(B.foe);
          if (B.tr && B.fi < B.foes.length - 1) {
            B.fi++; B.foe = B.foes[B.fi]; B.foeHp = B.foe.hp; B.sf = { atk: 0, def: 0 }; S.seen[B.foe.s] = 1; B.foeVis = true;
            yield* bmsg(`${B.tr.name} sent out ${nameOf(B.foe)}!`);
            return null;
          }
          if (B.tr) K.music(null);
          K.sfx.seq([[67, 0.5], [72, 0.5], [76, 0.5], [79, 1], [76, 0.5], [79, 2]], { bpm: 200, vol: 0.09 });
          if (B.tr) yield* bmsg(`JACK beat ${B.tr.name}!`);
          return 'win';
        }
        if (me().hp <= 0) {
          K.sfx.tone(200, 0.4, 'square', 0.08, 0, 50);
          yield anim(16, t => { B.meDy = t * 40; }); B.meVis = false; B.meDy = 0;
          yield* bmsg(`${nameOf(me())} fainted!`);
          if (!alive().length) return 'lose';
          for (;;) {
            yield* bmsg('Which critter will you send out?');
            const j = yield* partyScreen('forced');
            if (j >= 0 && S.party[j].hp > 0) { B.mi = j; B.seenIn.add(j); B.sm = { atk: 0, def: 0 }; B.meHp = me().hp; B.meVis = true; yield* bmsg(`Go! ${nameOf(me())}!`); break; }
          }
        }
        return null;
      }
      function* gainExp(foe) {
        const who = [...B.seenIn].filter(i => S.party[i] && S.party[i].hp > 0);
        if (!who.length) return;
        const total = Math.floor(SP[foe.s].exp * foe.lv / 5 * (B.tr ? 1.5 : 1)), each = Math.max(1, Math.floor(total / who.length));
        for (const i of who) {
          const c = S.party[i];
          if (c.lv >= 50) continue;
          const got = c.ot ? Math.floor(each * 1.5) : each;
          c.exp += got;
          yield* bmsg(`${nameOf(c)} gained ${c.ot ? 'a boosted ' : ''}${got} EXP. points!`);
          while (c.lv < 50 && c.exp >= expAt(c.lv + 1)) {
            const oldMax = maxhp(c); c.lv++; c.hp += maxhp(c) - oldMax;
            if (i === B.mi) B.meHp = c.hp;
            K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.75]], { bpm: 300, vol: 0.09 });
            yield* bmsg(`${nameOf(c)} grew to level ${c.lv}!`);
            for (const [l, mv] of SP[c.s].learn) if (l === c.lv && !c.moves.includes(mv)) yield* learn(c, mv);
            const ev = SP[c.s].evo; if (ev && c.lv >= ev[0] && !B.evolve.includes(c)) B.evolve.push(c);
          }
        }
      }
      function* learn(c, mv) {
        const mn = mvN(mv);
        if (c.moves.length < 4) { c.moves.push(mv); return yield* bmsg(`${nameOf(c)} learned ${mn}!`); }
        const r = yield* ask(`${nameOf(c)} wants to learn ${mn}, but it already knows four moves. Forget one?`);
        if (r !== 0) return yield* bmsg(`${nameOf(c)} did not learn ${mn}.`);
        held = null;
        const j = yield menu(c.moves.map(mvN), { x: 0, y: 40, w: 100 });
        if (j < 0) return yield* bmsg(`${nameOf(c)} did not learn ${mn}.`);
        const old = c.moves[j]; c.moves[j] = mv;
        yield* bmsg(`1, 2 and... POOF! ${nameOf(c)} forgot ${mvN(old)} and learned ${mn}!`);
      }
      let evoShow = null;
      function* evolve(c, into0) {
        const into = into0 != null ? into0 : SP[c.s].evo[1], from = c.s;
        const pm = mode; mode = 'evo'; evoShow = { a: from, b: into, t: 0 };
        yield* msg(`What? ${SP[from].n} is evolving!`);
        K.music(null);
        yield anim(150, t => { evoShow.t = t; if ((t * 150 | 0) % 12 === 0) K.sfx.tone(400 + t * 800, 0.08, 'square', 0.05); });
        const oldMax = maxhp(c); c.s = into; c.hp += maxhp(c) - oldMax; S.seen[into] = 1;
        const newCatch = !S.caught[into]; S.caught[into] = 1;
        evoShow.t = 2;
        K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 2]], { bpm: 200, vol: 0.09 });
        yield* msg(`Congratulations! Your ${SP[from].n} evolved into ${SP[into].n}!`);
        mode = pm === 'evo' ? 'world' : pm; evoShow = null; playSong();
        if (newCatch) { report(); checkDex(); }
      }
      function* useItemBattle(act) {
        const k = act.item;
        if (k === 'CUBE') {
          if (B.tr) { yield* bmsg('You can\'t catch somebody else\'s critter! That\'s stealing!'); return null; }
          S.bag.CUBE--;
          yield* bmsg('JACK threw a CRITTER CUBE!');
          B.cube = { x: 30, y: 70, t: 0, shake: 0 };
          K.sfx.tone(800, 0.3, 'square', 0.06, 0, 200);
          yield anim(24, t => { B.cube.x = 30 + t * 92; B.cube.y = 70 - Math.sin(t * Math.PI) * 50 - t * 40; });
          B.foeVis = false; K.sfx.tone(1200, 0.1, 'square', 0.07);
          const f = B.foe, chance = Math.min(0.97, SP[f.s].rate * (1 - 0.7 * f.hp / maxhp(f)) + 0.06);
          const ok = rand() < chance, shakes = ok ? 3 : ri(0, 2);
          for (let s = 0; s < shakes; s++) { yield wait(18); yield anim(16, t => { B.cube.shake = Math.sin(t * Math.PI * 2) * 3; }); K.sfx.tone(300, 0.06, 'square', 0.07); }
          yield wait(20);
          if (!ok) { B.cube = null; B.foeVis = true; K.sfx.noise(0.2, 0.15, 2000); yield* bmsg(['Oh no! It broke free!', 'Argh! So close!', 'It wriggled out!'][ri(0, 2)]); return null; }
          K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1], [79, 0.5], [84, 2]], { bpm: 240, vol: 0.09 });
          yield* bmsg(`Gotcha! ${nameOf(f)} was caught!`);
          const isNew = !S.caught[f.s]; S.caught[f.s] = 1; S.seen[f.s] = 1;
          if (isNew) yield* bmsg(`${nameOf(f)}'s data was added to the CRITTERDEX.`);
          const c = { s: f.s, lv: f.lv, exp: expAt(f.lv), moves: f.moves.slice(), hp: f.hp };
          if (S.party.length < 6) S.party.push(c); else { S.box.push(c); yield* bmsg(`Your party is full, so ${nameOf(c)} was sent to PROF BRAMBLE's PC.`); }
          B.cube = null;
          if (isNew) { report(); checkDex(); }
          return 'caught';
        }
        // cakes and buns
        const c = S.party[act.on];
        if (k === 'PEP') { c.hp = Math.floor(maxhp(c) / 2); S.bag.PEP--; yield* bmsg(`${nameOf(c)} perked right up!`); }
        else { const amt = k === 'BIG' ? 60 : 20, was = c.hp; c.hp = Math.min(maxhp(c), c.hp + amt); S.bag[k]--; if (act.on === B.mi) yield* hpTo('me', c.hp); yield* bmsg(`${nameOf(c)} got ${c.hp - was} HP back!`); }
        K.sfx.seq([[79, 0.25], [84, 0.5]], { bpm: 300, vol: 0.08 });
        return null;
      }

      // ============================================================ THE CABLE CLUB (link up over JackNet: mods/lk.js referees)
      // a task that waits for a message from the Cable Club (B gives up waiting when cancel is on)
      function netWait(types, o) {
        o = o || {}; const t0 = K.t;
        return {
          update() {
            const i = LINK.q.findIndex(m => types.includes(m.t) && (!o.sid || !m.sid || m.sid === o.sid));
            if (i >= 0) return LINK.q.splice(i, 1)[0];
            if (o.cancel && K.pressed('b')) return { t: 'cancel' };
            if (o.ms && (K.t - t0) * 1000 > o.ms) return { t: 'timeout' };
          },
          draw() { if (o.text) { box(0, 96, 160, 48); const d = '.'.repeat((K.frame >> 4) % 4); wrap(o.text + d, 23).forEach((l, n) => F.draw(g, l, 9, 106 + n * 14, P[3])); if (o.cancel) F.draw(g, 'B:STOP', 118, 132, P[2]); } },
        };
      }
      const takeLast = (t, sid) => { let m = null; for (let i = LINK.q.length - 1; i >= 0; i--) if (LINK.q[i].t === t && (!sid || LINK.q[i].sid === sid)) { if (!m) m = LINK.q[i]; LINK.q.splice(i, 1); } return m; };
      const wire = c => ({ s: c.s, lv: c.lv, exp: c.exp, moves: c.moves.slice(), id: c.id, ot: c.ot });
      const shortN = n => String(n || 'SOMEBODY').toUpperCase().slice(0, 12);
      const myNick = () => (window.Net && Net.me && Net.me.nick) || '';
      const checkDex = () => { if (Object.keys(S.caught).length >= NSP) K.secret('lk.dex'); };
      // a critter that came down the cable goes where the one you sent was (or the PC when the party is full)
      function applyGot(it) {
        let slot = null;
        for (const arr of [S.party, S.box]) { const k = arr.findIndex(c => c.id === it.give); if (k >= 0) slot = [arr, k]; }
        if (S.party.concat(S.box).some(c => c.id === it.mon.id)) { if (slot && slot[0][slot[1]].id !== it.mon.id) slot[0].splice(slot[1], 1); return null; } // (already here)
        const m = it.mon, c = { s: m.s, lv: m.lv, exp: m.exp, moves: m.moves.slice(), id: m.id };
        const ot = m.ot || it.from; if (ot && ot !== myNick()) c.ot = String(ot).slice(0, 16);
        c.hp = maxhp(c);
        if (slot) slot[0].splice(slot[1], 1, c); else if (S.party.length < 6) S.party.push(c); else S.box.push(c);
        S.seen[c.s] = 1; S.caught[c.s] = 1; S.f.traded = (S.f.traded | 0) + 1;
        return c;
      }
      // deliveries that were sent while this Game Boy was off (a dropped line in the middle of a trade): they land now
      function* deliver(list) {
        for (const it of (list || []).filter(x => !x.ver || x.ver === VER)) {
          const c = applyGot(it);
          if (c) {
            K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]], { bpm: 220, vol: 0.09 });
            yield* msg(`A critter came down the link cable! ${shortN(it.from)}'s ${nameOf(c)} is here${S.party.includes(c) ? '' : ' (in the PC)'}.`);
            if (it.mon.evo != null) { yield* evolve(c, it.mon.evo); K.secret('lk.tradeevo'); }
            K.secret('lk.trade');
          }
          lsend({ t: 'lkAck', tid: it.tid });
          save(); checkDex(); report();
        }
      }
      function* cableClub() {
        yield* msg('LINK LASS: Welcome to the CABLE CLUB! Trade and battle with trainers all over JackNet!');
        if (!window.Net || !member()) return yield* msg('LINK LASS: You have to be logged on to JackNet to link up. (On the PC: Start > Log Off, then pick a name and a password. It\'s free!)');
        LINK.q = LINK.q.filter(m => m.t !== 'lkHello'); lsend({ t: 'lkHello' });
        let h = yield netWait(['lkHello'], { text: 'CHECKING YOUR CABLE', ms: 9000 });
        if (h.t !== 'lkHello') return yield* msg('LINK LASS: Hmm. JackNet isn\'t answering. Try again in a minute!');
        yield* deliver(h.inbox);
        if (!h.cable) {
          yield* msg('LINK LASS: Oh! There\'s no LINK CABLE in your GAME LAD. Have a good look round your room. Behind the telly, with all the other leads?');
          const r = yield* ask(`LINK LASS: Or your mate DAVE will sell you his spare for ${h.price || 40} RUPEES (JackNet money). Buy it?`);
          if (r !== 0) return yield* msg('LINK LASS: Come back when you\'ve got one!');
          lsend({ t: 'lkBuy' });
          h = yield netWait(['lkHello', 'lkErr'], { text: 'PAYING DAVE', ms: 9000 });
          if (h.t !== 'lkHello' || !h.cable) return yield* msg(h.t === 'lkErr' ? `DAVE: ${h.msg} No Rupees, no cable, mate.` : 'DAVE is not answering his phone.');
          K.sfx.seq([[79, 0.25], [83, 0.25], [86, 0.5]], { bpm: 260, vol: 0.08 });
          yield* msg('JACK bought DAVE\'s spare LINK CABLE! (He says it only crackles a bit.)');
        }
        K.secret('lk.cable');
        if ((yield* ask('LINK LASS: Before you link up, I have to SAVE your game. Is that all right?')) !== 0) return yield* msg('LINK LASS: Come back any time!');
        save(); K.sfx.seq([[76, 0.5], [79, 0.5], [84, 1]], { bpm: 260, vol: 0.08 });
        yield* lobby();
      }
      // the club room: who else is plugged in. Pick somebody to TRADE or BATTLE, or wait to be asked.
      function* lobby() {
        LINK.up = true; LINK.q.length = 0; LINK.list = [];
        lsend({ t: 'lkClub', on: 1, ver: VER });
        let i = 0, note = '', blink = 0;
        const pm = scr, pmode = mode; mode = 'club';
        K.music(SONGS.club);
        const lobbyScr = { draw() {
          g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
          g.fillStyle = P[3]; g.fillRect(0, 0, W, 17); F.draw(g, 'CABLE CLUB', 6, 5, P[0]);
          // the cable: two Game Lads joined by a wiggly lead
          const t = K.frame / 20; g.fillStyle = P[1]; for (let x = 88; x < 150; x++) g.fillRect(x, 8 + Math.round(Math.sin(x / 5 + t) * 2), 1, 1);
          g.fillStyle = P[0]; g.fillRect(82, 3, 6, 10); g.fillRect(150, 3, 6, 10); g.fillStyle = P[2]; g.fillRect(83, 4, 4, 4); g.fillRect(151, 4, 4, 4);
          const rec = LINK.hello && LINK.hello.rec;
          F.draw(g, `${VV.name}`, 4, 21, P[2]); if (rec) F.draw(g, `W${rec.w} L${rec.l} T${rec.tr}`, 160 - F.width(`W${rec.w} L${rec.l} T${rec.tr}`) - 4, 21, P[2]);
          g.fillStyle = P[1]; g.fillRect(0, 31, W, 1);
          const L = LINK.list, n = L.length + 1;
          if (!L.length) {
            F.center(g, 'NOBODY ELSE IS LINKED UP', W / 2, 36, P[3]); F.center(g, 'RIGHT NOW. WAIT HERE, OR', W / 2, 46, P[2]); F.center(g, 'GET A MATE ON JACKNET!', W / 2, 56, P[2]);
            const tp = (LINK.hello && LINK.hello.top) || [];
            if (tp.length) { g.fillStyle = P[1]; g.fillRect(20, 66, 120, 1); F.center(g, 'CLUB CHAMPS', W / 2, 69, P[3]); tp.slice(0, 2).forEach((x, k) => { F.draw(g, shortN(x[0]).slice(0, 11), 24, 79 + k * 9, P[2]); F.draw(g, 'W' + x[1], 112, 79 + k * 9, P[2]); }); }
          }
          const top = Math.max(0, Math.min(i - 4, n - 6));
          for (let r = 0; r < Math.min(L.length, 5); r++) {
            const k = top + r; if (k >= L.length) break; const x = L[k], y = 36 + r * 11;
            if (k === i) { g.fillStyle = P[1]; g.fillRect(2, y - 2, W - 4, 11); }
            F.draw(g, (k === i ? '>' : ' ') + shortN(x.n), 4, y, P[3]);
            F.draw(g, x.busy ? 'BUSY' : x.ver === 'puddle' ? 'PUDDLE' : 'MOSS', 120, y, x.busy ? P[2] : P[3]);
          }
          const ly = 36 + Math.min(L.length, 5) * 11 + (L.length ? 3 : 64);
          if (i === n - 1) { g.fillStyle = P[1]; g.fillRect(2, ly - 2, W - 4, 11); }
          F.draw(g, (i === n - 1 ? '>' : ' ') + 'LEAVE THE CLUB', 4, ly, P[3]);
          box(0, 112, 160, 32);
          F.draw(g, note || (L.length ? 'A: CHOOSE  B: LEAVE' : 'WAITING FOR TRAINERS' + '.'.repeat((K.frame >> 4) % 4)), 8, 124, P[3]);
        } };
        for (;;) {
          scr = lobbyScr;
          LINK.q = LINK.q.filter(m => ['lkAsk', 'lkStart', 'lkErr', 'lkHello', 'lkGot'].includes(m.t)); // (leftovers from the last session)
          const r = yield fn(() => {
            const ai = LINK.q.findIndex(m => m.t === 'lkAsk' || m.t === 'lkStart' || m.t === 'lkErr'); if (ai >= 0) return LINK.q.splice(ai, 1)[0];
            const n = LINK.list.length + 1; if (i > n - 1) i = n - 1;
            if (K.pressed('up')) { i = (i + n - 1) % n; K.sfx.tone(900, 0.02, 'square', 0.04); }
            if (K.pressed('down')) { i = (i + 1) % n; K.sfx.tone(900, 0.02, 'square', 0.04); }
            if (K.pressed('a')) return { t: 'pick', i };
            if (K.pressed('b')) return { t: 'pick', i: n - 1 };
          });
          note = '';
          if (r.t === 'lkErr') { yield* msg('LINK LASS: ' + r.msg); break; }
          if (r.t === 'lkAsk') {
            K.sfx.seq([[84, 0.25], [88, 0.25], [84, 0.25], [88, 0.5]], { bpm: 300, vol: 0.08 });
            const k = yield* ask(`${shortN(r.n)} (${r.ver === 'puddle' ? 'PUDDLE' : 'MOSS'}) wants to ${r.k === 'trade' ? 'TRADE critters' : 'have a BATTLE'}! OK?`);
            lsend({ t: 'lkAns', from: r.from, yes: k === 0 });
            if (k === 0) { const st = yield netWait(['lkStart'], { text: 'LINKING UP', ms: 9000 }); if (st.t === 'lkStart') yield* session(st); else note = 'THE LINK DROPPED.'; }
            continue;
          }
          if (r.t === 'lkStart') { yield* session(r); continue; }
          if (r.i >= LINK.list.length) break;
          const who = LINK.list[r.i]; if (!who) continue;
          if (who.busy) { note = `${shortN(who.n)} IS BUSY.`; continue; }
          const k = yield menu(['TRADE', 'BATTLE', 'BACK'], { x: 88, y: 50, w: 72 });
          if (k < 0 || k === 2) continue;
          lsend({ t: 'lkAsk', to: who.id, k: k === 1 ? 'battle' : 'trade' });
          const st = yield netWait(['lkStart', 'lkNo', 'lkErr'], { text: `ASKING ${shortN(who.n)}`, cancel: true, ms: 32000 });
          if (st.t === 'lkStart') yield* session(st);
          else note = st.t === 'lkNo' ? `${shortN(st.n || who.n)} SAID NO.` : st.t === 'timeout' ? 'NO ANSWER.' : st.t === 'lkErr' ? 'THE CABLE CRACKLED.' : '';
        }
        lsend({ t: 'lkClub', on: 0 }); LINK.up = false; LINK.q.length = 0;
        scr = pm; mode = pmode === 'club' ? 'world' : pmode; playSong();
        yield* msg('LINK LASS: Thanks for coming! Come back any time!');
      }
      function* session(st) {
        LINK.sid = st.sid;
        K.sfx.seq([[72, 0.25], [79, 0.25], [84, 0.5]], { bpm: 280, vol: 0.08 });
        try { if (st.k === 'trade') yield* tradeRoom(st); else yield* linkBattle(st); }
        finally { LINK.sid = null; }
        save();
      }
      // ---- trading
      function drawTradeCard(c, x, title, ot) {
        box(x, 16, 78, 80); F.draw(g, title, x + 6, 22, P[2]);
        if (!c) { F.center(g, 'PICKING' + '.'.repeat((K.frame >> 4) % 4), x + 39, 52, P[3]); return; }
        g.fillStyle = P[1]; g.beginPath(); g.ellipse(x + 39, 61, 16, 3, 0, 0, 7); g.fill();
        g.drawImage(sprite(c.s), 0, 0, 32, 32, x + 23, 30 + Math.round(Math.sin(K.frame / 12 + x) * 1), 32, 32);
        F.center(g, nameOf(c), x + 39, 66, P[3]); F.center(g, `L${c.lv} ${SP[c.s].t}`, x + 39, 76, P[2]);
        F.center(g, 'OT ' + shortN(ot || 'JACK').slice(0, 9), x + 39, 86, P[2]);
      }
      function* tradeRoom(st) {
        const foe = shortN(st.foe.n), sid = st.sid;
        let theirs = null, mine = null;
        const pm = scr;
        const tradeScr = { draw() { g.fillStyle = P[0]; g.fillRect(0, 0, W, H); g.fillStyle = P[3]; g.fillRect(0, 0, W, 14); F.draw(g, 'TRADE CENTRE', 4, 4, P[0]); F.draw(g, foe.slice(0, 9), 156 - F.width(foe.slice(0, 9)), 4, P[1]); drawTradeCard(mine, 1, 'YOU', mine && mine.ot); drawTradeCard(theirs, 81, foe.slice(0, 11), theirs && theirs.ot); } };
        yield* msg(`Linked up with ${foe}! Pick a critter to offer.`);
        for (;;) {
          const o = takeLast('lkOffer', sid); if (o) theirs = o.mon;
          if (takeLast('lkEnd', sid)) { scr = pm; return yield* msg(`${foe} unplugged the link cable.`); }
          scr = tradeScr; mine = null;
          const j = yield* partyScreen('trade');
          if (j < 0) { if ((yield* ask('Stop trading and go back to the club?')) === 0) { lsend({ t: 'lkQuit', sid }); scr = pm; return; } continue; }
          mine = S.party[j];
          lsend({ t: 'lkOffer', sid, mon: wire(mine) });
          scr = tradeScr;
          // wait for theirs (or a change of mind), then both say yes
          for (;;) {
            const o2 = takeLast('lkOffer', sid); if (o2) theirs = o2.mon;
            const er = takeLast('lkErr'); if (er) { yield* msg(er.msg); break; }
            if (!theirs) {
              const r = yield netWait(['lkOffer', 'lkEnd', 'lkErr'], { sid, text: `WAITING FOR ${foe} TO PICK`, cancel: true });
              if (r.t === 'lkEnd') { scr = pm; return yield* msg(`${foe} unplugged the link cable.`); }
              if (r.t === 'lkErr') { yield* msg(r.msg); break; }
              if (r.t === 'cancel') break;
              theirs = r.mon; continue;
            }
            const yes = yield* ask(`Trade your ${nameOf(mine)} for ${foe}'s ${SP[theirs.s].n}?`);
            if (yes !== 0) break;
            lsend({ t: 'lkOk', sid });
            const r = yield netWait(['lkGot', 'lkOffer', 'lkEnd', 'lkErr'], { sid, text: `WAITING FOR ${foe} TO SAY YES`, cancel: false });
            if (r.t === 'lkEnd') { scr = pm; return yield* msg(`${foe} unplugged the link cable.`); }
            if (r.t === 'lkErr') { yield* msg(r.msg); break; }
            if (r.t === 'lkOffer') { theirs = r.mon; yield* msg(`${foe} changed their mind and offered ${SP[theirs.s].n} instead!`); continue; }
            // it's done: the trade animation, then the new critter
            yield* tradeAnim(mine, r.mon);
            const c = applyGot(r);
            lsend({ t: 'lkAck', tid: r.tid });
            if (c) {
              yield* msg(`${foe} sent over ${nameOf(c)}! Take good care of it!`);
              if (r.mon.evo != null) { scr = null; yield* evolve(c, r.mon.evo); K.secret('lk.tradeevo'); }
              if (r.amt > 0) yield* msg(`JackNet paid you ${r.amt} RUPEES for your first trades today!`);
              K.secret('lk.trade');
            }
            save(); checkDex(); report();
            theirs = null; mine = null;
            break;
          }
          scr = pm;
          if ((yield* ask(`Trade something else with ${foe}?`)) !== 0) { lsend({ t: 'lkQuit', sid }); return; }
        }
      }
      function* tradeAnim(a, b) {
        const pm = scr; let t = 0;
        K.music(null); K.sfx.tone(300, 1.2, 'square', 0.04, 0, 1200);
        scr = { draw() {
          g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
          const k = Math.min(1, t / 70), k2 = Math.max(0, Math.min(1, (t - 40) / 70));
          // the cable across the screen, buzzing
          g.fillStyle = P[2]; for (let x = 0; x < W; x++) { g.fillRect(x, 60 + Math.round(Math.sin(x / 6 + t / 3) * 2), 1, 2); g.fillRect(x, 84 + Math.round(Math.sin(x / 6 - t / 3) * 2), 1, 2); }
          if (t < 70) { g.drawImage(objArt('cube'), -8 + k * (W + 8), 52); }
          if (t >= 40 && t < 110) { g.drawImage(objArt('cube'), W - k2 * (W + 8), 76); }
          if (t < 20) g.drawImage(sprite(a.s), 0, 0, 32, 32, 8, 16 - t, 32, 32);
          if (t >= 110) { const e = Math.min(1, (t - 110) / 20); g.drawImage(sprite(b.s), 0, 0, 32, 32, W / 2 - 32 * e, 72 - 32 * e - 30 * e, 64 * e, 64 * e); }
          F.center(g, t < 110 ? 'TRADING...' : 'IT ARRIVED!', W / 2, 128, P[3]);
        } };
        yield fn(() => { t++; if (t % 12 === 0 && t < 110) K.sfx.tone(600 + (t % 24) * 20, 0.05, 'square', 0.04); if (t === 110) K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]], { bpm: 220, vol: 0.09 }); if (t > 150) return NOTHING; });
        scr = pm; playSong();
      }
      // ---- battling (the server rolls the dice; both Game Boys play back what happened)
      function* linkAction() {
        for (;;) {
          held = wrap(`What will ${nameOf(me())} do?`, 13);
          const i = yield menu(['FIGHT', 'BAG', 'CRIT', 'QUIT'], { x: 80, y: 96, w: 80, rows: 2, cols: true, colW: 38, cancel: false, under: () => { box(0, 96, 160, 48); held.forEach((l, j) => F.draw(g, l, 9, 106 + j * 14, P[3])); } });
          held = null;
          if (i === 0) {
            const mv = me().moves;
            const j = yield menu(mv.map(mvN), { x: 0, y: 96, w: 104, rows: 4, lh: 9, after: k => { box(100, 96, 60, 48); const M = MOVES[mv[k]]; F.draw(g, 'TYPE/', 106, 103, P[3]); F.draw(g, M[0], 106, 114, P[3]); F.draw(g, M[1] ? 'POW ' + M[1] : 'EFFECT', 106, 127, P[3]); } });
            if (j >= 0) return { k: 'move', i: j };
          } else if (i === 1) yield* bmsg('No items in the CABLE CLUB! Fair\'s fair.');
          else if (i === 2) {
            const j = yield* partyScreen('battle');
            if (j >= 0) { if (j === B.mi) { yield* bmsg(`${nameOf(me())} is already out!`); continue; } if (team()[j].hp <= 0) { yield* bmsg('That one has fainted!'); continue; } return { k: 'switch', i: j }; }
          } else if (i === 3) { if ((yield* ask('Give up the battle?')) === 0) return { k: 'quit' }; }
        }
      }
      function* playEv(ev, meI, foeN) {
        for (const e of ev) {
          const side = e.sd === meI ? 'me' : 'foe', who = side === 'me' ? me() : B.foe;
          if (e.t === 'use') { yield* bmsg(`${side === 'foe' ? 'Foe ' : ''}${nameOf(who)} used ${mvN(e.mv)}!`); yield anim(10, t => { const v = Math.sin(t * Math.PI) * 8; if (side === 'me') B.meDx = v; else B.foeDx = -v; }); }
          else if (e.t === 'miss') yield* bmsg('But it missed!');
          else if (e.t === 'dmg') {
            K.sfx.noise(0.12, 0.2, e.e > 1 ? 3000 : 1500);
            yield anim(24, t => { const b = (t * 6 | 0) % 2; if (side === 'foe') B.foeBlink = b; else B.meBlink = b; }); B.foeBlink = B.meBlink = 0;
            who.hp = e.hp; yield* hpTo(side, e.hp);
            if (e.crit) yield* bmsg('A critical hit!');
            if (e.e > 1) yield* bmsg('It\'s super effective!'); else if (e.e < 1) yield* bmsg('It\'s not very effective...');
          } else if (e.t === 'heal') { who.hp = e.hp; yield* hpTo(side, e.hp); yield* bmsg(`${nameOf(who)} had a little nap and feels better!`); }
          else if (e.t === 'full') yield* bmsg('But its HP is already full!');
          else if (e.t === 'nothing') yield* bmsg('Nothing happened!');
          else if (e.t === 'stat') { K.sfx.tone(700, 0.15, 'square', 0.07, 0, e.dir > 0 ? 1200 : 300); yield* bmsg(`${side === 'foe' ? 'Foe ' : ''}${nameOf(who)}'s ${e.key === 'atk' ? 'ATTACK' : 'DEFENCE'} ${e.dir > 0 ? 'went up!' : 'fell!'}`); }
          else if (e.t === 'faint') {
            K.sfx.tone(side === 'foe' ? 300 : 200, 0.4, 'square', 0.08, 0, 50);
            if (side === 'foe') { yield anim(16, t => { B.foeDy = t * 40; }); B.foeVis = false; B.foeDy = 0; } else { yield anim(16, t => { B.meDy = t * 40; }); B.meVis = false; B.meDy = 0; }
            yield* bmsg(`${side === 'foe' ? 'Foe ' : ''}${nameOf(who)} fainted!`);
          } else if (e.t === 'back') { if (side === 'me') { yield* bmsg(`Come back, ${nameOf(me())}!`); B.meVis = false; } else { yield* bmsg(`${foeN} called ${nameOf(B.foe)} back!`); B.foeVis = false; } }
          else if (e.t === 'send') {
            if (side === 'me') { B.mi = e.i; B.seenIn.add(e.i); B.meHp = me().hp; B.meVis = true; K.sfx.tone(500, 0.1, 'square', 0.06, 0, 900); yield* bmsg(`Go! ${nameOf(me())}!`); }
            else { B.fi = e.i; B.foe = B.foes[e.i]; B.foeHp = B.foe.hp; B.foeVis = true; S.seen[B.foe.s] = 1; yield* bmsg(`${foeN} sent out ${nameOf(B.foe)}!`); }
          } else if (e.t === 'quit') yield* bmsg(side === 'me' ? 'JACK gave up the battle!' : `${foeN} gave up the battle!`);
        }
      }
      function* linkBattle(st) {
        const foeN = shortN(st.foe.n), sid = st.sid;
        if (!S.party.length) { lsend({ t: 'lkQuit', sid }); return yield* msg('You haven\'t got any critters to battle with!'); }
        lsend({ t: 'lkTeam', sid, team: S.party.map(wire) });
        const bs = yield netWait(['lkBStart', 'lkEnd', 'lkErr'], { sid, text: `WAITING FOR ${foeN}`, ms: 60000 });
        if (bs.t !== 'lkBStart') { if (bs.t !== 'lkEnd') lsend({ t: 'lkQuit', sid }); return yield* msg(bs.t === 'lkErr' ? bs.msg : `${foeN} unplugged the link cable.`); }
        const meI = bs.me, mk = t => t.map(x => ({ s: x.s, lv: x.lv, moves: x.moves.slice(), hp: x.hp, exp: 0 }));
        const mine = mk(bs.sd[meI]), theirs = mk(bs.sd[1 - meI]);
        for (const c of theirs) S.seen[c.s] = 1;
        K.music(SONGS.leader);
        const prevMode = mode; mode = 'battle';
        const pm = scr; scr = null;
        B = { link: { team: mine }, foes: theirs, fi: 0, foe: theirs[0], mi: 0, foeVis: true, meVis: false, foeHp: theirs[0].hp, meHp: 0, foeX: -80, meX: 120, foeBlink: 0, meBlink: 0, foeDx: 0, meDx: 0, cube: null, sf: { atk: 0, def: 0 }, sm: { atk: 0, def: 0 }, tr: { name: foeN, link: 1 }, seenIn: new Set([0]), evolve: [] };
        yield anim(40, t => { B.foeX = -80 + t * 80; B.meX = 120 - t * 120; });
        yield* bmsg(`${foeN} wants to battle!`); yield* bmsg(`${foeN} sent out ${nameOf(B.foe)}!`);
        B.meVis = true; B.meHp = me().hp; B.meX = 0; K.sfx.tone(500, 0.1, 'square', 0.06, 0, 900);
        yield* bmsg(`Go! ${nameOf(me())}!`);
        let result = null, need = [false, false];
        while (!result) {
          let a = null;
          if (need[meI]) { yield* bmsg('Which critter will you send out?'); for (;;) { const j = yield* partyScreen('forced'); if (j >= 0 && mine[j].hp > 0 && j !== B.mi) { a = { k: 'switch', i: j }; break; } } }
          else if (!need[1 - meI]) a = yield* linkAction();
          if (a) lsend({ t: 'lkAct', sid, a });
          const tr = yield netWait(['lkTurn', 'lkEnd'], { sid, text: `WAITING FOR ${foeN}` });
          if (tr.t === 'lkEnd') { yield* bmsg(`${foeN} unplugged the link cable.`); result = 'gone'; break; }
          yield* playEv(tr.ev, meI, foeN);
          need = tr.need || [false, false];
          if (tr.over >= 0) result = tr.over === meI ? 'win' : 'lose';
        }
        const fin = result === 'gone' ? null : yield netWait(['lkBEnd'], { sid, ms: 5000 });
        if (result === 'win') {
          K.music(null); K.sfx.seq([[67, 0.5], [72, 0.5], [76, 0.5], [79, 1], [76, 0.5], [79, 2]], { bpm: 200, vol: 0.09 });
          yield* bmsg(`JACK beat ${foeN}!`); K.secret('lk.battle');
          if (fin && fin.amt > 0) yield* bmsg(`JackNet paid JACK ${fin.amt} RUPEES for the win!`);
        } else if (result === 'lose') yield* bmsg(`${foeN} won the battle! Never mind. Train up and try again!`);
        if (LINK.hello && LINK.hello.rec && result !== 'gone') { if (result === 'win') LINK.hello.rec.w++; else LINK.hello.rec.l++; }
        B = null; scr = pm; mode = prevMode === 'battle' ? 'club' : prevMode;
        K.music(SONGS.club);
      }

      // ============================================================ the start menu, party, bag, Critterdex
      function* startMenu() {
        K.sfx.tone(1000, 0.04, 'square', 0.05);
        let i = 0;
        for (;;) {
          const items = (S.f.dex ? ['CRITTERDEX'] : []).concat(S.party.length ? ['PARTY'] : [], ['BAG', 'SAVE', 'EXIT']);
          i = yield menu(items, { x: 76, y: 0, w: 84, start: Math.min(i, items.length - 1) });
          const k = items[i];
          if (i < 0 || k === 'EXIT') return;
          if (k === 'CRITTERDEX') yield* dexScreen();
          else if (k === 'PARTY') yield* partyScreen('look');
          else if (k === 'BAG') yield* bagScreen(false);
          else if (k === 'SAVE') { save(); K.sfx.seq([[76, 0.5], [79, 0.5], [84, 1]], { bpm: 260, vol: 0.08 }); yield* msg('JACK saved the game. (It saves itself as you go along too!)'); report(); return; }
        }
      }
      let scr = null; // a full-screen view: { draw() }
      function hpBar(x, y, w, hp, max) {
        g.fillStyle = P[3]; g.fillRect(x, y, w + 2, 4); g.fillStyle = P[0]; g.fillRect(x + 1, y + 1, w, 2);
        const f = Math.max(0, Math.min(1, hp / max)); g.fillStyle = f > 0.5 ? P[2] : f > 0.2 ? P[2] : P[3]; g.fillRect(x + 1, y + 1, Math.ceil(w * f), 2);
        if (f <= 0.2 && f > 0 && (K.frame >> 3) % 2) { g.fillStyle = P[1]; g.fillRect(x + 1, y + 1, Math.ceil(w * f), 2); }
      }
      function* partyScreen(why) {
        const pm0 = scr;
        try { return yield* partyInner(why); } finally { scr = pm0; }
      }
      function* partyInner(why) {
        const T = team();
        if (!T.length) return -1;
        let i = why === 'battle' || why === 'forced' ? B.mi : 0;
        for (;;) {
          scr = { draw() {
            g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
            T.forEach((c, j) => {
              const y = 2 + j * 16;
              if (j === i) { g.fillStyle = P[1]; g.fillRect(0, y - 1, W, 16); }
              g.drawImage(sprite(c.s), 0, 0, 32, 32, 12, y, 14, 14);
              F.draw(g, nameOf(c), 30, y + 1, P[3]); F.draw(g, 'L' + c.lv, 134, y + 1, P[3]);
              hpBar(30, y + 10, 56, c.hp, maxhp(c)); F.draw(g, c.hp > 0 ? `${c.hp}/${maxhp(c)}` : 'FAINT', 98, y + 8, P[3]);
              if (j === i) F.draw(g, '>', 3, y + 3, P[3]);
            });
            box(0, 98, 160, 46); F.draw(g, why === 'forced' ? 'CHOOSE A CRITTER.' : why === 'pick' ? 'WHICH ONE?' : why === 'trade' ? 'WHICH ONE TO TRADE?' : 'A: CHOOSE  B: BACK', 8, 108, P[3]);
          } };
          const r = yield fn(() => {
            if (K.pressed('up')) i = (i + T.length - 1) % T.length;
            if (K.pressed('down')) i = (i + 1) % T.length;
            if (K.pressed('a')) return i;
            if (K.pressed('b') && why !== 'forced') return -1;
          });
          if (r < 0) return -1;
          if (why === 'trade') { const k = yield menu(['OFFER', 'SUMMARY', 'BACK'], { x: 88, y: 96 - 46, w: 72 }); if (k === 0) return r; if (k === 1) yield* summary(T[r]); continue; }
          if (why === 'battle' || why === 'forced' || why === 'pick' || why === 'item') {
            if (why === 'battle') { const k = yield menu(['SEND OUT', 'SUMMARY', 'BACK'], { x: 88, y: 96 - 46, w: 72 }); if (k === 0) return r; if (k === 1) yield* summary(T[r]); continue; }
            return r;
          }
          const k = yield menu(['SUMMARY', 'MOVE UP', 'BACK'], { x: 88, y: 96 - 46, w: 72 });
          if (k === 0) yield* summary(T[r]);
          else if (k === 1 && r > 0) { const t = T[r]; T[r] = T[r - 1]; T[r - 1] = t; i = r - 1; }
        }
      }
      function* summary(c) {
        const pm = scr;
        scr = { draw() {
          g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
          g.drawImage(sprite(c.s), 4, 4);
          F.draw(g, nameOf(c), 44, 6, P[3]); F.draw(g, `L${c.lv} ${SP[c.s].t}`, 44, 18, P[3]);
          F.draw(g, `HP ${c.hp}/${maxhp(c)}`, 44, 30, P[3]);
          F.draw(g, `ATK ${stat(c, 1)}  DEF ${stat(c, 2)}  SPD ${stat(c, 3)}`, 4, 44, P[3]);
          F.draw(g, `EXP ${c.exp}  NEXT ${c.lv < 50 ? expAt(c.lv + 1) - c.exp : 0}`, 4, 56, P[3]);
          if (B && B.link) {} else F.draw(g, 'OT/' + String(c.ot || 'JACK').toUpperCase().slice(0, 10), 100, 6 + 24, c.ot ? P[3] : P[2]);
          box(0, 68, 160, 76);
          c.moves.forEach((m, j) => { F.draw(g, mvN(m), 10, 78 + j * 14, P[3]); F.draw(g, MOVES[m][1] ? 'P' + MOVES[m][1] : '-', 122, 78 + j * 14, P[2]); });
        } };
        yield fn(() => { if (K.pressed('a') || K.pressed('b')) return NOTHING; });
        scr = pm;
      }
      function* bagScreen(inBattle) {
        for (;;) {
          const have = ITEM_ORDER.filter(k => S.bag[k] > 0);
          if (!have.length) { yield* msg('The bag is empty! (Apart from an old crisp packet.)'); return null; }
          const j = yield menu(have.map(k => `${ITEMS[k][0]} x${S.bag[k]}`), { x: 0, y: 0, w: 160, after: k => { box(0, 96, 160, 48); wrap(ITEMS[have[k]][2], 23).forEach((l, n) => F.draw(g, l, 9, 106 + n * 14, P[3])); } });
          if (j < 0) return null;
          const k = have[j];
          if (k === 'CUBE') { if (!inBattle) { yield* msg('PROF BRAMBLE\'s words echoed... "There\'s a time and a place for that, JACK!"'); continue; } return { k: 'item', item: 'CUBE' }; }
          if (!S.party.length) { yield* msg('You haven\'t got any critters to use it on!'); continue; }
          const on = yield* partyScreen('item');
          if (on < 0) continue;
          const c = S.party[on];
          if (k === 'PEP' ? c.hp > 0 : (c.hp <= 0 || c.hp >= maxhp(c))) { yield* msg('It won\'t have any effect.'); continue; }
          if (inBattle) return { k: 'item', item: k, on };
          if (k === 'PEP') { c.hp = Math.floor(maxhp(c) / 2); S.bag.PEP--; yield* msg(`${nameOf(c)} perked right up!`); }
          else { const was = c.hp; c.hp = Math.min(maxhp(c), c.hp + (k === 'BIG' ? 60 : 20)); S.bag[k]--; yield* msg(`${nameOf(c)} got ${c.hp - was} HP back!`); }
        }
      }
      function* dexScreen() {
        let i = 0, top = 0;
        const pm = scr;
        const row = s => `${String(s + 1).padStart(3, '0')} ${S.seen[s] ? SP[s].n : '-----'}`;
        scr = { draw() {
          g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
          F.draw(g, 'CRITTERDEX', 4, 3, P[3]); F.draw(g, `SEEN ${Object.keys(S.seen).length} OWN ${Object.keys(S.caught).length}`, 70, 3, P[2]);
          for (let r = 0; r < 10; r++) { const s = top + r; if (s >= NSP) break; const y = 15 + r * 12; if (s === i) F.draw(g, '>', 2, y, P[3]); F.draw(g, row(s), 10, y, S.seen[s] ? P[3] : P[2]); if (S.caught[s]) { g.fillStyle = P[3]; g.fillRect(150, y + 1, 5, 5); g.fillStyle = P[0]; g.fillRect(151, y + 2, 1, 1); } }
          if (S.seen[i]) { g.drawImage(sprite(i), 0, 0, 32, 32, 118, 40, 32, 32); }
        } };
        for (;;) {
          const r = yield fn(() => {
            if (K.pressed('up')) i = Math.max(0, i - 1); if (K.pressed('down')) i = Math.min(NSP - 1, i + 1);
            if (i < top) top = i; if (i >= top + 10) top = i - 9;
            if (K.pressed('a')) return i; if (K.pressed('b')) return -1;
          });
          if (r < 0) break;
          if (!S.seen[r]) continue;
          const inner = scr;
          scr = { draw() {
            g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
            g.drawImage(sprite(r), 4, 4, 32, 32);
            F.draw(g, `${String(r + 1).padStart(3, '0')} ${SP[r].n}`, 42, 8, P[3]); F.draw(g, `TYPE ${SP[r].t}`, 42, 20, P[3]);
            box(0, 44, 160, 100);
            (S.caught[r] ? wrap(SP[r].dex, 23) : ['NOT CAUGHT YET.', 'CATCH ONE TO LEARN MORE!']).forEach((l, n) => F.draw(g, l, 9, 54 + n * 12, P[3]));
          } };
          yield fn(() => { if (K.pressed('a') || K.pressed('b')) return NOTHING; });
          scr = inner;
        }
        scr = pm;
      }

      // ============================================================ the badge, and the credits
      let lastBadge = 1;
      function* badge(k) {
        k = k || 1; lastBadge = k;
        if (k === 2) S.f.badge2 = 1; else S.f.badgeAt = Date.now();
        S.badges = (S.beaten.hazel || k === 1 ? 1 : 0) + (S.f.badge2 ? 1 : 0);
        K.music(null);
        K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1], [83, 0.5], [84, 0.5], [88, 2]], { bpm: 200, vol: 0.1 });
        if (k === 2) {
          yield* msg('JACK got the SPLASH BADGE from CAPTAIN NORA!');
          K.secret('rm.mon.bay');
          yield* msg(`NORA: That's ${S.badges} badges! Keep your feet dry and your critters happy, JACK.`);
        } else {
          yield* msg('JACK got the MOSS BADGE from HAZEL!');
          K.secret(PUD ? 'lk.puddle' : 'rm.mon.gym');
          yield* msg('HAZEL: That badge shows you\'re a proper critter trainer. I\'m proud of you, JACK. Your Mom will be too!');
          yield* msg('HAZEL: There\'s another gym in PEBBLE BAY, past GRUMBLY CAVE at the top of the WHISPERING WOODS.');
        }
        healAll(); save();
        yield* credits();
      }
      let cred = null;
      function* credits() {
        const lines = ['POCKET CRITTERS', VV.name, '', 'STARRING', 'JACK', '', 'AND HIS CRITTERS'].concat(S.party.map(c => `${nameOf(c)}  L${c.lv}`), ['', `CRITTERS CAUGHT ${Object.keys(S.caught).length}/${NSP}`, '', 'WITH', 'PROF BRAMBLE', 'MOM', 'JACKK', 'LUKE  DAVE  CALLUM', 'HAZEL', '', 'MADE IN 1999', 'BY PIXIE PIXEL', '', 'THANK YOU FOR PLAYING!', '', 'NOW GO AND', 'CATCH THE REST!']);
        const pm = mode; mode = 'credits'; cred = { lines, y: H };
        K.music(SONGS.title);
        const sc = score(), minT = Math.max(16, sc / 40 + 9 - (K.t - lastRep.t));
        const t0 = K.t;
        yield fn(() => { cred.y -= (K.held("a") || K.held("b")) ? 1.2 : 0.5; if (cred.y < -lines.length * 12 - 10 && K.t - t0 >= minT) return NOTHING; if (cred.y < -lines.length * 12 - 10) cred.y = -lines.length * 12 - 10; });
        mode = pm === 'credits' ? 'world' : 'world'; cred = null; playSong();
        if (!finalDone) { finalDone = true; lastRep = { t: K.t, sc }; K.over(sc, { title: lastBadge === 2 ? 'SPLASH BADGE!' : 'MOSS BADGE!', text: `JACK beat ${lastBadge === 2 ? 'CAPTAIN NORA' : 'HAZEL'} and caught ${Object.keys(S.caught).length} of ${NSP} critters!` }); }
      }

      // ============================================================ the title screen
      let tsel = 0, tspr = 0;
      const other = LC.VERSIONS[PUD ? 'moss' : 'puddle'].only, TITLE = PUD ? [17, 20, 19, 2, 11, 3, 18, 13, 7] : SP.map(x => x.i).filter(i => !other.includes(i) && i < 17);
      function* titleScreen() {
        mode = 'title'; K.music(SONGS.title);
        for (;;) {
          const items = saved ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME'];
          const r = yield fn(() => {
            if (K.pressed('up') || K.pressed('down')) { tsel = (tsel + 1) % items.length; K.sfx.tone(900, 0.03); }
            if (K.pressed('start') || K.pressed('a')) return tsel;
          });
          if (items[r] === 'CONTINUE') { S = saved; break; }
          if (saved) { const c = yield* ask('Start a brand new game? Your old save will be gone when you next save.'); if (c !== 0) continue; }
          S = fresh(); break;
        }
        yield fade(true);
        mode = 'world';
        S.bag = Object.assign({ CUBE: 0, CAKE: 0, BIG: 0, PEP: 0 }, S.bag);
        for (const c of S.party.concat(S.box)) if (!c.id) c.id = uid(); // (every critter gets a tag, so a trade knows which one went)
        if (member()) lsend({ t: 'lkHello' }); // (anything that came down the cable while we were off lands in a moment)
        loadMap(S.map || 'house', S.x, S.y, S.dir);
        if (!S.f.intro) {
          S.f.intro = 1;
          yield fade(false);
          yield* msg('PROF BRAMBLE: Hello there! I\'m PROFESSOR BRAMBLE, and this is MOSS TOWN.');
          yield* msg('PROF BRAMBLE: The long grass round here is full of POCKET CRITTERS. Some people keep them as pets. Some people battle with them.');
          yield* msg('PROF BRAMBLE: Me? I study them. Your Mom says you\'re old enough for a critter of your very own, JACK. Come and see me at my lab!');
          save();
          return;
        }
        yield fade(false);
      }

      // ============================================================ drawing
      function drawWorld() {
        const cx = pl.x * 16 + pl.mx - 72, cy = pl.y * 16 + pl.my - 64;
        const tx0 = Math.floor(cx / 16), ty0 = Math.floor(cy / 16), wf = (K.frame >> 5) % 2;
        for (let ty = ty0; ty <= ty0 + 9; ty++) for (let tx = tx0; tx <= tx0 + 10; tx++) {
          const t = tileAt(map, tx, ty);
          g.drawImage(tileArt(t, t === 'W' ? wf : 0), tx * 16 - cx, ty * 16 - cy);
        }
        const things = npcs.map(n => ({ y: n.y * 16 + n.my, n })).concat([{ y: pl.y * 16 + pl.my, p: 1 }]).sort((a, b) => a.y - b.y);
        for (const th of things) {
          if (th.p) {
            const sx = pl.x * 16 + pl.mx - cx, sy = pl.y * 16 + pl.my - cy - 4;
            g.drawImage(person('kid2', pl.dir, pl.moving ? pl.fr : 0), sx, sy);
            // long grass covers your feet
            if ('"~'.includes(tileAt(map, pl.x, pl.y)) && !pl.moving) { g.drawImage(tileArt(tileAt(map, pl.x, pl.y)), 0, 10, 16, 6, sx, sy + 14, 16, 6); }
          } else {
            const n = th.n, sx = n.x * 16 + n.mx - cx, sy = n.y * 16 + n.my - cy;
            if (n.obj) g.drawImage(objArt(n.obj), sx, sy);
            else g.drawImage(person(n.st, n.dir, (n.mx || n.my) ? n.fr || 0 : 0), sx, sy - 4);
            if (bang === n) { box(sx + 2, sy - 18, 12, 13); F.draw(g, '!', sx + 5, sy - 15, P[3]); }
          }
        }
        if (mapName > 0) { const nm = map.name; box(0, 0, nm.length * 6 + 16, 18); F.draw(g, nm, 8, 5, P[3]); }
      }
      PEOPLE.kid2 = { hair: 3, cap: 1, capCol: 2, shirt: 2, col: PCOL.kid2 };
      function drawBattle() {
        const cv = map && map.cave, bg = cv ? ['#f0e4d0', '#b8a088', '#806850'] : map && map.inside ? ['#f8f0e0', '#e0c8a8', '#a08060'] : map && map.id === 'bay' ? ['#f0f8ff', '#f0e0a8', '#c0a060'] : ['#f8f8f0', '#a8d890', '#58a048'];
        g.fillStyle = bg[0]; g.fillRect(0, 0, W, H);
        g.fillStyle = bg[2]; ell(124, 57, 33, 7); ell(36, 93, 35, 7);
        g.fillStyle = bg[1]; ell(124, 56, 32, 6); ell(36, 92, 34, 6);
        const f = B.foe, m = me();
        if (B.foeVis && !B.foeBlink) g.drawImage(sprite(f.s), 0, 0, 32, 32, 92 + B.foeX + B.foeDx, -6 + (B.foeDy || 0), 64, 64);
        if (B.cube) { g.drawImage(objArt('cube'), B.cube.x + B.cube.shake, B.cube.y); }
        if (B.meVis && !B.meBlink && m) { g.save(); g.beginPath(); g.rect(0, 0, W, 96); g.clip(); g.drawImage(spriteF(m.s), 0, 0, 32, 32, 6 + B.meX + B.meDx, 34 + (B.meDy || 0), 64, 64); g.restore(); }
        // the foe's box
        if (B.foeVis) {
          F.draw(g, nameOf(f), 6, 4, P[3]); F.draw(g, 'L' + f.lv, 70, 4, P[3]);
          g.fillStyle = P[3]; g.fillRect(4, 22, 76, 1); g.fillRect(79, 14, 1, 9);
          F.draw(g, 'HP', 8, 14, P[3]); hpBar(22, 15, 48, B.foeHp, maxhp(f));
          if (S.caught[f.s] && !B.tr) { g.fillStyle = P[3]; g.fillRect(58, 4, 5, 5); g.fillStyle = P[0]; g.fillRect(59, 5, 1, 1); }
          if (B.tr && B.foes.length > 1) B.foes.forEach((c, i) => { const x = 8 + i * 8; g.fillStyle = P[3]; g.fillRect(x, 26, 6, 6); g.fillStyle = c.hp > 0 ? P[1] : P[0]; g.fillRect(x + 1, 27, 4, 4); if (c.hp > 0) { g.fillStyle = P[3]; g.fillRect(x + 1, 29, 4, 1); } });
        }
        if (B.hitFx) hitFx(B.hitFx);
        if (B.meVis && m) {
          F.draw(g, nameOf(m), 86, 60, P[3]); F.draw(g, 'L' + m.lv, 136, 68, P[3]);
          F.draw(g, 'HP', 88, 76, P[3]); hpBar(102, 77, 48, B.meHp, maxhp(m));
          F.draw(g, `${Math.ceil(B.meHp)}/${maxhp(m)}`.padStart(7, ' '), 112, 84, P[3]);
          g.fillStyle = P[3]; g.fillRect(84, 93, 74, 1); g.fillRect(157, 74, 1, 20);
          const e0 = expAt(m.lv), e1 = expAt(m.lv + 1); g.fillStyle = P[1]; g.fillRect(102, 91, 48, 1); g.fillStyle = P[3]; g.fillRect(102, 91, Math.round(48 * Math.max(0, Math.min(1, (m.exp - e0) / Math.max(1, e1 - e0)))), 1);
        }
        if (!task || !task.draw) box(0, 96, 160, 48);
      }
      function ell(cx, cy, rx, ry) { g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
      // a little burst in the move's type colour on whoever got hit
      const FXC = { EMBER: ['#f8d040', '#f05818'], PUDDLE: ['#c0e8ff', '#3880e8'], MOSS: ['#c8f0a0', '#38a038'], SPARK: ['#fff8a0', '#f0c010'], ROCK: ['#e0c8a0', '#906838'], FLUFF: ['#ffffff', '#f080b0'] };
      function hitFx(h) {
        const [cx, cy] = h.on === 'foe' ? [124, 26] : [38, 64], c = FXC[h.ty] || FXC.FLUFF, k = h.t;
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2 + k * 2, r = 4 + k * 22, x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r * 0.8);
          g.fillStyle = '#201418'; g.fillRect(x - 1, y - 1, 5, 5); g.fillStyle = c[i % 2]; g.fillRect(x, y, 3, 3);
          if (h.ty === 'SPARK') { g.fillRect(x + 3, y - 2, 1, 3); } else if (h.ty === 'PUDDLE') { g.fillRect(x + 1, y - 2, 1, 2); }
        }
        if (k < 0.15) { g.fillStyle = c[0]; g.globalAlpha = 0.5; g.fillRect(0, 0, W, 96); g.globalAlpha = 1; }
      }
      function drawTitle() {
        g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
        g.fillStyle = P[3]; g.fillRect(0, 0, W, 44); g.fillStyle = P[2]; g.fillRect(0, 44, W, 2);
        g.save(); g.font = 'italic 900 19px Arial Black,Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = P[2]; g.fillText('POCKET', W / 2 + 2, 14); g.fillStyle = P[0]; g.fillText('POCKET', W / 2, 12);
        g.fillStyle = P[2]; g.fillText('CRITTERS', W / 2 + 2, 33); g.fillStyle = P[1]; g.fillText('CRITTERS', W / 2, 31); g.restore();
        F.center(g, VV.name, W / 2, 50, P[2]);
        const s = TITLE[(K.frame / 150 | 0) % TITLE.length]; tspr = s;
        g.drawImage(sprite(s), 0, 0, 32, 32, 88, 60, 64, 64);
        if (task && task.update && !held) {
          const items = saved ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME'];
          items.forEach((it, i) => F.draw(g, (i === tsel ? '>' : ' ') + it, 8, 112 + i * 11, P[3]));
          F.draw(g, '(C)1999 PIXIE', W - 82, 136, P[2]);
        }
      }
      function drawEvo() {
        g.fillStyle = P[0]; g.fillRect(0, 0, W, H);
        const t = evoShow.t, flick = t < 1 && Math.sin(t * t * 90) > 0;
        const s = t >= 2 ? evoShow.b : flick ? evoShow.b : evoShow.a;
        g.drawImage(sprite(s), 0, 0, 32, 32, W / 2 - 32, 20, 64, 64);
      }
      function drawCredits() {
        g.fillStyle = P[3]; g.fillRect(0, 0, W, H);
        cred.lines.forEach((l, i) => { const y = cred.y + i * 12; if (y > -10 && y < H) F.center(g, l, W / 2, y, i < 2 ? P[1] : P[0]); });
      }
      let mapName = 0, lastMap = '';

      // ============================================================ the game loop
      K.dbg = { get S() { return S; }, pl, get map() { return map; }, get npcs() { return npcs; }, get mode() { return mode; }, get task() { return task; }, get B() { return B; }, LINK, get scr() { return scr; }, get held() { return held; }, tileAt, SOLID, warpAt, run, battle, mon, loadMap, sprite, person, tileArt, badge }; // (for testing)
      run(titleScreen());
      return {
        update() {
          if (S) S.play = (S.play || 0) + 1 / 60;
          if (pl.bump) pl.bump--;
          if (runTask()) return;
          if (mode !== 'world' || !S) return;
          if (map.id !== lastMap) { lastMap = map.id; mapName = 120; }
          if (mapName > 0) mapName--;
          // autosave and spaced-out progress reports
          saveT += 1 / 60; if (saveT > 60) { saveT = 0; save(); }
          if (pending && K.frame % 60 === 0) report();
          // deliveries from the Cable Club that never landed (the line dropped mid-trade): they land now
          if (!script && K.frame % 30 === 0) { const hi = LINK.q.findIndex(m => m.t === 'lkHello'); if (hi >= 0) { const m = LINK.q.splice(hi, 1)[0]; if ((m.inbox || []).some(x => !x.ver || x.ver === VER)) return run(deliver(m.inbox)); } }
          // wandering townsfolk
          for (const n of npcs) if (n.wander && !n.mx && !n.my) {
            if (--n.wt <= 0) {
              n.wt = 90 + ri(0, 150); const d = ['up', 'down', 'left', 'right'][ri(0, 3)], [dx, dy] = DIRS[d];
              n.dir = d; const nx = n.x + dx, ny = n.y + dy;
              if (Math.abs(nx - n.home[0]) <= 2 && Math.abs(ny - n.home[1]) <= 2 && !blocked(nx, ny) && tileAt(map, nx, ny) !== '"') { n.x = nx; n.y = ny; n.mx = -dx * 16; n.my = -dy * 16; n.fr = (n.fr || 0) ^ 1; }
            }
          } else if (n.mx || n.my) { if (n.mx) n.mx += n.mx > 0 ? -1 : 1; if (n.my) n.my += n.my > 0 ? -1 : 1; }
          // walking
          if (pl.moving) {
            const s = 2; if (pl.mx) pl.mx += pl.mx > 0 ? -s : s; if (pl.my) pl.my += pl.my > 0 ? -s : s;
            if (pl.mx === 0 && pl.my === 0) { pl.moving = 0; arrived(); }
            if (pl.moving || script) return;
          }
          if (K.pressed('start')) return run(startMenu());
          if (K.pressed('a')) return interactFace();
          const dir = ['up', 'down', 'left', 'right'].find(d => K.held(d));
          if (!dir) { pl.turn = 0; return; }
          if (dir !== pl.dir && !pl.moving && K.pressed(dir)) { pl.dir = dir; pl.turn = 5; return; }
          if (pl.turn > 0) { pl.turn--; return; }
          tryStep(dir);
        },
        draw() {
          if (mode === 'title') drawTitle();
          else if (mode === 'battle' && B) drawBattle();
          else if (mode === 'evo' && evoShow) drawEvo();
          else if (mode === 'credits' && cred) drawCredits();
          else if (S && (mode === 'world' || mode === 'show')) {
            drawWorld();
            if (mode === 'show') { box(48, 8, 64, 64); g.drawImage(sprite(showSp), 0, 0, 32, 32, 56, 16, 48, 48); }
          }
          if (scr) scr.draw();
          if (task && task.draw) task.draw();
          drawFade();
        },
        end() { if (S && mode !== 'title') save(); K.music(null); if (LINK.up) { LINK.up = false; lsend({ t: 'lkClub', on: 0 }); if (LINK.sid) lsend({ t: 'lkQuit', sid: LINK.sid }); LINK.sid = null; } },
      };
    },
  }; }
  TV.game('gb.mon', cart('moss'));
  TV.game('gb.mon2', cart('puddle'));
})();

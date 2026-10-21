/* Dungeon Keepa 2 (Bulljack Productions, 1999) for the Games Cupboard. Lazy loaded by discs.js.
 * Dig out a dungeon, let your imps claim it, build rooms, lure beasts through the Portal, pay them, slap them,
 * and smash the do-gooders (and Sir Callum the Brave) who come out of the Hero Gate. Original code and pixel art. */
(function () {
  'use strict';
  const D = window.Discs; if (!D) return;

  // ================================================================ constants
  const W = 40, H = 30, TS = 16, N = W * H;
  const ROCK = 0, EARTH = 1, GOLD = 2, GEM = 3, WALL = 4, DIRT = 5, CLAIM = 6, HFLOOR = 7, LAVA = 8, WATER = 9, HEART = 10, PORTAL = 11, GATE = 12;
  const isSolid = t => t <= WALL;
  const isDig = t => t >= EARTH && t <= WALL;
  const isWalk = t => t === DIRT || t === CLAIM || t === HFLOOR || t === WATER || t === PORTAL;
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = l => l[Math.floor(Math.random() * l.length)];
  const fmtT = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  const ROOM = [null,
    { k: 'lair', n: 'Lair', cost: 75, col: '#d8b048', d: 'Beds. One beast per tile. No Lair, no beasts.' },
    { k: 'hatch', n: 'Hatchery', cost: 75, col: '#9a7a3a', d: 'Grows chickens for your beasts to eat. Fire Gobblers come for one with 4+ tiles.' },
    { k: 'treas', n: 'Treasury', cost: 50, col: '#ffd400', d: 'Holds 500 gold a tile. Imps carry the gold here.' },
    { k: 'train', n: 'Training Room', cost: 150, col: '#c08040', d: 'Beasts get tougher here (costs gold). Belchers come for one with 4+ tiles.' },
    { k: 'lib', n: 'Library', cost: 200, col: '#a868f0', d: 'Dark Mages research spells here. They only come for 4+ tiles.' },
    { k: 'work', n: 'Workshop', cost: 125, col: '#8a9aaa', d: 'Makes your traps and doors. Trolls come for one with 4+ tiles.' },
  ];
  const NROOM = ROOM.length - 1;
  // likes: the room a beast loves working in (it gets grumpy without one). lure: [room, tiles] that brings it through the Portal
  const K = {
    imp: { n: 'Imp', hp: 40, dmg: 3, rate: 0.8, range: 1.1, sp: 2.7, d: 'Digs, claims, carries gold. Never complains. Slap it.' },
    gretchin: { n: 'Goblin', hp: 85, dmg: 7, rate: 0.6, range: 1.1, sp: 3.0, wage: 30, likes: 4, hungry: 0.8, names: ['Snikkit', 'Grabba', 'Nobbit', 'Weedle', 'Skrag', 'Zogwort', 'Pipsqueak', 'Tinny', 'Sneaky Pete'], d: 'Small, quick and cheap. Comes to any dungeon with a Lair and a Hatchery. Likes training.' },
    squig: { n: 'Fire Gobbler', hp: 105, dmg: 11, rate: 1.2, range: 4, sp: 2.4, wage: 50, shot: '#ff7a00', likes: 2, hungry: 1.25, lure: [2, 4], names: ['Chompy', 'Gnasha', 'Big Red', 'Toothy', 'Rolla', 'Munch', 'Biscuit'], d: 'Spits fireballs. Always hungry. Comes for a Hatchery of 4+ tiles.' },
    troll: { n: 'Troll', hp: 250, dmg: 17, rate: 1.0, range: 1.2, sp: 1.8, wage: 90, likes: 6, hungry: 0.8, lure: [6, 4], names: ['Big Norm', 'Clod', 'Dennis', 'Stonker', 'Boulda', 'Pebbles'], d: 'Tough, slow, good with a hammer. Makes traps in the Workshop (4+ tiles brings one).' },
    mage: { n: 'Dark Mage', hp: 85, dmg: 20, rate: 1.6, range: 5, sp: 2.0, wage: 80, shot: '#c070ff', likes: 5, hungry: 0.7, lure: [5, 4], names: ['Mystic Dave', 'Murkle', 'Old Snot', 'Zappa', 'Hexy', 'Wizzo'], d: 'Researches spells in the Library (4+ tiles brings one). Zaps from range.' },
    belcher: { n: 'Belcher', hp: 320, dmg: 15, rate: 1.3, range: 1.4, sp: 1.4, wage: 70, splash: 1, likes: 4, hungry: 1.4, lure: [4, 4], names: ['Burpy', 'Gutsy', 'Big Bert', 'Gurgle', 'Parp', 'Wobbler'], d: 'A big green belly with legs. Burps on everything nearby. Comes for a Training Room of 4+ tiles. Eats loads.' },
    knight: { n: 'Knight', hp: 200, dmg: 14, rate: 1.0, range: 1.2, sp: 1.7, hero: 1, bounty: 60, pts: 150, d: 'Big sword, big shield, big head.' },
    archer: { n: 'Elf Archer', hp: 85, dmg: 9, rate: 1.0, range: 5, sp: 2.2, shot: '#f0f0b0', hero: 1, bounty: 40, pts: 110, d: 'Shoots from a distance. Fragile up close.' },
    dwarf: { n: 'Dwarf', hp: 150, dmg: 11, rate: 0.9, range: 1.1, sp: 1.6, dig: 2.2, hero: 1, bounty: 50, pts: 120, d: 'Digs through earth twice as fast as anyone else.' },
    wizard: { n: 'Wizard', hp: 90, dmg: 15, rate: 1.6, range: 5, sp: 1.9, shot: '#60c0ff', heal: 1, hero: 1, bounty: 70, pts: 170, d: 'Zaps from range and heals heroes near him.' },
    callum: { n: 'Sir Callum the Brave', hp: 650, dmg: 24, rate: 0.9, range: 1.3, sp: 1.7, hero: 1, bounty: 300, boss: 1, pts: 350, d: 'Has finished this game twice. He will tell you about it.' },
  };
  const BEASTS = ['gretchin', 'squig', 'troll', 'mage', 'belcher'];
  const XP = [0, 0, 30, 80, 150, 250, 380];
  const SPELLS = {
    imp: { n: 'Create Imp', cost: 150, res: 0, d: 'Conjures a new imp on your claimed floor. Max 24.' },
    call: { n: 'Call to Arms', cost: 100, res: 0, d: 'Every beast rushes to the spot and fights whatever is there, for 25 seconds.' },
    zap: { n: 'Lightning', cost: 200, res: 150, d: 'Zaps everything near the spot. Heroes hate it. Your beasts aren\'t keen either.' },
    cluck: { n: 'Cluck Storm', cost: 120, res: 250, d: 'Rains chickens on the spot, so your beasts can eat mid-battle.' },
    speed: { n: 'Speed Monster', cost: 150, res: 350, d: 'Click one of your beasts: it goes twice as fast for 30 seconds.' },
    heal: { n: 'Heal', cost: 200, res: 600, d: 'Heals all your beasts near the spot.' },
  };
  // traps and doors: made in the Workshop (mfg points), placed on your claimed floor
  const TRAP = [null,
    { k: 'spike', n: 'Spike Trap', cost: 100, mfg: 25, d: 'Pops up under a hero: 60 damage. Re-arms in 3 seconds.' },
    { k: 'stink', n: 'Stink Bomb', cost: 150, mfg: 35, d: 'A pong so bad heroes cry. Hurts every hero nearby for 3 seconds.' },
    { k: 'zapt', n: 'Lightning Trap', cost: 250, mfg: 60, d: 'Zaps heroes on and around it for 70. Re-arms in 6 seconds.' },
    { k: 'wdoor', n: 'Wooden Door', cost: 80, mfg: 20, door: 300, d: 'Your creatures walk through. Heroes have to bash it down.' },
    { k: 'idoor', n: 'Iron Door', cost: 200, mfg: 50, door: 900, d: 'Like a wooden door, but iron. Heroes HATE iron doors.' },
  ];
  const isDoor = k => k >= 4;
  const DIFF = [{ n: 'Easy', m: 0.75, t: 1.3, g: 1.2 }, { n: 'Normal', m: 1, t: 1, g: 1 }, { n: 'Hard', m: 1.3, t: 0.85, g: 0.9 }];
  // realms. The array index is the save id (old saves use 0-2), ORDER is the campaign order on the realm map
  const LV = [
    { n: 'Pleasantvale', seed: 1999, gold: 3000, heart: [7, 15], portal: [19, 6], gate: [33, 21], first: 240, gap: 150, mult: 0.85, mx: 52, my: 150,
      waves: [['dwarf', 'knight'], ['knight', 'archer', 'dwarf', 'knight'], ['callum', 'knight', 'archer', 'wizard', 'dwarf']],
      brief: 'Pleasantvale. A disgustingly nice realm. The people here hold picnics, wave at each other and recycle. It makes me feel ill, Keepa.\n\nDig out a dungeon, claim the Portal to the north, and build a Lair and a Hatchery so beasts will come. The heroes will arrive from their Hero Gate in the south-east. Crush them, then smash the Gate.\n\nI am told a "Sir Callum the Brave" leads them. I am told he has finished this game twice.' },
    { n: 'Mudwallop-on-Sea', seed: 77, gold: 2600, heart: [6, 7], portal: [20, 22], gate: [34, 8], first: 220, gap: 140, mult: 1.25, mx: 176, my: 52,
      waves: [['dwarf', 'archer', 'archer'], ['knight', 'knight', 'wizard', 'dwarf'], ['knight', 'archer', 'archer', 'wizard', 'dwarf', 'dwarf'], ['callum', 'knight', 'knight', 'wizard', 'archer']],
      brief: 'Mudwallop-on-Sea. Donkey rides, rock with the name through the middle, and do-gooders. So many do-gooders.\n\nThe Portal is far to the south. Gold is scarce, so dig carefully. There\'s a gem seam somewhere that never runs out. Find it.\n\nFour waves this time. Sir Callum is back. He says last time was "lag".' },
    { n: 'Callum\'s Keep', seed: 4242, gold: 2600, heart: [6, 22], portal: [17, 12], gate: [33, 6], first: 200, gap: 130, mult: 1.5, mx: 276, my: 40,
      waves: [['knight', 'dwarf', 'archer'], ['knight', 'knight', 'wizard', 'archer'], ['dwarf', 'dwarf', 'knight', 'wizard', 'archer'], ['knight', 'knight', 'knight', 'wizard', 'wizard'], ['callum', 'knight', 'knight', 'archer', 'wizard', 'dwarf']],
      brief: 'Callum\'s Keep. Sir Callum the Brave\'s own realm. He has a poster of himself on his wall. Two, actually.\n\nFive waves. They are tougher here. Train your beasts, research Lightning, put iron doors on every corridor and keep the Treasury full: beasts expect paying, even in a war.\n\nWin this and you are the greatest Keepa of 1999.' },
    { n: 'Daisydale', seed: 31, gold: 2900, heart: [8, 8], portal: [22, 20], gate: [33, 11], first: 230, gap: 145, mult: 1.0, mx: 112, my: 104,
      waves: [['knight', 'archer'], ['dwarf', 'dwarf', 'archer', 'knight'], ['knight', 'wizard', 'archer', 'dwarf'], ['callum', 'knight', 'archer', 'archer']],
      brief: 'Daisydale. Thatched cottages, a village fete, a duck pond with a sign saying "Please Be Kind To The Ducks". Revolting.\n\nNew trick, Keepa: build a WORKSHOP and you can make traps and doors. Spikes under the floor, stink bombs, doors the heroes have to bash through. Trolls love a Workshop.\n\nFour waves. Sir Callum is "only here for the fete".' },
    { n: 'Fluffington Abbey', seed: 909, gold: 2700, heart: [32, 22], portal: [18, 8], gate: [6, 6], first: 210, gap: 135, mult: 1.35, mx: 226, my: 128,
      waves: [['archer', 'archer', 'dwarf'], ['knight', 'knight', 'wizard'], ['dwarf', 'dwarf', 'dwarf', 'wizard', 'archer'], ['callum', 'knight', 'wizard', 'wizard', 'archer', 'knight']],
      brief: 'Fluffington Abbey. Monks, bells, a gift shop selling fudge. The heroes here pray before every fight, which gives us roughly four seconds.\n\nThis time the Hero Gate is to the north-west and your Heart is down in the south-east. Wizards heal each other, so hit them first.\n\nFour waves. Callum has brought a packed lunch.' },
    { n: 'The Bottomless Pit', seed: 0, gold: 3000, heart: [20, 15], portal: [8, 6], gate: [33, 23], first: 260, gap: 170, mult: 0.8, mx: 40, my: 50, endless: 1, waves: [],
      brief: 'The Bottomless Pit. No realm to conquer, no do-gooders\' picnic to ruin. Just you, a fresh bit of earth and heroes who will NOT stop coming. Each wave is bigger than the last.\n\nBuild the finest dungeon in 1999. Then show it off on JackNet, and let other Keepas try to raid it.\n\nHow many waves can you last?' },
  ];
  const ORDER = [0, 3, 1, 4, 2], ENDLESS = 5;
  const TIPS = ['Tip: slap an imp and it works faster. It isn\'t nice. It IS efficient.', 'Tip: imps reinforce the walls next to your floor. Heroes take ages to dig through reinforced walls.',
    'Luke says this would be better on the N64. Luke is wrong.', 'Tip: drop your beasts right next to the heroes with the Hand. They love a scrap.',
    'Dave says he\'d rather be playing GoldenEye. Dave is not the Keepa. You are.', 'Tip: beasts get grumpy if they\'re hungry, tired or not paid. Grumpy beasts leave.',
    'Tip: a Training Room makes beasts tougher, but it eats gold.', 'Callum says he could beat this level with his eyes shut. Callum is a hero now, so ignore him.',
    'Tip: Fire Gobblers like a big Hatchery. Trolls like a Training Room. Dark Mages like books.', 'Your Mom says tea is in ten minutes, Keepa. Better dig faster.',
    'JackK built a Lair the size of a football pitch once. Nobody came. He forgot the Portal.',
    'Tip: a door on a narrow corridor holds heroes up while your beasts get there. Iron doors hold them up for ages.',
    'Tip: Call to Arms sends every beast to one spot. Very handy when the heroes turn up somewhere awkward.',
    'Tip: beasts love their favourite room. Trolls want a Workshop, Dark Mages want books, Belchers want a Training Room.',
    'Tip: lava hurts your creatures, not the heroes. Don\'t drop your beasts in it. Dave did. Twice.',
    'Tip: press G to jump to the heroes, Home to jump to your Heart.'];

  // ================================================================ pixel art
  const PAL = { k: '#141010', w: '#ffffff', y: '#ffd400', e: '#ffe600', r: '#c0522a', R: '#7a2a10', g: '#b0b0b8', G: '#5a5a66', b: '#8a6430', B: '#4a3010', n: '#4aa02a', N: '#235a14',
    d: '#e02020', t: '#f0e6c8', s: '#e8402a', S: '#8a1a0a', p: '#7a3ab0', P: '#3e1a6a', c: '#d0d8e8', C: '#7a8498', u: '#2a5ad8', U: '#14306a', f: '#f0b888', h: '#a0703a', H: '#f0f0f0',
    a: '#f0c020', A: '#9a7010', T: '#8a9a6a', V: '#4e5a3a', o: '#ff8a00' };
  const ART = {
    imp: [['k........k', 'kRk....kRk', '.kRkkkkRk.', '.krrrrrrk.', '.krerrerk.', '.krwkkwrk.', '..krrrrk..', '.krRrrRrk.', 'krkkrrkkrk', '..krRRrk..'], '..kk..kk..', '.kk....kk.'],
    gretchin: [['k........k', 'kNk.kk.kNk', '.kNknnkNk.', '..knnnnk..', '..kdnndk..', '..knttnk..', '...knnk...', '..kbbbbk..', '.knkbbknk.', '...kbbk...'], '..kk..kk..', '.kk....kk.'],
    squig: [['...kkkkkk...', '..kssssssk..', '.ksywssywsk.', '.kssssssssk.', 'kSttttttttSk', 'kSkkkkkkkkSk', 'kSktkttktkSk', '.kSSSSSSSSk.', '..kkkkkkkk..'], '..kk....kk..', '...kk..kk...'],
    troll: [['....kkkk....', '...kTTTTk...', '..kTyTTyTk..', '..kTTTTTTk..', '..kTtkktTk..', '...kTTTTk...', '.kkTTTTTTkk.', 'kTTkTTTTkTTk', 'kTTkTVVTkTTk', 'kVk.kTTk.kVk', '...kTTTTk...', '...kTkkTk...'], '..kTTk.kTTk.', '...kVk.kVk..'],
    mage: [['....kk....', '...kppk...', '..kppppk..', '..kpffpk..', '..kdffdk..', '...kffk...', '..kppppk..', '.kpPppPpk.', '.kppyypk..', 'kppppppppk'], 'kPPPPPPPPk', '.kPPPPPPk.'],
    knight: [['....uu....', '...kuuk...', '..kcccck..', '..kckkck..', '..kcccck..', '.kkcccckk.', 'kcCccccCck', 'kc.kuuk.ck', '...kuuk...', '..kcCCck..'], '..kc..ck..', '.kc....ck.'],
    archer: [['....kk....', '...knnk...', '..knnnnk..', '..knffnk..', '..kfkkfk..', '...kffk...', '..knnnnk..', '.kfnnnnfk.', '..knnnnk..', '..kbbbbk..'], '..kb..bk..', '.kb....bk.'],
    dwarf: [['...kkkk...', '..kcccck..', '.kcccccck.', '.kffffffk.', '.kfkffkfk.', '.khhhhhhk.', 'kuhhhhhhuk', 'kuuhhhhuuk', '.kuuuuuuk.'], '.kbbkkbbk.', '..kbk.kbk.'],
    wizard: [['.....k....', '....kuk...', '...kuuk...', '..kuuyuk..', '.kuuuuuuk.', 'kkkkkkkkkk', '..kffffk..', '..kfkkfk..', '..kHHHHk..', '.kuHHHHuk.', '.kuuHHuuk.'], 'kuuuuuuuuk', '.kuuuuuuk.'],
    callum: [['....dddd....', '....kddk....', '...kaaaak...', '...kakkak...', '...kaaaak...', '....kffk....', '..kkaaaakk..', '.kdaaAAaadk.', '.kdkaaaakdk.', '.kd.kaak.dk.', '..d.kAAk.d..', '...kaakaak..'], '...ka..ak...', '..ka....ak..'],
    belcher: [['...kkkkkk...', '..knnnnnnk..', '.knywnnywnk.', '.knkknnkknk.', 'knnnnnnnnnnk', 'knkwkwkwkwnk', 'knnkkkkkknnk', 'kNnnttttnnNk', 'kNnttttttnNk', '.kNnttttnNk.', '..kNNNNNNk..'], '..kNk..kNk..', '.kNk....kNk.'],
    chicken: [['..dd..', '.kHHko', 'kHkHHk', '.khhk.'], '..y.y.', '.y..y.'],
    hand: [['..k.k.k.....', '.kdkdkdk....', '.kgkgkgk.k..', '.kgkgkgkkdk.', '.kgggggkkgk.', '.kggggggggk.', '.kgggggggk..', '..kgggggk...', '..kGGGGGk...', '...kkkkk....'], '', ''],
  };
  // the Mentor: a horned shadow in a hood with glowing eyes (two frames: eyes open, blink)
  const MENTOR = ['...k......k...', '..kgk....kgk..', '..kggk..kggk..', '...kgkkkkgk...', '...kPPPPPPk...', '..kPPPPPPPPk..', '.kPPkkkkkkPPk.', '.kPkkkkkkkkPk.', '.kPkdokkodkPk.', '.kPkkkkkkkkPk.', '.kPkkwkkwkkPk.', '.kPPkkwwkkPPk.', 'kPPpPkkkkPpPPk', 'kPpPPPPPPPPpPk', 'kPpppPPPPpppPk', 'kkkkkkkkkkkkkk'];
  const MENTOR_B = MENTOR.map((r, i) => i === 8 ? '.kPkSSkkSSkPk.' : r);
  const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function paintRows(rows, flip) {
    const h = rows.length, w = Math.max(...rows.map(r => r.length)), c = mkC(w, h), x = c.getContext('2d');
    rows.forEach((row, y) => { for (let i = 0; i < row.length; i++) { const col = PAL[row[i]]; if (col) { x.fillStyle = col; x.fillRect(flip ? w - 1 - i : i, y, 1, 1); } } });
    return c;
  }
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    SPR = {};
    for (const k in ART) {
      const [body, la, lb] = ART[k];
      const fa = la ? body.concat([la]) : body, fb = lb ? body.concat([lb]) : body;
      SPR[k] = { a: paintRows(fa), b: paintRows(fb), af: paintRows(fa, true), bf: paintRows(fb, true) };
    }
    SPR.mentor = [paintRows(MENTOR), paintRows(MENTOR_B)];
    // a soft round light (white centre, fading out): stamped with destination-out to cut light out of the dark
    const L = mkC(64, 64), lx = L.getContext('2d'), g = lx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    lx.fillStyle = g; lx.fillRect(0, 0, 64, 64); SPR.light = L;
    const Wm = mkC(64, 64), wx = Wm.getContext('2d'), g2 = wx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g2.addColorStop(0, 'rgba(255,170,60,.55)'); g2.addColorStop(1, 'rgba(255,120,20,0)');
    wx.fillStyle = g2; wx.fillRect(0, 0, 64, 64); SPR.warm = Wm;
    return SPR;
  }

  // ---- tiles (16x16, a few variants each, built once)
  let TILES = null;
  function tiles() {
    if (TILES) return TILES;
    TILES = {};
    let seed = 12345;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const make = fn => { const c = mkC(TS, TS), x = c.getContext('2d'); fn(x); return c; };
    const dot = (x, cx, cy, col, w, h) => { x.fillStyle = col; x.fillRect(cx, cy, w || 1, h || 1); };
    const bevel = (x, hi, lo) => { dot(x, 0, 0, hi, TS, 1); dot(x, 0, 0, hi, 1, TS); dot(x, 0, TS - 1, lo, TS, 1); dot(x, TS - 1, 0, lo, 1, TS); };
    const speck = (x, n, cols) => { for (let i = 0; i < n; i++) dot(x, Math.floor(r() * TS), Math.floor(r() * TS), cols[Math.floor(r() * cols.length)], r() < 0.3 ? 2 : 1, 1); };
    const earth = x => { dot(x, 0, 0, '#6b4a2b', TS, TS); speck(x, 34, ['#5a3d22', '#7d5733', '#4e341c', '#86603a']); bevel(x, '#8a6440', '#3e2a16'); };
    TILES[EARTH] = [0, 1, 2, 3].map(() => make(earth));
    TILES[ROCK] = [0, 1, 2, 3].map(() => make(x => {
      dot(x, 0, 0, '#4b4b57', TS, TS); speck(x, 26, ['#3a3a45', '#5c5c6a', '#6c6c7c']);
      for (let k = 0; k < 2; k++) { let cx = Math.floor(r() * TS), cy = Math.floor(r() * 4); for (let s = 0; s < 9; s++) { dot(x, cx, cy, '#24242c'); cy++; cx += r() < 0.5 ? -1 : 1; if (cx < 0 || cx >= TS) break; } }
      bevel(x, '#73737f', '#26262e');
    }));
    TILES[GOLD] = [0, 1, 2].map(() => make(x => {
      earth(x);
      for (let k = 0; k < 6; k++) { const cx = 1 + Math.floor(r() * 12), cy = 1 + Math.floor(r() * 12); dot(x, cx, cy, '#ffd400', 2, 2); dot(x, cx + 2, cy + 1, '#a07000', 1, 2); dot(x, cx, cy + 2, '#a07000', 2, 1); dot(x, cx, cy, '#fff6a0'); }
    }));
    TILES[GEM] = [0, 1].map(() => make(x => {
      dot(x, 0, 0, '#241a3a', TS, TS); speck(x, 14, ['#1a1028', '#34264e']);
      for (let k = 0; k < 4; k++) { const cx = 2 + Math.floor(r() * 10), cy = 2 + Math.floor(r() * 9), c1 = k % 2 ? '#60f0ff' : '#ff70f0', c2 = k % 2 ? '#1a8aa0' : '#a01a9a'; dot(x, cx + 1, cy, c1); dot(x, cx, cy + 1, c1, 3, 2); dot(x, cx + 1, cy + 3, c2); dot(x, cx + 2, cy + 1, c2, 1, 2); dot(x, cx, cy + 1, '#fff'); }
      bevel(x, '#4a3a6a', '#120a1e');
    }));
    TILES[WALL] = [0, 1].map(v => make(x => {
      dot(x, 0, 0, '#2e1410', TS, TS);
      for (let row = 0; row < 4; row++) { const off = (row + v) % 2 ? 4 : 0; for (let bx = -8 + off; bx < TS; bx += 8) dot(x, bx + 1, row * 4 + 1, r() < 0.5 ? '#8a3c2c' : '#7a3424', 7, 3); }
      speck(x, 8, ['#9a4a34', '#5a2218']); bevel(x, '#a85a40', '#1e0a08');
    }));
    TILES[DIRT] = [0, 1, 2].map(() => make(x => { dot(x, 0, 0, '#4e3d2c', TS, TS); speck(x, 22, ['#5e4a36', '#3e3020', '#6a5640', '#463626']); }));
    TILES[CLAIM] = [0, 0, 0, 1, 0, 0, 2].map(v => make(x => {
      for (let q = 0; q < 4; q++) dot(x, (q % 2) * 8, (q >> 1) * 8, (q === 0 || q === 3) ? '#701c1c' : '#5c1616', 8, 8);
      dot(x, 0, 0, '#2a0a0a', TS, 1); dot(x, 0, 8, '#2a0a0a', TS, 1); dot(x, 0, 0, '#2a0a0a', 1, TS); dot(x, 8, 0, '#2a0a0a', 1, TS);
      dot(x, 1, 1, '#8a2a24', 6, 1); dot(x, 9, 9, '#8a2a24', 6, 1);
      if (v === 1) { dot(x, 11, 3, '#c09030', 2, 2); }
      if (v === 2) { // the Keepa's emblem: a little horned face, inlaid in gold
        dot(x, 4, 4, '#3a1008', 8, 8); dot(x, 5, 5, '#c09030', 6, 6); dot(x, 4, 3, '#c09030', 1, 2); dot(x, 11, 3, '#c09030', 1, 2);
        dot(x, 6, 7, '#3a1008', 1, 1); dot(x, 9, 7, '#3a1008', 1, 1); dot(x, 6, 9, '#3a1008', 4, 1); dot(x, 5, 5, '#f0d060', 2, 1);
      }
    }));
    TILES[HFLOOR] = [0, 1].map(v => make(x => {
      for (let q = 0; q < 4; q++) dot(x, (q % 2) * 8, (q >> 1) * 8, (q === 0 || q === 3) ? '#c8c4b0' : '#b4b09c', 8, 8);
      dot(x, 0, 0, '#8a8670', TS, 1); dot(x, 0, 8, '#8a8670', TS, 1); dot(x, 0, 0, '#8a8670', 1, TS); dot(x, 8, 0, '#8a8670', 1, TS);
      if (v) dot(x, 3, 11, '#3a6ad8', 2, 2);
    }));
    TILES[LAVA] = [0, 1, 2, 3].map(f => make(x => {
      dot(x, 0, 0, '#d84a00', TS, TS);
      for (let k = 0; k < 20; k++) { const a = (k * 37 + f * 5) % TS, b = (k * 53 + f * 3) % TS; dot(x, a, b, k % 3 ? '#ff9a10' : '#ffd040', 2, 1); }
      for (let k = 0; k < 6; k++) dot(x, (k * 41 + f * 7) % TS, (k * 29 + f * 11) % TS, '#7a1a00', 3, 2);
    }));
    TILES[WATER] = [0, 1].map(f => make(x => {
      dot(x, 0, 0, '#1a3a8a', TS, TS);
      for (let k = 0; k < 5; k++) dot(x, (k * 5 + f * 3) % 13, k * 3 + 1, '#4a7ad8', 3, 1);
      for (let k = 0; k < 3; k++) dot(x, (k * 7 + 8 - f * 3 + TS) % 13, k * 5 + 2, '#8ab0ff', 2, 1);
    }));
    TILES.face = { [ROCK]: ['#2f2f3a', '#45454f'], [EARTH]: ['#4a321c', '#5e4228'], [GOLD]: ['#4a321c', '#5e4228'], [GEM]: ['#1a1228', '#2a2040'], [WALL]: ['#4e1c14', '#6e2c20'] };
    return TILES;
  }
  // 3x5 pixel font for floaters
  const FONT = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
    '+': '000010111010000', '-': '000000111000000', '!': '010010010000010', 'Z': '111001010100111', 'L': '100100100100111', 'V': '101101101101010', 'U': '101101101101111', 'P': '111101111100100', ' ': '000000000000000', '?': '111001011000010',
    A: '010101111101101', S: '111100111001111', E: '111100111100111', R: '110101110101101', O: '111101101101111', K: '101101110101101', W: '101101111111101', H: '101101111101101', I: '111010010010111', N: '110101101101101',
    T: '111010010010010', C: '111100100100111', G: '111100101101111', D: '110101101101110', M: '101111111101101', B: '110101110101110', Y: '101101010010010', F: '111100110100100', X: '101101010101101', '/': '001001010100100' };
  function ptext(x, s, cx, cy, col) {
    s = String(s); const w = s.length * 4 - 1; let ox = Math.round(cx - w / 2); cy = Math.round(cy);
    for (const pass of [0, 1]) {
      x.fillStyle = pass ? col : '#000';
      for (let i = 0; i < s.length; i++) {
        const g = FONT[s[i]] || FONT[s[i].toUpperCase()] || FONT['?'];
        for (let b = 0; b < 15; b++) if (g[b] === '1') { const px = ox + i * 4 + (b % 3), py = cy + Math.floor(b / 3); if (pass) x.fillRect(px, py, 1, 1); else x.fillRect(px - 1, py - 1, 3, 3); }
      }
    }
  }

  // ---- original music (A minor, slow and sneaky)
  if (window.Sound && Sound.addTune && !(Sound.tunes && Sound.tunes().includes('keepa'))) Sound.addTune('keepa', { step: 0.2, hats: false,
    lead: [69, 0, 72, 0, 76, -1, 74, 72, 71, 0, 74, 0, 77, -1, 76, 74, 72, 0, 76, 0, 81, -1, 79, 77, 76, -1, 74, -1, 72, -1, 0, 0,
      69, 72, 69, 72, 71, 74, 71, 74, 72, 76, 72, 76, 74, 77, 74, 71, 69, 0, 64, 0, 69, -1, 72, -1, 71, -1, 68, -1, 69, -1, 0, 0],
    bass: [45, 45, 52, 52, 43, 43, 50, 50, 41, 41, 48, 48, 40, 40, 47, 40, 45, 45, 52, 52, 43, 43, 50, 50, 41, 41, 40, 40, 45, 45, 45, 45] });

  // ================================================================ map generation
  function genMap(L) {
    let seed = L.seed;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const t = new Uint8Array(N).fill(EARTH), gold = new Int32Array(N);
    const at = (x, y) => y * W + x, inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const blob = (cx, cy, rad, v) => { for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) if (inb(x, y) && (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad + r() * 2) t[at(x, y)] = v; };
    const far = (x, y, d) => [L.heart, L.portal, L.gate].every(([a, b]) => Math.abs(a - x) + Math.abs(b - y) > d);
    for (let k = 0; k < 16; k++) { const x = 2 + Math.floor(r() * (W - 4)), y = 2 + Math.floor(r() * (H - 4)); if (far(x, y, 7)) blob(x, y, 1 + Math.floor(r() * 2), ROCK); }
    for (let k = 0; k < 3; k++) { const x = 3 + Math.floor(r() * (W - 6)), y = 3 + Math.floor(r() * (H - 6)); if (far(x, y, 8)) blob(x, y, 1, LAVA); }
    { const x = 3 + Math.floor(r() * (W - 6)), y = 3 + Math.floor(r() * (H - 6)); if (far(x, y, 8)) blob(x, y, 2, WATER); }
    // gold veins: some close to the heart, some further out
    const vein = (x, y, len) => { for (let s = 0; s < len; s++) { if (inb(x, y) && t[at(x, y)] === EARTH) { t[at(x, y)] = GOLD; gold[at(x, y)] = 300 + Math.floor(r() * 5) * 50; } if (r() < 0.5) x += r() < 0.5 ? -1 : 1; else y += r() < 0.5 ? -1 : 1; } };
    vein(L.heart[0] + 4, L.heart[1] - 3, 6); vein(L.heart[0] - 2, L.heart[1] + 5, 4);
    for (let k = 0; k < 7; k++) vein(3 + Math.floor(r() * (W - 6)), 3 + Math.floor(r() * (H - 6)), 4 + Math.floor(r() * 5));
    for (let x = 0; x < W; x++) { t[at(x, 0)] = t[at(x, 1)] = t[at(x, H - 1)] = t[at(x, H - 2)] = ROCK; }
    for (let y = 0; y < H; y++) { t[at(0, y)] = t[at(1, y)] = t[at(W - 1, y)] = t[at(W - 2, y)] = ROCK; }
    // gem seam in a far pocket
    { let gx = 4 + Math.floor(r() * (W - 8)), gy = 4 + Math.floor(r() * (H - 8)); for (let k = 0; k < 40 && !far(gx, gy, 9); k++) { gx = 4 + Math.floor(r() * (W - 8)); gy = 4 + Math.floor(r() * (H - 8)); } t[at(gx, gy)] = GEM; }
    // the heart room
    const [hx, hy] = L.heart;
    for (let y = hy - 3; y <= hy + 3; y++) for (let x = hx - 3; x <= hx + 3; x++) t[at(x, y)] = CLAIM;
    for (let y = hy - 1; y <= hy + 1; y++) for (let x = hx - 1; x <= hx + 1; x++) t[at(x, y)] = HEART;
    // the portal in a little cave
    const [px, py] = L.portal;
    for (let y = py - 2; y <= py + 2; y++) for (let x = px - 2; x <= px + 2; x++) if (inb(x, y)) t[at(x, y)] = DIRT;
    for (let y = py - 1; y <= py + 1; y++) for (let x = px - 1; x <= px + 1; x++) t[at(x, y)] = PORTAL;
    // the hero gate and their nice tidy floor
    const [gx, gy] = L.gate;
    for (let y = gy - 3; y <= gy + 3; y++) for (let x = gx - 3; x <= gx + 3; x++) if (inb(x, y) && x > 1 && y > 1 && x < W - 2 && y < H - 2) t[at(x, y)] = HFLOOR;
    for (let y = gy - 1; y <= gy + 1; y++) for (let x = gx - 1; x <= gx + 1; x++) t[at(x, y)] = GATE;
    // a couple of dug-out caves with gold
    for (let k = 0; k < 2; k++) { const x = 5 + Math.floor(r() * (W - 10)), y = 4 + Math.floor(r() * (H - 8)); if (far(x, y, 7)) { blob(x, y, 1, DIRT); vein(x + 2, y, 3); } }
    return { t, gold };
  }

  // ================================================================ JackNet Dungeons (the Showcase, kind 'keepa')
  // These live outside the game window so a Showcase window opened from an old game window still works.
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[c]);
  const storeGet = (k, d) => { try { return window.Apps && Apps.store ? Apps.store.get('jhp_discs_keepa_' + k, d) : d; } catch (e) { return d; } };
  // what raiders have done to a dungeon (the showcase keeps res: { w, l }: raiders' wins and losses)
  const resTxt = r => { const w = r ? r.w | 0 : 0, l = r ? r.l | 0 : 0; return w + l ? `Raided ${w + l} time${w + l === 1 ? '' : 's'}, held ${l}` : 'Never raided'; };
  const myNick = () => (window.Net && Net.me && Net.me.nick) || 'Keepa';
  const defName = () => (myNick() + '\'s Lair').slice(0, 40);
  // a serial() save -> the compact layout other people download (tiles, rooms, traps, creatures, heart)
  function upData(o) {
    if (!o || !o.t || !LV[o.lvl]) return null;
    const L = LV[o.lvl], tb = o.tb || '', trap = (o.trap || '').split('').map((c, i) => (tb.charCodeAt(i) - 48 === 1 ? c : '0')).join('');
    const ents = (o.ents || []).filter(e => (e.k === 'imp' || BEASTS.includes(e.k)) && !e.held).slice(0, 60).map(e => [e.k, +(+e.x).toFixed(1), +(+e.y).toFixed(1), e.lvl | 0 || 1]);
    let rooms = 0, traps = 0, doors = 0; for (let i = 0; i < N; i++) { if (o.room && o.room.charCodeAt(i) > 48) rooms++; const k = trap.charCodeAt(i) - 48; if (k > 0) { if (isDoor(k)) doors++; else traps++; } }
    const beasts = ents.filter(e => e[0] !== 'imp').length;
    return { data: { v: 2, src: o.lvl, t: o.t.replace(/[\s\S]/g, c => String.fromCharCode(c.charCodeAt(0) + 49)), room: o.room || '', trap, ents, heart: L.heart, gate: L.gate, portal: L.portal, po: o.portal ? 1 : 0, gold: o.g | 0, waves: o.cleared | 0 },
      stats: { realm: L.n, beasts, rooms, traps, doors, imps: ents.length - beasts, waves: o.cleared | 0 } };
  }
  function mineNow() {
    const g = D.LIVE.keepa;
    if (g && !g.closed && g._keepaMine) { const m = g._keepaMine(); if (m !== undefined) return m; }
    const o = storeGet('auto', null) || storeGet('last', null) || storeGet('slot1', null);
    const u = upData(o); if (!u) return null;
    return { title: storeGet('opt', {}).dname || defName(), data: u.data, stats: u.stats };
  }
  function onVisit(full) {
    const g = D.LIVE.keepa;
    if (g && !g.closed && g._keepaVisit) { try { g.w.restore(); g.w.focus(); } catch (e) {} g._keepaVisit(full); }
    else D.launch('keepa', { visit: full });
  }
  function openShowcase() {
    if (!D.showcase) return;
    return D.showcase('keepa', { title: 'JackNet Dungeons', sub: 'Dungeons built by JackNet Keepas. Take a tour, or lead the heroes in and raid one!', what: 'a dungeon', icon: D.GAMES.keepa && D.GAMES.keepa.icon, c1: '#5a0a3a', upLabel: 'Upload my dungeon',
      stats: e => { const t = e.stats || {}; return `${t.beasts | 0} beast${(t.beasts | 0) === 1 ? '' : 's'} · ${t.rooms | 0} room tiles · ${t.traps | 0} traps · ${t.doors | 0} doors${t.waves ? ` · survived ${t.waves | 0} waves` : ''} · <i>${esc(t.realm || '')}</i><br><b>${esc(resTxt(e.res))}</b>`; },
      visit: onVisit, mine: mineNow, noMine: 'Start (or load) a dungeon in Dungeon Keepa 2 first, then upload it.' });
  }

  // ================================================================ the game
  D.mod('keepa', (G, arg) => {
    const SP = sprites(), TL = tiles();
    G.css('dg-css-keepa', `
.dg-keepa-root{position:absolute;inset:0;display:flex;background:#100808;color:#e8d8b0;font:11px/1.3 Tahoma,"MS Sans Serif",sans-serif}
.dg-keepa-root.phone{flex-direction:column}
.dg-keepa-map{position:relative;flex:1;min-width:0;min-height:0;overflow:hidden;background:#000;cursor:crosshair}
.dg-keepa-map.nocur{cursor:none}
.dg-keepa-cv{position:absolute;left:0;top:0;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none}
.dg-keepa-side{width:188px;flex:none;background:linear-gradient(#3a2418,#1a0e08);border-left:3px ridge #7a5a38;display:flex;flex-direction:column;gap:4px;padding:5px;overflow-y:auto;overflow-x:hidden;box-sizing:border-box}
.dg-keepa-gold{font:22px/1 Impact,"Arial Black",sans-serif;color:#ffd400;text-shadow:2px 2px 0 #000;text-align:center;background:#000;border:2px inset #6a4a30;padding:4px 2px 3px;letter-spacing:1px}
.dg-keepa-gold small{display:block;font:bold 8px Tahoma,sans-serif;color:#a08040;letter-spacing:1px;text-shadow:none}
.dg-keepa-stats{background:#000;border:2px inset #6a4a30;padding:3px 5px;font:10px/1.4 Tahoma,sans-serif;color:#d8c090}
.dg-keepa-stats b{color:#ff6a3a}.dg-keepa-stats .goal{color:#ffd890;border-bottom:1px dotted #5a3a20;padding-bottom:2px;margin-bottom:2px}
.dg-keepa-stats .warn{color:#fff;background:#a01010;padding:0 3px;animation:dgkblink .5s steps(2) infinite}
@keyframes dgkblink{50%{background:#500}}
.dg-keepa-hbar{height:6px;background:#300;border:1px solid #000;margin-top:2px}.dg-keepa-hbar i{display:block;height:100%;background:linear-gradient(#ff6a6a,#a00000)}
.dg-keepa-hbar.mf i{background:linear-gradient(#c0d0e0,#5a6a7a)}
.dg-keepa-tabs{display:flex;gap:1px}
.dg-keepa-tabs button{flex:1;min-width:0;font:bold 9px Tahoma,sans-serif;color:#e8d0a0;background:linear-gradient(#5a4434,#3a2a1e);border:2px outset #8a7058;padding:3px 0;cursor:pointer;white-space:nowrap;overflow:hidden}
.dg-keepa-tabs button.on{border-style:inset;background:#2a1a10;color:#ffd400}
.dg-keepa-grid{display:grid;grid-template-columns:1fr;gap:3px}
.dg-keepa-btn{position:relative;display:flex;align-items:center;gap:5px;min-height:30px;padding:2px 4px;text-align:left;font:bold 11px Tahoma,sans-serif;color:#ffe9b0;background:linear-gradient(#7a6650,#4a3a2c);border:2px outset #a08a70;cursor:pointer;line-height:1.1}
.dg-keepa-btn.on{border-style:inset;background:linear-gradient(#2a1a10,#4a3424);color:#fff;box-shadow:inset 0 0 0 1px #ffd400}
.dg-keepa-btn:disabled{opacity:.45;cursor:default}
.dg-keepa-btn canvas{width:24px;height:24px;image-rendering:pixelated;flex:none}
.dg-keepa-btn small{display:block;font:9px Tahoma,sans-serif;color:#d0b080}
.dg-keepa-btn kbd{position:absolute;right:3px;top:2px;font:9px Tahoma;color:#a08060}
.dg-keepa-btn .cd{position:absolute;left:0;bottom:0;height:3px;background:#ffd400}
.dg-keepa-hint{font:10px/1.3 Tahoma,sans-serif;color:#c8b088}
.dg-keepa-mini{width:176px;height:132px;image-rendering:pixelated;border:2px inset #6a4a30;background:#000;flex:none;cursor:pointer;touch-action:none;box-sizing:border-box}
.dg-keepa-list{display:flex;flex-direction:column;gap:2px}
.dg-keepa-li{display:flex;gap:4px;align-items:center;background:#000;border:1px solid #4a3020;padding:2px 3px;cursor:pointer;color:#e8d8b0;font:10px Tahoma,sans-serif;text-align:left}
.dg-keepa-li canvas{width:20px;height:22px;image-rendering:pixelated;flex:none}
.dg-keepa-li b{color:#ffd400}.dg-keepa-li .ang{color:#ff4a3a}.dg-keepa-li .ok{color:#7ad85a}.dg-keepa-li .nd{color:#ff9a5a}
.dg-keepa-li i{display:block;height:3px;background:#3ae03a;margin-top:1px;font-style:normal}
.dg-keepa-say{position:absolute;left:6px;bottom:6px;display:flex;gap:6px;align-items:flex-start;max-width:min(420px,calc(100% - 20px));background:rgba(24,0,0,.88);border:2px solid #9a2a1a;box-shadow:2px 2px 0 #000;color:#ffd8a0;padding:4px 8px 4px 4px;font:bold 12px/1.3 Georgia,"Times New Roman",serif;pointer-events:none;opacity:0;transform:translateY(6px);transition:opacity .3s,transform .3s;z-index:2}
.dg-keepa-say.on{opacity:1;transform:none}
.dg-keepa-say canvas{flex:none;width:28px;height:32px;image-rendering:pixelated;border:1px solid #b08040;background:#000}
.dg-keepa-say i{display:block;color:#ff7a4a;font:bold 9px Tahoma,sans-serif;letter-spacing:2px;font-style:normal}
.dg-keepa-tut{position:absolute;left:6px;top:6px;z-index:3;display:flex;gap:7px;max-width:min(440px,calc(100% - 20px));background:linear-gradient(#2e0e08,#140404);border:3px ridge #b08040;box-shadow:3px 3px 0 #000;padding:6px 8px 6px 6px;color:#ffe6c0;font:12px/1.35 Georgia,"Times New Roman",serif;box-sizing:border-box}
.dg-keepa-tut canvas{flex:none;width:42px;height:48px;image-rendering:pixelated;border:2px solid #b08040;background:#000;box-shadow:inset 0 0 6px #600}
.dg-keepa-tut b.who{display:block;font:bold 9px Tahoma,sans-serif;letter-spacing:2px;color:#ff7a4a}
.dg-keepa-tut .tx b{color:#ffd400}
.dg-keepa-tut .dg-keepa-tbar{display:flex;gap:4px;margin-top:5px;align-items:center;flex-wrap:wrap}
.dg-keepa-tut .dg-keepa-tbar button{font:bold 10px Tahoma,sans-serif;padding:2px 8px;min-height:24px;color:#ffe9b0;background:linear-gradient(#7a6650,#4a3a2c);border:2px outset #a08a70;cursor:pointer}
.dg-keepa-tut .dg-keepa-tbar small{flex:1;color:#b09070;font:10px Tahoma,sans-serif}
.dg-keepa-tut .pr{display:flex;gap:2px;margin-top:4px}.dg-keepa-tut .pr i{flex:1;height:3px;background:#3a1a10}.dg-keepa-tut .pr i.on{background:#ffd400}
.dg-keepa-glow{animation:dgkglow .8s infinite alternate}
@keyframes dgkglow{from{box-shadow:0 0 0 2px #ffd400}to{box-shadow:0 0 5px 4px #ff8a00}}
.dg-keepa-banner{position:absolute;left:0;right:0;top:38%;text-align:center;font:34px/1 Impact,"Arial Black",sans-serif;color:#ff3a1a;filter:drop-shadow(2px 2px 0 #000) drop-shadow(-1px -1px 0 #000);pointer-events:none;opacity:0;transition:opacity .4s,transform .4s;transform:scale(.8);letter-spacing:2px;z-index:2}
.dg-keepa-banner.on{opacity:1;transform:none}
.dg-keepa-banner small{display:block;font:bold 13px Georgia,serif;color:#ffd890;letter-spacing:0;margin-top:4px}
.dg-keepa-alarm{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 70px 10px rgba(255,0,0,.7);opacity:0;transition:opacity .3s;z-index:1}
.dg-keepa-alarm.on{opacity:1;animation:dgkpulse .9s infinite alternate}
@keyframes dgkpulse{from{opacity:.35}to{opacity:1}}
.dg-keepa-strip{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:linear-gradient(#3a0a2a,#1a0414);border-bottom:2px ridge #b08040;padding:3px 6px;font:bold 11px Tahoma,sans-serif;color:#ffd890}
.dg-keepa-strip .t{flex:1;min-width:120px}.dg-keepa-strip .t small{display:block;font:10px Tahoma;color:#c8a080}
.dg-keepa-strip .dsc-rate{background:#e8e0d0;color:#000;padding:0 4px;border:1px solid #000}
.dg-keepa-strip button{font:bold 11px Tahoma;min-height:26px;padding:2px 10px;color:#ffe9b0;background:linear-gradient(#8a3a20,#4a1a0c);border:2px outset #c08060;cursor:pointer}
.dg-keepa-ov{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;flex-direction:column;background:rgba(0,0,0,.72);padding:10px;box-sizing:border-box}
.dg-keepa-title{background:#000;overflow:hidden}
.dg-keepa-tcv{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;opacity:.75}
.dg-keepa-logo{position:relative;text-align:center;margin-bottom:10px}
.dg-keepa-logo .l1{font:28px/1 Impact,"Arial Black",sans-serif;color:#c8c0b0;letter-spacing:10px;filter:drop-shadow(2px 2px 0 #000)}
.dg-keepa-logo .l2{font:76px/0.95 Impact,"Arial Black",sans-serif;letter-spacing:3px;color:transparent;background:linear-gradient(#fff2a0,#ffb000 35%,#ff4a00 60%,#8a0000);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(3px 3px 0 #000) drop-shadow(-1px -1px 0 #3a0000)}
.dg-keepa-logo .l2 span{color:transparent;background:linear-gradient(#ffffff,#ffd400 50%,#a07000);-webkit-background-clip:text;background-clip:text;margin-left:8px}
.dg-keepa-logo .l3{font:italic bold 12px Georgia,serif;color:#ffb080;margin-top:6px;filter:drop-shadow(1px 1px 0 #000)}
.dg-keepa-mbtn{position:relative;width:250px;max-width:80vw;margin:3px 0;padding:6px 0;font:18px/1 Impact,"Arial Black",sans-serif;letter-spacing:2px;color:#ffd890;background:linear-gradient(#6a5240,#3a281c);border:3px outset #9a8064;cursor:pointer;text-shadow:2px 2px 0 #000}
.dg-keepa-mbtn:hover,.dg-keepa-mbtn:focus{color:#fff;background:linear-gradient(#8a3a20,#4a1a0c);outline:none}
.dg-keepa-mbtn:disabled{opacity:.5}
.dg-keepa-mbtn.net{background:linear-gradient(#3a2a6a,#1a1040);border-color:#8a7ac0}
.dg-keepa-foot{position:absolute;bottom:6px;left:0;right:0;text-align:center;font:10px Tahoma,sans-serif;color:#8a7a6a}
.dg-keepa-box{position:relative;background:linear-gradient(#2e1c10,#140a06);border:4px ridge #8a6a40;padding:12px 14px;max-width:min(480px,96%);max-height:94%;overflow:auto;color:#ffe8c0;font:12px/1.45 Georgia,"Times New Roman",serif;box-shadow:4px 4px 0 #000;box-sizing:border-box}
.dg-keepa-box.wide{max-width:min(680px,98%)}
.dg-keepa-box h2{font:24px/1.05 Impact,"Arial Black",sans-serif;color:#ff6a1a;margin:0 0 8px;letter-spacing:1px;text-shadow:2px 2px 0 #000}
.dg-keepa-box h3{font:bold 13px Tahoma,sans-serif;color:#ffd400;margin:8px 0 3px}
.dg-keepa-box p{margin:0 0 8px;white-space:pre-line}
.dg-keepa-box .row{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px}
.dg-keepa-box .dg-keepa-mbtn{width:auto;padding:6px 14px;font-size:15px}
.dg-keepa-box table{width:100%;border-collapse:collapse;font:11px Tahoma,sans-serif}
.dg-keepa-box td{padding:2px 4px;border-bottom:1px dotted #5a3a20}
.dg-keepa-box kbd{display:inline-block;min-width:14px;text-align:center;font:bold 10px Tahoma;color:#000;background:#d8d0c0;border:1px outset #fff;padding:0 3px}
.dg-keepa-rmap{width:100%;max-width:640px;image-rendering:pixelated;border:3px ridge #8a6a40;cursor:pointer;display:block;margin:0 auto 6px;touch-action:manipulation}
.dg-keepa-rl{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px}
.dg-keepa-lvl{display:flex;gap:6px;align-items:center;width:100%;margin:0;padding:4px 6px;text-align:left;background:#000;border:2px outset #7a5a38;color:#ffe8c0;font:11px/1.25 Georgia,serif;cursor:pointer;box-sizing:border-box}
.dg-keepa-lvl b{font:15px Impact,"Arial Black",sans-serif;color:#ffd400;letter-spacing:1px;font-weight:normal}
.dg-keepa-lvl:disabled{opacity:.5;cursor:default}
.dg-keepa-lvl.won{border-color:#a01a1a}.dg-keepa-lvl.won b{color:#ff6a3a}
.dg-keepa-lvl .no{font:bold 22px Impact,sans-serif;color:#ff4a1a;width:24px;text-align:center;flex:none}
.dg-keepa-seg{display:flex;gap:2px;justify-content:center;margin:4px 0}
.dg-keepa-seg button{font:bold 11px Tahoma;padding:3px 12px;min-height:26px;color:#e8d0a0;background:linear-gradient(#5a4434,#3a2a1e);border:2px outset #8a7058;cursor:pointer}
.dg-keepa-seg button.on{border-style:inset;background:#2a1a10;color:#ffd400}
.dg-keepa-slot{display:flex;gap:6px;align-items:center;background:#000;border:1px solid #5a3a20;padding:4px 6px;margin:3px 0}
.dg-keepa-slot span{flex:1;font:11px Tahoma,sans-serif}
.dg-keepa-slot button{font:bold 11px Tahoma,sans-serif;padding:3px 8px}
.dg-keepa-party{display:grid;grid-template-columns:28px 1fr auto auto auto;gap:3px 6px;align-items:center;font:11px Tahoma,sans-serif}
.dg-keepa-party canvas{width:24px;height:26px;image-rendering:pixelated}
.dg-keepa-party button{font:bold 13px Tahoma;min-width:30px;min-height:28px}
.dg-keepa-party b{color:#ffd400}
.dg-keepa-val{font:bold 16px Impact,sans-serif;color:#ffd400;text-align:center;margin:6px 0;letter-spacing:1px}
.dg-keepa-top{display:flex;gap:4px;align-items:center;background:linear-gradient(#3a2418,#1a0e08);border-bottom:2px ridge #7a5a38;padding:2px 4px;flex:none;font:bold 11px Tahoma,sans-serif}
.dg-keepa-top .dg-keepa-gold{font-size:16px;padding:2px 5px;min-width:58px}
.dg-keepa-top .dg-keepa-gold small{font-size:7px}
.dg-keepa-top .dg-keepa-stats{flex:1;font-size:10px;line-height:1.25;padding:2px 4px;min-width:0}
.dg-keepa-top button{flex:none;min-width:38px;min-height:32px;justify-content:center}
.dg-keepa-bot{flex:none;background:linear-gradient(#3a2418,#1a0e08);border-top:2px ridge #7a5a38;padding:3px 4px;display:flex;flex-direction:column;gap:3px}
.dg-keepa-root.phone .dg-keepa-grid{grid-template-columns:repeat(4,1fr)}
.dg-keepa-root.phone .dg-keepa-btn{flex-direction:column;justify-content:center;text-align:center;font-size:10px;gap:0;min-height:40px;padding:1px}
.dg-keepa-root.phone .dg-keepa-btn canvas{width:20px;height:20px}
.dg-keepa-root.phone .dg-keepa-btn small{font-size:8px}
.dg-keepa-root.phone .dg-keepa-btn kbd{display:none}
.dg-keepa-root.phone .dg-keepa-tabs button{font-size:10px;padding:4px 0}
.dg-keepa-root.phone .dg-keepa-list{max-height:126px;overflow-y:auto}
.dg-keepa-root.phone .dg-keepa-mini{position:absolute;right:4px;top:4px;width:84px;height:63px;z-index:1;opacity:.92}
.dg-keepa-root.phone .dg-keepa-hint{font-size:9px}
.dg-keepa-root.phone .dg-keepa-logo .l2{font-size:52px}
.dg-keepa-root.phone .dg-keepa-logo .l1{font-size:20px;letter-spacing:6px}
.dg-keepa-root.phone .dg-keepa-say{font-size:10.5px;max-width:calc(100% - 12px);left:4px;bottom:4px}
.dg-keepa-root.phone .dg-keepa-tut{font-size:10.5px;max-width:calc(100% - 96px);left:4px;top:4px;padding:4px}
.dg-keepa-root.phone .dg-keepa-tut canvas{width:28px;height:32px}
.dg-keepa-root.phone .dg-keepa-strip{font-size:10px}
.dg-keepa-root.phone .dg-keepa-mbtn{width:220px}
`);

    // ---------------------------------------------------------------- layout
    const host = G.host;
    const phone = G.phone || host.clientWidth < 560;
    const root = document.createElement('div'); root.className = 'dg-keepa-root' + (phone ? ' phone' : '');
    host.appendChild(root);
    const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    const map = el('div', 'dg-keepa-map');
    const cv = el('canvas', 'dg-keepa-cv'); map.appendChild(cv);
    const ctx = cv.getContext('2d');
    const lc = mkC(64, 64), lctx = lc.getContext('2d'); // the light map
    const alarmEl = el('div', 'dg-keepa-alarm'); map.appendChild(alarmEl);
    const sayEl = el('div', 'dg-keepa-say'); map.appendChild(sayEl);
    const sayCv = mkC(14, 16); sayEl.appendChild(sayCv); const sayTx = el('div'); sayEl.appendChild(sayTx);
    const tutEl = el('div', 'dg-keepa-tut'); tutEl.style.display = 'none'; map.appendChild(tutEl);
    const stripEl = el('div', 'dg-keepa-strip'); stripEl.style.display = 'none'; map.appendChild(stripEl);
    const bannerEl = el('div', 'dg-keepa-banner'); map.appendChild(bannerEl);
    const mini = el('canvas', 'dg-keepa-mini'); mini.width = W; mini.height = H; mini.title = 'Map of the realm: click or drag to look around';
    const mctx = mini.getContext('2d');
    const goldEl = el('div', 'dg-keepa-gold', '0<small>GOLD</small>'); goldEl.title = 'Your gold. Imps dig it out of the walls. The number underneath is how much your Heart and Treasury can hold.';
    const statsEl = el('div', 'dg-keepa-stats');
    const tabsEl = el('div', 'dg-keepa-tabs');
    const gridEl = el('div', 'dg-keepa-grid');
    const hintEl = el('div', 'dg-keepa-hint');
    let pauseBtn = null;
    if (phone) {
      const top = el('div', 'dg-keepa-top'); top.append(goldEl, statsEl);
      pauseBtn = el('button', 'dg-keepa-btn', 'II'); pauseBtn.type = 'button'; pauseBtn.title = 'Pause (P)'; top.appendChild(pauseBtn);
      const bot = el('div', 'dg-keepa-bot'); bot.append(tabsEl, gridEl, hintEl);
      map.appendChild(mini);
      root.append(top, map, bot);
    } else {
      const side = el('div', 'dg-keepa-side'); side.append(goldEl, statsEl, tabsEl, gridEl, hintEl, mini);
      root.append(map, side);
    }

    // ---------------------------------------------------------------- state
    let S = null; // the running game (null on the title screen)
    let paused = false, speed = 1, tool = 'dig', tab = 'tools', zoom = 2, brush3 = phone;
    const opt = Object.assign({ music: true, tips: true, light: true, diff: 1, dname: '' }, G.load('opt', {}));
    const saveOpt = () => G.save('opt', opt);
    const cam = { x: 0, y: 0 };
    let scale = zoom, vw = 100, vh = 100;
    let nextId = 1, shakeT = 0;
    let visitStash = null; // your own game, kept safe while you visit somebody else's dungeon
    // pathfinding scratch
    const stampA = new Int32Array(N), prev = new Int16Array(N), qBuf = new Int16Array(N), dist = new Float32Array(N);
    let stamp = 1;
    const hI = new Int32Array(N * 6), hC = new Float32Array(N * 6); let hn = 0;
    const hpush = (i, c) => { let k = hn++; hI[k] = i; hC[k] = c; while (k > 0) { const p = (k - 1) >> 1; if (hC[p] <= hC[k]) break; const ti = hI[p], tc = hC[p]; hI[p] = hI[k]; hC[p] = hC[k]; hI[k] = ti; hC[k] = tc; k = p; } };
    const hpop = () => { const i = hI[0]; hn--; if (hn > 0) { hI[0] = hI[hn]; hC[0] = hC[hn]; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < hn && hC[a] < hC[m]) m = a; if (b < hn && hC[b] < hC[m]) m = b; if (m === k) break; const ti = hI[m], tc = hC[m]; hI[m] = hI[k]; hC[m] = hC[k]; hI[k] = ti; hC[k] = tc; k = m; } } return i; };

    // ---------------------------------------------------------------- helpers on state
    const tileAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? -1 : y * W + x;
    const tileOf = e => tileAt(Math.floor(e.x), Math.floor(e.y));
    const owned = i => { const t = S.t_[i]; return t === CLAIM || t === HEART || (t === PORTAL && S.portal); };
    const claimable = i => { const t = S.t_[i]; if (t !== DIRT && t !== HFLOOR) return false; const x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const n = tileAt(x + dx, y + dy); if (n >= 0 && owned(n)) return true; } return false; };
    const centre = c => ({ x: c[0] + 0.5, y: c[1] + 0.5 });
    const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const visiting = () => S && (S.mode === 'tour' || S.mode === 'raid');
    const playing = () => S && !S.done && (S.mode === 'realm' || S.mode === 'endless');
    const doorAt = i => S.trap[i] >= 4 && S.tb[i] === 1;

    function bfs(start, fn, max) {
      stamp++; let qh = 0, qt = 0; qBuf[qt++] = start; stampA[start] = stamp; prev[start] = -1;
      let n = 0;
      while (qh < qt && n < (max || N)) {
        const c = qBuf[qh++]; n++;
        if (fn(c)) return c;
        const x = c % W, y = (c / W) | 0;
        for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const nb = ny * W + nx; if (stampA[nb] === stamp || !isWalk(S.t_[nb])) continue; stampA[nb] = stamp; prev[nb] = c; qBuf[qt++] = nb; }
      }
      return -1;
    }
    const pathTo = (start, goal) => { const out = []; let c = goal; let guard = 0; while (c !== start && c >= 0 && guard++ < N) { out.push(c); c = prev[c]; } return out.reverse(); };
    const bfsPath = (start, goalFn, max) => { const g = bfs(start, goalFn, max); return g < 0 ? null : pathTo(start, g); };
    const inner = i => { const x = i % W, y = (i / W) | 0; return x >= 2 && y >= 2 && x < W - 2 && y < H - 2; };
    const digCost = (t, i) => isWalk(t) ? (t === WATER ? 2 : 1) + (doorAt(i) ? 1 + S.thp[i] / 30 : 0) : t === EARTH ? 5 : t === GOLD ? 6 : t === WALL ? 10 : t === ROCK && inner(i) ? 40 : Infinity;
    function digPath(start, goalFn) { // heroes: Dijkstra where earth costs extra (they dig through it) and doors cost by their strength
      stamp++; hn = 0; dist[start] = 0; stampA[start] = stamp; prev[start] = -1; hpush(start, 0);
      while (hn > 0) {
        const c = hpop(), dc = dist[c];
        if (goalFn(c)) return pathTo(start, c);
        const x = c % W, y = (c / W) | 0;
        for (const [dx, dy] of N4) {
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const nb = ny * W + nx, cost = digCost(S.t_[nb], nb); if (cost === Infinity) continue;
          const nd = dc + cost; if (stampA[nb] === stamp && dist[nb] <= nd) continue;
          stampA[nb] = stamp; dist[nb] = nd; prev[nb] = c; hpush(nb, nd);
        }
      }
      return null;
    }
    const adjTo = (i, set) => { const x = i % W, y = (i / W) | 0; for (const [dx, dy] of N4) { const n = tileAt(x + dx, y + dy); if (n >= 0 && set(n)) return true; } return false; };

    // ---------------------------------------------------------------- mentor, banner, sounds, floaters
    const mq = []; let mOn = null, mT = 0; const mCool = {};
    function mentor(text, key, cool, who) {
      if (key) { const now = S ? S.time : 0; if (mCool[key] != null && now - mCool[key] < (cool || 30)) return; mCool[key] = now; }
      if (mq.length > 2) mq.shift();
      mq.push([who || 'YOUR MENTOR', text, performance.now()]);
    }
    // the Mentor's deep voice: a few low mumbles (only if the visitor has sound on)
    function voice(n, hi) { if (!G.sound) return; for (let k = 0; k < n; k++) G.timer(() => G.note((hi ? 220 : 72) + Math.random() * (hi ? 120 : 40), 0.07, hi ? 'square' : 'sawtooth'), k * 95); }
    function drawPortrait(c, who, blink) {
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height);
      if (who === 'SIR CALLUM') { x.fillStyle = '#2a4a8a'; x.fillRect(0, 0, c.width, c.height); x.drawImage(SP.callum.a, 1, 2); }
      else { x.fillStyle = '#1a0606'; x.fillRect(0, 0, c.width, c.height); x.drawImage(SP.mentor[blink ? 1 : 0], 0, 0); }
    }
    let bannerT = 0;
    function banner(text, sub) { bannerEl.innerHTML = esc(text) + (sub ? `<small>${esc(sub)}</small>` : ''); bannerEl.classList.add('on'); bannerT = 2.6; }
    const sndT = {};
    const snd = (fn, key, cd) => { const now = performance.now(); if (sndT[key] && now - sndT[key] < cd) return; sndT[key] = now; fn(); };
    const tune = (notes, step, type) => { if (!G.sound) return; notes.forEach((f, k) => G.timer(() => G.note(f, step * 0.95, type || 'square'), k * step * 1000)); };
    const fanfare = () => tune([523, 659, 784, 1047, 784, 1047, 1319], 0.12);
    const alarmTune = () => tune([880, 660, 880, 660, 880, 660], 0.14, 'square');
    const float = (x, y, txt, col) => { if (S.floats.length < 60) S.floats.push({ x, y, txt: String(txt), col, t: 1.1 }); };
    const fx = (x, y, kind, col, n) => { for (let k = 0; k < (n || 5); k++) if (S.fx.length < 220) S.fx.push({ x, y, vx: rnd(-1.5, 1.5), vy: rnd(-2.5, -0.5), t: rnd(0.3, 0.6), col: col || '#8a6440', kind: kind || 'p' }); };
    const ring = (x, y, col, max, t) => { if (S.rings.length < 40) S.rings.push({ x, y, col, max: max || 1, t: t || 0.4, t0: t || 0.4 }); };
    const shake = (t) => { shakeT = Math.max(shakeT, t || 0.15); };

    // ---------------------------------------------------------------- entities
    function spawn(k, x, y, o) {
      const d = K[k];
      const e = Object.assign({ id: nextId++, k, hero: !!d.hero, x, y, hp: d.hp, mhp: d.hp, lvl: 1, xp: 0, path: [], st: 'idle', think: Math.random() * 0.4, cd: 0, anim: Math.random() * 3, face: 1,
        carry: 0, job: null, hunger: rnd(0, 30), tired: rnd(0, 30), happy: 80, angryT: 0, unpaidT: 0, lair: -1, work: -1, slapT: 0, speedT: 0, stun: 0, flash: 0, digT: 0, repath: 0, name: d.names ? pick(d.names) : d.n, t: 0, fallT: 0, squashT: 0 }, o || {});
      if (e.hero) { e.mhp = e.hp = Math.round(d.hp * S.L.mult); }
      S.ents.push(e);
      return e;
    }
    const lvlMul = e => 1 + 0.2 * (e.lvl - 1);
    const beasts = () => S.ents.filter(e => !e.hero && e.k !== 'imp' && !e.dead);
    const imps = () => S.ents.filter(e => e.k === 'imp' && !e.dead);
    const heroes = () => S.ents.filter(e => e.hero && !e.dead);

    // ---------------------------------------------------------------- rooms + traps
    function recount() {
      S.rl = []; for (let r = 0; r <= NROOM; r++) S.rl.push([]);
      S.tl = [];
      for (let i = 0; i < N; i++) {
        if (S.room[i]) { if (S.t_[i] !== CLAIM || S.room[i] > NROOM) S.room[i] = 0; else S.rl[S.room[i]].push(i); }
        if (S.trap[i]) { if (S.t_[i] !== CLAIM || S.trap[i] > 5) { S.trap[i] = 0; S.tb[i] = 0; } else S.tl.push(i); }
      }
      S.tq = S.tq.filter(i => S.trap[i] && !S.tb[i]);
      for (const i of S.tl) if (!S.tb[i] && !S.tq.includes(i)) S.tq.push(i);
      for (const e of S.ents) if (e.lair >= 0 && S.room[e.lair] !== 1) e.lair = -1;
    }
    const rc = n => S.rl[n].length;
    const goldCap = () => S.L.gold + 500 + 500 * rc(3);
    function assignLair(e) {
      if (e.lair >= 0) return;
      const used = new Set(S.ents.filter(x => x.lair >= 0 && !x.dead).map(x => x.lair));
      const free = S.rl[1].filter(i => !used.has(i));
      if (free.length) e.lair = free[Math.floor(Math.random() * free.length)];
    }

    // ---------------------------------------------------------------- new game / save / load
    // build S around a level L (a copy) and a map { t, gold, room?, trap?, tb? }
    function makeState(lvl, L, m, mode) {
      S = { lvl, L, mode, diff: opt.diff, seed: L.seed, t_: m.t, gold_: m.gold, mark: new Uint8Array(N), hp: new Uint8Array(N), room: m.room || new Uint8Array(N), seen: new Uint8Array(N), resv: new Uint8Array(N),
        trap: m.trap || new Uint8Array(N), tb: m.tb || new Uint8Array(N), thp: new Float32Array(N), tcd: new Float32Array(N), tq: [], tl: [],
        ents: [], chickens: [], shots: [], fx: [], floats: [], held: [], bolts: [], rings: [], clouds: [], heroList: [], ourList: [], visHeroes: [],
        gold: L.gold, time: 0, wave: 0, cleared: 0, waveT: L.first, payT: 150, arriveT: 12, chickT: 3, seenT: 0, autoT: 60, tipT: 70, res: 0, mfg: 0, spells: { imp: 1, call: 1 }, portal: false,
        heartHp: 1500, heartMax: 1500, heartFlash: 0, gateHp: Math.round(800 * L.mult), gateMax: Math.round(800 * L.mult), gateOpen: false, gateFlash: 0, done: false,
        kills: 0, dug: 0, slaps: 0, lost: 0, mined: 0, nMark: 0, picks: 0, drops: 0, warned: -1, rally: null, undo: [], tut: null, tutB: 0, raid: null, heartHitT: 0 };
      for (let i = 0; i < N; i++) if (S.trap[i] && S.tb[i]) S.thp[i] = TRAP[S.trap[i]].door || 0;
    }
    function levelCopy(lvl, seed, diff) {
      const D0 = DIFF[diff] || DIFF[1], L = Object.assign({}, LV[lvl]);
      if (L.endless) L.seed = seed || (1 + Math.floor(Math.random() * 2000000000));
      L.base = L.mult; L.mult = L.mult * D0.m; L.first = Math.round(L.first * D0.t); L.gold = Math.round(L.gold * D0.g / 50) * 50;
      return L;
    }
    function newState(lvl, seed) {
      const L = levelCopy(lvl, seed, opt.diff), m = genMap(L);
      makeState(lvl, L, m, L.endless ? 'endless' : 'realm');
      const [hx, hy] = L.heart;
      for (let k = 0; k < 4; k++) spawn('imp', hx + 0.5 + [-2, 2, -2, 2][k], hy + 0.5 + [-2, -2, 2, 2][k]);
      reveal(hx, hy, 7); reveal(L.portal[0], L.portal[1], 2);
      initDerived();
    }
    function initDerived() {
      const [hx, hy] = S.L.heart, [gx, gy] = S.L.gate;
      S.heartC = { x: hx + 0.5, y: hy + 0.5 }; S.gateC = { x: gx + 0.5, y: gy + 0.5 }; S.portalC = centre(S.L.portal);
      S.heartAdj = i => Math.abs(i % W - hx) <= 2 && Math.abs(((i / W) | 0) - hy) <= 2 && S.t_[i] !== HEART;
      S.gateAdj = i => Math.abs(i % W - gx) <= 2 && Math.abs(((i / W) | 0) - gy) <= 2 && S.t_[i] !== GATE;
      recount();
      cam.x = hx * TS + 8 - vw / 2; cam.y = hy * TS + 8 - vh / 2; clampCam();
    }
    const enc = a => { let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(48 + a[i]); return s; };
    const dec = (s, a, max) => { for (let i = 0; i < a.length && i < s.length; i++) { const v = s.charCodeAt(i) - 48; a[i] = v >= 0 && v <= (max || 60) ? v : 0; } return a; };
    function serial() {
      const gold = []; for (let i = 0; i < N; i++) if (S.gold_[i]) gold.push(i, S.gold_[i]);
      const thp = []; for (const i of S.tl) if (S.tb[i] && isDoor(S.trap[i]) && S.thp[i] < TRAP[S.trap[i]].door) thp.push(i, Math.round(S.thp[i]));
      const ents = S.ents.filter(e => !e.dead && !e.gone).map(e => ({ k: e.k, x: +e.x.toFixed(2), y: +e.y.toFixed(2), hp: Math.round(e.hp), mhp: e.mhp, lvl: e.lvl, xp: Math.round(e.xp), hunger: Math.round(e.hunger), tired: Math.round(e.tired), happy: Math.round(e.happy), name: e.name, held: !!e.held, carry: e.carry }));
      return { v: 2, lvl: S.lvl, seed: S.L.endless ? S.L.seed : undefined, diff: S.diff, t: enc(S.t_), mark: enc(S.mark), room: enc(S.room), seen: enc(S.seen), hp: enc(S.hp), trap: enc(S.trap), tb: enc(S.tb), tq: S.tq.slice(0, 200), thp, gold, ents, chickens: S.chickens.filter(c => !c.free).map(c => [+c.x.toFixed(2), +c.y.toFixed(2)]),
        g: S.gold, time: Math.round(S.time), wave: S.wave, cleared: S.cleared, waveT: Math.round(S.waveT), payT: Math.round(S.payT), res: Math.round(S.res), mfg: Math.round(S.mfg), spells: S.spells, portal: S.portal,
        heartHp: Math.round(S.heartHp), gateHp: Math.round(S.gateHp), gateOpen: S.gateOpen, kills: S.kills, dug: S.dug, slaps: S.slaps, lost: S.lost, mined: S.mined, nMark: S.nMark, picks: S.picks, drops: S.drops, tut: S.tut, tutB: S.tutB,
        when: (() => { const t = Desk.today99(); return t.d + '/' + t.m + '/99'; })() };
    }
    function restore(o) {
      const keep = opt.diff; opt.diff = o.diff != null ? o.diff : 1;
      newState(o.lvl, o.seed); opt.diff = keep;
      dec(o.t, S.t_, 12); dec(o.mark, S.mark, 1); dec(o.room, S.room, NROOM); dec(o.seen, S.seen, 1); dec(o.hp || '', S.hp);
      dec(o.trap || '', S.trap, 5); dec(o.tb || '', S.tb, 1);
      for (let i = 0; i < N; i++) S.thp[i] = S.trap[i] && S.tb[i] ? TRAP[S.trap[i]].door || 0 : 0;
      const th = o.thp || []; for (let k = 0; k + 1 < th.length; k += 2) if (S.thp[th[k]]) S.thp[th[k]] = th[k + 1];
      S.tq = Array.isArray(o.tq) ? o.tq.filter(i => i >= 0 && i < N) : [];
      S.gold_.fill(0); for (let k = 0; k < o.gold.length; k += 2) S.gold_[o.gold[k]] = o.gold[k + 1];
      S.ents = []; S.held = [];
      for (const x of o.ents) { if (!K[x.k]) continue; const e = spawn(x.k, x.x, x.y); Object.assign(e, { hp: x.hp, mhp: x.mhp, lvl: x.lvl, xp: x.xp, hunger: x.hunger, tired: x.tired, happy: x.happy, name: x.name, carry: x.carry || 0 }); if (x.held) { e.held = true; S.held.push(e); } }
      S.chickens = (o.chickens || []).map(([x, y]) => ({ x, y, tx: x, ty: y, t: 0, anim: 0 }));
      Object.assign(S, { gold: o.g, time: o.time, wave: o.wave, cleared: o.cleared != null ? o.cleared : Math.max(0, o.wave - (o.ents.some(e => K[e.k] && K[e.k].hero) ? 1 : 0)), waveT: o.waveT, payT: o.payT, res: o.res, mfg: o.mfg || 0, spells: Object.assign({ imp: 1, call: 1 }, o.spells || {}), portal: o.portal, heartHp: o.heartHp, gateHp: o.gateHp, gateOpen: o.gateOpen,
        kills: o.kills || 0, dug: o.dug || 0, slaps: o.slaps || 0, lost: o.lost || 0, mined: o.mined || 0, nMark: o.nMark || 0, picks: o.picks || 0, drops: o.drops || 0, tut: o.tut != null ? o.tut : null, tutB: o.tutB || 0, warned: o.wave * 10 + 9 });
      if (S.L.endless) scaleEndless();
      initDerived();
      for (const e of S.ents) if (!e.hero && e.k !== 'imp') assignLair(e);
      for (const e of S.ents) if (e.hero) e.tgt = HEART_T;
    }
    const realmName = o => LV[o.lvl] ? LV[o.lvl].n : '?';
    const slotInfo = o => o ? `${LV[o.lvl] && LV[o.lvl].endless ? 'Bottomless Pit, wave ' + ((o.wave | 0) + 1) : 'Realm: ' + realmName(o)} – ${fmtT(o.time)} played – ${o.g} gold – saved ${o.when || '?'}` : '(empty)';

    // ---------------------------------------------------------------- reveal
    function reveal(cx, cy, r) {
      for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) { if (x < 0 || y < 0 || x >= W || y >= H) continue; if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 1) S.seen[y * W + x] = 1; }
    }

    // ---------------------------------------------------------------- movement
    // returns 1 arrived, 0 moving, -1 blocked
    function move(e, dt, sp) {
      if (!e.path.length) return 1;
      const nx = e.path[0], tx = nx % W + 0.5, ty = ((nx / W) | 0) + 0.5, t = S.t_[nx];
      if (e.hero && doorAt(nx)) { // bash the door
        e.face = tx < e.x ? -1 : 1; e.anim += dt * 8;
        if (e.cd <= 0) {
          e.cd = K[e.k].rate; e.atk = 0.2;
          const dmg = K[e.k].dmg * S.L.mult * rnd(0.85, 1.15); S.thp[nx] -= dmg; float(tx, ty - 1, Math.round(dmg), '#ffffff'); fx(tx, ty - 0.3, 'p', S.trap[nx] === 5 ? '#c0c8d0' : '#a07a40', 3);
          if (S.seen[nx]) snd(() => G.note(S.trap[nx] === 5 ? rnd(300, 400) : rnd(120, 160), 0.05, 'square'), 'door', 140);
          if (S.thp[nx] <= 0) { S.trap[nx] = 0; S.tb[nx] = 0; S.thp[nx] = 0; fx(tx, ty - 0.3, 'p', '#a07a40', 12); ring(tx, ty, '#ffd400', 1.2); G.sfx('thud'); shake(0.2); recount(); if (S.mode !== 'raid') mentor('The heroes have smashed one of your doors, Keepa!', 'doorgone', 20); else float(tx, ty - 1.5, 'SMASH!', '#ffd400'); }
        }
        return 0;
      }
      if (!isWalk(t)) {
        if (e.hero && ((isDig(t) && t !== GEM) || (t === ROCK && inner(nx)))) {
          e.digT += dt * (K[e.k].dig || 1); e.anim += dt * 10;
          const need = t === ROCK ? 7 : t === WALL ? 3.4 : t === GOLD ? 2.2 : 1.6;
          if (Math.random() < dt * 3) fx(tx, ty, 'p', t === WALL ? '#8a3c2c' : '#6b4a2b', 1);
          if (e.digT >= need) { S.t_[nx] = DIRT; S.mark[nx] = 0; S.gold_[nx] = 0; S.room[nx] = 0; e.digT = 0; fx(tx, ty, 'p', '#6b4a2b', 6); if (S.seen[nx]) snd(() => G.sfx('turn'), 'hdig', 400); }
          e.face = tx < e.x ? -1 : 1;
          return 0;
        }
        e.path = []; return -1;
      }
      const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), st = sp * dt * (t === WATER ? 0.6 : 1);
      if (Math.abs(dx) > 0.05) e.face = dx < 0 ? -1 : 1;
      e.anim += dt * 9;
      if (d <= st) { e.x = tx; e.y = ty; e.path.shift(); return e.path.length ? 0 : 1; }
      e.x += dx / d * st; e.y += dy / d * st;
      return 0;
    }
    const spOf = e => K[e.k].sp * (e.speedT > 0 ? 1.7 : 1) * (e.slapT > 0 ? 1.5 : 1);

    // ---------------------------------------------------------------- combat
    function hurt(e, dmg, src) {
      if (e.dead) return;
      e.hp -= dmg; e.flash = 0.12;
      float(e.x, e.y - 1.1, Math.round(dmg), e.hero ? '#ffffff' : '#ff6060');
      if (src && !e.hero && e.st !== 'fight' && e.k !== 'imp' && src.hero) { e.tgt = src; e.st = 'fight'; e.path = []; }
      if (e.hp <= 0) kill(e, src);
    }
    function kill(e, src) {
      e.dead = true; e.hp = 0;
      fx(e.x, e.y - 0.4, 'p', e.hero ? '#d0d8e8' : '#ff4040', 12); ring(e.x, e.y - 0.3, e.hero ? '#ffffff' : '#ff4040', 1.2);
      G.sfx('thud');
      if (e.held) S.held = S.held.filter(x => x !== e);
      if (e.job) { relJob(e); }
      if (src && !src.dead && !src.hero && src.k !== 'imp' && e.hero && src.lvl < 6) { src.xp += 25; if (src.xp >= XP[src.lvl + 1]) levelUp(src); }
      if (S.mode === 'raid') { raidKill(e); return; }
      if (e.hero) {
        S.kills++; const b = Math.round(K[e.k].bounty * S.L.mult); S.gold = Math.min(goldCap(), S.gold + b); float(e.x, e.y - 1.8, '+' + b, '#ffd400');
        if (e.k === 'callum') { mentor('Sir Callum the Brave has been defeated! He says it was lag. It was not lag.', null, 0); fanfare(); G.secret('keepa.callum'); banner('SIR CALLUM DEFEATED!'); }
        else mentor(pick(['A ' + K[e.k].n + ' has been flattened. Lovely.', 'One less do-gooder. Excellent.', 'That ' + K[e.k].n + ' won\'t be holding any more picnics.']), 'herodead', 12);
      } else {
        S.lost++;
        if (e.k === 'imp') mentor('An imp has died. It knew the risks. (It didn\'t read them.)', 'impdead', 20);
        else mentor(e.name + ' the ' + K[e.k].n + ' has been knocked out and gone home to its Mom.', null, 0);
      }
    }
    function attack(e, tgt, dt) {
      const k = K[e.k];
      if (tgt.x != null) e.face = tgt.x < e.x ? -1 : 1;
      if (e.cd > 0) return;
      e.cd = k.rate * (e.speedT > 0 ? 0.6 : 1) * (e.slapT > 0 ? 0.8 : 1);
      e.atk = 0.2;
      const dmg = k.dmg * (e.hero ? S.L.mult * (e.speedT > 0 && S.mode === 'raid' ? 1.3 : 1) : lvlMul(e)) * rnd(0.85, 1.15);
      if (k.range > 1.5) {
        S.shots.push({ x: e.x, y: e.y - 0.5, tgt, dmg, col: k.shot || '#fff', from: e, t: 3 });
        snd(() => G.note(e.k === 'archer' ? 900 : 300, 0.05, e.k === 'archer' ? 'triangle' : 'sawtooth'), 'shoot', 120);
      } else {
        applyHit(tgt, dmg, e);
        if (k.splash) { // the Belcher's burp hits everything next to the target
          for (const o of (e.hero ? S.ourList : S.heroList)) if (o !== tgt && !o.dead && dist2(o, tgt) < 1.3) hurt(o, dmg * 0.5, e);
          for (let q = 0; q < 4; q++) if (S.clouds.length < 30) S.clouds.push({ x: tgt.x + rnd(-0.5, 0.5), y: tgt.y - 0.4 + rnd(-0.3, 0.3), t: 0.6, t0: 0.6, col: '#9ad84a', dmg: 0 });
          snd(() => { G.note(70, 0.12, 'sawtooth'); G.note(55, 0.15, 'sawtooth'); }, 'burp', 400);
        }
        fx((e.x + (tgt.x != null ? tgt.x : e.x)) / 2, e.y - 0.5, 's', '#fff', 2);
        snd(() => G.note(rnd(110, 190), 0.05, 'square'), 'melee', 90);
      }
    }
    function applyHit(tgt, dmg, src) {
      if (tgt === 'heart' || tgt.isHeart) {
        S.heartHp -= dmg; S.heartFlash = 0.15; S.heartHitT = 2.5; float(S.heartC.x, S.heartC.y - 1.6, Math.round(dmg), '#ff6060');
        if (S.mode !== 'raid') { mentor('Your Dungeon Heart is under attack, Keepa! Get your beasts over there!', 'heart', 15); snd(() => G.sfx('uhoh'), 'hearthit', 3000); }
        else snd(() => G.note(rnd(90, 120), 0.08, 'sawtooth'), 'hearthit', 250);
        return;
      }
      if (tgt === 'gate' || tgt.isGate) { if (S.L.endless) return; S.gateHp -= dmg; S.gateFlash = 0.15; float(S.gateC.x, S.gateC.y - 1.6, Math.round(dmg), '#ffffff'); return; }
      hurt(tgt, dmg, src);
    }
    const HEART_T = { isHeart: 1 }, GATE_T = { isGate: 1 }, ORDER_T = { isOrder: 1 };
    Object.defineProperty(HEART_T, 'x', { get: () => S.heartC.x }); Object.defineProperty(HEART_T, 'y', { get: () => S.heartC.y });
    Object.defineProperty(GATE_T, 'x', { get: () => S.gateC.x }); Object.defineProperty(GATE_T, 'y', { get: () => S.gateC.y });
    Object.defineProperty(ORDER_T, 'x', { get: () => S.raid ? S.raid.order % W + 0.5 : 0 }); Object.defineProperty(ORDER_T, 'y', { get: () => S.raid ? ((S.raid.order / W) | 0) + 0.5 : 0 });
    function nearest(e, list, r) { let best = null, bd = r; for (const o of list) { if (o.dead || o.held) continue; const d = dist2(e, o); if (d < bd) { bd = d; best = o; } } return best; }

    // ---------------------------------------------------------------- imps
    function relJob(e) { if (e.job && S.resv[e.job.tgt] > 0) S.resv[e.job.tgt]--; e.job = null; }
    function jobValid(j) {
      const t = S.t_[j.tgt];
      if (j.type === 'dig') return S.mark[j.tgt] && isDig(t);
      if (j.type === 'claim') return (t === DIRT || t === HFLOOR) && claimable(j.tgt);
      return t === EARTH && !S.mark[j.tgt];
    }
    function findJob(e) {
      const s = tileOf(e); if (s < 0) return;
      let dig = -1, digStand = -1, claim = -1, reinf = -1, reinfStand = -1;
      bfs(s, c => {
        const cx = c % W, cy = (c / W) | 0;
        for (const [dx, dy] of N4) {
          const n = tileAt(cx + dx, cy + dy); if (n < 0) continue;
          if (S.mark[n] && isDig(S.t_[n]) && S.resv[n] < 2) { dig = n; digStand = c; return true; }
          if (reinf < 0 && S.t_[c] === CLAIM && S.t_[n] === EARTH && !S.mark[n] && !S.resv[n] && S.seen[n]) { reinf = n; reinfStand = c; }
        }
        if (claim < 0 && !S.resv[c] && claimable(c)) claim = c;
        return false;
      }, 900);
      let j = null;
      if (dig >= 0) j = { type: 'dig', tgt: dig, stand: digStand };
      else if (claim >= 0) j = { type: 'claim', tgt: claim, stand: claim };
      else if (reinf >= 0 && Math.random() < 0.6 && !visiting()) j = { type: 'reinf', tgt: reinf, stand: reinfStand };
      if (!j) return;
      // the bfs above ran from s, so prev[] still holds the way back for every visited tile
      e.path = j.stand === s ? [] : pathTo(s, j.stand);
      j.phase = 'go'; j.t = 0; e.job = j; S.resv[j.tgt]++;
    }
    function startDeposit(e) {
      const s = tileOf(e);
      const p = bfsPath(s, c => S.room[c] === 3 || S.heartAdj(c));
      if (p) { e.path = p; e.dep = true; } else e.carry = 0;
    }
    function deposit(e) {
      const room = goldCap() - S.gold, take = Math.max(0, Math.min(e.carry, room));
      if (take > 0) { S.gold += take; S.mined += take; float(e.x, e.y - 1.3, '+' + take, '#ffd400'); fx(e.x, e.y - 0.6, 's', '#ffd400', 2); snd(() => { G.note(1320, 0.05, 'square'); G.note(1760, 0.06, 'square'); }, 'coin', 150); }
      if (e.carry > take) mentor('Your Treasury is full, Keepa. Build a bigger one, or the imps will start keeping the change.', 'full', 40);
      e.carry = 0; e.dep = false;
    }
    function impAI(e, dt) {
      const foe = nearest(e, S.heroList, 3);
      if (foe) {
        if (dist2(e, foe) <= 1.1) { attack(e, foe, dt); return; }
        if (!e.flee || !e.path.length) { if (e.job) relJob(e); e.dep = false; e.flee = true; const s = tileOf(e); const p = bfsPath(s, c => owned(c) && Math.hypot(c % W + 0.5 - foe.x, ((c / W) | 0) + 0.5 - foe.y) > 5, 900); e.path = p || []; if (Math.random() < 0.3) float(e.x, e.y - 1.2, '!', '#ffd400'); }
        move(e, dt, spOf(e) * 1.2); return;
      }
      e.flee = false;
      if (e.job && !jobValid(e.job)) relJob(e);
      if (e.dep) { const r = move(e, dt, spOf(e)); if (r === 1) deposit(e); else if (r < 0) e.dep = false; return; }
      if (!e.job) {
        if (e.carry > 0) { startDeposit(e); return; }
        e.think -= dt;
        if (e.think <= 0) { e.think = rnd(0.3, 0.7); findJob(e); if (!e.job && !e.path.length && Math.random() < 0.3) wander(e, 4); }
        if (!e.job && e.path.length) move(e, dt, spOf(e) * 0.6);
        return;
      }
      const j = e.job;
      if (j.phase === 'go') { const r = move(e, dt, spOf(e)); if (r === 1) { j.phase = 'work'; j.t = 0; } else if (r < 0) relJob(e); return; }
      const tx = j.tgt % W + 0.5, ty = ((j.tgt / W) | 0) + 0.5;
      e.face = tx < e.x - 0.1 ? -1 : tx > e.x + 0.1 ? 1 : e.face;
      e.anim += dt * 12;
      j.t += dt * (e.slapT > 0 ? 1.8 : 1) * (e.speedT > 0 ? 1.5 : 1);
      if (j.type === 'dig') {
        if (j.t < 0.45) return;
        j.t = 0;
        const t = S.t_[j.tgt];
        fx(tx, ty, 'p', t === GOLD ? '#ffd400' : t === GEM ? '#70f0ff' : t === WALL ? '#8a3c2c' : '#7d5733', 2);
        if (S.seen[j.tgt]) snd(() => G.note(rnd(70, 110), 0.04, 'square'), 'dig', 110);
        if (t === GOLD) {
          const a = Math.min(20, S.gold_[j.tgt]); S.gold_[j.tgt] -= a; e.carry += a; fx(tx, ty, 's', '#ffd400', 1);
          if (S.gold_[j.tgt] <= 0) dug(j.tgt);
        } else if (t === GEM) { e.carry += 15; }
        else { S.hp[j.tgt]++; if (S.hp[j.tgt] >= (t === WALL ? 9 : 4)) dug(j.tgt); }
        if (e.carry >= 100) { relJob(e); startDeposit(e); }
        else if (!jobValid(j)) relJob(e);
      } else if (j.type === 'claim') {
        if (Math.random() < dt * 6) fx(tx + rnd(-0.4, 0.4), ty + rnd(-0.2, 0.3), 'p', '#ff4a3a', 1);
        if (j.t >= 1.6) {
          S.t_[j.tgt] = CLAIM; S.hp[j.tgt] = 0; fx(tx, ty, 'p', '#ff4a3a', 4); ring(tx, ty, '#ff4a3a', 0.7, 0.35); relJob(e);
          if (S.seen[j.tgt]) snd(() => G.note(523, 0.06, 'triangle'), 'claim', 200);
          if (!S.portal && adjTo(j.tgt, n => S.t_[n] === PORTAL)) { S.portal = true; if (!visiting()) { mentor('You have claimed a Portal, Keepa. Beasts will come through it... if you build them a Lair and a Hatchery.', null, 0); G.sfx('join'); banner('PORTAL CLAIMED'); ring(S.portalC.x, S.portalC.y, '#c070ff', 3, 0.8); } }
        }
      } else if (j.t >= 2.2) { S.t_[j.tgt] = WALL; S.hp[j.tgt] = 0; relJob(e); fx(tx, ty, 'p', '#8a3c2c', 3); }
    }
    function dug(i) {
      const x = i % W, y = (i / W) | 0, was = S.t_[i];
      S.t_[i] = DIRT; S.mark[i] = 0; S.hp[i] = 0; S.gold_[i] = 0; S.dug++;
      // a crumble: chunks of rock and a puff of dust
      for (let k = 0; k < 7; k++) if (S.fx.length < 220) S.fx.push({ x: x + rnd(0.1, 0.9), y: y + rnd(0.1, 0.6), vx: rnd(-1.2, 1.2), vy: rnd(-2, 0), t: rnd(0.4, 0.8), col: was === GOLD ? pick(['#ffd400', '#7d5733']) : was === WALL ? '#8a3c2c' : pick(['#7d5733', '#5a3d22', '#86603a']), kind: 'c' });
      ring(x + 0.5, y + 0.5, 'rgba(200,170,130,.8)', 0.8, 0.35);
      if (S.seen[i]) snd(() => { G.note(60, 0.08, 'sawtooth'); G.note(45, 0.1, 'square'); }, 'crumble', 120);
      reveal(x, y, 3);
    }
    function wander(e, r) {
      const s = tileOf(e); if (s < 0) return;
      const opts = []; bfs(s, c => { if (owned(c) || S.t_[c] === CLAIM) opts.push(c); return opts.length > 40; }, 120);
      const ok = opts.filter(c => Math.abs(c % W - s % W) + Math.abs(((c / W) | 0) - ((s / W) | 0)) <= r);
      if (!ok.length) return;
      const g = pick(ok); bfs(s, c => c === g, 300); e.path = pathTo(s, g);
    }

    // ---------------------------------------------------------------- beasts
    function goTo(e, goalFn, max) { const s = tileOf(e); if (s < 0) return false; const p = bfsPath(s, goalFn, max || 1400); if (p) { e.path = p; return true; } return false; }
    const WORK_ST = { 4: 'train', 5: 'research', 6: 'craft' };
    function tryWork(e, room) {
      const occ = new Set(S.ents.filter(x => x.work >= 0 && x !== e && !x.dead).map(x => x.work));
      const free = S.rl[room].filter(i => !occ.has(i)); if (!free.length) return false;
      const set = new Set(free);
      if (!goTo(e, c => set.has(c))) return false;
      e.st = WORK_ST[room]; e.work = e.path.length ? e.path[e.path.length - 1] : tileOf(e); e.t = rnd(18, 28); return true;
    }
    function decide(e) {
      const foe = nearest(e, S.visHeroes, S.mode === 'raid' ? 9 : 14);
      if (foe && !e.leaving) { if (e.st !== 'fight' || e.tgt !== foe) { e.st = 'fight'; e.tgt = foe; e.path = []; e.repath = 0; freeWork(e); } return; }
      if (e.st === 'fight') { e.st = 'idle'; e.tgt = null; }
      if (S.rally && !e.leaving) { // Call to Arms
        const rt = tileAt(Math.floor(S.rally.x), Math.floor(S.rally.y));
        if (Math.hypot(e.x - S.rally.x, e.y - S.rally.y) > 1.6) { if (e.st !== 'rally' || !e.path.length) { e.st = 'rally'; freeWork(e); if (!goTo(e, c => c === rt || adjTo(c, n => n === rt), 1400)) e.st = 'idle'; } return; }
        e.st = 'rally'; e.path = []; return;
      }
      if (e.leaving) { if (e.st !== 'leave') { e.st = 'leave'; freeWork(e); goTo(e, c => S.t_[c] === PORTAL); } return; }
      if (e.st === 'eating' || e.st === 'sleeping' && (e.tired > 0 || e.hp < e.mhp)) return;
      const free = S.chickens.find(c => c.free && dist2(c, e) < 6);
      if ((e.hunger > 70 || (free && e.hunger > 30)) && S.chickens.length && e.st !== 'eat') { const c = free || nearest(e, S.chickens, 99); if (c) { e.st = 'eat'; e.tgt = c; e.path = []; e.repath = 0; freeWork(e); return; } }
      if (e.st === 'eat' && S.chickens.includes(e.tgt)) return;
      if (e.tired > 80 && e.lair >= 0) { if (e.st !== 'sleep' && e.st !== 'sleeping') { e.st = 'sleep'; freeWork(e); goTo(e, c => c === e.lair); } return; }
      if (e.st === 'sleep' && e.path.length) return;
      if (S.gateOpen && e.hunger < 85 && e.tired < 90) { if (e.st !== 'assault') { e.st = 'assault'; freeWork(e); if (!goTo(e, S.gateAdj)) { e.st = 'idle'; mentor('Dig a tunnel to the Hero Gate, Keepa, so your beasts can reach it. Or carry them there with the Hand.', 'nogate', 30); } } return; }
      if ((e.st === 'train' || e.st === 'research' || e.st === 'craft') && e.t > 0) return;
      if (S.mode !== 'raid') {
        const k = K[e.k], cash = S.mode === 'tour' || S.gold >= Math.max(300, wageBill() + 150); // beasts won't train you skint before payday
        const wants = [];
        if (k.likes === 5 && rc(5)) wants.push(5);
        if (k.likes === 6 && rc(6)) wants.push(6);
        if (k.likes === 4 && rc(4) && cash && e.lvl < 6) wants.push(4);
        if (rc(4) && cash && e.lvl < 6 && Math.random() < 0.5) wants.push(4);
        if (rc(6) && S.tq.length && Math.random() < 0.6) wants.push(6);
        for (const r of wants) if (tryWork(e, r)) return;
      }
      e.st = 'wander'; freeWork(e); if (!e.path.length && Math.random() < 0.6) { if (e.lair >= 0 && Math.random() < 0.4) goTo(e, c => c === e.lair); else wander(e, 6); }
    }
    const freeWork = e => { e.work = -1; };
    let wbT = -1, wbV = 0;
    const wageBill = () => { if (S.time !== wbT) { wbT = S.time; wbV = 0; for (const e of S.ents) if (!e.dead && !e.hero && e.k !== 'imp') wbV += Math.round(K[e.k].wage * (1 + 0.25 * (e.lvl - 1))); } return wbV; };
    // what a beast is grumbling about (for the Beasts list): [text, mood change]
    function needs(e) {
      const k = K[e.k], out = [];
      if (e.hunger > 90) out.push(['starving', -2.5]); else if (e.hunger > 70) out.push(['hungry', 0]);
      if (e.lair < 0) out.push(['no bed', -1.2]);
      if (e.unpaidT > 0) out.push(['not paid', -2]);
      if (e.tired >= 100) out.push(['shattered', -1]);
      if (k.likes && !rc(k.likes)) out.push(['wants a ' + ROOM[k.likes].n, -0.5]);
      return out;
    }
    function beastAI(e, dt) {
      const k = K[e.k];
      if (!visiting()) {
        if (e.st !== 'sleeping') e.tired = Math.min(100, e.tired + dt * 0.55);
        if (e.st !== 'eating') e.hunger = Math.min(100, e.hunger + dt * (k.hungry || 0.8));
        if (e.lair < 0 && rc(1)) assignLair(e);
        let mood = 0; for (const [, m] of needs(e)) mood += m;
        if (e.unpaidT > 0) e.unpaidT -= dt;
        if (!mood) mood = WORK_ST[k.likes] === e.st ? 1.6 : 0.7; // a beast doing its favourite job cheers right up
        e.happy = clamp(e.happy + mood * dt, 0, 100);
        if (e.happy < 15) { e.angryT += dt; if (e.angryT > 30 && !e.leaving) { e.leaving = true; e.think = 0; mentor(`${e.name} the ${k.n} is fed up and is leaving your dungeon. ${pick(['Even Dave\'s music wasn\'t this bad.', 'Try feeding and paying them, Keepa.', 'It took its sleeping bag.'])}`, null, 0); } } else e.angryT = 0;
      }
      e.think -= dt; e.t -= dt;
      if (e.think <= 0) { e.think = rnd(0.4, 0.6); decide(e); }
      const sp = spOf(e);
      switch (e.st) {
        case 'fight': {
          const f = e.tgt; if (!f || f.dead || f.held) { e.think = 0; break; }
          const d = dist2(e, f);
          if (d <= k.range) attack(e, f, dt);
          else { e.repath -= dt; if (e.repath <= 0 || !e.path.length) { e.repath = 0.7; const ft = tileOf(f); goTo(e, c => c === ft || adjTo(c, n => n === ft), 600); } move(e, dt, sp); }
          break;
        }
        case 'rally': move(e, dt, sp * 1.15); break;
        case 'eat': {
          const c = e.tgt; if (!c || !S.chickens.includes(c)) { e.think = 0; break; }
          if (dist2(e, c) < 0.7) { S.chickens.splice(S.chickens.indexOf(c), 1); e.st = 'eating'; e.t = 1.3; e.hunger = 0; e.hp = Math.min(e.mhp, e.hp + 10); fx(c.x, c.y - 0.3, 'p', '#f0f0f0', 6); fx(c.x, c.y - 0.3, 'p', '#e8402a', 3); snd(() => { G.note(180, 0.06, 'square'); G.note(140, 0.08, 'square'); }, 'chomp', 200); }
          else { e.repath -= dt; if (e.repath <= 0 || !e.path.length) { e.repath = 1; const ct = tileAt(Math.floor(c.x), Math.floor(c.y)); goTo(e, n => n === ct, 600); } move(e, dt, sp); }
          break;
        }
        case 'eating': e.anim += dt * 14; if (e.t <= 0) { e.st = 'idle'; e.think = 0; } break;
        case 'sleep': { const r = move(e, dt, sp); if (r === 1 && tileOf(e) === e.lair) { e.st = 'sleeping'; } else if (r !== 0) { e.st = 'idle'; e.think = rnd(1, 2); } break; }
        case 'sleeping': if (!visiting()) { e.tired = Math.max(0, e.tired - dt * 14); e.hp = Math.min(e.mhp, e.hp + dt * 8); } if (Math.random() < dt * 0.8) float(e.x + 0.3, e.y - 1, 'Z', '#a0c0ff'); if ((e.tired <= 0 && e.hp >= e.mhp) || visiting() && Math.random() < dt * 0.05) { e.st = 'idle'; e.think = 0; } break;
        case 'train': case 'research': case 'craft': {
          const r = move(e, dt, sp);
          if (r === 1) {
            e.anim += dt * 8; e.tick = (e.tick || 0) + dt;
            if (e.tick >= 1) {
              e.tick = 0;
              if (visiting()) { /* just for show */ }
              else if (e.st === 'train') {
                if (S.gold < Math.max(250, wageBill() + 100)) { e.t = 0; break; }
                S.gold -= 3; e.xp += 3; snd(() => G.note(rnd(200, 260), 0.03, 'square'), 'train', 300);
                if (e.lvl < 6 && e.xp >= XP[e.lvl + 1]) levelUp(e);
              } else if (e.st === 'research') {
                S.res += 1.5 + 0.5 * e.lvl; if (Math.random() < 0.3) float(e.x, e.y - 1.2, '+', '#c070ff');
                checkResearch();
              } else {
                S.mfg += (e.k === 'troll' ? 2 : 1) * (1 + 0.15 * (e.lvl - 1)); fx(e.x + e.face * 0.4, e.y - 0.4, 's', '#ffd890', 1);
                snd(() => G.note(rnd(600, 800), 0.03, 'square'), 'anvil', 350);
              }
            }
          } else if (r < 0) e.think = 0;
          if (e.t <= 0) { e.st = 'idle'; e.think = 0; freeWork(e); }
          break;
        }
        case 'assault': {
          if (dist2(e, S.gateC) <= 3) { attack(e, GATE_T, dt); }
          else { const r = move(e, dt, sp); if (r !== 0) { e.think = 0; e.st = 'idle'; } }
          break;
        }
        case 'leave': { const r = move(e, dt, sp); if (r === 1 && S.t_[tileOf(e)] === PORTAL) { e.dead = true; e.gone = true; fx(e.x, e.y - 0.4, 'p', '#c070ff', 10); G.sfx('zap'); } else if (r < 0) goTo(e, c => S.t_[c] === PORTAL); break; }
        default: move(e, dt, sp * 0.7);
      }
    }
    function levelUp(e) {
      e.lvl++; const m = Math.round(K[e.k].hp * lvlMul(e)); e.hp += m - e.mhp; e.mhp = m;
      float(e.x, e.y - 1.6, 'LV UP', '#80ff60'); ring(e.x, e.y - 0.4, '#80ff60', 1, 0.5);
      snd(() => { G.note(660, 0.08, 'square'); G.note(990, 0.12, 'square'); }, 'lvl', 300);
      if (e.lvl === 4) mentor(`${e.name} the ${K[e.k].n} has reached level 4. Fear it. (A bit.)`, 'lvl4', 30);
    }
    function checkResearch() {
      for (const k in SPELLS) if (!S.spells[k] && SPELLS[k].res && S.res >= SPELLS[k].res) {
        S.spells[k] = 1; G.sfx('solve'); banner('NEW SPELL!', SPELLS[k].n);
        mentor(`The Library has researched ${SPELLS[k].n}. ${k === 'zap' ? 'Zap!' : k === 'speed' ? 'Zoom!' : k === 'cluck' ? 'Cluck!' : 'Lovely.'} Find it on the Spells tab.`, null, 0);
        if (tab === 'spells') buildTab();
      }
    }

    // ---------------------------------------------------------------- heroes
    function heroAI(e, dt) {
      const k = K[e.k], R = S.raid;
      e.think -= dt; e.repath -= dt;
      if (e.think <= 0) {
        e.think = rnd(0.5, 0.8);
        let nt;
        if (R && R.focus && !R.focus.dead && !R.focus.held && dist2(R.focus, e) < 14) nt = R.focus;
        else nt = nearest(e, S.ourList, 4.5);
        if (!nt && R && R.order >= 0) nt = e.ord !== R.oid ? ORDER_T : null; // a raid flag: go there and hold
        else if (!nt) nt = HEART_T;
        if (nt !== e.tgt) { e.tgt = nt; e.path = []; e.repath = 0; }
        if (k.heal && (e.healT = (e.healT || 0) - 0.65) <= 0) {
          e.healT = 4;
          for (const o of S.heroList) if (!o.dead && o !== e && o.hp < o.mhp && dist2(o, e) < 4) { o.hp = Math.min(o.mhp, o.hp + 12); float(o.x, o.y - 1.2, '+12', '#80ff80'); }
        }
      }
      if (!e.tgt && R && R.order >= 0) { e.anim = 0; return; } // holding at the flag
      const tgt = e.tgt || HEART_T;
      if (tgt === ORDER_T) {
        if (!R || R.order < 0) { e.think = 0; e.tgt = HEART_T; return; }
        if (e.ord === R.oid) { e.tgt = null; return; }
        if (dist2(e, ORDER_T) < 1.3) { e.ord = R.oid; e.path = []; e.tgt = null; return; }
        if (e.repath <= 0 || !e.path.length) { e.repath = 1.5; const s = tileOf(e), o = R.order; e.path = digPath(s, c => c === o) || []; if (!e.path.length) e.ord = R.oid; }
        if (move(e, dt, spOf(e)) < 0) e.repath = 0;
        return;
      }
      if (tgt !== HEART_T && (tgt.dead || tgt.held)) { e.think = 0; e.tgt = HEART_T; return; }
      const d = dist2(e, tgt), reach = tgt === HEART_T ? 3 : k.range;
      if (d <= reach) { attack(e, tgt, dt); return; }
      if (tgt === HEART_T && k.range > 1.5 && d <= k.range && S.seen[tileOf(e)]) { attack(e, tgt, dt); return; }
      if (e.repath <= 0 || !e.path.length) {
        e.repath = tgt === HEART_T ? 2.5 : 0.9;
        const s = tileOf(e);
        if (tgt === HEART_T) e.path = digPath(s, S.heartAdj) || [];
        else { const ft = tileOf(tgt); e.path = digPath(s, c => c === ft || adjTo(c, n => n === ft)) || []; }
      }
      if (move(e, dt, spOf(e)) < 0) e.repath = 0;
    }
    // the heroes in wave n (endless waves are made up from the realm's seed, so the preview matches what turns up)
    function waveList(n) {
      if (!S.L.endless) return S.L.waves[n] || [];
      let seed = (S.L.seed + n * 7919) % 2147483647 || 1; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const pool = ['knight', 'archer', 'dwarf']; if (n >= 2) pool.push('wizard', 'knight');
      const out = []; if (n % 5 === 4) out.push('callum');
      const c = 2 + Math.floor(n * 0.75); for (let k = 0; k < c; k++) out.push(pool[Math.floor(r() * pool.length)]);
      return out;
    }
    const nWaves = () => S.L.endless ? Infinity : S.L.waves.length;
    function scaleEndless() { S.L.mult = S.L.base * (DIFF[S.diff] || DIFF[1]).m * (1 + 0.09 * S.wave); }
    function spawnWave(n) {
      const list = waveList(n), [gx, gy] = S.L.gate;
      if (S.L.endless) scaleEndless();
      const spots = []; for (let y = gy - 2; y <= gy + 2; y++) for (let x = gx - 2; x <= gx + 2; x++) { const i = tileAt(x, y); if (i >= 0 && isWalk(S.t_[i])) spots.push([x, y]); }
      list.forEach((k, j) => { const [x, y] = spots[j % spots.length] || [gx - 2, gy]; const h = spawn(k, x + 0.5 + rnd(-0.2, 0.2), y + 0.5, { think: j * 0.3 }); h.tgt = HEART_T; });
      const last = n === nWaves() - 1;
      banner(last ? 'FINAL WAVE!' : 'WAVE ' + (n + 1), describe(list));
      G.sfx('uhoh'); alarmTune(); shake(0.3);
      reveal(gx, gy, 3);
      if (list.includes('callum')) mentor('Sir Callum the Brave has arrived! He says: "Have at thee, Keepa! I\'ve finished this game TWICE, you know!"', null, 0, 'SIR CALLUM');
      else mentor(pick(['The heroes are coming, Keepa! Defend the Heart!', 'Do-gooders have come out of the Hero Gate. Ugh. They\'re smiling.', 'More heroes! Someone tell them we\'re not in.']) + (S.tut == null && S.time < 600 ? ' Press G to go and look at them.' : ''), null, 0);
    }
    function describe(list) {
      const c = {}; for (const k of list) c[k] = (c[k] || 0) + 1;
      return Object.keys(c).map(k => (c[k] > 1 ? c[k] + ' ' : '') + (k === 'callum' ? 'Sir Callum' : K[k].n + (c[k] > 1 ? 's' : ''))).join(', ');
    }

    // ---------------------------------------------------------------- traps, doors and the Workshop
    function trapTick(dt) {
      // manufacturing: a trickle from every Workshop tile, plus whatever the beasts working there hammer out
      S.mfg += dt * 0.2 * Math.min(rc(6), 9);
      if (S.tq.length) {
        const i = S.tq[0];
        if (!S.trap[i] || S.tb[i] || S.t_[i] !== CLAIM) S.tq.shift();
        else if (S.mfg >= TRAP[S.trap[i]].mfg) {
          S.mfg -= TRAP[S.trap[i]].mfg; S.tb[i] = 1; S.thp[i] = TRAP[S.trap[i]].door || 0; S.tq.shift();
          const x = i % W + 0.5, y = ((i / W) | 0) + 0.5; ring(x, y, '#c0d0e0', 1, 0.5); fx(x, y - 0.3, 's', '#ffd890', 4); float(x, y - 1, 'READY', '#c0d0e0');
          snd(() => { G.note(1200, 0.04, 'square'); G.note(900, 0.06, 'square'); }, 'built', 200);
          if (!S.firstTrap) { S.firstTrap = 1; mentor(`Your Workshop has made a ${TRAP[S.trap[i]].n}. Heroes, beware. (They won't. They never do.)`, null, 0); }
        }
      } else S.mfg = Math.min(S.mfg, 150);
      // traps go off under heroes
      for (const i of S.tl) if (S.tcd[i] > 0) S.tcd[i] -= dt;
      for (const h of S.heroList) {
        if (h.dead) continue;
        const i = tileOf(h); if (i < 0) continue;
        const k = S.trap[i]; if (!k || isDoor(k) || !S.tb[i] || S.tcd[i] > 0) continue;
        const x = i % W + 0.5, y = ((i / W) | 0) + 0.5;
        if (k === 1) { S.tcd[i] = 3; for (const o of S.heroList) if (dist2(o, { x, y }) < 0.9) hurt(o, 60); fx(x, y - 0.2, 'p', '#d0d8e8', 8); G.note(1500, 0.04, 'square'); G.note(700, 0.06, 'square'); }
        else if (k === 2) { S.tcd[i] = 8; for (let q = 0; q < 8; q++) S.clouds.push({ x: x + rnd(-1, 1), y: y + rnd(-1, 0.8), t: 3, t0: 3, col: '#8ac84a', dmg: 22 }); snd(() => { G.note(90, 0.3, 'sawtooth'); }, 'stink', 300); }
        else if (k === 3) { S.tcd[i] = 6; S.bolts.push({ x, y, t: 0.35 }); for (const o of S.heroList) if (dist2(o, { x, y }) < 1.7) hurt(o, 70); G.sfx('zap'); shake(0.15); }
        ring(x, y, k === 2 ? '#8ac84a' : '#ffffff', 1.2, 0.4);
        if (S.seen[i] && S.mode !== 'raid') snd(() => mentor(pick(['A trap has gone off. Tee hee.', 'Hero meets trap. Trap wins.', 'Ouch. For them.']), 'trapgo', 25), 'trapm', 1000);
        if (S.mode === 'raid') float(x, y - 1.2, 'TRAP!', '#ff6060');
      }
    }

    // ---------------------------------------------------------------- the main update
    function update(dt) {
      S.time += dt;
      S.heroList = heroes(); S.ourList = S.ents.filter(e => !e.hero && !e.dead && !e.held);
      S.visHeroes = S.mode === 'raid' ? S.heroList : S.heroList.filter(h => S.seen[tileOf(h)] || dist2(h, S.heartC) < 8);
      const live = S.mode === 'realm' || S.mode === 'endless';
      // the Mentor holds the heroes back while you do your lessons
      if (S.tut != null && S.tut < TUT.length - 1 && live) S.waveT = Math.max(S.waveT, 120);
      // waves (and the warnings before them)
      if (live && S.wave < nWaves()) {
        S.waveT -= dt;
        const wk = S.wave * 10;
        if (S.waveT <= 30 && S.warned < wk + 1) { S.warned = wk + 1; banner('HEROES IN 30 SECONDS!', describe(waveList(S.wave))); alarmTune(); mentor(`I can hear marching, Keepa. ${describe(waveList(S.wave))} will come out of the Hero Gate in 30 seconds. Get your beasts ready.`, null, 0); }
        if (S.waveT <= 10 && S.warned < wk + 2) { S.warned = wk + 2; snd(() => tune([988, 0, 988, 0, 988], 0.1), 'w10', 500); banner('10 SECONDS!'); }
        if (S.waveT <= 0) { spawnWave(S.wave); S.heroList = heroes(); S.wave++; S.warned = S.wave * 10; S.waveT = S.L.endless ? Math.max(110, S.L.gap - S.wave * 4) : S.L.gap; }
      }
      if (live && S.cleared < S.wave && !S.heroList.length) {
        S.cleared = S.wave;
        if (S.L.endless) { banner('WAVE ' + S.wave + ' BEATEN!', 'The next lot are on their way'); fanfare(); G.secret('keepa.heroes'); if (S.wave > G.load('best', 0)) G.save('best', S.wave); }
        else if (S.wave < nWaves()) { mentor(pick(['That\'s that lot sorted. Tidy up, Keepa: there are more on the way.', 'Wave beaten! Heal up and get ready for the next one.']), null, 0); fanfare(); }
      }
      if (S.mode === 'realm' && S.wave >= nWaves() && !S.gateOpen && !S.heroList.length) {
        S.gateOpen = true; G.secret('keepa.heroes'); banner('HEROES ROUTED!', 'Now smash their Hero Gate'); fanfare();
        mentor('The heroes are routed! Now smash their Hero Gate. Your beasts will march on it. Help them along with the Hand.', null, 0);
      }
      // payday
      if (live) {
        S.payT -= dt;
        if (S.payT <= 0) {
          S.payT = 150; let paid = 0, unpaid = 0;
          for (const e of beasts()) { const w = Math.round(K[e.k].wage * (1 + 0.25 * (e.lvl - 1))); if (S.gold >= w) { S.gold -= w; paid += w; float(e.x, e.y - 1.4, '-' + w, '#ffd400'); } else { unpaid++; e.happy -= 35; e.unpaidT = 40; } }
          if (unpaid) { mentor(`Payday! You couldn't pay ${unpaid} of your beasts. They are NOT happy, Keepa.`, null, 0); G.sfx('uhoh'); }
          else if (paid) { mentor(`Payday. Your beasts have been paid ${paid} gold. They've already spent it on sweets.`, null, 0); snd(() => { for (let k = 0; k < 4; k++) G.note(1200 + k * 200, 0.05, 'square'); }, 'pay', 500); }
        }
      }
      // no imps left? the Heart coughs one up, so a dungeon can never get stuck
      if (live) { S.impT = (S.impT || 0) - dt; if (S.impT <= 0) { S.impT = 25; if (imps().length < 2) { const e = spawn('imp', S.heartC.x + rnd(-1.5, 1.5), S.heartC.y + 2); e.stun = 0.5; fx(e.x, e.y - 0.4, 'p', '#ff8a00', 8); ring(e.x, e.y, '#ff8a00', 1, 0.4); mentor('Your Dungeon Heart has coughed up a fresh imp. Look after this one.', 'freeimp', 60); } } }
      // the portal
      const nb = beasts().length;
      if (live && S.portal) {
        S.arriveT -= dt;
        if (S.arriveT <= 0) {
          S.arriveT = rnd(16, 26);
          const cap = Math.min(rc(1), 16);
          if (!rc(1) || !rc(2)) mentor('Beasts won\'t come until you have a Lair AND a Hatchery, Keepa. Build them on your red claimed floor.', 'needrooms', 45);
          else if (nb < cap) {
            const ok = BEASTS.filter(k => !K[k].lure || rc(K[k].lure[0]) >= K[k].lure[1]);
            const counts = {}; for (const e of beasts()) counts[e.k] = (counts[e.k] || 0) + 1;
            const wts = ok.map(k => 1 / (1 + (counts[k] || 0)) * (k === 'gretchin' ? 0.7 : 1.4)); let r = Math.random() * wts.reduce((a, b) => a + b, 0), k = ok[0];
            for (let q = 0; q < ok.length; q++) { r -= wts[q]; if (r <= 0) { k = ok[q]; break; } }
            const e = spawn(k, S.portalC.x, S.portalC.y); assignLair(e); e.think = 0.5;
            fx(e.x, e.y - 0.5, 'p', '#c070ff', 12); ring(e.x, e.y - 0.3, '#c070ff', 1.6, 0.6); G.sfx('join');
            mentor(`A ${K[k].n} has come through the Portal. ${pick(['It\'s called ', 'Say hello to ', 'Its name is '])}${e.name}.${!counts[k] && k !== 'gretchin' ? ' ' + K[k].d : ''}`, null, 0);
            if (k === 'mage' && e.name === 'Mystic Dave') mentor('No relation to the Dave who borrows your games. Probably.', null, 0);
          } else if (nb >= cap && cap < 16) mentor('Your Lair is full. Make it bigger and more beasts will come.', 'lairfull', 60);
        }
      }
      // chickens (and the Cluck Storm's free-range ones)
      S.chickT -= dt;
      if (S.chickT <= 0) { S.chickT = 4; if (rc(2) && S.chickens.filter(c => !c.free).length < rc(2) + 1) { const i = pick(S.rl[2]); S.chickens.push({ x: i % W + 0.5, y: ((i / W) | 0) + 0.5, tx: i % W + 0.5, ty: ((i / W) | 0) + 0.5, t: 0, anim: 0 }); } }
      for (let q = S.chickens.length - 1; q >= 0; q--) {
        const c = S.chickens[q], ti = tileAt(Math.floor(c.x), Math.floor(c.y));
        if (c.drop > 0) { c.drop -= dt; continue; }
        if (c.free) { c.life -= dt; if (c.life <= 0 || ti < 0 || !isWalk(S.t_[ti])) { fx(c.x, c.y - 0.3, 'p', '#f0f0f0', 4); S.chickens.splice(q, 1); continue; } }
        else if (S.room[ti] !== 2) { S.chickens.splice(q, 1); continue; }
        c.t -= dt;
        if (c.t <= 0) { c.t = rnd(1, 3); const opts = [ti]; const x = ti % W, y = (ti / W) | 0; for (const [dx, dy] of N4) { const n = tileAt(x + dx, y + dy); if (n >= 0 && (c.free ? isWalk(S.t_[n]) : S.room[n] === 2)) opts.push(n); } const g = pick(opts); c.tx = g % W + rnd(0.25, 0.75); c.ty = ((g / W) | 0) + rnd(0.3, 0.8); }
        const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
        if (d > 0.02) { const s = Math.min(d, dt * (c.panic > 0 ? 3 : 0.7)); c.x += dx / d * s; c.y += dy / d * s; c.anim += dt * (c.panic > 0 ? 20 : 8); c.face = dx < 0 ? -1 : 1; }
        if (c.panic > 0) c.panic -= dt;
      }
      // entities
      for (const e of S.ents) {
        if (e.dead || e.held) continue;
        e.cd -= dt; e.flash -= dt; e.atk = (e.atk || 0) - dt; e.squashT -= dt;
        if (e.fallT > 0) { e.fallT -= dt; if (e.fallT <= 0) landed(e); continue; }
        if (e.slapT > 0) e.slapT -= dt; if (e.speedT > 0) e.speedT -= dt;
        if (e.stun > 0) { e.stun -= dt; continue; }
        if (e.hero) heroAI(e, dt); else if (e.k === 'imp') impAI(e, dt); else beastAI(e, dt);
        if (!e.hero) { const ti = tileOf(e); if (ti >= 0 && S.t_[ti] === LAVA) hurt(e, dt * 30); }
      }
      if (S.ents.some(e => e.dead)) S.ents = S.ents.filter(e => !e.dead);
      if (S.raid && S.raid.focus && S.raid.focus.dead) S.raid.focus = null;
      // traps + stink clouds
      if (S.mode !== 'tour') trapTick(dt);
      for (let q = S.clouds.length - 1; q >= 0; q--) { const c = S.clouds[q]; c.t -= dt; c.x += rnd(-0.3, 0.3) * dt; c.y -= dt * 0.15; if (c.dmg) for (const h of S.heroList) if (!h.dead && dist2(h, c) < 0.9) hurt(h, c.dmg * dt / 2.5); if (c.t <= 0) S.clouds.splice(q, 1); }
      // shots
      for (let q = S.shots.length - 1; q >= 0; q--) {
        const s = S.shots[q]; s.t -= dt;
        const tg = s.tgt; if (tg.dead || s.t <= 0) { S.shots.splice(q, 1); continue; }
        const tx = tg.x, ty = tg.y - 0.5, dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy), st = dt * 8;
        if (d <= st) { applyHit(tg, s.dmg, s.from); fx(tx, ty, 's', s.col, 3); S.shots.splice(q, 1); continue; }
        s.x += dx / d * st; s.y += dy / d * st;
      }
      // fx + floaters + bolts + rings
      for (let q = S.fx.length - 1; q >= 0; q--) { const p = S.fx[q]; p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.kind === 'c' ? 9 : 6) * dt; if (p.t <= 0) S.fx.splice(q, 1); }
      for (let q = S.floats.length - 1; q >= 0; q--) { const f = S.floats[q]; f.t -= dt; f.y -= dt * 0.9; if (f.t <= 0) S.floats.splice(q, 1); }
      for (let q = S.bolts.length - 1; q >= 0; q--) { S.bolts[q].t -= dt; if (S.bolts[q].t <= 0) S.bolts.splice(q, 1); }
      for (let q = S.rings.length - 1; q >= 0; q--) { S.rings[q].t -= dt; if (S.rings[q].t <= 0) S.rings.splice(q, 1); }
      S.heartFlash -= dt; S.gateFlash -= dt; S.heartHitT -= dt;
      if (S.rally) { S.rally.t -= dt; if (S.rally.t <= 0) { S.rally = null; for (const e of beasts()) if (e.st === 'rally') { e.st = 'idle'; e.think = 0; } } }
      if (live && S.heartHp < S.heartMax && !S.heroList.some(h => dist2(h, S.heartC) < 4)) S.heartHp = Math.min(S.heartMax, S.heartHp + dt * 3);
      // seeing: your creatures light the way (in a raid, your heroes do)
      S.seenT -= dt;
      if (S.seenT <= 0) { S.seenT = 0.4; for (const e of (S.mode === 'raid' ? S.heroList : S.ourList)) reveal(Math.floor(e.x), Math.floor(e.y), 4); }
      if (S.mode === 'raid') { raidTick(dt); return; }
      if (!live) return;
      // tips + autosave
      S.tipT -= dt; if (S.tipT <= 0) { S.tipT = rnd(80, 120); if (opt.tips && S.tut == null) mentor(pick(TIPS)); }
      S.autoT -= dt; if (S.autoT <= 0) { S.autoT = 60; G.save('auto', serial()); }
      // nudges
      if (S.tut == null) {
        if (S.time > 25 && S.dug === 0 && !S.mark.some(Boolean)) mentor('Click on the brown earth to mark it for digging, Keepa. The imps will do the rest.', 'nudgedig', 40);
        if (S.time > 120 && !S.portal) mentor('Dig towards the Portal, Keepa. It\'s the swirly stone ring. The imps must claim the floor next to it.', 'nudgeportal', 90);
      }
      // the end
      if (S.heartHp <= 0 && !S.done) lose();
      else if (S.gateHp <= 0 && !S.done && !S.L.endless) win();
    }
    function landed(e) {
      e.fallT = 0; e.squashT = 0.2; ring(e.x, e.y, 'rgba(220,200,170,.9)', 0.9, 0.3); fx(e.x, e.y, 'p', '#8a7a6a', 6); G.sfx('thud'); shake(0.12);
      if (!e.hero && e.k !== 'imp') { const f = nearest(e, S.heroList, 3); if (f) { e.st = 'fight'; e.tgt = f; e.path = []; float(e.x, e.y - 1.5, '!', '#ff4040'); } }
    }

    // ---------------------------------------------------------------- rendering
    function clampCam() {
      const mw = W * TS, mh = H * TS;
      cam.x = vw >= mw ? (mw - vw) / 2 : clamp(cam.x, 0, mw - vw);
      cam.y = vh >= mh ? (mh - vh) / 2 : clamp(cam.y, 0, mh - vh);
    }
    function resize() {
      const r = map.getBoundingClientRect(); if (!r.width || !r.height) return;
      scale = zoom;
      const nw = Math.max(64, Math.ceil(r.width / scale)), nh = Math.max(64, Math.ceil(r.height / scale));
      const cx = cam.x + vw / 2, cy = cam.y + vh / 2;
      if (nw !== cv.width || nh !== cv.height) { cv.width = nw; cv.height = nh; lc.width = nw; lc.height = nh; }
      vw = nw; vh = nh;
      cv.style.width = nw * scale + 'px'; cv.style.height = nh * scale + 'px';
      cam.x = cx - vw / 2; cam.y = cy - vh / 2; if (S) clampCam();
    }
    const ro = new ResizeObserver(resize); ro.observe(map); G.onClose(() => ro.disconnect());
    const lookAt = (x, y) => { cam.x = x * TS - vw / 2; cam.y = y * TS - vh / 2; clampCam(); };

    let mouse = null, hover = -1, now = 0, lights = [];
    const light = (x, y, r, a, warm) => { if (lights.length < 120) lights.push(x, y, r, a, warm ? 1 : 0); };
    const torchAt = i => { const x = i % W, y = (i / W) | 0; return S.t_[i] === CLAIM && y > 0 && S.t_[i - W] === WALL && (x * 3 + y * 5) % 4 === 0; };
    function drawTile(i, px, py) {
      const t = S.t_[i], v = (i * 2654435761 >>> 7);
      let img;
      if (t === LAVA) img = TL[LAVA][(Math.floor(now / 260) + v) % 4];
      else if (t === WATER) img = TL[WATER][(Math.floor(now / 500) + v) % 2];
      else if (t === HEART) img = TL[CLAIM][0];
      else if (t === PORTAL) img = TL[DIRT][v % 3];
      else if (t === GATE) img = TL[HFLOOR][0];
      else { const set = TL[t]; img = set[v % set.length]; }
      ctx.drawImage(img, px, py);
      if (t === LAVA && (v & 3) === 0) light(px + 8, py + 8, 22, 0.5, 1);
      if (t === GOLD && ((now / 90 + v) % 40) < 2) { ctx.fillStyle = '#fff'; const sx = px + 3 + v % 10, sy = py + 3 + (v >> 4) % 10; ctx.fillRect(sx, sy - 1, 1, 3); ctx.fillRect(sx - 1, sy, 3, 1); }
      if (t === GEM && (v & 1)) light(px + 8, py + 8, 14, 0.35);
      if (!isSolid(t)) {
        const up = i - W;
        if (up >= 0 && isSolid(S.t_[up]) && S.seen[up]) { const f = TL.face[S.t_[up]]; ctx.fillStyle = f[0]; ctx.fillRect(px, py, TS, 5); ctx.fillStyle = f[1]; ctx.fillRect(px, py, TS, 1); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(px, py + 5, TS, 2); }
      }
      const rm = S.room[i];
      if (rm) drawRoom(i, rm, px, py, v);
      if (S.trap[i]) drawTrap(i, px, py);
      if (torchAt(i)) { // a wall torch on the face above
        const fl = Math.floor(now / 110 + v) % 3;
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(px + 7, py + 1, 2, 5); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(px + 6, py + 1, 4, 1);
        ctx.fillStyle = fl === 0 ? '#ffd400' : fl === 1 ? '#ff8a00' : '#ffb000'; ctx.fillRect(px + 6, py - 3 + (fl === 2 ? 1 : 0), 4, 4);
        ctx.fillStyle = '#fff6a0'; ctx.fillRect(px + 7, py - 2 + (fl ? 1 : 0), 2, 2);
        light(px + 8, py, 46 + fl * 2, 0.95, 1);
      }
      if (S.mark[i]) {
        ctx.fillStyle = 'rgba(255,212,0,.28)'; ctx.fillRect(px, py, TS, TS);
        ctx.fillStyle = 'rgba(255,230,80,.75)';
        for (let k = 0; k < TS; k += 4) { ctx.fillRect(px + k, py + (TS - 1 - k), 2, 1); }
        ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, TS - 1, TS - 1);
        if (S.hp[i]) { // cracks that grow as the imps chip away
          const f = S.hp[i] / (S.t_[i] === WALL ? 9 : 4); ctx.fillStyle = '#1a0e06';
          const n = Math.ceil(f * 6); for (let k = 0; k < n; k++) { const a = (v >> k) & 15; ctx.fillRect(px + 2 + (a % 11), py + 2 + ((a * 7) % 11), 1 + (k % 2), 2 + (k % 3)); ctx.fillRect(px + 3 + ((a * 5) % 10), py + 4 + ((a * 3) % 9), 3, 1); }
          ctx.fillStyle = '#000'; ctx.fillRect(px + 2, py + 12, 12, 2); ctx.fillStyle = '#ffd400'; ctx.fillRect(px + 2, py + 12, Math.round(12 * f), 2);
        }
      }
    }
    function drawTrap(i, px, py, X) {
      X = X || ctx;
      const k = S.trap[i], built = S.tb[i] === 1;
      X.save(); if (!built) X.globalAlpha = 0.45 + 0.15 * Math.sin(now / 200);
      if (k === 4 || k === 5) {
        const iron = k === 5;
        X.fillStyle = '#000'; X.fillRect(px + 1, py, 14, 16);
        X.fillStyle = iron ? '#8a929e' : '#8a5a2a'; X.fillRect(px + 2, py + 1, 12, 15);
        X.fillStyle = iron ? '#5a626e' : '#6a4018'; for (let q = 0; q < 3; q++) X.fillRect(px + 2 + q * 4, py + 1, 1, 15);
        X.fillStyle = iron ? '#c0c8d0' : '#3a2a1a'; X.fillRect(px + 2, py + 4, 12, 1); X.fillRect(px + 2, py + 11, 12, 1);
        if (iron) { X.fillStyle = '#e0e8f0'; for (const [a, b] of [[3, 3], [12, 3], [3, 12], [12, 12]]) X.fillRect(px + a, py + b, 1, 1); }
        X.fillStyle = '#ffd400'; X.fillRect(px + 11, py + 8, 2, 1);
        if (built && S.thp[i] < TRAP[k].door) { X.fillStyle = '#000'; X.fillRect(px + 2, py - 3, 12, 2); X.fillStyle = '#ffb000'; X.fillRect(px + 2, py - 3, Math.round(12 * S.thp[i] / TRAP[k].door), 2); }
      } else {
        X.fillStyle = '#2a2a30'; X.fillRect(px + 3, py + 4, 10, 9); X.fillStyle = '#5a5a66'; X.fillRect(px + 4, py + 5, 8, 7);
        const fired = S.tcd[i] > 0;
        if (k === 1) { X.fillStyle = '#d0d8e8'; for (let q = 0; q < 3; q++) for (let r = 0; r < 2; r++) { const sx = px + 5 + q * 3, sy = py + 6 + r * 3; if (fired && S.tcd[i] > 2.4) { X.fillRect(sx, sy - 5, 1, 6); } else X.fillRect(sx, sy, 1, 1); } }
        else if (k === 2) { X.fillStyle = '#6aa83a'; X.beginPath(); X.arc(px + 8, py + 9, 3, 0, 7); X.fill(); X.fillStyle = '#c0f080'; X.fillRect(px + 7, py + 7, 1, 1); X.fillStyle = '#3a2a1a'; X.fillRect(px + 8, py + 4, 1, 3); }
        else if (k === 3) { X.fillStyle = fired ? '#4a4a6a' : '#ffffa0'; X.beginPath(); X.moveTo(px + 9, py + 5); X.lineTo(px + 6, py + 9); X.lineTo(px + 8, py + 9); X.lineTo(px + 7, py + 12); X.lineTo(px + 10, py + 8); X.lineTo(px + 8, py + 8); X.fill(); if (!fired && built) light(px + 8, py + 8, 10, 0.4); }
      }
      if (!built) { X.globalAlpha = 1; X.strokeStyle = '#c0d0e0'; X.setLineDash([2, 2]); X.strokeRect(px + 0.5, py + 0.5, 15, 15); X.setLineDash([]); if (S.tq[0] === i) { const need = TRAP[k].mfg; X.fillStyle = '#000'; X.fillRect(px + 2, py + 13, 12, 2); X.fillStyle = '#c0d0e0'; X.fillRect(px + 2, py + 13, Math.round(12 * clamp(S.mfg / need, 0, 1)), 2); } }
      X.restore();
    }
    function drawRoom(i, rm, px, py, v) {
      const x = i % W, y = (i / W) | 0;
      const same = (dx, dy) => { const n = tileAt(x + dx, y + dy); return n >= 0 && S.room[n] === rm; };
      if (rm === 1) { // lair: straw nests
        ctx.fillStyle = '#5a2a14'; ctx.fillRect(px + 2, py + 3, 12, 10);
        ctx.fillStyle = '#c8a040'; ctx.fillRect(px + 3, py + 4, 10, 8); ctx.fillStyle = '#e8c860'; for (let k = 0; k < 5; k++) ctx.fillRect(px + 3 + (v + k * 3) % 9, py + 5 + (k * 2) % 6, 3, 1);
        ctx.fillStyle = '#8a6a20'; ctx.fillRect(px + 5, py + 7, 6, 3);
      } else if (rm === 2) { // hatchery: grass and fence
        ctx.fillStyle = '#2e6a22'; ctx.fillRect(px, py, TS, TS); ctx.fillStyle = '#4a9a2a'; for (let k = 0; k < 7; k++) ctx.fillRect(px + (v * (k + 3)) % 14, py + (v >> (k + 1)) % 14, 1, 2);
        ctx.fillStyle = '#8a6a2a';
        if (!same(0, -1)) { ctx.fillRect(px, py + 1, TS, 2); ctx.fillRect(px + 2, py, 2, 5); ctx.fillRect(px + 11, py, 2, 5); }
        if (!same(0, 1)) ctx.fillRect(px, py + 13, TS, 2);
        if (!same(-1, 0)) ctx.fillRect(px + 1, py, 2, TS);
        if (!same(1, 0)) ctx.fillRect(px + 13, py, 2, TS);
      } else if (rm === 3) { // treasury: gold piles that grow
        ctx.fillStyle = 'rgba(255,212,0,.12)'; ctx.fillRect(px, py, TS, TS);
        const full = clamp(S.gold / goldCap(), 0, 1), fr = S.rl[3].indexOf(i) / Math.max(1, rc(3)), piles = fr < full ? 3 : fr < full + 0.25 ? 1 : 0;
        for (let k = 0; k < piles; k++) { const cx = px + 3 + k * 4, cy = py + 9 - (k % 2) * 3; ctx.fillStyle = '#a07000'; ctx.fillRect(cx, cy + 2, 6, 2); ctx.fillStyle = '#ffd400'; ctx.fillRect(cx + 1, cy, 4, 3); ctx.fillStyle = '#fff6a0'; ctx.fillRect(cx + 2, cy, 1, 1); }
        if (piles === 3 && (v & 3) === 0) light(px + 8, py + 8, 18, 0.45, 1);
        ctx.fillStyle = '#ffd400';
        if (!same(0, -1)) ctx.fillRect(px, py, TS, 1); if (!same(0, 1)) ctx.fillRect(px, py + 15, TS, 1); if (!same(-1, 0)) ctx.fillRect(px, py, 1, TS); if (!same(1, 0)) ctx.fillRect(px + 15, py, 1, TS);
      } else if (rm === 4) { // training: sand and dummies
        ctx.fillStyle = '#8a7650'; ctx.fillRect(px + 1, py + 1, 14, 14); ctx.fillStyle = '#9a8660'; ctx.fillRect(px + 2, py + 2, 5, 1); ctx.fillRect(px + 8, py + 10, 5, 1);
        if ((x + y) % 2 === 0) { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(px + 7, py + 4, 2, 10); ctx.fillRect(px + 4, py + 6, 8, 2); ctx.fillStyle = '#c8a070'; ctx.fillRect(px + 6, py + 2, 4, 3); }
      } else if (rm === 5) { // library: shelves and candles
        ctx.fillStyle = '#3a2214'; ctx.fillRect(px, py, TS, TS); ctx.fillStyle = '#4a2c1a'; ctx.fillRect(px + 1, py + 1, 14, 14);
        if (!same(0, -1) || (x + y) % 3 === 0) { ctx.fillStyle = '#2a1408'; ctx.fillRect(px, py, TS, 7); const cols = ['#a02020', '#2050a0', '#20a040', '#a08020', '#7020a0']; for (let k = 0; k < 7; k++) { ctx.fillStyle = cols[(k + v) % 5]; ctx.fillRect(px + 1 + k * 2, py + 1, 1, 5); } }
        else { ctx.fillStyle = '#e8e0c0'; ctx.fillRect(px + 5, py + 8, 6, 4); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(px + 7, py + 12, 2, 3); }
        if ((x * 7 + y) % 5 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(px + 13, py + 10, 1, 3); ctx.fillStyle = (now / 120 + v) % 2 < 1 ? '#ffd400' : '#ff8a00'; ctx.fillRect(px + 13, py + 8, 1, 2); light(px + 13, py + 8, 20, 0.6, 1); }
      } else if (rm === 6) { // workshop: steel floor, anvils, a glowing forge
        ctx.fillStyle = '#4a4e56'; ctx.fillRect(px, py, TS, TS); ctx.fillStyle = '#5a5e68'; ctx.fillRect(px + 1, py + 1, 6, 6); ctx.fillRect(px + 9, py + 9, 6, 6);
        ctx.fillStyle = '#3a3e46'; ctx.fillRect(px, py + 7, TS, 1); ctx.fillRect(px + 7, py, 1, TS);
        if ((x * 3 + y) % 4 === 0) { ctx.fillStyle = '#1a1a20'; ctx.fillRect(px + 3, py + 8, 10, 3); ctx.fillRect(px + 5, py + 11, 6, 3); ctx.fillStyle = '#6a6e78'; ctx.fillRect(px + 3, py + 8, 10, 1); }
        else if ((x + y * 3) % 5 === 0) { const fl = Math.floor(now / 150 + v) % 2; ctx.fillStyle = '#3a2a2a'; ctx.fillRect(px + 3, py + 5, 10, 9); ctx.fillStyle = fl ? '#ff6a00' : '#ffb000'; ctx.fillRect(px + 5, py + 7, 6, 4); light(px + 8, py + 9, 26, 0.7, 1); }
        ctx.fillStyle = '#8a9aaa'; if (!same(0, -1)) ctx.fillRect(px, py, TS, 1); if (!same(0, 1)) ctx.fillRect(px, py + 15, TS, 1); if (!same(-1, 0)) ctx.fillRect(px, py, 1, TS); if (!same(1, 0)) ctx.fillRect(px + 15, py, 1, TS);
      }
    }
    function drawHeart() {
      const [hx, hy] = S.L.heart, x0 = (hx - 1) * TS, y0 = (hy - 1) * TS, cx = x0 + 24, cy = y0 + 24;
      ctx.fillStyle = '#2a0606'; ctx.fillRect(x0 + 1, y0 + 1, 46, 46);
      ctx.fillStyle = '#4a0c0c'; ctx.fillRect(x0 + 4, y0 + 4, 40, 40);
      ctx.fillStyle = '#1a1a20'; for (const [a, b] of [[2, 2], [38, 2], [2, 38], [38, 38]]) { ctx.fillRect(x0 + a, y0 + b - 4, 8, 12); ctx.fillStyle = '#e02020'; ctx.fillRect(x0 + a + 3, y0 + b - 6, 2, 3); ctx.fillStyle = '#1a1a20'; }
      const pulse = 1 + 0.12 * Math.sin(now / 180) + (S.heartFlash > 0 ? 0.15 : 0);
      ctx.fillStyle = '#000'; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + now / 3000; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18); ctx.lineTo(cx + Math.cos(a + 0.2) * 11, cy + Math.sin(a + 0.2) * 11); ctx.lineTo(cx + Math.cos(a - 0.2) * 11, cy + Math.sin(a - 0.2) * 11); ctx.fill(); }
      const g = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, 12 * pulse);
      g.addColorStop(0, S.heartFlash > 0 ? '#ffffff' : '#ffd0d0'); g.addColorStop(0.45, '#ff2020'); g.addColorStop(1, '#500000');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 12 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(cx - 6, cy - 7, 3, 2);
      if (S.heartHp < S.heartMax) { ctx.fillStyle = '#000'; ctx.fillRect(x0 + 6, y0 - 4, 36, 3); ctx.fillStyle = '#ff3030'; ctx.fillRect(x0 + 6, y0 - 4, Math.round(36 * Math.max(0, S.heartHp) / S.heartMax), 3); }
      light(cx, cy, 80 * pulse, 1, 0); light(cx, cy, 30, 0.6, 1);
    }
    function drawPortal() {
      const [px, py] = S.L.portal, cx = px * TS + 8, cy = py * TS + 8;
      ctx.fillStyle = '#2a2a32'; ctx.beginPath(); ctx.arc(cx, cy, 21, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a5a66'; for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; ctx.fillRect(Math.round(cx + Math.cos(a) * 18) - 2, Math.round(cy + Math.sin(a) * 18) - 2, 4, 4); }
      if (S.portal) {
        for (let k = 0; k < 6; k++) { ctx.strokeStyle = k % 2 ? '#c070ff' : '#4060ff'; ctx.lineWidth = 2; ctx.beginPath(); const a = now / 400 + k * 1.05; ctx.arc(cx, cy, 4 + k * 2.2, a, a + 2.4); ctx.stroke(); }
        ctx.fillStyle = '#fff'; ctx.fillRect(cx - 1, cy - 1, 2, 2);
        light(cx, cy, 60, 0.9);
      } else { ctx.fillStyle = '#14141a'; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 4); ctx.stroke(); light(cx, cy, 30, 0.5); }
    }
    function drawGate() {
      const [gx, gy] = S.L.gate, x0 = (gx - 1) * TS, y0 = (gy - 1) * TS;
      ctx.fillStyle = '#9a9a8a'; ctx.fillRect(x0 + 2, y0 + 8, 44, 38);
      ctx.fillStyle = '#e0dccc'; ctx.fillRect(x0 + 4, y0 + 6, 10, 40); ctx.fillRect(x0 + 34, y0 + 6, 10, 40); ctx.fillRect(x0 + 4, y0 + 4, 40, 8);
      ctx.fillStyle = '#d0a020'; ctx.fillRect(x0 + 4, y0 + 4, 40, 2); ctx.fillRect(x0 + 22, y0, 4, 6);
      const glow = S.gateOpen ? ['#ff6a3a', '#801000'] : ['#a0d0ff', '#2050c0'];
      const g = ctx.createLinearGradient(0, y0 + 12, 0, y0 + 46); g.addColorStop(0, glow[0]); g.addColorStop(1, glow[1]);
      ctx.fillStyle = g; ctx.fillRect(x0 + 14, y0 + 12, 20, 34);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.2 * Math.sin(now / 300)) + ')'; ctx.fillRect(x0 + 16, y0 + 14, 3, 30);
      ctx.fillStyle = '#2a5ad8'; ctx.fillRect(x0 + 6, y0 + 14, 6, 10); ctx.fillRect(x0 + 36, y0 + 14, 6, 10); ctx.fillStyle = '#ffd400'; ctx.fillRect(x0 + 8, y0 + 17, 2, 3); ctx.fillRect(x0 + 38, y0 + 17, 2, 3);
      const dmg = 1 - S.gateHp / S.gateMax; ctx.fillStyle = '#3a3a30';
      for (let k = 0; k < Math.floor(dmg * 8); k++) { const cx = x0 + 6 + (k * 13) % 36, cy = y0 + 8 + (k * 7) % 30; ctx.fillRect(cx, cy, 1, 4); ctx.fillRect(cx + 1, cy + 3, 1, 3); }
      if (S.gateFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x0 + 2, y0 + 2, 44, 44); }
      if (S.gateOpen) { ctx.fillStyle = '#000'; ctx.fillRect(x0 + 6, y0 - 5, 36, 3); ctx.fillStyle = '#60a0ff'; ctx.fillRect(x0 + 6, y0 - 5, Math.round(36 * Math.max(0, S.gateHp) / S.gateMax), 3); }
      light(x0 + 24, y0 + 28, 70, 1);
    }
    function drawEnt(e) {
      const s = SP[e.k] || SP.imp, moving = e.path.length || e.st === 'sleep';
      const fr = (moving || e.job || e.atk > 0) && Math.floor(e.anim) % 2 ? (e.face < 0 ? s.bf : s.b) : (e.face < 0 ? s.af : s.a);
      const px = Math.round(e.x * TS), py = Math.round(e.y * TS);
      const sl = e.st === 'sleeping', lift = e.fallT > 0 ? Math.round(e.fallT * 120) : 0;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(px - 4, py + 4, 8, 2); ctx.fillRect(px - 3, py + 3, 6, 4);
      if (sl) { ctx.save(); ctx.translate(px, py + 2); ctx.rotate(-Math.PI / 2 * (e.face < 0 ? -1 : 1)); ctx.drawImage(fr, -fr.width / 2, -fr.height / 2); ctx.restore(); }
      else {
        const bob = (e.st === 'eating' || e.st === 'train' || e.st === 'craft') ? Math.round(Math.sin(e.anim) * 1) : 0;
        const dx = px - Math.floor(fr.width / 2), dy = py + 5 - fr.height + bob - lift;
        if (e.squashT > 0) { const q = e.squashT / 0.25; ctx.save(); ctx.translate(px, py + 5); ctx.scale(1 + 0.3 * q, 1 - 0.3 * q); ctx.drawImage(fr, -Math.floor(fr.width / 2), -fr.height); ctx.restore(); }
        else ctx.drawImage(fr, dx, dy);
        if (e.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; ctx.drawImage(fr, dx, dy); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
        weapon(e, px, dy, fr);
        if (e.carry > 0) { ctx.fillStyle = '#a07000'; ctx.fillRect(px - 2, dy - 4, 5, 4); ctx.fillStyle = '#ffd400'; ctx.fillRect(px - 1, dy - 4, 3, 3); }
      }
      const top = py + 5 - fr.height - 4 - lift;
      if (e.hp < e.mhp || e.st === 'fight' || e.hero && S.seen[tileOf(e)]) {
        const bw = e.k === 'callum' || e.k === 'troll' || e.k === 'belcher' ? 14 : 10;
        ctx.fillStyle = '#000'; ctx.fillRect(px - bw / 2 - 1, top - 1, bw + 2, 3);
        ctx.fillStyle = e.hero ? '#5aa0ff' : '#3ae03a'; ctx.fillRect(px - bw / 2, top, Math.max(0, Math.round(bw * e.hp / e.mhp)), 1);
      }
      if (!e.hero && e.k !== 'imp') {
        if (e.lvl > 1) ptext(ctx, String(e.lvl), px + 8, top - 2, '#80ff60');
        if (e.happy < 25 && !visiting() && Math.floor(now / 400) % 2) ptext(ctx, '!', px - 8, top - 2, '#ff4040');
      }
      if (S.raid && S.raid.focus === e) { ctx.strokeStyle = Math.floor(now / 150) % 2 ? '#ff4040' : '#ffd400'; ctx.lineWidth = 1; ctx.strokeRect(px - 7.5, top - 3.5, 15, fr.height + 6); }
      if (e.slapT > 0 && Math.floor(now / 100) % 3 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(px - 8 * e.face, py - 2, 3, 1); ctx.fillRect(px - 9 * e.face, py + 1, 3, 1); }
      if (e.speedT > 0 && Math.floor(now / 80) % 2) { ctx.fillStyle = '#80ffff'; ctx.fillRect(px - 7 * e.face, py - 4, 2, 1); ctx.fillRect(px - 8 * e.face, py, 3, 1); }
      light(px, py - 4, e.hero ? 30 : e.k === 'imp' ? 16 : 22, e.hero ? 0.8 : 0.55, e.hero);
    }
    function weapon(e, px, dy, fr) {
      const f = e.face, sw = e.atk > 0 || (e.job && e.job.phase === 'work') || e.st === 'craft' ? Math.sin(e.anim * 1.6) : 0;
      ctx.save(); ctx.translate(px + f * 4, dy + fr.height - 6);
      if (e.k === 'imp' && e.job && e.job.phase === 'work') { ctx.rotate(f * (-0.6 + sw * 0.9)); ctx.fillStyle = '#8a6430'; ctx.fillRect(0, -6, 1, 7); ctx.fillStyle = '#b0b0b8'; ctx.fillRect(-2, -7, 5, 2); }
      else if (e.k === 'gretchin') { ctx.rotate(f * (0.2 + sw * 0.5)); ctx.fillStyle = '#8a6430'; ctx.fillRect(0, -10, 1, 12); ctx.fillStyle = '#d0d8e8'; ctx.fillRect(-1, -12, 3, 3); }
      else if (e.k === 'troll') { ctx.rotate(f * (0.2 + sw * 0.8)); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(0, -9, 2, 11); ctx.fillStyle = '#7a7a86'; ctx.fillRect(-2, -12, 6, 4); }
      else if (e.k === 'knight' || e.k === 'callum') { ctx.rotate(f * (0.3 + sw * 0.8)); ctx.fillStyle = '#e8eef8'; ctx.fillRect(0, -9, 2, 9); ctx.fillStyle = '#d0a020'; ctx.fillRect(-2, 0, 6, 1); }
      else if (e.k === 'dwarf') { ctx.rotate(f * (0.3 + sw * 0.9)); ctx.fillStyle = '#8a6430'; ctx.fillRect(0, -8, 1, 9); ctx.fillStyle = '#c0c8d0'; ctx.fillRect(f > 0 ? 1 : -3, -8, 3, 4); }
      else if (e.k === 'archer') { ctx.strokeStyle = '#8a6430'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(f * 1, -3, 4, f > 0 ? -1.4 : 1.7, f > 0 ? 1.4 : 4.5); ctx.stroke(); }
      else if (e.k === 'mage' || e.k === 'wizard') { ctx.fillStyle = '#6a4a20'; ctx.fillRect(0, -10, 1, 13); ctx.fillStyle = e.k === 'mage' ? '#c070ff' : '#60c0ff'; ctx.fillRect(-1, -12, 3, 3); if (e.atk > 0 || e.st === 'research') { ctx.fillStyle = '#fff'; ctx.fillRect(0, -11, 1, 1); } }
      ctx.restore();
    }
    // an arrow at the edge of the view pointing at (wx, wy) world pixels, or bobbing over it if it's on screen
    function pointer(wx, wy, col, ox, oy) {
      const sx = wx - ox, sy = wy - oy, m = 10;
      if (sx >= m && sy >= m + 8 && sx <= vw - m && sy <= vh - m) {
        const b = Math.round(Math.abs(Math.sin(now / 200)) * 4), y = sy - 22 - b;
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(sx - 6, y - 1); ctx.lineTo(sx + 6, y - 1); ctx.lineTo(sx, y + 8); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx - 4, y); ctx.lineTo(sx + 4, y); ctx.lineTo(sx, y + 6); ctx.fill();
        return;
      }
      const cx = vw / 2, cy = vh / 2, a = Math.atan2(sy - cy, sx - cx);
      const k = Math.min((vw / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (vh / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
      const ex = cx + Math.cos(a) * k, ey = cy + Math.sin(a) * k, p = 1 + 0.2 * Math.sin(now / 150);
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.scale(p, p);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -7); ctx.lineTo(-5, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.fill();
      ctx.restore();
    }
    let slapFx = null;
    function render(dt) {
      if (!S) return;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, vw, vh);
      lights.length = 0;
      let sx = 0, sy = 0; if (shakeT > 0) { shakeT -= dt; sx = Math.round(rnd(-2, 2)); sy = Math.round(rnd(-2, 2)); }
      const ox = Math.round(cam.x) + sx, oy = Math.round(cam.y) + sy;
      ctx.save(); ctx.translate(-ox, -oy);
      const x0 = Math.max(0, Math.floor(ox / TS)), y0 = Math.max(0, Math.floor(oy / TS)), x1 = Math.min(W - 1, Math.floor((ox + vw) / TS)), y1 = Math.min(H - 1, Math.floor((oy + vh) / TS));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x; if (S.seen[i]) drawTile(i, x * TS, y * TS); }
      const inView = c => c[0] + 2 >= x0 && c[0] - 2 <= x1 && c[1] + 2 >= y0 && c[1] - 2 <= y1;
      if (inView(S.L.portal) && S.seen[S.L.portal[1] * W + S.L.portal[0]]) drawPortal();
      if (inView(S.L.heart) && S.seen[S.L.heart[1] * W + S.L.heart[0]]) drawHeart();
      if (inView(S.L.gate) && S.seen[S.L.gate[1] * W + S.L.gate[0]]) drawGate();
      // Call to Arms banner / raid flag
      const flag = S.rally ? [S.rally.x, S.rally.y, '#e02020', S.rally.t / 25] : S.raid && S.raid.order >= 0 ? [S.raid.order % W + 0.5, ((S.raid.order / W) | 0) + 0.5, '#2a6ad8', 1] : null;
      if (flag) { const fx0 = Math.round(flag[0] * TS), fy0 = Math.round(flag[1] * TS), wv = Math.round(Math.sin(now / 150) * 1.5); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(fx0, fy0 - 14, 1, 16); ctx.fillStyle = flag[2]; ctx.fillRect(fx0 + 1, fy0 - 14 + wv, 8, 3); ctx.fillRect(fx0 + 1, fy0 - 11, 7, 3 - wv); ctx.strokeStyle = flag[2]; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(fx0, fy0, 10 + 4 * Math.sin(now / 200), 0, Math.PI * 2 * flag[3]); ctx.stroke(); ctx.globalAlpha = 1; light(fx0, fy0, 30, 0.6); }
      // chickens and creatures, back to front
      for (const c of S.chickens) { if (!S.seen[tileAt(Math.floor(c.x), Math.floor(c.y))]) continue; const s = SP.chicken, fr = Math.floor(c.anim) % 2 ? (c.face < 0 ? s.bf : s.b) : (c.face < 0 ? s.af : s.a); ctx.drawImage(fr, Math.round(c.x * TS) - 3, Math.round(c.y * TS) - 3 - (c.drop > 0 ? Math.round(c.drop * 90) : 0)); }
      const list = S.ents.filter(e => !e.held && !e.dead && e.x * TS > ox - 20 && e.x * TS < ox + vw + 20 && e.y * TS > oy - 20 && e.y * TS < oy + vh + 30 && S.seen[tileOf(e)]).sort((a, b) => a.y - b.y);
      for (const e of list) drawEnt(e);
      for (const s of S.shots) { ctx.fillStyle = s.col; ctx.fillRect(Math.round(s.x * TS) - 1, Math.round(s.y * TS) - 1, 3, 3); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(s.x * TS), Math.round(s.y * TS), 1, 1); light(s.x * TS, s.y * TS, 12, 0.6, s.col === '#ff7a00'); }
      for (const p of S.fx) { ctx.fillStyle = p.col; if (p.kind === 's') { const x = Math.round(p.x * TS), y = Math.round(p.y * TS); ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x, y - 2, 1, 5); } else if (p.kind === 'c') ctx.fillRect(Math.round(p.x * TS), Math.round(p.y * TS), 3, 2); else ctx.fillRect(Math.round(p.x * TS), Math.round(p.y * TS), 2, 2); }
      for (const c of S.clouds) { const a = clamp(c.t / c.t0, 0, 1); ctx.globalAlpha = 0.55 * a; ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(c.x * TS, c.y * TS, 5 + (1 - a) * 6, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      for (const r of S.rings) { const f = 1 - r.t / r.t0; ctx.globalAlpha = 1 - f; ctx.strokeStyle = r.col; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(r.x * TS, r.y * TS, 2 + f * r.max * 14, 1 + f * r.max * 8, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      for (const b of S.bolts) {
        ctx.strokeStyle = b.t > 0.15 ? '#ffffff' : '#a0c0ff'; ctx.lineWidth = 2; ctx.beginPath();
        let x = b.x * TS, y = oy - 4; ctx.moveTo(x, y); while (y < b.y * TS) { y += 8; x += rnd(-6, 6); ctx.lineTo(x, Math.min(y, b.y * TS)); } ctx.stroke();
        ctx.fillStyle = 'rgba(200,220,255,' + b.t + ')'; ctx.beginPath(); ctx.arc(b.x * TS, b.y * TS, 20, 0, Math.PI * 2); ctx.fill();
        light(b.x * TS, b.y * TS, 90, 1);
      }
      if (slapFx) { slapFx.t -= dt; if (slapFx.t <= 0) slapFx = null; else { const k = slapFx.t / 0.3; ctx.save(); ctx.translate(slapFx.x * TS + 8 * (k - 0.3), slapFx.y * TS - 10); ctx.rotate(-1.2 * k + 0.2); ctx.drawImage(SP.hand.a, -6, -5); ctx.restore(); if (k > 0.5) ptext(ctx, 'SLAP!', slapFx.x * TS, slapFx.y * TS - 26 + k * 4, '#ffffff'); } }
      for (const f of S.floats) ptext(ctx, f.txt, f.x * TS, f.y * TS, f.col);
      // brush preview
      if (hover >= 0 && mouse && !drag) {
        const hx = hover % W, hy = (hover / W) | 0, r = brush3 && (tool === 'dig' || tool[0] === 'r' || tool === 'sell') ? 1 : 0;
        ctx.strokeStyle = tool === 'sell' ? '#ff4040' : tool === 'move' ? '#5aa0ff' : '#ffd400'; ctx.lineWidth = 1;
        ctx.strokeRect((hx - r) * TS + 0.5, (hy - r) * TS + 0.5, (2 * r + 1) * TS - 1, (2 * r + 1) * TS - 1);
      }
      ctx.restore();
      // torchlight: darkness everywhere except round the lights
      if (opt.light && lights.length) {
        lctx.globalCompositeOperation = 'source-over'; lctx.fillStyle = S.mode === 'tour' ? 'rgba(8,2,14,.38)' : 'rgba(8,2,14,.52)'; lctx.clearRect(0, 0, vw, vh); lctx.fillRect(0, 0, vw, vh);
        lctx.globalCompositeOperation = 'destination-out';
        for (let q = 0; q < lights.length; q += 5) { const r = lights[q + 2]; lctx.globalAlpha = lights[q + 3]; lctx.drawImage(SP.light, lights[q] - ox - r, lights[q + 1] - oy - r, r * 2, r * 2); }
        lctx.globalAlpha = 1; ctx.drawImage(lc, 0, 0);
        ctx.globalCompositeOperation = 'lighter';
        for (let q = 0; q < lights.length; q += 5) if (lights[q + 4]) { const r = lights[q + 2] * 0.7; ctx.globalAlpha = 0.35 * lights[q + 3]; ctx.drawImage(SP.warm, lights[q] - ox - r, lights[q + 1] - oy - r, r * 2, r * 2); }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      // arrows: heroes you can't see on screen, the lesson's target, your raid party
      if (S.mode === 'raid') { for (const h of S.heroList.slice(0, 8)) pointer(h.x * TS, h.y * TS - 6, '#5aa0ff', ox, oy); if (S.seen[S.L.heart[1] * W + S.L.heart[0]]) pointer(S.heartC.x * TS, S.heartC.y * TS - 14, '#ff4040', ox, oy); }
      else {
        let n = 0; for (const h of S.heroList) { const hx = h.x * TS - ox, hy = h.y * TS - oy; if (hx < 0 || hy < 0 || hx > vw || hy > vh) { if (n++ < 6) pointer(h.x * TS, h.y * TS, Math.floor(now / 250) % 2 ? '#ff3030' : '#ffffff', ox, oy); } }
        const tg = tutTarget(); if (tg) pointer(tg[0] * TS + 8, tg[1] * TS + 8, '#ffd400', ox, oy);
        else if (S.gateOpen && !S.done && S.mode === 'realm') pointer(S.gateC.x * TS, S.gateC.y * TS - 26, '#ff8a00', ox, oy);
      }
      // the Hand
      if (mouse && (tool === 'hand' || tool === 'slap') && !visiting()) {
        const hs = SP.hand.a, hx = Math.round(mouse.x) - 3, hy = Math.round(mouse.y) - 1;
        S.held.slice(-3).forEach((e, q) => { const s = SP[e.k] || SP.imp; ctx.save(); ctx.translate(hx + 5 + q * 5, hy + 9); ctx.rotate(Math.sin(now / 120 + q) * 0.35); ctx.drawImage(s.a, -s.a.width / 2, 0); ctx.restore(); });
        if (tool === 'slap') { ctx.save(); ctx.translate(hx + 6, hy + 5); ctx.rotate(-0.5); ctx.drawImage(hs, -6, -5); ctx.restore(); } else ctx.drawImage(hs, hx, hy);
        if (S.held.length) ptext(ctx, String(S.held.length), hx + 14, hy + 1, '#ffd400');
      } else if (S.held.length && !visiting()) { // no mouse cursor (touch): show what's in the Hand in the corner
        S.held.slice(-4).forEach((e, q) => { const s = SP[e.k] || SP.imp; ctx.drawImage(s.a, 6 + q * 12, vh - 20 + Math.round(Math.sin(now / 150 + q))); });
        ptext(ctx, 'HAND ' + S.held.length, 30, vh - 30, '#ffd400');
      }
      if (paused && S && !S.done) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, vw, vh); }
      alarmEl.classList.toggle('on', S.heartHitT > 0 && S.mode !== 'raid' && !S.done);
    }
    function drawMini() {
      if (!S) return;
      const img = mctx.createImageData(W, H), d = img.data;
      const COL = { [ROCK]: [60, 60, 70], [EARTH]: [107, 74, 43], [GOLD]: [230, 190, 0], [GEM]: [120, 240, 255], [WALL]: [140, 60, 44], [DIRT]: [78, 61, 44], [CLAIM]: [150, 30, 30], [HFLOOR]: [200, 196, 176], [LAVA]: [255, 110, 0], [WATER]: [40, 80, 200], [HEART]: [255, 60, 60], [PORTAL]: [180, 100, 255], [GATE]: [100, 160, 255] };
      const RC = [null, [216, 176, 72], [80, 150, 50], [255, 212, 0], [192, 128, 64], [168, 104, 240], [150, 160, 175]];
      for (let i = 0; i < N; i++) { const c = !S.seen[i] ? [0, 0, 0] : S.trap[i] && S.tb[i] && isDoor(S.trap[i]) ? [230, 230, 230] : S.room[i] ? RC[S.room[i]] : COL[S.t_[i]]; d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; }
      const blink = Math.floor(now / 300) % 2;
      for (const e of S.ents) { if (e.held || e.dead) continue; const i = tileOf(e); if (i < 0 || (!S.seen[i] && !(e.hero && S.mode !== 'raid'))) continue; const c = e.hero ? (S.mode === 'raid' ? [90, 170, 255] : blink ? [255, 255, 255] : [255, 40, 40]) : S.mode === 'raid' ? [255, 60, 60] : [255, 230, 0]; d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; }
      mctx.putImageData(img, 0, 0);
      mctx.strokeStyle = '#fff'; mctx.lineWidth = 0.5; mctx.strokeRect(cam.x / TS + 0.25, cam.y / TS + 0.25, vw / TS - 0.5, vh / TS - 0.5);
    }

    // ---------------------------------------------------------------- the toolbar
    const TOOLS = {
      dig: { n: 'Dig', ic: 'dig', key: 'D', h: phone ? 'Click earth or gold to mark it for digging (click again to unmark). Drag to scroll.' : 'Click or drag over earth and gold to mark it for digging. Click again to unmark. Arrow keys scroll.' },
      hand: { n: 'Hand', ic: 'hand', key: 'H', h: phone ? 'Click a creature to pick it up. Click the floor to drop it. Holds 8.' : 'Click a creature to pick it up, click the floor to drop it. Holds 8. Right-click anything of yours to slap it.' },
      slap: { n: 'Slap', ic: 'slap', key: 'S', h: 'Slap an imp to make it work faster. Slap a beast to make it fight harder (it won\'t like it).' },
      sell: { n: 'Sell', ic: 'sell', h: 'Sell room tiles, traps and doors back for half price. (Ctrl+Z undoes a build for the full price.)' },
    };
    function icon(kind) {
      const c = mkC(16, 16), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      if (kind === 'dig') { x.drawImage(TL[EARTH][0], 0, 0); x.fillStyle = '#8a6430'; for (let k = 0; k < 9; k++) x.fillRect(4 + k, 12 - k, 2, 2); x.fillStyle = '#d0d0d8'; x.fillRect(9, 2, 6, 2); x.fillRect(12, 3, 2, 5); }
      else if (kind === 'hand') x.drawImage(SP.hand.a, 2, 3);
      else if (kind === 'slap') { x.translate(8, 8); x.rotate(-0.5); x.drawImage(SP.hand.a, -6, -5); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#fff'; x.fillRect(0, 2, 3, 1); x.fillRect(0, 6, 3, 1); }
      else if (kind === 'sell') { x.fillStyle = '#a07000'; x.beginPath(); x.arc(8, 8, 6, 0, 7); x.fill(); x.fillStyle = '#ffd400'; x.beginPath(); x.arc(8, 8, 5, 0, 7); x.fill(); x.fillStyle = '#a00000'; x.fillRect(4, 7, 8, 2); }
      else if (kind[0] === 'r') { const rm = +kind[1]; x.drawImage(TL[CLAIM][0], 0, 0); drawRoomIcon(x, rm); }
      else if (kind[0] === 't' && kind.length === 2) { const k = +kind[1], sv = S; S = { trap: [k], tb: [1], tcd: [k === 1 ? 2.8 : 0], thp: [TRAP[k].door || 0], tq: [] }; try { x.drawImage(TL[CLAIM][0], 0, 0); drawTrap(0, 0, 0, x); } finally { S = sv; } }
      else if (kind === 'imp') x.drawImage(SP.imp.a, 3, 2);
      else if (kind === 'call') { x.fillStyle = '#2a0a0a'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#c8a070'; x.fillRect(4, 2, 1, 13); x.fillStyle = '#e02020'; x.fillRect(5, 2, 8, 3); x.fillRect(5, 5, 7, 3); x.fillStyle = '#ffd400'; x.fillRect(8, 3, 2, 2); }
      else if (kind === 'zap') { x.fillStyle = '#20204a'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#ffffa0'; x.beginPath(); x.moveTo(9, 0); x.lineTo(3, 9); x.lineTo(7, 9); x.lineTo(5, 16); x.lineTo(13, 6); x.lineTo(9, 6); x.lineTo(11, 0); x.fill(); }
      else if (kind === 'cluck') { x.fillStyle = '#1a2a4a'; x.fillRect(0, 0, 16, 16); x.drawImage(SP.chicken.a, 1, 2); x.drawImage(SP.chicken.af, 9, 5); x.drawImage(SP.chicken.a, 4, 10); }
      else if (kind === 'speed') { x.drawImage(SP.squig.a, 2, 3); x.fillStyle = '#80ffff'; x.fillRect(0, 5, 3, 1); x.fillRect(0, 9, 3, 1); }
      else if (kind === 'heal') { x.fillStyle = '#1a3a1a'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#60ff60'; x.fillRect(6, 2, 4, 12); x.fillRect(2, 6, 12, 4); }
      else if (kind === 'zin' || kind === 'zout') { x.fillStyle = '#000'; x.fillRect(0, 0, 16, 16); x.strokeStyle = '#ffd400'; x.lineWidth = 2; x.beginPath(); x.arc(7, 7, 4.5, 0, 7); x.stroke(); x.fillRect(10, 10, 5, 2); x.fillStyle = '#ffd400'; x.fillRect(5, 6, 5, 2); if (kind === 'zin') x.fillRect(6, 5, 2, 5); }
      else if (kind === 'brush') { x.fillStyle = '#000'; x.fillRect(0, 0, 16, 16); x.strokeStyle = '#ffd400'; x.lineWidth = 1; x.strokeRect(1.5, 1.5, 13, 13); if (brush3) { x.strokeRect(5.5, 1.5, 5, 13); x.strokeRect(1.5, 5.5, 13, 5); } else x.fillRect(6, 6, 4, 4); }
      else if (kind === 'heart') { x.fillStyle = '#2a0606'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#ff2020'; x.beginPath(); x.arc(8, 8, 5, 0, 7); x.fill(); x.fillStyle = '#ffd0d0'; x.fillRect(6, 5, 2, 2); }
      else if (kind === 'heroes') { x.fillStyle = '#0a1a3a'; x.fillRect(0, 0, 16, 16); x.drawImage(SP.knight.a, 3, 2); }
      else if (kind === 'move') { x.fillStyle = '#0a1a3a'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#3a2a1a'; x.fillRect(5, 2, 1, 13); x.fillStyle = '#2a6ad8'; x.fillRect(6, 2, 7, 3); x.fillRect(6, 5, 6, 3); }
      else if (kind === 'charge') { x.drawImage(SP.knight.a, 3, 2); x.fillStyle = '#80ffff'; x.fillRect(0, 5, 3, 1); x.fillRect(0, 9, 3, 1); x.fillRect(1, 7, 2, 1); }
      else if (kind === 'smite') { x.fillStyle = '#20204a'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#a0e0ff'; x.beginPath(); x.moveTo(9, 0); x.lineTo(3, 9); x.lineTo(7, 9); x.lineTo(5, 16); x.lineTo(13, 6); x.lineTo(9, 6); x.lineTo(11, 0); x.fill(); }
      else if (kind === 'leave') { x.fillStyle = '#3a2a1a'; x.fillRect(3, 1, 10, 15); x.fillStyle = '#000'; x.fillRect(5, 3, 6, 13); x.fillStyle = '#ffd400'; x.fillRect(9, 9, 1, 1); }
      else if (K[kind]) x.drawImage(SP[kind].a, Math.floor((16 - SP[kind].a.width) / 2), 1);
      return c;
    }
    function drawRoomIcon(x, rm) {
      if (rm === 1) { x.fillStyle = '#c8a040'; x.fillRect(3, 4, 10, 8); x.fillStyle = '#8a6a20'; x.fillRect(5, 7, 6, 3); }
      else if (rm === 2) { x.fillStyle = '#2e6a22'; x.fillRect(1, 1, 14, 14); x.drawImage(SP.chicken.a, 5, 6); x.fillStyle = '#8a6a2a'; x.fillRect(1, 1, 14, 2); }
      else if (rm === 3) { for (let k = 0; k < 3; k++) { x.fillStyle = '#a07000'; x.fillRect(2 + k * 4, 11 - (k % 2) * 3, 6, 2); x.fillStyle = '#ffd400'; x.fillRect(3 + k * 4, 8 - (k % 2) * 3, 4, 3); } }
      else if (rm === 4) { x.fillStyle = '#8a7650'; x.fillRect(1, 1, 14, 14); x.fillStyle = '#5a3a1a'; x.fillRect(7, 4, 2, 10); x.fillRect(4, 6, 8, 2); x.fillStyle = '#c8a070'; x.fillRect(6, 2, 4, 3); }
      else if (rm === 5) { x.fillStyle = '#2a1408'; x.fillRect(1, 1, 14, 14); const cols = ['#a02020', '#2050a0', '#20a040', '#a08020', '#7020a0']; for (let k = 0; k < 6; k++) { x.fillStyle = cols[k % 5]; x.fillRect(2 + k * 2, 3, 1, 10); } }
      else if (rm === 6) { x.fillStyle = '#4a4e56'; x.fillRect(1, 1, 14, 14); x.fillStyle = '#1a1a20'; x.fillRect(3, 6, 10, 3); x.fillRect(5, 9, 6, 4); x.fillStyle = '#6a6e78'; x.fillRect(3, 6, 10, 1); x.fillStyle = '#ff8a00'; x.fillRect(11, 2, 3, 3); }
    }
    function mkBtn(id, label, sub, ic, act, on, dis, tip, key) {
      const b = el('button', 'dg-keepa-btn' + (on ? ' on' : '')); b.type = 'button'; b.dataset.t = id;
      b.appendChild(icon(ic)); const s = el('span', null, `${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}`); b.appendChild(s);
      if (key) b.appendChild(el('kbd', null, esc(key)));
      if (tip) b.title = tip + (key ? ` (${key})` : '');
      b.disabled = !!dis;
      b.addEventListener('click', () => { G.sfx('click'); act(); });
      return b;
    }
    function setTool(t) {
      tool = t; map.classList.toggle('nocur', !G.touch && (t === 'hand' || t === 'slap') && !visiting());
      gridEl.querySelectorAll('.dg-keepa-btn[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      hint();
    }
    function hint() {
      let h = '';
      if (S && S.mode === 'tour') h = 'Touring: drag to look around, click a creature or a room to see what it is.';
      else if (S && S.mode === 'raid') h = tool === 'smite' ? 'Smite: click near the defenders to call down lightning (80 damage).' : 'Click the floor to send your heroes there (they dig through earth). Click a defender to make them all go for it. Dragging the map stops the camera following them (G follows again).';
      else if (TOOLS[tool]) h = TOOLS[tool].h;
      else if (tool[0] === 'r' && ROOM[+tool[1]]) { const R = ROOM[+tool[1]]; h = `${R.n}: ${R.cost} gold a tile. ${R.d}`; }
      else if (tool[0] === 't' && TRAP[+tool[1]]) { const T = TRAP[+tool[1]]; h = `${T.n}: ${T.cost} gold. ${T.d} ${isDoor(+tool[1]) ? 'Put it in a corridor.' : 'Put it on your claimed floor.'}`; }
      else if (SPELLS[tool]) h = `${SPELLS[tool].n} (${SPELLS[tool].cost} gold): ${SPELLS[tool].d}`;
      hintEl.textContent = h;
    }
    const TABS = [['tools', 'Tools', 'Dig, Hand, Slap (F1)'], ['rooms', 'Rooms', 'Build rooms on your claimed floor (R)'], ['traps', 'Traps', 'Traps and doors, made in the Workshop (T)'], ['spells', 'Spells', 'Cast spells with gold (M)'], ['beasts', 'Beasts', 'Your creatures and what they need (B)']];
    function buildTabs() {
      tabsEl.innerHTML = '';
      const list = visiting() ? (S.mode === 'raid' ? [['raid', 'Raid', 'Your raiding party'], ['info', 'Their dungeon', 'What you know about it']] : [['info', 'Tour', 'What is in this dungeon']]) : TABS;
      if (!list.some(t => t[0] === tab)) tab = list[0][0];
      list.forEach(([k, l, tip]) => { const b = el('button', null, esc(l)); b.type = 'button'; b.dataset.k = k; b.title = tip; b.addEventListener('click', () => { G.sfx('click'); tab = k; buildTab(); }); tabsEl.appendChild(b); });
    }
    function buildTab() {
      tabsEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === tab));
      gridEl.innerHTML = '';
      const P = phone, add = b => gridEl.appendChild(b);
      if (tab === 'tools') {
        for (const k in TOOLS) add(mkBtn(k, TOOLS[k].n, '', TOOLS[k].ic, () => setTool(k), tool === k, false, TOOLS[k].h, TOOLS[k].key));
        if (P) {
          add(mkBtn('', 'Brush', brush3 ? '3x3' : '1x1', 'brush', () => { brush3 = !brush3; buildTab(); }, false, false, 'Brush size for digging and building'));
          add(mkBtn('', 'Zoom in', '', 'zin', () => setZoom(1)));
          add(mkBtn('', 'Zoom out', '', 'zout', () => setZoom(-1)));
          add(mkBtn('', 'Heart', '', 'heart', () => S && lookAt(S.heartC.x, S.heartC.y), false, false, 'Jump to your Dungeon Heart'));
        } else {
          const row = el('div'); row.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:3px';
          row.append(mkBtn('', '', '', 'zin', () => setZoom(1), false, false, 'Zoom in', '+'), mkBtn('', '', '', 'zout', () => setZoom(-1), false, false, 'Zoom out', '-'), mkBtn('', '', '', 'brush', () => { brush3 = !brush3; buildTab(); }, false, false, 'Brush size: ' + (brush3 ? '3x3' : '1 tile'), 'X'), mkBtn('', '', '', 'heroes', () => goHeroes(), false, false, 'Jump to the heroes', 'G'));
          row.querySelectorAll('.dg-keepa-btn').forEach(b => { b.style.justifyContent = 'center'; const k = b.querySelector('kbd'); if (k) k.remove(); });
          add(row);
        }
      } else if (tab === 'rooms') {
        for (let r = 1; r <= NROOM; r++) add(mkBtn('r' + r, ROOM[r].n.replace('Training Room', 'Training'), ROOM[r].cost + ' gold', 'r' + r, () => setTool('r' + r), tool === 'r' + r, false, `${ROOM[r].n}: ${ROOM[r].cost} gold a tile. ${ROOM[r].d}`, String(r)));
        add(mkBtn('sell', 'Sell', 'half back', 'sell', () => setTool('sell'), tool === 'sell', false, TOOLS.sell.h));
      } else if (tab === 'traps') {
        const ws = S && rc(6) > 0;
        for (let k = 1; k <= 5; k++) add(mkBtn('t' + k, TRAP[k].n.replace(' Trap', ''), ws ? TRAP[k].cost + ' gold' : 'needs Workshop', 't' + k, () => setTool('t' + k), tool === 't' + k, !ws, `${TRAP[k].n}: ${TRAP[k].cost} gold. ${TRAP[k].d}`, String(k)));
        add(mkBtn('sell', 'Sell', 'half back', 'sell', () => setTool('sell'), tool === 'sell', false, TOOLS.sell.h));
        const r = el('div', 'dg-keepa-hint'); r.style.gridColumn = '1/-1'; r.dataset.mf = 1; gridEl.appendChild(r); mfHint();
      } else if (tab === 'spells') {
        Object.keys(SPELLS).forEach((k, n) => { const ok = S && S.spells[k]; add(mkBtn(k, SPELLS[k].n.replace(' Monster', '').replace('Create ', ''), ok ? SPELLS[k].cost + ' gold' : 'research ' + SPELLS[k].res, k, () => setTool(k), tool === k, !ok, `${SPELLS[k].n}: ${SPELLS[k].cost} gold. ${SPELLS[k].d}${ok ? '' : ' Dark Mages must research it first.'}`, String(n + 1))); });
        const r = el('div', 'dg-keepa-hint'); r.style.gridColumn = '1/-1'; r.dataset.res = 1; gridEl.appendChild(r); resHint();
      } else if (tab === 'beasts') {
        const lst = el('div', 'dg-keepa-list'); lst.style.gridColumn = '1/-1'; add(lst); refreshBeasts(lst);
      } else if (tab === 'raid') {
        const R = S.raid;
        add(mkBtn('move', 'Move', '', 'move', () => setTool('move'), tool === 'move', false, 'Send your heroes somewhere: click the floor. Click a defender to gang up on it.'));
        const ab = (b, k) => { b.dataset.ab = k; add(b); };
        ab(mkBtn('smite', 'Smite', R.ab.smite > 0 ? Math.ceil(R.ab.smite) + 's' : 'ready', 'smite', () => { if (S.raid.ab.smite <= 0) setTool('smite'); else G.sfx('uhoh'); }, tool === 'smite', false, 'Lightning from the heavens: 80 damage to defenders near the spot. Every 20 seconds.', 'E'), 'smite');
        ab(mkBtn('', 'Heal', R.ab.heal > 0 ? Math.ceil(R.ab.heal) + 's' : 'ready', 'heal', () => raidAbility('heal'), false, false, 'Heals every hero by half. Every 25 seconds.', 'Q'), 'heal');
        ab(mkBtn('', 'Charge!', R.ab.charge > 0 ? Math.ceil(R.ab.charge) + 's' : 'ready', 'charge', () => raidAbility('charge'), false, false, 'Heroes run faster and hit harder for 10 seconds. Every 35 seconds.', 'W'), 'charge');
        add(mkBtn('', 'For the Heart!', '', 'heart', () => { R.order = -1; R.focus = null; R.oid++; G.sfx('click'); float(S.heartC.x, S.heartC.y - 2, 'CHARGE!', '#5aa0ff'); for (const h of S.heroList) h.think = 0; }, false, false, 'Forget the flag: everybody goes straight for the Dungeon Heart.'));
        add(mkBtn('', 'Leave', '', 'leave', () => leaveVisit(), false, false, 'Give up the raid and go home'));
        const lst = el('div', 'dg-keepa-list'); lst.style.gridColumn = '1/-1'; lst.dataset.party = 1; add(lst); refreshParty(lst);
      } else if (tab === 'info') {
        const d = el('div', 'dg-keepa-hint'); d.style.gridColumn = '1/-1'; d.dataset.info = 1; add(d);
        if (S.mode === 'tour') { add(mkBtn('', 'Raid it!', '', 'knight', () => partyPick(S.visit), false, false, 'Lead a party of heroes into this dungeon')); add(mkBtn('', 'Leave', '', 'leave', () => leaveVisit(), false, false, 'Go home')); }
        infoHint();
      }
      hint();
    }
    function mfHint() { const r = gridEl.querySelector('[data-mf]'); if (!r || !S) return; r.innerHTML = rc(6) ? `Workshop: ${S.tq.length ? `making ${S.tq.length} (next ${Math.floor(clamp(S.mfg / TRAP[S.trap[S.tq[0]]].mfg, 0, 1) * 100)}%)` : 'idle'}. Trolls in the Workshop work fastest.` : 'Build a <b>Workshop</b> (Rooms tab) to make traps and doors.'; }
    function resHint() { const r = gridEl.querySelector('[data-res]'); if (!r || !S) return; const nx = Object.keys(SPELLS).find(k => !S.spells[k]); r.textContent = `Research: ${Math.floor(S.res)} points.${nx ? ` Next: ${SPELLS[nx].n} at ${SPELLS[nx].res}.` : ' Every spell researched!'} ${rc(5) ? '' : 'Build a Library to bring Dark Mages.'}`; }
    function infoHint() {
      const r = gridEl.querySelector('[data-info]'); if (!r || !S || !S.visit) return;
      const v = S.visit, t = v.stats || {};
      if (S.mode === 'tour') r.innerHTML = `<b>${esc(v.title)}</b> by ${esc(v.name)}<br>${esc(resTxt(v.res))}<br>${t.beasts | 0} beasts · ${t.imps | 0} imps · ${t.rooms | 0} room tiles · ${t.traps | 0} traps · ${t.doors | 0} doors<br>Built in: ${esc(t.realm || '?')}`;
      else { const seenB = beasts().filter(e => S.seen[tileOf(e)]).length; r.innerHTML = `<b>${esc(v.title)}</b> by ${esc(v.name)}<br>Defenders: ${t.beasts | 0} beasts (${seenB} spotted) · ${t.traps | 0} traps · ${t.doors | 0} doors<br>Heart: ${Math.max(0, Math.round(100 * S.heartHp / S.heartMax))}% · Time left ${fmtT(S.raid.t)}`; }
    }
    const STATE_N = { fight: 'Fighting', eat: 'Off to eat', eating: 'Eating', sleep: 'Off to bed', sleeping: 'Asleep', train: 'Training', research: 'Researching', craft: 'In the Workshop', wander: 'Wandering', idle: 'Thinking', assault: 'Attacking the Gate', leave: 'LEAVING', rally: 'Called to arms' };
    function refreshBeasts(lst) {
      lst = lst || gridEl.querySelector('.dg-keepa-list'); if (!lst || !S || lst.dataset.party) return;
      const bs = beasts();
      lst.innerHTML = `<div class="dg-keepa-hint">Imps: ${imps().length} · Beasts: ${bs.length}/${Math.min(rc(1), 16)} (Lair beds)${S.mfg && rc(6) ? '' : ''}</div>`;
      for (const e of bs) {
        const b = el('button', 'dg-keepa-li'); b.type = 'button'; b.title = K[e.k].d + ' Click to look at it.';
        const c = mkC(12, 14); c.getContext('2d').drawImage(SP[e.k].a, 0, 0); b.appendChild(c);
        const nd = needs(e).map(n => n[0]);
        b.appendChild(el('span', null, `<b>${esc(e.name)}</b> ${esc(K[e.k].n)} L${e.lvl}<br>${STATE_N[e.st] || esc(e.st)} · ${e.happy < 30 ? '<span class="ang">ANGRY</span>' : e.happy > 70 ? '<span class="ok">happy</span>' : 'grumpy'}${nd.length ? ` · <span class="nd">${esc(nd.join(', '))}</span>` : ''}<i style="width:${Math.round(100 * e.hp / e.mhp)}%"></i>`));
        b.addEventListener('click', () => { lookAt(e.x, e.y); G.sfx('click'); });
        lst.appendChild(b);
      }
      if (!bs.length) lst.appendChild(el('div', 'dg-keepa-hint', 'No beasts yet. Claim the Portal and build a Lair and a Hatchery.'));
      const lure = BEASTS.filter(k => K[k].lure && rc(K[k].lure[0]) < K[k].lure[1]).map(k => `${K[k].n}: ${ROOM[K[k].lure[0]].n} ${K[k].lure[1]}+`);
      if (lure.length) lst.appendChild(el('div', 'dg-keepa-hint', 'To attract: ' + esc(lure.join(' · '))));
    }
    function refreshParty(lst) {
      lst = lst || gridEl.querySelector('[data-party]'); if (!lst || !S || !S.raid) return;
      lst.innerHTML = `<div class="dg-keepa-hint">Your party: ${S.heroList ? S.heroList.length : 0} heroes left</div>`;
      for (const e of (S.heroList || [])) {
        const b = el('button', 'dg-keepa-li'); b.type = 'button'; b.title = K[e.k].d;
        const c = mkC(12, 14); c.getContext('2d').drawImage(SP[e.k].a, 0, 0); b.appendChild(c);
        b.appendChild(el('span', null, `<b>${esc(K[e.k].n)}</b><i style="width:${Math.round(100 * e.hp / e.mhp)}%;background:#5aa0ff"></i>`));
        b.addEventListener('click', () => { lookAt(e.x, e.y); G.sfx('click'); });
        lst.appendChild(b);
      }
    }
    function setZoom(d) { const Z = [1, 1.5, 2, 2.5, 3]; let i = Z.indexOf(zoom); if (i < 0) i = 1; zoom = Z[clamp(i + d, 0, Z.length - 1)]; resize(); }
    function goHeroes() { if (!S) return; const hs = S.heroList || []; if (!hs.length) { mentor(S.wave < nWaves() ? `No heroes yet. They come out of the Hero Gate in ${fmtT(S.waveT)}.` : 'No heroes about. Lovely and quiet.', 'nohero', 4); if (S.seen[S.L.gate[1] * W + S.L.gate[0]]) lookAt(S.gateC.x, S.gateC.y); return; } const h = hs[(goHeroes.n = ((goHeroes.n || 0) + 1)) % hs.length]; lookAt(h.x, h.y); }
    function updPanel() {
      if (!S) return;
      if (S.mode === 'tour') { goldEl.innerHTML = `${esc(S.visit.name).slice(0, 14)}<small>DUNGEON OWNER</small>`; statsEl.innerHTML = `<div class="goal">Touring a JackNet dungeon</div>Beasts ${beasts().length} · Imps ${imps().length}<br>Nothing here gets saved. Look, don't touch!`; G.status(`Touring ${S.visit.title} by ${S.visit.name}`); return; }
      if (S.mode === 'raid') {
        const R = S.raid, hp = Math.max(0, Math.round(100 * S.heartHp / S.heartMax));
        goldEl.innerHTML = `${fmtT(R.t)}<small>TIME LEFT</small>`;
        statsEl.innerHTML = `<div class="goal">Goal: smash ${esc(S.visit.name)}'s Dungeon Heart</div>Heroes: <b>${S.heroList.length}</b> of ${R.party}<br>Defenders beaten: ${R.kills}<br>Their Heart: ${hp}%<div class="dg-keepa-hbar"><i style="width:${hp}%"></i></div>`;
        G.status(`Raiding ${S.visit.title} – ${fmtT(R.t)} left – Heart ${hp}%`);
        return;
      }
      goldEl.innerHTML = `${S.gold}<small>GOLD (holds ${goldCap()})</small>`;
      const hs = S.heroList ? S.heroList.length : 0, endless = !!S.L.endless;
      const goal = S.tut != null ? `Lesson ${S.tut + 1} of ${TUT.length}` : endless ? `Goal: survive. Best: ${G.load('best', 0)} waves` : S.gateOpen ? 'Goal: SMASH THE HERO GATE!' : `Goal: beat ${nWaves()} waves, then smash the Gate`;
      let wave;
      if (S.wave < nWaves()) { const nx = describe(waveList(S.wave)); wave = S.tut != null && S.tut < TUT.length - 1 ? `Heroes: <b>held back by your Mentor</b>` : `${S.waveT <= 30 ? '<span class="warn">' : ''}Wave ${S.wave + 1} in <b>${fmtT(S.waveT)}</b>${S.waveT <= 30 ? '</span>' : ''}<br><small>${esc(nx)}</small>`; }
      else wave = S.gateOpen ? '<b>SMASH THE GATE!</b>' : '<b>FINAL WAVE!</b>';
      const hp = Math.round(100 * Math.max(0, S.heartHp) / S.heartMax);
      const mf = rc(6) && S.tq.length ? `<div class="dg-keepa-hbar mf" title="Workshop"><i style="width:${Math.round(100 * clamp(S.mfg / TRAP[S.trap[S.tq[0]]].mfg, 0, 1))}%"></i></div>` : '';
      if (phone) statsEl.innerHTML = `${wave.replace('<br>', ' · ')}${hs ? ` · <b>${hs} heroes here</b>` : ''}<br>Payday ${fmtT(S.payT)} · Imps ${imps().length} · Beasts ${beasts().length} · Heart ${hp}%`;
      else statsEl.innerHTML = `<div class="goal">${goal}</div>${S.L.n}${endless ? ` · wave ${S.wave}` : ` · wave ${Math.min(S.wave, nWaves())}/${nWaves()}`}<br>${wave}${hs ? `<br><b>${hs} heroes in your dungeon!</b>` : ''}<br>Payday in ${fmtT(S.payT)}<br>Imps ${imps().length} · Beasts ${beasts().length}/${Math.min(rc(1), 16)}<br>Heart ${hp}%<div class="dg-keepa-hbar"><i style="width:${hp}%"></i></div>${mf}`;
      G.status(`${S.L.n} – ${fmtT(S.time)} – Gold ${S.gold} – Imps ${imps().length} – Beasts ${beasts().length} – Heroes flattened ${S.kills}${paused ? ' – PAUSED' : ''}${speed > 1 ? ' – FAST x' + speed : ''}`);
    }

    // ---------------------------------------------------------------- actions
    function brushTiles(i) { if (!brush3) return [i]; const x = i % W, y = (i / W) | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const n = tileAt(x + dx, y + dy); if (n >= 0) out.push(n); } return out; }
    let paintMode = null, lastBuild = null;
    const corridor = i => { const x = i % W, y = (i / W) | 0, sol = (dx, dy) => { const n = tileAt(x + dx, y + dy); return n < 0 || !isWalk(S.t_[n]) && S.t_[n] !== HEART; }; return (sol(-1, 0) && sol(1, 0)) || (sol(0, -1) && sol(0, 1)); };
    function applyTool(i, first) {
      if (i < 0 || !S || visiting()) return;
      if (tool === 'dig') {
        if (first) paintMode = (S.mark[i] && isDig(S.t_[i])) ? 0 : 1;
        let n = 0; for (const j of brushTiles(i)) if (S.seen[j] && isDig(S.t_[j]) && S.mark[j] !== paintMode) { S.mark[j] = paintMode; n++; if (paintMode) S.nMark++; }
        if (n) snd(() => G.note(paintMode ? 880 : 440, 0.03, 'square'), 'mark', 60);
        else if (first && S.seen[i] && S.t_[i] === ROCK) mentor('That\'s impenetrable rock, Keepa. Not even your Mom\'s rock cakes are that hard.', 'rock', 20);
        else if (first && S.seen[i] && S.t_[i] === GEM) mentor('Gem seams never run out. Mark the earth NEXT to it and the imps will mine it forever.', 'gem', 30);
      } else if (tool[0] === 'r') {
        const rm = +tool[1], R = ROOM[rm]; let n = 0, broke = false;
        if (first) { lastBuild = { kind: 'room', t: S.time, tiles: [], spent: 0 }; S.undo.push(lastBuild); if (S.undo.length > 10) S.undo.shift(); }
        for (const j of brushTiles(i)) { if (S.t_[j] !== CLAIM || S.room[j] === rm || S.trap[j]) continue; if (S.gold < R.cost) { broke = true; break; } const was = S.room[j]; let refund = 0; if (was) { refund = Math.floor(ROOM[was].cost / 2); S.gold += refund; } S.gold -= R.cost; S.room[j] = rm; n++; if (lastBuild) { lastBuild.tiles.push([j, was]); lastBuild.spent += R.cost - refund; lastBuild.t = S.time; } float(j % W + 0.5, ((j / W) | 0) + 0.3, '-' + R.cost, '#ffd400'); fx(j % W + 0.5, ((j / W) | 0) + 0.5, 'p', R.col, 3); }
        if (n) { recount(); snd(() => { G.note(330, 0.05, 'square'); G.note(440, 0.06, 'square'); }, 'build', 80); if (rm === 1 && S.rl[1].length === n) mentor('A Lair! Beasts need somewhere to kip. Now build a Hatchery so they can eat.', 'lair1', 999); if (rm === 6 && S.rl[6].length === n) { mentor('A Workshop! Now you can put traps and doors down from the Traps tab. Trolls will come for a big one.', 'ws1', 999); if (tab === 'traps') buildTab(); } }
        if (broke) mentor('You can\'t afford that, Keepa. Dig some gold. Or ask your Mom for an advance on your pocket money.', 'broke', 8);
        if (!n && !broke && first && S.t_[i] !== CLAIM) mentor('Rooms go on your claimed floor, Keepa. That\'s the red tiles.', 'roomwhere', 15);
      } else if (tool[0] === 't') {
        if (!first) return;
        const k = +tool[1], T = TRAP[k];
        if (!rc(6)) { mentor('You need a Workshop to make traps and doors, Keepa. Build one from the Rooms tab.', 'nows', 10); return; }
        if (S.t_[i] !== CLAIM || S.room[i] || S.trap[i]) { mentor(S.trap[i] ? 'There\'s already something there.' : 'Traps and doors go on your claimed floor, but not inside rooms.', 'trapwhere', 8); return; }
        if (isDoor(k) && !corridor(i)) { mentor('Doors go in corridors, Keepa: somewhere with wall on both sides.', 'doorwhere', 8); return; }
        if (S.gold < T.cost) { mentor('You can\'t afford that, Keepa.', 'broke', 8); return; }
        S.gold -= T.cost; S.trap[i] = k; S.tb[i] = 0; S.tq.push(i); recount();
        lastBuild = { kind: 'trap', t: S.time, tiles: [[i, 0]], spent: T.cost }; S.undo.push(lastBuild); if (S.undo.length > 10) S.undo.shift();
        float(i % W + 0.5, ((i / W) | 0) + 0.3, '-' + T.cost, '#ffd400'); snd(() => { G.note(500, 0.05, 'square'); G.note(380, 0.06, 'square'); }, 'build', 80);
        if (S.tq.length === 1 && S.mfg < T.mfg) mentor(`The Workshop will make your ${T.n} now. ${rc(6) < 4 ? 'A bigger Workshop (and a Troll) makes things faster.' : ''}`, 'mfgwait', 40);
        mfHint();
      } else if (tool === 'sell') {
        let n = 0; for (const j of brushTiles(i)) {
          if (S.room[j]) { const refund = Math.floor(ROOM[S.room[j]].cost / 2); S.gold += refund; S.room[j] = 0; n++; float(j % W + 0.5, ((j / W) | 0) + 0.3, '+' + refund, '#ffd400'); }
          else if (S.trap[j]) { const refund = S.tb[j] ? Math.floor(TRAP[S.trap[j]].cost / 2) : TRAP[S.trap[j]].cost; S.gold += refund; S.trap[j] = 0; S.tb[j] = 0; n++; float(j % W + 0.5, ((j / W) | 0) + 0.3, '+' + refund, '#ffd400'); }
        }
        if (n) { S.gold = Math.min(S.gold, goldCap()); recount(); G.sfx('click'); }
      }
    }
    function undo() {
      if (!playing()) return;
      const u = S.undo.pop();
      if (!u) { mentor('Nothing to undo, Keepa.', 'noundo', 3); return; }
      if (S.time - u.t > 20) { S.undo = []; mentor('Too late to undo that, Keepa. Use Sell instead (half price).', 'lateundo', 5); return; }
      for (const [j, was] of u.tiles) { if (u.kind === 'room') { if (S.t_[j] === CLAIM) S.room[j] = was; } else { S.trap[j] = 0; S.tb[j] = 0; } }
      S.gold += u.spent; recount(); float(S.heartC.x, S.heartC.y - 2.2, '+' + u.spent, '#ffd400'); G.sfx('click'); mentor('Undone. Full refund. I\'m feeling generous.', 'undo', 3);
      if (tab === 'traps') mfHint();
    }
    function entAt(wx, wy, ours) {
      let best = null, bd = G.touch ? 1.0 : 0.75;
      for (const e of S.ents) { if (e.dead || e.held || !!e.hero === !!ours) continue; const d = Math.hypot(e.x - wx, e.y - 0.4 - wy); if (d < bd) { bd = d; best = e; } }
      return best;
    }
    function slap(e) {
      e.slapT = 12; e.stun = 0.3; e.hp = Math.max(1, e.hp - 2); e.flash = 0.15; e.squashT = 0.25; S.slaps++;
      slapFx = { x: e.x, y: e.y, t: 0.3 }; shake(0.08);
      fx(e.x, e.y - 0.6, 's', '#ffffff', 4); fx(e.x, e.y - 0.6, 's', '#ffd400', 2); G.sfx('thud'); G.note(900, 0.03, 'square'); G.note(1400, 0.04, 'square');
      if (e.k === 'imp') { G.secret('keepa.slap'); mentor(pick(['An imp has been slapped. It probably deserved it.', 'Slap! That imp will work twice as hard now. Out of fear.', 'The imp says "OW". Then gets back to work.']), 'slapimp', 12); }
      else { e.happy -= 6; mentor(`${e.name} the ${K[e.k].n} has been slapped. It's fighting harder. It's also writing your name in a little book.`, 'slapbeast', 20); }
    }
    function slapChicken(wx, wy) {
      const c = S.chickens.find(c => Math.hypot(c.x - wx, c.y - wy) < 0.6); if (!c) return false;
      c.panic = 2; c.t = 0; slapFx = { x: c.x, y: c.y, t: 0.3 }; fx(c.x, c.y - 0.3, 'p', '#ffffff', 8); G.note(1600, 0.05, 'square'); G.note(1900, 0.06, 'triangle');
      G.secret('keepa.chicken'); mentor(pick(['That chicken has done nothing to you, Keepa.', 'BAWK! The chicken is now very upset. It will tell the other chickens.', 'Slapping dinner. A new low.']), 'slapchick', 10);
      return true;
    }
    function handTap(wx, wy) {
      const e = entAt(wx, wy, true);
      if (e && S.held.length < 8) { e.held = true; if (e.job) relJob(e); e.dep = false; e.path = []; e.st = 'idle'; e.work = -1; S.held.push(e); S.picks++; fx(e.x, e.y - 0.4, 'p', '#ffffff', 4); G.sfx('click'); G.note(660, 0.04, 'triangle'); G.note(990, 0.05, 'triangle'); return; }
      if (e && S.held.length >= 8) { mentor('Your Hand is full, Keepa. Eight is plenty.', 'handfull', 10); return; }
      if (S.held.length) {
        const i = tileAt(Math.floor(wx), Math.floor(wy));
        if (i >= 0 && S.seen[i] && isWalk(S.t_[i]) && (owned(i) || S.t_[i] === DIRT || S.heroList.some(h => dist2(h, { x: wx, y: wy }) < 3))) {
          const d = S.held.pop(); d.held = false; d.x = Math.floor(wx) + 0.5; d.y = Math.floor(wy) + 0.5; d.stun = 0.5; d.think = 0; d.path = []; d.fallT = 0.18; S.drops++;
          G.note(440, 0.05, 'triangle');
        } else mentor('You can\'t drop that there, Keepa. Pick some open floor you can see, near your dungeon.', 'nodrop', 8);
      }
    }
    function cast(k, wx, wy) {
      const Sp = SPELLS[k], i = tileAt(Math.floor(wx), Math.floor(wy));
      if (i < 0 || !S.seen[i]) return;
      if (S.gold < Sp.cost) { mentor('Not enough gold for that spell, Keepa.', 'spellbroke', 8); G.sfx('uhoh'); return; }
      if (k === 'imp') {
        if (!owned(i) || S.t_[i] === HEART) { mentor('Imps can only be created on your own claimed floor.', 'impwhere', 10); return; }
        if (imps().length >= 24) { mentor('You have 24 imps. Any more and they\'ll form a union.', 'impmax', 20); return; }
        S.gold -= Sp.cost; const e = spawn('imp', Math.floor(wx) + 0.5, Math.floor(wy) + 0.5); e.stun = 0.4; fx(e.x, e.y - 0.4, 'p', '#ff8a00', 8); ring(e.x, e.y, '#ff8a00', 1, 0.4); G.sfx('pet');
      } else if (k === 'call') {
        if (!isWalk(S.t_[i])) return;
        if (S.rally && Math.hypot(S.rally.x - wx, S.rally.y - wy) < 1.5) { S.rally = null; for (const e of beasts()) if (e.st === 'rally') { e.st = 'idle'; e.think = 0; } mentor('Stand down! Your beasts go back to whatever they were doing.', null, 0); G.sfx('click'); return; }
        if (!beasts().length) { mentor('You haven\'t got any beasts to call, Keepa.', 'nobeasts', 8); return; }
        S.gold -= Sp.cost; S.rally = { x: Math.floor(wx) + 0.5, y: Math.floor(wy) + 0.5, t: 25 }; for (const e of beasts()) { e.think = 0; if (e.st === 'sleeping' || e.st === 'eating') e.st = 'idle'; }
        ring(S.rally.x, S.rally.y, '#e02020', 2, 0.6); tune([392, 523, 659, 784], 0.1); mentor('TO ARMS! Every beast is on its way. (Click the flag again to stand them down.)', 'call', 10);
      } else if (k === 'zap') {
        S.gold -= Sp.cost; S.bolts.push({ x: wx, y: wy, t: 0.35 }); G.sfx('zap'); G.sfx('thud'); shake(0.25);
        for (const e of S.ents.slice()) { if (e.dead || e.held) continue; const d = Math.hypot(e.x - wx, e.y - wy); if (d < 1.8) hurt(e, e.hero ? 90 : 30); }
        if (Math.hypot(S.gateC.x - wx, S.gateC.y - wy) < 2.5 && S.gateOpen) applyHit(GATE_T, 70);
      } else if (k === 'cluck') {
        if (!isWalk(S.t_[i])) return;
        S.gold -= Sp.cost; let n = 0;
        for (let q = 0; q < 12 && n < 6; q++) { const x = Math.floor(wx) + Math.round(rnd(-1.4, 1.4)), y = Math.floor(wy) + Math.round(rnd(-1.4, 1.4)), j = tileAt(x, y); if (j < 0 || !isWalk(S.t_[j])) continue; n++; S.chickens.push({ x: x + 0.5, y: y + 0.5, tx: x + 0.5, ty: y + 0.5, t: 0, anim: 0, free: true, life: 15, drop: 0.2 + n * 0.08 }); }
        tune([1200, 1500, 1200, 1700], 0.07, 'triangle'); ring(wx, wy, '#ffffff', 1.5, 0.5); mentor('It\'s raining chickens! Dinner is served.', 'cluck', 10);
      } else if (k === 'speed') {
        const e = entAt(wx, wy, true); if (!e) { mentor('Cast Speed Monster on one of your creatures, Keepa.', 'speedwhere', 8); return; }
        S.gold -= Sp.cost; e.speedT = 30; fx(e.x, e.y - 0.5, 's', '#80ffff', 6); ring(e.x, e.y, '#80ffff', 1, 0.4); G.note(880, 0.1, 'triangle'); G.note(1320, 0.1, 'triangle');
      } else if (k === 'heal') {
        S.gold -= Sp.cost;
        for (const e of S.ourList) if (Math.hypot(e.x - wx, e.y - wy) < 3) { e.hp = Math.min(e.mhp, e.hp + e.mhp * 0.6); float(e.x, e.y - 1.2, '+', '#60ff60'); }
        fx(wx, wy, 's', '#60ff60', 8); ring(wx, wy, '#60ff60', 2.5, 0.6); G.sfx('solve');
      }
    }
    function lookTap(wx, wy) { // touring: what's that?
      const e = entAt(wx, wy, true) || entAt(wx, wy, false);
      if (e) { float(e.x, e.y - 1.6, e.hero ? K[e.k].n : e.name, '#ffd400'); mentor(`${e.hero ? K[e.k].n : e.name + ' the ' + K[e.k].n}${e.lvl > 1 ? ', level ' + e.lvl : ''}. ${K[e.k].d}`, 'look' + e.id, 3, 'TOUR GUIDE'); G.sfx('click'); return; }
      const i = tileAt(Math.floor(wx), Math.floor(wy)); if (i < 0 || !S.seen[i]) return;
      if (S.room[i]) mentor(`${ROOM[S.room[i]].n}: ${ROOM[S.room[i]].d}`, 'lookr' + S.room[i], 3, 'TOUR GUIDE');
      else if (S.trap[i]) mentor(`${TRAP[S.trap[i]].n}: ${TRAP[S.trap[i]].d}`, 'lookt' + S.trap[i], 3, 'TOUR GUIDE');
      else if (S.t_[i] === HEART) mentor('The Dungeon Heart. If the heroes smash it, it\'s game over for this Keepa.', 'lookh', 3, 'TOUR GUIDE');
    }
    function tap(wx, wy) {
      if (S.mode === 'tour') return lookTap(wx, wy);
      if (S.mode === 'raid') return raidTap(wx, wy);
      if (tool === 'hand') handTap(wx, wy);
      else if (tool === 'slap') { const e = entAt(wx, wy, true); if (e) slap(e); else slapChicken(wx, wy); }
      else if (SPELLS[tool]) cast(tool, wx, wy);
      else applyTool(tileAt(Math.floor(wx), Math.floor(wy)), true);
    }

    // ---------------------------------------------------------------- input
    let drag = null;
    const world = p => ({ wx: (cam.x + p.x) / TS, wy: (cam.y + p.y) / TS });
    const local = ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * cv.width / r.width, y: (ev.clientY - r.top) * cv.height / r.height }; };
    G.on(cv, 'pointerdown', ev => {
      if (!S || S.done || paused) return;
      ev.preventDefault(); try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
      const p = local(ev), w = world(p);
      if (ev.button === 2) { if (playing()) { const e = entAt(w.wx, w.wy, true); if (e) slap(e); else slapChicken(w.wx, w.wy); } return; }
      const paint = ev.pointerType === 'mouse' && !visiting() && (tool === 'dig' || tool[0] === 'r' || tool === 'sell');
      drag = { sx: ev.clientX, sy: ev.clientY, cx: cam.x, cy: cam.y, moved: false, paint, last: -1 };
      if (paint) { const i = tileAt(Math.floor(w.wx), Math.floor(w.wy)); drag.last = i; applyTool(i, true); }
    });
    G.on(cv, 'pointermove', ev => {
      const p = local(ev);
      if (ev.pointerType === 'mouse') { mouse = p; const w = world(p); hover = tileAt(Math.floor(w.wx), Math.floor(w.wy)); }
      if (!drag) return;
      if (drag.paint) { const w = world(p), i = tileAt(Math.floor(w.wx), Math.floor(w.wy)); if (i !== drag.last) { drag.last = i; applyTool(i, false); } return; }
      const dx = ev.clientX - drag.sx, dy = ev.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) > 7) drag.moved = true;
      if (drag.moved) { cam.x = drag.cx - dx / scale; cam.y = drag.cy - dy / scale; clampCam(); if (S && S.raid) S.raid.follow = false; }
    });
    const up = ev => {
      if (!drag) return;
      const d = drag; drag = null;
      if (!d.paint && !d.moved && S && !S.done) { const w = world(local(ev)); tap(w.wx, w.wy); }
    };
    G.on(cv, 'pointerup', up); G.on(cv, 'pointercancel', () => { drag = null; });
    G.on(cv, 'pointerleave', ev => { if (ev.pointerType === 'mouse') { mouse = null; hover = -1; } });
    G.on(cv, 'contextmenu', ev => ev.preventDefault());
    G.on(cv, 'wheel', ev => { ev.preventDefault(); if (ev.ctrlKey || Math.abs(ev.deltaY) > 40 && !ev.shiftKey) setZoom(ev.deltaY < 0 ? 1 : -1); }, { passive: false });
    const miniGo = ev => { if (!S) return; if (S.raid) S.raid.follow = false; const r = mini.getBoundingClientRect(); cam.x = (ev.clientX - r.left) / r.width * W * TS - vw / 2; cam.y = (ev.clientY - r.top) / r.height * H * TS - vh / 2; clampCam(); };
    let miniDrag = false;
    G.on(mini, 'pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); miniDrag = true; try { mini.setPointerCapture(ev.pointerId); } catch (e) {} miniGo(ev); });
    G.on(mini, 'pointermove', ev => { if (miniDrag) miniGo(ev); });
    G.on(mini, 'pointerup', () => { miniDrag = false; });
    const keys = {};
    const pickNth = n => { const b = [...gridEl.querySelectorAll('.dg-keepa-btn[data-t]')].filter(x => x.dataset.t)[n]; if (b && !b.disabled) b.click(); };
    G.on(document, 'keydown', ev => {
      if (!G.focused() || !S) return;
      if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
      const k = ev.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) { keys[k] = true; ev.preventDefault(); return; }
      if (S.done || ovEl) return;
      const lk = k.toLowerCase();
      if ((ev.ctrlKey || ev.metaKey) && lk === 'z') { ev.preventDefault(); undo(); return; }
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (lk === 'p' || k === ' ') { ev.preventDefault(); togglePause(); return; }
      if (k === '+' || k === '=') return setZoom(1); if (k === '-') return setZoom(-1);
      if (k === 'Home') return lookAt(S.heartC.x, S.heartC.y);
      if (lk === 'g') { if (S.mode === 'raid') { S.raid.follow = true; banner('FOLLOWING YOUR HEROES'); return; } return goHeroes(); }
      if (lk === 'f') { speed = speed >= 3 ? 1 : speed + 1; banner(speed > 1 ? 'FAST x' + speed : 'NORMAL SPEED'); return; }
      if (visiting()) { if (S.mode === 'raid') { if (lk === 'q') raidAbility('heal'); else if (lk === 'w') raidAbility('charge'); else if (lk === 'e') { if (S.raid.ab.smite <= 0) setTool('smite'); } } if (k === 'Escape') leaveVisit(); return; }
      if (lk === 'd') setTool('dig'); else if (lk === 'h') setTool('hand'); else if (lk === 's') setTool('slap'); else if (lk === 'x') { brush3 = !brush3; buildTab(); }
      else if (k === 'F1' || lk === 'r' || lk === 't' || lk === 'm' || lk === 'b') { ev.preventDefault(); tab = k === 'F1' ? 'tools' : { r: 'rooms', t: 'traps', m: 'spells', b: 'beasts' }[lk]; buildTab(); }
      else if (/^[1-9]$/.test(k)) pickNth(+k - 1);
      else if (k === 'Escape') setTool('dig');
    });
    G.on(document, 'keyup', ev => { keys[ev.key] = false; });
    G.on(window, 'blur', () => { for (const k in keys) keys[k] = false; });

    // ---------------------------------------------------------------- the Mentor's lessons
    const claimedN = () => { let n = 0; for (let i = 0; i < N; i++) if (S.t_[i] === CLAIM) n++; return n; };
    function nearTile(fn, from) { let best = null, bd = 1e9; for (let i = 0; i < N; i++) if (S.seen[i] && fn(i)) { const d = Math.hypot(i % W - from[0], ((i / W) | 0) - from[1]); if (d < bd) { bd = d; best = [i % W, (i / W) | 0]; } } return best; }
    const firstOf = k => { const e = S.ents.find(x => !x.dead && !x.held && (k === 'beast' ? !x.hero && x.k !== 'imp' : x.k === k)); return e ? [e.x - 0.5, e.y - 1] : null; };
    const hl = (tabK, toolK) => tab === tabK ? `.dg-keepa-btn[data-t="${toolK}"]` : `.dg-keepa-tabs [data-k="${tabK}"]`;
    const TUT = [
      { t: 'Welcome, Keepa. I am your <b>Mentor</b>. Evil is a job like any other, and I shall teach it to you.\nFirst, <b>digging</b>. Pick the <b>Dig</b> tool and click the brown earth next to your claimed floor. Mark <b>6 tiles</b>.', goal: () => S.nMark >= 6, target: () => nearTile(i => isDig(S.t_[i]) && S.t_[i] !== ROCK && adjTo(i, n => S.t_[n] === CLAIM), S.L.portal), hl: () => hl('tools', 'dig') },
      { t: 'Your imps dig out the marked earth, then <b>claim</b> the floor: it turns <b>red</b>. Red floor is yours. You build on it. Watch them work, and mark more earth if you like.', base: () => claimedN(), goal: b => claimedN() >= b + 4, target: () => null },
      { t: 'See the glittering seams? That\'s <b>gold</b>. Mark it for digging and the imps carry it to your Heart. Gold pays for rooms, spells and wages. Dig out <b>150 gold</b>.', base: () => S.mined, goal: b => S.mined >= b + 150, target: () => nearTile(i => S.t_[i] === GOLD, S.L.heart), hl: () => hl('tools', 'dig') },
      { t: 'Gold needs a home. Open the <b>Rooms</b> tab and build a <b>Treasury</b> on your red floor: <b>4 tiles</b>. Every Treasury tile holds 500 more gold.', goal: () => rc(3) >= 4, target: () => null, hl: () => hl('rooms', 'r3') },
      { t: 'Now, the <b>Portal</b>: the stone ring my arrow is pointing at. Beasts come through it, but only once your imps claim the floor next to it. <b>Dig a tunnel</b> all the way to it.', goal: () => S.portal, target: () => S.L.portal, hl: () => hl('tools', 'dig') },
      { t: 'Beasts need beds. Build a <b>Lair</b>: one bed per tile, so <b>4 tiles</b> means 4 beasts.', goal: () => rc(1) >= 4, target: () => null, hl: () => hl('rooms', 'r1') },
      { t: 'And they need feeding. Build a <b>Hatchery</b> (<b>4 tiles</b>). Chickens grow there. Other rooms bring other beasts: a Workshop brings Trolls, a Library brings Dark Mages.', goal: () => rc(2) >= 4, target: () => null, hl: () => hl('rooms', 'r2') },
      { t: 'Now <b>the Hand</b>. Pick the <b>Hand</b> tool, click one of your creatures to pick it up, then click the floor somewhere else to drop it. Go on.', base: () => S.drops, goal: b => S.drops >= b + 1, target: () => firstOf('beast') || firstOf('imp'), hl: () => hl('tools', 'hand') },
      { t: 'Lazy imp? <b>Slap</b> it! Pick the <b>Slap</b> tool' + (phone ? '' : ' (or right-click)') + ' and click an imp. Slapped imps work faster for a bit. They don\'t like it. That\'s the point.', base: () => S.slaps, goal: b => S.slaps >= b + 1, target: () => firstOf('imp'), hl: () => hl('tools', 'slap') },
      { t: 'Last lesson: <b>heroes</b>. They march out of the <b>Hero Gate</b> (my arrow) and go for your Dungeon Heart. When the alarm goes, drop your beasts next to them with the Hand, or cast <b>Call to Arms</b>. Beat every wave, then smash their Gate. You\'re ready, Keepa.', btn: 'Got it', goal: () => false, target: () => S.L.gate },
    ];
    let tutShown = -2, tutGlow = null, blinkT = 0, tutFold = false;
    function tutStart() { if (!S) return; S.tut = 0; S.tutB = 0; tutShown = -2; voice(6); }
    function tutEnd(skipped) {
      if (!S || S.tut == null) return;
      S.tut = null; G.save('tut', 1); tutEl.style.display = 'none'; tutShown = -2; clearGlow();
      if (!skipped) { G.secret('keepa.mentor'); fanfare(); mentor('Lessons over. The heroes are on their way now. Make me proud, Keepa. Or at least make me mildly pleased.', null, 0); }
      else mentor('Lessons skipped. You can have them again from Help > Mentor\'s Lessons.', null, 0);
      S.waveT = Math.min(S.waveT, S.L.endless ? S.L.first : 120);
    }
    function clearGlow() { if (tutGlow) { tutGlow.classList.remove('dg-keepa-glow'); tutGlow = null; } }
    function tutTarget() { if (!S || S.tut == null || !TUT[S.tut]) return null; return TUT[S.tut].target(); }
    function tutTick() {
      if (!S || S.tut == null || !playing()) { if (tutEl.style.display !== 'none') { tutEl.style.display = 'none'; clearGlow(); } return; }
      const st = TUT[S.tut];
      if (!st) { tutEnd(); return; }
      if (st.goal(S.tutB)) {
        S.tut++; const nx = TUT[S.tut]; S.tutB = nx && nx.base ? nx.base() : 0;
        tune([523, 659, 784], 0.08, 'triangle'); float(S.heartC.x, S.heartC.y - 2.4, 'WELL DONE', '#ffd400');
        if (!nx) { tutEnd(); return; }
        voice(5); tutFold = false;
      }
      if (tutShown !== S.tut) {
        tutShown = S.tut; const s2 = TUT[S.tut];
        tutEl.style.display = '';
        tutEl.innerHTML = `<canvas width="14" height="16"></canvas><div><b class="who">YOUR MENTOR · LESSON ${S.tut + 1} OF ${TUT.length}</b><div class="tx">${s2.t.replace(/\n/g, '<br>')}</div><div class="pr">${TUT.map((_, i) => `<i class="${i <= S.tut ? 'on' : ''}"></i>`).join('')}</div><div class="dg-keepa-tbar">${s2.btn ? `<button type="button" data-a="ok">${s2.btn}</button>` : '<small>Do it and I\'ll know.</small>'}<button type="button" data-a="skip" title="Skip the rest of the lessons (you can have them again from the Help menu)">Skip lessons</button></div></div>`;
        drawPortrait(tutEl.querySelector('canvas'), 'MENTOR');
        const pc = tutEl.querySelector('canvas'); pc.title = 'Click to fold the Mentor away (click again to bring him back)'; pc.style.cursor = 'pointer';
        pc.addEventListener('click', ev => { ev.stopPropagation(); tutFold = !tutFold; tutEl.lastElementChild.style.display = tutFold ? 'none' : ''; G.sfx('click'); });
        if (tutFold) tutEl.lastElementChild.style.display = 'none';
        tutEl.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); G.sfx('click'); if (b.dataset.a === 'skip') tutEnd(true); else { S.tut++; if (S.tut >= TUT.length) tutEnd(); } }));
      }
      const sel = st.hl ? st.hl() : null, g = sel ? root.querySelector(sel) : null;
      if (g !== tutGlow) { clearGlow(); if (g) { g.classList.add('dg-keepa-glow'); tutGlow = g; } }
      blinkT -= 0.25; if (blinkT <= 0) { blinkT = 2 + Math.random() * 3; const c = tutEl.querySelector('canvas'); if (c) { drawPortrait(c, 'MENTOR', true); G.timer(() => drawPortrait(c, 'MENTOR'), 150); } }
    }

    // ---------------------------------------------------------------- JackNet: visiting somebody else's dungeon
    function visitMap(v) { // check and unpack a downloaded dungeon (never trust it)
      const d = v && v.data; if (!d || typeof d.t !== 'string' || d.t.length !== N) return null;
      const okXY = p => Array.isArray(p) && p.length === 2 && Number.isInteger(p[0]) && Number.isInteger(p[1]) && p[0] >= 3 && p[1] >= 3 && p[0] < W - 3 && p[1] < H - 3;
      if (!okXY(d.heart) || !okXY(d.gate) || !okXY(d.portal)) return null;
      const t = dec(d.t.replace(/[\s\S]/g, c => String.fromCharCode(c.charCodeAt(0) - 49)), new Uint8Array(N), 12), room = dec(String(d.room || ''), new Uint8Array(N), NROOM), trap = dec(String(d.trap || ''), new Uint8Array(N), 5), tb = new Uint8Array(N);
      for (let i = 0; i < N; i++) if (trap[i]) { if (t[i] !== CLAIM) trap[i] = 0; else tb[i] = 1; }
      if (t[d.heart[1] * W + d.heart[0]] !== HEART) return null;
      for (let x = 0; x < W; x++) { t[x] = t[x + W * (H - 1)] = ROCK; } for (let y = 0; y < H; y++) { t[y * W] = t[y * W + W - 1] = ROCK; }
      return { t, gold: new Int32Array(N), room, trap, tb };
    }
    function buildVisit(v, mode) {
      const m = visitMap(v); if (!m) return false;
      const d = v.data, L = { n: v.title, seed: 0, gold: 0, heart: d.heart, portal: d.portal, gate: d.gate, first: 9e9, gap: 9e9, mult: 1, base: 1, waves: [] };
      makeState(-1, L, m, mode); S.visit = v; S.portal = !!d.po; S.gold = 99999;
      for (const x of (Array.isArray(d.ents) ? d.ents.slice(0, 60) : [])) {
        if (!Array.isArray(x)) continue;
        const [k, ex, ey, lv] = x; if (k !== 'imp' && !BEASTS.includes(k)) continue;
        const i = tileAt(Math.floor(+ex), Math.floor(+ey)); if (i < 0 || !isWalk(m.t[i])) continue;
        const e = spawn(k, +ex, +ey); e.lvl = clamp(lv | 0, 1, 6); e.mhp = e.hp = Math.round(K[k].hp * lvlMul(e)); e.happy = 100; e.hunger = 0; e.tired = rnd(0, 70);
      }
      initDerived();
      for (const e of S.ents) if (!e.hero && e.k !== 'imp') assignLair(e);
      if (mode === 'tour') S.seen.fill(1); else { reveal(d.gate[0], d.gate[1], 4); reveal(d.heart[0], d.heart[1], 2); }
      return true;
    }
    function openVisit(full) {
      if (!full || !full.data) return;
      if (!visitMap(full)) { G.msg('JackNet Dungeons', 'That dungeon seems to be corrupt. (Probably Dave\'s.)', 'warn'); return; }
      if (playing()) { visitStash = serial(); try { AS.now(); } catch (e) {} }
      if (S && !visiting()) { paused = true; }
      visitLobby(full);
    }
    function visitLobby(v) {
      const t = v.stats || {};
      const o = overlay(`<div class="dg-keepa-box" style="text-align:center"><h2>${esc(v.title)}</h2><p>A dungeon by <b>${esc(v.name)}</b>, built in ${esc(t.realm || 'a faraway realm')}.
${t.beasts | 0} beasts · ${t.imps | 0} imps · ${t.rooms | 0} room tiles · ${t.traps | 0} traps · ${t.doors | 0} doors${t.waves ? ` · survived ${t.waves | 0} waves` : ''}
${esc(resTxt(v.res))}.

<b>Tour it</b> to have a look round, or <b>raid it</b>: you lead a party of heroes in, and try to smash ${esc(v.name)}'s Dungeon Heart before your time runs out.</p><div class="dg-keepa-rateslot"></div><div class="row"><button class="dg-keepa-mbtn" data-a="tour">TOUR IT</button><button class="dg-keepa-mbtn" data-a="raid">RAID IT!</button><button class="dg-keepa-mbtn" data-a="back">BACK</button></div></div>`);
      if (D.rateBox) o.querySelector('.dg-keepa-rateslot').appendChild(D.rateBox('keepa', v));
      on(o, '[data-a=tour]', () => startVisit(v, 'tour'));
      on(o, '[data-a=raid]', () => partyPick(v));
      on(o, '[data-a=back]', () => leaveVisit());
    }
    function startVisit(v, mode, party) {
      if (titleStop) { titleStop(); titleStop = null; }
      closeOv(); paused = false; resize();
      if (!buildVisit(v, mode)) { G.msg('JackNet Dungeons', 'That dungeon seems to be corrupt.', 'warn'); leaveVisit(); return; }
      if (mode === 'raid') {
        const [gx, gy] = S.L.gate, spots = []; for (let y = gy - 2; y <= gy + 2; y++) for (let x = gx - 2; x <= gx + 2; x++) { const i = tileAt(x, y); if (i >= 0 && isWalk(S.t_[i])) spots.push([x, y]); }
        let n = 0; for (const k in party) for (let q = 0; q < party[k]; q++) { const [x, y] = spots[n % spots.length] || [gx, gy + 2]; const h = spawn(k, x + 0.5 + rnd(-0.2, 0.2), y + 0.5, { think: n * 0.2 }); h.tgt = HEART_T; n++; }
        S.raid = { t: 300, order: -1, oid: 1, focus: null, ab: { heal: 0, charge: 0, smite: 0 }, party: n, kills: 0, follow: true };
        lookAt(S.gateC.x, S.gateC.y); tool = 'move';
        banner('RAID!', 'Smash the Dungeon Heart in 5 minutes'); alarmTune();
        mentor(`You're the goodies now. Lead your heroes into ${v.name}'s dungeon and smash the Heart. Click the floor to move them, click a defender to gang up on it.`, null, 0, 'SIR CALLUM');
      } else { tool = 'look'; mentor(`Welcome to ${v.name}'s dungeon. Look around: click anything to find out what it is. Nothing you do here is saved.`, null, 0, 'TOUR GUIDE'); }
      setTool(tool); buildTabs(); buildTab(); strip(); setMenu();
      if (opt.music && G.sound) G.music('keepa');
    }
    function strip() {
      if (!visiting()) { stripEl.style.display = 'none'; return; }
      const v = S.visit;
      stripEl.style.display = '';
      stripEl.innerHTML = `<span class="t">${S.mode === 'raid' ? 'RAIDING' : 'TOURING'}: ${esc(v.title)}<small>by ${esc(v.name)} on JackNet · ${esc(resTxt(v.res))}</small></span><span class="rs"></span>${S.mode === 'tour' ? '<button type="button" data-a="raid" title="Lead a party of heroes in">Raid it!</button>' : ''}<button type="button" data-a="leave" title="Go home (Esc)">Leave</button>`;
      if (D.rateBox && !phone) stripEl.querySelector('.rs').appendChild(D.rateBox('keepa', v));
      stripEl.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { G.sfx('click'); if (b.dataset.a === 'raid') partyPick(v); else leaveVisit(); }));
    }
    function leaveVisit() {
      stripEl.style.display = 'none'; alarmEl.classList.remove('on');
      const st = visitStash; visitStash = null;
      if (st && LV[st.lvl]) { try { start(st.lvl, st); togglePause(true); return; } catch (e) { console.error(e); } }
      title();
    }
    // ---- the raid
    const PARTY = ['knight', 'archer', 'dwarf', 'wizard', 'callum'];
    function raidBudget(v) {
      const d = v.data || {}, t = v.stats || {};
      let lv = 0; for (const x of (Array.isArray(d.ents) ? d.ents : [])) if (Array.isArray(x) && x[0] !== 'imp') lv += clamp(x[3] | 0, 1, 6);
      return clamp(Math.round((620 + 50 * lv + 30 * (t.traps | 0) + 35 * (t.doors | 0)) / 10) * 10, 700, 2400);
    }
    function partyPick(v) {
      const was = S && S.mode === 'raid' && !S.done; if (was) paused = true;
      const budget = raidBudget(v), saved = G.load('party', null), party = Object.assign({ knight: 2, archer: 1, dwarf: 1, wizard: 1, callum: 0 }, saved || {});
      const cost = () => PARTY.reduce((a, k) => a + (party[k] | 0) * K[k].pts, 0), count = () => PARTY.reduce((a, k) => a + (party[k] | 0), 0);
      while (cost() > budget) { const k = PARTY.slice().reverse().find(k => party[k] > 0); if (!k) break; party[k]--; }
      if (!saved) for (let q = 0; q < 12; q++) { const k = ['knight', 'archer', 'knight', 'wizard', 'dwarf'][q % 5]; if (cost() + K[k].pts <= budget && count() < 10) party[k]++; } // a sensible first party
      const o = overlay(`<div class="dg-keepa-box" style="text-align:center"><h2>PICK YOUR HEROES</h2><p>Raiding <b>${esc(v.title)}</b> by ${esc(v.name)}. A dungeon like that is worth <b>${budget}</b> Valour. Spend it on heroes (up to 10).</p><div class="dg-keepa-party"></div><div class="dg-keepa-val"></div><div class="row"><button class="dg-keepa-mbtn" data-a="go">CHARGE!</button><button class="dg-keepa-mbtn" data-a="back">BACK</button></div></div>`);
      const grid = o.querySelector('.dg-keepa-party'), val = o.querySelector('.dg-keepa-val');
      const draw = () => {
        grid.innerHTML = '';
        for (const k of PARTY) {
          const c = mkC(12, 14); c.getContext('2d').drawImage(SP[k].a, 0, 0);
          const lab = el('span', null, `<b>${esc(K[k].n)}</b> · ${K[k].pts}<br><small>${esc(K[k].d)}</small>`);
          const minus = el('button', 'btn', '−'), n = el('b', null, String(party[k] | 0)), plus = el('button', 'btn', '+');
          minus.type = plus.type = 'button'; minus.title = 'One fewer'; plus.title = 'One more';
          minus.disabled = !(party[k] > 0); plus.disabled = cost() + K[k].pts > budget || count() >= 10 || (k === 'callum' && party[k] >= 1);
          minus.onclick = () => { party[k]--; G.sfx('click'); draw(); }; plus.onclick = () => { party[k] = (party[k] | 0) + 1; G.sfx('click'); draw(); };
          grid.append(c, lab, minus, n, plus);
        }
        val.textContent = `Valour left: ${budget - cost()}   ·   Heroes: ${count()}`;
        o.querySelector('[data-a=go]').disabled = !count();
      };
      draw();
      on(o, '[data-a=go]', () => { G.save('party', party); startVisit(v, 'raid', Object.assign({}, party)); });
      on(o, '[data-a=back]', () => { if (was) { closeOv(); paused = false; } else if (S && S.mode === 'tour') { closeOv(); paused = false; } else visitLobby(v); });
    }
    function raidTap(wx, wy) {
      const R = S.raid, i = tileAt(Math.floor(wx), Math.floor(wy)); if (i < 0) return;
      if (tool === 'smite') {
        if (R.ab.smite > 0 || !S.seen[i]) return;
        R.ab.smite = 20; S.bolts.push({ x: wx, y: wy, t: 0.35 }); G.sfx('zap'); shake(0.25);
        for (const e of S.ents.slice()) if (!e.dead && !e.hero && Math.hypot(e.x - wx, e.y - wy) < 1.8) hurt(e, 80);
        setTool('move'); buildTab(); return;
      }
      const e = entAt(wx, wy, true);
      if (e && S.seen[tileOf(e)]) { R.focus = e; G.note(700, 0.05, 'square'); float(e.x, e.y - 1.6, 'GET IT!', '#ff4040'); for (const h of S.heroList) h.think = 0; return; }
      if (!S.seen[i]) { float(wx, wy, '?', '#ffffff'); return; }
      if (S.t_[i] === ROCK && !inner(i)) return;
      R.order = i; R.oid++; R.focus = null; ring(i % W + 0.5, ((i / W) | 0) + 0.5, '#5aa0ff', 1.2, 0.4); G.note(520, 0.05, 'triangle'); G.note(780, 0.06, 'triangle');
      for (const h of S.heroList) { h.think = 0; h.tgt = null; }
    }
    function raidAbility(k) {
      if (!S || S.mode !== 'raid' || S.done) return;
      const R = S.raid; if (R.ab[k] > 0) { G.sfx('uhoh'); return; }
      if (k === 'heal') { R.ab.heal = 25; for (const h of S.heroList) { h.hp = Math.min(h.mhp, h.hp + h.mhp * 0.5); float(h.x, h.y - 1.3, '+', '#80ff80'); ring(h.x, h.y, '#80ff80', 0.8, 0.4); } G.sfx('solve'); }
      else if (k === 'charge') { R.ab.charge = 35; for (const h of S.heroList) { h.speedT = 10; fx(h.x, h.y - 0.5, 's', '#80ffff', 3); } tune([523, 659, 784, 1047], 0.08); banner('CHARGE!'); }
      buildTab();
    }
    function raidKill(e) {
      const R = S.raid;
      if (e.hero) { float(e.x, e.y - 1.8, 'K.O.', '#ff6060'); if (S.heroList.length > 1) mentor(pick([`Your ${K[e.k].n} is out of the fight.`, `${K[e.k].n} down! Keep going!`, 'Ouch. That one has gone home to his Mom.']), 'herodown', 6, 'SIR CALLUM'); }
      else { R.kills++; S.kills++; float(e.x, e.y - 1.8, 'BEATEN', '#5aa0ff'); }
    }
    function raidTick(dt) {
      const R = S.raid; if (!R || S.done) return;
      if (R.follow && S.heroList.length) { let x = 0, y = 0; for (const h of S.heroList) { x += h.x; y += h.y; } x /= S.heroList.length; y /= S.heroList.length; const tx = x * TS - vw / 2, ty = y * TS - vh / 2; cam.x += (tx - cam.x) * Math.min(1, dt * 2.5); cam.y += (ty - cam.y) * Math.min(1, dt * 2.5); clampCam(); }
      R.t -= dt; for (const k in R.ab) if (R.ab[k] > 0) R.ab[k] -= dt;
      if (S.heartHp <= 0) raidEnd(true);
      else if (!S.heroList.length) raidEnd(false, 'Your whole party got sent home.');
      else if (R.t <= 0) raidEnd(false, 'Time\'s up! The heroes went home for their tea.');
    }
    function raidEnd(won, why) {
      S.done = true; G.stopMusic(); alarmEl.classList.remove('on');
      const R = S.raid, v = S.visit, secs = Math.round(300 - R.t);
      const tally = Object.assign({ won: 0, lost: 0, best: 0 }, G.load('raids', {}));
      if (won) { tally.won++; if (!tally.best || secs < tally.best) tally.best = secs; G.secret('keepa.raid'); fanfare(); shake(0.4); for (let q = 0; q < 30; q++) fx(S.heartC.x + rnd(-1, 1), S.heartC.y + rnd(-1, 1), 'p', pick(['#ff2020', '#ffd0d0', '#500000']), 1); }
      else { tally.lost++; G.sfx('shutdown'); }
      G.save('raids', tally);
      if (D.net && D.net.rec) D.net.rec('keepa', { won: tally.won, lost: tally.lost, best: tally.best, last: String(v.name).slice(0, 20), lastWon: won ? 1 : 0 });
      // tell JackNet how the raid on their dungeon went (the owner sees it in the list); not for your own dungeon
      if (!v.mine && D.net && D.net.res) { D.net.res('keepa', v.name, won); v.res = { w: ((v.res && v.res.w) | 0) + (won ? 1 : 0), l: ((v.res && v.res.l) | 0) + (won ? 0 : 1) }; }
      S.raidRes = { won, why, tally, secs }; raidResult(); strip();
    }
    function raidResult() {
      const R = S.raid, v = S.visit, { won, why, tally, secs } = S.raidRes;
      const o = overlay(`<div class="dg-keepa-box" style="text-align:center"><h2>${won ? 'HEART SMASHED!' : 'RAID FAILED'}</h2><p>${won ? `You smashed ${esc(v.name)}'s Dungeon Heart in ${fmtT(secs)}. The do-gooders are having a picnic to celebrate. Ugh.` : esc(why || 'The raid failed.')}
Defenders beaten: ${R.kills} · Heroes left: ${S.heroList.length} of ${R.party}
Your raids so far: ${tally.won} won, ${tally.lost} lost${tally.best ? ` · fastest smash ${fmtT(tally.best)}` : ''}
${esc(v.name)}'s dungeon: ${esc(resTxt(v.res))}</p><div class="dg-keepa-rateslot"></div><div class="row"><button class="dg-keepa-mbtn" data-a="again">RAID AGAIN</button><button class="dg-keepa-mbtn" data-a="hall">HALL OF RAIDERS</button><button class="dg-keepa-mbtn" data-a="leave">LEAVE</button></div></div>`);
      if (D.rateBox) o.querySelector('.dg-keepa-rateslot').appendChild(D.rateBox('keepa', v));
      on(o, '[data-a=again]', () => partyPick(v));
      on(o, '[data-a=hall]', () => hall(raidResult));
      on(o, '[data-a=leave]', () => leaveVisit());
    }
    function hall(back) {
      const o = overlay(`<div class="dg-keepa-box" style="text-align:center"><h2>HALL OF RAIDERS</h2><p>JackNet's bravest do-gooders. (Well. Keepas pretending to be do-gooders.)</p><div class="hl"><p>Dialling JackNet...</p></div><div class="row"><button class="dg-keepa-mbtn" data-a="back">BACK</button></div></div>`);
      on(o, '[data-a=back]', () => back());
      const box = o.querySelector('.hl');
      (D.net && D.net.recs ? D.net.recs('keepa') : Promise.resolve(null)).then(items => {
        if (!box.isConnected) return;
        if (!items) { box.innerHTML = '<p>JackNet isn\'t answering. Try again in a minute.</p>'; return; }
        const rows = items.filter(x => x && x.rec).sort((a, b) => (b.rec.won | 0) - (a.rec.won | 0) || (a.rec.best | 0 || 9999) - (b.rec.best | 0 || 9999)).slice(0, 20);
        box.innerHTML = rows.length ? `<table><tr><td><b>Keepa</b></td><td><b>Won</b></td><td><b>Lost</b></td><td><b>Fastest</b></td><td><b>Last raided</b></td></tr>${rows.map(x => `<tr><td>${esc(x.name)}</td><td>${x.rec.won | 0}</td><td>${x.rec.lost | 0}</td><td>${x.rec.best ? fmtT(x.rec.best | 0) : '-'}</td><td>${esc(x.rec.last || '')}${x.rec.lastWon ? ' (smashed it)' : ''}</td></tr>`).join('')}</table>` : '<p>Nobody has raided a dungeon yet. Be the first!</p>';
      });
    }
    // what "Upload my dungeon" sends: the game you're playing (or undefined to fall back to your last save)
    G._keepaMine = () => {
      if (!S || visiting()) return undefined;
      if (S.done) return undefined;
      const u = upData(serial()); if (!u) return null;
      return { title: opt.dname || defName(), data: u.data, stats: u.stats };
    };
    G._keepaVisit = full => openVisit(full);

    // ---------------------------------------------------------------- overlays
    let ovEl = null;
    function overlay(html, cls) { closeOv(); ovEl = el('div', 'dg-keepa-ov' + (cls ? ' ' + cls : ''), html); root.appendChild(ovEl); return ovEl; }
    function closeOv() { if (ovEl) { ovEl.remove(); ovEl = null; } }
    const on = (o, sel, fn) => o.querySelectorAll(sel).forEach(b => b.addEventListener('click', ev => { G.sfx('button'); fn(ev, b); }));

    // the title screen: an animated little dungeon behind the logo
    let titleStop = null;
    function title() {
      S = null; paused = false; G.stopMusic(); stripEl.style.display = 'none'; tutEl.style.display = 'none'; alarmEl.classList.remove('on'); clearGlow();
      if (titleStop) { titleStop(); titleStop = null; }
      const auto = G.load('auto', null), best = G.load('best', 0);
      const o = overlay(`<canvas class="dg-keepa-tcv"></canvas><div class="dg-keepa-logo"><div class="l1">DUNGEON</div><div class="l2">KEEPA<span>2</span></div><div class="l3">It's good to be bad. It's even better to be in charge.</div></div>
        ${auto && LV[auto.lvl] && !(G.demo && auto.lvl > 0) ? '<button class="dg-keepa-mbtn" data-a="cont" title="' + esc(slotInfo(auto)) + '">CONTINUE</button>' : ''}<button class="dg-keepa-mbtn" data-a="new">NEW GAME</button><button class="dg-keepa-mbtn" data-a="load">LOAD GAME</button><button class="dg-keepa-mbtn net" data-a="net" title="Visit and raid other Keepas' dungeons, or show off yours">JACKNET DUNGEONS</button><button class="dg-keepa-mbtn" data-a="help">HOW TO PLAY</button><button class="dg-keepa-mbtn" data-a="quit">QUIT</button>
        <div class="dg-keepa-foot">${G.demo ? 'DEMO VERSION – ' : ''}v1.2 © 1999 Bulljack Productions.${best ? ` Your best in the Bottomless Pit: ${best} waves.` : ' Sir Callum the Brave appears courtesy of himself.'}</div>`, 'dg-keepa-title');
      on(o, '[data-a=cont]', () => { const a = G.load('auto', null); if (a && LV[a.lvl]) start(a.lvl, a); });
      on(o, '[data-a=new]', () => realmMap());
      on(o, '[data-a=load]', () => slots('load'));
      on(o, '[data-a=net]', () => openShowcase());
      on(o, '[data-a=help]', () => help());
      on(o, '[data-a=quit]', () => G.quit());
      const tc = o.querySelector('canvas'), tx = tc.getContext('2d'), rr = root.getBoundingClientRect(), TW = rr.width > rr.height ? 240 : 160, TH = Math.round(TW * (rr.height || 150) / (rr.width || 240)), FY = Math.round(TH * 0.62 / 16) * 16;
      tc.width = TW; tc.height = TH; tx.imageSmoothingEnabled = false;
      const marchers = [0, 1, 2, 3, 4].map(k => ({ x: -20 - k * 22, k: ['imp', 'imp', 'squig', 'belcher', 'troll'][k] }));
      const flee = { x: 140 };
      titleStop = G.loop((dt, t) => {
        if (!tc.isConnected) { titleStop(); titleStop = null; return; }
        for (let y = 0; y < TH; y += 16) for (let x = 0; x < TW; x += 16) { const v = ((x * 7 + y * 13) >> 4) % 4; tx.drawImage(y >= FY && y < FY + 32 ? TL[CLAIM][v % 2] : TL[y < 16 || y >= TH - 16 ? ROCK : EARTH][v], x, y); }
        tx.fillStyle = '#4a321c'; tx.fillRect(0, FY, TW, 5); tx.fillStyle = '#5e4228'; tx.fillRect(0, FY, TW, 1);
        tx.fillStyle = 'rgba(8,2,14,.45)'; tx.fillRect(0, 0, TW, TH);
        for (const tx0 of [Math.round(TW * 0.12), Math.round(TW * 0.84)]) { tx.fillStyle = '#3a2a1a'; tx.fillRect(tx0, FY - 16, 3, 10); const fl = Math.sin(t / 90 + tx0) > 0; tx.fillStyle = fl ? '#ffd400' : '#ff8a00'; tx.fillRect(tx0 - 1, FY - 21, 5, 5); tx.fillStyle = '#fff6a0'; tx.fillRect(tx0, fl ? FY - 20 : FY - 19, 3, 2); tx.globalCompositeOperation = 'lighter'; tx.globalAlpha = 0.5 + 0.1 * Math.sin(t / 70); tx.drawImage(SP.warm, tx0 - 30, FY - 48, 62, 62); tx.globalAlpha = 1; tx.globalCompositeOperation = 'source-over'; }
        for (const m of marchers) { m.x += dt * 22; if (m.x > TW + 20) m.x = -20; const s = SP[m.k], fr = Math.floor(t / 150) % 2 ? s.b : s.a; tx.drawImage(fr, Math.round(m.x), FY + 20 - fr.height); }
        flee.x += dt * 34; if (flee.x > TW + 40) flee.x = -60; const ks = SP.knight, kf = Math.floor(t / 110) % 2 ? ks.b : ks.a; tx.drawImage(kf, Math.round(flee.x), FY + 20 - kf.height);
      });
    }
    // ---- the realm map: a land of disgustingly nice places, turning dark as you conquer them
    function wonSet() {
      const w = new Set(G.load('won', [])), u = G.load('unl', 1);
      if (u >= 2) w.add(0); if (u >= 3) w.add(1);
      return w;
    }
    function unlocked(i) {
      if (G.demo) return i === 0;
      if (LV[i].endless) return true;
      const w = wonSet(), p = ORDER.indexOf(i);
      return p === 0 || w.has(i) || w.has(ORDER[p - 1]) || (i < 3 && i < G.load('unl', 1));
    }
    function drawRealmMap(c, sel) {
      const x = c.getContext('2d'), w = wonSet(); x.imageSmoothingEnabled = false;
      let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      x.fillStyle = '#4a8a2a'; x.fillRect(0, 0, 320, 200);
      for (let k = 0; k < 400; k++) { x.fillStyle = r() < 0.5 ? '#3e7a22' : '#5a9a32'; x.fillRect(Math.floor(r() * 320), Math.floor(r() * 200), 2 + Math.floor(r() * 4), 1); }
      x.fillStyle = '#2a5ab8'; x.beginPath(); x.moveTo(130, 0); x.quadraticCurveTo(180, 30, 240, 0); x.fill(); // the sea at Mudwallop
      x.fillStyle = '#4a7ad8'; for (let k = 0; k < 8; k++) x.fillRect(150 + k * 10, 4 + (k % 2) * 3, 4, 1);
      x.strokeStyle = '#3a6ac8'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 90); x.bezierCurveTo(80, 70, 120, 140, 200, 100); x.bezierCurveTo(250, 80, 280, 170, 320, 150); x.stroke(); // a river
      for (let k = 0; k < 14; k++) { const tx0 = Math.floor(r() * 320), ty0 = Math.floor(r() * 200); x.fillStyle = '#2a5a1a'; x.fillRect(tx0, ty0, 5, 4); x.fillStyle = '#5a3a1a'; x.fillRect(tx0 + 2, ty0 + 4, 1, 2); }
      // conquered realms rot
      for (const i of w) { const L = LV[i]; if (!L) continue; const g = x.createRadialGradient(L.mx, L.my, 4, L.mx, L.my, 46); g.addColorStop(0, 'rgba(40,0,30,.95)'); g.addColorStop(0.7, 'rgba(60,10,30,.6)'); g.addColorStop(1, 'rgba(60,10,30,0)'); x.fillStyle = g; x.fillRect(L.mx - 50, L.my - 50, 100, 100); x.fillStyle = '#ff4a00'; for (let k = 0; k < 6; k++) x.fillRect(L.mx - 20 + Math.floor(r() * 40), L.my - 16 + Math.floor(r() * 32), 3, 1); }
      // the road between them
      x.fillStyle = '#d8c890'; for (let q = 0; q < ORDER.length - 1; q++) { const a = LV[ORDER[q]], b = LV[ORDER[q + 1]]; for (let s = 0; s <= 20; s++) { if (s % 2) continue; x.fillRect(Math.round(a.mx + (b.mx - a.mx) * s / 20), Math.round(a.my + (b.my - a.my) * s / 20) + 6, 2, 2); } }
      LV.forEach((L, i) => {
        const cx = L.mx, cy = L.my, ok = unlocked(i), done = w.has(i);
        if (L.endless) { x.fillStyle = '#000'; x.beginPath(); x.ellipse(cx, cy + 4, 12, 7, 0, 0, 7); x.fill(); x.strokeStyle = '#ff3a00'; x.lineWidth = 1; x.beginPath(); x.ellipse(cx, cy + 4, 12, 7, 0, 0, 7); x.stroke(); }
        else if (i === 2) { x.fillStyle = '#c0c0c8'; x.fillRect(cx - 9, cy - 6, 18, 12); x.fillRect(cx - 11, cy - 10, 5, 16); x.fillRect(cx + 6, cy - 10, 5, 16); x.fillStyle = '#2a2a32'; x.fillRect(cx - 2, cy + 1, 4, 5); }
        else if (i === 4) { x.fillStyle = '#d8d0b8'; x.fillRect(cx - 8, cy - 4, 16, 10); x.fillRect(cx - 2, cy - 14, 5, 10); x.fillStyle = '#8a3a2a'; x.fillRect(cx - 9, cy - 6, 18, 2); x.fillStyle = '#ffd400'; x.fillRect(cx, cy - 12, 1, 2); }
        else { for (const [ax, ay] of [[-8, 0], [2, -3], [-2, 5]]) { x.fillStyle = '#e8e0c8'; x.fillRect(cx + ax, cy + ay, 7, 5); x.fillStyle = i === 1 ? '#3a6ac8' : '#b0402a'; x.fillRect(cx + ax - 1, cy + ay - 2, 9, 2); } if (i === 3) { x.fillStyle = '#3a6ac8'; x.beginPath(); x.ellipse(cx + 12, cy + 6, 5, 3, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(cx + 11, cy + 5, 2, 1); } }
        // a flag: blue for the do-gooders, red and black once it's yours
        x.fillStyle = '#3a2a1a'; x.fillRect(cx + 10, cy - 18, 1, 12); x.fillStyle = done || L.endless ? '#c01010' : '#2a5ad8'; x.fillRect(cx + 11, cy - 18, 7, 4); x.fillStyle = done || L.endless ? '#000' : '#fff'; x.fillRect(cx + 13, cy - 17, 2, 2);
        if (!ok) { x.fillStyle = 'rgba(160,160,170,.65)'; x.beginPath(); x.arc(cx, cy, 16, 0, 7); x.fill(); x.fillStyle = '#3a3a40'; x.fillRect(cx - 3, cy - 2, 6, 5); x.strokeStyle = '#3a3a40'; x.beginPath(); x.arc(cx, cy - 3, 2.5, Math.PI, 0); x.stroke(); }
        if (sel === i) { x.strokeStyle = '#ffd400'; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, 19, 0, 7); x.stroke(); }
        ptext(x, (L.endless ? 'THE PIT' : L.n.replace('\'S', '').replace('-on-Sea', '')).toUpperCase().replace(/[^A-Z ]/g, ''), cx, cy + 15, done ? '#ff8a6a' : ok ? '#ffffff' : '#a0a0a8');
      });
    }
    function realmMap() {
      const w = wonSet();
      const o = overlay(`<div class="dg-keepa-box wide" style="text-align:center"><h2>THE REALMS</h2><canvas class="dg-keepa-rmap" width="320" height="200" title="Click a realm to invade it"></canvas>
        <div class="dg-keepa-seg" title="Difficulty (for new games)">${DIFF.map((d, i) => `<button type="button" data-d="${i}" class="${opt.diff === i ? 'on' : ''}">${d.n}</button>`).join('')}</div>
        <div class="dg-keepa-rl">${[...ORDER, ENDLESS].map((i, n) => { const L = LV[i], ok = unlocked(i), done = w.has(i); return `<button class="dg-keepa-lvl${done ? ' won' : ''}" data-l="${i}" ${ok ? '' : 'disabled'}><span class="no">${L.endless ? '∞' : n + 1}</span><span><b>${esc(L.n)}</b><br>${G.demo && i ? 'FULL VERSION ONLY' : !ok ? 'Locked: conquer the realm before it' : L.endless ? `Endless waves${G.load('best', 0) ? ` · best ${G.load('best', 0)}` : ''}` : `${done ? 'CONQUERED · ' : ''}${L.waves.length} waves`}</span></button>`; }).join('')}</div>
        <div class="row"><button class="dg-keepa-mbtn" data-a="back">BACK</button></div></div>`);
      const c = o.querySelector('canvas'); let sel = -1; drawRealmMap(c, sel);
      const pickAt = ev => { const r = c.getBoundingClientRect(), mx = (ev.clientX - r.left) * 320 / r.width, my = (ev.clientY - r.top) * 200 / r.height; let best = -1, bd = 22; LV.forEach((L, i) => { const d = Math.hypot(L.mx - mx, L.my - my); if (d < bd) { bd = d; best = i; } }); return best; };
      c.addEventListener('pointermove', ev => { const i = pickAt(ev); if (i !== sel) { sel = i; drawRealmMap(c, sel); c.title = i >= 0 ? LV[i].n + (unlocked(i) ? '' : ' (locked)') : 'Click a realm to invade it'; } });
      c.addEventListener('click', ev => { const i = pickAt(ev); if (i >= 0 && unlocked(i)) { G.sfx('button'); briefing(i); } else if (i >= 0) G.sfx('uhoh'); });
      on(o, '[data-d]', (ev, b) => { opt.diff = +b.dataset.d; saveOpt(); o.querySelectorAll('[data-d]').forEach(x => x.classList.toggle('on', x === b)); });
      on(o, '[data-l]', (ev, b) => briefing(+b.dataset.l));
      on(o, '[data-a=back]', () => title());
    }
    function briefing(lvl) {
      const L = LV[lvl], lessons = !G.load('tut', 0);
      const o = overlay(`<div class="dg-keepa-box"><h2>${L.endless ? 'THE BOTTOMLESS PIT' : `REALM: ${esc(L.n.toUpperCase())}`}</h2><p>${esc(L.brief)}</p><p style="font:11px Tahoma,sans-serif;color:#d0b080">Difficulty: <b>${DIFF[opt.diff].n}</b> (change it on the realm map). ${L.endless ? '' : `${L.waves.length} waves. `}Starting gold: ${Math.round(L.gold * DIFF[opt.diff].g / 50) * 50}.</p><label style="display:flex;gap:6px;align-items:center;justify-content:center;font:11px Tahoma,sans-serif"><input type="checkbox" data-a="tut" ${lessons ? 'checked' : ''}> Mentor's lessons (learn to play as you go)</label><div class="row"><button class="dg-keepa-mbtn" data-a="go">BEGIN, KEEPA</button><button class="dg-keepa-mbtn" data-a="back">BACK</button></div></div>`);
      on(o, '[data-a=go]', () => { const t = o.querySelector('[data-a=tut]').checked; start(lvl, null, t); });
      on(o, '[data-a=back]', () => realmMap());
    }
    function start(lvl, saved, lessons) {
      if (titleStop) { titleStop(); titleStop = null; }
      closeOv(); paused = false; stripEl.style.display = 'none'; tutShown = -2;
      resize();
      if (saved) restore(saved); else newState(lvl);
      resize(); clampCam();
      tab = 'tools'; buildTabs(); setTool('dig'); buildTab();
      if (!saved) {
        banner(LV[lvl].endless ? 'THE BOTTOMLESS PIT' : 'REALM: ' + LV[lvl].n.toUpperCase(), DIFF[S.diff].n);
        if (lessons) tutStart(); else mentor('Welcome, Keepa. Mark the earth for digging and your imps will carve you a dungeon. The heroes are coming. So is your tea.', null, 0);
      } else mentor('Game loaded. Where were we? Ah yes. Evil.', null, 0);
      if (opt.music && G.sound) G.music('keepa');
      G.sfx('startup');
      setMenu();
    }
    function togglePause(force) {
      if (!S || S.done) return;
      paused = force != null ? force : !paused;
      if (paused) {
        const o = overlay(`<div class="dg-keepa-box" style="text-align:center"><h2>PAUSED</h2><p>Mom shouted up the stairs. The dungeon will wait.</p><div class="row"><button class="dg-keepa-mbtn" data-a="go">CARRY ON</button>${visiting() ? '<button class="dg-keepa-mbtn" data-a="leave">LEAVE</button>' : '<button class="dg-keepa-mbtn" data-a="save">SAVE</button><button class="dg-keepa-mbtn" data-a="title">QUIT TO TITLE</button>'}</div></div>`);
        on(o, '[data-a=go]', () => togglePause(false)); on(o, '[data-a=save]', () => slots('save')); on(o, '[data-a=title]', () => confirmTitle()); on(o, '[data-a=leave]', () => leaveVisit()); G.stopMusic();
      } else { closeOv(); if (opt.music && G.sound) G.music('keepa'); }
      if (pauseBtn) pauseBtn.textContent = paused ? '▶' : 'II';
    }
    function confirmTitle() {
      const o = overlay(`<div class="dg-keepa-box" style="text-align:center"><h2>QUIT TO TITLE?</h2><p>Unsaved evil will be lost. (There's an autosave every minute, and CONTINUE on the title screen.)</p><div class="row"><button class="dg-keepa-mbtn" data-a="y">QUIT</button><button class="dg-keepa-mbtn" data-a="n">CANCEL</button></div></div>`);
      on(o, '[data-a=y]', () => { if (playing()) G.save('auto', serial()); title(); }); on(o, '[data-a=n]', () => { if (S && !S.done) { paused = false; togglePause(true); } else title(); });
    }
    const backTo = wasPaused => { if (S && !S.done) { paused = wasPaused; if (paused) togglePause(true); else closeOv(); } else title(); };
    function slots(mode) {
      const wasPaused = paused; if (S && !S.done) paused = true;
      if (mode === 'save' && !playing()) return backTo(wasPaused);
      const rows = [1, 2, 3].map(n => { const o = G.load('slot' + n, null); return `<div class="dg-keepa-slot"><b>${n}</b><span>${esc(slotInfo(o))}</span>${mode === 'save' ? `<button class="btn" data-s="${n}">Save</button>` : `<button class="btn" data-l="slot${n}" ${o ? '' : 'disabled'}>Load</button>`}</div>`; });
      if (mode === 'load') { const a = G.load('auto', null); rows.push(`<div class="dg-keepa-slot"><b>A</b><span>Autosave: ${esc(slotInfo(a))}</span><button class="btn" data-l="auto" ${a ? '' : 'disabled'}>Load</button></div>`); rows.push(`<div class="dg-keepa-slot"><b>C</b><span>CALLUM'S SAVE – "DO NOT LOAD THIS JACK" – Realm 3, 0 gold, 46 imps</span><button class="btn" data-c="1">Load</button></div>`); }
      const o = overlay(`<div class="dg-keepa-box"><h2>${mode === 'save' ? 'SAVE GAME' : 'LOAD GAME'}</h2>${rows.join('')}<div class="row"><button class="dg-keepa-mbtn" data-a="back">BACK</button></div></div>`);
      on(o, '[data-s]', (ev, b) => { G.save('slot' + b.dataset.s, serial()); G.sfx('solve'); mentor('Game saved in slot ' + b.dataset.s + '. Your evil is safe.', null, 0); paused = wasPaused; if (paused) togglePause(true); else closeOv(); });
      on(o, '[data-l]', (ev, b) => { const d = G.load(b.dataset.l, null); if (!d || !LV[d.lvl]) return; if (G.demo && d.lvl > 0) { G.msg('Dungeon Keepa 2', 'That saved game is from a realm that isn\'t on the demo disc.', 'warn'); return; } visitStash = null; start(d.lvl, d); });
      on(o, '[data-c]', () => G.msg('Dungeon Keepa 2', 'Error loading CALLUM.SAV: file is corrupt.\n\n(Callum says he "definitely" finished Realm 3 with 46 imps. The save file says otherwise. The save file also says it was last modified at 3am on a school night.)', 'warn'));
      on(o, '[data-a=back]', () => backTo(wasPaused));
    }
    function help() {
      const wasPaused = paused; if (S && !S.done) paused = true;
      const o = overlay(`<div class="dg-keepa-box"><h2>HOW TO PLAY</h2><p><b>Dig.</b> Mark brown earth and glittering gold with the Dig tool. Your imps dig it out, carry the gold to your Treasury (or the Heart) and claim the floor for you (it goes red).
<b>Build.</b> Put rooms on red floor. A Lair (beds) and a Hatchery (food) bring beasts through the Portal, once your imps claim the floor next to it. Each beast has a favourite room: Fire Gobblers want a big Hatchery, Belchers a Training Room, Trolls a Workshop, Dark Mages a Library. Build it and they come.
<b>Keep them happy.</b> Beasts eat, sleep, work and expect paying on payday. The Beasts tab shows what each one is grumbling about. Unhappy beasts leave.
<b>Traps and doors.</b> Build a Workshop, then put traps and doors down from the Traps tab. The Workshop makes them one at a time. Doors go in corridors: heroes have to bash them down, your beasts walk straight through.
<b>The Hand.</b> Pick up imps and beasts and drop them where you want them, like right next to a hero. Slap lazy imps to speed them up.
<b>Spells.</b> Create Imp and Call to Arms from the start. Dark Mages in a Library research Lightning, Cluck Storm, Speed Monster and Heal.
<b>Win.</b> Heroes come out of the Hero Gate in waves (you get a warning 30 seconds before). Beat every wave, then smash the Gate. If they smash your Dungeon Heart, you lose.
<b>JackNet Dungeons.</b> Upload your dungeon for other Keepas to tour, rate and raid, and raid theirs: you lead the heroes for once!
${phone ? 'Drag the map to look around. The Brush button switches between 3x3 and single tiles.' : 'Keys: see Help > Keys. Right-click slaps. Drag with the Dig tool to mark lots of earth at once.'}</p><div class="row"><button class="dg-keepa-mbtn" data-a="back">GOT IT</button></div></div>`);
      on(o, '[data-a=back]', () => backTo(wasPaused));
    }
    function keysHelp() {
      const wasPaused = paused; if (S && !S.done) paused = true;
      const K2 = [['Arrow keys', 'Look around'], ['Home', 'Jump to your Dungeon Heart'], ['G', 'Jump to the heroes'], ['D / H / S', 'Dig / Hand / Slap'], ['X', 'Brush size (1 or 3x3)'], ['F1 R T M B', 'Tools / Rooms / Traps / Spells (Magic) / Beasts tab'], ['1 - 9', 'Pick a button on the open tab'], ['Right-click', 'Slap'], ['Ctrl+Z', 'Undo your last build (full refund, within 20 seconds)'], ['P or Space', 'Pause'], ['F', 'Game speed (x1, x2, x3)'], ['+ / -', 'Zoom'], ['Esc', 'Back to the Dig tool'], ['Raiding: Q / W / E', 'Heal / Charge! / Smite']];
      const o = overlay(`<div class="dg-keepa-box"><h2>KEYS</h2><table>${K2.map(([k, d]) => `<tr><td>${k.split(' / ').map(x => `<kbd>${esc(x)}</kbd>`).join(' / ')}</td><td>${esc(d)}</td></tr>`).join('')}</table><div class="row"><button class="dg-keepa-mbtn" data-a="back">OK</button></div></div>`);
      on(o, '[data-a=back]', () => backTo(wasPaused));
    }
    function nameDungeon() {
      if (!window.Desk || !Desk.ask) return;
      Desk.ask('Dungeon Keepa 2', 'What do you call your dungeon? (Other Keepas see this on JackNet.)', opt.dname || defName(), 40, v => { if (v == null) return; opt.dname = String(v).replace(/[<>]/g, '').trim().slice(0, 40); saveOpt(); if (opt.dname) G.toast('Dungeon Keepa 2', `Your dungeon is now called "${opt.dname}".`, 2500); });
    }
    function win() {
      S.done = true; G.stopMusic(); G.sfx('solve'); fanfare(); tutEl.style.display = 'none';
      const w = wonSet(); w.add(S.lvl); G.save('won', [...w]);
      if (S.lvl < 3 && !G.demo) G.save('unl', Math.max(G.load('unl', 1), S.lvl + 2));
      const all = ORDER.every(i => w.has(i)); if (all) G.secret('keepa.realms');
      G.save('auto', null);
      const p = ORDER.indexOf(S.lvl), next = ORDER[p + 1], last = next == null;
      const o = overlay(`<div class="dg-keepa-box" style="text-align:center"><h2>${last ? 'YOU ARE THE KEEPA OF 1999!' : 'REALM CONQUERED!'}</h2><p>${esc(S.L.n)} is yours. The Hero Gate is rubble. ${last ? 'Sir Callum has gone home to have a sulk and play something with fewer goblins in it.' : 'The do-gooders have run off to tell their Moms.'}

Time: ${fmtT(S.time)} · Heroes flattened: ${S.kills} · Tiles dug: ${S.dug} · Slaps: ${S.slaps} · Gold left: ${S.gold} · Difficulty: ${DIFF[S.diff].n}</p><div class="row">${!last ? `<button class="dg-keepa-mbtn" data-a="next">${G.demo ? 'CONTINUE' : 'NEXT REALM'}</button>` : ''}<button class="dg-keepa-mbtn" data-a="map">REALM MAP</button><button class="dg-keepa-mbtn net" data-a="net">SHOW IT OFF</button><button class="dg-keepa-mbtn" data-a="title">TITLE</button></div></div>`);
      G.save('last', serial());
      on(o, '[data-a=next]', () => { if (G.demo) { closeOv(); G.demoEnd('You conquered Pleasantvale! The full version has four more realms, the Bottomless Pit, traps, doors and raiding other Keepas on JackNet.'); } else briefing(next); });
      on(o, '[data-a=map]', () => realmMap());
      on(o, '[data-a=net]', () => openShowcase());
      on(o, '[data-a=title]', () => title());
    }
    function lose() {
      S.done = true; G.stopMusic(); G.sfx('shutdown'); tutEl.style.display = 'none'; shake(0.5);
      const endless = !!S.L.endless, best = G.load('best', 0);
      G.save('auto', null); G.save('last', serial()); // a fallen dungeon can still be shown off on JackNet
      if (endless && S.cleared > best) G.save('best', S.cleared);
      const o = overlay(`<div class="dg-keepa-box" style="text-align:center"><h2>YOUR DUNGEON HEART HAS BEEN DESTROYED</h2><p>${endless ? `You survived <b>${S.cleared}</b> wave${S.cleared === 1 ? '' : 's'} in the Bottomless Pit.${S.cleared > best ? ' A new best!' : ` (Your best: ${best}.)`}` : 'The heroes are having a party in your Lair. Sir Callum is doing a victory dance. It\'s not a good dance.'}

Time: ${fmtT(S.time)} · Heroes flattened: ${S.kills}</p><div class="row"><button class="dg-keepa-mbtn" data-a="again">TRY AGAIN</button><button class="dg-keepa-mbtn" data-a="title">TITLE SCREEN</button></div></div>`);
      const lvl = S.lvl;
      on(o, '[data-a=again]', () => briefing(lvl));
      on(o, '[data-a=title]', () => title());
    }

    // ---------------------------------------------------------------- menus
    function setMenu() {
      G.menu([
        ['Game', () => [
          { label: 'New Game...', act: () => { if (playing()) confirmTitle(); else realmMap(); } },
          { label: 'Load Game...', act: () => slots('load') },
          { label: 'Save Game...', act: () => slots('save'), dis: !playing() },
          { label: 'Undo Build', key: 'Ctrl+Z', act: () => undo(), dis: !playing() || !S.undo.length },
          '-',
          { label: 'Pause', key: 'P', chk: paused, act: () => togglePause(), dis: !S || S.done },
          { label: 'Quit to Title', act: () => { if (playing()) confirmTitle(); else title(); }, dis: !S },
          '-',
          { label: 'JackNet Dungeons...', act: () => openShowcase() },
          { label: 'Name My Dungeon...', act: () => nameDungeon() },
          { label: 'Hall of Raiders...', act: () => { const wasP = paused; if (S && !S.done) paused = true; hall(() => { if (S && S.raidRes && S.done) raidResult(); else if (S) backTo(wasP); else title(); }); } },
          ...(visiting() ? [{ label: 'Leave This Dungeon', act: () => leaveVisit() }] : []),
          '-',
          { label: 'Exit', act: () => G.quit() },
        ]],
        ['Options', () => [
          { label: 'Normal Speed', rad: speed === 1, act: () => { speed = 1; } },
          { label: 'Fast Speed', key: 'F', rad: speed === 2, act: () => { speed = 2; } },
          { label: 'Very Fast Speed', rad: speed === 3, act: () => { speed = 3; } },
          '-',
          ...DIFF.map((d, i) => ({ label: d.n + ' (new games)', rad: opt.diff === i, act: () => { opt.diff = i; saveOpt(); } })),
          '-',
          { label: 'Music', chk: opt.music, act: () => { opt.music = !opt.music; saveOpt(); if (opt.music && S && !paused && G.sound) G.music('keepa'); else G.stopMusic(); } },
          { label: 'Mentor Tips', chk: opt.tips, act: () => { opt.tips = !opt.tips; saveOpt(); } },
          { label: 'Torchlight', chk: opt.light, act: () => { opt.light = !opt.light; saveOpt(); } },
          { label: 'Big Brush (3x3)', key: 'X', chk: brush3, act: () => { brush3 = !brush3; buildTab(); } },
          '-',
          { label: 'Zoom In', key: '+', act: () => setZoom(1) }, { label: 'Zoom Out', key: '-', act: () => setZoom(-1) },
        ]],
        ['Help', () => [
          { label: 'How to Play', act: () => help() },
          { label: 'Keys...', act: () => keysHelp() },
          { label: 'Mentor\'s Lessons', act: () => { if (playing()) { tutStart(); } else { G.save('tut', 0); G.msg('Dungeon Keepa 2', 'Your Mentor will give you lessons next time you start a realm.', 'info'); } } },
          { label: 'Mentor Says...', act: () => { if (S) mentor(pick(TIPS)); else G.msg('Your Mentor', pick(TIPS), 'info'); } },
          '-',
          { label: 'About Dungeon Keepa 2', act: () => G.about() },
        ]],
      ]);
    }
    if (pauseBtn) pauseBtn.addEventListener('click', () => { G.sfx('click'); if (S && !S.done) togglePause(); });

    // ---------------------------------------------------------------- the loop
    let panelT = 0, miniT = 0, beastT = 0, tutT = 0, sayBlink = 0;
    G.loop((dt, t) => {
      now = t;
      // the Mentor (and friends) say things, one at a time
      if (mOn) { mT -= dt; sayBlink -= dt; if (sayBlink <= 0) { sayBlink = 2.5 + Math.random() * 2; drawPortrait(sayCv, mOn, true); G.timer(() => mOn && drawPortrait(sayCv, mOn), 140); } if (mT <= 0) { sayEl.classList.remove('on'); mOn = null; mT = -0.4; } }
      else if (mT < 0) mT += dt;
      else if (mq.length) {
        while (mq.length > 1 && performance.now() - mq[0][2] > 12000) mq.shift(); // stale news: skip it
        const [who, text] = mq.shift();
        mOn = who;
        drawPortrait(sayCv, who); sayTx.innerHTML = `<i>${esc(who)}</i>${esc(text)}`; sayEl.classList.add('on');
        mT = clamp(2.5 + text.length / 22, 3.5, 9); voice(Math.min(6, 2 + Math.floor(text.length / 25)), who === 'SIR CALLUM' || who === 'TOUR GUIDE');
      }
      if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) bannerEl.classList.remove('on'); }
      if (!S) return;
      if (!paused && !S.done) {
        const kx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), ky = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
        if (kx || ky) { cam.x += kx * dt * 260; cam.y += ky * dt * 260; clampCam(); }
        for (let s = 0; s < speed; s++) update(dt);
      }
      render(dt);
      panelT -= dt; miniT -= dt; beastT -= dt; tutT -= dt;
      if (panelT <= 0) { panelT = 0.25; updPanel(); }
      if (miniT <= 0) { miniT = 0.3; drawMini(); }
      if (tutT <= 0) { tutT = 0.25; tutTick(); }
      if (beastT <= 0) {
        beastT = 1;
        if (tab === 'beasts') refreshBeasts(); else if (tab === 'raid') { refreshParty(); gridEl.querySelectorAll('[data-ab]').forEach(b => { const v = S.raid && S.raid.ab[b.dataset.ab]; const sm = b.querySelector('small'); if (sm) sm.textContent = v > 0 ? Math.ceil(v) + 's' : 'ready'; }); }
        else if (tab === 'info') infoHint(); else if (tab === 'spells' && !paused) resHint(); else if (tab === 'traps') mfHint();
      }
    });

    // ---------------------------------------------------------------- go
    setMenu();
    buildTabs(); buildTab();
    requestAnimationFrame(resize);
    title();
    G.status('Dungeon Keepa 2' + (G.demo ? ' (Demo)' : ''));
    // the carry-on save (a refresh, a closed window or a Shut Down): the dungeon as it is, back paused. Never while visiting.
    const AS = G.autosave(() => (S ? (visiting() ? undefined : S.done ? null : serial()) : undefined));
    { const d = AS.load();
      if (d && LV[d.lvl] && d.t && !(G.demo && d.lvl > 0)) {
        try { start(d.lvl, d); togglePause(true); }
        catch (e) { console.error(e); AS.clear(); title(); }
      } }
    if (arg && arg.visit) G.timer(() => openVisit(arg.visit), 50);
    // test hook (harmless): lets a test peek at the running game
    G.host._keepa = { get S() { return S; }, start, cam, update: dt => update(dt), spawnWave: n => spawnWave(n), setTool, tap: (x, y) => tap(x, y), openVisit, startVisit, leaveVisit, raidAbility, tutTick, serial: () => serial(), mine: () => G._keepaMine(), lookAt, get tool() { return tool; }, get paused() { return paused; }, recount: () => recount() };
  });
})();

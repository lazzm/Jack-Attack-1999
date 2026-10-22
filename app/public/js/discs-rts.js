/* Age of Jackpires II: The Age of Jacks (Big Jack Studios, 1999). A little real-time strategy game for the Games Cupboard.
 * Gather food, wood and Rupees with your Villagers, build a town, advance to the Castle Age and flatten the enemy Town Centres.
 * Skirmish against up to three computer players (free-for-all or teams), the Learning Campaign and a small campaign of
 * scenarios, and Age of Jackpires II online (1v1, free-for-all up to four, 2v2; empty seats can be computer players).
 * The simulation is deterministic (seeded random numbers, no Math.hypot/sin/cos, positions on a 1/256 tile grid), so online
 * play is lockstep: the host numbers the turns and says which commands happen on which turn, everybody runs the same
 * simulation, and a hash check every couple of seconds catches any drift (the host then resends a full snapshot in chunks).
 * Original code and art: everything is drawn with canvas pixels at load time. Lazy-loaded by discs.js. */
(function () {
  'use strict';
  const D = window.Discs; if (!D) return;

  // ================================================================ constants
  const MW = 48, MH = 48, N = MW * MH, T = 16, TAU = Math.PI * 2, STEP = 0.05;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const hyp = (x, y) => Math.sqrt(x * x + y * y); // (Math.hypot isn't guaranteed the same on every browser; sqrt is)
  const vpick = l => l[Math.floor(Math.random() * l.length)]; // looks and chatter only, never the simulation
  const COLS = [
    { n: 'Red', c: '#d82a18', d: '#7a1008', l: '#ff8a5a', m: '#ff5030' },
    { n: 'Blue', c: '#2a5ae0', d: '#102a7a', l: '#8ab0ff', m: '#6a9aff' },
    { n: 'Yellow', c: '#e8c020', d: '#806008', l: '#fff07a', m: '#ffe040' },
    { n: 'Green', c: '#2a9a2a', d: '#0a4a0a', l: '#8aea7a', m: '#50e050' },
    { n: 'Purple', c: '#9a3ad0', d: '#4a1070', l: '#d8a0ff', m: '#c878ff' },
    { n: 'Orange', c: '#f07a10', d: '#7a3a00', l: '#ffc080', m: '#ffa040' },
  ];
  const RNAME = { f: 'Food', w: 'Wood', t: 'Rupees' };
  const KIND_OF = [null, 'w', 'f', 't']; // resT -> kind (t = Rupees; the internal id is historical)
  const RES_OF = { w: 1, f: 2, t: 3 };
  const RATE = { w: 1.15, f: 1.3, t: 0.95, pen: 1.0 }, CAP = 10;
  const AGEN = ['', 'Stone Age', 'Castle Age'];
  // n: [Stone Age name, Castle Age name]. good: what it's for (shown in tooltips)
  const UT = {
    grot: { n: ['Villager', 'Villager'], hp: 25, spd: 1.8, atk: 3, arm: 0, rng: 0.75, rate: 1.3, sight: 4, cost: { f: 50 }, time: 10, d: 'Gathers, builds and repairs. Moans a lot.', good: 'Everything except fighting' },
    boy: { n: ['Warrior', 'Man-at-Arms'], hp: 60, spd: 1.5, atk: 6, arm: 1, rng: 0.8, rate: 1.1, sight: 5, cost: { f: 60, t: 20 }, time: 15, d: 'Sword and shield. A good all-rounder.', good: 'Spearmen, Catapults, buildings', bonus: { kannon: 8, spear: 3 }, mel: 1 },
    spear: { n: ['Spearman', 'Pikeman'], hp: 45, spd: 1.6, atk: 4, arm: 0, rng: 0.95, rate: 1.2, sight: 5, cost: { f: 35, w: 25 }, time: 12, d: 'Cheap, with a very long pointy stick. Horses hate them.', good: 'Riders (big bonus)', bonus: { rider: 10 }, mel: 1 },
    shoota: { n: ['Archer', 'Longbowman'], hp: 35, spd: 1.6, atk: 4, arm: 0, rng: 4.5, rate: 1.5, sight: 6, cost: { w: 25, t: 45 }, time: 17, ranged: 'arrow', d: 'Shoots from range. Keep them behind the swords.', good: 'Spearmen and Warriors', bonus: { spear: 3, boy: 1 } },
    rider: { n: ['Rider', 'Knight'], hp: 95, spd: 2.6, atk: 7, arm: 2, rng: 0.85, rate: 1.3, sight: 5, cost: { f: 80, t: 70 }, time: 21, age: 2, d: 'Fast on a horse. Keep away from Spearmen.', good: 'Archers and Catapults', bonus: { shoota: 6, kannon: 8 }, mel: 1 },
    kannon: { n: ['Catapult', 'Mangonel'], hp: 70, spd: 0.9, atk: 10, arm: 0, rng: 6.5, rate: 3.6, sight: 7, cost: { w: 150, t: 120 }, time: 28, age: 2, ranged: 'shell', splash: 1, bld: 5, d: 'Knocks buildings flat. Slow. Hopeless up close.', good: 'Buildings and crowds' },
    hero: { n: ['Gubbinz', 'Sir Gubbins'], hp: 320, spd: 2.2, atk: 16, arm: 3, rng: 0.85, rate: 0.9, sight: 7, cost: {}, time: 1, d: 'A legendary little green desktop helper who wandered in from another program. Nobody is sure why he\'s here.', good: 'Everything', mel: 1 },
  };
  const SOLDIER = t => t !== 'grot' && t !== 'hero';
  const BT = {
    bighut: { n: ['Town Centre', 'Castle Keep'], s: 3, hp: 1400, cost: { w: 275, t: 100 }, time: 60, pop: 5, drop: 1, atk: 5, rng: 5.5, rate: 1.8, sight: 8, trains: ['grot'], techs: ['barrow'], ext: 14, d: 'Your base. Trains Villagers, takes deliveries. Lose every one you have and you\'re out!' },
    hut: { n: ['House', 'Cottage'], s: 2, hp: 300, cost: { w: 30 }, time: 12, pop: 5, sight: 3, ext: 10, d: '+5 population. Somebody has to tidy it.' },
    pen: { n: ['Farm', 'Farm'], s: 2, hp: 200, cost: { w: 60 }, time: 14, sight: 2, ext: 4, farm: 1, d: 'Food that never runs out. One Villager farms it.' },
    stock: { n: ['Stockpile', 'Storehouse'], s: 2, hp: 350, cost: { w: 80 }, time: 18, drop: 1, sight: 3, ext: 8, d: 'Villagers drop food, wood and Rupees here. Build one by the trees.' },
    barrakks: { n: ['Barracks', 'Barracks'], s: 3, hp: 700, cost: { w: 150 }, time: 30, trains: ['boy', 'spear', 'shoota', 'rider'], sight: 4, ext: 12, d: 'Trains Warriors, Spearmen and Archers (and Riders in the Castle Age).' },
    smithy: { n: ['Blacksmith', 'Blacksmith'], s: 2, hp: 450, cost: { w: 120 }, time: 25, sight: 3, ext: 10, techs: ['swords', 'bows', 'mail'], d: 'Hammers out better swords, bows and armour for your soldiers.' },
    tower: { n: ['Watchtower', 'Watch Tower'], s: 2, hp: 500, cost: { w: 60, t: 60 }, time: 24, atk: 5, rng: 6.5, rate: 1.6, sight: 9, ext: 30, d: 'Shoots anything that comes near. Sees miles.' },
    mekshop: { n: ['Workshop', 'Siege Workshop'], s: 3, hp: 600, cost: { w: 200, t: 100 }, time: 35, trains: ['kannon'], sight: 4, ext: 14, age: 2, d: 'Builds Catapults. Castle Age only.' },
  };
  const BUILD_LIST = ['hut', 'pen', 'stock', 'barrakks', 'smithy', 'tower', 'mekshop', 'bighut'];
  const TECH = {
    barrow: { n: 'Wheelbarrow', cost: { f: 150, w: 50 }, time: 25, d: 'Villagers carry 15 instead of 10 and walk a bit faster.' },
    swords: { n: 'Sharper Swords', cost: { f: 100, t: 50 }, time: 30, d: '+2 attack for Warriors, Spearmen and Riders.' },
    bows: { n: 'Better Bows', cost: { w: 100, t: 60 }, time: 30, d: '+1 attack and +1 range for Archers, Watchtowers and Town Centres.' },
    mail: { n: 'Chain Mail', cost: { f: 120, t: 80 }, time: 35, age: 2, d: '+2 armour for every soldier.' },
  };
  const AGE = { cost: { f: 400, t: 120 }, time: 40 };
  const CIVS = [
    { n: 'Jack\'s Clan', d: 'Archers shoot 1 tile further.' },
    { n: 'The Blue Knights', d: 'Riders have +20 HP.' },
    { n: 'Dave\'s Vikings', d: 'Villagers chop wood 20% faster.' },
    { n: 'Callum\'s Legion', d: 'Buildings go up 30% faster.' },
  ];
  const MAPS = [
    { n: 'Jackland Plains', d: 'Gentle hills, a few ponds and plenty of trees. A nice friendly punch-up.', grass: ['#4a8a2a', '#3f7c24', '#559832'], dirt: '#8a6a3a', water: '#2456b0', water2: '#5a8ae0', sand: '#c8b070', tree: ['#1e5a1e', '#2e7a26', '#4a9a3a', '#14400f'], lakes: 3, forests: 10, mines: 1 },
    { n: 'Muddy Marsh', d: 'Boggy, smelly and full of water. Wellies recommended.', grass: ['#3c6a2a', '#335e22', '#467830'], dirt: '#5a4a2a', water: '#2a5a4a', water2: '#5a8a6a', sand: '#7a7a4a', tree: ['#1a4a22', '#2a6230', '#3c7a3a', '#10301a'], lakes: 9, forests: 8, mines: 1 },
    { n: 'Rupee Hills', d: 'Dry, dusty and riddled with Rupee mines. Fight over the shiny stuff in the middle.', grass: ['#8a9a3a', '#7c8c32', '#98a846'], dirt: '#a07a40', water: '#2a5aa0', water2: '#6a9ad8', sand: '#d8c080', tree: ['#3a5a1a', '#4a7224', '#6a8a32', '#2a4010'], lakes: 1, forests: 7, mines: 4 },
    { n: 'Frosty Fells', d: 'Snow, ice and pine trees. Wrap up warm, it\'s nippy out.', grass: ['#e8eef4', '#d8e2ec', '#f4f8fc'], dirt: '#b4c0cc', water: '#3a6aa0', water2: '#a8d0f0', sand: '#c8d8e8', tree: ['#1a4a3a', '#2a5e48', '#3a7258', '#10302a'], snow: 1, lakes: 4, forests: 11, mines: 2 },
  ];
  // the computer players. One personality per difficulty; extra computer players get the friends' names
  const FOES = [
    { n: 'Dave', tag: 'Easy', blurb: 'Would rather be playing Goldenballs on his ULTRA 64.', hi: 'Dave: is the blue team me? ok cool', taunts: ['Dave: can we play Goldenballs after this?', 'Dave: Luke says this would be loads better on the ULTRA 64', 'Dave: my knights are coming. probably.', 'Dave: hang on, my Mom says tea is ready in 10 mins', 'Dave: which button makes the horses go'], win: 'Dave: haha I WON?? I never win anything!', lose: 'Dave: good game. ULTRA 64 now? Please?' },
    { n: 'JackK', tag: 'Normal', blurb: 'Your mate Jack. Goes by JackK so nobody mixes you up. Everybody still mixes you up.', hi: 'JackK: may the best Jack win', taunts: ['JackK: there can be only one Jack', 'JackK: my peasants chop faster than yours', 'JackK: incoming!', 'JackK: you missed a bit'], win: 'JackK: the better Jack wins. Obviously.', lose: 'JackK: rematch. Tomorrow. After school.' },
    { n: 'Callum', tag: 'Hard', blurb: 'Has a 450 MHz PC, a proper mouse mat and no mercy.', hi: 'Callum: you\'re going down. I\'ve been practising.', taunts: ['Callum: rush incoming lol', 'Callum: I normally play this on Fast speed', 'Callum: you\'re not even using hotkeys are you', 'Callum: my knights are faster than your modem', 'Callum: is that a WALL of houses? lol'], win: 'Callum: gg. Told you. Want the disc back now.', lose: 'Callum: ...my mouse was lagging. Rematch. NOW.' },
  ];
  const EXTRA_AI = [['Luke', window.Cast ? Cast.t('Cousin {cousin}') : 'My Cousin', 'Gubbinz'], ['Kev from Year 8', 'Big Sam', 'Lisa'], ['Callum\'s Big Brother', 'Mr Hughes', 'The Lunch Lady']];
  const DIFF = [ // computer settings
    { grots: 9, wave1: 480, waveN: 3, waveMax: 7, every: 200, gath: 0.8, trickle: 0, age: 780, army: 8, towers: 0, techs: 0 },
    { grots: 13, wave1: 330, waveN: 4, waveMax: 16, every: 145, gath: 1, trickle: 0.25, age: 450, army: 16, towers: 1, techs: 2 },
    { grots: 18, wave1: 230, waveN: 5, waveMax: 24, every: 105, gath: 1.2, trickle: 0.7, age: 300, army: 26, towers: 2, techs: 4 },
  ];
  const SAY = {
    sel: ['Yes, my lord?', 'Ready!', 'Orders?', 'At your command!', 'Hmm?', 'Huzzah?'],
    grot: ['Do I have to?', 'What now?', 'I was on my break!', 'Not again...', 'Yes, boss. Sorry, boss.'],
    move: ['Right-o!', 'On my way!', 'Off we go!', 'Fine, FINE.', 'Moving!'],
    atk: ['Charge!', 'For Jack!', 'Have at you!', 'Huzzah!', 'Get \'em!'],
    build: ['Hammer time!', 'It\'ll be wonky.', 'Where\'s my hammer?', 'Building!'],
    gather: ['Shiny!', 'Chop chop!', 'Yum, berries!', 'Digging!'],
  };
  const TIPS = ['Farms never run out of food. Build lots!', 'Build a Stockpile next to the trees so your Villagers don\'t walk miles.', 'Houses give +5 population. Run out and nothing gets trained.', 'Spearmen beat Riders, Riders beat Archers, Archers beat Spearmen. Warriors are good at everything (a bit).', 'Catapults flatten buildings in a few shots.', 'Callum says there are cheat codes. Press Enter (or Chat) to type. He won\'t say what they are. Something about shiny Rupees...', 'Watchtowers shoot anything that comes near your base.', 'Press H to find your Town Centre and . (full stop) to find a lazy Villager.', 'Ctrl+1 puts your selection in group 1. Press 1 to get them back, twice to look at them.', 'The Blacksmith makes every soldier better. Callum always builds one.', 'The keys Q W E R T press the buttons in the bottom-right, in order.'];

  // ================================================================ tiny helpers
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h); return c; }
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const fmtT = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60); return (m < 10 ? '0' : '') + m + ':' + String(s % 60).padStart(2, '0'); };
  const costStr = c => ['f', 'w', 't'].filter(k => c[k]).map(k => c[k] + ({ f: 'F', w: 'W', t: 'R' })[k]).join(' ');
  const costLong = c => ['f', 'w', 't'].filter(k => c[k]).map(k => c[k] + ' ' + RNAME[k]).join(', ');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const nclean = (t, n) => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, n || 20).trim();
  const rid = () => Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  // the four corners: 0 bottom-left, 1 top-left, 2 top-right, 3 bottom-right (each a quarter turn from the last)
  const rotP = (x, y, k) => { for (let i = 0; i < k; i++) { const nx = MW - y, ny = x; x = nx; y = ny; } return { x, y }; };
  const rotR = (x, y, s, k) => { for (let i = 0; i < k; i++) { const nx = MW - y - s, ny = x; x = nx; y = ny; } return { x, y }; };

  // ================================================================ sprites (pixel art drawn once, module-wide)
  const SPR = {};
  const P = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w == null ? 1 : w, h == null ? 1 : h); };
  const blob = (c, cx, cy, r, col) => { c.fillStyle = col; for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) * (x + 0.5 - cx) + (y + 0.5 - cy) * (y + 0.5 - cy) <= r * r) c.fillRect(x, y, 1, 1); };

  function drawUnit(c, type, ci, f) {
    const tc = COLS[ci].c, tcd = COLS[ci].d, skin = '#f0b088', skinD = '#b87048', eye = '#000';
    const lg = f === 1 ? 1 : f === 2 ? -1 : 0, hit = f === 3;
    if (type === 'hero') { // Gubbinz: a little green desktop helper with a gold crown and a big stick
      const gs = '#58a828', gd = '#2c6410';
      P(c, '#3a2810', 5 + lg, 12, 2, 4); P(c, '#3a2810', 9 - lg, 12, 2, 4);
      P(c, tc, 4, 8, 8, 5); P(c, tcd, 4, 12, 8, 1); P(c, '#ffd400', 7, 9, 2, 2);
      P(c, gs, 3, 8, 1, 3); P(c, gs, 12, 8, 1, 3);
      P(c, gs, 5, 3, 6, 5); P(c, gs, 2, 4, 3, 1); P(c, gs, 1, 3, 1, 1); P(c, gs, 11, 4, 3, 1); P(c, gs, 14, 3, 1, 1);
      P(c, '#000', 6, 5); P(c, '#000', 9, 5); P(c, '#fff', 6, 7); P(c, '#fff', 9, 7); P(c, gd, 7, 6, 2, 1);
      P(c, '#ffd400', 5, 1, 6, 2); P(c, '#ffd400', 5, 0); P(c, '#ffd400', 7, 0); P(c, '#ffd400', 10, 0); P(c, '#e10600', 7, 1);
      if (hit) { P(c, '#7a4a10', 12, 10, 4, 2); P(c, '#9a6a20', 15, 9, 1, 4); } else { P(c, '#7a4a10', 13, 2, 2, 9); P(c, '#9a6a20', 12, 1, 4, 2); }
      return;
    }
    if (type === 'grot') {
      P(c, '#5a3a1a', 6 + lg, 13, 1, 3); P(c, '#5a3a1a', 9 - lg, 13, 1, 3);
      P(c, '#8a6a3a', 6, 8, 4, 5); P(c, tc, 6, 10, 4, 1);
      P(c, skin, 5, 9, 1, 2); P(c, skin, 10, 9, 1, 2);
      P(c, skin, 6, 4, 4, 4); P(c, '#e8c860', 5, 3, 6, 1); P(c, '#e8c860', 6, 2, 4, 1);
      P(c, eye, 7, 5); P(c, eye, 9, 5); P(c, skinD, 7, 7, 2, 1);
      if (hit) { P(c, '#7a5a2a', 11, 10, 4, 1); P(c, '#aaa', 14, 9, 1, 3); } else { P(c, '#7a5a2a', 11, 5, 1, 6); P(c, '#aaa', 10, 5, 3, 1); }
      return;
    }
    if (type === 'spear') {
      P(c, '#5a3a1a', 6 + lg, 12, 2, 4); P(c, '#5a3a1a', 9 - lg, 12, 2, 4);
      P(c, tc, 5, 7, 6, 5); P(c, tcd, 5, 11, 6, 1); P(c, '#6a4a2a', 5, 9, 6, 1);
      P(c, skin, 6, 3, 4, 4); P(c, '#8a6a3a', 5, 1, 6, 3); P(c, '#6a4a2a', 5, 3, 6, 1);
      P(c, eye, 7, 4); P(c, eye, 9, 4); P(c, skinD, 7, 6, 2, 1);
      blob(c, 4, 9.5, 2.6, '#a07a40'); P(c, tc, 3, 8, 2, 3); P(c, '#5a3a10', 4, 9, 1, 1);
      if (hit) { P(c, '#7a5a2a', 9, 8, 7, 1); P(c, '#e0e0e8', 14, 7, 2, 3); } else { P(c, '#7a5a2a', 12, 2, 1, 13); P(c, '#e0e0e8', 11, 0, 3, 2); P(c, '#b0b0b8', 12, 2, 1, 1); }
      return;
    }
    if (type === 'boy' || type === 'shoota') {
      const sh = type === 'shoota';
      P(c, '#555', 5 + lg, 12, 2, 4); P(c, '#555', 9 - lg, 12, 2, 4);
      P(c, tc, 4, 7, 8, 5); P(c, '#fff', 7, 8, 2, 3); P(c, '#fff', 6, 9, 4, 1); P(c, '#3a2a10', 4, 11, 8, 1);
      P(c, '#999', 3, 7, 1, 4); P(c, '#999', 12, 7, 1, 3);
      if (sh) { P(c, '#2a6a2a', 5, 1, 6, 4); P(c, skin, 6, 3, 4, 3); P(c, eye, 7, 4); P(c, eye, 9, 4); P(c, '#1a4a1a', 5, 1, 6, 1); P(c, '#d82a18', 10, 0, 2, 2); }
      else { P(c, skin, 6, 3, 4, 4); P(c, '#a8a8b0', 5, 1, 6, 3); P(c, '#d8d8e0', 6, 1, 3, 1); P(c, '#000', 6, 4, 4, 1); P(c, '#a8a8b0', 7, 4, 2, 2); }
      if (sh) { P(c, '#7a4a10', 12, 4); P(c, '#7a4a10', 13, 5, 1, 6); P(c, '#7a4a10', 12, 11); P(c, '#ddd', 12, 5, 1, 6); if (hit) P(c, '#eee', 13, 8, 3, 1); }
      else if (hit) { P(c, '#ddd', 12, 9, 4, 1); P(c, '#a07a10', 12, 8, 1, 3); } else { P(c, '#ddd', 13, 1, 1, 6); P(c, '#a07a10', 12, 7, 3, 1); }
      return;
    }
    if (type === 'rider') {
      P(c, '#e8e8e0', 2, 8, 10, 4); P(c, '#e8e8e0', 11, 5, 3, 4); P(c, '#e8e8e0', 13, 7, 2, 2); P(c, '#8a6a3a', 11, 5, 1, 3); P(c, '#000', 13, 6);
      P(c, '#bbb', 3 + lg, 12, 1, 4); P(c, '#bbb', 5 - lg, 12, 1, 4); P(c, '#bbb', 9 + lg, 12, 1, 4); P(c, '#bbb', 11 - lg, 12, 1, 4);
      P(c, tc, 3, 8, 8, 3); P(c, tcd, 3, 10, 8, 1); P(c, '#a0a0a8', 5, 3, 4, 5); P(c, '#c0c0c8', 5, 0, 4, 3); P(c, '#000', 6, 1, 2, 1); P(c, tc, 6, 0, 2, 1);
      if (hit) P(c, '#7a5a2a', 8, 5, 8, 1); else P(c, '#7a5a2a', 9, 0, 1, 8);
      return;
    }
    if (type === 'kannon') {
      P(c, '#8a5a2a', 2, 10, 12, 2); P(c, '#6a4018', 3, 8, 2, 2); P(c, '#6a4018', 11, 8, 2, 2);
      blob(c, 4.5, 13.5, 2, '#4a2a10'); blob(c, 11.5, 13.5, 2, '#4a2a10'); P(c, tc, 6, 10, 4, 1);
      if (hit) { P(c, '#8a5a2a', 8, 1, 1, 9); P(c, '#555', 7, 0, 3, 2); }
      else { for (let i = 0; i < 7; i++) P(c, '#8a5a2a', 5 + i, 9 - i); P(c, '#555', 12, 1, 2, 2); }
    }
  }
  function unitSpr(type, ci, f) { const k = 'u' + type + ci + f; return SPR[k] || (SPR[k] = mk(16, 16, c => drawUnit(c, type, ci, f))); }
  // a white silhouette of any sprite (the hit flash)
  function whiteOf(src, k) { return SPR[k] || (SPR[k] = mk(src.width, src.height, c => { c.drawImage(src, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#fff'; c.fillRect(0, 0, src.width, src.height); })); }

  // buildings: canvas W = s*16, H = s*16 + ext; footprint is the bottom s*16 rows
  function walls(c, x, y, w, h) {
    P(c, '#e0d0a8', x, y, w, h); P(c, '#6a4a2a', x, y, w, 1); P(c, '#6a4a2a', x, y, 1, h); P(c, '#6a4a2a', x + w - 1, y, 1, h);
    for (let i = x + 6; i < x + w - 2; i += 8) P(c, '#6a4a2a', i, y, 1, h - 3);
    for (let i = x + 2; i < x + w - 2; i += 8) { P(c, '#6a4a2a', i, y + 2, 1, 1); P(c, '#6a4a2a', i + 1, y + 3, 1, 1); P(c, '#6a4a2a', i + 2, y + 4, 1, 1); }
    P(c, '#8a8a88', x, y + h - 3, w, 3); for (let i = x; i < x + w; i += 4) P(c, '#6a6a68', i, y + h - 3, 1, 3);
  }
  function roof(c, x, y, w, h, ci) {
    for (let i = 0; i < h; i++) { const ins = Math.floor((h - 1 - i) * 0.55), xx = x + ins, ww = w - ins * 2; P(c, i % 3 === 2 ? COLS[ci].d : COLS[ci].c, xx, y + i, ww, 1); if (ww > 4) { P(c, COLS[ci].d, xx, y + i, 1, 1); P(c, COLS[ci].d, xx + ww - 1, y + i, 1, 1); } }
    P(c, COLS[ci].l, x + Math.floor(w / 2) - 1, y, 2, 1);
  }
  const flag = (c, x, y, ci) => { P(c, '#5a3a10', x, y, 1, 12); P(c, COLS[ci].c, x + 1, y, 6, 4); P(c, COLS[ci].d, x + 1, y + 3, 6, 1); };
  function drawBld(c, type, ci, W, H) {
    const top = H - W; // y where the footprint starts
    if (type === 'bighut') {
      walls(c, 3, top + 10, W - 6, W - 12);
      roof(c, 1, top - 6, W - 2, 18, ci);
      P(c, '#2a1a0a', 19, H - 18, 10, 16); P(c, '#6a4a2a', 18, H - 19, 12, 2); P(c, '#6a4a2a', 18, H - 19, 1, 17); P(c, '#6a4a2a', 29, H - 19, 1, 17);
      P(c, '#a8a8a0', 17, top - 12, 14, 22); for (let i = 17; i < 31; i += 3) P(c, '#c8c8c0', i, top - 14, 2, 2); P(c, '#000', 22, top - 6, 3, 5); P(c, '#888880', 17, top - 12, 1, 22);
      flag(c, 24, 0, ci); P(c, '#6a4a2a', 8, top + 18, 4, 6); P(c, '#6a4a2a', 36, top + 18, 4, 6); P(c, '#88b8e8', 9, top + 19, 2, 2); P(c, '#88b8e8', 37, top + 19, 2, 2);
    } else if (type === 'hut') {
      walls(c, 3, top + 8, W - 6, W - 10); roof(c, 1, top - 4, W - 2, 14, ci); P(c, '#2a1a0a', 13, H - 11, 6, 9);
      P(c, '#88b8e8', 6, top + 12, 4, 4); P(c, '#6a4a2a', 7, top + 12, 1, 4); P(c, '#6a6a68', W - 9, top - 6, 3, 6);
    } else if (type === 'barrakks') {
      walls(c, 2, top + 10, W - 4, W - 16); roof(c, 0, top - 2, W, 14, ci);
      P(c, '#2a1a0a', 20, H - 18, 8, 12);
      for (let x = 1; x < W - 1; x += 3) { if (x > 17 && x < 30) continue; P(c, '#7a5a2a', x, H - 9, 2, 8); P(c, '#a07a40', x, H - 10, 1, 1); }
      P(c, '#5a3a10', 0, H - 6, W, 1);
      blob(c, 24, top + 4, 4, COLS[ci].c); P(c, '#fff', 23, top + 1, 2, 7); P(c, '#fff', 21, top + 3, 6, 2); flag(c, 4, top - 14, ci);
    } else if (type === 'pen') {
      P(c, '#6a4a20', 2, top + 2, W - 4, W - 4);
      for (let y = top + 4; y < H - 3; y += 3) { P(c, '#d8b840', 3, y, W - 6, 2); for (let x = 4; x < W - 4; x += 3) P(c, '#f0d860', x, y - 1); }
      P(c, '#5a3a10', 1, top + 1, W - 2, 1); P(c, '#5a3a10', 1, H - 2, W - 2, 1); P(c, '#5a3a10', 1, top + 1, 1, W - 2); P(c, '#5a3a10', W - 2, top + 1, 1, W - 2);
      for (let i = 1; i < W; i += 6) { P(c, '#3a2008', i, top, 2, 3); P(c, '#3a2008', i, H - 3, 2, 3); }
      P(c, COLS[ci].c, W - 5, top - 2, 3, 2);
    } else if (type === 'stock') {
      P(c, '#5a3a10', 2, top - 4, 2, W); P(c, '#5a3a10', W - 4, top - 2, 2, W - 2);
      for (let i = 0; i < 8; i++) P(c, i % 3 === 2 ? COLS[ci].d : COLS[ci].c, 0, top - 6 + i, W, 1);
      P(c, '#a07a3a', 4, H - 12, 9, 9); P(c, '#6a4a1a', 4, H - 12, 9, 1); P(c, '#6a4a1a', 4, H - 12, 1, 9); for (let i = 0; i < 8; i++) { P(c, '#6a4a1a', 5 + i, H - 11 + i); P(c, '#6a4a1a', 12 - i, H - 11 + i); }
      P(c, '#6a4a2a', 17, H - 14, 6, 11); P(c, '#333', 17, H - 12, 6, 1); P(c, '#333', 17, H - 6, 6, 1);
      for (let i = 0; i < 3; i++) { P(c, '#8a5a2a', 23, H - 5 - i * 3, 7, 3); blob(c, 29, H - 3.5 - i * 3, 1.5, '#c89a5a'); }
    } else if (type === 'smithy') {
      walls(c, 3, top + 8, W - 6, W - 10); roof(c, 1, top - 4, W - 2, 14, ci);
      P(c, '#2a1a0a', 5, H - 11, 6, 9); P(c, '#ff8a00', 6, H - 6, 4, 2);
      P(c, '#6a6a68', W - 9, top - 10, 5, 12); P(c, '#4a4a48', W - 9, top - 10, 5, 1); P(c, '#ff6a00', W - 8, top - 11, 3, 1);
      P(c, '#3a3a40', 15, H - 8, 12, 2); P(c, '#3a3a40', 19, H - 6, 4, 4); P(c, '#6a6a70', 15, H - 8, 12, 1); P(c, '#3a3a40', 13, H - 8, 2, 1);
      P(c, '#ffd400', 20, H - 10, 1, 1); P(c, '#ff8a00', 22, H - 11, 1, 1);
    } else if (type === 'tower') {
      P(c, '#a0a0a0', 8, 12, 16, H - 12); for (let y = 16; y < H; y += 4) P(c, '#888', 8, y, 16, 1); for (let x = 7; x < 25; x += 4) P(c, '#c0c0c0', x, 8, 2, 4); P(c, '#a0a0a0', 7, 11, 18, 2);
      for (let i = 0; i < 8; i++) P(c, COLS[ci].c, 11 + Math.floor(i * 0.6), i, 10 - Math.floor(i * 1.2) > 0 ? 10 - 2 * Math.floor(i * 0.6) : 1, 1);
      P(c, '#222', 15, 20, 2, 5); P(c, '#2a1a0a', 13, H - 9, 6, 9); P(c, '#787878', 8, 12, 1, H - 12);
    } else if (type === 'mekshop') {
      walls(c, 3, top + 10, W - 6, W - 12); roof(c, 1, top - 4, W - 2, 16, ci);
      P(c, '#222', 14, H - 20, 20, 18); for (let x = 14; x < 34; x += 4) P(c, '#ffd400', x, H - 20, 2, 2);
      P(c, '#444', 36, top - 14, 6, 16); P(c, '#999', 37, top - 18, 3, 3); P(c, '#bbb', 39, top - 22, 3, 3);
      blob(c, 10, top + 2, 5, '#888'); blob(c, 10, top + 2, 2, '#444'); [[6, 0], [-6, 0], [0, 6], [0, -6], [4, 4], [-4, 4], [4, -4], [-4, -4]].forEach(([a, b]) => P(c, '#888', 10 + a - 1, top + 2 + b - 1, 2, 2));
    }
  }
  function bldSpr(type, ci) { const k = 'b' + type + ci; if (SPR[k]) return SPR[k]; const W = BT[type].s * T, H = W + BT[type].ext; return (SPR[k] = mk(W, H, c => drawBld(c, type, ci, W, H))); }

  function resSpr(t, v, mi) {
    const k = 'r' + t + v + '_' + mi; if (SPR[k]) return SPR[k];
    const M = MAPS[mi] || MAPS[0], tr = M.tree;
    let c;
    if (t === 1) c = mk(16, 24, x => {
      if (v === 2 || M.snow && v === 1) { P(x, '#5a3a1a', 7, 19, 2, 5); for (let i = 0; i < 3; i++) { const y = 3 + i * 5; for (let r = 0; r < 8; r++) { const w = 2 + Math.floor(r * (0.8 + i * 0.3)); P(x, r === 7 ? tr[3] : tr[0], 8 - (w >> 1), y + r, w, 1); if (M.snow && r < 3) P(x, '#f4f8fc', 8 - (w >> 1), y + r, Math.max(1, w - 1), 1); } P(x, tr[2], 7, y + 1, 1, 3); } }
      else { P(x, '#5a3a1a', 7, 17, 2, 7); P(x, '#3a2410', 6, 22, 1, 2); blob(x, 8, 11, 6.5, tr[0]); blob(x, v ? 6 : 9, v ? 8 : 9, 4, tr[1]); blob(x, v ? 5 : 8, v ? 6 : 7, 2, tr[2]); blob(x, 11, 13, 2.5, tr[1]); P(x, tr[3], 3, 15, 10, 1); if (M.snow) { P(x, '#f4f8fc', 5, 5, 6, 1); P(x, '#f4f8fc', 3, 8, 3, 1); } }
    });
    else if (t === 2) c = mk(16, 16, x => { blob(x, 8, 9.5, 6, '#2a6a22'); blob(x, 7, 8, 4, '#3a8a32'); blob(x, 6, 6.5, 1.6, '#5aaa4a'); [[4, 9], [9, 6], [11, 10], [7, 12], [5, 5], [12, 7]].forEach(([a, b], i) => { P(x, i % 2 ? '#e02040' : '#ff3a6a', a, b, 2, 2); P(x, '#fff', a, b); }); if (M.snow) P(x, '#f4f8fc', 5, 4, 5, 1); });
    else c = mk(16, 16, x => { // a Rupee mine: rocks full of gems
      blob(x, 8, 10, 6.5, '#5a5a62'); blob(x, 6.5, 8.5, 4, '#7a7a84'); blob(x, 5, 7, 1.5, '#9a9aa4');
      const gems = [['#1ac83a', '#a0ffb0', '#0a6a1a'], ['#2a7aff', '#b0d8ff', '#0a2a8a'], ['#e8203a', '#ffb0c0', '#7a0010']];
      for (let i = 0; i < 3; i++) { const g = gems[(i + v) % 3], a = 3 + ((i * 5 + v * 3) % 8), b = 5 + ((i * 3 + v) % 6); P(x, g[0], a, b, 2, 4); P(x, g[0], a - 1, b + 1, 4, 2); P(x, g[2], a, b + 3, 2, 1); P(x, g[1], a, b, 1, 1); }
      P(x, '#fff', 10 + v % 3, 5); if (M.snow) P(x, '#f4f8fc', 4, 4, 6, 1);
    });
    return (SPR[k] = c);
  }
  const SKULL = () => SPR.skull || (SPR.skull = mk(6, 5, c => { P(c, '#eee', 1, 0, 4, 3); P(c, '#eee', 0, 1, 6, 2); P(c, '#000', 1, 1); P(c, '#000', 4, 1); P(c, '#ddd', 2, 3, 2, 2); }));
  const RUBBLE = () => SPR.rubble || (SPR.rubble = mk(16, 16, c => { for (let i = 0; i < 18; i++) P(c, ['#5a4a3a', '#7a6a5a', '#3a2a1a', '#999'][i % 4], (i * 7) % 15, 4 + (i * 5) % 11, 2 + i % 2, 2); }));
  // command-card icons (data URLs)
  const ICONS = {};
  function iconURL(kind, type, ci) {
    const k = kind + type + ci; if (ICONS[k]) return ICONS[k];
    let src;
    if (kind === 'u') src = unitSpr(type, ci, 0); else if (kind === 'b') src = bldSpr(type, ci); else src = techSpr(type);
    const c = mk(32, 32, x => { x.imageSmoothingEnabled = false; const s = Math.min(32 / src.width, 32 / src.height); const w = src.width * s, h = src.height * s; x.drawImage(src, (32 - w) / 2, (32 - h) / 2, w, h); });
    return (ICONS[k] = c.toDataURL());
  }
  function techSpr(k) { // little 16x16 pictures for the technologies and the Castle Age
    return SPR['t' + k] || (SPR['t' + k] = mk(16, 16, c => {
      if (k === 'barrow') { P(c, '#8a5a2a', 2, 6, 10, 4); P(c, '#6a4018', 2, 9, 10, 1); P(c, '#5a3a10', 11, 7, 4, 1); blob(c, 5, 12, 2, '#3a2a10'); P(c, '#aaa', 4, 11, 2, 2); P(c, '#1e5a1e', 4, 4, 3, 2); P(c, '#e02040', 8, 4, 2, 2); }
      else if (k === 'swords') { for (let i = 0; i < 9; i++) { P(c, '#e0e0e8', 3 + i, 12 - i); P(c, '#e0e0e8', 12 - i, 12 - i); } P(c, '#a07a10', 2, 11, 3, 1); P(c, '#a07a10', 11, 11, 3, 1); P(c, '#fff', 7, 6); }
      else if (k === 'bows') { for (let i = 0; i < 12; i++) P(c, '#7a4a10', 4 + Math.round(Math.abs(i - 5.5) * 0.5), 2 + i); P(c, '#ddd', 7, 2, 1, 12); P(c, '#ddd', 3, 8, 10, 1); P(c, '#e8e8e8', 12, 7, 2, 3); }
      else if (k === 'mail') { P(c, '#8a8a92', 3, 3, 10, 10); for (let y = 3; y < 13; y += 2) for (let x = 3 + (y % 4 ? 1 : 0); x < 13; x += 2) P(c, '#c0c0c8', x, y); P(c, '#5a5a62', 6, 3, 4, 2); P(c, '#5a5a62', 3, 12, 10, 1); }
      else if (k === 'age') { P(c, '#a8a8a0', 2, 5, 12, 10); for (let x = 2; x < 14; x += 3) P(c, '#c8c8c0', x, 3, 2, 2); P(c, '#2a1a0a', 6, 10, 4, 5); P(c, '#ffd400', 7, 0, 2, 4); P(c, '#d82a18', 9, 0, 4, 2); }
    }));
  }
  const SVGI = {
    f: '<svg viewBox="0 0 14 14" width="14" height="14"><circle cx="7" cy="8" r="5.5" fill="#e04818" stroke="#300"/><path d="M3.5 9.5h7" stroke="#fff" stroke-width="1.4" stroke-dasharray="1 1"/><circle cx="8.5" cy="6" r="1.2" fill="#ff0"/></svg>',
    w: '<svg viewBox="0 0 14 14" width="14" height="14"><rect x="1" y="5" width="11" height="6" fill="#8a5a2a" stroke="#3a2008"/><ellipse cx="12" cy="8" rx="2" ry="3" fill="#d8aa6a" stroke="#3a2008"/><path d="M3 7h6" stroke="#6a4018"/></svg>',
    t: '<svg viewBox="0 0 14 14" width="14" height="14"><path d="M7 .5l4.5 3.2v6.6L7 13.5l-4.5-3.2V3.7z" fill="#1ac83a" stroke="#0a4a1a"/><path d="M7 3l2.3 1.6v4.8L7 11 4.7 9.4V4.6z" fill="#7aff9a"/><path d="M5.2 4.4L7 3.2" stroke="#fff"/></svg>',
    p: '<svg viewBox="0 0 14 14" width="14" height="14"><circle cx="7" cy="4.5" r="3" fill="#f0b088" stroke="#5a2a10"/><path d="M2 13c0-4 2-5.5 5-5.5s5 1.5 5 5.5z" fill="#d82a18" stroke="#5a1008"/></svg>',
  };

  // ================================================================ map generation (deterministic: the same seed makes the same map on every computer)
  function genMap(mi, seed) {
    const M = MAPS[mi], rnd = mulberry32(seed);
    const terr = new Uint8Array(N), resT = new Uint8Array(N), resAmt = new Float32Array(N);
    const blobSet = (cx, cy, r, fn) => { for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) { if (x < 0 || y < 0 || x >= MW || y >= MH) continue; const d = hyp(x + 0.5 - cx, y + 0.5 - cy); if (d < r * (0.75 + rnd() * 0.45)) fn(y * MW + x, d); } };
    const tree = i => { resT[i] = 1; resAmt[i] = 100; };
    for (let k = 0; k < 12; k++) blobSet(rnd() * MW, rnd() * MH, 1 + rnd() * 2.5, i => { terr[i] = 1; });
    for (let k = 0; k < M.lakes; k++) blobSet(6 + rnd() * 36, 6 + rnd() * 36, 1.6 + rnd() * 2.2, i => { terr[i] = 2; });
    for (let k = 0; k < M.forests; k++) blobSet(rnd() * MW, rnd() * MH, 1.5 + rnd() * 2.4, i => { if (terr[i] !== 2) tree(i); });
    for (let k = 0; k < 40; k++) { const i = Math.floor(rnd() * N); if (terr[i] !== 2) tree(i); }
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const i = y * MW + x; const e = Math.min(x, y, MW - 1 - x, MH - 1 - y); if (e === 0 || (e === 1 && rnd() < 0.55)) { tree(i); terr[i] = terr[i] === 2 ? 0 : terr[i]; } }
    for (let k = 0; k < 5; k++) { const x = 4 + Math.floor(rnd() * 40), y = 4 + Math.floor(rnd() * 40); for (let j = 0; j < 3; j++) { const i = (y + (j & 1)) * MW + x + (j >> 1); if (terr[i] !== 2) { resT[i] = 2; resAmt[i] = 120; } } }
    // the bottom-left base (copied to the other three corners afterwards)
    blobSet(6.5, 40.5, 6.5, i => { resT[i] = 0; resAmt[i] = 0; terr[i] = terr[i] === 2 ? 0 : terr[i]; });
    for (let y = 37; y < 44; y++) for (let x = 3; x < 10; x++) { const i = y * MW + x; resT[i] = 0; resAmt[i] = 0; if (terr[i] === 2) terr[i] = 0; if ((x + y) % 3 === 0) terr[i] = 1; }
    [[12, 42], [13, 42], [12, 43], [13, 43], [14, 42], [13, 44], [14, 43]].forEach(([x, y]) => { const i = y * MW + x; terr[i] = 0; resT[i] = 2; resAmt[i] = 120; });
    [[3, 33], [4, 33], [3, 34], [4, 34]].forEach(([x, y]) => { const i = y * MW + x; terr[i] = 0; resT[i] = 3; resAmt[i] = 400; });
    blobSet(12.5, 35, 2.6, i => { if (terr[i] !== 2) tree(i); });
    blobSet(2.5, 45, 2, i => { tree(i); terr[i] = 0; });
    // a clear road from the base to the middle (so every base can reach every other base)
    for (let s = 0; s <= 40; s++) { const x = Math.round(9 + 13 * s / 40), y = Math.round(40 - 15 * s / 40); for (const [a, b] of [[0, 0], [1, 0], [0, 1]]) { const i = (y + b) * MW + x + a; if (terr[i] === 2) terr[i] = 1; if (resT[i] === 1 || resT[i] === 2) { resT[i] = 0; resAmt[i] = 0; } } }
    for (let y = 24; y < 28; y++) for (let x = 19; x < 24; x++) { const i = y * MW + x; if (terr[i] === 2) terr[i] = 0; if (resT[i]) { resT[i] = 0; resAmt[i] = 0; } }
    const mines = M.mines === 4 ? [[17, 30], [20, 27], [13, 26], [9, 27]] : M.mines === 2 ? [[17, 30], [11, 27]] : [[17, 30]];
    mines.forEach(([x, y]) => [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b]) => { const i = (y + b) * MW + x + a; terr[i] = 0; resT[i] = 3; resAmt[i] = 400; }));
    [[22, 24], [23, 24]].forEach(([x, y]) => { const i = y * MW + x; terr[i] = 0; resT[i] = 3; resAmt[i] = 500; }); // the middle (everybody's)
    // four-way symmetry: every corner gets exactly the same land
    for (let y = 24; y < MH; y++) for (let x = 0; x < 24; x++) { const i = y * MW + x; let px = x, py = y; for (let k = 1; k < 4; k++) { const nx = MW - 1 - py, ny = px; px = nx; py = ny; const j = py * MW + px; terr[j] = terr[i]; resT[j] = resT[i]; resAmt[j] = resAmt[i]; } }
    return { terr, resT, resAmt };
  }
  function paintTerrain(terr, mi, seed) {
    const M = MAPS[mi] || MAPS[0];
    return mk(MW * T, MH * T, c => {
      const rnd = mulberry32((seed | 0) ^ (mi * 999 + 7));
      const isW = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && terr[y * MW + x] === 2;
      const isD = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && terr[y * MW + x] === 1;
      // soft patches of lighter and darker grass (smooth, so no chessboard)
      const blobs = []; for (let i = 0; i < 70; i++) blobs.push([rnd() * MW * T, rnd() * MH * T, 20 + rnd() * 50, rnd() < 0.5 ? 1 : 2]);
      P(c, M.grass[0], 0, 0, MW * T, MH * T);
      for (const [bx, by, r, g] of blobs) { c.fillStyle = M.grass[g]; c.globalAlpha = 0.55; c.beginPath(); c.arc(bx, by, r, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const t = terr[y * MW + x], px = x * T, py = y * T;
        if (t === 2) {
          P(c, M.water, px, py, T, T);
          for (let k = 0; k < 3; k++) P(c, M.water2, px + Math.floor(rnd() * 12), py + Math.floor(rnd() * 15), 3, 1);
          continue;
        }
        if (t === 1) { // dirt, with ragged edges where it meets grass
          P(c, M.dirt, px, py, T, T);
          for (let k = 0; k < 6; k++) P(c, k % 2 ? '#00000022' : '#ffffff1a', px + Math.floor(rnd() * 16), py + Math.floor(rnd() * 16), 1, 1);
          const ragged = (ex, ey, horiz, side) => { let d = 1 + Math.floor(rnd() * 2); for (let k = 0; k < 16; k++) { d = clamp(d + (rnd() < 0.3 ? -1 : rnd() < 0.45 ? 1 : 0), 0, 3); if (!d) continue; c.fillStyle = M.grass[0]; if (horiz) c.fillRect(px + k, side ? py + T - d : py, 1, d); else c.fillRect(side ? px + T - d : px, py + k, d, 1); } };
          if (!isD(x, y - 1) && !isW(x, y - 1)) ragged(x, y - 1, true, 0); if (!isD(x, y + 1) && !isW(x, y + 1)) ragged(x, y + 1, true, 1);
          if (!isD(x - 1, y) && !isW(x - 1, y)) ragged(x - 1, y, false, 0); if (!isD(x + 1, y) && !isW(x + 1, y)) ragged(x + 1, y, false, 1);
        } else {
          for (let k = 0; k < 5; k++) P(c, M.grass[(k + x + y) % 3], px + Math.floor(rnd() * 16), py + Math.floor(rnd() * 16), 1, k % 3 ? 1 : 2);
          if (rnd() < 0.3) { const a = px + 2 + Math.floor(rnd() * 11), b = py + 3 + Math.floor(rnd() * 10); const tuft = M.snow ? '#b8c8d855' : '#2a5a1a55'; P(c, tuft, a, b, 1, 2); P(c, tuft, a + 2, b - 1, 1, 3); }
          if (rnd() < 0.04) P(c, M.snow ? '#ffffff' : ['#fff6a0', '#ffffff', '#ff9ad8'][Math.floor(rnd() * 3)], px + Math.floor(rnd() * 14), py + Math.floor(rnd() * 14), 1, 1);
        }
        if (rnd() < 0.04) P(c, M.snow ? '#a8b4c0' : '#d8d8c8', px + Math.floor(rnd() * 14), py + Math.floor(rnd() * 14), 2, 1);
        if (isW(x - 1, y)) P(c, M.sand, px, py, 2, T); if (isW(x + 1, y)) P(c, M.sand, px + T - 2, py, 2, T);
        if (isW(x, y - 1)) P(c, M.sand, px, py, T, 2); if (isW(x, y + 1)) P(c, M.sand, px, py + T - 2, T, 2);
      }
    });
  }
  // ================================================================ CSS
  const CSS = `
.dg-rts-root{position:absolute;inset:0;display:flex;flex-direction:column;background:#1a140c;color:#f0e0b0;font:12px Tahoma,"MS Sans Serif",sans-serif;user-select:none;-webkit-user-select:none}
.dg-rts-top{flex:none;display:flex;align-items:center;flex-wrap:wrap;gap:2px 10px;padding:3px 6px;background:linear-gradient(#7a5a32,#3a2810);border-bottom:2px solid #120a04;box-shadow:inset 0 1px #b8905a;min-height:22px}
.dg-rts-r{display:inline-flex;align-items:center;gap:3px;font:bold 12px Tahoma,sans-serif;color:#fff;text-shadow:1px 1px 0 #000;min-width:46px}
.dg-rts-r svg{flex:none}
.dg-rts-age{font:bold 11px Georgia,"Times New Roman",serif;color:#ffd860;text-shadow:1px 1px #000}
.dg-rts-clock{font:bold 11px "Courier New",monospace;color:#cfe;text-shadow:1px 1px #000}
.dg-rts-tools{margin-left:auto;display:flex;gap:3px}
.dg-rts-tools button,.dg-rts-btn{font:bold 11px Tahoma,sans-serif;color:#ffe8a0;background:linear-gradient(#8a6a3a,#4a3418);border:2px outset #b8905a;padding:1px 6px;min-height:20px;cursor:pointer;text-shadow:1px 1px #000}
.dg-rts-tools button.on{border-style:inset;background:linear-gradient(#4a3418,#8a6a3a);color:#fff}
.dg-rts-tools button:active,.dg-rts-btn:active{border-style:inset}
.dg-rts-view{flex:1;position:relative;min-height:0;overflow:hidden;background:#000}
.dg-rts-view canvas{position:absolute;left:0;top:0;touch-action:none}
.dg-rts-msgs{position:absolute;left:6px;top:4px;right:236px;pointer-events:none;font:bold 12px Tahoma,sans-serif;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px #000,-1px 1px #000}
.dg-rts-msgs div{margin-bottom:1px;transition:opacity .6s}
.dg-rts-chat{position:absolute;left:6px;bottom:6px;right:6px;display:flex;gap:4px}
.dg-rts-chat input{flex:1;min-width:0;font:bold 12px Tahoma,sans-serif;background:#000c;color:#fff;border:2px inset #b8905a;padding:3px}
.dg-rts-bot{flex:none;display:grid;grid-template-columns:auto 1fr auto;gap:6px;padding:5px;background:linear-gradient(#5a4020,#2a1c0a);border-top:3px ridge #b8905a;height:124px;box-sizing:border-box}
.dg-rts-mini{width:110px;height:110px;border:2px inset #b8905a;background:#000;image-rendering:pixelated;touch-action:none;display:block}
.dg-rts-info{background:#0d0a06;border:2px inset #8a6a40;padding:4px 6px;overflow:hidden;min-width:0;font:11px/1.35 Tahoma,sans-serif;color:#e8d8a8}
.dg-rts-info b.nm{color:#ffd860;font:bold 13px Georgia,serif}
.dg-rts-info .port{float:left;width:44px;height:44px;margin:0 6px 2px 0;border:2px inset #8a6a40;background:#2a2010;image-rendering:pixelated}
.dg-rts-hp{height:5px;background:#400;border:1px solid #000;margin:2px 0;width:120px;max-width:100%}
.dg-rts-hp i{display:block;height:100%;background:#2c2}
.dg-rts-q{display:flex;gap:3px;flex-wrap:wrap;clear:both;margin-top:2px}
.dg-rts-q span{position:relative;width:28px;height:28px;border:2px outset #8a6a40;background:#2a2010;cursor:pointer}
.dg-rts-q img{width:100%;height:100%;image-rendering:pixelated}
.dg-rts-q span em{position:absolute;left:0;bottom:0;height:3px;background:#ffd400}
.dg-rts-multi{display:flex;flex-wrap:wrap;gap:2px}
.dg-rts-multi span{width:26px;height:30px;border:1px solid #6a5030;background:#2a2010;position:relative}
.dg-rts-multi img{width:26px;height:26px;image-rendering:pixelated}
.dg-rts-multi i{position:absolute;left:1px;right:1px;bottom:1px;height:2px;background:#2c2}
.dg-rts-cmd{display:grid;grid-template-columns:repeat(5,44px);grid-auto-rows:35px;gap:3px;align-content:start}
.dg-rts-cb{position:relative;padding:0;border:2px outset #c0a070;background:linear-gradient(#6a5432,#3a2a14);cursor:pointer;color:#fff;font:bold 9px Tahoma,sans-serif;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-shadow:1px 1px #000}
.dg-rts-cb img{width:24px;height:24px;image-rendering:pixelated;flex:none}
.dg-rts-cb small{font:bold 8px Tahoma,sans-serif;color:#ffe8a0;white-space:nowrap;line-height:1}
.dg-rts-cb:active{border-style:inset}
.dg-rts-cb.dis{filter:grayscale(1) brightness(.6)}
.dg-rts-cb.txt{font-size:10px}
.dg-rts-ov{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:auto;padding:10px;box-sizing:border-box}
.dg-rts-ov.dim{background:rgba(10,6,2,.78)}
.dg-rts-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;z-index:-1}
.dg-rts-logo{font:bold 46px/0.95 Impact,"Arial Black",sans-serif;letter-spacing:2px;text-align:center;color:#ffd84a;-webkit-text-stroke:1px #5a1a00;text-shadow:3px 3px 0 #8a1a00,6px 6px 0 rgba(0,0,0,.6);transform:rotate(-2deg)}
.dg-rts-logo span{display:block;font-size:22px;color:#fff;letter-spacing:6px;-webkit-text-stroke:0;text-shadow:2px 2px 0 #000;margin-top:4px;font-family:Georgia,"Times New Roman",serif;font-style:italic}
.dg-rts-menu{display:flex;flex-direction:column;gap:7px;margin-top:18px;width:260px;max-width:90%}
.dg-rts-mb{font:bold 16px Georgia,"Times New Roman",serif;color:#ffe8a0;background:linear-gradient(#9a8a6a,#5a4a2a 60%,#4a3a1a);border:3px outset #c8b080;padding:7px 10px;cursor:pointer;text-shadow:2px 2px 0 #000;letter-spacing:1px}
.dg-rts-mb:hover{color:#fff;background:linear-gradient(#b0a07a,#6a5a3a 60%,#5a4a2a)}
.dg-rts-mb:active{border-style:inset}
.dg-rts-mb:disabled{color:#998a6a;cursor:default}
.dg-rts-foot{position:absolute;bottom:6px;left:0;right:0;text-align:center;font:10px Arial,sans-serif;color:#ccb;text-shadow:1px 1px #000}
.dg-rts-panel{background:linear-gradient(#e8dcc0,#c8b890);color:#2a1a08;border:4px ridge #8a6a3a;box-shadow:4px 4px 0 rgba(0,0,0,.5);padding:12px 14px;max-width:560px;width:100%;box-sizing:border-box;font:12px/1.4 Georgia,"Times New Roman",serif;max-height:100%;overflow:auto}
.dg-rts-panel h2{margin:0 0 8px;font:bold 22px Georgia,serif;color:#5a1a00;text-align:center}
.dg-rts-panel h3{margin:8px 0 4px;font:bold 14px Georgia,serif;color:#5a1a00}
.dg-rts-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.dg-rts-card{border:2px outset #b8a070;background:#d8c8a0;padding:6px;cursor:pointer;font:11px/1.3 Tahoma,sans-serif;text-align:left;color:#2a1a08}
.dg-rts-card b{display:block;font:bold 12px Georgia,serif;color:#5a1a00}
.dg-rts-card.on{border-style:inset;background:#f8ecc8;outline:2px solid #8a1a00}
.dg-rts-card:disabled{opacity:.55;cursor:default}
.dg-rts-card canvas{width:100%;height:auto;display:block;margin-bottom:4px;image-rendering:pixelated;border:1px solid #5a4a2a}
.dg-rts-row{display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap}
.dg-rts-stats{width:100%;border-collapse:collapse;font:12px Tahoma,sans-serif;margin:6px 0}
.dg-rts-stats td,.dg-rts-stats th{border:1px solid #8a6a3a;padding:3px 6px;text-align:center}
.dg-rts-stats th{background:#5a3a1a;color:#ffe8a0}
.dg-rts-slot{display:flex;align-items:center;gap:8px;border:2px outset #b8a070;background:#d8c8a0;padding:6px;margin:4px 0;cursor:pointer;font:12px Tahoma,sans-serif;width:100%;text-align:left;color:#2a1a08}
.dg-rts-slot b{color:#5a1a00}
.dg-rts-ph .dg-rts-bot{grid-template-columns:auto 1fr;height:auto}
.dg-rts-ph .dg-rts-mini{width:96px;height:96px}
.dg-rts-ph .dg-rts-cmd{grid-column:1/3;grid-template-columns:repeat(6,1fr);grid-auto-rows:50px;min-height:50px}
.dg-rts-ph .dg-rts-cb img{width:30px;height:30px}
.dg-rts-ph .dg-rts-cb small{font-size:9px}
.dg-rts-ph .dg-rts-tools button{min-height:30px;padding:2px 8px;font-size:12px}
.dg-rts-ph .dg-rts-logo{font-size:29px}
.dg-rts-ph .dg-rts-logo span{font-size:16px;letter-spacing:3px}
.dg-rts-ph .dg-rts-cards{grid-template-columns:1fr}
.dg-rts-ph .dg-rts-card canvas{display:none}
.dg-rts-ph .dg-rts-mb{padding:11px 10px}
.dg-rts-r i{font:bold 9px Tahoma,sans-serif;color:#cfe;font-style:normal;background:#0006;border-radius:2px;padding:0 2px;margin-left:1px}
.dg-rts-r.short b{color:#ff7a5a}
.dg-rts-cb u{position:absolute;left:2px;top:1px;font:bold 8px Tahoma,sans-serif;color:#ffd860;text-decoration:none;opacity:.85}
.dg-rts-ph .dg-rts-cb u{display:none}
.dg-rts-cb.on{border-style:inset;background:linear-gradient(#3a2a14,#6a5432)}
.dg-rts-cb em{position:absolute;left:0;bottom:0;height:3px;background:#ffd400}
.dg-rts-adv{position:absolute;left:6px;top:6px;width:300px;max-width:calc(100% - 12px);z-index:3;display:flex;gap:6px;background:linear-gradient(#e8dcc0,#c8b890);color:#2a1a08;border:3px ridge #8a6a3a;box-shadow:3px 3px 0 #0008;padding:6px;box-sizing:border-box;font:12px/1.35 Georgia,"Times New Roman",serif}
.dg-rts-adv canvas{position:static;flex:none;width:40px;height:48px;image-rendering:pixelated;border:2px inset #8a6a3a;background:#5a3a1a}
.dg-rts-adv b{display:block;color:#5a1a00;font-size:12px}
.dg-rts-adv .x{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap}
.dg-rts-adv .x button{font:bold 10px Tahoma,sans-serif;border:2px outset #b8a070;background:#d8c8a0;color:#2a1a08;padding:1px 6px;cursor:pointer;min-height:20px}
.dg-rts-adv .x button:active{border-style:inset}
.dg-rts-adv.min p{display:none}
.dg-rts-obj{position:absolute;right:6px;top:6px;z-index:2;max-width:46%;background:rgba(20,12,4,.78);border:2px solid #8a6a3a;color:#f0e0b0;font:11px/1.35 Tahoma,sans-serif;padding:3px 7px;cursor:pointer}
.dg-rts-obj b{color:#ffd860;font:bold 11px Georgia,serif}
.dg-rts-obj div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dg-rts-obj .ok{color:#8f8}.dg-rts-obj .out{color:#999;text-decoration:line-through}
.dg-rts-obj.min div{display:none}
.dg-rts-obj i{display:inline-block;width:8px;height:8px;border:1px solid #000;margin-right:4px;vertical-align:-1px}
.dg-rts-tip{position:absolute;z-index:5;pointer-events:none;background:#ffffe1;color:#000;border:1px solid #000;font:11px Tahoma,sans-serif;padding:2px 5px;box-shadow:2px 2px 0 #0006;white-space:nowrap;display:none}
.dg-rts-net{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);z-index:3;background:rgba(0,0,0,.82);border:2px solid #ffd860;color:#ffd860;font:bold 13px Tahoma,sans-serif;padding:8px 14px;text-align:center;pointer-events:none;display:none;max-width:90%}
.dg-rts-net small{display:block;color:#fff;font-weight:normal;margin-top:3px}
.dg-rts-net big{display:block;font:bold 28px "Courier New",monospace;color:#fff}
.dg-rts-seat{display:grid;grid-template-columns:18px 1fr auto auto auto auto;gap:4px;align-items:center;border:2px outset #b8a070;background:#d8c8a0;padding:4px 6px;margin:3px 0;font:12px Tahoma,sans-serif;color:#2a1a08}
.dg-rts-seat.me{outline:2px solid #8a1a00}
.dg-rts-seat select{font:11px Tahoma,sans-serif;max-width:120px;min-height:22px}
.dg-rts-seat .sw{width:14px;height:14px;border:1px solid #000}
.dg-rts-seat .rd{font:bold 11px Tahoma,sans-serif;color:#0a6a0a}
.dg-rts-seat .nr{font:bold 11px Tahoma,sans-serif;color:#8a1a00}
.dg-rts-ph .dg-rts-seat{grid-template-columns:14px 1fr auto auto;font-size:11px}
.dg-rts-ph .dg-rts-seat .civ{grid-column:2/4}
.dg-rts-scen{display:flex;gap:8px;align-items:flex-start;border:2px outset #b8a070;background:#d8c8a0;padding:6px;margin:4px 0;font:12px/1.35 Tahoma,sans-serif;color:#2a1a08;width:100%;text-align:left;cursor:pointer}
.dg-rts-scen:disabled{opacity:.55;cursor:default}
.dg-rts-scen b{display:block;font:bold 13px Georgia,serif;color:#5a1a00}
.dg-rts-scen .st{margin-left:auto;font:bold 11px Tahoma,sans-serif;white-space:nowrap}
.dg-rts-mb.hot{box-shadow:0 0 0 2px #ffd400,0 0 10px #ffd400}
.dg-rts-mb small{display:block;font:11px Tahoma,sans-serif;color:#ffd860;letter-spacing:0}
.dg-rts-keys{width:100%;border-collapse:collapse;font:12px Tahoma,sans-serif}
.dg-rts-keys td{border-bottom:1px dotted #8a6a3a;padding:1px 4px;font-size:11px}
.dg-rts-keys td:first-child{font:bold 11px "Courier New",monospace;white-space:nowrap;color:#5a1a00}
.dg-rts-chatlog{position:absolute;left:6px;bottom:40px;pointer-events:none}
.dg-rts-ph .dg-rts-adv{width:auto;right:6px;font-size:11px}
.dg-rts-ph .dg-rts-adv canvas{width:30px;height:36px}
.dg-rts-ph .dg-rts-obj{top:auto;bottom:6px;right:6px;max-width:60%}
.dg-rts-ph .dg-rts-msgs{right:6px}
.dg-rts-view.adv .dg-rts-msgs{left:316px}
.dg-rts-ph .dg-rts-view.adv .dg-rts-msgs{left:6px;top:auto;bottom:40px}
.dg-rts-maps .dg-rts-card{text-align:center}
.dg-rts-maps canvas{width:64px!important;height:64px!important;margin:0 auto 3px}
.dg-rts-maps small{display:block;text-align:left;font-size:10px;line-height:1.25}
`;

  // ================================================================ the game
  D.mod('rts', (G, arg) => {
    G.css('dg-css-rts', CSS);
    try { if (window.Sound && Sound.addTune && !Sound.tunes().includes('aow2')) Sound.addTune('aow2', { step: 0.18, hats: false,
      lead: [62, 0, 65, 67, 69, -1, 67, 65, 64, -1, 62, -1, 60, 62, 64, -1, 65, -1, 67, 65, 64, 62, 60, -1, 62, -1, -1, -1, 0, 0, 57, 60,
        69, -1, 72, -1, 71, 69, 67, -1, 69, -1, 65, -1, 67, -1, 64, -1, 62, 64, 65, 67, 69, 67, 65, 64, 62, -1, -1, -1, 0, 0, 0, 0],
      bass: [38, 38, 45, 45, 41, 41, 36, 36, 38, 38, 45, 45, 40, 40, 43, 43, 45, 45, 41, 41, 43, 43, 40, 40, 38, 38, 45, 45, 38, 38, 38, 38] }); } catch (e) {}
    const host = G.host, tok = {}; host._rtsTok = tok; const live = () => host._rtsTok === tok;
    const root = el('div', 'dg-rts-root'); host.appendChild(root);
    const OPT = Object.assign({ speed: 1, music: true, zoom: 2, tips: true }, G.load('opts', {}));
    const saveOpt = () => G.save('opts', OPT);
    const SEEN = Object.assign({ tut: 0, camp: {} }, G.load('seen', {})); // tut: did (or skipped) the Learning Campaign; camp: scenarios won
    const saveSeen = () => G.save('seen', SEEN);
    const playerName = () => (window.Net && Net.me && Net.me.member && Net.me.nick) || 'Jack';
    let S = null, scene = 'title', ov = null, NET = null;
    const U = { cam: { x: 0, y: 0 }, sel: [], mode: '', placeType: '', ghost: null, box: null, boxMode: false, keys: {}, mouse: null, marks: [], groups: {}, lastSay: 0, chat: false, hoverTip: '', flash: null, grp: { k: '', t: 0 }, lastSfx: {} };

    // ---- DOM
    root.innerHTML = `<div class="dg-rts-top"><span class="dg-rts-r" data-r="f" title="Food (and how many Villagers are gathering it)">${SVGI.f}<b>0</b><i>0</i></span><span class="dg-rts-r" data-r="w" title="Wood (and how many Villagers are chopping)">${SVGI.w}<b>0</b><i>0</i></span><span class="dg-rts-r" data-r="t" title="Rupees (and how many Villagers are digging)">${SVGI.t}<b>0</b><i>0</i></span><span class="dg-rts-r" data-r="p" title="Population / room. Houses give +5 room.">${SVGI.p}<b>0/0</b></span><span class="dg-rts-age"></span><span class="dg-rts-clock"></span><span class="dg-rts-tools"><button type="button" data-t="idle" title="Next idle Villager (.)">Idle</button><button type="button" data-t="army" title="Select all your soldiers">Army</button><button type="button" data-t="box" title="Drag a box to select lots of units">Box</button><button type="button" data-t="chat" title="Chat (Enter)">Chat</button><button type="button" data-t="menu" title="Game menu (F10)">Menu</button></span></div>
<div class="dg-rts-view"><canvas></canvas><div class="dg-rts-msgs"></div><div class="dg-rts-obj" title="Objectives (click to fold away)"></div><div class="dg-rts-tip"></div><div class="dg-rts-net"></div></div>
<div class="dg-rts-bot"><canvas class="dg-rts-mini" width="96" height="96"></canvas><div class="dg-rts-info"></div><div class="dg-rts-cmd"></div></div>`;
    const top = root.querySelector('.dg-rts-top'), view = root.querySelector('.dg-rts-view'), cv = view.querySelector('canvas'), ctx = cv.getContext('2d');
    const msgs = root.querySelector('.dg-rts-msgs'), mini = root.querySelector('.dg-rts-mini'), mctx = mini.getContext('2d'), info = root.querySelector('.dg-rts-info'), cmd = root.querySelector('.dg-rts-cmd');
    const bot = root.querySelector('.dg-rts-bot'), objEl = root.querySelector('.dg-rts-obj'), tipEl = root.querySelector('.dg-rts-tip'), netEl = root.querySelector('.dg-rts-net');
    const resEl = k => top.querySelector(`[data-r=${k}] b`), resCnt = k => top.querySelector(`[data-r=${k}] i`);
    const fit = () => {
      const r = view.getBoundingClientRect(); const w = Math.max(1, Math.floor(r.width)), h = Math.max(1, Math.floor(r.height));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
      root.classList.toggle('dg-rts-ph', root.clientWidth < 600);
      if (S) clampCam();
    };
    const ro = new ResizeObserver(fit); ro.observe(root); G.onClose(() => ro.disconnect());
    const showGame = on => { top.style.display = on ? '' : 'none'; bot.style.display = on ? '' : 'none'; if (!on) { objEl.style.display = 'none'; netEl.style.display = 'none'; tipEl.style.display = 'none'; advClose(); } };
    let advEl = null; const advClose = () => { if (advEl) { advEl.remove(); advEl = null; } view.classList.remove('adv'); };
    G.on(objEl, 'click', () => objEl.classList.toggle('min'));

    // ================================================================ state helpers
    const Z = () => OPT.zoom, TSZ = () => T * OPT.zoom;
    const idx = (x, y) => y * MW + x;
    const isBlk = i => S.terr[i] === 2 || S.resT[i] > 0 || S.blk[i] > 0;
    const blockedXY = (x, y) => x < 0 || y < 0 || x >= MW || y >= MH || isBlk(idx(x, y));
    const byId = id => S.map.get(id);
    const rectOf = b => ({ x: b.x, y: b.y, w: BT[b.t].s, h: BT[b.t].s });
    const cen = e => e.k === 'u' ? { x: e.x, y: e.y } : { x: e.x + BT[e.t].s / 2, y: e.y + BT[e.t].s / 2 };
    const distRect = (u, rx, ry, w, h) => { const dx = Math.max(rx - u.x, 0, u.x - (rx + w)), dy = Math.max(ry - u.y, 0, u.y - (ry + h)); return hyp(dx, dy); };
    const distTo = (u, t) => t.k === 'u' ? hyp(t.x - u.x, t.y - u.y) : distRect(u, t.x, t.y, BT[t.t].s, BT[t.t].s);
    const isAI = p => S.pl[p].ai >= 0;
    const foe = (a, b) => a !== b && a >= 0 && b >= 0 && S.pl[a].ally !== S.pl[b].ally;
    const friend = (a, b) => a >= 0 && b >= 0 && S.pl[a].ally === S.pl[b].ally;
    const meFoe = p => S.me >= 0 && foe(p, S.me);
    const colOf = p => (S.pl[p] ? S.pl[p].col : 0);
    const mineE = e => S.me >= 0 && e.team === S.me;
    const nameOf = e => (e.k === 'u' ? UT[e.t] : BT[e.t]).n[S.age[e.team] === 2 ? 1 : 0];
    const pName = p => (S.pl[p] ? S.pl[p].name : '?');
    const hasTech = (p, k) => !!(S.tech[p] && S.tech[p][k]);
    const IDLE = () => ({ type: 'idle' });
    // stats, with the age, technologies and civilisation bonuses
    const uHp = u => UT[u.t].hp + (SOLDIER(u.t) && S.age[u.team] === 2 ? 10 : 0) + (u.t === 'rider' && S.pl[u.team].civ === 1 ? 20 : 0);
    const uAtk = u => { const ty = UT[u.t]; let a = ty.atk; if (SOLDIER(u.t) && S.age[u.team] === 2) a += 1; if (ty.mel && u.t !== 'hero' && hasTech(u.team, 'swords')) a += 2; if (u.t === 'shoota' && hasTech(u.team, 'bows')) a += 1; return a; };
    const uArm = u => UT[u.t].arm + (SOLDIER(u.t) && hasTech(u.team, 'mail') ? 2 : 0);
    const uRng = u => UT[u.t].rng + (u.t === 'shoota' ? (hasTech(u.team, 'bows') ? 1 : 0) + (S.pl[u.team].civ === 0 ? 1 : 0) : 0);
    const uSpd = u => UT[u.t].spd * (u.t === 'grot' && hasTech(u.team, 'barrow') ? 1.1 : 1);
    const uSight = u => UT[u.t].sight + (u.t === 'shoota' && S.pl[u.team].civ === 0 ? 1 : 0);
    const bAtk = b => (BT[b.t].atk || 0) + (hasTech(b.team, 'bows') ? 1 : 0);
    const bRng = b => (BT[b.t].rng || 0) + (hasTech(b.team, 'bows') ? 1 : 0);
    const hpMax = e => e.k === 'u' ? uHp(e) : BT[e.t].hp;
    const capN = p => hasTech(p, 'barrow') ? 15 : CAP;
    const gathMul = (p, k) => (isAI(p) ? DIFF[S.pl[p].ai].gath : 1) * (k === 'w' && S.pl[p].civ === 2 ? 1.2 : 1);
    const cheatOn = (p, k) => !S.online && p === S.me && !!S.cheats[k];
    const buildMul = p => (S.pl[p].civ === 3 ? 1.3 : 1) * (cheatOn(p, 'fast') ? 10 : 1);
    const afford = (p, c) => { const R = S.res[p]; return (c.f || 0) <= R.f && (c.w || 0) <= R.w && (c.t || 0) <= R.t; };
    const pay = (p, c, sgn) => { const R = S.res[p]; R.f -= (c.f || 0) * (sgn || 1); R.w -= (c.w || 0) * (sgn || 1); R.t -= (c.t || 0) * (sgn || 1); };
    const popOf = p => { let n = 0; for (const e of S.ents) if (e.k === 'u' && e.team === p && !e.dead) n++; return n; };
    const capOf = p => { let n = 0; for (const e of S.ents) if (e.k === 'b' && e.team === p && e.done && !e.dead && BT[e.t].pop) n += BT[e.t].pop; return Math.min(75, n); };
    const teamEnts = (p, k) => S.ents.filter(e => !e.dead && e.team === p && (!k || e.k === k));
    const isUnitItem = it => !!UT[it];
    const qTime = it => it === 'age' ? AGE.time : it.startsWith('r:') ? TECH[it.slice(2)].time : UT[it].time;
    const qCost = it => it === 'age' ? AGE.cost : it.startsWith('r:') ? TECH[it.slice(2)].cost : UT[it].cost;
    const queuedAnywhere = (p, it) => S.ents.some(e => !e.dead && e.k === 'b' && e.team === p && e.queue.includes(it));
    // the simulation's own dice (part of the game state, so every computer rolls the same numbers)
    function rnd() { const a = S.rs = (S.rs + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }

    // ================================================================ pathfinding (A*, 8 directions, no corner cutting)
    const gS = new Float32Array(N), from = new Int32Array(N), seenA = new Uint32Array(N), closedA = new Uint32Array(N), hI = new Int32Array(N * 8), hF = new Float32Array(N * 8);
    let gen = 0;
    const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
    function astar(sx, sy, goal, hx, hy) {
      gen++; let hn = 0;
      const oct = (x, y) => { const dx = Math.abs(x - hx), dy = Math.abs(y - hy); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
      const push = (i, f) => { let k = hn++; while (k > 0) { const p = (k - 1) >> 1; if (hF[p] <= f) break; hI[k] = hI[p]; hF[k] = hF[p]; k = p; } hI[k] = i; hF[k] = f; };
      const pop = () => { const tp = hI[0]; hn--; if (hn > 0) { const li = hI[hn], lf = hF[hn]; let k = 0; for (;;) { let c = 2 * k + 1; if (c >= hn) break; if (c + 1 < hn && hF[c + 1] < hF[c]) c++; if (hF[c] >= lf) break; hI[k] = hI[c]; hF[k] = hF[c]; k = c; } hI[k] = li; hF[k] = lf; } return tp; };
      const s = idx(sx, sy); gS[s] = 0; seenA[s] = gen; from[s] = -1; push(s, oct(sx, sy));
      let best = s, bestH = Infinity, found = -1, it = 0;
      while (hn > 0 && it++ < 3000) {
        const i = pop(); if (closedA[i] === gen) continue; closedA[i] = gen;
        const x = i % MW, y = (i / MW) | 0;
        if (goal(x, y)) { found = i; break; }
        const hh = oct(x, y); if (hh < bestH) { bestH = hh; best = i; }
        for (let d = 0; d < 8; d++) {
          const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
          const ni = ny * MW + nx; if (closedA[ni] === gen || isBlk(ni)) continue;
          if (d >= 4 && (isBlk(y * MW + nx) || isBlk(ny * MW + x))) continue;
          const ng = gS[i] + (d >= 4 ? 1.414 : 1);
          if (seenA[ni] === gen && ng >= gS[ni]) continue;
          seenA[ni] = gen; gS[ni] = ng; from[ni] = i; if (hn < hI.length - 1) push(ni, ng + oct(nx, ny));
        }
      }
      const end = found >= 0 ? found : best, path = [];
      for (let i = end; i !== s && i !== -1; i = from[i]) path.push(i);
      return path.reverse();
    }
    function moveTo(u, gx, gy, rect) {
      u.goal = { x: gx, y: gy, rect: rect || null };
      const sx = clamp(u.x | 0, 0, MW - 1), sy = clamp(u.y | 0, 0, MH - 1);
      let goal, hx, hy;
      if (rect) { goal = (x, y) => x >= rect.x - 1 && x <= rect.x + rect.w && y >= rect.y - 1 && y <= rect.y + rect.h && !(x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h); hx = rect.x + rect.w / 2; hy = rect.y + rect.h / 2; }
      else { const tx = clamp(gx | 0, 0, MW - 1), ty = clamp(gy | 0, 0, MH - 1); goal = (x, y) => x === tx && y === ty; hx = tx; hy = ty; }
      if (goal(sx, sy)) { u.path = []; u.pi = 0; u.dest = rect ? null : { x: gx, y: gy }; return; }
      const p = astar(sx, sy, goal, hx, hy);
      u.path = p; u.pi = 0;
      u.dest = (!rect && p.length && p[p.length - 1] === idx(clamp(gx | 0, 0, MW - 1), clamp(gy | 0, 0, MH - 1))) ? { x: gx, y: gy } : null;
    }
    // walk along the path; true when finished
    function follow(u, dt) {
      let tx, ty, last = false;
      if (u.path && u.pi < u.path.length) {
        const i = u.path[u.pi];
        if (isBlk(i)) { const g = u.goal; u.rp = (u.rp || 0) + 1; if (g && u.rp < 30) moveTo(u, g.x, g.y, g.rect); else { u.path = null; u.dest = null; return true; } return false; }
        last = u.pi === u.path.length - 1;
        tx = (i % MW) + 0.5; ty = ((i / MW) | 0) + 0.5;
        if (last && u.dest) { tx = u.dest.x; ty = u.dest.y; }
      } else if (u.dest) { tx = u.dest.x; ty = u.dest.y; last = true; }
      else { u.path = null; return true; }
      const dx = tx - u.x, dy = ty - u.y, d = hyp(dx, dy), step = uSpd(u) * dt;
      u.moving = true; if (Math.abs(dx) > 0.02) u.fx = dx < 0 ? -1 : 1;
      // close enough: a waypoint on the way only needs passing near (two people heading for the same spot would
      // otherwise circle it for ever), and the end only needs reaching within a whisker after a second of trying
      if (last && d < 0.6) u.cl = (u.cl || 0) + dt; else u.cl = 0;
      if (d <= step || (!last && d < 0.4) || u.cl > 1.2) {
        u.cl = 0;
        if (d <= step) { u.x = tx; u.y = ty; } else if (!last) { u.x += dx / d * step; u.y += dy / d * step; }
        if (u.path && u.pi < u.path.length) u.pi++;
        if (!u.path || u.pi >= u.path.length) { u.path = null; u.dest = null; return true; }
        return false;
      }
      u.x += dx / d * step; u.y += dy / d * step;
      return false;
    }
    // walk until near() is true. 1 = there, 0 = walking, -1 = can't get there
    function approach(u, dt, near, go) {
      if (near()) { u.path = null; u.dest = null; u.stk = 0; return 1; }
      if (!u.path && !u.dest) { if (++u.stk > 4) { u.stk = 0; return -1; } go(); return 0; }
      follow(u, dt); return 0;
    }

    // ================================================================ entities
    function addUnit(t, team, x, y) {
      const u = { k: 'u', id: S.nextId++, t, team, x, y, hp: 0, o: IDLE(), path: null, pi: 0, dest: null, goal: null, cool: 0, hitT: 0, fx: x < MW / 2 ? 1 : -1, carry: { k: 'f', n: 0 }, stk: 0, rp: 0, rep: 0, bub: null, fl: 0 };
      u.hp = uHp(u); S.ents.push(u); S.map.set(u.id, u); return u;
    }
    function addBld(t, team, x, y, done) {
      const ty = BT[t];
      const b = { k: 'b', id: S.nextId++, t, team, x, y, hp: done ? ty.hp : Math.ceil(ty.hp * 0.1), done: !!done, prog: done ? 1 : 0, queue: [], qt: 0, rally: null, cool: 0, worker: 0, fl: 0 };
      S.ents.push(b); S.map.set(b.id, b); occupy(b, 1, true); return b;
    }
    function occupy(b, on, shove) {
      const s = BT[b.t].s;
      for (let y = b.y; y < b.y + s; y++) for (let x = b.x; x < b.x + s; x++) { const i = idx(x, y); S.occ[i] = on ? b.id : 0; S.blk[i] = on && !BT[b.t].farm ? 1 : 0; }
      if (on && shove && !BT[b.t].farm) { // shove units out of the footprint
        for (const u of S.ents) if (u.k === 'u' && !u.dead && u.x >= b.x && u.x < b.x + s && u.y >= b.y && u.y < b.y + s) { const f = freeNear(b.x, b.y, s, s); if (f) { u.x = f.x + 0.5; u.y = f.y + 0.5; u.path = null; } }
      }
    }
    function freeNear(rx, ry, w, h) {
      for (let r = 1; r < 10; r++) {
        const cand = [];
        for (let y = ry - r; y < ry + h + r; y++) for (let x = rx - r; x < rx + w + r; x++) {
          if (x > rx - r && x < rx + w + r - 1 && y > ry - r && y < ry + h + r - 1) continue;
          if (!blockedXY(x, y)) cand.push({ x, y });
        }
        if (cand.length) return cand[Math.floor(rnd() * cand.length)];
      }
      return null;
    }
    // ui: the local player placing it by hand (must be ground they've seen)
    function canPlace(t, x, y, ui) {
      const s = BT[t].s;
      if (x < 1 || y < 1 || x + s > MW - 1 || y + s > MH - 1) return false;
      for (let yy = y; yy < y + s; yy++) for (let xx = x; xx < x + s; xx++) { const i = idx(xx, yy); if (S.terr[i] === 2 || S.resT[i] || S.occ[i]) return false; if (ui && !S.exp[i]) return false; }
      return true;
    }
    function say(u, kind, force) {
      if (!u || !mineE(u)) return;
      const now = performance.now() / 1000; if (!force && now - U.lastSay < 0.8) return; U.lastSay = now;
      const list = kind === 'sel' ? (u.t === 'grot' ? SAY.grot : SAY.sel) : SAY[kind];
      u.bub = { txt: u.t === 'hero' ? vpick(['I\'m the best!', 'Gubbinz is here! Need a hand?', 'Fear me! Or don\'t, I\'m small.']) : vpick(list), t: 1.6 };
    }
    function msg(txt, col) {
      const d = el('div'); d.textContent = txt; d.style.color = col || '#fff'; msgs.appendChild(d);
      while (msgs.children.length > 6) msgs.firstChild.remove();
      G.timer(() => { d.style.opacity = '0'; G.timer(() => d.remove(), 700); }, 6500);
    }
    // a little sound, not too often (and only for things on screen, unless it matters)
    function snd(name, x, y, gap) {
      if (!G.sound) return;
      if (x != null && !onScreen(x, y)) return;
      const t = performance.now(), k = name; if (t - (U.lastSfx[k] || 0) < (gap || 120)) return; U.lastSfx[k] = t;
      if (name === 'clash') G.note(1400 + Math.random() * 600, 0.04, 'square');
      else if (name === 'bow') G.note(700 + Math.random() * 200, 0.05, 'triangle');
      else if (name === 'horn') { G.note(196, 0.25, 'sawtooth'); G.timer(() => G.note(262, 0.35, 'sawtooth'), 260); }
      else if (name === 'fanfare') [523, 659, 784, 1046].forEach((f, i) => G.timer(() => G.note(f, 0.18, 'square'), i * 150));
      else if (name === 'die') G.note(220 - Math.random() * 60, 0.12, 'triangle');
      else G.sfx(name);
    }

    // ================================================================ orders
    function orderMove(u, x, y, am) { u.o = am ? { type: 'amove', x, y } : { type: 'move' }; u.rp = 0; moveTo(u, x, y); }
    function orderAttack(u, t, back) { u.o = { type: 'attack', tid: t.id, back: back || null }; u.path = null; u.dest = null; u.rep = 0; }
    function orderGather(u, ri, pen) {
      if (pen) { u.o = { type: 'gather', kind: 'f', pen: pen.id, ri: -1, ph: 'go' }; }
      else u.o = { type: 'gather', kind: KIND_OF[S.resT[ri]] || 'w', ri, pen: 0, ph: 'go' };
      if (u.carry.n > 0 && u.carry.k !== u.o.kind) u.carry.n = 0;
      u.path = null; u.dest = null; u.stk = 0;
    }
    function orderBuild(u, b) { u.o = { type: 'build', bid: b.id }; u.path = null; u.dest = null; u.stk = 0; }
    const reachable = i => { const x = i % MW, y = (i / MW) | 0; for (let d = 0; d < 8; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx >= 0 && ny >= 0 && nx < MW && ny < MH && !isBlk(ny * MW + nx)) return true; } return false; };
    function findRes(kind, x, y, maxR, bad) {
      const want = RES_OF[kind]; let best = -1, bd = Infinity;
      for (let i = 0; i < N; i++) { if (S.resT[i] !== want) continue; const d = hyp((i % MW) + 0.5 - x, ((i / MW) | 0) + 0.5 - y); if (d < bd && d <= maxR && (!bad || !bad.includes(i)) && reachable(i)) { bd = d; best = i; } }
      return best;
    }
    function freePen(p, x, y) {
      let best = null, bd = Infinity;
      for (const b of S.ents) if (b.k === 'b' && !b.dead && b.team === p && b.t === 'pen' && b.done) { const w = byId(b.worker); if (w && !w.dead && w.o.type === 'gather' && w.o.pen === b.id) continue; const d = hyp(b.x + 1 - x, b.y + 1 - y); if (d < bd) { bd = d; best = b; } }
      return best;
    }
    function nearestDrop(u) {
      let best = null, bd = Infinity;
      for (const b of S.ents) if (b.k === 'b' && !b.dead && b.team === u.team && b.done && BT[b.t].drop) { const d = distRect(u, b.x, b.y, BT[b.t].s, BT[b.t].s); if (d < bd) { bd = d; best = b; } }
      return best;
    }
    function retarget(u) {
      const o = u.o, lx = o.ri >= 0 ? (o.ri % MW) + 0.5 : u.x, ly = o.ri >= 0 ? ((o.ri / MW) | 0) + 0.5 : u.y;
      const r = findRes(o.kind, lx, ly, 9, o.bad);
      if (r >= 0) { o.ri = r; o.ph = 'go'; u.path = null; u.dest = null; return true; }
      if (o.kind === 'f') { const p = freePen(u.team, u.x, u.y); if (p) { o.pen = p.id; o.ri = -1; o.ph = 'go'; u.path = null; return true; } }
      return false;
    }

    // ================================================================ simulation (one fixed STEP at a time; nothing here may use Math.random or the clock)
    function update(dt) {
      S.time += dt; S.step++;
      for (const e of S.ents) { if (e.dead) continue; if (e.k === 'u') updUnit(e, dt); else updBld(e, dt); }
      separate();
      if (S.anyDead) { S.ents = S.ents.filter(e => !e.dead); S.anyDead = false; }
      for (const e of S.ents) if (e.k === 'u') { e.x = Math.round(e.x * 256) / 256; e.y = Math.round(e.y * 256) / 256; }
      if ((S.tA -= dt) <= 0) { S.tA = 0.5; acquire(); }
      if ((S.t1 -= dt) <= 0) { S.t1 = 1; for (let p = 0; p < S.np; p++) if (!S.pl[p].out && isAI(p)) aiTick(p); scenTick(); checkEnd(); }
      if (G.demo && !S.online && S.time >= 900 && !S.over) { S.over = true; S.demoOver = true; G.demoEnd('That\'s 15 minutes of the Age of Jackpires II demo. The full version has four maps, Normal and Hard computer players (Callum is VERY hard), the campaign, online play and no time limit!'); }
    }
    function updUnit(u, dt) {
      if (u.cool > 0) u.cool -= dt;
      if (u.hitT > 0) u.hitT -= dt;
      u.moving = false; u.working = false;
      const o = u.o;
      if (o.type === 'move' || o.type === 'amove') { if (follow(u, dt)) u.o = IDLE(); }
      else if (o.type === 'attack') doAttack(u, dt);
      else if (o.type === 'gather') doGather(u, dt);
      else if (o.type === 'build') doBuild(u, dt);
    }
    function backTo(u) {
      const back = u.o.back; u.o = IDLE();
      if (back) { u.o = back; if (back.type === 'amove') moveTo(u, back.x, back.y); else { u.path = null; u.dest = null; } }
    }
    function doAttack(u, dt) {
      const t = byId(u.o.tid);
      if (!t || t.dead || !foe(u.team, t.team) || (t.k === 'u' && distTo(u, t) > uSight(u) + 4)) { backTo(u); return; }
      const d = distTo(u, t), reach = uRng(u) + (t.k === 'u' ? 0.3 : 0.55);
      if (d <= reach) {
        u.path = null; u.dest = null; const c = cen(t); u.fx = c.x < u.x ? -1 : 1;
        if (u.cool <= 0) { u.cool = UT[u.t].rate; u.hitT = 0.25; hit(u, t); }
      } else {
        u.rep = (u.rep || 0) - dt;
        if ((!u.path && !u.dest) || u.rep <= 0) { u.rep = 0.9; if (t.k === 'b') moveTo(u, 0, 0, rectOf(t)); else moveTo(u, t.x, t.y); }
        follow(u, dt);
      }
    }
    function hit(a, t) {
      const isU = a.k === 'u', ty = isU ? UT[a.t] : BT[a.t];
      let dmg = isU ? uAtk(a) : bAtk(a);
      if (t.k === 'u') dmg = Math.max(1, dmg - uArm(t));
      if (isU && ty.bonus && t.k === 'u' && ty.bonus[t.t]) dmg += ty.bonus[t.t];
      if (isU && ty.bld && t.k === 'b') dmg *= ty.bld;
      if (isU && a.t !== 'kannon' && t.k === 'b') dmg = Math.max(1, Math.round(dmg * (a.t === 'grot' ? 0.3 : a.t === 'boy' || a.t === 'hero' ? 0.75 : 0.5)));
      if (cheatOn(a.team, 'dakka')) dmg = Math.round(dmg * 1.5);
      const ac = cen(a), tcn = cen(t);
      const kind = !isU ? 'arrow' : ty.ranged === 'shell' ? 'shell' : ty.ranged ? 'arrow' : null;
      if (kind) S.proj.push({ x0: ac.x, y0: ac.y - 0.4, x1: tcn.x + (Math.random() - 0.5) * 0.3, y1: tcn.y - 0.3, t: 0, dur: kind === 'shell' ? 0.7 : 0.25, kind });
      if (kind === 'shell') {
        S.fx.push({ x: tcn.x, y: tcn.y, t: -0.65, dur: 0.5, kind: 'boom' });
        for (const e of S.ents) if (e !== t && !e.dead && e.k === 'u' && foe(a.team, e.team) && hyp(e.x - tcn.x, e.y - tcn.y) < ty.splash) damage(e, Math.ceil(uAtk(a) / 2), a);
      } else if (!kind) S.fx.push({ x: tcn.x + (Math.random() - 0.5) * 0.4, y: tcn.y - 0.4, t: 0, dur: 0.18, kind: 'spark' });
      snd(kind === 'shell' ? 'thud' : kind ? 'bow' : 'clash', ac.x, ac.y, kind === 'shell' ? 200 : 90);
      damage(t, dmg, a);
    }
    function damage(t, dmg, a) {
      if (t.dead) return;
      t.hp -= dmg; t.fl = 0.14;
      if (mineE(t) && a && foe(a.team, t.team)) alertAttack(t);
      if (a && S.ai[t.team] && foe(a.team, t.team)) S.ai[t.team].grudge = a.team;
      if (t.k === 'u' && a && !a.dead && a.k === 'u' && t.hp > 0) {
        const ot = t.o.type, ai = isAI(t.team);
        if (ot === 'idle' || (t.t === 'grot' && ai && ot !== 'attack' && rnd() < 0.3) || (t.t !== 'grot' && ot === 'move' && ai)) orderAttack(t, a, ot === 'idle' ? null : t.o);
      }
      if (t.hp <= 0) kill(t, a);
    }
    function kill(t, a, quiet) {
      t.dead = true; S.anyDead = true; S.map.delete(t.id);
      if (a) S.stats[a.team].kills++; S.stats[t.team].lost++;
      if (a && a.t === 'spear' && t.t === 'rider' && a.team === S.me && !S.online) G.secret('rts.spear');
      if (t.k === 'b') {
        occupy(t, 0);
        S.fx.push({ x: t.x + BT[t.t].s / 2, y: t.y + BT[t.t].s / 2, t: 0, dur: 0.8, kind: 'boom', big: 1 });
        S.fx.push({ x: t.x, y: t.y, t: 0, dur: 1.1, kind: 'fall', bt: t.t, col: colOf(t.team), done: t.done });
        S.decals.push({ x: t.x, y: t.y, s: BT[t.t].s, t: 0, kind: 'rubble' });
        snd('thud', t.x, t.y, 60);
        if (!quiet) { if (mineE(t)) msg(`Your ${nameOf(t)} has been destroyed!`, '#ff8a6a'); else if (meFoe(t.team) && a && friend(a.team, S.me) && S.exp[idx(t.x, t.y)]) msg(`Enemy ${nameOf(t)} flattened!`, '#9f9'); }
        S.miniDirty = true;
      } else {
        S.fx.push({ x: t.x, y: t.y, t: 0, dur: 0.9, kind: 'die', ut: t.t, col: colOf(t.team), fx: t.fx || 1 });
        S.decals.push({ x: t.x, y: t.y, t: 0, kind: 'skull' });
        if (!quiet) snd('die', t.x, t.y, 150);
      }
      if (S.decals.length > 60) S.decals.shift();
      if (U.sel.includes(t.id)) U.sel = U.sel.filter(id => id !== t.id);
    }
    let lastAlert = -99;
    function alertAttack(t) {
      const now = performance.now() / 1000; if (now - lastAlert < 14) return;
      const c = cen(t);
      if (onScreen(c.x, c.y)) return;
      lastAlert = now;
      msg(t.k === 'b' ? 'Herald: My lord! The town is under attack!' : 'Herald: My lord! Our soldiers are under attack!', '#ffd860');
      snd('horn'); G.sfx('uhoh'); U.ping = { x: c.x, y: c.y, t: 3 };
    }
    // idle soldiers (and attack-movers) pick fights
    function acquire() {
      for (const u of S.ents) {
        if (u.dead || u.k !== 'u') continue;
        const ot = u.o.type;
        if (!(ot === 'idle' || ot === 'amove')) continue;
        if (u.t === 'grot' && ot === 'idle') continue;
        const R = uSight(u) + (ot === 'idle' ? 0 : 1), human = !isAI(u.team);
        let best = null, bd = Infinity;
        for (const e of S.ents) {
          if (e.dead || !foe(u.team, e.team)) continue;
          if (e.k === 'b' && ot === 'idle' && human && UT[u.t].ranged !== 'shell') continue;
          let d = distTo(u, e); if (e.k === 'b') d += 1.5; // prefer units
          if (d < R && d < bd) { bd = d; best = e; }
        }
        if (best) orderAttack(u, best, ot === 'amove' ? u.o : null);
      }
    }
    function doGather(u, dt) {
      const o = u.o;
      if (o.ph === 'back') {
        let d = byId(o.drop);
        if (!d || d.dead || !d.done || d.team !== u.team) { d = nearestDrop(u); if (!d) { u.o = IDLE(); return; } o.drop = d.id; u.path = null; u.dest = null; }
        const s = BT[d.t].s;
        const r = approach(u, dt, () => distRect(u, d.x, d.y, s, s) < 0.8, () => moveTo(u, 0, 0, rectOf(d)));
        if (r === 1) {
          const n = u.carry.n; S.res[u.team][u.carry.k] += n; S.stats[u.team].gath[u.carry.k] += n; u.carry.n = 0;
          if (o.pen) { const p = byId(o.pen); if (!p || p.dead) { if (!retarget(u)) u.o = IDLE(); } else o.ph = 'go'; }
          else if (o.ri >= 0 && S.resT[o.ri] && KIND_OF[S.resT[o.ri]] === o.kind) o.ph = 'go';
          else if (!retarget(u)) u.o = IDLE();
        } else if (r === -1) u.o = IDLE();
        return;
      }
      if (o.pen) {
        const p = byId(o.pen);
        if (!p || p.dead || !p.done) { o.pen = 0; if (!retarget(u)) { u.o = IDLE(); } return; }
        if (p.worker && p.worker !== u.id) { const w = byId(p.worker); if (w && !w.dead && w.o.type === 'gather' && w.o.pen === p.id) { o.pen = 0; if (!retarget(u)) u.o = IDLE(); return; } }
        p.worker = u.id;
        const cx = p.x + 1, cy = p.y + 1;
        if (o.ph === 'go') { const r = approach(u, dt, () => hyp(u.x - cx, u.y - cy) < 0.7, () => moveTo(u, cx - 0.3 + rnd() * 0.6, cy - 0.3 + rnd() * 0.6)); if (r === 1) o.ph = 'work'; else if (r === -1) u.o = IDLE(); return; }
        if (hyp(u.x - cx, u.y - cy) > 1.1) { o.ph = 'go'; return; }
        u.working = true; u.carry.k = 'f';
        u.carry.n += RATE.pen * dt * gathMul(u.team, 'f');
        if (u.carry.n >= capN(u.team)) { u.carry.n = capN(u.team); o.ph = 'back'; o.drop = 0; }
        return;
      }
      if (o.ri < 0 || !S.resT[o.ri] || KIND_OF[S.resT[o.ri]] !== o.kind) { if (!retarget(u)) { if (u.carry.n > 0) { o.ph = 'back'; o.drop = 0; } else u.o = IDLE(); } return; }
      const rx = o.ri % MW, ry = (o.ri / MW) | 0;
      if (o.ph === 'go') {
        const r = approach(u, dt, () => distRect(u, rx, ry, 1, 1) < 0.8, () => moveTo(u, rx, ry, { x: rx, y: ry, w: 1, h: 1 }));
        if (r === 1) o.ph = 'work'; else if (r === -1) { o.bad = (o.bad || []).concat([o.ri]).slice(-6); if (!retarget(u)) u.o = IDLE(); }
        return;
      }
      if (distRect(u, rx, ry, 1, 1) > 1) { o.ph = 'go'; return; }
      u.working = true; u.fx = rx + 0.5 < u.x ? -1 : 1;
      if (u.carry.k !== o.kind) u.carry = { k: o.kind, n: 0 };
      let amt = RATE[o.kind] * dt * gathMul(u.team, o.kind);
      amt = Math.min(amt, S.resAmt[o.ri]); S.resAmt[o.ri] -= amt; u.carry.n += amt;
      if (S.resAmt[o.ri] <= 0.01) { S.resT[o.ri] = 0; S.resAmt[o.ri] = 0; S.miniDirty = true; }
      if (u.carry.n >= capN(u.team)) { u.carry.n = capN(u.team); o.ph = 'back'; o.drop = 0; }
    }
    function doBuild(u, dt) {
      const b = byId(u.o.bid);
      if (!b || b.dead || !friend(b.team, u.team)) { u.o = IDLE(); return; }
      const ty = BT[b.t];
      if (b.done && b.hp >= ty.hp) { afterBuild(u, b); return; }
      const r = approach(u, dt, () => distRect(u, b.x, b.y, ty.s, ty.s) < 0.85, () => ty.farm ? moveTo(u, b.x + 1, b.y + 1) : moveTo(u, 0, 0, rectOf(b)));
      if (r === -1) { u.o = IDLE(); return; }
      if (r !== 1) return;
      u.working = true; const c = cen(b); u.fx = c.x < u.x ? -1 : 1;
      if (!b.done) {
        const sp = buildMul(b.team);
        b.prog += dt / ty.time * sp; b.hp = Math.min(ty.hp, b.hp + ty.hp * 0.9 * dt / ty.time * sp);
        if (b.prog >= 1) complete(b);
      } else { b.hp = Math.min(ty.hp, b.hp + 10 * dt); if (b.hp >= ty.hp) afterBuild(u, b); }
      if (Math.random() < dt * 1.5) snd('click', u.x, u.y, 250);
    }
    function afterBuild(u, b) {
      if (b.t === 'pen' && b.team === u.team) { const w = byId(b.worker); if (!w || w.dead || w.o.type !== 'gather' || w.o.pen !== b.id) { orderGather(u, -1, b); return; } }
      if (b.t === 'stock') { const r = findRes('w', b.x + 1, b.y + 1, 7); if (r >= 0) { orderGather(u, r); return; } }
      u.o = IDLE();
    }
    function complete(b) {
      b.done = true; b.prog = 1;
      if (mineE(b)) { msg(`${nameOf(b)} built!`, '#ffe8a0'); snd('thud'); }
      S.miniDirty = true;
    }
    function updBld(b, dt) {
      if (!b.done) return;
      const ty = BT[b.t];
      if (b.cool > 0) b.cool -= dt;
      if (ty.atk && b.cool <= 0) {
        const c = cen(b), R = bRng(b) + 1.2; let best = null, bd = Infinity;
        for (const e of S.ents) { if (e.dead || e.k !== 'u' || !foe(b.team, e.team)) continue; const d = hyp(e.x - c.x, e.y - c.y); if (d < R && d < bd) { bd = d; best = e; } }
        if (best) { b.cool = ty.rate; hit(b, best); }
      }
      if (b.queue.length) {
        const it = b.queue[0], tt = qTime(it);
        if (isUnitItem(it) && popOf(b.team) >= capOf(b.team)) { if (!b.popBlock && mineE(b)) { msg('Herald: We need more Houses, my lord! Nobody has anywhere to sleep!', '#ffd860'); snd('beep'); } b.popBlock = true; return; }
        b.popBlock = false;
        b.qt += dt * (cheatOn(b.team, 'fast') ? 10 : 1);
        if (b.qt >= tt) { b.qt = 0; b.queue.shift(); finishItem(b, it); }
      }
    }
    function finishItem(b, it) {
      const p = b.team;
      if (it === 'age') {
        S.age[p] = 2;
        for (const u of S.ents) if (!u.dead && u.k === 'u' && u.team === p && SOLDIER(u.t)) u.hp += 10;
        if (p === S.me) { msg('The CASTLE AGE has begun! Riders, Catapults and better soldiers!', '#9f9'); snd('fanfare'); G.sfx('solve'); }
        else if (S.me >= 0) msg(`${pName(p)} has reached the Castle Age!`, friend(p, S.me) ? '#cfe' : '#ffb');
      } else if (it.startsWith('r:')) {
        const k = it.slice(2); S.tech[p][k] = 1;
        if (p === S.me) { msg(`${TECH[k].n} researched! ${TECH[k].d}`, '#9f9'); snd('fanfare'); }
      } else spawn(b, it);
    }
    function spawn(b, t) {
      const s = BT[b.t].s, f = freeNear(b.x, b.y, s, s); if (!f) return;
      const u = addUnit(t, b.team, f.x + 0.5, f.y + 0.5);
      S.stats[b.team].trained++;
      if (mineE(u)) snd('join', u.x, u.y, 300);
      if (b.rally) {
        const ri = idx(clamp(b.rally.x | 0, 0, MW - 1), clamp(b.rally.y | 0, 0, MH - 1)), bid = S.occ[ri];
        const rb = bid ? byId(bid) : null;
        if (t === 'grot' && S.resT[ri]) orderGather(u, ri);
        else if (t === 'grot' && rb && rb.t === 'pen' && rb.team === b.team) orderGather(u, -1, rb);
        else orderMove(u, b.rally.x, b.rally.y);
      }
    }
    function separate() {
      const us = S.ents.filter(e => e.k === 'u' && !e.dead);
      for (let i = 0; i < us.length; i++) {
        const a = us[i];
        for (let j = i + 1; j < us.length; j++) {
          const b = us[j], dx = b.x - a.x, dy = b.y - a.y;
          if (dx > 0.6 || dx < -0.6 || dy > 0.6 || dy < -0.6) continue;
          const d = hyp(dx, dy); if (d >= 0.55) continue;
          const push = (0.55 - d) * 0.25, nx = d > 0.001 ? dx / d : rnd() - 0.5, ny = d > 0.001 ? dy / d : rnd() - 0.5;
          const wa = a.working ? 0.2 : 1, wb = b.working ? 0.2 : 1;
          // and a little sidestep, so two people walking nose to nose slide past each other instead of shoving for ever
          const side = a.moving && b.moving ? 0.7 : a.moving || b.moving ? 0.35 : 0, px = -ny * side, py = nx * side;
          nudge(a, (-nx - px) * push * wa, (-ny - py) * push * wa); nudge(b, (nx + px) * push * wb, (ny + py) * push * wb);
        }
      }
    }
    function nudge(u, dx, dy) { const nx = u.x + dx, ny = u.y + dy; if (!blockedXY(nx | 0, ny | 0)) { u.x = nx; u.y = ny; } }
    // what the local player can see (the local screen only: never used by the simulation)
    function updVis() {
      S.vis.fill(0);
      if (S.cheats.reveal || S.me < 0 || S.over) { S.vis.fill(1); if (!S.expAll) { S.exp.fill(1); S.expAll = 1; S.miniDirty = true; } return; }
      for (const e of S.ents) {
        if (e.dead || !friend(e.team, S.me)) continue;
        const c = cen(e), r = e.k === 'u' ? uSight(e) : BT[e.t].sight + (e.done ? 0 : -1), cx = c.x, cy = c.y;
        for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(MH - 1, Math.floor(cy + r)); y++)
          for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(MW - 1, Math.floor(cx + r)); x++)
            if ((x + 0.5 - cx) * (x + 0.5 - cx) + (y + 0.5 - cy) * (y + 0.5 - cy) <= r * r + r) { const i = y * MW + x; S.vis[i] = 1; if (!S.exp[i]) { S.exp[i] = 1; S.miniDirty = true; } }
      }
    }
    // a player with no Town Centre left is out: their people pack up and go home
    function defeat(p, why) {
      const P = S.pl[p]; if (P.out) return; P.out = true; P.why = why;
      for (const e of S.ents) if (!e.dead && e.team === p) kill(e, null, true);
      if (p === S.me) msg(why === 'rsg' ? 'You resigned.' : 'You have been defeated! Your last Town Centre has fallen.', '#ff8a6a');
      else if (S.me >= 0 || S.online) msg(`${P.name} ${why === 'rsg' ? 'has resigned' : why === 'gone' ? 'has left the game' : 'has been defeated'}!`, S.me >= 0 && friend(p, S.me) ? '#ff8a6a' : '#9f9');
    }
    function checkEnd() {
      if (S.over) return;
      for (let p = 0; p < S.np; p++) if (!S.pl[p].out && !S.ents.some(e => !e.dead && e.team === p && e.t === 'bighut')) defeat(p, 'tc');
      const sc = S.scen && SCEN_BY[S.scen.id];
      if (sc && sc.check) { const r = sc.check(); if (r != null) { endGame(r); return; } }
      const sides = []; for (let p = 0; p < S.np; p++) if (!S.pl[p].out && !sides.includes(S.pl[p].ally)) sides.push(S.pl[p].ally);
      if (sides.length <= 1) endGame(sides.length ? sides[0] : -99);
    }

    // ================================================================ the computer players
    function aiTick(p) {
      const a = S.ai[p], R = S.res[p], lvl = S.pl[p].ai, cfg = DIFF[lvl], sc = a.cfg || {};
      R.f += cfg.trickle; R.w += cfg.trickle; R.t += cfg.trickle * 0.6;
      const mine = teamEnts(p), units = mine.filter(e => e.k === 'u'), blds = mine.filter(e => e.k === 'b');
      const hut = blds.find(b => b.t === 'bighut' && b.done) || blds.find(b => b.t === 'bighut'); if (!hut) return;
      const grots = units.filter(u => u.t === 'grot'), army = units.filter(u => u.t !== 'grot');
      const has = t => blds.filter(b => b.t === t), cap = capOf(p), pop = units.length;
      const hc = cen(hut), sx = hc.x < MW / 2 ? 1 : -1, sy = hc.y < MH / 2 ? 1 : -1;
      // villagers
      if (grots.length < (sc.grots || cfg.grots) && hut.done && !hut.queue.length && afford(p, UT.grot.cost) && pop < cap) { pay(p, UT.grot.cost); hut.queue.push('grot'); }
      if (!hut.rally) hut.rally = { x: hc.x + sx * 3, y: hc.y + sy * 3 };
      const cnt = { f: 0, w: 0, t: 0 };
      for (const g of grots) if (g.o.type === 'gather') cnt[g.o.kind]++;
      const want = S.age[p] === 1 ? { f: 0.42, w: 0.33, t: 0.25 } : { f: 0.37, w: 0.26, t: 0.37 };
      if (sc.rupees) { want.f = 0.3; want.w = 0.2; want.t = 0.5; }
      for (const g of grots) {
        if (g.o.type !== 'idle') continue;
        const ks = ['f', 'w', 't'].sort((x, y) => (cnt[x] - want[x] * grots.length) - (cnt[y] - want[y] * grots.length));
        for (const k of ks) {
          if (k === 'f') { const pn = freePen(p, hc.x, hc.y); if (pn) { orderGather(g, -1, pn); cnt.f++; break; } }
          const r = findRes(k, hc.x, hc.y, k === 'w' ? 16 : 14);
          if (r >= 0) { orderGather(g, r); cnt[k]++; break; }
        }
      }
      // building one thing at a time
      const building = blds.find(b => !b.done);
      if (building) {
        // a building nobody can get to (or that never gets going): knock it down, get the money back, try somewhere else
        if (!a.bw || a.bw[0] !== building.id || a.bw[1] !== building.prog) a.bw = [building.id, building.prog, 0]; else a.bw[2]++;
        if (a.bw[2] > 40) { a.bw = null; pay(p, BT[building.t].cost, -1); kill(building, null, true); return; }
        const bs = grots.filter(g => g.o.type === 'build' && g.o.bid === building.id);
        if (!bs.length && grots.length) { const g = grots.reduce((m, x) => hyp(x.x - building.x, x.y - building.y) < hyp(m.x - building.x, m.y - building.y) ? x : m); orderBuild(g, building); }
      } else if (grots.length >= 3 && !sc.noBuild) {
        let want2 = null;
        const nearBush = findRes('f', hc.x, hc.y, 10) >= 0;
        if (cap - pop <= 2 && cap < 75) want2 = 'hut';
        else if (!has('barrakks').length && grots.length >= 6) want2 = 'barrakks';
        else if (!has('stock').length && grots.length >= 7) want2 = 'stock';
        else if ((!nearBush || S.time > 300) && has('pen').length < Math.min(6, Math.ceil(grots.length / 3))) want2 = 'pen';
        else if (lvl >= 1 && !has('smithy').length && has('barrakks').some(b => b.done) && S.time > 260) want2 = 'smithy';
        else if (has('tower').length < (sc.towers != null ? sc.towers : cfg.towers) && S.time > 300) want2 = 'tower';
        else if (S.age[p] === 2 && lvl > 0 && !has('mekshop').length) want2 = 'mekshop';
        else if (lvl >= 1 && has('barrakks').length < 2 && (S.time > 420 && lvl === 2 || R.w > 450)) want2 = 'barrakks';
        if (want2 && afford(p, BT[want2].cost)) {
          const site = aiSite(want2, hut);
          if (site) { pay(p, BT[want2].cost); const b = addBld(want2, p, site.x, site.y, false); const g = grots.find(x => x.o.type === 'gather' && x.o.kind === 'w') || grots[0]; orderBuild(g, b); }
        }
      }
      // age up
      const ageAt = sc.age != null ? sc.age : cfg.age;
      if (S.age[p] === 1 && S.time > ageAt && has('barrakks').some(b => b.done) && !hut.queue.includes('age') && afford(p, AGE.cost)) { pay(p, AGE.cost); hut.queue.push('age'); }
      // technologies (Normal and Hard)
      const done = Object.keys(S.tech[p]).length;
      if (done < cfg.techs && S.time > 200) {
        for (const k of ['barrow', 'swords', 'bows', 'mail']) {
          if (S.tech[p][k] || queuedAnywhere(p, 'r:' + k) || (TECH[k].age && S.age[p] < TECH[k].age)) continue;
          if (k === 'barrow' && grots.length < 8) continue;
          const at = blds.find(b => b.done && !b.queue.length && BT[b.t].techs && BT[b.t].techs.includes(k));
          if (at && afford(p, TECH[k].cost) && R.f > (TECH[k].cost.f || 0) + 100) { pay(p, TECH[k].cost); at.queue.push('r:' + k); }
          break;
        }
      }
      // army: Normal and Hard look at what you've got and train the answer
      const theirs = { rider: 0, shoota: 0, spear: 0, boy: 0, kannon: 0 };
      if (lvl >= 1) for (const e of S.ents) if (!e.dead && e.k === 'u' && foe(p, e.team) && theirs[e.t] != null) theirs[e.t]++;
      for (const b of blds) {
        if (!b.done || b.queue.length || !BT[b.t].trains || b.t === 'bighut') continue;
        if (army.length >= (sc.army || cfg.army) + a.wave * 2) break;
        if (S.age[p] === 1 && S.time > ageAt && !hut.queue.includes('age') && army.length >= 4) break; // saving up for the Castle Age
        let t;
        if (b.t === 'mekshop') t = 'kannon';
        else {
          const r = rnd(), c2 = S.age[p] === 2;
          if (lvl >= 1 && theirs.rider >= 3 && r < 0.5) t = 'spear';
          else if (lvl >= 1 && theirs.shoota >= 4 && r < 0.6) t = c2 ? 'rider' : 'boy';
          else if (lvl >= 1 && theirs.spear >= 4 && r < 0.5) t = 'shoota';
          else t = c2 && r < 0.3 ? 'rider' : r < 0.55 ? 'boy' : r < 0.7 ? 'spear' : 'shoota';
        }
        if (afford(p, UT[t].cost) && pop < cap) { pay(p, UT[t].cost); b.queue.push(t); b.rally = { x: hc.x + sx * (4 + rnd() * 2), y: hc.y + sy * (4 + rnd() * 2) }; }
      }
      // defend the base
      let intruder = null;
      for (const e of S.ents) if (!e.dead && e.k === 'u' && foe(p, e.team) && hyp(e.x - hc.x, e.y - hc.y) < 10) { intruder = e; break; }
      if (intruder) for (const u of army) if (u.o.type === 'idle' || u.o.type === 'move') orderAttack(u, intruder);
      // attack waves
      if (S.time >= a.waveAt && !(a.peace && S.time < a.peace)) {
        const ready = army.filter(u => u.o.type === 'idle' || u.o.type === 'move').slice(0, a.waveN + 2 + lvl * 2);
        if (ready.length >= a.waveN) {
          let tgt = null, bd = Infinity;
          for (const e of S.ents) if (!e.dead && e.t === 'bighut' && foe(p, e.team)) { const d = hyp(cen(e).x - hc.x, cen(e).y - hc.y) + (e.team === a.grudge ? -12 : 0); if (d < bd) { bd = d; tgt = e; } }
          if (!tgt) for (const e of S.ents) if (!e.dead && foe(p, e.team)) { tgt = e; break; }
          if (tgt) {
            const c = cen(tgt);
            ready.forEach((u, i) => orderMove(u, c.x + (i % 3) - 1, c.y + ((i / 3) | 0) % 3 - 1, true));
            a.wave++; a.waveN = Math.min(cfg.waveMax, a.waveN + (lvl + 1)); a.waveAt = S.time + cfg.every;
            if (tgt.team === S.me) {
              const F = S.pl[p].foe;
              if (F && (a.wave === 1 || Math.random() < 0.6)) msg(F.taunts[(a.wave - 1) % F.taunts.length], COLS[colOf(p)].l);
              if (a.wave === 1) G.timer(() => { if (S && !S.over) { msg(`Herald: ${pName(p)}'s soldiers are coming, my lord! Get the army ready!`, '#ffd860'); snd('horn'); } }, 9000);
            }
          }
        }
      }
    }
    function aiSite(t, hut) {
      const s = BT[t].s; let cx = hut.x + 1, cy = hut.y + 1;
      const sx = cx < MW / 2 ? 1 : -1, sy = cy < MH / 2 ? 1 : -1;
      if (t === 'stock') { const r = findRes('w', cx, cy, 16); if (r >= 0) { cx = r % MW; cy = (r / MW) | 0; } }
      if (t === 'tower') { cx += sx * 4; cy += sy * 4; }
      const reach = flood(hut);
      const reachable2 = (x, y) => { for (let yy = y - 1; yy <= y + s; yy++) for (let xx = x - 1; xx <= x + s; xx++) if (xx >= 0 && yy >= 0 && xx < MW && yy < MH && (xx < x || xx >= x + s || yy < y || yy >= y + s) && reach[idx(xx, yy)]) return true; return false; };
      for (let r = 2; r < 12; r++) {
        const ring = []; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (Math.max(Math.abs(x), Math.abs(y)) === r) ring.push(x, y);
        const n = ring.length / 2, off = (r * 7 + S.step) % n;
        for (let k = 0; k < n; k++) {
          const j = ((k + off) % n) * 2, x = cx + ring[j] - (s >> 1), y = cy + ring[j + 1] - (s >> 1);
          if (!canPlace(t, x, y)) continue;
          let ok = true; // keep a one-tile gap so nothing gets walled in
          for (let yy = y - 1; yy <= y + s && ok; yy++) for (let xx = x - 1; xx <= x + s; xx++) if (xx >= 0 && yy >= 0 && xx < MW && yy < MH && S.occ[idx(xx, yy)]) { ok = false; break; }
          if (ok && reachable2(x, y)) return { x, y };
        }
      }
      return null;
    }
    // every tile you can walk to from around a building
    function flood(b) {
      const seen = new Uint8Array(N), q = [], s = BT[b.t].s;
      for (let y = b.y - 1; y <= b.y + s; y++) for (let x = b.x - 1; x <= b.x + s; x++) if (!blockedXY(x, y)) { const i = idx(x, y); if (!seen[i]) { seen[i] = 1; q.push(i); } }
      while (q.length) { const i = q.pop(), x = i % MW, y = (i / MW) | 0; for (let d = 0; d < 4; d++) { const nx = x + DX[d], ny = y + DY[d]; if (blockedXY(nx, ny)) continue; const j = idx(nx, ny); if (!seen[j]) { seen[j] = 1; q.push(j); } } }
      return seen;
    }

    // ================================================================ new game / snapshots / save / load
    // cfg: { mi, seed, pl: [{ name, col, ally, civ, ai (-1 = a person), id (visitor id online), fi (personality, -1 none) }], me, scen, online }
    const aiInit = lvl => ({ wave: 0, waveN: DIFF[lvl].waveN, waveAt: DIFF[lvl].wave1, cfg: null, peace: 0, grudge: -1 });
    function makeState(cfg, m) {
      const np = cfg.pl.length;
      const pl = cfg.pl.map((p, i) => ({ name: nclean(p.name, 20) || 'Player ' + (i + 1), col: clamp(p.col | 0, 0, COLS.length - 1), ally: p.ally | 0, civ: clamp(p.civ | 0, 0, CIVS.length - 1), ai: p.ai >= 0 && p.ai <= 2 ? p.ai | 0 : -1, id: p.id | 0, fi: p.fi != null ? p.fi : -1, out: !!p.out, corner: p.corner | 0, was: p.was | 0, why: typeof p.why === 'string' ? p.why.slice(0, 4) : '' }));
      pl.forEach(P => { P.foe = P.fi >= 0 ? FOES[P.fi] : null; });
      const S2 = {
        v: 2, mi: cfg.mi, seed: cfg.seed >>> 0, np, pl, me: cfg.me, online: !!cfg.online, terr: m.terr, resT: m.resT, resAmt: m.resAmt,
        occ: new Int32Array(N), blk: new Uint8Array(N), vis: new Uint8Array(N), exp: new Uint8Array(N), ents: [], map: new Map(), nextId: 1,
        res: pl.map(() => ({ f: 200, w: 200, t: 100 })), age: pl.map(() => 1), tech: pl.map(() => ({})), stats: pl.map(() => ({ kills: 0, lost: 0, trained: 0, gath: { f: 0, w: 0, t: 0 } })),
        time: 0, step: 0, tA: 0, t1: 1, rs: ((cfg.seed >>> 0) ^ 0x5bd1e995) | 0, ai: pl.map(P => (P.ai >= 0 ? aiInit(P.ai) : null)), cheats: {}, over: false, winner: null,
        scen: cfg.scen ? { id: cfg.scen } : null, proj: [], fx: [], decals: [], miniDirty: true, anyDead: false, paused: false,
      };
      S2.bg = paintTerrain(m.terr, cfg.mi, cfg.seed);
      return S2;
    }
    // where everybody starts: allies side by side
    function corners(pl) {
      const n = pl.length, teams = pl.some((p, i) => pl.some((q, j) => j !== i && q.ally === p.ally));
      if (n === 2) return [0, 2];
      if (!teams) return n === 3 ? [0, 2, 1] : [0, 2, 1, 3];
      const groups = []; pl.forEach((p, i) => { let g = groups.find(x => x.a === p.ally); if (!g) groups.push(g = { a: p.ally, m: [] }); g.m.push(i); });
      const out = []; let k = 0; for (const g of groups) for (const i of g.m) out[i] = k++;
      return out;
    }
    function newGame(cfg) {
      cfg = Object.assign({ mi: 0, seed: (Math.random() * 4294967295) >>> 0, me: 0 }, cfg);
      const m = genMap(cfg.mi, cfg.seed);
      S = makeState(cfg, m);
      const cs = corners(cfg.pl);
      S.pl.forEach((P, p) => {
        const k = cs[p]; P.corner = k;
        const r = rotR(5, 39, 3, k); addBld('bighut', p, r.x, r.y, true);
        [[4.5, 43.5], [8.5, 43.5], [9.5, 41.5]].forEach(([x, y]) => { const q = rotP(x, y, k); addUnit('grot', p, q.x, q.y); });
        const q = rotP(9.5, 37.5, k); addUnit('boy', p, q.x, q.y);
        const b = P.ai >= 0 ? P.ai : 0;
        S.res[p] = { f: 200 + b * 100, w: 200 + b * 100, t: 100 + b * 50 };
      });
      const sc = cfg.scen && SCEN_BY[cfg.scen];
      if (sc && sc.init) sc.init();
      startPlay();
      if (S.me >= 0) { const tc = S.ents.find(e => e.team === S.me && e.t === 'bighut'); if (tc) centerOn(tc.x + 1.5, tc.y + 1.5); } else centerOn(MW / 2, MH / 2);
      if (!S.online && !sc) {
        msg('Herald: My lord! Our enemies are out there somewhere. Gather, build, then flatten their Town Centres!', '#ffd860');
        S.pl.forEach((P, p) => { if (P.foe && meFoe(p)) G.timer(() => { if (S && !S.over) msg(P.foe.hi, COLS[P.col].l); }, 4000 + p * 1500); });
        if (G.demo) G.timer(() => { if (S && !S.over) msg('DEMO VERSION: you have 15 minutes. Make them count!', '#ff8'); }, 2000);
      }
    }
    // run-length strings for the map in snapshots
    const rle = s => { let out = '', i = 0; while (i < s.length) { const ch = s[i]; let n = 1; while (i + n < s.length && s[i + n] === ch && n < 1295) n++; out += ch + n.toString(36).padStart(2, '0'); i += n; } return out; };
    const unrle = s => { let out = ''; for (let i = 0; i + 2 < s.length; i += 3) out += s[i].repeat(parseInt(s.slice(i + 1, i + 3), 36) || 0); return out; };
    // the whole simulation, exactly (online catch-ups, reloads and saves). Plain JSON numbers round-trip exactly.
    function snapshot() {
      const amt = []; for (let i = 0; i < N; i++) if (S.resT[i]) amt.push(S.resAmt[i]);
      const d = { v: 2, mi: S.mi, seed: S.seed, np: S.np, pl: S.pl.map(P => ({ name: P.name, col: P.col, ally: P.ally, civ: P.civ, ai: P.ai, id: P.id, fi: P.fi, out: P.out, corner: P.corner, was: P.was, why: P.why || '' })),
        terr: rle(Array.from(S.terr).join('')), resT: rle(Array.from(S.resT).join('')), amt, nextId: S.nextId, res: S.res, age: S.age, tech: S.tech, stats: S.stats,
        time: S.time, step: S.step, tA: S.tA, t1: S.t1, rs: S.rs, ai: S.ai, cheats: S.cheats, over: S.over, winner: S.winner, scen: S.scen,
        ents: S.ents.filter(e => !e.dead).map(e => e.k === 'u' ? [0, e.id, e.t, e.team, e.x, e.y, e.hp, e.o, e.path, e.pi, e.dest, e.goal, e.cool, e.stk, e.rp, e.rep, e.carry.k, e.carry.n, e.cl || 0]
          : [1, e.id, e.t, e.team, e.x, e.y, e.hp, e.done ? 1 : 0, e.prog, e.queue, e.qt, e.rally, e.cool, e.worker, e.popBlock ? 1 : 0]) };
      return JSON.parse(JSON.stringify(d));
    }
    function restore(d, me, online) {
      if (!d || d.v !== 2 || !Array.isArray(d.pl) || d.pl.length < 2 || d.pl.length > 4 || !MAPS[d.mi] || !Array.isArray(d.ents)) throw new Error('bad snapshot');
      const terr = unrle(d.terr), resT = unrle(d.resT); if (terr.length !== N || resT.length !== N) throw new Error('bad map');
      const m = { terr: Uint8Array.from(terr, ch => +ch), resT: Uint8Array.from(resT, ch => +ch), resAmt: new Float32Array(N) };
      let j = 0; for (let i = 0; i < N; i++) if (m.resT[i]) m.resAmt[i] = +d.amt[j++] || 0;
      const np = d.pl.length, okA = (a, f) => Array.isArray(a) && a.length === np ? a.map(f) : null;
      const nS = makeState({ mi: d.mi, seed: d.seed, pl: d.pl, me: me == null ? 0 : me, online }, m);
      S = nS;
      S.nextId = d.nextId | 0; S.time = +d.time || 0; S.step = d.step | 0; S.tA = +d.tA || 0; S.t1 = +d.t1 || 0; S.rs = d.rs | 0;
      S.res = okA(d.res, r => ({ f: +r.f || 0, w: +r.w || 0, t: +r.t || 0 })) || S.res;
      S.age = okA(d.age, a => (a === 2 ? 2 : 1)) || S.age;
      S.tech = okA(d.tech, t => { const o = {}; if (t) for (const k of Object.keys(TECH)) if (t[k]) o[k] = 1; return o; }) || S.tech;
      S.stats = okA(d.stats, s => ({ kills: s.kills | 0, lost: s.lost | 0, trained: s.trained | 0, gath: { f: +s.gath.f || 0, w: +s.gath.w || 0, t: +s.gath.t || 0 } })) || S.stats;
      S.ai = okA(d.ai, a => (a && typeof a === 'object' ? a : null)) || S.ai;
      S.pl.forEach((P, p) => { if (P.ai >= 0 && !S.ai[p]) S.ai[p] = aiInit(P.ai); });
      S.cheats = d.cheats && typeof d.cheats === 'object' ? d.cheats : {}; S.over = !!d.over; S.winner = d.winner == null ? null : d.winner; S.scen = d.scen || null;
      for (const r of d.ents) {
        if (!Array.isArray(r)) continue;
        if (r[0] === 0) {
          if (!UT[r[2]] || !S.pl[r[3]]) continue;
          const u = { k: 'u', id: r[1], t: r[2], team: r[3], x: +r[4], y: +r[5], hp: +r[6], o: r[7] && r[7].type ? r[7] : IDLE(), path: Array.isArray(r[8]) ? r[8] : null, pi: r[9] | 0, dest: r[10] || null, goal: r[11] || null, cool: +r[12] || 0, stk: r[13] | 0, rp: r[14] | 0, rep: +r[15] || 0, carry: { k: r[16] || 'f', n: +r[17] || 0 }, cl: +r[18] || 0, hitT: 0, fx: r[4] < MW / 2 ? 1 : -1, bub: null, fl: 0 };
          S.ents.push(u); S.map.set(u.id, u);
        } else {
          if (!BT[r[2]] || !S.pl[r[3]]) continue;
          const b = { k: 'b', id: r[1], t: r[2], team: r[3], x: r[4] | 0, y: r[5] | 0, hp: +r[6], done: !!r[7], prog: +r[8] || 0, queue: Array.isArray(r[9]) ? r[9].filter(q => typeof q === 'string' && (UT[q] || q === 'age' || (q.startsWith('r:') && TECH[q.slice(2)]))) : [], qt: +r[10] || 0, rally: r[11] || null, cool: +r[12] || 0, worker: r[13] | 0, popBlock: !!r[14], fl: 0 };
          S.ents.push(b); S.map.set(b.id, b); occupy(b, 1, false);
        }
      }
      return S;
    }
    // a fingerprint of the simulation (online: everybody's should match the host's)
    function hashState() {
      let h = (0x811c9dc5 ^ S.step) | 0;
      const mix = v => { h = Math.imul(h ^ (v | 0), 16777619); };
      for (const e of S.ents) { if (e.dead) continue; mix(e.id); mix(Math.round(e.x * 256)); mix(Math.round(e.y * 256)); mix(Math.round(e.hp * 16)); mix(e.k === 'u' ? e.o.type.length : e.queue.length); }
      for (const r of S.res) { mix(Math.floor(r.f)); mix(Math.floor(r.w)); mix(Math.floor(r.t)); }
      mix(S.rs); mix(S.nextId);
      return h >>> 0;
    }
    // an old (version 1, two players) saved game
    function loadV1(d) {
      const diff = clamp(d.diff | 0, 0, 2);
      const m = { terr: Uint8Array.from(d.terr, ch => +ch), resT: Uint8Array.from(d.resT, ch => +ch), resAmt: Float32Array.from(d.resAmt) };
      S = makeState({ mi: d.mi, seed: 1, pl: [{ name: playerName(), col: 0, ally: 1, civ: 0, ai: -1 }, { name: FOES[diff].n, col: 1, ally: 2, civ: 1, ai: diff, fi: diff }], me: 0 }, m);
      for (let i = 0; i < N; i++) S.exp[i] = d.exp.charCodeAt(i) === 49 ? 1 : 0;
      S.time = d.time; S.res = d.res; S.age = d.age; S.stats = d.stats; S.ai[1] = Object.assign(aiInit(diff), d.ai || {}); S.cheats = d.cheats || {};
      for (const e of d.ents) {
        if (e.k === 'u') { if (!UT[e.t]) continue; const u = addUnit(e.t, e.team, e.x, e.y); S.map.delete(u.id); u.id = e.id; S.map.set(u.id, u); u.hp = e.hp; u.carry = { k: e.c[0], n: e.c[1] }; u.o = e.o; if (u.o.type === 'amove') moveTo(u, u.o.x, u.o.y); }
        else { if (!BT[e.t]) continue; const b = addBld(e.t, e.team, e.x, e.y, e.done); S.map.delete(b.id); b.id = e.id; S.map.set(b.id, b); occupy(b, 1, false); b.hp = e.hp; b.prog = e.prog; b.queue = e.q || []; b.qt = e.qt || 0; b.rally = e.r; b.worker = e.w || 0; }
      }
      S.nextId = d.nextId;
      startPlay();
      U.cam.x = d.cam[0] * Z(); U.cam.y = d.cam[1] * Z(); clampCam();
    }
    // a whole saved game (slots and the carry-on autosave)
    function saveData() { return { v: 2, snap: snapshot(), exp: rle(Array.from(S.exp).join('')), cam: [Math.round(U.cam.x / Z()), Math.round(U.cam.y / Z())], tut: S.tut || null, groups: U.groups }; }
    function loadData(d) {
      if (d && d.v === 2 && d.snap) {
        restore(d.snap, 0, false);
        const ex = unrle(d.exp || ''); if (ex.length === N) for (let i = 0; i < N; i++) S.exp[i] = ex.charCodeAt(i) === 49 ? 1 : 0;
        S.tut = d.tut && typeof d.tut === 'object' ? d.tut : null;
        startPlay();
        U.groups = d.groups && typeof d.groups === 'object' ? d.groups : {};
        if (Array.isArray(d.cam)) { U.cam.x = d.cam[0] * Z(); U.cam.y = d.cam[1] * Z(); clampCam(); }
      } else if (d && d.terr && d.ents) loadV1(d);
      else throw new Error('not a saved game');
      msg('Game loaded. Herald: Where were we? Ah yes. Winning.', '#ffe8a0');
    }
    function saveSlot(n) {
      const sc = S.scen && SCEN_BY[S.scen.id], foes = S.pl.filter((P, p) => meFoe(p)).map(P => P.name).join(', ');
      const name = `${sc ? sc.n : MAPS[S.mi].n} - ${fmtT(S.time)} - ${AGEN[S.age[S.me]]} vs ${foes}`;
      const t = (window.Desk && Desk.today99) ? Desk.today99() : { d: 1, m: 1 };
      G.save('slot' + n, { name, when: String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99 ' + new Date().toTimeString().slice(0, 5), d: saveData() });
      msg('Game saved in slot ' + n + '.', '#ffe8a0'); G.sfx('button');
    }

    // ================================================================ the campaign: the Learning Campaign and four scenarios
    const you = (col, ally, civ) => ({ name: playerName(), col: col || 0, ally: ally || 1, civ: civ || 0, ai: -1 });
    const cpu = (name, lvl, col, ally, civ, fi) => ({ name, col, ally, civ: civ || 0, ai: lvl, fi: fi == null ? -1 : fi });
    const findTC = p => S.ents.find(e => !e.dead && e.team === p && e.t === 'bighut');
    const SCEN = [
      { id: 'learn', n: 'The Learning Campaign', d: 'New to Age of Jackpires? Sir Reginald, the Royal Advisor, shows you how to gather, build, train, advance an Age, defend your town and attack. About 15 minutes.', mi: 0,
        pl: () => [you(0, 1, 0), cpu('The Blue Knights', 0, 1, 2, 1)],
        init() { const a = S.ai[1]; a.peace = 1e9; a.cfg = { grots: 5, army: 2, age: 1e9, towers: 0 }; S.res[1] = { f: 100, w: 100, t: 40 }; const tc = findTC(1); if (tc) tc.hp = 700; S.tut = { i: 0, t0: 0 }; },
        win: 'The Blue Knights\' Town Centre lies in ruins. Sir Reginald: "Splendid, my lord! You\'re a natural. Now try a real game. Dave is waiting."', lose: 'Sir Reginald: "Oh dear. Even the best kings lose sometimes. Shall we try that again?"' },
      { id: 'push', n: 'Dave\'s Big Push', d: 'Dave has been practising (on the ULTRA 64, mostly). His soldiers come early and keep coming. Hold out for 12 minutes, or flatten his Town Centre first.', mi: 1,
        pl: () => [you(0, 1, 0), cpu('Dave', 0, 1, 2, 2, 0)],
        init() { const a = S.ai[1]; a.waveAt = 150; a.cfg = { army: 12 }; S.res[1].f += 200; S.res[0].w += 150; },
        check() { if (S.time >= 720 && !S.pl[0].out) return S.pl[0].ally; return null; },
        obj: () => [`Survive: ${fmtT(720 - S.time)} to go`, 'Or flatten Dave\'s Town Centre'],
        win: 'Dave: "my soldiers got lost. it\'s because the map was muddy." You held the line!', lose: 'Dave: "haha I WON?? I never win anything! Wait till I tell Luke."' },
      { id: 'rush', n: 'The Rupee Rush', d: 'JackK bet you his best marble that you can\'t stockpile 1,500 Rupees before he does. Rupee Hills is full of mines. First to 1,500 wins!', mi: 2,
        pl: () => [you(0, 1, 2), cpu('JackK', 1, 3, 2, 0, 1)],
        init() { const a = S.ai[1]; a.peace = 600; a.cfg = { rupees: 1 }; },
        check() { for (let p = 0; p < S.np; p++) if (!S.pl[p].out && S.res[p].t >= 1500) return S.pl[p].ally; return null; },
        obj: () => [`Your Rupees: ${Math.floor(S.res[0].t)} / 1500`, `JackK: ${Math.floor(S.res[1].t)} / 1500`, 'JackK attacks after 10 minutes'],
        win: 'JackK: "fine. FINE. Have the marble. It\'s got a chip in it anyway."', lose: 'JackK: "1,500 Rupees! The better Jack wins. Obviously. I\'ll take that marble, thanks."' },
      { id: 'two', n: 'Two Against Callum', d: 'You and Dave against Callum and his big brother. Callum is Hard. Dave is... Dave. Keep him alive and flatten both enemy towns.', mi: 0,
        pl: () => [you(0, 1, 0), cpu('Dave', 0, 3, 1, 2, 0), cpu('Callum', 2, 1, 2, 1, 2), cpu('Callum\'s Big Brother', 1, 4, 2, 3)],
        init() { S.ai[2].waveAt = 420; S.ai[3].waveAt = 380; S.ai[1].cfg = { army: 12 }; },
        win: 'Callum: "...my mouse was lagging. And my brother was rubbish." Dave: "WE WON! high five!"', lose: 'Callum: "gg. Told you. Two of us, two of you, and one of you was Dave."' },
      { id: 'siege', n: 'Callum\'s Keep', d: 'Callum has built Watchtowers everywhere and says his town can\'t be beaten. You start in the Castle Age with a Workshop and a few Catapults. Prove him wrong.', mi: 3,
        pl: () => [you(0, 1, 1), cpu('Callum', 2, 1, 2, 3, 2)],
        init() {
          S.age[0] = 2; S.res[0] = { f: 600, w: 700, t: 500 };
          const tc = findTC(0), ctc = findTC(1);
          const ws = aiSite('mekshop', tc); if (ws) addBld('mekshop', 0, ws.x, ws.y, true);
          const sm = aiSite('smithy', tc); if (sm) addBld('smithy', 0, sm.x, sm.y, true);
          for (let i = 0; i < 2; i++) { const h = aiSite('hut', tc); if (h) addBld('hut', 0, h.x, h.y, true); }
          ['kannon', 'kannon', 'boy', 'boy', 'spear', 'spear'].forEach(t => { const f = freeNear(tc.x, tc.y, 3, 3); if (f) addUnit(t, 0, f.x + 0.5, f.y + 0.5); });
          for (let i = 0; i < 4; i++) { const r = aiSite('tower', ctc); if (r) addBld('tower', 1, r.x, r.y, true); }
          S.age[1] = 2; S.ai[1].peace = 360; S.ai[1].cfg = { towers: 6 }; S.res[1] = { f: 500, w: 500, t: 300 };
        },
        win: 'Callum\'s Keep is rubble. Callum: "...I was letting you win. To be nice." Nobody believes him.', lose: 'Callum: "Told you it couldn\'t be beaten. Want the disc back now. GIVE IT BACK."' },
    ];
    const SCEN_BY = {}; SCEN.forEach((s, i) => { s.i = i; SCEN_BY[s.id] = s; });
    function scenTick() {
      const sc = S.scen && SCEN_BY[S.scen.id]; if (!sc || !sc.tick) return; sc.tick();
    }
    const scenOpen = i => i === 0 || !!SEEN.camp[SCEN[i - 1].id] || (i === 1 && SEEN.tut);
    function startScen(i) {
      const sc = SCEN[i]; if (!sc) return;
      newGame({ mi: sc.mi, pl: sc.pl(), me: 0, scen: sc.id });
      if (!sc.tut) G.timer(() => { if (S && !S.over) advisor(sc.n, sc.d + (sc.obj ? '' : ' (Your objectives are in the top-right corner.)'), { auto: 14000 }); }, 600);
    }

    // ---- Sir Reginald, the Royal Advisor (the Learning Campaign, and the odd tip)
    const REG = () => SPR.reg || (SPR.reg = mk(20, 24, c => {
      P(c, '#5a3a1a', 0, 0, 20, 24); P(c, '#2a5ae0', 3, 16, 14, 8); P(c, '#ffd400', 9, 17, 2, 7);
      P(c, '#f0b088', 6, 6, 8, 9); P(c, '#e8e8e8', 4, 4, 12, 3); P(c, '#e8e8e8', 4, 6, 2, 6); P(c, '#e8e8e8', 14, 6, 2, 6);
      P(c, '#000', 8, 9); P(c, '#000', 11, 9); P(c, '#e8e8e8', 7, 12, 6, 4); P(c, '#b87048', 9, 11, 2, 1);
      P(c, '#a01a10', 5, 1, 10, 3); P(c, '#ffd400', 5, 0, 2, 2); P(c, '#ffd400', 9, 0, 2, 2); P(c, '#ffd400', 13, 0, 2, 2);
    }));
    function advisor(title, text, o) {
      o = o || {};
      if (!advEl) { advEl = el('div', 'dg-rts-adv'); view.appendChild(advEl); }
      view.classList.add('adv');
      advEl.className = 'dg-rts-adv';
      advEl.innerHTML = '<div><b></b><p style="margin:2px 0 0"></p><div class="x"></div></div>';
      const pc = mk(20, 24, c => c.drawImage(REG(), 0, 0)); advEl.insertBefore(pc, advEl.firstChild);
      advEl.querySelector('b').textContent = title; advEl.querySelector('p').textContent = text;
      const x = advEl.querySelector('.x');
      (o.btns || [['OK', advClose]]).forEach(([l, fn]) => { const b = el('button', '', esc(l)); b.type = 'button'; b.addEventListener('click', ev => { ev.stopPropagation(); G.sfx('click'); fn(); }); x.appendChild(b); });
      if (o.auto) { const me = advEl; G.timer(() => { if (advEl === me && !(S && S.tut)) advClose(); }, o.auto); }
      return advEl;
    }
    // the Learning Campaign: ten steps, checked twice a second
    const own = (t, k) => S.ents.filter(e => !e.dead && e.team === 0 && (!t || e.t === t) && (!k || e.k === k));
    const gathering = k => own('grot').some(g => g.o.type === 'gather' && g.o.kind === k);
    const nearestRes = k => { const tc = findTC(0); if (!tc) return null; const r = findRes(k, tc.x + 1.5, tc.y + 1.5, 30); return r >= 0 ? { x: (r % MW) + 0.5, y: ((r / MW) | 0) + 0.5 } : null; };
    const topUp = (f, w, t) => { const R = S.res[0]; R.f = Math.max(R.f, f); R.w = Math.max(R.w, w); R.t = Math.max(R.t, t); };
    const ctl = () => G.touch ? 'click' : 'right-click';
    const TUT = [
      { t: () => 'Welcome, my lord! I am Sir Reginald, your Royal Advisor. Let\'s build you a kingdom. First, click one of your Villagers: the little chaps in brown, by the Town Centre.', ok: () => U.sel.some(id => { const e = byId(id); return e && e.t === 'grot' && e.team === 0; }), at: () => { const g = own('grot')[0]; return g ? { x: g.x, y: g.y - 0.6 } : null; } },
      { t: () => `Splendid! Now ${ctl()} the berry bushes (the round ones with red dots) to gather Food. Food pays for Villagers and soldiers.`, ok: () => gathering('f'), at: () => nearestRes('f') },
      { t: () => `Next, Wood. Select another Villager and ${ctl()} a tree. Wood pays for buildings.`, ok: () => gathering('w'), at: () => nearestRes('w') },
      { t: () => `Rupees come from the glittering Rupee Mine. Send your third Villager there (${ctl()} the gem rocks).`, ok: () => gathering('t'), at: () => nearestRes('t') },
      { t: () => 'Look at the little person at the top: 4/5. That\'s your population, and you\'re nearly full! Select a Villager, click the House button (or press Q) and put it down near the Town Centre. Each House gives room for 5 more people.', ok: () => own('hut').some(b => b.done), on: () => topUp(0, 60, 0) },
      { t: () => 'Now there\'s room, more hands make light work! Click your Town Centre and train 2 more Villagers (the Villager button, or press Q). Tip: set a Rally point (G) on a bush and new Villagers go straight to work.', ok: () => own('grot').length >= 5, at: () => { const tc = findTC(0); return tc ? { x: tc.x + 1.5, y: tc.y - 0.5 } : null; }, on: () => topUp(150, 0, 0) },
      { t: () => 'Now a Barracks, so we can train soldiers. Select a Villager and build one (the Barracks button, or R). Two Villagers build faster than one!', ok: () => own('barrakks').some(b => b.done), on: () => topUp(0, 160, 0) },
      { t: () => 'Train 3 soldiers at the Barracks. Spearmen beat Riders, Archers beat Spearmen, and Warriors are good at a bit of everything.', ok: () => own(null, 'u').filter(u => SOLDIER(u.t)).length >= 4, at: () => { const b = own('barrakks')[0]; return b ? { x: b.x + 1.5, y: b.y - 0.5 } : null; }, on: () => { S.tut.n0 = own(null, 'u').filter(u => SOLDIER(u.t)).length; topUp(200, 120, 80); } },
      { t: () => S.age[0] === 2 ? 'The Castle Age! Well done.' : own('bighut').some(b => b.queue.includes('age')) ? 'Advancing to the Castle Age... the builders are hard at work. (About 40 seconds.)' : 'The King has sent a gift of Food and Rupees! Click your Town Centre and press Advance to the Castle Age (W). It unlocks Riders, Catapults and stronger soldiers.', ok: () => S.age[0] === 2, at: () => { const tc = findTC(0); return tc && S.age[0] === 1 && !tc.queue.includes('age') ? { x: tc.x + 1.5, y: tc.y - 0.5 } : null; }, on: () => topUp(400, 0, 120) },
      { t: () => 'Hark! Raiders from the Blue Knights are coming! Select your soldiers (drag a box round them, or press the Army button) and send them to fight. Use Attack (A) and click near the raiders.', ok: () => S.tut.raid && !S.ents.some(e => !e.dead && e.raider), at: () => { const r = S.ents.find(e => !e.dead && e.raider); return r ? { x: r.x, y: r.y - 0.6 } : null; }, on: () => tutRaid() },
      { t: () => 'Victory is near! The Blue Knights\' camp is in the top-right corner. Select your army, press A (Attack) and click on their Town Centre. Flatten it to win!', ok: () => false, at: () => { const tc = findTC(1); return tc && S.exp[idx(tc.x, tc.y)] ? { x: tc.x + 1.5, y: tc.y - 0.5 } : null; }, on: () => { topUp(200, 100, 100); S.ai[1].cfg.army = 3; const tc = findTC(0), etc = findTC(1); if (etc) etc.hp = Math.min(etc.hp, 450); if (tc) { for (let i = 0; i < 4; i++) { const f = freeNear(tc.x, tc.y, 3, 3); if (f) addUnit('rider', 0, f.x + 0.5, f.y + 0.5); } msg('Herald: The King has sent four Knights to help, my lord!', '#ffd860'); snd('fanfare'); } } },
    ];
    function tutRaid() {
      S.tut.raid = 1;
      const tc = findTC(0); if (!tc) return;
      const k = S.pl[0].corner, base = rotP(18, 30, k);
      for (let i = 0; i < 3; i++) { const f = freeNear(Math.floor(base.x), Math.floor(base.y), 1, 1) || { x: Math.floor(base.x), y: Math.floor(base.y) }; const u = addUnit(i ? 'boy' : 'spear', 1, f.x + 0.5, f.y + 0.5); u.raider = 1; orderMove(u, tc.x + 1.5, tc.y + 1.5, true); }
      snd('horn'); G.sfx('uhoh');
    }
    function tutTick() {
      const st = S.tut; if (!st || S.over || st.skip) return;
      const step = TUT[st.i]; if (!step) return;
      if (!st.shown) { st.shown = 1; if (step.on) step.on(); }
      if (step.ok()) { st.i++; st.shown = 0; G.sfx('solve'); if (TUT[st.i]) { tutShow(); } return; }
      tutShow();
    }
    let tutKey = '';
    function tutShow() {
      const st = S.tut, step = TUT[st.i]; if (!step) return;
      const txt = step.t(), key = st.i + txt + (advEl ? 1 : 0) + (st.min ? 1 : 0);
      if (key === tutKey && advEl) return; tutKey = key;
      advisor(`Sir Reginald (step ${st.i + 1} of ${TUT.length})`, txt, { btns: [[st.min ? 'Show' : 'Hide', () => { st.min = !st.min; tutKey = ''; tutShow(); }], ['Skip tutorial', () => G.msg('Learning Campaign', 'Skip the rest of the Learning Campaign? You can play it again any time from the title screen. (The Blue Knights will stay quiet: flatten their Town Centre to win.)', 'q', [['Skip', () => { st.skip = 1; advClose(); SEEN.tut = 1; saveSeen(); }], ['Keep learning']])]] });
      if (st.min) advEl.classList.add('min');
    }

    // ================================================================ camera
    function clampCam() {
      const ts = TSZ(), mw = MW * ts, mh = MH * ts;
      U.cam.x = cv.width >= mw ? (mw - cv.width) / 2 : clamp(U.cam.x, 0, mw - cv.width);
      U.cam.y = cv.height >= mh ? (mh - cv.height) / 2 : clamp(U.cam.y, 0, mh - cv.height);
    }
    function centerOn(x, y) { const ts = TSZ(); U.cam.x = x * ts - cv.width / 2; U.cam.y = y * ts - cv.height / 2; clampCam(); }
    function onScreen(x, y) { if (!S || scene !== 'game') return false; const ts = TSZ(), sx = x * ts - U.cam.x, sy = y * ts - U.cam.y; return sx > -ts && sy > -ts && sx < cv.width + ts && sy < cv.height + ts; }
    const toWorld = (px, py) => ({ x: (px + U.cam.x) / TSZ(), y: (py + U.cam.y) / TSZ() });

    // ================================================================ rendering
    const seeU = e => friend(e.team, S.me) || S.vis[idx(clamp(e.x | 0, 0, MW - 1), clamp(e.y | 0, 0, MH - 1))];
    const seeB = e => friend(e.team, S.me) || S.exp[idx(e.x, e.y)] || S.exp[idx(e.x + BT[e.t].s - 1, e.y + BT[e.t].s - 1)];
    const relCol = e => S.me < 0 ? COLS[colOf(e.team)].m : e.team === S.me ? '#3c3' : friend(e.team, S.me) ? '#e8d030' : '#e33';
    function fxTick(dt) {
      for (const p of S.proj) p.t += dt; S.proj = S.proj.filter(p => p.t < p.dur);
      for (const f of S.fx) f.t += dt; S.fx = S.fx.filter(f => f.t < f.dur);
      for (const e of S.ents) { if (e.fl > 0) e.fl -= dt; if (e.bub && (e.bub.t -= dt) <= 0) e.bub = null; }
      if (U.flash && (U.flash.t -= dt) <= 0) U.flash = null;
      if (U.ping) { U.ping.t -= dt; if (U.ping.t <= 0) U.ping = null; }
      for (const m of U.marks) m.t += dt; U.marks = U.marks.filter(m => m.t < 0.5);
    }
    function render() {
      const c = ctx, W = cv.width, H = cv.height, z = Z(), ts = TSZ();
      c.imageSmoothingEnabled = false;
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      const cx = Math.round(U.cam.x), cy = Math.round(U.cam.y);
      const sx0 = Math.max(0, cx / z), sy0 = Math.max(0, cy / z), sw = Math.min(MW * T - sx0, W / z), sh = Math.min(MH * T - sy0, H / z);
      if (sw > 0 && sh > 0) c.drawImage(S.bg, sx0, sy0, sw, sh, Math.max(0, -cx), Math.max(0, -cy), sw * z, sh * z);
      const x0 = Math.max(0, Math.floor(cx / ts) - 1), x1 = Math.min(MW - 1, Math.ceil((cx + W) / ts) + 1), y0 = Math.max(0, Math.floor(cy / ts) - 1), y1 = Math.min(MH - 1, Math.ceil((cy + H) / ts) + 3);
      for (const d of S.decals) {
        if (d.kind === 'rubble') { if (!S.exp[idx(d.x, d.y)]) continue; const r = RUBBLE(); for (let a = 0; a < d.s; a++) for (let b = 0; b < d.s; b++) c.drawImage(r, (d.x + a) * ts - cx, (d.y + b) * ts - cy, ts, ts); }
        else if (S.vis[idx(clamp(d.x | 0, 0, MW - 1), clamp(d.y | 0, 0, MH - 1))]) c.drawImage(SKULL(), d.x * ts - cx - 3 * z, d.y * ts - cy - 2 * z, 6 * z, 5 * z);
      }
      const list = [];
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * MW + x; if (S.resT[i] && S.exp[i]) list.push({ y: y + 0.99, r: i }); }
      for (const e of S.ents) {
        if (e.dead) continue;
        if (e.k === 'b') { const s = BT[e.t].s; if (e.x + s < x0 || e.x > x1 || e.y + s < y0 || e.y - 2 > y1) continue; if (!seeB(e)) continue; list.push({ y: e.y + s - (BT[e.t].farm ? 1.5 : 0), e }); }
        else { if (e.x < x0 || e.x > x1 + 1 || e.y < y0 || e.y > y1 + 1) continue; if (!seeU(e)) continue; list.push({ y: e.y, e }); }
      }
      for (const f of S.fx) if ((f.kind === 'die' || f.kind === 'fall') && S.exp[idx(clamp(f.x | 0, 0, MW - 1), clamp(f.y | 0, 0, MH - 1))]) list.push({ y: f.kind === 'fall' ? f.y + BT[f.bt].s - 0.01 : f.y - 0.01, f });
      list.sort((a, b) => a.y - b.y);
      const selSet = new Set(U.sel);
      for (const it of list) {
        if (it.r != null) { const i = it.r, x = i % MW, y = (i / MW) | 0, t = S.resT[i], v = (x * 3 + y * 5) % 3; const sp = resSpr(t, v, S.mi); c.drawImage(sp, x * ts - cx, (y * T + T - sp.height) * z - cy, sp.width * z, sp.height * z); continue; }
        if (it.f) { drawDying(c, it.f, z, ts, cx, cy); continue; }
        const e = it.e;
        if (e.k === 'b') drawBuilding(c, e, z, ts, cx, cy, selSet.has(e.id));
        else drawUnitAt(c, e, z, ts, cx, cy, selSet.has(e.id));
      }
      for (const p of S.proj) {
        const f = p.t / p.dur, x = (p.x0 + (p.x1 - p.x0) * f) * ts - cx, y = (p.y0 + (p.y1 - p.y0) * f) * ts - cy - (p.kind === 'shell' ? Math.sin(f * Math.PI) * 2.2 * ts : 0);
        if (p.kind === 'shell') { c.fillStyle = '#222'; c.fillRect(x - 2 * z, y - 2 * z, 4 * z, 4 * z); c.fillStyle = '#aaa'; c.fillRect(x - z, y - 2 * z, z, z); }
        else { const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0); c.strokeStyle = '#e8d8a8'; c.lineWidth = z; c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.cos(ang) * 5 * z, y - Math.sin(ang) * 5 * z); c.stroke(); }
      }
      for (const f of S.fx) {
        if (f.t < 0) continue;
        const x = f.x * ts - cx, y = f.y * ts - cy, k = f.t / f.dur;
        if (f.kind === 'boom') { const r = (f.big ? 26 : 10) * z * (0.3 + k); c.fillStyle = `rgba(255,${Math.floor(200 - k * 160)},0,${1 - k})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.fillStyle = `rgba(80,70,60,${0.7 * (1 - k)})`; c.beginPath(); c.arc(x + 3 * z, y - r * 0.6, r * 0.6, 0, TAU); c.fill(); }
        else if (f.kind === 'spark') { c.fillStyle = k < 0.5 ? '#fff' : '#ffd400'; const r = (1 + k * 3) * z; c.fillRect(x - r, y, r * 2, z); c.fillRect(x, y - r, z, r * 2); }
      }
      // fog of war
      for (let y = Math.max(0, y0); y <= Math.min(MH - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(MW - 1, x1); x++) {
        const i = y * MW + x; if (S.vis[i]) continue;
        c.fillStyle = S.exp[i] ? 'rgba(0,0,0,.45)' : '#000'; c.fillRect(x * ts - cx, y * ts - cy, ts, ts);
      }
      // overlay: bars, bubbles, rally, marks, ghost, box
      for (const it of list) {
        const e = it.e; if (!e) continue;
        if (e.k === 'u' && !seeU(e)) continue;
        const sel = selSet.has(e.id), maxhp = hpMax(e);
        if (sel || e.hp < maxhp) {
          let bx, by, bw;
          if (e.k === 'u') { bx = e.x * ts - cx - 6 * z; by = e.y * ts - cy - 14 * z; bw = 12 * z; }
          else { const s = BT[e.t].s; bx = e.x * ts - cx + 4 * z; by = (e.y * T - BT[e.t].ext) * z - cy - 4 * z; bw = s * ts - 8 * z; }
          c.fillStyle = '#000'; c.fillRect(bx - 1, by - 1, bw + 2, 2 * z + 2); c.fillStyle = '#600'; c.fillRect(bx, by, bw, 2 * z);
          c.fillStyle = relCol(e); c.fillRect(bx, by, bw * clamp(e.hp / maxhp, 0, 1), 2 * z);
        }
        if (e.k === 'b' && sel && e.rally && mineE(e)) { const rx = e.rally.x * ts - cx, ry = e.rally.y * ts - cy; c.strokeStyle = 'rgba(255,255,255,.35)'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo((e.x + BT[e.t].s / 2) * ts - cx, (e.y + BT[e.t].s / 2) * ts - cy); c.lineTo(rx, ry); c.stroke(); c.setLineDash([]); c.fillStyle = '#5a3a10'; c.fillRect(rx, ry - 12 * z, z, 12 * z); c.fillStyle = COLS[colOf(e.team)].c; c.fillRect(rx + z, ry - 12 * z, 6 * z, 4 * z); }
        if (e.k === 'u' && e.bub) bubble(c, e.x * ts - cx, e.y * ts - cy - 16 * z, e.bub.txt);
      }
      if (U.flash) { const e = byId(U.flash.id); if (e) { const cc = cen(e), r = (e.k === 'u' ? 8 : BT[e.t].s * 9) * z, on = Math.floor(U.flash.t * 10) % 2; if (on) { c.strokeStyle = U.flash.col || '#ff4040'; c.lineWidth = 2; c.beginPath(); c.ellipse(cc.x * ts - cx, (e.k === 'u' ? cc.y + 0.2 : cc.y) * ts - cy, r, r * 0.55, 0, 0, TAU); c.stroke(); } } }
      for (const m of U.marks) { const k = m.t / 0.5, x = m.x * ts - cx, y = m.y * ts - cy, r = (1 - k) * 7 * z + 2; c.strokeStyle = m.col; c.lineWidth = 2; c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x + r, y + r); c.moveTo(x + r, y - r); c.lineTo(x - r, y + r); c.stroke(); }
      if (U.mode === 'place' && U.ghost) {
        const t = U.placeType, s = BT[t].s, ok = canPlace(t, U.ghost.x, U.ghost.y, true), sp = bldSpr(t, colOf(S.me));
        c.globalAlpha = 0.55; c.drawImage(sp, U.ghost.x * ts - cx, (U.ghost.y * T - BT[t].ext) * z - cy, sp.width * z, sp.height * z); c.globalAlpha = 1;
        c.fillStyle = ok ? 'rgba(80,255,80,.28)' : 'rgba(255,40,40,.4)'; c.fillRect(U.ghost.x * ts - cx, U.ghost.y * ts - cy, s * ts, s * ts);
        c.strokeStyle = ok ? '#7f7' : '#f44'; c.lineWidth = 2; c.strokeRect(U.ghost.x * ts - cx + 1, U.ghost.y * ts - cy + 1, s * ts - 2, s * ts - 2);
      }
      if (U.box && U.box.on) { c.strokeStyle = '#fff'; c.lineWidth = 1; c.setLineDash([4, 3]); c.strokeRect(Math.min(U.box.x0, U.box.x1) + 0.5, Math.min(U.box.y0, U.box.y1) + 0.5, Math.abs(U.box.x1 - U.box.x0), Math.abs(U.box.y1 - U.box.y0)); c.setLineDash([]); }
      // the Learning Campaign's pointing arrow
      if (S.tut && !S.tut.skip && TUT[S.tut.i] && TUT[S.tut.i].at && !S.over) {
        const a = TUT[S.tut.i].at();
        if (a) { const x = a.x * ts - cx, y = a.y * ts - cy - 14 * z - Math.abs(Math.sin(performance.now() / 180)) * 8; c.fillStyle = '#ffd400'; c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x - 9, y); c.lineTo(x - 4, y); c.lineTo(x - 4, y - 10); c.lineTo(x + 4, y - 10); c.lineTo(x + 4, y); c.lineTo(x + 9, y); c.closePath(); c.fill(); c.stroke(); }
      }
      if (S.paused && !ov && !NET) { c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, 0, W, H); c.font = 'bold 28px Georgia,serif'; c.textAlign = 'center'; c.fillStyle = '#ffd860'; c.fillText('PAUSED', W / 2, H / 2); c.font = 'bold 12px Tahoma,sans-serif'; c.fillText('Press P to carry on', W / 2, H / 2 + 22); c.textAlign = 'left'; }
      if (U.mode === 'amove' || U.mode === 'rally') { c.font = 'bold 13px Tahoma,sans-serif'; c.textAlign = 'center'; c.fillStyle = '#000'; const t = U.mode === 'amove' ? 'Click where to attack!' : 'Click where new units should go'; c.fillText(t, W / 2 + 1, H - 13); c.fillStyle = '#ffd860'; c.fillText(t, W / 2, H - 14); c.textAlign = 'left'; }
    }
    function bubble(c, x, y, txt) {
      c.font = 'bold 11px Tahoma,sans-serif'; const w = c.measureText(txt).width + 10;
      const bx = Math.round(x - w / 2), by = Math.round(y - 18);
      c.fillStyle = '#fff'; c.fillRect(bx, by, w, 16); c.strokeStyle = '#000'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, w - 1, 15);
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 3, by + 15); c.lineTo(x + 3, by + 15); c.lineTo(x, by + 21); c.fill();
      c.fillStyle = '#000'; c.fillText(txt, bx + 5, by + 12);
    }
    function drawUnitAt(c, u, z, ts, cx, cy, sel) {
      const x = u.x * ts - cx, y = u.y * ts - cy, big = u.t === 'rider' || u.t === 'kannon';
      if (sel) { c.strokeStyle = relCol(u) === '#3c3' ? '#7cff4a' : relCol(u); c.lineWidth = 2; c.beginPath(); c.ellipse(x, y + 3 * z, (big ? 8 : 6) * z, 3 * z, 0, 0, TAU); c.stroke(); }
      else { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + 3 * z, 5 * z, 2 * z, 0, 0, TAU); c.fill(); }
      const tm = performance.now() / 1000;
      const f = u.hitT > 0 ? 3 : u.moving ? 1 + (Math.floor(tm * 6 + u.id) % 2) : u.working ? (Math.floor(tm * 4 + u.id) % 2 ? 3 : 0) : 0;
      const ci = colOf(u.team), sp = unitSpr(u.t, ci, f), dx = Math.round(x - 8 * z), dy = Math.round(y - 12 * z);
      const draw = img => { if (u.fx < 0) { c.save(); c.scale(-1, 1); c.drawImage(img, -(dx + 16 * z), dy, 16 * z, 16 * z); c.restore(); } else c.drawImage(img, dx, dy, 16 * z, 16 * z); };
      draw(sp);
      if (u.fl > 0) { c.globalAlpha = clamp(u.fl / 0.14, 0, 1) * 0.85; draw(whiteOf(sp, 'w' + u.t + ci + f)); c.globalAlpha = 1; }
      if (u.carry.n >= 1 && u.t === 'grot' && !u.working) { c.fillStyle = u.carry.k === 'w' ? '#8a5a2a' : u.carry.k === 'f' ? '#e02040' : '#1ac83a'; c.fillRect(x + (u.fx < 0 ? -6 : 3) * z, y - 4 * z, 3 * z, 3 * z); }
      if (S.me >= 0 && !friend(u.team, S.me) && sel) { /* enemy: ring already red */ }
    }
    function drawDying(c, f, z, ts, cx, cy) {
      const k = f.t / f.dur;
      if (f.kind === 'die') { // falls over, then fades away
        const x = f.x * ts - cx, y = f.y * ts - cy, sp = unitSpr(f.ut, f.col, 3), ang = Math.min(1, k * 3) * (f.fx < 0 ? -1 : 1) * Math.PI / 2;
        c.save(); c.globalAlpha = k < 0.6 ? 1 : (1 - k) / 0.4; c.translate(x, y + 2 * z); c.rotate(ang); if (f.fx < 0) c.scale(-1, 1); c.drawImage(sp, -8 * z, -14 * z, 16 * z, 16 * z); c.restore();
        return;
      }
      // a building sinks into a cloud of dust
      const sp = bldSpr(f.bt, f.col), s = BT[f.bt].s, x = f.x * ts - cx, fy = f.y * ts - cy, yTop = (f.y * T - BT[f.bt].ext) * z - cy, sink = Math.floor(sp.height * Math.min(1, k * 1.2));
      if (sink < sp.height) { c.save(); c.globalAlpha = 1 - k * 0.5; c.drawImage(sp, 0, 0, sp.width, sp.height - sink, x + (Math.random() - 0.5) * 2 * z, yTop + sink * z, sp.width * z, (sp.height - sink) * z); c.restore(); }
      c.fillStyle = `rgba(150,130,100,${0.6 * (1 - k)})`;
      for (let i = 0; i < 5; i++) { const r = (6 + i * 3 + k * 10) * z; c.beginPath(); c.arc(x + (i + 0.5) / 5 * s * ts, fy + s * ts - r * 0.4, r, 0, TAU); c.fill(); }
    }
    function drawBuilding(c, b, z, ts, cx, cy, sel) {
      const ty = BT[b.t], ci = colOf(b.team), sp = bldSpr(b.t, ci), x = b.x * ts - cx, yTop = (b.y * T - ty.ext) * z - cy, fy = b.y * ts - cy, s = ty.s;
      if (sel) { c.strokeStyle = relCol(b) === '#3c3' ? '#7cff4a' : relCol(b); c.lineWidth = 2; c.strokeRect(x + 1, fy + 1, s * ts - 2, s * ts - 2); }
      if (b.done) {
        c.drawImage(sp, x, yTop, sp.width * z, sp.height * z);
        if (b.fl > 0) { c.globalAlpha = clamp(b.fl / 0.14, 0, 1) * 0.5; c.drawImage(whiteOf(sp, 'wb' + b.t + ci), x, yTop, sp.width * z, sp.height * z); c.globalAlpha = 1; }
        if (b.queue.length && (b.t === 'smithy' || b.t === 'bighut' || b.t === 'barrakks' || b.t === 'mekshop')) { const t = performance.now() / 300 + b.id; c.fillStyle = 'rgba(200,200,200,.6)'; for (let i = 0; i < 3; i++) { const k = ((t + i / 3) % 1); c.beginPath(); c.arc(x + s * ts * 0.8 + Math.sin(t * 2 + i) * 3 * z, yTop + (6 - k * 14) * z, (1.5 + k * 2.5) * z, 0, TAU); c.fill(); } }
      } else {
        c.fillStyle = '#6a5034'; c.fillRect(x + 2 * z, fy + 2 * z, s * ts - 4 * z, s * ts - 4 * z);
        const p = clamp(b.prog, 0, 1), hgt = Math.max(1, Math.floor(sp.height * p)), sy = sp.height - hgt;
        c.drawImage(sp, 0, sy, sp.width, hgt, x, yTop + sy * z, sp.width * z, hgt * z);
        c.fillStyle = '#c8a060';
        const top2 = yTop + sy * z - 3 * z;
        for (let i = 2; i < sp.width; i += 9) c.fillRect(x + i * z, top2, z, (sp.height - sy) * z + 3 * z);
        for (let j = sp.height - 2; j > sy - 3; j -= 8) c.fillRect(x, yTop + j * z, sp.width * z, z);
      }
      if (b.done && b.hp < ty.hp * 0.5) { const t = performance.now() / 125 + b.id; for (let i = 0; i < 3; i++) { c.fillStyle = (Math.floor(t + i) % 2) ? '#ff8a00' : '#ffd400'; c.fillRect(x + ((i * 11 + 5) % (s * 14)) * z, fy + ((i * 7) % 8 + 2) * z - Math.floor((t * 2 + i * 3) % 6) * z, 3 * z, 4 * z); } }
    }
    let miniT = 0;
    const miniImg = mk(MW, MH, () => {}); const miniCtx = miniImg.getContext('2d'); const miniData = miniCtx.createImageData(MW, MH); const md32 = new Uint32Array(miniData.data.buffer);
    const rgb = hex => { const n = parseInt(hex.slice(1, 7), 16); return 0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff); };
    function renderMini() {
      const M = MAPS[S.mi], cg = rgb(M.grass[0]), cd = rgb(M.dirt), cw = rgb(M.water), ct = rgb(M.tree[0]), cb = rgb('#c8304a'), cm = rgb('#1ac83a');
      if (S.miniDirty) {
        for (let i = 0; i < N; i++) {
          if (!S.exp[i]) { md32[i] = 0xff000000; continue; }
          const r = S.resT[i]; md32[i] = r === 1 ? ct : r === 2 ? cb : r === 3 ? cm : S.terr[i] === 2 ? cw : S.terr[i] === 1 ? cd : cg;
        }
        miniCtx.putImageData(miniData, 0, 0); S.miniDirty = false;
      }
      const m = mctx; m.imageSmoothingEnabled = false; m.drawImage(miniImg, 0, 0, 96, 96);
      m.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < N; i++) if (S.exp[i] && !S.vis[i]) m.fillRect((i % MW) * 2, ((i / MW) | 0) * 2, 2, 2);
      for (const e of S.ents) {
        if (e.dead) continue;
        if (e.k === 'u' ? !seeU(e) : !seeB(e)) continue;
        m.fillStyle = COLS[colOf(e.team)].m;
        if (e.k === 'b') { m.fillRect(e.x * 2, e.y * 2, BT[e.t].s * 2, BT[e.t].s * 2); if (e.t === 'bighut') { m.strokeStyle = '#fff'; m.strokeRect(e.x * 2 + 0.5, e.y * 2 + 0.5, 5, 5); } }
        else m.fillRect(e.x * 2 - 1, e.y * 2 - 1, 2, 2);
      }
      const ts = TSZ(); m.strokeStyle = '#fff'; m.lineWidth = 1; m.strokeRect(U.cam.x / ts * 2 + 0.5, U.cam.y / ts * 2 + 0.5, cv.width / ts * 2, cv.height / ts * 2);
      if (U.ping && U.ping.t > 0) { m.strokeStyle = (Math.floor(U.ping.t * 4) % 2) ? '#ff0' : '#f00'; m.beginPath(); m.arc(U.ping.x * 2, U.ping.y * 2, 6 + (3 - U.ping.t) * 2, 0, TAU); m.stroke(); }
    }

    // ================================================================ commands: the same path offline (straight in) and online (sent, numbered, run everywhere)
    const MAXU = 60, fin = v => typeof v === 'number' && Number.isFinite(v);
    function ownUnits(p, ids) { if (!Array.isArray(ids)) return []; const out = []; for (const id of ids.slice(0, MAXU)) { const e = byId(id); if (e && !e.dead && e.k === 'u' && e.team === p) out.push(e); } return out; }
    const ownB = (p, id) => { const b = byId(id); return b && !b.dead && b.k === 'b' && b.team === p ? b : null; };
    function issue(c) {
      if (!S || S.me < 0 || S.over) return;
      if (NET) netCmd(c); else exec(S.me, c);
    }
    // a command with a list of units, in slices the network can carry
    function issueU(c, ids) { for (let i = 0; i < ids.length; i += MAXU) issue(Object.assign({}, c, { u: ids.slice(i, i + MAXU) })); }
    function exec(p, c) {
      if (!c || typeof c !== 'object' || !S || S.over) return;
      if (p >= 0 && (!S.pl[p] || S.pl[p].out)) return;
      try { execX(p, c); } catch (e) { console.error(e); }
    }
    function execX(p, c) {
      switch (c.c) {
        case 'mv': {
          if (!fin(c.x) || !fin(c.y)) return;
          const x = clamp(c.x, 0.1, MW - 0.1), y = clamp(c.y, 0.1, MH - 0.1), us = ownUnits(p, c.u), cols = Math.ceil(Math.sqrt(us.length));
          us.forEach((u, i) => { const ox = us.length > 1 ? ((i % cols) - (cols - 1) / 2) * 0.7 : 0, oy = us.length > 1 ? (Math.floor(i / cols) - (cols - 1) / 2) * 0.7 : 0; orderMove(u, clamp(x + ox, 0.1, MW - 0.1), clamp(y + oy, 0.1, MH - 0.1), !!c.am && u.t !== 'grot'); });
          return;
        }
        case 'atk': { const t = byId(c.t); if (!t || t.dead || !foe(p, t.team)) return; ownUnits(p, c.u).forEach(u => orderAttack(u, t)); return; }
        case 'gat': { const ri = c.ri; if (!Number.isInteger(ri) || ri < 0 || ri >= N || !S.resT[ri]) return; ownUnits(p, c.u).forEach(u => { if (u.t === 'grot') orderGather(u, ri); }); return; }
        case 'pen': { const b = byId(c.b); if (!b || b.dead || b.t !== 'pen' || !b.done || !friend(p, b.team)) return; ownUnits(p, c.u).forEach(u => { if (u.t === 'grot') orderGather(u, -1, b); }); return; }
        case 'bld': { const b = byId(c.b); if (!b || b.dead || b.k !== 'b' || !friend(p, b.team)) return; ownUnits(p, c.u).forEach(u => { if (u.t === 'grot') orderBuild(u, b); }); return; }
        case 'drop': { const b = ownB(p, c.b); if (!b || !b.done || !BT[b.t].drop) return; ownUnits(p, c.u).forEach(u => { if (u.t === 'grot' && u.carry.n >= 1) { u.o = { type: 'gather', kind: u.carry.k, ri: findRes(u.carry.k, u.x, u.y, 8), pen: 0, ph: 'back', drop: b.id }; u.path = null; u.dest = null; } }); return; }
        case 'st': ownUnits(p, c.u).forEach(u => { u.o = IDLE(); u.path = null; u.dest = null; }); return;
        case 'tr': { const b = ownB(p, c.b), t = c.t; if (!b || !b.done || !UT[t] || !(BT[b.t].trains || []).includes(t) || (UT[t].age && S.age[p] < UT[t].age) || b.queue.length >= 5 || !afford(p, UT[t].cost)) return; pay(p, UT[t].cost); b.queue.push(t); return; }
        case 'age': { const b = ownB(p, c.b); if (!b || !b.done || b.t !== 'bighut' || S.age[p] !== 1 || queuedAnywhere(p, 'age') || !S.ents.some(e => !e.dead && e.team === p && e.t === 'barrakks' && e.done) || !afford(p, AGE.cost) || b.queue.length >= 5) return; pay(p, AGE.cost); b.queue.push('age'); return; }
        case 'rs': { const b = ownB(p, c.b), k = c.k; if (!b || !b.done || !TECH[k] || !(BT[b.t].techs || []).includes(k) || S.tech[p][k] || queuedAnywhere(p, 'r:' + k) || (TECH[k].age && S.age[p] < TECH[k].age) || b.queue.length >= 5 || !afford(p, TECH[k].cost)) return; pay(p, TECH[k].cost); b.queue.push('r:' + k); return; }
        case 'cq': { const b = ownB(p, c.b); if (!b || !Number.isInteger(c.i)) return; const it = b.queue[c.i]; if (it == null) return; b.queue.splice(c.i, 1); if (c.i === 0) b.qt = 0; pay(p, qCost(it), -1); return; }
        case 'pl': { const t = c.t; if (!BT[t] || !BUILD_LIST.includes(t) || !Number.isInteger(c.x) || !Number.isInteger(c.y) || (BT[t].age && S.age[p] < BT[t].age) || !afford(p, BT[t].cost) || !canPlace(t, c.x, c.y)) return; pay(p, BT[t].cost); const b = addBld(t, p, c.x, c.y, false); ownUnits(p, c.u).forEach(u => { if (u.t === 'grot') orderBuild(u, b); }); return; }
        case 'ry': { if (!fin(c.x) || !fin(c.y) || !Array.isArray(c.b)) return; for (const id of c.b.slice(0, 20)) { const b = ownB(p, id); if (b && BT[b.t].trains) b.rally = { x: clamp(c.x, 0.1, MW - 0.1), y: clamp(c.y, 0.1, MH - 0.1) }; } return; }
        case 'rsg': if (p >= 0) defeat(p, 'rsg'); return;
        case 'ai': { // the host only: a player who dropped out is played by the computer (and handed back if they return)
          if (p !== -1) return; const q = c.s; if (!Number.isInteger(q) || !S.pl[q] || S.pl[q].out) return;
          if (c.on) { if (S.pl[q].ai < 0) { S.pl[q].was = 1; S.pl[q].ai = 1; if (!S.ai[q]) S.ai[q] = aiInit(1); S.ai[q].waveAt = Math.max(S.ai[q].waveAt, S.time + 120); } }
          else if (S.pl[q].was) { S.pl[q].ai = -1; S.pl[q].was = 0; }
          return;
        }
        case 'gone': { if (p !== -1) return; const q = c.s; if (Number.isInteger(q) && S.pl[q] && !S.pl[q].out) defeat(q, 'gone'); return; }
      }
    }

    // ================================================================ HUD: resources, selection info, command card
    let cardKey = '';
    const short = {};
    function flashShort(c) { for (const k of ['f', 'w', 't']) if ((c[k] || 0) > S.res[S.me][k]) short[k] = performance.now() + 1200; }
    function hud() {
      const spec = S.me < 0;
      if (!spec) {
        const R = S.res[S.me], cnt = { f: 0, w: 0, t: 0 };
        for (const e of S.ents) if (!e.dead && e.team === S.me && e.t === 'grot' && e.o.type === 'gather') cnt[e.o.kind]++;
        for (const k of ['f', 'w', 't']) { resEl(k).textContent = Math.floor(R[k]); resCnt(k).textContent = cnt[k]; resEl(k).parentNode.classList.toggle('short', (short[k] || 0) > performance.now()); resEl(k).parentNode.style.display = ''; }
        resEl('p').textContent = popOf(S.me) + '/' + capOf(S.me); resEl('p').parentNode.style.display = '';
        top.querySelector('.dg-rts-age').textContent = AGEN[S.age[S.me]] + (S.pl[S.me].out ? ' (out)' : '');
      } else {
        for (const k of ['f', 'w', 't', 'p']) resEl(k).parentNode.style.display = 'none';
        top.querySelector('.dg-rts-age').textContent = 'Watching';
      }
      top.querySelector('.dg-rts-clock').textContent = fmtT(S.time) + (G.demo && !S.online ? ' (demo ' + fmtT(900 - S.time) + ')' : '');
      top.querySelector('[data-t=box]').classList.toggle('on', U.boxMode);
      top.querySelector('[data-t=chat]').style.display = S.online ? '' : (S.scen && SCEN_BY[S.scen.id] && SCEN_BY[S.scen.id].tut ? 'none' : '');
      renderInfo();
      const btns = cardButtons(), key = btns.map(b => b.k + (b.dis ? 0 : 1) + (b.on ? 1 : 0) + (b.pr != null ? Math.floor(b.pr * 20) : '')).join('|') + U.mode;
      if (key !== cardKey) { cardKey = key; renderCard(btns); }
    }
    const selEnts = () => U.sel.map(byId).filter(e => e && !e.dead);
    let infoH = '';
    const setInfo = h => { if (h !== infoH) { infoH = h; info.innerHTML = h; return true; } return false; };
    const ownerTag = e => S.me >= 0 && e.team === S.me ? '' : ` <small style="color:${COLS[colOf(e.team)].l}">(${esc(pName(e.team))}${S.me >= 0 && friend(e.team, S.me) ? ', ally' : ''})</small>`;
    function renderInfo() {
      const sel = selEnts();
      if (U.hoverTip) { setInfo(U.hoverTip); return; }
      if (!sel.length) {
        if (U.selRes != null && S.resT[U.selRes]) { const k = KIND_OF[S.resT[U.selRes]]; setInfo(`<b class="nm">${k === 'w' ? 'Tree' : k === 'f' ? 'Berry Bush' : 'Rupee Mine'}</b><br>${Math.ceil(S.resAmt[U.selRes])} ${RNAME[k]} left.<br><small>Select a Villager, then ${G.touch ? 'click' : 'right-click'} here to gather.</small>`); return; }
        const foes = S.pl.map((P, p) => p).filter(p => S.me < 0 || p !== S.me);
        setInfo(`<b class="nm">${S.me >= 0 ? esc(S.pl[S.me].name) + '</b> <small>(' + esc(CIVS[S.pl[S.me].civ].n) + ')</small> vs ' : 'Watching:</b> '}${foes.map(p => `<b style="color:${COLS[colOf(p)].l}">${esc(pName(p))}</b>${S.pl[p].ai >= 0 && !S.pl[p].was ? ' <small>(' + FOES[S.pl[p].ai].tag + ')</small>' : ''}`).join(', ')}<br><small>${esc(TIPS[Math.floor(S.time / 20) % TIPS.length])}</small>`); return;
      }
      if (sel.length === 1) {
        const e = sel[0], isU = e.k === 'u', ty = isU ? UT[e.t] : BT[e.t], mx = hpMax(e), me = mineE(e);
        let h = `<img class="port" src="${iconURL(e.k, e.t, colOf(e.team))}" alt=""><b class="nm">${esc(nameOf(e))}</b>${ownerTag(e)}<div class="dg-rts-hp"><i style="width:${clamp(e.hp / mx * 100, 0, 100)}%;background:${relCol(e)}"></i></div><small>HP ${Math.ceil(e.hp)}/${mx}`;
        if (isU) h += ` &middot; Attack ${uAtk(e)} &middot; Armour ${uArm(e)}${uRng(e) > 1 ? ' &middot; Range ' + uRng(e) : ''}`;
        else if (ty.atk) h += ` &middot; Attack ${bAtk(e)} &middot; Range ${bRng(e)}`;
        h += '</small><br>';
        if (isU && e.t === 'grot' && e.carry.n >= 1) h += `<small>Carrying ${Math.floor(e.carry.n)} ${RNAME[e.carry.k]}</small>`;
        else if (isU && me) h += `<small>${esc(e.o.type === 'gather' ? 'Gathering ' + RNAME[e.o.kind] : e.o.type === 'build' ? 'Building' : e.o.type === 'attack' ? 'Fighting!' : e.o.type === 'idle' ? (e.t === 'grot' ? 'Doing nothing. Typical.' : 'Standing guard.') : 'On the move')}</small>${ty.good ? `<br><small style="color:#9f9">Good against: ${esc(ty.good)}</small>` : ''}`;
        else if (isU) h += `<small>${esc(ty.d)}</small>${ty.good ? `<br><small style="color:#9f9">Good against: ${esc(ty.good)}</small>` : ''}`;
        else if (!e.done) h += `<small>Under construction: ${Math.floor(e.prog * 100)}%</small>`;
        else if (e.queue.length && me) {
          const it = e.queue[0], tt = qTime(it);
          const what = it === 'age' ? 'Advancing to the Castle Age' : it.startsWith('r:') ? 'Researching ' + TECH[it.slice(2)].n : 'Training ' + UT[it].n[S.age[e.team] === 2 ? 1 : 0];
          h += `<small>${e.popBlock ? 'Waiting for room (build Houses!)' : what + ' ' + Math.floor(e.qt / tt * 100) + '%'}</small><div class="dg-rts-q">${e.queue.map((q, i) => `<span data-q="${i}" title="Cancel (gives the money back)"><img src="${q === 'age' ? iconURL('t', 'age', 0) : q.startsWith('r:') ? iconURL('t', q.slice(2), 0) : iconURL('u', q, colOf(e.team))}" alt="">${i === 0 ? `<em style="width:${Math.floor(e.qt / tt * 100)}%"></em>` : ''}</span>`).join('')}</div>`;
        } else h += `<small>${esc(ty.d)}</small>`;
        if (!setInfo(h)) return;
        info.querySelectorAll('[data-q]').forEach(q => q.addEventListener('pointerdown', ev => { ev.preventDefault(); issue({ c: 'cq', b: e.id, i: +q.dataset.q }); snd('click'); }));
        return;
      }
      setInfo(`<div class="dg-rts-multi">${sel.slice(0, 24).map(e => `<span title="${esc(nameOf(e))}"><img src="${iconURL(e.k, e.t, colOf(e.team))}" alt=""><i style="width:${clamp(e.hp / hpMax(e) * 24, 0, 24)}px"></i></span>`).join('')}${sel.length > 24 ? '<b>+' + (sel.length - 24) + '</b>' : ''}</div>`);
    }
    const HK = 'QWERTYUIO';
    function cardButtons() {
      if (!S || S.over || S.me < 0 || S.pl[S.me].out) return [];
      if (U.mode === 'place') return [{ k: 'ok', txt: 'Build here', ic: iconURL('b', U.placeType, colOf(S.me)), dis: !U.ghost || !canPlace(U.placeType, U.ghost.x, U.ghost.y, true), act: confirmPlace, tip: 'Build it where the ghost is. (Or click the spot again.)' }, { k: 'x', txt: 'Cancel', hk: 'Esc', act: cancelMode, tip: 'Cancel building (Esc)' }];
      if (U.mode === 'amove' || U.mode === 'rally') return [{ k: 'x', txt: 'Cancel', hk: 'Esc', act: cancelMode, tip: 'Cancel (Esc)' }];
      const sel = selEnts().filter(mineE);
      if (!sel.length) return [];
      const out = [], me = S.me, ci = colOf(me);
      if (sel[0].k === 'b') {
        const b = sel[0], ty = BT[b.t];
        if (!b.done) return [];
        (ty.trains || []).forEach(t => {
          const u = UT[t], locked = u.age && S.age[me] < u.age;
          out.push({ k: 'tr' + t, cost: u.cost, ic: iconURL('u', t, ci), sm: locked ? 'Castle Age' : costStr(u.cost), dis: locked || !afford(me, u.cost), act: () => train(b, t), tip: `<b class="nm">Train ${u.n[S.age[me] === 2 ? 1 : 0]}</b><br><small>${costLong(u.cost)} &middot; ${u.time}s${locked ? ' &middot; needs the Castle Age' : ''}</small><br><small>${esc(u.d)}${u.good ? ' Good against: ' + esc(u.good) + '.' : ''}</small>` });
        });
        if (b.t === 'bighut' && S.age[me] === 1) { const need = !S.ents.some(e => !e.dead && e.team === me && e.t === 'barrakks' && e.done), q = queuedAnywhere(me, 'age'); out.push({ k: 'age', cost: AGE.cost, ic: iconURL('t', 'age', 0), sm: need ? 'Barracks' : q ? 'Working' : costStr(AGE.cost), dis: need || q || !afford(me, AGE.cost), act: () => ageUp(b), tip: `<b class="nm">Advance to the Castle Age</b><br><small>${costLong(AGE.cost)} &middot; ${AGE.time}s &middot; needs a finished Barracks</small><br><small>Unlocks Riders, the Workshop and Catapults. Soldiers get +1 attack and +10 HP.</small>` }); }
        (ty.techs || []).forEach(k => {
          const T2 = TECH[k], done = hasTech(me, k), q = queuedAnywhere(me, 'r:' + k), locked = T2.age && S.age[me] < T2.age;
          if (done) return;
          out.push({ k: 'rs' + k, cost: T2.cost, ic: iconURL('t', k, 0), sm: locked ? 'Castle Age' : q ? 'Working' : costStr(T2.cost), dis: locked || q || !afford(me, T2.cost), act: () => research(b, k), tip: `<b class="nm">${esc(T2.n)}</b><br><small>${costLong(T2.cost)} &middot; ${T2.time}s${locked ? ' &middot; needs the Castle Age' : ''}</small><br><small>${esc(T2.d)}</small>` });
        });
        if (ty.trains) out.push({ k: 'rally', txt: 'Rally', hk: 'G', act: () => { U.mode = 'rally'; cardKey = ''; }, tip: '<b class="nm">Set rally point (G)</b><br><small>New units walk here. Put it on a bush, tree or mine and new Villagers start work there. (Right-click on the map works too.)</small>' });
      } else {
        const grots = sel.filter(e => e.t === 'grot'), army = sel.filter(e => e.k === 'u' && e.t !== 'grot');
        if (grots.length) BUILD_LIST.forEach(t => {
          const ty = BT[t], locked = ty.age && S.age[me] < ty.age;
          out.push({ k: 'bd' + t, cost: ty.cost, ic: iconURL('b', t, ci), sm: locked ? 'Castle Age' : costStr(ty.cost), dis: locked || !afford(me, ty.cost), act: () => startPlace(t), tip: `<b class="nm">Build ${ty.n[S.age[me] === 2 ? 1 : 0]}</b><br><small>${costLong(ty.cost)}${locked ? ' &middot; needs the Castle Age' : ''}</small><br><small>${esc(ty.d)}</small>` });
        });
        if (army.length) out.push({ k: 'am', txt: 'Attack', hk: 'A', act: () => { U.mode = 'amove'; cardKey = ''; }, tip: '<b class="nm">Attack-move (A)</b><br><small>Walk there and fight anything on the way.</small>' });
        out.push({ k: 'stop', txt: 'Stop', hk: 'S', act: () => { issueU({ c: 'st' }, sel.filter(e => e.k === 'u').map(e => e.id)); snd('click'); }, tip: '<b class="nm">Stop (S)</b><br><small>Stop whatever they\'re doing.</small>' });
      }
      let n = 0; for (const b of out) if (!b.hk) b.hk = HK[n++] || '';
      return out;
    }
    function renderCard(btns) {
      cmd.innerHTML = '';
      btns.forEach(b => {
        const e = el('button', 'dg-rts-cb' + (b.dis ? ' dis' : '') + (b.ic ? '' : ' txt'));
        e.type = 'button';
        e.innerHTML = (b.hk ? `<u>${esc(b.hk)}</u>` : '') + (b.ic ? `<img src="${b.ic}" alt="">` : '') + (b.txt && !b.ic ? esc(b.txt) : '') + (b.sm ? `<small>${esc(b.sm)}</small>` : (b.txt && b.ic ? `<small>${esc(b.txt)}</small>` : ''));
        e.title = (b.tip || '').replace(/<[^>]+>/g, ' ').replace(/&middot;/g, '-').replace(/&#39;/g, '\'').replace(/\s+/g, ' ').trim();
        e.addEventListener('click', () => pressCard(b));
        if (!G.touch) { e.addEventListener('mouseenter', () => { U.hoverTip = b.tip || ''; }); e.addEventListener('mouseleave', () => { U.hoverTip = ''; }); }
        cmd.appendChild(e);
      });
      U.card = btns;
    }
    function pressCard(b) {
      if (b.dis) { G.sfx('beep'); if (b.tip) { U.hoverTip = b.tip; G.timer(() => { U.hoverTip = ''; }, 2500); } if (b.cost && S.me >= 0) flashShort(b.cost); return; }
      snd('click'); b.act(); cardKey = '';
    }
    function train(b, t) {
      const u = UT[t];
      if (b.queue.length >= 5) { msg('The queue is full (5 max).', '#ffd860'); return; }
      if (!afford(S.me, u.cost)) { msg('Not enough! ' + costLong(u.cost), '#ff8a6a'); flashShort(u.cost); return; }
      issue({ c: 'tr', b: b.id, t });
    }
    function research(b, k) { if (!afford(S.me, TECH[k].cost)) { flashShort(TECH[k].cost); return; } issue({ c: 'rs', b: b.id, k }); msg('Researching ' + TECH[k].n + '...', '#ffe8a0'); }
    function ageUp(b) { if (!afford(S.me, AGE.cost)) { flashShort(AGE.cost); return; } issue({ c: 'age', b: b.id }); msg('Advancing to the Castle Age...', '#ffe8a0'); }
    function startPlace(t) {
      if (!afford(S.me, BT[t].cost)) { msg('Not enough! ' + costLong(BT[t].cost), '#ff8a6a'); flashShort(BT[t].cost); return; }
      U.mode = 'place'; U.placeType = t; U.ghost = null; cardKey = '';
      if (U.mouse) U.ghost = ghostAt(toWorld(U.mouse.x, U.mouse.y));
      if (G.touch) msg('Click the ground to put the ' + BT[t].n[0] + ', then click "Build here".', '#ffe8a0');
    }
    function confirmPlace() {
      const t = U.placeType, g = U.ghost;
      if (!g || !canPlace(t, g.x, g.y, true)) { G.sfx('beep'); msg('Can\'t build there!', '#ff8a6a'); return; }
      if (!afford(S.me, BT[t].cost)) { G.sfx('beep'); msg('Not enough!', '#ff8a6a'); flashShort(BT[t].cost); return; }
      const grots = selEnts().filter(e => mineE(e) && e.t === 'grot');
      issue({ c: 'pl', t, x: g.x, y: g.y, u: grots.slice(0, MAXU).map(e => e.id) });
      if (grots[0]) say(grots[0], 'build', true);
      snd('thud');
      cancelMode();
    }
    function cancelMode() { U.mode = ''; U.ghost = null; U.placeType = ''; cardKey = ''; }

    // ================================================================ input
    function pickAt(wx, wy, ownFirst) {
      let best = null, bd = 0.75;
      for (const e of S.ents) {
        if (e.dead || e.k !== 'u' || !seeU(e)) continue;
        const dx = wx - e.x, dy = wy - (e.y - 0.35), d = hyp(dx, dy * 0.8) - (ownFirst && mineE(e) ? 0.15 : 0);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) return best;
      for (const e of S.ents) {
        if (e.dead || e.k !== 'b') continue;
        const s = BT[e.t].s, ext = BT[e.t].ext / T;
        if (wx >= e.x && wx < e.x + s && wy >= e.y - ext * 0.6 && wy < e.y + s) { if (!seeB(e)) continue; return e; }
      }
      return null;
    }
    function selectEnts(list, add) {
      if (!add) U.sel = [];
      for (const e of list) if (!U.sel.includes(e.id)) U.sel.push(e.id);
      U.selRes = null; cardKey = '';
      const f = list[0];
      if (f) { if (mineE(f) && f.k === 'u') say(f, 'sel'); G.sfx(mineE(f) ? 'click' : 'beep'); }
    }
    function tapSelect(w, add) {
      const e = pickAt(w.x, w.y, true);
      if (e) { if (mineE(e) && e.k === 'u' && add && U.sel.includes(e.id)) { U.sel = U.sel.filter(i => i !== e.id); cardKey = ''; return; } selectEnts([e], add && mineE(e) && e.k === 'u'); return; }
      const ti = idx(clamp(w.x | 0, 0, MW - 1), clamp(w.y | 0, 0, MH - 1));
      U.sel = []; cardKey = ''; U.selRes = S.resT[ti] && S.exp[ti] ? ti : null;
    }
    // right-click (or click with something selected on a touch screen): work out what they meant and send it
    function commandAt(w, forceAm) {
      if (S.me < 0) return false;
      const sel = selEnts().filter(mineE);
      if (!sel.length) return false;
      const qx = Math.round(w.x * 16) / 16, qy = Math.round(w.y * 16) / 16;
      if (sel[0].k === 'b') {
        const bs = sel.filter(b => b.k === 'b' && BT[b.t].trains && b.done); if (!bs.length) return false;
        issue({ c: 'ry', b: bs.slice(0, 20).map(b => b.id), x: qx, y: qy }); U.marks.push({ x: w.x, y: w.y, t: 0, col: '#ffd400' }); msg('Rally point set.', '#ffe8a0'); snd('click'); return true;
      }
      const units = sel.filter(e => e.k === 'u'), ids = units.map(u => u.id);
      const grots = units.filter(u => u.t === 'grot'), gids = grots.map(u => u.id), others = units.filter(u => u.t !== 'grot').map(u => u.id);
      const tgt = pickAt(w.x, w.y);
      const ti = idx(clamp(w.x | 0, 0, MW - 1), clamp(w.y | 0, 0, MH - 1)), rt = S.exp[ti] ? S.resT[ti] : 0;
      let kind = 'move';
      if (tgt && foe(S.me, tgt.team)) { issueU({ c: 'atk', t: tgt.id }, ids); kind = 'atk'; U.flash = { id: tgt.id, t: 0.6 }; }
      else {
        let gDone = false;
        if (grots.length && !forceAm) {
          if (tgt && tgt.k === 'b' && friend(S.me, tgt.team) && (!tgt.done || tgt.hp < BT[tgt.t].hp)) { issueU({ c: 'bld', b: tgt.id }, gids); kind = 'build'; gDone = true; }
          else if (tgt && tgt.k === 'b' && tgt.t === 'pen' && friend(S.me, tgt.team)) { issueU({ c: 'pen', b: tgt.id }, gids); kind = 'gather'; gDone = true; }
          else if (tgt && tgt.k === 'b' && mineE(tgt) && BT[tgt.t].drop && grots.some(g => g.carry.n >= 1)) { issueU({ c: 'drop', b: tgt.id }, gids); kind = 'gather'; gDone = true; }
          else if (rt) { issue({ c: 'gat', u: gids.slice(0, MAXU), ri: ti }); kind = 'gather'; gDone = true; }
          if (gDone && tgt) U.flash = { id: tgt.id, t: 0.6, col: '#7cff4a' };
        }
        const movers = gDone ? others : ids;
        if (movers.length) { issueU({ c: 'mv', x: qx, y: qy, am: forceAm ? 1 : 0 }, movers); if (forceAm) kind = 'atk'; }
      }
      U.marks.push({ x: w.x, y: w.y, t: 0, col: kind === 'atk' ? '#ff4040' : '#7cff4a' });
      say(units[0], kind === 'atk' ? 'atk' : kind === 'build' ? 'build' : kind === 'gather' ? 'gather' : 'move');
      G.sfx(kind === 'atk' ? 'button' : 'click');
      return true;
    }
    const ptr = { id: null };
    G.on(cv, 'contextmenu', ev => ev.preventDefault());
    G.on(cv, 'pointerdown', ev => {
      if (scene !== 'game' || !S || S.over || ov) return;
      ev.preventDefault(); host.focus({ preventScroll: true });
      const r = cv.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top, w = toWorld(px, py);
      const touch = ev.pointerType !== 'mouse';
      if (ev.button === 2) { if (U.mode) { cancelMode(); return; } commandAt(w); return; }
      if (ev.button !== 0) return;
      if (U.mode === 'place' && !touch) { U.ghost = ghostAt(w); confirmPlace(); return; }
      if (ptr.id != null) { ptr.multi = true; return; }
      ptr.id = ev.pointerId; ptr.x0 = px; ptr.y0 = py; ptr.cx = U.cam.x; ptr.cy = U.cam.y; ptr.touch = touch; ptr.moved = false; ptr.multi = false; ptr.shift = ev.shiftKey; ptr.t0 = performance.now();
      ptr.kind = touch && !U.boxMode ? 'pan' : 'box';
      if (ptr.kind === 'box') U.box = { x0: px, y0: py, x1: px, y1: py, on: false };
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
    });
    let tipT = 0;
    G.on(cv, 'pointermove', ev => {
      const r = cv.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
      if (ev.pointerType === 'mouse') U.mouse = { x: px, y: py }; else U.mouse = null;
      if (scene !== 'game' || !S) return;
      if (U.mode === 'place' && ev.pointerType === 'mouse') U.ghost = ghostAt(toWorld(px, py));
      if (ev.pointerType === 'mouse' && ptr.id == null && performance.now() - tipT > 80) { tipT = performance.now(); hoverTip(px, py); }
      if (ev.pointerId !== ptr.id) return;
      const dx = px - ptr.x0, dy = py - ptr.y0;
      if (!ptr.moved && hyp(dx, dy) > (ptr.touch ? 10 : 5)) ptr.moved = true;
      if (!ptr.moved) return;
      if (ptr.kind === 'pan') { U.cam.x = ptr.cx - dx; U.cam.y = ptr.cy - dy; clampCam(); }
      else if (U.box) { U.box.x1 = px; U.box.y1 = py; U.box.on = true; }
    });
    // a little yellow label for whatever the mouse is over (the same facts show in the panel when you click it)
    function hoverTip(px, py) {
      if (ov || U.mode === 'place') { tipEl.style.display = 'none'; return; }
      const w = toWorld(px, py), e = pickAt(w.x, w.y);
      let t = '';
      if (e) t = `${nameOf(e)}${mineE(e) ? '' : ' (' + pName(e.team) + ')'} - ${Math.ceil(e.hp)}/${hpMax(e)} HP`;
      else { const ti = idx(clamp(w.x | 0, 0, MW - 1), clamp(w.y | 0, 0, MH - 1)); if (S.resT[ti] && S.exp[ti]) { const k = KIND_OF[S.resT[ti]]; t = `${k === 'w' ? 'Tree' : k === 'f' ? 'Berry Bush' : 'Rupee Mine'} - ${Math.ceil(S.resAmt[ti])} ${RNAME[k]}`; } }
      if (!t) { tipEl.style.display = 'none'; return; }
      tipEl.textContent = t; tipEl.style.display = 'block';
      tipEl.style.left = Math.min(px + 14, cv.width - tipEl.offsetWidth - 4) + 'px'; tipEl.style.top = Math.min(py + 18, cv.height - 20) + 'px';
    }
    const endPtr = ev => {
      if (ev.pointerId !== ptr.id) return;
      ptr.id = null;
      if (scene !== 'game' || !S || S.over) { U.box = null; return; }
      const r = cv.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
      if (ev.type === 'pointercancel') { U.box = null; return; }
      if (ptr.kind === 'box' && ptr.moved && U.box) {
        const a = toWorld(Math.min(U.box.x0, U.box.x1), Math.min(U.box.y0, U.box.y1)), b = toWorld(Math.max(U.box.x0, U.box.x1), Math.max(U.box.y0, U.box.y1));
        const got = S.ents.filter(e => !e.dead && e.k === 'u' && mineE(e) && e.x >= a.x && e.x <= b.x && e.y >= a.y - 0.3 && e.y <= b.y + 0.3);
        if (got.length) selectEnts(got, ptr.shift);
        U.box = null; if (ptr.touch) { U.boxMode = false; } return;
      }
      U.box = null;
      if (ptr.moved || ptr.multi) return;
      tap(toWorld(px, py), ptr.touch, ptr.shift);
    };
    G.on(cv, 'pointerup', endPtr); G.on(cv, 'pointercancel', endPtr);
    G.on(cv, 'pointerleave', ev => { if (ev.pointerType === 'mouse') { U.mouse = null; tipEl.style.display = 'none'; } });
    let lastTap = { t: 0, id: 0 };
    function tap(w, touch, shift) {
      if (U.mode === 'place') { const g = ghostAt(w); if (U.ghost && g.x === U.ghost.x && g.y === U.ghost.y) confirmPlace(); else { U.ghost = g; cardKey = ''; } return; }
      if (U.mode === 'amove') { const ok = commandAt(w, true); cancelMode(); if (!ok) G.sfx('beep'); return; }
      if (U.mode === 'rally') { commandAt(w); cancelMode(); return; }
      const hitE = pickAt(w.x, w.y, true);
      const now = performance.now();
      if (hitE && mineE(hitE) && hitE.k === 'u' && lastTap.id === hitE.id && now - lastTap.t < 380) { // double click: all of that type on screen
        const same = S.ents.filter(e => !e.dead && mineE(e) && e.t === hitE.t && onScreen(e.x, e.y)); selectEnts(same); lastTap = { t: 0, id: 0 }; return;
      }
      lastTap = { t: now, id: hitE ? hitE.id : 0 };
      if (touch && S.me >= 0) { // smart click: your own things select, anything else is an order for what's selected
        const mineSel = selEnts().filter(mineE);
        if (hitE && mineE(hitE)) { if (mineSel.length && mineSel.every(e => e.k === 'u' && e.t === 'grot') && hitE.k === 'b' && (!hitE.done || hitE.hp < BT[hitE.t].hp || hitE.t === 'pen' || (BT[hitE.t].drop && mineSel.some(g => g.carry.n >= 1)))) { commandAt(w); return; } tapSelect(w, false); return; }
        if (mineSel.length && mineSel[0].k === 'u') { commandAt(w); return; }
        tapSelect(w, false); return;
      }
      tapSelect(w, shift);
    }
    function ghostAt(w) { const s = BT[U.placeType].s; return { x: clamp(Math.round(w.x - s / 2), 0, MW - s), y: clamp(Math.round(w.y - s / 2), 0, MH - s) }; }
    // minimap: click/drag to look, right-click to send the selection
    let miniDrag = false;
    const miniGo = ev => { const r = mini.getBoundingClientRect(); centerOn((ev.clientX - r.left) / r.width * MW, (ev.clientY - r.top) / r.height * MH); };
    G.on(mini, 'pointerdown', ev => { if (!S || ov) return; ev.preventDefault(); if (ev.button === 2 && selEnts().length) { const r = mini.getBoundingClientRect(); commandAt({ x: (ev.clientX - r.left) / r.width * MW, y: (ev.clientY - r.top) / r.height * MH }); return; } miniDrag = true; try { mini.setPointerCapture(ev.pointerId); } catch (e) {} miniGo(ev); });
    G.on(mini, 'pointermove', ev => { if (miniDrag) miniGo(ev); });
    G.on(mini, 'pointerup', () => { miniDrag = false; }); G.on(mini, 'pointercancel', () => { miniDrag = false; });
    G.on(mini, 'contextmenu', ev => ev.preventDefault());
    // top toolbar
    G.on(top, 'click', ev => {
      const b = ev.target.closest('[data-t]'); if (!b || !S) return; G.sfx('click');
      const t = b.dataset.t;
      if (t === 'idle') nextIdle();
      else if (t === 'army') selectArmy();
      else if (t === 'box') { U.boxMode = !U.boxMode; if (U.boxMode) msg('Drag a box around your units to select them.', '#ffe8a0'); }
      else if (t === 'chat') openChat();
      else if (t === 'menu') gameMenu();
    });
    function selectArmy() {
      const a = S.ents.filter(e => !e.dead && mineE(e) && e.k === 'u' && e.t !== 'grot');
      if (a.length) { selectEnts(a); const c = a.reduce((m, e) => ({ x: m.x + e.x / a.length, y: m.y + e.y / a.length }), { x: 0, y: 0 }); centerOn(c.x, c.y); }
      else msg('You haven\'t got an army! Build a Barracks.', '#ffd860');
    }
    function nextIdle() {
      const idle = S.ents.filter(e => !e.dead && mineE(e) && e.t === 'grot' && e.o.type === 'idle');
      if (!idle.length) { msg('No lazy Villagers. For once.', '#ffe8a0'); return; }
      U.idleI = ((U.idleI || 0) + 1) % idle.length; const g = idle[U.idleI]; selectEnts([g]); centerOn(g.x, g.y);
    }
    // keyboard
    G.on(document, 'keydown', ev => {
      if (!live() || !G.focused() || scene !== 'game' || !S) return;
      if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
      const k = ev.key;
      if (k.startsWith('Arrow')) { U.keys[k] = true; ev.preventDefault(); return; }
      if (ov) { if (k === 'Escape' && ovClose) { ovClose(); ev.preventDefault(); } return; }
      if (k === 'Enter') { ev.preventDefault(); openChat(); return; }
      if (k === 'Escape') { if (U.mode) cancelMode(); else { U.sel = []; cardKey = ''; } return; }
      if (k === '?') { ev.preventDefault(); keysScreen(closeOv); return; }
      if (k === 'F10') { ev.preventDefault(); gameMenu(); return; }
      if (k === 'p' || k === 'P' || k === 'F3') { ev.preventDefault(); if (!NET) { S.paused = !S.paused; } else msg('You can\'t pause an online game. (Everybody else would have to sit and wait!)', '#ffe8a0'); return; }
      if (k === 'h' || k === 'H') { const b = S.ents.find(e => !e.dead && mineE(e) && e.t === 'bighut'); if (b) { selectEnts([b]); centerOn(b.x + 1.5, b.y + 1.5); } return; }
      if (k === '.') { nextIdle(); return; }
      if (k === ',') { selectArmy(); return; }
      if (k === ' ') { ev.preventDefault(); const s = selEnts()[0]; if (s) { const c = cen(s); centerOn(c.x, c.y); } return; }
      if (/^[1-9]$/.test(k) || /^Digit[1-9]$/.test(ev.code || '')) {
        const n = /^[1-9]$/.test(k) ? k : ev.code.slice(5);
        if (ev.ctrlKey || ev.metaKey) { ev.preventDefault(); U.groups[n] = U.sel.slice(); msg('Group ' + n + ' set (' + U.sel.length + ').', '#ffe8a0'); return; }
        if (ev.shiftKey) { U.groups[n] = [...new Set((U.groups[n] || []).concat(U.sel))]; msg('Added to group ' + n + '.', '#ffe8a0'); return; }
        if (U.groups[n]) { const l = U.groups[n].map(byId).filter(e => e && !e.dead); if (l.length) { const now = performance.now(); selectEnts(l); if (U.grp.k === n && now - U.grp.t < 450) { const c = cen(l[0]); centerOn(c.x, c.y); } U.grp = { k: n, t: now }; } }
        return;
      }
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const K = k.length === 1 ? k.toUpperCase() : '';
      if (K && U.card) { const b = U.card.find(x => x.hk === K); if (b) { ev.preventDefault(); pressCard(b); return; } }
    });
    G.on(document, 'keyup', ev => { if (ev.key.startsWith('Arrow')) U.keys[ev.key] = false; });
    G.on(window, 'blur', () => { U.keys = {}; });

    // ================================================================ chat + cheats
    function openChat() {
      if (U.chat || !S) return; U.chat = true;
      const f = el('form', 'dg-rts-chat', `<input type="text" maxlength="60" placeholder="${S.online ? 'Say something to everybody' : 'Say something'} (Enter to send, Esc to cancel)" autocomplete="off" spellcheck="false"><button class="dg-rts-btn" type="submit">Send</button>`);
      view.appendChild(f);
      const inp = f.querySelector('input'); inp.focus(); setTimeout(() => inp.focus(), 20);
      const close = () => { U.chat = false; f.remove(); try { host.focus({ preventScroll: true }); } catch (e) {} };
      inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Escape') { ev.preventDefault(); close(); } });
      f.addEventListener('submit', ev => { ev.preventDefault(); const v = inp.value.trim(); close(); if (v) chat(v); });
    }
    const myTC = () => S.ents.find(e => !e.dead && e.team === S.me && e.t === 'bighut');
    const CHEATS = {
      'SHINY RUPEES': () => { S.res[S.me].t += 1000; return '+1000 Rupees! (Callum says that\'s cheating.)'; },
      'BERRY PIE': () => { S.res[S.me].f += 1000; return '+1000 Food! Pie for everyone!'; },
      'TREE HUGGER': () => { S.res[S.me].w += 1000; return '+1000 Wood! The trees are not happy.'; },
      'I CAN SEE MY HOUSE': () => { S.cheats.reveal = 1; S.miniDirty = true; updVis(); return 'Map revealed! You can see Callum\'s house from here.'; },
      'GUBBINZ': () => { const b = myTC(); if (!b) return 'Gubbinz can\'t find your Town Centre.'; const f = freeNear(b.x, b.y, 3, 3); if (!f) return 'No room for Gubbinz!'; const u = addUnit('hero', S.me, f.x + 0.5, f.y + 0.5); say(u, 'sel', true); G.sfx('waaagh'); return 'GUBBINZ HAS ARRIVED. The enemy trembles. A bit.'; },
      'MORE POWER': () => { S.cheats.dakka = !S.cheats.dakka; return S.cheats.dakka ? 'MORE POWER! Your soldiers hit 50% harder.' : 'Less power. Boring.'; },
      'TURBO BUTTON': () => { S.cheats.fast = !S.cheats.fast; return S.cheats.fast ? 'TURBO BUTTON pressed! Building and training ten times faster.' : 'Turbo off. Back to 33 MHz.'; },
      'JACK WINS': () => { S.cheats.win = 1; for (const e of S.ents) if (!e.dead && e.t === 'bighut' && meFoe(e.team)) kill(e, null); return 'Every enemy Town Centre falls over. Out of embarrassment.'; },
    };
    Object.assign(CHEATS, { 'SHINY TEEF': CHEATS['SHINY RUPEES'], 'SHINY GOLD': CHEATS['SHINY RUPEES'], 'SQUIG PIE': CHEATS['BERRY PIE'], 'TREE HUGGA': CHEATS['TREE HUGGER'], 'I CAN SEE ME HOUSE': CHEATS['I CAN SEE MY HOUSE'], 'MORE DAKKA': CHEATS['MORE POWER'], 'MEK SPEED': CHEATS['TURBO BUTTON'], 'IZ WINNA': CHEATS['JACK WINS'] });
    function chat(v) {
      if (NET) { netChat(v); return; }
      const up = v.toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
      msg(playerName() + ': ' + v, '#ff9a7a');
      if (S.me < 0) return;
      if (CHEATS[up]) { const r = CHEATS[up](); G.timer(() => msg(r, '#7fff7f'), 300); G.secret('rts.cheat'); G.sfx('solve'); return; }
      const F = (S.pl.find((P, p) => P.foe && meFoe(p)) || {}).foe; if (!F) return;
      if (/N64|GOLDENEYE|NINTENDO|MARIO/.test(up)) { G.timer(() => msg('Luke and Dave say this would be better on the ULTRA 64. They are wrong. (Well. Maybe Goldenballs.)', '#ffe8a0'), 500); return; }
      if (/^(GG|GOOD GAME)/.test(up)) { G.timer(() => msg(F.n + ': gg? it\'s not over yet!', '#8ab0ff'), 900); return; }
      if (/CHEAT/.test(up)) { G.timer(() => msg(F.n + ': I\'m not telling you the cheats. Ask Callum. Actually don\'t, he\'ll just laugh.', '#8ab0ff'), 900); return; }
      G.timer(() => msg(F.n + ': ' + vpick(['lol', 'what?', 'stop typing and play!', 'is that you Jack?', 'my Mom says hi', 'can\'t talk, building', 'whatever']), '#8ab0ff'), 900 + Math.random() * 800);
    }

    // ================================================================ overlays: title, setup, campaign, load, help, menus, the end
    let ovClose = null;
    function closeOv() { if (ov) { ov.remove(); ov = null; } ovClose = null; if (S && scene === 'game' && !U.keepPause) S.paused = false; U.keepPause = false; }
    function overlay(cls, html, onEsc) {
      if (ov) ov.remove();
      ov = el('div', 'dg-rts-ov ' + (cls || ''), html); root.appendChild(ov); ovClose = onEsc || null; return ov;
    }
    function titleBg() {
      const c = mk(320, 200, x => {
        const rnd2 = mulberry32(1999);
        const g = x.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#120830'); g.addColorStop(0.5, '#6a1a3a'); g.addColorStop(0.75, '#e0702a'); g.addColorStop(1, '#ffc060'); x.fillStyle = g; x.fillRect(0, 0, 320, 200);
        for (let i = 0; i < 60; i++) P(x, '#fff', Math.floor(rnd2() * 320), Math.floor(rnd2() * 70), 1, 1);
        blob(x, 232, 128, 26, '#ffd860'); blob(x, 232, 128, 20, '#ffe890');
        x.fillStyle = '#3a1438'; x.beginPath(); x.moveTo(0, 140); for (let i = 0; i <= 320; i += 10) x.lineTo(i, 128 + Math.sin(i * 0.03) * 12 + Math.sin(i * 0.11) * 4); x.lineTo(320, 200); x.lineTo(0, 200); x.fill();
        x.fillStyle = '#240a26'; x.fillRect(236, 96, 56, 36); for (let i = 236; i < 292; i += 6) x.fillRect(i, 92, 4, 4); x.fillRect(242, 80, 12, 20); x.fillRect(274, 76, 12, 24); for (const t of [242, 274]) for (let i = 0; i < 3; i++) x.fillRect(t + i * 4, 76 - (t === 274 ? 4 : 0), 3, 3);
        P(x, '#5a3a10', 280, 60, 1, 18); P(x, COLS[1].c, 281, 60, 8, 5); P(x, '#ffd860', 258, 112, 3, 4); P(x, '#ffd860', 266, 104, 3, 4);
        x.fillStyle = '#10060c'; x.beginPath(); x.moveTo(0, 168); for (let i = 0; i <= 320; i += 8) x.lineTo(i, 160 + Math.sin(i * 0.05 + 1) * 6); x.lineTo(320, 200); x.lineTo(0, 200); x.fill();
        for (let i = 0; i < 34; i++) {
          const bx = 8 + i * 9 + Math.floor(rnd2() * 5) - (i > 17 ? 150 : 0), by = 172 + Math.floor(rnd2() * 12) + (i > 17 ? 10 : 0);
          if (bx > 200) continue;
          P(x, '#140810', bx, by, 6, 8); P(x, '#1a0c14', bx + 1, by - 5, 5, 5); P(x, '#2a1420', bx + 1, by - 6, 5, 1);
          if (i % 3 === 0) { P(x, '#2a1a0a', bx + 6, by - 12, 1, 14); P(x, i % 2 ? COLS[0].c : '#ffd400', bx + 7, by - 12, 6, 4); } else if (i % 3 === 1) { P(x, '#5a3a10', bx + 6, by - 16, 1, 18); P(x, '#ccc', bx + 5, by - 18, 3, 2); } else { P(x, '#222', bx + 6, by - 9, 1, 6); P(x, '#888', bx + 5, by - 11, 3, 3); }
        }
      });
      c.className = 'dg-rts-bg'; return c;
    }
    function showTitle() {
      if (NET && !NET.s.ended) { netLeave(); return; }
      scene = 'title'; S = null; showGame(false); U.sel = []; cancelMode();
      G.setTitle('Age of Jackpires II' + (G.demo ? ' (Demo)' : ''));
      G.status(G.demo ? 'DEMO VERSION - full version in the shops ' + D.longDate(D.GAMES.rts.rel) : 'Age of Jackpires II: The Age of Jacks - Big Jack Studios');
      const hasSave = [1, 2, 3].some(n => G.load('slot' + n, null));
      const o = overlay('', `<div class="dg-rts-logo">AGE OF JACKPIRES II<span>THE AGE OF JACKS</span></div><div class="dg-rts-menu" style="margin-top:12px;gap:5px">
        <button class="dg-rts-mb${SEEN.tut ? '' : ' hot'}" data-m="learn">Learning Campaign${SEEN.tut ? '' : '<small>New? Start here!</small>'}</button>
        <button class="dg-rts-mb" data-m="camp">Campaign</button><button class="dg-rts-mb" data-m="new">Skirmish</button>
        <button class="dg-rts-mb" data-m="online" ${G.demo ? 'disabled' : ''}>Play Online${G.demo ? '<small>Full version only</small>' : ''}</button>
        <button class="dg-rts-mb" data-m="load" ${hasSave ? '' : 'disabled'}>Load Saved Game</button><button class="dg-rts-mb" data-m="help">How to Play</button><button class="dg-rts-mb" data-m="opts">Options</button><button class="dg-rts-mb" data-m="quit">Quit</button></div><div class="dg-rts-foot">${G.demo ? 'PLAYABLE DEMO &middot; ' : ''}&copy; 1999 Big Jack Studios. All rights reserved. Version 1.1. Disc borrowed from Callum (GIVE IT BACK).</div>`);
      o.insertBefore(titleBg(), o.firstChild);
      o.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => {
        G.sfx('button'); const m = b.dataset.m;
        if (m === 'learn') startScen(0); else if (m === 'camp') campaignScreen(); else if (m === 'new') setupScreen(); else if (m === 'online') goOnline();
        else if (m === 'load') loadScreen(showTitle); else if (m === 'help') helpScreen(showTitle); else if (m === 'opts') optScreen(showTitle); else G.quit();
      }));
      if (OPT.music && G.sound) G.music('aow2');
    }
    function goOnline() {
      if (!window.MP) { G.msg('Age of Jackpires II', 'Online play isn\'t available right now.', 'info'); return; }
      D.playOnline('rts.online', { note: '' });
    }
    function campaignScreen() {
      const o = overlay('dim', `<div class="dg-rts-panel"><h2>Campaign: The Jackland Chronicles</h2><p style="margin:0 0 6px;text-align:center">Win each battle to unlock the next. Your progress is remembered.</p><div class="dg-rts-sl"></div><div class="dg-rts-row"><button class="dg-rts-mb" data-x="back">Back</button></div></div>`, showTitle);
      o.insertBefore(titleBg(), o.firstChild);
      const box = o.querySelector('.dg-rts-sl');
      SCEN.forEach((sc, i) => {
        const open = scenOpen(i) && !(G.demo && i > 1), won = !!SEEN.camp[sc.id] || (i === 0 && SEEN.tut === 2);
        const b = el('button', 'dg-rts-scen', `<div><b>${i + 1}. ${esc(sc.n)}</b>${esc(sc.d)}<br><small><i>${esc(MAPS[sc.mi].n)} &middot; ${sc.pl().length} players</i></small></div><span class="st" style="color:${won ? '#0a6a0a' : open ? '#5a1a00' : '#666'}">${won ? '&#10004; Won' : open ? 'Play!' : 'Locked'}</span>`);
        b.type = 'button'; b.disabled = !open;
        b.addEventListener('click', () => { G.sfx('button'); closeOv(); startScen(i); });
        box.appendChild(b);
      });
      o.querySelector('[data-x=back]').addEventListener('click', () => { G.sfx('click'); showTitle(); });
    }
    function selHtml(cls, opts, cur, dis) { return `<select class="${cls}"${dis ? ' disabled' : ''}>${opts.map(([v, n, d]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}${d ? ' disabled' : ''}>${esc(n)}</option>`).join('')}</select>`; }
    const TEAMS = [[0, 'No team'], [1, 'Team 1'], [2, 'Team 2'], [3, 'Team 3'], [4, 'Team 4']];
    const COLOPTS = () => COLS.map((c, i) => [i, c.n]), CIVOPTS = () => CIVS.map((c, i) => [i, c.n]);
    function setupScreen() {
      const L = Object.assign({ mi: 0, seats: [{ k: 'me', col: 0, team: 0, civ: 0 }, { k: 0, col: 1, team: 0, civ: 1 }, { k: 'x', col: 2, team: 0, civ: 2 }, { k: 'x', col: 3, team: 0, civ: 3 }] }, G.load('sk', {}));
      if (!Array.isArray(L.seats) || L.seats.length !== 4) L.seats = [{ k: 'me', col: 0, team: 0, civ: 0 }, { k: 0, col: 1, team: 0, civ: 1 }, { k: 'x', col: 2, team: 0, civ: 2 }, { k: 'x', col: 3, team: 0, civ: 3 }];
      if (!MAPS[L.mi] || (G.demo && L.mi)) L.mi = 0;
      const o = overlay('dim', `<div class="dg-rts-panel"><h2>Skirmish</h2><h3>Choose a map</h3><div class="dg-rts-cards dg-rts-maps" style="grid-template-columns:repeat(4,1fr)"></div><h3>Players</h3><div class="dg-rts-seats"></div><p style="margin:4px 0 0;font-size:11px">Give players the same team to make them allies. Two teams of two is a 2v2. No teams is every man for himself.</p><div class="dg-rts-row"><button class="dg-rts-mb" data-x="go">Start Game</button><button class="dg-rts-mb" data-x="back">Cancel</button></div></div>`, showTitle);
      o.insertBefore(titleBg(), o.firstChild);
      const maps = o.querySelector('.dg-rts-maps'), seats = o.querySelector('.dg-rts-seats');
      if (root.classList.contains('dg-rts-ph')) maps.style.gridTemplateColumns = '1fr 1fr';
      MAPS.forEach((m, i) => {
        const b = el('button', 'dg-rts-card', `<b>${esc(m.n)}</b><small>${esc(m.d)}</small>${G.demo && i ? '<br><i>(full version only)</i>' : ''}`); b.type = 'button'; b.disabled = G.demo && i > 0;
        const prev = mk(96, 96, x => { const g = genMap(i, 42 + i); for (let y = 0; y < 48; y++) for (let xx = 0; xx < 48; xx++) { const j = y * MW + xx; P(x, g.resT[j] === 1 ? m.tree[0] : g.resT[j] === 2 ? '#c8304a' : g.resT[j] === 3 ? '#1ac83a' : g.terr[j] === 2 ? m.water : g.terr[j] === 1 ? m.dirt : m.grass[0], xx * 2, y * 2, 2, 2); } });
        prev.style.height = 'auto'; b.insertBefore(prev, b.firstChild);
        b.addEventListener('click', () => { L.mi = i; G.sfx('click'); draw(); }); maps.appendChild(b);
      });
      const draw = () => {
        [...maps.children].forEach((b, i) => b.classList.toggle('on', i === L.mi));
        seats.innerHTML = '';
        L.seats.forEach((st, i) => {
          const row = el('div', 'dg-rts-seat' + (st.k === 'me' ? ' me' : ''));
          const kind = st.k === 'me' ? `<b>${esc(playerName())} (you)</b>` : selHtml('k', [['x', 'Closed'], [0, 'Computer: Easy'], [1, 'Computer: Normal', G.demo], [2, 'Computer: Hard', G.demo]], st.k);
          row.innerHTML = `<span class="sw" style="background:${st.k === 'x' ? 'transparent' : COLS[st.col].c}"></span>${kind}${st.k === 'x' ? '<span></span><span></span><span></span><span></span>' : selHtml('col', COLOPTS(), st.col) + selHtml('team', TEAMS, st.team) + `<span class="civ">${selHtml('civ', CIVOPTS(), st.civ)}</span><span></span>`}`;
          row.querySelectorAll('select').forEach(s => s.addEventListener('change', () => { const v = s.value; if (s.className === 'k') st.k = v === 'x' ? 'x' : +v; else st[s.className] = +v; G.sfx('click'); draw(); }));
          seats.appendChild(row);
        });
        const n = L.seats.filter(s => s.k !== 'x').length;
        o.querySelector('[data-x=go]').disabled = n < 2;
      };
      draw();
      o.querySelector('[data-x=go]').addEventListener('click', () => {
        const act = L.seats.filter(s => s.k !== 'x');
        const sides = new Set(act.map((s, i) => s.team || 10 + i)); if (sides.size < 2) { G.msg('Skirmish', 'Everybody is on the same team! Somebody has to be the enemy.', 'info'); return; }
        G.sfx('button'); G.save('sk', L);
        const used = {}; const pl = act.map((s, i) => { const lvl = s.k === 'me' ? -1 : s.k, names = lvl >= 0 ? [FOES[lvl].n].concat(EXTRA_AI[lvl]) : []; let name = playerName(), fi = -1; if (lvl >= 0) { const j = used[lvl] = (used[lvl] || 0); used[lvl]++; name = names[j % names.length]; fi = j === 0 ? lvl : -1; } return { name, col: s.col, ally: s.team || 10 + i, civ: s.civ, ai: lvl, fi }; });
        const me = pl.findIndex(p => p.ai < 0);
        closeOv(); newGame({ mi: L.mi, pl, me });
        if (!SEEN.tut && !SEEN.hint) { SEEN.hint = 1; saveSeen(); G.timer(() => { if (S && !S.over && !S.online) advisor('Sir Reginald, Royal Advisor', 'First time? Gather Food, Wood and Rupees with your Villagers, build Houses and a Barracks, then flatten every enemy Town Centre. The Learning Campaign on the title screen shows you how, step by step.', { auto: 16000 }); }, 800); }
      });
      o.querySelector('[data-x=back]').addEventListener('click', () => { G.sfx('click'); showTitle(); });
    }
    function loadScreen(back) {
      const o = overlay('dim', `<div class="dg-rts-panel"><h2>Load Saved Game</h2><div class="dg-rts-slots"></div><div class="dg-rts-row"><button class="dg-rts-mb" data-x="back">Cancel</button></div></div>`, back);
      if (!S) o.insertBefore(titleBg(), o.firstChild);
      const box = o.querySelector('.dg-rts-slots');
      [1, 2, 3].forEach(n => {
        const s = G.load('slot' + n, null);
        const b = el('button', 'dg-rts-slot', s ? `<b>Slot ${n}</b><span>${esc(s.name)}<br><small>Saved ${esc(s.when)}</small></span>` : `<b>Slot ${n}</b><span><i>Empty</i></span>`); b.type = 'button'; b.disabled = !s;
        b.addEventListener('click', () => { G.sfx('button'); try { closeOv(); loadData(s.d); } catch (e) { console.error(e); G.msg('Age of Jackpires II', 'That saved game is corrupt. (Did Dave save over it?)', 'warn'); showTitle(); } });
        box.appendChild(b);
      });
      o.querySelector('[data-x=back]').addEventListener('click', () => { G.sfx('click'); back(); });
    }
    function saveScreen() {
      S.paused = true;
      const o = overlay('dim', `<div class="dg-rts-panel"><h2>Save Game</h2><div class="dg-rts-slots"></div><div class="dg-rts-row"><button class="dg-rts-mb" data-x="back">Cancel</button></div></div>`, closeOv);
      const box = o.querySelector('.dg-rts-slots');
      [1, 2, 3].forEach(n => {
        const s = G.load('slot' + n, null);
        const b = el('button', 'dg-rts-slot', `<b>Slot ${n}</b><span>${s ? esc(s.name) + '<br><small>Saved ' + esc(s.when) + ' (will be overwritten)</small>' : '<i>Empty</i>'}</span>`); b.type = 'button';
        b.addEventListener('click', () => { saveSlot(n); closeOv(); });
        box.appendChild(b);
      });
      o.querySelector('[data-x=back]').addEventListener('click', () => { G.sfx('click'); closeOv(); });
    }
    function helpScreen(back) {
      const o = overlay('dim', `<div class="dg-rts-panel"><h2>How to Play</h2>
<p><b>Goal:</b> flatten every enemy Town Centre before they flatten yours. (New? Play the <b>Learning Campaign</b> from the title screen: Sir Reginald shows you everything.)</p>
<h3>Mouse</h3><p>Left-click to select (drag a box for lots, Shift adds, double-click selects all of a type). <b>Right-click</b> to move, gather, build, repair or attack. Arrow keys, the screen edges or the minimap to look around.</p>
<h3>Toolbar buttons</h3><p>Click your units to select them, then click where they should go (or click a tree, bush, Rupee mine or enemy). Drag to look around. <b>Box</b> drag-selects, <b>Army</b> grabs every soldier, <b>Idle</b> finds a lazy Villager.</p>
<h3>Getting started</h3><p>1. Put Villagers on berry bushes, trees and the Rupee mine. 2. Train more Villagers at the Town Centre. 3. Build Houses (+5 population each) and a Stockpile by the trees. 4. Build a Barracks: train Warriors, Spearmen and Archers. 5. A Blacksmith makes them better. 6. Advance to the Castle Age for Riders and Catapults. 7. Charge!</p>
<h3>Who beats who</h3><p><b>Spearmen</b> beat Riders. <b>Riders</b> beat Archers and Catapults. <b>Archers</b> beat Spearmen and Warriors. <b>Warriors</b> are good all-rounders and smash Spearmen, Catapults and buildings. <b>Catapults</b> flatten buildings.</p>
<h3>Civilisations</h3><p>${CIVS.map(c => `<b>${esc(c.n)}:</b> ${esc(c.d)}`).join(' &middot; ')}</p>
<p><i>Callum says there are cheat codes you type into the chat. He won't say what they are. "Something about shiny Rupees," he said, then laughed for ages.</i></p>
<div class="dg-rts-row"><button class="dg-rts-mb" data-x="keys">Keys</button><button class="dg-rts-mb" data-x="back">OK</button></div></div>`, back);
      if (!S) o.insertBefore(titleBg(), o.firstChild);
      o.querySelector('[data-x=back]').addEventListener('click', () => { G.sfx('click'); back(); });
      o.querySelector('[data-x=keys]').addEventListener('click', () => { G.sfx('click'); keysScreen(() => helpScreen(back)); });
    }
    const KEYS = [['Left click / drag', 'Select / box-select'], ['Right click', 'Move, gather, build, repair, attack'], ['Q W E R T Y U I', 'The buttons in the bottom-right, in order (the little letters)'], ['A then click', 'Attack-move: walk there and fight anything on the way'], ['S', 'Stop'], ['G then click', 'Set a rally point for the selected building'], ['H', 'Find your Town Centre'], ['. (full stop)', 'Next idle Villager'], [', (comma)', 'Select your whole army'], ['Ctrl+1 to 9', 'Make a control group'], ['Shift+1 to 9', 'Add to a control group'], ['1 to 9', 'Select a group (press twice to look at it)'], ['Space', 'Look at what\'s selected'], ['Arrow keys', 'Scroll the map'], ['Shift+click', 'Add to / take away from the selection'], ['Double-click', 'Select all of that type on screen'], ['Esc', 'Cancel / deselect'], ['P', 'Pause (not online)'], ['Enter', 'Chat (and cheats...)'], ['?', 'This list'], ['F10', 'Game menu']];
    function keysScreen(back) {
      if (S && scene === 'game' && !NET) S.paused = true;
      const o = overlay('dim', `<div class="dg-rts-panel" style="max-width:460px"><h2>Keys</h2><table class="dg-rts-keys">${KEYS.map(([k, d]) => `<tr><td>${esc(k)}</td><td>${esc(d)}</td></tr>`).join('')}</table><div class="dg-rts-row"><button class="dg-rts-mb" data-x="back">OK</button></div></div>`, back);
      if (!S) o.insertBefore(titleBg(), o.firstChild);
      o.querySelector('[data-x=back]').addEventListener('click', () => { G.sfx('click'); back(); });
    }
    function optScreen(back) {
      const o = overlay('dim', `<div class="dg-rts-panel"><h2>Options</h2><h3>Game speed${NET ? ' (online games are always Normal)' : ''}</h3><div class="dg-rts-cards dg-rts-sp"></div><h3>Zoom</h3><div class="dg-rts-cards dg-rts-zm"></div><h3>Music</h3><div class="dg-rts-cards dg-rts-mu"></div><h3>Sir Reginald's tips</h3><div class="dg-rts-cards dg-rts-tp"></div><p><small>Sound effects and music need the sound turned on (the speaker by the clock).</small></p><div class="dg-rts-row"><button class="dg-rts-mb" data-x="back">OK</button></div></div>`, back);
      if (!S) o.insertBefore(titleBg(), o.firstChild);
      const group = (sel, items, get, set) => { const box = o.querySelector(sel); const draw = () => { box.innerHTML = ''; items.forEach(([v, n]) => { const b = el('button', 'dg-rts-card' + (get() === v ? ' on' : ''), `<b>${esc(n)}</b>`); b.type = 'button'; b.addEventListener('click', () => { set(v); saveOpt(); G.sfx('click'); draw(); }); box.appendChild(b); }); }; draw(); };
      group('.dg-rts-sp', [[0.7, 'Slow'], [1, 'Normal'], [1.6, 'Fast (Callum speed)']], () => OPT.speed, v => { OPT.speed = v; });
      group('.dg-rts-zm', [[2, 'Close up'], [1, 'Far away']], () => OPT.zoom, v => setZoom(v));
      group('.dg-rts-mu', [[true, 'On'], [false, 'Off']], () => OPT.music, v => { OPT.music = v; if (v && G.sound) G.music('aow2'); else G.stopMusic(); });
      group('.dg-rts-tp', [[true, 'On'], [false, 'Off']], () => OPT.tips, v => { OPT.tips = v; });
      o.querySelector('[data-x=back]').addEventListener('click', () => { G.sfx('click'); back(); });
    }
    function setZoom(v) { const c = S ? { x: (U.cam.x + cv.width / 2) / TSZ(), y: (U.cam.y + cv.height / 2) / TSZ() } : null; OPT.zoom = v; saveOpt(); if (c) centerOn(c.x, c.y); }
    function gameMenu() {
      if (!S || S.over) return;
      if (!NET) S.paused = true;
      const on = !!NET;
      const o = overlay('dim', `<div class="dg-rts-panel" style="max-width:300px"><h2>Game Menu</h2><div class="dg-rts-menu" style="margin:0 auto;width:100%"><button class="dg-rts-mb" data-x="resume">Resume Game</button>${on ? '' : '<button class="dg-rts-mb" data-x="save">Save Game</button><button class="dg-rts-mb" data-x="load">Load Game</button>'}<button class="dg-rts-mb" data-x="opts">Options</button><button class="dg-rts-mb" data-x="help">How to Play</button><button class="dg-rts-mb" data-x="keys">Keys</button>${S.me >= 0 && !S.pl[S.me].out ? '<button class="dg-rts-mb" data-x="quit">Resign</button>' : ''}${on ? '<button class="dg-rts-mb" data-x="leave">Leave the online game</button>' : ''}</div></div>`, closeOv);
      o.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', () => {
        G.sfx('button'); const x = b.dataset.x;
        if (x === 'resume') closeOv(); else if (x === 'save') saveScreen(); else if (x === 'load') loadScreen(gameMenu); else if (x === 'opts') optScreen(gameMenu); else if (x === 'help') helpScreen(gameMenu); else if (x === 'keys') keysScreen(gameMenu);
        else if (x === 'leave') G.msg('Leave', 'Leave this online game? The computer will look after your town.', 'q', [['Leave', () => { closeOv(); netLeave(); }], ['Stay']]);
        else G.msg('Resign', 'Are you sure you want to resign? Your Villagers will be very disappointed.', 'q', [['Resign', () => { closeOv(); if (NET) issue({ c: 'rsg' }); else { AS.clear(); exec(S.me, { c: 'rsg' }); checkEnd(); } }], ['Keep playing', () => {}]]);
      }));
    }
    function endGame(side) {
      if (S.over) return;
      S.over = true; S.winner = side; cancelMode();
      const me = S.me, win = me >= 0 && S.pl[me].ally === side, cheated = !!S.cheats.win, sc = S.scen && SCEN_BY[S.scen.id];
      const winners = S.pl.map((P, p) => p).filter(p => S.pl[p].ally === side);
      if (win && !cheated) {
        G.secret('rts.win');
        if (!S.online && S.pl.some((P, p) => meFoe(p) && P.ai === 2) && !sc) G.secret('rts.hard');
        if (sc) { SEEN.camp[sc.id] = 1; if (sc.tut) { SEEN.tut = 2; G.secret('rts.tutor'); } if (SCEN.every(x => SEEN.camp[x.id])) G.secret('rts.chronicle'); saveSeen(); }
        if (S.online) G.secret('rts.online');
      }
      if (sc && sc.tut) { SEEN.tut = SEEN.tut || 1; saveSeen(); }
      if (NET) netOver(side);
      G.sfx(win ? 'solve' : me < 0 ? 'click' : 'uhoh'); if (win) snd('fanfare');
      try { AS.now(); } catch (e) {}
      G.timer(() => { if (S && S.over) endScreen(side, win, cheated, sc, winners); }, 1800);
    }
    function endScreen(side, win, cheated, sc, winners) {
      const me = S.me, st = S.stats, F = (S.pl.find((P, p) => P.foe && meFoe(p)) || {}).foe;
      const head = me < 0 ? `${winners.map(p => esc(pName(p))).join(' and ')} win${winners.length === 1 ? 's' : ''}!` : win ? 'VICTORY!' : 'DEFEAT';
      let text;
      if (sc) text = esc(win ? sc.win : sc.lose);
      else if (me < 0) text = 'Good game, everybody.';
      else if (win) text = cheated ? 'You won! (Well. The enemy Town Centres fell over by themselves. Nobody saw anything.)' : `Every enemy Town Centre lies in ruins. ${F ? esc(F.lose) : ''}`;
      else text = `${S.pl[me].why === 'rsg' ? 'You resigned.' : S.pl[me].out ? 'Your last Town Centre has been flattened.' : 'Your side has lost.'} ${F && winners.some(p => S.pl[p].foe === F) ? esc(F.win) : ''}`;
      const cols = S.pl.map((P, p) => `<th style="background:${COLS[P.col].d}">${esc(P.name)}${p === me ? ' (you)' : ''}</th>`).join('');
      const row = (n, f) => `<tr><td>${n}</td>${S.pl.map((P, p) => `<td>${f(p)}</td>`).join('')}</tr>`;
      const next = sc && win && SCEN[sc.i + 1] ? SCEN[sc.i + 1] : null;
      const btns = NET ? (NET.s.host ? '<button class="dg-rts-mb" data-x="lobby">Back to the lobby</button><button class="dg-rts-mb" data-x="leave">Leave</button>' : `<p style="width:100%;text-align:center;margin:0">Waiting for ${esc(NET.s.nick(NET.s.hostId))} to set up another game...</p><button class="dg-rts-mb" data-x="leave">Leave</button>`)
        : `${next ? '<button class="dg-rts-mb" data-x="next">Next battle</button>' : ''}<button class="dg-rts-mb" data-x="again">${sc ? 'Try again' : 'Play Again'}</button><button class="dg-rts-mb" data-x="title">Main Menu</button>`;
      const o = overlay('dim', `<div class="dg-rts-panel"><h2 style="font-size:30px">${head}</h2><p style="text-align:center">${text}</p>
<div style="overflow:auto"><table class="dg-rts-stats"><tr><th></th>${cols}</tr>
${row('Result', p => (S.pl[p].ally === side ? '<b style="color:#0a6a0a">Won</b>' : 'Lost'))}${row('Units trained', p => st[p].trained)}${row('Kills', p => st[p].kills)}${row('Losses', p => st[p].lost)}
${row('Food gathered', p => Math.floor(st[p].gath.f))}${row('Wood gathered', p => Math.floor(st[p].gath.w))}${row('Rupees gathered', p => Math.floor(st[p].gath.t))}${row('Age', p => AGEN[S.age[p]])}
<tr><td>Game time</td><td colspan="${S.np}">${fmtT(S.time)} &middot; ${esc(MAPS[S.mi].n)}${sc ? ' &middot; ' + esc(sc.n) : ''}</td></tr></table></div>
<div class="dg-rts-row">${btns}</div></div>`);
      const on = (x, fn) => { const b = o.querySelector(`[data-x=${x}]`); if (b) b.addEventListener('click', () => { G.sfx('button'); fn(); }); };
      on('again', () => { if (sc) { closeOv(); startScen(sc.i); } else { const cfg = { mi: S.mi, pl: S.pl.map(P => ({ name: P.name, col: P.col, ally: P.ally, civ: P.civ, ai: P.was ? -1 : P.ai, fi: P.fi })), me: S.me }; closeOv(); newGame(cfg); } });
      on('next', () => { closeOv(); startScen(sc.i + 1); });
      on('title', () => showTitle());
      on('lobby', () => netBackToLobby());
      on('leave', () => netLeave());
    }
    function startPlay() {
      scene = 'game'; closeOv(); showGame(true); U.sel = []; U.selRes = null; cancelMode(); cardKey = ''; msgs.innerHTML = ''; U.groups = {}; tutKey = '';
      objEl.style.display = ''; objEl.classList.remove('min'); fit(); updVis(); S.miniDirty = true;
      G.setTitle('Age of Jackpires II' + (G.demo ? ' (Demo)' : '') + ' - ' + (S.scen && SCEN_BY[S.scen.id] ? SCEN_BY[S.scen.id].n : MAPS[S.mi].n));
      if (OPT.music && G.sound) G.music('aow2'); else G.stopMusic();
    }
    // the objectives box (top right)
    let objH = '';
    function objectives() {
      const sc = S.scen && SCEN_BY[S.scen.id];
      let h = '';
      if (S.tut && !S.tut.skip && TUT[S.tut.i]) h = `<b>Learning Campaign</b><div>Step ${S.tut.i + 1} of ${TUT.length}</div>`;
      else if (sc && sc.obj) h = `<b>${esc(sc.n)}</b>` + sc.obj().map(t => `<div>${esc(t)}</div>`).join('');
      else h = `<b>Objective: flatten every enemy Town Centre</b>`;
      if (!(S.tut && !S.tut.skip)) h += S.pl.map((P, p) => `<div class="${P.out ? 'out' : ''}"><i style="background:${COLS[P.col].c}"></i>${esc(P.name)}${p === S.me ? ' (you)' : S.me >= 0 && friend(p, S.me) ? ' (ally)' : ''}${P.was || (S.online && P.ai >= 0) ? ' <small>(computer)</small>' : ''}${NET && NET.lostSeat === p ? ' <small style="color:#ffb000">(reconnecting)</small>' : ''}</div>`).join('');
      if (h !== objH) { objH = h; objEl.innerHTML = h; }
    }

    // ================================================================ ONLINE: lockstep with turns numbered by the host
    // The host's computer is the referee. Everybody runs the same simulation from the same seed; the host says which
    // commands happen on which turn (a turn is K steps of 0.05 s), and nobody runs a turn until it has arrived.
    //  host -> all     { k:'lob', ph, lob }                    the seats (before a game)
    //                  { k:'go', ep, seed, K, rd, lob }        the game starts (everybody builds the same world)
    //                  { k:'t', ep, t, c:[cmds of t, of t+1...] }  turns (each command [seat, {c:...}]; -1 = the host itself)
    //                  { k:'sc', ep, id, i, n, p }             a snapshot in chunks (late arrivals, reloads, a desync)
    //                  { k:'pz', who, n, s }                   paused: who dropped and the seconds left (who 0 = carry on)
    //  player -> host  { k:'ls', col, team, civ, ready }        my seat choices
    //                  { k:'c', ep, c:[...] }                  my commands      { k:'a', ep, t, ht, h }  how far I've got (+ a hash)
    //                  { k:'rq', ep, t }  resend turns from t     { k:'hi', ep, t }  I'm (back) here: catch me up
    //  anyone -> all   { k:'ch', txt }                         chat
    const myId = () => (window.Net && Net.me ? Net.me.id : 0);
    const isOcc = st => !!st && (st.ai >= 0 || (st.ai === -1 && !!st.id));
    const seatOf = id => (S && id ? S.pl.findIndex(P => P.id === id) : -1);
    function mkNet(s) {
      return { s, ph: 'lobby', lob: null, ep: '', K: 4, T: 0, sin: 0, turns: new Map(), racc: 0, lastTurnAt: Date.now(), lastRq: 0, out: [], outAt: 0, chunks: new Map(), chunkAt: 0, pz: null, lastAck: 0, lastHash: null,
        pend: [], issued: -1, iacc: 0, log: new Map(), acks: new Map(), hashes: new Map(), snapWant: new Set(), specT: new Map(), cq: [], tokens: 30, tokAt: performance.now(), lastSave: 0, pause: null, aiTook: new Map(), known: new Set(), lastResync: new Map(), desyncs: 0, waitFor: 0, startAt: Date.now(), lastPz: 0 };
    }
    function freshLob() {
      const seats = [0, 1, 2, 3].map(i => ({ id: 0, ai: i === 0 ? -1 : i === 1 ? -2 : -3, name: '', col: i, team: 0, civ: i, ready: false }));
      seats[0].id = myId(); seats[0].name = nclean(Net.me.nick, 20) || 'Host'; seats[0].ready = true;
      return { mi: 0, seats };
    }
    function okLob(l) {
      if (!l || typeof l !== 'object' || !Array.isArray(l.seats) || l.seats.length !== 4) return null;
      return { mi: MAPS[l.mi] ? l.mi | 0 : 0, seats: l.seats.map((st, i) => ({ id: st && Number.isInteger(st.id) ? st.id : 0, ai: st && [-3, -2, -1, 0, 1, 2].includes(st.ai) ? st.ai : -3, name: nclean(st && st.name, 20), col: clamp(st && st.col | 0, 0, COLS.length - 1), team: clamp(st && st.team | 0, 0, 4), civ: clamp(st && st.civ | 0, 0, CIVS.length - 1), ready: !!(st && st.ready), i })) };
    }
    const freeCol = st => { const used = NET.lob.seats.filter(x => x !== st && isOcc(x)).map(x => x.col); if (!used.includes(st.col)) return st.col; for (let i = 0; i < COLS.length; i++) if (!used.includes(i)) return i; return st.col; };
    function nameAIs() { const used = {}; for (const st of NET.lob.seats) if (st.ai >= 0) { const j = used[st.ai] = (used[st.ai] || 0); used[st.ai]++; const names = [FOES[st.ai].n].concat(EXTRA_AI[st.ai]); st.name = names[j % names.length]; st.ready = true; } }
    // the host: everybody in the session gets a seat while there is one (the rest watch)
    function seatPeople() {
      const L = NET.lob, s = NET.s, here = s.humans().filter(p => !s.left.has(p.id) && !s.gone.has(p.id));
      for (const st of L.seats) if (st.ai === -1 && st.id && !here.some(p => p.id === st.id)) { st.ai = -2; st.id = 0; st.name = ''; st.ready = false; }
      for (const p of here) {
        if (L.seats.some(st => st.ai === -1 && st.id === p.id)) continue;
        const st = L.seats.find(x => x.ai === -2) || L.seats.find(x => x.ai === -3); if (!st) continue;
        st.ai = -1; st.id = p.id; st.name = nclean(p.nick, 20) || 'Player'; st.ready = p.id === myId(); st.col = freeCol(st);
      }
    }
    function pushLob(to) { if (NET && NET.s.host) NET.s.send({ k: 'lob', ph: NET.ph, lob: NET.lob }, to); }
    function canStart() {
      const L = NET.lob, occ = L.seats.filter(isOcc);
      if (occ.length < 2) return 'You need at least two seats filled (people or computer players).';
      if (new Set(occ.map((st, i) => st.team || 10 + i)).size < 2) return 'Everybody is on the same team! Somebody has to be the enemy.';
      if (new Set(occ.map(st => st.col)).size < occ.length) return 'Two seats have the same colour.';
      const nr = occ.filter(st => st.ai === -1 && !st.ready); if (nr.length) return `Waiting for ${nr.map(st => st.name).join(', ')} to press Ready.`;
      return '';
    }
    function netLobby() {
      if (!NET) return;
      scene = 'lobby'; S = null; showGame(false); NET.ph = NET.ph === 'end' ? 'lobby' : NET.ph;
      const s = NET.s, L = NET.lob, host = s.host, me = myId();
      G.setTitle('Age of Jackpires II - Online');
      if (!L) { overlay('dim', `<div class="dg-rts-panel" style="max-width:340px;text-align:center"><h2>Age of Jackpires II Online</h2><p>Dialling ${esc(s.nick(s.hostId))}'s computer... (3.6 KB/sec, please wait)</p><div class="dg-rts-row"><button class="dg-rts-mb" data-x="leave">Leave</button></div></div>`).querySelector('[data-x=leave]').addEventListener('click', netLeave); return; }
      const watchers = s.humans().filter(p => !L.seats.some(st => st.ai === -1 && st.id === p.id) && !s.left.has(p.id) && !s.gone.has(p.id));
      const why = host ? canStart() : '';
      const o = overlay('dim', `<div class="dg-rts-panel"><h2>Age of Jackpires II Online</h2><p style="text-align:center;margin:0 0 6px">${host ? 'You are the host. Fill the seats with people or computer players, pick a map, then Start!' : `${esc(s.nick(s.hostId))} is the host. Pick your colour, team and civilisation, then press Ready.`}</p>
        <h3>Map</h3><div class="ms"></div><h3>Seats</h3><div class="seats"></div>${watchers.length ? `<p style="margin:2px 0"><small>Watching: ${watchers.map(p => esc(p.nick)).join(', ')}</small></p>` : ''}
        <p style="font-size:11px;margin:4px 0 0">Same team = allies (two teams of two is a 2v2). No team = everybody for themselves. Anybody who turns up after the start gets to watch.</p>${why ? `<p style="font-size:11px;margin:4px 0 0;color:#8a1a00;text-align:center">${esc(why)}</p>` : ''}
        <div class="dg-rts-row"></div></div>`);
      const ms = o.querySelector('.ms');
      if (host) { ms.innerHTML = selHtml('mi', MAPS.map((m, i) => [i, m.n]), L.mi) + ` <small>${esc(MAPS[L.mi].d)}</small>`; ms.querySelector('select').addEventListener('change', ev => { L.mi = +ev.target.value; G.sfx('click'); pushLob(); netLobby(); }); }
      else ms.innerHTML = `<b>${esc(MAPS[L.mi].n)}</b> <small>${esc(MAPS[L.mi].d)}</small>`;
      const box = o.querySelector('.seats');
      L.seats.forEach((st, i) => {
        const mine = st.ai === -1 && st.id === me, canEdit = mine || (host && st.ai >= 0), occ = isOcc(st);
        const row = el('div', 'dg-rts-seat' + (mine ? ' me' : ''));
        let kind;
        if (st.ai === -1 && st.id) kind = `<span><b>${esc(st.name)}</b>${st.id === s.hostId ? ' <small>(host)</small>' : ''}${mine ? ' <small>(you)</small>' : ''}${s.lost.has(st.id) ? ' <small style="color:#a06000">reconnecting...</small>' : ''}</span>`;
        else if (host) kind = selHtml('k', [[-2, 'Open (for a person)'], [-3, 'Closed'], [0, 'Computer: Easy'], [1, 'Computer: Normal'], [2, 'Computer: Hard']], st.ai);
        else kind = st.ai >= 0 ? `<span><b>${esc(st.name)}</b> <small>(computer)</small></span>` : `<i>${st.ai === -2 ? 'Open' : 'Closed'}</i>`;
        const ready = !occ ? '<span></span>' : st.ai >= 0 || st.ready ? '<span class="rd">&#10004; Ready</span>' : '<span class="nr">Not ready</span>';
        row.innerHTML = `<span class="sw" style="background:${occ ? COLS[st.col].c : 'transparent'}"></span>${kind}${occ ? selHtml('col', COLOPTS().map(([v, n]) => [v, n, L.seats.some(x => x !== st && isOcc(x) && x.col === v)]), st.col, !canEdit) + selHtml('team', TEAMS, st.team, !canEdit) + `<span class="civ">${selHtml('civ', CIVOPTS(), st.civ, !canEdit)}</span>` : '<span></span><span></span><span class="civ"></span>'}${ready}`;
        row.querySelectorAll('select').forEach(x => x.addEventListener('change', () => {
          G.sfx('click'); const v = +x.value, k = x.className;
          if (k === 'k') { st.ai = v; st.id = 0; st.ready = v >= 0; if (v >= 0) st.col = freeCol(st); else st.name = ''; nameAIs(); pushLob(); netLobby(); return; }
          if (host) { st[k] = v; if (k === 'col') st.col = freeCol(st); pushLob(); netLobby(); }
          else { const mineSt = Object.assign({}, st, { [k]: v }); s.send({ k: 'ls', col: mineSt.col, team: mineSt.team, civ: mineSt.civ, ready: st.ready }, s.hostId); }
        }));
        box.appendChild(row);
      });
      const bt = o.querySelector('.dg-rts-row'), btn = (t, fn, dis) => { const b = el('button', 'dg-rts-mb', esc(t)); b.type = 'button'; b.disabled = !!dis; b.addEventListener('click', () => { G.sfx('button'); fn(); }); bt.appendChild(b); return b; };
      if (host) { btn('Start!', hostStart, !!why); btn('Invite someone', () => { if (window.MP) MP.pick('rts.online'); }); }
      else { const st = L.seats.find(x => x.ai === -1 && x.id === me); if (st) btn(st.ready ? 'Not ready' : 'Ready!', () => s.send({ k: 'ls', col: st.col, team: st.team, civ: st.civ, ready: !st.ready }, s.hostId)); }
      btn('Leave', netLeave);
      G.status(host ? `Online lobby: ${L.seats.filter(isOcc).length} seat(s) filled` : `Online lobby: ${s.nick(s.hostId)} is the host`);
      if (OPT.music && G.sound) G.music('aow2');
    }
    function hostStart() {
      if (!NET || !NET.s.host) return;
      seatPeople(); nameAIs();
      const why = canStart(); if (why) { G.msg('Age of Jackpires II', why, 'info'); netLobby(); return; }
      const occ = NET.lob.seats.filter(isOcc), hn = occ.filter(st => st.ai === -1).length;
      NET.s.round++; NET.s.announce();
      const go = { k: 'go', ep: rid(), seed: (Math.random() * 4294967295) >>> 0, K: hn <= 2 ? 4 : hn === 3 ? 5 : 7, rd: NET.s.round, lob: NET.lob };
      NET.s.send(go);
      startNetGame(go);
    }
    function startNetGame(go) {
      const L = okLob(go.lob); if (!L) return;
      const occ = L.seats.filter(isOcc);
      const pl = occ.map((st, i) => ({ name: st.name, col: st.col, ally: st.team || 10 + i, civ: st.civ, ai: st.ai >= 0 ? st.ai : -1, id: st.ai >= 0 ? 0 : st.id, fi: -1 }));
      const me = pl.findIndex(p => p.id && p.id === myId());
      Object.assign(NET, { ph: 'game', lob: L, ep: go.ep, K: clamp(go.K | 0, 2, 12), T: 0, sin: 0, turns: new Map(), racc: 0, lastTurnAt: Date.now(), pz: null, issued: -1, iacc: 0, log: new Map(), pend: [], hashes: new Map(), acks: new Map(), snapWant: new Set(), specT: new Map(), cq: [], pause: null, aiTook: new Map(), known: new Set(NET.s.humans().map(p => p.id)), startAt: Date.now(), lastSave: 0, desyncs: 0 });
      if (!NET.s.host && Number.isInteger(go.rd)) NET.s.round = go.rd;
      newGame({ mi: L.mi, seed: go.seed >>> 0, pl, me, online: true });
      msg(me >= 0 ? 'Herald: The battle begins, my lord! Flatten every enemy Town Centre.' : 'You are watching this battle. Sit back and enjoy it.', '#ffd860');
      if (me < 0) G.secret('rts.watch');
      if (NET.s.host) { for (const id of specs()) NET.specT.set(id, 0); NET.s.save({ lob: L, ep: NET.ep, K: NET.K, T: 0, rd: NET.s.round, snap: snapshot() }); } else NET.s.save();
    }
    // the host takes the game back up after its page was reloaded: a new epoch, and everybody gets the snapshot
    function resumeHost(sv) {
      NET.lob = okLob(sv.lob) || freshLob(); NET.K = clamp(sv.K | 0, 2, 12); NET.ep = rid(); if (Number.isInteger(sv.rd)) NET.s.round = sv.rd;
      const me = sv.snap.pl.findIndex(p => p.id && p.id === myId());
      restore(sv.snap, me, true);
      Object.assign(NET, { ph: S.over ? 'end' : 'game', T: sv.T | 0, sin: 0, issued: (sv.T | 0) - 1, turns: new Map(), log: new Map(), pend: [], startAt: Date.now(), known: new Set(NET.s.humans().map(p => p.id)) });
      startPlay();
      const tc = S.me >= 0 ? S.ents.find(e => e.team === S.me && e.t === 'bighut') : null; if (tc) centerOn(tc.x + 1.5, tc.y + 1.5); else centerOn(MW / 2, MH / 2);
      for (const p of NET.s.others()) NET.snapWant.add(p.id);
      msg('Welcome back! Picking the battle up where you left off...', '#ffe8a0');
    }
    function netCmd(c) { if (NET.s.host) NET.pend.push([S.me, c]); else NET.out.push(c); }
    const pendSys = c => NET.pend.push([-1, c]);
    function netChat(v) {
      const txt = nclean(v, 60); if (!txt) return;
      NET.s.send({ k: 'ch', txt });
      msg(`${nclean(Net.me.nick, 20)}: ${txt}`, S && S.me >= 0 ? COLS[colOf(S.me)].l : '#fff');
    }
    // ---- the host: turns
    function canSend(n) { const t = performance.now(); NET.tokens = Math.min(36, NET.tokens + (t - NET.tokAt) / 1000 * 11); NET.tokAt = t; if (NET.tokens < (n || 1)) return false; NET.tokens -= n || 1; return true; }
    const players = () => S ? S.pl.map((P, p) => p).filter(p => S.pl[p].id && S.pl[p].id !== myId() && !S.pl[p].out) : [];
    const specs = () => NET.s.humans().filter(h => h.id !== myId() && seatOf(h.id) < 0 && !NET.s.left.has(h.id) && !NET.s.gone.has(h.id)).map(h => h.id);
    function issueTurn() {
      const t = ++NET.issued, cmds = []; let size = 0;
      while (NET.pend.length) { const x = NET.pend[0], sz = JSON.stringify(x).length; if (cmds.length && size + sz > 1050) break; cmds.push(NET.pend.shift()); size += sz; if (cmds.length >= 40) break; }
      NET.log.set(t, cmds); NET.log.delete(t - 1200);
      NET.turns.set(t, cmds);
      for (const p of players()) { const id = S.pl[p].id; if (NET.s.lost.has(id)) continue; NET.s.send({ k: 't', ep: NET.ep, t, c: [cmds] }, id); NET.tokens -= 1; }
      for (const id of specs()) { const from = NET.specT.has(id) ? NET.specT.get(id) : null; if (from == null) continue; if (t - from >= 5 && canSend()) { sendRange(id, from, t); NET.specT.set(id, t + 1); } }
    }
    function sendRange(id, a, b) {
      b = Math.min(b, a + 400);
      let t = a;
      while (t <= b) {
        const part = []; let size = 40;
        while (t <= b && NET.log.has(t)) { const c = NET.log.get(t), sz = JSON.stringify(c).length + 1; if (part.length && size + sz > 1200) break; part.push(c); size += sz; t++; }
        if (!part.length) break;
        NET.s.send({ k: 't', ep: NET.ep, t: t - part.length, c: part }, id);
      }
    }
    function sendSnap(ids, T) {
      const str = JSON.stringify({ T, ep: NET.ep, K: NET.K, lob: NET.lob, rd: NET.s.round, snap: snapshot() });
      const id = rid(), parts = [];
      for (let i = 0; i < str.length;) { let p = str.slice(i, i + 1150); while (JSON.stringify(p).length > 1250 && p.length > 200) p = p.slice(0, p.length - 60); parts.push(p); i += p.length; }
      for (const to of ids) { parts.forEach((p, i) => NET.cq.push([to, { k: 'sc', ep: NET.ep, id, i, n: parts.length, p }])); if (seatOf(to) < 0) NET.specT.set(to, T); }
    }
    function flushSnaps() { if (!NET.snapWant.size) return; const ids = [...NET.snapWant]; NET.snapWant.clear(); sendSnap(ids, NET.T); }
    function hostTick(dt) {
      const now = Date.now();
      // the chunk queue (snapshots), within the relay's limits
      while (NET.cq.length && canSend()) { const [to, m] = NET.cq.shift(); NET.s.send(m, to); }
      if (!S || S.over || !Net.connected || NET.ph !== 'game') return;
      checkDrops(now);
      if (NET.pause) { pauseTick(now); return; }
      let slow = 0; for (const p of players()) { const id = S.pl[p].id, a = NET.acks.get(id); if (S.pl[p].ai >= 0 || NET.aiTook.has(p) || NET.s.lost.has(id) || (a && now - a.at > 8000)) continue; if ((a ? a.t : -1) < NET.issued - 30 && now - NET.startAt > 4000) { slow = id; break; } }
      NET.waitFor = slow; if (slow) return;
      NET.iacc += dt; const len = NET.K * STEP; let n = 0;
      while (NET.iacc >= len && n++ < 4) { NET.iacc -= len; issueTurn(); }
      if (NET.iacc > len * 4) NET.iacc = 0;
      if (now - NET.lastSave > 8000 && NET.sin === 0) { NET.lastSave = now; NET.s.save({ lob: NET.lob, ep: NET.ep, K: NET.K, T: NET.T, rd: NET.s.round, snap: snapshot() }); }
    }
    // somebody dropped: everybody waits (with a countdown), then the computer looks after their town
    const PAUSE_S = 45;
    function checkDrops(now) {
      for (const p of players()) {
        const P = S.pl[p], id = P.id, a = NET.acks.get(id), last = a ? a.at : NET.startAt;
        if (NET.s.gone.has(id) || NET.s.left.has(id)) { if (P.ai < 0 && !NET.aiTook.has(p)) { pendSys({ c: 'ai', s: p, on: 1 }); NET.aiTook.set(p, id); } if (NET.pause && NET.pause.p === p) unpause(); continue; }
        const lost = NET.s.lost.has(id) || now - last > 10000;
        if (lost && P.ai < 0 && !NET.pause && !NET.aiTook.has(p)) { NET.pause = { p, id, until: now + PAUSE_S * 1000, n: P.name }; NET.lostSeat = p; pzSend(); snd('beep'); }
        else if (!lost && NET.pause && NET.pause.p === p) unpause();
        if (!lost && NET.aiTook.has(p) && now - last < 2500 && (P.was || P.ai < 0)) { pendSys({ c: 'ai', s: p, on: 0 }); NET.aiTook.delete(p); netSay(`${P.name} is back and takes their town back!`); }
      }
    }
    function pzSend() { NET.lastPz = Date.now(); const pz = NET.pause; NET.s.send(pz ? { k: 'pz', who: pz.id, n: pz.n, s: Math.max(0, Math.ceil((pz.until - Date.now()) / 1000)) } : { k: 'pz', who: 0 }); }
    function pauseTick(now) {
      if (now - NET.lastPz > 3000) pzSend();
      if (now >= NET.pause.until) { const { p, id, n } = NET.pause; pendSys({ c: 'ai', s: p, on: 1 }); NET.aiTook.set(p, id); NET.pause = null; NET.lostSeat = -1; pzSend(); netSay(`${n} didn't make it back in time, so the computer is looking after their town. (They can take it back if they return.)`); }
    }
    function unpause() { NET.pause = null; NET.lostSeat = -1; pzSend(); netSay('Everybody is back. Carrying on!'); }
    function netSay(t) { msg(t, '#cfe'); NET.s.send({ k: 'say', txt: t }); }
    // ---- everybody: run the turns that have arrived
    function netRun(dt) {
      if (NET.s.host) hostTick(dt);
      if (S.over) return;
      let avail = 0; while (NET.turns.has(NET.T + avail) && avail < 50) avail++;
      const speed = NET.s.host ? 1 : avail > 10 ? 4 : avail > 4 ? 1.6 : 1;
      NET.racc = Math.min(NET.racc + dt * speed, 1.5);
      let n = 0;
      while (NET.racc >= STEP && n < 120) {
        if (NET.sin === 0) {
          if (NET.s.host) flushSnaps();
          const cmds = NET.turns.get(NET.T); if (!cmds) { NET.racc = Math.min(NET.racc, STEP); break; }
          for (const x of cmds) exec(x[0], x[1]);
        }
        update(STEP); n++; NET.racc -= STEP;
        if (++NET.sin >= NET.K) { NET.sin = 0; afterTurn(NET.T); NET.turns.delete(NET.T); NET.T++; if (S.over) break; }
      }
      if (NET.s.host && NET.sin === 0) flushSnaps();
    }
    function afterTurn(t) {
      if (t % 10 === 9) { const h = hashState(); if (NET.s.host) { NET.hashes.set(t, h); NET.hashes.delete(t - 300); } else NET.lastHash = { t, h }; }
      if (!NET.s.host && t % 5 === 4) sendAck();
    }
    function sendAck() { NET.lastAck = Date.now(); const lh = NET.lastHash; NET.s.send({ k: 'a', ep: NET.ep, t: NET.T - 1, ht: lh ? lh.t : -1, h: lh ? lh.h : 0 }, NET.s.hostId); }
    function hello() { if (!NET || NET.s.host) return; NET.helloAt = Date.now(); NET.s.send({ k: 'hi', ep: NET.ep, t: NET.T }, NET.s.hostId); }
    function askTurns() { const now = Date.now(); if (now - NET.lastRq < 1200) return; NET.lastRq = now; NET.s.send({ k: 'rq', ep: NET.ep, t: NET.T }, NET.s.hostId); }
    // client chores: send my commands, keep in touch, notice gaps
    function netWatch() {
      const now = Date.now(), s = NET.s;
      if (s.host || !Net.connected) return;
      if (NET.out.length && now - NET.outAt > 120) {
        NET.outAt = now; let part = [], size = 30;
        const flush = () => { if (part.length) s.send({ k: 'c', ep: NET.ep, c: part }, s.hostId); part = []; size = 30; };
        for (const c of NET.out.splice(0)) { const sz = JSON.stringify(c).length + 1; if (size + sz > 1200) flush(); part.push(c); size += sz; }
        flush();
      }
      if (NET.ph !== 'game') return;
      if (now - NET.lastAck > 2000) sendAck();
      const stuck = !NET.turns.has(NET.T) && now - NET.lastTurnAt > 1500 && !NET.pz && !s.lost.has(s.hostId);
      if (stuck && NET.ep) askTurns();
      if (!NET.ep && now - (NET.helloAt || 0) > 6000) hello(); // still waiting for the snapshot
      for (const [id, c] of NET.chunks) if (now - c.ts > 12000) { NET.chunks.delete(id); hello(); }
    }
    // ---- messages
    function netMsg(d, from) {
      const s = NET.s, fromHost = from === s.hostId;
      switch (d.k) {
        case 'lob': if (!fromHost || s.host) return; { const L = okLob(d.lob); if (!L) return; NET.lob = L; if (d.ph === 'lobby' && (NET.ph !== 'lobby' || scene !== 'lobby')) { NET.ph = 'lobby'; netLobby(); } else if (scene === 'lobby') netLobby(); } return;
        case 'go': if (!fromHost || s.host || typeof d.ep !== 'string' || !Number.isFinite(d.seed)) return; startNetGame(d); return;
        case 't': if (!fromHost || s.host) return; turnIn(d); return;
        case 'sc': if (!fromHost || s.host) return; chunkIn(d); return;
        case 'pz': if (!fromHost) return; NET.pz = d.who ? { n: nclean(d.n, 20), until: Date.now() + clamp(+d.s || 0, 0, 120) * 1000 } : null; NET.lostSeat = d.who ? seatOf(d.who) : -1; return;
        case 'say': if (fromHost && typeof d.txt === 'string') msg(nclean(d.txt, 200), '#cfe'); return;
        case 'ch': { if (typeof d.txt !== 'string') return; const p = seatOf(from); msg(`${s.nick(from)}: ${nclean(d.txt, 60)}`, p >= 0 ? COLS[colOf(p)].l : '#ddd'); snd('click'); return; }
      }
      if (!s.host) return;
      // the host
      switch (d.k) {
        case 'ls': {
          if (NET.ph !== 'lobby') return; const st = NET.lob.seats.find(x => x.ai === -1 && x.id === from); if (!st) return;
          const col = d.col | 0; if (COLS[col] && !NET.lob.seats.some(x => x !== st && isOcc(x) && x.col === col)) st.col = col;
          st.team = clamp(d.team | 0, 0, 4); st.civ = clamp(d.civ | 0, 0, CIVS.length - 1); st.ready = !!d.ready;
          pushLob(); netLobby(); return;
        }
        case 'c': {
          if (NET.ph !== 'game' || d.ep !== NET.ep || !Array.isArray(d.c) || !S) return; const p = seatOf(from); if (p < 0 || S.pl[p].out) return;
          for (const c of d.c.slice(0, 40)) if (c && typeof c === 'object' && typeof c.c === 'string' && c.c !== 'ai' && c.c !== 'gone') NET.pend.push([p, c]);
          NET.acks.set(from, Object.assign(NET.acks.get(from) || { t: -1 }, { at: Date.now() }));
          return;
        }
        case 'a': {
          if (NET.ph === 'lobby') { if (scene === 'lobby') pushLob(from); return; }
          const a = { t: d.ep === NET.ep && Number.isInteger(d.t) ? d.t : -1, at: Date.now() }; NET.acks.set(from, a);
          if (d.ep === NET.ep && Number.isInteger(d.ht) && NET.hashes.has(d.ht) && NET.hashes.get(d.ht) !== d.h >>> 0) {
            NET.desyncs++; const t = Date.now(); if (t - (NET.lastResync.get(from) || 0) > 8000) { NET.lastResync.set(from, t); NET.snapWant.add(from); }
          }
          return;
        }
        case 'rq': { if (NET.ph === 'lobby' || !S) return; const t = d.t | 0; if (d.ep === NET.ep && t >= 0 && (NET.log.has(t) || t > NET.issued)) { if (t <= NET.issued) sendRange(from, t, NET.issued); } else NET.snapWant.add(from); return; }
        case 'hi': {
          NET.acks.set(from, Object.assign(NET.acks.get(from) || { t: -1 }, { at: Date.now() }));
          if (NET.ph === 'lobby' || !S) { pushLob(from); return; }
          const t = d.t | 0; if (d.ep === NET.ep && t >= 0 && (NET.log.has(t) || t > NET.issued)) { if (t <= NET.issued) sendRange(from, t, NET.issued); } else NET.snapWant.add(from);
          if (NET.pause) pzSend();
          return;
        }
      }
    }
    function turnIn(d) {
      if (d.ep !== NET.ep || !Number.isInteger(d.t) || !Array.isArray(d.c) || d.c.length > 500) return;
      NET.lastTurnAt = Date.now();
      d.c.forEach((cmds, i) => { const t = d.t + i; if (t >= NET.T && !NET.turns.has(t) && Array.isArray(cmds)) NET.turns.set(t, cmds.filter(x => Array.isArray(x) && x.length === 2 && Number.isInteger(x[0]) && x[1] && typeof x[1] === 'object')); });
      if (d.t > NET.T && !NET.turns.has(NET.T)) askTurns();
    }
    function chunkIn(d) {
      if (typeof d.id !== 'string' || !Number.isInteger(d.i) || !Number.isInteger(d.n) || d.n < 1 || d.n > 300 || d.i < 0 || d.i >= d.n || typeof d.p !== 'string') return;
      let c = NET.chunks.get(d.id);
      if (!c) { c = { n: d.n, got: new Array(d.n), cnt: 0, ts: Date.now() }; NET.chunks.set(d.id, c); if (NET.chunks.size > 4) NET.chunks.delete(NET.chunks.keys().next().value); }
      if (c.got[d.i] != null || c.n !== d.n) return;
      c.got[d.i] = d.p; c.cnt++; c.ts = Date.now();
      if (c.cnt < c.n) return;
      NET.chunks.delete(d.id);
      let o = null; try { o = JSON.parse(c.got.join('')); } catch (e) { return; }
      applySnap(o);
    }
    function applySnap(o) {
      if (!o || !Number.isInteger(o.T) || typeof o.ep !== 'string' || !o.snap) return;
      const same = S && S.online && NET.ph === 'game' && scene === 'game';
      const cam = same ? { x: U.cam.x, y: U.cam.y } : null, exp = same ? S.exp : null, sel = U.sel.slice();
      const me = Array.isArray(o.snap.pl) ? o.snap.pl.findIndex(p => p && p.id && p.id === myId()) : -1;
      try { restore(o.snap, me, true); } catch (e) { console.error(e); return; }
      if (o.ep !== NET.ep) NET.turns = new Map();
      NET.ep = o.ep; NET.K = clamp(o.K | 0, 2, 12); if (o.lob) NET.lob = okLob(o.lob) || NET.lob; if (Number.isInteger(o.rd)) NET.s.round = o.rd;
      NET.T = o.T; NET.sin = 0; NET.racc = 0; NET.lastTurnAt = Date.now();
      for (const t of [...NET.turns.keys()]) if (t < NET.T) NET.turns.delete(t);
      NET.ph = S.over ? 'end' : 'game';
      if (same) { scene = 'game'; if (exp) S.exp.set(exp); S.miniDirty = true; U.cam.x = cam.x; U.cam.y = cam.y; U.sel = sel.filter(id => S.map.has(id)); cardKey = ''; }
      else { startPlay(); const tc = S.me >= 0 ? S.ents.find(e => e.team === S.me && e.t === 'bighut') : null; if (tc) centerOn(tc.x + 1.5, tc.y + 1.5); else centerOn(MW / 2, MH / 2); msg(S.me >= 0 ? 'Back in the battle!' : 'You are watching this battle.', '#ffe8a0'); if (S.me < 0) G.secret('rts.watch'); }
      NET.s.save();
      if (!NET.turns.has(NET.T)) { NET.lastRq = 0; askTurns(); }
      sendAck();
      if (S.over) endScreen(S.winner, S.me >= 0 && S.pl[S.me].ally === S.winner, false, null, S.pl.map((P, p) => p).filter(p => S.pl[p].ally === S.winner));
    }
    function netOver(side) {
      NET.ph = 'end';
      if (S.me >= 0) { const wp = S.pl.findIndex(P => P.ally === side && P.id); try { Net.send({ t: 'mpResult', sid: NET.s.rsid(), w: wp >= 0 ? S.pl[wp].id : 0 }); } catch (e) {} }
      if (NET.s.host) NET.s.save({ lob: NET.lob, ep: NET.ep, K: NET.K, T: NET.T, rd: NET.s.round, snap: snapshot() });
    }
    function netBackToLobby() {
      if (!NET || !NET.s.host) return;
      NET.ph = 'lobby'; for (const st of NET.lob.seats) if (st.ai === -1) st.ready = st.id === myId();
      seatPeople(); nameAIs(); pushLob(); NET.s.save({ lob: NET.lob }); netLobby();
    }
    function netLeave() { if (NET && NET.s && !NET.s.ended) NET.s.leave(); else netClosed(''); }
    function netClosed(why) {
      NET = null;
      if (!live()) return;
      showTitle();
      if (why && why !== 'You left the game.') G.toast('Age of Jackpires II', why, 5000);
    }
    function netSession(s) {
      if (NET && NET.s !== s && !NET.s.ended) NET.s.leave(true);
      if (S && !S.online && scene === 'game') { try { AS.now(); } catch (e) {} }
      NET = mkNet(s);
      s.rtsOpen = true;
      const mineS = () => NET && NET.s === s;
      s.on('m', (d, from) => { if (mineS() && d && typeof d === 'object') { try { netMsg(d, from); } catch (e) { console.error(e); } } });
      s.on('state', st => { if (!mineS() || !st || typeof st !== 'object' || s.host) return; const L = okLob(st.lob); if (L) NET.lob = L; if (st.ph === 'lobby') { NET.ph = 'lobby'; netLobby(); } else if (NET.ph !== 'game' || !S) hello(); });
      s.on('roster', () => {
        if (!mineS()) return;
        if (s.host) { if (NET.ph === 'lobby') { seatPeople(); nameAIs(); pushLob(); netLobby(); } else for (const p of s.humans()) if (p.id !== myId() && !NET.known.has(p.id)) { NET.known.add(p.id); if (seatOf(p.id) < 0) { NET.snapWant.add(p.id); msg(`${p.nick} has come to watch.`, '#cfe'); } } }
        else if (scene === 'lobby') netLobby();
      });
      s.on('lost', () => { if (mineS() && scene === 'lobby') netLobby(); });
      s.on('back', () => { if (mineS() && scene === 'lobby') netLobby(); });
      s.on('online', () => { if (mineS() && !s.host) { NET.lastTurnAt = Date.now(); hello(); } });
      const out = id => {
        if (!mineS()) return;
        if (id === s.hostId) { s.end(`${s.nick(id)} (the host) has gone, so the game is over.`); return; }
        if (s.host) { if (NET.ph === 'lobby') { seatPeople(); nameAIs(); pushLob(); netLobby(); } else { const p = seatOf(id); if (p >= 0 && S && !S.over && !S.pl[p].out && S.pl[p].ai < 0 && !NET.aiTook.has(p)) { pendSys({ c: 'ai', s: p, on: 1 }); NET.aiTook.set(p, id); netSay(`${S.pl[p].name} has left. The computer will look after their town.`); } if (NET.pause && NET.pause.id === id) unpause(); } }
        else if (scene === 'lobby') netLobby();
      };
      s.on('gone', out); s.on('left', out);
      s.on('end', why => { if (mineS()) netClosed(why); });
      if (s.host) {
        s.state(() => ({ ph: NET.ph, lob: NET.lob }));
        let ok = false;
        if (s.resumed && s.saved && s.saved.snap) { try { resumeHost(s.saved); ok = true; } catch (e) { console.error(e); } }
        if (!ok) { NET.lob = (s.saved && okLob(s.saved.lob)) || freshLob(); NET.ph = 'lobby'; seatPeople(); nameAIs(); netLobby(); pushLob(); }
      } else { netLobby(); s.save(); setTimeout(() => { if (mineS()) hello(); }, 300); }
    }
    if (window.MP) MP.hook('mp.rts', G.w, { session: s => netSession(s) });
    // the big countdown / waiting box in the middle of the screen
    let bannerH = '';
    function netBanner() {
      let h = '';
      if (NET && S && !S.over && NET.ph === 'game') {
        const s = NET.s, now = Date.now();
        if (!Net.connected) h = 'Your connection dropped. Reconnecting...<small>Hang on, the others are waiting for you.</small>';
        else if (s.host && NET.pause) h = `${esc(NET.pause.n)} lost connection.<big>${fmtT((NET.pause.until - now) / 1000)}</big><small>Waiting for them to come back. If they don't, the computer will look after their town.</small>`;
        else if (!s.host && NET.pz) h = `${esc(NET.pz.n)} lost connection.<big>${fmtT((NET.pz.until - now) / 1000)}</big><small>Waiting for them to come back. If they don't, the computer will look after their town.</small>`;
        else if (!s.host && s.lost.has(s.hostId)) { const l = s.lost.get(s.hostId); h = `${esc(s.nick(s.hostId))} (the host) lost connection.<big>${fmtT((120000 - (now - l.at)) / 1000)}</big><small>Waiting for them to come back...</small>`; }
        else if (s.host && NET.waitFor) h = `Waiting for ${esc(s.nick(NET.waitFor))}...<small>Their computer is catching up.</small>`;
        else if (!s.host && !NET.ep) h = 'Catching up with the battle...<small>Downloading the map at 3.6 KB/sec.</small>';
        else if (!s.host && !NET.turns.has(NET.T) && now - NET.lastTurnAt > 2500) h = `Waiting for ${esc(s.nick(s.hostId))}...`;
      }
      if (h !== bannerH) { bannerH = h; netEl.innerHTML = h; netEl.style.display = h ? 'block' : 'none'; }
    }

    // ================================================================ menus
    G.menu([
      ['Game', () => [
        { label: 'Skirmish...', act: () => confirmNew(setupScreen) },
        { label: 'Learning Campaign', act: () => confirmNew(() => startScen(0)) },
        { label: 'Campaign...', act: () => confirmNew(campaignScreen) },
        { label: 'Play Online...', dis: G.demo, act: () => { if (NET && !NET.s.ended) { if (NET.ph === 'lobby') netLobby(); } else goOnline(); } },
        '-',
        { label: 'Save Game...', dis: !S || S.over || !!NET, act: () => { if (S && !S.over && !NET) saveScreen(); } },
        { label: 'Load Game...', dis: !!NET, act: () => loadScreen(S && !S.over ? closeOv : showTitle) },
        '-',
        { label: 'Pause', key: 'P', dis: !S || S.over || !!NET, chk: !!(S && S.paused), act: () => { if (S && !NET) S.paused = !S.paused; } },
        { label: NET ? 'Leave the online game' : 'Main Menu', act: () => (NET ? netLeave() : showTitle()) },
        '-',
        { label: 'Exit', act: () => G.quit() },
      ]],
      ['Options', () => [
        { label: 'Slow', rad: OPT.speed === 0.7, dis: !!NET, act: () => { OPT.speed = 0.7; saveOpt(); } },
        { label: 'Normal speed', rad: OPT.speed === 1, dis: !!NET, act: () => { OPT.speed = 1; saveOpt(); } },
        { label: 'Fast (Callum speed)', rad: OPT.speed === 1.6, dis: !!NET, act: () => { OPT.speed = 1.6; saveOpt(); } },
        '-',
        { label: 'Zoomed out', chk: OPT.zoom === 1, act: () => setZoom(OPT.zoom === 1 ? 2 : 1) },
        { label: 'Music', chk: OPT.music, act: () => { OPT.music = !OPT.music; saveOpt(); if (OPT.music && G.sound) G.music('aow2'); else G.stopMusic(); } },
        { label: 'Sir Reginald\'s tips', chk: OPT.tips, act: () => { OPT.tips = !OPT.tips; saveOpt(); } },
      ]],
      ['Help', () => [
        { label: 'How to Play', act: () => helpScreen(S && !S.over ? closeOv : showTitle) },
        { label: 'Keys', key: '?', act: () => keysScreen(S && !S.over ? closeOv : showTitle) },
        '-',
        { label: 'Readme.txt', act: () => G.msg('README.TXT', 'AGE OF JACKPIRES II: THE AGE OF JACKS\nVersion 1.1\n\nNEW IN 1.1\n- Spearmen, the Blacksmith and the Wheelbarrow\n- Up to four players: free-for-all or teams\n- The Learning Campaign and four campaign battles\n- Play online over JackNet (Play Online on the title screen)\n\nKNOWN ISSUES\n- Villagers sometimes get stuck behind trees. This is realistic.\n- Callum says the Hard computer is "too easy". Callum is lying.\n- Luke and Dave keep asking if there is an ULTRA 64 version. There is not.\n\nThis disc belongs to CALLUM. If found, return to Callum.', 'info') },
        { label: 'About Age of Jackpires II...', act: () => G.about() },
      ]],
    ]);
    function confirmNew(fn) {
      if (NET && !NET.s.ended) { G.msg('Age of Jackpires II', 'Leave the online game first (Game > Leave the online game).', 'info'); return; }
      if (S && !S.over && scene === 'game') G.msg('Age of Jackpires II', 'Leave this battle? It will be lost unless you save it.', 'q', [['Leave it', () => { closeOv(); AS.clear(); fn(); }], ['Keep playing']]); else fn();
    }

    // ================================================================ main loop
    let acc = 0, hudT = 0, visT = 0, tutT = 0, lastFrame = 0, tipAt = 0;
    function frame(dt) {
      lastFrame = performance.now();
      if (scene !== 'game' || !S) { if (NET && NET.s.host && NET.ph === 'lobby' && NET.cq.length) hostTick(dt); return; }
      const sp = 700 * dt;
      let mx = 0, my = 0;
      if (U.keys.ArrowLeft) mx -= sp; if (U.keys.ArrowRight) mx += sp; if (U.keys.ArrowUp) my -= sp; if (U.keys.ArrowDown) my += sp;
      if (U.mouse && G.focused() && !ov && ptr.id == null) { const e = 10; if (U.mouse.x < e) mx -= sp; if (U.mouse.x > cv.width - e) mx += sp; if (U.mouse.y < e) my -= sp; if (U.mouse.y > cv.height - e) my += sp; }
      if (mx || my) { U.cam.x += mx; U.cam.y += my; clampCam(); }
      if (NET && (NET.ph === 'game' || NET.ph === 'end')) { netRun(dt); netWatch(); }
      else if (!S.paused && !S.over && !ov) {
        acc += dt * OPT.speed; let n = 0;
        while (acc >= STEP && n++ < 8) { update(STEP); acc -= STEP; }
        if (acc > STEP * 8) acc = 0;
      }
      if (!S) return;
      fxTick(dt);
      if ((visT -= dt) <= 0) { visT = 0.25; updVis(); }
      render();
      if ((miniT -= dt) <= 0) { miniT = 0.2; renderMini(); }
      if ((hudT -= dt) <= 0) { hudT = 0.2; hud(); G.status(`${S.scen && SCEN_BY[S.scen.id] ? SCEN_BY[S.scen.id].n : MAPS[S.mi].n} | ${S.online ? 'Online' + (S.me < 0 ? ' (watching)' : '') : (OPT.speed === 1 ? 'Normal' : OPT.speed < 1 ? 'Slow' : 'Fast') + ' speed'}${S.paused && !NET ? ' | PAUSED' : ''}${G.demo && !S.online ? ' | DEMO: ' + fmtT(900 - S.time) + ' left' : ''}`); }
      if ((tutT -= dt) <= 0) { tutT = 0.4; if (S.tut && !S.online) tutTick(); objectives(); tips(); }
      netBanner();
    }
    // Sir Reginald's occasional tips (skirmishes; the Options menu turns them off)
    function tips() {
      if (!OPT.tips || S.tut || S.over || S.me < 0 || S.paused || NET) return;
      const now = performance.now(); if (now - tipAt < 90000 || S.time < 60) return;
      const idle = S.ents.filter(e => !e.dead && mineE(e) && e.t === 'grot' && e.o.type === 'idle').length, R = S.res[S.me];
      let t = '';
      if (idle >= 3) t = `${idle} of your Villagers are standing about doing nothing. Press . (full stop) or the Idle button to find them.`;
      else if (R.f + R.w + R.t > 1500) t = 'Your treasury is bursting, my lord! Spend it: more Villagers, more soldiers, a Blacksmith upgrade...';
      else if (S.time > 600 && S.age[S.me] === 1) t = 'Ten minutes in and still in the Stone Age? Click your Town Centre and Advance to the Castle Age (it needs a Barracks).';
      if (t) { tipAt = now; advisor('Sir Reginald, Royal Advisor', t, { auto: 12000 }); }
    }
    const stopLoop = G.loop(dt => {
      if (!live()) { stopLoop(); ro.disconnect(); G.stopMusic(); return; }
      frame(dt);
    });
    // a hidden tab (or a minimised window) gets no animation frames: keep an online battle going anyway, so nobody waits for us
    G.every(() => { if (!NET || !S || scene !== 'game' || NET.ph !== 'game') return; const t = performance.now(); if (t - lastFrame > 450) { const d = Math.min(1, (t - (lastFrame || t)) / 1000); lastFrame = t; netRun(d); netWatch(); } }, 250);

    // the carry-on save (a refresh, a closed window or a Shut Down): the battle as it is, back paused. Online games keep their own.
    const AS = G.autosave(() => (scene === 'game' && S && !S.online ? (S.over ? null : saveData()) : undefined));
    // test hook (harmless): lets the test harness poke the game
    G.host._rts = { get S() { return S; }, get NET() { return NET; }, U, canPlace, newGame, startScen, exec, issue, commandAt, tapSelect, selectEnts, chat, startPlace, confirmPlace, centerOn, toWorld, saveSlot, saveData, loadData, snapshot, restore, hashState, endGame, update, setupScreen, showTitle, campaignScreen,
      ff(sec) { for (let i = 0; i < sec / STEP && S && !S.over; i++) update(STEP); } };
    if (arg === 'new') newGame({ mi: 0, pl: [{ name: playerName(), col: 0, ally: 1, civ: 0, ai: -1 }, { name: FOES[0].n, col: 1, ally: 2, civ: 1, ai: 0, fi: 0 }], me: 0 });
    else {
      const d = AS.load();
      if (d && ((d.v === 2 && d.snap) || (d.terr && d.ents && MAPS[d.mi])) && !(G.demo && (d.time >= 900 || (d.snap && d.snap.time >= 900)))) {
        try { loadData(d); S.paused = true; msg('Welcome back, my lord! The battle is paused just as you left it. Press P to carry on.', '#ffe8a0'); }
        catch (e) { console.error(e); AS.clear(); showTitle(); }
      } else showTitle();
    }
  });
})();

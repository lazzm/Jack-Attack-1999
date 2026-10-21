/* pcgames-arena: the rules, maps and match referee for the online shooters: JACKREAL TOURNAMENT and JAQUAKE deathmatch
 * (and JAQUAKE co-op, where the monsters are referee entities too). Shared by the games (a Practice Session runs the
 * referee locally) and the server mod mods/arena.js (online games: the referee is the authority there and every client
 * claim is checked: speed, position, line of sight, fire rate, ammo, damage). UMD, plain JS, no THREE. */
(function (root, factory) {
  const G = (typeof module !== 'undefined' && module.exports) ? require('./pcgames-grid.js') : root.PCGGrid;
  const A = factory(G);
  if (typeof module !== 'undefined' && module.exports) module.exports = A; else root.PCGArena = A;
})(typeof self !== 'undefined' ? self : this, function (Grid0) {
  'use strict';
  // (in a browser the grid code might arrive after this file: look it up when it's first needed)
  let Grid0_ = Grid0; const Grid = { parse: d => (Grid0_ || (Grid0_ = self.PCGGrid)).parse(d) };

  // ================================================================ weapons (dmg = most a single hit may claim)
  // proj: a projectile (no line-of-sight check on its hits, it can fly round corners... a bit); splash: rocket radius.
  // cd: the client's time between shots; rate: the referee's limit (a touch under cd, so network jitter never eats a shot).
  // A weapon without cd fires every `rate` seconds. JRT guns have an ALT fire (the right mouse button): the client sends it
  // as weapon number + ALT, and it has its own damage/budget but shares the gun's ammo and cadence.
  const ALT = 8;
  const W = [
    { id: 'spanner', n: 'Impact Jackhammer', key: 1, dmg: 40, cd: 0.42, rate: 0.38, range: 2.6, start: -1, max: -1, pick: 0, hits: 2, win: 500, sfx: 'spanner',
      alt: { n: 'shove', dmg: 24, cd: 0.6, rate: 0.54, range: 3.4, hits: 1, win: 500 } },
    { id: 'enforza', n: 'Jack Pistol', key: 2, dmg: 15, cd: 0.2, rate: 0.18, range: 140, start: 50, max: 99, pick: 25, hits: 1, win: 700, sfx: 'enforza',
      alt: { n: 'rapid fire', dmg: 12, cd: 0.12, rate: 0.105, range: 140, hits: 1, win: 700, spread: 0.06 } },
    { id: 'shokka', n: 'Shock Jack', key: 3, dmg: 40, cd: 0.62, rate: 0.56, range: 220, start: 0, max: 50, pick: 12, hits: 1, win: 700, sfx: 'shokka',
      alt: { n: 'shock ball', dmg: 110, cd: 0.5, rate: 0.45, range: 120, hits: 8, win: 6000, proj: 1, splash: 5.5, ball: 1 } }, // (dmg 110: a COMBO, when you shoot your own ball)
    { id: 'dakka', n: 'Rattler', key: 4, dmg: 8, cd: 0.075, rate: 0.068, range: 140, start: 0, max: 199, pick: 80, hits: 1, win: 700, sfx: 'dakka', spread: 0.02,
      alt: { n: 'full spin', dmg: 7, cd: 0.05, rate: 0.045, range: 120, hits: 1, win: 700, spread: 0.07 } },
    { id: 'flak', n: 'Flak Jack', key: 5, dmg: 13, cd: 0.72, rate: 0.65, range: 70, start: 0, max: 50, pick: 12, hits: 9, win: 1800, proj: 1, sfx: 'flak',
      alt: { n: 'flak shell', dmg: 70, cd: 0.95, rate: 0.86, range: 70, hits: 6, win: 3500, proj: 1, splash: 3.2 } },
    { id: 'rokkit', n: 'Rocket Jack', key: 6, dmg: 95, cd: 0.72, rate: 0.65, range: 220, start: 0, max: 48, pick: 8, hits: 6, win: 4500, proj: 1, splash: 3.6, sfx: 'rokkit',
      alt: { n: 'grenade', dmg: 80, cd: 0.6, rate: 0.54, range: 90, hits: 6, win: 4500, proj: 1, splash: 3.2 } },
  ];
  // JAQUAKE: rate = seconds between shots, the same numbers the single-player game uses (pcgames-jaquake.js WEAP); the
  // monsters' attacks are slower and softer than they were (pack 33: easier co-op)
  const WQ = [
    { id: 'jhammer', n: 'Jackhammer', key: 1, dmg: 28, rate: 0.32, range: 2.6, start: -1, max: -1, pick: 0, hits: 1, win: 400, sfx: 'choppa' },
    { id: 'boom', n: 'Boomstick', key: 2, dmg: 6, rate: 0.4, range: 90, start: 25, max: 100, pick: 20, hits: 7, win: 700, pellets: 7, sfx: 'shoota' },
    { id: 'rivet', n: 'Rivet Gun', key: 3, dmg: 9, rate: 0.08, range: 140, start: 0, max: 200, pick: 30, hits: 1, win: 2600, proj: 1, sfx: 'teef' },
    { id: 'rjack', n: 'Rocket Jack', key: 4, dmg: 100, rate: 0.6, range: 200, start: 0, max: 50, pick: 5, hits: 6, win: 4500, proj: 1, splash: 3.8, sfx: 'launch' },
    // the monsters' own attacks (co-op): never in a player's hands
    { id: 'bite', n: 'Chomp', mon: 1, dmg: 10, rate: 1.0, range: 2.6, start: -1, max: -1, pick: 0, hits: 1, win: 500, sfx: 'squig' },
    { id: 'zap', n: 'Zapper', mon: 1, dmg: 7, rate: 1.7, range: 40, start: -1, max: -1, pick: 0, hits: 1, win: 800, sfx: 'teef' },
    { id: 'bigrock', n: 'Big Rocket', mon: 1, dmg: 30, rate: 2.6, range: 70, start: -1, max: -1, pick: 0, hits: 4, win: 4500, proj: 1, splash: 3.2, sfx: 'launch' },
  ];
  const WI = {}; W.forEach((w, i) => { WI[w.id] = i; });
  // pickups. hp/hpMax: health; ar/arMax/abs: armour (abs = how much of a hit it soaks up; set: armour is SET to ar, not
  // added); ud/mult: a damage power-up; w: a weapon (and its ammo); am/amN: ammo for weapon slot am
  const ITEMS = {
    health: { n: 'Health Pack', resp: 20, hp: 25, hpMax: 100 }, shield: { n: 'Shield Belt', resp: 30, ar: 50, arMax: 150, abs: 0.6 },
    udamage: { n: 'Jack Juice (double damage)', resp: 60, ud: 30, mult: 2, big: 1 },
    shokka: { n: 'Shock Jack', resp: 8, w: 2 }, dakka: { n: 'Rattler', resp: 8, w: 3 }, flak: { n: 'Flak Jack', resp: 8, w: 4 }, rokkit: { n: 'Rocket Jack', resp: 8, w: 5 },
    vial: { n: 'Health Vial', resp: 15, hp: 5, hpMax: 150 },
  };
  const ITEMS_Q = {
    pie: { n: 'Pork Pie (+25 health)', resp: 20, hp: 25, hpMax: 100 }, mega: { n: 'MEGA PIE! (+100 health)', resp: 45, hp: 100, hpMax: 200, big: 1 },
    armour1: { n: 'Green Tin Armour', resp: 20, ar: 100, arMax: 100, abs: 0.3, set: 1 }, armour2: { n: 'Yellow Scrap Armour', resp: 30, ar: 150, arMax: 150, abs: 0.6, set: 1 },
    quad: { n: 'QUAD JACK! (four times the damage)', resp: 60, ud: 30, mult: 4, big: 1 },
    shells: { n: '20 shells', resp: 15, am: 1, amN: 20 }, rivets: { n: '30 rivets', resp: 15, am: 2, amN: 30 }, rockets: { n: '5 rockets', resp: 15, am: 3, amN: 5 },
    rivetgun: { n: 'the RIVET GUN', resp: 10, w: 2 }, launcher: { n: 'ROCKET JACK', resp: 10, w: 3 },
  };
  // co-op monsters (JAQUAKE): hp, size, which attack, how far away they like to be, speed
  const MONS = {
    blob: { n: 'a slime blob', hp: 60, w: 4, keep: 0.8, speed: 5.6, h: 0.9, r: 0.45 },
    imp: { n: 'an imp', hp: 45, w: 5, keep: 9, speed: 4, h: 1.3, r: 0.35 },
    robot: { n: 'a tin robot', hp: 70, w: 5, keep: 10, speed: 3.5, h: 1.5, r: 0.4 },
    bigrobot: { n: 'a Big Robot', hp: 320, w: 6, keep: 12, speed: 2.7, h: 2.6, r: 0.6 },
  };
  const MONK = Object.keys(MONS); // index+1 goes in the snapshot

  // ================================================================ the maps (left half / top-left quarter, mirrored)
  const it = (base, name, one) => ({ base, e: 'item', ep: { it: name }, one });
  const lt = (base, c, rad, i, one, h) => ({ base, e: 'light', ep: { c, rad: rad || 8, i: i || 1, h: h == null ? 2.6 : h }, one });
  const MAPS = {
    spacegrot: {
      id: 'spacegrot', game: 'jrt', title: 'Space Station Jack', by: 'Callum', demo: true, grav: 9, sky: 'stars', modes: ['dm', 'ctf'],
      blurb: 'A rusty mining platform bolted together in a hurry, floating over absolutely nothing. Low gravity. Mind the gap.',
      mirror: 'xy', defaults: { sky: true, slab: 1.2, h: 4 },
      legend: {
        '#': { s: 1, h: 4.5 }, J: { base: '.', e: 'pad' }, P: { base: '.', e: 'spawn' }, p: { base: '2', e: 'spawn' },
        A: it('6', 'shield', 'x'), K: it('6', 'rokkit'), F: it('6', 'flak'), H: it('2', 'health'), S: it('2', 'shokka'), U: it('3', 'udamage', 'xy'),
        R: { base: '2', e: 'flag', ep: { team: 0 }, mx: 'B', one: 'y' }, B: { base: '2', e: 'flag', ep: { team: 1 }, mx: 'R', one: 'y' },
        D: it('1', 'dakka'),
      },
      rows: [
        '~~~~~~~~~~~~~~~',
        '~~~~~~~~~~666A6',
        '~~~~66K66666666',
        '~~~~6~~~~~66F66',
        '~~~~5~~~~~~~~~~',
        '~~~~4~~~~~~~~~~',
        '~2223222~~~~~~~',
        '~2#222#2~~~P...',
        '~2p2H2p2111.J..',
        '~22222221D1....',
        '~22R2S22111..3U',
      ],
    },
    // DM-Coax Foundry: a cable works at sunset. Two sheds full of drums, a yard with crates, catwalks along the fences
    // and a jump pad up to the crane tower in the middle. Mirrored left/right, so it is a fair CTF map too.
    foundry: {
      id: 'foundry', game: 'jrt', title: 'Coax Foundry', by: 'JackK', demo: true, grav: 18, sky: 'dusk', modes: ['dm', 'ctf'],
      blurb: 'The factory where they make the cable for Callum\'s LAN parties. Two sheds, a yard full of crates, catwalks and a crane tower with a jump pad. Hard hats optional.',
      mirror: 'x', defaults: { sky: true, h: 7 },
      look: { ft: 'jslab', wt: 'jpanel', st: 'jslab', ct: 'jpanel', rt: 'jpanel', amb: [0.6, 0.52, 0.48] },
      legend: {
        '#': { s: 1, h: 7 }, '=': { s: 1, h: 2.2, wt: 'crate' },
        k: { f: 0, c: 4, sky: false, ft: 'jfloor', ct: 'jpanel', wt: 'jpanel' }, c: { f: 1, ft: 'crate', st: 'crate' }, C: { f: 2, ft: 'crate', st: 'crate' },
        u: { f: 3, ft: 'jfloor', st: 'jpanel' }, T: { f: 4.5, ft: 'jfloor', st: 'jpanel' }, y: { f: 0, ft: 'jred' },
        J: { base: '.', e: 'pad' }, P: { base: '.', e: 'spawn' }, p: { base: 'k', e: 'spawn' }, q: { base: 'u', e: 'spawn' },
        H: it('k', 'health'), h: it('.', 'health'), v: it('u', 'vial'), A: it('u', 'shield'), S: it('.', 'shokka'), D: it('k', 'dakka'), F: it('c', 'flak'),
        K: it('T', 'rokkit', 'x'), U: it('T', 'udamage', 'x'), L: lt('k', [1, 0.85, 0.6], 7, 1.1, null, 3.4), M: lt('.', [1, 0.7, 0.4], 9, 0.9, null, 2.8),
        R: { base: 'y', e: 'flag', ep: { team: 0 }, mx: 'B' }, B: { base: 'y', e: 'flag', ep: { team: 1 }, mx: 'R' },
      },
      rows: [
        '###############',
        '#uuuuuuuuuuuuuu',
        '#uvuuuuuuuuquuu',
        '#u654321....=..',
        '#u.....h...c=..',
        '#u..Mkkkk..cF..',
        '#..kkkkkkk.....',
        '#..kLkkpkk...TT',
        '#..kkHkDkk..JTK',
        '#..kkkkkLk...TU',
        '#yy.kkkkk....TT',
        '#yRykkpkk.....P',
        '#yy.kkkkk...S..',
        '#..kLkkkkk..CC.',
        '#..kkkkkkk..cc.',
        '#u..Mkkkk.....=',
        '#u.....h......=',
        '#u654321.......',
        '#uAuuuuuuuuquuu',
        '###############',
      ],
    },
    castle: {
      id: 'castle', game: 'jrt', title: 'Castle Jackstone', by: 'Jack', demo: false, grav: 22, sky: 'dusk', modes: ['dm', 'ctf'],
      blurb: 'A crumbly old castle with two keeps, a courtyard full of pillars to hide behind and battlements all the way round. Jack designed it on graph paper in a maths lesson.',
      mirror: 'xy', defaults: { sky: true, h: 7 },
      legend: {
        '#': { s: 1, h: 7 }, k: { f: 0, c: 4, sky: false, ft: 'flag', ct: 'wood' }, o: { s: 1, h: 3.2, wt: 'pillar' },
        P: { base: '.', e: 'spawn' }, p: { base: 'k', e: 'spawn' },
        K: it('8', 'rokkit'), F: it('.', 'flak'), H: it('.', 'health'), h: it('k', 'health'), S: it('.', 'shokka'), U: it('2', 'udamage', 'xy'), D: it('8', 'dakka'), A: it('8', 'shield', 'x'),
        R: { base: 'k', e: 'flag', ep: { team: 0 }, mx: 'B', one: 'y' }, B: { base: 'k', e: 'flag', ep: { team: 1 }, mx: 'R', one: 'y' },
        8: { f: 4, ft: 'planks' },
      },
      rows: [
        '################',
        '#888888K888A8888',
        '#8.......1234567',
        '#8....H.........',
        '#8######........',
        '#8#kkkk#........',
        '#8#kpkk#..F.....',
        '#D#kkkk#....o...',
        '#8#khkk#..P.....',
        '#8#kkkk#......S.',
        '#8#kpkk.....o.22',
        '#8#kRkk.......2U',
      ],
    },
    // CTF-Coax Canyon: two bases on cliffs over a dusty canyon, one rope bridge, two jump pads up from the bottom
    canyon: {
      id: 'canyon', game: 'jrt', title: 'Coax Canyon', by: 'Callum', demo: false, grav: 20, sky: 'dusk', modes: ['ctf', 'dm'],
      blurb: 'Two forts on two cliffs and a very long way down in between. One wobbly bridge. Jump pads at the bottom for when you fall off the wobbly bridge.',
      mirror: 'xy', defaults: { sky: true, h: 8 },
      look: { ft: 'cobble', wt: 'cstone', st: 'cstone', ct: 'wood', rt: 'cstone', amb: [0.54, 0.46, 0.42] },
      legend: {
        '#': { s: 1, h: 8 }, k: { f: 4, c: 8, sky: false, ft: 'planks', ct: 'wood' }, '8': { f: 4, ft: 'cobble' }, b: { f: 4, ft: 'planks', slab: 0.4 },
        ',': { f: 0, ft: 'cobble' }, o: { s: 1, h: 5.5, wt: 'cstone' },
        J: { base: ',', e: 'pad' }, P: { base: '8', e: 'spawn' }, p: { base: 'k', e: 'spawn' }, Q: { base: ',', e: 'spawn' },
        H: it('8', 'health'), h: it(',', 'health'), v: it('b', 'vial'), A: it('k', 'shield', 'x'), S: it('8', 'shokka'), D: it(',', 'dakka'), F: it(',', 'flak'), K: it('8', 'rokkit'), U: it(',', 'udamage', 'xy'),
        L: lt('k', [1, 0.7, 0.4], 7, 1.1, null, 3.2),
        R: { base: 'k', e: 'flag', ep: { team: 0 }, mx: 'B', one: 'y' }, B: { base: 'k', e: 'flag', ep: { team: 1 }, mx: 'R', one: 'y' },
      },
      rows: [
        '################',
        '#88888888#,,,,,,',
        '#8kkkkkk8#,D,,,,',
        '#8kLkkpk8#,,,o,,',
        '#8kkkkkk87654321',
        '#8kkAkkk8,,,,,,,',
        '#8kkkkkk8,,J,,,,',
        '#8kpkkHk8,,,,,F,',
        '#8kkkkkk8,,,,,,,',
        '#8kkLkkk8,h,,o,,',
        '#88S888P8bbbbbbb',
        '#8Kkk8Rk8,,,,,,U',
      ],
    },
    // ---------------------------------------------------------------- JAQUAKE deathmatch
    // DM1: The Rusty Pit. A big hall round a lava pit with a bridge across it, a walkway up top, four rooms round the edge.
    jqdm1: {
      id: 'jqdm1', game: 'jq', title: 'DM1: The Rusty Pit', by: 'Jack', demo: true, grav: 20, sky: 'quake', modes: ['dm', 'coop'],
      blurb: 'A rusty old foundry hall with a lava pit in the middle and one bridge across it. The Quad Jack sits on the bridge. Of course it does.',
      mirror: 'xy', defaults: { c: 4, h: 6, ft: 'floor', ct: 'ceil', wt: 'brick', st: 'brick2' },
      look: { quake: 1, amb: [0.36, 0.3, 0.25], fog: [0.07, 0.05, 0.03] },
      legend: {
        '#': { s: 1, wt: 'brick' }, '%': { s: 1, wt: 'metal' }, '&': { s: 1, wt: 'rune' },
        '.': { f: 0, c: 4 }, ';': { f: 0, c: 3.2, wt: 'brick2' }, ',': { f: 0, c: 9, ft: 'rust', ct: 'ceil', wt: 'metal' },
        u: { f: 2.5, c: 9, ft: 'metal', st: 'metal', wt: 'metal' }, l: { f: 0, c: 9, liq: 'lava', depth: 1, wt: 'metal' }, '=': { f: 0.5, c: 9, ft: 'crate', st: 'crate', wt: 'metal' },
        1: { f: 0.5, c: 9, st: 'metal', ft: 'rust' }, 2: { f: 1, c: 9, st: 'metal', ft: 'rust' }, 3: { f: 1.5, c: 9, st: 'metal', ft: 'rust' }, 4: { f: 2, c: 9, st: 'metal', ft: 'rust' },
        P: { base: '.', e: 'spawn' }, p: { base: ',', e: 'spawn' }, q: { base: 'u', e: 'spawn' },
        t: { base: '.', e: 'torch' }, T: { base: ',', e: 'torch' }, w: { base: 'u', e: 'torch' }, o: { base: '.', e: 'lamp' }, I: { s: 1, wt: 'rune', h: 9 },
        H: it('.', 'pie'), h: it(',', 'pie'), M: it('u', 'mega', 'xy'), a: it('.', 'armour1'), Y: it('u', 'armour2', 'xy'), Q: it('=', 'quad', 'xy'),
        s: it('.', 'shells'), n: it(',', 'rivets'), r: it('u', 'rockets'), G: it('.', 'rivetgun'), K: it('u', 'launcher', 'x'),
      },
      rows: [
        '###############',
        '#t..s.#;;;;;;;;',
        '#.P...;;%%%%%%%',
        '#..H..#;%uuwuwu',
        '#o....#;%uMurur',
        '##;####;%u4321,',
        '#....t#;%u3,I,,',
        '#.a...;;;u2,lll',
        '#.....#%%u1,lll',
        '#G..P.#T,,,,lll',
        '#..s..;,,,,h===',
      ],
    },
    // DM2: Jackstone Cloisters. A monastery courtyard (open to the sky) with a slime moat round a raised lawn, cloisters
    // all round it and a gallery up the stairs.
    jqdm2: {
      id: 'jqdm2', game: 'jq', title: 'DM2: Jackstone Cloisters', by: 'Jack', demo: true, grav: 20, sky: 'quake', modes: ['dm', 'coop'],
      blurb: 'A crumbly monastery with a courtyard open to the sky, a slime moat, cloisters to run round and a gallery with the rocket launcher. The monks have gone. The imps have not.',
      mirror: 'xy', defaults: { c: 4, h: 6, ft: 'floor', ct: 'ceil', wt: 'brick2', st: 'brick2' },
      look: { quake: 1, amb: [0.38, 0.33, 0.29], fog: [0.06, 0.05, 0.05] },
      legend: {
        '#': { s: 1, wt: 'brick2' }, '&': { s: 1, wt: 'rune' }, '%': { s: 1, wt: 'metal' },
        '.': { f: 0, c: 4 }, ':': { f: 0, c: 3.5, ft: 'rune', ct: 'rune', wt: 'rune' }, ',': { f: 0, c: 10, sky: true, ft: 'rust' },
        g: { f: 1, c: 10, sky: true, ft: 'grass', st: 'mossy' }, s: { f: 0, c: 10, sky: true, liq: 'slime', depth: 1, wt: 'mossy' },
        u: { f: 3, c: 6.5, ft: 'wood', st: 'brick2', ct: 'ceil' }, 1: { f: 0.5, c: 6.5, ft: 'floor' }, 2: { f: 1, c: 6.5 }, 3: { f: 1.5, c: 6.5 }, 4: { f: 2, c: 6.5 }, 5: { f: 2.5, c: 6.5 },
        P: { base: '.', e: 'spawn' }, p: { base: ',', e: 'spawn' }, q: { base: 'u', e: 'spawn' },
        t: { base: '.', e: 'torch' }, T: { base: 'u', e: 'torch' }, o: { base: ':', e: 'lamp' },
        H: it('.', 'pie'), h: it(',', 'pie'), M: it('g', 'mega', 'xy'), a: it('u', 'armour1'), Y: it(':', 'armour2', 'xy'), Q: it('u', 'quad', 'xy'),
        e: it('.', 'shells'), n: it('.', 'rivets'), r: it('u', 'rockets'), G: it(',', 'rivetgun'), K: it(':', 'launcher', 'xy'),
      },
      rows: [
        '################',
        '#uuuuuuT#....t..',
        '#uauuruu#.H.....',
        '#u54321.:..P....',
        '#q#####.:###.###',
        '#..t..#.:o:Y:K::',
        '#.P...#..#,,,,,,',
        '#..e..:..#,ssss,',
        '##.####..#,sggg,',
        '#.....:.t#,sgMg,',
        '#.H.n.:...,sggG,',
        '#.....#...,hgggp',
      ],
    },
  };
  // which maps each game type rotates through (the demo only has the demo maps)
  const ROT = { 'jrt-dm': ['spacegrot', 'foundry', 'castle', 'canyon'], 'jrt-ctf': ['spacegrot', 'foundry', 'canyon', 'castle'], 'jq-dm': ['jqdm1', 'jqdm2'], 'jq-coop': ['jqdm2', 'jqdm1'] };
  function rotation(game, mode, full) { return (ROT[game + '-' + mode] || ROT[game + '-dm'] || []).filter(id => MAPS[id] && (full || MAPS[id].demo) && (MAPS[id].modes || ['dm']).includes(mode)); }
  const RULES = { jrt: { W, ITEMS, abs0: 0.6, start: 3 }, jq: { W: WQ, ITEMS: ITEMS_Q, abs0: 0, start: 3 } };
  const rules = game => RULES[game] || RULES.jrt;
  const gameOf = id => (MAPS[id] && MAPS[id].game) || 'jrt';
  // 1999 calendar: JRT's full version is out on 22 November (until the year loops on 1 January)
  const fullOn = md => md >= 1122;

  const PARSED = {};
  function map(id) {
    if (!MAPS[id]) id = 'spacegrot';
    if (!PARSED[id]) {
      const M = PARSED[id] = Grid.parse(MAPS[id]);
      M.id = id; M.meta = MAPS[id];
      M.spawns = M.find('spawn'); M.items = M.find('item'); M.pads = M.find('pad'); M.flags = M.find('flag').sort((a, b) => a.team - b.team);
      M.lights = M.find('light'); M.torches = M.find('torch'); M.lamps = M.find('lamp');
      // each jump pad aims at the nearest high ground in front of it
      M.pads.forEach(p => {
        let best = null, bd = 1e9;
        for (const c of M.cells) if (!c.s && !c.v && c.f >= p.y + 2 && Math.abs((c.i + 0.5) * M.S - p.x) < 4) { const d = Math.hypot((c.i + 0.5) * M.S - p.x, (c.j + 0.5) * M.S - p.z); if (d < bd) { bd = d; best = c; } }
        if (best) { p.tx = (best.i + 0.5) * M.S; p.tz = (best.j + 0.5) * M.S + Math.sign((best.j + 0.5) * M.S - p.z) * 1.2; p.ty = best.f; }
        else { p.tx = p.x; p.tz = p.z; p.ty = p.y + 4; }
      });
      M.jumpUp = 1.05; // how high a jump lifts you onto a ledge (the bots' route planner uses it)
    }
    return PARSED[id];
  }
  // launch velocity for a jump pad (apex 2.6 above the target)
  function padVel(M, p) {
    const g = M.meta.grav, top = Math.max(p.y, p.ty) + 2.6;
    const vy = Math.sqrt(2 * g * (top - p.y)), tUp = vy / g, tDown = Math.sqrt(2 * (top - p.ty) / g), T = tUp + tDown;
    return [(p.tx - p.x) / T, vy, (p.tz - p.z) / T];
  }

  // ================================================================ the referee
  // the announcer, kid-friendly: nobody gets killed in a Jack game, they go POOF
  const SPREE = [[5, 'is on a POOFING SPREE!'], [10, 'is on a RAMPAGE!'], [15, 'is DOMINATING!'], [20, 'is UNSTOPPABLE!'], [25, 'is GODLIKE!']];
  const MULTI = ['', '', 'Double Poof!', 'Multi Poof!', 'Ultra Poof!', 'M-M-M-MONSTER POOF!!!'];
  const TEAM = ['Red', 'Blue'];
  const HAZ = { lava: [24, 'took a lava bath'], slime: [7, 'had a sit down in the slime'] };
  const AWAY = 4000; // a player who has not moved for this long is "away" (tabbed out): shots don't count on them
  const num = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;
  const r2 = v => Math.round(v * 100) / 100;

  class Referee {
    constructor(o) {
      this.o = Object.assign({ map: 'spacegrot', mode: 'dm', frags: 15, caps: 3, time: 0, max: 8, waves: 6 }, o || {});
      if (!MAPS[this.o.map]) this.o.map = 'spacegrot';
      this.o.game = gameOf(this.o.map);
      const modes = MAPS[this.o.map].modes || ['dm'];
      if (!modes.includes(this.o.mode)) this.o.mode = 'dm';
      this.RU = rules(this.o.game); this.W = this.RU.W; this.IT = this.RU.ITEMS;
      this.M = map(this.o.map);
      this.E = new Map(); this.ev = []; this.state = 'play'; this.endAt = 0; this.kills = 0;
      this.items = this.M.items.map(x => ({ it: x.it, x: x.x, y: x.y, z: x.z, up: true, at: 0 }));
      this.flags = this.M.flags.map(f => ({ team: f.team, hx: f.x, hy: f.y, hz: f.z, x: f.x, y: f.y, z: f.z, st: 'home', by: 0, at: 0 }));
      this.ts = [0, 0]; this.started = this.now(); this.lastT = this.now();
      this.wave = 0; this.waveAt = this.now() + 4000; this.monN = 0; this.monLeft = 0;
    }
    now() { return Date.now(); }
    get ctf() { return this.o.mode === 'ctf' && this.flags.length === 2; }
    get coop() { return this.o.mode === 'coop'; }
    get teams() { return this.ctf || this.coop; }
    say(to, text, big) { this.ev.push(['a', to, text, big ? 1 : 0]); }
    add(id, o) {
      o = o || {};
      const W_ = this.W;
      const e = { id, name: String(o.name || 'Player').slice(0, 20), bot: !!o.bot, skill: o.skill || 0, team: -1, p: [0, 0, 0], yaw: 0, pitch: 0, w: 1, hp: 0, ar: 0, abs: this.RU.abs0,
        alive: false, deadAt: 0, frags: 0, deaths: 0, caps: 0, has: this.RU.start, ammo: W_.map(w => w.start), ud: 0, udm: 2, spree: 0, best: 0, mN: 0, mT: 0, carry: -1, last: this.now(), seen: this.now(), tele: false,
        fireT: W_.map(() => 0), tok: W_.map(() => 3), tokT: this.now(), bud: W_.map(() => 0).concat(W_.map(() => 0)), budT: W_.map(() => 0).concat(W_.map(() => 0)), joined: this.now(), spec: false, mon: o.mon || '', haz: 0, decT: 0 };
      if (e.mon) { const S = MONS[e.mon]; e.team = 1; e.mhp = S.hp; e.has = 1 << S.w; e.w = S.w; e.ammo = W_.map(() => -1); }
      else if (this.coop) e.team = 0;
      else if (this.ctf) { const n = [0, 0]; for (const x of this.E.values()) if (x.team >= 0) n[x.team]++; e.team = o.team === 0 || o.team === 1 ? o.team : (n[0] <= n[1] ? 0 : 1); }
      this.E.set(id, e);
      this.spawn(e, o.at);
      return e;
    }
    remove(id) { const e = this.E.get(id); if (!e) return; this.dropFlag(e); this.E.delete(id); this.ev.push(['x', id]); }
    // ---- spawning: as far from the enemy as possible (with a bit of luck)
    spawn(e, at) {
      const now = this.now();
      let S = this.M.spawns;
      if (this.ctf && e.team >= 0) { const half = this.M.w * this.M.S / 2; const t = S.filter(s => (s.x < half) === (e.team === 0)); if (t.length) S = t; }
      let best = S[0], bs = -1;
      if (at) best = at;
      else for (const s of S) {
        let md = 99;
        for (const x of this.E.values()) if (x !== e && x.alive && (x.team < 0 || x.team !== e.team)) md = Math.min(md, Math.hypot(x.p[0] - s.x, x.p[2] - s.z));
        if (this.coop && !e.mon) { md = 0; for (const x of this.E.values()) if (x !== e && x.alive && !x.mon) md = Math.max(md, 30 - Math.hypot(x.p[0] - s.x, x.p[2] - s.z)); } // co-op: near your mates
        const sc = md + Math.random() * 6; if (sc > bs) { bs = sc; best = s; }
      }
      const half = this.M.w * this.M.S / 2;
      e.p = [best.x, best.y, best.z]; e.yaw = best.x < half ? -Math.PI / 2 : Math.PI / 2; e.pitch = 0;
      e.alive = true; e.hp = e.mon ? e.mhp : 100; e.ar = 0; e.abs = this.RU.abs0; e.ud = 0; e.udm = 2; e.tele = true; e.last = now; e.seen = now; e.spawnAt = now; e.spree = 0; e.carry = -1; e.haz = 0;
      if (!e.mon) { e.has = this.RU.start; e.ammo = this.W.map(w => w.start); e.w = 1; }
      this.ev.push(['sp', e.id, r2(e.p[0]), r2(e.p[1]), r2(e.p[2]), r2(e.yaw)]);
    }
    respawn(id) { const e = this.E.get(id); if (!e || e.alive || e.mon || this.state !== 'play') return false; if (this.now() - e.deadAt < 1400) return false; this.spawn(e); return true; }
    // ---- movement (validated)
    update(id, m) {
      const e = this.E.get(id); if (!e || !m) return;
      const now = this.now();
      e.yaw = num(m.yaw, e.yaw) % (Math.PI * 2); e.pitch = Math.max(-1.6, Math.min(1.6, num(m.pitch, e.pitch)));
      const w = m.w | 0; if (w >= 0 && w < this.W.length && (e.has & (1 << w))) e.w = w;
      if (!e.alive || !Array.isArray(m.p) || m.p.length < 3) { e.last = now; return; }
      const x = num(m.p[0], NaN), y = num(m.p[1], NaN), z = num(m.p[2], NaN);
      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return;
      const fix = () => this.ev.push(['fix', id, r2(e.p[0]), r2(e.p[1]), r2(e.p[2])]);
      if (e.tele) { // just spawned: wait for the client to arrive at the spawn point
        if (Math.hypot(x - e.p[0], z - e.p[2]) > 3) { if (now - e.spawnAt > 2500) { this.ev.push(['sp', e.id, r2(e.p[0]), r2(e.p[1]), r2(e.p[2]), r2(e.yaw)]); e.spawnAt = now; } return; }
        e.tele = false; e.last = now;
      }
      const dt = Math.min(1, Math.max(0.05, (now - e.last) / 1000));
      const W_ = this.M.w * this.M.S, H_ = this.M.h * this.M.S;
      if (x < 0 || z < 0 || x > W_ || z > H_ || y > 40) return fix();
      if (Math.hypot(x - e.p[0], z - e.p[2]) > 34 * dt + 2.5 || Math.abs(y - e.p[1]) > 40 * dt + 3) { e.last = now; return fix(); }
      const c = this.M.at(x, z);
      if (c.s || (!c.v && y < c.f - 0.6)) { e.last = now; return fix(); }
      if (Math.hypot(x - e.p[0], y - e.p[1], z - e.p[2]) > 0.02 || Math.abs(num(m.yaw, 0) - e.yaw) > 0.001) e.seen = now;
      e.p = [x, y, z]; e.last = now;
      if (y < -30) return this.kill(e, e, -1, 'fell into the void');
      this.touch(e);
    }
    away(e) { return !e.bot && e.alive && this.now() - e.seen > AWAY; }
    touch(e) {
      if (e.mon) return;
      const now = this.now();
      this.items.forEach((t, i) => {
        if (!t.up || Math.hypot(t.x - e.p[0], t.z - e.p[2]) > 1.3 || Math.abs(t.y - e.p[1]) > 1.8) return;
        const I = this.IT[t.it]; if (!I) return;
        if (I.hp) { if (e.hp >= I.hpMax) return; e.hp = Math.min(I.hpMax, e.hp + I.hp); }
        else if (I.ar) {
          if (I.set) { if (e.ar >= I.ar && e.abs >= I.abs) return; if (I.abs > e.abs || e.ar < I.ar) { e.ar = Math.max(I.abs > e.abs ? 0 : e.ar, I.ar); e.abs = Math.max(e.abs, I.abs); } }
          else { if (e.ar >= I.arMax) return; e.ar = Math.min(I.arMax, e.ar + I.ar); e.abs = Math.max(e.abs, I.abs || 0.6); }
        }
        else if (I.ud) { e.ud = now + I.ud * 1000; e.udm = I.mult || 2; }
        else if (I.w != null) { const wp = this.W[I.w]; e.has |= 1 << I.w; e.ammo[I.w] = Math.min(wp.max, Math.max(0, e.ammo[I.w]) + wp.pick); }
        else if (I.am != null) { const wp = this.W[I.am]; if (e.ammo[I.am] >= wp.max) return; e.ammo[I.am] = Math.min(wp.max, Math.max(0, e.ammo[I.am]) + I.amN); }
        t.up = false; t.at = now + I.resp * 1000;
        this.ev.push(['pk', e.id, i]);
        if (I.big) this.say(0, `${e.name} got the ${I.ud ? (this.o.game === 'jq' ? 'Quad Jack' : 'Jack Juice') : 'Mega Pie'}!`);
      });
      if (!this.ctf || e.team < 0) return;
      for (const f of this.flags) {
        if (Math.hypot(f.x - e.p[0], f.z - e.p[2]) > 1.4 || Math.abs(f.y - e.p[1]) > 2) continue;
        if (f.team !== e.team) {
          if (f.st !== 'carried') { f.st = 'carried'; f.by = e.id; e.carry = f.team; this.say(0, `${e.name} took the ${TEAM[f.team]} flag!`); this.ev.push(['fl', f.team, 'take', e.id]); }
        } else if (f.st === 'dropped') { this.home(f); this.say(0, `${e.name} returned the ${TEAM[f.team]} flag.`); this.ev.push(['fl', f.team, 'ret', e.id]); }
        else if (f.st === 'home' && e.carry >= 0) {
          const g = this.flags[e.carry]; this.home(g); e.carry = -1; e.caps++; e.frags += 3; this.ts[e.team]++;
          this.say(0, `${e.name} captured the ${TEAM[g.team]} flag! ${TEAM[e.team].toUpperCase()} TEAM SCORES!`, 1); this.ev.push(['fl', g.team, 'cap', e.id]);
          if (this.ts[e.team] >= this.o.caps) this.end(`${TEAM[e.team]} team`);
        }
      }
    }
    home(f) { f.st = 'home'; f.x = f.hx; f.y = f.hy; f.z = f.hz; f.by = 0; for (const e of this.E.values()) if (e.carry === f.team) e.carry = -1; }
    dropFlag(e) {
      if (e.carry < 0) return; const f = this.flags[e.carry]; e.carry = -1; if (!f) return;
      if (e.p[1] < -20) { this.home(f); this.say(0, `The ${TEAM[f.team]} flag fell into the void and went home.`); this.ev.push(['fl', f.team, 'ret', 0]); return; }
      f.st = 'dropped'; f.by = 0; f.x = e.p[0]; f.y = this.M.floorAt(e.p[0], e.p[2]) > -100 ? this.M.floorAt(e.p[0], e.p[2]) : e.p[1]; f.z = e.p[2]; f.at = this.now() + 25000;
      this.say(0, `${e.name} dropped the ${TEAM[f.team]} flag.`); this.ev.push(['fl', f.team, 'drop', e.id]);
    }
    // ---- shooting: a 'fire' is checked against fire rate and ammo, and buys a small budget of hits
    fire(id, w, o, d) {
      const e = this.E.get(id), now = this.now(); w = w | 0; const W_ = this.W, alt = w >= ALT ? 1 : 0; if (alt) w -= ALT;
      if (!e || !e.alive || this.state !== 'play' || w < 0 || w >= W_.length || !(e.has & (1 << w))) return false;
      const gun = W_[w], wp = alt ? gun.alt : gun; if (!wp) return false;
      const el = (now - e.tokT) / 1000; e.tokT = now;
      // a token bucket per gun, in primary shots: an alt shot costs its own rate's worth. It holds 3 shots (or 0.4 s worth for
      // the quick guns), so a clump of shots that the network delayed and then delivered together still all count
      for (let k = 0; k < W_.length; k++) e.tok[k] = Math.min(Math.max(3, 0.4 / W_[k].rate, W_[k].alt ? 3 * W_[k].alt.rate / W_[k].rate : 0), e.tok[k] + el / W_[k].rate);
      const cost = alt ? wp.rate / gun.rate : 1;
      if (e.tok[w] < cost - 1e-6) return false;
      if (gun.max >= 0 && e.ammo[w] <= 0) return false;
      e.tok[w] -= cost; if (gun.max >= 0) e.ammo[w]--;
      const bi = w + alt * W_.length;
      e.bud[bi] = Math.min(wp.hits * 3, (now < e.budT[bi] ? e.bud[bi] : 0) + wp.hits); e.budT[bi] = now + wp.win;
      e.w = w; e.seen = now; w += alt * ALT;
      const oo = Array.isArray(o) ? o.slice(0, 3).map(v => r2(num(v, 0))) : [e.p[0], e.p[1] + 1.5, e.p[2]];
      if (Math.hypot(oo[0] - e.p[0], oo[1] - e.p[1], oo[2] - e.p[2]) > 4) { oo[0] = e.p[0]; oo[1] = e.p[1] + 1.5; oo[2] = e.p[2]; }
      let dd = Array.isArray(d) ? d.slice(0, 3).map(v => num(v, 0)) : [0, 0, 1]; const L = Math.hypot(dd[0], dd[1], dd[2]) || 1; dd = dd.map(v => r2(v / L));
      this.ev.push(['f', id, w, oo[0], oo[1], oo[2], dd[0], dd[1], dd[2]]);
      return true;
    }
    hit(id, vid, w, dmg) {
      const e = this.E.get(id), v = this.E.get(vid), now = this.now(); w = w | 0; const W_ = this.W, alt = w >= ALT ? 1 : 0; if (alt) w -= ALT;
      if (!e || !v || !v.alive || this.state !== 'play' || w < 0 || w >= W_.length) return false;
      const wp = alt ? W_[w].alt : W_[w]; if (!wp) return false;
      const bi = w + alt * W_.length;
      if (!(now < e.budT[bi] && e.bud[bi] > 0)) return false;
      if (v.spawnAt && now - v.spawnAt < 900 && !v.mon) return false; // a moment of spawn protection
      if (this.teams && v !== e && v.team === e.team) return false;
      if (v !== e && this.away(v)) return false; // no shooting people who have gone to make a cup of tea
      dmg = Math.max(0, Math.min(wp.dmg, num(dmg, 0)));
      if (!dmg) return false;
      const d = Math.hypot(v.p[0] - e.p[0], v.p[1] - e.p[1], v.p[2] - e.p[2]);
      if (d > wp.range + 6) return false;
      if (!wp.proj && v !== e) { // hitscan: the shooter must be able to see the victim (head or body)
        const M = this.M, vh = v.mon ? MONS[v.mon].h : 1.8, ok = M.los(e.p[0], e.p[1] + 1.5, e.p[2], v.p[0], v.p[1] + vh * 0.55, v.p[2], 0.6) || M.los(e.p[0], e.p[1] + 1.5, e.p[2], v.p[0], v.p[1] + vh * 0.9, v.p[2], 0.6);
        if (!ok) return false;
      }
      e.bud[bi]--;
      if (v === e) dmg *= 0.6; else if (e.ud > now) dmg *= e.udm || 2;
      const a = Math.min(v.ar, dmg * (v.abs || 0)); v.ar -= a; v.hp -= dmg - a;
      this.ev.push(['h', vid, Math.round(dmg), id]);
      if (v.hp <= 0) this.kill(e, v, w + alt * ALT);
      return true;
    }
    suicide(id, why) { const e = this.E.get(id); if (e && e.alive) this.kill(e, e, -1, why || 'had a little accident'); }
    kill(k, v, w, why) {
      const now = this.now();
      v.alive = false; v.hp = 0; v.deadAt = now; v.deaths++;
      if (v.p[1] < -20) v.carry >= 0 && this.dropFlag(v); else this.dropFlag(v);
      if (v.spree >= 5 && k !== v) this.say(0, `${v.name}'s poofing spree was ended by ${k.name}!`);
      v.spree = 0;
      this.ev.push(['k', k.id, v.id, w, why || '']);
      if (v.mon) { this.monLeft = Math.max(0, this.monLeft - 1); v.goneAt = now + 2500; }
      if (k === v || w < 0) { if (!v.mon) v.frags--; return; }
      if (k.mon) return; // a monster got you: no frag for it
      k.frags++; this.kills++;
      if (this.kills === 1 && !this.coop) this.say(0, `${k.name} scored the FIRST POOF!`, 1);
      k.spree++; k.best = Math.max(k.best || 0, k.spree);
      const sp = SPREE.find(s => s[0] === k.spree); if (sp && !(this.coop && k.bot)) this.say(0, `${k.name} ${sp[1]}`, 1); // (co-op: only people get sprees shouted)
      k.mN = now - k.mT < 3500 ? k.mN + 1 : 1; k.mT = now;
      if (k.mN >= 2) this.say(k.id, MULTI[Math.min(5, k.mN)], 1);
      if (!this.teams && k.frags >= this.o.frags) this.end(k.name);
    }
    end(who) {
      if (this.state !== 'play') return;
      this.state = 'end'; this.endAt = this.now() + 10000;
      this.ev.push(['end', who]);
    }
    restart() {
      this.state = 'play'; this.kills = 0; this.ts = [0, 0]; this.started = this.now(); this.wave = 0; this.waveAt = this.now() + 4000; this.monLeft = 0;
      this.items.forEach(t => { t.up = true; }); this.flags.forEach(f => this.home(f));
      for (const e of [...this.E.values()]) { if (e.mon) { this.E.delete(e.id); this.ev.push(['x', e.id]); continue; } e.frags = 0; e.deaths = 0; e.caps = 0; e.mN = 0; e.best = 0; this.spawn(e); }
      this.ev.push(['start']);
    }
    // co-op: waves of monsters. Wave n brings 3 + 2n of them; every third wave has a Big Robot; clear the last one to win.
    waves(now) {
      for (const e of [...this.E.values()]) if (e.mon && !e.alive && now > (e.goneAt || 0)) { this.E.delete(e.id); this.ev.push(['x', e.id]); }
      const players = [...this.E.values()].filter(e => !e.mon);
      if (!players.length) return;
      const alive = [...this.E.values()].filter(e => e.mon && e.alive);
      // stragglers that have been hiding for ages get bored and come looking for you
      if (alive.length && this.waveT && now - this.waveT > 75000 && now - (this.boredT || 0) > 20000) {
        this.boredT = now; const near = this.M.spawns.slice().sort((a, b) => this.distP(a, players) - this.distP(b, players)).filter(s => this.distP(s, players) > 6);
        alive.forEach((e, i) => { const s = near[i % Math.max(1, near.length)] || this.M.spawns[0]; const hp = e.hp; this.spawn(e, s); e.hp = hp; });
        if (alive.length) this.say(0, alive.length === 1 ? 'The last monster has come out of hiding!' : `The last ${alive.length} monsters have come out of hiding!`);
      }
      this.monLeft = alive.length;
      if (alive.length) return;
      if (!this.waveAt) { if (this.wave >= this.o.waves) { this.end('The players'); return; } this.waveAt = now + 5000; this.say(0, `Wave ${this.wave} cleared!${this.wave + 1 >= this.o.waves ? ' One more to go!' : ''}`, 1); return; }
      if (now < this.waveAt) return;
      this.waveAt = 0; this.wave++; this.waveT = now;
      const n = Math.min(16, 4 + this.wave * 2), kinds = this.wave === 1 ? ['blob', 'imp'] : this.wave < 4 ? ['blob', 'imp', 'robot'] : ['blob', 'imp', 'robot', 'robot'], bigs = Math.floor(this.wave / 3);
      const far = this.M.spawns.slice().sort((a, b) => this.distP(b, players) - this.distP(a, players));
      for (let k = 0; k < n; k++) {
        const kind = k < bigs ? 'bigrobot' : kinds[Math.floor(Math.random() * kinds.length)];
        const s = far[k % Math.max(1, Math.ceil(far.length / 2))], at = { x: s.x + (Math.random() - 0.5) * 1.2, y: s.y, z: s.z + (Math.random() - 0.5) * 1.2 };
        this.monN++; this.add(2000000 + this.monN, { name: MONS[kind].n.replace(/^an? /, '').replace(/^\w/, c => c.toUpperCase()), bot: true, mon: kind, at });
      }
      this.monLeft = n;
      this.say(0, this.wave === this.o.waves ? `FINAL WAVE! ${n} monsters, ${bigs} of them BIG!` : `WAVE ${this.wave} of ${this.o.waves}! ${n} monsters incoming!`, 1);
    }
    distP(s, players) { let m = 1e9; for (const e of players) m = Math.min(m, Math.hypot(e.p[0] - s.x, e.p[2] - s.z)); return m; }
    tick() {
      const now = this.now(), dt = Math.min(1, (now - this.lastT) / 1000); this.lastT = now;
      if (this.state === 'end') { if (!this.o.hold && now > this.endAt) this.restart(); return; }
      this.items.forEach((t, i) => { if (!t.up && now > t.at) { t.up = true; this.ev.push(['up', i]); } });
      for (const f of this.flags) {
        if (f.st === 'dropped' && now > f.at) { this.home(f); this.say(0, `The ${TEAM[f.team]} flag returned to base.`); this.ev.push(['fl', f.team, 'ret', 0]); }
        if (f.st === 'carried') { const c = this.E.get(f.by); if (!c || !c.alive) { this.home(f); } else { f.x = c.p[0]; f.y = c.p[1]; f.z = c.p[2]; } }
      }
      // lava and slime hurt; JAQUAKE's Mega Pie wears off down to 100
      for (const e of this.E.values()) {
        if (!e.alive) continue;
        const c = this.M.at(e.p[0], e.p[2]), hz = c.liq && HAZ[c.liq];
        if (hz && e.p[1] < c.lv - 0.2 && !e.mon) { e.haz += hz[0] * dt; if (e.haz >= 5) { const n = Math.floor(e.haz); e.haz -= n; e.hp -= n; this.ev.push(['h', e.id, n, 0]); if (e.hp <= 0) this.kill(e, e, -1, hz[1]); } }
        if (e.hp > 100 && !e.mon) { e.decT += dt; if (e.decT >= 1) { e.decT -= 1; e.hp--; } }
      }
      if (this.coop) this.waves(now);
      if (this.o.time && now - this.started > this.o.time * 60000) {
        let best = null; for (const e of this.E.values()) if (!e.mon && (!best || e.frags > best.frags)) best = e;
        this.end(this.coop ? 'Nobody (time ran out)' : this.ctf ? (this.ts[0] === this.ts[1] ? 'Nobody (a draw)' : TEAM[this.ts[0] > this.ts[1] ? 0 : 1] + ' team') : (best ? best.name : 'Nobody'));
      }
    }
    // [id, x, y, z, yaw, pitch, weapon, hp, armour, bits(1 alive, 2 power-up, 4 has flag, 8 blue team, 16 bot, 32 red team, 64 away, 128 monster), monster kind]
    snap() {
      const now = this.now(), out = [];
      for (const e of this.E.values()) {
        const r = [e.id, r2(e.p[0]), r2(e.p[1]), r2(e.p[2]), r2(e.yaw), r2(e.pitch), e.w, Math.max(0, Math.round(e.hp)), Math.round(e.ar), (e.alive ? 1 : 0) | (e.ud > now ? 2 : 0) | (e.carry >= 0 ? 4 : 0) | (e.team === 1 && !e.mon ? 8 : 0) | (e.bot ? 16 : 0) | (e.team === 0 ? 32 : 0) | (this.away(e) ? 64 : 0) | (e.mon ? 128 : 0)];
        if (e.mon) r.push(MONK.indexOf(e.mon) + 1);
        out.push(r);
      }
      return out;
    }
    scores() { return [...this.E.values()].filter(e => !e.mon).map(e => [e.id, e.name, e.frags, e.deaths, e.caps, e.team, e.bot ? 1 : 0]); }
    world() { return { st: this.state, ts: this.ts, it: this.items.map(t => t.up ? 1 : 0), fl: this.flags.map(f => [f.st, r2(f.x), r2(f.y), r2(f.z), f.by]), left: this.o.time ? Math.max(0, this.o.time * 60 - Math.floor((this.now() - this.started) / 1000)) : -1, wv: this.coop ? [this.wave, this.o.waves, this.monLeft] : null }; }
    mine(id) { const e = this.E.get(id); return e ? { am: e.ammo.slice(), has: e.has, ud: Math.max(0, e.ud - this.now()), abs: e.abs } : null; }
    drain() { const ev = this.ev; this.ev = []; return ev; }
  }

  return { ALT, W, WQ, WI, ITEMS, ITEMS_Q, MONS, MONK, MAPS, ROT, RULES, rules, rotation, gameOf, fullOn, map, padVel, Referee, TEAM, MULTI, AWAY };
});

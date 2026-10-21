/* METAL GERBIL SOLID (PlayStation, in Jack's room): Tactical Sneaking Action. Agent SOLID GERBIL creeps into a snowy island
 * base to get back the plans for WHEEL REX (a giant walking hamster wheel) from the FERRETHOUND gang. Six areas (dock,
 * helipad, basement, air duct, lab, hangar), guards with vision cones on the radar, "!" alerts, evasion countdowns, a
 * cardboard box, knocking on walls, crawling under things, keycards, rations, snooze darts, codec calls and a boss you beat
 * by sneaking. Wobbly 1990s polygons on purpose. Everything is original: art, tunes and words.
 * Secrets: lk.sneak.ghost (finish without being spotted once), lk.sneak.box (sit in your box right under a guard's nose). */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;

  // ================================================================ the map legend (one character = one tile = 1 metre)
  //  #  wall          C  crate        B  big crate stack   l  low cover (hides you only when you crawl)   H  big thing (helicopter)
  //  =  crawl space (pipes, under a truck: crawl only, hides you)   ~  water   L  lamp post   T  pillar / tank
  //  .  floor   ,  floor 2   0-3 door (keycard level)   E  exit   P  where you come in
  //  r  ration   a  snooze darts   k  keycard   s  golden sunflower seed   g  vent grate (listen in)   h  steam pipe   b  power switch   o  Dr Ottercon
  const AREAS = [
    { id: 'dock', name: 'DOCK', sub: 'SHADOW MUESLI ISLAND - CARGO DOCK', out: true, floor: 'snow', floor2: 'planks', wall: 'metal', amb: 0.62, sky: 0x070d1c, fog: [13, 30], song: 'sneak', call: 'dock', hint: 'h_dock',
      map: [
        '##########################',
        '#BB.....#EEEE#.......BB..#',
        '#B......#....#........B..#',
        '#.......##..##...........#',
        '#..CC...............CC.r.#',
        '#..CC...............CC...#',
        '#.......L................#',
        '#====##.......BB.....ll..#',
        '#s...##.......BB.........#',
        '#====##..................#',
        '#........................#',
        '#...CC.....ll........CC..#',
        '#...CC...............CC..#',
        '#................L.......#',
        '#..BB..........CC.....a..#',
        '#..BB..........CC........#',
        '#,,,,,,,,,,,,,,,,,,,,,,,,#',
        '~~~~~~~,,,P,,,~~~~~~~~~~~~',
        '~~~~~~~,,,,,,,~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~'],
      lights: [[10.5, 2, 3.2, 0xffd890, 0.7], [15.5, 2, 3.2, 0xffd890, 0.5]],
      objs: [{ t: 'pipes', x: 1, z: 7, w: 4, d: 3 }, { t: 'lift', x: 9, z: 1, w: 4, d: 2 }, { t: 'boat', x: 18, z: 18 }],
      guards: [
        { r: [[2.5, 10.5, 2.2], [23.5, 10.5, 2.2]] },
        { r: [[5.5, 3.5, 1.6], [18.5, 3.5, 1.6], [18.5, 6.5, 0], [5.5, 6.5, 0]] }],
    },
    { id: 'heli', name: 'HELIPAD', sub: 'SHADOW MUESLI ISLAND - HELIPAD', out: true, floor: 'snow', floor2: 'tarmac', wall: 'metal', amb: 0.6, sky: 0x070d1c, fog: [13, 30], song: 'sneak', call: 'heli', hint: 'h_heli', card: 1, on: { k: '=' },
      map: [
        '###########EE#############',
        '#B........#11#..........B#',
        '#........................#',
        '#.......,,,,,,,,,,.......#',
        '#.......,,,,,,,,,,......r#',
        '#.=====.,,HHHHHH,,...CC..#',
        '#.=====.,,HHHHHH,,...CC..#',
        '#.==k==.,,HHHHHH,,.......#',
        '#.=====.,,,,,,,,,,.......#',
        '#.......,,,,,,,,,,...L...#',
        '#..C.....................#',
        '#..CC.......s........ll..#',
        '#....................ll..#',
        '#...BB...........B.......#',
        '#...BB....#..#...B.......#',
        '#.........#P.#...........#',
        '##########################'],
      lights: [[11.5, 1.6, 3.5, 0xffe0a0, 0.8]],
      objs: [{ t: 'truck', x: 2, z: 5, w: 5, d: 4 }, { t: 'heli', x: 10, z: 5, w: 6, d: 3 }, { t: 'pad', x: 8, z: 3, w: 10, d: 7 }, { t: 'lift', x: 11, z: 14, w: 2, d: 2, up: 1 }, { t: 'tower', x: 0.6, z: 0.6 }, { t: 'tower', x: 25.4, z: 16.4 }],
      spots: [{ from: [0.6, 0.6], a: [3.5, 4], b: [22.5, 4], per: 18, ph: 0 }, { from: [25.4, 16.4], a: [2.5, 11.5], b: [23.5, 11.5], per: 20, ph: 0.5 }],
      guards: [
        { r: [[23.5, 2.5, 2], [23.5, 13.5, 2]] },
        { r: [[3.5, 2.5, 2.5], [20.5, 2.5, 2.5]] }],
    },
    { id: 'base', name: 'BASEMENT B1', sub: 'FERRETHOUND HQ - LEVEL B1', out: false, floor: 'concrete', floor2: 'grate', wall: 'panel', amb: 0.5, sky: 0x000000, fog: [12, 26], song: 'sneak', call: 'base', hint: 'h_base', card: 2,
      map: [
        '############################',
        '#......#............#...E..#',
        '#..k...#..l.....l...#......#',
        '#......#..l.....l...#..a...#',
        '#.ll...#............###2####',
        '#......1............#......#',
        '#......#....BB......#......#',
        '########....BB......##.....#',
        '#..........................#',
        '#..........................#',
        '#....CC...........CC.......#',
        '#....CC...........CC.......#',
        '#..........................#',
        '#######.....#####.....######',
        '#.....#.....#...#.....#....#',
        '#..r..#.....#.s.#.....#....#',
        '#.....0.....#...#.....0....#',
        '#.....#.....##0##.....#....#',
        '#######..................###',
        '#######.......P.........####',
        '############################'],
      lights: [[4, 3, 4, 0xfff0d0, 0.6], [14, 3, 5, 0xfff0d0, 0.55], [24, 2.5, 3.5, 0xd0e0ff, 0.5], [6, 10, 4.5, 0xfff0d0, 0.5], [20, 10, 4.5, 0xfff0d0, 0.5], [13.5, 18.5, 4, 0xfff0d0, 0.5], [3, 15, 3, 0xffd0a0, 0.45], [14.5, 15, 2.5, 0xffd0a0, 0.45], [24.5, 15.5, 3, 0xffd0a0, 0.45]],
      objs: [{ t: 'vent', x: 24, z: 1 }],
      cams: [{ x: 14.5, z: 13.02, a: Math.PI, sw: 1.0, per: 7 }],
      guards: [
        { r: [[2.5, 9.5, 2], [25.5, 9.5, 2]] },
        { r: [[9.5, 1.5, 1.5], [18.5, 1.5, 1.5], [18.5, 5.5, 1], [9.5, 5.5, 1]] },
        { r: [[23.5, 5.6, 99, 0]], post: true }],
    },
    { id: 'duct', name: 'AIR DUCT', sub: 'FERRETHOUND HQ - VENTILATION', out: false, duct: true, floor: 'duct', floor2: 'ductgrate', wall: 'duct', amb: 0.42, sky: 0x000000, fog: [9, 20], song: 'vent', call: 'duct', hint: 'h_duct',
      map: [
        '######################',
        '#P...g.....#.......s.#',
        '#########.##.#########',
        '#a.............h.....#',
        '####.###############.#',
        '####.......g...#.....#',
        '##########.###.#.#####',
        '#.....h....#...#.h...#',
        '#.##########.#######.#',
        '#..r.........#E...g..#',
        '######################'],
      lights: [[5.5, 1.5, 2.5, 0xffe8b0, 0.7], [11.5, 5.5, 2.5, 0xffe8b0, 0.7], [18.5, 9.5, 2.5, 0xffe8b0, 0.7], [14.5, 9.5, 2.2, 0xc0ffd0, 0.6]],
      talk: { '5,1': 'eaves1', '11,5': 'eaves3', '18,9': 'eaves2' },
    },
    { id: 'lab', name: 'LABORATORY', sub: 'FERRETHOUND HQ - RESEARCH LAB', out: false, floor: 'labtile', floor2: 'labtile2', wall: 'lab', amb: 0.62, sky: 0x000000, fog: [12, 26], song: 'lab', call: 'lab', hint: 'h_lab', card: 3,
      map: [
        '###########################',
        '#....#...................T#',
        '#.P..#..ll....ll....ll....#',
        '#....0..ll....ll....ll...T#',
        '#....#....................#',
        '######..ll....ll....ll...T#',
        '#s...#..ll....ll....ll....#',
        '#....0....................#',
        '######################..###',
        '#..T...T...T...T...T......#',
        '#a.......................3E',
        '#..T...T...T...T...T......#',
        '#########2#################',
        '#######.....###############',
        '#######..o..###############',
        '#######.r...###############',
        '###########################'],
      lights: [[3, 3, 3, 0xd0f0ff, 0.6], [11, 3, 5, 0xd0f0ff, 0.6], [20, 3, 5, 0xd0f0ff, 0.6], [3, 6.5, 2.5, 0xd0f0ff, 0.45], [6, 10, 3.5, 0x80ffc0, 0.55], [14, 10, 3.5, 0x80ffc0, 0.55], [22, 10, 3.5, 0x80ffc0, 0.55], [9.5, 14, 2.8, 0xffe0b0, 0.55]],
      cams: [{ x: 12.5, z: 1.02, a: 0, sw: 0.9, per: 6 }, { x: 22.5, z: 1.02, a: 0, sw: 0.9, per: 6, ph: 0.5 }],
      lasers: [{ x: 5.5, z0: 9, z1: 12, hi: 1 }, { x: 12.5, z0: 9, z1: 12, blink: [2.2, 1.6] }, { x: 16.5, z0: 9, z1: 12, hi: 1 }, { x: 21.5, z0: 9, z1: 12, blink: [2.4, 1.5], ph: 1 }],
      guards: [{ r: [[7.5, 1.5, 1.2], [24.5, 1.5, 0], [24.5, 7.4, 1.2], [7.5, 7.4, 0]] }],
      npc: { x: 9.5, z: 14.5 },
    },
    { id: 'rex', name: 'HANGAR', sub: 'FERRETHOUND HQ - WHEEL REX HANGAR', out: false, floor: 'hangar', floor2: 'hangar2', wall: 'hangar', amb: 0.66, sky: 0x000000, fog: [16, 34], song: 'boss', call: 'rex', hint: 'h_rex', boss: true,
      map: [
        '##########################',
        '#...........b............#',
        '#........................#',
        '#..T.................T...#',
        '#........................#',
        '#.....C............C.....#',
        '#.....C............C.....#',
        '#........................#',
        '#..T..................T..#',
        '#........................#',
        '#b......................b#',
        '#........................#',
        '#..T..................T..#',
        '#........................#',
        '#.....C............C.....#',
        '#.....C............C.....#',
        '#........................#',
        '#..T.......s.........T...#',
        '#........................#',
        '#...........P............#',
        '##########################'],
      lights: [[12.5, 1.5, 4, 0xff6040, 0.6], [1.5, 10.5, 4, 0xff6040, 0.6], [24.5, 10.5, 4, 0xff6040, 0.6], [13, 10.5, 8, 0x8090ff, 0.6], [12.5, 19, 4, 0xfff0d0, 0.4]],
    },
  ];

  // ================================================================ codec calls: [who, text]   C Colonel Crumpet, O Dr Ottercon, G Solid Gerbil
  // {A} {B} {X} {Y} become the console's own button symbols
  const CALLS = {
    dock: { who: 'C', lines: [
      ['C', 'GERBIL, DO YOU READ ME? THIS IS COLONEL CRUMPET.'],
      ['G', 'LOUD AND CLEAR, COLONEL. IS THAT... SLURPING?'],
      ['C', "IT'S MY TEA. I'VE JUST POURED IT, SO THIS MISSION HAD BETTER NOT TAKE ALL NIGHT."],
      ['C', 'THE FERRETHOUND GANG HAVE NICKED THE PLANS FOR WHEEL REX: THE WORLD\'S FIRST WALKING HAMSTER WHEEL.'],
      ['G', 'A WALKING... HAMSTER WHEEL.'],
      ['C', 'IF THEY BUILD IT, NO SNACK CUPBOARD ON EARTH IS SAFE. GET THOSE PLANS BACK. AND DON\'T GET SEEN!'],
      ['C', 'THE RADAR IN THE CORNER SHOWS THE GUARDS. THE GREEN CONES ARE WHERE THEY ARE LOOKING.'],
      ['C', 'PRESS {A} TO CRAWL. CRAWLING IS LOW AND QUIET, AND YOU CAN SQUEEZE UNDER PIPES.'],
      ['C', '{X} FIRES A SNOOZE DART. {Y} PUTS ON YOUR CARDBOARD BOX.'],
      ['G', 'A BOX? REALLY?'],
      ['C', "TRUST ME. NOBODY EVER CHECKS A CARDBOARD BOX. NOT EVEN WHEN IT'S RIGHT UNDER THEIR NOSE."],
      ['C', 'AND A REAL PRO GETS IN AND OUT WITHOUT BEING SPOTTED ONCE. THE LIFT IS AT THE NORTH END. OFF YOU POP.']] },
    heli: { who: 'C', lines: [
      ['C', "THAT'S THE HELIPAD. MIND THE SEARCHLIGHTS: IF ONE CATCHES YOU, THE WHOLE BASE WILL KNOW."],
      ['C', 'THE MAIN DOOR NEEDS A LEVEL 1 CARD. THE GUARDS HERE ARE CARELESS. HAVE A LOOK UNDER THAT TRUCK.'],
      ['G', "HOW'S THE TEA, COLONEL?"],
      ['C', 'LUKEWARM, GERBIL. LUKEWARM.']] },
    base: { who: 'C', lines: [
      ['C', "YOU'RE IN. THE STORE ROOM IN THE NORTH-EAST HAS A VENT TO THE LAB. ITS DOOR NEEDS A LEVEL 2 CARD."],
      ['C', "IF A GUARD WON'T BUDGE, WALK INTO A WALL TO PRESS UP AGAINST IT, THEN KNOCK WITH {B}. HE'LL COME TO HAVE A LOOK."],
      ['C', 'THEN SNEAK ROUND HIM THE OTHER WAY. AND WATCH THAT CAMERA ON THE WALL.'],
      ['G', 'ANY CHANCE OF A BISCUIT WITH THAT TEA, COLONEL?'],
      ['C', 'FOCUS, GERBIL.']] },
    duct: { who: 'C', lines: [
      ['G', "IT'S A BIT TIGHT IN HERE, COLONEL."],
      ['C', 'BREATHE IN. MIND THE STEAM PIPES: WAIT FOR THE PUFF TO STOP, THEN GO.'],
      ['C', 'AND LISTEN AT THE GRATES. GUARDS LOVE A GOSSIP.']] },
    lab: { who: 'C', lines: [
      ['C', 'THE LAB. THOSE RED BEAMS ARE ALARMS. THE HIGH ONES YOU CAN CRAWL UNDER. THE OTHERS BLINK, SO TIME IT.'],
      ['C', 'THE SCIENTIST WHO BUILT WHEEL REX IS HIDING SOMEWHERE ON THIS FLOOR. FIND HIM.'],
      ['G', 'TEA REPORT, COLONEL?'],
      ['C', "STONE COLD. I'VE PUT IT IN THE MICROWAVE. DON'T TELL ANYONE."]] },
    otter: { who: 'O', lines: [
      ['O', "AAH! DON'T BONK ME! I'M ONLY A SCIENTIST!"],
      ['G', "RELAX. I'M HERE FOR THE WHEEL REX PLANS."],
      ['O', "I'M DR OTTERCON. I DESIGNED WHEEL REX... I THOUGHT IT WAS FOR A THEME PARK!"],
      ['O', 'THE PLANS ARE LOCKED INSIDE REX. TO SHUT HIM DOWN, PULL THE THREE BIG POWER SWITCHES ON THE HANGAR WALLS.'],
      ['O', "HIS EYE SEES EVERYTHING IT POINTS AT, AND BOXES DON'T FOOL ROBOTS. HIDE BEHIND THE PILLARS."],
      ['O', "TAKE MY LEVEL 3 CARD. THE HANGAR IS THROUGH THE DOOR AT THE EAST END. I'LL... STAY IN THIS CUPBOARD."]] },
    rex: { who: 'C', lines: [
      ['C', "GERBIL... THAT'S WHEEL REX!"],
      ['G', "IT'S A GIANT HAMSTER WHEEL. WITH LEGS. AND A LASER EYE."],
      ['C', 'PULL THE THREE POWER SWITCHES WITH {B}. NEVER WHILE HE IS LOOKING AT YOU!'],
      ['C', 'AND HURRY. MY SECOND CUP IS BREWING.']] },
    win: { who: 'C', lines: [
      ['G', "COLONEL, I'VE GOT THE PLANS."],
      ['C', 'MARVELLOUS, GERBIL! THE SNACK CUPBOARDS OF THE WORLD ARE SAFE.'],
      ['C', "NOW COME HOME. I'VE PUT THE KETTLE ON."],
      ['G', 'MILK AND TWO SUGARS, COLONEL.']] },
    h_dock: { who: 'C', lines: [['C', 'THE LIFT IS AT THE NORTH END. HIDE BEHIND THE CRATES AND MOVE WHEN THE GUARDS LOOK AWAY.'], ['C', 'THERE IS SOMETHING SHINY UNDER THE PIPES ON THE WEST SIDE. CRAWL IN WITH {A}.']] },
    h_heli: { who: 'C', lines: [['C', 'THE LEVEL 1 CARD IS UNDER THE TRUCK. CRAWL UNDER IT WITH {A}: NOBODY CAN SEE YOU DOWN THERE.'], ['C', 'THEN SLIP THROUGH THE MAIN DOOR AT THE NORTH WHEN THE GUARD WALKS AWAY.']] },
    h_base: { who: 'C', lines: [['C', 'THE LEVEL 2 CARD IS IN THE OFFICE ON THE WEST SIDE. THE STORE ROOM IS THROUGH THE LEVEL 2 DOOR IN THE NORTH-EAST.'], ['C', 'THAT DOOR GUARD WILL NOT MOVE. PRESS AGAINST A WALL, KNOCK WITH {B}, AND HE WILL COME TO LOOK.']] },
    h_duct: { who: 'C', lines: [['C', 'FOLLOW THE DUCT TO THE GRILLE AT THE FAR END AND DROP INTO THE LAB. WAIT FOR THE STEAM TO STOP.']] },
    h_lab: { who: 'C', lines: [['C', 'THE SCIENTIST IS BEHIND THE LEVEL 2 DOOR ON THE SOUTH SIDE OF THE TANK CORRIDOR.'], ['C', 'CRAWL UNDER THE HIGH BEAMS WITH {A}. THE LOW ONES BLINK OFF NOW AND THEN: GO WHEN THEY DO.']] },
    h_rex: { who: 'C', lines: [['C', 'WATCH WHERE HIS EYE IS POINTING. MOVE BEHIND IT, AND PULL A SWITCH WITH {B} WHEN HE IS LOOKING AWAY.'], ['C', 'IF HE SPOTS YOU, GET BEHIND A PILLAR AND WAIT FOR HIM TO CALM DOWN.']] },
  };
  // overheard through the vent grates
  const EAVES = {
    eaves1: [['GUARD', 'I HEARD THE BOSS IS BUILDING A GIANT HAMSTER WHEEL.'], ['GUARD 2', 'WHAT FOR?'], ['GUARD', 'WORLD DOMINATION, APPARENTLY. OR CARDIO.']],
    eaves2: [['GUARD', 'HAS ANYONE SEEN MY SANDWICH? IT WAS CHEESE AND PICKLE.'], ['GUARD 2', "NO. *MUNCH* NO IDEA, MATE."]],
    eaves3: [['GUARD', 'IF YOU SEE A CARDBOARD BOX, JUST LEAVE IT. IT IS PROBABLY DELIVERIES.']],
  };

  // ================================================================ music (16th-note steps; 0 rest, -1 hold)
  const H = -1;
  const SONGS = {
    title: { bpm: 76, wave: 'triangle', bassWave: 'sawtooth', vol: 0.05, drums: 'o...............',
      lead: [74, H, H, H, H, H, H, H, 77, H, H, H, 76, H, H, H, 72, H, H, H, H, H, 69, H, 70, H, H, H, 72, H, H, H,
        74, H, H, H, H, H, H, H, 81, H, H, H, 79, H, 77, H, 76, H, H, H, H, H, H, H, H, H, H, H, 0, 0, 0, 0,
        74, H, H, H, H, H, H, H, 77, H, H, H, 81, H, H, H, 79, H, H, H, H, H, 77, H, 76, H, H, H, 74, H, H, H,
        72, H, H, H, 74, H, 76, H, 77, H, H, H, 76, H, 72, H, 74, H, H, H, H, H, H, H, H, H, H, H, 0, 0, 0, 0],
      bass: [].concat(...[38, 34, 41, 33, 38, 43, 36, 38].map(r => [r, 0, r, 0, r + 12, 0, r, 0, r, 0, r, 0, r + 12, 0, r + 7, 0])) },
    sneak: { bpm: 96, wave: 'triangle', bassWave: 'sawtooth', vol: 0.045, drums: 'o.......x.......o.......x...x...',
      lead: [0, 0, 0, 0, 0, 0, 0, 0, 79, H, H, H, 78, H, H, H, 76, H, H, H, H, H, H, H, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 83, H, H, H, 82, H, 79, H, 78, H, H, H, H, H, H, H, H, H, H, H, 0, 0, 0, 0,
        0, 0, 0, 0, 71, H, 74, H, 76, H, H, H, 79, H, 78, H, 76, H, H, H, 74, H, H, H, 71, H, H, H, 0, 0, 0, 0,
        0, 0, 0, 0, 71, H, 74, H, 76, H, H, H, 74, H, 72, H, 71, H, H, H, H, H, H, H, H, H, H, H, 0, 0, 0, 0],
      bass: [40, 0, 0, 40, 0, 0, 47, 0, 40, 0, 0, 40, 0, 0, 46, 0, 40, 0, 0, 40, 0, 0, 47, 0, 43, 0, 0, 43, 0, 0, 42, 0] },
    alert: { bpm: 168, wave: 'square', bassWave: 'sawtooth', vol: 0.04, drums: 'o.x.o.xxo.x.o.xo',
      lead: [76, 0, 76, 0, 79, H, 76, 0, 81, H, 79, H, 78, H, 76, H, 76, 0, 76, 0, 79, H, 83, 0, 82, H, 81, H, 79, H, 78, H,
        88, H, 0, 88, 0, 86, H, 0, 84, H, 83, H, 81, H, 79, H, 76, 0, 76, 0, 79, H, 78, 0, 76, H, H, H, 75, H, H, H],
      bass: [40, 40, 52, 40, 40, 52, 40, 40, 43, 43, 55, 43, 42, 42, 54, 42, 40, 40, 52, 40, 40, 52, 40, 40, 38, 38, 50, 38, 39, 39, 51, 39] },
    evasion: { bpm: 132, wave: 'square', bassWave: 'triangle', vol: 0.04, drums: 'o...x...o...x.x.',
      lead: [0, 0, 76, 77, 76, 0, 0, 0, 0, 0, 76, 77, 79, 0, 0, 0, 0, 0, 76, 77, 76, 0, 74, 0, 72, H, H, H, 71, H, H, H],
      bass: [40, 0, 40, 0, 47, 0, 40, 0, 41, 0, 41, 0, 48, 0, 41, 0, 40, 0, 40, 0, 47, 0, 40, 0, 39, 0, 39, 0, 46, 0, 39, 0] },
    vent: { bpm: 88, wave: 'triangle', bassWave: 'triangle', vol: 0.05, drums: '................',
      lead: [0, 0, 0, 0, 81, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 84, 0, 0, 0, 0, 0, 0, 0, 83, 0, 0, 0,
        0, 0, 0, 0, 81, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 0, 0, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bass: [33, H, H, H, 0, 0, 0, 0, 33, H, H, H, 0, 0, 36, 0, 33, H, H, H, 0, 0, 0, 0, 31, H, H, H, 0, 0, 32, 0] },
    lab: { bpm: 104, wave: 'triangle', bassWave: 'sawtooth', vol: 0.042, drums: 'o.......x.......',
      lead: [74, 77, 81, 77, 74, 77, 81, 77, 72, 76, 79, 76, 72, 76, 79, 76, 70, 74, 77, 74, 70, 74, 77, 74, 69, 73, 76, 73, 69, 73, 76, 73,
        81, H, H, H, H, H, H, H, 79, H, 77, H, 76, H, H, H, 74, H, H, H, H, H, H, H, 73, H, H, H, 0, 0, 0, 0],
      bass: [38, 0, 45, 0, 38, 0, 45, 0, 36, 0, 43, 0, 36, 0, 43, 0, 34, 0, 41, 0, 34, 0, 41, 0, 33, 0, 40, 0, 33, 0, 40, 0] },
    boss: { bpm: 152, wave: 'square', bassWave: 'sawtooth', vol: 0.04, drums: 'o.x.oox.o.x.o.xx',
      lead: [79, H, H, 0, 79, H, 82, H, 81, H, 79, H, 77, H, 74, H, 79, H, H, 0, 79, H, 82, H, 84, H, 82, H, 81, H, H, H,
        86, H, H, 0, 84, H, 82, H, 81, H, 82, H, 84, H, H, H, 82, H, 81, H, 79, H, 77, H, 79, H, H, H, H, H, 0, 0],
      bass: [43, 43, 0, 43, 43, 0, 46, 0, 41, 41, 0, 41, 41, 0, 38, 0, 43, 43, 0, 43, 43, 0, 46, 0, 48, 48, 0, 48, 46, 0, 45, 0] },
    results: { bpm: 112, wave: 'square', bassWave: 'triangle', vol: 0.045, drums: 'o...x...o...x...',
      lead: [72, H, 76, H, 79, H, H, H, 77, H, 76, H, 74, H, H, H, 72, H, 76, H, 79, H, 84, H, 83, H, H, H, H, H, 0, 0,
        81, H, 79, H, 77, H, H, H, 76, H, 74, H, 72, H, H, H, 74, H, 76, H, 77, H, 79, H, 72, H, H, H, H, H, 0, 0],
      bass: [36, 0, 43, 0, 36, 0, 43, 0, 41, 0, 48, 0, 43, 0, 50, 0, 36, 0, 43, 0, 40, 0, 47, 0, 41, 0, 43, 0, 36, 0, 0, 0] },
  };

  // ================================================================ the cartridge's own high-score table (Jack's mates had goes)
  const MATES = [
    { n: 'DAVE', s: 42500, r: 'FOX' }, { n: 'LUKE', s: 34200, r: 'HOUND' }, { n: 'JK', s: 28900, r: 'HAMSTER' },
    { n: 'JACK', s: 22350, r: 'HAMSTER' }, { n: 'CAL', s: 15000, r: 'SCAREDY MOUSE' }, { n: 'MOM', s: 13100, r: 'SLEEPY GERBIL' }];
  // the other saves on Jack's memory card (just for show)
  const CARD_FILES = ['WARP WOMBAT  SAVE 1', 'TEKNO FIST  OPTIONS', 'DAVE SUX (DO NOT DELETE)', 'ANTI-GRAV 3000  GHOSTS', 'TEST', 'ASDF'];
  const RANKS = { 'FOX': 'A LEGEND OF STEALTH. NOBODY SAW A THING.', 'HOUND': 'SHARP AND SNEAKY. NEARLY PERFECT.', 'SLEEPY GERBIL': 'THE WHOLE BASE IS HAVING A LOVELY NAP.', 'HAMSTER': 'GOT THE JOB DONE. A BIT NOISILY.', 'SCAREDY MOUSE': 'EVERYONE SAW YOU. EVERYONE.' };

  // tile codes
  const FL = 0, WA = 1, CR = 2, LO = 3, BIG = 4, CS = 5, WT = 6, PO = 7, PI = 8, DR = 9, EX = 10;
  const CODE = { '#': WA, C: CR, B: CR, l: LO, H: BIG, '=': CS, '~': WT, L: PO, T: PI, E: EX, '0': DR, '1': DR, '2': DR, '3': DR };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, k) => a + (b - a) * k;
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  const mt = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0'); };

  TV.game('ps.sneak', {
    three: true, v: 1,
    buttons: ['a', 'b', 'x', 'y'],
    help: 'Move: arrows. Crawl: Z. Knock / use: X. Snooze dart: C. Box: V. Pause: Enter.',
    make(K) {
      const T3 = K.three({ fov: 44, near: 0.3, far: 70, fogCol: 0x070d1c, fogNear: 13, fogFar: 30 }), T = T3.T, hud = K.hud, F = K.font, W = K.W, HH = K.H;
      const LT = T3.lights({ amb: 0.85, sun: 0.75, dir: [0.4, 1, 0.55], skyCol: 0xd8e4ff, groundCol: 0x404858 });
      const rnd = K.rnd(1999), R = () => rnd();
      const own = []; // things we made ourselves (disposed at the end)
      const lab = s => String(s).replace(/\{([ABXY])\}/g, (m, b) => K.label(b.toLowerCase()));

      // ---- PlayStation materials: the kit's wobbly vertices and wonky textures, plus 15-bit colour with ordered dithering
      const DH = 'float rmBay2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }\nfloat rmBay4(vec2 a){ return rmBay2(0.5 * a) * 0.25 + rmBay2(a); }\n';
      const DB = '#include <dithering_fragment>\n  gl_FragColor.rgb = floor(gl_FragColor.rgb * 31.0 + rmBay4(gl_FragCoord.xy) * 0.94) / 31.0;';
      function M(p) {
        const m = T3.mat(p), base = m.onBeforeCompile;
        if (!p.noDither) {
          m.onBeforeCompile = sh => { if (base) base(sh); sh.fragmentShader = DH + sh.fragmentShader.replace('#include <dithering_fragment>', DB); };
          m.customProgramCacheKey = () => 'rmsneak';
        }
        if (p.add) { m.blending = T.AdditiveBlending; m.depthWrite = false; }
        return m;
      }

      // ---- textures (small and chunky, the PlayStation way)
      const px = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); };
      const speck = (g, w, h, n, cols, sw, sh) => { for (let i = 0; i < n; i++) px(g, cols[i % cols.length], R() * w | 0, R() * h | 0, sw || 1, sh || 1); };
      const TX = {
        snow: T3.tex(64, 64, (g) => { px(g, '#c9d5ea', 0, 0, 64, 64); speck(g, 64, 64, 380, ['#b9c7df', '#d6e0f2', '#bfcde6', '#e2eaf8']); speck(g, 64, 64, 24, ['#ffffff']); for (let i = 0; i < 9; i++) { const x = R() * 60 | 0, y = R() * 60 | 0; px(g, '#adbcd8', x, y, 4, 2); px(g, '#dfe8f6', x + 1, y - 1, 3, 1); } }),
        planks: T3.tex(64, 64, (g) => { px(g, '#6e5238', 0, 0, 64, 64); for (let y = 0; y < 64; y += 8) { px(g, '#3e2c1e', 0, y, 64, 1); px(g, '#86684a', 0, y + 1, 64, 1); const o = (y * 13) % 40; px(g, '#3e2c1e', o, y, 1, 8); px(g, '#3e2c1e', (o + 29) % 64, y, 1, 8); } speck(g, 64, 64, 140, ['#5e442e', '#7a5c40'], 3, 1); for (let i = 0; i < 14; i++) { const x = R() * 56 | 0, y = R() * 60 | 0; px(g, '#b8c4d6', x, y, 6 + (R() * 6 | 0), 2); px(g, '#d6e0ee', x + 1, y, 3, 1); } }),
        tarmac: T3.tex(64, 64, (g) => { px(g, '#3c4250', 0, 0, 64, 64); speck(g, 64, 64, 500, ['#343a46', '#464c5a', '#30353f', '#4c5262']); for (let i = 0; i < 8; i++) { const x = R() * 58 | 0, y = R() * 60 | 0; px(g, '#aab6ca', x, y, 5, 2); } }),
        metal: T3.tex(64, 64, (g) => { for (let x = 0; x < 64; x++) { const k = x % 8; px(g, ['#4f5d6c', '#5d6c7c', '#6b7a8b', '#76869a', '#6b7a8b', '#5d6c7c', '#4f5d6c', '#43505d'][k], x, 0, 1, 64); } px(g, '#2e3742', 0, 0, 64, 3); px(g, '#8696aa', 0, 3, 64, 1); px(g, '#2e3742', 0, 61, 64, 3); for (let i = 0; i < 10; i++) { const x = R() * 62 | 0; px(g, 'rgba(122,82,48,.55)', x, 40 + (R() * 10 | 0), 2, 24); } for (let x = 4; x < 64; x += 16) { px(g, '#9aaabb', x, 6, 1, 1); px(g, '#9aaabb', x, 57, 1, 1); } }),
        concrete: T3.tex(64, 64, (g) => { px(g, '#6c7072', 0, 0, 64, 64); speck(g, 64, 64, 420, ['#64686a', '#74787a', '#5e6264', '#7a7e80']); px(g, '#505456', 0, 0, 64, 1); px(g, '#505456', 0, 0, 1, 64); px(g, '#505456', 0, 32, 64, 1); px(g, '#505456', 32, 0, 1, 64); px(g, '#80848a', 1, 1, 63, 1); for (let i = 0; i < 4; i++) { const x = R() * 50 | 0, y = R() * 50 | 0; g.fillStyle = 'rgba(40,40,30,.18)'; g.beginPath(); g.ellipse(x + 6, y + 6, 6, 4, R() * 3, 0, 7); g.fill(); } }),
        grate: T3.tex(32, 32, (g) => { px(g, '#3a4048', 0, 0, 32, 32); for (let y = 0; y < 32; y += 4) for (let x = 0; x < 32; x += 4) { px(g, '#16191d', x + 1, y + 1, 2, 2); px(g, '#565e68', x, y, 4, 1); } px(g, '#24282e', 0, 0, 32, 1); px(g, '#24282e', 0, 0, 1, 32); }),
        panel: T3.tex(64, 64, (g) => { px(g, '#7c807a', 0, 0, 64, 64); speck(g, 64, 64, 200, ['#747872', '#848882']); px(g, '#4c504c', 0, 34, 64, 30); speck(g, 64, 30, 0, []); for (let i = 0; i < 120; i++) px(g, ['#444844', '#545854'][i % 2], R() * 64 | 0, 34 + (R() * 30 | 0)); for (let x = 0; x < 64; x += 8) { px(g, '#e0b020', x, 30, 4, 4); px(g, '#202020', x + 4, 30, 4, 4); } px(g, '#5a5e58', 31, 0, 1, 30); px(g, '#9a9e98', 32, 0, 1, 30); px(g, '#2e302e', 0, 62, 64, 2); px(g, '#a0a49e', 0, 0, 64, 1); }),
        duct: T3.tex(32, 32, (g) => { px(g, '#7e8690', 0, 0, 32, 32); for (let y = 0; y < 32; y++) px(g, `rgba(255,255,255,${0.05 + 0.08 * Math.sin(y / 32 * 6.28)})`, 0, y, 32, 1); px(g, '#4c525a', 0, 0, 32, 1); px(g, '#4c525a', 15, 0, 1, 32); px(g, '#a8b0ba', 16, 0, 1, 32); for (let y = 3; y < 32; y += 8) { px(g, '#3a4048', 13, y); px(g, '#3a4048', 18, y); } }),
        ductgrate: T3.tex(32, 32, (g) => { px(g, '#2a2c30', 0, 0, 32, 32); for (let y = 2; y < 30; y += 4) { px(g, '#ffe8a0', 3, y, 26, 2); px(g, '#fff6d0', 3, y, 26, 1); } px(g, '#5a6068', 0, 0, 32, 2); px(g, '#5a6068', 0, 30, 32, 2); px(g, '#5a6068', 0, 0, 2, 32); px(g, '#5a6068', 30, 0, 2, 32); }),
        labtile: T3.tex(32, 32, (g) => { px(g, '#9fb0b8', 0, 0, 32, 32); for (let y = 0; y < 32; y += 16) for (let x = 0; x < 32; x += 16) { px(g, '#dde6ea', x + 1, y + 1, 14, 14); px(g, '#eef4f6', x + 1, y + 1, 14, 1); px(g, '#c4d0d6', x + 1, y + 14, 14, 1); } speck(g, 32, 32, 30, ['#d0dade']); }),
        labtile2: T3.tex(32, 32, (g) => { px(g, '#3a7a80', 0, 0, 32, 32); for (let y = 0; y < 32; y += 16) for (let x = 0; x < 32; x += 16) { px(g, '#5aaab0', x + 1, y + 1, 14, 14); px(g, '#7ac4c8', x + 1, y + 1, 14, 1); } }),
        lab: T3.tex(64, 64, (g) => { px(g, '#c8d2d6', 0, 0, 64, 64); speck(g, 64, 64, 120, ['#bec8cc', '#d2dce0']); px(g, '#2a8a92', 0, 36, 64, 6); px(g, '#4ab0b8', 0, 36, 64, 1); px(g, '#8a969c', 0, 56, 64, 8); px(g, '#a0acb2', 31, 0, 1, 36); px(g, '#e8f0f2', 32, 0, 1, 36); px(g, '#eef6f8', 0, 0, 64, 1); }),
        hangar: T3.tex(64, 64, (g) => { px(g, '#383c46', 0, 0, 64, 64); for (let y = 0; y < 64; y += 8) for (let x = (y / 8 % 2) * 4; x < 64; x += 8) { px(g, '#4a4e5a', x, y, 3, 1); px(g, '#2a2d34', x + 1, y + 1, 3, 1); } px(g, '#24262c', 0, 0, 64, 1); px(g, '#24262c', 0, 0, 1, 64); px(g, '#50545e', 1, 1, 63, 1); }),
        hangar2: T3.tex(32, 32, (g) => { px(g, '#202024', 0, 0, 32, 32); for (let i = -32; i < 32; i += 8) { g.fillStyle = '#d8a818'; g.beginPath(); g.moveTo(i, 32); g.lineTo(i + 4, 32); g.lineTo(i + 36, 0); g.lineTo(i + 32, 0); g.fill(); } speck(g, 32, 32, 40, ['#2a2a2e', '#b08a18']); }),
        hangarw: T3.tex(64, 64, (g) => { px(g, '#3e424c', 0, 0, 64, 64); for (let x = 0; x < 64; x += 16) { px(g, '#2c2f36', x, 0, 3, 64); px(g, '#565a66', x + 3, 0, 1, 64); } for (let x = 0; x < 64; x += 8) { px(g, '#c03020', x, 40, 4, 5); px(g, '#202020', x + 4, 40, 4, 5); } px(g, '#24262c', 0, 60, 64, 4); }),
        crate: T3.tex(32, 32, (g) => { px(g, '#8f6a3a', 0, 0, 32, 32); for (let y = 0; y < 32; y += 6) { px(g, '#6e4e28', 0, y, 32, 1); px(g, '#a47c48', 0, y + 1, 32, 1); } px(g, '#5a3c1c', 0, 0, 32, 3); px(g, '#5a3c1c', 0, 29, 32, 3); px(g, '#5a3c1c', 0, 0, 3, 32); px(g, '#5a3c1c', 29, 0, 3, 32); px(g, '#b8925a', 1, 1, 30, 1); g.strokeStyle = '#5a3c1c'; g.lineWidth = 3; g.beginPath(); g.moveTo(3, 3); g.lineTo(29, 29); g.stroke(); px(g, '#c8c8c8', 2, 2); px(g, '#c8c8c8', 29, 2); px(g, '#c8c8c8', 2, 29); px(g, '#c8c8c8', 29, 29); }),
        mil: T3.tex(32, 32, (g) => { px(g, '#4f5c3c', 0, 0, 32, 32); speck(g, 32, 32, 80, ['#475436', '#57663f']); px(g, '#36402a', 0, 0, 32, 2); px(g, '#36402a', 0, 30, 32, 2); px(g, '#36402a', 0, 15, 32, 2); px(g, '#6a7a52', 0, 2, 32, 1); px(g, '#6a7a52', 0, 17, 32, 1); px(g, '#d8d0a0', 6, 6, 3, 5); px(g, '#d8d0a0', 10, 6, 3, 5); px(g, '#d8d0a0', 15, 6, 2, 5); px(g, '#d8d0a0', 18, 6, 6, 2); px(g, '#d8d0a0', 6, 21, 18, 2); px(g, '#2a2e22', 26, 4, 3, 8); }),
        sand: T3.tex(32, 32, (g) => { px(g, '#7e7454', 0, 0, 32, 32); for (let y = 0; y < 32; y += 8) for (let x = (y / 8 % 2) * 8; x < 40; x += 16) { g.fillStyle = '#9a8e68'; g.beginPath(); g.ellipse(x, y + 4, 7.5, 3.5, 0, 0, 7); g.fill(); px(g, '#b2a67e', x - 4, y + 2, 7, 1); px(g, '#5e5640', x - 6, y + 7, 12, 1); } }),
        desk: T3.tex(32, 32, (g) => { px(g, '#6a5a48', 0, 0, 32, 32); px(g, '#8a7660', 0, 0, 32, 2); px(g, '#4a3e30', 0, 30, 32, 2); px(g, '#e8e8e0', 4, 6, 9, 11); px(g, '#c8c8c0', 5, 8, 7, 1); px(g, '#c8c8c0', 5, 10, 7, 1); px(g, '#c8c8c0', 5, 12, 5, 1); px(g, '#303438', 18, 5, 10, 8); px(g, '#4ad06a', 19, 6, 8, 6); px(g, '#d03a2a', 20, 20, 5, 6); px(g, '#f0f0f0', 21, 21, 3, 1); }),
        bench: T3.tex(32, 32, (g) => { px(g, '#dfe6ea', 0, 0, 32, 32); px(g, '#a8b4ba', 0, 30, 32, 2); px(g, '#2a8a92', 0, 0, 32, 2); px(g, '#203038', 3, 6, 11, 9); px(g, '#38e0a0', 4, 7, 9, 7); px(g, '#7af0c0', 4, 7, 9, 1); px(g, '#b0c0c8', 18, 8, 4, 10); px(g, '#80d8ff', 18, 4, 4, 5); px(g, '#e0a040', 24, 9, 5, 9); px(g, '#ffd080', 24, 6, 5, 4); }),
        box: T3.tex(64, 64, (g) => { px(g, '#b48a52', 0, 0, 64, 64); speck(g, 64, 64, 300, ['#a87e48', '#bc945c', '#aa8248']); px(g, '#7a5a30', 0, 0, 64, 2); px(g, '#7a5a30', 0, 62, 64, 2); px(g, '#7a5a30', 0, 0, 2, 64); px(g, '#7a5a30', 62, 0, 2, 64); px(g, '#d8c492', 26, 0, 12, 64); px(g, '#c4ae7c', 26, 0, 1, 64); px(g, '#c4ae7c', 37, 0, 1, 64); g.fillStyle = '#5a3a1a'; g.beginPath(); g.moveTo(11, 10); g.lineTo(18, 18); g.lineTo(14, 18); g.lineTo(14, 26); g.lineTo(8, 26); g.lineTo(8, 18); g.lineTo(4, 18); g.closePath(); g.fill(); g.font = 'bold 9px Arial'; g.fillText('SEEDS', 42, 44); g.fillText('FRAGILE', 2, 56); g.strokeStyle = '#5a3a1a'; g.lineWidth = 1; g.strokeRect(40.5, 34.5, 21, 13); }),
        door: T3.tex(32, 64, (g) => { px(g, '#7c868e', 0, 0, 32, 64); for (let y = 0; y < 64; y += 2) px(g, 'rgba(255,255,255,.04)', 0, y, 32, 1); px(g, '#4a5258', 0, 0, 1, 64); px(g, '#a8b2ba', 1, 0, 1, 64); px(g, '#4a5258', 0, 20, 32, 1); px(g, '#4a5258', 0, 44, 32, 1); px(g, '#a8b2ba', 0, 21, 32, 1); for (let i = 0; i < 4; i++) { px(g, '#e0b020', 4 + i * 6, 56, 3, 6); px(g, '#222', 7 + i * 6, 56, 3, 6); } }),
        heli: T3.tex(32, 32, (g) => { px(g, '#4c5a3a', 0, 0, 32, 32); speck(g, 32, 32, 90, ['#455334', '#566444']); px(g, '#2e3624', 0, 15, 32, 1); px(g, '#2e3624', 15, 0, 1, 32); px(g, '#6a7a54', 0, 16, 32, 1); for (let x = 2; x < 32; x += 6) px(g, '#8a9a70', x, 2); }),
        canvas: T3.tex(32, 32, (g) => { px(g, '#56603e', 0, 0, 32, 32); for (let y = 0; y < 32; y += 8) { px(g, '#3e462c', 0, y, 32, 1); px(g, '#6a7650', 0, y + 1, 32, 1); } speck(g, 32, 32, 60, ['#4e5838', '#606a46']); for (let i = 0; i < 6; i++) px(g, '#c8d2e2', R() * 28 | 0, R() * 3 | 0, 5, 2); }),
        water: T3.tex(32, 32, (g) => { px(g, '#0c1c34', 0, 0, 32, 32); for (let i = 0; i < 18; i++) { const x = R() * 28 | 0, y = R() * 32 | 0; px(g, '#1c3c62', x, y, 5, 1); px(g, '#2c5482', x + 1, y, 2, 1); } speck(g, 32, 32, 6, ['#8ab8e8']); }),
        pad: T3.tex(64, 64, (g) => { g.clearRect(0, 0, 64, 64); g.strokeStyle = '#e8d24a'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 28, 0, 7); g.stroke(); g.fillStyle = '#e8e8e8'; g.fillRect(20, 16, 6, 32); g.fillRect(38, 16, 6, 32); g.fillRect(26, 29, 12, 6); }),
        shadow: T3.tex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 2, 16, 16, 15); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(0.7, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }),
        glow: T3.tex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 1, 16, 16, 15); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }),
        print: T3.tex(16, 16, (g) => { g.clearRect(0, 0, 16, 16); g.fillStyle = 'rgba(70,90,130,.55)'; g.beginPath(); g.ellipse(8, 8, 3, 4.5, 0, 0, 7); g.fill(); g.fillRect(4, 2, 2, 2); g.fillRect(10, 2, 2, 2); }),
        arrow: T3.tex(32, 32, (g) => { g.clearRect(0, 0, 32, 32); g.fillStyle = 'rgba(120,255,160,.9)'; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(16, 3 + k * 12); g.lineTo(28, 13 + k * 12); g.lineTo(24, 16 + k * 12); g.lineTo(16, 9 + k * 12); g.lineTo(8, 16 + k * 12); g.lineTo(4, 13 + k * 12); g.closePath(); g.fill(); } }),
        steam: T3.tex(16, 16, (g) => { const gr = g.createRadialGradient(8, 8, 1, 8, 8, 7.5); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 16, 16); }),
        tank: T3.tex(32, 32, (g) => { const gr = g.createLinearGradient(0, 0, 32, 0); gr.addColorStop(0, '#1a6a4a'); gr.addColorStop(0.3, '#5af0b0'); gr.addColorStop(0.5, '#2ab080'); gr.addColorStop(1, '#0a3a2a'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); for (let i = 0; i < 12; i++) px(g, 'rgba(220,255,240,.7)', R() * 30 | 0, R() * 32 | 0, 2, 2); }),
        pillar: T3.tex(32, 64, (g) => { px(g, '#5a5e66', 0, 0, 32, 64); speck(g, 32, 64, 120, ['#52565e', '#62666e']); for (let i = -32; i < 32; i += 8) { g.fillStyle = '#d8a818'; g.beginPath(); g.moveTo(i, 14); g.lineTo(i + 4, 14); g.lineTo(i + 14, 4); g.lineTo(i + 10, 4); g.fill(); } px(g, '#202024', 0, 4, 32, 1); px(g, '#202024', 0, 14, 32, 1); px(g, '#3a3e46', 0, 60, 32, 4); }),
      };
      const tile2 = t => { t.repeat.set(1, 1); return t; };

      // vertex-coloured, pre-lit world materials (the PlayStation look: lighting baked into the corners)
      const WM = {};
      for (const k of ['snow', 'planks', 'tarmac', 'metal', 'concrete', 'grate', 'panel', 'duct', 'ductgrate', 'labtile', 'labtile2', 'lab', 'hangar', 'hangar2', 'hangarw', 'crate', 'mil', 'sand', 'desk', 'bench', 'heli', 'canvas', 'door', 'pillar']) WM[k] = M({ map: tile2(TX[k]), vcol: true, lit: false });
      WM.top = M({ vcol: true, lit: false });
      const MT = { // lit materials for things that move
        suit: M({ color: 0x3a4c62 }), suit2: M({ color: 0x627a94 }), belt: M({ color: 0x24262a }), fur: M({ color: 0xc8965a }), fur2: M({ color: 0xf2dcb4 }),
        pink: M({ color: 0xec9ca4 }), eye: M({ color: 0x0c0c10, lit: false }), shine: M({ color: 0xffffff, lit: false }), band: M({ color: 0xd8262a }), boot: M({ color: 0x1e2026 }),
        coat: M({ color: 0xdfe3ea }), coat2: M({ color: 0x9ea6b2 }), coatIn: M({ color: 0x5c6a4a }), coatIn2: M({ color: 0x3e4a32 }), trou: M({ color: 0x3a3e4a }),
        wfur: M({ color: 0x8e5c34 }), wfur2: M({ color: 0xf0e2c8 }), hat: M({ color: 0x7e2638 }), bob: M({ color: 0xf4f4f4 }), lens: M({ color: 0x6ad0ff, lit: false }), gog: M({ color: 0x1c2430 }),
        box: M({ map: TX.box }), dart: M({ color: 0xffd020, lit: false }), snowb: M({ color: 0xf4f8ff, emissive: 0x303848 }), pellet: M({ color: 0xffa040, lit: false }),
        steel: M({ color: 0x5a606c }), steel2: M({ color: 0x3a3e48 }), red: M({ color: 0xc8442a }), red2: M({ color: 0x8a2a1a }), rexEye: M({ color: 0xff5030, lit: false }), yel: M({ color: 0xe8b820 }),
        lampHead: M({ color: 0xfff0c0, lit: false }), post: M({ color: 0x3a3e46 }), cam: M({ color: 0xc8ccd2 }), camLed: M({ color: 0xff2a1a, lit: false }), camLedG: M({ color: 0x30ff60, lit: false }),
        card1: M({ color: 0x3a8af0, emissive: 0x102040 }), card2: M({ color: 0xf0c02a, emissive: 0x403010 }), card3: M({ color: 0xe0402a, emissive: 0x401008 }), cardW: M({ color: 0xffffff, lit: false }),
        ration: M({ color: 0x3a6a3a }), rationL: M({ color: 0xe8e0c0 }), ammo: M({ color: 0x8a6a2a }), seed: M({ color: 0xffd040, emissive: 0x806010 }), seed2: M({ color: 0x3a2a10 }),
        tankG: M({ map: TX.tank, transparent: true, opacity: 0.8, lit: false }), plans: M({ color: 0x3a6ad8, emissive: 0x101e40 }), white: M({ color: 0xffffff, lit: false }),
        otter: M({ color: 0x7a5032 }), otter2: M({ color: 0xd8b890 }), labcoat: M({ color: 0xeef2f4 }), glass: M({ color: 0xc8f0ff, lit: false }),
        heliD: M({ color: 0x46523a }), heliG: M({ color: 0x3a5a74, emissive: 0x0c1824 }), rotor: M({ color: 0x24262a }), tyre: M({ color: 0x1a1a1c }), cab: M({ color: 0x5a6a46 }),
        pipe: M({ color: 0x6a7480 }), pipe2: M({ color: 0x8a5a3a }), boat: M({ color: 0x2a3a4a }), boat2: M({ color: 0xd8dce4 }),
        breaker: M({ color: 0x6a6e78 }), lever: M({ color: 0xd02a1a }), ledG: M({ color: 0x40ff70, lit: false }), ledR: M({ color: 0xff3020, lit: false }),
      };
      const FX = { // see-through glows
        shadow: M({ map: TX.shadow, transparent: true, lit: false, noDither: true }), beam: M({ color: 0xfff0b0, transparent: true, opacity: 0.16, lit: false, add: true, noDither: true, side: T.DoubleSide }),
        spot: M({ map: TX.glow, color: 0xfff0b0, transparent: true, opacity: 0.55, lit: false, add: true, noDither: true }), rexBeam: M({ color: 0xff4020, transparent: true, opacity: 0.2, lit: false, add: true, noDither: true, side: T.DoubleSide }),
        rexSpot: M({ map: TX.glow, color: 0xff5030, transparent: true, opacity: 0.6, lit: false, add: true, noDither: true }), laser: M({ color: 0xff2020, transparent: true, opacity: 0.9, lit: false, add: true, noDither: true }),
        laserGlow: M({ map: TX.glow, color: 0xff3030, transparent: true, opacity: 0.6, lit: false, add: true, noDither: true }), lamp: M({ map: TX.glow, color: 0xffd890, transparent: true, opacity: 0.5, lit: false, add: true, noDither: true }),
        print: M({ map: TX.print, transparent: true, lit: false, noDither: true }), arrow: M({ map: TX.arrow, transparent: true, opacity: 0.75, lit: false, add: true, noDither: true }),
        steam: M({ map: TX.steam, transparent: true, opacity: 0.7, lit: false, noDither: true }), pad: M({ map: TX.pad, transparent: true, opacity: 0.85, lit: false, noDither: true }),
        water: M({ map: T3.tile(TX.water, 8, 8), color: 0xffffff, lit: false }), camCone: M({ color: 0xff3020, transparent: true, opacity: 0.12, lit: false, add: true, noDither: true, side: T.DoubleSide }),
        vis: M({ color: 0x60ffa0, transparent: true, opacity: 0.07, lit: false, add: true, noDither: true, side: T.DoubleSide }),
      };
      FX.shadow.depthWrite = false; FX.print.depthWrite = false; FX.pad.depthWrite = false; FX.steam.depthWrite = false;
      const GEO = {
        box: T3.keep(new T.BoxGeometry(1, 1, 1)), ball: T3.keep(new T.SphereGeometry(0.5, 8, 6)), ball6: T3.keep(new T.SphereGeometry(0.5, 6, 4)),
        cyl: T3.keep(new T.CylinderGeometry(0.5, 0.5, 1, 8)), cyl6: T3.keep(new T.CylinderGeometry(0.5, 0.5, 1, 6)), cone: T3.keep(new T.ConeGeometry(0.5, 1, 6)),
        plane: T3.keep(new T.PlaneGeometry(1, 1)), beam: T3.keep(new T.CylinderGeometry(0.06, 1, 1, 12, 1, true)), torus: T3.keep(new T.TorusGeometry(1.3, 0.13, 6, 22)),
        torus2: T3.keep(new T.TorusGeometry(1.05, 0.05, 4, 22)), disc: T3.keep(new T.CircleGeometry(0.5, 12)),
      };
      GEO.beam.translate(0, -0.5, 0); GEO.beam.rotateX(-Math.PI / 2); // (a cone from the origin along +z, length 1)
      const mesh = (geo, mat, x, y, z, sx, sy, sz, parent) => { const o = new T.Mesh(geo, mat); o.position.set(x || 0, y || 0, z || 0); o.scale.set(sx || 1, sy == null ? (sx || 1) : sy, sz == null ? (sx || 1) : sz); if (parent) parent.add(o); return o; };
      const grp = (parent, x, y, z) => { const g = new T.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; };
      const flatQuad = (mat, s, parent) => { const o = mesh(GEO.plane, mat, 0, 0.02, 0, s, s, 1, parent); o.rotation.x = -Math.PI / 2; return o; };

      // ================================================================ SOLID GERBIL (front is +z)
      function makeGerbil() {
        const root = grp(T3.scene), b = grp(root);
        const torso = mesh(GEO.ball, MT.suit, 0, 0.36, 0, 0.36, 0.4, 0.3, b);
        mesh(GEO.box, MT.suit2, 0, 0.42, 0.13, 0.24, 0.16, 0.06, b);
        mesh(GEO.cyl, MT.belt, 0, 0.25, 0, 0.36, 0.05, 0.3, b);
        mesh(GEO.box, MT.belt, 0.1, 0.25, 0.13, 0.07, 0.07, 0.04, b);
        mesh(GEO.box, MT.suit2, 0, 0.42, -0.16, 0.22, 0.22, 0.1, b);
        mesh(GEO.box, MT.belt, 0, 0.5, -0.2, 0.16, 0.04, 0.04, b);
        const hd = grp(b, 0, 0.66, 0.03);
        mesh(GEO.ball, MT.fur, 0, 0, 0, 0.42, 0.38, 0.42, hd);
        mesh(GEO.ball, MT.fur2, 0, -0.06, 0.15, 0.24, 0.18, 0.22, hd);
        mesh(GEO.ball6, MT.pink, 0, -0.03, 0.26, 0.07, 0.06, 0.06, hd);
        for (const s of [-1, 1]) {
          mesh(GEO.ball6, MT.eye, s * 0.085, 0.035, 0.16, 0.08, 0.09, 0.06, hd);
          mesh(GEO.ball6, MT.shine, s * 0.075, 0.055, 0.19, 0.025, 0.025, 0.02, hd);
          const ear = grp(hd, s * 0.14, 0.15, -0.03); ear.rotation.z = -s * 0.45;
          mesh(GEO.ball, MT.fur, 0, 0, 0, 0.2, 0.24, 0.06, ear); mesh(GEO.ball6, MT.pink, 0, 0, 0.02, 0.12, 0.15, 0.04, ear);
          for (let w = 0; w < 2; w++) { const wh = mesh(GEO.box, MT.shine, s * 0.13, -0.05 + w * 0.03, 0.2, 0.12, 0.008, 0.008, hd); wh.rotation.z = s * (0.15 - w * 0.25); wh.material = MT.fur2; }
        }
        mesh(GEO.cyl, MT.band, 0, 0.07, -0.01, 0.43, 0.065, 0.43, hd);
        const tails = [];
        for (const s of [-1, 1]) { const t = grp(hd, s * 0.03, 0.07, -0.2); mesh(GEO.box, MT.band, 0, 0, -0.12, 0.05, 0.02, 0.24, t); t.rotation.y = s * 0.25; tails.push(t); }
        const arms = [], legs = [];
        for (const s of [-1, 1]) {
          const a = grp(b, s * 0.19, 0.47, 0); mesh(GEO.box, MT.suit, 0, -0.1, 0, 0.09, 0.22, 0.1, a); mesh(GEO.ball6, MT.fur, 0, -0.23, 0.01, 0.08, 0.08, 0.08, a); arms.push(a);
          const l = grp(b, s * 0.1, 0.22, 0); mesh(GEO.box, MT.suit, 0, -0.08, 0, 0.11, 0.18, 0.12, l); mesh(GEO.box, MT.boot, 0, -0.19, 0.04, 0.12, 0.07, 0.2, l); legs.push(l);
        }
        const tail = []; let tp = b;
        for (let i = 0; i < 3; i++) { const t = grp(tp, 0, i ? 0 : 0.26, i ? -0.16 : -0.16); mesh(GEO.box, MT.fur, 0, 0, -0.08, 0.045, 0.045, 0.18, t); if (i === 2) mesh(GEO.ball6, MT.fur, 0, 0, -0.18, 0.09, 0.09, 0.12, t); t.rotation.x = i ? -0.25 : 0.5; tail.push(t); tp = t; }
        const box = grp(root); mesh(GEO.box, MT.box, 0, 0.29, 0, 0.66, 0.58, 0.66, box); box.visible = false;
        const sh = flatQuad(FX.shadow, 0.9, T3.scene); root.scale.setScalar(1.25);
        return { root, b, hd, tails, arms, legs, tail, box, sh, torso };
      }
      // ================================================================ a FERRETHOUND guard (a weasel in winter kit)
      function makeGuard(inside) {
        const root = grp(T3.scene), b = grp(root), coat = inside ? MT.coatIn : MT.coat, coat2 = inside ? MT.coatIn2 : MT.coat2;
        mesh(GEO.ball, coat, 0, 0.6, 0, 0.42, 0.5, 0.34, b);
        mesh(GEO.box, coat2, 0, 0.62, 0.15, 0.08, 0.38, 0.04, b);
        mesh(GEO.cyl, MT.belt, 0, 0.42, 0, 0.4, 0.06, 0.32, b);
        mesh(GEO.box, MT.belt, -0.14, 0.42, 0.14, 0.08, 0.1, 0.05, b);
        mesh(GEO.cyl6, MT.hat, 0, 0.84, 0, 0.3, 0.07, 0.28, b);
        const hd = grp(b, 0, 0.98, 0.02);
        mesh(GEO.ball, MT.wfur, 0, 0, 0, 0.32, 0.28, 0.32, hd);
        mesh(GEO.ball, MT.wfur, 0, -0.04, 0.15, 0.17, 0.14, 0.26, hd);
        mesh(GEO.ball6, MT.wfur2, 0, -0.08, 0.12, 0.2, 0.1, 0.2, hd);
        mesh(GEO.ball6, MT.eye, 0, -0.02, 0.28, 0.06, 0.05, 0.05, hd);
        for (const s of [-1, 1]) { mesh(GEO.ball6, MT.eye, s * 0.075, 0.03, 0.13, 0.05, 0.05, 0.04, hd); mesh(GEO.ball6, MT.wfur, s * 0.13, 0.1, -0.02, 0.09, 0.1, 0.05, hd); }
        mesh(GEO.ball, MT.hat, 0, 0.07, -0.01, 0.34, 0.24, 0.34, hd);
        mesh(GEO.ball6, MT.bob, 0, 0.2, -0.02, 0.11, 0.11, 0.11, hd);
        mesh(GEO.box, MT.gog, 0, 0.1, 0.13, 0.26, 0.06, 0.06, hd);
        for (const s of [-1, 1]) mesh(GEO.box, MT.lens, s * 0.06, 0.1, 0.165, 0.08, 0.045, 0.01, hd);
        const arms = [], legs = [];
        for (const s of [-1, 1]) {
          const a = grp(b, s * 0.23, 0.76, 0); mesh(GEO.box, coat, 0, -0.14, 0, 0.11, 0.3, 0.12, a); mesh(GEO.ball6, MT.boot, 0, -0.31, 0.01, 0.1, 0.1, 0.1, a); arms.push(a);
          const l = grp(b, s * 0.1, 0.36, 0); mesh(GEO.box, MT.trou, 0, -0.14, 0, 0.13, 0.28, 0.14, l); mesh(GEO.box, MT.boot, 0, -0.31, 0.04, 0.14, 0.09, 0.22, l); legs.push(l);
        }
        const tail = grp(b, 0, 0.4, -0.14); mesh(GEO.ball, MT.wfur, 0, -0.05, -0.2, 0.12, 0.12, 0.42, tail); tail.rotation.x = 0.6;
        const ball = mesh(GEO.ball6, MT.snowb, 0, -0.33, 0.05, 0.13, 0.13, 0.13, arms[1]); ball.visible = false;
        const sh = flatQuad(FX.shadow, 1.1, T3.scene);
        const vis = mesh(GUARD_FAN, FX.vis, 0, 0.03, 0, 1, 1, 1, root); vis.visible = false; b.scale.setScalar(1.2);
        return { root, b, hd, arms, legs, tail, ball, sh, vis };
      }
      // a flat fan (a vision cone on the floor), radius 1, half-angle h, pointing along +z
      function coneFan(r, h, n) {
        const p = [0, 0, 0]; for (let i = 0; i <= n; i++) { const a = -h + 2 * h * i / n; p.push(Math.sin(a) * r, 0, Math.cos(a) * r); }
        const idx = []; for (let i = 1; i <= n; i++) idx.push(0, i, i + 1);
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(p), 3)); g.setIndex(idx); return g;
      }
      // ================================================================ WHEEL REX (a giant walking hamster wheel)
      function makeRex() {
        const root = grp(T3.scene), body = grp(root), legs = [];
        for (const s of [-1, 1]) {
          const hip = grp(body, s * 1.0, 1.9, 0);
          const th = grp(hip); mesh(GEO.box, MT.steel, 0, -0.45, 0.15, 0.36, 1.0, 0.42, th); th.rotation.x = -0.35;
          const kn = grp(th, 0, -0.95, 0.3); mesh(GEO.box, MT.steel2, 0, -0.45, -0.1, 0.3, 1.0, 0.34, kn); kn.rotation.x = 0.7; mesh(GEO.ball6, MT.red2, 0, 0, 0, 0.36, 0.36, 0.36, kn);
          const ft = grp(kn, 0, -0.95, -0.15); mesh(GEO.box, MT.steel, 0, -0.08, 0.15, 0.56, 0.18, 0.9, ft); ft.rotation.x = -0.35;
          mesh(GEO.box, MT.yel, 0, -0.08, 0.62, 0.5, 0.1, 0.08, ft);
          legs.push({ hip, th, kn, ft });
        }
        mesh(GEO.box, MT.steel2, 0, 2.0, 0, 2.3, 0.4, 0.9, body);
        mesh(GEO.box, MT.yel, 0, 2.0, 0.46, 2.0, 0.12, 0.04, body);
        const wheel = grp(body, 0, 3.55, -0.1); wheel.rotation.y = Math.PI / 2;
        mesh(GEO.torus, MT.red, 0, 0, -0.42, 1, 1, 1, wheel); mesh(GEO.torus, MT.red, 0, 0, 0.42, 1, 1, 1, wheel);
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const rung = mesh(GEO.cyl6, MT.steel, Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0, 0.08, 0.84, 0.08, wheel); rung.rotation.x = Math.PI / 2; }
        for (let i = 0; i < 6; i++) { const sp = mesh(GEO.box, MT.steel2, 0, 0, -0.42, 0.06, 2.5, 0.06, wheel); sp.rotation.z = i / 6 * Math.PI; const sp2 = sp.clone(); sp2.position.z = 0.42; wheel.add(sp2); }
        mesh(GEO.cyl, MT.steel2, 0, 0, 0, 0.3, 1.1, 0.3, wheel).rotation.x = Math.PI / 2;
        const head = grp(body, 0, 3.55, 0.9);
        mesh(GEO.box, MT.steel, 0, 0, 0, 1.0, 0.7, 0.8, head);
        mesh(GEO.box, MT.steel2, 0, -0.38, 0.1, 0.9, 0.12, 0.7, head);
        mesh(GEO.box, MT.yel, 0, 0.36, 0, 1.02, 0.06, 0.82, head);
        const eye = mesh(GEO.ball, MT.rexEye, 0, 0.02, 0.38, 0.42, 0.42, 0.2, head);
        mesh(GEO.cyl6, MT.steel2, 0, 0.02, 0.4, 0.5, 0.06, 0.5, head).rotation.x = Math.PI / 2;
        for (const s of [-1, 1]) { mesh(GEO.cyl6, MT.steel2, s * 0.35, 0.55, -0.1, 0.04, 0.5, 0.04, head); mesh(GEO.ball6, MT.ledR, s * 0.35, 0.82, -0.1, 0.08, 0.08, 0.08, head); }
        for (let i = 0; i < 4; i++) mesh(GEO.box, MT.belt, -0.3 + i * 0.2, -0.2, 0.41, 0.08, 0.12, 0.02, head);
        const beam = mesh(GEO.beam, FX.rexBeam, 0, 0, 0, 1, 1, 1, T3.scene); const spot = flatQuad(FX.rexSpot, 2.2, T3.scene);
        const sh = flatQuad(FX.shadow, 3.8, T3.scene); root.scale.setScalar(0.8);
        return { root, body, legs, wheel, head, eye, beam, spot, sh };
      }
      // ================================================================ Dr Ottercon (hiding in the cupboard)
      function makeOtter() {
        const root = grp(T3.scene), b = grp(root);
        mesh(GEO.ball, MT.labcoat, 0, 0.5, 0, 0.42, 0.62, 0.34, b);
        mesh(GEO.box, MT.labcoat, 0, 0.22, 0, 0.4, 0.3, 0.32, b);
        const hd = grp(b, 0, 0.96, 0.02);
        mesh(GEO.ball, MT.otter, 0, 0, 0, 0.36, 0.32, 0.34, hd); mesh(GEO.ball, MT.otter2, 0, -0.06, 0.12, 0.26, 0.18, 0.2, hd);
        mesh(GEO.ball6, MT.eye, 0, -0.02, 0.23, 0.07, 0.05, 0.05, hd);
        for (const s of [-1, 1]) { mesh(GEO.cyl6, MT.glass, s * 0.08, 0.05, 0.16, 0.1, 0.02, 0.1, hd).rotation.x = Math.PI / 2; mesh(GEO.ball6, MT.eye, s * 0.08, 0.05, 0.155, 0.04, 0.04, 0.02, hd); mesh(GEO.ball6, MT.otter, s * 0.15, 0.1, -0.02, 0.07, 0.07, 0.05, hd); }
        const arms = [];
        for (const s of [-1, 1]) { const a = grp(b, s * 0.24, 0.72, 0); mesh(GEO.box, MT.labcoat, 0, -0.14, 0, 0.11, 0.3, 0.12, a); mesh(GEO.ball6, MT.otter, 0, -0.31, 0.02, 0.09, 0.09, 0.09, a); a.rotation.x = -0.9; a.rotation.z = s * 0.4; arms.push(a); }
        mesh(GEO.ball, MT.otter, 0, 0.2, -0.3, 0.16, 0.12, 0.5, b);
        const sh = flatQuad(FX.shadow, 1, T3.scene);
        return { root, b, hd, arms, sh };
      }
      // pick-ups
      function makeItem(k, lvl) {
        const g = grp(null);
        if (k === 'r') { mesh(GEO.box, MT.ration, 0, 0, 0, 0.36, 0.2, 0.26, g); mesh(GEO.box, MT.rationL, 0, 0.005, 0.131, 0.22, 0.12, 0.01, g); mesh(GEO.box, MT.rationL, 0, 0.101, 0, 0.3, 0.01, 0.06, g); }
        else if (k === 'a') { mesh(GEO.box, MT.ammo, 0, 0, 0, 0.3, 0.18, 0.2, g); for (let i = 0; i < 3; i++) mesh(GEO.box, MT.dart, -0.08 + i * 0.08, 0.13, 0, 0.03, 0.1, 0.03, g); }
        else if (k === 'k') { mesh(GEO.box, MT['card' + (lvl || 1)], 0, 0, 0, 0.34, 0.22, 0.03, g); mesh(GEO.box, MT.cardW, -0.06, 0.03, 0.017, 0.14, 0.05, 0.005, g); mesh(GEO.box, MT.eye, 0, -0.06, 0.017, 0.3, 0.03, 0.005, g); }
        else if (k === 's') { mesh(GEO.ball, MT.seed, 0, 0, 0, 0.2, 0.34, 0.1, g); mesh(GEO.ball6, MT.seed2, 0, 0, 0, 0.12, 0.24, 0.11, g); }
        else if (k === 'p') { const c = mesh(GEO.cyl, MT.plans, 0, 0, 0, 0.16, 0.6, 0.16, g); c.rotation.z = Math.PI / 2; mesh(GEO.cyl, MT.white, 0, 0, 0, 0.17, 0.06, 0.17, g).rotation.z = Math.PI / 2; }
        const glow = mesh(GEO.plane, FX.lamp, 0, -0.25, 0, 0.9, 0.9, 1, g); glow.rotation.x = -Math.PI / 2;
        return g;
      }

      // ================================================================ building an area
      const GUARD_FAN = T3.keep(coneFan(1, 0.68, 10)), CAM_FAN = T3.keep(coneFan(1, 0.42, 8));
      const doorTex = {};
      function dTex(l) {
        if (doorTex[l]) return doorTex[l];
        const t = T3.tex(32, 64, (g) => { g.drawImage(TX.door.image, 0, 0); if (l > 0) { px(g, '#20242a', 8, 26, 16, 14); F.draw(g, String(l), 13, 30, ['#fff', '#6ab0ff', '#ffd04a', '#ff6a4a'][l], 1); px(g, ['#fff', '#6ab0ff', '#ffd04a', '#ff6a4a'][l], 8, 26, 16, 1); } });
        return doorTex[l] = M({ map: t, vcol: true, lit: false });
      }
      // collects quads per material, then makes one buffer per material
      function Builder() {
        const bins = new Map();
        const bin = m => { let b = bins.get(m); if (!b) { b = { p: [], u: [], c: [] }; bins.set(m, b); } return b; };
        function quad(m, P, n, U, C) { // P: 4 corners [x,y,z], n: the way it should face, U: 4 uvs, C: 4 colours [r,g,b]
          const b = bin(m);
          const e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], e2 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
          const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
          const ord = (cx * n[0] + cy * n[1] + cz * n[2]) >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
          for (const i of ord) { b.p.push(P[i][0], P[i][1], P[i][2]); b.u.push(U[i][0], U[i][1]); b.c.push(C[i][0], C[i][1], C[i][2]); }
        }
        function build(parent) {
          for (const [m, b] of bins) {
            const g = new T.BufferGeometry();
            g.setAttribute('position', new T.BufferAttribute(new Float32Array(b.p), 3)); g.setAttribute('uv', new T.BufferAttribute(new Float32Array(b.u), 2)); g.setAttribute('color', new T.BufferAttribute(new Float32Array(b.c), 3));
            g._area = true; const o = new T.Mesh(g, m); parent.add(o);
          }
        }
        return { quad, build };
      }
      let A = null; // the area we're in
      const tileAt = (x, z) => (A && x >= 0 && z >= 0 && x < A.w && z < A.h) ? A.t[(z | 0) * A.w + (x | 0)] : WA;
      const chAt = (x, z) => (A && x >= 0 && z >= 0 && x < A.w && z < A.h) ? A.ch[(z | 0)][(x | 0)] : '#';
      const blockish = c => c === WA || c === CR || c === PI || c === BIG;
      function buildArea(ai) {
        if (A) { T3.scene.remove(A.root); A.root.traverse(o => { if (o.geometry && o.geometry._area) o.geometry.dispose(); }); }
        const D = AREAS[ai], w = D.map[0].length, h = D.map.length, root = new T.Group(); T3.add(root);
        A = { i: ai, def: D, w, h, root, ch: D.map.map(r => r.split('')), t: new Uint8Array(w * h), f2: new Uint8Array(w * h), doors: [], items: [], guards: [], cams: [], lasers: [], spots: [], steams: [], breakers: [], exits: [], lights: (D.lights || []).slice(), npc: null, rex: null, talk: {}, P: [1.5, 1.5] };
        const ac = new T.Color(D.out ? 0xa4b6e4 : 0xffffff);
        for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
          let c = A.ch[z][x]; const i = z * w + x;
          if ('raksbo'.includes(c)) { if (c === 'b') A.breakers.push({ x: x + 0.5, z: z + 0.5, on: false, pull: 0 }); else if (c === 'o') A.npc = { x: x + 0.5, z: z + 0.5 }; else A.items.push({ k: c, x: x + 0.5, z: z + 0.5, id: ai + ':' + x + ',' + z }); c = (D.on && D.on[c]) || '.'; A.ch[z][x] = c; }
          if (c === 'P') { A.P = [x + 0.5, z + 0.5]; c = '.'; A.ch[z][x] = '.'; }
          if (c === 'g' || c === 'h') { A.f2[i] = 2; if (c === 'h') A.steams.push({ x: x + 0.5, z: z + 0.5, ph: (x * 0.7 + z * 1.3) % 3.2, on: false }); c = '.'; A.ch[z][x] = '.'; }
          if (c === ',') A.f2[i] = 1;
          if (c === 'L') A.lights.push([x + 0.5, z + 0.5, 4.2, 0xffcf80, 0.85]);
          if (c === 'E') A.exits.push({ x: x + 0.5, z: z + 0.5 });
          A.t[i] = CODE[c] != null ? CODE[c] : FL;
        }
        if (D.talk) for (const k in D.talk) A.talk[k] = D.talk[k];
        // ---- the baked light at a point
        const LC = A.lights.map(l => [l[0], l[1], l[2], new T.Color(l[3]), l[4]]);
        function light(x, z, out) {
          let r = D.amb * ac.r, g = D.amb * ac.g, b = D.amb * ac.b;
          for (const [lx, lz, lr, col, k] of LC) { const d = Math.hypot(x - lx, z - lz); if (d < lr) { const f = 1 - d / lr, q = f * f * k * 1.5; r += col.r * q; g += col.g * q; b += col.b * q; } }
          out[0] = r; out[1] = g; out[2] = b; return out;
        }
        const solidAO = (x, z) => { const c = tileAt(x, z); return c === WA || c === CR || c === PI || c === BIG || c === LO ? 1 : 0; };
        const B = Builder(), tmp = [0, 0, 0];
        const col = (x, y, z, k) => { light(x, z, tmp); return [tmp[0] * k, tmp[1] * k, tmp[2] * k]; };
        const fmat = [WM[D.floor], WM[D.floor2], WM[D.duct ? 'ductgrate' : D.floor2]];
        const wallMat = WM[D.wall === 'hangar' ? 'hangarw' : D.wall];
        const wallH = D.duct ? 0.7 : D.out ? 1.7 : 1.5;
        const topCol = D.out ? [0.86, 0.9, 0.98] : D.duct ? [0.03, 0.035, 0.04] : [0.17, 0.18, 0.2];
        // floor (every walkable-ish tile; water has none)
        for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
          const c = A.t[z * w + x]; if (c === WT || c === WA) continue;
          const ao = (vx, vz) => 1 - 0.14 * (solidAO(vx - 1, vz - 1) + solidAO(vx, vz - 1) + solidAO(vx - 1, vz) + solidAO(vx, vz));
          const V = [[x, z], [x, z + 1], [x + 1, z + 1], [x + 1, z]];
          const f2 = A.f2[z * w + x], s = f2 === 2 ? 1 : 0.5, ex = c === EX ? 0.7 : 1;
          B.quad(fmat[f2], V.map(([a, b]) => [a, 0, b]), [0, 1, 0], V.map(([a, b]) => [a * s, b * s]), V.map(([a, b]) => col(a, 0, b, ao(a, b) * ex)));
          // the edge of the quay, down to the water
          for (const [dx, dz, n] of [[0, 1, [0, 0, 1]], [1, 0, [1, 0, 0]], [-1, 0, [-1, 0, 0]], [0, -1, [0, 0, -1]]]) if (tileAt(x + dx, z + dz) === WT) {
            const P = dz === 1 ? [[x, 0, z + 1], [x + 1, 0, z + 1], [x + 1, -0.9, z + 1], [x, -0.9, z + 1]] : dz === -1 ? [[x, 0, z], [x + 1, 0, z], [x + 1, -0.9, z], [x, -0.9, z]] : dx === 1 ? [[x + 1, 0, z], [x + 1, 0, z + 1], [x + 1, -0.9, z + 1], [x + 1, -0.9, z]] : [[x, 0, z], [x, 0, z + 1], [x, -0.9, z + 1], [x, -0.9, z]];
            B.quad(WM.planks, P, n, [[0, 0], [1, 0], [1, 0.4], [0, 0.4]], P.map(p => col(p[0], 0, p[2], p[1] < 0 ? 0.35 : 0.7)));
          }
        }
        // walls, crates and low cover: boxes with only the faces you can see
        const sideShade = { s: 1, e: 0.8, w: 0.8, n: 0.62 };
        function block(x, z, top, mat, uvMode, isSame, topMat) {
          const faces = [['s', 0, 1, [[x, 0, z + 1], [x + 1, 0, z + 1], [x + 1, top, z + 1], [x, top, z + 1]]], ['n', 0, -1, [[x + 1, 0, z], [x, 0, z], [x, top, z], [x + 1, top, z]]],
            ['e', 1, 0, [[x + 1, 0, z + 1], [x + 1, 0, z], [x + 1, top, z], [x + 1, top, z + 1]]], ['w', -1, 0, [[x, 0, z], [x, 0, z + 1], [x, top, z + 1], [x, top, z]]]];
          for (const [k, dx, dz, P] of faces) {
            if (isSame(tileAt(x + dx, z + dz), x + dx, z + dz)) continue;
            const lx = x + 0.5 + dx * 0.8, lz = z + 0.5 + dz * 0.8, sh = sideShade[k];
            const U = uvMode === 'wall' ? P.map(p => [(dx ? p[2] : p[0]) * 0.5 * (k === 'n' || k === 'e' ? -1 : 1), p[1] / top]) : uvMode === 'stack' ? [[0, 0], [1, 0], [1, top > 1.2 ? 2 : 1], [0, top > 1.2 ? 2 : 1]] : [[0, 0], [1, 0], [1, 0.45], [0, 0.45]];
            B.quad(mat, P, [dx, 0, dz], U, P.map(p => col(lx, p[1], lz, sh * (p[1] > 0 ? 1 : 0.62))));
          }
          const T4 = [[x, top, z], [x, top, z + 1], [x + 1, top, z + 1], [x + 1, top, z]];
          if (topMat) B.quad(topMat, T4, [0, 1, 0], [[0, 0], [0, 1], [1, 1], [1, 0]], T4.map(p => col(p[0], 0, p[2], 1.05)));
          else B.quad(WM.top, T4, [0, 1, 0], [[0, 0], [0, 1], [1, 1], [1, 0]], T4.map(() => topCol));
        }
        for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
          const c = A.t[z * w + x], ch = A.ch[z][x];
          if (c === WA) { const top = (z === h - 1 || (D.duct && false)) ? 0.35 : wallH; block(x, z, top, wallMat, 'wall', (t) => t === WA, D.out ? WM.snow : null); }
          else if (c === CR) { const big = ch === 'B'; block(x, z, big ? 1.5 : 0.85, big ? WM.mil : WM.crate, 'stack', () => false, big ? WM.mil : WM.crate); }
          else if (c === LO) { const m = D.out ? WM.sand : D.floor === 'labtile' ? WM.bench : WM.desk; block(x, z, 0.5, m, 'low', (t) => t === LO, m); }
        }
        B.build(root);
        // water
        if (D.out) {
          const wt = mesh(GEO.plane, FX.water, w / 2, -0.32, h / 2, w + 40, h + 40, 1, root); wt.rotation.x = -Math.PI / 2; A.water = wt;
        }
        // ---- things
        for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
          const ch = A.ch[z][x], c = A.t[z * w + x];
          if (c === PO) { mesh(GEO.cyl6, MT.post, x + 0.5, 1.1, z + 0.5, 0.12, 2.2, 0.12, root); mesh(GEO.box, MT.post, x + 0.5, 2.2, z + 0.35, 0.16, 0.08, 0.4, root); mesh(GEO.box, MT.lampHead, x + 0.5, 2.14, z + 0.2, 0.22, 0.06, 0.16, root); const gl = mesh(GEO.plane, FX.lamp, x + 0.5, 0.03, z + 0.4, 3.4, 3.4, 1, root); gl.rotation.x = -Math.PI / 2; }
          if (c === PI) {
            if (D.floor === 'labtile') { mesh(GEO.cyl, MT.steel2, x + 0.5, 0.12, z + 0.5, 0.86, 0.24, 0.86, root); mesh(GEO.cyl, MT.tankG, x + 0.5, 0.85, z + 0.5, 0.74, 1.3, 0.74, root); mesh(GEO.cyl, MT.steel, x + 0.5, 1.55, z + 0.5, 0.86, 0.14, 0.86, root); mesh(GEO.ball, MT.seed2, x + 0.5, 0.8, z + 0.5, 0.18, 0.4, 0.18, root); }
            else { const p = new T.Mesh(GEO.box, M({ map: TX.pillar })); p.position.set(x + 0.5, 1.25, z + 0.5); p.scale.set(0.9, 2.5, 0.9); root.add(p); }
          }
          if (c === EX && !D.duct) { const dir = x === 0 ? Math.PI / 2 : x === w - 1 ? -Math.PI / 2 : z === 0 ? 0 : Math.PI; if (!D.objs || !D.objs.some(o => o.t === 'lift' && !o.up) || x === 0 || x === w - 1) { const a = flatQuad(FX.arrow, 0.8, root); a.position.set(x + 0.5, 0.03, z + 0.5); a.rotation.z = dir; A.exits.find(e => e.x === x + 0.5 && e.z === z + 0.5).arrow = a; } }
        }
        // doors (runs of the same digit)
        const seenD = new Set();
        for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
          const ch = A.ch[z][x]; if (!'0123'.includes(ch) || seenD.has(x + ',' + z)) continue;
          const horiz = tileAt(x - 1, z) === WA || A.ch[z][x + 1] === ch || tileAt(x + 1, z) === WA;
          const tiles = []; let nx = x, nz = z;
          while (A.ch[nz] && A.ch[nz][nx] === ch) { tiles.push([nx, nz]); seenD.add(nx + ',' + nz); if (horiz) nx++; else nz++; }
          const n = tiles.length, cx = horiz ? x + n / 2 : x + 0.5, cz = horiz ? z + 0.5 : z + n / 2;
          const g = grp(root, cx, 0, cz); if (!horiz) g.rotation.y = Math.PI / 2;
          const dm = dTex(+ch), half = n / 2, panels = [];
          for (const s of [-1, 1]) { const p = new T.Mesh(GEO.box, dm); p.scale.set(half, wallH - 0.1, 0.18); p.position.set(s * half / 2, (wallH - 0.1) / 2, 0); g.add(p); panels.push(p); }
          for (const p of panels) { if (!p.geometry._dc) { const gg = GEO.box.clone(); const cc = []; const pos = gg.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const k = (y > 0 ? 1 : 0.65) * (D.amb + 0.5); cc.push(k, k, k); } gg.setAttribute('color', new T.BufferAttribute(new Float32Array(cc), 3)); gg._area = true; gg._dc = 1; p.geometry = gg; } }
          mesh(GEO.box, MT.yel, -half - 0.04, wallH / 2, 0, 0.1, wallH, 0.26, g); mesh(GEO.box, MT.yel, half + 0.04, wallH / 2, 0, 0.1, wallH, 0.26, g);
          const led = mesh(GEO.box, MT.ledR, 0, wallH + 0.08, 0.12, 0.3, 0.1, 0.06, g);
          A.doors.push({ lvl: +ch, tiles, horiz, cx, cz, open: 0, panels, half, led, g });
        }
        // objects
        for (const o of D.objs || []) {
          if (o.t === 'pipes') { for (const r of [o.z + 0.35, o.z + 0.75, o.z + 2.3, o.z + 2.65]) { const p = mesh(GEO.cyl, r % 1 > 0.5 ? MT.pipe2 : MT.pipe, o.x + o.w / 2, 0.66 + (r % 1 > 0.5 ? 0.12 : 0), r, 0.26, o.w, 0.26, root); p.rotation.z = Math.PI / 2; } for (let i = 0; i <= o.w; i += 2) { mesh(GEO.box, MT.steel2, o.x + i + 0.1, 0.45, o.z + 0.55, 0.1, 0.9, 0.1, root); mesh(GEO.box, MT.steel2, o.x + i + 0.1, 0.45, o.z + 2.45, 0.1, 0.9, 0.1, root); } }
          if (o.t === 'lift') { const g = grp(root, o.x + o.w / 2, 0, o.z + o.d / 2); mesh(GEO.box, MT.steel2, 0, 0.03, 0, o.w - 0.1, 0.06, o.d - 0.1, g); mesh(GEO.box, MT.yel, 0, 0.065, (o.d - 0.1) / 2 - 0.05, o.w - 0.1, 0.02, 0.1, g); if (!o.up) { for (const s of [-1, 1]) mesh(GEO.box, MT.steel, s * (o.w / 2 - 0.1), 1.2, -o.d / 2 + 0.2, 0.16, 2.4, 0.16, g); mesh(GEO.box, MT.yel, 0, 2.3, -o.d / 2 + 0.2, o.w, 0.16, 0.16, g); const s = new T.Mesh(GEO.box, M({ map: T3.tex(32, 16, (q) => { px(q, '#202428', 0, 0, 32, 16); F.draw(q, 'LIFT', 4, 4, '#ffd04a', 1); }) })); s.position.set(0, 1.9, -o.d / 2 + 0.3); s.scale.set(1, 0.5, 0.05); g.add(s); } }
          if (o.t === 'boat') { const g = grp(root, o.x, -0.25, o.z); mesh(GEO.ball, MT.boat, 0, 0, 0, 1.0, 0.35, 2.0, g); mesh(GEO.ball, MT.boat2, 0, 0.08, 0, 0.75, 0.25, 1.6, g); mesh(GEO.box, MT.belt, 0, 0.1, -0.85, 0.3, 0.3, 0.2, g); g.rotation.y = 0.4; A.boat = g; }
          if (o.t === 'truck') {
            const g = grp(root, o.x + o.w / 2, 0, o.z + o.d / 2);
            const bed = new T.Mesh(GEO.box, M({ map: TX.canvas })); bed.position.set(-0.5, 1.3, 0); bed.scale.set(o.w - 1.2, 1.0, o.d - 0.4); g.add(bed);
            mesh(GEO.box, MT.cab, -0.5, 0.72, 0, o.w - 1.0, 0.18, o.d - 0.3, g);
            mesh(GEO.box, MT.cab, o.w / 2 - 0.6, 1.15, 0, 1.2, 1.0, o.d - 0.5, g); mesh(GEO.box, MT.heliG, o.w / 2 - 0.02, 1.35, 0, 0.06, 0.4, o.d - 0.8, g);
            for (const sx of [-1.6, 0.2, 1.8]) for (const s of [-1, 1]) { const t = mesh(GEO.cyl, MT.tyre, sx, 0.35, s * (o.d / 2 - 0.25), 0.7, 0.3, 0.7, g); t.rotation.x = Math.PI / 2; }
          }
          if (o.t === 'heli') {
            const g = grp(root, o.x + o.w / 2, 0, o.z + o.d / 2);
            const hm = M({ map: TX.heli }); const f = new T.Mesh(GEO.ball, hm); f.position.set(-0.4, 1.1, 0); f.scale.set(4.0, 1.7, 2.2); g.add(f);
            mesh(GEO.ball, MT.heliG, -1.9, 1.3, 0, 1.4, 1.1, 1.7, g);
            const boom = new T.Mesh(GEO.box, hm); boom.position.set(3.0, 1.5, 0); boom.scale.set(3.2, 0.4, 0.4); g.add(boom);
            mesh(GEO.box, MT.heliD, 4.5, 1.9, 0, 0.6, 0.9, 0.1, g);
            for (const s of [-1, 1]) { mesh(GEO.box, MT.rotor, -0.4, 0.2, s * 1.0, 4.2, 0.08, 0.1, g); mesh(GEO.box, MT.rotor, -1.4, 0.5, s * 0.95, 0.08, 0.6, 0.08, g); mesh(GEO.box, MT.rotor, 0.6, 0.5, s * 0.95, 0.08, 0.6, 0.08, g); }
            const rot = grp(g, -0.4, 2.05, 0); mesh(GEO.cyl6, MT.rotor, 0, -0.1, 0, 0.2, 0.3, 0.2, rot);
            for (let i = 0; i < 2; i++) { const bl = mesh(GEO.box, MT.rotor, 0, 0, 0, 7.5, 0.04, 0.3, rot); bl.rotation.y = i * Math.PI / 2; }
            A.rotor = rot;
          }
          if (o.t === 'pad') { const p = flatQuad(FX.pad, 6.4, root); p.position.set(o.x + o.w / 2, 0.025, o.z + o.d / 2); }
          if (o.t === 'tower') { mesh(GEO.box, MT.post, o.x, 2.6, o.z, 0.3, 5.2, 0.3, root); mesh(GEO.box, MT.post, o.x, 5.2, o.z, 0.7, 0.2, 0.7, root); mesh(GEO.cyl, MT.steel, o.x, 5.45, o.z, 0.5, 0.4, 0.5, root); }
          if (o.t === 'vent') { const g = grp(root, o.x + 0.5, 0.02, o.z + 0.5); mesh(GEO.box, MT.belt, 0, 0, 0, 0.9, 0.02, 0.9, g); for (let i = 0; i < 4; i++) mesh(GEO.box, MT.steel, 0, 0.02, -0.33 + i * 0.22, 0.86, 0.02, 0.05, g); const lid = mesh(GEO.box, MT.steel, 0.75, 0.02, 0.2, 0.86, 0.04, 0.86, g); lid.rotation.y = 0.4; }
        }
        if (D.duct) { const e = A.exits[0]; const g = grp(root, e.x, 0.02, e.z); mesh(GEO.box, MT.belt, 0, 0, 0, 0.9, 0.02, 0.9, g); for (let i = 0; i < 5; i++) mesh(GEO.box, MT.steel, -0.36 + i * 0.18, 0.02, 0, 0.05, 0.02, 0.86, g); const gl = mesh(GEO.plane, FX.lamp, 0, 0.03, 0, 1.6, 1.6, 1, g); gl.rotation.x = -Math.PI / 2; }
        // items
        for (const it of A.items) { it.g = makeItem(it.k, D.card); it.g.position.set(it.x, 0.35, it.z); root.add(it.g); if (it.k === 'k' && D.on && D.on.k === '=') it.g.position.y = 0.22; }
        // security cameras
        for (const c of D.cams || []) {
          const g = grp(root, c.x, wallH - 0.25, c.z); mesh(GEO.box, MT.steel2, 0, 0.1, c.a === Math.PI ? 0.12 : -0.12, 0.12, 0.3, 0.14, g);
          const head = grp(g, 0, 0, c.a === Math.PI ? -0.05 : 0.05); mesh(GEO.box, MT.cam, 0, 0, 0.12, 0.2, 0.18, 0.38, head); mesh(GEO.cyl6, MT.eye, 0, 0, 0.33, 0.12, 0.06, 0.12, head).rotation.x = Math.PI / 2; const led = mesh(GEO.box, MT.camLed, 0.06, 0.1, 0.25, 0.04, 0.04, 0.04, head);
          const fan = mesh(CAM_FAN, FX.camCone, c.x, 0.04, c.z, 5.2, 1, 5.2, root);
          A.cams.push({ x: c.x, z: c.z, base: c.a, sw: c.sw, per: c.per, ph: c.ph || 0, a: c.a, head, led, fan, sus: 0, range: 5.2 });
        }
        // laser tripwires
        for (const L of D.lasers || []) {
          const y = L.hi ? 0.55 : 0.2, len = L.z1 - L.z0;
          const m = mesh(GEO.box, FX.laser, L.x, y, L.z0 + len / 2, 0.035, 0.035, len, root);
          const ends = [L.z0, L.z1].map(z => { mesh(GEO.box, MT.steel2, L.x, y, z, 0.2, 0.2, 0.12, root); const gl = mesh(GEO.plane, FX.laserGlow, L.x, y, z + (z === L.z0 ? 0.1 : -0.1), 0.8, 0.8, 1, root); return gl; });
          A.lasers.push({ x: L.x, z0: L.z0, z1: L.z1, hi: !!L.hi, blink: L.blink, ph: L.ph || 0, m, ends, on: true, y });
        }
        // searchlights
        for (const s of D.spots || []) A.spots.push({ fx: s.from[0], fz: s.from[1], a: s.a, b: s.b, per: s.per, ph: s.ph, x: s.a[0], z: s.a[1], beam: mesh(GEO.beam, FX.beam, s.from[0], 5.4, s.from[1], 1, 1, 1, root), disc: (() => { const d = flatQuad(FX.spot, 3.4, root); d.position.y = 0.05; return d; })(), track: 0 });
        // steam pipes
        for (const s of A.steams) { s.puffs = []; for (let i = 0; i < 4; i++) { const m = mesh(GEO.plane, M({ map: TX.steam, transparent: true, opacity: 0, lit: false, noDither: true }), s.x, 0.2, s.z, 0.6, 0.6, 1, root); m.material.depthWrite = false; m.rotation.x = -Math.PI / 2; own.push(m.material); s.puffs.push(m); } }
        // power switches (on the wall next to them)
        for (const b of A.breakers) {
          const dirs = [[0, -1], [-1, 0], [1, 0], [0, 1]], d = dirs.find(([dx, dz]) => tileAt(b.x + dx, b.z + dz) === WA) || [0, -1];
          const g = grp(root, b.x + d[0] * 0.42, 0, b.z + d[1] * 0.42); g.rotation.y = Math.atan2(-d[0], -d[1]);
          mesh(GEO.box, MT.breaker, 0, 0.8, 0, 0.7, 0.9, 0.18, g); mesh(GEO.box, MT.yel, 0, 1.28, 0.02, 0.72, 0.06, 0.2, g);
          const lev = grp(g, 0, 0.85, 0.12); mesh(GEO.box, MT.lever, 0, 0.18, 0.04, 0.08, 0.36, 0.08, lev); mesh(GEO.ball6, MT.belt, 0, 0.38, 0.04, 0.14, 0.14, 0.14, lev); lev.rotation.x = -0.6;
          const led = mesh(GEO.box, MT.ledR, 0.22, 1.12, 0.1, 0.1, 0.1, 0.04, g);
          const glow = mesh(GEO.plane, FX.laserGlow, b.x, 0.04, b.z, 1.4, 1.4, 1, root); glow.rotation.x = -Math.PI / 2;
          Object.assign(b, { g, lev, led, glow, dx: d[0], dz: d[1] });
        }
        // Dr Ottercon
        if (A.npc && !S.otter) { const o = makeOtter(); T3.scene.remove(o.root); root.add(o.root); root.add(o.sh); o.root.position.set(A.npc.x, 0, A.npc.z); o.sh.position.set(A.npc.x, 0.03, A.npc.z); A.npc.m = o; }
        else if (A.npc) A.npc = null;
        // guards
        (D.guards || []).forEach((gd, gi) => {
          const m = makeGuard(!D.out); T3.scene.remove(m.root); root.add(m.root); T3.scene.remove(m.sh); root.add(m.sh);
          const p0 = gd.r[0];
          A.guards.push({ m, route: gd.r, post: !!gd.post, ri: 0, x: p0[0], z: p0[1], a: p0[3] != null ? p0[3] : 0, head: 0, st: 'patrol', t: 0, sus: 0, path: null, pi: 0, tgt: null, last: null, icon: '', iconT: 0, throwT: 1, tackT: 0, run: 0, sleepT: 0, stared: 0, lastSeenT: 9, id: gi, speed: 0, hearT: 0 });
        });
        // the boss
        if (D.boss) { const r = makeRex(); for (const o of [r.root, r.beam, r.spot, r.sh]) { T3.scene.remove(o); root.add(o); } A.rex = { m: r, x: 13, z: 10.5, a: 0, eye: Math.PI, st: 'scan', t: 0, phase: 0, fireT: 0, seenT: 0, wp: 0, walkT: 0, dir: 1, revT: 4, step: 0, sus: 0, down: 0 }; }
        // snow on the outside areas
        snow.visible = !!D.out; foot.forEach(f => { f.visible = false; });
        // the radar map
        A.radar = radarMap();
        T3.fog(D.sky, D.fog[0], D.fog[1]);
        LT.hemi.intensity = D.out ? 0.62 : 0.8; LT.sun.intensity = D.out ? 0.55 : 0.6;
        LT.hemi.color.set(D.out ? 0xb8c8f0 : 0xfff6ea);
        return A;
      }
      function radarMap() {
        const c = document.createElement('canvas'); c.width = A.w * 3; c.height = A.h * 3; const g = c.getContext('2d');
        for (let z = 0; z < A.h; z++) for (let x = 0; x < A.w; x++) {
          const t = A.t[z * A.w + x];
          const col = t === WA ? '#3aa860' : t === CR || t === BIG || t === PI ? '#2a7a48' : t === LO ? '#1e5a36' : t === CS ? '#123a22' : t === WT ? '#0a2a3a' : t === DR ? '#c0ff80' : t === EX ? '#80ffb0' : null;
          if (col) { g.fillStyle = col; g.fillRect(x * 3, z * 3, 3, 3); }
        }
        return c;
      }

      // ---- snow (points that follow the camera), footprints, puffs
      const SN = 360, snowPos = new Float32Array(SN * 3);
      for (let i = 0; i < SN; i++) { snowPos[i * 3] = (R() - 0.5) * 20; snowPos[i * 3 + 1] = R() * 9; snowPos[i * 3 + 2] = (R() - 0.5) * 16; }
      const snowGeo = T3.keep(new T.BufferGeometry()); snowGeo.setAttribute('position', new T.BufferAttribute(snowPos, 3));
      const snowMat = new T.PointsMaterial({ color: 0xeef4ff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.9 }); own.push(snowMat);
      const snow = new T.Points(snowGeo, snowMat); snow.frustumCulled = false; T3.add(snow);
      const foot = []; let footI = 0; for (let i = 0; i < 46; i++) { const f = flatQuad(FX.print, 0.26, T3.scene); f.visible = false; foot.push(f); }
      const parts = []; for (let i = 0; i < 44; i++) { const m = mesh(GEO.box, M({ color: 0xffffff, lit: false, transparent: true, noDither: true }), 0, -9, 0, 0.1, 0.1, 0.1, T3.scene); m.visible = false; own.push(m.material); parts.push({ m, t: 0, v: [0, 0, 0], g: 0 }); }
      function burst(x, y, z, col, n, sp, up, grav, size) {
        for (let i = 0; i < n; i++) { const p = parts.find(q => q.t <= 0); if (!p) return; p.t = p.t0 = 0.45 + R() * 0.45; p.m.visible = true; p.m.material.color.setHex(col); p.m.material.opacity = 1; p.m.position.set(x, y, z); const s = (size || 0.1) * (0.7 + R() * 0.7); p.m.scale.set(s, s, s); p.v[0] = (R() - 0.5) * sp; p.v[1] = (up == null ? 2 : up) * (0.5 + R()); p.v[2] = (R() - 0.5) * sp; p.g = grav == null ? 12 : grav; }
      }
      function stepParts(dt) { for (const p of parts) if (p.t > 0) { p.t -= dt; p.v[1] -= p.g * dt; p.m.position.x += p.v[0] * dt; p.m.position.y = Math.max(0.03, p.m.position.y + p.v[1] * dt); p.m.position.z += p.v[2] * dt; p.m.rotation.x += dt * 5; p.m.material.opacity = Math.min(1, p.t / p.t0 * 2); if (p.t <= 0) p.m.visible = false; } }
      // projectiles: snowballs (guards), darts (you), pellets (REX)
      const shots = [];
      function shot(k, x, y, z, vx, vy, vz) {
        let s = shots.find(q => !q.on && q.k === k);
        if (!s) { if (shots.filter(q => q.k === k).length > 10) return null; s = { k, m: k === 'dart' ? mesh(GEO.box, MT.dart, 0, 0, 0, 0.05, 0.05, 0.3, T3.scene) : mesh(GEO.ball6, k === 'snow' ? MT.snowb : MT.pellet, 0, 0, 0, k === 'snow' ? 0.2 : 0.24, null, null, T3.scene) }; shots.push(s); }
        Object.assign(s, { on: true, x, y, z, vx, vy, vz, t: 0 }); s.m.visible = true; s.m.position.set(x, y, z); if (k === 'dart') s.m.rotation.y = Math.atan2(vx, vz);
        return s;
      }

      // ================================================================ the state of play
      let S = null, CK = null, HI = MATES.map(x => Object.assign({}, x));
      { const sv = K.load(); if (sv) { if (Array.isArray(sv.hi) && sv.hi.length) HI = sv.hi; if (sv.ck && sv.ck.st) CK = sv.ck; } }
      const persist = () => K.save({ ck: CK, hi: HI });
      const newS = () => ({ area: 0, cards: 0, darts: 5, rations: 1, life: 100, seeds: {}, taken: {}, otter: 0, calls: {}, st: { t: 0, alerts: 0, naps: 0, rations: 0, cont: 0 } });
      const copy = o => JSON.parse(JSON.stringify(o));
      const G0 = makeGerbil();
      const P = { x: 0, z: 0, a: Math.PI, low: false, box: false, wall: null, pushT: 0, wallGrace: 0, run: 0, inv: 0, stun: 0, kx: 0, kz: 0, dartT: 0, pullT: 0, pullB: null, still: 0, moving: false, dead: 0, stepT: 0, prompt: '', blockCS: 0, peek: 0, hurtT: 0 };
      let mode = 'title', paused = false, phase = 'normal', alertT = 0, evT = 0, alertPos = null, bang = 0, flash = 0, flashCol = '255,40,30', shake = 0;
      let toastS = '', toastT = 0, cardT = 0, saveT = 0, captions = [], capT = 0, tutT = 0, fadeT = 0, fadeTo = -1, winT = 0;
      const toast = (s, t) => { toastS = s; toastT = t || 1.8; };
      const hidden = () => P.low && tileAt(P.x, P.z) === CS;
      const tick = (f, d, v, w, to) => K.sfx.tone(f, d, w || 'square', v == null ? 0.06 : v, 0, to);
      const SFX = {
        bang() { K.sfx.tone(1568, 0.09, 'square', 0.12); K.sfx.tone(2093, 0.38, 'sawtooth', 0.09, 0.07, 1760); K.sfx.noise(0.25, 0.12, 5000, 0, 'highpass'); },
        huh() { K.sfx.tone(392, 0.08, 'triangle', 0.1); K.sfx.tone(523, 0.16, 'triangle', 0.1, 0.09, 587); },
        knock() { for (const w of [0, 0.16]) { K.sfx.tone(150, 0.07, 'square', 0.13, w, 90); K.sfx.noise(0.06, 0.25, 700, w); } },
        dart() { K.sfx.noise(0.12, 0.14, 3200, 0, 'bandpass', 700); K.sfx.tone(900, 0.08, 'triangle', 0.06, 0, 300); },
        thup() { K.sfx.noise(0.08, 0.2, 900); K.sfx.tone(220, 0.12, 'square', 0.06, 0, 110); },
        snore() { K.sfx.tone(90, 0.5, 'sawtooth', 0.025, 0, 70); },
        box() { K.sfx.noise(0.16, 0.18, 1400, 0, 'bandpass', 500); K.sfx.tone(120, 0.06, 'square', 0.05); },
        get() { K.sfx.seq([[79, 0.25], [83, 0.25], [86, 0.5]], { bpm: 420, vol: 0.08 }); },
        card() { K.sfx.seq([[72, 0.25], [79, 0.25], [84, 0.25], [88, 0.75]], { bpm: 360, vol: 0.08 }); },
        door() { K.sfx.noise(0.35, 0.1, 1800, 0, 'lowpass', 300); K.sfx.tone(180, 0.2, 'triangle', 0.05, 0, 120); },
        hurt() { K.sfx.noise(0.2, 0.25, 1200); K.sfx.tone(160, 0.25, 'square', 0.1, 0, 60); },
        splat() { K.sfx.noise(0.14, 0.18, 2500, 0, 'lowpass', 400); },
        throw() { K.sfx.noise(0.12, 0.06, 1800, 0, 'bandpass', 3000); },
        step(metal) { K.sfx.noise(0.03, metal ? 0.06 : 0.035, metal ? 4000 : 900, 0, metal ? 'highpass' : 'lowpass'); },
        alarm() { for (let i = 0; i < 3; i++) { K.sfx.tone(880, 0.12, 'square', 0.07, i * 0.25); K.sfx.tone(660, 0.12, 'square', 0.07, i * 0.25 + 0.12); } },
        steam() { K.sfx.noise(0.5, 0.06, 3000, 0, 'highpass', 1200); },
        lever() { K.sfx.tone(110, 0.3, 'sawtooth', 0.1, 0, 55); K.sfx.noise(0.5, 0.2, 2500, 0.1, 'bandpass', 400); },
        stomp() { K.sfx.tone(70, 0.25, 'sine', 0.2, 0, 35); K.sfx.noise(0.15, 0.12, 300); },
        crawl() { K.sfx.noise(0.08, 0.08, 600); },
        lift() { K.sfx.tone(110, 1.2, 'sawtooth', 0.05, 0, 220); K.sfx.noise(1.2, 0.04, 800); },
      };

      // ---- grid helpers
      const doorAt = (x, z) => { const ix = x | 0, iz = z | 0; for (const d of A.doors) for (const t of d.tiles) if (t[0] === ix && t[1] === iz) return d; return null; };
      function solidP(x, z) { const t = tileAt(x, z); if (t === FL || t === EX) return false; if (t === CS) return !P.low; if (t === DR) { const d = doorAt(x, z); return !d || d.open < 0.85; } return true; }
      const walkG = t => t === FL || t === DR;
      function opaque(x, z, low) { const t = tileAt(x, z); if (t === WA || t === CR || t === BIG || t === PI) return true; if (t === LO || t === CS) return low; if (t === DR) { const d = doorAt(x, z); return !d || d.open < 0.6; } return false; }
      function los(x0, z0, x1, z1, low) {
        const d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / 0.2); const ex = x1 | 0, ez = z1 | 0;
        for (let i = 1; i < n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; if ((x | 0) === ex && (z | 0) === ez) continue; if (opaque(x, z, low)) return false; }
        return true;
      }
      function rayLen(x0, z0, a, max) { const sx = Math.sin(a), sz = Math.cos(a); for (let d = 0.3; d < max; d += 0.2) if (opaque(x0 + sx * d, z0 + sz * d, false)) return d; return max; }
      function moveCircle(o, dx, dz, r, solid) {
        let bx = false, bz = false;
        if (dx) { const nx = o.x + dx, e = nx + Math.sign(dx) * r; if (solid(e, o.z - r * 0.85) || solid(e, o.z + r * 0.85)) { bx = true; o.x = dx > 0 ? Math.max(o.x, Math.min(nx, Math.floor(e) - r - 0.001)) : Math.min(o.x, Math.max(nx, Math.floor(e) + 1 + r + 0.001)); } else o.x = nx; }
        if (dz) { const nz = o.z + dz, e = nz + Math.sign(dz) * r; if (solid(o.x - r * 0.85, e) || solid(o.x + r * 0.85, e)) { bz = true; o.z = dz > 0 ? Math.max(o.z, Math.min(nz, Math.floor(e) - r - 0.001)) : Math.min(o.z, Math.max(nz, Math.floor(e) + 1 + r + 0.001)); } else o.z = nz; }
        return [bx, bz];
      }
      // breadth-first paths for the guards (tile centres)
      const bfsPrev = new Int32Array(64 * 64);
      function findPath(fx, fz, tx, tz) {
        const w = A.w, h = A.h, s = (fz | 0) * w + (fx | 0); let goal = (tz | 0) * w + (tx | 0);
        bfsPrev.fill(-1, 0, w * h); bfsPrev[s] = s; const q = [s]; let best = s, bd = 1e9;
        for (let qi = 0; qi < q.length; qi++) {
          const c = q[qi], cx = c % w, cz = (c / w) | 0;
          const dd = Math.hypot(cx - (tx | 0), cz - (tz | 0)); if (dd < bd) { bd = dd; best = c; }
          if (c === goal) break;
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
            const nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx >= w || nz >= h) continue; const n = nz * w + nx;
            if (bfsPrev[n] >= 0 || !walkG(A.t[n])) continue;
            if (dx && dz && (!walkG(A.t[cz * w + nx]) || !walkG(A.t[nz * w + cx]))) continue;
            bfsPrev[n] = c; q.push(n);
          }
        }
        if (bfsPrev[goal] < 0) goal = best;
        const out = []; let c = goal; while (c !== s && out.length < 400) { out.push([c % w + 0.5, ((c / w) | 0) + 0.5]); c = bfsPrev[c]; }
        out.reverse(); if (out.length && goal === (tz | 0) * w + (tx | 0)) out[out.length - 1] = [tx, tz];
        return out;
      }

      // ================================================================ the player
      function toggleBox() {
        if (A.def.duct) { toast('NO ROOM FOR THE BOX IN HERE'); return; }
        if (!P.box && P.low && tileAt(P.x, P.z) === CS) return;
        P.box = !P.box; P.low = false; P.wall = null; SFX.box(); P.still = 0;
        burst(P.x, 0.4, P.z, 0xb48a52, 4, 2, 1.5);
      }
      function canStand() { const r = 0.24; for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (tileAt(P.x + dx, P.z + dz) === CS) return false; return true; }
      function hurt(n, fx, fz, why) {
        if (P.inv > 0 || P.dead || mode !== 'play') return;
        S.life -= n; P.inv = 1.1; P.stun = 0.35; flash = 0.35; flashCol = '255,40,30'; shake = 0.25; SFX.hurt();
        const d = Math.hypot(P.x - fx, P.z - fz) || 1; P.kx = (P.x - fx) / d * 5; P.kz = (P.z - fz) / d * 5;
        if (P.box) { P.box = false; toast('YOUR BOX GOT BONKED OFF!'); burst(P.x, 0.5, P.z, 0xb48a52, 8, 4, 3); }
        P.pullT = 0; P.wall = null;
        if (why) toast(why);
        if (S.life <= 0) {
          if (S.rations > 0) { S.rations--; S.st.rations++; S.life = 65; toast('ATE A RATION! (CHEESE AND PICKLE)', 2.4); SFX.get(); burst(P.x, 0.8, P.z, 0x8aff8a, 10, 3, 3); }
          else { S.life = 0; P.dead = 0.01; K.music(null); K.sfx.seq([[67, 0.5], [63, 0.5], [60, 0.5], [55, 1.5]], { bpm: 140, wave: 'triangle', vol: 0.12 }); }
        }
      }
      function playerUpdate(dt) {
        if (P.dead) { P.dead += dt; return; }
        if (P.inv > 0) P.inv -= dt; if (P.stun > 0) P.stun -= dt; if (P.dartT > 0) P.dartT -= dt;
        const st = K.stick(); let mx = st.x, mz = st.y; const mag = Math.hypot(mx, mz); if (mag > 1) { mx /= mag; mz /= mag; }
        P.prompt = '';
        // pulling a power switch: stuck until it's done
        if (P.pullT > 0) { P.pullT -= dt; if (P.pullT <= 0 && P.pullB) flipBreaker(P.pullB); return; }
        if (A.def.duct) P.low = true;
        else if (K.pressed('a') && !P.box) { if (P.low) { if (canStand()) { P.low = false; SFX.crawl(); } else toast('NO ROOM TO STAND UP HERE'); } else { P.low = true; P.wall = null; SFX.crawl(); } }
        if (K.pressed('y')) toggleBox();
        const spd = P.box ? 1.75 : P.low ? (A.def.duct ? 1.8 : 1.4) : 3.3;
        let vx = 0, vz = 0; P.moving = false;
        if (P.stun > 0) { vx = P.kx; vz = P.kz; P.kx *= 0.85; P.kz *= 0.85; }
        else if (P.wall) {
          // pressed up against a wall: slide along it, step away to let go
          const n = P.wall, into = -(mx * n.x + mz * n.z), side = mx * -n.z + mz * n.x;
          if (mag < 0.2) { /* stay pressed against the wall until you step away */ }
          else if (into < -0.45) P.wall = null;
          else {
            P.wallGrace = 0.5;
            if (Math.abs(side) > 0.35) {
              const sx = -n.z * Math.sign(side), sz = n.x * Math.sign(side), nx = P.x + sx * 1.3 * dt, nz = P.z + sz * 1.3 * dt;
              // only as far as the wall goes (then you peek round the corner)
              if (solidP(nx - n.x * 0.4 + sx * 0.18, nz - n.z * 0.4 + sz * 0.18)) { const o = { x: P.x, z: P.z }; moveCircle(o, sx * 1.3 * dt, sz * 1.3 * dt, 0.24, solidP); P.x = o.x; P.z = o.z; P.moving = true; P.peek *= 0.9; }
              else P.peek = clamp(P.peek + Math.sign(side) * dt * 3, -1, 1);
            } else P.peek *= 0.9;
          }
          if (P.wall) { P.a = Math.atan2(n.x, n.z); P.prompt = 'b:KNOCK'; }
        }
        else if (mag > 0.2) { vx = mx * spd; vz = mz * spd; P.moving = true; const want = Math.atan2(mx, mz); P.a += angDiff(P.a, want) * Math.min(1, dt * 14); }
        if (!P.wall) P.peek *= 0.85;
        if (vx || vz) {
          const o = { x: P.x, z: P.z }, [bx, bz] = moveCircle(o, vx * dt, vz * dt, 0.24, solidP); P.x = o.x; P.z = o.z;
          // walking into a wall: press up against it
          const ax = Math.abs(mx) > 0.75 && bx, az = Math.abs(mz) > 0.75 && bz;
          const wt = ax ? tileAt(P.x + Math.sign(mx) * 0.4, P.z) : az ? tileAt(P.x, P.z + Math.sign(mz) * 0.4) : -1;
          if ((ax || az) && !P.low && !P.box && (wt === WA || wt === CR || wt === BIG || wt === PI)) { P.pushT += dt; if (P.pushT > 0.22) { P.wall = ax ? { x: -Math.sign(mx), z: 0 } : { x: 0, z: -Math.sign(mz) }; P.wallGrace = 0.5; P.pushT = 0; P.peek = 0; tick(300, 0.04, 0.04, 'triangle'); } }
          else P.pushT = 0;
          if ((ax || az) && !P.low && wt === CS) { P.blockCS = 0.6; }
        } else P.pushT = 0;
        if (P.blockCS > 0) { P.blockCS -= dt; P.prompt = 'a:CRAWL UNDER'; }
        P.still = P.moving ? 0 : P.still + dt;
        // guards are solid too
        for (const g of A.guards) { if (g.st === 'sleep') continue; const dx = P.x - g.x, dz = P.z - g.z, d = Math.hypot(dx, dz); if (d < 0.55 && d > 0.001) { const o = { x: P.x, z: P.z }; moveCircle(o, dx / d * (0.55 - d), dz / d * (0.55 - d), 0.24, solidP); P.x = o.x; P.z = o.z; } }
        if (A.npc && A.npc.m) { const dx = P.x - A.npc.x, dz = P.z - A.npc.z, d = Math.hypot(dx, dz); if (d < 0.55 && d > 0.001) { P.x += dx / d * (0.55 - d); P.z += dz / d * (0.55 - d); } }
        // footsteps
        if (P.moving) { P.run += dt * spd * 3.2; P.stepT -= dt; if (P.stepT <= 0) { P.stepT = P.low ? 0.5 : P.box ? 0.35 : 0.28; if (!P.low && !P.box) { SFX.step(A.f2[(P.z | 0) * A.w + (P.x | 0)] === 1 && !A.def.out); if (A.def.out && A.def.floor === 'snow' && A.f2[(P.z | 0) * A.w + (P.x | 0)] === 0) print(); } else if (P.low) SFX.crawl(); } }
        // knock on the wall you are against (or right in front of you)
        const front = tileAt(P.x + Math.sin(P.a) * 0.38, P.z + Math.cos(P.a) * 0.38);
        const nearWall = P.wall || (!P.low && !P.box && (front === WA || front === CR));
        if (nearWall && !P.prompt) P.prompt = 'b:KNOCK';
        // the action button: a power switch, the scientist, or a knock
        const br = A.breakers.find(b => !b.on && Math.hypot(b.x - P.x, b.z - P.z) < 0.8);
        if (br) P.prompt = 'b:PULL THE SWITCH';
        if (K.pressed('b')) {
          if (br && !P.box) { P.pullT = 1.0; P.pullB = br; P.wall = null; P.low = false; SFX.lever(); }
          else if (nearWall && !P.box) knock();
        }
        // a snooze dart
        if (K.pressed('x')) {
          if (P.box) toast("YOU CAN'T AIM FROM INSIDE A BOX!");
          else if (S.darts <= 0) { toast('OUT OF SNOOZE DARTS'); tick(200, 0.05, 0.05); }
          else if (P.dartT <= 0) {
            S.darts--; P.dartT = 0.45; SFX.dart();
            // a little help with the aim (a D-pad only faces eight ways): a guard roughly in front gets the dart
            let aim = P.a, best = 0.4;
            for (const g of A.guards) { if (g.st === 'sleep') continue; const d = Math.hypot(g.x - P.x, g.z - P.z); if (d > 8.5) continue; const lead = d / 14 * (g.speed || 0), gx = g.x + Math.sin(g.a) * lead, gz = g.z + Math.cos(g.a) * lead; const want = Math.atan2(gx - P.x, gz - P.z), off = Math.abs(angDiff(P.a, want)); if (off < best && los(P.x, P.z, g.x, g.z, false)) { best = off; aim = want; } }
            const sx = Math.sin(aim), sz = Math.cos(aim);
            shot('dart', P.x + sx * 0.25, P.low ? 0.2 : 0.45, P.z + sz * 0.25, sx * 14, 0, sz * 14);
          }
        }
      }
      function knock() {
        const n = P.wall || { x: -Math.sin(P.a), z: -Math.cos(P.a) };
        SFX.knock(); ring(P.x - n.x * 0.3, P.z - n.z * 0.3);
        for (const g of A.guards) {
          if (g.st === 'sleep' || g.st === 'wake' || g.st === 'chase' || g.st === 'stare') continue;
          const d = Math.hypot(g.x - P.x, g.z - P.z); if (d > 7.5) continue;
          g.st = 'hear'; g.t = 0.8; g.tgt = { x: P.x, z: P.z }; g.path = null; setIcon(g, '?', 1.5); if (phase === 'normal') SFX.huh();
        }
      }
      const rings = []; function ring(x, z) { rings.push({ x, z, t: 0 }); }
      function print() {
        const f = foot[footI++ % foot.length]; f.visible = true; const side = (footI % 2 ? 1 : -1) * 0.08;
        f.position.set(P.x + Math.cos(P.a) * side, 0.025, P.z - Math.sin(P.a) * side); f.rotation.z = P.a + Math.PI; if (f.parent !== A.root) A.root.add(f);
      }

      // ================================================================ the guards
      function setIcon(g, s, t) { g.icon = s; g.iconT = t || 1.5; }
      function canSee(g) {
        if (P.dead || mode !== 'play') return 0;
        const dx = P.x - g.x, dz = P.z - g.z, d = Math.hypot(dx, dz);
        if (hidden()) return 0;
        if (d < 0.85 && !P.box) return 3;
        const range = (phase === 'normal' ? 6.2 : 7.5) * (P.low ? 0.62 : 1);
        if (d > range) return 0;
        const half = phase === 'alert' ? 1.1 : 0.68;
        if (Math.abs(angDiff(g.a + g.head, Math.atan2(dx, dz))) > half) return 0;
        if (!los(g.x, g.z, P.x, P.z, P.low)) return 0;
        return 1 + (1 - d / range) * 2.2;
      }
      function goTo(g, x, z) { g.path = findPath(g.x, g.z, x, z); g.pi = 0; }
      function follow(g, spd, dt) {
        if (!g.path || g.pi >= g.path.length) return true;
        const [tx, tz] = g.path[g.pi], dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz);
        if (d < 0.08) { g.pi++; return g.pi >= g.path.length; }
        const s = Math.min(d, spd * dt); g.x += dx / d * s; g.z += dz / d * s; g.speed = spd;
        g.a += angDiff(g.a, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
        return false;
      }
      function goReturn(g) { g.st = 'return'; const n = g.route[g.ri]; goTo(g, n[0], n[1]); }
      function guardUpdate(g, dt) {
        g.speed = 0; if (g.iconT > 0) { g.iconT -= dt; if (g.iconT <= 0) g.icon = ''; } if (g.stared > 0) g.stared -= dt;
        if (g.st === 'sleep') { g.sleepT -= dt; g.zt = (g.zt || 0) - dt; if (g.zt <= 0) { g.zt = 1.6; if (Math.hypot(g.x - P.x, g.z - P.z) < 6) SFX.snore(); } if (g.sleepT <= 0) { g.st = 'wake'; g.t = 1.8; setIcon(g, '?', 1.8); } return; }
        if (g.st === 'wake') { g.t -= dt; if (g.t <= 0) { if (phase === 'normal') goReturn(g); else { g.st = phase === 'alert' ? 'chase' : 'search'; g.tgt = null; g.path = null; } } return; }
        const see = canSee(g);
        if (see) { g.lastSeenT = 0; g.last = { x: P.x, z: P.z }; } else g.lastSeenT += dt;
        // ---- not on alert: getting suspicious
        if (phase !== 'alert' && g.st !== 'stare') {
          if (see) {
            if (phase === 'evasion' && !(P.box && P.still > 0.5)) { raiseAlert(g); return; }
            if (P.box) {
              if (P.still > 0.4) { const d = Math.hypot(P.x - g.x, P.z - g.z); if (d < 2.4 && g.stared <= 0 && (g.st === 'patrol' || g.st === 'look' || g.st === 'return')) { g.prev = g.st; g.st = 'stare'; g.t = 2.8; setIcon(g, '?', 2.6); SFX.huh(); g.path = null; return; } }
              else g.sus += dt * 0.32 * see;
            } else g.sus += dt * see * (P.low ? 0.75 : 1.25) * (Math.hypot(P.x - g.x, P.z - g.z) < 2 ? 3 : 1);
            if (g.sus > 0.2 && g.st !== 'notice') { g.st = 'notice'; g.t = 0; setIcon(g, '?', 2); SFX.huh(); g.path = null; }
            if (g.sus >= 1) { raiseAlert(g); return; }
          } else g.sus = Math.max(0, g.sus - dt * 0.18);
        }
        switch (g.st) {
          case 'patrol': {
            const n = g.route[g.ri];
            if (!g.path) goTo(g, n[0], n[1]);
            if (follow(g, 1.45, dt)) { g.path = null; if (n[2] > 0) { g.st = 'look'; g.t = n[2]; } else g.ri = (g.ri + 1) % g.route.length; }
            g.head *= 0.9; break;
          }
          case 'look': {
            const n = g.route[g.ri]; g.t -= dt;
            if (n[3] != null) g.a += angDiff(g.a, n[3]) * Math.min(1, dt * 4);
            g.head = Math.sin(K.t * 1.25 + g.id * 2) * 0.95;
            if (g.t <= 0) { if (g.route.length > 1) { g.ri = (g.ri + 1) % g.route.length; g.st = 'patrol'; } else g.t = 99; }
            break;
          }
          case 'notice': {
            g.t += dt; g.head *= 0.85;
            if (g.last) g.a += angDiff(g.a, Math.atan2(g.last.x - g.x, g.last.z - g.z)) * Math.min(1, dt * 5);
            if (!see && (g.lastSeenT > 1.1 || g.sus < 0.05)) { g.st = 'investigate'; g.tgt = g.last || { x: g.x, z: g.z }; goTo(g, g.tgt.x, g.tgt.z); }
            break;
          }
          case 'hear': {
            g.t -= dt; g.head *= 0.85; if (g.tgt) g.a += angDiff(g.a, Math.atan2(g.tgt.x - g.x, g.tgt.z - g.z)) * Math.min(1, dt * 6);
            if (g.t <= 0) { g.st = 'investigate'; goTo(g, g.tgt.x, g.tgt.z); }
            break;
          }
          case 'investigate': { if (follow(g, 1.9, dt)) { g.st = 'lookaround'; g.t = 3.2; g.path = null; } g.head *= 0.9; break; }
          case 'lookaround': { g.t -= dt; g.head = Math.sin(K.t * 2.6 + g.id) * 1.15; if (g.t <= 0) { g.head = 0; goReturn(g); g.sus = 0; } break; }
          case 'return': { if (follow(g, 1.45, dt)) { g.path = null; g.st = g.post ? 'look' : 'patrol'; if (g.post) g.t = 99; } g.head *= 0.9; break; }
          case 'stare': {
            g.t -= dt; g.head *= 0.8; g.a += angDiff(g.a, Math.atan2(P.x - g.x, P.z - g.z)) * Math.min(1, dt * 5);
            if (!P.box || P.moving) { if (canSee(g)) { g.sus = 1; raiseAlert(g); return; } }
            if (g.t <= 0) {
              g.stared = 14; setIcon(g, '...', 1.6); g.st = g.prev === 'look' ? 'look' : g.prev || 'patrol'; if (g.st === 'look') g.t = Math.max(g.t, 1.2);
              if (P.box && Math.hypot(P.x - g.x, P.z - g.z) < 2.6 && phase === 'normal') { say(g, 'JUST A BOX.'); K.secret('lk.sneak.box'); }
            }
            break;
          }
          case 'chase': {
            if (see) { alertPos = { x: P.x, z: P.z }; }
            const tg = alertPos || g.last || { x: g.x, z: g.z }, d = Math.hypot(P.x - g.x, P.z - g.z);
            if (!g.tgt || Math.hypot(g.tgt.x - tg.x, g.tgt.z - tg.z) > 0.9 || !g.path) { g.tgt = { x: tg.x, z: tg.z }; goTo(g, tg.x, tg.z); }
            g.throwT -= dt; g.tackT -= dt;
            if (see && d < 7 && d > 1.4 && g.throwT <= 0) { g.throwT = 1.3 + R() * 0.6; g.wind = 0.35; }
            if (g.wind > 0) { g.wind -= dt; g.a += angDiff(g.a, Math.atan2(P.x - g.x, P.z - g.z)) * Math.min(1, dt * 10); if (g.wind <= 0) throwBall(g); }
            else if (see && d < 1.4) { g.a += angDiff(g.a, Math.atan2(P.x - g.x, P.z - g.z)) * Math.min(1, dt * 10); const dx = P.x - g.x, dz = P.z - g.z; if (d > 0.6) { g.x += dx / d * 2.8 * dt; g.z += dz / d * 2.8 * dt; g.speed = 2.8; } else if (g.tackT <= 0) { g.tackT = 1.2; hurt(18, g.x, g.z, 'BONK!'); } }
            else if (follow(g, 2.7, dt)) { g.head = Math.sin(K.t * 3 + g.id) * 1.0; }
            break;
          }
          case 'search': {
            if (!g.path || g.pi >= g.path.length) {
              g.t -= dt; g.head = Math.sin(K.t * 2.2 + g.id) * 1.1;
              if (g.t <= 0) { const b = g.last || alertPos || { x: g.x, z: g.z }; let tx = b.x, tz = b.z; for (let k = 0; k < 12; k++) { const x = b.x + (R() - 0.5) * 9, z = b.z + (R() - 0.5) * 9; if (walkG(tileAt(x, z))) { tx = (x | 0) + 0.5; tz = (z | 0) + 0.5; break; } } goTo(g, tx, tz); g.t = 1.6; }
            } else follow(g, 1.9, dt);
            break;
          }
        }
      }
      function throwBall(g) {
        const dx = P.x - g.x, dz = P.z - g.z, d = Math.hypot(dx, dz) || 1, T = d / 8;
        const lx = P.x + (P.moving ? Math.sin(P.a) * 0.6 : 0), lz = P.z + (P.moving ? Math.cos(P.a) * 0.6 : 0);
        shot('snow', g.x + Math.sin(g.a) * 0.3, 1.0, g.z + Math.cos(g.a) * 0.3, (lx - g.x) / T, 13 * T / 2 - 0.6 / T, (lz - g.z) / T);
        SFX.throw(); g.armT = 0.3;
      }
      function sleepGuard(g) {
        g.st = 'sleep'; g.sleepT = 26; g.icon = 'z'; g.iconT = 99; g.sus = 0; g.path = null; g.zt = 0.8; S.st.naps++; SFX.thup();
        burst(g.x, 1.0, g.z, 0xffe080, 8, 2.5, 2.5);
        if (phase === 'normal' && Math.hypot(g.x - P.x, g.z - P.z) > 3) toast('SNOOZE!', 1.2);
      }
      const speech = []; function say(g, s) { speech.push({ g, s, t: 2.2 }); }
      function raiseAlert(g) {
        if (phase !== 'alert') {
          if (phase === 'normal') { S.st.alerts++; if (CK) { CK.st = copy(S.st); persist(); } }
          phase = 'alert'; K.music(SONGS.alert); SFX.bang(); bang = 0.8; flash = 0.3; flashCol = '255,60,40';
          for (const q of A.guards) if (q.st !== 'sleep' && q.st !== 'wake') { q.st = 'chase'; q.path = null; q.tgt = null; q.throwT = 0.6 + R(); q.wind = 0; if (q !== g) setIcon(q, '!', 1.1); }
        }
        alertT = 9; alertPos = { x: P.x, z: P.z };
        if (g) { setIcon(g, '!', 1.4); g.st = g.st === 'sleep' ? 'sleep' : 'chase'; }
        if (P.box) { P.still = 0; }
      }
      function phaseUpdate(dt) {
        if (phase === 'alert') {
          let seen = false;
          for (const g of A.guards) if (g.st === 'chase' && g.lastSeenT < 0.1) seen = true;
          for (const c of A.cams) if (c.seeing) seen = true;
          if (A.rex && A.rex.seeing) seen = true;
          if (seen) alertT = 9; else alertT -= dt;
          if (alertT <= 0) { phase = 'evasion'; evT = 15; K.music(SONGS.evasion); for (const g of A.guards) if (g.st === 'chase') { g.st = 'search'; g.path = null; g.t = 0; } }
        } else if (phase === 'evasion') {
          evT -= dt;
          if (evT <= 0) { phase = 'normal'; K.music(SONGS[A.def.song]); for (const g of A.guards) if (g.st === 'search' || g.st === 'chase') { g.sus = 0; goReturn(g); } toast('ALL CLEAR...', 1.6); }
        }
      }

      // ================================================================ cameras, lasers, searchlights, steam, doors, items
      function hazards(dt) {
        const t = K.t;
        for (const c of A.cams) {
          c.a = c.base + Math.sin((t / c.per + c.ph) * Math.PI * 2) * c.sw; c.head.rotation.y = c.a - c.base + (c.base === Math.PI ? Math.PI : 0); c.fan.rotation.y = c.a;
          c.seeing = false;
          const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz);
          if (!P.dead && !hidden() && d < c.range && Math.abs(angDiff(c.a, Math.atan2(dx, dz))) < 0.42 && !(P.box && P.still > 0.4) && los(c.x, c.z + (c.base === Math.PI ? -0.1 : 0.1), P.x, P.z, P.low)) {
            c.seeing = true; c.sus += dt * (P.box ? 0.6 : 2.6);
            if (c.sus >= 1 && phase !== 'alert') { raiseAlert(null); SFX.alarm(); toast('THE CAMERA SPOTTED YOU!'); }
            if (phase === 'alert') alertPos = { x: P.x, z: P.z };
          } else c.sus = Math.max(0, c.sus - dt * 0.6);
          c.led.material = (phase === 'alert' || c.sus > 0.1) ? ((t * 8 | 0) % 2 ? MT.camLed : MT.ledG) : MT.camLed;
          c.fan.material.opacity = 0.1 + c.sus * 0.2;
        }
        for (const L of A.lasers) {
          let on = true, warn = false;
          if (L.blink) { const cyc = L.blink[0] + L.blink[1], p = (t + L.ph) % cyc; on = p < L.blink[0]; warn = !on && p > cyc - 0.35; }
          L.on = on; L.m.visible = on || (warn && (t * 20 | 0) % 2 === 0); L.m.scale.x = L.m.scale.y = 0.035 + Math.sin(t * 30) * 0.008; for (const e of L.ends) e.visible = on;
          L.cool = (L.cool || 0) - dt;
          if (on && !P.dead && Math.abs(P.x - L.x) < 0.24 && P.z > L.z0 && P.z < L.z1 && (L.hi ? !P.low : true) && L.cool <= 0) {
            L.cool = 2.5; SFX.alarm(); toast('YOU TRIPPED A LASER!'); raiseAlert(null); burst(P.x, L.y, P.z, 0xff4040, 8, 2, 1, 0);
          }
        }
        for (const s of A.spots) {
          if (phase === 'alert' && alertPos) { const dx = alertPos.x - s.x, dz = alertPos.z - s.z, d = Math.hypot(dx, dz); if (d > 0.05) { s.x += dx / d * Math.min(d, 3.2 * dt); s.z += dz / d * Math.min(d, 3.2 * dt); } }
          else { const k = (1 - Math.cos(((t / s.per) + s.ph) * Math.PI * 2)) / 2, tx = lerp(s.a[0], s.b[0], k), tz = lerp(s.a[1], s.b[1], k); s.x = lerp(s.x, tx, Math.min(1, dt * 2)); s.z = lerp(s.z, tz, Math.min(1, dt * 2)); }
          s.disc.position.set(s.x, 0.05, s.z);
          const dx = s.x - s.fx, dz = s.z - s.fz, len = Math.hypot(dx, dz, 5.4); s.beam.position.set(s.fx, 5.4, s.fz); s.beam.lookAt(s.x, 0, s.z); s.beam.scale.set(1.5, 1.5, len);
          if (!P.dead && !hidden() && Math.hypot(P.x - s.x, P.z - s.z) < 1.55 && !(P.box && P.still > 0.4)) {
            s.track += dt * 2.4; if (phase === 'alert') alertPos = { x: P.x, z: P.z };
            if (s.track >= 1 && phase !== 'alert') { raiseAlert(null); SFX.alarm(); toast('CAUGHT IN THE SEARCHLIGHT!'); }
          } else s.track = Math.max(0, s.track - dt);
        }
        for (const s of A.steams) {
          const p = (t + s.ph) % 3.2, on = p < 1.0, warn = p > 2.5;
          if (on && !s.on) { if (Math.hypot(P.x - s.x, P.z - s.z) < 5) SFX.steam(); }
          s.on = on;
          s.puffs.forEach((m, i) => { const q = on ? (p * 1.6 + i * 0.25) % 1 : 0; m.material.opacity = on ? 0.75 * (1 - q) : warn ? 0.12 : 0; m.position.y = 0.1 + q * 0.9; const sc = 0.4 + q * 0.9; m.scale.set(sc, sc, 1); m.rotation.z = i + t; });
          if (on && Math.hypot(P.x - s.x, P.z - s.z) < 0.5) hurt(8, s.x + (P.x - s.x) * 0.5 - 0.01, s.z - 0.3, 'OUCH! HOT STEAM!');
        }
        // doors open for you (with the right card) and for the guards
        for (const d of A.doors) {
          const pd = Math.hypot(P.x - d.cx, P.z - d.cz), ok = S.cards >= d.lvl;
          let want = (pd < 1.6 && ok && !P.dead) || A.guards.some(g => g.st !== 'sleep' && Math.hypot(g.x - d.cx, g.z - d.cz) < 1.5);
          if (pd < 1.3 && !ok && !d.told) { d.told = 2; toast('THIS DOOR NEEDS A LEVEL ' + d.lvl + ' CARD'); tick(180, 0.15, 0.06); }
          if (d.told > 0 && pd > 2) d.told = 0;
          const o0 = d.open; d.open = clamp(d.open + (want ? dt * 3 : -dt * 2.2), 0, 1);
          if ((o0 === 0 && d.open > 0) || (o0 === 1 && d.open < 1)) if (pd < 8) SFX.door();
          for (let i = 0; i < 2; i++) d.panels[i].position.x = (i ? 1 : -1) * (d.half / 2 + d.open * d.half * 0.95);
          d.led.material = ok ? MT.ledG : MT.ledR;
        }
        // footprint rings for knocks
        for (let i = rings.length - 1; i >= 0; i--) { rings[i].t += dt; if (rings[i].t > 0.6) rings.splice(i, 1); }
      }
      function items(dt) {
        for (const it of A.items) {
          if (it.got) continue;
          it.g.rotation.y += dt * 2; it.g.position.y = (it.k === 'k' && A.def.on && A.def.on.k === '=' ? 0.2 : 0.35) + Math.sin(K.t * 3 + it.x) * 0.05;
          if (Math.hypot(P.x - it.x, P.z - it.z) < 0.55 && !P.dead) {
            if (it.k === 'r' && S.rations >= 3) { if (!it.told) { toast('RATIONS FULL (3)'); it.told = 1; } continue; }
            it.got = true; it.g.visible = false; S.taken[it.id] = 1;
            if (it.k === 'r') { S.rations++; toast('RATION (A CHEESE AND PICKLE SANDWICH)', 2.2); SFX.get(); }
            if (it.k === 'a') { S.darts = Math.min(12, S.darts + 4); toast('+4 SNOOZE DARTS'); SFX.get(); }
            if (it.k === 'k') { S.cards = Math.max(S.cards, A.def.card); toast('GOT THE LEVEL ' + A.def.card + ' KEYCARD!', 2.4); SFX.card(); }
            if (it.k === 's') { S.seeds[A.i] = 1; toast('GOLDEN SUNFLOWER SEED! (' + Object.keys(S.seeds).length + '/6)', 2.4); SFX.card(); }
            if (it.k === 'p') { SFX.card(); win(); }
            burst(it.x, 0.5, it.z, 0xffffa0, 10, 2.5, 2.5);
          }
        }
        if (A.npc && A.npc.m && !S.otter && Math.hypot(P.x - A.npc.x, P.z - A.npc.z) < 2.2 && phase === 'normal') { S.otter = 1; codec('otter', () => { S.cards = Math.max(S.cards, 3); toast('GOT THE LEVEL 3 KEYCARD!', 2.4); SFX.card(); }); }
        const k = (P.x | 0) + ',' + (P.z | 0);
        if (A.talk[k] && !S.calls[A.talk[k]]) { S.calls[A.talk[k]] = 1; captions = EAVES[A.talk[k]].slice(); capT = 3; }
      }
      function shotsUpdate(dt) {
        for (const s of shots) {
          if (!s.on) continue;
          s.t += dt; s.x += s.vx * dt; s.z += s.vz * dt;
          if (s.k === 'snow') s.vy -= 13 * dt; s.y += s.vy * dt;
          s.m.position.set(s.x, s.y, s.z);
          let done = s.t > 2.2;
          if (s.k === 'dart') {
            for (const g of A.guards) if (g.st !== 'sleep' && Math.hypot(g.x - s.x, g.z - s.z) < 0.42) { sleepGuard(g); done = true; break; }
            if (!done && opaque(s.x, s.z, s.y < 0.5)) { done = true; burst(s.x - s.vx * 0.02, s.y, s.z - s.vz * 0.02, 0xffe080, 4, 2, 1); tick(1400, 0.04, 0.04); }
            if (s.t > 0.8) done = true;
          } else {
            if (!P.dead && Math.hypot(P.x - s.x, P.z - s.z) < 0.38 && s.y < 1.0) { hurt(s.k === 'snow' ? 12 : 13, s.x - s.vx, s.z - s.vz, s.k === 'snow' ? 'SPLAT! A SNOWBALL!' : null); done = true; burst(s.x, s.y, s.z, s.k === 'snow' ? 0xffffff : 0xffa040, 8, 3, 2); if (s.k === 'snow') SFX.splat(); }
            else if (s.y < 0.05 || opaque(s.x, s.z, false)) { done = true; burst(s.x, Math.max(0.1, s.y), s.z, s.k === 'snow' ? 0xf0f4ff : 0xffa040, 6, 2.5, 1.5); if (s.k === 'snow') SFX.splat(); }
          }
          if (done) { s.on = false; s.m.visible = false; }
        }
      }

      // ================================================================ WHEEL REX
      const REXWP = [[13, 7.2], [17.6, 10.5], [13, 13.8], [8.4, 10.5]];
      function rexSees() {
        const X = A.rex; if (P.dead || X.st === 'down' || X.st === 'stagger') return false;
        const dx = P.x - X.x, dz = P.z - X.z, d = Math.hypot(dx, dz);
        if (d > 11.5 || d < 1.2) return d < 1.2 && X.st !== 'down';
        if (Math.abs(angDiff(X.eye, Math.atan2(dx, dz))) > 0.24 + (X.st === 'alert' ? 0.12 : 0)) return false;
        return los(X.x, X.z, P.x, P.z, false);
      }
      function rexUpdate(dt) {
        const X = A.rex; if (!X) return;
        X.t += dt; const m = X.m;
        if (X.st === 'down') {
          X.down += dt; m.wheel.rotation.z += dt * Math.max(0, 2 - X.down) * 0.6; m.body.position.y = -Math.min(0.9, X.down * 0.4); m.body.rotation.z = Math.min(0.12, X.down * 0.05);
          m.eye.visible = X.down < 1.5 ? (X.t * 14 | 0) % 2 === 0 : false; m.beam.visible = false; m.spot.visible = false;
          if (X.down < 2.5 && R() < 0.3) burst(X.x + (R() - 0.5) * 2.5, 2 + R() * 2, X.z + (R() - 0.5) * 2, R() < 0.5 ? 0xffe060 : 0xffffff, 2, 3, 3);
          if (X.down > 2.2 && !X.dropped) { X.dropped = true; const it = { k: 'p', x: X.px, z: X.pz, id: 'plans' }; it.g = makeItem('p'); it.g.position.set(it.x, 0.35, it.z); A.root.add(it.g); A.items.push(it); toast('THE PLANS FELL OUT!', 2.5); SFX.get(); burst(it.x, 1, it.z, 0x80b0ff, 14, 3, 4); }
          return;
        }
        X.seeing = false;
        const spd = [0.42, 0.6, 0.78][X.phase];
        if (X.st === 'stagger') { X.t2 -= dt; X.eye += dt * 6; shake = Math.max(shake, 0.08); if (R() < 0.25) burst(X.x + (R() - 0.5) * 2, 3 + R(), X.z + (R() - 0.5) * 2, 0xffe060, 2, 3, 3); if (X.t2 <= 0) { X.st = 'scan'; X.sus = 0; } }
        else if (X.st === 'scan') { if (X.phase > 0) { X.revT -= dt; if (X.revT <= 0) { X.dir *= -1; X.revT = 2.5 + R() * 3.5; } } X.eye += X.dir * spd * dt; }
        else if (X.st === 'alert') { X.eye += clamp(angDiff(X.eye, Math.atan2(P.x - X.x, P.z - X.z)), -1.7 * dt, 1.7 * dt); }
        // walking about once two switches are off
        if (X.phase >= 2 && X.st !== 'stagger') {
          const [tx, tz] = REXWP[X.wp], dx = tx - X.x, dz = tz - X.z, d = Math.hypot(dx, dz);
          if (d < 0.1) { X.wp = (X.wp + 1) % REXWP.length; }
          else { const s = Math.min(d, 0.85 * dt); X.x += dx / d * s; X.z += dz / d * s; X.a += angDiff(X.a, Math.atan2(dx, dz)) * Math.min(1, dt * 2); X.step += dt * 2.6; if ((X.step % Math.PI) < 2.6 * dt) { SFX.stomp(); shake = Math.max(shake, 0.12); } }
        }
        const sees = rexSees();
        if (sees) {
          X.seeing = true; alertPos = { x: P.x, z: P.z };
          if (X.st === 'scan') { X.sus += dt * 3.2; if (X.sus >= 1) { X.st = 'alert'; X.fireT = 0.6; raiseAlert(null); toast('WHEEL REX SPOTTED YOU!'); } }
          X.seenT = 0;
        } else { X.sus = Math.max(0, X.sus - dt * 0.8); X.seenT += dt; if (X.st === 'alert' && X.seenT > 4) { X.st = 'scan'; X.sus = 0; X.dir = R() < 0.5 ? 1 : -1; } }
        if (X.st === 'alert') {
          X.fireT -= dt;
          if (X.fireT <= 0 && X.seenT < 0.5) { X.fireT = 1.15; X.burst = 3; X.bT = 0; }
          if (X.burst > 0) { X.bT -= dt; if (X.bT <= 0) { X.bT = 0.16; X.burst--; const hx = X.x + Math.sin(X.eye) * 1.2, hz = X.z + Math.cos(X.eye) * 1.2, dx = P.x - hx, dz = P.z - hz, d = Math.hypot(dx, dz) || 1; shot('pellet', hx, 1.2, hz, dx / d * 7.5, -0.6, dz / d * 7.5); tick(520, 0.06, 0.07, 'square', 260); } }
        }
        // touching his feet hurts
        const pd = Math.hypot(P.x - X.x, P.z - X.z);
        if (pd < 1.5 && pd > 0.001) { const o = { x: P.x, z: P.z }; moveCircle(o, (P.x - X.x) / pd * (1.5 - pd), (P.z - X.z) / pd * (1.5 - pd), 0.24, solidP); P.x = o.x; P.z = o.z; if (X.phase >= 2) hurt(10, X.x, X.z, 'STOMPED!'); }
        // the look of him
        m.root.position.set(X.x, 0, X.z); m.root.rotation.y = X.a; m.sh.position.set(X.x, 0.03, X.z);
        m.head.rotation.y = angDiff(X.a, X.eye); m.wheel.rotation.z += dt * (X.st === 'alert' ? 5 : 1.6);
        const walk = X.phase >= 2 && X.st !== 'stagger';
        m.legs.forEach((l, i) => { const s = Math.sin(X.step + i * Math.PI) * (walk ? 0.35 : 0.03 * Math.sin(X.t * 2)); l.hip.rotation.x = s; l.kn.rotation.x = 0.7 + Math.max(0, -s) * 0.6; });
        m.body.position.y = walk ? Math.abs(Math.sin(X.step)) * 0.08 : Math.sin(X.t * 2) * 0.03;
        const hx = X.x + Math.sin(X.eye) * 0.9, hz = X.z + Math.cos(X.eye) * 0.9, len = rayLen(X.x, X.z, X.eye, 11.5);
        m.beam.visible = true; m.beam.position.set(hx, 2.85, hz); m.beam.lookAt(X.x + Math.sin(X.eye) * len, 0.1, X.z + Math.cos(X.eye) * len); m.beam.scale.set(len * 0.24, len * 0.24, Math.hypot(len - 0.9, 2.8));
        m.spot.visible = true; m.spot.position.set(X.x + Math.sin(X.eye) * (len - 0.4), 0.06, X.z + Math.cos(X.eye) * (len - 0.4)); m.spot.scale.setScalar(0.5 + len * 0.1);
        FX.rexBeam.opacity = X.st === 'alert' ? 0.32 : 0.16 + X.sus * 0.15; m.eye.material = X.st === 'alert' && (X.t * 10 | 0) % 2 ? MT.lampHead : MT.rexEye;
      }
      function flipBreaker(b) {
        b.on = true; P.pullB = null; b.lev.rotation.x = 0.7; b.led.material = MT.ledG; b.glow.visible = false; SFX.lever(); shake = 0.3;
        burst(b.x - b.dx * 0.3, 1.1, b.z - b.dz * 0.3, 0xffe060, 14, 3, 3);
        const n = A.breakers.filter(q => q.on).length, X = A.rex;
        toast('POWER SWITCH ' + n + ' OF 3 OFF!', 2.2);
        if (n >= 3) { X.st = 'down'; X.down = 0; phase = 'normal'; K.music(null); K.sfx.tone(440, 2.5, 'sawtooth', 0.08, 0, 40); shake = 0.6; for (const s of shots) { s.on = false; s.m.visible = false; } X.px = clamp(X.x, 3, 22) + 0.01; X.pz = X.z + 2.4; if (!walkG(tileAt(X.px, X.pz))) X.pz = X.z - 2.4; }
        else { X.phase = n; X.st = 'stagger'; X.t2 = 1.8; K.sfx.tone(300, 0.8, 'sawtooth', 0.08, 0, 80); if (n === 2) toast('UH-OH. HE IS ON THE MOVE!', 2.4); }
      }

      // ================================================================ moving between areas, checkpoints
      function enterArea(ai, first) {
        S.area = ai; buildArea(ai);
        for (const it of A.items) if (S.taken[it.id]) { it.got = true; it.g.visible = false; }
        P.x = A.P[0]; P.z = A.P[1]; P.a = Math.PI; P.low = !!A.def.duct; P.box = false; P.wall = null; P.dead = 0; P.inv = 1; P.stun = 0; P.pullT = 0; P.still = 0; P.kx = P.kz = 0;
        phase = 'normal'; alertPos = null; bang = 0; for (const s of shots) { s.on = false; s.m.visible = false; } captions = []; speech.length = 0;
        CK = copy(S); persist(); saveT = 2.6; cardT = 4;
        K.music(SONGS[A.def.song]); camSnap = true;
        if (!S.calls[A.def.call]) { S.calls[A.def.call] = 1; CK.calls[A.def.call] = 1; persist(); pendingCall = A.def.call; pendingT = first ? 0.6 : 1.4; }
        if (ai === 0 && first) tutT = 14;
      }
      let pendingCall = null, pendingT = 0, camSnap = true;
      function exits(dt) {
        if (fadeT > 0) return;
        const t = tileAt(P.x, P.z);
        if (t === EX && !P.dead) {
          if (phase === 'alert') { if (!P.exitTold) { toast("YOU CAN'T SLIP AWAY DURING AN ALERT!"); P.exitTold = 1; } return; }
          fadeT = 1.2; fadeTo = A.i + 1; if (A.def.objs && A.def.objs.some(o => o.t === 'lift')) SFX.lift(); else SFX.crawl();
        } else P.exitTold = 0;
      }
      function win() {
        mode = 'winfx'; winT = 0; K.music(null); phase = 'normal';
        K.sfx.seq([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]], { bpm: 200, vol: 0.1 });
      }

      // ================================================================ animating everybody
      let lowK = 0;
      function animGerbil(dt) {
        const g = G0, t = K.t, mv = P.moving ? 1 : 0, ph = P.run;
        g.root.position.set(P.x, 0, P.z); g.root.rotation.y = P.a; g.sh.position.set(P.x, 0.03, P.z);
        g.root.visible = !(P.inv > 0 && !P.dead && (P.inv * 14 | 0) % 2 === 1);
        g.box.visible = P.box; g.b.visible = !P.box;
        if (P.box) { g.box.position.y = mv ? Math.abs(Math.sin(ph * 1.3)) * 0.06 : 0; g.box.rotation.z = mv ? Math.sin(ph * 1.3) * 0.06 : 0; g.box.rotation.x = 0; g.sh.scale.set(1.1, 1.1, 1); return; }
        g.sh.scale.set(0.9, 0.9, 1);
        lowK = lerp(lowK, P.low ? 1 : 0, Math.min(1, dt * 12));
        const pull = P.pullT > 0, wall = !!P.wall && !P.low;
        g.b.rotation.set(lowK * 1.42 - (wall ? 0.12 : 0) - (pull ? 0.25 : 0), 0, 0);
        g.b.position.set(0, lowK * 0.12 + (P.low ? 0 : Math.abs(Math.sin(ph)) * 0.05 * mv), -lowK * 0.3 + (wall ? -0.06 : 0));
        if (P.dead) { g.b.rotation.z = Math.min(1.5, P.dead * 4); g.b.position.y = 0.05; g.b.position.x = Math.min(0.3, P.dead); }
        else g.b.rotation.z = 0;
        g.hd.rotation.x = -lowK * 1.15 + (P.low ? 0 : Math.sin(t * 2) * 0.03); g.hd.rotation.y = wall ? P.peek * 0.9 : 0;
        g.torso.scale.y = 0.4 + Math.sin(t * 3) * 0.008;
        g.legs.forEach((l, i) => { const s = i ? 1 : -1; l.rotation.x = P.low ? Math.sin(ph * 1.4 + i * Math.PI) * 0.6 * mv + 0.3 : Math.sin(ph + i * Math.PI) * 0.85 * mv; l.rotation.z = 0; });
        g.arms.forEach((a, i) => {
          const s = i ? 1 : -1;
          if (pull) { a.rotation.set(-2.2 + Math.sin(t * 20) * 0.1, 0, -s * 0.2); }
          else if (wall) { a.rotation.set(0.15, 0, s * 1.1); }
          else if (P.low) { a.rotation.set(-2.7 + Math.sin(ph * 1.4 + i * Math.PI) * 0.5 * mv, 0, s * 0.2); }
          else if (P.dartT > 0.25 && i === 1) { a.rotation.set(-1.55, 0, 0); }
          else a.rotation.set(-Math.sin(ph + i * Math.PI) * 0.75 * mv, 0, s * 0.08);
        });
        g.tails.forEach((tl, i) => { tl.rotation.x = -0.25 + Math.sin(t * (mv ? 16 : 5) + i) * (mv ? 0.22 : 0.08) - mv * 0.25; });
        g.tail[0].rotation.y = Math.sin(t * 2.2) * 0.35; g.tail[1].rotation.y = Math.sin(t * 2.2 - 0.6) * 0.35; g.tail[2].rotation.y = Math.sin(t * 2.2 - 1.2) * 0.4;
        g.tail[0].rotation.x = P.low ? -0.3 : 0.5;
      }
      function animGuard(g, dt) {
        const m = g.m, t = K.t; m.root.position.set(g.x, 0, g.z); m.root.rotation.y = g.a; m.sh.position.set(g.x, 0.03, g.z);
        g.run += dt * g.speed * 3.6; const mv = g.speed > 0 ? Math.min(1, g.speed / 1.4) : 0;
        const sleep = g.st === 'sleep', k = sleep ? 1 : g.st === 'wake' ? Math.max(0, g.t / 1.8) : 0;
        g.lk = lerp(g.lk || 0, k, Math.min(1, dt * 6));
        m.b.rotation.set(g.st === 'stare' ? 0.32 : g.st === 'chase' && mv ? 0.15 : 0, 0, g.lk * 1.45);
        m.b.position.set(g.lk * 0.5, g.lk * 0.2 + (g.icon === '!' && g.iconT > 0.9 ? Math.sin((1.4 - g.iconT) * 12) * 0.12 : 0), 0);
        m.hd.rotation.set(0, g.head, g.st === 'stare' ? 0.35 : sleep ? 0 : 0);
        m.legs.forEach((l, i) => { l.rotation.x = Math.sin(g.run + i * Math.PI) * 0.75 * mv; });
        m.arms.forEach((a, i) => { a.rotation.set(-Math.sin(g.run + i * Math.PI) * 0.55 * mv, 0, (i ? 1 : -1) * 0.12); });
        if (g.wind > 0) { m.arms[1].rotation.set(2.6, 0, 0.3); m.ball.visible = true; } else { m.ball.visible = false; if (g.armT > 0) { g.armT -= dt; m.arms[1].rotation.set(-1.4, 0, 0); } }
        if (sleep) { m.arms.forEach(a => a.rotation.set(-0.3, 0, 0)); m.legs.forEach(l => l.rotation.x = 0.2); }
        m.tail.rotation.y = Math.sin(t * 2 + g.id) * 0.4;
        m.vis.visible = !sleep && g.st !== 'wake' && mode === 'play';
        if (m.vis.visible) { const r = (phase === 'normal' ? 6.2 : 7.5) * (P.low ? 0.62 : 1); m.vis.scale.set(r, 1, r); m.vis.rotation.y = g.head; m.vis.position.y = 0.04 - m.root.position.y; }
      }

      // ================================================================ the camera
      const cam = T3.cam, camP = new T.Vector3(), camL = new T.Vector3(), tv = new T.Vector3(), camWL = new T.Vector3();
      function camUpdate(dt) {
        const D = A.def, hgt = D.duct ? 5.0 : D.boss ? 10.5 : 6.3, back = D.duct ? 2.7 : D.boss ? 6.8 : 4.2;
        let tx = P.x, tz = P.z;
        if (A.rex) { const X = A.rex, k = clamp(1 - Math.hypot(X.x - P.x, X.z - P.z) / 16, 0.2, 0.5); tx = lerp(P.x, X.x, k); tz = lerp(P.z, X.z - 1.2, k); }
        if (P.wall && Math.abs(P.peek) > 0.15) { const s = Math.sign(P.peek), q = Math.abs(P.peek); tx += -P.wall.z * s * 2.6 * q + P.wall.x * 1.2 * q; tz += P.wall.x * s * 2.6 * q + P.wall.z * 1.2 * q; }
        camWL.set(tx, 0, tz - 0.4);
        const want = new T.Vector3(tx, hgt, tz + back);
        if (camSnap) { camP.copy(want); camL.copy(camWL); camSnap = false; } else { camP.lerp(want, Math.min(1, dt * 4.5)); camL.lerp(camWL, Math.min(1, dt * 5)); }
        cam.position.copy(camP);
        if (shake > 0) { shake -= dt; cam.position.x += (R() - 0.5) * shake * 0.8; cam.position.y += (R() - 0.5) * shake * 0.5; }
        cam.lookAt(camL);
        snow.position.set(camL.x, 0, camL.z);
      }
      function proj(x, y, z) { tv.set(x, y, z).project(cam); return [(tv.x + 1) / 2 * W, (1 - tv.y) / 2 * HH, tv.z < 1]; }
      function snowStep(dt) {
        if (!snow.visible) return; const a = snowPos;
        for (let i = 0; i < SN; i++) { a[i * 3 + 1] -= dt * (0.9 + (i % 5) * 0.12); a[i * 3] += dt * (0.5 + Math.sin(K.t + i) * 0.25); if (a[i * 3 + 1] < 0) { a[i * 3 + 1] += 9; a[i * 3] = (R() - 0.5) * 20; a[i * 3 + 2] = (R() - 0.5) * 16; } if (a[i * 3] > 10) a[i * 3] -= 20; }
        snowGeo.attributes.position.needsUpdate = true;
      }

      // ================================================================ codec portraits (pixel art painted from code)
      const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      function blob(g, cx, cy, rx, ry, ramp, clip) {
        for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
          const nx = x / rx, ny = y / ry, q = nx * nx + ny * ny; if (q > 1) continue;
          if (clip && !clip(cx + x, cy + y)) continue;
          const nz = Math.sqrt(1 - q), l = clamp((nx * -0.5 + ny * -0.62 + nz * 0.62 + 0.25) / 1.2, 0, 0.999);
          const i = clamp(Math.floor(l * ramp.length + (B4[((cy + y) & 3) * 4 + ((cx + x) & 3)] / 16 - 0.5) * 0.9), 0, ramp.length - 1);
          px(g, ramp[i], cx + x, cy + y);
        }
      }
      function outline(c, col) {
        const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), a = d.data, w = c.width, h = c.height, o = [];
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (a[(y * w + x) * 4 + 3]) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h && a[(Y * w + X) * 4 + 3]) { o.push(x, y); break; } } }
        g.fillStyle = col; for (let i = 0; i < o.length; i += 2) g.fillRect(o[i], o[i + 1], 1, 1);
      }
      const RAMP = {
        fur: ['#3e2410', '#6a421e', '#956232', '#bc8648', '#d8a462', '#ecc68a'], fur2: ['#b08860', '#cca878', '#e2c496', '#f2dcb4', '#fff0d6'],
        pink: ['#9a4a58', '#c46a78', '#e2909a', '#f4b8c0'], suit: ['#10161e', '#1c2632', '#2a3a4c', '#3c5268', '#557090'], red: ['#4a080c', '#7e1418', '#b4242a', '#e04448', '#ff7a70'],
        olive: ['#1e2414', '#323c22', '#4a5832', '#647444', '#82925a'], white: ['#8a8a92', '#b0b2ba', '#d4d6dc', '#eef0f4', '#ffffff'], ginger: ['#6a2e0c', '#9a4818', '#c86a28', '#e48c40', '#f4ac60'],
        otter: ['#2a180c', '#4a2e18', '#6e4626', '#8e6038', '#ac7c4c'], coat: ['#7a8288', '#a6aeb4', '#ced4d8', '#eaeef0', '#ffffff'], brown: ['#2a1a10', '#4a3020', '#6a4a30', '#8a6440'],
      };
      function portrait(who, frame) { // frame: 0 still, 1 talking, 2 blink
        const c = document.createElement('canvas'); c.width = 64; c.height = 76; const g = c.getContext('2d');
        const eye = (x, y, big) => { if (frame === 2) { px(g, '#120a06', x - 3, y, 7, 2); return; } blob(g, x, y, big ? 4 : 3, big ? 5 : 4, ['#05060a', '#141820', '#20283a']); px(g, '#ffffff', x - 2, y - 3, 2, 2); px(g, '#9ab0d0', x + 1, y + 2); };
        if (who === 'G') {
          blob(g, 32, 76, 31, 17, RAMP.suit); px(g, '#557090', 18, 64, 28, 1); blob(g, 32, 62, 9, 5, RAMP.suit);
          px(g, '#24262a', 44, 30, 2, 28); px(g, '#24262a', 38, 56, 8, 2); blob(g, 37, 56, 2, 2, ['#202020', '#404040']);
          for (const s of [-1, 1]) { blob(g, 32 + s * 17, 17, 9, 11, RAMP.fur); blob(g, 32 + s * 17, 18, 5, 7, RAMP.pink); }
          blob(g, 32, 39, 20, 19, RAMP.fur);
          blob(g, 32, 50, 12, 8, RAMP.fur2);
          for (let x = 13; x <= 51; x++) for (let y = 23; y <= 28; y++) { const nx = (x - 32) / 20, ny = (y - 39) / 19; if (nx * nx + ny * ny > 1) continue; px(g, RAMP.red[clamp(3 - Math.abs(x - 28) / 7 | 0, 0, 4) - (y > 26 ? 1 : 0) < 0 ? 0 : clamp(3 - Math.abs(x - 28) / 7 | 0, 0, 4) - (y > 26 ? 1 : 0)], x, y); }
          for (let i = 0; i < 9; i++) { px(g, RAMP.red[2 + (i % 2)], 51 + i, 25 + i * 0.6 | 0, 2, 3); px(g, RAMP.red[1], 52 + i, 31 + i * 0.4 | 0, 2, 2); }
          eye(24, 37, 1); eye(40, 37, 1);
          px(g, '#3e2410', 19, 31, 9, 2); px(g, '#3e2410', 36, 31, 9, 2); px(g, '#3e2410', 26, 32, 2, 1); px(g, '#3e2410', 36, 32, 2, 1);
          blob(g, 32, 46, 3, 2, RAMP.pink);
          if (frame === 1) { blob(g, 32, 54, 4, 3, ['#2a0a0a', '#4a1414']); px(g, '#e2909a', 30, 55, 4, 1); } else { px(g, '#5a3418', 28, 53, 3, 1); px(g, '#5a3418', 31, 52, 2, 1); px(g, '#5a3418', 33, 53, 3, 1); }
          for (const s of [-1, 1]) for (let i = 0; i < 2; i++) for (let k = 0; k < 9; k++) px(g, '#fff6e0', 32 + s * (8 + k), 48 + i * 3 + (k > 5 ? s * 0 + 1 : 0));
        } else if (who === 'C') {
          blob(g, 32, 76, 31, 17, RAMP.olive); px(g, '#e8c040', 14, 66, 4, 3); px(g, '#c03030', 18, 66, 4, 3); px(g, '#3060c0', 22, 66, 4, 3); px(g, '#e8c040', 44, 63, 3, 10); blob(g, 32, 63, 6, 4, ['#a8a090', '#d8d0c0', '#f0ece0']);
          for (const s of [-1, 1]) blob(g, 32 + s * 21, 30, 6, 5, RAMP.ginger);
          blob(g, 32, 42, 24, 19, RAMP.white);
          blob(g, 32, 42, 24, 19, RAMP.ginger, (x, y) => x < 30 - (y - 42) * 0.3);
          blob(g, 32, 42, 24, 19, RAMP.brown, (x, y) => x > 46 && y < 42);
          eye(22, 39, 0); eye(42, 39, 0);
          px(g, '#f4f4f4', 17, 33, 9, 2); px(g, '#f4f4f4', 38, 33, 9, 2); px(g, '#c8c8c8', 17, 35, 9, 1); px(g, '#c8c8c8', 38, 35, 9, 1);
          blob(g, 32, 45, 3, 2, RAMP.pink);
          if (frame === 1) blob(g, 32, 55, 4, 3, ['#2a0a0a', '#4a1414']);
          const my = frame === 1 ? -1 : 0;
          for (const s of [-1, 1]) blob(g, 32 + s * 9, 50 + my, 10, 5, RAMP.white);
          blob(g, 32, 20, 25, 8, RAMP.olive); px(g, '#1e2414', 9, 24, 46, 3); blob(g, 32, 27, 21, 3, ['#08080a', '#18181c', '#2a2a30']);
          blob(g, 32, 19, 4, 4, ['#8a6a10', '#c8a020', '#f0d040', '#fff080']);
          blob(g, 9, 68, 7, 6, RAMP.white); px(g, '#3a60c0', 2, 64, 15, 2); px(g, '#d8d8e0', 16, 66, 3, 5); px(g, '#6a3a10', 4, 63, 10, 1);
          if (frame !== 2) { px(g, 'rgba(255,255,255,.7)', 7, 56, 1, 3); px(g, 'rgba(255,255,255,.7)', 8, 54, 1, 2); px(g, 'rgba(255,255,255,.7)', 11, 57, 1, 3); px(g, 'rgba(255,255,255,.7)', 10, 55, 1, 2); }
        } else {
          blob(g, 32, 76, 31, 17, RAMP.coat); px(g, '#7a8288', 31, 60, 2, 16); blob(g, 32, 62, 7, 4, ['#30508a', '#4a70b0']);
          for (const s of [-1, 1]) blob(g, 32 + s * 17, 24, 5, 5, RAMP.otter);
          blob(g, 32, 40, 19, 20, RAMP.otter);
          blob(g, 32, 50, 13, 9, RAMP.fur2);
          for (let i = 0; i < 5; i++) px(g, RAMP.otter[3], 24 + i * 3, 19 - (i % 2) * 2, 2, 4);
          eye(24, 38, 0); eye(40, 38, 0);
          for (const s of [-1, 1]) { g.strokeStyle = '#e8eef4'; g.lineWidth = 1; g.beginPath(); g.arc(32 + s * 8 + 0.5, 38.5, 7, 0, 7); g.stroke(); px(g, 'rgba(200,240,255,.35)', 32 + s * 8 - 5, 33, 4, 3); }
          px(g, '#e8eef4', 31, 37, 2, 1);
          blob(g, 32, 45, 4, 3, ['#100808', '#2a1a14', '#4a3028']);
          if (frame === 1) { blob(g, 32, 53, 4, 3, ['#2a0a0a', '#4a1414']); px(g, '#ffffff', 30, 51, 4, 3); } else { px(g, '#ffffff', 30, 50, 4, 3); px(g, '#4a2e18', 29, 53, 6, 1); }
          px(g, '#8ad8ff', 50, 30, 2, 3); px(g, '#c8f0ff', 50, 30, 1, 1); px(g, '#8ad8ff', 49, 33, 4, 2);
        }
        outline(c, '#06080a');
        return c;
      }
      const PORT = {}; for (const w of ['G', 'C', 'O']) PORT[w] = [0, 1, 2].map(f => portrait(w, f));
      const WHO = { G: ['SOLID GERBIL', ''], C: ['COL. CRUMPET', '142.07'], O: ['DR OTTERCON', '143.33'] };

      // ================================================================ the codec
      let cd = null;
      function codec(id, then) {
        const C = CALLS[id]; if (!C) { if (then) then(); return; }
        cd = { id, who: C.who, lines: C.lines.map(([w, s]) => [w, lab(s)]), i: 0, n: 0, open: 0, ring: id === 'otter' ? 0 : 0.9, then, rt: 0 };
      }
      function codecUpdate(dt) {
        if (cd.ring > 0) { cd.ring -= dt; cd.rt -= dt; if (cd.rt <= 0) { cd.rt = 0.3; K.sfx.tone(1480, 0.07, 'square', 0.07); K.sfx.tone(1480, 0.07, 'square', 0.07, 0.1); } if (cd.ring <= 0) K.sfx.tone(2200, 0.05, 'square', 0.06); return; }
        cd.open = Math.min(1, cd.open + dt * 3.5); if (cd.open < 1) return;
        const L = cd.lines[cd.i][1], n0 = cd.n | 0; cd.n = Math.min(L.length, cd.n + dt * 46);
        if ((cd.n | 0) !== n0 && (cd.n | 0) % 3 === 0 && L[cd.n | 0] !== ' ') K.sfx.tone(cd.lines[cd.i][0] === 'G' ? 700 : cd.lines[cd.i][0] === 'C' ? 520 : 900, 0.02, 'square', 0.025);
        if (K.pressed('start')) return endCodec();
        if (K.pressed('a') || K.pressed('b') || K.pressed('x')) { if (cd.n < L.length) cd.n = L.length; else { cd.i++; cd.n = 0; tick(1200, 0.03, 0.04); if (cd.i >= cd.lines.length) endCodec(); } }
      }
      function endCodec() { const f = cd && cd.then; cd = null; K.sfx.tone(1800, 0.05, 'square', 0.05, 0, 900); if (f) f(); }
      function wrap(s, n) { const out = []; let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; }
      function drawCodec() {
        const g = hud;
        if (cd.ring > 0) { if ((K.t * 6 | 0) % 2) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(W / 2 - 40, 98, 80, 22); g.strokeStyle = '#4af08a'; g.strokeRect(W / 2 - 39.5, 98.5, 79, 21); F.center(g, 'CALL', W / 2, 103, '#8affb0', 2); } return; }
        const k = cd.open;
        g.fillStyle = '#020806'; g.fillRect(0, 0, W, HH);
        g.save(); g.translate(0, HH / 2); g.scale(1, Math.max(0.02, k)); g.translate(0, -HH / 2);
        const gr = g.createLinearGradient(0, 0, 0, HH); gr.addColorStop(0, '#04160c'); gr.addColorStop(1, '#010604'); g.fillStyle = gr; g.fillRect(0, 0, W, HH);
        const [who] = cd.lines[Math.min(cd.i, cd.lines.length - 1)], talking = cd.n < cd.lines[Math.min(cd.i, cd.lines.length - 1)][1].length;
        const frame = (w) => { if (w === who && talking && (K.t * 9 | 0) % 2) return PORT[w][1]; if ((K.t * 0.7 + (w === 'G' ? 0.5 : 0)) % 4 < 0.12) return PORT[w][2]; return PORT[w][0]; };
        const box = (x, w) => {
          g.fillStyle = '#0a2416'; g.fillRect(x, 26, 72, 84);
          g.globalAlpha = w === who ? 1 : 0.55; g.drawImage(frame(w), x + 4, 32); g.globalAlpha = 1;
          g.fillStyle = 'rgba(40,255,120,.10)'; g.fillRect(x, 26, 72, 84);
          for (let y = 26; y < 110; y += 2) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, y, 72, 1); }
          g.strokeStyle = '#3ae07a'; g.lineWidth = 1; g.strokeRect(x - 0.5, 25.5, 73, 85);
          g.fillStyle = '#8affb0'; for (const [cx, cy] of [[x - 2, 24], [x + 69, 24], [x - 2, 107], [x + 69, 107]]) g.fillRect(cx, cy, 5, 5);
          F.center(g, WHO[w][0], x + 36, 114, w === who ? '#c8ffd8' : '#4a9a6a', 1);
        };
        box(20, cd.who); box(W - 92, 'G');
        // the middle: frequency and the signal bars
        const fq = WHO[cd.who][1];
        F.center(g, 'PTT', W / 2, 30, '#4a9a6a', 1);
        g.fillStyle = '#062012'; g.fillRect(W / 2 - 48, 44, 96, 26); g.strokeStyle = '#3ae07a'; g.strokeRect(W / 2 - 47.5, 44.5, 95, 25);
        F.center(g, fq, W / 2, 50, '#8affb0', 2, '#0a3a1a');
        for (let i = 0; i < 10; i++) { const on = talking ? (Math.sin(K.t * 18 + i * 1.7) + 1) * 5 > i * 0.8 : i < 2; g.fillStyle = on ? '#6aff9a' : '#0e3a20'; g.fillRect(W / 2 - 40 + i * 8, 86 - i * 1.4, 6, 4 + i * 1.4); }
        F.center(g, 'MEMORY', W / 2, 98, '#2a7a4a', 1);
        // the words
        g.fillStyle = '#031208'; g.fillRect(10, 128, W - 20, 104); g.strokeStyle = '#3ae07a'; g.strokeRect(10.5, 128.5, W - 21, 103);
        const [w2, s] = cd.lines[Math.min(cd.i, cd.lines.length - 1)];
        F.draw(g, WHO[w2][0], 20, 136, w2 === 'G' ? '#ffd890' : '#8affb0', 1);
        const lines = wrap(s.slice(0, cd.n | 0), 47);
        lines.slice(0, 6).forEach((l, i) => F.draw(g, l, 20, 150 + i * 12, '#e8fff0', 1));
        if (!talking && (K.t * 3 | 0) % 2) F.draw(g, '▼'.replace('▼', '↓'), W - 30, 218, '#8affb0', 1);
        F.draw(g, 'START: SKIP', W - 84, 136, '#2a7a4a', 1);
        g.restore();
      }

      // ================================================================ the HUD
      const ICONS = {
        box(g, x, y) { px(g, '#7a5a30', x, y + 2, 16, 12); px(g, '#b48a52', x + 1, y + 3, 14, 10); px(g, '#d8c492', x + 6, y + 2, 4, 12); px(g, '#5a3a1a', x + 2, y + 5, 3, 3); },
        card(g, x, y, l) { const c = ['#888', '#3a8af0', '#f0c02a', '#e0402a'][l]; px(g, '#000', x, y + 2, 18, 12); px(g, c, x + 1, y + 3, 16, 10); px(g, '#fff', x + 3, y + 5, 6, 2); px(g, '#111', x + 1, y + 10, 16, 2); },
        ration(g, x, y) { px(g, '#1a2a1a', x, y + 3, 16, 10); px(g, '#3a6a3a', x + 1, y + 4, 14, 8); px(g, '#e8e0c0', x + 4, y + 6, 8, 4); },
        gun(g, x, y) { px(g, '#000', x, y + 3, 22, 7); px(g, '#5a606c', x + 1, y + 4, 20, 5); px(g, '#8a929e', x + 1, y + 4, 20, 1); px(g, '#000', x + 4, y + 9, 6, 7); px(g, '#3a3e48', x + 5, y + 9, 4, 6); px(g, '#ffd020', x + 19, y + 5, 4, 3); },
      };
      function panel(g, x, y, w, h, col) { g.fillStyle = 'rgba(4,10,8,.72)'; g.fillRect(x, y, w, h); g.strokeStyle = col || '#4a8a6a'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
      function radar(g) {
        const x = W - 82, y = 6, w = 76, h = 60;
        if (phase !== 'normal') {
          const al = phase === 'alert';
          g.fillStyle = al ? 'rgba(60,0,0,.85)' : 'rgba(40,30,0,.85)'; g.fillRect(x, y, w, h);
          for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(${al ? '255,60,40' : '255,200,40'},${0.08 + R() * 0.12})`; g.fillRect(x + R() * w, y + R() * h, R() * 20, 1); }
          g.strokeStyle = al ? '#ff4030' : '#ffc030'; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
          if (!al || (K.t * 3 | 0) % 2) F.center(g, al ? 'ALERT' : 'EVASION', x + w / 2, y + 12, al ? '#ff7060' : '#ffd060', al ? 2 : 1, '#000');
          const v = al ? alertT : evT; F.center(g, (Math.max(0, v)).toFixed(2), x + w / 2, y + 36, al ? '#ffb0a0' : '#fff0b0', 1, '#000');
          F.center(g, al ? 'RADAR JAMMED' : 'STAY HIDDEN!', x + w / 2, y + 48, al ? '#c05040' : '#c09040', 1);
          return;
        }
        g.save(); g.fillStyle = 'rgba(0,14,6,.82)'; g.fillRect(x, y, w, h); g.beginPath(); g.rect(x + 1, y + 1, w - 2, h - 2); g.clip();
        const ox = Math.round(x + w / 2 - P.x * 3), oy = Math.round(y + h / 2 - P.z * 3);
        g.drawImage(A.radar, ox, oy);
        const fan = (cx, cz, a, r, half, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(ox + cx * 3, oy + cz * 3); for (let i = 0; i <= 8; i++) { const q = a - half + 2 * half * i / 8; g.lineTo(ox + (cx + Math.sin(q) * r) * 3, oy + (cz + Math.cos(q) * r) * 3); } g.closePath(); g.fill(); };
        for (const c of A.cams) fan(c.x, c.z, c.a, c.range, 0.42, 'rgba(255,90,60,.3)');
        for (const s of A.spots) { g.fillStyle = 'rgba(255,240,120,.35)'; g.beginPath(); g.arc(ox + s.x * 3, oy + s.z * 3, 4.5, 0, 7); g.fill(); }
        for (const L of A.lasers) if (L.on) { g.fillStyle = '#ff4040'; g.fillRect(ox + L.x * 3 - 0.5, oy + L.z0 * 3, 1, (L.z1 - L.z0) * 3); }
        for (const q of A.guards) { if (q.st !== 'sleep' && q.st !== 'wake') fan(q.x, q.z, q.a + q.head, (P.low ? 0.62 : 1) * 6.2, 0.68, q.sus > 0.15 ? 'rgba(255,220,80,.35)' : 'rgba(90,255,140,.28)'); }
        for (const q of A.guards) { g.fillStyle = q.st === 'sleep' ? '#8a8aff' : '#ff4a3a'; g.fillRect(ox + q.x * 3 - 1.5, oy + q.z * 3 - 1.5, 3, 3); }
        if (A.rex && A.rex.st !== 'down') { const X = A.rex; fan(X.x, X.z, X.eye, rayLen(X.x, X.z, X.eye, 11.5), 0.24, 'rgba(255,90,60,.4)'); g.fillStyle = '#ff4a3a'; g.fillRect(ox + X.x * 3 - 4, oy + X.z * 3 - 4, 8, 8); }
        if (A.npc && A.npc.m && !S.otter) { g.fillStyle = (K.t * 3 | 0) % 2 ? '#80c0ff' : '#4060a0'; g.fillRect(ox + A.npc.x * 3 - 1.5, oy + A.npc.z * 3 - 1.5, 3, 3); }
        for (const b of A.breakers) if (!b.on) { g.fillStyle = (K.t * 3 | 0) % 2 ? '#ffe060' : '#806020'; g.fillRect(ox + b.x * 3 - 2, oy + b.z * 3 - 2, 4, 4); }
        g.fillStyle = (K.t * 4 | 0) % 2 ? '#ffffff' : '#c8ffd8'; g.fillRect(x + w / 2 - 1.5, y + h / 2 - 1.5, 3, 3);
        for (let yy = y; yy < y + h; yy += 2) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, yy, w, 1); }
        g.restore();
        g.strokeStyle = '#4ad080'; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        if (A.def.boss && A.rex) F.draw(g, 'POWER ' + A.breakers.filter(b => b.on).length + '/3', x + 2, y + h + 4, '#ffd060', 1, true);
      }
      function lifeBar(g) {
        F.draw(g, 'LIFE', 8, 7, '#c8ffd8', 1, true);
        const w = 92, v = clamp(S.life / 100, 0, 1);
        g.fillStyle = '#000'; g.fillRect(8, 17, w + 4, 7); g.fillStyle = '#1a2a20'; g.fillRect(10, 19, w, 3);
        const col = v > 0.5 ? '#3af07a' : v > 0.25 ? '#f0d03a' : ((K.t * 5 | 0) % 2 ? '#ff3a2a' : '#a02018');
        g.fillStyle = col; g.fillRect(10, 19, Math.round(w * v), 3); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(10, 19, Math.round(w * v), 1);
        F.draw(g, 'SOLID GERBIL', 38, 7, '#7aa08a', 1, true);
      }
      function boxes(g) {
        // item box (bottom left)
        panel(g, 6, HH - 34, 74, 28);
        if (P.box) { ICONS.box(g, 11, HH - 30); F.draw(g, 'BOX', 32, HH - 28, '#fff', 1, true); F.draw(g, 'HIDING', 32, HH - 18, '#b0d0c0', 1); }
        else {
          if (S.cards) { ICONS.card(g, 10, HH - 32, S.cards); F.draw(g, 'CARD ' + S.cards, 32, HH - 29, '#fff', 1, true); } else F.draw(g, 'NO CARD', 12, HH - 29, '#6a8a7a', 1);
          ICONS.ration(g, 10, HH - 20); F.draw(g, 'RATION X' + S.rations, 32, HH - 17, S.rations ? '#fff' : '#6a8a7a', 1, true);
        }
        // weapon box (bottom right)
        panel(g, W - 80, HH - 34, 74, 28);
        ICONS.gun(g, W - 75, HH - 31); F.draw(g, 'SNOOZE', W - 49, HH - 29, '#ffe080', 1, true);
        F.draw(g, String(S.darts).padStart(2, '0'), W - 49, HH - 19, S.darts ? '#fff' : '#ff7060', 2, true);
      }
      function promptLine(g) {
        if (!P.prompt || P.dead || cd) return;
        const [b, s] = P.prompt.split(':'), t = K.label(b) + ' ' + s, w = F.width(t) + 12;
        g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(W / 2 - w / 2, HH - 30, w, 13); g.strokeStyle = '#4ad080'; g.strokeRect(W / 2 - w / 2 + 0.5, HH - 29.5, w - 1, 12);
        F.center(g, t, W / 2, HH - 27, '#ffffff', 1);
      }
      function icons(g) {
        for (const q of A.guards) {
          const [sx, sy, ok] = proj(q.x, 1.8, q.z); if (!ok || sx < -10 || sx > W + 10 || sy < -10 || sy > HH + 10) continue;
          if (q.icon === '!') { F.center(g, '!', sx, sy - 18, '#ff3a2a', 3, '#fff'); }
          else if (q.icon === '?') F.center(g, '?', sx, sy - 16, '#ffe040', 2, '#000');
          else if (q.icon === '...') F.center(g, '...', sx, sy - 10, '#ffffff', 1, '#000');
          else if (q.icon === 'z') { for (let i = 0; i < 3; i++) { const p = (K.t * 0.6 + i / 3) % 1; F.draw(g, 'Z', sx + 4 + p * 10 + Math.sin(p * 8) * 2, sy - p * 22, `rgba(200,220,255,${1 - p})`, p > 0.5 ? 2 : 1, false); } }
          if (q.sus > 0.05 && q.st === 'notice' && phase === 'normal') { g.fillStyle = '#000'; g.fillRect(sx - 9, sy - 3, 18, 4); g.fillStyle = '#ffd040'; g.fillRect(sx - 8, sy - 2, 16 * Math.min(1, q.sus), 2); }
        }
        for (const s of speech) { const [sx, sy] = proj(s.g.x, 1.6, s.g.z); const w = F.width(s.s) + 8; g.fillStyle = '#fff'; g.fillRect(sx - w / 2, sy - 34, w, 12); g.fillRect(sx - 2, sy - 22, 4, 3); F.center(g, s.s, sx, sy - 32, '#000', 1); }
        for (const r of rings) { const [sx, sy] = proj(r.x, 0.6, r.z); g.strokeStyle = `rgba(255,255,255,${1 - r.t / 0.6})`; g.beginPath(); g.arc(sx, sy, 4 + r.t * 40, 0, 7); g.stroke(); }
        if (A.npc && A.npc.m && !S.otter) { const [sx, sy] = proj(A.npc.x, 1.5, A.npc.z); if ((K.t * 2 | 0) % 2) F.center(g, '!?', sx, sy - 14, '#80d0ff', 1, '#000'); }
        for (const L of A.lasers) { /* the beams speak for themselves */ }
      }
      function drawPlay() {
        const g = hud;
        if (cd && cd.ring <= 0) return drawCodec();
        lifeBar(g); radar(g); boxes(g); icons(g); promptLine(g);
        if (cardT > 0 && !cd) { const a = Math.min(1, cardT, (4 - cardT) * 2); g.globalAlpha = clamp(a, 0, 1); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 150, W, 34); F.draw(g, A.def.name, 16, 154, '#ffffff', 2, '#000'); F.draw(g, A.def.sub, 16, 172, '#8affb0', 1); g.globalAlpha = 1; }
        if (saveT > 0) { const k = (K.t * 3 | 0) % 2, sx = 8, sy = 30; px(g, '#202428', sx, sy, 12, 15); px(g, '#c8ccd0', sx + 1, sy + 1, 10, 6); px(g, '#e0b020', sx + 2, sy + 10, 2, 4); px(g, '#e0b020', sx + 5, sy + 10, 2, 4); F.draw(g, k ? 'SAVING...' : 'SAVING.', sx + 16, sy, '#ffffff', 1, true); F.draw(g, 'MEMORY CARD 1', sx + 16, sy + 9, '#9ab0c0', 1, true); }
        if (tutT > 0 && cardT <= 0 && !cd && !paused) { const a = clamp(Math.min(tutT, 1), 0, 1), y = 148; g.globalAlpha = a; panel(g, 46, y, W - 92, 50); F.center(g, 'HOW TO SNEAK', W / 2, y + 5, '#8affb0', 1); F.center(g, 'MOVE: D-PAD   ' + K.label('a') + ': CRAWL', W / 2, y + 17, '#fff', 1); F.center(g, K.label('x') + ': SNOOZE DART   ' + K.label('y') + ': BOX', W / 2, y + 27, '#fff', 1); F.center(g, 'WALK INTO A WALL, THEN ' + K.label('b') + ': KNOCK', W / 2, y + 37, '#fff', 1); g.globalAlpha = 1; }
        if (captions.length) { const [w, s] = captions[0], L = wrap(w + ': ' + s, 46); panel(g, 14, HH - 70 - L.length * 10, W - 28, 10 + L.length * 10, '#6a6a4a'); L.forEach((l, i) => F.draw(g, l, 20, HH - 65 - L.length * 10 + i * 10, i === 0 ? '#ffe8a0' : '#ffffff', 1)); }
        if (toastT > 0 && toastS) { const a = clamp(toastT * 3, 0, 1); g.globalAlpha = a; const L = wrap(toastS, 48), w = Math.max(...L.map(l => F.width(l))) + 12; g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(W / 2 - w / 2, 70, w, 4 + L.length * 10); L.forEach((l, i) => F.center(g, l, W / 2, 73 + i * 10, '#ffffff', 1)); g.globalAlpha = 1; }
        if (S.life < 25 && !P.dead) { const a = 0.25 + Math.sin(K.t * 6) * 0.15; const gr = g.createRadialGradient(W / 2, HH / 2, 80, W / 2, HH / 2, 200); gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(200,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, HH); }
        if (flash > 0) { g.fillStyle = `rgba(${flashCol},${Math.min(0.5, flash)})`; g.fillRect(0, 0, W, HH); }
        if (bang > 0 && phase === 'alert') { g.strokeStyle = `rgba(255,40,30,${bang})`; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, HH - 6); g.lineWidth = 1; }
        if (cd && cd.ring > 0) drawCodec();
        if (paused) {
          g.fillStyle = 'rgba(0,8,4,.72)'; g.fillRect(0, 0, W, HH);
          F.center(g, 'PAUSE', W / 2, 40, '#ffffff', 3, '#0a3a1a');
          F.center(g, 'PRESS START TO CARRY ON', W / 2, 74, '#8affb0', 1);
          F.center(g, 'PRESS ' + K.label('b') + ' TO CALL THE COLONEL FOR A HINT', W / 2, 88, '#ffe080', 1);
          panel(g, 40, 108, W - 80, 104);
          const C = [['D-PAD', 'MOVE'], [K.label('a'), 'CRAWL / STAND UP'], [K.label('b'), 'KNOCK / USE'], [K.label('x'), 'SNOOZE DART'], [K.label('y'), 'CARDBOARD BOX'], ['START', 'PAUSE']];
          C.forEach(([a, b], i) => { F.draw(g, a, 56, 116 + i * 13, '#ffe080', 1); F.draw(g, b, 120, 116 + i * 13, '#ffffff', 1); });
          F.center(g, A.def.name + '   ' + mt(S.st.t) + '   SEEDS ' + Object.keys(S.seeds).length + '/6', W / 2, 222, '#7aa08a', 1);
        }
        if (fadeT > 0) { g.fillStyle = `rgba(0,0,0,${clamp(1 - Math.abs(fadeT - 0.6) / 0.6, 0, 1)})`; g.fillRect(0, 0, W, HH); }
      }

      // ================================================================ title, menus, results
      const LOGO = (() => {
        const c = document.createElement('canvas'); c.width = 320; c.height = 110; const g = c.getContext('2d');
        g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.font = '900 38px Arial Black,Arial,sans-serif';
        for (let d = 6; d > 0; d--) { g.fillStyle = d > 1 ? '#0a0e14' : '#000'; g.fillText('METAL GERBIL', 160 + d * 0.6, 50 + d); }
        const gr = g.createLinearGradient(0, 18, 0, 50); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.42, '#b8c4d4'); gr.addColorStop(0.5, '#4a5a6e'); gr.addColorStop(0.62, '#8ea0b4'); gr.addColorStop(1, '#e8eef6');
        g.fillStyle = gr; g.fillText('METAL GERBIL', 160, 50); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.6)'; g.strokeText('METAL GERBIL', 160, 50);
        g.font = 'italic 900 34px Arial Black,Arial,sans-serif';
        g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText('SOLID', 218, 86); g.lineWidth = 3; g.strokeStyle = '#ffffff'; g.strokeText('SOLID', 218, 86);
        const r = g.createLinearGradient(0, 60, 0, 86); r.addColorStop(0, '#ff8a6a'); r.addColorStop(0.5, '#e02a1a'); r.addColorStop(1, '#7a0a06'); g.fillStyle = r; g.fillText('SOLID', 218, 86);
        g.fillStyle = '#c8d0dc'; g.fillRect(22, 60, 140, 2); g.fillStyle = '#4a5a6e'; g.fillRect(22, 62, 140, 1);
        F.draw(g, 'TACTICAL', 22, 68, '#c8d0dc', 1); F.draw(g, 'SNEAKING ACTION', 22, 78, '#c8d0dc', 1);
        // a little gerbil emblem: the ears and the bandana
        g.fillStyle = '#000'; g.beginPath(); g.arc(14, 30, 11, 0, 7); g.fill(); g.fillStyle = '#c8965a'; g.beginPath(); g.arc(14, 32, 8, 0, 7); g.fill(); g.beginPath(); g.arc(8, 23, 4, 0, 7); g.arc(20, 23, 4, 0, 7); g.fill(); g.fillStyle = '#d8262a'; g.fillRect(6, 27, 16, 3); g.fillStyle = '#000'; g.fillRect(10, 31, 2, 2); g.fillRect(16, 31, 2, 2);
        return c;
      })();
      let menu = [], mi = 0, titleT = 0, pressed = false, briefI = 0, briefT = 0, res = null, resT = 0, nameS = 'JACK', nameI = 3, hiNew = -1, overT = 0, oi = 0, mcI = 0;
      const BRIEF = ['SHADOW MUESLI ISLAND. 1999.', 'A SNOWY ROCK IN THE MIDDLE OF NOWHERE.', 'THE FERRETHOUND GANG HAVE TAKEN OVER ITS SECRET BASE...', '...AND STOLEN THE PLANS FOR WHEEL REX.', 'ONE AGENT HAS BEEN SENT IN. ALONE.', 'CODENAME: SOLID GERBIL.'];
      const BRIEFW = BRIEF.map(b => wrap(b, 48));
      function titleMenu() { menu = ['NEW GAME'].concat(CK ? ['CONTINUE'] : [], ['RANKINGS']); mi = CK ? 1 : 0; }
      function toTitle() {
        mode = 'title'; titleT = 0; pressed = false; S = S || newS(); paused = false; cd = null; phase = 'normal';
        buildArea(0); P.x = 10.5; P.z = 17.2; P.a = 0.35; P.low = false; P.box = false; P.wall = null; P.dead = 0; P.moving = false; P.inv = 0;
        K.music(SONGS.title); titleMenu();
      }
      function startNew() { S = newS(); mode = 'brief'; briefI = 0; briefT = 0; K.music(null); }
      function startPlay() { mode = 'play'; enterArea(0, true); }
      function continueGame() { S = copy(CK); mode = 'play'; enterArea(S.area); toast('WELCOME BACK, SOLID GERBIL', 2); }
      function rankOf(st) { if (st.alerts === 0 && st.t < 900 && st.cont === 0) return 'FOX'; if (st.alerts <= 1 && st.cont === 0) return 'HOUND'; if (st.naps >= 8) return 'SLEEPY GERBIL'; if (st.alerts <= 4) return 'HAMSTER'; return 'SCAREDY MOUSE'; }
      function results() {
        const st = S.st, seeds = Object.keys(S.seeds).length;
        const lines = [['MISSION COMPLETE', 12000], ['STEALTH (' + st.alerts + ' ALERTS)', Math.max(0, 16000 - 3000 * st.alerts)], ['TIME BONUS', Math.max(0, 12000 - Math.floor(st.t) * 10)], ['NO NAPS BONUS', st.naps === 0 ? 3000 : 0], ['GOLDEN SEEDS X' + seeds, seeds * 500], ['LIFE LEFT', Math.round(clamp(S.life, 0, 100) * 20)], ['CONTINUES X' + st.cont, -2000 * st.cont]];
        const total = clamp(lines.reduce((n, l) => n + l[1], 0), 0, 50000), rank = rankOf(st), send = Math.min(total, Math.floor(150 * (K.t + 3)));
        res = { lines, total, rank, send, st: copy(st), seeds };
        if (st.alerts === 0) K.secret('lk.sneak.ghost');
        CK = null; persist();
        mode = 'results'; resT = 0; K.music(SONGS.results);
      }
      function afterResults() {
        const pos = HI.findIndex(e => res.total > e.s); const at = pos < 0 ? HI.length : pos;
        if (at < 8) { mode = 'name'; nameS = 'JACK'; nameI = 3; hiNew = at; } else { hiNew = -1; mode = 'table'; resT = 0; }
      }
      function finishName() {
        HI.splice(hiNew, 0, { n: nameS.trim() || 'JACK', s: res.total, r: res.rank, me: 1 }); HI.length = Math.min(HI.length, 8); persist();
        mode = 'table'; resT = 0; K.sfx.seq([[76, 0.25], [79, 0.25], [84, 0.5]], { bpm: 300, vol: 0.08 });
      }
      function finishWin() { mode = 'done'; K.music(null); K.over(res.send, { title: 'MISSION COMPLETE', text: 'RANK: ' + res.rank + '. ' + res.st.alerts + ' ALERTS, ' + mt(res.st.t) + '.' }); }
      function finishFail() {
        const sc = Math.min(S.area * 700 + Object.keys(S.seeds).length * 300 + (S.cards * 200), Math.floor(150 * (K.t + 3)));
        mode = 'done'; K.music(null); K.over(sc, { title: 'MISSION FAILED', text: 'SOLID GERBIL GOT AS FAR AS THE ' + A.def.name + '.' });
      }
      function drawTitleBg(g) {
        const gr = g.createLinearGradient(0, 0, 0, HH); gr.addColorStop(0, 'rgba(0,4,12,.85)'); gr.addColorStop(0.45, 'rgba(0,4,12,.15)'); gr.addColorStop(0.62, 'rgba(0,4,12,.1)'); gr.addColorStop(1, 'rgba(0,4,12,.85)'); g.fillStyle = gr; g.fillRect(0, 0, W, HH);
      }
      function drawTitle() {
        const g = hud; drawTitleBg(g);
        const k = clamp(titleT / 1.2, 0, 1); g.globalAlpha = k; g.drawImage(LOGO, 0, 8 + (1 - k) * -8); g.globalAlpha = 1;
        if (!pressed) { if ((titleT * 2 | 0) % 2 && titleT > 1) F.center(g, 'PRESS START', W / 2, 176, '#ffffff', 1, true); }
        else { g.fillStyle = 'rgba(0,6,14,.62)'; g.fillRect(W / 2 - 92, 146, 184, 14 * menu.length + 8 + (CK && menu[mi] === 'CONTINUE' ? 12 : 0)); }
        if (pressed) menu.forEach((m, i) => { const on = i === mi; F.center(g, (on ? '> ' : '  ') + m + (on ? ' <' : '  '), W / 2, 152 + i * 14, on ? '#ffe080' : '#9ab0c0', 1, true); if (m === 'CONTINUE' && on && CK) F.center(g, 'SAVED IN THE ' + AREAS[CK.area].name + '  ' + mt(CK.st.t), W / 2, 152 + menu.length * 14, '#8affb0', 1, true); });
        F.center(g, 'TOP AGENT: ' + HI[0].n + ' ' + HI[0].s.toLocaleString('en-GB') + ' (' + HI[0].r + ')', W / 2, 212, '#c8a050', 1, true);
        F.center(g, '(C) 1999 KRONK COMPUTER ENTERTAINMENT', W / 2, 226, '#6a7a8a', 1, true);
      }
      function drawTable(g, hl, title) {
        g.fillStyle = '#020806'; g.fillRect(0, 0, W, HH); for (let y = 0; y < HH; y += 2) { g.fillStyle = 'rgba(40,255,120,.025)'; g.fillRect(0, y, W, 1); }
        F.center(g, title || 'TOP AGENTS', W / 2, 16, '#8affb0', 2, '#0a3a1a');
        F.draw(g, 'NAME', 34, 44, '#4a9a6a', 1); F.draw(g, 'SCORE', 112, 44, '#4a9a6a', 1); F.draw(g, 'RANK', 190, 44, '#4a9a6a', 1);
        HI.forEach((e, i) => { const y = 58 + i * 17, on = i === hl && (K.t * 3 | 0) % 2 === 0; const c = i === hl ? '#ffe080' : i === 0 ? '#ffffff' : '#c8e8d8'; F.draw(g, (i + 1) + '.', 18, y, '#4a9a6a', 1); F.draw(g, e.n, 34, y, on ? '#ffffff' : c, 1); F.draw(g, String(e.s).padStart(5, ' '), 112, y, c, 1); F.draw(g, e.r, 190, y, c, 1); });
      }
      function drawResults() {
        const g = hud; g.fillStyle = '#020806'; g.fillRect(0, 0, W, HH); for (let y = 0; y < HH; y += 2) { g.fillStyle = 'rgba(40,255,120,.025)'; g.fillRect(0, y, W, 1); }
        F.center(g, 'MISSION COMPLETE', W / 2, 10, '#ffffff', 2, '#0a3a1a');
        const st = res.st, rows = [['CLEAR TIME', mt(st.t)], ['ALERTS', st.alerts], ['GUARDS SNOOZED', st.naps], ['RATIONS EATEN', st.rations], ['CONTINUES', st.cont], ['GOLDEN SEEDS', res.seeds + '/6']];
        rows.forEach(([a, b], i) => { if (resT > 0.3 + i * 0.15) { F.draw(g, a, 24, 34 + i * 10, '#8affb0', 1); F.draw(g, String(b), 140 - F.width(String(b)), 34 + i * 10, '#ffffff', 1); } });
        res.lines.forEach(([a, b], i) => { if (resT > 1.3 + i * 0.18) { F.draw(g, a, 160, 34 + i * 10, '#8ab0a0', 1); F.draw(g, String(b), W - 14 - F.width(String(b)), 34 + i * 10, b < 0 ? '#ff8070' : '#ffffff', 1); } });
        if (resT > 2.8) { g.fillStyle = '#3ae07a'; g.fillRect(160, 108, W - 174, 1); F.draw(g, 'TOTAL', 160, 113, '#ffe080', 1); F.draw(g, String(res.total), W - 14 - F.width(String(res.total)), 113, '#ffe080', 1); }
        if (resT > 3.4) {
          const s = clamp((resT - 3.4) * 4, 0, 1), k = 3 + (1 - s) * 3, rk = res.rank;
          F.center(g, 'YOUR CODENAME', W / 2, 136, '#8affb0', 1);
          g.save(); g.globalAlpha = s; F.center(g, rk, W / 2, 152 - (k - 3) * 4, rk === 'FOX' ? '#ffd040' : '#ffffff', k > 3.5 ? 3 : 3, '#5a1a0a'); g.restore();
          if (s >= 1) F.center(g, RANKS[rk], W / 2, 182, '#c8e8d8', 1);
          if (s >= 1 && res.send < res.total) F.center(g, 'JACKNET WILL COUNT ' + res.send + ' FOR THIS GO', W / 2, 196, '#c09060', 1);
        }
        if (resT > 4.4 && (K.t * 2 | 0) % 2) F.center(g, 'PRESS START', W / 2, 218, '#ffffff', 1);
      }
      function drawName() {
        const g = hud; g.fillStyle = '#020806'; g.fillRect(0, 0, W, HH); for (let y = 0; y < HH; y += 2) { g.fillStyle = 'rgba(40,255,120,.025)'; g.fillRect(0, y, W, 1); }
        F.center(g, 'NEW TOP AGENT!', W / 2, 30, '#8affb0', 2, '#0a3a1a');
        F.center(g, 'SCORE ' + res.total + '   RANK: ' + res.rank, W / 2, 60, '#ffffff', 1);
        F.center(g, 'THAT PUTS YOU AT NUMBER ' + (hiNew + 1) + ' ON THE TABLE', W / 2, 74, '#c8e8d8', 1);
        panel(g, 40, 92, W - 80, 70, '#ffe080');
        F.center(g, 'ENTER YOUR NAME', W / 2, 100, '#ffe080', 1);
        for (let i = 0; i < 4; i++) { const x = W / 2 - 46 + i * 24, on = i === nameI; F.draw(g, nameS[i] || ' ', x, 114, on ? '#ffffff' : '#c8e8d8', 3, '#000'); if (on && (K.t * 4 | 0) % 2) { g.fillStyle = '#ffe080'; g.fillRect(x, 140, 15, 2); } }
        F.center(g, 'UP/DOWN: LETTER  ' + K.label('a') + ': NEXT  START: DONE', W / 2, 148, '#8ab0a0', 1);
      }
      function drawOver() {
        const g = hud; const k = clamp(overT / 1.2, 0, 1);
        g.fillStyle = `rgba(30,0,0,${0.75 * k})`; g.fillRect(0, 0, W, HH);
        g.save(); g.globalAlpha = k; F.center(g, 'GAME OVER', W / 2, 56, '#ff3a2a', 4, '#000'); g.restore();
        const s = 'GERBIL? GERBIL! GERBIIIIIIL!'; F.center(g, s.slice(0, clamp((overT - 0.6) * 24, 0, s.length) | 0), W / 2, 104, '#ffd0c0', 1, true);
        if (overT > 1.6) ['CONTINUE', 'EXIT'].forEach((m, i) => { const on = i === oi; F.center(g, (on ? '> ' : '  ') + m + (on ? ' <' : '  '), W / 2, 134 + i * 24, on ? '#ffffff' : '#a07070', 2, '#000'); });
        if (overT > 1.6) F.center(g, 'CONTINUE STARTS THE ' + A.def.name + ' AGAIN', W / 2, 190, '#c08080', 1, true);
      }
      function drawMemcard() {
        const g = hud; g.fillStyle = '#10141c'; g.fillRect(0, 0, W, HH);
        const gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, '#3a4a6a'); gr.addColorStop(1, '#10141c'); g.fillStyle = gr; g.fillRect(0, 0, W, 40);
        F.center(g, 'MEMORY CARD 1', W / 2, 12, '#ffffff', 2, '#000'); F.center(g, "JACK'S CARD (DO NOT DELETE)", W / 2, 32, '#9ab0d0', 1);
        const files = CARD_FILES.slice(0, 2).concat(['METAL GERBIL SOLID'], CARD_FILES.slice(2));
        files.forEach((f, i) => {
          const y = 46 + i * 23, on = i === mcI, mine = f === 'METAL GERBIL SOLID';
          g.fillStyle = on ? '#2a3a5a' : '#181e2a'; g.fillRect(30, y, W - 60, 21); if (on) { g.strokeStyle = '#ffe080'; g.strokeRect(30.5, y + 0.5, W - 61, 20); }
          px(g, mine ? '#d8262a' : ['#3a8af0', '#e0b020', '#40a040', '#a040c0', '#808080', '#808080'][i % 6], 35, y + 5, 11, 11); px(g, 'rgba(255,255,255,.35)', 35, y + 5, 11, 2);
          F.draw(g, mine ? 'METAL GERBIL SOLID' : f, 52, mine ? y + 3 : y + 7, mine ? '#ffffff' : '#7a8aa0', 1);
          if (mine) F.draw(g, AREAS[CK.area].name + '  ' + mt(CK.st.t) + '  ' + Object.keys(CK.seeds).length + '/6 SEEDS', 52, y + 12, '#8affb0', 1);
        });
        F.center(g, K.label('a') + ': LOAD   ' + K.label('b') + ': BACK', W / 2, 228, '#9ab0d0', 1);
      }
      function drawBrief() {
        const g = hud; g.fillStyle = '#000'; g.fillRect(0, 0, W, HH);
        // every line wrapped to the screen (48 characters at the small font), typed out across the wrapped lines
        const total = BRIEFW.reduce((h, L) => h + L.length * 10 + 8, 0); let y = Math.max(20, (HH - total) / 2);
        for (let i = 0; i < BRIEF.length; i++) {
          const L = BRIEFW[i];
          if (i <= Math.min(briefI, BRIEF.length - 1)) {
            let n = i < briefI ? 9999 : clamp(briefT * 30, 0, BRIEF[i].length) | 0;
            for (const l of L) { F.center(g, l.slice(0, Math.max(0, n)), W / 2, y + L.indexOf(l) * 10, i === BRIEF.length - 1 ? '#ff6a5a' : '#c8d0dc', 1); n -= l.length + 1; }
          }
          y += L.length * 10 + 8;
        }
        F.center(g, 'START: SKIP', W / 2, 224, '#3a4a5a', 1);
      }

      // ================================================================ the loop
      function update(dt) {
        if (toastT > 0) toastT -= dt; if (flash > 0) flash -= dt; if (bang > 0) bang -= dt;
        if (mode === 'title') {
          titleT += dt; titleIdle(dt);
          if (!pressed) { if (titleT > 0.6 && (K.pressed('start') || K.pressed('a'))) { pressed = true; tick(880, 0.08, 0.08); } return; }
          if (K.pressed('up')) { mi = (mi + menu.length - 1) % menu.length; tick(660, 0.04, 0.05); }
          if (K.pressed('down')) { mi = (mi + 1) % menu.length; tick(660, 0.04, 0.05); }
          if (K.pressed('start') || K.pressed('a')) { tick(1100, 0.08, 0.08); const m = menu[mi]; if (m === 'NEW GAME') startNew(); else if (m === 'CONTINUE') { mode = 'memcard'; mcI = 2; } else { mode = 'ranks'; } }
          return;
        }
        if (mode === 'ranks') { if (K.pressed('start') || K.pressed('a') || K.pressed('b')) { mode = 'title'; tick(700, 0.05, 0.05); } return; }
        if (mode === 'memcard') {
          if (K.pressed('up')) { mcI = (mcI + 6) % 7; tick(660, 0.04, 0.05); } if (K.pressed('down')) { mcI = (mcI + 1) % 7; tick(660, 0.04, 0.05); }
          if (K.pressed('b')) { mode = 'title'; return; }
          if (K.pressed('a') || K.pressed('start')) { if (mcI === 2) { K.sfx.seq([[72, 0.25], [79, 0.5]], { bpm: 300, vol: 0.08 }); continueGame(); } else { const f = [CARD_FILES[0], CARD_FILES[1], '', ...CARD_FILES.slice(2)][mcI]; tick(180, 0.15, 0.08); memMsg = f.startsWith('DAVE') ? "THAT'S DAVE'S. DO NOT TOUCH IT." : "THAT ISN'T A METAL GERBIL SAVE!"; memT = 1.6; } }
          if (memT > 0) memT -= dt;
          return;
        }
        if (mode === 'brief') {
          briefT += dt;
          if (K.pressed('start')) return startPlay();
          const s = BRIEF[briefI]; if (briefT * 30 >= s.length + 30 || (K.pressed('a') && briefT * 30 >= s.length)) { briefI++; briefT = 0; if (briefI >= BRIEF.length) return startPlay(); tick(440, 0.05, 0.04, 'triangle'); }
          else if (K.pressed('a')) briefT = s.length / 30;
          if ((briefT * 30 | 0) % 2 === 0 && briefT * 30 < s.length) tick(1800, 0.01, 0.015);
          return;
        }
        if (mode === 'results') { resT += dt; if (resT > 4.4 && (K.pressed('start') || K.pressed('a'))) afterResults(); else if (resT < 4 && (K.pressed('start') || K.pressed('a'))) resT = 4.4; return; }
        if (mode === 'name') {
          const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !', ch = nameS[nameI] || ' ', ci = AL.indexOf(ch);
          const set = c => { nameS = (nameS.slice(0, nameI) + c + nameS.slice(nameI + 1)).padEnd(4, ' ').slice(0, 4); tick(880, 0.03, 0.05); };
          if (K.pressed('up')) set(AL[(ci + 1) % AL.length]); if (K.pressed('down')) set(AL[(ci + AL.length - 1) % AL.length]);
          if (K.pressed('right') || K.pressed('a')) { if (nameI < 3) { nameI++; tick(1000, 0.04, 0.05); } else if (K.pressed('a')) finishName(); }
          if (K.pressed('left') || K.pressed('b')) { if (nameI > 0) nameI--; }
          if (K.pressed('start')) finishName();
          return;
        }
        if (mode === 'table') { resT += dt; if (resT > 0.8 && (K.pressed('start') || K.pressed('a'))) finishWin(); return; }
        if (mode === 'done') return;
        if (mode === 'over') {
          overT += dt; if (overT < 1.6) return;
          if (K.pressed('up') || K.pressed('down')) { oi = 1 - oi; tick(660, 0.04, 0.05); }
          if (K.pressed('start') || K.pressed('a')) { if (oi === 0) { const st = S.st; st.cont++; S = copy(CK); S.st = st; mode = 'play'; enterArea(S.area); } else finishFail(); }
          return;
        }
        if (mode === 'winfx') { winT += dt; stepParts(dt); animGerbil(dt); camUpdate(dt); if (A.rex) rexUpdate(dt); if (winT > 1.6 && !cd) { mode = 'play'; codec('win', results); } return; }
        // ---- play
        if (cd) { codecUpdate(dt); return; }
        if (fadeT > 0) { const f0 = fadeT; fadeT -= dt; if (f0 > 0.6 && fadeT <= 0.6) enterArea(fadeTo); if (fadeT <= 0) fadeT = 0; camUpdate(dt); return; }
        if (K.pressed('start') && !P.dead) { paused = !paused; tick(paused ? 440 : 880, 0.06, 0.06); }
        if (paused) { if (K.pressed('b')) { paused = false; codec(A.def.hint); } return; }
        if (pendingCall) { pendingT -= dt; if (pendingT <= 0) { const c = pendingCall; pendingCall = null; codec(c); } }
        S.st.t += dt; if (cardT > 0) cardT -= dt; if (saveT > 0) saveT -= dt; if (tutT > 0 && !pendingCall) tutT -= dt;
        if (capT > 0 && captions.length) { capT -= dt; if (capT <= 0) { captions.shift(); capT = 3; } }
        for (let i = speech.length - 1; i >= 0; i--) { speech[i].t -= dt; if (speech[i].t <= 0) speech.splice(i, 1); }
        playerUpdate(dt);
        for (const g of A.guards) { guardUpdate(g, dt); animGuard(g, dt); }
        hazards(dt); rexUpdate(dt); shotsUpdate(dt); items(dt); exits(dt); phaseUpdate(dt);
        stepParts(dt); snowStep(dt); animGerbil(dt); camUpdate(dt);
        if (A.water) A.water.material.map.offset.set(K.t * 0.02, K.t * 0.012);
        if (A.rotor) A.rotor.rotation.y += dt * 0.6;
        if (A.boat) A.boat.position.y = -0.25 + Math.sin(K.t * 1.5) * 0.04;
        for (const it of A.items) if (it.k === 'p' && !it.got) { it.g.rotation.y += dt * 2; }
        if (A.npc && A.npc.m) { const o = A.npc.m; o.hd.rotation.y = Math.sin(K.t * 3) * 0.5; o.b.position.y = Math.abs(Math.sin(K.t * 9)) * 0.02; o.root.rotation.y = Math.atan2(P.x - A.npc.x, P.z - A.npc.z) * 0.6; }
        if (P.dead > 1.8) { mode = 'over'; overT = 0; oi = 0; }
      }
      let memMsg = '', memT = 0;
      function titleIdle(dt) {
        for (const g of A.guards) { guardUpdate(g, dt); animGuard(g, dt); }
        snowStep(dt); stepParts(dt); P.moving = false; animGerbil(dt);
        if (A.water) A.water.material.map.offset.set(K.t * 0.02, K.t * 0.012); if (A.boat) A.boat.position.y = -0.25 + Math.sin(K.t * 1.5) * 0.04;
        const a = titleT * 0.08;
        cam.position.set(P.x - 2.2 + Math.sin(a) * 1.4, 1.5 + Math.sin(titleT * 0.3) * 0.15, P.z + 3.6 - Math.sin(a) * 0.6); cam.lookAt(P.x + 0.6, 1.0, P.z - 2.5);
        snow.position.set(P.x, 0, P.z - 3);
      }
      function draw() {
        const covered = mode === 'brief' || mode === 'results' || mode === 'name' || mode === 'table' || mode === 'memcard' || mode === 'ranks' || (cd && cd.ring <= 0 && cd.open >= 1);
        if (!covered) T3.render();
        hud.clearRect(0, 0, W, HH);
        if (mode === 'title') drawTitle();
        else if (mode === 'ranks') { drawTable(hud, -1); F.center(hud, 'PRESS START', W / 2, 212, (K.t * 2 | 0) % 2 ? '#ffffff' : '#6a8a7a', 1); }
        else if (mode === 'memcard') { drawMemcard(); if (memT > 0) { const w = F.width(memMsg) + 12; hud.fillStyle = '#000'; hud.fillRect(W / 2 - w / 2, 210, w, 14); F.center(hud, memMsg, W / 2, 213, '#ff8070', 1); } }
        else if (mode === 'brief') drawBrief();
        else if (mode === 'results') drawResults();
        else if (mode === 'name') drawName();
        else if (mode === 'table') { drawTable(hud, hiNew, 'TOP AGENTS'); if (resT > 0.8 && (K.t * 2 | 0) % 2) F.center(hud, 'PRESS START', W / 2, 212, '#ffffff', 1); }
        else if (mode === 'over') { drawPlay(); drawOver(); }
        else if (mode === 'winfx') { drawPlay(); hud.fillStyle = `rgba(255,255,255,${clamp(1 - winT, 0, 0.8)})`; hud.fillRect(0, 0, W, HH); F.center(hud, 'GOT THE PLANS!', W / 2, 90, '#ffffff', 2, '#0a3a1a'); }
        else if (mode === 'play') drawPlay();
        else if (mode === 'done') { hud.fillStyle = '#000'; hud.fillRect(0, 0, W, HH); }
      }
      // (for testing)
      K.dbg = { get S() { return S; }, P, get A() { return A; }, get mode() { return mode; }, get phase() { return phase; }, get cd() { return cd; }, get res() { return res; }, get HI() { return HI; }, get CK() { return CK; },
        enter(ai) { if (!S || mode === 'title') S = newS(); if (S.life <= 0) S.life = 100; S.cards = 3; mode = 'play'; paused = false; cd = null; pendingCall = null; S.calls = { dock: 1, heli: 1, base: 1, duct: 1, lab: 1, rex: 1 }; enterArea(ai); pendingCall = null; },
        at(x, z, a) { P.x = x; P.z = z; if (a != null) P.a = a; camSnap = true; }, alert() { raiseAlert(A.guards[0] || null); }, skip() { if (cd) endCodec(); }, win() { results(); }, setMode(m) { mode = m; },
        flip() { const b = A.breakers.find(q => !q.on); if (b) flipBreaker(b); }, kill() { S.rations = 0; P.inv = 0; hurt(999, P.x + 1, P.z); }, sleepAll() { for (const g of A.guards) sleepGuard(g); }, calm() { phase = 'normal'; for (const g of A.guards) { g.sus = 0; if (g.st !== 'sleep') goReturn(g); } }, get fade() { return fadeT; }, get paused() { return paused; }, get pend() { return pendingCall; }, los, tileAt, doorAt, rayLen };
      toTitle();
      return {
        update, draw,
        end() { K.music(null); if (S && CK && (mode === 'play' || mode === 'over')) { CK.st = copy(S.st); persist(); } for (const m of own) try { m.dispose(); } catch (e) {} },
      };
    },
  });
})();

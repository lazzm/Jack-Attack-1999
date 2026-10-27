/* KART KAOS 64 (N64, in Jack's room, came with the console). A proper kart cup game:
 *   GRAND PRIX: two cups of four tracks (BISCUIT CUP, STAR CUP), eight karts, three laps, points, a podium with trophies.
 *     Classes 50cc / 100cc, then 150cc (win any cup on 100cc) and MIRROR (win both cups on 150cc). The STAR CUP opens once
 *     you get a trophy in the BISCUIT CUP.
 *   VS RACE: one race on any open track.  TIME TRIALS: you against the clock and your own saved ghost (and DAVE's staff time).
 *   BATTLE: you and three computer karts in an arena, three balloons each, last one with a balloon wins.
 * Eight drivers with their own karts and stats (speed, acceleration, handling, weight). Hold R (E) while steering to hop
 * and drift: the sparks go blue, then orange; let go for a mini-turbo. Ten items from the ? boxes, given out by how
 * far behind you are. N64 look: thick fog, smooth blurry textures, Gouraud-lit low-poly, painted sky panoramas.
 * Secrets: rm.kart.short (Biscuit Circuit's hedge gap: it IS allowed), rm.kart.cup (win a gold cup), rm.kart.mirror
 * (unlock MIRROR), rm.kart.staff (beat DAVE's staff time in Time Trials).
 * Save (rm.n64.kart, v1): { track, lap:{i: best lap}, tt:{i: best time}, cups:{'cc:cup': 1..3}, unl:{c150, mirror, star},
 *   opt:{mus, cam, ghost}, drv, hi:[{n, s}], races, wins }  (old saves only had track + lap: they still load).
 * Ghosts live in localStorage jhp_rmkart_gh<i> (they can be 10 KB each). Test hooks: window.__rmAuto (the computer drives
 * you), window.__kartDbg (the running game's state and some jumps). Everything here is original. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const kitReady = window.RoomRK ? Promise.resolve() : (window.Apps && Apps.load ? Apps.load('js/rm-g-racekit.js') : Promise.reject(new Error('no loader')));
  kitReady.catch(() => {});
  const SECRETS = [['rm.kart.cup', 'Golden Kart', 'Win a gold cup in KART KAOS 64.'], ['rm.kart.mirror', 'Through the Looking Glass', 'Some kart cups look very different the other way round.'],
    ['rm.kart.staff', 'Faster Than Dave', 'Beat the staff ghost time on any track in KART KAOS 64.']];
  try { for (const [id, n, h] of SECRETS) if (window.Apps && Apps.defineSecret && !(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, h); } catch (e) {}

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const wrapA = a => { if (!isFinite(a)) return 0; while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  const fmt = t => { if (!(t > 0) || t > 5999) return "-'--\"--"; return `${Math.floor(t / 60)}'${String(Math.floor(t % 60)).padStart(2, '0')}"${String(Math.floor(t * 100) % 100).padStart(2, '0')}`; };
  const hexs = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
  const ORD = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH'];
  const PTS = [15, 12, 10, 8, 6, 4, 2, 1];
  const BASE = [3000, 2400, 2000, 1700, 1400, 1200, 1000, 800];

  // ================================================================ the drivers: stats 1..5
  // The player and their own mates drive (Cast house ids; the owner's account resolves to Jack, Dave, Luke, Callum, JackK).
  const who = (id, fb) => { try { const C = window.Cast; const n = id === 'me' ? C?.me?.()?.first : C?.n?.(id); return String(n || fb).toUpperCase().replace(/[^A-Z0-9 '-]/g, '').slice(0, 9) || fb; } catch (e) { return fb; } };
  const DRIVERS = [
    { n: who('me', 'YOU'), col: 0xd8261c, col2: 0xffffff, spd: 3, acc: 3, hnd: 3, wt: 3, k: { kind: 'kid', cap: 0xd8261c, hair: 0x5a3414, shirt: 0xd8261c }, tag: 'ALL-ROUNDER', nt: 72 },
    { n: who('mate1', 'DAVE'), col: 0x22a03a, col2: 0xffe14a, spd: 4, acc: 2, hnd: 3, wt: 4, k: { kind: 'kid', helmet: 0xffe14a, hair: 0xe8c860, shirt: 0x22a03a, visor: 0x2a6a3a }, tag: 'ULTRA ENTERTAINMENT NUT', nt: 67 },
    { n: who('mate2', 'LUKE'), col: 0x2a62e0, col2: 0xffffff, spd: 3, acc: 4, hnd: 3, wt: 2, k: { kind: 'kid', helmet: 0xffffff, shirt: 0x2a62e0, visor: 0x2a3a8a }, tag: 'QUICK OFF THE LINE', nt: 69 },
    { n: who('mate3', 'CALLUM'), col: 0xf0b000, col2: 0x2a2a2a, spd: 5, acc: 1, hnd: 2, wt: 4, k: { kind: 'kid', hair: 0x1a1210, glasses: 1, shirt: 0x3a3a3a, skin: 0xe8b888 }, tag: 'FLAT OUT, NO BRAKES', nt: 64 },
    { n: who('mate4', 'JACKK'), col: 0x9a3ad8, col2: 0xff8ad0, spd: 2, acc: 4, hnd: 5, wt: 2, k: { kind: 'kid', hair: 0xd85a1a, spiky: 1, shirt: 0x9a3ad8 }, tag: 'CORNERS LIKE A CAT', nt: 74 },
    { n: 'GUBBINZ', col: 0x5a9a2a, col2: 0xb07a3a, spd: 2, acc: 5, hnd: 4, wt: 1, k: { kind: 'grot', fur: 0x6ab02a, shirt: 0x8a5a2a, cap: 0x5a3a1a }, tag: 'SNEAKY LITTLE GROT', nt: 79 },
    { n: 'BISCUIT', col: 0xc87a3a, col2: 0xffffff, spd: 3, acc: 3, hnd: 4, wt: 2, k: { kind: 'dog', fur: 0xc88a4a, ear: 0x7a4a22, shirt: 0x3a8ad8 }, tag: 'GOOD BOY, FAST BOY', nt: 76 },
    { n: 'MR TIBBS', col: 0x2a2a34, col2: 0xff3a3a, spd: 4, acc: 2, hnd: 2, wt: 5, k: { kind: 'cat', fur: 0x2a2a30, muzzle: 0xf0f0e8, shirt: 0xff3a3a }, tag: 'A VERY BIG CAT', nt: 62 },
  ];
  DRIVERS.forEach((d, n) => { d.k.col = d.col; d.k.col2 = d.col2; d.k.num = n + 1; });
  // classes: top speed (m/s), how good the computer is, the score multiplier
  const CLASSES = [{ n: '50CC', top: 21, ai: 0.9, mult: 0.8 }, { n: '100CC', top: 25, ai: 0.97, mult: 1 }, { n: '150CC', top: 29, ai: 1.02, mult: 1.15 }, { n: 'MIRROR', top: 29, ai: 1.03, mult: 1.25, mirror: 1 }];

  // ================================================================ the look of each place (sky, fog, light, textures, music)
  const THEMES = {
    park: { sky: [[0, '#1e5ad0'], [0.7, '#80b8f0'], [1, '#d4ecfa']], fog: 0xc4dcf0, fogN: 70, fogF: 300, amb: 0.62, sun: 0.9, skyL: 0xf0f8ff, gndL: 0x4a6a2a,
      road: 'asphalt', verge: 'grass', ground: 'grass', kerb: ['#e8261c', '#f4f4f4'], wall: 'hedge', pano: 'hills', song: 0, groundY: -0.05 },
    beach: { sky: [[0, '#1a8ae0'], [0.7, '#7ad0f8'], [1, '#e0f6ff']], fog: 0xcfeefa, fogN: 80, fogF: 320, amb: 0.68, sun: 0.95, skyL: 0xffffff, gndL: 0xb09a5a,
      road: 'sandroad', verge: 'sand', ground: 'sand', kerb: ['#2a8ae0', '#f4f4f4'], wall: 'rocks', pano: 'sea', song: 1, sea: 1 },
    snow: { sky: [[0, '#5a7ab8'], [0.7, '#b8c8e0'], [1, '#e8eef6']], fog: 0xdce4ef, fogN: 50, fogF: 240, amb: 0.7, sun: 0.7, skyL: 0xe8f0ff, gndL: 0x8a9ab8,
      road: 'snowroad', verge: 'snow', ground: 'snow', kerb: ['#2a5ad0', '#f4f4f4'], wall: 'snowbank', pano: 'peaks', song: 2, snowing: 1 },
    spooky: { sky: [[0, '#0a0618'], [0.6, '#2a1a4a'], [1, '#4a3a6a']], fog: 0x2a2040, fogN: 30, fogF: 170, amb: 0.42, sun: 0.5, skyL: 0x8a8ad8, gndL: 0x1a1a10, sunCol: 0xb0b8ff,
      road: 'mudroad', verge: 'deadgrass', ground: 'deadgrass', kerb: ['#6a3a9a', '#3a8a3a'], wall: 'fence', pano: 'manor', song: 3, night: 1 },
    desert: { sky: [[0, '#3a7ad8'], [0.6, '#a8c8e8'], [1, '#f8e0b0']], fog: 0xf0dcb8, fogN: 80, fogF: 330, amb: 0.65, sun: 1.0, skyL: 0xfff0d8, gndL: 0xa05a2a, sunCol: 0xfff0d0,
      road: 'desertroad', verge: 'redsand', ground: 'redsand', kerb: ['#e87a1a', '#f4f4f4'], wall: 'boulders', pano: 'mesas', song: 4 },
    castle: { sky: [[0, '#1a0404'], [0.6, '#5a140a'], [1, '#c84a1a']], fog: 0x6a2410, fogN: 40, fogF: 220, amb: 0.5, sun: 0.65, skyL: 0xffc8a0, gndL: 0x401008, sunCol: 0xffb080,
      road: 'cobble', verge: 'flag', ground: 'lava', kerb: ['#f0c000', '#2a2a2a'], wall: 'battlement', pano: 'volcano', song: 5, lava: 1 },
    jungle: { sky: [[0, '#2a7ac8'], [0.7, '#9ad0e0'], [1, '#e0f0d8']], fog: 0xb0d0b0, fogN: 50, fogF: 250, amb: 0.62, sun: 0.85, skyL: 0xf0fff0, gndL: 0x2a4a1a,
      road: 'dirtroad', verge: 'jungle', ground: 'jungle', kerb: ['#e8c21a', '#2a7a2a'], wall: 'bush', pano: 'jungle', song: 6 },
    space: { sky: [[0, '#000008'], [0.7, '#0a0a2a'], [1, '#1a0a3a']], fog: 0x0a0a20, fogN: 120, fogF: 420, amb: 0.7, sun: 0.7, skyL: 0xc8c8ff, gndL: 0x3a1a5a,
      road: 'rainbow', verge: null, ground: null, kerb: null, wall: 'rail', pano: 'stars', song: 7, space: 1 },
    tin: { sky: [[0, '#2a5ad0'], [0.7, '#8ac0f0'], [1, '#d8ecfa']], fog: 0xc4dcf0, fogN: 90, fogF: 300, amb: 0.68, sun: 0.85, skyL: 0xffffff, gndL: 0x6a5a3a, pano: 'kitchen', song: 8 },
    blocks: { sky: [[0, '#5a2ad0'], [0.7, '#c08af0'], [1, '#f0d8fa']], fog: 0xe0c8f0, fogN: 90, fogF: 300, amb: 0.68, sun: 0.85, skyL: 0xffffff, gndL: 0x5a3a6a, pano: 'toys', song: 8 },
  };

  // ================================================================ the tracks: [x, z, height, width, bank] control points (a closed loop, metres)
  // f = a fraction of the way round a lap; lat = metres right (+) or left (-) of the middle of the road
  const TRACKS = [
    { n: 'BISCUIT CIRCUIT', th: 'park', cup: 0, par: 92,
      pts: [[0, -47, 0, 14], [47, -48, 0, 14], [82, -39, 0, 14], [94, -12, 1, 14], [78, 12, 2, 14], [47, 16, 3, 14], [31, 35, 3, 14], [43, 62, 2, 14], [78, 70, 2, 14], [90, 94, 3, 14], [62, 113, 4, 14], [16, 109, 4, 14], [-23, 94, 3, 14], [-55, 101, 4, 14], [-86, 86, 3, 14], [-94, 47, 2, 14], [-74, 20, 1, 14], [-86, -16, 0, 14], [-70, -43, 0, 14], [-35, -51, 0, 14]],
      pads: [[0.2, -2], [0.47, 2.5], [0.83, 0]], boxes: [0.12, 0.42, 0.7], ramps: [[0.6, 7, 1.7]], verge: 9, haz: [{ k: 'mole', f: 0.3, n: 3 }, { k: 'mole', f: 0.9, n: 3 }],
      short: [[43, 62], [62, 113]], props: 'park' },
    { n: 'SANDCASTLE BAY', th: 'beach', cup: 0, par: 90,
      pts: [[0, -55, 0, 14], [55, -55, 0, 14], [94, -31, 0, 14], [98, 8, 1, 14], [70, 31, 2, 14], [31, 23, 2, 14], [0, 39, 1, 14], [-8, 74, 1, 14], [23, 98, 2, 14], [8, 125, 1, 14], [-39, 121, 0, 14], [-74, 94, 0, 14], [-70, 55, 1, 14], [-101, 23, 1, 14], [-94, -23, 0, 14], [-55, -55, 0, 14]],
      pads: [[0.15, 0], [0.5, -2.5], [0.78, 2]], boxes: [0.08, 0.36, 0.66], ramps: [[0.9, 8, 2.2]], verge: 10, haz: [{ k: 'crab', f: 0.28, n: 2 }, { k: 'crab', f: 0.6, n: 3 }], props: 'beach' },
    { n: 'FROSTBITE PASS', th: 'snow', cup: 0, par: 104,
      pts: [[0, -56, 0, 14], [49, -60, 0, 14], [91, -42, 3, 14], [105, -7, 8, 14], [84, 21, 12, 13], [49, 14, 14, 13], [28, 35, 16, 13], [42, 67, 18, 13], [77, 77, 20, 14], [91, 105, 22, 14], [63, 130, 22, 14], [21, 119, 20, 14], [-14, 98, 16, 14], [-42, 112, 12, 14], [-77, 98, 8, 14], [-84, 63, 6, 14], [-56, 42, 5, 14], [-77, 7, 3, 14], [-70, -35, 1, 14], [-35, -56, 0, 14]],
      pads: [[0.1, 0], [0.4, 2], [0.86, -2]], boxes: [0.15, 0.38, 0.62, 0.8], verge: 8, tunnel: [[0.49, 0.58]], ice: [[0.2, 0.25], [0.64, 0.7]],
      haz: [{ k: 'snowman', f: 0.32, lats: [-3.5, 3] }, { k: 'snowman', f: 0.74, lats: [-4, 0.5, 4.5] }, { k: 'snowman', f: 0.9, lats: [2] }], props: 'snow' },
    { n: 'SPOOKY MANOR', th: 'spooky', cup: 0, par: 98,
      pts: [[0, -45, 0, 13], [45, -45, 0, 13], [68, -23, 0, 13], [60, 8, 0, 13], [30, 15, 0, 13], [15, 38, 1, 13], [30, 68, 2, 13], [68, 75, 2, 13], [83, 105, 2, 13], [53, 128, 2, 13], [0, 120, 1, 13], [-30, 98, 0, 13], [-23, 68, 0, 12], [-53, 45, 0, 12], [-83, 60, 0, 12], [-98, 30, 0, 13], [-75, 0, 0, 13], [-83, -30, 0, 13], [-45, -49, 0, 13]],
      pads: [[0.18, 0], [0.55, 2], [0.93, -2]], boxes: [0.1, 0.36, 0.6, 0.84], verge: 8, tunnel: [[0.42, 0.49]], drops: [[0.66, 0.79, 0]], plank: [[0.66, 0.79]],
      haz: [{ k: 'ghost', f: 0.27, n: 2 }, { k: 'ghost', f: 0.57, n: 2 }, { k: 'ghost', f: 0.88, n: 3 }], props: 'spooky' },
    { n: 'CACTUS CANYON', th: 'desert', cup: 1, par: 100,
      pts: [[0, -65, 0, 15], [72, -65, 0, 15], [115, -43, 2, 15], [122, 0, 6, 15], [108, 43, 10, 15], [115, 86, 10, 15], [86, 122, 8, 15], [36, 115, 6, 15], [0, 86, 4, 15], [-29, 108, 6, 15], [-72, 115, 8, 15], [-108, 86, 8, 15], [-115, 29, 6, 15], [-94, -14, 3, 15], [-101, -50, 1, 15], [-58, -68, 0, 15]],
      pads: [[0.22, 0], [0.5, -3], [0.8, 3]], boxes: [0.1, 0.36, 0.6, 0.86], verge: 10, ramps: [[0.262, 10, 3]], gap: [0.276, 0.293], trench: [0.276, 0.293, 30], tunnel: [[0.62, 0.69]],
      haz: [{ k: 'weed', f: 0.42, n: 2 }, { k: 'weed', f: 0.9, n: 2 }], props: 'desert' },
    { n: 'CASTLE KRUMBLE', th: 'castle', cup: 1, par: 98,
      pts: [[0, -60, 0, 13], [50, -60, 0, 13], [75, -52, 0, 13], [80, -30, 1, 13], [74, -5, 4, 13], [45, 0, 6, 13], [30, 15, 6, 13], [33, 38, 6, 13], [55, 48, 6, 13], [82, 55, 5, 13], [90, 80, 4, 13], [78, 102, 2, 13], [40, 106, 0, 13], [-30, 104, 0, 13], [-48, 90, 1, 13], [-50, 70, 2, 13], [-65, 58, 3, 13], [-85, 52, 4, 13], [-95, 30, 4, 13], [-92, -10, 3, 13], [-82, -40, 2, 13], [-55, -60, 0, 13]],
      pads: [[0.12, 0], [0.45, 0], [0.92, 2]], boxes: [0.08, 0.33, 0.58, 0.82], verge: 6, drops: [[0.3, 0.42, 0], [0.7, 0.78, 1]], plank: [[0.3, 0.42]], tunnel: [[0.5, 0.6]],
      haz: [{ k: 'krumbler', f: 0.2, lats: [-3.2, 3.2] }, { k: 'krumbler', f: 0.55, lats: [0] }, { k: 'krumbler', f: 0.86, lats: [-3.2, 3.2] }], props: 'castle' },
    { n: 'DINO JUNGLE', th: 'jungle', cup: 1, par: 102,
      pts: [[0, -65, 0, 14], [58, -68, 2, 14], [101, -50, 6, 14], [108, -14, 10, 14], [79, 14, 8, 14], [79, 50, 4, 14], [108, 79, 6, 14], [86, 115, 10, 14], [43, 122, 12, 14], [7, 101, 8, 14], [-22, 122, 4, 14], [-65, 115, 2, 14], [-94, 79, 4, 14], [-79, 43, 8, 14], [-108, 14, 10, 14], [-101, -29, 6, 14], [-65, -58, 2, 14]],
      pads: [[0.16, 0], [0.47, 2], [0.88, -2]], boxes: [0.1, 0.34, 0.62, 0.84], verge: 9, drops: [[0.37, 0.43, 0]], plank: [[0.37, 0.43]], trench: [0.37, 0.43, 7], ramps: [[0.53, 8, 2]],
      mud: [[0.22, -3, 3.5], [0.76, 3, 3.5], [0.79, -4, 3]], haz: [{ k: 'boulder', f: 0.68, n: 2 }], props: 'jungle' },
    { n: 'COSMIC CAUSEWAY', th: 'space', cup: 1, par: 112,
      pts: [[-51, -51, 20, 16, 0], [0, 0, 22, 16, 0], [51, 51, 26, 16, 0], [94, 81, 32, 16, 0], [140, 60, 38, 16, -14], [153, 0, 42, 16, -18], [119, -51, 44, 16, -12], [60, -53, 42, 16, 0], [0, 0, 40, 16, 0], [-51, 51, 36, 16, 0], [-94, 81, 30, 16, 0], [-140, 60, 26, 16, 14], [-153, 0, 22, 16, 18], [-119, -51, 20, 16, 12], [-85, -64, 20, 16, 0]],
      pads: [[0.04, 0], [0.18, -3], [0.18, 3], [0.36, 0], [0.55, 0], [0.7, -3], [0.7, 3], [0.86, 0]], boxes: [0.1, 0.3, 0.5, 0.78], verge: 0, drops: [[0, 1, 0]], rails: 1, ramps: [[0.47, 8, 2.4]],
      haz: [{ k: 'star', f: 0.25, n: 2 }, { k: 'star', f: 0.63, n: 2 }], props: 'space' },
  ];
  const CUPS = [{ n: 'BISCUIT CUP', t: [0, 1, 2, 3], col: '#e8a83a' }, { n: 'STAR CUP', t: [4, 5, 6, 7], col: '#ffe14a' }];
  const ARENAS = [
    { n: 'BISCUIT TIN', th: 'tin', shape: 'round', r: 52, obs: [[0, 0, 7, 'jam'], [26, 14, 5, 'bis'], [-26, 14, 5, 'bis'], [0, -29, 5, 'bis'], [22, -22, 3.5, 'cus'], [-22, -22, 3.5, 'cus'], [0, 30, 3.5, 'cus']],
      boxes: [[14, 0], [-14, 0], [0, 15], [0, -15], [36, 0], [-36, 0], [0, 40], [0, -42], [26, 30], [-26, 30], [26, -32], [-26, -32]] },
    { n: 'BLOCK PARTY', th: 'blocks', shape: 'square', r: 50, obs: [[-22, -22, 5, 'blk'], [22, -22, 5, 'blk'], [-22, 22, 5, 'blk'], [22, 22, 5, 'blk'], [0, 0, 6, 'tower'], [0, 36, 3, 'ball'], [0, -36, 3, 'ball'], [36, 0, 3, 'ball'], [-36, 0, 3, 'ball']],
      boxes: [[0, 14], [0, -14], [14, 0], [-14, 0], [36, 36], [-36, 36], [36, -36], [-36, -36], [0, 26], [0, -26], [26, 0], [-26, 0]] },
  ];

  // ================================================================ the items
  // PEEL drop it (or throw it forward with UP), BOOMER a green ball that bounces off walls, HOMER a red one that chases the
  // kart in front, FAKE a ? box that isn't, TURBO, TRIPLE TURBO, SPLAT ink on everybody ahead, SUPERSTAR, THUNDER shrinks
  // everybody else, SKY BOMB flies to whoever is winning
  const ITEMS = ['PEEL', 'BOOMER', 'FAKE', 'HOMER', 'TURBO', 'TRIPLE', 'SPLAT', 'STAR', 'THUNDER', 'BOMB'];
  const ODDS = [ // by place: 1st, 2-3, 4-5, 6-7, 8th
    [36, 30, 20, 8, 6, 0, 0, 0, 0, 0], [16, 22, 10, 22, 14, 4, 10, 2, 0, 0], [6, 12, 5, 24, 18, 12, 10, 7, 2, 4], [0, 5, 0, 20, 18, 22, 8, 15, 6, 6], [0, 0, 0, 14, 14, 26, 5, 23, 10, 8]];
  const BATTLE_ODDS = [22, 30, 12, 18, 10, 0, 0, 8, 0, 0];
  const ITEM_INFO = { PEEL: 'DROP IT BEHIND YOU', BOOMER: 'BOUNCES OFF WALLS', FAKE: 'A ? BOX THAT ISN\'T', HOMER: 'CHASES THE KART IN FRONT', TURBO: 'A BIG BOOST', TRIPLE: 'THREE BOOSTS', SPLAT: 'INK ON EVERYONE AHEAD', STAR: 'GO FASTER, SPIN EVERYONE', THUNDER: 'SHRINKS EVERYBODY ELSE', BOMB: 'FLIES TO THE LEADER' };

  // ================================================================ music (16th-note steps, MIDI numbers, 0 rest, -1 hold)
  const SONGS = [
    { bpm: 152, wave: 'square', vol: 0.04, bassWave: 'triangle', drums: 'o.x.o.x.o.x.oox.', // 0 park: a bouncy march
      lead: [72, -1, 76, 79, -1, 76, 81, -1, 79, 76, -1, 74, 72, -1, 0, 0, 74, -1, 77, 81, -1, 77, 84, -1, 81, 79, -1, 77, 76, -1, 0, 0, 72, -1, 76, 79, -1, 76, 81, -1, 79, 76, -1, 74, 72, -1, 76, 77, 79, -1, 77, 76, 74, -1, 76, 74, 72, -1, -1, -1, 0, 0],
      bass: [48, 0, 48, 55, 0, 55, 53, 0, 53, 48, 0, 48, 55, 0, 55, 0, 50, 0, 50, 57, 0, 57, 53, 0, 53, 55, 0, 55, 43, 0, 43, 0] },
    { bpm: 126, wave: 'triangle', vol: 0.06, bassWave: 'square', drums: 'o..xo.x.o..xo.xx', // 1 beach: steel-drum calypso
      lead: [79, 0, 76, 79, 0, 81, 79, 76, 72, 0, 74, 76, 0, 0, 0, 0, 77, 0, 74, 77, 0, 79, 77, 74, 71, 0, 72, 74, 0, 0, 0, 0, 79, 0, 76, 79, 0, 84, 83, 81, 79, 0, 77, 76, 74, 0, 72, 0, 74, 0, 76, 0, 77, 76, 74, 71, 72, -1, -1, -1, 0, 0, 0, 0],
      bass: [48, 0, 0, 55, 0, 0, 52, 0, 48, 0, 0, 55, 0, 0, 52, 0, 43, 0, 0, 50, 0, 0, 47, 0, 43, 0, 0, 50, 0, 0, 55, 0] },
    { bpm: 132, wave: 'sine', vol: 0.07, bassWave: 'triangle', drums: 'o...x...o...x..x', // 2 snow: sleigh bells and a waltzy tinkle
      lead: [84, 0, 83, 0, 79, 0, 76, 0, 79, -1, -1, 0, 81, 0, 79, 0, 76, 0, 74, 0, 72, -1, -1, 0, 74, 0, 76, 0, 77, -1, -1, 0, 81, 0, 79, 0, 77, 0, 76, -1, -1, 0, 74, 0, 72, 0, 71, 0, 72, -1, -1, -1, 0, 0, 79, 0, 81, 0, 83, 0, 84, -1, -1, 0],
      bass: [48, 0, 55, 0, 52, 0, 55, 0, 45, 0, 52, 0, 48, 0, 52, 0, 41, 0, 48, 0, 45, 0, 48, 0, 43, 0, 50, 0, 47, 0, 50, 0] },
    { bpm: 118, wave: 'square', vol: 0.04, bassWave: 'triangle', drums: 'o.....x.o..o..x.', // 3 spooky: a creepy minor plod
      lead: [69, 0, 72, 0, 76, 0, 75, -1, 0, 0, 72, 0, 69, 0, 68, -1, 69, 0, 72, 0, 76, 0, 77, -1, 76, 0, 75, 0, 72, -1, -1, 0, 74, 0, 77, 0, 81, 0, 80, -1, 0, 0, 77, 0, 74, 0, 73, -1, 76, 0, 75, 0, 74, 0, 73, 0, 72, 0, 71, 0, 69, -1, -1, 0],
      bass: [45, 0, 45, 0, 44, 0, 44, 0, 43, 0, 43, 0, 42, 0, 41, 0, 38, 0, 38, 0, 40, 0, 40, 0, 45, 0, 44, 0, 40, 0, 40, 0] },
    { bpm: 140, wave: 'sawtooth', vol: 0.035, bassWave: 'triangle', drums: 'o..x..o.o..x.x..', // 4 desert: a twangy western gallop
      lead: [64, 0, 0, 67, 0, 69, 71, -1, 0, 69, 67, 0, 64, -1, -1, 0, 62, 0, 0, 64, 0, 67, 69, -1, 0, 67, 64, 0, 62, -1, -1, 0, 64, 0, 0, 67, 0, 69, 71, -1, 0, 74, 72, 0, 71, -1, 69, 0, 67, 0, 69, 0, 67, 0, 64, 0, 62, 0, 64, -1, -1, -1, 0, 0],
      bass: [40, 0, 47, 0, 40, 0, 47, 0, 38, 0, 45, 0, 38, 0, 45, 0, 40, 0, 47, 0, 43, 0, 50, 0, 45, 0, 43, 0, 40, 0, 47, 0] },
    { bpm: 146, wave: 'sawtooth', vol: 0.035, bassWave: 'square', drums: 'o.o.x.o.o.o.x.xx', // 5 castle: a doomy organ riff
      lead: [62, 0, 65, 0, 69, 0, 68, 0, 65, 0, 62, 0, 61, -1, 0, 0, 62, 0, 65, 0, 69, 0, 70, 0, 69, 0, 65, 0, 68, -1, 0, 0, 74, 0, 72, 0, 70, 0, 69, 0, 70, 0, 69, 0, 67, 0, 65, 0, 64, 0, 65, 0, 67, 0, 69, 0, 62, -1, -1, -1, 0, 0, 0, 0],
      bass: [38, 38, 0, 38, 37, 37, 0, 37, 36, 36, 0, 36, 35, 35, 0, 35, 34, 34, 0, 34, 33, 33, 0, 33, 38, 0, 45, 0, 33, 0, 37, 0] },
    { bpm: 136, wave: 'triangle', vol: 0.065, bassWave: 'square', drums: 'o.xo.xo.o.xo.xxo', // 6 jungle: bongos and a marimba
      lead: [72, 0, 74, 0, 76, 79, 0, 76, 74, 0, 72, 0, 69, 0, 0, 0, 72, 0, 74, 0, 76, 79, 0, 81, 79, 0, 76, 0, 74, 0, 0, 0, 81, 0, 79, 0, 76, 74, 0, 72, 74, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 69, 72, 0, 74, 72, -1, -1, -1, 0, 0, 0, 0],
      bass: [45, 0, 52, 0, 45, 0, 52, 0, 41, 0, 48, 0, 41, 0, 48, 0, 43, 0, 50, 0, 43, 0, 50, 0, 40, 0, 47, 0, 45, 0, 52, 0] },
    { bpm: 150, wave: 'square', vol: 0.04, bassWave: 'sawtooth', drums: 'o.x.o.xxo.x.o.xo', // 7 space: a sparkly disco climb
      lead: [76, 79, 83, 88, 0, 83, 79, 76, 77, 81, 84, 89, 0, 84, 81, 77, 79, 83, 86, 91, 0, 86, 83, 79, 76, -1, 0, 79, 0, 83, 84, 0, 76, 79, 83, 88, 0, 83, 79, 76, 74, 77, 81, 86, 0, 81, 77, 74, 72, 76, 79, 84, 0, 79, 76, 72, 71, -1, -1, -1, 0, 0, 0, 0],
      bass: [40, 52, 40, 52, 41, 53, 41, 53, 43, 55, 43, 55, 40, 52, 40, 52, 40, 52, 40, 52, 38, 50, 38, 50, 36, 48, 36, 48, 35, 47, 35, 47] },
    { bpm: 160, wave: 'square', vol: 0.04, bassWave: 'triangle', drums: 'o.x.oox.o.x.oxxx', // 8 battle: frantic
      lead: [76, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 74, -1, 0, 0, 76, 0, 76, 0, 79, 0, 81, 0, 83, 0, 81, 0, 79, -1, 0, 0],
      bass: [45, 0, 57, 0, 45, 0, 57, 0, 43, 0, 55, 0, 43, 0, 55, 0] },
    { bpm: 120, wave: 'square', vol: 0.045, bassWave: 'triangle', drums: 'o...x...o.o.x...', // 9 title: a big happy theme
      lead: [72, -1, 72, 74, 76, -1, 72, -1, 79, -1, -1, -1, 76, -1, 0, 0, 77, -1, 77, 76, 74, -1, 72, -1, 74, -1, -1, -1, 0, 0, 0, 0, 72, -1, 72, 74, 76, -1, 79, -1, 84, -1, -1, -1, 81, -1, 79, -1, 77, -1, 76, -1, 74, -1, 76, -1, 72, -1, -1, -1, 0, 0, 0, 0],
      bass: [48, 0, 55, 0, 52, 0, 55, 0, 48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 50, 0, 55, 0, 43, 0, 47, 0, 50, 0, 55, 0, 48, 0, 55, 0, 52, 0, 55, 0, 45, 0, 52, 0, 48, 0, 52, 0, 41, 0, 48, 0, 43, 0, 50, 0, 48, 0, 43, 0, 36, 0, 0, 0] },
    { bpm: 100, wave: 'triangle', vol: 0.06, bassWave: 'triangle', drums: 'o.......o.......', // 10 menus: a laid-back shuffle
      lead: [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 0, 77, 0, 72, 0, 76, 0, 79, 0, 84, 0, 83, -1, 79, -1, 74, -1, 0, 0],
      bass: [48, 0, 0, 0, 55, 0, 0, 0, 50, 0, 0, 0, 55, 0, 0, 0, 48, 0, 0, 0, 52, 0, 0, 0, 43, 0, 0, 0, 47, 0, 0, 0] },
  ];
  const fast = s => Object.assign({}, s, { bpm: Math.round(s.bpm * 1.12) }); // the final lap

  // ================================================================ textures (painted in code, small and smooth: the N64 way)
  function noise(g, w, h, n, cols, sz) { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; const s = sz || 2; g.fillRect(Math.random() * w, Math.random() * h, s, s); } }
  function blot(g, w, h, n, col, r0, r1) { for (let i = 0; i < n; i++) { const x = Math.random() * w, y = Math.random() * h, r = r0 + Math.random() * (r1 - r0); for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2); } } }
  const PAINT = {
    asphalt(g, w, h) { g.fillStyle = '#6a6a72'; g.fillRect(0, 0, w, h); blot(g, w, h, 10, 'rgba(40,40,50,.25)', 6, 14); noise(g, w, h, 500, ['#7a7a84', '#5a5a62', '#84848c'], 1); g.fillStyle = '#e8e8e8'; g.fillRect(w / 2 - 1, 0, 2, h / 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h); },
    grass(g, w, h) { g.fillStyle = '#3e9a2c'; g.fillRect(0, 0, w, h); g.fillStyle = '#48a834'; g.fillRect(0, 0, w, h / 2); blot(g, w, h, 12, 'rgba(30,90,20,.45)', 4, 12); blot(g, w, h, 8, 'rgba(120,200,60,.35)', 3, 9); noise(g, w, h, 160, ['#2e7a20', '#5ab840'], 1); },
    sand(g, w, h) { g.fillStyle = '#ead290'; g.fillRect(0, 0, w, h); blot(g, w, h, 10, 'rgba(200,160,90,.4)', 5, 14); g.strokeStyle = 'rgba(190,150,80,.35)'; for (let y = 4; y < h; y += 8) { g.beginPath(); for (let x = 0; x <= w; x += 4) g.lineTo(x, y + Math.sin(x / w * TAU * 2) * 2); g.stroke(); } noise(g, w, h, 200, ['#f8e4a8', '#d0b070'], 1); },
    sandroad(g, w, h) { g.fillStyle = '#d4b06a'; g.fillRect(0, 0, w, h); blot(g, w, h, 8, 'rgba(150,110,50,.35)', 5, 12); g.fillStyle = 'rgba(120,90,40,.3)'; for (const x of [0.25, 0.32, 0.68, 0.75]) g.fillRect(x * w, 0, 2, h); noise(g, w, h, 300, ['#e4c482', '#b8945a'], 1); },
    snow(g, w, h) { g.fillStyle = '#eef3fa'; g.fillRect(0, 0, w, h); blot(g, w, h, 12, 'rgba(160,180,220,.35)', 5, 14); noise(g, w, h, 200, ['#ffffff', '#d8e2f0'], 1); },
    snowroad(g, w, h) { g.fillStyle = '#c4cede'; g.fillRect(0, 0, w, h); blot(g, w, h, 10, 'rgba(120,130,160,.3)', 5, 12); g.fillStyle = 'rgba(100,110,140,.35)'; for (const x of [0.22, 0.3, 0.7, 0.78]) g.fillRect(x * w, 0, 3, h); noise(g, w, h, 300, ['#e4ecf6', '#a8b4c8'], 1); },
    ice(g, w, h) { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#bfe8ff'); gr.addColorStop(0.5, '#8ad0f8'); gr.addColorStop(1, '#d8f4ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(Math.random() * w, Math.random() * h); g.lineTo(Math.random() * w, Math.random() * h); g.stroke(); } },
    mudroad(g, w, h) { g.fillStyle = '#4a3c46'; g.fillRect(0, 0, w, h); blot(g, w, h, 10, 'rgba(30,20,30,.4)', 5, 12); blot(g, w, h, 6, 'rgba(110,90,110,.3)', 3, 8); noise(g, w, h, 300, ['#5a4a56', '#3a2e38'], 1); },
    deadgrass(g, w, h) { g.fillStyle = '#3a4426'; g.fillRect(0, 0, w, h); blot(g, w, h, 12, 'rgba(20,30,10,.5)', 4, 12); blot(g, w, h, 8, 'rgba(110,100,60,.35)', 3, 9); noise(g, w, h, 160, ['#2a3418', '#5a5a34'], 1); },
    planks(g, w, h) { g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = y % 16 ? '#5a3c20' : '#7a5632'; g.fillRect(0, y, w, 7); g.fillStyle = '#2a1a0a'; g.fillRect(0, y + 7, w, 1); g.fillRect((y * 7) % w, y, 1, 7); } noise(g, w, h, 120, ['#8a6a42', '#3a2412'], 1); },
    desertroad(g, w, h) { g.fillStyle = '#a8603a'; g.fillRect(0, 0, w, h); blot(g, w, h, 10, 'rgba(90,40,20,.35)', 5, 12); noise(g, w, h, 300, ['#b8704a', '#8a4a2a', '#c88458'], 1); g.fillStyle = 'rgba(255,230,180,.5)'; g.fillRect(w / 2 - 1, 0, 2, h / 2); },
    redsand(g, w, h) { g.fillStyle = '#d8945a'; g.fillRect(0, 0, w, h); blot(g, w, h, 12, 'rgba(160,80,40,.35)', 5, 14); noise(g, w, h, 200, ['#e8a86a', '#b8743a'], 1); },
    cobble(g, w, h) { g.fillStyle = '#5a5a60'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = (y / 8 % 2) * 4; x < w; x += 8) { const c = 100 + Math.random() * 40 | 0; g.fillStyle = `rgb(${c},${c - 4},${c - 10})`; g.fillRect(x + 1, y + 1, 6, 6); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 1, y + 1, 6, 1); } },
    flag(g, w, h) { g.fillStyle = '#3a3438'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 8; x < w; x += 16) { const c = 70 + Math.random() * 30 | 0; g.fillStyle = `rgb(${c},${c - 6},${c - 8})`; g.fillRect(x + 1, y + 1, 14, 14); } },
    lava(g, w, h) { g.fillStyle = '#c82a0a'; g.fillRect(0, 0, w, h); blot(g, w, h, 14, 'rgba(255,200,40,.7)', 4, 10); blot(g, w, h, 10, 'rgba(90,10,0,.6)', 4, 12); },
    dirtroad(g, w, h) { g.fillStyle = '#8a6a42'; g.fillRect(0, 0, w, h); blot(g, w, h, 10, 'rgba(60,40,20,.35)', 5, 12); noise(g, w, h, 200, ['#9a7a52', '#6a4e30'], 1); noise(g, w, h, 30, ['#b0a090', '#70685a'], 3); },
    jungle(g, w, h) { g.fillStyle = '#2a6a26'; g.fillRect(0, 0, w, h); blot(g, w, h, 14, 'rgba(10,50,10,.5)', 4, 12); blot(g, w, h, 10, 'rgba(90,170,50,.4)', 3, 9); noise(g, w, h, 160, ['#1a4a18', '#4a9a3a'], 2); },
    mud(g, w, h) { g.fillStyle = '#5a3e22'; g.fillRect(0, 0, w, h); blot(g, w, h, 10, 'rgba(30,18,8,.5)', 4, 10); blot(g, w, h, 6, 'rgba(140,110,70,.4)', 2, 5); },
    rainbow(g, w, h) { const C = ['#ff3a3a', '#ff9a1a', '#ffe14a', '#3ad04a', '#2ab0ff', '#5a5aff', '#c03ae0']; const k = w / C.length; C.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * k, 0, k + 1, h); }); g.fillStyle = 'rgba(255,255,255,.35)'; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 3); g.fillStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i < C.length; i++) g.fillRect(i * k, 0, 1, h); },
    water(g, w, h) { g.fillStyle = '#1a6ac8'; g.fillRect(0, 0, w, h); blot(g, w, h, 12, 'rgba(120,210,255,.45)', 3, 9); blot(g, w, h, 10, 'rgba(10,40,120,.4)', 4, 10); },
    swamp(g, w, h) { g.fillStyle = '#1a3a2a'; g.fillRect(0, 0, w, h); blot(g, w, h, 12, 'rgba(80,140,60,.45)', 3, 9); blot(g, w, h, 8, 'rgba(0,10,0,.5)', 4, 10); },
    rock(g, w, h) { g.fillStyle = '#8a7a6a'; g.fillRect(0, 0, w, h); blot(g, w, h, 12, 'rgba(60,50,40,.45)', 4, 12); blot(g, w, h, 8, 'rgba(180,170,150,.35)', 3, 8); noise(g, w, h, 160, ['#6a5a4a', '#a89a88'], 1); },
    mottle(g, w, h) { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h); blot(g, w, h, 14, 'rgba(255,255,255,.6)', 3, 8); blot(g, w, h, 12, 'rgba(150,150,150,.35)', 3, 9); },
    tinfloor(g, w, h) { g.fillStyle = '#c8ccd4'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,90,110,.35)'; for (let r = 4; r < w; r += 10) { g.beginPath(); g.arc(w / 2, h / 2, r, 0, TAU); g.stroke(); } blot(g, w, h, 8, 'rgba(255,255,255,.5)', 4, 10); },
    rug(g, w, h) { g.fillStyle = '#d84a8a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { g.fillStyle = ['#f0c000', '#2ab0e0', '#3ad04a', '#d84a8a'][i]; g.fillRect(i * 8, i * 8, w - i * 16, h - i * 16); } g.fillStyle = '#fff'; g.fillRect(w / 2 - 3, h / 2 - 3, 6, 6); },
  };
  // the far-off scenery painted round the sky (horizon at hy)
  function hillsAt(g, w, hy, col, amp, n, seed, base) { g.fillStyle = col; g.beginPath(); g.moveTo(0, hy + 2); for (let x = 0; x <= w; x += 4) { const t = x / w * TAU; g.lineTo(x, hy - base - amp * (0.5 + 0.3 * Math.sin(t * n + seed) + 0.2 * Math.sin(t * n * 2.3 + seed * 2))); } g.lineTo(w, hy + 2); g.fill(); }
  const PANO = {
    hills(g, w, h, hy) { cloud(g, w, hy, 8); hillsAt(g, w, hy, '#7aa8c8', 26, 3, 1, 6); hillsAt(g, w, hy, '#4a8a4a', 16, 5, 2, 2); hillsAt(g, w, hy, '#3a7a3a', 9, 9, 4, 0); for (let i = 0; i < 40; i++) { const x = Math.random() * w; g.fillStyle = '#2a6a2a'; g.beginPath(); g.arc(x, hy - 4, 3, 0, TAU); g.fill(); } },
    sea(g, w, h, hy) { cloud(g, w, hy, 10); g.fillStyle = '#2a8ad8'; g.fillRect(0, hy - 6, w, 8); g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 60; i++) g.fillRect(Math.random() * w, hy - 6 + Math.random() * 6, 4, 1); for (const x of [60, 300, 420]) { g.fillStyle = '#6a9a5a'; g.beginPath(); g.ellipse(x, hy - 6, 30, 8, 0, Math.PI, 0); g.fill(); } g.fillStyle = '#fff8d0'; g.beginPath(); g.arc(200, hy - 60, 14, 0, TAU); g.fill(); },
    peaks(g, w, h, hy) { cloud(g, w, hy, 5); for (const [col, a, n, s, b] of [['#8a9ac0', 70, 4, 1, 4], ['#6a7aa8', 46, 7, 3, 0]]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, hy + 2); for (let x = 0; x <= w; x += 8) { const t = x / w * TAU; const y = hy - b - a * Math.abs(Math.sin(t * n + s)) * (0.6 + 0.4 * Math.sin(t * 3 + s)); g.lineTo(x, y); } g.lineTo(w, hy + 2); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.85)'; for (let x = 0; x < w; x += 8) { const t = x / w * TAU, y = hy - 4 - 70 * Math.abs(Math.sin(t * 4 + 1)) * (0.6 + 0.4 * Math.sin(t * 3 + 1)); if (hy - y > 45) g.fillRect(x - 3, y, 7, 8); } },
    manor(g, w, h, hy) { g.fillStyle = '#e8e8c8'; g.beginPath(); g.arc(120, hy - 70, 16, 0, TAU); g.fill(); g.fillStyle = '#4a3a6a'; g.beginPath(); g.arc(114, hy - 74, 15, 0, TAU); g.fill(); for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(255,255,255,' + Math.random() * 0.8 + ')'; g.fillRect(Math.random() * w, Math.random() * (hy - 30), 1, 1); }
      hillsAt(g, w, hy, '#1a1028', 20, 4, 1, 4); g.fillStyle = '#100a18'; for (let x = 0; x < w; x += 18) { g.fillRect(x, hy - 20 - (x * 13 % 9), 2, 22); g.fillRect(x - 4, hy - 16 - (x * 7 % 6), 10, 1); } },
    mesas(g, w, h, hy) { g.fillStyle = '#fff4c0'; g.beginPath(); g.arc(380, hy - 50, 12, 0, TAU); g.fill(); hillsAt(g, w, hy, '#d8a070', 8, 3, 2, 2); g.fillStyle = '#b8603a'; for (let i = 0; i < 9; i++) { const x = i * w / 9 + 20, ww = 24 + (i * 37 % 30), hh = 18 + (i * 23 % 26); g.fillRect(x, hy - hh, ww, hh); g.fillStyle = '#8a4028'; g.fillRect(x, hy - hh, ww, 3); g.fillStyle = '#b8603a'; } },
    volcano(g, w, h, hy) { for (const [x, s] of [[100, 1], [330, 0.7]]) { g.fillStyle = '#2a0a06'; g.beginPath(); g.moveTo(x - 90 * s, hy + 2); g.lineTo(x - 14 * s, hy - 70 * s); g.lineTo(x + 14 * s, hy - 70 * s); g.lineTo(x + 90 * s, hy + 2); g.fill(); g.fillStyle = '#ff6a1a'; g.fillRect(x - 12 * s, hy - 72 * s, 24 * s, 4); g.fillStyle = 'rgba(80,40,30,.6)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + k * 6 * s, hy - 84 * s - k * 12 * s, 10 * s + k * 3, 0, TAU); g.fill(); } }
      g.fillStyle = '#1a0806'; for (let x = 160; x < 300; x += 20) g.fillRect(x, hy - 30 - (x % 40 ? 0 : 16), 14, 40); },
    jungle(g, w, h, hy) { cloud(g, w, hy, 6); const x = 260; g.fillStyle = '#5a4a3a'; g.beginPath(); g.moveTo(x - 110, hy + 2); g.lineTo(x - 18, hy - 80); g.lineTo(x + 18, hy - 80); g.lineTo(x + 110, hy + 2); g.fill(); g.fillStyle = '#e84a1a'; g.fillRect(x - 16, hy - 82, 32, 4); g.fillStyle = 'rgba(120,110,100,.6)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x - 6 + k * 8, hy - 96 - k * 14, 12 + k * 4, 0, TAU); g.fill(); }
      hillsAt(g, w, hy, '#2a6a2a', 18, 8, 3, 0); for (let i = 0; i < 50; i++) { const xx = Math.random() * w; g.fillStyle = i % 2 ? '#1a5a1a' : '#2a7a2a'; g.beginPath(); g.arc(xx, hy - 10 - Math.random() * 8, 6 + Math.random() * 5, 0, TAU); g.fill(); } },
    stars(g, w, h, hy) { for (let i = 0; i < 400; i++) { g.fillStyle = ['#fff', '#cce', '#ffd', '#aaf'][i % 4]; const s = Math.random() < 0.1 ? 2 : 1; g.fillRect(Math.random() * w, Math.random() * h, s, s); } for (const [x, y, r, c] of [[80, 60, 22, '#c86a3a'], [330, 40, 12, '#6a9ae0'], [440, 90, 7, '#e0d06a']]) { const gr = g.createRadialGradient(x - r / 3, y - r / 3, 1, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, c); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
      const gr = g.createRadialGradient(240, 80, 2, 240, 80, 70); gr.addColorStop(0, 'rgba(200,80,255,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(150, 0, 180, 170); },
    kitchen(g, w, h, hy) { cloud(g, w, hy, 6); g.fillStyle = '#e8d8b8'; g.fillRect(0, hy - 40, w, 42); g.fillStyle = '#c8a878'; for (let x = 0; x < w; x += 40) g.fillRect(x, hy - 40, 3, 42); g.fillStyle = '#7a5a3a'; g.fillRect(0, hy - 44, w, 5); },
    toys(g, w, h, hy) { cloud(g, w, hy, 6); for (let i = 0; i < 14; i++) { const x = i * w / 14, s = 14 + (i * 7 % 12); g.fillStyle = ['#e8261c', '#2a62e0', '#f0c000', '#2aa04a'][i % 4]; g.fillRect(x, hy - s, s, s); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 2, hy - s + 2, s - 4, 3); } },
  };
  function cloud(g, w, hy, n) { for (let i = 0; i < n; i++) { const x = Math.random() * w, y = hy * (0.25 + Math.random() * 0.5), s = 10 + Math.random() * 16; g.fillStyle = 'rgba(255,255,255,.75)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + k * s * 0.6, y + Math.sin(k * 2) * 3, s * 0.7, s * 0.4, 0, 0, TAU); g.fill(); } } }

  // ================================================================ the item icons (24x24 sprites for the HUD)
  const ICON = {}, FACE = [];
  function icons() {
    if (ICON.PEEL) return;
    const mk = (n, f) => { const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d'); f(g); ICON[n] = c; };
    const ball = (g, x, y, r, a, b) => { const gr = g.createRadialGradient(x - r / 3, y - r / 3, 1, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, a); gr.addColorStop(1, b); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
    DRIVERS.forEach((d,n)=>{
      const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),k=d.k;
      g.fillStyle=hexs(d.col);g.fillRect(0,0,32,32);g.fillStyle='rgba(255,255,255,.28)';g.fillRect(1,1,30,6);
      g.fillStyle=hexs(k.shirt||d.col2);g.beginPath();g.ellipse(16,33,13,12,0,0,TAU);g.fill();
      g.fillStyle=hexs(k.fur||k.skin||0xf0c090);g.beginPath();g.ellipse(16,15,9,10,0,0,TAU);g.fill();
      if(k.kind==='cat'||k.kind==='grot')for(const side of [-1,1]){g.beginPath();g.moveTo(16+side*5,10);g.lineTo(16+side*(k.kind==='grot'?15:9),2);g.lineTo(16+side*10,17);g.fill();}
      if(k.kind==='dog'){g.fillStyle=hexs(k.ear);g.fillRect(5,9,5,15);g.fillRect(22,9,5,15);}
      if(k.kind==='kid'){
        g.fillStyle=hexs(k.helmet??k.cap??k.hair??0x4a2a12);g.beginPath();g.ellipse(16,10,10,7,0,Math.PI,TAU);g.fill();
        if(k.cap!=null)g.fillRect(12,8,15,3);
        if(k.helmet!=null){g.fillStyle=hexs(k.visor||0x263860);g.fillRect(7,10,18,6);g.fillStyle='#c9efff';g.fillRect(9,11,5,1);}
      }
      if(k.helmet==null){g.fillStyle='#fff';g.fillRect(10,12,4,5);g.fillRect(19,12,4,5);g.fillStyle='#172135';g.fillRect(12,13,2,4);g.fillRect(19,13,2,4);}
      if(k.kind==='cat'||k.kind==='dog'){g.fillStyle=hexs(k.muzzle||0xf2d6a2);g.beginPath();g.ellipse(16,21,6,4,0,0,TAU);g.fill();g.fillStyle='#352c35';g.fillRect(14,18,4,3);}
      else {g.fillStyle='#873a36';g.fillRect(13,21,7,2);}
      if(k.glasses){g.strokeStyle='#101526';g.lineWidth=2;g.strokeRect(8,11,7,7);g.strokeRect(18,11,7,7);g.fillRect(15,13,3,2);}
      FACE[n]=c;
    });
    mk('PEEL', g => { g.fillStyle = '#f8d81a'; g.strokeStyle = '#6a4a0a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(12, 4); g.quadraticCurveTo(4, 14, 5, 21); g.lineTo(9, 15); g.lineTo(12, 21); g.lineTo(15, 15); g.lineTo(19, 21); g.quadraticCurveTo(20, 14, 12, 4); g.fill(); g.stroke(); g.fillStyle = '#5a3a0a'; g.fillRect(11, 2, 3, 3); });
    mk('BOOMER', g => { ball(g, 12, 13, 9, '#3ad04a', '#0a5a1a'); g.fillStyle = '#fff'; g.fillRect(7, 15, 10, 2); });
    mk('HOMER', g => { ball(g, 12, 13, 9, '#ff3a2a', '#6a0a0a'); g.fillStyle = '#fff'; g.fillRect(7, 15, 10, 2); g.fillStyle = '#ffe14a'; g.fillRect(10, 8, 4, 4); });
    mk('FAKE', g => { g.fillStyle = '#e83a6a'; g.fillRect(3, 3, 18, 18); g.strokeStyle = '#fff'; g.strokeRect(3.5, 3.5, 17, 17); g.fillStyle = '#fff'; g.font = 'bold 15px Arial'; g.textAlign = 'center'; g.save(); g.translate(12, 12); g.rotate(Math.PI); g.fillText('?', 0, 6); g.restore(); });
    const shroom = (g, x, y, s) => { g.fillStyle = '#f0e8d0'; g.fillRect(x - 3 * s, y, 6 * s, 6 * s); g.fillStyle = '#ff7a00'; g.beginPath(); g.ellipse(x, y, 8 * s, 6 * s, 0, Math.PI, 0); g.fill(); g.fillStyle = '#ffe14a'; g.beginPath(); g.moveTo(x - 4 * s, y - 2 * s); g.lineTo(x, y - 6 * s); g.lineTo(x + 4 * s, y - 2 * s); g.fill(); };
    mk('TURBO', g => shroom(g, 12, 13, 1.2));
    mk('TRIPLE', g => { shroom(g, 7, 10, 0.7); shroom(g, 17, 10, 0.7); shroom(g, 12, 18, 0.7); });
    mk('SPLAT', g => { g.fillStyle = '#1a1a3a'; g.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = i % 2 ? 6 : 10; g.lineTo(12 + Math.cos(a) * r, 12 + Math.sin(a) * r); } g.fill(); g.fillStyle = '#fff'; g.fillRect(9, 9, 2, 3); g.fillRect(14, 9, 2, 3); });
    mk('STAR', g => { g.fillStyle = '#ffe14a'; g.strokeStyle = '#c87a00'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, r = i % 2 ? 4.5 : 10.5; g.lineTo(12 + Math.cos(a) * r, 13 + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#000'; g.fillRect(9, 11, 2, 3); g.fillRect(13, 11, 2, 3); });
    mk('THUNDER', g => { g.fillStyle = '#ffe14a'; g.strokeStyle = '#a06a00'; g.beginPath(); g.moveTo(14, 2); g.lineTo(5, 14); g.lineTo(11, 14); g.lineTo(8, 22); g.lineTo(19, 9); g.lineTo(13, 9); g.closePath(); g.fill(); g.stroke(); });
    mk('BOMB', g => { ball(g, 12, 14, 8, '#3a6aff', '#0a1a6a'); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(4, 10); g.lineTo(1, 6); g.lineTo(6, 8); g.fill(); g.beginPath(); g.moveTo(20, 10); g.lineTo(23, 6); g.lineTo(18, 8); g.fill(); g.fillStyle = '#ffe14a'; g.fillRect(11, 3, 2, 4); });
  }

  // ================================================================ the cartridge
  TV.game('n64.kart', {
    three: true, stick: true, buttons: ['a', 'b', 'c', 'r'],
    help: 'Steer: arrows. Go: Z. Brake / back: X. Use item: C. Hold E while turning to hop and drift. Pause: Enter.',
    make(K) {
      const key = b => K.keyLabel ? K.keyLabel(b) : K.label(b);
      const T3 = K.three({ far: 900, fov: 64, fogCol: 0xc4dcf0, fogNear: 70, fogFar: 300 }), T = T3.T, H = K.hud, F = K.font, W = K.W, HH = K.H;
      icons();
      let RK = window.RoomRK;
      // ---------------------------------------------------------------- the save (old saves had just track + lap)
      const sv = (() => { const s = K.load(); return s && typeof s === 'object' ? s : {}; })();
      sv.lap = sv.lap && typeof sv.lap === 'object' ? sv.lap : {}; sv.tt = sv.tt && typeof sv.tt === 'object' ? sv.tt : {};
      sv.cups = sv.cups && typeof sv.cups === 'object' ? sv.cups : {}; sv.unl = sv.unl && typeof sv.unl === 'object' ? sv.unl : {};
      sv.opt = Object.assign({ mus: 1, cam: 0, ghost: 1 }, sv.opt && typeof sv.opt === 'object' ? sv.opt : {});
      sv.drv = clamp(sv.drv | 0, 0, 7); sv.track = clamp(sv.track | 0, 0, TRACKS.length - 1); if (!Array.isArray(sv.hi)) sv.hi = []; sv.races = sv.races | 0; sv.wins = sv.wins | 0;
      const save = () => { try { K.save(sv); } catch (e) {} };
      const castN = (id, fb) => { try { const n = window.Cast && Cast.n ? Cast.n(id) : ''; return String(n || fb).toUpperCase().slice(0, 9); } catch (e) { return fb; } };
      const MATES = [[who('mate1', 'DAVE'), 16400], [who('mate2', 'LUKE'), 13900], [who('mate3', 'CALLUM'), 12100], [who('mate4', 'JACKK'), 10200], [castN('cousin', 'COUSIN'), 7900], [castN('kidPoke', 'PAL'), 6100], ['MOM', 2600], ['GRAN', 1200]];
      const myName = () => { try { const n = String((window.Cast?.me?.()?.first) || (window.Net && Net.me && Net.me.nick) || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ''); return !n || /^GUEST/.test(n) ? 'YOU' : n.slice(0, 8); } catch (e) { return 'YOU'; } };
      const table = () => MATES.map(([n, s]) => ({ n, s, mate: 1 })).concat(sv.hi.map(x => ({ n: String(x.n || 'YOU'), s: x.s | 0 }))).sort((a, b) => b.s - a.s).slice(0, 8);
      const ghKey = i => 'jhp_rmkart_gh' + i;
      const ghLoad = i => { try { return localStorage.getItem(ghKey(i)) || ''; } catch (e) { return ''; } };
      const ghSave = (i, s) => { try { localStorage.setItem(ghKey(i), s); } catch (e) {} };
      const cupDone = (cc, c) => sv.cups[cc + ':' + c] | 0; // 1 gold, 2 silver, 3 bronze, 0 none
      const starOpen = () => !!(window.__kartCheatAll) || !!sv.unl.star || [0, 1, 2, 3].some(cc => cupDone(cc, 0) > 0);
      const ccOpen = cc => cc < 2 || (cc === 2 ? !!sv.unl.c150 : !!sv.unl.mirror);
      const trackOpen = i => TRACKS[i].cup === 0 || starOpen();

      // ---------------------------------------------------------------- the 3D bits that last all game
      const LIT = T3.lights({ amb: 0.7, sun: 0.85, dir: [0.4, 1, 0.3] });
      T3.cam.fov = 64; T3.cam.near = 0.3; T3.cam.far = 900; T3.cam.updateProjectionMatrix();
      const TEX = {}, tex = n => TEX[n] || (TEX[n] = T3.tex(64, 64, PAINT[n]));
      const matV = T3.mat({ vcol: true }), matP = T3.mat({ vcol: true, map: tex('mottle') }), matG = T3.mat({ vcol: true, lit: false });
      const matGhost = T3.mat({ color: 0xbca8ff, vcol: true, emissive: 0x252044, transparent: true, opacity: 0.4 }); matGhost.depthWrite = false;
      let kartGeo = [], kartLow = [];
      const shadowTex = T3.tex(32, 32, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.7, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const shadowMat = T3.mat({ map: shadowTex, transparent: true, lit: false }); shadowMat.depthWrite = false; shadowMat.polygonOffset = true; shadowMat.polygonOffsetFactor = -4;
      const shadowGeo = T3.keep(new T.PlaneGeometry(2.8, 3.8)); shadowGeo.rotateX(-Math.PI / 2);
      const shadows = new T.InstancedMesh(shadowGeo, shadowMat, 12); shadows.frustumCulled = false; T3.add(shadows);
      const boxTex = T3.tex(64, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); ['#ff3a3a', '#ffb000', '#3ad04a', '#3a8aff', '#c03ae0'].forEach((c, i) => gr.addColorStop(i / 4, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(4, 4, w - 8, h - 8); g.fillStyle = '#fff'; g.font = 'bold 48px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeStyle = '#3a2a6a'; g.lineWidth = 4; g.strokeText('?', w / 2, h / 2 + 3); g.fillText('?', w / 2, h / 2 + 3); g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3); });
      const boxMat = T3.mat({ map: boxTex, lit: false, transparent: true, opacity: 0.85 });
      const boxGeo = T3.keep(new T.BoxGeometry(1.5, 1.5, 1.5));
      const boxIM = new T.InstancedMesh(boxGeo, boxMat, 40); boxIM.frustumCulled = false; T3.add(boxIM);
      let fxN = null, fxA = null;
      const M4 = new T.Matrix4(), Q = new T.Quaternion(), E3 = new T.Euler(0, 0, 0, 'YXZ'), V1 = new T.Vector3(), V2 = new T.Vector3(), V3 = new T.Vector3(), SC = new T.Vector3(1, 1, 1), ZERO = new T.Matrix4().makeScale(0, 0, 0);
      const setI = (im, n, x, y, z, ry, s, rx, rz, sy) => { E3.set(rx || 0, ry || 0, rz || 0); Q.setFromEuler(E3); V1.set(x, y, z); SC.set(s == null ? 1 : s, sy == null ? (s == null ? 1 : s) : sy, s == null ? 1 : s); M4.compose(V1, Q, SC); im.setMatrixAt(n, M4); };
      let sceneryBatches = [];
      const sceneryFrustum = new T.Frustum(), sceneryClip = new T.Matrix4();
      let sky = null, world = null, L = null, TR = null, TH = null, MIR = false, FL = null, waterTex = [], padTex = null, haz = [], hazIM = [], pads = [], boxes = [], dino = null, short = null, ramps = [], gY = 0, starfield = null;
      let cfg = { kind: 'vs', cc: 1, cup: 0, race: 0, track: 0, arena: 0 }; // what we're playing
      let karts = [], me = null, items = [], mode = 'load', mt = 0;

      // ---------------------------------------------------------------- the look of a place
      function setTheme(th) {
        if (sky) { sky.kill(); sky = null; }
        sky = RK.sky(T3, { r: 600, grad: th.sky, paint: (g, w, h, hy) => PANO[th.pano] && PANO[th.pano](g, w, h, hy), lift: -20 });
        T3.scene.fog.color.setHex(th.fog); T3.scene.fog.near = th.fogN; T3.scene.fog.far = th.fogF; T3.scene.background = new T.Color(th.fog);
        LIT.hemi.color.setHex(th.skyL); LIT.hemi.groundColor.setHex(th.gndL); LIT.hemi.intensity = th.amb;
        LIT.sun.color.setHex(th.sunCol || 0xffffff); LIT.sun.intensity = th.sun;
      }
      function clearWorld() {
        if (world) { world.traverse(x => { if (x.geometry && x.geometry !== boxGeo && x.geometry !== shadowGeo && !kartGeo.includes(x.geometry) && !kartLow.includes(x.geometry)) x.geometry.dispose(); }); T3.scene.remove(world); world = null; }
        sceneryBatches = []; clearSkids();
        hazIM = []; haz = []; waterTex = []; windmill = null; torches = []; smokers = []; dino = null; short = null; ramps = []; pads = []; boxes = [];
        if (starfield) { T3.scene.remove(starfield); starfield.geometry.dispose(); starfield.material.dispose(); starfield = null; }
        for (let i = 0; i < 40; i++) boxIM.setMatrixAt(i, ZERO); boxIM.instanceMatrix.needsUpdate = true;
        if (fxN) { fxN.clear(); fxA.clear(); }
      }
      const addW = (geo, mat) => { const m = new T.Mesh(geo, mat); world.add(m); return m; };
      // contiguous runs of indices where fn(i) is true: [[a, b], ...] (b inclusive; may wrap). null = the whole loop
      function runs(N, fn) {
        let all = true, any = false; for (let i = 0; i < N; i++) { if (fn(i)) any = true; else all = false; }
        if (all) return null; if (!any) return [];
        let s = 0; while (fn(s)) s = (s + 1) % N; // start just after a false
        const out = []; let a = -1;
        for (let k = 1; k <= N; k++) { const i = (s + k) % N; if (fn(i)) { if (a < 0) a = i; } else if (a >= 0) { out.push([a, (i + N - 1) % N]); a = -1; } }
        if (a >= 0) out.push([a, (s + N) % N]);
        return out;
      }
      // a ribbon over runs where fn(i): closed when it goes all the way round
      function ribbon(fn, a, b, o, mat, ext) {
        const N = L.N, rs = runs(N, fn); if (!rs) return addW(RK.strip(T, L, a, b, o), mat);
        for (const [s, e] of rs) { let to = e < s ? e + N : e; if (ext !== false) to += 1; if (to - s < 1) continue; addW(RK.strip(T, L, a, b, Object.assign({}, o, { from: s, to })), mat); }
      }
      function flip(geo) { const ix = geo.index; if (ix) { const a = ix.array; for (let k = 0; k < a.length; k += 3) { const t = a[k + 1]; a[k + 1] = a[k + 2]; a[k + 2] = t; } ix.needsUpdate = true; } const n = geo.attributes.normal; for (let k = 0; k < n.array.length; k++) n.array[k] *= -1; n.needsUpdate = true; return geo; }

      // ---------------------------------------------------------------- building a track
      function buildTrack(ti, mir) {
        clearWorld();
        const tr = TRACKS[ti], th = THEMES[tr.th], sg = mir ? -1 : 1;
        TR = tr; TH = th; MIR = !!mir; world = new T.Group(); T3.scene.add(world);
        setTheme(th);
        L = RK.loop(T, tr.pts.map(p => [p[0] * sg, p[1], p[2] || 0, p[3] || 14, (p[4] || 0) * sg]), 2);
        const N = L.N, V = tr.verge, fi = f => ((Math.round(f * N) % N) + N) % N;
        const range = (fa, fb, fn) => { if (fb - fa >= 1) { for (let i = 0; i < N; i++) fn(i); return; } const a = fi(fa), b = fi(fb); for (let i = a; ; i = (i + 1) % N) { fn(i); if (i === b) break; } };
        FL = { dropL: new Uint8Array(N), dropR: new Uint8Array(N), tun: new Uint8Array(N), ice: new Uint8Array(N), plank: new Uint8Array(N), gap: new Uint8Array(N), rail: new Uint8Array(N), lim: new Float32Array(N), hw: new Float32Array(N), line: new Float32Array(N), mud: [] };
        for (let i = 0; i < N; i++) FL.hw[i] = L.W[i] / 2;
        (tr.drops || []).forEach(([a, b, s]) => range(a, b, i => { const sd = s * sg; if (sd <= 0) FL.dropL[i] = 1; if (sd >= 0) FL.dropR[i] = 1; }));
        if (tr.rails) { for (let i = 0; i < N; i++) { let c = 0; for (let k = -6; k <= 6; k++) c += Math.abs(L.C[L.wrap(i + k)]); if (c / 13 > 1 / 75) FL.rail[i] = 1; } for (let k = -14; k < 18; k++) FL.rail[L.wrap(k)] = 1; for (let i = 0; i < N; i++) if (FL.rail[i]) FL.dropL[i] = FL.dropR[i] = 0; }
        if (tr.gap) range(tr.gap[0], tr.gap[1], i => { FL.gap[i] = 1; FL.dropL[i] = FL.dropR[i] = 1; });
        (tr.tunnel || []).forEach(([a, b]) => range(a, b, i => { FL.tun[i] = 1; }));
        (tr.ice || []).forEach(([a, b]) => range(a, b, i => { FL.ice[i] = 1; }));
        (tr.plank || []).forEach(([a, b]) => range(a, b, i => { FL.plank[i] = 1; }));
        for (let i = 0; i < N; i++) FL.lim[i] = FL.tun[i] ? FL.hw[i] + 1.0 : FL.rail[i] ? FL.hw[i] + 0.4 : FL.hw[i] + V;
        // the racing line: to the inside of the bends, straight over jumps, away from the drops
        const sm = new Float32Array(N); for (let i = 0; i < N; i++) { let c = 0; for (let k = -6; k <= 6; k++) c += L.C[L.wrap(i + k)]; sm[i] = c / 13; }
        for (let i = 0; i < N; i++) { let v = clamp(sm[L.wrap(i + 5)] * 150, -0.55, 0.55) * FL.hw[i]; if (FL.dropR[i] || FL.dropR[L.wrap(i + 6)]) v = Math.min(v, FL.hw[i] - 3); if (FL.dropL[i] || FL.dropL[L.wrap(i + 6)]) v = Math.max(v, -FL.hw[i] + 3); FL.line[i] = v; }
        (tr.ramps || []).forEach(r => { const i0 = fi(r[0]); for (let k = -10; k < r[1] / 2 + 14; k++) FL.line[L.wrap(i0 + k)] = 0; });
        if (tr.gap) range(tr.gap[0] - 0.04, tr.gap[1] + 0.01, i => { FL.line[i] = 0; });
        let mnY = 1e9, mxR = 0; for (const p of L.P) { mnY = Math.min(mnY, p.y); mxR = Math.max(mxR, Math.hypot(p.x, p.z)); }
        gY = th.lava ? mnY - 6 : tr.th === 'spooky' ? mnY - 0.9 : mnY - 0.06;
        // ---- the road
        const hw = i => FL.hw[i], hwk = i => FL.hw[i] + (FL.tun[i] || !TH.kerb ? 0 : 1.1);
        ribbon(i => !FL.plank[i] && !FL.gap[i], i => -hw(i), hw, { ya: 0.02, v: 8 }, T3.mat({ map: tex(th.road) }));
        if (tr.plank) ribbon(i => FL.plank[i] && !FL.gap[i], i => -hw(i), hw, { ya: 0.02, v: 4 }, T3.mat({ map: tex('planks') }));
        if (tr.ice) { const im = T3.mat({ map: tex('ice'), transparent: true, opacity: 0.85 }); ribbon(i => FL.ice[i], i => -hw(i) + 0.4, i => hw(i) - 0.4, { ya: 0.05, v: 6 }, im); }
        // kerbs
        if (th.kerb) {
          const kt = T3.tex(8, 16, (g, w, h) => { g.fillStyle = th.kerb[0]; g.fillRect(0, 0, w, h); g.fillStyle = th.kerb[1]; g.fillRect(0, 0, w, h / 2); }), km = T3.mat({ map: kt });
          ribbon(i => !FL.tun[i] && !FL.dropL[i] && !FL.gap[i], i => -hwk(i), i => -hw(i), { ya: 0.06, v: 4 }, km);
          ribbon(i => !FL.tun[i] && !FL.dropR[i] && !FL.gap[i], hw, hwk, { ya: 0.06, v: 4 }, km);
        }
        // the start line
        const chk = T3.tex(32, 8, (g, w, h) => { for (let x = 0; x < 8; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 4, y * 4, 4, 4); } });
        addW(RK.strip(T, L, i => -hw(i), hw, { ya: 0.07, from: 0, to: 1, v: 2 }), T3.mat({ map: chk }));
        // the verge, then the bank down to the ground (or the castle wall down to the lava)
        if (th.verge && V > 0) {
          const vm = T3.mat({ map: tex(th.verge) });
          ribbon(i => !FL.tun[i] && !FL.dropL[i] && !FL.gap[i], i => -FL.lim[i], i => -hwk(i), { ya: 0.0, v: 10, u0: 0, u1: 2 }, vm);
          ribbon(i => !FL.tun[i] && !FL.dropR[i] && !FL.gap[i], hwk, i => FL.lim[i], { ya: 0.0, v: 10, u0: 0, u1: 2 }, vm);
          const drop = i => L.P[i].y - gY, sk = i => Math.max(2, drop(i) * (th.lava ? 0.2 : 1.4) + 1);
          const skm = T3.mat({ map: tex(th.lava ? 'cobble' : th.verge === 'snow' ? 'snow' : th.verge === 'redsand' ? 'rock' : th.verge) });
          ribbon(i => !FL.dropL[i] && !FL.gap[i], i => -FL.hw[i] - V - sk(i), i => -FL.hw[i] - V, { ya: i => -drop(i) - 0.2, yb: 0, v: 10, u0: 0, u1: 2 }, skm);
          ribbon(i => !FL.dropR[i] && !FL.gap[i], i => FL.hw[i] + V, i => FL.hw[i] + V + sk(i), { ya: 0, yb: i => -drop(i) - 0.2, v: 10, u0: 0, u1: 2 }, skm);
        }
        // where the road hangs in the air: an underside and edges (and the rainbow road's glowing rails)
        if (tr.drops) {
          const um = T3.mat({ color: th.space ? 0x2a1a5a : 0x4a3a2a, side: T.DoubleSide });
          const dropAny = i => FL.dropL[i] || FL.dropR[i] || th.space;
          ribbon(i => dropAny(i) && !FL.gap[i], i => -hw(i) - 0.3, i => hw(i) + 0.3, { ya: -0.9, v: 8 }, um);
          for (const s of [-1, 1]) ribbon(i => (s < 0 ? FL.dropL[i] : FL.dropR[i]) && !FL.gap[i], i => s * (hw(i) + 0.3), i => s * (hw(i) + 0.3), { ya: -0.9, yb: 0.06, v: 6, face: s }, um);
          if (th.space) {
            const gm = T3.mat({ color: 0xffffff, lit: false, map: T3.tex(8, 32, (g, w, h) => { ['#ff3a8a', '#ffe14a', '#3affd0', '#5a8aff'].forEach((c, k) => { g.fillStyle = c; g.fillRect(0, k * 8, w, 8); }); }) });
            for (const s of [-1, 1]) ribbon(i => !FL.rail[i], i => s * (hw(i) + 0.32), i => s * (hw(i) + 0.32), { ya: -0.3, yb: 0.25, v: 6, face: s }, gm);
            for (const s of [-1, 1]) ribbon(i => FL.rail[i], i => s * (hw(i) + 0.4), i => s * (hw(i) + 0.4), { ya: 0, yb: 1.1, v: 3, face: -s }, T3.mat({ color: 0xffffff, lit: false, transparent: true, opacity: 0.55, side: T.DoubleSide, map: T3.tex(8, 16, (g, w, h) => { g.fillStyle = '#c8a8ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 3); }) }));
          }
        }
        // tunnels: walls, a roof and a hill (or a building) over the top, with lamps
        const tuns = [];
        if (tr.tunnel) {
          const tt = tex(th.lava ? 'cobble' : tr.th === 'snow' ? 'ice' : tr.th === 'spooky' ? 'planks' : 'rock'), tm = T3.mat({ map: tt, side: T.DoubleSide });
          const w = i => FL.hw[i] + 1.0, H0 = 6.5;
          ribbon(i => FL.tun[i], i => -w(i), i => -w(i), { ya: 0, yb: H0, v: 6, face: 1 }, tm);
          ribbon(i => FL.tun[i], w, w, { ya: 0, yb: H0, v: 6, face: -1 }, tm);
          const rs = runs(N, i => FL.tun[i]) || [];
          for (const [s, e] of rs) {
            const to = (e < s ? e + N : e) + 1;
            addW(flip(RK.strip(T, L, i => -w(i), w, { ya: H0, from: s, to, v: 6 })), tm);
            const om = T3.mat({ map: tex(th.verge || 'rock') });
            addW(RK.strip(T, L, i => -w(i) - 18, i => -w(i), { ya: i => -(L.P[i].y - gY), yb: H0 + 1.5, from: s, to, v: 10 }), om);
            addW(RK.strip(T, L, i => -w(i), w, { ya: H0 + 1.5, from: s, to, v: 10 }), om);
            addW(RK.strip(T, L, w, i => w(i) + 18, { ya: H0 + 1.5, yb: i => -(L.P[i].y - gY), from: s, to, v: 10 }), om);
            tuns.push([s, to]);
          }
        }
        // the ground (with a trench cut out where there's a canyon or a river)
        buildGround(tr, th, mxR);
        // pads, boxes, ramps, props, hazards
        buildPads(tr, sg); buildBoxes(tr); buildRamps(tr); if (tr.short) buildShort(tr, sg); buildProps(tr, th, sg, tuns); buildHaz(tr, sg);
        (tr.mud || []).forEach(([f, lat, r]) => FL.mud.push({ i: fi(f), lat: lat * sg, r }));
        if (FL.mud.length) { const mm = T3.mat({ map: tex('mud'), transparent: true, opacity: 0.92 }); FL.mud.forEach(m => { const g = T3.keep(new T.CircleGeometry(m.r, 12)); g.rotateX(-Math.PI / 2); const me2 = new T.Mesh(g, mm); L.at(m.i, m.lat, 0.08, me2.position); m.x = me2.position.x; m.z = me2.position.z; world.add(me2); }); }
      }
      function buildGround(tr, th, mxR) {
        if (th.space) {
          const n = 900, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * TAU, b = Math.random() * 2 - 1, r = 300 + Math.random() * 200; pos[i * 3] = Math.cos(a) * r * Math.sqrt(1 - b * b); pos[i * 3 + 1] = b * r; pos[i * 3 + 2] = Math.sin(a) * r * Math.sqrt(1 - b * b); }
          const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
          starfield = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, fog: false })); T3.add(starfield);
          return;
        }
        const gt = tex(th.ground === 'lava' ? 'lava' : tr.th === 'spooky' ? 'swamp' : th.ground);
        const gm = T3.mat({ map: gt, lit: !(th.lava), fog: true });
        if (th.lava || tr.th === 'spooky') waterTex.push([gt, th.lava ? 0.02 : 0.01]);
        const tile = 0.08;
        const quad = (cx, cz, w, h, rot) => { const g = T3.keep(new T.PlaneGeometry(w, h)); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w * tile, uv.getY(k) * h * tile); g.rotateX(-Math.PI / 2); g.rotateY(rot || 0); g.translate(cx, gY, cz); return addW(g, gm); };
        if (tr.th === 'beach') {
          const g = T3.keep(new T.CircleGeometry(mxR + 40, 40)); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * (mxR + 40) * 2 * tile, uv.getY(k) * (mxR + 40) * 2 * tile); g.rotateX(-Math.PI / 2); g.translate(0, gY, 0); addW(g, gm);
          const wt = T3.tex(64, 64, PAINT.water); waterTex.push([wt, 0.015]); const sea = T3.keep(new T.PlaneGeometry(1600, 1600)); const su = sea.attributes.uv; for (let k = 0; k < su.count; k++) su.setXY(k, su.getX(k) * 80, su.getY(k) * 80); sea.rotateX(-Math.PI / 2); sea.translate(0, gY - 0.5, 0); addW(sea, T3.mat({ map: wt }));
          const rim = T3.keep(new T.RingGeometry(mxR + 39, mxR + 48, 40)); rim.rotateX(-Math.PI / 2); rim.translate(0, gY - 0.25, 0); addW(rim, T3.mat({ color: 0xf0f8ff, transparent: true, opacity: 0.7, lit: false }));
          return;
        }
        if (!tr.trench) { quad(0, 0, 1500, 1500); return; }
        // a trench across the track at tr.trench: [from, to, depth, 'water'|'river']
        const [fa, fb, depth, fluid] = tr.trench, N = L.N, ia = Math.round(fa * N) % N, ib = (Math.round(fb * N) + 1) % N, ic = Math.round((ia + ((ib - ia + N) % N) / 2)) % N;
        const c = L.P[ic], d = new T.Vector3(L.D[ic].x, 0, L.D[ic].z).normalize(), rot = Math.atan2(d.x, d.z);
        const halfL = Math.max(3, (((ib - ia + N) % N) * L.step) / 2), far = 700;
        // the two halves of the ground either side
        for (const s of [-1, 1]) { const off = s * (halfL + far / 2); quad(c.x + d.x * off, c.z + d.z * off, 1500, far, rot); }
        const wm = T3.mat({ map: tex(tr.th === 'desert' ? 'rock' : 'mud'), side: T.DoubleSide });
        for (const s of [-1, 1]) { // the trench walls, and a cap where the road's bank was cut
          const g = T3.keep(new T.PlaneGeometry(1500, depth)); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 120, uv.getY(k) * depth * 0.08);
          g.translate(0, gY - depth / 2, 0); g.rotateY(rot); g.translate(c.x + d.x * s * halfL, 0, c.z + d.z * s * halfL); addW(g, wm);
          const i = s < 0 ? ia : ib, p = L.P[i], top = p.y - gY, A = FL.hw[i] + TR.verge, B = A + Math.max(2, top * 1.4 + 1), r = new T.Vector3(L.R[i].x, 0, L.R[i].z).normalize();
          const P2 = (lat, y) => [p.x + r.x * lat, gY + y, p.z + r.z * lat];
          const v = [...P2(-B, 0), ...P2(B, 0), ...P2(A, top), ...P2(-B, 0), ...P2(A, top), ...P2(-A, top)];
          const cg = new T.BufferGeometry(); cg.setAttribute('position', new T.Float32BufferAttribute(v, 3)); cg.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 4, 0, 3, 1, 0, 0, 3, 1, 1, 1], 2)); cg.computeVertexNormals(); addW(cg, wm);
        }
        const fl = T3.keep(new T.PlaneGeometry(1500, halfL * 2 + 0.5)); const fu = fl.attributes.uv; for (let k = 0; k < fu.count; k++) fu.setXY(k, fu.getX(k) * 90, fu.getY(k) * 2);
        fl.rotateX(-Math.PI / 2); fl.rotateY(rot); fl.translate(c.x, gY - depth + 0.6, c.z);
        const wt = T3.tex(64, 64, PAINT.water); waterTex.push([wt, 0.05]); addW(fl, T3.mat({ map: wt }));
      }
      function padGeo(list, len, wdt, lift) { // flat planes lying on the road, merged
        const parts = [];
        for (const [i, lat] of list) { const g = new T.PlaneGeometry(wdt, len); const p = L.at(i, lat, lift); M4.makeBasis(L.R[i], L.D[i], L.U[i]); M4.setPosition(p); parts.push({ geo: g, m: M4.clone(), c: 0xffffff }); }
        const geo = RK.merge(T, parts); parts.forEach(p => p.geo.dispose()); return geo;
      }
      function buildPads(tr, sg) {
        padTex = padTex || T3.tex(16, 32, (g, w, h) => { g.fillStyle = '#ff7a00'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffe14a'; for (let y = 0; y < 2; y++) { g.beginPath(); g.moveTo(0, y * 16 + 14); g.lineTo(w / 2, y * 16 + 4); g.lineTo(w, y * 16 + 14); g.lineTo(w, y * 16 + 10); g.lineTo(w / 2, y * 16); g.lineTo(0, y * 16 + 10); g.fill(); } });
        pads = (tr.pads || []).map(([f, lat]) => ({ i: Math.round(f * L.N) % L.N, lat: lat * sg }));
        if (pads.length) addW(padGeo(pads.map(p => [p.i, p.lat]), 7, 3.8, 0.09), T3.mat({ map: padTex, lit: false }));
      }
      function buildBoxes(tr) {
        boxes = []; if (cfg.kind === 'tt') return; // Three supplied turbos, no random pickups in a time trial.
        for (const f of tr.boxes || []) { const i = Math.round(f * L.N) % L.N, hw = FL.hw[i]; for (const k of [-0.66, -0.22, 0.22, 0.66]) { const p = L.at(i, k * hw, 1.3); boxes.push({ x: p.x, y: p.y, z: p.z, i, lat: k * hw, gone: 0 }); } }
      }
      function buildRamps(tr) {
        ramps = [];
        const rt = T3.tex(16, 16, (g, w, h) => { for (let y = 0; y < 4; y++) { g.fillStyle = y % 2 ? '#222' : '#ffd200'; g.fillRect(0, y * 4, w, 4); } });
        for (const [f, len, hh] of tr.ramps || []) {
          const i0 = Math.round(f * L.N) % L.N, n = Math.max(2, Math.round(len / L.step)), gw = FL.hw[i0] - 1.2;
          const r = { i0, n, hh, gw }; ramps.push(r);
          const prof = i => { let k = i - i0; if (k < 0) k += L.N; return k <= n ? hh * k / n : 0; };
          addW(RK.strip(T, L, -gw, gw, { ya: i => prof(i) + 0.03, from: i0, to: i0 + n, v: 2 }), T3.mat({ map: rt }));
          for (const s of [-1, 1]) addW(RK.strip(T, L, s * gw, s * gw, { ya: 0, yb: i => prof(i) + 0.03, from: i0, to: i0 + n, v: 3, face: s }), T3.mat({ color: 0x8a6a1a }));
          const p = L.at(i0 + n, 0, 0), g = T3.keep(new T.PlaneGeometry(gw * 2, hh)); g.translate(0, hh / 2, 0); const m = addW(g, T3.mat({ color: 0x5a4a1a, side: T.DoubleSide })); m.position.copy(p); m.rotation.y = Math.atan2(L.D[i0 + n].x, L.D[i0 + n].z);
        }
      }
      // ramp height at index i, lateral lat
      function rampH(i, lat) { for (const r of ramps) { let k = i - r.i0; if (k < 0) k += L.N; if (k >= 0 && k <= r.n && Math.abs(lat) < r.gw) return r.hh * k / r.n; } return 0; }
      function buildShort(tr, sg) {
        const a = L.nearest(tr.short[0][0] * sg, tr.short[0][1]), b = L.nearest(tr.short[1][0] * sg, tr.short[1][1]);
        const A = L.P[a].clone(), B = L.P[b].clone(); short = { a, b, A, B, w: 4.5 };
        const dx=B.x-A.x,dz=B.z-A.z,len=Math.hypot(dx,dz),rx=-dz/len,rz=dx/len;
        const strip=(inner,outer,bank)=>{
          const pos=[],uv=[];
          for(const [p,side] of [[A,inner],[B,inner],[A,outer],[A,outer],[B,inner],[B,outer]]) {
            pos.push(p.x+rx*side,bank && Math.abs(side)>short.w ? gY : p.y+.035,p.z+rz*side);
            uv.push(side/4,p===A?0:len/6);
          }
          const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
          geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
          addW(geo,T3.mat({map:tex(bank?'grass':'dirtroad'),side:T.DoubleSide}));
        };
        strip(-short.w,short.w,false);strip(-short.w,-short.w-3,true);strip(short.w,short.w+3,true);
      }
      const inShort = k => { if (!short) return -1; const ax = short.A.x, az = short.A.z, bx = short.B.x - ax, bz = short.B.z - az; const tt = clamp(((k.x - ax) * bx + (k.z - az) * bz) / (bx * bx + bz * bz), 0, 1); return Math.hypot(k.x - ax - bx * tt, k.z - az - bz * tt) < short.w ? tt : -1; };

      // ---------------------------------------------------------------- scenery: merged low-poly props (one lit mesh, one glowing mesh)
      let windmill = null, torches = [], smokers = [];
      function buildProps(tr, th, sg, tuns) {
        const P = [], G = [], N = L.N;
        const box = (w, h, d) => new T.BoxGeometry(w, h, d), cyl = (a, b, h, s) => new T.CylinderGeometry(a, b, h, s || 8), cone = (r, h, s) => new T.ConeGeometry(r, h, s || 8), ball = (r, s) => new T.SphereGeometry(r, s || 8, Math.max(4, (s || 8) * 0.75 | 0)), dode = r => new T.DodecahedronGeometry(r, 0);
        const add = (geo, x, y, z, ry, c, sx, sy, sz, rx, rz) => P.push({ geo, m: RK.M(T, x, y, z, ry || 0, sx, sy, sz, rx, rz), c });
        const glow = (geo, x, y, z, ry, c, sx, sy, sz, rx, rz) => G.push({ geo, m: RK.M(T, x, y, z, ry || 0, sx, sy, sz, rx, rz), c });
        const R = Math.random, pick = a => a[R() * a.length | 0];
        const skirt = i => Math.max(2, (L.P[i].y - gY) * (TH.lava ? 0.2 : 1.4) + 1);
        const near = (x, z) => { let bd = 1e18, bi = 0; for (let i = 0; i < N; i += 2) { const p = L.P[i], d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z); if (d < bd) { bd = d; bi = i; } } return { d: Math.sqrt(bd), i: bi }; };
        let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; for (const p of L.P) { mnx = Math.min(mnx, p.x); mxx = Math.max(mxx, p.x); mnz = Math.min(mnz, p.z); mxz = Math.max(mxz, p.z); }
        // a free spot on the ground at least `gap` metres clear of the track (and its bank), at most `far` away
        const spot = (gap, far, tries) => { for (let k = 0; k < (tries || 30); k++) { const x = lerp(mnx - far, mxx + far, R()), z = lerp(mnz - far, mxz + far, R()); const n = near(x, z); if (n.d < FL.lim[n.i] + skirt(n.i) + gap || n.d > far + FL.lim[n.i]) continue; if (short && inShort({ x, z }) >= 0) continue; if (TR.trench && inTrench(x, z)) continue; if (tr.th === 'beach' && Math.hypot(x, z) > Math.hypot(mxx - mnx, mxz - mnz) * 0.5 + 30) continue; return { x, z, y: gY }; } return null; };
        // ---- the edge of the run-off (hedge, rocks, fence...), not where the road hangs over a drop
        const wallAt = (i, s) => { const lat = s * (FL.lim[i] + 0.9), p = L.at(i, lat, 0); const n = near(p.x, p.z); const dd = Math.abs(n.i - i); if (Math.min(dd, N - dd) > 20 && n.d < FL.lim[n.i] + 2) return null; if (short && inShort(p) >= 0) return null; return p; };
        const step = th.wall === 'fence' ? 3 : th.wall === 'battlement' ? 2 : 2;
        for (let i = 0; i < N; i += step) for (const s of [-1, 1]) {
          if (FL.tun[i] || FL.gap[i] || (s < 0 ? FL.dropL[i] : FL.dropR[i]) || !th.wall || th.wall === 'rail') continue;
          const p = wallAt(i, s); if (!p) continue; const yaw = Math.atan2(L.D[i].x, L.D[i].z);
          if (th.wall === 'hedge') add(box(2.8, 1.7 + R() * 0.5, 3.2), p.x, p.y + 0.9, p.z, yaw, R() < 0.5 ? 0x2a6a1a : 0x347a22);
          else if (th.wall === 'rocks') add(dode(1.2 + R() * 0.6), p.x, p.y + 0.5, p.z, R() * 6, R() < 0.5 ? 0xa89a7a : 0x8a7a62, 1, 0.7, 1);
          else if (th.wall === 'snowbank') add(ball(1.8, 7), p.x, p.y + 0.3, p.z, R() * 6, 0xf4f8ff, 1.1, 0.55, 1.3);
          else if (th.wall === 'boulders') add(dode(1.3 + R() * 0.7), p.x, p.y + 0.6, p.z, R() * 6, R() < 0.5 ? 0xa0583a : 0x8a4a30, 1, 0.8, 1);
          else if (th.wall === 'bush') { add(ball(1.6, 7), p.x, p.y + 0.9, p.z, R() * 6, R() < 0.5 ? 0x2a7a2a : 0x3a8a22, 1, 0.8, 1); if (R() < 0.3) add(dode(0.9), p.x, p.y + 0.4, p.z, 0, 0x7a7a6a); }
          else if (th.wall === 'fence') { add(box(0.18, 1.9, 0.18), p.x, p.y + 0.95, p.z, yaw, 0x1a1a22); add(cone(0.16, 0.4, 4), p.x, p.y + 2.05, p.z, 0, 0x1a1a22); add(box(0.08, 0.1, 6.2), p.x + L.D[i].x * 3, p.y + 1.5, p.z + L.D[i].z * 3, yaw, 0x22222a); add(box(0.08, 0.1, 6.2), p.x + L.D[i].x * 3, p.y + 0.6, p.z + L.D[i].z * 3, yaw, 0x22222a); }
          else if (th.wall === 'battlement') { add(box(1.2, 1.3, 4.2), p.x, p.y + 0.65, p.z, yaw, 0x7a7478); if ((i / 2) % 2 === 0) add(box(1.2, 0.8, 1.8), p.x, p.y + 1.7, p.z, yaw, 0x6a6468); }
        }
        if (short) { const dx = short.B.x - short.A.x, dz = short.B.z - short.A.z, len = Math.hypot(dx, dz), nx = -dz / len, nz = dx / len; for (let d = len * 0.14; d < len * 0.86; d += 2.6) for (const s of [-1, 1]) add(box(2.6, 1.8, 2.6), short.A.x + dx / len * d + nx * s * (short.w + 1.3), lerp(short.A.y,short.B.y,d/len)+0.9, short.A.z + dz / len * d + nz * s * (short.w + 1.3), Math.atan2(dx, dz), 0x2a6a1a);
          const p = short.A.clone().add(new T.Vector3(dx / len * 9 + nx * 5.5, 0, dz / len * 9 + nz * 5.5)); add(box(0.2, 2, 0.2), p.x, p.y+1, p.z, 0, 0x6a4a2a); add(box(2.2, 0.8, 0.12), p.x, p.y+1.9, p.z, Math.atan2(dx, dz) + Math.PI / 2, 0xb08a5a); }
        // ---- posts under the bridges
        for (let i = 0; i < N; i += 5) if (FL.plank[i]) for (const s of [-1, 1]) { const p = L.at(i, s * (FL.hw[i] - 0.4), 0), hh = p.y - gY + (TR.trench ? TR.trench[2] : 0) + 1; add(box(0.5, hh, 0.5), p.x, p.y - hh / 2, p.z, 0, 0x5a3a1a); add(box(0.18, 1.1, 0.18), p.x, p.y + 0.55, p.z, 0, 0x6a4a22); }
        // ---- the start gantry and its banner
        const s0 = L.P[0], r0 = L.R[0], gy = Math.atan2(L.D[0].x, L.D[0].z), gw = FL.hw[0] + 1.8;
        for (const s of [-1, 1]) { add(box(0.8, 7, 0.8), s0.x + r0.x * s * gw, s0.y + 3.5, s0.z + r0.z * s * gw, gy, 0xdddddd); add(box(1.2, 0.4, 1.2), s0.x + r0.x * s * gw, s0.y + 0.2, s0.z + r0.z * s * gw, gy, 0x555555); }
        add(box(gw * 2 + 1, 0.5, 0.8), s0.x, s0.y + 7.1, s0.z, gy, 0x444444);
        const ban = T3.tex(128, 32, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e8261c'); gr.addColorStop(1, '#8a0a06'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ffe14a'; g.font = 'italic 900 21px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeStyle = '#3a0a00'; g.lineWidth = 3; g.strokeText('KART KAOS', w / 2, h / 2 + 1); g.fillText('KART KAOS', w / 2, h / 2 + 1); });
        for (const f of [0, Math.PI]) { const bm = new T.Mesh(T3.keep(new T.PlaneGeometry(gw * 2, 2.2)), T3.mat({ map: ban })); bm.position.set(s0.x - L.D[0].x * (f ? 0.42 : -0.42), s0.y + 5.8, s0.z - L.D[0].z * (f ? 0.42 : -0.42)); bm.rotation.y = gy + f; world.add(bm); }
        const jokes = ['BISCUIT BRAKES','SAND IN YOUR GEARS','FROSTY FINGERS','NO GHOSTING!',
          'CACTUS PRACTICE','CRUMBLE ZONE','EXTINCT BRAKES','NO SPACE TO PARK'];
        const joke = jokes[TRACKS.indexOf(tr)];
        if (joke) {
          const signTex = T3.tex(256,64,(g,w,h)=>{
            g.fillStyle=th.night?'#30204e':'#182e78';g.fillRect(0,0,w,h);
            g.strokeStyle='#ffe060';g.lineWidth=5;g.strokeRect(3,3,w-6,h-6);
            g.fillStyle='#fff4be';g.font='italic 900 21px Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(joke,w/2,25);
            g.fillStyle='#82deff';g.font='bold 12px Arial, sans-serif';g.fillText('BIGWHEEL RACING SUPPLIES',w/2,48);
          });
          const sm=T3.mat({map:signTex,lit:false}),signFaces=[];
          for(const fraction of [.07,.35,.81]) {
            const i=Math.round(fraction*N)%N;if(FL.tun[i]||FL.gap[i])continue;
            const side=fraction===.35?-1:1,p=L.at(i,side*(FL.lim[i]+2.8),0),yaw=Math.atan2(L.D[i].x,L.D[i].z)+Math.PI/2;
            add(box(8,2,.3),p.x,p.y+3.4,p.z,yaw,0x28334c);
            for(const offset of [-3,3]) add(box(.22,2.5,.22),p.x+Math.cos(yaw)*offset,p.y+1.25,p.z-Math.sin(yaw)*offset,0,0xc4cad2);
            // Both sides are independently readable; the opaque block supplies thickness.
            for(const face of [-1,1]) signFaces.push({geo:new T.PlaneGeometry(7.8,1.85),m:RK.M(T,p.x+Math.sin(yaw)*face*.16,p.y+3.4,p.z+Math.cos(yaw)*face*.16,yaw+(face<0?Math.PI:0))});
          }
          world.add(new T.Mesh(RK.merge(T,signFaces),sm));signFaces.forEach(p=>p.geo.dispose());
        }
        // the grandstand by the start
        if (!th.space && !th.lava) { const st = L.at(6, -(FL.lim[6] + 9), 0); add(box(24, 4, 6), st.x, st.y + 2, st.z, gy, 0x8a8a9a); add(box(24, 0.5, 7.5), st.x, st.y + 8, st.z, gy, 0xd82a1a); for (const k of [-11, 11]) add(box(0.4, 4, 0.4), st.x + Math.cos(gy) * k, st.y + 6, st.z - Math.sin(gy) * k, 0, 0xcccccc);
          for (let k = 0; k < 36; k++) { const x = (k % 18 - 9) * 1.25, row = k / 18 | 0; add(box(0.6, 0.8, 0.6), st.x + Math.cos(gy) * x - Math.sin(gy) * (row * 1.2 - 0.6), st.y + 4.4 + row * 0.9, st.z - Math.sin(gy) * x - Math.cos(gy) * (row * 1.2 - 0.6), 0, pick([0xff4a4a, 0x4a8aff, 0xffe14a, 0xffffff, 0x3ad04a])); add(ball(0.28, 6), st.x + Math.cos(gy) * x - Math.sin(gy) * (row * 1.2 - 0.6), st.y + 5.05 + row * 0.9, st.z - Math.sin(gy) * x - Math.cos(gy) * (row * 1.2 - 0.6), 0, 0xf0c090); } }
        // ---- the place itself
        const tree = (x, y, z, s) => { add(cyl(0.3 * s, 0.45 * s, 2.4 * s, 6), x, y + 1.2 * s, z, 0, 0x6a4a2a); if (R() < 0.6) { add(cone(2.3 * s, 3.6 * s, 7), x, y + 3.6 * s, z, R() * 6, 0x2a7a2a); add(cone(1.7 * s, 3 * s, 7), x, y + 5.4 * s, z, R() * 6, 0x3a8a2a); } else add(ball(2.2 * s, 7), x, y + 3.6 * s, z, R() * 6, R() < 0.5 ? 0x3a8a2a : 0x4a9a32, 1, 0.9, 1); };
        const palm = (x, y, z, s) => { let px = x, pz = z, py = y; const lean = R() * 6; for (let k = 0; k < 4; k++) { add(cyl(0.28 * s, 0.34 * s, 1.8 * s, 6), px, py + 0.9 * s, pz, 0, k % 2 ? 0x8a6a3a : 0x9a7a48, 1, 1, 1, Math.sin(lean) * 0.12 * k, Math.cos(lean) * 0.12 * k); px += Math.cos(lean) * 0.25 * k * s; pz += Math.sin(lean) * 0.25 * k * s; py += 1.75 * s; }
          for (let f = 0; f < 6; f++) add(box(0.7 * s, 0.1 * s, 3.4 * s), px + Math.sin(f * 1.05) * 1.4 * s, py + 0.1, pz + Math.cos(f * 1.05) * 1.4 * s, f * 1.05, f % 2 ? 0x2a9a3a : 0x3aaa42, 1, 1, 1, 0.35); add(ball(0.35 * s, 6), px, py - 0.2, pz, 0, 0x6a4a1a); };
        const hills = (col, top) => { for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + R() * 0.2, r = 280 + R() * 60, hgt = 30 + R() * 40; add(cone(40 + R() * 30, hgt, 7), Math.cos(a) * r, gY + hgt / 2 - 2, Math.sin(a) * r, R() * 6, col); if (top) add(cone(16 + R() * 6, hgt * 0.35, 7), Math.cos(a) * r, gY + hgt * 0.84, Math.sin(a) * r, 0, top); } };
        const scatter = (n, gap, far, fn) => { for (let k = 0; k < n; k++) { const p = spot(gap, far); if (p) fn(p.x, p.y, p.z, 0.8 + R() * 0.6); } };
        if (tr.props === 'park') {
          scatter(80, 6, 70, tree); hills(0x4a8a4a);
          scatter(5, 10, 40, (x, y, z) => { const a = R() * 6; add(box(1.2, 1.1, 2.2), x, y + 1.2, z, a, 0xffffff); add(box(1.24, 0.6, 0.8), x, y + 1.3, z, a, 0x1a1a1a); add(box(0.8, 0.8, 0.8), x + Math.sin(a) * 1.4, y + 1.6, z + Math.cos(a) * 1.4, a, 0xffffff); add(box(0.5, 0.35, 0.3), x + Math.sin(a) * 1.85, y + 1.45, z + Math.cos(a) * 1.85, a, 0xf0a0b0); for (const [u, v] of [[-0.4, -0.8], [0.4, -0.8], [-0.4, 0.8], [0.4, 0.8]]) add(box(0.25, 0.8, 0.25), x + Math.cos(a) * u + Math.sin(a) * v, y + 0.4, z - Math.sin(a) * u + Math.cos(a) * v, a, 0xeeeeee); });
          const wp = spot(14, 45, 60); if (wp) { add(cyl(2.2, 3.4, 12, 8), wp.x, wp.y + 6, wp.z, 0, 0xe8dcc0); add(cone(3, 3, 8), wp.x, wp.y + 13.5, wp.z, 0, 0x8a3a2a); add(box(1.4, 2.2, 0.2), wp.x, wp.y + 1.1, wp.z + 3.2, 0, 0x5a3a1a);
            const sails = []; for (let k = 0; k < 4; k++) sails.push({ geo: new T.BoxGeometry(1.4, 8, 0.15), m: RK.M(T, Math.sin(k * Math.PI / 2) * 4, Math.cos(k * Math.PI / 2) * 4, 0, 0, 1, 1, 1, 0, -k * Math.PI / 2), c: k % 2 ? 0xf8f0e0 : 0xe0d8c8 }); sails.push({ geo: new T.BoxGeometry(0.6, 0.6, 1.2), m: RK.M(T, 0, 0, 0), c: 0x5a3a1a });
            windmill = new T.Mesh(RK.merge(T, sails), matV); sails.forEach(s => s.geo.dispose()); windmill.position.set(wp.x, wp.y + 11, wp.z + 3); world.add(windmill); }
          const bp = { x: mnx - 20, z: mxz + 30 }; add(ball(5, 10), bp.x, 42, bp.z, 0, 0xe8261c, 1, 1.15, 1); add(box(1.6, 1.2, 1.6), bp.x, 35, bp.z, 0, 0x8a5a2a); for (let k = 0; k < 6; k++) add(box(0.4, 5.4, 0.05), bp.x + Math.sin(k) * 4.6, 42, bp.z + Math.cos(k) * 4.6, k, 0xffe14a);
        } else if (tr.props === 'beach') {
          scatter(60, 4, 45, palm); scatter(10, 4, 40, (x, y, z) => add(dode(1 + R()), x, y + 0.4, z, R() * 6, 0x9a8a72, 1, 0.7, 1));
          scatter(7, 6, 30, (x, y, z) => { add(box(4, 1.6, 4), x, y + 0.8, z, 0, 0xe8cc88); for (const [u, v] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) { add(cyl(0.7, 0.8, 2.8, 6), x + u, y + 1.4, z + v, 0, 0xdcc07a); add(cone(0.85, 1, 6), x + u, y + 3.3, z + v, 0, 0xc8a868); } add(box(0.08, 1.4, 0.08), x, y + 2.3, z, 0, 0x6a4a2a); add(box(0.7, 0.4, 0.04), x + 0.35, y + 2.8, z, 0, 0xe8261c); });
          scatter(10, 4, 30, (x, y, z) => { const c = pick([0xe8261c, 0x2a62e0, 0xf0c000, 0x3ad04a]); add(cyl(0.05, 0.05, 2.6, 4), x, y + 1.3, z, 0, 0xdddddd); add(cone(1.8, 0.7, 8), x, y + 2.7, z, 0, c); add(box(1.8, 0.08, 0.9), x + 1.2, y + 0.05, z, 0, pick([0xffffff, 0xff8ad0, 0x8ad0ff])); });
          scatter(4, 8, 30, (x, y, z) => { const a = R() * 6; for (let k = 0; k < 5; k++) add(box(0.7, 2.6, 3), x + Math.cos(a) * (k - 2) * 0.7, y + 1.3, z - Math.sin(a) * (k - 2) * 0.7, a, k % 2 ? 0xffffff : pick([0xe8261c, 0x2a62e0])); add(cone(3, 1.4, 4), x, y + 3.3, z, a + Math.PI / 4, 0x8a3a2a); });
          const lp = spot(16, 40, 60); if (lp) { for (let k = 0; k < 6; k++) add(cyl(1.6 - k * 0.12, 1.7 - k * 0.12, 3, 10), lp.x, lp.y + 1.5 + k * 3, lp.z, 0, k % 2 ? 0xffffff : 0xd8261c); add(cyl(1.4, 1.4, 0.4, 10), lp.x, lp.y + 18.2, lp.z, 0, 0x333333); glow(cyl(0.9, 0.9, 1.8, 8), lp.x, lp.y + 19.3, lp.z, 0, 0xffe88a); add(cone(1.4, 1.4, 10), lp.x, lp.y + 20.9, lp.z, 0, 0xd8261c); }
          for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.4, r = 220 + R() * 60; add(cone(26 + R() * 10, 22, 7), Math.cos(a) * r, gY + 6, Math.sin(a) * r, 0, 0x6a9a5a); }
        } else if (tr.props === 'snow') {
          scatter(110, 5, 70, (x, y, z, s) => { add(cyl(0.3 * s, 0.4 * s, 1.6 * s, 6), x, y + 0.8 * s, z, 0, 0x5a3a2a); add(cone(2.2 * s, 3.2 * s, 7), x, y + 2.8 * s, z, R() * 6, 0x1e5a3a); add(cone(1.6 * s, 2.6 * s, 7), x, y + 4.4 * s, z, R() * 6, 0x2a6a44); add(cone(0.9 * s, 1.4 * s, 7), x, y + 5.9 * s, z, 0, 0xf4f8ff); });
          scatter(5, 10, 40, (x, y, z) => { const a = R() * 6; add(box(6, 3.2, 5), x, y + 1.6, z, a, 0x7a4a2a); add(cone(4.6, 2.6, 4), x, y + 4.5, z, a + Math.PI / 4, 0xf4f8ff, 1, 1, 0.85); add(box(1, 2.8, 1), x + 1.8, y + 4.6, z, a, 0x6a6a6a); glow(box(1, 0.8, 0.1), x + Math.sin(a) * 2.55, y + 1.8, z + Math.cos(a) * 2.55, a, 0xffd86a); glow(box(1, 0.8, 0.1), x + Math.sin(a) * 2.55 + Math.cos(a) * 1.8, y + 1.8, z + Math.cos(a) * 2.55 - Math.sin(a) * 1.8, a, 0xffd86a); });
          scatter(6, 5, 30, (x, y, z) => { add(ball(1, 8), x, y + 0.9, z, 0, 0xffffff); add(ball(0.7, 8), x, y + 2.2, z, 0, 0xffffff); add(ball(0.5, 8), x, y + 3.2, z, 0, 0xffffff); add(cone(0.12, 0.6, 5), x, y + 3.2, z + 0.65, 0, 0xff7a1a, 1, 1, 1, Math.PI / 2); add(box(1.4, 0.2, 0.2), x, y + 2.7, z, 0, 0xd8261c); });
          hills(0x8a9ab8, 0xf4f8ff);
        } else if (tr.props === 'spooky') {
          scatter(70, 3, 60, (x, y, z, s) => { add(cyl(0.25 * s, 0.5 * s, 6 * s, 5), x, y + 3 * s, z, 0, 0x2a2018); for (let b = 0; b < 3; b++) { const a = R() * 6; add(cyl(0.06 * s, 0.14 * s, 3 * s, 4), x + Math.sin(a) * 0.9 * s, y + (3.5 + b) * s, z + Math.cos(a) * 0.9 * s, a, 0x2a2018, 1, 1, 1, 0.9, 0); } });
          scatter(40, 2, 35, (x, y, z) => { const a = R() * 6; if (R() < 0.7) add(box(1, 1.3 + R() * 0.6, 0.3), x, y + 0.7, z, a, 0x7a7a82, 1, 1, 1, (R() - 0.5) * 0.3); else { add(box(0.25, 1.8, 0.25), x, y + 0.9, z, a, 0x8a8a92); add(box(1.1, 0.25, 0.25), x, y + 1.3, z, a, 0x8a8a92); } });
          scatter(14, 3, 30, (x, y, z) => { add(ball(0.8, 8), x, y + 0.75, z, 0, 0xe87a1a, 1, 0.8, 1); add(box(0.15, 0.4, 0.15), x, y + 1.5, z, 0, 0x3a6a1a); glow(box(0.5, 0.25, 0.1), x, y + 0.7, z + 0.74, 0, 0xffe14a); });
          if (tuns && tuns[0]) { const [s, e] = tuns[0], mid = L.wrap(Math.round((s + e) / 2)), p = L.P[mid], yaw = Math.atan2(L.D[mid].x, L.D[mid].z), len = (e - s) * L.step;
            for (const sd of [-1, 1]) { const q = L.at(mid, sd * (FL.hw[mid] + 11), 0); add(box(18, 15, len + 4), q.x, q.y + 7.5, q.z, yaw, 0x4a3a4a); add(cone(13, 7, 4), q.x, q.y + 18.5, q.z, yaw + Math.PI / 4, 0x2a1a2a, 1, 1, (len + 4) / 18); for (let k = -2; k <= 2; k++) for (const hy of [5, 10]) glow(box(1.4, 2, 0.1), q.x + Math.sin(yaw) * k * len / 5 - Math.cos(yaw) * sd * -9.05, q.y + hy, q.z + Math.cos(yaw) * k * len / 5 + Math.sin(yaw) * sd * -9.05, yaw + Math.PI / 2, 0xffd86a); }
            for (const sd of [-1, 1]) { const q = L.at(mid, sd * (FL.hw[mid] + 20), 0); add(cyl(3, 3, 24, 8), q.x, q.y + 12, q.z, 0, 0x3a2a3a); add(cone(4, 8, 8), q.x, q.y + 28, q.z, 0, 0x1a0a1a); glow(box(1, 1.6, 0.1), q.x, q.y + 18, q.z + 3.02, 0, 0xffd86a); }
            const q = L.at(mid, 0, 0); add(box(FL.hw[mid] * 2 + 6, 6, len + 2), q.x, q.y + 11, q.z, yaw, 0x4a3a4a); add(cone(FL.hw[mid] + 6, 8, 4), q.x, q.y + 18, q.z, yaw + Math.PI / 4, 0x2a1a2a, 1, 1, 0.6); }
          hills(0x1a1028);
        } else if (tr.props === 'desert') {
          scatter(60, 3, 70, (x, y, z, s) => { add(cyl(0.5 * s, 0.55 * s, 6 * s, 7), x, y + 3 * s, z, 0, 0x3a8a3a); add(ball(0.5 * s, 7), x, y + 6 * s, z, 0, 0x3a8a3a); const a = R() * 6; for (const sd of [-1, 1]) { const h0 = (2 + R() * 2) * s; add(cyl(0.36 * s, 0.36 * s, 1.4 * s, 6), x + Math.cos(a) * sd * 1.1 * s, y + h0, z + Math.sin(a) * sd * 1.1 * s, 0, 0x2e7a2e, 1, 1, 1, 0, Math.PI / 2); add(cyl(0.34 * s, 0.34 * s, 2 * s, 6), x + Math.cos(a) * sd * 1.75 * s, y + h0 + 1 * s, z + Math.sin(a) * sd * 1.75 * s, 0, 0x3a8a3a); } });
          scatter(14, 44, 120, (x, y, z) => { const w = 14 + R() * 18, h = 14 + R() * 26; add(cyl(w, w * 1.15, h, 7), x, y + h / 2, z, R() * 6, 0xb8603a); add(cyl(w * 1.02, w * 1.02, 2, 7), x, y + h * 0.55, z, 0, 0x9a4a2a); add(cyl(w * 0.98, w, 1.4, 7), x, y + h, z, 0, 0xc87a4a); });
          scatter(20, 3, 50, (x, y, z) => add(dode(0.8 + R() * 1.2), x, y + 0.5, z, R() * 6, 0xa0583a, 1, 0.7, 1));
          const wt = spot(12, 40, 60); if (wt) { for (const [u, v] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) add(box(0.3, 9, 0.3), wt.x + u, wt.y + 4.5, wt.z + v, 0, 0x6a4a2a); add(cyl(2.6, 2.6, 4, 10), wt.x, wt.y + 11, wt.z, 0, 0x8a6a4a); add(cone(2.9, 1.6, 10), wt.x, wt.y + 13.8, wt.z, 0, 0x5a3a2a); }
          if (tuns && tuns[0]) { const [start,end]=tuns[0];
            // A real arch: no solid mesa across the tunnel mouth or the driving line.
            for(let k=start;k<=end;k+=4) { const i=L.wrap(k),yaw=Math.atan2(L.D[i].x,L.D[i].z);
              for(const side of [-1,1]) { const p=L.at(i,side*(FL.hw[i]+4.2),0);
                add(dode(1),p.x,p.y+5,p.z,yaw,0xb8603a,3.5,8,6); }
              const p=L.P[i]; add(dode(1),p.x,p.y+10.8,p.z,yaw,0xc87846,FL.hw[i]+11,3.7,6);
            }
          }
        } else if (tr.props === 'castle') {
          torches = [];
          for (let i = 0; i < N; i += 24) for (const s of [-1, 1]) { if (FL.tun[i] || (s < 0 ? FL.dropL[i] : FL.dropR[i])) continue; const p = wallAt(i, s); if (!p) continue; add(cyl(2.2, 2.4, 11, 8), p.x + L.R[i].x * s * 1.6, p.y + 5.5 - 3, p.z + L.R[i].z * s * 1.6, 0, 0x7a7478); add(cone(2.8, 4, 8), p.x + L.R[i].x * s * 1.6, p.y + 10.5, p.z + L.R[i].z * s * 1.6, 0, 0x8a1a1a); add(box(0.08, 2, 1.4), p.x + L.R[i].x * s * 1.6, p.y + 13.2, p.z + L.R[i].z * s * 1.6 + 0.7, 0, 0xffe14a); glow(box(0.8, 1.2, 0.1), p.x + L.R[i].x * s * 0.4, p.y + 5, p.z + L.R[i].z * s * 0.4, Math.atan2(L.R[i].x, L.R[i].z), 0xffa040); }
          for (let i = 6; i < N; i += 12) for (const s of [-1, 1]) { if (s < 0 ? FL.dropL[i] : FL.dropR[i]) continue; const lat = FL.tun[i] ? FL.hw[i] + 0.8 : FL.lim[i] + 0.3; const p = L.at(i, s * lat, 0); add(box(0.25, 1.8, 0.25), p.x, p.y + 0.9, p.z, 0, 0x3a2a1a); glow(box(0.4, 0.5, 0.4), p.x, p.y + 2, p.z, 0, 0xffa020); torches.push([p.x, p.y + 2.3, p.z]); }
          for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, r = 200 + R() * 80; add(dode(10 + R() * 12), Math.cos(a) * r, gY, Math.sin(a) * r, R() * 6, 0x2a1a14, 1, 0.8, 1); }
          const kp = { x: (mnx + mxx) / 2, z: mxz + 70 }; add(box(40, 40, 30), kp.x, gY + 20, kp.z, 0, 0x5a5458); for (const [u, v] of [[-22, -16], [22, -16], [-22, 16], [22, 16]]) { add(cyl(6, 6, 54, 8), kp.x + u, gY + 27, kp.z + v, 0, 0x6a6468); add(cone(7.5, 12, 8), kp.x + u, gY + 60, kp.z + v, 0, 0x8a1a1a); } for (let k = -3; k <= 3; k++) glow(box(2, 4, 0.2), kp.x + k * 5, gY + 30, kp.z - 15.1, 0, 0xffb040);
          smokers = [[kp.x - 22, gY + 66, kp.z - 16]];
        } else if (tr.props === 'jungle') {
          scatter(70, 4, 70, (x, y, z, s) => { if (R() < 0.5) palm(x, y, z, s * 1.2); else { add(cyl(0.5 * s, 0.7 * s, 7 * s, 6), x, y + 3.5 * s, z, 0, 0x5a4a2a); add(ball(3.4 * s, 7), x, y + 8 * s, z, R() * 6, R() < 0.5 ? 0x1e6a1e : 0x2a7a2a, 1, 0.6, 1); } });
          scatter(60, 2, 40, (x, y, z, s) => { for (let f = 0; f < 5; f++) add(box(0.6 * s, 0.08, 2.4 * s), x + Math.sin(f * 1.26) * 1 * s, y + 0.6 * s, z + Math.cos(f * 1.26) * 1 * s, f * 1.26, 0x3a9a2a, 1, 1, 1, -0.5); });
          scatter(10, 4, 40, (x, y, z) => { add(cyl(0.5, 0.6, 2, 6), x, y + 1, z, 0, 0xf0e8d0); add(ball(1.8, 8), x, y + 2.2, z, 0, 0xd8261c, 1, 0.55, 1); });
          scatter(10, 6, 40, (x, y, z) => { const a = R() * 6; add(box(2, 5 + R() * 4, 2), x, y + 3, z, a, 0x8a8a7a); add(box(2.6, 0.8, 2.6), x, y + 0.4, z, a, 0x7a7a6a); if (R() < 0.5) add(box(6, 1, 2), x + 2, y + 7.5, z, a, 0x8a8a7a); });
          const vx = (mnx + mxx) / 2 + 30, vz = mnz - 160; add(cone(110, 90, 10), vx, gY + 44, vz, 0, 0x5a4a3a); add(cone(30, 8, 10), vx, gY + 86, vz, 0, 0x3a2a1a); glow(cyl(22, 22, 1, 10), vx, gY + 88, vz, 0, 0xff5a1a); smokers = [[vx, gY + 92, vz]];
          // the friendly long-necked dinosaur wandering about in the trees
          const dp = []; const dk = (geo, x, y, z, c, sx, sy, sz, rx, rz) => dp.push({ geo, m: RK.M(T, x, y, z, 0, sx, sy, sz, rx, rz), c });
          dk(new T.SphereGeometry(4, 10, 8), 0, 7, 0, 0x5aa04a, 1, 0.75, 1.5); dk(new T.CylinderGeometry(0.9, 1.6, 10, 8), 0, 12, 6.5, 0x5aa04a, 1, 1, 1, 0.55); dk(new T.BoxGeometry(1.8, 1.6, 3), 0, 16.3, 9.6, 0x6ab05a); dk(new T.BoxGeometry(0.3, 0.4, 0.3), 0.7, 16.8, 10.6, 0x101010); dk(new T.BoxGeometry(0.3, 0.4, 0.3), -0.7, 16.8, 10.6, 0x101010);
          dk(new T.ConeGeometry(1.6, 11, 7), 0, 6.5, -9, 0x5aa04a, 1, 1, 1, -1.35); for (const [u, v] of [[-2, -3], [2, -3], [-2, 3], [2, 3]]) dk(new T.CylinderGeometry(0.9, 1, 5, 7), u, 2.5, v, 0x4a903a); for (let k = 0; k < 5; k++) dk(new T.ConeGeometry(0.5, 1.2, 4), 0, 10.1, -3 + k * 1.6, 0xe8a83a);
          dino = new T.Mesh(RK.merge(T, dp), matV); dp.forEach(p => p.geo.dispose()); dino.cx = (mnx + mxx) / 2; dino.cz = (mnz + mxz) / 2; dino.r = Math.max(mxx - mnx, mxz - mnz) * 0.5 + 45; world.add(dino);
        } else if (tr.props === 'space') {
          for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, r = 180 + R() * 120, y = -40 + R() * 120, rad = 6 + R() * 22, c = pick([0xc86a3a, 0x6a9ae0, 0xe0d06a, 0x9a5ae0, 0x5ae0a0]); add(ball(rad, 14), Math.cos(a) * r, y, Math.sin(a) * r, 0, c); if (R() < 0.5) add(new T.TorusGeometry(rad * 1.6, rad * 0.12, 4, 24), Math.cos(a) * r, y, Math.sin(a) * r, 0, 0xe8d8a8, 1, 1, 1, 1.2, 0.3); }
          for (let k = 0; k < 40; k++) { const a = R() * TAU, r = 100 + R() * 160; add(dode(1 + R() * 4), Math.cos(a) * r, -30 + R() * 100, Math.sin(a) * r, R() * 6, 0x6a5a6a); }
          for (let k = 0; k < 30; k++) { const a = R() * TAU, r = 60 + R() * 120; glow(new T.OctahedronGeometry(1.2, 0), Math.cos(a) * r, 10 + R() * 60, Math.sin(a) * r, R() * 6, pick([0xffe14a, 0xff8ad0, 0x8affff])); }
          const sp = { x: 0, z: (mnz + mxz) / 2 + 40 }; add(cyl(4, 4, 30, 10), sp.x, 70, sp.z, 0, 0xd8d8e0, 1, 1, 1, 0, Math.PI / 2); add(new T.TorusGeometry(16, 1.6, 6, 20), sp.x, 70, sp.z, 0, 0xc8c8d0, 1, 1, 1, 0, Math.PI / 2); for (const s of [-1, 1]) add(box(1, 14, 20), sp.x + s * 22, 70, sp.z, 0, 0x2a4aa8); glow(box(31, 0.6, 0.6), sp.x, 70, sp.z, 0, 0x8affff);
        }
        // Tile visibility selects an index stream in ONE draw per material. Separate meshes
        // save triangles but cost too many software-renderer draw calls on a busy starting grid.
        const batch = (parts,mat) => {
          if (!parts.length) return;
          const bins = new Map();
          for(const part of parts){const e=part.m.elements,key=Math.floor(e[12]/48)+':'+Math.floor(e[14]/48);if(!bins.has(key))bins.set(key,[]);bins.get(key).push(part);}
          const ordered=[],ranges=[];let offset=0;
          for(const bin of bins.values()){
            const bounds=new T.Box3();bounds.makeEmpty();let count=0;
            for(const part of bin){part.geo.computeBoundingBox();bounds.union(part.geo.boundingBox.clone().applyMatrix4(part.m));count+=part.geo.index?part.geo.index.count:part.geo.attributes.position.count;ordered.push(part);}
            ranges.push({start:offset,count,sphere:bounds.getBoundingSphere(new T.Sphere())});offset+=count;
          }
          const geo=RK.merge(T,ordered),Index=offset>65535?Uint32Array:Uint16Array,all=new Index(offset),visible=new Index(offset);
          for(let i=0;i<offset;i++)all[i]=i;
          const index=new T.BufferAttribute(visible,1).setUsage(T.DynamicDrawUsage);geo.setIndex(index);geo.setDrawRange(0,0);
          const mesh=new T.Mesh(geo,mat);mesh.frustumCulled=false;world.add(mesh);
          sceneryBatches.push({mesh,geo,index,all,visible,ranges,key:''});
        };
        batch(P,matP);batch(G,matG);
        P.concat(G).forEach(p => p.geo.dispose());
      }
      function cullScenery() {
        if(!sceneryBatches.length)return;
        T3.cam.updateMatrixWorld();sceneryClip.multiplyMatrices(T3.cam.projectionMatrix,T3.cam.matrixWorldInverse);
        sceneryFrustum.setFromProjectionMatrix(sceneryClip);
        for(const b of sceneryBatches){
          let key='',count=0;
          for(const range of b.ranges)key+=sceneryFrustum.intersectsSphere(range.sphere)?'1':'0';
          if(key===b.key)continue;b.key=key;
          for(let i=0;i<b.ranges.length;i++)if(key[i]==='1'){const r=b.ranges[i];b.visible.set(b.all.subarray(r.start,r.start+r.count),count);count+=r.count;}
          b.mesh.visible=count>0;b.geo.setDrawRange(0,count);b.index.needsUpdate=true;
        }
      }
      function inTrench(x, z) { if (!TR.trench) return false; const N = L.N, ic = Math.round((TR.trench[0] + TR.trench[1]) / 2 * N) % N, c = L.P[ic], d = L.D[ic], half = (TR.trench[1] - TR.trench[0]) * L.L / 2 + 8; return Math.abs((x - c.x) * d.x + (z - c.z) * d.z) < half; }

      // ---------------------------------------------------------------- hazards (one instanced mesh per kind)
      function hazGeo(k) {
        const P = [], a = (geo, x, y, z, c, sx, sy, sz, rx, rz, ry) => P.push({ geo, m: RK.M(T, x, y, z, ry || 0, sx, sy, sz, rx, rz), c });
        if (k === 'mole') { a(new T.SphereGeometry(0.75, 10, 8), 0, 0.6, 0, 0x6a4a3a, 1, 1.2, 1); a(new T.SphereGeometry(0.22, 6, 5), 0, 0.95, 0.68, 0xf0a0b0); a(new T.BoxGeometry(0.16, 0.2, 0.05), -0.25, 1.2, 0.62, 0x101010); a(new T.BoxGeometry(0.16, 0.2, 0.05), 0.25, 1.2, 0.62, 0x101010); a(new T.BoxGeometry(0.5, 0.18, 0.05), 0, 0.65, 0.72, 0xffffff); a(new T.CylinderGeometry(1.1, 1.4, 0.4, 10), 0, -0.1, 0, 0x5a3a1a); }
        else if (k === 'crab') { a(new T.SphereGeometry(0.9, 10, 6), 0, 0.6, 0, 0xe8401a, 1.3, 0.6, 1); for (const s of [-1, 1]) { a(new T.SphereGeometry(0.4, 6, 5), s * 1.3, 0.8, 0.6, 0xf0502a, 1, 0.7, 1.3); a(new T.BoxGeometry(0.12, 0.5, 0.12), s * 0.3, 1.1, 0.4, 0xe8401a); a(new T.SphereGeometry(0.13, 6, 4), s * 0.3, 1.38, 0.42, 0x101010); for (let l = 0; l < 3; l++) a(new T.BoxGeometry(0.9, 0.1, 0.1), s * 1.1, 0.35, -0.4 + l * 0.35, 0xc8301a, 1, 1, 1, 0, s * 0.5); } }
        else if (k === 'snowman') { a(new T.SphereGeometry(1.1, 10, 8), 0, 1, 0, 0xffffff); a(new T.SphereGeometry(0.8, 10, 8), 0, 2.5, 0, 0xffffff); a(new T.SphereGeometry(0.55, 10, 8), 0, 3.6, 0, 0xffffff); a(new T.ConeGeometry(0.13, 0.6, 5), 0, 3.6, 0.68, 0xff7a1a, 1, 1, 1, Math.PI / 2); a(new T.BoxGeometry(0.12, 0.12, 0.05), -0.2, 3.78, 0.5, 0x101010); a(new T.BoxGeometry(0.12, 0.12, 0.05), 0.2, 3.78, 0.5, 0x101010); a(new T.CylinderGeometry(0.45, 0.45, 0.7, 10), 0, 4.25, 0, 0x1a1a1a); a(new T.BoxGeometry(1.6, 0.25, 0.25), 0, 3.05, 0.1, 0xd8261c); }
        else if (k === 'ghost') { a(new T.SphereGeometry(1.1, 10, 8), 0, 1.6, 0, 0xf0f0ff); a(new T.CylinderGeometry(1.1, 1.4, 1.6, 10), 0, 0.8, 0, 0xe8e8ff); a(new T.BoxGeometry(0.25, 0.4, 0.05), -0.35, 1.75, 1.02, 0x101020); a(new T.BoxGeometry(0.25, 0.4, 0.05), 0.35, 1.75, 1.02, 0x101020); a(new T.SphereGeometry(0.22, 6, 5), 0, 1.25, 1.0, 0x301030, 1, 1.4, 0.4); for (const s of [-1, 1]) a(new T.SphereGeometry(0.35, 6, 5), s * 1.3, 1.2, 0.3, 0xf0f0ff); }
        else if (k === 'weed' || k === 'boulder') { if (k === 'weed') { for (let r = 0; r < 10; r++) a(new T.TorusGeometry(0.75 + (r % 3) * 0.15, 0.08, 3, 10), 0, 0, 0, r % 2 ? 0xb08a4a : 0x8a6a32, 1, 1, 1, r * 0.63, r * 1.1, r * 0.37); a(new T.IcosahedronGeometry(0.55, 0), 0, 0, 0, 0x9a7a3a); } else { a(new T.DodecahedronGeometry(1.7, 1), 0, 0, 0, 0x7a7a6a); a(new T.DodecahedronGeometry(0.6, 0), 1.2, 0.6, 0.4, 0x6a6a5a); } }
        else if (k === 'krumbler') { a(new T.BoxGeometry(4.2, 4.2, 3.6), 0, 2.1, 0, 0x8a8a96); a(new T.BoxGeometry(0.8, 0.9, 0.1), -0.9, 2.8, 1.82, 0xffffff); a(new T.BoxGeometry(0.8, 0.9, 0.1), 0.9, 2.8, 1.82, 0xffffff); a(new T.BoxGeometry(0.35, 0.45, 0.1), -0.9, 2.7, 1.86, 0x101010); a(new T.BoxGeometry(0.35, 0.45, 0.1), 0.9, 2.7, 1.86, 0x101010); a(new T.BoxGeometry(2.4, 0.3, 0.1), 0, 1.3, 1.82, 0x202020); for (const s of [-1, 1]) a(new T.ConeGeometry(0.45, 0.9, 4), s * 2.3, 2.1, 0, 0x6a6a76, 1, 1, 1, 0, -s * Math.PI / 2); }
        else if (k === 'star') { const sh = new T.Shape(); for (let q = 0; q < 10; q++) { const ang = Math.PI / 2 + q / 10 * TAU, r = q % 2 ? 0.62 : 1.5; q ? sh.lineTo(Math.cos(ang) * r, Math.sin(ang) * r) : sh.moveTo(Math.cos(ang) * r, Math.sin(ang) * r); } const g = new T.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 1 }); g.translate(0, 0, -0.25); a(g, 0, 0, 0, 0xffe14a); for (const s of [-1, 1]) for (const f of [-1, 1]) a(new T.BoxGeometry(0.16, 0.36, 0.06), s * 0.28, 0.12, f * 0.42, 0x101010); }
        const g = RK.merge(T, P); P.forEach(p => p.geo.dispose()); return g;
      }
      function buildHaz(tr, sg) {
        haz = []; hazIM = [];
        const by = {};
        for (const h of tr.haz || []) {
          const i0 = Math.round(h.f * L.N) % L.N;
          if (h.lats) h.lats.forEach((lat, j) => (by[h.k] = by[h.k] || []).push({ k: h.k, i: L.wrap(i0 + j * 2), lat: lat * sg, base: lat * sg, ph: Math.random(), gone: 0 }));
          else for (let j = 0; j < h.n; j++) (by[h.k] = by[h.k] || []).push({ k: h.k, i: L.wrap(i0 + Math.round((j - (h.n - 1) / 2) * (h.k === 'mole' ? 3 : 5))), lat: h.k === 'mole' ? ((j % 3) - 1) * FL.hw[i0] * 0.5 : 0, base: h.k === 'mole' ? ((j % 3) - 1) * FL.hw[i0] * 0.5 : 0, ph: j / h.n + Math.random() * 0.2, gone: 0 });
        }
        for (const k in by) {
          const mat = k === 'ghost' ? T3.mat({ vcol: true, transparent: true, opacity: 0.72, lit: false }) : k === 'star' ? matG : matV;
          const im = new T.InstancedMesh(hazGeo(k), mat, by[k].length); im.frustumCulled = false; world.add(im);
          hazIM.push({ k, im, list: by[k] }); haz.push(...by[k]);
        }
        hazUpdate(0, 0);
      }
      const HR = { mole: 1.2, crab: 1.5, snowman: 1.4, ghost: 1.5, weed: 1.2, boulder: 2.0, krumbler: 2.4, star: 1.6 };
      function hazUpdate(dt, t) {
        for (const g of hazIM) {
          g.list.forEach((h, n) => {
            const i = h.i, hw = FL.hw[i]; let y = 0, ry = Math.atan2(L.D[i].x, L.D[i].z), rx = 0, s = 1, sy = 1;
            if (h.gone > 0) { h.gone -= dt; h.up = false; g.im.setMatrixAt(n, ZERO); return; }
            if (h.k === 'mole') { const c = (t * 0.45 + h.ph) % 1; h.up = c < 0.45; y = h.up ? Math.min(1, Math.sin(c / 0.45 * Math.PI) * 2) * 0.2 - 0.05 : -1.6; }
            else if (h.k === 'crab') { h.lat = Math.sin(t * 0.8 + h.ph * TAU) * (hw - 1.2); ry += Math.PI / 2 * Math.sign(Math.cos(t * 0.8 + h.ph * TAU)); y = Math.abs(Math.sin(t * 9 + h.ph * 9)) * 0.15; h.up = true; }
            else if (h.k === 'ghost') { h.lat = Math.sin(t * 0.55 + h.ph * TAU) * (hw + 1.5); y = 0.6 + Math.sin(t * 2.2 + h.ph * 7) * 0.5; ry += Math.sin(t * 0.55 + h.ph * TAU) > 0 ? 0.6 : -0.6; ry += Math.PI; h.up = true; }
            else if (h.k === 'weed' || h.k === 'boulder') { const sp = h.k === 'weed' ? 0.22 : 0.15, c = (t * sp + h.ph) % 1; h.lat = (c * 2 - 1) * (hw + 8); y = h.k === 'weed' ? 0.9 + Math.abs(Math.sin(t * 5 + h.ph * 6)) * 0.6 : 1.7; rx = t * (h.k === 'weed' ? 7 : 3); ry += Math.PI / 2; h.up = Math.abs(h.lat) < hw + 2; }
            else if (h.k === 'krumbler') { const c = (t * 0.32 + h.ph) % 1; y = c < 0.45 ? 6 : c < 0.5 ? 6 * (1 - (c - 0.45) / 0.05) : c < 0.75 ? 0 : 6 * (c - 0.75) / 0.25; h.down = c >= 0.48 && c < 0.75; h.slam = c >= 0.48 && c < 0.52; h.up = true; h.y0 = y; }
            else if (h.k === 'star') { h.lat = Math.sin(t * 0.9 + h.ph * TAU) * (hw - 2); y = 1.4 + Math.sin(t * 3 + h.ph * 5) * 0.4; ry = t * 3; h.up = true; }
            else if (h.k === 'snowman') { h.up = true; }
            const p = L.at(i, h.lat, 0, V2); h.x = p.x; h.y = p.y; h.z = p.z;
            setI(g.im, n, p.x, p.y + y, p.z, ry, s, rx, 0, sy);
          });
          g.im.instanceMatrix.needsUpdate = true;
        }
      }

      // Two tyre ribbons, pooled in one draw call. The storage is reused for the whole cartridge session.
      const skidCapacity = 320, skidPos = new Float32Array(skidCapacity * 18);
      const skidGeo = T3.keep(new T.BufferGeometry());
      skidGeo.setAttribute('position', new T.BufferAttribute(skidPos, 3).setUsage(T.DynamicDrawUsage));
      const skidMat = T3.mat({ color: 0x202032, lit: false, transparent: true, opacity: .42, side: T.DoubleSide });
      skidMat.depthWrite = false;
      const skidMesh = new T.Mesh(skidGeo, skidMat); skidMesh.frustumCulled = false; T3.add(skidMesh);
      let skidHead = 0, skidCount = 0; skidGeo.setDrawRange(0,0);
      function clearSkids() { skidPos.fill(0); skidGeo.attributes.position.needsUpdate = true; skidHead = 0; skidCount = 0; skidGeo.setDrawRange(0,0); }
      function tyreMarks(k) {
        if (!k.drift || k.air || k.spin > 0 || k.rescue > 0 || k.v < 7) { k.tyres = null; return; }
        const rx = -Math.cos(k.yaw), rz = Math.sin(k.yaw), fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
        const x = k.x - fx, z = k.z - fz;
        if (k.tyres && Math.hypot(x - k.tyres.x, z - k.tyres.z) < .45) return;
        const now = { x, y: k.y + .085, z, rx, rz };
        if (k.tyres && Math.hypot(x-k.tyres.x,z-k.tyres.z)<2.5) for (const side of [-1,1]) {
          const a = k.tyres, b = now, v = [];
          for (const [p,w] of [[a,.86],[b,.86],[a,1.12],[a,1.12],[b,.86],[b,1.12]])
            v.push(p.x+p.rx*side*w,p.y,p.z+p.rz*side*w);
          skidPos.set(v, skidHead * 18); skidHead = (skidHead+1)%skidCapacity; skidCount=Math.min(skidCapacity,skidCount+1);skidGeo.setDrawRange(0,skidCount*6);
          skidGeo.attributes.position.needsUpdate = true;
        }
        k.tyres = now;
      }

      // ---------------------------------------------------------------- the karts
      const kartsG = new T.Group(); T3.scene.add(kartsG);
      const kartMesh = [];
      function meshFor(d) { if (!kartMesh[d]) { kartMesh[d] = new T.Mesh(kartGeo[d], matV); kartsG.add(kartMesh[d]); } return kartMesh[d]; }
      let ghostMesh = null, ghost = null, ghRec = null;
      function mkKart(d, ai, skill) {
        const D = DRIVERS[d], cls = CLASSES[cfg.cc];
        return { d, D, n: D.n, ai, skill: skill || 1, aiMul: 1, mesh: meshFor(d), x: 0, z: 0, y: 0, vy: 0, yaw: 0, spinYaw: 0, spinDir: 1, v: 0, vl: 0, idx: 0, prog: 0, lap: 0, done: false, ft: 0,
          item: '', icount: 0, roll: 0, rollItem: '', spin: 0, tumble: 0, boost: 0, star: 0, small: 0, squash: 0, ink: 0, drift: 0, dc: 0, dl: 0, air: false, rescue: 0, safe: 0, inv: 0, lat: 0, stuck: 0,
          cool: 2 + Math.random() * 3, lane: (Math.random() - 0.5) * 3, wob: Math.random() * 6, hits: 0, balloons: 3, out: false, pts: 0, last: 0,
          top: cls.top * (0.94 + D.spd * 0.025), acc: 8.5 + D.acc * 1.9, turn: 1.8 + D.hnd * 0.11, wt: D.wt, wrong: 0, early: null, lapStart: 0, laps: [], bestLap: 0, hold: 0, spark: 0, rescues: 0, steer: 0, aiDrift: 0, driftRest: 0 };
      }
      function gridUp(list) {
        list.forEach((k, n) => {
          const i = L.wrap(-3 - Math.floor(n / 2) * 4), lat = (n % 2 ? 1 : -1) * FL.hw[0] * 0.45, p = L.at(i, lat, 0);
          k.x = p.x; k.z = p.z; k.y = p.y; k.idx = i; k.prog = i - L.N; k.yaw = Math.atan2(L.D[i].x, L.D[i].z); k.safe = i; k.v = 0; k.vl = 0; k.vy = 0; k.air = false;
          k.mesh.visible = true;
        });
      }
      const rankV = k => k.done ? 1e7 - k.ft : k.prog + L.along(k.idx, k.x, k.z) / L.step;
      let rankC = [];
      function rank() { return rankC; }
      function doRank() { rankC = karts.slice().sort((a, b) => rankV(b) - rankV(a)); rankC.forEach((k, n) => { k.place = n; }); }
      function groundAt(i, lat, along) {
        if (FL.gap[i]) return -999;
        const hw = FL.hw[i]; if (Math.abs(lat) > hw + 0.9 && (lat < 0 ? FL.dropL[i] : FL.dropR[i])) return -999;
        const j = along >= 0 ? L.wrap(i + 1) : L.wrap(i - 1), f = Math.min(1, Math.abs(along) / L.step), a = L.P[i], b = L.P[j];
        return a.y + (b.y - a.y) * f + L.R[i].y * clamp(lat, -FL.lim[i] - 1, FL.lim[i] + 1) + rampH(i, lat);
      }
      // ---- the arena (Battle)
      let AR = null;
      function arenaClamp(o, r) { // keep o inside the arena and out of the obstacles; returns the push normal or null
        let nx = 0, nz = 0, hit = false;
        if (AR.shape === 'round') { const d = Math.hypot(o.x, o.z); if (d > AR.r - r) { const k = (AR.r - r) / d; nx = -o.x / d; nz = -o.z / d; o.x *= k; o.z *= k; hit = true; } }
        else { for (const ax of ['x', 'z']) { if (o[ax] > AR.r - r) { o[ax] = AR.r - r; if (ax === 'x') nx = -1; else nz = -1; hit = true; } if (o[ax] < -AR.r + r) { o[ax] = -AR.r + r; if (ax === 'x') nx = 1; else nz = 1; hit = true; } } }
        for (const ob of AR.obs) { const dx = o.x - ob[0], dz = o.z - ob[1], d = Math.hypot(dx, dz), m = ob[2] + r; if (d < m && d > 1e-4) { o.x = ob[0] + dx / d * m; o.z = ob[1] + dz / d * m; nx = dx / d; nz = dz / d; hit = true; } }
        if (!hit) return null; const l = Math.hypot(nx, nz) || 1; return { x: nx / l, z: nz / l };
      }

      // ---- one kart, one step. inp: { steer, gas, brake, hop, driftHeld }
      function drive(k, inp, dt) {
        const battle = cfg.kind === 'battle';
        // A short steering rack travel filters digital keys without delaying analogue corrections.
        const targetSteer = inp.steer || 0;
        k.steer += (targetSteer - k.steer) * Math.min(1, dt * (targetSteer ? 14 : 20));
        let steer = k.steer, gas = inp.gas, brk = inp.brake;
        const busy = k.spin > 0 || k.rescue > 0 || k.tumble > 0 || k.out;
        if (busy) { gas = 0; brk = 0; steer = 0; }
        let i = 0, sc = -1, onRoad = true, g = 0, ice = false, mud = false;
        if (!battle) {
          const N = L.N; sc = inShort(k);
          const prev = k.idx; k.idx = L.nearest(k.x, k.z, k.idx, sc >= 0 ? 60 : 14);
          let d = k.idx - prev; if (d < -N / 2) d += N; if (d > N / 2) d -= N; k.prog += d;
          i = k.idx; k.lat = L.lat(i, k.x, k.z);
          const hw = FL.hw[i], alat = Math.abs(k.lat);
          onRoad = alat <= hw + 0.8 || sc >= 0;
          ice = !!FL.ice[i] && alat < hw;
          for (const m of FL.mud) if ((k.x - m.x) * (k.x - m.x) + (k.z - m.z) * (k.z - m.z) < m.r * m.r) mud = true;
          if (mud && !k.ai && k.v > 6 && K.frame % 3 === 0 && fxN) fxN.emit(k.x, k.y + 0.3, k.z, (Math.random() - 0.5) * 3, 3, (Math.random() - 0.5) * 3, 0.5, 0x5a3e22, 0.5, { g: 12 });
        }
        // top speed
        let top = k.top * k.aiMul;
        if (k.small > 0) top *= 0.72; if (k.star > 0) top *= 1.14; if (k.squash > 0) top *= 0.6;
        const boosting = k.boost > 0 || k.star > 0;
        if (!onRoad && !boosting) top *= 0.55;
        if (mud && !boosting) top *= 0.5;
        if (k.boost > 0) { top *= 1.3; k.boost -= dt; }
        if (k.boost > 0 && !busy) k.v += Math.max(0, top - k.v) * Math.min(1, dt * 6);
        else if (gas) { if (k.v < top) k.v += (k.acc * (1 - Math.max(0, k.v) / (top * 1.06)) + 1.2) * dt; }
        else if (brk) { k.v -= (k.v > 0.5 ? 22 : 7) * dt; if (k.v < -7) k.v = -7; }
        else k.v -= Math.sign(k.v) * Math.min(Math.abs(k.v), (busy ? 14 : 5) * dt);
        if (k.v > top + 0.3 && k.boost <= 0) k.v -= Math.min(k.v - top, (onRoad ? 12 : 26) * dt);
        // hop and drift (hold R while turning)
        if (inp.hop && !k.air && !busy && Math.abs(k.v) > 3) {
          k.air = true; k.vy = 4.4; k.y += 0.03;
          if (Math.abs(targetSteer) > 0.25 && k.v > 9) { k.drift = Math.sign(targetSteer); k.dc = 0; k.dl = 0; }
          if (!k.ai) K.sfx.tone(520, 0.08, 'square', 0.05, 0, 760);
        }
        if (k.drift) {
          if (!inp.driftHeld || k.v < 7 || busy) {
            const lv = k.dl; k.drift = 0; k.dc = 0; k.dl = 0;
            if (lv > 0 && !busy) { k.boost = Math.max(k.boost, [0, 0.6, 1.05][lv]); if (!k.ai) { K.sfx.noise(0.4, 0.14, 900, 0, 'bandpass', 3200); say(['', 'MINI-TURBO!', 'SUPER MINI-TURBO!'][lv], 0.8); shake = Math.max(shake, 0.12); } }
          } else {
            k.dc += dt * (steer * k.drift > 0.2 ? 1.25 : steer * k.drift < -0.2 ? 0.8 : 1);
            const lv = k.dc > 1.45 ? 2 : k.dc > 0.65 ? 1 : 0;
            if (lv > k.dl) { k.dl = lv; if (!k.ai) K.sfx.tone([0, 880, 1175, 1568][lv], 0.08, 'square', 0.05); }
          }
        }
        const grip = ice ? 0.28 : 1, sp = clamp(Math.abs(k.v) / 7, 0, 1) * (k.v < -0.2 ? -1 : 1);
        let turn = k.drift ? (k.drift * 0.48 + steer * 0.46) * k.turn : steer * k.turn * sp * (1 - 0.32 * clamp(k.v / k.top, 0, 1));
        if (k.air && !k.drift) turn *= 0.35;
        if (k.spin > 0) k.yaw += dt * 15 * k.spinDir; else k.yaw -= turn * dt;
        k.yaw = wrapA(k.yaw);
        k.vl += -turn * Math.max(0, k.v) * (k.drift ? 0.32 : 0.1) * dt * (ice ? 1.6 : 1);
        k.vl *= Math.exp(-(k.drift ? 2.2 : 8) * grip * dt);
        const my = k.spin > 0 || k.tumble > 0 ? k.spinYaw : k.yaw;
        const rx = -Math.cos(k.yaw), rz = Math.sin(k.yaw);
        k.x += (Math.sin(my) * k.v + rx * k.vl) * dt; k.z += (Math.cos(my) * k.v + rz * k.vl) * dt;
        let bump = 0;
        if (battle) {
          const n = arenaClamp(k, k.small > 0 ? 1.0 : 1.6);
          if (n) { const vx = Math.sin(my) * k.v + rx * k.vl, vz = Math.cos(my) * k.v + rz * k.vl, into = -(vx * n.x + vz * n.z); if (into > 0) { const nvx = vx + n.x * into * 1.3, nvz = vz + n.z * into * 1.3; k.v = nvx * Math.sin(k.yaw) + nvz * Math.cos(k.yaw); k.vl = nvx * rx + nvz * rz; bump = into; } }
          g = 0;
        } else {
          // the walls (not over a drop, not in the short cut)
          const lat2 = L.lat(i, k.x, k.z), side = lat2 < 0 ? -1 : 1, lim = FL.lim[i];
          const dropSide = (side < 0 ? FL.dropL[i] : FL.dropR[i]) || FL.gap[i];
          if (short) {
            const ax=short.A.x,az=short.A.z,bx=short.B.x-ax,bz=short.B.z-az,ll=bx*bx+bz*bz,tt=((k.x-ax)*bx+(k.z-az)*bz)/ll;
            if(tt>.14&&tt<.86){
              const px=ax+bx*tt,pz=az+bz*tt,dx=k.x-px,dz=k.z-pz,dd=Math.hypot(dx,dz),radius=k.small>0?.72:1.32;
              const inside=sc>=0,limit=inside?short.w-radius:short.w+2.6+radius;
              if(dd>1e-5&&(inside?dd>limit:dd<limit)){
                const nx=dx/dd*(inside?-1:1),nz=dz/dd*(inside?-1:1);
                k.x=px+dx/dd*limit;k.z=pz+dz/dd*limit;
                const vx=Math.sin(my)*k.v+rx*k.vl,vz=Math.cos(my)*k.v+rz*k.vl,into=-(vx*nx+vz*nz);
                // Only remove incoming velocity. The old clamp dragged outside racers
                // into the hedge, then multiplied their speed down on every frame.
                if(into>0){const nvx=vx+nx*into*1.12,nvz=vz+nz*into*1.12;k.v=nvx*Math.sin(k.yaw)+nvz*Math.cos(k.yaw);k.vl=nvx*rx+nvz*rz;bump=into;}
              }
            }
          }
          if (Math.abs(lat2) > lim && !dropSide && sc < 0) {
            const rn = V3.set(L.R[i].x, 0, L.R[i].z).normalize(), over = Math.abs(lat2) - lim;
            k.x -= rn.x * over * side; k.z -= rn.z * over * side;
            const vx = Math.sin(my) * k.v + rx * k.vl, vz = Math.cos(my) * k.v + rz * k.vl, into = (vx * rn.x + vz * rn.z) * side;
            if (into > 0) { const nvx = vx - rn.x * side * into * 1.3, nvz = vz - rn.z * side * into * 1.3; k.v = nvx * Math.sin(k.yaw) + nvz * Math.cos(k.yaw); k.vl = nvx * rx + nvz * rz; bump = into; }
          }
          const along = L.along(i, k.x, k.z), lat3 = L.lat(i, k.x, k.z);
          g = sc >= 0 ? lerp(short.A.y, short.B.y, sc) : groundAt(i, lat3, along);
          if (!k.air && !FL.gap[i] && Math.abs(lat3) < FL.hw[i] - 1 && sc < 0) k.safe = i;
          // pads, boxes, the short cut secret
          if (!k.air) for (const p of pads) { let di = i - p.i; if (di > L.N / 2) di -= L.N; if (di < -L.N / 2) di += L.N; if (di >= -2 && di <= 2 && Math.abs(lat3 - p.lat) < 2.2 && k.boost < 0.5) { k.boost = 0.9; if (!k.ai) { K.sfx.noise(0.5, 0.12, 700, 0, 'bandpass', 2500); say('BOOST!', 0.6); } } }
          if (!k.ai && sc > 0.35 && sc < 0.65 && !shortDone) { shortDone = true; K.secret('rm.kart.short'); say('SHORT CUT!'); K.sfx.seq([[72, 0.25], [79, 0.25], [84, 0.5]], { bpm: 360, vol: 0.08 }); }
        }
        if (bump > 5) { k.v *= 0.85; if (!k.ai) { K.sfx.noise(0.15, 0.14, 500); shake = Math.max(shake, Math.min(0.3, bump * 0.02)); if (fxA) for (let s = 0; s < 6; s++) fxA.emit(k.x, k.y + 0.6, k.z, (Math.random() - 0.5) * 8, Math.random() * 5, (Math.random() - 0.5) * 8, 0.35, 0xffd040, 0.35, { g: 18 }); } }
        // up and down: follow the ground, fly off the top of ramps and crests, fall off the edge
        if (!k.air) {
          const pred = k.y + k.vy * dt - 25 * dt * dt;
          if (g < pred - 0.04) { k.air = true; k.y = pred; k.vy -= 25 * dt; }
          else { k.vy = clamp((g - k.y) / dt, -15, 15); k.y = g; }
        } else {
          k.vy -= 25 * dt; k.y += k.vy * dt;
          if (k.y <= g && g > -500) { if (k.vy < -9 && !k.ai) { K.sfx.tone(90, 0.12, 'square', 0.1); shake = Math.max(shake, 0.1); } if (fxN && k.vy < -6) for (let s = 0; s < 6; s++) fxN.emit(k.x, k.y + 0.2, k.z, (Math.random() - 0.5) * 6, 1 + Math.random() * 2, (Math.random() - 0.5) * 6, 0.6, TH && TH.verge === 'snow' ? 0xffffff : 0xc8b090, 0.7, { grow: 1.6, drag: 2 }); k.y = g; k.vy = 0; k.air = false; }
        }
        if (!battle && k.rescue <= 0 && k.y < L.P[i].y - 5) startRescue(k);
        if (!battle && !k.air && Math.abs(k.v) > 3) {
          // going the wrong way?
          const d = L.D[i]; if (Math.sin(k.yaw) * d.x + Math.cos(k.yaw) * d.z < -0.3 && k.v > 3) k.wrong += dt; else k.wrong = Math.max(0, k.wrong - dt * 2);
        }
        if (inp.useItem && !busy) useItem(k, inp.aim || 0);
        // sparks off the back wheels while drifting, flames when boosting, dust off-road
        if (fxA && k.mesh.visible && (!me || k === me || Math.hypot(k.x-me.x,k.z-me.z)<35)) {
          const bx = k.x - Math.sin(k.yaw) * 1.6, bz = k.z - Math.cos(k.yaw) * 1.6;
          if (k.drift && k.dl > 0 && !k.air && K.frame % 2 === 0) { const col = [0, 0x5ab8ff, 0xff9a1a][k.dl]; for (const s of [-1, 1]) fxA.emit(bx + rx * s * 1.1, k.y + 0.3, bz + rz * s * 1.1, rx * s * 2 + (Math.random() - 0.5) * 3, 1.5 + Math.random() * 2.5, rz * s * 2 + (Math.random() - 0.5) * 3, 0.25, col, 0.45, { g: 14 }); }
          if (k.boost > 0 && K.frame % 2 === 0) for (const s of [-1, 1]) fxA.emit(bx + rx * s * 0.34, k.y + 0.95, bz + rz * s * 0.34, -Math.sin(k.yaw) * 4, 0.5, -Math.cos(k.yaw) * 4, 0.22, Math.random() < 0.5 ? 0xff7a1a : 0xffe14a, 0.7, { grow: 0.2 });
          if (k.star > 0 && K.frame % 2 === 0) fxA.emit(k.x + (Math.random() - 0.5) * 2, k.y + 0.5 + Math.random() * 1.5, k.z + (Math.random() - 0.5) * 2, 0, 1, 0, 0.4, [0xffe14a, 0xff5a8a, 0x5affff][K.frame % 3], 0.5);
        }
        if (fxN && !onRoad && !k.air && Math.abs(k.v) > 8 && K.frame % 3 === 0 && TH && TH.verge) fxN.emit(k.x - Math.sin(k.yaw) * 1.5, k.y + 0.2, k.z - Math.cos(k.yaw) * 1.5, (Math.random() - 0.5) * 2, 1.5, (Math.random() - 0.5) * 2, 0.6, { grass: 0x5a8a3a, sand: 0xe0c890, snow: 0xffffff, deadgrass: 0x4a4a30, redsand: 0xd0905a, flag: 0x6a6a6a, jungle: 0x4a7a3a }[TH.verge] || 0xaaaaaa, 0.6, { grow: 1.4 });
      }
      // ---- falling off: the rescue drone fishes you out
      let drone = null;
      function startRescue(k) {
        k.rescues++; k.rescue = 2.0; k.drift = 0; k.dc = 0; k.dl = 0; k.boost = 0; k.vl = 0;
        if (!k.ai) { K.sfx.tone(600, 0.6, 'triangle', 0.08, 0, 150); say('WHOOPS!', 1.4); }
        if (fxN && (TH.sea || TR.trench || TH.lava || TR.th === 'spooky')) for (let s = 0; s < 14; s++) fxN.emit(k.x, Math.max(gY, k.y - 3), k.z, (Math.random() - 0.5) * 5, 3 + Math.random() * 4, (Math.random() - 0.5) * 5, 0.8, TH.lava ? 0xff7a1a : 0xd8f0ff, 0.6, { g: 14 });
      }
      function rescueStep(k, dt) {
        const was = k.rescue; k.rescue -= dt;
        if (was > 1.0 && k.rescue <= 1.0) { // put back on the road, just before where you fell (or just after a canyon)
          let to = k.safe; if (FL.gap[L.wrap(k.idx)] || FL.gap[L.wrap(k.safe + 4)]) { let j = k.idx; for (let n = 0; n < 40 && (FL.gap[j] || ramps.some(r => { let q = j - r.i0; if (q < 0) q += L.N; return q <= r.n; })); n++) j = L.wrap(j + 1); to = L.wrap(j + 2); }
          let d = to - k.idx; if (d < -L.N / 2) d += L.N; if (d > L.N / 2) d -= L.N; k.prog += d; k.idx = to;
          const p = L.at(to, 0, 0); k.x = p.x; k.z = p.z; k.y = p.y + 3.5; k.vy = 0; k.air = true; k.v = 0; k.vl = 0; k.yaw = Math.atan2(L.D[to].x, L.D[to].z); k.inv = 1.6; k.spin = 0; k.tumble = 0;
        }
        if (k.rescue <= 1.0 && k.rescue > 0) { k.y = Math.max(k.y, L.P[k.idx].y + 3.5 * (k.rescue / 1.0)); k.vy = 0; }
      }
      // ---- getting hit
      function spin(k, dur, by) {
        if (k.star > 0 || k.inv > 0 || k.rescue > 0 || k.out || k.spin > 0) return false;
        k.spin = dur; k.spinYaw = k.yaw; k.spinDir = Math.random() < 0.5 ? -1 : 1; k.v *= 0.35; k.boost = 0; k.drift = 0; k.dc = 0; k.dl = 0; k.inv = dur + 1.2;
        if (!k.ai) { K.sfx.noise(0.5, 0.2, 1200, 0, 'lowpass', 200); shake = Math.max(shake, 0.25); say('SPUN OUT!', 1); }
        if (by && by !== k && by === me) { me.hits++; K.sfx.seq([[76, 0.25], [72, 0.5]], { bpm: 400, vol: 0.08 }); say('GOT ' + k.n + '!', 1); }
        if (cfg.kind === 'battle') pop(k, by);
        return true;
      }
      function tumble(k, by) { if (spin(k, 1.4, by)) { k.air = true; k.vy = 7; k.tumble = 1.4; if (fxA) for (let s = 0; s < 14; s++) fxA.emit(k.x, k.y + 1, k.z, (Math.random() - 0.5) * 10, Math.random() * 8, (Math.random() - 0.5) * 10, 0.5, s % 2 ? 0xffe14a : 0xff5a1a, 0.8, { g: 10 }); } }
      // ---- items
      const IG = {};
      function itemGeo(kind) {
        if (IG[kind]) return IG[kind];
        const P = [], a = (geo, x, y, z, c, sx, sy, sz, rx, rz) => P.push({ geo, m: RK.M(T, x, y, z, 0, sx, sy, sz, rx, rz), c });
        if (kind === 'peel') { a(new T.SphereGeometry(0.3, 8, 6), 0.06, 0.48, 0, 0xf8d81a, 0.85, 1.6, 0.85, 0, -0.25); a(new T.SphereGeometry(0.3, 8, 6), 0, 0.2, 0, 0xf0d040, 1, 0.6, 1); a(new T.CylinderGeometry(0.06, 0.09, 0.28, 6), 0.2, 0.95, 0, 0x5a3a0a, 1, 1, 1, 0, -0.45); for (let k = 0; k < 3; k++) { const ang = k * TAU / 3, cx = Math.sin(ang), cz = Math.cos(ang); a(new T.ConeGeometry(0.26, 1.0, 6), cx * 0.42, 0.28, cz * 0.42, 0xf8d81a, 1, 1, 0.45, cz * 2.2, -cx * 2.2); a(new T.SphereGeometry(0.09, 5, 4), cx * 0.78, 0.06, cz * 0.78, 0x6a4a1a); } }
        else if (kind === 'boomer' || kind === 'homer') { a(new T.SphereGeometry(0.62, 12, 8), 0, 0, 0, kind === 'boomer' ? 0x2ac83a : 0xe8261c); a(new T.TorusGeometry(0.6, 0.12, 5, 14), 0, -0.12, 0, 0xffffff, 1, 1, 1, Math.PI / 2); for (let k = 0; k < 4; k++) a(new T.ConeGeometry(0.14, 0.3, 4), Math.sin(k * 1.57) * 0.45, 0.35, Math.cos(k * 1.57) * 0.45, 0xffffff); }
        else if (kind === 'bomb') { a(new T.SphereGeometry(0.8, 12, 8), 0, 0, 0, 0x2a5aff); for (const s of [-1, 1]) a(new T.BoxGeometry(1.2, 0.1, 0.6), s * 1.0, 0.2, 0, 0xffffff, 1, 1, 1, 0, s * 0.3); for (let k = 0; k < 5; k++) a(new T.ConeGeometry(0.15, 0.45, 4), Math.sin(k * 1.26) * 0.55, 0.55, Math.cos(k * 1.26) * 0.55, 0xffffff); }
        const g = RK.merge(T, P); P.forEach(p => p.geo.dispose()); return IG[kind] = g;
      }
      let fakeMat = null;
      function itemMesh(kind) {
        let m;
        if (kind === 'fake') { fakeMat = fakeMat || T3.mat({ map: T3.tex(64, 64, (g, w, h) => { g.drawImage(boxTex.image, 0, 0); g.fillStyle = 'rgba(255,40,60,.35)'; g.fillRect(0, 0, w, h); g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI); g.fillStyle = '#fff'; g.font = 'bold 30px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 2); g.restore(); }), lit: false, transparent: true, opacity: 0.85 }); m = new T.Mesh(boxGeo, fakeMat); }
        else m = new T.Mesh(itemGeo(kind === 'tpeel' ? 'peel' : kind), matV);
        kartsG.add(m); return m;
      }
      function pickItem(k) {
        let odds;
        if (cfg.kind === 'battle') odds = BATTLE_ODDS;
        else { const p = k.place; odds = ODDS[p === 0 ? 0 : p <= 2 ? 1 : p <= 4 ? 2 : p <= 6 ? 3 : 4]; }
        odds = odds.map((weight, n) => (ITEMS[n] === 'THUNDER' || ITEMS[n] === 'BOMB') && powerRest > 0 ? 0 : weight);
        let tot = 0; for (const o of odds) tot += o; let r = Math.random() * tot;
        for (let n = 0; n < odds.length; n++) { r -= odds[n]; if (r < 0) return ITEMS[n]; }
        return 'PEEL';
      }
      function useItem(k, aim) {
        if (!k.item || k.roll > 0) return;
        const it = k.item, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), me_ = !k.ai;
        if (it === 'TRIPLE') { k.icount = (k.icount || 3) - 1; if (k.icount <= 0) { k.item = ''; k.icount = 0; } } else k.item = '';
        if (it === 'TURBO' || it === 'TRIPLE') { k.boost = Math.max(k.boost, 1.1); if (me_) { K.sfx.noise(0.6, 0.15, 900, 0, 'bandpass', 3000); say('TURBO!', 0.7); } return; }
        if (it === 'STAR') { k.star = 7; if (me_) { K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [79, 0.25], [84, 0.5]], { bpm: 480, vol: 0.09 }); say('SUPERSTAR!', 1); } return; }
        if (it === 'THUNDER') { powerRest = 12; flash = 0.5; K.sfx.noise(0.9, 0.22, 3000, 0, 'highpass', 200); for (const o of karts) if (o !== k && o.star <= 0 && !o.out) { o.small = 5.5; o.item = ''; o.roll = 0; o.drift = 0; o.v *= 0.6; } if (me_) say('THUNDERCLAP!', 1); else if (me.small > 0) say('ZAPPED BY ' + k.n + '!', 1.2); return; }
        if (it === 'SPLAT') { for (const o of karts) if (o !== k && o.place < k.place) o.ink = 3.2; K.sfx.noise(0.4, 0.15, 400, 0, 'lowpass', 120); if (me_) say('SPLAT!', 0.8); else if (me.ink > 0) say('INKED BY ' + k.n + '!', 1.2); return; }
        const o = { k: it === 'PEEL' ? (aim > 0 ? 'tpeel' : 'peel') : it === 'FAKE' ? 'fake' : it === 'BOOMER' ? 'boomer' : it === 'HOMER' ? 'homer' : 'bomb', owner: k, t: 0, life: 30, bounces: 0, i: k.idx, vy: 0 };
        o.m = itemMesh(o.k);
        if (o.k === 'peel' || o.k === 'fake') { o.x = k.x - fx * 2.6; o.z = k.z - fz * 2.6; o.y = k.y; o.life = 45; if (me_) K.sfx.tone(300, 0.15, 'triangle', 0.1, 0, 150); }
        else if (o.k === 'tpeel') { o.x = k.x + fx * 2; o.z = k.z + fz * 2; o.y = k.y + 1; o.vx = fx * (Math.max(0, k.v) + 10); o.vz = fz * (Math.max(0, k.v) + 10); o.vy = 7; }
        else if (o.k === 'boomer') { const back = aim < 0 ? -1 : 1, sp = back > 0 ? Math.max(0, k.v) + 22 : 22; o.x = k.x + fx * 2.8 * back; o.z = k.z + fz * 2.8 * back; o.y = k.y + 0.6; o.vx = fx * sp * back; o.vz = fz * sp * back; o.life = 7; if (me_) K.sfx.tone(600, 0.2, 'square', 0.08, 0, 200); }
        else if (o.k === 'homer') { o.x = k.x + fx * 2.8; o.z = k.z + fz * 2.8; o.y = k.y + 0.6; o.fi = k.idx + 1.5; o.lat = k.lat; o.life = 9; o.tgt = target(k); o.vx = fx * 30; o.vz = fz * 30; if (me_) K.sfx.tone(700, 0.25, 'square', 0.08, 0, 300); }
        else { powerRest = 12; o.fi = k.idx; o.x = k.x; o.z = k.z; o.y = k.y + 6; o.life = 25; o.tgt = rank()[0] !== k ? rank()[0] : null; if (!o.tgt) { kartsG.remove(o.m); return; } if (me_) say('SKY BOMB!', 1); else if (o.tgt === me) say('LOOK OUT! SKY BOMB!', 1.5); K.sfx.tone(300, 1.2, 'sawtooth', 0.05, 0, 900); }
        items.push(o);
      }
      function target(k) { // the kart just in front (or the nearest one, in Battle)
        if (cfg.kind === 'battle') { let b = null, bd = 1e9; for (const o of karts) if (o !== k && !o.out) { const d = Math.hypot(o.x - k.x, o.z - k.z); if (d < bd) { bd = d; b = o; } } return b; }
        const r = rank(), p = r.indexOf(k); return p > 0 ? r[p - 1] : null;
      }
      function boom(x, y, z, r, by) { if (fxA) for (let s = 0; s < 30; s++) fxA.emit(x, y + 1, z, (Math.random() - 0.5) * 16, Math.random() * 12, (Math.random() - 0.5) * 16, 0.7, [0xffffff, 0x8ad8ff, 0x2a5aff][s % 3], 1.2, { g: 6, grow: 0.3 }); K.sfx.noise(0.8, 0.25, 600, 0, 'lowpass', 80); shake = Math.max(shake, Math.max(0, 0.5 - Math.hypot(me.x - x, me.z - z) / 60)); for (const k of karts) if (Math.hypot(k.x - x, k.z - z) < r) tumble(k, by); }
      function itemsStep(dt) {
        const battle = cfg.kind === 'battle';
        for (const o of items) {
          o.t += dt; o.life -= dt;
          if (o.k === 'tpeel') { o.x += o.vx * dt; o.z += o.vz * dt; o.vy -= 25 * dt; o.y += o.vy * dt; const gg = battle ? 0 : groundAt(o.i = L.nearest(o.x, o.z, o.i, 12), L.lat(o.i, o.x, o.z), 0); if (battle) arenaClamp(o, 0.5); if (o.y <= gg && gg > -500) { o.y = gg; o.k = 'peel'; } else if (gg < -500 && o.y < -50) o.life = 0; }
          else if (o.k === 'boomer' || (o.k === 'homer' && (battle || (o.tgt && Math.hypot(o.tgt.x - o.x, o.tgt.z - o.z) < 16)))) {
            if (o.k === 'homer' && o.tgt) { const dx = o.tgt.x - o.x, dz = o.tgt.z - o.z, d = Math.hypot(dx, dz) || 1, sp = 32; o.vx += (dx / d * sp - o.vx) * Math.min(1, dt * 4); o.vz += (dz / d * sp - o.vz) * Math.min(1, dt * 4); }
            o.x += o.vx * dt; o.z += o.vz * dt;
            if (battle) { const n = arenaClamp(o, 0.6); if (n) { const d = o.vx * n.x + o.vz * n.z; if (d < 0) { o.vx -= 2 * d * n.x; o.vz -= 2 * d * n.z; o.bounces++; } } o.y = 0.65; }
            else {
              o.i = L.nearest(o.x, o.z, o.i, 12); const lat = L.lat(o.i, o.x, o.z), side = lat < 0 ? -1 : 1, lim = FL.lim[o.i] - 0.5;
              const gg = groundAt(o.i, lat, L.along(o.i, o.x, o.z));
              if (gg < -500) { o.y -= 12 * dt; if (o.y < L.P[o.i].y - 8) o.life = 0; }
              else { if (Math.abs(lat) > lim) { const rn = V3.set(L.R[o.i].x, 0, L.R[o.i].z).normalize(), d = (o.vx * rn.x + o.vz * rn.z) * side; if (d > 0) { o.vx -= 2 * d * rn.x * side; o.vz -= 2 * d * rn.z * side; o.bounces++; if (Math.hypot(me.x - o.x, me.z - o.z) < 40) K.sfx.tone(400, 0.05, 'square', 0.04); } } o.y = gg + 0.65; }
              if (o.k === 'homer') o.fi = o.i;
            }
            if (o.bounces > 7) o.life = 0;
          } else if (o.k === 'homer') {
            const t = o.tgt; o.fi = (o.fi + 34 * dt / L.step) % L.N; const tl = t ? clamp(t.lat, -FL.hw[L.wrap(Math.round(o.fi))] + 1, FL.hw[L.wrap(Math.round(o.fi))] - 1) : 0; o.lat += (tl - o.lat) * Math.min(1, dt * 2.5);
            const p = L.atf(o.fi, o.lat, 0.65, V2); o.vx = (p.x - o.x) / Math.max(dt, 1e-3); o.vz = (p.z - o.z) / Math.max(dt, 1e-3); o.x = p.x; o.y = p.y; o.z = p.z; o.i = L.wrap(Math.round(o.fi));
          } else if (o.k === 'bomb') {
            const t = o.tgt; if (!t || t.done) { o.life = 0; } else {
              let di = t.idx - o.fi; if (di < -L.N / 2) di += L.N; if (di > L.N / 2) di -= L.N;
              if (di > 4) { o.fi = (o.fi + 46 * dt / L.step) % L.N; const p = L.atf(o.fi, 0, 6 + Math.sin(o.t * 5), V2); o.x = p.x; o.y = p.y; o.z = p.z; }
              else { o.x += (t.x - o.x) * Math.min(1, dt * 6); o.z += (t.z - o.z) * Math.min(1, dt * 6); o.y += (t.y + 0.5 - o.y) * Math.min(1, dt * 4); if (o.y < t.y + 1.4) { boom(o.x, o.y, o.z, 8, o.owner); o.life = 0; } }
            }
          }
          if (o.life <= 0) continue;
          // hitting karts
          for (const k of karts) {
            if (k.out || (k === o.owner && o.t < 0.7) || k.rescue > 0) continue;
            if (o.k === 'bomb') continue;
            const dx = k.x - o.x, dz = k.z - o.z, rr = (k.small > 0 ? 1.0 : 1.6) + (o.k === 'fake' ? 0.4 : 0.1);
            if (dx * dx + dz * dz < rr * rr && Math.abs(k.y + 0.5 - o.y) < 2) {
              if (k.star > 0 || k.inv > 0) { if (o.k !== 'peel' || k.star > 0) o.life = 0; continue; }
              if (o.k === 'peel' || o.k === 'tpeel') spin(k, 1.0, o.owner); else tumble(k, o.owner);
              o.life = 0; break;
            }
          }
          // shells knock out peels and fake boxes
          if (o.life > 0 && (o.k === 'boomer' || o.k === 'homer')) for (const p of items) if (p !== o && p.life > 0 && (p.k === 'peel' || p.k === 'fake' || p.k === 'boomer' || p.k === 'homer') && (p.x - o.x) ** 2 + (p.z - o.z) ** 2 < 2 && o.t > 0.2) { p.life = 0; o.life = 0; if (fxA) for (let s = 0; s < 8; s++) fxA.emit(o.x, o.y, o.z, (Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8, 0.4, 0xffffff, 0.5, { g: 12 }); }
        }
        for (const o of items) {
          if (o.life <= 0) { kartsG.remove(o.m); continue; }
          o.m.position.set(o.x, o.y + (o.k === 'fake' ? 1.0 + Math.sin(o.t * 3) * 0.1 : 0), o.z);
          if (o.k === 'fake') { o.m.rotation.y += dt * 2; o.m.rotation.x = 0.4; } else if (o.k !== 'peel') o.m.rotation.y += dt * 8;
        }
        items = items.filter(o => o.life > 0);
      }
      function clearItems() { for (const o of items) kartsG.remove(o.m); items = []; }

      // ---------------------------------------------------------------- the computer drivers
      function aiInput(k, dt) {
        const inp = { steer: 0, gas: 1, brake: 0, hop: false, driftHeld: false, useItem: false, aim: 0 };
        if (k.done && cfg.kind !== 'battle') { inp.gas = 0.4 > Math.random() ? 1 : 0; }
        if (cfg.kind === 'battle') return aiBattle(k, dt, inp);
        const i = k.idx, N = L.N, hw = FL.hw[i];
        const look = Math.round(5 + Math.max(0, k.v) * 0.32), j = L.wrap(i + look);
        let want = FL.line[j] + k.lane * (FL.dropL[j] || FL.dropR[j] ? 0.3 : 1) + Math.sin(K.t * 0.4 + k.wob) * 0.6;
        for (const o of karts) if (o !== k) { let a = o.idx - i; if (a < -N / 2) a += N; if (a > N / 2) a -= N; if (a > 0 && a < 7) { const dl = o.lat - want; if (Math.abs(dl) < 3.0) want += (dl > 0 ? -1 : 1) * 3.3; } }
        for (const o of items) if (o.k === 'peel' || o.k === 'fake') { const oi = L.nearest(o.x, o.z, j, 20); let a = oi - i; if (a < -N / 2) a += N; if (a > 0 && a < 12) { const ol = L.lat(oi, o.x, o.z); if (Math.abs(ol - want) < 2.2) want += (ol > want ? -1 : 1) * 2.6; } }
        for (const h of haz) if (h.up && (h.k === 'snowman' || h.k === 'krumbler' || h.k === 'mole')) { let a = h.i - i; if (a < -N / 2) a += N; if (a > 0 && a < 12 && Math.abs(h.lat - want) < 2.6) want += (h.lat > want ? -1 : 1) * 3; }
        // Each racer picks its own available box instead of tracing one identical centre line.
        if (!k.item && k.roll <= 0 && cfg.kind !== 'tt') {
          let best = null, cost = Infinity;
          for (const b of boxes) {
            const ahead = (b.i - i + N) % N;
            if (b.gone > 0 || ahead < 2 || ahead > 18) continue;
            const score = ahead + Math.abs(b.lat - k.lat) * 1.4 + Math.abs(b.lat - k.lane) * .2;
            if (score < cost) { cost = score; best = b; }
          }
          if (best) want = lerp(want, best.lat, .8);
        }
        want = clamp(want, -hw + 1.4, hw - 1.4);
        if(short){
          const clearance=lat=>{const p=L.at(j,lat,0,V3),dx=short.B.x-short.A.x,dz=short.B.z-short.A.z,t=((p.x-short.A.x)*dx+(p.z-short.A.z)*dz)/(dx*dx+dz*dz);return t>.12&&t<.88?Math.hypot(p.x-short.A.x-dx*t,p.z-short.A.z-dz*t):Infinity;};
          if(clearance(want)<short.w+4.5){const left=-hw+1.6,right=hw-1.6;want=clearance(left)>clearance(right)?left:right;}
        }
        const tp = L.at(j, want, 0, V2), df = wrapA(Math.atan2(tp.x - k.x, tp.z - k.z) - k.yaw);
        inp.steer = clamp(-df * 2.4, -1, 1);
        if (k.ink > 0) inp.steer = clamp(inp.steer + Math.sin(K.t * 3 + k.wob) * 0.5, -1, 1);
        let cmax = 0; for (let s = 3; s < 22 + k.v * 0.5; s += 2) cmax = Math.max(cmax, Math.abs(L.C[L.wrap(i + s)]));
        const corner = 1.85 / Math.max(cmax, 0.002) * (FL.ice[j] ? 0.8 : 1);
        let tgt = Math.min(k.top * k.aiMul * (k.small > 0 ? 0.72 : 1), corner);
        inp.gas = k.v < tgt ? 1 : 0; inp.brake = k.v > tgt + 3 ? 1 : 0;
        // stuck against something? back up
        const advance=k.prog+L.along(i,k.x,k.z)/L.step,notAdvancing=k.aiProg!=null&&Math.abs(advance-k.aiProg)<.01;k.aiProg=advance;
        if (mode === 'race' && (Math.abs(k.v) < 2 || notAdvancing) && k.spin <= 0 && k.rescue <= 0) k.stuck += dt; else k.stuck = Math.max(0, k.stuck - dt*2);
        if (k.stuck > 1.2) { inp.gas = 0; inp.brake = 1; inp.steer = -inp.steer; if (k.stuck > 3.5) { k.stuck = 0; startRescue(k); } }
        k.driftRest = Math.max(0,k.driftRest-dt);
        const bend = Math.abs(L.C[j]);
        if (k.drift) {
          k.aiDrift += dt;
          inp.driftHeld = k.aiDrift < 1.0 && k.dl < 2 && Math.abs(df)<.7 && Math.abs(k.lat)<hw-1.6;
          if (!inp.driftHeld) { k.driftRest = 2.4; k.aiDrift = 0; }
        } else if (!k.air && k.v > 13 && k.driftRest === 0 && !FL.ice[j] && !FL.tun[j] &&
                   !FL.dropL[j] && !FL.dropR[j] && bend>.012 && bend<.05 && Math.abs(df)>.15 && Math.abs(df)<.48 && Math.abs(k.lat)<hw-2.5) {
          inp.hop = true; inp.driftHeld = true; k.aiDrift = 0;
        }
        aiItems(k, dt, inp);
        return inp;
      }
      function aiItems(k, dt, inp) {
        if (!k.item || k.roll > 0) return; k.cool -= dt; if (k.cool > 0) return; k.cool = 0.4 + Math.random() * 0.6;
        const N = L.N, ahead = o => { let a = o.prog - k.prog; return a; };
        const it = k.item; k.hold += 1;
        if (it === 'PEEL' || it === 'FAKE') { if (karts.some(o => o !== k && ahead(o) < 0 && ahead(o) > -7) || k.hold > 10) inp.useItem = true; }
        else if (it === 'BOOMER') { if (karts.some(o => o !== k && ahead(o) > 1 && ahead(o) < 14 && Math.abs(o.lat - k.lat) < 2.2)) inp.useItem = true; else if (karts.some(o => o !== k && ahead(o) < 0 && ahead(o) > -6)) { inp.useItem = true; inp.aim = -1; } else if (k.hold > 14) inp.useItem = true; }
        else if (it === 'HOMER') { if (karts.some(o => o !== k && ahead(o) > 1 && ahead(o) < 30) || k.hold > 12) inp.useItem = true; }
        else if (it === 'TURBO' || it === 'TRIPLE') { let c = 0; for (let s = 2; s < 24; s += 2) c = Math.max(c, Math.abs(L.C[L.wrap(k.idx + s)])); if (c < 0.03 || k.hold > 10) inp.useItem = true; }
        else if (k.hold > 2 + (k.wob % 3)) inp.useItem = true;
        if (inp.useItem) k.hold = 0;
      }
      function aiBattle(k, dt, inp) {
        let tx = 0, tz = 0;
        const foe = target(k);
        if (!k.item || k.roll > 0) { let bd = 1e9; boxes.forEach(b => { if (b.gone > 0) return; const d = Math.hypot(b.x - k.x, b.z - k.z); if (d < bd) { bd = d; tx = b.x; tz = b.z; } }); if (bd > 1e8 && foe) { tx = foe.x; tz = foe.z; } }
        else if (foe) { tx = foe.x + Math.sin(foe.yaw) * 4; tz = foe.z + Math.cos(foe.yaw) * 4; }
        // swing round obstacles in the way
        const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
        let avoid = 0; for (const ob of AR.obs) { const dx = ob[0] - k.x, dz = ob[1] - k.z, along = dx * fx + dz * fz, side = dx * -Math.cos(k.yaw) + dz * Math.sin(k.yaw); if (along > 0 && along < 12 && Math.abs(side) < ob[2] + 2.2) avoid += side > 0 ? -1 : 1; }
        const df = wrapA(Math.atan2(tx - k.x, tz - k.z) - k.yaw);
        inp.steer = clamp(-df * 2.2 + avoid * 0.9, -1, 1);
        inp.gas = 1; inp.brake = 0;
        if (Math.abs(df) > 2.2 && Math.hypot(tx - k.x, tz - k.z) < 10) { inp.gas = 0; inp.brake = 1; inp.steer = -inp.steer; }
        if (Math.abs(k.v) < 2 && k.spin <= 0) k.stuck += dt; else k.stuck = Math.max(0, k.stuck - dt);
        if (k.stuck > 1) { inp.gas = 0; inp.brake = 1; inp.steer = 1; if (k.stuck > 2.4) k.stuck = 0; }
        if (k.item && k.roll <= 0 && foe) {
          k.cool -= dt; const d = Math.hypot(foe.x - k.x, foe.z - k.z), ang = Math.abs(wrapA(Math.atan2(foe.x - k.x, foe.z - k.z) - k.yaw));
          if (k.cool <= 0) { k.cool = 0.5 + Math.random() * 0.8; const it = k.item;
            if ((it === 'BOOMER' && ang < 0.2 && d < 30) || (it === 'HOMER' && d < 45) || it === 'STAR' || it === 'TURBO' || ((it === 'PEEL' || it === 'FAKE') && ang > 2.4 && d < 12) || Math.random() < 0.08) inp.useItem = true;
            if ((it === 'PEEL' || it === 'FAKE' || it === 'BOOMER') && ang > 2.6 && d < 14) inp.aim = it === 'BOOMER' ? -1 : 0; }
        }
        return inp;
      }
      // ---- balloons (Battle)
      let balIM = null, balStrings = null;
      const balloonUp = new T.Vector3(0,1,0);
      function pop(k, by) {
        if (k.balloons <= 0) return; k.balloons--;
        if (by && by !== k) by.pops = (by.pops || 0) + 1;
        if (fxN) for (let s = 0; s < 12; s++) fxN.emit(k.x, k.y + 3, k.z, (Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6, 0.6, k.D.col, 0.4, { g: 8 });
        K.sfx.noise(0.15, 0.2, 2500, 0, 'highpass');
        if (k.balloons <= 0) { k.out = true; k.outT = bT; if (k === me) say('OUT!', 2); else say(k.n + ' IS OUT!', 1.4); }
        else if (k === me) say(k.balloons + ' BALLOON' + (k.balloons > 1 ? 'S' : '') + ' LEFT', 1.2);
      }

      // ---------------------------------------------------------------- game state
      let powerRest = 0, pauseTime = 0, pauseFrame = 0;
      let shake = 0, flash = 0, msg = '', msgT = 0, paused = false, psel = 0, shortDone = false, idle = 0, bT = 0, count = 0, raceT = 0, finT = 0, reported = false;
      let gp = null, results = null, camYaw = 0, camY = 3, fov = 64, demoT = 0, demoCam = 0, introT = 0, lastLapMsg = 0, finalLap = false, trackPrev = -1, prevT = 0, hiPage = 0;
      const sel = { main: 0, cc: 1, drv: sv.drv, cup: 0, trk: sv.track, arena: 0, opt: 0, how: 0, rec: 0 };
      function say(s, t) { msg = s; msgT = t || 1.4; }
      // One owner-approved recording trial: races only, never menus or other games.
      const raceSong = () => !sv.opt.mus ? null : cfg.kind === 'battle' ? song(8) : ({
        audio: 'audio/kart-trial/race.mp3?v=2.36.1', vol: .5, rate: finalLap ? 1.12 : 1,
        fallback: finalLap ? fast(song(TH.song)) : song(TH.song),
      });
      const song = n => sv.opt.mus ? SONGS[n] : null;
      const music = s => K.music(s || null);
      const scoreCap = s => Math.max(0, Math.min(Math.floor(s), 30000, Math.floor(120 * (K.t + 4))));

      // ---- the garage (choosing a driver) and the podium: little sets far below the world
      let garage = null, podium = null, trophy = null;
      function buildGarage() {
        if (garage) return; garage = new T.Group(); garage.position.set(0, -300, 0); T3.scene.add(garage);
        const P = [], G = [];
        P.push({ geo: new T.CylinderGeometry(5, 5.4, 0.6, 24), m: RK.M(T, 0, -0.3, 0), c: 0x9a9aa8 }); P.push({ geo: new T.CylinderGeometry(5.6, 5.6, 0.2, 24), m: RK.M(T, 0, -0.62, 0), c: 0x3a3a48 });
        for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; P.push({ geo: new T.BoxGeometry(5, 9, 0.6), m: RK.M(T, Math.sin(a) * 16, 4, Math.cos(a) * 16, a), c: k % 2 ? 0x2a3a8a : 0x24307a }); G.push({ geo: new T.SphereGeometry(0.25, 6, 4), m: RK.M(T, Math.sin(a) * 15.5, 8, Math.cos(a) * 15.5), c: [0xffe14a, 0xff5a5a, 0x5affff][k % 3] }); }
        P.push({ geo: new T.CylinderGeometry(17, 17, 0.2, 24), m: RK.M(T, 0, -0.7, 0), c: 0x5a5a6a });
        garage.add(new T.Mesh(RK.merge(T, P), matP)); garage.add(new T.Mesh(RK.merge(T, G), matG)); P.concat(G).forEach(p => p.geo.dispose());
      }
      function buildPodium() {
        if (podium) return; podium = new T.Group(); podium.position.set(300, -300, 0); T3.scene.add(podium);
        const P = [], blk = (x, h, c) => P.push({ geo: new T.BoxGeometry(4.4, h, 4), m: RK.M(T, x, h / 2, 0), c });
        blk(0, 3, 0xe8c21a); blk(-4.6, 2, 0xc8c8d0); blk(4.6, 1.2, 0xc8783a);
        P.push({ geo: new T.CylinderGeometry(22, 22, 0.3, 28), m: RK.M(T, 0, -0.15, 0), c: 0x3a8a3a }); P.push({ geo: new T.BoxGeometry(5, 0.05, 30), m: RK.M(T, 0, 0.02, 10), c: 0xc81a2a });
        for (let k = 0; k < 40; k++) { const a = Math.PI * 0.85 + k / 40 * Math.PI * 1.3, r = 18; P.push({ geo: new T.BoxGeometry(0.7, 0.9, 0.7), m: RK.M(T, Math.sin(a) * r, 0.45, Math.cos(a) * r), c: [0xff4a4a, 0x4a8aff, 0xffe14a, 0xffffff, 0x3ad04a][k % 5] }); P.push({ geo: new T.SphereGeometry(0.32, 6, 5), m: RK.M(T, Math.sin(a) * r, 1.15, Math.cos(a) * r), c: 0xf0c090 }); }
        for (const [x, h, t] of [[0, 3, '1'], [-4.6, 2, '2'], [4.6, 1.2, '3']]) { const m = new T.Mesh(T3.keep(new T.PlaneGeometry(1.6, 1.0)), T3.mat({ map: T3.tex(32, 20, (g, w, hh) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, hh); g.fillStyle = '#1a1a3a'; g.font = 'bold 18px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, w / 2, hh / 2 + 1); }) })); m.position.set(x, h / 2, 2.02); podium.add(m); }
        podium.add(new T.Mesh(RK.merge(T, P), matP)); P.forEach(p => p.geo.dispose());
        const prof = [[0, 0], [0.7, 0], [0.7, 0.15], [0.25, 0.3], [0.2, 0.9], [0.9, 1.2], [1.0, 2.2], [0.85, 2.25], [0.7, 1.4], [0, 1.3]].map(([x, y]) => new T.Vector2(x, y));
        trophy = new T.Mesh(T3.keep(new T.LatheGeometry(prof, 16)), T3.mat({ color: 0xffd040, emissive: 0x3a2a00 })); podium.add(trophy);
        for (const s of [-1, 1]) { const h = new T.Mesh(T3.keep(new T.TorusGeometry(0.4, 0.09, 5, 10)), trophy.material); h.position.set(s * 1.05, 1.7, 0); h.rotation.y = Math.PI / 2; trophy.add(h); }
      }
      function showOnly(list) { for (const m of kartMesh) if (m) m.visible = false; if (ghostMesh) ghostMesh.visible = false; for (const k of list) k.mesh.visible = true; }

      // ---------------------------------------------------------------- starting things
      function goTitle() {
        mode = 'title'; mt = 0; idle = 0; paused = false; gp = null; results = null; clearItems(); cfg.kind = 'title';
        if (trackPrev !== 0 || !L) { buildTrack(0, false); trackPrev = 0; }
        karts = DRIVERS.map((d, n) => mkKart(n, true)); gridUp(karts); doRank(); showOnly(karts);
        music(song(9));
      }
      function startDemo() {
        mode = 'demo'; mt = 0; demoT = 0; cfg.kind = 'demo'; cfg.cc = 1; clearItems();
        const open = TRACKS.map((t, i) => i).filter(trackOpen), ti = open[(Math.random() * open.length) | 0];
        buildTrack(ti, false); trackPrev = ti;
        karts = DRIVERS.map((d, n) => { const k = mkKart(n, true, 0.97 + Math.random() * 0.05); return k; }); karts.sort(() => Math.random() - 0.5); gridUp(karts); me = karts[0]; doRank(); showOnly(karts);
        count = 0; raceT = 0; music(song(TH.song));
      }
      function setupRace() { // cfg.kind 'gp' | 'vs' | 'tt'; cfg.track
        clearItems(); paused = false; powerRest = 0; results = null; reported = false; shortDone = false; finalLap = false; lastLapMsg = 0;
        const ti = cfg.track; buildTrack(ti, CLASSES[cfg.cc].mirror); trackPrev = ti;
        const cls = CLASSES[cfg.cc];
        if (cfg.kind === 'tt') { me = mkKart(sel.drv, false); karts = [me]; me.item = 'TRIPLE'; me.icount = 3; }
        else {
          const order = gp && gp.order ? gp.order.slice() : [...DRIVERS.keys()].filter(d => d !== sel.drv).sort(() => Math.random() - 0.5).concat([sel.drv]);
          karts = order.map(d => d === sel.drv ? mkKart(d, false) : mkKart(d, true, cls.ai * (gp && gp.rivals.includes(d) ? 1.02 : 0.97 + Math.random() * 0.02)));
          me = karts.find(k => !k.ai);
          if (gp) karts.forEach(k => { k.pts = gp.pts[k.d] || 0; });
        }
        gridUp(karts); doRank(); showOnly(karts);
        ghost = null; ghRec = null;
        if (cfg.kind === 'tt') {
          ghRec = RK.ghost.rec(); const s = ghLoad(ti), bar = s.indexOf('|');
          if (sv.opt.ghost && bar > 0) { const gd = clamp(+s.slice(0, bar) | 0, 0, 7); ghost = RK.ghost.play(s.slice(bar + 1)); if (ghost.n > 20) { if (ghostMesh) kartsG.remove(ghostMesh); ghostMesh = new T.Mesh(kartGeo[gd], matGhost); kartsG.add(ghostMesh); } else ghost = null; }
        }
        mode = 'intro'; introT = 0; camYaw = me.yaw; camY = me.y + 3; music(null);
      }
      function startCount() { mode = 'count'; count = 3.8; raceT = 0; me.early = null; K.sfx.tone(440, 0.05); karts.forEach(k => { if (k.ai) k.rocket = Math.random() < 0.45; }); }
      function newGP() {
        const rivals = [...DRIVERS.keys()].filter(d => d !== sel.drv).sort(() => Math.random() - 0.5).slice(0, 2);
        gp = { cc: cfg.cc, cup: cfg.cup, race: 0, pts: {}, order: null, rivals, scores: [], hits: 0 };
        DRIVERS.forEach((d, n) => { gp.pts[n] = 0; });
        cfg.track = CUPS[cfg.cup].t[0]; cfg.kind = 'gp'; setupRace();
      }
      function startBattle() {
        cfg.kind = 'battle'; gp = null; paused = false; powerRest = 0; finalLap = false; clearItems(); ghost = null; ghRec = null; reported = false; results = null;
        clearWorld(); MIR = false; AR = ARENAS[cfg.arena]; L = null; trackPrev = -1; buildArena(AR);
        const others = [...DRIVERS.keys()].filter(d => d !== sel.drv).sort(() => Math.random() - 0.5).slice(0, 3);
        karts = [sel.drv, ...others].map((d, n) => mkKart(d, n > 0, 1));
        me = karts[0];
        karts.forEach((k, n) => { const a = n / 4 * TAU + Math.PI / 4, r = AR.r * 0.7; k.x = Math.sin(a) * r; k.z = Math.cos(a) * r; k.yaw = a + Math.PI; k.y = 0; k.balloons = 3; k.out = false; k.pops = 0; });
        showOnly(karts); rankC = karts.slice(); bT = 0;
        mode = 'count'; count = 3.8; raceT = 0; camYaw = me.yaw; camY = 3; music(null);
      }
      function buildArena(ar) {
        world = new T.Group(); T3.scene.add(world); const th = THEMES[ar.th]; TH = th; TR = { th: ar.th, n: ar.n, haz: [] }; setTheme(th); gY = 0;
        const P = [], add = (geo, x, y, z, ry, c, sx, sy, sz) => P.push({ geo, m: RK.M(T, x, y, z, ry || 0, sx, sy, sz), c });
        const fl = ar.shape === 'round' ? new T.CircleGeometry(ar.r + 0.5, 40) : new T.PlaneGeometry(ar.r * 2 + 1, ar.r * 2 + 1); fl.rotateX(-Math.PI / 2);
        const uv = fl.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * (ar.shape === 'round' ? 1 : 6), uv.getY(k) * (ar.shape === 'round' ? 1 : 6));
        T3.keep(fl); world.add(new T.Mesh(fl, T3.mat({ map: ar.shape === 'round' ? T3.tex(128, 128, PAINT.tinfloor) : tex('rug'), color: ar.shape === 'round' ? 0xa4adb8 : 0xffffff })));
        const gr = T3.keep(new T.PlaneGeometry(1500, 1500)); gr.rotateX(-Math.PI / 2); gr.translate(0, -0.3, 0); world.add(new T.Mesh(gr, T3.mat({ map: T3.tile(T3.tex(64, 64, PAINT.grass), 120, 120) })));
        if (ar.shape === 'round') { for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; add(new T.BoxGeometry(7.2, 4, 1), Math.sin(a) * (ar.r + 0.6), 2, Math.cos(a) * (ar.r + 0.6), a, k % 2 ? 0xc0c4cc : 0xd8dce4); } for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; add(new T.BoxGeometry(7.4, 0.6, 1.6), Math.sin(a) * (ar.r + 0.8), 4.2, Math.cos(a) * (ar.r + 0.8), a, 0xe8261c); } }
        else { for (const s of [-1, 1]) for (let k = -10; k <= 10; k++) { const c = [0xe8261c, 0x2a62e0, 0xf0c000, 0x2aa04a][(k + 20) % 4]; add(new T.BoxGeometry(5, 3.5, 2), k * 5, 1.75, s * (ar.r + 1), 0, c); add(new T.BoxGeometry(2, 3.5, 5), s * (ar.r + 1), 1.75, k * 5, 0, c); } }
        for (const [x, z, r, kind] of ar.obs) {
          if (kind === 'bis') { add(new T.CylinderGeometry(r, r, 1.6, 20), x, 0.8, z, 0, 0xd8a050); for (let k = 0; k < 8; k++) add(new T.SphereGeometry(0.4, 6, 4), x + Math.sin(k) * r * 0.6, 1.6, z + Math.cos(k) * r * 0.6, 0, 0x7a4a1a); }
          else if (kind === 'jam') { add(new T.CylinderGeometry(r, r + 0.6, 2.2, 24), x, 1.1, z, 0, 0xe8c080); add(new T.CylinderGeometry(r * 0.6, r * 0.6, 0.4, 20), x, 2.3, z, 0, 0xd81a3a); }
          else if (kind === 'cus') { add(new T.BoxGeometry(r * 1.6, 1.4, r * 1.1), x, 0.7, z, 0.3, 0xe8c86a); add(new T.BoxGeometry(r * 1.6, 0.4, r * 1.1), x, 1.6, z, 0.3, 0xffffff); }
          else if (kind === 'blk') { for (let h = 0; h < 3; h++) add(new T.BoxGeometry(r * 1.4, 3, r * 1.4), x, 1.5 + h * 3, z, h * 0.3, [0xe8261c, 0x2a62e0, 0xf0c000][h]); }
          else if (kind === 'tower') { for (let h = 0; h < 4; h++) add(new T.BoxGeometry(r * 1.4 - h, 2.5, r * 1.4 - h), x, 1.25 + h * 2.5, z, h * 0.4, [0x2aa04a, 0xe8261c, 0x2a62e0, 0xf0c000][h]); }
          else if (kind === 'ball') { add(new T.SphereGeometry(r, 14, 10), x, r, z, 0, 0xffffff); add(new T.SphereGeometry(r * 1.01, 14, 10), x, r, z, 0.5, 0xe8261c, 1, 0.35, 1); }
        }
        for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, r = 200 + Math.random() * 60; add(new T.ConeGeometry(30, 40, 7), Math.cos(a) * r, 18, Math.sin(a) * r, 0, 0x4a8a4a); }
        world.add(new T.Mesh(RK.merge(T, P), matP)); P.forEach(p => p.geo.dispose());
        boxes = ar.boxes.map(([x, z]) => ({ x, y: 1.3, z, gone: 0 }));
        if (!balIM) { balIM = new T.InstancedMesh(T3.keep(new T.SphereGeometry(0.55, 10, 8)), T3.mat({}), 12); balIM.frustumCulled = false; T3.add(balIM); }
        if (!balStrings) { balStrings = new T.InstancedMesh(T3.keep(new T.CylinderGeometry(1,1,1,5)),T3.mat({color:0x343442,lit:false}),12);balStrings.frustumCulled=false;T3.add(balStrings); }
        balIM.visible = true; balStrings.visible = true;
      }

      // ---------------------------------------------------------------- each step
      function kartTimers(k, dt) {
        if (k.spin > 0) k.spin -= dt; if (k.tumble > 0) k.tumble -= dt; if (k.star > 0) k.star -= dt; if (k.small > 0) k.small -= dt; if (k.squash > 0) k.squash -= dt; if (k.ink > 0) k.ink -= dt; if (k.inv > 0) k.inv -= dt;
        if (k.rescue > 0) rescueStep(k, dt);
        if (k.roll > 0) { k.roll -= dt; if (k.roll <= 0) { k.item = k.rollItem; k.icount = k.item === 'TRIPLE' ? 3 : 0; k.hold = 0; if (!k.ai) K.sfx.seq([[84, 0.25], [88, 0.25], [91, 0.5]], { bpm: 400, vol: 0.08 }); } else if (!k.ai && K.frame % 5 === 0) K.sfx.tone(1200 + Math.random() * 600, 0.03, 'square', 0.03); }
      }
      function playerInput() {
        const s = K.stick(), auto = !!window.__rmAuto;
        if (auto) { const inp = cfg.kind === 'battle' ? aiBattle(me, 1 / 60, { steer: 0, gas: 1, brake: 0 }) : aiInput(me, 1 / 60); return inp; }
        return { steer: clamp(s.x, -1, 1), gas: K.held('a') || (sv.opt.auto && !K.held('b')) ? 1 : 0, brake: K.held('b') ? 1 : 0, hop: K.pressed('r'), driftHeld: K.held('r'), useItem: K.pressed('c'), aim: s.y < -0.5 ? 1 : s.y > 0.5 ? -1 : 0 };
      }
      function boxHits(k) {
        for (const b of boxes) if (!b.gone && Math.abs(b.x - k.x) < 1.7 && Math.abs(b.z - k.z) < 1.7 && Math.abs(b.y - 1.1 - k.y) < 2.2) {
          b.gone = 2.5; if (fxA) for (let s = 0; s < 10; s++) fxA.emit(b.x, b.y, b.z, (Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8, 0.45, [0xff3a3a, 0xffe14a, 0x3ad04a, 0x3a8aff][s % 4], 0.5, { g: 10 });
          if (!k.item && k.roll <= 0 && cfg.kind !== 'tt') { k.rollItem = pickItem(k); k.roll = k.ai ? 0.5 : 1.3; if (!k.ai) K.sfx.tone(1400, 0.06, 'square', 0.05); }
        }
      }
      function hazHits(k) {
        for (const h of haz) {
          if (!h.up || h.gone > 0) continue; const dx = k.x - h.x, dz = k.z - h.z, r = HR[h.k] + (k.small > 0 ? 0.5 : 1);
          if (dx * dx + dz * dz > r * r) continue;
          if (h.k === 'krumbler') { if (h.slam && k.star <= 0 && k.inv <= 0) { k.squash = 2; k.v *= 0.2; k.inv = 2.5; if (!k.ai) { say('SQUASHED!', 1.2); shake = 0.4; K.sfx.noise(0.4, 0.3, 300, 0, 'lowpass', 60); } } else if (h.down) { const d = Math.hypot(dx, dz) || 1; k.x = h.x + dx / d * r; k.z = h.z + dz / d * r; k.v *= 0.7; } continue; }
          if (Math.abs(k.y - h.y - (h.k === 'ghost' ? 0.6 : 0)) > 2.5) continue;
          if (h.k === 'snowman') { h.gone = 6; if (fxN) for (let s = 0; s < 22; s++) fxN.emit(h.x, h.y + 2, h.z, (Math.random() - 0.5) * 9, Math.random() * 7, (Math.random() - 0.5) * 9, 0.9, 0xffffff, 0.8, { g: 14 }); K.sfx.noise(0.3, 0.15, 3000); if (k.star <= 0) spin(k, 0.8); }
          else if (h.k === 'star') { const d = Math.hypot(dx, dz) || 1; k.vl += (dx / d * -Math.cos(k.yaw) + dz / d * Math.sin(k.yaw)) * 9; k.v *= 0.8; if (!k.ai) K.sfx.tone(880, 0.15, 'triangle', 0.08, 0, 1760); }
          else if (h.k === 'boulder') tumble(k);
          else spin(k, h.k === 'weed' ? 0.6 : 1.0);
        }
      }
      function raceStep(dt) {
        const kind = cfg.kind, battle = kind === 'battle';
        if (mode === 'race' || mode === 'finish' || mode === 'demo') { raceT += dt; bT += dt; }
        if (powerRest > 0) powerRest -= dt;
        if (!battle) hazUpdate(dt, raceT + 3);
        for (const k of karts) {
          kartTimers(k, dt);
          let inp;
          if (mode === 'count' || k.out) inp = { steer: 0, gas: 0, brake: 0 };
          else if (k.ai || (k === me && (kind === 'demo' || k.done || mode === 'finish'))) inp = aiInput(k, dt);
          else inp = playerInput();
          if (k.done && k !== me) { inp.gas = 1; }
          if (!battle && k.ai && mode === 'race') { const gap = (me.prog - k.prog) * L.step, rub = kind === 'demo' ? 1 : clamp(1 + gap / 500, 0.94, 1.09); k.aiMul = k.skill * rub * (1 + Math.sin(raceT * 0.3 + k.wob) * 0.015); }
          drive(k, inp, dt); tyreMarks(k);
          if (k.rescue <= 0) boxHits(k);
          if (!battle) hazHits(k);
          // laps
          if (!battle && !k.done && (mode === 'race' || mode === 'demo')) {
            const lap = Math.floor(k.prog / L.N) + 1;
            if (lap > k.lap && k.lap > 0) {
              const lt = raceT - k.lapStart; k.laps.push(lt); k.lapStart = raceT; if (!k.bestLap || lt < k.bestLap) k.bestLap = lt;
              if (k === me && kind !== 'demo') { if (lap === 3) { say('FINAL LAP!', 2); finalLap = true; K.sfx.seq([[79, 0.5], [79, 0.5], [84, 1]], { bpm: 300, vol: 0.09 }); music(raceSong()); } else if (lap < 4) say('LAP ' + lap + '   ' + fmt(lt), 1.6); }
            }
            k.lap = Math.max(k.lap, lap);
            if (lap >= 4) { k.done = true; k.ft = raceT; if (k === me && kind !== 'demo') finishRace(); }
          }
          if (k.out && k.mesh.visible && battle) { k.mesh.visible = (K.frame >> 2) % 2 === 0; if (bT - k.outT > 1.5) k.mesh.visible = false; }
        }
        // bumping into each other
        for (let a = 0; a < karts.length; a++) for (let b = a + 1; b < karts.length; b++) {
          const A = karts[a], B = karts[b]; if (A.out || B.out || A.rescue > 0 || B.rescue > 0) continue;
          const dx = B.x - A.x, dz = B.z - A.z, sa = A.small > 0 ? .55 : 1, sb = B.small > 0 ? .55 : 1, d2 = dx * dx + dz * dz;
          if (d2 > (2.15*(sa+sb))**2 || d2 < 1e-6 || Math.abs(A.y - B.y) > 1.3) continue;
          // The kart is longer than it is wide. Small circular contacts let noses pass
          // through engines and wheels; these oriented footprints keep the pack solid.
          const d = Math.sqrt(d2), nx = dx/d, nz = dz/d;
          const extent = (k,scale) => Math.hypot((nx*-Math.cos(k.yaw)+nz*Math.sin(k.yaw))*1.36*scale,(nx*Math.sin(k.yaw)+nz*Math.cos(k.yaw))*2.1*scale);
          const contact = extent(A,sa)+extent(B,sb); if (d >= contact) continue;
          if (A.star > 0 && B.star <= 0) { tumble(B, A); continue; } if (B.star > 0 && A.star <= 0) { tumble(A, B); continue; }
          if (A.small > 0 && B.small <= 0 && B.v > 4) { if (A.squash <= 0) { A.squash = 2; A.v = 0; if (B === me) me.hits++; if (A === me) say('SQUASHED!', 1); } continue; }
          if (B.small > 0 && A.small <= 0 && A.v > 4) { if (B.squash <= 0) { B.squash = 2; B.v = 0; if (A === me) me.hits++; if (B === me) say('SQUASHED!', 1); } continue; }
          const o = contact - d, wa = A.wt + 1, wb = B.wt + 1, ka = wb / (wa + wb), kb = wa / (wa + wb);
          A.x -= nx * o * ka; A.z -= nz * o * ka; B.x += nx * o * kb; B.z += nz * o * kb;
          const imp = 2.5 + Math.abs(A.v - B.v) * 0.25;
          A.vl += (-nx * -Math.cos(A.yaw) + -nz * Math.sin(A.yaw)) * imp * ka * 2; B.vl += (nx * -Math.cos(B.yaw) + nz * Math.sin(B.yaw)) * imp * kb * 2;
          if ((A === me || B === me) && imp > 3) { K.sfx.noise(0.08, 0.12, 800); shake = Math.max(shake, 0.08); }
        }
        itemsStep(dt);
        for (const b of boxes) if (b.gone > 0) b.gone -= dt;
        if (!battle) doRank();
        if (ghRec && cfg.kind === 'tt' && mode === 'race' && !me.done) ghRec.add(dt, me.x, me.y, me.z, me.yaw);
        if (battle && mode === 'race') {
          const alive = karts.filter(k => !k.out);
          if (me.out || alive.length <= 1 || bT > 150) { mode = 'finish'; finT = 0; music(null); const win = alive.length === 1 ? alive[0] : null; say(win === me ? 'YOU WIN!' : me.out ? 'BEATEN!' : win ? win.n + ' WINS!' : 'TIME UP!', 3); K.sfx.seq(win === me ? [[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]] : [[67, 0.5], [64, 0.5], [60, 1.5]], { bpm: 220, vol: 0.1 }); }
        }
      }
      function finishRace() {
        mode = 'finish'; finT = 0; music(null);
        const pos = me.place; K.sfx.seq(pos === 0 ? [[72, 0.5], [76, 0.5], [79, 0.5], [84, 1], [79, 0.5], [84, 2]] : pos < 3 ? [[72, 0.5], [76, 0.5], [79, 1.5]] : [[67, 0.5], [64, 0.5], [60, 1.5]], { bpm: 220, vol: 0.1 });
        if (cfg.kind !== 'tt') say(pos === 0 ? 'YOU WIN!' : ORD[pos] + ' PLACE', 3); else say('FINISH!', 3);
        if (me.bestLap && (!sv.lap[cfg.track] || me.bestLap < sv.lap[cfg.track])) sv.lap[cfg.track] = me.bestLap;
        sv.races++; if (pos === 0 && cfg.kind !== 'tt') sv.wins++; save();
      }
      // everybody still racing when you finish gets a time from how fast they were going
      function settle() {
        for (const k of karts) if (!k.done) { const done = Math.max(1, k.prog), left = Math.max(0, 3 * L.N - k.prog), sp = done / Math.max(1, raceT); k.ft = raceT + left / Math.max(sp, 3) + Math.random() * 0.3; k.done = true; }
        doRank();
      }
      function raceScore() {
        const pos = me.place, cls = CLASSES[cfg.cc], tb = clamp(Math.round((TRACKS[cfg.track].par * 1.25 - me.ft) * 20), 0, 800);
        return Math.round((BASE[pos] + tb + Math.min(10, me.hits) * 80) * cls.mult);
      }
      function endRace() { // the results board after a race
        settle();
        const rows = rank().map((k, n) => ({ n: k.n, col: k.D.col, t: k.ft, me: k === me, add: PTS[n], d: k.d }));
        results = { rows, t: 0, sc: raceScore() };
        if (gp) { rank().forEach((k, n) => { gp.pts[k.d] = (gp.pts[k.d] || 0) + PTS[n]; }); gp.scores.push(results.sc); gp.order = rank().map(k => k.d); }
        mode = 'results'; mt = 0; music(song(10));
      }
      function endGP() {
        const st = DRIVERS.map((d, n) => ({ d: n, p: gp.pts[n] || 0, last: gp.order ? gp.order.indexOf(n) : 0 })).sort((a, b) => b.p - a.p || a.last - b.last);
        gp.final = st; const place = st.findIndex(x => x.d === sel.drv);
        const cupK = cfg.cc + ':' + cfg.cup, msgs = [];
        if (place < 3) { const was = cupDone(cfg.cc, cfg.cup); if (!was || place + 1 < was) sv.cups[cupK] = place + 1;
          if (cfg.cup === 0 && !sv.unl.star) { sv.unl.star = 1; msgs.push('THE STAR CUP IS OPEN!'); }
          if (place === 0) { K.secret('rm.kart.cup'); if (cfg.cc === 1 && !sv.unl.c150) { sv.unl.c150 = 1; msgs.push('150CC UNLOCKED!'); } if (cfg.cc === 2 && cupDone(2, 0) === 1 && cupDone(2, 1) === 1 && !sv.unl.mirror) { sv.unl.mirror = 1; msgs.push('MIRROR MODE UNLOCKED!'); K.secret('rm.kart.mirror'); } } }
        const total = gp.scores.reduce((a, b) => a + b, 0) + (place < 3 ? [3000, 2000, 1200][place] * CLASSES[cfg.cc].mult : 0);
        gp.total = Math.round(total); gp.place = place; gp.msgs = msgs; save();
        mode = 'podium'; mt = 0; TH = THEMES.park; setTheme(TH); buildPodium(); showOnly([]);
        st.slice(0, 3).forEach((x, n) => { const m = meshFor(x.d); m.geometry=kartGeo[x.d]; m.visible = true; m.position.set(300 + [0, -4.6, 4.6][n], -300 + [3, 2, 1.2][n], 0.2); m.rotation.set(0, Math.PI * 0.85 + n * 0.2 - 0.2, 0); m.scale.set(1, 1, 1); });
        trophy.material.color.setHex(place === 0 ? 0xffd040 : place === 1 ? 0xd8d8e0 : 0xd0884a); trophy.visible = place < 3;
        music(null); K.sfx.seq([[72, 0.5], [72, 0.5], [72, 0.5], [76, 1.5], [74, 0.5], [77, 0.5], [76, 0.5], [79, 2]], { bpm: 200, vol: 0.1 });
      }
      function report(score, title, text) {
        if (reported) return; reported = true;
        const sc = scoreCap(score);
        if (sc > 0) { sv.hi.push({ n: myName(), s: sc }); sv.hi.sort((a, b) => b.s - a.s); sv.hi.length = Math.min(sv.hi.length, 5); save(); }
        K.over(sc, { title, text });
      }

      // ---------------------------------------------------------------- menus
      const MAIN = ['GRAND PRIX', 'VS RACE', 'TIME TRIALS', 'BATTLE', 'RECORDS', 'OPTIONS', 'HOW TO PLAY'];
      function nav(n, cur, up, down) { if (K.pressed(up || 'up')) { K.sfx.tone(880, 0.03, 'square', 0.05); return (cur + n - 1) % n; } if (K.pressed(down || 'down')) { K.sfx.tone(880, 0.03, 'square', 0.05); return (cur + 1) % n; } return cur; }
      const ok = () => K.pressed('a') || K.pressed('start');
      const back = () => K.pressed('b');
      const beep = () => K.sfx.tone(1320, 0.06, 'square', 0.06);
      const boop = () => K.sfx.tone(330, 0.08, 'square', 0.06);
      let flow = 'gp', menuFrom = 'main', previewT = -1;
      // cheat codes on the title screen and main menu (1999 style: type them in on the pad)
      const cheat = {}; let cbuf = [];
      const CHEATS = [
        { id: 'heads', n: 'BIG HEAD MODE', seq: ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'], fn: on => { kartGeo.forEach((g, d) => { const ng = RK.kart2(T, Object.assign({}, DRIVERS[d].k, { head: on ? 2.0 : 1.2 })); if (kartMesh[d]) kartMesh[d].geometry = ng; kartGeo[d] = ng; const lg=kartLow[d];kartLow[d]=RK.kart2(T,Object.assign({},DRIVERS[d].k,{head:on?2:1.2,low:true}));if(lg)lg.dispose(); if(ghostMesh && ghostMesh.geometry===g)ghostMesh.geometry=ng; g.dispose(); }); } },
        { id: 'all', n: 'ALL TRACKS OPEN', seq: ['down', 'r', 'down', 'r', 'c'] },
      ];
      function cheatStep() {
        for (const b of ['up', 'down', 'left', 'right', 'a', 'b', 'c', 'r']) if (K.pressed(b)) {
          cbuf.push(b); if (cbuf.length > 12) cbuf.shift();
          for (const c of CHEATS) if (cbuf.length >= c.seq.length && c.seq.every((x, i) => cbuf[cbuf.length - c.seq.length + i] === x)) { cheat[c.id] = !cheat[c.id]; cbuf = []; if (c.id === 'all') window.__kartCheatAll = cheat.all; say(c.n + (cheat[c.id] ? '!' : ' OFF'), 2.5); K.sfx.seq([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 0.75]], { bpm: 420, vol: 0.09 }); if (c.fn) c.fn(cheat[c.id]); }
        }
      }
      function menuStep(dt) {
        if (mode === 'title' || mode === 'main') cheatStep();
        if (mode === 'title') {
          mt += dt; idle += dt;
          if (K.any() || K.pressed('up') || K.pressed('down')) { idle = 0; if (ok()) { beep(); mode = 'main'; mt = 0; } }
          if (idle > 16) startDemo();
          return;
        }
        if (mode === 'demo') { demoT += dt; if (K.any() || demoT > 40) { goTitle(); } return; }
        mt += dt;
        if (mode === 'main') {
          sel.main = nav(MAIN.length, sel.main);
          if (back()) { boop(); goTitle(); return; }
          if (ok()) { beep(); const m = MAIN[sel.main];
            if (m === 'GRAND PRIX') { flow = 'gp'; mode = 'cc'; } else if (m === 'VS RACE') { flow = 'vs'; mode = 'cc'; } else if (m === 'TIME TRIALS') { flow = 'tt'; cfg.cc = 1; toDriver(); } else if (m === 'BATTLE') { flow = 'battle'; cfg.cc = 1; toDriver(); }
            else if (m === 'RECORDS') { mode = 'records'; sel.rec = 0; } else if (m === 'OPTIONS') { mode = 'options'; sel.opt = 0; } else { mode = 'how'; sel.how = 0; } mt = 0; }
          return;
        }
        if (mode === 'cc') {
          sel.cc = nav(4, sel.cc); if (back()) { boop(); mode = 'main'; return; }
          if (ok()) { if (!ccOpen(sel.cc)) { boop(); say(sel.cc === 2 ? 'WIN GOLD ON 100CC FIRST' : 'WIN BOTH GOLDS ON 150CC FIRST', 1.6); return; } beep(); cfg.cc = sel.cc; toDriver(); }
          return;
        }
        if (mode === 'driver') {
          const c = sel.drv; if (K.pressed('left')) sel.drv = (sel.drv + 7) % 8; if (K.pressed('right')) sel.drv = (sel.drv + 1) % 8; if (K.pressed('up') || K.pressed('down')) sel.drv = (sel.drv + 4) % 8;
          if (c !== sel.drv) { K.sfx.tone(DRIVERS[sel.drv].nt * 10, 0.05, 'square', 0.05); garageShow(); }
          if (back()) { boop(); mode = flow === 'gp' || flow === 'vs' ? 'cc' : 'main'; leaveGarage(); return; }
          if (ok()) { beep(); K.sfx.seq([[DRIVERS[sel.drv].nt, 0.25], [DRIVERS[sel.drv].nt + 7, 0.5]], { bpm: 300, vol: 0.08, wave: 'triangle' }); sv.drv = sel.drv; save(); leaveGarage();
            if (flow === 'gp') { mode = 'cup'; sel.cup = 0; } else if (flow === 'battle') { mode = 'arena'; sel.arena = 0; } else { mode = 'track'; sel.trk = trackOpen(sel.trk) ? sel.trk : 0; previewT = 0.2; } mt = 0; }
          return;
        }
        if (mode === 'cup') {
          if (K.pressed('left') || K.pressed('right') || K.pressed('up') || K.pressed('down')) { sel.cup = 1 - sel.cup; K.sfx.tone(880, 0.03, 'square', 0.05); }
          if (back()) { boop(); toDriver(); return; }
          if (ok()) { if (sel.cup === 1 && !starOpen()) { boop(); say('GET A TROPHY IN THE BISCUIT CUP FIRST', 2); return; } beep(); cfg.cup = sel.cup; newGP(); }
          return;
        }
        if (mode === 'track') {
          const c = sel.trk; sel.trk = nav(TRACKS.length, sel.trk); if (c !== sel.trk) previewT = 0.35;
          if (previewT > 0) { previewT -= dt; if (previewT <= 0 && trackOpen(sel.trk) && trackPrev !== sel.trk) { buildTrack(sel.trk, false); trackPrev = sel.trk; karts = []; showOnly([]); } }
          if (back()) { boop(); toDriver(); return; }
          if (ok()) { if (!trackOpen(sel.trk)) { boop(); say('GET A TROPHY IN THE BISCUIT CUP FIRST', 2); return; } beep(); cfg.track = sel.trk; sv.track = sel.trk; save(); cfg.kind = flow; gp = null; setupRace(); }
          return;
        }
        if (mode === 'arena') {
          sel.arena = nav(2, sel.arena); if (back()) { boop(); toDriver(); return; }
          if (ok()) { beep(); cfg.arena = sel.arena; startBattle(); }
          return;
        }
        if (mode === 'options') {
          sel.opt = nav(5, sel.opt); if (back()) { boop(); mode = 'main'; save(); return; }
          if (ok() || K.pressed('left') || K.pressed('right')) { beep();
            if (sel.opt === 0) { sv.opt.mus = sv.opt.mus ? 0 : 1; music(song(9)); } else if (sel.opt === 1) sv.opt.cam = sv.opt.cam ? 0 : 1; else if (sel.opt === 2) sv.opt.ghost = sv.opt.ghost ? 0 : 1; else if (sel.opt === 3) sv.opt.auto = sv.opt.auto ? 0 : 1; else if (ok()) { mode = 'main'; } save(); }
          return;
        }
        if (mode === 'records') { if (K.pressed('left') || K.pressed('right')) { sel.rec = 1 - sel.rec; beep(); } if (back() || ok()) { boop(); mode = 'main'; } return; }
        if (mode === 'how') { if (K.pressed('right') || ok()) { if (sel.how < 2) { sel.how++; beep(); } else if (ok()) { mode = 'main'; beep(); } } if (K.pressed('left') && sel.how > 0) { sel.how--; beep(); } if (back()) { boop(); mode = 'main'; } return; }
      }
      function toDriver() { mode = 'driver'; mt = 0; setTheme(THEMES.park); buildGarage(); garageShow(); }
      function garageShow() { showOnly([]); const m = meshFor(sel.drv); m.geometry=kartGeo[sel.drv]; m.visible = true; m.position.set(0, -300, 0); m.scale.set(1, 1, 1); }
      function leaveGarage() { showOnly([]); }

      // ---------------------------------------------------------------- the frame
      function update(dt) {
        if (mode === 'load' || mode === 'view') return;
        // Pause freezes presentation as well as simulation; the menu alone keeps accepting input.
        if (!paused) {
        if (shake > 0) shake = Math.max(0, shake - dt); if (flash > 0) flash -= dt; if (msgT > 0) msgT -= dt;
        for (const [t, sp] of waterTex) { t.offset.x += dt * sp; t.offset.y += dt * sp * 0.6; }
        if (padTex) padTex.offset.y -= dt * 2;
        if (windmill) windmill.rotation.z += dt * 0.8;
        if (dino) { const a = K.t * 0.05; dino.position.set(dino.cx + Math.cos(a) * dino.r, gY, dino.cz + Math.sin(a) * dino.r); dino.rotation.y = -a; }
        if (fxN && K.frame % 3 === 0) {
          for (const s of smokers) fxN.emit(s[0] + (Math.random() - 0.5) * 6, s[1], s[2] + (Math.random() - 0.5) * 6, 1, 4, 0, 6, 0x5a4a4a, 8, { grow: 22, a: 0.6 });
          if (TR && TR.props === 'castle') for (let n = 0; n < 3 && torches.length; n++) { const t = torches[(Math.random() * torches.length) | 0]; fxA.emit(t[0], t[1], t[2], 0, 2, 0, 0.4, Math.random() < 0.5 ? 0xff7a1a : 0xffd040, 0.6, { grow: 0.1 }); }
          if (TH && TH.snowing) { const c = T3.cam.position; for (let n = 0; n < 4; n++) fxN.emit(c.x + (Math.random() - 0.5) * 50, c.y + 14, c.z + (Math.random() - 0.5) * 50, (Math.random() - 0.5), -4, (Math.random() - 0.5), 4, 0xffffff, 0.35); }
          if (TH && TH.lava && L) { const p = L.P[(Math.random() * L.N) | 0]; fxA.emit(p.x + (Math.random() - 0.5) * 60, gY + 0.2, p.z + (Math.random() - 0.5) * 60, 0, 3, 0, 0.8, 0xff8a1a, 0.9, { g: 6 }); }
        }
        }
        if (['title', 'main', 'cc', 'driver', 'cup', 'track', 'arena', 'options', 'records', 'how', 'demo'].includes(mode)) {
          menuStep(dt);
          if (mode === 'demo' && L) raceStep(dt);
          if (mode === 'title' || mode === 'main') hazUpdate(dt, K.t);
          return;
        }
        if (mode === 'intro') { introT += dt; hazUpdate(dt, K.t); if (introT > 3.6 || (introT > 0.4 && ok())) startCount(); return; }
        if (mode === 'podium') { mt += dt; if (fxN && K.frame % 2 === 0) fxN.emit(300 + (Math.random() - 0.5) * 16, -286, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 2, -2, (Math.random() - 0.5) * 2, 3, [0xff3a3a, 0xffe14a, 0x3ad04a, 0x3a8aff, 0xff8ad0][K.frame % 5], 0.35); if (mt > 1.5 && fxA && K.frame % 40 === 0) { const x = 300 + (Math.random() - 0.5) * 30, y = -285 + Math.random() * 6; for (let s = 0; s < 24; s++) fxA.emit(x, y, -8, Math.cos(s / 24 * TAU) * 6, Math.sin(s / 24 * TAU) * 6, 0, 1, [0xff5a5a, 0xffe14a, 0x5affff][(K.frame / 40 | 0) % 3], 0.6, { g: 3 }); K.sfx.noise(0.3, 0.06, 1500); }
          if (trophy) { trophy.position.set(gp.place === 1 ? -4.6 : gp.place === 2 ? 4.6 : 0, (gp.place === 1 ? 2 : gp.place === 2 ? 1.2 : 3) + 2.4 + Math.max(0, 6 - mt * 3), 0); trophy.rotation.y += dt * 1.5; }
          if (mt > 4 && ok()) { report(gp.total, gp.place < 3 ? ['GOLD CUP!', 'SILVER CUP!', 'BRONZE CUP!'][gp.place] : 'CUP OVER', `${CUPS[gp.cup].n} ${CLASSES[gp.cc].n}  ${ORD[gp.place]} WITH ${gp.pts[sel.drv]} POINTS` + (gp.msgs.length ? '  ' + gp.msgs.join(' ') : '')); }
          if (mt > 14) report(gp.total, gp.place < 3 ? ['GOLD CUP!', 'SILVER CUP!', 'BRONZE CUP!'][gp.place] : 'CUP OVER', `${CUPS[gp.cup].n} ${CLASSES[gp.cc].n}  ${ORD[gp.place]} WITH ${gp.pts[sel.drv]} POINTS`);
          return;
        }
        if (mode === 'results') {
          mt += dt; results.t += dt;
          if (mt > 1 && ok()) {
            beep();
            if (cfg.kind === 'gp') { mode = 'standings'; mt = 0; }
            else report(results.sc, me.place === 0 ? 'YOU WIN!' : 'FINISHED ' + ORD[me.place], `${TRACKS[cfg.track].n} ${CLASSES[cfg.cc].n}  TIME ${fmt(me.ft)}  BEST LAP ${fmt(me.bestLap)}`);
          }
          return;
        }
        if (mode === 'standings') { mt += dt; if (mt > 1 && ok()) { beep(); gp.race++; if (gp.race >= 4) endGP(); else { cfg.track = CUPS[gp.cup].t[gp.race]; setupRace(); } } return; }
        if (mode === 'ttres' || mode === 'bres') { mt += dt; if (mt > 1 && ok()) { beep(); const r = results; report(r.sc, r.title, r.text); } return; }
        // racing (or battling)
        if (K.pressed('start') && (mode === 'race' || mode === 'count')) { paused = !paused; if (paused) { pauseTime = K.t; pauseFrame = K.frame; } psel = 0; K.sfx.tone(paused ? 440 : 880, 0.06); if (paused) music(null); else if (mode === 'race') music(raceSong()); return; }
        if (paused) {
          psel = nav(3, psel);
          if (back()) { paused = false; if (mode === 'race') music(raceSong()); }
          if (K.pressed('a')) { beep(); paused = false;
            if (psel === 0) { if (mode === 'race') music(raceSong()); }
            else if (psel === 1) { if (cfg.kind === 'battle') startBattle(); else setupRace(); }
            else goTitle(); }
          return;
        }
        if (mode === 'count') {
          const c0 = Math.ceil(count); count -= dt; const c1 = Math.ceil(count);
          if (c1 !== c0 && c1 >= 1 && c1 <= 3) K.sfx.tone(440, 0.22, 'square', 0.1);
          if (!K.held('a')) me.early = null;
          if (K.pressed('a')) me.early = count;
          if (count <= 0) {
            mode = 'race'; K.sfx.tone(880, 0.6, 'square', 0.12); music(raceSong());
            if (K.held('a') && me.early != null && me.early < 1.0 && me.early > 0.1) { me.boost = 1.0; say('ROCKET START!', 1.2); K.sfx.noise(0.6, 0.15, 900, 0, 'bandpass', 3000); }
            else if (me.early != null && me.early > 2.2) { me.spin = 0.7; me.spinYaw = me.yaw; say('TOO EARLY!', 1.2); }
            for (const k of karts) if (k.ai && k.rocket) k.boost = 0.7;
          }
        }
        raceStep(dt);
        // the engine
        if (!me.done && mode === 'race' && K.frame % 5 === 0) K.sfx.tone(70 + Math.abs(me.v) * 5 + (me.boost > 0 ? 40 : 0), 0.1, 'sawtooth', 0.016);
        if (me.drift && K.frame % 6 === 0) K.sfx.noise(0.1, 0.03, 2500, 0, 'bandpass');
        if (mode === 'finish') {
          finT += dt;
          if (cfg.kind === 'battle') { if (finT > 3) { const alive = karts.filter(k => !k.out), win = alive.length === 1 ? alive[0] : alive.slice().sort((a, b) => b.balloons - a.balloons)[0], iWin = win === me && !me.out;
            const sc = (iWin ? 4000 + me.balloons * 400 : Math.min(2400, Math.floor(bT * 10))) + (me.pops || 0) * 250;
            results = { sc, title: iWin ? 'YOU WIN!' : me.out ? 'BEATEN!' : 'TIME UP!', text: `${AR.n}  BALLOONS POPPED ${me.pops || 0}`, rows: karts.slice().sort((a, b) => (b.out ? b.outT : 999 + b.balloons) - (a.out ? a.outT : 999 + a.balloons)), win };
            mode = 'bres'; mt = 0; music(song(10)); } }
          else if (finT > 4) {
            if (cfg.kind === 'tt') {
              const t = me.ft, old = sv.tt[cfg.track] || 0, rec = !old || t < old, par = TRACKS[cfg.track].par;
              if (rec) { sv.tt[cfg.track] = Math.round(t * 100) / 100; ghSave(cfg.track, sel.drv + '|' + ghRec.str()); }
              if (t < par) K.secret('rm.kart.staff');
              save();
              results = { sc: Math.round(clamp(4200 + (par - t) * 160, 600, 9000)), title: rec ? 'NEW RECORD!' : 'TIME TRIAL', text: `${TRACKS[cfg.track].n}  ${fmt(t)}  BEST LAP ${fmt(me.bestLap)}`, t, rec, old, par, laps: me.laps.slice() };
              mode = 'ttres'; mt = 0; music(song(10));
            } else endRace();
          }
        }
      }

      // ---------------------------------------------------------------- the camera and the karts' poses
      let viewObj = null, view3 = [0.6, 0.25, 7];
      function placeKarts() {
        const poseTime = paused ? pauseTime : K.t, poseFrame = paused ? pauseFrame : K.frame;
        let sn = 0;
        for (const k of karts) {
          const m = k.mesh;
          if(k.ai && me && kartLow[k.d]){const dist=Math.hypot(k.x-me.x,k.z-me.z);if(dist>18)m.geometry=kartLow[k.d];else if(dist<12)m.geometry=kartGeo[k.d];}else m.geometry=kartGeo[k.d];
          if (cfg.kind === 'battle' && k.out) { m.visible = bT - k.outT < 1.5 && (poseFrame >> 2) % 2 === 0; continue; }
          let pitch = 0, roll = 0;
          if (L && cfg.kind !== 'battle') { const i = k.idx, j = L.wrap(i + 1), dy = (L.P[j].y - L.P[i].y) / L.step, ty = Math.atan2(L.D[i].x, L.D[i].z); pitch = Math.atan(dy * Math.cos(k.yaw - ty)); roll = Math.asin(clamp(L.R[i].y, -1, 1)) * Math.cos(k.yaw - ty); }
          if (k.air) pitch += clamp(-k.vy * 0.03, -0.3, 0.3);
          const dv = k.drift ? k.drift * 0.38 : 0;
          const yaw = k.yaw + dv + (k.tumble > 0 ? (1.4 - k.tumble) * 9 : 0);
          m.position.set(k.x, k.y + (k.rescue > 1 ? -50 : 0), k.z);
          m.rotation.set(-pitch + (k.tumble > 0 ? Math.sin(k.tumble * 9) * 0.6 : 0), yaw, roll - (k.drift ? k.drift * 0.08 : 0) + (k.spin > 0 ? Math.sin(k.spin * 20) * 0.1 : 0), 'YXZ');
          const s = k.small > 0 ? 0.55 : 1; m.scale.set(s, k.squash > 0 ? s * 0.3 : s, s);
          if (k.out) continue;
          m.visible = !(k.inv > 0 && k.spin <= 0 && k.rescue <= 0 && (poseFrame >> 2) % 2) && !(k.star > 0 && (poseFrame >> 1) % 3 === 0);
          if (cfg.kind === 'battle' && k.balloons > 0 && balIM) for (let b = 0; b < k.balloons; b++) { const a = k.yaw + Math.PI + (b - (k.balloons - 1) / 2) * 0.9; setI(balIM, (karts.indexOf(k) * 3 + b), k.x + Math.sin(a) * 1.5, k.y + 3.6 + Math.sin(poseTime * 3 + b) * 0.15 + (b === 1 ? 0.35 : 0), k.z + Math.cos(a) * 1.5, 0, 0.75, 0, 0, 0.95); balIM.setColorAt(karts.indexOf(k) * 3 + b, new T.Color(k.D.col));
            const endX=k.x+Math.sin(a)*1.5,endZ=k.z+Math.cos(a)*1.5,endY=k.y+3.3+Math.sin(poseTime*3+b)*.15+(b===1?.35:0);
            const startX=k.x-Math.sin(k.yaw)*.6,startZ=k.z-Math.cos(k.yaw)*.6,startY=k.y+1.4;
            V2.set(endX-startX,endY-startY,endZ-startZ);const length=V2.length();Q.setFromUnitVectors(balloonUp,V2.normalize());
            V1.set((startX+endX)/2,(startY+endY)/2,(startZ+endZ)/2);SC.set(.018,length,.018);M4.compose(V1,Q,SC);balStrings.setMatrixAt(karts.indexOf(k)*3+b,M4);
          }
          // the blob shadow on the ground
          const gy = cfg.kind === 'battle' ? 0 : (k.air ? groundAt(k.idx, k.lat, 0) : k.y);
          if (sn < 12 && gy > -500) { setI(shadows, sn++, k.x, gy + 0.06, k.z, k.yaw, s * clamp(1 - (k.y - gy) * 0.08, 0.4, 1), -pitch, roll); }
        }
        if (ghost && ghostMesh && (mode === 'race' || mode === 'count' || mode === 'finish')) { const g = ghost.at(mode === 'count' ? 0 : raceT); if (g) { ghostMesh.visible = true; ghostMesh.position.set(g.x, g.y, g.z); ghostMesh.rotation.set(0, g.a, 0); } }
        for (let n = sn; n < 12; n++) shadows.setMatrixAt(n, ZERO); shadows.instanceMatrix.needsUpdate = true;
        if (balIM) { if (cfg.kind !== 'battle') { balIM.visible = false; if(balStrings)balStrings.visible=false; } else { karts.forEach((k, n) => { for (let b = k.out ? 0 : k.balloons; b < 3; b++) { balIM.setMatrixAt(n * 3 + b, ZERO); if(balStrings)balStrings.setMatrixAt(n*3+b,ZERO); } }); balIM.instanceMatrix.needsUpdate = true; if(balStrings)balStrings.instanceMatrix.needsUpdate=true; if (balIM.instanceColor) balIM.instanceColor.needsUpdate = true; } }
        boxes.forEach((b, n) => { if (b.gone > 0) boxIM.setMatrixAt(n, ZERO); else setI(boxIM, n, b.x, b.y + Math.sin(poseTime * 2 + n) * 0.15, b.z, poseTime * 1.6 + n, 1, poseTime * 0.9, 0.3); });
        for (let n = boxes.length; n < 40; n++) boxIM.setMatrixAt(n, ZERO); boxIM.instanceMatrix.needsUpdate = true;
        // the rescue drone
        const r = karts.find(k => k.rescue > 0 && k.rescue < 1.6);
        if (r) { if (!drone) { const P = [{ geo: new T.SphereGeometry(0.8, 10, 8), m: RK.M(T, 0, 0, 0), c: 0xf0f0f0 }, { geo: new T.BoxGeometry(3.4, 0.12, 0.3), m: RK.M(T, 0, 0.9, 0), c: 0x333333 }, { geo: new T.BoxGeometry(0.3, 0.12, 3.4), m: RK.M(T, 0, 0.9, 0), c: 0x333333 }, { geo: new T.BoxGeometry(0.08, 2.5, 0.08), m: RK.M(T, 0, -1.6, 0), c: 0x222222 }, { geo: new T.BoxGeometry(0.4, 0.3, 0.05), m: RK.M(T, 0, 0.1, 0.78), c: 0x1a1a3a }]; drone = new T.Mesh(RK.merge(T, P), matV); P.forEach(p => p.geo.dispose()); kartsG.add(drone); }
          drone.visible = true; drone.position.set(r.x, r.y + 4 + (r.rescue > 1 ? (r.rescue - 1) * 8 : 0), r.z); drone.rotation.y = poseTime * 3; }
        else if (drone) drone.visible = false;
      }
      function camera(dt) {
        const C = T3.cam; let f = 64;
        if (mode === 'view') { const [a, e, d] = view3; C.position.set(Math.sin(a) * Math.cos(e) * d, -299 + Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d); C.lookAt(0, -299.1, 0); sky && sky.follow(C); C.fov = 50; C.updateProjectionMatrix(); return; }
        if (mode === 'driver') { const a = K.t * 0.5; C.position.set(Math.sin(0.5) * 9, -296.5, Math.cos(0.5) * 9); C.lookAt(-1.4, -299.2, .5); const m = meshFor(sel.drv); m.rotation.set(0, a, 0); setI(shadows,0,0,-299.94,0,a,1); for(let n=1;n<12;n++)shadows.setMatrixAt(n,ZERO);shadows.instanceMatrix.needsUpdate=true; sky && sky.follow(C); C.fov = 50; C.updateProjectionMatrix(); return; }
        if (mode === 'podium') { const a = 0.4 + Math.sin(mt * 0.3) * 0.5; C.position.set(300 + Math.sin(a) * 15, -293, Math.cos(a) * 15); C.lookAt(300, -298, 0); sky && sky.follow(C); C.fov = 55; C.updateProjectionMatrix(); return; }
        if (cfg.kind === 'battle' && (mode === 'count' || mode === 'race' || mode === 'finish' || mode === 'bres')) {
          if (mode === 'bres' || mode === 'finish') { const a = mt * 0.3 + finT * 0.3; C.position.set(Math.sin(a) * 40, 30, Math.cos(a) * 40); C.lookAt(0, 0, 0); }
          else follow(me, dt);
          sky.follow(C); return;
        }
        if (!L) return;
        if (['title', 'main', 'cc', 'cup', 'track', 'arena', 'options', 'records', 'how'].includes(mode)) {
          const fi = (K.t * 9) % L.N, p = L.atf(fi, Math.sin(K.t * 0.2) * 6, 7, V1), q = L.atf((fi + 14) % L.N, 0, 1.5, V2);
          C.position.copy(p); C.lookAt(q);
        } else if (mode === 'intro') {
          const fi = (L.N * 0.5 + introT * 22) % L.N, p = L.atf(fi, 10, 9 - introT, V1), q = L.atf((fi + 18) % L.N, 0, 1, V2);
          if (introT > 2.3) { const k = clamp((introT - 2.3) / 1.2, 0, 1), fx = Math.sin(me.yaw), fz = Math.cos(me.yaw); p.lerp(V3.set(me.x - fx * 7, me.y + 3, me.z - fz * 7), k); q.lerp(V3.set(me.x + fx * 5, me.y + 1, me.z + fz * 5), k); }
          C.position.copy(p); C.lookAt(q);
        } else if (mode === 'demo') {
          const r = rank(); if (K.frame % 480 === 0) demoCam = (demoCam + 1) % 3; const k = r[demoCam] || r[0];
          follow(k, dt);
        } else if ((mode === 'finish' && finT > 1.2) || mode === 'results' || mode === 'standings' || mode === 'ttres') {
          const a = (finT + mt) * 0.5; C.position.set(me.x + Math.sin(a) * 9, me.y + 3.5, me.z + Math.cos(a) * 9); C.lookAt(me.x, me.y + 1, me.z);
        } else { follow(me, dt); f = 64 + (me.boost > 0 ? 9 : 0) + (me.star > 0 ? 4 : 0); }
        fov += (f - fov) * Math.min(1, dt * 4); if (Math.abs(C.fov - fov) > 0.05) { C.fov = fov; C.updateProjectionMatrix(); }
        if (sky) sky.follow(C);
      }
      function follow(k, dt) {
        const C = T3.cam, yaw = k.spin > 0 || k.tumble > 0 ? k.spinYaw : k.yaw;
        camYaw += wrapA(yaw - camYaw) * Math.min(1, dt * (k.drift ? 3 : 4.5));
        const far = sv.opt.cam ? 1 : 0, back = (far ? 8.6 : 6.6) + Math.max(0, k.v - 18) * 0.1, up = far ? 3.7 : 2.8;
        const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
        camY += (Math.max(k.y, k.rescue > 0 ? k.y : -999) + up - camY) * Math.min(1, dt * 6);
        const sx = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0, sy = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;
        C.position.set(k.x - fx * back + sx, camY + sy, k.z - fz * back);
        C.lookAt(k.x + fx * 4, k.y + 1.2, k.z + fz * 4);
      }

      // ---------------------------------------------------------------- the 2D bits on top
      function big(s, x, y, size, c1, c2, align, stroke) {
        H.save(); H.font = `italic 900 ${size}px "Arial Black", Arial, sans-serif`; H.textAlign = align || 'center'; H.textBaseline = 'middle'; H.lineJoin = 'round';
        H.lineWidth = Math.max(3, size / 5); H.strokeStyle = stroke || '#1a0a2a'; H.strokeText(s, x, y);
        const g = H.createLinearGradient(0, y - size / 2, 0, y + size / 2); g.addColorStop(0, c1); g.addColorStop(1, c2 || c1); H.fillStyle = g; H.fillText(s, x, y); H.restore();
      }
      function panel(x, y, w, h, col, edge) { H.fillStyle = col || 'rgba(10,20,80,.78)'; H.fillRect(x, y, w, h); H.strokeStyle = edge || '#ffe14a'; H.lineWidth = 2; H.strokeRect(x + 1, y + 1, w - 2, h - 2); H.strokeStyle = 'rgba(255,255,255,.25)'; H.lineWidth = 1; H.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7); }
      const txt = (s, x, y, c, k, sh) => F.draw(H, s, x, y, c || '#fff', k || 1, sh === false ? null : (sh || '#000'));
      const ctr = (s, y, c, k, sh) => F.center(H, s, W / 2, y, c || '#fff', k || 1, sh === false ? null : (sh || '#000'));
      function printLines(s,x,y,width,col) {
        let line='';for(const word of s.split(' ')){const next=line?line+' '+word:word;if(F.width(next)>width&&line){txt(line,x,y,col);y+=10;line=word}else line=next}if(line)txt(line,x,y,col);
      }
      const blink = r => ((K.t * (r || 2)) | 0) % 2 === 0;
      const portrait = (d, x, y, s, hi) => {
        H.drawImage(FACE[d],x,y,s,s);H.strokeStyle=hi?'#ffe14a':'#14142a';H.lineWidth=hi?2:1;
        H.strokeRect(x+.5,y+.5,s-1,s-1);
      };
      let mini = null, miniFor = '';
      function minimap() {
        const key = (cfg.kind === 'battle' ? 'A' + cfg.arena : 'T' + trackPrev) + (MIR ? 'm' : '');
        if (miniFor !== key) {
          miniFor = key; mini = document.createElement('canvas'); mini.width = mini.height = 70; const g = mini.getContext('2d');
          if (cfg.kind === 'battle') { const k = 30 / AR.r; mini.map = (x, z) => [35 + x * k, 35 + z * k]; g.fillStyle = 'rgba(0,0,0,.35)'; if (AR.shape === 'round') { g.beginPath(); g.arc(35, 35, 31, 0, TAU); g.fill(); } else g.fillRect(4, 4, 62, 62); g.fillStyle = 'rgba(255,255,255,.5)'; for (const o of AR.obs) { g.beginPath(); g.arc(35 + o[0] * k, 35 + o[1] * k, o[2] * k, 0, TAU); g.fill(); } }
          else { let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; for (const p of L.P) { mnx = Math.min(mnx, p.x); mxx = Math.max(mxx, p.x); mnz = Math.min(mnz, p.z); mxz = Math.max(mxz, p.z); }
            const k = 62 / Math.max(mxx - mnx, mxz - mnz); mini.map = (x, z) => [4 + (mxx - x) * k, 4 + (mxz - z) * k];
            g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 5; g.beginPath(); L.P.forEach((p, i) => { const [x, y] = mini.map(p.x, p.z); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke();
            const [sx, sy] = mini.map(L.P[0].x, L.P[0].z); g.fillStyle = '#e8261c'; g.fillRect(sx - 2, sy - 2, 4, 4); }
        }
        const ox = 6, oy = HH - 76; H.globalAlpha = 0.9; H.drawImage(mini, ox, oy); H.globalAlpha = 1;
        for (const k of karts.slice().reverse()) { if (k.out) continue; const [x, y] = mini.map(k.x, k.z), s = k === me ? 5 : 3.5; H.fillStyle = hexs(k.D.col); H.fillRect(ox + x - s / 2, oy + y - s / 2, s, s); if (k === me) { H.strokeStyle = '#fff'; H.lineWidth = 1; H.strokeRect(ox + x - s / 2 - 0.5, oy + y - s / 2 - 0.5, s + 1, s + 1); } }
        for (const o of items) if (o.k === 'bomb' || o.k === 'homer') { const [x, y] = mini.map(o.x, o.z); H.fillStyle = o.k === 'bomb' ? '#3a6aff' : '#ff3a2a'; H.fillRect(ox + x - 1.5, oy + y - 1.5, 3, 3); }
      }
      function itemSlot() {
        const x = W / 2 - 20, y = 6; H.fillStyle = 'rgba(0,0,30,.55)'; H.fillRect(x, y, 40, 34); H.strokeStyle = '#ffe14a'; H.lineWidth = 2; H.strokeRect(x + 1, y + 1, 38, 32); H.strokeStyle = '#a07a10'; H.lineWidth = 1; H.strokeRect(x + 3.5, y + 3.5, 33, 27);
        let ic = me.item; if (me.roll > 0) ic = ITEMS[((((paused ? pauseTime : K.t) * 14)) | 0) % (cfg.kind === 'battle' ? 5 : ITEMS.length)];
        if (ic && ICON[ic]) H.drawImage(ICON[ic], x + 8, y + 5, 24, 24);
        if (me.item === 'TRIPLE') for (let n = 0; n < me.icount; n++) { H.fillStyle = '#ff7a00'; H.fillRect(x + 8 + n * 9, y + 29, 6, 3); }
        if (me.item && !me.roll && blink(3)) txt(key('c'), x + 41, y + 26, '#ffe14a');
      }
      function placeBadge(p) {
        const cols = [['#fff8a0', '#e8a000'], ['#ffffff', '#9aa0b0'], ['#ffc890', '#b8641a']][p] || ['#a8d8ff', '#2a6ad0'];
        const s = ORD[p], n = s.slice(0, 1), suf = s.slice(1);
        big(n, W - 44, HH - 30, 42, cols[0], cols[1]); big(suf, W - 16, HH - 38, 14, cols[0], cols[1]);
      }
      function lights(c) { const x0 = W / 2 - 36; H.fillStyle = '#1a1a1a'; H.fillRect(x0, 46, 72, 26); H.strokeStyle = '#555'; H.strokeRect(x0 + 0.5, 46.5, 71, 25); for (let i = 0; i < 3; i++) { const on = c <= 0 ? 'go' : 3 - Math.ceil(c) >= i; H.fillStyle = on === 'go' ? '#3aff5a' : on ? '#ff3a2a' : '#3a1010'; H.beginPath(); H.arc(x0 + 14 + i * 22, 59, 8, 0, TAU); H.fill(); H.fillStyle = 'rgba(255,255,255,.35)'; H.beginPath(); H.arc(x0 + 12 + i * 22, 56, 3, 0, TAU); H.fill(); } }
      function logo(y, s) {
        s = s || 1; const bob = Math.sin(K.t * 2) * 2;
        big('KART', W / 2 - 50 * s, y + bob, 32 * s, '#ffe14a', '#ff8a00'); big('KAOS', W / 2 + 50 * s, y - bob, 32 * s, '#ffe14a', '#ff8a00');
        const cols = ['#e8261c', '#2aa03a', '#2a62e0', '#f0c000']; const t = K.t * 1.5;
        ['6', '4'].forEach((d, n) => { const w = Math.cos(t + n * 0.8); H.save(); H.translate(W / 2 - 12 + n * 26, y + 30 * s); H.scale(0.45 + 0.55 * Math.abs(w), 1); big(d, 0, 0, 30 * s, cols[(n * 2 + (w < 0 ? 1 : 0)) % 4], cols[(n * 2 + 1) % 4], 'center', '#000'); H.restore(); });
      }
      function hud() {
        H.clearRect(0, 0, W, HH);
        if (mode === 'load') { ctr('LOADING...', HH / 2, '#fff', 1); return; }
        if (mode === 'view') return;
        if (mode === 'title') {
          H.fillStyle = 'rgba(0,0,40,.25)'; H.fillRect(0, 0, W, HH); logo(48, 1.2);
          if (((mt / 6) | 0) % 2 === 1) { panel(70, 104, 180, 104); ctr('BEST SCORES', 112, '#ffe14a', 1); table().forEach((r, n) => { txt((n + 1) + '. ' + r.n, 84, 126 + n * 10, r.mate ? '#fff' : '#9affa0'); F.draw(H, String(r.s).padStart(6, ' '), 196, 126 + n * 10, '#ffe14a', 1, '#000'); }); }
          else if (blink(2)) ctr('PRESS ' + key('start'), 150, '#fff', 2, '#1a0a5a');
          if (msgT > 0) ctr(msg, 186, '#9affa0', 1);
          ctr('(C) 1999 BIGWHEEL SOFTWARE', HH - 22, '#ddd', 1); ctr('LICENSED BY ULTRA ENTERTAINMENT', HH - 12, '#aab', 1);
          return;
        }
        if (mode === 'demo') { raceHud(true); ctr('DEMO PLAY', 54, '#ffe14a', 2, '#000'); if (blink(2)) ctr('PRESS ' + key('start'), HH - 40, '#fff', 1); return; }
        if (mode === 'main') {
          H.fillStyle = 'rgba(0,0,40,.25)'; H.fillRect(0, 0, W, HH); logo(32, 0.85);
          panel(90, 74, 140, MAIN.length * 15 + 14);
          MAIN.forEach((s, n) => { const on = n === sel.main; ctr((on ? '> ' : '') + s + (on ? ' <' : ''), 82 + n * 15, on ? '#ffe14a' : '#fff', 1); });
          const tip = ['FOUR TRACKS, POINTS, A TROPHY', 'ONE RACE ON ANY TRACK', 'YOU, THE CLOCK AND YOUR GHOST', 'POP EVERYONE ELSE\'S BALLOONS', 'BEST SCORES AND TIMES', 'MUSIC, CAMERA, GHOST', 'THE CONTROLS AND THE ITEMS'][sel.main];
          ctr(tip, 196, '#9ad8ff', 1); ctr('ARROWS MOVE   ' + key('a') + ' SELECT   ' + key('b') + ' BACK', HH - 16, '#ccc', 1);
          if (msgT > 0) ctr(msg, 210, '#ff8a6a', 1);
          return;
        }
        if (mode === 'cc') {
          big('CHOOSE A CLASS', W / 2, 30, 20, '#ffe14a', '#ff8a00'); panel(80, 54, 160, 104);
          CLASSES.forEach((c, n) => { const on = n === sel.cc, open = ccOpen(n); ctr((on ? '> ' : '') + (open ? c.n : c.n + ' (LOCKED)') + (on ? ' <' : ''), 66 + n * 22, on ? '#ffe14a' : open ? '#fff' : '#a0a0b0', on && open ? 2 : 1); });
          ctr(['GENTLE: GOOD FOR LEARNING', 'THE PROPER SPEED', 'FLAT-OUT MAYHEM', 'EVERY TRACK BACK TO FRONT!'][sel.cc], 172, '#9ad8ff', 1);
          if (!ccOpen(sel.cc)) ctr(sel.cc === 2 ? 'WIN A GOLD CUP ON 100CC TO OPEN IT' : 'WIN GOLD IN BOTH CUPS ON 150CC', 186, '#ff8a6a', 1);
          if (msgT > 0) ctr(msg, 204, '#ff8a6a', 1);
          ctr('ARROWS MOVE   ' + key('a') + ' SELECT   ' + key('b') + ' BACK', HH - 14, '#ccc', 1);
          return;
        }
        if (mode === 'driver') {
          big('PLAYER SELECT', W / 2, 18, 18, '#ffe14a', '#ff8a00');
          const D = DRIVERS[sel.drv]; panel(8, 34, 118, 120, 'rgba(10,20,80,.7)');
          txt(D.n, 16, 42, '#ffe14a', 2); printLines(D.tag,16,62,104,'#9ad8ff');
          [['SPEED', D.spd], ['ACCEL', D.acc], ['HANDLING', D.hnd], ['WEIGHT', D.wt]].forEach(([l, v], n) => { txt(l, 16, 88 + n * 15, '#fff', 1); for (let p = 0; p < 5; p++) { H.fillStyle = p < v ? ['#3aff5a', '#ffe14a', '#2ab0ff', '#ff8a3a'][n] : 'rgba(255,255,255,.2)'; H.fillRect(16 + p * 9, 97 + n * 15, 7, 4); } });
          DRIVERS.forEach((d, n) => { const x = 16 + (n % 4) * 72, y = 164 + (n / 4 | 0) * 30; portrait(n, x, y, 20, n === sel.drv); txt(d.n, x + 23, y + 7, n === sel.drv ? '#ffe14a' : '#fff', 1); });
          ctr(key('a') + ' OK   ' + key('b') + ' BACK', HH - 10, '#ccc', 1);
          return;
        }
        if (mode === 'cup') {
          H.fillStyle = 'rgba(0,0,40,.35)'; H.fillRect(0, 0, W, HH); big('CHOOSE A CUP', W / 2, 26, 20, '#ffe14a', '#ff8a00'); ctr(CLASSES[cfg.cc].n, 44, '#9ad8ff', 1);
          CUPS.forEach((c, n) => { const x = 14 + n * 152, on = sel.cup === n, open = n === 0 || starOpen(); panel(x, 58, 140, 130, on ? 'rgba(40,40,120,.85)' : 'rgba(10,20,60,.7)', on ? '#ffe14a' : '#5a6aa8');
            F.center(H, c.n, x + 70, 68, open ? c.col : '#777', 1, '#000');
            const tr = cupDone(cfg.cc, n); if (tr) F.center(H, ['', 'GOLD', 'SILVER', 'BRONZE'][tr] + ' TROPHY', x + 70, 80, ['', '#ffd040', '#e0e0f0', '#e0904a'][tr], 1, '#000');
            if (!open) { F.center(H, 'LOCKED', x + 70, 110, '#ff8a6a', 2, '#000'); F.center(H, 'GET A TROPHY IN', x + 70, 134, '#ccc', 1, '#000'); F.center(H, 'THE BISCUIT CUP', x + 70, 144, '#ccc', 1, '#000'); }
            else c.t.forEach((ti, k) => F.draw(H, (k + 1) + ' ' + TRACKS[ti].n, x + 10, 98 + k * 20, on ? '#fff' : '#aab', 1, '#000')); });
          if (msgT > 0) ctr(msg, 198, '#ff8a6a', 1); ctr(key('a') + ' OK   ' + key('b') + ' BACK', HH - 14, '#ccc', 1);
          return;
        }
        if (mode === 'track') {
          H.fillStyle = 'rgba(0,0,40,.3)'; H.fillRect(0, 0, W, HH); big(flow === 'tt' ? 'TIME TRIALS' : 'VS RACE', W / 2, 20, 18, '#ffe14a', '#ff8a00');
          panel(16, 36, 288, 150);
          TRACKS.forEach((t, n) => { const on = n === sel.trk, open = trackOpen(n); const y = 44 + n * 17; if (on) { H.fillStyle = 'rgba(255,225,74,.18)'; H.fillRect(20, y - 3, 280, 14); }
            txt((on ? '>' : ' ') + (open ? t.n : '?????'), 24, y, !open ? '#777' : on ? '#ffe14a' : '#fff', 1); if (open) { const b = flow === 'tt' ? sv.tt[n] : sv.lap[n]; F.draw(H, (flow === 'tt' ? '' : 'LAP ') + fmt(b), 210, y, '#9ad8ff', 1, '#000'); } });
          if (flow === 'tt') ctr("DAVE'S STAFF TIME: " + fmt(TRACKS[sel.trk].par), 192, '#ffb0e0', 1); if (msgT > 0) ctr(msg, 204, '#ff8a6a', 1);
          ctr(key('a') + ' OK   ' + key('b') + ' BACK', HH - 14, '#ccc', 1);
          return;
        }
        if (mode === 'arena') { H.fillStyle = 'rgba(0,0,40,.3)'; H.fillRect(0, 0, W, HH); big('BATTLE', W / 2, 30, 22, '#ffe14a', '#ff8a00'); panel(70, 60, 180, 70); ARENAS.forEach((a, n) => ctr((n === sel.arena ? '> ' : '') + a.n + (n === sel.arena ? ' <' : ''), 74 + n * 22, n === sel.arena ? '#ffe14a' : '#fff', n === sel.arena ? 2 : 1)); ['THREE BALLOONS EACH. GET HIT, LOSE ONE.', 'LAST KART WITH A BALLOON WINS!', 'DRIVE THROUGH ? BOXES FOR ITEMS.'].forEach((l, n) => ctr(l, 148 + n * 12, '#9ad8ff', 1)); return; }
        if (mode === 'options') {
          H.fillStyle = 'rgba(0,0,40,.4)'; H.fillRect(0, 0, W, HH); big('OPTIONS', W / 2, 30, 22, '#ffe14a', '#ff8a00'); panel(60, 56, 200, 116);
          [['MUSIC', sv.opt.mus ? 'ON' : 'OFF'], ['CAMERA', sv.opt.cam ? 'FAR' : 'NEAR'], ['GHOST', sv.opt.ghost ? 'ON' : 'OFF'], ['AUTO GO', sv.opt.auto ? 'ON' : 'OFF'], ['DONE', '']].forEach(([a, b], n) => { const on = n === sel.opt; txt((on ? '> ' : '  ') + a, 76, 68 + n * 20, on ? '#ffe14a' : '#fff', 1); if (b) txt(b, 196, 68 + n * 20, '#9affa0', 1); });
          if (sel.opt === 3) ctr('THE KART GOES BY ITSELF: HOLD ' + key('b') + ' TO BRAKE', 180, '#9ad8ff', 1); else ctr('GLOBAL AUDIO: ESC GAME MENU', 180, '#9ad8ff', 1);
          if (!window.Sound?.musicOn) ctr('MUSIC MUTED IN THE ESC GAME MENU', 196, '#ffb0a0', 1);
          ctr('ARROWS CHANGE   ' + key('a') + ' SELECT   ' + key('b') + ' BACK', HH - 14, '#ccc', 1); return;
        }
        if (mode === 'records') {
          H.fillStyle = 'rgba(0,0,40,.5)'; H.fillRect(0, 0, W, HH);
          if (sel.rec === 0) { big('BEST SCORES', W / 2, 24, 20, '#ffe14a', '#ff8a00'); panel(60, 42, 200, 108); table().forEach((r, n) => { txt((n + 1) + '. ' + r.n, 74, 52 + n * 12, r.mate ? '#fff' : '#9affa0'); F.draw(H, String(r.s).padStart(6, ' '), 200, 52 + n * 12, '#ffe14a', 1, '#000'); });
            const tro = []; for (let cc = 0; cc < 4; cc++) for (let c = 0; c < 2; c++) { const v = cupDone(cc, c); if (v) tro.push(CLASSES[cc].n + ' ' + (c ? 'STAR' : 'BISCUIT') + ': ' + ['', 'GOLD', 'SILVER', 'BRONZE'][v]); }
            ctr('TROPHIES', 158, '#ffe14a', 1); (tro.length ? tro : ['NONE YET!']).slice(0, 4).forEach((s, n) => ctr(s, 170 + n * 10, '#fff', 1)); }
          else { big('BEST TIMES', W / 2, 24, 20, '#ffe14a', '#ff8a00'); panel(20, 42, 280, 160); txt('TRACK', 28, 50, '#9ad8ff'); txt('3 LAPS', 172, 50, '#9ad8ff'); txt('LAP', 244, 50, '#9ad8ff'); TRACKS.forEach((t, n) => { const open = trackOpen(n); txt(open ? t.n : '?????', 28, 64 + n * 16, open ? '#fff' : '#777'); if (open) { F.draw(H, fmt(sv.tt[n]), 172, 64 + n * 16, '#ffe14a', 1, '#000'); F.draw(H, fmt(sv.lap[n]), 244, 64 + n * 16, '#9affa0', 1, '#000'); } }); }
          ctr('< > PAGE   ' + key('b') + ' BACK', HH - 14, '#ccc', 1); return;
        }
        if (mode === 'how') {
          H.fillStyle = 'rgba(0,0,30,.72)'; H.fillRect(0, 0, W, HH);
          if (sel.how === 0) { big('HOW TO PLAY', W / 2, 20, 18, '#ffe14a', '#ff8a00');
            [['STEER', 'ARROWS / STICK'], ['GO', key('a') + ' (HOLD IT)'], ['BRAKE / BACK', key('b')], ['USE ITEM', key('c')], ['HOP + DRIFT', 'HOLD ' + key('r') + ' WHILE TURNING'], ['PAUSE', key('start')]].forEach(([a, b], n) => { txt(a, 22, 42 + n * 16, '#ffe14a'); txt(b, 110, 42 + n * 16, '#fff'); });
            ctr('UP / DOWN: AIM ITEMS AHEAD / BEHIND',136,'#fff',1);
            ['DRIFT ROUND BENDS: THE SPARKS GO BLUE,', 'THEN ORANGE. LET GO OF ' + key('r'), 'FOR A MINI-TURBO!', 'PRESS GO JUST AS THE LAST LIGHT COMES ON', 'FOR A ROCKET START.'].forEach((l, n) => ctr(l, 146 + n * 11, '#9ad8ff', 1)); }
          else if (sel.how === 1) { big('ITEMS', W / 2, 18, 18, '#ffe14a', '#ff8a00'); ITEMS.forEach((it, n) => { const x = n < 5 ? 10 : 164, y = 34 + (n % 5) * 36; H.drawImage(ICON[it], x, y, 24, 24); txt(it === 'TRIPLE' ? 'TRIPLE TURBO' : it === 'BOMB' ? 'SKY BOMB' : it === 'STAR' ? 'SUPERSTAR' : it, x + 28, y + 3, '#ffe14a'); printLines(ITEM_INFO[it],x+28,y+14,118,'#fff'); }); }
          else { big('TIPS', W / 2, 20, 18, '#ffe14a', '#ff8a00'); ['ORANGE ARROWS ON THE ROAD = A FREE BOOST.', 'GRASS, SAND AND MUD SLOW YOU DOWN.', 'THE FURTHER BACK YOU ARE, THE BETTER', 'THE ITEMS YOU GET FROM ? BOXES.', 'FALL OFF AND THE DRONE FISHES YOU OUT.', 'SOME TRACKS HAVE A SHORT CUT...', '', 'GRAND PRIX: POINTS FOR EVERY PLACE.', 'TOP THREE AFTER FOUR RACES = A TROPHY.', 'WIN CUPS TO UNLOCK MORE!', 'TIME TRIALS: THREE TURBOS, NO ? BOXES.'].forEach((l, n) => ctr(l, 40 + n * 15, n > 6 ? '#9affa0' : '#fff', 1)); }
          ctr('< ' + (sel.how + 1) + '/3 >    ' + key('b') + ' BACK', HH - 14, '#ccc', 1); return;
        }
        if (mode === 'podium') {
          big(CUPS[gp.cup].n, W / 2, 20, 18, CUPS[gp.cup].col, '#ff8a00'); ctr(CLASSES[gp.cc].n + ' RESULTS', 36, '#fff', 1);
          if (mt > 2) { const p = gp.place; big(p < 3 ? ['GOLD CUP!', 'SILVER CUP!', 'BRONZE CUP!'][p] : 'BETTER LUCK NEXT TIME!', W / 2, HH - 54, p < 3 ? 22 : 14, p === 0 ? '#fff8a0' : '#ffffff', p === 0 ? '#e8a000' : '#9aa0b0'); gp.msgs.forEach((m, n) => { if (blink(2)) ctr(m, HH - 36 + n * 10, '#9affa0', 1); }); }
          if (mt > 4 && blink(2)) ctr('PRESS ' + key('a'), HH - 12, '#fff', 1);
          return;
        }
        raceHud(false);
      }
      function raceHud(demo) {
        const battle = cfg.kind === 'battle';
        if (mode === 'intro') { panel(30, HH - 70, 260, 52, 'rgba(10,20,80,.8)'); ctr(cfg.kind === 'gp' ? CUPS[gp.cup].n + '  RACE ' + (gp.race + 1) + '/4' : cfg.kind === 'tt' ? 'TIME TRIALS' : 'VS RACE', HH - 62, '#9ad8ff', 1); big(TRACKS[cfg.track].n, W / 2, HH - 40, 18, '#ffe14a', '#ff8a00'); ctr(CLASSES[cfg.cc].n, HH - 28, '#fff', 1); if(cfg.kind==='tt')ctr('THREE TURBOS. MAKE THEM COUNT!',HH-10,'#9ad8ff',1); return; }
        if (me.ink > 0 && !demo) { H.fillStyle = `rgba(10,10,30,${Math.min(0.62, me.ink / 2)})`; for (const [x, y, r] of [[60, 80, 40], [200, 120, 55], [260, 60, 30], [120, 170, 35], [30, 190, 25]]) { H.beginPath(); for (let a = 0; a < 16; a++) { const rr = r * (a % 2 ? 0.75 : 1); H.lineTo(x + Math.cos(a / 16 * TAU) * rr, y + Math.sin(a / 16 * TAU) * rr); } H.fill(); } }
        if (me.boost > 0 && mode === 'race' && !demo) {
          H.strokeStyle = 'rgba(255,240,160,.45)'; H.lineWidth = 1;
          for (let n=0;n<12;n++) { const a=n/12*TAU, phase=((paused?pauseFrame:K.frame)%12)/12;
            H.beginPath(); H.moveTo(W/2+Math.cos(a)*(118+phase*12),HH/2+Math.sin(a)*(86+phase*10));
            H.lineTo(W/2+Math.cos(a)*174,HH/2+Math.sin(a)*128); H.stroke(); }
        }
        if (flash > 0) { H.fillStyle = `rgba(255,255,255,${flash})`; H.fillRect(0, 0, W, HH); }
        if (!battle) {
          // lap and time
          txt('LAP', 8, 8, '#ffe14a', 1); big(clamp(me.lap || 1, 1, 3) + '/3', 30, 30, 18, '#ffffff', '#9ad8ff', 'left');
          txt(fmt(me.done ? me.ft : raceT), 8, 44, '#fff', 1); if (me.bestLap && !demo) txt('BEST ' + fmt(me.bestLap), 8, 54, '#9ad8ff', 1);
          if (cfg.kind === 'tt' && !demo) { if (ghost) txt('GHOST', 8, 64, '#c8b0ff'); txt('DAVE ' + fmt(TRACKS[cfg.track].par), 8, 74, '#ffb0e0'); }
          if (cfg.kind !== 'tt') { // the order down the side
            rank().forEach((k, n) => { const y = 64 + n * 15; portrait(k.d, W - 20, y, 13, k === me); if (k === me && !demo) txt(String(n + 1), W - 30, y + 3, '#ffe14a', 1); });
            if (!demo) placeBadge(me.place);
            if (cfg.kind === 'gp' && mode !== 'results' && mode !== 'standings') txt('RACE ' + (gp.race + 1) + '/4', W - 54, 6, '#9ad8ff', 1);
          }
        } else {
          txt('BALLOONS', 8, 8, '#ffe14a'); karts.forEach((k, n) => { const y = 20 + n * 14; portrait(k.d, 8, y, 12, k === me); for (let b = 0; b < 3; b++) { H.fillStyle = b < k.balloons ? hexs(k.D.col) : 'rgba(255,255,255,.15)'; H.beginPath(); H.ellipse(28 + b * 10, y + 6, 4, 5, 0, 0, TAU); H.fill(); } if (k.out) txt('OUT', 26, y + 3, '#ff5a5a'); });
          const left = Math.max(0, 150 - bT); txt(`${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`, W - 40, 8, left < 20 ? '#ff5a5a' : '#fff', 1);
        }
        if (!demo) itemSlot();
        minimap();
        if (!demo && !battle) { const sp = Math.max(0, Math.round(Math.abs(me.v) * 2.4)); txt(String(sp).padStart(3, ' ') + ' KM/H', 84, HH - 14, me.boost > 0 ? '#ff8a00' : '#fff', 1); }
        if (mode === 'count') { lights(count); const c = Math.ceil(count); if (c <= 3 && c >= 1) big(String(c), W / 2, 104, 44, c === 1 ? '#ffe14a' : '#ffffff', c === 1 ? '#ff8a00' : '#9ad8ff'); }
        else if (mode === 'race' && raceT < 1.2 && !demo) { lights(0); big('GO!', W / 2, 104, 48, '#9affa0', '#2ab04a'); }
        if (mode === 'race' && me.wrong > 1 && !demo && blink(3)) big('WRONG WAY!', W / 2, 92, 20, '#ff8a6a', '#e8261c');
        if (msgT > 0 && msg && !demo) big(msg, W / 2, 146, msg.length > 14 ? 14 : 20, '#ffffff', '#ffe14a');
        if (me.drift && !demo && !paused) {
          const c = me.dl === 2 ? '#ff9a1a' : '#5ab8ff';
          txt(me.dl ? 'RELEASE '+key('r')+'!' : 'DRIFT', 106, HH-38, c);
          H.fillStyle = '#181832'; H.fillRect(106,HH-27,108,6);
          H.fillStyle = c; H.fillRect(107,HH-26,106*clamp(me.dc/1.45,0,1),4);
          H.fillStyle = '#fff'; H.fillRect(154,HH-27,1,6);
        }
        if (mode === 'finish' && !battle && finT > 0.5 && !demo) big('FINISH!', W / 2, 70, 30, '#ffffff', '#ffe14a');
        if (mode === 'results') resultsBoard();
        if (mode === 'standings') standingsBoard();
        if (mode === 'ttres') ttBoard();
        if (mode === 'bres') battleBoard();
        if (paused) { H.fillStyle = 'rgba(0,0,30,.6)'; H.fillRect(0, 0, W, HH); big('PAUSE', W / 2, 70, 28, '#ffe14a', '#ff8a00'); panel(100, 92, 120, 66); ['CONTINUE', 'RESTART', 'QUIT'].forEach((s, n) => ctr((n === psel ? '> ' : '') + s + (n === psel ? ' <' : ''), 102 + n * 18, n === psel ? '#ffe14a' : '#fff', 1)); }
      }
      function resultsBoard() {
        panel(40, 26, 240, 172, 'rgba(10,20,80,.85)'); big('RESULTS', W / 2, 40, 16, '#ffe14a', '#ff8a00');
        results.rows.forEach((r, n) => { if (results.t < n * 0.15) return; const y = 58 + n * 16; if (r.me) { H.fillStyle = 'rgba(255,225,74,.2)'; H.fillRect(46, y - 3, 228, 14); } txt(ORD[n], 50, y, n === 0 ? '#ffe14a' : '#fff'); portrait(r.d, 80, y - 3, 12, r.me); txt(r.n, 98, y, r.me ? '#ffe14a' : '#fff'); F.draw(H, fmt(r.t), 172, y, '#9ad8ff', 1, '#000'); if (gp) F.draw(H, '+' + r.add, 246, y, '#9affa0', 1, '#000'); });
        if (mt > 1 && blink(2)) ctr('PRESS ' + key('a'), 204, '#fff', 1);
      }
      function standingsBoard() {
        panel(40, 26, 240, 172, 'rgba(10,20,80,.85)'); big('CUP POINTS', W / 2, 40, 16, '#ffe14a', '#ff8a00');
        const st = DRIVERS.map((d, n) => ({ d: n, p: gp.pts[n] || 0 })).sort((a, b) => b.p - a.p);
        st.forEach((r, n) => { const y = 58 + n * 16, mine = r.d === sel.drv; if (mine) { H.fillStyle = 'rgba(255,225,74,.2)'; H.fillRect(46, y - 3, 228, 14); } txt(ORD[n], 50, y, '#fff'); portrait(r.d, 80, y - 3, 12, mine); txt(DRIVERS[r.d].n, 98, y, mine ? '#ffe14a' : '#fff'); const w = Math.min(70, r.p * 1.2); H.fillStyle = hexs(DRIVERS[r.d].col); H.fillRect(174, y, w * Math.min(1, mt * 1.5), 6); F.draw(H, String(r.p), 252, y, '#9affa0', 1, '#000'); });
        if (mt > 1 && blink(2)) ctr(gp.race >= 3 ? 'PRESS ' + key('a') + ' FOR THE PRIZES' : 'PRESS ' + key('a') + ' FOR THE NEXT RACE', 204, '#fff', 1);
      }
      function ttBoard() {
        const r = results; panel(50, 30, 220, 160, 'rgba(10,20,80,.85)'); big(r.rec ? 'NEW RECORD!' : 'TIME TRIAL', W / 2, 46, 18, r.rec ? '#fff8a0' : '#ffe14a', '#ff8a00');
        r.laps.forEach((t, n) => { txt('LAP ' + (n + 1), 70, 66 + n * 13, '#fff'); F.draw(H, fmt(t), 190, 66 + n * 13, t === me.bestLap ? '#9affa0' : '#ffe14a', 1, '#000'); });
        txt('TOTAL', 70, 112, '#fff'); F.draw(H, fmt(r.t), 190, 112, '#ffe14a', 1, '#000');
        txt('YOUR BEST', 70, 128, '#9ad8ff'); F.draw(H, fmt(r.rec ? r.t : r.old), 190, 128, '#9ad8ff', 1, '#000');
        txt('DAVE', 70, 144, '#ffb0e0'); F.draw(H, fmt(r.par), 190, 144, '#ffb0e0', 1, '#000');
        ctr(r.t < r.par ? 'YOU BEAT DAVE\'S STAFF TIME!' : 'BEAT ' + fmt(r.par) + ' TO BEAT DAVE', 164, r.t < r.par ? '#9affa0' : '#fff', 1);
        if (r.rec) ctr('GHOST SAVED', 176, '#c8b0ff', 1);
        if (mt > 1 && blink(2)) ctr('PRESS ' + key('a'), 204, '#fff', 1);
      }
      function battleBoard() {
        const r = results; panel(50, 40, 220, 140, 'rgba(10,20,80,.85)'); big(r.title, W / 2, 56, 18, '#ffe14a', '#ff8a00');
        r.rows.forEach((k, n) => { const y = 76 + n * 18; portrait(k.d, 70, y - 3, 13, k === me); txt(k.n, 90, y, k === me ? '#ffe14a' : '#fff'); txt(k.out ? 'OUT' : k.balloons + ' LEFT', 200, y, k.out ? '#ff8a6a' : '#9affa0'); });
        if (mt > 1 && blink(2)) ctr('PRESS ' + key('a'), 196, '#fff', 1);
      }

      // ---------------------------------------------------------------- off we go
      function init() {
        RK = window.RoomRK;
        kartGeo = DRIVERS.map(d => RK.kart2(T, d.k));
        kartLow = DRIVERS.map(d => RK.kart2(T, Object.assign({},d.k,{low:true})));
        fxN = RK.fx(T3, { n: 350, scale: HH * 0.85, maxPx: 24 }); fxA = RK.fx(T3, { n: 260, add: true, scale: HH * 0.85, maxPx: 10 });
        goTitle();
      }
      if (RK) init(); else kitReady.then(() => { if (mode === 'load') init(); }, () => { mode = 'load'; });
      window.__kartDbg = {
        get st() { return { mode, paused, count, shortcut: shortDone, selection:{...sel}, kind: cfg.kind, cc: cfg.cc, track: cfg.track, raceT, me: me && { x: me.x, z: me.z, y: me.y, v: me.v, lap: me.lap, prog: me.prog, place: me.place, item: me.item, icount: me.icount, roll: me.roll, yaw: me.yaw, lat: me.lat, drift: me.drift, charge: me.dc, turboLevel: me.dl, boost: me.boost, spin: me.spin, inv: me.inv, rescue: me.rescue, rescues: me.rescues, visible: me.mesh.visible, air: me.air, done: me.done, ft: me.ft }, karts: karts.map(k => ({ n: k.n, prog: Math.round(k.prog), place: k.place, done: k.done, lap: k.lap, ft: k.ft, v: Math.round(k.v), b: k.balloons, drift: k.drift, boost: k.boost, item: k.item, roll: k.roll, lat: k.lat, aiMul: k.aiMul, visible: k.mesh.visible, rescue: k.rescue, rescues: k.rescues })), ghost: ghost && { samples: ghost.n, visible: ghostMesh && ghostMesh.visible }, results: results && { title: results.title, rows: results.rows && results.rows.length, laps: results.laps }, gp: gp && { place: gp.place, race: gp.race, pts: gp.pts, total: gp.total }, sv }; },
        race(kind, n, cc) { cfg.cc = cc == null ? 1 : cc; sel.drv = sv.drv; if (kind === 'gp') { cfg.cup = n | 0; newGP(); } else if (kind === 'battle') { cfg.arena = n | 0; startBattle(); } else { cfg.track = n | 0; cfg.kind = kind || 'vs'; gp = null; setupRace(); } },
        go() { if (mode === 'intro') startCount(); count = 0.01; },
        get perf() { const i = T3.ren.info; let objs = 0; T3.scene.traverse(() => objs++); return { calls: i.render.calls, tris: i.render.triangles, pts: i.render.points, geos: i.memory.geometries, texs: i.memory.textures, progs: (i.programs || []).length, objs, fxN: fxN && fxN.pts.geometry.drawRange.count }; },
        get circuit() { return L && { n:L.N,length:L.L,points:L.P.map(p=>[p.x,p.y,p.z]),width:FL.hw[0],shortcut:short && {a:short.a,b:short.b,A:short.A.toArray(),B:short.B.toArray(),w:short.w},boxes:boxes.map(b=>({i:b.i,lat:b.lat,gone:b.gone})) }; },
        // Position fixtures only. Controls, physics, contacts and results still run through normal frames.
        place(f, lat, speed, driver) {
          const k = driver == null ? me : karts.find(k=>k.d===driver); if (!k) return;
          if (cfg.kind === 'battle') { k.x=f; k.z=lat; k.y=0; if (speed != null) k.v=speed; return; }
          const i=L.wrap(Math.floor(f*L.N)),p=L.at(i,lat||0,0);
          k.x=p.x;k.y=p.y;k.z=p.z;k.idx=i;k.safe=i;k.lat=lat||0;k.prog=Math.max(0,k.lap-1)*L.N+i;
          k.yaw=Math.atan2(L.D[i].x,L.D[i].z); k.air=false;k.vy=0;k.vl=0;k.steer=0;k.drift=0;
          if(speed!=null)k.v=speed;
        },
        face(yaw) { if (me) me.yaw = yaw; },
        give(it) { if (me) { me.item = it; me.icount = it === 'TRIPLE' ? 3 : 0; me.roll = 0; } },
        skipLaps(n) { if (me) { me.prog += L.N * (n || 1); } },
        finishGP() { if (gp) { gp.race = 3; } },
        demo() { startDemo(); }, title() { goTitle(); },
        // the model viewer (testing only): view('kart'|'item'|'haz'|'box'|'drone', which, angle, elevation, distance)
        view(what, n, a, e, d) {
          if (viewObj && viewObj.tmp) kartsG.remove(viewObj); buildGarage(); mode = 'view'; showOnly([]); let m;
          if (what === 'kart') { m = meshFor(n | 0); m.geometry=kartGeo[n|0]; } else if (what === 'item') m = itemMesh(n); else if (what === 'haz') { m = new T.Mesh(hazGeo(n), n === 'ghost' ? T3.mat({ vcol: true, transparent: true, opacity: 0.72, lit: false }) : matV); kartsG.add(m); }
          else if (what === 'box') { m = new T.Mesh(boxGeo, boxMat); kartsG.add(m); } else { m = new T.Mesh(kartGeo[0], matV); kartsG.add(m); }
          m.tmp = what !== 'kart'; m.visible = true; m.position.set(0, -300 + (what === 'box' || what === 'item' ? 0.8 : 0), 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1);
          setI(shadows,0,0,-299.94,0,0,1);for(let n=1;n<12;n++)shadows.setMatrixAt(n,ZERO);shadows.instanceMatrix.needsUpdate=true;
          viewObj = m; view3 = [a == null ? 0.6 : a, e == null ? 0.25 : e, d || 7]; return true;
        },
      };
      let last = 0;
      return {
        update(dt) { update(dt); if (mode !== 'load') { if (karts.length && (L || cfg.kind === 'battle') && mode !== 'driver' && mode !== 'podium' && mode !== 'view') placeKarts(); if (!paused) camera(dt); if (fxN && !paused) { fxN.update(dt); fxA.update(dt); } } },
        draw() { if (mode !== 'load') { if(fxN){fxN.pts.visible=fxN.active;fxA.pts.visible=fxA.active;} cullScenery(); T3.render(); } hud(); },
        end() { K.music(null); try { delete window.__kartDbg; delete window.__kartCheatAll; } catch (e) {} },
      };
    },
  });
})();

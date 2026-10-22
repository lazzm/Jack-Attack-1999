/* ANTI-GRAV 3000 (PlayStation, in Jack's room): hover racing at silly speeds to thumping music. All original.
 *   CHAMPIONSHIP: five tracks, eight ships, points for every place, a podium. SINGLE RACE on any open track. TIME TRIAL
 *   with a saved ghost and a track record to beat on every track. Two speed classes: SUB-SONIC, then SUPERSONIC (win the
 *   SUB-SONIC championship), which also opens the bonus track PHANTOM ZONE. Win SUPERSONIC to unlock the NULLPOINT ship.
 *   Four teams (two pilots each) with their own ships and stats: speed, thrust, handling, shield.
 *   Speed pads (orange chevrons), weapon pads (blue squares: BOLTS, SEEKER, MINES, SHIELD, TURBO, QUAKE), airbrakes (L1/R1)
 *   for the tight bits, your shield energy goes down when you hit walls or get shot: drive through the PIT LANE (green, by
 *   the start) to fill it up, or ABSORB a weapon (square) for energy. Run out and you're out of the race.
 *   Big elevation, tunnels, glass tubes under the sea, and gaps to jump (go fast, or fall in). Stick up/down in the air
 *   to dive or float. PS1 look: wobbly vertices, wonky textures (rm-3d), dithered 15-bit textures, neon.
 * Secrets: rm.grav.lap (beat a lap record), rm.grav.champ (win a championship), rm.grav.air (stay in the air 2 seconds).
 * Save (rm.ps.grav, v1): { best (the old Neon Bay best lap, still kept), lap:{i}, tt:{i}, champ:{cls: place}, unl:{sup, bonus, nullp},
 *   opt:{mus, cam}, team, hi:[{n, s}], races }. Ghosts: localStorage jhp_rmgrav_gh<i>. Test hooks: window.__rmAuto, window.__gravDbg. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const kitReady = window.RoomRK ? Promise.resolve() : (window.Apps && Apps.load ? Apps.load('js/rm-g-racekit.js') : Promise.reject(new Error('no loader')));
  kitReady.catch(() => {});
  const SECRETS = [['rm.grav.champ', 'Champion of the Galaxy', 'Win an ANTI-GRAV 3000 championship.'], ['rm.grav.air', 'Hang Time', 'Stay off the ground for a long time in ANTI-GRAV 3000.']];
  try { for (const [id, n, h] of SECRETS) if (window.Apps && Apps.defineSecret && !(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, h); } catch (e) {}
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const wrapA = a => { if (!isFinite(a)) return 0; while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  const fmt = t => { if (!(t > 0) || t > 5999) return '-:--.--'; return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${String(Math.floor(t * 100) % 100).padStart(2, '0')}`; };
  const hexs = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
  const ORD = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH'];
  const PTS = [9, 7, 5, 4, 3, 2, 1, 0];
  const BASE = [3200, 2600, 2100, 1700, 1400, 1100, 900, 700];

  // ================================================================ teams (two pilots each) and their ships: stats 1..5
  const TEAMS = [
    { n: 'VELOCE', col: 0xe8261c, trim: 0xffe14a, glow: 0xffb040, kind: 0, spd: 3, thr: 3, hnd: 3, shd: 3, pilots: ['NOVA', 'RAZOR'], tag: 'ITALIAN SPEED, ALL ROUND' },
    { n: 'KAITO', col: 0xf4f4f8, trim: 0x2a5ae0, glow: 0x6ad8ff, kind: 1, spd: 2, thr: 4, hnd: 5, shd: 2, pilots: ['KIRA', 'ZEPHYR'], tag: 'TWIN HULLS, TURNS ON A YEN' },
    { n: 'OBERON', col: 0x6a2ab0, trim: 0xe8c21a, glow: 0xff5aff, kind: 2, spd: 5, thr: 2, hnd: 2, shd: 5, pilots: ['VORTEX', 'TITAN'], tag: 'HEAVY. FAST. HARD TO STOP.' },
    { n: 'SOLSTICE', col: 0x2ac86a, trim: 0xff8a1a, glow: 0x9aff6a, kind: 3, spd: 4, thr: 5, hnd: 3, shd: 1, pilots: ['PULSE', 'QUASAR'], tag: 'OFF THE LINE LIKE A ROCKET' },
    { n: 'NULLPOINT', col: 0x50505e, trim: 0xe8c21a, glow: 0xffe14a, kind: 4, spd: 5, thr: 4, hnd: 4, shd: 3, pilots: ['NULL', 'VOID'], tag: 'THE SECRET PROTOTYPE', locked: 1 },
  ];
  const CLASSES = [{ n: 'SUB-ZIP', top: 50, ai: 0.95, mult: 1 }, { n: 'SUPERSONIC', top: 62, ai: 1.0, mult: 1.2 }];

  // ================================================================ the tracks: [x, z, height, width, bank]
  const TRACKS = [
    { n: 'NEON BAY', th: 'neon', rec: 34.5, by: 'T.BOLT',
      pts: [[0, 0, 0, 16, 0], [150, -10, 0, 16, 0], [260, 30, 6, 16, -18], [300, 140, 14, 15, -20], [240, 240, 24, 15, -14], [120, 260, 28, 16, 0], [40, 210, 20, 15, 16], [-20, 130, 6, 15, 18], [-110, 140, 2, 15, 0], [-200, 210, 10, 15, -18], [-300, 170, 16, 16, -20], [-310, 60, 10, 16, -12], [-230, -20, 2, 16, 0], [-120, -30, 0, 16, 8]],
      pads: [[0.06, 0], [0.2, -3], [0.33, 4], [0.52, 0], [0.62, -4], [0.78, 3]], wpads: [[0.12, 4], [0.12, -4], [0.55, 0], [0.55, 5], [0.84, -3], [0.84, 3]], tunnel: [[0.36, 0.42]], kick: [[0.445, 14, 2.4]], gap: [[0.46, 0.474]] },
    { n: 'FROSTLINE', th: 'frost', rec: 33.0, by: 'K.HOLT',
      pts: [[0, 0, 0, 16, 0], [160, 0, 4, 16, 0], [260, 60, 12, 16, -15], [280, 180, 24, 15, -18], [200, 260, 30, 15, 0], [80, 240, 26, 15, 15], [0, 280, 20, 16, 0], [-120, 300, 14, 16, -10], [-240, 240, 22, 15, -18], [-280, 120, 30, 15, -12], [-220, 20, 18, 16, 0], [-120, -40, 4, 16, 10]],
      pads: [[0.05, 0], [0.22, 3], [0.45, -3], [0.6, 0], [0.86, 3]], wpads: [[0.15, -4], [0.15, 4], [0.52, 0], [0.68, -4], [0.68, 4]], tunnel: [[0.72, 0.8]], kick: [[0.338, 14, 2.4]], gap: [[0.355, 0.368]] },
    { n: 'RUST VALLEY', th: 'rust', rec: 38.0, by: 'M.CRUZ',
      pts: [[0, 0, 10, 17, 0], [200, 0, 14, 17, 0], [320, 60, 20, 16, -14], [340, 200, 16, 16, -18], [260, 300, 8, 16, 0], [120, 300, 20, 16, 0], [0, 250, 8, 16, 14], [-80, 320, 14, 16, 18], [-200, 300, 6, 16, 0], [-300, 200, 10, 16, -16], [-280, 60, 18, 16, -12], [-160, -20, 14, 17, 0]],
      pads: [[0.04, 0], [0.18, -3], [0.4, 3], [0.55, 0], [0.75, -3], [0.88, 0]], wpads: [[0.1, -4], [0.1, 4], [0.36, 0], [0.62, -4], [0.62, 4], [0.82, 0]], tunnel: [[0.22, 0.27]], kick: [[0.432, 14, 2.6], [0.83, 14, 2.6]], gap: [[0.448, 0.464], [0.846, 0.86]], trench: 1 },
    { n: 'HELIX TOWERS', th: 'helix', rec: 36.5, by: 'J.VANCE',
      pts: [[0, -100, 0, 16, 0], [150, -110, 2, 16, 0], [230, -60, 6, 15, -12], [260, 10, 10, 15, -15], [220, 70, 14, 15, -15], [150, 60, 18, 15, -15], [130, 0, 22, 15, -15], [170, -50, 26, 15, -15], [240, -30, 30, 15, -15], [250, 40, 34, 15, -15], [190, 90, 38, 15, -10], [80, 110, 30, 16, 0], [-20, 90, 16, 16, 0], [-120, 120, 6, 16, 10], [-220, 60, 4, 16, 14], [-240, -40, 8, 16, 10], [-160, -110, 4, 16, 0]],
      pads: [[0.05, 0], [0.18, 3], [0.33, -3], [0.47, 0], [0.62, 0], [0.8, -3]], wpads: [[0.1, -4], [0.1, 4], [0.4, 0], [0.7, -4], [0.7, 4]], tunnel: [[0.88, 0.94]], kick: [[0.518, 14, 2.4]], gap: [[0.534, 0.548]], tower: 1 },
    { n: 'AQUA DOME', th: 'aqua', rec: 31.5, by: 'S.REEF',
      pts: [[0, 0, -10, 16, 0], [150, -20, -14, 16, 0], [260, 40, -22, 16, -14], [250, 160, -30, 16, -16], [150, 220, -26, 16, 0], [40, 180, -18, 16, 14], [-40, 240, -24, 16, 12], [-160, 230, -34, 16, 0], [-250, 150, -28, 16, -14], [-230, 40, -20, 16, -12], [-140, -20, -12, 16, 0]],
      pads: [[0.04, 0], [0.2, 3], [0.36, -3], [0.5, 0], [0.66, 3], [0.82, -3]], wpads: [[0.1, -4], [0.1, 4], [0.44, 0], [0.58, -4], [0.58, 4], [0.74, 0]], tube: [[0.08, 0.3], [0.42, 0.62], [0.72, 0.88]] },
    { n: 'PHANTOM ZONE', th: 'phantom', rec: 32.0, by: '???', bonus: 1,
      pts: [[0, 0, 40, 18, 0], [200, 30, 50, 18, -10], [300, 160, 30, 18, -20], [200, 280, 10, 18, 0], [0, 240, 30, 18, 15], [-120, 320, 50, 18, 0], [-260, 220, 30, 18, -20], [-240, 60, 10, 18, -10], [-120, -30, 20, 18, 0]],
      pads: [[0.05, 0], [0.15, -3], [0.15, 3], [0.32, 0], [0.5, -3], [0.5, 3], [0.7, 0], [0.86, 0]], wpads: [[0.1, 0], [0.42, -4], [0.42, 4], [0.76, 0]], tunnel: [[0.4, 0.47]], kick: [[0.185, 14, 2.6], [0.585, 14, 2.6]], gap: [[0.2, 0.214], [0.6, 0.614]] },
  ];
  const CHAMP = [0, 1, 2, 3, 4]; // the championship tracks
  const THEMES = {
    neon: { sky: [[0, '#05020f'], [0.6, '#2a0a4a'], [1, '#c02a8a']], fog: 0x1a0830, fogN: 60, fogF: 320, amb: 0.6, sun: 0.55, skyL: 0xc8b8ff, gndL: 0x302040, track: ['#4a4a5e', '#3a3a4c', '#5a5a70'], edge: '#ff2a8a', edge2: '#ffd0f0', wall: 0x3a8aff, pano: 'city', gnd: 'grid', gy: -30, song: 0, props: 'city' },
    frost: { sky: [[0, '#1a2a5a'], [0.6, '#5a7ab0'], [1, '#d8e4f4']], fog: 0xb8c8e0, fogN: 70, fogF: 330, amb: 0.7, sun: 0.75, skyL: 0xe8f0ff, gndL: 0x6a7a9a, track: ['#c8d0e0', '#a8b4c8', '#dce4f0'], edge: '#2ae0ff', edge2: '#e0ffff', wall: 0x8ad8ff, pano: 'aurora', gnd: 'snow', gy: -8, song: 1, props: 'frost' },
    rust: { sky: [[0, '#4a1a3a'], [0.5, '#e85a2a'], [1, '#ffd08a']], fog: 0xe0905a, fogN: 80, fogF: 360, amb: 0.65, sun: 0.95, skyL: 0xffe0b0, gndL: 0x8a3a1a, sunCol: 0xffd0a0, track: ['#8a5a3a', '#6a4028', '#a06a48'], edge: '#ffd02a', edge2: '#fff8c0', wall: 0xffb040, pano: 'sunset', gnd: 'desert', gy: 0, song: 2, props: 'rust' },
    helix: { sky: [[0, '#1a6ad8'], [0.6, '#7ac8f0'], [1, '#e0f4ff']], fog: 0xa8d8f0, fogN: 90, fogF: 380, amb: 0.7, sun: 0.9, skyL: 0xffffff, gndL: 0x5a6a7a, track: ['#e0e4ec', '#c8ccd8', '#f0f2f8'], edge: '#ff7a1a', edge2: '#fff0d0', wall: 0x5ad0ff, pano: 'skyline', gnd: 'city', gy: -2, song: 3, props: 'helix' },
    aqua: { sky: [[0, '#02121a'], [0.6, '#0a3a4a'], [1, '#1a6a6a']], fog: 0x0a3a44, fogN: 30, fogF: 200, amb: 0.6, sun: 0.6, skyL: 0x8affe8, gndL: 0x0a2a2a, sunCol: 0xa0fff0, track: ['#3a5a6a', '#2a4858', '#4a6e7e'], edge: '#3affa0', edge2: '#e0fff0', wall: 0x3affd0, pano: 'deep', gnd: 'seabed', gy: -46, song: 4, props: 'aqua' },
    phantom: { sky: [[0, '#000000'], [0.7, '#0a0010'], [1, '#2a0a1a']], fog: 0x000000, fogN: 80, fogF: 360, amb: 0.5, sun: 0.5, skyL: 0xffffff, gndL: 0x200010, track: ['#101014', '#08080a', '#18181e'], edge: '#ff2a2a', edge2: '#ffffff', wall: 0xff2a2a, pano: 'void', gnd: 'wire', gy: -10, song: 5, props: 'phantom', wire: 1 },
  };

  // ================================================================ music: thumping made-up techno (16th steps; 'o' kick, 'x' hat)
  const SONGS = [
    { bpm: 140, wave: 'sawtooth', vol: 0.04, bassWave: 'square', drums: 'o.x.o.x.o.x.o.xx', // 0 neon
      lead: [69, 0, 76, 0, 81, 0, 76, 0, 69, 0, 76, 0, 81, 79, 76, 0, 67, 0, 74, 0, 79, 0, 74, 0, 67, 0, 74, 0, 79, 81, 79, 74, 65, 0, 72, 0, 77, 0, 72, 0, 65, 0, 72, 0, 77, 79, 77, 72, 64, 0, 71, 0, 76, 0, 71, 0, 76, 0, 79, 0, 83, 0, 81, 0],
      bass: [33, 45, 33, 45, 33, 45, 33, 45, 31, 43, 31, 43, 31, 43, 31, 43, 29, 41, 29, 41, 29, 41, 29, 41, 28, 40, 28, 40, 28, 40, 31, 43] },
    { bpm: 136, wave: 'square', vol: 0.035, bassWave: 'sawtooth', drums: 'o.x.o.xxo.x.o.x.', // 1 frost: icy arps
      lead: [74, 78, 81, 86, 81, 78, 74, 78, 73, 76, 81, 85, 81, 76, 73, 76, 71, 74, 78, 83, 78, 74, 71, 74, 69, 73, 76, 81, 76, 73, 69, 73],
      bass: [38, 0, 38, 50, 38, 0, 38, 50, 45, 0, 45, 57, 45, 0, 45, 57, 35, 0, 35, 47, 35, 0, 35, 47, 33, 0, 33, 45, 33, 0, 33, 45] },
    { bpm: 144, wave: 'sawtooth', vol: 0.035, bassWave: 'sawtooth', drums: 'o.xoo.x.o.xoo.xx', // 2 rust: a gritty stomp
      lead: [64, 0, 0, 64, 67, 0, 64, 0, 69, 0, 67, 0, 64, -1, 0, 0, 62, 0, 0, 62, 64, 0, 62, 0, 67, 0, 64, 0, 62, -1, 0, 0],
      bass: [28, 28, 40, 28, 28, 40, 28, 31, 28, 28, 40, 28, 33, 31, 28, 26] },
    { bpm: 150, wave: 'square', vol: 0.035, bassWave: 'square', drums: 'o.x.o.x.o.x.oxxx', // 3 helix: bright and bouncy
      lead: [76, 0, 79, 0, 83, 0, 79, 81, 0, 79, 76, 0, 74, 0, 76, 0, 77, 0, 81, 0, 84, 0, 81, 83, 0, 81, 77, 0, 76, 0, 74, 0],
      bass: [40, 52, 40, 52, 40, 52, 40, 52, 41, 53, 41, 53, 43, 55, 43, 55] },
    { bpm: 128, wave: 'triangle', vol: 0.06, bassWave: 'sawtooth', drums: 'o...x.o.o...x..x', // 4 aqua: deep and dubby
      lead: [69, -1, 0, 72, 0, 76, -1, 0, 74, 0, 72, -1, 69, -1, 0, 0, 67, -1, 0, 71, 0, 74, -1, 0, 72, 0, 71, -1, 67, -1, 0, 0],
      bass: [33, 0, 0, 33, 0, 0, 45, 0, 31, 0, 0, 31, 0, 0, 43, 0] },
    { bpm: 160, wave: 'sawtooth', vol: 0.035, bassWave: 'square', drums: 'o.xxo.x.o.xxo.xo', // 5 phantom: flat out
      lead: [81, 0, 81, 84, 0, 81, 79, 0, 76, 0, 79, 0, 81, 0, 0, 0, 77, 0, 77, 81, 0, 77, 76, 0, 72, 0, 74, 0, 76, 0, 0, 0],
      bass: [33, 33, 45, 33, 33, 45, 33, 45, 29, 29, 41, 29, 31, 31, 43, 31] },
    { bpm: 124, wave: 'square', vol: 0.04, bassWave: 'sawtooth', drums: 'o...x...o...x.x.', // 6 title / menus
      lead: [69, 0, 0, 0, 72, 0, 76, 0, 0, 0, 74, 0, 72, 0, 0, 0, 67, 0, 0, 0, 71, 0, 74, 0, 0, 0, 72, 0, 71, 0, 0, 0],
      bass: [33, 0, 45, 0, 33, 0, 45, 0, 31, 0, 43, 0, 31, 0, 43, 0] },
  ];

  // ================================================================ textures: painted, then dithered down to 15-bit colour
  let RKd = null;
  function dith(g, w, h) { if (RKd) RKd.dither(g, w, h, 5); }
  function blot(g, w, h, n, col, r0, r1) { for (let i = 0; i < n; i++) { const x = Math.random() * w, y = Math.random() * h, r = r0 + Math.random() * (r1 - r0); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }
  const PAINT = {
    panels: (cols, wire) => (g, w, h) => { g.fillStyle = cols[1]; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, y, x + 16, y + 16); gr.addColorStop(0, cols[2]); gr.addColorStop(1, cols[0]); g.fillStyle = gr; g.fillRect(x + 1, y + 1, 14, 14); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 3, y + 3, 2, 2); g.fillRect(x + 11, y + 11, 2, 2); }
      if (wire) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ff2a2a'; g.lineWidth = 1; for (let k = 0; k <= w; k += 16) { g.beginPath(); g.moveTo(k + 0.5, 0); g.lineTo(k + 0.5, h); g.stroke(); g.beginPath(); g.moveTo(0, k + 0.5); g.lineTo(w, k + 0.5); g.stroke(); } }
      else { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(w / 2 - 1, 0, 2, h / 2); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h); } dith(g, w, h); },
    grid(g, w, h) { g.fillStyle = '#0a0418'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a2ab0'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); g.fillStyle = 'rgba(122,42,176,.3)'; g.fillRect(0, 1, w, 1); g.fillRect(1, 0, 1, h); },
    wire(g, w, h) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff2a2a'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); },
    snow(g, w, h) { g.fillStyle = '#e8eef8'; g.fillRect(0, 0, w, h); blot(g, w, h, 10, 'rgba(150,170,210,.4)', 4, 12); dith(g, w, h); },
    desert(g, w, h) { g.fillStyle = '#c8783a'; g.fillRect(0, 0, w, h); blot(g, w, h, 10, 'rgba(120,50,20,.4)', 4, 12); blot(g, w, h, 6, 'rgba(255,200,130,.35)', 3, 8); dith(g, w, h); },
    city(g, w, h) { g.fillStyle = '#5a6068'; g.fillRect(0, 0, w, h); g.fillStyle = '#6a7078'; g.fillRect(2, 2, w - 4, h - 4); g.fillStyle = '#e8e8e8'; g.fillRect(w / 2 - 1, 4, 2, h / 3); dith(g, w, h); },
    seabed(g, w, h) { g.fillStyle = '#4a6a5a'; g.fillRect(0, 0, w, h); blot(g, w, h, 12, 'rgba(20,40,30,.5)', 4, 12); blot(g, w, h, 6, 'rgba(160,200,150,.3)', 3, 8); dith(g, w, h); },
    windows(g, w, h) { g.fillStyle = '#1a1a2a'; g.fillRect(0, 0, w, h); for (let y = 1; y < h; y += 4) for (let x = 1; x < w; x += 4) { g.fillStyle = Math.random() < 0.55 ? (Math.random() < 0.5 ? '#ffe08a' : '#8ad8ff') : '#2a2a3a'; g.fillRect(x, y, 2, 2); } },
    rock(g, w, h) { g.fillStyle = '#9a5a3a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 6) { g.fillStyle = `rgba(${y % 12 ? '120,60,30' : '200,120,70'},.5)`; g.fillRect(0, y, w, 3); } blot(g, w, h, 8, 'rgba(60,20,10,.4)', 3, 8); dith(g, w, h); },
    chev(g, w, h) { g.fillStyle = '#ff7a00'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffe14a'; for (let y = 0; y < 2; y++) { g.beginPath(); g.moveTo(0, y * 16 + 14); g.lineTo(w / 2, y * 16 + 4); g.lineTo(w, y * 16 + 14); g.lineTo(w, y * 16 + 10); g.lineTo(w / 2, y * 16); g.lineTo(0, y * 16 + 10); g.fill(); } },
    wpad(g, w, h) { g.fillStyle = '#0a1a6a'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a8aff'; g.fillRect(2, 2, w - 4, h - 4); g.fillStyle = '#0a1a6a'; g.fillRect(5, 5, w - 10, h - 10); g.fillStyle = '#8ad8ff'; g.font = 'bold 14px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', w / 2, h / 2 + 1); },
    pit(g, w, h) { g.fillStyle = '#0a3a1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#3aff6a'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h); for (let y = 4; y < h; y += 16) { g.fillStyle = 'rgba(58,255,106,.5)'; g.fillRect(6, y, w - 12, 6); } },
  };
  // the far-off scenery painted round the sky
  const PANO = {
    city(g, w, h, hy) { for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,' + Math.random() * 0.7 + ')'; g.fillRect(Math.random() * w, Math.random() * hy * 0.6, 1, 1); } for (let i = 0; i < 60; i++) { const x = Math.random() * w, bw = 8 + Math.random() * 16, bh = 20 + Math.random() * 60; g.fillStyle = '#0a0418'; g.fillRect(x, hy - bh, bw, bh + 2); for (let y = hy - bh + 3; y < hy; y += 4) for (let xx = x + 2; xx < x + bw - 2; xx += 4) if (Math.random() < 0.4) { g.fillStyle = Math.random() < 0.5 ? '#ff6ac8' : '#6ad8ff'; g.fillRect(xx, y, 1, 1); } } },
    aurora(g, w, h, hy) { for (let k = 0; k < 3; k++) { g.strokeStyle = ['rgba(90,255,180,.25)', 'rgba(120,200,255,.2)', 'rgba(200,120,255,.15)'][k]; g.lineWidth = 10 - k * 2; g.beginPath(); for (let x = 0; x <= w; x += 6) g.lineTo(x, hy * 0.3 + k * 12 + Math.sin(x / w * TAU * 3 + k) * 12); g.stroke(); }
      for (const [col, a, n, b] of [['#7a8ab8', 60, 5, 2], ['#5a6a98', 40, 9, 0]]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, hy + 2); for (let x = 0; x <= w; x += 8) g.lineTo(x, hy - b - a * Math.abs(Math.sin(x / w * TAU * n * 0.5 + b))); g.lineTo(w, hy + 2); g.fill(); } },
    sunset(g, w, h, hy) { const gr = g.createRadialGradient(w * 0.3, hy - 10, 2, w * 0.3, hy - 10, 40); gr.addColorStop(0, '#fff8d0'); gr.addColorStop(0.4, '#ffd060'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#5a1a1a'; for (let i = 0; i < 10; i++) { const x = i * w / 10 + Math.random() * 20, bw = 26 + Math.random() * 30, bh = 14 + Math.random() * 26; g.fillRect(x, hy - bh, bw, bh + 2); g.fillStyle = '#7a2a1a'; g.fillRect(x, hy - bh, bw, 3); g.fillStyle = '#5a1a1a'; } },
    skyline(g, w, h, hy) { for (let i = 0; i < 6; i++) { const x = Math.random() * w, y = hy * (0.2 + Math.random() * 0.4); g.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + k * 9, y, 10, 5, 0, 0, TAU); g.fill(); } }
      for (let i = 0; i < 50; i++) { const x = Math.random() * w, bw = 8 + Math.random() * 14, bh = 16 + Math.random() * 60; g.fillStyle = ['#5a7a9a', '#6a8aa8', '#4a6a8a'][i % 3]; g.fillRect(x, hy - bh, bw, bh + 2); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x, hy - bh, 2, bh); } },
    deep(g, w, h, hy) { for (let k = 0; k < 9; k++) { const x = Math.random() * w; const gr = g.createLinearGradient(x, 0, x + 30, hy); gr.addColorStop(0, 'rgba(160,255,240,.25)'); gr.addColorStop(1, 'rgba(160,255,240,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14, 0); g.lineTo(x + 50, hy); g.lineTo(x + 20, hy); g.fill(); }
      g.fillStyle = '#04201e'; g.beginPath(); g.moveTo(0, hy + 2); for (let x = 0; x <= w; x += 8) g.lineTo(x, hy - 10 - 14 * Math.abs(Math.sin(x / w * TAU * 4))); g.lineTo(w, hy + 2); g.fill(); },
    void(g, w, h, hy) { g.strokeStyle = 'rgba(255,40,40,.5)'; for (let y = hy; y > hy * 0.5; y -= (hy - y) * 0.3 + 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, hy); g.lineTo(x, hy * 0.55); g.stroke(); } for (let i = 0; i < 100; i++) { g.fillStyle = '#fff'; g.fillRect(Math.random() * w, Math.random() * hy * 0.5, 1, 1); } },
  };
  // weapon icons for the HUD
  const WEPS = ['BOLTS', 'SEEKER', 'MINES', 'SHIELD', 'TURBO', 'JAQUAKE'];
  const WEP_INFO = { BOLTS: 'THREE ROCKETS STRAIGHT AHEAD', SEEKER: 'CHASES THE SHIP IN FRONT', MINES: 'DROPPED BEHIND YOU', SHIELD: 'NOTHING CAN HURT YOU', TURBO: 'A BIG BURST OF SPEED', QUAKE: 'A SHOCKWAVE DOWN THE TRACK' };
  const WCOL = { BOLTS: '#ffe14a', SEEKER: '#ff5a2a', MINES: '#ff2a8a', SHIELD: '#5ad8ff', TURBO: '#ff9a1a', QUAKE: '#c08aff' };
  const ICON = {};
  function icons() {
    if (ICON.BOLTS) return;
    const mk = (n, f) => { const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d'); g.fillStyle = '#0a0a1a'; g.fillRect(0, 0, 24, 24); g.strokeStyle = WCOL[n]; g.lineWidth = 2; g.strokeRect(1, 1, 22, 22); g.fillStyle = WCOL[n]; g.strokeStyle = WCOL[n]; f(g); ICON[n] = c; };
    mk('BOLTS', g => { for (const x of [6, 12, 18]) { g.beginPath(); g.moveTo(x, 4); g.lineTo(x + 3, 10); g.lineTo(x + 1, 10); g.lineTo(x + 1, 20); g.lineTo(x - 1, 20); g.lineTo(x - 1, 10); g.lineTo(x - 3, 10); g.fill(); } });
    mk('SEEKER', g => { g.beginPath(); g.arc(12, 12, 7, 0, TAU); g.lineWidth = 2; g.stroke(); g.beginPath(); g.arc(12, 12, 2.5, 0, TAU); g.fill(); g.fillRect(11, 2, 2, 5); g.fillRect(11, 17, 2, 5); g.fillRect(2, 11, 5, 2); g.fillRect(17, 11, 5, 2); });
    mk('MINES', g => { for (const [x, y] of [[8, 8], [16, 10], [10, 16]]) { g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill(); g.fillRect(x - 5, y - 0.5, 10, 1); g.fillRect(x - 0.5, y - 5, 1, 10); } });
    mk('SHIELD', g => { g.beginPath(); g.moveTo(12, 3); g.lineTo(20, 6); g.lineTo(19, 14); g.lineTo(12, 21); g.lineTo(5, 14); g.lineTo(4, 6); g.closePath(); g.lineWidth = 2; g.stroke(); g.globalAlpha = 0.4; g.fill(); g.globalAlpha = 1; });
    mk('TURBO', g => { for (const y of [6, 12]) { g.beginPath(); g.moveTo(4, y + 6); g.lineTo(12, y - 2); g.lineTo(20, y + 6); g.lineTo(20, y + 9); g.lineTo(12, y + 1); g.lineTo(4, y + 9); g.fill(); } });
    mk('JAQUAKE', g => { g.lineWidth = 2; g.beginPath(); for (let x = 3; x <= 21; x++) g.lineTo(x, 12 + Math.sin(x * 0.9) * 6); g.stroke(); });
  }

  // ================================================================ the disc
  TV.game('ps.grav', {
    three: true, stick: true, buttons: ['a', 'b', 'x', 'l', 'r'],
    help: 'Steer: arrows. Thrust: Z. Fire: X. Absorb weapon: C. Airbrakes: U and E. Pause: Enter.',
    make(K) {
      const T3 = K.three({ far: 900, fogCol: 0x1a0830, fogNear: 60, fogFar: 320 }), T = T3.T, H = K.hud, F = K.font, W = K.W, HH = K.H;
      icons();
      let RK = window.RoomRK;
      // ---------------------------------------------------------------- the save (the old one was just { best })
      const sv = (() => { const s = K.load(); return s && typeof s === 'object' ? s : {}; })();
      for (const k of ['lap', 'tt', 'champ', 'unl']) if (!sv[k] || typeof sv[k] !== 'object') sv[k] = {};
      if (sv.best > 0 && !sv.lap[0]) sv.lap[0] = sv.best;
      sv.opt = Object.assign({ mus: 1, cam: 0 }, sv.opt && typeof sv.opt === 'object' ? sv.opt : {});
      sv.team = clamp(sv.team | 0, 0, TEAMS.length - 1); if (!Array.isArray(sv.hi)) sv.hi = []; sv.races = sv.races | 0;
      const save = () => { if (sv.lap[0] && (!sv.best || sv.lap[0] < sv.best)) sv.best = sv.lap[0]; try { K.save(sv); } catch (e) {} saveCard(); };
      let saveCard = () => {};
      const castN = (id, fb) => { try { const n = window.Cast && Cast.n ? Cast.n(id) : ''; return String(n || fb).toUpperCase().slice(0, 9); } catch (e) { return fb; } };
      const MATES = [['CALLUM', 17200], ['DAVE', 14600], ['JACKK', 12300], ['LUKE', 10400], [castN('kidCalc', 'MATT'), 8200], [castN('cousin', 'KIM'), 6400], ['DAD', 3100], ['MOM', 900]];
      const myName = () => { try { const n = String((window.Net && Net.me && Net.me.nick) || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ''); return !n || /^GUEST/.test(n) ? 'YOU' : n.slice(0, 8); } catch (e) { return 'YOU'; } };
      const table = () => MATES.map(([n, s]) => ({ n, s, mate: 1 })).concat(sv.hi.map(x => ({ n: String(x.n || 'YOU'), s: x.s | 0 }))).sort((a, b) => b.s - a.s).slice(0, 8);
      const ghLoad = i => { try { return localStorage.getItem('jhp_rmgrav_gh' + i) || ''; } catch (e) { return ''; } };
      const ghSave = (i, s) => { try { localStorage.setItem('jhp_rmgrav_gh' + i, s); } catch (e) {} };
      const supOpen = () => !!sv.unl.sup || !!window.__gravCheatAll, trackOpen = i => !TRACKS[i].bonus || !!sv.unl.bonus || !!window.__gravCheatAll, teamOpen = i => !TEAMS[i].locked || !!sv.unl.nullp;

      // ---------------------------------------------------------------- 3D bits that last all game
      const LIT = T3.lights({ amb: 0.7, sun: 0.7, dir: [0.3, 1, 0.5] });
      T3.cam.fov = 70; T3.cam.near = 0.3; T3.cam.far = 900; T3.cam.updateProjectionMatrix();
      const matV = T3.mat({ vcol: true }), matG = T3.mat({ vcol: true, lit: false });
      const matGlow = T3.mat({ vcol: true, lit: false, transparent: true, opacity: 0.95 }); matGlow.blending = T.AdditiveBlending; matGlow.depthWrite = false;
      const matGhost = T3.mat({ vcol: true, transparent: true, opacity: 0.35, lit: false });
      const shadowTex = T3.tex(32, 32, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const shadowMat = T3.mat({ map: shadowTex, transparent: true, lit: false }); shadowMat.depthWrite = false; shadowMat.polygonOffset = true; shadowMat.polygonOffsetFactor = -4;
      const shadowGeo = T3.keep(new T.PlaneGeometry(3.6, 5.2)); shadowGeo.rotateX(-Math.PI / 2);
      const shadows = new T.InstancedMesh(shadowGeo, shadowMat, 9); shadows.frustumCulled = false; T3.add(shadows);
      let shipGeo = [], fxN = null, fxA = null;
      const M4 = new T.Matrix4(), Q = new T.Quaternion(), V1 = new T.Vector3(), V2 = new T.Vector3(), V3 = new T.Vector3(), V4 = new T.Vector3(), ZERO = new T.Matrix4().makeScale(0, 0, 0);
      let sky = null, world = null, L = null, TR = null, TH = null, FL = null, padTex = null, pads = [], wpads = [], ramps = [], turbines = [], spinners = [], pitA = 0, pitB = 0, groundY = 0, starfield = null;
      let cfg = { kind: 'race', cls: 0, track: 0 };
      let ships = [], me = null, shots = [], mode = 'load', mt = 0;
      const TEX = {}, tex = (n, w, h) => TEX[n] || (TEX[n] = T3.tex(w || 32, h || 32, PAINT[n]));

      function setTheme(th) {
        if (sky) { sky.kill(); sky = null; }
        sky = RK.sky(T3, { r: 650, grad: th.sky, paint: (g, w, h, hy) => PANO[th.pano] && PANO[th.pano](g, w, h, hy), lift: -30 });
        T3.scene.fog.color.setHex(th.fog); T3.scene.fog.near = th.fogN; T3.scene.fog.far = th.fogF; T3.scene.background = new T.Color(th.fog);
        LIT.hemi.color.setHex(th.skyL); LIT.hemi.groundColor.setHex(th.gndL); LIT.hemi.intensity = th.amb; LIT.sun.color.setHex(th.sunCol || 0xffffff); LIT.sun.intensity = th.sun;
      }
      function clearWorld() {
        if (world) { world.traverse(x => { if (x.geometry && x.geometry !== shadowGeo && !shipGeo.some(s => s.body === x.geometry || s.glow === x.geometry)) x.geometry.dispose(); }); T3.scene.remove(world); world = null; }
        turbines = []; spinners = []; ramps = []; pads = []; wpads = [];
        if (starfield) { T3.scene.remove(starfield); starfield.geometry.dispose(); starfield.material.dispose(); starfield = null; }
        if (fxN) { fxN.clear(); fxA.clear(); }
      }
      const addW = (geo, mat) => { const m = new T.Mesh(geo, mat); world.add(m); return m; };
      function runs(N, fn) {
        let all = true, any = false; for (let i = 0; i < N; i++) { if (fn(i)) any = true; else all = false; }
        if (all) return null; if (!any) return [];
        let s = 0; while (fn(s)) s = (s + 1) % N;
        const out = []; let a = -1;
        for (let k = 1; k <= N; k++) { const i = (s + k) % N; if (fn(i)) { if (a < 0) a = i; } else if (a >= 0) { out.push([a, (i + N - 1) % N]); a = -1; } }
        if (a >= 0) out.push([a, (s + N) % N]);
        return out;
      }
      function ribbon(fn, a, b, o, mat) {
        const N = L.N, rs = runs(N, fn); if (!rs) return addW(RK.strip(T, L, a, b, o), mat);
        for (const [s, e] of rs) { const to = (e < s ? e + N : e) + 1; if (to - s < 1) continue; addW(RK.strip(T, L, a, b, Object.assign({}, o, { from: s, to })), mat); }
      }
      function flip(geo) { const ix = geo.index; if (ix) { const a = ix.array; for (let k = 0; k < a.length; k += 3) { const t = a[k + 1]; a[k + 1] = a[k + 2]; a[k + 2] = t; } ix.needsUpdate = true; } const n = geo.attributes.normal; for (let k = 0; k < n.array.length; k++) n.array[k] *= -1; n.needsUpdate = true; return geo; }
      function rampH(i) { for (const r of ramps) { let k = i - r.i0; if (k < 0) k += L.N; if (k >= 0 && k <= r.n) return r.hh * Math.sin(k / r.n * Math.PI / 2); } return 0; }

      // ---------------------------------------------------------------- building a track
      function buildTrack(ti) {
        clearWorld();
        const tr = TRACKS[ti], th = THEMES[tr.th]; TR = tr; TH = th; world = new T.Group(); T3.scene.add(world); setTheme(th);
        L = RK.loop(T, tr.pts, 2.5);
        const N = L.N, fi = f => ((Math.round(f * N) % N) + N) % N;
        const range = (fa, fb, fn) => { const a = fi(fa), b = fi(fb); for (let i = a; ; i = (i + 1) % N) { fn(i); if (i === b) break; } };
        FL = { tun: new Uint8Array(N), tube: new Uint8Array(N), gap: new Uint8Array(N), pit: new Uint8Array(N), hw: new Float32Array(N), line: new Float32Array(N) };
        for (let i = 0; i < N; i++) FL.hw[i] = L.W[i] / 2;
        (tr.tunnel || []).forEach(([a, b]) => range(a, b, i => { FL.tun[i] = 1; }));
        (tr.tube || []).forEach(([a, b]) => range(a, b, i => { FL.tube[i] = 1; }));
        (tr.gap || []).forEach(([a, b]) => range(a, b, i => { FL.gap[i] = 1; }));
        pitA = fi(0.9); pitB = fi(0.985); range(0.9, 0.985, i => { FL.pit[i] = 1; });
        ramps = (tr.kick || []).map(([f, len, hh]) => ({ i0: fi(f), n: Math.round(len / L.step), hh }));
        // the racing line: inside of the bends, straight over the jumps
        for (let i = 0; i < N; i++) { let c = 0; for (let k = -5; k <= 8; k++) c += L.C[L.wrap(i + k + 4)]; FL.line[i] = clamp(c / 14 * 130, -0.55, 0.55) * FL.hw[i]; }
        for (const r of ramps) for (let k = -14; k < r.n + 14; k++) FL.line[L.wrap(r.i0 + k)] = 0;
        let mnY = 1e9; for (const p of L.P) mnY = Math.min(mnY, p.y); groundY = Math.min(th.gy, mnY - 10);
        const hw = i => FL.hw[i];
        // ---- the track surface, its underside, neon edges, glass walls
        const tt = T3.tile(T3.tex(64, 64, PAINT.panels(th.track, th.wire)), 1, 1);
        ribbon(i => !FL.gap[i], i => -hw(i), hw, { ya: i => rampH(i), v: 10, u0: 0, u1: 4 }, T3.mat({ map: tt }));
        const um = T3.mat({ color: th.wire ? 0x200008 : 0x22222e, side: T.DoubleSide });
        ribbon(i => !FL.gap[i], i => -hw(i) - 0.4, i => hw(i) + 0.4, { ya: i => -1.2 + rampH(i), v: 10 }, um);
        for (const s of [-1, 1]) ribbon(i => !FL.gap[i], i => s * (hw(i) + 0.4), i => s * (hw(i) + 0.4), { ya: i => -1.2 + rampH(i), yb: i => 0.05 + rampH(i), v: 8, face: s }, um);
        const et = T3.tex(8, 32, (g, w, h) => { g.fillStyle = th.edge; g.fillRect(0, 0, w, h); g.fillStyle = th.edge2; g.fillRect(0, 0, w, 6); g.fillRect(0, 16, w, 2); });
        const em = T3.mat({ map: et, lit: false, fog: false });
        for (const s of [-1, 1]) ribbon(i => !FL.gap[i], i => s * hw(i), i => s * (hw(i) + 0.7), { ya: i => 0.06 + rampH(i), v: 6 }, em);
        const gm = T3.mat({ color: th.wall, lit: false, transparent: true, opacity: 0.22, side: T.DoubleSide }); gm.depthWrite = false;
        for (const s of [-1, 1]) ribbon(i => !FL.gap[i] && !FL.tube[i] && !FL.tun[i], i => s * (hw(i) + 0.45), i => s * (hw(i) + 0.45), { ya: i => rampH(i), yb: i => 2.4 + rampH(i), v: 6, face: -s }, gm);
        const gt = T3.mat({ color: th.wall, lit: false, fog: false });
        for (const s of [-1, 1]) ribbon(i => !FL.gap[i] && !FL.tube[i] && !FL.tun[i], i => s * (hw(i) + 0.45), i => s * (hw(i) + 0.45), { ya: i => 2.3 + rampH(i), yb: i => 2.5 + rampH(i), v: 6, face: -s }, gt);
        // the pit lane (green, on the right by the start) and its row of little lights
        addW(RK.strip(T, L, i => hw(i) - 4.6, i => hw(i) - 0.1, { ya: 0.07, from: pitA, to: pitB, v: 16 }), T3.mat({ map: T3.tex(32, 32, PAINT.pit), lit: false }));
        // the start line
        const chk = T3.tex(32, 8, (g, w, h) => { for (let x = 0; x < 8; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 4, y * 4, 4, 4); } });
        addW(RK.strip(T, L, i => -hw(i), hw, { ya: 0.08, from: 0, to: 1, v: 2.5 }), T3.mat({ map: chk, lit: false }));
        // tunnels: walls, roof, neon strips; tubes: glass rings under the sea
        const tunWall = T3.mat({ map: T3.tile(T3.tex(32, 32, PAINT.panels(['#2a2a3a', '#1a1a26', '#3a3a4e'])), 1, 1), side: T.DoubleSide });
        ribbon(i => !!FL.tun[i], i => -hw(i) - 0.6, i => -hw(i) - 0.6, { ya: 0, yb: 7, v: 8, face: 1 }, tunWall);
        ribbon(i => !!FL.tun[i], i => hw(i) + 0.6, i => hw(i) + 0.6, { ya: 0, yb: 7, v: 8, face: -1 }, tunWall);
        for (const [s, e] of runs(N, i => !!FL.tun[i]) || []) { const to = (e < s ? e + N : e) + 1; addW(flip(RK.strip(T, L, i => -hw(i) - 0.6, i => hw(i) + 0.6, { ya: 7, from: s, to, v: 8 })), tunWall); for (const sd of [-1, 1]) addW(RK.strip(T, L, i => sd * (hw(i) - 1), i => sd * (hw(i) + 0.5), { ya: 6.9, from: s, to, v: 4 }), em); }
        const tubeParts = [], ringParts = [];
        if (tr.tube) {
          const seg = 14, R0 = 11, pos = [], idx = []; let base = 0;
          for (const [s, e] of runs(N, i => !!FL.tube[i]) || []) {
            const to = (e < s ? e + N : e) + 1, n0 = pos.length / 3;
            for (let k = s; k <= to; k++) { const i = L.wrap(k), c = L.at(i, 0, 3.2, V1); for (let q = 0; q <= seg; q++) { const a = -0.25 * Math.PI + q / seg * 1.5 * Math.PI, x = Math.cos(a) * R0, y = Math.sin(a) * R0 * 0.75; pos.push(c.x + L.R[i].x * x + L.U[i].x * y, c.y + L.R[i].y * x + L.U[i].y * y, c.z + L.R[i].z * x + L.U[i].z * y); }
              if ((k - s) % 10 === 0) ringParts.push({ geo: new T.TorusGeometry(R0 * 0.98, 0.25, 4, 18, Math.PI * 1.5), m: new T.Matrix4().makeBasis(V3.copy(L.R[i]).negate(), V2.copy(L.U[i]).multiplyScalar(0.75), L.D[i]).setPosition(c).multiply(new T.Matrix4().makeRotationZ(-0.25 * Math.PI)), c: 0x3affd0 }); }
            const rows = to - s + 1; for (let r = 0; r < rows - 1; r++) for (let q = 0; q < seg; q++) { const a = n0 + r * (seg + 1) + q, b = a + seg + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
          }
          const tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); tg.setIndex(idx); tg.computeVertexNormals();
          const glass = T3.mat({ color: 0x8affe8, transparent: true, opacity: 0.18, side: T.DoubleSide, lit: false }); glass.depthWrite = false; addW(tg, glass);
          if (ringParts.length) { addW(RK.merge(T, ringParts), matG); ringParts.forEach(p => p.geo.dispose()); }
        }
        // the ground far below
        if (th.gnd) { const gt2 = T3.tile(T3.tex(32, 32, PAINT[th.gnd]), 140, 140); const g = T3.keep(new T.PlaneGeometry(1800, 1800)); g.rotateX(-Math.PI / 2); g.translate(0, groundY, 0); addW(g, T3.mat({ map: gt2, lit: th.gnd !== 'grid' && th.gnd !== 'wire' })); }
        // pads
        padTex = T3.tex(16, 32, PAINT.chev);
        const padGeo = (list, len, wdt) => { const parts = []; for (const [i, lat] of list) { const g = new T.PlaneGeometry(wdt, len), p = L.at(i, lat, 0.1 + rampH(i)); M4.makeBasis(L.R[i], L.D[i], L.U[i]); M4.setPosition(p); parts.push({ geo: g, m: M4.clone(), c: 0xffffff }); } const geo = RK.merge(T, parts); parts.forEach(p => p.geo.dispose()); return geo; };
        pads = (tr.pads || []).map(([f, lat]) => ({ i: fi(f), lat })); wpads = (tr.wpads || []).map(([f, lat]) => ({ i: fi(f), lat }));
        addW(padGeo(pads.map(p => [p.i, p.lat]), 7, 4), T3.mat({ map: padTex, lit: false }));
        addW(padGeo(wpads.map(p => [p.i, p.lat]), 4, 4), T3.mat({ map: T3.tex(16, 16, PAINT.wpad), lit: false }));
        buildProps(tr, th);
      }

      // ---------------------------------------------------------------- scenery (merged: one lit, one glowing, one windowed mesh)
      const SPONSORS = [['ZOOM COLA', '#e8261c', '#ffffff'], ['VOLTZ', '#1a1a1a', '#ffe14a'], ['HYPERBYTE', '#2a5ae0', '#ffffff'], ['MEGA MUNCH', '#ff8a1a', '#2a1a0a'], ['NOVA FUEL', '#1aa05a', '#ffffff'], ['PSYCHOFLUX', '#8a2ad8', '#ffe0ff']];
      let bannerTex = null;
      function buildProps(tr, th) {
        const P = [], G = [], Wn = [], N = L.N, R = Math.random, pick = a => a[R() * a.length | 0];
        const box = (w, h, d) => new T.BoxGeometry(w, h, d), cyl = (a, b, h, s) => new T.CylinderGeometry(a, b, h, s || 8), cone = (r, h, s) => new T.ConeGeometry(r, h, s || 8), ball = (r, s) => new T.SphereGeometry(r, s || 8, Math.max(4, (s || 8) * 0.75 | 0));
        const add = (geo, x, y, z, ry, c, sx, sy, sz, rx, rz) => P.push({ geo, m: RK.M(T, x, y, z, ry || 0, sx, sy, sz, rx, rz), c });
        const glow = (geo, x, y, z, ry, c, sx, sy, sz, rx, rz) => G.push({ geo, m: RK.M(T, x, y, z, ry || 0, sx, sy, sz, rx, rz), c });
        const win = (geo, x, y, z, ry, c, sx, sy, sz) => Wn.push({ geo, m: RK.M(T, x, y, z, ry || 0, sx, sy, sz), c });
        const near = (x, z, m) => { for (let i = 0; i < N; i += 2) { const p = L.P[i]; if ((p.x - x) ** 2 + (p.z - z) ** 2 < m * m) return true; } return false; };
        let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; for (const p of L.P) { mnx = Math.min(mnx, p.x); mxx = Math.max(mxx, p.x); mnz = Math.min(mnz, p.z); mxz = Math.max(mxz, p.z); }
        const spot = (gap, far) => { for (let k = 0; k < 40; k++) { const x = lerp(mnx - far, mxx + far, R()), z = lerp(mnz - far, mxz + far, R()); if (!near(x, z, gap)) return { x, z }; } return null; };
        const scatter = (n, gap, far, fn) => { for (let k = 0; k < n; k++) { const p = spot(gap, far); if (p) fn(p.x, groundY, p.z, 0.7 + R() * 0.6); } };
        // pillars holding the track up
        for (let i = 0; i < N; i += 10) { if (FL.gap[i] || FL.tube[i]) continue; const p = L.P[i], h = p.y - 1.2 - groundY; if (h < 2) continue; const yaw = Math.atan2(L.D[i].x, L.D[i].z);
          add(box(2.2, h, 2.2), p.x, groundY + h / 2, p.z, yaw, th.wire ? 0x200008 : 0x3a3a4a); add(box(FL.hw[i] * 1.6, 0.8, 2.6), p.x, p.y - 1.4, p.z, yaw, th.wire ? 0x300010 : 0x4a4a5a); if (th.wire) glow(box(0.3, h, 0.3), p.x + 1.15, groundY + h / 2, p.z, yaw, 0xff2a2a); }
        // gantries with sponsor boards, and the start gantry with its lights
        if (!bannerTex) bannerTex = T3.tex(128, 128, (g, w, h) => { SPONSORS.forEach(([n, b, f], k) => { const y = k * (h / 6); g.fillStyle = b; g.fillRect(0, y, w, h / 6); g.fillStyle = f; g.font = 'italic 900 14px Arial Black,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, w / 2, y + h / 12 + 1); }); dith(g, w, h); });
        const ban = []; const gantry = (i, start) => { const p = L.P[i], r = L.R[i], u = L.U[i], w = FL.hw[i] + 1.4, yaw = Math.atan2(L.D[i].x, L.D[i].z);
          for (const s of [-1, 1]) add(box(0.9, 8, 0.9), p.x + r.x * s * w + u.x * 4, p.y + r.y * s * w + u.y * 4, p.z + r.z * s * w + u.z * 4, yaw, 0x5a5a6a);
          add(box(w * 2 + 1, 1.6, 0.9), p.x + u.x * 8.2, p.y + u.y * 8.2, p.z + u.z * 8.2, yaw, 0x3a3a46);
          const k = start ? 5 : (i * 7) % 6; for (const f of [-1, 1]) { const g = new T.PlaneGeometry(w * 2 - 1, 1.3); const uv = g.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setY(q, (5 - k + uv.getY(q)) / 6); ban.push({ geo: g, m: new T.Matrix4().makeRotationY(f > 0 ? Math.PI : 0).premultiply(new T.Matrix4().makeBasis(r, u, V3.copy(L.D[i]).negate())).setPosition(V1.copy(p).addScaledVector(u, 8.2).addScaledVector(L.D[i], f * 0.47)), c: 0xffffff }); }
          if (start) for (let q = 0; q < 5; q++) glow(ball(0.4, 6), p.x + r.x * (q - 2) * 1.2 + u.x * 9.6, p.y + u.y * 9.6, p.z + r.z * (q - 2) * 1.2 + u.z * 9.6, 0, 0x3a1010); };
        gantry(L.wrap(2), true);
        for (let i = 40; i < N - 20; i += 70) if (!FL.gap[i] && !FL.tun[i] && !FL.tube[i] && !ramps.some(r => Math.abs(i - r.i0) < 20)) gantry(i, false);
        if (ban.length) { addW(RK.merge(T, ban), T3.mat({ map: bannerTex, lit: false, side: T.DoubleSide })); ban.forEach(b => b.geo.dispose()); }
        // pit lane lights
        for (let k = 0, i = pitA; k < ((pitB - pitA + L.N) % L.N); k += 3, i = L.wrap(pitA + k)) { const p = L.at(i, FL.hw[i] - 4.9, 0.3); glow(box(0.3, 0.6, 0.3), p.x, p.y, p.z, 0, 0x3aff6a); }
        // start lights to light up (kept so the count can switch them)
        const p0 = L.P[L.wrap(2)], u0 = L.U[L.wrap(2)], r0 = L.R[L.wrap(2)]; startLights = [0, 1, 2, 3, 4].map(q => V2.copy(p0).addScaledVector(r0, (q - 2) * 1.2).addScaledVector(u0, 9.6).clone());
        // ---- the place
        if (tr.props === 'city' || tr.props === 'helix') {
          scatter(tr.props === 'city' ? 80 : 70, 30, 160, (x, y, z) => { const w = 10 + R() * 16, h = 20 + R() * (tr.props === 'city' ? 80 : 110); win(box(w, h, w), x, y + h / 2, z, R() * 0.4, pick(tr.props === 'city' ? [0x8a8aa8, 0x7a90b8, 0xa88aa8] : [0xc8d8e8, 0xa8c0d8, 0xe0e8f0])); add(box(w * 1.04, 1.2, w * 1.04), x, y + h, z, 0, 0x2a2a3a); if (R() < 0.4) glow(box(w * 0.7, 3, 0.3), x, y + h * 0.8, z + w / 2 + 0.2, 0, pick([0xff2a8a, 0x2ae0ff, 0xffe14a, 0x9aff5a])); if (R() < 0.3) { add(cyl(0.2, 0.2, 8, 4), x, y + h + 4, z, 0, 0x888888); glow(ball(0.5, 6), x, y + h + 8.2, z, 0, 0xff2a2a); } });
          if (tr.tower) { const cx = 190, cz = 15; win(cyl(26, 30, 110, 12), cx, groundY + 55, cz, 0, 0xd0d8e8); for (let k = 0; k < 6; k++) glow(new T.TorusGeometry(28.5 - k * 0.6, 0.6, 4, 24), cx, groundY + 14 + k * 18, cz, 0, k % 2 ? 0x2ae0ff : 0xff7a1a, 1, 1, 1, Math.PI / 2); add(cone(30, 16, 12), cx, groundY + 118, cz, 0, 0x5a6a7a); add(cyl(0.6, 0.6, 30, 6), cx, groundY + 140, cz, 0, 0xcccccc); glow(ball(1.4, 8), cx, groundY + 156, cz, 0, 0xff2a2a); }
          if (tr.tunnel) { const [a, b] = tr.tunnel[0], ia = Math.round(a * N), ib = Math.round(b * N), mid = L.wrap(Math.round((ia + ib) / 2)), p = L.P[mid], yaw = Math.atan2(L.D[mid].x, L.D[mid].z), len = (ib - ia) * L.step; win(box(46, p.y - groundY + 40, len + 8), p.x, (p.y + groundY + 40) / 2 + 5, p.z, yaw, 0x9a9ab8); glow(box(30, 6, 0.4), p.x - Math.sin(yaw) * (len / 2 + 4.3), p.y + 16, p.z - Math.cos(yaw) * (len / 2 + 4.3), yaw, 0xff2a8a); }
        } else if (tr.props === 'frost') {
          for (let k = 0; k < 22; k++) { const a = k / 22 * TAU + R() * 0.2, r = 380 + R() * 80, h = 80 + R() * 70; add(cone(70 + R() * 40, h, 7), Math.cos(a) * r, groundY + h / 2 - 4, Math.sin(a) * r + 120, R() * 6, 0x6a7aa0); add(cone(28 + R() * 10, h * 0.35, 7), Math.cos(a) * r, groundY + h * 0.84, Math.sin(a) * r + 120, 0, 0xf0f6ff); }
          scatter(140, 12, 140, (x, y, z, s) => { add(cyl(0.4 * s, 0.5 * s, 2 * s, 5), x, y + s, z, 0, 0x4a3020); add(cone(3 * s, 5 * s, 6), x, y + 4 * s, z, R() * 6, 0x1e4a3a); add(cone(2.2 * s, 4 * s, 6), x, y + 6.4 * s, z, 0, 0xe8f0ff); });
          scatter(14, 16, 120, (x, y, z, s) => { for (let q = 0; q < 3; q++) glow(cone(1.6 * s, (10 + q * 6) * s, 5), x + (q - 1) * 3 * s, y + (5 + q * 3) * s, z, R() * 6, 0x8ae8ff, 1, 1, 1, (q - 1) * 0.25); });
          const d = spot(30, 80); if (d) { add(cyl(14, 14, 10, 12), d.x, groundY + 5, d.z, 0, 0xd8d8e0); add(new T.SphereGeometry(14, 14, 8, 0, TAU, 0, Math.PI / 2), d.x, groundY + 10, d.z, 0, 0xe8e8f0); glow(box(4, 18, 0.5), d.x, groundY + 16, d.z, 0.5, 0x2a2a3a); }
        } else if (tr.props === 'rust') {
          scatter(26, 30, 220, (x, y, z) => { const w = 18 + R() * 28, h = 20 + R() * 40; add(cyl(w, w * 1.2, h, 7), x, y + h / 2, z, R() * 6, 0xb05a32); add(cyl(w * 1.02, w * 1.02, 3, 7), x, y + h * 0.6, z, 0, 0x8a3a22); add(cyl(w * 0.96, w, 2, 7), x, y + h, z, 0, 0xc87a4a); });
          scatter(30, 10, 100, (x, y, z) => add(new T.DodecahedronGeometry(2 + R() * 3, 0), x, y + 1, z, R() * 6, 0x8a4a2a, 1, 0.7, 1));
          for (let k = 0; k < 6; k++) { const p = spot(26, 90); if (!p) continue; add(cyl(0.8, 1.2, 30, 6), p.x, groundY + 15, p.z, 0, 0xe8e8e8); add(box(2, 2, 3), p.x, groundY + 30, p.z, 0, 0xd8d8d8); const bl = []; for (let q = 0; q < 3; q++) bl.push({ geo: new T.BoxGeometry(1.2, 13, 0.3), m: RK.M(T, Math.sin(q * TAU / 3) * 6.5, Math.cos(q * TAU / 3) * 6.5, 0, 0, 1, 1, 1, 0, -q * TAU / 3), c: 0xf0f0f0 }); const m = new T.Mesh(RK.merge(T, bl), matV); bl.forEach(b => b.geo.dispose()); m.position.set(p.x, groundY + 30, p.z + 1.6); m.rotation.y = R() * 0.6; world.add(m); turbines.push(m); }
          for (const [a] of tr.gap || []) { const i = Math.round(a * N), p = L.P[i]; add(box(400, 2, 26), p.x, groundY - 0.5, p.z, Math.atan2(L.R[i].x, L.R[i].z) + Math.PI / 2, 0x2a0a06); }
        } else if (tr.props === 'aqua') {
          scatter(90, 16, 120, (x, y, z, s) => { const h = (14 + R() * 24) * s; for (let q = 0; q < 4; q++) add(box(0.5, h / 4, 1.4), x + Math.sin(q) * 0.6, y + h / 8 + q * h / 4, z, q * 0.4, q % 2 ? 0x2a8a3a : 0x3a9a2a, 1, 1, 1, Math.sin(q * 1.7) * 0.15); });
          scatter(40, 10, 100, (x, y, z, s) => { const c = pick([0xff6a8a, 0xffa03a, 0xc06aff, 0xffe14a]); for (let q = 0; q < 4; q++) add(ball((1 + R() * 1.4) * s, 7), x + (R() - 0.5) * 3, y + R() * 1.5, z + (R() - 0.5) * 3, 0, c); });
          scatter(30, 12, 120, (x, y, z) => add(new T.DodecahedronGeometry(3 + R() * 5, 0), x, y, z, R() * 6, 0x3a4a48, 1, 0.6, 1));
          scatter(24, 14, 80, (x, y, z) => { const yy = y + 14 + R() * 30; glow(ball(1.2, 8), x, yy, z, 0, pick([0x8affff, 0xff8aff, 0xc8ff8a]), 1, 0.6, 1); for (let q = 0; q < 4; q++) glow(box(0.08, 2.2, 0.08), x + Math.sin(q * 1.6) * 0.6, yy - 1.4, z + Math.cos(q * 1.6) * 0.6, 0, 0x8affff); });
          const sh = spot(40, 80); if (sh) { add(box(14, 10, 60), sh.x, groundY + 3, sh.z, 0.4, 0x5a3a2a, 1, 1, 1, 0, 0.3); add(cyl(1, 1, 20, 6), sh.x, groundY + 14, sh.z, 0.4, 0x4a2a1a, 1, 1, 1, 0, 0.3); }
        } else if (tr.props === 'phantom') {
          scatter(50, 16, 160, (x, y, z, s) => { const h = 4 + R() * 40; glow(box(8 * s, 8 * s, 8 * s), x, y + h, z, R() * 6, pick([0xff2a2a, 0xffffff, 0x8a0a0a]), 1, 1, 1, R() * 6, R() * 6); });
          scatter(20, 20, 160, (x, y, z, s) => { add(cone(14 * s, 24 * s, 4), x, y + 12 * s, z, R(), 0x0a0a0e); glow(cone(14.3 * s, 0.4, 4), x, y + 0.2, z, 0, 0xff2a2a); });
        }
        if (P.length) { world.add(new T.Mesh(RK.merge(T, P), matV)); }
        if (G.length) world.add(new T.Mesh(RK.merge(T, G), matG));
        if (Wn.length) world.add(new T.Mesh(RK.merge(T, Wn), T3.mat({ vcol: true, map: T3.tile(T3.tex(16, 16, PAINT.windows), 1, 2) })));
        P.concat(G, Wn).forEach(p => p.geo.dispose());
        if (th.wire || tr.th === 'neon') { const n = 500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = R() * TAU, b = R() * 0.9 + 0.1, r = 500; pos[i * 3] = Math.cos(a) * r * Math.sqrt(1 - b * b); pos[i * 3 + 1] = b * r; pos[i * 3 + 2] = Math.sin(a) * r * Math.sqrt(1 - b * b); } const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); starfield = new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: false, fog: false })); T3.add(starfield); }
      }
      let startLights = [];

      // ---------------------------------------------------------------- the ships
      const shipsG = new T.Group(); T3.scene.add(shipsG);
      function shipMesh(team, ghostly) { const g = shipGeo[team], grp = new T.Group(); grp.add(new T.Mesh(g.body, ghostly ? matGhost : matV)); const gl = new T.Mesh(g.glow, matGlow); grp.add(gl); grp.glow = gl; shipsG.add(grp); return grp; }
      function clearShips() { while (shipsG.children.length) shipsG.remove(shipsG.children[0]); ships = []; for (const s of shots) if (s.m) T3.scene.remove(s.m); shots = []; }
      function mkShip(team, pilot, ai, skill) {
        const tm = TEAMS[team], cls = CLASSES[cfg.cls];
        return { team, tm, n: ai ? pilot : myName(), ai, skill: skill || 1, aiMul: 1, mesh: shipMesh(team), fi: 0, d: 0, a: 0, v: 0, y: 0, vy: 0, air: false, airT: 0, prog: 0, lap: 0, done: false, ft: 0, out: false,
          energy: 100, wep: '', boost: 0, shield: 0, slow: 0, roll: 0, lane: (Math.random() - 0.5) * 5, wob: Math.random() * 6, cool: 2 + Math.random() * 3, hits: 0, laps: [], lapStart: 0, bestLap: 0, place: 0,
          top: cls.top * (0.94 + tm.spd * 0.025), thr: 15 + tm.thr * 3.2, hnd: 1.15 + tm.hnd * 0.13, dmg: 0.55 + (5 - tm.shd) * 0.14, respawn: 0, pitT: 0, mines: 0, flash: 0 };
      }
      function gridUp(list) { list.forEach((s, n) => { s.fi = L.N - 4 - Math.floor(n / 2) * 6; s.d = (n % 2 ? 1 : -1) * 3.4; s.a = 0; s.v = 0; s.prog = s.fi - L.N; s.y = trackY(s.fi, s.d) + 1.1; s.vy = 0; s.air = false; s.mesh.visible = true; }); }
      function trackY(fi, d) { const i0 = Math.floor(fi), f = fi - i0, a = L.wrap(i0), b = L.wrap(i0 + 1), pa = L.P[a], pb = L.P[b]; return pa.y + (pb.y - pa.y) * f + (L.R[a].y + (L.R[b].y - L.R[a].y) * f) * d + rampH(a) + (rampH(b) - rampH(a)) * f; }
      let rankC = [];
      const rank = () => rankC;
      function doRank() { rankC = ships.slice().sort((a, b) => (b.done ? 1e7 - b.ft : b.out ? -1e7 + b.prog : b.prog) - (a.done ? 1e7 - a.ft : a.out ? -1e7 + a.prog : a.prog)); rankC.forEach((s, n) => { s.place = n; }); }
      let shake = 0, hitFlash = 0;
      // ---- one ship, one step. inp: { steer, thrust, ab, fire, absorb, pitch }
      function fly(s, inp, dt) {
        const N = L.N; let thr = inp.thrust, steer = inp.steer, ab = inp.ab;
        if (s.out || s.respawn > 0) { thr = 0; steer = 0; ab = 0; }
        if (s.slow > 0) { s.slow -= dt; thr *= 0.4; }
        if (s.shield > 0) s.shield -= dt; if (s.flash > 0) s.flash -= dt;
        const top = s.top * s.aiMul + (s.boost > 0 ? 16 : 0);
        if (s.boost > 0) { s.boost -= dt; s.v = Math.min(top, s.v + 45 * dt); }
        if (thr) s.v += (s.v < top ? s.thr * (1 - s.v / (top * 1.08)) + 2 : -20) * dt; else s.v -= Math.min(s.v, 7 * dt);
        if (s.v > top && s.boost <= 0) s.v -= Math.min(s.v - top, 20 * dt);
        if (ab) s.v -= s.v * 0.3 * Math.abs(ab) * dt;
        s.v = clamp(s.v, 0, 95);
        let i = L.wrap(Math.round(s.fi));
        const rate = s.hnd * clamp(s.v / 20, 0.3, 1);
        s.a += (steer * rate + ab * 1.25) * dt * (s.air ? 0.6 : 1);
        s.a -= L.C[i] * s.v * dt * Math.cos(s.a);
        s.a = clamp(s.a, -1.2, 1.2); if (!steer && !ab) s.a *= 1 - Math.min(1, dt * 1.1);
        s.roll += ((steer + ab * 0.8) * 0.5 - s.roll) * Math.min(1, dt * 6);
        const fwd = s.v * Math.cos(s.a) * dt;
        s.fi = (s.fi + fwd / L.step + N) % N; s.d += s.v * Math.sin(s.a) * dt; s.prog += fwd / L.step;
        i = L.wrap(Math.round(s.fi));
        // the walls (none over a gap)
        const lim = FL.hw[i] - 1.3;
        if (!FL.gap[i] && Math.abs(s.d) > lim && s.respawn <= 0) {
          const imp = s.v * Math.abs(Math.sin(s.a)), sd = Math.sign(s.d); s.d = sd * lim; s.a *= -0.25; s.v *= 0.93 - Math.min(0.2, imp * 0.008);
          if (imp > 5) { hurt(s, imp * 0.32, null); if (fxA) { const p = L.atf(s.fi, s.d + sd * 1.2, 0.6, V1); for (let k = 0; k < 8; k++) fxA.emit(p.x, p.y, p.z, (Math.random() - 0.5) * 10, Math.random() * 6, (Math.random() - 0.5) * 10, 0.3, 0xffd040, 2, { g: 12 }); } if (!s.ai) { K.sfx.noise(0.18, 0.18, 2500, 0, 'highpass'); shake = Math.max(shake, 0.25); } }
        }
        // up and down: hover over the track, fly off crests and kickers, fall into the gaps
        const surf = FL.gap[i] ? -1e4 : trackY(s.fi, s.d) + 1.1;
        if (!s.air) {
          const pred = s.y + s.vy * dt - 30 * dt * dt;
          if (surf < pred - 0.08) { s.air = true; s.y = pred; s.vy -= 30 * dt; s.airT = 0; }
          else { s.vy = clamp((surf - s.y) / dt, -30, 30); s.y = surf; }
        } else {
          s.vy -= (30 + (inp.pitch || 0) * 12) * dt; s.y += s.vy * dt; s.airT += dt;
          if (s.y <= surf) {
            if (s.y < surf - 3.5) { respawn(s); return; }
            const imp = -s.vy; s.y = surf; s.vy = 0; s.air = false;
            if (imp > 10) { s.v *= 0.95; if (!s.ai) { K.sfx.tone(80, 0.15, 'square', 0.1); shake = Math.max(shake, 0.2); } }
            if (s.airT > 2 && !s.ai && mode === 'race') K.secret('rm.grav.air');
            s.airT = 0;
          }
          if (FL.gap[i] && s.y < L.P[i].y - 14) { respawn(s); return; }
        }
        if (s.respawn > 0) return;
        // pads, the pit lane
        if (!s.air) {
          for (const p of pads) { let di = i - p.i; if (di > N / 2) di -= N; if (di < -N / 2) di += N; if (di >= -1 && di <= 1 && Math.abs(s.d - p.lat) < 2.3 && s.boost < 0.3) { s.boost = 0.75; if (!s.ai) K.sfx.noise(0.5, 0.14, 600, 0, 'bandpass', 3000); } }
          for (const p of wpads) { let di = i - p.i; if (di > N / 2) di -= N; if (di < -N / 2) di += N; if (di >= -1 && di <= 1 && Math.abs(s.d - p.lat) < 2.3 && !s.wep && cfg.kind !== 'tt') { s.wep = pickWep(s); if (!s.ai) { K.sfx.seq([[88, 0.25], [93, 0.5]], { bpm: 500, vol: 0.08 }); say(s.wep, 0.9); } } }
          if (FL.pit[i] && s.d > FL.hw[i] - 5 && s.energy < 100) { s.energy = Math.min(100, s.energy + 26 * dt); s.pitT += dt; if (fxA && K.frame % 3 === 0) { const p = L.atf(s.fi, s.d, 1, V1); fxA.emit(p.x, p.y, p.z, 0, 6, 0, 0.5, 0x3aff6a, 1.2); } if (!s.ai && K.frame % 8 === 0) K.sfx.tone(600 + s.energy * 6, 0.06, 'sine', 0.05); }
        }
        if (inp.absorb && s.wep) { s.energy = Math.min(100, s.energy + 18); s.wep = ''; if (!s.ai) { K.sfx.tone(300, 0.3, 'sine', 0.08, 0, 900); say('ENERGY +18', 0.8); } }
        else if (inp.fire && s.wep) fire(s);
      }
      function respawn(s) {
        s.respawn = 1.3; s.energy -= 12; if (!s.ai) { say('BACK ON TRACK', 1.2); K.sfx.tone(500, 0.6, 'triangle', 0.08, 0, 120); }
        let j = L.wrap(Math.round(s.fi)); for (let n = 0; n < 40 && (FL.gap[j] || ramps.some(r => { let q = j - r.i0; if (q < 0) q += L.N; return q <= r.n; })); n++) j = L.wrap(j + 1);
        j = L.wrap(j + 3); let dd = j - L.wrap(Math.round(s.fi)); if (dd < -L.N / 2) dd += L.N; s.prog += dd; s.fi = j; s.d = 0; s.a = 0; s.v = 22; s.y = trackY(j, 0) + 4; s.vy = 0; s.air = true; s.airT = 0;
        if (s.energy <= 0) kill(s);
      }
      function hurt(s, amt, by) {
        if (s.out || s.done) return;
        if (s.shield > 0) { if (!s.ai) K.sfx.tone(1200, 0.08, 'triangle', 0.06); return; }
        s.energy -= amt * s.dmg; s.flash = 0.25;
        if (by && by !== s && by === me) me.hits++;
        if (!s.ai) { hitFlash = 0.3; }
        if (s.energy <= 0) kill(s);
      }
      function kill(s) {
        s.energy = 0; s.out = true; s.v = 0; s.mesh.visible = false; boom(s, 40);
        if (s === me) { say('ELIMINATED!', 3); K.sfx.noise(1.2, 0.3, 800, 0, 'lowpass', 60); } else say(s.n + ' IS OUT!', 1.5);
      }
      function boom(s, n) { if (!fxA) return; const p = L.atf(s.fi, s.d, 1, V1); for (let k = 0; k < n; k++) fxA.emit(p.x, p.y, p.z, (Math.random() - 0.5) * 22, Math.random() * 14, (Math.random() - 0.5) * 22, 0.8, [0xffffff, 0xffd040, 0xff5a1a][k % 3], 3, { g: 8, grow: 1 }); K.sfx.noise(0.5, 0.2, 900, 0, 'lowpass', 100); }
      // ---- weapons
      function pickWep(s) { const p = s.place / 7; const w = [5 - p * 2, 1 + p * 4, 4 - p * 3, 2 + p, 1 + p * 4, p * 3]; let tot = w.reduce((a, b) => a + b, 0), r = Math.random() * tot; for (let n = 0; n < w.length; n++) { r -= w[n]; if (r < 0) return WEPS[n]; } return 'BOLTS'; }
      const WG = {};
      function wepGeo(k) {
        if (WG[k]) return WG[k];
        const P = [], a = (geo, x, y, z, c, rx) => P.push({ geo, m: RK.M(T, x, y, z, 0, 1, 1, 1, rx || 0), c });
        if (k === 'bolt') { a(new T.CylinderGeometry(0.18, 0.18, 1.6, 6), 0, 0, 0, 0xffe14a, Math.PI / 2); a(new T.ConeGeometry(0.22, 0.5, 6), 0, 0, 1.0, 0xff5a1a, Math.PI / 2); }
        else if (k === 'seeker') { a(new T.CylinderGeometry(0.3, 0.3, 2, 8), 0, 0, 0, 0xffffff, Math.PI / 2); a(new T.ConeGeometry(0.32, 0.7, 8), 0, 0, 1.35, 0xff2a2a, Math.PI / 2); for (const s of [-1, 1]) { a(new T.BoxGeometry(1.2, 0.06, 0.4), 0, 0, -0.7, 0xff2a2a); a(new T.BoxGeometry(0.06, 1.2, 0.4), 0, 0, -0.7, 0xff2a2a); } }
        else if (k === 'mine') { a(new T.IcosahedronGeometry(0.6, 0), 0, 0, 0, 0xff2a8a); for (let q = 0; q < 6; q++) a(new T.ConeGeometry(0.12, 0.5, 4), Math.sin(q) * 0.55, Math.cos(q * 1.3) * 0.4, Math.cos(q) * 0.55, 0xffd0f0); }
        else { a(new T.BoxGeometry(18, 1.6, 1.2), 0, 0.5, 0, 0xc08aff); }
        const g = RK.merge(T, P); P.forEach(p => p.geo.dispose()); return WG[k] = g;
      }
      function shotMesh(k) { const m = new T.Mesh(wepGeo(k), k === 'quake' ? matGlow : matG); T3.scene.add(m); return m; }
      function fire(s) {
        const w = s.wep; s.wep = '';
        if (w === 'TURBO') { s.boost = 1.6; if (!s.ai) { say('TURBO!', 0.8); K.sfx.noise(0.7, 0.15, 900, 0, 'bandpass', 3000); } return; }
        if (w === 'SHIELD') { s.shield = 4; if (!s.ai) { say('SHIELD!', 0.8); K.sfx.tone(400, 0.5, 'sine', 0.08, 0, 1200); } return; }
        if (w === 'BOLTS') { for (const o of [-1.6, 0, 1.6]) shots.push({ k: 'bolt', fi: s.fi + 2, d: s.d + o, v: s.v + 70, life: 2.2, owner: s, m: shotMesh('bolt') }); if (!s.ai) K.sfx.noise(0.3, 0.15, 2000, 0, 'bandpass', 500); return; }
        if (w === 'SEEKER') { const p = rank().indexOf(s), t = p > 0 ? rank()[p - 1] : null; shots.push({ k: 'seeker', fi: s.fi + 2, d: s.d, v: Math.max(80, s.v + 35), life: 5, owner: s, tgt: t, m: shotMesh('seeker') }); if (!s.ai) K.sfx.tone(500, 0.4, 'sawtooth', 0.06, 0, 1500); else if (t === me) say('SEEKER LOCKED ON YOU!', 1.2); return; }
        if (w === 'MINES') { s.mines = 5; s.mineT = 0; if (!s.ai) say('MINES DROPPED', 0.8); return; }
        if (w === 'JAQUAKE') { shots.push({ k: 'quake', fi: s.fi + 3, d: 0, v: 110, life: 3.5, owner: s, hit: new Set([s]), m: shotMesh('quake') }); K.sfx.noise(1.5, 0.2, 200, 0, 'lowpass', 40); shake = Math.max(shake, 0.35); if (!s.ai) say('JAQUAKE!', 1); }
      }
      function shotsStep(dt) {
        const N = L.N;
        for (const s of ships) if (s.mines > 0) { s.mineT -= dt; if (s.mineT <= 0) { s.mineT = 0.12; s.mines--; shots.push({ k: 'mine', fi: (s.fi - 2 + N) % N, d: clamp(s.d + (Math.random() - 0.5) * 6, -FL.hw[L.wrap(Math.round(s.fi))] + 1.5, FL.hw[L.wrap(Math.round(s.fi))] - 1.5), v: 0, life: 40, owner: s, t: 0, m: shotMesh('mine') }); } }
        for (const x of shots) {
          x.life -= dt; x.t = (x.t || 0) + dt;
          if (x.k === 'seeker' && x.tgt && !x.tgt.out) { x.d += (x.tgt.d - x.d) * Math.min(1, dt * 4); }
          x.fi = (x.fi + x.v * dt / L.step + N) % N;
          const i = L.wrap(Math.round(x.fi));
          if (x.k === 'quake') { const p = L.atf(x.fi, 0, 0.3 + Math.sin(x.t * 20) * 0.3, x.m.position); M4.makeBasis(V4.copy(L.R[i]).negate(), L.U[i], L.D[i]); x.m.quaternion.setFromRotationMatrix(M4); x.m.scale.set(FL.hw[i] / 9, 1 + Math.sin(x.t * 30) * 0.3, 1); if (fxA && K.frame % 2 === 0) fxA.emit(p.x + L.R[i].x * (Math.random() - 0.5) * FL.hw[i] * 2, p.y + 1, p.z + L.R[i].z * (Math.random() - 0.5) * FL.hw[i] * 2, 0, 8, 0, 0.4, 0xc08aff, 2);
            for (const s of ships) if (!x.hit.has(s) && !s.air) { let df = (s.fi - x.fi) * L.step; if (df > L.L / 2) df -= L.L; if (df < -L.L / 2) df += L.L; if (Math.abs(df) < 4) { x.hit.add(s); hurt(s, 20, x.owner); s.slow = 0.8; s.v *= 0.6; if (s === me) { shake = 0.5; say('QUAKED!', 1); } } }
            for (const y of shots) if (y.k === 'mine' && y.life > 0) { let df = (y.fi - x.fi) * L.step; if (df > L.L / 2) df -= L.L; if (Math.abs(df) < 4) y.life = 0; }
            continue; }
          L.atf(x.fi, x.d, x.k === 'mine' ? 0.7 + rampH(i) : 1.0 + rampH(i), x.m.position);
          M4.makeBasis(V4.copy(L.R[i]).negate(), L.U[i], L.D[i]); x.m.quaternion.setFromRotationMatrix(M4); if (x.k === 'mine') x.m.rotation.y += x.t * 2;
          if (x.k !== 'mine' && fxA && K.frame % 2 === 0) fxA.emit(x.m.position.x, x.m.position.y, x.m.position.z, 0, 1, 0, 0.3, x.k === 'seeker' ? 0xff5a2a : 0xffe14a, 1.4, { grow: 0.2 });
          for (const s of ships) {
            if (s.out || (s === x.owner && x.t < 1) || s.respawn > 0) continue;
            let df = (s.fi - x.fi) * L.step; if (df > L.L / 2) df -= L.L; if (df < -L.L / 2) df += L.L;
            if (Math.abs(df) < (x.k === 'mine' ? 2.2 : 3) && Math.abs(s.d - x.d) < 2.0 && Math.abs(s.y - (trackY(x.fi, x.d) + 1.1)) < 3) {
              hurt(s, x.k === 'bolt' ? 10 : x.k === 'seeker' ? 18 : 9, x.owner); s.slow = x.k === 'seeker' ? 1 : 0.6; s.v *= x.k === 'seeker' ? 0.5 : 0.75; x.life = 0;
              if (fxA) for (let q = 0; q < 16; q++) fxA.emit(x.m.position.x, x.m.position.y, x.m.position.z, (Math.random() - 0.5) * 14, Math.random() * 8, (Math.random() - 0.5) * 14, 0.5, q % 2 ? 0xffd040 : 0xff3a1a, 2.4, { g: 10 });
              if (s === me) { shake = Math.max(shake, 0.35); say(s.shield > 0 ? 'SHIELDED!' : 'HIT!', 0.8); K.sfx.noise(0.4, 0.2, 900, 0, 'lowpass', 100); } else if (x.owner === me) { say(s.n + ' HIT!', 0.9); K.sfx.seq([[81, 0.25], [76, 0.5]], { bpm: 400, vol: 0.08 }); }
              break;
            }
          }
        }
        for (const x of shots) if (x.life <= 0) T3.scene.remove(x.m);
        shots = shots.filter(x => x.life > 0);
      }
      // ---- the computer pilots
      function aiInput(s, dt) {
        const inp = { steer: 0, thrust: 1, ab: 0, fire: false, absorb: false, pitch: 0 };
        if (s.done) return inp;
        const N = L.N, i = L.wrap(Math.round(s.fi)), hw = FL.hw[i] - 1.6;
        let curv = 0; for (let j = 4; j < 30; j += 3) { const c = L.C[L.wrap(i + j)]; if (Math.abs(c) > Math.abs(curv)) curv = c; }
        let td = FL.line[L.wrap(i + 6)] + s.lane * 0.6 + Math.sin(raceT * 0.5 + s.wob) * 1.2;
        // pit for energy
        let toPit = (L.wrap(pitA - i + N)) % N; if (s.energy < 40 && toPit < 60) td = FL.hw[i] - 2.6; if (FL.pit[i] && s.energy < 90) td = FL.hw[i] - 2.6;
        for (const o of ships) if (o !== s && !o.out) { let a = (o.fi - s.fi); if (a < -N / 2) a += N; if (a > N / 2) a -= N; if (a > 0 && a < 8 && Math.abs(o.d - td) < 2.6) td += (o.d > td ? -1 : 1) * 3; }
        for (const x of shots) if (x.k === 'mine') { let a = x.fi - s.fi; if (a < -N / 2) a += N; if (a > 0 && a < 16 && Math.abs(x.d - td) < 2.4) td += (x.d > td ? -1 : 1) * 3; }
        td = clamp(td, -hw, hw);
        const rate = s.hnd * clamp(s.v / 20, 0.3, 1), need = L.C[L.wrap(i + 2)] * s.v / rate;
        const wantA = clamp(Math.atan2(td - s.d, 14), -0.6, 0.6);
        inp.steer = clamp((wantA - s.a) * 3 + need, -1, 1);
        if (Math.abs(need) > 0.85) inp.ab = Math.sign(need) * clamp((Math.abs(need) - 0.85) * 2.5, 0, 1);
        // weapons
        if (s.wep) { s.cool -= dt; if (s.cool <= 0) { s.cool = 0.5 + Math.random() * 0.8; const p = s.place, ahead = rank()[p - 1], behind = rank()[p + 1];
          const gapA = ahead ? ((ahead.prog - s.prog) * L.step) : 1e9, gapB = behind ? ((s.prog - behind.prog) * L.step) : 1e9;
          if ((s.wep === 'BOLTS' && gapA < 70 && Math.abs(ahead.d - s.d) < 3) || (s.wep === 'SEEKER' && gapA < 130) || (s.wep === 'MINES' && gapB < 45) || (s.wep === 'TURBO' && Math.abs(curv) < 0.008) || (s.wep === 'SHIELD' && (s.energy < 50 || shots.some(x => x.tgt === s))) || (s.wep === 'JAQUAKE' && p > 1)) inp.fire = true;
          if (s.energy < 28 && s.wep !== 'SHIELD') { inp.fire = false; inp.absorb = true; } } }
        return inp;
      }

      // ---------------------------------------------------------------- game state and flow
      let msg = '', msgT = 0, paused = false, psel = 0, idle = 0, count = 0, raceT = 0, finT = 0, reported = false, results = null, champ = null, introT = 0, demoT = 0, demoCam = 0, finalLap = false, trackPrev = -1, ghost = null, ghRec = null, ghostMesh = null;
      const sel = { main: 0, cls: 0, team: sv.team, trk: 0, opt: 0, how: 0, rec: 0 };
      let flow = 'champ';
      function say(s, t) { msg = s; msgT = t || 1.4; }
      saveCard = () => { saveT = 1.4; };
      const song = n => sv.opt.mus ? SONGS[n] : null;
      const music = s => K.music(s || null);
      const raceSong = () => { const s = song(TH.song); return s && finalLap ? Object.assign({}, s, { bpm: Math.round(s.bpm * 1.08) }) : s; };
      const scoreCap = s => Math.max(0, Math.min(Math.floor(s), 30000, Math.floor(150 * (K.t + 4))));
      let garage = null;
      function buildGarage() {
        if (garage) return; garage = new T.Group(); garage.position.set(0, -300, 0); T3.scene.add(garage);
        const P = [], G = [];
        P.push({ geo: new T.CylinderGeometry(6, 6.6, 0.8, 6), m: RK.M(T, 0, -0.4, 0), c: 0x2a2a3a }); G.push({ geo: new T.TorusGeometry(6.3, 0.12, 4, 6), m: RK.M(T, 0, 0.02, 0, 0, 1, 1, 1, Math.PI / 2), c: 0x2ae0ff });
        for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; P.push({ geo: new T.BoxGeometry(6, 14, 0.5), m: RK.M(T, Math.sin(a) * 20, 6, Math.cos(a) * 20, a), c: 0x1a1a2a }); G.push({ geo: new T.BoxGeometry(0.3, 14, 0.2), m: RK.M(T, Math.sin(a + 0.13) * 19.6, 6, Math.cos(a + 0.13) * 19.6, a), c: k % 2 ? 0xff2a8a : 0x2ae0ff }); }
        P.push({ geo: new T.CylinderGeometry(21, 21, 0.2, 12), m: RK.M(T, 0, -0.8, 0), c: 0x14141e });
        garage.add(new T.Mesh(RK.merge(T, P), matV)); garage.add(new T.Mesh(RK.merge(T, G), matG)); P.concat(G).forEach(p => p.geo.dispose());
      }
      let showcase = null;
      function showShip(team, at) { if (showcase) shipsG.remove(showcase); showcase = shipMesh(team); showcase.position.copy(at); showcase.scale.setScalar(1.4); return showcase; }
      function goTitle() {
        mode = 'title'; mt = 0; idle = 0; paused = false; champ = null; results = null; cfg.kind = 'title';
        if (trackPrev !== 0 || !L) { buildTrack(0); trackPrev = 0; }
        clearShips(); if (showcase) { shipsG.remove(showcase); showcase = null; }
        ships = TEAMS.slice(0, 4).flatMap((t, n) => t.pilots.map(p => mkShip(n, p, true))); gridUp(ships); doRank();
        music(song(6));
      }
      function startDemo() {
        mode = 'demo'; demoT = 0; cfg.kind = 'demo'; cfg.cls = 0;
        const open = TRACKS.map((t, i) => i).filter(trackOpen), ti = open[(Math.random() * open.length) | 0];
        buildTrack(ti); trackPrev = ti; clearShips();
        ships = TEAMS.slice(0, 4).flatMap((t, n) => t.pilots.map(p => mkShip(n, p, true, 0.96 + Math.random() * 0.05))); ships.sort(() => Math.random() - 0.5); gridUp(ships); me = ships[0]; doRank();
        raceT = 0; music(song(TH.song));
      }
      function setupRace() {
        reported = false; results = null; finalLap = false; if (showcase) { shipsG.remove(showcase); showcase = null; }
        const ti = cfg.track; if (trackPrev !== ti) { buildTrack(ti); trackPrev = ti; } else { for (const s of shots) T3.scene.remove(s.m); shots = []; }
        clearShips(); const cls = CLASSES[cfg.cls];
        if (cfg.kind === 'tt') { me = mkShip(sel.team, '', false); ships = [me]; }
        else {
          const field = []; TEAMS.slice(0, 4).forEach((t, n) => t.pilots.forEach(p => field.push([n, p])));
          let mine = field.findIndex(f => f[0] === sel.team); if (mine < 0) mine = 0; field.splice(mine, 1); // (you take one of your team's seats)
          let order = champ && champ.order ? champ.order.slice() : null;
          const all = field.map(([t, p]) => mkShip(t, p, true, cls.ai * (0.96 + Math.random() * 0.05)));
          me = mkShip(sel.team, '', false); all.push(me);
          if (order) all.sort((a, b) => order.indexOf(a.n) - order.indexOf(b.n)); else { const rest = all.filter(s => s !== me).sort(() => Math.random() - 0.5); rest.push(me); all.splice(0, all.length, ...rest); }
          ships = all;
        }
        gridUp(ships); doRank();
        ghost = null; ghRec = null; if (ghostMesh) { shipsG.remove(ghostMesh); ghostMesh = null; }
        if (cfg.kind === 'tt') { ghRec = RK.ghost.rec(); const s = ghLoad(ti), bar = s.indexOf('|'); if (bar > 0) { const tm = clamp(+s.slice(0, bar) | 0, 0, TEAMS.length - 1); ghost = RK.ghost.play(s.slice(bar + 1)); if (ghost.n > 20) ghostMesh = shipMesh(tm, true); else ghost = null; } }
        mode = 'loading'; loadT = 0; introT = 0; music(null);
      }
      function startCount() { mode = 'count'; count = 3.8; raceT = 0; me.early = null; }
      function newChamp() { champ = { cls: cfg.cls, race: 0, pts: {}, order: null, scores: [] }; cfg.kind = 'champ'; cfg.track = CHAMP[0]; setupRace(); }
      function finishRace() {
        mode = 'finish'; finT = 0; music(null); const pos = me.place;
        if (me.out) say('ELIMINATED', 3); else { say(cfg.kind === 'tt' ? 'FINISHED' : pos === 0 ? 'WINNER!' : ORD[pos] + ' PLACE', 3); K.sfx.seq(pos === 0 ? [[69, 0.5], [76, 0.5], [81, 0.5], [88, 1.5]] : [[69, 0.5], [76, 0.5], [81, 1.5]], { bpm: 200, vol: 0.1, wave: 'sawtooth' }); }
        if (me.bestLap && (!sv.lap[cfg.track] || me.bestLap < sv.lap[cfg.track])) sv.lap[cfg.track] = Math.round(me.bestLap * 100) / 100;
        sv.races++; save();
      }
      function settle() { for (const s of ships) if (!s.done && !s.out) { const left = Math.max(0, 3 * L.N - s.prog), sp = Math.max(1, s.prog) / Math.max(1, raceT); s.ft = raceT + left / Math.max(sp, 4) + Math.random() * 0.3; s.done = true; } doRank(); }
      function raceScore() { const tr = TRACKS[cfg.track], cls = CLASSES[cfg.cls]; if (me.out) return Math.round((300 + Math.min(10, me.hits) * 100) * cls.mult); return Math.round((BASE[me.place] + clamp(Math.round((tr.rec * 3.4 - me.ft) * 25), 0, 800) + Math.min(10, me.hits) * 100) * cls.mult); }
      function endRace() {
        settle(); const rows = rank().map((s, n) => ({ n: s.n, team: s.team, t: s.ft, out: s.out, me: s === me, add: s.out ? 0 : PTS[n] }));
        results = { rows, t: 0, sc: raceScore() };
        if (champ) { rank().forEach((s, n) => { champ.pts[s.n] = (champ.pts[s.n] || 0) + (s.out ? 0 : PTS[n]); champ.teamOf = champ.teamOf || {}; champ.teamOf[s.n] = s.team; }); champ.scores.push(results.sc); champ.order = rank().map(s => s.n).reverse(); }
        mode = 'results'; mt = 0; music(song(6));
      }
      function endChamp() {
        const st = Object.keys(champ.pts).map(n => ({ n, p: champ.pts[n], team: champ.teamOf[n] })).sort((a, b) => b.p - a.p);
        const place = st.findIndex(x => x.n === me.n), msgs = [];
        if (place < 3) { const was = sv.champ[champ.cls] | 0; if (!was || place + 1 < was) sv.champ[champ.cls] = place + 1; }
        if (place === 0) { K.secret('rm.grav.champ'); if (champ.cls === 0 && !sv.unl.sup) { sv.unl.sup = 1; sv.unl.bonus = 1; msgs.push('SUPERSONIC CLASS AND PHANTOM ZONE UNLOCKED!'); } if (champ.cls === 1 && !sv.unl.nullp) { sv.unl.nullp = 1; msgs.push('THE NULLPOINT SHIP IS YOURS!'); } }
        champ.final = st; champ.place = place; champ.msgs = msgs; champ.total = Math.round(champ.scores.reduce((a, b) => a + b, 0) + (place < 3 ? [4000, 2500, 1500][place] * CLASSES[champ.cls].mult : 0)); save();
        mode = 'podium'; mt = 0; buildGarage(); clearShips();
        if (!garage.pod) { const P = [], G = []; [[0, 3.2], [-9, 2.2], [9, 1.4]].forEach(([x, h], n) => { P.push({ geo: new T.BoxGeometry(7, h, 6), m: RK.M(T, x, h / 2, 0), c: 0x22223a }); G.push({ geo: new T.BoxGeometry(7.1, 0.2, 6.1), m: RK.M(T, x, h, 0), c: [0xffe14a, 0xd8d8f0, 0xff8a3a][n] }); G.push({ geo: new T.BoxGeometry(1.6, 1.4, 0.1), m: RK.M(T, x, h / 2, 3.02), c: [0xffe14a, 0xd8d8f0, 0xff8a3a][n] }); });
          garage.pod = new T.Group(); garage.pod.add(new T.Mesh(RK.merge(T, P), matV)); garage.pod.add(new T.Mesh(RK.merge(T, G), matG)); P.concat(G).forEach(p => p.geo.dispose()); garage.add(garage.pod); }
        garage.pod.visible = true;
        st.slice(0, 3).forEach((x, n) => { const m = shipMesh(x.team); m.position.set([0, -9, 9][n], -300 + [3.2, 2.2, 1.4][n], 0); m.rotation.y = Math.PI + (n - 1) * 0.3; m.scale.setScalar(1.3); });
        music(null); K.sfx.seq([[69, 0.5], [72, 0.5], [76, 0.5], [81, 1.5], [79, 0.5], [83, 0.5], [88, 2]], { bpm: 190, vol: 0.1, wave: 'sawtooth' });
      }
      function report(score, title, text) { if (reported) return; reported = true; const sc = scoreCap(score); if (sc > 0) { sv.hi.push({ n: myName(), s: sc }); sv.hi.sort((a, b) => b.s - a.s); sv.hi.length = Math.min(sv.hi.length, 5); save(); } K.over(sc, { title, text }); }

      // ---------------------------------------------------------------- menus
      const MAIN = ['CHAMPIONSHIP', 'SINGLE RACE', 'TIME TRIAL', 'RECORDS', 'OPTIONS', 'HOW TO PLAY'];
      const nav = (n, cur) => { if (K.pressed('up')) { K.sfx.tone(1200, 0.03, 'square', 0.04); return (cur + n - 1) % n; } if (K.pressed('down')) { K.sfx.tone(1200, 0.03, 'square', 0.04); return (cur + 1) % n; } return cur; };
      const ok = () => K.pressed('a') || K.pressed('start'), back = () => K.pressed('b');
      const beep = () => K.sfx.tone(1600, 0.05, 'square', 0.05), boop = () => K.sfx.tone(300, 0.08, 'square', 0.05);
      let previewT = -1, loadT = 0, saveT = 0, cardT = 0;
      const cheat = {}; let cbuf = [];
      const CHEATS = [{ id: 'all', n: 'ALL TRACKS AND CLASSES', seq: ['l', 'r', 'l', 'r', 'up', 'down', 'a'] }, { id: 'rainbow', n: 'RAINBOW TRAILS', seq: ['up', 'up', 'down', 'down', 'x'] }];
      function cheatStep() {
        for (const b of ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'l', 'r']) if (K.pressed(b)) {
          cbuf.push(b); if (cbuf.length > 12) cbuf.shift();
          for (const c of CHEATS) if (cbuf.length >= c.seq.length && c.seq.every((x, i) => cbuf[cbuf.length - c.seq.length + i] === x)) { cheat[c.id] = !cheat[c.id]; cbuf = []; if (c.id === 'all') window.__gravCheatAll = cheat.all; say(c.n + (cheat[c.id] ? ' ON' : ' OFF'), 2.5); K.sfx.seq([[69, 0.25], [76, 0.25], [81, 0.25], [88, 0.75]], { bpm: 420, vol: 0.09, wave: 'sawtooth' }); }
        }
      }
      function menuStep(dt) {
        mt += dt;
        if (mode === 'title' || mode === 'main') cheatStep();
        if (mode === 'title') { idle += dt; if (K.any()) { idle = 0; if (ok()) { beep(); mode = 'main'; mt = 0; } } if (idle > 16) startDemo(); return; }
        if (mode === 'demo') { demoT += dt; if (K.any() || demoT > 40) goTitle(); return; }
        if (mode === 'main') { sel.main = nav(MAIN.length, sel.main); if (back()) { boop(); goTitle(); return; }
          if (ok()) { beep(); const m = MAIN[sel.main]; mt = 0; if (m === 'CHAMPIONSHIP') { flow = 'champ'; mode = 'cls'; } else if (m === 'SINGLE RACE') { flow = 'race'; mode = 'cls'; } else if (m === 'TIME TRIAL') { flow = 'tt'; cfg.cls = 0; toTeam(); } else if (m === 'RECORDS') { mode = 'records'; sel.rec = 0; } else if (m === 'OPTIONS') { mode = 'options'; sel.opt = 0; } else { mode = 'how'; sel.how = 0; } } return; }
        if (mode === 'cls') { sel.cls = nav(2, sel.cls); if (back()) { boop(); mode = 'main'; return; } if (ok()) { if (sel.cls === 1 && !supOpen()) { boop(); say('WIN THE SUB-ZIP CHAMPIONSHIP FIRST', 2); return; } beep(); cfg.cls = sel.cls; toTeam(); } return; }
        if (mode === 'team') {
          const c = sel.team; if (K.pressed('left')) sel.team = (sel.team + TEAMS.length - 1) % TEAMS.length; if (K.pressed('right') || K.pressed('down') || K.pressed('up')) sel.team = (sel.team + 1) % TEAMS.length;
          if (c !== sel.team) { K.sfx.tone(700 + sel.team * 120, 0.05, 'square', 0.05); showShip(sel.team, V1.set(0, -298.6, 0)); }
          if (back()) { boop(); mode = flow === 'tt' ? 'main' : 'cls'; if (showcase) { shipsG.remove(showcase); showcase = null; } return; }
          if (ok()) { if (!teamOpen(sel.team)) { boop(); say('WIN THE SUPERSONIC CHAMPIONSHIP TO FLY IT', 2); return; } beep(); K.sfx.noise(0.6, 0.1, 400, 0, 'bandpass', 3000); sv.team = sel.team; save(); if (showcase) { shipsG.remove(showcase); showcase = null; }
            if (flow === 'champ') newChamp(); else { mode = 'track'; sel.trk = trackOpen(sel.trk) ? sel.trk : 0; previewT = 0.2; mt = 0; } }
          if (showcase) showcase.rotation.y = K.t * 0.6;
          return;
        }
        if (mode === 'track') { const c = sel.trk; sel.trk = nav(TRACKS.length, sel.trk); if (c !== sel.trk) previewT = 0.35;
          if (previewT > 0) { previewT -= dt; if (previewT <= 0 && trackOpen(sel.trk) && trackPrev !== sel.trk) { buildTrack(sel.trk); trackPrev = sel.trk; clearShips(); } }
          if (back()) { boop(); toTeam(); return; } if (ok()) { if (!trackOpen(sel.trk)) { boop(); say('WIN THE SUB-ZIP CHAMPIONSHIP TO OPEN IT', 2); return; } beep(); cfg.track = sel.trk; cfg.kind = flow; champ = null; setupRace(); } return; }
        if (mode === 'options') { sel.opt = nav(4, sel.opt); if (back()) { boop(); mode = 'main'; save(); return; } if (ok() || K.pressed('left') || K.pressed('right')) { beep(); if (sel.opt === 0) { sv.opt.mus = sv.opt.mus ? 0 : 1; music(song(6)); } else if (sel.opt === 1) sv.opt.cam = sv.opt.cam ? 0 : 1; else if (sel.opt === 2) sv.opt.auto = sv.opt.auto ? 0 : 1; else if (ok()) mode = 'main'; save(); } return; }
        if (mode === 'records') { if (K.pressed('left') || K.pressed('right')) { sel.rec = 1 - sel.rec; beep(); } if (back() || ok()) { boop(); mode = 'main'; } return; }
        if (mode === 'how') { if (K.pressed('right') || ok()) { if (sel.how < 2) { sel.how++; beep(); } else if (ok()) { mode = 'main'; beep(); } } if (K.pressed('left') && sel.how > 0) { sel.how--; beep(); } if (back()) { boop(); mode = 'main'; } return; }
      }
      function toTeam() { mode = 'team'; mt = 0; buildGarage(); if (garage.pod) garage.pod.visible = false; clearShips(); showShip(sel.team, V1.set(0, -298.6, 0)); }

      // ---------------------------------------------------------------- the frame
      function playerInput() {
        if (window.__rmAuto) return aiInput(me, 1 / 60);
        const s = K.stick();
        return { steer: clamp(s.x, -1, 1), thrust: K.held('a') || sv.opt.auto ? 1 : 0, ab: (K.held('r') ? 1 : 0) - (K.held('l') ? 1 : 0), fire: K.pressed('b'), absorb: K.pressed('x'), pitch: s.y };
      }
      function raceStep(dt) {
        const kind = cfg.kind;
        if (mode === 'race' || mode === 'finish' || mode === 'demo') raceT += dt;
        for (const s of ships) {
          if (s.respawn > 0) { s.respawn -= dt; }
          let inp;
          if (mode === 'count' || s.out) inp = { steer: 0, thrust: mode === 'count' && K.held('a') && s === me ? 0 : 0, ab: 0 };
          else if (s.ai || kind === 'demo' || s.done || mode === 'finish') inp = aiInput(s, dt);
          else inp = playerInput();
          if (s.ai && mode === 'race' && kind !== 'demo') { const gap = (me.prog - s.prog) * L.step, rub = clamp(1 + gap / 500, 0.92, 1.1); s.aiMul = s.skill * rub; }
          fly(s, inp, dt);
          if (!s.done && !s.out && (mode === 'race' || mode === 'demo')) {
            const lap = Math.floor(s.prog / L.N) + 1;
            if (lap > s.lap && s.lap > 0) { const lt = raceT - s.lapStart; s.laps.push(lt); s.lapStart = raceT; if (!s.bestLap || lt < s.bestLap) s.bestLap = lt;
              if (s === me && kind !== 'demo') { if (lt < TRACKS[cfg.track].rec) { K.secret('rm.grav.lap'); say('LAP RECORD! ' + fmt(lt), 2.2); K.sfx.seq([[81, 0.25], [85, 0.25], [88, 0.25], [93, 1]], { bpm: 400, vol: 0.1 }); } else if (lap === 3) { say('FINAL LAP', 2); finalLap = true; music(raceSong()); } else if (lap < 4) say('LAP ' + lap + '  ' + fmt(lt), 1.6); } }
            s.lap = Math.max(s.lap, lap);
            if (lap >= 4) { s.done = true; s.ft = raceT; if (s === me && kind !== 'demo') finishRace(); }
          }
          if (s === me && s.out && mode === 'race') finishRace();
        }
        // ships nudge each other
        for (let a = 0; a < ships.length; a++) for (let b = a + 1; b < ships.length; b++) {
          const A = ships[a], B = ships[b]; if (A.out || B.out) continue; let df = (B.fi - A.fi) * L.step; if (df > L.L / 2) df -= L.L; if (df < -L.L / 2) df += L.L;
          const dd = B.d - A.d; if (Math.abs(df) < 3.4 && Math.abs(dd) < 2.4 && Math.abs(A.y - B.y) < 2) { const push = (2.4 - Math.abs(dd)) / 2 * Math.sign(dd || 1); A.d -= push; B.d += push; if (df > 0) A.v *= 0.985; else B.v *= 0.985; if ((A === me || B === me) && K.frame % 6 === 0) K.sfx.noise(0.06, 0.08, 1500); }
        }
        shotsStep(dt);
        doRank();
        if (ghRec && mode === 'race' && !me.done) ghRec.add(dt, me.prog, me.y, me.d, me.a);
      }
      function update(dt) {
        if (mode === 'load' || mode === 'view') return;
        if (shake > 0) shake = Math.max(0, shake - dt); if (hitFlash > 0) hitFlash -= dt; if (saveT > 0) saveT -= dt; if (msgT > 0) msgT -= dt;
        if (padTex) padTex.offset.y -= dt * 3;
        for (const t of turbines) t.rotation.z += dt * 1.6;
        if (fxN && TH && K.frame % 4 === 0) { const c = T3.cam.position; if (TH.props === 'aqua') fxN.emit(c.x + (Math.random() - 0.5) * 60, c.y - 10, c.z + (Math.random() - 0.5) * 60, 0, 5, 0, 5, 0xbfffff, 0.6, { a: 0.6 }); if (TR && TR.th === 'frost') fxN.emit(c.x + (Math.random() - 0.5) * 60, c.y + 16, c.z + (Math.random() - 0.5) * 60, 0, -5, 0, 4, 0xffffff, 0.45); }
        if (['title', 'main', 'cls', 'team', 'track', 'options', 'records', 'how', 'demo'].includes(mode)) { menuStep(dt); if (mode === 'demo' && L) raceStep(dt); return; }
        if (mode === 'loading') { loadT += dt; if (loadT > 1.7) mode = 'intro'; return; }
        if (mode === 'card') { cardT += dt; if (cardT > 2.6 || (cardT > 0.8 && ok())) goTitle(); return; }
        if (mode === 'intro') { introT += dt; if (introT > 3.6 || (introT > 0.4 && ok())) startCount(); return; }
        if (mode === 'podium') { mt += dt; if (fxA && K.frame % 30 === 0) { const x = (Math.random() - 0.5) * 30, y = -288 + Math.random() * 6; for (let q = 0; q < 26; q++) fxA.emit(x, y, -10, Math.cos(q / 26 * TAU) * 7, Math.sin(q / 26 * TAU) * 7, 0, 1, [0xff2a8a, 0x2ae0ff, 0xffe14a][(K.frame / 30 | 0) % 3], 1.5, { g: 3 }); K.sfx.noise(0.3, 0.06, 1500); }
          const done = mt > 4 && ok(); if (done || mt > 14) { const p = champ.place; report(champ.total, p === 0 ? 'CHAMPION!' : p < 3 ? ORD[p] + ' OVERALL' : 'SEASON OVER', `${CLASSES[champ.cls].n} CHAMPIONSHIP  ${ORD[p]} WITH ${champ.pts[me.n] | 0} POINTS` + (champ.msgs.length ? '  ' + champ.msgs.join(' ') : '')); } return; }
        if (mode === 'results') { mt += dt; results.t += dt; if (mt > 1 && ok()) { beep(); if (cfg.kind === 'champ') { mode = 'standings'; mt = 0; } else report(results.sc, me.out ? 'ELIMINATED' : me.place === 0 ? 'WINNER!' : ORD[me.place] + ' PLACE', `${TRACKS[cfg.track].n}  ${CLASSES[cfg.cls].n}  TIME ${fmt(me.ft)}  BEST LAP ${fmt(me.bestLap)}`); } return; }
        if (mode === 'standings') { mt += dt; if (mt > 1 && ok()) { beep(); champ.race++; if (champ.race >= CHAMP.length) endChamp(); else { cfg.track = CHAMP[champ.race]; setupRace(); } } return; }
        if (mode === 'ttres') { mt += dt; if (mt > 1 && ok()) { beep(); report(results.sc, results.title, results.text); } return; }
        if (K.pressed('start') && (mode === 'race' || mode === 'count')) { paused = !paused; psel = 0; K.sfx.tone(paused ? 440 : 880, 0.06); if (paused) music(null); else if (mode === 'race') music(raceSong()); return; }
        if (paused) { psel = nav(3, psel); if (back()) { paused = false; if (mode === 'race') music(raceSong()); }
          if (K.pressed('a')) { beep(); paused = false; if (psel === 0) { if (mode === 'race') music(raceSong()); } else if (psel === 1) { trackPrev = -1; setupRace(); } else goTitle(); } return; }
        if (mode === 'count') { const c0 = Math.ceil(count); count -= dt; const c1 = Math.ceil(count); if (c1 !== c0 && c1 >= 1 && c1 <= 3) K.sfx.tone(330, 0.25, 'sawtooth', 0.08);
          if (K.pressed('a') && me.early == null) me.early = count;
          if (count <= 0) { mode = 'race'; K.sfx.tone(660, 0.6, 'sawtooth', 0.1); music(raceSong()); if (K.held('a') && me.early != null && me.early < 1.0) { me.boost = 1.0; say('BOOST START!', 1.2); } for (const s of ships) if (s.ai && Math.random() < 0.5) s.boost = 0.6; } }
        raceStep(dt);
        if (!me.done && !me.out && mode === 'race' && K.frame % 6 === 0) K.sfx.tone(55 + me.v * 2.4 + (me.boost > 0 ? 30 : 0), 0.11, 'triangle', 0.03);
        if (me.energy < 25 && !me.out && mode === 'race' && K.frame % 40 === 0) K.sfx.tone(1400, 0.08, 'square', 0.04);
        if (mode === 'finish') { finT += dt; if (finT > 4) {
          if (cfg.kind === 'tt') { const t = me.ft, old = sv.tt[cfg.track] || 0, rec = !me.out && (!old || t < old), r3 = TRACKS[cfg.track].rec * 3;
            if (rec) { sv.tt[cfg.track] = Math.round(t * 100) / 100; ghSave(cfg.track, sel.team + '|' + ghRec.str()); } save();
            results = { sc: me.out ? 300 : Math.round(clamp(4200 + (r3 - t) * 120, 600, 9000)), title: me.out ? 'ELIMINATED' : rec ? 'NEW RECORD!' : 'TIME TRIAL', text: `${TRACKS[cfg.track].n}  ${fmt(t)}  BEST LAP ${fmt(me.bestLap)}`, t, rec, old, laps: me.laps.slice() };
            mode = 'ttres'; mt = 0; music(song(6)); }
          else endRace(); } }
      }

      // ---------------------------------------------------------------- poses and the camera
      let viewObj = null, view3 = [0.6, 0.25, 9], camUp = new T.Vector3(0, 1, 0);
      function pose(s, t) {
        const p = L.atf(s.fi, s.d, 0, V1); p.y = s.y + Math.sin(K.t * 3 + s.wob) * 0.1 * (s.air ? 0 : 1);
        s.mesh.position.copy(p);
        const i = L.wrap(Math.floor(s.fi)), D = L.D[i], U = s.air ? V4.set(0, 1, 0).lerp(L.U[i], 0.5).normalize() : L.U[i], R = L.R[i];
        const fwd = V2.copy(D).multiplyScalar(Math.cos(s.a)).addScaledVector(R, Math.sin(s.a)).normalize();
        if (s.air) { fwd.y += clamp(s.vy / Math.max(20, s.v), -0.5, 0.5); fwd.normalize(); }
        const side = V3.crossVectors(U, fwd).normalize(), up2 = new T.Vector3().crossVectors(fwd, side).normalize();
        M4.makeBasis(side, up2, fwd); s.mesh.quaternion.setFromRotationMatrix(M4); s.mesh.rotateZ(-s.roll * 0.6);
        s.mesh.visible = !s.out && !(s.respawn > 0 && (K.frame >> 2) % 2) && !(s.flash > 0 && (K.frame >> 1) % 2);
        s.mesh.glow.visible = s.boost > 0 || (K.frame + t) % 3 !== 0;
        if (fxA && !s.out && s.v > 10 && (s === me || (K.frame + t) % 2 === 0)) { const b = V3.copy(fwd).multiplyScalar(-2.3).add(p); fxA.emit(b.x, b.y + 0.35, b.z, -fwd.x * 4, -fwd.y * 4, -fwd.z * 4, 0.12, cheat.rainbow ? [0xff3a3a, 0xffb000, 0xffe14a, 0x3ad04a, 0x2ab0ff, 0xc03ae0][(K.frame + t) % 6] : s.boost > 0 ? 0xffe14a : s.tm.glow, s.boost > 0 ? 0.32 : 0.2, { grow: 0.04, a: 0.8 }); }
        if (s.shield > 0 && fxA && K.frame % 2 === 0) fxA.emit(p.x + (Math.random() - 0.5) * 4, p.y + Math.random() * 1.5, p.z + (Math.random() - 0.5) * 4, 0, 0, 0, 0.25, 0x5ad8ff, 0.5);
      }
      function placeShips() {
        let sn = 0;
        ships.forEach((s, t) => { pose(s, t); if (!s.out && sn < 9) { const gy = FL.gap[L.wrap(Math.round(s.fi))] ? -1e4 : trackY(s.fi, s.d); if (gy > -1e3) { const p = s.mesh.position; M4.compose(V1.set(p.x, gy + 0.08, p.z), Q.setFromEuler(new T.Euler(0, Math.atan2(L.D[L.wrap(Math.round(s.fi))].x, L.D[L.wrap(Math.round(s.fi))].z) + s.a, 0)), V2.setScalar(clamp(1 - (s.y - gy - 1.1) * 0.06, 0.3, 1))); shadows.setMatrixAt(sn++, M4); } } });
        for (let n = sn; n < 9; n++) shadows.setMatrixAt(n, ZERO); shadows.instanceMatrix.needsUpdate = true;
        if (ghost && ghostMesh && (mode === 'race' || mode === 'count' || mode === 'finish')) { const g = ghost.at(mode === 'count' ? 0 : raceT); if (g) { const fake = { fi: ((g.x % L.N) + L.N) % L.N, d: g.z, a: g.a, y: g.y, air: false, roll: 0, wob: 0, v: 0, out: false, respawn: 0, flash: 0, boost: 0, shield: 0, tm: TEAMS[0], mesh: ghostMesh }; const f0 = fxA; fxA = null; pose(fake, 1); fxA = f0; } }
      }
      function camera(dt) {
        const C = T3.cam; let fv = 70;
        if (mode === 'view') { const [a, e, d] = view3; C.up.set(0, 1, 0); C.position.set(Math.sin(a) * Math.cos(e) * d, -298.6 + Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d); C.lookAt(0, -298.6, 0); sky && sky.follow(C); C.fov = 50; C.updateProjectionMatrix(); return; }
        if (mode === 'team') { C.up.set(0, 1, 0); C.position.set(5, -295.2, 11); C.lookAt(-3.4, -298.6, 0); sky && sky.follow(C); C.fov = 55; C.updateProjectionMatrix(); return; }
        if (mode === 'podium') { const a = Math.sin(mt * 0.3) * 0.5; C.up.set(0, 1, 0); C.position.set(Math.sin(a) * 22, -292, Math.cos(a) * 22 - 4); C.lookAt(0, -297.5, 0); sky && sky.follow(C); C.fov = 55; C.updateProjectionMatrix(); return; }
        if (!L) return;
        let follow = me;
        if (['title', 'main', 'cls', 'track', 'options', 'records', 'how', 'card', 'loading'].includes(mode) || mode === 'intro') {
          const fi = mode === 'intro' ? (L.N * 0.4 + introT * 20) % L.N : (K.t * 12) % L.N;
          const p = L.atf(fi, Math.sin(K.t * 0.3) * 5, 5, V1), q = L.atf((fi + 14) % L.N, 0, 1.5, V2);
          if (mode === 'intro' && introT > 2.3) { const k = clamp((introT - 2.3) / 1.2, 0, 1); p.lerp(L.atf((me.fi - 3 + L.N) % L.N, me.d, 2.8, V3), k); q.lerp(L.atf((me.fi + 5) % L.N, me.d, 1.2, V4), k); }
          C.up.set(0, 1, 0); C.position.copy(p); C.lookAt(q); sky && sky.follow(C); return;
        }
        if (mode === 'demo') { if (K.frame % 480 === 0) demoCam = (demoCam + 1) % 3; follow = rank()[demoCam] || rank()[0]; }
        if ((mode === 'finish' && finT > 1.2) || mode === 'results' || mode === 'standings' || mode === 'ttres') {
          const a = (finT + mt) * 0.4, p = me.mesh.position; C.up.set(0, 1, 0); C.position.set(p.x + Math.sin(a) * 12, p.y + 4, p.z + Math.cos(a) * 12); C.lookAt(p); sky && sky.follow(C); return;
        }
        const s = follow, i = L.wrap(Math.floor(s.fi)), far = sv.opt.cam ? 1 : 0;
        const back = L.atf((s.fi - (far ? 3.4 : 2.6) + L.N) % L.N, s.d - Math.sin(s.a) * 4, 0, V1); back.y = Math.max(s.y + (far ? 3.2 : 2.3), back.y + 1.5);
        C.position.lerp(back, Math.min(1, dt * 12)); if (shake > 0) { C.position.x += (Math.random() - 0.5) * shake; C.position.y += (Math.random() - 0.5) * shake; }
        camUp.lerp(L.U[i], Math.min(1, dt * 6)); C.up.copy(camUp);
        const look = L.atf((s.fi + 5) % L.N, s.d + Math.sin(s.a) * 6, 0, V2); look.y = Math.max(s.y + 0.2, look.y + 1.2); C.lookAt(look);
        fv = 70 + clamp((s.v - 40) * 0.25, 0, 10) + (s.boost > 0 ? 6 : 0); if (Math.abs(C.fov - fv) > 0.1) { C.fov += (fv - C.fov) * Math.min(1, dt * 4); C.updateProjectionMatrix(); }
        sky && sky.follow(C);
      }

      // ---------------------------------------------------------------- the 2D bits on top (a chunky neon PlayStation HUD)
      function big(s, x, y, size, c1, c2, align, stroke) {
        H.save(); H.font = `italic 900 ${size}px "Arial Black", Arial, sans-serif`; H.textAlign = align || 'center'; H.textBaseline = 'middle'; H.lineJoin = 'miter';
        H.lineWidth = Math.max(2, size / 6); H.strokeStyle = stroke || '#000'; H.strokeText(s, x, y);
        const g = H.createLinearGradient(0, y - size / 2, 0, y + size / 2); g.addColorStop(0, c1); g.addColorStop(0.55, c2 || c1); g.addColorStop(0.56, c1); g.addColorStop(1, c2 || c1); H.fillStyle = g; H.fillText(s, x, y); H.restore();
      }
      function panel(x, y, w, h, edge) { H.fillStyle = 'rgba(4,2,16,.78)'; H.beginPath(); H.moveTo(x + 8, y); H.lineTo(x + w, y); H.lineTo(x + w, y + h - 8); H.lineTo(x + w - 8, y + h); H.lineTo(x, y + h); H.lineTo(x, y + 8); H.closePath(); H.fill(); H.strokeStyle = edge || '#2ae0ff'; H.lineWidth = 1.5; H.stroke(); }
      const txt = (s, x, y, c, k) => F.draw(H, s, x, y, c || '#fff', k || 1, '#000');
      const ctr = (s, y, c, k) => F.center(H, s, W / 2, y, c || '#fff', k || 1, '#000');
      const blink = r => ((K.t * (r || 2)) | 0) % 2 === 0;
      let mini = null, miniFor = -1;
      function minimap() {
        if (miniFor !== trackPrev) { miniFor = trackPrev; mini = document.createElement('canvas'); mini.width = mini.height = 58; const g = mini.getContext('2d'); let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; for (const p of L.P) { mnx = Math.min(mnx, p.x); mxx = Math.max(mxx, p.x); mnz = Math.min(mnz, p.z); mxz = Math.max(mxz, p.z); }
          const k = 52 / Math.max(mxx - mnx, mxz - mnz); mini.map = (x, z) => [3 + (mxx - x) * k, 3 + (mxz - z) * k]; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 4; g.beginPath(); L.P.forEach((p, i) => { const [x, y] = mini.map(p.x, p.z); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke(); g.strokeStyle = TH.edge; g.lineWidth = 1.5; g.stroke(); }
        const ox = W - 64, oy = 48; H.drawImage(mini, ox, oy);
        for (const s of ships.slice().reverse()) { if (s.out) continue; const p = L.P[L.wrap(Math.round(s.fi))], [x, y] = mini.map(p.x, p.z), z = s === me ? 4 : 3; H.fillStyle = s === me ? '#fff' : hexs(s.tm.col); H.fillRect(ox + x - z / 2, oy + y - z / 2, z, z); }
      }
      function logo(y) {
        big('ANTI-GRAV', W / 2, y, 36, '#e8f8ff', '#3a8ad8', 'center', '#04021a');
        const t = K.t; big('3000', W / 2 + Math.sin(t * 3) * 2, y + 32, 26, '#ffb0e0', '#ff2a8a', 'center', '#1a0010');
        H.fillStyle = `rgba(42,224,255,${0.5 + Math.sin(t * 6) * 0.3})`; H.fillRect(W / 2 - 110, y + 18, 220, 2);
      }
      function hud() {
        H.clearRect(0, 0, W, HH);
        if (mode === 'load') { ctr('LOADING...', HH / 2, '#2ae0ff'); return; }
        if (mode === 'view') return;
        if (mode === 'card' || mode === 'loading') { H.fillStyle = '#000'; H.fillRect(0, 0, W, HH);
          if (mode === 'card') { panel(40, 70, 240, 90, '#8a8aa8'); ctr('CHECKING MEMORY CARD', 82, '#fff'); ctr('IN SLOT 1' + '...'.slice(0, (cardT * 3 | 0) % 4), 96, '#8a8aa8');
            if (cardT > 1.1) { const has = sv.races > 0 || Object.keys(sv.lap).length; H.fillStyle = '#2a2a6a'; H.fillRect(62, 114, 16, 20); H.fillStyle = '#ff2a8a'; H.fillRect(65, 117, 10, 6); txt(has ? 'ANTI-GRAV 3000 DATA FOUND' : 'NO ANTI-GRAV 3000 DATA', 86, 116, has ? '#9affa0' : '#ffe14a'); txt(has ? 'LOADED FROM BLOCK 1' : 'A NEW SAVE WILL USE 1 BLOCK', 86, 128, '#fff'); } return; }
          const t = loadT, cx = W - 46, cy = HH - 30; H.save(); H.translate(cx, cy); H.rotate(t * 7); H.fillStyle = '#333'; H.beginPath(); H.arc(0, 0, 12, 0, TAU); H.fill(); H.fillStyle = '#9aa0c0'; H.beginPath(); H.arc(0, 0, 11, 0, 1.2); H.lineTo(0, 0); H.fill(); H.fillStyle = '#000'; H.beginPath(); H.arc(0, 0, 3, 0, TAU); H.fill(); H.restore();
          txt('NOW LOADING' + '...'.slice(0, (t * 4 | 0) % 4), W - 170, HH - 34, '#fff'); txt(TRACKS[cfg.track].n, W - 170, HH - 22, '#8a8aa8'); return; }
        if (mode === 'title') { H.fillStyle = 'rgba(4,0,16,.35)'; H.fillRect(0, 0, W, HH); logo(52);
          if (((mt / 6) | 0) % 2 === 1) { panel(70, 106, 180, 104, '#ff2a8a'); ctr('PILOT RANKINGS', 114, '#ff8ad0'); table().forEach((r, n) => { txt((n + 1) + '. ' + r.n, 84, 128 + n * 10, r.mate ? '#fff' : '#9affa0'); txt(String(r.s).padStart(6, ' '), 200, 128 + n * 10, '#2ae0ff'); }); }
          else if (blink(2)) ctr('PRESS START', 160, '#fff', 2);
          if (msgT > 0) ctr(msg, 186, '#9affa0');
          ctr('(C) 1999 PSYCHOFLUX INTERACTIVE', HH - 24, '#8a8aa8'); ctr('PUBLISHED UNDER LICENCE BY COMPUTER FUN ENTERTAINMENT', HH - 13, '#6a6a88'); return; }
        if (mode === 'demo') { raceHud(true); ctr('DEMO', 60, '#2ae0ff', 2); if (blink(2)) ctr('PRESS START', HH - 30, '#fff'); return; }
        if (mode === 'main') { H.fillStyle = 'rgba(4,0,16,.4)'; H.fillRect(0, 0, W, HH); logo(36); panel(86, 86, 148, MAIN.length * 16 + 12);
          MAIN.forEach((s, n) => ctr((n === sel.main ? '> ' : '') + s + (n === sel.main ? ' <' : ''), 94 + n * 16, n === sel.main ? '#2ae0ff' : '#fff'));
          ctr(['FIVE TRACKS. POINTS. GLORY.', 'ONE RACE, ANY TRACK', 'YOU, THE CLOCK, YOUR GHOST', 'RANKINGS AND LAP TIMES', 'MUSIC AND CAMERA', 'CONTROLS AND WEAPONS'][sel.main], 196, '#ff8ad0'); ctr(K.label('a') + ' SELECT   ' + K.label('b') + ' BACK', HH - 14, '#8a8aa8'); if (msgT > 0) ctr(msg, 210, '#ff5a5a'); return; }
        if (mode === 'cls') { H.fillStyle = 'rgba(4,0,16,.45)'; H.fillRect(0, 0, W, HH); big('SPEED CLASS', W / 2, 34, 20, '#e8f8ff', '#3a8ad8'); panel(70, 60, 180, 70);
          CLASSES.forEach((c, n) => { const on = n === sel.cls, open = n === 0 || supOpen(); ctr((on ? '> ' : '') + c.n + (open ? '' : ' (LOCKED)') + (on ? ' <' : ''), 74 + n * 26, !open ? '#666' : on ? '#2ae0ff' : '#fff', on ? 2 : 1); });
          ctr(sel.cls ? 'SERIOUSLY FAST. HOLD ON TO SOMETHING.' : 'FAST ENOUGH FOR MOST PILOTS', 146, '#ff8ad0'); if (msgT > 0) ctr(msg, 164, '#ff5a5a'); return; }
        if (mode === 'team') { const t = TEAMS[sel.team], open = teamOpen(sel.team); big('SELECT TEAM', W / 2, 16, 18, '#e8f8ff', '#3a8ad8'); panel(6, 30, 116, 128, hexs(t.col === 0x50505e ? 0xe8c21a : t.col));
          txt(open ? t.n : '????????', 14, 38, open ? '#fff' : '#666', 2); txt(open ? t.tag.slice(0, 18) : 'LOCKED', 14, 58, '#ff8ad0'); if (open && t.tag.length > 18) txt(t.tag.slice(18), 14, 67, '#ff8ad0');
          [['SPEED', t.spd], ['THRUST', t.thr], ['HANDLING', t.hnd], ['SHIELD', t.shd]].forEach(([l, v], n) => { txt(l, 14, 82 + n * 17, '#fff'); for (let p = 0; p < 5; p++) { H.fillStyle = p < v && open ? ['#2ae0ff', '#ffe14a', '#9aff6a', '#ff2a8a'][n] : 'rgba(255,255,255,.15)'; H.beginPath(); H.moveTo(14 + p * 12, 99 + n * 17); H.lineTo(24 + p * 12, 99 + n * 17); H.lineTo(22 + p * 12, 94 + n * 17); H.lineTo(12 + p * 12, 94 + n * 17); H.fill(); } });
          if (open) ctr('PILOTS: ' + t.pilots.join(' + '), 184, '#8ad8ff'); TEAMS.forEach((tt, n) => { H.fillStyle = n === sel.team ? '#2ae0ff' : 'rgba(255,255,255,.3)'; H.fillRect(W / 2 - 40 + n * 17, 200, 12, 4); });
          if (msgT > 0) ctr(msg, 170, '#ff5a5a'); ctr('< > CHOOSE   ' + K.label('a') + ' OK', HH - 12, '#8a8aa8'); return; }
        if (mode === 'track') { H.fillStyle = 'rgba(4,0,16,.35)'; H.fillRect(0, 0, W, HH); big(flow === 'tt' ? 'TIME TRIAL' : 'SINGLE RACE', W / 2, 20, 18, '#e8f8ff', '#3a8ad8'); panel(20, 36, 280, 120);
          TRACKS.forEach((t, n) => { const on = n === sel.trk, open = trackOpen(n), y = 46 + n * 17; if (on) { H.fillStyle = 'rgba(42,224,255,.16)'; H.fillRect(24, y - 3, 272, 14); } txt((on ? '>' : ' ') + (open ? t.n : '? BONUS TRACK ?'), 28, y, !open ? '#666' : on ? '#2ae0ff' : '#fff'); if (open) txt(fmt(flow === 'tt' ? sv.tt[n] : sv.lap[n]), 226, y, '#ff8ad0'); });
          if (trackOpen(sel.trk)) ctr('LAP RECORD ' + fmt(TRACKS[sel.trk].rec) + '  ' + TRACKS[sel.trk].by, 168, '#ffe14a'); if (msgT > 0) ctr(msg, 184, '#ff5a5a'); ctr(K.label('a') + ' OK   ' + K.label('b') + ' BACK', HH - 14, '#8a8aa8'); return; }
        if (mode === 'options') { H.fillStyle = 'rgba(4,0,16,.5)'; H.fillRect(0, 0, W, HH); big('OPTIONS', W / 2, 34, 20, '#e8f8ff', '#3a8ad8'); panel(70, 56, 180, 92);
          [['MUSIC', sv.opt.mus ? 'ON' : 'OFF'], ['CAMERA', sv.opt.cam ? 'FAR' : 'CLOSE'], ['AUTO THRUST', sv.opt.auto ? 'ON' : 'OFF'], ['DONE', '']].forEach(([a, b], n) => { txt((n === sel.opt ? '> ' : '  ') + a, 84, 66 + n * 20, n === sel.opt ? '#2ae0ff' : '#fff'); if (b) txt(b, 206, 66 + n * 20, '#9affa0'); }); ctr(sel.opt === 2 ? 'THE ENGINE STAYS ON: JUST STEER' : '(SOUND FX: THE SPEAKER BUTTON BY THE TELLY)', 162, '#8a8aa8'); return; }
        if (mode === 'records') { H.fillStyle = 'rgba(4,0,16,.6)'; H.fillRect(0, 0, W, HH);
          if (sel.rec === 0) { big('PILOT RANKINGS', W / 2, 24, 18, '#e8f8ff', '#3a8ad8'); panel(60, 40, 200, 108); table().forEach((r, n) => { txt((n + 1) + '. ' + r.n, 74, 50 + n * 12, r.mate ? '#fff' : '#9affa0'); txt(String(r.s).padStart(6, ' '), 196, 50 + n * 12, '#2ae0ff'); });
            CLASSES.forEach((c, n) => ctr(c.n + ' CHAMPIONSHIP: ' + (sv.champ[n] ? ORD[sv.champ[n] - 1] : '-'), 160 + n * 12, '#ffe14a')); }
          else { big('LAP TIMES', W / 2, 24, 18, '#e8f8ff', '#3a8ad8'); panel(16, 40, 288, 130); txt('TRACK', 24, 48, '#ff8ad0'); txt('3 LAPS', 150, 48, '#ff8ad0'); txt('LAP', 214, 48, '#ff8ad0'); txt('RECORD', 256, 48, '#ff8ad0');
            TRACKS.forEach((t, n) => { const open = trackOpen(n); txt(open ? t.n : '?????', 24, 64 + n * 16, open ? '#fff' : '#666'); if (open) { txt(fmt(sv.tt[n]), 150, 64 + n * 16, '#2ae0ff'); txt(fmt(sv.lap[n]), 214, 64 + n * 16, sv.lap[n] && sv.lap[n] < t.rec ? '#9affa0' : '#2ae0ff'); txt(fmt(t.rec), 256, 64 + n * 16, '#ffe14a'); } }); }
          ctr('< > PAGE   ' + K.label('b') + ' BACK', HH - 14, '#8a8aa8'); return; }
        if (mode === 'how') { H.fillStyle = 'rgba(4,0,16,.8)'; H.fillRect(0, 0, W, HH);
          if (sel.how === 0) { big('CONTROLS', W / 2, 20, 18, '#e8f8ff', '#3a8ad8'); [['STEER', 'ARROWS / STICK'], ['THRUST', K.label('a') + ' (HOLD)'], ['FIRE WEAPON', K.label('b')], ['ABSORB WEAPON', K.label('x') + ' (= ENERGY)'], ['AIRBRAKES', K.label('l') + ' AND ' + K.label('r')], ['IN THE AIR', 'UP/DOWN: DIVE / FLOAT'], ['PAUSE', 'START']].forEach(([a, b], n) => { txt(a, 24, 40 + n * 16, '#2ae0ff'); txt(b, 130, 40 + n * 16, '#fff'); });
            ['USE AN AIRBRAKE TO SWING THE BACK ROUND', 'THE SHARP BENDS. HOLD THRUST ON THE LAST', 'LIGHT FOR A BOOST START.'].forEach((l, n) => ctr(l, 160 + n * 11, '#ff8ad0')); }
          else if (sel.how === 1) { big('WEAPONS', W / 2, 18, 18, '#e8f8ff', '#3a8ad8'); WEPS.forEach((w, n) => { const y = 34 + n * 28; H.drawImage(ICON[w], 24, y, 22, 22); txt(w, 54, y + 2, WCOL[w]); txt(WEP_INFO[w], 54, y + 12, '#fff'); }); }
          else { big('TIPS', W / 2, 20, 18, '#e8f8ff', '#3a8ad8'); ['ORANGE CHEVRONS: SPEED BOOST.', 'BLUE SQUARES: A WEAPON.', 'WALLS AND WEAPONS DRAIN YOUR SHIELD.', 'NO SHIELD LEFT = OUT OF THE RACE!', 'DRIVE IN THE GREEN PIT LANE BY THE', 'START LINE TO RECHARGE.', 'GAPS IN THE TRACK: KEEP YOUR SPEED UP', 'OR YOU WILL FALL IN.', '', 'WIN A CHAMPIONSHIP TO UNLOCK MORE!'].forEach((l, n) => ctr(l, 40 + n * 15, n > 8 ? '#9affa0' : '#fff')); }
          ctr('< ' + (sel.how + 1) + '/3 >   ' + K.label('b') + ' BACK', HH - 14, '#8a8aa8'); return; }
        if (mode === 'podium') { big(CLASSES[champ.cls].n, W / 2, 20, 16, '#e8f8ff', '#3a8ad8'); ctr('CHAMPIONSHIP RESULTS', 36, '#fff');
          champ.final.slice(0, 3).forEach((x, n) => ctr(ORD[n] + '  ' + x.n + '  ' + x.p + ' PTS', 150 + n * 11, n === 0 ? '#ffe14a' : '#fff'));
          if (mt > 2) { big(champ.place === 0 ? 'CHAMPION!' : champ.place < 3 ? ORD[champ.place] + ' OVERALL' : 'NEXT SEASON...', W / 2, HH - 46, 20, '#ffffff', champ.place === 0 ? '#ffe14a' : '#2ae0ff'); champ.msgs.forEach((m, n) => { if (blink(2)) ctr(m, HH - 30 + n * 10, '#9affa0'); }); }
          if (mt > 4 && blink(2)) ctr('PRESS ' + K.label('a'), HH - 10, '#fff'); return; }
        raceHud(false);
        if (saveT > 0 && ['results', 'standings', 'podium', 'ttres', 'options'].includes(mode)) { panel(W / 2 - 110, HH - 40, 220, 22, '#ffe14a'); ctr('SAVING TO MEMORY CARD' + '...'.slice(0, (K.t * 4 | 0) % 4) + ' DO NOT REMOVE', HH - 33, '#ffe14a'); }
      }
      function raceHud(demo) {
        if (mode === 'intro') { panel(30, HH - 70, 260, 52, '#ff2a8a'); ctr(cfg.kind === 'champ' ? 'CHAMPIONSHIP  RACE ' + (champ.race + 1) + '/' + CHAMP.length : cfg.kind === 'tt' ? 'TIME TRIAL' : 'SINGLE RACE', HH - 62, '#ff8ad0'); big(TRACKS[cfg.track].n, W / 2, HH - 40, 18, '#e8f8ff', '#3a8ad8'); ctr(CLASSES[cfg.cls].n + '   LAP RECORD ' + fmt(TRACKS[cfg.track].rec), HH - 28, '#fff'); return; }
        if (hitFlash > 0) { H.fillStyle = `rgba(255,30,30,${hitFlash})`; H.fillRect(0, 0, W, HH); }
        // lap and times
        panel(4, 4, 96, 40); txt('LAP', 10, 9, '#ff8ad0'); big(clamp(me.lap || 1, 1, 3) + '/3', 52, 20, 16, '#e8f8ff', '#3a8ad8', 'left'); txt(fmt(me.done ? me.ft : raceT), 10, 32, '#fff');
        if (!demo) me.laps.slice(-3).forEach((t, n) => txt('L' + (me.laps.length - Math.min(3, me.laps.length) + n + 1) + ' ' + fmt(t), 8, 48 + n * 9, t === me.bestLap ? '#9affa0' : '#8ad8ff'));
        if (cfg.kind !== 'tt') { panel(W - 70, 4, 66, 40); txt('POS', W - 64, 9, '#ff8ad0'); big(String(me.place + 1), W - 36, 26, 24, '#ffffff', '#ff2a8a', 'center'); txt('/' + ships.length, W - 22, 30, '#fff'); }
        else if (ghost) txt('GHOST', W - 50, 10, '#c8b0ff');
        if (!demo) {
          // weapon
          if (me.wep) { panel(W / 2 - 34, 4, 68, 32, WCOL[me.wep]); H.drawImage(ICON[me.wep], W / 2 - 30, 8, 24, 24); txt(me.wep, W / 2 - 3, 12, WCOL[me.wep]); if (blink(3)) txt(K.label('b'), W / 2 - 3, 22, '#fff'); }
          // shield energy
          const e = clamp(me.energy / 100, 0, 1); panel(4, HH - 26, 120, 22, e < 0.3 ? '#ff2a2a' : '#2ae0ff'); txt('SHIELD', 10, HH - 21, '#fff');
          for (let k = 0; k < 16; k++) { if (k / 16 >= e) break; H.fillStyle = e < 0.3 ? (blink(4) ? '#ff2a2a' : '#801010') : e < 0.6 ? '#ffe14a' : '#3aff6a'; H.fillRect(52 + k * 4.2, HH - 22, 3, 12); }
          if (e < 0.3 && !me.out && blink(2)) ctr('LOW SHIELD! USE THE PIT LANE', HH - 40, '#ff5a5a');
          // speed
          const sp = Math.round(me.v * 6); big(String(sp), W - 40, HH - 22, 20, '#e8f8ff', me.boost > 0 ? '#ffe14a' : '#3a8ad8', 'right'); txt('KM/H', W - 36, HH - 18, '#ff8ad0');
          for (let k = 0; k < 12; k++) { if (k / 12 > me.v / 75) break; H.fillStyle = k < 7 ? '#2ae0ff' : k < 10 ? '#ffe14a' : '#ff2a8a'; H.fillRect(W - 112 + k * 6, HH - 8, 5, 4); }
          if (me.air && me.airT > 0.6) ctr('AIR ' + me.airT.toFixed(1), 110, '#9affa0');
        }
        if (L) minimap();
        if (mode === 'count') { for (let q = 0; q < 3; q++) { const on = 3 - Math.ceil(count) >= q; H.fillStyle = on ? '#ff2a2a' : '#300808'; H.fillRect(W / 2 - 40 + q * 28, 50, 24, 10); } const c = Math.ceil(count); if (c >= 1 && c <= 3) big(String(c), W / 2, 100, 46, '#ffffff', '#2ae0ff'); }
        else if (mode === 'race' && raceT < 1.2 && !demo) big('GO!', W / 2, 100, 46, '#ffffff', '#ff2a8a');
        if (msgT > 0 && msg && !demo) big(msg, W / 2, 140, msg.length > 14 ? 13 : 18, '#ffffff', '#2ae0ff');
        if (mode === 'finish' && finT > 0.5 && !demo) big(me.out ? 'ELIMINATED' : 'RACE OVER', W / 2, 72, 24, '#ffffff', me.out ? '#ff2a2a' : '#2ae0ff');
        if (mode === 'results') { panel(36, 24, 248, 178); big('RESULTS', W / 2, 38, 16, '#e8f8ff', '#3a8ad8');
          results.rows.forEach((r, n) => { if (results.t < n * 0.15) return; const y = 54 + n * 17; if (r.me) { H.fillStyle = 'rgba(42,224,255,.18)'; H.fillRect(40, y - 3, 240, 14); } txt(ORD[n], 44, y, n === 0 ? '#ffe14a' : '#fff'); H.fillStyle = hexs(TEAMS[r.team].col); H.fillRect(74, y - 1, 6, 9); txt(r.n, 84, y, r.me ? '#2ae0ff' : '#fff'); txt(r.out ? 'OUT' : fmt(r.t), 170, y, r.out ? '#ff5a5a' : '#ff8ad0'); if (champ) txt('+' + r.add, 250, y, '#9affa0'); });
          if (mt > 1 && blink(2)) ctr('PRESS ' + K.label('a'), 206, '#fff'); }
        if (mode === 'standings') { panel(36, 24, 248, 178); big('POINTS', W / 2, 38, 16, '#e8f8ff', '#3a8ad8'); const st = Object.keys(champ.pts).map(n => ({ n, p: champ.pts[n], team: champ.teamOf[n] })).sort((a, b) => b.p - a.p);
          st.forEach((r, n) => { const y = 54 + n * 17, mine = r.n === me.n; if (mine) { H.fillStyle = 'rgba(42,224,255,.18)'; H.fillRect(40, y - 3, 240, 14); } txt(ORD[n], 44, y, '#fff'); H.fillStyle = hexs(TEAMS[r.team].col); H.fillRect(74, y - 1, 6, 9); txt(r.n, 84, y, mine ? '#2ae0ff' : '#fff'); H.fillStyle = TH.edge; H.fillRect(170, y, Math.min(60, r.p * 1.4) * Math.min(1, mt * 1.5), 6); txt(String(r.p), 252, y, '#9affa0'); });
          ctr('RACE ' + (champ.race + 1) + ' OF ' + CHAMP.length, 194, '#ff8ad0'); if (mt > 1 && blink(2)) ctr('PRESS ' + K.label('a'), 206, '#fff'); }
        if (mode === 'ttres') { const r = results; panel(50, 30, 220, 160); big(r.title, W / 2, 46, 18, '#e8f8ff', '#3a8ad8'); r.laps.forEach((t, n) => { txt('LAP ' + (n + 1), 70, 66 + n * 13); txt(fmt(t), 190, 66 + n * 13, t === me.bestLap ? '#9affa0' : '#2ae0ff'); });
          txt('TOTAL', 70, 112); txt(fmt(r.t), 190, 112, '#2ae0ff'); txt('YOUR BEST', 70, 128, '#ff8ad0'); txt(fmt(r.rec ? r.t : r.old), 190, 128, '#ff8ad0'); txt('LAP RECORD', 70, 144, '#ffe14a'); txt(fmt(TRACKS[cfg.track].rec), 190, 144, '#ffe14a'); if (r.rec) ctr('GHOST SAVED', 166, '#c8b0ff'); if (mt > 1 && blink(2)) ctr('PRESS ' + K.label('a'), 196, '#fff'); }
        if (paused) { H.fillStyle = 'rgba(4,0,16,.65)'; H.fillRect(0, 0, W, HH); big('PAUSED', W / 2, 70, 26, '#e8f8ff', '#3a8ad8'); panel(100, 90, 120, 66); ['CONTINUE', 'RESTART', 'QUIT'].forEach((s, n) => ctr((n === psel ? '> ' : '') + s + (n === psel ? ' <' : ''), 100 + n * 18, n === psel ? '#2ae0ff' : '#fff')); }
      }

      // ---------------------------------------------------------------- off we go
      function init() {
        RK = window.RoomRK; RKd = RK;
        shipGeo = TEAMS.map(t => RK.ship2(T, { col: t.col, trim: t.trim, kind: t.kind, glow: t.glow }));
        fxN = RK.fx(T3, { n: 400, scale: HH * 0.85, square: true }); fxA = RK.fx(T3, { n: 500, add: true, scale: HH * 0.85, square: true });
        mode = 'card'; cardT = 0; buildTrack(0); trackPrev = 0;
      }
      if (RK) init(); else kitReady.then(() => { if (mode === 'load') init(); }, () => {});
      window.__gravDbg = {
        get st() { return { mode, kind: cfg.kind, cls: cfg.cls, track: cfg.track, raceT, me: me && { fi: me.fi, d: me.d, y: me.y, v: me.v, lap: me.lap, prog: me.prog, place: me.place, wep: me.wep, energy: me.energy, out: me.out, done: me.done, ft: me.ft, air: me.air }, ships: ships.map(s => ({ n: s.n, prog: Math.round(s.prog), place: s.place, done: s.done, out: s.out, e: Math.round(s.energy), v: Math.round(s.v), lap: s.lap, best: s.bestLap })), champ: champ && { race: champ.race, pts: champ.pts, total: champ.total }, sv }; },
        race(kind, n, cls) { cfg.cls = cls | 0; sel.team = sv.team; if (kind === 'champ') newChamp(); else { cfg.track = n | 0; cfg.kind = kind || 'race'; champ = null; setupRace(); } },
        go() { if (mode === 'intro' || mode === 'loading') startCount(); count = 0.01; },
        give(w) { if (me) me.wep = w; },
        skipLaps(n) { if (me) me.prog += L.N * (n || 1); },
        lastRace() { if (champ) champ.race = CHAMP.length - 1; },
        hurt(n) { if (me) hurt(me, n || 50, null); },
        title() { goTitle(); }, demo() { startDemo(); },
        view(team, a, e, d) { buildGarage(); mode = 'view'; clearShips(); showShip(team | 0, V1.set(0, -298.6, 0)); showcase.rotation.y = 0; view3 = [a == null ? 0.6 : a, e == null ? 0.25 : e, d || 9]; return true; },
        viewWep(k, a, e, d) { buildGarage(); mode = 'view'; clearShips(); if (viewObj) T3.scene.remove(viewObj); viewObj = shotMesh(k); viewObj.position.set(0, -298.6, 0); view3 = [a == null ? 0.6 : a, e == null ? 0.25 : e, d || 6]; return true; },
      };
      return {
        update(dt) { update(dt); if (mode !== 'load') { if (L && ships.length && !['team', 'podium', 'view'].includes(mode)) placeShips(); camera(dt); if (fxN) { fxN.update(dt); fxA.update(dt); } } },
        draw() { if (mode !== 'load') T3.render(); hud(); },
        end() { K.music(null); try { delete window.__gravDbg; delete window.__gravCheatAll; } catch (e) {} },
      };
    },
  });
})();

/* MAD MINICAB (Dreamcast, in Jack's room): a crazy minicab game in the seaside town of Sunnymouth. Pick people up, get
 * them where they're going FAST, and pull off crazy stunts on the way for tips: drifts, near misses, jumps, dashes.
 * The town (48 x 48 blocks of 20 m): Hilltop (the big hill: jumps!), Victoria Park and its boating lake, the town centre,
 * the retail park with the multi-storey car park (drive up the ramp and fly off the top), Southside, the seafront with the
 * beach and the pier, the river with four bridges (and one place to jump it), and the docks. 26 places to go, 18 kinds of
 * passenger (and some faces you might know), traffic that keeps left like it should, day, sunset and night.
 * Modes: ARCADE (fares buy time), WORK SHIFT (3 / 5 / 10 minutes), CRAZY BOX (ten licence tests for medals), RECORDS.
 * Four drivers (one to unlock). The big green arrow points the way along the roads; the minimap shows the route.
 * Everything (the town, the cars, the people, the music) is built from scratch here. Original. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const GID = 'dc.taxi';
  const SECRETS = [
    ['rm.taxi.mom', 'Mom\'s Taxi', 'Some passengers in Mad Minicab know exactly who is driving.'],
    ['rm.taxi.mates', 'Taxi for Four', 'Give all four of Jack\'s mates a lift in Mad Minicab.'],
    ['rm.taxi.licence', 'Full Licence', 'Get a gold medal on every Crazy Box test in Mad Minicab.'],
    ['rm.taxi.leap', 'River Leap', 'There is a way across the river in Mad Minicab that does not use a bridge.'],
  ];
  try { if (window.Apps && Apps.defineSecret) for (const [id, n, h] of SECRETS) if (!(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, h); } catch (e) {}

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrapA = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const smooth = t => t * t * (3 - 2 * t);
  function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const castN = (id, fb) => { try { return (window.Cast && Cast.n(id)) || fb; } catch (e) { return fb; } };

  // ================================================================ Sunnymouth: 48 x 48 cells of 20 m
  //  # road  = bridge  a alley (no traffic)  q park path  g grass  t trees  r car park tarmac  . sand  _ promenade  p pier
  //  ~ water  % the edge of town (hedges and hills)  h houses  s shops  o offices  w warehouses  A-Z the 26 places
  const CELL = 20, N = 48, SIZE = N * CELL;
  const DX = [0, 1, 0, -1], DZ = [-1, 0, 1, 0]; // N E S W (north is -z)
  function buildMap() {
    const G = [];
    for (let r = 0; r < N; r++) G.push(new Array(N).fill('h'));
    const fill = (c0, r0, c1, r1, ch) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (r >= 0 && r < N && c >= 0 && c < N) G[r][c] = ch; };
    const H = (r, c0, c1, ch) => fill(c0, r, c1, r, ch || '#'), V = (c, r0, r1, ch) => fill(c, r0, c, r1, ch || '#');
    fill(19, 1, 34, 12, 'g'); fill(14, 14, 34, 28, 's'); fill(19, 17, 30, 25, 'o'); fill(1, 14, 13, 31, 'r');
    fill(38, 1, 46, 38, 'w'); fill(36, 1, 37, 41, '~'); fill(0, 42, 47, 47, '~'); fill(1, 40, 35, 41, '.'); fill(38, 39, 46, 41, '.');
    H(39, 1, 35, '_');
    fill(20, 2, 24, 4, 't'); fill(29, 2, 33, 3, 't'); fill(19, 9, 21, 11, 't'); fill(28, 10, 30, 11, 't');
    fill(25, 6, 29, 8, '~');
    H(2, 1, 35); H(7, 1, 18); H(13, 1, 46); H(19, 1, 35); H(26, 1, 35); H(31, 1, 35); H(38, 1, 46);
    V(2, 2, 38); V(8, 2, 38); V(13, 13, 38); V(18, 2, 38); V(24, 13, 38); V(30, 13, 38); V(35, 2, 38); V(41, 2, 38); V(46, 2, 38);
    H(7, 38, 46); H(25, 38, 46); H(33, 38, 46); H(34, 14, 35); H(19, 38, 41);
    for (const r of [2, 13, 25, 38]) fill(36, r, 37, r, '=');
    V(21, 26, 31, 'a'); V(27, 19, 26, 'a'); H(22, 14, 23, 'a'); V(11, 7, 13, 'a'); H(10, 2, 8, 'a'); V(43, 13, 25, 'a'); V(44, 33, 38, 'a');
    V(27, 2, 12, 'q'); H(5, 19, 34, 'q'); H(9, 22, 26, 'q');
    fill(25, 40, 26, 44, 'p'); fill(23, 45, 28, 46, 'p');
    fill(14, 35, 17, 37, 'r'); // the seafront car park
    const LM = [['A', 24, 45, 27, 46], ['B', 14, 27, 17, 28], ['C', 25, 14, 29, 16], ['D', 42, 34, 43, 37], ['E', 9, 14, 12, 16], ['F', 3, 20, 7, 25],
      ['G', 19, 27, 20, 28], ['H', 25, 27, 29, 30], ['I', 31, 9, 34, 11], ['J', 42, 26, 45, 29], ['K', 14, 32, 16, 33], ['L', 44, 40, 46, 41],
      ['M', 9, 27, 12, 30], ['N', 19, 14, 23, 18], ['O', 3, 27, 7, 30], ['P', 31, 14, 34, 16], ['Q', 3, 14, 7, 18], ['R', 42, 3, 45, 6],
      ['S', 3, 3, 7, 6], ['T', 14, 8, 17, 12], ['U', 9, 3, 12, 6], ['V', 31, 27, 34, 28], ['W', 31, 32, 34, 36], ['X', 14, 20, 17, 21],
      ['Y', 22, 10, 24, 12], ['Z', 31, 20, 34, 22]];
    for (const [ch, c0, r0, c1, r1] of LM) fill(c0, r0, c1, r1, ch);
    H(39,44,45,'r'); // lighthouse forecourt: connects the coast road to its pickup/drop-off
    fill(0, 0, N - 1, 0, '%'); fill(0, 0, 0, 41, '%'); fill(N - 1, 0, N - 1, 41, '%');
    return { G, LM };
  }
  // the places: letter -> [the name on the fare card, the sign over the door, sign colour]
  const PLACE = {
    A: ['THE PIER', 'PIER AMUSEMENTS', '#ff3a8a'], B: ['BINGO HALL', 'LUCKY STAR BINGO', '#ff8a3a'], C: ['THE CINEMA', 'ROXY CINEMA', '#ffe14a'],
    D: ['THE DOCKS', 'SUNNYMOUTH DOCKS', '#8ad8ff'], E: ['FIRE STATION', 'FIRE STATION', '#ff4a3a'], F: ['FOOTBALL GROUND', 'SUNNYMOUTH UNITED', '#3ad04a'],
    G: ['GAMES SHOP', 'JOYPAD GAMES', '#3aff8a'], H: ['HOSPITAL', 'GENERAL HOSPITAL', '#4a8aff'], I: ['ICE RINK', 'POLAR ICE RINK', '#aef0ff'],
    J: ['JUNK YARD', 'SCRAP-O-RAMA', '#c0a060'], K: ['THE CHIPPY', 'THE CODFATHER', '#ffd24a'], L: ['LIGHTHOUSE', 'POINT LIGHTHOUSE', '#ffffff'],
    M: ['MULTI-STOREY', 'CAR PARK', '#4ac8ff'], N: ['TOWN HALL', 'TOWN HALL', '#f0e0b0'], O: ['BOWLING ALLEY', 'STRIKE CITY', '#d84aff'],
    P: ['POLICE STATION', 'POLICE', '#4a6aff'], Q: ['SUPERSTORE', 'MEGAMART', '#ff3a3a'], R: ['RADIO STATION', 'SUNNY FM', '#ffa040'],
    S: ['THE SCHOOL', 'SUNNYMOUTH HIGH', '#8ac04a'], T: ['TRAIN STATION', 'SUNNYMOUTH STATION', '#e0e0e0'], U: ['THE CHURCH', 'ST MARY\'S', '#e8d8a8'],
    V: ['VIDEO SHOP', 'VIDEO VAULT', '#3a8aff'], W: ['SWIMMING BATHS', 'SPLASH BATHS', '#3ad0f0'], X: ['LIBRARY', 'LIBRARY', '#c8a0ff'],
    Y: ['BANDSTAND', 'BANDSTAND', '#f0f0f0'], Z: ['PIZZA PALACE', 'PIZZA PALACE', '#ff6a2a'],
  };
  const DISTRICTS = [ // [name, c0, r0, c1, r1] (first match wins)
    ['THE PIER', 22, 40, 29, 47], ['THE SEAFRONT', 0, 35, 35, 47], ['THE DOCKS', 36, 0, 47, 47], ['VICTORIA PARK', 19, 1, 34, 12], ['HILLTOP', 0, 0, 18, 12],
    ['RETAIL PARK', 0, 13, 13, 31], ['SOUTHSIDE', 14, 29, 35, 34], ['SOUTHSIDE', 0, 32, 13, 38], ['TOWN CENTRE', 14, 13, 35, 28]];
  const ROADISH = '#=a', OPEN = '#=aqgtr._py', SOLIDCH = 'hsow%ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // ---- heights: the hill, the humps, the decks (ramps, kickers, the car park roof)
  const HILL = { x: 9.5 * CELL, z: 6.5 * CELL, r: 220, h: 24 };
  function terrain(x, z) { const d = Math.hypot(x - HILL.x, z - HILL.z) / HILL.r; if (d >= 1) return 0; return HILL.h * smooth(1 - d); }

  // ================================================================ painting the textures (one big atlas, day and glow)
  const AT = 1024, TS = 128, TI = 120; // atlas, tile, tile inside its 4 px apron
  const TILE = { road: 0, pave: 16, prom: 17, grass: 18, sand: 19, pier: 20, park: 21, path: 22, yard: 23, tarmac: 24, rail: 25, pitch: 26, stone: 27, white: 28, slate: 29, clay: 30, flat: 31,
    house1: 32, house2: 33, house3: 34, shop1: 35, shop2: 36, shop3: 37, office1: 38, office2: 39, tower: 40, ware: 41, corr: 42, brick: 43, church: 44, hosp: 45, station: 46, cinema: 47,
    stand: 48, hall: 49, school: 50, police: 51, fire: 52, baths: 53, store: 54, bowl: 55, deck: 56, contain: 57, hut: 58, bill1: 59, bill2: 60, carF: 61, carB: 62, carS: 63 };
  function uvOf(i) { const c = i % 8, r = i >> 3; return [(c * TS + 4.5) / AT, 1 - (r * TS + 123.5) / AT, (c * TS + 123.5) / AT, 1 - (r * TS + 4.5) / AT]; }
  function paintAtlas(night) {
    const cv = document.createElement('canvas'); cv.width = cv.height = AT; const g = cv.getContext('2d');
    g.fillStyle = night ? '#000' : '#fff'; g.fillRect(0, 0, AT, AT);
    const D = !night;
    for (let i = 0; i < 64; i++) {
      const tx = (i % 8) * TS, ty = (i >> 3) * TS;
      g.save(); g.translate(tx + 4, ty + 4); g.beginPath(); g.rect(0, 0, TI, TI); g.clip();
      const R = rng(i * 7919 + 13), P = i < 16 ? (gg, s, d, r) => roadTile(gg, s, d, r, i) : PAINT[i];
      if (P) P(g, TI, D, R);
      g.restore();
      // the apron: stretch the edge pixels outwards (no seams when the GPU blurs mipmaps)
      g.drawImage(cv, tx + 4, ty + 4, 1, TI, tx, ty + 4, 4, TI); g.drawImage(cv, tx + TI + 3, ty + 4, 1, TI, tx + TI + 4, ty + 4, 4, TI);
      g.drawImage(cv, tx, ty + 4, TS, 1, tx, ty, TS, 4); g.drawImage(cv, tx, ty + TI + 3, TS, 1, tx, ty + TI + 4, TS, 4);
    }
    return cv;
  }
  const rc = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  function speck(g, x, y, w, h, n, cols, R) { for (let i = 0; i < n; i++) { g.fillStyle = cols[(R() * cols.length) | 0]; g.fillRect(x + R() * w, y + R() * h, 1 + (R() * 2 | 0), 1 + (R() * 2 | 0)); } }
  function bricks(g, x, y, w, h, base, mort, R, bw, bh) {
    bw = bw || 8; bh = bh || 4; rc(g, x, y, w, h, mort);
    for (let yy = 0, row = 0; yy < h; yy += bh, row++) for (let xx = -(row % 2) * bw / 2; xx < w; xx += bw) {
      const v = (R() - 0.5) * 26; g.fillStyle = shade(base, v); g.fillRect(x + Math.max(0, xx) + 0.5, y + yy + 0.5, Math.min(bw - 1, w - Math.max(0, xx)), bh - 1);
    }
  }
  function shade(hex, v) { const n = parseInt(hex.slice(1), 16); const f = c => clamp(Math.round(c + v), 0, 255); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; }
  // a window: glass with a sky reflection by day; lit (or not) at night
  function win(g, x, y, w, h, D, R, frame, opts) {
    opts = opts || {};
    if (D) {
      rc(g, x - 1, y - 1, w + 2, h + 2, frame || '#f4f4f0');
      const gr = g.createLinearGradient(x, y, x + w * 0.6, y + h); gr.addColorStop(0, opts.glass0 || '#9ad0f0'); gr.addColorStop(0.5, opts.glass1 || '#3a6a9a'); gr.addColorStop(1, opts.glass2 || '#1a3050'); g.fillStyle = gr; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(x, y + h * 0.7); g.lineTo(x + w * 0.5, y); g.lineTo(x + w * 0.7, y); g.lineTo(x, y + h); g.fill();
      if (!opts.noBar) { rc(g, x + w / 2 - 0.5, y, 1, h, frame || '#f4f4f0'); if (h > w) rc(g, x, y + h * 0.42, w, 1, frame || '#f4f4f0'); }
      if (opts.curtain) { rc(g, x, y, 2, h, opts.curtain); rc(g, x + w - 2, y, 2, h, opts.curtain); }
    } else {
      const r = R(), lit = opts.lit != null ? opts.lit : 0.55;
      if (r < lit) { const gr = g.createLinearGradient(x, y, x, y + h); const warm = R() < 0.8; gr.addColorStop(0, warm ? '#fff0a0' : '#c0e0ff'); gr.addColorStop(1, warm ? '#e8a040' : '#6a8ad0'); g.fillStyle = gr; g.fillRect(x, y, w, h); if (!opts.noBar) { rc(g, x + w / 2 - 0.5, y, 1, h, '#302010'); } }
    }
  }
  function roadTile(g, s, D, R, mask) {
    const pw = 21, n = mask & 1, e = mask & 2, so = mask & 4, w = mask & 8;
    if (!D) { // night: only the cat's-eyes glint
      g.fillStyle = '#c0c0a0'; for (let y = 6; y < s; y += 14) { if (n || so) g.fillRect(s / 2 - 1, y, 2, 2); } for (let x = 6; x < s; x += 14) { if (e || w) g.fillRect(x, s / 2 - 1, 2, 2); }
      return;
    }
    // pavement everywhere first, then the carriageway on top
    paveFill(g, s, R);
    const tar = (x, y, ww, hh) => { const gr = g.createLinearGradient(x, y, x + ww, y + hh); gr.addColorStop(0, '#5c6066'); gr.addColorStop(1, '#53575d'); g.fillStyle = gr; g.fillRect(x, y, ww, hh); };
    tar(pw, pw, s - 2 * pw, s - 2 * pw);
    if (n) tar(pw, 0, s - 2 * pw, pw); if (so) tar(pw, s - pw, s - 2 * pw, pw); if (w) tar(0, pw, pw, s - 2 * pw); if (e) tar(s - pw, pw, pw, s - 2 * pw);
    speck(g, pw, pw, s - 2 * pw, s - 2 * pw, 260, ['#686c72', '#4a4e54', '#72767c', '#45484d'], R);
    if (n) speck(g, pw, 0, s - 2 * pw, pw, 60, ['#686c72', '#4a4e54'], R); if (so) speck(g, pw, s - pw, s - 2 * pw, pw, 60, ['#686c72', '#4a4e54'], R);
    if (w) speck(g, 0, pw, pw, s - 2 * pw, 60, ['#686c72', '#4a4e54'], R); if (e) speck(g, s - pw, pw, pw, s - 2 * pw, 60, ['#686c72', '#4a4e54'], R);
    // a tar patch or two
    for (let i = 0; i < 2; i++) { g.fillStyle = 'rgba(30,32,36,.35)'; g.fillRect(pw + 6 + R() * 60, pw + 6 + R() * 60, 8 + R() * 14, 6 + R() * 10); }
    // kerbs: a light edge where the carriageway meets the pavement
    g.fillStyle = '#c8c8c0';
    if (!n) g.fillRect(pw, pw - 2, s - 2 * pw, 2); if (!so) g.fillRect(pw, s - pw, s - 2 * pw, 2); if (!w) g.fillRect(pw - 2, pw, 2, s - 2 * pw); if (!e) g.fillRect(s - pw, pw, 2, s - 2 * pw);
    if (n) { g.fillRect(pw - 2, 0, 2, pw); g.fillRect(s - pw, 0, 2, pw); } if (so) { g.fillRect(pw - 2, s - pw, 2, pw); g.fillRect(s - pw, s - pw, 2, pw); }
    if (w) { g.fillRect(0, pw - 2, pw, 2); g.fillRect(0, s - pw, pw, 2); } if (e) { g.fillRect(s - pw, pw - 2, pw, 2); g.fillRect(s - pw, s - pw, pw, 2); }
    const ways = (n ? 1 : 0) + (e ? 1 : 0) + (so ? 1 : 0) + (w ? 1 : 0);
    const straightNS = n && so && !e && !w, straightEW = e && w && !n && !so;
    // double yellow lines along the kerbs on the straights (no stopping! except for minicabs)
    g.fillStyle = '#e8c020';
    if (straightNS) { g.fillRect(pw + 2, 0, 1, s); g.fillRect(pw + 4, 0, 1, s); g.fillRect(s - pw - 3, 0, 1, s); g.fillRect(s - pw - 5, 0, 1, s); }
    if (straightEW) { g.fillRect(0, pw + 2, s, 1); g.fillRect(0, pw + 4, s, 1); g.fillRect(0, s - pw - 3, s, 1); g.fillRect(0, s - pw - 5, s, 1); }
    // white centre lines
    g.fillStyle = '#f2f2ee';
    const dashV = (x, y0, y1) => { for (let y = y0; y < y1; y += 12) g.fillRect(x - 1, y, 2, Math.min(7, y1 - y)); };
    const dashH = (y, x0, x1) => { for (let x = x0; x < x1; x += 12) g.fillRect(x, y - 1, Math.min(7, x1 - x), 2); };
    if (straightNS) dashV(s / 2, 2, s); else if (straightEW) dashH(s / 2, 2, s);
    else if (ways >= 3) {
      if (n) dashV(s / 2, 0, pw - 8); if (so) dashV(s / 2, s - pw + 8, s); if (w) dashH(s / 2, 0, pw - 8); if (e) dashH(s / 2, s - pw + 8, s);
      // give way lines and a zebra on one arm
      g.fillStyle = '#f2f2ee';
      const gw = (x, y, ww, hh) => { for (let i = 0; i < (ww > hh ? ww : hh); i += 6) g.fillRect(x + (ww > hh ? i : 0), y + (ww > hh ? 0 : i), ww > hh ? 4 : ww, ww > hh ? hh : 4); };
      if (n) gw(pw, pw - 6, s / 2 - pw, 2); if (so) gw(s / 2, s - pw + 4, s / 2 - pw, 2); if (w) gw(pw - 6, s / 2, 2, s / 2 - pw); if (e) gw(s - pw + 4, pw, 2, s / 2 - pw);
    } else if (ways === 2) { // a bend
      g.strokeStyle = '#f2f2ee'; g.lineWidth = 2; g.setLineDash([7, 5]); g.beginPath();
      const cx = (e ? s : 0), cy = (so ? s : 0); g.arc(cx, cy, s / 2, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    } else if (ways === 1) { if (n) dashV(s / 2, 0, s / 2); if (so) dashV(s / 2, s / 2, s); if (w) dashH(s / 2, 0, s / 2); if (e) dashH(s / 2, s / 2, s); }
    // drain grates
    g.fillStyle = '#2a2c30'; if (!n) g.fillRect(s / 2 + 18, pw + 1, 6, 3); if (!so) g.fillRect(s / 2 - 24, s - pw - 4, 6, 3);
  }
  function paveFill(g, s, R) {
    rc(g, 0, 0, s, s, '#b4b2aa');
    for (let y = 0; y < s; y += 7) for (let x = (y / 7 % 2) * 3; x < s; x += 7) { g.fillStyle = shade('#b8b6ae', (R() - 0.5) * 18); g.fillRect(x + 0.5, y + 0.5, 6, 6); }
    speck(g, 0, 0, s, s, 40, ['#9a988f', '#c8c6be'], R);
    for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(80,80,80,.25)'; g.beginPath(); g.arc(R() * s, R() * s, 1.5, 0, 7); g.fill(); } // chewing gum
  }
  // ---- every other tile (g, s=120, D=daytime, R=random): by day the full picture; at night only what glows
  const PAINT = [];
  const T_ = TILE;
  PAINT[T_.pave] = (g, s, D, R) => { if (D) paveFill(g, s, R); };
  PAINT[T_.prom] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#d8c8a8'); for (let y = 0; y < s; y += 10) for (let x = 0; x < s; x += 10) { g.fillStyle = ((x + y) / 10) % 2 ? '#c8a888' : '#e0d0b0'; g.fillRect(x + 0.5, y + 0.5, 9, 9); } speck(g, 0, 0, s, s, 60, ['#b89878', '#f0e0c8'], R); };
  PAINT[T_.grass] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#5aa83a'); for (let i = 0; i < 900; i++) { g.fillStyle = ['#4a9a30', '#6ab848', '#58a038', '#78c050', '#3e8a2a'][(R() * 5) | 0]; g.fillRect(R() * s, R() * s, 1, 2 + (R() * 2 | 0)); } for (let i = 0; i < 6; i++) { g.fillStyle = ['#fff', '#ffe040', '#f0f0ff'][(R() * 3) | 0]; g.fillRect(R() * s, R() * s, 2, 2); } };
  PAINT[T_.sand] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#ecd9a0'); speck(g, 0, 0, s, s, 700, ['#e0c888', '#f6e6b4', '#d8bc80', '#fff2c8'], R); for (let i = 0; i < 5; i++) { g.fillStyle = '#c8a870'; g.beginPath(); g.arc(R() * s, R() * s, 1.5, 0, 7); g.fill(); } };
  PAINT[T_.pier] = (g, s, D, R) => { if (!D) return; for (let x = 0; x < s; x += 10) { rc(g, x, 0, 10, s, shade('#9a6a3a', (R() - 0.5) * 30)); rc(g, x, 0, 1, s, '#4a2a10'); for (let y = 6 + R() * 40; y < s; y += 30 + R() * 30) rc(g, x + 2, y, 6, 1, '#5a3a18'); } for (let y = 0; y < s; y += 40) for (let x = 3; x < s; x += 10) rc(g, x, y + 3, 2, 2, '#2a2a2a'); };
  PAINT[T_.park] = (g, s, D, R) => { PAINT[T_.grass](g, s, D, R); };
  PAINT[T_.path] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#d0b890'); speck(g, 0, 0, s, s, 600, ['#c0a878', '#e0c8a0', '#b09060', '#e8d8b0'], R); };
  PAINT[T_.yard] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#a8a8a0'); for (let x = 0; x <= s; x += 30) { rc(g, x, 0, 1, s, '#808078'); rc(g, 0, x, s, 1, '#808078'); } speck(g, 0, 0, s, s, 300, ['#989890', '#b8b8b0', '#909088'], R); g.fillStyle = 'rgba(60,50,40,.25)'; g.beginPath(); g.ellipse(70, 40, 18, 9, 0.3, 0, 7); g.fill(); };
  PAINT[T_.tarmac] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#5a5e64'); speck(g, 0, 0, s, s, 500, ['#686c72', '#4a4e54', '#72767c'], R); g.fillStyle = '#f0f0ea'; for (let x = 0; x <= s; x += 15) { g.fillRect(x, 4, 2, 34); g.fillRect(x, s - 38, 2, 34); } };
  PAINT[T_.rail] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#7a7068'); speck(g, 0, 0, s, s, 900, ['#6a6058', '#8a8078', '#5a5048', '#9a9088'], R); for (let y = 2; y < s; y += 8) rc(g, 8, y, s - 16, 4, '#5a3a20'); for (const x of [26, 52, 68, 94]) { rc(g, x, 0, 3, s, '#b8b8c0'); rc(g, x, 0, 1, s, '#e8e8f0'); } };
  PAINT[T_.pitch] = (g, s, D, R) => { if (!D) return; for (let x = 0; x < s; x += 15) rc(g, x, 0, 15, s, (x / 15) % 2 ? '#3a9a30' : '#48aa3a'); g.strokeStyle = '#f0f0f0'; g.lineWidth = 2; g.strokeRect(6, 6, s - 12, s - 12); g.beginPath(); g.moveTo(s / 2, 6); g.lineTo(s / 2, s - 6); g.stroke(); g.beginPath(); g.arc(s / 2, s / 2, 14, 0, 7); g.stroke(); g.strokeRect(6, s / 2 - 24, 18, 48); g.strokeRect(s - 24, s / 2 - 24, 18, 48); };
  PAINT[T_.stone] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#8a8478'); for (let y = 0, row = 0; y < s; y += 12, row++) for (let x = -(row % 2) * 10; x < s; x += 20) { g.fillStyle = shade('#a09888', (R() - 0.5) * 34); g.fillRect(x + 1, y + 1, 18, 10); } };
  PAINT[T_.white] = (g, s, D) => { if (D) rc(g, 0, 0, s, s, '#fff'); else rc(g, 0, 0, s, s, '#000'); };
  PAINT[T_.slate] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#4a5058'); for (let y = 0, row = 0; y < s; y += 8, row++) for (let x = -(row % 2) * 6; x < s; x += 12) { g.fillStyle = shade('#5a6068', (R() - 0.5) * 24); g.fillRect(x + 0.5, y, 11, 7); rc(g, x, y + 7, 12, 1, '#30343a'); } };
  PAINT[T_.clay] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#9a3a24'); for (let y = 0, row = 0; y < s; y += 8, row++) for (let x = -(row % 2) * 5; x < s; x += 10) { g.fillStyle = shade('#b84a2e', (R() - 0.5) * 30); g.fillRect(x + 0.5, y, 9, 7); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, y + 6, 10, 2); } };
  PAINT[T_.flat] = (g, s, D, R) => { if (!D) return; rc(g, 0, 0, s, s, '#8a8a86'); speck(g, 0, 0, s, s, 900, ['#7a7a76', '#9a9a96', '#6a6a66', '#a8a8a0'], R); rc(g, 0, 0, s, 3, '#b0b0aa'); rc(g, 0, s - 3, s, 3, '#b0b0aa'); rc(g, 0, 0, 3, s, '#b0b0aa'); rc(g, s - 3, 0, 3, s, '#b0b0aa'); };
  // facades: a house front (10 m x 7 m: two floors, a door, a bay window)
  function houseFront(g, s, D, R, brick, door, trim) {
    if (D) { bricks(g, 0, 0, s, s, brick, '#c8b8a8', R, 10, 5); rc(g, 0, 56, s, 3, '#e8e0d0'); }
    // upstairs: two windows
    win(g, 14, 12, 30, 30, D, R, trim, { curtain: D ? ['#c84a4a', '#4a7ac8', '#e8d070', '#7ac87a'][(R() * 4) | 0] : null, lit: 0.45 });
    win(g, 76, 12, 30, 30, D, R, trim, { lit: 0.4 });
    // downstairs: a bay window and the front door
    win(g, 10, 70, 44, 38, D, R, trim, { lit: 0.6 });
    if (D) { rc(g, 78, 66, 28, 54, '#e8e0d0'); rc(g, 81, 69, 22, 51, door); rc(g, 84, 72, 16, 18, shade(door, 25)); rc(g, 84, 94, 16, 22, shade(door, 25)); rc(g, 98, 96, 3, 3, '#e8c040'); rc(g, 86, 86, 12, 2, '#d0c060'); }
    else if (R() < 0.5) rc(g, 84, 72, 16, 10, '#e8b050');
  }
  PAINT[T_.house1] = (g, s, D, R) => houseFront(g, s, D, R, '#a8503a', '#2a4a8a', '#f4f4f0');
  PAINT[T_.house2] = (g, s, D, R) => houseFront(g, s, D, R, '#c8a060', '#8a2a2a', '#f4f4f0');
  PAINT[T_.house3] = (g, s, D, R) => { if (D) { rc(g, 0, 0, s, s, '#e8e4d8'); speck(g, 0, 0, s, s, 900, ['#d8d4c8', '#f4f0e4', '#c8c4b8'], R); } houseFront2(g, s, D, R); };
  function houseFront2(g, s, D, R) {
    win(g, 14, 12, 30, 30, D, R, '#fff', { lit: 0.5 }); win(g, 76, 12, 30, 30, D, R, '#fff', { lit: 0.5 });
    win(g, 14, 70, 30, 34, D, R, '#fff', { lit: 0.6 });
    if (D) { rc(g, 74, 64, 34, 4, '#8a8a8a'); rc(g, 80, 68, 22, 52, '#2a7a4a'); rc(g, 84, 72, 14, 20, '#9ad0f0'); rc(g, 95, 96, 3, 3, '#e8c040'); }
  }
  // a shop front: big window, a coloured fascia (the name is a separate sign), a flat upstairs
  function shopFront(g, s, D, R, fascia, awning) {
    if (D) { bricks(g, 0, 0, s, 62, ['#a8503a', '#b8b0a0', '#8a5a40'][(R() * 3) | 0], '#c8b8a8', R, 10, 5); rc(g, 0, 62, s, 58, '#3a3a3a'); }
    win(g, 12, 10, 26, 30, D, R, '#f4f4f0', { lit: 0.35 }); win(g, 47, 10, 26, 30, D, R, '#f4f4f0', { lit: 0.35 }); win(g, 82, 10, 26, 30, D, R, '#f4f4f0', { lit: 0.35 });
    if (D) {
      rc(g, 0, 50, s, 14, fascia); rc(g, 0, 50, s, 2, shade(fascia, 50)); rc(g, 0, 62, s, 2, shade(fascia, -60));
      if (awning) for (let x = 0; x < s; x += 12) { rc(g, x, 64, 6, 10, awning); rc(g, x + 6, 64, 6, 10, '#f4f4f0'); }
      const gy = awning ? 76 : 68;
      const gr = g.createLinearGradient(0, gy, 0, s); gr.addColorStop(0, '#2a3a4a'); gr.addColorStop(1, '#8aa0b0'); g.fillStyle = gr; g.fillRect(6, gy, 76, s - gy - 6);
      // things in the window
      for (let i = 0; i < 6; i++) rc(g, 10 + i * 12, s - 24 - R() * 14, 8, 14 + R() * 6, ['#e84a4a', '#4ae84a', '#f0d040', '#4a8ae8', '#e8e8e8'][(R() * 5) | 0]);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(10, s - 6); g.lineTo(40, gy); g.lineTo(52, gy); g.lineTo(22, s - 6); g.fill();
      rc(g, 88, gy, 26, s - gy, '#5a3a20'); rc(g, 92, gy + 4, 18, 22, '#9ad0f0'); rc(g, 106, gy + 30, 3, 3, '#e8c040');
      rc(g, 0, s - 6, s, 6, '#6a6a6a');
    } else { rc(g, 0, 50, s, 14, shade(fascia, -40)); const gy = awning ? 76 : 68; if (R() < 0.85) { const gr = g.createLinearGradient(0, gy, 0, s); gr.addColorStop(0, '#fff4c0'); gr.addColorStop(1, '#e0a040'); g.fillStyle = gr; g.fillRect(6, gy, 76, s - gy - 6); } }
  }
  PAINT[T_.shop1] = (g, s, D, R) => shopFront(g, s, D, R, '#c8282a', null);
  PAINT[T_.shop2] = (g, s, D, R) => shopFront(g, s, D, R, '#2a5ac8', '#2a5ac8');
  PAINT[T_.shop3] = (g, s, D, R) => shopFront(g, s, D, R, '#2a8a3a', '#2a8a3a');
  // offices: four floors of glass (12 m a module)
  PAINT[T_.office1] = (g, s, D, R) => {
    if (D) rc(g, 0, 0, s, s, '#d8d8d0');
    for (let f = 0; f < 4; f++) { if (D) rc(g, 0, f * 30 + 22, s, 8, '#b8b8b0'); for (let i = 0; i < 4; i++) win(g, 4 + i * 29, f * 30 + 3, 24, 18, D, R, '#9a9a96', { glass0: '#b0e0ff', glass1: '#4a8ab8', glass2: '#2a4a6a', noBar: true, lit: 0.5 }); }
  };
  PAINT[T_.office2] = (g, s, D, R) => {
    if (D) { const gr = g.createLinearGradient(0, 0, s, s); gr.addColorStop(0, '#5a9ac8'); gr.addColorStop(0.5, '#2a5a8a'); gr.addColorStop(1, '#1a3a5a'); g.fillStyle = gr; g.fillRect(0, 0, s, s); g.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(i * 50, s); g.lineTo(i * 50 + 60, 0); g.lineTo(i * 50 + 76, 0); g.lineTo(i * 50 + 16, s); g.fill(); } }
    else for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) if (R() < 0.45) rc(g, i * 20 + 2, f * 30 + 4, 16, 22, R() < 0.7 ? '#fff0b0' : '#a0c8ff');
    g.fillStyle = D ? '#203040' : '#000'; for (let f = 0; f <= 4; f++) g.fillRect(0, f * 30 - 1, s, 2); for (let i = 0; i <= 6; i++) g.fillRect(i * 20 - 1, 0, 2, s);
  };
  PAINT[T_.tower] = (g, s, D, R) => {
    if (D) { rc(g, 0, 0, s, s, '#c8c0b0'); speck(g, 0, 0, s, s, 400, ['#b8b0a0', '#d8d0c0'], R); }
    for (let f = 0; f < 4; f++) for (let i = 0; i < 3; i++) { win(g, 8 + i * 38, f * 30 + 4, 28, 16, D, R, '#e8e8e0', { lit: 0.5 }); if (D) { rc(g, 4 + i * 38, f * 30 + 21, 36, 6, '#a8a090'); rc(g, 4 + i * 38, f * 30 + 21, 36, 1, '#e0d8c8'); } }
  };
  PAINT[T_.ware] = (g, s, D, R) => {
    if (D) { for (let x = 0; x < s; x += 6) { rc(g, x, 0, 3, s, '#9aa8b0'); rc(g, x + 3, 0, 3, s, '#7a8890'); } rc(g, 20, 40, 80, 80, '#c8b040'); for (let y = 42; y < s; y += 6) rc(g, 22, y, 76, 3, '#a89020'); rc(g, 0, 0, s, 6, '#5a6870'); for (let i = 0; i < 3; i++) rc(g, 10 + i * 40, 12, 22, 14, '#2a3a4a'); }
    else { for (let i = 0; i < 3; i++) if (R() < 0.5) rc(g, 10 + i * 40, 12, 22, 14, '#ffe8a0'); }
  };
  PAINT[T_.corr] = (g, s, D) => { if (!D) return; for (let x = 0; x < s; x += 6) { rc(g, x, 0, 3, s, '#a8b4bc'); rc(g, x + 3, 0, 3, s, '#86949c'); } rc(g, 0, 0, s, 4, '#5a6870'); rc(g, 0, s - 4, s, 4, '#4a5860'); };
  PAINT[T_.brick] = (g, s, D, R) => { if (D) bricks(g, 0, 0, s, s, '#a05038', '#b8a898', R, 10, 5); win(g, 20, 20, 18, 24, D, R, '#e8e8e0', { lit: 0.3 }); win(g, 80, 20, 18, 24, D, R, '#e8e8e0', { lit: 0.3 }); win(g, 50, 74, 18, 24, D, R, '#e8e8e0', { lit: 0.25 }); };
  PAINT[T_.church] = (g, s, D, R) => {
    if (D) PAINT[T_.stone](g, s, D, R);
    for (const x of [16, 74]) { if (D) { rc(g, x - 3, 20, 36, 90, '#c8c0a8'); } const lit = D || R() < 0.9; if (lit) { g.save(); g.beginPath(); g.moveTo(x, 104); g.lineTo(x, 40); g.arc(x + 15, 40, 15, Math.PI, 0); g.lineTo(x + 30, 104); g.closePath(); g.clip(); for (let yy = 26; yy < 104; yy += 10) for (let xx = x; xx < x + 30; xx += 10) { g.fillStyle = D ? ['#3a5ac8', '#c83a3a', '#e8c040', '#3aa04a', '#8a3ac8'][(R() * 5) | 0] : ['#ffd060', '#ff8040', '#80c0ff', '#ffe0a0'][(R() * 4) | 0]; g.fillRect(xx, yy, 10, 10); } g.restore(); if (D) { g.strokeStyle = '#2a2a2a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 104); g.lineTo(x, 40); g.arc(x + 15, 40, 15, Math.PI, 0); g.lineTo(x + 30, 104); g.stroke(); } } }
  };
  PAINT[T_.hosp] = (g, s, D, R) => {
    if (D) { rc(g, 0, 0, s, s, '#f0f0ec'); }
    for (let f = 0; f < 4; f++) { if (D) rc(g, 0, f * 30 + 24, s, 6, '#8ab8e0'); for (let i = 0; i < 5; i++) win(g, 4 + i * 23, f * 30 + 4, 18, 18, D, R, '#d8d8d4', { noBar: true, lit: 0.75, glass0: '#d0f0ff' }); }
  };
  PAINT[T_.station] = (g, s, D, R) => {
    if (D) bricks(g, 0, 0, s, s, '#b04a30', '#d0c0b0', R, 10, 5);
    for (const x of [8, 46, 84]) { if (D) rc(g, x - 3, 22, 34, 98, '#e8dcc0'); g.save(); g.beginPath(); g.moveTo(x, s); g.lineTo(x, 44); g.arc(x + 14, 44, 14, Math.PI, 0); g.lineTo(x + 28, s); g.closePath(); g.clip(); if (D) { const gr = g.createLinearGradient(0, 30, 0, s); gr.addColorStop(0, '#9ad0f0'); gr.addColorStop(1, '#2a4a6a'); g.fillStyle = gr; } else g.fillStyle = '#ffe8a0'; g.fillRect(x, 28, 28, s); g.restore(); }
    if (D) { rc(g, 0, 0, s, 10, '#e8dcc0'); rc(g, 0, 8, s, 2, '#a89878'); }
  };
  PAINT[T_.cinema] = (g, s, D, R) => {
    if (D) { rc(g, 0, 0, s, s, '#e8d0a0'); for (let x = 0; x < s; x += 20) rc(g, x + 8, 0, 4, 70, '#d0b080'); rc(g, 0, 70, s, 20, '#8a1a2a'); rc(g, 0, 90, s, 30, '#2a1a1a'); for (let i = 0; i < 3; i++) rc(g, 10 + i * 38, 94, 26, 26, '#c09040'); }
    for (let x = 4; x < s; x += 8) { g.fillStyle = D ? '#fff8c0' : ((x / 8) % 2 ? '#ffe060' : '#ff8040'); g.fillRect(x, 72, 3, 3); g.fillRect(x, 85, 3, 3); }
    if (!D) for (let i = 0; i < 3; i++) rc(g, 10 + i * 38, 94, 26, 26, '#ffd890');
  };
  PAINT[T_.stand] = (g, s, D, R) => {
    if (D) { rc(g, 0, 0, s, s, '#c8c8c0'); for (let y = 0; y < s; y += 24) rc(g, 0, y, s, 4, '#9a9a94'); for (let x = 0; x < s; x += 30) { rc(g, x, 0, 6, s, '#a8a8a0'); } rc(g, 0, 0, s, 18, '#c82a2a'); rc(g, 0, 16, s, 2, '#fff'); for (let x = 10; x < s; x += 40) { rc(g, x, 84, 22, 36, '#2a2a3a'); } }
    else for (let x = 10; x < s; x += 40) rc(g, x, 84, 22, 36, '#ffe8b0');
  };
  PAINT[T_.hall] = (g, s, D, R) => {
    if (D) { rc(g, 0, 0, s, s, '#e8dcc0'); rc(g, 0, 0, s, 14, '#d0c4a8'); rc(g, 0, 12, s, 3, '#a89878'); for (let x = 6; x < s; x += 24) { rc(g, x, 18, 10, 102, '#f4ecd8'); rc(g, x + 8, 18, 2, 102, '#c8bca0'); rc(g, x - 2, 18, 14, 4, '#d8ccb0'); } }
    for (let x = 18; x < s; x += 24) win(g, x, 34, 10, 30, D, R, '#e8dcc0', { lit: 0.7 });
    if (D) rc(g, 40, 82, 40, 38, '#4a2a18'); else rc(g, 42, 84, 36, 36, '#ffd890');
  };
  PAINT[T_.school] = (g, s, D, R) => { if (D) bricks(g, 0, 0, s, s, '#b8603a', '#d0c0b0', R, 10, 5); for (let f = 0; f < 2; f++) for (let i = 0; i < 3; i++) win(g, 6 + i * 39, 8 + f * 58, 32, 44, D, R, '#f4f4f0', { lit: 0.2 }); };
  PAINT[T_.police] = (g, s, D, R) => { if (D) bricks(g, 0, 0, s, s, '#8a4a38', '#c0b0a0', R, 10, 5); for (let i = 0; i < 3; i++) win(g, 10 + i * 38, 14, 24, 30, D, R, '#f4f4f0', { lit: 0.7 }); if (D) { rc(g, 44, 66, 32, 54, '#1a2a5a'); rc(g, 48, 70, 24, 20, '#9ad0f0'); } rc(g, 52, 52, 16, 10, D ? '#3a6aff' : '#80b0ff'); };
  PAINT[T_.fire] = (g, s, D, R) => { if (D) { bricks(g, 0, 0, s, s, '#a04030', '#c8b8a8', R, 10, 5); for (let i = 0; i < 2; i++) { rc(g, 8 + i * 58, 44, 46, 76, '#c81a1a'); for (let y = 48; y < s; y += 8) rc(g, 10 + i * 58, y, 42, 2, '#901010'); rc(g, 8 + i * 58, 44, 46, 3, '#f0f0f0'); } } for (let i = 0; i < 3; i++) win(g, 12 + i * 38, 8, 20, 24, D, R, '#f4f4f0', { lit: 0.6 }); };
  PAINT[T_.baths] = (g, s, D, R) => { if (D) { rc(g, 0, 0, s, s, '#e8f4f8'); for (let y = 0; y < s; y += 8) rc(g, 0, y, s, 1, '#c8dce4'); rc(g, 0, 30, s, 50, '#3a9ad8'); for (let x = 0; x < s; x += 12) rc(g, x, 30, 2, 50, '#2a7ab8'); for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(R() * s, 32 + R() * 46, 8, 1); } } else rc(g, 0, 30, s, 50, '#70c8ff'); };
  PAINT[T_.store] = (g, s, D, R) => { if (D) { rc(g, 0, 0, s, s, '#e8e8e4'); for (let x = 0; x < s; x += 10) rc(g, x, 0, 1, 80, '#c8c8c4'); rc(g, 0, 20, s, 10, '#d82a2a'); rc(g, 0, 30, s, 4, '#f0c020'); const gr = g.createLinearGradient(0, 80, 0, s); gr.addColorStop(0, '#2a3a4a'); gr.addColorStop(1, '#8aa0b0'); g.fillStyle = gr; g.fillRect(0, 80, s, 40); for (let x = 0; x < s; x += 30) rc(g, x, 80, 2, 40, '#c8c8c4'); } else { rc(g, 0, 20, s, 10, '#ff6060'); rc(g, 0, 80, s, 40, '#fff0c0'); } };
  PAINT[T_.bowl] = (g, s, D, R) => { if (D) { rc(g, 0, 0, s, s, '#2a1a4a'); for (let i = 0; i < 20; i++) rc(g, R() * s, R() * 70, 2, 2, '#fff'); } for (let i = 0; i < 4; i++) { const x = 18 + i * 26; g.fillStyle = D ? '#f0f0f0' : '#ff80ff'; g.beginPath(); g.ellipse(x, 50, 6, 14, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x, 32, 5, 0, 7); g.fill(); rc(g, x - 6, 42, 12, 3, D ? '#e02020' : '#ff4040'); } if (D) rc(g, 30, 84, 60, 36, '#1a1a2a'); else rc(g, 32, 86, 56, 34, '#ffc0ff'); };
  PAINT[T_.deck] = (g, s, D, R) => { if (D) { rc(g, 0, 0, s, s, '#b8b8b0'); speck(g, 0, 0, s, s, 300, ['#a8a8a0', '#c8c8c0'], R); for (let f = 0; f < 3; f++) { rc(g, 0, f * 40 + 12, s, 24, '#2a2c30'); for (let x = 0; x < s; x += 30) rc(g, x, f * 40 + 12, 6, 24, '#b0b0a8'); } } else for (let f = 0; f < 3; f++) for (let x = 8; x < s; x += 30) rc(g, x, f * 40 + 13, 18, 3, '#fff0c0'); };
  PAINT[T_.contain] = (g, s, D, R) => { if (!D) return; const cols = ['#c83a2a', '#2a6ac8', '#e8a020', '#2a8a4a']; for (let b = 0; b < 4; b++) { const c = cols[b]; for (let x = 0; x < s; x += 4) rc(g, x, b * 30, 2, 30, c), rc(g, x + 2, b * 30, 2, 30, shade(c, -30)); rc(g, 0, b * 30, s, 2, shade(c, 40)); rc(g, 0, b * 30 + 28, s, 2, '#222'); } };
  PAINT[T_.hut] = (g, s, D) => { if (!D) return; const cols = ['#e83a3a', '#3a8ae8', '#e8c83a', '#3ac86a']; for (let b = 0; b < 4; b++) { for (let x = 0; x < s; x += 10) rc(g, x, b * 30, 5, 30, cols[b]), rc(g, x + 5, b * 30, 5, 30, '#f8f8f0'); rc(g, 50, b * 30 + 8, 20, 22, '#6a3a1a'); } };
  // billboards: parody adverts of 1999
  PAINT[T_.bill1] = (g, s, D, R) => {
    if (D) { const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#1a3ad0'); gr.addColorStop(1, '#0a1a60'); g.fillStyle = gr; g.fillRect(0, 0, s, s); g.fillStyle = '#ffd21a'; g.font = 'bold 22px Arial'; g.textAlign = 'center'; g.fillText('FIZZ-O', s / 2, 36); g.fillStyle = '#fff'; g.font = 'bold 11px Arial'; g.fillText('THE DRINK OF', s / 2, 58); g.fillText('THE MILLENNIUM!', s / 2, 72); g.fillStyle = '#e82a2a'; g.fillRect(44, 82, 32, 34); g.fillStyle = '#fff'; g.fillRect(48, 90, 24, 6); }
    else { g.fillStyle = '#ffd21a'; g.font = 'bold 22px Arial'; g.textAlign = 'center'; g.fillText('FIZZ-O', s / 2, 36); }
  };
  PAINT[T_.bill2] = (g, s, D, R) => {
    if (D) { rc(g, 0, 0, s, s, '#f0f0e8'); g.fillStyle = '#e8261c'; g.font = 'bold 18px Arial'; g.textAlign = 'center'; g.fillText('MEGA 2000', s / 2, 30); g.fillStyle = '#222'; g.font = 'bold 10px Arial'; g.fillText('THE Y2K-PROOF', s / 2, 50); g.fillText('VIDEO RECORDER', s / 2, 63); rc(g, 30, 74, 60, 30, '#222'); rc(g, 36, 82, 30, 4, '#555'); g.fillStyle = '#3aff5a'; g.fillRect(72, 80, 12, 6); g.fillStyle = '#e8261c'; g.font = 'bold 10px Arial'; g.fillText('ONLY £199.99', s / 2, 116); }
    else { g.fillStyle = '#ff6040'; g.font = 'bold 18px Arial'; g.textAlign = 'center'; g.fillText('MEGA 2000', s / 2, 30); }
  };
  // car bits: the front (grille and headlights), the back (lights and plate), the side windows
  PAINT[T_.carF] = (g, s, D) => {
    if (D) { rc(g, 0, 0, s, s, '#fff'); rc(g, 30, 40, 60, 30, '#2a2a2a'); for (let y = 44; y < 68; y += 5) rc(g, 32, y, 56, 2, '#5a5a5a'); rc(g, 0, 90, s, 30, '#c8c8c8'); rc(g, 44, 96, 32, 14, '#f0f0e8'); g.fillStyle = '#222'; g.font = 'bold 9px Arial'; g.textAlign = 'center'; g.fillText('M1N 1CAB', 60, 106); }
    g.fillStyle = D ? '#f8f8e0' : '#fffff0'; g.fillRect(4, 40, 22, 26); g.fillRect(94, 40, 22, 26); g.fillStyle = D ? '#f0a020' : '#ffb040'; g.fillRect(4, 68, 22, 8); g.fillRect(94, 68, 22, 8);
  };
  PAINT[T_.carB] = (g, s, D) => {
    if (D) { rc(g, 0, 0, s, s, '#fff'); rc(g, 0, 90, s, 30, '#c8c8c8'); rc(g, 40, 50, 40, 18, '#f8d820'); g.fillStyle = '#222'; g.font = 'bold 9px Arial'; g.textAlign = 'center'; g.fillText('M1N 1CAB', 60, 63); }
    g.fillStyle = D ? '#c81a1a' : '#ff3020'; g.fillRect(4, 40, 28, 28); g.fillRect(88, 40, 28, 28); g.fillStyle = D ? '#f0a020' : '#ff9030'; g.fillRect(4, 70, 28, 8); g.fillRect(88, 70, 28, 8);
  };
  PAINT[T_.carS] = (g, s, D) => {
    if (!D) return; rc(g, 0, 0, s, s, '#fff');
    const gr = g.createLinearGradient(0, 0, 0, 60); gr.addColorStop(0, '#8ab0d0'); gr.addColorStop(1, '#1a2a3a'); g.fillStyle = gr; g.fillRect(8, 4, 104, 52); rc(g, 58, 4, 4, 52, '#1a1a1a');
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(14, 56); g.lineTo(40, 4); g.lineTo(52, 4); g.lineTo(26, 56); g.fill();
    rc(g, 0, 60, s, 2, 'rgba(0,0,0,.4)'); rc(g, 58, 60, 2, 60, 'rgba(0,0,0,.35)'); rc(g, 30, 74, 12, 3, '#888'); rc(g, 80, 74, 12, 3, '#888');
  };

  // ================================================================ the game
  TV.game(GID, {
    three: true, stick: true, buttons: ['a', 'b', 'x'],
    help: 'Steer: arrows. Go: Z (or Up). Brake / reverse: X (or Down). Handbrake (drift!): C. Pause: Enter.',
    make(K) { return makeGame(K); },
  });

  function makeGame(K) {
    const T3 = K.three({ fogCol: 0xbfe4ff, fogNear: 160, fogFar: 460, far: 900 }), T = T3.T, HUD = K.hud, F = K.font, W = K.W, HH = K.H;
    const MAP = buildMap(), G = MAP.G;
    const at = (c, r) => (c < 0 || r < 0 || c >= N || r >= N) ? '%' : G[r][c];
    const cellOf = v => Math.floor(v / CELL);
    const isRoad = ch => ROADISH.includes(ch);
    const isOpen = ch => OPEN.includes(ch);
    // ---- the places: their cells, a drop-off point on the kerb outside the front door
    const LMS = {};
    for (const [ch, c0, r0, c1, r1] of MAP.LM) LMS[ch] = { ch, c0, r0, c1, r1, x: (c0 + c1 + 1) / 2 * CELL, z: (r0 + r1 + 1) / 2 * CELL, name: PLACE[ch][0], sign: PLACE[ch][1], col: PLACE[ch][2] };
    for (const ch in LMS) { // the nearest road cell along the outside, facing the middle of the place
      const L = LMS[ch]; let best = null, bd = 1e9;
      for (let r = L.r0 - 1; r <= L.r1 + 1; r++) for (let c = L.c0 - 1; c <= L.c1 + 1; c++) {
        if (r >= L.r0 && r <= L.r1 && c >= L.c0 && c <= L.c1) continue;
        const ch2 = at(c, r); if (!(isRoad(ch2) || ch2 === 'q' || ch2 === 'p' || ch2 === '_' || ch2 === 'r')) continue;
        const cx = (c + 0.5) * CELL, cz = (r + 0.5) * CELL, d = Math.hypot(cx - L.x, cz - L.z) + (ch2 === '#' ? 0 : 12);
        if (d < bd) { bd = d; best = [c, r]; }
      }
      if (!best) { console.warn('taxi: no road by', ch); best = [L.c0, L.r0 - 1]; }
      const [c, r] = best, cx = (c + 0.5) * CELL, cz = (r + 0.5) * CELL;
      // stop on the near side of the road (the pavement side facing the place)
      const dx = clamp(L.x - cx, -1, 1), dz = clamp(L.z - cz, -1, 1);
      const sx = Math.abs(L.x - cx) > Math.abs(L.z - cz) ? Math.sign(dx) : 0, sz = sx ? 0 : Math.sign(dz);
      L.dc = c; L.dr = r; L.dx = cx + sx * 5; L.dz = cz + sz * 5; L.face = [sx, sz];
    }
    // ---- heights
    const HB = new Float32Array(N * N); // roof height of solid cells
    const BK = []; for (let i = 0; i < N * N; i++) BK.push(null); // per-cell extras: { decks: [], solids: [] }
    const bucket = (c, r) => { const i = r * N + c; return BK[i] || (BK[i] = { decks: [], solids: [] }); };
    const decks = [], solids = [];
    function addDeck(d) { decks.push(d); for (let r = cellOf(d.z0); r <= cellOf(d.z1 - 0.01); r++) for (let c = cellOf(d.x0); c <= cellOf(d.x1 - 0.01); c++) if (c >= 0 && r >= 0 && c < N && r < N) bucket(c, r).decks.push(d); return d; }
    function addSolid(s) { solids.push(s); for (let r = cellOf(s.z0); r <= cellOf(s.z1 - 0.01); r++) for (let c = cellOf(s.x0); c <= cellOf(s.x1 - 0.01); c++) if (c >= 0 && r >= 0 && c < N && r < N) bucket(c, r).solids.push(s); return s; }
    const deckH = (d, x, z) => { const t = d.ax === 'x' ? (x - d.x0) / (d.x1 - d.x0) : (z - d.z0) / (d.z1 - d.z0); const k = d.dir < 0 ? 1 - t : t; return d.fn ? d.fn(k) : lerp(d.h0, d.h1, k); };
    // humps: the "hilly street" bumps that make cars fly
    const HUMPS = [];
    function ground(x, z) {
      let h = terrain(x, z);
      for (const u of HUMPS) if (x >= u.x0 && x <= u.x1 && z >= u.z0 && z <= u.z1) { const t = u.ax === 'x' ? (x - u.x0) / (u.x1 - u.x0) : (z - u.z0) / (u.z1 - u.z0); h += u.h * Math.pow(Math.sin(t * Math.PI), 2); }
      return h;
    }
    function Hat(x, z) {
      const c = cellOf(x), r = cellOf(z);
      if (c < 0 || r < 0 || c >= N || r >= N) return r >= N - 6 ? -3 : 999;
      const ch = G[r][c];
      let h = SOLIDCH.includes(ch) ? HB[r * N + c] : ch === '~' ? -3 : ch === 'p' ? 0.6 : ground(x, z);
      const b = BK[r * N + c];
      if (b) {
        for (const d of b.decks) if (x >= d.x0 && x < d.x1 && z >= d.z0 && z < d.z1) { const v = deckH(d, x, z); if (v > h) h = v; }
        for (const s of b.solids) if (x >= s.x0 && x < s.x1 && z >= s.z0 && z < s.z1 && s.h > h) h = s.h;
      }
      return h;
    }
    const isWater = (x, z) => { const c = cellOf(x), r = cellOf(z); if (r >= N) return true; if (c < 0 || r < 0 || c >= N) return false; if (G[r][c] !== '~') return false; const b = BK[r * N + c]; if (b) for (const d of b.decks) if (x >= d.x0 && x < d.x1 && z >= d.z0 && z < d.z1) return false; return true; };

    // ================================================================ building the town
    const atlasDay = paintAtlas(false), atlasGlow = paintAtlas(true);
    const texDay = new T.CanvasTexture(atlasDay), texGlow = new T.CanvasTexture(atlasGlow);
    for (const t of [texDay, texGlow]) { t.magFilter = T.LinearFilter; t.minFilter = T.LinearMipmapLinearFilter; t.anisotropy = 4; }
    const cityMat = T3.mat({ map: texDay, vcol: true });
    cityMat.emissiveMap = texGlow; cityMat.emissive = new T.Color(0x000000); cityMat.needsUpdate = true;
    const signCv = document.createElement('canvas'); signCv.width = 1024; signCv.height = 1024; const sg = signCv.getContext('2d');
    const signTex = new T.CanvasTexture(signCv); signTex.minFilter = T.LinearMipmapLinearFilter; signTex.anisotropy = 4;
    const signMat = new T.MeshBasicMaterial({ map: signTex, vertexColors: true, fog: true });
    let signN = 0;
    function signUV(text, col, sub) { // paint a lit sign (256 x 48) into the sign atlas, return its uv rect
      const i = signN++, x = (i % 4) * 256, y = (i >> 2) * 52;
      sg.fillStyle = '#141418'; sg.fillRect(x, y, 256, 52); sg.fillStyle = col; sg.fillRect(x + 3, y + 3, 250, 2); sg.fillRect(x + 3, y + 47, 250, 2);
      sg.font = `bold ${text.length > 14 ? 22 : 28}px Arial Black,Arial,sans-serif`; sg.textAlign = 'center'; sg.textBaseline = 'middle';
      sg.fillStyle = col; sg.fillText(text, x + 128, y + 25 + (sub ? -4 : 0), 244);
      if (sub) { sg.font = 'bold 10px Arial,sans-serif'; sg.fillStyle = '#fff'; sg.fillText(sub, x + 128, y + 41, 244); }
      return [(x + 2) / 1024, 1 - (y + 50) / 1024, (x + 254) / 1024, 1 - (y + 2) / 1024];
    }
    // geometry buckets: one per 8 x 8 cell sector (so the camera can skip what it can't see)
    const SEC = 8, NS = N / SEC, secs = [];
    for (let i = 0; i < NS * NS; i++) secs.push({ p: [], n: [], u: [], c: [] });
    const signB = { p: [], n: [], u: [], c: [] };
    const secOf = (x, z) => secs[clamp(Math.floor(z / CELL / SEC), 0, NS - 1) * NS + clamp(Math.floor(x / CELL / SEC), 0, NS - 1)];
    const WH = [1, 1, 1];
    function tri(B, a, b, c, ua, ub, uc, col) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      for (const [p, uv, k] of [[a, ua, 0], [b, ub, 1], [c, uc, 2]]) { B.p.push(p[0], p[1], p[2]); B.n.push(nx, ny, nz); B.u.push(uv[0], uv[1]); const cc = Array.isArray(col[0]) ? col[k] : col; B.c.push(cc[0], cc[1], cc[2]); }
    }
    // a quad a b c d (counter-clockwise seen from the front), uv rect [u0 v0 u1 v1] from a (u0 v0) to c (u1 v1)
    function quad(B, a, b, c, d, uv, col, cols) {
      uv = uv || uvOf(TILE.white); col = col || WH;
      const A = [uv[0], uv[1]], Bu = [uv[2], uv[1]], C = [uv[2], uv[3]], Du = [uv[0], uv[3]];
      if (cols) { tri(B, a, b, c, A, Bu, C, [cols[0], cols[1], cols[2]]); tri(B, a, c, d, A, C, Du, [cols[0], cols[2], cols[3]]); }
      else { tri(B, a, b, c, A, Bu, C, col); tri(B, a, c, d, A, C, Du, col); }
    }
    const subUV = (uv, f0, f1, g0, g1) => [lerp(uv[0], uv[2], f0), lerp(uv[1], uv[3], g0), lerp(uv[0], uv[2], f1), lerp(uv[1], uv[3], g1)];
    const ao = (col, y, base) => { const k = clamp(0.62 + (y - base) * 0.1, 0.62, 1); return [col[0] * k, col[1] * k, col[2] * k]; };
    // a wall facing (nx, nz), centred on (cx, cz), from y0 to y1, split into tiles segW wide and segH tall
    function wall(B, cx, cz, nx, nz, width, y0, y1, tile, segW, segH, col, noAO) {
      col = col || WH; const rx = nz, rz = -nx; // the wall's right, seen from the front
      const nw = Math.max(1, Math.round(width / (segW || width))), nh = Math.max(1, Math.round((y1 - y0) / (segH || (y1 - y0)))), uv = typeof tile === 'number' ? uvOf(tile) : tile;
      for (let i = 0; i < nw; i++) for (let j = 0; j < nh; j++) {
        const a0 = -width / 2 + width * i / nw, a1 = -width / 2 + width * (i + 1) / nw, b0 = y0 + (y1 - y0) * j / nh, b1 = y0 + (y1 - y0) * (j + 1) / nh;
        const P = (a, y) => [cx + rx * a, y, cz + rz * a];
        const cb = noAO ? col : ao(col, b0, y0), ct = noAO ? col : ao(col, b1, y0);
        quad(B, P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1), uv, null, [cb, cb, ct, ct]);
      }
    }
    // a box with a tile on each side, the roof on top
    function block(B, x0, z0, x1, z1, y0, y1, faces, col) {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, wx = x1 - x0, wz = z1 - z0;
      const f = k => faces[k] != null ? faces[k] : faces.side;
      const sw = faces.segW || 10, sh = faces.segH || (y1 - y0);
      if (f('n') != null) wall(B, cx, z0, 0, -1, wx, y0, y1, f('n'), sw, sh, col);
      if (f('s') != null) wall(B, cx, z1, 0, 1, wx, y0, y1, f('s'), sw, sh, col);
      if (f('w') != null) wall(B, x0, cz, -1, 0, wz, y0, y1, f('w'), sw, sh, col);
      if (f('e') != null) wall(B, x1, cz, 1, 0, wz, y0, y1, f('e'), sw, sh, col);
      if (faces.top != null) { const uv = typeof faces.top === 'number' ? uvOf(faces.top) : faces.top; quad(B, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], uv, faces.topCol || col || WH); }
    }
    // a pitched roof along x or z
    function pitched(B, x0, z0, x1, z1, y, h, along, tile, col) {
      const uv = uvOf(tile), c = col || WH, gc = [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85];
      if (along === 'x') { const zm = (z0 + z1) / 2; quad(B, [x0, y, z1], [x1, y, z1], [x1, y + h, zm], [x0, y + h, zm], uv, c); quad(B, [x1, y, z0], [x0, y, z0], [x0, y + h, zm], [x1, y + h, zm], uv, c);
        tri(B, [x0, y, z0], [x0, y, z1], [x0, y + h, zm], WC, WC, WC, gc); tri(B, [x1, y, z1], [x1, y, z0], [x1, y + h, zm], WC, WC, WC, gc); }
      else { const xm = (x0 + x1) / 2; quad(B, [x1, y, z1], [x1, y, z0], [xm, y + h, z0], [xm, y + h, z1], uv, c); quad(B, [x0, y, z0], [x0, y, z1], [xm, y + h, z1], [xm, y + h, z0], uv, c);
        tri(B, [x0, y, z1], [x1, y, z1], [xm, y + h, z1], WC, WC, WC, gc); tri(B, [x1, y, z0], [x0, y, z0], [xm, y + h, z0], WC, WC, WC, gc); }
    }
    const WC = [0.5625, 0.5625], WHITEUV = uvOf(TILE.white), wuv = [WHITEUV[0] + 0.002, WHITEUV[1] + 0.002, WHITEUV[2] - 0.002, WHITEUV[3] - 0.002];
    const hex = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
    // a little low-poly tree (a trunk and two blobs of leaves)
    function tree(B, x, z, s, R) {
      const y = ground(x, z), tr = hex(0x7a5a3a), lv = [hex(0x3a8a30), hex(0x2a7a28), hex(0x4a9a3a)][(R() * 3) | 0];
      block(B, x - 0.35 * s, z - 0.35 * s, x + 0.35 * s, z + 0.35 * s, y, y + 3 * s, { side: wuv }, tr);
      blob(B, x, y + 4.4 * s, z, 2.6 * s, 2.4 * s, lv); blob(B, x + 0.6 * s, y + 6.2 * s, z - 0.3 * s, 1.8 * s, 1.8 * s, lv.map(v => Math.min(1, v * 1.15)));
    }
    function blob(B, x, y, z, r, h, col) { // an octahedron-ish lump, lit from above
      const n = 7, top = [x, y + h, z], bot = [x, y - h * 0.7, z], ring = [];
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ring.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]); }
      const dark = col.map(v => v * 0.7);
      for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; tri(B, top, b, a, WC, WC, WC, [col.map(v => Math.min(1, v * 1.25)), col, col]); tri(B, bot, a, b, WC, WC, WC, [dark, col, col]); }
    }
    // ---- the decks: the car park ramp and roof, kickers, the river leap
    function initDecks() {
      // the multi-storey (M: cols 9-12, rows 27-30): a ramp up the west side (col 9) from the south, the roof on cols 10-12
      const M = LMS.M, rx0 = M.c0 * CELL, rz0 = M.r0 * CELL, rz1 = (M.r1 + 1) * CELL;
      addDeck({ x0: rx0 + 1, x1: rx0 + CELL - 1, z0: rz0, z1: rz1, ax: 'z', dir: -1, fn: k => k < 0.88 ? 15 * smooth(k / 0.88) * 0.93 + 0.01 : 13.95 + (k - 0.88) / 0.12 * 2.6, kick: 1, name: 'ramp' });
      addDeck({ x0: rx0 + CELL - 1, x1: (M.c1 + 1) * CELL, z0: rz0, z1: rz1, ax: 'x', h0: 15, h1: 15, name: 'roof' });
      // the river leap: a kicker at the end of the road at row 19 (west bank), a landing ramp on the east bank
      addDeck({ x0: 35 * CELL + 6, x1: 36 * CELL + 3, z0: 19 * CELL + 2, z1: 20 * CELL - 2, ax: 'x', fn: k => 4.2 * k * k, name: 'leap' });
      addDeck({ x0: 38 * CELL, x1: 38 * CELL + 16, z0: 19 * CELL + 2, z1: 20 * CELL - 2, ax: 'x', h0: 2.5, h1: 0, name: 'land' });
      // kickers on the beach and in the park, and the humps on Hilltop
      for (const [c, r, ax, dir] of [[8, 40, 'x', 1], [12, 41, 'x', -1], [20, 41, 'x', 1], [41, 40, 'x', 1], [26, 7, 'z', 1], [31, 5, 'x', -1], [3, 35, 'x', 1]]) {
        const x0 = c * CELL + (ax === 'x' ? 4 : 5), z0 = r * CELL + (ax === 'z' ? 4 : 5);
        addDeck({ x0, x1: x0 + (ax === 'x' ? 12 : 10), z0, z1: z0 + (ax === 'z' ? 12 : 10), ax, dir, fn: k => 2.4 * k * k + ground(x0, z0), name: 'kick' });
      }
      for (const [x0, z0, x1, z1, ax, h] of [[2 * CELL, 8 * CELL + 6, 3 * CELL, 9 * CELL + 14, 'z', 3.2], [3 * CELL + 4, 2 * CELL, 7 * CELL - 4, 3 * CELL, 'x', 2.6], [8 * CELL, 8 * CELL + 4, 9 * CELL, 9 * CELL + 16, 'z', 3.6], [13 * CELL + 4, 7 * CELL, 17 * CELL - 4, 8 * CELL, 'x', 3.0], [18 * CELL, 3 * CELL + 2, 19 * CELL, 6 * CELL - 2, 'z', 3.4], [2 * CELL, 14 * CELL + 4, 3 * CELL, 18 * CELL - 4, 'z', 2.2]])
        HUMPS.push({ x0, z0, x1, z1, ax, h });
    }
    initDecks();
    // ---- one cell at a time
    const R0 = rng(1999);
    const roadMask = (c, r) => { let m = 0; for (let d = 0; d < 4; d++) { const ch = at(c + DX[d], r + DZ[d]); if (isRoad(ch) || (ch === 'q' && isRoad(at(c, r)) === false)) m |= 1 << d; } return m; };
    function surface(B, c, r, tile, sub, yfn) { // a ground tile following the hills (sub x sub pieces)
      const uv = typeof tile === 'number' ? uvOf(tile) : tile; sub = sub || 1;
      for (let i = 0; i < sub; i++) for (let j = 0; j < sub; j++) {
        const x0 = c * CELL + CELL * i / sub, x1 = c * CELL + CELL * (i + 1) / sub, z0 = r * CELL + CELL * j / sub, z1 = r * CELL + CELL * (j + 1) / sub;
        const Y = (x, z) => yfn ? yfn(x, z) : ground(x, z) + 0.02;
        quad(B, [x0, Y(x0, z1), z1], [x1, Y(x1, z1), z1], [x1, Y(x1, z0), z0], [x0, Y(x0, z0), z0], subUV(uv, i / sub, (i + 1) / sub, 1 - (j + 1) / sub, 1 - j / sub));
      }
    }
    const hilly = (c, r) => terrain((c + 0.5) * CELL, (r + 0.5) * CELL) > 0.05 || HUMPS.some(u => u.x1 > c * CELL && u.x0 < (c + 1) * CELL && u.z1 > r * CELL && u.z0 < (r + 1) * CELL);
    function sideways(c, r) { // which side of a building cell faces a road (for the front door): 0..3 or -1
      for (const d of [2, 0, 1, 3]) if (isRoad(at(c + DX[d], r + DZ[d]))) return d;
      for (const d of [2, 0, 1, 3]) if (isOpen(at(c + DX[d], r + DZ[d]))) return d;
      return -1;
    }
    const baseOf = (c, r) => Math.min(terrain(c * CELL, r * CELL), terrain((c + 1) * CELL, r * CELL), terrain(c * CELL, (r + 1) * CELL), terrain((c + 1) * CELL, (r + 1) * CELL)) - 0.5;
    const topOf = (c, r) => Math.max(terrain(c * CELL, r * CELL), terrain((c + 1) * CELL, r * CELL), terrain(c * CELL, (r + 1) * CELL), terrain((c + 1) * CELL, (r + 1) * CELL));
    const FACE_N = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const done = new Uint8Array(N * N);
    function buildCell(c, r) {
      if (done[r * N + c]) return;
      const ch = G[r][c], x0 = c * CELL, z0 = r * CELL, x1 = x0 + CELL, z1 = z0 + CELL, B = secOf(x0 + 1, z0 + 1), R = rng(c * 131 + r * 977 + 7);
      if (ch === '#' || ch === '=' || ch === 'a') {
        surface(B, c, r, uvOf(TILE.road + roadMask(c, r)), hilly(c, r) ? 4 : 1);
        if (ch === '=') bridge(B, c, r);
        else streetBits(B, c, r, R);
        return;
      }
      if (ch === 'q') { surface(B, c, r, TILE.path, hilly(c, r) ? 4 : 1); return; }
      if (ch === 'g' || ch === 't') { surface(B, c, r, TILE.grass, hilly(c, r) ? 4 : 1); if (ch === 't') for (let i = 0; i < 4; i++) { const x = x0 + 3 + R() * 14, z = z0 + 3 + R() * 14; tree(B, x, z, 0.9 + R() * 0.4, R); addSolid({ x0: x - 0.8, x1: x + 0.8, z0: z - 0.8, z1: z + 0.8, h: ground(x, z) + 9, tree: 1 }); } else if (R() < 0.25) { const x = x0 + 4 + R() * 12, z = z0 + 4 + R() * 12; tree(B, x, z, 1 + R() * 0.3, R); addSolid({ x0: x - 0.8, x1: x + 0.8, z0: z - 0.8, z1: z + 0.8, h: ground(x, z) + 9, tree: 1 }); } return; }
      if (ch === 'r') { surface(B, c, r, TILE.tarmac, hilly(c, r) ? 4 : 1); if (R() < 0.3) lamp(B, x0 + 10, z0 + 10, R); return; }
      if (ch === '.') { surface(B, c, r, TILE.sand, 1, (x, z) => 0.12); beachBits(B, c, r, R); return; }
      if (ch === '_') { surface(B, c, r, TILE.prom, 1, () => 0.05); if (c % 3 === 0) lamp(B, x0 + 10, z0 + 18, R, true); return; }
      if (ch === 'p') { pier(B, c, r); return; }
      if (ch === '~') { waterEdges(B, c, r); return; }
      if (ch === '%') { edge(B, c, r, R); return; }
      if ('hsow'.includes(ch)) { building(B, c, r, ch, R); return; }
      // the places are built whole, from their top-left cell
      const L = LMS[ch]; if (L && L.c0 === c && L.r0 === r) landmark(B, L);
    }
    // street furniture on the pavements: lamp posts, bins, a phone box, a post box, bus stops
    function streetBits(B, c, r, R) {
      const m = roadMask(c, r), cx = (c + 0.5) * CELL, cz = (r + 0.5) * CELL;
      for (let d = 0; d < 4; d++) {
        if (m & (1 << d)) continue;
        const [nx, nz] = FACE_N[d], px = cx + nx * 8.3, pz = cz + nz * 8.3;
        if ((c + r + d) % 3 === 0) lamp(B, px, pz, R, false, d);
        const k = R();
        if (k < 0.07) { const y = ground(px, pz); block(B, px - 0.6, pz - 0.6, px + 0.6, pz + 0.6, y, y + 2.6, { side: wuv, top: wuv }, hex(0xd8261c)); block(B, px - 0.5, pz - 0.5, px + 0.5, pz + 0.5, y + 2.6, y + 2.8, { side: wuv, top: wuv }, hex(0xb81a12)); addSolid({ x0: px - 0.7, x1: px + 0.7, z0: pz - 0.7, z1: pz + 0.7, h: y + 2.8 }); }
        else if (k < 0.13) { const y = ground(px, pz); B2cyl(B, px, y, pz, 0.32, 1.4, hex(0xd8261c)); }
        else if (k < 0.16) busStop(B, px, pz, d);
      }
    }
    function B2cyl(B, x, y, z, rad, h, col) { const n = 8; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; quad(B, [x + Math.cos(a0) * rad, y, z + Math.sin(a0) * rad], [x + Math.cos(a1) * rad, y, z + Math.sin(a1) * rad], [x + Math.cos(a1) * rad, y + h, z + Math.sin(a1) * rad], [x + Math.cos(a0) * rad, y + h, z + Math.sin(a0) * rad], wuv, col); } quad(B, [x - rad, y + h, z + rad], [x + rad, y + h, z + rad], [x + rad, y + h, z - rad], [x - rad, y + h, z - rad], wuv, col); }
    function busStop(B, x, z, d) { const y = ground(x, z), [nx, nz] = FACE_N[d], w = 3; const ax = Math.abs(nz) > 0 ? 1 : 0; const x0 = x - (ax ? w : 0.5), x1 = x + (ax ? w : 0.5), z0 = z - (ax ? 0.5 : w), z1 = z + (ax ? 0.5 : w); block(B, x0, z0, x1, z1, y + 2.4, y + 2.6, { side: wuv, top: wuv }, hex(0x2a5ac8)); block(B, x0, z0, x0 + 0.2, z0 + 0.2, y, y + 2.4, { side: wuv }, hex(0x888888)); block(B, x1 - 0.2, z1 - 0.2, x1, z1, y, y + 2.4, { side: wuv }, hex(0x888888)); }
    const lamps = [];
    function lamp(B, x, z, R, prom, d) {
      const y = ground(x, z); block(B, x - 0.15, z - 0.15, x + 0.15, z + 0.15, y, y + 6.5, { side: wuv }, hex(prom ? 0x2a6a4a : 0x6a6a70));
      const hx = d != null ? -FACE_N[d][0] * 1.2 : 0, hz = d != null ? -FACE_N[d][1] * 1.2 : 0;
      block(B, x - 0.1 + Math.min(0, hx), z - 0.1 + Math.min(0, hz), x + 0.1 + Math.max(0, hx), z + 0.1 + Math.max(0, hz), y + 6.4, y + 6.6, { side: wuv, top: wuv }, hex(0x6a6a70));
      lamps.push([x + hx, y + 6.3, z + hz]);
    }
    function bridge(B, c, r) {
      const x0 = c * CELL, z0 = r * CELL, x1 = x0 + CELL, z1 = z0 + CELL, stone = uvOf(TILE.stone);
      // sides over the water (north and south): a parapet
      for (const [zz, nz] of [[z0, -1], [z1, 1]]) {
        block(B, x0, Math.min(zz, zz - nz * 1.2), x1, Math.max(zz, zz - nz * 1.2), 0, 1.3, { side: stone, top: wuv, segW: 10, segH: 1.3 }, [0.9, 0.88, 0.82]);
        addSolid({ x0, x1, z0: Math.min(zz, zz - nz * 1.4), z1: Math.max(zz, zz - nz * 1.4), h: 3 });
        wall(B, (x0 + x1) / 2, zz, 0, nz, CELL, -3, 0, stone, 10, 3, [0.8, 0.78, 0.72]);
      }
      quad(B, [x0, -0.6, z0], [x1, -0.6, z0], [x1, -0.6, z1], [x0, -0.6, z1], wuv, [0.25, 0.25, 0.28]); // the underside
    }
    function beachBits(B, c, r, R) {
      const x0 = c * CELL, z0 = r * CELL;
      if (r === 40 && c % 4 === 1 && c < 34) { // beach huts at the back of the beach
        const x = x0 + 6, z = z0 + 2, uv = uvOf(TILE.hut), k = (c >> 2) % 4, sub = subUV(uv, 0, 1, 1 - (k + 1) / 4, 1 - k / 4);
        block(B, x, z, x + 7, z + 5, 0, 3.2, { side: sub, segW: 7, segH: 3.2 }); pitched(B, x - 0.3, z - 0.3, x + 7.3, z + 5.3, 3.2, 1.4, 'x', TILE.clay);
        addSolid({ x0: x, x1: x + 7, z0: z, z1: z + 5, h: 4.6 });
      }
      if (R() < 0.35) { const x = x0 + 4 + R() * 12, z = z0 + 6 + R() * 10, col = hex([0xe83a3a, 0x3a8ae8, 0xf0d020, 0x3ac86a][(R() * 4) | 0]); // a beach umbrella
        block(B, x - 0.06, z - 0.06, x + 0.06, z + 0.06, 0.1, 2.4, { side: wuv }, [0.9, 0.9, 0.9]); for (let i = 0; i < 6; i++) { const a0 = i / 6 * Math.PI * 2, a1 = (i + 1) / 6 * Math.PI * 2; tri(B, [x, 2.9, z], [x + Math.cos(a1) * 1.8, 2.2, z + Math.sin(a1) * 1.8], [x + Math.cos(a0) * 1.8, 2.2, z + Math.sin(a0) * 1.8], WC, WC, WC, i % 2 ? col : [1, 1, 1]); } }
    }
    function pier(B, c, r) {
      const x0 = c * CELL, z0 = r * CELL, x1 = x0 + CELL, z1 = z0 + CELL;
      quad(B, [x0, 0.6, z1], [x1, 0.6, z1], [x1, 0.6, z0], [x0, 0.6, z0], uvOf(TILE.pier));
      for (const [px, pz] of [[x0 + 2, z0 + 2], [x1 - 2, z0 + 2], [x0 + 2, z1 - 2], [x1 - 2, z1 - 2]]) block(B, px - 0.4, pz - 0.4, px + 0.4, pz + 0.4, -6, 0.5, { side: wuv }, hex(0x4a3020));
      // railings on edges over the sea
      for (let d = 0; d < 4; d++) { const nb = at(c + DX[d], r + DZ[d]); if (nb === 'p' || 'A_'.includes(nb) || nb === '.') continue; const [nx, nz] = FACE_N[d];
        const ex = (x0 + x1) / 2 + nx * 9.7, ez = (z0 + z1) / 2 + nz * 9.7, ax = nz !== 0;
        block(B, ax ? x0 : ex - 0.15, ax ? ez - 0.15 : z0, ax ? x1 : ex + 0.15, ax ? ez + 0.15 : z1, 1.6, 1.8, { side: wuv, top: wuv }, [0.95, 0.95, 0.95]);
        for (let i = 0; i <= 4; i++) { const t = i / 4; const px = ax ? x0 + t * CELL : ex, pz = ax ? ez : z0 + t * CELL; block(B, px - 0.08, pz - 0.08, px + 0.08, pz + 0.08, 0.6, 1.7, { side: wuv }, [0.95, 0.95, 0.95]); }
        addSolid({ x0: ax ? x0 : ex - 0.5, x1: ax ? x1 : ex + 0.5, z0: ax ? ez - 0.5 : z0, z1: ax ? ez + 0.5 : z1, h: 3, rail: 1 }); }
    }
    function waterEdges(B, c, r) { // banks where land meets water
      for (let d = 0; d < 4; d++) {
        const nb = at(c + DX[d], r + DZ[d]); if (nb === '~' || nb === 'p' || nb === '=' || (r + DZ[d]) >= N || (c + DX[d]) < 0 || (c + DX[d]) >= N) continue;
        const [nx, nz] = FACE_N[d], ex = (c + 0.5) * CELL + nx * CELL / 2, ez = (r + 0.5) * CELL + nz * CELL / 2;
        const top = nb === '.' ? 0.12 : nb === '_' ? 0.05 : SOLIDCH.includes(nb) ? 0.5 : Math.max(0.02, ground(ex - nx * 0.5, ez - nz * 0.5));
        wall(B, ex, ez, -nx, -nz, CELL, -3, top, nb === '.' ? uvOf(TILE.sand) : uvOf(TILE.stone), 10, 3, nb === '.' ? [0.9, 0.85, 0.7] : [0.85, 0.83, 0.78]);
      }
    }
    function edge(B, c, r, R) { // the edge of town: a high hedge and trees
      const x0 = c * CELL, z0 = r * CELL, y = ground(x0 + 10, z0 + 10);
      block(B, x0, z0, x0 + CELL, z0 + CELL, y - 1, y + 7, { side: uvOf(TILE.grass), top: uvOf(TILE.grass), segW: 10, segH: 8 }, [0.6, 0.8, 0.55]);
      HB[r * N + c] = y + 30;
      if (R() < 0.7) tree(B, x0 + 10, z0 + 10, 1.6, R);
    }
    // ---- ordinary buildings
    function building(B, c, r, ch, R) {
      const x0 = c * CELL, z0 = r * CELL, x1 = x0 + CELL, z1 = z0 + CELL, base = baseOf(c, r), top0 = topOf(c, r);
      const d = sideways(c, r), front = d < 0 ? 's' : 'nesw'[d];
      const inset = 0.3, X0 = x0 + inset, Z0 = z0 + inset, X1 = x1 - inset, Z1 = z1 - inset;
      let h;
      if (ch === 'h') { // two terraced houses with a pitched roof
        const along = (front === 'n' || front === 's') ? 'x' : 'z', ftile = [TILE.house1, TILE.house2, TILE.house3][(c * 7 + r * 3) % 3];
        h = top0 - base + 7.5;
        const faces = { side: TILE.brick, segW: 10, segH: 7, top: null }; faces[front] = ftile;
        block(B, X0, Z0, X1, Z1, base, base + h, faces);
        pitched(B, X0 - 0.4, Z0 - 0.4, X1 + 0.4, Z1 + 0.4, base + h, 3.6, along, (c + r) % 2 ? TILE.slate : TILE.clay);
        // chimney
        const cx = along === 'x' ? X0 + 4 + R() * 12 : (X0 + X1) / 2, cz = along === 'x' ? (Z0 + Z1) / 2 : Z0 + 4 + R() * 12;
        block(B, cx - 0.6, cz - 0.6, cx + 0.6, cz + 0.6, base + h + 1, base + h + 5, { side: TILE.brick, top: wuv, segW: 1.2, segH: 4 });
        HB[r * N + c] = base + h + 3.6;
      } else if (ch === 's') { // shops: a shop front on the street, flats above
        const floors = 1 + (R() < 0.5 ? 1 : 0); h = top0 - base + 9 + floors * 3.5;
        const faces = { side: TILE.brick, segW: 10, segH: h - (top0 - base), top: TILE.flat }; const ft = [TILE.shop1, TILE.shop2, TILE.shop3][(c * 3 + r) % 3];
        for (let k = 0; k < 4; k++) if (isRoad(at(c + DX[k], r + DZ[k]))) faces['nesw'[k]] = ft;
        block(B, X0, Z0, X1, Z1, base, base + h, faces);
        if (R() < 0.3) { const bx = X0 + 3 + R() * 10, bz = Z0 + 3 + R() * 10; block(B, bx, bz, bx + 3, bz + 2, base + h, base + h + 1.5, { side: wuv, top: wuv }, [0.75, 0.75, 0.78]); }
        HB[r * N + c] = base + h;
      } else if (ch === 'o') { // offices: tall, glassy, taller in the middle of town
        const mid = Math.hypot(c - 24.5, r - 21) < 5 ? 1 : 0, mods = 2 + mid * 2 + ((R() * 2) | 0); h = mods * 12;
        const ft = (c + r) % 3 === 0 ? TILE.office2 : (c * r) % 4 === 1 ? TILE.tower : TILE.office1;
        block(B, X0 + 0.5, Z0 + 0.5, X1 - 0.5, Z1 - 0.5, base, base + h, { side: ft, segW: 10, segH: 12, top: TILE.flat });
        block(B, X0 + 4, Z0 + 4, X1 - 8, Z1 - 6, base + h, base + h + 3, { side: wuv, top: wuv }, [0.7, 0.72, 0.75]);
        if (R() < 0.4) { block(B, X1 - 6, Z0 + 3, X1 - 3, Z0 + 6, base + h, base + h + 8, { side: wuv, top: wuv }, [0.85, 0.85, 0.85]); }
        HB[r * N + c] = base + h;
      } else { // warehouses
        h = 11; const faces = { side: TILE.corr, segW: 10, segH: 11, top: TILE.flat }; faces[front] = TILE.ware;
        block(B, X0, Z0, X1, Z1, base, base + h, faces, [1, 1, 1]);
        pitched(B, X0, Z0, X1, Z1, base + h, 2.5, (front === 'n' || front === 's') ? 'z' : 'x', TILE.corr, [0.8, 0.85, 0.9]);
        HB[r * N + c] = base + h + 2.5;
      }
      // a billboard on some roofs that face a big road
      if ((c * 5 + r * 11) % 23 === 0 && ch !== 'h') { const bh = HB[r * N + c], uv = uvOf((c + r) % 2 ? TILE.bill1 : TILE.bill2); block(B, X0 + 4, Z0 + 9, X1 - 4, Z0 + 10, bh, bh + 7, { side: uv, top: wuv, segW: 12, segH: 7 }); }
    }
    // ---- the 26 places, each built whole
    function signOn(L, text, col, x, y, z, nx, nz, w, h, sub) { // a lit sign facing (nx, nz)
      const uv = signUV(text, col, sub), rx = nz, rz = -nx;
      const P = (a, yy) => [x + rx * a + nx * 0.05, yy, z + rz * a + nz * 0.05];
      quad(signB, P(-w / 2, y), P(w / 2, y), P(w / 2, y + h), P(-w / 2, y + h), uv, WH);
    }
    function frontOf(L) { const [sx, sz] = L.face; return { nx: -sx, nz: -sz }; } // which way the place's front faces (towards its drop-off)
    function landmark(B, L) {
      const x0 = L.c0 * CELL, z0 = L.r0 * CELL, x1 = (L.c1 + 1) * CELL, z1 = (L.r1 + 1) * CELL, base = Math.min(baseOf(L.c0, L.r0), baseOf(L.c1, L.r1)), top0 = Math.max(topOf(L.c0, L.r0), topOf(L.c1, L.r1));
      const { nx, nz } = frontOf(L), ch = L.ch, R = rng(ch.charCodeAt(0) * 31);
      const setH = h => { for (let r = L.r0; r <= L.r1; r++) for (let c = L.c0; c <= L.c1; c++) HB[r * N + c] = h; };
      const fx = (x0 + x1) / 2 + nx * ((x1 - x0) / 2), fz = (z0 + z1) / 2 + nz * ((z1 - z0) / 2); // the middle of the front wall
      const sign = (y, w, h, sub, inset) => signOn(L, L.sign, L.col, fx - nx * (inset || 0) + nx * 0.4, y, fz - nz * (inset || 0) + nz * 0.4, nx, nz, w || Math.min(18, (nx ? z1 - z0 : x1 - x0) * 0.8), h || 3, sub);
      const ground0 = (tile, sub) => { for (let r = L.r0; r <= L.r1; r++) for (let c = L.c0; c <= L.c1; c++) surface(secOf(c * CELL + 1, r * CELL + 1), c, r, tile, sub || 1); };
      const opn = ch2 => { for (let r = L.r0; r <= L.r1; r++) for (let c = L.c0; c <= L.c1; c++) G[r][c] = ch2; };
      const I = 0.4;
      for (let r = L.r0; r <= L.r1; r++) for (let c = L.c0; c <= L.c1; c++) done[r * N + c] = 1;
      switch (ch) {
        case 'A': { // the amusements on the end of the pier: a big shed, a helter-skelter and a big wheel
          for (let r = L.r0; r <= L.r1; r++) for (let c = L.c0; c <= L.c1; c++) pier(secOf(c * CELL + 1, r * CELL + 1), c, r);
          opn('p'); for (let r = L.r0; r <= L.r1; r++) for (let c = L.c0; c <= L.c1; c++) G[r][c] = 'A';
          const bx0 = x0 + 10, bx1 = x1 - 10, bz0 = z0 + 18, bz1 = z1 - 2;
          block(B, bx0, bz0, bx1, bz1, 0.6, 9, { side: TILE.cinema, segW: 10, segH: 8.4, top: TILE.flat }, [1, 0.9, 0.95]);
          addSolid({ x0: bx0, x1: bx1, z0: bz0, z1: bz1, h: 9 });
          for (let r = L.r0; r <= L.r1; r++) for (let c = L.c0; c <= L.c1; c++) HB[r * N + c] = 0.6;
          signOn(L, L.sign, L.col, (bx0 + bx1) / 2, 9.4, bz0 - 0.1, 0, -1, 26, 4);
          L.wheel = { x: x1 - 6, y: 0.6, z: z0 + 10 };
          // the helter-skelter
          const hx = x0 + 5, hz = z0 + 8; for (let i = 0; i < 6; i++) block(B, hx - 2 + i * 0.25, hz - 2 + i * 0.25, hx + 2 - i * 0.25, hz + 2 - i * 0.25, 0.6 + i * 2, 2.6 + i * 2, { side: wuv, top: wuv }, i % 2 ? [0.95, 0.2, 0.2] : [0.97, 0.97, 0.95]);
          addSolid({ x0: hx - 2.2, x1: hx + 2.2, z0: hz - 2.2, z1: hz + 2.2, h: 14 });
          L.dx = (L.c0 + 2) * CELL; L.dz = z0 + 8; break; // drop off on the pier deck in front of the shed
        }
        case 'F': { // the football ground: four stands round a pitch
          const ix0 = x0 + 12, ix1 = x1 - 12, iz0 = z0 + 12, iz1 = z1 - 12;
          quad(B, [ix0, base + 0.3, iz1], [ix1, base + 0.3, iz1], [ix1, base + 0.3, iz0], [ix0, base + 0.3, iz0], uvOf(TILE.pitch));
          for (const [a, b2, c2, d2] of [[x0, z0, x1, iz0], [x0, iz1, x1, z1], [x0, iz0, ix0, iz1], [ix1, iz0, x1, iz1]]) block(B, a + I, b2 + I, c2 - I, d2 - I, base, base + 16, { side: TILE.stand, segW: 10, segH: 16, top: TILE.flat }, [0.95, 0.95, 0.95]);
          // floodlights in the corners
          for (const [px, pz] of [[x0 + 4, z0 + 4], [x1 - 4, z0 + 4], [x0 + 4, z1 - 4], [x1 - 4, z1 - 4]]) { block(B, px - 0.5, pz - 0.5, px + 0.5, pz + 0.5, base + 16, base + 34, { side: wuv }, [0.7, 0.7, 0.72]); block(B, px - 2.5, pz - 0.6, px + 2.5, pz + 0.6, base + 34, base + 37, { side: TILE.office1, top: wuv, segW: 5, segH: 3 }, [1, 1, 1]); lamps.push([px, base + 35, pz]); }
          setH(base + 16); sign(base + 17, 22, 3.5); break;
        }
        case 'N': { // the town hall: columns, a dome and a clock tower in the middle
          block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 16, { side: TILE.hall, segW: 10, segH: 16, top: TILE.flat }, [1, 0.98, 0.92]);
          const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
          block(B, cx - 5, cz - 5, cx + 5, cz + 5, base + 16, base + 40, { side: TILE.stone, segW: 10, segH: 8, top: null }, [1, 0.97, 0.9]);
          for (let k = 0; k < 4; k++) { const [ax, az] = FACE_N[k]; clockFace(cx + ax * 5.05, base + 34, cz + az * 5.05, ax, az); }
          pyramid(B, cx, base + 40, cz, 6, 9, hex(0x4a8a6a));
          setH(base + 16); L.tower = [cx - 5, cz - 5, cx + 5, cz + 5, base + 49]; addSolid({ x0: cx - 5, x1: cx + 5, z0: cz - 5, z1: cz + 5, h: base + 49 }); sign(base + 12.5, 14, 2.6); break;
        }
        case 'T': { // the station: a long brick front with arches, a clock, platforms behind
          block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 12, { side: TILE.station, segW: 10, segH: 12, top: TILE.flat });
          pitched(B, x0 + I, z0 + I, x1 - I, z1 - I, base + 12, 5, nx ? 'z' : 'x', TILE.slate);
          clockFace(fx + nx * 0.5, base + 13.5, fz + nz * 0.5, nx, nz);
          setH(base + 17); sign(base + 8.5, 22, 2.6); break;
        }
        case 'U': { // the church: nave and a spire, in its churchyard
          opn('g'); ground0(TILE.grass, 2); addSolid({ x0: x0 + 6, x1: x1 - 6, z0: z0 + 3, z1: z1 - 3, h: top0 + 19 });
          block(B, x0 + 6, z0 + 3, x1 - 6, z1 - 3, base, top0 + 12, { side: TILE.church, segW: 10, segH: 12, top: null });
          pitched(B, x0 + 5.5, z0 + 2.5, x1 - 5.5, z1 - 2.5, top0 + 12, 7, 'z', TILE.slate);
          const sx = (x0 + x1) / 2, sz = z1 - 10;
          block(B, sx - 4, sz - 4, sx + 4, sz + 4, base, top0 + 24, { side: TILE.stone, segW: 8, segH: 8, top: null });
          pyramid(B, sx, top0 + 24, sz, 4.6, 18, hex(0x5a6068));
          sign(top0 + 2, 12, 2.4, null, 6); break;
        }
        case 'H': { // the hospital: a big white block, a blue H on the roof
          block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 24, { side: TILE.hosp, segW: 10, segH: 12, top: TILE.flat });
          const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
          block(B, cx - 7, cz - 7, cx + 7, cz + 7, base + 24, base + 24.2, { side: wuv, top: wuv }, [0.2, 0.4, 0.9]);
          block(B, cx - 4, cz - 5, cx - 2, cz + 5, base + 24.2, base + 24.4, { side: wuv, top: wuv }, [1, 1, 1]); block(B, cx + 2, cz - 5, cx + 4, cz + 5, base + 24.2, base + 24.4, { side: wuv, top: wuv }, [1, 1, 1]); block(B, cx - 2, cz - 1, cx + 2, cz + 1, base + 24.2, base + 24.4, { side: wuv, top: wuv }, [1, 1, 1]);
          setH(base + 24); sign(base + 5, 18, 3); break;
        }
        case 'C': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 15, { side: TILE.cinema, segW: 10, segH: 15, top: TILE.flat }); setH(base + 15); sign(base + 15.5, 24, 4, 'NOW SHOWING: ATTACK OF THE 50FT GRAN'); break;
        case 'B': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 10, { side: TILE.cinema, segW: 10, segH: 10, top: TILE.flat }, [0.9, 0.85, 1]); setH(base + 10); sign(base + 10.5, 20, 3.5, 'EYES DOWN 7PM'); break;
        case 'E': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 10, { side: TILE.fire, segW: 10, segH: 10, top: TILE.flat }); { const tx = x1 - 6, tz = z0 + 4; block(B, tx - 2.5, tz - 2.5, tx + 2.5, tz + 2.5, base, base + 20, { side: TILE.brick, top: TILE.flat, segW: 5, segH: 10 }); addSolid({ x0: tx - 2.5, x1: tx + 2.5, z0: tz - 2.5, z1: tz + 2.5, h: base + 20 }); } setH(base + 10); sign(base + 7.5, 14, 2.4); break;
        case 'P': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 11, { side: TILE.police, segW: 10, segH: 11, top: TILE.flat }); setH(base + 11); sign(base + 8.8, 10, 2.2); break;
        case 'S': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, top0 + 9, { side: TILE.school, segW: 10, segH: 9, top: TILE.flat }); setH(top0 + 9); sign(top0 + 9.4, 18, 3); break;
        case 'W': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 11, { side: TILE.baths, segW: 10, segH: 11, top: null }); pitched(B, x0 + I, z0 + I, x1 - I, z1 - I, base + 11, 5, 'z', TILE.office2, [0.8, 0.95, 1]); setH(base + 16); sign(base + 11.4, 18, 3); break;
        case 'X': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 12, { side: TILE.hall, segW: 10, segH: 12, top: TILE.flat }, [0.92, 0.9, 1]); setH(base + 12); sign(base + 12.4, 14, 2.6); break;
        case 'V': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 8, { side: TILE.shop2, segW: 10, segH: 8, top: TILE.flat }); setH(base + 8); sign(base + 8.4, 18, 3, 'NEW RELEASES EVERY FRIDAY'); break;
        case 'G': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 9, { side: TILE.shop3, segW: 10, segH: 9, top: TILE.flat }); setH(base + 9); sign(base + 9.4, 16, 3, 'IMPORTS - PRE-OWNED - TRADE INS'); break;
        case 'K': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 8, { side: TILE.shop1, segW: 10, segH: 8, top: TILE.flat }, [1, 1, 0.9]); setH(base + 8); sign(base + 8.4, 18, 3, 'FISH & CHIPS - OPEN TIL LATE'); break;
        case 'Z': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 9, { side: TILE.shop1, segW: 10, segH: 9, top: TILE.flat }, [1, 0.95, 0.85]); setH(base + 9); sign(base + 9.4, 18, 3, 'DEEP PAN - FREE DELIVERY'); break;
        case 'O': block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, base + 10, { side: TILE.bowl, segW: 10, segH: 10, top: TILE.flat }); setH(base + 10); sign(base + 10.4, 20, 3.5, '10 PIN BOWLING - LASER QUEST'); break;
        case 'Q': { // the superstore: the shop at the back, its car park at the front
          const back = 3; let bx0 = x0, bz0 = z0, bx1 = x1, bz1 = z1;
          if (nz > 0) bz1 = z0 + back * CELL; else if (nz < 0) bz0 = z1 - back * CELL; else if (nx > 0) bx1 = x0 + back * CELL; else bx0 = x1 - back * CELL;
          for (let r = L.r0; r <= L.r1; r++) for (let c = L.c0; c <= L.c1; c++) { const cx = (c + 0.5) * CELL, cz = (r + 0.5) * CELL; if (cx > bx0 && cx < bx1 && cz > bz0 && cz < bz1) HB[r * N + c] = base + 12; else { G[r][c] = 'r'; surface(secOf(c * CELL + 1, r * CELL + 1), c, r, TILE.tarmac); } }
          block(B, bx0 + I, bz0 + I, bx1 - I, bz1 - I, base, base + 12, { side: TILE.store, segW: 10, segH: 12, top: TILE.flat });
          signOn(L, L.sign, L.col, nx ? (nx > 0 ? bx1 : bx0) + nx * 0.5 : (x0 + x1) / 2, base + 12.3, nz ? (nz > 0 ? bz1 : bz0) + nz * 0.5 : (z0 + z1) / 2, nx, nz, 24, 4, 'OPEN 8 TIL 8 - 7 DAYS');
          break;
        }
        case 'M': { // the multi-storey: open decks, the ramp up the west side, a roof you can drive on
          const rx1 = x0 + CELL - 1;
          block(B, rx1, z0 + I, x1 - I, z1 - I, base, 15, { side: TILE.deck, segW: 10, segH: 5, top: TILE.tarmac }, [1, 1, 1]);
          // the ramp: a sloping deck on pillars
          const rp = decks.find(d => d.name === 'ramp'), steps = 16;
          for (let i = 0; i < steps; i++) { const za = z1 - (z1 - z0) * i / steps, zb = z1 - (z1 - z0) * (i + 1) / steps, ya = deckH(rp, x0 + 5, za - 0.001), yb = deckH(rp, x0 + 5, zb + 0.001);
            quad(B, [rp.x0, ya, za], [rp.x1, ya, za], [rp.x1, yb, zb], [rp.x0, yb, zb], subUV(uvOf(TILE.tarmac), 0, 1, i / steps, (i + 1) / steps));
            quad(B, [rp.x0, ya - 0.8, za], [rp.x0, yb - 0.8, zb], [rp.x0, yb, zb], [rp.x0, ya, za], wuv, [0.7, 0.7, 0.68]); }
          for (let i = 1; i < 4; i++) { const z = z1 - (z1 - z0) * i / 4, y = deckH(rp, x0 + 5, z); block(B, x0 + 2, z - 0.6, x0 + 3.2, z + 0.6, 0, y - 0.6, { side: wuv }, [0.7, 0.7, 0.68]); block(B, rx1 - 3, z - 0.6, rx1 - 1.8, z + 0.6, 0, y - 0.6, { side: wuv }, [0.7, 0.7, 0.68]); }
          // a yellow and black kicker stripe at the top of the ramp
          block(B, rp.x0, z0, rp.x1, z0 + 1, 0, deckH(rp, x0 + 5, z0 + 0.5), { side: uvOf(TILE.road + 5), top: null }, [1, 0.85, 0.1]);
          for (let r = L.r0; r <= L.r1; r++) { HB[r * N + L.c0] = -50; for (let c = L.c0 + 1; c <= L.c1; c++) HB[r * N + c] = 15; }
          G[L.r0][L.c0] = G[L.r0 + 1][L.c0] = G[L.r0 + 2][L.c0] = G[L.r0 + 3][L.c0] = 'm';
          signOn(L, L.sign, L.col, x1 + 0.3, 12, (z0 + z1) / 2, 1, 0, 14, 2.6, 'ROOF LEVEL - MIND THE GAP');
          L.dx = (L.c1 + 1.5) * CELL - 2; L.dz = (z0 + z1) / 2; break;
        }
        case 'Y': { // the bandstand in the park
          opn('g'); ground0(TILE.grass, 2); const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, y = ground(cx, cz);
          for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; block(B, cx + Math.cos(a) * 5 - 0.2, cz + Math.sin(a) * 5 - 0.2, cx + Math.cos(a) * 5 + 0.2, cz + Math.sin(a) * 5 + 0.2, y + 1, y + 5, { side: wuv }, [0.95, 0.95, 0.95]); }
          block(B, cx - 5.5, cz - 5.5, cx + 5.5, cz + 5.5, y, y + 1, { side: wuv, top: uvOf(TILE.pier) }, [0.9, 0.9, 0.85]);
          pyramid(B, cx, y + 5, cz, 6.5, 3, hex(0x2a8a4a));
          addSolid({ x0: cx - 5.5, x1: cx + 5.5, z0: cz - 5.5, z1: cz + 5.5, h: y + 8 });
          for (let i = 0; i < 6; i++) { const x = x0 + 4 + R() * (x1 - x0 - 8), z = z0 + 4 + R() * (z1 - z0 - 8); if (Math.hypot(x - cx, z - cz) < 10) continue; tree(B, x, z, 1, R); addSolid({ x0: x - 0.8, x1: x + 0.8, z0: z - 0.8, z1: z + 0.8, h: ground(x, z) + 9, tree: 1 }); }
          signOn(L, L.sign, L.col, cx, y + 8.6, cz + 0.1, 0, 1, 8, 1.6); signOn(L, L.sign, L.col, cx, y + 8.6, cz - 0.1, 0, -1, 8, 1.6);
          L.dx = cx; L.dz = cz + 9; break;
        }
        case 'I': { // the ice rink: a curved roof
          block(B, x0 + I, z0 + I, x1 - I, z1 - I, base, top0 + 7, { side: TILE.baths, segW: 10, segH: 7, top: null }, [0.85, 0.95, 1]);
          const cz = (z0 + z1) / 2; for (let i = 0; i < 8; i++) { const a0 = i / 8 * Math.PI, a1 = (i + 1) / 8 * Math.PI, hz = (z1 - z0) / 2 - I; quad(B, [x0 + I, top0 + 7 + Math.sin(a0) * 6, cz - Math.cos(a0) * hz], [x0 + I, top0 + 7 + Math.sin(a1) * 6, cz - Math.cos(a1) * hz], [x1 - I, top0 + 7 + Math.sin(a1) * 6, cz - Math.cos(a1) * hz], [x1 - I, top0 + 7 + Math.sin(a0) * 6, cz - Math.cos(a0) * hz], uvOf(TILE.corr), [0.9, 0.95, 1]); }
          setH(top0 + 13); sign(top0 + 7.4, 16, 2.8); break;
        }
        case 'R': { // the radio station and its mast
          opn('y'); ground0(TILE.yard); addSolid({ x0: x0 + 6, x1: x1 - 6, z0: z0 + 6, z1: z1 - 6, h: base + 9 });
          block(B, x0 + 6, z0 + 6, x1 - 6, z1 - 6, base, base + 9, { side: TILE.office1, segW: 10, segH: 9, top: TILE.flat });
          const mx = x1 - 10, mz = z0 + 10; for (let i = 0; i < 6; i++) block(B, mx - 1.2 + i * 0.15, mz - 1.2 + i * 0.15, mx + 1.2 - i * 0.15, mz + 1.2 - i * 0.15, base + i * 10, base + (i + 1) * 10, { side: wuv }, i % 2 ? [0.95, 0.2, 0.2] : [0.97, 0.97, 0.97]);
          lamps.push([mx, base + 61, mz]); addSolid({ x0: mx - 1.5, x1: mx + 1.5, z0: mz - 1.5, z1: mz + 1.5, h: base + 60 });
          sign(base + 9.4, 14, 2.8, 'HITS OF THE 90S!', 6); break;
        }
        case 'D': { // the docks: a quay shed and two cranes
          block(B, x0 + I, z0 + I, x1 - I, z1 - CELL - I, base, base + 12, { side: TILE.ware, segW: 10, segH: 12, top: null }, [0.9, 0.95, 1]);
          pitched(B, x0 + I, z0 + I, x1 - I, z1 - CELL - I, base + 12, 3, 'z', TILE.corr);
          for (let r = L.r0; r <= L.r1; r++) for (let c = L.c0; c <= L.c1; c++) { if (r === L.r1) { G[r][c] = 'y'; surface(secOf(c * CELL + 1, r * CELL + 1), c, r, TILE.yard); } else HB[r * N + c] = base + 15; }
          for (const cx of [x0 + 8, x1 - 8]) { const cz = z1 - 6; block(B, cx - 0.6, cz - 3, cx + 0.6, cz - 1.8, 0, 22, { side: wuv }, [0.95, 0.65, 0.1]); block(B, cx - 0.6, cz + 1.8, cx + 0.6, cz + 3, 0, 22, { side: wuv }, [0.95, 0.65, 0.1]); block(B, cx - 0.8, cz - 14, cx + 0.8, cz + 8, 22, 24, { side: wuv, top: wuv }, [0.95, 0.65, 0.1]); block(B, cx - 1.5, cz - 6, cx + 1.5, cz - 3, 24, 27, { side: wuv, top: wuv }, [0.9, 0.9, 0.9]); addSolid({ x0: cx - 0.8, x1: cx + 0.8, z0: cz - 3, z1: cz - 1.8, h: 22 }); addSolid({ x0: cx - 0.8, x1: cx + 0.8, z0: cz + 1.8, z1: cz + 3, h: 22 }); }
          sign(base + 12.4, 18, 3); L.dx = (x0 + x1) / 2; L.dz = z1 - 12; break;
        }
        case 'J': { // the junk yard: walls of scrap round a yard
          opn('y'); ground0(TILE.yard);
          for (let i = 0; i < 9; i++) { const sx = x0 + 6 + R() * (x1 - x0 - 12), sz = z0 + 6 + R() * (z1 - z0 - 12), h = 2 + R() * 3; block(B, sx - 2, sz - 1, sx + 2, sz + 1, 0, h, { side: uvOf(TILE.contain), top: uvOf(TILE.corr), segW: 4, segH: h }, [0.8, 0.7, 0.6]); addSolid({ x0: sx - 2, x1: sx + 2, z0: sz - 1, z1: sz + 1, h }); }
          signOn(L, L.sign, L.col, (x0 + x1) / 2, 6, z0 - 0.2, 0, -1, 16, 3, 'WE BUY ANY OLD BANGER');
          L.dx = x0 - 5; L.dz = (z0 + z1) / 2; break;
        }
        case 'L': { // the lighthouse on its rocks
          opn('.'); ground0(TILE.sand); const cx = (x0 + x1) / 2 + 6, cz = (z0 + z1) / 2 + 4;
          for (let i = 0; i < 7; i++) { const r0 = 4 - i * 0.35, r1 = 4 - (i + 1) * 0.35; cone(B, cx, i * 3.4, cz, r0, r1, 3.4, i % 2 ? [0.95, 0.2, 0.2] : [0.97, 0.97, 0.97]); }
          cone(B, cx, 23.8, cz, 2.2, 2.2, 3, [1, 1, 0.8]); cone(B, cx, 26.8, cz, 2.6, 0.2, 2.5, [0.2, 0.2, 0.25]);
          lamps.push([cx, 25.3, cz]); addSolid({ x0: cx - 4, x1: cx + 4, z0: cz - 4, z1: cz + 4, h: 29 });
          signOn(L, L.sign, L.col, cx, 2.5, cz - 4.2, 0, -1, 8, 1.6);
          L.beam = [cx, 25.3, cz]; L.dx = cx - 12; L.dz = cz - 6; break;
        }
      }
    }
    function cone(B, x, y, z, r0, r1, h, col) { const n = 10; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; quad(B, [x + Math.cos(a1) * r0, y, z + Math.sin(a1) * r0], [x + Math.cos(a0) * r0, y, z + Math.sin(a0) * r0], [x + Math.cos(a0) * r1, y + h, z + Math.sin(a0) * r1], [x + Math.cos(a1) * r1, y + h, z + Math.sin(a1) * r1], wuv, col); } }
    function pyramid(B, x, y, z, r, h, col) { const P = [[x - r, y, z - r], [x + r, y, z - r], [x + r, y, z + r], [x - r, y, z + r]], top = [x, y + h, z]; for (let i = 0; i < 4; i++) tri(B, P[(i + 1) % 4], P[i], top, WC, WC, WC, col.map(v => v * (0.75 + 0.08 * i))); }
    function clockFace(x, y, z, nx, nz) { const uv = clockUV(); const rx = nz, rz = -nx, s = 2.6; const P = (a, b) => [x + rx * a + nx * 0.06, y + b, z + rz * a + nz * 0.06]; quad(signB, P(-s, -s), P(s, -s), P(s, s), P(-s, s), uv, WH); }
    let clockU = null;
    function clockUV() { if (clockU) return clockU; const i = signN++, x = (i % 4) * 256, y = (i >> 2) * 52; sg.fillStyle = '#f0e8d0'; sg.beginPath(); sg.arc(x + 26, y + 26, 24, 0, 7); sg.fill(); sg.strokeStyle = '#2a2a2a'; sg.lineWidth = 2; sg.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; sg.fillStyle = '#222'; sg.fillRect(x + 26 + Math.cos(a) * 19 - 1, y + 26 + Math.sin(a) * 19 - 1, 2, 2); } sg.beginPath(); sg.moveTo(x + 26, y + 26); sg.lineTo(x + 26, y + 10); sg.moveTo(x + 26, y + 26); sg.lineTo(x + 38, y + 26); sg.stroke(); return clockU = [(x + 1) / 1024, 1 - (y + 51) / 1024, (x + 51) / 1024, 1 - (y + 1) / 1024]; }

    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) buildCell(c, r);
    // the multi-storey's ramp cells and the like are now part of the map
    signTex.needsUpdate = true;
    const cityMeshes = [];
    const toMesh = (B, mat) => { if (!B.p.length) return null; const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(B.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(B.n, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(B.u, 2)); g.setAttribute('color', new T.Float32BufferAttribute(B.c, 3)); g.computeBoundingSphere(); T3.keep(g); const m = new T.Mesh(g, mat); T3.add(m); return m; };
    for (const B of secs) { const m = toMesh(B, cityMat); if (m) cityMeshes.push(m); }
    const signMesh = toMesh(signB, signMat);

    window.__taxiCity = { G, LMS, Hat, ground, decks, solids, HB, N, CELL };
    return makePlay(K, { T3, T, HUD, F, W, HH, G, at, LMS, Hat, ground, isWater, decks, solids, HB, lamps, cityMat, signMat, texDay, texGlow, atlasDay, isRoad, isOpen, roadMask, cellOf, quad, block, wall, uvOf, wuv, hex, toMesh, tri, signUV, signB, Geo: () => ({ p: [], n: [], u: [], c: [] }) });
  }

  // ================================================================ the people who want a cab
  // look: shirt, legs, skin, hair, extra; tip: how generous; pref: places they like going; lines: what they say
  const FOLK = [
    { id: 'gran', n: 'GRAN', shirt: 0xb070c0, legs: 0x6a4a8a, skin: 0xf0c8a0, hair: 0xe8e8e8, extra: 'bun', tip: 1.3, pitch: 1.5, pref: 'BUX', get: ['OOH, A TAXI! {D}, DEAR.', '{D} PLEASE, AND MIND MY SHOPPING.'], go: 'STEADY ON!', hurry: 'MY PROGRAMME STARTS AT SIX!', crazy: ['WHEEE!', 'JUST LIKE THE DODGEMS!', 'I HAVEN\'T HAD THIS MUCH FUN SINCE 1953!'], fast: 'HERE\'S A LITTLE SOMETHING, DUCK.', slow: 'I COULD HAVE WALKED QUICKER.', bail: 'I\'LL GET THE BUS!' },
    { id: 'surf', n: 'SURFER', shirt: 0x3ad0e0, legs: 0xf08a2a, skin: 0xe0a070, hair: 0xf0e060, extra: 'board', tip: 1.1, pitch: 0.9, pref: 'LAW', get: ['ALRIGHT DUDE! {D}, PRONTO!', 'SURF\'S UP! {D}, STEP ON IT!'], go: 'RADICAL!', hurry: 'THE WAVES ARE GOING, MAN!', crazy: ['TOTALLY GNARLY!', 'AIR TIME, DUDE!', 'COWABUNGA!'], fast: 'MEGA! KEEP THE CHANGE, DUDE.', slow: 'BOGUS, MAN. TOTALLY BOGUS.', bail: 'I\'LL SKATE IT, DUDE!' },
    { id: 'suit', n: 'BUSINESSMAN', shirt: 0x3a3a4a, legs: 0x2a2a3a, skin: 0xf0c8a0, hair: 0x4a3020, extra: 'tie', tip: 1.4, pitch: 0.8, pref: 'TNPH', get: ['{D}. I HAVE A MEETING.', '{D}, QUICKLY. I\'M ON MY MOBILE.'], go: 'TIME IS MONEY!', hurry: 'MY SHARES ARE CRASHING!', crazy: ['GOOD GRIEF!', 'THAT WAS NOT IN THE BUDGET!', 'MY FILOFACTS!'], fast: 'EXCELLENT. YOU\'RE HIRED.', slow: 'THIS IS COMING OUT OF YOUR TIP.', bail: 'I\'LL CALL A PROPER CAB!' },
    { id: 'kid', n: 'SCHOOLKID', shirt: 0x2a3a8a, legs: 0x3a3a3a, skin: 0xf0c8a0, hair: 0x8a5a2a, extra: 'bag', tip: 0.8, pitch: 1.6, pref: 'SXG', get: ['{D}! I\'M LATE FOR DOUBLE MATHS!', '{D}, QUICK, BEFORE THE BELL GOES!'], go: 'GO GO GO!', hurry: 'I\'M GONNA GET DETENTION!', crazy: ['MY MATES WILL NEVER BELIEVE THIS!', 'WICKED!', 'DO IT AGAIN!'], fast: 'MADE IT! YOU\'RE AMAZING!', slow: 'DETENTION. CHEERS.', bail: 'I\'LL BUNK OFF INSTEAD!' },
    { id: 'fan', n: 'FOOTIE FAN', shirt: 0xe02a2a, legs: 0xf0f0f0, skin: 0xf0c8a0, hair: 0x2a1a10, extra: 'scarf', tip: 1.0, pitch: 1.0, pref: 'FKZ', get: ['{D}! KICK-OFF IN TEN!', 'COME ON YOU REDS! {D}!'], go: 'GET IN!', hurry: 'I\'M MISSING THE KICK-OFF!', crazy: ['GOOOAL!', 'WHAT A RUN!', 'BACK OF THE NET!'], fast: 'GET IN THERE! CHEERS, MATE!', slow: 'IT\'S HALF TIME ALREADY!', bail: 'I\'LL LISTEN ON THE RADIO!' },
    { id: 'nurse', n: 'NURSE', shirt: 0x8ac0f0, legs: 0x8ac0f0, skin: 0xe8b890, hair: 0x2a1a10, extra: 'cap', tip: 1.0, pitch: 1.3, pref: 'HW', get: ['{D} PLEASE, MY SHIFT STARTS SOON.'], go: 'THANK YOU!', hurry: 'MATRON WILL KILL ME!', crazy: ['OH MY GOODNESS!', 'THAT CAN\'T BE SAFE!'], fast: 'BRILLIANT. YOU\'RE A STAR.', slow: 'MATRON IS NOT GOING TO BE HAPPY.', bail: 'I\'LL RUN IT!' },
    { id: 'rock', n: 'ROCKER', shirt: 0x1a1a1a, legs: 0x2a2a6a, skin: 0xf0c8a0, hair: 0x1a1a1a, extra: 'mohawk', tip: 1.2, pitch: 0.85, pref: 'RCO', get: ['{D}! I\'M ON AT EIGHT!', 'THE GIG\'S AT {D}, MATE!'], go: 'ROCK ON!', hurry: 'THE BAND\'S WAITING!', crazy: ['ROCK AND ROLL!', 'TURN IT UP TO ELEVEN!', 'YEAAAH!'], fast: 'LEGEND! HAVE A BACKSTAGE PASS!', slow: 'SOUNDCHECK\'S OVER, MAN.', bail: 'I\'LL CROWD SURF THERE!' },
    { id: 'tour', n: 'TOURIST', shirt: 0xf0e040, legs: 0xc8b080, skin: 0xf0d0b0, hair: 0xa07040, extra: 'hat', tip: 1.2, pitch: 1.1, pref: 'LAIN', get: ['{D}, PLEASE! I WANT A PHOTO!', 'EXCUSE ME, {D} PLEASE?'], go: 'HOW EXCITING!', hurry: 'THE LIGHT IS PERFECT RIGHT NOW!', crazy: ['SAY CHEESE!', 'WHAT A VIEW!', 'IS THIS NORMAL HERE?'], fast: 'LOVELY! THE BEST TOUR EVER!', slow: 'THE SUN HAS GONE IN NOW.', bail: 'I\'LL TAKE THE TOURIST BUS!' },
    { id: 'bride', n: 'BRIDE', shirt: 0xf8f8f8, legs: 0xf8f8f8, skin: 0xf0c8a0, hair: 0x8a5a2a, extra: 'veil', tip: 1.6, pitch: 1.4, pref: 'UN', get: ['{D}! I\'M GETTING MARRIED IN TEN MINUTES!'], go: 'HURRY!', hurry: 'HE\'LL THINK I\'VE JILTED HIM!', crazy: ['MY DRESS!', 'MIND THE VEIL!', 'SOMETHING BORROWED, SOMETHING SCARY!'], fast: 'YOU SAVED MY WEDDING! HAVE SOME CAKE!', slow: 'FASHIONABLY LATE, I SUPPOSE.', bail: 'I\'LL GET A HORSE AND CART!' },
    { id: 'chef', n: 'CHEF', shirt: 0xf8f8f8, legs: 0x3a3a3a, skin: 0xe0b080, hair: 0x2a1a10, extra: 'chef', tip: 1.0, pitch: 0.95, pref: 'ZKQ', get: ['{D}, CHOP CHOP!', '{D}! THE FRYER\'S ON!'], go: 'MAMMA MIA!', hurry: 'MY DOUGH IS RISING!', crazy: ['BELLISSIMO!', 'NOW THAT\'S HOT!'], fast: 'PERFECTO! FREE GARLIC BREAD!', slow: 'THE CHEESE HAS SET.', bail: 'I\'LL DELIVER MYSELF!' },
    { id: 'vicar', n: 'VICAR', shirt: 0x1a1a1a, legs: 0x1a1a1a, skin: 0xf0c8a0, hair: 0x9a9a9a, extra: 'collar', tip: 1.1, pitch: 0.9, pref: 'UYX', get: ['{D}, AND DON\'T SPARE THE HORSES.'], go: 'BLESS YOU!', hurry: 'THE BELLS! THE BELLS!', crazy: ['GOOD HEAVENS!', 'HALLELUJAH!', 'GOODNESS GRACIOUS!'], fast: 'A MIRACLE! BLESS YOU, CHILD.', slow: 'PATIENCE IS A VIRTUE, I SUPPOSE.', bail: 'I SHALL WALK. IN A MYSTERIOUS WAY.' },
    { id: 'fire', n: 'FIREFIGHTER', shirt: 0x2a2a2a, legs: 0x2a2a2a, skin: 0xf0c8a0, hair: 0x2a1a10, extra: 'helmet', tip: 1.0, pitch: 0.8, pref: 'EP', get: ['{D}! QUICK, IT\'S MY SHIFT!'], go: 'NEE-NAW!', hurry: 'I CAN HEAR THE BELL!', crazy: ['NOW THAT\'S A BLAZE!', 'HOT STUFF!'], fast: 'TOP DRIVING. YOU SHOULD JOIN US!', slow: 'THE FIRE\'S OUT ALREADY.', bail: 'I\'LL SLIDE DOWN A POLE!' },
    { id: 'post', n: 'POSTIE', shirt: 0xd82a2a, legs: 0x1a2a5a, skin: 0xe8c098, hair: 0x5a3a20, extra: 'cap', tip: 0.9, pitch: 1.0, pref: 'DJTR', get: ['{D}. PARCEL FOR A BOAT.', 'SPECIAL DELIVERY! {D}!'], go: 'FIRST CLASS!', hurry: 'IT\'S RECORDED DELIVERY!', crazy: ['RETURN TO SENDER!', 'FRAGILE! FRAGILE!'], fast: 'SIGNED, SEALED, DELIVERED!', slow: 'SECOND CLASS, THAT.', bail: 'I\'LL TAKE THE BIKE!' },
    { id: 'banana', n: 'BANANA MAN', shirt: 0xf8e020, legs: 0xf8e020, skin: 0xf8e020, hair: 0x6a5010, extra: 'banana', tip: 1.5, pitch: 1.2, rare: 1, pref: 'NC', get: ['FANCY DRESS PARTY AT {D}!', '{D}. DON\'T ASK.'], go: 'APPEEELING!', hurry: 'I\'M GOING BROWN!', crazy: ['BANANARAMA!', 'I\'M GOING BANANAS!', 'SPLIT!'], fast: 'TOP BANANA!', slow: 'I\'M OVERRIPE NOW.', bail: 'I\'LL SLIP AWAY!' },
  ];
  // Jack's mates (and Mom) turn up now and then
  const MATES = [
    { id: 'dave', n: 'DAVE', shirt: 0x2a8a3a, legs: 0x2a3a6a, skin: 0xf0c8a0, hair: 0x6a4020, extra: 'cap', tip: 1.2, pitch: 1.2, pref: 'G', get: ['DAVE: THE GAMES SHOP! THE NEW ULTRA 64 GAMES ARE IN!'], go: 'GO ON, JACK!', hurry: 'THEY ONLY HAD THREE COPIES!', crazy: ['THIS IS BETTER THAN KART KAOS!', 'MENTAL!'], fast: 'CHEERS JACK! SEE YOU AT SCHOOL!', slow: 'SOLD OUT. CHEERS, JACK.', bail: 'I\'LL GET MY MOM TO TAKE ME!' },
    { id: 'luke', n: 'LUKE', shirt: 0xe82a2a, legs: 0x2a2a3a, skin: 0xe8b890, hair: 0xe8c060, extra: 'bag', tip: 1.2, pitch: 1.3, pref: 'A', get: ['LUKE: THE PIER ARCADE! I\'VE GOT A POCKET FULL OF 10Ps!'], go: 'WAHOO!', hurry: 'MY HIGH SCORE IS WAITING!', crazy: ['DO A BARREL ROLL!', 'WICKED!'], fast: 'LEGEND! I OWE YOU A GO ON THE DRIVING GAME!', slow: 'THE ARCADE SHUTS AT SIX, JACK.', bail: 'I\'LL WALK. SLOWLY.' },
    { id: 'callum', n: 'CALLUM', shirt: 0x3a3a3a, legs: 0x2a2a5a, skin: 0xf0c8a0, hair: 0x2a1a10, extra: 'glasses', tip: 1.2, pitch: 1.1, pref: 'X', get: ['CALLUM: THE LIBRARY. THEY\'VE GOT THE INTERNET NOW!'], go: 'FASTER THAN MY 56K!', hurry: 'MY HOUR ON THE COMPUTER STARTS NOW!', crazy: ['THAT\'S LIKE A PC GAME!', 'LAG FREE!'], fast: 'CHEERS JACK. I\'LL E-MAIL YOU.', slow: 'MY SESSION TIMED OUT.', bail: 'I\'LL DIAL UP FROM HOME!' },
    { id: 'jackk', n: 'JACKK', shirt: 0x2a5ad8, legs: 0x3a3a3a, skin: 0xf0c8a0, hair: 0x2a1a10, extra: 'cap', tip: 1.2, pitch: 1.15, pref: 'V', get: ['JACKK: VIDEO VAULT! IT\'S FILM NIGHT AT MINE!'], go: 'GO ON, OTHER JACK!', hurry: 'THEY\'LL RENT OUT THE LAST COPY!', crazy: ['THIS IS LIKE A FILM!', 'TWO JACKS, ONE CAB!'], fast: 'NICE ONE, JACK! COME ROUND LATER!', slow: 'ALL THE GOOD ONES ARE GONE.', bail: 'I\'LL WATCH THE TELLY INSTEAD!' },
  ];
  const MOM = { id: 'mom', n: 'MOM', shirt: 0x8a3a6a, legs: 0x3a3a5a, skin: 0xf0c8a0, hair: 0x6a3a1a, extra: 'bag', tip: 1.0, pitch: 1.25, pref: 'Q', get: ['MOM: JACK?! WHAT ARE YOU DOING DRIVING A TAXI?', 'MOM: ...THE SUPERSTORE, THEN. AND CAREFULLY.'], go: 'TWO HANDS ON THE WHEEL!', hurry: 'THE FROZEN PEAS ARE MELTING!', crazy: ['JACK! SLOW DOWN THIS INSTANT!', 'WAIT TILL YOUR DAD HEARS!', 'I\'M TELLING YOUR GRAN!'], fast: 'WE WILL TALK ABOUT THIS AT HOME.', slow: 'AT LEAST YOU\'RE CAREFUL. GOOD BOY.', bail: 'I\'LL GET THE BUS, YOUNG MAN!' };

  const DRIVERS = [
    { id: 'gaz', n: 'GAZ', car: 'saloon', col: 0xffd21a, acc: 20, top: 34, grip: 9, turn: 2.0, mass: 1.0, blurb: ['THE ALL-ROUNDER.', 'NEVER LATE. WELL, HARDLY EVER.'] },
    { id: 'tracy', n: 'TRACY', car: 'hatch', col: 0xff5ab4, acc: 24, top: 32, grip: 10.5, turn: 2.3, mass: 0.8, blurb: ['QUICK OFF THE LINE.', 'KNOWS EVERY SHORT CUT IN TOWN.'] },
    { id: 'kev', n: 'BIG KEV', car: 'black', col: 0x1c1c22, acc: 17, top: 37.5, grip: 8, turn: 1.8, mass: 1.7, blurb: ['HEAVY AND FAST.', 'TRAFFIC GETS OUT OF HIS WAY.'] },
    { id: 'nan', n: 'NAN', car: 'estate', col: 0x7ab8e8, acc: 19.5, top: 33.5, grip: 13, turn: 2.6, mass: 1.0, lock: 1, blurb: ['FORTY YEARS, NO CLAIMS.', 'CORNERS LIKE A RALLY DRIVER.'] },
  ];
  const TODS = [
    { n: 'DAY', top: 0x2a6ad8, hor: 0xc8e8ff, fog: 0xbfe0f8, near: 180, far: 560, hemi: 0.85, sun: 0.95, sunCol: 0xfff2dc, dir: [0.45, 1, 0.3], glow: 0, sea: 0x2a7ad0, land: 0x6a9a50, hills: 0x9ab8c8 },
    { n: 'SUNSET', top: 0x3a2a7a, hor: 0xffa060, fog: 0xe8a888, near: 150, far: 500, hemi: 0.62, sun: 0.9, sunCol: 0xffb070, dir: [-0.9, 0.32, 0.25], glow: 0.5, sea: 0x5a5aa0, land: 0x5a6a40, hills: 0xa07a98 },
    { n: 'NIGHT', top: 0x02040e, hor: 0x1a2a58, fog: 0x0e1834, near: 100, far: 400, hemi: 0.42, sun: 0.32, sunCol: 0x8aa0ff, dir: [0.3, 1, -0.4], glow: 1, sea: 0x0a1a3a, land: 0x1a2a20, hills: 0x1a2238 },
  ];
  // the Crazy Box: ten licence tests
  const TESTS = [
    { id: 'jump', n: 'CRAZY JUMP', how: ['DRIVE UP THE CAR PARK RAMP', 'AND FLY OFF THE TOP!', 'HOW FAR CAN YOU GO?'], unit: 'M', med: [30, 42, 54], hi: 1, time: 30 },
    { id: 'drift', n: 'CRAZY DRIFT', how: ['HOLD ' + 'C' + ' AND STEER TO DRIFT.', 'DRIFT AS LONG AS YOU CAN', 'IN 25 SECONDS.'], unit: 'S', med: [4, 7, 10], hi: 1, time: 25 },
    { id: 'through', n: 'CRAZY THROUGH', how: ['SKIM PAST THE TRAFFIC', 'AT SPEED WITHOUT HITTING IT.', 'NEAR MISSES IN 40 SECONDS.'], unit: '', med: [4, 7, 10], hi: 1, time: 40 },
    { id: 'pop', n: 'BALLOON POP', how: ['POP ALL 15 BALLOONS', 'ON THE BEACH.', 'QUICK AS YOU CAN!'], unit: 'S', med: [60, 45, 35], hi: 0, time: 60 },
    { id: 'slalom', n: 'CONE SLALOM', how: ['DRIVE THROUGH EVERY GATE', 'ALONG THE PROMENADE.', 'A MISSED GATE COSTS 3 SECONDS.'], unit: 'S', med: [38, 30, 24], hi: 0, time: 60 },
    { id: 'bowl', n: 'BEACH BOWLING', how: ['ONE RUN AT THE GIANT SKITTLES.', 'KNOCK THEM ALL DOWN', 'FOR A STRIKE!'], unit: '', med: [5, 8, 10], hi: 1, time: 14 },
    { id: 'park', n: 'PARK IT', how: ['STOP IN EACH GREEN BOX.', 'THREE BOXES.', 'FAST AND NEAT!'], unit: 'S', med: [50, 38, 28], hi: 0, time: 60 },
    { id: 'dash', n: 'CRAZY DASH', how: ['BRAKE, THEN HIT GO STRAIGHT', 'AWAY FOR A CRAZY DASH!', 'GET TO THE FLAG FAST.'], unit: 'S', med: [13, 11, 9.5], hi: 0, time: 20 },
    { id: 'rush', n: 'RUSH HOUR', how: ['DELIVER THREE FARES', 'AGAINST THE CLOCK.', 'GO GO GO!'], unit: 'S', med: [110, 90, 72], hi: 0, time: 110 },
    { id: 'leap', n: 'RIVER LEAP', how: ['THE ROAD ENDS AT THE RIVER.', 'THERE\'S A RAMP. GO FAST.', 'REALLY FAST.'], unit: 'S', med: [30, 20, 13], hi: 0, time: 30 },
  ];
  const RANKS = [[0, 'LEARNER'], [60, 'L-PLATE PRO'], [150, 'CABBIE'], [300, 'ROAD HOG'], [500, 'SPEED MERCHANT'], [800, 'CRAZY!'], [1200, 'MAD MINICAB LEGEND']];
  const SONGS = {
    a: { bpm: 172, wave: 'sawtooth', vol: 0.034, bassWave: 'square', drums: 'o.x.oox.o.x.oxx.',
      lead: [64, -1, 64, 67, -1, 69, 71, -1, 69, 67, -1, 64, 62, -1, 64, -1, 64, -1, 64, 67, -1, 69, 72, -1, 71, 69, -1, 67, 69, -1, -1, -1,
        76, -1, 74, 72, -1, 71, 69, -1, 71, 72, -1, 74, 76, -1, 79, -1, 76, -1, 74, 72, -1, 69, 71, -1, 67, 64, -1, 62, 64, -1, -1, -1],
      bass: [40, 40, 52, 40, 40, 52, 40, 52, 43, 43, 55, 43, 45, 45, 57, 45, 40, 40, 52, 40, 40, 52, 40, 52, 38, 38, 50, 38, 43, 43, 55, 43] },
    b: { bpm: 184, wave: 'square', vol: 0.03, bassWave: 'sawtooth', drums: 'o.xoo.x.o.xoo.xx',
      lead: [69, -1, 69, 72, -1, 69, 74, -1, 72, 69, -1, 67, 69, -1, -1, -1, 69, -1, 69, 72, -1, 74, 76, -1, 79, 76, -1, 74, 76, -1, -1, -1,
        81, -1, 79, 76, -1, 74, 76, -1, 74, 72, -1, 69, 72, -1, 74, -1, 69, -1, 72, 74, -1, 76, 74, -1, 72, 69, -1, 67, 69, -1, -1, -1],
      bass: [45, 45, 57, 45, 45, 57, 45, 57, 41, 41, 53, 41, 43, 43, 55, 43] },
    menu: { bpm: 128, wave: 'triangle', vol: 0.05, bassWave: 'square', drums: 'o...x...o.o.x...',
      lead: [76, -1, 79, -1, 81, -1, 79, 76, -1, -1, 74, -1, 72, -1, 74, -1, 76, -1, 79, -1, 84, -1, 83, 81, -1, -1, 79, -1, -1, -1, 0, 0],
      bass: [48, 0, 55, 0, 52, 0, 55, 0, 45, 0, 52, 0, 48, 0, 52, 0, 41, 0, 48, 0, 45, 0, 48, 0, 43, 0, 50, 0, 47, 0, 50, 0] },
  };

  function makePlay(K, C) {
    const { T3, T, HUD, F, W, HH, G, at, LMS, Hat, ground, isWater, lamps, cityMat, signMat, cellOf, quad, block, uvOf, wuv, hex, tri, signUV } = C;
    const scene = T3.scene, cam = T3.cam, sfx = K.sfx;
    cam.fov = 64; cam.near = 0.3; cam.far = 1000; cam.updateProjectionMatrix();
    const L3 = T3.lights({ amb: 0.85, sun: 0.95, dir: [0.45, 1, 0.3], skyCol: 0xffffff, groundCol: 0x8a8070 });
    const disposeList = [];
    const keepM = m => { disposeList.push(m); return m; };
    const geoOf = B => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(B.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(B.n, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(B.u, 2)); g.setAttribute('color', new T.Float32BufferAttribute(B.c, 3)); g.computeBoundingSphere(); T3.keep(g); return g; };
    const Geo = () => ({ p: [], n: [], u: [], c: [] });
    const subUV = (uv, f0, f1, g0, g1) => [lerp(uv[0], uv[2], f0), lerp(uv[1], uv[3], g0), lerp(uv[0], uv[2], f1), lerp(uv[1], uv[3], g1)];
    const WC = [0.5625, 0.5625];

    // ---------------------------------------------------------------- save
    const sv0 = K.load() || {};
    const sv = Object.assign({ money: 0, medals: {}, opts: {}, unlock: {}, driver: 0, fares: 0, mates: {}, shifts: 0, best: {} }, sv0);
    sv.opts = Object.assign({ tod: 0, music: 1, arrow: 0, cam: 0 }, sv.opts || {});
    if (!Array.isArray(sv.hi)) sv.hi = [['DAVE', 640], ['LUKE', 520], ['CALLUM', 450], ['JACKK', 380], [castN('cousin', 'KIM').toUpperCase(), 290], [castN('kidPoke', 'SAM').toUpperCase(), 210], ['MOM', 120], ['GUBBINZ', 60]];
    let vmuT = 0;
    const save = () => { try { K.save(sv); } catch (e) {} vmuT = 1.6; };
    const medalCount = () => Object.values(sv.medals).filter(v => v > 0).length, goldCount = () => Object.values(sv.medals).filter(v => v >= 3).length;
    const unlocked = d => !d.lock || sv.unlock.nan || medalCount() >= 5 || (sv.money | 0) >= 300;

    // ---------------------------------------------------------------- the sky, the sea, the land round the town
    const skyGeo = new T.SphereGeometry(900, 18, 12); T3.keep(skyGeo);
    skyGeo.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(skyGeo.attributes.position.count * 3), 3));
    const sky = new T.Mesh(skyGeo, keepM(new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })));
    sky.renderOrder = -10; scene.add(sky);
    const starG = new T.BufferGeometry(), sp = []; const SR = rng(77); for (let i = 0; i < 400; i++) { const a = SR() * Math.PI * 2, e = 0.12 + SR() * 1.3; sp.push(Math.cos(a) * Math.cos(e) * 850, Math.sin(e) * 850, Math.sin(a) * Math.cos(e) * 850); }
    starG.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); T3.keep(starG);
    const stars = new T.Points(starG, keepM(new T.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false, depthWrite: false })));
    scene.add(stars);
    const seaCv = document.createElement('canvas'); seaCv.width = seaCv.height = 128; { const g = seaCv.getContext('2d'), R = rng(5); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '180,215,255' : '120,160,220'},${0.3 + R() * 0.5})`; g.fillRect(R() * 128, R() * 128, 6 + R() * 18, 1 + R() * 2); } }
    const seaTex = new T.CanvasTexture(seaCv); seaTex.wrapS = seaTex.wrapT = T.RepeatWrapping; seaTex.repeat.set(160, 160); disposeList.push(seaTex);
    const seaMat = keepM(new T.MeshLambertMaterial({ map: seaTex, color: 0x2a7ad0 }));
    const sea = new T.Mesh(T3.keep(new T.PlaneGeometry(5000, 5000)), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.set(SIZE / 2, -1.1, SIZE / 2); scene.add(sea);
    const landMat = keepM(new T.MeshLambertMaterial({ color: 0x6a9a50 }));
    for (const [x0, z0, x1, z1] of [[-2500, -2500, 0, 840], [SIZE, -2500, SIZE + 2500, 840], [0, -2500, SIZE, 0]]) { const m = new T.Mesh(T3.keep(new T.PlaneGeometry(x1 - x0, z1 - z0)), landMat); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); scene.add(m); }
    // distant hills (no fog: a painted backdrop)
    const hillB = Geo(), HR = rng(9);
    for (let i = 0; i < 26; i++) { const a = Math.PI * 0.95 + i / 25 * Math.PI * 1.1, d = 650 + HR() * 180, x = SIZE / 2 + Math.cos(a) * d, z = SIZE / 2 + Math.sin(a) * d, r = 120 + HR() * 120, h = 40 + HR() * 70; for (let k = 0; k < 9; k++) { const a0 = k / 9 * Math.PI * 2, a1 = (k + 1) / 9 * Math.PI * 2; tri(hillB, [x, h, z], [x + Math.cos(a1) * r, 0, z + Math.sin(a1) * r], [x + Math.cos(a0) * r, 0, z + Math.sin(a0) * r], WC, WC, WC, [[1, 1, 1], [0.8, 0.8, 0.8], [0.8, 0.8, 0.8]]); } }
    const hillMat = keepM(new T.MeshBasicMaterial({ vertexColors: true, color: 0x9ab8c8, fog: false }));
    scene.add(new T.Mesh(geoOf(hillB), hillMat));
    // street lamps glow at night
    const glowCv = document.createElement('canvas'); glowCv.width = glowCv.height = 64; { const g = glowCv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(255,200,120,.6)'); gr.addColorStop(1, 'rgba(255,160,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    const glowTex = new T.CanvasTexture(glowCv); disposeList.push(glowTex);
    const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(lamps.flat(), 3)); T3.keep(lg);
    const lampGlow = new T.Points(lg, keepM(new T.PointsMaterial({ map: glowTex, size: 7, sizeAttenuation: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 1 })));
    scene.add(lampGlow);
    let tod = 0;
    function setTod(i) {
      tod = i; const P = TODS[i];
      scene.fog.color.setHex(P.fog); scene.fog.near = P.near; scene.fog.far = P.far; scene.background = new T.Color(P.fog);
      const col = skyGeo.attributes.color, pos = skyGeo.attributes.position, a = new T.Color(P.hor), b = new T.Color(P.top), c = new T.Color();
      for (let k = 0; k < pos.count; k++) { const y = pos.getY(k) / 900; c.copy(a).lerp(b, clamp(Math.pow(Math.max(0, y), 0.55), 0, 1)); if (y < 0) c.copy(a); col.setXYZ(k, c.r, c.g, c.b); }
      col.needsUpdate = true;
      L3.hemi.intensity = P.hemi; L3.sun.intensity = P.sun; L3.sun.color.setHex(P.sunCol); L3.sun.position.set(...P.dir);
      cityMat.emissive.setScalar(P.glow * 0.95); seaMat.color.setHex(P.sea); landMat.color.setHex(P.land); hillMat.color.setHex(P.hills);
      stars.visible = i === 2; lampGlow.visible = P.glow > 0; lampGlow.material.opacity = P.glow;
      signMat.color.setScalar(i === 0 ? 0.85 : 1);
      if (headL) headL.visible = P.glow > 0.4;
    }
    const autoTod = () => { const h = new Date().getHours(); return h >= 7 && h < 17 ? 0 : h >= 17 && h < 20 ? 1 : 2; };

    // ---------------------------------------------------------------- the cars (built from boxes, with the atlas for the details)
    const CARS = {
      saloon: { L: 4.4, W: 1.8, hb: 1.0, hc: 1.45, cf: 0.55, cb: -1.35, wr: 0.36, wz: 1.35 },
      hatch: { L: 3.8, W: 1.72, hb: 1.0, hc: 1.52, cf: 0.45, cb: -1.7, wr: 0.34, wz: 1.2 },
      black: { L: 4.6, W: 1.92, hb: 1.08, hc: 1.9, cf: 0.45, cb: -1.95, wr: 0.42, wz: 1.5, round: 1 },
      estate: { L: 4.65, W: 1.82, hb: 1.0, hc: 1.52, cf: 0.6, cb: -2.2, wr: 0.36, wz: 1.45 },
      van: { L: 5.2, W: 2.0, hb: 1.15, hc: 2.6, cf: 1.7, cb: -2.55, wr: 0.42, wz: 1.7, box: 1 },
      bus: { L: 10.4, W: 2.5, hb: 1.3, hc: 4.4, cf: 5.1, cb: -5.15, wr: 0.52, wz: 3.6, bus: 1 },
      float: { L: 3.8, W: 1.7, hb: 0.9, hc: 2.1, cf: 1.9, cb: 0.6, wr: 0.3, wz: 1.2, float: 1 },
    };
    const lightUV = subUV(uvOf(TILE.carF), 4 / 120, 26 / 120, 1 - 66 / 120, 1 - 40 / 120), tailUV = subUV(uvOf(TILE.carB), 4 / 120, 32 / 120, 1 - 68 / 120, 1 - 40 / 120);
    const plateF = subUV(uvOf(TILE.carF), 44 / 120, 76 / 120, 1 - 110 / 120, 1 - 96 / 120), plateB = subUV(uvOf(TILE.carB), 40 / 120, 80 / 120, 1 - 68 / 120, 1 - 50 / 120);
    const glassUV = subUV(uvOf(TILE.carS), 10 / 120, 56 / 120, 1 - 54 / 120, 1 - 6 / 120), sideWin = subUV(uvOf(TILE.carS), 0, 1, 0.5, 1), sideLow = subUV(uvOf(TILE.carS), 0, 1, 0.02, 0.48);
    function wheelGeo(r, w) { const B = Geo(), n = 10, tyre = [0.1, 0.1, 0.11], hub = [0.75, 0.75, 0.78]; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; const P = (a, x, rr) => [x, Math.sin(a) * rr, Math.cos(a) * rr]; quad(B, P(a0, -w / 2, r), P(a1, -w / 2, r), P(a1, w / 2, r), P(a0, w / 2, r), wuv, tyre); for (const s of [-1, 1]) tri(B, [s * w / 2, 0, 0], P(s > 0 ? a0 : a1, s * w / 2, r * 0.62), P(s > 0 ? a1 : a0, s * w / 2, r * 0.62), WC, WC, WC, hub); } return B; }
    function addWheelTo(B, x, y, z, r, w) { const W0 = wheelGeo(r, w); for (let i = 0; i < W0.p.length; i += 3) { B.p.push(W0.p[i] + x, W0.p[i + 1] + y, W0.p[i + 2] + z); } B.n.push(...W0.n); B.u.push(...W0.u); B.c.push(...W0.c); }
    // the body: a profile along the car (nose, wheel arches, roofline of the bonnet and boot) pushed out across its width
    function hull(B, S, c, sideUV) {
      const hw = S.W / 2, hl = S.L / 2, lo = S.wr * 1.05, hb = S.hb, sill = [c[0] * 0.55, c[1] * 0.55, c[2] * 0.55];
      // [z, bottom, top, width factor]
      const PR = [[hl, lo + 0.12, hb - 0.2, 0.9], [hl - 0.12, lo, hb - 0.08, 0.97], [hl - 0.5, lo, hb - 0.02, 1], [S.cf, lo, hb, 1], [S.cb, lo, hb, 1], [-hl + 0.45, lo, hb - 0.02, 1], [-hl + 0.1, lo, hb - 0.06, 0.97], [-hl, lo + 0.1, hb - 0.14, 0.92]].sort((p, q) => q[0] - p[0]);
      const L0 = S.L;
      for (let i = 0; i < PR.length - 1; i++) {
        const [za, ba, ta, wa] = PR[i], [zb, bb, tb, wb] = PR[i + 1];
        const ua = (hl - za) / L0, ub = (hl - zb) / L0, suv = [lerp(sideUV[0], sideUV[2], ua), sideUV[1], lerp(sideUV[0], sideUV[2], ub), sideUV[3]];
        // right side (+x) and left side (-x)
        quad(B, [hw * wa, ba, za], [hw * wb, bb, zb], [hw * wb, tb, zb], [hw * wa, ta, za], suv, c);
        quad(B, [-hw * wb, bb, zb], [-hw * wa, ba, za], [-hw * wa, ta, za], [-hw * wb, tb, zb], [suv[2], suv[1], suv[0], suv[3]], c);
        // the top
        quad(B, [hw * wa, ta, za], [hw * wb, tb, zb], [-hw * wb, tb, zb], [-hw * wa, ta, za], wuv, c.map(v => Math.min(1, v * 1.08)));
        // the sills (dark, under the doors)
        quad(B, [hw * wa + 0.005, ba, za], [hw * wb + 0.005, bb, zb], [hw * wb + 0.005, bb + 0.12, zb], [hw * wa + 0.005, ba + 0.12, za], wuv, sill);
        quad(B, [-hw * wb - 0.005, bb, zb], [-hw * wa - 0.005, ba, za], [-hw * wa - 0.005, ba + 0.12, za], [-hw * wb - 0.005, bb + 0.12, zb], wuv, sill);
      }
      const f = PR[0], r = PR[PR.length - 1];
      quad(B, [-hw * f[3], f[1], f[0]], [hw * f[3], f[1], f[0]], [hw * f[3], f[2], f[0]], [-hw * f[3], f[2], f[0]], wuv, c.map(v => v * 0.92));
      quad(B, [hw * r[3], r[1], r[0]], [-hw * r[3], r[1], r[0]], [-hw * r[3], r[2], r[0]], [hw * r[3], r[2], r[0]], wuv, c.map(v => v * 0.92));
      // the floor pan (dark), so you never see through it
      quad(B, [-hw, lo, -hl + 0.1], [hw, lo, -hl + 0.1], [hw, lo, hl - 0.1], [-hw, lo, hl - 0.1], wuv, [0.1, 0.1, 0.1]);
    }
    function sph(B, x, y, z, r, col, ry) { // a rounder ball (lit from above)
      const nu = 10, nv = 6; ry = ry || r;
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const P = (ii, jj) => { const th = ii / nu * Math.PI * 2, ph = jj / nv * Math.PI; return [x + Math.sin(ph) * Math.cos(th) * r, y + Math.cos(ph) * ry, z + Math.sin(ph) * Math.sin(th) * r]; };
        const k = 0.72 + 0.28 * Math.cos((j + 0.5) / nv * Math.PI * 0.9), cc = col.map(v => Math.min(1, v * k));
        quad(B, P(i, j + 1), P(i + 1, j + 1), P(i + 1, j), P(i, j), wuv, cc);
      }
    }
    function carB(kind, colHex, o) {
      o = o || {}; const S = CARS[kind], B = Geo(), c = hex(colHex), hw = S.W / 2, hl = S.L / 2, y0 = 0.3, dk = [0.16, 0.16, 0.17], white = [1, 1, 1];
      const roofC = o.roof != null ? hex(o.roof) : c;
      if (S.bus) {
        block(B, -hw, -hl, hw, hl, y0, S.hc, { side: wuv, top: wuv, segW: 99, segH: 99 }, c);
        for (const yy of [[1.75, 2.45], [3.3, 4.0]]) for (const s of [-1, 1]) { const x = s * (hw + 0.02); quad(B, [x, yy[0], s > 0 ? hl - 0.6 : -hl + 0.6], [x, yy[0], s > 0 ? -hl + 0.6 : hl - 0.6], [x, yy[1], s > 0 ? -hl + 0.6 : hl - 0.6], [x, yy[1], s > 0 ? hl - 0.6 : -hl + 0.6], sideWin, white); }
        quad(B, [-hw + 0.2, 1.7, hl + 0.02], [hw - 0.2, 1.7, hl + 0.02], [hw - 0.2, 2.5, hl + 0.02], [-hw + 0.2, 2.5, hl + 0.02], glassUV, white);
        quad(B, [-hw + 0.2, 3.25, hl + 0.02], [hw - 0.2, 3.25, hl + 0.02], [hw - 0.2, 4.05, hl + 0.02], [-hw + 0.2, 4.05, hl + 0.02], glassUV, white);
        block(B, -hw - 0.01, -hl - 0.01, hw + 0.01, hl + 0.01, 2.85, 3.05, { side: wuv, segW: 99, segH: 99 }, [0.95, 0.85, 0.2]);
        block(B, -hw + 0.05, -hl + 0.05, hw - 0.05, hl - 0.05, S.hc, S.hc + 0.08, { side: wuv, top: wuv, segW: 99, segH: 99 }, [0.95, 0.93, 0.85]);
        block(B, -hw - 0.012, -hl - 0.012, hw + 0.012, hl + 0.012, 0.3, 0.62, { side: wuv, segW: 99, segH: 99 }, [0.15, 0.15, 0.16]);
        quad(B, [-0.7, 2.62, hl + 0.025], [0.7, 2.62, hl + 0.025], [0.7, 2.86, hl + 0.025], [-0.7, 2.86, hl + 0.025], wuv, [0.08, 0.08, 0.08]);
        quad(B, [-0.6, 2.67, hl + 0.03], [0.6, 2.67, hl + 0.03], [0.6, 2.81, hl + 0.03], [-0.6, 2.81, hl + 0.03], wuv, [1, 0.8, 0.1]);
      } else {
        hull(B, S, c, sideLow);
        // the cabin: a sloped box on top
        const ci = S.box ? 0.02 : 0.1, ti = S.box ? 0.04 : 0.24, zf = S.cf, zb = S.cb, zft = zf - (S.box || S.float ? 0.25 : 0.62), zbt = zb + (S.box ? 0.02 : 0.3), y1 = S.hb, y2 = S.hc;
        const p = { fl: [-hw + ci, y1, zf], fr: [hw - ci, y1, zf], bl: [-hw + ci, y1, zb], br: [hw - ci, y1, zb], tfl: [-hw + ti, y2, zft], tfr: [hw - ti, y2, zft], tbl: [-hw + ti, y2, zbt], tbr: [hw - ti, y2, zbt] };
        quad(B, p.fl, p.fr, p.tfr, p.tfl, glassUV, white); // windscreen (faces +z)
        quad(B, p.br, p.bl, p.tbl, p.tbr, S.box ? wuv : glassUV, S.box ? c : white); // back window
        quad(B, p.fr, p.br, p.tbr, p.tfr, S.box ? subUV(sideWin, 0.55, 1, 0, 1) : sideWin, white); // right side (x+)
        quad(B, p.bl, p.fl, p.tfl, p.tbl, S.box ? subUV(sideWin, 0, 0.45, 0, 1) : sideWin, white); // left side
        quad(B, p.tbr, p.tbl, p.tfl, p.tfr, wuv, roofC); // roof
        if (S.box) { // a box van: cover the side panels behind the cab in body colour
          for (const s of [-1, 1]) { const x = s * (hw - ci + 0.01); quad(B, s > 0 ? [x, y1, zf - 1.3] : [x, y1, zb], s > 0 ? [x, y1, zb] : [x, y1, zf - 1.3], s > 0 ? [x, y2, zb] : [x, y2, zf - 1.3], s > 0 ? [x, y2, zf - 1.3] : [x, y2, zb], wuv, c); }
          quad(B, [-hw + ci - 0.01, y1, zf - 1.3], [hw - ci + 0.01, y1, zf - 1.3], [hw - ci + 0.01, y2, zf - 1.3], [-hw + ci - 0.01, y2, zf - 1.3], wuv, c);
        }
        if (S.float) { block(B, -hw, zb - 2.6, hw, zb, y1, y1 + 0.5, { side: wuv, top: wuv, segW: 99, segH: 99 }, [0.9, 0.9, 0.9]); for (let i = 0; i < 6; i++) block(B, -hw + 0.2 + (i % 3) * 0.5, zb - 2.3 + (i >> 1) * 0.3, -hw + 0.6 + (i % 3) * 0.5, zb - 2.0 + (i >> 1) * 0.3, y1 + 0.5, y1 + 0.9, { side: wuv, top: wuv }, [1, 1, 1]); }
      }
      const zF = hl + 0.015, zB = -hl - 0.015;
      // the lights, the grille, the bumpers, the plates
      for (const s of [-1, 1]) {
        const x0 = s * (hw - 0.12), x1 = s * (hw - 0.55);
        const lx = Math.min(x0, x1), rx = Math.max(x0, x1), ly0 = S.hb - 0.42, ly1 = S.hb - 0.22;
        quad(B, [lx, ly0, zF], [rx, ly0, zF], [rx, ly1, zF], [lx, ly1, zF], lightUV, white);
        quad(B, [rx, ly0, zB], [lx, ly0, zB], [lx, ly1 + 0.04, zB], [rx, ly1 + 0.04, zB], tailUV, white);
      }
      quad(B, [-0.45, S.hb - 0.42, zF], [0.45, S.hb - 0.42, zF], [0.45, S.hb - 0.24, zF], [-0.45, S.hb - 0.24, zF], wuv, dk);
      block(B, -hw - 0.04, hl - 0.15, hw + 0.04, hl + 0.12, 0.3, 0.52, { side: wuv, top: wuv, segW: 99, segH: 99 }, [0.75, 0.75, 0.75]);
      block(B, -hw - 0.04, -hl - 0.12, hw + 0.04, -hl + 0.15, 0.3, 0.52, { side: wuv, top: wuv, segW: 99, segH: 99 }, [0.75, 0.75, 0.75]);
      quad(B, [-0.32, 0.33, hl + 0.125], [0.32, 0.33, hl + 0.125], [0.32, 0.5, hl + 0.125], [-0.32, 0.5, hl + 0.125], plateF, white);
      quad(B, [0.32, S.hb - 0.4, zB - 0.005], [-0.32, S.hb - 0.4, zB - 0.005], [-0.32, S.hb - 0.24, zB - 0.005], [0.32, S.hb - 0.24, zB - 0.005], plateB, white);
      if (o.police) { block(B, -0.5, -0.4, 0.5, 0.0, S.hc, S.hc + 0.18, { side: wuv, top: wuv }, [0.2, 0.4, 1]); for (const s of [-1, 1]) quad(B, s > 0 ? [hw + 0.02, 0.65, hl - 0.3] : [-hw - 0.02, 0.65, -hl + 0.3], s > 0 ? [hw + 0.02, 0.65, -hl + 0.3] : [-hw - 0.02, 0.65, hl - 0.3], s > 0 ? [hw + 0.02, 0.85, -hl + 0.3] : [-hw - 0.02, 0.85, hl - 0.3], s > 0 ? [hw + 0.02, 0.85, hl - 0.3] : [-hw - 0.02, 0.85, -hl + 0.3], wuv, [0.1, 0.3, 0.95]); }
      if (o.ice) { cone3(B, 0, S.hc, S.cb + 0.9, 0.4, 0.05, 1.0, [0.95, 0.8, 0.5]); blob3(B, 0, S.hc + 1.15, S.cb + 0.9, 0.42, [1, 0.75, 0.85]); }
      if (o.wheels !== false) for (const [x, z] of [[-hw + 0.13, S.wz], [hw - 0.13, S.wz], [-hw + 0.13, -S.wz], [hw - 0.13, -S.wz]]) addWheelTo(B, x, S.wr, z, S.wr, 0.32);
      return B;
    }
    function cone3(B, x, y, z, r0, r1, h, col) { const n = 8; for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; quad(B, [x + Math.cos(a1) * r0, y, z + Math.sin(a1) * r0], [x + Math.cos(a0) * r0, y, z + Math.sin(a0) * r0], [x + Math.cos(a0) * r1, y + h, z + Math.sin(a0) * r1], [x + Math.cos(a1) * r1, y + h, z + Math.sin(a1) * r1], wuv, col); } }
    function blob3(B, x, y, z, r, col) { const n = 8, top = [x, y + r, z], bot = [x, y - r, z], ring = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ring.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]); } const lt = col.map(v => Math.min(1, v * 1.15)), dk = col.map(v => v * 0.75); for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; tri(B, top, b, a, WC, WC, WC, [lt, col, col]); tri(B, bot, a, b, WC, WC, WC, [dk, col, col]); } }
    function boxB(B, x0, y0, z0, x1, y1, z1, col) { block(B, x0, z0, x1, z1, y0, y1, { side: wuv, top: wuv, segW: 99, segH: 99 }, col); quad(B, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], wuv, col.map(v => v * 0.6)); }
    // ---- the player's cab
    let car = null, headL = null; const cabSign = {};
    const wheelG = geoOf(wheelGeo(0.38, 0.3));
    function buildCab(di) {
      if (car && car.root) scene.remove(car.root);
      const D = DRIVERS[di], S = CARS[D.car], gold = sv.opts.gold && goldCount() >= TESTS.length;
      const root = new T.Group(), body = new T.Group(); root.add(body);
      const bm = new T.Mesh(geoOf(carB(D.car, gold ? 0xf0c020 : D.col, { wheels: false })), cityMat); body.add(bm);
      // the roof sign (lit)
      const sB = Geo(), suv = cabSign[D.id] || (cabSign[D.id] = signUV(D.id === 'kev' ? 'TAXI' : 'MINICAB', D.id === 'kev' ? '#ffb020' : '#ffd21a', 'SUNNYMOUTH 555-0199')), sy = S.hc;
      quad(sB, [-0.55, sy + 0.08, 0.15], [0.55, sy + 0.08, 0.15], [0.55, sy + 0.42, 0.15], [-0.55, sy + 0.42, 0.15], suv, [1, 1, 1]);
      quad(sB, [0.55, sy + 0.08, -0.15], [-0.55, sy + 0.08, -0.15], [-0.55, sy + 0.42, -0.15], [0.55, sy + 0.42, -0.15], suv, [1, 1, 1]);
      boxB(sB, -0.57, sy, -0.14, 0.57, sy + 0.44, 0.14, [0.1, 0.1, 0.1]);
      // (the sign atlas has changed: upload it again)
      signMat.map.needsUpdate = true;
      body.add(new T.Mesh(geoOf(sB), signMat));
      const wheels = [];
      for (const [x, z] of [[-S.W / 2 + 0.13, S.wz], [S.W / 2 - 0.13, S.wz], [-S.W / 2 + 0.13, -S.wz], [S.W / 2 - 0.13, -S.wz]]) { const p = new T.Group(); p.position.set(x, S.wr, z); const w = new T.Mesh(wheelG, cityMat); w.scale.setScalar(S.wr / 0.38); p.add(w); root.add(p); wheels.push({ p, w, front: z > 0 }); }
      // a blob shadow, and headlight beams for the dark
      const sh = new T.Mesh(T3.keep(new T.PlaneGeometry(S.W + 0.6, S.L + 0.5)), shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.06; root.add(sh);
      headL = new T.Mesh(beamG, beamMat); headL.position.set(0, 0.7, S.L / 2); root.add(headL);
      scene.add(root);
      const old = car || {};
      car = Object.assign({ x: 0, z: 0, y: 0, h: 0, vx: 0, vz: 0, vy: 0, steer: 0, air: false, airT: 0, pitch: 0, roll: 0, hb: false, dash: 0 }, old, { root, body, wheels, D, S, spin: 0 });
      setTod(tod);
    }
    const shCv = document.createElement('canvas'); shCv.width = shCv.height = 64; { const g = shCv.getContext('2d'), gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    const shTex = new T.CanvasTexture(shCv); disposeList.push(shTex);
    const shadowMat = keepM(new T.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, fog: false }));
    const beamG = T3.keep(new T.ConeGeometry(4.5, 22, 12, 1, true)); beamG.rotateX(-Math.PI / 2); beamG.translate(0, -0.6, 11);
    const beamMat = keepM(new T.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));

    // ---------------------------------------------------------------- the road network (for the traffic and the arrow)
    const RD = new Uint8Array(N * N); // traffic roads: a bit per exit
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const ch = G[r][c]; if (ch !== '#' && ch !== '=') continue; let m = 0; for (let d = 0; d < 4; d++) { const n2 = at(c + DX[d], r + DZ[d]); if (n2 === '#' || n2 === '=') m |= 1 << d; } RD[r * N + c] = m; }
    // route finding: a distance field from a target cell (cheap, cached)
    const PASS = new Float32Array(N * N);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const ch = G[r][c]; PASS[r * N + c] = '#='.includes(ch) ? 1 : ch === 'a' ? 1.15 : 'qry_p'.includes(ch) ? 1.35 : ch === 'A' ? 1.3 : ch === 'g' || ch === '.' ? 1.6 : ch === 't' ? 4 : 0; }
    const fields = new Map();
    function field(tc, tr) {
      const key = tr * N + tc; if (fields.has(key)) return fields.get(key);
      const D = new Float32Array(N * N).fill(1e9), heap = [];
      const push = (i, d) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
      D[key] = 0; push(key, 0);
      while (heap.length) { const [d, i] = pop(); if (d > D[i]) continue; const c = i % N, r = (i / N) | 0; for (let k = 0; k < 4; k++) { const c2 = c + DX[k], r2 = r + DZ[k]; if (c2 < 0 || r2 < 0 || c2 >= N || r2 >= N) continue; const j = r2 * N + c2, p = PASS[j]; if (!p) continue; const nd = d + (p + PASS[i] || p) / 2; if (nd < D[j]) { D[j] = nd; push(j, nd); } } }
      if (fields.size > 24) fields.delete(fields.keys().next().value);
      fields.set(key, D); return D;
    }
    function routeFrom(x, z, tc, tr, n) { // the next n cells along the best way
      const D = field(tc, tr); let c = clamp(cellOf(x), 0, N - 1), r = clamp(cellOf(z), 0, N - 1); const out = [];
      if (D[r * N + c] >= 1e9) { // not on the network (on a roof, in a hedge): head for the nearest cell that is
        let bd = 1e9, bc = c, br = r; for (let rr = r - 3; rr <= r + 3; rr++) for (let cc = c - 3; cc <= c + 3; cc++) { if (cc < 0 || rr < 0 || cc >= N || rr >= N) continue; const v = D[rr * N + cc]; if (v < 1e9) { const dd = Math.hypot(cc - c, rr - r) * 3 + v; if (dd < bd) { bd = dd; bc = cc; br = rr; } } } c = bc; r = br; out.push([c, r]);
      }
      for (let k = 0; k < n; k++) { let best = -1, bv = D[r * N + c]; for (let d = 0; d < 4; d++) { const c2 = c + DX[d], r2 = r + DZ[d]; if (c2 < 0 || r2 < 0 || c2 >= N || r2 >= N) continue; const v = D[r2 * N + c2]; if (v < bv - 1e-4) { bv = v; best = d; } } if (best < 0) break; c += DX[best]; r += DZ[best]; out.push([c, r]); }
      return out;
    }
    const routeLen = (x, z, tc, tr) => { const D = field(tc, tr), c = clamp(cellOf(x), 0, N - 1), r = clamp(cellOf(z), 0, N - 1), v = D[r * N + c]; return (v < 1e9 ? v : Math.hypot(tc - c, tr - r) * 1.4) * CELL; };

    // ---------------------------------------------------------------- traffic: keeps left, turns at junctions, stops for you (mostly)
    const traffic = [];
    const TCOLS = [0xd82a1a, 0x2a6ae0, 0xf0f0f0, 0x2aa83a, 0x3a3a3a, 0x9a3ad8, 0xe87a1a, 0x7ad8e0, 0xc8c8c8, 0x8a1a1a, 0x1a3a8a, 0xe8d8a0];
    const tgeo = {};
    function tGeo(kind, col, o) { const k = kind + col + (o ? JSON.stringify(o) : ''); return tgeo[k] || (tgeo[k] = geoOf(carB(kind, col, o))); }
    const roadCells = []; for (let i = 0; i < N * N; i++) if (RD[i]) roadCells.push(i);
    const leftOf = d => [DZ[d], -DX[d]]; // keep left (UK)
    function tPath(v) { // the lane through the current cell: from where it came in to where it's going out
      const cx = (v.c + 0.5) * CELL, cz = (v.r + 0.5) * CELL, din = v.din, dout = v.dout, li = leftOf(din), lo = leftOf(dout), off = 3.2;
      v.P0 = [cx - DX[din] * 10 + li[0] * off, cz - DZ[din] * 10 + li[1] * off];
      v.P2 = [cx + DX[dout] * 10 + lo[0] * off, cz + DZ[dout] * 10 + lo[1] * off];
      v.P1 = din === dout ? [(v.P0[0] + v.P2[0]) / 2, (v.P0[1] + v.P2[1]) / 2] : [cx + li[0] * off + lo[0] * off, cz + li[1] * off + lo[1] * off];
      if (din === (dout + 2) % 4) v.P1 = [cx + lo[0] * 6 + DX[din] * 6, cz + lo[1] * 6 + DZ[din] * 6]; // a U-turn at a dead end
      let L = 0, px = v.P0[0], pz = v.P0[1]; for (let i = 1; i <= 8; i++) { const p = bez(v, i / 8); L += Math.hypot(p[0] - px, p[1] - pz); px = p[0]; pz = p[1]; } v.len = L;
    }
    const bez = (v, t) => { const u = 1 - t; return [u * u * v.P0[0] + 2 * u * t * v.P1[0] + t * t * v.P2[0], u * u * v.P0[1] + 2 * u * t * v.P1[1] + t * t * v.P2[1]]; };
    function pickOut(v) { const m = RD[v.r * N + v.c], back = (v.din + 2) % 4, opts = []; for (let d = 0; d < 4; d++) if ((m & (1 << d)) && d !== back) opts.push(d); if (!opts.length) return back; if (opts.includes(v.din) && Math.random() < 0.55) return v.din; return opts[(Math.random() * opts.length) | 0]; }
    function spawnCar(i, near) {
      const kinds = ['saloon', 'saloon', 'hatch', 'hatch', 'estate', 'van', 'saloon', 'bus', 'hatch', 'float', 'van', 'saloon'];
      const kind = i === 3 || i === 7 ? 'bus' : i === 11 ? 'van' : kinds[i % kinds.length], col = kind === 'bus' ? 0xd8261c : kind === 'float' ? 0xf0f0f0 : TCOLS[(i * 5) % TCOLS.length];
      const o = i === 5 ? { police: 1 } : i === 9 ? null : i === 11 ? { ice: 1 } : null;
      const g = tGeo(kind, i === 5 ? 0xf0f0f0 : i === 11 ? 0xf8c8d8 : col, o);
      const m = new T.Mesh(g, cityMat); scene.add(m);
      const v = { m, kind, len: 20, t: 0, v: 0, vmax: kind === 'bus' ? 10 : kind === 'float' ? 7 : 11 + Math.random() * 3, half: CARS[kind].L / 2, stop: 0, kx: 0, kz: 0, ks: 0, near: false, honk: 0, police: i === 5 };
      placeCar(v, near); traffic.push(v); return v;
    }
    function placeCar(v, near) {
      let idx, tries = 0;
      do { idx = roadCells[(Math.random() * roadCells.length) | 0]; tries++; } while (tries < 40 && near && (Math.hypot(((idx % N) + 0.5) * CELL - near[0], (((idx / N) | 0) + 0.5) * CELL - near[1]) < 60 || Math.hypot(((idx % N) + 0.5) * CELL - near[0], (((idx / N) | 0) + 0.5) * CELL - near[1]) > 300));
      v.c = idx % N; v.r = (idx / N) | 0; const m = RD[idx], ds = [0, 1, 2, 3].filter(d => m & (1 << d)); v.din = ds.length ? ds[(Math.random() * ds.length) | 0] : 0; v.dout = pickOut(v); tPath(v); v.t = Math.random() * 0.8; v.v = v.vmax * 0.6;
    }
    function updTraffic(dt) {
      for (const v of traffic) {
        // look ahead: the cab, and other cars in the lane in front
        const p = bez(v, Math.min(1, v.t)), p2 = bez(v, Math.min(1, v.t + 0.05)); let hx = p2[0] - p[0], hz = p2[1] - p[1]; const hl = Math.hypot(hx, hz) || 1; hx /= hl; hz /= hl;
        let want = v.vmax * (v.din !== v.dout ? 0.6 : 1);
        const look = (ox, oz, rad) => { const dx = ox - p[0], dz = oz - p[1], along = dx * hx + dz * hz, side = Math.abs(dx * hz - dz * hx); if (along > 0 && along < 16 + v.half && side < rad) want = Math.min(want, Math.max(0, (along - v.half - 4) * 1.2)); };
        if (car && car.root.visible) look(car.x, car.z, 2.6);
        for (const o of traffic) if (o !== v && Math.abs(o.x - p[0]) < 24 && Math.abs(o.z - p[1]) < 24) look(o.x, o.z, 1.8);
        if (v.stop > 0) { v.stop -= dt; want = 0; }
        v.v += clamp(want - v.v, -14 * dt, 5 * dt);
        if (v.v < 0.3 && car && Math.hypot(car.x - p[0], car.z - p[1]) < 14 && mode === 'play') { v.honk += dt; if (v.honk > 1.5) { v.honk = -3 - Math.random() * 3; sfx.tone(392, 0.12, 'square', 0.03); sfx.tone(330, 0.18, 'square', 0.03, 0.14); } } else if (v.honk > 0) v.honk = 0;
        v.t += v.v * dt / v.len;
        if (v.t >= 1) { // into the next cell
          const nc = v.c + DX[v.dout], nr = v.r + DZ[v.dout];
          if (nc < 0 || nr < 0 || nc >= N || nr >= N || !RD[nr * N + nc]) { v.din = (v.dout + 2) % 4; v.dout = pickOut(v); tPath(v); v.t = 0; }
          else { v.c = nc; v.r = nr; v.din = v.dout; v.dout = pickOut(v); tPath(v); v.t -= 1; v.t = Math.max(0, v.t); }
        }
        const q = bez(v, Math.min(1, v.t)), q2 = bez(v, Math.min(1, v.t + 0.04));
        v.kx *= Math.exp(-1.5 * dt); v.kz *= Math.exp(-1.5 * dt); v.ks *= Math.exp(-1.5 * dt);
        v.x = q[0] + v.kx; v.z = q[1] + v.kz; v.y = ground(v.x, v.z);
        v.m.position.set(v.x, v.y, v.z); v.m.rotation.y = Math.atan2(q2[0] - q[0], q2[1] - q[1]) + v.ks; v.hd = v.m.rotation.y;
      }
    }
    // the cab against the traffic: bumps, and near misses (CRAZY THROUGH)
    function trafficVsCab(dt) {
      const sp = Math.hypot(car.vx, car.vz);
      for (const v of traffic) {
        const fx = Math.sin(v.hd || 0), fz = Math.cos(v.hd || 0), dx = car.x - v.x, dz = car.z - v.z, along = clamp(dx * fx + dz * fz, -v.half + 1, v.half - 1);
        const cx = v.x + fx * along, cz = v.z + fz * along, ex = car.x - cx, ez = car.z - cz, d = Math.hypot(ex, ez);
        if (Math.abs(car.y - v.y) > 3) continue;
        if (d < 2.3) {
          const nx = ex / (d || 1), nz = ez / (d || 1); car.x = cx + nx * 2.3; car.z = cz + nz * 2.3;
          const vn = car.vx * nx + car.vz * nz, k = car.D.mass / (car.D.mass + (v.kind === 'bus' ? 3 : 1));
          if (vn < 0) { car.vx -= vn * (1.2 + k * 0.4) * nx; car.vz -= vn * (1.2 + k * 0.4) * nz; v.kx -= nx * Math.min(3, -vn * 0.2 * k * 2); v.kz -= nz * Math.min(3, -vn * 0.2 * k * 2); v.ks += (Math.random() - 0.5) * Math.min(0.8, -vn * 0.05) * k * 2; v.stop = 1.8;
            if (vn < -5) { crash(-vn); } }
          v.close = 0;
        } else if (d < 4.6 && sp > 17 && !v.close) { v.close = 1; v.missT = 0.35; }
        else if (v.close === 1 && d >= 4.6) { v.close = 2; crazy('THROUGH', v.x, v.z); }
        if (d > 12) v.close = 0;
      }
    }

    // ---------------------------------------------------------------- people on the pavements (instanced), and the ones who want a cab
    const NP = 70, peds = [];
    const pedPts = []; // points on pavements and open places
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const ch = G[r][c], cx = (c + 0.5) * CELL, cz = (r + 0.5) * CELL;
      if ('#a'.includes(ch)) { for (let d = 0; d < 4; d++) { const nb = at(c + DX[d], r + DZ[d]); if ('#=aq'.includes(nb)) continue; if (nb === '~' || nb === '%') continue; pedPts.push({ x: cx + DX[d] * 8.2, z: cz + DZ[d] * 8.2, ax: DX[d] ? 'z' : 'x', c, r, d, kind: 'pave' }); } }
      else if (ch === '_' || ch === 'g' || ch === '.' || ch === 'p') pedPts.push({ x: cx, z: cz, c, r, kind: ch === '.' ? 'beach' : 'open' });
    }
    function pedPart(kind) { const B = Geo(); const W1 = [1, 1, 1];
      if (kind === 'torso') { boxB(B, -0.27, 0.9, -0.15, 0.27, 1.55, 0.15, W1); boxB(B, -0.4, 0.95, -0.1, -0.28, 1.5, 0.1, W1); boxB(B, 0.28, 0.95, -0.1, 0.4, 1.5, 0.1, W1); }
      else if (kind === 'head') { blob3(B, 0, 1.78, 0, 0.2, W1); boxB(B, -0.18, 1.82, -0.2, 0.18, 1.98, 0.12, [0.45, 0.32, 0.22]); }
      else { boxB(B, -0.09, -0.9, -0.1, 0.09, 0, 0.1, W1); boxB(B, -0.1, -0.9, -0.05, 0.1, -0.8, 0.2, [0.25, 0.25, 0.25]); }
      return geoOf(B); }
    const pedMat = keepM(new T.MeshLambertMaterial({ vertexColors: true }));
    const iTorso = new T.InstancedMesh(pedPart('torso'), pedMat, NP), iHead = new T.InstancedMesh(pedPart('head'), pedMat, NP), iLeg = new T.InstancedMesh(pedPart('leg'), pedMat, NP * 2);
    for (const im of [iTorso, iHead, iLeg]) { im.frustumCulled = false; im.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(im); }
    const SKINS = [0xf0c8a0, 0xe0b088, 0xc08860, 0x8a5a3a, 0xf4d4b4], SHIRTS = [0xe83a3a, 0x3a6ae8, 0xf0d040, 0x3ab05a, 0xf0f0f0, 0x8a3ab0, 0xe87a2a, 0x2a2a2a, 0x40c8d0, 0xd04a8a], LEGS = [0x2a3a6a, 0x3a3a3a, 0x6a5a40, 0x1a1a2a, 0x8a8a8a];
    const tc = new T.Color(), tm = new T.Matrix4(), tq = new T.Quaternion(), tv = new T.Vector3(), ts = new T.Vector3(1, 1, 1), te = new T.Euler();
    function spawnPed(p, near) {
      let P; for (let k = 0; k < 30; k++) { P = pedPts[(Math.random() * pedPts.length) | 0]; if (!near || Math.hypot(P.x - near[0], P.z - near[1]) < 220) break; }
      p.x = P.x + (P.kind === 'pave' ? 0 : (Math.random() - 0.5) * 14); p.z = P.z + (P.kind === 'pave' ? 0 : (Math.random() - 0.5) * 14); p.P = P; p.dir = Math.random() < 0.5 ? 1 : -1; p.h = 0; p.ph = Math.random() * 6; p.v = 1.1 + Math.random() * 0.6; p.dive = 0; p.dx = 0; p.dz = 0; p.yell = 0;
      p.wx = p.x; p.wz = p.z;
    }
    for (let i = 0; i < NP; i++) { const p = { i }; spawnPed(p); peds.push(p);
      iTorso.setColorAt(i, tc.setHex(SHIRTS[i % SHIRTS.length])); iHead.setColorAt(i, tc.setHex(SKINS[(i * 3) % SKINS.length])); const lc = LEGS[(i * 7) % LEGS.length]; iLeg.setColorAt(i * 2, tc.setHex(lc)); iLeg.setColorAt(i * 2 + 1, tc.setHex(lc)); }
    function updPeds(dt) {
      const sp = car ? Math.hypot(car.vx, car.vz) : 0;
      for (const p of peds) {
        if (car && Math.hypot(p.x - car.x, p.z - car.z) > 260) { spawnPed(p, [car.x, car.z]); }
        // walk
        if (p.dive > 0) { p.dive -= dt; p.x += p.dx * dt; p.z += p.dz * dt; }
        else if (p.P.kind === 'pave') { const ax = p.P.ax; if (ax === 'x') p.x += p.dir * p.v * dt; else p.z += p.dir * p.v * dt; const off = ax === 'x' ? p.x - p.P.x : p.z - p.P.z; if (Math.abs(off) > 9.5) p.dir = -Math.sign(off); p.h = ax === 'x' ? (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (p.dir > 0 ? 0 : Math.PI); }
        else { const dx = p.wx - p.x, dz = p.wz - p.z, d = Math.hypot(dx, dz); if (d < 0.5) { p.wx = p.P.x + (Math.random() - 0.5) * 18; p.wz = p.P.z + (Math.random() - 0.5) * 18; } else { p.x += dx / d * p.v * dt; p.z += dz / d * p.v * dt; p.h = Math.atan2(dx, dz); } }
        // the cab's coming! jump out of the way
        if (car && p.dive <= 0 && sp > 5) { const dx = p.x - car.x, dz = p.z - car.z, d = Math.hypot(dx, dz); const fx = car.vx / sp, fz = car.vz / sp, along = dx * fx + dz * fz, side = dx * fz - dz * fx;
          if (d < 9 + sp * 0.25 && along > -1 && Math.abs(side) < 3.2) { const s = side >= 0 ? 1 : -1; p.dive = 0.45; p.dx = fz * s * 9; p.dz = -fx * s * 9; if (Math.random() < 0.3 && p.yell <= 0) { p.yell = 4; sfx.tone(700 + Math.random() * 300, 0.12, 'square', 0.025, 0, 1100); } } }
        if (p.yell > 0) p.yell -= dt;
        p.ph += dt * (p.dive > 0 ? 16 : 7) * p.v; const sw = Math.sin(p.ph) * (p.dive > 0 ? 0.9 : 0.5), y = ground(p.x, p.z) + (p.P.kind === 'beach' ? 0.12 : p.P.kind === 'pave' ? 0.14 : 0.05) + (p.dive > 0 ? Math.sin(p.dive / 0.45 * Math.PI) * 0.9 : Math.abs(Math.sin(p.ph)) * 0.05);
        tq.setFromEuler(te.set(0, p.h, 0)); tv.set(p.x, y, p.z); tm.compose(tv, tq, ts); iTorso.setMatrixAt(p.i, tm); iHead.setMatrixAt(p.i, tm);
        for (let k = 0; k < 2; k++) { const s2 = k ? 1 : -1; tq.setFromEuler(te.set(sw * s2, p.h, 0, 'YXZ')); tv.set(p.x + Math.cos(p.h) * 0.13 * s2, y + 0.9, p.z - Math.sin(p.h) * 0.13 * s2); tm.compose(tv, tq, ts); iLeg.setMatrixAt(p.i * 2 + k, tm); }
      }
      iTorso.instanceMatrix.needsUpdate = iHead.instanceMatrix.needsUpdate = iLeg.instanceMatrix.needsUpdate = true;
    }
    // ---- customers: their own look, a ring round them coloured by how far they're going
    const fgeo = {};
    function folkGeo(F0) {
      if (fgeo[F0.id]) return fgeo[F0.id];
      const B = Geo(), A = Geo(), sh = hex(F0.shirt), lg = hex(F0.legs), sk = hex(F0.skin), hr = hex(F0.hair), ex = F0.extra;
      boxB(B, -0.2, 0, -0.12, -0.03, 0.9, 0.12, lg); boxB(B, 0.03, 0, -0.12, 0.2, 0.9, 0.12, lg); boxB(B, -0.22, 0, -0.08, -0.02, 0.1, 0.24, [0.15, 0.15, 0.15]); boxB(B, 0.02, 0, -0.08, 0.22, 0.1, 0.24, [0.15, 0.15, 0.15]);
      boxB(B, -0.29, 0.88, -0.16, 0.29, 1.56, 0.16, sh); boxB(B, -0.42, 0.95, -0.1, -0.29, 1.52, 0.1, sh);
      boxB(B, -0.07, 1.54, -0.06, 0.07, 1.62, 0.06, sk); sph(B, 0, 1.8, 0, 0.2, sk, 0.22); sph(B, 0, 1.88, -0.03, 0.205, hr, 0.15); boxB(B, -0.03, 1.74, 0.18, 0.03, 1.8, 0.23, sk.map(v => v * 0.9)); boxB(B, -0.23, 1.76, -0.03, -0.19, 1.84, 0.04, sk); boxB(B, 0.19, 1.76, -0.03, 0.23, 1.84, 0.04, sk);
      boxB(B, -0.085, 1.8, 0.185, -0.045, 1.835, 0.205, [0.08, 0.08, 0.1]); boxB(B, 0.045, 1.8, 0.185, 0.085, 1.835, 0.205, [0.08, 0.08, 0.1]); boxB(B, -0.05, 1.7, 0.18, 0.05, 1.715, 0.2, [0.55, 0.25, 0.2]); boxB(B, -0.42, 0.86, -0.07, -0.3, 0.96, 0.07, sk);
      if (ex === 'tie') boxB(B, -0.04, 1.1, 0.16, 0.04, 1.5, 0.18, [0.8, 0.1, 0.1]);
      if (ex === 'bun') blob3(B, 0, 2.02, -0.1, 0.12, hr);
      if (ex === 'board') boxB(B, -0.55, 0.2, -0.3, -0.45, 2.2, 0.1, [1, 0.45, 0.1]);
      if (ex === 'bag') boxB(B, -0.25, 0.95, -0.32, 0.25, 1.45, -0.16, [0.2, 0.3, 0.6]);
      if (ex === 'scarf') { boxB(B, -0.22, 1.5, -0.18, 0.22, 1.62, 0.18, [1, 1, 1]); boxB(B, 0.1, 1.15, 0.16, 0.2, 1.55, 0.2, [0.9, 0.1, 0.1]); }
      if (ex === 'cap') boxB(B, -0.22, 1.95, -0.22, 0.22, 2.08, 0.32, sh.map(v => v * 0.8));
      if (ex === 'mohawk') boxB(B, -0.04, 1.95, -0.2, 0.04, 2.3, 0.15, [0.1, 0.9, 0.3]);
      if (ex === 'hat') { boxB(B, -0.32, 1.94, -0.32, 0.32, 1.98, 0.32, [0.95, 0.9, 0.7]); boxB(B, -0.17, 1.98, -0.17, 0.17, 2.14, 0.17, [0.95, 0.9, 0.7]); boxB(B, -0.12, 1.25, 0.16, 0.12, 1.42, 0.24, [0.15, 0.15, 0.15]); }
      if (ex === 'veil') { boxB(B, -0.26, 1.4, -0.3, 0.26, 2.05, -0.2, [1, 1, 1]); boxB(B, -0.34, 0, -0.3, 0.34, 0.9, 0.3, [1, 1, 1]); }
      if (ex === 'chef') { boxB(B, -0.17, 1.96, -0.17, 0.17, 2.22, 0.17, [1, 1, 1]); sph(B, 0, 2.28, 0, 0.21, [1, 1, 1], 0.12); }
      if (ex === 'collar') boxB(B, -0.06, 1.48, 0.15, 0.06, 1.56, 0.18, [1, 1, 1]);
      if (ex === 'helmet') { blob3(B, 0, 1.97, 0, 0.26, [0.95, 0.85, 0.1]); boxB(B, -0.3, 1.88, -0.3, 0.3, 1.92, 0.3, [0.95, 0.85, 0.1]); }
      if (ex === 'glasses') boxB(B, -0.15, 1.75, 0.19, 0.15, 1.82, 0.22, [0.1, 0.1, 0.1]);
      if (ex === 'banana') { cone3(B, 0, 1.9, 0, 0.26, 0.06, 0.6, [0.98, 0.88, 0.15]); boxB(B, -0.04, 2.48, -0.04, 0.04, 2.62, 0.04, [0.4, 0.3, 0.1]); }
      // the waving arm (pivots at the shoulder)
      boxB(A, -0.06, -0.6, -0.08, 0.08, 0, 0.08, sh); blob3(A, 0.01, -0.64, 0, 0.07, sk);
      return fgeo[F0.id] = { b: geoOf(B), a: geoOf(A) };
    }
    const custs = [];
    const RINGC = [0x3aff5a, 0xffd21a, 0xff4a3a];
    const ringG = T3.keep(new T.TorusGeometry(3.4, 0.18, 4, 28)), gemG = T3.keep(new T.OctahedronGeometry(0.5, 0));
    const ringMats = RINGC.map(c => keepM(new T.MeshBasicMaterial({ color: c, fog: false }))), gemMats = RINGC.map(c => keepM(new T.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.6 })));
    let fareN = 0, mateTurn = 0;
    function pickFolk() {
      fareN++;
      if (fareN > 3 && Math.random() < 0.035 && !sv.mom) return MOM;
      if (fareN > 2 && Math.random() < 0.09) return MATES[(mateTurn++) % 4];
      const pool = FOLK.filter(f => !f.rare || Math.random() < 0.3); return pool[(Math.random() * pool.length) | 0];
    }
    function spawnCust(near) {
      let P = null; for (let k = 0; k < 60; k++) { const Q = pedPts[(Math.random() * pedPts.length) | 0]; if (Q.kind !== 'pave' && Math.random() < 0.7) continue; const d = near ? Math.hypot(Q.x - near[0], Q.z - near[1]) : 100; if (d < 40 || d > 330) continue; if (custs.some(c => Math.hypot(c.x - Q.x, c.z - Q.z) < 40)) continue; P = Q; break; }
      if (!P) return null;
      const F0 = pickFolk(), from = [P.x, P.z];
      // where to: one of their favourite places if there's one at a sensible distance, else anywhere
      const cand = Object.values(LMS).filter(L => Math.hypot(L.dx - P.x, L.dz - P.z) > (MATES.includes(F0) || F0 === MOM ? 0 : 90));
      let dest = null; const pref = cand.filter(L => F0.pref.includes(L.ch)); if (pref.length && (Math.random() < 0.75 || F0 === MOM || MATES.includes(F0))) dest = pref[(Math.random() * pref.length) | 0]; else dest = cand[(Math.random() * cand.length) | 0];
      const dist = routeLen(P.x, P.z, cellOf(dest.dx), cellOf(dest.dz)), cls = dist < 320 ? 0 : dist < 620 ? 1 : 2;
      const g = folkGeo(F0), grp = new T.Group(), body = new T.Mesh(g.b, cityMat), arm = new T.Mesh(g.a, cityMat); arm.position.set(0.35, 1.5, 0); grp.add(body, arm);
      const y = ground(P.x, P.z) + (P.kind === 'pave' ? 0.14 : 0.05); grp.position.set(P.x, y, P.z); scene.add(grp);
      const ring = new T.Mesh(ringG, ringMats[cls]); ring.rotation.x = -Math.PI / 2; ring.position.set(P.x, y + 0.08, P.z); scene.add(ring);
      const gem = new T.Mesh(gemG, gemMats[cls]); gem.position.set(P.x, y + 3, P.z); scene.add(gem);
      const cu = { F: F0, x: P.x, z: P.z, y, P, dest, dist, cls, grp, arm, ring, gem, t: Math.random() * 6, hop: 0 }; custs.push(cu); return cu;
    }
    function dropCust(cu) { scene.remove(cu.grp); scene.remove(cu.ring); scene.remove(cu.gem); const i = custs.indexOf(cu); if (i >= 0) custs.splice(i, 1); }
    function updCusts(dt) {
      for (const cu of custs) {
        cu.t += dt; const d = car ? Math.hypot(cu.x - car.x, cu.z - car.z) : 99;
        cu.grp.rotation.y = car ? Math.atan2(car.x - cu.x, car.z - cu.z) : 0;
        cu.arm.rotation.z = d < 60 ? 2.6 + Math.sin(cu.t * 10) * 0.5 : 0.15; // waving at you
        cu.grp.position.y = cu.y + (d < 40 ? Math.abs(Math.sin(cu.t * 6)) * 0.25 : 0);
        cu.ring.rotation.z += dt * 1.5; cu.gem.rotation.y += dt * 2; cu.gem.position.y = cu.y + 2.9 + Math.sin(cu.t * 3) * 0.2;
        const k = clamp(d / 70, 1, 3.5); cu.gem.scale.setScalar(k); cu.gem.position.y += (k - 1) * 0.6;
        cu.ring.visible = cu.gem.visible = !fare;
      }
    }

    // ---------------------------------------------------------------- the big arrow, the drop-off beacon
    const ash = new T.Shape(); ash.moveTo(0, 2.0); ash.lineTo(1.35, 0.35); ash.lineTo(0.5, 0.35); ash.lineTo(0.5, -1.5); ash.lineTo(-0.5, -1.5); ash.lineTo(-0.5, 0.35); ash.lineTo(-1.35, 0.35); ash.lineTo(0, 2.0);
    const arG = T3.keep(new T.ExtrudeGeometry(ash, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1 })); arG.rotateX(Math.PI / 2); arG.translate(0, 0.21, 0); // tip at +z, lying flat
    const arMat = keepM(new T.MeshLambertMaterial({ color: 0x3aff5a, emissive: 0x1a8a2a, fog: false })), arOut = keepM(new T.MeshBasicMaterial({ color: 0x061a08, side: T.BackSide, fog: false }));
    const arrow = new T.Group(), arIn = new T.Mesh(arG, arMat), arOl = new T.Mesh(arG, arOut); arOl.scale.setScalar(1.13); arrow.add(arOl, arIn); arrow.renderOrder = 5; scene.add(arrow); arrow.visible = false;
    const beamCol = T3.keep(new T.CylinderGeometry(8, 8, 70, 24, 1, true)); beamCol.translate(0, 35, 0);
    const beaconMat = keepM(new T.MeshBasicMaterial({ color: 0x3aff5a, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
    const beacon = new T.Group(), bcol = new T.Mesh(beamCol, beaconMat), bring = new T.Mesh(T3.keep(new T.TorusGeometry(8, 0.35, 4, 40)), keepM(new T.MeshBasicMaterial({ color: 0x3aff5a, fog: false }))), bring2 = new T.Mesh(T3.keep(new T.RingGeometry(0.5, 8, 32)), keepM(new T.MeshBasicMaterial({ color: 0x3aff5a, transparent: true, opacity: 0.25, depthWrite: false, side: T.DoubleSide })));
    bring.rotation.x = bring2.rotation.x = -Math.PI / 2; bring.position.y = 0.25; bring2.position.y = 0.2; beacon.add(bcol, bring, bring2); scene.add(beacon); beacon.visible = false;
    // chevrons floating round the beacon
    const chev = []; for (let i = 0; i < 4; i++) { const m = new T.Mesh(arG, arMat); m.scale.setScalar(0.7); beacon.add(m); chev.push(m); }

    // ---------------------------------------------------------------- breakables (cones, bins, beach balls, crates): instanced, they go flying
    const BRK = { cone: { n: 0, col: 0xff7a1a }, bin: { n: 0, col: 0x2a7a3a }, ball: { n: 0, col: 0xffffff }, crate: { n: 0, col: 0xb08850 }, skit: { n: 0, col: 0xffffff }, bal: { n: 0, col: 0xffffff } };
    const brk = [];
    function brkGeo(k) { const B = Geo();
      if (k === 'cone') { cone3(B, 0, 0, 0, 0.35, 0.04, 0.85, [1, 0.45, 0.1]); boxB(B, -0.4, 0, -0.4, 0.4, 0.06, 0.4, [1, 0.45, 0.1]); cone3(B, 0, 0.42, 0, 0.21, 0.15, 0.14, [1, 1, 1]); }
      else if (k === 'bin') { boxB(B, -0.35, 0, -0.35, 0.35, 1.05, 0.35, [1, 1, 1]); boxB(B, -0.38, 1.05, -0.38, 0.38, 1.15, 0.38, [0.8, 0.8, 0.8]); }
      else if (k === 'ball') { blob3(B, 0, 0.45, 0, 0.45, [1, 1, 1]); }
      else if (k === 'crate') { boxB(B, -0.6, 0, -0.6, 0.6, 1.2, 0.6, [1, 1, 1]); boxB(B, -0.62, 0.5, -0.62, 0.62, 0.7, 0.62, [0.7, 0.55, 0.35]); }
      else if (k === 'skit') { cone3(B, 0, 0, 0, 0.45, 0.6, 1.4, [1, 1, 1]); cone3(B, 0, 1.4, 0, 0.6, 0.3, 0.9, [1, 1, 1]); cone3(B, 0, 1.2, 0, 0.62, 0.62, 0.25, [0.9, 0.1, 0.1]); blob3(B, 0, 2.55, 0, 0.42, [1, 1, 1]); }
      else { blob3(B, 0, 2.2, 0, 0.75, [1, 1, 1]); boxB(B, -0.02, 0, -0.02, 0.02, 1.45, 0.02, [0.9, 0.9, 0.9]); }
      return geoOf(B); }
    const brkMat = keepM(new T.MeshLambertMaterial({ vertexColors: true }));
    const BMAX = { cone: 60, bin: 50, ball: 14, crate: 30, skit: 10, bal: 16 }, bim = {};
    for (const k in BMAX) { const im = new T.InstancedMesh(brkGeo(k), brkMat, BMAX[k]); for (let j = 0; j < BMAX[k]; j++) im.setColorAt(j, tc.setHex(0xffffff)); im.frustumCulled = false; im.count = 0; im.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(im); bim[k] = im; }
    function addBrk(k, x, z, o) { const im = bim[k]; if (im.count >= BMAX[k]) return null; const b = Object.assign({ k, i: im.count++, x, z, y: ground(x, z) + (G[cellOf(z)] && G[cellOf(z)][cellOf(x)] === '.' ? 0.12 : 0.12), x0: x, z0: z, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, ry: Math.random() * 6, sp: 0, hit: false, t: 0, gone: false }, o || {}); b.y0 = b.y; brk.push(b); const ci = k === 'ball' ? [0xff3a3a, 0x3a8aff, 0xffd21a, 0x3ad04a][b.i % 4] : k === 'bal' ? [0xff3a8a, 0x3aff8a, 0xffd21a, 0x3ac8ff, 0xff8a3a][b.i % 5] : BRK[k].col; im.setColorAt(b.i, tc.setHex(ci)); if (im.instanceColor) im.instanceColor.needsUpdate = true; setBrk(b); return b; }
    function setBrk(b) { const im = bim[b.k]; if (b.gone) tm.makeScale(0, 0, 0); else { tq.setFromEuler(te.set(b.rx, b.ry, b.rz)); tv.set(b.x, b.y + (b.k === 'bal' ? Math.sin(K.t * 2 + b.i) * 0.3 : 0), b.z); tm.compose(tv, tq, ts); } im.setMatrixAt(b.i, tm); im.instanceMatrix.needsUpdate = true; }
    function scatterBreakables() {
      const R = rng(42);
      for (const P of pedPts) { if (P.kind === 'pave' && R() < 0.05) addBrk('bin', P.x + (P.ax === 'x' ? (R() - 0.5) * 14 : 0), P.z + (P.ax === 'z' ? (R() - 0.5) * 14 : 0)); if (P.kind === 'beach' && R() < 0.12) addBrk('ball', P.x + (R() - 0.5) * 12, P.z + (R() - 0.5) * 12); }
      // road works with cones
      for (const [c, r] of [[24, 20], [13, 34], [35, 9], [41, 17], [30, 31], [18, 15], [2, 25], [8, 4]]) for (let i = 0; i < 5; i++) addBrk('cone', (c + 0.5) * CELL + (i - 2) * 2.2, (r + 0.5) * CELL + 2);
      for (let i = 0; i < 24; i++) addBrk('crate', 38 * CELL + 20 + R() * 140, 34 * CELL + 10 + R() * 60);
    }
    scatterBreakables();
    function updBrk(dt) {
      const sp = Math.hypot(car.vx, car.vz);
      for (const b of brk) {
        if (b.gone) continue;
        if (!b.hit) {
          const r = b.k === 'skit' ? 1.6 : b.k === 'bal' ? 2.0 : b.k === 'crate' ? 1.7 : 1.3, by = b.k === 'bal' ? 2.2 : 0.5;
          if (Math.abs(car.x - b.x) < 2 + r && Math.abs(car.z - b.z) < 2 + r && Math.abs(car.y + 0.8 - (b.y + by)) < 2.2 && Math.hypot(car.x - b.x, car.z - b.z) < 1.6 + r && (sp > 2.5 || b.k === 'bal')) {
            b.hit = true; b.t = 0;
            if (b.k === 'bal') { b.gone = true; setBrk(b); burst(b.x, b.y + 2.2, b.z, 0xff6aa0, 10); sfx.noise(0.12, 0.25, 3000); sfx.tone(1400, 0.06, 'square', 0.05); if (test) test.pop = (test.pop || 0) + 1; continue; }
            const k = 0.7 + Math.random() * 0.4; b.vx = car.vx * k + (Math.random() - 0.5) * 4; b.vz = car.vz * k + (Math.random() - 0.5) * 4; b.vy = 4 + sp * 0.35; b.sp = (Math.random() - 0.5) * 12;
            car.vx *= b.k === 'crate' || b.k === 'skit' ? 0.94 : 0.985; car.vz *= b.k === 'crate' || b.k === 'skit' ? 0.94 : 0.985;
            sfx.noise(0.15, 0.12, b.k === 'crate' ? 700 : 1800); sfx.tone(b.k === 'bin' ? 220 : b.k === 'ball' ? 500 : 300, 0.1, 'square', 0.05, 0, 120);
            if (test && b.k === 'skit') test.skit = (test.skit || 0) + 1;
          } else continue;
        }
        b.t += dt; b.vy -= 22 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.rx += b.sp * dt; b.rz += b.sp * 0.7 * dt;
        const gh = ground(b.x, b.z); if (b.y < gh && b.vy < 0) { b.y = gh; b.vy *= -0.35; b.vx *= 0.7; b.vz *= 0.7; b.sp *= 0.6; }
        if (b.t > (b.k === 'skit' ? 99 : 7) && Math.hypot(b.x0 - car.x, b.z0 - car.z) > 70) { b.hit = false; b.x = b.x0; b.z = b.z0; b.y = b.y0; b.rx = b.rz = 0; b.vx = b.vy = b.vz = 0; }
        setBrk(b);
      }
    }
    // ---- sparks, dust and splashes (a small particle pool)
    const NPART = 160, partG = new T.BufferGeometry(), partP = new Float32Array(NPART * 3), partC = new Float32Array(NPART * 3), parts = [];
    partG.setAttribute('position', new T.BufferAttribute(partP, 3)); partG.setAttribute('color', new T.BufferAttribute(partC, 3)); T3.keep(partG);
    const partMesh = new T.Points(partG, keepM(new T.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, depthWrite: false, map: glowTex, blending: T.NormalBlending })));
    partMesh.frustumCulled = false; scene.add(partMesh);
    for (let i = 0; i < NPART; i++) parts.push({ t: 99, x: 0, y: -99, z: 0 });
    let pi = 0;
    function puff(x, y, z, col, vx, vy, vz, life) { const p = parts[pi++ % NPART]; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.t = 0; p.life = life || 0.8; tc.setHex(col); p.r = tc.r; p.g = tc.g; p.b = tc.b; }
    function burst(x, y, z, col, n) { for (let i = 0; i < n; i++) puff(x, y, z, col, (Math.random() - 0.5) * 10, Math.random() * 8, (Math.random() - 0.5) * 10, 0.7); }
    function updParts(dt) { for (let i = 0; i < NPART; i++) { const p = parts[i]; if (p.t < p.life) { p.t += dt; p.vy -= 9 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; } const k = p.t < p.life ? 1 - p.t / p.life : 0; partP[i * 3] = p.x; partP[i * 3 + 1] = k > 0 ? p.y : -999; partP[i * 3 + 2] = p.z; partC[i * 3] = (p.r || 1) * k + (1 - k); partC[i * 3 + 1] = (p.g || 1) * k + (1 - k); partC[i * 3 + 2] = (p.b || 1) * k + (1 - k); } partG.attributes.position.needsUpdate = partG.attributes.color.needsUpdate = true; }

    // ---------------------------------------------------------------- the state of play
    let mode = 'boot', bootT = 0, code = [], menu = 0, sub = null, idle = 0, demo = false, paused = false, pmenu = 0;
    let money = 0, tips = 0, fares = 0, timeLeft = 0, shiftLen = 0, arcade = true, fare = null, msgs = [], speech = null, crazyN = 0, combo = 0, comboT = 0, bestCombo = 0, crazyCount = 0;
    let district = '', distT = 0, shake = 0, splashT = 0, safe = [], safeT = 0, stuckT = 0, endT = 0, results = null, test = null, camYaw = 0, camPos = new T.Vector3(), camLook = new T.Vector3(), countT = 0, lastBrake = -9, eng = 0, mateRide = {}, overSent = false, attractT = 0, flyT = 0, lastCrash = 0;
    const say = (a, b, t, col) => { msgs.push({ a, b: b || '', t: t || 1.8, col: col || '#ffe14a', t0: t || 1.8 }); if (msgs.length > 3) msgs.shift(); };
    const talk = (who, text, t) => { speech = { who, text, t: t || 3 }; const P0 = (fare && fare.F.pitch) || 1; for (let i = 0; i < Math.min(10, text.length / 3); i++) sfx.tone((300 + Math.random() * 300) * P0, 0.05, 'square', 0.025, i * 0.06); };
    const music = s => { if (sv.opts.music) K.music(SONGS[s]); else K.music(null); };

    // ---------------------------------------------------------------- driving
    const STEP = 1.6;
    function blockedAt(x, z, h, y) { const fx = Math.sin(h), fz = Math.cos(h), rx = fz, rz = -fx, hw = car.S.W / 2 - 0.05, hl = car.S.L / 2 - 0.1;
      for (const [a, b] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [hl, 0], [-hl, 0], [0, hw], [0, -hw]]) { const px = x + fx * a + rx * b, pz = z + fz * a + rz * b; if (Hat(px, pz) > y + STEP) return true; } return false; }
    function inputs() {
      const s = K.stick(); let thr = K.held('a') || (K.held('up') && !K.held('down') && !touchStick()) ? 1 : 0, brk = K.held('b') || (K.held('down') && !touchStick()) ? 1 : 0, steer = s.x, hb = K.held('x');
      if (touchStick() && s.y < -0.55) thr = 1;
      return { thr, brk, steer, hb };
    }
    const touchStick = () => false; // (the touch stick's up/down also counts as go/brake through K.held: fine)
    function drive(dt, inp) {
      const D = car.D, sp0 = Math.hypot(car.vx, car.vz);
      let fx = Math.sin(car.h), fz = Math.cos(car.h);
      let fv = car.vx * fx + car.vz * fz, lv = car.vx * fz - car.vz * fx;
      // a crazy dash: brake, then straight back on the gas
      if (inp.brk) lastBrake = K.t;
      if (inp.thr && !car.prevThr && K.t - lastBrake < 0.35 && fv > -2 && fv < 14 && !car.air) { car.dash = 0.5; fv = Math.max(fv, 24); crazy('DASH', car.x, car.z); sfx.noise(0.35, 0.12, 3000, 0, 'bandpass', 800); shake = Math.max(shake, 0.3); }
      car.prevThr = inp.thr;
      if (!car.air) {
        if (inp.thr) { if (fv < -0.5) fv += 30 * dt; else if (fv < D.top) fv += (D.acc * (1 - fv / (D.top + 6)) + 3) * dt; }
        if (inp.brk) { if (fv > 0.5) fv -= 34 * dt; else fv = Math.max(-12, fv - 13 * dt); }
        if (inp.hold) { fv -= Math.sign(fv) * Math.min(Math.abs(fv), 30 * dt); lv *= 0.9; }
        if (!inp.thr && !inp.brk) fv -= Math.sign(fv) * Math.min(Math.abs(fv), 3.2 * dt);
        if (car.dash > 0) { car.dash -= dt; fv = Math.max(fv, Math.min(D.top + 5, fv + 20 * dt)); }
        const surf = G[clamp(cellOf(car.z), 0, N - 1)][clamp(cellOf(car.x), 0, N - 1)], loose = '.gt'.includes(surf);
        if (loose && fv > D.top * 0.8) fv -= 6 * dt;
        lv *= Math.exp(-(inp.hb ? 1.0 : loose ? D.grip * 0.55 : D.grip) * dt);
        car.steer += (inp.steer - car.steer) * Math.min(1, dt * 9);
        const turn = car.steer * D.turn * clamp(Math.abs(fv) / 7, 0, 1) * (1 - 0.32 * clamp(Math.abs(fv) / D.top, 0, 1)) * Math.sign(fv || 1) * (inp.hb ? 1.55 : 1);
        car.h -= turn * dt;
        if (inp.hb && Math.abs(fv) > 8) { lv += car.steer * fv * 0.9 * dt * 6; fv -= Math.sign(fv) * 4 * dt; }
      } else { car.h -= car.steer * 0.6 * dt; car.steer += (inp.steer - car.steer) * Math.min(1, dt * 5); }
      fv = clamp(fv, -12, D.top + 6);
      fx = Math.sin(car.h); fz = Math.cos(car.h);
      car.vx = fx * fv + fz * lv; car.vz = fz * fv - fx * lv;
      car.fv = fv; car.lv = lv;
      // drifting (with or without a passenger: tips only with one)
      if (!car.air && Math.abs(lv) > 5 && fv > 10) { car.driftT = (car.driftT || 0) + dt; if (test && test.id === 'drift') test.v += dt; if (car.driftT > 0.7) { car.driftT = 0; crazy('DRIFT', car.x, car.z); } if (K.frame % 3 === 0) { sfx.noise(0.08, 0.06, 2400, 0, 'highpass'); for (const s of [-1, 1]) puff(car.x - fx * 1.6 + fz * s * 0.8, car.y + 0.3, car.z - fz * 1.6 - fx * s * 0.8, 0xd8d8d8, -car.vx * 0.1, 1.2, -car.vz * 0.1, 0.9); } }
      else car.driftT = Math.max(0, (car.driftT || 0) - dt * 2);
      // move, wall by wall
      const nx = car.x + car.vx * dt, nz = car.z + car.vz * dt;
      if (!blockedAt(nx, nz, car.h, car.y)) { car.x = nx; car.z = nz; }
      else {
        const bx = blockedAt(nx, car.z, car.h, car.y), bz = blockedAt(car.x, nz, car.h, car.y), imp = Math.max(bx ? Math.abs(car.vx) : 0, bz ? Math.abs(car.vz) : 0);
        if (!bx) car.x = nx; else car.vx *= -0.3; if (!bz) car.z = nz; else car.vz *= -0.3;
        if (imp > 7) crash(imp);
      }
      // stuck inside something (a bad landing): nudge out, or back to safety
      if (blockedAt(car.x, car.z, car.h, car.y)) { stuckT += dt; if (stuckT > 1.2) toSafety(); } else stuckT = 0;
      // the ground: follow it, or fly
      const gh = Hat(car.x, car.z), pyv = car.vy;
      if (!car.air) {
        if (gh < car.y - 0.55) { car.air = true; car.airT = 0; car.vy = car.slopeV || 0; car.takeX = car.x; car.takeZ = car.z; car.takeY = car.y; }
        else { car.slopeV = clamp((gh - car.y) / dt, -30, 30); car.y = gh; car.vy = 0; }
      }
      if (car.air) {
        car.airT += dt; car.vy -= 23 * dt; car.y += car.vy * dt;
        if (car.y <= gh) { // landed
          const hard = -car.vy; car.y = gh; car.air = false;
          if (car.airT > 0.55) { const dist = Math.hypot(car.x - car.takeX, car.z - car.takeZ); crazy('JUMP', car.x, car.z, car.airT); if (test && test.id === 'jump' && test.flying) { test.v = Math.max(test.v, dist); test.landed = 1; } if (dist > 20 && car.takeX < 36 * CELL && car.x > 38 * CELL && Math.abs(car.z - 19.5 * CELL) < 30) { K.secret('rm.taxi.leap'); if (test && test.id === 'leap') test.done = 1; say('RIVER LEAP!', 'YOU JUMPED THE RIVER!', 2.5, '#3aff5a'); } }
          if (hard > 9) { shake = Math.max(shake, Math.min(1, hard / 25)); sfx.noise(0.3, 0.2, 500); sfx.tone(80, 0.25, 'square', 0.08, 0, 40); for (let i = 0; i < 10; i++) puff(car.x + (Math.random() - 0.5) * 3, car.y + 0.2, car.z + (Math.random() - 0.5) * 3, 0xc8c0b0, (Math.random() - 0.5) * 6, 2 + Math.random() * 3, (Math.random() - 0.5) * 6, 0.8); car.bounce = Math.min(0.5, hard * 0.02); }
          car.slopeV = 0; car.vy = 0;
        }
      }
      // in the drink
      if (car.y < -0.9 && isWater(car.x, car.z)) splash();
      // remember safe places to come back to
      safeT -= dt; if (safeT <= 0 && !car.air && sp0 > 2) { safeT = 0.5; const ch = G[clamp(cellOf(car.z), 0, N - 1)][clamp(cellOf(car.x), 0, N - 1)]; if ('#=a'.includes(ch) && car.y < 3) { safe.push([car.x, car.z, car.h]); if (safe.length > 10) safe.shift(); } }
      // looks: pitch to the slope, lean in corners, wheels turn and spin
      const hf = Hat(car.x + fx * 1.6, car.z + fz * 1.6), hb2 = Hat(car.x - fx * 1.6, car.z - fz * 1.6);
      const wantP = car.air ? clamp(-car.vy * 0.03, -0.5, 0.5) : (Math.abs(hf - hb2) < 3 ? Math.atan2(hf - hb2, 3.2) : 0);
      car.pitch += (-wantP - car.pitch) * Math.min(1, dt * 10); car.roll += (clamp(lv * 0.02 + car.steer * fv * 0.004, -0.15, 0.15) - car.roll) * Math.min(1, dt * 6);
      car.bounce = (car.bounce || 0) * Math.exp(-6 * dt);
      car.spin += fv * dt / car.S.wr;
      return fv;
    }
    function crash(imp) {
      if (K.t - lastCrash < 0.4) return; lastCrash = K.t;
      shake = Math.max(shake, Math.min(0.9, imp / 25)); sfx.noise(0.3, Math.min(0.3, 0.1 + imp * 0.01), 650); sfx.tone(110, 0.2, 'square', 0.07, 0, 50);
      for (let i = 0; i < 8; i++) puff(car.x, car.y + 1, car.z, 0xffe080, (Math.random() - 0.5) * 8, 2 + Math.random() * 4, (Math.random() - 0.5) * 8, 0.4);
      if (combo > 0 && imp > 12) { combo = 0; comboT = 0; }
      if (fare && imp > 14) { fare.bumps++; if (Math.random() < 0.4) talk(fare.F.n, ['OI! WATCH IT!', 'MY NECK!', 'CAREFUL!', 'OUCH!'][(Math.random() * 4) | 0], 1.6); }
    }
    function splash() {
      if (splashT > 0) return; splashT = 1.6; sfx.noise(0.8, 0.3, 1200, 0, 'lowpass', 200); sfx.tone(300, 0.5, 'sine', 0.06, 0, 80);
      for (let i = 0; i < 40; i++) puff(car.x + (Math.random() - 0.5) * 3, -0.8, car.z + (Math.random() - 0.5) * 3, 0xc8e8ff, (Math.random() - 0.5) * 8, 6 + Math.random() * 8, (Math.random() - 0.5) * 8, 1.2);
      say('SPLASH!', arcade && mode === 'play' && !test ? '-5 SECONDS' : 'BACK YOU GO', 2, '#8ad8ff');
      if (mode === 'play' && arcade && !test) timeLeft = Math.max(1, timeLeft - 5);
      if (fare) talk(fare.F.n, 'I\'M SOAKED!', 2);
    }
    function toSafety() { const s = safe.length > 3 ? safe[safe.length - 4] : safe[0] || [startPos[0], startPos[1], startPos[2]]; car.x = s[0]; car.z = s[1]; car.h = s[2]; car.y = Hat(s[0], s[1]); car.vx = car.vz = car.vy = 0; car.air = false; stuckT = 0; camYaw = car.h; snapCam = true; }
    let startPos = [24.5 * CELL, 31.5 * CELL, Math.PI / 2], snapCam = true;
    // ---- crazy stunts: a combo of them pays tips (when you've got a passenger)
    function crazy(kind, x, z, extra) {
      if (mode !== 'play') return;
      if (K.t - comboT < 2.6) combo++; else combo = 1;
      comboT = K.t; crazyCount++; bestCombo = Math.max(bestCombo, combo);
      const tip = fare ? combo * (kind === 'JUMP' ? Math.max(1, Math.round((extra || 1) * 2)) : 1) : 0;
      if (fare) { fare.tips += tip; tips += tip; fare.crazy++; if (fare.crazy % 3 === 1 && (!speech || speech.t < 1.5)) talk(fare.F.n, fare.F.crazy[(Math.random() * fare.F.crazy.length) | 0], 2); }
      if (test && test.id === 'through' && kind === 'THROUGH') test.v++;
      say('CRAZY ' + kind + '!', (combo > 1 ? 'X' + combo + '  ' : '') + (tip ? '+£' + tip : ''), 1.4, ['#ff3a8a', '#ffd21a', '#3affd0', '#ff8a3a'][combo % 4]);
      sfx.tone(660 + Math.min(combo, 12) * 70, 0.08, 'square', 0.06); sfx.tone(990 + Math.min(combo, 12) * 70, 0.12, 'square', 0.05, 0.07);
    }

    // ---------------------------------------------------------------- fares
    function nearestCust() { let best = null, bd = 1e9; for (const cu of custs) { const d = Math.hypot(cu.x - car.x, cu.z - car.z); if (d < bd) { bd = d; best = cu; } } return best; }
    function fares_(dt) {
      const sp = Math.hypot(car.vx, car.vz);
      if (!fare) {
        for (const cu of custs) {
          const d = Math.hypot(cu.x - car.x, cu.z - car.z);
          if (d < 7.5 && sp < 4.5 && !car.air) { pickUp(cu); break; }
        }
        // keep a dozen people waiting round you
        while (custs.length < 12) { if (!spawnCust([car.x, car.z])) break; }
        for (const cu of custs.slice()) if (Math.hypot(cu.x - car.x, cu.z - car.z) > 480) dropCust(cu);
      } else {
        fare.t += dt; fare.left -= dt;
        if (fare.left < fare.par * 0.3 && !fare.hurried) { fare.hurried = 1; talk(fare.F.n, fare.F.hurry, 2.4); }
        const L = fare.dest, dd = Math.hypot(L.dx - car.x, L.dz - car.z);
        if (fare.left <= 0) { // they've had enough
          talk(fare.F.n, fare.F.bail, 2.4); say('THEY GOT OUT!', 'TOO SLOW', 2, '#ff4a3a'); sfx.seq([[60, 0.5], [55, 1]], { bpm: 200, vol: 0.08 });
          fare = null; beacon.visible = false; if (test && test.id === 'rush') test.fail = 1; return;
        }
        if (dd < 9 && sp < 5 && !car.air && Math.abs(car.y - Hat(L.dx, L.dz)) < 3) dropOff();
        else if (dd < 9 && sp >= 5 && K.frame % 30 === 0) say('STOP!', 'BRAKE IN THE GREEN!', 0.6, '#3aff5a');
      }
    }
    function pickUp(cu) {
      const F0 = cu.F, L = cu.dest, rl = routeLen(car.x, car.z, cellOf(L.dx), cellOf(L.dz));
      const par = Math.round(rl / (15 + (cu.cls === 2 ? 2 : 0)) + 7);
      fare = { F: F0, dest: L, par, left: par, t: 0, tips: 0, crazy: 0, bumps: 0, dist: rl, cls: cu.cls, hurried: 0 };
      dropCust(cu);
      talk(F0.n, F0.get[F0 === MOM ? 0 : (Math.random() * F0.get.length) | 0].replace('{D}', L.name), 3.2); say(L.name, F0.n, 2.2, RINGC[cu.cls] === 0x3aff5a ? '#3aff5a' : RINGC[cu.cls] === 0xffd21a ? '#ffd21a' : '#ff6a5a');
      sfx.seq([[72, 0.25], [76, 0.25], [79, 0.5]], { bpm: 400, vol: 0.09 });
      if (F0 === MOM) { sv.mom = 1; K.secret('rm.taxi.mom'); save(); }
      beacon.visible = !sv.opts.expert; beacon.position.set(L.dx, Hat(L.dx, L.dz), L.dz);
      fieldTarget = [cellOf(L.dx), cellOf(L.dz)];
      if (F0.id === 'mom' && F0.get[1]) setTimeout(() => { if (fare && fare.F === MOM) talk('MOM', MOM.get[1], 3); }, 3300);
    }
    let fieldTarget = null;
    function dropOff() {
      const f = fare, q = clamp(f.left / f.par, 0, 1), base = Math.round(4 + f.dist / 45);
      let rate, bonus, tb;
      if (q > 0.5) { rate = 'SPEEDY!'; bonus = 6; tb = Math.round(base * 0.5 * f.F.tip) + 5; } else if (q > 0.25) { rate = 'NORMAL'; bonus = 3; tb = Math.round(base * 0.2 * f.F.tip); } else { rate = 'SLOW...'; bonus = 1; tb = 0; }
      const got = base + tb + f.tips; money += base + tb; fares++; sv.fares = (sv.fares | 0) + 1;
      if (arcade && !test) timeLeft = Math.min(99, timeLeft + bonus);
      if (q > 0.55 && f.dist > 250) K.secret('rm.taxi.tip');
      say(rate, `FARE £${base}  TIP £${tb + f.tips}${arcade && !test ? '  +' + bonus + 'S' : ''}`, 2.6, q > 0.5 ? '#3aff5a' : q > 0.25 ? '#ffd21a' : '#ff8a5a');
      talk(f.F.n, q > 0.25 ? f.F.fast : f.F.slow, 2.6);
      sfx.seq(q > 0.5 ? [[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 1]] : [[76, 0.25], [79, 0.25], [84, 0.75]], { bpm: 420, vol: 0.1 }); sfx.noise(0.08, 0.15, 5000, 0.35, 'highpass'); sfx.tone(2093, 0.3, 'square', 0.05, 0.4);
      if (MATES.includes(f.F)) { sv.mates[f.F.id] = 1; if (MATES.every(m => sv.mates[m.id])) K.secret('rm.taxi.mates'); save(); }
      burst(car.x, car.y + 2, car.z, 0xffe14a, 24);
      fare = null; beacon.visible = false; fieldTarget = null;
      if (test && test.id === 'rush') { test.v++; }
    }

    // ---------------------------------------------------------------- the camera
    let camNear = 0;
    function camera(dt) {
      if (mode === 'boot' || mode === 'title' || mode === 'menu' || mode === 'drivers' || mode === 'records' || mode === 'options' || mode === 'how' || mode === 'box') {
        flyT += dt * 0.035; const P = FLY[Math.floor(flyT) % FLY.length], Q = FLY[(Math.floor(flyT) + 1) % FLY.length], k = smooth(flyT % 1);
        if (!demo) { cam.position.set(lerp(P[0], Q[0], k), lerp(P[1], Q[1], k), lerp(P[2], Q[2], k)); cam.lookAt(lerp(P[3], Q[3], k), lerp(P[4], Q[4], k), lerp(P[5], Q[5], k)); }
        if (!demo) return;
      }
      const far = sv.opts.cam ? 1.3 : 1, sp = Math.hypot(car.vx, car.vz);
      const wantYaw = sp > 3 && car.fv < -1 ? car.h : car.h; // (reversing: keep looking forwards)
      camYaw += wrapA(wantYaw - camYaw) * Math.min(1, dt * (car.air ? 2 : 4.5));
      const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
      let back = 10.5 * far, hgt = 4.6 * far;
      for (; back > 3.5; back -= 0.5) { const x = car.x - fx * back, z = car.z - fz * back; if (Hat(x, z) < car.y + hgt - 1.2) break; }
      const tx = car.x - fx * back, tz = car.z - fz * back, ty = Math.max(car.y + hgt * (0.75 + back / 10.5 / far * 0.25), Hat(tx, tz) + 1.5);
      if (snapCam) { camPos.set(tx, ty, tz); snapCam = false; }
      camPos.x += (tx - camPos.x) * Math.min(1, dt * 12); camPos.z += (tz - camPos.z) * Math.min(1, dt * 12); camPos.y += (ty - camPos.y) * Math.min(1, dt * 6);
      camLook.set(car.x + fx * 7, car.y + 1.4, car.z + fz * 7);
      const sh = shake > 0 ? shake : 0;
      cam.position.set(camPos.x + (Math.random() - 0.5) * sh, camPos.y + (Math.random() - 0.5) * sh, camPos.z + (Math.random() - 0.5) * sh); cam.lookAt(camLook);
      const fov = 64 + clamp((sp - 15) * 0.5, 0, 12) + (car.dash > 0 ? 6 : 0); if (Math.abs(cam.fov - fov) > 0.2) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix(); }
    }
    // the title fly-past: [camera x y z, look x y z] in a loop
    const FLY = [[24 * CELL, 60, 44 * CELL, 25 * CELL, 5, 36 * CELL], [14 * CELL, 26, 34 * CELL, 22 * CELL, 18, 18 * CELL], [26 * CELL, 50, 22 * CELL, 21 * CELL, 25, 16 * CELL], [33 * CELL, 30, 14 * CELL, 27 * CELL, 5, 6 * CELL],
      [18 * CELL, 50, 2 * CELL, 9 * CELL, 18, 8 * CELL], [4 * CELL, 40, 12 * CELL, 9 * CELL, 8, 28 * CELL], [14 * CELL, 34, 32 * CELL, 36 * CELL, 8, 26 * CELL], [40 * CELL, 26, 30 * CELL, 44 * CELL, 12, 40 * CELL], [34 * CELL, 30, 46 * CELL, 25 * CELL, 4, 42 * CELL]];

    // ---------------------------------------------------------------- the arrow: points along the roads to where you're going
    const v3a = new T.Vector3(), v3b = new T.Vector3(), v3c = new T.Vector3(), basis = new T.Matrix4();
    let arrowTgt = null, arrowYaw = 0, routeCells = [];
    function updArrow(dt) {
      let tgt = null, final = null, tc2 = null;
      if (fare) { final = [fare.dest.dx, fare.dest.dz]; tc2 = [cellOf(fare.dest.dx), cellOf(fare.dest.dz)]; }
      else if (test && test.target) { final = test.target; tc2 = [cellOf(final[0]), cellOf(final[1])]; }
      else if (!test) { const cu = nearestCust(); if (cu) { final = [cu.x, cu.z]; tc2 = [cellOf(cu.x), cellOf(cu.z)]; } }
      arrow.visible = !!final && (mode === 'play') && !(test && !test.arrow) && !(sv.opts.expert && !test && !demo);
      if (!final) { routeCells = []; return; }
      const dFin = Math.hypot(final[0] - car.x, final[1] - car.z);
      routeCells = routeFrom(car.x, car.z, tc2[0], tc2[1], 12);
      if (sv.opts.arrow === 1 || dFin < 45 || routeCells.length < 2 || (test && test.direct)) tgt = final;
      else { // aim at a point two or three cells down the route (so it says which way to turn)
        const k = Math.min(routeCells.length - 1, 2), a = routeCells[k]; tgt = [(a[0] + 0.5) * CELL, (a[1] + 0.5) * CELL];
        const b = routeCells[Math.min(routeCells.length - 1, 3)]; tgt = [lerp(tgt[0], (b[0] + 0.5) * CELL, 0.4), lerp(tgt[1], (b[1] + 0.5) * CELL, 0.4)];
      }
      const want = Math.atan2(tgt[0] - car.x, tgt[1] - car.z);
      arrowYaw += wrapA(want - arrowYaw) * Math.min(1, dt * 7);
      // place it over the cab, its flat face turned towards the camera so it always reads
      const fh = v3a.set(Math.sin(arrowYaw), 0, Math.cos(arrowYaw));
      const pos = new T.Vector3(car.x + Math.sin(car.h) * 0.8, car.y + 3.5 + Math.sin(K.t * 4) * 0.12, car.z + Math.cos(car.h) * 0.8);
      // squash the arrow's depth towards the screen so it always reads as a flat arrow on the glass (up = away from you,
      // down = behind you), then turn its face to the camera
      const view = v3b.copy(pos).sub(cam.position).normalize();
      const fwd = v3c.copy(fh).addScaledVector(view, -fh.dot(view) * 0.72).normalize();
      const toCam = cam.position.clone().sub(pos).normalize(), up = toCam.clone();
      up.addScaledVector(fwd, -up.dot(fwd)); if (up.lengthSq() < 0.001) up.set(0, 1, 0); up.normalize();
      const right = new T.Vector3().crossVectors(up, fwd).normalize(); up.crossVectors(fwd, right);
      basis.makeBasis(right, up, fwd); arrow.quaternion.setFromRotationMatrix(basis); arrow.position.copy(pos);
      const near = dFin < 45, pulse = near ? 1 + Math.sin(K.t * 12) * 0.08 : 1; arrow.scale.setScalar(1.05 * pulse);
      arMat.color.setHex(fare ? (fare.left / fare.par > 0.3 ? 0x3aff5a : 0xff5a3a) : test ? 0x3ac8ff : 0xffd21a); arMat.emissive.setHex(fare ? 0x14701e : test ? 0x14507a : 0x7a6008);
      // the beacon spins
      if (beacon.visible) { bring.rotation.z += dt; chev.forEach((m, i) => { const a = K.t * 1.2 + i * Math.PI / 2; m.position.set(Math.cos(a) * 9.5, 1.2 + Math.sin(K.t * 3 + i) * 0.3, Math.sin(a) * 9.5); m.rotation.set(0, -a, 0); m.rotateY(Math.PI); }); beaconMat.opacity = 0.16 + Math.sin(K.t * 5) * 0.06; }
    }

    // ---------------------------------------------------------------- the minimap
    const MM = document.createElement('canvas'); MM.width = MM.height = N * 4; { const g = MM.getContext('2d');
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const ch = G[r][c]; let col = '#2a2c38';
        if ('#='.includes(ch)) col = '#9a9aa4'; else if (ch === 'a') col = '#7a7a84'; else if (ch === '~') col = '#2a6ac8'; else if ('gtqY'.includes(ch)) col = ch === 'q' ? '#9ab070' : '#3a8a3a'; else if (ch === '.') col = '#e0cc8a'; else if (ch === '_') col = '#c8b490'; else if (ch === 'p' || ch === 'A') col = '#9a6a3a'; else if ('ry'.includes(ch) || ch === 'm') col = '#5a5a62'; else if (ch === '%') col = '#1a4a1a'; else if (LMS[ch]) col = LMS[ch].col; else if (ch === 'h') col = '#4a3a3a'; else if (ch === 'o') col = '#3a4a5a';
        g.fillStyle = col; g.fillRect(c * 4, r * 4, 4, 4); if (LMS[ch]) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(c * 4, r * 4, 4, 4); } } }
    function minimap(H) {
      const cx = 86, cy = HH - 86, R = 70, k = 0.2 * 2.2; // px per metre
      H.save(); H.beginPath(); H.arc(cx, cy, R + 4, 0, 7); H.fillStyle = 'rgba(0,0,0,.55)'; H.fill(); H.lineWidth = 3; H.strokeStyle = '#ffd21a'; H.stroke();
      H.beginPath(); H.arc(cx, cy, R, 0, 7); H.clip();
      H.translate(cx, cy); const ang = -Math.PI / 2 - Math.atan2(Math.cos(camYaw), Math.sin(camYaw)); H.rotate(ang);
      H.imageSmoothingEnabled = false; H.globalAlpha = 0.92; H.drawImage(MM, -car.x * k, -car.z * k, SIZE * k, SIZE * k); H.globalAlpha = 1;
      if (routeCells.length) { H.strokeStyle = fare ? '#3aff5a' : '#ffd21a'; H.lineWidth = 3; H.beginPath(); H.moveTo(0, 0); for (const [c, r] of routeCells) H.lineTo(((c + 0.5) * CELL - car.x) * k, ((r + 0.5) * CELL - car.z) * k); H.stroke(); }
      if (!fare) for (const cu of custs) { H.fillStyle = '#' + RINGC[cu.cls].toString(16).padStart(6, '0'); H.beginPath(); H.arc((cu.x - car.x) * k, (cu.z - car.z) * k, 3, 0, 7); H.fill(); }
      for (const v of traffic) { const x = (v.x - car.x) * k, y = (v.z - car.z) * k; if (x * x + y * y < R * R) { H.fillStyle = '#e8e8e8'; H.fillRect(x - 1, y - 1, 2, 2); } }
      H.restore();
      // the destination flag (on the rim if it's off the map)
      const dst = fare ? [fare.dest.dx, fare.dest.dz] : test && test.target ? test.target : null;
      if (dst) { let x = (dst[0] - car.x) * k, y = (dst[1] - car.z) * k; const c = Math.cos(ang), s = Math.sin(ang); let rx = x * c - y * s, ry = x * s + y * c; const d = Math.hypot(rx, ry); if (d > R - 6) { rx *= (R - 6) / d; ry *= (R - 6) / d; }
        H.fillStyle = (K.frame >> 3) & 1 ? '#3aff5a' : '#fff'; H.beginPath(); H.arc(cx + rx, cy + ry, 5, 0, 7); H.fill(); H.strokeStyle = '#000'; H.lineWidth = 1.5; H.stroke(); }
      // the cab
      H.fillStyle = '#ffd21a'; H.strokeStyle = '#000'; H.lineWidth = 1.5; H.beginPath(); H.moveTo(cx, cy - 7); H.lineTo(cx + 5, cy + 5); H.lineTo(cx, cy + 2); H.lineTo(cx - 5, cy + 5); H.closePath(); H.fill(); H.stroke();
      F.center(H, 'N', cx + Math.cos(ang - Math.PI / 2) * (R - 8), cy + Math.sin(ang - Math.PI / 2) * (R - 8) - 4, '#fff', 1, '#000');
    }

    // ---------------------------------------------------------------- starting a shift / a test
    function resetWorld() {
      for (const cu of custs.slice()) dropCust(cu); fare = null; beacon.visible = false; msgs = []; speech = null; combo = 0; tips = 0; crazyCount = 0; bestCombo = 0;
      for (const b of brk) if (b.k === 'skit' || b.k === 'bal') { b.gone = true; setBrk(b); }
      for (const v of traffic) v.m.visible = true;
      test = null; safe = []; arrowTgt = null; fareN = 0; arrow.visible = false; boxMesh.visible = flagMesh.visible = false;
    }
    function placeCab(x, z, h) { car.x = x; car.z = z; car.h = h; car.y = Hat(x, z); car.vx = car.vz = car.vy = 0; car.air = false; car.steer = 0; car.dash = 0; camYaw = h; snapCam = true; startPos = [x, z, h]; safe = [[x, z, h]]; }
    function startShift(kind) {
      resetWorld(); buildCab(sv.driver); arcade = kind === 'arcade'; shiftLen = kind === 'arcade' ? 50 : kind === 'w3' ? 180 : kind === 'w5' ? 300 : 600; timeLeft = shiftLen;
      money = 0; fares = 0; placeCab(24.5 * CELL - 3, 31.5 * CELL, Math.PI / 2);
      for (let i = 0; i < 12; i++) spawnCust([car.x, car.z]);
      for (const v of traffic) placeCar(v, [car.x, car.z]);
      mode = 'count'; countT = 3.2; endT = 0; results = null; overSent = false; paused = false;
      setTod(sv.opts.tod ? sv.opts.tod - 1 : autoTod()); music(kind === 'arcade' ? 'a' : 'b');
    }
    function startTest(i) {
      resetWorld(); buildCab(sv.driver); arcade = false; const T0 = TESTS[i]; test = { i, id: T0.id, def: T0, v: 0, t: 0, arrow: false, objs: [] };
      money = 0; fares = 0; timeLeft = T0.time;
      const R = rng(i * 99 + 3);
      switch (T0.id) {
        case 'jump': placeCab(9.5 * CELL, 31.6 * CELL, Math.PI); test.target = [9.5 * CELL, 25 * CELL]; test.arrow = true; test.direct = 1; break;
        case 'drift': placeCab(3 * CELL, 33.5 * CELL, 0); placeCab(10.5 * CELL, 20 * CELL, Math.PI); break;
        case 'through': placeCab(13.5 * CELL, 19.5 * CELL, Math.PI / 2); for (const v of traffic) { placeCar(v, [car.x, car.z]); v.vmax = 12; } break;
        case 'pop': placeCab(4 * CELL, 40.5 * CELL, Math.PI / 2); for (let k = 0; k < 15; k++) { const b = addOrReuse('bal', (3 + k * 2.1 + R() * 1.5) * CELL, (40.2 + R() * 1.6) * CELL); } test.need = 15; test.pop = 0; break;
        case 'slalom': placeCab(2 * CELL, 39.5 * CELL, Math.PI / 2); test.gates = []; for (let k = 0; k < 10; k++) { const x = (4.5 + k * 3) * CELL, z = 39.5 * CELL + (k % 2 ? 4 : -4); test.gates.push({ x, z, ok: false, passed: false }); addOrReuse('cone', x, z - 3.2); addOrReuse('cone', x, z + 3.2); } test.target = [test.gates[0].x, test.gates[0].z]; test.arrow = true; break;
        case 'bowl': placeCab(17 * CELL, 40.8 * CELL, Math.PI / 2); { const bx = 30 * CELL, bz = 40.8 * CELL; let k = 0; for (let row = 0; row < 4; row++) for (let j = 0; j <= row; j++) { addOrReuse('skit', bx + row * 2.4, bz + (j - row / 2) * 2.6); k++; } } test.skit = 0; test.target = [30 * CELL, 40.8 * CELL]; test.arrow = true; break;
        case 'park': placeCab(14.5 * CELL, 34.5 * CELL, Math.PI / 2); test.boxes = [[15.2 * CELL, 36.2 * CELL], [16.8 * CELL, 35.4 * CELL], [14.4 * CELL, 37.4 * CELL]]; test.bi = 0; test.target = test.boxes[0]; test.arrow = true; boxMesh.visible = true; break;
        case 'dash': placeCab(14.5 * CELL, 26.5 * CELL, Math.PI / 2); test.target = [23.5 * CELL, 26.5 * CELL]; test.arrow = true; flagMesh.visible = true; flagMesh.position.set(test.target[0], 0, test.target[1]); break;
        case 'rush': placeCab(24.5 * CELL - 3, 31.5 * CELL, Math.PI / 2); for (let k = 0; k < 12; k++) spawnCust([car.x, car.z]); test.arrow = true; break;
        case 'leap': placeCab(27.5 * CELL, 19.5 * CELL, Math.PI / 2); test.target = [39 * CELL, 19.5 * CELL]; test.arrow = true; test.direct = 1; break;
      }
      mode = 'count'; countT = 3.2; endT = 0; results = null; paused = false;
      setTod(sv.opts.tod ? sv.opts.tod - 1 : autoTod()); music('b');
    }
    function addOrReuse(k, x, z) { const old = brk.find(b => b.k === k && b.gone); if (old) { old.gone = false; old.hit = false; old.x = old.x0 = x; old.z = old.z0 = z; old.y = old.y0 = ground(x, z) + 0.12; old.rx = old.rz = 0; old.vx = old.vy = old.vz = 0; setBrk(old); return old; } return addBrk(k, x, z); }
    // the parking box and the finish flag
    const boxMesh = new T.Mesh(T3.keep(new T.RingGeometry(2.6, 3.2, 4, 1)), keepM(new T.MeshBasicMaterial({ color: 0x3aff5a, side: T.DoubleSide, fog: false }))); boxMesh.rotation.x = -Math.PI / 2; boxMesh.visible = false; scene.add(boxMesh);
    const flagB = Geo(); boxB(flagB, -0.1, 0, -0.1, 0.1, 6, 0.1, [0.9, 0.9, 0.9]); boxB(flagB, -7, 5, -0.15, 7, 6.5, 0.15, [1, 0.85, 0.1]); boxB(flagB, 6.9, 0, -0.1, 7.1, 6, 0.1, [0.9, 0.9, 0.9]); boxB(flagB, -7.1, 0, -0.1, -6.9, 6, 0.1, [0.9, 0.9, 0.9]);
    const flagMesh = new T.Mesh(geoOf(flagB), cityMat); flagMesh.rotation.y = Math.PI / 2; flagMesh.visible = false; scene.add(flagMesh);
    function updTest(dt) {
      const t = test, sp = Math.hypot(car.vx, car.vz); t.t += dt;
      switch (t.id) {
        case 'jump': if (car.air && car.takeY > 10) t.flying = 1; if (t.landed) return finishTest(t.v); break;
        case 'pop': { if (t.pop >= t.need) return finishTest(t.t); let bd = 1e9; for (const b of brk) if (b.k === 'bal' && !b.gone) { const d = Math.hypot(b.x - car.x, b.z - car.z); if (d < bd) { bd = d; t.target = [b.x, b.z]; } } t.arrow = true; t.direct = 1; break; }
        case 'slalom': { const g = t.gates.find(q => !q.passed); if (!g) return finishTest(t.t + t.gates.filter(q => !q.ok).length * 3);
          if (car.x > g.x) { g.passed = true; g.ok = Math.abs(car.z - g.z) < 3.2; if (g.ok) { sfx.tone(1320, 0.08, 'square', 0.06); say('GATE!', '', 0.6, '#3aff5a'); } else { sfx.tone(200, 0.2, 'square', 0.06); say('MISSED!', '+3 SECONDS', 1, '#ff4a3a'); } const n = t.gates.find(q => !q.passed); t.target = n ? [n.x, n.z] : null; } break; }
        case 'bowl': if (t.t > 10 || (t.skit >= 10 && t.t > 2)) return finishTest(t.skit); break;
        case 'park': { const b = t.boxes[t.bi]; boxMesh.position.set(b[0], ground(b[0], b[1]) + 0.25, b[1]); boxMesh.rotation.z = Math.PI / 4; if (Math.hypot(car.x - b[0], car.z - b[1]) < 1.6 && sp < 0.8) { t.bi++; sfx.seq([[76, 0.25], [84, 0.5]], { bpm: 400, vol: 0.09 }); say('PARKED!', '', 0.8, '#3aff5a'); if (t.bi >= 3) { boxMesh.visible = false; return finishTest(t.t); } t.target = t.boxes[t.bi]; } break; }
        case 'dash': if (car.x > t.target[0]) { flagMesh.visible = false; return finishTest(t.t); } break;
        case 'rush': if (t.v >= 3) return finishTest(t.t); if (t.fail) { t.fail = 0; } break;
        case 'leap': if (t.done) return finishTest(t.t); break;
      }
      if (t.t >= t.def.time) finishTest(t.def.hi ? t.v : 999);
    }
    function finishTest(v) {
      const t = test, D0 = t.def; let med = 0;
      if (D0.hi) { for (let k = 0; k < 3; k++) if (v >= D0.med[k]) med = k + 1; } else { for (let k = 0; k < 3; k++) if (v <= D0.med[k]) med = k + 1; }
      if (D0.id === 'leap' && !t.done) med = 0;
      const prev = sv.medals[D0.id] | 0; if (med > prev) sv.medals[D0.id] = med;
      const pb = sv.best[D0.id]; if (v < 999 && (pb == null || (D0.hi ? v > pb : v < pb))) sv.best[D0.id] = Math.round(v * 10) / 10;
      save(); if (goldCount() >= TESTS.length) K.secret('rm.taxi.licence');
      results = { test: 1, v, med, t: D0, prev }; mode = 'tres'; endT = 0; K.music(null);
      sfx.seq(med >= 3 ? [[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]] : med ? [[72, 0.5], [76, 0.5], [79, 1]] : [[64, 0.5], [60, 1]], { bpm: 220, vol: 0.09 });
      boxMesh.visible = flagMesh.visible = false;
    }
    function endShift() {
      mode = 'over'; endT = 0; K.music(null); sfx.seq([[64, 0.5], [60, 0.5], [55, 1.5]], { bpm: 160, vol: 0.1 }); say('TIME UP!', 'THE SHIFT IS OVER', 3, '#ff4a3a');
      if (fare) { fare = null; beacon.visible = false; }
      const total = money + tips; let rank = RANKS[0][1]; for (const [m, n] of RANKS) if (total >= m) rank = n;
      results = { money, tips, total, fares, crazyCount, bestCombo, rank, pb: total > (sv.money | 0) };
      sv.shifts = (sv.shifts | 0) + 1; if (total > (sv.money | 0)) sv.money = total; if (total >= 300) sv.unlock.nan = 1;
      const me = (window.Net && Net.me && Net.me.nick ? String(Net.me.nick) : 'YOU').toUpperCase().slice(0, 10);
      sv.hi.push([me, total]); sv.hi.sort((a, b) => b[1] - a[1]); sv.hi = sv.hi.slice(0, 10); results.place = sv.hi.findIndex(h => h[0] === me && h[1] === total) + 1;
      save();
    }

    // ---------------------------------------------------------------- menus
    const MAIN = ['ARCADE', 'WORK SHIFT', 'CRAZY BOX', 'RECORDS', 'OPTIONS', 'HOW TO PLAY'];
    const WORK = ['3 MINUTES', '5 MINUTES', '10 MINUTES'];
    let pending = null, drvSel = 0, boxSel = 0, optSel = 0, workSel = 0;
    const blip = () => sfx.tone(880, 0.04, 'square', 0.05), ok = () => { sfx.tone(1320, 0.07, 'square', 0.06); sfx.tone(1760, 0.08, 'square', 0.05, 0.06); };
    const upP = () => K.pressed('up'), dnP = () => K.pressed('down'), lfP = () => K.pressed('left'), rtP = () => K.pressed('right'), goP = () => K.pressed('a') || K.pressed('start'), backP = () => K.pressed('b');
    function menus(dt) {
      if (mode === 'boot') { bootT += dt; if (bootT > 1.6) { mode = 'title'; } return; }
      if (mode === 'title') { for (const b of ['l', 'r']) if (K.pressed(b)) { code.push(b); code = code.slice(-4); if (code.join('') === 'lrlr') { sv.opts.expert = sv.opts.expert ? 0 : 1; save(); say(sv.opts.expert ? 'EXPERT MODE ON' : 'EXPERT MODE OFF', 'NO ARROW, NO BEACON', 2.5, '#ff3a8a'); sfx.seq([[72, 0.25], [79, 0.25], [84, 0.5]], { bpm: 300, vol: 0.09 }); } }
        idle += dt; if (!K.pressed('l') && !K.pressed('r') && (K.any() || goP())) { mode = 'menu'; menu = 0; idle = 0; ok(); music('menu'); } else if (idle > 14) startDemo(); return; }
      if (mode === 'menu') {
        if (upP()) { menu = (menu + MAIN.length - 1) % MAIN.length; blip(); } if (dnP()) { menu = (menu + 1) % MAIN.length; blip(); }
        if (backP()) { mode = 'title'; idle = 0; K.music(null); return; }
        if (menu === 1 && (lfP() || rtP())) { workSel = (workSel + (rtP() ? 1 : 2)) % 3; blip(); }
        if (goP()) { ok(); if (menu === 0) { pending = 'arcade'; mode = 'drivers'; drvSel = sv.driver | 0; } else if (menu === 1) { pending = ['w3', 'w5', 'w10'][workSel]; mode = 'drivers'; drvSel = sv.driver | 0; } else if (menu === 2) { mode = 'box'; } else if (menu === 3) mode = 'records'; else if (menu === 4) { mode = 'options'; optSel = 0; } else mode = 'how'; }
        return;
      }
      if (mode === 'drivers') {
        if (lfP()) { drvSel = (drvSel + 3) % 4; blip(); } if (rtP()) { drvSel = (drvSel + 1) % 4; blip(); }
        if (backP()) { mode = 'menu'; return; }
        if (goP()) { const D = DRIVERS[drvSel]; if (!unlocked(D)) { sfx.tone(200, 0.2, 'square', 0.06); return; } sv.driver = drvSel; save(); ok(); if (typeof pending === 'number') startTest(pending); else startShift(pending); }
        return;
      }
      if (mode === 'box') {
        if (upP()) { boxSel = (boxSel + TESTS.length - 1) % TESTS.length; blip(); } if (dnP()) { boxSel = (boxSel + 1) % TESTS.length; blip(); }
        if (lfP()) { boxSel = (boxSel + TESTS.length - 5) % TESTS.length; blip(); } if (rtP()) { boxSel = (boxSel + 5) % TESTS.length; blip(); }
        if (backP()) { mode = 'menu'; return; }
        if (goP()) { ok(); pending = boxSel; mode = 'drivers'; drvSel = sv.driver | 0; }
        return;
      }
      if (mode === 'options') {
        const n = 5 + (goldCount() >= TESTS.length ? 1 : 0);
        if (upP()) { optSel = (optSel + n - 1) % n; blip(); } if (dnP()) { optSel = (optSel + 1) % n; blip(); }
        const ch = lfP() ? -1 : rtP() || goP() ? 1 : 0;
        if (ch) { blip(); const o = sv.opts;
          if (optSel === 0) { o.tod = (o.tod + 4 + ch) % 4; setTod(o.tod ? o.tod - 1 : autoTod()); } else if (optSel === 1) { o.music = o.music ? 0 : 1; music('menu'); } else if (optSel === 2) o.arrow = o.arrow ? 0 : 1; else if (optSel === 3) o.cam = o.cam ? 0 : 1; else if (optSel === 4 && goP()) { mode = 'menu'; } else if (optSel === 5) o.gold = o.gold ? 0 : 1;
          save(); }
        if (backP()) { mode = 'menu'; }
        return;
      }
      if (mode === 'records' || mode === 'how') { if (goP() || backP()) { mode = 'menu'; blip(); } return; }
    }
    function startDemo() { demo = true; resetWorld(); buildCab(0); placeCab(24.5 * CELL - 3, 31.5 * CELL, Math.PI / 2); for (let i = 0; i < 12; i++) spawnCust([car.x, car.z]); mode = 'play'; arcade = true; timeLeft = 30; money = 0; attractT = 0; setTod(autoTod()); }
    function stopDemo() { demo = false; resetWorld(); mode = 'title'; idle = 0; flyT = Math.random() * FLY.length; }

    // ---------------------------------------------------------------- the autopilot (the attract demo, and the tests)
    function autopilot() {
      const sp = Math.hypot(car.vx, car.vz);
      const fin = fare ? [fare.dest.dx, fare.dest.dz] : test && test.target ? test.target : (() => { const cu = nearestCust(); return cu ? [cu.x, cu.z] : [car.x, car.z]; })();
      const rc = routeFrom(car.x, car.z, cellOf(fin[0]), cellOf(fin[1]), 3);
      let tgt = fin; const dfin = Math.hypot(fin[0] - car.x, fin[1] - car.z);
      if (dfin > 30 && rc.length > 1 && !(test && test.direct)) { const a = rc[1]; tgt = [(a[0] + 0.5) * CELL, (a[1] + 0.5) * CELL]; }
      const want = Math.atan2(tgt[0] - car.x, tgt[1] - car.z), df = wrapA(want - car.h);
      let steer = -clamp(df * 2.2, -1, 1), thr = dfin > 5 && (Math.abs(df) < 0.8 || sp < 8) ? 1 : 0, brk = (dfin < 10 && sp > 3.5) || (Math.abs(df) > 1 && sp > 13) ? 1 : 0;
      car.stuckA = thr && sp < 1.5 ? (car.stuckA || 0) + 1 / 60 : 0; if (car.stuckA > 1) car.rev = 0.9;
      if (car.rev > 0) { car.rev -= 1 / 60; thr = 0; brk = 1; steer = -steer; }
      if (test && (test.id === 'leap' || test.id === 'jump' || test.id === 'dash')) { thr = 1; brk = 0; }
      return { thr, brk, steer, hb: false };
    }

    // ---------------------------------------------------------------- the main update
    for (let i = 0; i < 26; i++) spawnCar(i);
    buildCab(sv.driver | 0); placeCab(24.5 * CELL - 3, 31.5 * CELL, Math.PI / 2);
    setTod(sv.opts.tod ? sv.opts.tod - 1 : autoTod());
    flyT = Math.random() * FLY.length;
    function update(dt) {
      if (shake > 0) shake = Math.max(0, shake - dt * 2);
      if (splashT > 0) { splashT -= dt; if (splashT <= 0) toSafety(); }
      seaTex.offset.x = (seaTex.offset.x + dt * 0.004) % 1; seaTex.offset.y = (seaTex.offset.y + dt * 0.002) % 1;
      for (const m of msgs) m.t -= dt; msgs = msgs.filter(m => m.t > 0);
      if (speech) { speech.t -= dt; if (speech.t <= 0) speech = null; }
      if (mode === 'view') { updPeds(dt); return; }
      if (mode !== 'play' && mode !== 'count' && mode !== 'over' && mode !== 'tres') { menus(dt); updTraffic(dt); updPeds(dt); camera(dt); return; }
      if (demo) { attractT += dt; if (K.any() || K.pressed('start') || attractT > 40) { stopDemo(); return; } }
      if (mode === 'play' && K.pressed('start') && !demo) { paused = !paused; pmenu = 0; sfx.tone(paused ? 440 : 880, 0.06); if (paused) K.music(null); else music(test ? 'b' : arcade ? 'a' : 'b'); }
      if (paused) {
        if (upP()) { pmenu = (pmenu + 2) % 3; blip(); } if (dnP()) { pmenu = (pmenu + 1) % 3; blip(); }
        if (K.pressed('a')) { ok(); if (pmenu === 0) { paused = false; music(test ? 'b' : arcade ? 'a' : 'b'); } else if (pmenu === 1) { paused = false; if (test) startTest(test.i); else startShift(arcade ? 'arcade' : shiftLen === 180 ? 'w3' : shiftLen === 300 ? 'w5' : 'w10'); } else { paused = false; resetWorld(); mode = 'menu'; music('menu'); } }
        if (K.pressed('b')) { paused = false; music(test ? 'b' : arcade ? 'a' : 'b'); }
        return;
      }
      if (mode === 'count') { countT -= dt; const n = Math.ceil(countT); if (n !== Math.ceil(countT + dt) && n > 0 && n <= 3) sfx.tone(660, 0.12, 'square', 0.07); if (countT <= 0) { mode = 'play'; sfx.tone(1320, 0.3, 'square', 0.08); if (test) say(test.def.n, 'GO!', 1.5, '#3aff5a'); else say('GO!', 'PICK SOMEONE UP!', 2, '#3aff5a'); } }
      const inp = mode === 'play' ? (demo || window.__rmAuto ? autopilot() : inputs()) : { thr: 0, brk: 0, steer: 0, hb: false, hold: 1 };
      const fv = drive(dt, inp);
      updTraffic(dt); trafficVsCab(dt); updPeds(dt); updCusts(dt); updBrk(dt); updParts(dt);
      // the engine (a rough little four-cylinder)
      eng -= dt; if (eng <= 0) { eng = 0.07; sfx.tone(55 + Math.abs(fv) * 4.2 + (inp.thr ? 12 : 0), 0.09, 'sawtooth', 0.018 + (inp.thr ? 0.01 : 0)); }
      if (mode === 'play') {
        if (!test || test.id === 'rush') fares_(dt);
        if (test) updTest(dt);
        else if (!demo) { timeLeft -= dt; if (timeLeft < 10 && Math.ceil(timeLeft) !== Math.ceil(timeLeft + dt)) sfx.tone(1000, 0.05, 'square', 0.06); if (timeLeft <= 0) { timeLeft = 0; endShift(); } }
        // which part of town are we in?
        const c = cellOf(car.x), r = cellOf(car.z); let dn = ''; for (const [n, c0, r0, c1, r1] of DISTRICTS) if (c >= c0 && c <= c1 && r >= r0 && r <= r1) { dn = n; break; }
        if (dn && dn !== district) { district = dn; distT = 2.5; }
        if (distT > 0) distT -= dt;
      }
      if (mode === 'over' || mode === 'tres') { endT += dt; if (endT > 2.5 && goP()) { if (mode === 'over' && !overSent) { overSent = true; const sc = Math.min(50000, (results.total | 0) * 10, Math.floor((K.t + 4) * 190)); K.over(sc, { title: 'SHIFT OVER: ' + results.rank, text: `${results.fares} FARES  TAKINGS £${results.total}  BEST COMBO X${results.bestCombo}` }); } else if (mode === 'tres') { mode = 'box'; resetWorld(); music('menu'); } } }
      updArrow(dt); camera(dt);
    }

    // ---------------------------------------------------------------- the HUD
    function ol(H, s, x, y, col, k, center) { // pixel text with a fat black outline
      const fn = center ? F.center : F.draw; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) fn(H, s, x + dx * Math.max(1, k / 2), y + dy * Math.max(1, k / 2), '#000', k); fn(H, s, x, y + k * 0.6, 'rgba(0,0,0,.5)', k); fn(H, s, x, y, col, k);
    }
    function panel(H, x, y, w, h, col) { H.fillStyle = 'rgba(8,10,24,.72)'; H.fillRect(x, y, w, h); H.fillStyle = col || '#ffd21a'; H.fillRect(x, y, w, 3); H.fillRect(x, y + h - 2, w, 2); }
    function hud() {
      const H = HUD; H.clearRect(0, 0, W, HH);
      if (mode === 'view') return;
      if (mode === 'boot') { H.fillStyle = '#000'; H.fillRect(0, 0, W, HH); ol(H, 'NOW LOADING', W / 2 + 20, HH - 70, '#fff', 3, 1); const a = K.t * 6; for (let i = 0; i < 8; i++) { H.fillStyle = `rgba(255,${120 + i * 15},0,${(i + 1) / 8})`; H.beginPath(); H.arc(W / 2 - 150 + Math.cos(a - i * 0.4) * 14, HH - 60 + Math.sin(a - i * 0.4) * 14, 4, 0, 7); H.fill(); } return; }
      if (mode === 'title' || mode === 'menu' || mode === 'drivers' || mode === 'box' || mode === 'records' || mode === 'options' || mode === 'how') return menuHud(H);
      if (demo) { ol(H, 'DEMO', W / 2, 60, (K.frame >> 4) & 1 ? '#fff' : '#ffd21a', 4, 1); ol(H, 'PRESS START', W / 2, HH - 40, '#fff', 2, 1); }
      // top: the clock (or the test timer), the money
      if (test) { ol(H, test.def.n, W / 2, 8, '#3ac8ff', 2, 1); const tl = Math.max(0, test.def.time - test.t); ol(H, (test.def.hi ? Math.ceil(tl) : (Math.floor(test.t * 10) / 10).toFixed(1)).toString(), W / 2, 28, tl < 5 ? '#ff4a3a' : '#fff', 5, 1); testHud(H); }
      else if (!demo) { const tc = timeLeft < 10 ? ((K.frame >> 3) & 1 ? '#ff3a3a' : '#fff') : '#fff'; ol(H, 'TIME', W / 2, 8, '#ffd21a', 2, 1); ol(H, String(Math.ceil(timeLeft)), W / 2, 26, tc, 6, 1); }
      if (!test) { ol(H, '£' + (money + tips), 16, 14, '#3aff5a', 4); ol(H, fares + ' FARE' + (fares === 1 ? '' : 'S'), 16, 50, '#fff', 2); }
      if (combo > 1 && K.t - comboT < 2.6) { ol(H, 'COMBO X' + combo, 16, 72, '#ff3a8a', 2); H.fillStyle = '#ff3a8a'; H.fillRect(16, 92, 110 * (1 - (K.t - comboT) / 2.6), 4); }
      // the fare card
      if (fare) {
        const x = W - 250, y = 10, fr = clamp(fare.left / fare.par, 0, 1), d = Math.round(Math.hypot(fare.dest.dx - car.x, fare.dest.dz - car.z));
        panel(H, x, y, 240, 86, fr > 0.5 ? '#3aff5a' : fr > 0.25 ? '#ffd21a' : '#ff4a3a');
        F.draw(H, fare.F.n, x + 10, y + 10, '#9ad8ff', 1); F.draw(H, 'TO:', x + 10, y + 24, '#fff', 2); F.draw(H, fare.dest.name, x + 52, y + 24, '#ffd21a', 2);
        F.draw(H, d + 'M', x + 10, y + 46, '#fff', 2);
        // a little compass arrow, relative to where you're facing
        const rel = Math.atan2(fare.dest.dx - car.x, fare.dest.dz - car.z) - camYaw; H.save(); H.translate(x + 120, y + 52); H.rotate(-rel + Math.PI); H.fillStyle = '#3aff5a'; H.strokeStyle = '#000'; H.lineWidth = 2; H.beginPath(); H.moveTo(0, 9); H.lineTo(7, -3); H.lineTo(2.5, -3); H.lineTo(2.5, -9); H.lineTo(-2.5, -9); H.lineTo(-2.5, -3); H.lineTo(-7, -3); H.closePath(); H.stroke(); H.fill(); H.restore();
        ol(H, String(Math.ceil(fare.left)), x + 200, y + 42, fr > 0.25 ? '#fff' : '#ff4a3a', 3, 1);
        H.fillStyle = '#222'; H.fillRect(x + 10, y + 70, 220, 8); H.fillStyle = fr > 0.5 ? '#3aff5a' : fr > 0.25 ? '#ffd21a' : '#ff3a3a'; H.fillRect(x + 10, y + 70, 220 * fr, 8);
        if (d < 45) ol(H, Math.hypot(car.vx, car.vz) < 5 ? 'DROP OFF!' : 'STOP IN THE GREEN!', W / 2, HH / 2 + 70, (K.frame >> 3) & 1 ? '#3aff5a' : '#fff', 3, 1);
      } else if (!test && mode === 'play' && !demo) { panel(H, W - 250, 10, 240, 34); F.draw(H, 'FIND A FARE!', W - 240, 22, '#ffd21a', 2); }
      // speech, messages, the district
      if (speech) { const w = Math.min(W - 340, F.width(speech.text, 2) + 24), sy = HH - 66; const two = F.width(speech.text, 2) + 24 > W - 340; panel(H, (W - (two ? W - 340 : w)) / 2, sy - (two ? 18 : 0), two ? W - 340 : w, two ? 62 : 44, '#9ad8ff'); F.center(H, speech.who, W / 2, sy + 6 - (two ? 18 : 0), '#9ad8ff', 1); if (two) { const words = speech.text.split(' '), half = Math.ceil(words.length / 2); F.center(H, words.slice(0, half).join(' '), W / 2, sy, '#fff', 2); F.center(H, words.slice(half).join(' '), W / 2, sy + 20, '#fff', 2); } else F.center(H, speech.text, W / 2, sy + 22, '#fff', 2); }
      msgs.forEach((m, i) => { const k = Math.min(1, (m.t0 - m.t) * 8), sc = m.t0 - m.t < 0.15 ? 5 : 4; ol(H, m.a, W / 2, 112 + i * 52 - (1 - k) * 20, m.col, sc, 1); if (m.b) ol(H, m.b, W / 2, 112 + i * 52 + 32, '#fff', 2, 1); });
      if (distT > 0 && mode === 'play') { const a = Math.min(1, distT); H.globalAlpha = a; ol(H, district, W / 2, 84, '#9ad8ff', 2, 1); H.globalAlpha = 1; }
      // the minimap and the speedo
      minimap(H);
      const sp = Math.hypot(car.vx, car.vz) * 2.237, sx = W - 76, sy = HH - 70;
      H.fillStyle = 'rgba(8,10,24,.7)'; H.beginPath(); H.arc(sx, sy, 56, Math.PI * 0.8, Math.PI * 2.2); H.lineTo(sx, sy); H.fill();
      for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.8 + i / 10 * Math.PI * 1.4; H.strokeStyle = i >= 8 ? '#ff4a3a' : '#fff'; H.lineWidth = 2; H.beginPath(); H.moveTo(sx + Math.cos(a) * 46, sy + Math.sin(a) * 46); H.lineTo(sx + Math.cos(a) * 54, sy + Math.sin(a) * 54); H.stroke(); }
      const na = Math.PI * 0.8 + clamp(sp / 100, 0, 1) * Math.PI * 1.4; H.strokeStyle = car.dash > 0 ? '#3affd0' : '#ff3a3a'; H.lineWidth = 3; H.beginPath(); H.moveTo(sx, sy); H.lineTo(sx + Math.cos(na) * 44, sy + Math.sin(na) * 44); H.stroke();
      ol(H, String(Math.round(sp)), sx, sy + 8, '#fff', 3, 1); F.center(H, 'MPH', sx, sy + 34, '#ffd21a', 1);
      if (mode === 'count') { const n = Math.ceil(countT); ol(H, n > 0 ? String(n) : 'GO!', W / 2, HH / 2 - 40, n > 0 ? '#ffd21a' : '#3aff5a', 10, 1); if (test) { panel(H, W / 2 - 220, HH / 2 + 50, 440, 90, '#3ac8ff'); test.def.how.forEach((l, i) => F.center(H, l, W / 2, HH / 2 + 64 + i * 24, '#fff', 2)); } else ol(H, sv.opts.tod ? TODS[sv.opts.tod - 1].n + ' SHIFT' : '', W / 2, HH / 2 + 60, '#fff', 2, 1); }
      if (paused) { H.fillStyle = 'rgba(0,0,20,.6)'; H.fillRect(0, 0, W, HH); ol(H, 'PAUSED', W / 2, 120, '#ffd21a', 6, 1); ['RESUME', 'RESTART', 'QUIT TO MENU'].forEach((s, i) => ol(H, (i === pmenu ? '> ' : '') + s + (i === pmenu ? ' <' : ''), W / 2, 220 + i * 40, i === pmenu ? '#ffd21a' : '#fff', 3, 1)); F.center(H, 'UP/DOWN TO CHOOSE, ' + K.label('a') + ' TO PICK', W / 2, 360, '#9ad8ff', 2); }
      if ((mode === 'over' || mode === 'tres') && results) resultsHud(H);
      if (splashT > 0) { H.fillStyle = `rgba(120,180,255,${clamp(splashT - 0.6, 0, 0.6)})`; H.fillRect(0, 0, W, HH); }
      vmu(H);
    }
    function vmu(H) { if (vmuT <= 0) return; vmuT -= 1 / 60; const x = W - 210, y = HH - 150; panel(H, x, y, 196, 40, '#3ac8ff'); H.fillStyle = '#e8e8e0'; H.fillRect(x + 8, y + 8, 18, 26); H.fillStyle = '#4a7a6a'; H.fillRect(x + 11, y + 11, 12, 9); H.fillStyle = (K.frame >> 3) & 1 ? '#ff3a3a' : '#5a1010'; H.fillRect(x + 14, y + 25, 3, 3); F.draw(H, 'SAVING TO VMG...', x + 34, y + 10, '#fff', 1); F.draw(H, 'DO NOT REMOVE THE VMG', x + 34, y + 24, '#9ad8ff', 1); }
    function testHud(H) {
      const t = test, D0 = t.def; let line = '';
      if (D0.id === 'jump') line = t.v ? 'BEST ' + Math.round(t.v) + 'M' : 'UP THE RAMP AND OFF THE TOP!';
      else if (D0.id === 'drift') line = 'DRIFT ' + t.v.toFixed(1) + 'S';
      else if (D0.id === 'through') line = 'NEAR MISSES ' + t.v;
      else if (D0.id === 'pop') line = 'POPPED ' + (t.pop | 0) + '/15';
      else if (D0.id === 'slalom') line = 'GATES ' + t.gates.filter(g => g.passed).length + '/10';
      else if (D0.id === 'bowl') line = 'SKITTLES ' + (t.skit | 0) + '/10';
      else if (D0.id === 'park') line = 'BOXES ' + t.bi + '/3';
      else if (D0.id === 'rush') line = 'FARES ' + t.v + '/3';
      else if (D0.id === 'dash') line = 'BRAKE, THEN GO = CRAZY DASH';
      else if (D0.id === 'leap') line = 'FULL SPEED AT THE RAMP!';
      panel(H, 10, 10, 200, 52, '#3ac8ff'); if (line.length <= 15) F.draw(H, line, 20, 20, '#fff', 2); else { const w = line.split(' '); let a = ''; while (w.length && (a + ' ' + w[0]).trim().length <= 28) a = (a + ' ' + w.shift()).trim(); F.draw(H, a, 20, 20, '#fff', 1); F.draw(H, w.join(' '), 20, 32, '#fff', 1); }
      F.draw(H, 'G ' + D0.med[2] + D0.unit + ' S ' + D0.med[1] + D0.unit + ' B ' + D0.med[0] + D0.unit, 20, 48, '#ffd21a', 1);
    }
    function resultsHud(H) {
      const k = clamp(endT / 0.6, 0, 1), R = results; H.fillStyle = `rgba(0,0,20,${0.65 * k})`; H.fillRect(0, 0, W, HH);
      if (k < 1) return;
      if (R.test) {
        ol(H, R.t.n, W / 2, 70, '#3ac8ff', 4, 1);
        ol(H, (R.t.id === 'leap' && !R.med) ? 'SPLASH...' : (R.v >= 999 ? 'NOT DONE' : (R.t.unit === 'S' ? R.v.toFixed(1) : Math.round(R.v)) + R.t.unit), W / 2, 130, '#fff', 6, 1);
        const mc = ['#888', '#e08a4a', '#d8d8e8', '#ffd21a'][R.med], mn = ['NO MEDAL', 'BRONZE', 'SILVER', 'GOLD'][R.med];
        H.fillStyle = mc; H.beginPath(); H.arc(W / 2, 250, 40, 0, 7); H.fill(); H.strokeStyle = '#000'; H.lineWidth = 3; H.stroke(); F.center(H, ['-', 'B', 'S', 'G'][R.med], W / 2, 236, '#000', 4);
        ol(H, mn + '!', W / 2, 304, mc, 4, 1); if (R.med > R.prev) ol(H, 'NEW MEDAL!', W / 2, 350, '#3aff5a', 2, 1);
        ol(H, 'MEDALS ' + medalCount() + '/' + TESTS.length + '   GOLDS ' + goldCount(), W / 2, 386, '#9ad8ff', 2, 1);
        if (endT > 2.5 && (K.frame >> 4) & 1) ol(H, 'PRESS ' + K.label('a'), W / 2, 430, '#fff', 2, 1);
        return;
      }
      ol(H, 'SHIFT OVER!', W / 2, 40, '#ffd21a', 5, 1);
      const rows = [['FARES', String(R.fares)], ['FARES TAKEN', '£' + R.money], ['CRAZY TIPS', '£' + R.tips], ['CRAZY STUNTS', String(R.crazyCount)], ['BEST COMBO', 'X' + R.bestCombo]];
      rows.forEach(([a, b], i) => { if (endT > 0.8 + i * 0.25) { F.draw(H, a, W / 2 - 200, 110 + i * 28, '#9ad8ff', 2); F.draw(H, b, W / 2 + 200 - F.width(b, 2), 110 + i * 28, '#fff', 2); } });
      if (endT > 2.2) { ol(H, 'TOTAL £' + R.total, W / 2, 260, '#3aff5a', 4, 1); ol(H, 'RATING: ' + R.rank, W / 2, 304, '#ff3a8a', 3, 1); if (R.pb) ol(H, 'NEW BEST TAKINGS!', W / 2, 340, '#ffd21a', 2, 1); if (R.place) ol(H, 'YOU\'RE #' + R.place + ' ON THE CABBIES\' TABLE', W / 2, 366, '#fff', 2, 1); if (sv.unlock.nan && !sv.nanSeen) { sv.nanSeen = 1; save(); say('NAN UNLOCKED!', 'A NEW DRIVER', 3, '#7ab8e8'); } }
      if (endT > 2.5 && (K.frame >> 4) & 1) ol(H, 'PRESS ' + K.label('a'), W / 2, 420, '#fff', 2, 1);
    }
    function logo(H, y, s) {
      for (let x = 0; x < W; x += 16) { H.fillStyle = (x / 16) % 2 ? '#111' : '#ffd21a'; H.fillRect(x, y - 30, 16, 8); H.fillRect(x + 8, y - 22, 16, 8); H.fillRect(x, y + 100 * s, 16, 8); H.fillRect(x + 8, y + 108 * s, 16, 8); }
      H.save(); H.translate(W / 2, y); H.rotate(-0.05); H.font = `italic 900 ${Math.round(64 * s)}px Arial Black,Arial,sans-serif`; H.textAlign = 'center'; H.textBaseline = 'top';
      for (let i = 8; i > 0; i--) { H.fillStyle = i > 1 ? '#7a1a0a' : '#000'; H.fillText('MAD MINICAB', i, i + 4); }
      const gr = H.createLinearGradient(0, 0, 0, 64 * s); gr.addColorStop(0, '#fff8a0'); gr.addColorStop(0.45, '#ffd21a'); gr.addColorStop(0.55, '#f0a000'); gr.addColorStop(1, '#ffe060'); H.fillStyle = gr; H.fillText('MAD MINICAB', 0, 4);
      H.lineWidth = 2; H.strokeStyle = '#000'; H.strokeText('MAD MINICAB', 0, 4); H.restore();
      ol(H, 'SUNNYMOUTH', W / 2 + 140, y + 74 * s, '#3ac8ff', 2, 1);
    }
    function menuHud(H) {
      H.fillStyle = 'rgba(0,0,0,.18)'; H.fillRect(0, 0, W, HH); vmu(H);
      if (msgs.length) { const m = msgs[msgs.length - 1]; ol(H, m.a, W / 2, 252, m.col, 3, 1); if (m.b) ol(H, m.b, W / 2, 282, '#fff', 2, 1); }
      if (mode === 'title') {
        logo(H, 70, 1);
        if ((K.frame >> 5) & 1) ol(H, 'PRESS START', W / 2, 300, '#fff', 4, 1);
        ol(H, 'BEST TAKINGS £' + (sv.money | 0) + '   HI-SCORE ' + K.best, W / 2, 372, '#9ad8ff', 2, 1);
        // the cabbies' table, a line at a time
        const i = Math.floor(K.t / 2.5) % Math.min(5, sv.hi.length), h = sv.hi[i]; ol(H, (i + 1) + '. ' + h[0] + '  £' + h[1], W / 2, 400, '#ffd21a', 2, 1);
        F.center(H, '(C) 1999 HI-OCTANE ENTERTAINMENT', W / 2, 452, '#ddd', 1, '#000');
        return;
      }
      logo(H, 40, 0.6);
      if (mode === 'menu') {
        MAIN.forEach((s, i) => { const sel = i === menu, t = s + (i === 1 ? ': ' + WORK[workSel] : ''); if (sel) { H.fillStyle = 'rgba(255,210,26,.25)'; H.fillRect(W / 2 - 200, 152 + i * 42, 400, 34); } ol(H, (sel ? '> ' : '') + t + (sel ? ' <' : ''), W / 2, 160 + i * 42, sel ? '#ffd21a' : '#fff', 3, 1); });
        const tip = ['FARES BUY YOU MORE TIME. HOW LONG CAN YOU LAST?', 'A FIXED SHIFT. MAKE AS MUCH AS YOU CAN. LEFT/RIGHT: LENGTH', 'TEN LICENCE TESTS. WIN ALL THE GOLD MEDALS!', 'THE CABBIES\' TABLE, MEDALS AND BESTS', 'TIME OF DAY, MUSIC, ARROW, CAMERA', 'HOW TO DRIVE A MINICAB (BADLY)'][menu];
        panel(H, 20, 420, W - 40, 36, '#3ac8ff'); F.center(H, tip, W / 2, 434, '#fff', 1);
        return;
      }
      if (mode === 'drivers') {
        ol(H, 'PICK YOUR DRIVER', W / 2, 110, '#fff', 3, 1);
        DRIVERS.forEach((D, i) => { const x = 40 + i * 145, sel = i === drvSel, lk = !unlocked(D); panel(H, x, 150, 130, 170, sel ? '#ffd21a' : '#555');
          H.fillStyle = '#' + D.col.toString(16).padStart(6, '0'); H.fillRect(x + 20, 172, 90, 40); H.fillStyle = 'rgba(0,0,0,.4)'; H.fillRect(x + 40, 162, 50, 14); H.fillStyle = '#222'; H.beginPath(); H.arc(x + 38, 214, 9, 0, 7); H.arc(x + 92, 214, 9, 0, 7); H.fill();
          ol(H, lk ? '?????' : D.n, x + 65, 236, sel ? '#ffd21a' : '#fff', 2, 1);
          [['SPEED', D.top / 38], ['GO', D.acc / 25], ['GRIP', D.grip / 13]].forEach(([n, v], j) => { F.draw(H, n, x + 10, 262 + j * 16, '#9ad8ff', 1); H.fillStyle = '#333'; H.fillRect(x + 54, 262 + j * 16, 66, 7); H.fillStyle = '#3aff5a'; H.fillRect(x + 54, 262 + j * 16, 66 * v, 7); });
          if (lk) { H.fillStyle = 'rgba(0,0,0,.7)'; H.fillRect(x, 150, 130, 170); F.center(H, 'LOCKED', x + 65, 214, '#ff4a3a', 2); F.center(H, 'EARN £300 IN A SHIFT', x + 65, 240, '#fff', 1); F.center(H, 'OR WIN 5 MEDALS', x + 65, 252, '#fff', 1); } });
        const D = DRIVERS[drvSel]; if (unlocked(D)) D.blurb.forEach((l, i) => F.center(H, l, W / 2, 340 + i * 20, '#fff', 2));
        F.center(H, 'LEFT/RIGHT TO CHOOSE   ' + K.label('a') + ' TO DRIVE   ' + K.label('b') + ' BACK', W / 2, 420, '#9ad8ff', 1);
        return;
      }
      if (mode === 'box') {
        ol(H, 'THE CRAZY BOX', W / 2, 104, '#3ac8ff', 3, 1);
        TESTS.forEach((t0, i) => { const col = i < 5 ? 0 : 1, row = i % 5, x = 40 + col * 290, y = 140 + row * 52, sel = i === boxSel, m = sv.medals[t0.id] | 0;
          panel(H, x, y, 270, 44, sel ? '#ffd21a' : '#444'); F.draw(H, (i + 1) + '. ' + t0.n, x + 12, y + 10, sel ? '#ffd21a' : '#fff', 2);
          F.draw(H, sv.best[t0.id] != null ? 'BEST ' + sv.best[t0.id] + t0.unit : 'NOT TRIED', x + 12, y + 30, '#9ad8ff', 1);
          H.fillStyle = ['#333', '#e08a4a', '#d8d8e8', '#ffd21a'][m]; H.beginPath(); H.arc(x + 246, y + 22, 13, 0, 7); H.fill(); H.strokeStyle = '#000'; H.lineWidth = 2; H.stroke(); });
        const t0 = TESTS[boxSel]; panel(H, 40, 404, W - 80, 56, '#3ac8ff'); F.center(H, t0.how.join(' '), W / 2, 414, '#fff', 1); F.center(H, 'GOLD ' + t0.med[2] + t0.unit + '   SILVER ' + t0.med[1] + t0.unit + '   BRONZE ' + t0.med[0] + t0.unit + '      ' + K.label('a') + ' TO TRY IT', W / 2, 436, '#ffd21a', 1);
        return;
      }
      if (mode === 'records') {
        ol(H, 'THE CABBIES\' TABLE', W / 2, 104, '#ffd21a', 3, 1);
        sv.hi.forEach((h, i) => { F.draw(H, (i + 1 + '.').padEnd(4) + h[0], W / 2 - 180, 140 + i * 22, i < 3 ? '#ffd21a' : '#fff', 2); F.draw(H, '£' + h[1], W / 2 + 180 - F.width('£' + h[1], 2), 140 + i * 22, '#3aff5a', 2); });
        F.center(H, `SHIFTS ${sv.shifts | 0}   FARES ${sv.fares | 0}   MEDALS ${medalCount()}/${TESTS.length}   GOLD ${goldCount()}`, W / 2, 380, '#9ad8ff', 1);
        F.center(H, `MATES GIVEN A LIFT: ${MATES.map(m => sv.mates[m.id] ? m.n : '?').join(' ')}`, W / 2, 396, '#9ad8ff', 1);
        F.center(H, 'PRESS ' + K.label('a'), W / 2, 430, '#fff', 2);
        return;
      }
      if (mode === 'options') {
        ol(H, 'OPTIONS', W / 2, 104, '#ffd21a', 3, 1);
        const o = sv.opts, rows = [['TIME OF DAY', ['AUTO (REAL CLOCK)', 'DAY', 'SUNSET', 'NIGHT'][o.tod]], ['MUSIC', o.music ? 'ON' : 'OFF'], ['ARROW', o.arrow ? 'STRAIGHT THERE' : 'FOLLOWS THE ROADS'], ['CAMERA', o.cam ? 'FAR' : 'NEAR'], ['BACK', '']];
        if (goldCount() >= TESTS.length) rows.push(['GOLDEN CAB', o.gold ? 'ON' : 'OFF']);
        if (o.expert) F.center(H, 'EXPERT MODE IS ON (L R L R ON THE TITLE TO TURN IT OFF)', W / 2, 400, '#ff3a8a', 1);
        rows.forEach(([a, b], i) => { const sel = i === optSel; F.draw(H, (sel ? '> ' : '  ') + a, 90, 160 + i * 40, sel ? '#ffd21a' : '#fff', 2); F.draw(H, b, W - 90 - F.width(b, 2), 160 + i * 40, '#3aff5a', 2); });
        F.center(H, 'LEFT/RIGHT TO CHANGE', W / 2, 430, '#9ad8ff', 1);
        return;
      }
      if (mode === 'how') {
        ol(H, 'HOW TO PLAY', W / 2, 96, '#ffd21a', 3, 1);
        ['PEOPLE WAVING IN COLOURED RINGS WANT A CAB.', 'DRIVE INTO THE RING AND STOP TO PICK THEM UP.', 'GREEN = NOT FAR, YELLOW = A WAY, RED = MILES.', 'FOLLOW THE BIG ARROW. STOP IN THE GREEN BEAM.', 'FAST FARES BUY MORE TIME AND BIGGER TIPS.', '', 'CRAZY STUNTS WITH A PASSENGER = TIPS:', 'DRIFT (HOLD ' + K.label('c') + ' AND STEER), NEAR MISSES, JUMPS,', 'AND THE CRAZY DASH: BRAKE, THEN STRAIGHT ON GO.', 'STRING THEM TOGETHER FOR A COMBO!', '', 'GO: ' + K.label('a') + ' (OR UP)   BRAKE/REVERSE: ' + K.label('b') + ' (OR DOWN)', 'HANDBRAKE: ' + K.label('c') + '   PAUSE: START']
          .forEach((l, i) => F.center(H, l, W / 2, 132 + i * 22, i === 6 ? '#ff3a8a' : i > 10 ? '#3aff5a' : '#fff', 2));
        return;
      }
    }

    window.__taxiDbg = () => car && { mode, x: Math.round(car.x), z: Math.round(car.z), y: +car.y.toFixed(1), h: +car.h.toFixed(2), sp: +Math.hypot(car.vx, car.vz).toFixed(1), air: car.air, fare: fare && { to: fare.dest.ch, left: Math.round(fare.left) }, money, tips, fares, timeLeft: Math.round(timeLeft), custs: custs.length, test: test && { id: test.id, v: test.v, t: Math.round(test.t) }, arrowYaw: +arrowYaw.toFixed(2), arrowVis: arrow.visible, combo, demo };
    window.__taxiDo = { start: k => startShift(k || 'arcade'), test: i => { sv.driver = sv.driver | 0; startTest(i); }, place: (x, z, h) => placeCab(x, z, h), pick: () => { const cu = nearestCust(); if (cu) { placeCab(cu.x + 2, cu.z, 0); pickUp(cu); } return fare && fare.dest.ch; }, tod: i => setTod(i), opt: (k, v) => { sv.opts[k] = v; }, menu: () => { mode = 'menu'; }, end: () => { timeLeft = 0.05; }, look: (x, y, z, lx, ly, lz) => { cam.position.set(x, y, z); cam.lookAt(lx, ly, lz); mode = 'view'; },
      showcase: () => { // (testing) every vehicle and every passenger lined up on the seafront road
        mode = 'view'; const z0 = 38.5 * CELL; let x = 3 * CELL; const kinds = [['saloon', 0xffd21a], ['hatch', 0xff5ab4], ['black', 0x1c1c22], ['estate', 0x7ab8e8], ['van', 0xf0f0f0], ['bus', 0xd8261c], ['float', 0xf0f0f0], ['saloon', 0xf0f0f0, { police: 1 }], ['van', 0xf8c8d8, { ice: 1 }]];
        for (const v of traffic) v.m.visible = false; for (const p of peds) { p.x = -999; }
        const out = []; for (const [k, c, o] of kinds) { const m = new T.Mesh(tGeo(k, c, o), cityMat); m.position.set(x, 0, z0 - 4); m.rotation.y = 0.6; scene.add(m); out.push([x, k]); x += CARS[k].L + 6; }
        let fx2 = 3 * CELL; for (const F0 of FOLK.concat(MATES, [MOM])) { const gg = folkGeo(F0), grp = new T.Group(); grp.add(new T.Mesh(gg.b, cityMat)); const a = new T.Mesh(gg.a, cityMat); a.position.set(0.35, 1.5, 0); a.rotation.z = 2.6; grp.add(a); grp.position.set(fx2, 0.14, z0 + 6); grp.rotation.y = 0.5; scene.add(grp); fx2 += 2.2; }
        return out; } };
    return {
      update(dt) { update(dt); },
      draw() { if (car) { car.root.position.set(car.x, car.y, car.z); car.root.rotation.set(0, car.h, 0); car.body.rotation.set(car.pitch, 0, car.roll); car.body.position.y = -Math.abs(Math.sin(K.t * 30)) * car.bounce * 0.3; for (const w of car.wheels) { w.w.rotation.x = car.spin; w.p.rotation.y = w.front ? -car.steer * 0.45 : 0; } car.root.visible = mode !== 'boot' && mode !== 'title' && mode !== 'menu' && mode !== 'drivers' && mode !== 'box' && mode !== 'records' && mode !== 'options' && mode !== 'how' || demo; }
        sky.position.copy(cam.position); stars.position.copy(cam.position);
        T3.render(); hud(); },
      end() { K.music(null); for (const m of disposeList) { try { m.dispose(); } catch (e) {} } try { C.texDay.dispose(); C.texGlow.dispose(); signMat.map.dispose(); signMat.dispose(); } catch (e) {} delete window.__taxiDo; },
    };
  }
})();

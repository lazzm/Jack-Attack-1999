/* BLOCKOLOGY (Game Lad COLOUR): falling blocks on a 10 x 18 well, with chunky patterned pieces
 * and a four-shade LCD default. OPTIONS also has the colour cartridge's jewel blocks and brick frame.
 *   MARATHON  clear lines, level up every ten, see how long you last (the score that goes to JackNet's table).
 *   ULTRA     the biggest score you can get in three minutes.      40 LINES  clear forty lines as fast as you can.
 *   B-TYPE  25 lines to clear from a starting level and a starting HEIGHT of junk. Clear it for a rocket launch.
 *   VS CPU  you against the Game Lad itself: lines you clear land as junk at the bottom of its well (and the other way
 *           round). First to win three rounds. EASY / NORMAL, and HARD once you've beaten NORMAL.
 * A turns right, B turns left, Down drops faster, Up drops it all the way, Select holds a piece for later, Start pauses
 * (Resume / Restart / Quit). Pick the music (A, B, C, and a secret D) and the level at the start like the real thing.
 * Big scores end with a rocket launch on the pad (a space shuttlebus if you're brilliant). The top five on each mode are
 * saved on the cartridge with their initials (your cast got there first). A game in progress carries on after a
 * refresh, including timed and CPU games, clears and endings (CONTINUE). The tunes and art are original.
 * Legacy flat batteries ({well, score, lines, level, sl, cur, next}) migrate without changing scores or preferences. */
(function () {
  'use strict';
  const TV = window.RoomTV; if (!TV) return;
  const SECRETS = [['rm.blocks.rocket', 'Lift-Off!', 'Score really big in Blockology and keep watching the launch pad.'],
    ['rm.blocks.cpu', 'Silicon Smasher', 'Beat the Game Lad at its own game. On HARD.']];
  try { if (window.Apps && Apps.defineSecret) for (const [id, n, hint] of SECRETS) if (!(Apps.secrets && Apps.secrets[id])) Apps.defineSecret(id, n, hint); } catch (e) {}

  // ---------------------------------------------------------------- the seven shapes (rotation 0, in a 4x4 box)
  const SH = {
    I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]], T: [[0, 1], [1, 1], [2, 1], [1, 0]],
    S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]],
  };
  const KINDS = Object.keys(SH);
  const PAT = { I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7 }, JUNK = 8;
  const COLS = 10, ROWS = 18;
  const GRAV = [53, 49, 45, 41, 37, 33, 28, 22, 17, 11, 10, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3]; // frames a row, by level
  const PTS = [0, 40, 100, 300, 1200];
  const HEIGHTS = [0, 3, 5, 8, 10, 12];
  const SEND = [0, 0, 1, 2, 4]; // VS: junk rows sent for 1, 2, 3, 4 lines
  // the Game Lad COLOUR look: every piece has its own four-colour ramp (light, colour, dark, outline). CLASSIC uses the
  // boot screen's four shades instead, like the old grey-brick Game Lad.
  const UI_COL = ['#f8f8e8', '#a8d0f8', '#4868c0', '#101830'];
  const RAMPS = { 1: ['#c8f8f8', '#38c8e0', '#1878a0', '#082838'], 2: ['#f8f8b0', '#f0d030', '#a88010', '#382808'], 3: ['#f0c8f8', '#b048d8', '#702898', '#280838'],
    4: ['#c8f8b0', '#48c840', '#207818', '#082808'], 5: ['#f8c0b8', '#e83830', '#981818', '#300808'], 6: ['#c0d0f8', '#3860e8', '#1830a0', '#080c38'],
    7: ['#f8d8a8', '#f08830', '#a84810', '#381808'], 8: ['#e0e0e0', '#a0a0a8', '#606068', '#202028'] };
  const FRAME_COL = ['#f8d8b0', '#d88850', '#904828', '#301008'];
  const MODE_N = { A: 'MARATHON', U: 'ULTRA', L: '40 LINES', B: 'B-TYPE', V: 'VS CPU' };
  const ULTRA_T = 180, SPRINT = 40;
  const clock = (s, cs) => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (cs ? r.toFixed(1).padStart(4, '0') : String(Math.floor(r)).padStart(2, '0')); };
  const rot = (k, r) => { let c = SH[k].map(p => p.slice()); const n = k === 'I' ? 4 : k === 'O' ? 0 : 3; if (!n) return c; for (let i = 0; i < ((r % 4) + 4) % 4; i++) c = c.map(([x, y]) => [n - 1 - y, x]); return c; };
  const cellsOf = p => rot(p.k, p.r).map(([x, y]) => [x + p.x, y + p.y]);
  const emptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  // ---------------------------------------------------------------- the tunes (original). Written in eighths, played as 16ths.
  const ex = a => { const o = []; for (const n of a) { if (n > 0) o.push(n, -1); else if (n === -1) o.push(-1, -1); else o.push(0, 0); } return o; };
  const TUNES = [
    { name: 'A: BRICK BOP', bpm: 144, vol: 0.045, wave: 'square', drums: 'o...x...o.o.x...',
      lead: ex([69, 72, 76, 72, 74, 72, 71, -1, 69, 71, 72, 74, 76, -1, 72, -1, 74, 77, 81, 77, 79, 77, 76, -1, 74, 72, 71, 72, 69, -1, 0, 0,
        72, 76, 79, 76, 77, 76, 74, -1, 72, 74, 76, 77, 79, -1, 76, -1, 77, 76, 74, 72, 71, 72, 74, 76, 72, 71, 69, 68, 69, -1, -1, 0]),
      bass: ex([45, 52, 57, 52, 45, 52, 57, 52, 41, 48, 53, 48, 41, 48, 53, 48, 38, 45, 50, 45, 38, 45, 50, 45, 40, 47, 52, 47, 40, 47, 44, 40,
        48, 55, 60, 55, 48, 55, 60, 55, 43, 50, 55, 50, 43, 50, 55, 50, 41, 48, 53, 48, 40, 47, 52, 47, 45, 52, 40, 44, 45, 52, 57, 0]) },
    { name: 'B: POLKA DOTS', bpm: 160, vol: 0.045, wave: 'square',
      lead: ex([74, -1, 78, 81, 78, -1, 74, -1, 76, 79, 83, 79, 76, -1, 73, -1, 74, 78, 81, 86, 85, 83, 81, 79, 78, 76, 74, 73, 74, -1, 0, 0,
        81, -1, 79, 78, 79, -1, 76, -1, 78, -1, 76, 74, 76, -1, 73, -1, 74, 76, 78, 79, 81, 83, 85, -1, 86, -1, 81, -1, 74, -1, 0, 0]),
      bass: ex([50, 0, 57, 0, 50, 0, 57, 0, 45, 0, 52, 0, 45, 0, 52, 0, 50, 0, 57, 0, 47, 0, 54, 0, 45, 0, 52, 0, 50, 0, 57, 0,
        43, 0, 50, 0, 43, 0, 50, 0, 45, 0, 52, 0, 45, 0, 52, 0, 43, 0, 50, 0, 45, 0, 52, 0, 50, 0, 45, 0, 50, 0, 0, 0]) },
    { name: 'C: CLOCKWORK', bpm: 124, vol: 0.045, wave: 'triangle',
      lead: ex([64, 67, 71, 67, 64, 67, 71, 76, 74, 72, 71, 69, 71, -1, -1, 0, 62, 66, 69, 66, 62, 66, 69, 74, 72, 71, 69, 67, 69, -1, -1, 0,
        60, 64, 67, 72, 71, 67, 64, 67, 69, 72, 76, 74, 72, 71, 69, -1, 71, 67, 64, 67, 66, 69, 71, 75, 76, -1, 71, -1, 64, -1, 0, 0]),
      bass: ex([40, 0, 47, 0, 40, 0, 47, 0, 40, 0, 47, 0, 43, 0, 47, 0, 38, 0, 45, 0, 38, 0, 45, 0, 38, 0, 45, 0, 42, 0, 45, 0,
        36, 0, 43, 0, 36, 0, 43, 0, 33, 0, 40, 0, 33, 0, 40, 0, 35, 0, 42, 0, 35, 0, 42, 0, 40, 0, 47, 0, 40, 0, 0, 0]) },
    { name: 'D: LIFT-OFF', bpm: 176, vol: 0.045, wave: 'square', drums: 'o.x.o.x.o.x.ooxx', lock: 1,
      lead: ex([72, -1, 79, -1, 76, 79, 84, -1, 83, 81, 79, 77, 76, -1, 72, -1, 74, -1, 81, -1, 77, 81, 86, -1, 84, 83, 81, 79, 77, -1, 74, -1,
        76, 77, 79, -1, 79, 81, 83, -1, 84, -1, 83, 81, 79, 77, 76, 74, 72, 76, 79, 84, 79, 76, 72, -1, 74, -1, 71, -1, 72, -1, 0, 0]),
      bass: ex([48, 48, 60, 48, 48, 48, 60, 48, 45, 45, 57, 45, 45, 45, 57, 45, 50, 50, 62, 50, 50, 50, 62, 50, 43, 43, 55, 43, 43, 43, 55, 43,
        41, 41, 53, 41, 43, 43, 55, 43, 48, 48, 60, 48, 45, 45, 57, 45, 41, 41, 53, 41, 43, 43, 55, 43, 48, 43, 48, 43, 48, 0, 0, 0]) },
  ];
  const TITLE_TUNE = { bpm: 132, vol: 0.04, wave: 'square',
    lead: ex([72, -1, 76, 79, 84, -1, 79, -1, 81, 79, 77, 76, 74, -1, -1, 0, 71, -1, 74, 77, 83, -1, 79, -1, 77, 76, 74, 72, 72, -1, -1, 0]),
    bass: ex([48, 55, 52, 55, 48, 55, 52, 55, 41, 48, 45, 48, 43, 50, 47, 50, 43, 50, 47, 50, 43, 50, 47, 50, 48, 55, 52, 55, 48, 43, 48, 0]) };

  TV.game('gb.blocks', {
    buttons: ['a', 'b'],
    help: 'Move: arrows. Turn: Z / X. Drop: Down (faster) or Up (all the way). Hold: Shift. Pause: Enter.',
    make(K) {
      const g = K.g, W = K.W, H = K.H, F = K.font;
      const sfx = Object.fromEntries(['tone', 'noise', 'seq'].map(name => [name, (...args) => { if (ST.opt.sfx) K.sfx[name](...args); }]));
      const music = song => K.music(ST.opt.music ? song : null); let P = K.pal;
      const OX = 16, OY = 0, CS = 8;
      const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
      const fr = (c, x, y, w, h) => { g.fillStyle = P[c]; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
      const txt = (s, x, y, c) => F.draw(g, s, x, y, P[c == null ? 3 : c]);
      const ctr = (s, y, c, cx) => F.center(g, s, cx == null ? W / 2 : cx, y, P[c == null ? 3 : c]);

      // ============================================================ the cartridge's battery save
      const loaded = K.load() || {};
      const castName = id => { try { return String(window.Cast && (id === 'me' ? Cast.me().name : Cast.n(id)) || (id === 'me' ? 'YOU' : 'PAL')).toUpperCase(); } catch (e) { return id === 'me' ? 'YOU' : 'PAL'; } };
      const initials = id => castName(id).replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, '.');
      const SEEDS = { A: [[31250, 9], [22400, 7], [15800, 6], [9600, 4], [4200, 2]],
        B: [[21500, 7], [17200, 6], [12900, 5], [8400, 3], [5100, 2]],
        U: [[18400, 31], [15100, 27], [12650, 24], [9800, 19], [5200, 12]],
        L: [[2400, 0, 118.4], [2100, 0, 141.2], [1800, 0, 166], [1500, 0, 189.5], [1200, 0, 233]] };
      const seedHi = type => SEEDS[type].map(([s, l, t], i) => ({ n: initials(['mate1', 'mate2', 'mate3', 'mate4', 'sister'][i]), s, l, ...(t ? { t } : {}), cast: ['mate1', 'mate2', 'mate3', 'mate4', 'sister'][i] }));
      // Only replace untouched factory records from old cartridges; player initials/scores stay exactly as entered.
      const hiOf = type => Array.isArray(loaded.hi && loaded.hi[type]) ? loaded.hi[type].slice(0, 5).map(e => {
        const i = SEEDS[type].findIndex(([s, l, t]) => e.s === s && e.l === l && (t || 0) === (e.t || 0));
        return e.cast ? { ...e, n: initials(e.cast) } : i >= 0 && String(e.n).length > 3 ? seedHi(type)[i] : e;
      }) : seedHi(type);
      const ST = {
        flights: Object.assign({}, loaded.flights || {}),
        hi: { A: hiOf('A'), B: hiOf('B'), U: hiOf('U'), L: hiOf('L') }, pb: Object.assign({ A: 0, B: 0, U: 0, L: 0, V: 0 }, loaded.pb || {}),
        opt: Object.assign({ ghost: 1, hold: 1, pal: 1, music: 1, sfx: 1 }, loaded.opt || {}), mus: loaded.mus | 0, lv: loaded.lv | 0, bh: loaded.bh | 0, cpu: loaded.cpu == null ? 1 : loaded.cpu | 0,
        un: Object.assign({ d: 0, hard: 0, ending: 0, rocket: 0 }, loaded.un || {}), stat: Object.assign({ games: 0, lines: 0, blockos: 0, wins: 0 }, loaded.stat || {}),
      };
      const colour = () => !ST.opt.pal;
      function setPal() { P = colour() ? UI_COL : K.pal; for (const k in ART) delete ART[k]; }
      const legacyWell = Array.isArray(loaded.well) && loaded.well.length === ROWS && loaded.well.every(row => Array.isArray(row) && row.length === COLS) && loaded.cur;
      // Resume contains only the run, never old copies of preferences or high scores.
      let resume = loaded.cart ? { cart: loaded.cart } : legacyWell ? Object.fromEntries(['well', 'score', 'lines', 'level', 'sl', 'cur', 'next', 'hold', 'gt', 'bh'].map(k => [k, loaded[k]])) : null;

      function persist(progress) {
        const o = { ui: { mode: ACTIVE.includes(mode) ? 'title' : mode, menuI, sub, gtype, logLv, logH }, flights: ST.flights, hi: ST.hi, pb: ST.pb, opt: ST.opt, mus: ST.mus, lv: ST.lv, bh: ST.bh, cpu: ST.cpu, un: ST.un, stat: ST.stat };
        if (progress) Object.assign(o, progress);
        K.save(o);
      }

      // ============================================================ art: blocks (8x8, four shades, a different look per piece)
      const ART = {};
      function blockArt(k) {
        if (ART[k]) return ART[k];
        const c = mkc(8, 8), x = c.getContext('2d'), f = (s, a, b, w, h) => { x.fillStyle = P[s]; x.fillRect(a, b, w, h); };
        if (colour() && RAMPS[k]) { // the colour cartridge: a bevelled jewel of a block
          const Rp = RAMPS[k], q = (s, a, b, w, h) => { x.fillStyle = Rp[s]; x.fillRect(a, b, w, h); };
          q(3, 0, 0, 8, 8); q(1, 1, 1, 6, 6); q(0, 1, 1, 6, 1); q(0, 1, 1, 1, 6); q(2, 2, 6, 5, 1); q(2, 6, 2, 1, 5); q(0, 2, 2, 2, 1); q(0, 2, 2, 1, 2);
          if (k === 8) { q(2, 3, 3, 2, 2); }
          return ART[k] = c;
        }
        f(3, 0, 0, 8, 8);
        switch (k) {
          case 1: f(1, 1, 1, 6, 6); f(0, 1, 1, 6, 1); f(0, 1, 1, 1, 6); f(2, 2, 6, 5, 1); f(2, 6, 2, 1, 5); break;                    // I: bevelled
          case 2: f(0, 1, 1, 6, 6); f(2, 2, 2, 4, 4); f(1, 3, 3, 2, 2); break;                                                        // O: framed
          case 3: f(2, 1, 1, 6, 6); f(1, 1, 1, 6, 1); f(1, 1, 1, 1, 6); f(0, 3, 3, 2, 2); break;                                      // T: dark, a stud
          case 4: f(1, 1, 1, 6, 6); for (let j = 1; j < 7; j++) for (let i = 1; i < 7; i++) if ((i + j) % 2) f(2, i, j, 1, 1); f(0, 1, 1, 6, 1); break; // S: dithered
          case 5: f(2, 1, 1, 6, 6); f(0, 1, 1, 2, 2); f(1, 3, 1, 4, 1); f(1, 1, 3, 1, 4); f(3, 5, 5, 1, 1); break;                    // Z: shiny corner
          case 6: f(0, 1, 1, 6, 6); f(3, 2, 2, 4, 4); f(1, 3, 3, 2, 2); break;                                                        // J: a window
          case 7: f(1, 1, 1, 6, 6); f(3, 1, 4, 6, 1); f(3, 4, 1, 1, 6); f(0, 1, 1, 3, 3); break;                                      // L: a cross
          case 8: f(2, 1, 1, 6, 6); for (let j = 1; j < 7; j += 2) for (let i = 1 + (j >> 1) % 2; i < 7; i += 2) f(3, i, j, 1, 1); break; // junk
          case 9: f(0, 0, 0, 8, 8); f(3, 0, 0, 8, 1); f(3, 0, 7, 8, 1); f(3, 0, 0, 1, 8); f(3, 7, 0, 1, 8); break;                    // flash
          case 10: x.clearRect(0, 0, 8, 8); for (let i = 0; i < 8; i += 2) { f(2, i, 0, 1, 1); f(2, i + 1, 7, 1, 1); f(2, 0, i + 1, 1, 1); f(2, 7, i, 1, 1); } break; // ghost
        }
        return ART[k] = c;
      }
      const blk = (k, px, py) => g.drawImage(blockArt(k), px, py);
      function brickTile() {
        if (ART.brick) return ART.brick;
        const c = mkc(8, 8), x = c.getContext('2d'), Pp = colour() ? FRAME_COL : P, f = (s, a, b, w, h) => { x.fillStyle = Pp[s]; x.fillRect(a, b, w, h); };
        f(2, 0, 0, 8, 8); f(1, 0, 0, 7, 3); f(1, 0, 4, 3, 3); f(1, 4, 4, 4, 3); f(0, 0, 0, 7, 1); f(0, 0, 4, 3, 1); f(0, 4, 4, 4, 1);
        return ART.brick = c;
      }
      function panelBg() {
        if (ART.panel) return ART.panel;
        const c = mkc(56, H), x = c.getContext('2d'); x.fillStyle = colour() ? '#c8e0f8' : P[1]; x.fillRect(0, 0, 56, H); x.fillStyle = colour() ? '#f0f8ff' : P[0];
        for (let y = 0; y < H; y += 2) for (let i = (y >> 1) % 2; i < 56; i += 4) x.fillRect(i, y, 1, 1);
        return ART.panel = c;
      }
      function box(x, y, w, h) { fr(3, x + 1, y, w - 2, h); fr(3, x, y + 1, w, h - 2); fr(0, x + 1, y + 1, w - 2, h - 2); fr(1, x + 1, y + h - 2, w - 2, 1); }

      // ============================================================ a well (yours, the computer's, or the attract demo's)
      function makeWell(o) {
        o = o || {};
        const seed = o.seed || ((Math.random() * 1e9) | 0);
        // Keep the stream state in the battery record: a refresh must not deal a new bag or junk pattern.
        let rngState = seed >>> 0 || 1;
        const random = () => { rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0; w.rng = rngState; return rngState / 4294967296; };
        const w = { grid: emptyGrid(), cur: null, next: null, hold: null, canHold: true, bag: [], rng: rngState, rnd: random, score: 0, lines: 0, level: o.level | 0, sl: o.level | 0,
          fall: 0, lock: 0, lockN: 0, das: 0, dasDir: 0, clearing: null, clearT: 0, are: 0, dead: false, btype: !!o.btype, bh: o.bh | 0, junkIn: 0, pieces: 0, blockos: 0,
          pops: [], dust: [], allowHold: o.hold !== false, me: !!o.me, done: false, onClear: o.onClear || null, onDead: o.onDead || null, onLock: o.onLock || null };
        w.restoreRng = n => { rngState = n >>> 0; w.rng = rngState; };
        if (w.btype && w.bh) { // B-TYPE: junk up to the starting height (never a full row)
          for (let y = ROWS - HEIGHTS[w.bh]; y < ROWS; y++) { for (let x = 0; x < COLS; x++) if (w.rnd() < 0.55) w.grid[y][x] = 1 + (w.rnd() * 8 | 0); if (w.grid[y].every(c => c)) w.grid[y][w.rnd() * COLS | 0] = 0; }
        }
        return w;
      }
      function draw7(w) { if (!w.bag.length) { w.bag = KINDS.slice(); for (let i = w.bag.length - 1; i > 0; i--) { const j = w.rnd() * (i + 1) | 0; [w.bag[i], w.bag[j]] = [w.bag[j], w.bag[i]]; } } return w.bag.pop(); }
      const fits = (w, p) => cellsOf(p).every(([x, y]) => x >= 0 && x < COLS && y < ROWS && (y < 0 || !w.grid[y][x]));
      const startY = k => k === 'I' ? -1 : 0;
      function spawn(w, kind) {
        if (w.junkIn > 0) addJunk(w);
        if (w.dead) return;
        const k = kind || w.next || draw7(w);
        if (!kind) w.next = draw7(w);
        w.cur = { k, r: 0, x: 3, y: startY(k) }; w.fall = 0; w.lock = 0; w.lockN = 0; w.pieces++;
        if (!fits(w, w.cur)) { w.cur.y--; if (!fits(w, w.cur)) die(w); }
      }
      function addJunk(w) {
        const n = Math.min(w.junkIn, ROWS); w.junkIn = 0;
        const hole = w.rnd() * COLS | 0;
        for (let i = 0; i < n; i++) { const top = w.grid.shift(); if (top.some(c => c)) w.dead = true; const row = Array(COLS).fill(JUNK); row[hole] = 0; w.grid.push(row); }
        if (w.me) { sfx.noise(0.25, 0.12, 400); shake = 6; }
        if (w.dead) die(w);
      }
      function die(w) { if (w.done) return; w.dead = true; w.done = true; w.cur = null; if (w.onDead) w.onDead(w); }
      function tryMove(w, dx, dy, dr) {
        const p = { k: w.cur.k, r: w.cur.r + (dr || 0), x: w.cur.x + dx, y: w.cur.y + dy };
        if (fits(w, p)) { w.cur = p; return true; }
        if (dr) for (const [kx, ky] of [[1, 0], [-1, 0], [0, -1], [2, 0], [-2, 0]]) { const q = { k: p.k, r: p.r, x: p.x + kx, y: p.y + ky }; if (fits(w, q)) { w.cur = q; return true; } }
        return false;
      }
      const grounded = w => !fits(w, { k: w.cur.k, r: w.cur.r, x: w.cur.x, y: w.cur.y + 1 });
      function ghostY(w) { let n = 0; while (fits(w, { k: w.cur.k, r: w.cur.r, x: w.cur.x, y: w.cur.y + n + 1 })) n++; return w.cur.y + n; }
      function settle(w) {
        for (const [x, y] of cellsOf(w.cur)) { if (y < 0) return die(w); w.grid[y][x] = PAT[w.cur.k]; }
        const landed = w.cur; w.cur = null; w.canHold = true;
        if (w.onLock) w.onLock(w, landed);
        const full = []; for (let y = 0; y < ROWS; y++) if (w.grid[y].every(c => c)) full.push(y);
        if (full.length) {
          w.clearing = full; w.clearT = 0;
          const pts = PTS[Math.min(4, full.length)] * (w.level + 1); w.score += pts; w.lines += full.length;
          if (full.length === 4) w.blockos++;
          w.pops.push({ s: '+' + pts, x: OX + 40, y: OY + full[0] * CS, t: 0 });
          if (w.onClear) w.onClear(w, full.length);
          if (!w.btype) { const lv = w.sl + Math.floor(w.lines / 10); if (lv > w.level) { w.level = lv; if (w.me) levelUp(); } }
        } else w.are = 2;
      }
      function collapse(w) { for (const y of w.clearing) { w.grid.splice(y, 1); w.grid.unshift(Array(COLS).fill(0)); } w.clearing = null; w.are = 6; }
      function doHold(w) {
        if (!w.allowHold || !w.canHold || !w.cur) return false;
        const k = w.cur.k; w.canHold = false;
        if (w.hold) { const h2 = w.hold; w.hold = k; spawn(w, h2); } else { w.hold = k; spawn(w); }
        return true;
      }
      function hardDrop(w) {
        let n = 0; while (tryMove(w, 0, 1)) n++;
        w.score += n * 2;
        if (w.me) { sfx.noise(0.08, 0.15, 900); if (n > 2) shake = 2; for (const [x, y] of cellsOf(w.cur)) if (y >= 0) w.dust.push({ x: OX + x * CS + 4, y: OY + y * CS + 8, vx: (Math.random() - 0.5) * 1.6, vy: -Math.random() * 1.2, t: 0 }); }
        settle(w);
      }
      // one 60th of a second. inp: { l, r, dn (held), pl, pr, ra, rb, hd, hold (pressed) }
      function stepWell(w, inp) {
        if (w.dead) return;
        for (const p of w.pops) p.t += 1 / 60; w.pops = w.pops.filter(p => p.t < 1);
        for (const d of w.dust) { d.t += 1 / 60; d.x += d.vx; d.y += d.vy; d.vy += 0.08; } w.dust = w.dust.filter(d => d.t < 0.5);
        if (w.clearing) { w.clearT += 1 / 60; if (w.clearT > 0.34) collapse(w); return; }
        if (w.done) return;
        if (!w.cur) { if (w.are > 0) w.are--; if (!w.are) spawn(w); return; }
        if (inp.hold && doHold(w)) { if (w.me) sfx.tone(660, 0.05, 'square', 0.06, 0, 990); return; }
        // left/right: a tap moves one, holding repeats after a moment (like the D-pad)
        const d = inp.pl ? -1 : inp.pr ? 1 : inp.l && !inp.r ? -1 : inp.r && !inp.l ? 1 : 0;
        if (!d) { w.das = 0; w.dasDir = 0; }
        else if (inp.pl || inp.pr || d !== w.dasDir) {
          w.dasDir = d; w.das = 0;
          if (tryMove(w, d, 0)) { if (w.me) sfx.tone(300, 0.02, 'square', 0.04); resetLock(w); }
        } else if (++w.das >= 14 && (w.das - 14) % 3 === 0 && tryMove(w, d, 0)) resetLock(w);
        if (inp.ra && tryMove(w, 0, 0, 1)) { if (w.me) sfx.tone(520, 0.03, 'square', 0.05); resetLock(w); }
        if (inp.rb && tryMove(w, 0, 0, -1)) { if (w.me) sfx.tone(470, 0.03, 'square', 0.05); resetLock(w); }
        if (inp.hd) return hardDrop(w);
        if (grounded(w)) {
          w.lock++;
          if (w.lock >= (inp.dn ? 6 : 30)) { if (w.me) sfx.tone(160, 0.06, 'square', 0.08); settle(w); }
          return;
        }
        w.lock = 0;
        const G = GRAV[Math.min(w.level + (w.heart ? 10 : 0), GRAV.length - 1)], need = inp.dn ? Math.min(2, G) : G;
        if (++w.fall >= need) { w.fall = 0; if (tryMove(w, 0, 1) && inp.dn) w.score += 1; }
      }
      function resetLock(w) { if (w.lock > 0 && w.lockN < 15) { w.lock = 0; w.lockN++; } }
      const stackTop = w => { for (let y = 0; y < ROWS; y++) if (w.grid[y].some(c => c)) return y; return ROWS; };

      // ============================================================ the computer player (VS CPU and the attract demo)
      function plan(w, k, sloppy) {
        let best = null;
        const rots = k === 'O' ? [0] : k === 'I' || k === 'S' || k === 'Z' ? [0, 1] : [0, 1, 2, 3];
        for (const r of rots) for (let x = -3; x < COLS + 1; x++) {
          let p = { k, r, x, y: startY(k) }; if (!fits(w, p)) { p.y--; if (!fits(w, p)) continue; }
          while (fits(w, { k, r, x, y: p.y + 1 })) p.y++;
          const gr = w.grid.map(row => row.slice()); let bad = false;
          for (const [cx, cy] of cellsOf(p)) { if (cy < 0) bad = true; else gr[cy][cx] = 1; }
          if (bad) continue;
          let lines = 0; for (let y = 0; y < ROWS; y++) if (gr[y].every(c => c)) { lines++; gr.splice(y, 1); gr.unshift(Array(COLS).fill(0)); }
          const hts = []; let holes = 0;
          for (let cx = 0; cx < COLS; cx++) { let h = 0, seen = false; for (let y = 0; y < ROWS; y++) { if (gr[y][cx]) { if (!seen) { h = ROWS - y; seen = true; } } else if (seen) holes++; } hts.push(h); }
          let bump = 0; for (let cx = 1; cx < COLS; cx++) bump += Math.abs(hts[cx] - hts[cx - 1]);
          const agg = hts.reduce((a, b) => a + b, 0), top = Math.max(...hts);
          let v = -0.51 * agg + 0.76 * lines * (lines === 4 ? 1.6 : 1) - 0.36 * holes * 2 - 0.18 * bump - (top > 14 ? 3 : 0);
          if (sloppy) v += (w.rnd() - 0.5) * sloppy;
          if (!best || v > best.v) best = { r, x, v };
        }
        return best || { r: 0, x: 3, v: 0 };
      }
      const CPU_LV = [{ n: 'EASY', spd: 12, slop: 9, hard: false }, { n: 'NORMAL', spd: 6, slop: 2.5, hard: false }, { n: 'HARD', spd: 3, slop: 0, hard: true }];
      function cpuInput(c, w) {
        const inp = {};
        if (!w.cur || w.clearing) { c.p = null; return inp; }
        if (!c.p || c.id !== w.pieces) { c.p = plan(w, w.cur.k, c.lv.slop); c.id = w.pieces; c.t = c.lv.spd + 4; c.n = 0; c.go = false; }
        if (c.go) { inp.dn = true; return inp; }
        if (--c.t > 0) return inp;
        c.t = c.lv.spd; c.n++;
        const r = ((w.cur.r % 4) + 4) % 4;
        if (c.n > 30) { inp.hd = true; return inp; }
        if (r !== c.p.r) inp.ra = true;
        else if (w.cur.x < c.p.x) inp.pr = true; else if (w.cur.x > c.p.x) inp.pl = true;
        else if (c.lv.hard) inp.hd = true; else c.go = true;
        return inp;
      }

      // ============================================================ sounds and juice
      let shake = 0, flashT = 0, banner = '', bannerT = 0;
      const jingle = (notes, bpm, wave) => sfx.seq(notes, { bpm: bpm || 300, vol: 0.09, wave: wave || 'square' });
      function levelUp() {
        if (banner === 'BLOCKOLOGY!' && bannerT > 0) bannerSub = 'LEVEL ' + you.level + '!';
        else { banner = 'LEVEL ' + you.level + '!'; bannerSub = ''; bannerT = 1.6; jingle([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.75]], 320); }
      }
      function clearSfx(n) {
        if (n === 4) { jingle([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 0.25], [91, 1]], 340); sfx.noise(0.5, 0.1, 5000, 0, 'highpass'); }
        else if (n === 3) jingle([[76, 0.25], [79, 0.25], [84, 0.5]]); else if (n === 2) jingle([[79, 0.25], [84, 0.5]]); else jingle([[84, 0.4]]);
      }

      // ============================================================ the game state
      let mode = 'title', T = 0, idleT = 0, menuI = 0, sub = 0, gtype = 'A', you = null, cpu = null, cpuC = null, paused = false, pauseI = 0;
      let vs = null; // { lv: CPU level index, me: wins, them: wins, round, msgT, roundOver }
      let runT = 0, overT = 0, result = null, saveT = 0, danger = false, entry = null, rocket = null, reported = false, demo = null, logoT = 0;
      const tune = () => ST.mus < TUNES.length ? TUNES[ST.mus] : null;
      function resumeScoring() { if (K.restoring) { K.t = 0; if (K.resume) K.resume(); } if (ST.un.rocket) K.secret('rm.blocks.rocket'); }
      function playTune() { const t = tune(); if (!t) return music(null); music(danger ? Object.assign({}, t, { bpm: t.bpm * 1.3 }) : t); }
      const WELL_KEYS = ['grid', 'cur', 'next', 'hold', 'canHold', 'bag', 'rng', 'score', 'lines', 'level', 'sl', 'fall', 'lock', 'lockN', 'das', 'dasDir', 'clearing', 'clearT', 'are', 'dead', 'btype', 'bh', 'junkIn', 'pieces', 'blockos', 'allowHold', 'done', 'heart'];
      const packWell = w => w && Object.fromEntries(WELL_KEYS.map(k => [k, w[k]]));
      function unpackWell(w, saved) {
        for (const k of WELL_KEYS) if (saved[k] !== undefined) w[k] = JSON.parse(JSON.stringify(saved[k]));
        w.restoreRng(saved.rng == null ? 1 : saved.rng); w.das = 0; w.dasDir = 0; return w;
      }
      const ACTIVE = ['play', 'over', 'rocket', 'entry', 'result', 'vsend', 'credits'];
      const progress = () => (you || mode === 'credits') && ACTIVE.includes(mode) ? { cart: {
        v: 2, mode, gtype, you: packWell(you), cpu: packWell(cpu), cpuC, vs, runT, overT, result, entry, rocket: rocket && { size: rocket.size, t: rocket.t },
        reported, unlockMsg, myRow, banner, bannerSub, bannerT, flashT, heartOn, creditT, creditBack, creditPrior, counted, startScoreTime: K.t,
      } } : null;
      function checkpoint() {
        const pr = progress();
        if (pr) { persist(pr); resume = JSON.parse(JSON.stringify(pr)); }
        else persist(resume);
      }
      function restoreCart(c) {
        if (!c || c.v !== 2 || !ACTIVE.includes(c.mode)) return false;
        if (!c.you) { if (c.mode !== 'credits') return false; mode = 'credits'; creditT = c.creditT || 0; creditBack = c.creditBack || 'flights'; creditPrior = c.creditPrior || null; music(TUNES[3]); return true; }
        vs = c.vs ? { ...c.vs } : null; startGame(c.gtype, { cart: c });
        unpackWell(you, c.you); if (c.cpu && cpu) unpackWell(cpu, c.cpu);
        cpuC = c.cpuC || cpuC; vs = c.vs; runT = c.runT || 0; overT = c.overT || 0; result = c.result;
        entry = c.entry; rocket = c.rocket; reported = !!c.reported; unlockMsg = c.unlockMsg || ''; myRow = c.myRow && (tbl().find(e => e.n === c.myRow.n && e.s === c.myRow.s && e.t === c.myRow.t) || c.myRow);
        banner = c.banner || ''; bannerSub = c.bannerSub || ''; bannerT = c.bannerT || 0; flashT = c.flashT || 0;
        heartOn = !!c.heartOn; counted = !!c.counted; creditT = c.creditT || 0; creditBack = c.creditBack || 'afterOver'; creditPrior = c.creditPrior || null; mode = c.mode;
        K.t = K.restoring ? 0 : Math.max(K.t, c.startScoreTime || 0); paused = mode === 'play'; pauseI = 0;
        music(mode === 'credits' ? TUNES[3] : null); return true;
      }

      function startGame(type, seedWell) {
        gtype = type; paused = false; counted = false; unlockMsg = ''; danger = false; overT = 0; result = null; reported = false; banner = ''; bannerT = 0; flashT = 0; runT = 0; bannerSub = '';
        const common = { me: true, hold: type !== 'V' && !!ST.opt.hold, onClear: (w, n) => {
          clearSfx(n);
          if (n === 4) { flashT = 0.16; shake = 3; banner = 'BLOCKOLOGY!'; bannerSub = '4 LINES!'; bannerT = 1.8; K.secret('rm.blocks.tetra'); ST.stat.blockos++; if (!ST.un.d) { ST.un.d = 1; bannerT = 2.6; unlockMsg = 'MUSIC D UNLOCKED!'; } }
          else if (n >= 2) { banner = n === 3 ? 'TRIPLE!' : 'DOUBLE!'; bannerSub = ''; bannerT = 0.9; }
          if (gtype === 'V') sendJunk(you, cpu, n); if (gtype === 'B' && w.lines >= 25) bClear(); if (gtype === 'L' && w.lines >= SPRINT) timedEnd(true); },
          onDead: () => youDied() };
        if (seedWell && !seedWell.cart) { // carry on a saved game
          you = makeWell(Object.assign({ level: seedWell.sl | 0 }, common));
          you.grid = seedWell.well.map(r => r.slice(0, COLS).map(c => c | 0)); you.score = seedWell.score | 0; you.lines = seedWell.lines | 0; you.level = seedWell.level | 0;
          you.cur = Object.assign({}, seedWell.cur); you.next = KINDS.includes(seedWell.next) ? seedWell.next : draw7(you); you.hold = KINDS.includes(seedWell.hold) ? seedWell.hold : null;
          you.btype = seedWell.gt === 'B'; you.bh = seedWell.bh | 0; gtype = you.btype ? 'B' : 'A';
          if (!KINDS.includes(you.cur.k) || !fits(you, you.cur)) spawn(you);
          paused = true; pauseI = 0;
        } else {
          const seed = (Math.random() * 1e9) | 0;
          you = makeWell(Object.assign({ level: ST.lv, btype: type === 'B', bh: ST.bh, seed }, common));
          you.heart = heartOn; if (heartOn) { banner = 'HEART MODE!'; bannerSub = 'GOOD LUCK...'; bannerT = 1.6; }
          spawn(you);
          if (type === 'V') {
            cpu = makeWell({ level: ST.lv, seed, hold: false, onClear: (w, n) => sendJunk(cpu, you, n), onDead: () => roundOver(true) });
            spawn(cpu); cpuC = { lv: CPU_LV[ST.cpu] };
            vs.msgT = 2; vs.roundOver = 0;
          } else cpu = null;
          if (type === 'B') { banner = `B-TYPE ${ST.lv}-${ST.bh}`; bannerT = 1.6; }
          if (type === 'U') { banner = '3 MINUTES!'; bannerSub = 'GO GO GO!'; bannerT = 1.6; }
          if (type === 'L') { banner = '40 LINES'; bannerSub = 'RACE CLOCK'; bannerT = 1.6; }
        }
        mode = 'play'; if (!seedWell) ST.stat.games++;
        if (!paused) playTune(); else music(null);
        if (!seedWell) { K.t = 0; resumeScoring(); checkpoint(); }
      }
      let unlockMsg = '', bannerSub = '', heartOn = false;
      function timedEnd(won) { // ULTRA: the clock ran out; 40 LINES: all forty cleared
        you.done = true; you.cur = null; mode = 'over'; overT = 0; music(null);
        result = { won, time: runT, timed: true }; checkpoint();
        jingle(won ? [[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 1]] : [[84, 0.25], [79, 0.25], [76, 0.25], [72, 1]], 260);
      }
      function sendJunk(from, to, n) { let s = SEND[n]; if (!s) return; if (from.junkIn > 0) { const c = Math.min(from.junkIn, s); from.junkIn -= c; s -= c; } to.junkIn += s; }
      function youDied() {
        if (gtype === 'V') return roundOver(false);
        mode = 'over'; overT = 0; music(null); resume = null;
        jingle([[72, 0.5], [67, 0.5], [64, 0.5], [60, 1.5]], 180, 'triangle');
        result = { won: false }; checkpoint();
      }
      function bClear() {
        const bonus = 1000 * (you.level + 1) + 1500 * you.bh;
        you.score += bonus; you.done = true; you.cur = null;
        mode = 'over'; overT = 0; music(null); resume = null;
        jingle([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [88, 1]], 260);
        const flight = you.sl + '-' + you.bh;
        ST.flights[flight] = Math.max(ST.flights[flight] || 0, you.score);
        if (you.sl === 9 && you.bh === 5) ST.un.ending = 1;
        result = { won: true, bonus }; checkpoint();
      }
      function roundOver(youWon) {
        if (vs.roundOver) return;
        vs.roundOver = 1; vs.won = youWon; vs.endT = 0;
        if (youWon) vs.me++; else vs.them++;
        you.done = true; cpu.done = true; you.cur = null; cpu.cur = null;
        music(null);
        checkpoint();
        if (youWon) jingle([[72, 0.25], [76, 0.25], [79, 0.25], [84, 1]], 260); else jingle([[67, 0.5], [63, 0.5], [60, 1]], 200, 'triangle');
      }
      function nextRound() {
        vs.lines += you.lines;
        if (vs.me >= 3 || vs.them >= 3) {
          const won = vs.me >= 3;
          ST.stat.lines += vs.lines;
          if (won) { ST.stat.wins++; if (ST.cpu === 1 && !ST.un.hard) { ST.un.hard = 1; unlockMsg = 'HARD CPU UNLOCKED!'; } if (ST.cpu === 2) K.secret('rm.blocks.cpu'); }
          mode = 'vsend'; overT = 0; vs.matchWon = won;
          vs.total = Math.min(99999, vs.lines * 100 + vs.me * 2000 + (won ? 3000 * (ST.cpu + 1) : 0));
          ST.pb.V = Math.max(ST.pb.V || 0, vs.total); checkpoint(); return;
        }
        vs.round++;
        startGame('V');
      }

      // ============================================================ high scores and the initials screen
      const tbl = () => ST.hi[gtype] || ST.hi.A;
      const better = (a, b) => gtype === 'L' ? a.t < b.t : a.s > b.s; // (40 LINES is a race: the quickest time wins)
      const myEntry = () => gtype === 'L' ? { s: you.score, l: you.level, t: Math.round(runT * 10) / 10 } : { s: you.score, l: gtype === 'U' ? you.lines : you.level };
      const qualifies = () => { if (gtype === 'L' && !(result && result.won)) return false; const e = myEntry(); if (!(e.s > 0 || e.t)) return false; const L = tbl(); return L.length < 5 || better(e, L[L.length - 1]); };
      const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.!?';
      function afterOver() {
        const s = you.score;
        // a rocket for a big go (B-TYPE: a clear from a high level and height)
        const size = gtype === 'B' ? (result.won ? (you.level + you.bh >= 14 ? 3 : you.level + you.bh >= 9 ? 2 : 1) : 0)
          : gtype === 'L' ? (result.won ? (runT < 120 ? 3 : runT < 180 ? 2 : 1) : 0) : gtype === 'U' ? (s >= 40000 ? 3 : s >= 20000 ? 2 : s >= 8000 ? 1 : 0)
          : s >= 100000 ? 3 : s >= 50000 ? 2 : s >= 20000 ? 1 : 0;
        // personal bests per mode
        if (gtype === 'L') { if (result.won && (!ST.pb.L || runT < ST.pb.L)) ST.pb.L = Math.round(runT * 10) / 10; } else if (s > (ST.pb[gtype] | 0)) ST.pb[gtype] = s;
        if (size && !rocket) { rocket = { size, t: 0 }; mode = 'rocket'; music(null); checkpoint(); return; }
        if (gtype === 'B' && result.won && you.sl === 9 && you.bh === 5 && !result.credits) { result.credits = true; startCredits(); return; }
        if (qualifies() && !entry) { entry = { name: [...initials('me')].map(ch => Math.max(0, ABC.indexOf(ch))), i: 0, done: false }; mode = 'entry'; music(TITLE_TUNE); checkpoint(); return; }
        mode = 'result'; overT = 0; checkpoint();
      }
      function report() {
        if (reported) return; reported = true;
        const sc = gtype === 'V' ? vs.total : you.score;
        const cap = Math.min(sc, 999999, Math.floor(900 * (K.t + 4))); // (never faster than the high-score server believes)
        const title = gtype === 'V' ? (vs.matchWon ? 'YOU BEAT THE GAME LAD!' : 'THE GAME LAD WINS') : gtype === 'B' ? (result.won ? 'B-TYPE CLEARED!' : 'GAME OVER')
          : gtype === 'U' ? 'TIME UP!' : gtype === 'L' ? (result.won ? `40 LINES IN ${clock(runT, 1)}!` : 'GAME OVER') : 'GAME OVER';
        const text = gtype === 'V' ? `VS CPU (${CPU_LV[ST.cpu].n}): ${vs.me} - ${vs.them}` : `${MODE_N[gtype]}  LEVEL ${you.level}  LINES ${you.lines}${you.blockos ? `  BLOCKOLOGIES ${you.blockos}` : ''}`;
        K.over(cap, { title, text, keep: true }); K.t = 0; checkpoint();
      }

      // ============================================================ the rocket launch (a reward, like the old handheld)
      function pixelOval(c, x, y, rx, ry) {
        x = Math.round(x); y = Math.round(y); rx = Math.round(rx); ry = Math.round(ry);
        for (let j = -ry; j <= ry; j++) { const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - j * j / (ry * ry)))); fr(c, x - half, y + j, half * 2 + 1, 1); }
      }
      function drawRocket() {
        const R = rocket, t = R.t;
        fr(3, 0, 0, W, H);
        for (let i = 0; i < 40; i++) { const sx = (i * 53) % W, sy = (i * 29) % 100; fr((i + (K.frame >> 4)) % 5 ? 1 : 0, sx, sy, 1, 1); }
        pixelOval(1, 130, 22, 9, 9); fr(2, 126, 18, 3, 3); fr(2, 132, 25, 2, 2); // the moon
        const lift = t < 3 ? 0 : Math.round(Math.pow(t - 3, 2.2) * 9), sh = t > 2 && t < 6 ? ((K.frame >> 1) % 2) * 2 - 1 : 0;
        g.save(); g.translate(sh, 0);
        fr(2, 0, 118, W, 26); fr(1, 0, 118, W, 2); for (let x = 0; x < W; x += 6) fr(3, x, 124 + (x * 7) % 12, 2, 1);
        // the gantry tower
        fr(2, 100, 40, 3, 78); fr(2, 110, 40, 3, 78); for (let y = 42; y < 118; y += 8) { g.fillStyle = P[2]; g.beginPath(); g.moveTo(100, y); g.lineTo(113, y + 8); g.lineTo(113, y + 6); g.lineTo(100, y - 2); g.fill(); fr(2, 100, y, 13, 1); }
        fr(1, 100, 40, 13, 1); fr(1, 101, 41, 1, 77);
        if (lift < 2) { fr(2, 88, 60, 12, 2); fr(2, 88, 80, 12, 2); }
        fr(3, 60, 114, 50, 4);
        // the rocket
        const bx = 76, by = 114 - lift;
        if (R.size === 3) { // the space shuttle: a big tank, two boosters, the orbiter
          fr(3, bx - 6, by - 64, 13, 62); fr(2, bx - 5, by - 62, 11, 58); fr(1, bx - 4, by - 62, 3, 58); pixelOval(3, bx, by - 64, 6, 8); pixelOval(2, bx, by - 63, 5, 7);
          for (const s of [-10, 8]) { fr(3, bx + s, by - 54, 5, 52); fr(0, bx + s + 1, by - 52, 3, 50); g.fillStyle = P[3]; g.beginPath(); g.moveTo(bx + s, by - 54); g.lineTo(bx + s + 2.5, by - 60); g.lineTo(bx + s + 5, by - 54); g.fill(); }
          fr(3, bx + 13, by - 46, 9, 40); fr(0, bx + 14, by - 44, 7, 36); fr(3, bx + 15, by - 41, 3, 3); g.fillStyle = P[3]; g.beginPath(); g.moveTo(bx + 13, by - 46); g.lineTo(bx + 17, by - 54); g.lineTo(bx + 22, by - 46); g.fill();
          g.beginPath(); g.moveTo(bx + 22, by - 20); g.lineTo(bx + 30, by - 6); g.lineTo(bx + 22, by - 6); g.fill(); fr(2, bx + 14, by - 12, 7, 6);
        } else {
          const hgt = R.size === 2 ? 52 : 36, wd = R.size === 2 ? 11 : 9, x0 = bx - (wd >> 1);
          fr(3, x0, by - hgt, wd, hgt - 2); fr(0, x0 + 1, by - hgt + 2, wd - 2, hgt - 6); fr(1, x0 + wd - 3, by - hgt + 2, 2, hgt - 6);
          fr(3, x0 + 2, by - hgt + 8, wd - 4, 4); fr(1, x0 + 3, by - hgt + 9, wd - 6, 2); // a window
          if (R.size === 2) { fr(2, x0 + 1, by - 26, wd - 2, 3); txt(initials('me')[0], x0 + 3, by - 22, 3); }
          g.fillStyle = P[3]; g.beginPath(); g.moveTo(x0, by - hgt); g.lineTo(bx + 0.5, by - hgt - 10); g.lineTo(x0 + wd, by - hgt); g.fill();
          g.beginPath(); g.moveTo(x0, by - 14); g.lineTo(x0 - 5, by - 2); g.lineTo(x0, by - 4); g.fill(); g.beginPath(); g.moveTo(x0 + wd, by - 14); g.lineTo(x0 + wd + 5, by - 2); g.lineTo(x0 + wd, by - 4); g.fill();
        }
        // flame and smoke
        if (t > 2) {
          const fl = 6 + ((K.frame >> 1) % 3) * 3 + Math.min(18, lift / 3);
          g.fillStyle = P[0]; g.beginPath(); g.moveTo(bx - 4, by); g.lineTo(bx, by + fl); g.lineTo(bx + 4, by); g.fill();
          g.fillStyle = P[1]; g.beginPath(); g.moveTo(bx - 2, by); g.lineTo(bx, by + fl * 0.6); g.lineTo(bx + 2, by); g.fill();
          if (R.size === 3) for (const s of [-8, 10]) { g.fillStyle = P[0]; g.beginPath(); g.moveTo(bx + s - 2, by); g.lineTo(bx + s, by + fl); g.lineTo(bx + s + 2, by); g.fill(); }
        }
        for (const c of R.smoke || []) pixelOval(c.c, c.x, c.y, c.r, c.r * 0.7);
        g.restore();
        if (t < 2.4) { const n = 3 - Math.floor(t / 0.8); box(4, 40, 58, 24); ctr(n > 0 ? String(n) : 'IGNITION', 48, 3, 33); }
        if (t > 4.5) { box(16, 8, 128, 30); ctr(R.size === 3 ? 'SHUTTLE LAUNCH!' : R.size === 2 ? 'BIG ROCKET!' : 'LIFT-OFF!', 14, 3); ctr(R.size === 3 ? 'BLOCKOLOGY CHAMPION' : 'WELL PLAYED!', 25, 2); }
      }
      function stepRocket() {
        const R = rocket; R.t += 1 / 60; R.smoke = R.smoke || [];
        if (R.t > 2 && R.t < 8 && K.frame % 3 === 0) for (const s of [-1, 1]) R.smoke.push({ x: 76 + s * 4, y: 116, vx: s * (0.6 + Math.random() * 1.2), vy: -Math.random() * 0.3, r: 3 + Math.random() * 3, c: Math.random() < 0.5 ? 0 : 1 });
        for (const c of R.smoke) { c.x += c.vx; c.y += c.vy; c.vx *= 0.985; c.r = Math.min(10, c.r + 0.05); }
        if (R.smoke.length > 80) R.smoke.splice(0, R.smoke.length - 80);
        if (R.t > 2 && R.t < 6 && K.frame % 4 === 0) sfx.noise(0.12, 0.08 + R.size * 0.02, 300 + R.t * 120);
        if (Math.abs(R.t - 2) < 1 / 120) sfx.noise(1.5, 0.15, 800, 0, 'lowpass', 200);
        if (Math.abs(R.t - 4.6) < 1 / 120) { jingle([[72, 0.5], [76, 0.5], [79, 0.5], [84, 0.5], [88, 0.5], [91, 2]], 240); }
        if (R.size === 3 && R.t >= 4.6 && !ST.un.rocket) { ST.un.rocket = 1; K.secret('rm.blocks.rocket'); checkpoint(); }
        if (R.t > 3 && (K.pressed('a') || K.pressed('start'))) { mode = 'afterRocket'; afterOver(); }
        if (R.t > 11) afterOver();
      }

      // ============================================================ drawing the play screen
      function drawWell(w, ox, oy, cs, hidden) {
        if (cs === CS) {
          fr(0, ox, oy, COLS * cs, ROWS * cs);
          for (let y = 1; y < ROWS; y += 2) for (let x = 1; x < COLS; x++) fr(1, ox + x * cs, oy + y * cs, 1, 1); // a faint dotted grid
          if (hidden) return;
          const cl = w.clearing, ct = w.clearT;
          for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
            const k = w.grid[y][x]; if (!k) continue;
            if (cl && cl.includes(y)) { if (ct < 0.16) { blk(((ct * 14) | 0) % 2 ? 9 : k, ox + x * cs, oy + y * cs); continue; } const gone = Math.floor((ct - 0.16) / 0.18 * 6); if (Math.abs(x - 4.5) < gone) continue; blk(9, ox + x * cs, oy + y * cs); continue; }
            blk(k, ox + x * cs, oy + y * cs);
          }
          if (w.cur && !w.dead) {
            if (ST.opt.ghost) { const gy = ghostY(w); if (gy > w.cur.y) for (const [x, y] of cellsOf({ k: w.cur.k, r: w.cur.r, x: w.cur.x, y: gy })) if (y >= 0) blk(10, ox + x * cs, oy + y * cs); }
            const flash = w.lock > 18 && (K.frame >> 3) % 2;
            for (const [x, y] of cellsOf(w.cur)) if (y >= 0) blk(flash ? 9 : PAT[w.cur.k], ox + x * cs, oy + y * cs);
          }
          for (const d of w.dust) fr(2, d.x | 0, d.y | 0, 1, 1);
          for (const p of w.pops) { const y = p.y - p.t * 16; fr(0, p.x - F.width(p.s) / 2 - 1, y - 1, F.width(p.s) + 2, 9); F.center(g, p.s, p.x, y, P[3]); }
        } else { // the little well in the corner (the computer's)
          fr(0, ox, oy, COLS * cs, ROWS * cs);
          for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (w.grid[y][x]) fr(w.grid[y][x] === JUNK ? 2 : 3, ox + x * cs, oy + y * cs, cs, cs);
          if (w.cur) for (const [x, y] of cellsOf(w.cur)) if (y >= 0) fr(2, ox + x * cs, oy + y * cs, cs, cs);
          if (w.clearing && (K.frame >> 2) % 2) for (const y of w.clearing) fr(1, ox, oy + y * cs, COLS * cs, cs);
        }
      }
      function pieceAt(k, cx, cy, cs) {
        const c = rot(k, 0), mx = Math.min(...c.map(p => p[0])), Mx = Math.max(...c.map(p => p[0])), my = Math.min(...c.map(p => p[1])), My = Math.max(...c.map(p => p[1]));
        const ox = Math.round(cx - (Mx - mx + 1) * cs / 2), oy = Math.round(cy - (My - my + 1) * cs / 2);
        for (const [x, y] of c) { if (cs === 8) blk(PAT[k], ox + (x - mx) * 8, oy + (y - my) * 8); else fr(3, ox + (x - mx) * cs, oy + (y - my) * cs, cs - 1, cs - 1); }
      }
      function drawFrame() {
        const b = brickTile();
        for (let y = 0; y < H; y += 8) { g.drawImage(b, 0, y); g.drawImage(b, 8, y); g.drawImage(b, OX + COLS * CS, y); }
        fr(3, OX - 1, 0, 1, H); fr(3, OX + COLS * CS, 0, 1, H);
        g.drawImage(panelBg(), 104, 0);
      }
      const pad6 = n => String(n).padStart(6, ' ');
      function drawPanel() {
        const x0 = 106, w0 = 52;
        if (gtype === 'V') {
          box(x0, 2, w0, 24); txt('YOU', x0 + 4, 5); txt('CPU', x0 + 4, 15);
          for (let i = 0; i < 3; i++) { blk(i < vs.me ? 2 : 10, x0 + 26 + i * 8, 4); blk(i < vs.them ? 3 : 10, x0 + 26 + i * 8, 14); }
          box(x0, 28, w0, 34); txt('NEXT', x0 + 4, 31, 2); if (you.next) pieceAt(you.next, x0 + w0 / 2, 51, 8);
          box(x0, 64, w0, 78); txt(CPU_LV[ST.cpu].n.slice(0, 6), x0 + 4, 67, 2);
          fr(3, x0 + 10, 77, 32, 56); drawWell(cpu, x0 + 11, 78, 3);
          if (cpu.junkIn) { fr(3, x0 + 44, 133 - cpu.junkIn * 3, 4, cpu.junkIn * 3); }
          return;
        }
        if (gtype === 'L') { box(x0, 2, w0, 22); txt('TIME', x0 + 4, 5, 2); txt(clock(runT, 1).padStart(6, ' '), x0 + 6, 14); }
        else { box(x0, 2, w0, 22); txt('SCORE', x0 + 4, 5, 2); txt(pad6(Math.min(999999, you.score)), x0 + 6, 14); }
        box(x0, 26, w0, 22); txt((you.heart ? 'LV♥ ' : you.level >= 10 ? 'LV ' : 'LEVEL ') + you.level, x0 + 4, 29); txt(gtype === 'B' ? 'LEFT ' + Math.max(0, 25 - you.lines) : gtype === 'L' ? 'LEFT ' + Math.max(0, SPRINT - you.lines) : 'LINE ' + you.lines, x0 + 4, 38);
        box(x0, 50, w0, 36); txt('NEXT', x0 + 4, 53, 2); if (you.next) pieceAt(you.next, x0 + w0 / 2, 74, 8);
        if (you.allowHold) { box(x0, 88, w0, 32); txt('HOLD', x0 + 4, 91, 2); if (you.hold) pieceAt(you.hold, x0 + w0 / 2, 109, 8); else txt('SEL', x0 + 17, 104, 1); }
        else { box(x0, 88, w0, 32); txt('BLOCKO', x0 + 4, 91, 2); txt(String(you.blockos), x0 + 4, 104); }
        if (gtype === 'U') { const left = ULTRA_T - runT, hot = left < 30 && (K.frame >> 3) % 2; box(x0, 122, w0, 20); txt('TIME', x0 + 4, 124, 2); txt(clock(left).padStart(6, ' '), x0 + 6, 132, hot ? 2 : 3); return; }
        if (gtype === 'L') { box(x0, 122, w0, 20); txt('BEST', x0 + 4, 124, 2); txt((tbl()[0] ? clock(tbl()[0].t, 1) : '-').padStart(6, ' '), x0 + 6, 132); return; }
        const best = Math.max(tbl()[0] ? tbl()[0].s : 0, you.score);
        box(x0, 122, w0, 20); txt('TOP', x0 + 4, 124, 2); txt(pad6(Math.min(999999, best)), x0 + 6, 132);
      }
      function drawPlay() {
        const sx = shake > 0 ? Math.round((Math.random() - 0.5) * shake) : 0, sy = shake > 0 ? Math.round((Math.random() - 0.5) * shake * 0.6) : 0;
        drawFrame(); fr(0, OX, OY, COLS * CS, H);
        g.save(); g.beginPath(); g.rect(OX, 0, COLS * CS, H); g.clip(); g.translate(sx, sy);
        drawWell(you, OX, OY, CS, paused);
        g.restore();
        if (gtype === 'V' && you.junkIn) { fr(3, 3, H - you.junkIn * 8, 10, you.junkIn * 8); fr((K.frame >> 3) % 2 ? 0 : 1, 4, H - you.junkIn * 8 + 1, 8, you.junkIn * 8 - 2); }
        drawPanel();
        if (flashT > 0) { g.fillStyle = P[3]; g.globalAlpha = 0.3; g.fillRect(OX, 0, COLS * CS, H); g.globalAlpha = 1; }
        if (bannerT > 0 && !paused) {
          const y = 46, um = unlockMsg && bannerT < 1.4, sb = !um && bannerSub, bounce = Math.round(Math.max(0, bannerT - 1.5) * 20);
          box(OX + 2, y - bounce, COLS * CS - 4, um ? 38 : sb ? 28 : 16); ctr(banner, y + 4 - bounce, 3, OX + 40);
          if (sb) ctr(bannerSub, y + 16 - bounce, (K.frame >> 2) % 2 ? 2 : 3, OX + 40);
          if (um) { const ws = unlockMsg.split(' '); ctr(ws.slice(0, 2).join(' '), y + 16, 2, OX + 40); ctr(ws.slice(2).join(' '), y + 26, 2, OX + 40); }
        }
        if (gtype === 'V' && vs.msgT > 0 && !vs.roundOver) { box(OX + 6, 52, 68, 30); ctr('ROUND ' + vs.round, 57, 3, OX + 40); ctr(vs.msgT > 0.6 ? 'READY' : 'GO!', 69, 2, OX + 40); }
        if (gtype === 'V' && vs.roundOver) { box(OX + 4, 44, 72, 42); ctr(vs.won ? 'YOU WIN' : 'CPU WINS', 49, 3, OX + 40); ctr('THE ROUND', 59, 3, OX + 40); ctr(`${vs.me} - ${vs.them}`, 72, 2, OX + 40); }
        if (paused) {
          box(OX + 2, 23, 76, 98); ctr('PAUSE', 29, 3, OX + 40);
          ['RESUME', 'MUSIC ' + (ST.opt.music ? 'ON' : 'OFF'), 'FX ' + (ST.opt.sfx ? 'ON' : 'OFF'), 'RESTART', 'SAVE+QUIT'].forEach((s, i) => txt((i === pauseI ? '>' : ' ') + s, OX + 8, 46 + i * 14, i === pauseI ? 3 : 2));
        }
        if (mode === 'over' && result && result.timed && overT > 0.3) { box(OX + 2, 40, 76, 44); ctr(gtype === 'U' ? 'TIME UP!' : result.won ? 'CLEAR!' : 'OOPS!', 45, 3, OX + 40); ctr(gtype === 'U' ? 'SCORE' : 'TIME', 58, 2, OX + 40); ctr(gtype === 'U' ? String(you.score) : clock(runT, 1), 69, 3, OX + 40); }
        else if (mode === 'over' && !(result && result.won)) { const n = Math.min(ROWS, overT * 22 | 0); for (let y = ROWS - n; y < ROWS; y++) for (let x = 0; x < COLS; x++) blk(1 + ((x + y) % 7), OX + x * CS, OY + y * CS); if (overT > 1) { box(OX + 6, 56, 68, 22); ctr('GAME OVER', 63, 3, OX + 40); } }
        else if (mode === 'over' && result && result.won && overT > 0.3) { box(OX + 2, 40, 76, 44); ctr('CLEARED!', 45, 3, OX + 40); ctr('BONUS', 58, 2, OX + 40); ctr(String(result.bonus), 69, 3, OX + 40); }
      }

      // ============================================================ the title screen, menus and the high-score table
      const LOGO = { B: ['110', '101', '110', '101', '110'], L: ['100', '100', '100', '100', '111'], O: ['111', '101', '101', '101', '111'], C: ['111', '100', '100', '100', '111'],
        K: ['101', '101', '110', '101', '101'], G: ['111', '100', '101', '101', '111'], Y: ['101', '101', '111', '010', '010'] };
      function drawLogo(y0) {
        const word = 'BLOCKOLOGY';
        for (let i = 0; i < word.length; i++) {
          const drop = Math.max(0, 1 - (logoT - i * 0.08) / 0.35), yy = y0 - Math.round(drop * drop * 60);
          if (logoT < i * 0.08) continue;
          const L = LOGO[word[i]];
          const Rp = colour() ? RAMPS[1 + i % 7] : null;
          L.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '1') return; const x = 6 + i * 15 + c * 4, y = yy + r * 4;
            if (Rp) { g.fillStyle = Rp[3]; g.fillRect(x, y, 4, 4); g.fillStyle = Rp[1]; g.fillRect(x, y, 3, 3); g.fillStyle = Rp[0]; g.fillRect(x, y, 1, 1); }
            else { fr(3, x, y, 4, 4); fr(i % 2 ? 1 : 2, x, y, 3, 3); fr(i % 2 ? 0 : 1, x, y, 1, 1); } }));
        }
      }
      function drawSkyline() { // a little town made of blocks along the bottom, and a rocket on its pad
        for (let x = 0; x < 15; x++) { const hh = 1 + ((x * 7 + 3) % 5); for (let y = 0; y < hh; y++) blk(1 + (x + y) % 7, x * 8, H - 8 - y * 8); }
        fr(2, 120, H - 8, 40, 8); fr(3, 120, H - 8, 40, 1); for (let x = 122; x < 160; x += 6) fr(1, x, H - 5, 3, 2); // the launch pad
        const rx = 138, ry = H - 8 - 34; // (the rocket just sits there, waiting for a big score)
        fr(3, rx - 3, ry, 7, 34); fr(0, rx - 2, ry + 2, 5, 30); fr(1, rx + 1, ry + 2, 1, 30); g.fillStyle = P[3]; g.beginPath(); g.moveTo(rx - 3, ry); g.lineTo(rx + 0.5, ry - 7); g.lineTo(rx + 4, ry); g.fill();
        g.beginPath(); g.moveTo(rx - 3, ry + 24); g.lineTo(rx - 7, ry + 34); g.lineTo(rx - 3, ry + 32); g.fill(); g.beginPath(); g.moveTo(rx + 4, ry + 24); g.lineTo(rx + 8, ry + 34); g.lineTo(rx + 4, ry + 32); g.fill();
        fr(3, rx + 9, ry - 4, 2, 38); fr(3, rx + 4, ry + 6, 5, 1); fr(3, rx + 4, ry + 18, 5, 1);
      }
      function sky() { // the title's sky: a soft gradient on the colour cartridge
        if (!colour()) { fr(0, 0, 0, W, H); return; }
        const bands = ['#f8f8e0', '#f0f0d8', '#e0f0f8', '#c8e0f8', '#b0d0f8', '#98c0f0'];
        bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 24, W, 24); });
      }
      function drawTitle() {
        sky();
        for (let i = 0; i < 18; i++) fr(1, (i * 37 + 11) % W, (i * 23) % 70 + 4, 1, 1);
        drawLogo(14);
        if (logoT > 1.1) { ctr('FALLING BLOCKS FOR', 42, 2); ctr(colour() ? 'YOUR GAME LAD COLOUR' : 'YOUR GAME LAD', 51, 2); }
        drawSkyline();
        if (logoT > 1.2) { if ((T * 2 | 0) % 2 === 0) { box(36, 62, 88, 16); ctr('PRESS START', 66, 3); } }
        ctr('(C)1999 BRICKWORKS', 82, 2); ctr('LICENSED BY LADWORKS', 91, 2);
      }
      function drawHiTable(type, y0, n, hl) {
        const L = ST.hi[type];
        for (let i = 0; i < Math.min(n, L.length); i++) {
          const e = L[i], y = y0 + i * 10, me = hl === e, blink = me && (K.frame >> 3) % 2;
          if (me) fr(blink ? 3 : 1, 6, y - 2, W - 12, 10);
          const c = blink ? 0 : 3;
          txt(`${i + 1}`, 10, y, blink ? 0 : 2); txt(e.n.padEnd(6, ' '), 22, y, c);
          if (type === 'L') { txt(clock(e.t, 1).padStart(6, ' '), 70, y, c); }
          else { txt(pad6(e.s), 70, y, c); txt((type === 'U' ? 'N' : 'L') + e.l, 124, y, blink ? 0 : 2); }
        }
      }
      const BOARDS = ['A', 'U', 'L', 'B'];
      function drawHiscores() {
        sky(); fr(3, 0, 0, W, 14); ctr('HALL OF FAME', 3, 0);
        const type = BOARDS[(idleT / 4 | 0) % BOARDS.length];
        box(14, 18, W - 28, 14); ctr(MODE_N[type], 21, 3);
        drawHiTable(type, 38, 5);
        ctr(type === 'L' ? 'FASTEST 40 LINES' : type === 'U' ? 'MOST IN 3 MINUTES' : 'TOP SCORES', 90, 2);
        drawSkyline();
      }
      const MENU = () => (resume ? ['CONTINUE'] : []).concat(['MARATHON', 'ULTRA', '40 LINES', 'B-TYPE', 'VS CPU', 'FLIGHT LOG', 'HALL OF FAME', 'OPTIONS', 'HOW TO PLAY']);
      const MODE_OF = { MARATHON: 'A', ULTRA: 'U', '40 LINES': 'L', 'B-TYPE': 'B', 'VS CPU': 'V' };
      function drawMenu() {
        sky(); fr(3, 0, 0, W, 14); ctr('BLOCKOLOGY', 3, 0);
        const items = MENU(); box(14, 17, W - 28, items.length * 10 + 7);
        items.forEach((s, i) => { const y = 21 + i * 10; if (i === menuI) fr(1, 16, y - 2, W - 32, 10); txt((i === menuI ? '→ ' : '  ') + s, 22, y, i === menuI ? 3 : 2); });
        const tip = { CONTINUE: 'CARRY ON WHERE YOU WERE', MARATHON: 'LEVELS GET FASTER', ULTRA: 'BIG SCORE IN 3 MINUTES', '40 LINES': 'RACE THE CLOCK', 'B-TYPE': 'CLEAR 25 LINES OF JUNK', 'VS CPU': 'BEAT THE GAME LAD', 'HALL OF FAME': 'THE HIGH-SCORE TABLES', 'FLIGHT LOG': '60 STAMPS TO COLLECT', OPTIONS: 'PICTURE, MUSIC, SOUND', 'HOW TO PLAY': 'THE CONTROLS' }[items[menuI]];
        box(0, 126, W, 18); ctr(tip || '', 131, 3);
        if (menuI === 0 && !resume) {} // (nothing to carry on)
      }
      function drawMusic() {
        fr(0, 0, 0, W, H); fr(3, 0, 0, W, 14); ctr('MUSIC TYPE', 3, 0);
        const n = TUNES.length + 1;
        for (let i = 0; i < n; i++) {
          const locked = i < TUNES.length && TUNES[i].lock && !ST.un.d, s = i < TUNES.length ? (locked ? 'D: ???' : TUNES[i].name) : 'OFF';
          const y = 26 + i * 16; box(24, y, 112, 14); if (i === ST.mus) { fr(3, 25, y + 1, 110, 12); }
          txt(s, 32, y + 3, i === ST.mus ? 0 : locked ? 1 : 3);
          if (i === ST.mus && (K.frame >> 4) % 2) { fr(i === ST.mus ? 0 : 3, 116, y + 4, 2, 6); fr(0, 118, y + 3, 4, 4); }
        }
        box(0, 122, W, 22); ctr('A: OK   B: BACK', 129, 3);
      }
      function drawLevel() {
        sky(); fr(3, 0, 0, W, 14); ctr(MODE_N[gtype], 3, 0);
        txt('LEVEL', 8, 20, 2);
        for (let i = 0; i < 10; i++) { const x = 8 + (i % 5) * 14, y = 30 + (i / 5 | 0) * 14, on = i === ST.lv; box(x, y, 13, 13); if (on && (sub === 0 ? (K.frame >> 3) % 2 : 1)) fr(3, x + 1, y + 1, 11, 11); txt(String(i), x + 4, y + 3, on && (sub === 0 ? (K.frame >> 3) % 2 : 1) ? 0 : 3); }
        if (gtype === 'B') {
          txt('HEIGHT', 88, 20, 2);
          for (let i = 0; i < 6; i++) { const x = 90 + (i % 3) * 22, y = 30 + (i / 3 | 0) * 14, on = i === ST.bh; box(x, y, 20, 13); if (on && (sub === 1 ? (K.frame >> 3) % 2 : 1)) fr(3, x + 1, y + 1, 18, 11); txt(String(i), x + 7, y + 3, on && (sub === 1 ? (K.frame >> 3) % 2 : 1) ? 0 : 3); }
        }
        if (gtype === 'V') {
          txt('CPU', 90, 20, 2);
          CPU_LV.forEach((c, i) => { const y = 30 + i * 12, on = i === ST.cpu, locked = i === 2 && !ST.un.hard; if (on && sub === 1) fr(3, 88, y - 2, 70, 11); txt((locked ? 'HARD ?' : c.n), 92, y, on && sub === 1 ? 0 : locked ? 1 : on ? 3 : 2); });
          box(0, 70, W, 50); ctr('CLEAR 2, 3 OR 4 LINES', 76, 3); ctr('TO DUMP JUNK ON THE', 86, 3); ctr('CPU. FIRST TO 3 WINS.', 96, 3); ctr(`MATCHES WON: ${ST.stat.wins}`, 108, 2);
        } else {
          if (gtype !== 'B') { box(88, 26, 66, 34); txt(gtype === 'U' ? '3 MINUTES' : gtype === 'L' ? '40 LINES' : 'ENDLESS', 92, 32, 3); txt(gtype === 'L' ? 'FAST AS' : gtype === 'U' ? 'SCORE BIG' : 'KEEP ON', 92, 42, 2); txt(gtype === 'L' ? 'YOU CAN!' : gtype === 'U' ? 'QUICK!' : 'STACKING!', 92, 50, 2); }
          box(0, 62, W, 58); ctr('TOP 3', 66, 2); drawHiTable(gtype, 78, 3);
          const pb = gtype === 'L' ? (ST.pb.L ? clock(ST.pb.L, 1) : '-') : String(ST.pb[gtype] || 0); ctr('YOUR BEST ' + pb, 110, 2);
        }
        box(0, 122, W, 22); ctr(gtype === 'B' || gtype === 'V' ? (sub === 0 ? 'A: NEXT   B: BACK' : 'A: START   B: BACK') : 'A: START   B: BACK', 129, 3);
      }
      function drawOptions() {
        sky(); fr(3, 0, 0, W, 14); ctr('CARTRIDGE OPTIONS', 3, 0);
        const rows = [['PICTURE', colour() ? 'COLOUR' : 'CLASSIC'], ['GHOST', ST.opt.ghost ? 'ON' : 'OFF'], ['HOLD', ST.opt.hold ? 'ON' : 'OFF'], ['MUSIC', ST.opt.music ? 'ON' : 'OFF'], ['SOUND FX', ST.opt.sfx ? 'ON' : 'OFF'], ['BACK', '']];
        rows.forEach(([a, b], i) => { const y = 23 + i * 15; if (i === sub) fr(1, 6, y - 3, W - 12, 13); txt((i === sub ? '>' : ' ') + a, 10, y); if (b) txt(b, W - 10 - F.width(b), y, 3); });
        box(4, 116, W - 8, 25); ctr('LINES ' + ST.stat.lines, 120, 3); ctr('FOUR-ROWS ' + ST.stat.blockos, 131, 2);
      }
      function drawFlights() {
        sky(); fr(3, 0, 0, W, 14); ctr('B-TYPE FLIGHT LOG', 3, 0);
        txt('LV', 3, 20, 2); for (let lv = 0; lv < 10; lv++) txt(String(lv), 26 + lv * 13, 20, 3);
        for (let h = 0; h < 6; h++) {
          txt(String(h), 9, 34 + h * 13, 2);
          for (let lv = 0; lv < 10; lv++) {
            const x = 24 + lv * 13, y = 31 + h * 13, on = logLv === lv && logH === h, done = ST.flights[lv + '-' + h];
            fr(3, x, y, 11, 11); fr(on ? 3 : done ? 1 : 0, x + 1, y + 1, 9, 9);
            if (done) txt('*', x + 3, y + 2, on ? 0 : 3); else if (on) txt('>', x + 3, y + 2, 0);
          }
        }
        const n = Object.keys(ST.flights).length;
        ctr(n + '/60 FLIGHTS CLEARED', 112, 3);
        ctr(ST.un.ending ? 'SELECT: ENDING' : '9-5: SHUTTLE FINALE', 123, 2);
        ctr('A: FLY   B: BACK', 135, 3);
      }
      const credits = () => [
        'BLOCKOLOGY', 'THE BRICKWORKS CREW', '',
        'CHIEF BLOCKOLOGIST', castName('me'), '',
        'STACK INSPECTORS', castName('mate1'), castName('mate2'), '',
        'GRAVITY DEPARTMENT', castName('mate3'), castName('mate4'), '',
        'QUALITY CONTROL', castName('sister'), '',
        'MUSIC AND MACHINERY', 'THE SOUND CHIP', '',
        'NO BRICKS WERE HARMED', 'JUST REARRANGED.', '',
        Object.keys(ST.flights).length === 60 ? 'ALL 60 FLIGHTS CLEARED!' : 'THE SHUTTLE IS HOME!',
        'THANKS FOR PLAYING', '', 'BRICKWORKS 1999', 'THE END',
      ];
      function startCredits(back) { creditPrior = back === 'flights' && resume && resume.cart ? resume.cart.mode : null; mode = 'credits'; creditT = 0; creditBack = back || 'afterOver'; music(TUNES[3]); checkpoint(); }
      function drawCredits() {
        fr(3, 0, 0, W, H);
        for (let i = 0; i < 30; i++) fr(i % 3 ? 1 : 0, (i * 53) % W, ((i * 29 + creditT * 3) % H) | 0, 1, 1);
        const lines = credits(), offset = Math.min(creditT * 12, lines.length * 14 + 36);
        lines.forEach((line, i) => { const y = Math.round(130 + i * 14 - offset); if (y > 18 && y < 126) ctr(line, y, i % 3 === 0 ? 1 : 0); });
        fr(3, 0, 0, W, 16); ctr('FLIGHT COMPLETE', 4, 0);
        if (creditT > 4) { fr(3, 0, 132, W, 12); ctr(creditBack === 'flights' ? 'A / START: FLIGHT LOG' : 'A / START: RESULTS', 135, 1); }
      }
      const HOW = [
        ['HOW TO PLAY  1/4', 'BLOCKS FALL DOWN THE', 'WELL. FILL A WHOLE ROW', 'AND IT DISAPPEARS.', '', 'FOUR ROWS AT ONCE IS A', 'BLOCKOLOGY: BIG POINTS!', 'DON\'T LET THEM REACH', 'THE TOP!'],
        ['CONTROLS  2/4', '← →   MOVE', 'A     TURN RIGHT', 'B     TURN LEFT', '↓     DROP FASTER', '↑     DROP ALL THE WAY', 'SELECT  HOLD A PIECE', 'START   PAUSE'],
        ['GAME TYPES  3/4', 'MARATHON: KEEP GOING,', ' LEVEL UP EVERY 10 LINES', 'ULTRA: TOP SCORE IN 3 MIN', '40 LINES: BEAT THE CLOCK', 'B-TYPE: 25 LINES OF JUNK', 'VS CPU: FIRST TO 3 WINS', 'BIG SCORES = ROCKETS!'],
        ['FLIGHT SCHOOL  4/4', 'B-TYPE HAS 60 FLIGHTS.', 'PICK A LEVEL AND HEIGHT.', 'CLEAR 25 LINES FOR A', 'STAMP IN YOUR FLIGHT LOG.', 'THEN TRY THE NEXT FLIGHT.', '9-5: THE SHUTTLE FINALE!', 'A FOUR-ROW UNLOCKS TUNE D.'],
      ];
      function drawHow() {
        sky(); const pg = HOW[sub];
        fr(3, 0, 0, W, 14); ctr(pg[0], 3, 0);
        pg.slice(1).forEach((l, i) => txt(l, 8, 22 + i * 13, 3));
        box(0, 128, W, 16); ctr(sub < HOW.length - 1 ? 'A: NEXT PAGE' : 'A: BACK', 132, 3);
      }
      function drawEntry() {
        sky(); fr(3, 0, 0, W, 14); ctr('NEW HIGH SCORE!', 3, (K.frame >> 3) % 2 ? 0 : 1);
        fireworks();
        ctr(MODE_N[gtype] + '  ' + (gtype === 'L' ? clock(runT, 1) : you.score), 22, 2);
        ctr('ENTER YOUR INITIALS', 38, 3);
        for (let i = 0; i < 3; i++) { const x = 56 + i * 18, on = i === entry.i; box(x, 52, 14, 18); txt(ABC[entry.name[i]], x + 4, 57, 3); if (on && (K.frame >> 3) % 2) fr(3, x + 3, 67, 8, 1); if (on) { txt('↑', x + 4, 44, 2); txt('↓', x + 4, 72, 2); } }
        box(0, 86, W, 58); ctr('↑↓ LETTER  ← → MOVE', 92, 2); ctr('A: NEXT LETTER', 104, 2); ctr('START: DONE', 116, 2);
      }
      let sparks = [];
      function fireworks() { // the hall-of-fame fireworks: little bursts in the piece colours
        if (K.frame % 24 === 0) { const cx = 20 + Math.random() * 120, cy = 20 + Math.random() * 50, k = 1 + (Math.random() * 7 | 0); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; sparks.push({ x: cx, y: cy, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2, t: 0, k }); } if (sparks.length < 60) sfx.noise(0.15, 0.04, 3000, 0, 'highpass'); }
        for (const s of sparks) { s.t++; s.x += s.vx; s.y += s.vy; s.vy += 0.03; g.fillStyle = colour() ? RAMPS[s.k][s.t < 20 ? 0 : 1] : P[s.t < 20 ? 3 : 2]; g.fillRect(s.x | 0, s.y | 0, 2, 2); }
        sparks = sparks.filter(s => s.t < 40);
      }
      function drawResult() {
        sky(); const fame = gtype !== 'V' && myRow && tbl().includes(myRow);
        fr(3, 0, 0, W, 14); ctr(gtype === 'V' ? 'MATCH OVER' : fame ? 'HALL OF FAME!' : MODE_N[gtype] + ' RESULTS', 3, fame && (K.frame >> 3) % 2 ? 1 : 0);
        if (fame) fireworks();
        if (gtype === 'V') { ctr(vs.matchWon ? 'YOU BEAT THE GAME LAD!' : 'THE GAME LAD WINS!', 26, 3); ctr(`${vs.me} - ${vs.them}`, 40, 3); ctr('LINES ' + vs.lines, 54, 2); ctr('SCORE ' + vs.total, 66, 2); if (unlockMsg) ctr(unlockMsg, 82, 3); }
        else { ctr(gtype === 'L' ? 'TIME ' + (result && result.won ? clock(runT, 1) : '--') : 'SCORE ' + you.score, 20, 3); ctr(`LEVEL ${you.level}  LINES ${you.lines}`, 30, 2); drawHiTable(gtype, 44, 5, myRow); if (unlockMsg) ctr(unlockMsg, 98, 3); }
        if (gtype === 'B' && result && result.won) {
          fr(0, 0, 96, W, 32); ctr('FLIGHT ' + you.sl + '-' + you.bh + ' STAMPED!', 99, 3);
          ctr(Object.keys(ST.flights).length + '/60 CLEARED', 111, 2);
          if (you.sl === 9 && you.bh === 5) ctr('SELECT: CREDITS', 122, 2);
        }
        box(0, 130, W, 14); ctr(gtype === 'B' && result && result.won ? 'A: NEXT   B: MENU' : 'A: RETRY  B: MENU', 134, 3);
      }
      let axisX = 0, axisY = 0;
      let myRow = null, creditT = 0, creditBack = 'afterOver', creditPrior = null, counted = false, logLv = ST.lv, logH = ST.bh;

      // ============================================================ the attract demo (the computer plays on its own)
      function startDemo() { demo = { w: makeWell({ level: 5, hold: false }), c: { lv: CPU_LV[1] }, t: 0 }; spawn(demo.w); mode = 'demo'; music(null); }
      function drawDemo() {
        drawFrame(); drawWell(demo.w, OX, OY, CS);
        const x0 = 106; box(x0, 2, 52, 22); txt('SCORE', x0 + 4, 5, 2); txt(pad6(demo.w.score), x0 + 6, 14);
        box(x0, 26, 52, 22); txt('LEVEL ' + demo.w.level, x0 + 4, 29); txt('LINE ' + demo.w.lines, x0 + 4, 38);
        box(x0, 50, 52, 36); txt('NEXT', x0 + 4, 53, 2); if (demo.w.next) pieceAt(demo.w.next, x0 + 26, 74, 8);
        if ((K.frame >> 5) % 2) { box(OX + 14, 60, 52, 16); ctr('DEMO', 64, 3, OX + 40); }
        box(x0, 100, 52, 40); ctr('PRESS', 106, 3, x0 + 26); ctr('START', 118, 3, x0 + 26);
      }

      // ============================================================ the loop
      window.__blocksDbg = () => ({ mode, gtype, paused, menuI, sub, runT, creditT, flights: ST.flights, cur: you && you.cur, next: you && you.next, hold: you && you.hold, canHold: you && you.canHold, clearing: you && you.clearing, grid: you && you.grid, pieces: you && you.pieces, stat: ST.stat, score: you && you.score, lines: you && you.lines, level: you && you.level, junk: you && you.junkIn, cpu: cpu && { lines: cpu.lines, junk: cpu.junkIn, top: stackTop(cpu) }, vs, hi: ST.hi, un: ST.un, opt: ST.opt, resume: !!resume, entry: entry && entry.name.map(i => ABC[i]).join(''), rocket: rocket && rocket.size,
        cheat: { hint: () => you && you.cur ? plan(you, you.cur.k, 0) : null, time: t => { runT = t; }, iPiece: () => { you.cur = { k: 'I', r: 1, x: 7, y: 0 }; }, finish: () => { if (gtype === 'L') { you.lines = SPRINT; timedEnd(true); } else runT = ULTRA_T; }, top: () => { you.grid = emptyGrid().map((r, y) => { if (y < 2) return r; const a = Array(COLS).fill(JUNK); a[y % COLS] = 0; return a; }); }, lines: n => { you.lines = n; }, score: s => { you.score = s; }, die: () => die(you), cpuDie: () => cpu && die(cpu), setRow: () => { you.grid = emptyGrid(); for (let y = ROWS - 4; y < ROWS; y++) { you.grid[y] = Array(COLS).fill(8); you.grid[y][9] = 0; } } } });
      setPal();
      if (!(loaded.cart && !loaded.cart.parked && restoreCart(loaded.cart))) {
        if (loaded.ui && ['title', 'menu', 'music', 'level', 'opts', 'how', 'flights', 'hiscores'].includes(loaded.ui.mode)) {
          mode = loaded.ui.mode; menuI = loaded.ui.menuI || 0; sub = loaded.ui.sub || 0; gtype = loaded.ui.gtype || 'A';
          logLv = loaded.ui.logLv || 0; logH = loaded.ui.logH || 0;
        }
        music(mode === 'music' ? tune() : TITLE_TUNE);
      }
      const onHide = () => { if (document.hidden) checkpoint(); };
      addEventListener('beforeunload', checkpoint);
      addEventListener('pagehide', checkpoint);
      document.addEventListener('visibilitychange', onHide);
      return {
        update() {
          T += 1 / 60; logoT += 1 / 60;
          saveT += 1 / 60; if (saveT >= 1) { saveT = 0; checkpoint(); }
          if (!paused && shake > 0) shake = Math.max(0, shake - 0.4); if (!paused && flashT > 0) flashT -= 1 / 60; if (!paused && bannerT > 0) { bannerT -= 1 / 60; if (bannerT <= 0) unlockMsg = mode === 'play' ? '' : unlockMsg; }
          const ok = K.pressed('a') || K.pressed('start'), back = K.pressed('b');
          const stick = K.stick ? K.stick() : { x: 0, y: 0 }, ax = Math.abs(stick.x) > 0.55 ? Math.sign(stick.x) : 0, ay = Math.abs(stick.y) > 0.55 ? Math.sign(stick.y) : 0;
          const up = K.pressed('up') || ay === -1 && axisY !== -1, dn = K.pressed('down') || ay === 1 && axisY !== 1;
          const lf = K.pressed('left') || ax === -1 && axisX !== -1, rt = K.pressed('right') || ax === 1 && axisX !== 1, mv = up || dn || lf || rt;
          axisX = ax; axisY = ay;
          const beep = (f) => sfx.tone(f || 880, 0.03, 'square', 0.05);
          if (mode === 'title' || mode === 'hiscores' || mode === 'demo') {
            idleT += 1 / 60;
            if (mode === 'hiscores' && (lf || rt)) { idleT = (Math.floor(idleT / 4) + (rt ? 1 : BOARDS.length - 1)) % BOARDS.length * 4; beep(); return; }
            if (mode === 'demo') { stepWell(demo.w, cpuInput(demo.c, demo.w)); demo.t += 1 / 60; if (demo.w.dead || demo.t > 30) { mode = 'hiscores'; idleT = 0; } }
            if (mode === 'title' && idleT > 9) { startDemo(); idleT = 0; }
            if (mode === 'hiscores' && idleT > 16) { mode = 'title'; idleT = 0; logoT = 0; music(TITLE_TUNE); }
            if (ok || back || mv || K.pressed('select')) { if (mode !== 'title') { mode = 'title'; idleT = 0; music(TITLE_TUNE); return; } if (ok) { mode = 'menu'; menuI = 0; sfx.tone(1320, 0.08); } idleT = 0; }
            return;
          }
          if (mode === 'menu') {
            const items = MENU();
            if (up) { menuI = (menuI + items.length - 1) % items.length; beep(); } if (dn) { menuI = (menuI + 1) % items.length; beep(); }
            if (back) { mode = 'title'; idleT = 0; return; }
            if (ok) {
              const it = items[menuI]; sfx.tone(1320, 0.06);
              if (it === 'CONTINUE') return resume.cart ? restoreCart(resume.cart) : startGame('A', resume);
              if (MODE_OF[it]) { gtype = MODE_OF[it]; mode = 'music'; previewTune(); }
              else if (it === 'HALL OF FAME') { mode = 'hiscores'; idleT = 0; }
              else if (it === 'FLIGHT LOG') { mode = 'flights'; logLv = ST.lv; logH = ST.bh; }
              else if (it === 'OPTIONS') { mode = 'opts'; sub = 0; }
              else if (it === 'HOW TO PLAY') { mode = 'how'; sub = 0; }
            }
            return;
          }
          if (mode === 'music') {
            const n = TUNES.length + 1, okI = i => !(i < TUNES.length && TUNES[i].lock && !ST.un.d);
            if (up || dn) { let i = ST.mus; do { i = (i + (up ? n - 1 : 1)) % n; } while (!okI(i)); ST.mus = i; beep(); previewTune(); persist(resume); }
            if (back) { mode = 'menu'; music(TITLE_TUNE); return; }
            if (ok) { mode = 'level'; sub = 0; beep(1320); }
            return;
          }
          if (mode === 'level') {
            if (sub === 0) { if (lf) ST.lv = (ST.lv + 9) % 10; if (rt) ST.lv = (ST.lv + 1) % 10; if (up || dn) ST.lv = (ST.lv + 5) % 10; if (mv) beep(); }
            else if (gtype === 'B') { if (lf) ST.bh = (ST.bh + 5) % 6; if (rt) ST.bh = (ST.bh + 1) % 6; if (up || dn) ST.bh = (ST.bh + 3) % 6; if (mv) beep(); }
            else if (gtype === 'V') { const n = ST.un.hard ? 3 : 2; if (up || lf) ST.cpu = (ST.cpu + n - 1) % n; if (dn || rt) ST.cpu = (ST.cpu + 1) % n; if (mv) beep(); }
            if (back) { if (sub) sub = 0; else { mode = 'music'; } beep(500); return; }
            if (ok) {
              beep(1320);
              if ((gtype === 'B' || gtype === 'V') && sub === 0) { sub = 1; return; }
              persist(resume);
              if (gtype === 'V') { vs = { me: 0, them: 0, round: 1, lines: 0, msgT: 2, roundOver: 0 }; }
              entry = null; rocket = null; unlockMsg = ''; myRow = null; sparks = []; heartOn = (K.held('down') || ay === 1) && gtype !== 'V'; // (the old secret: hold Down as you start for HEART mode)
              startGame(gtype);
            }
            return;
          }
          if (mode === 'opts') {
            if (up) { sub = (sub + 5) % 6; beep(); } if (dn) { sub = (sub + 1) % 6; beep(); }
            const keep = () => persist(resume);
            if ((ok || lf || rt) && sub === 0) { ST.opt.pal = ST.opt.pal ? 0 : 1; setPal(); beep(1100); keep(); }
            else if ((ok || lf || rt) && sub === 1) { ST.opt.ghost = ST.opt.ghost ? 0 : 1; beep(1100); keep(); }
            else if ((ok || lf || rt) && sub === 2) { ST.opt.hold = ST.opt.hold ? 0 : 1; beep(1100); keep(); }
            else if ((ok || lf || rt) && sub === 3) { ST.opt.music = ST.opt.music ? 0 : 1; music(TITLE_TUNE); beep(); keep(); }
            else if ((ok || lf || rt) && sub === 4) { ST.opt.sfx = ST.opt.sfx ? 0 : 1; beep(); keep(); }
            else if ((ok && sub === 5) || back) { mode = 'menu'; beep(500); }
            return;
          }
          if (mode === 'how') { if (ok || rt) { sub++; beep(); if (sub >= HOW.length) { mode = 'menu'; sub = 0; } } if (back || lf) { if (sub) sub--; else mode = 'menu'; beep(500); } return; }
          if (mode === 'flights') {
            if (lf) logLv = (logLv + 9) % 10; if (rt) logLv = (logLv + 1) % 10;
            if (up) logH = (logH + 5) % 6; if (dn) logH = (logH + 1) % 6;
            if (mv) beep();
            if (back) mode = 'menu';
            if (K.pressed('select') && ST.un.ending) startCredits('flights');
            if (ok) { ST.lv = logLv; ST.bh = logH; gtype = 'B'; mode = 'music'; previewTune(); }
            return;
          }
          if (mode === 'credits') {
            creditT += 1 / 60;
            if ((creditT > 4 && ok) || creditT > 45) {
              if (creditBack === 'afterOver' && you && result) afterOver();
              else {
                // Replaying the staff roll must preserve the parked game behind the log.
                const toResult = creditBack === 'result' && you;
                if (!toResult) { const pr = creditPrior ? progress() : null; if (pr) { pr.cart.mode = creditPrior; pr.cart.parked = true; } resume = pr; }
                mode = toResult ? 'result' : 'flights'; overT = 0; music(TITLE_TUNE); checkpoint();
              }
            }
            return;
          }
          if (mode === 'rocket') return stepRocket();
          if (mode === 'entry') {
            const e = entry;
            if (up) { e.name[e.i] = (e.name[e.i] + 1) % ABC.length; beep(); } if (dn) { e.name[e.i] = (e.name[e.i] + ABC.length - 1) % ABC.length; beep(); }
            if (lf) { e.i = Math.max(0, e.i - 1); beep(700); } if (rt) { e.i = Math.min(2, e.i + 1); beep(700); }
            if (back) { e.i = Math.max(0, e.i - 1); beep(500); }
            if (K.pressed('a')) { if (e.i < 2) { e.i++; beep(1100); } else finishEntry(); }
            else if (K.pressed('start')) finishEntry();
            return;
          }
          if (mode === 'result' || mode === 'vsend') {
            overT += 1 / 60;
            if (mode === 'vsend' && overT > 2.5 && !entry) { mode = 'result'; overT = 0; return; }
            if (mode === 'result' && overT > 1) {
              report();
              if (K.pressed('select') && ST.un.ending) { startCredits('result'); return; }
              if (back) { resume = null; you = null; mode = 'menu'; menuI = 0; music(TITLE_TUNE); persist(null); return; }
              if (ok) {
                if (gtype === 'B' && result && result.won) { const n = (you.sl * 6 + you.bh + 1) % 60; ST.lv = Math.floor(n / 6); ST.bh = n % 6; }
                if (gtype === 'V') vs = { me: 0, them: 0, round: 1, lines: 0, msgT: 2, roundOver: 0 };
                entry = null; rocket = null; myRow = null; unlockMsg = ''; startGame(gtype);
              }
            }
            return;
          }
          if (mode === 'over') {
            overT += 1 / 60; stepWell(you, {});
            if (overT > 2.2) { if (!counted) { ST.stat.lines += you.lines; counted = true; } afterOver(); }
            return;
          }
          if (mode !== 'play') return;
          // ---------------------------------------------------------------- playing
          if (paused) {
            if (K.pressed('start')) { paused = false; resumeScoring(); playTune(); return; }
            if (up) { pauseI = (pauseI + 4) % 5; beep(); } if (dn) { pauseI = (pauseI + 1) % 5; beep(); }
            if (K.pressed('a')) {
              if (pauseI === 0) { paused = false; resumeScoring(); playTune(); }
              else if (pauseI === 1) { ST.opt.music = ST.opt.music ? 0 : 1; checkpoint(); }
              else if (pauseI === 2) { ST.opt.sfx = ST.opt.sfx ? 0 : 1; checkpoint(); }
              else if (pauseI === 3) { entry = null; rocket = null; myRow = null; if (gtype === 'V') vs = { me: 0, them: 0, round: 1, lines: 0, msgT: 2, roundOver: 0 }; resume = null; startGame(gtype); }
              else { checkpoint(); if (resume && resume.cart) resume.cart.parked = true; persist(resume); mode = 'title'; logoT = 0; idleT = 0; paused = false; music(TITLE_TUNE); }
              beep(1200);
            }
            return;
          }
          if (K.pressed('start')) { paused = true; pauseI = 0; music(null); sfx.tone(440, 0.06); checkpoint(); return; }
          if (gtype === 'V') {
            if (vs.msgT > 0) { vs.msgT -= 1 / 60; return; }
            if (vs.roundOver) { vs.endT += 1 / 60; stepWell(you, {}); stepWell(cpu, {}); if (vs.endT > 2.4) nextRound(); return; }
          }
          runT += 1 / 60;
          if (gtype === 'U' && runT >= ULTRA_T && !you.clearing) return timedEnd(true);
          if (gtype === 'U' && ULTRA_T - runT < 10 && K.frame % 60 === 0) sfx.tone(1200, 0.05, 'square', 0.06);
          const inp = { l: K.held('left') || ax === -1, r: K.held('right') || ax === 1, dn: K.held('down') || ay === 1, pl: lf, pr: rt, ra: K.pressed('a'), rb: K.pressed('b'), hd: up, hold: K.pressed('select') };
          stepWell(you, inp);
          if (gtype === 'V' && cpu && mode === 'play' && !vs.roundOver) stepWell(cpu, cpuInput(cpuC, cpu));
          if (mode !== 'play') return;
          const dz = stackTop(you) < 5;
          if (dz !== danger) { danger = dz; playTune(); }
        },
        draw() {
          if (mode === 'title') drawTitle();
          else if (mode === 'hiscores') drawHiscores();
          else if (mode === 'demo') drawDemo();
          else if (mode === 'menu') drawMenu();
          else if (mode === 'music') drawMusic();
          else if (mode === 'level') drawLevel();
          else if (mode === 'opts') drawOptions();
          else if (mode === 'flights') drawFlights();
          else if (mode === 'credits') drawCredits();
          else if (mode === 'how') drawHow();
          else if (mode === 'rocket' && rocket) drawRocket();
          else if (mode === 'entry') drawEntry();
          else if (mode === 'result') drawResult();
          else if (you) drawPlay();
        },
        end() { checkpoint(); music(null); removeEventListener('beforeunload', checkpoint); removeEventListener('pagehide', checkpoint); document.removeEventListener('visibilitychange', onHide); },
      };
      function previewTune() { const t = ST.mus < TUNES.length ? TUNES[ST.mus] : null; music(t); }
      function finishEntry() {
        const n = entry.name.map(i => ABC[i]).join('') || initials('me');
        const L = tbl(); myRow = Object.assign({ n }, myEntry()); L.push(myRow);
        L.sort((a, b) => gtype === 'L' ? a.t - b.t : b.s - a.s); L.length = Math.min(L.length, 5);
        jingle([[72, 0.25], [76, 0.25], [79, 0.25], [84, 0.25], [79, 0.25], [84, 1]], 280);
        mode = 'result'; overT = 0; checkpoint();
      }
    },
  });
})();

/* era-apps-sweep: Bugsweeper 2000 (was Squigsweeper), lazily loaded by era-apps.js. The JackOS 98 bug-finding classic: three levels plus Custom,
 * LCD counters, the smiley, flags and ? marks, chords, Best Times, and a certain magic word from an old text adventure. */
(function () {
  'use strict';
  const E = window.Era; if (!E) return;
  const store = E.store, esc = E.esc, h = E.h;
  const LEVELS = { beginner: { w: 8, h: 8, m: 10, n: 'Beginner' }, intermediate: { w: 16, h: 16, m: 40, n: 'Intermediate' }, expert: { w: 30, h: 16, m: 99, n: 'Expert' } };
  const DEF_BEST = { beginner: [14, 'Jack'], intermediate: [61, Cast.n('teacher')], expert: [999, 'Anonymous'] };
  const CFG_KEY = 'jhp_era_sweep', BEST_KEY = 'jhp_era_sweep_best';
  const touchUI = () => matchMedia('(pointer:coarse)').matches || matchMedia('(hover:none)').matches;

  E.css('sweep', `
.era-w-sweeper{min-width:0}
.era-w-sweeper > .appbody{padding:0;background:#c0c0c0}
.sw-wrap{display:inline-block;background:#c0c0c0;border:3px solid;border-color:#fff #808080 #808080 #fff;padding:6px;vertical-align:top;-webkit-user-select:none;user-select:none}
.sw-top{position:sticky;top:-6px;z-index:1;background:#c0c0c0;display:flex;justify-content:space-between;align-items:center;height:37px;border:2px solid;border-color:#808080 #fff #fff #808080;padding:0 5px;margin-bottom:6px}
.sw-lcd{display:block;width:41px;height:25px}
.sw-face{width:26px;height:26px;padding:0;border:0;background:none;cursor:default;display:block}
.sw-face canvas{display:block;width:26px;height:26px}
.sw-field{display:inline-block;border:3px solid;border-color:#808080 #fff #fff #808080;line-height:0}
.sw-field canvas{display:block;touch-action:manipulation;cursor:default;max-width:none!important;max-height:none!important}
.sw-wrap canvas{max-width:none!important}
.sw-touch{display:flex;align-items:center;gap:6px;margin-top:6px;font:11px var(--ui)}
.sw-touch .btn{display:flex;align-items:center;gap:4px;padding:2px 8px;min-height:30px}
.sw-touch .btn canvas{width:16px;height:16px}
.sw-dlg p{margin:0 0 8px}
.sw-best{display:grid;grid-template-columns:auto auto 1fr;gap:4px 14px;margin:4px 0 10px}
.sw-cust{display:grid;grid-template-columns:auto 60px;gap:6px 10px;align-items:center}
.sw-cust input{width:60px}
#swPixel{position:fixed;left:0;top:0;width:1px;height:1px;z-index:2147483647;pointer-events:none;background:#fff}
`);

  // ---- tiny pixel art (one character = one pixel, scaled to the cell)
  const DIG = {
    1: ['...##...', '..###...', '.####...', '...##...', '...##...', '...##...', '...##...', '.######.', '.######.'],
    2: ['.######.', '##....##', '......##', '.....##.', '...###..', '.###....', '##......', '########', '########'],
    3: ['.######.', '##....##', '......##', '...####.', '...####.', '......##', '......##', '##....##', '.######.'],
    4: ['....###.', '...####.', '..##.##.', '.##..##.', '##...##.', '########', '########', '.....##.', '.....##.'],
    5: ['########', '##......', '##......', '#######.', '......##', '......##', '......##', '##....##', '.######.'],
    6: ['.######.', '##....##', '##......', '#######.', '##....##', '##....##', '##....##', '##....##', '.######.'],
    7: ['########', '########', '......##', '.....##.', '....##..', '...##...', '...##...', '..##....', '..##....'],
    8: ['.######.', '##....##', '##....##', '.######.', '##....##', '##....##', '##....##', '##....##', '.######.'],
  };
  const QMARK = ['.######.', '##....##', '......##', '....###.', '...##...', '...##...', '........', '...##...', '...##...'];
  const SQUIG = [ // the mine: a red-and-black Y2K millennium bug (a beetle seen from above)
    '.K.......K.',
    '..K.....K..',
    '...KKKKK...',
    '...KWKWK...',
    'K.KKKKKKK.K',
    '.KWRRKRRRK.',
    'KKRKRKRKDKK',
    '.KRRRKRRDK.',
    'KKRKRKRKDKK',
    '.KRRDKRDDK.',
    '..KKKKKKK..',
  ];
  const FLAG = ['....RRK...', '..RRRRK...', 'RRRRRRK...', '..RRRRK...', '....RRK...', '......K...', '......K...', '....KKKK..', '..KKKKKKKK', '..KKKKKKKK'];
  const NUMCOL = { 1: '#0000ff', 2: '#008000', 3: '#ff0000', 4: '#000080', 5: '#800000', 6: '#008080', 7: '#000000', 8: '#808080' };
  function bits(g, rows, x, y, p, pal) {
    for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
      const col = pal[rows[r][c]]; if (!col) continue;
      g.fillStyle = col; g.fillRect(x + c * p, y + r * p, p, p);
    }
  }

  // ---- 7-segment LCD (3 digits, 13x23 each, like the real one)
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
  function drawLCD(cv, value, mono) {
    const d = window.devicePixelRatio || 1, g = cv.getContext('2d');
    if (cv.width !== 41 * d) { cv.width = 41 * d; cv.height = 25 * d; }
    g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = '#808080'; g.fillRect(0, 0, 41, 1); g.fillRect(0, 0, 1, 25);
    g.fillStyle = '#fff'; g.fillRect(40, 0, 1, 25); g.fillRect(0, 24, 41, 1);
    g.fillStyle = '#000'; g.fillRect(1, 1, 39, 23);
    let v = Math.max(-99, Math.min(999, value | 0));
    const s = v < 0 ? '-' + String(-v).padStart(2, '0') : String(v).padStart(3, '0');
    const on = mono ? '#fff' : '#ff0000', off = mono ? '#262626' : '#2c0000';
    const P = { a: [[1, 0], [10, 0], [8, 2], [3, 2]], f: [[0, 1], [2, 3], [2, 8.5], [0, 10]], b: [[11, 1], [11, 10], [9, 8.5], [9, 3]],
      g: [[1, 10.5], [2.5, 9.5], [8.5, 9.5], [10, 10.5], [8.5, 11.5], [2.5, 11.5]], e: [[0, 11], [2, 12.5], [2, 18], [0, 20]], c: [[11, 11], [11, 20], [9, 18], [9, 12.5]], d: [[3, 19], [8, 19], [10, 21], [1, 21]] };
    for (let i = 0; i < 3; i++) {
      const ox = 2 + i * 13, oy = 2, segs = SEG[s[i]] || '';
      for (const k of 'abcdefg') {
        g.fillStyle = segs.includes(k) ? on : off; g.beginPath();
        P[k].forEach(([x, y], j) => j ? g.lineTo(ox + x, oy + y) : g.moveTo(ox + x, oy + y)); g.closePath(); g.fill();
      }
    }
  }

  // ---- the smiley
  function drawFace(cv, mood, down, mono) {
    const d = window.devicePixelRatio || 1, g = cv.getContext('2d');
    if (cv.width !== 26 * d) { cv.width = 26 * d; cv.height = 26 * d; }
    g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = '#808080'; g.fillRect(0, 0, 26, 26);
    g.fillStyle = '#c0c0c0'; g.fillRect(1, 1, 24, 24);
    if (!down) {
      g.fillStyle = '#fff'; g.fillRect(1, 1, 23, 2); g.fillRect(1, 1, 2, 23);
      g.fillStyle = '#808080'; g.fillRect(3, 23, 22, 2); g.fillRect(23, 3, 2, 22);
    }
    const o = down ? 1 : 0, cx = 13 + o, cy = 13 + o;
    g.fillStyle = mono ? '#fff' : '#ffff00'; g.strokeStyle = '#000'; g.lineWidth = 1;
    g.beginPath(); g.arc(cx, cy, 8.5, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#000';
    if (mood === 'cool') {
      g.beginPath(); g.moveTo(cx - 7, cy - 3); g.lineTo(cx + 7, cy - 3); g.stroke();
      g.fillRect(cx - 6, cy - 3, 5, 3); g.fillRect(cx + 1, cy - 3, 5, 3);
      g.fillRect(cx - 5, cy, 3, 1); g.fillRect(cx + 2, cy, 3, 1);
      g.beginPath(); g.arc(cx, cy + 1, 4.5, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    } else if (mood === 'dead') {
      for (const ex of [-3.5, 3.5]) { g.beginPath(); g.moveTo(cx + ex - 1.6, cy - 4.6); g.lineTo(cx + ex + 1.6, cy - 1.4); g.moveTo(cx + ex + 1.6, cy - 4.6); g.lineTo(cx + ex - 1.6, cy - 1.4); g.stroke(); }
      g.beginPath(); g.arc(cx, cy + 6.5, 4, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke();
    } else {
      g.fillRect(cx - 4.5, cy - 4, 2, 2); g.fillRect(cx + 2.5, cy - 4, 2, 2);
      if (mood === 'oh') { g.beginPath(); g.arc(cx, cy + 3, 2.2, 0, Math.PI * 2); g.stroke(); }
      else { g.beginPath(); g.arc(cx, cy + 0.5, 4.5, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
    }
  }

  E.mods.sweeper = (K) => {
    const cfg = Object.assign({ level: 'beginner', cw: 30, ch: 24, cm: 200, marks: true, color: true, sound: false }, store.get(CFG_KEY, {}));
    const best = () => Object.assign({}, DEF_BEST, store.get(BEST_KEY, {}));
    const save = () => store.set(CFG_KEY, cfg);
    const touch = touchUI();
    const host = K.body;
    host.innerHTML = `<div class="sw-wrap"><div class="sw-top"><canvas class="sw-lcd sw-left"></canvas><button type="button" class="sw-face" aria-label="New game"><canvas></canvas></button><canvas class="sw-lcd sw-time"></canvas></div><div class="sw-field"><canvas aria-label="Bug field"></canvas></div>${touch ? '<div class="sw-touch"><button type="button" class="btn sw-fm"><canvas width="16" height="16"></canvas><span>Click: dig</span></button><span class="small">Click and hold a square to flag it.</span></div>' : ''}</div>`;
    const wrap = host.querySelector('.sw-wrap'), lcdL = host.querySelector('.sw-left'), lcdT = host.querySelector('.sw-time');
    const faceB = host.querySelector('.sw-face'), faceC = faceB.querySelector('canvas'), cv = host.querySelector('.sw-field canvas');
    const g = cv.getContext('2d');
    let W, H, M, cs = 16, tr = false, mine, st, cnt, game, firstClick, clicks, time, timer = null, mood = 'smile', faceDown = false, exploded = -1;
    let pressed = null, btns = 0, chordMode = false, chordBy = '', swallow = false, flagMode = false, cheat = false, typed = '';
    let pixel = null;
    const fm = host.querySelector('.sw-fm');
    if (fm) {
      const fg = fm.querySelector('canvas').getContext('2d'); bits(fg, FLAG, 3, 3, 1, { R: '#ff0000', K: '#000' });
      fm.addEventListener('click', () => { flagMode = !flagMode; fm.classList.toggle('on', flagMode); fm.querySelector('span').textContent = flagMode ? 'Click: flag' : 'Click: dig'; });
    }

    const sfx = n => { if (cfg.sound) E.sfx(n); };
    const nb = i => { const x = i % W, y = (i / W) | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) out.push(ny * W + nx); } return out; };
    const flags = () => st.reduce((a, s) => a + (s === 2 ? 1 : 0), 0);
    const levelDims = () => cfg.level === 'custom' ? { w: cfg.cw, h: cfg.ch, m: cfg.cm } : LEVELS[cfg.level];

    // online races (mp.js): everybody gets the same field from the shared seed, and the same square dug for them at GO
    let race = null, raceLv = 'beginner';
    function newGame(rseed) {
      const seeded = typeof rseed === 'number';
      if (!seeded && race && race.active) { Desk.toast('Bugsweeper 2000', 'No restarts in a race! Dig faster!', 2500); return; }
      const L = seeded ? LEVELS[raceLv] : levelDims(); W = L.w; H = L.h; M = Math.min(L.m, (W - 1) * (H - 1));
      mine = new Uint8Array(W * H); st = new Uint8Array(W * H); cnt = new Uint8Array(W * H);
      const idx = [...Array(W * H).keys()], rnd = seeded ? E.rng('sqrace' + rseed) : Math.random;
      for (let k = 0; k < M; k++) { const j = k + Math.floor(rnd() * (idx.length - k)); [idx[k], idx[j]] = [idx[j], idx[k]]; mine[idx[k]] = 1; }
      recount();
      game = 'ready'; firstClick = true; clicks = 0; time = 0; exploded = -1; mood = 'smile'; pressed = null;
      clearInterval(timer); timer = null;
      layout(); draw(); drawCounters();
    }
    function raceStart(seed, o, R, preview) {
      raceLv = LEVELS[o && o.level] ? o.level : 'beginner';
      newGame(seed);
      if (preview) { game = 'wait'; draw(); return; }
      let best = -1, bd = 1e9; // the empty square nearest the middle
      for (let i = 0; i < W * H; i++) if (!mine[i]) { const dx = i % W - (W - 1) / 2, dy = ((i / W) | 0) - (H - 1) / 2, d = dx * dx + dy * dy + (cnt[i] ? 1000 : 0); if (d < bd) { bd = d; best = i; } }
      firstClick = false; game = 'play'; startTimer(); open(best); check();
    }
    function raceProg() { if (!race || !race.active) return; let o = 0; for (let i = 0; i < W * H; i++) if (st[i] === 1 && !mine[i]) o++; const p = o / Math.max(1, W * H - M); race.progress(p, Math.round(p * 100) + '%'); }
    function recount() { for (let i = 0; i < W * H; i++) cnt[i] = nb(i).reduce((a, j) => a + mine[j], 0); }
    let laidFor = '';
    function layout() {
      const avail = Math.min(DesktopSurface.width(), 900) - 40, small = touch || DesktopSurface.width() < 640;
      // on a narrow phone a wide field (Expert) is turned on its side so it scrolls down instead of sideways
      tr = small && W > H && W * 22 > avail;
      const DC = tr ? H : W, DR = tr ? W : H;
      cs = small ? Math.max(22, Math.min(36, Math.floor(avail / DC))) : 16;
      const d = window.devicePixelRatio || 1;
      cv.width = DC * cs * d; cv.height = DR * cs * d; cv.style.width = DC * cs + 'px'; cv.style.height = DR * cs + 'px';
      g.setTransform(d, 0, 0, d, 0, 0); g.imageSmoothingEnabled = false;
      const key = W + 'x' + H + ':' + cs + (tr ? 't' : '');
      if (key === laidFor) return;
      const firstTime = !laidFor; laidFor = key;
      const el = K.w.el; el.style.width = 'auto'; el.style.height = 'auto';
      const nat = el.offsetWidth;
      if (nat > DesktopSurface.width() - 4) el.style.width = (DesktopSurface.width() - 4) + 'px';
      if (firstTime) { el.style.left = Math.max(2, (DesktopSurface.width() - el.offsetWidth) / 2) + 'px'; el.style.top = Math.max(2, Math.min(90, (DesktopSurface.height() - el.offsetHeight) / 2 - 40)) + 'px'; }
      K.fit();
    }
    function drawCounters() { drawLCD(lcdL, M - flags(), !cfg.color); drawLCD(lcdT, time, !cfg.color); drawFace(faceC, mood, faceDown, !cfg.color); }
    function drawCell(i) {
      const lx = i % W, ly = (i / W) | 0, x = (tr ? ly : lx) * cs, y = (tr ? lx : ly) * cs, p = cs / 16, s = st[i], mono = !cfg.color;
      const isPressed = pressed && pressed.has(i) && (s === 0 || s === 3);
      const shown = s === 1 || (game === 'lost' && (mine[i] || s === 2));
      if (!shown && !isPressed) {
        g.fillStyle = '#c0c0c0'; g.fillRect(x, y, cs, cs);
        g.fillStyle = '#fff'; g.fillRect(x, y, cs - p, 2 * p); g.fillRect(x, y, 2 * p, cs - p);
        g.fillStyle = '#808080'; g.fillRect(x + p, y + cs - 2 * p, cs - p, 2 * p); g.fillRect(x + cs - 2 * p, y + p, 2 * p, cs - p);
        if (s === 2) bits(g, FLAG, x + 3 * p, y + 3 * p, p, { R: mono ? '#000' : '#ff0000', K: '#000' });
        else if (s === 3) bits(g, QMARK, x + 4 * p, y + 3.5 * p, p, { '#': '#000' });
        return;
      }
      g.fillStyle = (game === 'lost' && i === exploded) ? (mono ? '#808080' : '#ff0000') : '#c0c0c0'; g.fillRect(x, y, cs, cs);
      g.fillStyle = '#808080'; g.fillRect(x, y, cs, p); g.fillRect(x, y, p, cs);
      if (isPressed) { if (s === 3) bits(g, QMARK, x + 4.5 * p, y + 4 * p, p, { '#': '#000' }); return; }
      if (game === 'lost' && s === 2 && !mine[i]) { // wrong flag: bug crossed out
        bits(g, SQUIG, x + 2.5 * p, y + 2.5 * p, p, { K: '#000', R: mono ? '#000' : '#c01818', D: '#000', W: '#fff', T: '#fff' });
        g.strokeStyle = mono ? '#000' : '#ff0000'; g.lineWidth = 1.6 * p; g.beginPath(); g.moveTo(x + 2 * p, y + 2 * p); g.lineTo(x + cs - 2 * p, y + cs - 2 * p); g.moveTo(x + cs - 2 * p, y + 2 * p); g.lineTo(x + 2 * p, y + cs - 2 * p); g.stroke();
        return;
      }
      if (game === 'lost' && s === 2) { bits(g, FLAG, x + 3 * p, y + 3 * p, p, { R: mono ? '#000' : '#ff0000', K: '#000' }); return; }
      if (mine[i]) { bits(g, SQUIG, x + 2.5 * p, y + 2.5 * p, p, { K: '#000', R: mono ? '#000' : (i === exploded ? '#7a0000' : '#d81c1c'), D: mono ? '#000' : '#800000', W: '#fff', T: '#fff' }); return; }
      const n = cnt[i]; if (n) bits(g, DIG[n], x + 4 * p, y + 3.5 * p, p, { '#': mono ? '#000' : NUMCOL[n] });
    }
    function draw() { for (let i = 0; i < W * H; i++) drawCell(i); }

    // ---- game logic
    function startTimer(from) {
      time = from || 1; drawCounters();
      timer = setInterval(() => { if (game !== 'play' || K.closed) return; if (time < 999) { time++; drawCounters(); if (cfg.sound) E.note(1700, 0.015, 'square'); } }, 1000);
    }
    function firstSafe(i) {
      if (!firstClick) return;
      firstClick = false;
      if (mine[i]) { // like the original: the squig scuttles off to the top-left-most free square
        mine[i] = 0;
        for (let j = 0; j < W * H; j++) if (!mine[j] && j !== i) { mine[j] = 1; break; }
        recount();
      }
      game = 'play'; startTimer();
    }
    function open(i) {
      if (st[i] === 1 || st[i] === 2) return;
      if (mine[i]) { lose(i); return; }
      const stack = [i];
      while (stack.length) {
        const j = stack.pop(); if (st[j] === 1 || st[j] === 2) continue;
        st[j] = 1;
        if (!cnt[j]) for (const k of nb(j)) if (st[k] !== 1 && st[k] !== 2 && !mine[k]) stack.push(k);
      }
    }
    function reveal(i) {
      if (game === 'won' || game === 'lost' || game === 'wait' || i < 0) return;
      if (st[i] === 2) return;
      if (st[i] === 1) { if (chordable(i)) chord(i); return; }
      clicks++;
      if (game === 'ready') firstSafe(i);
      open(i); check();
      if (saver) saver.save();
    }
    const chordable = i => st[i] === 1 && cnt[i] > 0 && nb(i).filter(j => st[j] === 2).length === cnt[i] && nb(i).some(j => st[j] === 0 || st[j] === 3);
    function chord(i) {
      if (game !== 'play' || st[i] !== 1 || !cnt[i]) return;
      if (nb(i).filter(j => st[j] === 2).length !== cnt[i]) return;
      clicks++;
      let boom = -1;
      for (const j of nb(i)) if (st[j] === 0 || st[j] === 3) { if (mine[j]) { if (boom < 0) boom = j; } else open(j); }
      if (boom >= 0) lose(boom); else check();
      if (saver) saver.save();
    }
    function mark(i) {
      if (game === 'won' || game === 'lost' || game === 'wait' || i < 0 || st[i] === 1) return;
      st[i] = st[i] === 0 ? 2 : st[i] === 2 ? (cfg.marks ? 3 : 0) : 0;
      if (saver) saver.save();
      sfx('click'); drawCell(i); drawCounters();
    }
    function lose(i) {
      game = 'lost'; exploded = i; mood = 'dead'; clearInterval(timer);
      draw(); drawCounters(); sfx('thud'); sfx('zap');
      if (clicks === 2) E.secret('sweep.quick');
      if (race && race.active) race.done({ ok: false });
    }
    function check() {
      let hidden = 0; for (let i = 0; i < W * H; i++) if (st[i] !== 1) hidden++;
      if (hidden === M) win(); else { draw(); drawCounters(); raceProg(); }
    }
    function win() {
      game = 'won'; mood = 'cool'; clearInterval(timer);
      for (let i = 0; i < W * H; i++) if (mine[i]) st[i] = 2;
      draw(); drawCounters(); sfx('solve');
      if (race && race.active) { raceProg(); race.done({ ok: true }); return; }
      E.secret('sweep.win');
      if (cfg.level === 'intermediate' && time < 61) E.secret('sweep.ali');
      if (cfg.level === 'expert') E.secret('sweep.expert');
      const b = best();
      if (cfg.level !== 'custom' && time < b[cfg.level][0]) setTimeout(() => nameDialog(cfg.level, time), 350);
    }

    // ---- pointer handling: left = dig, right = flag / ?, both (or middle) = chord
    const cellAt = ev => { const r = cv.getBoundingClientRect(); const DC = tr ? H : W, DR = tr ? W : H, c = Math.floor((ev.clientX - r.left) / r.width * DC), rr = Math.floor((ev.clientY - r.top) / r.height * DR), x = tr ? rr : c, y = tr ? c : rr; return x >= 0 && y >= 0 && x < W && y < H ? y * W + x : -1; };
    const setPressed = i => {
      const old = pressed; pressed = new Set();
      if (i >= 0) { if (chordMode) { pressed.add(i); nb(i).forEach(j => pressed.add(j)); } else pressed.add(i); }
      const touchd = new Set([...(old || []), ...pressed]); touchd.forEach(drawCell);
    };
    const clearPressed = () => { const old = pressed; pressed = null; if (old) old.forEach(drawCell); };
    const live = () => game === 'ready' || game === 'play';
    let lp = null; // touch long-press
    cv.addEventListener('contextmenu', ev => ev.preventDefault());
    cv.addEventListener('pointerdown', ev => {
      try { host.focus({ preventScroll: true }); } catch (e) {}
      if (!live()) return;
      const i = cellAt(ev);
      if (ev.pointerType === 'touch') {
        ev.preventDefault();
        lp = { id: ev.pointerId, i, x: ev.clientX, y: ev.clientY, done: false, t: setTimeout(() => { if (!lp) return; lp.done = true; clearPressed(); mood = 'smile'; drawCounters(); if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {} if (st[lp.i] === 1) chord(lp.i); else mark(lp.i); }, 380) };
        if (!flagMode) { mood = 'oh'; drawCounters(); setPressed(i); }
        return;
      }
      btns = ev.buttons || (ev.button === 2 ? 2 : 1); swallow = false;
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
      if (ev.button === 2 && !(btns & 1)) { mark(i); return; }
      chordMode = (btns & 3) === 3 || ev.button === 1; chordBy = ev.button === 1 ? 'middle' : 'both';
      mood = 'oh'; drawCounters(); setPressed(i);
      ev.preventDefault();
    });
    cv.addEventListener('pointermove', ev => {
      if (cheat && pixel) { const i = cellAt(ev); if (i >= 0) pixel.style.background = mine[i] ? '#000' : '#fff'; }
      if (lp && ev.pointerId === lp.id) { if (Math.hypot(ev.clientX - lp.x, ev.clientY - lp.y) > 10) { clearTimeout(lp.t); lp = null; clearPressed(); mood = 'smile'; drawCounters(); } return; }
      if (!live() || ev.pointerType === 'touch') return;
      // the second button of a chord arrives as a move with different buttons, and so does letting go of one of them
      const bb = ev.buttons;
      if ((bb & 3) === 3 && !chordMode) { chordMode = true; chordBy = 'both'; swallow = false; mood = 'oh'; drawCounters(); setPressed(cellAt(ev)); return; }
      if (chordMode && chordBy === 'both' && (bb & 3) !== 3) { const i = cellAt(ev); chordMode = false; clearPressed(); swallow = true; mood = 'smile'; if (i >= 0) chord(i); if (live()) drawCounters(); return; }
      if (!pressed) return;
      setPressed(cellAt(ev));
    });
    cv.addEventListener('pointercancel', () => { if (lp) { clearTimeout(lp.t); lp = null; } btns = 0; chordMode = false; clearPressed(); if (live()) { mood = 'smile'; drawCounters(); } });
    cv.addEventListener('pointerup', ev => {
      if (lp && ev.pointerId === lp.id) {
        clearTimeout(lp.t); const L = lp; lp = null; clearPressed();
        if (live()) { mood = 'smile'; drawCounters(); }
        if (L.done || !live()) return;
        const i = cellAt(ev); if (i < 0) return;
        if (flagMode && st[i] !== 1) mark(i); else reveal(i);
        return;
      }
      if (swallow) { swallow = false; btns = 0; return; }
      if (!pressed) { btns = ev.buttons; return; }
      const i = cellAt(ev), wasChord = chordMode;
      btns = 0; chordMode = false; clearPressed();
      if (!live()) return;
      mood = 'smile';
      if (i >= 0) { if (wasChord) chord(i); else reveal(i); }
      if (live()) drawCounters();
    });

    // ---- the smiley button
    faceB.addEventListener('pointerdown', () => { faceDown = true; drawCounters(); });
    faceB.addEventListener('pointerleave', () => { if (faceDown) { faceDown = false; drawCounters(); } });
    faceB.addEventListener('click', () => { faceDown = false; newGame(); });

    // ---- keyboard: F2, and the old magic word
    K.w.el.addEventListener('keydown', ev => {
      if (ev.key === 'F2') { ev.preventDefault(); newGame(); return; }
      if (ev.key === 'Enter' && ev.shiftKey) {
        if (typed.endsWith('xyzzy')) {
          ev.preventDefault(); cheat = !cheat; typed = '';
          if (cheat) { if (!pixel) { pixel = h('div'); pixel.id = 'swPixel'; } DesktopSurface.root().appendChild(pixel); E.secret('sweep.xyzzy'); }
          else if (pixel) pixel.remove();
        }
        return;
      }
      if (ev.key && ev.key.length === 1) typed = (typed + ev.key.toLowerCase()).slice(-8);
    });
    K.onClose(() => { clearInterval(timer); if (pixel) pixel.remove(); if (E._sweep && E._sweep.host === host) delete E._sweep; });

    // ---- dialogs
    function dlg(title, html, w) {
      const b = h('form', 'sw-dlg'); b.innerHTML = html;
      const win = Apps.win(title, b, { w: w || 300, icon: E.I.sweeper, noResize: true, noMax: true, noMin: true, escClose: true });
      return { b, win };
    }
    function nameDialog(level, t) {
      const { b, win } = dlg('Congratulations', `<p>You have the fastest time for ${LEVELS[level].n.toLowerCase()} level. Please type your name:</p><input type="text" maxlength="24" style="width:100%" value="${esc(store.get('jhp_era_sweep_name', 'Anonymous'))}"><div class="row" style="justify-content:center;margin-top:10px"><button class="btn" type="submit" style="min-width:75px">OK</button></div>`, 260);
      const inp = b.querySelector('input'); setTimeout(() => { inp.focus(); inp.select(); }, 30);
      b.addEventListener('submit', ev => {
        ev.preventDefault();
        const n = inp.value.trim().slice(0, 24) || 'Anonymous';
        store.set('jhp_era_sweep_name', n);
        const all = store.get(BEST_KEY, {}); all[level] = [t, n]; store.set(BEST_KEY, all);
        win.close(); bestDialog();
      });
    }
    function bestDialog() {
      const b0 = best();
      const rows = Object.keys(LEVELS).map(k => `<span>${LEVELS[k].n}:</span><span>${b0[k][0]} seconds</span><span>${esc(b0[k][1])}</span>`).join('');
      const { b, win } = dlg('Fastest Bug Sweepers', `<div class="sw-best">${rows}</div><div class="row" style="justify-content:space-between"><button class="btn" type="button" data-r>Reset Scores</button><button class="btn" type="submit" style="min-width:75px">OK</button></div>`, 280);
      b.querySelector('[data-r]').addEventListener('click', () => {
        store.set(BEST_KEY, { beginner: [999, 'Anonymous'], intermediate: [999, 'Anonymous'], expert: [999, 'Anonymous'] });
        b.querySelector('.sw-best').innerHTML = Object.keys(LEVELS).map(k => `<span>${LEVELS[k].n}:</span><span>999 seconds</span><span>Anonymous</span>`).join('');
      });
      b.addEventListener('submit', ev => { ev.preventDefault(); win.close(); });
    }
    function customDialog() {
      const L = levelDims();
      const { b, win } = dlg('Custom Field', `<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:14px"><div class="sw-cust"><label for="swH">Height:</label><input id="swH" type="number" min="8" max="24" value="${L.h}"><label for="swW">Width:</label><input id="swW" type="number" min="8" max="30" value="${L.w}"><label for="swM">Bugs:</label><input id="swM" type="number" min="10" max="667" value="${L.m}"></div><div style="display:flex;flex-direction:column;gap:6px"><button class="btn" type="submit" style="min-width:75px">OK</button><button class="btn" type="button" style="min-width:75px">Cancel</button></div></div>`, 250);
      b.querySelector('[type=button]').addEventListener('click', win.close);
      b.addEventListener('submit', ev => {
        ev.preventDefault();
        const num = (id, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+b.querySelector(id).value || lo)));
        const hh = num('#swH', 8, 24), ww = num('#swW', 8, 30), mm = num('#swM', 10, (ww - 1) * (hh - 1));
        Object.assign(cfg, { level: 'custom', cw: ww, ch: hh, cm: mm }); save(); win.close(); newGame();
      });
    }
    const HELP = `BUGSWEEPER 2000 HELP\n====================\n\nTHE IDEA\nThe Millennium Bug is coming, and it has brought its friends. Y2K\nbugs are hiding under the squares. Find them all without treading\non one. Treading on a bug resets your computer to 1900.\n\nHOW TO PLAY\n* Click a square to dig it up.\n* If it's a number, that's how many bugs are touching it\n  (up, down, sideways and diagonally).\n* Right-click a square to put a flag on it. Right-click again for\n  a question mark (if Marks is on), and again to clear it.\n* Click a number with BOTH buttons (or the middle one) to dig up\n  everything round it, once you've flagged the right number of bugs.\n* The first square you click is never a bug. We're not monsters.\n* The left counter is bugs left. The right one is seconds.\n* Click the smiley (or press F2) to start again.\n\nNO RIGHT MOUSE BUTTON?\nClick to dig. Click and hold a square to flag it. Or press the\nflag button so every click puts a flag down.\n\nLEVELS\nBeginner      8 x 8,  10 bugs\nIntermediate  16 x 16, 40 bugs\nExpert        30 x 16, 99 bugs\nCustom        whatever you like (up to 30 x 24)\n\nRECORDS TO BEAT\nBeginner: 14 seconds (Jack, after school, on the second try)\nIntermediate: 61 seconds (${Cast.n('teacher')}, Computer Club, says ${Cast.he('teacher')} can do it\n  "with ${Cast.his('teacher')} eyes shut". We have not seen this.)\nExpert: nobody. Dad says it's impossible. Dad also says the internet\n  is a fad.\n\nTROUBLESHOOTING\nQ: I keep losing.\nA: That's not a question.\n`;
    const pickLevel = l => { cfg.level = l; save(); newGame(); };
    K.menus([
      ['Game', () => [
        { label: 'New', key: 'F2', act: newGame },
        ...(window.MP ? [MP.menuItem('race.sweep', { level: LEVELS[cfg.level] ? cfg.level : 'intermediate' })] : []), '-',
        { label: 'Beginner', chk: cfg.level === 'beginner', act: () => pickLevel('beginner') },
        { label: 'Intermediate', chk: cfg.level === 'intermediate', act: () => pickLevel('intermediate') },
        { label: 'Expert', chk: cfg.level === 'expert', act: () => pickLevel('expert') },
        { label: 'Custom...', chk: cfg.level === 'custom', act: customDialog }, '-',
        { label: 'Marks (?)', chk: cfg.marks, act: () => { cfg.marks = !cfg.marks; save(); if (!cfg.marks) { for (let i = 0; i < st.length; i++) if (st[i] === 3) st[i] = 0; draw(); } } },
        { label: 'Color', chk: cfg.color, act: () => { cfg.color = !cfg.color; save(); draw(); drawCounters(); } },
        { label: 'Sound', chk: cfg.sound, act: () => { cfg.sound = !cfg.sound; save(); if (cfg.sound && window.Sound && !Sound.on) Desk.toast('Bugsweeper 2000', 'Sound is on, but JackOS sound effects are off. Turn them on with the speaker in the taskbar.', 4000); } }, '-',
        { label: 'Best Times...', act: bestDialog }, '-',
        { label: 'Exit', act: () => K.w.close() },
      ]],
      ['Help', () => [
        { label: 'Contents', key: 'F1', act: () => Apps.openFile({ name: 'SQSWEEP.TXT', type: 'txt', text: HELP }) },
        { label: 'Search for Help on...', act: () => Desk.msgbox('Bugsweeper 2000 Help', 'Searching for help on "how to win"...\n\n0 topics found.', 'info') },
        { label: 'Using Help', act: () => Desk.msgbox('Using Help', 'To use Help, click Help. You have already done this. Well done.', 'info') }, '-',
        { label: 'About Bugsweeper 2000...', act: () => E.about('Bugsweeper 2000', E.I.sweeper, ['<b>Bugsweeper 2000</b><br>Version 1.0 (for JackOS 98)', 'Copyright &copy; 1998-1999 JackSoft Games Division', 'Certified Y2K compliant. Probably. We set the clock to 31/12/99 and it went "beep".']) },
      ]],
    ]);

    // a test hook (and handy for anyone poking about in the console)
    if (window.MP) race = MP.hook('era.sweeper', K.w, { start: raceStart });
    // the field in progress is saved (js/gamesave.js): every squig, flag, ? and dug square, plus the timer. Not a race.
    const saver = window.Apps && Apps.gameSaver ? Apps.gameSaver('era.sweeper', () => (race && race.active) ? undefined : game !== 'play' ? null
      : { W, H, M, level: cfg.level, time, clicks, c: Array.from(st, (s, i) => s * 2 + mine[i]).join('') }, { v: 1, live: true }).watch(K.w) : null;
    if (saver) K.onClose(() => saver.stop());
    function resume() {
      const s = saver && saver.load(); if (!s || !(s.W >= 1 && s.H >= 1 && s.W * s.H <= 9999) || typeof s.c !== 'string' || s.c.length !== s.W * s.H || !/^[0-7]*$/.test(s.c)) return false;
      W = s.W; H = s.H; M = s.M | 0;
      mine = new Uint8Array(W * H); st = new Uint8Array(W * H); cnt = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) { const v = +s.c[i]; mine[i] = v & 1; st[i] = v >> 1; }
      if (mine.reduce((a, b) => a + b, 0) !== M) return false;
      if (s.level === 'custom') Object.assign(cfg, { level: 'custom', cw: W, ch: H, cm: M }); else if (LEVELS[s.level]) cfg.level = s.level;
      save(); recount();
      game = 'play'; firstClick = false; clicks = s.clicks | 0; exploded = -1; mood = 'smile'; pressed = null;
      clearInterval(timer); timer = null;
      layout(); draw(); startTimer(Math.max(1, Math.min(999, s.time | 0)));
      return true;
    }
    E._sweep = { host, get W() { return W; }, get H() { return H; }, get mine() { return mine; }, get st() { return st; }, get cnt() { return cnt; }, get game() { return game; }, get time() { return time; }, get cs() { return cs; }, get tr() { return tr; }, get clicks() { return clicks; }, reveal, chord, mark, newGame, cfg };
    if (!resume()) newGame();
  };
})();

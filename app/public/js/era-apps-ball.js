/* era-apps-ball: Jack Ball for JackOS 98 (lazy loaded by era-apps.js). The bouncing-atoms-and-walls game from the
 * Entertainment Packs, redone with bouncing Blobbits: click to build a wall, trap the balls in smaller and smaller spaces,
 * fill 75% of the box to clear the level. A ball that hits a wall while it's still growing pops it (and a life). */
(function () {
  'use strict';
  const E = window.Era; if (!E) return;
  let COLS = 28, ROWS = 20, TOTAL = COLS * ROWS; const R = 0.42, GROW = 9; // ball radius (cells), wall growth (cells/s)
  E.css('ball', `.era-grotball{display:flex;flex-direction:column;height:100%;min-height:0;gap:4px}
.gb-bar{display:flex;align-items:center;gap:6px;flex:none;flex-wrap:wrap}
.gb-bar .btn{padding:2px 8px;min-height:24px;font-size:11px}
.gb-bar .gb-arrow{display:inline-block;width:18px;font-weight:bold;text-align:center}
.gb-lcds{display:flex;gap:8px;margin-left:auto;font:11px var(--ui);align-items:center;flex-wrap:wrap}
.gb-lcds b{font:bold 13px "Courier New",monospace;background:#000;color:#ff3030;padding:1px 4px;border:1px solid;border-color:#808080 #fff #fff #808080;min-width:32px;display:inline-block;text-align:right}
.gb-wrap{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;position:relative;background:#808080;border:2px solid;border-color:#808080 #fff #fff #808080}
.gb-cv{display:block;touch-action:none;cursor:ew-resize}
.gb-cv.v{cursor:ns-resize}
.gb-over{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#c0c0c0;border:2px solid;border-color:#fff #000 #000 #fff;box-shadow:inset -1px -1px #808080,inset 1px 1px #dfdfdf;padding:12px 16px;text-align:center;min-width:200px;max-width:90%;font:12px var(--ui)}
.gb-over h3{margin:0 0 6px;font:bold 15px var(--ui)}
.gb-over table{margin:6px auto;border-collapse:collapse;font:12px var(--ui)}.gb-over td{padding:1px 6px}.gb-over td:last-child{text-align:right;font-weight:bold}
.gb-hs table{width:100%;border-collapse:collapse;font:12px var(--ui)}.gb-hs td,.gb-hs th{padding:2px 6px;text-align:left}.gb-hs th{border-bottom:1px solid #808080}
@media (hover:none){.gb-bar .btn{min-height:34px;padding:4px 12px;font-size:12px}}`);

  E.mods.grotball = K => {
    const { w, body } = K, store = E.store;
    const opt = Object.assign({ sound: true, fast: false, grid: true }, store.get('jhp_era_ballopt', {}));
    const saveOpt = () => store.set('jhp_era_ballopt', opt);
    const snd = n => { if (opt.sound) E.sfx(n); };
    body.innerHTML = `<div class="gb-bar"><button class="btn gb-dir" type="button" title="Turn the wall builder round (right-click does it too)"><span class="gb-arrow">&#8596;</span> <span class="gb-dt">Across</span></button><button class="btn gb-pause" type="button">Pause</button>
      <span class="gb-lcds"><span>Lives <b class="gb-l">0</b></span><span>Area <b class="gb-a">0%</b></span><span>Time <b class="gb-t">0</b></span></span></div>
      <div class="gb-wrap"><canvas class="gb-cv" aria-label="Jack Ball playing field"></canvas><div class="gb-over" hidden></div></div>`;
    const cv = body.querySelector('.gb-cv'), g = cv.getContext('2d'), wrap = body.querySelector('.gb-wrap'), over = body.querySelector('.gb-over');
    const dirBtn = body.querySelector('.gb-dir'), pauseBtn = body.querySelector('.gb-pause');
    const lcdL = body.querySelector('.gb-l'), lcdA = body.querySelector('.gb-a'), lcdT = body.querySelector('.gb-t');

    // ---- state
    let grid = new Uint8Array(TOTAL), balls = [], halves = [], level = 1, lives = 2, score = 0, timeLeft = 0, axis = 'h';
    let mode = 'play', manual = false, held = false, filled = 0, spin = 0, flash = 0, hover = null, lastStatus = '';
    const solid = (x, y) => x < 0 || y < 0 || x >= COLS || y >= ROWS || grid[y * COLS + x] === 1;
    const pct = () => filled / TOTAL;
    function boxHits(x, y) {
      const x0 = Math.floor(x - R), x1 = Math.floor(x + R - 1e-6), y0 = Math.floor(y - R), y1 = Math.floor(y + R - 1e-6);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (solid(cx, cy)) return true;
      return false;
    }
    function startLevel() {
      // a tall window (a phone held upright) gets the box turned on its side
      const wr = wrap.getBoundingClientRect(), tall = wr.height > wr.width * 1.15;
      const nc = tall ? 20 : 28, nr = tall ? 28 : 20;
      if (nc !== COLS) { COLS = nc; ROWS = nr; TOTAL = COLS * ROWS; resize(); }
      grid = new Uint8Array(TOTAL); filled = 0; halves = []; balls = [];
      lives = level + 1; timeLeft = 30 + level * 15; mode = 'play'; hideOver();
      const sp = opt.fast ? 7.5 : 5.2;
      for (let i = 0; i < level + 1; i++) {
        let x, y, tries = 0;
        do { x = 1 + Math.random() * (COLS - 2); y = 1 + Math.random() * (ROWS - 2); tries++; } while (tries < 50 && balls.some(b => Math.hypot(b.x - x, b.y - y) < 2));
        balls.push({ x, y, vx: (Math.random() < 0.5 ? -1 : 1) * sp, vy: (Math.random() < 0.5 ? -1 : 1) * sp, c: i % 2, ph: Math.random() * 6 });
      }
      if (level >= 5) E.secret('ball.l5');
      K.status(`Level ${level}. ${level + 1} bouncing Blobbits. Build walls to fill 75% of the box!`);
    }
    function newGame() { level = 1; score = 0; manual = false; startLevel(); if (sv) sv.clear(); }

    // ---- walls: two halves grow from the clicked square, red one way, blue the other
    function room(hf) {
      let n = 0, x = hf.ox, y = hf.oy;
      while (!solid(x, y)) { n++; if (hf.ax === 'h') x += hf.d; else y += hf.d; }
      return n;
    }
    function halfRect(hf) { // [x0, y0, x1, y1] in cells
      const L = Math.max(0.0001, hf.len);
      if (hf.ax === 'h') return hf.d > 0 ? [hf.ox, hf.oy, hf.ox + L, hf.oy + 1] : [hf.ox + 1 - L, hf.oy, hf.ox + 1, hf.oy + 1];
      return hf.d > 0 ? [hf.ox, hf.oy, hf.ox + 1, hf.oy + L] : [hf.ox, hf.oy + 1 - L, hf.ox + 1, hf.oy + 1];
    }
    function startWall(cx, cy, ax) {
      if (mode !== 'play' || halves.length || solid(cx, cy)) return false;
      ax = ax || axis;
      const a = { ax, d: -1, ox: cx, oy: cy, len: 0, col: 0 };
      const b = ax === 'h' ? { ax, d: 1, ox: cx + 1, oy: cy, len: 0, col: 1 } : { ax, d: 1, ox: cx, oy: cy + 1, len: 0, col: 1 };
      halves = [a, b].filter(hf => !solid(hf.ox, hf.oy));
      snd('click');
      return true;
    }
    function solidify(hf) {
      const n = room(hf); let x = hf.ox, y = hf.oy;
      for (let i = 0; i < n; i++) { if (!grid[y * COLS + x]) { grid[y * COLS + x] = 1; filled++; } if (hf.ax === 'h') x += hf.d; else y += hf.d; }
      const before = filled;
      fillEmpty();
      const gain = filled - before;
      score += (n + gain) * level;
      if ((gain + n) / TOTAL > 0.4) E.secret('ball.big');
      snd('thud'); if (gain > 0) flash = 0.25;
    }
    function fillEmpty() { // every empty region without a ball in it gets filled in
      const seen = new Uint8Array(TOTAL), q = [];
      for (const b of balls) {
        const x0 = Math.floor(b.x - R), x1 = Math.floor(b.x + R - 1e-6), y0 = Math.floor(b.y - R), y1 = Math.floor(b.y + R - 1e-6);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!solid(x, y) && !seen[y * COLS + x]) { seen[y * COLS + x] = 1; q.push(y * COLS + x); }
      }
      while (q.length) {
        const i = q.pop(), x = i % COLS, y = (i / COLS) | 0;
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) if (!solid(nx, ny) && !seen[ny * COLS + nx]) { seen[ny * COLS + nx] = 1; q.push(ny * COLS + nx); }
      }
      for (let i = 0; i < TOTAL; i++) if (!grid[i] && !seen[i]) { grid[i] = 1; filled++; }
    }

    // ---- the game loop
    function step(dt) {
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; return gameOver("Time's up!"); }
      // balls
      for (const b of balls) {
        const n = Math.max(1, Math.ceil(Math.abs(b.vx) * dt / 0.15));
        const hdt = dt / n;
        for (let s = 0; s < n; s++) {
          const nx = b.x + b.vx * hdt; if (boxHits(nx, b.y)) b.vx = -b.vx; else b.x = nx;
          const ny = b.y + b.vy * hdt; if (boxHits(b.x, ny)) b.vy = -b.vy; else b.y = ny;
        }
        b.ph += dt * 4;
      }
      for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) { // squig-balls bounce off each other
        const a = balls[i], c = balls[j], dx = c.x - a.x, dy = c.y - a.y;
        if (dx * dx + dy * dy < (2 * R) * (2 * R)) {
          if (Math.abs(dx) > Math.abs(dy)) { if ((c.vx - a.vx) * dx < 0) { const t = a.vx; a.vx = c.vx; c.vx = t; } }
          else if ((c.vy - a.vy) * dy < 0) { const t = a.vy; a.vy = c.vy; c.vy = t; }
        }
      }
      // walls (one ball popping both halves at once only costs one life)
      let popped = 0;
      for (const hf of halves.slice()) {
        hf.len += GROW * dt;
        const rm = room(hf), [x0, y0, x1, y1] = halfRect(hf);
        const hit = balls.find(b => b.x + R > x0 && b.x - R < x1 && b.y + R > y0 && b.y - R < y1);
        if (hit) { halves.splice(halves.indexOf(hf), 1); popped++; continue; }
        if (hf.len >= rm) { halves.splice(halves.indexOf(hf), 1); solidify(hf); }
      }
      if (popped) {
        lives--; snd('uhoh'); flash = -0.35;
        K.status(lives > 0 ? `Pop! A Blobbit bounced into your wall. ${lives} ${lives === 1 ? 'life' : 'lives'} left.` : 'Pop! That was your last life.');
        if (lives <= 0) return gameOver('Out of lives!');
      }
      if (pct() >= 0.75 && mode === 'play') levelClear();
    }
    function levelClear() {
      mode = 'clear'; halves = [];
      const p = Math.round(pct() * 100), areaB = Math.max(0, p - 75) * 100 * level, timeB = Math.ceil(timeLeft) * 10 * level, lifeB = lives * 100 * level;
      score += areaB + timeB + lifeB;
      E.secret('ball.clear'); snd('solve');
      showOver(`<h3>Level ${level} complete!</h3><table><tr><td>Area filled</td><td>${p}%</td></tr><tr><td>Area bonus</td><td>${areaB}</td></tr><tr><td>Time bonus</td><td>${timeB}</td></tr><tr><td>Lives bonus</td><td>${lifeB}</td></tr><tr><td>Score</td><td>${score}</td></tr></table><button class="btn gb-next" type="button">Level ${level + 1} &gt;&gt;</button>`);
      over.querySelector('.gb-next').addEventListener('click', () => { level++; startLevel(); });
      K.status(`Level ${level} cleared with ${p}%! Next: ${level + 2} Blobbits.`);
    }
    function gameOver(why) {
      mode = 'over'; halves = []; snd('shutdown');
      showOver(`<h3>GAME OVER</h3><p style="margin:0">${E.esc(why)}</p><table><tr><td>Level</td><td>${level}</td></tr><tr><td>Score</td><td>${score}</td></tr></table><button class="btn gb-again" type="button">New Game</button>`);
      over.querySelector('.gb-again').addEventListener('click', newGame);
      K.status(`Game over on level ${level}. Score: ${score}.`);
      const hs = scores();
      if (score > 0 && (hs.length < 5 || score > hs[hs.length - 1].s)) {
        setTimeout(() => Desk.ask('Jack Ball', `You got a high score! (${score}) Type your name:`, (window.Net && Net.me && Net.me.nick) || 'Jack', 16, v => {
          const n = String(v || '').trim().slice(0, 16) || 'Anonymous';
          const l = scores(); l.push({ n, s: score, l: level }); l.sort((a, b) => b.s - a.s); store.set('jhp_era_ballhs', l.slice(0, 5)); showScores();
        }), 500);
      }
    }
    function showOver(html) { over.innerHTML = html; over.hidden = false; }
    function hideOver() { over.hidden = true; over.innerHTML = ''; }

    // ---- drawing
    let cs = 16, dpr = 1, tileE = null, tileF = null;
    function mkTile(fill) {
      const c = document.createElement('canvas'), p = Math.max(4, Math.round(cs * dpr)); c.width = c.height = p;
      const t = c.getContext('2d'), e = Math.max(1, Math.round(dpr));
      if (!fill) {
        t.fillStyle = '#b8b8b8'; t.fillRect(0, 0, p, p);
        if (opt.grid) { t.fillStyle = '#e8e8e8'; t.fillRect(0, 0, p, e); t.fillRect(0, 0, e, p); t.fillStyle = '#808080'; t.fillRect(0, p - e, p, e); t.fillRect(p - e, 0, e, p); }
      } else {
        t.fillStyle = '#14144a'; t.fillRect(0, 0, p, p);
        t.fillStyle = '#22226e'; for (let i = -p; i < p; i += Math.max(3, p / 3)) { t.beginPath(); t.moveTo(i, p); t.lineTo(i + p, 0); t.lineTo(i + p + e, 0); t.lineTo(i + e, p); t.fill(); }
      }
      return c;
    }
    function resize() {
      const r = wrap.getBoundingClientRect(); if (r.width < 20 || r.height < 20) return;
      cs = Math.max(6, Math.floor(Math.min((r.width - 8) / COLS, (r.height - 8) / ROWS)));
      dpr = Math.min(3, window.devicePixelRatio || 1);
      cv.style.width = cs * COLS + 'px'; cv.style.height = cs * ROWS + 'px';
      cv.width = Math.round(cs * COLS * dpr); cv.height = Math.round(cs * ROWS * dpr);
      tileE = mkTile(false); tileF = mkTile(true);
    }
    function drawBall(b, S) {
      const x = b.x * S, y = b.y * S, r = R * S;
      const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      if (b.c) { gr.addColorStop(0, '#d8ffb0'); gr.addColorStop(0.35, '#4ac22a'); gr.addColorStop(1, '#0f4a0a'); }
      else { gr.addColorStop(0, '#ffd0c0'); gr.addColorStop(0.35, '#e8281b'); gr.addColorStop(1, '#5a0600'); }
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      if (r < 5) return;
      // a little squig face looking where it's going, and a spinning stripe so it looks like it's rolling
      g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = r * 0.18;
      const ph = b.ph % (Math.PI * 2); g.beginPath(); g.ellipse(x, y, r, Math.abs(Math.cos(ph)) * r, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
      const lx = Math.sign(b.vx) * r * 0.12, ly = Math.sign(b.vy) * r * 0.12;
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(x - r * 0.33 + lx, y - r * 0.15 + ly, r * 0.24, 0, 7); g.arc(x + r * 0.33 + lx, y - r * 0.15 + ly, r * 0.24, 0, 7); g.fill();
      g.fillStyle = '#000';
      g.beginPath(); g.arc(x - r * 0.33 + lx * 2, y - r * 0.15 + ly * 2, r * 0.11, 0, 7); g.arc(x + r * 0.33 + lx * 2, y - r * 0.15 + ly * 2, r * 0.11, 0, 7); g.fill();
      g.fillStyle = '#300'; g.beginPath(); g.ellipse(x + lx, y + r * 0.38 + ly, r * 0.42, r * 0.17, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#fff'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x + lx + i * r * 0.22 - r * 0.08, y + r * 0.38 + ly); g.lineTo(x + lx + i * r * 0.22 + r * 0.08, y + r * 0.38 + ly); g.lineTo(x + lx + i * r * 0.22, y + r * 0.52 + ly); g.fill(); }
    }
    function draw() {
      if (!tileE) resize(); if (!tileE) return;
      const S = cs * dpr, p = Math.round(S);
      g.setTransform(1, 0, 0, 1, 0, 0);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) g.drawImage(grid[y * COLS + x] ? tileF : tileE, Math.round(x * S), Math.round(y * S), p, p);
      // ghost of where the wall would go (desktop hover)
      if (hover && mode === 'play' && !halves.length && !solid(hover[0], hover[1])) {
        g.fillStyle = 'rgba(255,255,255,.25)';
        if (axis === 'h') { let a = hover[0], b = hover[0]; while (!solid(a - 1, hover[1])) a--; while (!solid(b + 1, hover[1])) b++; g.fillRect(a * S, hover[1] * S + S * 0.3, (b - a + 1) * S, S * 0.4); }
        else { let a = hover[1], b = hover[1]; while (!solid(hover[0], a - 1)) a--; while (!solid(hover[0], b + 1)) b++; g.fillRect(hover[0] * S + S * 0.3, a * S, S * 0.4, (b - a + 1) * S); }
      }
      for (const hf of halves) {
        const [x0, y0, x1, y1] = halfRect(hf);
        g.fillStyle = hf.col ? '#1a4ad8' : '#e10600'; g.fillRect(x0 * S, y0 * S, (x1 - x0) * S, (y1 - y0) * S);
        g.fillStyle = hf.col ? '#8ab0ff' : '#ff9a80';
        if (hf.ax === 'h') g.fillRect(x0 * S, y0 * S + S * 0.15, (x1 - x0) * S, S * 0.18); else g.fillRect(x0 * S + S * 0.15, y0 * S, S * 0.18, (y1 - y0) * S);
      }
      for (const b of balls) drawBall(b, S);
      if (flash) { g.fillStyle = flash > 0 ? `rgba(255,255,255,${flash})` : `rgba(255,0,0,${-flash})`; g.fillRect(0, 0, cv.width, cv.height); }
      if (paused()) {
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, cv.width, cv.height);
        g.fillStyle = '#ffd400'; g.font = `bold ${Math.round(S * 1.6)}px Tahoma, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('PAUSED', cv.width / 2, cv.height / 2 - S * 0.6);
        g.font = `${Math.round(S * 0.7)}px Tahoma, sans-serif`; g.fillStyle = '#fff'; g.fillText(manual ? 'Press F3 or click Resume' : 'Click to carry on', cv.width / 2, cv.height / 2 + S * 0.8);
      }
    }
    function hud() {
      lcdL.textContent = lives; lcdA.textContent = Math.floor(pct() * 100) + '%'; lcdT.textContent = Math.ceil(timeLeft);
      const pt = manual ? 'Resume' : 'Pause'; if (pauseBtn.textContent !== pt) pauseBtn.textContent = pt;
    }
    // the status bar shows the scores, except for a few seconds after a message
    let msgUntil = 0;
    const _status = K.status; K.status = t => { msgUntil = performance.now() + 3500; _status(t); };
    const paused = () => manual || held;
    let raf = 0, last = 0;
    function frame(t) {
      if (w.closed) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
      const hiddenNow = document.hidden || w.el.style.display === 'none';
      if (hiddenNow) return;
      held = !(Desk.isActive ? Desk.isActive(w.el) : true);
      if (mode === 'play' && !paused()) step(dt);
      if (flash > 0) flash = Math.max(0, flash - dt); else if (flash < 0) flash = Math.min(0, flash + dt);
      draw(); hud();
      if (performance.now() > msgUntil) { const s = `Level: ${level}    Lives: ${lives}    Area: ${Math.floor(pct() * 100)}%    Time: ${Math.ceil(timeLeft)}    Score: ${score}`; if (s !== lastStatus) { lastStatus = s; _status(s); } }
      else lastStatus = '';
    }

    // ---- input
    const setAxis = a => { axis = a; cv.classList.toggle('v', a === 'v'); dirBtn.querySelector('.gb-arrow').innerHTML = a === 'h' ? '&#8596;' : '&#8597;'; dirBtn.querySelector('.gb-dt').textContent = a === 'h' ? 'Across' : 'Up/Down'; };
    const flip = () => setAxis(axis === 'h' ? 'v' : 'h');
    const cellAt = ev => { const r = cv.getBoundingClientRect(); return [Math.floor((ev.clientX - r.left) / cs), Math.floor((ev.clientY - r.top) / cs)]; };
    let wasPaused = false;
    cv.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (wasPaused) { if (!manual) return; manual = false; return; } // the click that wakes the game up doesn't build a wall
      if (ev.button === 2) { flip(); return; }
      if (ev.button !== 0) return;
      const [x, y] = cellAt(ev); startWall(x, y);
    });
    // remember if the game was paused just before this click (apps.js focuses the window first, in the capture phase)
    w.el.addEventListener('pointerdown', () => { wasPaused = paused(); }, true);
    cv.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse') hover = cellAt(ev); });
    cv.addEventListener('pointerleave', () => { hover = null; });
    cv.addEventListener('contextmenu', ev => ev.preventDefault());
    dirBtn.addEventListener('click', flip);
    const togglePause = () => { if (mode !== 'play') return; manual = !manual; };
    pauseBtn.addEventListener('click', togglePause);
    body.addEventListener('keydown', ev => {
      if (ev.key === 'F2') { ev.preventDefault(); newGame(); }
      else if (ev.key === 'F3' || ev.key === 'p' || ev.key === 'P') { ev.preventDefault(); togglePause(); }
      else if (ev.key === ' ' || ev.key === 'Tab') { ev.preventDefault(); flip(); }
    });
    const ro = new ResizeObserver(() => resize()); ro.observe(wrap);
    K.onClose(() => { cancelAnimationFrame(raf); ro.disconnect(); if (E._ball && E._ball.w === w) delete E._ball; });

    // ---- menus + dialogs
    function scores() { const l = store.get('jhp_era_ballhs', null); return Array.isArray(l) ? l : [{ n: 'Jack', s: 4210, l: 3 }, { n: 'Dave', s: 1999, l: 2 }, { n: 'Gubbinz', s: 12, l: 1 }]; }
    function showScores() {
      const b = E.h('div', 'gb-hs');
      const l = scores();
      b.innerHTML = `<div class="field" style="padding:4px"><table><tr><th>#</th><th>Name</th><th>Level</th><th>Score</th></tr>${l.map((x, i) => `<tr><td>${i + 1}</td><td>${E.esc(x.n)}</td><td>${x.l}</td><td>${x.s}</td></tr>`).join('')}</table></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" data-r>Reset Scores</button><button class="btn" type="button" data-ok style="min-width:75px">OK</button></div>`;
      const hw = Apps.win('Jack Ball High Scores', b, { w: 300, icon: E.I.grotball, noResize: true, noMax: true, noMin: true, escClose: true });
      b.querySelector('[data-ok]').addEventListener('click', hw.close);
      b.querySelector('[data-r]').addEventListener('click', () => { store.set('jhp_era_ballhs', []); hw.close(); showScores(); });
    }
    const HELP = `JACK BALL - HOW TO PLAY\n=======================\n\nThe box is full of bouncing Blobbits. You want them squashed into\nas small a space as possible.\n\n* Click an empty square to build a wall. Two halves grow out from\n  where you clicked: a RED one and a BLUE one.\n* Right-click (or press Space, or click the arrow button) to turn the\n  wall builder round: across or up-and-down. The mouse pointer\n  shows which way it's pointing.\n* When a half reaches the edge it turns solid. Any space with no\n  Blobbits in it gets filled in.\n* If a Blobbit hits a half while it's still growing, it POPS and\n  you lose a life. The other half keeps going.\n* Fill 75% of the box to finish the level. Every level has one more\n  Blobbit than the last, and one more life.\n* Watch the clock. If time runs out, it's game over.\n\nBONUSES: every % over 75, the time left, and the lives you didn't use.\n\nTIPS\n- Build walls close to the edge first. Small safe bites.\n- Wait until the Blobbits are bouncing AWAY from where you click.\n- Dave says if you click really fast they can't hit it. Dave has\n  never got past level 2.\n\nF2 = New Game    F3 = Pause\n`;
    K.menus([
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: newGame },
        { label: 'Pause', key: 'F3', chk: manual, act: togglePause },
        '-',
        { label: 'Options', sub: () => [
          { label: 'Sound', chk: opt.sound, act: () => { opt.sound = !opt.sound; saveOpt(); } },
          { label: 'Fast Blobbits', chk: opt.fast, act: () => { opt.fast = !opt.fast; saveOpt(); K.status(opt.fast ? 'Fast Blobbits from the next level. Good luck.' : 'Normal speed from the next level.'); } },
          { label: 'Grid Lines', chk: opt.grid, act: () => { opt.grid = !opt.grid; saveOpt(); resize(); } },
        ] },
        { label: 'High Scores...', act: showScores },
        '-',
        { label: 'Exit', act: () => w.close() },
      ]],
      ['Help', [
        { label: 'How to Play', key: 'F1', act: () => Apps.openFile({ name: 'JACKBALL.TXT', type: 'txt', text: HELP }) },
        '-',
        { label: 'About Jack Ball...', act: () => E.about('Jack Ball', E.I.grotball, ['<b>Jack Ball</b> version 1.1', 'JackSoft Entertainment Pack 4', 'Copyright &copy; 1999 JackSoft. All bounces reserved.', 'No Blobbits were harmed in the making of this game. They were a bit squashed.']) },
      ]],
    ]);
    body.addEventListener('keydown', ev => { if (ev.key === 'F1') { ev.preventDefault(); Apps.openFile({ name: 'JACKBALL.TXT', type: 'txt', text: HELP }); } });

    // test hook (and a way for curious people with a console to cheat)
    E._ball = { w, get st() { return { level, lives, score, timeLeft, mode, filled, pct: pct(), balls: balls.map(b => ({ x: b.x, y: b.y })), halves: halves.length, axis, paused: paused() }; },
      wall: (x, y, a) => startWall(x, y, a), setBalls: list => { balls.forEach((b, i) => { if (list[i]) Object.assign(b, list[i]); }); }, step: dt => step(dt), solid, level: n => { level = n; startLevel(); } };
    setAxis('h');
    // saved game (js/gamesave.js): the box exactly as it was (walls, squig-balls, lives, time, score), paused, after a
    // refresh or a closed window. A wall still growing is lost. Between levels it waits at the start of the next one.
    const sv = Apps.gameSaver ? Apps.gameSaver('era.grotball', () => {
      if (mode === 'over') return null;
      if (mode === 'clear') return { next: level + 1, score };
      if (mode !== 'play') return undefined;
      return { level, lives, score, timeLeft, axis, cols: COLS, rows: ROWS, filled, grid: Array.prototype.join.call(grid, ''), balls };
    }, { v: 1, live: true, every: 5000 }).watch(w) : null;
    const resume = d => {
      if (!d) return false;
      if (d.next > 1) { level = d.next; score = d.score | 0; manual = false; startLevel(); manual = true; return true; }
      if (!(d.cols * d.rows > 0) || typeof d.grid !== 'string' || d.grid.length !== d.cols * d.rows || !/^[01]+$/.test(d.grid) || !Array.isArray(d.balls)) return false;
      COLS = d.cols; ROWS = d.rows; TOTAL = COLS * ROWS;
      grid = Uint8Array.from(d.grid, c => +c); filled = grid.reduce((n, v) => n + v, 0);
      balls = d.balls.filter(b => isFinite(b.x) && isFinite(b.y)); halves = [];
      level = d.level || 1; lives = d.lives || 1; score = d.score | 0; timeLeft = d.timeLeft > 0 ? d.timeLeft : 1; mode = 'play'; hideOver();
      setAxis(d.axis === 'v' ? 'v' : 'h'); manual = true; resize();
      K.status(`Carried on from your saved game: level ${level}. Press F3 or click Resume.`);
      return true;
    };
    if (!resume(sv && sv.load())) { if (sv) sv.clear(); newGame(); }
    requestAnimationFrame(() => { resize(); raf = requestAnimationFrame(frame); });
  };
})();

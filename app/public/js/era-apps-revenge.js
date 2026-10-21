/* era-apps-revenge: Blobbit's Revenge (was Squig's Revenge) for JackOS 98 (lazy loaded by era-apps.js). The block-pushing
 * chase game from the Entertainment Packs: you're a Blobbit, the tin robots (internally still "grots") want you in a jar.
 * Push the blocks to box them in. When every robot is stuck they give up and turn into cheese. Then you eat it. Revenge! */
(function () {
  'use strict';
  const E = window.Era; if (!E) return;
  const N = 23; // the board, border included
  const FLOOR = 0, BLOCK = 1, WALL = 2, SINK = 3, TRAP = 4, CHEESE = 5;
  const DIRS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  const SPEEDS = { slow: 0.85, medium: 0.6, fast: 0.4 };
  E.css('revenge', `.era-revenge{display:flex;flex-direction:column;height:100%;min-height:0;gap:4px}
.rv-wrap{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#808080;border:2px solid;border-color:#808080 #fff #fff #808080;position:relative}
.rv-cv{display:block;touch-action:none;cursor:pointer}
.rv-pad{flex:none;display:none;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(3,44px);gap:3px;justify-content:center;padding:2px 0;touch-action:none}
.rv-pad button{font:bold 18px var(--ui);padding:0;min-height:0;touch-action:none;-webkit-user-select:none;user-select:none}
.era-revenge.touch .rv-pad{display:grid}
.rv-hs table{width:100%;border-collapse:collapse;font:12px var(--ui)}.rv-hs td,.rv-hs th{padding:2px 6px;text-align:left}.rv-hs th{border-bottom:1px solid #808080}`);

  E.mods.revenge = K => {
    const { w, body } = K, store = E.store;
    const opt = Object.assign({ sound: true, speed: 'medium' }, store.get('jhp_era_revopt', {}));
    const saveOpt = () => store.set('jhp_era_revopt', opt);
    const snd = n => { if (opt.sound) E.sfx(n); };
    const tone = (f, d) => { if (opt.sound) E.note(f, d, 'square'); };
    const touch = matchMedia('(hover:none)').matches || matchMedia('(pointer:coarse)').matches;
    if (touch) body.classList.add('touch');
    body.innerHTML = `<div class="rv-wrap"><canvas class="rv-cv" aria-label="Blobbit's Revenge board"></canvas></div>
      <div class="rv-pad">${['&#8598;', '&#8593;', '&#8599;', '&#8592;', '&#10074;&#10074;', '&#8594;', '&#8601;', '&#8595;', '&#8600;'].map((a, i) => `<button class="btn" type="button" data-i="${i}" aria-label="${['Up left', 'Up', 'Up right', 'Left', 'Pause', 'Right', 'Down left', 'Down', 'Down right'][i]}">${a}</button>`).join('')}</div>`;
    const cv = body.querySelector('.rv-cv'), g = cv.getContext('2d'), wrap = body.querySelector('.rv-wrap');

    // ---- state
    let cells = new Uint8Array(N * N), me = { x: 11, y: 11, face: 1, stuck: 0, inv: 0 }, grots = [], pies = [];
    let level = 1, lives = 3, score = 0, waves = [], wave = 0, clock = 0, grotT = 0, pieT = 0, mode = 'ready', modeT = 1.5, manual = false, held = false;
    let maxLevel = store.get('jhp_era_revmax', 1), banner = '', lastStatus = '', lastMove = 0, msgUntil = 0, cheeseFx = [];
    const at = (x, y) => x < 0 || y < 0 || x >= N || y >= N ? WALL : cells[y * N + x];
    const set = (x, y, v) => { cells[y * N + x] = v; };
    const grotAt = (x, y) => grots.find(o => o.x === x && o.y === y);
    const pieAt = (x, y) => pies.find(o => o.x === x && o.y === y);
    const free = (x, y) => at(x, y) === FLOOR && !grotAt(x, y) && !pieAt(x, y) && !(me.x === x && me.y === y);
    const say = t => { msgUntil = performance.now() + 3500; K.status(t); };

    // ---- the levels
    function build(lv) {
      const r = E.rng('squigsrevenge' + lv);
      cells = new Uint8Array(N * N);
      for (let i = 0; i < N; i++) { set(i, 0, WALL); set(i, N - 1, WALL); set(0, i, WALL); set(N - 1, i, WALL); }
      const box = (a, b, v) => { for (let y = a; y <= b; y++) for (let x = a; x <= b; x++) set(x, y, v); };
      const sprinkle = (n, v, inBlock) => { let k = 0, tries = 0; while (k < n && tries++ < 500) { const x = 1 + Math.floor(r() * (N - 2)), y = 1 + Math.floor(r() * (N - 2)); if (Math.abs(x - 11) + Math.abs(y - 11) < 3) continue; if ((inBlock ? at(x, y) === BLOCK : at(x, y) === FLOOR)) { set(x, y, v); k++; } } };
      const kind = lv <= 10 ? lv : 1 + Math.floor(r() * 10);
      let nPies = 0;
      if (kind === 1) box(4, 18, BLOCK);
      else if (kind === 2) { box(4, 18, BLOCK); sprinkle(8, WALL, true); }
      else if (kind === 3) { box(4, 18, BLOCK); sprinkle(6, SINK, false); sprinkle(3, SINK, true); }
      else if (kind === 4) { for (let ring = 3; ring <= 9; ring += 2) for (let i = 11 - ring; i <= 11 + ring; i++) { set(i, 11 - ring, BLOCK); set(i, 11 + ring, BLOCK); set(11 - ring, i, BLOCK); set(11 + ring, i, BLOCK); } box(10, 12, BLOCK); for (let ring = 3; ring <= 9; ring += 2) { set(11, 11 - ring, FLOOR); set(11 + ring, 11, FLOOR); } }
      else if (kind === 5) { box(4, 18, BLOCK); sprinkle(5, TRAP, false); sprinkle(6, WALL, true); }
      else if (kind === 6) { box(4, 18, BLOCK); sprinkle(6, WALL, true); nPies = 1; }
      else if (kind === 7) { for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) if (r() < 0.5) set(x, y, BLOCK); sprinkle(14, WALL, false); }
      else if (kind === 8) { for (let y = 3; y <= 19; y++) for (let x = 3; x <= 19; x++) if (((x - 3) >> 2) % 2 === ((y - 3) >> 2) % 2 || r() < 0.3) set(x, y, BLOCK); sprinkle(4, SINK, false); }
      else if (kind === 9) { box(4, 18, BLOCK); sprinkle(5, SINK, false); sprinkle(3, TRAP, false); nPies = 2; }
      else { for (let y = 2; y < N - 2; y += 4) for (let x = 2; x < N - 2; x++) if ((x + y) % 7) set(x, y, WALL); for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) if (at(x, y) === FLOOR && r() < 0.42) set(x, y, BLOCK); nPies = 2; }
      if (lv > 10) { sprinkle(Math.min(8, lv - 8), SINK, false); nPies = Math.min(4, 1 + Math.floor((lv - 9) / 2)); }
      for (let y = 10; y <= 12; y++) for (let x = 10; x <= 12; x++) if (at(x, y) !== BLOCK || (x === 11 && y === 11)) set(x, y, x === 11 && y === 11 ? FLOOR : at(x, y) === WALL || at(x, y) === TRAP || at(x, y) === SINK ? BLOCK : at(x, y));
      set(11, 11, FLOOR);
      me = { x: 11, y: 11, face: 1, stuck: 0, inv: 0 };
      grots = []; pies = []; cheeseFx = [];
      for (let i = 0; i < nPies; i++) { const c = spot(5); if (c) pies.push({ x: c[0], y: c[1], dx: r() < 0.5 ? -1 : 1, dy: r() < 0.5 ? -1 : 1, stuck: 0 }); }
      const nw = Math.min(6, 2 + Math.ceil(lv / 2));
      waves = []; for (let i = 0; i < nw; i++) waves.push(Math.min(5, 1 + Math.floor((lv - 1 + i) / 2)));
      wave = 0; clock = 0; grotT = 0; pieT = 0;
    }
    function spot(minD) { // an empty floor square far enough from the squig, edges first
      const out = [], edge = [];
      for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) if (free(x, y) && Math.max(Math.abs(x - me.x), Math.abs(y - me.y)) >= minD) { out.push([x, y]); if (x < 4 || y < 4 || x > N - 5 || y > N - 5) edge.push([x, y]); }
      const l = edge.length ? edge : out; return l.length ? l[Math.floor(Math.random() * l.length)] : null;
    }
    function spawn(n) { for (let i = 0; i < n; i++) { const c = spot(6) || spot(3); if (c) grots.push({ x: c[0], y: c[1], stuck: 0, ph: Math.random() * 6 }); } if (n) tone(220, 0.08); }
    function startLevel(lv) {
      level = lv; build(lv); mode = 'ready'; modeT = 1.6; banner = `LEVEL ${lv}`;
      if (lv > maxLevel) { maxLevel = lv; store.set('jhp_era_revmax', maxLevel); }
      say(`Level ${lv}: ${waves.length} waves of tin robots. Push the blocks and trap them!`);
    }
    function newGame(lv) { score = 0; lives = 3; manual = false; startLevel(lv || 1); if (sv) sv.clear(); }

    // ---- the squig
    function tryMove(dx, dy) {
      if (mode !== 'play' || paused()) return false;
      const now = performance.now(); if (now - lastMove < 85) return false; lastMove = now;
      if (dx) me.face = dx;
      if (me.stuck > 0) { tone(110, 0.05); return false; }
      const tx = me.x + dx, ty = me.y + dy, c = at(tx, ty);
      if (grotAt(tx, ty) || pieAt(tx, ty)) { if (me.inv <= 0) die(grotAt(tx, ty) ? 'You ran into a robot. It says BEEP. That means thanks.' : 'Clang! Run over by a rolling oil can.'); return false; }
      if (c === WALL) { tone(90, 0.04); return false; }
      if (c === BLOCK) {
        let ex = tx, ey = ty; while (at(ex, ey) === BLOCK) { ex += dx; ey += dy; }
        if (!free(ex, ey)) { tone(90, 0.04); return false; }
        set(ex, ey, BLOCK); set(tx, ty, FLOOR); snd('turn');
      }
      me.x = tx; me.y = ty;
      const c2 = at(tx, ty);
      if (c2 === CHEESE) { set(tx, ty, FLOOR); score += 100; snd('pet'); cheeseFx.push({ x: tx, y: ty, t: 0.8 }); }
      else if (c2 === SINK) { me.stuck = 3; snd('thud'); say('Stuck in a sinkhole! Wiggle... wiggle...'); }
      else if (c2 === TRAP) { set(tx, ty, FLOOR); die('SNAP! A mousetrap. Ouch.'); }
      return true;
    }
    function die(why) {
      if (mode !== 'play') return;
      snd('uhoh'); lives--; mode = 'dead'; modeT = 1.4; banner = lives >= 0 ? 'OUCH!' : 'GAME OVER';
      say(why + (lives >= 0 ? ` ${lives} spare Blobbit${lives === 1 ? '' : 's'} left.` : ''));
    }
    function respawn() {
      let best = null, bd = -1;
      for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) if (at(x, y) === FLOOR && !grotAt(x, y) && !pieAt(x, y)) {
        const d = Math.min(99, ...grots.map(o => Math.max(Math.abs(o.x - x), Math.abs(o.y - y))), ...pies.map(o => Math.max(Math.abs(o.x - x), Math.abs(o.y - y))));
        if (d > bd) { bd = d; best = [x, y]; }
      }
      if (best) { me.x = best[0]; me.y = best[1]; }
      me.stuck = 0; me.inv = 1.5; mode = 'play';
    }

    // ---- the grots
    function distMap() { // squares-away-from-the-squig, walking only on the floor
      const d = new Int16Array(N * N).fill(-1), q = [me.y * N + me.x]; d[q[0]] = 0;
      for (let h = 0; h < q.length; h++) {
        const i = q[h], x = i % N, y = (i / N) | 0;
        for (const [ax, ay] of DIRS) { const nx = x + ax, ny = y + ay, j = ny * N + nx; if (nx > 0 && ny > 0 && nx < N - 1 && ny < N - 1 && d[j] < 0 && at(nx, ny) === FLOOR) { d[j] = d[i] + 1; q.push(j); } }
      }
      return d;
    }
    const grotFree = (x, y) => at(x, y) === FLOOR && !grotAt(x, y) && !pieAt(x, y);
    const canMove = o => DIRS.some(([ax, ay]) => grotFree(o.x + ax, o.y + ay) || (o.x + ax === me.x && o.y + ay === me.y));
    function grotStep() {
      const d = distMap();
      for (const o of grots) {
        const opts = DIRS.map(([ax, ay]) => [o.x + ax, o.y + ay]).filter(([x, y]) => grotFree(x, y) || (x === me.x && y === me.y));
        if (!opts.length) continue;
        const hit = opts.find(([x, y]) => x === me.x && y === me.y);
        if (hit) { if (me.inv <= 0) { die('A robot caught you! Into the jar you go.'); return; } continue; }
        let pickC = null, bestD = 1e9;
        for (const [x, y] of opts) { const v = d[y * N + x]; if (v >= 0 && v < bestD) { bestD = v; pickC = [x, y]; } }
        if (!pickC) { if (Math.random() < 0.5) pickC = opts[Math.floor(Math.random() * opts.length)]; else continue; } // can't get to you: mooch about
        o.x = pickC[0]; o.y = pickC[1];
      }
    }
    function checkTrapped(dt) {
      if (!grots.length) return;
      let all = true;
      for (const o of grots) { if (canMove(o)) { o.stuck = 0; all = false; } else o.stuck += dt; }
      const gone = all ? grots.slice() : grots.filter(o => o.stuck > 7); // all stuck = they all give up; one stuck for ages gives up on its own
      if (!gone.length) return;
      for (const o of gone) { set(o.x, o.y, CHEESE); cheeseFx.push({ x: o.x, y: o.y, t: 0.6, poof: 1 }); }
      grots = grots.filter(o => !gone.includes(o));
      E.secret('rev.cheese'); if (gone.length >= 4) E.secret('rev.trap4');
      snd('solve'); score += 50 * gone.length;
      say(gone.length > 1 ? `${gone.length} robots gave up and turned into cheese! Eat it!` : 'A robot gave up and turned into cheese! Eat it!');
    }
    function pieStep() {
      for (const p of pies) {
        const tryD = [[p.dx, p.dy], [-p.dx, p.dy], [p.dx, -p.dy], [-p.dx, -p.dy]];
        let moved = false;
        for (const [ax, ay] of tryD) {
          const x = p.x + ax, y = p.y + ay;
          if (x === me.x && y === me.y) { if (me.inv <= 0) die('Clang! Run over by a rolling oil can.'); p.dx = ax; p.dy = ay; moved = true; break; }
          if (at(x, y) === FLOOR && !grotAt(x, y) && !pies.some(q => q !== p && q.x === x && q.y === y)) { p.x = x; p.y = y; p.dx = ax; p.dy = ay; moved = true; break; }
        }
        p.stuck = moved ? 0 : p.stuck + 1;
      }
      const stuck = pies.filter(p => p.stuck > 16);
      if (stuck.length) { stuck.forEach(p => cheeseFx.push({ x: p.x, y: p.y, t: 0.6, poof: 1 })); pies = pies.filter(p => p.stuck <= 16); score += 200 * stuck.length; snd('boing'); say('You trapped a rolling oil can! It ran out of oil. +200'); }
    }

    // ---- the loop
    function step(dt) {
      cheeseFx.forEach(f => { f.t -= dt; }); cheeseFx = cheeseFx.filter(f => f.t > 0);
      if (mode === 'ready' || mode === 'dead' || mode === 'clear') {
        modeT -= dt;
        if (modeT <= 0) {
          if (mode === 'ready') { mode = 'play'; banner = ''; spawn(waves[0]); }
          else if (mode === 'dead') { if (lives < 0) return gameOver(); banner = ''; respawn(); }
          else { startLevel(level + 1); }
        }
        return;
      }
      if (mode !== 'play') return;
      clock += dt; if (me.stuck > 0) me.stuck = Math.max(0, me.stuck - dt); if (me.inv > 0) me.inv -= dt;
      grots.forEach(o => { o.ph += dt * 6; });
      grotT += dt; if (grotT >= SPEEDS[opt.speed]) { grotT = 0; grotStep(); if (mode !== 'play') return; }
      pieT += dt; if (pieT >= 0.28) { pieT = 0; pieStep(); if (mode !== 'play') return; }
      checkTrapped(dt);
      // every time the clock goes round, one more grot turns up
      if (clock >= 45) { clock = 0; if (grots.length < 6) { spawn(1); say('The clock went round. Another robot has turned up!'); } }
      if (!grots.length && mode === 'play') {
        wave++;
        if (wave < waves.length) { spawn(waves[wave]); say(`Wave ${wave + 1} of ${waves.length}: ${waves[wave]} more robot${waves[wave] > 1 ? 's' : ''}!`); }
        else levelClear();
      }
    }
    function levelClear() {
      const bonus = 500 * level; score += bonus; mode = 'clear'; modeT = 3; banner = 'LEVEL CLEAR!';
      snd('solve'); say(`Level ${level} done! Bonus ${bonus}. The robots will be back...`);
      if (level >= 5) E.secret('rev.l5');
    }
    function gameOver() {
      mode = 'over'; banner = 'GAME OVER'; snd('shutdown');
      say(`Game over on level ${level}. Score: ${score}. Press F2 for a new game.`);
      const hs = scores();
      if (score > 0 && (hs.length < 5 || score > hs[hs.length - 1].s)) {
        setTimeout(() => Desk.ask("Blobbit's Revenge", `High score! (${score}) Type your name:`, (window.Net && Net.me && Net.me.nick) || 'Jack', 16, v => {
          const n = String(v || '').trim().slice(0, 16) || 'Anonymous';
          const l = scores(); l.push({ n, s: score, l: level }); l.sort((a, b) => b.s - a.s); store.set('jhp_era_revhs', l.slice(0, 5)); showScores();
        }), 600);
      }
    }

    // ---- drawing
    let cs = 16, dpr = 1, TOP = 2;
    function resize() {
      const r = wrap.getBoundingClientRect(); if (r.width < 20 || r.height < 20) return;
      cs = Math.max(8, Math.floor(Math.min((r.width - 6) / N, (r.height - 6) / (N + TOP))));
      dpr = Math.min(3, window.devicePixelRatio || 1);
      cv.style.width = cs * N + 'px'; cv.style.height = cs * (N + TOP) + 'px';
      cv.width = Math.round(cs * N * dpr); cv.height = Math.round(cs * (N + TOP) * dpr);
    }
    const S = () => cs * dpr;
    function bevel(x, y, s, face, hi, lo) {
      g.fillStyle = face; g.fillRect(x, y, s, s);
      const e = Math.max(1, s * 0.12);
      g.fillStyle = hi; g.fillRect(x, y, s, e); g.fillRect(x, y, e, s);
      g.fillStyle = lo; g.fillRect(x, y + s - e, s, e); g.fillRect(x + s - e, y, e, s);
    }
    // the player: a round blue Blobbit (little round ears, big eyes, rosy cheeks, happy mouth)
    function drawSquig(cx, cy, s, face, t, scared) {
      const r = s * 0.4, lw = Math.max(1, s * 0.05), fx = face * r * 0.12;
      g.lineWidth = lw; g.strokeStyle = '#0a2a6a';
      g.fillStyle = '#1a68c8'; g.beginPath(); g.ellipse(cx - r * 0.5, cy + r * 0.88, r * 0.34, r * 0.2, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(cx + r * 0.5, cy + r * 0.88, r * 0.34, r * 0.2, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#2a80d8'; [-1, 1].forEach(d => { g.beginPath(); g.arc(cx + d * r * 0.62, cy - r * 0.78, r * 0.3, 0, 7); g.fill(); g.stroke(); });
      g.fillStyle = '#ffb0c8'; [-1, 1].forEach(d => { g.beginPath(); g.arc(cx + d * r * 0.62, cy - r * 0.78, r * 0.13, 0, 7); g.fill(); });
      const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r * 1.05);
      gr.addColorStop(0, '#a8e8ff'); gr.addColorStop(0.45, '#3aa0f0'); gr.addColorStop(1, '#1450a8');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(cx - r * 0.45, cy - r * 0.6, r * 0.2, r * 0.11, -0.6, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = Math.max(0.7, lw * 0.7); g.beginPath(); g.ellipse(cx - r * 0.3 + fx, cy - r * 0.22, r * 0.22, r * 0.27, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(cx + r * 0.3 + fx, cy - r * 0.22, r * 0.22, r * 0.27, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#000'; g.beginPath(); g.arc(cx - r * 0.3 + fx * 1.8, cy - r * (scared ? 0.32 : 0.18), r * 0.11, 0, 7); g.arc(cx + r * 0.3 + fx * 1.8, cy - r * (scared ? 0.32 : 0.18), r * 0.11, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,90,140,.65)'; g.beginPath(); g.ellipse(cx - r * 0.62 + fx, cy + r * 0.18, r * 0.15, r * 0.1, 0, 0, 7); g.ellipse(cx + r * 0.62 + fx, cy + r * 0.18, r * 0.15, r * 0.1, 0, 0, 7); g.fill();
      g.fillStyle = '#5a0a20';
      if (scared) { g.beginPath(); g.ellipse(cx + fx, cy + r * 0.4, r * 0.18, r * 0.22, 0, 0, 7); g.fill(); }
      else { g.beginPath(); g.moveTo(cx + fx - r * 0.32, cy + r * 0.24); g.quadraticCurveTo(cx + fx, cy + r * 0.72, cx + fx + r * 0.32, cy + r * 0.24); g.closePath(); g.fill(); g.fillStyle = '#ff6a8a'; g.beginPath(); g.ellipse(cx + fx, cy + r * 0.45, r * 0.14, r * 0.08, 0, 0, 7); g.fill(); }
    }
    // the chasers: little grey wind-up tin robots (antenna bulb, key in the back, red eyes; yellow and sweating when stuck)
    function drawGrot(cx, cy, s, ph, stuck) {
      const r = s * 0.43, bob = Math.sin(ph) * s * 0.03, lw = Math.max(1, s * 0.045);
      cy += bob;
      g.lineWidth = lw; g.strokeStyle = '#1a1e2a';
      // feet
      g.fillStyle = '#3a3e4a'; g.fillRect(cx - r * 0.7, cy + r * 0.82, r * 0.5, r * 0.22); g.fillRect(cx + r * 0.2, cy + r * 0.82, r * 0.5, r * 0.22);
      // wind-up key on the side
      g.save(); g.translate(cx + r * 0.95, cy + r * 0.25); g.rotate(ph * 2); g.fillStyle = '#d8a820'; g.strokeStyle = '#6a4a00'; g.beginPath(); g.ellipse(0, -r * 0.22, r * 0.12, r * 0.2, 0, 0, 7); g.ellipse(0, r * 0.22, r * 0.12, r * 0.2, 0, 0, 7); g.fill(); g.stroke(); g.restore();
      // body
      const bg = g.createLinearGradient(cx - r, 0, cx + r, 0); bg.addColorStop(0, '#e8ecf4'); bg.addColorStop(0.5, '#a8b0c0'); bg.addColorStop(1, '#5a6070');
      g.fillStyle = bg; g.strokeStyle = '#1a1e2a'; g.beginPath(); g.rect(cx - r * 0.75, cy + r * 0.1, r * 1.5, r * 0.75); g.fill(); g.stroke();
      g.fillStyle = '#e10600'; g.fillRect(cx - r * 0.35, cy + r * 0.32, r * 0.18, r * 0.18); g.fillStyle = '#3aac2c'; g.fillRect(cx - r * 0.05, cy + r * 0.32, r * 0.18, r * 0.18); g.fillStyle = '#ffd400'; g.fillRect(cx + r * 0.25, cy + r * 0.32, r * 0.18, r * 0.18);
      // antenna
      g.strokeStyle = '#1a1e2a'; g.beginPath(); g.moveTo(cx, cy - r * 0.75); g.lineTo(cx, cy - r * 1.05); g.stroke();
      g.fillStyle = (Math.floor(ph * 2) % 2) ? '#ff4040' : '#ffd400'; g.beginPath(); g.arc(cx, cy - r * 1.1, r * 0.14, 0, 7); g.fill(); g.stroke();
      // head
      g.fillStyle = bg; g.beginPath(); g.rect(cx - r * 0.62, cy - r * 0.78, r * 1.24, r * 0.88); g.fill(); g.stroke();
      g.fillStyle = '#20242e'; g.fillRect(cx - r * 0.48, cy - r * 0.55, r * 0.96, r * 0.36);
      g.fillStyle = stuck ? '#ffd400' : '#ff3020'; g.fillRect(cx - r * 0.38, cy - r * 0.48, r * 0.24, r * 0.22); g.fillRect(cx + r * 0.14, cy - r * 0.48, r * 0.24, r * 0.22);
      g.fillStyle = '#20242e'; for (let i = 0; i < 4; i++) g.fillRect(cx - r * 0.36 + i * r * 0.22, cy - r * 0.08, r * 0.12, r * 0.08);
      if (stuck > 1.5) { g.fillStyle = '#9fd0ff'; g.beginPath(); g.ellipse(cx - r * 0.85, cy - r * 0.6, r * 0.12, r * 0.2, 0, 0, 7); g.fill(); }
    }
    function drawCheese(x, y, s) {
      g.fillStyle = '#ffd400'; g.strokeStyle = '#a07000'; g.lineWidth = Math.max(1, s * 0.05);
      g.beginPath(); g.moveTo(x + s * 0.12, y + s * 0.78); g.lineTo(x + s * 0.88, y + s * 0.78); g.lineTo(x + s * 0.88, y + s * 0.42); g.lineTo(x + s * 0.12, y + s * 0.6); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#e0a800'; g.beginPath(); g.arc(x + s * 0.4, y + s * 0.68, s * 0.06, 0, 7); g.arc(x + s * 0.7, y + s * 0.6, s * 0.07, 0, 7); g.arc(x + s * 0.58, y + s * 0.72, s * 0.04, 0, 7); g.fill();
    }
    function drawCell(c, x, y, s) {
      if (c === BLOCK) bevel(x, y, s, '#e0d040', '#fff8a8', '#8a7a10');
      else if (c === WALL) { bevel(x, y, s, '#7a7a80', '#c8c8d0', '#303038'); g.fillStyle = '#404048'; const q = s * 0.2; [[q, q], [s - q, q], [q, s - q], [s - q, s - q]].forEach(([a, b]) => { g.beginPath(); g.arc(x + a, y + b, s * 0.06, 0, 7); g.fill(); }); }
      else if (c === SINK) { g.fillStyle = '#5a4a1a'; g.beginPath(); g.ellipse(x + s / 2, y + s / 2, s * 0.42, s * 0.32, 0, 0, 7); g.fill(); g.fillStyle = '#1a1000'; g.beginPath(); g.ellipse(x + s / 2, y + s * 0.54, s * 0.3, s * 0.2, 0, 0, 7); g.fill(); }
      else if (c === TRAP) { g.fillStyle = '#a0703a'; g.fillRect(x + s * 0.15, y + s * 0.3, s * 0.7, s * 0.45); g.strokeStyle = '#d0d0d8'; g.lineWidth = Math.max(1, s * 0.07); g.strokeRect(x + s * 0.22, y + s * 0.36, s * 0.56, s * 0.32); g.beginPath(); g.moveTo(x + s * 0.5, y + s * 0.36); g.lineTo(x + s * 0.5, y + s * 0.68); g.stroke(); g.fillStyle = '#ffd400'; g.fillRect(x + s * 0.44, y + s * 0.47, s * 0.12, s * 0.1); }
      else if (c === CHEESE) drawCheese(x, y, s);
    }
    // the rolling hazard: an oil can, seen end-on, rolling (its bung and drips spin round)
    function drawPie(cx, cy, s, t) {
      const r = s * 0.42, lw = Math.max(1, s * 0.05);
      g.lineWidth = lw; g.strokeStyle = '#1a0a00';
      const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(0.55, '#d82a10'); gr.addColorStop(1, '#6a0a00');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = '#4a0800'; g.beginPath(); g.arc(cx, cy, r * 0.74, 0, 7); g.stroke();
      g.fillStyle = '#c8c8d0'; g.beginPath(); g.arc(cx, cy, r * 0.62, 0, 7); g.fill();
      g.fillStyle = '#9a9aa4'; g.beginPath(); g.arc(cx + r * 0.08, cy + r * 0.08, r * 0.5, 0, 7); g.fill();
      g.save(); g.translate(cx, cy); g.rotate(t * 5);
      g.fillStyle = '#2a2a30'; g.beginPath(); g.arc(r * 0.3, 0, r * 0.15, 0, 7); g.fill();
      g.fillStyle = '#e8e8f0'; g.beginPath(); g.arc(-r * 0.3, -r * 0.05, r * 0.08, 0, 7); g.fill();
      g.fillStyle = '#ffd400'; g.fillRect(-r * 0.12, -r * 0.55, r * 0.24, r * 0.16);
      g.restore();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(cx - r * 0.5, cy - r * 0.55, r * 0.16, r * 0.08, -0.7, 0, 7); g.fill();
    }
    function drawTop(s, t) {
      const W = cv.width, H = TOP * s;
      g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, 1); g.fillStyle = '#808080'; g.fillRect(0, H - 1, W, 1);
      for (let i = 0; i < Math.max(0, lives); i++) drawSquig(s * (0.8 + i * 1.05), H / 2, s * 0.95, 1, t, false);
      // the clock
      const cx = W / 2, cy = H / 2, r = H * 0.4;
      g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = Math.max(1, s * 0.08); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#000'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(cx + Math.sin(a) * r * 0.8 - 1, cy - Math.cos(a) * r * 0.8 - 1, 2, 2); }
      const a = clock / 45 * Math.PI * 2; g.strokeStyle = '#e10600'; g.lineWidth = Math.max(1, s * 0.1); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(a) * r * 0.75, cy - Math.cos(a) * r * 0.75); g.stroke();
      g.fillStyle = '#000'; g.font = `bold ${Math.round(s * 0.75)}px "Courier New", monospace`; g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillText(String(score).padStart(6, '0'), W - s * 0.4, cy);
      g.textAlign = 'left'; g.font = `${Math.round(s * 0.55)}px Tahoma, sans-serif`;
      g.fillText(`L${level}  W${Math.min(wave + 1, waves.length)}/${waves.length}`, cx + r + s * 0.5, cy);
    }
    function draw(t) {
      if (!cv.width) resize(); const s = S(); if (!s) return;
      g.setTransform(1, 0, 0, 1, 0, 0);
      drawTop(s, t);
      g.save(); g.translate(0, TOP * s);
      g.fillStyle = '#a8a24a'; g.fillRect(0, 0, N * s, N * s);
      g.fillStyle = 'rgba(0,0,0,.06)'; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x + y) & 1) g.fillRect(x * s, y * s, s, s);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = cells[y * N + x]; if (c) drawCell(c, x * s, y * s, s); }
      for (const p of pies) drawPie((p.x + 0.5) * s, (p.y + 0.5) * s, s, t);
      for (const o of grots) drawGrot((o.x + 0.5) * s, (o.y + 0.5) * s, s, o.ph, o.stuck);
      for (const f of cheeseFx) { g.fillStyle = f.poof ? `rgba(255,255,255,${f.t})` : `rgba(255,212,0,${f.t})`; g.beginPath(); g.arc((f.x + 0.5) * s, (f.y + 0.5) * s, s * (1.2 - f.t * 0.6), 0, 7); g.fill(); if (!f.poof) { g.fillStyle = `rgba(0,0,0,${f.t})`; g.font = `bold ${Math.round(s * 0.6)}px Tahoma, sans-serif`; g.textAlign = 'center'; g.fillText('+100', (f.x + 0.5) * s, (f.y - 0.3 + f.t * 0.5) * s); } }
      const blink = me.inv > 0 && Math.floor(t * 10) % 2;
      if (mode !== 'over' && !(mode === 'dead' && Math.floor(t * 8) % 2) && !blink) drawSquig((me.x + 0.5) * s, (me.y + 0.5) * s, s, me.face, t, me.stuck > 0 || mode === 'dead');
      if (me.stuck > 0) { g.fillStyle = '#000'; g.font = `bold ${Math.round(s * 0.6)}px Tahoma, sans-serif`; g.textAlign = 'center'; g.fillText(Math.ceil(me.stuck), (me.x + 0.5) * s, (me.y - 0.2) * s); }
      const text = paused() && mode !== 'over' ? 'PAUSED' : banner;
      if (text) {
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, N * s / 2 - s * 1.8, N * s, s * 3.6);
        g.fillStyle = '#ffd400'; g.font = `bold ${Math.round(s * 1.6)}px Tahoma, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(text, N * s / 2, N * s / 2 - s * 0.4);
        g.fillStyle = '#fff'; g.font = `${Math.round(s * 0.65)}px Tahoma, sans-serif`;
        g.fillText(text === 'PAUSED' ? (manual ? 'Press F3 to carry on' : 'Click to carry on') : mode === 'over' ? `Score ${score}. F2 for a new game.` : mode === 'ready' ? 'Get ready...' : mode === 'clear' ? `Score ${score}` : '', N * s / 2, N * s / 2 + s * 0.9);
      }
      g.restore();
    }
    const paused = () => manual || held;
    let raf = 0, last = 0;
    function frame(t) {
      if (w.closed) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
      if (document.hidden || w.el.style.display === 'none') return;
      held = !(Desk.isActive ? Desk.isActive(w.el) : true);
      if (!paused()) step(dt);
      draw(t / 1000);
      if (performance.now() > msgUntil) { const s = `Level: ${level}    Score: ${score}    Spare Blobbits: ${Math.max(0, lives)}    Robots: ${grots.length}    Speed: ${opt.speed[0].toUpperCase() + opt.speed.slice(1)}`; if (s !== lastStatus) { lastStatus = s; K.status(s); } }
      else lastStatus = '';
    }

    // ---- input: keys (arrows, numpad, WASD/QEZC), mouse/tap towards a square, swipes, the touch pad
    const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], Home: [-1, -1], PageUp: [1, -1], End: [-1, 1], PageDown: [1, 1],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], q: [-1, -1], e: [1, -1], z: [-1, 1], c: [1, 1],
      Numpad8: [0, -1], Numpad2: [0, 1], Numpad4: [-1, 0], Numpad6: [1, 0], Numpad7: [-1, -1], Numpad9: [1, -1], Numpad1: [-1, 1], Numpad3: [1, 1] };
    const togglePause = () => { if (mode === 'over') return; manual = !manual; };
    body.addEventListener('keydown', ev => {
      if (ev.key === 'F2') { ev.preventDefault(); newGame(); return; }
      if (ev.key === 'F3' || ev.key === 'p' || ev.key === 'P') { ev.preventDefault(); togglePause(); return; }
      if (ev.key === 'F1') { ev.preventDefault(); help(); return; }
      if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
      const d = KEYS[ev.code] && /^Numpad/.test(ev.code) ? KEYS[ev.code] : KEYS[ev.key] || KEYS[ev.key && ev.key.toLowerCase()];
      if (d) { ev.preventDefault(); if (manual) manual = false; tryMove(d[0], d[1]); }
    });
    let wasPaused = false, down = null;
    w.el.addEventListener('pointerdown', () => { wasPaused = paused(); }, true);
    const toward = (px, py) => { const r = cv.getBoundingClientRect(), s = cs; const gx = (px - r.left) / s - 0.5, gy = (py - r.top) / s - TOP - 0.5; const dx = gx - me.x, dy = gy - me.y; if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null; const a = Math.atan2(dy, dx); const k = Math.round(a / (Math.PI / 4)); return [Math.round(Math.cos(k * Math.PI / 4)), Math.round(Math.sin(k * Math.PI / 4))]; };
    cv.addEventListener('pointerdown', ev => { ev.preventDefault(); if (wasPaused) { if (manual) manual = false; return; } down = { x: ev.clientX, y: ev.clientY }; try { cv.setPointerCapture(ev.pointerId); } catch (e) {} });
    cv.addEventListener('pointerup', ev => {
      if (!down) return; const dx = ev.clientX - down.x, dy = ev.clientY - down.y; down = null;
      if (Math.hypot(dx, dy) > 24) { const k = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)); tryMove(Math.round(Math.cos(k * Math.PI / 4)), Math.round(Math.sin(k * Math.PI / 4))); return; }
      const d = toward(ev.clientX, ev.clientY); if (d) tryMove(d[0], d[1]);
    });
    cv.addEventListener('pointercancel', () => { down = null; });
    cv.addEventListener('contextmenu', ev => ev.preventDefault());
    const PAD = [[-1, -1], [0, -1], [1, -1], [-1, 0], null, [1, 0], [-1, 1], [0, 1], [1, 1]];
    let rep = 0;
    body.querySelectorAll('.rv-pad button').forEach(b => {
      const d = PAD[+b.dataset.i];
      b.addEventListener('pointerdown', ev => { ev.preventDefault(); clearInterval(rep); if (!d) { togglePause(); return; } if (manual) manual = false; lastMove = 0; tryMove(d[0], d[1]); rep = setInterval(() => { lastMove = 0; tryMove(d[0], d[1]); }, 170); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, () => clearInterval(rep)));
      b.addEventListener('contextmenu', ev => ev.preventDefault());
    });
    const ro = new ResizeObserver(() => resize()); ro.observe(wrap);
    K.onClose(() => { cancelAnimationFrame(raf); clearInterval(rep); ro.disconnect(); if (E._rev && E._rev.w === w) delete E._rev; });

    // ---- menus + dialogs
    function scores() { const l = store.get('jhp_era_revhs', null); return Array.isArray(l) ? l : [{ n: 'Gubbinz', s: 8800, l: 6 }, { n: 'Jack', s: 5150, l: 4 }, { n: 'Dave', s: 600, l: 1 }]; }
    function showScores() {
      const b = E.h('div', 'rv-hs');
      b.innerHTML = `<div class="field" style="padding:4px"><table><tr><th>#</th><th>Name</th><th>Level</th><th>Score</th></tr>${scores().map((x, i) => `<tr><td>${i + 1}</td><td>${E.esc(x.n)}</td><td>${x.l}</td><td>${x.s}</td></tr>`).join('')}</table></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" type="button" data-r>Reset Scores</button><button class="btn" type="button" data-ok style="min-width:75px">OK</button></div>`;
      const hw = Apps.win("Blobbit's Revenge High Scores", b, { w: 300, icon: E.I.revenge, noResize: true, noMax: true, noMin: true, escClose: true });
      b.querySelector('[data-ok]').addEventListener('click', hw.close);
      b.querySelector('[data-r]').addEventListener('click', () => { store.set('jhp_era_revhs', []); hw.close(); showScores(); });
    }
    const HELP = `BLOBBIT'S REVENGE - HOW TO PLAY\n===============================\n\nYou are a Blobbit. The tin robots want to put you in a jar and\nkeep you on a shelf. Not today.\n\nMOVING\n  Arrow keys, or the number pad (7 9 1 3 go diagonally), or\n  W A S D (and Q E Z C for diagonals). Or click the board on\n  the side you want to go. There's a button pad too: click\n  the arrows, or click and drag across the board.\n\nPUSHING\n  Walk into a yellow block to push it. You can push a whole row\n  of blocks as long as there's an empty square at the end.\n  The grey metal blocks don't move. At all. Like Dad's car.\n\nTRAPPING\n  Box the robots in so they can't move. When ALL the robots are\n  stuck, they give up and turn into CHEESE. (Nobody knows why.\n  Wallace would approve.) A robot that's stuck on its own for\n  ages gives up too. Walk over the cheese to eat it (100 points).\n  When every wave of robots is cheese, you've finished the level.\n\nWATCH OUT FOR\n  The clock: every time it goes round, another robot turns up.\n  Sinkholes: you get stuck for 3 seconds. Robots LOVE that.\n  Mousetraps: SNAP. Lose a Blobbit.\n  Rolling oil cans (later levels): they bounce about. Trap one\n  and it runs dry.\n\nYou start with 3 spare Blobbits.\n\nJACK'S TIP: make a little cave in the blocks and wait inside it.\nThe robots come to you. Then push the door shut. Revenge!\n\nF2 = New Game    F3 = Pause\n`;
    function help() { Apps.openFile({ name: 'SQREVNGE.TXT', type: 'txt', text: HELP }); }
    K.menus([
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: () => newGame() },
        { label: 'Pause', key: 'F3', chk: manual, act: togglePause },
        { label: 'Level', sub: () => Array.from({ length: Math.min(maxLevel, 30) }, (_, i) => ({ label: 'Level ' + (i + 1), rad: level === i + 1, act: () => newGame(i + 1) })) },
        '-',
        { label: 'Slow', rad: opt.speed === 'slow', act: () => { opt.speed = 'slow'; saveOpt(); } },
        { label: 'Medium', rad: opt.speed === 'medium', act: () => { opt.speed = 'medium'; saveOpt(); } },
        { label: 'Fast', rad: opt.speed === 'fast', act: () => { opt.speed = 'fast'; saveOpt(); } },
        '-',
        { label: 'Sound', chk: opt.sound, act: () => { opt.sound = !opt.sound; saveOpt(); } },
        { label: 'High Scores...', act: showScores },
        '-',
        { label: 'Exit', act: () => w.close() },
      ]],
      ['Help', [
        { label: 'How to Play', key: 'F1', act: help },
        '-',
        { label: "About Blobbit's Revenge...", act: () => E.about("Blobbit's Revenge", E.I.revenge, ["<b>Blobbit's Revenge</b> version 1.0", 'JackSoft Entertainment Pack 4', 'Copyright &copy; 1999 JackSoft.', 'Dedicated to every Blobbit that ever ended up in a jam jar.']) },
      ]],
    ]);

    // test hook
    E._rev = { w, get st() { return { level, lives, score, mode, wave, waves: waves.slice(), me: { x: me.x, y: me.y, stuck: me.stuck }, grots: grots.map(o => ({ x: o.x, y: o.y, stuck: o.stuck })), pies: pies.length, paused: paused() }; },
      move: (dx, dy) => { lastMove = 0; return tryMove(dx, dy); }, step: dt => step(dt), cell: (x, y) => at(x, y), setCell: (x, y, v) => set(x, y, v),
      setGrots: l => { grots = l.map(o => ({ x: o.x, y: o.y, stuck: 0, ph: 0 })); }, setMe: (x, y) => { me.x = x; me.y = y; }, level: n => newGame(n), grotStep: () => grotStep() };
    // saved game (js/gamesave.js): the whole board (every block, grot, pie and the squig), the wave, the clock, lives and
    // score come back exactly, paused, after a refresh or a closed window
    const sv = Apps.gameSaver ? Apps.gameSaver('era.revenge', () => {
      if (mode === 'over' || (mode === 'dead' && lives < 0)) return null;
      return { cells: Array.prototype.join.call(cells, ','), me, grots, pies, level, lives, score, waves, wave, clock, grotT, pieT, mode, modeT, banner };
    }, { v: 1, live: true, every: 5000 }).watch(w) : null;
    const resume = d => {
      if (!d || typeof d.cells !== 'string' || !d.me || !Array.isArray(d.grots) || !Array.isArray(d.pies) || !Array.isArray(d.waves)) return false;
      const c = d.cells.split(',').map(Number); if (c.length !== N * N || c.some(v => !(v >= 0 && v < 32))) return false;
      cells = Uint8Array.from(c); me = Object.assign({ x: 11, y: 11, face: 1, stuck: 0, inv: 0 }, d.me); grots = d.grots; pies = d.pies;
      level = d.level || 1; lives = d.lives | 0; score = d.score | 0; waves = d.waves; wave = d.wave | 0; clock = +d.clock || 0; grotT = +d.grotT || 0; pieT = +d.pieT || 0;
      mode = ['ready', 'play', 'dead', 'clear'].includes(d.mode) ? d.mode : 'ready'; modeT = +d.modeT || 1; banner = d.banner || '';
      manual = true; say(`Carried on from your saved game: level ${level}. Press F3 to carry on.`);
      return true;
    };
    if (!resume(sv && sv.load())) { if (sv) sv.clear(); newGame(1); }
    requestAnimationFrame(() => { resize(); raf = requestAnimationFrame(frame); });
  };
})();

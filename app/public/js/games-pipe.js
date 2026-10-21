/* Pipe Jack for JackOS 98 (lazy loaded by apps-games.js).
 * Lay pipes from the squig juice tank before the green stuff starts flowing. Original art and code. */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;
  const GW = 10, GH = 7, TAU = Math.PI * 2;
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0]; // 0 up, 1 right, 2 down, 3 left
  const OPP = d => (d + 2) % 4;
  const OPEN = { h: [1, 3], v: [0, 2], ne: [0, 1], nw: [0, 3], se: [1, 2], sw: [2, 3], x: [0, 1, 2, 3], rh: [1, 3], rv: [0, 2] };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const has = (t, d) => !!t && OPEN[t].includes(d);
  // where juice entering from side `din` comes out
  function exitOf(t, din) {
    if (t === 'x' || t === 'h' || t === 'v' || t === 'rh' || t === 'rv') return OPP(din);
    const o = OPEN[t]; return o[0] === din ? o[1] : o[0];
  }

  JG.mod('pipe', G => {
    G.fit();
    const host = G.host;
    let opts = Object.assign({ start: 1, sound: true }, G.store.get('opts', {}));
    const scores = G.scores({ title: 'Pipe Jack High Scores', max: 5e6, seed: [['JACK', 12500], ['DAVE', 6400], ['GUBBINZ', 3100], [Cast.t('COUSIN {cousin.NAME}'), 2200], ['MOM', 900]] });
    let L = { rot: false };
    const C = G.canvas(host, (W, H) => layout(W, H));
    const cv = C.cv, ctx = C.c;
    G.focusEl = cv;

    // ---------------------------------------------------------------- state
    let S = null;
    function levelParams(n) {
      return { need: Math.min(28, 8 + n * 2), count: Math.max(7, 22 - n * 2), tileT: Math.max(0.55, 2.3 - n * 0.2), rocks: n >= 2 ? Math.min(9, n + 1) : 0, end: n >= 3, res: n >= 4 };
    }
    // online races (mp.js): every level is laid out, and every pipe dealt, from the shared seed, so everybody gets the
    // same tanks, rocks and dispenser. Highest score when the juice finally spills wins.
    let race = null, raceSeed = 0, raceStart = 1;
    function newGame(rseed) {
      if (typeof rseed === 'number') raceSeed = rseed >>> 0 || 1;
      else { if (race && race.active) { Desk.toast('Pipe Jack', "You're in a race! Keep piping.", 2500); return; } raceSeed = 0; }
      S = { level: raceSeed ? raceStart : Math.max(1, opts.start | 0), score: 0, over: false };
      startLevel();
    }
    function rndPiece() {
      const P = levelParams(S.level), bag = [['h', 1.2], ['v', 1.2], ['ne', 1], ['nw', 1], ['se', 1], ['sw', 1], ['x', 0.6]];
      if (P.res) bag.push(['rh', 0.25], ['rv', 0.25]);
      let tot = bag.reduce((a, b) => a + b[1], 0), r = (S.pr || Math.random)() * tot;
      for (const [t, w] of bag) { if ((r -= w) < 0) return t; }
      return 'h';
    }
    function startLevel() {
      const P = levelParams(S.level);
      S.P = P; S.state = 'count'; S.timer = P.count; S.countMax = P.count; S.len = 0; S.fast = false; S.crossBonus = 0; S.levelScore = 0;
      const lr = raceSeed ? JG.rng(raceSeed + S.level * 7919) : Math.random; S.pr = raceSeed ? JG.rng((raceSeed ^ (S.level * 104729)) >>> 0) : null;
      S.cells = []; for (let y = 0; y < GH; y++) { const row = []; for (let x = 0; x < GW; x++) row.push({ t: null, rock: false, fill: 0, fh: 0, fv: 0, pop: 0, lock: false }); S.cells.push(row); }
      // the start tank: inner cell, pointing at a neighbour
      const sx = 1 + (lr() * (GW - 2) | 0), sy = 1 + (lr() * (GH - 2) | 0), sd = lr() * 4 | 0;
      S.start = { x: sx, y: sy, d: sd };
      Object.assign(S.cells[sy][sx], { t: 'start', lock: true });
      const reserved = new Set([sx + ',' + sy, (sx + DX[sd]) + ',' + (sy + DY[sd])]);
      S.end = null;
      if (P.end) {
        for (let k = 0; k < 200 && !S.end; k++) {
          const ex = lr() * GW | 0, ey = lr() * GH | 0, ed = lr() * 4 | 0, nx = ex + DX[ed], ny = ey + DY[ed];
          if (Math.abs(ex - sx) + Math.abs(ey - sy) < 5 || nx < 0 || ny < 0 || nx >= GW || ny >= GH || reserved.has(ex + ',' + ey) || reserved.has(nx + ',' + ny)) continue;
          S.end = { x: ex, y: ey, d: ed }; Object.assign(S.cells[ey][ex], { t: 'end', lock: true });
          reserved.add(ex + ',' + ey); reserved.add(nx + ',' + ny);
        }
      }
      for (let k = 0, n = 0; k < 300 && n < P.rocks; k++) {
        const x = lr() * GW | 0, y = lr() * GH | 0;
        if (reserved.has(x + ',' + y) || S.cells[y][x].rock) continue;
        S.cells[y][x].rock = true; n++;
      }
      S.queue = []; for (let i = 0; i < 5; i++) S.queue.push(rndPiece());
      S.flow = null; S.leak = null; S.result = null; S.cursor = { x: Math.min(GW - 1, sx + 1), y: sy }; S.paused = false; S.mood = 'idle'; S.moodT = 0; S.splash = 0; S.banner = { t: 'LEVEL ' + S.level, sub: `Lay at least ${P.need} pipes!`, time: 2.2 }; S.cool = 0;
      if (S.level >= 6) G.secret('games.pipe.level');
      G.sfx('join');
    }

    // ---------------------------------------------------------------- placing pieces
    function place(x, y) {
      if (!S || S.over || S.paused || (S.state !== 'count' && S.state !== 'flow')) return;
      if (S.cool > 0) return;
      const c = S.cells[y] && S.cells[y][x]; if (!c) return;
      S.cursor = { x, y };
      if (c.rock || c.lock || c.t === 'start' || c.t === 'end') { G.sfx('beep'); return; }
      if (c.t) { // swap out an unfilled piece: costs points and a moment
        add(-50); S.cool = 0.35; c.boom = 0.35; G.sfx('thud'); setMood('cross', 0.8);
      } else G.sfx('click');
      c.t = S.queue.shift(); c.pop = 1; S.queue.push(rndPiece());
    }
    function add(n) { S.score = Math.max(0, S.score + n); if (n) S.levelScore += n; }
    function setMood(m, t) { S.mood = m; S.moodT = t || 1.2; }

    // ---------------------------------------------------------------- the flow
    function beginFlow() { S.state = 'flow'; S.flow = { x: S.start.x, y: S.start.y, din: -1, dout: S.start.d, p: 0, t: 'start' }; G.sfx('boing'); setMood('worry', 1.5); }
    function tileTime(t) { const base = S.fast ? 0.09 : S.P.tileT; return t === 'start' ? base * 0.6 : (t === 'rh' || t === 'rv') ? base * 3 : base; }
    function stepFlow(dt) {
      const f = S.flow; if (!f) return;
      f.p += dt / tileTime(f.t);
      if (f.p < 1) return;
      // finish this tile
      const c = S.cells[f.y][f.x];
      if (f.t !== 'start') {
        if (f.t === 'x') { if (f.din === 1 || f.din === 3) c.fh = 1; else c.fv = 1; if (c.fh && c.fv) { add(500); S.crossBonus++; G.secret('games.pipe.cross'); S.banner = { t: 'CROSS BONUS!', sub: '+500', time: 1.2 }; G.sfx('pet'); setMood('happy'); } }
        c.fill = 1; S.len++; add(S.fast ? 100 : 50); G.note(300 + Math.min(S.len, 30) * 25, 0.05, 'triangle');
        if (S.len === S.P.need) { S.banner = { t: 'GOAL REACHED!', sub: 'Every extra pipe is a bonus', time: 1.6 }; G.sfx('join'); setMood('happy'); }
      } else c.fill = 1;
      const out = f.t === 'start' ? S.start.d : exitOf(f.t, f.din);
      const nx = f.x + DX[out], ny = f.y + DY[out], din = OPP(out);
      const n = S.cells[ny] && S.cells[ny][nx];
      if (n && n.t === 'end' && S.end && S.end.d === din) { n.fill = 1; S.flow = null; return endLevel(true, true); }
      let ok = n && !n.rock && n.t && n.t !== 'start' && n.t !== 'end' && has(n.t, din);
      if (ok && n.t === 'x') { if ((din === 1 || din === 3) ? n.fh : n.fv) ok = false; }
      else if (ok && n.fill) ok = false;
      if (!ok) { S.flow = null; S.leak = { x: f.x, y: f.y, d: out }; return endLevel(S.len >= S.P.need, false); }
      n.lock = true;
      S.flow = { x: nx, y: ny, din, dout: exitOf(n.t, din), p: f.p - 1, t: n.t };
      // worried grot when the juice is heading for an open end
      const ax = nx + DX[S.flow.dout], ay = ny + DY[S.flow.dout], a = S.cells[ay] && S.cells[ay][ax];
      if (!a || !a.t || !has(a.t, OPP(S.flow.dout))) setMood('worry', 1);
    }
    function endLevel(ok, endTank) {
      S.state = 'done';
      let unused = 0;
      for (const row of S.cells) for (const c of row) if (c.t && OPEN[c.t] && !c.fill && !c.fh && !c.fv) unused++;
      if (ok) {
        const extra = Math.max(0, S.len - S.P.need) * 100, tankB = endTank ? 1000 : 0, pen = unused * 100;
        add(extra + tankB - pen);
        S.result = { ok: true, lines: [`Pipes filled: ${S.len} (needed ${S.P.need})`, `Extra pipe bonus: +${extra}`, ...(endTank ? ['Reached the end tank: +1000'] : []), ...(S.crossBonus ? [`Cross bonuses: ${S.crossBonus}`] : []), `Unused pipes: -${pen}`, `Score: ${JG.fmt(S.score)}`] };
        G.sfx('solve'); setMood('happy', 99);
      } else {
        S.result = { ok: false, lines: [`SPLOOSH! Green slime everywhere.`, `Pipes filled: ${S.len} of ${S.P.need}`, `Final score: ${JG.fmt(S.score)}`, 'Gubbinz is licking the floor.'] };
        S.splash = 1; G.sfx('uhoh'); setMood('panic', 99);
        S.over = true;
        if (race && race.active) { race.progress(1, JG.fmt(S.score)); race.done({ ok: true, score: S.score }); return; }
        const sc = S.score; G.timeout(() => { if (sc > 0) scores.submit(sc); }, 1400);
      }
    }
    function next() {
      if (!S || S.state !== 'done') return;
      if (S.over) { newGame(); return; }
      S.level++; startLevel();
      if (race && race.active) race.progress(Math.min(0.95, (S.level - raceStart) / 8), `L${S.level} ${JG.fmt(S.score)}`);
    }

    // ---------------------------------------------------------------- layout
    function layout(W, H) {
      if (W == null) { W = C.W; H = C.H; }
      L.rot = W < H * 0.9; // portrait: draw the board turned 90 degrees so it fits a phone
      const pad = 8;
      if (!L.rot) {
        const side = clamp(W * 0.21, 124, 170);
        const cell = Math.floor(Math.min((W - side - pad * 3) / GW, (H - pad * 2) / GH));
        L.cell = Math.max(16, cell);
        L.bw = GW * L.cell; L.bh = GH * L.cell;
        L.side = { x: pad, y: pad, w: side, h: H - pad * 2 };
        L.ox = side + pad * 2 + Math.max(0, (W - side - pad * 3 - L.bw) / 2); L.oy = pad + Math.max(0, (H - pad * 2 - L.bh) / 2);
        L.sw = L.bw; L.sh = L.bh;
      } else {
        const top = 112;
        const cell = Math.floor(Math.min((W - pad * 2) / GH, (H - top - pad * 2) / GW));
        L.cell = Math.max(16, cell);
        L.bw = GW * L.cell; L.bh = GH * L.cell;
        L.sw = L.bh; L.sh = L.bw;
        const spare = H - top - pad * 2 - L.sh;
        L.grotArea = spare > 70 ? { x: pad, y: top + L.sh + pad * 2, w: W - pad * 2, h: spare - pad } : null;
        const y0 = L.grotArea ? 0 : spare / 2;
        L.side = { x: pad, y: pad + y0, w: W - pad * 2, h: top - pad * 2 };
        L.ox = (W - L.sw) / 2; L.oy = top + y0;
      }
    }
    // logical board coords -> screen transform
    function boardT() {
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      if (L.rot) { ctx.translate(L.ox + L.sw, L.oy); ctx.rotate(Math.PI / 2); } else ctx.translate(L.ox, L.oy);
    }
    function cellAt(px, py) {
      let x, y;
      if (L.rot) { x = py - L.oy; y = L.ox + L.sw - px; } else { x = px - L.ox; y = py - L.oy; }
      const cx = Math.floor(x / L.cell), cy = Math.floor(y / L.cell);
      return cx >= 0 && cy >= 0 && cx < GW && cy < GH ? { x: cx, y: cy } : null;
    }

    // ---------------------------------------------------------------- drawing
    let tNow = 0;
    function tilePlate(x, y, s, rock) {
      const g = ctx.createLinearGradient(x, y, x + s, y + s);
      g.addColorStop(0, '#8d8d94'); g.addColorStop(1, '#5d5d66');
      ctx.fillStyle = g; ctx.fillRect(x, y, s, s);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, y, s, 1); ctx.fillRect(x, y, 1, s);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y + s - 1, s, 1); ctx.fillRect(x + s - 1, y, 1, s);
      const r = Math.max(1, s * 0.04);
      ctx.fillStyle = '#44444c'; for (const [a, b] of [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]]) { ctx.beginPath(); ctx.arc(x + s * a, y + s * b, r, 0, TAU); ctx.fill(); }
      if (rock) {
        ctx.fillStyle = '#6a5a4a'; ctx.strokeStyle = '#2a2018'; ctx.lineWidth = Math.max(1, s * 0.04);
        ctx.beginPath(); ctx.moveTo(x + s * 0.15, y + s * 0.8); ctx.lineTo(x + s * 0.2, y + s * 0.4); ctx.lineTo(x + s * 0.45, y + s * 0.18); ctx.lineTo(x + s * 0.75, y + s * 0.28); ctx.lineTo(x + s * 0.88, y + s * 0.6); ctx.lineTo(x + s * 0.8, y + s * 0.85); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(x + s * 0.3, y + s * 0.4); ctx.lineTo(x + s * 0.45, y + s * 0.26); ctx.lineTo(x + s * 0.55, y + s * 0.4); ctx.closePath(); ctx.fill();
      }
    }
    // a pipe segment path inside a tile centred at (cx, cy), from side a to side b, optional fraction p from a
    function segPath(cx, cy, h, a, b, p) {
      p = p == null ? 1 : p;
      const ax = cx + DX[a] * h, ay = cy + DY[a] * h, bx = cx + DX[b] * h, by = cy + DY[b] * h;
      ctx.beginPath();
      if (a === OPP(b)) { ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p); return; }
      const kx = cx + (DX[a] + DX[b]) * h, ky = cy + (DY[a] + DY[b]) * h;
      const a0 = Math.atan2(ay - ky, ax - kx), a1 = Math.atan2(by - ky, bx - kx);
      let d = a1 - a0; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
      ctx.arc(kx, ky, h, a0, a0 + d * p, d < 0);
    }
    function strokePipe(cx, cy, h, a, b, s, reservoir) {
      ctx.lineCap = 'butt';
      const lw = s * (reservoir ? 0.5 : 0.36);
      for (const [w, col] of [[lw + s * 0.08, '#1e1e24'], [lw, '#9aa0aa'], [lw * 0.55, '#c8ccd4'], [lw * 0.18, '#f4f6fa']]) { ctx.lineWidth = w; ctx.strokeStyle = col; segPath(cx, cy, h, a, b); ctx.stroke(); }
      // inner channel
      ctx.lineWidth = lw * 0.5; ctx.strokeStyle = '#2a2a30'; segPath(cx, cy, h, a, b); ctx.stroke();
    }
    function strokeJuice(cx, cy, h, a, b, p, s, reservoir) {
      if (p <= 0) return;
      ctx.lineCap = 'round';
      const lw = s * (reservoir ? 0.3 : 0.2);
      ctx.save(); ctx.shadowColor = '#7cff3a'; ctx.shadowBlur = s * 0.25;
      ctx.lineWidth = lw; ctx.strokeStyle = '#47e01a'; segPath(cx, cy, h, a, b, Math.min(1, p)); ctx.stroke();
      ctx.restore();
      ctx.lineWidth = lw * 0.35; ctx.strokeStyle = 'rgba(220,255,160,.8)'; segPath(cx, cy, h, a, b, Math.min(1, p)); ctx.stroke();
      ctx.lineCap = 'butt';
    }
    function flanges(cx, cy, h, sides, s) {
      ctx.fillStyle = '#3a3a42';
      for (const d of sides) { const fx = cx + DX[d] * (h - s * 0.05), fy = cy + DY[d] * (h - s * 0.05), hw = s * 0.25, hh = s * 0.06; if (DX[d]) ctx.fillRect(fx - hh, fy - hw, hh * 2, hw * 2); else ctx.fillRect(fx - hw, fy - hh, hw * 2, hh * 2); }
    }
    function drawPiece(t, x, y, s, c, flowInfo) {
      const cx = x + s / 2, cy = y + s / 2, h = s / 2;
      const res = t === 'rh' || t === 'rv';
      if (t === 'x') {
        strokePipe(cx, cy, h, 0, 2, s);
        if (c) strokeJuice(cx, cy, h, flowInfo && (flowInfo.din === 0 || flowInfo.din === 2) ? flowInfo.din : 0, flowInfo && (flowInfo.din === 0 || flowInfo.din === 2) ? OPP(flowInfo.din) : 2, c.fv ? 1 : (flowInfo && (flowInfo.din === 0 || flowInfo.din === 2) ? flowInfo.p : 0), s);
        // the bridge on top
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(cx - s * 0.26, cy - s * 0.3, s * 0.52, s * 0.6);
        strokePipe(cx, cy, h, 3, 1, s);
        if (c) strokeJuice(cx, cy, h, flowInfo && (flowInfo.din === 1 || flowInfo.din === 3) ? flowInfo.din : 3, flowInfo && (flowInfo.din === 1 || flowInfo.din === 3) ? OPP(flowInfo.din) : 1, c.fh ? 1 : (flowInfo && (flowInfo.din === 1 || flowInfo.din === 3) ? flowInfo.p : 0), s);
        flanges(cx, cy, h, [0, 1, 2, 3], s);
        return;
      }
      const [a, b] = OPEN[t];
      strokePipe(cx, cy, h, a, b, s, res);
      if (res) { // a fat glass reservoir in the middle
        ctx.fillStyle = '#20302a'; ctx.strokeStyle = '#1e1e24'; ctx.lineWidth = s * 0.05;
        const rw = t === 'rh' ? s * 0.62 : s * 0.42, rh = t === 'rh' ? s * 0.42 : s * 0.62;
        ctx.beginPath(); ctx.rect(cx - rw / 2, cy - rh / 2, rw, rh); ctx.fill(); ctx.stroke();
        const p = c ? (c.fill ? 1 : flowInfo ? flowInfo.p : 0) : 0;
        if (p > 0) { ctx.fillStyle = '#47e01a'; if (t === 'rh') ctx.fillRect(cx - rw / 2 + 2, cy + rh / 2 - 2 - (rh - 4) * p, rw - 4, (rh - 4) * p); else ctx.fillRect(cx - rw / 2 + 2, cy + rh / 2 - 2 - (rh - 4) * p, rw - 4, (rh - 4) * p); }
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(cx - rw / 2 + 3, cy - rh / 2 + 3, Math.max(1, s * 0.05), rh - 6);
      }
      if (c) {
        if (c.fill && !res) strokeJuice(cx, cy, h, a, b, 1, s);
        else if (flowInfo && !res) strokeJuice(cx, cy, h, flowInfo.din, exitOf(t, flowInfo.din), flowInfo.p, s);
      }
      flanges(cx, cy, h, OPEN[t], s);
    }
    function drawTank(x, y, s, d, kind, c) { // start tank / end tank
      const cx = x + s / 2, cy = y + s / 2, h = s / 2;
      // stub pipe to the edge
      ctx.lineCap = 'butt';
      for (const [w, col] of [[s * 0.44, '#1e1e24'], [s * 0.36, '#9aa0aa'], [s * 0.2, '#c8ccd4']]) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + DX[d] * h, cy + DY[d] * h); ctx.stroke(); }
      ctx.lineWidth = s * 0.18; ctx.strokeStyle = '#2a2a30'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + DX[d] * h, cy + DY[d] * h); ctx.stroke();
      if (kind === 'start' && S.state !== 'count') { const p = S.flow && S.flow.t === 'start' ? S.flow.p : 1; ctx.save(); ctx.shadowColor = '#7cff3a'; ctx.shadowBlur = s * 0.2; ctx.lineWidth = s * 0.2; ctx.strokeStyle = '#47e01a'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + DX[d] * h * p, cy + DY[d] * h * p); ctx.stroke(); ctx.restore(); }
      if (kind === 'end' && c && c.fill) { ctx.lineWidth = s * 0.2; ctx.strokeStyle = '#47e01a'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + DX[d] * h, cy + DY[d] * h); ctx.stroke(); }
      // barrel
      const r = s * 0.36;
      const g = ctx.createLinearGradient(cx - r, 0, cx + r, 0); g.addColorStop(0, kind === 'start' ? '#1a5a10' : '#5a4a10'); g.addColorStop(0.45, kind === 'start' ? '#5ad82a' : '#e0c040'); g.addColorStop(1, kind === 'start' ? '#1a5a10' : '#5a4a10');
      ctx.fillStyle = g; ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(1, s * 0.04);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, 0, TAU); ctx.stroke();
      if (kind === 'start') {
        // countdown gauge: a ring that empties
        const frac = S.state === 'count' ? S.timer / S.countMax : 0;
        ctx.strokeStyle = frac < 0.25 ? '#ff3030' : '#fff'; ctx.lineWidth = Math.max(2, s * 0.07);
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.stroke();
        ctx.fillStyle = '#062'; ctx.font = `bold ${Math.round(s * 0.15)}px Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.save(); ctx.translate(cx, cy); if (L.rot) ctx.rotate(-Math.PI / 2); ctx.fillText('SLIME', 0, 0); ctx.restore();
      } else {
        ctx.fillStyle = '#430'; ctx.font = `bold ${Math.round(s * 0.2)}px Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.save(); ctx.translate(cx, cy); if (L.rot) ctx.rotate(-Math.PI / 2); ctx.fillText('END', 0, 0); ctx.restore();
      }
    }
    function drawBoard() {
      const s = L.cell;
      boardT();
      ctx.fillStyle = '#222'; ctx.fillRect(-4, -4, L.bw + 8, L.bh + 8);
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        const c = S.cells[y][x], px = x * s, py = y * s;
        tilePlate(px, py, s, c.rock);
        if (c.t === 'start') drawTank(px, py, s, S.start.d, 'start', c);
        else if (c.t === 'end') drawTank(px, py, s, S.end.d, 'end', c);
        else if (c.t) {
          let sc = 1; if (c.pop > 0) sc = 1 + Math.sin(c.pop * Math.PI) * 0.15;
          ctx.save(); ctx.translate(px + s / 2, py + s / 2); ctx.scale(sc, sc); ctx.translate(-s / 2, -s / 2);
          const fi = S.flow && S.flow.x === x && S.flow.y === y ? S.flow : null;
          drawPiece(c.t, 0, 0, s, c, fi);
          ctx.restore();
        }
        if (c.boom > 0) { ctx.fillStyle = `rgba(255,220,120,${c.boom * 2})`; ctx.beginPath(); ctx.arc(px + s / 2, py + s / 2, s * (0.6 - c.boom), 0, TAU); ctx.fill(); }
      }
      // the leak splash
      if (S.leak) {
        const lx = (S.leak.x + 0.5 + DX[S.leak.d] * 0.5) * s, ly = (S.leak.y + 0.5 + DY[S.leak.d] * 0.5) * s, k = Math.min(1, 1.2 - S.splash);
        ctx.fillStyle = 'rgba(70,224,26,.85)';
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, r = s * (0.15 + 0.5 * k) * (0.6 + (i % 3) * 0.25); ctx.beginPath(); ctx.arc(lx + Math.cos(a) * r, ly + Math.sin(a) * r, s * 0.12 * (1 - k * 0.3), 0, TAU); ctx.fill(); }
        ctx.beginPath(); ctx.arc(lx, ly, s * 0.22, 0, TAU); ctx.fill();
      }
      // cursor (keyboard / hover)
      if (S.cursor && (S.state === 'count' || S.state === 'flow')) {
        const { x, y } = S.cursor; ctx.strokeStyle = Math.sin(tNow * 8) > 0 ? '#ffd400' : '#fff'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.strokeRect(x * s + 2, y * s + 2, s - 4, s - 4); ctx.setLineDash([]);
        // ghost of the next piece
        const c = S.cells[y][x];
        if (!c.t && !c.rock && !G.phone()) { ctx.globalAlpha = 0.35; drawPiece(S.queue[0], x * s, y * s, s, null, null); ctx.globalAlpha = 1; }
      }
    }
    function drawGrot(cx, cy, r, mood) {
      ctx.save(); ctx.translate(cx, cy);
      const wob = mood === 'panic' ? Math.sin(tNow * 30) * r * 0.06 : mood === 'happy' ? Math.abs(Math.sin(tNow * 8)) * -r * 0.1 : 0;
      ctx.translate(wob, mood === 'happy' ? wob : 0);
      ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(1, r * 0.06); ctx.lineJoin = 'round';
      // overalls body
      ctx.fillStyle = '#2349b8'; ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.55); ctx.lineTo(-r * 0.6, r * 1.3); ctx.lineTo(r * 0.6, r * 1.3); ctx.lineTo(r * 0.5, r * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke();
      // wrench
      ctx.save(); ctx.translate(r * 0.75, r * 0.7); ctx.rotate(mood === 'happy' ? -0.9 + Math.sin(tNow * 10) * 0.3 : -0.4);
      ctx.fillStyle = '#b0b4c0'; ctx.fillRect(-r * 0.08, -r * 0.7, r * 0.16, r * 0.8); ctx.strokeRect(-r * 0.08, -r * 0.7, r * 0.16, r * 0.8);
      ctx.beginPath(); ctx.arc(0, -r * 0.75, r * 0.2, 0.6, TAU - 0.6 + Math.PI, false); ctx.fill(); ctx.stroke(); ctx.restore();
      // ears
      ctx.fillStyle = '#4c9a24';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * 0.4, -r * 0.1); ctx.lineTo(s * r * 1.1, -r * (mood === 'panic' ? 0.7 : 0.45)); ctx.lineTo(s * r * 0.45, r * 0.25); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#5aac2c'; ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.55, r * 0.58, 0, 0, TAU); ctx.fill(); ctx.stroke();
      // cap
      ctx.fillStyle = '#e10600'; ctx.beginPath(); ctx.ellipse(0, -r * 0.33, r * 0.5, r * 0.22, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.fillRect(-r * 0.05, -r * 0.36, r * 0.65, r * 0.08);
      // eyes
      const eo = mood === 'worry' || mood === 'panic' ? r * 0.15 : r * 0.1;
      for (const s of [-1, 1]) { ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.arc(s * r * 0.2, -r * 0.02, eo, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e10600'; ctx.beginPath(); ctx.arc(s * r * 0.2, -r * 0.02, eo * 0.45, 0, TAU); ctx.fill(); }
      // mouth
      ctx.fillStyle = '#300';
      if (mood === 'happy') { ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.28, r * 0.15, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#fff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * 0.16, r * 0.3); ctx.lineTo(s * r * 0.1, r * 0.39); ctx.lineTo(s * r * 0.04, r * 0.3); ctx.fill(); } }
      else if (mood === 'panic' || mood === 'worry') { ctx.beginPath(); ctx.ellipse(0, r * 0.36, r * (mood === 'panic' ? 0.16 : 0.1), r * (mood === 'panic' ? 0.14 : 0.07), 0, 0, TAU); ctx.fill(); }
      else if (mood === 'cross') { ctx.strokeStyle = '#300'; ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.38); ctx.lineTo(r * 0.2, r * 0.32); ctx.stroke(); }
      else { ctx.strokeStyle = '#300'; ctx.beginPath(); ctx.arc(0, r * 0.22, r * 0.18, 0.3, Math.PI - 0.3); ctx.stroke(); }
      if (mood === 'worry' || mood === 'panic') { ctx.fillStyle = '#7ec8ff'; ctx.beginPath(); ctx.arc(r * 0.6, -r * 0.2 + (tNow * 30 % 10) * r * 0.03, r * 0.07, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    const SAYS = { idle: ['Pipes, pipes, pipes!', 'It looks like you\'re doing plumbing!', 'Hurry up, boss!'], worry: ['Uh oh...', 'It\'s coming!!', 'PIPE! QUICK!'], happy: ['Lovely jubbly!', 'Super Plumber Bros!', 'Top plumbing!'], panic: ['AAARGH!', 'Get the mop!'], cross: ['Oi! My pipe!', 'Wasteful!'] };
    function bevel(x, y, w, h, inset) {
      ctx.fillStyle = '#c0c0c0'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = inset ? '#808080' : '#fff'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h);
      ctx.fillStyle = inset ? '#fff' : '#404040'; ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h);
    }
    function lcd(x, y, w, h, label, val) {
      ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#7cff3a'; ctx.font = `bold ${Math.round(h * 0.55)}px "Courier New", monospace`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(val, x + w - 4, y + h / 2 + 1);
      ctx.fillStyle = '#2a8a1a'; ctx.font = `${Math.max(9, Math.round(h * 0.32))}px Tahoma, sans-serif`; ctx.textAlign = 'left'; ctx.fillText(label, x + 4, y + h / 2 + 1);
    }
    function drawQueuePiece(t, x, y, s, hl) {
      bevel(x - 3, y - 3, s + 6, s + 6, true);
      tilePlate(x, y, s, false);
      ctx.save();
      if (L.rot) { ctx.translate(x + s / 2, y + s / 2); ctx.rotate(Math.PI / 2); ctx.translate(-s / 2, -s / 2); drawPiece(t, 0, 0, s, null, null); }
      else drawPiece(t, x, y, s, null, null);
      ctx.restore();
      if (hl) { ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 3; ctx.strokeRect(x - 1.5, y - 1.5, s + 3, s + 3); }
    }
    function drawSide() {
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      const sd = L.side;
      bevel(sd.x, sd.y, sd.w, sd.h, false);
      if (!L.rot) {
        const rows = [['LEVEL', String(S.level)], ['SCORE', JG.fmt(S.score)], ['PIPES', `${S.len} / ${S.P.need}`], ['TIMER', S.state === 'count' ? Math.ceil(S.timer) + 's' : S.fast ? 'FAST' : 'FLOW']];
        const lh = Math.min(30, Math.max(22, sd.h * 0.06)), statsH = rows.length * (lh + 4);
        const qs = Math.max(20, Math.min(sd.w * 0.4, (sd.h - statsH - 44) / 5 - 8));
        const qx = sd.x + 10, qy = sd.y + 22;
        ctx.fillStyle = '#000'; ctx.font = 'bold 11px Tahoma, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('PIPES', qx, sd.y + 6);
        // newest at the top, next one at the bottom (it's a dispenser)
        for (let i = 4; i >= 0; i--) drawQueuePiece(S.queue[i], qx, qy + (4 - i) * (qs + 8), qs, i === 0);
        ctx.fillStyle = '#000080'; ctx.font = 'bold 10px Tahoma, sans-serif'; ctx.fillText('\u25B2 NEXT', qx, qy + 5 * (qs + 8) - 3);
        // the plumber beside the dispenser
        const gx = qx + qs + 8, gw = sd.x + sd.w - gx - 6;
        if (gw > 34) {
          const gr = Math.min(gw * 0.32, 26), gy = qy + 5 * (qs + 8) - gr * 1.4 - 14;
          drawGrot(gx + gw / 2, gy, gr, S.mood);
          const lines = SAYS[S.mood] || SAYS.idle, txt = lines[Math.floor(tNow / 3) % lines.length];
          ctx.fillStyle = '#000'; ctx.font = '10px Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          const words = txt.split(' '); let line = '', ly = gy - gr * 1.3, out = [];
          for (const wd of words) { const t2 = line ? line + ' ' + wd : wd; if (ctx.measureText(t2).width > gw && line) { out.push(line); line = wd; } else line = t2; }
          out.push(line); out.reverse().forEach((t2, i) => ctx.fillText(t2, gx + gw / 2, ly - i * 12));
        }
        let y = sd.y + sd.h - statsH - 4;
        for (const [k, v] of rows) { lcd(sd.x + 8, y, sd.w - 16, lh, k, v); y += lh + 4; }
      } else {
        const qs = Math.min((sd.w * 0.58) / 5.6, sd.h - 26);
        const qx = sd.x + 10, qy = sd.y + 18;
        ctx.fillStyle = '#000'; ctx.font = 'bold 11px Tahoma, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('NEXT ▼', qx, sd.y + 4);
        for (let i = 0; i < 5; i++) drawQueuePiece(S.queue[i], qx + i * (qs + 7), qy, qs, i === 0);
        const lx = qx + 5 * (qs + 7) + 4, lw = sd.x + sd.w - lx - 6, lh = Math.min(22, (sd.h - 10) / 4);
        const rows = [['LVL', String(S.level)], ['PTS', JG.fmt(S.score)], ['PIPE', `${S.len}/${S.P.need}`], ['T', S.state === 'count' ? Math.ceil(S.timer) + 's' : S.fast ? 'FAST' : 'FLOW']];
        rows.forEach(([k, v], i) => lcd(lx, sd.y + 4 + i * (lh + 2), lw, lh, k, v));
        const ga = L.grotArea;
        if (ga) {
          const gr = Math.min(ga.h * 0.3, 30);
          drawGrot(ga.x + gr * 1.6, ga.y + gr * 1.1, gr, S.mood);
          const lines = SAYS[S.mood] || SAYS.idle, txt = lines[Math.floor(tNow / 3) % lines.length];
          ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Tahoma, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('\u201C' + txt + '\u201D', ga.x + gr * 3.2, ga.y + gr);
        }
      }
    }
    function drawBanner() {
      const b = S.banner; if (!b || b.time <= 0) return;
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      const cx = L.ox + L.sw / 2, cy = L.oy + L.sh / 2, a = Math.min(1, b.time * 2);
      ctx.globalAlpha = a;
      ctx.font = `bold ${Math.round(Math.min(34, L.sw / 10))}px Bangers, Impact, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.strokeText(b.t, cx, cy - 10); ctx.fillStyle = '#7cff3a'; ctx.fillText(b.t, cx, cy - 10);
      ctx.font = 'bold 13px Tahoma, sans-serif'; ctx.lineWidth = 3; ctx.strokeText(b.sub, cx, cy + 18); ctx.fillStyle = '#fff'; ctx.fillText(b.sub, cx, cy + 18);
      ctx.globalAlpha = 1;
    }
    function drawResult() {
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      const r = S.result, w = Math.min(300, L.sw - 20), lh = 18, h = 70 + r.lines.length * lh;
      const x = L.ox + (L.sw - w) / 2, y = L.oy + (L.sh - h) / 2;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(L.ox, L.oy, L.sw, L.sh);
      bevel(x, y, w, h, false);
      ctx.fillStyle = '#000080'; ctx.fillRect(x + 3, y + 3, w - 6, 20);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Tahoma, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(r.ok ? `Level ${S.level} complete!` : 'Game Over', x + 8, y + 13);
      ctx.fillStyle = '#000'; ctx.font = '12px Tahoma, sans-serif';
      r.lines.forEach((t, i) => ctx.fillText(t, x + 12, y + 38 + i * lh));
      ctx.fillStyle = '#000080'; ctx.font = 'bold 12px Tahoma, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(r.ok ? (G.phone() ? 'Click for the next level' : 'Click or press Space for the next level') : (G.phone() ? 'Click to play again' : 'Click or press F2 to play again'), x + w / 2, y + h - 16);
    }
    function draw() {
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      const bg = ctx.createLinearGradient(0, 0, 0, C.H); bg.addColorStop(0, '#2a3a2a'); bg.addColorStop(1, '#101810');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, C.W, C.H);
      if (!S) return;
      drawSide();
      drawBoard();
      drawBanner();
      if (S.state === 'done' && S.result && S.splash <= 0.3) drawResult();
      if (S.paused) {
        ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, C.W, C.H);
        ctx.fillStyle = '#7cff3a'; ctx.font = 'bold 26px Bangers, Impact, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', C.W / 2, C.H / 2 - 12);
        ctx.fillStyle = '#fff'; ctx.font = '12px Tahoma, sans-serif'; ctx.fillText(G.phone() ? 'Click to carry on' : 'Click or press a key to carry on', C.W / 2, C.H / 2 + 14);
      }
    }

    // ---------------------------------------------------------------- loop
    G.loop(dt => {
      if (!S) return;
      if (!S.paused) {
        tNow += dt;
        if (S.cool > 0) S.cool -= dt;
        for (const row of S.cells) for (const c of row) { if (c.pop > 0) c.pop = Math.max(0, c.pop - dt * 5); if (c.boom > 0) c.boom = Math.max(0, c.boom - dt); }
        if (S.banner && S.banner.time > 0) S.banner.time -= dt;
        if (S.moodT > 0) { S.moodT -= dt; if (S.moodT <= 0) S.mood = 'idle'; }
        if (S.splash > 0) S.splash -= dt;
        if (S.state === 'count') { S.timer -= dt; if (S.timer <= 0) beginFlow(); }
        else if (S.state === 'flow') stepFlow(dt);
      }
      draw();
    });
    G.onActive = a => { if (!a && S && (S.state === 'count' || S.state === 'flow')) S.paused = true; };
    const unpause = () => { if (S && S.paused) { S.paused = false; return true; } return false; };

    // ---------------------------------------------------------------- input
    G.on(cv, 'pointerdown', ev => {
      ev.preventDefault(); G.focus();
      if (!S || unpause()) return;
      if (S.state === 'done') { if (S.splash <= 0.3) next(); return; }
      const r = cv.getBoundingClientRect(), c = cellAt(ev.clientX - r.left, ev.clientY - r.top);
      if (c) place(c.x, c.y);
    });
    G.on(cv, 'pointermove', ev => {
      if (!S || ev.pointerType !== 'mouse') return;
      const r = cv.getBoundingClientRect(), c = cellAt(ev.clientX - r.left, ev.clientY - r.top);
      if (c) S.cursor = c;
    });
    G.on(cv, 'contextmenu', ev => ev.preventDefault());
    function fast() { if (!S) return; if (S.state === 'count') { S.timer = 0; } S.fast = true; G.sfx('zap'); }
    G.keys = {
      down(ev) {
        if (!S) return false;
        if (S.paused) { unpause(); return true; }
        const k = ev.key;
        if (S.state === 'done') { if (k === ' ' || k === 'Enter') { if (S.splash <= 0.3) next(); return true; } return false; }
        let dx = 0, dy = 0;
        if (k === 'ArrowLeft') dx = -1; else if (k === 'ArrowRight') dx = 1; else if (k === 'ArrowUp') dy = -1; else if (k === 'ArrowDown') dy = 1;
        if (dx || dy) { // in portrait the board is turned, so the arrows turn with it
          if (L.rot) [dx, dy] = [dy, -dx];
          S.cursor = { x: clamp(S.cursor.x + dx, 0, GW - 1), y: clamp(S.cursor.y + dy, 0, GH - 1) }; return true;
        }
        if (k === ' ' || k === 'Enter') { place(S.cursor.x, S.cursor.y); return true; }
        if (k === 'f' || k === 'F') { fast(); return true; }
        if (k === 'p' || k === 'P' || k === 'F3') { if (S.state === 'count' || S.state === 'flow') S.paused = true; return true; }
        return false;
      },
    };

    // ---------------------------------------------------------------- menus
    G.newGame = () => { newGame(); G.focus(); };
    if (window.MP) race = MP.hook('games.pipe', G.w, { start(seed, o, R, preview) { raceStart = Math.max(1, Math.min(5, (o && o.start) | 0 || 1)); newGame(seed); if (preview) S.paused = true; else { S.paused = false; R.progress(0, 'L' + S.level); } } });
    const help = () => G.help([
      ['How to play', 'Gubbinz has left the slime tank open. Again.\n\nClick an empty square to drop in the next pipe from the dispenser on the left. Build a pipeline from the tank before the countdown runs out, because then the green stuff starts flowing.\n\nEvery level tells you how many pipes the juice must run through. Make it that far and you pass. If the juice spills out before that... SPLOOSH. Game over.'],
      ['Keys', '- Click: place the next pipe\n- Arrow keys + Space: move the cursor and place a pipe\n- F: fast flow (start the juice now, more points per pipe)\n- P or F3: pause\n- F2: new game'],
      ['Scoring', '- 50 points for every pipe the juice runs through (100 on fast flow)\n- 500 bonus when the juice goes through a cross pipe both ways\n- 100 for every pipe past the target\n- 1000 for reaching the END tank (from level 3)\n- Swapping a pipe that is already down costs 50\n- Every pipe you placed but never used costs 100 at the end of the level'],
      ['Tips', 'Rocks turn up from level 2. You can\'t build on them, even if you ask nicely.\n\nThe fat glass pipes (from level 4) are reservoirs. They take ages to fill, which buys you time.\n\nJack\'s tip: build a big zig-zag. Dave\'s tip: "just do it faster". Thanks Dave.'],
    ]);
    G.helpKey = help;
    G.menu([
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: G.newGame },
        ...(window.MP ? [MP.menuItem('race.pipe', { start: opts.start })] : []),
        { label: 'Fast Flow', key: 'F', dis: !S || (S.state !== 'count' && S.state !== 'flow'), act: fast },
        { label: 'Pause', key: 'P', dis: !S || S.paused || (S.state !== 'count' && S.state !== 'flow'), act: () => { S.paused = true; } }, '-',
        { label: 'High Scores...', act: () => scores.show() }, '-',
        { label: 'Exit', act: () => G.w.close() },
      ]],
      ['Options', () => [
        { label: 'Start at Level', sub: [1, 2, 3, 4, 5].map(n => ({ label: 'Level ' + n + (n === 1 ? ' (easy)' : n === 5 ? ' (sloshy)' : ''), rad: opts.start === n, act: () => { opts.start = n; G.store.set('opts', opts); Desk.toast('Pipe Jack', `New games start at level ${n}.`); } })) },
      ]],
      ['Help', () => [
        { label: 'Help Topics', key: 'F1', act: help }, '-',
        { label: 'About Pipe Jack', act: () => G.about({ ver: 'Version 2.0 (Green Slime Edition)', blurb: 'Lay the pipes. Mind the juice. Do not drink the juice.', credits: [['Plumbing design', 'Jack'], ['Pipe art', 'Jack (MS Paint, zoomed in a lot)'], ['Green slime', 'Gubbinz (do not ask)'], ['Mop', 'Mom'], ['Level testing', 'Dave'], ['Rocks', 'Found in the garden'], ['Wrench consultant', 'Grandad'], ['Fast flow idea', Cast.t('Cousin {cousin}')], ['No thanks to', 'The kitchen sink']] }) },
      ]],
    ]);
    G.dbg = () => S && { level: S.level, state: S.state, score: S.score, len: S.len, flow: S.flow && { x: S.flow.x, y: S.flow.y, t: S.flow.t }, start: S.start, rot: L.rot, cell: L.cell };
    G.test = { place, fast, S: () => S, next };
    // the game in progress is saved (js/gamesave.js): the whole board, the dispenser, the juice, level and score.
    // It comes back paused. Not an online race (that's live).
    const saver = G.saver(() => (race && race.active) ? undefined : (!S || S.over) ? null : Object.assign({}, S, { pr: null }), { v: 1, live: true, every: 5000 });
    function resume() {
      const s = saver.load(); if (!s || !(s.level >= 1) || !Array.isArray(s.cells) || s.cells.length !== GH || !s.cells.every(r => Array.isArray(r) && r.length === GW) || !s.start || !Array.isArray(s.queue) || !s.P) return false;
      raceSeed = 0; S = Object.assign(s, { pr: null, cool: 0 });
      if (S.state === 'count' || S.state === 'flow') S.paused = true;
      return true;
    }
    layout(); if (!resume()) newGame();
  });
})();

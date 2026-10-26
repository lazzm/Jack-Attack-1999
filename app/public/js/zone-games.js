/* zone-games.js: the rules, computer players and board art for the JackNet Gaming Zone.
 * Lazy-loaded by apps-zone.js. Every game is a plain object in Zone.GAMES with pure rule functions:
 *   init(rng) -> state, check(state), turn(state), mustAct(state, p), moves(state), legal(state, mv, p),
 *   apply(state, mv) -> new state, over(state) -> null | {w: 0|1|-1, why}, ai(state, p, level, priv) -> mv,
 *   ui(api) -> { draw(ctx, W, H), tap(x, y), hover(x, y), tools: [...] }.
 * State is plain JSON; keys starting with "_" are private to one client and never sent or hashed.
 * Everything is original, drawn live on a canvas. */
(function () {
  'use strict';
  const Z = window.Zone = window.Zone || {};
  const GM = Z.GAMES = Z.GAMES || {};
  const TAU = Math.PI * 2;
  const rint = n => Math.floor(Math.random() * n);
  const pick = a => a[rint(a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rint(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const now = () => performance.now();
  const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  const isStr = (v, len, re) => typeof v === 'string' && v.length === len && (!re || re.test(v));
  const setAt = (s, i, ch) => s.slice(0, i) + ch + s.slice(i + 1);
  const count = (s, ch) => { let n = 0; for (let i = 0; i < s.length; i++) if (s[i] === ch) n++; return n; };
  const TIMEUP = { up: 1 };
  const clone = o => JSON.parse(JSON.stringify(o));

  // ---------------------------------------------------------------- drawing helpers
  function fit(W, H, aspect, pad) { pad = pad == null ? 6 : pad; let w = W - pad * 2, h = w / aspect; if (h > H - pad * 2) { h = H - pad * 2; w = h * aspect; } return { x: (W - w) / 2, y: (H - h) / 2, w, h }; }
  function disc(c, x, y, r, fill, edge, hl) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, hl); g.addColorStop(1, fill);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x + r * 0.08, y + r * 0.1, r, 0, TAU); c.fill();
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.lineWidth = Math.max(1, r * 0.07); c.strokeStyle = edge; c.stroke();
  }
  function bevel(c, x, y, w, h, sunk) {
    c.fillStyle = sunk ? '#808080' : '#fff'; c.fillRect(x, y, w, 1); c.fillRect(x, y, 1, h);
    c.fillStyle = sunk ? '#fff' : '#404040'; c.fillRect(x, y + h - 1, w, 1); c.fillRect(x + w - 1, y, 1, h);
  }
  function txt(c, s, x, y, size, col, align, bold) { c.font = `${bold === false ? '' : 'bold '}${size}px Tahoma,Verdana,sans-serif`; c.fillStyle = col; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); }
  function crown(c, x, y, r, col) {
    c.fillStyle = col; c.beginPath();
    c.moveTo(x - r * 0.5, y + r * 0.25); c.lineTo(x - r * 0.55, y - r * 0.3); c.lineTo(x - r * 0.25, y - r * 0.05); c.lineTo(x, y - r * 0.4);
    c.lineTo(x + r * 0.25, y - r * 0.05); c.lineTo(x + r * 0.55, y - r * 0.3); c.lineTo(x + r * 0.5, y + r * 0.25); c.closePath(); c.fill();
  }
  function hintDot(c, x, y, r, col) { c.fillStyle = col || 'rgba(255,255,0,.55)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function paper(c, x, y, w, h, step) { // Jack's maths exercise book
    c.fillStyle = '#fbfbf2'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(70,120,200,.25)'; c.lineWidth = 1; c.beginPath();
    for (let gx = x + (step / 2) % step; gx < x + w; gx += step / 2) { c.moveTo(Math.round(gx) + 0.5, y); c.lineTo(Math.round(gx) + 0.5, y + h); }
    for (let gy = y + (step / 2) % step; gy < y + h; gy += step / 2) { c.moveTo(x, Math.round(gy) + 0.5); c.lineTo(x + w, Math.round(gy) + 0.5); }
    c.stroke();
  }
  // the generic iterative-deepening driver: score(move, depth, deadline, alpha) returns the value for the root player
  function think(moves, score, maxDepth, ms) {
    const deadline = now() + ms; let best = moves[0];
    moves = shuffle(moves.slice());
    for (let d = 1; d <= maxDepth; d++) {
      let b = null, bv = -Infinity;
      try { for (const m of moves) { const v = score(m, d - 1, deadline, bv); if (v > bv) { bv = v; b = m; } } } catch (e) { if (e !== TIMEUP) throw e; break; }
      if (b == null) break;
      best = b; moves = [b, ...moves.filter(m => m !== b)];
      if (Math.abs(bv) > 90000) break;
    }
    return best;
  }
  const LV_MS = [60, 350, 900];

  // =========================================================================================== REVERSI
  const D8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  function rvFlips(b, i, p) {
    if (b[i] !== '.') return null;
    const me = '' + p, op = '' + (1 - p), r0 = i >> 3, c0 = i & 7; let out = null;
    for (const [dr, dc] of D8) {
      let r = r0 + dr, c = c0 + dc, k = 0;
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === op) { r += dr; c += dc; k++; }
      if (k && r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === me) { out = out || []; for (let j = 1; j <= k; j++) out.push((r0 + dr * j) * 8 + c0 + dc * j); }
    }
    return out;
  }
  function rvMoves(b, p) { const m = []; for (let i = 0; i < 64; i++) if (b[i] === '.' && rvFlips(b, i, p)) m.push(i); return m; }
  function rvPlay(b, i, p) { const f = rvFlips(b, i, p), a = b.split(''); a[i] = '' + p; f.forEach(j => { a[j] = '' + p; }); return a.join(''); }
  const RVW = [120, -20, 20, 5, 5, 20, -20, 120, -20, -40, -5, -5, -5, -5, -40, -20, 20, -5, 15, 3, 3, 15, -5, 20, 5, -5, 3, 3, 3, 3, -5, 5,
    5, -5, 3, 3, 3, 3, -5, 5, 20, -5, 15, 3, 3, 15, -5, 20, -20, -40, -5, -5, -5, -5, -40, -20, 120, -20, 20, 5, 5, 20, -20, 120];
  function rvEval(b, p) {
    const me = '' + p, op = '' + (1 - p); let s = 0, cm = 0, co = 0, e = 0;
    for (let i = 0; i < 64; i++) { if (b[i] === me) { s += RVW[i]; cm++; } else if (b[i] === op) { s -= RVW[i]; co++; } else e++; }
    if (e < 14) s += (cm - co) * (16 - e);
    return s + (rvMoves(b, p).length - rvMoves(b, 1 - p).length) * 7;
  }
  function rvSearch(b, p, depth, a, beta, dl) {
    if (now() > dl) throw TIMEUP;
    const ms = rvMoves(b, p);
    if (!ms.length) {
      if (!rvMoves(b, 1 - p).length) { const d = count(b, '' + p) - count(b, '' + (1 - p)); return d > 0 ? 100000 + d : d < 0 ? -100000 + d : 0; }
      return depth <= 0 ? rvEval(b, p) : -rvSearch(b, 1 - p, depth - 1, -beta, -a, dl);
    }
    if (depth <= 0) return rvEval(b, p);
    ms.sort((x, y) => RVW[y] - RVW[x]);
    for (const i of ms) { const v = -rvSearch(rvPlay(b, i, p), 1 - p, depth - 1, -beta, -a, dl); if (v > a) a = v; if (a >= beta) break; }
    return a;
  }
  GM.reversi = {
    id: 'reversi', name: 'Reversi', pn: ['Black', 'White'], pc: ['#111', '#f4f4f4'], aspect: 1,
    blurb: 'Flip your opponent\'s discs by trapping them in a line. Most discs at the end wins.',
    init() { let b = '.'.repeat(64); b = setAt(b, 27, '1'); b = setAt(b, 36, '1'); b = setAt(b, 28, '0'); b = setAt(b, 35, '0'); return { n: 0, p: 0, b }; },
    check: s => s && isInt(s.n, 0, 999) && isInt(s.p, 0, 1) && isStr(s.b, 64, /^[.01]+$/),
    turn(s) { return this.over(s) ? -1 : s.p; },
    moves(s) { const m = rvMoves(s.b, s.p).map(i => ({ i })); return m.length ? m : rvMoves(s.b, 1 - s.p).length ? [{ pass: 1 }] : []; },
    legal(s, mv, p) {
      if (p !== this.turn(s) || !mv) return false;
      if (mv.pass) return !rvMoves(s.b, p).length;
      return isInt(mv.i, 0, 63) && !!rvFlips(s.b, mv.i, p);
    },
    apply(s, mv) { const t = clone(s); if (!mv.pass) t.b = rvPlay(s.b, mv.i, s.p); t.p = 1 - s.p; t.n++; return t; },
    score(s) { return [count(s.b, '0'), count(s.b, '1')]; },
    over(s) {
      if (rvMoves(s.b, 0).length || rvMoves(s.b, 1).length) return null;
      const [a, b] = this.score(s);
      return { w: a > b ? 0 : b > a ? 1 : -1, why: `${a} discs to ${b}` };
    },
    info(s, p) { return 'Discs: ' + this.score(s)[p]; },
    ai(s, p, lv) {
      const ms = rvMoves(s.b, p); if (!ms.length) return { pass: 1 };
      if (lv === 0) { if (Math.random() < 0.5) return { i: pick(ms) }; return { i: ms.reduce((a, b) => (rvFlips(s.b, b, p).length + Math.random() * 3 > rvFlips(s.b, a, p).length ? b : a)) }; }
      const i = think(ms, (m, d, dl, a) => -rvSearch(rvPlay(s.b, m, p), 1 - p, d, -Infinity, -a, dl), lv === 1 ? 3 : 9, LV_MS[lv]);
      return { i };
    },
    ui(api) {
      let geo = null, hov = -1;
      return {
        draw(c, W, H) {
          const s = api.st, f = fit(W, H, 1), cs = f.w / 8; geo = { f, cs };
          c.fillStyle = '#5b3a1a'; c.fillRect(f.x - 4, f.y - 4, f.w + 8, f.h + 8);
          c.fillStyle = '#17803d'; c.fillRect(f.x, f.y, f.w, f.h);
          c.strokeStyle = '#0b4a22'; c.lineWidth = 1; c.beginPath();
          for (let k = 0; k <= 8; k++) { c.moveTo(f.x + k * cs, f.y); c.lineTo(f.x + k * cs, f.y + f.h); c.moveTo(f.x, f.y + k * cs); c.lineTo(f.x + f.w, f.y + k * cs); }
          c.stroke();
          [[2, 2], [6, 2], [2, 6], [6, 6]].forEach(([x, y]) => hintDot(c, f.x + x * cs, f.y + y * cs, Math.max(2, cs * 0.06), '#0b4a22'));
          const last = api.last && api.last.mv && api.last.mv.i;
          const legal = api.mine() ? rvMoves(s.b, s.p) : [];
          for (let i = 0; i < 64; i++) {
            const x = f.x + (i & 7) * cs + cs / 2, y = f.y + (i >> 3) * cs + cs / 2;
            if (s.b[i] === '0') disc(c, x, y, cs * 0.4, '#111', '#000', '#666');
            else if (s.b[i] === '1') disc(c, x, y, cs * 0.4, '#e8e8e8', '#888', '#fff');
            else if (legal.includes(i) && (api.hints || i === hov)) {
              if (i === hov) { c.globalAlpha = 0.45; disc(c, x, y, cs * 0.4, api.me === 0 ? '#111' : '#eee', '#000', '#888'); c.globalAlpha = 1; } else hintDot(c, x, y, cs * 0.1, 'rgba(255,255,140,.8)');
            }
            if (i === last) { c.strokeStyle = '#ff3030'; c.lineWidth = 2; c.strokeRect(x - cs / 2 + 2, y - cs / 2 + 2, cs - 4, cs - 4); }
          }
        },
        hover(x, y) { const i = this.at(x, y); if (i !== hov) { hov = i; api.redraw(); } },
        at(x, y) { if (!geo) return -1; const cx = Math.floor((x - geo.f.x) / geo.cs), cy = Math.floor((y - geo.f.y) / geo.cs); return cx >= 0 && cx < 8 && cy >= 0 && cy < 8 ? cy * 8 + cx : -1; },
        tap(x, y) { const i = this.at(x, y); if (i < 0 || !api.mine()) return; const mv = { i }; if (GM.reversi.legal(api.st, mv, api.me)) api.move(mv); else api.sfx('thud'); },
      };
    },
    autoPass: s => rvMoves(s.b, s.p).length === 0,
  };

  // =========================================================================================== CHECKERS (English draughts)
  // squares r*8+c, playable when (r+c) is odd. Black ('b' man, 'B' king) is player 0 and starts on rows 0-2 moving down the array.
  const ckOwn = (ch, p) => p === 0 ? (ch === 'b' || ch === 'B') : (ch === 'w' || ch === 'W');
  const KDIR = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  function ckGen(b, p) {
    const caps = [], steps = [];
    for (let i = 0; i < 64; i++) {
      const ch = b[i]; if (!ckOwn(ch, p)) continue;
      const king = ch === 'B' || ch === 'W', kingRow = p === 0 ? 7 : 0;
      const dirs = king ? KDIR : p === 0 ? [[1, 1], [1, -1]] : [[-1, 1], [-1, -1]];
      const dfs = (sq, path, taken) => {
        const r = sq >> 3, c = sq & 7; let ext = false;
        if (king || path.length === 1 || r !== kingRow) for (const [dr, dc] of dirs) {
          const r2 = r + 2 * dr, c2 = c + 2 * dc; if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) continue;
          const mid = (r + dr) * 8 + c + dc, land = r2 * 8 + c2;
          if (taken.includes(mid) || !ckOwn(b[mid], 1 - p) || (b[land] !== '.' && land !== i)) continue;
          ext = true; dfs(land, path.concat(land), taken.concat(mid));
        }
        if (!ext && path.length > 1) caps.push({ path });
      };
      dfs(i, [i], []);
      if (!caps.length) for (const [dr, dc] of dirs) { const r = (i >> 3) + dr, c = (i & 7) + dc; if (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r * 8 + c] === '.') steps.push({ path: [i, r * 8 + c] }); }
    }
    return caps.length ? caps : steps;
  }
  function ckPlay(b, path) {
    const a = b.split(''); let ch = a[path[0]]; a[path[0]] = '.';
    for (let k = 1; k < path.length; k++) { const f = path[k - 1], t = path[k]; if (Math.abs((t >> 3) - (f >> 3)) === 2) a[(f + t) / 2] = '.'; }
    const end = path[path.length - 1], r = end >> 3;
    if (ch === 'b' && r === 7) ch = 'B'; if (ch === 'w' && r === 0) ch = 'W';
    a[end] = ch; return a.join('');
  }
  function ckEval(b, p) {
    let s = 0;
    for (let i = 0; i < 64; i++) {
      const ch = b[i]; if (ch === '.') continue;
      const r = i >> 3, c = i & 7, mine = ckOwn(ch, p), sg = mine ? 1 : -1;
      let v = (ch === 'B' || ch === 'W') ? 175 : 100;
      if (ch === 'b') v += r * 4 + (r === 0 ? 10 : 0); if (ch === 'w') v += (7 - r) * 4 + (r === 7 ? 10 : 0);
      if (c >= 2 && c <= 5 && r >= 2 && r <= 5) v += 5;
      s += sg * v;
    }
    return s;
  }
  function ckSearch(b, p, depth, a, beta, dl, ext) {
    if (now() > dl) throw TIMEUP;
    const ms = ckGen(b, p);
    if (!ms.length) return -100000 - depth;
    const capture = ms[0].path.length > 2 || Math.abs((ms[0].path[1] >> 3) - (ms[0].path[0] >> 3)) === 2;
    if (depth <= 0 && !(capture && ext < 6)) return ckEval(b, p);
    for (const m of ms) { const v = -ckSearch(ckPlay(b, m.path), 1 - p, depth - 1, -beta, -a, dl, depth <= 0 ? ext + 1 : ext); if (v > a) a = v; if (a >= beta) break; }
    return a;
  }
  const samePath = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  GM.checkers = {
    id: 'checkers', name: 'Checkers', pn: ['Black', 'White'], pc: ['#222', '#efe6cf'], aspect: 1,
    blurb: 'English draughts: men move diagonally forwards, jumps are compulsory, kings move both ways.',
    init() { let b = ''; for (let i = 0; i < 64; i++) { const r = i >> 3, dark = ((r + (i & 7)) & 1) === 1; b += !dark ? '.' : r < 3 ? 'b' : r > 4 ? 'w' : '.'; } return { n: 0, p: 0, b, q: 0 }; },
    check: s => s && isInt(s.n, 0, 9999) && isInt(s.p, 0, 1) && isInt(s.q, 0, 999) && isStr(s.b, 64, /^[.bBwW]+$/),
    turn(s) { return this.over(s) ? -1 : s.p; },
    moves: s => ckGen(s.b, s.p),
    legal(s, mv, p) {
      if (p !== this.turn(s) || !mv || !Array.isArray(mv.path) || mv.path.length < 2 || mv.path.length > 12 || !mv.path.every(x => isInt(x, 0, 63))) return false;
      return ckGen(s.b, p).some(m => samePath(m.path, mv.path));
    },
    apply(s, mv) {
      const t = clone(s), man = s.b[mv.path[0]] === 'b' || s.b[mv.path[0]] === 'w', cap = Math.abs((mv.path[1] >> 3) - (mv.path[0] >> 3)) === 2;
      t.b = ckPlay(s.b, mv.path); t.p = 1 - s.p; t.n++; t.q = man || cap ? 0 : s.q + 1; return t;
    },
    over(s) {
      if (!ckGen(s.b, s.p).length) return { w: 1 - s.p, why: (s.b.match(s.p ? /[wW]/ : /[bB]/) ? 'no moves left' : 'all pieces taken') };
      if (s.q >= 80) return { w: -1, why: '40 moves each without a capture' };
      return null;
    },
    info(s, p) { const re = p ? /[wW]/g : /[bB]/g, k = p ? /W/g : /B/g; return `Pieces: ${(s.b.match(re) || []).length}  Kings: ${(s.b.match(k) || []).length}`; },
    ai(s, p, lv) {
      const ms = ckGen(s.b, p);
      if (lv === 0) return Math.random() < 0.6 ? pick(ms) : think(ms, (m, d, dl, a) => -ckSearch(ckPlay(s.b, m.path), 1 - p, 1, -Infinity, -a, dl, 0), 1, 50);
      return think(ms, (m, d, dl, a) => -ckSearch(ckPlay(s.b, m.path), 1 - p, d, -Infinity, -a, dl, 0), lv === 1 ? 4 : 12, LV_MS[lv]);
    },
    ui(api) {
      let geo = null, part = [];
      const flip = () => api.me !== 1; // black (player 0) sits at the bottom of their own screen
      const sq2xy = i => { let r = i >> 3, c = i & 7; if (flip()) { r = 7 - r; c = 7 - c; } return [geo.f.x + c * geo.cs + geo.cs / 2, geo.f.y + r * geo.cs + geo.cs / 2]; };
      const cands = () => api.mine() ? ckGen(api.st.b, api.me).filter(m => part.every((x, k) => m.path[k] === x)) : [];
      const ui = {
        draw(c, W, H) {
          const s = api.st, f = fit(W, H, 1), cs = f.w / 8; geo = { f, cs };
          if (!api.mine()) part = [];
          c.fillStyle = '#3a2410'; c.fillRect(f.x - 5, f.y - 5, f.w + 10, f.h + 10);
          for (let i = 0; i < 64; i++) { const [x, y] = sq2xy(i); c.fillStyle = (((i >> 3) + (i & 7)) & 1) ? '#2f6b3a' : '#e9dcb4'; c.fillRect(x - cs / 2, y - cs / 2, cs + 0.5, cs + 0.5); }
          const last = api.last && api.last.mv && api.last.mv.path;
          if (last) last.forEach(i => { const [x, y] = sq2xy(i); c.fillStyle = 'rgba(255,220,0,.28)'; c.fillRect(x - cs / 2, y - cs / 2, cs, cs); });
          const cs2 = cands(), starts = new Set(cs2.map(m => m.path[0]));
          for (let i = 0; i < 64; i++) {
            const ch = s.b[i]; if (ch === '.') continue;
            const [x, y] = sq2xy(i), blk = ch === 'b' || ch === 'B';
            if (part.length && part[0] === i) { c.fillStyle = 'rgba(255,255,0,.5)'; c.fillRect(x - cs / 2, y - cs / 2, cs, cs); }
            else if (api.hints && !part.length && starts.has(i)) { c.strokeStyle = '#ff0'; c.lineWidth = 2; c.strokeRect(x - cs / 2 + 2, y - cs / 2 + 2, cs - 4, cs - 4); }
            disc(c, x, y, cs * 0.38, blk ? '#1c1c1c' : '#e6dcc0', blk ? '#000' : '#8a7a50', blk ? '#5a5a5a' : '#fffaf0');
            c.strokeStyle = blk ? '#444' : '#b8a878'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, cs * 0.26, 0, TAU); c.stroke();
            if (ch === 'B' || ch === 'W') crown(c, x, y, cs * 0.34, '#e8b400');
          }
          if (part.length) {
            const next = new Set(cs2.filter(m => m.path.length > part.length).map(m => m.path[part.length]));
            next.forEach(i => { const [x, y] = sq2xy(i); hintDot(c, x, y, cs * 0.14, 'rgba(255,255,0,.85)'); });
            for (let k = 1; k < part.length; k++) { const [x, y] = sq2xy(part[k]); hintDot(c, x, y, cs * 0.18, 'rgba(255,140,0,.9)'); }
          }
        },
        at(x, y) { if (!geo) return -1; let cx = Math.floor((x - geo.f.x) / geo.cs), cy = Math.floor((y - geo.f.y) / geo.cs); if (cx < 0 || cx > 7 || cy < 0 || cy > 7) return -1; if (flip()) { cx = 7 - cx; cy = 7 - cy; } return cy * 8 + cx; },
        tap(x, y) {
          if (!api.mine()) return;
          const i = ui.at(x, y); if (i < 0) return;
          const all = ckGen(api.st.b, api.me);
          if (all.some(m => m.path[0] === i) && part.length <= 1) { part = [i]; api.sfx('click'); api.redraw(); return; }
          if (!part.length) { if (ckOwn(api.st.b[i], api.me)) { const cap = all[0] && Math.abs((all[0].path[1] >> 3) - (all[0].path[0] >> 3)) === 2; api.say(cap ? 'You must take a piece! Jumps are compulsory.' : 'That piece can\'t move.'); api.sfx('thud'); } return; }
          const ext = all.filter(m => part.every((v, k) => m.path[k] === v) && m.path[part.length] === i);
          if (!ext.length) { part = []; api.redraw(); return; }
          part = part.concat(i);
          const done = ext.find(m => m.path.length === part.length);
          if (done && ext.length === 1) { const mv = { path: part }; part = []; api.move(mv); } else api.redraw();
        },
      };
      return ui;
    },
  };

  // =========================================================================================== CONNECT FOUR
  const C4W = 7, C4H = 6;
  function c4Drop(b, c) { for (let r = C4H - 1; r >= 0; r--) if (b[r * C4W + c] === '.') return r * C4W + c; return -1; }
  function c4LineAt(b, i) {
    const ch = b[i]; if (ch === '.') return null; const r0 = (i / C4W) | 0, c0 = i % C4W;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const cells = [i];
      for (const sg of [1, -1]) { let r = r0 + dr * sg, c = c0 + dc * sg; while (r >= 0 && r < C4H && c >= 0 && c < C4W && b[r * C4W + c] === ch) { cells.push(r * C4W + c); r += dr * sg; c += dc * sg; } }
      if (cells.length >= 4) return { cells, diag: dr === 1 && dc !== 0 };
    }
    return null;
  }
  function c4Line(b) { for (let i = 0; i < 42; i++) { const l = c4LineAt(b, i); if (l) return Object.assign(l, { p: +b[i] }); } return null; }
  const C4WIN = [];
  for (let r = 0; r < C4H; r++) for (let c = 0; c < C4W; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const w = []; for (let k = 0; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= C4H || cc < 0 || cc >= C4W) break; w.push(rr * C4W + cc); }
    if (w.length === 4) C4WIN.push(w);
  }
  function c4Eval(b, p) {
    const me = '' + p, op = '' + (1 - p); let s = 0;
    for (const w of C4WIN) { let m = 0, o = 0; for (const i of w) { if (b[i] === me) m++; else if (b[i] === op) o++; } if (m && !o) s += m === 3 ? 12 : m === 2 ? 3 : 1; else if (o && !m) s -= o === 3 ? 14 : o === 2 ? 3 : 1; }
    for (let r = 0; r < C4H; r++) { if (b[r * C4W + 3] === me) s += 3; else if (b[r * C4W + 3] === op) s -= 3; }
    return s;
  }
  const C4ORD = [3, 2, 4, 1, 5, 0, 6];
  function c4Search(b, p, depth, a, beta, dl) {
    if (now() > dl) throw TIMEUP;
    if (b.indexOf('.') < 0) return 0;
    if (depth <= 0) return c4Eval(b, p);
    for (const c of C4ORD) {
      const i = c4Drop(b, c); if (i < 0) continue;
      const nb = setAt(b, i, '' + p);
      const v = c4LineAt(nb, i) ? 100000 + depth : -c4Search(nb, 1 - p, depth - 1, -beta, -a, dl);
      if (v > a) a = v; if (a >= beta) break;
    }
    return a;
  }
  GM.c4 = {
    id: 'c4', name: 'Connect Fore', pn: ['Red', 'Yellow'], pc: ['#e01010', '#ffd400'], aspect: 7 / 6.8,
    blurb: 'Drop discs into the frame. Get four in a row (across, down or diagonal) to win.',
    init: () => ({ n: 0, p: 0, b: '.'.repeat(42) }),
    check: s => s && isInt(s.n, 0, 99) && isInt(s.p, 0, 1) && isStr(s.b, 42, /^[.01]+$/),
    turn(s) { return this.over(s) ? -1 : s.p; },
    moves: s => C4ORD.filter(c => c4Drop(s.b, c) >= 0).map(c => ({ c })),
    legal(s, mv, p) { return p === this.turn(s) && mv && isInt(mv.c, 0, 6) && c4Drop(s.b, mv.c) >= 0; },
    apply(s, mv) { const t = clone(s), i = c4Drop(s.b, mv.c); t.b = setAt(s.b, i, '' + s.p); t.p = 1 - s.p; t.n++; t.li = i; return t; },
    over(s) { const l = c4Line(s.b); if (l) return { w: l.p, why: 'four in a row' + (l.diag ? ' (diagonal!)' : ''), cells: l.cells, diag: l.diag }; return s.b.indexOf('.') < 0 ? { w: -1, why: 'the frame is full' } : null; },
    ai(s, p, lv) {
      const ms = C4ORD.filter(c => c4Drop(s.b, c) >= 0);
      for (const q of [p, 1 - p]) for (const c of ms) { const i = c4Drop(s.b, c); if (c4LineAt(setAt(s.b, i, '' + q), i) && (lv > 0 || Math.random() < 0.6)) return { c }; }
      if (lv === 0) return { c: Math.random() < 0.5 ? pick(ms) : think(ms, (c, d, dl, a) => { const i = c4Drop(s.b, c); return -c4Search(setAt(s.b, i, '' + p), 1 - p, 1, -Infinity, -a, dl); }, 1, 40) };
      return { c: think(ms, (c, d, dl, a) => { const i = c4Drop(s.b, c), nb = setAt(s.b, i, '' + p); return c4LineAt(nb, i) ? 100000 : -c4Search(nb, 1 - p, d, -Infinity, -a, dl); }, lv === 1 ? 4 : 11, LV_MS[lv]) };
    },
    ui(api) {
      let geo = null, hov = -1, drop = null;
      return {
        draw(c, W, H) {
          const s = api.st, f = fit(W, H, 7 / 6.8), cs = f.w / 7, top = f.y + cs * 0.45; geo = { f, cs, top };
          const sky = c.createLinearGradient(0, top, 0, top + cs * 6); sky.addColorStop(0, '#e8f0ff'); sky.addColorStop(1, '#b8c8e8'); c.fillStyle = sky; c.fillRect(f.x, top, f.w, cs * 6);
          if (s.li != null && (!drop || drop.i !== s.li || drop.n !== s.n)) { drop = { i: s.li, n: s.n, t: now() }; api.anim(500); }
          const ov = GM.c4.over(s);
          // ghost disc above the frame
          if (api.mine() && hov >= 0 && c4Drop(s.b, hov) >= 0) { c.globalAlpha = 0.6; disc(c, f.x + hov * cs + cs / 2, f.y + cs * 0.2, cs * 0.18, api.me ? '#ffd400' : '#e01010', '#600', '#fff'); c.globalAlpha = 1; }
          for (let i = 0; i < 42; i++) {
            if (s.b[i] === '.') continue;
            const col = i % 7, row = (i / 7) | 0; let y = top + row * cs + cs / 2;
            if (drop && drop.i === i) { const k = Math.min(1, (now() - drop.t) / 380); y = top - cs / 2 + (y - top + cs / 2) * (k * k); }
            disc(c, f.x + col * cs + cs / 2, y, cs * 0.4, s.b[i] === '0' ? '#d81010' : '#f2c800', s.b[i] === '0' ? '#700' : '#806000', s.b[i] === '0' ? '#ff7a7a' : '#fff6a0');
          }
          // the frame with holes
          c.save(); c.beginPath(); c.rect(f.x, top, f.w, cs * 6);
          for (let i = 0; i < 42; i++) { const x = f.x + (i % 7) * cs + cs / 2, y = top + ((i / 7) | 0) * cs + cs / 2; c.moveTo(x + cs * 0.42, y); c.arc(x, y, cs * 0.42, 0, TAU, true); }
          c.fillStyle = '#1e48c8'; c.fill('evenodd'); c.restore();
          c.strokeStyle = '#0c2470'; c.lineWidth = 3; c.strokeRect(f.x, top, f.w, cs * 6);
          c.fillStyle = '#1636a0'; c.fillRect(f.x - 8, top + cs * 6, 10, cs * 0.25); c.fillRect(f.x + f.w - 2, top + cs * 6, 10, cs * 0.25);
          if (ov && ov.cells && (!drop || now() - drop.t > 400)) ov.cells.forEach(i => { const x = f.x + (i % 7) * cs + cs / 2, y = top + ((i / 7) | 0) * cs + cs / 2; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, cs * 0.3, 0, TAU); c.stroke(); });
        },
        col(x) { if (!geo) return -1; const cc = Math.floor((x - geo.f.x) / geo.cs); return cc >= 0 && cc < 7 ? cc : -1; },
        hover(x) { const cc = this.col(x); if (cc !== hov) { hov = cc; api.redraw(); } },
        tap(x) { const cc = this.col(x); if (cc < 0 || !api.mine()) return; hov = cc; if (GM.c4.legal(api.st, { c: cc }, api.me)) api.move({ c: cc }); else api.sfx('thud'); },
      };
    },
  };

  // =========================================================================================== BATTLESHIPS (hidden fleets)
  const FLEET = [5, 4, 3, 3, 2], FLEET_N = ['Mega Gunship', 'Battlewagon', 'Kroozer', 'Sneaky Sub', 'Patrol Dinghy'];
  const shipCells = sh => { const out = []; for (let k = 0; k < sh.k; k++) out.push(sh.d ? sh.i + k * 10 : sh.i + k); return out; };
  function shipOk(sh) { const r = (sh.i / 10) | 0, c = sh.i % 10; return isInt(sh.i, 0, 99) && (sh.d ? r + sh.k <= 10 : c + sh.k <= 10); }
  function fleetOk(fl) {
    if (!Array.isArray(fl) || fl.length !== 5) return false; const used = new Set();
    for (let j = 0; j < 5; j++) { const sh = fl[j]; if (!sh || sh.k !== FLEET[j] || !(sh.d === 0 || sh.d === 1) || !shipOk(sh)) return false; for (const x of shipCells(sh)) { if (used.has(x)) return false; used.add(x); } }
    return true;
  }
  function randomFleet() {
    for (;;) {
      const fl = [], used = new Set(); let ok = true;
      for (const k of FLEET) {
        let tries = 0, sh;
        do { sh = { i: rint(100), d: rint(2), k }; tries++; } while ((!shipOk(sh) || shipCells(sh).some(x => used.has(x))) && tries < 200);
        if (tries >= 200) { ok = false; break; }
        shipCells(sh).forEach(x => used.add(x)); fl.push(sh);
      }
      if (ok) return fl;
    }
  }
  function h64(str) { // two FNV-1a passes with different seeds: good enough for a playground commitment
    let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); a = Math.imul(a ^ ch, 16777619) >>> 0; b = Math.imul(b ^ ch, 2246822519) >>> 0; b = (b ^ (b >>> 13)) >>> 0; }
    return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
  }
  function bsAnswer(fl, sh, i) { // what an honest fleet says about a shot at i; sh = the shots string after marking i as a hit
    const ship = fl.find(s => shipCells(s).includes(i)); if (!ship) return { a: 0 };
    const cells = shipCells(ship); return cells.every(x => x === i || sh[x] === 'x' || sh[x] === 'X') ? { a: 1, k: ship.k, cells } : { a: 1 };
  }
  function bsSunkK(s, q) { return (s.sk[q] || []).map(x => x.length); }
  function bsRemaining(s, q) { const left = FLEET.slice(); bsSunkK(s, q).forEach(k => { const j = left.indexOf(k); if (j >= 0) left.splice(j, 1); }); return left; }
  // AI targeting: probability density over every placement consistent with what we know
  function bsTarget(s, q, lv) {
    const sh = s.sh[q], open = []; for (let i = 0; i < 100; i++) if (sh[i] === '.') open.push(i);
    if (lv === 0) {
      const hits = []; for (let i = 0; i < 100; i++) if (sh[i] === 'x') hits.push(i);
      if (hits.length && Math.random() < 0.6) { const n = []; hits.forEach(h => [h - 10, h + 10, h % 10 ? h - 1 : -1, h % 10 < 9 ? h + 1 : -1].forEach(x => { if (x >= 0 && x < 100 && sh[x] === '.') n.push(x); })); if (n.length) return pick(n); }
      return pick(open);
    }
    const heat = new Array(100).fill(0), left = bsRemaining(s, q), unsunkHits = [];
    for (let i = 0; i < 100; i++) if (sh[i] === 'x') unsunkHits.push(i);
    for (const k of left) for (let i = 0; i < 100; i++) for (const d of [0, 1]) {
      const pl = { i, d, k }; if (!shipOk(pl)) continue; const cells = shipCells(pl);
      if (cells.some(x => sh[x] === 'o' || sh[x] === 'X')) continue;
      const cover = cells.filter(x => sh[x] === 'x').length;
      const w = unsunkHits.length ? (cover ? 1 + cover * (lv === 2 ? 40 : 15) : (lv === 2 ? 0.05 : 0.3)) : 1;
      cells.forEach(x => { if (sh[x] === '.') heat[x] += w; });
    }
    if (!unsunkHits.length && lv === 1) open.forEach(i => { if ((((i / 10) | 0) + i) % 2) heat[i] *= 0.6; });
    let best = -1, bv = -1; shuffle(open).forEach(i => { const v = heat[i] + Math.random() * 0.01; if (v > bv) { bv = v; best = i; } });
    return best >= 0 ? best : pick(open);
  }
  GM.ships = {
    id: 'ships', name: 'Battleships', pn: ['Red Fleet', 'Blue Fleet'], pc: ['#d02020', '#2050d0'], aspect: 2.1, hidden: true, setupTime: 1.5,
    blurb: 'Hide your fleet, then take turns firing at the enemy grid. Sink all five ships to win. Fleets stay secret on each computer.',
    FLEET, FLEET_N, randomFleet, fleetOk, shipCells, h64,
    init: () => ({ n: 0, p: 0, ph: 'setup', rd: [0, 0], c: ['', ''], sh: ['.'.repeat(100), '.'.repeat(100)], sk: [[], []], pend: -1 }),
    check: s => s && isInt(s.n, 0, 999) && isInt(s.p, 0, 1) && (s.ph === 'setup' || s.ph === 'play') && Array.isArray(s.rd) && Array.isArray(s.c) && s.c.every(x => typeof x === 'string' && x.length <= 16)
      && Array.isArray(s.sh) && s.sh.length === 2 && s.sh.every(x => isStr(x, 100, /^[.oxX]+$/)) && Array.isArray(s.sk) && s.sk.length === 2 && s.sk.every(l => Array.isArray(l) && l.length <= 5 && l.every(c => Array.isArray(c) && c.length <= 5 && c.every(x => isInt(x, 0, 99)))) && isInt(s.pend, -1, 99),
    turn(s) { if (this.over(s)) return -1; if (s.ph === 'setup') return -2; return s.pend >= 0 ? 1 - s.p : s.p; },
    mustAct(s, p) { const t = this.turn(s); return t === -2 ? !s.rd[p] : t === p; },
    needsHost: mv => !!mv.rd,
    moves(s) { const t = this.turn(s); if (t < 0 || s.pend >= 0) return []; const out = []; for (let i = 0; i < 100; i++) if (s.sh[1 - s.p][i] === '.') out.push({ s: i }); return out; },
    legal(s, mv, p) {
      if (!mv || this.over(s)) return false;
      if (mv.rd) return s.ph === 'setup' && !s.rd[p] && typeof mv.c === 'string' && /^[0-9a-f]{16}$/.test(mv.c);
      if (s.ph !== 'play') return false;
      if ('s' in mv) return s.pend < 0 && p === s.p && isInt(mv.s, 0, 99) && s.sh[1 - p][mv.s] === '.';
      if ('a' in mv) {
        if (s.pend < 0 || p !== 1 - s.p || !(mv.a === 0 || mv.a === 1)) return false;
        if (!mv.cells) return true;
        if (mv.a !== 1 || !Array.isArray(mv.cells) || !isInt(mv.k, 2, 5) || mv.cells.length !== mv.k || !bsRemaining(s, p).includes(mv.k)) return false;
        const sh = setAt(s.sh[p], s.pend, 'x'), cs = mv.cells.slice().sort((a, b) => a - b);
        if (!cs.every(x => isInt(x, 0, 99) && sh[x] === 'x') || !cs.includes(s.pend)) return false;
        const step = cs[1] - cs[0]; if (step !== 1 && step !== 10) return false;
        return cs.every((x, k) => x === cs[0] + k * step) && (step === 10 || ((cs[0] / 10) | 0) === ((cs[cs.length - 1] / 10) | 0));
      }
      return false;
    },
    apply(s, mv, by) {
      const t = clone(s); t.n++;
      if (mv.rd) { t.rd[by] = 1; t.c[by] = mv.c; if (t.rd[0] && t.rd[1]) { t.ph = 'play'; t.p = 0; } return t; }
      if ('s' in mv) { t.pend = mv.s; return t; }
      const q = 1 - s.p; let sh = setAt(s.sh[q], s.pend, mv.a ? 'x' : 'o');
      if (mv.cells) { mv.cells.forEach(x => { sh = setAt(sh, x, 'X'); }); t.sk[q] = s.sk[q].concat([mv.cells.slice().sort((a, b) => a - b)]); }
      t.sh[q] = sh; t.pend = -1; t.p = q; t.lastShot = { q, i: s.pend, a: mv.a, k: mv.cells ? mv.k : 0 };
      return t;
    },
    over(s) {
      for (const q of [0, 1]) if (s.sk[q].length >= 5 || count(s.sh[q], 'x') + count(s.sh[q], 'X') >= 17) return { w: 1 - q, why: 'the whole fleet is at the bottom of the sea' };
      return null;
    },
    info(s, p) { return `Ships afloat: ${5 - s.sk[p].length}`; },
    // the defender's computer answers shots honestly, automatically
    auto(s, p, priv) {
      if (s.ph === 'play' && s.pend >= 0 && p === 1 - s.p && priv && priv.fleet) return bsAnswer(priv.fleet, setAt(s.sh[p], s.pend, 'x'), s.pend);
      return null;
    },
    ready(priv) { priv.salt = priv.salt || h64(String(Math.random()) + now()); return { rd: 1, c: h64(JSON.stringify(priv.fleet) + priv.salt) }; },
    verify(s, q, fleet, salt) { // after the game: did their fleet match the commitment and every answer?
      if (!fleetOk(fleet) || h64(JSON.stringify(fleet) + salt) !== s.c[q]) return false;
      const occ = new Set(); fleet.forEach(sh => shipCells(sh).forEach(x => occ.add(x)));
      for (let i = 0; i < 100; i++) { const v = s.sh[q][i]; if ((v === 'x' || v === 'X') && !occ.has(i)) return false; if (v === 'o' && occ.has(i)) return false; }
      return true;
    },
    pub(s) { return s; },
    ai(s, p, lv, priv) {
      if (s.ph === 'setup') { priv.fleet = priv.fleet || randomFleet(); return this.ready(priv); }
      const a = this.auto(s, p, priv); if (a) return a;
      return { s: bsTarget(s, 1 - p, lv) };
    },
    rand(s, p, priv) { return this.ai(s, p, 0, priv); },
    ui(api) {
      let geo = null, sel = -1, boom = null;
      const priv = api.priv;
      if (api.me >= 0 && !priv.fleet) priv.fleet = randomFleet();
      const grid = (c, x, y, cs, label, sh, fleet, opts) => {
        c.fillStyle = '#0a2a5a'; c.fillRect(x, y, cs * 10, cs * 10);
        c.fillStyle = '#0f3b7a'; for (let i = 0; i < 100; i++) if ((((i / 10) | 0) + i) % 2) c.fillRect(x + (i % 10) * cs, y + ((i / 10) | 0) * cs, cs, cs);
        c.strokeStyle = 'rgba(120,180,255,.35)'; c.lineWidth = 1; c.beginPath();
        for (let k = 0; k <= 10; k++) { c.moveTo(x + k * cs + 0.5, y); c.lineTo(x + k * cs + 0.5, y + cs * 10); c.moveTo(x, y + k * cs + 0.5); c.lineTo(x + cs * 10, y + k * cs + 0.5); }
        c.stroke();
        const fs = Math.max(8, Math.min(12, cs * 0.5));
        for (let k = 0; k < 10; k++) { txt(c, 'ABCDEFGHIJ'[k], x + k * cs + cs / 2, y - fs * 0.8, fs, '#000', 'center', false); txt(c, '' + (k + 1), x - fs * 0.9, y + k * cs + cs / 2, fs, '#000', 'center', false); }
        txt(c, label, x + cs * 5, y + cs * 10 + fs * 1.1, fs + 1, '#000080');
        if (fleet) fleet.forEach((sh, j) => {
          const cells = shipCells(sh), r0 = (cells[0] / 10) | 0, c0 = cells[0] % 10, w = sh.d ? 1 : sh.k, h = sh.d ? sh.k : 1;
          c.fillStyle = j === sel ? '#c8c8c8' : '#8a8f98'; c.strokeStyle = '#2a2a2a'; c.lineWidth = 1.5;
          const rx = x + c0 * cs + 2, ry = y + r0 * cs + 2, rw = w * cs - 4, rh = h * cs - 4;
          c.beginPath(); if (c.roundRect) c.roundRect(rx, ry, rw, rh, cs * 0.4); else c.rect(rx, ry, rw, rh); c.fill(); c.stroke();
          c.fillStyle = '#5a5f68'; cells.forEach(i => { c.beginPath(); c.arc(x + (i % 10) * cs + cs / 2, y + ((i / 10) | 0) * cs + cs / 2, cs * 0.14, 0, TAU); c.fill(); });
        });
        for (let i = 0; i < 100; i++) {
          const v = sh[i], cx = x + (i % 10) * cs + cs / 2, cy = y + ((i / 10) | 0) * cs + cs / 2;
          if (v === 'o') { c.fillStyle = '#e8f4ff'; c.beginPath(); c.arc(cx, cy, cs * 0.16, 0, TAU); c.fill(); }
          if (v === 'x' || v === 'X') {
            if (v === 'X') { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(cx - cs / 2 + 1, cy - cs / 2 + 1, cs - 2, cs - 2); }
            c.fillStyle = '#ff3a00'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * TAU / 10, rr = k % 2 ? cs * 0.18 : cs * 0.38; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); c.fill();
            c.fillStyle = '#ffd400'; c.beginPath(); c.arc(cx, cy, cs * 0.12, 0, TAU); c.fill();
          }
        }
        if (opts && opts.pend >= 0) { const i = opts.pend; c.strokeStyle = '#ff0'; c.lineWidth = 2; c.strokeRect(x + (i % 10) * cs + 2, y + ((i / 10) | 0) * cs + 2, cs - 4, cs - 4); }
        if (opts && opts.dim) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, y, cs * 10, cs * 10); }
      };
      const ui = {
        draw(c, W, H) {
          const s = api.st, me = api.me < 0 ? 0 : api.me, op = 1 - me, setup = s.ph === 'setup';
          const wide = W / H > 1.45, n = setup ? 1 : 2;
          let cs, gx = [], gy = [];
          const lab = 26;
          if (setup) { cs = Math.min((W - lab - 10) / 10, (H - lab - 26) / 10); gx = [(W - cs * 10 + lab) / 2]; gy = [lab]; }
          else if (wide) { cs = Math.min((W - 2 * lab - 30) / 20, (H - lab - 26) / 10); const tot = cs * 20 + lab * 2 + 20; gx = [(W - tot) / 2 + lab, (W - tot) / 2 + lab * 2 + 20 + cs * 10]; gy = [lab, lab]; }
          else { cs = Math.min((W - lab - 10) / 10, (H - 2 * lab - 50) / 20); gx = [(W - cs * 10 + lab) / 2, (W - cs * 10 + lab) / 2]; gy = [lab, lab * 2 + 26 + cs * 10]; }
          cs = Math.max(8, Math.floor(cs));
          geo = { cs, gx, gy, setup, n };
          if (api.me < 0) { // spectator: both boards, shots only
            grid(c, gx[0], gy[0], cs, api.names[0] + "'s waters", s.sh[0], null, { pend: s.pend >= 0 && s.p === 1 ? s.pend : -1 });
            if (n > 1) grid(c, gx[1], gy[1], cs, api.names[1] + "'s waters", s.sh[1], null, { pend: s.pend >= 0 && s.p === 0 ? s.pend : -1 });
            return;
          }
          if (setup) { grid(c, gx[0], gy[0], cs, s.rd[me] ? 'Fleet ready! Waiting for the enemy...' : 'Place your fleet: click a ship, then click where it goes', s.sh[me], priv.fleet); return; }
          // enemy waters first (the one you click)
          grid(c, gx[0], gy[0], cs, 'Enemy waters', s.sh[op], null, { pend: s.pend >= 0 && s.p === me ? s.pend : -1, dim: !api.mine() });
          grid(c, gx[1], gy[1], cs, 'Your fleet', s.sh[me], priv.fleet, { pend: s.pend >= 0 && s.p === op ? s.pend : -1 });
          if (s.lastShot && (!boom || boom.n !== s.n)) { boom = { n: s.n, t: now(), ...s.lastShot }; api.anim(700); }
          if (boom && now() - boom.t < 700) {
            const k = (now() - boom.t) / 700, bi = boom.q === op ? 0 : 1, cx = gx[bi] + (boom.i % 10) * cs + cs / 2, cy = gy[bi] + ((boom.i / 10) | 0) * cs + cs / 2;
            c.strokeStyle = boom.a ? `rgba(255,200,0,${1 - k})` : `rgba(255,255,255,${1 - k})`; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, cs * (0.3 + k * 1.5), 0, TAU); c.stroke();
          }
        },
        cell(x, y, bi) { if (!geo) return -1; const { cs, gx, gy } = geo; const cx = Math.floor((x - gx[bi]) / cs), cy = Math.floor((y - gy[bi]) / cs); return cx >= 0 && cx < 10 && cy >= 0 && cy < 10 ? cy * 10 + cx : -1; },
        tap(x, y) {
          const s = api.st; if (api.me < 0 || !geo) return;
          if (s.ph === 'setup') {
            if (s.rd[api.me]) return;
            const i = ui.cell(x, y, 0); if (i < 0) return;
            const hit = priv.fleet.findIndex(sh => shipCells(sh).includes(i));
            if (hit >= 0 && hit !== sel) { sel = hit; api.sfx('click'); api.redraw(); return; }
            if (hit >= 0 && hit === sel) { ui.rotate(); return; }
            if (sel >= 0) { const nf = clone(priv.fleet); nf[sel].i = i; if (fleetOk(nf)) { priv.fleet = nf; api.sfx('click'); } else api.sfx('thud'); api.redraw(); }
            return;
          }
          if (!api.mine() || s.pend >= 0) return;
          const i = ui.cell(x, y, 0); if (i < 0) return;
          if (GM.ships.legal(s, { s: i }, api.me)) api.move({ s: i }); else api.sfx('thud');
        },
        rotate() { if (sel < 0) { api.say('Click a ship first, then Rotate.'); return; } const nf = clone(priv.fleet); nf[sel].d = 1 - nf[sel].d; if (fleetOk(nf)) { priv.fleet = nf; api.sfx('click'); } else { api.sfx('thud'); api.say("It won't fit that way round."); } api.redraw(); },
        tools: [
          { label: 'Random', show: () => api.st.ph === 'setup' && api.me >= 0 && !api.st.rd[api.me], act: () => { priv.fleet = randomFleet(); sel = -1; api.sfx('click'); api.redraw(); } },
          { label: 'Rotate', show: () => api.st.ph === 'setup' && api.me >= 0 && !api.st.rd[api.me], act: () => ui.rotate() },
          { label: 'Ready!', bold: true, show: () => api.st.ph === 'setup' && api.me >= 0 && !api.st.rd[api.me], act: () => { sel = -1; api.move(GM.ships.ready(priv)); } },
        ],
      };
      return ui;
    },
  };

  // =========================================================================================== NOUGHTS & CROSSES and FIVE IN A ROW
  function lineAt(b, N, K, i) {
    const ch = b[i]; if (ch === '.') return null; const r0 = (i / N) | 0, c0 = i % N;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const cells = [i];
      for (const sg of [1, -1]) { let r = r0 + dr * sg, c = c0 + dc * sg; while (r >= 0 && r < N && c >= 0 && c < N && b[r * N + c] === ch) { cells.push(r * N + c); r += dr * sg; c += dc * sg; } }
      if (cells.length >= K) return cells;
    }
    return null;
  }
  function drawX(c, x, y, r, col, wob) {
    c.strokeStyle = col; c.lineWidth = Math.max(2, r * 0.22); c.lineCap = 'round'; c.beginPath();
    c.moveTo(x - r + wob, y - r); c.lineTo(x + r, y + r - wob); c.moveTo(x + r - wob, y - r); c.lineTo(x - r, y + r + wob * 0.5); c.stroke();
  }
  function drawO(c, x, y, r, col) { c.strokeStyle = col; c.lineWidth = Math.max(2, r * 0.22); c.beginPath(); c.ellipse(x, y, r, r * 0.92, 0.3, 0, TAU); c.stroke(); }
  const XCOL = '#1a3cc8', OCOL = '#d01818';
  function tttWinner(b) { for (let i = 0; i < 9; i++) { const l = lineAt(b, 3, 3, i); if (l) return { w: +b[i], cells: l }; } return null; }
  function tttMinimax(b, p, me) {
    const w = tttWinner(b); if (w) return w.w === me ? 10 : -10; if (b.indexOf('.') < 0) return 0;
    let best = p === me ? -99 : 99;
    for (let i = 0; i < 9; i++) if (b[i] === '.') { const v = tttMinimax(setAt(b, i, '' + p), 1 - p, me) * 0.9; best = p === me ? Math.max(best, v) : Math.min(best, v); }
    return best;
  }
  GM.ttt = {
    id: 'ttt', name: 'Noughts & Crosses', pn: ['Crosses', 'Noughts'], pc: [XCOL, OCOL], aspect: 1, tmul: 0.5,
    blurb: 'Classic 3x3. Three in a row wins. Against a good player it\'s always a draw. Always.',
    init: () => ({ n: 0, p: 0, b: '.'.repeat(9) }),
    check: s => s && isInt(s.n, 0, 9) && isInt(s.p, 0, 1) && isStr(s.b, 9, /^[.01]+$/),
    turn(s) { return this.over(s) ? -1 : s.p; },
    moves: s => [...Array(9).keys()].filter(i => s.b[i] === '.').map(i => ({ i })),
    legal(s, mv, p) { return p === this.turn(s) && mv && isInt(mv.i, 0, 8) && s.b[mv.i] === '.'; },
    apply(s, mv) { const t = clone(s); t.b = setAt(s.b, mv.i, '' + s.p); t.p = 1 - s.p; t.n++; return t; },
    over(s) { const w = tttWinner(s.b); if (w) return { w: w.w, why: 'three in a row', cells: w.cells }; return s.b.indexOf('.') < 0 ? { w: -1, why: 'cat\'s game (nobody wins)' } : null; },
    ai(s, p, lv) {
      const ms = this.moves(s).map(m => m.i);
      if (lv === 0 && Math.random() < 0.7) return { i: pick(ms) };
      if (lv === 1 && Math.random() < 0.3) return { i: pick(ms) };
      let best = [], bv = -999;
      for (const i of ms) { const v = tttMinimax(setAt(s.b, i, '' + p), 1 - p, p); if (v > bv + 1e-9) { bv = v; best = [i]; } else if (Math.abs(v - bv) < 1e-9) best.push(i); }
      return { i: pick(best) };
    },
    ui(api) { return gridUI(api, 3, 3); },
  };
  // five in a row: score each empty cell for attack and defence
  function gmScoreLine(b, N, i, dr, dc, ch) {
    const r0 = (i / N) | 0, c0 = i % N; let n = 1, open = 0;
    for (const sg of [1, -1]) {
      let r = r0 + dr * sg, c = c0 + dc * sg;
      while (r >= 0 && r < N && c >= 0 && c < N && b[r * N + c] === ch) { n++; r += dr * sg; c += dc * sg; }
      if (r >= 0 && r < N && c >= 0 && c < N && b[r * N + c] === '.') open++;
    }
    if (n >= 5) return 1e6; if (n === 4) return open === 2 ? 1e5 : open ? 1.2e4 : 0;
    if (n === 3) return open === 2 ? 9000 : open ? 600 : 0; if (n === 2) return open === 2 ? 400 : open ? 40 : 0;
    return open === 2 ? 12 : open ? 3 : 0;
  }
  function gmCell(b, N, i, p) {
    let att = 0, def = 0; const me = '' + p, op = '' + (1 - p);
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { att += gmScoreLine(b, N, i, dr, dc, me); def += gmScoreLine(b, N, i, dr, dc, op); }
    return { att, def };
  }
  GM.gomoku = {
    id: 'gomoku', name: 'Five in a Row', pn: ['Crosses', 'Noughts'], pc: [XCOL, OCOL], aspect: 1, tmul: 0.75,
    blurb: 'Noughts & crosses on a 15x15 grid from the back of my maths book. Get five (or more) in a row.',
    init: () => ({ n: 0, p: 0, b: '.'.repeat(225) }),
    check: s => s && isInt(s.n, 0, 225) && isInt(s.p, 0, 1) && isStr(s.b, 225, /^[.01]+$/) && (s.li == null || isInt(s.li, 0, 224)),
    turn(s) { return this.over(s) ? -1 : s.p; },
    moves: s => { const o = []; for (let i = 0; i < 225; i++) if (s.b[i] === '.') o.push({ i }); return o; },
    legal(s, mv, p) { return p === this.turn(s) && mv && isInt(mv.i, 0, 224) && s.b[mv.i] === '.'; },
    apply(s, mv) { const t = clone(s); t.b = setAt(s.b, mv.i, '' + s.p); t.p = 1 - s.p; t.n++; t.li = mv.i; return t; },
    over(s) { if (s.li != null) { const l = lineAt(s.b, 15, 5, s.li); if (l) return { w: +s.b[s.li], why: 'five in a row', cells: l }; } return s.b.indexOf('.') < 0 ? { w: -1, why: 'the page is full' } : null; },
    ai(s, p, lv) {
      const b = s.b; if (b.indexOf('0') < 0 && b.indexOf('1') < 0) return { i: 112 - (lv === 0 ? rint(3) * 16 : 0) };
      const cand = [];
      for (let i = 0; i < 225; i++) {
        if (b[i] !== '.') continue; const r = (i / 15) | 0, c = i % 15; let near = false;
        for (let dr = -2; dr <= 2 && !near; dr++) for (let dc = -2; dc <= 2; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 15 && cc >= 0 && cc < 15 && b[rr * 15 + cc] !== '.') { near = true; break; } }
        if (near) cand.push(i);
      }
      let best = cand[0], bv = -1;
      const dw = lv === 0 ? 0.4 : lv === 1 ? 0.8 : 0.95;
      for (const i of cand) { const { att, def } = gmCell(b, 15, i, p); const v = att + def * dw + Math.random() * (lv === 0 ? 900 : lv === 1 ? 60 : 5); if (v > bv) { bv = v; best = i; } }
      return { i: best };
    },
    ui(api) { return gridUI(api, 15, 5); },
  };
  function gridUI(api, N, K) {
    let geo = null, hov = -1;
    const G = N === 3 ? GM.ttt : GM.gomoku;
    return {
      draw(c, W, H) {
        const s = api.st, f = fit(W, H, 1, 8), cs = f.w / N; geo = { f, cs };
        paper(c, 0, 0, W, H, N === 3 ? cs / 2 : cs);
        c.fillStyle = 'rgba(220,40,40,.5)'; c.fillRect(Math.max(4, f.x - 14), 0, 2, H);
        c.strokeStyle = N === 3 ? '#222' : 'rgba(30,30,90,.55)'; c.lineWidth = N === 3 ? 4 : 1; c.lineCap = 'round'; c.beginPath();
        for (let k = (N === 3 ? 1 : 0); k <= (N === 3 ? 2 : N); k++) {
          const wob = N === 3 ? (k - 1.5) * 3 : 0;
          c.moveTo(f.x + k * cs + wob, f.y + 4); c.lineTo(f.x + k * cs - wob, f.y + f.h - 4);
          c.moveTo(f.x + 4, f.y + k * cs - wob); c.lineTo(f.x + f.w - 4, f.y + k * cs + wob);
        }
        c.stroke();
        const ov = G.over(s), win = ov && ov.cells ? new Set(ov.cells) : null;
        const last = api.last && api.last.mv ? api.last.mv.i : -1;
        for (let i = 0; i < N * N; i++) {
          const x = f.x + (i % N) * cs + cs / 2, y = f.y + ((i / N) | 0) * cs + cs / 2, r = cs * (N === 3 ? 0.3 : 0.34);
          if (win && win.has(i)) { c.fillStyle = 'rgba(255,230,0,.5)'; c.fillRect(x - cs / 2 + 1, y - cs / 2 + 1, cs - 2, cs - 2); }
          if (i === last && N > 3) { c.fillStyle = 'rgba(0,200,0,.18)'; c.fillRect(x - cs / 2 + 1, y - cs / 2 + 1, cs - 2, cs - 2); }
          if (s.b[i] === '0') drawX(c, x, y, r, XCOL, ((i * 7) % 5 - 2) * r * 0.05);
          else if (s.b[i] === '1') drawO(c, x, y, r, OCOL);
          else if (i === hov && api.mine()) { c.globalAlpha = 0.3; if (api.me === 0) drawX(c, x, y, r, XCOL, 0); else drawO(c, x, y, r, OCOL); c.globalAlpha = 1; }
        }
        if (win && ov.cells.length) {
          const a = ov.cells.reduce((m, i) => Math.min(m, i)), b2 = ov.cells.reduce((m, i) => Math.max(m, i));
          c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = Math.max(2, cs * 0.08); c.beginPath();
          c.moveTo(f.x + (a % N) * cs + cs / 2, f.y + ((a / N) | 0) * cs + cs / 2); c.lineTo(f.x + (b2 % N) * cs + cs / 2, f.y + ((b2 / N) | 0) * cs + cs / 2); c.stroke();
        }
      },
      at(x, y) { if (!geo) return -1; const cx = Math.floor((x - geo.f.x) / geo.cs), cy = Math.floor((y - geo.f.y) / geo.cs); return cx >= 0 && cx < N && cy >= 0 && cy < N ? cy * N + cx : -1; },
      hover(x, y) { const i = this.at(x, y); if (i !== hov) { hov = i; api.redraw(); } },
      tap(x, y) { const i = this.at(x, y); if (i < 0 || !api.mine()) return; if (G.legal(api.st, { i }, api.me)) api.move({ i }); else api.sfx('thud'); },
    };
  }

  // =========================================================================================== DOTS AND BOXES
  const DB = 5, DBL = 2 * DB * (DB + 1); // 5x5 boxes, 60 lines: 0-29 horizontal (row r 0-5, col c 0-4), 30-59 vertical (row 0-4, col 0-5)
  const boxSides = k => { const r = (k / DB) | 0, c = k % DB; return [r * DB + c, (r + 1) * DB + c, 30 + r * (DB + 1) + c, 30 + r * (DB + 1) + c + 1]; };
  const BOX_SIDES = [...Array(DB * DB).keys()].map(boxSides);
  const LINE_BOXES = [...Array(DBL)].map((_, l) => BOX_SIDES.map((s, k) => s.includes(l) ? k : -1).filter(k => k >= 0));
  const nSides = (l, k) => BOX_SIDES[k].reduce((n, x) => n + (l[x] !== '.' ? 1 : 0), 0);
  function dbPlay(s, li) {
    const t = clone(s); t.l = setAt(s.l, li, '' + s.p); let got = 0;
    for (const k of LINE_BOXES[li]) if (nSides(t.l, k) === 4 && t.x[k] === '.') { t.x = setAt(t.x, k, '' + s.p); got++; }
    if (!got) t.p = 1 - s.p; t.n++; t.got = got; return t;
  }
  function dbGreedyTake(s, p) { // how many boxes the player to move can grab in a row
    let t = s, n = 0;
    for (let guard = 0; guard < 30; guard++) { const li = completing(t); if (li < 0) break; t = dbPlay(t, li); n += t.got; if (t.p !== p) break; }
    return { n, t };
  }
  function completing(s) { for (let k = 0; k < 25; k++) if (s.x[k] === '.' && nSides(s.l, k) === 3) return BOX_SIDES[k].find(x => s.l[x] === '.'); return -1; }
  const safe = (s, li) => LINE_BOXES[li].every(k => nSides(s.l, k) < 2);
  GM.dots = {
    id: 'dots', name: 'Dots and Boxes', pn: ['Blue Biro', 'Red Pen'], pc: ['#1a3cc8', '#d01818'], aspect: 1, tmul: 0.6,
    blurb: 'Take turns joining two dots. Finish a box and it\'s yours, and you go again. Most boxes wins.',
    init: () => ({ n: 0, p: 0, l: '.'.repeat(DBL), x: '.'.repeat(25) }),
    check: s => s && isInt(s.n, 0, 99) && isInt(s.p, 0, 1) && isStr(s.l, DBL, /^[.01]+$/) && isStr(s.x, 25, /^[.01]+$/),
    turn(s) { return this.over(s) ? -1 : s.p; },
    moves: s => { const o = []; for (let i = 0; i < DBL; i++) if (s.l[i] === '.') o.push({ l: i }); return o; },
    legal(s, mv, p) { return p === this.turn(s) && mv && isInt(mv.l, 0, DBL - 1) && s.l[mv.l] === '.'; },
    apply(s, mv) { return dbPlay(s, mv.l); },
    score: s => [count(s.x, '0'), count(s.x, '1')],
    over(s) { if (s.l.indexOf('.') >= 0) return null; const [a, b] = this.score(s); return { w: a > b ? 0 : b > a ? 1 : -1, why: `${a} boxes to ${b}` }; },
    info(s, p) { return 'Boxes: ' + this.score(s)[p]; },
    ai(s, p, lv) {
      const c = completing(s), open = this.moves(s).map(m => m.l);
      if (c >= 0 && (lv > 0 || Math.random() < 0.75)) {
        if (lv === 2) { // double-dealing: leave the last two boxes of a long-ish chain when the opponent would then have to open another chain
          const g = dbGreedyTake(s, p), rest = g.t.l.split('').filter(x => x === '.').length;
          if (g.n === 2 && rest > 0 && rest <= 30 && !open.some(li => s.l[li] === '.' && safe(g.t, li))) {
            // the half-hearted handout: draw the far side of the pair so they get both boxes but must move again
            const k = BOX_SIDES.findIndex((sd, k2) => s.x[k2] === '.' && nSides(s.l, k2) === 3); const pair = LINE_BOXES[c].find(k2 => k2 !== k && s.x[k2] === '.');
            if (k >= 0 && pair != null && nSides(s.l, pair) === 2) { const alt = BOX_SIDES[pair].find(x => s.l[x] === '.' && !BOX_SIDES[k].includes(x)); if (alt != null && Math.random() < 0.8) return { l: alt }; }
          }
        }
        return { l: c };
      }
      const safes = open.filter(li => safe(s, li));
      if (safes.length && (lv > 0 || Math.random() < 0.6)) return { l: pick(safes) };
      if (lv === 0) return { l: pick(open) };
      let best = open[0], bv = 1e9;
      for (const li of shuffle(open.slice())) { const t = dbPlay(s, li); const given = t.p === p ? -t.got : dbGreedyTake(t, 1 - p).n; if (given < bv) { bv = given; best = li; } }
      return { l: best };
    },
    ui(api) {
      let geo = null, hov = -1;
      const lineXY = l => { const { f, cs } = geo; if (l < 30) { const r = (l / DB) | 0, c = l % DB; return [f.x + c * cs, f.y + r * cs, f.x + (c + 1) * cs, f.y + r * cs]; } const k = l - 30, r = (k / (DB + 1)) | 0, c = k % (DB + 1); return [f.x + c * cs, f.y + r * cs, f.x + c * cs, f.y + (r + 1) * cs]; };
      const ui = {
        draw(c, W, H) {
          const s = api.st, f = fit(W, H, 1, 22), cs = f.w / DB; geo = { f, cs };
          paper(c, 0, 0, W, H, cs / 2);
          for (let k = 0; k < 25; k++) if (s.x[k] !== '.') {
            const x = f.x + (k % DB) * cs, y = f.y + ((k / DB) | 0) * cs, p = +s.x[k];
            c.fillStyle = p ? 'rgba(208,24,24,.18)' : 'rgba(26,60,200,.18)'; c.fillRect(x + 3, y + 3, cs - 6, cs - 6);
            const ini = api.names.map(n => (n || '?').slice(0, 1).toUpperCase()), lab = ini[0] === ini[1] ? ['B', 'R'][p] : ini[p];
            txt(c, lab, x + cs / 2, y + cs / 2, cs * 0.45, p ? OCOL : XCOL);
          }
          const last = api.last && api.last.mv ? api.last.mv.l : -1;
          for (let l = 0; l < DBL; l++) {
            const v = s.l[l]; const [x1, y1, x2, y2] = lineXY(l);
            if (v === '.') { if (l === hov && api.mine()) { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 4; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); } continue; }
            c.strokeStyle = v === '1' ? OCOL : XCOL; c.lineWidth = l === last ? 5 : 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
          }
          c.fillStyle = '#111'; for (let r = 0; r <= DB; r++) for (let cc = 0; cc <= DB; cc++) { c.beginPath(); c.arc(f.x + cc * cs, f.y + r * cs, Math.max(3, cs * 0.06), 0, TAU); c.fill(); }
        },
        at(x, y) {
          if (!geo) return -1; const { f, cs } = geo; let best = -1, bd = cs * 0.38;
          for (let l = 0; l < DBL; l++) { const [x1, y1, x2, y2] = lineXY(l), mx = (x1 + x2) / 2, my = (y1 + y2) / 2; const d = x1 === x2 ? Math.max(Math.abs(x - mx), Math.abs(y - my) - cs / 2) : Math.max(Math.abs(y - my), Math.abs(x - mx) - cs / 2); if (d < bd) { bd = d; best = l; } }
          return best;
        },
        hover(x, y) { const l = ui.at(x, y); if (l !== hov) { hov = l; api.redraw(); } },
        tap(x, y) { const l = ui.at(x, y); if (l < 0 || !api.mine()) return; if (GM.dots.legal(api.st, { l }, api.me)) api.move({ l }); },
      };
      return ui;
    },
  };

  // =========================================================================================== BACKGAMMON
  // pts[0..23]: point i+1 from Black's side; positive = Black (player 0, moving 23 -> 0, home 0-5), negative = White (player 1, moving 0 -> 23, home 18-23).
  // A step is [from, die]; from 24 means "from the bar". There is no doubling cube (Mom says no gambling).
  const BAR = 24;
  const bgSign = p => p ? -1 : 1;
  const bgMine = (pos, i, p) => p ? pos.pts[i] < 0 : pos.pts[i] > 0;
  const bgCount = (pos, i) => Math.abs(pos.pts[i]);
  function bgHomeAll(pos, p) { if (pos.bar[p]) return false; for (let i = 0; i < 24; i++) if (bgMine(pos, i, p) && (p ? i < 18 : i > 5)) return false; return true; }
  function bgTarget(pos, p, from, die) { // returns target index, 25 = off, or -1 if illegal
    if (pos.bar[p] && from !== BAR) return -1;
    if (from === BAR) { if (!pos.bar[p]) return -1; const t = p ? die - 1 : 24 - die; return (p ? pos.pts[t] <= 1 : pos.pts[t] >= -1) ? t : -1; }
    if (!isInt(from, 0, 23) || !bgMine(pos, from, p)) return -1;
    const t = p ? from + die : from - die;
    if (t >= 0 && t <= 23) return (p ? pos.pts[t] <= 1 : pos.pts[t] >= -1) ? t : -1;
    if (!bgHomeAll(pos, p)) return -1;
    const exact = p ? t === 24 : t === -1; if (exact) return 25;
    // bearing off with a bigger number: only from the furthest-back checker
    if (p) { for (let i = 18; i < from; i++) if (bgMine(pos, i, p)) return -1; } else { for (let i = 5; i > from; i--) if (bgMine(pos, i, p)) return -1; }
    return 25;
  }
  function bgStep(pos, p, from, die) {
    const t = bgTarget(pos, p, from, die); if (t < 0) return null;
    const n = { pts: pos.pts.slice(), bar: pos.bar.slice(), off: pos.off.slice() }, sg = bgSign(p);
    if (from === BAR) n.bar[p]--; else n.pts[from] -= sg;
    if (t === 25) n.off[p]++;
    else { if (n.pts[t] === -sg) { n.pts[t] = 0; n.bar[1 - p]++; } n.pts[t] += sg; }
    return n;
  }
  const bgKey = pos => pos.pts.join(',') + '|' + pos.bar.join(',') + '|' + pos.off.join(',');
  function bgMaxLen(pos, p, dice, memo) { // the most dice that can still be used from here
    if (!dice.length) return 0;
    const key = bgKey(pos) + dice.join(''); if (memo && memo.has(key)) return memo.get(key);
    let best = 0;
    const tried = new Set();
    for (let k = 0; k < dice.length && best < dice.length; k++) {
      if (tried.has(dice[k])) continue; tried.add(dice[k]);
      const rest = dice.slice(0, k).concat(dice.slice(k + 1));
      const froms = pos.bar[p] ? [BAR] : [...Array(24).keys()].filter(i => bgMine(pos, i, p));
      for (const f of froms) { const n = bgStep(pos, p, f, dice[k]); if (n) { best = Math.max(best, 1 + bgMaxLen(n, p, rest, memo)); if (best === dice.length) break; } }
    }
    if (memo) memo.set(key, best);
    return best;
  }
  // every legal next step given the steps already taken this turn
  function bgNext(s, partial) {
    const p = s.p, memo = new Map();
    let pos = { pts: s.pts, bar: s.bar, off: s.off }, dice = s.d.slice();
    for (const [f, d] of partial) { const n = bgStep(pos, p, f, d); if (!n) return []; pos = n; dice.splice(dice.indexOf(d), 1); }
    const L = bgMaxLen({ pts: s.pts, bar: s.bar, off: s.off }, p, s.d, memo), need = L - partial.length;
    if (need <= 0) return [];
    const out = [], froms = pos.bar[p] ? [BAR] : [...Array(24).keys()].filter(i => bgMine(pos, i, p));
    for (const d of [...new Set(dice)]) for (const f of froms) {
      const n = bgStep(pos, p, f, d); if (!n) continue;
      const rest = dice.slice(); rest.splice(rest.indexOf(d), 1);
      if (1 + bgMaxLen(n, p, rest, memo) < need) continue;
      out.push({ f, d, t: bgTarget(pos, p, f, d), pos: n });
    }
    // only one die can be played: it must be the bigger one when that's possible
    if (L === 1 && s.d.length === 2 && s.d[0] !== s.d[1]) { const hi = Math.max(...s.d); if (out.some(o => o.d === hi)) return out.filter(o => o.d === hi); }
    return out;
  }
  function bgSeqLegal(s, steps) {
    if (!Array.isArray(steps) || steps.length > 4) return false;
    const L = bgMaxLen({ pts: s.pts, bar: s.bar, off: s.off }, s.p, s.d, new Map());
    if (steps.length !== L) return false;
    for (let k = 0; k < steps.length; k++) {
      const st = steps[k]; if (!Array.isArray(st) || st.length !== 2 || !isInt(st[0], 0, 24) || !isInt(st[1], 1, 6)) return false;
      if (!bgNext(s, steps.slice(0, k)).some(o => o.f === st[0] && o.d === st[1])) return false;
    }
    return true;
  }
  function bgFinals(s) { // all distinct end positions for the AI (deduped), each with one step list that reaches it
    const p = s.p, seen = new Map(), L = bgMaxLen({ pts: s.pts, bar: s.bar, off: s.off }, p, s.d, new Map());
    const walk = (pos, dice, steps, visited) => {
      if (steps.length === L) { const k = bgKey(pos); if (!seen.has(k)) seen.set(k, { pos, steps }); return; }
      const vk = bgKey(pos) + dice.join(''); if (visited.has(vk)) return; visited.add(vk);
      const opts = bgNext(s, steps);
      for (const o of opts) { const rest = dice.slice(); rest.splice(rest.indexOf(o.d), 1); walk(o.pos, rest, steps.concat([[o.f, o.d]]), visited); if (seen.size > 600) return; }
    };
    walk({ pts: s.pts, bar: s.bar, off: s.off }, s.d.slice(), [], new Set());
    return [...seen.values()];
  }
  function bgPips(pos, p) { let n = pos.bar[p] * 25; for (let i = 0; i < 24; i++) if (bgMine(pos, i, p)) n += bgCount(pos, i) * (p ? 24 - i : i + 1); return n; }
  const SHOTS = [0, 11, 12, 14, 15, 15, 17, 6, 6, 5, 3, 3, 3, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1]; // out of 36, ways to hit a blot at that distance
  function bgEval(pos, p) {
    const o = 1 - p; let v = (bgPips(pos, o) - bgPips(pos, p)) * 1.0 + pos.off[p] * 6 - pos.off[o] * 6 + pos.bar[o] * 14 - pos.bar[p] * 14;
    // contact? if every one of my checkers is past every one of theirs, it's a race
    let myBack = -1, theirBack = 99;
    for (let i = 0; i < 24; i++) { const d = p ? i : 23 - i; if (bgMine(pos, i, p)) myBack = Math.max(myBack, p ? 23 - i : i); if (bgMine(pos, i, o)) theirBack = Math.min(theirBack, p ? 23 - i : i); void d; }
    const race = !pos.bar[p] && !pos.bar[o] && myBack < theirBack;
    if (race) return v * 2;
    let prime = 0;
    for (let i = 0; i < 24; i++) {
      const n = bgCount(pos, i);
      if (bgMine(pos, i, p)) {
        const myIdx = p ? 23 - i : i; // 0 = my 1-point
        if (n >= 2) { v += myIdx < 6 ? 6 + myIdx : myIdx === 6 ? 8 : 3; prime++; if (prime >= 3) v += prime * 2; }
        else {
          prime = 0; let shots = 0;
          for (let j = 0; j < 24; j++) if (bgMine(pos, j, o)) { const dist = p ? i - j : j - i; if (dist > 0 && dist < 25) shots += SHOTS[dist]; }
          if (pos.bar[o]) { const dist = p ? 24 - i : i + 1; if (dist > 0 && dist < 25) shots += SHOTS[dist]; }
          v -= Math.min(36, shots) / 36 * (24 - myIdx) * 0.9 + 1;
        }
      } else prime = 0;
    }
    return v;
  }
  GM.bg = {
    id: 'bg', name: 'Backgammon', pn: ['Black', 'White'], pc: ['#2a1a10', '#f4ead2'], aspect: 1.3, tmul: 1.5,
    blurb: 'Race all 15 checkers round the board and bear them off. Land on a lone enemy checker to send it to the bar.',
    init(rng) {
      let a, b; do { a = 1 + Math.floor(rng() * 6); b = 1 + Math.floor(rng() * 6); } while (a === b);
      const pts = new Array(24).fill(0); pts[23] = 2; pts[12] = 5; pts[7] = 3; pts[5] = 5; pts[0] = -2; pts[11] = -5; pts[16] = -3; pts[18] = -5;
      return { n: 0, p: a > b ? 0 : 1, ph: 'move', d: [a, b], rl: [a, b], pts, bar: [0, 0], off: [0, 0], open: 1 };
    },
    check: s => s && isInt(s.n, 0, 9999) && isInt(s.p, 0, 1) && (s.ph === 'move' || s.ph === 'roll') && Array.isArray(s.d) && s.d.length <= 4 && s.d.every(x => isInt(x, 1, 6))
      && Array.isArray(s.pts) && s.pts.length === 24 && s.pts.every(x => isInt(x, -15, 15)) && Array.isArray(s.bar) && s.bar.every(x => isInt(x, 0, 15)) && Array.isArray(s.off) && s.off.every(x => isInt(x, 0, 15))
      && [0, 1].every(p => s.bar[p] + s.off[p] + s.pts.reduce((n, x) => n + (p ? (x < 0 ? -x : 0) : (x > 0 ? x : 0)), 0) === 15),
    turn(s) { return this.over(s) ? -1 : s.ph === 'roll' ? -3 : s.p; },
    mustAct(s, p) { return this.turn(s) === p; },
    sys(s, rng) { if (this.over(s) || s.ph !== 'roll') return null; const a = 1 + Math.floor(rng() * 6), b = 1 + Math.floor(rng() * 6); return { r: [a, b] }; },
    legalSys(s, mv) { return s.ph === 'roll' && !this.over(s) && mv && Array.isArray(mv.r) && mv.r.length === 2 && mv.r.every(x => isInt(x, 1, 6)); },
    moves(s) { if (s.ph !== 'move') return []; const f = bgFinals(s); return f.map(x => ({ m: x.steps })); },
    legal(s, mv, p) { if (mv && mv.r) return false; return p === this.turn(s) && s.ph === 'move' && mv && bgSeqLegal(s, mv.m); },
    apply(s, mv) {
      const t = clone(s); t.n++; delete t.open;
      if (mv.r) { t.ph = 'move'; t.rl = mv.r.slice(); t.d = mv.r[0] === mv.r[1] ? [mv.r[0], mv.r[0], mv.r[0], mv.r[0]] : mv.r.slice(); return t; }
      let pos = { pts: s.pts, bar: s.bar, off: s.off }; t.hits = 0;
      for (const [f, d] of mv.m) { const before = pos.bar[1 - s.p]; pos = bgStep(pos, s.p, f, d); if (pos.bar[1 - s.p] > before) t.hits++; }
      t.pts = pos.pts; t.bar = pos.bar; t.off = pos.off; t.p = 1 - s.p; t.ph = 'roll'; t.d = []; t.lastm = mv.m;
      return t;
    },
    over(s) {
      for (const p of [0, 1]) if (s.off[p] >= 15) {
        const o = 1 - p; let kind = 1;
        if (!s.off[o]) { kind = 2; if (s.bar[o] || s.pts.some((x, i) => (o ? x < 0 : x > 0) && (p ? i >= 18 : i <= 5))) kind = 3; }
        return { w: p, why: kind === 3 ? 'a BACKGAMMON (triple win!)' : kind === 2 ? 'a gammon (double win!)' : 'all checkers borne off', gammon: kind };
      }
      return null;
    },
    info(s, p) { return `Pips: ${bgPips(s, p)}  Off: ${s.off[p]}`; },
    ai(s, p, lv) {
      const f = bgFinals(s); if (!f.length) return { m: [] };
      if (lv === 0 && Math.random() < 0.6) return { m: pick(f).steps };
      let best = f[0], bv = -1e9;
      for (const x of f) { const v = bgEval(x.pos, p) + Math.random() * (lv === 0 ? 30 : lv === 1 ? 6 : 0.5); if (v > bv) { bv = v; best = x; } }
      return { m: best.steps };
    },
    rand(s) { const f = bgFinals(s); return { m: f.length ? pick(f).steps : [] }; },
    ui(api) {
      let geo = null, part = [], sel = -1, partN = -1, dice = null;
      const vis = i => api.me === 1 ? 23 - i : i; // the viewer's home is always bottom right
      const ui = {
        draw(c, W, H) {
          const s = api.st; if (partN !== s.n) { part = []; sel = -1; partN = s.n; }
          const f = fit(W, H, 1.3, 4), x0 = f.x, y0 = f.y, bw = f.w, bh = f.h;
          const tray = bw * 0.08, barW = bw * 0.07, pw = (bw - tray - barW - 8) / 12, ph = bh * 0.4;
          geo = { x0, y0, bw, bh, tray, barW, pw, ph };
          c.fillStyle = '#5a3414'; c.fillRect(x0, y0, bw, bh);
          c.fillStyle = '#2f6b3a'; c.fillRect(x0 + 4, y0 + 4, bw - tray - 8, bh - 8);
          c.fillStyle = '#4a2a10'; c.fillRect(x0 + 4 + 6 * pw, y0, barW, bh); c.fillRect(x0 + bw - tray - 4, y0, 4, bh);
          // the shown position: real state plus my partial steps this turn
          let pos = { pts: s.pts, bar: s.bar, off: s.off };
          for (const [ff, d] of part) pos = bgStep(pos, s.p, ff, d) || pos;
          const nexts = api.mine() && s.ph === 'move' ? bgNext(s, part) : [];
          const sources = new Set(nexts.map(o => o.f)), dests = new Set(nexts.filter(o => o.f === sel).map(o => o.t));
          for (let i = 0; i < 24; i++) {
            const { x, top } = ui.ptGeo(i);
            c.fillStyle = (i % 2) ? '#c8402a' : '#efe0b8'; c.beginPath();
            if (top) { c.moveTo(x, y0 + 4); c.lineTo(x + pw, y0 + 4); c.lineTo(x + pw / 2, y0 + 4 + ph); } else { c.moveTo(x, y0 + bh - 4); c.lineTo(x + pw, y0 + bh - 4); c.lineTo(x + pw / 2, y0 + bh - 4 - ph); }
            c.fill();
            const n = Math.abs(pos.pts[i]), blk = pos.pts[i] > 0, r = Math.min(pw * 0.46, ph / 5.4);
            for (let k = 0; k < Math.min(n, 5); k++) { const cy = top ? y0 + 4 + r + k * r * 2 : y0 + bh - 4 - r - k * r * 2; disc(c, x + pw / 2, cy, r * 0.96, blk ? '#2a1a10' : '#f2e6c8', blk ? '#000' : '#8a7040', blk ? '#7a5a40' : '#fff'); }
            if (n > 5) txt(c, '' + n, x + pw / 2, top ? y0 + 4 + r * 9 : y0 + bh - 4 - r * 9, r, pos.pts[i] > 0 ? '#fff' : '#000');
            if (sources.has(i) && (api.hints || sel === i)) { c.strokeStyle = sel === i ? '#ff0' : 'rgba(255,255,0,.6)'; c.lineWidth = 2; c.strokeRect(x + 1, top ? y0 + 5 : y0 + bh - 5 - ph, pw - 2, ph); }
            if (dests.has(i)) hintDot(c, x + pw / 2, top ? y0 + 4 + ph + 8 : y0 + bh - 4 - ph - 8, Math.max(4, pw * 0.16), '#ffe000');
            const lbl = api.me === 1 ? 24 - i : i + 1; txt(c, '' + lbl, x + pw / 2, top ? y0 + ph + 16 : y0 + bh - ph - 16, Math.max(7, pw * 0.22), 'rgba(255,255,255,.35)', 'center', false);
          }
          // bar and borne-off trays
          const bx = x0 + 4 + 6 * pw + barW / 2, r = Math.min(barW * 0.42, ph / 5.4);
          for (const p of [0, 1]) {
            const mineSide = (p === api.me) || (api.me < 0 && p === 0);
            for (let k = 0; k < pos.bar[p]; k++) { const cy = mineSide ? y0 + bh / 2 + r * 1.2 + k * r * 1.4 : y0 + bh / 2 - r * 1.2 - k * r * 1.4; disc(c, bx, cy, r, p ? '#f2e6c8' : '#2a1a10', p ? '#8a7040' : '#000', p ? '#fff' : '#7a5a40'); }
            const tx = x0 + bw - tray / 2, n = pos.off[p];
            for (let k = 0; k < n; k++) { const ty = mineSide ? y0 + bh - 8 - k * (bh * 0.42 / 15) : y0 + 8 + k * (bh * 0.42 / 15); c.fillStyle = p ? '#f2e6c8' : '#2a1a10'; c.fillRect(tx - tray * 0.35, ty - 2, tray * 0.7, Math.max(2, bh * 0.42 / 15 - 1)); }
          }
          if (sources.has(BAR) && sel === BAR) { c.strokeStyle = '#ff0'; c.lineWidth = 2; c.strokeRect(bx - barW / 2 + 1, y0 + bh / 2, barW - 2, bh / 2 - 4); }
          if (dests.has(25)) { c.strokeStyle = '#ffe000'; c.lineWidth = 3; c.strokeRect(x0 + bw - tray + 1, y0 + bh / 2, tray - 4, bh / 2 - 4); txt(c, 'OFF', x0 + bw - tray / 2, y0 + bh * 0.75, Math.max(9, tray * 0.28), '#ffe000'); }
          // dice
          if (s.ph === 'move' && s.d.length || s.rl) {
            if (!dice || dice.n !== s.n) { dice = { n: s.n, t: now() }; if (s.ph === 'move') { api.anim(500); api.sfx('dice'); } }
            const rolling = now() - dice.t < 450 && s.ph === 'move';
            const left = s.d.slice(); for (const [, d] of part) left.splice(left.indexOf(d), 1);
            const ds = Math.min(pw * 0.8, bh * 0.08), cx = s.p === api.me || (api.me < 0 && s.p === 0) ? x0 + 4 + 9 * pw + barW : x0 + 4 + 3 * pw;
            const vals = s.ph === 'move' ? (s.d.length === 4 ? [s.d[0], s.d[0]] : s.rl) : s.rl;
            vals.forEach((v, k) => {
              const dx = cx + (k ? ds * 0.7 : -ds * 1.7), dy = y0 + bh / 2 - ds / 2, used = s.ph !== 'move' || (s.d.length === 4 ? left.length <= (k ? 0 : 2) : !left.includes(v));
              const shown = rolling ? 1 + rint(6) : v;
              c.fillStyle = used ? '#bbb' : s.p === 1 ? '#f8f0dc' : '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1; c.fillRect(dx, dy, ds, ds); c.strokeRect(dx + 0.5, dy + 0.5, ds - 1, ds - 1);
              const pip = (a, b) => { c.fillStyle = '#000'; c.beginPath(); c.arc(dx + ds * a, dy + ds * b, ds * 0.09, 0, TAU); c.fill(); };
              if (shown % 2) pip(0.5, 0.5); if (shown > 1) { pip(0.25, 0.25); pip(0.75, 0.75); } if (shown > 3) { pip(0.75, 0.25); pip(0.25, 0.75); } if (shown === 6) { pip(0.25, 0.5); pip(0.75, 0.5); }
            });
            if (s.d.length === 4 && s.ph === 'move') txt(c, 'DOUBLES! x' + left.length, cx, y0 + bh / 2 + ds, Math.max(9, ds * 0.4), '#ffe000');
          }
        },
        ptGeo(i) { const v = vis(i), { x0, y0, pw, barW } = geo; const top = v >= 12; const col = top ? v - 12 : 11 - v; const x = x0 + 4 + col * pw + (col >= 6 ? barW : 0); return { x, top, y0 }; },
        at(x, y) {
          const { x0, y0, bw, bh, tray, barW, pw } = geo;
          if (x > x0 + bw - tray) return 25;
          const bx = x0 + 4 + 6 * pw; if (x >= bx && x <= bx + barW) return BAR;
          let col = Math.floor((x - x0 - 4 - (x > bx ? barW : 0)) / pw); if (col < 0 || col > 11) return -1;
          const top = y < y0 + bh / 2, v = top ? 12 + col : 11 - col;
          return api.me === 1 ? 23 - v : v;
        },
        tap(x, y) {
          const s = api.st; if (!geo || !api.mine() || s.ph !== 'move') return;
          const nexts = bgNext(s, part), t = ui.at(x, y);
          if (t < 0) return;
          if (sel >= 0) {
            const opts = nexts.filter(o => o.f === sel && o.t === t);
            if (opts.length) { const o = opts.reduce((a, b) => (a.d <= b.d ? a : b)); part.push([o.f, o.d]); sel = -1; api.sfx('click'); ui.autoSel(); api.redraw(); return; }
          }
          if (nexts.some(o => o.f === t)) { sel = t; const opts = nexts.filter(o => o.f === t); if (opts.length === 1 && !api.hints && false) { /* keep it two taps */ } api.sfx('click'); api.redraw(); return; }
          sel = -1; api.redraw();
        },
        autoSel() { const n = bgNext(api.st, part); if (n.length && new Set(n.map(o => o.f)).size === 1) sel = n[0].f; },
        tools: [
          { label: 'Undo', show: () => api.mine() && api.st.ph === 'move', dis: () => !part.length, act: () => { part.pop(); sel = -1; api.redraw(); } },
          { label: 'Done', bold: true, show: () => api.mine() && api.st.ph === 'move', dis: () => bgNext(api.st, part).length > 0, act: () => { if (bgNext(api.st, part).length) return; const mv = { m: part.slice() }; part = []; sel = -1; api.move(mv); } },
        ],
        partial: () => part,
      };
      return ui;
    },
    autoPass: s => s.ph === 'move' && bgMaxLen({ pts: s.pts, bar: s.bar, off: s.off }, s.p, s.d, new Map()) === 0,
    passMove: () => ({ m: [] }),
  };
  // Backgammon: when the timer runs out, the partial steps are thrown away and a random legal turn is played.

  // =========================================================================================== SABER PONG (real time)
  // A space duel: two laser-sword paddles knock a little glowing droid ball across a starfield. Host simulates; guest predicts.
  const PW = 480, PH = 320, PADH = 70, PADW = 10, PX = [18, PW - 18], BR = 7, WIN_PTS = 7;
  const pong = {
    W: PW, H: PH, PADH, WIN: WIN_PTS,
    newSim: () => ({ b: [PW / 2, PH / 2, 0, 0], y: [PH / 2, PH / 2], sc: [0, 0], serve: 1200, srv: 0, hits: 0, ev: null }),
    serveBall(sim) { const dir = sim.srv ? -1 : 1; const a = (Math.random() - 0.5) * 0.8; sim.b = [PW / 2, PH / 2, Math.cos(a) * 230 * dir, Math.sin(a) * 230]; sim.hits = 0; },
    step(sim, dt, auth) { // auth: this computer decides points (the host). Returns 'hit'|'wall'|'point0'|'point1'|null
      let ev = null;
      if (sim.serve > 0) { sim.serve -= dt * 1000; if (sim.serve <= 0 && auth) { this.serveBall(sim); ev = 'serve'; } return ev; }
      const b = sim.b; b[0] += b[2] * dt; b[1] += b[3] * dt;
      if (b[1] < BR) { b[1] = BR; b[3] = Math.abs(b[3]); ev = 'wall'; }
      if (b[1] > PH - BR) { b[1] = PH - BR; b[3] = -Math.abs(b[3]); ev = 'wall'; }
      for (const s of [0, 1]) {
        const px = PX[s], toward = s ? b[2] > 0 : b[2] < 0;
        if (toward && Math.abs(b[0] - px) < BR + PADW / 2 && Math.abs(b[1] - sim.y[s]) < PADH / 2 + BR) {
          const off = (b[1] - sim.y[s]) / (PADH / 2), sp = Math.min(560, Math.hypot(b[2], b[3]) * 1.06), ang = off * 0.95;
          b[2] = Math.cos(ang) * sp * (s ? -1 : 1); b[3] = Math.sin(ang) * sp; b[0] = px + (s ? -1 : 1) * (BR + PADW / 2 + 1); sim.hits++; ev = 'hit';
        }
      }
      if (auth && (b[0] < -BR * 2 || b[0] > PW + BR * 2)) { const w = b[0] < 0 ? 1 : 0; sim.sc[w]++; sim.srv = 1 - w; sim.serve = 1100; sim.b = [PW / 2, PH / 2, 0, 0]; ev = 'point' + w; }
      return ev;
    },
    aiY(sim, s, lv, dt, mem) { // where the computer's paddle wants to be
      const b = sim.b, toward = s ? b[2] > 0 : b[2] < 0;
      mem.err = mem.err == null ? 0 : mem.err; mem.t = (mem.t || 0) + dt;
      if (mem.t > 0.6) { mem.t = 0; mem.err = (Math.random() - 0.5) * [90, 46, 14][lv]; }
      let target = PH / 2;
      if (toward && sim.serve <= 0) { // predict with wall bounces
        let x = b[0], y = b[1], vx = b[2], vy = b[3], guard = 0;
        while ((s ? x < PX[s] : x > PX[s]) && guard++ < 400) { const dtt = 1 / 60; x += vx * dtt; y += vy * dtt; if (y < BR) { y = BR; vy = -vy; } if (y > PH - BR) { y = PH - BR; vy = -vy; } }
        target = y + mem.err;
      }
      const sp = [170, 260, 420][lv] * dt, cur = sim.y[s];
      return cur + Math.max(-sp, Math.min(sp, target - cur));
    },
    stars: (() => { const a = []; let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 70; i++) a.push([r() * PW, r() * PH, r() * 1.4 + 0.3, r()]); return a; })(),
    draw(c, W, H, sim, me, names, t) {
      const f = fit(W, H, PW / PH, 2), k = f.w / PW;
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.save(); c.translate(f.x, f.y); c.scale(k, k);
      c.fillStyle = '#050818'; c.fillRect(0, 0, PW, PH);
      for (const [x, y, r, tw] of this.stars) { c.globalAlpha = 0.5 + 0.5 * Math.sin(t / 400 + tw * 9); c.fillStyle = '#fff'; c.fillRect(x, y, r, r); }
      c.globalAlpha = 1;
      // a far-off ringed planet
      c.fillStyle = '#3a2a6a'; c.beginPath(); c.arc(PW * 0.78, PH * 0.25, 22, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(200,180,255,.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse(PW * 0.78, PH * 0.25, 36, 8, -0.3, 0, TAU); c.stroke();
      c.setLineDash([6, 8]); c.strokeStyle = 'rgba(120,140,255,.35)'; c.beginPath(); c.moveTo(PW / 2, 0); c.lineTo(PW / 2, PH); c.stroke(); c.setLineDash([]);
      c.font = 'bold 34px "Courier New",monospace'; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillStyle = 'rgba(255,230,120,.8)';
      c.fillText('' + sim.sc[0], PW / 2 - 44, 10); c.fillText('' + sim.sc[1], PW / 2 + 44, 10);
      for (const s of [0, 1]) { // laser swords: glow, core, hilt
        const col = s ? '#ff2a2a' : '#2a8cff', x = PX[s], y = sim.y[s];
        c.shadowColor = col; c.shadowBlur = 14; c.fillStyle = col; c.fillRect(x - PADW / 2, y - PADH / 2, PADW, PADH); c.shadowBlur = 0;
        c.fillStyle = '#fff'; c.fillRect(x - 2, y - PADH / 2 + 3, 4, PADH - 6);
        c.fillStyle = '#9aa0a8'; c.fillRect(x - 4, y + PADH / 2, 8, 12); c.fillStyle = '#333'; c.fillRect(x - 4, y + PADH / 2 + 4, 8, 2);
        if (s === me) { c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '10px Tahoma,sans-serif'; c.textBaseline = 'bottom'; c.fillText('YOU', x, y - PADH / 2 - 3); }
      }
      if (sim.serve > 0) { c.fillStyle = 'rgba(255,255,255,.85)'; c.font = 'bold 14px Tahoma,sans-serif'; c.textBaseline = 'middle'; c.fillText(sim.sc[0] + sim.sc[1] ? 'Get ready...' : 'Ignite your sabers!', PW / 2, PH / 2 + 34); }
      const [bx, by] = sim.b; // the droid ball: a little round grot droid with one eye
      c.shadowColor = '#7fff7f'; c.shadowBlur = 10; c.fillStyle = '#c8ffc8'; c.beginPath(); c.arc(bx, by, BR, 0, TAU); c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#2a6a2a'; c.beginPath(); c.arc(bx, by - 1, BR * 0.45, 0, TAU); c.fill(); c.fillStyle = '#f00'; c.fillRect(bx - 1, by - 2, 2, 2);
      c.restore();
      return f;
    },
  };
  GM.pong = {
    id: 'pong', name: 'Spatula Pong', pn: ['Blue Spatula', 'Red Spatula'], pc: ['#2a8cff', '#ff2a2a'], aspect: PW / PH, rt: true, pong,
    blurb: 'Real-time space duel. Knock the droid past your opponent\'s laser sword. First to 7. Drag or use the arrow keys.',
    init: () => ({ n: 0, p: 0 }),
    check: () => true, turn: () => -1, moves: () => [], legal: () => false, apply: s => s, over: () => null,
  };

  // =========================================================================================== CHESS
  // Jack Chess's own engine and piece art (games-chess.js, loaded with the Zone: JGames.chessKit). The table state is
  // plain JSON: the board as 64 letters (PNBRQK white, pnbrqk black, . empty), whose move, castling rights, the en
  // passant square, the 50-move counter and a short list of recent position hashes for threefold repetition.
  const CK = () => (window.JGames && JGames.chessKit) || null;
  const CHL = '.PNBRQK..pnbrqk';
  const chToEng = s => { const b = new Int8Array(64), k = [0, 0]; for (let i = 0; i < 64; i++) { const v = CHL.indexOf(s.b[i]); b[i] = v > 0 ? v : 0; if (v === 6) k[0] = i; else if (v === 14) k[1] = i; } return { b, side: s.side, cr: s.cr, ep: s.ep, half: s.half, full: s.full, k }; };
  const chStr = b => { let o = ''; for (let i = 0; i < 64; i++) o += CHL[b[i]] || '.'; return o; };
  const chHash = e => { const k = CHL && (Array.prototype.join.call(e.b, ',') + '|' + e.side + e.cr + e.ep); let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const chFind = (e, mv) => { const K = CK(); if (!K || !mv) return null; return K.legal(e).find(m => m.f === mv.f && m.t === mv.t && (m.pr || 0) === (mv.pr || 0)) || null; };
  GM.chess = {
    id: 'chess', name: 'Chess', pn: ['White', 'Black'], pc: ['#f4ead2', '#222'], aspect: 1, tmul: 2,
    blurb: 'Proper chess with Jack Chess\'s robot pieces. Checkmate the mainframe! Castling, en passant, promotion, the lot.',
    init() { const K = CK(), e = K ? K.parseFEN(K.START) : null; const st = { n: 0, b: e ? chStr(e.b) : 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR', side: 0, cr: 15, ep: -1, half: 0, full: 1, rep: [] }; st.rep = [chHash(chToEng(st))]; return st; },
    check: s => s && isInt(s.n, 0, 9999) && isStr(s.b, 64, /^[.PNBRQKpnbrqk]+$/) && isInt(s.side, 0, 1) && isInt(s.cr, 0, 15) && isInt(s.ep, -1, 63) && isInt(s.half, 0, 999) && isInt(s.full, 1, 9999) && Array.isArray(s.rep) && s.rep.length <= 40 && s.rep.every(x => typeof x === 'string' && x.length <= 8) && count(s.b, 'K') === 1 && count(s.b, 'k') === 1,
    turn(s) { return this.over(s) ? -1 : s.side; },
    moves(s) { const K = CK(); return K ? K.legal(chToEng(s)).map(m => ({ f: m.f, t: m.t, pr: m.pr || 0 })) : []; },
    legal(s, mv, p) { return p === this.turn(s) && !!mv && isInt(mv.f, 0, 63) && isInt(mv.t, 0, 63) && (mv.pr == null || isInt(mv.pr, 0, 5)) && !!chFind(chToEng(s), mv); },
    apply(s, mv) {
      const e = chToEng(s), m = chFind(e, mv); if (!m) return clone(s);
      const n = m.n, t = { n: s.n + 1, b: chStr(n.b), side: n.side, cr: n.cr, ep: n.ep, half: Math.min(999, n.half), full: Math.min(9999, n.full), rep: n.half === 0 ? [] : s.rep.slice(-35) };
      t.rep.push(chHash(n)); return t;
    },
    over(s) {
      const K = CK(); if (!K) return null;
      const e = chToEng(s), ms = K.legal(e);
      if (!ms.length) return K.inCheck(e) ? { w: 1 - s.side, why: 'checkmate' } : { w: -1, why: 'stalemate' };
      if (s.half >= 100) return { w: -1, why: '50 moves without a capture or a pawn move' };
      const h = s.rep[s.rep.length - 1]; if (h && s.rep.filter(x => x === h).length >= 3) return { w: -1, why: 'the same position three times' };
      if (K.deadPosition(e.b)) return { w: -1, why: 'not enough pieces left to checkmate' };
      return null;
    },
    score(s) { const V = { P: 1, N: 3, B: 3, R: 5, Q: 9 }; let w = 0, b = 0; for (const ch of s.b) { if (V[ch]) w += V[ch]; else if (V[ch.toUpperCase()]) b += V[ch.toUpperCase()]; } return [w, b]; },
    info(s, p) { const sc = this.score(s), K = CK(), chk = K && s.side === p && K.inCheck(chToEng(s)); return `Material: ${sc[p]}${chk ? '  CHECK!' : ''}`; },
    rand(s, p) { const ms = this.moves(s); return ms.length ? pick(ms) : null; },
    ai(s, p, lv) {
      const K = CK(); if (!K) return null;
      const e = chToEng(s), ms = K.legal(e); if (!ms.length) return null;
      const out = m => ({ f: m.f, t: m.t, pr: m.pr || 0 });
      if (lv === 0 && Math.random() < 0.3) return out(pick(ms));
      const maxD = [1, 2, 3][lv], noise = lv === 0 ? 140 : lv === 1 ? 20 : 0, t0 = now(), budget = [120, 450, 1100][lv];
      let best = ms.slice().sort((a, b) => K.orderScore(b) - K.orderScore(a))[0];
      for (let d = 1; d <= maxD; d++) {
        try { const se = K.Searcher(t0 + budget); const order = ms.slice().sort((a, b) => (b === best) - (a === best) || K.orderScore(b) - K.orderScore(a)); const b2 = se.root(e, d, order, noise); if (b2) best = b2; }
        catch (er) { if (er !== K.ABORT) throw er; break; }
        if (now() > t0 + budget) break;
      }
      return out(best);
    },
    ui(api) {
      let geo = null, sel = -1, hov = -1, promo = 5;
      const set = () => (api.priv.set || 'grot');
      const flip = () => api.me === 1; // black sits at the bottom of their own screen
      const sq2xy = i => { let r = i >> 3, c = i & 7; if (flip()) { r = 7 - r; c = 7 - c; } return [geo.f.x + c * geo.cs, geo.f.y + r * geo.cs]; };
      const mine = () => (api.mine() ? GM.chess.moves(api.st) : []);
      const ui = {
        draw(c, W, H) {
          const K = CK(), s = api.st, f = fit(W, H, 1, 14), cs = f.w / 8; geo = { f, cs };
          if (!api.mine()) sel = -1;
          const BD = (K && K.BOARDS.wood) || ['#ecd3a4', '#a8703f', '#5a3410'];
          c.fillStyle = BD[2]; c.fillRect(f.x - 12, f.y - 12, f.w + 24, f.h + 24);
          const ms = mine(), tg = sel >= 0 ? ms.filter(m => m.f === sel) : [];
          const lm = api.last && api.last.mv, e = chToEng(s), chk = K && K.inCheck(e) ? e.k[s.side] : -1;
          for (let i = 0; i < 64; i++) {
            const [x, y] = sq2xy(i); c.fillStyle = (((i >> 3) + (i & 7)) & 1) ? BD[1] : BD[0]; c.fillRect(x, y, cs + 0.5, cs + 0.5);
            if (lm && (lm.f === i || lm.t === i)) { c.fillStyle = 'rgba(255,220,0,.35)'; c.fillRect(x, y, cs, cs); }
            if (i === sel) { c.fillStyle = 'rgba(0,160,255,.4)'; c.fillRect(x, y, cs, cs); }
            if (i === chk) { c.fillStyle = 'rgba(230,0,0,.45)'; c.fillRect(x, y, cs, cs); }
            if (i === hov && api.mine()) { c.strokeStyle = '#ffd400'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, cs - 2, cs - 2); }
            const v = CHL.indexOf(s.b[i]);
            if (v > 0 && K) c.drawImage(K.sprite(set(), v, Math.max(8, Math.round(cs * (window.devicePixelRatio || 1)))), x, y, cs, cs);
            else if (v > 0) txt(c, s.b[i], x + cs / 2, y + cs / 2, cs * 0.6, v > 8 ? '#000' : '#fff');
          }
          if (api.hints) tg.forEach(m => { const [x, y] = sq2xy(m.t); if (s.b[m.t] !== '.') { c.strokeStyle = 'rgba(0,120,0,.8)'; c.lineWidth = Math.max(2, cs * 0.07); c.beginPath(); c.arc(x + cs / 2, y + cs / 2, cs * 0.44, 0, TAU); c.stroke(); } else hintDot(c, x + cs / 2, y + cs / 2, cs * 0.13, 'rgba(0,120,0,.6)'); });
          // file and rank letters round the edge
          for (let k = 0; k < 8; k++) { const fl = flip() ? 7 - k : k, rk = flip() ? k + 1 : 8 - k; txt(c, 'abcdefgh'[fl], f.x + k * cs + cs / 2, f.y + f.h + 6, Math.max(8, cs * 0.18), '#f4e4c0', 'center', false); txt(c, String(rk), f.x - 6, f.y + k * cs + cs / 2, Math.max(8, cs * 0.18), '#f4e4c0', 'center', false); }
        },
        at(x, y) { if (!geo) return -1; let cx = Math.floor((x - geo.f.x) / geo.cs), cy = Math.floor((y - geo.f.y) / geo.cs); if (cx < 0 || cx > 7 || cy < 0 || cy > 7) return -1; if (flip()) { cx = 7 - cx; cy = 7 - cy; } return cy * 8 + cx; },
        hover(x, y) { const i = ui.at(x, y); if (i !== hov) { hov = i; api.redraw(); } },
        tap(x, y) {
          if (!api.mine()) { if (api.me >= 0) api.say('Not your move yet!'); return; }
          const i = ui.at(x, y); if (i < 0) return;
          const ms = mine(), own = ms.some(m => m.f === i);
          if (sel >= 0) {
            const opts = ms.filter(m => m.f === sel && m.t === i);
            if (opts.length) { const m = opts.find(o => o.pr === promo) || opts.find(o => !o.pr) || opts[0]; sel = -1; if (m.pr && m.pr !== 5) api.say('Promoted to a ' + ['', '', 'knight', 'bishop', 'rook', 'queen'][m.pr] + '!'); api.move({ f: m.f, t: m.t, pr: m.pr || 0 }); return; }
          }
          if (own) { sel = i; api.sfx('click'); api.redraw(); return; }
          if (sel >= 0) { sel = -1; api.redraw(); return; }
          const ch = api.st.b[i]; if (ch !== '.' && ((ch === ch.toUpperCase()) === (api.me === 0))) { api.say('That piece has nowhere to go.'); api.sfx('thud'); }
        },
        tools: [
          { label: 'Promote to: Queen', show: () => api.me >= 0, act: () => { promo = promo === 5 ? 2 : promo === 2 ? 4 : promo === 4 ? 3 : 5; ui.tools[0].label = 'Promote to: ' + ['', '', 'Knight', 'Bishop', 'Rook', 'Queen'][promo]; } },
          { label: 'Robot / Classic pieces', act: () => { api.priv.set = set() === 'grot' ? 'classic' : 'grot'; api.redraw(); } },
        ],
      };
      return ui;
    },
  };

  // the order games appear in the lobby, plus the art for the tables
  Z.ORDER = ['reversi', 'checkers', 'c4', 'ships', 'ttt', 'gomoku', 'dots', 'bg', 'pong', 'chess'];
  Z.util = { fit, disc, bevel, txt, h64, rint, pick, shuffle, isInt, clone, count };
})();

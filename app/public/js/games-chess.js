/* Jack Chess for JackOS 98 (lazy loaded by apps-games.js): you versus "Deep Jack", a small chess engine
 * written from scratch. Fully legal chess (castling, en passant, promotion, check, mate, stalemate, the
 * 50-move rule, threefold repetition and dead positions), alpha-beta search with quiescence, two piece sets
 * drawn live on canvas (Grots and Classic), undo, hints, a move list and a very cheeky computer. */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;

  // ================================================================ engine
  // board: Int8Array(64), square = row * 8 + file, row 0 = rank 8. piece = type (1 P, 2 N, 3 B, 4 R, 5 Q, 6 K) | 8 for black
  const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
  const VAL = [0, 100, 320, 330, 500, 900, 0];
  const LETTER = ['', '', 'N', 'B', 'R', 'Q', 'K'];
  const KN = [], KG = [], RAY = [];
  const DIRS = [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [-1, -1], [1, 1], [1, -1]];
  for (let sq = 0; sq < 64; sq++) {
    const r = sq >> 3, f = sq & 7, on = (a, b) => a >= 0 && a < 8 && b >= 0 && b < 8;
    KN[sq] = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].filter(([a, b]) => on(r + a, f + b)).map(([a, b]) => (r + a) * 8 + f + b);
    KG[sq] = DIRS.filter(([a, b]) => on(r + a, f + b)).map(([a, b]) => (r + a) * 8 + f + b);
    RAY[sq] = DIRS.map(([a, b]) => { const out = []; let rr = r + a, ff = f + b; while (on(rr, ff)) { out.push(rr * 8 + ff); rr += a; ff += b; } return out; });
  }
  const CRMASK = new Array(64).fill(15); CRMASK[60] = 12; CRMASK[56] = 13; CRMASK[63] = 14; CRMASK[4] = 3; CRMASK[0] = 7; CRMASK[7] = 11;
  const sqName = sq => 'abcdefgh'[sq & 7] + (8 - (sq >> 3));
  const nameSq = n => (8 - +n[1]) * 8 + 'abcdefgh'.indexOf(n[0]);

  function parseFEN(fen) {
    const [pos, side, cas, ep, half, full] = fen.trim().split(/\s+/);
    const b = new Int8Array(64), k = [0, 0];
    let sq = 0;
    for (const ch of pos) {
      if (ch === '/') continue;
      if (/\d/.test(ch)) { sq += +ch; continue; }
      const t = 'pnbrqk'.indexOf(ch.toLowerCase()) + 1, black = ch === ch.toLowerCase();
      b[sq] = t | (black ? 8 : 0); if (t === K) k[black ? 1 : 0] = sq; sq++;
    }
    let cr = 0; if (cas.includes('K')) cr |= 1; if (cas.includes('Q')) cr |= 2; if (cas.includes('k')) cr |= 4; if (cas.includes('q')) cr |= 8;
    return { b, side: side === 'b' ? 1 : 0, cr, ep: ep && ep !== '-' ? nameSq(ep) : -1, half: +half || 0, full: +full || 1, k };
  }
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  function attacked(b, sq, by) {
    const r = sq >> 3, f = sq & 7, c = by ? 8 : 0;
    if (by === 0) { if (r < 7) { if (f > 0 && b[sq + 7] === P) return true; if (f < 7 && b[sq + 9] === P) return true; } }
    else if (r > 0) { if (f > 0 && b[sq - 9] === (P | 8)) return true; if (f < 7 && b[sq - 7] === (P | 8)) return true; }
    const kn = N | c, kg = K | c;
    for (const t of KN[sq]) if (b[t] === kn) return true;
    for (const t of KG[sq]) if (b[t] === kg) return true;
    const rq = R | c, bq = B | c, qq = Q | c, rays = RAY[sq];
    for (let d = 0; d < 8; d++) {
      const ray = rays[d], a = d < 4 ? rq : bq;
      for (let i = 0; i < ray.length; i++) { const p = b[ray[i]]; if (p) { if (p === a || p === qq) return true; break; } }
    }
    return false;
  }
  const inCheck = s => attacked(s.b, s.k[s.side], 1 - s.side);

  function gen(s, caps) {
    const b = s.b, side = s.side, mv = [];
    for (let sq = 0; sq < 64; sq++) {
      const p = b[sq]; if (!p || (p >> 3) !== side) continue;
      const t = p & 7;
      if (t === P) {
        const dir = side ? 8 : -8, r = sq >> 3, f = sq & 7, start = side ? 1 : 6, last = side ? 6 : 1, one = sq + dir;
        const add = (to, c, fl) => { if (r === last) { for (const pr of (caps ? [Q] : [Q, R, B, N])) mv.push({ f: sq, t: to, p, c, pr, fl: 0 }); } else mv.push({ f: sq, t: to, p, c, pr: 0, fl: fl || 0 }); };
        if (!b[one]) { if (!caps || r === last) add(one, 0); if (!caps && r === start && !b[one + dir]) mv.push({ f: sq, t: one + dir, p, c: 0, pr: 0, fl: 1 }); }
        for (const df of [-1, 1]) {
          if (f + df < 0 || f + df > 7) continue;
          const to = one + df, q = b[to];
          if (q && (q >> 3) !== side) add(to, q);
          else if (to === s.ep && !q) mv.push({ f: sq, t: to, p, c: P | (side ? 0 : 8), pr: 0, fl: 2 });
        }
      } else if (t === N || t === K) {
        for (const to of (t === N ? KN : KG)[sq]) { const q = b[to]; if (q ? (q >> 3) !== side : !caps) mv.push({ f: sq, t: to, p, c: q, pr: 0, fl: 0 }); }
        if (t === K && !caps) {
          const opp = 1 - side;
          if (side === 0 && sq === 60) {
            if ((s.cr & 1) && !b[61] && !b[62] && b[63] === R && !attacked(b, 60, opp) && !attacked(b, 61, opp) && !attacked(b, 62, opp)) mv.push({ f: 60, t: 62, p, c: 0, pr: 0, fl: 3 });
            if ((s.cr & 2) && !b[59] && !b[58] && !b[57] && b[56] === R && !attacked(b, 60, opp) && !attacked(b, 59, opp) && !attacked(b, 58, opp)) mv.push({ f: 60, t: 58, p, c: 0, pr: 0, fl: 3 });
          } else if (side === 1 && sq === 4) {
            if ((s.cr & 4) && !b[5] && !b[6] && b[7] === (R | 8) && !attacked(b, 4, opp) && !attacked(b, 5, opp) && !attacked(b, 6, opp)) mv.push({ f: 4, t: 6, p, c: 0, pr: 0, fl: 3 });
            if ((s.cr & 8) && !b[3] && !b[2] && !b[1] && b[0] === (R | 8) && !attacked(b, 4, opp) && !attacked(b, 3, opp) && !attacked(b, 2, opp)) mv.push({ f: 4, t: 2, p, c: 0, pr: 0, fl: 3 });
          }
        }
      } else {
        const d0 = t === B ? 4 : 0, d1 = t === R ? 4 : 8;
        for (let d = d0; d < d1; d++) for (const to of RAY[sq][d]) { const q = b[to]; if (q) { if ((q >> 3) !== side) mv.push({ f: sq, t: to, p, c: q, pr: 0, fl: 0 }); break; } if (!caps) mv.push({ f: sq, t: to, p, c: 0, pr: 0, fl: 0 }); }
      }
    }
    return mv;
  }
  function make(s, m) {
    const b = s.b.slice(), side = s.side;
    let piece = b[m.f]; b[m.f] = 0;
    if (m.pr) piece = m.pr | (side ? 8 : 0);
    b[m.t] = piece;
    if (m.fl === 2) b[m.t + (side ? -8 : 8)] = 0;
    else if (m.fl === 3) { if (m.t === 62) { b[63] = 0; b[61] = R; } else if (m.t === 58) { b[56] = 0; b[59] = R; } else if (m.t === 6) { b[7] = 0; b[5] = R | 8; } else { b[0] = 0; b[3] = R | 8; } }
    const k = [s.k[0], s.k[1]]; if ((m.p & 7) === K) k[side] = m.t;
    return { b, side: 1 - side, cr: s.cr & CRMASK[m.f] & CRMASK[m.t], ep: m.fl === 1 ? (m.f + m.t) >> 1 : -1, half: ((m.p & 7) === P || m.c) ? 0 : s.half + 1, full: s.full + side, k };
  }
  function legal(s, caps) {
    const out = [];
    for (const m of gen(s, caps)) { const n = make(s, m); if (!attacked(n.b, n.k[s.side], n.side)) { m.n = n; out.push(m); } }
    return out;
  }
  function perft(s, d) { if (d === 0) return 1; const ms = legal(s); if (d === 1) return ms.length; let n = 0; for (const m of ms) n += perft(m.n, d - 1); return n; }

  // piece-square tables, built from simple rules (white's point of view; black reads them mirrored)
  const PST = [[], [], [], [], [], [], [], []], PSTE = [];
  for (let sq = 0; sq < 64; sq++) {
    const r = sq >> 3, f = sq & 7, cd = Math.max(Math.abs(r - 3.5), Math.abs(f - 3.5)) - 0.5, adv = 6 - r;
    PST[P][sq] = adv * 7 + ((f === 3 || f === 4) && (r === 3 || r === 4) ? 18 : 0) + ((f === 3 || f === 4) && r === 6 ? -12 : 0) + (r === 1 ? 40 : 0);
    PST[N][sq] = 22 - cd * 12 - (r === 7 ? 6 : 0);
    PST[B][sq] = 12 - cd * 6 - (r === 7 ? 6 : 0);
    PST[R][sq] = (r === 1 ? 18 : 0) + (f === 3 || f === 4 ? 6 : 0);
    PST[Q][sq] = 6 - cd * 3;
    PST[K][sq] = (r === 7 ? 12 : r === 6 ? -6 : -24 - (6 - r) * 6) + (f === 1 || f === 2 || f === 6 ? 14 : f === 3 || f === 4 ? -6 : 0);
    PSTE[sq] = 24 - cd * 12;
  }
  function evaluate(s) {
    const b = s.b; let sc = 0, nonPawn = 0, bw = 0, bb = 0;
    for (let sq = 0; sq < 64; sq++) { const p = b[sq]; if (!p) continue; const t = p & 7; if (t !== P && t !== K) nonPawn += VAL[t]; if (t === B) p & 8 ? bb++ : bw++; }
    const endgame = nonPawn <= 2600;
    for (let sq = 0; sq < 64; sq++) {
      const p = b[sq]; if (!p) continue;
      const t = p & 7, black = p & 8, i = black ? ((7 - (sq >> 3)) << 3) | (sq & 7) : sq;
      const v = VAL[t] + (t === K && endgame ? PSTE[i] : PST[t][i]);
      sc += black ? -v : v;
    }
    if (bw >= 2) sc += 25; if (bb >= 2) sc -= 25;
    return s.side ? -sc : sc;
  }
  const MATE = 100000, ABORT = {};
  function orderScore(m) { return m.c ? 10000 + VAL[m.c & 7] * 10 - VAL[m.p & 7] : m.pr ? 9000 + VAL[m.pr] : m.fl === 3 ? 50 : 0; }
  function Searcher(deadline) {
    const S = { nodes: 0 };
    const tick = () => { if ((++S.nodes & 511) === 0 && performance.now() > deadline) throw ABORT; };
    function qs(s, a, beta, qd) {
      tick();
      const stand = evaluate(s);
      if (stand >= beta) return stand;
      if (stand > a) a = stand;
      if (qd > 6) return a;
      const ms = legal(s, true); ms.sort((x, y) => orderScore(y) - orderScore(x));
      for (const m of ms) { const v = -qs(m.n, -beta, -a, qd + 1); if (v >= beta) return v; if (v > a) a = v; }
      return a;
    }
    function ab(s, d, a, beta, ply) {
      tick();
      if (s.half >= 100) return 0;
      const ms = legal(s);
      if (!ms.length) return inCheck(s) ? -MATE + ply : 0;
      if (d <= 0) return qs(s, a, beta, 0);
      ms.sort((x, y) => orderScore(y) - orderScore(x));
      for (const m of ms) { const v = -ab(m.n, d - 1, -beta, -a, ply + 1); if (v >= beta) return v; if (v > a) a = v; }
      return a;
    }
    S.root = (s, d, moves, noise) => { // returns [best, scores]
      let best = null, bestV = -Infinity;
      for (const m of moves) {
        const alpha = bestV === -Infinity ? -MATE - 1 : bestV - (noise || 0);
        let v = -ab(m.n, d - 1, -MATE - 1, -alpha, 1);
        if (noise) v += (Math.random() - 0.5) * noise;
        m.v = v; if (v > bestV) { bestV = v; best = m; }
      }
      return best;
    };
    return S;
  }
  // a tiny opening book (coordinate moves) so Deep Jack doesn't always play the same game
  const BOOK = ['e2e4 e7e5 g1f3 b8c6 f1b5 a7a6', 'e2e4 e7e5 g1f3 b8c6 f1c4 f8c5', 'e2e4 c7c5 g1f3 d7d6 d2d4 c5d4', 'e2e4 e7e6 d2d4 d7d5', 'e2e4 c7c6 d2d4 d7d5',
    'd2d4 d7d5 c2c4 e7e6 b1c3 g8f6', 'd2d4 g8f6 c2c4 e7e6 g1f3', 'd2d4 d7d5 g1f3 g8f6 c1f4', 'c2c4 e7e5 b1c3 g8f6', 'g1f3 d7d5 g2g3 g8f6 f1g2', 'e2e4 d7d5 e4d5 d8d5 b1c3'].map(l => l.split(' '));
  const coord = m => sqName(m.f) + sqName(m.t) + (m.pr ? 'nbrq'[m.pr - 2] : '');

  function san(s, m, ms) {
    let out;
    if (m.fl === 3) out = (m.t & 7) === 6 ? 'O-O' : 'O-O-O';
    else {
      const t = m.p & 7;
      if (t === P) out = (m.c ? 'abcdefgh'[m.f & 7] + 'x' : '') + sqName(m.t) + (m.pr ? '=' + LETTER[m.pr] : '');
      else {
        const others = ms.filter(o => o !== m && o.t === m.t && o.p === m.p);
        let dis = '';
        if (others.length) { const sameFile = others.some(o => (o.f & 7) === (m.f & 7)), sameRank = others.some(o => (o.f >> 3) === (m.f >> 3)); dis = !sameFile ? 'abcdefgh'[m.f & 7] : !sameRank ? String(8 - (m.f >> 3)) : sqName(m.f); }
        out = LETTER[t] + dis + (m.c ? 'x' : '') + sqName(m.t);
      }
    }
    const n = m.n || make(s, m);
    if (inCheck(n)) out += legal(n).length ? '+' : '#';
    return out;
  }
  const posKey = s => s.b.join('') + s.side + s.cr + s.ep;
  function deadPosition(b) {
    const minors = [], others = [];
    for (let sq = 0; sq < 64; sq++) { const t = b[sq] & 7; if (!t || t === K) continue; if (t === N || t === B) minors.push([t, sq]); else others.push(t); }
    if (others.length) return false;
    if (minors.length <= 1) return true;
    if (minors.every(([t]) => t === B)) { const c = minors.map(([, sq]) => ((sq >> 3) + (sq & 7)) & 1); return c.every(x => x === c[0]); }
    return false;
  }
  JG.chessEngine = { parseFEN, legal, perft, make, san, evaluate, START };

  // ================================================================ piece art (100x100 unit box)
  const TAU = Math.PI * 2;
  function pth(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }
  function classic(c, t, black) {
    const fill = black ? '#2b2b30' : '#f6eedb', line = black ? '#000' : '#1a1a1a', hi = black ? '#6a6a74' : '#fff';
    const g = c.createLinearGradient(20, 0, 80, 0); g.addColorStop(0, black ? '#45454d' : '#fffaf0'); g.addColorStop(1, fill);
    c.fillStyle = g; c.strokeStyle = line; c.lineWidth = 3.2; c.lineJoin = 'round';
    const base = () => { c.beginPath(); c.ellipse(50, 84, 28, 7, 0, 0, TAU); c.fill(); c.stroke(); c.fillRect(22, 78, 56, 6); c.beginPath(); c.moveTo(22, 78); c.lineTo(22, 84); c.moveTo(78, 78); c.lineTo(78, 84); c.stroke(); c.beginPath(); c.ellipse(50, 78, 28, 7, 0, 0, TAU); c.fill(); c.stroke(); };
    base();
    if (t === P) { pth(c, [[36, 76], [64, 76], [56, 52], [44, 52]]); c.fill(); c.stroke(); c.beginPath(); c.ellipse(50, 52, 14, 4.5, 0, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(50, 38, 12, 0, TAU); c.fill(); c.stroke(); }
    else if (t === R) { pth(c, [[32, 76], [68, 76], [64, 40], [36, 40]]); c.fill(); c.stroke(); pth(c, [[29, 40], [71, 40], [71, 20], [63, 20], [63, 27], [55, 27], [55, 20], [45, 20], [45, 27], [37, 27], [37, 20], [29, 20]]); c.fill(); c.stroke(); c.beginPath(); c.moveTo(36, 50); c.lineTo(64, 50); c.stroke(); }
    else if (t === N) {
      pth(c, [[30, 76], [70, 76], [66, 56], [64, 40], [62, 28], [54, 18], [48, 10], [44, 18], [34, 26], [24, 42], [26, 50], [34, 52], [42, 46], [46, 50], [36, 62]]); c.fill(); c.stroke();
      c.fillStyle = line; c.beginPath(); c.arc(45, 28, 2.6, 0, TAU); c.fill(); c.beginPath(); c.arc(29, 45, 1.6, 0, TAU); c.fill();
      c.strokeStyle = hi; c.lineWidth = 2; c.beginPath(); c.moveTo(56, 22); c.quadraticCurveTo(64, 40, 62, 66); c.stroke();
    } else if (t === B) {
      pth(c, [[36, 76], [64, 76], [56, 56], [44, 56]]); c.fill(); c.stroke(); c.beginPath(); c.ellipse(50, 56, 13, 4, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(50, 16); c.bezierCurveTo(66, 28, 66, 46, 58, 53); c.lineTo(42, 53); c.bezierCurveTo(34, 46, 34, 28, 50, 16); c.fill(); c.stroke();
      c.beginPath(); c.arc(50, 13, 4.5, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.moveTo(51, 28); c.lineTo(58, 38); c.stroke();
    } else if (t === Q || t === K) {
      pth(c, [[32, 76], [68, 76], [58, 46], [42, 46]]); c.fill(); c.stroke(); c.beginPath(); c.ellipse(50, 46, 17, 5, 0, 0, TAU); c.fill(); c.stroke();
      if (t === Q) {
        pth(c, [[33, 44], [67, 44], [74, 18], [61, 34], [57, 12], [50, 30], [43, 12], [39, 34], [26, 18]]); c.fill(); c.stroke();
        for (const [x, y] of [[26, 17], [43, 11], [57, 11], [74, 17]]) { c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill(); c.stroke(); }
      } else {
        c.beginPath(); c.moveTo(33, 44); c.bezierCurveTo(28, 26, 44, 24, 50, 30); c.bezierCurveTo(56, 24, 72, 26, 67, 44); c.closePath(); c.fill(); c.stroke();
        c.lineWidth = 4; c.beginPath(); c.moveTo(50, 8); c.lineTo(50, 28); c.moveTo(42, 15); c.lineTo(58, 15); c.stroke();
      }
    }
  }
  function grotSet(c, t, black) { // the "Robot" set: tin robots, robot horses on wheels, dish bishops, launch towers, robot queen, mainframe king
    const body = black ? '#2c2e36' : '#dfe4ea', bodyL = black ? '#5c606c' : '#ffffff', bodyD = black ? '#16171c' : '#9aa4b0';
    const trim = black ? '#d01818' : '#d4a000', trimL = black ? '#ff6a5a' : '#ffe680', lamp = black ? '#ff3a2a' : '#3ad0ff';
    const metal = (x0, x1) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, bodyL); g.addColorStop(0.45, body); g.addColorStop(1, bodyD); return g; };
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#000'; c.lineWidth = 3;
    const rb = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    const bolt = (x, y, r) => { c.fillStyle = trim; c.beginPath(); c.arc(x, y, r || 2.2, 0, TAU); c.fill(); c.lineWidth = 1.2; c.stroke(); c.lineWidth = 3; };
    const glow = (x, y, r) => { const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, 0.5, x, y, r); g.addColorStop(0, '#fff'); g.addColorStop(0.45, lamp); g.addColorStop(1, black ? '#7a0a00' : '#0a5a8a'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.lineWidth = 1.5; c.stroke(); c.lineWidth = 3; };
    const antenna = (x, y0, y1, r) => { c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.lineWidth = 3; glow(x, y1 - r * 0.6, r); };
    // plinth in the side colour
    c.fillStyle = black ? '#151518' : '#fbf6e8'; c.beginPath(); c.ellipse(50, 84, 30, 8, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = trim; c.beginPath(); c.ellipse(50, 80, 30, 7, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = black ? '#2a2a2e' : '#fbf6e8'; c.beginPath(); c.ellipse(50, 77, 27, 6, 0, 0, TAU); c.fill(); c.stroke();
    if (t === P) { // a little tin robot
      c.fillStyle = metal(36, 64); pth(c, [[37, 76], [63, 76], [60, 56], [40, 56]]); c.fill(); c.stroke();
      c.fillStyle = trim; c.fillRect(42, 63, 16, 5); c.lineWidth = 1.5; c.strokeRect(42, 63, 16, 5); c.lineWidth = 3;
      c.fillStyle = bodyD; c.fillRect(46, 52, 8, 5); c.strokeRect(46, 52, 8, 5);
      antenna(50, 34, 24, 3.6);
      c.fillStyle = metal(37, 63); rb(37, 33, 26, 21, 5); c.fill(); c.stroke();
      glow(44, 42, 4); glow(56, 42, 4);
      c.fillStyle = '#111'; c.fillRect(44, 48.5, 12, 2.5);
    } else if (t === N) { // a robot horse on wheels
      for (const x of [36, 64]) { c.fillStyle = '#222'; c.beginPath(); c.arc(x, 70, 7, 0, TAU); c.fill(); c.stroke(); c.fillStyle = trim; c.beginPath(); c.arc(x, 70, 3, 0, TAU); c.fill(); c.lineWidth = 1.5; c.stroke(); c.lineWidth = 3; }
      c.fillStyle = metal(28, 72); pth(c, [[32, 66], [68, 66], [66, 50], [64, 36], [60, 24], [52, 14], [46, 10], [43, 18], [32, 26], [22, 40], [23, 49], [33, 51], [42, 45], [44, 50], [36, 60]]); c.fill(); c.stroke();
      // mane: a row of metal fins
      c.fillStyle = trim; for (let i = 0; i < 5; i++) { const x = 55 + i * 2.6, y = 18 + i * 8; pth(c, [[x, y], [x + 8, y + 1], [x + 3, y + 7]]); c.fill(); c.lineWidth = 1.5; c.stroke(); c.lineWidth = 3; }
      // visor eye, nostril vent, ear and jaw plate
      c.fillStyle = '#111'; rb(34, 24, 15, 7, 3); c.fill(); glow(42, 27.5, 3.2);
      c.fillStyle = bodyD; c.fillRect(25, 42, 5, 3); pth(c, [[47, 10], [50, 1], [54, 13]]); c.fillStyle = metal(46, 55); c.fill(); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(24, 46); c.lineTo(34, 47); c.stroke(); c.lineWidth = 3;
      bolt(36, 38); bolt(56, 58); bolt(48, 58);
    } else if (t === B) { // a satellite dish
      c.fillStyle = metal(40, 60); pth(c, [[38, 76], [62, 76], [55, 50], [45, 50]]); c.fill(); c.stroke();
      c.fillStyle = trim; c.fillRect(41, 66, 18, 4); c.lineWidth = 1.5; c.strokeRect(41, 66, 18, 4); c.lineWidth = 3;
      c.fillStyle = bodyD; c.fillRect(47, 40, 6, 12); c.strokeRect(47, 40, 6, 12);
      c.save(); c.translate(50, 30); c.rotate(-0.45);
      const dg = c.createLinearGradient(-24, -10, 20, 14); dg.addColorStop(0, bodyL); dg.addColorStop(0.5, body); dg.addColorStop(1, bodyD);
      c.fillStyle = dg; c.beginPath(); c.moveTo(-25, -4); c.quadraticCurveTo(0, 26, 25, -4); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = black ? '#40434c' : '#f4f6fa'; c.beginPath(); c.ellipse(0, -4, 25, 5, 0, 0, TAU); c.fill(); c.stroke();
      c.lineWidth = 2.2; c.beginPath(); c.moveTo(-14, -3); c.lineTo(0, -24); c.lineTo(14, -3); c.stroke(); c.lineWidth = 3;
      glow(0, -26, 3.6); c.restore();
    } else if (t === R) { // a rocket launch tower
      c.fillStyle = '#eee'; c.beginPath(); c.moveTo(50, 6); c.quadraticCurveTo(58, 14, 57, 30); c.lineTo(43, 30); c.quadraticCurveTo(42, 14, 50, 6); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#e10600'; c.beginPath(); c.moveTo(50, 6); c.quadraticCurveTo(54.5, 10, 55.6, 16); c.lineTo(44.4, 16); c.quadraticCurveTo(45.5, 10, 50, 6); c.closePath(); c.fill(); c.lineWidth = 1.5; c.stroke(); c.lineWidth = 3;
      c.fillStyle = metal(32, 68); pth(c, [[32, 76], [68, 76], [65, 30], [35, 30]]); c.fill(); c.stroke();
      c.strokeStyle = black ? '#8a8e9a' : '#6a7480'; c.lineWidth = 2;
      for (let y = 30; y < 74; y += 11) { c.beginPath(); c.moveTo(35.5 - (y - 30) * 0.07, y); c.lineTo(64.5 + (y - 30) * 0.07, y + 11); c.moveTo(64.5 + (y - 30) * 0.07, y); c.lineTo(35.5 - (y - 30) * 0.07, y + 11); c.moveTo(35, y); c.lineTo(65, y); c.stroke(); }
      c.strokeStyle = '#000'; c.lineWidth = 3;
      c.fillStyle = trim; pth(c, [[29, 32], [71, 32], [71, 20], [64, 20], [64, 26], [57, 26], [57, 22], [43, 22], [43, 26], [36, 26], [36, 20], [29, 20]]); c.fill(); c.stroke();
      c.fillStyle = trimL; c.fillRect(31, 21.5, 3, 9);
      glow(67, 15, 3);
    } else if (t === Q) { // the robot queen
      c.fillStyle = metal(30, 70); pth(c, [[31, 76], [69, 76], [60, 52], [40, 52]]); c.fill(); c.stroke();
      c.fillStyle = trim; c.beginPath(); c.moveTo(36, 66); c.quadraticCurveTo(50, 72, 64, 66); c.lineTo(65, 70); c.quadraticCurveTo(50, 76, 35, 70); c.closePath(); c.fill(); c.lineWidth = 1.5; c.stroke(); c.lineWidth = 3;
      c.fillStyle = lamp; c.beginPath(); c.moveTo(50, 64); c.bezierCurveTo(44, 59, 45, 55, 50, 57.5); c.bezierCurveTo(55, 55, 56, 59, 50, 64); c.fill(); c.lineWidth = 1.5; c.stroke(); c.lineWidth = 3;
      c.fillStyle = metal(38, 62); c.beginPath(); c.ellipse(50, 50, 12, 4, 0, 0, TAU); c.fill(); c.stroke();
      for (const [x, y] of [[38, 12], [50, 6], [62, 12]]) { c.lineWidth = 2.5; c.beginPath(); c.moveTo(50 + (x - 50) * 0.3, 30); c.lineTo(x, y + 3); c.stroke(); c.lineWidth = 3; glow(x, y + 2, 3.4); }
      c.fillStyle = metal(36, 64); c.beginPath(); c.arc(50, 37, 14, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = trim; c.beginPath(); c.moveTo(37, 31); c.quadraticCurveTo(50, 22, 63, 31); c.lineTo(62, 34); c.quadraticCurveTo(50, 27, 38, 34); c.closePath(); c.fill(); c.lineWidth = 1.5; c.stroke(); c.lineWidth = 3;
      glow(44, 38, 3.8); glow(56, 38, 3.8);
      c.lineWidth = 1.5; for (const sx of [-1, 1]) { c.beginPath(); for (let i = -1; i <= 1; i++) { c.moveTo(50 + sx * 6 + i * 2.5, 33.5); c.lineTo(50 + sx * 6 + i * 3.5, 31); } c.stroke(); }
      c.beginPath(); c.arc(50, 43, 4, 0.3, Math.PI - 0.3); c.stroke(); c.lineWidth = 3;
    } else if (t === K) { // the mainframe king: a tape-reel computer cabinet with a crown
      c.fillStyle = metal(28, 72); rb(29, 30, 42, 46, 3); c.fill(); c.stroke();
      c.fillStyle = black ? '#111' : '#5a6470'; c.fillRect(33, 34, 34, 18); c.lineWidth = 1.5; c.strokeRect(33, 34, 34, 18);
      for (const x of [41, 59]) { c.fillStyle = body; c.beginPath(); c.arc(x, 43, 7, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#222'; c.beginPath(); c.arc(x, 43, 4.5, 0, TAU); c.fill(); c.fillStyle = body; c.beginPath(); c.arc(x, 43, 1.6, 0, TAU); c.fill(); }
      const L = ['#e10600', '#ffd400', '#1aa31a', lamp]; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { c.fillStyle = L[(i + j * 2) % 4]; c.fillRect(35 + i * 6, 57 + j * 5, 3.5, 3); }
      c.fillStyle = '#111'; for (let y = 68; y < 74; y += 2.5) c.fillRect(35, y, 30, 1.2);
      c.lineWidth = 3;
      c.fillStyle = trim; pth(c, [[31, 31], [69, 31], [72, 14], [62, 22], [56, 8], [50, 18], [44, 8], [38, 22], [28, 14]]); c.fill(); c.stroke();
      c.fillStyle = trimL; c.fillRect(33, 24, 3, 5);
      for (const [x, y] of [[28, 13], [44, 7], [56, 7], [72, 13]]) glow(x, y, 2.8);
      c.lineWidth = 3.5; c.beginPath(); c.moveTo(50, 17); c.lineTo(50, 3); c.moveTo(45, 8); c.lineTo(55, 8); c.stroke(); c.lineWidth = 3;
    }
    c.lineCap = 'butt';
  }
  const sprites = new Map();
  function sprite(set, p, px) {
    const key = set + p + ':' + px; let cv = sprites.get(key); if (cv) return cv;
    if (sprites.size > 120) sprites.clear();
    cv = document.createElement('canvas'); cv.width = cv.height = px;
    const c = cv.getContext('2d'); c.scale(px / 100, px / 100);
    c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowOffsetX = px / 60; c.shadowOffsetY = px / 50; c.shadowBlur = 0;
    (set === 'grot' ? grotSet : classic)(c, p & 7, !!(p & 8));
    sprites.set(key, cv); return cv;
  }
  const BOARDS = { wood: ['#ecd3a4', '#a8703f', '#5a3410'], swamp: ['#d6e0a8', '#5d8c3a', '#20401a'], grey: ['#e0e0e0', '#8a8a9a', '#303040'] };

  const TAUNTS = {
    start: ['Deep Jack is ready. Deep Jack is ALWAYS ready.', 'I have calculated 32,768 moves. In my head. Which is mostly teef.', 'You can go first. Deep Jack is a gentleman.', 'Like a peapod racer on the start line, Deep Jack revs his engines. VRRRM.'],
    capture: ['Mine now. Finders keepers.', 'Om nom nom.', 'That piece looked lonely.', 'Gubbinz will want that back. He can\'t have it.'],
    lost: ['Oi! I was using that!', 'That was a TACTICAL sacrifice. Obviously.', 'Lucky. Very lucky.', 'Hmph. Deep Jack saw that coming. (He did not.)'],
    check: ['Check! Your king looks nervous.', 'Knock knock. Check.', 'Check. Nowhere to hide in this sector, pilot.'],
    checked: ['Ow. Rude.', 'That is not very sporting.', 'I will move, but I won\'t like it.'],
    think: ['Hmmmm...', 'Calculating...', 'Thinking very hard...', 'Consulting the Magic 8-Ball...', 'Using the force... of MATHS.'],
    win: ['CHECKMATE! Deep Jack is the champion of the galaxy!', 'Mate! Back to the hangar with you.'],
    lose: ['NOOO! Deep Jack will be back. In a sequel.', 'You win. Deep Jack is going to have a little lie down.'],
    draw: ['A draw. Nobody wins. Everybody gets a jelly baby.'],
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // the engine and the piece art, shared with the JackNet Gaming Zone's online chess tables (zone-games.js)
  JG.chessKit = { parseFEN, START, legal, make, inCheck, evaluate, orderScore, Searcher, ABORT, MATE, san, deadPosition, posKey, sprite, BOARDS, sqName, nameSq, coord, BOOK, LETTER, VAL };

  // ================================================================ the game window
  JG.mod('chess', G => {
    JG.css('chess', `
.gch{position:absolute;inset:0;display:flex;background:var(--face)}
.gch.col{flex-direction:column}
.gch-board{position:relative;flex:1;min-width:0;min-height:0}
.gch-side{flex:none;width:168px;display:flex;flex-direction:column;gap:6px;padding:6px 6px 6px 0;box-sizing:border-box;min-height:0}
.gch.col .gch-side{width:auto;flex:1;min-height:132px;padding:0 6px 6px;flex-direction:row}
.gch-who{display:flex;gap:6px;align-items:flex-start}
.gch.col .gch-who{width:46%;flex-direction:column}
.gch-who svg{width:34px;height:34px;flex:none}
.gch-say{position:relative;background:#ffffe1;border:1px solid #000;padding:4px 6px;font:11px/1.3 var(--ui);min-height:30px;flex:1;border-radius:6px}
.gch.col .gch-say{min-height:0;width:100%;box-sizing:border-box;flex:none}
.gch-right{display:flex;flex-direction:column;gap:6px;flex:1;min-height:0;min-width:0}
.gch-info{font:11px var(--ui)}
.gch-moves{flex:1;min-height:40px;overflow:auto;padding:2px 4px;font:12px "Courier New",monospace;line-height:1.35}
.gch-moves .mv{display:flex}
.gch-moves .mv b{width:28px;color:#666;font-weight:normal}
.gch-moves .mv span{width:58px}
.gch-moves .last{background:#000080;color:#fff}
.gch-btns{display:flex;gap:4px}
.gch-btns .btn{flex:1;padding:3px 4px;min-width:0}
.gch-promo{display:flex;gap:6px;justify-content:center;margin:8px 0}
.gch-promo button{width:62px;height:66px;padding:2px;display:flex;flex-direction:column;align-items:center;font:11px var(--ui)}
.gch-promo img{width:44px;height:44px}
`);
    const host = G.host, w = G.w;
    if (innerWidth >= 700 && innerHeight >= 560) { w.el.style.width = '620px'; w.el.style.height = '520px'; }
    G.fit();
    let opts = Object.assign({ level: 1, human: 0, set: 'grot', board: 'wood', hints: true, flip: false, sound: true }, G.store.get('opts', {}));
    const saveOpts = () => G.store.set('opts', opts);
    const LEVELS = ['Easy', 'Normal', 'Hard'];
    const root = document.createElement('div'); root.className = 'gch';
    root.innerHTML = `<div class="gch-board"></div><div class="gch-side"><div class="gch-who"><svg viewBox="0 0 32 32"><defs><linearGradient id="gchdj" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#c8d0da"/><stop offset="1" stop-color="#6a7686"/></linearGradient></defs><path d="M16 6V2" stroke="#000" stroke-width="1.2"/><circle cx="16" cy="2" r="1.8" fill="#ff3a2a" stroke="#000" stroke-width=".7"/><rect x="1.5" y="12" width="3.5" height="8" rx="1" fill="#d4a000" stroke="#000" stroke-width=".8"/><rect x="27" y="12" width="3.5" height="8" rx="1" fill="#d4a000" stroke="#000" stroke-width=".8"/><rect x="4.5" y="6" width="23" height="22" rx="4" fill="url(#gchdj)" stroke="#000"/><rect x="7.5" y="9" width="17" height="12" rx="2" fill="#0a1a10" stroke="#000" stroke-width=".8"/><rect x="10" y="12" width="4" height="4" fill="#3aff6a"/><rect x="18" y="12" width="4" height="4" fill="#3aff6a"/><rect x="10" y="12" width="1.5" height="1.5" fill="#d0ffd8"/><rect x="18" y="12" width="1.5" height="1.5" fill="#d0ffd8"/><path d="M11 18.5h10" stroke="#3aff6a" stroke-width="1"/><rect x="9" y="23" width="14" height="3" rx="1" fill="#2a2e34"/><path d="M12 23v3M15 23v3M18 23v3M21 23v3" stroke="#9aa2ac" stroke-width=".7"/><rect x="6" y="7.5" width="2" height="10" rx="1" fill="#fff" opacity=".7"/></svg><div class="gch-say"></div></div><div class="gch-right"><div class="gch-info"></div><div class="gch-moves field"></div><div class="gch-btns"><button class="btn" data-a="undo" type="button">Undo</button><button class="btn" data-a="hint" type="button">Hint</button><button class="btn" data-a="new" type="button">New</button></div></div></div>`;
    host.appendChild(root);
    const boardEl = root.querySelector('.gch-board'), sayEl = root.querySelector('.gch-say'), infoEl = root.querySelector('.gch-info'), movesEl = root.querySelector('.gch-moves');
    const C = G.canvas(boardEl, () => draw());
    const cv = C.cv, ctx = C.c; G.focusEl = cv;
    const relayout = () => {
      const r = DesktopSurface.rect(host); const right = Math.min(r.width - 168, r.height), below = Math.min(r.width, r.height - 138), col = below > right * 1.12;
      root.classList.toggle('col', col);
      boardEl.style.flex = col ? 'none' : ''; boardEl.style.height = col ? Math.max(120, Math.min(r.width + 16, r.height - 138)) + 'px' : '';
    };
    if (window.ResizeObserver) { const ro = new ResizeObserver(relayout); ro.observe(host); G.onClose(() => ro.disconnect()); }
    relayout();

    let st = null; // { states:[], moves:[{m, san, coord}], keys:[], over:'' }
    let sel = -1, targets = [], drag = null, anim = null, thinking = 0, hintMv = null, cursor = -1, lastMove = null;
    const cur = () => st.states[st.states.length - 1];
    function say(t) { sayEl.textContent = t; }
    function newGame() {
      thinking++; // cancels a search in progress
      st = { states: [parseFEN(START)], moves: [], keys: [], over: '' };
      st.keys.push(posKey(cur()));
      sel = -1; targets = []; hintMv = null; lastMove = null; anim = null;
      if (saver) saver.clear(); // a new game: the old saved one goes
      say(pick(TAUNTS.start)); refresh();
      if (cur().side !== opts.human) G.timeout(computer, 500);
    }
    G.newGame = newGame;
    const flipped = () => opts.flip !== (opts.human === 1);
    // ------------------------------------------------------------ geometry
    function geo() {
      const W = C.W, H = C.H, lab = Math.min(W, H) > 300 ? 16 : 12;
      const sz = Math.max(8, Math.floor((Math.min(W, H) - lab * 2 - 6) / 8));
      const ox = Math.floor((W - sz * 8) / 2), oy = Math.floor((H - sz * 8) / 2);
      return { sz, ox, oy, lab };
    }
    const sqXY = (sq, g) => { let r = sq >> 3, f = sq & 7; if (flipped()) { r = 7 - r; f = 7 - f; } return [g.ox + f * g.sz, g.oy + r * g.sz]; };
    const xySq = (x, y, g) => { let f = Math.floor((x - g.ox) / g.sz), r = Math.floor((y - g.oy) / g.sz); if (f < 0 || f > 7 || r < 0 || r > 7) return -1; if (flipped()) { r = 7 - r; f = 7 - f; } return r * 8 + f; };
    // ------------------------------------------------------------ drawing
    function draw() {
      if (!st || !C.W) return;
      const g = geo(), { sz, ox, oy } = g, s = cur(), cols = BOARDS[opts.board] || BOARDS.wood, dpr = C.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0, 0, C.W, C.H);
      // bevelled frame
      ctx.fillStyle = cols[2]; ctx.fillRect(ox - 6, oy - 6, sz * 8 + 12, sz * 8 + 12);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox - 6.5, oy + sz * 8 + 6.5); ctx.lineTo(ox - 6.5, oy - 6.5); ctx.lineTo(ox + sz * 8 + 6.5, oy - 6.5); ctx.stroke();
      ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.moveTo(ox + sz * 8 + 6.5, oy - 6.5); ctx.lineTo(ox + sz * 8 + 6.5, oy + sz * 8 + 6.5); ctx.lineTo(ox - 6.5, oy + sz * 8 + 6.5); ctx.stroke();
      for (let sq = 0; sq < 64; sq++) { const [x, y] = sqXY(sq, g); ctx.fillStyle = ((sq >> 3) + (sq & 7)) & 1 ? cols[1] : cols[0]; ctx.fillRect(x, y, sz, sz); }
      // labels
      ctx.fillStyle = '#000'; ctx.font = `${Math.max(9, Math.min(12, sz / 4))}px Tahoma, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < 8; i++) {
        ctx.fillText('abcdefgh'[flipped() ? 7 - i : i], ox + i * sz + sz / 2, oy + sz * 8 + g.lab / 2 + 5);
        ctx.fillText(String(flipped() ? i + 1 : 8 - i), ox - g.lab / 2 - 5, oy + i * sz + sz / 2);
      }
      // highlights
      const hl = (sq, col) => { const [x, y] = sqXY(sq, g); ctx.fillStyle = col; ctx.fillRect(x, y, sz, sz); };
      if (lastMove) { hl(lastMove.f, 'rgba(255,230,0,.38)'); hl(lastMove.t, 'rgba(255,230,0,.38)'); }
      if (hintMv) { hl(hintMv.f, 'rgba(0,120,255,.45)'); hl(hintMv.t, 'rgba(0,120,255,.45)'); }
      if (inCheck(s)) { const [x, y] = sqXY(s.k[s.side], g); const rg = ctx.createRadialGradient(x + sz / 2, y + sz / 2, 2, x + sz / 2, y + sz / 2, sz * 0.7); rg.addColorStop(0, 'rgba(255,0,0,.9)'); rg.addColorStop(1, 'rgba(255,0,0,0)'); ctx.fillStyle = rg; ctx.fillRect(x, y, sz, sz); }
      if (sel >= 0) hl(sel, 'rgba(40,200,40,.5)');
      // pieces
      const px = Math.round(sz * dpr);
      for (let sq = 0; sq < 64; sq++) {
        const p = s.b[sq]; if (!p) continue;
        if (drag && drag.live && drag.from === sq) continue;
        if (anim && anim.m.t === sq) continue;
        const [x, y] = sqXY(sq, g); ctx.drawImage(sprite(opts.set, p, px), x, y, sz, sz);
      }
      if (anim) {
        const k = Math.min(1, (performance.now() - anim.t0) / anim.dur), e = 1 - Math.pow(1 - k, 3);
        const [x0, y0] = sqXY(anim.m.f, g), [x1, y1] = sqXY(anim.m.t, g);
        ctx.drawImage(sprite(opts.set, s.b[anim.m.t], px), x0 + (x1 - x0) * e, y0 + (y1 - y0) * e, sz, sz);
      }
      // move targets
      if (opts.hints && sel >= 0) for (const m of targets) {
        const [x, y] = sqXY(m.t, g);
        ctx.fillStyle = 'rgba(0,0,0,.28)';
        if (s.b[m.t] || m.fl === 2) { ctx.lineWidth = Math.max(2, sz / 12); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(x + sz / 2, y + sz / 2, sz * 0.44, 0, TAU); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(x + sz / 2, y + sz / 2, sz * 0.14, 0, TAU); ctx.fill(); }
      }
      if (cursor >= 0) { const [x, y] = sqXY(cursor, g); ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, sz - 4, sz - 4); ctx.strokeStyle = '#fff'; ctx.lineDashOffset = 3; ctx.strokeRect(x + 2, y + 2, sz - 4, sz - 4); ctx.restore(); }
      if (drag && drag.live) ctx.drawImage(sprite(opts.set, s.b[drag.from], Math.round(sz * 1.15 * dpr)), drag.x - sz * 0.575, drag.y - sz * 0.7, sz * 1.15, sz * 1.15);
    }
    function animate(m) {
      anim = { m, t0: performance.now(), dur: 170 };
      G.loop(() => { draw(); if (performance.now() - anim.t0 >= anim.dur) { anim = null; G.stopLoop(); draw(); } });
    }
    // ------------------------------------------------------------ status, move list
    function refresh() {
      const s = cur();
      const who = s.side === 0 ? 'White' : 'Black', you = s.side === opts.human;
      let t = st.over || (thinking > 0 && !you && st.thinkingNow ? 'Deep Jack is thinking...' : `${who} to move${you ? ' (you)' : ''}`);
      if (!st.over && inCheck(s)) t += ' - CHECK!';
      G.status(t);
      infoEl.innerHTML = `You: <b>${opts.human ? 'Black' : 'White'}</b> &nbsp;Level: <b>${LEVELS[opts.level]}</b>`;
      let html = '';
      for (let i = 0; i < st.moves.length; i += 2) html += `<div class="mv"><b>${i / 2 + 1}.</b><span${i === st.moves.length - 1 ? ' class="last"' : ''}>${st.moves[i].san}</span><span${i + 1 === st.moves.length - 1 ? ' class="last"' : ''}>${st.moves[i + 1] ? st.moves[i + 1].san : ''}</span></div>`;
      movesEl.innerHTML = html || '<div style="color:#666;font:11px var(--ui)">No moves yet.</div>';
      movesEl.scrollTop = movesEl.scrollHeight;
      root.querySelector('[data-a=undo]').disabled = !st.moves.length;
      root.querySelector('[data-a=hint]').disabled = !!st.over || s.side !== opts.human;
      draw();
    }
    // ------------------------------------------------------------ making moves
    function play(m, byHuman) {
      const s = cur(), ms = legal(s), mm = ms.find(x => x.f === m.f && x.t === m.t && x.pr === m.pr) || m;
      const text = san(s, mm, ms), n = mm.n || make(s, mm);
      st.states.push(n); st.moves.push({ m: mm, san: text, coord: coord(mm) }); st.keys.push(posKey(n));
      lastMove = mm; sel = -1; targets = []; hintMv = null;
      G.sfx(mm.c ? 'thud' : 'click');
      if (byHuman) {
        if (mm.fl === 3) G.secret('games.chess.castle');
        if (mm.pr && mm.pr !== Q) G.secret('games.chess.knight');
        if (mm.c && Math.random() < 0.6) say(pick(TAUNTS.lost));
        if (inCheck(n)) say(pick(TAUNTS.checked));
      } else {
        if (inCheck(n)) { say(pick(TAUNTS.check)); G.sfx('uhoh'); } else if (mm.c && Math.random() < 0.7) say(pick(TAUNTS.capture));
        else if (TAUNTS.think.includes(sayEl.textContent)) say(pick(['Your move.', 'Your turn, pilot.', 'Go on then.', 'Deep Jack is waiting...']));
      }
      animate(mm);
      checkEnd();
      saver.save();
      refresh();
      if (!st.over && n.side !== opts.human) G.timeout(computer, 250);
    }
    function checkEnd() {
      const s = cur(), ms = legal(s);
      let res = '', winner = -1;
      if (!ms.length) { if (inCheck(s)) { winner = 1 - s.side; res = `Checkmate! ${winner === 0 ? 'White' : 'Black'} wins.`; } else res = 'Stalemate. It\'s a draw.'; }
      else if (s.half >= 100) res = 'Draw by the 50-move rule.';
      else if (st.keys.filter(k => k === st.keys[st.keys.length - 1]).length >= 3) res = 'Draw by threefold repetition.';
      else if (deadPosition(s.b)) res = 'Draw: nobody has enough pieces left to checkmate.';
      if (!res) return;
      st.over = res;
      const stats = G.store.get('stats', {}), k = LEVELS[opts.level], e = stats[k] = stats[k] || { w: 0, l: 0, d: 0 };
      if (winner === opts.human) { e.w++; say(pick(TAUNTS.lose)); G.secret('games.chess.mate'); G.sfx('solve'); }
      else if (winner >= 0) { e.l++; say(pick(TAUNTS.win)); G.sfx('uhoh'); }
      else { e.d++; say(pick(TAUNTS.draw)); }
      G.store.set('stats', stats);
      G.timeout(() => G.msg('Jack Chess', res + (winner === opts.human ? '\n\nYou beat Deep Jack! He is pretending he let you win.' : winner >= 0 ? '\n\nDeep Jack wins this time. Game > New Game for a rematch.' : ''), winner === opts.human ? 'info' : 'info'), 500);
    }
    function computer() {
      if (!st || st.over || cur().side === opts.human) return;
      const token = ++thinking, s = cur();
      st.thinkingNow = true; refresh();
      if (Math.random() < 0.3) say(pick(TAUNTS.think));
      const t0 = performance.now(), ms = legal(s);
      const finish = m => { if (token !== thinking || G.closed) return; st.thinkingNow = false; const wait = Math.max(0, 450 - (performance.now() - t0)); G.timeout(() => { if (token === thinking) play(m, false); }, wait); };
      // opening book
      const hist = st.moves.map(x => x.coord).join(' ');
      const lines = BOOK.filter(l => l.length > st.moves.length && l.slice(0, st.moves.length).join(' ') === hist);
      if (lines.length && opts.level > 0) { const want = pick(lines)[st.moves.length], bm = ms.find(m => coord(m) === want); if (bm) return finish(bm); }
      const maxD = [1, 2, 4][opts.level], noise = opts.level === 0 ? 140 : 0, budget = [300, 900, 1600][opts.level];
      const deadline = t0 + budget;
      let best = ms.slice().sort((a, b) => orderScore(b) - orderScore(a))[0], d = 1;
      const step = () => {
        if (token !== thinking || G.closed) return;
        const se = Searcher(d === 1 ? Infinity : Math.min(deadline, performance.now() + 380));
        try {
          const order = ms.slice().sort((a, b) => (b === best) - (a === best) || orderScore(b) - orderScore(a));
          const b2 = se.root(s, d, order, noise);
          if (b2) best = b2;
        } catch (e) { if (e !== ABORT) throw e; return finish(best); }
        if (d < maxD && performance.now() < deadline) { d++; G.timeout(step, 0); } else finish(opts.level === 0 && Math.random() < 0.15 ? pick(ms) : best);
      };
      G.timeout(step, 20);
    }
    function undo() {
      if (!st.moves.length) return;
      thinking++; st.thinkingNow = false; st.over = '';
      do { st.states.pop(); st.moves.pop(); st.keys.pop(); } while (st.moves.length && cur().side !== opts.human);
      saver.save();
      if (cur().side !== opts.human) { refresh(); return G.timeout(computer, 300); }
      const lm = st.moves[st.moves.length - 1]; lastMove = lm ? lm.m : null; sel = -1; targets = []; hintMv = null; anim = null;
      say('Undo? Deep Jack never needs undo. (Deep Jack has used undo.)'); refresh();
    }
    function hint() {
      const s = cur(); if (st.over || s.side !== opts.human) return;
      const ms = legal(s), se = Searcher(performance.now() + 500);
      let best = null;
      try { best = se.root(s, 2, ms.sort((a, b) => orderScore(b) - orderScore(a)), 0); } catch (e) { if (e !== ABORT) throw e; }
      hintMv = best || ms[0]; say('Psst... try the blue squares. (Deep Jack didn\'t tell you that.)'); draw();
      G.timeout(() => { hintMv = null; draw(); }, 2500);
    }
    // ------------------------------------------------------------ input
    function choosePromo(m, cb) {
      const p = s => sprite(opts.set, s | (opts.human ? 8 : 0), 88).toDataURL();
      const d = G.dialog('Promote Pawn', `<div>Your pawn made it to the end! Choose a piece:</div><div class="gch-promo">${[[Q, 'Queen'], [R, 'Rook'], [B, 'Bishop'], [N, 'Knight']].map(([t, n]) => `<button type="button" class="btn" data-t="${t}"><img src="${p(t)}" alt="">${n}</button>`).join('')}</div>`, [['Cancel']], { w: 320 });
      d.f.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { d.w.close(); cb(+b.dataset.t); }));
    }
    function tryMove(from, to) {
      const ms = targets.filter(m => m.f === from && m.t === to);
      if (!ms.length) return false;
      if (ms[0].pr) choosePromo(ms[0], pr => { if (cur().side === opts.human && !st.over) play(ms.find(x => x.pr === pr), true); });
      else play(ms[0], true);
      return true;
    }
    function selectSq(sq) {
      const s = cur(); sel = sq; targets = legal(s).filter(m => m.f === sq);
      if (!targets.length && !opts.hints) { /* fine */ }
    }
    function tapSq(sq) {
      const s = cur();
      if (st.over || s.side !== opts.human || thinking && st.thinkingNow || anim) return;
      if (sq < 0) { sel = -1; draw(); return; }
      if (sel >= 0 && sel !== sq && tryMove(sel, sq)) return;
      const p = s.b[sq];
      if (p && (p >> 3) === s.side && sel !== sq) { selectSq(sq); G.sfx('click'); }
      else sel = -1;
      draw();
    }
    const pt = ev => { const r = DesktopSurface.rect(cv), point = DesktopSurface.point(ev.clientX, ev.clientY); return [point.x - r.left, point.y - r.top]; };
    G.on(cv, 'pointerdown', ev => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      ev.preventDefault(); G.focus(); cursor = -1;
      const [x, y] = pt(ev), g = geo(), sq = xySq(x, y, g), s = cur();
      if (sq >= 0 && s.b[sq] && (s.b[sq] >> 3) === s.side && s.side === opts.human && !st.over && !st.thinkingNow && !anim) {
        if (sel !== sq) selectSq(sq);
        drag = { from: sq, x, y, sx: x, sy: y, live: false, id: ev.pointerId };
        try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
        draw();
      } else tapSq(sq);
    });
    G.on(cv, 'pointermove', ev => { if (!drag || ev.pointerId !== drag.id) return; const [x, y] = pt(ev); drag.x = x; drag.y = y; if (!drag.live && Math.hypot(x - drag.sx, y - drag.sy) > 6) drag.live = true; if (drag.live) draw(); });
    const endDrag = (ev, cancel) => {
      if (!drag || ev.pointerId !== drag.id) return;
      const d = drag; drag = null;
      const [x, y] = pt(ev), sq = xySq(x, y, geo());
      if (d.live) { if (cancel || sq === d.from || sq < 0 || !tryMove(d.from, sq)) { draw(); } }
      draw();
    };
    G.on(cv, 'pointerup', ev => endDrag(ev, false)); G.on(cv, 'pointercancel', ev => endDrag(ev, true));
    G.on(cv, 'contextmenu', ev => { ev.preventDefault(); sel = -1; draw(); });
    G.keys = { down(ev) {
      const k = ev.key;
      if ((ev.ctrlKey || ev.metaKey) && (k === 'z' || k === 'Z')) { undo(); return true; }
      if (k === 'h' || k === 'H') { hint(); return true; }
      const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (arrows[k]) {
        if (cursor < 0) cursor = sel >= 0 ? sel : (opts.human ? 12 : 52);
        let [dr, df] = arrows[k]; if (flipped()) { dr = -dr; df = -df; }
        const r = Math.max(0, Math.min(7, (cursor >> 3) + dr)), f = Math.max(0, Math.min(7, (cursor & 7) + df)); cursor = r * 8 + f; draw(); return true;
      }
      if ((k === 'Enter' || k === ' ') && cursor >= 0) { tapSq(cursor); return true; }
      if (k === 'Escape') { sel = -1; cursor = -1; draw(); return true; }
      return false;
    } };
    root.querySelector('[data-a=undo]').addEventListener('click', () => { undo(); G.focus(); });
    root.querySelector('[data-a=hint]').addEventListener('click', () => { hint(); G.focus(); });
    root.querySelector('[data-a=new]').addEventListener('click', () => { confirmNew(); });
    function confirmNew() { if (st && st.moves.length && !st.over) G.msg('Jack Chess', 'Start a new game? Deep Jack will count this one as a win.', 'q', [['Yes', newGame], ['No']]); else newGame(); }
    // ------------------------------------------------------------ menus
    function statsDlg() {
      const stats = G.store.get('stats', {});
      const rows = LEVELS.map(l => { const e = stats[l] || { w: 0, l: 0, d: 0 }; return `<tr><td>${l}</td><td class="r">${e.w}</td><td class="r">${e.l}</td><td class="r">${e.d}</td></tr>`; }).join('');
      G.dialog('Statistics', `<table class="jghs"><tbody><tr><td><b>Level</b></td><td class="r"><b>Won</b></td><td class="r"><b>Lost</b></td><td class="r"><b>Drawn</b></td></tr>${rows}</tbody></table>`, [['OK'], ['Reset', () => { G.store.set('stats', {}); }]], { w: 300 });
    }
    const setOpt = (k, v, fresh) => { opts[k] = v; saveOpts(); if (fresh) newGame(); else refresh(); };
    G.helpKey = () => help();
    function help() {
      G.help([
        ['How to play', 'Click one of your pieces, then click the square you want it to go to. You can also drag pieces.\n\nThe little dots show where the selected piece can go. Rings show pieces you can capture.\n\nKeyboard: arrow keys move the dotted cursor, Enter picks up and puts down, Ctrl+Z undoes, H asks for a hint, F2 starts a new game.'],
        ['The rules', '- Checkmate the enemy king to win: attack it so it has no escape.\n- Castling: move the king two squares towards a rook; the rook jumps over. Not allowed out of, through or into check, or if either piece has moved.\n- En passant: a pawn that jumps two squares can be captured as if it only moved one, but only straight away.\n- A pawn that reaches the far side is promoted. You choose the piece.\n- Draws: stalemate, 50 moves with no capture or pawn move, the same position three times, or not enough pieces to mate.'],
        ['Deep Jack', 'Deep Jack is a chess computer built by Jack out of maths and leftover Rupees.\n\n- Easy: thinks one move ahead and sometimes gets distracted by a screen saver.\n- Normal: thinks two moves ahead.\n- Hard: thinks three moves ahead and checks every capture to the bitter end.\n\nHe knows a few openings off by heart, so he doesn\'t always play the same game.'],
        ['Piece sets', 'Robot set: pawns are little tin robots, knights are robot horses (wheels and all), bishops are satellite dishes, rooks are rocket launch towers, queens are robot queens and kings are giant mainframe computers.\n\nThe white side is shiny silver and the black side is black with red trim. Look at the base if you get confused.\n\nClassic set: the normal shapes, for grown-ups.'],
      ]);
    }
    G.menu([
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: confirmNew },
        { label: 'Undo Move', key: 'Ctrl+Z', dis: !st || !st.moves.length, act: undo },
        { label: 'Hint', key: 'H', dis: !st || !!st.over || cur().side !== opts.human, act: hint }, '-',
        { label: 'Play as White', rad: opts.human === 0, act: () => setOpt('human', 0, true) },
        { label: 'Play as Black', rad: opts.human === 1, act: () => setOpt('human', 1, true) },
        ...(window.MP ? ['-', { label: 'Play with someone... (online)', act: () => MP.pick('zone.chess') }] : []), '-',
        { label: 'Statistics...', act: statsDlg }, '-',
        { label: 'Exit', act: () => G.w.close() },
      ]],
      ['Options', () => [
        ...LEVELS.map((l, i) => ({ label: l, rad: opts.level === i, act: () => { setOpt('level', i); say(['Easy? Deep Jack will play with one eye shut.', 'Normal. A fair fight. (Deep Jack will still win.)', 'HARD MODE. Deep Jack has had three cans of Tangy.'][i]); } })), '-',
        { label: 'Robot Pieces', rad: opts.set === 'grot', act: () => setOpt('set', 'grot') },
        { label: 'Classic Pieces', rad: opts.set === 'classic', act: () => setOpt('set', 'classic') },
        { label: 'Board', sub: [['wood', 'Wood'], ['swamp', 'Swamp Green'], ['grey', 'Computer Grey']].map(([k, n]) => ({ label: n, rad: opts.board === k, act: () => setOpt('board', k) })) }, '-',
        { label: 'Show Legal Moves', chk: opts.hints, act: () => setOpt('hints', !opts.hints) },
        { label: 'Flip Board', chk: opts.flip, act: () => setOpt('flip', !opts.flip) },
      ]],
      ['Help', () => [
        { label: 'Help Topics', key: 'F1', act: help }, '-',
        { label: 'About Jack Chess', act: () => G.about({ ver: 'Version 2.0 (Deep Jack engine 0.3)', blurb: 'Chess versus Deep Jack, the second most powerful chess computer in the world. (The first one is in America and it\'s the size of a fridge.)', credits: [['Chess engine', 'Jack'], ['Opening book', 'Jack\'s Grandad'], ['Robot pieces', 'Jack (drawn in Paint first)'], ['Classic pieces', 'Jack (traced off the box)'], ['Taunts', 'Gubbinz'], ['Beta testing', 'Dave (lost 11 games)'], ['Moral support', Cast.t('Cousin {cousin}')], ['Biscuits', 'Mom'], ['Thinking time', 'Your 133 MHz processor']] }) },
      ]],
    ]);
    G.onClose(() => { thinking++; });
    G.dbg = () => ({ fen: cur(), moves: st.moves.map(m => m.san), over: st.over, thinking: !!st.thinkingNow, side: cur().side, human: opts.human, sel, targets: targets.map(m => sqName(m.t)) });
    G.dbgTap = n => tapSq(nameSq(n));
    G.dbgLoad = fen => { thinking++; st = { states: [parseFEN(fen)], moves: [], keys: [], over: '' }; st.keys.push(posKey(cur())); sel = -1; targets = []; lastMove = null; refresh(); };
    // the game in progress is saved (js/gamesave.js) as its list of moves (replayed from the start), with your side and level
    const saver = G.saver(() => (!st || st.over || !st.moves.length || st.states[0].full !== 1 || st.states[0].half !== 0) ? null
      : { mv: st.moves.map(x => [x.m.f, x.m.t, x.m.pr || 0]), human: opts.human, level: opts.level }, { v: 1 });
    function resume() {
      const s = saver.load(); if (!s || !Array.isArray(s.mv) || !s.mv.length || s.mv.length > 1200) return false;
      const n0 = { states: [parseFEN(START)], moves: [], keys: [], over: '' }; n0.keys.push(posKey(n0.states[0]));
      for (const [f, t, pr] of s.mv) {
        const p = n0.states[n0.states.length - 1], ms = legal(p), mm = ms.find(x => x.f === f && x.t === t && (x.pr || 0) === (pr || 0));
        if (!mm) return false;
        n0.moves.push({ m: mm, san: san(p, mm, ms), coord: coord(mm) }); n0.states.push(mm.n); n0.keys.push(posKey(mm.n));
      }
      if (s.human === 0 || s.human === 1) opts.human = s.human;
      if ([0, 1, 2].includes(s.level)) opts.level = s.level;
      saveOpts();
      thinking++; st = n0;
      const lm = st.moves[st.moves.length - 1]; lastMove = lm ? lm.m : null; sel = -1; targets = []; hintMv = null; anim = null;
      say('Right, where were we? Your move.'); refresh();
      if (cur().side !== opts.human) { say('Right, where were we?'); G.timeout(computer, 600); }
      return true;
    }
    if (!resume()) newGame();
  });
})();

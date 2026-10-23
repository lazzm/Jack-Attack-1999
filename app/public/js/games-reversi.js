/* Reversi for JackOS 98 (lazy loaded by apps-games.js). Black (you) against the computer on a green
 * felt board: three levels, legal-move hints, a Hint button, undo, passes, flip animations and stats. */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;
  const D8 = [-9, -8, -7, -1, 1, 7, 8, 9];
  const EMPTY = 0, BLACK = 1, WHITE = 2, opp = p => 3 - p;
  // square weights: corners good, the squares next to them bad, edges fair
  const WT = [
    120, -25, 20, 8, 8, 20, -25, 120,
    -25, -45, -4, -4, -4, -4, -45, -25,
    20, -4, 12, 3, 3, 12, -4, 20,
    8, -4, 3, 2, 2, 3, -4, 8,
    8, -4, 3, 2, 2, 3, -4, 8,
    20, -4, 12, 3, 3, 12, -4, 20,
    -25, -45, -4, -4, -4, -4, -45, -25,
    120, -25, 20, 8, 8, 20, -25, 120];
  function flipsFor(b, sq, p) {
    if (b[sq]) return null;
    const out = [], o = opp(p), r0 = sq >> 3, f0 = sq & 7;
    for (const d of D8) {
      const dr = d < -1 ? -1 : d > 1 ? 1 : 0, df = d - dr * 8;
      let r = r0 + dr, f = f0 + df; const run = [];
      while (r >= 0 && r < 8 && f >= 0 && f < 8 && b[r * 8 + f] === o) { run.push(r * 8 + f); r += dr; f += df; }
      if (run.length && r >= 0 && r < 8 && f >= 0 && f < 8 && b[r * 8 + f] === p) out.push(...run);
    }
    return out.length ? out : null;
  }
  function moves(b, p) { const out = []; for (let sq = 0; sq < 64; sq++) { const fl = flipsFor(b, sq, p); if (fl) out.push({ sq, fl }); } return out; }
  function apply(b, m, p) { const n = b.slice(); n[m.sq] = p; for (const s of m.fl) n[s] = p; return n; }
  const count = (b, p) => { let n = 0; for (let i = 0; i < 64; i++) if (b[i] === p) n++; return n; };
  function evalPos(b, p) {
    const o = opp(p); let sc = 0, empties = 0;
    for (let i = 0; i < 64; i++) { if (b[i] === p) sc += WT[i]; else if (b[i] === o) sc -= WT[i]; else empties++; }
    // corners taken make the next-door squares safe again
    for (const [c, xs] of [[0, [1, 8, 9]], [7, [6, 15, 14]], [56, [48, 57, 49]], [63, [62, 55, 54]]]) if (b[c]) for (const x of xs) { if (b[x] === p) sc += 30; else if (b[x] === o) sc -= 30; }
    const mob = moves(b, p).length - moves(b, o).length;
    sc += mob * 9;
    if (empties < 14) sc += (count(b, p) - count(b, o)) * (14 - empties);
    return sc;
  }
  const ABORT = {};
  function search(b, p, depth, a, beta, deadline, ctr) {
    if ((++ctr.n & 255) === 0 && performance.now() > deadline) throw ABORT;
    const ms = moves(b, p);
    if (!ms.length) {
      if (!moves(b, opp(p)).length) { const d = count(b, p) - count(b, opp(p)); return d > 0 ? 10000 + d : d < 0 ? -10000 + d : 0; }
      return -search(b, opp(p), depth, -beta, -a, deadline, ctr);
    }
    if (depth <= 0) return evalPos(b, p);
    ms.sort((x, y) => WT[y.sq] - WT[x.sq]);
    for (const m of ms) { const v = -search(apply(b, m, p), opp(p), depth - 1, -beta, -a, deadline, ctr); if (v >= beta) return v; if (v > a) a = v; }
    return a;
  }
  function bestMove(b, p, level, budget) {
    const ms = moves(b, p); if (!ms.length) return null;
    if (level === 0) { let best = null, bv = -1e9; for (const m of ms) { const v = m.fl.length + Math.random() * 3 + (WT[m.sq] > 100 ? 2 : 0); if (v > bv) { bv = v; best = m; } } return best; }
    const empties = 64 - count(b, BLACK) - count(b, WHITE);
    const depth = level === 1 ? 2 : empties <= 9 ? empties : 4;
    const deadline = performance.now() + (budget || 600), ctr = { n: 0 };
    let best = ms[0], bv = -1e9;
    const order = ms.slice().sort((x, y) => WT[y.sq] - WT[x.sq]);
    try {
      for (const m of order) { const v = -search(apply(b, m, p), opp(p), depth - 1, -1e9, -bv, deadline, ctr) + (level === 1 ? Math.random() * 4 : 0); if (v > bv) { bv = v; best = m; } }
    } catch (e) { if (e !== ABORT) throw e; }
    return best;
  }
  JG.reversiEngine = { moves, apply, bestMove, count };

  JG.mod('reversi', G => {
    JG.css('reversi', `
.grv{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--face)}
.grv-board{position:relative;flex:1;min-height:0}
.grv.tall{justify-content:center}
.grv-bar{flex:none;display:flex;align-items:center;gap:8px;padding:4px 8px 6px;font:12px var(--ui)}
.grv-sc{display:flex;align-items:center;gap:5px;font:bold 18px "Courier New",monospace;padding:2px 8px;min-width:62px}
.grv-sc i{display:inline-block;width:18px;height:18px;border-radius:50%;border:1px solid #000;flex:none}
.grv-sc.b i{background:radial-gradient(circle at 35% 30%,#666,#000 60%)}
.grv-sc.w i{background:radial-gradient(circle at 35% 30%,#fff,#bbb 70%)}
.grv-sc.on{background:#000080;color:#fff}
.grv-msg{flex:1;min-width:0;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`);
    const host = G.host;
    G.fit();
    let opts = Object.assign({ level: 1, hints: true }, G.store.get('opts', {}));
    const saveOpts = () => G.store.set('opts', opts);
    const LEVELS = ['Beginner', 'Expert', 'Master'];
    const root = document.createElement('div'); root.className = 'grv';
    root.innerHTML = `<div class="grv-board"></div><div class="grv-bar"><div class="grv-sc b field"><i></i><span>2</span></div><div class="grv-msg"></div><div class="grv-sc w field"><span>2</span><i></i></div></div>`;
    host.appendChild(root);
    const boardEl = root.querySelector('.grv-board'), msgEl = root.querySelector('.grv-msg'), scB = root.querySelector('.grv-sc.b'), scW = root.querySelector('.grv-sc.w');
    const C = G.canvas(boardEl, () => draw()); const cv = C.cv, ctx = C.c; G.focusEl = cv;
    const relayout = () => { const r = DesktopSurface.rect(host), tall = r.height - 44 > r.width + 40; root.classList.toggle('tall', tall); boardEl.style.flex = tall ? 'none' : ''; boardEl.style.height = tall ? Math.round(r.width + 6) + 'px' : ''; };
    if (window.ResizeObserver) { const ro = new ResizeObserver(relayout); ro.observe(host); G.onClose(() => ro.disconnect()); }
    relayout();
    let b = null, turn = BLACK, hist = [], over = false, busy = 0, tokn = 0, anim = null, hintSq = -1, cursor = -1, last = -1;
    const human = BLACK, cpu = WHITE;
    function newGame() {
      tokn++; busy = 0; b = new Array(64).fill(EMPTY); b[27] = b[36] = WHITE; b[28] = b[35] = BLACK;
      turn = BLACK; hist = []; over = false; anim = null; hintSq = -1; last = -1;
      if (saver) saver.clear(); // a new game: the old saved one goes
      msg('Your move. You are Black.'); refresh();
    }
    G.newGame = newGame;
    const msg = t => { msgEl.textContent = t; };
    function geo() { const W = C.W, H = C.H, sz = Math.max(10, Math.floor((Math.min(W, H) - 14) / 8)); return { sz, ox: Math.floor((W - sz * 8) / 2), oy: Math.floor((H - sz * 8) / 2) }; }
    function disc(x, y, r, col, sx) {
      ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.04, sx), 1);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(r * 0.08, r * 0.12, r, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
      if (col === BLACK) { g.addColorStop(0, '#777'); g.addColorStop(0.5, '#1a1a1a'); g.addColorStop(1, '#000'); } else { g.addColorStop(0, '#fff'); g.addColorStop(0.6, '#e8e8e8'); g.addColorStop(1, '#a8a8a8'); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col === BLACK ? '#000' : '#777'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    function draw() {
      if (!b || !C.W) return;
      const { sz, ox, oy } = geo(), dpr = C.dpr, now = performance.now();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0, 0, C.W, C.H);
      ctx.fillStyle = '#0a5a1e'; ctx.fillRect(ox - 5, oy - 5, sz * 8 + 10, sz * 8 + 10);
      ctx.strokeStyle = '#808080'; ctx.lineWidth = 1; ctx.strokeRect(ox - 5.5, oy - 5.5, sz * 8 + 11, sz * 8 + 11);
      const fg = ctx.createLinearGradient(ox, oy, ox + sz * 8, oy + sz * 8); fg.addColorStop(0, '#1aa040'); fg.addColorStop(1, '#0c7a2a');
      ctx.fillStyle = fg; ctx.fillRect(ox, oy, sz * 8, sz * 8);
      ctx.strokeStyle = '#063a14'; ctx.lineWidth = 1.5;
      for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(ox + i * sz, oy); ctx.lineTo(ox + i * sz, oy + sz * 8); ctx.moveTo(ox, oy + i * sz); ctx.lineTo(ox + sz * 8, oy + i * sz); ctx.stroke(); }
      ctx.fillStyle = '#063a14'; for (const [x, y] of [[2, 2], [6, 2], [2, 6], [6, 6]]) { ctx.beginPath(); ctx.arc(ox + x * sz, oy + y * sz, Math.max(2, sz / 16), 0, Math.PI * 2); ctx.fill(); }
      const r = sz * 0.4;
      let animating = false;
      for (let sq = 0; sq < 64; sq++) {
        const x = ox + (sq & 7) * sz + sz / 2, y = oy + (sq >> 3) * sz + sz / 2;
        if (sq === last && !anim) { ctx.fillStyle = 'rgba(255,255,0,.18)'; ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz); }
        if (!b[sq]) continue;
        let col = b[sq], sx = 1;
        if (anim) {
          const dl = anim.delay[sq];
          if (sq === anim.sq) { const k = Math.min(1, (now - anim.t0) / 120); sx = 1; if (k < 1) { animating = true; ctx.globalAlpha = k; } }
          else if (dl != null) { const k = (now - anim.t0 - dl) / 260; if (k < 1) { animating = true; if (k < 0.5) { col = opp(col); sx = Math.cos(Math.max(0, k) * Math.PI); } else sx = -Math.cos(k * Math.PI); } }
        }
        disc(x, y, r, col, sx); ctx.globalAlpha = 1;
      }
      if (!anim && !over && turn === human && !busy) {
        if (opts.hints) { ctx.fillStyle = 'rgba(0,0,0,.28)'; for (const m of moves(b, human)) { const x = ox + (m.sq & 7) * sz + sz / 2, y = oy + (m.sq >> 3) * sz + sz / 2; ctx.beginPath(); ctx.arc(x, y, sz * 0.11, 0, Math.PI * 2); ctx.fill(); } }
        if (hintSq >= 0 && Math.floor(now / 250) % 2 === 0) { const x = ox + (hintSq & 7) * sz + sz / 2, y = oy + (hintSq >> 3) * sz + sz / 2; ctx.globalAlpha = 0.55; disc(x, y, r, human, 1); ctx.globalAlpha = 1; }
      }
      if (cursor >= 0) { const x = ox + (cursor & 7) * sz, y = oy + (cursor >> 3) * sz; ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, sz - 4, sz - 4); ctx.restore(); }
      if (!animating && anim) { anim = null; }
      return animating || hintSq >= 0;
    }
    const kick = () => G.loop(() => { if (!draw()) { G.stopLoop(); draw(); } });
    function refresh() {
      const nb = count(b, BLACK), nw = count(b, WHITE);
      scB.querySelector('span').textContent = nb; scW.querySelector('span').textContent = nw;
      scB.classList.toggle('on', !over && turn === BLACK); scW.classList.toggle('on', !over && turn === WHITE);
      G.status(over ? 'Game over' : turn === human ? `Your turn (Black) - ${moves(b, human).length} possible moves` : 'The computer is thinking...');
      draw();
    }
    function place(m, p) {
      hist.push({ b: b.slice(), turn, last });
      const delay = {}; m.fl.forEach(s => { delay[s] = 60 + Math.max(Math.abs((s >> 3) - (m.sq >> 3)), Math.abs((s & 7) - (m.sq & 7))) * 70; });
      b = apply(b, m, p); last = m.sq; hintSq = -1;
      anim = { sq: m.sq, t0: performance.now(), delay };
      G.sfx('click'); m.fl.forEach((s, i) => G.timeout(() => G.note(420 + i * 40, 0.04, 'square'), delay[s] + 120));
      kick();
      nextTurn(opp(p));
      saver.save();
    }
    function nextTurn(p) {
      const mine = moves(b, p).length, theirs = moves(b, opp(p)).length;
      if (!mine && !theirs) return finish();
      let passed = false;
      if (!mine) { msg(p === human ? 'You have no moves, so you pass.' : 'The computer has to pass. Your go again!'); G.sfx('uhoh'); p = opp(p); passed = true; }
      if (p === cpu && !passed) msg('Hmm, let me think...');
      turn = p; refresh();
      if (turn === cpu) { const tok = ++tokn; busy = 1; refresh(); G.timeout(() => cpuMove(tok), 650); }
      else if (mine) msg(hist.length > 1 ? 'Your move.' : 'Your move. You are Black.');
    }
    function cpuMove(tok) {
      if (tok !== tokn || over || G.closed) return;
      const m = bestMove(b, cpu, opts.level, [100, 250, 380][opts.level]);
      busy = 0;
      if (m) { place(m, cpu); if (turn === human) msg(['The computer went there. Your move.', 'Your move.', 'Hmm, sneaky. Your move.'][Math.floor(Math.random() * 3)]); }
    }
    function finish() {
      over = true; turn = 0;
      const nb = count(b, BLACK), nw = count(b, WHITE), stats = G.store.get('stats', {}), k = LEVELS[opts.level], e = stats[k] = stats[k] || { w: 0, l: 0, d: 0 };
      let t;
      if (nb > nw) { e.w++; t = `You win ${nb} to ${nw}!`; G.sfx('solve'); if (opts.level === 2) G.secret('games.rev.win'); if (nw === 0) G.secret('games.rev.wipe'); }
      else if (nw > nb) { e.l++; t = `The computer wins ${nw} to ${nb}.`; G.sfx('uhoh'); }
      else { e.d++; t = `It's a draw, ${nb} each.`; }
      G.store.set('stats', stats); msg(t); refresh();
      G.timeout(() => G.msg('Reversi', t + (nb > nw && nw === 0 ? '\n\nA WHITEWASH! Not a single white disc left!' : '') + '\n\nGame > New Game (F2) to play again.', 'info'), 700);
    }
    function tap(sq) {
      if (over || turn !== human || busy || sq < 0) return;
      const fl = flipsFor(b, sq, human);
      if (!fl) { msg('You can\'t go there. You have to trap some white discs.'); G.sfx('beep'); return; }
      place({ sq, fl }, human);
    }
    G.on(cv, 'pointerdown', ev => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      ev.preventDefault(); G.focus(); cursor = -1;
      const r = DesktopSurface.rect(cv), point = DesktopSurface.point(ev.clientX, ev.clientY), { sz, ox, oy } = geo(), x = point.x - r.left - ox, y = point.y - r.top - oy;
      if (x < 0 || y < 0 || x >= sz * 8 || y >= sz * 8) return;
      tap(Math.floor(y / sz) * 8 + Math.floor(x / sz));
    });
    function hint() { if (over || turn !== human || busy) return; const m = bestMove(b, human, 1, 300); if (m) { hintSq = m.sq; msg('Try the flashing square.'); kick(); G.timeout(() => { hintSq = -1; draw(); }, 2400); } }
    function undo() {
      if (!hist.length) return;
      tokn++; busy = 0; over = false; anim = null;
      let h; do { h = hist.pop(); } while (hist.length && h.turn !== human);
      if (h.turn !== human) return newGame();
      b = h.b; turn = human; last = h.last; busy = 0; hintSq = -1; msg('Move taken back.'); refresh(); saver.save();
    }
    G.keys = { down(ev) {
      const k = ev.key, ar = { ArrowUp: -8, ArrowDown: 8, ArrowLeft: -1, ArrowRight: 1 };
      if ((ev.ctrlKey || ev.metaKey) && (k === 'z' || k === 'Z')) { undo(); return true; }
      if (k === 'h' || k === 'H') { hint(); return true; }
      if (ar[k] != null) { if (cursor < 0) cursor = 19; const d = ar[k], r = (cursor >> 3) + (d === 8 ? 1 : d === -8 ? -1 : 0), f = (cursor & 7) + (d === 1 ? 1 : d === -1 ? -1 : 0); if (r >= 0 && r < 8 && f >= 0 && f < 8) cursor = r * 8 + f; draw(); return true; }
      if ((k === 'Enter' || k === ' ') && cursor >= 0) { tap(cursor); return true; }
      return false;
    } };
    function statsDlg() {
      const stats = G.store.get('stats', {});
      const rows = LEVELS.map(l => { const e = stats[l] || { w: 0, l: 0, d: 0 }; return `<tr><td>${l}</td><td class="r">${e.w}</td><td class="r">${e.l}</td><td class="r">${e.d}</td></tr>`; }).join('');
      G.dialog('Statistics', `<table class="jghs"><tbody><tr><td><b>Level</b></td><td class="r"><b>Won</b></td><td class="r"><b>Lost</b></td><td class="r"><b>Drawn</b></td></tr>${rows}</tbody></table>`, [['OK'], ['Reset', () => { G.store.set('stats', {}); }]], { w: 300 });
    }
    G.helpKey = () => help();
    function help() {
      G.help([
        ['How to play', 'You are Black and you go first. Put a disc down so that one or more white discs are trapped in a straight line (across, up/down or diagonally) between your new disc and another black disc. All the trapped discs flip over to black.\n\nIf you can\'t trap anything you have to pass. When nobody can move, whoever has the most discs wins.'],
        ['Controls', '- Click a square to put a disc there. The little dots show where you can go (Options > Show Legal Moves).\n- Arrow keys and Enter work too.\n- H or Game > Hint flashes a good move.\n- Ctrl+Z takes your last move back.\n- F2 starts a new game.'],
        ['Tips', '- Corners can never be flipped. Grab them!\n- Don\'t go next to an empty corner. That gives it away.\n- Having lots of discs early on is NOT always good. Having lots of moves is.'],
      ]);
    }
    G.menu([
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: newGame },
        { label: 'Hint', key: 'H', dis: over || turn !== human, act: hint },
        { label: 'Undo', key: 'Ctrl+Z', dis: !hist.length, act: undo }, '-',
        ...(window.MP ? [{ label: 'Play with someone... (online)', act: () => MP.pick('zone.reversi') }, '-'] : []),
        { label: 'Statistics...', act: statsDlg }, '-',
        { label: 'Exit', act: () => G.w.close() },
      ]],
      ['Options', () => [
        ...LEVELS.map((l, i) => ({ label: l, rad: opts.level === i, act: () => { opts.level = i; saveOpts(); msg(`Level: ${l}.`); } })), '-',
        { label: 'Show Legal Moves', chk: opts.hints, act: () => { opts.hints = !opts.hints; saveOpts(); draw(); } },
      ]],
      ['Help', () => [
        { label: 'Help Topics', key: 'F1', act: help }, '-',
        { label: 'About Reversi', act: () => G.about({ ver: 'Version 3.1', blurb: 'The board game with discs that are black on one side and white on the other. Gran calls it "the flippy one".', credits: [['Programming', 'Jack'], ['Computer brain', 'Jack (and a library book)'], ['Disc flipping', 'Gubbinz'], ['Green felt', 'Off the snooker table in the loft'], ['Testing', Cast.t('Cousin {cousin} (won every game)')], ['Sandwiches', 'Mom']] }) },
      ]],
    ]);
    G.dbg = () => ({ b: b.join(''), turn, over, busy, black: count(b, BLACK), white: count(b, WHITE), hist: hist.length });
    G.dbgTap = sq => tap(sq);
    G.dbgSet = (s, t) => { tokn++; b = s.split('').map(Number); turn = t || BLACK; over = false; hist = []; busy = 0; refresh(); nextTurn(turn); };
    // the game in progress is saved (js/gamesave.js): every disc, whose go it is and the undo history
    const bstr = a => a.join(''), okB = s => typeof s === 'string' && /^[0-2]{64}$/.test(s);
    const saver = G.saver(() => (over || !b || !hist.length) ? null : { b: bstr(b), turn, last, hist: hist.slice(-40).map(h => ({ b: bstr(h.b), turn: h.turn, last: h.last })) }, { v: 1 });
    function resume() {
      const s = saver.load(); if (!s || !okB(s.b) || (s.turn !== BLACK && s.turn !== WHITE)) return false;
      tokn++; busy = 0; anim = null; hintSq = -1; over = false;
      b = s.b.split('').map(Number); turn = s.turn; last = s.last | 0;
      hist = (Array.isArray(s.hist) ? s.hist : []).filter(h => h && okB(h.b)).map(h => ({ b: h.b.split('').map(Number), turn: h.turn, last: h.last | 0 }));
      msg('Carrying on where you left off.'); refresh(); nextTurn(turn);
      return true;
    }
    if (!resume()) newGame();
  });
})();

/* Cube Net Trainer for JackOS 98 (lazy loaded by apps-games.js).
 * A 3x3 puzzle cube unfolded flat, with every face/slice/rotation move, scrambles, a stackmat-style timer
 * and a beginner's-method helper written in Jack's own words. Original code and art. */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;

  // ================================================================ the cube model: 54 stickers in 3D
  // Each sticker has a cubie position p (x,y,z in -1..1; x right, y up, z towards you) and a normal n.
  const COLS = { W: '#ffffff', Y: '#ffd400', G: '#1aa31a', B: '#2349e0', R: '#e10600', O: '#ff8a00' };
  const FACE_N = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0] };
  const FACE_COL = { U: 'W', D: 'Y', F: 'G', B: 'B', R: 'R', L: 'O' };
  const FACES = ['U', 'L', 'F', 'R', 'B', 'D'];
  // move -> [axis index, layer filter, quarter-turn sign (+1 = +90 deg right-handed)]
  const MOVES = {
    U: [1, v => v === 1, -1], D: [1, v => v === -1, 1], E: [1, v => v === 0, 1], y: [1, () => true, -1],
    R: [0, v => v === 1, -1], L: [0, v => v === -1, 1], M: [0, v => v === 0, 1], x: [0, () => true, -1],
    F: [2, v => v === 1, -1], B: [2, v => v === -1, 1], S: [2, v => v === 0, -1], z: [2, () => true, -1],
  };
  function rot(v, ax, s) { // rotate integer vector by s*90 degrees about axis ax
    const [x, y, z] = v;
    if (ax === 0) return [x, -s * z, s * y];
    if (ax === 1) return [s * z, y, -s * x];
    return [-s * y, s * x, z];
  }
  function solvedCube() {
    const st = [];
    for (const f of FACES) {
      const n = FACE_N[f];
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
        const p = n[0] ? [n[0], a, b] : n[1] ? [a, n[1], b] : [a, b, n[2]];
        st.push({ p, n: n.slice(), c: FACE_COL[f], id: st.length, flash: 0 });
      }
    }
    return st;
  }
  function turn(st, m, times) {
    const [ax, layer, sgn] = MOVES[m];
    for (let k = 0; k < times; k++) for (const s of st) if (layer(s.p[ax])) { s.p = rot(s.p, ax, sgn); s.n = rot(s.n, ax, sgn); }
  }
  // parse "R U R' U2 x" -> [[move, quarterTurns 1|2|3], ...]
  function parse(alg) {
    const out = [];
    for (const t of String(alg).replace(/[()]/g, ' ').trim().split(/\s+/)) {
      const m = /^([UDLRFBMESxyz])(2'?|'?)$/.exec(t); if (!m) continue;
      out.push([m[1], m[2] === "'" ? 3 : m[2].startsWith('2') ? 2 : 1]);
    }
    return out;
  }
  const mvName = (m, q) => m + (q === 3 ? "'" : q === 2 ? '2' : '');
  // where a sticker sits on the flat net
  function netPos(s) {
    const [x, y, z] = s.p, n = s.n;
    if (n[1] === 1) return ['U', z + 1, x + 1];
    if (n[1] === -1) return ['D', 1 - z, x + 1];
    if (n[2] === 1) return ['F', 1 - y, x + 1];
    if (n[2] === -1) return ['B', 1 - y, 1 - x];
    if (n[0] === 1) return ['R', 1 - y, 1 - z];
    return ['L', 1 - y, z + 1];
  }
  function faces(st) { // {U: [9 colours row-major], ...} and sticker refs
    const F = {}, R = {}; for (const f of FACES) { F[f] = new Array(9); R[f] = new Array(9); }
    for (const s of st) { const [f, r, c] = netPos(s); F[f][r * 3 + c] = s.c; R[f][r * 3 + c] = s; }
    return { F, R };
  }
  const isSolved = st => { const { F } = faces(st); return FACES.every(f => F[f].every(c => c === F[f][4])); };
  function isChecker(st) {
    const { F } = faces(st);
    return FACES.every(f => { const a = F[f]; const other = a[1]; return other !== a[4] && [0, 2, 4, 6, 8].every(i => a[i] === a[4]) && [1, 3, 5, 7].every(i => a[i] === other); });
  }
  // ---- beginner's method stage detection
  const key = v => v.join(',');
  function pieces(st) {
    const m = new Map();
    for (const s of st) { const k = key(s.p); if (!m.has(k)) m.set(k, []); m.get(k).push(s); }
    return [...m.values()];
  }
  function stage(st) {
    const centre = {}; for (const s of st) if (Math.abs(s.p[0]) + Math.abs(s.p[1]) + Math.abs(s.p[2]) === 1) centre[key(s.n)] = s.c;
    const nW = Object.keys(centre).find(k => centre[k] === 'W'), nY = Object.keys(centre).find(k => centre[k] === 'Y');
    const P = pieces(st), edges = P.filter(p => p.length === 2), corners = P.filter(p => p.length === 3);
    const ok = s => centre[key(s.n)] === s.c;
    const has = (p, c) => p.some(s => s.c === c);
    const checks = [
      ['cross', edges.filter(p => has(p, 'W')), p => p.every(ok)],
      ['corners', corners.filter(p => has(p, 'W')), p => p.every(ok)],
      ['middle', edges.filter(p => !has(p, 'W') && !has(p, 'Y')), p => p.every(ok)],
      ['ycross', edges.filter(p => has(p, 'Y')), p => key(p.find(s => s.c === 'Y').n) === nY],
      ['yedges', edges.filter(p => has(p, 'Y')), p => p.every(ok)],
      ['ycorners', corners.filter(p => has(p, 'Y')), p => { const set = new Set(p[0].p.map((v, i) => centre[key([0, 1, 2].map(j => j === i ? v : 0))])); return p.every(s => set.has(s.c)); }],
      ['twist', corners.filter(p => has(p, 'Y')), p => p.every(ok)],
    ];
    for (let i = 0; i < checks.length; i++) {
      const [id, list, test] = checks[i], bad = list.filter(p => !test(p));
      if (bad.length) return { i, id, bad: new Set(bad.flat().map(s => s.id)), done: list.length - bad.length, of: list.length, nW, nY };
    }
    return { i: 7, id: 'solved', bad: new Set(), done: 0, of: 0 };
  }
  const STAGES = [
    { name: '1. The white cross', alg: '', tip: 'Get the four white EDGE bits round the white middle, so the other colour on each one matches the middle next to it. There\'s no move to learn, you just have to think!\n\nJack\'s tip: first make a "daisy" (white edges round the YELLOW middle), then turn each petal until its side colour matches, and do it twice (F2) to send it down to the white side.' },
    { name: '2. White corners', alg: "R U R' U'", tip: 'Hold the cube with WHITE ON THE BOTTOM. Find a corner with white on it in the top layer. Turn the top (U) until the corner is right above where it belongs (front-right). Then do the move below again and again until it drops in with white facing down. Usually 1 to 5 goes.\n\nDave calls it "the sexy move". Mom says we are not allowed to call it that.' },
    { name: '3. The middle layer', alg: "U R U' R' U' F' U F", tip: 'Now YELLOW ON TOP. Find an edge on top with no yellow on it. Turn U until its front colour matches the front middle.\n\nNeeds to go RIGHT?  U R U\' R\' U\' F\' U F\nNeeds to go LEFT?   U\' L\' U L U F U\' F\'\n\nIf an edge is stuck in the middle the wrong way round, do the right one with any top edge to pop it out.' },
    { name: '4. The yellow cross', alg: "F R U R' U' F'", tip: 'Look at the yellow on top (just the edges, ignore corners). Is it a DOT, an L SHAPE, a LINE or a CROSS?\n\nL shape: hold it so the L points to the back and the left, then do the move. Line: hold it flat (left to right) and do the move. Dot: do the move, then look again. Easy peasy.' },
    { name: '5. Yellow edges', alg: "R U R' U R U2 R'", tip: 'Turn U until at least two yellow edges match the middles on their sides. If two that match are next to each other, hold them at the BACK and on the LEFT and do the move. If they are opposite each other, do it once from anywhere and look again.' },
    { name: '6. Yellow corners in place', alg: "U R U' L' U R' U' L", tip: 'Find a yellow corner that\'s in the right SPOT (it has the right three colours for that spot, even if it\'s twisted). Hold it at the front-right-top and do the move until all four corners are home. No good corners? Do it once from anywhere first.' },
    { name: '7. Twist the corners', alg: "R' D' R D", tip: 'Yellow on top, an unfinished corner at the front-right-top. Do R\' D\' R D two or four times until its yellow faces up. Then turn ONLY the top layer (U) to bring the next twisted corner to the front-right and do it again.\n\nHalfway through, the bottom of the cube looks totally wrecked. DON\'T PANIC. It all comes back at the end. This is the bit where Gran gave up.' },
    { name: 'SOLVED!', alg: '', tip: 'Every face is one colour. Nice one!\n\nNow press Scramble and do it faster. Jack\'s best on a real cube is on the fridge (it\'s held up by the Eggbert magnet).' },
  ];

  // ================================================================ the window
  JG.css('cube', `
.cbw{position:absolute;inset:0;display:flex;background:var(--face);overflow:hidden}
.cbnet{position:relative;flex:1;min-width:0;background:#1d2a3a;border:2px solid;border-color:#808080 #fff #fff #808080;margin:4px}
.cbside{width:262px;flex:none;overflow:auto;padding:4px 6px 6px 2px;display:flex;flex-direction:column;gap:6px}
.cbside .group{margin:8px 0 0;padding:10px 6px 6px}
.cbtimer{background:#000;color:#ff3030;font:bold 30px "Courier New",monospace;text-align:right;padding:2px 8px;border:2px solid;border-color:#808080 #fff #fff #808080;letter-spacing:1px;min-height:38px;line-height:38px}
.cbtimer.ready{color:#3aff3a}.cbtimer.insp{color:#ffd400}
.cbtsub{display:flex;justify-content:space-between;font-size:11px;margin-top:2px;gap:6px}
.cbscr{font:bold 12px "Courier New",monospace;padding:4px;min-height:34px;word-spacing:2px;line-height:1.35;-webkit-user-select:text;user-select:text}
.cbrow{display:flex;gap:4px;flex-wrap:wrap}
.cbrow .btn{flex:1;padding:3px 4px;min-width:0}
.cbmoves{display:grid;grid-template-columns:repeat(6,1fr);gap:3px}
.cbmoves .btn{padding:2px 0;min-height:28px;min-width:0;font:bold 12px Tahoma,sans-serif;touch-action:manipulation}
.cbmoves .btn.sl{color:#000080}.cbmoves .btn.rt{color:#800000}
.cbhelp b{display:block;color:#000080;margin-bottom:3px}
.cbhelp .cbalg{font:bold 12px "Courier New",monospace;background:#fff;border:1px solid #808080;padding:3px 5px;margin:4px 0;-webkit-user-select:text;user-select:text}
.cbhelp .cbtip{font-size:11px;line-height:1.4;white-space:pre-line;max-height:150px;overflow:auto}
.cbhelp .cbprog{font-size:11px;color:#444;margin:3px 0}
.cbtimes{font:11px Tahoma,sans-serif;max-height:110px;overflow:auto;background:#fff;padding:2px 4px}
.cbtimes div{display:flex;justify-content:space-between;border-bottom:1px dotted #ccc}
.cbstats{display:flex;justify-content:space-between;font-size:11px;margin-top:3px}
.cbw.narrow{flex-direction:column;overflow:auto}
.cbw.narrow .cbnet{flex:none;height:300px}
.cbw.narrow .cbside{width:auto;overflow:visible;padding:0 6px 10px}
.cbw.narrow .cbmoves .btn{min-height:38px;font-size:14px}
`);

  JG.mod('cube', G => {
    G.fit();
    const host = G.host;
    let opts = Object.assign({ timer: 'virtual', insp: true, show: false }, G.store.get('opts', {}));
    const saveOpts = () => G.store.set('opts', opts);
    const day99 = () => { try { const t = Desk.today99(); return String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99'; } catch (e) { return ''; } };
    const fmtT = cs => { cs = Math.round(cs); const m = Math.floor(cs / 6000), s = Math.floor(cs / 100) % 60, c = cs % 100; return (m ? m + ':' + String(s).padStart(2, '0') : s) + '.' + String(c).padStart(2, '0'); };
    const scores = G.scores({ title: 'Cube Net Trainer Best Times', lower: true, max: 360000, label: 'Time', fmt: v => fmtT(v) + 's', newText: 'Brilliant! That is one of the ten fastest solves on this computer.', seed: [['JACK', 16800], [Cast.t('COUSIN {cousin.NAME}'), 31250], ['DAVE', 59999]] });

    const wrap = document.createElement('div'); wrap.className = 'cbw';
    wrap.innerHTML = `<div class="cbnet"></div><div class="cbside">
      <div><div class="cbtimer">0.00</div><div class="cbtsub"><span class="cbmode"></span><span class="cbmv">Moves: 0</span></div></div>
      <div class="field cbscr" title="Scramble">Press Scramble to mix the cube up.</div>
      <div class="cbrow"><button class="btn" data-a="scr" type="button">Scramble</button><button class="btn" data-a="undo" type="button">Undo</button><button class="btn" data-a="reset" type="button">Reset</button></div>
      <div class="cbmoves"></div>
      <div class="group cbhelp"><span class="lg">Beginner's Helper</span><b class="cbst"></b><div class="cbprog"></div><div class="cbalg"></div><div class="cbrow"><button class="btn" data-a="show" type="button">Show me</button><button class="btn" data-a="try" type="button">Try the moves</button></div><div class="cbtip"></div></div>
      <div class="group"><span class="lg">Times</span><div class="field cbtimes"></div><div class="cbstats"><span class="cbbest">Best: -</span><span class="cbao5">Avg of 5: -</span></div></div>
    </div>`;
    host.appendChild(wrap);
    const $ = s => wrap.querySelector(s);
    const netBox = $('.cbnet'), side = $('.cbside');
    const movesEl = $('.cbmoves');
    const BTN = [];
    for (const f of ['U', 'D', 'L', 'R', 'F', 'B']) for (const q of [1, 3, 2]) BTN.push([f, q, '']);
    for (const f of ['M', 'E', 'S']) for (const q of [1, 3]) BTN.push([f, q, 'sl']);
    for (const f of ['x', 'y', 'z']) for (const q of [1, 3]) BTN.push([f, q, 'rt']);
    movesEl.innerHTML = BTN.map(([f, q, c], i) => `<button class="btn ${c}" type="button" data-i="${i}" title="${f === 'x' || f === 'y' || f === 'z' ? 'Turn the whole cube' : f === 'M' || f === 'E' || f === 'S' ? 'Middle slice' : 'Turn the ' + { U: 'top', D: 'bottom', L: 'left', R: 'right', F: 'front', B: 'back' }[f] + ' face'}">${mvName(f, q)}</button>`).join('');

    // ---------------------------------------------------------------- state
    let cube = solvedCube(), hist = [], moves = 0, scrambled = false, scrText = '';
    let timer = { mode: 'idle', t0: 0, insp0: 0, hold0: 0, last: 0 }; // idle | insp | run | done | hold
    let showMe = false, queue = [], qT = 0;
    let times = G.store.get('times', []);

    function apply(m, q, user) {
      turn(cube, m, q);
      // only flash stickers in the turned layer
      const [ax, layer] = MOVES[m];
      for (const s of cube) s.flash = layer(s.p[ax]) ? 1 : 0;
      if (user) {
        hist.push([m, q]); if (hist.length > 500) hist.shift();
        if (!/[xyz]/.test(m)) moves++;
        saver.save();
        G.note(m === 'x' || m === 'y' || m === 'z' ? 330 : 520 + 'UDLRFBMES'.indexOf(m) * 30, 0.04, 'square');
        afterMove(m);
      }
      kick();
    }
    function afterMove(m) {
      if (opts.timer === 'virtual' && scrambled && (timer.mode === 'idle' || timer.mode === 'insp') && !/[xyz]/.test(m)) { timer.mode = 'run'; timer.t0 = performance.now(); }
      if (isChecker(cube)) { if (G.secret('games.cube.checker')) Desk.toast('Cube Net Trainer', 'A draughts board on every face! Gran would be proud.'); }
      if (isSolved(cube)) {
        if (scrambled) {
          scrambled = false; showMe = false; G.secret('games.cube.solve'); G.sfx('solve');
          if (opts.timer === 'virtual' && timer.mode === 'run') {
            const cs = Math.max(1, Math.round((performance.now() - timer.t0) / 10)); timer.mode = 'done'; timer.last = cs;
            record(cs, false);
            G.timeout(() => scores.submit(cs), 700);
          } else Desk.toast('Cube Net Trainer', 'SOLVED! Nice one.');
        }
      }
      ui();
    }
    function record(cs, real) {
      times.unshift({ t: cs, m: real ? 0 : moves, d: day99(), r: real ? 1 : 0 });
      times = times.slice(0, 50); G.store.set('times', times);
    }
    function randomScramble() { // 20 moves, never the same face twice, never three on one axis (like R L R)
      const AX = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 }, out = [];
      while (out.length < 20) {
        const f = 'UDLRFB'[Math.random() * 6 | 0], n = out.length;
        if (n && out[n - 1][0] === f) continue;
        if (n > 1 && AX[out[n - 1][0]] === AX[f] && AX[out[n - 2][0]] === AX[f]) continue;
        out.push([f, 1 + (Math.random() * 3 | 0)]);
      }
      return out;
    }
    function scramble() {
      cube = solvedCube();
      const s = randomScramble();
      for (const [m, q] of s) turn(cube, m, q);
      for (const st of cube) st.flash = 0.6;
      scrText = s.map(([m, q]) => mvName(m, q)).join(' ');
      hist = []; moves = 0; scrambled = true; queue = []; showMe = false;
      timer = { mode: opts.timer === 'virtual' && opts.insp ? 'insp' : 'idle', t0: 0, insp0: performance.now(), hold0: 0, last: 0 };
      saver.save();
      G.sfx('dice'); ui(); kick(); G.focus();
    }
    function reset() { saver.clear(); showMe = false; cube = solvedCube(); hist = []; moves = 0; scrambled = false; scrText = ''; queue = []; timer = { mode: 'idle', t0: 0, insp0: 0, hold0: 0, last: 0 }; ui(); kick(); }
    function undo() { const h = hist.pop(); if (!h) return; saver.save(); turn(cube, h[0], 4 - h[1]); if (!/[xyz]/.test(h[0])) moves = Math.max(0, moves - 1); for (const s of cube) s.flash = MOVES[h[0]][1](s.p[MOVES[h[0]][0]]) ? 0.7 : 0; G.sfx('click'); ui(); kick(); }

    // ---------------------------------------------------------------- stackmat-style timer for a REAL cube
    function spaceDown() {
      if (opts.timer !== 'real') return false;
      if (timer.mode === 'run') { const cs = Math.max(1, Math.round((performance.now() - timer.t0) / 10)); timer.mode = 'done'; timer.last = cs; record(cs, true); G.sfx('pet'); ui(); return true; }
      if (timer.mode === 'hold') return true;
      if (opts.insp && timer.mode !== 'insp') { timer.mode = 'insp'; timer.insp0 = performance.now(); timer.armed = false; kick(); return true; }
      timer.mode = 'hold'; timer.hold0 = performance.now(); kick(); return true;
    }
    function spaceUp() {
      if (opts.timer !== 'real') return false;
      if (timer.mode === 'insp' && !timer.armed) { timer.armed = true; return true; }
      if (timer.mode === 'hold') { if (performance.now() - timer.hold0 >= 300) { timer.mode = 'run'; timer.t0 = performance.now(); G.sfx('click'); } else timer.mode = opts.insp ? 'insp' : 'idle'; kick(); }
      return true;
    }
    function insDownAgain() { if (opts.timer === 'real' && timer.mode === 'insp' && timer.armed) { timer.mode = 'hold'; timer.hold0 = performance.now(); timer.fromInsp = true; return true; } return false; }

    // ---------------------------------------------------------------- side panel
    function ui() {
      $('.cbmv').textContent = 'Moves: ' + moves;
      $('.cbmode').textContent = opts.timer === 'virtual' ? (scrambled ? 'Timer starts on your first turn' : 'Virtual cube timer') : 'Real cube: hold Space';
      $('.cbscr').textContent = scrText || (opts.timer === 'real' ? 'Real cube mode: scramble your own cube with this:' : 'Press Scramble to mix the cube up.');
      if (opts.timer === 'real' && !scrText) $('.cbscr').textContent = 'Real cube mode: press Scramble for a scramble to copy onto your cube.';
      const stg = stage(cube), S = STAGES[stg.i];
      $('.cbst').textContent = S.name;
      $('.cbprog').textContent = stg.of ? `${stg.done} of ${stg.of} pieces done for this step.` : stg.i === 7 ? 'All done!' : '';
      $('.cbalg').textContent = S.alg || (stg.i === 0 ? '(no moves to learn: think!)' : 'Scramble it again!');
      $('.cbtip').textContent = S.tip;
      $('[data-a=try]').disabled = !S.alg;
      $('[data-a=show]').textContent = showMe ? 'Hide' : 'Show me';
      $('[data-a=show]').disabled = stg.i === 7;
      const list = times.slice(0, 50);
      $('.cbtimes').innerHTML = list.length ? list.map((t, i) => `<div><span>${list.length - i}. ${fmtT(t.t)}s</span><span>${t.r ? 'real cube' : t.m + ' moves'}</span></div>`).join('') : '<div><span>No solves yet.</span></div>';
      const best = list.length ? Math.min(...list.map(t => t.t)) : 0;
      $('.cbbest').textContent = 'Best: ' + (best ? fmtT(best) + 's' : '-');
      if (list.length >= 5) { const l5 = list.slice(0, 5).map(t => t.t).sort((a, b) => a - b).slice(1, 4); $('.cbao5').textContent = 'Avg of 5: ' + fmtT(l5.reduce((a, b) => a + b, 0) / 3) + 's'; }
      else $('.cbao5').textContent = 'Avg of 5: -';
      $('[data-a=undo]').disabled = !hist.length;
    }
    side.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.i != null) { const [m, q] = BTN[+b.dataset.i]; if (!queue.length) apply(m, q, true); G.focus(); return; }
      const a = b.dataset.a;
      if (a === 'scr') scramble(); else if (a === 'undo') undo(); else if (a === 'reset') reset();
      else if (a === 'show') { showMe = !showMe; ui(); kick(); }
      else if (a === 'try') { const S = STAGES[stage(cube).i]; if (S.alg && !queue.length) { queue = parse(S.alg); qT = 0; kick(); } }
      G.focus();
    });

    // ---------------------------------------------------------------- the net canvas
    const L = {};
    const C = G.canvas(netBox, () => { layoutNet(); kick(); });
    const cv = C.cv, ctx = C.c;
    G.focusEl = cv;
    const NETXY = { U: [1, 0], L: [0, 1], F: [1, 1], R: [2, 1], B: [3, 1], D: [1, 2] };
    function layoutNet() {
      const W = C.W, H = C.H, pad = 10;
      const f = Math.floor(Math.min((W - pad * 2) / 4, (H - pad * 2) / 3));
      L.f = f; L.s = f / 3; L.x0 = Math.round((W - f * 4) / 2); L.y0 = Math.round((H - f * 3) / 2);
    }
    function narrowCheck() {
      const r = host.getBoundingClientRect();
      const narrow = r.width < 560;
      wrap.classList.toggle('narrow', narrow);
      if (narrow) netBox.style.height = Math.round(Math.min(340, Math.max(220, r.width * 0.78))) + 'px'; else netBox.style.height = '';
    }
    let dirty = true;
    const kick = () => { dirty = true; };
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function draw() {
      if (!L.f) layoutNet();
      const W = C.W, H = C.H;
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#22344a'); g.addColorStop(1, '#0e1620');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const { R } = faces(cube), stg = showMe ? stage(cube) : null;
      for (const f of FACES) {
        const [fx, fy] = NETXY[f], X = L.x0 + fx * L.f, Y = L.y0 + fy * L.f;
        ctx.fillStyle = '#000'; rr(X + 1, Y + 1, L.f - 2, L.f - 2, L.s * 0.18); ctx.fill();
        for (let i = 0; i < 9; i++) {
          const s = R[f][i], x = X + (i % 3) * L.s, y = Y + Math.floor(i / 3) * L.s, gap = Math.max(1.5, L.s * 0.07);
          rr(x + gap, y + gap, L.s - gap * 2, L.s - gap * 2, L.s * 0.14);
          ctx.fillStyle = COLS[s.c]; ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(x + gap * 2, y + gap * 2, L.s - gap * 4, (L.s - gap * 4) * 0.35, L.s * 0.1); ctx.fill();
          if (s.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.55})`; rr(x + gap, y + gap, L.s - gap * 2, L.s - gap * 2, L.s * 0.14); ctx.fill(); }
          if (stg && stg.i < 7 && !stg.bad.has(s.id)) { ctx.fillStyle = 'rgba(14,22,32,.72)'; rr(x + gap, y + gap, L.s - gap * 2, L.s - gap * 2, L.s * 0.14); ctx.fill(); }
          else if (stg && stg.bad.has(s.id)) { ctx.strokeStyle = Math.sin(performance.now() / 120) > 0 ? '#fff' : '#000'; ctx.lineWidth = 2; rr(x + gap, y + gap, L.s - gap * 2, L.s - gap * 2, L.s * 0.14); ctx.stroke(); }
        }
        // face letter
        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.font = `bold ${Math.max(9, Math.round(L.s * 0.32))}px Tahoma, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(f, X + L.f / 2, Y + L.f / 2);
      }
      // the little 3D view in the empty corner (bottom right of the net)
      iso(L.x0 + 2.5 * L.f + L.f * 0.5, L.y0 + 2.5 * L.f, L.f * 0.42, R);
      // labels in the top-right corner
      ctx.fillStyle = '#9ab'; ctx.font = `${Math.max(10, Math.round(L.s * 0.3))}px Tahoma, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const tx = L.x0 + 2 * L.f + 6;
      ctx.fillText(G.phone() ? 'Click a face to turn it' : 'Click a face to turn it', tx, L.y0 + 6);
      ctx.fillText(G.phone() ? '(click and hold: anticlockwise)' : '(right-click: anticlockwise)', tx, L.y0 + 6 + L.s * 0.45);
      if (queue.length) { ctx.fillStyle = '#ffd400'; ctx.fillText('Doing: ' + queue.map(([m, q]) => mvName(m, q)).join(' '), tx, L.y0 + 6 + L.s * 0.95); }
      if (isSolved(cube) && hist.length) { ctx.fillStyle = '#7cff3a'; ctx.font = `bold ${Math.round(L.s * 0.5)}px Bangers, Impact, sans-serif`; ctx.fillText('SOLVED!', L.x0 + 6, L.y0 + 2.2 * L.f); }
    }
    function iso(cx, cy, size, R) {
      // isometric unit vectors
      const ex = [Math.cos(Math.PI / 6) * size / 3, Math.sin(Math.PI / 6) * size / 3], ey = [0, -size / 3], ez = [-Math.cos(Math.PI / 6) * size / 3, Math.sin(Math.PI / 6) * size / 3];
      const P = (x, y, z) => [cx + x * ex[0] + y * ey[0] + z * ez[0], cy + x * ex[1] + y * ey[1] + z * ez[1]];
      const quad = (a, b, c, d, col) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2; ctx.stroke(); };
      // cube spans x 0..3 (right), y 0..3 (up), z 0..3 (towards viewer at left). Show U, F (z=3), R (x=3)
      for (let i = 0; i < 9; i++) {
        const r = Math.floor(i / 3), c = i % 3;
        // U: row r goes back->front (z 0..3), col c left->right (x)
        quad(P(c, 3, r), P(c + 1, 3, r), P(c + 1, 3, r + 1), P(c, 3, r + 1), COLS[R.U[i].c]);
        // F: row r top->bottom (y), col c left->right (x) at z=3
        quad(P(c, 3 - r, 3), P(c + 1, 3 - r, 3), P(c + 1, 2 - r, 3), P(c, 2 - r, 3), COLS[R.F[i].c]);
        // R: x=3, col c front->back (z 3..0), row top->bottom
        quad(P(3, 3 - r, 3 - c), P(3, 3 - r, 2 - c), P(3, 2 - r, 2 - c), P(3, 2 - r, 3 - c), COLS[R.R[i].c]);
      }
      ctx.fillStyle = 'rgba(0,0,0,.25)';
    }
    // tap a sticker: turn its face (or the matching slice for middles is not needed: the centre turns the face)
    let press = null;
    function faceAt(px, py) {
      for (const f of FACES) { const [fx, fy] = NETXY[f], X = L.x0 + fx * L.f, Y = L.y0 + fy * L.f; if (px >= X && px < X + L.f && py >= Y && py < Y + L.f) return f; }
      return null;
    }
    G.on(cv, 'pointerdown', ev => {
      ev.preventDefault(); G.focus();
      const r = cv.getBoundingClientRect(), f = faceAt(ev.clientX - r.left, ev.clientY - r.top);
      if (!f || queue.length) return;
      if (ev.button === 2 || ev.shiftKey) { apply(f, 3, true); return; }
      press = { f, t: performance.now(), id: ev.pointerId, done: false };
      press.timer = G.timeout(() => { if (press && !press.done) { press.done = true; apply(press.f, 3, true); } }, 450);
    });
    const release = ev => { if (!press || ev.pointerId !== press.id) return; G.clear(press.timer); if (!press.done) apply(press.f, 1, true); press = null; };
    G.on(cv, 'pointerup', release); G.on(cv, 'pointercancel', ev => { if (press) { G.clear(press.timer); press = null; } });
    G.on(cv, 'contextmenu', ev => ev.preventDefault());

    // ---------------------------------------------------------------- keys: U D L R F B M E S X Y Z, Shift = anticlockwise
    G.keys = {
      down(ev) {
        if (ev.ctrlKey && (ev.key === 'z' || ev.key === 'Z')) { undo(); return true; }
        if (ev.key === 'Backspace') { undo(); return true; }
        if (ev.key === ' ') { if (ev.repeat) return true; return insDownAgain() || spaceDown() || true; }
        if (ev.ctrlKey || ev.altKey || ev.metaKey) return false;
        const m = /^Key([UDLRFBMESXYZ])$/.exec(ev.code);
        if (!m || queue.length) return false;
        const mv = 'XYZ'.includes(m[1]) ? m[1].toLowerCase() : m[1];
        apply(mv, ev.shiftKey ? 3 : 1, true);
        return true;
      },
      up(ev) { if (ev.key === ' ') { spaceUp(); return true; } return false; },
    };

    // ---------------------------------------------------------------- loop: flashes, the queued algorithm, timer display
    const tEl = $('.cbtimer');
    let lastNarrow = 0;
    G.loop(dt => {
      if ((lastNarrow -= dt) <= 0) { lastNarrow = 0.5; narrowCheck(); }
      let anim = false;
      for (const s of cube) if (s.flash > 0) { s.flash = Math.max(0, s.flash - dt * 4); anim = true; }
      if (queue.length) { qT -= dt; anim = true; if (qT <= 0) { const [m, q] = queue.shift(); apply(m, q, true); qT = 0.32; if (!queue.length) ui(); } }
      if (anim || dirty || showMe) { dirty = false; draw(); }
      // timer
      const now = performance.now();
      let txt = '', cls = '';
      if (timer.mode === 'run') txt = fmtT((now - timer.t0) / 10);
      else if (timer.mode === 'insp') { const left = 15 - (now - timer.insp0) / 1000; txt = left > 0 ? String(Math.ceil(left)) : '+2'; cls = 'insp'; if (opts.timer === 'virtual' && left <= -2) { timer.mode = 'run'; timer.t0 = now; } }
      else if (timer.mode === 'hold') { txt = '0.00'; cls = now - timer.hold0 >= 300 ? 'ready' : ''; }
      else txt = fmtT(timer.last || 0);
      if (tEl.textContent !== txt) tEl.textContent = txt;
      if (tEl.className !== 'cbtimer ' + cls) tEl.className = 'cbtimer ' + cls;
    });
    G.onActive = a => { if (!a && timer.mode === 'hold') timer.mode = 'idle'; };

    // ---------------------------------------------------------------- menus
    G.newGame = () => scramble();
    const help = () => G.help([
      ['The cube', 'A puzzle cube, squashed flat. The middle row is LEFT, FRONT, RIGHT and BACK; the top is UP and the bottom is DOWN. Imagine folding it back up into a box. (Jack practises on this on the bus, when he hasn\'t got his real one.)\n\nThe little 3D cube in the corner shows the top, front and right sides.'],
      ['Turning', '- Click a face: turn it clockwise (as you look at that face)\n- Right-click, Shift+click or click and hold: anticlockwise\n- Keys U D L R F B turn faces. Shift makes it anticlockwise (a "prime", written U\')\n- M E S turn the middle slices. X Y Z turn the whole cube\n- Backspace or Ctrl+Z: undo\n- The buttons do the same: U2 means turn it twice'],
      ['Timer', 'Virtual cube: press Scramble (or F2). You get 15 seconds to look at it, and the clock starts on your first turn and stops when it\'s solved.\n\nReal cube: switch Options > Timer to "Real cube". Scramble your real cube using the moves shown, press and let go of Space to start inspecting, then HOLD Space until the clock goes green and let go to start. Press Space to stop. Just like the competition timers in the magazine.'],
      ['Beginner\'s method', 'The helper works out which step you are on and tells you what to do next. "Show me" makes the pieces you still need to sort out flash. "Try the moves" does the algorithm for you, slowly, so you can watch.\n\nThe steps: white cross, white corners, middle layer, yellow cross, yellow edges, yellow corners in place, twist the corners. That\'s it! It took Jack 3 weeks. It\'ll take you 2.'],
      ['Notation', 'R = right face clockwise. R\' = right face anticlockwise. R2 = right face twice.\n\nClockwise always means clockwise as if you were looking straight at that face. That\'s why L and R seem to go opposite ways. It confused Dave for a whole term.'],
    ]);
    G.helpKey = help;
    G.menu([
      ['Game', () => [
        { label: 'Scramble', key: 'F2', act: scramble },
        { label: 'Reset to Solved', act: reset },
        { label: 'Undo', key: 'Ctrl+Z', dis: !hist.length, act: undo }, '-',
        { label: 'Patterns', sub: [
          { label: 'Chequerboard', act: () => { reset(); queue = parse('M2 E2 S2'); qT = 0; } },
          { label: 'Cube in a Cube', act: () => { reset(); queue = parse("F L F U' R U F2 L2 U' L' B D' B' L2 U"); qT = 0; } },
          { label: 'Six Spots', act: () => { reset(); queue = parse("U D' R L' F B' U D'"); qT = 0; } },
          { label: 'Cross', act: () => { reset(); queue = parse("R2 L' D F2 R' D' R' L U' D R D B2 R' U D2"); qT = 0; } },
        ] },
        { label: 'Best Times...', act: () => scores.show() },
        { label: 'Clear Times List', act: () => G.msg('Cube Net Trainer', 'Clear your list of times? (The best times table is kept.)', 'q', [['Yes', () => { times = []; G.store.set('times', times); ui(); }], ['No']]) }, '-',
        { label: 'Exit', act: () => G.w.close() },
      ]],
      ['Options', () => [
        { label: 'Timer', sub: [
          { label: 'Virtual cube (starts on first turn)', rad: opts.timer === 'virtual', act: () => { opts.timer = 'virtual'; saveOpts(); timer.mode = 'idle'; ui(); } },
          { label: 'Real cube (hold Space)', rad: opts.timer === 'real', act: () => { opts.timer = 'real'; saveOpts(); timer.mode = 'idle'; ui(); } },
        ] },
        { label: '15 Second Inspection', chk: opts.insp, act: () => { opts.insp = !opts.insp; saveOpts(); } },
      ]],
      ['Help', () => [
        { label: 'Help Topics', key: 'F1', act: help }, '-',
        { label: 'About Cube Net Trainer', act: () => G.about({ ver: 'Version 1.3', blurb: 'A puzzle cube you can carry on a floppy disk. 43 quintillion positions. Only one of them is right.', credits: [['Programming', 'Jack'], ['Cube maths', 'Jack + Mr Okafor'], ['Beginner\'s method notes', 'Jack (age: classified)'], ['Stickers', '54 (none peeled off)'], ['Testing', Cast.t('Cousin {cousin} (solved it upside down)')], ['Not testing', 'Dave (peeled the stickers off his real one)'], ['Timer idea', 'The magazine competition'], ['Moral support', 'Gubbinz'], ['Snacks', 'Mom']] }) },
      ]],
    ]);
    G.dbg = () => ({ solved: isSolved(cube), stage: stage(cube).id, moves, hist: hist.length, timer: timer.mode, scrambled });
    G.test = { apply: (alg) => { for (const [m, q] of parse(alg)) apply(m, q, true); }, raw: { solvedCube, turn, parse, isSolved, isChecker, stage, faces }, scramble };
    // the cube is saved (js/gamesave.js): where every sticker is, the scramble, moves, undo and a running timer (it waits
    // while the window is shut)
    const saver = G.saver(() => {
      if (!scrambled && isSolved(cube)) return null; // solved (or never touched): nothing to carry on with
      const now = performance.now(), byId = cube.slice().sort((a, b) => a.id - b.id);
      return { s: byId.map(s => s.p.concat(s.n)), hist: hist.slice(-150), moves, scr: scrambled ? 1 : 0, txt: scrText, tm: timer.mode === 'run' ? 'run' : timer.mode === 'done' ? 'done' : 'idle', el: timer.mode === 'run' ? Math.round(now - timer.t0) : 0, last: timer.last || 0 };
    }, { v: 1, live: true });
    function resume() {
      const v = saver.load(); if (!v || !Array.isArray(v.s) || v.s.length !== 54 || !v.s.every(a => Array.isArray(a) && a.length === 6 && a.every(x => x === -1 || x === 0 || x === 1))) return false;
      const c = solvedCube(); c.forEach((s, i) => { s.p = v.s[i].slice(0, 3); s.n = v.s[i].slice(3); s.flash = 0; });
      cube = c; hist = (Array.isArray(v.hist) ? v.hist : []).filter(h => Array.isArray(h) && MOVES[h[0]] && h[1] >= 1 && h[1] <= 3); moves = v.moves | 0; scrambled = !!v.scr; scrText = String(v.txt || '').slice(0, 200);
      queue = []; showMe = false;
      timer = { mode: v.tm === 'run' || v.tm === 'done' ? v.tm : 'idle', t0: performance.now() - (+v.el || 0), insp0: 0, hold0: 0, last: v.last | 0 };
      return true;
    }
    resume();
    narrowCheck(); ui(); kick();
  });
})();

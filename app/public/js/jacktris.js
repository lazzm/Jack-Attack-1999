/* JACKTRIS.EXE - Jack's homemade Tetris. Shared high scores and a worldwide lines counter. */
(function () {
  const cv = document.getElementById('tris');
  if (!cv) return;
  const $ = id => document.getElementById(id);
  const g = cv.getContext('2d');
  const COLS = 10, ROWS = 20, S = 20;
  const LCD = ['#9bbc0f', '#8bac0f', '#306230', '#0f380f'];
  // pieces as 4x4 rotation states (bitmask rows), shade per piece
  const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  };
  const SHADE = { I: 3, O: 2, T: 3, S: 2, Z: 3, J: 2, L: 3 };
  const JUNK = 4; // knockout junk rows
  let rng = Math.random, mode = 'solo', junk = 0, lastSent = '', inBattle = false;
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rotate = m => m[0].map((_, i) => m.map(r => r[i]).reverse());

  let board, piece, next, bag, score, lines, level, state, dropAcc, lockT, best = 0, scores = [], myLast = null, sinceSend = 0;
  // saved game (js/gamesave.js, which loads after this file, so the saver is made when first needed): a solo game carries
  // on after a refresh, PAUSED, with the exact board, piece, next piece and score. Knockouts are live, so never saved.
  let fromBattle = false, carry = false, sv = null;
  const saver = () => sv || (window.GameSave ? (sv = GameSave.gameSaver('jacktris', () => {
    if (fromBattle || mode === 'battle' || state === 'idle' || !board) return undefined;
    if (state === 'over') return null;
    return { board, piece, next, bag, score, lines, level };
  }, { v: 1, live: true, delay: 400 })) : null);
  const saveSoon = () => { const s = saver(); if (s) s.save(); };

  function newBag() { const b = Object.keys(SHAPES); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function take() { if (!bag.length) bag = newBag(); return bag.pop(); }
  function spawn() {
    const k = next; next = take();
    piece = { k, m: SHAPES[k].map(r => r.slice()), x: k === 'O' ? 4 : 3, y: k === 'I' ? -1 : 0 };
    if (collides(piece.m, piece.x, piece.y)) gameOver();
    drawNext();
  }
  function reset(seed) {
    rng = seed ? mulberry(seed) : Math.random; mode = seed ? 'battle' : 'solo'; junk = 0; fromBattle = !!seed; carry = false;
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    bag = newBag(); next = take(); score = 0; lines = 0; level = 0; dropAcc = 0; lockT = 0; sinceSend = 0;
    state = 'play'; spawn(); hud();
    $('trisMsg').textContent = 'Arrows move, Up rotates, Space drops, P pauses.';
  }
  function collides(m, x, y) {
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const bx = x + c, by = y + r;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
    return false;
  }
  function move(dx) { if (state === 'play' && !collides(piece.m, piece.x + dx, piece.y)) { piece.x += dx; lockT = 0; Sound.play('click'); } }
  function rot() {
    if (state !== 'play' || piece.k === 'O') return;
    const m = rotate(piece.m);
    for (const k of [0, -1, 1, -2, 2]) if (!collides(m, piece.x + k, piece.y)) { piece.m = m; piece.x += k; lockT = 0; Sound.play('click'); return; }
  }
  function soft() { if (state !== 'play') return; if (!collides(piece.m, piece.x, piece.y + 1)) { piece.y++; score += 1; hud(); } else lock(); }
  function hard() {
    if (state !== 'play') return;
    let n = 0; while (!collides(piece.m, piece.x, piece.y + 1)) { piece.y++; n++; }
    score += n * 2; lock(); Sound.play('thud');
  }
  function lock() {
    let over = false;
    piece.m.forEach((row, r) => row.forEach((v, c) => { if (!v) return; const y = piece.y + r; if (y < 0) over = true; else board[y][piece.x + c] = SHADE[piece.k]; }));
    if (over) return gameOver();
    const full = board.map((row, i) => row.every(Boolean) ? i : -1).filter(i => i >= 0);
    if (full.length) {
      for (const i of full) { board.splice(i, 1); board.unshift(Array(COLS).fill(0)); }
      score += [0, 40, 100, 300, 1200][full.length] * (level + 1);
      lines += full.length; level = Math.floor(lines / 10);
      sinceSend += full.length;
      Net.send({ t: 'lines', n: full.length });
      if (mode === 'battle') { // attack! (cancel your own incoming junk first)
        let atk = [0, 0, 1, 2, 4][full.length];
        const cancel = Math.min(junk, atk); junk -= cancel; atk -= cancel;
        if (atk > 0) Net.send({ t: 'btAttack', n: atk });
      }
      Sound.play(full.length === 4 ? 'solve' : 'pet');
      $('trisMsg').textContent = ['', 'Single!', 'Double!', 'Triple!', 'JACKTRIS!!! Four lines!'][full.length];
    }
    if (junk > 0) addJunk();
    if (state !== 'play') return;
    hud(); spawn(); saveSoon();
  }
  function addJunk() { // incoming junk rows rise from the bottom, one hole each batch
    const n = Math.min(junk, 8), hole = Math.floor(Math.random() * COLS); junk -= n;
    for (let i = 0; i < n; i++) {
      if (board[0].some(Boolean)) { gameOver(); return; }
      board.shift(); const row = Array(COLS).fill(JUNK); row[hole] = 0; board.push(row);
    }
    Sound.play('thud'); $('trisMsg').textContent = 'JUNK INCOMING!!!';
  }
  function gameOver() {
    state = 'over';
    if (!fromBattle && saver()) saver().clear();
    Sound.play('uhoh');
    sendBoard(true);
    if (mode === 'battle') { mode = 'solo'; if (!Net.send({ t: 'btKO' })) pendKO = true; $('trisMsg').textContent = `KNOCKED OUT! ${score} points. Stay and watch who wins!`; hud(); return; }
    $('trisMsg').textContent = `GAME OVER. ${score} points. Press Start to play again.`;
    if (score > best) best = score;
    const qualifies = score > 0 && (scores.length < 10 || score > scores[scores.length - 1].s);
    if (qualifies && window.Desk) {
      let last = ''; try { last = localStorage.getItem('jhp_initials') || ''; } catch (e) {}
      Desk.ask('NEW HIGH SCORE!', `${score} points! Enter your initials for the JACKTRIS high-score table:`, last, 3, name => {
        name = (name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 3).trim();
        if (!name) return;
        try { localStorage.setItem('jhp_initials', name); } catch (e) {}
        myLast = { n: name, s: score };
        const sc = { t: 'score', g: 'tris', n: name, s: score };
        if (!Net.send(sc)) { pendScore = sc; $('trisMsg').textContent = 'Not connected! Your score will be sent when JackNet is back.'; }
      });
    }
    hud();
  }
  function hud() {
    $('trisScore').textContent = score; $('trisLines').textContent = lines; $('trisLevel').textContent = level;
    $('trisStart').textContent = state === 'play' ? 'Pause' : state === 'pause' ? 'Resume' : 'Start';
    $('trisStart').disabled = mode === 'battle';
  }

  // ---------------------------------------------------------------- drawing (Game Boy green)
  function cell(x, y, shade, ghost) {
    const px = x * S, py = y * S;
    if (ghost) { g.strokeStyle = LCD[2]; g.lineWidth = 1; g.strokeRect(px + 2.5, py + 2.5, S - 5, S - 5); return; }
    if (shade === JUNK) { g.fillStyle = LCD[2]; g.fillRect(px + 1, py + 1, S - 2, S - 2); g.fillStyle = LCD[1]; g.fillRect(px + 4, py + 4, 4, 4); g.fillRect(px + 12, py + 12, 4, 4); return; }
    g.fillStyle = LCD[shade]; g.fillRect(px + 1, py + 1, S - 2, S - 2);
    g.fillStyle = LCD[shade === 3 ? 1 : 0]; g.fillRect(px + 5, py + 5, S - 10, S - 10);
    g.fillStyle = LCD[shade]; g.fillRect(px + 7, py + 7, S - 14, S - 14);
  }
  function draw() {
    g.fillStyle = LCD[0]; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = LCD[1]; for (let x = 1; x < COLS; x++) g.fillRect(x * S, 0, 1, ROWS * S);
    board.forEach((row, y) => row.forEach((v, x) => { if (v) cell(x, y, v); }));
    if (state === 'play' || state === 'pause') {
      let gy = piece.y; while (!collides(piece.m, piece.x, gy + 1)) gy++;
      piece.m.forEach((row, r) => row.forEach((v, c) => { if (v && gy + r >= 0) cell(piece.x + c, gy + r, 0, true); }));
      piece.m.forEach((row, r) => row.forEach((v, c) => { if (v && piece.y + r >= 0) cell(piece.x + c, piece.y + r, SHADE[piece.k]); }));
    }
    if (state !== 'play') {
      g.fillStyle = 'rgba(155,188,15,.85)'; g.fillRect(0, 160, cv.width, 80);
      g.fillStyle = LCD[3]; g.textAlign = 'center'; g.font = 'bold 22px "Courier New", monospace';
      g.fillText(countdownText || (state === 'pause' ? 'PAUSED' : state === 'over' ? 'GAME OVER' : 'JACKTRIS'), cv.width / 2, 196);
      g.font = 'bold 12px "Courier New", monospace';
      g.fillText(state === 'over' ? 'press START' : state === 'pause' ? (carry ? 'Press any key to carry on' : 'press P') : 'press START', cv.width / 2, 222);
    }
  }
  const nc = $('trisNext').getContext('2d');
  function drawNext() {
    nc.fillStyle = LCD[0]; nc.fillRect(0, 0, 80, 60);
    const m = SHAPES[next], w = m[0].length * 16, h = m.filter(r => r.some(Boolean)).length * 16;
    const ox = (80 - w) / 2, oy = (60 - h) / 2 - (next === 'I' ? 16 : 0);
    m.forEach((row, r) => row.forEach((v, c) => { if (v) { nc.fillStyle = LCD[SHADE[next]]; nc.fillRect(ox + c * 16 + 1, oy + r * 16 + 1, 14, 14); nc.fillStyle = LCD[1]; nc.fillRect(ox + c * 16 + 5, oy + r * 16 + 5, 6, 6); } }));
  }

  // ---------------------------------------------------------------- loop
  const speed = () => Math.max(60, 800 - level * 70);
  let last = 0, visible = true, running = false;
  function frame(now) {
    if (!visible) { running = false; if (state === 'play' && mode !== 'battle') { state = 'pause'; hud(); } if (mode !== 'battle') return; }
    const dt = Math.min(100, now - last); last = now;
    if (state === 'play') {
      dropAcc += dt;
      if (dropAcc >= speed()) {
        dropAcc = 0;
        if (!collides(piece.m, piece.x, piece.y + 1)) { piece.y++; lockT = 0; }
        else if ((lockT += speed()) >= 400) lock();
      }
    }
    draw();
    requestAnimationFrame(frame);
  }
  function kick() { if (!running && visible) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  if (window.IntersectionObserver) new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }).observe(cv);

  // ---------------------------------------------------------------- controls
  let focused = false;
  cv.tabIndex = 0;
  cv.addEventListener('focus', () => { focused = true; });
  cv.addEventListener('blur', () => { focused = false; });
  cv.addEventListener('pointerdown', () => { cv.focus(); if (carry && state === 'pause') { carry = false; state = 'play'; hud(); } });
  document.addEventListener('keydown', ev => {
    if (!focused) return;
    const k = ev.key;
    if (carry && state === 'pause' && !ev.ctrlKey && !ev.altKey && !ev.metaKey && !/^(Shift|Control|Alt|Meta|Tab)$/.test(k)) { ev.preventDefault(); carry = false; state = 'play'; hud(); $('trisMsg').textContent = 'Arrows move, Up rotates, Space drops, P pauses.'; return; }
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(k)) ev.preventDefault();
    if (k === 'ArrowLeft') move(-1); else if (k === 'ArrowRight') move(1);
    else if (k === 'ArrowUp' || k === 'x' || k === 'X') rot();
    else if (k === 'ArrowDown') soft();
    else if (k === ' ') hard();
    else if (k === 'p' || k === 'P' || k === 'Enter') startPause();
  });
  function startPause() {
    if (mode === 'battle') return; // no pausing in a knockout!
    if (state === 'play') { state = 'pause'; saveSoon(); }
    else if (state === 'pause') { state = 'play'; carry = false; }
    else reset();
    hud(); cv.focus();
  }
  $('trisStart').addEventListener('click', startPause);
  const hold = (id, fn) => { // touch buttons repeat while held
    const b = $(id); let t = null;
    const stop = () => { clearInterval(t); t = null; };
    b.addEventListener('pointerdown', ev => { ev.preventDefault(); fn(); stop(); t = setInterval(fn, 110); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => b.addEventListener(e, stop));
  };
  hold('trisL', () => move(-1)); hold('trisR', () => move(1)); hold('trisD', soft);
  $('trisRot').addEventListener('pointerdown', ev => { ev.preventDefault(); rot(); });
  $('trisDrop').addEventListener('pointerdown', ev => { ev.preventDefault(); hard(); });
  $('trisMusic').addEventListener('click', () => {
    if (Sound.music.playing === 'tris') { Sound.music.stop(); $('trisMusic').textContent = 'Music: OFF'; }
    else { Sound.music.stop(); Sound.music.play('tris'); $('trisMusic').textContent = 'Music: A'; }
  });

  // ---------------------------------------------------------------- shared bits
  function renderScores() {
    const ol = $('trisScores'); ol.innerHTML = '';
    if (!scores.length) { ol.innerHTML = '<li>nobody yet!</li>'; return; }
    for (const e of scores) {
      const li = document.createElement('li'); li.textContent = `${e.n.padEnd(3, ' ')} ${String(e.s).padStart(6, ' ')}`;
      if (myLast && e.n === myLast.n && e.s === myLast.s) li.className = 'me';
      ol.appendChild(li);
    }
  }
  Net.on('welcome', m => { scores = (m.scores && m.scores.tris) || []; renderScores(); $('trisWorld').textContent = (m.trisLines || 0).toLocaleString('en-GB'); });
  Net.on('scores', m => { if (m.g === 'tris') { scores = m.list; renderScores(); } });
  Net.on('lines', m => { $('trisWorld').textContent = m.total.toLocaleString('en-GB'); });

  // ---------------------------------------------------------------- live boards (spectating) + the knockout arena
  let countdownText = '';
  function boardString() {
    const b = board.map(r => r.slice());
    if (piece && (state === 'play' || state === 'pause')) piece.m.forEach((row, r) => row.forEach((v, c) => { const y = piece.y + r; if (v && y >= 0 && y < ROWS) b[y][piece.x + c] = SHADE[piece.k]; }));
    return b.map(r => r.join('')).join('');
  }
  function sendBoard(force) {
    const str = boardString(), on = state === 'play' || state === 'pause';
    const key = str + score + on;
    if (!force && key === lastSent) return;
    lastSent = key;
    Net.send({ t: 'board', b: str, s: score, l: lines, on });
  }
  setInterval(() => { if (state === 'play' || state === 'pause') sendBoard(); }, 300);
  const others = new Map(); // id -> { el, cv, t, nick }
  function drawMini(cv, str, ko) {
    const c = cv.getContext('2d');
    c.fillStyle = LCD[0]; c.fillRect(0, 0, 50, 100);
    for (let i = 0; i < 200; i++) { const v = +str[i]; if (!v) continue; c.fillStyle = v === JUNK ? LCD[2] : LCD[v]; c.fillRect((i % 10) * 5, (i / 10 | 0) * 5, 5, 5); }
    if (ko) { c.fillStyle = 'rgba(15,56,15,.75)'; c.fillRect(0, 38, 50, 22); c.fillStyle = LCD[0]; c.font = 'bold 12px monospace'; c.textAlign = 'center'; c.fillText('K.O.', 25, 54); }
  }
  Net.on('board', m => {
    let o = others.get(m.id);
    if (!o) {
      const el = document.createElement('div'); el.className = 'mini';
      el.innerHTML = '<canvas width="50" height="100"></canvas><b></b><span></span>';
      o = { el, cv: el.querySelector('canvas') }; others.set(m.id, o);
      const box = $('liveBoards'); const none = box.querySelector('.none'); if (none) none.remove();
      box.appendChild(el);
    }
    o.t = Date.now(); o.nick = m.nick; o.ko = !m.on;
    o.el.querySelector('b').textContent = m.nick + (m.bt ? ' \u2694' : '');
    o.el.querySelector('span').textContent = m.on ? m.s + ' pts' : 'game over';
    o.el.classList.toggle('off', !m.on);
    drawMini(o.cv, m.b, !m.on && m.bt);
  });
  function dropOther(id) { const o = others.get(id); if (o) { o.el.remove(); others.delete(id); } if (!others.size) $('liveBoards').innerHTML = '<span class="none">Nobody else is playing right now.</span>'; }
  Net.on('trisGone', m => dropOther(m.id));
  setInterval(() => { for (const [id, o] of others) if (Date.now() - o.t > (o.ko ? 20000 : 45000)) dropOther(id); }, 5000);

  let bview = { state: 'lobby', players: [] }, cdTimer = null;
  function renderArena() {
    const me = Net.me.id, inIt = bview.players.some(p => p.id === me);
    inBattle = inIt;
    $('btPlayers').innerHTML = bview.players.map(p => `<span class="btp${p.alive ? '' : ' ko'}${p.id === me ? ' me' : ''}">${p.nick.replace(/[<>&]/g, '')}${p.alive ? '' : ' (K.O.)'}</span>`).join('');
    $('btJoin').textContent = inIt ? 'Leave' : 'Join the next battle';
    $('btJoin').disabled = bview.state === 'playing' && !inIt;
    $('btStart').hidden = !(inIt && bview.state === 'lobby' && bview.players.length >= 2);
    clearInterval(cdTimer); countdownText = '';
    const n = bview.players.length;
    if (bview.state === 'lobby') $('btStatus').textContent = n ? `${n} in the arena. ${n < 2 ? 'Need one more player!' : 'Anyone in it can press START!'}` : 'Nobody in the arena yet.';
    else if (bview.state === 'countdown') {
      const tick = () => { const left = Math.max(0, Math.ceil((bview.goAt - Date.now()) / 1000)); $('btStatus').textContent = `KNOCKOUT STARTS IN ${left}...`; if (inIt) countdownText = left ? 'GET READY: ' + left : ''; };
      tick(); cdTimer = setInterval(tick, 250);
      if (inIt) { if (state === 'play') { state = 'pause'; } hud(); cv.focus(); }
    } else if (bview.state === 'playing') $('btStatus').textContent = `KNOCKOUT IN PROGRESS: ${bview.players.filter(p => p.alive).length} still standing!`;
  }
  // back after a connection blip: the server held our place for 20 seconds. Still in? carry on. Not any more? say so.
  let pendKO = false, pendScore = null;
  Net.on('welcome', m => {
    bview = m.battle || bview; renderArena(); renderWins(m.trisWins || []);
    const meIn = bview.state === 'playing' && bview.players.some(p => p.id === Net.me.id && p.alive);
    if (pendKO) { pendKO = false; if (meIn) Net.send({ t: 'btKO' }); }
    else if (mode === 'battle' && !meIn) { mode = 'solo'; if (state === 'play') { state = 'over'; sendBoard(true); } $('trisMsg').textContent = 'Your connection dropped for too long, so the knockout went on without you. Sorry!'; hud(); }
    else if (mode === 'battle') $('trisMsg').textContent = 'Reconnected! Still in the knockout. Keep going!';
    if (pendScore) { const sc = pendScore; pendScore = null; setTimeout(() => Net.send(sc), 500); }
  });
  Net.on('bt', m => { bview = m.b; renderArena(); });
  Net.on('online', () => renderArena());
  Net.on('btGo', m => {
    if (!m.ids.includes(Net.me.id)) return;
    reset(m.seed); countdownText = ''; cv.focus();
    $('trisMsg').textContent = 'KNOCKOUT! Clear lines to send junk. Last one standing wins!';
    Sound.play('waaagh');
  });
  Net.on('btJunk', m => { if (mode !== 'battle') return; junk += m.n; $('trisMsg').textContent = `${m.from} sent you ${m.n} junk line${m.n > 1 ? 's' : ''}!!!`; Sound.play('zap'); });
  Net.on('btEnd', m => {
    renderWins(m.wins || []);
    if (m.winner && m.winner === Net.me.nick && inBattle) {
      if (state === 'play') { state = 'over'; mode = 'solo'; sendBoard(true); hud(); }
      $('trisMsg').textContent = 'YOU WON THE KNOCKOUT!!! GET IN!!!'; Sound.play('solve');
      Desk.msgbox('JACKTRIS KNOCKOUT', 'YOU WIN!!! Last one standing. Your name goes on the champions board!', 'info');
    } else if (m.winner) $('trisMsg').textContent = `${m.winner} won the knockout!`;
    mode = 'solo';
  });
  function renderWins(list) { $('btWins').innerHTML = list.length ? list.map(([n, w]) => `<li>${n.replace(/[<>&]/g, '')} <b>${w}</b> win${w > 1 ? 's' : ''}</li>`).join('') : '<li>nobody yet!</li>'; }
  $('btJoin').addEventListener('click', () => Net.send({ t: inBattle ? 'btLeave' : 'btJoin' }));
  $('btStart').addEventListener('click', () => Net.send({ t: 'btStart' }));

  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); bag = newBag(); next = take(); score = 0; lines = 0; level = 0; state = 'idle';
  drawNext(); hud(); kick();
  // carry on a saved solo game (paused)
  function resumeSaved() {
    const s = saver(), d = s && s.load();
    if (!d || state !== 'idle' || mode === 'battle') return;
    const okRow = r => Array.isArray(r) && r.length === COLS && r.every(v => v >= 0 && v <= JUNK);
    if (!Array.isArray(d.board) || d.board.length !== ROWS || !d.board.every(okRow) || !d.piece || !SHAPES[d.piece.k] || !Array.isArray(d.piece.m) || !SHAPES[d.next] || !Array.isArray(d.bag)) { s.clear(); return; }
    board = d.board; piece = { k: d.piece.k, m: d.piece.m, x: d.piece.x | 0, y: d.piece.y | 0 }; next = d.next; bag = d.bag.filter(k => SHAPES[k]);
    score = d.score | 0; lines = d.lines | 0; level = d.level | 0; dropAcc = 0; lockT = 0; mode = 'solo'; fromBattle = false;
    state = 'pause'; carry = true;
    $('trisMsg').textContent = 'Your saved game! Press any key to carry on.';
    drawNext(); hud(); draw();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resumeSaved); else setTimeout(resumeSaved, 0);
})();

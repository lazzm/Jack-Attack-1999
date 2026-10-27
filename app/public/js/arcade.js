/* The JACK ATTACK! arcade cabinet: one canvas, lots of games, shared high-score tables. */
(function () {
  const cv = document.getElementById('arcade');
  if (!cv) return;
  const $ = id => document.getElementById(id);
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const irnd = n => Math.floor(Math.random() * n);
  const GAMES = {}, ORDER = [];
  const register = def => { GAMES[def.id] = def; ORDER.push(def.id); };

  // ---------------------------------------------------------------- shared drawing helpers
  function text(s, x, y, size, col, align, font) {
    g.font = `${size}px ${font || '"Courier New", monospace'}`; g.textAlign = align || 'center'; g.fillStyle = col || '#fff'; g.fillText(s, x, y);
  }
  function bevel(x, y, w, h, up) {
    g.fillStyle = '#c0c0c0'; g.fillRect(x, y, w, h);
    g.fillStyle = up ? '#fff' : '#808080'; g.fillRect(x, y, w, 2); g.fillRect(x, y, 2, h);
    g.fillStyle = up ? '#808080' : '#fff'; g.fillRect(x, y + h - 2, w, 2); g.fillRect(x + w - 2, y, 2, h);
  }
  // little arcade sprites, drawn with flat fills + one highlight so they read at any size
  function saucer(x, y, s, col) { // a flying saucer (Saucer Invaders)
    g.fillStyle = '#7ad8ff'; g.beginPath(); g.ellipse(x, y - s * .15, s * .28, s * .3, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#fff'; g.fillRect(x - s * .14, y - s * .36, s * .1, s * .1);
    g.fillStyle = col || '#b8c0c8'; g.beginPath(); g.ellipse(x, y, s * .6, s * .2, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, y + s * .06, s * .6, s * .13, 0, 0, Math.PI); g.fill();
    const blink = Math.floor(performance.now() / 250) % 3;
    for (let k = -1; k <= 1; k++) { g.fillStyle = k + 1 === blink ? '#ffd400' : '#ff5a3a'; g.fillRect(x + k * s * .3 - s * .05, y - s * .03, s * .1, s * .1); }
  }
  function robotHead(x, y, s, hit) { // a tin robot head (Whack-a-Robot)
    g.fillStyle = '#404850'; g.fillRect(x - s * .03, y - s * .78, s * .06, s * .3); g.fillStyle = hit ? '#808080' : '#ff3a2a'; g.beginPath(); g.arc(x, y - s * .8, s * .08, 0, 7); g.fill();
    g.fillStyle = '#9aa4ae'; g.fillRect(x - s * .62, y - s * .2, s * .12, s * .3); g.fillRect(x + s * .5, y - s * .2, s * .12, s * .3);
    g.fillStyle = hit ? '#8a9098' : '#c8d0d8'; g.fillRect(x - s * .5, y - s * .5, s, s * .9);
    g.fillStyle = '#eef2f6'; g.fillRect(x - s * .5, y - s * .5, s, s * .08); g.fillRect(x - s * .5, y - s * .5, s * .08, s * .9);
    g.fillStyle = '#6a747e'; g.fillRect(x + s * .42, y - s * .42, s * .08, s * .82); g.fillRect(x - s * .5, y + s * .32, s, s * .08);
    if (hit) { g.strokeStyle = '#202020'; g.lineWidth = Math.max(1, s * .05); for (const d of [-1, 1]) { const ex = x + d * s * .22; g.beginPath(); g.moveTo(ex - s * .09, y - s * .24); g.lineTo(ex + s * .09, y - s * .08); g.moveTo(ex + s * .09, y - s * .24); g.lineTo(ex - s * .09, y - s * .08); g.stroke(); } }
    else { g.fillStyle = '#101820'; g.fillRect(x - s * .34, y - s * .28, s * .24, s * .2); g.fillRect(x + s * .1, y - s * .28, s * .24, s * .2); g.fillStyle = '#4aff6a'; g.fillRect(x - s * .3, y - s * .25, s * .12, s * .1); g.fillRect(x + s * .14, y - s * .25, s * .12, s * .1); }
    g.fillStyle = '#303840'; g.fillRect(x - s * .28, y + s * .06, s * .56, s * .16); g.fillStyle = '#9aa4ae'; for (let k = 0; k < 4; k++) g.fillRect(x - s * .24 + k * s * .14, y + s * .06, s * .04, s * .16);
  }
  function bunny(x, y, s, hit) { // the bunny you must NOT whack
    g.fillStyle = '#fff'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(x + d * s * .22, y - s * .6, s * .12, s * .38, d * .15, 0, 7); g.fill(); }
    g.fillStyle = '#ffb0c8'; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(x + d * s * .22, y - s * .58, s * .05, s * .26, d * .15, 0, 7); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, s * .45, s * .4, 0, 0, 7); g.fill();
    g.fillStyle = '#000'; if (hit) { g.fillRect(x - s * .24, y - s * .06, s * .14, s * .04); g.fillRect(x + s * .1, y - s * .06, s * .14, s * .04); } else { g.beginPath(); g.arc(x - s * .17, y - s * .06, s * .06, 0, 7); g.arc(x + s * .17, y - s * .06, s * .06, 0, 7); g.fill(); }
    g.fillStyle = '#ff7aa0'; g.beginPath(); g.arc(x, y + s * .08, s * .06, 0, 7); g.fill();
  }
  function astronaut(x, y, s, sad) { // Save the Astronaut
    g.fillStyle = '#f4f4f4'; g.fillRect(x - s * .32, y + s * .3, s * .64, s * .6); g.fillRect(x - s * .5, y + s * .34, s * .18, s * .4); g.fillRect(x + s * .32, y + s * .34, s * .18, s * .4);
    g.fillStyle = '#c8c8d0'; g.fillRect(x - s * .3, y + s * .9, s * .24, s * .3); g.fillRect(x + s * .06, y + s * .9, s * .24, s * .3);
    g.fillStyle = '#e83a2a'; g.fillRect(x - s * .12, y + s * .42, s * .24, s * .14);
    g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(x, y, s * .48, 0, 7); g.fill(); g.strokeStyle = '#808890'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = sad ? '#3a3a50' : '#2a5ad8'; g.beginPath(); g.ellipse(x, y + s * .02, s * .34, s * .26, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - s * .24, y - s * .14, s * .14, s * .08);
  }
  function blackHole(x, y, w) {
    for (let k = 5; k >= 0; k--) { g.fillStyle = ['#000', '#1a0a2a', '#3a1a5a', '#6a2a8a', '#a04ac0', '#e080ff'][k]; g.beginPath(); g.ellipse(x, y, w * (.2 + k * .16), w * (.05 + k * .035), 0, 0, 7); g.fill(); }
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(x, y, w * .2, w * .06, 0, 0, 7); g.fill();
  }

  // ================================================================ SNAKE (Nokia style)
  register({ id: 'snake', name: 'Snake', tag: 'Like on Dad\'s Talkbrik', controls: 'Arrow keys or drag the mouse', fmt: s => s,
    create(api, d) {
      const C = 20, CW = 24, CH = 17;
      let snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }], dir = { x: 1, y: 0 }, next = dir, food = null, acc = 0, score = 0, speed = 120;
      const place = () => { do { food = { x: irnd(CW), y: irnd(CH) }; } while (snake.some(p => p.x === food.x && p.y === food.y)); };
      place();
      if (d && Array.isArray(d.snake) && d.snake.length && d.dir && d.food) { snake = d.snake; dir = next = d.dir; food = d.food; score = d.score | 0; speed = d.speed || 120; }
      const turn = (dx, dy) => { if (dx !== -dir.x || dy !== -dir.y) next = { x: dx, y: dy }; };
      let sw = null;
      return {
        key(k) { if (k === 'ArrowLeft') turn(-1, 0); else if (k === 'ArrowRight') turn(1, 0); else if (k === 'ArrowUp') turn(0, -1); else if (k === 'ArrowDown') turn(0, 1); },
        pointer(t, x, y) { if (t === 'down') sw = { x, y }; else if (t === 'up' && sw) { const dx = x - sw.x, dy = y - sw.y; if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy)); sw = null; } },
        update(dt) {
          acc += dt; if (acc < speed) return; acc = 0;
          dir = next;
          const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
          if (h.x < 0 || h.y < 0 || h.x >= CW || h.y >= CH || snake.some(p => p.x === h.x && p.y === h.y)) return api.over(score);
          snake.unshift(h);
          if (h.x === food.x && h.y === food.y) { score += 10; speed = Math.max(60, speed - 2); api.sfx('click'); place(); } else snake.pop();
        },
        save: () => ({ snake, dir, food, score, speed }),
        state() { return { sc: score, b: snake.slice(0, 80).map(p => p.x + ',' + p.y).join(' ') }; },
        draw() {
          g.fillStyle = '#9bbc0f'; g.fillRect(0, 0, W, H);
          g.fillStyle = '#0f380f'; g.fillRect(0, 0, W, 20); text('SNAKE  ' + String(score).padStart(5, '0'), 10, 15, 14, '#9bbc0f', 'left');
          const oy = 20;
          g.strokeStyle = '#0f380f'; g.lineWidth = 2; g.strokeRect(1, oy + 1, CW * C - 2, CH * C - 2);
          // other people playing Snake right now show up as ghost snakes (see site.js, Net.relay 'site.arc')
          if (window.SiteArcade) for (const o of SiteArcade.list('snake')) if (o.st && o.st.b) {
            g.fillStyle = o.col; g.globalAlpha = 0.35;
            o.st.b.split(' ').slice(0, 80).forEach(cell => { const [x, y] = cell.split(',').map(Number); if (x >= 0 && y >= 0 && x < CW && y < CH) g.fillRect(x * C + 4, oy + y * C + 4, C - 8, C - 8); });
            g.globalAlpha = 1; const hd = o.st.b.split(' ')[0].split(',').map(Number); if (hd.length === 2) text(o.nick, hd[0] * C + C / 2, oy + hd[1] * C - 3, 10, '#0f380f');
          }
          g.fillStyle = '#0f380f';
          snake.forEach((p, i) => g.fillRect(p.x * C + 2, oy + p.y * C + 2, C - 4, C - 4));
          g.fillRect(food.x * C + 6, oy + food.y * C + 2, 8, 4); g.fillRect(food.x * C + 2, oy + food.y * C + 6, 16, 10);
        },
      };
    } });

  // ================================================================ JACK SWEEPER (Minesweeper, but the mines are Y2K bugs)
  register({ id: 'sweep', name: 'Jack Sweeper', tag: 'Bugsweeper, but with Y2K bugs. Don\'t poke them.', controls: 'Click to dig, right-click (or click and hold) to flag', asc: true, fmt: s => s + ' sec', noTitle: true,
    create(api, d) {
      const N = 9, M = 10, C = 30, ox = (W - N * C) / 2, oy = 70;
      let cells, first = true, t0 = 0, t = 0, dead = false, won = false, pressing = null, hold = null;
      const reset = () => { cells = Array.from({ length: N * N }, () => ({ m: false, open: false, flag: false, n: 0 })); first = true; t0 = 0; t = 0; dead = false; won = false; };
      reset();
      if (d && Array.isArray(d.cells) && d.cells.length === N * N) { cells = d.cells; first = !!d.first; t = +d.t || 0; t0 = performance.now() - t * 1000; }
      const nb = i => { const x = i % N, y = i / N | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < N && ny < N) out.push(ny * N + nx); } return out; };
      function lay(safe) { let k = 0; while (k < M) { const i = irnd(N * N); if (i === safe || cells[i].m || nb(safe).includes(i)) continue; cells[i].m = true; k++; } cells.forEach((c, i) => { c.n = nb(i).filter(j => cells[j].m).length; }); }
      function open(i) {
        const c = cells[i]; if (c.open || c.flag) return;
        if (first) { first = false; lay(i); t0 = performance.now(); }
        c.open = true;
        if (c.m) { dead = true; cells.forEach(d => { if (d.m) d.open = true; }); api.sfx('waaagh'); setTimeout(() => api.over(null, 'A Y2K BUG GOT YOU!'), 900); return; }
        if (!c.n) nb(i).forEach(open);
        if (cells.every(d => d.m || d.open)) { won = true; api.sfx('solve'); const secs = Math.max(1, Math.round(t)); setTimeout(() => api.over(secs, 'YOU FOUND ALL THE BUGS!'), 600); }
      }
      const at = (x, y) => { const cx = Math.floor((x - ox) / C), cy = Math.floor((y - oy) / C); return cx >= 0 && cy >= 0 && cx < N && cy < N ? cy * N + cx : -1; };
      const face = { x: W / 2 - 18, y: 18, s: 36 };
      return {
        pointer(type, x, y, btn) {
          if (dead || won) { if (type === 'up' && x > face.x && x < face.x + face.s && y > face.y && y < face.y + face.s) { reset(); } return; }
          if (type === 'down') {
            if (x > face.x && x < face.x + face.s && y > face.y && y < face.y + face.s) { reset(); return; }
            const i = at(x, y); if (i < 0) return;
            if (btn === 2) { if (!cells[i].open) { cells[i].flag = !cells[i].flag; api.sfx('click'); } return; }
            pressing = i;
            hold = setTimeout(() => { if (pressing === i && !cells[i].open) { cells[i].flag = !cells[i].flag; api.sfx('click'); pressing = null; } }, 450);
          } else if (type === 'up') {
            clearTimeout(hold);
            if (pressing !== null && at(x, y) === pressing) { open(pressing); if (!dead) api.sfx('click'); }
            pressing = null;
          }
        },
        update() { if (!first && !dead && !won) t = (performance.now() - t0) / 1000; },
        save: () => (dead || won || first ? null : { cells, first, t }),
        resume() { t0 = performance.now() - t * 1000; },
        draw() {
          g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, W, H);
          bevel(ox - 10, 10, N * C + 20, 52, false);
          const lcd = (v, x) => { g.fillStyle = '#000'; g.fillRect(x, 20, 54, 32); text(String(Math.max(0, Math.min(999, v))).padStart(3, '0'), x + 27, 46, 28, '#e10600', 'center', '"Courier New", monospace'); };
          lcd(M - cells.filter(c => c.flag).length, ox); lcd(Math.floor(t), ox + N * C - 54);
          bevel(face.x, face.y, face.s, face.s, pressing === null);
          g.fillStyle = '#ffd400'; g.beginPath(); g.arc(W / 2, 36, 12, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke();
          g.fillStyle = '#000';
          if (dead) { text('x x', W / 2, 36, 10, '#000'); g.fillRect(W / 2 - 5, 41, 10, 2); }
          else if (won) { g.fillRect(W / 2 - 9, 31, 18, 4); g.beginPath(); g.arc(W / 2, 39, 5, 0, Math.PI); g.stroke(); }
          else if (pressing !== null) { g.fillRect(W / 2 - 5, 32, 2, 2); g.fillRect(W / 2 + 3, 32, 2, 2); g.beginPath(); g.arc(W / 2, 41, 3, 0, 7); g.stroke(); }
          else { g.fillRect(W / 2 - 5, 32, 2, 2); g.fillRect(W / 2 + 3, 32, 2, 2); g.beginPath(); g.arc(W / 2, 38, 5, 0.2, Math.PI - 0.2); g.stroke(); }
          const NCOL = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000', '#808080'];
          cells.forEach((c, i) => {
            const x = ox + (i % N) * C, y = oy + (i / N | 0) * C;
            if (!c.open) { bevel(x, y, C, C, pressing !== i); if (c.flag) { g.fillStyle = '#000'; g.fillRect(x + 14, y + 8, 2, 14); g.fillStyle = '#e10600'; g.beginPath(); g.moveTo(x + 16, y + 7); g.lineTo(x + 8, y + 11); g.lineTo(x + 16, y + 15); g.fill(); } return; }
            g.fillStyle = c.m && dead ? '#ff4040' : '#c0c0c0'; g.fillRect(x, y, C, C); g.strokeStyle = '#808080'; g.strokeRect(x + .5, y + .5, C - 1, C - 1);
            if (c.m) { const mx = x + C / 2, my = y + C / 2 + 1; g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); for (const d of [-1, 1]) for (const k of [-4, 0, 4]) { g.moveTo(mx + d * 6, my + k); g.lineTo(mx + d * 11, my + k - 2); } g.moveTo(mx - 2, my - 8); g.lineTo(mx - 5, my - 12); g.moveTo(mx + 2, my - 8); g.lineTo(mx + 5, my - 12); g.stroke(); g.fillStyle = '#202020'; g.beginPath(); g.arc(mx, my - 7, 3.5, 0, 7); g.fill(); g.fillStyle = '#e8281b'; g.beginPath(); g.ellipse(mx, my + 1, 7, 8, 0, 0, 7); g.fill(); g.fillStyle = '#000'; g.fillRect(mx - .5, my - 6, 1, 15); g.font = 'bold 7px Arial'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('2K', mx, my + 4); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(mx - 5, my - 4, 2, 2); }
            else if (c.n) text(c.n, x + C / 2, y + 22, 20, NCOL[c.n], 'center', 'bold "Arial", sans-serif');
          });
        },
      };
    } });

  // ================================================================ BRICK BASH (Breakout)
  register({ id: 'bricks', name: 'Brick Bash', tag: 'Smash every brick', controls: 'Mouse or arrows, click or Space to launch', fmt: s => s,
    create(api, d) {
      const COLS = ['#e10600', '#ff8000', '#ffd400', '#2a9a2a', '#0028c8', '#8000ff'];
      let px = W / 2, pw = 70, ball, bricks, score = 0, lives = 3, level = 1, stuck = true;
      const build = () => { bricks = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) bricks.push({ x: 20 + c * 44, y: 50 + r * 18, r, alive: true }); };
      const serve = () => { ball = { x: px, y: H - 40, vx: rnd(-2, 2), vy: -(3.4 + level * 0.4) }; stuck = true; };
      build(); serve();
      if (d && Array.isArray(d.alive) && d.alive.length === bricks.length) { d.alive.forEach((a, i) => { bricks[i].alive = !!a; }); score = d.score | 0; lives = d.lives || 3; level = d.level || 1; px = d.px || px; serve(); }
      return {
        save: () => ({ alive: bricks.map(b => (b.alive ? 1 : 0)), score, lives, level, px }),
        key(k) { if (k === ' ' && stuck) stuck = false; },
        pointer(t, x) { px = Math.max(pw / 2, Math.min(W - pw / 2, x)); if (t === 'down' && stuck) stuck = false; },
        update(dt, keys) {
          if (keys.has('ArrowLeft')) px = Math.max(pw / 2, px - 7); if (keys.has('ArrowRight')) px = Math.min(W - pw / 2, px + 7);
          if (stuck) { ball.x = px; ball.y = H - 40; return; }
          ball.x += ball.vx; ball.y += ball.vy;
          if (ball.x < 6 || ball.x > W - 6) { ball.vx *= -1; ball.x = Math.max(6, Math.min(W - 6, ball.x)); }
          if (ball.y < 30) { ball.vy = Math.abs(ball.vy); }
          if (ball.y > H - 34 && ball.y < H - 24 && Math.abs(ball.x - px) < pw / 2 + 5 && ball.vy > 0) {
            ball.vy = -Math.abs(ball.vy); ball.vx = (ball.x - px) / (pw / 2) * 5; api.sfx('click');
          }
          if (ball.y > H) { lives--; api.sfx('uhoh'); if (lives <= 0) return api.over(score); serve(); }
          for (const b of bricks) {
            if (!b.alive || ball.x < b.x - 4 || ball.x > b.x + 44 || ball.y < b.y - 4 || ball.y > b.y + 20) continue;
            b.alive = false; ball.vy *= -1; score += (6 - b.r) * 10; api.sfx('turn'); break;
          }
          if (bricks.every(b => !b.alive)) { level++; build(); serve(); api.sfx('solve'); }
        },
        draw() {
          g.fillStyle = '#000020'; g.fillRect(0, 0, W, H);
          text(`SCORE ${score}`, 10, 20, 14, '#fff', 'left'); text(`LEVEL ${level}`, W / 2, 20, 14, '#ffd400'); text('♥'.repeat(lives), W - 10, 20, 14, '#e10600', 'right');
          for (const b of bricks) if (b.alive) { g.fillStyle = COLS[b.r]; g.fillRect(b.x, b.y, 42, 16); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(b.x, b.y, 42, 3); }
          g.fillStyle = '#c0c0c0'; g.fillRect(px - pw / 2, H - 30, pw, 8); g.fillStyle = '#fff'; g.fillRect(px - pw / 2, H - 30, pw, 2);
          g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, 6, 0, 7); g.fill();
          if (stuck) text('CLICK OR SPACE TO LAUNCH', W / 2, H / 2 + 60, 14, '#ffd400');
        },
      };
    } });

  // ================================================================ ORK INVADERS
  register({ id: 'invaders', name: 'Saucer Invaders', tag: 'The saucers are coming!', controls: 'Arrows to move, Space to shoot', fmt: s => s,
    create(api, d) {
      let px = W / 2, shots = [], bombs = [], orks, dir = 1, step = 0, speed = 600, acc = 0, score = 0, lives = 3, wave = 1, cool = 0;
      const build = () => { orks = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) orks.push({ x: 60 + c * 46, y: 50 + r * 34, r, alive: true }); speed = Math.max(140, 600 - wave * 60); };
      build();
      if (d && Array.isArray(d.orks) && d.orks.length) { score = d.score | 0; lives = d.lives || 3; wave = d.wave || 1; build(); orks = d.orks; dir = d.dir === -1 ? -1 : 1; px = d.px || px; }
      const fire = () => { if (cool <= 0 && shots.length < 2) { shots.push({ x: px, y: H - 40 }); cool = 300; api.sfx('zap'); } };
      return {
        save: () => ({ orks, score, lives, wave, dir, px }),
        key(k) { if (k === ' ' || k === 'ArrowUp') fire(); },
        pointer(t, x) { px = Math.max(16, Math.min(W - 16, x)); if (t === 'down') fire(); },
        update(dt, keys) {
          cool -= dt;
          if (keys.has('ArrowLeft')) px = Math.max(16, px - 4); if (keys.has('ArrowRight')) px = Math.min(W - 16, px + 4);
          acc += dt;
          const live = orks.filter(o => o.alive);
          if (acc > speed * (live.length / 32 + 0.15)) {
            acc = 0; step++;
            const edge = live.some(o => (dir > 0 && o.x > W - 30) || (dir < 0 && o.x < 30));
            if (edge) { dir *= -1; live.forEach(o => { o.y += 16; }); } else live.forEach(o => { o.x += dir * 10; });
            if (live.length && Math.random() < 0.5) { const o = live[irnd(live.length)]; bombs.push({ x: o.x, y: o.y + 12 }); }
          }
          shots.forEach(s => { s.y -= 7; }); shots = shots.filter(s => s.y > 0);
          bombs.forEach(b => { b.y += 3 + wave * 0.3; }); bombs = bombs.filter(b => b.y < H);
          for (const s of shots) for (const o of orks) if (o.alive && Math.abs(s.x - o.x) < 16 && Math.abs(s.y - o.y) < 14) { o.alive = false; s.y = -99; score += (4 - o.r) * 10; api.sfx('thud'); }
          for (const b of bombs) if (Math.abs(b.x - px) < 16 && b.y > H - 44 && b.y < H - 20) { b.y = H + 9; lives--; api.sfx('uhoh'); if (lives <= 0) return api.over(score); }
          if (live.some(o => o.alive && o.y > H - 60)) return api.over(score);
          if (!orks.some(o => o.alive)) { wave++; build(); bombs = []; api.sfx('solve'); }
        },
        draw() {
          g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
          text(`SCORE ${score}`, 10, 20, 14, '#3f3', 'left'); text(`WAVE ${wave}`, W / 2, 20, 14, '#ffd400'); text('▲'.repeat(lives), W - 10, 20, 14, '#00e5ff', 'right');
          for (const o of orks) if (o.alive) saucer(o.x, o.y + (step % 2) * 2, 22, ['#c8d0d8', '#b8e0a0', '#e0c0f0', '#f0d890'][o.r]);
          g.fillStyle = '#00e5ff'; g.fillRect(px - 16, H - 30, 32, 10); g.fillRect(px - 4, H - 38, 8, 8);
          g.fillStyle = '#fff'; shots.forEach(s => g.fillRect(s.x - 1, s.y - 8, 3, 10));
          g.fillStyle = '#ff4040'; bombs.forEach(b => g.fillRect(b.x - 2, b.y - 6, 4, 8));
          g.fillStyle = '#2a9a2a'; g.fillRect(0, H - 14, W, 2);
        },
      };
    } });

  // ================================================================ SPACE ROCKS (Asteroids)
  register({ id: 'rocks', name: 'Space Rocks', tag: 'Blast the rocks. Don\'t get squished.', controls: 'Left/Right turn, Up thrust, Space fire', fmt: s => s,
    create(api, d) {
      let ship = { x: W / 2, y: H / 2, a: -Math.PI / 2, vx: 0, vy: 0, inv: 2000 }, rocks = [], shots = [], score = 0, lives = 3, level = 1, cool = 0;
      const rock = (x, y, s) => ({ x, y, s, vx: rnd(-1.5, 1.5) * (4 - s) * .5, vy: rnd(-1.5, 1.5) * (4 - s) * .5, sh: Array.from({ length: 9 }, () => rnd(0.75, 1.15)) });
      const spawn = () => { rocks = []; for (let i = 0; i < 3 + level; i++) { let x, y; do { x = rnd(0, W); y = rnd(0, H); } while (Math.hypot(x - ship.x, y - ship.y) < 120); rocks.push(rock(x, y, 3)); } };
      spawn();
      if (d && d.level) { score = d.score | 0; lives = d.lives || 3; level = d.level; spawn(); }
      const wrap = o => { o.x = (o.x + W) % W; o.y = (o.y + H) % H; };
      const fire = () => { if (cool <= 0) { shots.push({ x: ship.x + Math.cos(ship.a) * 12, y: ship.y + Math.sin(ship.a) * 12, vx: Math.cos(ship.a) * 7 + ship.vx, vy: Math.sin(ship.a) * 7 + ship.vy, life: 55 }); cool = 180; api.sfx('zap'); } };
      return {
        save: () => ({ score, lives, level }),
        key(k) { if (k === ' ') fire(); },
        update(dt, keys) {
          cool -= dt; ship.inv -= dt;
          if (keys.has('ArrowLeft')) ship.a -= 0.08; if (keys.has('ArrowRight')) ship.a += 0.08;
          if (keys.has('ArrowUp')) { ship.vx += Math.cos(ship.a) * 0.12; ship.vy += Math.sin(ship.a) * 0.12; }
          if (keys.has(' ')) fire();
          ship.vx *= 0.99; ship.vy *= 0.99; ship.x += ship.vx; ship.y += ship.vy; wrap(ship);
          shots.forEach(s => { s.x += s.vx; s.y += s.vy; s.life--; wrap(s); }); shots = shots.filter(s => s.life > 0);
          rocks.forEach(r => { r.x += r.vx; r.y += r.vy; wrap(r); });
          for (const s of shots) for (const r of rocks) {
            if (r.dead || Math.hypot(s.x - r.x, s.y - r.y) > r.s * 12) continue;
            r.dead = true; s.life = 0; score += [0, 100, 50, 20][r.s]; api.sfx('thud');
            if (r.s > 1) rocks.push(rock(r.x, r.y, r.s - 1), rock(r.x, r.y, r.s - 1));
          }
          rocks = rocks.filter(r => !r.dead);
          if (ship.inv <= 0) for (const r of rocks) if (Math.hypot(ship.x - r.x, ship.y - r.y) < r.s * 12 + 6) {
            lives--; api.sfx('waaagh'); if (lives <= 0) return api.over(score);
            Object.assign(ship, { x: W / 2, y: H / 2, vx: 0, vy: 0, inv: 2500 }); break;
          }
          if (!rocks.length) { level++; spawn(); }
        },
        draw(keys) {
          g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
          g.strokeStyle = '#fff'; g.lineWidth = 1.5;
          for (const r of rocks) { g.beginPath(); r.sh.forEach((m, i) => { const a = i / r.sh.length * Math.PI * 2, rr = r.s * 12 * m; i ? g.lineTo(r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr) : g.moveTo(r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr); }); g.closePath(); g.stroke(); }
          if (ship.inv <= 0 || Math.floor(ship.inv / 120) % 2) {
            g.save(); g.translate(ship.x, ship.y); g.rotate(ship.a);
            g.beginPath(); g.moveTo(12, 0); g.lineTo(-9, -8); g.lineTo(-5, 0); g.lineTo(-9, 8); g.closePath(); g.stroke();
            if (keys.has('ArrowUp') && Math.random() < .7) { g.strokeStyle = '#ffd400'; g.beginPath(); g.moveTo(-6, -4); g.lineTo(-15, 0); g.lineTo(-6, 4); g.stroke(); }
            g.restore();
          }
          g.fillStyle = '#fff'; shots.forEach(s => g.fillRect(s.x - 1, s.y - 1, 3, 3));
          text(String(score).padStart(6, '0'), 10, 20, 16, '#fff', 'left'); text('A'.repeat(lives), W - 10, 20, 16, '#fff', 'right');
        },
      };
    } });

  // ================================================================ JACK PONG
  register({ id: 'pong', name: 'Jack Pong', tag: 'You vs the computer. First to 5 loses.', controls: 'Mouse or Up/Down', fmt: s => s + ' pts',
    create(api, d) {
      let py = H / 2, cy = H / 2, ball, me = 0, cpu = 0, wait = 800;
      const serve = d => { ball = { x: W / 2, y: H / 2, vx: 4 * d, vy: rnd(-3, 3) }; wait = 700; };
      serve(1);
      if (d) { me = d.me | 0; cpu = d.cpu | 0; }
      return {
        save: () => ({ me, cpu }),
        pointer(t, x, y) { py = Math.max(30, Math.min(H - 30, y)); },
        update(dt, keys) {
          if (keys.has('ArrowUp')) py = Math.max(30, py - 6); if (keys.has('ArrowDown')) py = Math.min(H - 30, py + 6);
          cy += Math.max(-4.2, Math.min(4.2, (ball.y - cy) * 0.12));
          if (wait > 0) { wait -= dt; return; }
          ball.x += ball.vx; ball.y += ball.vy;
          if (ball.y < 6 || ball.y > H - 6) { ball.vy *= -1; ball.y = Math.max(6, Math.min(H - 6, ball.y)); }
          if (ball.x < 30 && ball.x > 16 && Math.abs(ball.y - py) < 34 && ball.vx < 0) { ball.vx = Math.min(11, -ball.vx * 1.06); ball.vy += (ball.y - py) * 0.12; api.sfx('click'); }
          if (ball.x > W - 30 && ball.x < W - 16 && Math.abs(ball.y - cy) < 34 && ball.vx > 0) { ball.vx = -Math.min(11, ball.vx * 1.06); ball.vy += (ball.y - cy) * 0.1; api.sfx('click'); }
          if (ball.x < 0) { cpu++; api.sfx('uhoh'); if (cpu >= 5) return api.over(me); serve(1); }
          if (ball.x > W) { me++; api.sfx('pet'); serve(-1); }
        },
        draw() {
          g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
          g.fillStyle = '#555'; for (let y = 0; y < H; y += 20) g.fillRect(W / 2 - 1, y, 2, 10);
          text(me, W / 2 - 50, 50, 40, '#fff'); text(cpu, W / 2 + 50, 50, 40, '#fff');
          g.fillStyle = '#3f3'; g.fillRect(16, py - 30, 10, 60);
          g.fillStyle = '#ff4040'; g.fillRect(W - 26, cy - 30, 10, 60);
          g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, 6, 0, 7); g.fill(); g.fillStyle = '#c0c0c0'; g.beginPath(); g.arc(ball.x + 1.5, ball.y + 1.5, 3.5, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(ball.x - 3, ball.y - 3, 2, 2);
        },
      };
    } });

  // ================================================================ WHACK-A-GROT
  register({ id: 'whack', name: 'Whack-a-Robot', tag: '30 seconds. Whack the robots, NOT the bunnies!', controls: 'Click, or keys 1-9', fmt: s => s,
    create(api, d) {
      const holes = Array.from({ length: 9 }, (_, i) => ({ x: 100 + (i % 3) * 140, y: 100 + Math.floor(i / 3) * 100, up: 0, kind: 'grot', hit: 0 }));
      let score = 0, time = 30000, next = 500;
      if (d && d.time > 0) { score = d.score | 0; time = Math.min(30000, d.time); }
      const whack = i => { const h = holes[i]; if (h.up <= 0 || h.hit) return; h.hit = 300; if (h.kind === 'grot') { score += 10; api.sfx('thud'); } else { score = Math.max(0, score - 20); api.sfx('uhoh'); } };
      return {
        save: () => ({ score, time }),
        key(k) { const n = +k; if (n >= 1 && n <= 9) whack(n - 1); },
        pointer(t, x, y) { if (t !== 'down') return; holes.forEach((h, i) => { if (Math.abs(x - h.x) < 50 && Math.abs(y - h.y) < 45) whack(i); }); },
        update(dt) {
          time -= dt; if (time <= 0) return api.over(score);
          next -= dt;
          if (next <= 0) { const free = holes.filter(h => h.up <= 0); if (free.length) { const h = free[irnd(free.length)]; h.up = rnd(600, 1100) * (0.6 + time / 75000); h.kind = Math.random() < 0.18 ? 'squig' : 'grot'; h.hit = 0; } next = rnd(250, 600); }
          holes.forEach(h => { if (h.up > 0) h.up -= dt; if (h.hit > 0) { h.hit -= dt; if (h.hit <= 0) h.up = 0; } });
        },
        draw() {
          g.fillStyle = '#3a8a2a'; g.fillRect(0, 0, W, H);
          text(`SCORE ${score}`, 12, 24, 18, '#fff', 'left'); text(`TIME ${Math.ceil(time / 1000)}`, W - 12, 24, 18, time < 5000 ? '#ffd400' : '#fff', 'right');
          holes.forEach((h, i) => {
            g.fillStyle = '#2a1a0a'; g.beginPath(); g.ellipse(h.x, h.y + 20, 45, 16, 0, 0, 7); g.fill();
            if (h.up > 0) {
              g.save(); g.beginPath(); g.rect(h.x - 60, h.y - 70, 120, 90); g.clip();
              if (h.kind === 'grot') robotHead(h.x, h.y - 5 + (h.hit ? 10 : 0), 44, h.hit);
              else bunny(h.x, h.y + 4, 46, h.hit);
              g.restore();
              if (h.hit) text(h.kind === 'grot' ? 'BONK!' : 'AWW!', h.x, h.y - 40, 16, '#ffd400', 'center', 'bold Arial');
            }
            text(i + 1, h.x + 50, h.y + 30, 11, 'rgba(255,255,255,.5)');
          });
        },
      };
    } });

  // ================================================================ SIMON SAYS
  register({ id: 'simon', name: 'Simon Says', tag: 'Copy the pattern. It gets longer.', controls: 'Click the pads, or keys 1-4', fmt: s => s + ' rounds',
    create(api, d) {
      const PADS = [{ c: '#c00', l: '#ff5050', f: 330 }, { c: '#080', l: '#4f4', f: 392 }, { c: '#00a', l: '#58f', f: 262 }, { c: '#aa0', l: '#ff4', f: 523 }];
      let seq = [irnd(4)], pos = 0, showing = true, si = 0, st = 600, lit = -1, litT = 0, round = 0;
      const flash = i => { lit = i; litT = 300; Sound.note && Sound.note(PADS[i].f, 0.28); };
      const press = i => {
        if (showing) return;
        flash(i);
        if (i !== seq[pos]) { Sound.note && Sound.note(110, 0.6, 'sawtooth'); return api.over(round); }
        pos++;
        if (pos === seq.length) { round++; seq.push(irnd(4)); pos = 0; showing = true; si = 0; st = 900; }
      };
      const rects = [[60, 40], [W / 2 + 10, 40], [60, H / 2 + 10], [W / 2 + 10, H / 2 + 10]];
      if (d && Array.isArray(d.seq) && d.seq.length && d.seq.every(i => i >= 0 && i < 4)) { seq = d.seq; round = d.round | 0; pos = 0; showing = true; si = 0; st = 900; }
      return {
        save: () => ({ seq, round }),
        key(k) { const n = +k; if (n >= 1 && n <= 4) press(n - 1); },
        pointer(t, x, y) { if (t !== 'down') return; rects.forEach(([rx, ry], i) => { if (x > rx && x < rx + 170 && y > ry && y < ry + 130) press(i); }); },
        update(dt) {
          if (litT > 0) { litT -= dt; if (litT <= 0) lit = -1; }
          if (!showing) return;
          st -= dt;
          if (st <= 0) { if (si < seq.length) { flash(seq[si]); si++; st = Math.max(280, 600 - round * 20); } else { showing = false; } }
        },
        draw() {
          g.fillStyle = '#222'; g.fillRect(0, 0, W, H);
          rects.forEach(([x, y], i) => { g.fillStyle = lit === i ? PADS[i].l : PADS[i].c; g.fillRect(x, y, 170, 130); text(i + 1, x + 14, y + 22, 14, 'rgba(255,255,255,.6)'); });
          g.fillStyle = '#111'; g.beginPath(); g.arc(W / 2, H / 2 + 5, 46, 0, 7); g.fill();
          text(showing ? 'WATCH' : 'YOU!', W / 2, H / 2, 14, '#fff'); text(`ROUND ${round + 1}`, W / 2, H / 2 + 22, 12, '#ffd400');
        },
      };
    } });

  // ================================================================ HANGMAN (Save the Grot)
  register({ id: 'hangman', name: 'Save the Astronaut', tag: 'Hangman, but the astronaut\'s oxygen is running out', controls: 'Type letters, or click them', fmt: s => s + ' words',
    create(api, d) {
      const WORDS = ['ZAPACHU', 'SQUIRTURTLE', 'DAYDREAM', 'GOLDENBALLS', 'EGGBERT', 'ULTRA ENTERTAINMENT', 'PLAYSPACE', 'MILLENNIUM', 'MATRIX', 'LIGHTSPATULA', 'PEAPODRACING', 'MODEM', 'FURBO', 'ZELDO', 'KAZOOBIE', 'ASTRONAUT', 'ROCKET', 'SPUDNIK', 'WAR HAMSTER', 'BLOCKOLOGY', 'JOYSTICK', 'CARTRIDGE', 'FLOPPY', 'SCREENSAVER', 'GUESTBOOK', 'ECLIPSE', 'DINOSAUR', 'SPACESHIP', 'GAMEBOY', 'RUMBLE', 'EXPANSION', 'WORMS', 'ZIP', 'MARLO', 'DONKEY', 'METROAD', 'ROBOT', 'SPACE CADET', 'WOOKIE-COOKIE', 'TRANSFORMER', 'CYBERSPACE', 'NETSCAPEGOAT', 'MAINFRAME', 'PIXEL', 'POLYGON', 'MEGABYTE', 'PENT-YUM', 'GNAPSTER', 'WEBRING', 'HYPERLINK'];
      let word, got, wrong, streak = 0, done = 0;
      const nextWord = () => { word = WORDS[irnd(WORDS.length)]; got = new Set(); wrong = new Set(); done = 0; };
      nextWord();
      if (d) { streak = d.streak | 0; if (d.word && WORDS.includes(d.word)) { word = d.word; got = new Set(d.got || []); wrong = new Set(d.wrong || []); } }
      const guess = L => {
        if (done || !/^[A-Z]$/.test(L) || got.has(L) || wrong.has(L)) return;
        if (word.includes(L)) { got.add(L); api.sfx('click'); if ([...word].every(c => got.has(c))) { streak++; done = 1; api.sfx('solve'); setTimeout(nextWord, 1300); } }
        else { wrong.add(L); api.sfx('thud'); if (wrong.size >= 6) { done = 2; api.sfx('uhoh'); setTimeout(() => api.over(streak, 'The word was ' + word), 1300); } }
      };
      const keys = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
      const kpos = i => ({ x: 26 + (i % 13) * 33, y: 290 + Math.floor(i / 13) * 32 });
      return {
        save: () => (done === 2 ? null : { word: done ? null : word, got: [...got], wrong: [...wrong], streak }),
        key(k) { guess(k.toUpperCase()); },
        pointer(t, x, y) { if (t !== 'down') return; keys.forEach((L, i) => { const p = kpos(i); if (x > p.x - 14 && x < p.x + 14 && y > p.y - 20 && y < p.y + 8) guess(L); }); },
        update() {},
        draw() {
          g.fillStyle = '#fffef6'; g.fillRect(0, 0, W, H);
          g.strokeStyle = '#a8c8ff'; for (let y = 30; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
          // the black hole, the tether and the astronaut drifting lower with every wrong letter
          blackHole(385, 246, 150);
          g.strokeStyle = '#6b4a2a'; g.lineWidth = 6; g.beginPath(); g.moveTo(300, 236); g.lineTo(300, 20); g.lineTo(390, 20); g.stroke();
          const gy = 60 + wrong.size * 22;
          g.lineWidth = 2; g.strokeStyle = '#000'; g.beginPath(); g.moveTo(385, 20); g.lineTo(385, gy - 18); g.stroke();
          astronaut(385, gy, 30, done === 2);
          text(done === 2 ? 'AAARGH!' : done === 1 ? 'SAVED!' : wrong.size >= 4 ? 'HELP!!!' : '', 385, gy - 26, 14, '#e10600', 'center', 'bold Arial');
          text(`SAVED: ${streak}`, 12, 24, 16, '#0028c8', 'left', 'bold "Courier New", monospace');
          const shown = [...word].map(c => got.has(c) || done === 2 ? c : '_').join(' ');
          text(shown, 150, 140, word.length > 9 ? 20 : 26, '#000', 'center', 'bold "Courier New", monospace');
          text('Wrong: ' + [...wrong].join(' '), 150, 190, 14, '#c00', 'center');
          keys.forEach((L, i) => { const p = kpos(i), used = got.has(L) || wrong.has(L); g.fillStyle = used ? '#ccc' : '#ffd400'; g.fillRect(p.x - 14, p.y - 20, 28, 26); text(L, p.x, p.y, 16, used ? '#888' : '#000', 'center', 'bold Arial'); });
        },
      };
    } });

  // ================================================================ the cabinet: select, title, play, game over, high scores
  let cur = null, inst = null, mode = 'title', final = null, finalMsg = '', scores = {}, myLast = null, guestBest = null;
  // saved games (js/gamesave.js loads after this file, so the savers are made when first needed): a game in progress on
  // each cabinet is kept (key arcade.<game>) and comes back PAUSED ("press any key to carry on") after a refresh, or when
  // you pick that game again. Game over clears it.
  let held = false;
  const SAVERS = {};
  const saver = id => SAVERS[id] || (window.GameSave ? (SAVERS[id] = GameSave.gameSaver('arcade.' + id, () => {
    if (!cur || cur.id !== id || !inst) return undefined;
    if (mode === 'over') return null;
    if (mode !== 'play' || !inst.save) return undefined;
    const d = inst.save(); return d == null ? null : d;
  }, { v: 1, live: true, every: 5000 })) : null);
  function unhold() { held = false; if (inst && inst.resume) inst.resume(); }
  const keys = new Set();
  function renderBoard() {
    const ol = $('arcadeScores'); if (!cur) return;
    const list = scores[cur.id] || [];
    const rows = list.map(e => `<li${myLast && myLast.g === cur.id && e.n === myLast.n && e.s === myLast.s ? ' class="me"' : ''}>${e.n.padEnd(3, ' ').replace(/[<>&]/g, '')} ${cur.fmt(e.s)}</li>`);
    // a guest's high score shows up greyed where it would go (this computer only), with the way onto the real table
    const gb = guestBest && guestBest.g === cur.id && window.Guest && Guest.is() ? guestBest : null;
    if (gb) {
      const at = list.findIndex(e => (cur.asc ? gb.s < e.s : gb.s > e.s));
      rows.splice(at < 0 ? rows.length : at, 0, `<li class="gst-local" title="Only on this computer: guests don't go on the shared table">YOU ${cur.fmt(gb.s)} (guest)</li>`);
      if (rows.length > 10) rows.length = 10;
    }
    ol.innerHTML = (rows.length ? rows.join('') : '<li>nobody yet!</li>') + (gb ? '<li class="gst-join" style="list-style:none"><a href="#" data-gjoin>Join to get on the High Score table!</a></li>' : '');
    $('arcadeTitle').textContent = cur.name.toUpperCase();
  }
  function select(id) {
    if (cur && inst && mode === 'play' && saver(cur.id)) saver(cur.id).now(); // keep the one you were playing
    cur = GAMES[id]; inst = null; mode = 'title'; final = null; keys.clear(); held = false;
    $('arcadeName').textContent = cur.name; $('arcadeTag').textContent = cur.tag; $('arcadeControls').textContent = cur.controls;
    document.querySelectorAll('.gtile[data-arcade]').forEach(t => t.classList.toggle('on', t.dataset.arcade === id));
    renderBoard();
    const sd = saver(id) && saver(id).load();
    if (sd) { try { start(sd); return; } catch (e) { saver(id).clear(); } }
    if (cur.noTitle) start();
  }
  function start(sd) { inst = cur.create(api, sd || null); mode = 'play'; final = null; held = !!sd; if (sd) Sound.play('click'); cv.focus(); }
  // tell everyone what I'm playing (and, for Snake, where my snake is) so the Games page can show "NICK is playing" and ghosts.
  // These go through the Zone's rate-limited relay (one token bucket for everything this visitor sends, under the server's
  // ~12 a second), at most one every 700 ms, and only every 2.5 s when nothing has changed, so a visitor playing Snake
  // while in an online game never trips the server's limit and loses the game's messages. (site.js forgets a player
  // after 6 s without one.)
  let lastTell = 0, lastSt = '';
  const arcRelay = d => { if (!window.Net || !Net.connected) return false; return window.Zone && Zone.relay ? Zone.relay(0, 'site.arc', d) : Net.relay(0, 'site.arc', d); };
  function tell(over, sc) {
    if (!window.Net || !cur) return;
    if (over) { lastSt = ''; arcRelay({ g: cur.id, over: 1, sc: typeof sc === 'number' ? sc : null }); return; }
    const now = performance.now(); if (now - lastTell < 700) return;
    const st = inst && inst.state ? inst.state() : null, key = cur.id + JSON.stringify(st);
    if (key === lastSt && now - lastTell < 2500) return;
    lastTell = now;
    if (arcRelay({ g: cur.id, st })) lastSt = key;
  }
  const api = {
    sfx: n => Sound.play(n),
    over(score, msg) {
      if (mode !== 'play') return;
      mode = 'over'; final = score; finalMsg = msg || '';
      if (saver(cur.id)) saver(cur.id).clear();
      tell(true, score);
      if (score === null || score === undefined) return;
      const list = scores[cur.id] || [], worst = list[list.length - 1];
      const better = !worst || list.length < 10 || (cur.asc ? score < worst.s : score > worst.s);
      if (score > 0 && better && window.Desk) {
        let last = ''; try { last = localStorage.getItem('jhp_initials') || ''; } catch (e) {}
        const g0 = cur.id, G = GAMES[g0];
        // guests: the score shows on the board greyed, and joining puts it on the real table (no box popping up mid-game)
        if (window.Guest && Guest.is()) { guestBest = { g: g0, s: score, ask: () => askScore(G, g0, score, last) }; renderBoard(); return; }
        askScore(G, g0, score, last);
      }
    },
  };
  function askScore(G, g0, score, last) {
    Desk.ask('NEW HIGH SCORE!', `${G.name}: ${G.fmt(score)}! Enter your initials:`, last, 3, name => {
      name = (name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 3).trim(); if (!name) return;
      try { localStorage.setItem('jhp_initials', name); } catch (e) {}
      myLast = { g: g0, n: name, s: score }; if (guestBest && guestBest.g === g0) guestBest = null;
      Net.send({ t: 'score', g: g0, n: name, s: score });
    });
  }
  $('arcadeScores').addEventListener('click', ev => {
    if (!ev.target.closest('[data-gjoin]') || !guestBest) return;
    ev.preventDefault();
    const gb = guestBest;
    Guest.need('The High Score table', () => { gb.ask(); renderBoard(); });
  });
  Net.on('welcome', m => { scores = m.scores || {}; renderBoard(); });
  Net.on('scores', m => { scores[m.g] = m.list; if (cur && m.g === cur.id) renderBoard(); });

  // input
  cv.tabIndex = 0;
  let focused = false;
  cv.addEventListener('focus', () => { focused = true; }); cv.addEventListener('blur', () => { focused = false; keys.clear(); });
  const GAMEKEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '];
  document.addEventListener('keydown', ev => {
    if (!focused || !cur) return;
    if (GAMEKEYS.includes(ev.key)) ev.preventDefault();
    if (mode !== 'play') { if (ev.key === ' ' || ev.key === 'Enter') start(); return; }
    if (held) { if (!/^(Shift|Control|Alt|Meta|Tab)$/.test(ev.key)) unhold(); return; }
    keys.add(ev.key); if (inst.key) inst.key(ev.key);
  });
  document.addEventListener('keyup', ev => keys.delete(ev.key));
  const pt = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H]; };
  cv.addEventListener('contextmenu', ev => ev.preventDefault());
  cv.addEventListener('pointerdown', ev => {
    cv.focus();
    if (mode !== 'play') { start(); if (!cur.noTitle) return; }
    if (held) { unhold(); return; }
    cv.setPointerCapture(ev.pointerId);
    const [x, y] = pt(ev); if (inst.pointer) inst.pointer('down', x, y, ev.button);
  });
  cv.addEventListener('pointermove', ev => { if (mode === 'play' && inst.pointer) { const [x, y] = pt(ev); inst.pointer('move', x, y, ev.button); } });
  cv.addEventListener('pointerup', ev => { if (mode === 'play' && inst.pointer) { const [x, y] = pt(ev); inst.pointer('up', x, y, ev.button); } });
  // on-screen pad for phones
  document.querySelectorAll('#arcadePad [data-k]').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', ev => { ev.preventDefault(); cv.focus(); if (mode !== 'play') { start(); return; } if (held) { unhold(); return; } keys.add(k); if (inst.key) inst.key(k); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => b.addEventListener(e, () => keys.delete(k)));
  });
  document.querySelectorAll('.gtile[data-arcade]').forEach(t => t.addEventListener('click', () => { select(t.dataset.arcade); showCabinet('arcade'); }));

  // ---- the attract screen behind each game's title: an 80s arcade sky, a neon grid floor and the game's own pixel mascot
  const SPR = {
    ship: ['....w....', '...www...', '...wbw...', '..wwwww..', '.wwrwrww.', 'ww.www.ww', 'w...o...w', '....y....'],
    rock: ['..ggg...', '.gssgg..', 'gsgggsg.', 'ggggkgg.', 'gsggggg.', '.ggkgg..', '..ggg...'],
    saucer: ['....aaa....', '...awwwa...', '.sssssssss.', 'sksksksksks', '.sssssssss.', '..y..y..y..'],
    robot: ['...r...', '...k...', '.sssss.', '.saksa.', '.sssss.', '.skkks.', 'kssssk', '.s...s.', '.k...k.'],
    astro: ['..www..', '.wbbbw.', '.wbabw.', '.wbbbw.', '..www..', '.wwrww.', 'wwwwwww', 'w.www.w', '..w.w..', '.ww.ww.'],
    bug: ['k.....k', '.k...k.', '..kkk..', 'kkrrrkk', '.rkrkr.', 'krrrrrk', '.rkrkr.', 'k.rrr.k'],
    snake: ['.....gggg.', '....gGGGGg', '...gGkGGkG', 'gggGGGGGGg', 'GGGGGGGgg.', 'ggggggr...', '......r...'],
    paddle: ['.oooooooooo.', 'oyyyyyyyyyyo', '.oooooooooo.'],
    ball: ['.ww.', 'wwww', 'wwww', '.ww.'],
    bricks: ['rrrr.yyyy.gggg.bbbb', 'RRRR.oooo.GGGG.aaaa'],
  };
  const SPC = { w: '#ffffff', b: '#2a5ad8', a: '#7ad8ff', r: '#ff3a2a', R: '#ff8a7a', o: '#ff8c00', y: '#ffd400', g: '#3ac83a', G: '#7aff6a', s: '#b8c0c8', k: '#202028' };
  function spr(name, x, y, sc) { const m = SPR[name]; m.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = row[i]; if (c === '.') continue; g.fillStyle = SPC[c] || c; g.fillRect(Math.round(x + i * sc), Math.round(y + j * sc), sc, sc); } }); }
  const MASCOT = {
    bricks: t => { spr('bricks', W / 2 - 57, 186, 6); spr('ball', W / 2 + 30 + Math.sin(t / 300) * 20, 218 - Math.abs(Math.sin(t / 300)) * 12, 3); spr('paddle', W / 2 - 18, 236, 3); },
    hangman: t => spr('astro', W / 2 - 10, 190 + Math.sin(t / 400) * 4, 4),
    invaders: t => spr('saucer', W / 2 - 22 + Math.sin(t / 500) * 40, 196, 4),
    pong: t => { g.fillStyle = '#fff'; g.fillRect(W / 2 - 80, 192, 6, 34); g.fillRect(W / 2 + 74, 200, 6, 34); spr('ball', W / 2 - 6 + Math.sin(t / 350) * 60, 208, 3); },
    rocks: t => { spr('ship', W / 2 - 50, 194, 4); spr('rock', W / 2 + 30, 192 + Math.sin(t / 600) * 6, 5); },
    simon: t => { const lit = Math.floor(t / 500) % 4; [['#c00', '#ff4a3a'], ['#080', '#4aff4a'], ['#008', '#5a8aff'], ['#aa0', '#ffff4a']].forEach(([d, l], i) => { g.fillStyle = i === lit ? l : d; g.fillRect(W / 2 - 30 + (i % 2) * 31, 186 + (i >> 1) * 28, 29, 26); }); },
    snake: t => spr('snake', W / 2 - 20 + Math.sin(t / 700) * 10, 196, 4),
    sweep: t => spr('bug', W / 2 - 14, 194 + Math.abs(Math.sin(t / 250)) * -4, 4),
    whack: t => spr('robot', W / 2 - 14, 190 + Math.max(0, Math.sin(t / 300)) * -8, 4),
  };
  function attract(now) {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#05051a'); sky.addColorStop(.55, '#2a0a4a'); sky.addColorStop(.62, '#ff3a8a'); sky.addColorStop(.63, '#100420'); sky.addColorStop(1, '#100420');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const x = (i * 97) % W, y = (i * 61) % (H * .55); g.fillStyle = (Math.floor(now / 300) + i) % 9 ? '#8a8ab8' : '#fff'; g.fillRect(x, y, i % 7 ? 1 : 2, i % 7 ? 1 : 2); }
    const hz = H * .625; g.strokeStyle = 'rgba(255,60,200,.55)'; g.lineWidth = 1;
    for (let i = -10; i <= 10; i++) { g.beginPath(); g.moveTo(W / 2 + i * 12, hz); g.lineTo(W / 2 + i * 70, H); g.stroke(); }
    const off = (now / 40) % 20; for (let k = 0; k < 9; k++) { const y = hz + Math.pow((k * 20 + off) / 180, 2) * (H - hz); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  }
  function titleText(s, y) {
    g.font = '34px "Bangers", Impact, sans-serif'; g.textAlign = 'center';
    g.lineWidth = 6; g.strokeStyle = '#000'; g.strokeText(s, W / 2 + 3, y + 3); g.strokeText(s, W / 2, y);
    const tg = g.createLinearGradient(0, y - 30, 0, y); tg.addColorStop(0, '#fff6a0'); tg.addColorStop(.5, '#ffd400'); tg.addColorStop(1, '#ff7a00'); g.fillStyle = tg; g.fillText(s, W / 2, y);
  }

  // loop
  let last = 0, visible = true, running = false;
  function frame(now) {
    if (!visible) { running = false; return; }
    const dt = Math.min(50, now - last); last = now;
    if (cur && mode === 'play' && inst && !held) { inst.update(dt, keys); if (mode === 'play') tell(); }
    if (cur && inst) inst.draw(keys);
    else attract(now);
    if (cur && inst && mode === 'play' && held) {
      g.fillStyle = 'rgba(0,0,40,.6)'; g.fillRect(0, H / 2 - 50, W, 100);
      text('PAUSED', W / 2, H / 2 - 10, 28, '#ffd400', 'center', 'bold "Courier New", monospace');
      if (Math.floor(now / 500) % 2) text('PRESS ANY KEY OR CLICK TO CARRY ON', W / 2, H / 2 + 26, 16, '#fff');
    }
    if (cur && mode !== 'play') {
      if (inst) { g.fillStyle = 'rgba(0,0,40,.78)'; g.fillRect(0, 0, W, H); }
      titleText(cur.name.toUpperCase(), 120);
      if (!inst && mode === 'title' && MASCOT[cur.id]) MASCOT[cur.id](now);
      if (mode === 'over') { text(finalMsg || 'GAME OVER', W / 2, 170, 20, '#fff'); if (final !== null && final !== undefined) text(cur.fmt(final), W / 2, 205, 28, '#3f3'); if (guestBest && guestBest.g === cur.id && guestBest.s === final) text('HIGH SCORE! JOIN JACKNET TO GO ON THE TABLE', W / 2, 232, 12, '#ffd400'); }
      else text(cur.tag, W / 2, 170, 14, '#fff');
      if (Math.floor(now / 500) % 2) text(mode === 'over' ? 'CLICK TO PLAY AGAIN' : 'CLICK OR PRESS SPACE TO START', W / 2, 260, 16, '#fff');
      const best = (scores[cur.id] || [])[0];
      if (best) text(`HIGH SCORE: ${best.n} ${cur.fmt(best.s)}`, W / 2, 300, 14, '#00e5ff');
    }
    requestAnimationFrame(frame);
  }
  function kick() { if (!running && visible) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  if (window.IntersectionObserver) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (!visible && mode === 'play') keys.clear(); kick(); }).observe(cv);
  kick();

  // which game cabinet is showing on the Games page (only one at a time, so old PCs don't melt)
  function showCabinet(which) {
    document.querySelectorAll('#s-demos .demo').forEach(d => { d.hidden = d.dataset.demo !== which; });
    window.dispatchEvent(new Event('resize'));
    const el = document.querySelector(`#s-demos .demo[data-demo="${which}"]`);
    if (el) setTimeout(() => el.scrollIntoView({ block: 'start', behavior: 'smooth' }), 30);
  }
  document.querySelectorAll('.gtile[data-demo]').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.gtile').forEach(x => x.classList.toggle('on', x === t));
    showCabinet(t.dataset.demo);
  }));
  window.Arcade = { select, showCabinet, games: ORDER, get current() { return cur ? cur.id : ''; }, get mode() { return mode; } };
  select('snake');
  // after a refresh: back to the cabinet you last had a game going on (newest save)
  function resumeNewest() {
    if (!window.GameSave || !GameSave.gameSaves || inst || mode !== 'title' || !cur || cur.id !== 'snake') return;
    const best = GameSave.gameSaves().filter(x => /^arcade\./.test(x.key) && GAMES[x.key.slice(7)]).sort((a, b) => b.t - a.t)[0];
    if (best) select(best.key.slice(7));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resumeNewest); else setTimeout(resumeNewest, 0);
})();

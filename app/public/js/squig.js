/* SquigLob.exe - pull back da katapult, lob da squig, shared high-score table. */
(function () {
  const cv = document.getElementById('squig');
  if (!cv) return;
  const $ = id => document.getElementById(id);
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const REST = { x: 90, y: 196 }, R = 11, MAXPULL = 100;
  const ground = x => x < 150 ? 250 : 250 + 14 * Math.sin((x - 150) / 97) + 8 * Math.sin((x - 150) / 41 + 1.3) * Math.min(1, (x - 150) / 200);
  const slope = x => (ground(x + 1) - ground(x - 1)) / 2;

  let s, shrooms, wind, camX, state, pull, best = 0, myLast = null, scores = [];

  function rngFrom(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  // everyone gets the same mushroom course each day, so other people's ghost squigs bounce off the ones you see
  const dayCourse = () => { const d = new Date(); return (d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate()) * 2654435761 >>> 0; };
  function makeShrooms() { const rnd = rngFrom(dayCourse()), out = []; for (let x = 420 + rnd() * 200; x < 30000; x += 240 + rnd() * 380) out.push({ x, hit: 0 }); return out; }
  function reset() {
    s = { x: REST.x, y: REST.y, vx: 0, vy: 0, rot: 0, still: 0, bounces: 0, t: 0 };
    shrooms = makeShrooms();
    wind = (Math.random() * 2 - 1) * 0.02;
    camX = 0; state = 'aim'; pull = null;
    const mph = Math.round(Math.abs(wind) * 250);
    $('squigWind').textContent = 'Wind: ' + (mph ? mph + ' mph ' + (wind > 0 ? '→' : '←') : 'calm');
    $('squigMsg').textContent = 'Drag the Blobbit back and let go!';
  }

  function step() {
    stepGhosts();
    if (state !== 'fly') return;
    if (physics(s, shrooms, wind, false)) land();
    camX = Math.max(0, s.x - 220);
  }
  // one physics tick for any squig (yours or a ghost); returns true when it has stopped
  function physics(s, shrooms, wind, quiet) {
    s.t++;
    s.vy += 0.22; s.vx += wind;
    s.x += s.vx; s.y += s.vy; s.rot += s.vx * 0.06;
    if (s.x < R) { s.x = R; s.vx = Math.abs(s.vx) * 0.5; }
    for (const m of shrooms) {
      if (m.x < s.x - 60) continue;
      if (m.x > s.x + 60) break;
      const cy = ground(m.x) - 22;
      if (Math.hypot(s.x - m.x, s.y - cy) < R + 20 && s.vy > 0) {
        s.vy = -Math.max(5, Math.abs(s.vy) * 0.85); s.vx = Math.abs(s.vx) * 0.85; m.hit = 12; s.bounces++;
        if (!quiet) Sound.play('boing');
      }
    }
    const gy = ground(s.x);
    if (s.y + R > gy) {
      s.y = gy - R;
      const sl = slope(s.x), nl = Math.hypot(sl, 1), nx = sl / nl, ny = -1 / nl;
      const vn = s.vx * nx + s.vy * ny;
      if (vn < 0) {
        const e = vn < -2 ? 0.35 : 0;
        s.vx -= (1 + e) * vn * nx; s.vy -= (1 + e) * vn * ny;
        if (vn < -4 && !quiet) Sound.play('thud');
      }
      // rolling resistance; gravity + the normal response already roll it downhill
      const sp = Math.hypot(s.vx, s.vy), k = sp ? Math.max(0, sp * 0.96 - 0.1) / sp : 0;
      s.vx *= k; s.vy *= k;
    }
    if (Math.hypot(s.vx, s.vy) < 0.2 && s.y + R >= ground(s.x) - 1) s.still++; else s.still = 0;
    return s.still > 20 || s.t > 60 * 25;
  }

  // ghosts: everyone else's lobs, live
  const ghosts = [];
  Net.on('sqThrow', m => {
    if (ghosts.length > 6) ghosts.shift();
    ghosts.push({ nick: m.nick, col: m.col, w: m.w, o: { x: REST.x, y: REST.y, vx: m.vx, vy: m.vy, rot: 0, still: 0, bounces: 0, t: 0 }, sh: makeShrooms(), done: 0 });
  });
  function stepGhosts() {
    for (let i = ghosts.length - 1; i >= 0; i--) {
      const gh = ghosts[i];
      if (gh.done) { if (++gh.done > 60 * 5) ghosts.splice(i, 1); continue; }
      if (physics(gh.o, gh.sh, gh.w, true)) gh.done = 1;
    }
  }
  function drawGhosts() {
    for (const gh of ghosts) {
      const sx = gh.o.x - camX, d = ((gh.o.x - REST.x) / 10).toFixed(1) + 'm';
      g.font = 'bold 11px Tahoma, Arial'; g.textAlign = 'center';
      if (sx > W - 10) { g.fillStyle = gh.col; g.fillText(`${gh.nick} ${d} \u2192`, W - 60, 60 + ghosts.indexOf(gh) * 14); continue; }
      if (sx < -20) continue;
      g.globalAlpha = 0.55; drawSquig(sx, gh.o.y, gh.o.rot, 0.9); g.globalAlpha = 1;
      g.fillStyle = gh.col; g.fillText(gh.nick + (gh.done ? ' ' + d : ''), sx, gh.o.y - 18);
    }
  }

  function land() {
    state = 'done';
    const dm = Math.max(0, Math.round(s.x - REST.x)); // decimetres
    const msg = (dm / 10).toFixed(1) + 'm!' + (s.bounces ? ` (${s.bounces} bounce${s.bounces > 1 ? 's' : ''})` : '');
    $('squigMsg').textContent = msg + ' Click to lob again.';
    if (dm > best) best = dm;
    const qualifies = dm > 0 && (scores.length < 10 || dm > scores[scores.length - 1].s);
    if (qualifies && window.Desk) {
      let last = ''; try { last = localStorage.getItem('jhp_initials') || ''; } catch (e) {}
      Desk.ask('NEW HIGH SCORE!', `${(dm / 10).toFixed(1)}m! Enter your initials for the high-score table:`, last, 3, name => {
        name = (name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 3).trim();
        if (!name) return;
        try { localStorage.setItem('jhp_initials', name); } catch (e) {}
        myLast = { n: name, s: dm };
        const sc = { t: 'score', g: 'squig', n: name, s: dm };
        if (!Net.send(sc)) { pendScore = sc; Desk.toast('Blobbit Lob', 'Not connected! Your score will be sent when JackNet is back.', 3500); }
      });
      Sound.play('solve');
    }
  }

  // ---------------------------------------------------------------- drawing
  function drawSquig(x, y, rot, scale) { // a Blobbit: round, bouncy, big eyes, friendly grin
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(scale || 1, scale || 1);
    g.lineWidth = 1; g.strokeStyle = '#4a0a00'; g.lineJoin = 'round';
    g.fillStyle = '#e8381b'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * R * 0.55, -R * 0.85, R * 0.24, R * 0.36, s * 0.5, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.ellipse(s * R * 0.45, R * 0.95, R * 0.3, R * 0.17, 0, 0, 7); g.fill(); g.stroke(); }
    const gr = g.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R); gr.addColorStop(0, '#ffb8a0'); gr.addColorStop(0.35, '#ff4a2a'); gr.addColorStop(1, '#b0180a');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill(); g.stroke();
    for (const s of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(s * R * 0.33, -R * 0.2, R * 0.25, R * 0.31, 0, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(s * R * 0.33 + R * 0.06, -R * 0.13, R * 0.13, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillRect(s * R * 0.33, -R * 0.25, 1, 1); }
    g.fillStyle = '#5a0010'; g.beginPath(); g.arc(0, R * 0.25, R * 0.36, 0.15, Math.PI - 0.15); g.closePath(); g.fill();
    g.fillStyle = '#ff7aa0'; g.beginPath(); g.ellipse(0, R * 0.5, R * 0.16, R * 0.07, 0, 0, 7); g.fill();
    g.restore();
  }
  function draw() {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#4aa8ff'); sky.addColorStop(1, '#bfe6ff');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // far hills (parallax)
    g.fillStyle = '#7fb7d8';
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) { const wx = x + camX * 0.3; g.lineTo(x, 175 + 22 * Math.sin(wx / 130) + 12 * Math.sin(wx / 53)); }
    g.lineTo(W, H); g.fill();
    // ground
    g.fillStyle = '#3a9a2a';
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, ground(x + camX));
    g.lineTo(W, H); g.fill();
    g.fillStyle = '#5c3b1e';
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, ground(x + camX) + 14);
    g.lineTo(W, H); g.fill();
    // distance signs every 10m
    g.font = 'bold 11px Tahoma, Arial'; g.textAlign = 'center';
    const first = Math.ceil((camX - REST.x) / 100) * 100 + REST.x;
    for (let wx = Math.max(first, REST.x + 100); wx < camX + W + 50; wx += 100) {
      const sx = wx - camX, gy = ground(wx);
      g.fillStyle = '#6b4a2a'; g.fillRect(sx - 1, gy - 26, 3, 26);
      g.fillStyle = '#fff'; g.fillRect(sx - 17, gy - 40, 34, 15);
      g.strokeStyle = '#000'; g.lineWidth = 1; g.strokeRect(sx - 17, gy - 40, 34, 15);
      g.fillStyle = '#000'; g.fillText(((wx - REST.x) / 10) + 'm', sx, gy - 29);
    }
    // best-ever marker for the top score
    if (scores[0]) {
      const wx = REST.x + scores[0].s, sx = wx - camX;
      if (sx > -20 && sx < W + 20) {
        const gy = ground(wx);
        g.fillStyle = '#ffd400'; g.fillRect(sx, gy - 52, 2, 52);
        g.beginPath(); g.moveTo(sx + 2, gy - 52); g.lineTo(sx + 26, gy - 46); g.lineTo(sx + 2, gy - 40); g.fill();
        g.fillStyle = '#000'; g.font = 'bold 10px Tahoma, Arial'; g.textAlign = 'left'; g.fillText(scores[0].n, sx + 4, gy - 56); g.textAlign = 'center';
      }
    }
    // mushrooms
    for (const m of shrooms) {
      const sx = m.x - camX; if (sx < -40) continue; if (sx > W + 40) break;
      const gy = ground(m.x), squash = m.hit > 0 ? 1 - m.hit / 30 : 1; if (m.hit > 0) m.hit--;
      g.fillStyle = '#f2e6c9'; g.fillRect(sx - 5, gy - 18, 10, 18);
      g.fillStyle = '#d0201a'; g.beginPath(); g.ellipse(sx, gy - 20, 22, 13 * squash, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#fff'; for (const [dx, dy] of [[-10, -5], [3, -9], [12, -4]]) { g.beginPath(); g.arc(sx + dx, gy - 20 + dy * squash, 3, 0, 7); g.fill(); }
    }
    // katapult
    const kx = REST.x - camX;
    if (kx > -80) {
      g.strokeStyle = '#6b4a2a'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(kx, 250); g.lineTo(kx, 210); g.lineTo(kx - 14, 186); g.moveTo(kx, 210); g.lineTo(kx + 14, 186); g.stroke();
      g.fillStyle = '#7a7a7a'; g.fillRect(kx - 30, 240, 60, 10);
      const sxp = state === 'aim' ? s.x - camX : kx, syp = state === 'aim' ? s.y : 196;
      g.strokeStyle = '#3a2210'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(kx - 14, 186); g.lineTo(sxp, syp); g.lineTo(kx + 14, 186); g.stroke();
      g.fillStyle = '#ffd400'; g.font = '400 18px Bangers, Impact, sans-serif'; g.fillText('THE CATAPULT', kx, 280);
    }
    // aim guide
    if (state === 'aim' && pull) {
      g.fillStyle = 'rgba(255,255,255,.8)';
      let x = s.x, y = s.y, vx = pull.x * 0.2, vy = pull.y * 0.2;
      for (let i = 0; i < 40; i++) { vy += 0.22; vx += wind; x += vx; y += vy; if (i % 3 === 0) { g.beginPath(); g.arc(x - camX, y, 2, 0, 7); g.fill(); } }
    }
    drawGhosts();
    drawSquig(s.x - camX, s.y, s.rot);
    // HUD
    g.textAlign = 'left'; g.font = '400 22px Anton, Impact, sans-serif'; g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 4;
    const d = (Math.max(0, s.x - REST.x) / 10).toFixed(1) + 'm';
    g.strokeText(d, 10, 30); g.fillText(d, 10, 30);
    if (best) { g.font = 'bold 11px Tahoma, Arial'; g.fillStyle = '#000'; g.fillText('YOUR BEST: ' + (best / 10).toFixed(1) + 'm', 10, 46); }
    if (state === 'done') {
      g.textAlign = 'center'; g.font = '400 30px Bangers, Impact, sans-serif'; g.lineWidth = 5;
      g.strokeText('CLICK TO LOB AGAIN', W / 2, 90); g.fillStyle = '#ffd400'; g.fillText('CLICK TO LOB AGAIN', W / 2, 90);
    }
  }

  // ---------------------------------------------------------------- input
  function worldPt(ev) { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) / r.width * W + camX, y: (ev.clientY - r.top) / r.height * H }; }
  cv.addEventListener('pointerdown', ev => {
    if (state === 'done') { reset(); return; }
    if (state !== 'aim') return;
    const p = worldPt(ev);
    if (Math.hypot(p.x - s.x, p.y - s.y) > 60) return;
    cv.setPointerCapture(ev.pointerId);
    pull = { x: 0, y: 0 }; cv.style.cursor = 'grabbing';
  });
  cv.addEventListener('pointermove', ev => {
    if (!pull) return;
    const p = worldPt(ev);
    let dx = REST.x - p.x, dy = REST.y - p.y;
    const len = Math.hypot(dx, dy);
    if (len > MAXPULL) { dx *= MAXPULL / len; dy *= MAXPULL / len; }
    pull = { x: dx, y: dy };
    s.x = REST.x - dx; s.y = REST.y - dy;
  });
  function release() {
    if (!pull) return;
    cv.style.cursor = 'grab';
    if (Math.hypot(pull.x, pull.y) < 12) { s.x = REST.x; s.y = REST.y; pull = null; return; }
    s.vx = pull.x * 0.2; s.vy = pull.y * 0.2; s.x = REST.x; s.y = REST.y;
    pull = null; state = 'fly'; Sound.play('boing');
    Net.send({ t: 'sqThrow', vx: s.vx, vy: s.vy, w: wind });
    $('squigMsg').textContent = 'WHEEEE!';
  }
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', release);

  // ---------------------------------------------------------------- high scores
  function renderScores() {
    const ol = $('squigScores');
    ol.innerHTML = '';
    if (!scores.length) { ol.innerHTML = '<li>nobody yet!</li>'; return; }
    for (const e of scores) {
      const li = document.createElement('li');
      li.textContent = `${e.n.padEnd(3, ' ')}  ${(e.s / 10).toFixed(1)}m`;
      if (myLast && e.n === myLast.n && e.s === myLast.s) li.className = 'me';
      ol.appendChild(li);
    }
  }
  let pendScore = null; // a high score made while the modem was down goes in when it's back
  Net.on('welcome', m => { scores = (m.scores && m.scores.squig) || []; renderScores(); if (pendScore) { const sc = pendScore; pendScore = null; setTimeout(() => Net.send(sc), 500); } });
  Net.on('scores', m => { if (m.g === 'squig') { scores = m.list; renderScores(); } });

  // ---------------------------------------------------------------- loop
  let visible = true, running = false, acc = 0, last = 0;
  function frame(now) {
    if (!visible) { running = false; return; }
    acc += Math.min(100, now - last); last = now;
    while (acc >= 16.67) { step(); acc -= 16.67; }
    draw();
    requestAnimationFrame(frame);
  }
  function kick() { if (!running && visible) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  if (window.IntersectionObserver) new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }).observe(cv);
  reset(); kick();
})();

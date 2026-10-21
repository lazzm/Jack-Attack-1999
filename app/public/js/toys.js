/* Desk toys: plasma ball, ragdoll stickmen and the Ork name generator. */
(function () {
  const $ = id => document.getElementById(id);
  const rnd = (a, b) => a + Math.random() * (b - a);

  // =============================================================== PLASMA BALL
  // One ball per canvas. Remote readers' touches arrive as normalised (-1..1) points and show as bolts in every ball.
  const remote = new Map(); // id -> {x, y, col, t}
  let zaps = 0;
  Net.on('z', m => { remote.set(m.id, { x: m.x, y: m.y, col: m.col, t: performance.now() }); });
  setInterval(() => {
    const now = performance.now();
    for (const [id, z] of remote) if (now - z.t > 600) remote.delete(id);
    const el = $('zappers'); if (el) el.textContent = remote.size;
  }, 300);
  function hexToRgba(hex) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},A)`; }

  function makePlasma(cv, opts) {
    opts = opts || {};
    const g = cv.getContext('2d');
    let W, H, cx, cy, R, CORE;
    function size() {
      if (opts.fill) { cv.width = innerWidth; cv.height = innerHeight; }
      W = cv.width; H = cv.height; cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.45; CORE = Math.max(14, R * 0.12);
    }
    size();
    if (opts.fill) addEventListener('resize', size);
    const ambient = Array.from({ length: 9 }, () => ({ a: rnd(0, Math.PI * 2), v: rnd(-0.6, 0.6) }));
    let touch = null, lastSend = 0, visible = true, running = false, active = !opts.manual;

    function bolt(tx, ty, colour, width, jag) {
      const ang = Math.atan2(ty - cy, tx - cx);
      const sx = cx + Math.cos(ang) * CORE * 0.6, sy = cy + Math.sin(ang) * CORE * 0.6;
      const segs = 16, dx = tx - sx, dy = ty - sy, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      const pts = [[sx, sy]];
      for (let i = 1; i < segs; i++) {
        const k = i / segs, off = (Math.random() - 0.5) * jag * Math.sin(k * Math.PI) * len * 0.12;
        pts.push([sx + dx * k + nx * off, sy + dy * k + ny * off]);
      }
      pts.push([tx, ty]);
      for (const [lw, alpha] of [[width * 5, 0.08], [width * 2.2, 0.25], [width, 0.9]]) {
        g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
        for (const p of pts) g.lineTo(p[0], p[1]);
        g.strokeStyle = colour.replace('A', alpha); g.lineWidth = lw; g.stroke();
      }
      if (Math.random() < 0.35) {
        const p = pts[Math.floor(rnd(4, segs - 3))];
        g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + rnd(-R * .12, R * .12), p[1] + rnd(-R * .12, R * .12));
        g.strokeStyle = colour.replace('A', 0.5); g.lineWidth = width * 0.6; g.stroke();
      }
      g.fillStyle = colour.replace('A', 0.35); g.beginPath(); g.arc(tx, ty, width * 4, 0, Math.PI * 2); g.fill();
    }

    function frame() {
      if (!visible || !active) { running = false; return; }
      const sc = R / 190;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const glass = g.createRadialGradient(cx, cy, CORE, cx, cy, R);
      glass.addColorStop(0, '#301040'); glass.addColorStop(0.85, '#120418'); glass.addColorStop(1, '#3a2050');
      g.fillStyle = glass; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      g.globalCompositeOperation = 'lighter';
      const n = touch ? 5 : ambient.length;
      for (let i = 0; i < n; i++) {
        const a = ambient[i];
        a.v += rnd(-0.08, 0.08); a.v = Math.max(-0.8, Math.min(0.8, a.v)); a.a += a.v * 0.03;
        bolt(cx + Math.cos(a.a) * R * 0.97, cy + Math.sin(a.a) * R * 0.97, 'rgba(230,110,255,A)', 1.4 * sc, 1);
      }
      if (touch) for (let i = 0; i < 3; i++) bolt(touch.x, touch.y, 'rgba(255,200,255,A)', 2.6 * sc, 1.3);
      for (const z of remote.values()) bolt(cx + z.x * R, cy + z.y * R, hexToRgba(z.col), 2.2 * sc, 1.2);
      g.globalCompositeOperation = 'source-over';
      const core = g.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, CORE);
      core.addColorStop(0, '#fff'); core.addColorStop(0.4, '#f0c0ff'); core.addColorStop(1, '#602070');
      g.fillStyle = core; g.beginPath(); g.arc(cx, cy, CORE, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.ellipse(cx - R * 0.4, cy - R * 0.45, R * 0.25, R * 0.12, -0.7, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(200,160,255,0.35)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
      requestAnimationFrame(frame);
    }
    function kick() { if (!running && visible && active) { running = true; requestAnimationFrame(frame); } }

    function move(ev) {
      const r = cv.getBoundingClientRect();
      const p = { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H };
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d > R || d < CORE + 4) { touch = null; return; }
      touch = p;
      const now = performance.now();
      if (now - lastSend > 70) {
        lastSend = now;
        Net.send({ t: 'z', x: (p.x - cx) / R, y: (p.y - cy) / R });
        zaps++; const el = $('zaps'); if (el) el.textContent = zaps;
        if (zaps % 4 === 0) Sound.play('zap');
      }
    }
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerdown', ev => { move(ev); });
    cv.addEventListener('pointerleave', () => { touch = null; });
    cv.addEventListener('pointerup', ev => { if (ev.pointerType !== 'mouse') touch = null; });
    if (window.IntersectionObserver && !opts.fill) new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }).observe(cv);
    kick();
    return { start() { active = true; size(); kick(); }, stop() { active = false; touch = null; } };
  }
  if ($('plasma')) makePlasma($('plasma'));
  if ($('plasmaFull')) window.PlasmaFull = makePlasma($('plasmaFull'), { fill: true, manual: true });

  // =============================================================== STICKMEN
  (function stickmen() {
    const cv = $('stickzone'); if (!cv) return;
    const g = cv.getContext('2d');
    let W = 0, H = 0, GROUND = 0;
    function resize() { W = cv.width = cv.clientWidth || 600; H = cv.height = cv.clientHeight || 320; GROUND = Math.round(H * 0.7) + 30; }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(cv);

    const JOINTS = ['head', 'neck', 'pelvis', 'le', 'lh', 're', 'rh', 'lk', 'lf', 'rk', 'rf'];
    const OFF = { head: [0, -58], neck: [0, -44], pelvis: [0, -14], le: [-12, -32], lh: [-20, -20], re: [12, -32], rh: [20, -20], lk: [-6, 4], lf: [-9, 22], rk: [6, 4], rf: [9, 22] };
    const STICKS = [['head', 'neck'], ['neck', 'pelvis'], ['neck', 'le'], ['le', 'lh'], ['neck', 're'], ['re', 'rh'], ['pelvis', 'lk'], ['lk', 'lf'], ['pelvis', 'rk'], ['rk', 'rf'], ['head', 'pelvis']];
    const COLS = ['#000', '#c00', '#00c', '#080', '#808', '#a50'];
    const HATS = ['none', 'cap', 'tophat', 'party', 'none', 'helmet'];
    const men = [];
    let gravity = true, dragging = null, lastThud = 0, bigHead = false;
    window.Stickmen = { bigHeads(v) { bigHead = v; } };

    function addMan(x, y) {
      if (men.length >= 25) men.shift();
      const pts = {};
      for (const j of JOINTS) {
        const o = OFF[j], px = x + o[0], py = y + o[1];
        pts[j] = { x: px, y: py, ox: px - rnd(-2, 2), oy: py - rnd(-2, 2) };
      }
      const sticks = STICKS.map(([a, b]) => ({ a: pts[a], b: pts[b], len: Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y) }));
      men.push({ pts, list: JOINTS.map(j => pts[j]), sticks, col: COLS[Math.floor(Math.random() * COLS.length)], hat: HATS[Math.floor(Math.random() * HATS.length)], ouch: 0, stun: 0 });
      $('stickCount').textContent = men.length + ' stickm' + (men.length === 1 ? 'an' : 'en');
    }
    for (let i = 0; i < 4; i++) addMan(rnd(60, Math.max(120, W - 60)), GROUND - 80 - i * 30);

    function step() {
      const grav = gravity ? 0.45 : 0;
      for (const m of men) {
        for (const p of m.list) {
          if (p === dragging?.p) continue;
          const vx = (p.x - p.ox) * 0.99, vy = (p.y - p.oy) * 0.99;
          p.ox = p.x; p.oy = p.y;
          p.x += vx; p.y += vy + grav;
        }
        // "active ragdoll": once he's got his breath back he wobbles to his feet
        const held = dragging && m.list.includes(dragging.p);
        if (m.stun > 0 || held) { m.stun = Math.max(m.stun - 1, held ? 30 : 0); continue; }
        if (!gravity) continue;
        const P = m.pts, cx = P.pelvis.x;
        P.head.y -= 1.0; P.neck.y -= 0.35; P.pelvis.y -= 0.15;
        P.head.x += (cx - P.head.x) * 0.06; P.neck.x += (cx - P.neck.x) * 0.04;
        P.lf.y += 0.35; P.rf.y += 0.35;
        P.lf.x += (cx - 8 - P.lf.x) * 0.03; P.rf.x += (cx + 8 - P.rf.x) * 0.03;
        P.lk.x += (cx - 5 - P.lk.x) * 0.02; P.rk.x += (cx + 5 - P.rk.x) * 0.02;
      }
      for (let it = 0; it < 6; it++) {
        for (const m of men) for (const s of m.sticks) {
          const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, d = Math.hypot(dx, dy) || 0.01;
          const diff = (d - s.len) / d * 0.5;
          const pa = s.a === dragging?.p, pb = s.b === dragging?.p;
          if (!pa) { s.a.x += dx * diff * (pb ? 2 : 1); s.a.y += dy * diff * (pb ? 2 : 1); }
          if (!pb) { s.b.x -= dx * diff * (pa ? 2 : 1); s.b.y -= dy * diff * (pa ? 2 : 1); }
        }
        // bump into each other
        for (let i = 0; i < men.length; i++) for (let k = i + 1; k < men.length; k++) {
          for (const p of men[i].list) for (const q of men[k].list) {
            const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
            if (d2 > 0.01 && d2 < 64) { const d = Math.sqrt(d2), f = (8 - d) / d * 0.5; p.x -= dx * f; p.y -= dy * f; q.x += dx * f; q.y += dy * f; }
          }
        }
        for (const m of men) for (const p of m.list) {
          const vy = p.y - p.oy;
          if (p.y > GROUND) {
            if (vy > 9 && it === 0) { m.ouch = 40; m.stun = Math.max(m.stun, 70); const now = performance.now(); if (now - lastThud > 120) { lastThud = now; Sound.play('thud'); } }
            p.y = GROUND; p.oy = p.y + vy * 0.45; p.ox = p.x - (p.x - p.ox) * 0.7;
          }
          if (p.y < 6) { p.y = 6; p.oy = p.y + vy * 0.5; }
          if (p.x < 4) { const vx = p.x - p.ox; p.x = 4; p.ox = p.x + vx * 0.5; }
          if (p.x > W - 4) { const vx = p.x - p.ox; p.x = W - 4; p.ox = p.x + vx * 0.5; }
        }
      }
      if (dragging) { dragging.p.x = dragging.p.ox = dragging.tx; dragging.p.y = dragging.p.oy = dragging.ty; }
    }

    function drawHat(m) {
      const h = m.pts.head, n = m.pts.neck, a = Math.atan2(h.y - n.y, h.x - n.x) + Math.PI / 2;
      g.save(); g.translate(h.x, h.y); g.rotate(a);
      g.fillStyle = m.col;
      if (m.hat === 'cap') { g.fillRect(-8, -11, 16, 5); g.fillRect(4, -8, 9, 2); }
      else if (m.hat === 'tophat') { g.fillRect(-10, -10, 20, 3); g.fillRect(-6, -24, 12, 14); }
      else if (m.hat === 'party') { g.fillStyle = '#f0f'; g.beginPath(); g.moveTo(-7, -8); g.lineTo(7, -8); g.lineTo(0, -26); g.fill(); g.fillStyle = '#ff0'; g.fillRect(-2, -28, 4, 4); }
      else if (m.hat === 'helmet') { g.fillStyle = '#26a'; g.beginPath(); g.arc(0, -2, 10, Math.PI, 0); g.fill(); }
      g.restore();
    }

    function draw() {
      g.fillStyle = '#80c0ff'; g.fillRect(0, 0, W, GROUND);
      g.fillStyle = '#ffee00'; g.beginPath(); g.arc(W - 50, 45, 26, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      for (const [x, y] of [[80, 40], [300, 60], [520, 30]]) { if (x > W) continue; g.beginPath(); g.arc(x, y, 14, 0, 7); g.arc(x + 16, y - 6, 16, 0, 7); g.arc(x + 34, y, 13, 0, 7); g.fill(); }
      g.fillStyle = '#3a8a2a'; g.fillRect(0, GROUND, W, H - GROUND);
      g.fillStyle = '#2c6e20'; for (let x = 0; x < W; x += 12) g.fillRect(x, GROUND, 6, 3);
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const m of men) {
        g.strokeStyle = m.col; g.lineWidth = 3;
        g.beginPath();
        for (const s of m.sticks) { if (s.a === m.pts.head && s.b === m.pts.pelvis) continue; g.moveTo(s.a.x, s.a.y); g.lineTo(s.b.x, s.b.y); }
        g.stroke();
        const h = m.pts.head;
        g.fillStyle = '#fff'; g.beginPath(); g.arc(h.x, h.y, bigHead ? 17 : 8, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = '#000';
        if (m.ouch > 0) { g.font = 'bold 8px Arial'; g.fillText('x x', h.x - 6, h.y + 2); m.ouch--; g.font = 'bold 12px Comic Sans MS, Arial'; g.fillStyle = '#c00'; g.fillText('OOF!', h.x + 10, h.y - 10); }
        else { g.fillRect(h.x - 4, h.y - 2, 2, 2); g.fillRect(h.x + 2, h.y - 2, 2, 2); }
        if (m.hat !== 'none') drawHat(m);
      }
    }

    let visible = true, running = false, acc = 0, last = performance.now();
    function frame(now) {
      if (!visible) { running = false; return; }
      acc += Math.min(100, now - last); last = now;
      while (acc >= 16.67) { step(); acc -= 16.67; }
      draw();
      requestAnimationFrame(frame);
    }
    function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
    if (window.IntersectionObserver) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(cv);
    kick();

    function pos(ev) { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height }; }
    cv.addEventListener('pointerdown', ev => {
      const p = pos(ev);
      let best = null, bd = 900;
      for (const m of men) for (const q of m.list) { const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2; if (d < bd) { bd = d; best = q; } }
      if (!best) { addMan(p.x, Math.min(p.y, GROUND - 25)); Sound.play('click'); return; }
      cv.setPointerCapture(ev.pointerId);
      dragging = { p: best, tx: p.x, ty: p.y, hist: [] };
      cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', ev => {
      if (!dragging) return;
      const p = pos(ev);
      dragging.tx = Math.max(4, Math.min(W - 4, p.x)); dragging.ty = Math.max(6, Math.min(GROUND, p.y));
      dragging.hist.push({ x: p.x, y: p.y, t: performance.now() });
      if (dragging.hist.length > 6) dragging.hist.shift();
    });
    function release() {
      if (!dragging) return;
      const h = dragging.hist, p = dragging.p;
      if (h.length >= 2) {
        const a = h[0], b = h[h.length - 1], dt = Math.max(8, b.t - a.t) / 16.67;
        const vx = Math.max(-40, Math.min(40, (b.x - a.x) / dt)), vy = Math.max(-40, Math.min(40, (b.y - a.y) / dt));
        p.ox = p.x - vx; p.oy = p.y - vy;
        const man = men.find(m => m.list.includes(p));
        if (man) man.stun = 90;
        if (Math.hypot(vx, vy) > 12) { Net.send({ t: 'fling' }); Sound.play('boing'); if (man) man.stun = 150; }
      }
      dragging = null; cv.style.cursor = 'grab';
    }
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);

    $('stickAdd').addEventListener('click', () => addMan(rnd(40, W - 40), 70));
    $('stickClear').addEventListener('click', () => { men.length = 0; $('stickCount').textContent = '0 stickmen'; });
    $('stickGrav').addEventListener('click', ev => { gravity = !gravity; ev.target.textContent = 'Gravity: ' + (gravity ? 'ON' : 'OFF'); });
    $('stickBoom').addEventListener('click', () => {
      const bx = rnd(W * 0.2, W * 0.8), by = GROUND;
      for (const m of men) for (const p of m.list) {
        const dx = p.x - bx, dy = p.y - by, d = Math.max(30, Math.hypot(dx, dy)), f = 2600 / (d * d) * 12;
        p.ox -= dx / d * f; p.oy -= dy / d * f + 4;
      }
      for (const m of men) m.stun = 160;
      Sound.play('waaagh');
    });
    Net.on('welcome', m => { $('flings').textContent = m.flings.toLocaleString('en-GB'); });
    Net.on('flings', m => { $('flings').textContent = m.n.toLocaleString('en-GB'); });
  })();

  // =============================================================== ORK NAMES
  (function orks() {
    if (!$('orkName')) return;
    const TITLE = ['Warboss', 'Big Mek', 'Nob', 'Boy', 'Painboy', 'Weirdboy', 'Runtherd', 'Kommando', 'Mekboy', 'Grot'];
    const A = ['Gut', 'Skull', 'Grim', 'Snot', 'Mork', 'Gork', 'Rok', 'Teef', 'Dakka', 'Krump', 'Zog', 'Grub', 'Bad', 'Uz', 'Naz', 'Ghaz'];
    const B = ['smasha', 'krusha', 'gob', 'tooth', 'rukk', 'snik', 'grot', 'bash', 'skrag', 'nob', 'gitz', 'fang', 'drakk', 'boot'];
    const C = ['da Unstoppable', 'da Shouty', 'Big Teef', 'da Sneaky', 'Ironjaw', 'da Loud', "Wot Dun It", 'Gitstompa', 'da Mighty', 'Red Wunz Go Fasta', 'da Kunnin', 'Squigbreff'];
    const pick = a => a[Math.floor(Math.random() * a.length)];
    $('orkName').addEventListener('click', () => { $('orkOut').textContent = `${pick(TITLE)} ${pick(A)}${pick(B)} ${pick(C)}`; Sound.play('click'); });
  })();
})();

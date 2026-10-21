/* MegaCube.class - the shared Rubik's cube. Renders with three.js, the server owns the real state. */
(function () {
  const host = document.getElementById('cubeHost');
  if (!host || !window.THREE) return;
  const T = THREE, M = CubeModel;
  const COL = { W: 0xffffff, Y: 0xffee00, R: 0xdd0000, O: 0xff7700, G: 0x00aa22, B: 0x0033ee };
  const KEY_ROT = { // rotate a +z facing plane to face each normal
    px: [0, Math.PI / 2, 0], nx: [0, -Math.PI / 2, 0], py: [-Math.PI / 2, 0, 0],
    ny: [Math.PI / 2, 0, 0], pz: [0, 0, 0], nz: [0, Math.PI, 0],
  };
  const AX = [new T.Vector3(1, 0, 0), new T.Vector3(0, 1, 0), new T.Vector3(0, 0, 1)];

  let renderer;
  try { renderer = new T.WebGLRenderer({ antialias: false, alpha: true }); }
  catch (e) {
    host.querySelector('.loading').textContent = 'Java(TM) applet failed to start: your computer has no 3D card (WebGL). Try a newer browser!';
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1); // proper 1999 jaggies
  host.innerHTML = '';
  host.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new T.AmbientLight(0xffffff, 0.55));
  const sun = new T.DirectionalLight(0xffffff, 0.6); sun.position.set(4, 8, 6); scene.add(sun);
  const cubeGroup = new T.Group(); scene.add(cubeGroup);

  const bodyGeo = new T.BoxGeometry(0.96, 0.96, 0.96);
  const bodyMat = new T.MeshLambertMaterial({ color: 0x111111 });
  const stickerGeo = new T.PlaneGeometry(0.8, 0.8);
  const stickerMats = {};
  for (const k in COL) stickerMats[k] = new T.MeshLambertMaterial({ color: COL[k] });

  let model = M.solved();
  let groups = [];  // one per cubie, same order as model
  let stickers = [];
  function rebuild() {
    for (const g of groups) cubeGroup.remove(g);
    groups = []; stickers = [];
    model.forEach((c, i) => {
      const g = new T.Group();
      g.position.set(c.p[0], c.p[1], c.p[2]);
      g.add(new T.Mesh(bodyGeo, bodyMat));
      for (const k in c.s) {
        const s = new T.Mesh(stickerGeo, stickerMats[c.s[k]]);
        const v = M.VEC[k];
        s.position.set(v[0] * 0.485, v[1] * 0.485, v[2] * 0.485);
        s.rotation.set(KEY_ROT[k][0], KEY_ROT[k][1], KEY_ROT[k][2]);
        s.userData = { i, key: k };
        g.add(s); stickers.push(s);
      }
      cubeGroup.add(g); groups.push(g);
    });
  }
  rebuild();

  // ---- camera orbit
  let theta = 0.7, phi = 0.55, radius = 10;
  function placeCamera() {
    camera.position.set(radius * Math.cos(phi) * Math.sin(theta), radius * Math.sin(phi), radius * Math.cos(phi) * Math.cos(theta));
    camera.lookAt(0, 0, 0);
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host); else window.addEventListener('resize', resize);
  resize();

  // ---- move queue and layer animation
  const queue = [];
  let anim = null; // {pivot, m, t0, dur}
  function startNext() {
    if (anim || !queue.length) return;
    const m = queue.shift();
    const pivot = new T.Group(); cubeGroup.add(pivot);
    model.forEach((c, i) => { if (c.p[m.a] === m.l) pivot.add(groups[i]); });
    anim = { pivot, m, t0: performance.now(), dur: queue.length > 2 ? 60 : 170 };
    if (queue.length < 3) Sound.play('turn');
  }
  function finishAnim() {
    M.apply(model, anim.m);
    cubeGroup.remove(anim.pivot);
    anim = null;
    rebuild();
    startNext();
  }

  // apply everything instantly (when nobody is looking, or the queue is silly long)
  function flush() {
    if (anim) { M.apply(model, anim.m); cubeGroup.remove(anim.pivot); anim = null; }
    while (queue.length) M.apply(model, queue.shift());
    rebuild();
  }
  function enqueue(mv) {
    queue.push(mv);
    if (!visible || queue.length > 40) flush(); else startNext();
  }

  // ---- picking and dragging
  const ray = new T.Raycaster();
  let drag = null, lastUser = 0;
  function ndc(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * 2 - 1, y: -((ev.clientY - r.top) / r.height) * 2 + 1, px: ev.clientX - r.left, py: ev.clientY - r.top, w: r.width, h: r.height };
  }
  function toScreen(v, r) {
    const p = v.clone().project(camera);
    return { x: (p.x + 1) / 2 * r.w, y: (1 - p.y) / 2 * r.h };
  }
  host.addEventListener('pointerdown', ev => {
    if (ev.button !== 0 && ev.pointerType === 'mouse') return;
    host.setPointerCapture(ev.pointerId);
    lastUser = performance.now();
    const n = ndc(ev);
    ray.setFromCamera(n, camera);
    const hit = anim ? null : ray.intersectObjects(stickers, false)[0];
    if (hit) drag = { kind: 'turn', x: n.px, y: n.py, point: hit.point.clone(), info: hit.object.userData };
    else drag = { kind: 'orbit', x: n.px, y: n.py };
    host.style.cursor = 'grabbing';
  });
  host.addEventListener('pointermove', ev => {
    if (!drag) return;
    lastUser = performance.now();
    const n = ndc(ev);
    const dx = n.px - drag.x, dy = n.py - drag.y;
    if (drag.kind === 'orbit') {
      theta -= dx * 0.01; phi = Math.max(-1.4, Math.min(1.4, phi + dy * 0.01));
      drag.x = n.px; drag.y = n.py;
      return;
    }
    if (Math.hypot(dx, dy) < 12) return;
    const c = model[drag.info.i];
    const nv = M.VEC[drag.info.key];
    const dlen = Math.hypot(dx, dy);
    let best = null;
    for (let a = 0; a < 3; a++) {
      if (nv[a] !== 0) continue;
      const tangent = new T.Vector3().crossVectors(AX[a], drag.point).normalize();
      const s0 = toScreen(drag.point, n), s1 = toScreen(drag.point.clone().addScaledVector(tangent, 0.4), n);
      const sx = s1.x - s0.x, sy = s1.y - s0.y, sl = Math.hypot(sx, sy) || 1;
      const score = (dx * sx + dy * sy) / (dlen * sl);
      if (!best || Math.abs(score) > Math.abs(best.score)) best = { a, score };
    }
    if (best) Net.send({ t: 'cube', m: { a: best.a, l: c.p[best.a], d: best.score > 0 ? 1 : -1 } });
    drag = null;
  });
  const endDrag = () => { drag = null; host.style.cursor = 'grab'; };
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', endDrag);

  // ---- move pad (notation buttons)
  const PAD = [['U', 1, 1, -1], ["U'", 1, 1, 1], ['D', 1, -1, 1], ["D'", 1, -1, -1], ['E', 1, 0, 1], ["E'", 1, 0, -1],
               ['R', 0, 1, -1], ["R'", 0, 1, 1], ['L', 0, -1, 1], ["L'", 0, -1, -1], ['M', 0, 0, 1], ["M'", 0, 0, -1],
               ['F', 2, 1, -1], ["F'", 2, 1, 1], ['B', 2, -1, 1], ["B'", 2, -1, -1], ['S', 2, 0, -1], ["S'", 2, 0, 1]];
  const pad = document.getElementById('movePad');
  for (const [label, a, l, d] of PAD) {
    const b = document.createElement('button');
    b.className = 'btn'; b.textContent = label; b.title = 'Turn ' + label;
    b.addEventListener('click', () => Net.send({ t: 'cube', m: { a, l, d } }));
    pad.appendChild(b);
  }

  // ---- render loop (paused when scrolled away, the family PC needs its CPU)
  let visible = true, running = false, spin = 0;
  function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  if (window.IntersectionObserver) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(host);
  let last = performance.now();
  function frame(now) {
    if (!visible) { running = false; flush(); return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (anim) {
      const k = Math.min(1, (now - anim.t0) / anim.dur);
      const e = k < 1 ? 1 - Math.pow(1 - k, 3) : 1;
      anim.pivot.setRotationFromAxisAngle(AX[anim.m.a], e * anim.m.d * Math.PI / 2);
      if (k >= 1) finishAnim();
    }
    if (spin > 0) { theta += dt * 9 * spin; spin = Math.max(0, spin - dt * 0.5); }
    else if (!drag && now - lastUser > 5000) theta += dt * 0.25;
    placeCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  kick();

  // ---- network
  const $ = id => document.getElementById(id);
  function setState(cube) { queue.length = 0; if (anim) { cubeGroup.remove(anim.pivot); anim = null; } model = M.clone(cube); rebuild(); }
  Net.on('welcome', m => {
    setState(m.cube);
    $('cubeMoves').textContent = m.cubeMoves.toLocaleString('en-GB');
    $('cubeSolves').textContent = m.cubeSolves;
    $('cubeSolver').textContent = m.cubeLastSolver || 'nobody :(';
    $('resetVotes').textContent = m.resetVotes;
  });
  Net.on('cubeState', m => { setState(m.cube); $('cubeMoves').textContent = m.moves.toLocaleString('en-GB'); if (m.reset) $('cubeLast').textContent = 'RESET by ' + m.reset; $('resetVotes').textContent = 0; });
  Net.on('cubeMv', m => {
    enqueue(m.m);
    $('cubeMoves').textContent = m.moves.toLocaleString('en-GB');
    $('cubeLast').textContent = M.name(m.m) + ' by ' + m.by;
  });
  Net.on('cubeScrambled', m => {
    for (const mv of m.moves) enqueue(mv);
    Sound.play('dice');
    $('cubeMoves').textContent = m.total.toLocaleString('en-GB');
    $('cubeLast').textContent = 'SCRAMBLED by ' + m.by;
  });
  Net.on('cubeSolved', m => {
    $('cubeSolves').textContent = m.solves; $('cubeSolver').textContent = m.by;
    spin = 1; Sound.play('solve');
  });
  Net.on('resetVotes', m => { $('resetVotes').textContent = m.n; $('resetNeed').textContent = m.need; });
  Net.on('online', m => { $('resetNeed').textContent = Math.max(1, Math.min(3, m.online.length)); });
  $('cubeScramble').addEventListener('click', () => Net.send({ t: 'cubeScramble' }));
  $('cubeReset').addEventListener('click', () => Net.send({ t: 'cubeReset' }));
})();

/* ch-bed: Mom's jobs in JACK'S ROOM (js/ch-core.js is the engine). Five of them, all done with your hands:
 *   tidy   today's mess (clothes, rubbish, mags, a CD, a plate or a mug) goes where it lives: the washing basket, the bin,
 *          the mag pile by the telly, the CD rack, and dirty plates DOWN to the kitchen sink
 *   bed    the pillow off the floor, the pyjamas under it, then pull the duvet straight (click the bed: three goes)
 *   bin    tie up the bag in your bin (click it) and carry it down to the kitchen bin
 *   cat    shake the cat biscuits into the bowl, then give next door's cat a shout: it hops down and has its tea
 *   plant  water Gran's spider plant (hold the watering can over it and pour), pick off the brown leaves, turn it round
 * Mom's list (a copy) is pinned on the wall at the foot of the bed. Coordinates: js/rm-room.js (cm, y down, floor y 73). */
(function () {
  'use strict';
  const CK = window.ChoreKit; if (!CK || CK.MODS.tidy) return;
  const { H, T, K, A, M, CC, D2R } = CK;
  const FY = 73, GY = 353;
  const sparse=(()=>{try{return localStorage.getItem('jhp_starter')==='1'}catch(e){return false}})();
  const S = () => CK.S;
  const V = () => (CK.S.v.bed = CK.S.v.bed || {});
  const mat = (c, o) => M(Object.assign({ c, sh: 12, sp: '#222' }, o || {}));
  const rnd = K.rnd;
  const grp = (fn) => { const g = new T.Group(); fn(K.into(g), g); return g; };
  const grpB = (fn) => { const g = new T.Group(), b = K.batch(); fn(K.into(b), g); b.build(g); return g; }; // merged per material: one draw each
  // Original generated picture layers; all fictional branding remains real type.
  const fallbackPrints={};
  function packageTex(key,art,title,sub,w=320,h=448,turned=false){
    return A.printed(key,w,h,(g,W,HH)=>{const old=fallbackPrints[key];if(!window.PrintArt?.has(art)&&old){g.save();g.scale(W/old.w,HH/old.h);old.paint(g,old.w,old.h);g.restore();return}g.save();if(turned){g.translate(0,HH);g.scale(1,-1)}
      g.fillStyle='#e6d8b4';g.fillRect(0,0,W,HH);const top=HH*.24,bottom=HH*.12;
      if(!window.PrintArt?.paint(g,art,0,top,W,HH-top-bottom)){g.fillStyle='#725871';g.fillRect(0,top,W,HH-top-bottom)}
      g.fillStyle='#192b41';g.fillRect(0,0,W,top);g.fillRect(0,HH-bottom,W,bottom);g.fillStyle='#fff0ce';g.textAlign='center';
      let size=Math.min(W*.16,HH*.13);do{g.font='900 '+size+'px '+A.FONT;if(g.measureText(title).width<W-20)break;size--}while(size>12);
      g.fillText(title,W/2,top*.75);g.font='bold '+Math.max(10,W*.045)+'px '+A.UIF;g.fillText(sub,W/2,HH-bottom*.35,W-18);g.restore();
    },{clamp:true});
  }

  // ================================================================ the mess, modelled (each built bottom-centre on y = 0, y down)
  // Real low-poly 3D that reads at floor distance: cloth is a draped sheet with soft folds whose edges meet the floor (solid
  // from every angle, no cardboard cut-outs), socks are swept tubes with ribbed cuffs, rubbish is lathed/swept/crumpled.
  // Materials and canvases are shared through K.mat/K.tex; every model is roughly 150-700 triangles in 2-6 draws.
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function segDist(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l)); return Math.hypot(px - ax - dx * t, pz - az - dz * t); }
  function inPoly(x, z, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
  function edgeOf(x, z, pts) { let d = Infinity, q = null; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [ax, az] = pts[j], [bx, bz] = pts[i], dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l)), cx = ax + dx * t, cz = az + dz * t, dd = Math.hypot(x - cx, z - cz); if (dd < d) { d = dd; q = [cx, cz]; } } return { d, q }; }
  const D = (v, s) => (v / 128 - 0.5) * s; // 128-unit design space -> cm
  // A draped sheet of cloth. outline: [[x, z], ...] in a 128 x 128 design space over w x d cm. o.folds: ridges
  // [x1, z1, x2, z2, height, width] (design space; height and width in cm), o.lump: [x, z, height, radius], o.thick, o.seed.
  function sheet(outline, w, d, o) {
    o = o || {};
    const pts = outline.map(([x, z]) => [D(x, w), D(z, d)]), n = o.res || 22, sx = w / n, sz = d / n, cols = n + 1;
    const r = rnd(o.seed || 7), waves = [0, 1, 2].map(() => [r() * 6.28, 0.22 + r() * 0.3, r() * 6.28, 0.18 + r() * 0.3]);
    const folds = (o.folds || []).map(([x1, z1, x2, z2, h, fw]) => [D(x1, w), D(z1, d), D(x2, w), D(z2, d), h, fw]);
    const lumps = (o.lump || []).map(([x, z, h, rr]) => [D(x, w), D(z, d), h, rr]);
    const idx = new Map(), pos = [], uv = [], index = [], edge = o.edge || 2.4;
    const cellIn = (i, j) => { const cx = -w / 2 + (i + 0.5) * sx, cz = -d / 2 + (j + 0.5) * sz; return inPoly(cx, cz, pts) || edgeOf(cx, cz, pts).d < Math.min(sx, sz) * 0.4; };
    function vert(i, j) {
      const k = i + j * cols; if (idx.has(k)) return idx.get(k);
      let x = -w / 2 + i * sx, z = -d / 2 + j * sz; const ins = inPoly(x, z, pts), e = edgeOf(x, z, pts);
      const onEdge = !ins || e.d < Math.min(sx, sz) * 0.38; if (onEdge) { x = e.q[0]; z = e.q[1]; }
      const kk = sstep(0, edge, onEdge ? 0 : e.d);
      let h = (o.thick || 0.8) * kk;
      for (const [p1, f1, p2, f2] of waves) h += (o.wrinkle || 0.3) * kk * Math.sin(x * f1 + p1) * Math.sin(z * f2 + p2);
      for (const [ax, az, bx, bz, fh, fw] of folds) { const dd = segDist(x, z, ax, az, bx, bz); h += fh * Math.exp(-dd * dd / (fw * fw)) * (0.25 + 0.75 * kk); }
      for (const [lx, lz, lh, lr] of lumps) { const dd = Math.hypot(x - lx, z - lz); h += lh * Math.exp(-dd * dd / (lr * lr)) * kk; }
      const id = pos.length / 3; pos.push(x, -Math.max(0.1, h), z); uv.push(x / w + 0.5, 0.5 - z / d); idx.set(k, id); return id;
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (cellIn(i, j)) { const a = vert(i, j), b = vert(i + 1, j), c = vert(i + 1, j + 1), e = vert(i, j + 1); index.push(a, b, e, b, c, e); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(index); geo.computeVertexNormals();
    return geo;
  }
  // A swept tube along the floor. path: [[x, z, lift], ...]; wf(t) / hf(t): half width / half height (t 0..1 along it).
  // UV: u along the path, v round it. o.capA / o.capB close the ends (a cap's centre samples u = 0 or 1).
  function tube(path, wf, hf, o) {
    o = o || {};
    const R = o.radial || 10, N = path.length, pos = [], uv = [], index = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), [x, z, lift] = path[i], a = path[Math.max(0, i - 1)], b = path[Math.min(N - 1, i + 1)];
      let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      const w = wf(t), h = hf(t), cy = -((lift || 0) + h);
      for (let k = 0; k <= R; k++) { const ang = k / R * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang); pos.push(x - tz * c * w, cy - s * h, z + tx * c * w); uv.push(t, k / R); }
    }
    for (let i = 0; i < N - 1; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; index.push(a, a + 1, b, a + 1, b + 1, b); }
    const cap = (i, u) => { const [x, z, lift] = path[i], c = pos.length / 3; pos.push(x, -((lift || 0) + hf(i / (N - 1))), z); uv.push(u, 0.5); for (let k = 0; k < R; k++) { const a = i * (R + 1) + k; if (i) index.push(c, a, a + 1); else index.push(c, a + 1, a); } };
    if (o.capA) cap(0, 0); if (o.capB) cap(N - 1, 1);
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(index); geo.computeVertexNormals();
    return geo;
  }
  const clothMat = key => M({ c: '#fff', map: clothTex(key), sh: 3, sp: '#111', side: 2 });
  // the garment art (P below) on the cloth's own colour, with a little weave so it never reads as plastic
  function clothTex(key) {
    const colours = { tshirt: '#ad2630', jeans: '#375983', shirt: '#e4e3dc', pe: '#253861', jumper2: '#666a73', pjs: '#94b6d5' }, base = colours[key] || '#5d6d87';
    return K.tex('ch.cloth3.' + key, 128, 128, (g, ww, hh) => { g.fillStyle = base; g.fillRect(0, 0, ww, hh); P[key](g, ww, hh); A.grain(g, ww, hh, 700, key === 'jumper2' ? 0.1 : 0.05, 17); }, { clamp: true });
  }
  // how each garment lies: its outline (the same art space as P) and its folds
  const GARMENT = {
    tshirt: { w: 40, d: 36, out: [[34, 12], [52, 8], [64, 18], [76, 8], [94, 12], [122, 34], [108, 52], [96, 44], [98, 120], [30, 120], [32, 44], [20, 52], [6, 34]], o: { seed: 11, thick: 0.9, folds: [[34, 16, 30, 66, 1.5, 3.2], [44, 72, 104, 100, 1.9, 4.5], [60, 40, 80, 112, 1.1, 3.5], [96, 14, 118, 40, 1.0, 2.6]], lump: [[78, 92, 1.6, 7]] } },
    jeans: { w: 38, d: 52, out: [[30, 6], [98, 6], [104, 122], [72, 122], [64, 46], [56, 122], [24, 122]], o: { seed: 12, thick: 1.0, folds: [[30, 9, 98, 9, 1.0, 2.2], [24, 72, 58, 78, 1.3, 3], [70, 64, 104, 72, 1.3, 3], [84, 30, 92, 120, 1.2, 3.5], [24, 116, 56, 117, 1.2, 1.8], [72, 116, 104, 117, 1.2, 1.8]], lump: [[42, 40, 1.4, 8]] } },
    shirt: { w: 40, d: 38, out: [[36, 10], [54, 6], [64, 18], [74, 6], [92, 10], [124, 46], [110, 58], [96, 46], [98, 122], [30, 122], [32, 46], [18, 58], [4, 46]], o: { seed: 13, thick: 0.8, folds: [[40, 12, 62, 22, 1.4, 2], [66, 22, 88, 12, 1.4, 2], [64, 22, 64, 120, 0.6, 1.6], [100, 32, 118, 52, 1.2, 2.6], [34, 82, 96, 98, 1.6, 4.5]], lump: [[44, 100, 1.3, 7]] } },
    pe: { w: 30, d: 24, out: [[16, 24], [112, 24], [120, 104], [72, 104], [64, 70], [56, 104], [8, 104]], o: { seed: 14, thick: 0.9, folds: [[16, 29, 112, 29, 1.2, 2.2], [36, 60, 92, 92, 1.2, 3]], lump: [[90, 56, 1.0, 5]] } },
    jumper2: { w: 44, d: 40, out: [[30, 12], [48, 6], [64, 4], [80, 6], [98, 12], [124, 70], [108, 76], [98, 52], [98, 122], [30, 122], [30, 52], [20, 76], [4, 70]], o: { seed: 15, thick: 1.4, wrinkle: 0.4, folds: [[30, 16, 18, 70, 1.8, 3.5], [98, 16, 112, 70, 1.6, 3.5], [36, 96, 94, 108, 1.6, 4], [40, 72, 88, 72, 0.6, 1.6]], lump: [[64, 18, 3.2, 8], [70, 88, 1.4, 8]] } },
    pjs: { w: 34, d: 32, out: [[26, 8], [102, 8], [120, 40], [104, 50], [100, 120], [28, 120], [24, 50], [8, 40]], o: { seed: 21, thick: 0.9, folds: [[30, 14, 26, 46, 1.2, 3], [40, 70, 96, 96, 1.6, 4], [64, 10, 64, 118, 0.5, 1.4]], lump: [[52, 88, 1.3, 7]] } },
  };
  function cloth(key, w, d) {
    const G0 = GARMENT[key], geo = sheet(G0.out, G0.w, G0.d, G0.o);
    return grpB(G => {
      G.geo(geo, 0, 0, 0, clothMat(key));
      if (key === 'jumper2') { const cord = mat('#e8e4da', { sh: 10 }); [[-2.2, 1], [2.4, -1]].forEach(([x, s]) => G.geo(tube([[x, -12, 2.4], [x + s * 0.6, -9, 1.2], [x + s * 1.5, -6, 0.5], [x + s * 1.2, -3.5, 0.3]], () => 0.28, () => 0.28, { radial: 5, capA: true, capB: true }), 0, 0, 0, cord)); }
      G.shadow(0, 0, 0, G0.w * 0.95, G0.d * 0.92, 0.42);
    });
  }
  // SOCKS: a crumpled pair of white sports socks, red and navy hoops on ribbed cuffs, grey toes and heels (a bit grubby)
  const sockTex = () => K.tex('ch.sock3', 128, 64, (g, w, h) => {
    g.fillStyle = '#f2efe6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b9b5ab'; g.fillRect(0, 0, 14, h); g.fillRect(50, 0, 14, h); // toe, heel
    g.fillStyle = 'rgba(120,100,70,.22)'; g.fillRect(8, h * 0.55, 40, h * 0.45); // the sole: not entirely clean
    for (let x = 92; x < w; x += 3) { g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(x, 0, 1, h); }
    for (let y = 0; y < h; y += 3) { g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(92, y, w - 92, 1); } // the rib
    g.fillStyle = '#c8202a'; g.fillRect(100, 0, 6, h); g.fillStyle = '#1f3a7a'; g.fillRect(110, 0, 5, h);
    g.fillStyle = '#4a463e'; g.fillRect(w - 2, 0, 2, h); // inside the cuff
    A.grain(g, w, h, 500, 0.06, 23);
  }, { clamp: true });
  function sock(path, len) {
    const cuff = t => t > 0.84 ? 1 + 0.08 * Math.sin((t - 0.84) * 60) : 1;
    return tube(path.map(([x, z, l]) => [x * 0.86, z * 0.86, l * 0.8]), t => (t < 0.12 ? 0.55 + 0.45 * Math.sqrt(t / 0.12) : 1) * (t > 0.45 ? 2.75 : 2.5) * cuff(t), t => (t < 0.1 ? 0.5 + 0.5 * Math.sqrt(t / 0.1) : 1) * (t > 0.8 ? 0.95 : 0.78), { radial: 10, capA: true, capB: true });
  }
  // CRISP PACKET: a sealed foil pillow bag (WALKIES, a parody brand: a dog on the front, "ready salted-ish"). Top and bottom
  // sheets meet along the long sides; zig-zag crimped seals close both ends; flat-shaded crinkles catch the light like foil.
  // full: a fresh bag puffed with air; otherwise crushed and empty (today's rubbish). Front print on the top, back on the bottom.
  const crispBagTex = () => K.tex('ch.walkies', 512, 256, (g, w, h) => {
    for (const [x0, back] of [[0, false], [256, true]]) {
      g.save(); g.translate(x0, 0);
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#e2262f'); bg.addColorStop(0.55, '#c51b25'); bg.addColorStop(1, '#9e121b'); g.fillStyle = bg; g.fillRect(0, 0, 256, h);
      g.fillStyle = 'rgba(255,255,255,.08)'; for (let k = 0; k < 9; k++) g.fillRect(14 + k * 26, 0, 9, h); // foil sheen bands
      if (!back) {
        g.fillStyle = '#ffd21f'; g.beginPath(); g.ellipse(128, 70, 104, 42, -0.06, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = '#1d2f7a'; g.stroke();
        g.font = '900 46px ' + A.FONT; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#1d2f7a'; g.strokeText('WALKIES', 128, 86, 196); g.fillStyle = '#e2262f'; g.fillText('WALKIES', 128, 86, 196);
        g.fillStyle = '#1d2f7a'; g.fillRect(40, 118, 176, 26); A.text(g, 'READY SALTED-ISH', 128, 137, '700 17px ' + A.UIF, '#fff', 'center');
        const r = rnd(12); for (let k = 0; k < 14; k++) { const x = 40 + r() * 120, y = 168 + r() * 52; g.fillStyle = ['#f4c552', '#e9b23a', '#f7d77a'][k % 3]; g.beginPath(); g.ellipse(x, y, 16, 9, r() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(150,90,20,.5)'; g.lineWidth = 1.5; g.stroke(); }
        g.fillStyle = '#f0e6d2'; g.beginPath(); g.ellipse(196, 192, 26, 24, 0, 0, 7); g.fill(); g.fillStyle = '#7a4a22'; g.beginPath(); g.ellipse(176, 176, 9, 16, 0.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(216, 176, 9, 16, -0.5, 0, 7); g.fill();
        g.fillStyle = '#1a1a1a'; for (const x of [186, 206]) { g.beginPath(); g.arc(x, 188, 3.4, 0, 7); g.fill(); } g.beginPath(); g.ellipse(196, 200, 6, 4, 0, 0, 7); g.fill(); g.fillStyle = '#e86a8a'; g.beginPath(); g.ellipse(198, 210, 4, 6, 0, 0, 7); g.fill();
        g.fillStyle = '#ffd21f'; g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, rr = k % 2 ? 15 : 22; g.lineTo(40 + Math.cos(a) * rr, 30 + Math.sin(a) * rr); } g.fill(); A.text(g, '34.5g', 40, 34, '900 11px ' + A.UIF, '#c51b25', 'center');
      } else {
        g.fillStyle = '#f6efe0'; g.fillRect(28, 40, 200, 120); A.text(g, 'WALKIES', 128, 66, '900 22px ' + A.FONT, '#c51b25', 'center');
        ['INGREDIENTS: Potatoes, vegetable oil,', 'salt (a bit), a sense of adventure.', 'Best before: see the other side.', 'Good boy! (Bin me after.)'].forEach((t, k) => A.text(g, t, 128, 88 + k * 16, '700 11px ' + A.UIF, '#3a2a20', 'center'));
        g.fillStyle = '#fff'; g.fillRect(150, 178, 72, 44); g.fillStyle = '#111'; for (let k = 0; k < 30; k++) g.fillRect(154 + k * 2.2, 182, k % 3 ? 1 : 1.6, 30);
      }
      // the crimped ends: silver foil with a zig-zag press
      for (const ex of [0, 244]) { g.fillStyle = '#c9c9ce'; g.fillRect(ex, 0, 12, h); g.strokeStyle = 'rgba(80,80,90,.6)'; g.lineWidth = 1; g.beginPath(); for (let y = 0; y <= h; y += 6) g.lineTo(ex + (y / 6 % 2 ? 9 : 3), y); g.stroke(); }
      g.restore();
    }
    A.grain(g, w, h, 1400, 0.05, 31);
  }, { clamp: true });
  function crispBag(full, seed) {
    const L = 16, W = 11.5, H = full ? 3.3 : 0.85, nu = 16, nv = 10, r = rnd(seed), pos = [], uv = [], index = [];
    const folds = full ? [[-0.6, -1, -0.2, 1, 0.12], [0.5, -1, 0.75, 1, 0.1]] : [[-0.75, -1, -0.35, 1, 0.55], [0.15, -1, 0.45, 1, 0.45], [-1, -0.25, 1, 0.35, 0.4], [0.5, 1, 0.95, -0.6, 0.35]];
    const twist = full ? 0 : 0.35;
    for (const top of [true, false]) {
      const base = pos.length / 3;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const u = i / nu * 2 - 1, v = j / nv * 2 - 1, pinch = 1 - (full ? 0.2 : 0.1) * Math.pow(Math.abs(u), 4);
        const f = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 3)), 0.6) * Math.pow(Math.max(0, 1 - v * v), 0.55);
        let crease = 0; for (const [x1, z1, x2, z2, a] of folds) { const d = segDist(u, v, x1, z1, x2, z2); crease += a * Math.max(0, 1 - d / 0.22) * (top ? 1 : 0.3); }
        const jit = (r() - 0.5) * (full ? 0.18 : 0.3) * f;
        let y = top ? 0.32 + (H * f) * (1 - (full ? 0.06 : 0.3) * Math.sin(u * 4.1 + v * 2.3)) + crease * (full ? 0.3 : 1) + jit : 0.1 + 0.08 * f;
        const x = u * L / 2, z = v * W / 2 * pinch + twist * u * u * Math.sign(u) * 1.2;
        pos.push(x, -y, z); uv.push(top ? 0.03 + 0.44 * (1 - u) / 2 : 0.53 + 0.44 * (u + 1) / 2, (v + 1) / 2);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 2, e = a + nu + 1; if (top) index.push(a, b, e, b, c, e); else index.push(a, e, b, b, e, c); }
    }
    // crimped seals: a flat foil strip, zig-zag at its outer edge, at each end
    for (const sgn of [-1, 1]) {
      const base = pos.length / 3, teeth = 9, w0 = W / 2 * (full ? 0.8 : 0.9), yS = full ? 0.9 : 0.3;
      for (let k = 0; k <= teeth * 2; k++) { const z = -w0 + 2 * w0 * k / (teeth * 2) + twist * 1.2 * sgn; pos.push(sgn * L / 2, -yS, z, sgn * (L / 2 + 1.5 + (k % 2 ? 0.5 : 0)), -yS - (full ? 0.15 : 0.05) - r() * 0.12, z); uv.push(sgn < 0 ? 0.005 : 0.49, k / (teeth * 2), sgn < 0 ? 0.005 : 0.49, k / (teeth * 2)); }
      for (let k = 0; k < teeth * 2; k++) { const a = base + k * 2; index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(index); geo.computeVertexNormals();
    return geo;
  }
  const crispMat = () => M({ c: '#fff', map: crispBagTex(), sh: 95, sp: '#b8b8c0', flat: true, side: 2 });
  // FIZZY POP CAN: a lathed can with a lid, ring-pull and a dent, lying on its side
  function canBody() {
    const geo = new T.CylinderGeometry(3.3, 3.3, 9, 18, 5, true), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), dent = 0.16 * Math.exp(-Math.pow((a - 0.9) / 0.5, 2)) * Math.exp(-Math.pow((y + 0.8) / 2.2, 2)); p.setXYZ(i, x * (1 - dent), y, z * (1 - dent)); }
    geo.computeVertexNormals(); return geo;
  }
  // HOMEWORK: a screwed-up ball of lined paper
  const homeworkTex = () => K.tex('ch.homework', 128, 128, (g, w, h) => {
    g.fillStyle = '#f5f2e8'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(70,110,200,.45)'; for (let y = 10; y < h; y += 9) g.fillRect(0, y, w, 1);
    g.fillStyle = 'rgba(210,50,60,.55)'; g.fillRect(18, 0, 1.5, h);
    g.strokeStyle = 'rgba(60,60,70,.55)'; g.lineWidth = 1; const r = rnd(41);
    for (let y = 18; y < h; y += 9) { g.beginPath(); let x = 24; g.moveTo(x, y); while (x < w - 10 - r() * 30) { x += 3 + r() * 4; g.lineTo(x, y - 1 - r() * 3); } g.stroke(); }
    g.fillStyle = '#c8202a'; g.font = 'bold 13px ' + A.UIF; g.fillText('See me!', 60, 60);
  }, { clamp: true });
  function crumple(r0, seed, squash) {
    const geo = new T.IcosahedronGeometry(r0, 2), p = geo.attributes.position, r = rnd(seed), off = new Map();
    for (let i = 0; i < p.count; i++) { const k = Math.round(p.getX(i) * 100) + ',' + Math.round(p.getY(i) * 100) + ',' + Math.round(p.getZ(i) * 100); if (!off.has(k)) off.set(k, 0.72 + r() * 0.42); const s = off.get(k); p.setXYZ(i, p.getX(i) * s, p.getY(i) * s * squash, p.getZ(i) * s); }
    geo.computeVertexNormals(); geo.computeBoundingBox(); return geo;
  }
  // BANANA SKIN: four peel petals splayed from the stalk, yellow outside with brown freckles, cream inside, brown tips
  const bananaTex = () => K.tex('ch.banana', 64, 64, (g, w, h) => {
    g.fillStyle = '#f0e6c2'; g.fillRect(0, 0, w, h / 2); // inside (the underside of the sweep): cream
    g.fillStyle = '#f2cf3a'; g.fillRect(0, h / 2, w, h / 2);
    const r = rnd(5); g.fillStyle = 'rgba(110,70,20,.55)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(r() * w, h / 2 + r() * h / 2, 0.8 + r() * 1.6, 0.6 + r(), 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(150,170,60,.6)'; g.fillRect(0, h / 2, 6, h / 2);
    const gr = g.createLinearGradient(w * 0.78, 0, w, 0); gr.addColorStop(0, 'rgba(70,40,15,0)'); gr.addColorStop(1, 'rgba(60,35,12,.95)'); g.fillStyle = gr; g.fillRect(w * 0.78, 0, w * 0.22, h);
  }, { clamp: true });
  // YOGHURT POT: tipped over, the foil lid peeled back, a pink smear (a parody pot: DAIRY DOO, strawberry-ish)
  const yogTex = () => K.tex('ch.yog', 256, 64, (g, w, h) => {
    g.fillStyle = A.lin(g, 0, 0, 0, h, [[0, '#ffffff'], [1, '#f7d6e2']]); g.fillRect(0, 0, w, h);
    g.fillStyle = '#d9346a'; g.fillRect(0, h - 9, w, 9); g.fillRect(0, 0, w, 4);
    for (const x of [26, 154]) { A.text(g, 'DAIRY DOO', x + 50, 30, '900 21px ' + A.FONT, '#d9346a', 'center'); A.text(g, 'STRAWBERRY-ISH', x + 50, 44, '700 9px ' + A.UIF, '#7a2244', 'center'); }
    for (const x of [8, 112, 136, 240]) { g.fillStyle = '#e0283c'; g.beginPath(); g.ellipse(x, 30, 6, 7.5, 0, 0, 7); g.fill(); g.fillStyle = '#3a9a3a'; g.fillRect(x - 4, 21, 8, 3); }
  }, { clamp: true });

  const P = {
    tshirt: (g, w, h) => { g.fillStyle = '#c0202c'; g.beginPath(); g.moveTo(34, 12); g.lineTo(52, 8); g.quadraticCurveTo(64, 20, 76, 8); g.lineTo(94, 12); g.lineTo(122, 34); g.lineTo(108, 52); g.lineTo(96, 44); g.lineTo(98, 120); g.lineTo(30, 120); g.lineTo(32, 44); g.lineTo(20, 52); g.lineTo(6, 34); g.closePath(); g.fill(); A.grain(g, w, h, 500, 0.08, 3); A.text(g, 'MODEM', 64, 70, '700 15px ' + A.FONT, '#fff', 'center'); A.text(g, 'BOYS', 64, 88, '700 15px ' + A.FONT, '#ffd400', 'center'); A.text(g, "TOUR '99", 64, 104, '9px ' + A.UIF, '#fff', 'center'); },
    jeans: (g, w, h) => { g.fillStyle = '#3a5a8a'; g.beginPath(); g.moveTo(30, 6); g.lineTo(98, 6); g.lineTo(104, 122); g.lineTo(72, 122); g.lineTo(64, 46); g.lineTo(56, 122); g.lineTo(24, 122); g.closePath(); g.fill(); for (let i = 0; i < 400; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.1)' : 'rgba(0,0,30,.15)'; g.fillRect((i * 37) % 128, (i * 53) % 128, 2, 1); } g.strokeStyle = '#c8a050'; g.lineWidth = 1; g.strokeRect(32, 8, 64, 8); g.fillStyle = '#c8a050'; g.fillRect(62, 18, 4, 14); },
    shirt: (g, w, h) => { g.fillStyle = '#f2f2ee'; g.beginPath(); g.moveTo(36, 10); g.lineTo(54, 6); g.lineTo(64, 18); g.lineTo(74, 6); g.lineTo(92, 10); g.lineTo(124, 46); g.lineTo(110, 58); g.lineTo(96, 46); g.lineTo(98, 122); g.lineTo(30, 122); g.lineTo(32, 46); g.lineTo(18, 58); g.lineTo(4, 46); g.closePath(); g.fill(); g.strokeStyle = '#ccc'; g.beginPath(); g.moveTo(64, 18); g.lineTo(64, 120); g.stroke(); g.fillStyle = '#1a2a6a'; g.beginPath(); g.moveTo(60, 14); g.lineTo(68, 14); g.lineTo(70, 60); g.lineTo(64, 66); g.lineTo(58, 60); g.closePath(); g.fill(); g.fillStyle = '#c8a020'; for (let y = 24; y < 60; y += 10) g.fillRect(58, y, 12, 2); },
    pe: (g, w, h) => { g.fillStyle = '#1a2a6a'; g.beginPath(); g.moveTo(16, 24); g.lineTo(112, 24); g.lineTo(120, 104); g.lineTo(72, 104); g.lineTo(64, 70); g.lineTo(56, 104); g.lineTo(8, 104); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(16, 24, 96, 6); g.fillRect(10, 96, 4, 8); g.fillRect(114, 96, 4, 8); },
    jumper2: (g, w, h) => { g.fillStyle = '#6a6e74'; g.beginPath(); g.moveTo(30, 12); g.quadraticCurveTo(64, 2, 98, 12); g.lineTo(124, 70); g.lineTo(108, 76); g.lineTo(98, 52); g.lineTo(98, 122); g.lineTo(30, 122); g.lineTo(30, 52); g.lineTo(20, 76); g.lineTo(4, 70); g.closePath(); g.fill(); A.grain(g, w, h, 900, 0.08, 9); g.fillStyle = '#585c62'; g.fillRect(40, 70, 48, 26); A.text(g, 'JNET', 64, 60, '700 13px ' + A.FONT, '#ff7a00', 'center'); },
    pjs: (g, w, h) => { g.fillStyle = '#9ac0e8'; g.beginPath(); g.moveTo(26, 8); g.lineTo(102, 8); g.lineTo(120, 40); g.lineTo(104, 50); g.lineTo(100, 120); g.lineTo(28, 120); g.lineTo(24, 50); g.lineTo(8, 40); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-atop'; for (let x = -128; x < 128; x += 14) { g.fillStyle = '#e8f0ff'; g.fillRect(x + 40, 0, 5, 128); } for (let i = 0; i < 6; i++) A.star(g, 20 + (i * 47) % 100, 30 + (i * 31) % 80, 5, 5), g.fillStyle = '#ffd400', g.fill(); g.globalCompositeOperation = 'source-over'; },
  };

  // ================================================================ the little things in the mess (each built bottom-centre on y = 0)
  const mags = { mag1: 'mag', mag2: 'magB' };
  const comicTex = () => packageTex('ch.comic','ch.m.comic','SPACE KAT','NO. 47 • THE MOON CHEESE JOB • 50p',384,512);
  const flip = paint => (g, w, h) => { g.save(); g.translate(0, h); g.scale(1, -1); paint(g, w, h); g.restore(); }; // (round things map pictures upside down here)
  const remember=(key,w,h,paint)=>{fallbackPrints[key]={w,h,paint}};
const old_comicTex = () => remember('ch.comic', 192, 256, (g, w, h) => { g.fillStyle = '#ffe14a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d0102a'; g.fillRect(0, 0, w, 52); A.text(g, 'SPACE KAT', 96, 38, '34px ' + A.FONT, '#fff', 'center'); g.fillStyle = '#1a1a40'; g.beginPath(); g.arc(96, 150, 62, 0, 7); g.fill(); g.fillStyle = '#ff7aa0'; g.beginPath(); g.arc(96, 150, 34, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.moveTo(70, 124); g.lineTo(78, 96); g.lineTo(90, 122); g.moveTo(102, 122); g.lineTo(114, 96); g.lineTo(122, 124); g.fill(); A.text(g, 'No. 47', 20, 244, '700 16px ' + A.UIF, '#111'); A.text(g, '50p', 172, 244, '700 16px ' + A.UIF, '#111', 'right'); });
  const old_crispTex = () => remember('ch.crisps', 256, 128, flip((g, w, h) => { g.fillStyle = '#2a7ad8'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(128, 64, 92, 40, -0.1, 0, 7); g.fill(); A.text(g, 'CRUNCHIES', 128, 62, '34px ' + A.FONT, '#d01a1a', 'center'); A.text(g, 'SALT & PEPPER-ISH', 128, 88, '700 13px ' + A.UIF, '#2a7ad8', 'center'); g.fillStyle = '#e8c040'; g.beginPath(); g.ellipse(214, 100, 18, 12, 0.4, 0, 7); g.fill(); }));
  const old_canTex = () => remember('ch.can', 256, 128, flip((g, w, h) => { g.fillStyle = A.lin(g, 0, 0, 0, h, [[0, '#ff8a10'], [0.5, '#ffb030'], [1, '#e86a00']]); g.fillRect(0, 0, w, h); A.text(g, 'ZING!', 128, 78, '54px ' + A.FONT, '#fff', 'center'); A.text(g, 'ORANGE FIZZ', 128, 104, '700 12px ' + A.UIF, '#7a2a00', 'center'); g.fillStyle = '#c8c8cc'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8); }));
  const old_psTex = () => remember('ch.pscase', 256, 224, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = A.lin(g, 0, 20, 0, h, [[0, '#4a1a8a'], [1, '#d0306a']]); g.fillRect(30, 6, w - 36, h - 12); g.fillStyle = '#f4f4f4'; g.fillRect(6, 6, 20, h - 12); A.text(g, 'SPIKE', 140, 90, '44px ' + A.FONT, '#ffd400', 'center'); A.text(g, 'THE STEGOSAUR', 140, 116, '700 15px ' + A.UIF, '#fff', 'center'); g.fillStyle = '#5ad04a'; g.beginPath(); g.ellipse(140, 170, 44, 22, 0, 0, 7); g.fill(); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(110 + i * 14, 152); g.lineTo(117 + i * 14, 134); g.lineTo(124 + i * 14, 152); g.fillStyle = '#ffa020'; g.fill(); } });
  old_comicTex();old_crispTex();old_canTex();old_psTex();
  const crispTex = () => packageTex('ch.crisps','pack.crisps','CRUNCHIES','SALT & PEPPER-ISH',320,160,true);
  const canTex = () => packageTex('ch.can','pack.fizz','ZING!','ORANGE FIZZ',320,160,true);
  const psTex = () => packageTex('ch.pscase','pack.spike','SPIKE','THE STEGOSAUR • PLAYSPACE',320,280);
  const cdTex = () => A.printed('ch.cdface', 128, 128, (g, w, h) => { const gr = g.createConicGradient ? g.createConicGradient(0, 64, 64) : null; if (gr) { ['#e8e8f4', '#ffd8f0', '#d8f0ff', '#f4ffd8', '#ffe8c8', '#e8e8f4'].forEach((c, i) => gr.addColorStop(i / 5, c)); g.fillStyle = gr; } else g.fillStyle = '#e0e4ec'; g.beginPath(); g.arc(64, 64, 63, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 40, 0, 7); g.fill(); window.PrintArt?.paint(g,'pm.gub',16,20,96,84);A.text(g, 'HITS 43', 64, 54, '700 14px ' + A.FONT, '#d01a1a', 'center'); A.text(g, "The noise we call music", 64, 70, '7px ' + A.UIF, '#333', 'center'); g.fillStyle = '#c8c8cc'; g.beginPath(); g.arc(64, 64, 9, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.arc(64, 64, 4, 0, 7); g.fill(); }, { clamp: true });
  const MODELS = CK.MESS_MODELS = {
    socks: () => grpB(G => { const m = M({ c: '#fff', map: sockTex(), sh: 4, side: 2 });
      // one lies flat (foot and leg at an angle); its pair is bunched up across it
      G.geo(sock([[-10, 3.5, 0], [-7.5, 3.8, 0], [-4.5, 4, 0], [-1.5, 3.9, 0], [1.2, 3.1, 0], [3.2, 1.2, 0], [4.8, -1.4, 0], [6.4, -4.2, 0], [7.8, -6.8, 0], [8.9, -9.2, 0], [9.6, -10.6, 0]]), 0, 0, 0, m);
      G.geo(sock([[-6.5, -7.5, 0], [-4, -7.9, 0.1], [-1.5, -7.2, 0.3], [0.6, -5.6, 0.9], [2.2, -3.4, 1.7], [4.2, -1.8, 1.9], [6.8, -0.8, 1.5], [9.2, -1.2, 0.7], [11.2, -2.4, 0.2], [12.6, -3.6, 0]]), 0, 0, 0, m);
      G.shadow(1, 0, -3, 23, 17, 0.45); }),
    tshirt: () => cloth('tshirt'),
    jeans: () => cloth('jeans'),
    shirt: () => cloth('shirt'),
    pe: () => cloth('pe'),
    jumper2: () => cloth('jumper2'),
    mag1: () => grp(G => { G.box(0, -0.45, 0, 21, 0.9, 28, { t: M({ c: '#fff', map: A.t('mag') }), all: mat('#f0eee8') }); G.box(1, -1.1, 1, 20, 0.4, 27, mat('#f4f2ea'), { ry: 6 }); G.shadow(0, 0, 0, 26, 32, 0.45, { sq: true }); }),
    mag2: () => grp(G => { G.box(0, -0.45, 0, 21, 0.9, 28, { t: M({ c: '#fff', map: A.t('magB') }), all: mat('#f0eee8') }); G.shadow(0, 0, 0, 26, 32, 0.45, { sq: true }); }),
    comic: () => grp(G => { G.box(0, -0.3, 0, 17, 0.6, 26, { t: M({ c: '#fff', map: comicTex() }), all: mat('#f4f0e0') }); G.shadow(0, 0, 0, 22, 30, 0.4, { sq: true }); }),
    crisps: () => grpB(G => { G.geo(crispBag(false, 9), 0, 0, 0, crispMat(), { ry: 8 }); G.shadow(0, 0, 0, 21, 14, 0.4); }),
    crispsFull: () => grpB(G => { G.geo(crispBag(true, 4), 0, 0, 0, crispMat()); G.shadow(0, 0, 0, 20, 14, 0.45); }),
    can: () => grpB(G => { const C = G.at(0, -3.3, 0, 25, { rz: 90 }), al = mat('#c9cacf', { sh: 90, sp: '#fff', side: 2 });
      C.geo(canBody(), 0, 0, 0, M({ c: '#fff', map: canTex(), sh: 90, sp: '#ccc' }));
      C.lathe(0, 0, 0, [[0.05, -5.55], [2.5, -5.55], [2.62, -5.95], [2.85, -5.9], [2.98, -5.45], [3.3, -4.5]], 18, al);
      C.lathe(0, 0, 0, [[3.3, 4.5], [3.08, 5.35], [2.6, 5.75], [2.25, 5.6], [0.05, 5.15]], 18, al);
      C.geo(new T.TorusGeometry(0.55, 0.16, 4, 10), 0.6, -5.65, 0, al, { rx: 90 }); C.box(-0.4, -5.66, 0, 1.6, 0.18, 1.1, al);
      G.shadow(0, 0, 0, 14, 9, 0.5); }),
    wrap: () => grpB(G => {
      const foil = (c) => M({ c, map: K.tex('ch.foil', 32, 32, (g, w, h) => { g.fillStyle = '#e4e4e4'; g.fillRect(0, 0, w, h); for (let i = -h; i < w; i += 6) { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 3, 0); g.lineTo(i + 3 + h, h); g.lineTo(i + h, h); g.fill(); } A.grain(g, w, h, 160, 0.12, 4); }, {}), sh: 110, sp: '#fff', side: 2 });
      [['#d01a6a', -5.2, 1.6, 10], ['#f2c400', 4.4, 4.2, -32], ['#22a04a', 1.0, -4.8, 62]].forEach(([c, x, z, ry], n) => {
        const r = rnd(60 + n), pos = [], uv = [], index = [], add = (px, py, pz) => { pos.push(px, py, pz); uv.push(px / 9 + 0.5, pz / 9 + 0.5); return pos.length / 3 - 1; };
        // the crinkled middle (3 x 2.4 cm) and a fanned twist at each end
        const g = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) g.push(add(-2.1 + i * 1.4, -(0.2 + (j === 1 && i % 3 ? 0.9 : 0.25) + r() * 0.35), -1.6 + j * 1.6));
        for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) { const a = g[j * 4 + i], b = a + 1, e = g[(j + 1) * 4 + i], f = e + 1; index.push(a, b, e, b, f, e); }
        for (const s of [-1, 1]) { const knot = add(s * 2.7, -0.45, 0), tips = [-1.7, -0.6, 0.6, 1.7].map((zz, k) => add(s * (4.1 + r() * 0.5), -(k % 2 ? 1.0 : 0.25), zz)); const edge = s < 0 ? [g[0], g[4], g[8]] : [g[3], g[7], g[11]]; index.push(edge[0], edge[1], knot, edge[1], edge[2], knot); for (let k = 0; k < 3; k++) index.push(knot, tips[k], tips[k + 1]); }
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(index); geo.computeVertexNormals();
        G.geo(geo, x, 0, z, foil(c), { ry });
      }); G.shadow(0, 0, 0, 22, 19, 0.3); }),
    core: () => grpB(G => { const C = G.at(0, -2.95, 0, 20, { rz: 90 }), skin = mat('#b0261c', { sh: 40, sp: '#553' });
      const flesh = M({ c: '#fff', map: K.tex('ch.coreflesh', 16, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#b8894a'); gr.addColorStop(0.12, '#ead7a2'); gr.addColorStop(0.5, '#f2e4b8'); gr.addColorStop(0.88, '#ead7a2'); gr.addColorStop(1, '#b8894a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); A.grain(g, w, h, 90, 0.12, 8); }, { clamp: true }), sh: 12 });
      C.lathe(0, 0, 0, [[0.35, -4.3], [1.9, -4.12], [2.75, -3.62], [2.95, -3.15]], 12, skin);
      C.lathe(0, 0, 0, [[2.95, -3.15], [2.35, -2.55], [1.55, -1.6], [1.18, -0.6], [1.12, 0.4], [1.32, 1.4], [2.05, 2.35], [2.85, 3.05]], 12, flesh);
      C.lathe(0, 0, 0, [[2.85, 3.05], [2.72, 3.6], [1.95, 4.05], [0.45, 4.22]], 12, skin);
      for (const [x, a] of [[-0.3, 0.6], [0.5, 2.6], [0.1, 4.4]]) C.ball(Math.cos(a) * 1.08, x, Math.sin(a) * 1.08, 0.32, 0.55, 0.32, mat('#3a2110', { sh: 50 }), 6);
      C.cyl(0, -4.9, 0, 0.16, 0.2, 1.4, 5, mat('#5a3a1a'), { rz: 8 }); C.cyl(0, 4.3, 0, 0.7, 0.2, 0.3, 5, mat('#3a2a14'));
      G.shadow(0, 0, 0, 11, 7, 0.4); }),
    paper: () => grpB(G => { const geo = crumple(3.9, 31, 0.86); G.geo(geo, 0, -geo.boundingBox.max.y, 0, M({ c: '#fff', map: homeworkTex(), flat: true, sh: 4 })); G.shadow(0, 0, 0, 10, 10, 0.45); }),
    banana: () => grpB(G => { const m = M({ c: '#fff', map: bananaTex(), sh: 18, side: 2 }), r = rnd(77);
      [8, 100, 188, 276].forEach((deg, k) => { const a = (deg + r() * 14) * D2R, len = 8 + r() * 1.6, curl = k % 2 ? 0.5 : 0.9, path = [];
        for (let i = 0; i <= 8; i++) { const t = i / 8, rr = 0.6 + len * t, lift = 2.3 * Math.pow(1 - t, 2.2) + (t > 0.75 ? curl * (t - 0.75) * 2.4 : 0); path.push([Math.cos(a) * rr + Math.sin(a) * Math.sin(t * 3) * 0.6, Math.sin(a) * rr - Math.cos(a) * Math.sin(t * 3) * 0.6, lift]); }
        G.geo(tube(path, t => 0.35 + 1.25 * Math.sin(Math.PI * (0.12 + t * 0.8)), () => 0.17, { radial: 6 }), 0, 0, 0, m); });
      G.cyl(0, -2.6, 0, 0.55, 0.9, 1.8, 7, mat('#8a8a3a', { sh: 10 })); G.cyl(0, -3.65, 0.1, 0.45, 0.5, 0.5, 6, mat('#2a2010'), { rx: 12 });
      G.shadow(0, 0, 0, 20, 20, 0.35); }),
    yog: () => grpB(G => { const C = G.at(0, -3.25, 0, -30, { rz: 90 }), white = mat('#f7f4ee', { sh: 30, side: 2 }), foil = mat('#d8d8de', { sh: 110, sp: '#fff', side: 2 });
      C.cyl(0, 0, 0, 3.2, 2.55, 6, 16, { s: M({ c: '#fff', map: yogTex(), sh: 40, sp: '#666' }) }, { open: true });
      C.cyl(0, 0, 0, 3.0, 2.38, 5.9, 16, mat('#fbf6f2', { sh: 20, side: 1 }), { open: true });
      C.disc(0, 2.98, 0, 2.55, white, 16, { rx: 180 }); C.geo(new T.TorusGeometry(3.25, 0.2, 4, 16), 0, -3.0, 0, white, { rx: 90 });
      C.disc(0.2, -3.6, 3.4, 3.1, foil, 14, { rx: -55 });
      G.disc(-4.6, -0.2, -2.6, 2.6, mat('#eba3bb', { sh: 40, sp: '#888' }), 12, { sx: 1.4 }); G.shadow(0, 0, 0, 12, 9, 0.45); }),
    plate: () => grp(G => { G.lathe(0, 0, 0, [[0.1, -0.4], [7, -0.4], [10.5, -1.3], [12, -1.6]], 28, mat('#f6f4ee', { sh: 60, sp: '#888' })); G.lathe(0, 0, 0, [[12, -1.6], [7, 0], [0.1, 0]], 28, mat('#e8e4da')); /* the glaze faces up and the foot down, so the contact shadow stays under it */ [[3, 2, 20], [-2, 4, -40], [1, -3, 70]].forEach(([x, z, ry]) => G.rbox(x, -1.4, z, 6, 1.2, 1.6, 0.4, mat('#a86a30'), { ry })); for (let i = 0; i < 9; i++) G.box(((i * 37) % 11) - 5, -0.6, ((i * 23) % 9) - 4, 0.6, 0.4, 0.6, mat('#c89050')); G.shadow(0, 0, 0, 26, 26, 0.45); }),
    mug: () => grp(G => { G.cyl(0, -5, 0, 4.2, 4, 10, 18, { s: mat('#2a5ad0', { sh: 60, sp: '#888' }), t: mat('#6a4020'), u: mat('#2a5ad0') }, { open: false }); G.geo(new T.TorusGeometry(2.6, 0.7, 6, 12), 4.6, -5, 0, mat('#2a5ad0', { sh: 60 })); G.cyl(0, -9.6, 0, 3.6, 3.6, 0.3, 16, mat('#7a5030', { sh: 40 })); G.box(0, -6, 4.15, 4, 1, 0.1, mat('#fff')); G.shadow(0, 0, 0, 12, 12, 0.5); }),
    bowl: () => grp(G => { G.lathe(0, 0, 0, [[7.5, -5], [7, -2.5], [4, 0], [0.1, 0]], 22, mat('#f2ece0', { sh: 50, sp: '#666', side: 2 })); G.disc(0, -1.6, 0, 5.4, mat('#f8f4e8')); for (let i = 0; i < 6; i++) G.box(Math.cos(i) * 3, -1.9, Math.sin(i * 1.7) * 3, 1.6, 0.4, 1.3, mat('#e8a830'), { ry: i * 40 }); G.cyl(4, -6, 1, 0.4, 0.4, 9, 6, mat('#c8c8cc', { sh: 90 }), { rz: 70 }); G.shadow(0, 0, 0, 18, 18, 0.5); }),
    cd1: () => grp(G => { G.cyl(0, -0.1, 0, 6, 6, 0.2, 32, { s: mat('#ccc'), t: M({ c: '#fff', map: cdTex(), sh: 120, sp: '#fff' }), u: mat('#d8dce8', { sh: 120, sp: '#fff' }) }); G.shadow(0, 0, 0, 14, 14, 0.35); }),
    cd2: () => grp(G => { G.box(0, -0.6, 0, 14.2, 1.2, 12.4, { t: M({ c: '#fff', map: psTex(), sh: 60, sp: '#666' }), all: mat('#111') }); G.shadow(0, 0, 0, 17, 15, 0.5, { sq: true }); }),
  };
  // where today's mess can lie (the floor: anything on the bed would be under the bed's own click box)
  const SPOTS = [[-30, FY, 112, 20], [40, FY, 152, -35], [-112, FY, 140, 60], [92, FY, 82, 10], [-82, FY, 226, -20], [22, FY, 222, 45], [-150, FY, 182, 80], [-20, FY, 176, 15], [70, FY, 198, -10], [-188, FY, 124, 30], [-62, FY, 148, 30], [-104, FY, 196, -40]];
  function layout(day) { const items = CC.tidyFor(day,sparse), r = CC.rng('chpos|' + day), sp = CC.shuffle(SPOTS, r); return items.map((m, i) => ({ m, at: sp[i % sp.length] })); }

  // ================================================================ TIDY YOUR ROOM
  let tidyR = null, magN = 0, basketPile = null, basketN = 0;
  CK.add({
    id: 'tidy', room: 'bedroom',
    build(r) {
      tidyR = r;
      for (const m of CC.MESS) {
        if(sparse&&['mag','cd'].includes(m.kind))continue;
        const id = 'ch.m.' + m.id;
        CK.thing(id, { obj: MODELS[m.id](), kind: 'mess.' + m.kind, label: m.n, chore: 'tidy', holdD: m.kind === 'clothes' ? 60 : 45, home: { room: 'bedroom', x: 0, y: FY, z: 100, hide: true } });
      }
      // where things go
      CK.snap('ch.s.basket', { room: 'bedroom', x: 110, y: FY - 46, z: 222, r: 34, box: [34, 2, 34], glow: 'washing', round: true, accepts: k => k === 'mess.clothes', hide: true, hint: 'Let go: in the washing basket', onSnap: t => put(t) });
      CK.snap('ch.s.bin', { room: 'bedroom', x: -118, y: FY - 30, z: -42, r: 26, box: [22, 2, 22], glow: 'bin', round: true, accepts: k => k === 'mess.rubbish', hide: true, hint: 'Let go: in the bin', onSnap: t => put(t) });
      CK.snap('ch.s.rack', { room: 'bedroom', x: -234, y: FY - 46, z: -30, r: 28, box: [22, 30, 6], accepts: k => k === 'mess.cd', hide: true, hint: 'Let go: back in the CD rack', onSnap: t => put(t) });
      const pile = CK.snap('ch.s.mags', { room: 'bedroom', x: -144, y: FY - 4, z: 58, r: 30, box: [24, 2, 30], accepts: k => { if (k !== 'mess.mag') return false; pile.pose = { x: -144 + magN * 0.8, y: FY - 2.8 - magN * 1.1, z: 58 + magN * 0.6, ry: -8 + magN * 7 }; return true; }, hint: 'Let go: on the pile of mags', onSnap: t => { magN++; put(t, true); } });
      const receptacles=[['ch.s.basket','washing',44],['ch.s.bin','bin',27]];
      for(const [slot,id]of receptacles)H.SNAPS[slot].enabled=()=>{const target=H.THINGS[id];return !!target&&['rest','snap'].includes(target.st)&&!target.at.hide};
      H.ambient.add(()=>{for(const [slot,id,offset]of receptacles){
        const target=H.THINGS[id],snap=H.SNAPS[slot];if(!target||!snap)continue;
        Object.assign(snap,{room:target.at.room,x:target.at.x,y:target.at.y-offset,z:target.at.z});
        if(id==='washing'&&basketPile){const r=H.ROOMS[target.at.room];if(r&&basketPile.parent!==r.things)r.things.add(basketPile);basketPile.position.set(target.at.x,target.at.y-offset,target.at.z);basketPile.visible=basketN>0&&target.st==='rest'}
      }});
      // the basket fills up as clothes go in
      // (crumpled clothes heaped in it: the same draped cloth as the floor's, in the clothes' own colours)
      basketPile = grp(G => { const blob = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => { const a = k / 10 * Math.PI * 2, rr = 46 + (k % 3) * 7; return [64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr]; });
        [['tshirt', 0, 0, 0, 3.2], ['jeans', 5, -4, 70, 2.6], ['shirt', -5, 4, 150, 2.4], ['jumper2', 2, 5, 230, 2.2]].forEach(([k, x, z, ry, lift], i) => G.geo(sheet(blob, 24 - i * 2, 22 - i * 2, { res: 9, seed: 80 + i, thick: 1.6, folds: [[30, 40, 100, 80, 2.2, 3.5]], lump: [[60, 60, 3.5, 6]] }), x, -i * 1.5 + 1, z, clothMat(k), { ry })); });
      basketPile.position.set(110, FY - 44, 222); basketPile.visible = false; r.group.add(basketPile);
      this.lay();
      CK.guard('washing', () => { CK.jack('Washing basket', CK.done('tidy') ? 'Full of my clothes. Mom does the washing on a Monday. Or whenever the basket explodes.' : 'Clothes off the floor go in here. (That\'s half of tidying my room.)'); return true; });
    },
    also: {
      kitchen: () => CK.snap('ch.s.sink', { room: 'kitchen', x: -80, y: GY - 96, z: -26, r: 32, box: [40, 2, 30], accepts: k => k === 'mess.dish', hide: true, hint: 'Let go: in the sink', onSnap: t => { CK.snd.splash(); put(t); } }),
    },
    lay() { // today's mess (and anything already put away stays put away)
      const d = CK.day(), L = layout(d), on = new Set(L.map(x => x.m.id));
      magN = 0;
      for (const m of CC.MESS) {
        const id = 'ch.m.' + m.id, t = CK.MINE[id]; if (!t) continue;
        const it = L.find(x => x.m.id === m.id);
        if (!on.has(m.id)) { t.home = { room: 'bedroom', x: 0, y: FY, z: 100, hide: true }; if (!t.at.hide || t.st === 'held') CK.home(id); CK.lock(id); continue; }
        const [x, y, z, ry] = it.at;
        t.home = { room: 'bedroom', x, y, z, ry };
        if (CK.has('tidy', m.id)) { t.home = Object.assign({}, t.home, { hide: true }); if (m.kind === 'mag') { magN++; const a = CK.S.at[id]; if (a) { t.at = { room: a[0], x: a[1], y: a[2], z: a[3], ry: a[4] };t.snap=a[7]&&H.SNAPS[a[7]]?a[7]:null;t.st=t.snap?'snap':'rest';t.rx=a[5]||0;t.rz=a[6]||0; H.place(t); } } else if (!t.at.hide) CK.home(id, { hide: true }); CK.lock(id,m.kind!=='mag'); continue; }
        CK.lock(id, false);
        if (!CK.S.at[id] && t.st !== 'held') CK.home(id);
      }
    },
    reset() { this.lay(); this.sync(); },
    sync() {
      basketN = CC.tidyFor(CK.day(),sparse).filter(m => m.kind === 'clothes' && CK.has('tidy', m.id)).length;
      if (basketPile) { basketPile.visible = basketN > 0; basketPile.scale.set(1, 0.6 + basketN * 0.4, 1); H.dirty(); }
    },
    take() { return true; }, // (the house's own "tidy" check: this is the real one)
  });
  function put(t, stay) {
    const mid = t.id.slice(5);
    if (!stay) t.home = Object.assign({}, t.at, { hide: true });
    else t.home = Object.assign({}, t.at);
    CK.lock(t.id,!stay); CK.keep(t.id);
    if(stay&&CK.S.at[t.id]){CK.S.at[t.id][5]=t.rx||0;CK.S.at[t.id][6]=t.rz||0;CK.S.at[t.id][7]=t.snap||null;CK.save()}
    const m = CC.MESSID[mid];
    if (m && m.id === 'socks' && Math.random() < 0.35) setTimeout(() => { CK.jack('Socks', 'Two socks went in. Wait: these are two DIFFERENT socks. Where are the other two? (Behind the radiator, probably. The sock monster lives there.)'); }, 300);
    CK.step('tidy', mid);
    CK.MODS.tidy.sync();
  }
  H.on('reading-shelved',t=>{if(t.kind==='mess.mag')put(t,true)});
  CK.R.addClue('radiator', { title: 'Behind the radiator', when: () => CK.has('tidy', 'socks') || CK.done('tidy'), once: true, secret: 'ch.sock', text: 'Behind the radiator: FOUR odd socks, a 1997 Panino sticker and a fluff ball the size of a hamster. So THIS is where they go. The sock monster is real.' });

  // ================================================================ MAKE YOUR BED
  let duv = null, duvBase = null, duvK = { s: 0, f: 0, t: 0, lift: 0 };
  const BED = { x0: 148, x1: 238, z0: -55, z1: 140 };
  const bw = BED.x1 - BED.x0, bl = BED.z1 - BED.z0, bcx = (BED.x0 + BED.x1) / 2, bcz = (BED.z0 + BED.z1) / 2;
  function duvShape() {
    if (!duv) return;
    const p = duv.geometry.attributes.position, W = bw + 14, L = bl - 34;
    for (let i = 0; i < p.count; i++) {
      const x = duvBase[i * 2], y = duvBase[i * 2 + 1], u = x / W + 0.5, v = y / L + 0.5;
      // the way it was left (js/rm-room.js draws exactly this), and the way Mom wants it
      let base = -Math.sin(u * Math.PI) * 6; if (u < 0.08) base += (0.08 - u) * 190; if (u > 0.94) base += (u - 0.94) * 140;
      const wr = -Math.sin(v * 9 + u * 5) * 1.6 - Math.sin(u * 13 - v * 4) * 1.2;
      let neat = -Math.sin(u * Math.PI) * 2.6 - 0.6; if (u < 0.07) neat += (0.07 - u) * 240; if (u > 0.95) neat += (u - 0.95) * 160; if (v > 0.97) neat += (v - 0.97) * 90;
      const b = Math.max(0, Math.min(1, duvK.s * (1 - sstep(0.35, 0.65, u)) + duvK.f * sstep(0.35, 0.65, u)));
      const y2 = base + (neat - base) * b + wr * (1 - duvK.t) * (1 - 0.5 * b) - duvK.lift * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
      p.setZ(i,-y2+(duv.geometry.attributes.clothDepth?.getX(i)||0));
    }
    p.needsUpdate=true;duv.geometry.computeVertexNormals();duv.geometry.computeBoundingSphere();duv.geometry.boundingBox=null;H.softChanged?.('bedroom');H.dirty();
  }
  function pull(which) {
    const key = { pullL: 's', pullR: 'f', smooth: 't' }[which], t0 = performance.now(), ms = 700;
    CK.snd.whoosh();
    H.anims.set('ch.duv', now => { const k = Math.min(1, (now - t0) / ms); duvK[key] = CK.ease(k); duvK.lift = Math.sin(k * Math.PI) * (which === 'smooth' ? 1.5 : 5); duvShape(); return k < 1; });
  }
  let pillowT = null, pjsT = null;
  CK.add({
    id: 'bed', room: 'bedroom',
    build(r) {
      // the duvet: ours now (the room's own one, which is exactly the same shape, is hidden)
      const dtex = A.t('duvet');
      r.group.traverse(o => { if (o.isMesh && o.material && o.material.map === dtex && !o.userData.ch) o.visible = false; });
      const W=bw+14,L=bl-34,geo=K.thicken(new T.PlaneGeometry(W,L,22,30),.8);
      duvBase = new Float32Array(geo.attributes.position.count * 2);
      for (let i = 0; i < geo.attributes.position.count; i++) { duvBase[i * 2] = geo.attributes.position.getX(i); duvBase[i * 2 + 1] = geo.attributes.position.getY(i); }
      const g = new T.Group(); r.group.add(g);
      duv = K.into(g).geo(geo, bcx, 36, bcz + 14, M({ c: '#fff', map: dtex, side: 2 }).clone(), { rx: 90 }); duv.userData.ch = 1; for (const s of H.softs || []) if (s.room === 'bedroom') s.meshes.push(duv);
      // The bed's only pillow starts on the floor, beside the pyjamas.
      const pil = grp(G => { G.rbox(0, -5, 0, 50, 10, 30, 4.8, M({ c: '#fff', map: A.t('pillow'), sh: 8 })); G.ball(0, -7, 0, 22, 4, 12, M({ c: '#fff', map: A.t('pillow'), sh: 8 }), 14); G.shadow(0, 0, 0, 56, 34, 0.5, { sq: true }); });
      pillowT = CK.thing('ch.pillow', { obj: pil, kind: 'pillow', label: 'Pillow (on the floor, obviously)', chore: 'bed', holdD: 70, home: { room: 'bedroom', x: 40, y: FY, z: 72, ry: 80 } });
      pjsT = CK.thing('ch.pjs', { obj: cloth('pjs', 34, 32, 3, P.pjs, 21), kind: 'pjs', label: 'Pyjamas', chore: 'bed', holdD: 55, home: { room: 'bedroom', x: 112, y: FY, z: 150, ry: -20 } });
      CK.snap('ch.s.pillow', { room: 'bedroom', x: 180, y: 0, z: 10, r: 80, box: [80, 2, 120], accepts: k => k === 'pillow', pose: { x: 190, y: 37, z: -33, ry: 0 }, hint: 'Let go: on the bed', onSnap: () => { CK.lock('ch.pillow'); CK.step('bed', 'pillow'); CK.snd.thud(); } });
      CK.snap('ch.s.pjs', { room: 'bedroom', x: 180, y: 0, z: 10, r: 80, box: [80, 2, 120], pose: { x: 188, y: 24, z: -30, ry: 0 }, accepts: k => k === 'pjs', hide: true, hint: 'Let go: under the pillow', onSnap: () => { CK.lock('ch.pjs'); CK.step('bed', 'pjs'); CK.snd.rustle(); } });
      // clicking the bed straightens the duvet (once it's made, the bed is the bed again: there might be something in it)
      CK.guard('bed', () => bedClick());
      this.sync();
    },
    sync() {
      const v = V(), dn = CK.done('bed');
      duvK.s = CK.has('bed', 'pullL') ? 1 : 0; duvK.f = CK.has('bed', 'pullR') ? 1 : 0; duvK.t = CK.has('bed', 'smooth') ? 1 : 0; duvK.lift = 0; duvShape();
      if (pillowT) { if (CK.has('bed', 'pillow')) { pillowT.home = { room: 'bedroom', x: 190, y: 37, z: -33, ry: 0 }; CK.lock('ch.pillow'); if (Math.abs(pillowT.at.x - 190) > 2 || pillowT.at.y !== 37) CK.home('ch.pillow'); } else CK.lock('ch.pillow', false); }
      if (pjsT) { if (CK.has('bed', 'pjs')) { pjsT.home = { room: 'bedroom', x: 112, y: FY, z: 150, hide: true }; CK.lock('ch.pjs'); if (!pjsT.at.hide) CK.home('ch.pjs'); } else CK.lock('ch.pjs', false); }
      void v; void dn;
    },
    guide() { return duv; },
    reset() {
      // A finished chore changes these homes (the pyjamas become hidden).
      // A new day / owner's retry must start with real, reachable objects.
      pillowT.home = { room: 'bedroom', x: 40, y: FY, z: 72, ry: 80 };
      pjsT.home = { room: 'bedroom', x: 112, y: FY, z: 150, ry: -20 };
      CK.home('ch.pillow'); CK.home('ch.pjs'); this.sync();
    },
  });
  function bedClick() {
    if (CK.done('bed')) return false;
    const next = ['pullL', 'pullR', 'smooth'].find(s => !CK.has('bed', s));
    if (!next) return false;
    CK.begin('bed');
    pull(next);
    setTimeout(() => CK.step('bed', next), 380);
    const L = { pullL: 'Grab the edge... and PULL. It flaps up like a parachute.', pullR: 'Now the other side: tuck it in down the side by the wall.', smooth: 'Smooth it all out flat. Look at that. Like a hotel.' };
    CK.jack('Making the bed', L[next] + (next === 'smooth' && !CK.has('bed', 'pillow') ? '<br><small>(The spare pillow\'s still on the floor. And my pyjamas.)</small>' : ''), 3200);
    return true;
  }

  // ================================================================ EMPTY YOUR BIN
  let bag = null, bagOpen = null, bagTied = null, liner = null, binStuff = [];
  CK.add({
    id: 'bin', room: 'bedroom',
    build(r) {
      const binObj = H.SPOTS.bin && H.SPOTS.bin.obj;
      if (binObj) binObj.children.forEach(o => { if (o.isMesh && o.geometry && (o.geometry.type === 'BoxGeometry' || o.geometry.type === 'SphereGeometry')) binStuff.push(o); });
      const bm = mat('#1c1c20', { sh: 70, sp: '#555' });
      const g = new T.Group();
      bagOpen = grp(G => { G.lathe(0, 0, 0, [[10.6, -27.4], [9.6, -26.6], [8.9, -23], [9.1, -14], [8.6, -5], [6.5, -0.8], [0.1, -0.3]], 20, bm.clone ? M({ c: '#1c1c20', sh: 70, sp: '#555', side: 2 }) : bm); G.ball(-3, -21.5, 2, 4, 2.4, 3.5, M({ c: '#fff', map: crispTex() }), 10); G.ball(3, -21, -2, 3, 2.6, 3, mat('#f4f2ea'), 8); G.box(1, -22, 4, 4, 1, 3, mat('#d01a6a', { sh: 80 }), { ry: 30 }); });
      bagTied = grp(G => { G.lathe(0, 0, 0, [[0.6, -34], [2.2, -32], [1.4, -29.5], [5.5, -26], [9.4, -19], [9.6, -10], [8.6, -3], [6, -0.6], [0.1, -0.2]], 20, bm); G.ball(-2.4, -34.5, 0, 2.2, 1.2, 1.4, bm, 8, { rz: 30 }); G.ball(2.4, -34.5, 0, 2.2, 1.2, 1.4, bm, 8, { rz: -30 }); });
      bagTied.visible = false; g.add(bagOpen); g.add(bagTied);
      bag = CK.thing('ch.binbag', { obj: g, kind: 'binbag', label: 'Bin bag', chore: 'bin', holdD: 60, home: { room: 'bedroom', x: -118, y: FY - 0.5, z: -42, ry: 0 } });
      bag.canGrab = () => CK.has('bin', 'tie');
      const sp = H.SPOTS['ch.binbag']; sp.use = true; sp.act = () => { if (!CK.has('bin', 'tie')) return tie(); H.grab('ch.binbag'); };
      sp.label = () => CK.has('bin', 'tie') ? 'Bin bag (tied up: take it downstairs)' : 'Bin bag (full: tie it up)';
      // a fresh bag goes in once the old one's out
      liner = grp(G => { G.lathe(0, 0, 0, [[10.6, -27.4], [9.6, -26.6], [8.4, -24], [8.4, -2], [0.1, -1]], 20, M({ c: '#2a2a30', sh: 70, sp: '#444', side: 2 })); });
      liner.position.set(-118, FY - 0.5, -42); liner.visible = false; r.group.add(liner);
      this.sticky = CK.sticky(r, 'bin', -118, FY - 18, -31.5, { text: 'EMPTY ME! It is ALIVE.', size: 8, rz: -6 });
      this.sync();
    },
    also: {
      kitchen: () => {
        CK.snap('ch.s.kbin', { room: 'kitchen', x: 170, y: GY - 66, z: 20, r: 40, box: [30, 2, 30], glow: () => H.SPOTS['hs.bin'] && H.SPOTS['hs.bin'].obj, round: true, accepts: k => k === 'binbag', hide: true, hint: 'Let go: in the kitchen bin', onSnap: () => {
          CK.snd.thud(); CK.lock('ch.binbag'); bag.home = Object.assign({}, bag.at, { hide: true });
          const kb = H.SPOTS['hs.bin'] && H.SPOTS['hs.bin'].obj; if (kb) { const s0 = kb.scale.y; CK.tween(kb, { s: 1 }, 1, {}).then(() => { kb.scale.set(1, s0 * 0.94, 1); setTimeout(() => { kb.scale.set(1, 1, 1); H.dirty(); }, 140); }); }
          CK.step('bin', 'bag'); CK.MODS.bin.sync();
        } });
      },
    },
    sync() {
      const tied = CK.has('bin', 'tie'), gone = CK.has('bin', 'bag') || CK.done('bin');
      if (bagOpen) { bagOpen.visible = !tied; bagTied.visible = tied; }
      if (bag) { if (gone) { bag.home = { room: 'bedroom', x: -118, y: FY - 0.5, z: -42, hide: true }; CK.lock('ch.binbag'); if (!bag.at.hide && bag.st !== 'held') CK.home('ch.binbag'); } else CK.lock('ch.binbag', false); }
      const out = gone || (bag && bag.st === 'held') || (bag && (Math.abs(bag.at.x + 118) > 6 || Math.abs(bag.at.z + 42) > 6));
      if (liner) liner.visible = !!out;
      binStuff.forEach(o => { o.visible = !out || tidyInBin() > 0; });
      if (this.sticky) this.sticky.visible = CK.onList('bin') && !CK.done('bin');
      H.dirty();
    },
    reset() {
      bag.home = { room: 'bedroom', x: -118, y: FY - .5, z: -42, ry: 0 };
      CK.home('ch.binbag'); this.sync();
    },
  });
  H.on('grab', id => { if (id === 'ch.binbag') CK.MODS.bin.sync(); });
  H.on('rest', id => { if (id === 'ch.binbag') CK.MODS.bin.sync(); });
  function tidyInBin() { return CC.tidyFor(CK.day(), sparse).filter(m => m.kind === 'rubbish' && CK.has('tidy', m.id)).length; }
  function tie() {
    CK.begin('bin');
    const g = bag.obj, s0 = 1;
    CK.snd.bag(); CK.secret('ch.knot');
    CK.tween(g, { s: s0 }, 1).then(() => {
      const t0 = performance.now();
      H.anims.set('ch.tie', now => { const k = Math.min(1, (now - t0) / 500); bagOpen.scale.set(1 - k * 0.3, 1 + k * 0.15, 1 - k * 0.3); if (k >= 1) { bagOpen.scale.set(1, 1, 1); CK.step('bin', 'tie'); CK.MODS.bin.sync(); return false; } return true; });
    });
    CK.jack('Bin bag', 'Twist, twist, double knot. Now it\'s a proper bin bag. It smells of crisps and regret. Take it down to the kitchen bin.', 4500);
    return true;
  }

  // ================================================================ FEED THE CAT
  let bowl = null, bowlFill = null, catBox = null, catHome = null, catBusy = false;
  const BOWL = { x: 122, z: 112 };
  CK.add({
    id: 'cat', room: 'bedroom',
    build(r) {
      bowl = grp(G => { const shell=G.lathe(0, 0, 0, [[0,0],[10,0],[9.4,-3.8],[8.6,-4.6],[8,-4.2],[7.4,-1.2],[0,-1.2],[0,0]].reverse(), 24, mat('#ac4476',{sh:25,sp:'#483344'}));const p=shell.geometry.attributes.position,n=shell.geometry.attributes.normal;for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i)+1.2)<.001)n.setXYZ(i,0,-1,0); G.shadow(0, 0, 0, 24, 24, 0.5); });
      bowl.position.set(BOWL.x, FY, BOWL.z); r.group.add(bowl);
      const nameTex = K.tex('ch.bowlname', 128, 32, (g, w, h) => { g.fillStyle='#a92f70';g.fillRect(0,0,w,h); A.text(g, CK.cast('{cat}').toUpperCase(), 64, 24, '700 20px ' + A.FONT, '#fff', 'center'); }, { clamp: true });
      const band=new T.PlaneGeometry(10,2.5,24,1),bp=band.attributes.position,bu=band.attributes.uv;
      for(let i=0;i<bp.count;i++){const y=bp.getY(i)-2.3,a=bp.getX(i)/10,r=10+y*.158+.09;bp.setXYZ(i,Math.sin(a)*r,y,Math.cos(a)*r);bu.setY(i,1-bu.getY(i))}band.computeVertexNormals();
      K.into(bowl).geo(K.thicken(band,.06),0,0,0,M({c:'#fff',map:nameTex,sh:14,sp:'#332631'}));
      bowlFill = grp(G => { const r2 = rnd(77); for (let i = 0; i < 26; i++) { const a = r2() * Math.PI * 2, d = Math.sqrt(r2()) * 6.2; G.ball(Math.cos(a) * d, -1.6 - r2() * 1.6 - (6.2 - d) * 0.25, Math.sin(a) * d, 1.1, 0.8, 1.1, mat(['#a0642a', '#8a4a1a', '#c08040'][i % 3], { sh: 20 }), 6); } });
      bowl.add(bowlFill); bowlFill.visible = false;
      CK.spot(r, 'ch.bowl', bowl, { label: () => `${CK.cast('{cat}')}'s bowl`, act: () => CK.jack(CK.cast('{cat}\'s bowl'), CK.has('cat', 'pour') ? 'Full of biscuits. Now give {cat} a shout (click {cat.him} on the cat tree).'.replace(/\{[^}]+\}/g, x => CK.cast(x)) : CK.cast('Empty. {cat} keeps looking at it, then at me. The cat biscuits are on my desk.')) });
      // the cat biscuits
      const boxTex = A.printed('ch.catbox', 320, 480, (g, w, h) => {g.save();g.scale(w/128,h/192); g.fillStyle = '#7a2a9a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd400'; g.fillRect(0, 0, w, 44); A.text(g, 'KITTY', 64, 34, '34px ' + A.FONT, '#7a2a9a', 'center'); A.text(g, 'CRUNCH', 64, 80, '32px ' + A.FONT, '#fff', 'center'); g.fillStyle = '#ff9a3a'; g.beginPath(); g.arc(64, 130, 30, 0, 7); g.fill(); g.fillStyle = '#ff9a3a'; g.beginPath(); g.moveTo(40, 112); g.lineTo(44, 88); g.lineTo(58, 104); g.moveTo(70, 104); g.lineTo(84, 88); g.lineTo(88, 112); g.fill(); g.fillStyle = '#111'; g.fillRect(52, 124, 6, 6); g.fillRect(70, 124, 6, 6); if(window.PrintArt?.has('pack.cat')){g.fillStyle='#7a2a9a';g.fillRect(18,86,92,80);PrintArt.paint(g,'pack.cat',18,86,92,80)}A.text(g, 'with real tuna*', 64, 182, '10px ' + A.UIF, '#ffd400', 'center');g.restore();}, {clamp:true});
      const cb = grp(G => { G.box(0, -8, 0, 11, 16, 4.5, { f: M({ c: '#fff', map: boxTex }), b: M({ c: '#fff', map: boxTex }), all: mat('#6a2a8a') }); G.box(0,-16.12,-1.12,11,.24,2.24,mat('#d4ac2c'));G.box(0,-16.17,1.1,11,.24,2.18,mat('#e5bd34'));G.box(0,-16.32,0,10.4,.15,.28,mat('#9b7927'));G.box(-5.51,-8,0,.08,15,3.6,mat('#592071')); G.shadow(0, 0, 0, 14, 8, 0.5, { sq: true }); });
      catBox = CK.thing('ch.catbox', { obj: cb, kind: 'catfood', label: 'Cat biscuits', chore: 'cat', holdD: 45, home: { room: 'bedroom', x: 64, y: 0, z: 4, ry: 20 }, useLabel: 'Shake some out', use: () => shake() });
      const cat = H.SPOTS.cat && H.SPOTS.cat.obj;
      if (cat) { catHome = { x: cat.position.x, y: cat.position.y, z: cat.position.z, ry: cat.rotation.y }; CK.guard('cat', () => callCat()); }
      this.sticky = CK.sticky(r, 'cat', BOWL.x, FY - 0.2, BOWL.z + 16, { text: 'Feed {cat}! (NOT ham)', size: 8, rx: -88 });
      this.sync();
    },
    sync() {
      const poured = CK.has('cat', 'pour'), ate = CK.has('cat', 'ate');
      if (bowlFill && !catBusy) { bowlFill.visible = poured && !ate; bowlFill.scale.set(1, 1, 1); }
      if (this.sticky) this.sticky.visible = CK.onList('cat') && !CK.done('cat');
      H.dirty();
    },
    reset() { CK.home('ch.catbox'); this.sync(); },
  });
  function shake() {
    if (CK.done('cat') || CK.has('cat', 'pour')) return CK.jack('Cat biscuits', CK.cast('{cat}\'s had {cat.his} tea. Any more and {cat.he}\'ll be too fat to fit through the window.'));
    const p = catBox.obj.position, d = Math.hypot(p.x - BOWL.x, p.z - BOWL.z);
    CK.begin('cat');
    if (d > 42) { CK.snd.rustle(); CK.fx.burst(CK.MODS.cat._r || H.ROOMS.bedroom, p.x, p.y, p.z, { n: 6, col: '#a0642a', size: 1.6, life: 1.1, spd: 12, up: 5, grav: 300, floor: FY - 0.3, fade: false }); CK.oops('cat'); return CK.jack('Cat biscuits', 'Oops. Biscuits on the carpet. Over the BOWL, {me}. (Walk to the bowl by the bed and shake them in.)'); }
    const r = H.ROOMS.bedroom; let n = 0;
    CK.snd.rustle(); setTimeout(CK.snd.rustle, 300); setTimeout(CK.snd.rustle, 600);
    const iv = setInterval(() => { CK.fx.burst(r, p.x, p.y + 2, p.z, { n: 5, col: '#9a5a24', size: 1.5, life: 0.9, spd: 4, up: -5, grav: 700, floor: FY - 2.5, fade: false, to: [BOWL.x, FY - 3, BOWL.z] }); if (++n >= 7) clearInterval(iv); }, 140);
    setTimeout(() => { bowlFill.visible = true; bowlFill.scale.set(1, 0.2, 1); CK.tween(bowlFill, { s: 1 }, 400); CK.step('cat', 'pour'); CK.jack('Cat biscuits', CK.cast('Rattle rattle. One ear on the cat tree just twitched. Now give {cat} a shout: click {cat.him} (on the cat tree).'), 4500); }, 900);
  }
  // The cat comes for its tea: a stretch, down off the cat tree (two hops), a walk across to the bowl, every last biscuit,
  // a sit and a lick, then the walk back and up to bed again. Poses come from the model (js/rm-room.js catModel).
  const faceTo = (from, x, z) => Math.atan2(z - from.z, -(x - from.x));
  function walkTo(cat, x, z, speed) {
    const P = cat.userData.pose, d = Math.hypot(x - cat.position.x, z - cat.position.z), t0 = performance.now(); let on = true;
    cat.rotation.y = faceTo(cat.position, x, z);
    if (P) H.anims.set('ch.catwalk', now => { if (on) P('walk', now - t0); return on; });
    return CK.tween(cat, { x, y: FY, z }, Math.max(300, d / (speed || 70) * 1000), { linear: true }).then(() => { on = false; });
  }
  function callCat() {
    if (catBusy) return true;
    if (!CK.has('cat', 'pour') || CK.has('cat', 'ate')) return false;
    const cat = H.SPOTS.cat.obj; catBusy = true;
    const P = cat.userData.pose || (() => {}), tree = cat.userData.tree, home = cat.userData.homePose || 'sleep';
    CK.step('cat', 'call');
    CK.jack(CK.cast('{cat}'), CK.cast('"Psss psss psss! {cat}! DINNER!" One eye opens. Then the other. Then {cat.he} remembers {cat.he}\'s a cat and takes {cat.his} time about it.'), 5000);
    const wait = ms => new Promise(res => setTimeout(res, ms)), up = catHome.y < FY - 20;
    (async () => {
      await wait(700); P('stretch'); H.dirty(); await wait(1100);
      if (up && tree) { // down: the middle shelf, then the floor
        P('walk', 0); cat.rotation.y = faceTo(cat.position, tree.out.x, tree.out.z);
        await CK.tween(cat, { x: tree.mid.x, y: tree.mid.y, z: tree.mid.z }, 420, { arc: 8 }); CK.snd.thud();
        await CK.tween(cat, { x: tree.out.x, y: FY, z: tree.out.z }, 480, { arc: 10 }); CK.snd.thud();
      } else if (tree) await walkTo(cat, tree.out.x, tree.out.z);
      else await CK.tween(cat, { y: FY }, 500, { arc: 14 });
      await walkTo(cat, BOWL.x + 19, BOWL.z - 7);
      cat.rotation.y = faceTo(cat.position, BOWL.x, BOWL.z);
      CK.fx.burst(H.ROOMS.bedroom, cat.position.x, FY - 1, cat.position.z, { n: 6, col: '#c8c0b0', size: 2, life: 0.7, spd: 18, up: 3, grav: 30, op: 0.4 });
      const t0 = performance.now(), dur = 5200; let lastC = 0;
      H.anims.set('ch.eat', now => {
        const k = Math.min(1, (now - t0) / dur);
        P('eat', now);
        bowlFill.scale.set(1, Math.max(0.05, 1 - k), 1);
        if (now - lastC > 420) { lastC = now; CK.snd.crunch(); }
        if (k < 1) return true;
        bowlFill.visible = false; P('sit');
        CK.step('cat', 'ate'); CK.snd.purr(); CK.secret('ch.purr');
        CK.jack(CK.cast('{cat}'), CK.cast('Every last biscuit. {cat.He} licked the bowl, licked {cat.his} paws, and now {cat.he}\'s purring like a moped.'), 5000);
        setTimeout(async () => {
          if (tree) {
            await walkTo(cat, tree.out.x, tree.out.z);
            if (up) { P('walk', 0); await CK.tween(cat, { x: tree.mid.x, y: tree.mid.y, z: tree.mid.z }, 450, { arc: 12 }); CK.snd.thud(); }
          }
          await CK.tween(cat, { x: catHome.x, y: catHome.y, z: catHome.z, ry: catHome.ry }, 520, { arc: up ? 10 : 4 });
          P(home); catBusy = false; CK.snd.thud(); H.dirty();
        }, 2600);
        return false;
      });
    })();
    return true;
  }

  // ================================================================ WATER YOUR PLANT (on the windowsill, by the dead cactus)
  const POT = { x: 170, y: -14, z: -52 };
  let plant = null, leaves = null, soil = null, deadLeaves = [], canT = null, plantR = null, turning = false, pouring = false;
  function ribbon(pts, w0, w1, m) { // a leaf: a strip along a curve, wide at the base, pointed at the tip
    const c = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))), N = 10, pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) { const t = i / N, p = c.getPoint(t), tg = c.getTangent(t), side = new T.Vector3(-tg.z, 0, tg.x).normalize(), w = (w0 + (w1 - w0) * t) / 2; pos.push(p.x - side.x * w, p.y, p.z - side.z * w, p.x + side.x * w, p.y, p.z + side.z * w); uv.push(0, t, 1, t); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return new T.Mesh(g, m);
  }
  CK.add({
    id: 'plant', room: 'bedroom',
    build(r) {
      plantR = r;
      plant = new T.Group(); plant.position.set(POT.x, POT.y, POT.z); r.group.add(plant);
      const PG = K.into(plant);
      PG.lathe(0, 0, 0, [[8.2, -11.5], [8.4, -10], [7.6, -9.6], [5.6, 0], [0.1, 0]], 22, mat('#b8582a', { sh: 14 }));
      PG.cyl(0, -0.5, 0, 8.6, 8.6, 1, 22, mat('#a04a22')); PG.shadow(0, 0, 0, 22, 22, 0.55);
      soil = PG.disc(0, -10.4, 0, 7.6, M({ c: '#9a7a5a', sh: 4 }).clone());
      const lm = M({ c: '#fff', map: K.tex('ch.leaf', 16, 64, (g, w, h) => { g.fillStyle = '#3a8a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8f0c8'; g.fillRect(6, 0, 4, h); g.fillStyle = '#2a6a1a'; g.fillRect(0, 0, 2, h); g.fillRect(14, 0, 2, h); }), side: 2, sh: 30, sp: '#333' });
      leaves = new T.Group(); leaves.position.y = -10.5; plant.add(leaves);
      const rr = rnd(9);
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2 + rr() * 0.3, len = 16 + rr() * 12, up = 8 + rr() * 10, out = len;
        const ca = Math.cos(a), sa = Math.sin(a);
        leaves.add(ribbon([[ca * 1, 0, sa * 1], [ca * out * 0.35, -up, sa * out * 0.35], [ca * out * 0.75, -up * 0.85, sa * out * 0.75], [ca * out, -up * 0.2 + 6, sa * out]], 1.6, 0.2, lm));
      }
      // three brown leaves to pick off
      const dm = M({ c: '#b8903a', side: 2, sh: 10 });
      [[0.7, 20], [2.6, 18], [4.6, 22]].forEach(([a, len], i) => {
        const ca = Math.cos(a), sa = Math.sin(a), lg = new T.Group(); leaves.add(lg);
        lg.add(ribbon([[ca, 0, sa], [ca * len * 0.4, -9, sa * len * 0.4], [ca * len * 0.8, -6, sa * len * 0.8], [ca * len, 4, sa * len]], 1.5, 0.3, dm));
        const pk = new T.Mesh(new T.BoxGeometry(9, 9, 9), new T.MeshBasicMaterial({ visible: false })); pk.position.set(ca * len * 0.7, -5, sa * len * 0.7); lg.add(pk);
        deadLeaves.push(lg);
      });
      CK.spot(r, 'ch.pot', plant, { label: "Gran's spider plant", act: () => turnPot() });
      deadLeaves.forEach((lg, i) => H.spot('ch.leaf' + i, { obj: lg, room: 'bedroom', label: 'A brown leaf (pick it off)', range: 240, act: () => pluck(i) })); // (after the pot: the leaves are their own spots)
      // the watering can
      const can=grp((G,model)=>{
        model.name='watering-can';
        const green=mat('#387b4e',{sh:28,sp:'#354d3c'}),dark=mat('#285c3a',{sh:20}),brass=mat('#ab925b',{sh:38,sp:'#5d5643'});
        // A closed wall section: rolled fill opening, inner wall and solid base.
        G.lathe(0,0,0,[[0,0],[5.6,0],[6.4,-1.2],[7,-4],[7,-11],[6.2,-14.6],[4.6,-16],[3.5,-16],[3.5,-15.3],[5.55,-14],[6.3,-10.8],[6.3,-4],[5.65,-1],[0,-1],[0,0]].reverse(),28,green,{sz:.72});
        G.disc(0,-11.8,0,5.85,mat('#466660',{sh:55,sp:'#788e83'}),28,{sy:.72});
        G.geo(new T.TorusGeometry(3.55,.25,8,28),0,-15.9,0,dark,{rx:90,sy:.72});
        const pipe=new T.Shape();pipe.absarc(0,0,1,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,.65,0,Math.PI*2,true);pipe.holes.push(hole);
        const path=new T.CatmullRomCurve3([new T.Vector3(5.4,-5.2,0),new T.Vector3(9,-7,0),new T.Vector3(13,-12,0),new T.Vector3(17,-15.6,0)]);
        G.geo(new T.ExtrudeGeometry(pipe,{extrudePath:path,steps:14,bevelEnabled:false,curveSegments:10}),0,0,0,green);
        // Both handle ends enter the body; no floating half-torus.
        const handle=new T.CatmullRomCurve3([new T.Vector3(-5.8,-13.6,0),new T.Vector3(-11,-14,0),new T.Vector3(-14,-10,0),new T.Vector3(-12,-4,0),new T.Vector3(-6,-2.4,0)]);
        G.geo(new T.TubeGeometry(handle,18,.85,10,false),0,0,0,dark);
        for(const y of [-11,-9.5,-8])G.rbox(-13.5,y,0,1.8,.35,1.9,.15,green);
        const rose=new T.Group();rose.position.set(17,-15.6,0);rose.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(4,-3.6,0).normalize());model.add(rose);const R=K.into(rose);
        R.cyl(0,0,0,1.05,2.25,2,20,brass);R.cyl(0,1.04,0,2.3,2.3,.14,20,dark);
        for(let n=0;n<13;n++){const a=n*Math.PI*2/12,r=n===12?0:1.55;R.cyl(Math.cos(a)*r,1.12,Math.sin(a)*r,.13,.13,.05,6,mat('#22372a'))}
        G.shadow(0,0,0,31,13,.45);
      });
      canT = CK.thing('ch.can', { obj: can, kind: 'can', label: 'Watering can (full)', chore: 'plant', holdD: 48, home: { room: 'bedroom', x: 128, y: FY, z: 22, ry: 200 }, useLabel: 'Pour', use: () => pour() });
      // the carry prompt says what F will do right now: water the plant when you aim at it, otherwise where to aim
      if (canT) Object.defineProperty(canT, 'useLabel', { configurable: true, get: () => CK.has('plant', 'water') || H.held() !== 'ch.can' ? 'Pour' : nearPot(canAim()) ? "Water Gran's plant" : 'Pour (aim at the plant)' });
      // while you carry the can and the plant is thirsty, the plant itself glows softly (its own leaves and pot, not a box)
      const glowing = []; plant.traverse(o => { if (o.isMesh && o.material && o.material.emissive && !o.userData.contactShadow) { o.material = o.material.clone(); o.userData.e0 = o.material.emissive.clone(); glowing.push(o); } });
      let lit = false; H.ambient.add(() => { const want = H.held() === 'ch.can' && !CK.has('plant', 'water'); if (!want && !lit) return; lit = want; const k = want ? 0.1 + 0.07 * Math.sin(performance.now() / 260) : 0; for (const o of glowing) o.material.emissive.setRGB(o.userData.e0.r + k * 0.6, o.userData.e0.g + k, o.userData.e0.b + k * 0.35); H.dirty(); });
      this.sticky = CK.sticky(r, 'plant', POT.x, POT.y - 5, POT.z + 7.4, { text: 'Water me! x the plant', size: 7, ry: 0, sign: false });
      this.sync();
    },
    sync() {
      const wet = CK.has('plant', 'water');
      if (soil) { soil.material.color.set(wet ? '#3a2416' : '#9a7a5a'); }
      if (leaves) { leaves.scale.set(1, wet ? 1 : 0.62, 1); leaves.rotation.x = wet ? 0 : 0.05; }
      deadLeaves.forEach((l, i) => { const gone = CK.has('plant', 'leaf' + i); l.visible = !gone; if (H.SPOTS['ch.leaf' + i]) H.SPOTS['ch.leaf' + i].off = gone; });
      if (plant && !turning) plant.rotation.y = CK.has('plant', 'turn') ? Math.PI : 0;
      if (this.sticky) this.sticky.visible = CK.onList('plant') && !CK.done('plant');
      H.dirty();
    },
    reset() { CK.home('ch.can'); this.sync(); },
  });
  function pluck(i) {
    if (CK.has('plant', 'leaf' + i)) return;
    CK.begin('plant');
    const l = deadLeaves[i]; CK.snd.rustle();
    H.SPOTS['ch.leaf' + i].off = true;
    CK.tween(l, { y: 30, rz: 0.8 }, 700).then(() => { l.visible = false; l.position.y = 0; l.rotation.z = 0; CK.step('plant', 'leaf' + i); });
    if (i === 0) CK.jack("Gran's spider plant", 'Pick, pick. Dead leaves off. Gran says talking to plants helps. I\'m not talking to it. ...Alright, I said "hello".', 4000);
  }
  function turnPot() {
    if (CK.has('plant', 'turn') || CK.done('plant')) return CK.jack("Gran's spider plant", CK.has('plant', 'water') ? 'Happy plant. Leave it alone now.' : 'It looks thirsty. The watering can\'s on the floor by my bedside table.');
    CK.begin('plant'); turning = true;
    CK.snd.rustle();
    CK.tween(plant, { ry: Math.PI }, 900).then(() => { turning = false; CK.step('plant', 'turn'); CK.jack("Gran's spider plant", 'Turned round, so the other side gets the light from the window. Plants. Who knew.', 3500); });
  }
  // where the crosshair is (the can itself doesn't count): you water what you aim at, not what the can happens to be over
  let aimAt = null, aimT = 0;
  function canAim(fresh) {
    const now = performance.now(); if (!fresh && now - aimT < 150) return aimAt; aimT = now;
    const h = H.mode === 'walk' || H.mode === 'focus' ? H.pick(innerWidth / 2, innerHeight / 2, { far: 260, skip: m => { for (let o = m; o; o = o.parent) if (o === canT.obj || o.userData.noPick) return true; return false; } }) : null;
    return aimAt = h ? h.p : null;
  }
  const nearPot = q => !!q && Math.hypot(q.x - POT.x, q.z - POT.z) < 40 && Math.abs(q.y - (POT.y - 10)) < 45;
  const nearCactus = q => !!q && Math.hypot(q.x - 216, q.z + 53) < 25;
  function pour() {
    if (pouring) return; const p = canT.obj.position, aim = canAim(true), r = H.ROOMS.bedroom;
    const d = nearPot(aim) ? 0 : Math.hypot(p.x - POT.x, p.z - POT.z), cactus = !d ? false : nearCactus(aim) || Math.hypot(p.x - 216, p.z + 53) < 45;
    CK.snd.pour(1.4); pouring = true; setTimeout(() => { pouring = false; }, 1500);
    // tip it up in your hand while it pours (and back level after)
    const t0 = performance.now(); H.anims.set('ch.can.tilt', now => { const k = Math.min(1, (now - t0) / 1500); canT.holdRoll = 38 * Math.sin(Math.min(1, k * 4) * Math.PI / 2) * (k > 0.8 ? (1 - k) / 0.2 : 1); H.dirty(); if (k < 1) return true; canT.holdRoll = 0; return false; });
    const to = d < 50 ? [POT.x, POT.y - 10.5, POT.z] : cactus ? [216, -16, -53] : aim ? [aim.x, aim.y - 0.3, aim.z] : [p.x + 8, FY - 0.3, p.z];
    const tip = () => { const v = new T.Vector3(17.85, -16.37, 0); canT.obj.localToWorld(v); return [v.x, -v.y, v.z]; };
    let n = 0; const iv = setInterval(() => { CK.fx.stream(r, tip(), to); if (++n > 14) clearInterval(iv); }, 90);
    if (d < 50) {
      if (CK.has('plant', 'water')) return setTimeout(() => CK.jack("Gran's spider plant", 'It\'s had enough. Any more and it\'ll be a swimming pool.'), 600);
      CK.begin('plant');
      setTimeout(() => { CK.step('plant', 'water'); CK.MODS.plant.sync(); leaves.scale.y = 0.62; CK.tween(leaves, { s: 1 }, 1, {}).then(() => { const t0 = performance.now(); H.anims.set('ch.perk', now => { const k = Math.min(1, (now - t0) / 1200); leaves.scale.set(1, 0.62 + 0.38 * CK.ease(k), 1); return k < 1; }); }); CK.jack("Gran's spider plant", 'Glug glug. The soil goes dark and the leaves perk up. You can practically hear it say "about TIME".', 4000); }, 1300);
    } else if (cactus) {
      CK.secret('ch.cactus'); setTimeout(() => CK.jack('The cactus', 'Watered the dead cactus. It\'s been dead since 1997. Never give up, little guy.'), 900);
    } else {
      CK.oops('plant'); setTimeout(() => CK.jack('Watering can', 'That was the carpet. The carpet does not need watering. (Hold it over the plant on the windowsill.)'), 700);
    }
  }

  // ================================================================ Mom's list on the wall (above the foot of the bed, by the door)
  CK.add({ id: '_list.bed', room: 'bedroom', build(r) { CK.paper(r, 239.2, -46, 112, -90, { id: 'ch.list.bedroom', w: 22 }); } });
})();

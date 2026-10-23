/* SkiJack for JackOS 98 (lazy loaded by apps-games.js). A downhill ski game: dodge trees, rocks and moguls,
 * hit the jumps, pull tricks in the air, and whatever you do, don't ski past 2000m. A homage with all-original
 * art (drawn procedurally into tiny pixel canvases) and code. */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;
  const PX_M = 16; // world pixels per metre
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const TAU = Math.PI * 2;
  const ANG = [-Math.PI / 2, -1.0, -0.5, 0, 0.5, 1.0, Math.PI / 2]; // heading index 0..6 (3 = straight down)

  // ================================================================ tiny pixel-art painter
  function pc(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; fn(x, (X, Y, W, H, col) => { x.fillStyle = col; x.fillRect(X | 0, Y | 0, W || 1, H || 1); }); return c; }
  function line(p, x0, y0, x1, y1, col) { x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (let i = 0; i < 200; i++) { p(x0, y0, 1, 1, col); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  const GR = '#4c9a24', GD = '#2c6a10', RED = '#e10600', JK = '#2349b8', JD = '#14286a', HAT = '#ff8a00', SKI = '#d01010', K = '#000', WH = '#fff';

  // the grot skier: heading 0..6, pose 'ski' | 'air' | 'crash' | 'ears' | 'grab' | 'walk'
  const skierCache = {};
  function skier(h, pose, col) {
    const key = h + pose + (col || '');
    if (skierCache[key]) return skierCache[key];
    const jacket = col || JK;
    const cv = pc(26, 28, (x, p) => {
      const cx = 13, side = h - 3; // -3..3
      if (pose === 'crash') {
        // flat on the snow, skis crossed, stars
        line(p, 3, 22, 22, 15, SKI); line(p, 4, 15, 23, 22, SKI);
        p(8, 17, 10, 4, jacket); p(6, 15, 4, 4, GR); p(4, 14, 2, 2, GR); p(10, 14, 2, 1, GR); p(6, 16, 1, 1, RED); p(8, 16, 1, 1, RED); p(5, 13, 4, 2, HAT);
        p(18, 18, 3, 2, GR);
        for (const [sx, sy] of [[4, 6], [12, 3], [19, 7]]) { p(sx, sy - 1, 1, 3, '#ffd400'); p(sx - 1, sy, 3, 1, '#ffd400'); }
        return;
      }
      const ang = ANG[h], sdx = Math.sin(ang), sdy = Math.cos(ang);
      // skis (two parallel lines along the heading)
      if (pose !== 'walk') {
        const L = pose === 'grab' ? 8 : 9, nx = -sdy, ny = sdx;
        for (const o of [-2.5, 2.5]) { const bx = cx + nx * o, by = 23 + ny * o * 0.6; line(p, bx - sdx * L, by - sdy * L * 0.55, bx + sdx * L, by + sdy * L * 0.55, SKI); }
      } else { p(cx - 4, 22, 3, 2, SKI); p(cx + 1, 22, 3, 2, SKI); }
      const crouch = pose === 'grab' ? 3 : 0;
      // legs
      p(cx - 3, 18 + crouch / 2, 2, 4 - crouch / 2, JD); p(cx + 1, 18 + crouch / 2, 2, 4 - crouch / 2, JD);
      // body
      p(cx - 4, 12 + crouch, 8, 7, jacket); p(cx - 4, 18 + crouch, 8, 1, JD);
      // arms + poles (lean with the heading)
      const lean = side * 0.7;
      p(cx - 6 + lean, 13 + crouch, 2, 4, jacket); p(cx + 4 + lean, 13 + crouch, 2, 4, jacket);
      if (pose === 'grab') { p(cx - 6, 20, 2, 2, GR); p(cx + 4, 20, 2, 2, GR); }
      else { line(p, cx - 6 + lean, 17 + crouch, cx - 8 + lean, 24, '#555'); line(p, cx + 5 + lean, 17 + crouch, cx + 7 + lean, 24, '#555'); }
      // head
      const hx = cx - 4 + Math.round(side * 0.6), hy = 5 + crouch;
      p(hx, hy, 8, 7, GR); p(hx + 1, hy + 7, 6, 1, GD);
      // ears (big on 'ears' pose)
      const E = pose === 'ears' ? 6 : 3;
      for (let i = 0; i < E; i++) { p(hx - 1 - i, hy + 2 + (i >> 1), 1, Math.max(1, 3 - (i >> 1)), GR); p(hx + 8 + i, hy + 2 + (i >> 1), 1, Math.max(1, 3 - (i >> 1)), GR); }
      // face: eyes look where we go
      const look = side > 0 ? 1 : side < 0 ? -1 : 0;
      if (h !== 0 && h !== 6 || true) { p(hx + 1 + look + (side > 1 ? 1 : 0), hy + 3, 2, 2, RED); p(hx + 5 + look - (side < -1 ? 1 : 0), hy + 3, 2, 2, RED); }
      p(hx + 2, hy + 6, 4, 1, WH); p(hx + 3, hy + 6, 1, 1, K);
      // bobble hat
      p(hx, hy - 2, 8, 2, HAT); p(hx + 1, hy - 3, 6, 1, HAT); p(hx + 3, hy - 5, 2, 2, WH);
      if (pose === 'air') { p(hx - 2, hy + 9, 1, 1, '#9cf'); }
    });
    return (skierCache[key] = cv);
  }
  const OBJ = {};
  function obj(name) {
    if (OBJ[name]) return OBJ[name];
    let c;
    switch (name) {
      case 'tree': c = pc(22, 30, (x, p) => { p(9, 24, 4, 5, '#6a3a10'); for (let i = 0; i < 3; i++) { const y = 2 + i * 7, w = 6 + i * 4; for (let r = 0; r < 9; r++) { const ww = Math.round(w * (r + 1) / 9); p(11 - ww, y + r, ww * 2, 1, r % 3 === 2 ? '#145a20' : '#1d7a2a'); } } p(10, 0, 2, 3, '#1d7a2a'); p(6, 12, 2, 1, '#fff'); p(13, 19, 3, 1, '#fff'); p(9, 5, 2, 1, '#fff'); }); break;
      case 'bigtree': c = pc(32, 44, (x, p) => { p(13, 36, 6, 8, '#6a3a10'); for (let i = 0; i < 4; i++) { const y = 2 + i * 9, w = 7 + i * 4; for (let r = 0; r < 11; r++) { const ww = Math.round(w * (r + 1) / 11); p(16 - ww, y + r, ww * 2, 1, r % 4 === 3 ? '#0e4a18' : '#176a24'); } } p(9, 18, 3, 1, '#fff'); p(18, 28, 4, 1, '#fff'); p(14, 8, 2, 1, '#fff'); }); break;
      case 'dead': c = pc(20, 28, (x, p) => { p(9, 4, 2, 24, '#5a3a1a'); line(p, 10, 12, 3, 5, '#5a3a1a'); line(p, 10, 9, 17, 2, '#5a3a1a'); line(p, 10, 17, 16, 12, '#5a3a1a'); line(p, 4, 6, 2, 8, '#5a3a1a'); }); break;
      case 'rock': c = pc(18, 11, (x, p) => { p(2, 4, 14, 6, '#7a7a80'); p(4, 2, 9, 3, '#8a8a90'); p(5, 3, 4, 2, '#b0b0b8'); p(2, 9, 14, 1, '#4a4a50'); p(12, 5, 3, 2, '#5a5a60'); }); break;
      case 'stump': c = pc(12, 10, (x, p) => { p(2, 3, 8, 6, '#6a3a10'); p(2, 2, 8, 2, '#c08040'); p(4, 2, 4, 1, '#a06020'); p(1, 9, 10, 1, '#3a2008'); }); break;
      case 'mogul': c = pc(20, 10, (x, p) => { for (let r = 0; r < 8; r++) { const w = Math.round(Math.sqrt(1 - Math.pow((r - 4.5) / 4.6, 2)) * 9); p(10 - w, 1 + r, w * 2, 1, r < 3 ? '#f4f8ff' : r < 6 ? '#dce8f8' : '#b8cce8'); } p(6, 2, 4, 1, '#fff'); p(13, 6, 4, 2, '#a8bcd8'); p(3, 8, 14, 1, '#9cb0cc'); }); break;
      case 'ramp': c = pc(28, 14, (x, p) => { p(2, 4, 24, 9, '#c89040'); p(2, 4, 24, 2, '#ffd400'); for (let i = 0; i < 24; i += 4) p(2 + i, 6, 2, 7, '#a06a20'); p(2, 12, 24, 2, '#6a4010'); }); break;
      case 'flagR': case 'flagB': c = pc(10, 22, (x, p) => { p(2, 2, 1, 20, '#333'); const col = name === 'flagR' ? '#e10600' : '#2349b8'; for (let r = 0; r < 7; r++) p(3, 2 + r, 7 - Math.abs(r - 3) * 2 + 1, 1, col); }); break;
      case 'flagK': c = pc(10, 22, (x, p) => { p(2, 2, 1, 20, '#333'); for (let r = 0; r < 6; r++) for (let q = 0; q < 6; q++) p(3 + q, 2 + r, 1, 1, (r + q) % 2 ? '#000' : '#fff'); }); break;
      case 'sign2000': c = pc(40, 26, (x, p) => { p(18, 14, 2, 12, '#5a3a1a'); p(1, 1, 38, 15, '#ffd400'); p(1, 1, 38, 1, '#000'); p(1, 15, 38, 1, '#000'); p(1, 1, 1, 15, '#000'); p(38, 1, 1, 15, '#000'); x.fillStyle = '#000'; x.font = 'bold 9px Arial'; x.fillText('2000m', 5, 11); }); break;
      case 'signStart': c = pc(56, 30, (x, p) => { p(4, 14, 2, 16, '#5a3a1a'); p(50, 14, 2, 16, '#5a3a1a'); p(0, 2, 56, 14, '#e10600'); x.fillStyle = '#fff'; x.font = 'bold 10px Arial'; x.fillText('SKIJACK', 6, 13); }); break;
      case 'pup': c = pc(14, 10, (x, p) => { p(3, 2, 8, 7, '#ffffff'); p(8, 2, 3, 7, '#c8d8f0'); p(2, 3, 1, 5, '#e6eefa'); p(11, 3, 1, 5, '#b4c8e6'); p(3, 1, 1, 1, '#9ad8ff'); p(10, 1, 1, 1, '#9ad8ff'); p(4, 4, 2, 2, '#14203a'); p(8, 4, 2, 2, '#14203a'); p(4, 4, 1, 1, '#fff'); p(8, 4, 1, 1, '#fff'); p(5, 7, 4, 1, '#2a1a4a'); p(6, 7, 1, 1, '#fff'); p(3, 9, 3, 1, '#7c96c0'); p(8, 9, 3, 1, '#7c96c0'); }); break;
      case 'pup2': c = pc(14, 10, (x, p) => { p(3, 2, 8, 7, '#ffffff'); p(8, 2, 3, 7, '#c8d8f0'); p(2, 3, 1, 5, '#e6eefa'); p(11, 3, 1, 5, '#b4c8e6'); p(3, 1, 1, 1, '#9ad8ff'); p(10, 1, 1, 1, '#9ad8ff'); p(4, 4, 2, 2, '#14203a'); p(8, 4, 2, 2, '#14203a'); p(4, 4, 1, 1, '#fff'); p(8, 4, 1, 1, '#fff'); p(5, 7, 4, 1, '#2a1a4a'); p(6, 7, 1, 1, '#fff'); p(3, 9, 3, 1, '#7c96c0'); p(8, 9, 3, 1, '#7c96c0'); p(1, 2, 1, 2, '#e6eefa'); p(12, 2, 1, 2, '#b4c8e6'); }); break;
      case 'board': c = pc(24, 26, (x, p) => { line(p, 4, 22, 20, 18, '#8000c0'); line(p, 4, 23, 20, 19, '#8000c0'); p(9, 13, 7, 6, '#2a9a2a'); p(9, 6, 7, 6, GR); p(8, 8, 1, 2, GR); p(16, 8, 1, 2, GR); p(10, 8, 2, 1, RED); p(13, 8, 2, 1, RED); p(9, 4, 7, 2, '#8000c0'); p(10, 19, 2, 3, '#222'); p(13, 18, 2, 3, '#222'); }); break;
      default: c = pc(4, 4, () => {});
    }
    return (OBJ[name] = c);
  }
  // the snow monster: a big white furry yeti-ish thing (original design), ice-blue shadows, very hungry
  const squigCache = {};
  function squig(frame) {
    if (squigCache[frame]) return squigCache[frame];
    const c = pc(48, 46, (x, p) => {
      const chomp = frame === 'eat1' || frame === 'eat3', full = frame.startsWith('eat');
      const a = frame === 'run1' ? 0 : frame === 'run2' ? 3 : 1, up0 = a === 3 ? 2 : 0;
      const W = '#ffffff', W2 = '#e6eefa', SH = '#b4c8e6', SD = '#7c96c0', CL = '#3a4660';
      // big feet
      p(8, 40 - (a === 0 ? 1 : 0), 13, 6, '#4a5a84'); p(27, 40 - (a === 3 ? 1 : 0), 13, 6, '#4a5a84'); p(9, 41 - (a === 0 ? 1 : 0), 11, 4, SH); p(28, 41 - (a === 3 ? 1 : 0), 11, 4, SH); p(9, 44, 11, 1, SD); p(28, 44, 11, 1, SD);
      for (const fx of [10, 13, 16, 29, 32, 35]) p(fx, 40 - (fx < 24 ? (a === 0 ? 1 : 0) : (a === 3 ? 1 : 0)), 2, 1, CL);
      // shaggy body: lit from the top left, fur tufts on the outline
      const OL = '#4a5a84';
      for (let r = -1; r < 37; r++) { const rr = Math.max(0, Math.min(35, r)), w = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((rr - 18) / 19, 2))) * 20) + 1 + ((rr * 7) % 3 === 0 ? 1 : 0); p(24 - w, 4 + r, w * 2, 1, OL); }
      p(0, 15 - up0, 8, 10, OL); p(40, 13 + up0, 8, 10, OL);
      for (let r = 0; r < 36; r++) {
        const w = Math.round(Math.sqrt(1 - Math.pow((r - 18) / 19, 2)) * 20) + ((r * 7) % 3 === 0 ? 1 : 0), y = 4 + r;
        p(24 - w, y, w * 2, 1, W2);
        p(24 - w + 1, y, Math.max(0, Math.round(w * 0.9)), 1, W);
        p(24 + Math.round(w * 0.45), y, Math.max(0, w - Math.round(w * 0.45)), 1, SH);
        if (r > 26) p(24 - w, y, w * 2, 1, r > 32 ? SD : SH);
        if (r % 4 === 1) { p(24 - w - 1, y, 1, 2, W2); p(24 + w, y, 1, 2, SH); }
      }
      // fur strokes
      for (const [fx, fy] of [[12, 12], [16, 30], [33, 14], [36, 27], [27, 33], [9, 24]]) { p(fx, fy, 1, 2, SH); p(fx + 1, fy + 2, 1, 1, SH); }
      // two little ice horns
      p(13, 3, 2, 3, '#9ad8ff'); p(12, 1, 2, 2, '#d8f4ff'); p(33, 3, 2, 3, '#9ad8ff'); p(34, 1, 2, 2, '#d8f4ff');
      // face patch, brows and big eyes
      p(12, 8, 24, 9, '#d4e4fa'); p(13, 7, 22, 1, '#d4e4fa');
      const lk = frame === 'run2' ? 1 : 0;
      p(14, 9, 7, 6, W); p(27, 9, 7, 6, W); p(14, 9, 7, 1, SD); p(27, 9, 7, 1, SD);
      p(16 + lk, 11, 3, 3, '#14203a'); p(29 + lk, 11, 3, 3, '#14203a'); p(16 + lk, 11, 1, 1, W); p(29 + lk, 11, 1, 1, W);
      p(13, 7, 9, 2, SD); p(26, 7, 9, 2, SD); p(20, 8, 2, 1, SD); p(26, 8, 2, 1, SD);
      p(22, 14, 4, 2, '#5a6a90');
      // the mouth: a big dark-blue gob with two square teeth
      const mo = chomp ? 3 : full ? 9 : 11;
      p(10, 17, 28, mo, '#2a1a4a'); p(11, 17 + mo, 26, 1, SD);
      p(17, 17, 4, 3, W); p(27, 17, 4, 3, W);
      if (!chomp && !full) p(19, 23, 10, 3, '#c0306a');
      if (full && !chomp) { p(20, 19, 8, 5, GR); p(18, 20, 2, 2, GR); p(28, 20, 2, 2, GR); p(21, 18, 6, 1, HAT); p(22, 20, 1, 1, RED); p(25, 20, 1, 1, RED); }
      if (full && chomp) { p(30, 19, 6, 1, SKI); p(12, 20, 5, 1, SKI); }
      // furry arms waving, dark claws
      const up = a === 3 ? 2 : 0;
      p(1, 16 - up, 6, 8, W2); p(2, 16 - up, 3, 7, W); p(41, 16 + up - 2, 6, 8, SH); p(42, 16 + up - 2, 2, 7, W2);
      p(1, 14 - up, 1, 2, CL); p(3, 13 - up, 1, 2, CL); p(5, 14 - up, 1, 2, CL); p(42, 12 + up, 1, 2, CL); p(44, 11 + up, 1, 2, CL); p(46, 12 + up, 1, 2, CL);
    });
    return (squigCache[frame] = c);
  }

  // ================================================================ music
  if (window.Sound && Sound.addTune) {
    Sound.addTune('jg_ski', { step: 0.14, hats: true,
      lead: [72, 76, 79, 76, 72, 76, 79, 84, 81, 79, 77, 76, 74, -1, 0, 0, 71, 74, 77, 74, 71, 74, 77, 83, 81, 79, 77, 74, 72, -1, 0, 0,
        72, 76, 79, 76, 72, 76, 79, 84, 86, 84, 81, 79, 77, -1, 76, 74, 76, 79, 77, 74, 72, 71, 72, 74, 72, -1, 67, -1, 72, -1, 0, 0],
      bass: [48, 55, 48, 55, 53, 57, 53, 57, 43, 50, 43, 50, 48, 55, 48, 55, 48, 55, 48, 55, 50, 57, 50, 57, 43, 50, 43, 50, 48, 48, 55, 55] });
    Sound.addTune('jg_squig', { step: 0.1, hats: true,
      lead: [64, 0, 64, 67, 64, 0, 63, 0, 64, 0, 64, 67, 70, 0, 69, 0, 64, 0, 64, 67, 64, 0, 63, 0, 62, 0, 61, 0, 60, -1, -1, 0],
      bass: [40, 40, 40, 40, 39, 39, 40, 40, 40, 40, 40, 40, 38, 37, 36, 35] });
  }

  JG.mod('ski', G => {
    const host = G.host, w = G.w;
    G.fit();
    let opts = Object.assign({ music: true, mode: 'free' }, G.store.get('opts', {}));
    const saveOpts = () => G.store.set('opts', opts);
    const scFree = G.scores({ title: 'SkiJack Freestyle High Scores', max: 1e7, label: 'Score', seed: [['JACK', 9200], ['DAVE', 6100], ['GUBBINZ', 2400]] });
    const scSlalom = JG.Scores('ski-slalom', { title: 'SkiJack Slalom Best Times', lower: true, max: 36000, label: 'Time', fmt: v => (v / 10).toFixed(1) + ' sec', seed: [['JACK', 612], [Cast.t('COUSIN {cousin.NAME}'), 655], ['DAVE', 803]] });
    const C = G.canvas(host, () => { draw(); });
    const cv = C.cv, ctx = C.c;
    G.focusEl = cv;

    let S = null, objs = [], genY = 0, rnd = Math.random;
    function newGame() {
      S = { x: 0, y: 0, h: 3, v: 0, z: 0, vz: 0, air: false, crash: 0, t: 0, style: 0, tricks: [], trick: null, trickT: 0, combo: 0,
        turbo: false, paused: false, over: false, squig: null, squigStart: 0, eaten: 0, gates: 0, missed: 0, finished: false, lastJumpStyle: 0, msg: '', msgT: 0, walk: 0, maxDist: 0 };
      objs = []; genY = -200; rnd = JG.rng((Date.now() & 0xffff) + 7);
      // start area
      objs.push({ k: 'signStart', x: -28, y: -60, solid: false });
      objs.push({ k: 'flagK', x: -60, y: -20 }, { k: 'flagK', x: 52, y: -20 });
      if (opts.mode === 'slalom') {
        for (let i = 1; i <= 20; i++) { const gy = i * 40 * PX_M, gx = Math.sin(i * 1.3) * 90 + (i % 2 ? 50 : -50); objs.push({ k: i % 2 ? 'flagR' : 'flagB', x: gx - 40, y: gy, gate: i, gx }, { k: i % 2 ? 'flagR' : 'flagB', x: gx + 32, y: gy, gateEnd: true }); }
        objs.push({ k: 'flagK', x: -90, y: 820 * PX_M, finish: true }, { k: 'flagK', x: 80, y: 820 * PX_M });
      }
      objs.push({ k: 'sign2000', x: -150, y: 2000 * PX_M - 40 }, { k: 'sign2000', x: 120, y: 2000 * PX_M - 40 });
      generate(0, 900);
      G.music(opts.music ? 'jg_ski' : '');
      say(opts.mode === 'slalom' ? 'SLALOM! Go between the flags.' : 'FREESTYLE! Hit the jumps.', 2.5);
    }
    function say(t, d) { S.msg = t; S.msgT = d || 2; }
    // world generation in bands below the skier
    function generate(from, to) {
      for (let y = Math.max(genY, from); y < to; y += 24) {
        const dist = y / PX_M, dens = clamp(0.08 + dist / 6000, 0.08, 0.32);
        if (y < 120) continue;
        for (let i = 0; i < 4; i++) {
          if (rnd() > dens) continue;
          const x = S.x + (rnd() - 0.5) * 1400;
          if (opts.mode === 'slalom' && dist < 830 && Math.abs(x - (Math.sin(Math.round(dist / 40) * 1.3) * 90)) < 120) continue;
          const r = rnd();
          let k = r < 0.34 ? 'tree' : r < 0.46 ? 'bigtree' : r < 0.53 ? 'dead' : r < 0.66 ? 'rock' : r < 0.72 ? 'stump' : r < 0.9 ? 'mogul' : 'ramp';
          if (k === 'mogul') { for (let m = 0; m < 3 + (rnd() * 4 | 0); m++) objs.push({ k, x: x + (rnd() - 0.5) * 120, y: y + (rnd() - 0.5) * 120 }); continue; }
          objs.push({ k, x, y: y + rnd() * 24 });
        }
        if (rnd() < 0.012) objs.push({ k: 'board', x: S.x + (rnd() - 0.5) * 800, y, npc: 'board', vx: (rnd() - 0.5) * 80, vy: 110 + rnd() * 60 });
        if (rnd() < 0.01) objs.push({ k: 'pup', x: S.x + (rnd() < 0.5 ? -500 : 500), y, npc: 'pup', vx: 0, vy: 0 });
        if (rnd() < 0.006) objs.push({ k: 'dave', x: S.x + (rnd() - 0.5) * 600, y, npc: 'dave', vx: 0, vy: 140 });
      }
      genY = Math.max(genY, to);
    }
    const HIT = { tree: [5, 4, 26], bigtree: [7, 5, 40], dead: [3, 4, 26], rock: [7, 3, 9], stump: [4, 3, 8], ramp: [12, 5, 10], mogul: [9, 3, 6], board: [6, 4, 22], dave: [6, 4, 22], pup: [5, 3, 8] };

    // ---------------------------------------------------------------- controls
    const keys = {};
    function turn(d) {
      if (!S || S.over || S.crash > 0) return;
      if (S.air) return trickKey(d < 0 ? 'left' : 'right');
      if ((S.h === 0 && d < 0) || (S.h === 6 && d > 0)) { S.x += d * 6; S.walk = 0.2; return; } // side-step when stopped
      S.h = clamp(S.h + d, 0, 6);
    }
    function jump() {
      if (!S || S.over || S.crash > 0 || S.air) return;
      S.air = true; S.vz = 150; S.z = 0.1; S.combo = 0; S.tricks = []; G.sfx('boing');
    }
    const TRICKS = { left: ['HELICOPTER', 0.55, 60], right: ['EAR FLAP', 0.45, 50], up: ['BACKFLIP', 0.7, 100], down: ['GEM GRAB', 0.4, 40] };
    function trickKey(kind) {
      if (!S.air || S.trick) return;
      const [name, dur, pts] = TRICKS[kind];
      S.trick = { kind, name, dur, pts, t: 0 }; G.sfx('pet');
    }
    function setHeadingTo(tx, ty) { // steer towards a point (mouse / finger)
      const a = Math.atan2(tx, Math.max(-20, ty));
      let best = 3, bd = 9; ANG.forEach((g, i) => { const d = Math.abs(g - a); if (d < bd) { bd = d; best = i; } });
      if (ty < -10) best = tx < 0 ? 0 : 6;
      S.h = best;
    }
    G.keys = {
      down(ev) {
        const k = ev.key;
        if (k === 'F3' || k === 'p' || k === 'P') { pause(); return true; }
        if (S && S.paused) { pause(false); return true; }
        if (!S || S.over) { if (k === ' ' || k === 'Enter') { newGame(); return true; } return false; }
        if (ev.repeat && !/^Arrow/.test(k)) return true;
        if (k === 'ArrowLeft' || k === 'a') { if (!ev.repeat || !S.air) turn(-1); return true; }
        if (k === 'ArrowRight' || k === 'd') { if (!ev.repeat || !S.air) turn(1); return true; }
        if (k === 'ArrowDown' || k === 's') { if (S.air) trickKey('down'); else if (S.crash <= 0) S.h = 3; return true; }
        if (k === 'ArrowUp' || k === 'w') { if (S.air) trickKey('up'); else if (S.h === 0 || S.h === 6) { S.y -= 4; S.walk = 0.2; } return true; }
        if (k === ' ') { jump(); return true; }
        if (k === 'f' || k === 'F') { S.turbo = !S.turbo; say(S.turbo ? 'TURBO! (F to slow down)' : 'Normal speed', 1.5); if (S.turbo) G.secret('games.ski.turbo'); return true; }
        return false;
      },
    };
    // mouse/touch: hold to steer towards the pointer; quick tap = jump (or a trick in the air)
    let ptr = null;
    const toWorld = ev => { const r = DesktopSurface.rect(cv), point = DesktopSurface.point(ev.clientX, ev.clientY); return [(point.x - r.left - C.W / 2) / view.sc, (point.y - r.top - C.H * 0.32) / view.sc]; };
    G.on(cv, 'pointerdown', ev => {
      ev.preventDefault(); G.focus();
      if (!S) return;
      if (S.paused) { pause(false); return; }
      if (S.over) { newGame(); return; }
      const point = DesktopSurface.point(ev.clientX, ev.clientY);
      ptr = { id: ev.pointerId, t: performance.now(), x: point.x, y: point.y, moved: false };
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
      const [tx, ty] = toWorld(ev);
      if (S.air) { trickKey(Math.abs(tx) > Math.abs(ty) ? (tx < 0 ? 'left' : 'right') : (ty < 0 ? 'up' : 'down')); return; }
      if (S.crash <= 0 && (Math.abs(tx) > 14 || ty > 14 || ty < -14)) setHeadingTo(tx, ty);
    });
    G.on(cv, 'pointermove', ev => {
      if (!ptr || ev.pointerId !== ptr.id || !S || S.air || S.crash > 0 || S.over || S.paused) return;
      const point = DesktopSurface.point(ev.clientX, ev.clientY);
      if (Math.hypot(point.x - ptr.x, point.y - ptr.y) > 6) ptr.moved = true;
      const [tx, ty] = toWorld(ev); if (Math.hypot(tx, ty) > 10) setHeadingTo(tx, ty);
    });
    const end = ev => { if (!ptr || ev.pointerId !== ptr.id) return; const quick = performance.now() - ptr.t < 220 && !ptr.moved; ptr = null; if (quick && S && !S.air && !S.over) { const [tx, ty] = toWorld(ev); if (Math.hypot(tx, ty) < 22) jump(); } };
    G.on(cv, 'pointerup', end); G.on(cv, 'pointercancel', () => { ptr = null; });
    G.on(cv, 'dblclick', () => { if (S && !S.air) jump(); });
    G.on(cv, 'contextmenu', ev => ev.preventDefault());
    function pause(on) {
      if (!S || S.over) return;
      S.paused = on == null ? !S.paused : on;
      if (S.paused) G.stopMusic(); else G.music(opts.music ? (S.squig && !S.squig.done ? 'jg_squig' : 'jg_ski') : '');
    }
    G.onActive = a => { if (!a && S && !S.over && !S.paused) pause(true); };

    // ---------------------------------------------------------------- simulation
    function crash(why) {
      if (S.crash > 0) return;
      S.crash = 1.4; S.v = 0; S.trail = []; S.crashN = (S.crashN || 0) + 1; S.air = false; S.z = 0; S.trick = null; S.style = Math.max(0, S.style - 20);
      G.sfx('thud'); say(why || 'OUCH!', 1.4);
    }
    function land() {
      S.air = false; S.z = 0;
      if (S.trick) { crash('Landed on your head!'); return; }
      if (S.tricks.length) {
        const n = S.tricks.length, pts = S.tricks.reduce((a, t) => a + t, 0) * n;
        S.style += pts; say(`${n} trick${n > 1 ? 's' : ''}! +${pts} style`, 1.6); G.sfx('join');
        if (n >= 4) { G.secret('games.ski.combo'); say(`BIG AIR! ${n} tricks! +${pts}`, 2.2); }
      } else G.sfx('turn');
      S.tricks = [];
    }
    function step(dt) {
      if (S.over || S.finished && S.crash <= 0 && S.v < 1) return;
      S.t += dt;
      if (S.msgT > 0) S.msgT -= dt;
      if (S.walk > 0) S.walk -= dt;
      if (S.ghost > 0) S.ghost -= dt;
      if (S.crash > 0) { S.crash -= dt; if (S.crash <= 0) { S.h = 3; S.crash = 0; S.ghost = 1.2; S.y += 6; } } // up again: blink and ignore obstacles for a moment so you can't crash-loop in a cluster of trees
      else {
        const a = ANG[S.h], cosA = Math.cos(a);
        const maxV = S.turbo ? 470 : 290;
        if (!S.air) {
          const acc = S.h === 0 || S.h === 6 ? -600 : 340 * cosA - 0.35 * S.v;
          S.v = clamp(S.v + acc * dt, 0, maxV * (0.45 + 0.55 * cosA));
        }
        const vx = Math.sin(a) * S.v, vy = Math.cos(a) * S.v;
        S.x += vx * dt; S.y += vy * dt;
        if (S.air) {
          S.vz -= 420 * dt; S.z += S.vz * dt;
          if (S.trick) { S.trick.t += dt; if (S.trick.t >= S.trick.dur) { S.tricks.push(S.trick.pts); S.trick = null; } }
          if (S.z <= 0) land();
        }
      }
      // npcs
      for (const o of objs) {
        if (!o.npc) continue;
        if (o.npc === 'board') { o.x += o.vx * dt; o.y += o.vy * dt; if (Math.random() < dt * 0.5) o.vx = (Math.random() - 0.5) * 120; }
        if (o.npc === 'dave') { o.y += o.vy * dt; o.x += Math.sin(S.t * 1.3 + o.y) * 40 * dt; }
        if (o.npc === 'pup') { const dx = S.x - o.x, dy = S.y - o.y, d = Math.hypot(dx, dy); if (d < 360 && !o.done) { o.x += dx / d * 150 * dt; o.y += dy / d * 150 * dt + (S.v * 0.8) * dt; } o.k = Math.floor(S.t * 8) % 2 ? 'pup' : 'pup2'; }
        if (o.hitT > 0) o.hitT -= dt;
      }
      // collisions
      if (S.crash <= 0 && !(S.ghost > 0)) for (const o of objs) {
        const hb = HIT[o.npc || o.k]; if (!hb || o.hitT > 0) continue;
        const dx = Math.abs(S.x - o.x), dy = S.y - (o.y + (o.npc ? 0 : 0));
        if (dx > hb[0] + 4 || dy < -hb[1] - 3 || dy > hb[1] + 3) continue;
        if (o.k === 'ramp') { if (!S.air && S.v > 60) { S.air = true; S.vz = 90 + S.v * 0.75; S.z = 0.1; S.tricks = []; G.sfx('boing'); o.hitT = 0.6; } continue; }
        if (o.k === 'mogul') { if (!S.air) { if (S.v > 200) { S.air = true; S.vz = 70; S.z = 0.1; S.tricks = []; } else S.v *= 0.9; } o.hitT = 0.4; continue; }
        if (S.air && S.z > (hb[2] - 4)) continue; // jumped over it
        if (o.npc === 'pup') { o.done = true; o.hitT = 2; crash('A baby snow monster bit your ankle!'); continue; }
        if (o.npc === 'dave') { o.hitT = 2; crash('"OI! Watch it!" (It was Dave.)'); continue; }
        if (o.npc === 'board') { o.hitT = 2; crash('Snowboarder! Typical.'); continue; }
        o.hitT = 1.5; crash(o.k === 'rock' ? 'Rocked!' : o.k === 'stump' ? 'Stumped!' : 'TIMBER!');
      }
      // slalom gates + finish
      if (opts.mode === 'slalom' && !S.finished) {
        for (const o of objs) {
          if (o.gate && !o.passed && S.y >= o.y + 4) { o.passed = true; const ok = S.x > o.x + 6 && S.x < o.x + 72 + 6; if (ok) { S.gates++; G.note(880, 0.06, 'square'); } else { S.missed++; say('Missed a gate! +5 sec', 1.4); G.sfx('uhoh'); } }
          if (o.finish && S.y >= o.y) { S.finished = true; finishSlalom(); }
        }
      }
      // distance, the 2000m squig
      const dist = Math.max(0, S.y / PX_M); S.maxDist = Math.max(S.maxDist, dist);
      if (!S.squig && dist >= 2000) { S.squig = { x: S.x + (Math.random() < 0.5 ? -260 : 260), y: S.y - 360, f: 0 }; S.squigStart = dist; say('What was THAT?!', 2.5); G.sfx('waaagh'); if (opts.music) G.music('jg_squig'); }
      if (S.squig && !S.eaten) {
        const q = S.squig, dx = S.x - q.x, dy = S.y - q.y, d = Math.hypot(dx, dy) || 1;
        const sp = Math.max(330, Math.min(440, d * 0.9));
        q.x += dx / d * sp * dt; q.y += dy / d * sp * dt; q.f += dt;
        if (d < 14) { q.x = S.x; q.y = S.y + 8; S.eaten = 0.001; S.trail = []; S.msgT = 0; S.v = 0; S.crash = 0; S.air = false; G.sfx('uhoh'); G.secret('games.ski.eaten'); G.stopMusic(); }
        if (dist >= S.squigStart + 1000 && !S.escaped) { S.escaped = true; G.secret('games.ski.escape'); say('You outran the snow monster for 1km! LEGEND!', 3); }
      }
      if (S.eaten) { S.eaten += dt; if (S.eaten > 3.2 && !S.over) gameOver(); }
      // stream the world: make more below, forget what's far above
      generate(S.y, S.y + 900);
      if (objs.length > 600) objs = objs.filter(o => o.y > S.y - 700 || o.k === 'sign2000');
    }
    function finishSlalom() {
      if (S.sim) { S.over = true; return; }
      const t = S.t + S.missed * 5;
      say(`FINISH! ${t.toFixed(1)} sec (${S.missed} missed)`, 4); G.sfx('solve');
      G.timeout(() => { S.over = true; G.stopMusic(); scSlalom.submit(Math.round(t * 10)); }, 1800);
    }
    function gameOver() {
      if (S.sim) { S.over = true; return; }
      S.over = true; G.stopMusic(); if (sv) sv.clear();
      const sc = Math.round(S.style + S.maxDist);
      if (opts.mode === 'free' && sc > 0) G.timeout(() => scFree.submit(sc), 900);
    }

    // ---------------------------------------------------------------- drawing
    const view = { sc: 2 };
    function blit(img, x, y, ax, ay, flip, rot) {
      const sc = view.sc, sx = Math.round((x - view.x) * sc + C.W / 2), sy = Math.round((y - view.y) * sc + C.H * 0.32);
      if (sx < -80 || sx > C.W + 80 || sy < -120 || sy > C.H + 80) return;
      ctx.save(); ctx.translate(sx, sy); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1);
      ctx.drawImage(img, -img.width * ax * sc, -img.height * ay * sc, img.width * sc, img.height * sc); ctx.restore();
    }
    function draw() {
      if (!S) return;
      view.sc = C.W < 420 ? 2 : C.W < 900 ? 2 : 3;
      view.x = S.x; view.y = S.y;
      if (S.eaten && S.squig) { view.x = S.squig.x; view.y = S.squig.y - 20; }
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, C.W, C.H);
      // ski tracks / snow sparkle
      ctx.fillStyle = '#e8f0ff';
      for (let i = 0; i < 40; i++) { const wx = Math.floor(view.x / 40) * 40 + ((i * 97) % 23 - 11) * 40, wy = Math.floor(view.y / 40) * 40 + ((i * 53) % 17 - 6) * 40; const sx = (wx - view.x) * view.sc + C.W / 2, sy = (wy - view.y) * view.sc + C.H * 0.32; ctx.fillRect(sx, sy, 3, 1); }
      // tracks behind the skier
      if (S.trail) { ctx.strokeStyle = '#d8e4f4'; ctx.lineWidth = 2; ctx.beginPath(); S.trail.forEach(([x, y], i) => { const sx = (x - view.x) * view.sc + C.W / 2, sy = (y - view.y) * view.sc + C.H * 0.32; i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); }); ctx.stroke(); }
      // objects sorted by y with the skier
      const list = objs.filter(o => Math.abs(o.y - view.y) < 500 && Math.abs(o.x - view.x) < C.W / view.sc);
      list.push({ me: true, y: S.y });
      if (S.squig) list.push({ squig: true, y: S.squig.y });
      list.sort((a, b) => a.y - b.y);
      for (const o of list) {
        if (o.me) drawMe();
        else if (o.squig) drawSquig();
        else if (o.k === 'dave') blit(skier(3, 'ski', '#c02020'), o.x, o.y, 0.5, 0.85);
        else blit(obj(o.k), o.x, o.y, 0.5, o.k === 'mogul' || o.k === 'ramp' ? 0.5 : 0.92, o.npc === 'board' && o.vx < 0);
      }
      drawHud();
      if (S.msgT > 0 && S.msg) { ctx.font = 'bold 13px Tahoma, sans-serif'; ctx.textAlign = 'center'; const tw = ctx.measureText(S.msg).width; ctx.fillStyle = 'rgba(255,255,224,.95)'; ctx.fillRect(C.W / 2 - tw / 2 - 8, C.H - 44, tw + 16, 24); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(C.W / 2 - tw / 2 - 7.5, C.H - 43.5, tw + 15, 23); ctx.fillStyle = '#000'; ctx.fillText(S.msg, C.W / 2, C.H - 28); ctx.textAlign = 'left'; }
      if (S.paused) overlay('PAUSED', G.phone() ? 'Click the slope to carry on' : 'Press any key or click to carry on');
      else if (S.over) overlay(S.eaten ? 'NOM NOM NOM' : S.finished ? 'FINISHED!' : 'GAME OVER', G.phone() ? 'Click for a new run' : 'Press Space or F2 for a new run');
    }
    function drawMe() {
      if (S.eaten) return;
      const lift = S.z;
      if (S.air) { ctx.fillStyle = 'rgba(80,100,140,.25)'; const sx = C.W / 2, sy = C.H * 0.32; ctx.beginPath(); ctx.ellipse(sx, sy, 7 * view.sc, 2.5 * view.sc, 0, 0, TAU); ctx.fill(); }
      let img, rot = 0, flip = false;
      if (S.ghost > 0 && Math.floor(S.ghost * 10) % 2) return; // blinking while getting up
      if (S.crash > 0) img = skier(3, 'crash');
      else if (S.trick) {
        const p = S.trick.t / S.trick.dur;
        if (S.trick.kind === 'left') { img = skier(S.h, 'air'); rot = -p * TAU; }
        else if (S.trick.kind === 'up') { img = skier(S.h, 'air'); rot = p * TAU; }
        else if (S.trick.kind === 'right') img = skier(S.h, 'ears');
        else img = skier(S.h, 'grab');
      } else img = skier(S.h, S.air ? 'air' : (S.walk > 0 ? 'walk' : 'ski'));
      blit(img, S.x, S.y - lift * 0.6, 0.5, 0.85, flip, rot);
      // remember a short trail
      if (!S.air && S.crash <= 0 && S.v > 20) { S.trail = S.trail || []; const tl = S.trail[S.trail.length - 1]; if (tl && Math.hypot(tl[0] - S.x, tl[1] - S.y) > 60) S.trail = [];
        if (!tl || Math.hypot(tl[0] - S.x, tl[1] - S.y) > 6) { S.trail.push([S.x, S.y]); if (S.trail.length > 80) S.trail.shift(); } }
    }
    function drawSquig() {
      const q = S.squig;
      const f = S.eaten ? (S.eaten < 2.6 ? (Math.floor(S.eaten * 6) % 2 ? 'eat1' : 'eat2') : 'eat3') : (Math.floor(q.f * 8) % 2 ? 'run1' : 'run2');
      blit(squig(f), q.x, q.y, 0.5, 0.9, S.x < q.x);
    }
    function drawHud() {
      const lines = opts.mode === 'slalom'
        ? [['Time', fmtT(S.t + S.missed * 5)], ['Dist', Math.floor(S.maxDist) + 'm'], ['Speed', Math.round(S.v / PX_M * 3.6) + 'km/h'], ['Gates', `${S.gates}/${S.gates + S.missed}`]]
        : [['Time', fmtT(S.t)], ['Dist', Math.floor(S.maxDist) + 'm'], ['Speed', Math.round(S.v / PX_M * 3.6) + 'km/h'], ['Style', String(Math.round(S.style))]];
      const bw = 120, bh = lines.length * 14 + 8, bx = C.W - bw - 8, by = 8;
      ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      ctx.font = '11px Tahoma, sans-serif'; ctx.fillStyle = '#000'; ctx.textBaseline = 'top';
      lines.forEach(([k, v], i) => { ctx.textAlign = 'left'; ctx.fillText(k + ':', bx + 6, by + 5 + i * 14); ctx.textAlign = 'right'; ctx.fillText(v, bx + bw - 6, by + 5 + i * 14); });
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      if (S.turbo) { ctx.fillStyle = '#e10600'; ctx.font = 'bold 11px Tahoma, sans-serif'; ctx.fillText('TURBO', bx, by + bh + 14); }
    }
    const fmtT = t => { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`; };
    function overlay(a, b) {
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(0, 0, C.W, C.H);
      ctx.textAlign = 'center'; ctx.fillStyle = '#000080'; ctx.font = 'bold 24px Tahoma, sans-serif'; ctx.fillText(a, C.W / 2, C.H / 2 - 6);
      ctx.fillStyle = '#000'; ctx.font = '12px Tahoma, sans-serif'; ctx.fillText(b, C.W / 2, C.H / 2 + 16); ctx.textAlign = 'left';
    }

    G.loop(dt => {
      if (!S) return;
      if (!S.paused) step(dt);
      draw();
      G.status(S.over ? 'Game over. F2 for a new run.' : S.air ? 'In the air! Arrow keys for tricks.' : S.squig && !S.eaten ? 'RUN! (Press F for turbo)' : opts.mode === 'slalom' ? 'Slalom: go between each pair of flags.' : 'Arrows steer, Space jumps, F turbo, F3 pause.');
    });

    // ---------------------------------------------------------------- menus
    G.newGame = () => { if (sv) sv.clear(); newGame(); G.focus(); };
    G.helpKey = () => help();
    function help() {
      G.help([
        ['How to Play', 'Ski down the mountain as far as you can. Trees, rocks and stumps will knock you flat. Moguls bounce you about. Ramps send you flying.\n\nFreestyle: score style points with tricks. Your score is style points plus metres skied.\n\nSlalom: ski between each pair of flags to the finish. Every missed gate adds 5 seconds.'],
        ['Controls', '- Left / Right arrows: turn (keep pressing to stop sideways)\n- Down arrow: point straight downhill\n- Space: jump\n- F: turbo on and off\n- F3: pause\n\nMouse: click and hold to steer towards the pointer. A quick click on Gubbinz jumps.'],
        ['Tricks', 'While you are in the air:\n\n- Left arrow: Helicopter\n- Right arrow: Ear Flap\n- Up arrow: Backflip\n- Down arrow: Gem Grab\n\nYou have to finish a trick before you land, or you land on your head. More tricks in one jump = way more points.\n\nWith the mouse: click left, right, above or below Gubbinz while he is in the air.'],
        ['The 2000m Thing', 'There is a sign at 2000 metres. Read it.\n\nJack says nobody has ever got away from what lives past the sign. Dave says he did, using a "special button". Dave says a lot of things.'],
      ]);
    }
    G.menu([
      ['Game', () => [
        { label: 'New Game', key: 'F2', act: G.newGame },
        { label: 'Pause', key: 'F3', chk: S && S.paused, dis: !S || S.over, act: () => pause() }, '-',
        { label: 'Freestyle', rad: opts.mode === 'free', act: () => { opts.mode = 'free'; saveOpts(); G.newGame(); } },
        { label: 'Slalom', rad: opts.mode === 'slalom', act: () => { opts.mode = 'slalom'; saveOpts(); G.newGame(); } }, '-',
        { label: 'Freestyle High Scores...', act: () => scFree.show() },
        { label: 'Slalom Best Times...', act: () => scSlalom.show() }, '-',
        { label: 'Exit', act: () => w.close() },
      ]],
      ['Options', () => [
        { label: 'Music', chk: opts.music, act: () => { opts.music = !opts.music; saveOpts(); G.music(opts.music && S && !S.over ? (S.squig ? 'jg_squig' : 'jg_ski') : ''); } },
        { label: 'Turbo', key: 'F', chk: S && S.turbo, dis: !S || S.over, act: () => { S.turbo = !S.turbo; if (S.turbo) G.secret('games.ski.turbo'); } },
      ]],
      ['Help', () => [
        { label: 'Help Topics', key: 'F1', act: help }, '-',
        { label: 'About SkiJack', act: () => G.about({ ver: 'Version 1.3 (Winter 1999)', blurb: 'Ski down a mountain that never ends. Something at the bottom is hungry.', credits: [['Skiing', 'Gubbinz'], ['Programming', 'Jack'], ['Trees', 'Jack (lots of copy and paste)'], ['Snow', 'The colour white'], ['Monster design', Cast.t('Cousin {cousin}')], ['Being run over', 'Dave'], ['Tricks consultant', 'Some lad off the telly'], ['Hot chocolate', 'Mom']] }) },
      ]],
    ]);
    // automated test harness: random steering, jumps, tricks and turbo for N simulated seconds; reports crash loops,
    // stalls and NaNs (secrets, sounds and score dialogs are switched off while it runs)
    G.simRun = o => {
      o = Object.assign({ seconds: 600, seed: 1, mode: 'free' }, o || {});
      const rnd = JG.rng(o.seed), saved = [Math.random, G.sfx, G.note, G.secret, G.music], savedMode = opts.mode;
      Math.random = rnd; G.sfx = G.note = G.secret = G.music = () => {}; opts.mode = o.mode;
      const rep = { seconds: o.seconds, runs: 0, crashes: 0, loops: [], stalls: [], nan: 0, eaten: 0, best: 0 };
      const fresh = () => { newGame(); S.sim = true; rep.runs++; };
      fresh();
      let next = 0, stall = 0, recent = [];
      try {
        for (let t = 0, dt = 1 / 60; t < o.seconds; t += dt) {
          if ((next -= dt) <= 0) { next = 0.2 + rnd() * 1.2; const r = rnd(); if (S.air) { trickKey(['left', 'right', 'up', 'down'][rnd() * 4 | 0]); } else if (r < 0.15) jump(); else if (r < 0.2) S.turbo = !S.turbo; else S.h = [1, 2, 3, 3, 3, 4, 5, 0, 6][rnd() * 9 | 0]; }
          const n0 = S.crashN || 0;
          step(dt);
          if ((S.crashN || 0) > n0) { rep.crashes++; recent.push([t, S.x, S.y]); recent = recent.filter(c => t - c[0] < 6); if (recent.length >= 3 && recent.every(c => Math.abs(c[1] - S.x) + Math.abs(c[2] - S.y) < 30)) { rep.loops.push([Math.round(S.x), Math.round(S.y / 16)]); recent = []; S.h = 3; S.y += 40; } }
          if (!isFinite(S.x) || !isFinite(S.y) || !isFinite(S.v)) { rep.nan++; fresh(); continue; }
          if (S.crash <= 0 && !S.air && !S.eaten && S.h !== 0 && S.h !== 6 && S.v < 5) { stall += dt; if (stall > 3) { rep.stalls.push([Math.round(S.x), Math.round(S.y / 16)]); stall = 0; S.y += 40; } } else stall = 0;
          if (o.trace && Math.floor(t * 60) % 300 === 0) (rep.trace = rep.trace || []).push([+t.toFixed(0), S.x | 0, S.y | 0, S.v | 0, S.h, S.crash > 0 ? 'C' : S.air ? 'A' : '-']);
          if (S.over) { if (S.eaten) rep.eaten++; rep.best = Math.max(rep.best, S.maxDist | 0); fresh(); }
        }
      } finally { [Math.random, G.sfx, G.note, G.secret, G.music] = saved; opts.mode = savedMode; }
      rep.best = Math.max(rep.best, S.maxDist | 0); newGame();
      return rep;
    };
    G.dbg = () => ({ x: S.x | 0, y: S.y | 0, v: S.v | 0, h: S.h, air: S.air, crash: S.crash, dist: S.maxDist | 0, squig: !!S.squig, eaten: !!S.eaten, over: S.over, style: S.style, objs: objs.length });
    G.cheat = m => { S.trail = []; S.y = m * PX_M; S.maxDist = m; genY = S.y; objs = objs.filter(o => o.k === 'sign2000'); generate(S.y, S.y + 900); };
    // saved game (js/gamesave.js): the run carries on exactly where you were (the slope around you, the squig, your
    // style points), paused, after a refresh or a closed window
    const sv = G.saver(() => {
      if (!S || S.sim) return undefined;
      if (S.over || S.eaten || S.finished) return null;
      return { mode: opts.mode, genY, S: Object.assign({}, S, { paused: true, trail: [] }), objs: objs.filter(o => o.k === 'sign2000' || (o.y > S.y - 400 && o.y < S.y + 950)) };
    }, { v: 1, live: true, every: 5000 });
    const resume = d => {
      if (!d || !d.S || !Array.isArray(d.objs) || !isFinite(d.S.y)) return false;
      if (d.mode === 'free' || d.mode === 'slalom') opts.mode = d.mode;
      S = Object.assign({}, d.S, { paused: true, trail: [] }); objs = d.objs; genY = +d.genY || S.y; rnd = JG.rng((Date.now() & 0xffff) + 7);
      generate(S.y, S.y + 900); say(G.phone() ? 'Welcome back! Click the slope to carry on.' : 'Welcome back! Press any key to carry on.', 3);
      return true;
    };
    if (!resume(sv && sv.load())) { if (sv) sv.clear(); newGame(); }
  });
})();

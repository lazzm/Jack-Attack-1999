/* Jacklings for JackOS 98 (lazy loaded by apps-games.js). Little grots walk off cliffs; you give them jobs
 * (block, build, bash, dig, float with a brolly) to get enough of them home. Destructible pixel terrain, five
 * levels, all original code and art. */
(function () {
  'use strict';
  const JG = window.JGames; if (!JG) return;
  const LW = 320, LH = 180, TPS = 30, FALL_DIE = 62;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const SKILLS = [['block', 'Blocker'], ['build', 'Builder'], ['bash', 'Basher'], ['dig', 'Digger'], ['float', 'Brolly']];

  // ================================================================ levels: drawn with simple shapes into the terrain mask
  // 1 = earth, 2 = steel, 3 = goo pit (deadly)
  const LEVELS = [
    { name: 'Dig In', n: 10, need: 7, rate: 50, time: 180, entry: [60, 52], exit: [250, 148], skills: { dig: 3 },
      tip: 'The way home is underneath you. Dig, Jackling, dig!',
      draw(r) { r(20, 90, 280, 16, 1); r(14, 50, 8, 56, 1); r(298, 50, 8, 56, 1); r(0, 148, 320, 32, 1); r(0, 112, 8, 40, 2); r(312, 112, 8, 40, 2); r(0, 170, 320, 10, 2); } },
    { name: 'Mind the Gap', n: 12, need: 8, rate: 40, time: 240, entry: [40, 82], exit: [276, 110], skills: { build: 3, block: 1 },
      tip: 'Builders make stairs. Twelve steps each. Goo pits are NOT for paddling.',
      draw(r) { r(0, 110, 144, 70, 1); r(176, 110, 144, 70, 1); r(144, 166, 32, 14, 3); r(0, 60, 8, 50, 2); r(312, 60, 8, 50, 2); } },
    { name: 'Basher Brothers', n: 12, need: 9, rate: 50, time: 240, entry: [30, 102], exit: [292, 130], skills: { bash: 4, block: 1 },
      tip: 'Three walls. Bashers punch straight through earth (but not steel).',
      draw(r) { r(0, 130, 320, 50, 1); r(0, 70, 8, 60, 2); r(312, 70, 8, 60, 2); for (const x of [90, 160, 230]) r(x, 86, 14, 44, 1); r(0, 172, 320, 8, 2); } },
    { name: 'Steel Yourself', n: 15, need: 10, rate: 45, time: 240, entry: [40, 52], exit: [280, 138], skills: { dig: 2, build: 3, block: 1, float: 1 },
      tip: 'Steel can\'t be dug. Dig in the right place, or bridge the pit below.',
      draw(r) { r(0, 80, 200, 16, 1); r(200, 30, 10, 66, 2); r(0, 30, 8, 50, 2); r(0, 138, 120, 42, 1); r(165, 138, 155, 42, 1); r(120, 162, 45, 18, 3); r(312, 98, 8, 40, 2); r(0, 172, 120, 8, 2); r(165, 172, 155, 8, 2); } },
    { name: 'Rupee Mountain', n: 20, need: 14, rate: 50, time: 300, entry: [30, 98], exit: [292, 150], skills: { float: 6, bash: 2, block: 2, build: 2, dig: 1 },
      tip: 'Up the mountain, then a long way down. Jacklings with brollies float.',
      draw(r, poly) { r(0, 128, 210, 52, 1); poly([[100, 128], [190, 40], [210, 40], [210, 128]], 1); r(186, 40, 26, 12, 2); r(210, 150, 110, 30, 1); r(210, 128, 6, 22, 1); r(0, 70, 8, 60, 2); r(312, 110, 8, 40, 2); r(216, 168, 30, 12, 3); r(0, 172, 210, 8, 2); } },
  ];

  JG.mod('grotlings', G => {
    const host = G.host, w = G.w;
    G.fit();
    JG.css('grotlings', `
      .jg-grotlings{display:flex;flex-direction:column;background:#000}
      .jg-grotlings .grl-view{position:relative;flex:1;min-height:0}
      .jg-grotlings .grl-bar{flex:none;display:flex;flex-wrap:wrap;gap:2px;padding:3px;background:var(--face);border-top:2px solid #fff}
      .jg-grotlings .grl-bar .btn{min-width:0;padding:2px 4px;display:flex;flex-direction:column;align-items:center;gap:1px;font-size:11px;line-height:1.1;flex:1 1 52px;min-height:40px;touch-action:manipulation}
      .jg-grotlings .grl-bar .btn b{font:bold 12px "Courier New",monospace}
      .jg-grotlings .grl-bar .btn.on{background:#fff;border-color:#000 #fff #fff #000}
      .jg-grotlings .grl-bar .btn canvas{width:16px;height:16px;image-rendering:pixelated}
      .jg-grotlings .grl-bar .btn:disabled canvas{opacity:.4}
    `);
    host.classList.add('jg-grotlings');
    const view = document.createElement('div'); view.className = 'grl-view'; host.appendChild(view);
    const bar = document.createElement('div'); bar.className = 'grl-bar'; host.appendChild(bar);
    const C = G.canvas(view);
    const cv = C.cv, ctx = C.c;
    G.focusEl = cv;
    let prog = Object.assign({ done: [] }, G.store.get('prog', {}));
    const saveProg = () => G.store.set('prog', prog);

    // ---------------------------------------------------------------- terrain
    const mask = new Uint8Array(LW * LH);
    const terr = document.createElement('canvas'); terr.width = LW; terr.height = LH;
    const tctx = terr.getContext('2d'), timg = tctx.createImageData(LW, LH);
    const at = (x, y) => (x < 0 || x >= LW || y >= LH) ? 2 : y < 0 ? 0 : mask[y * LW + x];
    const solid = (x, y) => { const v = at(x | 0, y | 0); return v === 1 || v === 2; };
    let dirty = null;
    function colour(x, y) {
      const v = mask[y * LW + x], o = (y * LW + x) * 4, d = timg.data;
      if (v === 0 || v === 3) { d[o + 3] = 0; return; }
      if (v === 2) { const rv = (x % 8 === 3 && y % 8 === 3); const sh = (x % 8 === 0 || y % 8 === 0) ? 90 : rv ? 200 : 140 + ((x + y) % 3) * 6; d[o] = sh; d[o + 1] = sh; d[o + 2] = sh + 12; d[o + 3] = 255; return; }
      const n = ((x * 73856093) ^ (y * 19349663)) >>> 0, sp = n % 7;
      let r = 140 - sp * 6, g = 86 - sp * 4, b = 40 - sp * 2;
      if (y > 0 && mask[(y - 1) * LW + x] === 0) { r = 70; g = 170; b = 40; } else if (y > 1 && mask[(y - 2) * LW + x] === 0) { r = 60; g = 130; b = 30; }
      if (n % 41 === 0) { r = 200; g = 180; b = 150; }
      d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
    }
    function markDirty(x0, y0, x1, y1) { x0 = clamp(x0 | 0, 0, LW - 1); y0 = clamp((y0 | 0) - 2, 0, LH - 1); x1 = clamp(x1 | 0, 0, LW - 1); y1 = clamp((y1 | 0) + 2, 0, LH - 1); if (!dirty) dirty = [x0, y0, x1, y1]; else { dirty[0] = Math.min(dirty[0], x0); dirty[1] = Math.min(dirty[1], y0); dirty[2] = Math.max(dirty[2], x1); dirty[3] = Math.max(dirty[3], y1); } }
    function flush() { if (!dirty) return; const [x0, y0, x1, y1] = dirty; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) colour(x, y); tctx.putImageData(timg, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1); dirty = null; }
    function carve(x0, y0, x1, y1, keepSteel) { let n = 0; for (let y = Math.max(0, y0 | 0); y <= Math.min(LH - 1, y1 | 0); y++) for (let x = Math.max(0, x0 | 0); x <= Math.min(LW - 1, x1 | 0); x++) { const i = y * LW + x; if (mask[i] === 1) { mask[i] = 0; n++; } } markDirty(x0, y0, x1, y1); return n; }
    function carveCircle(cx, cy, r) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) { const X = cx + x | 0, Y = cy + y | 0; if (X >= 0 && X < LW && Y >= 0 && Y < LH && mask[Y * LW + X] === 1) mask[Y * LW + X] = 0; } markDirty(cx - r, cy - r, cx + r, cy + r); }
    function fill(x0, y0, x1, y1, v) { for (let y = Math.max(0, y0 | 0); y <= Math.min(LH - 1, y1 | 0); y++) for (let x = Math.max(0, x0 | 0); x <= Math.min(LW - 1, x1 | 0); x++) if (mask[y * LW + x] === 0) mask[y * LW + x] = v; markDirty(x0, y0, x1, y1); }

    // ---------------------------------------------------------------- game state
    let L = null, S = null;
    function loadLevel(i) {
      L = LEVELS[i]; mask.fill(0);
      const r = (x, y, ww, hh, v) => { for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + ww; xx++) if (xx >= 0 && xx < LW && yy >= 0 && yy < LH) mask[yy * LW + xx] = v; };
      const poly = (pts, v) => { // scanline fill
        for (let y = 0; y < LH; y++) { const xs = []; for (let k = 0; k < pts.length; k++) { const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % pts.length]; if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) / (by - ay) * (bx - ax)); } xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) r(Math.ceil(xs[k]), y, Math.floor(xs[k + 1]) - Math.ceil(xs[k]) + 1, 1, v); }
      };
      L.draw(r, poly);
      for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) colour(x, y);
      tctx.putImageData(timg, 0, 0);
      S = { lvl: i, grots: [], out: 0, saved: 0, dead: 0, rate: L.rate, minRate: L.rate, skills: Object.assign({ block: 0, build: 0, bash: 0, dig: 0, float: 0 }, L.skills), sel: Object.keys(L.skills)[0], tick: 0, spawnT: 40, time: L.time, state: 'intro', paused: false, fast: false, nuke: 0, nukeArm: 0, hatch: 0, hover: null, fx: [], over: null };
      buildBar(); G.status(`Level ${i + 1}: ${L.name}`);
    }
    function start() { S.state = 'play'; G.sfx('join'); }

    // ---------------------------------------------------------------- the grotlings
    function spawn() { S.grots.push({ x: L.entry[0], y: L.entry[1] + 8, dir: 1, st: 'fall', fall: 0, t: 0, n: 0, floater: false, blink: Math.random() * 100 }); S.out++; }
    function blockedBy(g, nx) { for (const b of S.grots) if (b !== g && b.st === 'block' && Math.abs(b.y - g.y) < 8 && Math.abs(b.x - nx) < 3 && Math.sign(b.x - g.x) === g.dir) return true; return false; }
    function tickGrot(g) {
      g.t++;
      const x = Math.round(g.x), y = Math.round(g.y);
      if (at(x, y) === 3 || at(x, y + 1) === 3) { die(g, 'pit'); return; }
      if (y > LH + 4) { die(g, 'fell'); return; }
      switch (g.st) {
        case 'walk': {
          if (!solid(x, y + 1)) { g.st = 'fall'; g.fall = 0; return; }
          if (g.t % 2) return;
          const nx = x + g.dir;
          if (blockedBy(g, nx)) { g.dir = -g.dir; return; }
          // step up to 4px, otherwise turn round; step down to follow the ground
          let up = 0; while (up <= 5 && solid(nx, y - up)) up++;
          if (up > 4) { g.dir = -g.dir; return; }
          g.x = nx; g.y = y - up;
          if (!solid(nx, g.y + 1) && solid(nx, g.y + 2)) g.y++;
          else if (!solid(nx, g.y + 1) && solid(nx, g.y + 3)) g.y += 2;
          checkExit(g);
          return;
        }
        case 'fall': {
          const sp = g.floater && g.fall > 12 ? 1 : 3;
          for (let k = 0; k < sp; k++) {
            if (solid(x, Math.round(g.y) + 1)) { if (g.fall > FALL_DIE && !g.floater) { die(g, 'splat'); } else { g.st = 'walk'; g.t = 0; } return; }
            g.y++; g.fall++;
            if (at(x, Math.round(g.y)) === 3) { die(g, 'pit'); return; }
          }
          return;
        }
        case 'dig': {
          if (g.t % 6) return;
          if (at(x, y + 1) === 2 || at(x - 2, y + 1) === 2) { g.st = 'walk'; say('Steel! Can\'t dig that.'); return; }
          const n = carve(x - 4, y + 1, x + 4, y + 2);
          if (!n && !solid(x, y + 3)) { g.st = 'fall'; g.fall = 0; return; }
          g.y += 1; G.note(120 + Math.random() * 40, 0.03, 'triangle');
          return;
        }
        case 'bash': {
          if (g.t % 5) return;
          const fx = x + g.dir * 3;
          let steel = false, earth = 0;
          for (let yy = y - 9; yy <= y; yy++) for (let xx = 0; xx < 5; xx++) { const v = at(fx + xx * g.dir, yy); if (v === 2) steel = true; if (v === 1) earth++; }
          if (steel) { g.st = 'walk'; say('Clang! That\'s steel.'); return; }
          carve(Math.min(fx, fx + 4 * g.dir), y - 9, Math.max(fx, fx + 4 * g.dir), y);
          g.x += g.dir;
          if (!solid(Math.round(g.x), y + 1)) { g.st = 'fall'; g.fall = 0; return; }
          if (!earth) { g.n++; if (g.n > 6) g.st = 'walk'; } else g.n = 0;
          if (earth) G.note(90, 0.04, 'square');
          return;
        }
        case 'build': {
          if (g.t % 6) return;
          if (g.n >= 12) { g.st = 'walk'; say('Out of bricks! (shrugs)'); return; }
          // lay a brick 6 wide ahead at foot level, then step up onto it
          const bx0 = g.dir > 0 ? x : x - 5, bx1 = bx0 + 5;
          if (solid(x + g.dir * 2, y - 10)) { g.st = 'walk'; g.dir = -g.dir; return; }
          fill(bx0, y, bx1, y, 1); g.n++; G.note(400 + g.n * 30, 0.03, 'square');
          if (g.n >= 10) G.note(900, 0.05, 'square');
          if (solid(x + g.dir * 2, y - 1) && solid(x + g.dir * 2, y - 5)) { g.st = 'walk'; g.dir = -g.dir; return; }
          g.x += g.dir * 3; g.y -= 1;
          return;
        }
        case 'block': if (!solid(x, y + 1)) { g.st = 'fall'; g.fall = 0; } return;
        case 'boom': if (g.t > 20) { carveCircle(x, y - 4, 8); S.fx.push({ x, y: y - 4, t: 0 }); g.gone = true; S.dead++; G.sfx('thud'); } return;
      }
    }
    function checkExit(g) { const [ex, ey] = L.exit; if (Math.abs(g.x - ex) < 4 && Math.abs(g.y - ey) < 6) { g.gone = true; S.saved++; G.sfx('pet'); } }
    function die(g, how) { g.gone = true; S.dead++; S.fx.push({ x: g.x, y: g.y, t: 0, how }); G.sfx(how === 'pit' ? 'uhoh' : 'thud'); }
    let sayT = 0, sayMsg = '';
    function say(t) { sayMsg = t; sayT = 2.2; }
    function assign(g) {
      const sk = S.sel; if (!g || !sk || S.state !== 'play') return;
      if (S.skills[sk] <= 0) { G.sfx('uhoh'); return; }
      if (sk === 'float') { if (g.floater) return; g.floater = true; }
      else {
        if (g.st === 'fall' || g.st === 'block' || g.st === 'boom') return;
        if (g.st === sk) return;
        if (sk === 'bash') { g.st = 'bash'; g.n = 0; }
        else if (sk === 'build') { g.st = 'build'; g.n = 0; }
        else g.st = sk;
        g.t = 0;
      }
      S.skills[sk]--; G.sfx('click'); updateBar();
    }
    function nuke() {
      if (S.state !== 'play' || S.nuke) return;
      if (!S.nukeArm || performance.now() - S.nukeArm > 1500) { S.nukeArm = performance.now(); say('Press NUKE again to say goodbye...'); return; }
      S.nuke = 1; S.out = L.n; G.secret('games.grot.nuke'); say('Oh no!'); G.sfx('uhoh');
      S.grots.forEach((g, i) => { g.boomAt = i * 3; });
    }

    // ---------------------------------------------------------------- simulation
    let acc = 0;
    function tick() {
      S.tick++;
      if (S.hatch < 20) { S.hatch++; return; }
      if (!S.nuke && S.out < L.n && --S.spawnT <= 0) { spawn(); S.spawnT = Math.round((100 - S.rate) * 0.9 + 12); }
      for (const g of S.grots) {
        if (g.gone) continue;
        if (S.nuke && g.st !== 'boom' && --g.boomAt <= 0) { g.st = 'boom'; g.t = 0; continue; }
        tickGrot(g);
      }
      S.grots = S.grots.filter(g => !g.gone);
      if (S.tick % TPS === 0 && !S.nuke) { S.time--; if (S.time <= 0) { S.time = 0; for (const g of S.grots) { g.gone = true; S.dead++; } S.grots = []; S.out = L.n; } }
      for (const f of S.fx) f.t++;
      S.fx = S.fx.filter(f => f.t < 30);
      if (S.out >= L.n && !S.grots.length && !S.over) levelEnd();
    }
    function levelEnd() {
      const pct = Math.round(S.saved / L.n * 100), ok = S.saved >= L.need;
      S.over = { ok, pct }; S.state = 'end';
      if (ok) {
        G.sfx('solve');
        if (!prog.done.includes(S.lvl)) { prog.done.push(S.lvl); saveProg(); }
        if (LEVELS.every((l, i) => prog.done.includes(i))) G.secret('games.grot.done');
      } else G.sfx('uhoh');
    }

    // ---------------------------------------------------------------- drawing
    const vp = { s: 1, ox: 0, oy: 0 };
    function layout() { vp.s = Math.min(C.W / LW, C.H / LH); vp.ox = (C.W - LW * vp.s) / 2; vp.oy = (C.H - LH * vp.s) / 2; }
    const GR = '#5aac2c', BL = '#2349b8';
    function drawGrot(g, now) {
      const s = vp.s, X = vp.ox + g.x * s, Y = vp.oy + g.y * s, p = (dx, dy, ww, hh, col) => { ctx.fillStyle = col; ctx.fillRect(X + dx * s * g.dir, Y + dy * s, ww * s * g.dir, hh * s); }, pp = (dx, dy, ww, hh, col) => { ctx.fillStyle = col; ctx.fillRect(X + dx * s, Y + dy * s, ww * s, hh * s); };
      const step = g.st === 'walk' ? (Math.floor(g.x) % 4 < 2 ? 0 : 1) : 0;
      const SK = '#f4c8a0', HAT = '#ffd400', HATD = '#c89a00', TR = '#1a7a2a';
      if (g.st === 'block') { // arms out, facing you: "nobody gets past"
        pp(-2, -2, 1, 2, TR); pp(1, -2, 1, 2, TR); pp(-2, -6, 4, 4, BL); pp(-5, -6, 3, 1, BL); pp(2, -6, 3, 1, BL); pp(-6, -6, 1, 1, SK); pp(5, -6, 1, 1, SK);
        pp(-2, -9, 4, 3, SK); pp(-1, -8, 1, 1, '#000'); pp(1, -8, 1, 1, '#000'); pp(-2, -10, 4, 1, HAT); pp(-3, -9, 6, 1, HATD); pp(-1, -11, 2, 1, HAT); return;
      }
      // little helmeted blokes: green trousers, blue jumper, yellow hard hat
      if (g.st === 'fall' && !g.floater) { p(-1, -2, 1, 2, TR); p(1, -2, 1, 2, TR); p(-2, -6, 4, 4, BL); p(-3, -10, 1, 4, BL); p(2, -10, 1, 4, BL); p(-3, -11, 1, 1, SK); p(2, -11, 1, 1, SK); }
      else { p(-1 - step, -2, 1, 2, TR); p(1 + step, -2, 1, 2, TR); p(-2, -6, 4, 4, BL); p(1 - step, -5, 1, 2, BL); p(1 - step, -3, 1, 1, SK); }
      p(-2, -9, 4, 3, SK); p(1, -8, 1, 1, '#000'); p(2, -7, 1, 1, SK);
      p(-2, -11, 4, 2, HAT); p(-1, -12, 2, 1, HAT); p(2, -10, 2, 1, HATD); p(-2, -10, 1, 1, HATD);
      if (g.floater && g.st === 'fall' && g.fall > 12) { pp(-5, -16, 10, 2, '#e10600'); pp(-4, -17, 8, 1, '#e10600'); pp(-3, -18, 6, 1, '#ff6060'); pp(0, -14, 1, 4, '#333'); }
      if (g.st === 'dig') { pp(-3, -4 + (g.t % 12 < 6 ? 0 : 1), 6, 1, '#c0c0c0'); }
      if (g.st === 'bash') { p(2, -6 + (g.t % 10 < 5 ? 0 : 1), 3, 2, BL); p(5, -6 + (g.t % 10 < 5 ? 0 : 1), 1, 2, SK); }
      if (g.st === 'build') { p(2, -4, 2, 2, '#c08040'); }
      if (g.st === 'boom') { ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(9, 5 * s)}px Tahoma, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(String(Math.max(1, 5 - Math.floor(g.t / 4))), X, Y - 12 * s); ctx.textAlign = 'left'; }
    }
    function draw() {
      layout();
      const s = vp.s, now = performance.now();
      ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, C.W, C.H);
      if (!L) return;
      const bg = ctx.createLinearGradient(0, vp.oy, 0, vp.oy + LH * s); bg.addColorStop(0, '#0a0a2a'); bg.addColorStop(1, '#1a0a2a'); ctx.fillStyle = bg; ctx.fillRect(vp.ox, vp.oy, LW * s, LH * s);
      // goo pits (animated) live behind the terrain
      ctx.fillStyle = '#3ac83a';
      for (let x = 0; x < LW; x += 2) for (let y = 0; y < LH; y += 2) if (mask[y * LW + x] === 3) { const wob = Math.sin(now / 200 + x / 5) > 0.7; ctx.fillStyle = wob ? '#9aff5a' : (y % 4 ? '#3ac83a' : '#22a02a'); ctx.fillRect(vp.ox + x * s, vp.oy + y * s, 2 * s + 0.5, 2 * s + 0.5); }
      flush();
      ctx.imageSmoothingEnabled = false; ctx.drawImage(terr, vp.ox, vp.oy, LW * s, LH * s);
      // goo bubbles rising and popping in the pits
      for (let x = 2; x < LW; x += 9) for (let y = 0; y < LH; y++) if (mask[y * LW + x] === 3) { const ph = ((now / 700 + x * 0.37) % 1), by = y + 6 - ph * 7, r = (0.8 + ph * 1.4) * s; if (ph < 0.9) { ctx.fillStyle = 'rgba(200,255,150,.85)'; ctx.beginPath(); ctx.arc(vp.ox + (x + 1) * s, vp.oy + by * s, r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(vp.ox + (x + 1) * s - r * 0.5, vp.oy + by * s - r * 0.5, Math.max(1, r * 0.4), Math.max(1, r * 0.4)); } break; }
      // entrance hatch + exit hut
      const [ex, ey] = L.entry, op = Math.min(1, S.hatch / 20);
      ctx.fillStyle = '#6a3a10'; ctx.fillRect(vp.ox + (ex - 10) * s, vp.oy + (ey - 8) * s, 20 * s, 8 * s); ctx.fillStyle = '#a06020'; ctx.fillRect(vp.ox + (ex - 10) * s, vp.oy + (ey - 8) * s, 20 * s, 2 * s);
      ctx.fillStyle = '#000'; ctx.fillRect(vp.ox + (ex - 7) * s, vp.oy + (ey - 1) * s, 14 * s, 1 * s);
      ctx.fillStyle = '#8a5a20'; ctx.fillRect(vp.ox + (ex - 7) * s, vp.oy + ey * s, 7 * s, (1 + op * 4) * s); ctx.fillRect(vp.ox + ex * s, vp.oy + ey * s, 7 * s, (1 + op * 4) * s);
      const [hx, hy] = L.exit;
      ctx.fillStyle = '#7a4a1a'; ctx.fillRect(vp.ox + (hx - 9) * s, vp.oy + (hy - 14) * s, 18 * s, 14 * s);
      ctx.fillStyle = '#c03000'; ctx.beginPath(); ctx.moveTo(vp.ox + (hx - 12) * s, vp.oy + (hy - 14) * s); ctx.lineTo(vp.ox + hx * s, vp.oy + (hy - 22) * s); ctx.lineTo(vp.ox + (hx + 12) * s, vp.oy + (hy - 14) * s); ctx.fill();
      ctx.fillStyle = '#000'; ctx.fillRect(vp.ox + (hx - 3) * s, vp.oy + (hy - 8) * s, 6 * s, 8 * s);
      for (const tx of [-11, 10]) { const fl = Math.sin(now / 90 + tx) > 0; ctx.fillStyle = '#5a3a1a'; ctx.fillRect(vp.ox + (hx + tx) * s, vp.oy + (hy - 8) * s, s, 8 * s); ctx.fillStyle = fl ? '#ffd400' : '#ff8a00'; ctx.fillRect(vp.ox + (hx + tx - 1) * s, vp.oy + (hy - 11 - (fl ? 1 : 0)) * s, 3 * s, 3 * s); }
      // grotlings
      for (const g of S.grots) drawGrot(g, now);
      // death puffs + explosions
      for (const f of S.fx) { const r = (2 + f.t / 3) * s; ctx.fillStyle = f.how === 'pit' ? `rgba(90,220,60,${1 - f.t / 30})` : `rgba(255,255,255,${1 - f.t / 30})`; ctx.beginPath(); ctx.arc(vp.ox + f.x * s, vp.oy + (f.y - 4) * s, r, 0, Math.PI * 2); ctx.fill(); if (f.t < 12 && f.how !== 'pit') { ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(9, 4 * s)}px Tahoma, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(f.how === 'splat' ? 'SPLAT' : f.how ? 'oof' : 'POP', vp.ox + f.x * s, vp.oy + (f.y - 12 - f.t) * s); ctx.textAlign = 'left'; } }
      // hover cursor
      const h = S.hover;
      if (h && !h.gone && S.state === 'play') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; const X = vp.ox + h.x * s, Y = vp.oy + (h.y - 6) * s, r = 7 * s; ctx.strokeRect(X - r, Y - r, r * 2, r * 2); }
      // top info line
      ctx.font = '12px Tahoma, sans-serif'; ctx.textBaseline = 'top';
      const info = `OUT ${S.grots.length}   HOME ${Math.round(S.saved / L.n * 100)}% (need ${Math.round(L.need / L.n * 100)}%)   TIME ${Math.floor(S.time / 60)}:${String(S.time % 60).padStart(2, '0')}`;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; const iw = ctx.measureText(info).width + 12; ctx.fillRect(vp.ox + 4, vp.oy + 4, iw, 18); ctx.fillStyle = '#7cff3a'; ctx.fillText(info, vp.ox + 10, vp.oy + 7);
      if (h && S.state === 'play') { ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(({ walk: 'Walker', fall: h.floater ? 'Brolly' : 'Faller', block: 'Blocker', build: 'Builder', bash: 'Basher', dig: 'Digger', boom: 'Oh no!' })[h.st] || '', vp.ox + LW * s - 8, vp.oy + 7); ctx.textAlign = 'left'; }
      if (sayT > 0) { ctx.fillStyle = 'rgba(255,255,224,.95)'; const tw = ctx.measureText(sayMsg).width + 14; ctx.fillRect(vp.ox + (LW * s - tw) / 2, vp.oy + LH * s - 26, tw, 20); ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.fillText(sayMsg, vp.ox + LW * s / 2, vp.oy + LH * s - 22); ctx.textAlign = 'left'; }
      if (S.state === 'intro') card([`Level ${S.lvl + 1}: ${L.name}`, '', `Jacklings: ${L.n}`, `Get home: ${L.need} (${Math.round(L.need / L.n * 100)}%)`, `Release rate: ${L.rate}`, `Time: ${Math.floor(L.time / 60)} minutes`, '', L.tip, '', G.phone() ? 'Click to start' : 'Click or press a key to start']);
      else if (S.state === 'end') card(S.over.ok ? ['Level complete!', '', `You got ${S.saved} of ${L.n} home (${S.over.pct}%).`, S.over.pct === 100 ? 'EVERY SINGLE ONE. Superb!' : 'Good job, Jackling shepherd.', '', S.lvl < LEVELS.length - 1 ? (G.phone() ? 'Click for the next level' : 'Click for the next level') : 'That was the last level! You beat Jacklings!'] : ['Oh dear...', '', `Only ${S.saved} of ${L.n} made it home (${S.over.pct}%).`, `You needed ${L.need}.`, '', G.phone() ? 'Click to try again' : 'Click to try again']);
      else if (S.paused) card(['PAUSED', '', G.phone() ? 'Press the pause button to carry on' : 'Press P or F3 to carry on']);
      ctx.textBaseline = 'alphabetic';
    }
    function card(lines) {
      const s = vp.s, bw = Math.min(LW * s - 20, 320), bh = lines.length * 16 + 20, bx = vp.ox + (LW * s - bw) / 2, by = vp.oy + (LH * s - bh) / 2;
      ctx.fillStyle = 'rgba(0,0,40,.88)'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = '#7cff3a'; ctx.lineWidth = 2; ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      lines.forEach((t, i) => { ctx.fillStyle = i === 0 ? '#ffd400' : '#fff'; ctx.font = i === 0 ? 'bold 14px Tahoma, sans-serif' : '12px Tahoma, sans-serif'; wrapC(t, bx + bw / 2, by + 10 + i * 16, bw - 20); });
      ctx.textAlign = 'left';
    }
    function wrapC(t, x, y, maxW) { if (ctx.measureText(t).width <= maxW) { ctx.fillText(t, x, y); return; } ctx.font = '11px Tahoma, sans-serif'; ctx.fillText(t, x, y); }

    // ---------------------------------------------------------------- input
    const toLevel = ev => { const r = DesktopSurface.rect(cv), point = DesktopSurface.point(ev.clientX, ev.clientY); return [(point.x - r.left - vp.ox) / vp.s, (point.y - r.top - vp.oy) / vp.s]; };
    function nearest(x, y, rad) { let best = null, bd = rad; for (const g of S.grots) { const d = Math.hypot(g.x - x, g.y - 5 - y); if (d < bd) { bd = d; best = g; } } return best; }
    G.on(cv, 'pointermove', ev => { if (!S) return; const [x, y] = toLevel(ev); S.hover = nearest(x, y, ev.pointerType === 'mouse' ? 9 : 14); });
    G.on(cv, 'pointerdown', ev => {
      ev.preventDefault(); G.focus();
      if (!S) return;
      if (S.state === 'intro') { start(); return; }
      if (S.state === 'end') { if (S.over.ok && S.lvl < LEVELS.length - 1) loadLevel(S.lvl + 1); else if (!S.over.ok) loadLevel(S.lvl); return; }
      if (S.paused) return;
      const [x, y] = toLevel(ev); const g = nearest(x, y, ev.pointerType === 'mouse' ? 9 : 16); S.hover = g; if (g) assign(g);
    });
    G.on(cv, 'contextmenu', ev => ev.preventDefault());
    G.keys = {
      down(ev) {
        const k = ev.key;
        if (!S) return false;
        if (S.state === 'intro' && !/^F\d/.test(k)) { start(); return true; }
        if (k === 'p' || k === 'P' || k === 'F3') { togglePause(); return true; }
        const n = +k; if (n >= 1 && n <= 5) { selectSkill(SKILLS[n - 1][0]); return true; }
        if (k === 'f' || k === 'F') { S.fast = !S.fast; updateBar(); return true; }
        if (k === '+' || k === '=') { setRate(S.rate + 5); return true; }
        if (k === '-' || k === '_') { setRate(S.rate - 5); return true; }
        if (k === 'n' || k === 'N') { nuke(); return true; }
        return false;
      },
    };
    function togglePause(on) { if (!S || S.state !== 'play') return; S.paused = on == null ? !S.paused : on; updateBar(); }
    G.onActive = a => { if (!a && S && S.state === 'play' && !S.paused) togglePause(true); };
    function setRate(r) { S.rate = clamp(r, S.minRate, 99); updateBar(); }
    function selectSkill(k) { if (!S.skills.hasOwnProperty(k)) return; S.sel = k; G.sfx('click'); updateBar(); }

    // ---------------------------------------------------------------- the skill bar
    function icon(kind) {
      const c = document.createElement('canvas'); c.width = 16; c.height = 16; const x = c.getContext('2d'), p = (a, b, cw, ch, col) => { x.fillStyle = col; x.fillRect(a, b, cw, ch); };
      p(6, 1, 4, 2, '#ffd400'); p(5, 3, 6, 1, '#c89a00'); p(6, 4, 4, 3, '#f4c8a0'); p(7, 5, 1, 1, '#000'); p(9, 5, 1, 1, '#000'); p(6, 7, 4, 5, BL); p(6, 12, 1, 3, '#1a7a2a'); p(9, 12, 1, 3, '#1a7a2a');
      if (kind === 'block') { p(2, 8, 4, 1, BL); p(10, 8, 4, 1, BL); p(1, 8, 1, 1, '#f4c8a0'); p(14, 8, 1, 1, '#f4c8a0'); }
      if (kind === 'build') { p(1, 14, 5, 2, '#c08040'); p(4, 12, 5, 2, '#c08040'); }
      if (kind === 'bash') { p(10, 8, 4, 2, BL); p(13, 8, 1, 2, '#f4c8a0'); p(14, 5, 2, 10, '#8a5a20'); }
      if (kind === 'dig') { p(3, 13, 10, 2, '#c0c0c0'); p(2, 15, 12, 1, '#8a5a20'); }
      if (kind === 'float') { p(2, 0, 12, 2, '#e10600'); p(7, 2, 1, 3, '#333'); }
      if (kind === 'nuke') { x.clearRect(0, 0, 16, 16); p(3, 2, 10, 5, '#ff8a00'); p(2, 4, 12, 2, '#ffd400'); p(6, 7, 4, 6, '#ff8a00'); p(3, 13, 10, 2, '#e10600'); }
      if (kind === 'pause') { x.clearRect(0, 0, 16, 16); p(4, 3, 3, 10, '#000'); p(9, 3, 3, 10, '#000'); }
      if (kind === 'ff') { x.clearRect(0, 0, 16, 16); x.fillStyle = '#000'; x.beginPath(); x.moveTo(2, 3); x.lineTo(8, 8); x.lineTo(2, 13); x.moveTo(8, 3); x.lineTo(14, 8); x.lineTo(8, 13); x.fill(); }
      return c;
    }
    const btns = {};
    function buildBar() {
      bar.innerHTML = '';
      const mk = (id, label, ic, fn, title) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.title = title || label; if (ic) b.appendChild(icon(ic)); const t = document.createElement('span'); t.textContent = label; b.appendChild(t); const v = document.createElement('b'); b.appendChild(v); b.addEventListener('click', () => { fn(); G.focus(); }); bar.appendChild(b); btns[id] = { b, v }; return b; };
      mk('rdown', 'Rate -', null, () => setRate(S.rate - 5), 'Slower release (-)');
      mk('rup', 'Rate +', null, () => setRate(S.rate + 5), 'Faster release (+)');
      SKILLS.forEach(([k, n], i) => mk(k, n, k, () => selectSkill(k), `${n} (${i + 1})`));
      mk('pause', 'Pause', 'pause', () => togglePause(), 'Pause (P)');
      mk('ff', 'Fast', 'ff', () => { S.fast = !S.fast; updateBar(); }, 'Fast forward (F)');
      mk('nuke', 'Nuke', 'nuke', nuke, 'Armageddon (press twice)');
      updateBar();
    }
    function updateBar() {
      if (!S) return;
      btns.rdown.v.textContent = btns.rup.v.textContent = String(S.rate);
      for (const [k] of SKILLS) { const n = S.skills[k] || 0; btns[k].v.textContent = String(n); btns[k].b.classList.toggle('on', S.sel === k); btns[k].b.disabled = !L.skills[k]; }
      btns.pause.b.classList.toggle('on', !!S.paused); btns.ff.b.classList.toggle('on', !!S.fast);
      btns.pause.v.textContent = btns.ff.v.textContent = btns.nuke.v.textContent = '';
    }

    G.loop(dt => {
      if (!S) return;
      if (sayT > 0) sayT -= dt;
      if (S.state === 'play' && !S.paused) { acc += dt * (S.fast ? 3 : 1); let n = 0; while (acc >= 1 / TPS && n++ < 12) { acc -= 1 / TPS; tick(); if (S.state !== 'play') break; } } else acc = 0;
      draw();
    });

    // ---------------------------------------------------------------- menus
    G.newGame = () => { loadLevel(S ? S.lvl : 0); G.focus(); };
    G.helpKey = () => help();
    function help() {
      G.help([
        ['How to Play', 'Jacklings drop out of the hatch and walk. They walk off cliffs. They walk into goo pits. They are not clever.\n\nGet enough of them into the hut with the torches before the time runs out. Pick a job on the bar at the bottom, then click a Jackling to give it that job.'],
        ['The Jobs', '- Blocker: stands still with arms out. Others turn round when they reach it.\n- Builder: lays twelve bricks in a staircase going up.\n- Basher: punches sideways through earth.\n- Digger: digs straight down.\n- Brolly: opens an umbrella when falling, so long drops don\'t hurt.\n\nNothing gets through steel (the grey stuff with rivets).'],
        ['Keys', '- 1 to 5: pick a job\n- + and -: release rate\n- F: fast forward\n- P or F3: pause\n- N twice: Nuke (oh no!)\n- F2: restart the level'],
      ]);
    }
    G.menu([
      ['Game', () => [
        { label: 'Restart Level', key: 'F2', act: G.newGame },
        { label: 'Pause', key: 'P', chk: S && S.paused, act: () => togglePause() }, '-',
        { label: 'Level', sub: LEVELS.map((l, i) => ({ label: `${i + 1}. ${l.name}${prog.done.includes(i) ? '  ✔' : ''}`, dis: i > 0 && !prog.done.includes(i - 1) && !prog.done.includes(i), rad: S && S.lvl === i, act: () => loadLevel(i) })) }, '-',
        { label: 'Exit', act: () => w.close() },
      ]],
      ['Options', () => [
        { label: 'Fast Forward', key: 'F', chk: S && S.fast, act: () => { S.fast = !S.fast; updateBar(); } },
        { label: 'Nuke Them All...', act: () => { if (S && S.state === 'play') { S.nukeArm = performance.now(); nuke(); } } },
      ]],
      ['Help', () => [
        { label: 'Help Topics', key: 'F1', act: help }, '-',
        { label: 'About Jacklings', act: () => G.about({ ver: 'Version 0.9 (Halloween 1999)', blurb: 'Save the Jacklings! (They would not need saving if they looked where they were going.)', credits: [['Level design', 'Jack'], ['Programming', 'Jack'], ['Jackling voices', 'Gubbinz'], ['"Oh no!"', 'Dave'], ['Brolly idea', 'Mom (it was raining)'], ['Goo pits', Cast.t('Cousin {cousin}')], ['Jacklings harmed', 'Loads, sorry']] }) },
      ]],
    ]);
    G.dbg = () => ({ lvl: S.lvl, state: S.state, out: S.out, alive: S.grots.length, saved: S.saved, dead: S.dead, time: S.time, grots: S.grots.map(g => [g.x | 0, g.y | 0, g.st]) });
    G.test = { assignAt: (i, sk) => { S.sel = sk; assign(S.grots[i]); }, start, load: loadLevel, fast: v => { S.fast = v; } };
    // saved game (js/gamesave.js): the level you were on, and mid-level the exact dug-up terrain (run-length packed) and
    // every Jackling, carries on paused after a refresh or a closed window. (Which levels are done is kept in 'prog'.)
    const packMask = () => { const out = []; let v = mask[0], n = 0; for (let i = 0; i < mask.length; i++) { if (mask[i] === v) n++; else { out.push(v, n); v = mask[i]; n = 1; } } out.push(v, n); return out.join(','); };
    const unpackMask = str => {
      const a = String(str || '').split(',').map(Number); let tot = 0;
      for (let k = 0; k + 1 < a.length; k += 2) { if (!(a[k] >= 0 && a[k] <= 3 && a[k + 1] > 0)) return false; tot += a[k + 1]; }
      if (tot !== mask.length) return false;
      let i = 0; for (let k = 0; k + 1 < a.length; k += 2) { mask.fill(a[k], i, i + a[k + 1]); i += a[k + 1]; }
      return true;
    };
    const sv = G.saver(() => {
      if (!S) return undefined;
      if (S.state === 'end') return null;
      if (S.state !== 'play') return { lvl: S.lvl };
      return { lvl: S.lvl, mask: packMask(), S: Object.assign({}, S, { paused: true, hover: null, nukeArm: 0 }) };
    }, { v: 1, live: true, every: 5000 });
    const resume = d => {
      if (!d || !LEVELS[d.lvl]) return false;
      loadLevel(d.lvl);
      if (d.S && d.S.lvl === d.lvl && Array.isArray(d.S.grots) && unpackMask(d.mask)) {
        for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) colour(x, y);
        tctx.putImageData(timg, 0, 0);
        S = Object.assign({}, d.S, { paused: true, hover: null, nukeArm: 0, fx: [] });
        buildBar(); G.status(`Level ${S.lvl + 1}: ${L.name} (carried on from your saved game)`);
      }
      return true;
    };
    const first = LEVELS.findIndex((l, i) => !prog.done.includes(i));
    if (!resume(sv.load())) loadLevel(first < 0 ? 0 : first);
  });
})();

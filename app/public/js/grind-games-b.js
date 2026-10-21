/* grind-games-b: three Odd Jobz for the neighbours, as mini-games for the Pocket Money runner (js/grind-jobs.js).
 *   paper  Paper Round: ride down Acacia Avenue throwing papers to the houses that ordered one (yellow mat, flag up).
 *   mow    Mow the Lawn: Mr Grimsdale's lawn. Stripes please. Not the tulips. NOT Gerald the gnome.
 *   dog    Walk the Dog: Biscuit pulls towards cats, puddles and lampposts. Steer, tug the lead, let him eat the treats. */
(function () {
  'use strict';
  if (!window.GrindJobs) return;
  const W = 480, H = 320, TAU = Math.PI * 2;
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const txt = (g, s, x, y, size, col) => { g.font = `bold ${size}px Verdana,Arial,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = Math.max(2, size / 5); g.strokeStyle = '#000'; g.lineJoin = 'round'; g.strokeText(s, x, y); g.fillStyle = col || '#fff'; g.fillText(s, x, y); g.textAlign = 'left'; };
  const cartoon = (g, s, x, y, size, col) => { g.font = `bold ${size}px 'Comic Sans MS','Chalkboard SE','Marker Felt',cursive`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = '#000'; g.lineJoin = 'round'; g.strokeText(s, x, y); g.fillStyle = col || '#ffd400'; g.fillText(s, x, y); g.textAlign = 'left'; };
  const Msgs = () => { const L = []; return { add(s, x, y, col, size) { L.push({ s, x, y, col, size: size || 18, t: 0 }); }, step(dt) { for (const m of L) { m.t += dt; m.y -= 24 * dt; } while (L.length && L[0].t > 1.2) L.shift(); }, draw(g) { for (const m of L) { g.globalAlpha = Math.max(0, 1 - m.t / 1.2); cartoon(g, m.s, m.x, m.y, m.size, m.col); } g.globalAlpha = 1; } }; };
  const button = (g, x, y, w, h, label, on) => { g.fillStyle = on ? 'rgba(255,212,0,.9)' : 'rgba(0,0,0,.45)'; rr(g, x, y, w, h, 8); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); txt(g, label, x + w / 2, y + h / 2, 13, on ? '#000' : '#fff'); };

  // ====================================================================================== PAPER ROUND
  GrindJobs.game('paper', api => {
    const DOOR_Y = 196, RIDE_Y = 244, JX = 120, HOUSE_W = 140;
    const COLS = [['#b8503a', '#8a3020'], ['#f0e0b8', '#c0a878'], ['#c8c8c0', '#909088'], ['#d89a6a', '#a0683a'], ['#e8d0d8', '#b098a8']];
    const DOORS = ['#e10600', '#0050c0', '#1a7a2a', '#000', '#ffd400', '#7a2a8a'];
    let x = 0, v = 100, houses = [], obs = [], bundles = [], papers = [], bag = 12, score = 0, hop = 0, crash = 0, t = 0, msgs = Msgs(), delivered = 0, wheel = 0, num = 2, btnT = 0, btnH = 0;
    function addHouse(wx) {
      const sub = Math.random() < 0.56, c = COLS[Math.floor(Math.random() * COLS.length)];
      houses.push({ wx, sub, done: false, c, door: DOORS[Math.floor(Math.random() * DOORS.length)], no: num, hedge: Math.random() < 0.5, roof: Math.random() < 0.5 ? '#4a4a5a' : '#6a3a2a', win: Math.random() < 0.5 });
      num += 2;
    }
    function build(to) {
      while (!houses.length || houses[houses.length - 1].wx < to) addHouse(houses.length ? houses[houses.length - 1].wx + HOUSE_W : 200);
      while (!obs.length || obs[obs.length - 1].wx < to) { const last = obs.length ? obs[obs.length - 1].wx : 500; obs.push({ wx: last + 260 + Math.random() * 300, k: ['bin', 'bin', 'cat', 'cone', 'puddle'][Math.floor(Math.random() * 5)], hit: false }); }
      while (!bundles.length || bundles[bundles.length - 1].wx < to) { const last = bundles.length ? bundles[bundles.length - 1].wx : 400; bundles.push({ wx: last + 1100 + Math.random() * 500, got: false }); }
    }
    build(W + 400);
    function throwIt() { if (crash > 0) return; if (bag <= 0) { msgs.add('Out of papers!', JX, 200, '#ff8080', 14); api.note(200, 0.08); return; } bag--; btnT = 0.15; papers.push({ wx: x + JX, y: RIDE_Y - 18, t: 0, x0: x + JX }); api.note(600, 0.05, 'triangle'); }
    function doHop() { if (hop > 0 || crash > 0) return; hop = 0.6; btnH = 0.15; api.note(440, 0.06, 'square'); setTimeout(() => api.note(660, 0.05, 'square'), 60); }
    function step(dt) {
      t += dt; msgs.step(dt); btnT -= dt; btnH -= dt;
      if (crash > 0) { crash -= dt; } else { v = Math.min(140, 100 + t * 0.6); x += v * dt; wheel += v * dt / 14; }
      if (hop > 0) hop = Math.max(0, hop - dt);
      build(x + W + 300);
      // papers in flight: a 0.6 s arc that lands 60 px ahead on the doorstep line
      for (const p of papers) {
        p.t += dt; const k = Math.min(1, p.t / 0.6); p.wx = p.x0 + 60 * k; p.y = (RIDE_Y - 18) + (DOOR_Y - (RIDE_Y - 18)) * k - Math.sin(k * Math.PI) * 70;
        if (k >= 1 && !p.done) {
          p.done = true;
          const h = houses.find(hh => Math.abs(hh.wx + 44 - p.wx) < 26);
          if (h && h.sub && !h.done) { h.done = true; delivered++; const perfect = Math.abs(h.wx + 44 - p.wx) < 10; score += perfect ? 15 : 10; msgs.add(perfect ? 'ON THE MAT! +15' : 'Delivered! +10', p.wx - x, DOOR_Y - 30, perfect ? '#ffd400' : '#9fffa0', 15); api.note(perfect ? 1568 : 1175, 0.08, 'triangle'); }
          else if (h && !h.sub) { score = Math.max(0, score - 5); msgs.add("I didn't order that! -5", p.wx - x, DOOR_Y - 30, '#ff8080', 13); api.sfx('uhoh'); }
          else if (h && h.done) msgs.add('Already got one!', p.wx - x, DOOR_Y - 30, '#fff', 12);
          else msgs.add('In the hedge!', p.wx - x, DOOR_Y - 26, '#ccc', 12);
        }
      }
      papers = papers.filter(p => p.t < 1.6);
      // obstacles and bundles
      for (const o of obs) {
        const sx = o.wx - x;
        if (!o.hit && Math.abs(sx - JX) < 18 && (hop <= 0.12 || hop >= 0.5)) { o.hit = true; if (o.k === 'puddle') { score = Math.max(0, score - 3); msgs.add('SPLOSH! -3', JX, 200, '#9ad0ff', 14); api.note(300, 0.1, 'sine'); } else { crash = 1.3; score = Math.max(0, score - 10); msgs.add(o.k === 'cat' ? 'MEOWWW! -10' : 'CRASH! -10', JX, 196, '#ff6060', 18); api.sfx('thud'); } }
      }
      for (const b of bundles) if (!b.got && Math.abs(b.wx - x - JX) < 20) { b.got = true; bag = Math.min(20, bag + 8); msgs.add('+8 papers!', JX, 210, '#ffd400', 14); api.note(988, 0.08, 'triangle'); }
      while (houses.length && houses[0].wx - x < -HOUSE_W - 20) houses.shift();
      while (obs.length && obs[0].wx - x < -60) obs.shift();
      while (bundles.length && bundles[0].wx - x < -60) bundles.shift();
    }
    function drawHouse(g, h) {
      const sx = Math.round(h.wx - x);
      g.fillStyle = h.c[0]; g.fillRect(sx, 70, HOUSE_W - 4, 130);
      if (h.c[0] === '#b8503a' || h.c[0] === '#d89a6a') { g.strokeStyle = h.c[1]; g.lineWidth = 1; for (let y = 74; y < 200; y += 8) { g.beginPath(); g.moveTo(sx, y); g.lineTo(sx + HOUSE_W - 4, y); g.stroke(); } }
      else { g.fillStyle = h.c[1]; for (let i = 0; i < 40; i++) g.fillRect(sx + (i * 37) % (HOUSE_W - 6), 72 + (i * 53) % 126, 2, 2); }
      g.fillStyle = h.roof; g.beginPath(); g.moveTo(sx - 6, 72); g.lineTo(sx + (HOUSE_W - 4) / 2, 30); g.lineTo(sx + HOUSE_W + 2, 72); g.fill();
      g.fillStyle = '#8a3020'; g.fillRect(sx + 96, 34, 14, 26); g.fillStyle = '#5a1a10'; g.fillRect(sx + 94, 32, 18, 4);
      // windows
      for (const [wx, wy] of [[14, 84], [80, 84], [80, 140]]) { g.fillStyle = '#fff'; g.fillRect(sx + wx, wy, 40, 34); g.fillStyle = h.win ? '#a8d8ff' : '#ffe8a0'; g.fillRect(sx + wx + 3, wy + 3, 34, 28); g.fillStyle = '#fff'; g.fillRect(sx + wx + 18, wy + 3, 3, 28); g.fillStyle = h.win ? '#e85a8a' : '#4a8a4a'; g.fillRect(sx + wx + 3, wy + 3, 7, 28); g.fillRect(sx + wx + 30, wy + 3, 7, 28); }
      // the door, number, mat and the "DAILY JACK" flag on subscribers
      g.fillStyle = '#fff'; g.fillRect(sx + 28, 134, 34, 64); g.fillStyle = h.door; g.fillRect(sx + 31, 137, 28, 61);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(sx + 34, 142, 22, 18); g.fillStyle = '#ffd400'; g.fillRect(sx + 52, 168, 4, 4); g.fillStyle = '#c8a000'; g.fillRect(sx + 37, 176, 16, 3);
      g.fillStyle = '#fff'; g.font = 'bold 9px Verdana'; g.textAlign = 'center'; g.fillText(String(h.no), sx + 45, 132); g.textAlign = 'left';
      g.fillStyle = '#a89878'; g.fillRect(sx + 26, 198, 38, 18);
      if (h.sub) {
        g.fillStyle = h.done ? '#8a8a8a' : '#ffd400'; g.fillRect(sx + 30, 196, 30, 6); g.strokeStyle = '#000'; g.lineWidth = 1; g.strokeRect(sx + 30.5, 196.5, 29, 5);
        g.fillStyle = '#555'; g.fillRect(sx + 66, 150, 3, 48);
        if (!h.done) { const f = Math.sin(t * 6 + h.no) * 2; g.fillStyle = '#e10600'; g.beginPath(); g.moveTo(sx + 69, 150); g.lineTo(sx + 92, 154 + f); g.lineTo(sx + 69, 160); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 6px Verdana'; g.fillText('PAPER', sx + 70, 156 + f / 2); }
        else { g.fillStyle = '#f4f4ec'; g.save(); g.translate(sx + 45, 194); g.rotate(-0.2); g.fillRect(-9, -4, 18, 8); g.strokeStyle = '#999'; g.strokeRect(-9, -4, 18, 8); g.restore(); txt(g, '✔', sx + 80, 160, 12, '#3ad03a'); }
      }
      // garden + hedge
      g.fillStyle = '#5aa83a'; g.fillRect(sx - 4, 200, 30, 16); g.fillRect(sx + 64, 200, HOUSE_W - 68, 16);
      if (h.hedge) { g.fillStyle = '#2a7a2a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(sx + 84 + i * 14, 204, 9, 0, TAU); g.fill(); } }
      else { g.fillStyle = '#fff'; for (let i = 0; i < 7; i++) g.fillRect(sx + 72 + i * 9, 198, 4, 18); g.fillRect(sx + 70, 202, 64, 3); }
    }
    function draw(g) {
      const sky = g.createLinearGradient(0, 0, 0, 200); sky.addColorStop(0, '#5aa0f0'); sky.addColorStop(1, '#d8f0ff'); g.fillStyle = sky; g.fillRect(0, 0, W, 220);
      g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { const cx = ((i * 190 - x * 0.2) % 700 + 700) % 700 - 80; g.beginPath(); g.arc(cx, 34 + i * 6, 12, 0, TAU); g.arc(cx + 16, 28 + i * 6, 15, 0, TAU); g.arc(cx + 32, 34 + i * 6, 10, 0, TAU); g.fill(); }
      for (const h of houses) drawHouse(g, h);
      // pavement, kerb, road
      g.fillStyle = '#b8b8b0'; g.fillRect(0, 216, W, 50); g.strokeStyle = '#9a9a92'; g.lineWidth = 1; for (let i = -1; i < 12; i++) { const px = Math.round(i * 50 - (x % 50)); g.beginPath(); g.moveTo(px, 216); g.lineTo(px, 266); g.stroke(); } g.beginPath(); g.moveTo(0, 241); g.lineTo(W, 241); g.stroke();
      g.fillStyle = '#d8d8d0'; g.fillRect(0, 264, W, 5); g.fillStyle = '#4a4a50'; g.fillRect(0, 269, W, 51); g.fillStyle = '#fff'; for (let i = -1; i < 10; i++) g.fillRect(Math.round(i * 80 - (x * 1) % 80), 296, 40, 4);
      // lampposts
      for (let i = -1; i < 4; i++) { const lx = Math.round(i * 230 - (x % 230)) + 180; g.fillStyle = '#3a3a40'; g.fillRect(lx, 120, 5, 100); g.fillRect(lx - 10, 118, 22, 5); g.fillStyle = '#ffe680'; g.fillRect(lx - 8, 123, 18, 5); }
      // bundles + obstacles
      for (const b of bundles) if (!b.got) { const sx = b.wx - x; g.fillStyle = '#f4f4ec'; g.strokeStyle = '#555'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.fillRect(sx - 12, 236 - i * 5, 24, 5); g.strokeRect(sx - 12, 236 - i * 5, 24, 5); } g.strokeStyle = '#e10600'; g.beginPath(); g.moveTo(sx, 226); g.lineTo(sx, 241); g.stroke(); }
      for (const o of obs) {
        const sx = o.wx - x, y = 250;
        if (o.k === 'bin') { g.fillStyle = o.hit ? '#555' : '#1a5a2a'; g.strokeStyle = '#000'; g.lineWidth = 1.5; rr(g, sx - 11, y - 30, 22, 32, 2); g.fill(); g.stroke(); g.fillStyle = '#2a7a3a'; rr(g, sx - 13, y - 34, 26, 6, 2); g.fill(); g.stroke(); g.fillStyle = '#111'; g.beginPath(); g.arc(sx - 8, y + 2, 3, 0, TAU); g.arc(sx + 8, y + 2, 3, 0, TAU); g.fill(); }
        else if (o.k === 'cone') { g.fillStyle = '#ff6a00'; g.strokeStyle = '#000'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(sx, y - 26); g.lineTo(sx + 10, y); g.lineTo(sx - 10, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(sx - 5, y - 14, 10, 4); g.fillStyle = '#ff6a00'; g.fillRect(sx - 13, y, 26, 4); }
        else if (o.k === 'cat') { const s = o.hit ? -1 : 1; g.fillStyle = '#ff9a2a'; g.strokeStyle = '#000'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(sx, y - 8, 12, 7, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(sx + 11 * s, y - 15, 6, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(sx + 8 * s, y - 20); g.lineTo(sx + 9 * s, y - 26); g.lineTo(sx + 12 * s, y - 21); g.moveTo(sx + 13 * s, y - 20); g.lineTo(sx + 15 * s, y - 26); g.lineTo(sx + 16 * s, y - 19); g.fill(); g.stroke(); g.strokeStyle = '#ff9a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx - 11 * s, y - 9); g.quadraticCurveTo(sx - 20 * s, y - 14 + Math.sin(t * 5) * 4, sx - 18 * s, y - 24); g.stroke(); g.fillStyle = '#000'; g.fillRect(sx + 12 * s - 1, y - 16, 2, 2); }
        else { g.fillStyle = 'rgba(90,150,220,.75)'; g.beginPath(); g.ellipse(sx, y - 2, 20, 5, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(sx - 4, y - 3, 8, 1.5, 0, 0, TAU); g.stroke(); }
      }
      // Jack on his bike
      const jy = RIDE_Y - (hop > 0 ? Math.sin((1 - hop / 0.6) * Math.PI) * 44 : 0) + (crash > 0 ? 6 : 0);
      g.save(); g.translate(JX, jy); if (crash > 0) g.rotate(Math.sin(crash * 20) * 0.25 + 0.3);
      for (const wx of [-16, 16]) { g.strokeStyle = '#111'; g.lineWidth = 3; g.beginPath(); g.arc(wx, 0, 11, 0, TAU); g.stroke(); g.lineWidth = 1; g.strokeStyle = '#888'; for (let i = 0; i < 4; i++) { const a = wheel + i * Math.PI / 4; g.beginPath(); g.moveTo(wx - Math.cos(a) * 10, -Math.sin(a) * 10); g.lineTo(wx + Math.cos(a) * 10, Math.sin(a) * 10); g.stroke(); } }
      g.strokeStyle = '#e10600'; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-16, 0); g.lineTo(-4, -14); g.lineTo(10, -14); g.lineTo(16, 0); g.moveTo(-4, -14); g.lineTo(0, 0); g.lineTo(10, -14); g.moveTo(10, -14); g.lineTo(12, -22); g.lineTo(18, -22); g.stroke();
      g.fillStyle = '#ffd400'; g.strokeStyle = '#6a4a00'; g.lineWidth = 1; g.fillRect(-20, -24, 14, 12); g.strokeRect(-20, -24, 14, 12);
      const pd = Math.sin(wheel) * 4; g.strokeStyle = '#1a2a6a'; g.lineWidth = 4; g.beginPath(); g.moveTo(-2, -30); g.lineTo(0 + pd, -12); g.moveTo(-2, -30); g.lineTo(2 - pd, -10); g.stroke();
      g.fillStyle = '#2a6ae0'; g.strokeStyle = '#000'; g.lineWidth = 1.2; rr(g, -8, -46, 14, 18, 4); g.fill(); g.stroke();
      g.strokeStyle = '#2a6ae0'; g.lineWidth = 4; g.beginPath(); g.moveTo(4, -42); g.lineTo(14, -24); g.stroke();
      g.fillStyle = '#ffd0a0'; g.beginPath(); g.arc(1, -53, 7, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#e10600'; g.beginPath(); g.arc(1, -55, 7, Math.PI, 0); g.fill(); g.fillRect(1, -56, 11, 3);
      g.restore();
      // papers in the air
      for (const p of papers) { const sx = p.wx - x; g.save(); g.translate(sx, p.y); g.rotate(p.t * (p.done ? 0 : 14)); g.fillStyle = '#f4f4ec'; g.strokeStyle = '#555'; g.lineWidth = 1; g.fillRect(-7, -3, 14, 6); g.strokeRect(-7, -3, 14, 6); g.restore(); }
      // the bag, the buttons
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 8, 24, 132, 18, 4); g.fill(); txt(g, `PAPERS: ${bag}`, 74, 33, 11, bag <= 2 ? '#ff8080' : '#fff');
      button(g, 10, 274, 96, 38, 'HOP', btnH > 0); button(g, 374, 274, 96, 38, 'THROW', btnT > 0);
      msgs.draw(g);
    }
    return {
      keys: '<b>Space</b> (or click the top of the picture, or <b>THROW</b>) throws a paper up the path. Throw just BEFORE the door: the paper lands a little way ahead. <b>Up arrow</b> (or <b>HOP</b>) jumps the bins, cones and cats. Yellow mat + red flag = they ordered a paper. Ride over the bundles for more papers.',
      start() {}, step, draw,
      down(px, py) { if (py > 268 && px < 120) doHop(); else if (py > 268 && px > 360) throwIt(); else if (py > 228) doHop(); else throwIt(); },
      key(k, d) { if (!d) return; if (k === 'Space' || k === 'x' || k === 'Enter' || k === 'ArrowRight') throwIt(); else if (k === 'ArrowUp' || k === 'w' || k === 'z') doHop(); },
      score: () => score, hud: () => `${score} points  (${delivered} delivered)`,
      get houses() { return houses; }, get obs() { return obs; }, get x() { return x; }, JX,
    };
  });

  // ====================================================================================== MOW THE LAWN
  GrindJobs.game('mow', api => {
    const CS = 8, GW = W / CS, GH = H / CS, TOP = 40;
    const cut = new Uint8Array(GW * GH), bed = new Uint8Array(GW * GH);
    const lawn = document.createElement('canvas'); lawn.width = W; lawn.height = H; const L = lawn.getContext('2d');
    let mx = 40, my = 290, ang = -Math.PI / 2, held = null, keys = {}, t = 0, msgs = Msgs(), squash = 0, gnomeHits = 0, stall = 0, cuttable = 0, cutN = 0, clippings = [], snd = 0;
    const tree = { x: 360, y: 120, r: 24 };
    const gnome = { x: 0, y: 0, down: 0 };
    const beds = [];
    function setup() {
      // stripes of long grass
      L.fillStyle = '#3a8a2a'; L.fillRect(0, 0, W, H);
      for (let i = 0; i < 2600; i++) { const x = Math.random() * W, y = TOP + Math.random() * (H - TOP); L.strokeStyle = Math.random() < 0.5 ? '#2a7a1a' : '#4aa03a'; L.lineWidth = 1; L.beginPath(); L.moveTo(x, y); L.lineTo(x + (Math.random() - 0.5) * 3, y - 3 - Math.random() * 4); L.stroke(); }
      // two flowerbeds (random-ish places) and Gerald
      const spots = [[60 + Math.random() * 80, 110 + Math.random() * 40, 90, 34], [220 + Math.random() * 60, 230 + Math.random() * 30, 100, 30]];
      for (const [x, y, w, h] of spots) beds.push({ x, y, w, h });
      for (const b of beds) for (let gy = Math.floor(b.y / CS); gy < Math.ceil((b.y + b.h) / CS); gy++) for (let gx = Math.floor(b.x / CS); gx < Math.ceil((b.x + b.w) / CS); gx++) if (gx >= 0 && gx < GW && gy >= 0 && gy < GH) bed[gy * GW + gx] = 1;
      do { gnome.x = 60 + Math.random() * 380; gnome.y = 90 + Math.random() * 200; } while (beds.some(b => gnome.x > b.x - 24 && gnome.x < b.x + b.w + 24 && gnome.y > b.y - 30 && gnome.y < b.y + b.h + 24) || Math.hypot(gnome.x - tree.x, gnome.y - tree.y) < 60 || Math.hypot(gnome.x - 40, gnome.y - 290) < 80);
      for (let gy = Math.ceil(TOP / CS); gy < GH; gy++) for (let gx = 0; gx < GW; gx++) { const cx = gx * CS + 4, cy = gy * CS + 4; if (bed[gy * GW + gx] || Math.hypot(cx - tree.x, cy - tree.y) < tree.r + 2 || Math.hypot(cx - gnome.x, cy - gnome.y) < 12) continue; cuttable++; }
    }
    function mowAt(x, y, dir) {
      const r = 15, light = Math.cos(dir) > 0 || (Math.abs(Math.cos(dir)) < 0.3 && Math.sin(dir) > 0);
      for (let gy = Math.floor((y - r) / CS); gy <= Math.floor((y + r) / CS); gy++) for (let gx = Math.floor((x - r) / CS); gx <= Math.floor((x + r) / CS); gx++) {
        if (gx < 0 || gy < Math.ceil(TOP / CS) || gx >= GW || gy >= GH) continue;
        const cx = gx * CS + 4, cy = gy * CS + 4; if (Math.hypot(cx - x, cy - y) > r) continue;
        const i = gy * GW + gx;
        if (bed[i]) { if (bed[i] === 1) { bed[i] = 2; squash++; if (squash % 6 === 1) { msgs.add(api.pick(['MY TULIPS!', 'Not the flowers!', 'Oi! The roses!']), cx, cy - 12, '#ff8080', 14); api.sfx('uhoh'); } } continue; }
        if (Math.hypot(cx - tree.x, cy - tree.y) < tree.r + 2 || Math.hypot(cx - gnome.x, cy - gnome.y) < 12) continue;
        if (!cut[i]) { cut[i] = 1; cutN++; if (Math.random() < 0.3) clippings.push({ x: cx, y: cy, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, t: 0 }); }
        L.fillStyle = light ? '#7acc52' : '#5ab03a'; L.fillRect(gx * CS, gy * CS, CS, CS);
        L.fillStyle = light ? '#86d85e' : '#4ea232'; L.fillRect(gx * CS + 2, gy * CS + 3, 1, 1); L.fillRect(gx * CS + 6, gy * CS + 6, 1, 1);
      }
    }
    function step(dt) {
      t += dt; msgs.step(dt);
      for (const c of clippings) { c.t += dt; c.vy += 200 * dt; c.x += c.vx * dt; c.y += c.vy * dt; } while (clippings.length && clippings[0].t > 0.6) clippings.shift(); if (clippings.length > 120) clippings.splice(0, 40);
      if (gnome.down > 0) gnome.down = Math.max(0.01, gnome.down);
      if (stall > 0) { stall -= dt; return; }
      let go = 0, turn = 0;
      if (held) { const want = Math.atan2(held[1] - my, held[0] - mx), d = Math.hypot(held[0] - mx, held[1] - my); let da = ((want - ang + Math.PI * 3) % TAU) - Math.PI; turn = Math.max(-1, Math.min(1, da * 3)); go = d > 10 ? 1 : 0; }
      if (keys.ArrowLeft || keys.a) turn = -1; if (keys.ArrowRight || keys.d) turn = 1; if (keys.ArrowUp || keys.w) go = 1; if (keys.ArrowDown || keys.s) go = -0.5;
      ang += turn * 3.4 * dt;
      if (go) {
        const sp = 118 * go, nx = mx + Math.cos(ang) * sp * dt, ny = my + Math.sin(ang) * sp * dt;
        const blocked = Math.hypot(nx - tree.x, ny - tree.y) < tree.r + 12 || nx < 12 || nx > W - 12 || ny < TOP + 10 || ny > H - 10;
        if (!blocked) { mx = nx; my = ny; } else { msgs.add('Bump!', mx, my - 18, '#fff', 12); ang += Math.PI * 0.5 * (Math.random() < 0.5 ? 1 : -1) * dt * 4; }
        mowAt(mx + Math.cos(ang) * 6, my + Math.sin(ang) * 6, ang);
        snd -= dt; if (snd <= 0) { snd = 0.12; api.note(90 + Math.random() * 20, 0.1, 'sawtooth'); }
        if (!gnome.down && Math.hypot(mx - gnome.x, my - gnome.y) < 18) { gnome.down = 1; gnomeHits++; stall = 1.2; msgs.add('NOT GERALD!!', gnome.x, gnome.y - 24, '#ff6060', 20); api.sfx('thud'); }
      }
    }
    function draw(g) {
      g.drawImage(lawn, 0, 0);
      // the patio and the back of the house
      g.fillStyle = '#d8c8a8'; g.fillRect(0, 0, W, TOP); g.strokeStyle = '#b8a888'; g.lineWidth = 1; for (let x = 0; x < W; x += 30) { g.beginPath(); g.moveTo(x, 16); g.lineTo(x, TOP); g.stroke(); }
      g.fillStyle = '#fff'; g.fillRect(380, 16, 44, 20); g.fillStyle = '#c8402a'; g.fillRect(380, 16, 44, 6); txt(g, 'Mr G', 402, 30, 8, '#c8402a');
      // flowerbeds
      for (const b of beds) {
        g.fillStyle = '#6a4a2a'; rr(g, b.x, b.y, b.w, b.h, 6); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.5; g.stroke();
        for (let gy = Math.floor(b.y / CS); gy < Math.ceil((b.y + b.h) / CS); gy++) for (let gx = Math.floor(b.x / CS); gx < Math.ceil((b.x + b.w) / CS); gx++) {
          const i = gy * GW + gx; if (!bed[i]) continue; const cx = gx * CS + 4, cy = gy * CS + 4;
          if ((gx + gy) % 2) continue;
          if (bed[i] === 2) { g.fillStyle = '#5a3a1a'; g.fillRect(cx - 3, cy, 6, 2); continue; }
          g.strokeStyle = '#2a7a1a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy + 4); g.lineTo(cx, cy - 1); g.stroke();
          g.fillStyle = ['#ff3a6a', '#ffd400', '#ff8a00', '#c040ff'][(gx * 3 + gy) % 4]; g.beginPath(); g.arc(cx, cy - 2, 3, 0, TAU); g.fill(); g.fillStyle = '#fff6a0'; g.fillRect(cx - 0.5, cy - 2.5, 1, 1);
        }
      }
      // the tree (from above)
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(tree.x + 6, tree.y + 8, tree.r + 4, 0, TAU); g.fill();
      g.fillStyle = '#1a6a1a'; g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; g.arc(tree.x + Math.cos(a) * 14, tree.y + Math.sin(a) * 14, 14, 0, TAU); } g.fill(); g.fillStyle = '#2a8a2a'; g.beginPath(); g.arc(tree.x - 6, tree.y - 6, 12, 0, TAU); g.fill();
      // Gerald
      g.save(); g.translate(gnome.x, gnome.y); if (gnome.down) g.rotate(1.4);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(2, 10, 9, 3, 0, 0, TAU); g.fill();
      g.fillStyle = '#2a5ae0'; g.strokeStyle = '#000'; g.lineWidth = 1; rr(g, -6, -2, 12, 12, 3); g.fill(); g.stroke();
      g.fillStyle = '#ffd0a0'; g.beginPath(); g.arc(0, -6, 5, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-5, -4); g.quadraticCurveTo(0, 6, 5, -4); g.fill();
      g.fillStyle = '#e10600'; g.beginPath(); g.moveTo(-6, -9); g.lineTo(0, -24); g.lineTo(6, -9); g.closePath(); g.fill(); g.stroke(); g.restore();
      for (const c of clippings) { g.fillStyle = '#9ae070'; g.fillRect(c.x, c.y, 2, 2); }
      // the mower (top-down) + Jack pushing it
      g.save(); g.translate(mx, my); g.rotate(ang);
      g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, -12, -11, 26, 24, 4); g.fill();
      g.fillStyle = '#e10600'; g.strokeStyle = '#300'; g.lineWidth = 1.5; rr(g, -12, -12, 24, 24, 4); g.fill(); g.stroke();
      g.fillStyle = '#ff5a4a'; rr(g, -8, -8, 14, 16, 3); g.fill(); g.fillStyle = '#222'; g.fillRect(-12, -14, 8, 4); g.fillRect(4, -14, 8, 4); g.fillRect(-12, 10, 8, 4); g.fillRect(4, 10, 8, 4);
      g.strokeStyle = '#444'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-12, -8); g.lineTo(-30, -8); g.moveTo(-12, 8); g.lineTo(-30, 8); g.moveTo(-30, -9); g.lineTo(-30, 9); g.stroke();
      g.fillStyle = '#2a6ae0'; g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath(); g.ellipse(-38, 0, 7, 11, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#e10600'; g.beginPath(); g.arc(-38, 0, 6, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#c00'; g.fillRect(-33, -3, 5, 6);
      g.restore();
      if (stall > 0) txt(g, 'stalled...', mx, my + 26, 10, '#fff');
      // target marker
      if (held) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.5; g.beginPath(); g.arc(held[0], held[1], 6, 0, TAU); g.stroke(); }
      const pc = Math.round(cutN / Math.max(1, cuttable) * 100);
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 8, 20, 150, 18, 4); g.fill(); g.fillStyle = '#3ad03a'; rr(g, 10, 22, 146 * pc / 100, 14, 3); g.fill(); txt(g, `MOWN: ${pc}%`, 83, 29, 10, '#fff');
      msgs.draw(g);
    }
    setup(); // straight away, so the title screen shows the lawn
    const score = () => Math.max(0, Math.min(100, Math.round(cutN / Math.max(1, cuttable) * 100) - Math.floor(squash / 2) - gnomeHits * 8));
    return {
      keys: '<b>Hold the mouse button down</b> where you want the mower to go (it follows the pointer), or steer with the <b>arrow keys</b> (Up = go, Left/Right = turn). Mow every bit of grass. Keep off the <b>flowerbeds</b>, and mind <b>Gerald</b> the gnome.',
      start() { mowAt(mx, my, ang); }, step, draw,
      down(x, y) { held = [x, y]; }, move(x, y, h) { if (h) held = [x, y]; }, up() { held = null; },
      key(k, d) { keys[k] = d; },
      score, get over() { return cutN >= cuttable; },
      hud: () => `Score: ${score()}`,
      get pos() { return [mx, my]; }, beds, gnome, tree,
    };
  });

  // ====================================================================================== WALK THE DOG
  GrindJobs.game('dog', api => {
    const JY = 250, LEAD = 78;
    let jx = 240, tx = 240, keys = {}, dog = { x: 240, y: 190, vx: 0, vy: 0, heel: 0, wag: 0, muddy: 0 }, dist = 0, things = [], spawnY = 0, score = 0, treats = 0, t = 0, msgs = Msgs(), tangle = 0, tugCd = 0, scroll = 0, splash = [];
    function spawn() { // a new row of stuff, above the top of the screen
      spawnY -= 70 + Math.random() * 50;
      const r = Math.random(), x = 120 + Math.random() * 240;
      const k = r < 0.26 ? 'treat' : r < 0.46 ? 'lamp' : r < 0.64 ? 'puddle' : r < 0.78 ? 'cat' : r < 0.88 ? 'bin' : 'treat';
      things.push({ k, x: k === 'lamp' ? (Math.random() < 0.5 ? 140 : 340) + (Math.random() - 0.5) * 30 : x, y: spawnY, done: false, run: 0 });
    }
    function tug() { if (tugCd > 0 || tangle > 0) return; tugCd = 1; dog.heel = 1.1; const dx = jx - dog.x, dy = JY - 30 - dog.y; dog.vx += dx * 3; dog.vy += dy * 3; msgs.add('HEEL!', jx, JY - 40, '#fff', 14); api.note(330, 0.06, 'square'); }
    function step(dt) {
      t += dt; msgs.step(dt); tugCd -= dt; dog.wag += dt * 12;
      for (const s of splash) s.t += dt; while (splash.length && splash[0].t > 0.6) splash.shift();
      if (tangle > 0) { tangle -= dt; return; }
      const sp = 72; scroll += sp * dt; dist += sp * dt; score += sp * dt / 20;
      while (spawnY + scroll > -80) spawn();
      // Jack: follows the pointer or the arrow keys
      if (keys.ArrowLeft || keys.a) tx = jx - 160 * dt * 2; if (keys.ArrowRight || keys.d) tx = jx + 160 * dt * 2;
      tx = Math.max(110, Math.min(370, tx)); jx += (tx - jx) * Math.min(1, dt * 8);
      // the dog's nose: what's interesting just ahead?
      let goal = { x: jx + Math.sin(t * 0.8) * 50, y: JY - 62 }, pull = 2.2;
      if (dog.heel <= 0) {
        let best = null, bd = 1e9;
        for (const o of things) { if (o.done && o.k !== 'lamp') continue; const sy = o.y + scroll; if (sy > JY - 10 || sy < 30) continue; const d = Math.hypot(o.x - dog.x, sy - dog.y); const want = o.k === 'cat' ? 0.55 : o.k === 'treat' ? 0.85 : o.k === 'lamp' ? 1.2 : o.k === 'puddle' ? 1.1 : 3; if (d * want < bd && d < 170) { bd = d * want; best = o; } }
        if (best) { goal = { x: best.x, y: best.y + scroll }; pull = best.k === 'cat' ? 5.5 : 3; }
      } else dog.heel -= dt;
      dog.vx += (goal.x - dog.x) * pull * dt; dog.vy += (goal.y - dog.y) * pull * dt;
      dog.vx *= Math.pow(0.08, dt); dog.vy *= Math.pow(0.08, dt);
      dog.x += dog.vx * dt; dog.y += dog.vy * dt;
      // the lead: the dog can't go further than LEAD from Jack's hand; if he pulls hard, Jack gets dragged a bit
      const hx = jx + 8, hy = JY - 12, dx = dog.x - hx, dy = dog.y - hy, d = Math.hypot(dx, dy);
      if (d > LEAD) { const k = (d - LEAD) / d; dog.x -= dx * k * 0.85; dog.y -= dy * k * 0.85; tx += dx * k * 0.6; jx += dx * k * 0.15; dog.vx *= 0.6; dog.vy *= 0.6; }
      dog.x = Math.max(70, Math.min(410, dog.x)); dog.y = Math.max(40, Math.min(JY + 30, dog.y));
      // what happened?
      for (const o of things) {
        const sy = o.y + scroll;
        if (o.k === 'treat' && !o.done && Math.hypot(o.x - dog.x, sy - dog.y) < 18) { o.done = true; treats++; score += 15; msgs.add('CRUNCH! +15', o.x, sy - 16, '#ffd400', 15); api.note(784, 0.06, 'triangle'); setTimeout(() => api.note(988, 0.06, 'triangle'), 70); }
        if (o.k === 'puddle' && !o.done) {
          if (Math.abs(o.x - jx) < 26 && Math.abs(sy - JY) < 12) { o.done = true; score = Math.max(0, score - 10); msgs.add('SPLASH! Wet socks -10', jx, JY - 40, '#9ad0ff', 14); splash.push({ x: jx, y: JY, t: 0 }); api.note(260, 0.1, 'sine'); }
          else if (Math.abs(o.x - dog.x) < 26 && Math.abs(sy - dog.y) < 12) { o.done = true; dog.muddy = 1; score = Math.max(0, score - 15); msgs.add('MUDDY DOG! -15', dog.x, dog.y - 20, '#c8a060', 14); splash.push({ x: dog.x, y: dog.y, t: 0 }); api.note(220, 0.1, 'sine'); }
        }
        if (o.k === 'cat' && !o.done && Math.hypot(o.x - dog.x, sy - dog.y) < 26) { o.done = true; o.run = 1; score = Math.max(0, score - 10); msgs.add('WOOF WOOF! The cat! -10', dog.x, dog.y - 20, '#ff8080', 14); dog.vx += (o.x > 240 ? 1 : -1) * 400; tx += (o.x > 240 ? 1 : -1) * 70; api.sfx('uhoh'); }
        if (o.k === 'bin' && !o.done && Math.abs(o.x - jx) < 22 && Math.abs(sy - JY) < 14) { o.done = true; score = Math.max(0, score - 8); msgs.add('OOF! -8', jx, JY - 40, '#ff8080', 15); api.sfx('thud'); tangle = 0.6; }
        if (o.k === 'lamp' && !o.done) { // the lead wraps round a lamppost if Jack and the dog go either side of it
          const ly = sy; if (ly > Math.min(dog.y, hy) && ly < Math.max(dog.y, hy) && (dog.x - o.x) * (jx - o.x) < 0) {
            const k = (ly - hy) / (dog.y - hy || 1), lxAt = hx + (dog.x - hx) * k;
            if (Math.abs(lxAt - o.x) < 7) { o.done = true; tangle = 1.4; score = Math.max(0, score - 20); msgs.add('TANGLED! -20', o.x, ly - 20, '#ff6060', 18); api.sfx('thud'); }
          }
          if (ly > JY + 20) o.done = true;
        }
        if (o.run) o.x += (o.x > 240 ? 1 : -1) * 200 * dt;
      }
      things = things.filter(o => o.y + scroll < H + 40);
    }
    function draw(g) {
      // verges, garden walls, the pavement
      g.fillStyle = '#4a9a3a'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#c8c8c0'; g.fillRect(100, 0, 280, H); g.strokeStyle = '#a8a8a0'; g.lineWidth = 1;
      const off = scroll % 40; for (let y = -40 + off; y < H; y += 40) { g.beginPath(); g.moveTo(100, y); g.lineTo(380, y); g.stroke(); } for (const x of [170, 240, 310]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      g.fillStyle = '#d8d8d0'; g.fillRect(380, 0, 8, H); g.fillStyle = '#4a4a50'; g.fillRect(388, 0, 92, H); g.fillStyle = '#fff'; for (let y = -60 + (scroll % 60); y < H; y += 60) g.fillRect(440, y, 4, 30);
      g.fillStyle = '#a0503a'; g.fillRect(0, 0, 18, H); g.fillStyle = '#c8603a'; for (let y = -20 + (scroll % 20); y < H; y += 20) g.fillRect(0, y, 18, 2);
      for (let y = -90 + (scroll % 90); y < H; y += 90) { g.fillStyle = '#2a7a2a'; g.beginPath(); g.arc(50, y, 20, 0, TAU); g.arc(76, y + 10, 16, 0, TAU); g.fill(); g.fillStyle = '#ff7ac0'; g.beginPath(); g.arc(46, y - 6, 3, 0, TAU); g.arc(78, y + 4, 3, 0, TAU); g.fill(); }
      // things
      for (const o of things) {
        const x = o.x, y = o.y + scroll;
        if (o.k === 'treat' && !o.done) { g.save(); g.translate(x, y); g.rotate(0.5); g.fillStyle = '#f4e8c8'; g.strokeStyle = '#8a6a3a'; g.lineWidth = 1.2; g.fillRect(-7, -2.5, 14, 5); g.strokeRect(-7, -2.5, 14, 5); for (const s of [-1, 1]) { g.beginPath(); g.arc(7 * s, -2.5, 3, 0, TAU); g.arc(7 * s, 2.5, 3, 0, TAU); g.fill(); g.stroke(); } g.restore(); }
        else if (o.k === 'puddle') { g.fillStyle = 'rgba(70,130,210,.7)'; g.beginPath(); g.ellipse(x, y, 26, 11, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(x - 6, y - 3, 10, 3, 0, 0, TAU); g.stroke(); }
        else if (o.k === 'lamp') { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 10, y + 4, 14, 5, 0.3, 0, TAU); g.fill(); g.fillStyle = '#3a3a40'; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); g.fillStyle = '#6a6a70'; g.beginPath(); g.arc(x - 1.5, y - 1.5, 2.5, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,230,120,.25)'; g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill(); }
        else if (o.k === 'bin') { g.fillStyle = '#1a5a2a'; g.strokeStyle = '#000'; g.lineWidth = 1.5; rr(g, x - 12, y - 12, 24, 24, 3); g.fill(); g.stroke(); g.strokeStyle = '#2a7a3a'; g.beginPath(); g.moveTo(x - 10, y - 4); g.lineTo(x + 10, y - 4); g.stroke(); }
        else if (o.k === 'cat') { const s = o.run ? 1.1 : 1; g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#ff9a2a'; g.strokeStyle = '#000'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, 3, 8, 11, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -9, 6, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-5, -12); g.lineTo(-4, -18); g.lineTo(-1, -14); g.moveTo(5, -12); g.lineTo(4, -18); g.lineTo(1, -14); g.fill(); g.stroke(); g.strokeStyle = '#ff9a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 13); g.quadraticCurveTo(8 + Math.sin(t * 6) * 4, 20, 4, 26); g.stroke(); g.fillStyle = '#000'; g.fillRect(-3, -10, 2, 2); g.fillRect(1, -10, 2, 2); g.restore(); if (o.run) txt(g, 'HISSS!', x, y - 26, 9, '#fff'); }
      }
      for (const s of splash) { g.strokeStyle = `rgba(160,210,255,${1 - s.t / 0.6})`; g.lineWidth = 2; g.beginPath(); g.arc(s.x, s.y, 8 + s.t * 40, 0, TAU); g.stroke(); }
      // the lead
      const hx = jx + 8, hy = JY - 12;
      g.strokeStyle = '#e10600'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx, hy); const d = Math.hypot(dog.x - hx, dog.y - hy), sag = Math.max(0, LEAD - d) * 0.5; g.quadraticCurveTo((hx + dog.x) / 2 + sag, (hy + dog.y) / 2, dog.x, dog.y); g.stroke();
      // Biscuit (from above)
      const ang = Math.atan2(dog.vy - 30, dog.vx);
      g.save(); g.translate(dog.x, dog.y); g.rotate(ang + Math.PI / 2);
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(3, 4, 9, 15, 0, 0, TAU); g.fill();
      g.strokeStyle = dog.muddy ? '#6a4a1a' : '#c8883a'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 12); g.lineTo(Math.sin(dog.wag) * 8, 22); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = dog.muddy ? '#8a6a3a' : '#c8883a'; g.strokeStyle = '#4a2a0a'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, 2, 8, 13, 0, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.arc(0, -13, 7, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#8a5a1a'; g.beginPath(); g.ellipse(-7, -12, 3, 6, 0.4, 0, TAU); g.ellipse(7, -12, 3, 6, -0.4, 0, TAU); g.fill();
      g.fillStyle = '#000'; g.beginPath(); g.arc(0, -20, 2, 0, TAU); g.fill(); g.fillStyle = '#e10600'; g.fillRect(-6, -7, 12, 3);
      if (dog.muddy) { g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(-3, 4, 3, 0, TAU); g.arc(4, -1, 2.5, 0, TAU); g.fill(); }
      g.restore();
      // Jack (from above)
      g.save(); g.translate(jx, JY);
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(3, 4, 15, 9, 0, 0, TAU); g.fill();
      const st = Math.sin(t * 9) * 3;
      g.fillStyle = '#1a2a6a'; g.fillRect(-7, 2 + st, 5, 9); g.fillRect(2, 2 - st, 5, 9);
      g.fillStyle = '#2a6ae0'; g.strokeStyle = '#000'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, 0, 14, 8, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#ffd0a0'; g.beginPath(); g.arc(9, -10, 3, 0, TAU); g.fill();
      g.fillStyle = '#e10600'; g.beginPath(); g.arc(0, -2, 7, 0, TAU); g.fill(); g.stroke(); g.fillRect(-3, -12, 6, 5);
      g.restore();
      if (tangle > 0) cartoon(g, '@#!%', jx, JY - 34, 14, '#fff');
      button(g, 386, 274, 86, 38, 'TUG!', tugCd > 0.6);
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 8, 22, 150, 18, 4); g.fill(); txt(g, `TREATS: ${treats}  ${Math.round(dist / 20)} m`, 83, 31, 10, '#fff');
      msgs.draw(g);
    }
    return {
      keys: 'Move the mouse (or <b>drag</b>) left and right to steer, or use the <b>arrow keys</b>. Press <b>Space</b> or click <b>TUG!</b> to pull Biscuit back to heel. Let him eat the <b>treats</b>. Keep him away from <b>cats</b> and <b>puddles</b>, and don\'t go either side of a <b>lamppost</b>!',
      start() { spawnY = 0; for (let i = 0; i < 4; i++) spawn(); }, step, draw,
      down(x, y) { if (x > 380 && y > 268) tug(); else tx = x; },
      move(x) { tx = x; },
      key(k, d) { keys[k] = d; if (d && (k === 'Space' || k === 'ArrowUp' || k === 'w')) tug(); },
      score: () => Math.round(score), hud: () => `${Math.round(score)} points`,
    };
  });
})();

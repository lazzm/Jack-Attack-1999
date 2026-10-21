/* grind-games-a: three of Mom's chores as mini-games for the Pocket Money runner (js/grind-jobs.js).
 *   washup  The Washing Up: a stacker. Plates, bowls and mugs swing along under the tap; drop each one on the pile on
 *           the draining board. Line them up or the pile wobbles. Six on the pile and Mom carries them to the cupboard.
 *   tidy    Tidy Your Room: drag every sock, comic, toy and crisp packet to where it goes before Mom checks.
 *   car     Wash Dad's Car: scrub the mud off with the sponge. Shoo the pigeon before it, well, you know. */
(function () {
  'use strict';
  if (!window.GrindJobs) return;
  const W = 480, H = 320, TAU = Math.PI * 2;
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const txt = (g, s, x, y, size, col, align, stroke) => { g.font = `bold ${size}px Verdana,Arial,sans-serif`; g.textAlign = align || 'center'; g.textBaseline = 'middle'; if (stroke !== false) { g.lineWidth = Math.max(2, size / 5); g.strokeStyle = '#000'; g.lineJoin = 'round'; g.strokeText(s, x, y); } g.fillStyle = col || '#fff'; g.fillText(s, x, y); g.textAlign = 'left'; };
  const cartoon = (g, s, x, y, size, col) => { g.font = `bold ${size}px 'Comic Sans MS','Chalkboard SE','Marker Felt',cursive`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = '#000'; g.lineJoin = 'round'; g.strokeText(s, x, y); g.fillStyle = col || '#ffd400'; g.fillText(s, x, y); g.textAlign = 'left'; };
  // floating messages ("PERFECT!", "SMASH!")
  const Msgs = () => { const L = []; return { add(s, x, y, col, size) { L.push({ s, x, y, col, size: size || 18, t: 0 }); }, step(dt) { for (const m of L) { m.t += dt; m.y -= 24 * dt; } while (L.length && L[0].t > 1.2) L.shift(); }, draw(g) { for (const m of L) { g.globalAlpha = Math.max(0, 1 - m.t / 1.2); cartoon(g, m.s, m.x, m.y, m.size, m.col); } g.globalAlpha = 1; } }; };

  // ====================================================================================== THE WASHING UP
  GrindJobs.game('washup', api => {
    const KINDS = [
      { k: 'plate', w: 92, h: 10, c: '#ffffff', r: '#3a5a9a' }, { k: 'side', w: 66, h: 9, c: '#fff8e8', r: '#c0402a' },
      { k: 'bowl', w: 58, h: 20, c: '#f0f8ff', r: '#2a8a5a' }, { k: 'mug', w: 30, h: 30, c: '#e10600', r: '#600000' }, { k: 'mug2', w: 30, h: 30, c: '#ffd400', r: '#6a4a00' },
    ];
    const BASE = 282, RACK = { x: 240, w: 210 };
    let stack = [], cur = null, wob = 0, t = 0, put = 0, smashed = 0, trips = 0, speed = 150, shards = [], bubbles = [], carry = null, msgs = Msgs(), over = false, perfectRun = 0;
    const newItem = () => { const K = KINDS[Math.floor(Math.random() * (stack.length === 0 ? 3 : KINDS.length))]; cur = { K, x: 80 + Math.random() * 320, y: 58, dir: Math.random() < 0.5 ? -1 : 1, vy: 0, fall: false }; };
    const topY = () => BASE - stack.reduce((s, it) => s + it.K.h, 0);
    const support = () => (stack.length ? stack[stack.length - 1] : { x: RACK.x, K: { w: RACK.w } });
    function drop() { if (!cur || cur.fall || carry) return; cur.fall = true; api.note(330, 0.05, 'triangle'); }
    function bank(auto) {
      if (stack.length < 2 || carry) return;
      const n = stack.length; put += n + (wob < 0.25 ? 1 : 0); trips++;
      carry = { items: stack, t: 0 }; stack = []; wob = 0;
      msgs.add(auto ? `Cupboard! +${n}` : `Put away! +${n}`, 400, 120, '#9fffa0');
      [784, 988, 1175].forEach((f, i) => setTimeout(() => api.note(f, 0.08, 'triangle'), i * 70));
    }
    function smash(x, y, n, col) {
      for (let i = 0; i < 10 + n * 4; i++) shards.push({ x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 260, vy: -100 - Math.random() * 220, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 20, s: 3 + Math.random() * 6, c: Math.random() < 0.6 ? '#fff' : col, t: 0 });
      smashed += n; api.sfx('thud'); [180, 140, 110].forEach((f, i) => setTimeout(() => api.note(f + Math.random() * 40, 0.06, 'sawtooth'), i * 40));
      if (smashed >= 8) { over = true; msgs.add('Mom takes over!', W / 2, 140, '#ff8080', 24); }
    }
    function step(dt) {
      t += dt; msgs.step(dt);
      if (Math.random() < dt * 3) bubbles.push({ x: 20 + Math.random() * 60, y: 300, r: 2 + Math.random() * 5, v: 20 + Math.random() * 30, t: 0 });
      for (const b of bubbles) { b.y -= b.v * dt; b.x += Math.sin(t * 3 + b.r) * 10 * dt; b.t += dt; }
      while (bubbles.length && bubbles[0].t > 7) bubbles.shift();
      for (const s of shards) { s.t += dt; s.vy += 900 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += s.vr * dt; if (s.y > 300) { s.y = 300; s.vy *= -0.3; s.vx *= 0.6; } }
      while (shards.length && shards[0].t > 1.6) shards.shift();
      if (carry) { carry.t += dt; if (carry.t > 0.7) carry = null; }
      wob = Math.max(0, wob - dt * 0.05);
      if (!cur) { if (!carry) newItem(); return; }
      if (!cur.fall) {
        cur.x += cur.dir * speed * dt;
        if (cur.x < 50) { cur.x = 50; cur.dir = 1; } if (cur.x > 430) { cur.x = 430; cur.dir = -1; }
        return;
      }
      cur.vy += 1500 * dt; cur.y += cur.vy * dt;
      const ty = topY() - cur.K.h;
      if (cur.y >= ty) {
        const sp = support(), off = cur.x - sp.x, half = sp.K.w / 2;
        if (Math.abs(off) > half + cur.K.w * 0.12) { // missed the pile: off the edge it goes
          smash(cur.x, Math.min(296, ty + 10), 1, cur.K.c); msgs.add('SMASH!', cur.x, ty - 10, '#ff6060');
          cur = null; perfectRun = 0; return;
        }
        cur.y = ty; const it = { K: cur.K, x: cur.x }; stack.push(it); cur = null;
        const k = Math.abs(off) / Math.max(12, half);
        if (Math.abs(off) < 5) { it.x = sp.x; msgs.add(++perfectRun >= 3 ? `PERFECT x${perfectRun}!` : 'PERFECT!', it.x, ty - 14, '#ffd400'); wob = Math.max(0, wob - 0.12); put += perfectRun >= 3 ? 1 : 0; api.note(1568, 0.07, 'triangle'); setTimeout(() => api.note(2093, 0.09, 'triangle'), 60); }
        else { perfectRun = 0; wob += k * k * 0.6 + (it.K.w > sp.K.w ? 0.08 : 0); api.note(1200 - k * 400, 0.05, 'triangle'); }
        speed = Math.min(300, 150 + (put + stack.length) * 4.5);
        if (wob >= 1) { // the whole pile goes over
          smash(stack[stack.length - 1].x, 270, stack.length, '#ddd'); msgs.add('CRASH!!', W / 2, 150, '#ff6060', 30);
          stack = []; wob = 0;
        } else if (stack.length >= 6) bank(true);
      }
    }
    function drawItem(g, K, x, y) { // y = top of item
      const w = K.w, h = K.h;
      g.lineWidth = 1.5; g.strokeStyle = '#222';
      if (K.k === 'plate' || K.k === 'side') {
        g.fillStyle = K.c; g.beginPath(); g.ellipse(x, y + h / 2, w / 2, h / 2, 0, 0, TAU); g.fill(); g.stroke();
        g.strokeStyle = K.r; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + h / 2 - 1, w / 2 - 5, h / 2 - 2.5, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x - w / 4, y + 2, w / 6, 1.5);
      } else if (K.k === 'bowl') {
        g.fillStyle = K.c; g.beginPath(); g.moveTo(x - w / 2, y + 3); g.quadraticCurveTo(x - w / 2 + 4, y + h, x - 10, y + h); g.lineTo(x + 10, y + h); g.quadraticCurveTo(x + w / 2 - 4, y + h, x + w / 2, y + 3); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#d8e8f8'; g.beginPath(); g.ellipse(x, y + 3, w / 2, 3, 0, 0, TAU); g.fill(); g.stroke();
        g.strokeStyle = K.r; g.lineWidth = 3; g.beginPath(); g.moveTo(x - w / 2 + 4, y + 9); g.quadraticCurveTo(x, y + 13, x + w / 2 - 4, y + 9); g.stroke();
      } else {
        g.fillStyle = K.c; rr(g, x - w / 2, y, w - 6, h, 3); g.fill(); g.stroke();
        g.lineWidth = 4; g.strokeStyle = K.c; g.beginPath(); g.arc(x + w / 2 - 6, y + h / 2, 7, -1.2, 1.2); g.stroke();
        g.lineWidth = 1.5; g.strokeStyle = '#222'; g.beginPath(); g.arc(x + w / 2 - 6, y + h / 2, 9, -1.1, 1.1); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x - w / 2 + 4, y + 4, 4, h - 10);
        g.fillStyle = K.r; g.font = 'bold 9px Verdana'; g.textAlign = 'center'; g.fillText(K.k === 'mug' ? '#1' : ':)', x - 3, y + h / 2 + 3); g.textAlign = 'left';
      }
    }
    function draw(g) {
      // the kitchen: tiles, a window, the counter
      g.fillStyle = '#dff0f4'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#b8d4dc'; g.lineWidth = 1;
      for (let x = 0; x <= W; x += 24) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, 250); g.stroke(); }
      for (let y = 0; y <= 250; y += 24) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
      for (let i = 0; i < 9; i++) { const x = (i * 97) % 480, y = (i * 61) % 230; g.fillStyle = i % 3 ? '#ffe8a0' : '#b8e0b0'; g.fillRect(x - (x % 24) + 4, y - (y % 24) + 4, 16, 16); }
      g.fillStyle = '#7ab0e0'; g.fillRect(150, 22, 180, 112); const sky = g.createLinearGradient(0, 22, 0, 134); sky.addColorStop(0, '#6ab0ff'); sky.addColorStop(1, '#cfeaff'); g.fillStyle = sky; g.fillRect(156, 28, 168, 100);
      g.fillStyle = '#5aa83a'; g.beginPath(); g.moveTo(156, 128); g.quadraticCurveTo(220, 92, 324, 110); g.lineTo(324, 128); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(196, 52, 9, 0, TAU); g.arc(208, 48, 11, 0, TAU); g.arc(220, 54, 8, 0, TAU); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(153, 25, 174, 106); g.beginPath(); g.moveTo(240, 25); g.lineTo(240, 131); g.stroke();
      g.fillStyle = '#e85a8a'; for (const s of [-1, 1]) { g.beginPath(); const cx = 240 + s * 104; g.moveTo(cx, 16); g.quadraticCurveTo(cx - s * 30, 70, cx + s * 4, 140); g.lineTo(cx + s * 14, 140); g.lineTo(cx + s * 14, 16); g.fill(); }
      g.fillStyle = '#c8406a'; g.fillRect(126, 12, 228, 8);
      // the tap
      g.fillStyle = '#b8c0c8'; g.strokeStyle = '#333'; g.lineWidth = 1.5; rr(g, 26, 196, 50, 10, 4); g.fill(); g.stroke(); rr(g, 46, 170, 10, 30, 3); g.fill(); g.stroke(); rr(g, 46, 168, 46, 9, 4); g.fill(); g.stroke();
      // counter + sink
      g.fillStyle = '#c89a5a'; g.fillRect(0, 250, W, 70); g.fillStyle = '#a87a3a'; g.fillRect(0, 250, W, 6); g.fillStyle = '#e8eef0'; rr(g, 6, 258, 110, 26, 6); g.fill(); g.strokeStyle = '#8a9498'; g.stroke();
      const water = g.createLinearGradient(0, 262, 0, 284); water.addColorStop(0, '#d8f0ff'); water.addColorStop(1, '#a8d0e8'); g.fillStyle = water; rr(g, 12, 262, 98, 18, 5); g.fill();
      for (const b of bubbles) { g.globalAlpha = Math.max(0, 0.8 - b.t / 9); g.strokeStyle = '#fff'; g.fillStyle = 'rgba(220,240,255,.4)'; g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(b.x - b.r / 3, b.y - b.r / 2, 1.5, 1.5); }
      g.globalAlpha = 1;
      // the draining rack
      g.strokeStyle = '#6a7478'; g.lineWidth = 2;
      for (let x = RACK.x - RACK.w / 2; x <= RACK.x + RACK.w / 2; x += 15) { g.beginPath(); g.moveTo(x, BASE + 2); g.lineTo(x, BASE + 18); g.stroke(); }
      g.fillStyle = '#c8d0d4'; g.strokeStyle = '#4a5458'; rr(g, RACK.x - RACK.w / 2 - 6, BASE, RACK.w + 12, 6, 2); g.fill(); g.stroke(); rr(g, RACK.x - RACK.w / 2 - 6, BASE + 18, RACK.w + 12, 6, 2); g.fill(); g.stroke();
      // the cupboard (click it to put the pile away)
      g.fillStyle = '#8a5a2a'; g.strokeStyle = '#3a1a00'; g.lineWidth = 2; rr(g, 392, 150, 80, 92, 4); g.fill(); g.stroke(); g.strokeRect(398, 156, 32, 80); g.strokeRect(434, 156, 32, 80);
      g.fillStyle = '#ffd400'; g.beginPath(); g.arc(426, 196, 3, 0, TAU); g.arc(438, 196, 3, 0, TAU); g.fill();
      txt(g, stack.length >= 2 ? 'PUT AWAY' : 'CUPBOARD', 432, 142, 10, stack.length >= 2 ? '#ffd400' : '#fff');
      // the pile, wobbling
      const sway = wob * 0.11 * Math.sin(t * (4 + wob * 4));
      g.save(); g.translate(RACK.x, BASE); g.rotate(sway); g.translate(-RACK.x, -BASE);
      let y = BASE; for (const it of stack) { y -= it.K.h; drawItem(g, it.K, it.x, y); }
      g.restore();
      if (carry) { g.globalAlpha = 1 - carry.t / 0.7; let yy = BASE - carry.t * 60; for (const it of carry.items) { yy -= it.K.h; drawItem(g, it.K, it.x + carry.t * 260, yy); } g.globalAlpha = 1; }
      // the wobble meter
      g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, 8, 24, 116, 36, 4); g.fill(); g.fillStyle = '#222'; rr(g, 12, 28, 108, 12, 3); g.fill(); g.fillStyle = wob > 0.65 ? '#ff3a3a' : wob > 0.35 ? '#ffb000' : '#3ad03a'; rr(g, 12, 28, 108 * Math.min(1, wob), 12, 3); g.fill();
      txt(g, 'WOBBLE', 66, 34, 9, '#fff');
      txt(g, `Broken: ${smashed} of 8`, 66, 51, 10, smashed >= 6 ? '#ff8080' : '#ffe680');
      // the next thing, swinging under a rubber glove
      if (cur) {
        if (!cur.fall) { g.strokeStyle = '#e8c000'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(cur.x, 18); g.lineTo(cur.x, cur.y - 2); g.stroke(); g.lineCap = 'butt'; g.fillStyle = '#ffd400'; g.strokeStyle = '#6a4a00'; g.lineWidth = 1.5; rr(g, cur.x - 12, cur.y - 10, 24, 12, 5); g.fill(); g.stroke(); }
        drawItem(g, cur.K, cur.x, cur.y);
        if (!cur.fall) { g.setLineDash([3, 4]); g.strokeStyle = 'rgba(0,0,80,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cur.x, cur.y + cur.K.h + 2); g.lineTo(cur.x, topY()); g.stroke(); g.setLineDash([]); }
      }
      for (const s of shards) { g.save(); g.translate(s.x, s.y); g.rotate(s.r); g.fillStyle = s.c; g.strokeStyle = '#555'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-s.s, 0); g.lineTo(0, -s.s / 2); g.lineTo(s.s, s.s / 3); g.closePath(); g.fill(); g.stroke(); g.restore(); }
      msgs.draw(g);
    }
    const inCup = (x, y) => x > 386 && y > 132 && y < 248;
    return {
      keys: '<b>Click</b> (or press <b>Space</b>) to drop the thing that is swinging. Click the <b>cupboard</b> (or press <b>Enter</b>) to put the pile away early. Six on the pile and Mom puts them away for you.',
      start() { newItem(); }, step, draw,
      down(x, y) { if (inCup(x, y)) bank(false); else drop(); },
      key(k, d) { if (!d) return; if (k === 'Space' || k === 'ArrowDown' || k === 's') drop(); else if (k === 'Enter') bank(false); },
      score: () => put, get over() { return over; },
      hud: () => `Put away: ${put}  On the pile: ${stack.length}`,
      get cur() { return cur; }, get sup() { return support(); },
    };
  });

  // ====================================================================================== TIDY YOUR ROOM
  GrindJobs.game('tidy', api => {
    const ZONES = {
      clothes: { n: 'Washing basket', x: 158, y: 206, w: 70, h: 72 },
      rubbish: { n: 'Bin', x: 240, y: 236, w: 40, h: 48 },
      toys: { n: 'Toy box', x: 292, y: 222, w: 92, h: 66 },
      books: { n: 'Bookshelf', x: 398, y: 62, w: 74, h: 170 },
    };
    const NAMES = {
      clothes: [['sock', 'A sock'], ['tshirt', 'Your T-shirt'], ['jumper', 'The jumper Nan knitted'], ['pants', 'Pants (clean?)'], ['cap', 'Baseball cap']],
      books: [['comic', 'A comic'], ['book', 'A library book (overdue)'], ['mag', 'A games magazine'], ['manual', 'A game manual']],
      toys: [['brick', 'A plastic brick (ouch)'], ['robot', 'Your robot'], ['teddy', 'Ted'], ['yoyo', 'Yo-yo'], ['cube', 'Puzzle cube'], ['ball', 'Football'], ['pet', 'Virtual pet']],
      rubbish: [['crisps', 'Crisp packet'], ['banana', 'Banana skin'], ['core', 'Apple core'], ['wrap', 'Sweet wrapper'], ['can', 'Empty pop can']],
    };
    const WRONG = {
      clothes: ['Socks do NOT live there.', 'Clothes go in the WASHING BASKET!', 'That needs a wash first!'],
      books: ['Books go on the SHELF, love.', 'Not there! The bookshelf!'],
      toys: ['Toys in the TOY BOX please!', 'That goes in the toy box!'],
      rubbish: ['Ew! Rubbish goes in the BIN!', 'BIN. It. Please.'],
    };
    let items = [], drag = null, put = 0, wave = 0, t = 0, msgs = Msgs(), warned = false, flyers = [], over = false;
    const cats = Object.keys(NAMES);
    const inZone = (z, x, y) => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
    function spawn(n) {
      wave++;
      for (let i = 0; i < n; i++) {
        const cat = cats[(i + wave) % cats.length], nm = NAMES[cat][Math.floor(Math.random() * NAMES[cat].length)];
        let x, y, tries = 0;
        do { const onBed = Math.random() < 0.3; x = onBed ? 20 + Math.random() * 120 : 20 + Math.random() * 440; y = onBed ? 172 + Math.random() * 30 : 240 + Math.random() * 66; tries++; }
        while (tries < 30 && (Object.values(ZONES).some(z => x > z.x - 18 && x < z.x + z.w + 18 && y > z.y - 18 && y < z.y + z.h + 18) || items.some(o => Math.hypot(o.x - x, o.y - y) < 30)));
        items.push({ cat, k: nm[0], n: nm[1], x, y, hx: x, hy: y, r: (Math.random() - 0.5) * 0.8, back: 0 });
      }
      if (wave > 1) msgs.add(api.pick([Cast.t("{sister}'s been in here!"), 'The dog brought more!', 'How is there MORE?!']), W / 2, 120, '#ffd400', 20);
    }
    function drawThing(g, it, x, y, s) {
      g.save(); g.translate(x, y); g.rotate(it.r * (drag && drag.it === it ? 0.2 : 1)); g.scale(s || 1, s || 1);
      g.lineWidth = 1.4; g.strokeStyle = '#1a1a1a';
      const P = (c) => { g.fillStyle = c; g.fill(); g.stroke(); };
      switch (it.k) {
        case 'sock': g.beginPath(); g.moveTo(-5, -12); g.lineTo(5, -12); g.lineTo(5, 3); g.quadraticCurveTo(14, 4, 14, 10); g.quadraticCurveTo(12, 14, 0, 13); g.lineTo(-5, 8); g.closePath(); P('#fff'); g.fillStyle = '#e10600'; g.fillRect(-5, -12, 10, 4); g.fillStyle = '#e10600'; g.fillRect(-5, -6, 10, 2); break;
        case 'tshirt': g.beginPath(); g.moveTo(-14, -10); g.lineTo(-6, -13); g.quadraticCurveTo(0, -9, 6, -13); g.lineTo(14, -10); g.lineTo(11, -4); g.lineTo(8, -5); g.lineTo(8, 12); g.lineTo(-8, 12); g.lineTo(-8, -5); g.lineTo(-11, -4); g.closePath(); P('#2a7ae0'); g.fillStyle = '#ffd400'; g.beginPath(); g.arc(0, 1, 4, 0, TAU); g.fill(); break;
        case 'jumper': g.beginPath(); g.moveTo(-16, -9); g.lineTo(-7, -13); g.lineTo(7, -13); g.lineTo(16, -9); g.lineTo(18, 8); g.lineTo(12, 8); g.lineTo(10, -2); g.lineTo(10, 12); g.lineTo(-10, 12); g.lineTo(-10, -2); g.lineTo(-12, 8); g.lineTo(-18, 8); g.closePath(); P('#9a2a8a'); g.strokeStyle = '#ffd400'; g.lineWidth = 2; g.beginPath(); g.moveTo(-9, 2); g.lineTo(-4, -2); g.lineTo(0, 2); g.lineTo(4, -2); g.lineTo(9, 2); g.stroke(); break;
        case 'pants': g.beginPath(); g.moveTo(-12, -8); g.lineTo(12, -8); g.lineTo(12, 2); g.quadraticCurveTo(4, 2, 2, 9); g.lineTo(-2, 9); g.quadraticCurveTo(-4, 2, -12, 2); g.closePath(); P('#fff'); g.fillStyle = '#ff7ac0'; for (const [a, b] of [[-7, -3], [3, -4], [7, 0], [-2, 3]]) { g.beginPath(); g.arc(a, b, 1.6, 0, TAU); g.fill(); } g.fillStyle = '#ddd'; g.fillRect(-12, -8, 24, 3); break;
        case 'cap': g.beginPath(); g.arc(0, 2, 11, Math.PI, 0); g.closePath(); P('#e10600'); g.beginPath(); g.moveTo(8, 2); g.lineTo(20, 4); g.lineTo(8, 6); g.closePath(); P('#a00000'); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -9, 1.6, 0, TAU); g.fill(); break;
        case 'comic': rr(g, -11, -14, 22, 28, 1); P('#ffe600'); g.fillStyle = '#e10600'; g.fillRect(-9, -12, 18, 7); g.fillStyle = '#fff'; g.font = 'bold 6px Arial'; g.fillText('POW!', -8, -6.5); g.fillStyle = '#2a7ae0'; g.beginPath(); g.arc(0, 4, 6, 0, TAU); g.fill(); break;
        case 'book': rr(g, -10, -13, 20, 26, 1); P('#2a6a2a'); g.fillStyle = '#ffd400'; g.fillRect(-6, -8, 12, 2); g.fillRect(-6, -4, 9, 1.5); g.fillStyle = '#fff'; g.fillRect(-10, 9, 20, 3); break;
        case 'mag': rr(g, -11, -14, 22, 28, 1); P('#fff'); g.fillStyle = '#000080'; g.fillRect(-11, -14, 22, 7); g.fillStyle = '#ffd400'; g.font = 'bold 6px Arial'; g.fillText('GAMES', -9, -8.5); g.fillStyle = '#e10600'; g.fillRect(-8, -4, 16, 12); g.fillStyle = '#fff'; g.fillRect(-6, 10, 12, 1.5); break;
        case 'manual': rr(g, -9, -12, 18, 24, 1); P('#111'); g.fillStyle = '#c00'; g.fillRect(-9, -12, 18, 5); g.fillStyle = '#fff'; g.fillRect(-5, -2, 10, 1.5); g.fillRect(-5, 2, 10, 1.5); break;
        case 'brick': rr(g, -12, -6, 24, 12, 2); P('#e10600'); g.fillStyle = '#ff4a3a'; g.strokeStyle = '#1a1a1a'; for (const x of [-7, 0, 7]) { g.beginPath(); g.ellipse(x, -7, 3, 1.6, 0, 0, TAU); g.fill(); g.stroke(); } break;
        case 'robot': rr(g, -8, -4, 16, 15, 2); P('#a8b0b8'); rr(g, -6, -14, 12, 10, 2); P('#c8d0d8'); g.fillStyle = '#e10600'; g.fillRect(-4, -11, 3, 3); g.fillRect(1, -11, 3, 3); g.strokeStyle = '#1a1a1a'; g.beginPath(); g.moveTo(0, -14); g.lineTo(0, -18); g.stroke(); g.fillStyle = '#ffd400'; g.beginPath(); g.arc(0, -19, 2, 0, TAU); g.fill(); g.fillStyle = '#2a7ae0'; g.fillRect(-4, 1, 8, 4); break;
        case 'teddy': g.beginPath(); g.arc(-7, -10, 4, 0, TAU); P('#a0682a'); g.beginPath(); g.arc(7, -10, 4, 0, TAU); P('#a0682a'); g.beginPath(); g.ellipse(0, 6, 9, 9, 0, 0, TAU); P('#c8883a'); g.beginPath(); g.arc(0, -5, 8, 0, TAU); P('#c8883a'); g.fillStyle = '#000'; g.beginPath(); g.arc(-3, -6, 1.2, 0, TAU); g.arc(3, -6, 1.2, 0, TAU); g.fill(); g.fillStyle = '#f0c890'; g.beginPath(); g.ellipse(0, -2.5, 3, 2, 0, 0, TAU); g.fill(); break;
        case 'yoyo': g.beginPath(); g.arc(0, 0, 10, 0, TAU); P('#00b050'); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill(); g.strokeStyle = '#555'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(12, -6, 8, -16); g.stroke(); break;
        case 'cube': { g.fillStyle = '#111'; g.fillRect(-11, -11, 22, 22); const cs = ['#e10600', '#fff', '#2a7ae0', '#ffd400', '#00a050', '#ff8a00']; for (let i = 0; i < 9; i++) { g.fillStyle = cs[(i * 7 + 3) % 6]; g.fillRect(-10 + (i % 3) * 7, -10 + Math.floor(i / 3) * 7, 6, 6); } break; }
        case 'ball': g.beginPath(); g.arc(0, 0, 11, 0, TAU); P('#fff'); g.fillStyle = '#111'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; g.lineTo(Math.cos(a) * 4, Math.sin(a) * 4); } g.fill(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; g.beginPath(); g.arc(Math.cos(a) * 10, Math.sin(a) * 10, 2.6, 0, TAU); g.fill(); } break;
        case 'pet': g.beginPath(); g.ellipse(0, 1, 10, 12, 0, 0, TAU); P('#ff7ac0'); g.fillStyle = '#c8e8a0'; rr(g, -6, -6, 12, 9, 1); g.fill(); g.stroke(); g.fillStyle = '#111'; g.fillRect(-2, -3, 2, 2); g.fillRect(1, -3, 2, 2); g.fillStyle = '#fff'; for (const x of [-4, 0, 4]) { g.beginPath(); g.arc(x, 7, 1.6, 0, TAU); g.fill(); } break;
        case 'crisps': g.beginPath(); g.moveTo(-10, -12); g.lineTo(10, -12); g.lineTo(9, 12); g.lineTo(-9, 12); g.closePath(); P('#2a5ae0'); g.fillStyle = '#ffd400'; g.beginPath(); g.ellipse(0, 0, 6, 4, 0.4, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.fillRect(-10, -12, 20, 2); g.fillRect(-9, 10, 18, 2); break;
        case 'banana': g.beginPath(); g.moveTo(-12, -4); g.quadraticCurveTo(0, 14, 13, -4); g.quadraticCurveTo(0, 6, -12, -4); P('#ffd400'); g.beginPath(); g.moveTo(-4, 4); g.lineTo(-10, 12); g.lineTo(-2, 6); P('#e8c000'); g.beginPath(); g.moveTo(5, 4); g.lineTo(12, 11); g.lineTo(3, 6); P('#e8c000'); break;
        case 'core': g.beginPath(); g.moveTo(-6, -10); g.quadraticCurveTo(-1, -2, -6, 10); g.lineTo(6, 10); g.quadraticCurveTo(1, -2, 6, -10); g.closePath(); P('#fff4d8'); g.fillStyle = '#c8202a'; g.fillRect(-6, -12, 12, 3); g.fillRect(-6, 9, 12, 3); g.fillStyle = '#3a1a00'; g.fillRect(-1, -1, 2, 3); g.strokeStyle = '#5a3a1a'; g.beginPath(); g.moveTo(0, -12); g.lineTo(1, -16); g.stroke(); break;
        case 'wrap': g.beginPath(); g.moveTo(-6, -4); g.lineTo(-13, -8); g.lineTo(-12, 8); g.lineTo(-6, 4); g.lineTo(6, 4); g.lineTo(12, 8); g.lineTo(13, -8); g.lineTo(6, -4); g.closePath(); P('#ff3a9a'); g.fillStyle = '#ffd400'; g.fillRect(-6, -4, 12, 8); break;
        case 'can': rr(g, -7, -12, 14, 24, 2); P('#00a050'); g.fillStyle = '#ccc'; g.fillRect(-7, -12, 14, 3); g.fillStyle = '#fff'; g.fillRect(-4, -4, 8, 6); break;
      }
      g.restore();
    }
    function draw(g) {
      // the room: wallpaper, window, posters, bed, carpet
      g.fillStyle = '#d8e4ff'; g.fillRect(0, 0, W, 210);
      for (let x = 0; x < W; x += 20) { g.fillStyle = x % 40 ? '#c8d8f8' : '#e0e8ff'; g.fillRect(x, 0, 10, 210); }
      g.fillStyle = '#fff'; g.fillRect(170, 30, 120, 90); const sky = g.createLinearGradient(0, 34, 0, 116); sky.addColorStop(0, '#ff9a5a'); sky.addColorStop(1, '#ffe0a0'); g.fillStyle = sky; g.fillRect(176, 36, 108, 78);
      g.fillStyle = '#3a6a3a'; g.beginPath(); g.moveTo(176, 114); g.lineTo(176, 96); g.lineTo(200, 84); g.lineTo(222, 96); g.lineTo(250, 80); g.lineTo(284, 98); g.lineTo(284, 114); g.fill();
      g.fillStyle = '#fff'; g.fillRect(228, 30, 4, 90); g.fillRect(170, 73, 120, 4);
      // poster: a rocket
      g.fillStyle = '#101848'; g.fillRect(36, 26, 64, 86); g.fillStyle = '#fff'; for (let i = 0; i < 14; i++) g.fillRect(40 + (i * 37) % 58, 30 + (i * 23) % 78, 1.5, 1.5);
      g.fillStyle = '#e8e8f0'; g.beginPath(); g.moveTo(68, 40); g.quadraticCurveTo(80, 60, 76, 86); g.lineTo(60, 86); g.quadraticCurveTo(56, 60, 68, 40); g.fill(); g.fillStyle = '#e10600'; g.beginPath(); g.moveTo(60, 80); g.lineTo(52, 94); g.lineTo(62, 88); g.fill(); g.beginPath(); g.moveTo(76, 80); g.lineTo(84, 94); g.lineTo(74, 88); g.fill(); g.fillStyle = '#ffb000'; g.beginPath(); g.moveTo(62, 88); g.lineTo(68, 104 + Math.sin(t * 20) * 3); g.lineTo(74, 88); g.fill();
      g.fillStyle = '#2a7ae0'; g.beginPath(); g.arc(68, 60, 4, 0, TAU); g.fill(); txt(g, 'SPACE!', 68, 106, 8, '#ffd400');
      // poster: a game
      g.fillStyle = '#ffd400'; g.fillRect(310, 34, 62, 80); g.fillStyle = '#e10600'; g.fillRect(314, 38, 54, 50); g.fillStyle = '#111'; for (let i = 0; i < 4; i++) g.fillRect(318 + i * 12, 70 - i * 6, 10, 10); txt(g, 'BLOCKS', 341, 100, 9, '#fff');
      // carpet
      g.fillStyle = '#4a6ac0'; g.fillRect(0, 210, W, 110); g.fillStyle = '#5a7ad0'; for (let y = 214; y < 320; y += 8) for (let x = (y % 16); x < W; x += 16) g.fillRect(x, y, 3, 2);
      g.fillStyle = '#3a4a90'; g.fillRect(0, 208, W, 4);
      // bed
      g.fillStyle = '#7a4a1a'; g.fillRect(10, 160, 8, 70); g.fillStyle = '#e8eef8'; rr(g, 14, 180, 140, 40, 4); g.fill(); g.fillStyle = '#e10600'; rr(g, 50, 172, 108, 52, 6); g.fill(); g.fillStyle = '#ff4a3a'; for (let x = 58; x < 150; x += 18) g.fillRect(x, 178, 8, 40); g.fillStyle = '#fff'; rr(g, 18, 168, 34, 18, 6); g.fill(); g.strokeStyle = '#999'; g.lineWidth = 1; g.stroke();
      // the places things go
      const hl = drag ? drag.it.cat : '';
      for (const k in ZONES) {
        const z = ZONES[k], on = drag && inZone(z, drag.x, drag.y);
        if (k === 'books') { g.fillStyle = '#8a5a2a'; g.fillRect(z.x, z.y, z.w, z.h); g.fillStyle = '#5a3a10'; for (let i = 0; i < 4; i++) g.fillRect(z.x, z.y + 8 + i * 42, z.w, 5); const bc = ['#e10600', '#2a7ae0', '#ffd400', '#2a9a2a', '#9a2a8a', '#ff8a00']; for (let s = 0; s < 3; s++) for (let i = 0; i < 6; i++) { g.fillStyle = bc[(i + s * 2) % 6]; g.fillRect(z.x + 5 + i * 11, z.y + 22 + s * 42, 8, 28 - (i % 3) * 3); } }
        else if (k === 'clothes') { g.fillStyle = '#e8d8a0'; g.beginPath(); g.moveTo(z.x, z.y + 12); g.lineTo(z.x + z.w, z.y + 12); g.lineTo(z.x + z.w - 7, z.y + z.h); g.lineTo(z.x + 7, z.y + z.h); g.closePath(); g.fill(); g.strokeStyle = '#8a7040'; g.lineWidth = 1.5; g.stroke(); for (let y = z.y + 20; y < z.y + z.h; y += 8) { g.beginPath(); g.moveTo(z.x + 4, y); g.lineTo(z.x + z.w - 4, y); g.stroke(); } g.fillStyle = '#c8b070'; rr(g, z.x - 3, z.y + 6, z.w + 6, 8, 3); g.fill(); g.stroke(); }
        else if (k === 'toys') { g.fillStyle = '#2a8a2a'; g.fillRect(z.x, z.y + 14, z.w, z.h - 14); g.fillStyle = '#ffd400'; g.fillRect(z.x, z.y + 28, z.w, 6); g.fillStyle = '#1a6a1a'; g.save(); g.translate(z.x, z.y + 14); g.rotate(-0.35); g.fillRect(0, -12, z.w, 12); g.restore(); txt(g, 'TOYS', z.x + z.w / 2, z.y + 50, 12, '#ffd400'); }
        else { g.fillStyle = '#9aa4a8'; g.beginPath(); g.moveTo(z.x, z.y + 6); g.lineTo(z.x + z.w, z.y + 6); g.lineTo(z.x + z.w - 4, z.y + z.h); g.lineTo(z.x + 4, z.y + z.h); g.closePath(); g.fill(); g.strokeStyle = '#4a5458'; g.lineWidth = 1.5; g.stroke(); for (let x = z.x + 8; x < z.x + z.w - 4; x += 7) { g.beginPath(); g.moveTo(x, z.y + 10); g.lineTo(x, z.y + z.h - 4); g.stroke(); } }
        if (hl === k || on) { g.strokeStyle = on ? '#ffd400' : 'rgba(255,255,255,.8)'; g.lineWidth = on ? 4 : 2; g.setLineDash(on ? [] : [5, 4]); g.strokeRect(z.x - 3, z.y - 3, z.w + 6, z.h + 6); g.setLineDash([]); txt(g, z.n, z.x + z.w / 2, z.y - 10, 10, '#ffd400'); }
      }
      // the mess
      for (const it of items) if (!drag || drag.it !== it) { g.fillStyle = 'rgba(0,0,40,.25)'; g.beginPath(); g.ellipse(it.x + 2, it.y + 12, 12, 3.5, 0, 0, TAU); g.fill(); drawThing(g, it, it.x, it.y); }
      for (const f of flyers) { g.globalAlpha = 1 - f.t / 0.4; drawThing(g, f.it, f.x, f.y, 1 - f.t / 0.5); } g.globalAlpha = 1;
      if (drag) { drawThing(g, drag.it, drag.x, drag.y - 4, 1.25); txt(g, drag.it.n, drag.x, drag.y - 30, 10, '#fff'); }
      if (api.left < 10) { const k = 1 - Math.max(0, api.left) / 10; g.fillStyle = `rgba(255,${200 - k * 140},0,${0.12 + 0.1 * Math.sin(t * 8)})`; g.fillRect(0, 16, W, H - 16); cartoon(g, 'MOM IS COMING UP THE STAIRS!', W / 2, 140, 18, '#ff6040'); }
      msgs.draw(g);
    }
    function step(dt) {
      t += dt; msgs.step(dt);
      for (const f of flyers) { f.t += dt; f.x += (f.tx - f.x) * Math.min(1, dt * 12); f.y += (f.ty - f.y) * Math.min(1, dt * 12); }
      while (flyers.length && flyers[0].t > 0.4) flyers.shift();
      for (const it of items) if (it.back > 0) { it.back -= dt; it.x += (it.hx - it.x) * Math.min(1, dt * 10); it.y += (it.hy - it.y) * Math.min(1, dt * 10); }
      if (!items.length && !drag && put < 40) spawn(Math.min(10, 40 - put));
      if (api.left < 10 && !warned) { warned = true; for (let i = 0; i < 6; i++) setTimeout(() => api.sfx('thud'), i * 700); }
    }
    return {
      keys: '<b>Drag</b> each thing with the mouse to where it goes: clothes in the <b>washing basket</b>, books and comics on the <b>shelf</b>, toys in the <b>toy box</b>, rubbish in the <b>bin</b>.',
      start() { spawn(10); }, step, draw,
      down(x, y) { let best = null, bd = 26; for (const it of items) { const d = Math.hypot(it.x - x, it.y - y); if (d < bd) { bd = d; best = it; } } if (best) { drag = { it: best, x, y }; api.note(520, 0.04, 'triangle'); } },
      move(x, y) { if (drag) { drag.x = Math.max(4, Math.min(W - 4, x)); drag.y = Math.max(20, Math.min(H - 4, y)); } },
      up() {
        if (!drag) return; const it = drag.it, x = drag.x, y = drag.y; drag = null;
        const z = Object.keys(ZONES).find(k => inZone(ZONES[k], x, y));
        if (z === it.cat) { items.splice(items.indexOf(it), 1); put++; const Z = ZONES[z]; flyers.push({ it, x, y, tx: Z.x + Z.w / 2, ty: Z.y + Z.h / 2, t: 0 }); msgs.add(put % 10 === 0 ? `${put}! Brilliant!` : '+1', Z.x + Z.w / 2, Z.y - 4, '#9fffa0', 16); api.note(880 + (put % 5) * 110, 0.06, 'triangle'); }
        else if (z) { it.x = x; it.y = y; it.back = 0.6; msgs.add(api.pick(WRONG[it.cat]), x, y - 20, '#ff8080', 14); api.sfx('uhoh'); }
        else { it.x = x; it.y = Math.max(170, y); it.hx = it.x; it.hy = it.y; }
      },
      score: () => put, get over() { return over || put >= 40; }, get items() { return items; }, ZONES,
      hud: () => `Put away: ${put}`,
    };
  });

  // ====================================================================================== WASH DAD'S CAR
  GrindJobs.game('car', api => {
    const body = new Path2D('M40 214 L44 182 Q48 168 70 164 L120 158 L160 116 Q168 108 184 108 L322 108 Q338 108 348 120 L384 160 L420 166 Q444 172 446 190 L448 214 Q448 226 436 228 L44 228 Q38 226 40 214 Z');
    const glass1 = new Path2D('M172 122 L230 122 L230 158 L138 160 Z'), glass2 = new Path2D('M240 122 L318 122 Q328 122 334 130 L360 158 L240 158 Z');
    const mask = document.createElement('canvas'); mask.width = W; mask.height = H; const m = mask.getContext('2d');
    let start = 0, clean = 0, t = 0, ptr = null, last = null, foam = [], pigeon = null, nextPig = 6, msgs = Msgs(), splats = 0, shoos = 0, sampleT = 0, done = false, sparkles = [];
    const pts = []; // sample grid inside the body
    const probe = document.createElement('canvas').getContext('2d');
    for (let y = 104; y < 232; y += 6) for (let x = 36; x < 452; x += 6) if (probe.isPointInPath(body, x, y)) pts.push([x, y]);
    function blob(x, y, r, col) {
      m.save(); m.clip(body);
      const base = col || 'rgba(104,70,26,', n = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) { // a clump of soft, overlapping splodges
        const a = Math.random() * TAU, d = Math.random() * r * 0.55, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * 0.7, rr2 = r * (0.45 + Math.random() * 0.4);
        const gr = m.createRadialGradient(cx, cy, rr2 * 0.1, cx, cy, rr2); gr.addColorStop(0, base + '1)'); gr.addColorStop(0.6, base + '.92)'); gr.addColorStop(1, base + '0)');
        m.fillStyle = gr; m.beginPath(); m.ellipse(cx, cy, rr2, rr2 * 0.8, Math.random() * 3, 0, TAU); m.fill();
      }
      m.fillStyle = col ? 'rgba(200,200,190,.8)' : 'rgba(72,46,14,.75)';
      for (let i = 0; i < 9; i++) { const a = Math.random() * TAU, d = r * (0.6 + Math.random() * 0.6); m.beginPath(); m.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, 1 + Math.random() * 3, 0, TAU); m.fill(); }
      if (!col) { m.strokeStyle = 'rgba(80,52,16,.6)'; m.lineWidth = 2; for (let i = 0; i < 2; i++) { const sx = x + (Math.random() - 0.5) * r; m.beginPath(); m.moveTo(sx, y); m.quadraticCurveTo(sx + 2, y + r * 0.6, sx - 1, y + r * (0.8 + Math.random() * 0.6)); m.stroke(); } }
      m.restore();
    }
    function muddy() { const d = m.getImageData(0, 0, W, H).data; let n = 0; for (const [x, y] of pts) if (d[(y * W + x) * 4 + 3] > 60) n++; return n; }
    function scrub(x0, y0, x1, y1) {
      const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 6));
      m.save(); m.globalCompositeOperation = 'destination-out';
      for (let i = 0; i <= n; i++) {
        const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
        const gr = m.createRadialGradient(x, y, 2, x, y, 20); gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        m.fillStyle = gr; m.beginPath(); m.arc(x, y, 20, 0, TAU); m.fill();
      }
      m.restore();
      if (probe.isPointInPath(body, x1, y1) && Math.random() < 0.6) foam.push({ x: x1 + (Math.random() - 0.5) * 24, y: y1 + (Math.random() - 0.5) * 16, r: 2 + Math.random() * 5, t: 0 });
      if (Math.random() < 0.12) api.note(2400 + Math.random() * 800, 0.02, 'sine');
    }
    function step(dt) {
      t += dt; msgs.step(dt);
      for (const f of foam) f.t += dt; while (foam.length && foam[0].t > 2.2) foam.shift();
      if (foam.length > 260) foam.splice(0, foam.length - 260);
      for (const s of sparkles) s.t += dt; while (sparkles.length && sparkles[0].t > 0.8) sparkles.shift();
      sampleT -= dt; if (sampleT <= 0) { sampleT = 0.3; const left = muddy(); clean = Math.max(0, Math.min(100, Math.round((1 - left / start) * 100))); if (left <= start * 0.006 && !done) { done = true; clean = 100; msgs.add('SPARKLING!', W / 2, 90, '#ffd400', 30); } }
      if (clean > 85 && Math.random() < dt * 6) { const p = pts[Math.floor(Math.random() * pts.length)]; sparkles.push({ x: p[0], y: p[1], t: 0 }); }
      // the pigeon
      nextPig -= dt;
      if (!pigeon && nextPig <= 0 && api.left > 4) { const dir = Math.random() < 0.5 ? 1 : -1; pigeon = { x: dir > 0 ? -30 : W + 30, y: 36 + Math.random() * 30, dir, dropX: 90 + Math.random() * 300, dropped: false, shoo: 0, flap: 0 }; nextPig = 7 + Math.random() * 5; api.note(700, 0.05, 'square'); }
      if (pigeon) {
        const P = pigeon; P.flap += dt * 14;
        if (P.shoo) { P.y -= 160 * dt; P.x += P.dir * 200 * dt; }
        else { P.x += P.dir * 95 * dt; if (!P.dropped && Math.abs(P.x - P.dropX) < 6) { P.dropped = true; P.splat = { x: P.x, y: P.y + 10, vy: 0 }; } }
        if (P.splat) { P.splat.vy += 600 * dt; P.splat.y += P.splat.vy * dt; if (probe.isPointInPath(body, P.splat.x, P.splat.y) || P.splat.y > 226) { blob(P.splat.x, Math.min(220, P.splat.y), 12, 'rgba(236,236,226,'); start += 0; splats++; msgs.add('SPLAT!', P.splat.x, P.splat.y - 14, '#fff', 16); api.sfx('thud'); P.splat = null; } }
        if (P.x < -60 || P.x > W + 60 || P.y < -40) pigeon = null;
      }
    }
    function draw(g) {
      const sky = g.createLinearGradient(0, 0, 0, 150); sky.addColorStop(0, '#5aa8ff'); sky.addColorStop(1, '#d0ecff'); g.fillStyle = sky; g.fillRect(0, 0, W, 150);
      g.fillStyle = '#fff'; for (const [x, y, s] of [[80, 40, 1], [380, 30, 1.3]]) { g.beginPath(); g.arc(x, y, 12 * s, 0, TAU); g.arc(x + 14 * s, y - 5, 15 * s, 0, TAU); g.arc(x + 30 * s, y, 11 * s, 0, TAU); g.fill(); }
      // the house and the garage door
      g.fillStyle = '#b8603a'; g.fillRect(0, 70, W, 140); g.strokeStyle = '#8a4020'; g.lineWidth = 1;
      for (let y = 74; y < 210; y += 10) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (y / 10) % 2 ? 0 : 12; x < W; x += 24) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 10); g.stroke(); } }
      g.fillStyle = '#e8e8e0'; g.fillRect(90, 90, 300, 120); g.strokeStyle = '#a8a8a0'; for (let y = 100; y < 210; y += 14) { g.beginPath(); g.moveTo(90, y); g.lineTo(390, y); g.stroke(); }
      g.fillStyle = '#fff'; g.fillRect(20, 92, 50, 44); g.fillStyle = '#9ad0ff'; g.fillRect(24, 96, 42, 36); g.fillStyle = '#fff'; g.fillRect(43, 96, 4, 36);
      // the drive
      g.fillStyle = '#9a9a9a'; g.fillRect(0, 206, W, 114); g.strokeStyle = '#808080'; for (let y = 216; y < 320; y += 18) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (y / 18) % 2 ? 0 : 20; x < W; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 18); g.stroke(); } }
      // puddle + bucket
      g.fillStyle = 'rgba(120,170,220,.55)'; g.beginPath(); g.ellipse(250, 282, 120, 12, 0, 0, TAU); g.fill();
      g.fillStyle = '#e10600'; g.strokeStyle = '#500'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(400, 262); g.lineTo(450, 262); g.lineTo(444, 306); g.lineTo(406, 306); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e8f4ff'; g.beginPath(); g.ellipse(425, 262, 25, 5, 0, 0, TAU); g.fill(); g.stroke();
      for (let i = 0; i < 5; i++) { g.fillStyle = '#fff'; g.beginPath(); g.arc(408 + i * 9, 258 - (i % 2) * 3, 4, 0, TAU); g.fill(); }
      // the car: shadow, wheels, body, windows, trim
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(244, 246, 210, 10, 0, 0, TAU); g.fill();
      for (const x of [118, 360]) { g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(x, 228, 24, 0, TAU); g.fill(); g.fillStyle = '#b8c0c8'; g.beginPath(); g.arc(x, 228, 12, 0, TAU); g.fill(); g.strokeStyle = '#555'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + t * 0; g.beginPath(); g.moveTo(x, 228); g.lineTo(x + Math.cos(a) * 11, 228 + Math.sin(a) * 11); g.stroke(); } }
      const paint = g.createLinearGradient(0, 108, 0, 228); paint.addColorStop(0, '#ff4a5a'); paint.addColorStop(0.45, '#d0102a'); paint.addColorStop(1, '#8a0010');
      g.fillStyle = paint; g.fill(body); g.strokeStyle = '#300'; g.lineWidth = 2; g.stroke(body);
      const gl = g.createLinearGradient(0, 120, 0, 160); gl.addColorStop(0, '#d8f0ff'); gl.addColorStop(1, '#7ab0d8'); g.fillStyle = gl; g.fill(glass1); g.fill(glass2); g.strokeStyle = '#222'; g.lineWidth = 2; g.stroke(glass1); g.stroke(glass2);
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(186, 128); g.lineTo(176, 150); g.moveTo(258, 128); g.lineTo(250, 150); g.stroke();
      g.strokeStyle = '#500'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(236, 120); g.lineTo(236, 222); g.moveTo(140, 162); g.lineTo(140, 222); g.stroke();
      g.fillStyle = '#ddd'; g.fillRect(200, 172, 18, 4); g.fillRect(260, 172, 18, 4);
      g.fillStyle = '#ffe680'; rr(g, 430, 182, 14, 10, 3); g.fill(); g.fillStyle = '#ff6a00'; rr(g, 40, 182, 10, 10, 2); g.fill();
      g.fillStyle = '#b8c0c8'; rr(g, 36, 210, 30, 10, 3); g.fill(); rr(g, 420, 210, 30, 10, 3); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(60, 176); g.lineTo(420, 176); g.lineTo(420, 180); g.lineTo(60, 182); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 8px Arial'; g.fillText('S199 JAK', 400, 222);
      g.drawImage(mask, 0, 0);
      for (const f of foam) { g.globalAlpha = Math.max(0, 1 - f.t / 2.2); g.fillStyle = '#fff'; g.strokeStyle = '#bcd'; g.lineWidth = 0.8; g.beginPath(); g.arc(f.x, f.y + f.t * 6, f.r, 0, TAU); g.fill(); g.stroke(); }
      g.globalAlpha = 1;
      for (const s of sparkles) { const k = 1 - Math.abs(s.t - 0.4) / 0.4, r = 6 * k; g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(s.x - r, s.y); g.lineTo(s.x + r, s.y); g.moveTo(s.x, s.y - r); g.lineTo(s.x, s.y + r); g.stroke(); }
      // the pigeon
      if (pigeon) { const P = pigeon; g.save(); g.translate(P.x, P.y); g.scale(P.dir, 1); g.fillStyle = '#8a90a0'; g.strokeStyle = '#222'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, 0, 13, 8, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(11, -5, 6, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#3a8a6a'; g.fillRect(6, -2, 6, 4); g.fillStyle = '#ffb000'; g.beginPath(); g.moveTo(16, -6); g.lineTo(21, -4); g.lineTo(16, -3); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(12, -7, 1.6, 0, TAU); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(12.4, -7, 0.8, 0, TAU); g.fill(); g.fillStyle = '#6a7080'; g.beginPath(); g.moveTo(-4, -2); g.lineTo(-16, -6 - Math.sin(P.flap) * 12); g.lineTo(4, -4); g.fill(); g.stroke(); g.restore(); if (P.splat) { g.fillStyle = '#f0f0e0'; g.beginPath(); g.ellipse(P.splat.x, P.splat.y, 3, 4, 0, 0, TAU); g.fill(); } }
      // the sponge
      if (ptr) { g.save(); g.translate(ptr[0], ptr[1]); g.rotate(-0.3); g.fillStyle = '#ffd400'; g.strokeStyle = '#8a6a00'; g.lineWidth = 1.5; rr(g, -16, -10, 32, 20, 5); g.fill(); g.stroke(); g.fillStyle = '#2a9a2a'; rr(g, -16, -10, 32, 6, 3); g.fill(); g.fillStyle = 'rgba(138,106,0,.5)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-10 + (i * 7) % 22, -1 + (i % 2) * 5, 1.5, 0, TAU); g.fill(); } g.restore(); }
      // the clean meter
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 8, 24, 140, 18, 4); g.fill(); const k = clean / 100; g.fillStyle = k > 0.9 ? '#3ad03a' : k > 0.5 ? '#ffd400' : '#ff8a00'; rr(g, 10, 26, 136 * k, 14, 3); g.fill(); txt(g, `CLEAN: ${clean}%`, 78, 33, 10, '#fff');
      msgs.draw(g);
    }
    for (let i = 0; i < 16; i++) blob(60 + Math.random() * 370, 125 + Math.random() * 100, 22 + Math.random() * 24); // muddy from the start (the title screen too)
    for (const x of [118, 360]) blob(x, 205, 34);
    start = Math.max(1, muddy());
    const hitPigeon = (x, y) => pigeon && !pigeon.shoo && Math.hypot(pigeon.x - x, pigeon.y - y) < 28;
    return {
      keys: '<b>Hold the mouse button down and scrub</b> the mud off with the sponge. Go over it a few times! If the pigeon turns up, <b>click it</b> to shoo it away.',
      start() {},
      step, draw,
      down(x, y) { if (hitPigeon(x, y)) { pigeon.shoo = 1; shoos++; msgs.add('SHOO!', x, y - 16, '#ffd400', 18); api.note(400, 0.08, 'square'); return; } ptr = [x, y]; last = [x, y]; },
      move(x, y, held) { ptr = [x, y]; if (held && last) { scrub(last[0], last[1], x, y); last = [x, y]; } else last = held ? [x, y] : null; },
      up() { last = null; },
      score: () => clean, get over() { return done; },
      hud: () => `${clean}% clean`,
    };
  });
})();

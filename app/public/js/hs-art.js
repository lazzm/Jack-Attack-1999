/* hs-art: the painted surfaces of Jack's house (canvas textures, all original): walls, carpets, the Artex ceiling, wood,
 * the space duvet, the road-map rug, posters, labels, the consoles' tops. HouseArt.t(name) gives the (cached) texture.
 * Kept apart from the rooms so the bedroom and downstairs share one look: warm, a bit worn, 1999. */
(function () {
  'use strict';
  const K = window.HouseKit; if (!K || window.HouseArt) return;
  const T = K.T, rnd = K.rnd;
  const FONT = '"Anton",Impact,"Arial Narrow Bold",sans-serif', UIF = 'Tahoma,Verdana,Arial,sans-serif', HAND = '"Comic Sans MS","Comic Sans",cursive';
  // ---- little painting helpers
  const grain = (g, w, h, n, a, seed, light) => { const r = rnd(seed || 3); for (let i = 0; i < n; i++) { const v = r(); g.fillStyle = (light ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + (a * (0.3 + v)).toFixed(3) + ')'; g.fillRect(r() * w, r() * h, 1 + r() * 1.5, 1 + r() * 1.5); } };
  const mottle = (g, w, h, n, col, rmax, seed) => { const r = rnd(seed || 5); for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, rr = 8 + r() * rmax; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const star = (g, x, y, r, n, inner) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n - Math.PI / 2, q = i % 2 ? r * (inner || 0.45) : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); };
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const text = (g, s, x, y, font, col, align, ls) => { g.font = font; g.fillStyle = col; g.textAlign = align || 'left'; g.textBaseline = 'alphabetic'; if (ls && g.letterSpacing !== undefined) g.letterSpacing = ls; g.fillText(s, x, y); if (g.letterSpacing !== undefined) g.letterSpacing = '0px'; };

  const fit = (g, s, maxW, size, font) => { g.font = size + 'px ' + font; const w = g.measureText(s).width; if (w > maxW) g.font = Math.floor(size * maxW / w) + 'px ' + font; };
  const P = {};
  // ================================================================ walls, floors, ceilings
  P.wallBlue = [256, 256, (g, w, h) => { // Jack's walls: a dusty navy emulsion, roller marks and all
    g.fillStyle = '#3b4766'; g.fillRect(0, 0, w, h);
    mottle(g, w, h, 40, 'rgba(70,86,120,.25)', 40, 11); mottle(g, w, h, 30, 'rgba(20,24,40,.2)', 30, 12);
    for (let x = 0; x < w; x += 3) { g.fillStyle = `rgba(255,255,255,${(Math.sin(x * 0.7) * 0.5 + 0.5) * 0.012})`; g.fillRect(x, 0, 2, h); }
    grain(g, w, h, 2600, 0.05, 13); grain(g, w, h, 900, 0.03, 14, true);
  }];
  P.border = [512, 64, (g, w, h) => { // the wallpaper border round the room at picture-rail height (rockets and planets, put up when he was 9)
    g.fillStyle = '#1d2747'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8b84a'; g.fillRect(0, 3, w, 2); g.fillRect(0, h - 5, w, 2);
    const r = rnd(21);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,230,${0.3 + r() * 0.5})`; g.fillRect(r() * w, 8 + r() * (h - 16), 1.5, 1.5); }
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 128;
      g.save(); g.translate(x, h / 2); g.rotate(-0.6);
      g.fillStyle = '#e8e4da'; g.beginPath(); g.ellipse(0, 0, 6, 16, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c8402a'; g.beginPath(); g.moveTo(-6, 6); g.lineTo(-11, 16); g.lineTo(-4, 12); g.fill(); g.beginPath(); g.moveTo(6, 6); g.lineTo(11, 16); g.lineTo(4, 12); g.fill();
      g.fillStyle = '#3a8ad0'; g.beginPath(); g.arc(0, -4, 2.6, 0, 7); g.fill();
      g.fillStyle = '#ffb030'; g.beginPath(); g.moveTo(-4, 16); g.lineTo(0, 26); g.lineTo(4, 16); g.fill();
      g.restore();
      const px = x + 64; g.fillStyle = ['#c8783a', '#5aa0d0', '#b04a8a', '#7ab04a'][i]; g.beginPath(); g.arc(px, h / 2, 11, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,240,200,.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(px, h / 2, 19, 5, -0.3, 0, 7); g.stroke();
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(px + 3, h / 2 + 3, 9, 0, 7); g.fill();
    }
    grain(g, w, h, 1200, 0.06, 22);
  }];
  P.artex = [256, 256, (g, w, h) => { // the swirly Artex ceiling every house had
    g.fillStyle = '#e9e5da'; g.fillRect(0, 0, w, h);
    const r = rnd(31);
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = r() * h, R = 10 + r() * 14;
      for (let k = 0; k < 7; k++) { g.strokeStyle = `rgba(${k % 2 ? 255 : 120},${k % 2 ? 255 : 112},${k % 2 ? 250 : 96},${k % 2 ? 0.35 : 0.13})`; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, R - k * 1.6, r() * 6, r() * 6 + 3.6); g.stroke(); }
    }
    grain(g, w, h, 2000, 0.04, 32);
  }];
  P.carpetBlue = [256, 256, (g, w, h) => { // short pile, blue-grey, a fleck in it
    g.fillStyle = '#4a5268'; g.fillRect(0, 0, w, h);
    const r = rnd(41);
    for (let i = 0; i < 16000; i++) { const v = r(); g.fillStyle = v < 0.45 ? 'rgba(30,34,48,.35)' : v < 0.9 ? 'rgba(110,120,150,.25)' : 'rgba(180,170,140,.35)'; g.fillRect(r() * w, r() * h, 1, 1 + r() * 1.5); }
    mottle(g, w, h, 14, 'rgba(0,0,0,.08)', 40, 42);
  }];
  P.carpetBeige = [256, 256, (g, w, h) => { // the landing and stairs: oatmeal twist, worn in the middle
    g.fillStyle = '#9c8e76'; g.fillRect(0, 0, w, h);
    const r = rnd(43);
    for (let i = 0; i < 16000; i++) { const v = r(); g.fillStyle = v < 0.5 ? 'rgba(80,66,48,.3)' : v < 0.93 ? 'rgba(200,188,160,.25)' : 'rgba(120,60,40,.3)'; g.fillRect(r() * w, r() * h, 1, 1 + r() * 1.5); }
  }];
  P.carpetRed = [256, 256, (g, w, h) => { // the lounge: a deep red patterned carpet (Mom chose it)
    g.fillStyle = '#6a1e22'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(200,150,80,.22)'; g.lineWidth = 3;
    for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x + 32, y + 6); g.quadraticCurveTo(x + 58, y + 32, x + 32, y + 58); g.quadraticCurveTo(x + 6, y + 32, x + 32, y + 6); g.stroke(); g.fillStyle = 'rgba(30,60,50,.35)'; g.beginPath(); g.arc(x + 32, y + 32, 6, 0, 7); g.fill(); }
    const r = rnd(44);
    for (let i = 0; i < 12000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(255,200,180,.08)'; g.fillRect(r() * w, r() * h, 1, 1.5); }
  }];
  P.lino = [256, 256, (g, w, h) => { // the kitchen floor: lino pretending to be tiles
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#d8d0bc' : '#b9a98a'; g.fillRect(x * 64, y * 64, 64, 64); }
    g.strokeStyle = 'rgba(90,80,60,.35)'; g.lineWidth = 1; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
    mottle(g, w, h, 30, 'rgba(120,100,70,.12)', 30, 45); grain(g, w, h, 3000, 0.05, 46);
  }];
  P.wallWarm = [256, 256, (g, w, h) => { // downstairs: magnolia (of course)
    g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h); mottle(g, w, h, 40, 'rgba(160,140,100,.12)', 40, 51); grain(g, w, h, 2400, 0.04, 52);
  }];
  P.wallpaperHall = [256, 256, (g, w, h) => { // the hall: woodchip paper, painted over twice
    g.fillStyle = '#d6cbb2'; g.fillRect(0, 0, w, h);
    const r = rnd(53); for (let i = 0; i < 1800; i++) { const x = r() * w, y = r() * h; g.fillStyle = 'rgba(255,255,245,.35)'; g.fillRect(x, y, 2 + r() * 2, 1 + r() * 2); g.fillStyle = 'rgba(90,80,60,.18)'; g.fillRect(x + 1, y + 2, 2 + r() * 2, 1); }
  }];
  P.wallpaperLounge = [256, 256, (g, w, h) => { // the lounge: regency stripes, cream and sage
    for (let x = 0; x < w; x += 32) { g.fillStyle = '#e2d6b8'; g.fillRect(x, 0, 20, h); g.fillStyle = '#b8bc96'; g.fillRect(x + 20, 0, 12, h); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 20, 0, 1, h); }
    grain(g, w, h, 2000, 0.04, 54); mottle(g, w, h, 20, 'rgba(120,100,60,.06)', 40, 55);
  }];
  P.tiles = [256, 256, (g, w, h) => { // kitchen splashback: white tiles with a fruit one every so often
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = '#efece4'; g.fillRect(x * 16, y * 16, 16, 16); }
    g.strokeStyle = '#b8b2a2'; g.lineWidth = 1.2; for (let i = 0; i <= 16; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 16); g.lineTo(w, i * 16); g.stroke(); }
    [[2, 3, '#d04a2a'], [9, 6, '#6aa03a'], [5, 11, '#e8b020'], [13, 13, '#d04a2a']].forEach(([x, y, c]) => { g.fillStyle = c; g.beginPath(); g.arc(x * 16 + 8, y * 16 + 9, 4, 0, 7); g.fill(); g.fillStyle = '#3a7a2a'; g.fillRect(x * 16 + 7, y * 16 + 2, 2, 3); });
    mottle(g, w, h, 20, 'rgba(255,255,255,.2)', 20, 56);
  }];
  // ================================================================ wood
  P.pine = [256, 256, K.PAINT.wood('#c99a5b', '110,70,30', 90)];
  P.pineDark = [256, 256, K.PAINT.wood('#a77a44', '80,48,20', 90)];
  P.deskWood = [256, 256, K.PAINT.wood('#5b3e26', '25,14,6', 110)];
  P.oak = [256, 256, K.PAINT.wood('#8a6036', '50,30,12', 100)];
  P.mdf = [128, 128, (g, w, h) => { g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, w, h); grain(g, w, h, 800, 0.03, 61); }];
  P.whiteGloss = [128, 128, (g, w, h) => { g.fillStyle = '#ebe7dc'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(0,0,0,${0.01 + (y % 7) * 0.002})`; g.fillRect(0, y, w, 1); } grain(g, w, h, 300, 0.03, 62); }];
  // ================================================================ fabrics
  P.duvet = [512, 512, (g, w, h) => { // a space duvet (Mom says he is too old for it; he is NOT)
    g.fillStyle = lin(g, 0, 0, w, h, [[0, '#13265a'], [1, '#0d1c46']]); g.fillRect(0, 0, w, h);
    const r = rnd(71);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,${230 + r() * 25},${150 + r() * 100},${0.4 + r() * 0.6})`; const x = r() * w, y = r() * h, s = r() < 0.15 ? 4 : 1.6; if (s > 3) { star(g, x, y, s, 5); g.fill(); } else g.fillRect(x, y, s, s); }
    [[90, 110, 38, '#d07a3a', 1], [370, 80, 22, '#7ab0e0', 0], [260, 300, 50, '#c8a050', 1], [80, 400, 26, '#b0b0c0', 0], [430, 420, 30, '#d04a4a', 0]].forEach(([x, y, R, c, ring]) => {
      const gr = g.createRadialGradient(x - R / 3, y - R / 3, R / 5, x, y, R); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
      if (ring) { g.strokeStyle = 'rgba(240,220,170,.7)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, R * 1.7, R * 0.4, -0.3, 0, 7); g.stroke(); }
    });
    g.save(); g.translate(200, 190); g.rotate(-0.5); g.fillStyle = '#eee'; g.fillRect(-10, -40, 20, 60); g.beginPath(); g.moveTo(-10, -40); g.quadraticCurveTo(0, -70, 10, -40); g.fill(); g.fillStyle = '#c33'; g.fillRect(-18, 10, 8, 16); g.fillRect(10, 10, 8, 16); g.fillStyle = '#fa3'; g.beginPath(); g.moveTo(-8, 22); g.lineTo(0, 46); g.lineTo(8, 22); g.fill(); g.restore();
    for (let y = 0; y < h; y += 4) { g.fillStyle = `rgba(255,255,255,${0.012 + (y % 16 === 0 ? 0.01 : 0)})`; g.fillRect(0, y, w, 1); }
    grain(g, w, h, 4000, 0.06, 72);
  }];
  P.sheet = [128, 128, (g, w, h) => { g.fillStyle = '#c9cfe0'; g.fillRect(0, 0, w, h); grain(g, w, h, 900, 0.04, 73); }];
  P.pillow = [128, 128, (g, w, h) => { g.fillStyle = '#e8e8ee'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.strokeStyle = 'rgba(120,120,140,.08)'; g.beginPath(); g.moveTo(0, i * 16 + 8); g.bezierCurveTo(40, i * 16, 80, i * 16 + 16, 128, i * 16 + 8); g.stroke(); } grain(g, w, h, 500, 0.04, 74); }];
  P.rug = [512, 320, (g, w, h) => { // the road-map play rug (the Micro Machines still live on it)
    g.fillStyle = '#3f7a3a'; g.fillRect(0, 0, w, h);
    mottle(g, w, h, 30, 'rgba(90,140,60,.3)', 40, 81);
    g.fillStyle = '#5a5a5e';
    const road = (x, y, ww, hh) => { g.fillStyle = '#56565c'; g.fillRect(x, y, ww, hh); g.strokeStyle = '#e8e0c0'; g.setLineDash([10, 10]); g.lineWidth = 2; g.beginPath(); if (ww > hh) { g.moveTo(x, y + hh / 2); g.lineTo(x + ww, y + hh / 2); } else { g.moveTo(x + ww / 2, y); g.lineTo(x + ww / 2, y + hh); } g.stroke(); g.setLineDash([]); };
    road(0, 120, w, 36); road(180, 0, 36, h); road(380, 0, 36, h); road(0, 250, 180, 30);
    g.fillStyle = '#3a6ad0'; g.beginPath(); g.ellipse(80, 60, 50, 30, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(70, 52, 20, 8, 0, 0, 7); g.fill();
    [[250, 40, '#c84a3a'], [300, 60, '#d8b04a'], [440, 200, '#c84a3a'], [260, 200, '#e8e0d0'], [470, 40, '#5a8ad0']].forEach(([x, y, c]) => { g.fillStyle = c; g.fillRect(x, y, 34, 26); g.fillStyle = '#8a2a1a'; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 17, y - 14); g.lineTo(x + 38, y); g.fill(); g.fillStyle = '#9ad0f0'; g.fillRect(x + 6, y + 8, 8, 7); g.fillRect(x + 20, y + 8, 8, 7); });
    for (let i = 0; i < 12; i++) { const r = rnd(82 + i); g.fillStyle = '#2a5a2a'; g.beginPath(); g.arc(20 + r() * 150, 170 + r() * 70, 9, 0, 7); g.fill(); }
    g.strokeStyle = '#7a2222'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); g.strokeStyle = '#c8c0a8'; g.lineWidth = 3; g.strokeRect(12, 12, w - 24, h - 24);
    grain(g, w, h, 6000, 0.08, 83);
  }];
  P.beanbag = [256, 256, (g, w, h) => { g.fillStyle='#a93932';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){g.fillStyle=(x+y)%4?'rgba(236,172,136,.055)':'rgba(50,14,16,.055)';g.fillRect(x,y,1,1)}grain(g,w,h,7000,0.035,91);mottle(g,w,h,18,'rgba(230,130,100,.035)',22,92); }];
  P.curtain = [256, 256, (g, w, h) => { g.fillStyle = '#20356e'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(0,0,0,${0.04 + (x % 8 === 0 ? 0.06 : 0)})`; g.fillRect(x, 0, 1, h); } for (let y = 0; y < h; y += 32) { g.fillStyle = 'rgba(255,220,120,.18)'; star(g, (y * 7) % w + 16, y + 16, 5, 5); g.fill(); } grain(g, w, h, 2000, 0.05, 93); }];
  // ================================================================ posters (each a canvas painting)
  P.posterShuttle = [300, 420, (g, w, h) => {
    const late = (() => { try { return Desk.today99().md >= 723; } catch (e) { return false; } })();
    g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#02030a'], [0.7, '#0c1638'], [1, '#1a2a5a']]); g.fillRect(0, 0, w, h);
    const r = rnd(101); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; const s = r() < 0.1 ? 2 : 1; g.fillRect(r() * w, r() * h * 0.7, s, s); }
    g.fillStyle = '#1a5ab0'; g.beginPath(); g.ellipse(150, 540, 340, 180, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(140,210,255,.7)'; g.lineWidth = 4; g.stroke();
    const fl = g.createRadialGradient(150, 340, 5, 150, 352, 80); fl.addColorStop(0, '#fffbe0'); fl.addColorStop(0.3, '#ffb23a'); fl.addColorStop(0.7, 'rgba(255,90,26,.6)'); fl.addColorStop(1, 'rgba(255,90,26,0)'); g.fillStyle = fl; g.beginPath(); g.ellipse(150, 352, 72, 70, 0, 0, 7); g.fill();
    g.fillStyle = '#e8742a'; rr(g, 141, 120, 18, 170, 9); g.fill();
    g.fillStyle = '#f4f4f4'; rr(g, 124, 140, 11, 160, 5); g.fill(); rr(g, 165, 140, 11, 160, 5); g.fill();
    g.beginPath(); g.moveTo(124, 140); g.lineTo(129.5, 122); g.lineTo(135, 140); g.fill(); g.beginPath(); g.moveTo(165, 140); g.lineTo(170.5, 122); g.lineTo(176, 140); g.fill();
    g.fillStyle = '#fafafa'; g.beginPath(); g.moveTo(150, 92); g.quadraticCurveTo(162, 104, 162, 136); g.lineTo(162, 262); g.lineTo(138, 262); g.lineTo(138, 136); g.quadraticCurveTo(138, 104, 150, 92); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.moveTo(150, 92); g.quadraticCurveTo(160, 100, 161, 116); g.lineTo(139, 116); g.quadraticCurveTo(140, 100, 150, 92); g.fill();
    g.fillStyle = '#ddd'; g.beginPath(); g.moveTo(138, 226); g.lineTo(112, 270); g.lineTo(138, 270); g.fill(); g.beginPath(); g.moveTo(162, 226); g.lineTo(188, 270); g.lineTo(162, 270); g.fill();
    g.fillStyle = '#1a3a9a'; g.fillRect(144, 150, 12, 5);
    text(g, 'STS-93', 150, 46, '40px ' + FONT, '#fff', 'center');
    text(g, late ? 'COLUMBIA · 23 JULY 1999' : 'COLUMBIA · LAUNCHING JULY 1999!', 150, 68, '700 12px ' + UIF, '#9ad0ff', 'center');
    text(g, 'REACH FOR THE STARS', 150, 410, '9px ' + UIF, '#cde', 'center');
  }];
  P.posterBand = [300, 420, (g, w, h) => {
    g.fillStyle = lin(g, 0, 0, w, h, [[0, '#ff2a8a'], [0.5, '#ffb000'], [1, '#00c0d0']]); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { g.save(); g.translate(150, 200); g.rotate(i * Math.PI / 7); g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-30, -400); g.lineTo(30, -400); g.fill(); g.restore(); }
    [[80, 270, 34], [150, 250, 38], [220, 270, 34]].forEach(([x, y, R], i) => { g.fillStyle = '#1a1a6a'; g.beginPath(); g.arc(x, y - R * 1.4, R * 0.55, 0, 7); g.fill(); rr(g, x - R * 0.75, y - R * 0.8, R * 1.5, R * 2.2, R * 0.5); g.fill(); g.fillStyle = '#ffd400'; g.fillRect(x - R * 0.4, y - R * 1.5, R * 0.8, R * 0.18); });
    g.save(); g.translate(150, 118); g.rotate(-0.06); g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = '#1a1a6a'; g.fillStyle = '#fff'; g.lineJoin = 'round';
    fit(g, 'THE MODEM', 262, 80, FONT); g.strokeText('THE MODEM', 0, 0); g.fillText('THE MODEM', 0, 0); fit(g, 'BOYS', 262, 96, FONT); g.strokeText('BOYS', 0, 82); g.fillText('BOYS', 0, 82); g.restore();
    g.fillStyle = '#1a1a6a'; g.fillRect(0, 370, w, 50); text(g, 'LIVE · DIAL-UP TOUR 99', 150, 400, '700 15px ' + UIF, '#ffd400', 'center');
  }];
  P.posterFilm = [300, 420, (g, w, h) => {
    g.fillStyle = lin(g, 0, 0, 0, h, [[0, '#000'], [0.6, '#1a0a2a'], [1, '#401a00']]); g.fillRect(0, 0, w, h);
    const sun = g.createRadialGradient(130, 130, 10, 150, 150, 110); sun.addColorStop(0, '#fffbe0'); sun.addColorStop(0.4, '#ffb000'); sun.addColorStop(0.75, '#a03000'); sun.addColorStop(1, 'rgba(160,48,0,0)'); g.fillStyle = sun; g.beginPath(); g.arc(150, 150, 110, 0, 7); g.fill();
    g.fillStyle = '#100808'; g.beginPath(); g.moveTo(0, 300); g.lineTo(60, 250); g.lineTo(110, 280); g.lineTo(170, 230); g.lineTo(230, 270); g.lineTo(300, 240); g.lineTo(300, 420); g.lineTo(0, 420); g.fill();
    g.fillStyle = '#2a2a3a'; g.beginPath(); g.moveTo(150, 200); g.lineTo(180, 230); g.lineTo(150, 222); g.lineTo(120, 230); g.fill(); // a spaceship
    g.strokeStyle = '#ff3a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(90, 330); g.lineTo(130, 290); g.stroke(); g.strokeStyle = '#3aff6a'; g.beginPath(); g.moveTo(210, 330); g.lineTo(170, 290); g.stroke();
    g.textAlign = 'center'; g.fillStyle = '#ffd84a'; fit(g, 'STAR', 270, 62, FONT); g.fillText('STAR', 150, 334); fit(g, 'SCRAPS', 270, 62, FONT); g.fillText('SCRAPS', 150, 388);
    text(g, 'EPISODE 0: THE PHANTOM MENU', 150, 408, '700 11px ' + UIF, '#ffd84a', 'center');
  }];
  P.posterGame = [300, 420, (g, w, h) => { // a free poster off the front of a games mag
    g.fillStyle = '#0a0a14'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) { g.fillStyle = 'rgba(80,140,255,.05)'; g.fillRect(0, y, w, 1); }
    g.strokeStyle = '#2a6ae0'; g.lineWidth = 2; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(0, 260 + i * 14); g.lineTo(w, 260 + i * 14); g.stroke(); } for (let i = -10; i < 20; i++) { g.beginPath(); g.moveTo(150, 250); g.lineTo(i * 30, 420); g.stroke(); }
    const sun = g.createLinearGradient(0, 120, 0, 250); sun.addColorStop(0, '#ffd400'); sun.addColorStop(1, '#ff2a8a'); g.fillStyle = sun; g.beginPath(); g.arc(150, 250, 90, Math.PI, 0); g.fill();
    g.fillStyle = '#0a0a14'; for (let i = 0; i < 6; i++) g.fillRect(60, 180 + i * 12, 180, 3 + i);
    g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#1a0a3a'; g.lineJoin = 'round'; fit(g, 'HYPER', 270, 64, FONT); g.strokeText('HYPER', 150, 72); g.fillStyle = '#3affff'; g.fillText('HYPER', 150, 72); fit(g, 'DRIVE 2000', 270, 58, FONT); g.strokeText('DRIVE 2000', 150, 132); g.fillStyle = '#ff2a8a'; g.fillText('DRIVE 2000', 150, 132);
    text(g, 'FREE WITH JACK ATTACK! ISSUE 9', 150, 410, '700 10px ' + UIF, '#9ab', 'center');
  }];
  P.posterRobot = [300, 420, (g, w, h) => {
    g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8b000'; for (let i = -10; i < 20; i++) { g.save(); g.translate(i * 40, 0); g.transform(1, 0, -0.5, 1, 0, 0); g.fillRect(0, 370, 20, 50); g.restore(); }
    g.fillStyle = '#5a5a60'; rr(g, 60, 170, 180, 120, 14); g.fill(); g.fillStyle = '#7a7a82'; rr(g, 70, 180, 160, 30, 8); g.fill();
    g.fillStyle = '#d02a1a'; g.beginPath(); g.moveTo(240, 210); g.lineTo(290, 180); g.lineTo(295, 196); g.lineTo(250, 240); g.fill();
    g.fillStyle = '#111'; [[80, 300], [220, 300]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 26, 0, 7); g.fill(); g.fillStyle = '#444'; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); g.fillStyle = '#111'; });
    g.fillStyle = '#ffd400'; g.beginPath(); g.arc(150, 230, 16, 0, 7); g.fill();
    g.textAlign = 'center'; fit(g, 'ROBO', 270, 74, FONT); g.fillStyle = '#ff3a1a'; g.fillText('ROBO', 150, 80); fit(g, 'RUMBLE', 270, 74, FONT); g.fillStyle = '#fff'; g.fillText('RUMBLE', 150, 150);
    text(g, 'BUILD IT · BASH IT · BIN IT', 150, 350, '700 14px ' + UIF, '#d8b000', 'center');
  }];
  P.timetable = [256, 360, (g, w, h) => { // his school timetable, Year 11 (GCSE year)
    g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, w, h);
    text(g, 'TIMETABLE - YEAR 11', 128, 26, '700 15px ' + UIF, '#1a3a8a', 'center');
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'], subj = [['Maths', 'English', 'Science', 'French', 'Games'], ['Science', 'IT', 'Maths', 'History', 'Art'], ['English', 'Maths', 'D&T', 'D&T', 'RE'], ['French', 'Science', 'English', 'Geog', 'PE'], ['Maths', 'History', 'IT', 'Science', 'Tutor']];
    g.strokeStyle = '#8a9ac8'; g.lineWidth = 1;
    days.forEach((d, i) => { text(g, d, 10, 64 + i * 58, '700 11px ' + UIF, '#a01a1a'); subj[i].forEach((s, j) => { g.strokeRect(50 + j * 40, 46 + i * 58, 40, 50); text(g, s, 70 + j * 40, 76 + i * 58, '10px ' + HAND, '#222', 'center'); }); });
    text(g, 'GCSEs IN JUNE!!! (help)', 128, 350, '700 13px ' + HAND, '#c01a1a', 'center');
  }];
  P.calendar = [256, 360, (g, w, h) => { // a 1999 calendar on the wall: this month, today ringed
    const t = (() => { try { return Desk.today99(); } catch (e) { const d = new Date(); return { m: d.getMonth() + 1, d: d.getDate() }; } })();
    const M = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a5a9a'; g.fillRect(0, 0, w, 150); const r = rnd(t.m * 7);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.6})`; g.fillRect(r() * w, r() * 150, 2, 2); }
    g.fillStyle = '#e8e4d8'; g.beginPath(); g.arc(70 + t.m * 9, 70, 30, 0, 7); g.fill();
    text(g, M[t.m - 1] + ' 1999', 128, 178, '24px ' + FONT, '#1a1a1a', 'center');
    const first = new Date(1999, t.m - 1, 1).getDay(), days = new Date(1999, t.m, 0).getDate();
    'MTWTFSS'.split('').forEach((d, i) => text(g, d, 22 + i * 34, 202, '700 11px ' + UIF, '#a01a1a', 'center'));
    for (let d = 1; d <= days; d++) { const k = (first + 6) % 7 + d - 1, x = 22 + (k % 7) * 34, y = 228 + Math.floor(k / 7) * 26; text(g, String(d), x, y, '12px ' + UIF, '#333', 'center'); if (d === t.d) { g.strokeStyle = '#d01a1a'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y - 4, 13, 11, 0, 0, 7); g.stroke(); } }
  }];
  // ================================================================ labels and little faces
  P.bookSpines = [256, 128, (g, w, h) => { // a row of revision guides and paperbacks
    const r = rnd(121); let x = 0; const cols = ['#c02a2a', '#2a5ab0', '#e8b020', '#2a8a4a', '#6a2a8a', '#e8e4d8', '#1a1a1a', '#d06a1a'];
    while (x < w) { const bw = 10 + r() * 16, c = cols[(r() * cols.length) | 0]; g.fillStyle = c; g.fillRect(x, 0, bw, h); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 1, 0, 1, h); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + bw - 1, 0, 1, h); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x + 3, 14, bw - 6, 3); g.fillRect(x + 3, h - 20, bw - 6, 2); x += bw; }
  }];
  P.cdSpines = [64, 256, (g, w, h) => { const r = rnd(131); for (let y = 0; y < h; y += 4) { const c = ['#c05a1a', '#2a4a90', '#a08a2a', '#8a2a2a', '#e0e0e8', '#2a6a3a', '#5a5a62', '#7a3a8a', '#1a1a1a'][(r() * 9) | 0]; g.fillStyle = c; g.fillRect(0, y, w, 3.4); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(8 + r() * 30, y + 1.2, 6 + r() * 14, 0.8); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, y + 3.4, w, 0.6); } }];
  P.vhsSpines = [256, 64, (g, w, h) => { const r = rnd(141); let x = 0; while (x < w) { const bw = 20; g.fillStyle = '#151515'; g.fillRect(x, 0, bw, h); g.fillStyle = r() < 0.5 ? '#f4f0e0' : '#ffe680'; g.fillRect(x + 3, 6, bw - 6, h - 12); g.fillStyle = '#334'; g.save(); g.translate(x + bw / 2 + 3, h - 10); g.rotate(-Math.PI / 2); g.font = '8px ' + HAND; g.fillText(['ROBOT WARS', 'TOP OF POPS', 'DO NOT TAPE', 'SIMPSONS', 'FOOTBALL', 'XMAS 98'][(r() * 6) | 0], 0, 0); g.restore(); x += bw + 1; } }];
  P.n64top = [256, 192, (g, w, h) => { g.fillStyle = '#2b2b2e'; g.fillRect(0, 0, w, h); g.fillStyle = '#232326'; rr(g, 60, 30, 136, 110, 20); g.fill(); g.fillStyle = '#121214'; rr(g, 84, 60, 88, 22, 5); g.fill(); g.fillStyle = '#3a3a3e'; rr(g, 20, 150, 40, 18, 5); g.fill(); rr(g, 196, 150, 40, 18, 5); g.fill(); text(g, 'ULTRA 64', 128, 120, '700 13px ' + UIF, '#555', 'center'); grain(g, w, h, 800, 0.05, 151, true); }];
  P.pstop = [256, 192, (g, w, h) => { g.fillStyle = '#bab6ad'; g.fillRect(0, 0, w, h); g.fillStyle = '#a9a59c'; g.beginPath(); g.arc(88, 96, 70, 0, 7); g.fill(); g.strokeStyle = '#8f8b83'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#c4c0b7'; g.beginPath(); g.arc(88, 96, 18, 0, 7); g.fill(); [[190, 60], [190, 100], [190, 140]].forEach(([x, y]) => { g.fillStyle = '#9a968e'; rr(g, x, y, 44, 26, 6); g.fill(); }); text(g, 'PLAYSPACE', 200, 182, 'italic 700 11px ' + UIF, '#777', 'center'); grain(g, w, h, 900, 0.04, 152); }];
  P.mdtop = [256, 192, (g, w, h) => { g.fillStyle = '#18181a'; g.fillRect(0, 0, w, h); g.fillStyle = '#222225'; g.beginPath(); g.arc(128, 96, 76, 0, 7); g.fill(); g.strokeStyle = '#3a3a3e'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#060606'; rr(g, 80, 86, 96, 16, 3); g.fill(); text(g, '16-BIT', 216, 176, 'italic 900 14px ' + UIF, '#c8c8c8', 'center'); grain(g, w, h, 800, 0.05, 153, true); }];
  P.dctop = [256, 192, (g, w, h) => { g.fillStyle = '#efeee8'; g.fillRect(0, 0, w, h); g.fillStyle = '#e2e1da'; g.beginPath(); g.ellipse(128, 90, 90, 70, 0, 0, 7); g.fill(); g.strokeStyle = '#c8c7c0'; g.lineWidth = 3; g.stroke(); g.strokeStyle = '#ff7a00'; g.lineWidth = 7; g.beginPath(); for (let i = 0; i < 80; i++) { const a = i / 80 * Math.PI * 4, R = 3 + i / 80 * 20; g.lineTo(206 + Math.cos(a) * R, 160 + Math.sin(a) * R); } g.stroke(); grain(g, w, h, 600, 0.03, 154); }];
  P.screenOff = [256, 192, (g, w, h) => { const gr = g.createRadialGradient(100, 70, 10, 128, 96, 170); gr.addColorStop(0, '#2c3632'); gr.addColorStop(0.6, '#121815'); gr.addColorStop(1, '#060807'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.ellipse(80, 50, 70, 30, -0.4, 0, 7); g.fill(); }];
  P.labelLost = [128, 64, (g, w, h) => { g.fillStyle = '#fffbe0'; g.fillRect(0, 0, w, h); text(g, 'LOST GAMES', 64, 26, '700 14px ' + HAND, '#c01a1a', 'center'); text(g, '(see PC)', 64, 48, '12px ' + HAND, '#333', 'center'); }];
  P.radiator = [128, 128, (g, w, h) => { g.fillStyle = '#ece9e0'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x + 3, 0, 1, h); } g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6); }];
  P.mag = [256, 340, (g, w, h) => { // JACK ATTACK! magazine cover
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#d01a1a'; g.fillRect(0, 0, w, 74);
    g.font = '52px ' + FONT; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('JACK ATTACK!', 128, 58);
    g.fillStyle = lin(g, 0, 80, 0, 300, [[0, '#2a4ad0'], [1, '#0a1a5a']]); g.fillRect(10, 84, 236, 210);
    g.fillStyle = '#ffd400'; star(g, 190, 130, 34, 12, 0.7); g.fill(); text(g, 'FREE', 190, 128, '16px ' + FONT, '#c01a1a', 'center'); text(g, 'CD!', 190, 146, '16px ' + FONT, '#c01a1a', 'center');
    g.fillStyle = '#3affff'; g.beginPath(); g.moveTo(40, 250); g.lineTo(110, 150); g.lineTo(150, 230); g.fill();
    text(g, 'DAYDREAM!', 20, 318, '30px ' + FONT, '#111'); text(g, '100s OF CHEATS INSIDE', 20, 334, '700 11px ' + UIF, '#c01a1a');
  }];
  P.magB = [256, 340, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd400'; g.fillRect(0, 0, w, 60); fit(g,'ULTRA 64 PLAYER',232,40,FONT);text(g,'ULTRA 64 PLAYER',128,46,g.font,'#111','center');g.fillStyle=lin(g,0,70,w,300,[[0,'#2a8a3a'],[1,'#e8b020']]);g.fillRect(10,70,236,220);fit(g,'ACORN QUEST TIPS',220,28,FONT);text(g,'ACORN QUEST TIPS',20,320,g.font,'#fff'); }];
  P.magC = [256, 340, (g, w, h) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a6ae0'; g.fillRect(0, 0, w, 64); text(g, 'PC ZONE OUT', 128, 48, '38px ' + FONT, '#fff', 'center'); g.fillStyle = lin(g, 0, 70, 0, 300, [[0, '#5a2a1a'], [1, '#1a0a0a']]); g.fillRect(10, 72, 236, 220); text(g, '10 DEMOS!', 20, 320, '28px ' + FONT, '#c01a1a'); }];
  P.floppyLabel = [128, 128, (g, w, h) => { g.fillStyle = '#1a1a1e'; g.fillRect(0, 0, w, h); g.fillStyle = '#9aa0a8'; g.fillRect(28, 0, 72, 40); g.fillStyle = '#5a6068'; g.fillRect(70, 6, 16, 28); g.fillStyle = '#f4f0e0'; g.fillRect(12, 56, 104, 66); g.strokeStyle = '#9ab'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(16, 74 + i * 12); g.lineTo(112, 74 + i * 12); g.stroke(); } }];
  P.lavaGlass = [64, 256, (g, w, h) => { g.fillStyle = lin(g, 0, 0, w, 0, [[0, '#a01a5a'], [0.4, '#ff4a9a'], [0.6, '#ff6aaa'], [1, '#a01a5a']]); g.fillRect(0, 0, w, h); }];
  P.cork = [256, 192, (g, w, h) => { g.fillStyle = '#b5884e'; g.fillRect(0, 0, w, h); const r = rnd(161); for (let i = 0; i < 6000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,50,20,.3)' : 'rgba(230,190,130,.25)'; g.fillRect(r() * w, r() * h, 1 + r(), 1 + r()); } }];
  P.photo = [128, 96, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = lin(g, 0, 8, 0, 80, [[0, '#5a9ad0'], [0.55, '#9ac8f0'], [0.56, '#3a8a5a'], [1, '#2a6a3a']]); g.fillRect(6, 6, w - 12, h - 22); g.fillStyle = '#c8865a'; [[44, 50], [76, 48]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillRect(x - 6, y + 6, 12, 18); }); text(g, 'me + Dave, swimming baths', 64, 90, '9px ' + HAND, '#333', 'center'); }];
  P.note = [128, 128, (g, w, h) => { g.fillStyle = '#fff38a'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, 0, w, 14); }];
  P.noteBlue = [128, 128, (g, w, h) => { g.fillStyle = '#9af0ff'; g.fillRect(0, 0, w, h); }];

  const cache = {};
  function t(name, o) {
    if (cache[name]) return cache[name];
    const p = P[name]; if (!p) { console.warn('hs-art: no', name); return null; }
    const tx = K.tex('art:' + name, p[0], p[1], p[2], o || {});
    return cache[name] = tx;
  }
  // a texture with world-scale tiling (the kit's uv option does the maths: one tile = `cm` centimetres)
  window.HouseArt = { P, t, rr, star, lin, text, grain, mottle, FONT, UIF, HAND };
  // fonts arrive late: repaint the texts once they're in
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for (const n in cache) { const tx = cache[n], p = P[n]; if (!tx || !p) continue; const g = tx.userData.g; g.clearRect(0, 0, p[0], p[1]); try { p[2](g, p[0], p[1]); } catch (e) {} tx.needsUpdate = true; } if (window.House && House.dirty) House.dirty(); }); } catch (e) {}
})();

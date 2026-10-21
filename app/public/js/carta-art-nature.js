/* carta-art-nature.js: JackCarta 99 pictures for Space, Dinosaurs and Puzzles & Toys articles (96x72 pixel art).
 * Each entry: article id -> { cap: caption under the picture (must be true!), draw(p, S) }. */
(function () {
  const A = window.Carta && Carta.art; if (!A) return;

  // ================================================================ local helpers
  const rgb = c => { if (c[0] === '#') { if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); } const m = c.match(/\d+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0]; };
  const toHex = v => '#' + v.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
  const mix = (c, d) => toHex(rgb(c).map(x => d > 0 ? x + (255 - x) * d : x * (1 + d))); // d>0 lighter, d<0 darker
  const blend = (a, b, k) => { const x = rgb(a), y = rgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * k)); };
  const rng = seed => { let s = seed | 0 || 1; return () => (s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff; };
  // a lit sphere: colAt(nx, ny, x, y) gives the surface colour (hex) at normalised coords; light from the top left
  function sphere(p, cx, cy, r, colAt, o) {
    o = o || {}; const L = o.L || [-0.55, -0.5, 0.67], night = o.night == null ? -0.72 : o.night;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = (x * x + y * y) / (r * r); if (d > 1) continue;
      const nx = x / r, ny = y / r, nz = Math.sqrt(1 - d), l = nx * L[0] + ny * L[1] + nz * L[2];
      let c = colAt(nx, ny, x, y, nz);
      if (l < 0) c = mix(c, night); else if (l < 0.18) c = ((x + y) & 1) ? mix(c, night) : mix(c, -0.35); else if (l < 0.4) c = mix(c, -0.18); else if (l > 0.93 && !o.flat) c = mix(c, 0.22);
      p.px(cx + x, cy + y, c);
    }
    return p;
  }
  const mapAt = (rows, pal, nx, ny, def) => { const h = rows.length, w = rows[0].length; const ch = (rows[Math.min(h - 1, Math.floor((ny + 1) / 2 * h))] || '')[Math.min(w - 1, Math.floor((nx + 1) / 2 * w))]; return pal[ch] || def; };
  const ringE = (p, cx, cy, rx, ry, c, part) => { for (let a = 0; a < 6.283; a += 0.01) { const y = Math.sin(a); if (part === 'back' && y > 0) continue; if (part === 'front' && y <= 0) continue; p.px(cx + Math.cos(a) * rx, cy + y * ry, c); } };
  const twinkle = (p, x, y, c) => p.px(x, y, c).px(x - 1, y, mix(c, -0.4)).px(x + 1, y, mix(c, -0.4)).px(x, y - 1, mix(c, -0.4)).px(x, y + 1, mix(c, -0.4));
  const crater = (p, x, y, r, base) => { p.disc(x, y, r, mix(base, -0.25)); p.disc(x + 0.6, y + 0.6, Math.max(0.5, r - 1), mix(base, -0.08)); p.px(x + r * 0.5, y + r * 0.5, mix(base, 0.25)); };

  A.add({
    // ---------------------------------------------------------------- the Sun and the planets
    sun: { cap: 'The Sun, with dark sunspots and loops of glowing gas leaping off its edge. Never look at the real one!', draw(p, S) {
      S.space(p, 61);
      const cx = 48, cy = 36, r = 27;
      for (let i = 0; i < 4; i++) p.disc(cx, cy, r + 5 - i, ['#401000', '#702000', '#a03800', '#d05000'][i]);
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.sqrt(x * x + y * y) / r; if (d > 1) continue; p.px(cx + x, cy + y, d > 0.92 ? '#e86000' : d > 0.8 ? '#ff9000' : d > 0.55 ? (((x * 3 + y * 7) % 5) ? '#ffb000' : '#ffc400') : d > 0.3 ? '#ffd030' : '#ffe880'); }
      [[-8, -6, 2.5], [-5, -4, 1.5], [9, 6, 2], [12, 8, 1.2], [-2, 12, 1.5]].forEach(([x, y, s]) => { p.disc(cx + x, cy + y, s + 1, '#c06000'); p.disc(cx + x, cy + y, s, '#5a1800'); });
      // prominences
      [[-0.9, 7], [0.6, 5], [2.4, 6]].forEach(([a, hgt]) => { for (let k = 0; k <= 1; k += 0.04) { const aa = a + (k - 0.5) * 0.35, rr = r + 1 + Math.sin(k * Math.PI) * hgt; p.px(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr, '#ff5020'); p.px(cx + Math.cos(aa) * (rr - 1), cy + Math.sin(aa) * (rr - 1), '#ff8030'); } });
    } },
    mercury: { cap: 'Mercury: a small, grey, cratered world, baked on one side and frozen on the other.', draw(p, S) {
      S.space(p, 11); p.disc(4, 4, 9, '#fff8c0'); p.disc(4, 4, 6, '#ffffff');
      const R = rng(7), cr = []; for (let i = 0; i < 26; i++) cr.push([(R() * 2 - 1) * 0.9, (R() * 2 - 1) * 0.9, 0.05 + R() * 0.12]);
      sphere(p, 52, 38, 24, (nx, ny) => { for (const [x, y, s] of cr) { const d = Math.hypot(nx - x, ny - y); if (d < s * 0.7) return '#6f6760'; if (d < s) return '#a8a098'; } return ((nx * 9 + ny * 13) | 0) % 3 ? '#8c847c' : '#948c84'; }, { L: [-0.75, -0.55, 0.37] });
    } },
    venus: { cap: 'Venus, wrapped in thick, pale yellow clouds that hide a surface hot enough to melt lead.', draw(p, S) {
      S.space(p, 12);
      sphere(p, 48, 36, 27, (nx, ny) => { const v = Math.sin(ny * 9 + Math.sin(nx * 4) * 1.6 + nx * 2); return v > 0.6 ? '#fff0c0' : v > -0.2 ? '#f0d890' : '#e0c070'; });
    } },
    earth: { cap: 'Earth from space: blue oceans, white clouds, and Africa and Europe in the sunshine.', draw(p, S) {
      S.space(p, 13);
      const M = ['........wwwwwwww........', '......wwwwwwwwwwww......', '...........ggg.gg.......', '..........g.gggggggg....', '.........gg.ggggggggg...', '..........gggggg.ggggg..', '...........gg..g...ggg..', '..........yyyyyyyyy.gg..', '.........yyyyyyyyyy.yyg.', '........yyyyyyyyyyy.yy..', '........yyyyyyyyyyyy....', '.........gggyyyyyyggg...', '...g.......gggggggggg...', '..ggg.......ggggggggg...', '..gggg......gggggggg....', '..ggggg.....ggggggg.....', '...gggg......gggggg..g..', '...ggg.......ggggg...g..', '....gg........ggg.......', '....g.........gg........', '........................', '........................', '...wwwwww......wwwww....', '.....wwwwwwwwwwwww......'];
      sphere(p, 48, 36, 28, (nx, ny, x, y) => { const cl = Math.sin(nx * 9 + ny * 4) + Math.sin(ny * 13 - nx * 3); if (cl > 1.75 && Math.abs(ny) > 0.25) return '#f4f8ff'; return mapAt(M, { g: '#3a9a2a', y: '#d8b860', w: '#f4f8ff' }, nx, ny, ((x + y) & 3) ? '#1a5ac8' : '#2266d0'); });
      p.ring(48, 36, 29, '#4080ff');
    } },
    moon: { cap: 'The Moon: grey dust, dark lava plains called "seas" and thousands of craters.', draw(p, S) {
      S.space(p, 14);
      const R = rng(3), cr = []; for (let i = 0; i < 30; i++) cr.push([(R() * 2 - 1), (R() * 2 - 1), 0.03 + R() * 0.09]);
      const maria = [[-0.25, -0.35, 0.28], [0.15, -0.15, 0.22], [-0.45, 0.1, 0.25], [0.3, 0.25, 0.18], [-0.1, 0.35, 0.15]];
      sphere(p, 48, 36, 29, (nx, ny) => { for (const [x, y, s] of cr) { const d = Math.hypot(nx - x, ny - y); if (d < s * 0.6) return '#8a8a8a'; if (d < s) return '#d8d8d8'; } if (maria.some(([x, y, s]) => Math.hypot(nx - x, (ny - y) * 1.2) < s)) return '#8c8c90'; return '#bcbcbc'; }, { L: [-0.7, -0.3, 0.65] });
    } },
    mars: { cap: 'Mars, the rusty Red Planet, with a white ice cap at its pole and dark markings.', draw(p, S) {
      S.space(p, 15); p.disc(84, 12, 1.5, '#a89080'); p.px(14, 60, '#a89080');
      sphere(p, 48, 37, 27, (nx, ny) => { if (ny < -0.82 + Math.sin(nx * 6) * 0.04) return '#f8f4f0'; const dk = Math.sin(nx * 5 + 1) * Math.cos(ny * 4) + Math.sin(nx * 11 + ny * 7) * 0.4; if (Math.abs(ny - 0.05 + nx * 0.15) < 0.04 && nx > -0.4 && nx < 0.5) return '#7a2a14'; return dk > 0.75 ? '#8a3a1a' : dk > 0.2 ? '#b8502a' : '#d06838'; });
    } },
    jupiter: { cap: 'Jupiter, the biggest planet: stripes of cloud and the Great Red Spot, a storm bigger than Earth.', draw(p, S) {
      S.space(p, 16); [[10, 14, 1], [86, 60, 1.2], [80, 16, 0.8], [14, 58, 1]].forEach(([x, y, r]) => p.disc(x, y, r, '#d8d0c0'));
      const B = ['#f0e4cc', '#d8b48c', '#f4e8d4', '#b07850', '#ecdcc0', '#c8986a', '#f0e0c8', '#a87048', '#e8d4b4', '#d0a880', '#e0c8a8'];
      sphere(p, 48, 36, 30, (nx, ny) => { const gx = (nx - 0.25) / 0.2, gy = (ny - 0.32) / 0.1; const g = gx * gx + gy * gy; if (g < 1) return g < 0.45 ? '#c8402a' : '#d86a4a'; const t = (ny + 1) / 2 + Math.sin(nx * 6 + ny * 30) * 0.012; return B[Math.min(B.length - 1, Math.floor(t * B.length))]; });
    } },
    saturn: { cap: 'Saturn and its famous rings, made of billions of chunks of ice and rock.', draw(p, S) {
      S.space(p, 17);
      const cx = 48, cy = 37, r = 17, RX = 44, RY = 11;
      const ringCol = (k) => k < 0.6 ? null : k < 0.7 ? '#8a7a5a' : k < 0.84 ? '#e8d8a8' : k < 0.87 ? null : k < 1 ? '#c8b888' : null;
      const ring = front => { for (let y = -RY; y <= RY; y++) for (let x = -RX; x <= RX; x++) { const k = Math.hypot(x / RX, y / RY); const c = ringCol(k); if (!c) continue; if (front ? y < 0 : y >= 0) continue; if (front && x * x + y * y < r * r && y < 0) continue; p.px(cx + x, cy + y, (x < -8 && ((x + y) & 1)) ? mix(c, 0.15) : c); } };
      ring(false);
      const B = ['#f0e0a8', '#e0c888', '#f4e4b8', '#d8bc80', '#f0dca8', '#c8a870'];
      sphere(p, cx, cy, r, (nx, ny) => B[Math.min(5, Math.floor((ny + 1) / 2 * 6 + nx * 0.2))]);
      // the front of the rings crosses in front of the planet
      for (let y = 0; y <= RY; y++) for (let x = -RX; x <= RX; x++) { const k = Math.hypot(x / RX, y / RY); const c = ringCol(k); if (c) p.px(cx + x, cy + y, c); }
      for (let x = -r + 2; x < r - 2; x++) p.px(cx + x, cy + 7 + Math.round(Math.abs(x) * 0.04), '#5a4a30');
    } },
    uranus: { cap: 'Uranus, a pale blue-green giant that rolls round the Sun tipped over on its side, with thin dark rings.', draw(p, S) {
      S.space(p, 18);
      const cx = 48, cy = 36, r = 21;
      for (const [rx, ry] of [[25, 31], [27, 33]]) for (let a = 0; a < 6.283; a += 0.008) { const x = Math.cos(a) * rx * 0.55, y = Math.sin(a) * ry; const X = x * 0.94 - y * 0.34, Y = x * 0.34 + y * 0.94; if (X > 0 || X * X + Y * Y > r * r) p.px(cx + X, cy + Y, '#5a7a88'); }
      sphere(p, cx, cy, r, (nx, ny) => Math.hypot(nx - 0.2, ny + 0.3) < 0.35 ? '#b8f4f4' : '#9ae4e8');
      for (const [rx, ry] of [[25, 31], [27, 33]]) for (let a = 0; a < 6.283; a += 0.008) { const x = Math.cos(a) * rx * 0.55, y = Math.sin(a) * ry; const X = x * 0.94 - y * 0.34, Y = x * 0.34 + y * 0.94; if (X <= 0 && X * X + Y * Y <= r * r) p.px(cx + X, cy + Y, '#6a90a0'); }
    } },
    neptune: { cap: 'Neptune: deep blue, very windy, with the Great Dark Spot seen by Voyager 2 in 1989.', draw(p, S) {
      S.space(p, 19);
      sphere(p, 48, 36, 26, (nx, ny) => { const g = Math.hypot((nx + 0.2) / 0.28, (ny + 0.2) / 0.15); if (g < 1) return g < 0.6 ? '#0a1a60' : '#18307a'; if (Math.abs(ny + 0.38 - nx * 0.05) < 0.03 && nx > -0.5 && nx < 0.2) return '#e0f0ff'; if (Math.abs(ny - 0.3) < 0.025 && nx > 0 && nx < 0.45) return '#c0e0ff'; return Math.sin(ny * 10) > 0.6 ? '#3a68e8' : '#2a54d8'; });
    } },
    pluto: { cap: 'Pluto, the ninth planet, and its big moon Charon, far out where the Sun is just a bright star.', draw(p, S) {
      S.space(p, 20); twinkle(p, 86, 10, '#fff8d0'); p.px(86, 8, '#fff').px(86, 12, '#fff').px(84, 10, '#fff').px(88, 10, '#fff');
      sphere(p, 40, 40, 16, (nx, ny) => Math.hypot(nx - 0.15, ny - 0.2) < 0.35 ? '#e8dcc8' : ((nx * 7 + ny * 5) | 0) % 2 ? '#b8a088' : '#c8b098', { L: [-0.6, -0.4, 0.7] });
      sphere(p, 68, 30, 8, () => '#9a9490', { L: [-0.6, -0.4, 0.7] });
    } },
    solar_system: { cap: 'The Sun and its nine planets in order (the sizes and distances are NOT to scale).', draw(p, S) {
      S.space(p, 21);
      for (let y = 0; y < 72; y++) { const hw = Math.sqrt(Math.max(0, 52 * 52 - (y - 36) * (y - 36))); const x1 = -42 + hw; if (x1 > 0) { p.rect(0, y, x1, 1, '#ffb000'); p.rect(Math.max(0, x1 - 2), y, 2, 1, '#e86000'); p.rect(0, y, Math.max(0, x1 - 5), 1, '#ffd040'); } }
      const sph = (x, r, col, o) => sphere(p, x, 36, r, typeof col === 'function' ? col : () => col, Object.assign({ L: [-1, 0, 0.35] }, o));
      sph(15, 1, '#9a9088'); sph(20, 2, '#f0d890'); sph(26, 2, (nx, ny) => nx > 0 ? '#3a9a2a' : '#2a6ad8'); sph(31, 1.5, '#c85a2a');
      sph(41, 6, (nx, ny) => ['#f0e4cc', '#c8986a', '#f0e0c8', '#b07850', '#e8d4b4'][Math.min(4, Math.floor((ny + 1) * 2.5))]);
      for (let x = -9; x <= 9; x++) p.px(56 + x, 36 + Math.round(x * 0.22), '#d8c898');
      sph(56, 4, '#e8d498'); for (let x = -9; x <= 9; x++) if (Math.abs(x) < 3) p.px(56 + x, 36 + Math.round(x * 0.22), '#d8c898');
      sph(67, 3, '#9ae4e8'); sph(76, 3, '#3060e0'); sph(84, 1, '#c8b098');
      p.text(2, 65, 'NOT TO SCALE!', '#9fd0ff');
    } },
    lego: { cap: 'A 2x4 brick and a little figure. Very painful to stand on.', draw(p, S) {
      S.carpet(p);
      // the brick, three-quarter view
      const Ax = 8, Ay = 48, Bx = 52, By = 48, Dx = 24, Dy = 32;
      p.opoly([[Ax, Ay], [Bx, By], [Bx, By + 16], [Ax, Ay + 16]], '#d01818');
      p.rect(Ax + 1, Ay + 1, Bx - Ax - 1, 1, '#f04040');
      p.opoly([[Bx, By], [Bx + (Dx - Ax), Dy], [Bx + (Dx - Ax), Dy + 16], [Bx, By + 16]], '#8a0808');
      p.opoly([[Ax, Ay], [Bx, By], [Bx + (Dx - Ax), Dy], [Dx, Dy]], '#f03030');
      const pt = (u, v) => [Ax + u * (Bx - Ax) + v * (Dx - Ax), Ay + u * (By - Ay) + v * (Dy - Ay)];
      for (const j of [1, 0]) for (let i = 0; i < 4; i++) { const [x, y] = pt((i + 0.5) / 4, (j + 0.5) / 2); p.ell(x, y, 3.5, 1.8, '#900808'); p.rect(x - 3, y - 3, 7, 3, '#b81010'); p.rect(x - 3, y - 3, 2, 3, '#e83030'); p.ell(x, y - 3, 3.5, 1.8, '#7a0606'); p.ell(x, y - 3.4, 2.8, 1.3, '#ff4a4a'); p.px(x - 1, y - 4, '#ffc0c0'); }
      // a little figure: yellow head with a stud, blue body, red legs
      const fx = 76;
      p.obox(fx + 2, 13, 4, 3, '#ffd400'); p.obox(fx - 1, 15, 10, 10, '#ffd400');
      p.px(fx + 2, 19, '#000').px(fx + 5, 19, '#000'); p.line(fx + 2, 22, fx + 5, 22, '#000'); p.px(fx + 1, 21, '#000').px(fx + 6, 21, '#000');
      p.opoly([[fx - 3, 25], [fx + 10, 25], [fx + 12, 39], [fx - 5, 39]], '#1f5ad8');
      p.obox(fx - 8, 26, 5, 11, '#1f5ad8'); p.obox(fx + 11, 26, 5, 11, '#1f5ad8');
      p.obox(fx - 8, 37, 5, 4, '#ffd400'); p.obox(fx + 11, 37, 5, 4, '#ffd400');
      p.obox(fx - 5, 39, 17, 4, '#c81010'); p.obox(fx - 5, 42, 8, 15, '#c81010'); p.obox(fx + 4, 42, 8, 15, '#c81010');
    } },
  });
  window.CartaNature = { mix, blend, rng, sphere, mapAt, ringE, twinkle, crater };
})();

// ---------------------------------------------------------------- batch 2: galaxies, comets, early spaceflight
(function () {
  const A = window.Carta && Carta.art, N = window.CartaNature; if (!A || !N) return;
  const { mix, rng, sphere, twinkle } = N;
  const earthLimb = (p, y0, r) => { for (let y = y0; y < 72; y++) for (let x = 0; x < 96; x++) { const dx = x - 48, dy = y - (y0 + r); const d = Math.sqrt(dx * dx + dy * dy); if (d > r) continue; p.px(x, y, d > r - 1.5 ? '#80c0ff' : (Math.sin(x * 0.3) + Math.cos(y * 0.5 + x * 0.1) > 1.2 ? '#3a8a2a' : (Math.sin(x * 0.11 + y * 0.9) > 0.95 ? '#f0f4ff' : '#1a5ac8'))); } };
  A.add({
    light_year: { cap: 'In one year, light travels about 9.5 million million km. That distance is one light-year.', draw(p, S) {
      S.space(p, 31);
      p.disc(10, 30, 9, '#e86000'); p.disc(10, 30, 7, '#ffb000'); p.disc(9, 29, 4, '#ffe880');
      for (let x = 20; x < 82; x++) { p.px(x, 30, '#fff8c0'); p.px(x, 29, 'rgba(255,248,192,.45)'); p.px(x, 31, 'rgba(255,248,192,.45)'); }
      p.poly([[82, 26], [90, 30], [82, 34]], '#fff8c0');
      twinkle(p, 92, 30, '#c0d8ff');
      p.obox(4, 46, 88, 9, '#f0d040'); for (let x = 6; x < 92; x += 4) p.rect(x, 47, 1, x % 20 === 6 ? 5 : 3, '#000');
      p.ctext(58, '1 LIGHT-YEAR =', '#9fd0ff'); p.ctext(65, '9,500,000,000,000 KM', '#ffd400');
    } },
    milky_way: { cap: 'Our galaxy, the Milky Way: a giant spiral of stars. The Sun is out in one of the arms.', draw(p, S) {
      p.fill('#020210'); p.stars(40, 41);
      const R = rng(9), pos = (arm, t) => { const a = t * 1.7 + arm * Math.PI, rr = 3 + t * 10; return [48 + Math.cos(a) * rr * 1.3, 33 + Math.sin(a) * rr * 0.62]; };
      for (let i = 0; i < 2600; i++) { const arm = i % 2, t = 0.15 + Math.pow(R(), 0.8) * 3.2; const [x, y] = pos(arm, t); const sp = 2 + t * 1.6; const c = R(); p.px(x + (R() - 0.5) * sp * 1.6, y + (R() - 0.5) * sp * 0.8, c < 0.3 ? '#a8b0f0' : c < 0.55 ? '#ffffff' : c < 0.7 ? '#ff9ad8' : c < 0.85 ? '#6a78c0' : '#d8e0ff'); }
      p.ell(48, 33, 9, 5, '#ffe8b0'); p.ell(48, 33, 6, 3, '#fff8e0'); p.ell(48, 33, 3, 1.5, '#ffffff');
      const [sx, sy] = pos(0, 2.35); p.disc(sx, sy, 1.5, '#ffd400'); p.ring(sx, sy, 3, '#ffd400');
      p.line(sx - 2, sy + 3, 14, 62, '#ffd400'); p.text(2, 64, 'YOU ARE HERE', '#ffd400');
    } },
    black_hole: { cap: 'An artist\'s idea of a black hole: hot gas swirls round it, but nothing gets out, not even light.', draw(p, S) {
      S.space(p, 42);
      const cx = 48, cy = 36;
      const disc = front => { for (let y = -14; y <= 14; y++) for (let x = -44; x <= 44; x++) { const k = Math.hypot(x / 44, y / 9); if (k > 1 || k < 0.32) continue; if (front !== (y > 0)) continue; const hot = 1 - k; p.px(cx + x, cy + y, hot > 0.55 ? '#fff8d0' : hot > 0.4 ? '#ffd040' : hot > 0.22 ? '#ff8000' : ((x + y) & 1) ? '#c03000' : '#702000'); } };
      disc(false);
      p.disc(cx, cy, 12, '#ffb040'); p.disc(cx, cy, 11, '#000');
      disc(true);
      for (let x = -11; x <= 11; x++) p.px(cx + x, cy, '#000');
    } },
    big_bang: { cap: 'The Big Bang: everything bursting out from a tiny, unbelievably hot point, very long ago.', draw(p, S) {
      p.fill('#000008');
      const R = rng(5);
      for (let i = 0; i < 60; i++) { const a = R() * 6.283, l = 20 + R() * 30, c = ['#ff4040', '#ffd400', '#40c0ff', '#ff80ff', '#ffffff', '#ff8000'][i % 6]; for (let k = 6; k < l; k += 1.5) p.px(48 + Math.cos(a) * k * 1.3, 36 + Math.sin(a) * k, k > l - 4 ? '#fff' : c); }
      for (let i = 0; i < 80; i++) { const a = R() * 6.283, k = 30 + R() * 30; p.px(48 + Math.cos(a) * k * 1.3, 36 + Math.sin(a) * k, '#8090ff'); }
      p.disc(48, 36, 10, '#ff8000'); p.disc(48, 36, 7, '#ffd400'); p.disc(48, 36, 4, '#ffffff');
    } },
    comets: { cap: 'A comet near the Sun: an icy head with two tails, always pointing away from the Sun.', draw(p, S) {
      S.space(p, 43);
      for (let y = 0; y < 72; y++) { const hw = Math.sqrt(Math.max(0, 30 * 30 - (y - 36) * (y - 36))); if (hw > 18) p.rect(0, y, hw - 18, 1, '#ffb000'); }
      p.disc(-10, 36, 20, '#ffd040');
      const hx = 34, hy = 40;
      for (let i = 0; i < 55; i++) { const k = i / 55; p.ell(hx + i * 1.05, hy - i * 0.25 - k * k * 10, 4 * (1 - k) + 1, 2.6 * (1 - k) + 0.5, `rgba(255,250,235,${0.4 * (1 - k)})`); }
      for (let i = 0; i < 60; i++) p.px(hx + i, hy + i * 0.06, `rgba(110,170,255,${0.85 - i / 70})`), p.px(hx + i, hy + 1 + i * 0.06, `rgba(110,170,255,${0.5 - i / 120})`);
      p.disc(hx, hy, 3, '#e8f8ff'); p.disc(hx - 0.5, hy - 0.5, 1.5, '#ffffff');
      p.text(3, 3, 'SUN', '#ffd400'); p.text(70, 62, 'TAILS', '#9fd0ff');
    } },
    halleys_comet: { cap: 'Halley\'s Comet, back about every 76 years. Its last visit was in 1986.', draw(p, S) {
      S.night(p, 44);
      for (let i = 0; i < 50; i++) { const k = i / 50; p.ell(30 + i * 1.1, 26 - i * 0.35, 4 * (1 - k) + 1, 2.5 * (1 - k) + 0.5, `rgba(240,240,255,${0.42 * (1 - k)})`); }
      p.disc(30, 26, 2.5, '#ffffff');
      p.poly([[0, 72], [0, 60], [14, 56], [26, 61], [40, 54], [58, 60], [74, 55], [96, 59], [96, 72]], '#081008');
      p.rect(64, 48, 5, 9, '#081008'); p.poly([[62, 48], [66.5, 43], [71, 48]], '#081008'); p.rect(66, 51, 1, 2, '#ffd400');
      p.text(4, 4, '1986', '#ffd400');
    } },
    hale_bopp: { cap: 'Comet Hale-Bopp over the rooftops in spring 1997, with its white dust tail and blue gas tail.', draw(p, S) {
      S.night(p, 45);
      const hx = 62, hy = 20;
      for (let i = 0; i < 44; i++) { const k = i / 44; p.ell(hx + i * 0.7, hy - i * 0.55 - k * k * 6, 3.5 * (1 - k) + 1, 2.4 * (1 - k) + 0.6, `rgba(255,250,235,${0.45 * (1 - k)})`); }
      for (let i = 0; i < 40; i++) p.px(hx + i * 0.95, hy - i * 0.35, `rgba(100,160,255,${0.9 - i / 45})`);
      p.disc(hx, hy, 2.5, '#fff');
      p.rect(0, 58, 96, 14, '#0a0a14');
      [[2, 46, 14], [18, 50, 12], [32, 44, 16], [50, 49, 13], [65, 45, 14], [81, 50, 15]].forEach(([x, y, w]) => { p.rect(x, y, w, 72 - y, '#141420'); p.poly([[x - 1, y], [x + w / 2, y - 6], [x + w + 1, y]], '#101018'); p.rect(x + 3, y + 4, 3, 3, '#ffd060'); if (w > 13) p.rect(x + w - 6, y + 4, 3, 3, '#ffe890'); p.rect(x + w - 4, y - 5, 2, 4, '#141420'); });
    } },
    shoemaker_levy_9: { cap: 'Comet Shoemaker-Levy 9, torn into a "string of pearls", about to smash into Jupiter in July 1994.', draw(p, S) {
      S.space(p, 46);
      const B = ['#f0e4cc', '#d8b48c', '#f4e8d4', '#b07850', '#ecdcc0', '#c8986a', '#f0e0c8'];
      sphere(p, 78, 40, 30, (nx, ny) => { if (Math.abs(ny - 0.42) < 0.06 && [[-0.75], [-0.6], [-0.45]].some(([x]) => Math.abs(nx - x) < 0.07)) return '#3a2010'; return B[Math.min(6, Math.floor((ny + 1) / 2 * 7))]; });
      for (let i = 0; i < 11; i++) { const x = 6 + i * 4.2, y = 10 + i * 2.2 + Math.sin(i) * 1.2; p.line(x - 4, y - 2, x, y, 'rgba(220,230,255,.45)'); p.disc(x, y, i % 3 === 0 ? 1.5 : 1, '#f0f8ff'); }
    } },
    eclipse_1999: { cap: 'Totality on 11 August 1999: the Moon hides the Sun and the pearly corona glows around it.', draw(p, S) {
      p.vgrad(0, 72, '#081028', '#203a60'); p.stars(18, 47);
      const cx = 48, cy = 28;
      for (let a = 0; a < 6.283; a += 0.05) { const l = 13 + Math.abs(Math.sin(a * 2)) * 10 + Math.sin(a * 7) * 2; for (let k = 13; k < l; k++) p.px(cx + Math.cos(a) * k, cy + Math.sin(a) * k * 0.9, `rgba(230,240,255,${0.55 - (k - 13) / (l - 13) * 0.5})`); }
      p.disc(cx, cy, 14, '#f8f8ff'); p.disc(cx, cy, 13, '#000');
      p.disc(cx + 9, cy - 9, 1.5, '#ffffff'); p.px(cx - 13, cy + 3, '#ff6080');
      p.poly([[0, 72], [0, 58], [20, 54], [40, 58], [60, 52], [96, 57], [96, 72]], '#0a1408');
      [[24, 52], [30, 53], [36, 53], [70, 50]].forEach(([x, y]) => { p.disc(x, y, 1.5, '#000'); p.rect(x - 1, y + 1, 3, 5, '#000'); });
    } },
    sputnik: { cap: 'Sputnik 1, a shiny metal ball with four long aerials: the first satellite, launched on 4 October 1957.', draw(p, S) {
      S.space(p, 48); earthLimb(p, 52, 90);
      const cx = 36, cy = 28;
      [[-3, 34, 2], [-1, 38, 8], [1, 37, 14], [3, 33, 20]].forEach(([dy, ex, ey]) => { p.line(cx + 5, cy + dy, cx + ex, cy + ey - 8, '#d0d4dc'); p.px(cx + ex, cy + ey - 8, '#fff'); });
      sphere(p, cx, cy, 10, () => '#c8ccd8', { L: [-0.6, -0.6, 0.53] });
      p.disc(cx - 4, cy - 4, 2, '#ffffff'); p.ring(cx, cy, 10, '#606878');
      p.text(4, 4, 'BEEP... BEEP...', '#9fd0ff');
    } },
    laika: { cap: 'Laika, a little dog from the streets of Moscow, looking out of Sputnik 2 in November 1957.', draw(p, S) {
      S.space(p, 49);
      p.opoly([[14, 66], [36, 10], [60, 10], [82, 66]], '#a8acb8'); p.rect(37, 11, 22, 2, '#d0d4e0'); for (let y = 20; y < 66; y += 9) p.line(14 + (66 - y) * 0.39 + 1, y, 82 - (66 - y) * 0.39 - 1, y, '#8a8e9a');
      p.odisc(48, 40, 17, '#505868'); p.disc(48, 40, 14, '#203048');
      // the dog: white face, dark ears, button eyes
      p.oell(48, 44, 9, 8, '#f4ecdc'); p.opoly([[38, 30], [44, 36], [39, 40]], '#5a4030'); p.opoly([[58, 30], [52, 36], [57, 40]], '#5a4030');
      p.ell(44, 40, 3, 2.5, '#c8a888'); p.disc(44, 41, 1.2, '#000').disc(52, 41, 1.2, '#000'); p.px(44, 40, '#fff').px(52, 40, '#fff');
      p.oell(48, 47, 3, 2, '#e8dccc'); p.disc(48, 46, 1.4, '#000'); p.line(46, 49, 50, 49, '#5a4030');
      p.ring(48, 40, 15, 'rgba(200,230,255,.5)'); p.line(40, 30, 44, 27, 'rgba(255,255,255,.6)');
    } },
    yuri_gagarin: { cap: 'Vostok 1: the ball-shaped capsule that took Yuri Gagarin once round the Earth on 12 April 1961.', draw(p, S) {
      S.space(p, 50); earthLimb(p, 50, 100);
      p.opoly([[52, 24], [72, 16], [80, 18], [80, 46], [72, 48], [52, 40]], '#9aa0aa'); p.rect(53, 31, 26, 2, '#70767e');
      for (let i = 0; i < 6; i++) p.odisc(60 + (i % 3) * 7, 20 + Math.floor(i / 3) * 24, 2, '#c8ccd4');
      p.thick(80, 32, 88, 32, '#555', 2);
      sphere(p, 40, 32, 15, (nx, ny) => (ny > 0.05 && ny < 0.35) ? '#e0e0e0' : '#7a8088', { L: [-0.6, -0.5, 0.62] });
      p.odisc(36, 27, 3, '#203048'); p.text(31, 37, 'CCCP', '#c00000');
    } },
    valentina_tereshkova: { cap: 'Vostok 6 and a seagull: Tereshkova\'s radio call sign in June 1963 was "Chaika", Russian for seagull.', draw(p, S) {
      S.space(p, 51); earthLimb(p, 54, 110);
      sphere(p, 34, 30, 13, (nx, ny) => (ny > 0.05 && ny < 0.35) ? '#e0e0e0' : '#7a8088', { L: [-0.6, -0.5, 0.62] });
      p.odisc(30, 26, 2.5, '#203048'); p.text(26, 34, 'CCCP', '#c00000');
      p.opoly([[45, 24], [62, 18], [68, 20], [68, 40], [62, 42], [45, 36]], '#9aa0aa');
      // a seagull, white with grey wingtips
      const gx = 76, gy = 14; p.thick(gx - 10, gy - 4, gx, gy, '#ffffff', 2); p.thick(gx, gy, gx + 10, gy - 4, '#ffffff', 2); p.line(gx - 11, gy - 5, gx - 8, gy - 4, '#555'); p.line(gx + 8, gy - 4, gx + 11, gy - 5, '#555'); p.oell(gx, gy + 1, 3, 1.6, '#ffffff', '#888'); p.px(gx + 3, gy + 1, '#ffb000');
    } },
  });
})();

// ---------------------------------------------------------------- batch 3: Moon landing, rockets, stations and probes
(function () {
  const A = window.Carta && Carta.art, N = window.CartaNature; if (!A || !N) return;
  const { mix, rng, sphere } = N;
  const earth = (p, cx, cy, r) => sphere(p, cx, cy, r, (nx, ny) => (Math.sin(nx * 5 + 1) + Math.cos(ny * 4) > 1.1 ? '#3a9a2a' : Math.sin(nx * 9 - ny * 7) > 0.8 ? '#f4f8ff' : '#1a5ac8'));
  const moonGround = (p, gy) => { p.rect(0, gy, 96, 72 - gy, '#9a9a9a'); p.dither(0, gy, 96, 72 - gy, '#8a8a8a'); p.rect(0, gy, 96, 1, '#b4b4b4'); const R = rng(4); for (let i = 0; i < 9; i++) { const x = R() * 96, y = gy + 3 + R() * (70 - gy), r = 2 + R() * 4; p.ell(x, y, r, r * 0.35, '#767676'); p.ell(x + 0.5, y - 0.3, r - 1, r * 0.25, '#888'); } };
  const lmDescent = (p, x, y) => { // gold foil octagon with legs
    p.opoly([[x - 12, y], [x + 12, y], [x + 14, y + 4], [x + 14, y + 10], [x - 14, y + 10], [x - 14, y + 4]], '#d8a020'); p.dither(x - 13, y + 2, 26, 8, '#b08010'); p.rect(x - 13, y + 2, 26, 1, '#f0c840');
    [[-14, -22], [14, 22]].forEach(([a, b]) => { p.thick(x + a, y + 8, x + b, y + 22, '#c8c8c8', 1); p.thick(x + a * 0.4, y + 10, x + b, y + 22, '#a0a0a0', 1); p.rect(x + b - 3, y + 22, 7, 2, '#c8c8c8'); });
  };
  const lmAscent = (p, x, y) => { p.opoly([[x - 11, y], [x - 7, y - 12], [x + 6, y - 14], [x + 12, y - 6], [x + 11, y], ], '#c8ccd4'); p.opoly([[x - 6, y - 10], [x - 1, y - 11], [x - 1, y - 5], [x - 6, y - 5]], '#203048'); p.rect(x + 2, y - 16, 1, 4, '#888'); p.disc(x + 2, y - 17, 2, '#e0e0e0'); p.rect(x + 6, y - 9, 4, 4, '#2a2a2a'); };
  A.add({
    apollo_11: { cap: 'The lunar module Eagle on the Sea of Tranquility, 20 July 1969, with the flag and the first footprints.', draw(p, S) {
      p.fill('#000'); p.stars(25, 53); earth(p, 82, 12, 7);
      moonGround(p, 50);
      lmDescent(p, 40, 30); lmAscent(p, 40, 30);
      p.rect(72, 30, 1, 22, '#e0e0e0'); p.rect(72, 30, 13, 1, '#e0e0e0'); for (let i = 0; i < 6; i++) p.rect(73, 31 + i, 12, 1, i % 2 ? '#ffffff' : '#c81818'); p.rect(73, 31, 5, 3, '#1a3aa0');
      [[56, 60], [60, 62], [64, 59], [68, 61], [63, 66], [58, 67]].forEach(([x, y]) => p.ell(x, y, 1.5, 0.8, '#5a5a5a'));
    } },
    neil_armstrong: { cap: 'Stepping off the lunar module\'s ladder onto the Moon, as Neil Armstrong was first to do in July 1969.', draw(p, S) {
      p.fill('#000'); p.stars(20, 54); earth(p, 14, 12, 6);
      moonGround(p, 56);
      // a lunar module leg with its ladder
      p.thick(66, 0, 74, 56, '#c8c8c8', 2); p.rect(70, 56, 12, 2, '#c8c8c8'); p.opoly([[62, 0], [96, 0], [96, 16], [62, 12]], '#d8a020'); p.dither(63, 1, 32, 12, '#b08010');
      for (let y = 14; y < 54; y += 6) p.rect(56 + (y - 14) * 0.18, y, 10, 1, '#a0a0a0'); p.line(56, 14, 63, 54, '#a0a0a0');
      // the astronaut
      const x = 44, y = 22;
      p.odisc(x, y, 7, '#f0f0f0'); p.oell(x + 1, y + 1, 5, 4, '#e8b020'); p.px(x - 1, y - 1, '#fff8c0');
      p.obox(x - 7, y + 6, 14, 16, '#f0f0f0'); p.obox(x - 9, y + 5, 4, 14, '#e8e8e8'); p.rect(x - 4, y + 10, 8, 4, '#c8c8c8'); p.px(x - 2, y + 11, '#e10600').px(x, y + 11, '#2a7ad8');
      p.obox(x + 7, y + 7, 4, 11, '#e8e8e8'); p.obox(x - 13, y + 7, 4, 11, '#e8e8e8'); p.obox(x + 7, y + 17, 4, 3, '#c0c0c0');
      p.obox(x - 6, y + 22, 6, 12, '#f0f0f0'); p.obox(x + 1, y + 22, 6, 9, '#f0f0f0'); p.obox(x - 7, y + 33, 8, 3, '#a8a8a8'); p.obox(x + 1, y + 30, 8, 3, '#a8a8a8');
      p.ell(38, 62, 2, 1, '#5a5a5a');
    } },
    saturn_v: { cap: 'A Saturn V Moon rocket, about 111 metres tall, beside its launch tower. Three stages of pure power.', draw(p, S) {
      p.vgrad(0, 66, '#3a80e8', '#c0e0ff'); p.rect(0, 66, 96, 6, '#707070');
      // launch tower
      p.rect(56, 6, 8, 60, '#b83020'); for (let y = 8; y < 64; y += 6) { p.line(56, y, 64, y + 6, '#7a1a10'); p.line(64, y, 56, y + 6, '#7a1a10'); } p.rect(54, 4, 12, 3, '#b83020'); [16, 30, 44].forEach(y => p.rect(48, y, 8, 2, '#8a2010'));
      const x = 40, w = 9;
      p.rect(x, 18, w, 48, '#f8f8f8'); p.rect(x, 18, 2, 48, '#ffffff'); p.rect(x + w - 2, 18, 2, 48, '#d8d8d8');
      p.rect(x - 1, 40, w + 2, 1, '#888'); p.rect(x - 1, 26, w + 2, 1, '#888');
      p.rect(x, 50, 4, 8, '#111'); p.rect(x + 4, 58, 5, 6, '#111'); p.rect(x, 30, 4, 4, '#111'); p.rect(x + 4, 34, 5, 3, '#111'); p.rect(x, 20, w, 1, '#111');
      p.poly([[x, 18], [x + 1, 11], [x + w - 1, 11], [x + w, 18]], '#e8e8e8'); p.rect(x + 2, 7, 5, 4, '#e8e8e8'); p.poly([[x + 2, 7], [x + 4.5, 3], [x + 7, 7]], '#c84020'); p.line(x + 4, 0, x + 4, 3, '#888');
      p.poly([[x - 3, 66], [x, 60], [x, 66]], '#222'); p.poly([[x + w + 3, 66], [x + w, 60], [x + w, 66]], '#222');
      p.rect(x + 1, 64, w - 2, 2, '#333');
    } },
    space_shuttle: { cap: 'The Space Shuttle lifting off: white orbiter, big orange fuel tank and two white rocket boosters.', draw(p, S) {
      p.vgrad(0, 72, '#2a60c0', '#a0d0ff');
      p.ell(38, 70, 30, 7, '#e8e8e8'); p.ell(20, 66, 12, 6, '#f4f4f4'); p.ell(58, 67, 14, 6, '#f0f0f0');
      // external tank
      p.rect(40, 8, 12, 50, '#d86a1a'); p.ell(46, 8, 6, 6, '#d86a1a'); p.poly([[40, 8], [46, 0], [52, 8]], '#c85a10'); p.rect(41, 8, 2, 50, '#e88a3a'); p.rect(40, 30, 12, 1, '#b85010');
      // boosters
      [36, 52].forEach(x => { p.obox(x, 14, 5, 44, '#f4f4f4'); p.poly([[x, 14], [x + 2.5, 8], [x + 5, 14]], '#f4f4f4'); p.rect(x, 54, 5, 4, '#888'); p.poly([[x - 1, 58], [x + 6, 58], [x + 2.5, 66]], '#ffd400'); p.poly([[x + 1, 58], [x + 4, 58], [x + 2.5, 63]], '#ffffff'); });
      // orbiter (front of the tank)
      p.opoly([[56, 20], [62, 14], [66, 22], [66, 52], [56, 52]], '#f8f8f8'); p.poly([[62, 14], [66, 22], [63, 22]], '#222'); p.rect(63, 22, 3, 30, '#2a2a2a');
      p.opoly([[56, 38], [74, 52], [56, 52]], '#f0f0f0'); p.line(57, 51, 73, 51, '#2a2a2a'); p.opoly([[56, 20], [52, 12], [56, 14]], '#e8e8e8');
      p.rect(57, 52, 7, 3, '#555'); p.poly([[57, 55], [64, 55], [60.5, 64]], '#ffe890');
    } },
    hubble: { cap: 'The Hubble Space Telescope: a silver tube with two big solar panels, above the blur of the atmosphere.', draw(p, S) {
      S.space(p, 55); p.ell(48, 92, 80, 30, '#1a5ac8'); p.ell(30, 68, 14, 4, '#3a9a2a'); p.ell(48, 92, 80, 30, 'rgba(0,0,0,0)');
      const ang = -0.35, c = Math.cos(ang), s = Math.sin(ang), T = (u, v) => [48 + u * c - v * s, 32 + u * s + v * c];
      const quad = (u0, v0, u1, v1, col) => p.opoly([T(u0, v0), T(u1, v0), T(u1, v1), T(u0, v1)], col);
      quad(-12, -24, -4, -9, '#3a3a8a'); quad(-12, 9, -4, 24, '#3a3a8a');
      for (let v = -23; v < -9; v += 3) p.line(...T(-12, v), ...T(-4, v), '#6a6ac8'); for (let v = 10; v < 24; v += 3) p.line(...T(-12, v), ...T(-4, v), '#6a6ac8');
      p.thick(...T(-8, -9), ...T(-8, 9), '#888', 1);
      quad(-24, -7, 20, 7, '#c8ccd4'); for (let u = -22; u < 20; u += 4) p.line(...T(u, -6), ...T(u, 6), '#a8acb4');
      quad(-24, -7, -10, 7, '#e0e4ec'); quad(20, -7, 24, 7, '#606878'); p.opoly([T(24, -7), T(30, -10), T(30, -6), T(24, -4)], '#c8ccd4');
    } },
    mir: { cap: 'The Mir space station: a cluster of modules and solar panels, added one piece at a time from 1986.', draw(p, S) {
      S.space(p, 56); p.ell(48, 96, 90, 34, '#1a5ac8'); p.ell(70, 68, 16, 4, '#3a9a2a');
      const mod = (x, y, w, h, col) => { p.obox(x, y, w, h, col || '#d8d8d0'); for (let i = x + 3; i < x + w - 1; i += 4) p.rect(i, y + 1, 1, h - 2, '#b8b8b0'); };
      const panel = (x, y, w, h) => { p.obox(x, y, w, h, '#2a3a8a'); for (let i = x + 2; i < x + w - 1; i += 3) p.rect(i, y + 1, 1, h - 2, '#5a6ac8'); };
      mod(20, 30, 46, 8); mod(66, 31, 10, 6, '#c8c8c0'); mod(8, 31, 12, 6, '#c8c8c0'); mod(40, 10, 7, 20); mod(40, 38, 7, 22); mod(26, 14, 6, 16);
      panel(48, 14, 22, 7); panel(18, 18, 8, 6); panel(48, 46, 18, 7); panel(14, 40, 22, 7); panel(70, 22, 6, 16); panel(4, 22, 6, 14);
    } },
    iss: { cap: 'The new International Space Station in 1999: just two joined parts, Zarya and Unity. Much more to come!', draw(p, S) {
      S.space(p, 57); p.ell(48, 98, 90, 34, '#1a5ac8'); p.ell(26, 68, 14, 4, '#3a9a2a'); p.ell(70, 70, 10, 3, '#f0f4ff');
      // Zarya: a long module with two solar wings
      p.obox(26, 30, 34, 10, '#c8ccc0'); for (let x = 30; x < 58; x += 5) p.rect(x, 31, 1, 8, '#a8aca0'); p.poly([[60, 30], [66, 32], [66, 38], [60, 40]], '#a8aca0');
      [[30, 10], [30, 42]].forEach(([x, y]) => { p.obox(x, y, 24, 18, '#2a3a8a'); for (let i = x + 3; i < x + 23; i += 4) p.rect(i, y + 1, 1, 16, '#5a6ac8'); p.rect(x, y + 8, 24, 1, '#5a6ac8'); });
      p.rect(41, 28, 2, 2, '#888').rect(41, 40, 2, 2, '#888');
      // Unity: a short node with docking adapters
      p.obox(12, 29, 14, 12, '#e8e8e0'); p.obox(8, 31, 4, 8, '#b8b8b0'); p.obox(16, 25, 6, 4, '#b8b8b0');
      p.text(12, 4, 'UNITY', '#9fd0ff'); p.text(38, 64, 'ZARYA', '#9fd0ff'); p.line(18, 10, 18, 24, '#9fd0ff'); p.line(44, 58, 44, 53, '#9fd0ff');
    } },
    voyager: { cap: 'A Voyager probe: a big dish aerial pointed at home and the golden record on its side.', draw(p, S) {
      S.space(p, 58); sphere(p, 86, 58, 14, (nx, ny) => ['#f0e0a8', '#d8bc80', '#f0dca8', '#c8a870'][Math.min(3, Math.floor((ny + 1) * 2))]); for (let x = -26; x <= 26; x++) p.px(86 + x, 58 + Math.round(x * 0.2), '#e8d8a8');
      p.oell(38, 22, 20, 10, '#f0f0f0'); p.ell(38, 22, 16, 7, '#d8d8e0'); p.ell(38, 22, 3, 2, '#888'); p.line(38, 22, 38, 12, '#888');
      p.opoly([[30, 30], [46, 30], [48, 40], [28, 40]], '#c8ccd4'); p.odisc(38, 36, 3, '#e8b020'); p.disc(38, 36, 1, '#8a6010');
      p.thick(46, 36, 76, 48, '#a0a0a0', 1); p.obox(74, 46, 4, 4, '#888');
      p.thick(30, 38, 12, 52, '#a0a0a0', 1); p.obox(8, 50, 6, 6, '#707070');
      p.thick(28, 31, 6, 26, '#888', 1);
    } },
    mars_pathfinder: { cap: 'Mars Pathfinder\'s lander with its petals open, and the little six-wheeled Sojourner rover, July 1997.', draw(p, S) {
      p.vgrad(0, 38, '#d8a888', '#e8c0a0'); p.rect(0, 38, 96, 34, '#b8582a'); p.dither(0, 38, 96, 34, '#a04a20'); p.rect(0, 38, 96, 1, '#c87040');
      [[8, 44, 5], [84, 46, 4], [70, 64, 6], [30, 66, 3]].forEach(([x, y, r]) => { p.oell(x, y, r, r * 0.6, '#7a3a1a'); p.px(x - 1, y - 1, '#a05a30'); });
      // the lander: base with three open petals covered in solar cells, and deflated airbags
      p.oell(34, 48, 22, 6, '#e8e0d0'); p.dither(13, 44, 42, 8, '#c8c0b0');
      p.opoly([[34, 46], [12, 52], [16, 58], [36, 52]], '#2a3a7a'); p.opoly([[34, 46], [56, 52], [52, 58], [32, 52]], '#2a3a7a'); p.opoly([[30, 46], [38, 46], [42, 38], [26, 38]], '#2a3a7a');
      p.obox(28, 42, 12, 8, '#d8d8d0'); p.rect(33, 30, 2, 12, '#888'); p.obox(31, 27, 6, 4, '#e8e8e8'); p.px(32, 28, '#000').px(35, 28, '#000');
      // Sojourner
      const x = 66, y = 52; p.obox(x, y - 7, 16, 3, '#2a3a7a'); for (let i = x + 2; i < x + 15; i += 3) p.rect(i, y - 6, 1, 1, '#5a6ac8'); p.obox(x + 2, y - 4, 12, 4, '#d8d8d0');
      [x + 1, x + 8, x + 15].forEach(wx => { p.odisc(wx, y + 2, 2, '#404040'); }); p.line(x + 1, y + 2, x + 15, y + 2, '#808080'); p.rect(x + 14, y - 11, 1, 4, '#888');
      p.ell(55, 56, 6, 1, '#8a3a1a');
    } },
    galileo_probe: { cap: 'The Galileo spacecraft at Jupiter. Its big umbrella aerial got stuck half-open, so it used a small one.', draw(p, S) {
      S.space(p, 59);
      sphere(p, 82, 62, 34, (nx, ny) => ['#f0e4cc', '#d8b48c', '#f4e8d4', '#b07850', '#ecdcc0', '#c8986a'][Math.min(5, Math.floor((ny + 1) * 3))]);
      // the stuck umbrella aerial: a few ribs open, the rest bunched
      const cx = 32, cy = 22; for (let i = 0; i < 9; i++) { const a = -2.6 + i * 0.32, l = i % 3 === 1 ? 14 : 8; p.line(cx, cy, cx + Math.cos(a) * l, cy + Math.sin(a) * l, '#e8e8e8'); }
      p.poly([[cx, cy], [cx - 10, cy - 8], [cx - 4, cy - 12]], 'rgba(220,220,220,.6)');
      p.obox(cx - 6, cy + 1, 12, 8, '#c8ccd4'); p.obox(cx - 3, cy + 9, 6, 6, '#a8acb4');
      p.thick(cx + 6, cy + 5, cx + 26, cy + 10, '#a0a0a0', 1); p.obox(cx + 25, cy + 8, 4, 4, '#707070'); p.thick(cx - 6, cy + 5, cx - 24, cy + 14, '#a0a0a0', 1); p.obox(cx - 28, cy + 12, 5, 5, '#707070');
      p.thick(cx, cy + 15, cx, cy + 30, '#a0a0a0', 1);
      p.odisc(62, 46, 2, '#d8a050'); p.line(60, 44, 56, 40, 'rgba(255,160,64,.6)');
    } },
    telescope: { cap: 'A telescope on a tripod, pointed at the Moon. Galileo first did this in 1609.', draw(p, S) {
      S.night(p, 60); sphere(p, 80, 14, 8, (nx, ny) => Math.hypot(nx + 0.2, ny + 0.1) < 0.35 ? '#909098' : '#d8d8d8', { L: [-0.7, -0.3, 0.65] });
      p.rect(0, 62, 96, 10, '#0a1a0a');
      p.opoly([[18, 50], [60, 22], [64, 28], [22, 56]], '#f0f0f0'); p.opoly([[58, 20], [66, 15], [72, 25], [64, 30]], '#d0d0d8'); p.oell(69, 20, 2.5, 5, '#203048');
      p.opoly([[16, 49], [20, 46], [24, 53], [20, 56]], '#606068'); p.thick(38, 38, 40, 44, '#555', 2);
      p.thick(40, 44, 28, 66, '#7a4a1a', 2); p.thick(40, 44, 40, 68, '#7a4a1a', 2); p.thick(40, 44, 54, 66, '#7a4a1a', 2);
    } },
  });
})();

// ---------------------------------------------------------------- batch 4: dinosaurs and other prehistoric creatures
(function () {
  const A = window.Carta && Carta.art, N = window.CartaNature; if (!A || !N) return;
  const { mix, rng } = N;
  const fern = (p, x, y, c) => { for (let i = 0; i < 5; i++) p.line(x, y, x - 6 + i * 3, y - 8 + Math.abs(i - 2) * 1.5, c || '#1f5e14'); };
  const palm = (p, x, y, h) => { p.thick(x, y, x + 2, y - h, '#6a4a2a', 2); for (let i = 0; i < 6; i++) { const a = -2.9 + i * 0.55; p.thick(x + 2, y - h, x + 2 + Math.cos(a) * 10, y - h + Math.sin(a) * 5 + 4, '#2a7a20', 1); } };
  const eye = (p, x, y) => p.px(x, y, '#fff').px(x + 1, y, '#000').px(x, y - 1, '#000');
  // T. rex facing right, used by several pictures: (x, y) = hip position, k = scale
  function rex(p, x, y, col, k) {
    k = k || 1; const T = (a, b) => [x + a * k, y + b * k], P = pts => pts.map(([a, b]) => T(a, b));
    const dk = mix(col, -0.35), lt = mix(col, 0.35);
    p.opoly(P([[-34, -4], [-8, -8], [-6, 4], [-30, 0]]), col);                                  // tail
    p.opoly(P([[-4, 2], [4, 2], [2, 12], [5, 22], [-3, 22], [-4, 12]]), dk);                      // far leg
    p.oell(...T(2, -2), 14 * k, 9 * k, col); p.ell(...T(4, 1), 9 * k, 4 * k, lt);                    // body + belly
    p.opoly(P([[6, -6], [16, -16], [22, -10], [14, 2]]), col);                                    // neck
    p.opoly(P([[14, -24], [34, -24], [38, -18], [38, -14], [16, -12], [12, -18]]), col);          // upper jaw
    p.opoly(P([[18, -12], [36, -13], [34, -8], [20, -7]]), mix(col, -0.15));                      // lower jaw
    for (let i = 0; i < 6; i++) p.px(...T(20 + i * 3, -12), '#fff');
    eye(p, ...T(20, -20)); p.line(...T(18, -22), ...T(23, -22), dk);
    p.line(...T(14, -2), ...T(19, 2), col); p.px(...T(20, 2), dk).px(...T(20, 3), dk);           // the famously tiny two-fingered arm
    p.opoly(P([[-2, 0], [8, 0], [10, 10], [6, 20], [12, 22], [12, 24], [0, 24], [2, 10]]), col); // near leg
  }
  A.add({
    dinosaurs: { cap: 'Dinosaurs ruled the land for about 165 million years. Here are a few of them, all at once!', draw(p, S) {
      S.prehist(p, 58);
      // a long-necked giant at the back, browsing a tree
      const b = '#7a8aa0', bd = mix(b, -0.3); palm(p, 52, 58, 30);
      p.obox(30, 44, 5, 16, bd); p.obox(12, 46, 5, 14, bd);
      p.opoly([[4, 50], [-4, 58], [-2, 60], [10, 52]], b);
      p.opoly([[6, 48], [12, 40], [30, 36], [38, 40], [36, 50], [10, 52]], b); p.ell(22, 48, 10, 2, mix(b, 0.25));
      p.opoly([[30, 38], [42, 10], [47, 10], [37, 44]], b); p.oell(47, 10, 5, 3, b); eye(p, 48, 9);
      p.obox(34, 44, 5, 16, b); p.obox(16, 46, 5, 14, b);
      // a horned plant-eater in front
      const t = '#b07a48', td = mix(t, -0.3);
      p.obox(30, 62, 4, 7, td); p.obox(44, 62, 4, 7, td);
      p.opoly([[20, 58], [26, 56], [26, 62]], t); p.oell(38, 60, 12, 6, t); p.ell(38, 63, 9, 2, mix(t, 0.25));
      p.odisc(50, 55, 7, '#c8986a', '#5a3a20'); p.ring(50, 55, 4, '#a87a4a');
      p.opoly([[48, 56], [58, 56], [64, 62], [60, 66], [50, 64]], t); p.opoly([[62, 61], [66, 63], [62, 65]], '#5a4030');
      p.thick(53, 55, 62, 48, '#fff8e0', 1); p.thick(51, 55, 59, 47, '#e8dcc0', 1); p.line(59, 58, 61, 55, '#fff8e0'); eye(p, 55, 59);
      p.obox(34, 62, 4, 8, t); p.obox(48, 62, 4, 8, t);
      // and a hungry meat-eater striding in from the right
      rex(p, 74, 44, '#4a8a3a', 0.48);
      fern(p, 90, 70); fern(p, 8, 70);
    } },
    tyrannosaurus: { cap: 'Tyrannosaurus rex: a huge head full of banana-sized teeth, and very silly tiny two-fingered arms.', draw(p, S) {
      S.prehist(p, 60); fern(p, 8, 66); fern(p, 88, 68);
      rex(p, 44, 36, '#4a8a3a', 1);
    } },
    triceratops: { cap: 'Triceratops, the "three-horned face", with its big bony frill.', draw(p, S) {
      S.prehist(p, 58); fern(p, 10, 66);
      const c = '#a8784a', dk = mix(c, -0.35);
      p.opoly([[6, 36], [18, 32], [20, 42], [8, 41]], c);
      p.obox(20, 44, 7, 14, dk); p.obox(46, 44, 7, 14, dk);
      p.oell(34, 38, 20, 12, c); p.ell(36, 45, 15, 3, mix(c, 0.25));
      p.obox(24, 44, 7, 15, c); p.obox(50, 44, 7, 15, c);
      // the frill: a fan behind the head, with a scalloped edge
      for (let a = -2.6; a <= 0.4; a += 0.18) p.odisc(62 + Math.cos(a) * 15, 34 + Math.sin(a) * 15, 2.5, '#c8986a', '#5a3a20');
      p.odisc(62, 34, 15, '#c8986a', '#5a3a20'); p.ring(62, 34, 11, '#a87a4a');
      // the head and beak, with a short nose horn and two long brow horns
      p.opoly([[56, 30], [74, 30], [90, 42], [86, 48], [70, 48], [58, 42]], c);
      p.opoly([[86, 42], [92, 44], [88, 48]], '#5a4030');
      p.opoly([[80, 37], [84, 28], [86, 38]], '#fff8e0');
      p.opoly([[70, 31], [90, 12], [74, 34]], '#fff8e0'); p.opoly([[64, 31], [80, 14], [68, 34]], '#e8dcc0');
      eye(p, 72, 36); p.line(70, 44, 82, 45, dk);
    } },
    stegosaurus: { cap: 'Stegosaurus: two rows of plates along its back and four spikes on its tail. Brain the size of a walnut.', draw(p, S) {
      S.prehist(p, 58); fern(p, 86, 66);
      const c = '#7a9a3a', dk = mix(c, -0.35);
      for (let i = 0; i < 8; i++) { const x = 24 + i * 6, t = Math.sin((i + 0.5) / 8 * Math.PI), y = 34 - t * 8; p.opoly([[x - 4, y + 4], [x + 1, y - 6 - t * 6], [x + 5, y + 4]], i % 2 ? '#c84a2a' : '#e06a3a'); }
      p.opoly([[22, 38], [4, 30], [2, 34], [20, 44]], c);
      [[4, 30, -2, 24], [7, 31, 4, 24], [3, 34, -3, 36], [6, 34, 2, 40]].forEach(([a, b, c2, d]) => p.thick(a, b, c2, d, '#f0e8d0', 1));
      p.oell(46, 40, 26, 10, c); p.ell(46, 46, 20, 3, mix(c, 0.3));
      p.opoly([[70, 40], [84, 42], [88, 46], [84, 50], [70, 48]], c); eye(p, 82, 44);
      p.obox(28, 46, 7, 13, dk); p.obox(36, 46, 7, 13, c); p.obox(58, 46, 6, 13, dk); p.obox(64, 46, 6, 13, c);
    } },
    velociraptor: { cap: 'The real Velociraptor was only about knee-high, with a big curved claw on each foot. Here it is next to a welly boot.', draw(p, S) {
      S.desert(p, 56);
      const c = '#b0783a', dk = mix(c, -0.35);
      p.opoly([[4, 30], [30, 32], [30, 36], [6, 33]], c);
      p.oell(38, 34, 10, 5, c); p.ell(39, 36, 7, 2, mix(c, 0.3));
      p.opoly([[44, 30], [52, 20], [56, 22], [50, 34]], c);
      p.opoly([[50, 16], [66, 18], [66, 21], [52, 23]], c); eye(p, 55, 18); for (let i = 0; i < 4; i++) p.px(56 + i * 3, 21, '#fff');
      p.line(46, 36, 52, 42, c); p.line(52, 42, 55, 40, dk); p.px(55, 39, '#fff');
      [[34, dk], [40, c]].forEach(([x, col]) => { p.thick(x, 38, x - 2, 46, col, 2); p.thick(x - 2, 46, x + 2, 56, col, 2); p.line(x + 2, 56, x + 7, 56, col); p.line(x + 2, 55, x + 3, 51, '#fff8e0'); p.px(x + 4, 51, '#fff8e0'); });
      for (let x = 10; x < 30; x += 4) p.px(x, 31, dk);
      // a welly boot for scale
      p.opoly([[70, 22], [84, 22], [84, 50], [92, 52], [92, 58], [70, 58]], '#2a7a2a'); p.rect(71, 23, 2, 34, '#4aa04a'); p.rect(70, 56, 22, 2, '#1a4a1a');
    } },
    brachiosaurus: { cap: 'Brachiosaurus, the "arm lizard": longer front legs and a neck held high to reach the treetops.', draw(p, S) {
      S.prehist(p, 62); p.thick(86, 62, 86, 20, '#6a4a2a', 3); p.oell(82, 16, 14, 9, '#2a7a20'); p.oell(90, 22, 8, 6, '#3a8a2a');
      const c = '#8aa0b8', dk = mix(c, -0.35);
      p.opoly([[10, 46], [2, 52], [4, 54], [16, 50]], c);
      p.obox(20, 46, 7, 17, dk); p.obox(44, 42, 7, 21, dk);
      p.opoly([[14, 48], [24, 38], [50, 32], [58, 38], [56, 50], [16, 52]], c); p.ell(36, 48, 16, 3, mix(c, 0.3));
      p.opoly([[50, 34], [64, 6], [70, 6], [58, 38]], c);
      p.oell(70, 7, 6, 3.5, c); p.ell(68, 4, 2, 1.5, mix(c, -0.15)); eye(p, 70, 6);
      p.obox(26, 46, 7, 17, c); p.obox(50, 40, 7, 23, c);
    } },
    diplodocus: { cap: 'Diplodocus: about 27 metres long, most of it neck and whip-like tail.', draw(p, S) {
      S.prehist(p, 58);
      const c = '#9a8a6a', dk = mix(c, -0.35);
      p.thick(2, 38, 30, 36, c, 2); p.thick(2, 38, 0, 40, c, 1); p.opoly([[18, 34], [32, 32], [32, 40], [20, 40]], c);
      p.obox(36, 42, 5, 16, dk); p.obox(54, 42, 5, 16, dk);
      p.oell(46, 38, 15, 7, c); p.ell(46, 42, 11, 2, mix(c, 0.3));
      p.opoly([[58, 34], [78, 24], [84, 22], [84, 26], [78, 28], [60, 40]], c);
      p.oell(88, 24, 5, 2.6, c); eye(p, 88, 23);
      p.obox(40, 42, 5, 16, c); p.obox(58, 42, 5, 16, c);
    } },
    iguanodon: { cap: 'Iguanodon, one of the first dinosaurs ever found, with a big spike on each thumb.', draw(p, S) {
      S.prehist(p, 60); fern(p, 86, 68);
      const c = '#6a8a4a', dk = mix(c, -0.35);
      p.opoly([[6, 54], [30, 38], [34, 46], [10, 58]], c);
      p.obox(30, 46, 7, 14, dk); p.rect(28, 58, 10, 2, dk);
      p.oell(42, 36, 12, 13, c); p.ell(45, 40, 7, 8, mix(c, 0.3));
      p.opoly([[46, 24], [54, 14], [60, 18], [52, 30]], c);
      p.opoly([[52, 10], [68, 12], [70, 16], [56, 20], [52, 16]], c); eye(p, 58, 13); p.line(64, 16, 69, 15, dk);
      p.thick(50, 30, 58, 38, c, 2); p.opoly([[57, 36], [60, 37], [58, 41]], c); p.opoly([[58, 34], [64, 30], [60, 36]], '#fff8e0');
      p.obox(38, 46, 8, 14, c); p.rect(36, 58, 12, 2, c);
    } },
    ankylosaurus: { cap: 'Ankylosaurus, a walking tank: bony armour, spikes, and a heavy club on the end of its tail.', draw(p, S) {
      S.prehist(p, 58);
      const c = '#8a7a4a', dk = mix(c, -0.35);
      p.thick(4, 46, 24, 44, c, 2); p.oell(6, 46, 5, 4, '#a89a6a'); p.ell(5, 45, 2, 1.5, '#c8ba8a');
      p.obox(28, 46, 7, 12, dk); p.obox(58, 46, 7, 12, dk);
      p.oell(46, 42, 24, 10, c); for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { const x = 28 + i * 7 + j * 3, y = 36 + j * 5; p.odisc(x, y, 2, '#b8a878'); }
      [[24, 44], [32, 48], [40, 50], [52, 50], [62, 48]].forEach(([x, y]) => p.opoly([[x - 2, y], [x, y + 4], [x + 2, y]], '#f0e8d0'));
      p.opoly([[68, 38], [82, 40], [84, 46], [70, 48]], c); eye(p, 76, 41); p.opoly([[72, 37], [75, 34], [76, 38]], '#f0e8d0');
      p.obox(34, 46, 7, 12, c); p.obox(64, 46, 7, 12, c);
    } },
    spinosaurus: { cap: 'Spinosaurus, with a tall sail on its back and a long, crocodile-like snout, fishing by a river.', draw(p, S) {
      S.prehist(p, 52); p.rect(0, 62, 96, 10, '#2a6ac8'); for (let x = 2; x < 96; x += 10) p.rect(x, 65, 5, 1, '#6aa0f0');
      p.opoly([[64, 62], [70, 58], [74, 62]], '#a0c0e0');
      const c = '#8a5a3a', dk = mix(c, -0.35);
      p.opoly([[20, 30], [26, 6], [34, 2], [44, 4], [52, 10], [56, 30]], '#c84a2a'); for (let x = 26; x < 54; x += 4) p.line(x, 30, x + 1, 7 + Math.abs(x - 38) * 0.4, '#8a2a1a');
      p.opoly([[2, 34], [20, 30], [22, 38], [6, 37]], c);
      p.opoly([[26, 36], [32, 36], [30, 48], [34, 56], [26, 56]], dk);
      p.oell(36, 34, 16, 7, c); p.ell(37, 37, 11, 2, mix(c, 0.3));
      p.opoly([[48, 30], [58, 24], [62, 28], [52, 36]], c);
      p.opoly([[58, 22], [86, 26], [86, 29], [60, 30]], c); eye(p, 63, 24); for (let i = 0; i < 7; i++) p.px(64 + i * 3, 28, '#fff');
      p.opoly([[36, 36], [44, 36], [42, 48], [46, 56], [36, 56]], c);
    } },
    archaeopteryx: { cap: 'Archaeopteryx: feathered wings like a bird, but teeth, clawed fingers and a long bony tail like a dinosaur.', draw(p, S) {
      p.vgrad(0, 72, '#9ccff8', '#eef8ff'); p.oell(10, 70, 22, 10, '#4a9a3a'); p.oell(90, 66, 16, 12, '#3a8a2a');
      // perched side-on on a branch
      p.thick(20, 56, 96, 52, '#6a4422', 3); p.line(20, 55, 96, 51, '#8a6038'); p.thick(78, 53, 86, 44, '#6a4422', 2); p.oell(88, 42, 5, 3, '#3a8a2a');
      const c = '#7a5a3a', f = '#a8885a', dk = '#4a3018';
      // the long bony tail: a row of bones with a feather on each side
      for (let i = 0; i < 9; i++) { const x = 46 - i * 4.2, y = 44 + i * 1.6; p.line(x, y, x - 3, y - 5, f); p.line(x - 1, y, x - 4, y - 4, dk); p.line(x, y, x - 3, y + 5, f); p.line(x - 1, y, x - 4, y + 4, dk); }
      p.thick(48, 44, 10, 58, '#5a4028', 1);
      // legs gripping the branch
      p.thick(54, 46, 56, 53, '#c8a060', 1); p.thick(59, 46, 61, 52, '#c8a060', 1); p.line(53, 54, 59, 54, '#3a2a10'); p.line(58, 53, 64, 53, '#3a2a10');
      // body, neck and a long toothy snout (no beak!)
      p.oell(56, 40, 10, 7, c); p.ell(57, 43, 7, 3, mix(c, 0.25));
      p.opoly([[60, 36], [66, 28], [70, 30], [66, 38]], c);
      p.opoly([[64, 26], [72, 24], [82, 28], [82, 31], [70, 32], [64, 31]], c); p.line(70, 30, 82, 30, dk); for (let i = 0; i < 5; i++) p.px(71 + i * 2, 31, '#fff'); eye(p, 69, 27);
      // the wing spread up and back: arm bones along the front edge, long feathers fanning out behind
      p.opoly([[57, 36], [49, 25], [41, 15], [30, 12], [16, 15], [6, 22], [10, 27], [22, 31], [36, 35], [46, 38]], f);
      const bone = [[57, 36], [53, 30], [49, 25], [45, 20], [41, 15]], edge = [[46, 38], [36, 35], [22, 31], [10, 27], [6, 22]];
      bone.forEach(([a, b2], i) => p.line(a - 1, b2 + 1, edge[i][0], edge[i][1], dk)); for (let i = 0; i < 4; i++) p.line(40 - i * 2, 15, 30 - i * 6, 13 + i * 3, dk);
      p.thick(57, 36, 41, 15, mix(c, -0.2), 1);
      [[41, 15, 44, 8], [42, 16, 47, 11], [40, 15, 39, 8]].forEach(([a1, b1, a2, b2]) => { p.line(a1, b1, a2, b2, '#2a2010'); p.px(a2 + (a2 > a1 ? 1 : -1), b2 + 1, '#000'); });
    } },
    pterosaurs: { cap: 'A Pteranodon gliding over the sea. Pterosaurs flew on skin wings, and were NOT dinosaurs.', draw(p, S) {
      S.sea(p, 50); p.oell(14, 52, 18, 4, '#7a6a5a');
      const c = '#c08060', dk = mix(c, -0.4), lt = mix(c, 0.3);
      // skin wings held up in a shallow V: arm bone along the front edge, a little clawed hand at each wrist
      p.opoly([[42, 36], [24, 18], [2, 26], [20, 32], [36, 42]], c); p.opoly([[48, 36], [68, 16], [94, 22], [74, 30], [54, 42]], c);
      p.thick(42, 36, 24, 18, dk, 1); p.line(24, 18, 2, 26, dk); p.thick(48, 36, 68, 16, dk, 1); p.line(68, 16, 94, 22, dk);
      p.poly([[38, 36], [24, 21], [12, 26], [26, 31]], lt); p.poly([[52, 36], [68, 19], [82, 23], [68, 30]], lt);
      [[24, 18, 21, 16], [68, 16, 66, 13]].forEach(([a, b2, a2, b3]) => p.line(a, b2, a2, b3, '#3a2010'));
      // body with little back legs
      p.oell(45, 39, 5, 4, c); p.line(42, 43, 40, 47, dk); p.line(48, 43, 50, 47, dk);
      // head: a long toothless beak pointing forward and a long crest sweeping back
      p.thick(48, 37, 54, 36, c, 2);
      p.opoly([[52, 32], [58, 33], [80, 38], [58, 39], [53, 37]], lt); p.line(58, 37, 79, 38, dk);
      p.opoly([[54, 33], [40, 24], [44, 24], [57, 32]], '#d8502a'); eye(p, 56, 35);
    } },
    plesiosaurs: { cap: 'A long-necked plesiosaur "flying" through the sea on four flippers. Not a dinosaur!', draw(p, S) {
      p.vgrad(0, 72, '#3a8ae0', '#0a2a6a'); for (let i = 0; i < 6; i++) p.line(10 + i * 16, 0, 4 + i * 16, 72, 'rgba(160,220,255,.12)');
      p.rect(0, 0, 96, 3, '#a0d8ff');
      const c = '#3a6a6a', lt = '#7aaaa0';
      p.opoly([[30, 46], [18, 58], [26, 58], [36, 50]], c); p.opoly([[52, 48], [46, 62], [54, 60], [58, 50]], c);
      p.opoly([[16, 42], [2, 44], [16, 46]], c);
      p.oell(36, 42, 20, 8, c); p.ell(36, 46, 15, 3, lt);
      p.opoly([[30, 38], [24, 28], [28, 30], [36, 36]], c); p.opoly([[50, 38], [56, 28], [58, 32], [52, 42]], c);
      p.thick(54, 38, 66, 24, c, 3); p.thick(66, 24, 78, 16, c, 2);
      p.oell(81, 15, 4, 2.6, c); eye(p, 81, 14); p.line(84, 16, 86, 16, '#000');
      p.opoly([[88, 18], [92, 16], [93, 20]], '#c0c0c0'); p.px(90, 22, '#a0d8ff').px(86, 10, '#a0d8ff').px(87, 6, '#a0d8ff');
    } },
    fossils: { cap: 'Fossils in layers of rock: an ammonite shell and a dinosaur bone, turned to stone over millions of years.', draw(p, S) {
      const L = ['#d8b880', '#c8a070', '#b88a5a', '#c8a878', '#a87a4a', '#b8986a'];
      L.forEach((c, i) => { p.rect(0, i * 12, 96, 12, c); p.dither(0, i * 12, 96, 12, mix(c, -0.08)); p.line(0, i * 12, 96, i * 12 + (i % 2 ? 2 : -1), mix(c, -0.25)); });
      for (let a = 0; a < 6.283 * 3.2; a += 0.05) { const r = 2 + a * 0.75; p.px(26 + Math.cos(a) * r, 24 + Math.sin(a) * r, a % 1.1 < 0.1 ? '#5a3a1a' : '#e8d8b0'); }
      p.ring(26, 24, 16, '#5a3a1a');
      p.thick(48, 48, 82, 40, '#f4ecd8', 4); p.odisc(48, 49, 4, '#f4ecd8', '#8a6a3a'); p.odisc(46, 44, 3, '#f4ecd8', '#8a6a3a'); p.odisc(82, 39, 4, '#f4ecd8', '#8a6a3a'); p.odisc(85, 44, 3, '#f4ecd8', '#8a6a3a');
      for (let i = 0; i < 4; i++) p.thick(60 + i * 8, 14, 66 + i * 8, 22, '#f4ecd8', 1);
    } },
    mary_anning: { cap: 'Mary Anning hunting fossils under the crumbling cliffs at Lyme Regis, with her hammer and basket.', draw(p, S) {
      p.vgrad(0, 30, '#9ac8f0', '#d8ecff'); p.rect(0, 30, 96, 10, '#5a8ac0'); p.rect(0, 40, 96, 32, '#c8b088'); p.dither(0, 40, 96, 32, '#b89a70');
      p.opoly([[50, 0], [96, 0], [96, 52], [60, 50], [54, 30]], '#8a8070'); for (let y = 6; y < 48; y += 6) p.line(54 + y * 0.12, y, 96, y + 2, '#6a6050');
      for (let i = 0; i < 9; i++) p.odisc(70 + i * 2.5, 30 + Math.sin(i) * 1.5, 1.4, '#e8dcc0', '#5a5040'); p.oell(66, 30, 4, 2.5, '#e8dcc0', '#5a5040'); p.px(64, 29, '#5a5040');
      // Mary: bonnet, long dress, shawl, hammer, basket
      const x = 30;
      p.opoly([[x - 8, 66], [x - 5, 40], [x + 5, 40], [x + 9, 66]], '#3a3050'); p.opoly([[x - 6, 40], [x + 6, 40], [x + 7, 48], [x - 7, 48]], '#7a3a2a');
      p.odisc(x, 34, 4, '#f2c79a'); p.opoly([[x - 6, 36], [x - 5, 28], [x + 5, 28], [x + 6, 36], [x + 4, 33], [x - 4, 33]], '#e8e0c8');
      p.thick(x + 6, 44, x + 14, 38, '#3a3050', 2); p.thick(x + 14, 38, x + 16, 30, '#6a4a2a', 1); p.rect(x + 13, 28, 6, 3, '#555');
      p.oell(x - 11, 56, 5, 4, '#a07a40'); p.ring(x - 11, 51, 4, '#7a5a20'); p.disc(x - 12, 54, 1.5, '#e8d8b0');
    } },
    dinosaur_extinction: { cap: 'About 65 million years ago, a giant asteroid or comet hit the Earth. It was the end for the dinosaurs.', draw(p, S) {
      p.vgrad(0, 58, '#2a0a10', '#ff9040'); p.ell(48, 58, 60, 10, 'rgba(255,200,120,.35)'); p.rect(0, 58, 96, 14, '#2a2018'); p.dither(0, 58, 96, 14, '#1a140c');
      // the fireball streaking down, trailing flame
      for (let i = 0; i < 26; i++) { const k = i / 26; p.disc(64 - i * 2.4, 16 - i * 1.4, 7 * (1 - k * 0.75), `rgba(255,${210 - i * 6},${90 - i * 3},${0.95 - k * 0.8})`); }
      p.odisc(64, 16, 6, '#6a5a50'); p.disc(62, 14, 2.5, '#8a7a70'); p.disc(66, 18, 1.5, '#4a3a30'); p.ell(70, 21, 5, 3, 'rgba(255,255,200,.5)');
      p.poly([[0, 58], [10, 44], [16, 46], [26, 58]], '#1a0c08'); p.rect(11, 42, 4, 2, '#ff6020');
      // silhouettes looking up: a long-necked sauropod, a T. rex and a pterosaur flapping away
      const K = '#120a06';
      p.rect(36, 50, 3, 8, K).rect(48, 50, 3, 8, K).rect(40, 51, 3, 7, K).rect(52, 51, 3, 7, K);
      p.oell(44, 49, 11, 5, K, K); p.poly([[34, 48], [22, 56], [23, 58], [36, 52]], K); p.thick(52, 47, 64, 30, K, 3); p.oell(65, 29, 3, 2, K, K);
      rex(p, 82, 46, '#24140c', 0.32);
      p.poly([[18, 22], [26, 26], [30, 24], [34, 26], [42, 22], [32, 28], [24, 28]], K);
    } },
    sue_the_t_rex: { cap: 'Sue, the most complete T. rex skeleton ever found, standing on show in a museum.', draw(p, S) {
      p.vgrad(0, 58, '#e8dcc8', '#c8b8a0'); for (let x = 4; x < 96; x += 24) { p.rect(x, 0, 7, 58, '#d8ccb8'); p.rect(x, 0, 1, 58, '#efe6d6'); } p.rect(0, 58, 96, 14, '#8a6a4a'); p.dither(0, 60, 96, 12, '#7a5a3a'); p.obox(6, 56, 84, 6, '#a0a0a8');
      const b = '#f4ecd8', ol = '#6a5a48';
      // steel supports holding the bones up
      [[24, 34], [48, 28], [62, 26]].forEach(([x, y]) => p.thick(x, y, x, 56, '#707078', 1));
      // the spine: a chain of vertebrae from tail tip to neck, with little spines on top
      const sp = []; for (let i = 0; i <= 24; i++) { const t = i / 24; sp.push([4 + t * 54, 40 - Math.sin(t * 2.2) * 14 + t * 0]); }
      sp.forEach(([x, y], i) => { const r = i < 10 ? 1 : 2; p.rect(x - 1, y - r / 2, 2, r + 1, b); p.px(x, y - r / 2 - 1, i % 2 ? ol : b); if (i % 2 === 0) p.px(x + 1, y, ol); });
      // ribs curving down under the body
      for (let i = 0; i < 6; i++) { const x = 37 + i * 3.2, y = 30 - Math.sin((x - 4) / 54 * 2.2) * 14 + 1, L = 10 - Math.abs(i - 2) * 1.5; p.line(x, y, x - 1, y + L, b); p.line(x - 1, y + L, x + 1, y + L + 1, b); p.px(x, y + 1, ol); }
      // the big skull: dark eye hole and window holes, a row of teeth
      p.opoly([[56, 14], [78, 14], [84, 20], [82, 24], [58, 24], [54, 18]], b, ol); p.odisc(63, 17, 2, '#5a4a3a', ol); p.oell(71, 19, 4, 2, '#8a7a6a', ol);
      p.opoly([[58, 24], [80, 24], [76, 29], [60, 29]], b, ol); for (let i = 0; i < 7; i++) p.line(60 + i * 3, 23, 61 + i * 3, 26, '#fff');
      // hips and two strong legs with big knees, toes on the floor
      p.oell(30, 31, 5, 3, b, ol);
      [[27, '#e0d6c0'], [33, b]].forEach(([x, col]) => { p.thick(x, 32, x - 5, 43, col, 3); p.odisc(x - 5, 44, 2, col, ol); p.thick(x - 5, 45, x, 53, col, 2); p.line(x - 3, 55, x + 6, 55, col); p.line(x - 3, 54, x + 6, 54, col); p.px(x + 7, 55, ol); });
      p.line(54, 28, 57, 32, b); p.px(58, 33, b);
      p.obox(66, 44, 22, 9, '#2a2a2a'); p.text(70, 46, 'SUE', '#ffd400');
    } },
    woolly_mammoth: { cap: 'A woolly mammoth in the Ice Age snow: shaggy hair, small ears and huge curved tusks.', draw(p, S) {
      p.vgrad(0, 50, '#c8dcf0', '#f4f8ff'); p.poly([[0, 50], [20, 30], [36, 50]], '#e8f0f8'); p.poly([[50, 50], [72, 26], [96, 50]], '#dce8f4'); p.rect(0, 50, 96, 22, '#ffffff'); p.dither(0, 50, 96, 22, '#e4ecf4');
      const c = '#6a3a1a', dk = '#4a2410';
      p.obox(24, 44, 8, 18, dk); p.obox(52, 44, 8, 18, dk);
      p.opoly([[16, 30], [30, 18], [50, 14], [66, 20], [70, 34], [66, 48], [18, 48], [14, 40]], c);
      for (let x = 16; x < 68; x += 3) p.line(x, 40, x - 1, 49, dk);
      p.oell(68, 22, 9, 10, c); p.opoly([[68, 14], [64, 6], [72, 10]], c);
      p.opoly([[72, 28], [78, 44], [74, 50], [70, 46], [68, 30]], c); eye(p, 71, 21);
      p.thick(70, 30, 84, 38, '#fff8e0', 2); p.thick(84, 38, 88, 30, '#fff8e0', 2); p.thick(88, 30, 86, 24, '#fff8e0', 1);
      p.obox(30, 44, 8, 18, c); p.obox(58, 44, 8, 18, c);
      for (let i = 0; i < 25; i++) p.px((i * 37) % 96, (i * 23) % 50, '#ffffff');
    } },
  });
})();

// ---------------------------------------------------------------- batch 5: puzzles and toys
(function () {
  const A = window.Carta && Carta.art, N = window.CartaNature; if (!A || !N) return;
  const { mix } = N;
  const K = { w: '#f8f8f8', y: '#ffd400', r: '#d81818', o: '#ff8000', b: '#1a50d8', g: '#1a9a2a' };
  function cube(p, ox, oy, s, top, left, right) { // isometric cube, s = sticker size
    const face = (o, u, v, cs, dim) => { for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const P = (a, b) => [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b]; p.poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], '#101010'); p.poly([P(i + 0.12, j + 0.12), P(i + 0.88, j + 0.12), P(i + 0.88, j + 0.88), P(i + 0.12, j + 0.88)], mix(K[cs[j * 3 + i]], dim)); p.px(...P(i + 0.25, j + 0.25), mix(K[cs[j * 3 + i]], dim + 0.3)); } };
    face([ox, oy], [s, s / 2], [s, -s / 2], top, 0.05); face([ox, oy], [s, s / 2], [0, s * 1.1], left, -0.05); face([ox + 3 * s, oy + 1.5 * s], [s, -s / 2], [0, s * 1.1], right, -0.28);
  }
  const lcdDigits = (p, x, y, str, c) => p.text(x, y, str, c, 2);
  A.add({
    rubiks_cube: { cap: 'A Rubik\'s Cube, all mixed up. Only one of its 43 quintillion positions is solved.', draw(p, S) {
      S.room(p); p.ell(48, 64, 30, 5, '#6a4a28');
      cube(p, 18, 26, 10, 'wyrbwgoyw'.split(''), 'rrgyrboro'.split(''), 'bgbbowgbg'.split(''));
    } },
    cube_records: { cap: 'A solved cube and a stopwatch: Minh Thai won the first World Championship in 22.95 seconds in 1982.', draw(p, S) {
      S.room(p); p.ell(30, 64, 22, 4, '#6a4a28');
      cube(p, 8, 30, 7.5, 'wwwwwwwww'.split(''), 'rrrrrrrrr'.split(''), 'bbbbbbbbb'.split(''));
      p.odisc(72, 38, 18, '#c8c8d0'); p.obox(69, 15, 6, 5, '#a8a8b0'); p.odisc(72, 38, 15, '#203020'); p.rect(59, 33, 26, 11, '#90a878'); p.text(62, 36, '22.95', '#203010'); p.text(65, 48, 'SEC', '#90a878');
      p.thick(84, 22, 88, 18, '#a8a8b0', 2);
    } },
    tetris: { cap: 'Tetris: seven shapes made of four squares each fall down. Complete a row and it vanishes.', draw(p, S) {
      p.fill('#000018'); p.stars(30, 70);
      const ox = 26, cs = 5, B = (x, y, c) => { p.rect(ox + x * cs, 4 + y * cs, cs, cs, c); p.rect(ox + x * cs, 4 + y * cs, cs - 1, 1, mix(c, 0.45)); p.rect(ox + x * cs, 4 + y * cs, 1, cs - 1, mix(c, 0.3)); p.rect(ox + x * cs + cs - 1, 4 + y * cs, 1, cs, mix(c, -0.45)); p.rect(ox + x * cs, 4 + y * cs + cs - 1, cs, 1, mix(c, -0.45)); };
      p.rect(ox - 2, 2, 54, 68, '#808090'); p.rect(ox, 4, 50, 65, '#101040');
      const C = { I: '#00d8f0', J: '#2a40e0', L: '#ff8000', O: '#ffd400', S: '#30c830', Z: '#e01010', T: '#a020f0' };
      [[4, 1], [5, 1], [6, 1], [5, 2]].forEach(([x, y]) => B(x, y, C.T));
      ['..........', 'I.....OO..', 'IJJ...OOLL', 'IJ.SS.ZZ.L', 'IJSS..TZZL', 'LLL.TTTJJJ', 'ZZ.OOSSJ.I', '.ZZOOSSJJI'].forEach((r, j) => [...r].forEach((ch, i) => { if (C[ch]) B(i, 5 + j, C[ch]); }));
      p.rect(ox, 4 + 12 * cs, 50, cs, 'rgba(255,255,255,.35)');
      p.obox(80, 4, 14, 14, '#202040'); p.text(81, 20, 'NEXT', '#9fd0ff'); [[0, 0], [1, 0], [2, 0], [3, 0]].forEach(([x]) => { p.rect(82 + x * 2.5, 10, 2, 2, C.I); });
    } },
    tetris_game_boy: { cap: 'Tetris on two Game Boys joined by a link cable, so two players can race. Four shades of green!', draw(p, S) {
      p.vgrad(0, 72, '#ffe8a0', '#ffc060');
      const gb = (x, y, field) => {
        p.opoly([[x, y], [x + 32, y], [x + 32, y + 50], [x + 25, y + 57], [x, y + 57]], '#c8c4bc'); p.rect(x + 1, y + 1, 30, 1, '#e8e4dc'); p.rect(x + 1, y + 1, 1, 55, '#e0dcd4');
        p.obox(x + 3, y + 4, 26, 25, '#585868'); p.px(x + 5, y + 14, '#e01040');
        const sx = x + 7, sy = y + 6; p.rect(sx, sy, 20, 21, '#9bbc0f');
        // brick walls each side of the well, like the real thing
        for (let j = 0; j < 21; j += 2) { p.rect(sx, sy + j, 2, 1, '#306230'); p.rect(sx + 18, sy + j, 2, 1, '#306230'); }
        const blk = (a, b, c) => { const bx = sx + 2 + a * 3 + 0.5, by = sy + 2 + b * 3 + 1; p.rect(bx, by, 3, 3, '#0f380f'); p.px(bx + 1, by + 1, c); };
        field.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') blk(i, j, ch === 'a' ? '#8bac0f' : '#306230'); }));
        p.obox(x + 4, y + 36, 11, 4, '#202020'); p.obox(x + 7, y + 33, 5, 10, '#202020'); p.rect(x + 8, y + 37, 3, 2, '#202020');
        p.odisc(x + 22, y + 39, 2.5, '#a8105a'); p.odisc(x + 28, y + 35, 2.5, '#a8105a'); p.px(x + 21, y + 38, '#e04090').px(x + 27, y + 34, '#e04090');
        p.obox(x + 10, y + 1 - 3, 6, 3, '#404040');
      };
      gb(6, 10, ['.bbb.', '..b..', '.....', 'a...b', 'aa.bb', 'aabbb']);
      gb(58, 10, ['..aa.', '..aa.', '.....', '....b', 'b.aab', 'bbaab']);
      // the link cable looping between the two
      p.thick(19, 7, 26, 2, '#303030', 1); p.thick(26, 2, 64, 2, '#303030', 1); p.thick(64, 2, 71, 7, '#303030', 1);
      p.text(39, 62, 'VS', '#a8105a', 2);
    } },
    tamagotchi: { cap: 'A virtual pet on a keyring: an egg-shaped toy with a tiny screen and three buttons. Feed it!', draw(p, S) {
      p.vgrad(0, 72, '#ffd8f0', '#ffb0e0');
      p.ring(48, 8, 6, '#a0a0a8', 2); p.obox(46, 12, 4, 6, '#a0a0a8');
      p.oell(48, 40, 24, 28, '#a050e0'); p.ell(42, 30, 10, 12, '#c080f8'); p.dither(30, 48, 36, 16, '#8030c0');
      p.obox(34, 26, 28, 22, '#504060'); p.rect(37, 29, 22, 16, '#c8d0a8');
      p.spr(42, 31, ['..kkk..', '.kkkkk.', 'kk.k.kk', 'kkkkkkk', '.k.k.k.', 'k.....k'], { k: '#202018' });
      p.rect(38, 41, 3, 2, '#202018'); p.px(56, 30, '#202018').px(57, 31, '#202018');
      [40, 48, 56].forEach(x => p.odisc(x, 56, 3, '#ffd400'));
    } },
    game_of_life: { cap: 'The Game of Life: simple rules for living and dying squares. The "glider" crawls across the grid.', draw(p, S) {
      p.fill('#101820'); for (let x = 0; x <= 96; x += 6) p.rect(x, 0, 1, 72, '#203040'); for (let y = 0; y <= 72; y += 6) p.rect(0, y, 96, 1, '#203040');
      const cell = (i, j, c) => { p.rect(i * 6 + 1, j * 6 + 1, 5, 5, c); p.rect(i * 6 + 1, j * 6 + 1, 5, 1, mix(c, 0.4)); };
      [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]].forEach(([a, b]) => cell(2 + a, 2 + b, '#40e040'));
      [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]].forEach(([a, b]) => cell(6 + a, 6 + b, 'rgba(64,224,64,.35)'));
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b]) => cell(12 + a, 2 + b, '#40c0ff'));
      [[0, 0], [1, 0], [2, 0]].forEach(([a]) => cell(11 + a, 8, '#ffd400'));
      [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]].forEach(([a, b]) => cell(4 + a, 8 + b, '#ff6040'));
      p.thick(22, 24, 34, 36, '#40e040', 1); p.poly([[34, 36], [30, 36], [34, 32]], '#40e040');
      p.text(56, 58, 'GLIDER!', '#40e040');
    } },
    furby: { cap: 'A Furby: a furry talking toy with big blinking eyes, a beak and tall ears. It starts off speaking "Furbish".', draw(p, S) {
      S.carpet(p);
      const c = '#f0e8d8', sp = '#a07850';
      p.opoly([[30, 18], [22, 0], [36, 14]], c); p.opoly([[66, 18], [74, 0], [60, 14]], c); p.opoly([[30, 16], [25, 4], [34, 14]], '#ffb0c0'); p.opoly([[66, 16], [71, 4], [62, 14]], '#ffb0c0');
      p.oell(48, 38, 24, 24, c); for (let i = 0; i < 40; i++) p.px(26 + (i * 37) % 44, 18 + (i * 23) % 40, '#d8ccb8');
      [[34, 46, 5], [62, 52, 4], [40, 58, 3]].forEach(([x, y, r]) => p.disc(x, y, r, sp));
      p.oell(38, 30, 8, 9, '#ffffff'); p.oell(58, 30, 8, 9, '#ffffff'); p.disc(39, 31, 5, '#3060c0'); p.disc(57, 31, 5, '#3060c0'); p.disc(39, 31, 2.5, '#000'); p.disc(57, 31, 2.5, '#000'); p.px(37, 29, '#fff').px(55, 29, '#fff');
      p.rect(30, 21, 16, 3, c); p.rect(50, 21, 16, 3, c);
      p.opoly([[42, 40], [54, 40], [48, 48]], '#ffa020'); p.line(42, 40, 54, 40, '#c06000'); p.line(44, 44, 52, 44, '#c06000');
      p.oell(36, 62, 7, 3, '#ffa020'); p.oell(60, 62, 7, 3, '#ffa020');
    } },
    yo_yo: { cap: 'A yo-yo spinning at the end of its string. Yo-yos are over 2,000 years old, and back in fashion in 1999.', draw(p, S) {
      p.vgrad(0, 72, '#80c8ff', '#e0f4ff');
      // a hand at the top holding the string
      p.oell(44, 8, 10, 7, '#f2c79a'); p.rect(36, 0, 16, 6, '#2a5ad8'); p.oell(52, 12, 3, 2.5, '#f2c79a');
      p.line(52, 14, 52, 44, '#ffffff'); p.line(53, 14, 53, 44, '#d0d0d0');
      p.odisc(52, 52, 14, '#e01818'); p.disc(52, 52, 10, '#ff4040'); p.disc(52, 52, 4, '#c0c0c0'); p.disc(48, 47, 3, '#ff9090');
      for (let i = 0; i < 3; i++) p.ring(52, 52, 16 + i * 3, `rgba(255,255,255,${0.5 - i * 0.15})`);
      p.line(28, 50, 34, 50, '#fff').line(26, 54, 33, 54, '#fff').line(28, 58, 34, 58, '#fff');
    } },
    tangram: { cap: 'A tangram: seven pieces (five triangles, a square and a parallelogram) that fit together into one square.', draw(p, S) {
      S.paper(p);
      const s = 56, ox = 8, oy = 8, P = pts => pts.map(([x, y]) => [ox + x * s, oy + y * s]);
      [[[[0, 0], [1, 0], [0.5, 0.5]], '#e01818'], [[[0, 0], [0.5, 0.5], [0, 1]], '#1a50d8'], [[[1, 0.5], [1, 1], [0.5, 1]], '#ffd400'], [[[0.5, 0.5], [0.75, 0.25], [1, 0.5], [0.75, 0.75]], '#1a9a2a'], [[[1, 0], [1, 0.5], [0.75, 0.25]], '#ff8000'], [[[0.5, 0.5], [0.75, 0.75], [0.25, 0.75]], '#a020f0'], [[[0, 1], [0.25, 0.75], [0.75, 0.75], [0.5, 1]], '#00b8d0']].forEach(([pts, c]) => p.opoly(P(pts), c, '#202020'));
      p.text(70, 28, '7', '#202020', 3); p.text(69, 46, 'PIECES', '#202020');
    } },
  });
})();

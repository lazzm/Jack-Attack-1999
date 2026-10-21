/* carta-art-culture.js: JackCarta 99 pictures for Sci-Fi Films, Robots, Inventions and Y2K & 1999 articles (96x72 pixel art).
 * Original, representative scenes only: no actor likenesses, copied character designs, logos or title lettering. */
(function () {
  const A = window.Carta && Carta.art; if (!A) return;
  const W = 96, H = 72;
  // ---------------------------------------------------------------- little helpers shared by these pictures
  const person = (p, x, y, c, s) => { s = s || 1; p.disc(x, y, 2 * s, c); p.rect(x - 2 * s, y + 2 * s, 4 * s + 1, 6 * s, c); p.rect(x - 2 * s, y + 8 * s, 2 * s, 5 * s, c); p.rect(x + s, y + 8 * s, 2 * s, 5 * s, c); };
  const saucer = (p, cx, cy, r, body, dome) => { p.oell(cx, cy, r, r * 0.28, body || '#b8c0d0'); p.ell(cx, cy - 1, r - 2, r * 0.14, A.shade(body || '#b8c0d0', 0.3)); p.oell(cx, cy - r * 0.25, r * 0.38, r * 0.25, dome || '#80d8ff'); p.px(cx - r * 0.15, cy - r * 0.35, '#fff'); };
  const glow = (p, x0, y0, x1, y1, c) => { p.thick(x0, y0, x1, y1, A.shade(c, -0.1), 3); p.thick(x0, y0, x1, y1, A.shade(c, 0.4), 2); p.line(x0, y0, x1, y1, '#fff'); };
  const hilt = (p, x, y, ang) => { const dx = Math.cos(ang), dy = Math.sin(ang); p.thick(x, y, x - dx * 7, y - dy * 7, '#9a9aa8', 3); p.line(x, y, x - dx * 7, y - dy * 7, '#d8d8e0'); p.px(x - dx * 3, y - dy * 3, '#202020'); };
  const sword = (p, x, y, len, ang, c) => { glow(p, x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len, c); hilt(p, x, y, ang); };
  const rain = (p, seed, n, c) => { const R = A.rng(seed); for (let i = 0; i < n; i++) { const x = R() * W, y = R() * H; p.line(x, y, x - 1, y + 3, c || 'rgba(170,190,255,.5)'); } };
  const windows = (p, x, y, w, h, c, seed, step) => { const R = A.rng(seed); step = step || 3; for (let j = y + 2; j < y + h - 1; j += step) for (let i = x + 1; i < x + w - 1; i += 2) if (R() < 0.45) p.px(i, j, c); };
  const crt = (p, x, y, w, h, scr) => { p.obox(x, y, w, h, '#d8d0c0'); p.rect(x + 3, y + 3, w - 6, h - 8, '#202020'); p.rect(x + 4, y + 4, w - 8, h - 10, scr || '#000'); p.rect(x + w / 2 - 6, y + h, 12, 3, '#b8b0a0'); p.px(x + w - 5, y + h - 3, '#30e030'); };

  A.add({
    // ================================================================ SCI-FI FILMS
    metropolis: { cap: 'A towering city of the future, as imagined in 1927, with its gleaming metal robot.', draw(p) {
      p.vgrad(0, H, '#2a1e10', '#c8a070');
      [[2, 20, 12], [14, 8, 10], [26, 26, 9], [62, 14, 11], [74, 4, 12], [86, 22, 10]].forEach(([x, y, w], i) => { p.rect(x, y, w, H - y, '#4a3820'); p.rect(x + 2, y - 4, w - 4, 4, '#4a3820'); p.rect(x + w / 2 - 1, y - 9, 2, 5, '#4a3820'); windows(p, x, y, w, H - y, '#ffe090', 40 + i); });
      p.thick(0, 30, 96, 26, '#3a2a14', 2); p.line(24, 44, 70, 40, '#3a2a14');
      p.poly([[50, 0], [44, 30], [56, 30]], 'rgba(255,240,180,.18)');
      p.opoly([[32, 10], [44, 12], [41, 14], [35, 13]], '#5a4830');
      // the robot: a slim, silvery figure in the middle
      const x = 48;
      p.oell(x, 30, 5, 6, '#e8e0c8'); p.rect(x - 3, 29, 6, 2, '#5a4a30'); p.px(x - 2, 29, '#fff').px(x + 1, 29, '#fff');
      p.opoly([[x - 4, 36], [x + 4, 36], [x + 6, 52], [x - 6, 52]], '#d8d0b0');
      for (let y = 39; y < 52; y += 3) p.line(x - 5, y, x + 5, y, '#8a7a50');
      p.oell(x, 41, 3, 2, '#fff8d8');
      p.obox(x - 5, 52, 4, 16, '#c8c0a0'); p.obox(x + 1, 52, 4, 16, '#c8c0a0');
      p.thick(x - 5, 37, x - 9, 50, '#c8c0a0', 2); p.thick(x + 5, 37, x + 9, 50, '#c8c0a0', 2);
      p.ell(x, 44, 12, 26, 'rgba(255,240,180,.12)');
    } },
    day_earth_stood_still: { cap: 'A flying saucer lands in a park in Washington, D.C., guarded by a tall, silent robot.', draw(p, S) {
      S.sky(p, 50, '#4a9a3a');
      p.rect(4, 38, 24, 12, '#dfe6ee'); p.ell(16, 36, 7, 5, '#e8eef4'); p.rect(15, 28, 2, 4, '#e8eef4'); for (let x = 5; x < 28; x += 3) p.rect(x, 41, 1, 9, '#b8c0c8'); p.rect(2, 49, 28, 1, '#c8d0d8');
      p.rect(88, 38, 3, 14, '#5a3a1a'); p.disc(89, 36, 7, '#2a7a20');
      saucer(p, 40, 50, 22, '#c0c8d8', '#a8e0ff'); p.opoly([[48, 54], [58, 54], [64, 64], [52, 64]], '#9aa0b0');
      // the robot: tall, smooth, with a visor slit
      p.oell(66, 30, 3, 4, '#a8acb4'); p.rect(64, 30, 5, 1, '#e02020');
      p.opoly([[62, 34], [70, 34], [71, 54], [61, 54]], '#a0a4ac'); p.line(66, 36, 66, 52, '#80848c');
      p.obox(61, 54, 5, 12, '#9a9ea6'); p.obox(66, 54, 5, 12, '#9a9ea6');
      person(p, 26, 54, '#e8e8e8');
    } },
    forbidden_planet: { cap: 'A saucer-shaped starship lands on the planet Altair IV, where a very helpful robot lives.', draw(p) {
      p.vgrad(0, 50, '#1a6a5a', '#90e0b0'); p.disc(80, 12, 6, '#fff0c0'); p.disc(64, 8, 3, '#ffd0a0');
      p.poly([[0, 50], [10, 38], [20, 46], [34, 34], [46, 50]], '#a0582a'); p.poly([[56, 50], [70, 40], [84, 46], [96, 36], [96, 50]], '#8a4a20');
      p.rect(0, 50, W, 22, '#c8783a'); p.dither(0, 50, W, 22, '#b06830');
      saucer(p, 28, 50, 22, '#c8ccd8', '#e0e8f0'); p.line(16, 54, 12, 62, '#888').line(40, 54, 44, 62, '#888');
      // the robot: dome head, round body, stubby legs
      const x = 72;
      p.oell(x, 30, 7, 6, 'rgba(200,240,255,.55)'); p.ring(x, 30, 7, '#000'); p.rect(x - 3, 28, 6, 3, '#ffd400'); p.line(x - 9, 26, x - 7, 30, '#000'); p.line(x + 9, 26, x + 7, 30, '#000');
      p.oell(x, 44, 9, 9, '#4a4e5a'); p.oell(x, 44, 4, 3, '#2a2e38'); for (let i = 0; i < 3; i++) p.px(x - 2 + i * 2, 41, ['#f00', '#0f0', '#ff0'][i]);
      p.obox(x - 13, 38, 4, 12, '#5a5e6a'); p.obox(x + 9, 38, 4, 12, '#5a5e6a');
      p.obox(x - 7, 52, 5, 8, '#4a4e5a'); p.obox(x + 2, 52, 5, 8, '#4a4e5a'); p.obox(x - 9, 60, 8, 4, '#3a3e48'); p.obox(x + 1, 60, 8, 4, '#3a3e48');
    } },
    a_space_odyssey: { cap: 'A mysterious black slab stands on the Moon, with the Earth hanging in the sky.', draw(p, S) {
      S.space(p, 2001);
      p.odisc(72, 16, 8, '#2a6ad8'); p.ell(70, 14, 3, 2, '#3a9a2a'); p.ell(74, 19, 3, 1, '#fff'); for (let y = -8; y <= 8; y++) { const hw = Math.sqrt(64 - y * y); for (let x = Math.round(hw * 0.2); x <= hw; x++) if ((x + y) % 2) p.px(72 + x, 16 + y, 'rgba(0,0,0,.6)'); }
      p.rect(0, 52, W, 20, '#8a8a8a'); p.dither(0, 52, W, 20, '#7a7a7a'); p.ell(18, 60, 8, 2, '#6a6a6a'); p.ell(80, 66, 10, 2, '#6a6a6a');
      p.poly([[0, 52], [20, 46], [36, 52]], '#6a6a6a'); p.poly([[60, 52], [84, 44], [96, 48], [96, 52]], '#6a6a6a');
      // the slab: 1 by 4 by 9
      p.rect(40, 20, 13, 38, '#000'); p.rect(53, 22, 3, 36, '#141414'); p.line(41, 21, 41, 56, '#2a2a2a');
      p.ell(48, 59, 14, 2, 'rgba(0,0,0,.5)');
      person(p, 26, 46, '#e8e8e8'); p.disc(26, 46, 2, '#d8a020');
    } },
    planet_of_the_apes: { cap: 'Three astronauts crash-land in a lake on a strange desert planet. Wait till they meet the locals.', draw(p) {
      p.vgrad(0, 34, '#e8a060', '#ffe0b0'); p.disc(20, 14, 5, '#fff8e0');
      p.poly([[0, 34], [0, 14], [10, 10], [18, 22], [30, 34]], '#b0602a'); p.poly([[60, 34], [72, 12], [84, 16], [96, 8], [96, 34]], '#a0502a'); p.line(74, 16, 74, 34, '#7a3a18'); p.line(86, 14, 86, 34, '#7a3a18');
      p.rect(0, 34, W, 14, '#3a6a9a'); for (let x = 2; x < W; x += 9) p.rect(x, 38 + (x % 4), 4, 1, '#6a9aca');
      p.rect(0, 48, W, 24, '#d8a060'); p.dither(0, 48, W, 24, '#c08848');
      // the sinking capsule
      p.opoly([[40, 44], [52, 28], [58, 32], [50, 46]], '#e0e0e8'); p.opoly([[50, 28], [56, 22], [58, 32]], '#c0c0c8'); p.px(52, 34, '#203060').px(53, 35, '#203060');
      p.ell(49, 45, 9, 2, '#9ac8f0');
      person(p, 30, 52, '#f0f0f0'); person(p, 40, 54, '#f0f0f0'); person(p, 50, 52, '#f0f0f0');
      p.disc(30, 52, 2, '#f8f8f8').disc(40, 54, 2, '#f8f8f8').disc(50, 52, 2, '#f8f8f8');
    } },
    star_wars: { cap: 'Two suns set over a desert farm, and a laser sword glows in the dusk.', draw(p, S) {
      p.vgrad(0, 50, '#3a1a5a', '#ffa860'); p.stars(14, 21, ['#fff', '#ffd8f0']);
      // two suns sinking side by side, each with a soft glow
      p.ell(60, 40, 14, 11, 'rgba(255,230,170,.22)'); p.ell(76, 43, 10, 8, 'rgba(255,200,140,.22)'); p.disc(60, 40, 7, '#fff4c0'); p.disc(76, 43, 5.5, '#ff9a40'); p.disc(75, 42, 3, '#ffc070');
      p.rect(0, 46, W, 26, '#c8905a'); p.poly([[0, 47], [20, 43], [44, 47], [70, 42], [96, 46], [96, 52], [0, 52]], '#b87e4c'); p.dither(0, 52, W, 20, '#b88050');
      // the homestead: a sand-coloured dome with a dark doorway, a smaller dome and a moisture tower
      const dome = (cx, by, rx, ry, c) => { const pts = []; for (let a = 0; a <= 16; a++) { const t = Math.PI * a / 16; pts.push([cx - Math.cos(t) * rx, by - Math.sin(t) * ry]); } p.opoly(pts, c); p.poly(pts.slice(0, 7).concat([[cx - rx * 0.4, by]]), A.shade(c, 0.18)); };
      dome(20, 56, 15, 11, '#e2cfa8'); p.poly([[18, 56], [18, 51], [20, 49], [23, 49], [25, 51], [25, 56]], '#2a1a10'); p.line(6, 56, 34, 56, '#8a6038');
      dome(40, 55, 7, 5, '#d8c49c');
      p.thick(88, 56, 88, 26, '#9a9aa8', 2); p.line(87, 56, 87, 26, '#d8d8e0'); [30, 36, 44].forEach(y => p.obox(85, y, 7, 3, '#b8b8c4')); p.opoly([[84, 26], [92, 26], [90, 22], [86, 22]], '#c8c8d4'); p.line(86, 56, 82, 60, '#7a7a88'); p.line(90, 56, 94, 60, '#7a7a88');
      // a farm boy in a robe, holding up a glowing laser sword
      const fx = 58, fy = 66; p.opoly([[fx - 5, fy], [fx - 3, fy - 13], [fx + 3, fy - 13], [fx + 5, fy]], '#2a1a14'); p.odisc(fx, fy - 16, 3, '#2a1a14');
      p.line(fx + 3, fy - 12, fx + 5, fy - 1, '#c8703a'); p.px(fx + 2, fy - 18, '#c8703a').px(fx + 3, fy - 17, '#c8703a');
      p.thick(fx + 2, fy - 12, fx + 5, fy - 17, '#2a1a14', 2); p.thick(fx + 5, fy - 17, fx + 7, fy - 23, '#2a1a14', 2);
      sword(p, fx + 7, fy - 24, 20, -1.3, '#4aa0ff');
    } },
    close_encounters: { cap: 'A huge glowing mothership arrives over a flat-topped mountain in Wyoming.', draw(p, S) {
      S.night(p, 77);
      p.ell(48, 22, 40, 12, 'rgba(255,240,200,.15)'); p.oell(48, 20, 30, 8, '#c8d0e0'); p.ell(48, 24, 24, 4, '#ffe8b0');
      [[24, '#ff4040'], [32, '#ffd400'], [40, '#40ff60'], [48, '#40c0ff'], [56, '#ff60ff'], [64, '#ff8000'], [72, '#ffffff']].forEach(([x, c]) => p.disc(x, 21, 1.5, c));
      p.oell(48, 14, 12, 4, '#e8eef8');
      p.poly([[26, 58], [32, 38], [56, 38], [64, 58]], '#1a1a28'); for (let x = 34; x < 56; x += 3) p.line(x, 40, x - 1 + (x > 46 ? 2 : 0), 58, '#262636');
      p.rect(0, 58, W, 14, '#0a0a14'); p.poly([[44, 58], [52, 58], [80, 72], [16, 72]], 'rgba(255,240,200,.12)');
      person(p, 12, 56, '#000'); person(p, 84, 57, '#000');
    } },
    alien_film: { cap: 'A strange, leathery egg in a dark and misty spaceship. Best not to look inside.', draw(p) {
      p.fill('#0a100c');
      for (let i = 0; i < 6; i++) { const x = 8 + i * 15; p.poly([[x, 0], [x + 6, 0], [x + 8, H], [x - 2, H]], '#18241c'); p.line(x + 3, 0, x + 3, H, '#22342a'); }
      p.poly([[0, 58], [96, 58], [96, 72], [0, 72]], '#141e18'); for (let x = 0; x < W; x += 12) p.line(x, 58, x - 8, 72, '#1e2c24');
      p.ell(48, 58, 30, 6, 'rgba(120,200,140,.15)');
      p.oell(48, 44, 11, 14, '#6a5a3a'); p.ell(45, 40, 6, 9, '#8a7850'); p.ell(43, 36, 2, 4, '#a89870');
      p.line(40, 32, 56, 32, '#3a2e1c'); p.line(48, 30, 48, 34, '#3a2e1c'); p.line(42, 30, 54, 34, '#3a2e1c'); p.line(54, 30, 42, 34, '#3a2e1c');
      for (let i = 0; i < 5; i++) p.line(38 + i * 4, 54, 36 + i * 5, 58, '#4a3a22');
      p.ell(48, 30, 4, 1, 'rgba(160,255,160,.5)');
      for (let i = 0; i < 3; i++) p.ell(20 + i * 30, 62 - i, 18, 2, 'rgba(200,220,200,.12)');
    } },
    star_trek_films: { cap: 'On a starship bridge, the captain\'s chair faces the big main viewscreen.', draw(p) {
      p.fill('#2a2a3a'); p.rect(0, 0, W, 6, '#3a3a50');
      p.obox(16, 8, 64, 34, '#000'); p.stars(30, 5); p.rect(0, 0, 16, 42, '#2a2a3a'); p.rect(80, 0, 16, 42, '#2a2a3a'); p.rect(0, 0, W, 8, '#2a2a3a');
      p.odisc(56, 26, 9, '#c86a3a'); p.ell(54, 24, 4, 3, '#e08a5a'); p.rect(18, 10, 60, 1, 'rgba(255,255,255,.1)');
      p.obox(0, 40, 22, 10, '#5a5a70'); p.obox(74, 40, 22, 10, '#5a5a70'); for (let i = 0; i < 5; i++) { p.rect(3 + i * 4, 43, 2, 2, ['#f44', '#ff0', '#4f4', '#4cf', '#f8f'][i]); p.rect(77 + i * 4, 43, 2, 2, ['#4cf', '#f44', '#4f4', '#ff0', '#f8f'][i]); }
      p.rect(0, 50, W, 22, '#5a2a2a'); p.dither(0, 50, W, 22, '#4a2020');
      p.obox(30, 48, 36, 6, '#6a6a80'); p.rect(34, 49, 4, 2, '#ffd400'); p.rect(58, 49, 4, 2, '#40ff60');
      // the captain's chair, seen from behind
      p.obox(41, 52, 14, 14, '#2a2a3a'); p.obox(37, 58, 4, 6, '#3a3a50'); p.obox(55, 58, 4, 6, '#3a3a50'); p.obox(44, 66, 8, 6, '#3a3a50');
    } },
    empire_strikes_back: { cap: 'Giant four-legged walking tanks stomp across a frozen snow planet.', draw(p) {
      p.vgrad(0, 44, '#a8b8d0', '#e8f0f8'); p.poly([[0, 44], [16, 34], [30, 40], [48, 30], [66, 40], [84, 32], [96, 38], [96, 44]], '#d8e0ec');
      p.rect(0, 44, W, 28, '#f4f8ff'); p.dither(0, 44, W, 28, '#e0e8f4');
      const walker = (x, y, s, c) => { const d = A.shade(c, -0.25); p.obox(x, y, 20 * s, 9 * s, c); p.obox(x + 19 * s, y + 2 * s, 8 * s, 5 * s, c); p.rect(x + 25 * s, y + 4 * s, 2 * s, 1 * s, '#000'); p.obox(x + 16 * s, y + 3 * s, 4 * s, 4 * s, d); [2, 6, 13, 17].forEach((lx, i) => { p.obox(x + lx * s, y + 9 * s, 2 * s, (10 + (i % 2) * 1) * s, d); p.obox(x + (lx - 1) * s, y + 19 * s, 4 * s, 2 * s, d); }); };
      walker(36, 18, 2, '#9aa0aa'); walker(6, 30, 1, '#a8aeb8'); walker(78, 34, 0.6, '#b0b6c0');
      p.rect(0, 62, W, 3, '#c8d0e0'); for (let x = 4; x < W; x += 14) { person(p, x, 58, '#5a6070', 0.6); }
      p.line(10, 26, 30, 30, '#ff3030'); p.line(60, 34, 90, 40, '#40ff40');
    } },
    et: { cap: 'A bicycle flies across the face of the full Moon, with a very special passenger in the basket.', draw(p, S) {
      S.night(p, 82);
      p.odisc(52, 30, 24, '#fff4d0', '#e8d8a0'); p.ell(44, 22, 5, 3, '#e8dcb0'); p.ell(60, 38, 7, 4, '#e8dcb0'); p.ell(48, 42, 3, 2, '#e8dcb0');
      // bike silhouette, a little rider and a passenger in the basket
      const x = 38, y = 36;
      p.ring(x, y + 8, 5, '#000', 1); p.ring(x + 18, y + 8, 5, '#000', 1); p.line(x, y + 8, x + 8, y + 2, '#000'); p.line(x + 8, y + 2, x + 18, y + 8, '#000'); p.line(x + 8, y + 2, x + 14, y + 1, '#000'); p.line(x + 14, y + 1, x + 18, y + 8, '#000'); p.line(x + 15, y - 1, x + 19, y - 1, '#000');
      p.rect(x + 17, y - 3, 5, 3, '#000'); p.disc(x + 19, y - 5, 2, '#000');
      p.disc(x + 9, y - 8, 3, '#000'); p.rect(x + 7, y - 6, 5, 7, '#000'); p.line(x + 11, y - 4, x + 15, y - 1, '#000'); p.line(x + 8, y + 1, x + 10, y + 5, '#000');
      [[4, 72, 10], [14, 72, 14], [80, 72, 12], [90, 72, 16], [26, 72, 9]].forEach(([x0, y0, hh]) => p.poly([[x0 - 5, y0], [x0, y0 - hh * 2], [x0 + 5, y0]], '#000'));
      p.rect(0, 68, W, 4, '#000');
    } },
    blade_runner: { cap: 'A rainy, neon-lit city of the future, with a flying police car gliding past.', draw(p) {
      p.vgrad(0, H, '#08081a', '#3a1a3a');
      [[0, 18, 14], [12, 6, 16], [30, 24, 12], [44, 12, 18], [64, 20, 12], [78, 2, 18]].forEach(([x, y, w], i) => { p.rect(x, y, w, H - y, '#141422'); windows(p, x, y, w, H - y, i % 2 ? '#ffb040' : '#80c0ff', 90 + i, 2); });
      p.obox(14, 18, 10, 14, '#ff2a8a'); p.rect(16, 20, 6, 10, '#ff8ac0'); p.obox(66, 26, 10, 6, '#00e5ff'); p.rect(46, 32, 14, 3, '#ffd400'); p.rect(80, 40, 3, 16, '#ff4040');
      p.poly([[52, 0], [44, 30], [60, 30]], 'rgba(255,255,255,.08)');
      // flying car with blue and red lights
      p.opoly([[30, 46], [40, 42], [56, 42], [62, 46], [60, 50], [32, 50]], '#3a3a48'); p.rect(42, 43, 12, 3, '#80a0c0'); p.px(34, 47, '#ff3030').px(58, 47, '#3080ff'); p.ell(46, 52, 14, 2, 'rgba(255,160,60,.35)');
      rain(p, 33, 70);
    } },
    tron: { cap: 'Two light cycles race across the computer grid, leaving solid walls of light behind them.', draw(p) {
      p.fill('#000008');
      for (let i = 0; i < 9; i++) { const y = 30 + i * i * 0.55; p.line(0, y, W, y, '#0a3a6a'); }
      for (let i = -12; i <= 12; i++) p.line(48 + i * 2, 30, 48 + i * 14, H, '#0a3a6a');
      p.rect(0, 29, W, 1, '#2a8ad8');
      p.thick(0, 64, 6, 64, '#00b8ff', 3); p.thick(6, 64, 6, 49, '#00b8ff', 3); p.thick(6, 49, 18, 49, '#00b8ff', 3); p.line(0, 64, 6, 64, '#c0f4ff'); p.line(6, 64, 6, 49, '#c0f4ff'); p.line(6, 49, 18, 49, '#c0f4ff');
      p.thick(96, 36, 89, 36, '#ff8a00', 2); p.line(96, 36, 89, 36, '#ffe0a0');
      const cyc = (x, y, s, c, dir) => { const X = v => x + v * s * dir, Y = v => y + v * s;
        p.opoly([[X(0), Y(6)], [X(4), Y(1)], [X(14), Y(0)], [X(22), Y(3)], [X(24), Y(8)], [X(0), Y(9)]], A.shade(c, -0.6), c); p.opoly([[X(8), Y(1)], [X(14), Y(-2)], [X(18), Y(1)]], A.shade(c, -0.3), c);
        p.odisc(X(5), Y(7), 4 * s, '#0a0a10', c); p.odisc(X(19), Y(7), 4 * s, '#0a0a10', c); p.ring(X(5), Y(7), 2 * s, c); p.ring(X(19), Y(7), 2 * s, c);
        p.line(X(6), Y(2), X(16), Y(1), A.shade(c, 0.5)); p.line(X(1), Y(8), X(23), Y(8), c); };
      cyc(17, 40, 1.1, '#40d0ff', 1); cyc(89, 31, 0.6, '#ffa040', -1);
    } },
    return_of_the_jedi: { cap: 'A speeder bike zooms between the giant trees of a forest moon, past the treehouse villages.', draw(p) {
      p.vgrad(0, H, '#20401c', '#6a9a48');
      // far trees pale, near trees dark and huge
      [[10, 4], [38, 5], [60, 4], [82, 5]].forEach(([x, w]) => p.rect(x, 0, w, H, '#4a6a34'));
      [[0, 11, '#3a2410'], [24, 9, '#4a2e14'], [70, 12, '#3a2410'], [90, 8, '#4a2e14']].forEach(([x, w, c]) => { p.rect(x, 0, w, H, c); p.rect(x + 2, 0, 2, H, A.shade(c, 0.25)); for (let y = 6; y < H; y += 9) p.px(x + 5, y, A.shade(c, -0.3)); });
      // treehouse village: round huts on platforms, a rope bridge between the trees
      [[76, 14], [6, 22]].forEach(([x, y]) => { p.obox(x - 4, y + 4, 18, 3, '#7a5a30'); p.oell(x + 5, y + 1, 6, 4, '#a07a40'); p.opoly([[x - 1, y], [x + 5, y - 6], [x + 11, y]], '#6a4a20'); p.rect(x + 4, y + 2, 2, 3, '#2a1808'); });
      for (let x = 14; x < 74; x += 3) p.px(x, 26 - Math.sin((x - 14) / 60 * Math.PI) * -6 - 6, '#c8a060'); p.line(14, 20, 74, 18, '#8a6a3a');
      p.rect(0, 62, W, 10, '#2a4a1a'); for (let x = 0; x < W; x += 5) p.poly([[x, 66], [x + 3, 57], [x + 6, 66]], x % 10 ? '#3a6a2a' : '#4a7a32');
      // speed lines behind the bike
      for (let i = 0; i < 6; i++) p.line(0, 36 + i * 3, 22 - (i % 3) * 5, 36 + i * 3, 'rgba(255,255,255,.35)');
      // the speeder bike (flying right): fat engine at the back, long thin nose with two steering vanes
      p.opoly([[22, 42], [30, 38], [48, 38], [54, 42], [48, 47], [26, 48]], '#a8aab4'); p.rect(28, 40, 18, 1, '#d8dae4'); p.obox(20, 44, 10, 4, '#70727c'); p.rect(18, 45, 3, 2, '#ffa040');
      p.thick(50, 42, 82, 41, '#7a7c86', 2); p.opoly([[76, 35], [86, 36], [86, 38], [76, 39]], '#c0c2cc'); p.opoly([[76, 43], [86, 43], [86, 45], [76, 46]], '#c0c2cc'); p.line(78, 39, 78, 43, '#5a5c66');
      // the rider, leaning forward over the handlebars
      p.opoly([[32, 38], [38, 27], [46, 28], [44, 38]], '#3a3a2a'); p.odisc(47, 26, 3.5, '#4a4a3a'); p.rect(47, 25, 3, 2, '#101010');
      p.thick(43, 30, 52, 37, '#3a3a2a', 2); p.thick(38, 38, 42, 44, '#2a2a1e', 2);
    } },
    the_terminator: { cap: 'A chrome robot skull with glowing red eyes. Not a friendly one.', draw(p) {
      p.vgrad(0, H, '#000', '#3a0a00'); for (let i = 0; i < 12; i++) p.poly([[i * 9, H], [i * 9 + 4, 54 + (i * 7) % 12], [i * 9 + 8, H]], i % 2 ? '#c83000' : '#ff7000');
      const c = '#b8bcc8';
      p.oell(48, 26, 18, 18, c); p.ell(42, 18, 8, 6, '#e8ecf4'); p.rect(30, 34, 36, 10, c);
      p.oell(40, 28, 6, 5, '#101014'); p.oell(56, 28, 6, 5, '#101014'); p.disc(40, 28, 2, '#ff2020'); p.disc(56, 28, 2, '#ff2020'); p.ell(40, 28, 4, 3, 'rgba(255,40,40,.35)'); p.ell(56, 28, 4, 3, 'rgba(255,40,40,.35)');
      p.poly([[46, 33], [50, 33], [48, 38]], '#101014');
      p.obox(34, 42, 28, 9, '#9a9eaa'); for (let x = 36; x < 60; x += 3) p.line(x, 43, x, 49, '#3a3e48'); p.rect(35, 46, 26, 1, '#3a3e48');
      p.thick(30, 32, 28, 46, '#8a8e9a', 2); p.thick(66, 32, 68, 46, '#8a8e9a', 2);
      p.rect(42, 51, 12, 6, '#7a7e8a'); p.line(44, 51, 44, 56, '#3a3e48'); p.line(48, 51, 48, 56, '#3a3e48'); p.line(52, 51, 52, 56, '#3a3e48');
    } },
    back_to_the_future: { cap: 'A stainless steel time-machine car vanishes at 88 mph, leaving two tracks of fire.', draw(p) {
      p.vgrad(0, 40, '#0a0a28', '#3a2a5a'); p.stars(25, 1985); p.rect(0, 40, W, 32, '#2a2a30'); p.rect(0, 54, W, 1, '#ffd400');
      for (let i = 0; i < 2; i++) { const y = 60 + i * 6; for (let x = 0; x < 50; x++) { const f = Math.sin(x * 1.3 + i) > 0 ? 2 : 1; p.rect(x, y - f, 1, f, x % 3 ? '#ff6000' : '#ffd400'); } }
      // gull-wing car seen from the back three-quarters
      p.opoly([[44, 46], [52, 36], [76, 36], [86, 46], [88, 58], [44, 58]], '#b8bcc4'); p.rect(46, 47, 41, 1, '#e0e4ec');
      p.opoly([[54, 37], [74, 37], [80, 45], [50, 45]], '#3a4050'); p.line(64, 37, 64, 45, '#8a8e98');
      for (let x = 48; x < 86; x += 3) p.line(x, 50, x, 55, '#80848c');
      p.obox(46, 49, 6, 3, '#ff3030'); p.obox(80, 49, 6, 3, '#ff3030');
      p.obox(48, 56, 8, 6, '#1a1a1a'); p.obox(78, 56, 8, 6, '#1a1a1a');
      p.thick(56, 32, 62, 22, '#c8ccd4', 2); p.thick(70, 32, 72, 22, '#c8ccd4', 2); p.rect(58, 21, 16, 2, '#c8ccd4');
      for (let i = 0; i < 8; i++) p.line(40 + i * 7, 30 + (i % 3) * 8, 44 + i * 7, 34 + (i % 3) * 8, '#9ae0ff');
    } },
    aliens_film: { cap: 'A motion tracker beeps as the blips close in. A film for grown-ups.', draw(p) {
      p.fill('#141410'); for (let y = 0; y < H; y += 6) p.rect(0, y, W, 1, '#1e1e18');
      p.obox(14, 6, 68, 60, '#5a5a48'); p.obox(20, 12, 56, 42, '#101a10');
      for (let r = 8; r <= 32; r += 8) { for (let a = -2.4; a <= -0.7; a += 0.03) p.px(48 + Math.cos(a) * r, 52 + Math.sin(a) * r, '#1a6a2a'); }
      p.line(48, 52, 48, 14, '#1a6a2a'); p.line(48, 52, 26, 24, '#1a6a2a'); p.line(48, 52, 70, 24, '#1a6a2a');
      for (let a = -1.9; a < -1.4; a += 0.02) p.line(48, 52, 48 + Math.cos(a) * 34, 52 + Math.sin(a) * 34, 'rgba(60,255,90,.08)');
      [[40, 22], [56, 26], [46, 32], [62, 34]].forEach(([x, y]) => { p.disc(x, y, 2, '#80ff90'); p.ell(x, y, 4, 3, 'rgba(120,255,140,.3)'); });
      p.text(22, 56, '20M', '#60e070'); p.rect(60, 57, 12, 3, '#ff3020'); p.obox(40, 58, 16, 5, '#3a3a2e');
    } },
    robocop: { cap: 'An armoured cyborg police officer patrols the streets of a future Detroit.', draw(p) {
      p.vgrad(0, H, '#2a2440', '#c87a4a'); [[0, 20, 14], [16, 10, 12], [70, 16, 14], [84, 6, 12]].forEach(([x, y, w], i) => { p.rect(x, y, w, H - y, '#2a2030'); windows(p, x, y, w, H - y, '#ffc860', 7 + i); });
      p.rect(0, 64, W, 8, '#3a3a40');
      const c = '#9aa8c0';
      p.oell(48, 14, 8, 8, c); p.rect(40, 12, 16, 4, '#202430'); p.rect(41, 13, 14, 1, '#6080a0'); p.rect(44, 18, 8, 4, '#e0b090'); p.line(45, 20, 51, 20, '#a07050');
      p.opoly([[36, 24], [60, 24], [62, 44], [34, 44]], c); p.line(48, 26, 48, 42, '#6a7890'); p.rect(38, 28, 20, 2, '#c8d4e8'); p.rect(40, 34, 6, 6, '#7a88a0'); p.rect(50, 34, 6, 6, '#7a88a0');
      p.obox(28, 25, 8, 20, c); p.obox(60, 25, 8, 20, c); p.obox(28, 44, 7, 5, '#6a7890');
      p.obox(38, 44, 9, 22, c); p.obox(49, 44, 9, 22, c); p.rect(39, 54, 7, 2, '#6a7890'); p.rect(50, 54, 7, 2, '#6a7890');
      p.obox(62, 42, 10, 4, '#3a3a44');
    } },
    terminator_2: { cap: 'A shiny puddle of liquid metal pulls itself back together into a shape.', draw(p) {
      p.vgrad(0, 48, '#2a2a34', '#5a5a6a'); for (let x = 0; x < W; x += 16) p.rect(x, 0, 2, 48, '#3a3a46');
      p.rect(0, 48, W, 24, '#444450'); p.dither(0, 48, W, 24, '#3a3a46');
      p.oell(48, 60, 30, 7, '#b8c4d8'); p.ell(40, 58, 12, 3, '#e8f0ff'); p.ell(60, 62, 8, 2, '#8894a8');
      p.opoly([[42, 58], [44, 40], [40, 30], [46, 24], [52, 30], [50, 40], [54, 58]], '#b8c4d8'); p.line(45, 30, 45, 54, '#e8f0ff'); p.line(50, 32, 51, 54, '#8894a8');
      p.oell(47, 22, 5, 5, '#c8d4e8'); p.ell(45, 20, 2, 2, '#fff');
      p.opoly([[56, 56], [60, 46], [64, 44], [66, 48], [62, 56]], '#b8c4d8'); p.px(61, 49, '#fff');
      [[24, 64], [72, 66], [30, 54], [70, 56]].forEach(([x, y]) => { p.oell(x, y, 3, 1.5, '#b8c4d8'); p.px(x - 1, y - 1, '#fff'); });
    } },
    jurassic_park: { cap: 'A T. rex steps through a broken electric fence. The theme park is not going well.', draw(p) {
      p.vgrad(0, H, '#0a1a14', '#2a4a2a'); rain(p, 1993, 40, 'rgba(180,220,255,.35)');
      for (let x = 0; x < W; x += 10) p.poly([[x - 6, 50], [x + 2, 20 + (x * 7) % 14], [x + 8, 50]], '#14301a');
      // T. rex
      const c = '#5a6a3a', d = '#3a4a24';
      p.opoly([[24, 32], [60, 24], [62, 40], [30, 44]], c); p.opoly([[56, 14], [80, 10], [84, 18], [78, 22], [82, 26], [64, 28], [56, 24]], c);
      p.line(64, 23, 80, 23, '#000'); for (let x = 66; x < 80; x += 3) { p.px(x, 22, '#fff'); p.px(x + 1, 24, '#fff'); }
      p.px(70, 14, '#ffd400').px(71, 14, '#000'); p.line(60, 32, 66, 36, c); p.line(66, 36, 68, 35, c);
      p.poly([[24, 32], [0, 44], [0, 48], [30, 42]], c);
      p.obox(32, 42, 8, 18, d); p.obox(46, 40, 9, 20, c); p.obox(44, 58, 13, 4, d);
      // the fence: posts and dangling wires
      p.rect(0, 62, W, 10, '#1a2a12');
      [6, 30, 88].forEach(x => { p.obox(x, 28, 4, 40, '#5a5a60'); p.rect(x - 2, 28, 8, 2, '#3a3a40'); });
      for (let i = 0; i < 4; i++) { p.line(9, 34 + i * 7, 30, 34 + i * 7, '#9a9aa0'); p.line(34, 34 + i * 7, 40 + i * 3, 44 + i * 6, '#9a9aa0'); p.line(88, 34 + i * 7, 76 - i * 2, 46 + i * 6, '#9a9aa0'); }
      p.opoly([[14, 52], [24, 52], [19, 44]], '#ffd400'); p.rect(18, 47, 2, 3, '#000'); p.px(18, 51, '#000');
      p.px(41, 47, '#ffff80').px(76, 50, '#ffff80');
    } },
    stargate: { cap: 'A giant stone ring covered in symbols opens a shimmering doorway to another world.', draw(p, S) {
      S.desert(p, 54); p.disc(80, 12, 6, '#fff8d0'); p.poly([[2, 54], [20, 30], [38, 54]], '#d8a868'); p.poly([[20, 30], [38, 54], [26, 54]], '#b88848');
      p.ring(56, 32, 22, '#000', 1); p.ring(56, 32, 21, '#7a7a80', 6); p.ring(56, 32, 15, '#000', 1);
      for (let a = 0; a < 6.28; a += 0.32) p.px(56 + Math.cos(a) * 18, 32 + Math.sin(a) * 18, '#2a2a30');
      for (let a = 0; a < 6.28; a += 0.79) p.obox(56 + Math.cos(a) * 21 - 2, 32 + Math.sin(a) * 21 - 2, 4, 4, '#ff8a20');
      p.disc(56, 32, 14, '#3a8ae8'); for (let r = 2; r < 14; r += 3) p.ring(56, 32, r, r % 2 ? '#6ab0ff' : '#2a70d0'); p.disc(53, 29, 2, '#c8e8ff');
      p.rect(30, 54, 52, 4, '#a8a8b0'); p.rect(32, 58, 48, 3, '#909098');
      person(p, 28, 49, '#4a5a2a');
    } },
    independence_day: { cap: 'An enormous flying saucer, miles wide, hovers over a city.', draw(p) {
      p.vgrad(0, H, '#c86a3a', '#ffd0a0');
      p.oell(48, 12, 60, 14, '#4a4a58'); p.ell(48, 16, 54, 8, '#5a5a6a'); for (let x = 0; x < W; x += 6) p.rect(x, 14 + (x % 12 === 0 ? 2 : 0), 3, 2, '#3a3a48');
      p.oell(48, 24, 6, 2, '#a0e0ff'); p.ell(48, 24, 3, 1, '#fff');
      p.poly([[44, 25], [52, 25], [58, 64], [38, 64]], 'rgba(160,220,255,.22)');
      [[0, 40, 10], [12, 34, 8], [22, 44, 10], [34, 30, 10], [56, 36, 12], [70, 28, 8], [80, 42, 16]].forEach(([x, y, w], i) => { p.rect(x, y, w, H - y, '#3a2a2a'); windows(p, x, y, w, H - y, '#ffd890', 60 + i); });
      p.rect(0, 64, W, 8, '#2a2020');
    } },
    men_in_black: { cap: 'Two secret agents in black suits and sunglasses, and the silver gadget that wipes memories.', draw(p) {
      p.vgrad(0, H, '#c8d0d8', '#8a96a4');
      const agent = (x, skin) => { p.oell(x, 18, 7, 8, skin); p.rect(x - 7, 12, 14, 4, '#1a1a1a'); p.rect(x - 6, 17, 5, 3, '#000').rect(x + 1, 17, 5, 3, '#000'); p.line(x - 1, 18, x + 1, 18, '#000'); p.line(x - 2, 23, x + 2, 23, A.shade(skin, -0.35));
        p.opoly([[x - 14, 30], [x + 14, 30], [x + 16, H], [x - 16, H]], '#141418'); p.poly([[x - 5, 28], [x + 5, 28], [x, 40]], '#fff'); p.poly([[x - 1, 30], [x + 1, 30], [x + 2, 44], [x, 47], [x - 2, 44]], '#000'); p.rect(x - 4, 26, 8, 3, skin); };
      agent(30, '#f0c8a0'); agent(66, '#8a5a3a');
      // the gadget, flashing
      p.obox(78, 44, 4, 16, '#d8dce4'); p.rect(79, 45, 2, 3, '#ff3030');
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; p.line(80 + Math.cos(a) * 4, 42 + Math.sin(a) * 4, 80 + Math.cos(a) * 9, 42 + Math.sin(a) * 9, '#fffbe0'); } p.disc(80, 42, 3, '#ffffff');
      p.oell(10, 62, 5, 5, '#6ad84a'); p.disc(8, 60, 1, '#000'); p.disc(12, 60, 1, '#000'); p.line(8, 56, 6, 52, '#3a9a2a'); p.line(12, 56, 14, 52, '#3a9a2a');
    } },
    fifth_element: { cap: 'Flying taxis queue in traffic between the stacked skyscrapers of a far-future city.', draw(p) {
      p.vgrad(0, H, '#ffe8c0', '#a87a5a');
      [[0, 6, 18, '#b88a6a'], [20, 0, 14, '#a07858'], [62, 2, 16, '#a87e5e'], [80, 10, 16, '#b88a6a']].forEach(([x, y, w, c], i) => { p.rect(x, y, w, H - y, c); for (let yy = y + 4; yy < H; yy += 8) p.rect(x, yy, w, 2, A.shade(c, -0.2)); windows(p, x, y, w, H - y, '#fff8d8', 30 + i, 4); });
      p.rect(36, 0, 24, H, 'rgba(255,255,255,.15)');
      const taxi = (x, y, c, s) => { p.opoly([[x, y + 2 * s], [x + 3 * s, y], [x + 11 * s, y], [x + 14 * s, y + 2 * s], [x + 14 * s, y + 5 * s], [x, y + 5 * s]], c); p.rect(x + 4 * s, y + 1 * s, 6 * s, 1 * s, '#9ad8ff'); p.rect(x + 1 * s, y + 5 * s, 12 * s, 1, 'rgba(0,0,0,.4)'); };
      [[24, 14, '#ffd400', 1], [42, 20, '#ff6040', 1], [62, 16, '#40a0ff', 1], [10, 28, '#ffd400', 1.4], [44, 34, '#ffd400', 1.6], [74, 30, '#c0c0c8', 1.2], [28, 48, '#ffd400', 2], [64, 52, '#ff8a20', 2]].forEach(([x, y, c, s]) => taxi(x, y, c, s));
    } },
    the_matrix: { cap: 'Green computer code rains down the screen. Red pill or blue pill?', draw(p) {
      p.fill('#000');
      const R = A.rng(1999), G = ['010110', '111001', '101011', '011101', '110100', '100111'];
      for (let c = 0; c < 16; c++) { const x = 2 + c * 6, len = 6 + ((R() * 9) | 0), top = (R() * 40) | 0; for (let k = 0; k < len; k++) { const y = top + k * 5; if (y > H) break; const g = G[(c + k) % 6]; const col = k === len - 1 ? '#e0ffe0' : k > len - 4 ? '#40ff60' : '#0a8a2a'; for (let b = 0; b < 6; b++) if (g[b] === '1') p.px(x + (b % 2), y + (b >> 1), col); } }
      p.oell(36, 58, 10, 5, '#d01818'); p.ell(33, 56, 4, 2, '#ff7070'); p.oell(62, 58, 10, 5, '#1848d0'); p.ell(59, 56, 4, 2, '#70a0ff');
    } },
    phantom_menace: { cap: 'A podracer: a tiny cockpit pulled by two enormous engines, racing across a desert planet.', draw(p, S) {
      S.desert(p, 40); p.disc(80, 10, 5, '#fff8d0'); p.disc(68, 14, 3, '#fff0c0'); p.poly([[0, 40], [10, 30], [24, 34], [36, 28], [52, 40]], '#c88a50'); p.poly([[60, 40], [80, 26], [96, 32], [96, 40]], '#b87a40');
      const eng = (x, y) => { p.opoly([[x, y], [x + 26, y - 2], [x + 30, y + 2], [x + 26, y + 6], [x, y + 5]], '#a8a0a0'); p.rect(x + 4, y + 1, 18, 1, '#e8e0e0'); p.oell(x + 1, y + 2, 2, 3, '#ff8a20'); p.opoly([[x + 10, y - 2], [x + 16, y - 5], [x + 18, y - 1]], '#c8301a'); };
      eng(46, 30); eng(42, 44);
      p.line(72, 31, 76, 37, '#40c0ff'); p.line(68, 46, 76, 40, '#40c0ff'); p.line(72, 32, 68, 45, '#40c0ff');
      p.opoly([[8, 40], [18, 36], [26, 38], [26, 44], [10, 44]], '#d8b040'); p.rect(14, 37, 6, 2, '#3a5a8a'); p.line(26, 39, 44, 33, '#555'); p.line(26, 42, 42, 46, '#555');
      for (let i = 0; i < 6; i++) p.ell(4 + i * 5, 52 + (i % 2) * 4, 5, 2, 'rgba(230,200,150,.6)');
      for (let i = 0; i < 5; i++) p.line(0, 34 + i * 3, 6 + i * 2, 34 + i * 3, 'rgba(255,255,255,.5)');
    } },
    iron_giant: { cap: 'A giant friendly metal robot towers over the forest beside a small boy.', draw(p) {
      p.vgrad(0, H, '#3a3a6a', '#f0a070'); p.disc(18, 14, 6, '#fff4d0');
      const c = '#5a6a8a';
      p.oell(56, 18, 13, 12, c); p.ell(52, 13, 6, 4, A.shade(c, 0.3)); p.rect(43, 22, 26, 6, A.shade(c, -0.2)); p.line(44, 25, 68, 25, '#2a3040');
      p.odisc(50, 17, 3, '#fff8c0'); p.odisc(62, 17, 3, '#fff8c0'); p.ell(50, 17, 5, 4, 'rgba(255,248,192,.25)'); p.ell(62, 17, 5, 4, 'rgba(255,248,192,.25)');
      p.opoly([[38, 32], [74, 32], [72, 60], [40, 60]], c); p.rect(40, 34, 32, 2, A.shade(c, 0.3)); p.oell(56, 42, 6, 4, A.shade(c, -0.25));
      p.obox(28, 34, 10, 26, c); p.obox(74, 34, 10, 22, c); p.thick(80, 56, 86, 66, c, 4);
      for (let x = 0; x < W; x += 8) p.poly([[x - 7, H], [x, 46 + (x * 13) % 14], [x + 7, H]], x % 16 ? '#1a3a2a' : '#22482e');
      person(p, 18, 58, '#101010');
    } },
    galaxy_quest: { cap: 'A cancelled space adventure on the telly, watched by some aliens who think it all really happened.', draw(p) {
      p.vgrad(0, H, '#2a2a3a', '#4a4058');
      p.obox(16, 4, 64, 48, '#7a5a3a'); p.obox(20, 8, 44, 38, '#202020'); p.rect(22, 10, 40, 34, '#000018'); p.stars(0, 1);
      const R = A.rng(5); for (let i = 0; i < 16; i++) p.px(22 + R() * 40, 10 + R() * 34, '#fff');
      p.opoly([[28, 30], [40, 24], [56, 26], [58, 30], [44, 34]], '#c8ccd8'); p.rect(30, 30, 4, 2, '#40c0ff'); p.px(52, 27, '#ffd400');
      p.rect(22, 10, 40, 34, 'rgba(255,255,255,.04)'); p.obox(68, 12, 8, 4, '#c8c8c8'); p.odisc(72, 24, 3, '#c8c8c8'); p.odisc(72, 34, 3, '#c8c8c8');
      p.line(40, 4, 32, 0, '#888'); p.line(56, 4, 64, 0, '#888');
      [[24, '#6ad84a'], [44, '#8ac0ff'], [64, '#ff9ad8']].forEach(([x, c]) => { p.oell(x, 64, 7, 8, c); p.disc(x - 3, 61, 1, '#000'); p.disc(x + 3, 61, 1, '#000'); p.line(x - 3, 56, x - 5, 51, A.shade(c, -0.3)); p.line(x + 3, 56, x + 5, 51, A.shade(c, -0.3)); p.disc(x - 5, 51, 1, A.shade(c, -0.3)); p.disc(x + 5, 51, 1, A.shade(c, -0.3)); });
    } },
    special_effects: { cap: 'A model spaceship on a stand in front of a blue screen, with the film camera rolling.', draw(p) {
      p.fill('#1a40c0'); p.dither(0, 0, W, 56, '#1838b0'); p.rect(0, 56, W, 16, '#3a3a3a'); p.rect(0, 56, W, 1, '#5a5a5a');
      p.obox(34, 34, 4, 24, '#2a2a2a'); p.obox(28, 56, 16, 3, '#2a2a2a');
      p.opoly([[16, 30], [38, 22], [58, 24], [60, 30], [38, 36]], '#c8ccd4'); p.opoly([[30, 26], [40, 14], [44, 14], [40, 26]], '#a8acb4'); p.rect(56, 26, 4, 3, '#ff8a20'); p.px(24, 30, '#ff3030'); p.line(20, 31, 54, 28, '#9a9ea8');
      p.obox(68, 30, 16, 12, '#2a2a2a'); p.odisc(72, 26, 4, '#3a3a3a'); p.odisc(81, 26, 4, '#3a3a3a'); p.obox(62, 33, 6, 6, '#4a4a4a'); p.disc(64, 36, 2, '#80c0ff');
      p.line(76, 42, 70, 56, '#555'); p.line(76, 42, 76, 56, '#555'); p.line(76, 42, 82, 56, '#555');
      p.obox(4, 6, 10, 6, '#c8c8c8'); p.line(9, 12, 9, 18, '#888'); p.ell(9, 22, 6, 4, 'rgba(255,255,220,.25)');
    } },
    george_lucas: { cap: 'A film director\'s chair, a clapperboard, a megaphone and a stack of film cans.', draw(p) {
      p.vgrad(0, 52, '#3a3a4a', '#6a6a7a'); p.rect(0, 52, W, 20, '#5a3a2a'); p.dither(0, 52, W, 20, '#4a3020');
      p.ell(40, 24, 30, 22, 'rgba(255,240,200,.12)');
      // director's chair
      p.thick(26, 38, 46, 66, '#8a5a2a', 2); p.thick(46, 38, 26, 66, '#8a5a2a', 2); p.obox(22, 22, 28, 9, '#1a1a1a'); p.rect(25, 25, 22, 1, '#3a3a3a'); p.obox(24, 38, 24, 4, '#1a1a1a'); p.obox(22, 22, 3, 20, '#8a5a2a'); p.obox(47, 22, 3, 20, '#8a5a2a');
      // clapperboard
      p.obox(56, 46, 20, 14, '#222'); p.rect(58, 50, 16, 1, '#fff'); p.rect(58, 54, 12, 1, '#fff'); p.opoly([[56, 46], [74, 38], [76, 42], [58, 49]], '#222'); for (let i = 0; i < 4; i++) p.line(60 + i * 4, 45 - i * 1.6, 62 + i * 4, 47 - i * 1.6, '#fff');
      // megaphone and film cans
      p.opoly([[6, 46], [16, 42], [16, 52], [6, 49]], '#e8e8e8'); p.obox(2, 45, 4, 5, '#c8c8c8');
      [[86, 62], [86, 57], [86, 52]].forEach(([x, y]) => { p.oell(x, y, 8, 2.5, '#a0a8b0'); p.ell(x, y - 0.5, 3, 1, '#606870'); });
    } },
    ilm: { cap: 'A computer-controlled camera on a track repeats the same swoop past a model spaceship, again and again.', draw(p) {
      p.fill('#141418'); p.rect(0, 0, W, 6, '#2a2a30'); for (let x = 6; x < W; x += 20) { p.ell(x, 6, 4, 2, '#fff8d0'); p.poly([[x - 3, 6], [x + 3, 6], [x + 9, 40], [x - 9, 40]], 'rgba(255,250,210,.05)'); }
      p.rect(0, 60, W, 12, '#2a2a30'); p.rect(0, 58, W, 3, '#8a8a90'); for (let x = 2; x < W; x += 6) p.rect(x, 61, 3, 2, '#5a5a60');
      p.obox(12, 50, 22, 8, '#d8a020'); p.obox(20, 34, 6, 16, '#d8a020'); p.thick(23, 36, 40, 26, '#d8a020', 3); p.obox(38, 20, 14, 10, '#2a2a2a'); p.oell(53, 25, 3, 4, '#3a3a5a'); p.px(53, 24, '#80c0ff');
      p.obox(76, 40, 3, 18, '#3a3a3a'); p.opoly([[64, 34], [78, 28], [92, 32], [80, 38]], '#c8ccd4'); p.rect(88, 31, 3, 2, '#ff8a20');
      p.obox(2, 20, 12, 10, '#3a3a40'); p.rect(4, 22, 8, 5, '#0a2a10'); p.text(4, 23, '01', '#40ff60');
      p.line(14, 26, 20, 40, '#aa3030'); for (let i = 0; i < 4; i++) p.px(30 + i * 5, 14 + i * 2, '#ffd400');
    } },
    digital_characters: { cap: 'A dinosaur made of wireframe lines on a computer screen, before it gets its skin.', draw(p, S) {
      S.room(p); crt(p, 18, 4, 60, 48, '#000814');
      const g = '#30ff60', pts = [[30, 36], [40, 28], [52, 26], [58, 18], [68, 16], [70, 21], [62, 24], [56, 30], [52, 38], [44, 40], [36, 40]];
      for (let i = 0; i < pts.length; i++) p.line(pts[i][0], pts[i][1], pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1], g);
      [[40, 28, 40, 40], [46, 27, 46, 40], [52, 26, 52, 38], [36, 33, 54, 33], [58, 18, 60, 24], [64, 17, 64, 23], [30, 36, 22, 40]].forEach(([a, b, c, d]) => p.line(a, b, c, d, '#1a9a3a'));
      p.line(44, 40, 42, 46, g); p.line(42, 46, 46, 46, g); p.line(50, 39, 51, 46, g); p.line(51, 46, 55, 46, g);
      p.px(66, 18, '#fff'); p.text(24, 9, 'RENDER 2%', '#30ff60');
    } },
    star_wars_special_editions: { cap: 'Back on the big screen in 1997: the old films, with extra ships in the space battles.', draw(p) {
      p.fill('#1a0a0a'); p.rect(0, 0, 10, 52, '#8a0a10'); p.rect(86, 0, 10, 52, '#8a0a10'); for (let x = 1; x < 10; x += 3) { p.line(x, 0, x, 52, '#a01820'); p.line(86 + x, 0, 86 + x, 52, '#a01820'); }
      p.rect(0, 0, W, 5, '#6a0a10');
      p.obox(12, 6, 72, 40, '#000'); const R = A.rng(97); for (let i = 0; i < 30; i++) p.px(14 + R() * 68, 8 + R() * 36, '#fff');
      const ship = (x, y, c) => { p.poly([[x, y], [x + 6, y - 2], [x + 8, y], [x + 6, y + 2]], c); };
      [[20, 14], [30, 30], [44, 18], [56, 36], [66, 12], [72, 26], [38, 40], [24, 24]].forEach(([x, y], i) => ship(x, y, i % 2 ? '#c8ccd8' : '#9aa0aa'));
      p.line(28, 15, 50, 20, '#ff3030'); p.line(60, 36, 74, 28, '#40ff40'); p.disc(48, 30, 3, '#ffd400'); p.disc(48, 30, 1, '#fff');
      p.rect(0, 52, W, 20, '#0a0a0a'); for (let i = 0; i < 12; i++) { const x = 4 + i * 8; p.disc(x, 58 + (i % 2) * 2, 3, '#1e1e1e'); p.rect(x - 4, 61 + (i % 2) * 2, 9, 12, '#1e1e1e'); }
    } },
    x_wing: { cap: 'Flying a starfighter in a PC space combat game, sharing power between lasers, shields and engines.', draw(p, S) {
      S.room(p); crt(p, 10, 2, 76, 56, '#000010');
      const R = A.rng(93); for (let i = 0; i < 30; i++) p.px(15 + R() * 66, 7 + R() * 40, '#fff');
      p.opoly([[40, 18], [48, 14], [56, 18], [48, 22]], '#9aa0aa'); p.line(48, 14, 48, 22, '#5a5e66'); p.oell(48, 18, 2, 2, '#5a5e66');
      p.ring(48, 26, 6, '#ffd400'); p.line(48, 18, 48, 34, 'rgba(255,212,0,.6)'); p.line(40, 26, 56, 26, 'rgba(255,212,0,.6)');
      p.line(15, 50, 40, 32, '#ff3030'); p.line(81, 50, 56, 32, '#ff3030');
      p.rect(15, 42, 66, 9, '#2a2a30'); [['#40ff60', 0.8], ['#40c0ff', 0.6], ['#ff4040', 0.4]].forEach(([c, v], i) => { p.rect(18 + i * 22, 45, 18, 3, '#101014'); p.rect(18 + i * 22, 45, 18 * v, 3, c); });
    } },
    tie_fighter: { cap: 'The view through a round, many-paned cockpit window in a game where you fly for the Empire.', draw(p) {
      p.fill('#141418');
      p.disc(48, 34, 33, '#2a2a30'); p.disc(48, 34, 29, '#000010'); const R = A.rng(94); for (let i = 0; i < 36; i++) { const a = R() * 6.28, r = R() * 28; p.px(48 + Math.cos(a) * r, 34 + Math.sin(a) * r, '#fff'); }
      p.opoly([[38, 26], [44, 28], [48, 24], [52, 28], [58, 26], [52, 32], [44, 32]], '#c8a890'); p.rect(46, 28, 4, 2, '#ff6a20');
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; p.thick(48 + Math.cos(a) * 9, 34 + Math.sin(a) * 9, 48 + Math.cos(a) * 30, 34 + Math.sin(a) * 30, '#3a3a44', 2); }
      p.ring(48, 34, 9, '#3a3a44', 2); p.ring(48, 34, 29, '#3a3a44', 2);
      p.line(20, 64, 42, 30, '#40ff40'); p.line(76, 64, 54, 30, '#40ff40');
      p.rect(0, 62, W, 10, '#2a2a30'); p.rect(30, 64, 36, 6, '#101014'); p.rect(32, 66, 20, 2, '#40ff60');
    } },
    episode_i_racer: { cap: 'Racing a podracer through a twisting canyon in the 1999 game.', draw(p) {
      p.vgrad(0, 30, '#ff9a50', '#ffd8a0'); p.poly([[0, 0], [30, 30], [0, 72]], '#a0502a'); p.poly([[96, 0], [66, 30], [96, 72]], '#8a4020'); p.poly([[0, 72], [30, 30], [66, 30], [96, 72]], '#d8a060'); p.dither(0, 30, W, 42, '#c89050');
      for (let i = 0; i < 6; i++) { const y = 32 + i * i * 1.2; p.rect(46 - i, y, 3, 1, '#fff0c0'); }
      const e = (x, y, s) => { p.opoly([[x, y], [x + 8 * s, y], [x + 9 * s, y + 4 * s], [x - 1 * s, y + 4 * s]], '#b0a8a8'); p.oell(x + 4 * s, y + 4 * s, 3 * s, 1.5 * s, '#ff8a20'); };
      e(30, 40, 1.4); e(54, 40, 1.4); p.line(36, 42, 46, 54, '#40c0ff'); p.line(60, 42, 50, 54, '#40c0ff');
      p.opoly([[42, 52], [54, 52], [52, 60], [44, 60]], '#d8b040'); p.rect(46, 53, 4, 2, '#3a5a8a');
      p.rect(2, 2, 30, 5, '#000'); p.rect(3, 3, 22, 3, '#ff3020'); p.text(68, 2, '1/12', '#fff');
    } },
    phantom_menace_game: { cap: 'Deflecting blaster bolts with a green laser sword in the 1999 game of the film.', draw(p) {
      p.vgrad(0, 50, '#3a4a6a', '#8aa0c0'); p.rect(0, 50, W, 22, '#5a5a6a'); for (let x = 0; x < W; x += 12) p.line(x, 50, x - 10, 72, '#4a4a58');
      p.rect(0, 10, W, 4, '#2a3048'); for (let x = 4; x < W; x += 16) p.rect(x, 14, 3, 36, '#2a3048');
      const droid = (x, y) => { p.oell(x, y, 2, 3, '#c8b48a'); p.line(x, y + 3, x, y + 12, '#c8b48a'); p.line(x, y + 12, x - 2, y + 20, '#c8b48a'); p.line(x, y + 12, x + 2, y + 20, '#c8b48a'); p.line(x, y + 5, x - 4, y + 9, '#c8b48a'); p.rect(x - 6, y + 8, 3, 1, '#333'); };
      droid(76, 32); droid(86, 30);
      p.disc(26, 30, 3, '#e8c8a0'); p.opoly([[22, 34], [30, 34], [32, 52], [20, 52]], '#8a6a4a'); p.rect(21, 52, 4, 10, '#6a4a3a'); p.rect(27, 52, 4, 10, '#6a4a3a');
      sword(p, 30, 38, 18, -0.7, '#40ff60');
      p.thick(70, 38, 50, 34, '#ff3030', 2); p.thick(46, 30, 60, 20, '#ff3030', 2); p.disc(48, 32, 3, '#fff0a0');
    } },
    lego_star_wars: { cap: 'A four-winged starfighter built from bricks, with a little figure pilot. Twelve wings optional.', draw(p, S) {
      S.carpet(p);
      const plate = (x, y, w, h, c) => { p.obox(x, y, w, h, c); for (let j = y + 2; j < y + h - 1; j += 3) for (let i = x + 2; i < x + w - 1; i += 3) { p.px(i, j, A.shade(c, 0.35)); p.px(i + 1, j + 1, A.shade(c, -0.25)); } };
      // wings (top view, splayed into an X)
      p.opoly([[30, 30], [44, 30], [36, 6], [26, 6]], '#c8ccd4'); p.opoly([[30, 42], [44, 42], [36, 66], [26, 66]], '#c8ccd4');
      p.thick(28, 10, 34, 10, '#d02020', 2); p.thick(28, 62, 34, 62, '#d02020', 2);
      p.obox(22, 4, 16, 3, '#8a8e96'); p.obox(22, 65, 16, 3, '#8a8e96'); p.obox(34, 4, 10, 2, '#5a5e66'); p.obox(34, 66, 10, 2, '#5a5e66');
      for (let i = 0; i < 3; i++) { p.px(31 + i * 3, 16 + i * 4, '#f0f0f0'); p.px(31 + i * 3, 56 - i * 4, '#f0f0f0'); }
      // fuselage plate with studs, nose, cockpit
      plate(20, 31, 50, 10, '#d8dce4'); p.opoly([[70, 31], [86, 34], [86, 38], [70, 41]], '#d8dce4'); p.rect(72, 35, 14, 1, '#d02020');
      p.obox(52, 32, 12, 8, '#2a3a5a'); p.rect(54, 33, 6, 2, '#6a8aca'); p.obox(15, 32, 6, 8, '#8a8e96');
      p.obox(57, 34, 4, 4, '#ffd400');
      // the pilot figure, standing by
      p.obox(80, 48, 7, 6, '#ffd400'); p.px(82, 50, '#000').px(85, 50, '#000'); p.obox(78, 54, 11, 7, '#ff8a20'); p.obox(79, 61, 9, 7, '#f0f0f0');
    } },
    star_wars_toys: { cap: 'Action figures still in their packets, and a light-up toy laser sword.', draw(p) {
      p.vgrad(0, H, '#ffe0a0', '#ffb860'); p.rect(0, 56, W, 16, '#c08040');
      const card = (x, c, fig) => { p.obox(x, 10, 22, 42, c); p.rect(x + 2, 12, 18, 6, '#000'); p.rect(x + 4, 14, 14, 2, '#ffd400'); p.oell(x + 11, 34, 8, 14, 'rgba(255,255,255,.5)');
        p.disc(x + 11, 26, 2, fig[0]); p.rect(x + 9, 28, 5, 8, fig[1]); p.rect(x + 9, 36, 2, 7, fig[2]); p.rect(x + 12, 36, 2, 7, fig[2]); p.line(x + 6, 30, x + 8, 30, fig[1]); p.line(x + 14, 30, x + 16, 30, fig[1]); p.px(x + 7, 22, '#fff'); };
      card(4, '#2040a0', ['#f0c8a0', '#f0f0f0', '#d8c8a0']); card(28, '#7a1020', ['#202020', '#202020', '#303030']); card(52, '#206040', ['#e8b890', '#8a6a4a', '#6a4a3a']);
      sword(p, 80, 64, 30, -1.75, '#4aa0ff');
    } },
    // ================================================================ ROBOTS
    robot_word: { cap: 'On stage in the 1920 play R.U.R., where the word "robot" was first used.', draw(p) {
      p.fill('#1a0a0a'); p.rect(0, 0, W, 8, '#8a0a10'); for (let x = 0; x < W; x += 8) p.ell(x + 4, 8, 4, 2, '#8a0a10');
      p.poly([[0, 0], [16, 0], [10, 60], [0, 60]], '#a01018'); p.poly([[96, 0], [80, 0], [86, 60], [96, 60]], '#a01018'); for (let i = 2; i < 14; i += 4) { p.line(i, 0, i - 2, 60, '#7a0a10'); p.line(94 - i, 0, 96 - i, 60, '#7a0a10'); }
      p.poly([[30, 8], [66, 8], [80, 60], [16, 60]], 'rgba(255,240,190,.12)');
      p.rect(0, 58, W, 14, '#6a4a2a'); for (let x = 0; x < W; x += 10) p.line(x, 58, x - 4, 72, '#5a3a20');
      p.obox(34, 12, 28, 9, '#e8dcc0'); p.text(38, 14, 'R.U.R.', '#7a0a10');
      const bot = (x, c) => { p.oell(x, 30, 4, 5, '#d0c8b8'); p.rect(x - 2, 29, 1, 1, '#000'); p.rect(x + 1, 29, 1, 1, '#000'); p.obox(x - 5, 35, 10, 12, c); p.rect(x - 1, 36, 2, 10, A.shade(c, -0.3)); p.obox(x - 5, 47, 4, 11, c); p.obox(x + 1, 47, 4, 11, c); p.obox(x - 8, 36, 3, 10, c); p.obox(x + 5, 36, 3, 10, c); };
      bot(30, '#5a6a7a'); bot(48, '#5a6a7a'); bot(66, '#5a6a7a');
    } },
    three_laws: { cap: 'A robot studies its rule book: three laws, in order of importance.', draw(p, S) {
      S.room(p);
      p.oell(40, 18, 10, 9, '#a8b4c8'); p.rect(32, 14, 16, 6, '#202838'); p.rect(34, 16, 4, 2, '#40e0ff'); p.rect(42, 16, 4, 2, '#40e0ff'); p.line(40, 9, 40, 5, '#000'); p.disc(40, 4, 1.5, '#ff3030');
      p.obox(28, 28, 24, 22, '#98a4b8'); p.rect(34, 32, 12, 6, '#6a7488'); p.px(36, 34, '#40ff60').px(40, 34, '#ffd400').px(44, 34, '#ff4040');
      p.obox(30, 50, 7, 14, '#8894a8'); p.obox(43, 50, 7, 14, '#8894a8');
      p.opoly([[48, 34], [70, 30], [90, 34], [90, 54], [70, 50], [48, 54]], '#fff8e8'); p.line(70, 30, 70, 50, '#b8a888');
      p.text(53, 36, 'I', '#000'); p.text(53, 42, 'II', '#000'); p.text(53, 48, 'III', '#000'); for (let i = 0; i < 3; i++) { p.line(60, 38 + i * 6, 67, 37 + i * 6, '#8a8a8a'); p.line(74, 37 + i * 6, 87, 38 + i * 6, '#8a8a8a'); }
      p.obox(44, 34, 8, 5, '#98a4b8'); p.obox(86, 40, 6, 5, '#98a4b8');
    } },
    elektro: { cap: 'Elektro, the gold-coloured metal man who walked and talked at the 1939 World\'s Fair.', draw(p) {
      p.vgrad(0, H, '#20305a', '#6a80b8'); p.ell(48, 40, 34, 36, 'rgba(255,240,180,.12)');
      p.rect(0, 62, W, 10, '#4a2a5a'); p.rect(0, 62, W, 2, '#ffd400'); p.text(4, 66, '1939', '#ffd400'); p.text(76, 66, 'FAIR', '#ffd400');
      const c = '#d8b048';
      p.obox(40, 2, 16, 14, c); p.rect(43, 6, 3, 2, '#3a2a10'); p.rect(50, 6, 3, 2, '#3a2a10'); p.oell(48, 12, 2, 1.5, '#3a2a10'); p.rect(42, 3, 12, 1, A.shade(c, 0.4));
      p.obox(44, 16, 8, 3, A.shade(c, -0.2));
      p.obox(34, 19, 28, 24, c); p.rect(36, 21, 1, 20, A.shade(c, 0.4)); p.odisc(48, 30, 4, A.shade(c, -0.25)); p.disc(48, 30, 2, '#ff6040');
      p.obox(26, 20, 8, 22, c); p.obox(62, 20, 8, 22, c); p.obox(26, 42, 8, 4, A.shade(c, -0.2)); p.obox(62, 42, 8, 4, A.shade(c, -0.2));
      p.obox(36, 43, 11, 17, c); p.obox(49, 43, 11, 17, c); p.obox(34, 58, 14, 5, A.shade(c, -0.25)); p.obox(48, 58, 14, 5, A.shade(c, -0.25));
    } },
    unimate: { cap: 'The first factory robot, a big arm that lifted red-hot metal parts so people didn\'t have to.', draw(p) {
      p.vgrad(0, 52, '#5a6a6a', '#9aa8a8'); p.rect(0, 52, W, 20, '#5a5a50'); p.dither(0, 52, W, 20, '#4a4a42');
      p.obox(68, 24, 26, 30, '#6a6a70'); p.rect(70, 30, 22, 10, '#2a2a2a'); p.rect(72, 32, 18, 6, '#ff6a00'); p.rect(74, 33, 14, 4, '#ffd040');
      p.obox(10, 40, 26, 14, '#3a5a8a'); p.rect(12, 44, 22, 2, '#2a4a7a'); p.obox(16, 28, 14, 12, '#4a6a9a');
      p.obox(20, 22, 30, 8, '#3a5a8a'); p.obox(48, 23, 16, 6, '#c8ccd4'); p.rect(50, 24, 12, 1, '#fff');
      p.obox(62, 21, 4, 10, '#3a3a40'); p.line(66, 22, 70, 20, '#3a3a40'); p.line(66, 30, 70, 32, '#3a3a40');
      p.obox(68, 18, 8, 6, '#ff8a20'); p.rect(70, 19, 4, 2, '#ffe060');
      p.obox(4, 56, 22, 6, '#808088'); for (let i = 0; i < 3; i++) p.obox(6 + i * 7, 52, 6, 4, '#a0502a');
      p.text(30, 60, 'UNIMATE', 'rgba(0,0,0,0)');
    } },
    shakey: { cap: 'Shakey, a wobbly box on wheels with a TV camera head, working out how to push a block up a ramp.', draw(p) {
      p.vgrad(0, 48, '#d8d8c8', '#b8b8a8'); p.rect(0, 48, W, 24, '#8a8a7a'); p.dither(0, 48, W, 24, '#7a7a6a');
      p.opoly([[56, 60], [80, 48], [80, 60]], '#c8a060'); p.obox(78, 48, 16, 12, '#c8a060'); p.obox(82, 40, 8, 8, '#e04040');
      p.obox(22, 46, 24, 14, '#4a4a50'); p.rect(24, 48, 20, 2, '#6a6a70'); p.odisc(26, 62, 3, '#202020'); p.odisc(42, 62, 3, '#202020');
      p.obox(26, 32, 16, 14, '#6a6a74'); p.rect(28, 36, 12, 6, '#2a2a30'); for (let i = 0; i < 3; i++) p.px(30 + i * 4, 38, ['#f44', '#4f4', '#ff4'][i]);
      p.obox(32, 18, 4, 14, '#3a3a40'); p.obox(26, 10, 16, 9, '#2a2a30'); p.oell(42, 14, 3, 3, '#3a3a5a'); p.px(42, 13, '#a0c8ff');
      p.line(30, 10, 28, 2, '#000'); p.disc(28, 2, 1, '#ff3030'); p.obox(19, 12, 8, 6, '#5a5a64'); p.px(20, 14, '#ff4040');
      p.line(18, 30, 16, 32, '#000'); p.line(14, 28, 12, 30, '#000'); p.line(48, 30, 50, 32, '#000');
    } },
    robot_arm: { cap: 'A six-jointed robot arm welds a car body on a factory line, in a shower of sparks.', draw(p) {
      p.vgrad(0, 50, '#3a3a48', '#6a6a7a'); p.rect(0, 50, W, 22, '#4a4a50'); for (let x = 0; x < W; x += 8) { p.rect(x, 64, 4, 8, '#ffd400'); p.rect(x + 4, 64, 4, 8, '#222'); }
      p.opoly([[44, 46], [52, 34], [84, 34], [92, 44], [92, 56], [44, 56]], '#c82a2a'); p.rect(56, 36, 24, 8, '#8ac0e8'); p.line(68, 36, 68, 44, '#c82a2a'); p.odisc(54, 58, 4, '#202020'); p.odisc(84, 58, 4, '#202020');
      p.obox(6, 54, 18, 8, '#e87a10'); p.odisc(15, 50, 6, '#f08a20'); p.thick(15, 48, 22, 22, '#f08a20', 5); p.line(13, 46, 20, 22, '#ffb060'); p.odisc(22, 22, 4, '#3a3a40');
      p.thick(22, 22, 40, 28, '#f08a20', 4); p.odisc(40, 28, 3, '#3a3a40'); p.thick(40, 28, 46, 36, '#e87a10', 3); p.obox(44, 35, 4, 6, '#5a5a60');
      for (let i = 0; i < 14; i++) { const a = -2.6 + i * 0.25, r = 3 + (i * 7) % 9; p.line(47, 42, 47 + Math.cos(a) * r, 42 + Math.sin(a) * r * 0.8 + r * 0.4, i % 2 ? '#ffd400' : '#fff8c0'); } p.disc(47, 42, 2, '#fff');
    } },
    aibo: { cap: 'A silver robot dog chasing its pink ball. It can see the ball with the camera in its nose.', draw(p, S) {
      S.carpet(p);
      const c = '#c8ccd4', d = '#8a8e98';
      p.oell(42, 40, 18, 9, c); p.ell(38, 36, 10, 3, '#eef0f4');
      p.oell(64, 28, 9, 8, c); p.opoly([[66, 30], [80, 30], [80, 36], [68, 37]], c); p.rect(76, 31, 4, 3, '#202020'); p.px(78, 32, '#40c0ff');
      p.rect(60, 25, 9, 3, '#202020'); p.px(62, 26, '#40ff60').px(66, 26, '#40ff60');
      p.opoly([[58, 22], [52, 14], [60, 18]], d); p.opoly([[66, 21], [70, 12], [72, 20]], d);
      [[28, 46], [36, 47], [48, 47], [56, 46]].forEach(([x, y]) => { p.obox(x, y, 5, 12, d); p.obox(x - 1, y + 11, 7, 3, '#5a5e66'); });
      p.thick(24, 36, 16, 28, d, 2); p.disc(16, 28, 1.5, '#5a5e66');
      p.odisc(86, 58, 5, '#ff70b0'); p.disc(84, 56, 1.5, '#ffd0e8');
    } },
    // ================================================================ INVENTIONS
    printing_press: { cap: 'A wooden printing press with its big screw, and a freshly printed page of letters.', draw(p) {
      p.vgrad(0, 56, '#5a4030', '#8a6a4a'); p.rect(0, 56, W, 16, '#4a3020'); p.dither(0, 56, W, 16, '#3a2418');
      const w = '#8a5a2a';
      p.obox(14, 4, 7, 60, w); p.obox(51, 4, 7, 60, w); p.obox(12, 2, 48, 8, w); p.obox(14, 30, 44, 5, w);
      p.obox(33, 10, 6, 14, '#9a9aa4'); for (let y = 11; y < 24; y += 3) p.line(34, y, 38, y + 2, '#5a5a64');
      p.thick(36, 18, 70, 12, '#6a3a1a', 2); p.disc(70, 12, 2, '#6a3a1a');
      p.obox(26, 24, 20, 6, '#6a4a2a'); p.obox(20, 42, 34, 6, '#6a4a2a'); p.obox(14, 48, 44, 4, w);
      p.obox(64, 34, 28, 24, '#f8f0d8'); p.rect(68, 38, 20, 3, '#1a1a1a'); for (let y = 44; y < 56; y += 3) p.rect(68, y, 20, 1, '#3a3a3a'); p.rect(68, 38, 4, 5, '#b01010');
      p.obox(2, 50, 10, 10, '#3a2a1a'); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) p.px(4 + i * 3, 52 + j * 3, '#c8c8d0');
    } },
    steam_engine: { cap: 'An early steam locomotive with its tall chimney, puffing along the rails.', draw(p, S) {
      S.sky(p, 52, '#5a9a3a');
      p.ell(28, 8, 8, 4, '#f0f0f0'); p.ell(18, 4, 6, 3, '#f8f8f8'); p.ell(38, 12, 5, 3, '#e8e8e8');
      p.rect(0, 60, W, 2, '#5a5a5a'); for (let x = 0; x < W; x += 6) p.rect(x, 62, 4, 2, '#6a4020');
      p.obox(30, 12, 6, 20, '#f0f0f0'); p.obox(28, 10, 10, 4, '#f0f0f0');
      p.oell(46, 36, 22, 7, '#ffd400'); p.rect(26, 36, 40, 2, '#d8a800'); p.obox(64, 26, 12, 14, '#ffd400');
      p.obox(16, 40, 64, 4, '#3a3a3a'); p.thick(22, 34, 30, 48, '#3a3a3a', 2);
      p.odisc(34, 51, 9, '#ffd400'); for (let a = 0; a < 6.28; a += 0.8) p.line(34, 51, 34 + Math.cos(a) * 8, 51 + Math.sin(a) * 8, '#7a5a00'); p.disc(34, 51, 2, '#3a3a3a');
      p.odisc(62, 55, 5, '#ffd400'); for (let a = 0; a < 6.28; a += 1) p.line(62, 55, 62 + Math.cos(a) * 4, 55 + Math.sin(a) * 4, '#7a5a00');
      p.obox(80, 42, 14, 10, '#8a6a3a'); p.odisc(84, 55, 4, '#3a3a3a'); p.odisc(91, 55, 4, '#3a3a3a');
    } },
    telegraph: { cap: 'A needle telegraph: electric needles swing to point at letters on a diamond-shaped board.', draw(p) {
      p.vgrad(0, H, '#c8b890', '#a08860');
      for (let x = 8; x < W; x += 40) { p.rect(x, 0, 2, 20, '#6a4a2a'); p.rect(x - 4, 4, 10, 1, '#6a4a2a'); }
      p.line(0, 5, 96, 5, '#333'); p.line(0, 8, 96, 9, '#333');
      p.obox(16, 18, 64, 46, '#7a4a20'); p.opoly([[48, 22], [76, 42], [48, 60], [20, 42]], '#f0e8d0');
      const L = 'ABDEFGHIKLMNOPRSTVWY'; let k = 0;
      for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) { if (k < L.length) p.text(46 - r * 5 + c * 10, 26 + r * 4, L[k++], '#3a2a10'); }
      for (let i = 0; i < 5; i++) { const x = 30 + i * 9, a = i === 1 ? -0.45 : i === 3 ? 0.45 : 0; p.thick(x - Math.sin(a) * 7, 46 - Math.cos(a) * 7, x + Math.sin(a) * 7, 46 + Math.cos(a) * 7, '#1a1a1a', 2); p.px(x - Math.sin(a) * 7, 46 - Math.cos(a) * 7, '#c03010'); p.disc(x, 46, 1, '#c8a040'); }
      for (let i = 0; i < 5; i++) p.obox(28 + i * 9, 66, 5, 4, '#c8a040');
    } },
    morse_code: { cap: 'A Morse key and a paper tape: dot dot dot, dash dash dash, dot dot dot. That spells SOS.', draw(p, S) {
      S.room(p);
      p.obox(4, 6, 88, 14, '#f8f0d8'); let x = 10; '... --- ...'.split('').forEach(ch => { if (ch === '.') { p.rect(x, 12, 3, 3, '#1a1a1a'); x += 6; } else if (ch === '-') { p.rect(x, 12, 9, 3, '#1a1a1a'); x += 12; } else x += 6; });
      p.text(15, 22, 'S', '#203060'); p.text(45, 22, 'O', '#203060'); p.text(78, 22, 'S', '#203060');
      p.obox(16, 54, 64, 8, '#6a4020'); p.obox(24, 48, 34, 4, '#c8a040'); p.obox(40, 44, 4, 6, '#a07820');
      p.opoly([[30, 44], [66, 40], [66, 43], [30, 47]], '#c8a040'); p.obox(62, 34, 10, 6, '#202020'); p.oell(67, 33, 6, 2, '#1a1a1a');
      p.obox(22, 50, 6, 4, '#a07820'); p.thick(16, 58, 4, 64, '#202020', 2);
      for (let i = 0; i < 3; i++) p.line(76 + i * 4, 30 - i * 3, 80 + i * 4, 26 - i * 3, '#ffd400');
    } },
    telephone: { cap: 'An early "candlestick" telephone: speak into the top, and hold the earpiece to your ear.', draw(p, S) {
      S.room(p);
      p.oell(40, 60, 14, 4, '#1a1a1a'); p.ell(40, 59, 12, 2, '#3a3a3a');
      p.obox(37, 22, 6, 38, '#1a1a1a'); p.line(38, 24, 38, 58, '#4a4a4a');
      p.opoly([[32, 10], [48, 10], [44, 22], [36, 22]], '#1a1a1a'); p.oell(40, 10, 8, 3, '#2a2a2a'); p.ell(40, 10, 5, 1.5, '#0a0a0a');
      p.obox(44, 30, 10, 3, '#3a3a3a'); p.thick(53, 31, 62, 28, '#3a3a3a', 1);
      p.opoly([[62, 20], [70, 20], [72, 40], [60, 40]], '#1a1a1a'); p.oell(66, 20, 5, 2, '#2a2a2a'); p.line(61, 24, 61, 38, '#4a4a4a');
      p.thick(66, 40, 70, 50, '#2a2a2a', 1); p.thick(70, 50, 54, 58, '#2a2a2a', 1); p.thick(26, 58, 4, 64, '#2a2a2a', 1);
      p.disc(66, 44, 0, '#000');
    } },
    light_bulb: { cap: 'An early electric light bulb, its thin filament glowing white-hot inside a glass globe with no air.', draw(p) {
      p.fill('#14141e');
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; p.line(48 + Math.cos(a) * 26, 28 + Math.sin(a) * 26, 48 + Math.cos(a) * 32, 28 + Math.sin(a) * 32, '#ffd400'); }
      p.disc(48, 28, 22, 'rgba(255,240,150,.18)'); p.odisc(48, 28, 18, '#fff4c0', '#c8b070'); p.ell(42, 22, 5, 7, '#fffbe8');
      p.opoly([[40, 42], [56, 42], [54, 50], [42, 50]], '#fff4c0', '#c8b070');
      p.line(44, 50, 44, 34, '#7a6a40'); p.line(52, 50, 52, 34, '#7a6a40');
      for (let i = 0; i < 9; i++) { const x = 44 + i, y = 30 - Math.sin(i / 8 * Math.PI) * 8; p.px(x, y, '#ff8a00'); p.px(x, y - 1, '#fff'); }
      p.line(44, 34, 44, 30, '#ff8a00'); p.line(52, 34, 52, 30, '#ff8a00');
      p.obox(40, 50, 16, 12, '#b8a888'); for (let y = 52; y < 62; y += 3) p.line(41, y, 54, y + 1, '#8a7a5a'); p.obox(44, 62, 8, 4, '#3a3a3a');
    } },
    radio: { cap: 'A 1930s "wireless" set, the family\'s evening entertainment, with music pouring out.', draw(p, S) {
      S.room(p);
      p.opoly([[22, 58], [22, 24], [30, 12], [48, 6], [66, 12], [74, 24], [74, 58]], '#8a4a1a'); p.line(23, 25, 30, 13, '#b06a30');
      p.opoly([[28, 44], [28, 26], [34, 16], [48, 11], [62, 16], [68, 26], [68, 44]], '#e8d8a0'); for (let x = 31; x < 66; x += 3) p.line(x, 15, x, 44, '#c8b878'); p.thick(48, 11, 48, 44, '#8a4a1a', 2);
      p.obox(28, 46, 40, 10, '#6a3410'); p.obox(40, 48, 16, 5, '#fff4c0'); p.line(44, 48, 44, 52, '#c02020');
      p.odisc(32, 51, 3, '#3a1a08'); p.odisc(64, 51, 3, '#3a1a08');
      [[80, 18], [86, 28], [82, 38]].forEach(([x, y], i) => { p.rect(x, y, 2, 6, '#203060'); p.rect(x + 2, y, 3, 2, '#203060'); p.disc(x, y + 6, 1.5, '#203060'); });
      for (let i = 1; i < 4; i++) { for (let a = -0.6; a < 0.6; a += 0.1) p.px(74 + Math.cos(a) * i * 5, 30 + Math.sin(a) * i * 5, '#5a6a9a'); }
    } },
    television: { cap: 'A wooden 1950s television set with a small, rounded black-and-white screen.', draw(p, S) {
      S.carpet(p);
      p.line(40, 10, 30, 0, '#2a2a2a'); p.line(48, 10, 60, 0, '#2a2a2a'); p.oell(44, 11, 5, 2, '#3a3a3a');
      p.obox(16, 12, 64, 44, '#7a4420'); p.rect(18, 14, 60, 1, '#a0602a');
      p.obox(20, 16, 40, 32, '#2a2a2a'); p.oell(40, 32, 18, 14, '#c8ccc8'); p.ell(40, 32, 16, 12, '#a8aca8');
      p.ring(40, 32, 8, '#3a3a3a'); p.line(24, 32, 56, 32, '#3a3a3a'); p.line(40, 20, 40, 44, '#3a3a3a'); for (let i = 0; i < 5; i++) p.rect(27 + i * 6, 38, 5, 4, ['#f0f0f0', '#c8c8c8', '#909090', '#585858', '#202020'][i]);
      p.ell(34, 24, 5, 3, 'rgba(255,255,255,.35)');
      p.odisc(70, 24, 4, '#c8b080'); p.odisc(70, 36, 4, '#c8b080'); for (let y = 44; y < 54; y += 2) p.rect(64, y, 12, 1, '#5a3010');
      p.obox(22, 56, 6, 10, '#5a3010'); p.obox(68, 56, 6, 10, '#5a3010');
    } },
    photography: { cap: 'An old wooden camera on a tripod, with a black cloth for the photographer to hide under.', draw(p) {
      p.vgrad(0, H, '#e8dcc0', '#c8b890'); p.rect(0, 60, W, 12, '#8a6a4a');
      p.obox(66, 10, 22, 28, '#7a5030'); p.obox(70, 14, 14, 18, '#c8b090'); p.oell(77, 21, 4, 5, '#e8d8b0'); p.rect(68, 44, 18, 16, '#7a5030');
      p.obox(28, 22, 18, 18, '#8a5a2a'); p.rect(30, 24, 14, 1, '#b07a40');
      for (let i = 0; i < 4; i++) p.obox(16 + i * 3, 25 + i, 4, 12 - i * 2, '#2a2a2a'); p.odisc(14, 31, 4, '#3a3a3a'); p.disc(14, 31, 2, '#6a8aca'); p.px(13, 30, '#fff');
      p.opoly([[42, 18], [56, 22], [60, 46], [46, 44]], '#141414'); p.line(48, 26, 52, 42, '#2a2a2a');
      p.line(36, 40, 26, 66, '#6a4020'); p.line(37, 40, 38, 66, '#6a4020'); p.line(38, 40, 50, 66, '#6a4020');
      p.obox(30, 8, 4, 4, '#c8c8c8'); p.line(32, 12, 32, 22, '#888'); p.ell(32, 6, 5, 3, 'rgba(255,255,220,.6)');
    } },
    cinema: { cap: 'A film projector beams flickering moving pictures of a steam train onto the screen.', draw(p) {
      p.fill('#100808');
      p.obox(44, 6, 48, 34, '#e8e8e0'); p.rect(46, 8, 44, 30, '#d0d0c8');
      p.rect(46, 26, 44, 2, '#555'); p.opoly([[60, 26], [78, 26], [84, 18], [66, 16]], '#3a3a3a'); p.obox(64, 12, 4, 6, '#3a3a3a'); p.ell(60, 10, 6, 3, '#e8e8e8'); p.odisc(66, 28, 2, '#3a3a3a'); p.odisc(78, 28, 2, '#3a3a3a');
      p.poly([[16, 34], [20, 30], [90, 6], [90, 40]], 'rgba(255,250,210,.12)');
      p.obox(4, 40, 22, 12, '#3a3a40'); p.odisc(8, 32, 7, '#4a4a50'); p.odisc(22, 30, 7, '#4a4a50'); for (const [x, y] of [[8, 32], [22, 30]]) { p.ring(x, y, 4, '#2a2a30'); p.disc(x, y, 1, '#c8c8c8'); }
      p.obox(24, 42, 6, 6, '#2a2a30'); p.disc(30, 45, 2, '#fff8c0');
      p.obox(10, 52, 4, 14, '#2a2a30'); p.rect(4, 64, 18, 3, '#2a2a30');
      for (let i = 0; i < 9; i++) p.disc(38 + i * 7, 66 + (i % 2), 4, '#1e1414');
    } },
    car: { cap: 'The first petrol car, from 1886, had three wheels and a top speed of about 10 mph.', draw(p, S) {
      S.sky(p, 54, '#8aa050'); p.rect(0, 60, W, 12, '#b8a070'); p.dither(0, 60, W, 12, '#a89060'); p.ell(20, 10, 9, 3, '#fff'); p.ell(70, 14, 7, 2.5, '#fff');
      const wheel = (x, y, r) => { p.ring(x, y, r, '#1a1a1a', 2); p.ring(x, y, r - 2, '#c8c8c8', 1); for (let a = 0; a < 6.28; a += 0.4) p.line(x, y, x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2), '#8a8a8a'); p.odisc(x, y, 2, '#4a4a4a'); };
      // tubular steel frame from the big back wheels to the little front wheel
      p.thick(28, 46, 78, 50, '#2a2a2a', 2); p.thick(30, 40, 62, 40, '#2a2a2a', 2);
      // engine and the big flat flywheel at the back
      p.obox(16, 32, 12, 12, '#5a5a62'); for (let y = 34; y < 42; y += 2) p.line(17, y, 26, y, '#7a7a84'); p.oell(22, 46, 9, 2, '#9a9aa4'); p.thick(22, 32, 22, 26, '#3a3a3a', 1); p.odisc(22, 25, 1.5, '#b8b8c0');
      // padded bench seat with a curved back
      p.obox(32, 32, 24, 5, '#2a2a2a'); p.rect(33, 33, 22, 3, '#8a2020'); p.rect(33, 33, 22, 1, '#b04040'); p.obox(32, 22, 4, 12, '#2a2a2a'); p.rect(33, 23, 2, 10, '#8a2020');
      // steering tiller with a crank handle
      p.thick(68, 50, 64, 28, '#2a2a2a', 1); p.thick(64, 28, 56, 26, '#2a2a2a', 1); p.obox(54, 24, 3, 5, '#6a4a2a');
      // the driver in his Sunday best: frock coat and a top hat
      p.thick(44, 33, 54, 36, '#3a3a50', 2); p.thick(54, 36, 58, 44, '#3a3a50', 2); p.rect(57, 44, 4, 2, '#1a1a1a');
      p.obox(38, 20, 9, 14, '#3a3a50'); p.odisc(43, 16, 3.5, '#f2c79a'); p.rect(41, 18, 5, 2, '#8a6a4a'); p.obox(39, 6, 8, 8, '#1a1a1a'); p.rect(37, 13, 12, 2, '#1a1a1a'); p.px(46, 15, '#000');
      p.thick(45, 23, 54, 27, '#3a3a50', 2); p.odisc(55, 27, 1.5, '#f2c79a');
      wheel(30, 48, 13); wheel(78, 55, 7);
      for (let i = 0; i < 3; i++) p.disc(8 - i * 3, 30 - i * 5, 2 + i, 'rgba(210,210,210,.65)');
    } },
    aeroplane: { cap: 'The Wright brothers\' Flyer lifts off over the sand dunes of Kitty Hawk in 1903.', draw(p) {
      p.vgrad(0, 56, '#8ab8e8', '#e0f0ff'); p.rect(0, 56, W, 16, '#e8d8a8'); p.poly([[0, 56], [20, 50], [44, 56]], '#d8c890'); p.poly([[60, 56], [84, 48], [96, 52], [96, 56]], '#d8c890');
      p.rect(8, 60, 30, 2, '#8a6a4a');
      const wy1 = 18, wy2 = 32;
      p.opoly([[14, wy1], [82, wy1 - 2], [84, wy1 + 2], [12, wy1 + 4]], '#f0e8d0'); p.opoly([[14, wy2], [82, wy2 - 2], [84, wy2 + 2], [12, wy2 + 4]], '#f0e8d0');
      for (let x = 18; x < 82; x += 10) p.line(x, wy1 + 3, x, wy2, '#6a4a2a');
      p.opoly([[86, 22], [94, 21], [94, 24], [86, 25]], '#f0e8d0'); p.line(84, 26, 86, 24, '#6a4a2a'); p.line(82, 30, 86, 24, '#6a4a2a');
      p.opoly([[2, 24], [8, 22], [8, 32], [2, 34]], '#f0e8d0'); p.line(8, 27, 14, 27, '#6a4a2a');
      p.obox(44, 28, 8, 4, '#2a2a2a'); p.ell(32, 25, 1, 6, 'rgba(120,120,120,.6)'); p.ell(26, 25, 1, 6, 'rgba(120,120,120,.6)');
      p.rect(48, 26, 10, 2, '#3a2a1a'); p.disc(58, 26, 1.5, '#3a2a1a');
      p.disc(30, 60, 2, '#3a2a1a'); p.rect(29, 62, 3, 6, '#3a2a1a');
    } },
    laser: { cap: 'A ruby rod inside a coiled flash tube makes the first laser\'s thin red beam.', draw(p) {
      p.fill('#101018'); for (let x = 0; x < W; x += 8) p.rect(x, 50, 4, 22, '#16161e');
      p.obox(6, 22, 34, 18, '#9a9aa4'); p.rect(8, 24, 30, 2, '#c8c8d0');
      p.obox(12, 28, 22, 6, '#c01030'); p.rect(13, 29, 20, 1, '#ff6080');
      for (let x = 12; x < 34; x += 3) p.ell(x, 31, 1.5, 6, 'rgba(240,240,255,.7)');
      p.thick(40, 31, 84, 31, 'rgba(255,0,0,.35)', 3); p.line(40, 31, 84, 31, '#ff3030');
      p.obox(84, 18, 6, 26, '#3a3a44'); p.disc(84, 31, 4, 'rgba(255,80,80,.6)'); p.disc(84, 31, 2, '#fff');
      p.text(8, 46, 'MAY 1960', '#ff6060');
    } },
    microwave_oven: { cap: 'A microwave oven popping corn, just as its discoverer tried in 1945.', draw(p, S) {
      S.room(p);
      p.obox(10, 14, 76, 40, '#e8e4dc'); p.obox(14, 18, 52, 32, '#2a2a2a'); p.rect(16, 20, 48, 28, '#3a3a20'); p.ell(40, 46, 18, 3, '#fff8d0');
      for (let y = 21; y < 47; y += 2) for (let x = 17; x < 63; x += 2) p.px(x, y, 'rgba(0,0,0,.35)');
      p.opoly([[30, 44], [50, 44], [54, 30], [48, 26], [40, 29], [32, 26], [26, 30]], '#fff8ec'); for (let x = 32; x < 50; x += 5) p.line(x, 31, x, 43, '#e03030'); p.line(26, 30, 54, 30, '#c8b8a0');
      [[30, 22], [38, 20], [46, 21], [52, 24], [42, 15], [34, 16]].forEach(([x, y]) => { p.odisc(x, y, 2, '#fffbe8', '#c8a860'); p.px(x + 1, y + 1, '#ffd890'); });
      p.obox(66, 18, 18, 12, '#3a3a3a'); p.text(68, 22, '2:00', '#40ff60');
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) p.obox(70 + j * 6, 36 + i * 5, 5, 4, '#c8c4bc');
    } },
    barcode: { cap: 'A red laser beam reads the stripes of a barcode on a packet of chewing gum.', draw(p) {
      p.vgrad(0, H, '#e0e8f0', '#a8b8c8');
      p.obox(10, 22, 56, 34, '#ffe060'); p.rect(12, 24, 52, 6, '#e02a8a');
      p.obox(16, 32, 44, 20, '#ffffff'); const w = [1, 2, 1, 1, 3, 1, 2, 2, 1, 1, 3, 2, 1, 1, 2, 1, 1, 3, 1, 2, 1];
      let x = 19; w.forEach((b, i) => { if (i % 2 === 0) p.rect(x, 34, b, 13, '#000'); x += b; });
      p.text(19, 48, '50123', '#000');
      p.opoly([[72, 4], [88, 8], [84, 22], [70, 16]], '#3a3a44'); p.obox(78, 18, 8, 24, '#2a2a34');
      p.poly([[72, 16], [74, 18], [20, 42], [18, 40]], 'rgba(255,40,40,.25)'); p.line(18, 41, 60, 41, '#ff2020'); p.line(73, 17, 60, 41, 'rgba(255,40,40,.6)');
    } },
    calculator: { cap: 'A 1970s pocket calculator with glowing red numbers. Type 0.7734 and turn it upside down!', draw(p) {
      p.vgrad(0, H, '#c8d8c0', '#90a888');
      p.obox(28, 4, 40, 64, '#2a2a30'); p.obox(31, 8, 34, 12, '#100808');
      p.text(35, 11, '0.7734', '#ff2020'); p.rect(33, 10, 30, 8, 'rgba(255,40,40,.08)');
      const keys = ['7', '8', '9', '/', '4', '5', '6', 'X', '1', '2', '3', '-', '0', '.', '=', '+'];
      keys.forEach((k, i) => { const x = 31 + (i % 4) * 9, y = 24 + ((i / 4) | 0) * 10; p.obox(x, y, 7, 8, '/X-+='.includes(k) ? '#c86a20' : '#d8d8d0'); p.text(x + 2, y + 2, k, '#1a1a1a'); });
    } },
    walkman: { cap: 'A personal cassette player with lightweight headphones: music you can take for a walk.', draw(p) {
      p.vgrad(0, H, '#80d0ff', '#f0f8ff');
      p.obox(30, 14, 36, 50, '#3a6ab8'); p.rect(32, 16, 32, 2, '#6a9ae8');
      p.obox(34, 20, 28, 20, '#1a1a2a'); p.rect(36, 22, 24, 16, '#5a4a3a'); p.odisc(42, 30, 3, '#e8e0d0'); p.odisc(54, 30, 3, '#e8e0d0'); p.rect(45, 28, 6, 4, '#2a1a10');
      p.rect(36, 22, 24, 3, 'rgba(255,255,255,.2)');
      for (let i = 0; i < 4; i++) p.obox(33 + i * 8, 44, 7, 5, '#c8ccd4');
      p.obox(62, 54, 6, 6, '#c8ccd4');
      p.thick(66, 52, 82, 52, '#2a2a2a', 1); p.thick(82, 52, 82, 30, '#2a2a2a', 1);
      for (let a = 3.3; a < 6.1; a += 0.05) p.thick(78 + Math.cos(a) * 12, 22 + Math.sin(a) * 12, 78 + Math.cos(a) * 12, 22 + Math.sin(a) * 12, '#c8c8d0', 2);
      p.oell(66, 24, 4, 6, '#ff8a20'); p.oell(90, 24, 4, 6, '#ff8a20');
    } },
    vhs: { cap: 'A video recorder flashing 12:00 (nobody knows how to set it), with a VHS tape going in.', draw(p, S) {
      S.carpet(p);
      p.obox(6, 32, 84, 22, '#2a2a30'); p.rect(8, 34, 80, 2, '#4a4a52');
      p.obox(12, 38, 38, 8, '#141418'); p.obox(60, 38, 22, 8, '#0a1a0a'); p.text(62, 40, '12:00', '#30ff40');
      for (let i = 0; i < 5; i++) p.obox(12 + i * 8, 48, 6, 3, '#8a8a90');
      p.obox(16, 18, 30, 22, '#141414'); p.rect(20, 22, 22, 9, '#2a2a2a'); p.odisc(25, 26, 3, '#e8e8e8'); p.odisc(37, 26, 3, '#e8e8e8'); p.rect(28, 25, 6, 3, '#3a2a1a');
      p.obox(19, 32, 24, 6, '#f0f0f0'); p.text(22, 33, 'TELLY', '#e02020');
    } },
    compact_disc: { cap: 'A shiny 12 cm compact disc sitting in its open plastic case.', draw(p) {
      p.vgrad(0, H, '#1a1040', '#4a2080');
      p.opoly([[8, 14], [52, 10], [56, 62], [12, 66]], 'rgba(200,220,255,.25)'); p.line(8, 14, 52, 10, '#c8d8ff'); p.line(52, 10, 56, 62, '#c8d8ff'); p.rect(14, 18, 34, 40, 'rgba(255,255,255,.08)');
      p.odisc(58, 38, 26, '#c8d0e0'); p.disc(58, 38, 25, '#dce4f4');
      for (let a = 0; a < 6.28; a += 0.03) { for (let r = 9; r < 25; r += 1.5) if (Math.sin(a * 2 + r * 0.35) > 0.65) p.px(58 + Math.cos(a) * r, 38 + Math.sin(a) * r, `hsl(${(a * 115 + r * 8) % 360},85%,70%)`); }
      p.disc(58, 38, 8, '#eef2fa'); p.ring(58, 38, 8, '#a8b0c0'); p.disc(58, 38, 3, '#2a1a5a'); p.ring(58, 38, 3, '#8890a0');
      p.line(40, 22, 50, 16, '#fff'); p.line(42, 24, 48, 20, '#fff');
    } },
    velcro: { cap: 'Velcro under a magnifying glass: tiny hooks on one strip, fuzzy loops on the other.', draw(p) {
      p.fill('#d8dce4');
      p.rect(0, 50, W, 22, '#2a4a8a'); for (let x = 0; x < W; x += 3) { p.ring(x + 1, 52, 2, '#4a6ab8'); }
      p.rect(0, 0, W, 16, '#2a4a8a');
      p.odisc(48, 36, 26, '#e8f0ff', '#3a3a3a'); p.ring(48, 36, 27, '#7a5a2a', 2);
      p.rect(24, 22, 48, 10, '#2a4a8a'); for (let x = 26; x < 72; x += 6) { p.line(x, 32, x, 38, '#1a2a5a'); p.line(x, 38, x + 3, 38, '#1a2a5a'); p.line(x + 3, 38, x + 3, 36, '#1a2a5a'); }
      p.rect(24, 46, 48, 8, '#2a4a8a'); for (let x = 28; x < 70; x += 6) p.ring(x, 44, 3, '#3a5aa8', 1);
      p.disc(48, 36, 26, 'rgba(255,255,255,.0)'); p.ell(38, 24, 6, 3, 'rgba(255,255,255,.35)');
      p.thick(66, 56, 84, 70, '#7a5a2a', 4);
    } },
    theremin: { cap: 'A theremin: one hand near the upright aerial changes the note, the other near the loop changes the volume.', draw(p) {
      p.vgrad(0, H, '#2a1040', '#100820'); p.ell(48, 40, 40, 20, 'rgba(255,138,192,.08)');
      // wooden cabinet on legs, with a speaker grille and two knobs
      p.obox(22, 40, 52, 16, '#8a5420'); p.rect(24, 42, 48, 2, '#b07438'); p.obox(30, 45, 22, 9, '#3a2010'); for (let y = 47; y < 53; y += 2) for (let x = 32; x < 51; x += 2) p.px(x, y, '#6a4020');
      p.odisc(60, 50, 2.5, '#d8c8a0'); p.odisc(67, 50, 2.5, '#d8c8a0'); p.px(60, 48, '#3a2010').px(67, 48, '#3a2010');
      p.obox(26, 56, 4, 14, '#5a3010'); p.obox(66, 56, 4, 14, '#5a3010'); p.rect(26, 64, 44, 2, '#5a3010');
      // the upright pitch aerial (right) and the volume loop (left)
      p.thick(70, 40, 70, 4, '#b8b8c4', 2); p.line(70, 40, 70, 4, '#f4f4fc'); p.odisc(70, 4, 1.5, '#e0e0e8');
      p.thick(24, 44, 14, 44, '#b8b8c4', 1); for (let a = 0; a < 6.28; a += 0.06) p.px(9 + Math.cos(a) * 7, 41 + Math.sin(a) * 3, '#e8e8f0');
      // two hands floating near them, never touching: sleeves come in from each side
      const hand = (x, y, dir, cuff) => { p.thick(x - dir * 22, y + 2, x - dir * 5, y + 1, cuff, 4); p.oell(x, y, 4, 3, '#f2c79a'); for (let i = 0; i < 4; i++) p.rect(dir > 0 ? x + 3 : x - 7, y - 3 + i * 2, 5, 1, i % 2 ? '#e8b88a' : '#f2c79a'); p.rect(x - 1, y - 5, 2, 2, '#f2c79a'); };
      hand(80, 18, -1, '#3a3a80'); hand(9, 32, 1, '#3a3a80');
      // the eerie wobbly sound
      for (let i = 1; i < 4; i++) for (let a = -0.8; a < 0.8; a += 0.07) p.px(70 - Math.cos(a) * i * 7, 14 + Math.sin(a) * i * 7, i === 1 ? '#ffb0d8' : '#ff8ac0');
      for (let x = 0; x < W; x++) p.px(x, 66 + Math.sin(x * 0.45) * 2.5 * Math.sin(x * 0.07), 'rgba(255,138,192,.8)');
    } },
    // ================================================================ Y2K & 1999
    y2k_bug: { cap: 'A cartoon Millennium Bug crawls over a computer as the date ticks from 99 to 00.', draw(p, S) {
      S.room(p); crt(p, 10, 12, 76, 46, '#0000a8');
      p.text(16, 18, 'DATE:', '#c0c0c0'); p.text(16, 25, '31/12/99', '#fff', 2); p.text(16, 37, '01/01/00', '#ffd400', 2);
      p.oell(64, 8, 9, 4, '#3a9a2a'); p.odisc(74, 6, 4, '#3a9a2a'); p.disc(75, 5, 1.5, '#fff'); p.px(76, 5, '#000'); p.line(55, 8, 73, 8, '#1f5e14');
      for (let i = 0; i < 3; i++) p.line(58 + i * 5, 11, 56 + i * 5, 14, '#1f5e14');
      p.line(76, 2, 78, 0, '#1f5e14'); p.line(73, 2, 73, 0, '#1f5e14');
    } },
    millennium: { cap: 'A clock strikes midnight under the fireworks. Is it the new millennium yet? Discuss.', draw(p, S) {
      S.night(p, 2000);
      [[18, 14, '#ff4040'], [78, 12, '#ffd400'], [62, 28, '#40c0ff'], [28, 34, '#ff60ff']].forEach(([x, y, c]) => { for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; p.line(x + Math.cos(a) * 3, y + Math.sin(a) * 3, x + Math.cos(a) * 9, y + Math.sin(a) * 9, c); } p.disc(x, y, 1, '#fff'); });
      p.obox(36, 26, 24, 46, '#8a7a5a'); p.opoly([[34, 26], [48, 12], [62, 26]], '#6a5a40'); p.rect(38, 28, 1, 44, '#a89a78');
      p.odisc(48, 38, 9, '#fff8e0'); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; p.px(48 + Math.cos(a) * 7, 38 + Math.sin(a) * 7, '#000'); }
      p.line(48, 38, 48, 31, '#000'); p.line(49, 38, 49, 32, '#000'); p.disc(48, 38, 1, '#c00');
      p.rect(0, 64, W, 8, '#0a0a14'); for (let i = 0; i < 12; i++) p.disc(4 + i * 8, 64, 3, '#0a0a14');
    } },
    leap_year: { cap: 'February with a 29th day, and a frog to help it leap. 2000 will have one!', draw(p, S) {
      S.room(p);
      p.obox(14, 4, 50, 48, '#fff'); p.obox(14, 4, 50, 10, '#2a7ad8'); p.text(31, 7, 'FEB', '#fff'); p.rect(22, 2, 2, 4, '#555'); p.rect(54, 2, 2, 4, '#555');
      for (let d = 1; d <= 29; d++) { const i = (d - 1) % 7, j = ((d - 1) / 7) | 0; const x = 17 + i * 6.5, y = 17 + j * 7; p.rect(x, y, 4, 4, d === 29 ? '#e02020' : '#c8d0e0'); }
      p.ring(19, 47, 5, '#e02020');
      p.oell(78, 54, 9, 6, '#3ab02a'); p.odisc(74, 46, 3, '#3ab02a'); p.odisc(82, 46, 3, '#3ab02a'); p.disc(74, 46, 1, '#000'); p.disc(82, 46, 1, '#000'); p.line(74, 56, 82, 56, '#1f6a14');
      p.thick(70, 58, 64, 62, '#3ab02a', 2); p.thick(86, 58, 92, 62, '#3ab02a', 2);
      for (let i = 0; i < 6; i++) p.px(66 + i * 2, 40 - Math.sin(i / 5 * 3.14) * 6, '#888');
    } },
    year_1999: { cap: '1999 in a nutshell: a total eclipse, the euro (banks and computers only, no coins yet) and a very busy calendar.', draw(p) {
      p.vgrad(0, H, '#101030', '#3a3a70');
      p.disc(24, 22, 15, 'rgba(255,255,230,.18)'); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; p.line(24 + Math.cos(a) * 11, 22 + Math.sin(a) * 11, 24 + Math.cos(a) * 16, 22 + Math.sin(a) * 16, '#fff8d8'); } p.disc(24, 22, 11, '#fff8d8'); p.disc(24, 22, 10, '#000');
      p.text(8, 42, '11 AUG', '#fff8d8');
      p.obox(58, 4, 30, 22, '#c8c4bc'); p.rect(61, 7, 24, 15, '#102040'); p.text(63, 9, 'EUR', '#ffd400'); p.text(63, 15, '1.00', '#30ff30'); p.rect(68, 26, 10, 3, '#a8a49c'); // the euro: screen money only in 1999
      p.obox(44, 36, 40, 32, '#fff'); p.obox(44, 36, 40, 9, '#e02020'); p.text(52, 38, '1999', '#fff');
      for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) p.rect(48 + c * 6, 48 + r * 6, 4, 4, r === 2 && c === 5 ? '#e02020' : '#c8d0e0');
    } },
  });
})();

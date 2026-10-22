/* carta-art-games.js: JackCarta 99 pictures for Consoles & Handhelds and Video Games articles (96x72 pixel art).
 * Generic, representative drawings: real shapes and colours, never logos, wordmarks or copied character sprites. */
(function () {
  const A = window.Carta && Carta.art; if (!A) return;
  A.add({
    game_boy: { cap: 'The original Game Lad: grey, chunky, four shades of green. It survives being dropped.', draw(p, S) {
      p.vgrad(0, 72, '#ffe8a0', '#ffc060');
      // body with the famous rounded bottom-right corner
      p.opoly([[30, 3], [66, 3], [66, 58], [58, 68], [30, 68]], '#c8c4bc');
      p.rect(31, 4, 34, 1, '#e8e4dc'); p.rect(31, 4, 1, 63, '#e0dcd4');
      p.line(32, 8, 64, 8, '#9a968e');
      // screen bezel and screen
      p.obox(34, 11, 28, 24, '#585868'); p.px(37, 21, '#e01040');
      p.rect(39, 14, 20, 18, '#9bbc0f'); p.rect(39, 14, 20, 1, '#8bac0f');
      p.rect(42, 26, 6, 3, '#306230').rect(45, 23, 3, 3, '#306230'); p.rect(52, 18, 3, 9, '#0f380f'); p.rect(41, 29, 16, 3, '#306230');
      // controls
      p.obox(35, 42, 11, 4, '#202020'); p.obox(38, 39, 5, 10, '#202020'); p.rect(39, 43, 3, 2, '#202020');
      p.odisc(54, 46, 3, '#a8105a'); p.odisc(61, 43, 3, '#a8105a'); p.px(53, 45, '#e04090').px(60, 42, '#e04090');
      p.opoly([[42, 54], [47, 52], [48, 54], [43, 56]], '#808080'); p.opoly([[50, 54], [55, 52], [56, 54], [51, 56]], '#808080');
      for (let i = 0; i < 5; i++) p.thick(55 + i * 2.2, 64, 60 + i * 2.2, 57, '#8a867e', 1);
    } },
  });

  // ---------------------------------------------------------------- shared little helpers (each subject is still drawn on its own)
  function tv(p, x, y, w, h, body) { // a chunky CRT telly; returns the screen rectangle
    p.obox(x, y, w, h, body || '#5a4a3a'); p.rect(x + 3, y + 3, w - 12, h - 6, '#202020'); const sx = x + 4, sy = y + 4, sw = w - 14, sh = h - 8; p.rect(sx, sy, sw, sh, '#000');
    p.odisc(x + w - 5, y + 6, 1.5, '#c8c8c8'); p.odisc(x + w - 5, y + 11, 1.5, '#c8c8c8'); return [sx, sy, sw, sh];
  }
  function wood(p, x, y, w, h) { p.rect(x, y, w, h, '#7a4a1a'); for (let j = 0; j < h; j += 2) p.rect(x, y + j, w, 1, j % 4 ? '#8a5a2a' : '#6a3a10'); for (let i = 3; i < w; i += 9) p.rect(x + i, y + ((i * 7) % Math.max(1, h)), 4, 1, '#5a3008'); }
  function dpad(p, x, y, c) { p.rect(x - 4, y - 1, 9, 3, '#000'); p.rect(x - 1, y - 4, 3, 9, '#000'); p.rect(x - 3, y, 7, 1, c || '#333'); p.rect(x, y - 3, 1, 7, c || '#333'); }

  A.add({
    magnavox_odyssey: { cap: 'The Odyssey with its two box controllers, and a plastic overlay stuck on the telly.', draw(p, S) {
      S.carpet(p);
      const [sx, sy, sw, sh] = tv(p, 30, 3, 40, 30, '#6a5040');
      p.rect(sx, sy, sw, sh, '#103a20'); p.rect(sx, sy, sw, sh / 2, '#1a5a30'); p.rect(sx + sw / 2, sy, 1, sh, '#e8e8e8'); p.rect(sx + 3, sy + 7, 2, 2, '#fff'); p.rect(sx + sw - 5, sy + 13, 2, 2, '#fff'); p.rect(sx + 13, sy + 11, 2, 2, '#fff');
      // main unit: white top, black base
      p.opoly([[22, 46], [74, 46], [80, 58], [16, 58]], '#1a1a1a'); p.opoly([[24, 40], [72, 40], [74, 46], [22, 46]], '#f0ece0'); p.rect(28, 42, 16, 2, '#888'); p.rect(56, 42, 12, 1, '#c00');
      // two controllers with knobs on the sides
      for (const cx of [5, 76]) { p.obox(cx, 52, 14, 10, '#2a2a2a'); p.rect(cx + 2, 53, 10, 2, '#f0ece0'); p.odisc(cx - 1, 57, 2.5, '#c8c8c8'); p.odisc(cx + 15, 57, 2.5, '#c8c8c8'); p.odisc(cx + 7, 51, 2, '#c8c8c8'); p.rect(cx + 5, 58, 4, 2, '#c00'); }
      p.line(19, 57, 22, 52, '#111'); p.line(76, 57, 74, 52, '#111');
    } },
    atari_2600: { cap: 'A woodgrain-fronted console with six silver switches, and the classic one-button joystick.', draw(p, S) {
      S.carpet(p);
      // top: black ribbed, cartridge slot
      p.opoly([[8, 34], [62, 34], [70, 26], [16, 26]], '#202020'); for (let i = 0; i < 6; i++) p.line(18 + i * 2, 27 + i, 60 + i * 0, 27 + i, i % 2 ? '#303030' : '#141414');
      p.opoly([[30, 30], [48, 30], [51, 27], [33, 27]], '#000'); p.opoly([[32, 26], [48, 26], [50, 24], [34, 24]], '#5a5a5a');
      // front: woodgrain panel with switches
      p.rect(8, 34, 54, 16, '#000'); wood(p, 9, 35, 52, 14);
      for (let i = 0; i < 6; i++) { const x = 13 + i * 8; p.obox(x, 38, 5, 8, '#b8b8b8'); p.rect(x + 1, i % 2 ? 39 : 42, 3, 3, '#e8e8e8'); }
      p.opoly([[62, 34], [70, 26], [70, 42], [62, 50]], '#101010');
      // joystick
      p.obox(68, 52, 22, 14, '#1a1a1a'); p.odisc(72, 55, 2, '#e10600'); p.obox(78, 34, 4, 20, '#2a2a2a'); p.rect(79, 35, 1, 18, '#555'); p.line(68, 62, 56, 66, '#111'); p.line(56, 66, 40, 64, '#111');
    } },
    intellivision: { cap: 'The long woodgrain-and-gold Intellivision, with its keypad controllers tucked into the top.', draw(p, S) {
      S.carpet(p);
      p.opoly([[4, 40], [86, 40], [92, 32], [10, 32]], '#202020'); p.rect(4, 40, 82, 12, '#000'); wood(p, 5, 41, 80, 4); p.rect(5, 45, 80, 6, '#c8a040'); p.rect(5, 45, 80, 1, '#f0d070'); p.opoly([[86, 40], [92, 32], [92, 44], [86, 52]], '#101010');
      p.opoly([[14, 36], [40, 36], [42, 34], [16, 34]], '#555');
      // two controllers in their slots, plus one held out in front
      for (const x of [56, 70]) { p.opoly([[x, 38], [x + 12, 38], [x + 14, 33], [x + 2, 33]], '#c8a040'); }
      const cx = 30, cy = 50; p.obox(cx, cy, 18, 21, '#1a1a1a'); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) p.obox(cx + 2 + c * 5, cy + 2 + r * 3, 4, 3, '#e8e0c0');
      p.odisc(cx + 9, cy + 17, 3, '#c8a040'); p.px(cx + 8, cy + 16, '#f0d070'); p.obox(cx - 2, cy + 6, 2, 6, '#555'); p.obox(cx + 18, cy + 6, 2, 6, '#555');
      p.line(cx + 9, cy, 46, 41, '#111');
    } },
    colecovision: { cap: 'The black ColecoVision, its stubby-joystick controllers clipped on the side.', draw(p, S) {
      S.carpet(p);
      p.opoly([[6, 34], [70, 34], [78, 26], [14, 26]], '#262626'); for (let i = 0; i < 4; i++) p.line(16 + i * 2, 28 + i * 2, 68, 28 + i * 2, '#1a1a1a');
      p.opoly([[30, 30], [50, 30], [52, 28], [32, 28]], '#000');
      p.rect(6, 34, 64, 14, '#000'); p.rect(7, 35, 62, 12, '#202020'); p.rect(7, 39, 62, 2, '#a8a8a8'); p.rect(7, 42, 62, 1, '#707070'); p.opoly([[70, 34], [78, 26], [78, 40], [70, 48]], '#141414');
      p.rect(56, 36, 4, 2, '#e10600');
      // controller
      const cx = 72, cy = 44; p.obox(cx, cy, 18, 26, '#1a1a1a'); p.obox(cx + 7, cy - 5, 4, 7, '#333'); p.odisc(cx + 9, cy - 5, 3, '#2a2a2a'); p.rect(cx + 2, cy + 2, 14, 1, '#888');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) p.obox(cx + 2 + c * 5, cy + 9 + r * 4, 4, 3, '#d8d8d8');
      p.obox(cx - 2, cy + 3, 3, 5, '#c00'); p.obox(cx + 17, cy + 3, 3, 5, '#c00');
    } },
    vectrex: { cap: 'The Vectrex brought its own upright screen, drawing glowing lines instead of dots.', draw(p, S) {
      S.room(p);
      p.opoly([[26, 4], [66, 4], [68, 58], [24, 58]], '#1a1a1a'); p.rect(27, 5, 38, 1, '#3a3a3a');
      p.rect(30, 8, 32, 40, '#000'); p.rect(30, 8, 32, 40, '#030806');
      // coloured overlay tint and vector lines
      p.rect(30, 8, 32, 8, 'rgba(255,60,60,.18)'); p.rect(30, 40, 32, 8, 'rgba(60,120,255,.18)');
      const g = '#c8ffc8'; p.line(46, 20, 42, 30, g).line(46, 20, 50, 30, g).line(42, 30, 50, 30, g);
      p.line(34, 14, 38, 11, g).line(38, 11, 41, 15, g).line(41, 15, 36, 18, g).line(36, 18, 34, 14, g);
      p.line(52, 36, 57, 34, g).line(57, 34, 59, 40, g).line(59, 40, 53, 42, g).line(53, 42, 52, 36, g); p.px(46, 26, '#fff').px(44, 37, '#fff');
      p.rect(28, 50, 36, 6, '#2a2a2a'); for (let x = 30; x < 62; x += 3) p.rect(x, 52, 2, 2, '#111');
      // controller
      p.opoly([[30, 60], [62, 60], [66, 70], [26, 70]], '#202020'); p.obox(32, 62, 5, 5, '#555'); p.odisc(34, 61, 1.5, '#888');
      [44, 50, 56, 62].forEach((x, i) => p.odisc(x - 2, 65, 1.6, ['#e10600', '#e10600', '#e10600', '#e10600'][i]));
    } },
    game_watch: { cap: 'A fold-up, two-screen Game & Watch with a cross-shaped D-pad. It tells the time too.', draw(p, S) {
      p.vgrad(0, 72, '#d0e8ff', '#90b8e8');
      // top half (open lid)
      p.obox(22, 2, 52, 32, '#d86a1a'); p.obox(27, 6, 42, 24, '#9a9a8a'); p.rect(29, 8, 38, 20, '#c8ccb0');
      p.rect(31, 24, 34, 1, '#404038'); p.rect(31, 16, 26, 1, '#404038'); for (let x = 33; x < 63; x += 6) p.rect(x, 16, 1, 8, '#404038');
      p.rect(36, 10, 4, 5, '#202018'); p.rect(37, 9, 2, 1, '#202018'); p.disc(56, 22, 1.5, '#202018'); p.text(52, 9, '12:00', '#404038');
      // hinge and bottom half
      p.rect(24, 34, 48, 3, '#7a3a08');
      p.obox(22, 37, 52, 32, '#e07a2a'); p.obox(37, 40, 22, 16, '#9a9a8a'); p.rect(39, 42, 18, 12, '#c8ccb0'); p.rect(41, 50, 14, 1, '#404038'); p.rect(44, 45, 3, 4, '#202018');
      dpad(p, 30, 50, '#333'); p.odisc(65, 50, 3, '#c80000'); p.px(64, 49, '#ff6060');
      p.obox(28, 61, 6, 3, '#555'); p.obox(36, 61, 6, 3, '#555'); p.obox(56, 61, 10, 3, '#555');
    } },
    nes: { cap: 'The grey front-loading NES, with its rectangular controller: a D-pad, two red buttons, done.', draw(p, S) {
      S.carpet(p);
      // top surface
      p.opoly([[6, 26], [64, 26], [72, 18], [14, 18]], '#c8c8c4'); p.line(18, 21, 66, 21, '#a8a8a4');
      // front: light grey top band, dark lower band, flap with ridges
      p.rect(6, 26, 58, 22, '#000'); p.rect(7, 27, 56, 9, '#cfcfcb'); p.rect(7, 27, 56, 1, '#efefeb'); p.rect(7, 36, 56, 11, '#3a3a3a'); p.rect(7, 36, 56, 1, '#555');
      p.obox(24, 28, 36, 8, '#b8b8b4'); for (let i = 0; i < 6; i++) p.rect(26, 29 + i, 32, 0.6, '#9a9a96'); for (let i = 0; i < 6; i++) p.rect(26, 29 + i, 32, 1, i % 2 ? '#a8a8a4' : '#c4c4c0');
      p.obox(10, 29, 5, 3, '#9a9a96'); p.obox(10, 32, 5, 3, '#9a9a96'); p.px(17, 30, '#e10600');
      p.obox(12, 39, 6, 5, '#d8d8d4'); p.obox(21, 39, 6, 5, '#d8d8d4');
      p.opoly([[64, 26], [72, 18], [72, 40], [64, 48]], '#9a9a96'); p.opoly([[64, 36], [72, 28], [72, 40], [64, 48]], '#2a2a2a');
      // controller
      p.obox(44, 52, 46, 18, '#c8c8c4'); p.rect(46, 55, 42, 12, '#1a1a1a'); p.rect(47, 56, 40, 1, '#3a3a3a');
      dpad(p, 52, 61, '#2a2a2a'); p.obox(61, 60, 5, 2, '#888'); p.obox(68, 60, 5, 2, '#888'); p.odisc(78, 62, 2.5, '#d80000'); p.odisc(85, 62, 2.5, '#d80000');
      p.line(44, 58, 30, 52, '#222'); p.line(30, 52, 24, 48, '#222');
    } },
    master_system: { cap: 'The angular black Master System with its red trim, and its two-button pad.', draw(p, S) {
      S.carpet(p);
      p.opoly([[6, 30], [60, 30], [70, 20], [26, 20], [16, 24]], '#1a1a1a'); p.line(26, 21, 68, 21, '#3a3a3a'); p.opoly([[30, 26], [56, 26], [60, 22], [34, 22]], '#000');
      p.rect(6, 30, 54, 18, '#000'); p.rect(7, 31, 52, 16, '#202020'); p.rect(7, 31, 52, 1, '#3a3a3a');
      for (let i = 0; i < 5; i++) p.rect(9, 34 + i * 2, 22, 1, '#e10600');
      p.obox(36, 38, 18, 4, '#101010'); p.obox(36, 33, 4, 3, '#555'); p.obox(42, 33, 4, 3, '#555');
      p.opoly([[60, 30], [70, 20], [70, 38], [60, 48]], '#0a0a0a');
      p.obox(50, 50, 40, 18, '#1a1a1a'); p.rect(52, 52, 36, 1, '#3a3a3a'); dpad(p, 58, 59, '#3a3a3a'); p.odisc(76, 60, 2.5, '#e8e8e8'); p.odisc(84, 60, 2.5, '#e8e8e8'); p.rect(62, 65, 16, 1, '#e10600');
      p.line(50, 56, 38, 50, '#111');
    } },
    pc_engine: { cap: 'The tiny white PC Engine next to a game on a HuCard, about the size of a credit card.', draw(p, S) {
      S.room(p);
      // console: small, white, almost square
      p.opoly([[14, 34], [48, 34], [56, 26], [22, 26]], '#f4f4f0'); p.rect(14, 34, 34, 22, '#000'); p.rect(15, 35, 32, 20, '#e8e8e4'); p.rect(15, 35, 32, 1, '#fff');
      p.rect(17, 38, 28, 7, '#202020'); p.rect(20, 40, 22, 2, '#000'); p.px(19, 48, '#e10600'); p.obox(32, 47, 12, 5, '#c8c8c4');
      p.opoly([[48, 34], [56, 26], [56, 48], [48, 56]], '#c8c8c4');
      // HuCard going in
      p.obox(58, 34, 32, 20, '#e8e4d8'); p.rect(60, 36, 28, 9, '#2a7ad8'); p.rect(60, 36, 28, 3, '#ffd400'); p.disc(74, 41, 3, '#fff'); for (let x = 61; x < 88; x += 2) p.rect(x, 50, 1, 3, '#c8a040');
      p.line(57, 44, 48, 41, '#2a7ad8');
      // controller
      p.obox(16, 58, 32, 12, '#d8d8d4'); dpad(p, 23, 64, '#333'); p.odisc(39, 64, 2, '#333'); p.odisc(44, 64, 2, '#333'); p.obox(28, 61, 5, 2, '#555'); p.obox(28, 65, 5, 2, '#555');
    } },
    mega_drive: { cap: 'The black Mega Glide with its raised round middle, and the three-button pad.', draw(p, S) {
      S.carpet(p);
      p.opoly([[6, 40], [70, 40], [80, 26], [18, 26]], '#141414'); p.rect(6, 40, 64, 8, '#0a0a0a'); p.opoly([[70, 40], [80, 26], [80, 34], [70, 48]], '#050505');
      for (let i = 0; i < 4; i++) p.line(10 + i * 3, 38 - i * 3, 22 + i * 3, 38 - i * 3, '#2a2a2a');
      p.oell(46, 33, 17, 7, '#222'); p.ell(46, 32, 14, 5, '#2e2e2e'); p.ell(42, 31, 6, 2, '#3a3a3a'); p.rect(37, 30, 18, 3, '#000');
      p.obox(62, 36, 6, 2, '#555'); p.rect(14, 43, 3, 2, '#e10600'); p.rect(20, 43, 10, 2, '#333');
      // three-button pad, rounded kidney shape
      p.oell(64, 60, 24, 9, '#1a1a1a'); p.ell(64, 59, 22, 7, '#262626'); dpad(p, 51, 60, '#3a3a3a');
      p.odisc(68, 62, 2.2, '#333'); p.odisc(74, 60, 2.2, '#333'); p.odisc(80, 58, 2.2, '#333'); p.rect(60, 57, 4, 2, '#555'); p.line(44, 56, 30, 48, '#111');
    } },
    atari_lynx: { cap: 'The big, wide Atari Lynx: the first handheld with a backlit colour screen.', draw(p, S) {
      p.vgrad(0, 72, '#ffd8e8', '#e8a0c0');
      p.opoly([[4, 20], [24, 14], [72, 14], [92, 20], [92, 54], [72, 60], [24, 60], [4, 54]], '#2a2a2a'); p.line(25, 15, 71, 15, '#4a4a4a');
      p.obox(28, 20, 40, 32, '#111'); p.rect(31, 23, 34, 26, '#204080');
      p.rect(31, 40, 34, 9, '#3a9a2a'); p.disc(56, 28, 4, '#ffd400'); p.rect(36, 34, 6, 6, '#e10600'); p.rect(38, 32, 2, 2, '#f2c79a'); p.rect(46, 37, 10, 3, '#a05a20');
      dpad(p, 15, 37, '#444'); p.odisc(79, 33, 3, '#555'); p.odisc(83, 41, 3, '#555'); p.obox(30, 54, 8, 3, '#444'); p.obox(58, 54, 8, 3, '#444');
      for (let i = 0; i < 4; i++) p.line(76 + i * 2, 50, 79 + i * 2, 46, '#444');
    } },
    game_gear: { cap: 'The pebble-shaped Game Gear: a colour screen that ate six AA batteries for breakfast.', draw(p, S) {
      p.vgrad(0, 72, '#d0f0ff', '#90d0f0');
      p.oell(18, 36, 15, 20, '#1a1a1a'); p.oell(78, 36, 15, 20, '#1a1a1a'); p.rect(18, 15, 60, 42, '#000'); p.rect(18, 16, 60, 40, '#1a1a1a'); p.ell(18, 36, 14, 19, '#1a1a1a'); p.ell(78, 36, 14, 19, '#1a1a1a');
      p.obox(30, 20, 36, 30, '#2a2a3a'); p.rect(33, 23, 30, 23, '#4a90ff'); p.rect(33, 40, 30, 6, '#2a8a2a'); p.rect(40, 30, 4, 10, '#7a4a1a'); p.disc(42, 29, 4, '#3ab02a'); p.disc(55, 27, 2, '#fff'); p.rect(50, 37, 6, 3, '#e10600');
      dpad(p, 15, 36, '#333'); p.odisc(76, 38, 3, '#3a3a5a'); p.odisc(84, 33, 3, '#3a3a5a'); p.obox(72, 24, 7, 3, '#2a40c0');
      for (let i = 0; i < 4; i++) p.rect(10 + i * 3, 48, 2, 1, '#444');
    } },
  });
  A.add({
    neo_geo: { cap: 'The Neo Geo: a giant cartridge and an arcade-sized joystick for your living room.', draw(p, S) {
      S.carpet(p);
      p.opoly([[4, 36], [56, 36], [64, 28], [12, 28]], '#1a1a1a'); p.rect(4, 36, 52, 10, '#0a0a0a'); p.rect(5, 39, 50, 1, '#c8a040'); p.opoly([[56, 36], [64, 28], [64, 38], [56, 46]], '#050505');
      // the enormous cartridge sticking out of the top
      p.opoly([[18, 31], [44, 31], [48, 27], [22, 27]], '#000'); p.obox(20, 6, 26, 24, '#2a2a2a'); p.rect(22, 9, 22, 14, '#c81010'); p.rect(22, 9, 22, 3, '#ffd400'); p.rect(25, 15, 16, 4, '#fff'); for (let y = 25; y < 29; y += 2) p.rect(22, y, 22, 1, '#3a3a3a');
      // arcade-style stick
      p.opoly([[40, 54], [92, 54], [94, 68], [38, 68]], '#1a1a1a'); p.rect(40, 55, 52, 1, '#3a3a3a'); p.rect(40, 62, 54, 1, '#c8a040');
      p.obox(50, 40, 3, 16, '#888'); p.odisc(51, 39, 5, '#e10600'); p.px(49, 37, '#ff8080').px(50, 37, '#ff8080');
      [['#e10600', 64], ['#ffd400', 71], ['#2a9a2a', 78], ['#2a6ad8', 85]].forEach(([c, x]) => { p.odisc(x, 58, 2.5, c); p.px(x - 1, 57, '#fff'); });
    } },
    snes: { cap: 'A Super Ultra (the European and Japanese shape) and its pad with four coloured buttons.', draw(p, S) {
      S.carpet(p);
      // console: pale grey, rounded corners, darker cartridge slot area and two sliders
      p.opoly([[8, 40], [66, 40], [74, 30], [72, 24], [14, 24], [8, 30]], '#cfcfcb'); p.rect(8, 40, 58, 8, '#000'); p.rect(9, 41, 56, 6, '#b8b8b4'); p.rect(9, 41, 56, 1, '#dcdcd8');
      p.opoly([[66, 40], [74, 30], [74, 38], [66, 48]], '#9a9a96');
      p.opoly([[26, 34], [54, 34], [58, 28], [30, 28]], '#8a8a86'); p.opoly([[30, 32], [52, 32], [54, 30], [32, 30]], '#000');
      p.obox(14, 32, 8, 4, '#7a7a76'); p.obox(58, 34, 6, 3, '#7a7a76'); p.px(19, 38, '#e10600');
      p.obox(14, 43, 6, 3, '#8a8a86'); p.obox(24, 43, 6, 3, '#8a8a86');
      // dog-bone controller
      p.oell(54, 59, 9, 8, '#c8c8c4'); p.oell(80, 59, 9, 8, '#c8c8c4'); p.rect(54, 52, 26, 15, '#000'); p.rect(54, 53, 26, 13, '#c8c8c4'); p.ell(54, 59, 8, 7, '#c8c8c4'); p.ell(80, 59, 8, 7, '#c8c8c4');
      dpad(p, 54, 59, '#333'); p.obox(63, 60, 4, 2, '#555'); p.obox(68, 60, 4, 2, '#555');
      p.odisc(80, 54, 2, '#2a5ad8'); p.odisc(76, 59, 2, '#2aa02a'); p.odisc(84, 59, 2, '#e10600'); p.odisc(80, 64, 2, '#ffd400');
      p.rect(48, 51, 8, 2, '#9a9a96'); p.rect(78, 51, 8, 2, '#9a9a96'); p.line(66, 52, 58, 46, '#222');
    } },
    atari_jaguar: { cap: 'The curvy black Jaguar and its chunky controller with a telephone-style keypad.', draw(p, S) {
      S.carpet(p);
      p.oell(36, 34, 30, 10, '#1a1a1a'); p.ell(36, 33, 28, 8, '#242424'); p.ell(30, 31, 10, 3, '#3a3a3a'); p.rect(6, 34, 60, 10, '#1a1a1a'); p.oell(36, 44, 30, 6, '#101010'); p.rect(7, 34, 58, 8, '#1a1a1a');
      p.obox(28, 26, 18, 8, '#2a2a2a'); p.rect(30, 28, 14, 2, '#000'); p.px(14, 38, '#e10600');
      // controller: big, with a keypad
      p.oell(68, 56, 22, 12, '#1a1a1a'); p.ell(68, 55, 20, 10, '#262626'); dpad(p, 54, 54, '#3a3a3a');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) p.obox(63 + c * 4, 50 + r * 3, 3, 2, '#c8c8c8');
      p.odisc(80, 52, 2, '#c8c8c8'); p.odisc(84, 56, 2, '#c8c8c8'); p.odisc(80, 60, 2, '#c8c8c8'); p.line(66, 44, 50, 42, '#111');
    } },
    three_do: { cap: 'A 3DO with its CD tray open. Fancy, powerful, and $699.', draw(p, S) {
      S.carpet(p);
      p.opoly([[6, 30], [74, 30], [84, 20], [16, 20]], '#1a1a1a'); for (let i = 0; i < 3; i++) p.line(20 + i * 3, 22 + i * 3, 78, 22 + i * 3, '#2a2a2a');
      p.rect(6, 30, 68, 16, '#000'); p.rect(7, 31, 66, 14, '#202020'); p.rect(7, 31, 66, 1, '#3a3a3a'); p.opoly([[74, 30], [84, 20], [84, 36], [74, 46]], '#101010');
      // tray sliding out with a disc
      p.opoly([[20, 40], [56, 40], [60, 54], [16, 54]], '#2a2a2a'); p.line(16, 54, 60, 54, '#000');
      p.oell(38, 47, 16, 5, '#c8d0e0'); p.ell(38, 47, 14, 4, '#e0e8f8'); p.ell(34, 46, 5, 1, '#ffb0e0'); p.ell(43, 48, 4, 1, '#a0e0ff'); p.oell(38, 47, 3, 1, '#2a2a2a');
      p.obox(62, 36, 8, 3, '#555'); p.px(12, 36, '#30ff30');
      p.obox(66, 56, 26, 12, '#1a1a1a'); dpad(p, 72, 62, '#3a3a3a'); p.odisc(82, 60, 1.6, '#888'); p.odisc(86, 63, 1.6, '#888'); p.odisc(82, 65, 1.6, '#888');
    } },
    playstation: { cap: 'The grey PlaySpace with its round CD lid, and the pad with its four symbol buttons.', draw(p, S) {
      S.carpet(p);
      p.opoly([[6, 38], [62, 38], [72, 26], [16, 26]], '#c8c8c4'); p.rect(6, 38, 56, 8, '#000'); p.rect(7, 39, 54, 6, '#b0b0ac'); p.rect(7, 39, 54, 1, '#d8d8d4'); p.opoly([[62, 38], [72, 26], [72, 34], [62, 46]], '#8a8a86');
      p.oell(28, 31, 13, 4.5, '#a8a8a4'); p.ell(28, 30, 11, 3, '#bcbcb8'); p.ell(24, 29, 4, 1, '#dcdcd8');
      p.oell(52, 30, 3, 1.5, '#9a9a96'); p.oell(56, 33, 3, 1.5, '#9a9a96'); p.obox(46, 34, 6, 2, '#9a9a96'); p.px(14, 42, '#30ff30');
      // controller with two handles
      p.opoly([[44, 52], [86, 52], [92, 68], [84, 70], [78, 62], [52, 62], [46, 70], [38, 68]], '#c0c0bc');
      dpad(p, 52, 57, '#444');
      const bx = 78, by = 57; p.line(bx, by - 4, bx - 2, by - 2, '#2aa02a').line(bx, by - 4, bx + 2, by - 2, '#2aa02a').line(bx - 2, by - 2, bx + 2, by - 2, '#2aa02a');
      p.ring(bx + 5, by, 1.5, '#e10600'); p.line(bx - 1, by + 3, bx + 1, by + 5, '#2a5ad8').line(bx + 1, by + 3, bx - 1, by + 5, '#2a5ad8'); p.rect(bx - 7, by - 1, 3, 3, '#ff6ab0'); p.rect(bx - 6, by, 1, 1, '#c0c0bc');
      p.obox(62, 56, 4, 2, '#555'); p.obox(67, 56, 4, 2, '#555'); p.line(64, 52, 56, 46, '#222');
    } },
    sega_saturn: { cap: 'A black Segue Orbiter with a round lid in the middle, and its six-button pad.', draw(p, S) {
      S.carpet(p);
      p.opoly([[6, 38], [66, 38], [76, 24], [16, 24]], '#1c1c1c'); p.rect(6, 38, 60, 10, '#000'); p.rect(7, 39, 58, 8, '#262626'); p.rect(7, 39, 58, 1, '#3a3a3a'); p.opoly([[66, 38], [76, 24], [76, 34], [66, 48]], '#0e0e0e');
      p.oell(40, 31, 15, 5, '#2a2a2a'); p.ell(40, 30, 13, 3.5, '#333'); p.ell(36, 29, 5, 1, '#4a4a4a');
      p.obox(16, 28, 6, 3, '#3a3a3a'); p.obox(60, 28, 6, 3, '#3a3a3a'); p.rect(12, 42, 14, 2, '#555');
      p.oell(64, 60, 24, 9, '#1a1a1a'); p.ell(64, 59, 22, 7, '#2a2a2a'); dpad(p, 50, 60, '#444');
      [[68, 57], [73, 56], [78, 55], [69, 62], [74, 61], [79, 60]].forEach(([x, y], i) => p.odisc(x, y, 1.8, i < 3 ? '#4a4a4a' : '#5a5a5a')); p.line(56, 52, 40, 48, '#111');
    } },
    virtual_boy: { cap: 'The Virtual Boy: red-and-black 3-D goggles on a stand. Press your face in. Get a headache.', draw(p, S) {
      S.room(p);
      // stand
      p.thick(36, 44, 30, 62, '#1a1a1a', 3); p.thick(60, 44, 66, 62, '#1a1a1a', 3); p.obox(26, 61, 12, 3, '#2a2a2a'); p.obox(58, 61, 12, 3, '#2a2a2a');
      // the visor unit
      p.opoly([[14, 18], [82, 18], [86, 30], [80, 46], [16, 46], [10, 30]], '#c81010'); p.rect(16, 19, 64, 2, '#f04040');
      p.opoly([[16, 30], [80, 30], [78, 44], [18, 44]], '#1a1a1a'); p.oell(32, 31, 10, 6, '#000'); p.oell(64, 31, 10, 6, '#000'); p.ell(32, 31, 7, 4, '#300'); p.ell(64, 31, 7, 4, '#300'); p.ell(30, 30, 3, 1.5, '#e02020'); p.ell(62, 30, 3, 1.5, '#e02020');
      p.opoly([[38, 20], [58, 20], [56, 26], [40, 26]], '#a00808');
      // the two-D-pad controller
      p.opoly([[30, 64], [66, 64], [70, 71], [26, 71]], '#1a1a1a'); dpad(p, 36, 67, '#3a3a3a'); dpad(p, 60, 67, '#3a3a3a');
    } },
    n64: { cap: 'A Ultra 64 and its three-handled controller with the analogue stick in the middle.', draw(p, S) {
      S.carpet(p);
      p.opoly([[14, 30], [64, 30], [70, 22], [20, 22]], '#3a3a3e'); p.rect(14, 30, 50, 8, '#000'); p.rect(15, 31, 48, 6, '#2a2a2e'); p.opoly([[64, 30], [70, 22], [70, 28], [64, 36]], '#1a1a1e');
      p.opoly([[30, 27], [50, 27], [53, 23], [33, 23]], '#1a1a1e'); p.obox(24, 24, 4, 3, '#555'); p.obox(54, 24, 4, 3, '#555'); for (let i = 0; i < 4; i++) p.obox(20 + i * 11, 33, 6, 3, '#111');
      // controller: three handles
      const cx = 48, cy = 50;
      p.opoly([[cx - 30, cy], [cx + 30, cy], [cx + 34, cy + 4], [cx + 30, cy + 18], [cx + 24, cy + 20], [cx + 18, cy + 8], [cx + 6, cy + 8], [cx + 4, cy + 21], [cx - 4, cy + 21], [cx - 6, cy + 8], [cx - 18, cy + 8], [cx - 24, cy + 20], [cx - 30, cy + 18], [cx - 34, cy + 4]], '#7a7a7e');
      p.rect(cx - 29, cy + 1, 58, 1, '#9a9a9e'); dpad(p, cx - 22, cy + 5, '#3a3a3e');
      p.odisc(cx, cy + 9, 3, '#5a5a5e'); p.disc(cx, cy + 9, 1.5, '#9a9a9e');
      p.odisc(cx + 18, cy + 7, 2.4, '#2a40d8'); p.odisc(cx + 14, cy + 3, 2.4, '#2aa02a');
      [[cx + 25, cy + 1], [cx + 22, cy + 4], [cx + 28, cy + 4], [cx + 25, cy + 7]].forEach(([x, y]) => p.odisc(x, y, 1.6, '#ffd400'));
      p.odisc(cx, cy + 3, 1.6, '#e10600'); p.line(cx, cy, cx - 2, 37, '#222');
    } },
    game_boy_color: { cap: 'A see-through purple Game Lad Color: 56 colours on screen at once!', draw(p, S) {
      p.vgrad(0, 72, '#e0f8d0', '#a8e090');
      p.opoly([[32, 4], [64, 4], [66, 8], [66, 64], [60, 69], [36, 69], [30, 64], [30, 8]], 'rgba(120,60,200,.92)'); p.rect(33, 5, 30, 1, '#b090ff');
      p.rect(36, 6, 6, 2, '#300040');
      p.obox(33, 11, 30, 26, '#1a1028'); p.rect(37, 14, 22, 19, '#5aa0ff'); p.rect(37, 27, 22, 6, '#3ab02a'); p.disc(53, 18, 3, '#ffd400'); p.rect(41, 23, 5, 4, '#e10600'); p.rect(42, 21, 3, 2, '#ffb0b0'); p.rect(49, 28, 2, 2, '#ff8ac0'); p.rect(52, 28, 2, 2, '#fff');
      p.px(35, 20, '#30ff30');
      dpad(p, 39, 46, '#222'); p.odisc(55, 47, 3, '#2a1a40'); p.odisc(61, 44, 3, '#2a1a40'); p.obox(40, 56, 6, 2, '#3a2a5a'); p.obox(50, 56, 6, 2, '#3a2a5a');
      for (let i = 0; i < 3; i++) p.line(52 + i * 3, 66, 56 + i * 3, 61, '#4a2a8a');
    } },
    dreamcast: { cap: 'The white Daydream (with a modem built in!) and its pad with a VMU plugged into the top.', draw(p, S) {
      S.carpet(p);
      p.opoly([[8, 36], [52, 36], [60, 24], [16, 24]], '#f0f0ee'); p.rect(8, 36, 44, 10, '#000'); p.rect(9, 37, 42, 8, '#dcdcda'); p.rect(9, 37, 42, 1, '#fff'); p.opoly([[52, 36], [60, 24], [60, 34], [52, 46]], '#b8b8b6');
      p.oell(34, 30, 12, 4, '#d8d8d6'); p.ell(34, 29, 10, 3, '#e8e8e6'); p.obox(14, 27, 6, 3, '#c8c8c6'); p.obox(20, 39, 5, 3, '#c8c8c6'); for (let i = 0; i < 4; i++) p.obox(12 + i * 8, 42, 5, 2, '#9a9a98');
      // pad + VMU
      p.opoly([[54, 44], [90, 44], [94, 66], [86, 70], [80, 60], [64, 60], [58, 70], [50, 66]], '#f0f0ee'); p.rect(55, 45, 34, 1, '#fff');
      p.obox(64, 34, 16, 18, '#e8e8e6'); p.obox(67, 37, 10, 8, '#7a8a6a'); p.rect(69, 39, 3, 3, '#203018'); p.rect(73, 41, 2, 2, '#203018'); dpad(p, 69, 49, '#555'); p.odisc(76, 49, 1.3, '#555');
      p.odisc(58, 56, 3, '#9a9a98'); p.disc(58, 56, 1.4, '#c8c8c6'); dpad(p, 60, 63, '#444');
      p.odisc(84, 52, 1.8, '#e10600'); p.odisc(88, 55, 1.8, '#2a5ad8'); p.odisc(80, 55, 1.8, '#ffd400'); p.odisc(84, 58, 1.8, '#2aa02a');
    } },
    wonderswan: { cap: 'The little WonderSwan, which runs for ages on just one AA battery (shown for size).', draw(p, S) {
      p.vgrad(0, 72, '#fff0f8', '#f0c8e0');
      p.opoly([[8, 20], [86, 20], [90, 26], [90, 50], [86, 56], [8, 56], [4, 50], [4, 26]], '#e8e8f0'); p.rect(9, 21, 76, 1, '#fff');
      p.obox(28, 25, 38, 26, '#5a5a6a'); p.rect(31, 28, 32, 20, '#b8c0a8'); p.rect(35, 40, 24, 2, '#404838'); p.rect(40, 33, 4, 7, '#404838'); p.rect(50, 36, 6, 4, '#404838');
      [[14, 32], [10, 38], [18, 38], [14, 44]].forEach(([x, y]) => p.obox(x - 2, y - 2, 5, 5, '#b8b8c8')); [[78, 34], [84, 40]].forEach(([x, y]) => p.odisc(x, y, 3, '#b8b8c8'));
      p.obox(70, 48, 8, 3, '#b8b8c8');
      // a single AA battery
      p.obox(30, 60, 30, 9, '#2a2a2a'); p.rect(31, 61, 18, 7, '#e8c040'); p.rect(31, 61, 18, 2, '#ffe880'); p.obox(60, 62, 3, 5, '#c8c8c8'); p.text(35, 62, 'AA', '#000');
    } },
    cartridge: { cap: 'Inside a cartridge: a circuit board with ROM chips and shiny gold contacts.', draw(p, S) {
      S.room(p);
      // closed cartridge on the left
      p.obox(6, 8, 36, 44, '#7a7a7a'); for (let y = 11; y < 21; y += 2) p.rect(8, y, 32, 1, '#5a5a5a'); p.obox(9, 22, 30, 20, '#ffd400'); p.rect(11, 24, 26, 16, '#2a5ad8'); p.disc(24, 31, 5, '#ffd400'); p.rect(19, 30, 10, 2, '#e10600');
      p.rect(9, 46, 30, 6, '#5a5a5a');
      // opened case and the board inside
      p.obox(48, 8, 42, 54, '#6a6a6a'); p.rect(50, 10, 38, 50, '#4a4a4a');
      p.obox(52, 14, 34, 40, '#1a6a2a'); p.rect(53, 15, 32, 1, '#3a9a4a');
      p.obox(56, 18, 12, 9, '#111'); p.obox(71, 18, 12, 9, '#111'); p.obox(58, 31, 10, 7, '#111'); p.text(57, 21, 'ROM', '#888'); p.obox(73, 31, 6, 6, '#c8c8c8'); p.odisc(80, 42, 3, '#c8c8c8');
      for (let x = 54; x < 85; x += 2) p.rect(x, 48, 1, 6, '#e8c040');
      for (let i = 0; i < 5; i++) p.line(60 + i * 4, 27, 60 + i * 4, 31, '#c8a040');
    } },
    memory_card: { cap: 'Three ways to save: a PlaySpace card, an ULTRA 64 Controller Pak and a Daydream VMU with its own screen.', draw(p, S) {
      S.room(p);
      // PlayStation-style card
      p.obox(6, 22, 24, 30, '#a8a8a8'); p.rect(8, 24, 20, 12, '#d8d8d8'); p.text(10, 28, '128K', '#203060'); p.rect(8, 40, 20, 1, '#888'); for (let x = 9; x < 28; x += 3) p.rect(x, 48, 2, 3, '#555');
      // N64 controller pak
      p.obox(36, 26, 24, 26, '#3a3a3e'); p.rect(38, 28, 20, 10, '#5a5a5e'); p.rect(40, 30, 16, 2, '#888'); p.rect(38, 46, 20, 4, '#1a1a1e');
      // Dreamcast VMU with screen
      p.obox(66, 16, 24, 38, '#f0f0ee'); p.obox(69, 20, 18, 14, '#6a7a5a'); p.rect(71, 22, 14, 10, '#9aaa80'); p.rect(73, 25, 4, 4, '#203018'); p.rect(79, 27, 3, 2, '#203018'); p.text(72, 22, '3', '#203018');
      dpad(p, 72, 41, '#555'); p.odisc(82, 39, 1.6, '#888'); p.odisc(85, 43, 1.6, '#888'); p.obox(70, 47, 6, 2, '#bbb'); p.obox(79, 47, 6, 2, '#bbb');
    } },
  });
  function crtFrame(p, c) { // an arcade/monitor bezel around the whole picture
    p.rect(0, 0, 96, 72, c || '#2a2a2a'); p.rect(4, 3, 88, 66, '#000');
  }
  A.add({
    pong: { cap: 'Two bats, one square ball and a dotted net. That really was the whole game.', draw(p, S) {
      crtFrame(p, '#6a4a2a'); p.rect(5, 4, 86, 64, '#050505');
      for (let y = 6; y < 66; y += 6) p.rect(47, y, 2, 3, '#e8e8e8');
      p.rect(10, 22, 3, 14, '#fff'); p.rect(83, 36, 3, 14, '#fff'); p.rect(60, 28, 3, 3, '#fff');
      p.text(32, 8, '4', '#fff', 3); p.text(56, 8, '2', '#fff', 3); p.rect(5, 4, 86, 1, '#e8e8e8'); p.rect(5, 67, 86, 1, '#e8e8e8');
      for (let y = 4; y < 68; y += 2) p.rect(5, y, 86, 1, 'rgba(0,0,0,.25)');
    } },
    space_invaders: { cap: 'Rows of marching aliens, four shields, and one very lonely laser cannon.', draw(p, S) {
      p.fill('#000'); p.stars(25, 4, ['#333', '#555']);
      const A1 = ['...xx...', '.xxxxxx.', 'xxx..xxx', 'xxx..xxx', '.xxxxxx.', 'x.x..x.x'], A2 = ['..xxxx..', '.x.xx.x.', 'xxxxxxxx', '.xxxxxx.', 'x.x..x.x', 'x.x..x.x'], A3 = ['..xxxx..', 'xxxxxxxx', 'x.x.x.x.', 'xxxxxxxx', '.x.xx.x.', 'x......x']; // our own alien designs, not the arcade's
      [A2, A1, A1, A3, A3].forEach((sp, r) => { for (let i = 0; i < 7; i++) p.spr(10 + i * 11, 6 + r * 7, sp, { x: r === 0 ? '#ff80ff' : r < 3 ? '#80ffff' : '#fff' }); });
      for (let i = 0; i < 4; i++) { const x = 10 + i * 22; p.spr(x, 50, ['..xxxx..', '.xxxxxx.', 'xxxxxxxx', 'xxxxxxxx', 'xx....xx'], { x: '#30ff30' }, 1.5); }
      p.rect(46, 62, 9, 3, '#30ff30'); p.rect(49, 60, 3, 2, '#30ff30'); p.rect(50, 44, 1, 6, '#fff'); p.rect(0, 68, 96, 1, '#30ff30');
      p.text(4, 0, 'SCORE 0420', '#fff');
    } },
    asteroids: { cap: 'A triangle ship blasting drifting rocks, all drawn in glowing lines.', draw(p, S) {
      p.fill('#000');
      const rock = (cx, cy, r, seed) => { const R = A.rng(seed), pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, rr = r * (0.7 + R() * 0.35); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } pts.forEach((q, i) => { const n = pts[(i + 1) % pts.length]; p.line(q[0], q[1], n[0], n[1], '#e8e8ff'); }); };
      rock(20, 18, 12, 3); rock(74, 16, 9, 5); rock(70, 52, 13, 7); rock(22, 54, 6, 9); rock(84, 34, 4, 11); rock(38, 40, 4, 13);
      const g = '#fff'; p.line(48, 30, 42, 44, g).line(48, 30, 54, 44, g).line(43, 41, 53, 41, g).line(42, 44, 45, 41, g).line(54, 44, 51, 41, g);
      p.px(48, 24, '#fff').px(49, 18, '#fff').px(50, 12, '#fff');
      p.line(10, 66, 16, 63, g).line(16, 63, 22, 66, g).line(10, 66, 22, 66, g).line(13, 64, 19, 64, g);
      for (let y = 0; y < 72; y += 2) p.rect(0, y, 96, 1, 'rgba(0,0,40,.2)');
    } },
    pac_man: { cap: 'A hungry yellow circle in a maze full of dots. Big flashing dots are the best ones.', draw(p, S) {
      p.fill('#000');
      const M = ['########################', '#..........##..........#', '#o####.###.##.###.####o#', '#.####.###.##.###.####.#', '#......................#', '#.####.#.######.#.####.#', '#......#...##...#......#', '######.###.##.###.######', '#..........  ..........#', '#.####.##########.####.#', '#o.....................#', '########################'];
      M.forEach((r, j) => [...r].forEach((ch, i) => { const x = i * 4, y = j * 6; if (ch === '#') { p.rect(x, y, 4, 6, '#1a2ae0'); p.rect(x + 1, y + 1, 2, 4, '#000'); } else if (ch === '.') p.rect(x + 1, y + 2, 2, 2, '#ffb8a0'); else if (ch === 'o') p.disc(x + 2, y + 3, 2, '#ffb8a0'); }));
      p.rect(44, 46, 12, 6, '#000'); p.rect(56, 46, 4, 6, '#000');
      p.disc(50, 51, 5, '#ffd400'); p.poly([[50, 51], [57, 47], [57, 55]], '#000'); p.px(50, 48, '#000');
    } },
    donkey_kong: { cap: 'Sloping red girders, ladders and barrels rolling down: the first great jumping game.', draw(p, S) {
      p.fill('#000');
      const girder = (y0, y1) => { for (let x = 4; x < 92; x++) { const y = Math.round(y0 + (y1 - y0) * (x - 4) / 88); p.rect(x, y, 1, 4, '#e8204a'); if (x % 4 === 0) p.px(x, y + 1, '#000').px(x, y + 2, '#000'); } };
      girder(18, 14); girder(30, 34); girder(50, 46); girder(66, 66);
      [[70, 18, 13], [24, 37, 10], [60, 52, 12]].forEach(([x, y, h]) => { p.rect(x, y, 1, h, '#20e0e0'); p.rect(x + 5, y, 1, h, '#20e0e0'); for (let k = y + 2; k < y + h; k += 3) p.rect(x, k, 6, 1, '#20e0e0'); });
      // the big ape (generic) and barrels
      p.oell(14, 8, 7, 6, '#8a4a1a'); p.disc(14, 4, 4, '#8a4a1a'); p.ell(14, 6, 2, 1.5, '#f2c79a'); p.rect(6, 10, 3, 4, '#8a4a1a'); p.rect(19, 10, 3, 4, '#8a4a1a');
      [[34, 25], [50, 40], [26, 59], [78, 60]].forEach(([x, y]) => { p.odisc(x, y, 3, '#c87a2a'); p.line(x - 3, y, x + 3, y, '#7a3a08'); });
      p.rect(28, 6, 3, 3, '#ffd400').rect(27, 9, 5, 4, '#ff8ac0');
      // hero mid-jump (small and generic)
      p.rect(40, 54, 4, 3, '#e10600'); p.rect(40, 57, 4, 3, '#2a5ad8'); p.px(39, 60, '#7a3a08').px(44, 60, '#7a3a08'); p.rect(41, 52, 2, 2, '#f2c79a');
    } },
    elite: { cap: 'Wireframe spaceships and a spinning space station, with the radar scanner below.', draw(p, S) {
      p.fill('#000'); p.stars(30, 7, ['#888', '#fff']);
      const w = '#fff';
      // space station: a wireframe box shape with a docking slot
      const st = [[58, 8], [80, 12], [84, 28], [66, 32], [56, 26], [62, 18], [74, 20]]; p.line(58, 8, 80, 12, w).line(80, 12, 84, 28, w).line(84, 28, 66, 32, w).line(66, 32, 56, 26, w).line(56, 26, 58, 8, w).line(58, 8, 62, 18, w).line(80, 12, 74, 20, w).line(84, 28, 74, 20, w).line(66, 32, 62, 18, w).line(62, 18, 74, 20, w).line(56, 26, 62, 18, w); p.rect(65, 18, 6, 2, '#fff'); void st;
      // wedge ship
      p.line(12, 28, 40, 22, w).line(40, 22, 44, 30, w).line(44, 30, 14, 36, w).line(14, 36, 12, 28, w).line(12, 28, 28, 18, w).line(28, 18, 40, 22, w).line(28, 18, 30, 30, w).line(30, 30, 44, 30, w).line(30, 30, 14, 36, w);
      // dashboard and scanner
      p.rect(0, 46, 96, 26, '#101830'); p.rect(0, 46, 96, 1, '#ffd400');
      p.oell(48, 59, 22, 8, '#002000', '#ffd400'); p.ell(48, 59, 22, 8, '#001a00'); p.line(26, 59, 70, 59, '#008000'); p.line(48, 51, 48, 67, '#008000');
      p.rect(40, 55, 1, 4, '#ffd400').rect(39, 54, 3, 1, '#ffd400'); p.rect(58, 60, 1, -4, '#e10600'); p.rect(57, 56, 3, 1, '#e10600');
      for (let i = 0; i < 5; i++) { p.rect(4, 50 + i * 4, 14, 2, '#203050'); p.rect(4, 50 + i * 4, 4 + i * 2, 2, '#30ff30'); p.rect(78, 50 + i * 4, 14, 2, '#203050'); p.rect(78, 50 + i * 4, 12 - i * 2, 2, '#ffd400'); }
      p.line(46, 24, 50, 24, w).line(48, 22, 48, 26, w);
    } },
    super_mario_bros: { cap: 'Brick blocks, a green pipe and a power-up mushroom in a side-scrolling world.', draw(p, S) {
      p.vgrad(0, 58, '#5c94fc', '#8cb4ff');
      const cl = (x, y) => p.ell(x, y, 7, 3, '#fff').ell(x - 4, y - 1, 4, 3, '#fff').ell(x + 4, y - 2, 4, 3, '#fff');
      cl(18, 10); cl(72, 14);
      p.oell(78, 58, 16, 10, '#3a9a2a'); p.ell(76, 52, 2, 3, '#2a7a1a');
      for (let x = 0; x < 96; x += 8) { p.rect(x, 58, 8, 14, '#c86418'); p.rect(x, 58, 8, 1, '#ffb070'); p.rect(x, 64, 8, 1, '#7a3a08'); p.rect(x + (x % 16 ? 0 : 4), 58, 1, 6, '#7a3a08'); p.rect(x + 4 - (x % 16 ? 0 : 4), 64, 1, 8, '#7a3a08'); }
      for (let i = 0; i < 4; i++) { const x = 18 + i * 8; p.rect(x, 30, 8, 8, i === 2 ? '#e8a020' : '#c86418'); p.rect(x, 30, 8, 1, i === 2 ? '#ffe080' : '#ffb070'); p.rect(x, 37, 8, 1, '#000'); p.rect(x + 7, 30, 1, 8, '#000'); if (i !== 2) { p.rect(x, 33, 8, 1, '#7a3a08'); p.rect(x + 3, 30, 1, 3, '#7a3a08'); } else { p.px(x + 2, 32, '#7a3a08').px(x + 5, 32, '#7a3a08').px(x + 2, 35, '#7a3a08').px(x + 5, 35, '#7a3a08'); } }
      // green pipe
      p.obox(62, 40, 18, 6, '#2ab82a'); p.obox(64, 45, 14, 13, '#2ab82a'); p.rect(66, 46, 2, 12, '#80f080'); p.rect(64, 41, 2, 4, '#80f080');
      // power-up mushroom (a generic red toadstool)
      p.oell(36, 22, 6, 4, '#e10600'); p.rect(30, 22, 13, 2, '#e10600'); p.disc(33, 20, 1.5, '#fff'); p.disc(39, 20, 1.5, '#fff'); p.obox(33, 23, 7, 6, '#f8e8c8');
      p.odisc(48, 50, 2.5, '#ffd400'); p.rect(48, 48, 1, 5, '#b08a00');
    } },
    zelda: { cap: 'A top-down world of trees and rocks, with a secret cave and a sword waiting to be found.', draw(p, S) {
      p.fill('#f8d8a0'); p.dither(0, 0, 96, 72, '#f0c888');
      for (let x = 0; x < 96; x += 12) { [[x, 0], [x, 60]].forEach(([tx, ty]) => { p.oell(tx + 6, ty + 5, 5, 5, '#2a8a2a'); p.ell(tx + 4, ty + 3, 2, 2, '#5ac85a'); p.rect(tx + 5, ty + 9, 2, 3, '#7a4a1a'); }); }
      for (let y = 12; y < 60; y += 12) { p.oell(6, y + 5, 5, 5, '#2a8a2a'); p.oell(90, y + 5, 5, 5, '#2a8a2a'); }
      // rocky hill with a cave
      p.opoly([[30, 10], [70, 10], [76, 36], [24, 36]], '#a05a2a'); for (let i = 0; i < 6; i++) p.line(32 + i * 7, 14, 30 + i * 7, 34, '#7a3a10'); p.rect(44, 24, 12, 12, '#000'); p.ell(50, 24, 6, 4, '#000');
      // sword and a bush, plus the hero's shield (generic)
      p.rect(49, 44, 2, 12, '#e8e8f0'); p.rect(50, 44, 1, 12, '#fff'); p.rect(46, 55, 8, 2, '#c8a040'); p.rect(49, 57, 2, 4, '#7a4a1a'); p.px(50, 43, '#fff');
      p.oell(26, 50, 5, 4, '#3aa83a'); p.oell(74, 48, 5, 4, '#3aa83a'); p.odisc(80, 30, 2, '#e10600');
    } },
    sim_city: { cap: 'A city from above: houses (green), shops (blue), factories (yellow) and a smoky power station.', draw(p, S) {
      p.fill('#4a8a2a'); p.dither(0, 0, 96, 72, '#3a7a20');
      const road = (x, y, w, h) => { p.rect(x, y, w, h, '#555'); if (w > h) for (let i = x; i < x + w; i += 6) p.rect(i, y + (h >> 1), 3, 1, '#ffd400'); else for (let i = y; i < y + h; i += 6) p.rect(x + (w >> 1), i, 1, 3, '#ffd400'); };
      road(0, 30, 96, 6); road(44, 0, 6, 72);
      const zone = (x, y, c, k) => { p.rect(x, y, 18, 12, '#000'); p.rect(x + 1, y + 1, 16, 10, c); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const bx = x + 2 + i * 5, by = y + 2 + j * 5; p.rect(bx, by, 4, 3, k); p.rect(bx, by, 4, 1, p.shade(k, 0.4)); } };
      zone(4, 4, '#2a8a2a', '#e8e0c8'); zone(24, 4, '#2a8a2a', '#c84a2a'); zone(4, 16, '#2a8a2a', '#e8e0c8'); zone(54, 4, '#2a5ad8', '#c8d8ff'); zone(74, 4, '#2a5ad8', '#9fd0ff'); zone(54, 16, '#2a5ad8', '#c8d8ff');
      zone(4, 40, '#d8b020', '#a0a0a0'); zone(24, 40, '#d8b020', '#8a8a8a');
      // power station with chimneys and smoke
      p.obox(56, 42, 22, 16, '#8a8a8a'); p.obox(60, 32, 4, 12, '#6a6a6a'); p.obox(68, 34, 4, 10, '#6a6a6a'); p.ell(63, 28, 4, 2, '#ddd').ell(66, 24, 4, 2, '#eee').ell(71, 30, 3, 2, '#ddd'); p.rect(58, 46, 18, 2, '#ffd400');
      p.oell(86, 62, 6, 4, '#3a9a2a'); p.oell(20, 64, 8, 5, '#2a6ad8'); p.rect(30, 58, 2, 2, '#fff');
    } },
    prince_of_persia: { cap: 'A torch-lit dungeon with spikes and a closing gate. Sixty minutes on the clock!', draw(p, S) {
      p.fill('#1a1a3a');
      for (let y = 0; y < 72; y += 6) for (let x = (y / 6 % 2) * 6; x < 96; x += 12) p.rect(x, y, 11, 5, '#2a2a5a');
      p.rect(0, 50, 96, 4, '#6a6aa0'); p.rect(0, 50, 96, 1, '#9a9ad0'); p.rect(0, 24, 40, 4, '#6a6aa0'); p.rect(0, 24, 40, 1, '#9a9ad0');
      // gate
      p.rect(70, 14, 2, 36, '#555'); p.rect(86, 14, 2, 36, '#555'); for (let x = 72; x < 86; x += 3) p.rect(x, 14, 1, 26, '#888'); p.rect(72, 22, 14, 1, '#888'); p.rect(72, 32, 14, 1, '#888');
      // spikes
      for (let x = 44; x < 62; x += 3) p.poly([[x, 50], [x + 1.5, 44], [x + 3, 50]], '#c8c8d8');
      // torch
      p.rect(20, 34, 2, 6, '#7a4a1a'); p.poly([[18, 34], [24, 34], [21, 27]], '#ff8000'); p.px(21, 31, '#ffd400');
      // the hero mid-leap (white clothes, silhouette)
      p.rect(46, 30, 3, 3, '#f2c79a'); p.rect(44, 33, 6, 6, '#f0f0f0'); p.line(50, 34, 55, 30, '#f0f0f0'); p.line(44, 34, 40, 38, '#f0f0f0'); p.line(45, 39, 40, 44, '#e0e0ff'); p.line(49, 39, 55, 42, '#e0e0ff');
      // hourglass
      p.obox(4, 56, 10, 14, '#c8a040'); p.poly([[6, 58], [12, 58], [9, 63]], '#ffe080'); p.poly([[9, 63], [6, 68], [12, 68]], '#ffe080'); p.rect(8, 61, 3, 2, '#c8a040');
    } },
    lemmings: { cap: 'Little green-haired walkers heading for the edge, with a digger, a blocker and a floater.', draw(p, S) {
      p.vgrad(0, 72, '#000020', '#102050');
      p.rect(0, 40, 60, 32, '#a05a2a'); p.dither(0, 40, 60, 32, '#7a3a10'); p.rect(0, 40, 60, 2, '#3ab83a');
      p.rect(72, 54, 24, 18, '#a05a2a'); p.rect(72, 54, 24, 2, '#3ab83a');
      // entrance hatch and exit door
      p.obox(6, 6, 16, 6, '#8a8a8a'); p.rect(9, 12, 10, 1, '#555');
      p.opoly([[80, 54], [80, 44], [84, 40], [88, 44], [88, 54]], '#7a4a1a'); p.rect(82, 46, 4, 8, '#000'); p.px(83, 39, '#ff8000').px(85, 39, '#ff8000');
      const lem = (x, y, f) => { p.rect(x, y, 2, 2, '#30d030'); p.rect(x, y + 2, 2, 1, '#f2c79a'); p.rect(x, y + 3, 2, 3, '#2a40e0'); p.px(x + (f ? -1 : 2), y + 4, '#f2c79a'); p.rect(x, y + 6, 1, 1, '#2a40e0'); p.rect(x + 1, y + 6, 1, 1, f ? '#000' : '#2a40e0'); };
      [8, 16, 24, 34, 50].forEach((x, i) => lem(x, 33, i % 2));
      // blocker with arms out
      p.rect(42, 33, 2, 2, '#30d030'); p.rect(42, 35, 2, 1, '#f2c79a'); p.rect(42, 36, 2, 3, '#2a40e0'); p.rect(40, 36, 2, 1, '#f2c79a'); p.rect(44, 36, 2, 1, '#f2c79a'); p.rect(42, 39, 2, 1, '#2a40e0');
      // digger in a hole
      p.rect(26, 42, 6, 6, '#000'); lem(28, 41, 0);
      // floater with an umbrella
      p.oell(68, 20, 6, 3, '#e10600'); p.rect(62, 20, 13, 1, '#000'); p.rect(68, 20, 1, 5, '#ddd'); lem(67, 25, 0);
    } },
    sonic: { cap: 'A blue spinning blur, gold rings and a loop-the-loop on chequered green hills.', draw(p, S) {
      p.vgrad(0, 40, '#2a6ad8', '#a0d8ff'); p.rect(0, 30, 96, 6, '#1a6ad8'); for (let x = 0; x < 96; x += 6) p.rect(x, 32, 3, 1, '#fff');
      // chequered ground
      for (let y = 50; y < 72; y += 6) for (let x = 0; x < 96; x += 6) p.rect(x, y, 6, 6, ((x + y) / 6) % 2 ? '#c87a2a' : '#8a4a1a');
      p.rect(0, 47, 96, 4, '#3ac83a'); p.rect(0, 47, 96, 1, '#8af08a');
      // loop
      p.ring(66, 32, 15, '#3ac83a', 3); p.ring(66, 32, 12, '#8a4a1a', 2); p.rect(52, 44, 28, 4, '#3ac83a');
      // rings
      [[16, 30], [24, 26], [32, 24], [66, 22], [66, 42]].forEach(([x, y]) => { p.ring(x, y, 3, '#ffd400', 1); p.px(x - 2, y - 1, '#fff8a0'); });
      // spinning blue ball with speed lines
      p.odisc(34, 42, 6, '#1a4ae0'); p.ell(32, 40, 3, 2, '#5a8aff'); p.line(30, 46, 38, 38, '#0a2a9a'); p.line(34, 47, 39, 41, '#0a2a9a');
      for (let i = 0; i < 4; i++) p.rect(8 + i * 2, 38 + i * 2, 16 - i * 3, 1, '#ffffff');
    } },
    street_fighter_2: { cap: 'Two martial artists face off, one throwing a glowing energy ball. Round one: fight!', draw(p, S) {
      p.vgrad(0, 48, '#ff8040', '#ffe090'); p.disc(48, 40, 14, '#ffe060');
      p.rect(0, 50, 96, 22, '#7a4a1a'); p.dither(0, 50, 96, 22, '#6a3a10');
      // health bars
      p.obox(4, 3, 38, 5, '#ffd400'); p.rect(5, 4, 12, 3, '#e10600'); p.obox(54, 3, 38, 5, '#ffd400'); p.rect(80, 4, 11, 3, '#e10600'); p.text(44, 3, 'KO', '#e10600');
      const fighter = (x, gi, belt, f) => {
        p.odisc(x, 18, 4, '#f2c79a'); p.rect(x - 4, 14, 9, 2, '#3a2a1a');
        p.opoly([[x - 6, 23], [x + 6, 23], [x + 5, 36], [x - 5, 36]], gi); p.rect(x - 5, 33, 11, 2, belt);
        p.thick(x + 4 * f, 25, x + 13 * f, 27, gi, 3); p.odisc(x + 14 * f, 27, 2, '#f2c79a');
        p.thick(x - 3 * f, 26, x - 4 * f, 32, gi, 3);
        p.thick(x - 2, 36, x - 8, 50, gi, 4); p.thick(x + 2, 36, x + 6, 50, gi, 4);
      };
      fighter(24, '#f8f8f8', '#000', 1); fighter(74, '#3a6ae0', '#e10600', -1);
      p.odisc(48, 27, 5, '#5ac8ff'); p.disc(48, 27, 3, '#fff'); p.line(38, 25, 43, 26, '#5ac8ff'); p.line(38, 29, 43, 28, '#5ac8ff');
    } },
    wolfenstein_3d: { cap: 'Blue stone walls, a wooden door and flat floors: early 3-D on an ordinary PC.', draw(p, S) {
      p.rect(0, 0, 96, 30, '#383838'); p.rect(0, 30, 96, 30, '#707070');
      const wall = (pts, c) => { p.poly(pts, c); };
      wall([[0, 0], [28, 16], [28, 44], [0, 60]], '#2a3aa0'); wall([[96, 0], [68, 16], [68, 44], [96, 60]], '#1a2a80');
      for (let y = 6; y < 60; y += 7) { p.line(0, y, 28, 16 + (y - 6) * 0.5, '#4a5ac8'); p.line(96, y, 68, 16 + (y - 6) * 0.5, '#3a4ab0'); }
      p.rect(28, 16, 40, 28, '#2a3aa0'); for (let y = 16; y < 44; y += 5) p.rect(28, y, 40, 1, '#4a5ac8'); for (let y = 16; y < 44; y += 10) for (let x = 28; x < 68; x += 10) p.rect(x + ((y / 5) % 2) * 5, y, 1, 5, '#4a5ac8');
      p.rect(40, 20, 16, 24, '#5a8a9a'); p.rect(41, 21, 14, 23, '#3a6a7a'); p.rect(47, 21, 2, 23, '#2a5a6a'); p.px(53, 32, '#ffd400');
      // pistol at the bottom
      p.obox(42, 48, 12, 12, '#3a3a3a'); p.obox(45, 40, 6, 9, '#555'); p.rect(46, 41, 1, 8, '#888'); p.obox(40, 58, 16, 4, '#f2c79a');
      p.rect(0, 62, 96, 10, '#004040'); p.rect(0, 62, 96, 1, '#00a0a0'); p.text(4, 65, 'FLOOR 1', '#fff'); p.text(56, 65, 'LIVES 3', '#fff');
    } },
    mortal_kombat: { cap: 'Real actors were filmed doing kicks in a studio, then turned into game pictures.', draw(p, S) {
      p.fill('#2a3a9a'); p.rect(0, 58, 96, 14, '#5a5a6a'); p.rect(0, 58, 96, 1, '#8a8a9a');
      // studio light
      p.poly([[90, 0], [96, 0], [70, 60], [50, 60]], 'rgba(255,255,200,.12)'); p.obox(84, 2, 10, 6, '#333');
      // martial artist mid-kick
      p.odisc(28, 18, 4, '#f2c79a'); p.rect(25, 16, 7, 2, '#202020');
      p.opoly([[22, 23], [34, 23], [33, 38], [23, 38]], '#d8c020'); p.rect(23, 35, 11, 2, '#202020');
      p.thick(33, 26, 40, 24, '#f2c79a', 3); p.thick(23, 26, 18, 32, '#f2c79a', 3);
      p.thick(26, 38, 22, 57, '#202020', 4); p.thick(31, 38, 50, 30, '#202020', 4); p.odisc(52, 29, 2, '#f2c79a');
      // camera on a tripod
      p.obox(62, 22, 18, 12, '#1a1a1a'); p.odisc(60, 28, 4, '#333'); p.disc(60, 28, 2, '#5a8aff'); p.ring(66, 18, 4, '#333'); p.ring(76, 18, 4, '#333'); p.px(78, 24, '#e10600');
      p.line(71, 34, 64, 58, '#333').line(71, 34, 72, 58, '#333').line(71, 34, 80, 58, '#333');
      p.text(4, 4, 'REC', '#e10600'); p.disc(18, 6, 1.5, '#e10600');
    } },
    doom: { cap: 'A space marine\'s view: a dark tech corridor, a horned red monster and the shotgun.', draw(p, S) {
      p.fill('#1a1008');
      p.poly([[0, 0], [30, 18], [30, 44], [0, 62]], '#5a4a30'); p.poly([[96, 0], [66, 18], [66, 44], [96, 62]], '#4a3a24');
      for (let i = 0; i < 4; i++) { const x = i * 7; p.line(x, i * 4, x, 62 - i * 4, '#3a2a18'); p.line(96 - x, i * 4, 96 - x, 62 - i * 4, '#2a1a10'); }
      p.rect(30, 18, 36, 26, '#3a5a3a'); for (let x = 30; x < 66; x += 6) p.rect(x, 18, 1, 26, '#2a4a2a'); p.rect(30, 30, 36, 2, '#e8c040');
      p.poly([[0, 62], [30, 44], [66, 44], [96, 62]], '#3a3028'); p.rect(4, 8, 4, 6, '#ff3020'); p.rect(88, 8, 4, 6, '#ff3020');
      // the monster
      p.oell(48, 34, 9, 10, '#a82018'); p.poly([[41, 26], [38, 18], [44, 24]], '#e8e0c0'); p.poly([[55, 26], [58, 18], [52, 24]], '#e8e0c0');
      p.disc(45, 31, 1.5, '#ffd400').disc(51, 31, 1.5, '#ffd400'); p.rect(44, 37, 8, 2, '#300'); for (let x = 44; x < 52; x += 2) p.px(x, 37, '#fff');
      p.thick(40, 34, 34, 40, '#a82018', 3); p.thick(56, 34, 62, 40, '#a82018', 3);
      // shotgun barrels
      p.opoly([[40, 54], [56, 54], [60, 64], [36, 64]], '#3a3a3a'); p.obox(42, 46, 5, 10, '#555'); p.obox(49, 46, 5, 10, '#555'); p.rect(43, 47, 1, 8, '#888'); p.rect(50, 47, 1, 8, '#888'); p.rect(38, 60, 20, 4, '#7a4a1a');
      p.rect(0, 64, 96, 8, '#5a5a5a'); p.rect(0, 64, 96, 1, '#888'); p.text(3, 66, '100%', '#e10600'); p.text(70, 66, 'AMMO', '#e10600'); p.obox(44, 64, 8, 8, '#f2c79a');
    } },
    myst: { cap: 'A quiet island with a tower, a giant gear and a sunken ship. Nobody about. Spooky.', draw(p, S) {
      S.sea(p, 40);
      p.vgrad(0, 40, '#7a90c0', '#e0c8b0'); p.disc(20, 14, 6, '#fff3d0');
      p.oell(48, 46, 38, 8, '#4a7a3a'); p.ell(48, 44, 34, 6, '#5a8a4a');
      // tower
      p.obox(62, 12, 8, 32, '#c8b898'); p.opoly([[60, 12], [66, 4], [72, 12]], '#7a4a3a'); p.rect(64, 18, 3, 4, '#203040');
      // giant gear
      p.odisc(34, 36, 7, '#9a8a6a'); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; p.rect(34 + Math.cos(a) * 8 - 1, 36 + Math.sin(a) * 8 - 1, 3, 3, '#9a8a6a'); } p.disc(34, 36, 2.5, '#5a4a2a');
      // dock and ship mast
      p.rect(12, 46, 14, 2, '#7a4a1a'); for (let x = 13; x < 26; x += 4) p.rect(x, 48, 1, 4, '#5a3008'); p.rect(8, 50, 1, 10, '#5a3008'); p.rect(5, 52, 7, 1, '#5a3008');
      // the linking book in the foreground
      p.opoly([[56, 58], [72, 54], [72, 68], [56, 72]], '#f0e0c0'); p.opoly([[72, 54], [88, 58], [88, 72], [72, 68]], '#e8d8b8'); p.rect(60, 60, 8, 6, '#203050'); for (let y = 60; y < 68; y += 2) p.line(75, y, 85, y + 1, '#9a8a6a');
    } },
  });
  A.add({
    command_conquer: { cap: 'A battlefield seen from above: tanks, a harvester and patches of glowing green Tiberium.', draw(p, S) {
      p.fill('#c8a060'); p.dither(0, 0, 96, 72, '#b89050');
      const R = A.rng(21); for (let i = 0; i < 26; i++) { const x = 6 + R() * 40, y = 34 + R() * 30; p.poly([[x, y + 3], [x + 1.5, y - 2], [x + 3, y + 3]], R() < 0.5 ? '#40ff40' : '#20c020'); }
      // base buildings
      p.obox(56, 6, 24, 18, '#7a7a6a'); p.rect(58, 8, 20, 4, '#5a5a4a'); p.obox(62, 14, 8, 8, '#3a3a3a'); p.obox(80, 30, 12, 12, '#8a8a7a'); p.odisc(86, 36, 3, '#5a5a5a');
      // tanks with a green selection box
      const tank = (x, y, c) => { p.obox(x, y, 10, 8, c); p.rect(x, y, 10, 2, '#333'); p.rect(x, y + 6, 10, 2, '#333'); p.odisc(x + 5, y + 4, 2.5, p.shade(c, 0.2)); p.thick(x + 5, y + 4, x + 12, y + 1, '#333', 1); };
      tank(18, 10, '#d8b020'); tank(32, 18, '#d8b020'); p.rect(15, 7, 30, 1, '#30ff30'); p.rect(15, 29, 30, 1, '#30ff30'); p.rect(15, 7, 1, 23, '#30ff30'); p.rect(44, 7, 1, 23, '#30ff30');
      tank(64, 50, '#a02020');
      // harvester
      p.obox(34, 48, 14, 10, '#d8b020'); p.rect(30, 50, 4, 6, '#888'); p.obox(40, 44, 6, 5, '#5a8aa0');
      p.rect(0, 66, 96, 6, '#202020'); p.text(3, 67, 'CREDITS 1250', '#30ff30');
    } },
    crash_bandicoot: { cap: 'A jungle path running into the screen, lined with wooden crates to smash.', draw(p, S) {
      p.vgrad(0, 30, '#80d0ff', '#e0f8ff');
      p.rect(0, 20, 96, 52, '#2a7a2a'); for (let i = 0; i < 9; i++) { const x = (i * 23) % 96; p.oell(x, 22 + (i % 3) * 3, 10, 6, i % 2 ? '#1a6a1a' : '#3a9a3a'); }
      p.poly([[40, 26], [56, 26], [90, 72], [6, 72]], '#d8a868'); p.dither(0, 40, 96, 32, 'rgba(0,0,0,0)');
      for (let i = 0; i < 6; i++) { const t = i / 5, y = 30 + t * 34; p.line(40 - t * 34, y, 30 - t * 30, y + 2, '#b88848'); }
      const crate = (x, y, s) => { p.obox(x, y, s, s, '#c8802a'); p.rect(x + 1, y + 1, s - 2, 1, '#e8a050'); p.line(x + 1, y + 1, x + s - 2, y + s - 2, '#7a4a10'); p.line(x + s - 2, y + 1, x + 1, y + s - 2, '#7a4a10'); p.rect(x + 1, y + (s >> 1), s - 2, 1, '#7a4a10'); };
      crate(44, 30, 7); crate(52, 34, 8); crate(30, 44, 11); crate(60, 48, 12); crate(14, 56, 14); crate(68, 58, 14);
      [[38, 36], [62, 42], [26, 60]].forEach(([x, y]) => { p.odisc(x, y, 2.5, '#ff6020'); p.px(x - 1, y - 1, '#ffc080'); });
      p.oell(10, 40, 8, 14, '#1a5a1a'); p.oell(86, 40, 8, 16, '#1a5a1a');
    } },
    mario_64: { cap: 'A castle full of magic paintings, and a golden Power Star waiting to be found.', draw(p, S) {
      S.sky(p, 52, '#3ab83a'); p.ell(20, 10, 8, 3, '#fff').ell(76, 14, 9, 3, '#fff');
      p.rect(0, 52, 96, 6, '#2a6ad8'); p.rect(40, 50, 16, 8, '#c8a878');
      // castle
      p.obox(22, 24, 52, 28, '#f0e8d8'); p.obox(14, 18, 12, 34, '#f0e8d8'); p.obox(70, 18, 12, 34, '#f0e8d8'); p.obox(40, 12, 16, 16, '#f0e8d8');
      p.opoly([[12, 18], [20, 4], [28, 18]], '#e02020'); p.opoly([[68, 18], [76, 4], [84, 18]], '#e02020'); p.opoly([[38, 12], [48, 0], [58, 12]], '#e02020');
      p.rect(42, 38, 12, 14, '#7a4a1a'); p.ell(48, 38, 6, 4, '#7a4a1a'); p.disc(48, 30, 4, '#c8e8ff'); p.ring(48, 30, 4, '#c8a040');
      for (const x of [18, 74]) { p.rect(x, 26, 3, 5, '#203060'); p.rect(x, 38, 3, 5, '#203060'); }
      // power star
      const st = (cx, cy, r) => { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } p.opoly(pts, '#ffd400', '#a07000'); };
      st(84, 58, 8); p.px(82, 55, '#fff8c0');
    } },
    tomb_raider: { cap: 'An explorer with twin pistols in an ancient tomb, eyeing a golden treasure.', draw(p, S) {
      p.fill('#2a1a10');
      p.rect(0, 0, 96, 72, '#3a2a18'); for (let y = 0; y < 60; y += 8) for (let x = (y / 8 % 2) * 8; x < 96; x += 16) p.rect(x, y, 15, 7, '#4a3620');
      // columns and steps
      for (const x of [8, 76]) { p.obox(x, 8, 12, 50, '#8a7a5a'); for (let y = 10; y < 56; y += 4) p.rect(x + 2, y, 1, 3, '#6a5a3a'); p.obox(x - 2, 4, 16, 5, '#9a8a6a'); }
      p.rect(0, 58, 96, 14, '#6a5a3a'); p.obox(30, 50, 36, 8, '#7a6a4a'); p.obox(36, 44, 24, 7, '#8a7a5a');
      // golden idol on its plinth, glowing
      p.disc(48, 34, 9, 'rgba(255,220,80,.2)'); p.obox(44, 36, 8, 8, '#e8c040'); p.odisc(48, 32, 3.5, '#ffd400'); p.px(47, 31, '#7a4a00').px(49, 31, '#7a4a00');
      // explorer (seen from behind, generic): backpack, holsters
      p.odisc(28, 40, 3, '#5a3a1a'); p.obox(24, 43, 8, 9, '#3a6a7a'); p.obox(25, 44, 6, 6, '#7a5a2a'); p.rect(24, 52, 8, 3, '#7a5a2a'); p.rect(24, 55, 3, 8, '#e0b080'); p.rect(29, 55, 3, 8, '#e0b080'); p.rect(23, 62, 4, 2, '#3a2a1a'); p.rect(29, 62, 4, 2, '#3a2a1a');
      p.thick(23, 44, 18, 50, '#e0b080', 2); p.thick(33, 44, 38, 50, '#e0b080', 2); p.rect(16, 50, 4, 2, '#333'); p.rect(37, 50, 4, 2, '#333');
      p.rect(8, 30, 2, 5, '#7a4a1a'); p.poly([[7, 30], [11, 30], [9, 25]], '#ff8000');
    } },
    quake: { cap: 'Real 3-D at last: a blocky polygon monster in a gloomy brown castle.', draw(p, S) {
      p.fill('#1a120a');
      p.poly([[0, 0], [28, 14], [28, 48], [0, 62]], '#5a4028'); p.poly([[96, 0], [68, 14], [68, 48], [96, 62]], '#4a3420'); p.rect(28, 14, 40, 34, '#3a2a18');
      for (let y = 14; y < 48; y += 6) p.rect(28, y, 40, 1, '#2a1a0a'); p.poly([[0, 62], [28, 48], [68, 48], [96, 62]], '#4a3a2a'); p.rect(0, 62, 96, 10, '#4a3a2a');
      p.rect(46, 14, 4, 6, '#a06020'); p.poly([[45, 14], [51, 14], [48, 8]], '#ffa020');
      // polygon monster: flat-shaded faces
      p.opoly([[40, 24], [56, 24], [58, 34], [38, 34]], '#8a6a4a'); p.poly([[48, 24], [56, 24], [58, 34], [48, 34]], '#6a4a2a');
      p.opoly([[42, 16], [54, 16], [56, 24], [40, 24]], '#9a7a5a'); p.rect(44, 19, 2, 2, '#ff2000'); p.rect(50, 19, 2, 2, '#ff2000');
      p.opoly([[38, 26], [30, 36], [33, 38], [40, 30]], '#7a5a3a'); p.opoly([[58, 26], [66, 36], [63, 38], [56, 30]], '#5a3a1a');
      p.opoly([[40, 34], [46, 34], [45, 46], [39, 46]], '#6a4a2a'); p.opoly([[50, 34], [56, 34], [57, 46], [51, 46]], '#5a3a1a');
      // nailgun at the bottom
      p.opoly([[40, 72], [44, 56], [52, 56], [56, 72]], '#5a5a60'); p.obox(43, 52, 10, 6, '#7a7a80'); p.rect(45, 50, 2, 3, '#aaa'); p.rect(49, 50, 2, 3, '#aaa');
    } },
    pokemon: { cap: 'Two Game Boys joined by a link cable: the only way to catch all 151.', draw(p, S) {
      p.vgrad(0, 72, '#fff4c0', '#ffd870');
      const gb = (x, mon) => {
        p.opoly([[x, 6], [x + 30, 6], [x + 30, 60], [x + 24, 66], [x, 66]], '#c8c4bc'); p.rect(x + 1, 7, 28, 1, '#e8e4dc');
        p.obox(x + 3, 10, 24, 20, '#585868'); p.rect(x + 6, 12, 18, 16, '#9bbc0f'); p.rect(x + 6, 24, 18, 4, '#8bac0f');
        mon(x + 15, 19);
        dpad(p, x + 8, 40, '#333'); p.odisc(x + 20, 41, 2.4, '#a8105a'); p.odisc(x + 25, 38, 2.4, '#a8105a');
      };
      gb(4, (cx, cy) => { p.ell(cx, cy + 2, 5, 4, '#306230'); p.poly([[cx - 4, cy - 1], [cx - 6, cy - 7], [cx - 1, cy - 2]], '#306230'); p.poly([[cx + 4, cy - 1], [cx + 6, cy - 7], [cx + 1, cy - 2]], '#306230'); p.px(cx - 2, cy + 1, '#9bbc0f').px(cx + 2, cy + 1, '#9bbc0f'); });
      gb(62, (cx, cy) => { p.ell(cx, cy + 1, 6, 5, '#0f380f'); p.ell(cx, cy - 3, 4, 3, '#306230'); p.poly([[cx + 5, cy + 2], [cx + 10, cy - 2], [cx + 7, cy + 4]], '#306230'); p.px(cx - 2, cy - 3, '#9bbc0f').px(cx + 1, cy - 3, '#9bbc0f'); });
      // link cable between them, with an arrow
      p.thick(18, 6, 18, 2, '#333', 2); p.thick(76, 6, 76, 2, '#333', 2); p.thick(18, 2, 76, 2, '#333', 2);
      p.text(36, 30, 'TRADE', '#e10600'); p.poly([[42, 38], [52, 38], [52, 36], [56, 40], [52, 44], [52, 42], [42, 42]], '#2a5ad8');
    } },
    goldeneye: { cap: 'Four-player split-screen: four friends, one telly, and absolutely no screen-peeking.', draw(p, S) {
      p.fill('#000');
      const view = (x, y, wall, floor, enemy) => {
        p.rect(x, y, 47, 35, '#000'); p.rect(x, y, 47, 17, p.shade(wall, -0.3)); p.rect(x, y + 17, 47, 18, floor);
        p.poly([[x, y], [x + 14, y + 10], [x + 14, y + 24], [x, y + 35]], wall); p.poly([[x + 47, y], [x + 33, y + 10], [x + 33, y + 24], [x + 47, y + 35]], p.shade(wall, -0.15));
        p.rect(x + 14, y + 10, 19, 14, p.shade(wall, -0.45)); p.rect(x + 20, y + 12, 7, 12, '#1a1a1a');
        if (enemy) { p.rect(x + 22, y + 14, 3, 3, '#f2c79a'); p.rect(x + 21, y + 17, 5, 6, enemy); }
        p.obox(x + 28, y + 26, 8, 6, '#333'); p.rect(x + 30, y + 23, 2, 4, '#555'); p.line(x + 22, y + 17, x + 24, y + 17, '#fff').line(x + 23, y + 16, x + 23, y + 18, '#fff');
      };
      view(0, 0, '#8a8a7a', '#5a5a50', '#2a5a2a'); view(49, 0, '#7a5a3a', '#4a3a2a', '#1a1a1a'); view(0, 37, '#5a7a9a', '#3a4a5a', '#c8a040'); view(49, 37, '#9a3a2a', '#5a2a1a', null);
      p.rect(47, 0, 2, 72, '#555'); p.rect(0, 35, 96, 2, '#555');
    } },
    final_fantasy_vii: { cap: 'A giant sword, glowing magic orbs, and a story so big it needed three CDs.', draw(p, S) {
      p.vgrad(0, 72, '#102030', '#305060'); p.stars(20, 31, ['#9fd0ff', '#5a8aa0']);
      p.rect(0, 58, 96, 14, '#2a2a30'); for (let x = 0; x < 96; x += 10) p.rect(x, 58, 1, 14, '#1a1a20');
      // big broadsword stuck in the ground
      p.opoly([[30, 6], [42, 6], [42, 52], [36, 60], [30, 52]], '#b8c0c8'); p.rect(31, 7, 3, 44, '#e8f0f8'); p.rect(38, 7, 3, 44, '#8a9098'); p.odisc(36, 14, 1.5, '#5a6068'); p.odisc(36, 22, 1.5, '#5a6068');
      p.obox(26, 0, 20, 6, '#5a4a3a'); p.rect(33, -6, 6, 6, '#3a2a1a');
      // magic orbs
      [[60, 28, '#30ff60'], [70, 20, '#ff4040'], [78, 32, '#4080ff'], [66, 40, '#ffd400']].forEach(([x, y, c]) => { p.disc(x, y, 6, 'rgba(255,255,255,.12)'); p.odisc(x, y, 3.5, c); p.px(x - 1, y - 1, '#fff'); });
      // three CDs
      [[62, 56], [72, 58], [82, 60]].forEach(([x, y], i) => { p.oell(x, y, 7, 3, '#d8e0f0'); p.ell(x - 2, y - 1, 3, 1, ['#ffb0e0', '#a0e0ff', '#fff3a0'][i]); p.ell(x, y, 1.5, 0.8, '#2a2a30'); });
    } },
    gran_turismo: { cap: 'A sports car hugging the kerb on the racing line. Pass your licence test first!', draw(p, S) {
      p.vgrad(0, 30, '#6aa8ff', '#d8ecff'); p.rect(0, 18, 96, 12, '#4a8a3a');
      p.obox(4, 10, 40, 10, '#c8c8c8'); for (let x = 6; x < 42; x += 3) p.rect(x, 12, 2, 6, ['#e10600', '#2a5ad8', '#ffd400'][x % 3]);
      p.poly([[0, 30], [96, 22], [96, 72], [0, 72]], '#555'); p.dither(0, 40, 96, 32, '#5c5c5c');
      for (let x = 0; x < 96; x += 6) { const y = 30 - x * 8 / 96; p.rect(x, y, 6, 3, (x / 6) % 2 ? '#e10600' : '#fff'); }
      // sports car, three-quarter rear view
      p.opoly([[22, 52], [30, 40], [66, 38], [78, 48], [80, 60], [20, 62]], '#c80a0a'); p.opoly([[34, 40], [62, 38], [66, 46], [32, 48]], '#203050'); p.rect(36, 41, 10, 2, '#5a7aa0');
      p.rect(22, 54, 58, 2, '#7a0000'); p.rect(26, 56, 8, 3, '#ff8000'); p.rect(66, 56, 8, 3, '#ff8000'); p.obox(40, 56, 16, 4, '#ffd400'); p.rect(20, 48, 8, 2, '#111'); p.rect(72, 46, 8, 2, '#111');
      p.obox(20, 60, 12, 8, '#111'); p.obox(68, 60, 12, 8, '#111');
      // chequered flag
      p.rect(86, 4, 1, 18, '#333'); for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) p.rect(87 + i * 2, 4 + j * 2, 2, 2, (i + j) % 2 ? '#000' : '#fff');
    } },
    ocarina: { cap: 'A little blue ocarina playing a magic tune over a sunset field.', draw(p, S) {
      p.vgrad(0, 50, '#ff9a50', '#ffe0a0'); p.disc(70, 36, 10, '#ffe060'); p.rect(0, 46, 96, 26, '#4a8a2a'); p.dither(0, 46, 96, 26, '#3a7a20');
      p.rect(8, 30, 4, 16, '#8a8a9a'); p.opoly([[6, 30], [10, 22], [14, 30]], '#5a5a7a'); p.rect(14, 36, 12, 10, '#8a8a9a'); p.rect(20, 32, 4, 4, '#8a8a9a');
      // the ocarina
      p.oell(48, 52, 20, 12, '#2a5ad8'); p.ell(44, 48, 12, 6, '#5a8af0'); p.ell(40, 46, 4, 2, '#a0c0ff');
      p.opoly([[66, 48], [78, 44], [80, 48], [68, 54]], '#2a5ad8'); p.rect(77, 45, 3, 2, '#000');
      [[38, 50], [46, 48], [54, 50], [42, 57], [52, 57]].forEach(([x, y]) => p.odisc(x, y, 1.6, '#0a1a5a'));
      // floating notes
      const note = (x, y, c) => { p.odisc(x, y, 2, c); p.rect(x + 2, y - 8, 1, 8, '#000'); p.rect(x + 2, y - 8, 4, 2, '#000'); };
      note(20, 20, '#fff'); note(32, 12, '#ffd400'); note(52, 18, '#fff'); note(84, 14, '#ffd400');
    } },
    half_life: { cap: 'A trusty crowbar in a research lab, just as an experiment goes very wrong.', draw(p, S) {
      p.fill('#3a4048');
      for (let x = 0; x < 96; x += 12) { p.rect(x, 0, 11, 44, '#4a5058'); p.rect(x, 0, 11, 1, '#6a7078'); }
      for (let x = 0; x < 96; x += 8) p.poly([[x, 40], [x + 4, 40], [x + 8, 44], [x + 4, 44]], '#ffd400'); p.rect(0, 44, 96, 28, '#2a2e34');
      // glowing green portal / beam
      p.disc(62, 24, 14, 'rgba(80,255,120,.15)'); p.disc(62, 24, 9, 'rgba(120,255,160,.35)'); p.disc(62, 24, 4, '#e0ffe8'); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; p.line(62, 24, 62 + Math.cos(a) * 16, 24 + Math.sin(a) * 12, 'rgba(160,255,190,.6)'); }
      p.rect(56, 36, 12, 8, '#6a7078'); p.rect(54, 44, 16, 3, '#5a6068');
      // red crowbar in the foreground
      p.thick(12, 66, 44, 34, '#c81010', 4); p.thick(13, 65, 43, 35, '#ff4040', 1); p.thick(44, 34, 50, 30, '#c81010', 4); p.thick(50, 30, 52, 34, '#c81010', 3); p.thick(12, 66, 8, 62, '#c81010', 3);
      p.rect(4, 4, 14, 10, '#202830'); p.rect(5, 5, 12, 8, '#30a050'); p.text(6, 7, 'HEV', '#000');
    } },
    metal_gear_solid: { cap: 'A cardboard box in a snowy base at night. Totally not suspicious. Nothing to see here.', draw(p, S) {
      p.vgrad(0, 72, '#0a1020', '#2a3a5a'); for (let i = 0; i < 40; i++) p.px((i * 37) % 96, (i * 53) % 50, '#fff');
      p.obox(6, 12, 34, 30, '#5a6a7a'); for (let y = 16; y < 40; y += 4) p.rect(8, y, 30, 1, '#4a5a6a'); p.obox(48, 18, 40, 24, '#4a5a6a'); p.rect(60, 28, 12, 14, '#1a2028');
      p.poly([[86, 6], [90, 4], [60, 60], [36, 60]], 'rgba(255,255,200,.18)'); p.obox(84, 2, 8, 6, '#333');
      p.rect(0, 42, 96, 30, '#e8f0ff'); p.dither(0, 42, 96, 30, '#c8d8f0');
      // the box
      p.opoly([[34, 50], [58, 48], [62, 62], [32, 64]], '#b88a4a'); p.opoly([[34, 50], [58, 48], [54, 44], [38, 45]], '#d8aa6a'); p.line(40, 52, 40, 63, '#8a5a2a'); p.rect(44, 54, 10, 1, '#7a3a10'); p.rect(44, 56, 7, 1, '#7a3a10');
      p.rect(36, 60, 4, 4, '#203040');
      // exclamation mark of being spotted
      p.obox(46, 28, 5, 11, '#e10600'); p.obox(46, 40, 5, 4, '#e10600');
      p.odisc(76, 46, 3, '#3a4a3a'); p.rect(73, 49, 6, 10, '#3a4a3a'); p.rect(74, 59, 2, 4, '#222'); p.rect(77, 59, 2, 4, '#222');
    } },
  });
  A.add({
    starcraft: { cap: 'Three sides at war: armoured humans, insect swarms and glowing psychic aliens.', draw(p, S) {
      S.space(p, 77); p.oell(80, 70, 40, 16, '#7a3a5a'); p.ell(70, 60, 10, 3, '#9a5a7a');
      p.rect(0, 58, 96, 14, '#3a2a30');
      // armoured human in a bulky suit
      p.obox(8, 26, 20, 20, '#2a5ad8'); p.obox(4, 24, 8, 8, '#3a6ae8'); p.obox(24, 24, 8, 8, '#3a6ae8'); p.obox(12, 16, 12, 11, '#2a5ad8'); p.rect(14, 19, 8, 4, '#80e0ff');
      p.obox(10, 46, 7, 12, '#1a4ab8'); p.obox(19, 46, 7, 12, '#1a4ab8'); p.obox(28, 30, 12, 4, '#555'); p.rect(38, 31, 3, 2, '#888');
      // insect-like creature
      p.oell(48, 46, 10, 7, '#6a2a7a'); p.oell(54, 38, 6, 5, '#7a3a8a'); p.px(56, 37, '#ffd400').px(53, 37, '#ffd400');
      p.thick(58, 36, 66, 26, '#c8a0d0', 2); p.thick(42, 42, 36, 32, '#c8a0d0', 2); for (let i = 0; i < 3; i++) p.thick(42 + i * 6, 52, 40 + i * 6, 58, '#4a1a5a', 2);
      // glowing psychic alien
      p.disc(80, 30, 14, 'rgba(120,200,255,.18)'); p.obox(74, 30, 12, 16, '#d8b040'); p.oell(80, 24, 5, 6, '#a08a60'); p.rect(78, 23, 4, 1, '#40e0ff');
      p.opoly([[74, 46], [86, 46], [90, 58], [70, 58]], '#c8a030'); p.thick(86, 34, 92, 44, '#40e0ff', 2); p.thick(74, 34, 68, 44, '#40e0ff', 2);
    } },
    sensible_soccer: { cap: 'A pitch seen from above with tiny players, and a shot curling in with aftertouch.', draw(p, S) {
      p.fill('#2a8a2a'); for (let y = 0; y < 72; y += 12) p.rect(0, y, 96, 6, '#309a30');
      p.rect(4, 4, 88, 1, '#fff'); p.rect(4, 4, 1, 64, '#fff'); p.rect(91, 4, 1, 64, '#fff'); p.rect(4, 67, 88, 1, '#fff');
      p.rect(28, 4, 40, 16, '#fff'); p.rect(29, 4, 38, 15, '#2a8a2a'); p.rect(29, 4, 38, 6, '#309a30'); p.rect(38, 4, 20, 6, '#fff'); p.rect(39, 4, 18, 5, '#309a30');
      p.rect(36, 0, 24, 4, '#fff'); p.rect(37, 0, 22, 3, '#888'); p.ring(48, 66, 10, '#fff');
      const man = (x, y, shirt) => { p.rect(x, y, 2, 2, '#f2c79a'); p.rect(x - 1, y + 2, 4, 3, shirt); p.rect(x, y + 5, 1, 2, '#000'); p.rect(x + 2, y + 5, 1, 2, '#000'); };
      [[20, 40], [70, 46], [56, 30], [30, 54], [80, 26]].forEach(([x, y]) => man(x, y, '#e10600')); [[44, 20], [62, 52], [14, 26], [46, 44]].forEach(([x, y]) => man(x, y, '#2a5ad8')); man(47, 8, '#ffd400');
      // curling shot (dotted path) and the ball
      for (let t = 0; t < 1; t += 0.08) { const x = 70 + (52 - 70) * t + Math.sin(t * 3.1) * 8, y = 46 + (10 - 46) * t; p.px(x, y, '#fff'); }
      p.odisc(55, 12, 1.5, '#fff');
    } },
    mario_kart: { cap: 'A go-kart racing past a banana skin and a spinning shell. Watch your back!', draw(p, S) {
      p.vgrad(0, 28, '#5aa0ff', '#d0ecff'); p.ell(70, 10, 9, 3, '#fff');
      p.rect(0, 22, 96, 50, '#3a9a3a'); p.dither(0, 30, 96, 42, '#2a8a2a'); p.poly([[34, 22], [62, 22], [96, 60], [96, 72], [0, 72], [0, 60]], '#6a6a6a');
      for (let i = 0; i < 6; i++) { const t = i / 6, y = 24 + t * t * 48; p.rect(34 - t * 34 - 2, y, 3, 2 + t * 3, i % 2 ? '#fff' : '#e10600'); p.rect(62 + t * 34 - 1, y, 3, 2 + t * 3, i % 2 ? '#fff' : '#e10600'); }
      // the kart from behind, with a helmeted driver
      p.obox(34, 50, 28, 12, '#2a5ad8'); p.rect(36, 52, 24, 2, '#5a8af0'); p.obox(28, 54, 8, 12, '#1a1a1a'); p.obox(60, 54, 8, 12, '#1a1a1a'); p.obox(40, 62, 16, 4, '#555'); p.rect(43, 63, 3, 2, '#ff8000'); p.rect(50, 63, 3, 2, '#ff8000');
      p.odisc(48, 44, 6, '#e8e8e8'); p.rect(43, 42, 10, 2, '#e10600'); p.obox(42, 48, 12, 4, '#ffd400');
      // banana skin and a shell
      p.thick(20, 40, 24, 36, '#ffd400', 2); p.thick(24, 36, 27, 40, '#ffd400', 2); p.thick(24, 36, 24, 33, '#7a5a10', 1);
      p.oell(72, 38, 5, 3.5, '#2aa02a'); p.ell(72, 37, 3, 2, '#5ad85a'); p.rect(67, 39, 10, 1, '#fff');
      for (let i = 0; i < 3; i++) p.rect(78 + i * 3, 38, 2, 1, '#fff');
    } },
  });
})();

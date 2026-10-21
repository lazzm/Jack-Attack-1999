/* carta-art-tech.js: JackCarta 99 pictures for PC Hardware, History of Computing and The Internet articles (96x72 pixel art).
 * Generic, representative drawings of the real thing: shapes, colours and era details, never logos or wordmarks. */
(function () {
  const A = window.Carta && Carta.art; if (!A) return;
  const W = 96, H = 72;
  // ---------------------------------------------------------------- shared bits
  function board(p, seed) { // green motherboard with copper traces and solder dots
    p.fill('#1a5a2a'); const R = A.rng(seed || 4);
    for (let i = 0; i < 26; i++) { const y = (R() * H) | 0, x = (R() * W) | 0, l = 8 + R() * 30; if (R() < 0.5) p.line(x, y, x + l, y, '#2a7a3c'); else p.line(x, y, x, y + l, '#2a7a3c'); }
    for (let i = 0; i < 30; i++) p.px((R() * W) | 0, (R() * H) | 0, '#c8b060');
    return p;
  }
  function foam(p) { p.fill('#3a3a46'); for (let y = 0; y < H; y += 3) for (let x = (y % 6) ? 1 : 0; x < W; x += 3) p.px(x, y, '#4a4a58'); return p; }
  function crt(p, x, y, w, h, screen, body) { // beige CRT monitor; screen(x,y,w,h) draws the picture
    body = body || '#d8d0bc';
    p.obox(x, y, w, h, body); p.obox(x + 4, y + 3, w - 8, h - 10, '#303030');
    p.rect(x + 6, y + 5, w - 12, h - 14, '#000'); if (screen) screen(x + 6, y + 5, w - 12, h - 14);
    p.rect(x + w - 10, y + h - 5, 4, 2, '#555'); p.px(x + w - 13, y + h - 4, '#30e030');
    p.obox(x + w / 2 - 8, y + h, 16, 3, body); p.obox(x + w / 2 - 13, y + h + 2, 26, 3, body);
    return p;
  }
  function pins(p, x, y, n, dx, dy, c) { for (let i = 0; i < n; i++) p.rect(x + i * dx, y + i * dy, dx ? 1 : 2, dx ? 2 : 1, c || '#d8d8d8'); }
  function keyRow(p, x, y, n, kw, c, gap) { for (let i = 0; i < n; i++) { p.rect(x + i * (kw + (gap || 1)), y, kw, 3, c || '#f0ece0'); p.rect(x + i * (kw + (gap || 1)), y + 3, kw, 1, '#8a8676'); } }

  A.add({
    // ================================================================ PC hardware: processors
    cpu: { cap: 'A processor in its socket, with the heatsink and fan it needs to keep cool.', draw(p) {
      board(p, 2);
      // white ZIF socket with the chip in it
      p.obox(6, 14, 42, 42, '#e8e4d8'); for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) p.px(10 + i * 4, 18 + j * 4, '#b8b4a8');
      p.obox(10, 18, 34, 34, '#9a9aa8'); p.obox(17, 25, 20, 20, '#c8c8d0'); p.rect(19, 27, 16, 16, '#d8d8e0'); p.text(21, 33, 'CPU', '#203060');
      p.rect(48, 16, 3, 38, '#e8e4d8'); p.line(51, 16, 56, 10, '#e8e4d8');
      // the heatsink and fan, lifted off beside it
      p.obox(58, 14, 34, 40, '#a8b0b8'); for (let x = 61; x < 90; x += 4) p.rect(x, 15, 2, 38, '#d8e0e8');
      p.odisc(75, 34, 13, '#202020'); for (let a = 0; a < 6.28; a += 1.256) p.thick(75, 34, 75 + Math.cos(a) * 11, 34 + Math.sin(a) * 11, '#4a4a4a', 3); p.odisc(75, 34, 4, '#303030'); p.px(74, 33, '#888');
      p.line(84, 52, 92, 66, '#e01010'); p.line(85, 52, 93, 66, '#202020');
    } },
    megahertz: { cap: 'A CPU clock signal: a square wave that ticks millions of times every second.', draw(p) {
      S_lab(p);
      p.obox(8, 8, 80, 52, '#c8c4bc'); p.obox(12, 12, 56, 40, '#103010');
      for (let x = 14; x < 66; x += 8) for (let y = 14; y < 50; y += 2) p.px(x, y, '#1e4e1e');
      for (let y = 14; y < 50; y += 6) for (let x = 14; x < 66; x += 2) p.px(x, y, '#1e4e1e');
      let hi = true; for (let x = 14; x < 66; x += 6) { const y = hi ? 22 : 42; p.rect(x, y, 6, 1, '#40ff40'); p.rect(x + 6, 22, 1, 21, '#40ff40'); hi = !hi; }
      p.text(16, 46, '1,000,000/SEC', '#40ff40');
      p.odisc(78, 22, 6, '#555'); p.line(78, 22, 81, 18, '#fff'); p.odisc(78, 42, 6, '#555'); p.line(78, 42, 74, 39, '#fff');
      p.text(72, 52, 'MHZ', '#203060');
    } },
    intel_8086: { cap: 'An 8086 in its long white ceramic case, with 40 legs: 20 down each side.', draw(p) {
      foam(p);
      p.obox(6, 24, 84, 24, '#ece8dc'); p.rect(7, 25, 82, 2, '#fffef8');
      for (let i = 0; i < 20; i++) { p.rect(9 + i * 4, 19, 2, 5, '#d0d0d8'); p.rect(9 + i * 4, 48, 2, 5, '#d0d0d8'); p.px(9 + i * 4, 19, '#fff'); }
      p.obox(34, 29, 28, 14, '#d8b040'); p.rect(36, 31, 24, 1, '#f0d070');
      p.text(37, 34, '8086', '#5a4010'); p.disc(11, 36, 2, '#c8c4b8'); p.px(10, 35, '#a8a498');
      p.text(8, 60, '16-BIT, 1978', '#c8c8d8');
    } },
    i386: { cap: 'A 386: Intel\'s first 32-bit PC chip, a square ceramic slab with pins underneath.', draw(p) {
      board(p, 6);
      // 3/4 view: pins show along the near edges
      p.opoly([[20, 30], [56, 18], [80, 32], [44, 46]], '#b8b8c0');
      p.opoly([[20, 30], [44, 46], [44, 50], [20, 34]], '#8a8a94'); p.opoly([[44, 46], [80, 32], [80, 36], [44, 50]], '#76767e');
      for (let i = 0; i < 12; i++) { p.rect(22 + i * 2, 35 + i * 1.33, 1, 4, '#e0d070'); p.rect(46 + i * 2.8, 50 - i * 1.17, 1, 4, '#e0d070'); }
      p.opoly([[36, 30], [56, 23], [68, 31], [48, 38]], '#d8b850');
      p.text(44, 28, '386', '#5a4010');
      p.text(4, 4, '32-BIT!', '#ffd400'); p.text(4, 62, '16-33 MHZ', '#c8e8c8');
    } },
    i486: { cap: 'A 486DX2-66 with its little heatsink, and the PC\'s front panel showing 66 and the Turbo button.', draw(p) {
      p.vgrad(0, H, '#c9d3e8', '#a9b6d4');
      // PC front panel
      p.obox(4, 8, 40, 58, '#d8d0bc'); p.obox(8, 12, 32, 10, '#c8c0ac'); p.rect(10, 16, 28, 2, '#555');
      p.obox(10, 28, 18, 12, '#200000'); p.text(12, 31, '66', '#ff2020', 2);
      p.obox(30, 29, 9, 5, '#c8c0ac'); p.text(30, 36, 'TRB', '#555'); p.px(34, 41, '#30e030');
      p.obox(10, 46, 12, 6, '#c8c0ac'); p.text(9, 55, 'RESET', '#555');
      // the chip with a small black heatsink
      p.obox(52, 26, 38, 38, '#b8b8c0'); for (let i = 0; i < 9; i++) { p.px(54 + i * 4, 28, '#e0d070'); p.px(54 + i * 4, 61, '#e0d070'); }
      p.obox(58, 32, 26, 26, '#202020'); for (let x = 61; x < 82; x += 4) p.rect(x, 33, 2, 24, '#3a3a3a');
      p.text(56, 18, '486DX2', '#203060');
    } },
    pentium: { cap: 'A first Pentium: a white ceramic chip with a gold lid. Everyone expected it to be called the 586.', draw(p) {
      board(p, 8);
      p.obox(14, 10, 52, 52, '#ece8e0'); p.rect(15, 11, 50, 2, '#fffef8');
      p.obox(24, 20, 32, 32, '#d8b040'); p.rect(26, 22, 28, 1, '#f8e080'); p.rect(26, 22, 1, 28, '#f0d070');
      p.text(30, 32, '60MHZ', '#5a4010'); p.disc(19, 15, 1.5, '#c8c4b8');
      // the "586?" joke
      p.oell(80, 18, 14, 9, '#fff'); p.opoly([[70, 24], [74, 26], [66, 32]], '#fff'); p.rect(70, 24, 4, 2, '#fff'); p.text(70, 16, '586?', '#e01010');
      p.text(68, 58, '1993', '#ffd400');
    } },
    pentium_ii: { cap: 'A Pentium II: not a flat chip but a black cartridge that stands up in "Slot 1".', draw(p) {
      board(p, 10);
      p.obox(4, 56, 88, 8, '#6a4a2a'); p.rect(6, 59, 84, 2, '#2a1a0a');
      p.opoly([[12, 12], [82, 12], [86, 16], [86, 58], [12, 58]], '#1a1a20'); p.rect(13, 13, 70, 1, '#4a4a58');
      p.obox(20, 20, 34, 22, '#2a2a34'); p.opoly([[58, 20], [78, 20], [78, 36], [58, 36]], '#c8a838'); for (let i = 0; i < 4; i++) p.line(60 + i * 4, 34, 66 + i * 4, 22, '#f0e090');
      p.rect(22, 46, 50, 2, '#3a3a48'); p.text(22, 26, 'SLOT 1', '#8a8aa0'); p.text(22, 34, '300MHZ', '#8a8aa0');
    } },
    pentium_iii: { cap: 'A Pentium III cartridge with its big fan. Launched in February 1999 at 450 and 500 MHz.', draw(p) {
      board(p, 12);
      p.obox(2, 58, 92, 8, '#6a4a2a'); p.rect(4, 61, 88, 2, '#2a1a0a');
      // cartridge seen from the fan side
      p.obox(8, 6, 80, 52, '#202028'); p.obox(14, 10, 68, 44, '#b8c0c8'); for (let x = 17; x < 80; x += 4) p.rect(x, 11, 2, 42, '#e0e8f0');
      p.odisc(48, 32, 17, '#18181c'); for (let a = 0.3; a < 6.5; a += 0.9) p.thick(48, 32, 48 + Math.cos(a) * 15, 32 + Math.sin(a) * 15, '#3a3a44', 4); p.odisc(48, 32, 5, '#2a2a30'); p.px(47, 31, '#888');
      p.obox(66, 46, 20, 9, '#fff8e0'); p.text(67, 48, '500', '#203060');
    } },
    amd_k6: { cap: 'An AMD K6-2 about to drop into a flat "Socket 7", the cheaper way to build a fast PC.', draw(p) {
      board(p, 14);
      // the socket, lever up
      p.obox(6, 26, 44, 42, '#f0ece0'); for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) p.px(11 + i * 4.5, 31 + j * 4.5, '#a8a498');
      p.obox(50, 30, 4, 38, '#f0ece0'); p.thick(52, 30, 58, 16, '#f0ece0', 3); p.line(50, 30, 56, 15, '#000');
      // the chip above it, then an arrow
      p.obox(56, 4, 36, 36, '#8a8a96'); p.obox(61, 9, 26, 26, '#c8c8d0'); p.rect(62, 10, 24, 1, '#e8e8f0');
      p.text(67, 15, 'K6-2', '#203060'); p.text(62, 25, '400MHZ', '#203060'); p.px(58, 6, '#e8e8f0');
      p.thick(40, 12, 30, 20, '#ffd400', 3); p.opoly([[24, 18], [32, 24], [26, 26]], '#ffd400'); p.thick(52, 10, 40, 12, '#ffd400', 3);
    } },
    athlon: { cap: 'An AMD Athlon cartridge for "Slot A". In October 1999 it reached 700 MHz.', draw(p) {
      p.vgrad(0, H, '#ffe8b0', '#ffc070');
      // chequered flag background corner for the speed race
      for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) if ((i + j) % 2) p.rect(i * 4, j * 4, 4, 4, '#000'); else p.rect(i * 4, j * 4, 4, 4, '#fff');
      p.obox(8, 64, 62, 6, '#6a4a2a');
      p.opoly([[12, 18], [66, 18], [66, 64], [12, 64]], '#2a2c34'); p.obox(18, 24, 42, 30, '#9aa0a8'); p.rect(19, 25, 40, 2, '#c8ccd4');
      p.odisc(39, 39, 9, '#1a5a2a'); p.odisc(39, 39, 5, '#3a3a3a'); p.text(22, 56, 'SLOT A', '#c8c8d0');
      // a winner's cup
      p.opoly([[72, 20], [90, 20], [87, 36], [75, 36]], '#ffd400'); p.oell(81, 20, 9, 3, '#ffe060'); p.obox(79, 36, 4, 8, '#ffd400'); p.obox(74, 44, 14, 5, '#c89a00');
      p.text(73, 26, '700', '#7a5a00'); p.line(72, 22, 68, 28, '#c89a00'); p.line(90, 22, 94, 28, '#c89a00');
    } },
  });

  A.add({
    // ================================================================ PC hardware: memory, storage, cards
    ram: { cap: 'Memory modules: an older short SIMM and a newer, longer DIMM, each covered in black memory chips.', draw(p) {
      p.vgrad(0, H, '#c9d3e8', '#a9b6d4');
      const stick = (x, y, w, n, notch) => { p.obox(x, y, w, 18, '#1e6a32'); for (let i = 0; i < n; i++) p.obox(x + 3 + i * ((w - 6) / n), y + 3, (w - 6) / n - 2, 9, '#181818'); for (let i = x + 2; i < x + w - 2; i += 2) p.rect(i, y + 16, 1, 3, '#e0c050'); notch.forEach(nx => p.rect(x + nx, y + 15, 3, 4, '#a9b6d4')); };
      stick(14, 8, 52, 4, [24]); p.text(70, 14, 'SIMM', '#203060');
      stick(4, 40, 88, 8, [30, 60]); p.text(30, 62, 'DIMM 64MB', '#203060');
    } },
    bits_bytes: { cap: 'Eight bits make one byte. 01000001 is the code for the letter A.', draw(p) {
      p.vgrad(0, H, '#1a1040', '#3a2a80');
      const bits = '01000001';
      [...bits].forEach((b, i) => { const x = 6 + i * 11; p.obox(x, 10, 9, 14, b === '1' ? '#ffd400' : '#404058'); if (b === '1') p.disc(x + 4, 6, 2, '#fff3b0'); p.text(x + 3, 28, b, '#fff'); });
      p.rect(6, 36, 86, 1, '#9fd0ff'); p.text(30, 39, '1 BYTE', '#9fd0ff');
      p.thick(48, 48, 48, 54, '#fff', 2); p.opoly([[44, 54], [52, 54], [48, 58]], '#fff');
      p.text(42, 60, 'A', '#ffd400', 2);
      p.text(4, 64, '1 BIT', '#c8c8e8'); p.line(10, 62, 10, 32, '#c8c8e8');
    } },
    floppy_disk: { cap: 'An old bendy 5.25-inch floppy and the newer 3.5-inch disk in its hard case. It holds 1.44 MB.', draw(p, S) {
      S.room(p);
      // 5.25-inch behind
      p.obox(4, 4, 50, 50, '#1a1a1a'); p.odisc(29, 29, 8, '#3a3a2a'); p.disc(29, 29, 4, '#1a1a1a'); p.obox(26, 40, 6, 12, '#5a4a30'); p.obox(8, 6, 22, 8, '#f8f8f0'); p.rect(10, 9, 18, 1, '#2a7ad8');
      // 3.5-inch in front
      p.obox(40, 16, 48, 50, '#22324a'); p.obox(52, 17, 26, 17, '#c8ccd4'); p.rect(68, 19, 6, 12, '#22324a'); p.rect(53, 18, 24, 1, '#eef');
      p.obox(46, 38, 36, 26, '#f8f8f0'); p.rect(47, 39, 34, 3, '#e01010'); for (let y = 46; y < 62; y += 4) p.rect(49, y, 30, 1, '#9fb0d8');
      p.text(49, 48, '1.44MB', '#0028c8'); p.rect(42, 60, 3, 4, '#000'); p.rect(83, 60, 3, 4, '#000');
    } },
    cd_rom: { cap: 'A CD-ROM drive with its tray out. About 650 MB on one shiny disc.', draw(p, S) {
      S.room(p);
      p.obox(6, 14, 84, 22, '#d8d0bc'); p.rect(10, 18, 76, 1, '#a89c88');
      p.obox(66, 26, 8, 5, '#c8c0ac'); p.px(60, 28, '#30e030'); p.odisc(80, 28, 2, '#a8a090');
      // tray sliding out
      p.opoly([[14, 31], [58, 31], [64, 52], [8, 52]], '#2a2a2a'); p.opoly([[16, 33], [56, 33], [60, 50], [12, 50]], '#3a3a3a');
      p.oell(36, 41, 19, 8, '#d8dce8'); for (let a = 0; a < 6.28; a += 0.18) { if (Math.sin(a * 3) > 0.5) p.px(36 + Math.cos(a) * 13, 41 + Math.sin(a) * 5.5, `hsl(${(a * 120) % 360},80%,65%)`); }
      p.oell(36, 41, 5, 2, '#a0a8b8'); p.ell(36, 41, 2, 1, '#2a2a2a');
      p.text(70, 18, '32X', '#203060');
    } },
    hard_disk: { cap: 'Inside a hard disk: a spinning metal platter and the read/write head on its arm. Never open one!', draw(p) {
      p.vgrad(0, H, '#c9d3e8', '#a9b6d4');
      p.obox(8, 4, 80, 64, '#8a8a94'); p.rect(10, 6, 76, 60, '#a8a8b2');
      [[12, 8], [82, 8], [12, 62], [82, 62]].forEach(([x, y]) => p.odisc(x, y, 2, '#c8c8d0'));
      p.odisc(40, 35, 26, '#dfe3ee'); p.ring(40, 35, 20, '#c0c6d6'); p.ring(40, 35, 13, '#c0c6d6'); p.odisc(40, 35, 7, '#9a9aa4'); p.disc(40, 35, 3, '#6a6a74');
      p.line(24, 18, 32, 14, '#fff'); p.line(25, 20, 30, 17, '#fff');
      p.odisc(76, 56, 6, '#5a5a64'); p.thick(76, 56, 52, 26, '#4a4a54', 4); p.thick(76, 56, 52, 26, '#7a7a84', 2); p.obox(48, 22, 6, 6, '#3a3a44');
    } },
    modem: { cap: 'An external 56K modem plugged into the phone line. While it is online, nobody can use the phone.', draw(p, S) {
      S.room(p);
      p.obox(4, 30, 56, 18, '#d8d0bc'); p.rect(5, 31, 54, 2, '#f0e8d8');
      ['HS', 'AA', 'CD', 'OH', 'RD', 'SD', 'TR'].forEach((n, i) => { p.rect(8 + i * 7, 39, 3, 2, i === 1 || i === 4 ? '#ff2020' : '#30e030'); });
      p.text(8, 43, '56K', '#203060');
      // cable to a wall socket and a phone with its receiver off
      p.thick(60, 40, 76, 40, '#e8e8e0', 2); p.thick(76, 40, 76, 22, '#e8e8e0', 2); p.obox(72, 14, 10, 10, '#f0ece0'); p.rect(75, 18, 4, 2, '#555');
      p.opoly([[66, 50], [92, 50], [90, 64], [68, 64]], '#c01818'); p.odisc(79, 57, 4, '#e8e8e8');
      p.thick(64, 44, 78, 44, '#c01818', 3); p.odisc(62, 44, 3, '#c01818'); p.odisc(80, 44, 3, '#c01818');
      p.text(4, 6, 'BEE-KSSHH!', '#e01010');
    } },
    graphics_card: { cap: 'A graphics card. The blue socket on its metal bracket sends the picture to the monitor.', draw(p) {
      board(p, 16);
      p.obox(4, 10, 76, 40, '#1a6ac8'); p.rect(5, 11, 74, 1, '#4a9af8');
      p.obox(22, 18, 22, 22, '#2a2a34'); p.text(25, 27, 'VGA', '#9a9aa8');
      for (let i = 0; i < 4; i++) p.obox(50 + (i % 2) * 13, 16 + ((i / 2) | 0) * 14, 11, 10, '#181818');
      for (let i = 6; i < 76; i += 2) p.rect(i, 50, 1, 5, '#e0c050'); p.rect(30, 50, 3, 5, '#1a5a2a');
      p.obox(80, 4, 10, 60, '#c8c8d0'); p.obox(81, 18, 8, 14, '#2050c0'); for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) p.px(83 + i * 3, 21 + j * 4, '#000');
    } },
    voodoo: { cap: 'A 3-D card: it draws the game world, while a short cable at the back joins it to the normal graphics card.', draw(p) {
      p.vgrad(0, H, '#101020', '#202048');
      // the 3-D scene it makes
      p.obox(50, 4, 42, 30, '#000'); for (let y = 5; y < 18; y++) p.rect(51, y, 40, 1, `rgb(${32 + y * 3},${48 + y * 4},${112 + y * 5})`);
      p.poly([[51, 33], [71, 18], [91, 33]], '#3a7a2a'); for (let i = 0; i < 5; i++) p.line(71, 18, 51 + i * 10, 33, '#5a9a3a'); p.poly([[66, 14], [70, 6], [74, 14]], '#e8e8f0');
            // the card
      p.obox(4, 36, 70, 26, '#1a5a2a'); p.obox(14, 41, 18, 16, '#c8c8d0'); p.obox(36, 41, 18, 16, '#c8c8d0'); for (let i = 0; i < 4; i++) p.obox(58, 39 + i * 5, 12, 4, '#181818');
      for (let i = 6; i < 72; i += 2) p.rect(i, 62, 1, 4, '#e0c050');
      p.obox(74, 34, 8, 34, '#c8c8d0'); p.obox(75, 40, 6, 8, '#203070'); p.obox(75, 52, 6, 8, '#203070');
      p.thick(82, 44, 92, 44, '#202020', 2); p.thick(92, 44, 92, 58, '#202020', 2); p.thick(82, 56, 92, 58, '#202020', 2);
      p.text(4, 28, '3D!', '#ffd400', 2);
    } },
    sound_card: { cap: 'A sound card with jacks for speakers and a microphone, plus a joystick port. BEEP no more!', draw(p) {
      board(p, 18);
      p.obox(4, 14, 62, 34, '#1e6a32'); p.obox(12, 20, 16, 16, '#181818'); p.obox(32, 22, 10, 10, '#181818'); p.odisc(52, 28, 5, '#2a7ad8'); p.text(12, 39, 'FM', '#c8e8c8');
      for (let i = 6; i < 64; i += 2) p.rect(i, 48, 1, 4, '#e0c050');
      p.obox(66, 6, 8, 52, '#c8c8d0'); [14, 22, 30].forEach((y, i) => p.odisc(70, y, 2, ['#30c030', '#ff8ac0', '#2a7ad8'][i])); p.obox(67, 38, 6, 14, '#ffd400');
      // a speaker
      p.obox(78, 34, 16, 30, '#2a2a2a'); p.odisc(86, 44, 5, '#4a4a4a'); p.odisc(86, 57, 3, '#4a4a4a');
      for (let i = 0; i < 3; i++) p.ring(86, 26 - i * 3, 3 + i * 2, '#ffd400');
    } },
    mouse: { cap: 'A ball mouse and the rubber ball from its tummy. Clean the rollers when the pointer starts jumping.', draw(p, S) {
      S.room(p);
      p.oell(36, 34, 22, 28, '#e8e2d0'); p.ell(32, 30, 16, 22, '#f4f0e4');
      p.line(14, 26, 58, 26, '#a89c88'); p.line(36, 6, 36, 26, '#a89c88');
      p.thick(36, 6, 40, 2, '#555', 2); p.thick(40, 2, 60, 1, '#555', 2);
      // the escaped ball
      p.odisc(76, 54, 9, '#4a4a54'); p.disc(73, 51, 3, '#8a8a94'); p.px(72, 50, '#c8c8d0');
      p.line(64, 62, 70, 62, '#7a5228'); p.line(60, 64, 66, 64, '#7a5228');
    } },
  });
  A.add({
    qwerty: { cap: 'The top row of letters starts Q-W-E-R-T-Y: a layout first made for typewriters in the 1870s.', draw(p) {
      p.vgrad(0, H, '#d8d0bc', '#b8b09c');
      const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
      rows.forEach((r, j) => [...r].forEach((ch, i) => { const x = 3 + j * 4 + i * 9, y = 8 + j * 19; const hl = j === 0 && i < 6; p.obox(x, y, 9, 16, hl ? '#ffe060' : '#f4f0e4'); p.rect(x + 1, y + 13, 7, 2, hl ? '#c8a020' : '#b8b4a4'); p.text(x + 3, y + 4, ch, '#202020'); }));
    } },
    crt_monitor: { cap: 'Inside a CRT monitor: the electron gun at the back fires beams that make red, green and blue dots glow.', draw(p) {
      p.vgrad(0, H, '#1a1a2a', '#2a2a40');
      // side view of the glass tube
      p.opoly([[8, 6], [20, 6], [20, 66], [8, 66]], '#7090c0');
      p.opoly([[20, 6], [62, 26], [86, 30], [86, 42], [62, 46], [20, 66]], 'rgba(160,200,255,0.25)', '#9fc0e8');
      p.obox(84, 30, 8, 12, '#808080'); p.obox(88, 32, 6, 8, '#a0a0a0');
      p.thick(84, 33, 20, 18, '#ff3030', 1); p.thick(84, 36, 20, 36, '#30ff30', 1); p.thick(84, 39, 20, 54, '#3080ff', 1);
      p.odisc(62, 36, 5, '#c08030'); p.text(52, 50, 'MAGNETS', '#ffd400');
      for (let y = 8; y < 66; y += 3) for (let x = 9; x < 19; x += 3) { const c = ['#ff3030', '#30ff30', '#3080ff'][((x + y) / 3 | 0) % 3]; p.px(x, y, c); }
      p.text(24, 4, 'SCREEN', '#c8d8ff'); p.text(66, 58, 'GUN', '#c8d8ff'); p.line(78, 56, 86, 42, '#c8d8ff');
    } },
    dvd: { cap: 'A DVD and its tall case. It is the same size as a CD but holds 4.7 GB: enough for a whole film.', draw(p, S) {
      S.carpet(p);
      p.obox(6, 6, 38, 58, '#101018'); p.obox(9, 9, 32, 52, '#203070'); p.rect(10, 10, 30, 2, '#4060b0');
      p.obox(14, 18, 22, 16, '#111'); for (let i = 0; i < 5; i++) p.rect(15 + i * 4, 19, 2, 3, '#fff'); p.text(13, 40, 'THE', '#ffd400'); p.text(13, 47, 'FILM', '#ffd400');
      p.odisc(68, 36, 24, '#c8c8d8'); for (let a = 0; a < 6.28; a += 0.06) { const r = 8 + ((a * 37) % 14); if (Math.sin(a * 4) > 0.3) p.px(68 + Math.cos(a) * r, 36 + Math.sin(a) * r, `hsl(${(250 + a * 40) % 360},70%,70%)`); }
      p.odisc(68, 36, 7, '#e8e8f0'); p.disc(68, 36, 3, '#8a2a3a'); p.line(54, 22, 60, 18, '#fff'); p.text(54, 64, '4.7 GB', '#fff');
    } },
    usb: { cap: 'A flat USB plug on a mouse cable, about to go into its socket. No need to restart the PC!', draw(p, S) {
      S.room(p);
      // the back of a PC with two USB sockets
      p.obox(56, 4, 38, 44, '#d8d0bc'); p.obox(62, 12, 20, 7, '#909090'); p.rect(64, 14, 16, 3, '#202020'); p.rect(64, 14, 16, 1, '#e0e0e0');
      p.obox(62, 24, 20, 7, '#909090'); p.rect(64, 26, 16, 3, '#202020'); p.rect(64, 26, 16, 1, '#e0e0e0');
      // the plug
      p.obox(26, 10, 22, 11, '#c8ccd4'); p.rect(28, 13, 18, 4, '#f0f0f0'); p.rect(31, 14, 3, 2, '#808080'); p.rect(40, 14, 3, 2, '#808080');
      p.obox(10, 8, 18, 15, '#303038'); p.thick(10, 16, 4, 30, '#303038', 3); p.thick(4, 30, 6, 52, '#303038', 3);
      p.thick(50, 15, 56, 15, '#ffd400', 1); p.opoly([[54, 12], [58, 15], [54, 18]], '#ffd400');
      p.oell(18, 58, 14, 9, '#e8e2d0'); p.line(18, 49, 18, 58, '#a89c88'); p.line(5, 56, 31, 56, '#a89c88');
    } },
    zip_drive: { cap: 'A Zip drive with a chunky Zip disk going in. One disk holds 100 MB, as much as about 70 floppies.', draw(p, S) {
      S.room(p);
      p.opoly([[8, 22], [78, 22], [86, 30], [86, 60], [8, 60]], '#1c3a8a'); p.rect(9, 23, 69, 2, '#3a5ab8');
      p.obox(16, 34, 50, 6, '#0a1a4a'); p.odisc(76, 50, 3, '#3a5ab8'); p.px(76, 40, '#30e030');
      for (let i = 0; i < 5; i++) p.rect(20 + i * 10, 48, 6, 3, '#2a4aa0');
      // the disk sticking out
      p.obox(22, 8, 38, 30, '#14286a'); p.obox(28, 10, 26, 10, '#e8e8f0'); p.text(30, 13, '100MB', '#14286a'); p.rect(25, 24, 10, 8, '#283c84');
    } },
    bios: { cap: 'The BIOS chip with its label, and the coin battery that remembers the settings. It runs the start-up check.', draw(p) {
      board(p, 20);
      p.obox(6, 24, 30, 42, '#181818'); for (let i = 0; i < 9; i++) { p.rect(3, 27 + i * 4, 3, 2, '#d0d0d8'); p.rect(36, 27 + i * 4, 3, 2, '#d0d0d8'); }
      p.obox(9, 30, 24, 24, '#fff8e0'); p.text(12, 34, 'BIOS', '#203060'); p.text(11, 42, '(C)98', '#203060'); p.rect(12, 49, 18, 1, '#e01010');
      p.odisc(48, 56, 9, '#c8c8d0'); p.disc(46, 54, 4, '#e8e8f0'); p.text(42, 54, '+', '#555');
      // the POST screen
      p.obox(44, 4, 48, 34, '#000'); p.text(47, 7, 'BIOS 1998', '#c0c0c0'); p.text(47, 14, '65536K OK', '#fff'); p.text(47, 21, 'HDD...OK', '#c0c0c0'); p.text(47, 29, 'BEEP!', '#ffd400');
    } },
    expansion_slots: { cap: 'Expansion slots on a motherboard: long black ISA, white PCI, and one brown AGP slot for the graphics card.', draw(p) {
      board(p, 22);
      const slot = (y, x, w, c, lab, tc) => { p.obox(x, y, w, 7, c); p.rect(x + 2, y + 3, w - 4, 1, '#000'); p.text(4, y + 1, lab, tc || '#fff'); };
      slot(6, 24, 66, '#7a5a3a', 'AGP', '#ffd080');
      slot(20, 24, 54, '#f0ece0', 'PCI'); slot(31, 24, 54, '#f0ece0', 'PCI'); slot(42, 24, 54, '#f0ece0', 'PCI');
      slot(55, 18, 74, '#202020', 'ISA');
      p.rect(48, 21, 2, 6, '#1a5a2a'); p.rect(48, 32, 2, 6, '#1a5a2a'); p.rect(48, 43, 2, 6, '#1a5a2a'); p.rect(70, 56, 2, 6, '#1a5a2a');
    } },
    printer: { cap: 'A noisy dot matrix printer with its holey paper, and a colour inkjet that has run out of one colour.', draw(p, S) {
      S.room(p);
      // dot matrix with tractor-feed paper
      p.obox(4, 30, 42, 18, '#d8d0bc'); p.rect(8, 34, 34, 3, '#303030'); p.obox(4, 46, 42, 4, '#b8b09c');
      p.obox(10, 8, 30, 24, '#fff'); for (let y = 10; y < 30; y += 3) { p.px(12, y, '#888'); p.px(37, y, '#888'); } for (let y = 12; y < 30; y += 3) p.rect(15, y, 18, 1, '#555');
      // inkjet
      p.obox(52, 34, 40, 16, '#e8e4dc'); p.rect(56, 38, 32, 3, '#303030');
      p.obox(58, 14, 28, 22, '#fff'); p.rect(61, 18, 10, 8, '#e01080'); p.rect(72, 18, 10, 8, '#f0e000'); p.rect(61, 28, 22, 2, '#d080a0');
      p.text(54, 54, 'NO CYAN!', '#e01010');
    } },
    jacquard_loom: { cap: 'A Jacquard loom: the chain of punched cards on top tells it which threads to lift, so it weaves the pattern.', draw(p) {
      p.vgrad(0, H, '#e8d8b0', '#c8b088');
      p.obox(8, 18, 6, 50, '#7a4a1a'); p.obox(78, 18, 6, 50, '#7a4a1a'); p.obox(8, 14, 76, 6, '#8a5a2a');
      // chain of cards draping over the top
      for (let i = 0; i < 11; i++) { const x = 22 + i * 5, y = 2 + Math.abs(i - 5) * 1.2; p.obox(x, y, 6, 12, '#f0e0b0'); p.px(x + 2, y + 3, '#000'); if (i % 2) p.px(x + 3, y + 7, '#000'); else p.px(x + 2, y + 9, '#000'); }
      for (let x = 18; x < 76; x += 3) p.line(x, 20, x, 48, '#f8f0e0');
      p.obox(16, 48, 62, 14, '#c01818'); for (let x = 18; x < 76; x += 8) for (let y = 50; y < 60; y += 6) { p.rect(x, y, 4, 3, '#ffd400'); p.rect(x + 4, y + 3, 4, 3, '#1a3a9a'); }
      p.obox(14, 62, 66, 4, '#8a5a2a');
    } },
    babbage: { cap: 'Babbage\'s Difference Engine: columns of brass number wheels, turned by a handle, to work out tables of numbers.', draw(p) {
      p.vgrad(0, H, '#3a2a20', '#5a4030');
      p.obox(6, 6, 74, 6, '#8a6a3a'); p.obox(6, 60, 74, 6, '#8a6a3a');
      for (let c = 0; c < 6; c++) { const x = 12 + c * 11; p.rect(x + 3, 12, 2, 48, '#c8c8d0'); for (let r = 0; r < 6; r++) { const y = 14 + r * 8; p.oell(x + 4, y + 2, 5, 3, '#d8a840'); p.rect(x, y + 1, 9, 1, '#f8d870'); p.text(x + 3, y, String((c * 3 + r * 7) % 10), '#3a2010'); } }
      p.obox(80, 30, 4, 4, '#555'); p.thick(84, 32, 90, 20, '#888', 2); p.odisc(91, 18, 3, '#7a4a1a');
    } },
  });
  A.add({
    // ================================================================ History of computing
    hollerith: { cap: 'Hollerith\'s tabulator: press a punched card into the reader and the dials count up the answers.', draw(p) {
      p.vgrad(0, H, '#e8d8b8', '#c8b090');
      p.obox(4, 4, 88, 32, '#6a3a18'); for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) { const x = 13 + i * 14, y = 13 + j * 14; p.odisc(x, y, 5, '#f8f4e8'); p.line(x, y, x + Math.cos(i + j * 3) * 4, y + Math.sin(i + j * 3) * 4, '#000'); p.px(x, y, '#c01010'); }
      p.obox(2, 40, 92, 6, '#8a5a2a'); p.obox(8, 46, 6, 24, '#6a3a18'); p.obox(82, 46, 6, 24, '#6a3a18');
      // card reader press on the desk
      p.obox(50, 30, 26, 12, '#3a3a3a'); p.obox(52, 26, 22, 5, '#5a5a5a'); p.thick(74, 28, 88, 18, '#2a2a2a', 2); p.odisc(89, 17, 2, '#c01010');
      p.opoly([[22, 36], [44, 36], [46, 42], [20, 42]], '#f0e0b0'); for (let i = 0; i < 6; i++) p.px(24 + i * 3.5, 38 + (i % 2) * 2, '#000');
    } },
    alan_turing: { cap: 'A "Turing machine", Alan Turing\'s 1936 idea: a head that reads and writes symbols on a long tape.', draw(p) {
      p.vgrad(0, H, '#fff8e0', '#e8dcb8');
      for (let i = 0; i < 12; i++) { const x = -2 + i * 9; p.obox(x, 44, 10, 12, '#ffffff', '#3a3a3a'); p.text(x + 4, 48, '1001011010110'[i] || '0', '#203060'); }
      p.text(2, 60, '...', '#555'); p.text(84, 60, '...', '#555');
      // read/write head
      p.obox(38, 14, 22, 18, '#c01818'); p.rect(39, 15, 20, 2, '#f04848'); p.text(42, 20, 'Q3', '#fff');
      p.opoly([[44, 32], [54, 32], [49, 42]], '#c01818'); p.thick(49, 42, 49, 43, '#000', 1);
      p.thick(64, 22, 80, 22, '#203060', 1); p.opoly([[80, 19], [85, 22], [80, 25]], '#203060'); p.thick(34, 22, 18, 22, '#203060', 1); p.opoly([[18, 19], [13, 22], [18, 25]], '#203060');
      p.text(8, 4, 'READ, WRITE, MOVE', '#203060');
    } },
    colossus: { cap: 'Colossus at Bletchley Park: racks of glowing valves, reading a loop of coded paper tape at high speed.', draw(p) {
      p.vgrad(0, H, '#3a3a34', '#2a2a24');
      for (let r = 0; r < 3; r++) { const x = 4 + r * 22; p.obox(x, 6, 20, 60, '#6a7064'); for (let j = 0; j < 7; j++) for (let i = 0; i < 4; i++) { const vx = x + 3 + i * 4, vy = 9 + j * 8; p.rect(vx, vy, 3, 6, '#8a8a7a'); p.rect(vx + 1, vy + 2, 1, 3, '#ff9020'); } }
      // the tape "bedstead": a loop of punched paper tape running round pulleys
      p.obox(70, 50, 24, 16, '#5a5a50'); p.rect(72, 8, 2, 44, '#5a5a50'); p.rect(90, 8, 2, 44, '#5a5a50');
      for (let t = 0; t < 6.28; t += 0.03) { const x = 82 + Math.cos(t) * 8, y = 28 + Math.sin(t) * 19; p.rect(x - 1, y - 1, 3, 3, '#f8f0d8'); }
      for (let t = 0; t < 6.28; t += 0.35) p.px(82 + Math.cos(t) * 8, 28 + Math.sin(t) * 19, '#555');
      p.odisc(82, 9, 3, '#9a9a90'); p.odisc(82, 47, 3, '#9a9a90');
      p.text(74, 56, '1944', '#ffd400');
    } },
    eniac: { cap: 'ENIAC filled a whole room. Its programmers set it up by plugging in cables and flicking switches.', draw(p) {
      p.vgrad(0, H, '#d8d4c4', '#b8b4a4'); p.rect(0, 60, W, 12, '#7a7468');
      for (let i = 0; i < 5; i++) { const x = 2 + i * 19; p.obox(x, 4, 18, 56, '#2a2a2a'); for (let j = 0; j < 5; j++) for (let k = 0; k < 4; k++) p.px(x + 3 + k * 4, 8 + j * 4, j === 2 ? '#ff4040' : '#f0f0f0'); p.obox(x + 2, 30, 14, 20, '#4a4a4a'); for (let k = 0; k < 9; k++) p.px(x + 4 + (k % 3) * 4, 33 + ((k / 3) | 0) * 5, '#c0c0c0'); }
      p.thick(10, 40, 30, 46, '#202020', 1); p.thick(30, 46, 48, 38, '#c01010', 1); p.thick(48, 38, 68, 44, '#202020', 1);
      // an operator plugging a cable
      p.odisc(80, 30, 4, '#3a2a1a'); p.disc(80, 32, 3, '#e8c09a'); p.opoly([[74, 36], [86, 36], [88, 60], [72, 60]], '#3a5a8a'); p.thick(76, 40, 70, 44, '#e8c09a', 2);
    } },
    transistor: { cap: 'A transistor, a tiny switch with no moving parts, next to the big hot glass valve it replaced.', draw(p) {
      p.vgrad(0, H, '#d8e8f0', '#b0c8d8');
      // valve
      p.oell(24, 24, 12, 18, '#e0ecf4'); p.rect(14, 24, 20, 20, '#e0ecf4'); p.line(12, 24, 12, 44, '#000'); p.line(36, 24, 36, 44, '#000');
      p.obox(18, 22, 12, 20, '#808080'); p.rect(23, 26, 2, 12, '#ff8020'); p.obox(12, 44, 25, 10, '#2a2a2a'); for (let i = 0; i < 4; i++) p.rect(15 + i * 5, 54, 2, 8, '#c8c8c8');
      p.text(14, 64, 'VALVE', '#203060');
      // transistor, bigger than life
      p.oell(66, 18, 12, 5, '#202020'); p.obox(54, 18, 25, 18, '#202020'); p.rect(56, 20, 2, 14, '#404040'); p.rect(54, 18, 25, 1, '#202020');
      [58, 65, 72].forEach((x, i) => { p.rect(x, 36, 2, 24, '#c8c8c8'); p.text(x - 1, 63, 'EBC'[i], '#203060'); });
    } },
    integrated_circuit: { cap: 'A silicon wafer covered in tiny chips, and one finished microchip in its black case with metal legs.', draw(p) {
      p.vgrad(0, H, '#1a1a30', '#30304a');
      p.odisc(30, 36, 27, '#a8a8c0'); for (let y = 12; y < 62; y += 6) for (let x = 6; x < 56; x += 6) { const dx = x + 2.5 - 30, dy = y + 2.5 - 36; if (dx * dx + dy * dy < 22 * 22) { p.rect(x, y, 5, 5, ((x + y) % 4) ? '#7a8ab8' : '#c87ab8'); p.px(x + 1, y + 1, '#d8e0ff'); } }
      p.rect(28, 8, 4, 3, '#1a1a30');
      p.obox(64, 26, 26, 18, '#181818'); for (let i = 0; i < 6; i++) { p.rect(66 + i * 4, 22, 2, 4, '#d0d0d8'); p.rect(66 + i * 4, 44, 2, 4, '#d0d0d8'); } p.disc(67, 29, 1, '#444');
      p.text(66, 54, 'CHIP', '#ffd400');
    } },
    computer_bug: { cap: 'The famous moth found in the Harvard Mark II in September 1947, taped into the team\'s logbook.', draw(p, S) {
      S.paper(p);
      for (let y = 8; y < 70; y += 6) p.rect(0, y, W, 1, '#c8d0e8'); p.rect(12, 0, 1, H, '#e8a0a0');
      p.text(16, 4, '9/9 1545 RELAY #70', '#2a2a6a'); p.text(16, 54, 'FIRST ACTUAL CASE', '#2a2a6a'); p.text(16, 61, 'OF BUG BEING FOUND', '#2a2a6a');
      p.rect(34, 18, 30, 8, 'rgba(240,240,200,.8)'); p.rect(34, 38, 30, 8, 'rgba(240,240,200,.8)');
      p.opoly([[48, 22], [30, 14], [26, 30], [46, 32]], '#8a7a6a'); p.opoly([[50, 22], [68, 14], [72, 30], [52, 32]], '#8a7a6a');
      p.oell(49, 30, 3, 12, '#4a3a2a'); p.line(48, 18, 44, 12, '#4a3a2a'); p.line(50, 18, 54, 12, '#4a3a2a');
      p.line(34, 20, 44, 26, '#6a5a4a'); p.line(64, 20, 54, 26, '#6a5a4a');
    } },
    basic_language: { cap: 'A two-line BASIC program on a home computer: it prints HELLO for ever (or until you press Break).', draw(p) {
      p.fill('#3a3aa0'); p.obox(6, 4, 84, 64, '#000080', '#202060');
      p.text(10, 8, '10 PRINT "HELLO"', '#c8c8ff'); p.text(10, 15, '20 GOTO 10', '#c8c8ff'); p.text(10, 22, 'RUN', '#c8c8ff');
      for (let i = 0; i < 6; i++) p.text(10, 30 + i * 6, 'HELLO', '#fff');
      p.rect(32, 60, 4, 5, '#c8c8ff');
    } },
    spacewar: { cap: 'Spacewar! (1962) on its round screen: the needle and the wedge fight around a star, pulled by its gravity.', draw(p) {
      p.fill('#3a3a40'); p.odisc(48, 36, 33, '#0a140a'); p.ring(48, 36, 33, '#202020', 2);
      const R = A.rng(62); for (let i = 0; i < 40; i++) { const a = R() * 6.28, r = R() * 30; p.px(48 + Math.cos(a) * r, 36 + Math.sin(a) * r, '#80c080'); }
      p.disc(48, 36, 2, '#e0ffe0'); [[0, 4], [4, 0], [0, -4], [-4, 0]].forEach(([x, y]) => p.line(48, 36, 48 + x, 36 + y, '#c0ffc0'));
      p.thick(22, 22, 32, 18, '#c0ffc0', 1); p.px(20, 23, '#80ff80'); // the needle
      p.opoly([[66, 48], [76, 52], [66, 56]], '#c0ffc0'); p.px(64, 52, '#ffff80'); p.px(62, 52, '#ffff80'); // the wedge
      for (let i = 0; i < 4; i++) p.px(36 + i * 4, 20 - i, '#ffffff');
    } },
    moores_law: { cap: 'Moore\'s Law: the number of transistors on a chip keeps doubling, about every two years.', draw(p) {
      p.vgrad(0, H, '#fff8e0', '#f0e4c0');
      p.line(10, 6, 10, 62, '#203060'); p.line(10, 62, 92, 62, '#203060');
      const yrs = ['71', '78', '85', '89', '93', '97', '99']; const hts = [3, 8, 16, 24, 32, 42, 50];
      yrs.forEach((y, i) => { const x = 14 + i * 11; p.obox(x, 62 - hts[i], 8, hts[i], i === 6 ? '#e01010' : '#2a7ad8'); p.text(x, 64, y, '#203060'); });
      p.thick(18, 58, 88, 8, '#ffd400', 1); p.text(14, 4, 'TRANSISTORS', '#203060');
    } },
  });
  function bslash(p, x, y, c) { for (let i = 0; i < 5; i++) p.px(x + (i * 2 / 4 | 0), y + i, c); }
  function homeComp(p, x, y, w, h, body, top, keyC, rows, kw) { // a wedge-shaped home computer with built-in keyboard
    p.opoly([[x + 4, y], [x + w - 4, y], [x + w, y + h], [x, y + h]], body); p.rect(x + 5, y + 1, w - 10, 1, p.shade(body, 0.3));
    if (top) p.rect(x + 3, y + 2, w - 6, 3, top);
    for (let r = 0; r < rows; r++) keyRow(p, x + 5 + r * 2, y + 7 + r * 5, Math.floor((w - 12 - r * 4) / (kw + 1)), kw, keyC);
  }
  A.add({
    intel_4004: { cap: 'The Intel 4004 (1971), the first microprocessor on sale, and the kind of desk calculator it was made for.', draw(p) {
      p.vgrad(0, H, '#c9d3e8', '#a9b6d4'); p.rect(0, 52, W, 20, '#a0703a');
      // printing calculator
      p.opoly([[50, 20], [92, 20], [94, 60], [48, 60]], '#e8e0cc'); p.obox(54, 10, 34, 12, '#fff'); p.rect(56, 13, 30, 1, '#888'); p.rect(56, 16, 22, 1, '#888');
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) p.obox(55 + i * 8, 28 + j * 7, 7, 6, i === 3 ? '#e07020' : '#5a5a5a');
      // the chip
      p.obox(8, 40, 34, 14, '#ece8dc'); for (let i = 0; i < 8; i++) { p.rect(10 + i * 4, 36, 2, 4, '#d0d0d8'); p.rect(10 + i * 4, 54, 2, 4, '#d0d0d8'); }
      p.obox(16, 43, 18, 8, '#c8a040'); p.text(17, 45, '4004', '#5a4010'); p.text(10, 22, '4-BIT', '#203060'); p.text(10, 29, '1971', '#e01010');
    } },
    altair_8800: { cap: 'The Altair 8800 (1975): no keyboard, no screen, just switches to flick and little red lights that blink.', draw(p, S) {
      S.room(p);
      p.obox(4, 14, 88, 40, '#2a5ab0'); p.rect(5, 15, 86, 2, '#5a8ae0'); p.obox(6, 22, 84, 30, '#202024');
      for (let i = 0; i < 16; i++) p.rect(10 + i * 5, 26, 2, 2, (i * 7) % 3 ? '#ff2020' : '#601010');
      for (let i = 0; i < 16; i++) p.rect(10 + i * 5, 32, 2, 2, (i * 5) % 4 ? '#601010' : '#ff2020');
      for (let i = 0; i < 16; i++) { p.rect(10 + i * 5, 40, 2, 6, '#d8d8e0'); p.px(10 + i * 5, i % 3 ? 40 : 45, '#fff'); }
      p.text(8, 4, 'NO SCREEN?!', '#e01010');
    } },
    apple_ii: { cap: 'An Apple II (1977): a ready-built computer with the keyboard in the case and colour graphics on screen.', draw(p, S) {
      S.room(p);
      crt(p, 22, 2, 52, 34, (x, y, w, h) => { p.rect(x, y, w, h, '#000'); p.rect(x + 3, y + h - 6, w - 6, 3, '#20c020'); p.rect(x + 10, y + 5, 8, 8, '#c040e0'); p.rect(x + 22, y + 8, 6, 10, '#20c020'); p.rect(x + 30, y + 4, 6, 6, '#f08020'); p.rect(x + 18, y + 12, 3, 3, '#ffffff'); }, '#e0d8b8');
      homeComp(p, 10, 44, 76, 22, '#e0d8b8', null, '#5a4a3a', 3, 5);
    } },
    ibm_pc: { cap: 'The IBM PC of 1981: a beige box with two floppy drives, a separate keyboard and a green-screen monitor.', draw(p, S) {
      S.room(p);
      p.obox(4, 30, 70, 22, '#e0dccc'); p.obox(40, 34, 30, 7, '#c8c4b4'); p.rect(42, 37, 26, 1, '#222'); p.obox(40, 43, 30, 7, '#c8c4b4'); p.rect(42, 46, 26, 1, '#222'); p.obox(8, 46, 14, 3, '#3a5aa0');
      crt(p, 10, 2, 50, 26, (x, y, w, h) => { p.rect(x, y, w, h, '#002000'); p.text(x + 2, y + 2, 'A>DIR', '#30ff30'); p.text(x + 2, y + 9, 'A>_', '#30ff30'); }, '#e0dccc');
      p.opoly([[50, 58], [94, 58], [96, 70], [48, 70]], '#e0dccc'); keyRow(p, 52, 60, 10, 3, '#a8a494'); keyRow(p, 52, 65, 10, 3, '#a8a494');
    } },
    ms_dos: { cap: 'MS-DOS: no mouse and no windows, just a C:\\> prompt waiting for you to type a command.', draw(p) {
      p.fill('#000');
      const line = (y, s, c) => { p.text(4, y, 'C:', c || '#c0c0c0'); bslash(p, 12, y, c || '#c0c0c0'); p.text(16, y, '>' + s, c || '#c0c0c0'); };
      line(4, 'DIR');
      p.text(4, 12, 'GAMES    <DIR>', '#c0c0c0'); p.text(4, 19, 'JACKOS  <DIR>', '#c0c0c0'); p.text(4, 26, 'AUTOEXEC BAT', '#c0c0c0'); p.text(4, 33, 'DOOM     EXE', '#c0c0c0');
      p.text(4, 42, '4 FILE(S)', '#c0c0c0'); line(52, 'CD GAMES'); line(62, '', '#ffffff'); p.rect(24, 62, 4, 5, '#c0c0c0');
    } },
    bbc_micro: { cap: 'A BBC Micro (1981): cream case, black keys and a row of red function keys. It was in most British schools.', draw(p, S) {
      S.room(p);
      crt(p, 26, 2, 44, 28, (x, y, w, h) => { p.text(x + 2, y + 2, 'BASIC', '#fff'); p.text(x + 2, y + 9, '>RUN', '#fff'); p.rect(x + 2, y + 15, 3, 4, '#fff'); }, '#d8d0bc');
      p.opoly([[4, 38], [92, 38], [94, 66], [2, 66]], '#e8dfc8'); p.rect(4, 39, 88, 2, '#fff8e8');
      keyRow(p, 10, 42, 10, 6, '#d02020');
      for (let r = 0; r < 3; r++) keyRow(p, 8 + r * 2, 48 + r * 5, 12, 5, '#202020');
    } },
    zx_spectrum: { cap: 'A ZX Spectrum (1982): small, black, with squidgy rubber keys and a rainbow stripe in the corner.', draw(p, S) {
      S.room(p);
      p.opoly([[8, 16], [88, 16], [92, 56], [4, 56]], '#1a1a1a'); p.rect(9, 17, 78, 1, '#4a4a4a');
      for (let r = 0; r < 4; r++) for (let i = 0; i < 10; i++) p.obox(12 + r * 2 + i * 7, 21 + r * 7, 6, 5, '#8a8a90');
      ['#e01010', '#f0a000', '#f0e000', '#20c020', '#00b0e0'].forEach((c, i) => p.thick(70 + i * 3, 56, 86 + i * 3, 46, c, 2));
      p.rect(4, 56, 88, 3, '#0a0a0a');
      // a cassette for the games
      p.obox(24, 60, 26, 10, '#303030'); p.rect(28, 62, 18, 4, '#f0f0f0'); p.disc(32, 64, 1, '#303030'); p.disc(42, 64, 1, '#303030');
    } },
    commodore_64: { cap: 'A Commodore 64 (1982), the brown "breadbin" with 64 KB of memory and a famous sound chip.', draw(p, S) {
      S.room(p);
      p.opoly([[8, 22], [88, 22], [94, 58], [2, 58]], '#9a8a6a'); p.rect(9, 23, 78, 2, '#b8aa8a'); p.rect(4, 56, 88, 4, '#7a6a4a');
      for (let r = 0; r < 4; r++) keyRow(p, 10 + r * 2, 27 + r * 6, 10, 5, '#5a4a32');
      for (let i = 0; i < 4; i++) p.obox(80, 27 + i * 6, 8, 5, '#c8c0a8');
      p.px(14, 24, '#ff3030'); p.text(10, 6, '64 KB', '#203060');
    } },
    macintosh: { cap: 'The first Macintosh (1984): screen and computer in one beige box, with a mouse and windows and icons.', draw(p, S) {
      S.room(p);
      p.obox(24, 2, 40, 54, '#e8e0cc'); p.rect(25, 3, 38, 2, '#fffaf0'); p.obox(28, 6, 32, 26, '#303030');
      p.rect(30, 8, 28, 22, '#f8f8f8'); p.rect(30, 8, 28, 3, '#e0e0e0'); for (let x = 30; x < 58; x += 2) p.px(x, 9, '#000');
      p.obox(33, 14, 14, 10, '#fff'); p.rect(34, 15, 12, 2, '#000'); p.obox(51, 22, 5, 5, '#fff'); p.px(52, 18, '#000');
      p.rect(42, 40, 16, 2, '#2a2a2a'); p.rect(30, 50, 8, 1, '#a89c88'); p.obox(24, 56, 40, 4, '#d8d0bc');
      p.oell(78, 62, 6, 8, '#e8e0cc'); p.line(78, 54, 78, 46, '#555'); p.line(78, 46, 64, 44, '#555');
    } },
    amiga: { cap: 'An Amiga 500 (1987): keyboard and floppy drive in one cream case. A star for games, art and music.', draw(p, S) {
      S.room(p);
      crt(p, 24, 0, 48, 30, (x, y, w, h) => { for (let yy = 0; yy < h; yy++) p.rect(x, y + yy, w, 1, `hsl(${200 + yy * 6},70%,${30 + yy * 2}%)`); p.poly([[x, y + h], [x + 12, y + 10], [x + 22, y + h]], '#2a6a2a'); p.poly([[x + 16, y + h], [x + 30, y + 8], [x + w, y + h]], '#3a8a3a'); p.disc(x + 32, y + 6, 3, '#ffe060'); }, '#ece6d6');
      p.opoly([[4, 40], [92, 40], [95, 64], [1, 64]], '#ece6d6'); p.rect(5, 41, 86, 2, '#fffaf0');
      for (let r = 0; r < 4; r++) keyRow(p, 8 + r * 2, 45 + r * 4, 12, 4, '#f8f4ea');
      p.obox(90, 48, 5, 10, '#d8d0bc'); p.rect(91, 50, 3, 1, '#222'); p.px(8, 61, '#e01010');
    } },
  });
  function dollar(p, x, y) { p.text(x, y, 'S', '#30ff30'); p.line(x + 1, y - 1, x + 1, y + 5, '#30ff30'); }
  function win(p, x, y, w, h, title, body) { // a little Win9x-style window
    p.obox(x, y, w, h, '#c0c0c0'); p.rect(x + 2, y + 2, w - 4, 6, '#000080'); if (title) p.text(x + 3, y + 3, title, '#fff');
    p.obox(x + w - 8, y + 3, 5, 4, '#c0c0c0'); p.rect(x + 2, y + 9, w - 4, h - 11, body || '#fff'); return p;
  }
  A.add({
    windows: { cap: 'A Windows-style desktop: windows, icons, a mouse pointer, and the Start button on the taskbar.', draw(p) {
      p.fill('#008080');
      [[6, 6, '#ffd400'], [6, 22, '#c0c0c0'], [6, 38, '#9fd0ff']].forEach(([x, y, c]) => { p.obox(x, y, 10, 9, c); p.rect(x - 1, y + 10, 12, 2, '#fff'); });
      win(p, 24, 6, 50, 34, 'MY PC'); for (let i = 0; i < 3; i++) p.obox(28 + i * 15, 18, 10, 9, '#d8d0bc');
      win(p, 40, 26, 50, 30, 'PAINT'); p.rect(43, 36, 44, 18, '#fff'); p.thick(48, 48, 60, 40, '#e01010', 2); p.disc(76, 44, 5, '#2a7ad8');
      p.rect(0, 62, W, 10, '#c0c0c0'); p.rect(0, 62, W, 1, '#fff'); p.obox(2, 64, 25, 7, '#c0c0c0'); p.text(5, 65, 'START', '#000'); p.obox(78, 64, 16, 7, '#c0c0c0');
      p.poly([[30, 44], [30, 54], [33, 51], [36, 56], [38, 55], [35, 50], [39, 50]], '#fff'); p.line(30, 44, 30, 54, '#000'); p.line(30, 44, 39, 50, '#000');
    } },
    linux: { cap: 'Linux at a command prompt. It is free, and anyone can read and change the instructions that make it work.', draw(p) {
      p.vgrad(0, H, '#3a3a50', '#202030');
      p.obox(4, 4, 88, 64, '#c0c0c0'); p.rect(6, 6, 84, 6, '#404040'); p.text(8, 7, 'TERMINAL', '#fff'); p.rect(6, 13, 84, 53, '#000');
      p.text(8, 16, 'LOGIN: JACK', '#c0c0c0'); dollar(p, 8, 24); p.text(14, 24, 'UNAME', '#30ff30'); p.text(8, 31, 'LINUX', '#c0c0c0'); dollar(p, 8, 39); p.text(14, 39, 'LS', '#30ff30'); p.text(8, 46, 'GAMES  HOMEWORK', '#6090ff'); dollar(p, 8, 55); p.rect(14, 55, 3, 5, '#30ff30');
    } },
    deep_blue: { cap: 'Deep Blue, IBM\'s chess computer, beat the world champion Garry Kasparov in a match in May 1997.', draw(p) {
      p.vgrad(0, H, '#101828', '#2a3a5a');
      p.obox(56, 2, 18, 46, '#1a1a24'); p.obox(76, 2, 18, 46, '#1a1a24'); for (let i = 0; i < 8; i++) { p.px(60 + (i % 3) * 4, 8 + i * 4, '#30a0ff'); p.px(80 + (i % 3) * 4, 10 + i * 4, '#30a0ff'); }
      // chessboard in perspective
      const by = 40, bh = 30; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const y0 = by + j * bh / 8, y1 = by + (j + 1) * bh / 8; const w0 = 40 + j * 5, w1 = 40 + (j + 1) * 5; const x0 = 28 - w0 / 2 + i * w0 / 8, x1 = 28 - w1 / 2 + i * w1 / 8; p.poly([[x0, y0], [x0 + w0 / 8, y0], [x1 + w1 / 8, y1], [x1, y1]], (i + j) % 2 ? '#7a4a1a' : '#f0d8a8'); }
      const piece = (x, y, c, k) => { p.oell(x, y + 6, 3, 1.5, c); p.obox(x - 2, y - 1, 4, 7, c); p.odisc(x, y - 3, k ? 3 : 2, c); if (k) p.rect(x - 1, y - 9, 2, 4, c); };
      piece(18, 44, '#f8f8f8', true); piece(34, 50, '#202020', true); piece(26, 56, '#f8f8f8'); piece(42, 60, '#202020');
      p.text(4, 4, '1997', '#ffd400', 2);
    } },
    // ================================================================ The Internet
    arpanet: { cap: 'ARPANET at the end of 1969: four computers linked together. The very first message was "LO".', draw(p, S) {
      S.paper(p);
      const N = { UCLA: [16, 56], SRI: [22, 18], UCSB: [8, 36], UTAH: [70, 24] };
      [['UCLA', 'SRI'], ['UCLA', 'UCSB'], ['SRI', 'UCSB'], ['SRI', 'UTAH']].forEach(([a, b]) => p.thick(N[a][0], N[a][1], N[b][0], N[b][1], '#2a7ad8', 2));
      Object.entries(N).forEach(([k, [x, y]]) => { p.obox(x - 4, y - 4, 9, 9, '#ffd400'); p.text(x + 7, y - 2, k, '#203060'); });
      p.oell(64, 52, 16, 9, '#fff'); p.opoly([[48, 54], [44, 56], [50, 58]], '#fff'); p.text(56, 49, '"LO"', '#e01010', 1);
      p.text(50, 4, '1969', '#203060', 2);
    } },
    email: { cap: 'E-mail zips a message from one computer to another in seconds. The @ sign comes between your name and the computer\'s.', draw(p, S) {
      S.room(p);
      crt(p, 2, 14, 30, 24, (x, y, w, h) => p.rect(x, y, w, h, '#008080'));
      crt(p, 64, 14, 30, 24, (x, y, w, h) => p.rect(x, y, w, h, '#008080'));
      p.obox(34, 4, 28, 18, '#fff8e8'); p.line(34, 4, 48, 14, '#a08060'); p.line(61, 4, 48, 14, '#a08060'); p.odisc(48, 15, 4, '#e01010'); p.text(47, 13, '@', '#fff');
      for (let i = 0; i < 3; i++) p.rect(26 - i * 6, 10 + i * 3, 4, 1, '#fff');
      p.text(22, 56, 'JACK@HOME', '#203060');
    } },
    usenet: { cap: 'A newsreader showing Usenet newsgroups, with messages and replies arranged in threads.', draw(p) {
      p.fill('#008080'); win(p, 3, 3, 90, 66, 'NEWS');
      p.rect(5, 12, 28, 55, '#fff'); ['REC.GAMES', 'COMP.SYS', 'ALT.TV.X', 'SCI.SPACE'].forEach((g, i) => { if (i === 0) p.rect(5, 13 + i * 7, 28, 7, '#000080'); p.text(6, 14 + i * 7, g.slice(0, 7), i === 0 ? '#fff' : '#000'); });
      p.rect(35, 12, 56, 55, '#fff');
      [['CHEATS?', 0], ['RE: CHEATS?', 1], ['RE: RE: CHEATS', 2], ['BEST GAME 99', 0], ['RE: BEST GAME', 1]].forEach(([t, d], i) => { if (d) p.line(37 + (d - 1) * 4, 14 + i * 8, 37 + (d - 1) * 4 + 3, 16 + i * 8, '#888'); p.text(37 + d * 4, 14 + i * 8, t.slice(0, 13 - d), '#000'); });
    } },
    emoticon: { cap: 'Tilt your head to the left: :-) is a smiley. They were first suggested in September 1982.', draw(p) {
      p.vgrad(0, H, '#fff3b0', '#ffd860');
      p.text(6, 26, ':-)', '#203060', 4);
      p.odisc(74, 34, 15, '#ffd400'); p.ring(74, 34, 15, '#a07000'); p.odisc(69, 29, 2, '#000'); p.odisc(79, 29, 2, '#000');
      for (let a = 0.4; a < 2.74; a += 0.08) p.px(74 + Math.cos(a) * 9, 34 + Math.sin(a) * 8, '#000'); p.text(58, 58, ':-( :-P', '#203060');
    } },
    irc: { cap: 'An IRC chat channel: everything you type appears on everyone\'s screen straight away.', draw(p) {
      p.fill('#004040'); win(p, 3, 3, 90, 66, '#GAMES', '#000');
      [['<DAVE>', 'ANYONE ON?', '#ff6060'], ['<JACK>', 'HIYA!', '#60ff60'], ['<ZOG>', 'A/S/L?', '#ffd400'], ['<JACK>', 'NO THANKS', '#60ff60'], ['*', 'MOM JOINED', '#60a0ff']].forEach(([n, t, c], i) => { p.text(6, 14 + i * 9, n, c); p.text(32, 14 + i * 9, t, '#e0e0e0'); });
      p.rect(5, 60, 86, 7, '#202020'); p.text(7, 61, '/JOIN #', '#fff');
    } },
    world_wide_web: { cap: 'The World Wide Web: pages on computers all over the world, joined together by clickable links.', draw(p, S) {
      S.space(p, 21);
      p.odisc(48, 40, 22, '#1a5ac8'); p.ell(40, 34, 8, 6, '#3a9a2a'); p.ell(56, 46, 7, 8, '#3a9a2a'); p.ell(46, 54, 4, 3, '#3a9a2a');
      const pg = [[6, 6], [72, 4], [4, 48], [76, 46], [40, 4]];
      pg.forEach(([x, y]) => { p.obox(x, y, 16, 18, '#fff'); p.rect(x + 2, y + 3, 12, 2, '#e01010'); p.rect(x + 2, y + 8, 10, 1, '#0000ee'); p.rect(x + 2, y + 11, 8, 1, '#0000ee'); p.rect(x + 2, y + 14, 11, 1, '#555'); });
      [[0, 4], [4, 1], [1, 3], [3, 2], [2, 0], [0, 3]].forEach(([a, b]) => p.line(pg[a][0] + 8, pg[a][1] + 9, pg[b][0] + 8, pg[b][1] + 9, '#ffd400'));
    } },
    web_browser: { cap: 'A web browser, with Back and Forward buttons, an address box and a page loading (slowly) over the modem.', draw(p) {
      p.fill('#008080'); win(p, 2, 2, 92, 68, 'BROWSER', '#c0c0c0');
      p.obox(5, 12, 10, 9, '#c0c0c0'); p.opoly([[7, 16], [12, 13], [12, 19]], '#3a9a2a'); p.obox(16, 12, 10, 9, '#c0c0c0'); p.opoly([[24, 16], [19, 13], [19, 19]], '#888');
      p.obox(80, 12, 11, 9, '#000'); p.odisc(85, 16, 3, '#2a7ad8');
      p.obox(28, 13, 50, 7, '#fff'); p.text(30, 14, 'HTTP://WWW.', '#000');
      p.rect(5, 23, 86, 36, '#fff'); p.text(8, 26, 'WELCOME!!', '#e01010'); p.rect(8, 34, 30, 1, '#0000ee'); p.rect(8, 38, 24, 1, '#0000ee'); p.rect(8, 42, 28, 1, '#551a8b'); p.rect(56, 30, 30, 20, '#e8e8e8'); for (let y = 30; y < 40; y += 2) p.rect(56, y, 30, 1, '#9fd0ff');
      p.rect(5, 61, 86, 7, '#c0c0c0'); p.obox(50, 62, 40, 5, '#fff'); p.rect(52, 63, 14, 3, '#000080'); p.text(6, 62, '12%', '#000');
    } },
  });
  A.add({
    html: { cap: 'HTML: tags in angle brackets, typed into Notepad, which the browser turns into a web page.', draw(p) {
      p.fill('#008080');
      win(p, 2, 4, 50, 62, 'NOTEPAD');
      ['<HTML>', '<B>HI!</B>', '<BLINK>', 'NEW!', '</BLINK>', '<IMG>', '</HTML>'].forEach((t, i) => p.text(5, 15 + i * 7, t, i === 1 || i === 3 ? '#e01010' : '#000080'));
      p.thick(54, 36, 60, 36, '#ffd400', 2); p.opoly([[60, 32], [64, 36], [60, 40]], '#ffd400');
      win(p, 66, 14, 28, 40, ''); p.text(69, 26, 'HI!', '#000', 1); p.rect(69, 26, 11, 5, 'rgba(0,0,0,0)'); p.text(69, 34, 'NEW!', '#e01010'); p.obox(69, 42, 18, 9, '#9fd0ff'); p.disc(74, 46, 2, '#ffd400');
    } },
    domain_names: { cap: 'Domain names: a DNS server looks up a website\'s name and finds its number, like a phone book.', draw(p, S) {
      S.paper(p);
      p.obox(4, 6, 50, 12, '#fff'); p.text(7, 10, 'WWW.SITE.COM', '#0000ee');
      p.thick(29, 18, 29, 26, '#203060', 2); p.opoly([[25, 26], [33, 26], [29, 30]], '#203060');
      p.obox(14, 30, 30, 22, '#5a6a8a'); p.text(20, 34, 'DNS', '#fff'); for (let i = 0; i < 3; i++) p.rect(18, 42 + i * 3, 22, 1, '#9fb0d8');
      p.thick(29, 52, 29, 58, '#203060', 2); p.obox(4, 58, 54, 11, '#fff'); p.text(7, 61, '192.168.0.1', '#e01010');
      ['.COM', '.ORG', '.GOV', '.CO.UK'].forEach((t, i) => { p.obox(62, 8 + i * 15, 30, 11, ['#ffd400', '#9fd0ff', '#b8f0a0', '#ff8ac0'][i]); p.text(65, 11 + i * 15, t, '#203060'); });
    } },
    search_engines: { cap: 'A search engine: type in some words and it finds them in a giant index, built by "spider" programs that crawl the Web.', draw(p) {
      p.vgrad(0, H, '#e8f0ff', '#c8d8f0');
      p.obox(4, 6, 62, 11, '#fff'); p.text(7, 9, 'ZELDA CHEATS', '#000'); p.obox(68, 6, 24, 11, '#c0c0c0'); p.text(70, 9, 'FIND', '#000');
      for (let i = 0; i < 3; i++) { p.rect(6, 24 + i * 9, 34, 1, '#0000ee'); p.rect(6, 27 + i * 9, 46, 1, '#888'); }
      // a little spider crawling over linked pages
      [[60, 30], [80, 44], [56, 56]].forEach(([x, y]) => { p.obox(x, y, 12, 13, '#fff'); p.rect(x + 2, y + 3, 8, 1, '#0000ee'); p.rect(x + 2, y + 6, 6, 1, '#555'); });
      p.line(66, 36, 86, 50, '#888'); p.line(86, 50, 62, 62, '#888');
      p.odisc(76, 43, 3, '#202020'); p.disc(74, 39, 2, '#202020'); for (let i = -1; i <= 1; i += 2) for (let k = 0; k < 3; k++) p.line(76, 43, 76 + i * 6, 39 + k * 4, '#202020');
      p.ring(24, 56, 7, '#5a5a5a', 2); p.disc(24, 56, 5, 'rgba(160,200,255,.5)'); p.thick(29, 61, 36, 68, '#7a4a1a', 3);
    } },
    webcam: { cap: 'The Trojan Room coffee pot at Cambridge University: its little black-and-white picture went on the Web in 1993.', draw(p, S) {
      S.room(p);
      // hot plate and glass coffee jug
      p.obox(42, 50, 34, 6, '#303030'); p.obox(46, 44, 26, 7, '#202020');
      p.opoly([[48, 20], [70, 20], [72, 44], [46, 44]], '#e0eef8'); p.rect(49, 32, 21, 12, '#4a2a10'); p.rect(49, 32, 21, 1, '#8a5a30');
      p.obox(44, 16, 30, 5, '#202020'); p.thick(72, 24, 80, 28, '#202020', 3); p.thick(80, 28, 80, 38, '#202020', 3); p.thick(80, 38, 72, 40, '#202020', 3);
      // the camera on a stand, looking at it
      p.obox(6, 18, 18, 12, '#3a3a3a'); p.odisc(26, 24, 4, '#1a1a1a'); p.disc(26, 24, 2, '#3050a0'); p.rect(13, 30, 3, 20, '#555');
      p.obox(4, 50, 24, 12, '#d8d0bc'); p.rect(6, 52, 20, 8, '#000'); p.rect(14, 54, 4, 5, '#a0a0a0'); p.rect(15, 56, 2, 3, '#505050');
    } },
    mp3: { cap: 'MP3 squashes a song to about a tenth of its size on a CD: roughly 1 MB for each minute of music.', draw(p) {
      p.vgrad(0, H, '#1a1040', '#402080');
      p.odisc(20, 26, 15, '#c8c8d8'); p.odisc(20, 26, 4, '#e8e8f0'); p.disc(20, 26, 2, '#402080'); p.line(10, 18, 14, 14, '#fff');
      p.thick(38, 26, 50, 26, '#ffd400', 2); p.opoly([[50, 22], [55, 26], [50, 30]], '#ffd400'); p.text(36, 32, 'SQUASH', '#ffd400');
      p.opoly([[60, 10], [80, 10], [86, 16], [86, 42], [60, 42]], '#fff'); p.opoly([[80, 10], [86, 16], [80, 16]], '#d8d8d8');
      for (let x = 63; x < 84; x += 2) { const hgt = 2 + Math.abs(Math.sin(x * 1.3)) * 8; p.rect(x, 30 - hgt, 1, hgt * 2, '#2a7ad8'); }
      p.text(62, 44, 'SONG.MP3', '#fff');
      // a little portable player
      p.obox(10, 48, 20, 22, '#9aa0a8'); p.rect(13, 51, 14, 7, '#a8c890'); p.text(14, 52, '128', '#203020'); p.odisc(20, 64, 4, '#5a5a64');
      p.text(36, 56, '1 MB/MIN', '#c8c8ff');
    } },
    instant_messaging: { cap: 'A buddy list shows which friends are online right now, and their messages pop up straight away.', draw(p) {
      p.fill('#008080');
      win(p, 4, 4, 38, 64, 'BUDDIES');
      [['DAVE', 1], ['RYAN', 1], ['COUSIN', 0], ['MOM', 1], ['GRAN', 0]].forEach(([n, on], i) => { p.disc(9, 18 + i * 9, 2, on ? '#30c030' : '#c03030'); p.text(13, 16 + i * 9, n, on ? '#000' : '#888'); });
      win(p, 44, 18, 48, 30, 'DAVE');
      p.text(47, 30, 'U THERE?', '#000'); p.text(47, 38, 'UH-OH!', '#e01010');
    } },
    napster: { cap: 'Peer-to-peer file sharing: music files go straight from one person\'s computer to another\'s.', draw(p, S) {
      S.room(p);
      crt(p, 2, 10, 32, 28, (x, y, w, h) => { p.rect(x, y, w, h, '#202060'); p.text(x + 2, y + 3, 'MP3', '#fff'); });
      crt(p, 62, 10, 32, 28, (x, y, w, h) => { p.rect(x, y, w, h, '#202060'); p.text(x + 2, y + 3, 'MP3', '#fff'); });
      const note = (x, y, c) => { p.odisc(x, y + 6, 3, c); p.rect(x + 2, y - 2, 2, 8, c); p.rect(x + 2, y - 2, 5, 2, c); };
      note(40, 12, '#ffd400'); note(52, 18, '#ff8ac0'); note(46, 26, '#9fd0ff');
      p.thick(36, 34, 60, 34, '#fff', 1); p.opoly([[58, 31], [62, 34], [58, 37]], '#fff'); p.opoly([[38, 37], [34, 40], [38, 43]], '#fff'); p.thick(38, 40, 60, 40, '#fff', 1);
    } },
    netiquette: { cap: 'Netiquette: TYPING IN CAPITALS LOOKS LIKE SHOUTING, and an angry message is called a "flame".', draw(p) {
      p.fill('#008080');
      win(p, 4, 4, 88, 36, 'RE: RE: RE:');
      p.text(8, 16, 'WHY IS NOBODY', '#000'); p.text(8, 23, 'ANSWERING!!!!!', '#e01010', 1); p.text(8, 31, '(PLEASE DON\'T SHOUT)', '#555');
      // a flame
      p.opoly([[20, 70], [12, 56], [18, 58], [16, 44], [26, 54], [28, 42], [34, 56], [38, 50], [36, 70]], '#ff8000'); p.opoly([[22, 70], [20, 60], [26, 62], [28, 54], [32, 64], [32, 70]], '#ffd400');
      p.odisc(80, 56, 10, '#ffd400'); p.disc(77, 53, 1, '#000'); p.disc(83, 53, 1, '#000'); for (let a = 0.5; a < 2.64; a += 0.1) p.px(80 + Math.cos(a) * 6, 56 + Math.sin(a) * 5, '#000');
      p.text(42, 50, 'BE KIND', '#fff');
    } },
    dot_com: { cap: 'The dot-com boom: new companies with web addresses ending in .com, and investors rushing to give them money.', draw(p) {
      p.vgrad(0, H, '#7ab8ff', '#d8ecff');
      for (let i = 0; i < 4; i++) { const x = 8 + i * 22, hgt = 18 + i * 9; p.obox(x, 66 - hgt, 18, hgt, ['#8a9ab8', '#7a8aa8', '#9aaac8', '#6a7a98'][i]); for (let y = 70 - hgt; y < 64; y += 5) for (let k = 0; k < 3; k++) p.rect(x + 3 + k * 5, y, 3, 3, '#ffe880'); }
      p.oell(62, 16, 28, 11, '#ffd400'); p.text(44, 12, '.COM!', '#c01010', 2);
      p.thick(6, 40, 20, 30, '#30c030', 2); p.thick(20, 30, 30, 34, '#30c030', 2); p.thick(30, 34, 44, 14, '#30c030', 2); p.opoly([[40, 14], [46, 12], [44, 18]], '#30c030');
      p.rect(0, 66, W, 6, '#555');
    } },
  });
  A.add({
    ada_lovelace: { cap: 'Ada Lovelace writing her 1843 notes: step-by-step instructions for working out Bernoulli numbers on Babbage\'s engine.', draw(p) {
      p.vgrad(0, H, '#5a3a2a', '#3a2418'); p.rect(0, 52, W, 20, '#6a4020'); p.rect(0, 52, W, 1, '#8a5a30');
      // a candle and a brass gear from the engine
      p.obox(84, 36, 4, 16, '#f0e8d0'); p.poly([[84, 36], [86, 30], [88, 36]], '#ffd400'); p.disc(86, 33, 4, 'rgba(255,220,100,.25)');
      p.odisc(74, 46, 6, '#c89a38'); for (let a = 0; a < 6.28; a += 0.785) p.rect(74 + Math.cos(a) * 7 - 1, 46 + Math.sin(a) * 7 - 1, 2, 2, '#c89a38'); p.disc(74, 46, 2, '#6a4020');
      // the notes
      p.opoly([[38, 50], [70, 50], [74, 62], [34, 62]], '#f8f0d8'); for (let i = 0; i < 4; i++) p.line(38 + i, 53 + i * 2.5, 68 + i, 53 + i * 2.5, '#6a6a8a'); p.text(56, 44, 'B7', '#f0e0b0');
      // a Victorian lady in silhouette: hair in a bun, full-skirted dress
      p.odisc(20, 16, 6, '#1a1020'); p.odisc(14, 14, 3, '#1a1020'); p.ell(22, 18, 4, 5, '#e8c8a8'); p.px(25, 17, '#000');
      p.opoly([[16, 24], [28, 24], [32, 40], [12, 40]], '#3a1a4a'); p.opoly([[12, 40], [32, 40], [38, 70], [4, 70]], '#4a2a5a');
      p.thick(28, 30, 40, 50, '#3a1a4a', 3); p.disc(41, 51, 2, '#e8c8a8'); p.line(42, 51, 46, 47, '#202020');
    } },
  });
  function S_lab(p) { p.vgrad(0, H, '#2a3048', '#4a5070'); return p; }
})();

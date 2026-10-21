/* carta-cd.js: the JackOS CD Player (lazy-loaded by apps-carta.js; exports Carta.mods.cd(w, arg)).
 * Plays "Gubbinz & Da Boyz - Greatest Hits", an Enhanced CD of original chiptunes (track 1 is a data track,
 * and there's a hidden track in the pregap), plus whatever else is in the shoebox next to the PC. */
(function () {
  const C = window.Carta, A = window.Apps;
  const esc = C.esc, h = C.h;
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const seq = s => s.split(/[\s|]+/).filter(Boolean).map(t => { if (t === '.') return 0; if (t === '-') return -1; const m = /^([A-G])([#b]?)(-?\d)$/.exec(t); if (!m) throw new Error('bad note ' + t); return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); });

  // ================================================================ the tunes (all original). 16 bars of 8 eighth-notes; bass = 4 per bar.
  const SONGS = [
    { id: 'stampede', title: 'Blobbit Stampede', step: 0.12, hats: true, loops: 4,
      lead: `E5 . E5 G5 B5 . A5 G5 | E5 - - D5 E5 . G5 . | C6 . B5 A5 G5 . E5 G5 | F#5 - D5 - A5 - F#5 . | E5 . E5 G5 B5 . E6 D6 | B5 - G5 - E5 . G5 B5 | C6 . E6 . D6 C6 B5 A5 | B5 - A5 - G5 - F#5 - |
             D6 . B5 D6 G6 - D6 B5 | A5 - F#5 A5 D6 - A5 F#5 | G5 . E5 G5 B5 - G5 E5 | E5 - G5 - C6 - E6 - | D6 D6 . B5 D6 . G6 . | F#6 - E6 - D6 - A5 - | G5 . A5 . B5 . C6 . | D6 - - - F#5 - D5 .`,
      bass: `E2 E3 E2 E3 | E2 E3 B1 B2 | C2 C3 C2 C3 | D2 D3 D2 A2 | E2 E3 E2 E3 | E2 E3 B1 B2 | C2 C3 C2 C3 | D2 D3 D2 D3 | G2 G3 G2 D3 | D2 D3 D2 A2 | E2 E3 E2 B2 | C2 C3 C2 G2 | G2 G3 G2 D3 | D2 D3 D2 A2 | C2 C3 C2 G2 | D2 D3 D2 D2` },
    { id: 'floppy', title: 'Ballad of the Lost Floppy', step: 0.22, hats: false, loops: 2,
      lead: `E5 - - - G5 - E5 - | C5 - - - E5 - A5 - | A5 - G5 - F5 - C5 - | D5 - - - - - . . | E5 - G5 - C6 - B5 - | A5 - - - E5 - C5 - | F5 - A5 - G5 - F5 - | G5 - - - - - . . |
             A5 - - C6 F6 - E6 - | D6 - - B5 G5 - - . | B5 - - G5 E5 - G5 - | C6 - - - A5 - - . | F5 - A5 - D6 - C6 - | B5 - - A5 G5 - - - | E5 - G5 - C6 - - - | C6 - - - - - . .`,
      bass: `C2 G2 E3 G2 | A1 E2 C3 E2 | F2 C3 A2 C3 | G1 D2 B2 D2 | C2 G2 E3 G2 | A1 E2 C3 E2 | F2 C3 A2 C3 | G1 D2 B2 D2 | F2 C3 A2 C3 | G1 D2 B2 D2 | E2 B2 G2 B2 | A1 E2 C3 E2 | D2 A2 F2 A2 | G1 D2 B2 D2 | C2 G2 E3 G2 | C2 G2 C2 C2` },
    { id: 'strut', title: 'Funky Robot Strut', step: 0.13, hats: true, loops: 4,
      lead: `G5 . . Bb5 . G5 F5 . | G5 - . . D5 . F5 G5 | . Bb5 . A5 G5 . E5 . | G5 - . C6 . Bb5 G5 . | G5 . . Bb5 . C6 D6 . | F6 - D6 . C6 . Bb5 . | E6 . . C6 . Bb5 . G5 | Bb5 - G5 - . . . . |
             Eb6 . . Bb5 . G5 Bb5 . | C6 . . A5 . F5 A5 . | Bb5 . D6 . G6 - F6 D6 | F6 . D6 . Bb5 - G5 . | G5 . Bb5 . Eb6 . D6 . | C6 . A5 . F5 . A5 C6 | D6 - F#6 - A6 - F#6 D6 | A5 - - - F#5 . D5 .`,
      bass: `G2 G3 F2 G2 | G2 Bb2 D3 G2 | C2 C3 Bb1 C2 | C2 E2 G2 C3 | G2 G3 F2 G2 | G2 Bb2 D3 G2 | C2 C3 Bb1 C2 | C2 G2 Bb2 C3 | Eb2 Eb3 Bb2 Eb2 | F2 F3 C3 F2 | G2 G3 D3 G2 | G2 G3 F2 D2 | Eb2 Eb3 Bb2 Eb2 | F2 F3 C3 F2 | D2 D3 A2 D2 | D2 A2 D3 D2` },
    { id: 'cave', title: 'Spooky Space Cave', step: 0.17, hats: false, loops: 3,
      lead: `A4 . C5 . E5 . D#5 . | E5 - - - . . . . | D5 . F5 . A5 . G#5 . | A5 - - - . . . . | A5 . G#5 . G5 . F#5 . | F5 . E5 . D#5 . E5 . | G#4 . B4 . D5 . F5 . | E5 - - - E4 . . . |
             F5 - A5 - C6 - B5 - | B5 - G#5 - E5 - - . | D5 - F5 - A5 - G#5 - | A5 - - - E5 - - . | C6 . B5 . A#5 . A5 . | G#5 . G5 . F#5 . F5 . | E5 . F5 . E5 . D#5 . | E5 - - - A4 . . .`,
      bass: `A1 E2 A1 E2 | A1 E2 A1 E2 | D2 A2 D2 A2 | D2 A2 D2 A2 | A1 E2 A1 E2 | F1 C2 F1 C2 | E1 B1 E1 B1 | E1 B1 E2 E1 | F1 C2 F1 C2 | E1 B1 E1 B1 | D2 A2 D2 A2 | A1 E2 A1 E2 | F1 C2 F1 C2 | E1 B1 E1 B1 | E1 B1 E1 G#1 | A1 E2 A1 A1` },
    { id: 'parade', title: 'Robot Parade', step: 0.14, hats: true, loops: 3,
      lead: `F5 . F5 F5 Bb5 - F5 . | D5 . D5 D5 F5 - D5 . | C5 . C5 C5 F5 - A5 . | C6 - - . A5 . F5 . | F5 . F5 F5 Bb5 - D6 . | Eb6 - D6 - C6 - Bb5 . | A5 . C6 . F5 . A5 . | Bb5 - - . Bb4 . . . |
             G5 . G5 . Bb5 . Eb6 . | F5 . F5 . Bb5 . D6 . | C6 . A5 . F5 . A5 . | Bb5 - D6 - F6 - - . | G5 . Bb5 . D6 . G6 . | G6 - F6 - Eb6 - C6 . | D6 . C6 . A5 . C6 . | Bb5 - - - Bb5 . . .`,
      bass: `Bb1 F2 Bb1 F2 | Bb1 F2 Bb1 F2 | F1 C2 F1 C2 | F1 C2 F1 C2 | Bb1 F2 Bb1 F2 | Eb2 Bb2 Eb2 Bb2 | F1 C2 F1 C2 | Bb1 F2 Bb1 Bb1 | Eb2 Bb2 Eb2 Bb2 | Bb1 F2 Bb1 F2 | F1 C2 F1 C2 | Bb1 F2 Bb1 F2 | G1 D2 G1 D2 | Eb2 Bb2 Eb2 Bb2 | F1 C2 F1 C2 | Bb1 F2 Bb1 Bb1` },
    { id: 'hold', title: 'Please Hold (Hold Music)', step: 0.18, hats: true, loops: 3,
      lead: `F#5 - A5 - D6 - C#6 - | B5 - - - F#5 - . . | G5 - B5 - E6 - D6 - | C#6 - - - A5 - . . | F#5 - A5 - D6 - F#6 - | E6 - D6 - B5 - . . | G5 - A5 - B5 - C#6 - | E6 - - - - - . . |
             B5 - D6 - G6 - F#6 - | E6 - C#6 - A5 - . . | A5 - C#6 - F#6 - E6 - | D6 - - - B5 - . . | E6 - D6 - B5 - G5 - | A5 - B5 - C#6 - E6 - | D6 - - - A5 - F#5 - | D5 - - - - - . .`,
      bass: `D2 A2 F#2 A2 | B1 F#2 D2 F#2 | E2 B2 G2 B2 | A1 E2 C#2 E2 | D2 A2 F#2 A2 | B1 F#2 D2 F#2 | E2 B2 G2 B2 | A1 E2 C#2 E2 | G1 D2 B1 D2 | A1 E2 C#2 E2 | F#1 C#2 A1 C#2 | B1 F#2 D2 F#2 | E2 B2 G2 B2 | A1 E2 C#2 E2 | D2 A2 F#2 A2 | D2 A2 D2 D2` },
    { id: 'trukk', title: 'Turbo Racer (Red Ones Go Faster)', step: 0.11, hats: true, loops: 4,
      lead: `D5 D5 F5 D5 A5 D5 F5 D5 | C6 - A5 . F5 . D5 . | D5 D5 F5 D5 Bb5 D5 F5 D5 | E5 - G5 . C6 . E6 . | D6 . A5 . F5 . D5 . | A5 . F5 . D5 . A4 . | Bb4 D5 F5 Bb5 C6 . Bb5 . | A5 - - - C#6 - E6 - |
             G5 . Bb5 . D6 . G6 . | A6 - E6 - C#6 - A5 - | F6 . E6 . D6 . A5 . | Bb5 . D6 . F6 - - . | G6 . F6 . E6 . D6 . | C#6 . E6 . A6 . G6 . | F6 . D6 . A5 . F5 . | D5 - - - D6 . . .`,
      bass: `D2 D3 D2 D3 | D2 D3 C2 C3 | Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 | D2 D3 D2 D3 | D2 D3 D2 A2 | Bb1 Bb2 C2 C3 | A1 A2 A1 A2 | G1 G2 G1 G2 | A1 A2 A1 A2 | D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 | G1 G2 G1 G2 | A1 A2 A1 A2 | D2 D3 A1 A2 | D2 A1 D2 D2` },
    { id: 'sunset', title: 'Pixel Sunset', step: 0.2, hats: false, loops: 2,
      lead: `C6 - A5 - F5 - A5 - | G5 - E5 - C5 - E5 - | F5 - A5 - D6 - C6 - | D6 - - - Bb5 - . . | C6 - A5 - F5 - A5 - | G5 - C6 - E6 - D6 - | D6 - C6 - Bb5 - A5 - | G5 - - - - - . . |
             F5 - Bb5 - D6 - F6 - | E6 - C6 - A5 - . . | D6 - Bb5 - G5 - Bb5 - | C6 - - - E5 - . . | F5 - A5 - D6 - E6 - | F6 - D6 - Bb5 - G5 - | E5 - G5 - C6 - E6 - | F6 - - - - - . .`,
      bass: `F2 C3 A2 C3 | C2 G2 E2 G2 | D2 A2 F2 A2 | Bb1 F2 D2 F2 | F2 C3 A2 C3 | C2 G2 E2 G2 | Bb1 F2 D2 F2 | C2 G2 C2 G2 | Bb1 F2 D2 F2 | F2 C3 A2 C3 | G1 D2 Bb1 D2 | C2 G2 E2 G2 | D2 A2 F2 A2 | Bb1 F2 D2 F2 | C2 G2 E2 G2 | F2 C3 F2 F2` },
    { id: 'modem', title: 'Switch Off the Modem', step: 0.13, hats: true, loops: 4,
      lead: `C5 E5 G5 C6 E6 C6 G5 E5 | D5 G5 B5 D6 G6 D6 B5 G5 | E5 A5 C6 E6 A6 E6 C6 A5 | F5 A5 C6 F6 A6 - G6 F6 | E6 . E6 . G6 . E6 C6 | D6 - B5 - G5 - D6 - | C6 . A5 . F5 . A5 C6 | B5 - - - G5 . . . |
             A5 . C6 . E6 - D6 C6 | B5 . G5 . E5 - G5 B5 | A5 . C6 . F6 - E6 D6 | E6 - - - C6 . . . | D6 . F6 . A6 - G6 F6 | G6 . F6 . D6 . B5 . | C6 . E6 . G6 . E6 . | C7 - - - C6 . . .`,
      bass: `C2 G2 C3 G2 | G1 D2 G2 D2 | A1 E2 A2 E2 | F1 C2 F2 C2 | C2 G2 C3 G2 | G1 D2 G2 D2 | F1 C2 F2 C2 | G1 D2 G2 D2 | A1 E2 A2 E2 | E2 B2 E2 B2 | F1 C2 F2 C2 | C2 G2 C3 G2 | D2 A2 D3 A2 | G1 D2 G2 D2 | C2 G2 C3 G2 | C2 G2 C2 C2` },
  ];
  const HIDDEN = { id: 'snore', title: 'Hidden Track: Gubbinz Snoring', step: 0.3, hats: false, loops: 3, hidden: true,
    lead: `C4 - - - . . . . | G3 - - - . . . . | C4 - - - . . E4 . | D4 - - - . . . .`, bass: `C2 . G1 . | C2 . G1 . | C2 . G1 . | G1 . C2 .` };
  [...SONGS, HIDDEN].forEach(s => {
    s.L = seq(s.lead); s.B = seq(s.bass);
    while (s.B.length * 2 < s.L.length) s.B.push(s.B[s.B.length - 1] || 0); // keep the bass in step with the lead
    s.tune = 'carta_cd_' + s.id; s.len = Math.round(s.L.length * s.step * s.loops);
    Sound.addTune(s.tune, { lead: s.L, bass: s.B, step: s.step, hats: s.hats });
  });
  const SONG = {}; SONGS.forEach(s => { SONG[s.id] = s; });

  // ================================================================ the shoebox of discs next to the PC
  const DATA_TRACK = { id: 'data', title: 'Enhanced CD Extras (data)', data: true, len: 151 };
  const DISCS = {
    gubbinz: { id: 'gubbinz', label: 'GUBBINZ', artist: 'Gubbinz & The Robots', title: 'Greatest Hits', audio: true, autorun: true, pregap: true,
      tracks: [DATA_TRACK, ...['stampede', 'floppy', 'strut', 'cave', 'parade', 'hold', 'trukk', 'sunset', 'modem'].map(k => SONG[k])],
      blurb: 'The ONLY band made entirely of a desktop helper and four tin robots. Nine smash hits, plus bonus pictures of the band on your computer! (Enhanced CD)' },
    mix: { id: 'mix', label: 'MIX!!', artist: 'New Artist', title: 'New Title', audio: true, scratched: true,
      tracks: ['trukk', 'strut', 'stampede', 'hold', 'sunset', 'modem'].map(k => SONG[k]),
      blurb: 'A CD-R that says "DAD\'S CAR MIX - DO NOT TOUCH" in felt-tip. It has been in the car. It has been UNDER the car.' },
    jc1: { id: 'jc1', label: 'JC99 DISC 1', artist: 'JackCarta 99', title: 'Disc 1', data: true, autorun: true, blurb: 'JackCarta 99, Disc 1 of 2. The Multimedia Encyclopedia for Curious Minds.' },
    jc2: { id: 'jc2', label: 'JC99 DISC 2', artist: 'JackCarta 99', title: 'Disc 2', data: true, cracked: true, blurb: 'JackCarta 99, Disc 2 of 2. There is a crack across it, and a tea ring on the label.' },
  };
  const SHOEBOX = ['gubbinz', 'mix', 'jc1', 'jc2'];

  // ================================================================ drawing: disc art and the 7-segment display
  function discArt(id) { // 96x96 offscreen canvas with the disc's label
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96;
    const g = cv.getContext('2d'), p = C.art.Painter(g, 96, 96), d = DISCS[id];
    const cx = 48, cy = 48;
    p.disc(cx, cy, 46, '#a8b0c0'); p.disc(cx, cy, 45, d.id === 'mix' ? '#d8c060' : '#d8e0f0');
    if (d.id === 'gubbinz') {
      p.disc(cx, cy, 42, '#3a9a2a'); p.ring(cx, cy, 42, '#1f5e14', 2);
      p.poly([[22, 44], [8, 30], [26, 52]], '#5ac83a'); p.poly([[74, 44], [88, 30], [70, 52]], '#5ac83a');
      p.ell(cx, 46, 24, 20, '#5ac83a'); p.ell(39, 40, 5, 4, '#fff').ell(57, 40, 5, 4, '#fff'); p.rect(39, 39, 3, 3, '#e10600').rect(55, 39, 3, 3, '#e10600');
      p.rect(36, 54, 24, 6, '#000'); for (let x = 37; x < 60; x += 4) p.rect(x, 54, 2, 3, '#fff');
      p.ctext(72, 'THE ROBOTS', '#ffd400'); p.ctext(8, 'GUBBINZ', '#fff');
    } else if (d.id === 'mix') {
      for (let r = 14; r < 44; r += 3) p.ring(cx, cy, r, 'rgba(160,140,40,.25)');
      p.text(18, 22, 'DADS CAR', '#1a2a8a'); p.text(26, 30, 'MIX!!', '#1a2a8a', 2); p.text(20, 66, 'DO NOT', '#c00'); p.text(26, 73, 'TOUCH', '#c00');
      p.line(10, 58, 40, 80, 'rgba(255,255,255,.8)'); p.line(60, 12, 86, 40, 'rgba(255,255,255,.7)');
    } else {
      p.disc(cx, cy, 42, '#1f3f9f'); for (let a = 0; a < 6.28; a += 0.3) p.line(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, cx + Math.cos(a) * 41, cy + Math.sin(a) * 41, 'rgba(255,255,255,.07)');
      p.disc(cx, 30, 11, '#2a7ad8'); p.ell(cx - 4, 27, 4, 3, '#3a9a2a'); p.ell(cx + 4, 33, 3, 2, '#3a9a2a'); p.ring(cx, 30, 11, '#9fd0ff');
      p.ctext(60, 'JACKCARTA 99', '#ffd400'); p.ctext(70, d.id === 'jc1' ? 'DISC 1' : 'DISC 2', '#fff');
      if (d.cracked) { p.ring(30, 62, 13, 'rgba(120,70,20,.7)', 2); p.line(8, 30, 30, 44, '#000'); p.line(30, 44, 44, 40, '#000'); p.line(44, 40, 60, 58, '#000'); p.line(60, 58, 88, 64, '#000'); p.line(9, 31, 31, 45, '#fff'); }
    }
    p.disc(cx, cy, 13, '#d8e0f0'); p.ring(cx, cy, 13, '#a8b0c0'); p.disc(cx, cy, 6, '#c0c0c0'); g.clearRect(cx - 4, cy - 4, 8, 8);
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(cx, cy, 4.5, 0, 6.29); g.fill(); g.globalCompositeOperation = 'source-over';
    return cv;
  }
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
  const LCD_ON = '#2ef0c0', LCD_OFF = '#0b2a24';
  function seg7(g, x, y, ch) {
    const w = 16, hh = 30, t = 3, half = hh / 2, on = SEG[ch] || '';
    const R = { a: [x + 2, y, w - 4, t], b: [x + w - t, y + 2, t, half - 3], c: [x + w - t, y + half + 1, t, half - 3], d: [x + 2, y + hh - t, w - 4, t], e: [x, y + half + 1, t, half - 3], f: [x, y + 2, t, half - 3], g: [x + 2, y + half - 1, w - 4, t] };
    for (const k in R) { g.fillStyle = on.includes(k) ? LCD_ON : LCD_OFF; g.fillRect(...R[k]); }
  }
  function drawLCD(cv, trk, time, flags) { // trk: '02' or '--', time: '01:23' or '--:--' (may start with '-')
    const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
    const col = LCD_ON, y = 6;
    g.fillStyle = col; g.fillRect(4, y, 2, 30); g.fillRect(4, y, 6, 2); g.fillRect(4, y + 28, 6, 2);
    seg7(g, 12, y, trk[0]); seg7(g, 31, y, trk[1]);
    g.fillStyle = col; g.fillRect(52, y, 2, 30); g.fillRect(48, y, 6, 2); g.fillRect(48, y + 28, 6, 2);
    const neg = time[0] === '-'; const tt = neg ? time.slice(1) : time;
    if (neg) { g.fillStyle = col; g.fillRect(58, y + 14, 5, 3); }
    seg7(g, 66, y, tt[0]); seg7(g, 85, y, tt[1]);
    g.fillStyle = flags.blink ? LCD_OFF : col; g.fillRect(104, y + 8, 3, 3); g.fillRect(104, y + 20, 3, 3);
    seg7(g, 111, y, tt[3]); seg7(g, 130, y, tt[4]);
    const p = C.art.Painter(g, cv.width, cv.height);
    const ind = [['RANDOM', flags.random], ['CONT', flags.cont], ['INTRO', flags.intro]];
    let x = 4; ind.forEach(([n, on]) => { p.text(x, 44, n, on ? col : LCD_OFF); x += p.textW(n) + 6; });
    if (flags.msg) p.text(cv.width - p.textW(flags.msg) - 4, 44, flags.msg, flags.msgCol || '#ffd400');
  }
  const mmss = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60) % 100).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const rot = (a, k) => { k = ((k % a.length) + a.length) % a.length; return a.slice(k).concat(a.slice(0, k)); };
  const BTN = {
    play: '<svg viewBox="0 0 16 16"><path d="M5 3v10l7-5z"/></svg>',
    pause: '<svg viewBox="0 0 16 16"><rect x="4" y="3" width="3" height="10"/><rect x="9" y="3" width="3" height="10"/></svg>',
    stop: '<svg viewBox="0 0 16 16"><rect x="4" y="4" width="8" height="8"/></svg>',
    prev: '<svg viewBox="0 0 16 16"><rect x="2" y="4" width="2" height="8"/><path d="M9 4v8L4 8zM14 4v8L9 8z"/></svg>',
    back: '<svg viewBox="0 0 16 16"><path d="M8 4v8L2 8zM14 4v8L8 8z"/></svg>',
    fwd: '<svg viewBox="0 0 16 16"><path d="M2 4v8l6-4zM8 4v8l6-4z"/></svg>',
    next: '<svg viewBox="0 0 16 16"><path d="M2 4v8l5-4zM7 4v8l5-4z"/><rect x="12" y="4" width="2" height="8"/></svg>',
    eject: '<svg viewBox="0 0 16 16"><path d="M8 3l5 6H3z"/><rect x="3" y="11" width="10" height="2"/></svg>',
  };
  const TBI = {
    list: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#000"/><path d="M4 5h8M4 8h8M4 11h5" stroke="#000080"/></svg>',
    el: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#fff" stroke="#000"/><path d="M8 4v4h3" stroke="#000" fill="none"/></svg>',
    rem: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#fff" stroke="#000"/><path d="M8 4v4H5" stroke="#e10600" fill="none"/></svg>',
    disc: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="#d8e0f0" stroke="#000"/><circle cx="8" cy="8" r="2" fill="#fff" stroke="#000"/><path d="M4 5a5 5 0 0 1 3-2" stroke="#ff8ac0" fill="none"/></svg>',
    random: '<svg viewBox="0 0 16 16"><path d="M2 4h3l6 8h3M2 12h3l6-8h3" stroke="#000" fill="none" stroke-width="1.4"/><path d="M12 2l2 2-2 2M12 10l2 2-2 2" stroke="#000" fill="none"/></svg>',
    cont: '<svg viewBox="0 0 16 16"><path d="M3 8a5 5 0 1 0 2-4" stroke="#000" fill="none" stroke-width="1.4"/><path d="M2 2v4h4" stroke="#000" fill="none"/></svg>',
    intro: '<svg viewBox="0 0 16 16"><rect x="2" y="4" width="12" height="8" fill="#fff" stroke="#000"/><path d="M6 6v4l4-2z"/></svg>',
  };

  // ================================================================ the program
  C.mods.cd = function (w, arg) {
    const store = C.store;
    const P = Object.assign({ random: false, cont: false, intro: false, mode: 'el', toolbar: true, info: true, statusbar: true, stopOnExit: true, introLen: 10, vol: 100 }, store.get('cd_prefs', {}));
    const saveP = () => store.set('cd_prefs', P);
    const root = h('div', 'ct-c');
    root.innerHTML = `
      <div class="ct-c-tbar">${[['list', 'Edit Play List'], '|', ['el', 'Track Time Elapsed'], ['rem', 'Track Time Remaining'], ['disc', 'Disc Time Remaining'], '|', ['random', 'Random Track Order'], ['cont', 'Continuous Play'], ['intro', 'Intro Play']].map(x => x === '|' ? '<span class="ct-c-sep"></span>' : `<button type="button" class="ct-c-tb" data-tb="${x[0]}" title="${x[1]}" aria-label="${x[1]}">${TBI[x[0]]}</button>`).join('')}</div>
      <div class="ct-c-top">
        <div class="ct-c-lcd"><canvas width="156" height="52" aria-label="Display"></canvas></div>
        <div class="ct-c-btns">
          <button type="button" class="ct-c-b ct-c-play" data-b="play" title="Play" aria-label="Play">${BTN.play}</button><button type="button" class="ct-c-b" data-b="pause" title="Pause" aria-label="Pause">${BTN.pause}</button><button type="button" class="ct-c-b" data-b="stop" title="Stop" aria-label="Stop">${BTN.stop}</button>
          <button type="button" class="ct-c-b" data-b="prev" title="Previous Track" aria-label="Previous Track">${BTN.prev}</button><button type="button" class="ct-c-b" data-b="back" title="Skip Backwards" aria-label="Skip Backwards">${BTN.back}</button><button type="button" class="ct-c-b" data-b="fwd" title="Skip Forwards" aria-label="Skip Forwards">${BTN.fwd}</button><button type="button" class="ct-c-b" data-b="next" title="Next Track" aria-label="Next Track">${BTN.next}</button><button type="button" class="ct-c-b" data-b="eject" title="Eject" aria-label="Eject">${BTN.eject}</button>
        </div>
      </div>
      <div class="ct-c-info">
        <label><span><u>A</u>rtist:</span><select class="ct-c-artist"></select></label>
        <label><span><u>T</u>itle:</span><input type="text" class="ct-c-title" readonly></label>
        <label><span>Trac<u>k</u>:</span><select class="ct-c-track"></select></label>
      </div>`;
    w.body.appendChild(root);
    const $ = s => root.querySelector(s);
    const lcd = $('canvas'), selArtist = $('.ct-c-artist'), inTitle = $('.ct-c-title'), selTrack = $('.ct-c-track');
    const S = { disc: null, ct: 0, hidden: false, pos: 0, playing: false, paused: false, t0: 0, reading: false, order: [], names: {}, dataTimer: 0, skipAt: 0, msg: '', msgUntil: 0 };
    const status = t => { if (w.status) w.status.textContent = t; };

    // ---- what is playing
    const trackObj = () => S.hidden ? HIDDEN : (S.disc && S.disc.tracks ? S.disc.tracks[S.ct] : null);
    const trackName = i => (S.names[i] || (S.disc.id === 'mix' ? 'Track ' + (i + 1) : S.disc.tracks[i].title));
    const limit = t => P.intro && !S.hidden ? Math.min(t.len, P.introLen) : t.len;
    const isOurs = () => /^carta_cd_/.test(Sound.music.playing || '');
    function startMusic() {
      const t = trackObj(); if (!t || t.data) return;
      const per = t.L.length * t.step, inLoop = S.pos % per;
      let k = Math.floor(inLoop / t.step); k -= k % 2;
      const base = Math.floor(S.pos / per) * per; S.pos = base + k * t.step;
      if (k === 0) Sound.music.play(t.tune);
      else { Sound.addTune('carta_cd_seek', { lead: rot(t.L, k), bass: rot(t.B, k / 2), step: t.step, hats: t.hats }); Sound.music.play('carta_cd_seek'); }
      S.t0 = performance.now() - S.pos * 1000;
    }
    function stopMusic() { if (isOurs()) Sound.music.stop(); clearTimeout(S.dataTimer); }
    function play() {
      if (S.reading) return;
      if (!S.disc) return openShoebox();
      if (!S.disc.audio) return Desk.msgbox('CD Player', S.disc.cracked ? 'The CD Player cannot read the disc in drive D:.\n\nIt has a crack in it.' : 'Data or no disc loaded.\n\nPlease insert an audio compact disc.', 'warn');
      if (S.playing) return;
      if (!Sound.on) C.sfxHint('CD Player');
      S.playing = true; S.paused = false;
      const t = trackObj();
      if (t.data) return playData();
      startMusic(); if (S.hidden) C.secret('track0');
      draw();
    }
    function playData() { // what a data track sounds like through a sound card that really shouldn't be playing it
      S.t0 = performance.now() - S.pos * 1000;
      if (Sound.on) for (let i = 0; i < 28; i++) setTimeout(() => { if (S.playing) Sound.note(200 + Math.random() * 3000, 0.06, i % 3 ? 'sawtooth' : 'square'); }, i * 55);
      S.dataTimer = setTimeout(() => {
        if (w.closed) return; S.playing = false; S.pos = 0; C.secret('datatrack');
        Desk.msgbox('CD Player', 'Track 01 is a DATA track. It has pictures of the band on it, not music.\n\nPlaying it through the speakers sounds like a modem eating a fax machine. Skipping to track 02.', 'warn');
        S.ct = 1; syncTrack(); draw();
      }, 1700);
      draw();
    }
    function pause() { if (!S.disc || !S.disc.audio) return; if (S.playing) { S.pos = (performance.now() - S.t0) / 1000; stopMusic(); S.playing = false; S.paused = true; } else if (S.paused) play(); draw(); }
    function stop() { stopMusic(); S.playing = false; S.paused = false; S.pos = 0; if (S.hidden) { S.hidden = false; S.ct = S.order[0] || 0; } draw(); }
    function goTrack(i, keepPlaying) { const was = S.playing || keepPlaying; stopMusic(); S.playing = false; S.hidden = false; S.ct = i; S.pos = 0; syncTrack(); if (was) play(); else draw(); }
    function nextIdx() {
      const ord = S.order.length ? S.order : S.disc.tracks.map((_, i) => i); const cur = S.hidden ? -1 : ord.indexOf(S.ct);
      if (P.random && ord.length > 1) { let n; do { n = ord[Math.floor(Math.random() * ord.length)]; } while (n === S.ct); return n; }
      if (cur + 1 < ord.length) return ord[cur + 1];
      return P.cont ? ord[0] : -1;
    }
    function next(auto) {
      if (!S.disc || !S.disc.audio) return;
      if (S.hidden) { const was = S.playing; S.hidden = false; return goTrack(S.order[0] || 0, was); }
      const n = nextIdx();
      if (n < 0) { if (auto) { stop(); S.ct = S.order[0] || 0; syncTrack(); status('End of disc.'); draw(); } return; }
      goTrack(n, auto || S.playing);
    }
    function prev() {
      if (!S.disc || !S.disc.audio) return;
      const pos = curPos();
      if (pos > 2 && !S.hidden) { const was = S.playing; stopMusic(); S.playing = false; S.pos = 0; if (was) play(); else draw(); return; }
      if (S.hidden) return;
      const ord = S.order.length ? S.order : S.disc.tracks.map((_, i) => i), i = ord.indexOf(S.ct);
      if (S.ct === 0 && S.disc.pregap) return enterHidden(S.playing);
      if (i > 0) goTrack(ord[i - 1], S.playing);
    }
    function enterHidden(keep) { // there's music hiding before track 1. Real 90s CDs did this!
      const was = S.playing || keep; stopMusic(); S.playing = false; S.hidden = true; S.pos = 0; syncTrack(); status('Track 00?! You found the hidden track in the pregap.'); if (was) play(); else draw();
    }
    function curPos() { return S.playing ? (performance.now() - S.t0) / 1000 : S.pos; }
    function skip(d) {
      if (!S.disc || !S.disc.audio || S.reading) return;
      const t = trackObj(); let pos = curPos() + d;
      if (pos < 0) { if (!S.hidden && S.ct === 0 && S.disc.pregap) return enterHidden(S.playing); pos = 0; }
      pos = Math.min(pos, limit(t) - 0.5);
      S.pos = pos; if (S.playing) { if (t.data) { S.t0 = performance.now() - pos * 1000; } else startMusic(); } draw();
    }

    // ---- the display, the dropdowns and the status bar
    function syncTrack() {
      if (!S.disc) { selArtist.innerHTML = '<option>Data or no disc loaded</option>'; inTitle.value = ''; selTrack.innerHTML = '<option></option>'; return; }
      selArtist.innerHTML = `<option>${esc(S.disc.artist)} &lt;D:&gt;</option>`; inTitle.value = S.disc.title;
      if (!S.disc.tracks) { selTrack.innerHTML = '<option>(no audio tracks)</option>'; return; }
      selTrack.innerHTML = (S.hidden ? `<option value="h">[00] ${esc(HIDDEN.title)}</option>` : '') + S.disc.tracks.map((t, i) => `<option value="${i}">[${String(i + 1).padStart(2, '0')}] ${esc(trackName(i))}</option>`).join('');
      selTrack.value = S.hidden ? 'h' : String(S.ct);
    }
    selTrack.addEventListener('change', () => { if (selTrack.value !== 'h') goTrack(+selTrack.value); });
    function discLeft() { const t = trackObj(); const ord = S.order.length ? S.order : S.disc.tracks.map((_, i) => i); let s = t ? limit(t) - curPos() : 0; const i = ord.indexOf(S.ct); if (!S.hidden) for (let j = i + 1; j < ord.length; j++) { const tt = S.disc.tracks[ord[j]]; s += tt.data ? 0 : limit(tt); } return s; }
    function draw() {
      const now = performance.now(), fl = { random: P.random, cont: P.cont, intro: P.intro, blink: S.paused && Math.floor(now / 500) % 2 === 0 };
      if (S.msgUntil > now) { fl.msg = S.msg; fl.msgCol = '#ff6060'; }
      else if (S.reading) fl.msg = 'READING';
      else if (S.paused) fl.msg = 'PAUSED';
      if (S.reading) { drawLCD(lcd, '--', '--:--', Object.assign(fl, { blink: Math.floor(now / 250) % 2 === 0 })); return; }
      if (!S.disc || !S.disc.audio) { drawLCD(lcd, '--', '--:--', Object.assign(fl, { msg: S.disc ? (S.disc.cracked ? 'ERROR' : 'DATA') : 'NO DISC' })); status(S.disc ? (S.disc.cracked ? 'Cannot read the disc in drive D:.' : 'Data or no disc loaded. Please insert an audio compact disc.') : 'Please insert an audio compact disc.'); return; }
      const t = trackObj(), pos = Math.min(curPos(), t.len), num = S.hidden ? '00' : String(S.ct + 1).padStart(2, '0');
      const time = P.mode === 'el' ? mmss(pos) : P.mode === 'rem' ? '-' + mmss(limit(t) - pos) : mmss(discLeft());
      drawLCD(lcd, num, time, fl);
      if (P.statusbar) status(`Total Play: ${mmss(S.disc.tracks.reduce((s, x) => s + (x.data ? 0 : x.len), 0))} m:s\u2003\u2003Track: ${mmss(t.len)} m:s${S.disc.scratched && S.playing ? '\u2003\u2003(skipping...)' : ''}`);
      root.querySelectorAll('[data-b]').forEach(b => b.classList.toggle('on', (b.dataset.b === 'play' && S.playing) || (b.dataset.b === 'pause' && S.paused)));
    }
    function syncTb() { root.querySelectorAll('[data-tb]').forEach(b => { const k = b.dataset.tb; b.classList.toggle('on', k === P.mode || (k === 'random' && P.random) || (k === 'cont' && P.cont) || (k === 'intro' && P.intro)); }); $('.ct-c-tbar').hidden = !P.toolbar; $('.ct-c-info').hidden = !P.info; const sb = w.el.querySelector('.appstatus'); if (sb) sb.style.display = P.statusbar ? '' : 'none'; }
    const tick = setInterval(() => {
      if (w.closed) return;
      if (S.playing && S.disc && S.disc.audio) {
        const t = trackObj(), pos = curPos();
        if (!t.data && pos >= limit(t)) { if (S.hidden) { S.hidden = false; goTrack(S.order[0] || 0, true); } else next(true); }
        else if (S.disc.scratched && !t.data && pos > S.skipAt) { // the scratched CD skips
          S.skipAt = pos + 3 + Math.random() * 5;
          if (pos > 2) { S.pos = Math.max(0, pos - 0.5 - Math.random() * 1.5); startMusic(); S.msg = 'SKIP!'; S.msgUntil = performance.now() + 700; Sound.play('zap'); }
        }
      }
      draw();
    }, 200);
    w.cleanup.push(() => { clearInterval(tick); clearTimeout(S.dataTimer); if (P.stopOnExit || !S.playing) stopMusic(); else Desk.toast('CD Player', 'The CD keeps playing. (You unticked "Stop CD playing on exit". Press Stop in a new CD Player to make it stop.)', 5000); Sound.setVolume(1); window.removeEventListener('keydown', kd, true); window.removeEventListener('keyup', ku, true); C.api.cd = null; });

    // ---- buttons (Skip Backwards/Forwards repeat while held, like the real thing)
    root.querySelectorAll('[data-b]').forEach(b => {
      const k = b.dataset.b;
      if (k === 'back' || k === 'fwd') {
        let rep = 0; const go = () => skip(k === 'back' ? -3 : 3);
        b.addEventListener('pointerdown', ev => { ev.preventDefault(); Sound.play('click'); go(); clearInterval(rep); rep = setInterval(go, 220); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => b.addEventListener(e, () => clearInterval(rep)));
        b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') go(); });
        return;
      }
      b.addEventListener('click', ev => { Sound.play('click'); ({ play, pause, stop, prev: () => prev(), next: () => next(false), eject: () => eject(ev.shiftKey) })[k](); });
    });
    root.querySelectorAll('[data-tb]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.tb; Sound.play('click');
      if (k === 'list') return editPlayList();
      if (k === 'el' || k === 'rem' || k === 'disc') P.mode = k; else P[k] = !P[k];
      saveP(); syncTb(); draw();
    }));
    let shiftDown = false; const kd = ev => { if (ev.key === 'Shift') shiftDown = true; }, ku = ev => { if (ev.key === 'Shift') shiftDown = false; };
    window.addEventListener('keydown', kd, true); window.addEventListener('keyup', ku, true);
    w.el.addEventListener('keydown', ev => { if (ev.target.closest('select,input')) return; if (ev.key === ' ') { ev.preventDefault(); S.playing ? pause() : play(); } });

    // ---- discs: eject, the shoebox, inserting, AutoRun
    function eject(shift) {
      if (S.reading) return;
      if (!S.disc) return openShoebox(shift);
      stopMusic(); S.playing = false; S.paused = false; S.hidden = false; S.disc = null; S.pos = 0;
      Sound.play('turn'); root.classList.add('ct-c-tray'); setTimeout(() => root.classList.remove('ct-c-tray'), 600);
      syncTrack(); draw(); status('Tray open. Please insert an audio compact disc. (Press Eject again to pick one from the shoebox.)');
    }
    function insert(id, shift) {
      const d = DISCS[id]; if (!d) return;
      stopMusic(); S.playing = false; S.paused = false; S.hidden = false; S.disc = null; S.reading = true; S.pos = 0; syncTrack();
      Sound.play('turn'); status('Reading the disc in drive D:...');
      const skipAuto = shift || shiftDown;
      setTimeout(() => {
        if (w.closed) return; S.reading = false;
        if (d.cracked) { S.disc = d; syncTrack(); draw(); C.secret('disc2'); Sound.play('uhoh'); Desk.msgbox('D:\\', 'D:\\ is not accessible.\n\nThe device is not ready.\n\n(That\'s JackCarta 99 Disc 2. It has a crack across it and a tea ring on the label. Somebody has been using it as a COASTER.)', 'warn'); return; }
        S.disc = d; S.ct = d.audio ? (d.tracks[0].data ? 1 : 0) : 0; S.names = store.get('cd_names_' + d.id, {}); S.order = d.tracks ? (store.get('cd_order_' + d.id, null) || d.tracks.map((_, i) => i)).filter(i => i >= 0 && i < d.tracks.length) : []; S.skipAt = 3;
        syncTrack(); draw();
        if (skipAuto && (d.autorun || d.id === 'mix')) { C.secret('noautorun'); Desk.toast('CD Player', 'AutoRun skipped. (You held down Shift while the disc went in. Old trick!)', 5000); return; }
        if (d.id === 'mix') { status('Audio CD detected. Playing...'); play(); return; }
        if (d.autorun) autoRun(d);
      }, 1300);
    }
    function openShoebox(shift) {
      const b = h('div', 'ct-c-box');
      b.innerHTML = `<p class="ct-c-boxh">The shoebox next to the computer. Pick a disc to put in drive D:.</p><div class="ct-c-boxl">${SHOEBOX.map(id => `<button type="button" class="ct-c-boxi" data-id="${id}"><span class="ct-c-boxa"></span><span><b>${esc(id === 'mix' ? "Dad's Car Mix (CD-R)" : DISCS[id].artist + ' - ' + DISCS[id].title)}</b><small>${esc(DISCS[id].blurb)}</small></span></button>`).join('')}</div><div class="row" style="justify-content:flex-end;margin-top:8px"><button type="button" class="btn ct-c-boxc">Close Tray</button></div>`;
      const bw = A.win('Shoebox', b, { w: 360, noResize: true, noMax: true, noMin: true, escClose: true, icon: C.ICON.cdplayer });
      b.querySelectorAll('.ct-c-boxi').forEach(x => { const art = discArt(x.dataset.id); art.className = 'ct-px'; x.querySelector('.ct-c-boxa').appendChild(art); x.addEventListener('click', ev => { bw.close(); insert(x.dataset.id, ev.shiftKey || shift); }); });
      b.querySelector('.ct-c-boxc').addEventListener('click', () => { bw.close(); Sound.play('turn'); status('Tray closed. No disc. The tray is very empty.'); });
    }
    function autoRun(d) {
      const b = h('div', 'ct-c-ar ct-c-ar-' + d.id), gub = d.id === 'gubbinz';
      b.innerHTML = `<div class="ct-c-arart"><canvas width="128" height="128" class="ct-px"></canvas></div><div class="ct-c-arr">
        <div class="ct-c-art1">${gub ? 'GUBBINZ <span>&amp; THE ROBOTS</span>' : 'Jack<b>Carta</b><sup>99</sup>'}</div>
        <div class="ct-c-art2">${gub ? 'GREATEST HITS &bull; ENHANCED CD' : 'Disc 1 &bull; The Multimedia Encyclopedia'}</div>
        <p>${esc(gub ? 'Nine smash hits from the only band with four tin robots in it. Put this CD in your computer for bonus band photos!' : 'Welcome to JackCarta 99! It is already installed on this computer, so you can start reading right away.')}</p>
        <div class="ct-c-arb"><button type="button" class="ct-c-arbtn" data-ar="go"><i>&#9654;</i>${gub ? 'Play the CD' : 'Run JackCarta 99'}</button><button type="button" class="ct-c-arbtn" data-ar="explore"><i>&#128193;</i>Explore this CD</button><button type="button" class="ct-c-arbtn" data-ar="exit"><i>&#10006;</i>Exit</button></div></div>`;
      const aw = A.win(gub ? 'Gubbinz & The Robots - Enhanced CD' : 'JackCarta 99 Setup', b, { w: 440, noResize: true, noMax: true, icon: gub ? C.ICON.cdplayer : C.ICON.carta, onClose: () => cancelAnimationFrame(raf) });
      const cv = b.querySelector('canvas'), g = cv.getContext('2d'), art = discArt(d.id); g.imageSmoothingEnabled = false; let raf = 0, a = 0;
      const spin = () => { if (aw.closed) return; a += 0.02; g.clearRect(0, 0, 128, 128); g.save(); g.translate(64, 64); g.rotate(a); g.scale(1.3, 1.3); g.drawImage(art, -48, -48); g.restore(); raf = requestAnimationFrame(spin); }; spin();
      (gub ? [392, 523, 659, 784, 1047] : [523, 659, 784, 1047, 988, 1319]).forEach((f, i) => setTimeout(() => !aw.closed && Sound.note(f, 0.2, 'square'), i * 120));
      b.querySelectorAll('[data-ar]').forEach(x => x.addEventListener('click', () => {
        const k = x.dataset.ar; Sound.play('click');
        if (k === 'exit') return aw.close();
        if (k === 'explore') return Desk.msgbox('D:\\', gub ? 'Contents of D:\\ (GUBBINZ)\n\n  AUTORUN.INF\n  BANDPICS\\  (12 photos of robots pulling faces)\n  LYRICS.TXT  ("Beep. Boop. Beep." x 40)\n  TRACK01.CDA ... TRACK10.CDA\n\n1 data track, 9 audio tracks.' : 'Contents of D:\\ (JCARTA99_1)\n\n  AUTORUN.INF\n  SETUP.EXE\n  JCARTA99.EXE\n  ARTICLES.DAT  (412 MB!)\n  MEDIA\\\n\nDisc 2 is needed for nothing. That\'s lucky, considering.', 'info');
        aw.close();
        if (gub) { w.restore(); play(); } else A.open('carta.encyc');
      }));
    }

    // ---- dialogs: Edit Play List, Preferences, Volume Control
    function editPlayList() {
      if (!S.disc || !S.disc.tracks) return Desk.msgbox('CD Player', 'Data or no disc loaded.\n\nPlease insert an audio compact disc.', 'warn');
      const d = S.disc; let order = S.order.slice(), names = Object.assign({}, S.names);
      const b = h('div', 'ct-c-pl');
      b.innerHTML = `<div class="row ct-c-plr"><span>Drive:</span><span class="field ct-c-plf">\\Device\\CdRom0 &lt;D:&gt;</span></div>
        <div class="row ct-c-plr"><span>Artist:</span><input type="text" class="ct-c-pla" value="${esc(d.artist)}" disabled></div>
        <div class="row ct-c-plr"><span>Title:</span><input type="text" class="ct-c-plt" value="${esc(d.title)}" disabled></div>
        <div class="ct-c-pll"><div><b>Play List:</b><div class="field ct-c-plbox" data-l="play"></div></div>
          <div class="ct-c-plmid"><button type="button" class="btn" data-p="add">&larr; Add</button><button type="button" class="btn" data-p="rem">Remove &rarr;</button><button type="button" class="btn" data-p="clear">Clear All</button><button type="button" class="btn" data-p="reset">Reset</button></div>
          <div><b>Available Tracks:</b><div class="field ct-c-plbox" data-l="avail"></div></div></div>
        <div class="row ct-c-plr"><span>Track <b class="ct-c-pln">01</b>:</span><input type="text" class="ct-c-plname" maxlength="40"><button type="button" class="btn" data-p="name">Set Name</button></div>
        <div class="row" style="justify-content:flex-end;margin-top:8px"><button type="button" class="btn" data-p="ok">OK</button><button type="button" class="btn" data-p="cancel">Cancel</button></div>`;
      const pw = A.win('Disc Settings', b, { w: 430, noResize: true, noMax: true, noMin: true, escClose: true, icon: C.ICON.cdplayer });
      let selP = -1, selA = 0;
      const nm = i => names[i] || (d.id === 'mix' ? 'Track ' + (i + 1) : d.tracks[i].title);
      function render() {
        b.querySelector('[data-l=play]').innerHTML = order.map((t, j) => `<div class="ct-c-pli${j === selP ? ' sel' : ''}" data-j="${j}">${String(t + 1).padStart(2, '0')} ${esc(nm(t))}</div>`).join('');
        b.querySelector('[data-l=avail]').innerHTML = d.tracks.map((t, i) => `<div class="ct-c-pli${i === selA ? ' sel' : ''}" data-i="${i}">${String(i + 1).padStart(2, '0')} ${esc(nm(i))}</div>`).join('');
        b.querySelectorAll('[data-j]').forEach(e => e.addEventListener('click', () => { selP = +e.dataset.j; selA = order[selP]; render(); }));
        b.querySelectorAll('[data-i]').forEach(e => e.addEventListener('click', () => { selA = +e.dataset.i; selP = -1; render(); }));
        b.querySelector('.ct-c-pln').textContent = String(selA + 1).padStart(2, '0'); b.querySelector('.ct-c-plname').value = nm(selA);
      }
      b.querySelectorAll('[data-p]').forEach(x => x.addEventListener('click', () => {
        const k = x.dataset.p;
        if (k === 'add') order.push(selA); else if (k === 'rem' && selP >= 0) { order.splice(selP, 1); selP = -1; } else if (k === 'clear') { order = []; selP = -1; } else if (k === 'reset') { order = d.tracks.map((_, i) => i); names = {}; }
        else if (k === 'name') { const v = b.querySelector('.ct-c-plname').value.trim(); if (v) names[selA] = v; else delete names[selA]; }
        else if (k === 'cancel') return pw.close();
        else if (k === 'ok') { S.order = order.length ? order : d.tracks.map((_, i) => i); S.names = names; store.set('cd_order_' + d.id, S.order); store.set('cd_names_' + d.id, names); syncTrack(); draw(); return pw.close(); }
        render();
      }));
      render();
    }
    function prefs() {
      const b = h('div', 'ct-c-pref');
      b.innerHTML = `<div class="group"><span class="lg">Options</span><label><input type="checkbox" class="ct-c-p1" ${P.stopOnExit ? 'checked' : ''}> Stop CD playing on exit</label><label><input type="checkbox" checked disabled> Save settings on exit</label><label><input type="checkbox" checked> Show tool tips</label></div>
        <div class="row" style="margin:8px 0">Intro play length (seconds): <input type="number" class="ct-c-p2" min="5" max="15" value="${P.introLen}" style="width:48px"></div>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-o="ok">OK</button><button type="button" class="btn" data-o="cancel">Cancel</button></div>`;
      const pw = A.win('Preferences', b, { w: 300, noResize: true, noMax: true, noMin: true, escClose: true, icon: C.ICON.cdplayer });
      b.querySelector('[data-o=cancel]').addEventListener('click', pw.close);
      b.querySelector('[data-o=ok]').addEventListener('click', () => { P.stopOnExit = b.querySelector('.ct-c-p1').checked; P.introLen = Math.max(5, Math.min(15, +b.querySelector('.ct-c-p2').value || 10)); saveP(); pw.close(); });
    }
    function volume() {
      const b = h('div', 'ct-c-vol');
      b.innerHTML = `<div class="ct-c-volc"><b>CD Audio</b><input type="range" min="0" max="100" value="${P.vol}" aria-label="Volume"><label><input type="checkbox"> Mute</label></div>`;
      A.win('Volume Control', b, { w: 160, noResize: true, noMax: true, icon: C.ICON.cdplayer });
      const r = b.querySelector('input[type=range]'), m = b.querySelector('input[type=checkbox]');
      const apply = () => { P.vol = +r.value; saveP(); Sound.setVolume(m.checked ? 0 : P.vol / 100); };
      r.addEventListener('input', apply); m.addEventListener('change', apply);
    }

    // ---- menus
    A.menubar(w, [
      ['Disc', () => [{ label: 'Insert Disc from Shoebox...', act: () => openShoebox() }, { label: S.disc ? 'Eject' : 'Eject (tray is empty)', dis: !S.disc, act: () => eject() }, '-', { label: 'Edit Play List...', act: editPlayList }, '-', { label: 'Exit', act: () => w.close() }]],
      ['View', () => [{ label: 'Toolbar', chk: P.toolbar, act: () => { P.toolbar = !P.toolbar; saveP(); syncTb(); } }, { label: 'Disc/Track Info', chk: P.info, act: () => { P.info = !P.info; saveP(); syncTb(); } }, { label: 'Status Bar', chk: P.statusbar, act: () => { P.statusbar = !P.statusbar; saveP(); syncTb(); } }, '-',
        { label: 'Track Time Elapsed', rad: P.mode === 'el', act: () => { P.mode = 'el'; saveP(); syncTb(); draw(); } }, { label: 'Track Time Remaining', rad: P.mode === 'rem', act: () => { P.mode = 'rem'; saveP(); syncTb(); draw(); } }, { label: 'Disc Time Remaining', rad: P.mode === 'disc', act: () => { P.mode = 'disc'; saveP(); syncTb(); draw(); } }, '-', { label: 'Volume Control', act: volume }]],
      ['Options', () => [{ label: 'Random Order', chk: P.random, act: () => { P.random = !P.random; saveP(); syncTb(); draw(); } }, { label: 'Continuous Play', chk: P.cont, act: () => { P.cont = !P.cont; saveP(); syncTb(); draw(); } }, { label: 'Intro Play', chk: P.intro, act: () => { P.intro = !P.intro; saveP(); syncTb(); draw(); } }, '-', { label: 'Preferences...', act: prefs }]],
      ['Help', [{ label: 'Help Topics', act: () => Desk.msgbox('CD Player Help', 'Put an audio CD in drive D: and press Play.\n\nThe buttons on the bottom row: Previous Track, Skip Backwards, Skip Forwards, Next Track, Eject.\nHold the skip buttons down to keep skipping.\n\nRandom Order shuffles the tracks. Continuous Play starts again at the end. Intro Play plays the start of each track.\n\nTip: hold down SHIFT while you put a CD in to stop AutoRun.', 'info') }, '-', { label: 'About CD Player', act: () => Desk.msgbox('About CD Player', 'JackOS CD Player\nVersion 4.10\n\nPlays audio compact discs through your sound card. Or through the little headphone socket on the front of the CD-ROM drive, if you have one. (You do. Nobody uses it.)', 'info') }]],
    ]);

    // ---- start
    function take(a) {
      w.restore();
      if (a === 'insert') return insert('gubbinz', shiftDown);
      if (a && DISCS[a]) return insert(a, shiftDown);
    }
    C.api.cd = { alive: () => !w.closed, take, insert, state: S };
    syncTb(); syncTrack(); draw();
    if (P.vol !== 100) Sound.setVolume(P.vol / 100);
    if (arg) take(arg); else status('Please insert an audio compact disc. (Press Eject to open the shoebox.)');
  };
})();

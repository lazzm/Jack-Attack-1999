/* events-cat: the numbers and the music for JackNet Events (shared by the browser and mods/events.js).
 *   EVENTS  the weekly timetable (UK clock time, on the PC's own 1999 calendar: a "Friday" is a day that was a Friday in 1999)
 *   THEMES  Hangout Theme Night themes (one a week, in turn)
 *   TUNES   Radio Jack's Listening Party playlist: ten ORIGINAL chiptunes, written as scale degrees so the browser can
 *           sequence them with WebAudio and the server knows exactly how long each one lasts (for the synced radio)
 *   PET     Byte, the JackNet's communal pet: growth stages, care cooldowns and milestones
 * Melody tokens (8 per bar, one per eighth note): 1-7 scale degree (#/b in front for sharp/flat, ' or , after for an
 * octave up/down), - holds the note before, . is a rest. Chords: one scale degree per bar (a triad on that degree). */
(function (root) {
  'use strict';
  // ---------------------------------------------------------------- the weekly timetable
  // dow: 0 Sunday .. 6 Saturday (1999 calendar); first: the first such day of the month only; len: minutes
  const EVENTS = [
    { id: 'theme', n: 'Hangout Theme Night', short: 'Theme Night', dow: 3, h: 19, mi: 0, len: 120, ch: 'JN2', where: 'The Hangout (www.jackattack.jnet/hangout.htm)',
      d: 'Every Wednesday the Hangout dresses up. A new theme every week, decorations, costumes, DJ Gubbinz on the decks and a spot prize for one lucky partygoer.',
      prize: 'Rupees for turning up (5 minutes or more), plus a Best Costume spot prize' },
    { id: 'req', n: 'The Request Hour on Radio Jack', short: 'Request Hour', dow: 4, h: 20, mi: 0, len: 60, ch: 'RJ1', where: 'Radio Jack Listening Party (www.listeningparty.wubwub)',
      d: 'Radio Jack hands the decks to YOU. Request a tune, add a dedication and hear it read out on everybody\'s screen. Requests come round three times faster tonight.',
      prize: 'Rupees for listening, and a spot prize for one listener' },
    { id: 'lan', n: 'JACKREAL TOURNAMENT LAN NIGHT', short: 'LAN Night', dow: 5, h: 20, mi: 0, len: 60, ch: 'JN1', where: 'JackReal Tournament (Start > Programs > Games)',
      d: 'Friday night is frag night! Host or join any JackReal Tournament server. Every frag tonight counts towards the LAN Night league. Bots fill the empty seats, so there is always someone to frag.',
      prize: 'Rupees and Lootlings for the top 3 fraggers, Rupees for everyone who plays' },
    { id: 'quiz', n: 'GRAND QUIZ NIGHT with QuizJack', short: 'Grand Quiz', dow: 0, h: 19, mi: 0, len: 12, ch: 'JN1', where: 'JackIRC #quiznight (Start > Run > quiznight)',
      d: 'The big one. QuizJack\'s Sunday 7pm quiz in #quiznight: ten questions about 1999. Every right answer tonight counts towards the Grand Quiz table.',
      prize: 'Rupees and Lootlings for the top 3 brainboxes, Rupees for everyone who plays' },
    { id: 'cd', n: 'COVER CD LAUNCH PARTY', short: 'CD Party', dow: 6, first: true, h: 18, mi: 0, len: 60, ch: 'JN2', where: 'The party room (What\'s On > JOIN) and this month\'s cover CD',
      d: 'The first Saturday of every month, the new JACK ATTACK! cover CD launches with a party. Pull party poppers to fill the Party-o-Meter. Fill it and the disc launches. Everyone at the party gets a goodie bag.',
      prize: 'Rupees for partying, a bonus goodie bag if the disc launches, Lootlings for the top poppers' },
  ];
  const THEMES = [
    { id: 'space', n: 'SPACE NIGHT', col: '#0a0a3a', acc: '#7ec8ff', deco: 'stars', hat: 'helmet', d: 'Come as an astronaut, an alien or a very small planet.', prompts: ['If you could fly to any planet, which one? (Pluto counts. It is 1999.)', 'Best space film this year? No spoilers!', 'Would you go to the space station if it had a games room?'] },
    { id: 'pj', n: 'PYJAMA PARTY', col: '#5a2a7a', acc: '#ffb0e0', deco: 'zzz', hat: 'nightcap', d: 'Dressing gowns, slippers and midnight feasts (lights out at 9, Mom says).', prompts: ['Best midnight feast snack?', 'Ghost stories: who knows a good one?', 'Who can stay up latest? (Not you. Mom is watching.)'] },
    { id: 'arcade', n: 'RETRO ARCADE NIGHT', col: '#1a0a2a', acc: '#ff3cff', deco: 'pixels', hat: 'cap', d: 'Neon, high scores and 10p coins. Old games only (old = before 1990).', prompts: ['Oldest game you have ever played?', 'What is your best ever high score, and on what?', 'Which arcade machine would you have in your bedroom?'] },
    { id: 'monster', n: 'MONSTER MASH', col: '#1a2a0a', acc: '#a0ff40', deco: 'bats', hat: 'horns', d: 'Monsters, mummies and Mom\'s old curtains as a cape.', prompts: ['Scariest film you have seen (that you were allowed to)?', 'Vampire, werewolf or mummy?', 'What is under YOUR bed? (Mine: three socks and a Game Lad.)'] },
    { id: 'beach', n: 'BEACH PARTY', col: '#0a6aa0', acc: '#ffe060', deco: 'sun', hat: 'shades', d: 'Sunglasses on, it is summer in the Hangout. Even if it is raining outside. It is raining outside.', prompts: ['Best seaside holiday ever?', 'Sandcastle or rock pools?', 'Ice cream flavour of 1999?'] },
    { id: 'robot', n: 'ROBOT NIGHT', col: '#2a2a2a', acc: '#ff8000', deco: 'bolts', hat: 'antenna', d: 'Beep boop. Cardboard boxes and tin foil, please. Talk like a robot all night.', prompts: ['If you built a robot, what would it do? (Homework is allowed.)', 'Best robot in a film or on telly?', 'Would your robot be friendly? Be honest.'] },
    { id: 'pirate', n: 'PIRATE NIGHT', col: '#3a2410', acc: '#ffd400', deco: 'skull', hat: 'tricorn', d: 'Arr! Eye patches, parrots and treasure maps of the back garden.', prompts: ['What is your pirate name?', 'Where would you bury YOUR treasure?', 'Parrot or monkey?'] },
    { id: 'disco', n: 'DISCO FEVER', col: '#3a0a3a', acc: '#ffff40', deco: 'ball', hat: 'afro', d: 'Glitter ball up, flares on. Everybody do the robot (wrong theme, still allowed).', prompts: ['Best dance move?', 'Song you would ask the DJ for (no real song names, make one up!)', 'Who in your family dances the worst at weddings?'] },
  ];
  // the theme for a given 1999 week (weeks counted from 4 Jan 1999, a Monday)
  const themeOf = ts99 => THEMES[((Math.floor((ts99 - Date.UTC(1999, 0, 4)) / (7 * 864e5)) % THEMES.length) + THEMES.length) % THEMES.length];

  // ---------------------------------------------------------------- the music
  const SCALES = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10], dor: [0, 2, 3, 5, 7, 9, 10], mix: [0, 2, 4, 5, 7, 9, 10], hmin: [0, 2, 3, 5, 7, 8, 11] };
  // drum patterns, one char per eighth: x kick+hat, k kick, s snare, y snare+hat, h hat, . nothing (fill: last bar of a section)
  const DRUMS = {
    pop: ['x.h.y.h.', 'x.hxy.h.', 'x.h.y.yy'],
    shuffle: ['x.hhy.hh', 'x.hhy.hk', 'x.hhyyyy'],
    drive: ['xhxhyhxh', 'xhxhyhxy', 'xhyhyyyy'],
    soft: ['k...h...', 'k...h..h', 'k...h.hh'],
    stomp: ['x.x.y.x.', 'x.x.y.xx', 'yyyyyyyy'],
    march: ['x.hhy.h.', 'x.hhy.hh', 'yy.yyy.y'],
    polka: ['x.y.x.y.', 'x.y.x.yy', 'x.y.yyyy'],
    none: ['........', '........', '........'],
  };
  const T = (id, n, a, bpm, key, sc, o) => Object.assign({ id, n, a, bpm, key, sc, lead: 'square', bass: 'oct', dr: 'pop', arp: 0, sw: 0, vib: 0, rep: 2, form: 'AABA' }, o);
  const TUNES = [
    T('dialup', 'Dial-Up Sunrise', 'DJ Gubbinz & The Modems', 128, 60, 'maj', { arp: 1, notes: 'Bright and bleepy. Written while the modem was connecting, and finished before it did.',
      S: { A: { c: '1 5 6 4', m: ['1 . 3 5 - 3 5 6', '5 - 3 - 2 . 3 .', "6 . 1' 6 5 - 3 5", '4 - 3 - 2 - . .'] },
        B: { c: '4 5 3 6', m: ['6 . 6 5 4 . 4 3', '2 . 2 3 5 - - .', '3 . 3 4 5 . 7 5', '6 - - - 5 . 4 .'] } } }),
    T('floppy', 'Floppy Disk Shuffle', 'The 3½ Inches', 112, 55, 'mix', { dr: 'shuffle', sw: 0.18, bass: 'walk', form: 'AB', rep: 3, notes: 'Bounces along like a floppy in a drive that has seen things. Insert disk 2.',
      S: { A: { c: '1 4 1 5', m: ['5 . 5 6 7 . 6 5', '4 . 4 5 6 - 5 4', '3 . 3 4 5 . 3 1', '2 - 3 - 1 - . .'] },
        B: { c: '4 4 1 5', m: ["1' . 7 6 1' . 7 6", '5 6 5 4 3 - . .', '3 4 5 . 3 4 5 .', '6 - 5 - 2 - - .'] } } }),
    T('neon', 'Neon Arcade', 'Pixel Pete', 150, 57, 'min', { lead: 'sawtooth', dr: 'drive', arp: 1, bass: 'pump', form: 'AABB', notes: 'Fast. Shiny. Like a 10p coin going in for the very last life.',
      S: { A: { c: '1 6 3 7', m: ["1' . 7 1' 5 . 3 5", "6 . 5 6 1' . 6 .", "5 . 3 5 1' - 7 5", "7 . 5 7 2' - 7 ."] },
        B: { c: '4 5 1 1', m: ["4 4 6 4 1' . 6 .", "5 5 7 5 2' . 7 .", "1' . 7 . 6 . 5 .", '3 - - - 1 . . .'] } } }),
    T('rainy', 'Rainy Day Inside', (typeof Cast !== 'undefined' && Cast.t ? Cast.t('{jsister} & The Teapots') : "Jack's Sister & The Teapots"), 92, 53, 'maj', { lead: 'triangle', dr: 'soft', bass: 'half', arp: 1, form: 'AAB', notes: 'For days when it is raining, the telly is boring and Mom says "find something to do".',
      S: { A: { c: '1 3 4 5', m: ['3 - 2 1 2 - 3 -', '5 - - 3 2 - 1 -', '6 - 5 4 3 - 2 1', '2 - - - 5, - - -'] },
        B: { c: '6 4 1 5', m: ["1' - 7 6 5 - 3 -", '4 - 3 2 1 - - -', "3 - 4 5 1' - 6 -", '5 - - - - - . .'] } } }),
    T('boss', "Boss Level (Mom's Coming)", 'The Grot Squad', 160, 52, 'hmin', { dr: 'drive', bass: 'pump', form: 'AAB', notes: 'Footsteps on the stairs. Save the game. SAVE THE GAME.',
      S: { A: { c: '1 1 6 5', m: ['1 . 1 . 3 . 1 .', '2 . 3 . 4 . 3 2', '6 . 6 . 5 . 6 .', "7 - 5 - 7 - 2' -"] },
        B: { c: '4 4 1 5', m: ["4 . 6 . 1' . 6 .", "4 . 6 . 2' - 1' 7", "1' 7 6 5 4 3 2 1", '7, - 2 - 5 - 7 -'] } } }),
    T('dreams', 'Screensaver Dreams', 'The Starfield Orchestra', 84, 50, 'dor', { lead: 'triangle', dr: 'none', bass: 'half', arp: 2, form: 'AABBA', rep: 1, vib: 1, notes: 'Close your eyes and fly through the stars. Move the mouse and it all goes away.',
      S: { A: { c: '1 4 1 7', m: ['5 - - 4 3 - - .', '2 - 3 - 4 - 6 -', '5 - - 4 3 - 1 -', '2 - - - - - . .'] },
        B: { c: '3 4 5 4', m: ["1' - 7 - 6 - 5 -", '6 - 5 - 4 - 2 -', '3 - 4 - 5 - 6 -', '7 - - - 6 - . .'] } } }),
    T('y2k', 'Y2K Countdown Stomp', 'The Millennium Bugs', 140, 50, 'maj', { dr: 'stomp', bass: 'oct', form: 'AB', rep: 3, notes: 'Ten! Nine! Eight! (It does not actually get to zero. Nothing does, round here.)',
      S: { A: { c: '1 1 4 5', m: ["1' . 7 . 6 . 5 .", '4 . 3 . 2 . 1 .', '4 4 . 4 6 6 . 6', '5 - - - 5 . . .'] },
        B: { c: '6 4 1 5', m: ['3 3 3 . 3 3 3 .', '4 3 2 3 1 - - .', "1 3 5 1' 5 3 1 3", '2 - - - 5 . 5 .'] } } }),
    T('cube', "Cube Solver's March", 'The Rubix Six', 120, 58, 'maj', { dr: 'march', bass: 'walk', notes: 'Left, right, left, right. Top layer, middle layer, last layer. Do NOT peel the stickers off.',
      S: { A: { c: '1 4 5 1', m: ['1 . 1 2 3 . 1 .', '4 . 4 3 2 - 4 .', '5 . 5 4 3 . 2 .', '1 - 3 - 1 - . .'] },
        B: { c: '5 1 6 5', m: ['2 . 2 3 4 . 2 .', '3 . 3 4 5 . 3 .', '6 . 5 4 3 . 1 .', '2 - - - 5, . . .'] } } }),
    T('owl', 'Midnight Modem', 'N1GHTOWL', 100, 48, 'min', { lead: 'sawtooth', dr: 'soft', bass: 'half', arp: 2, vib: 1, form: 'AB', rep: 3, notes: 'Sent in on a floppy with no name on it. Just a drawing of an owl. Spooky. Lovely tune though.',
      S: { A: { c: '1 6 4 5', m: ['5 - 4 3 4 - 3 2', '3 - - - 1 - . .', '4 - 3 2 3 - 2 1', '7, - - - 5, - . .'] },
        B: { c: '3 7 6 5', m: ["1' - 7 - 6 - 5 -", '7 - 6 - 5 - 4 -', '3 - 4 - 5 - 6 -', '5 - - - - - . .'] } } }),
    T('polka', 'Pocket Money Polka', "Dave's Uncle's Band", 132, 55, 'maj', { dr: 'polka', bass: 'oom', form: 'AABB', notes: 'Saturday morning, 50p in your pocket and the sweet shop is OPEN.',
      S: { A: { c: '1 5 5 1', m: ['3 . 5 . 5 4 3 2', '2 . 4 . 4 3 2 7,', '7, . 2 . 5 4 3 2', '1 . 3 . 1 . . .'] },
        B: { c: '4 1 5 1', m: ['6 . 6 5 4 . 6 .', '5 . 5 4 3 . 5 .', '4 . 4 3 2 . 7, .', '1 . 5, . 1 . . .'] } } }),
  ];
  // turn a tune into note events. Steps are eighth notes. Returns { step, steps, dur, lead, bass, arp, drums }
  const CACHE = {};
  function compile(t) {
    if (CACHE[t.id]) return CACHE[t.id];
    const sc = SCALES[t.sc] || SCALES.maj, step = 60 / t.bpm / 2;
    const pitch = (deg, oct, acc, base) => base + sc[(deg - 1) % 7] + 12 * oct + acc;
    const lead = [], bass = [], arp = [], drums = [];
    let s = 0, last = null;
    const form = (t.form.repeat(t.rep || 1)).split('');
    form.forEach((sec, fi) => {
      const S = t.S[sec]; if (!S) return;
      const ch = S.c.split(/\s+/).map(Number);
      S.m.forEach((bar, bi) => {
        const toks = bar.trim().split(/\s+/);
        for (let i = 0; i < 8; i++) {
          const k = toks[i] || '.';
          if (k === '-') { if (last) last.len++; }
          else if (k === '.') last = null;
          else {
            const m = /^([#b]?)([1-7])([',]*)$/.exec(k);
            if (!m) { last = null; continue; }
            const oct = (m[3].match(/'/g) || []).length - (m[3].match(/,/g) || []).length, acc = m[1] === '#' ? 1 : m[1] === 'b' ? -1 : 0;
            last = { s: s + i, len: 1, p: pitch(+m[2], oct, acc, t.key + 12) }; lead.push(last);
          }
        }
        // chord for this bar
        const d = ch[bi] || 1, root = t.key - 12 + sc[(d - 1) % 7], third = t.key + sc[(d + 1) % 7] + (d + 1 >= 7 ? 12 : 0), fifth = t.key + sc[(d + 3) % 7] + (d + 3 >= 7 ? 12 : 0);
        const r0 = t.key + sc[(d - 1) % 7];
        const B = t.bass;
        if (B === 'oct') for (let i = 0; i < 8; i++) bass.push({ s: s + i, len: 1, p: root + (i % 2 ? 12 : 0) });
        else if (B === 'pump') for (let i = 0; i < 8; i++) bass.push({ s: s + i, len: 1, p: root });
        else if (B === 'half') { bass.push({ s, len: 4, p: root }); bass.push({ s: s + 4, len: 4, p: root + 7 }); }
        else if (B === 'oom') for (let i = 0; i < 8; i += 2) bass.push({ s: s + i, len: 1, p: root + (i % 4 ? 7 : 0) });
        else if (B === 'walk') { const w = [0, sc[2] - sc[0], 7, sc[5] - sc[0]]; for (let i = 0; i < 4; i++) bass.push({ s: s + i * 2, len: 2, p: root + (w[i] < 0 ? w[i] + 12 : w[i]) }); }
        if (t.arp) { const tones = [r0, third, fifth, r0 + 12]; const every = t.arp === 2 ? 1 : 2; for (let i = 0; i < 8; i += every) arp.push({ s: s + i, len: every, p: tones[(i / every) % 4] + (t.arp === 2 ? 12 : 0) }); }
        const pats = DRUMS[t.dr] || DRUMS.pop, fill = bi === 3 && fi % 2 === 1;
        const pat = fill ? pats[2] : pats[bi % 2];
        for (let i = 0; i < 8; i++) if (pat[i] !== '.') drums.push({ s: s + i, k: pat[i] });
        s += 8;
      });
    });
    const out = { step, steps: s, dur: s * step + 1.2, lead, bass, arp, drums };
    CACHE[t.id] = out;
    return out;
  }
  const dur = i => (TUNES[i] ? compile(TUNES[i]).dur : 60);
  const RADIO = { gap: 3, reqGap: 600, reqGapHour: 180, qMax: 8, toMax: 20, msgMax: 60 };

  // ---------------------------------------------------------------- Byte, the JackNet's pet
  // xp: community care points needed (in total) to reach this stage; days: at least this many real days old
  const PET = {
    name: 'Byte',
    STAGES: [
      { n: 'Egg', xp: 0, days: 0, d: 'A warm, humming egg. It is about 1.44 MB.' },
      { n: 'Bit', xp: 25, days: 0, d: 'Just hatched! Tiny, wobbly and only one bit wide.' },
      { n: 'Nibble', xp: 150, days: 1, d: 'Four bits of pure trouble. Has learned to bounce.' },
      { n: 'Byte', xp: 450, days: 3, d: 'A proper eight-bit Byte. Has opinions about video games.' },
      { n: 'Kilobyte', xp: 1100, days: 7, d: 'Taller, cleverer and wears a floppy disk as a hat.' },
      { n: 'Megabyte', xp: 2400, days: 14, d: 'Huge! Wears headphones. Knows every cheat code ever.' },
      { n: 'Gigabyte', xp: 5000, days: 30, d: 'A LEGEND of the JackNet. Glows a bit. Nobody knows why.' },
    ],
    // per member cooldowns (seconds) and how much each care does
    ACT: {
      feed: { cd: 900, stat: 'f', add: 26, pts: 2, full: 92, n: 'Feed' },
      play: { cd: 480, stat: 'p', add: 24, pts: 2, full: 95, n: 'Play' },
      clean: { cd: 1200, stat: 'c', add: 40, pts: 2, full: 90, n: 'Clean' },
      pat: { cd: 120, stat: 'p', add: 5, pts: 1, full: 101, n: 'Pat' },
      tuck: { cd: 1800, stat: 'e', add: 25, pts: 1, full: 85, n: 'Tuck in' },
    },
    SNACKS: ['a packet of crisps', 'a slice of pizza', 'a fizzy cola bottle', 'a byte of cake', 'some alphabet spaghetti', 'a microchip (chocolate)', 'a jam sandwich', 'fish fingers'],
    TOYS: ['a bouncy ball', 'a yo-yo', 'the floppy disk frisbee', 'a game of tag', 'a Rubrick\'s cube', 'a cardboard box'],
    MILES: [[10, 10], [50, 20], [150, 40], [400, 75], [1000, 150]], // [care points, Rupees]
  };
  // mood from the four stats (0..100) and whether it is night-time on the PC
  function mood(p, night) {
    const f = p.f, pl = p.p, c = p.c, e = p.e, avg = (f + pl + c + e) / 4;
    if (p.st === 0) return 'egg';
    if (avg < 22) return 'grumpy';
    if (e < 20 || (night && e < 70)) return 'sleepy';
    if (f < 30) return 'hungry';
    if (c < 28) return 'grubby';
    if (pl < 30) return 'bored';
    if (avg > 70) return 'happy';
    return 'ok';
  }

  const C = { EVENTS, THEMES, themeOf, TUNES, SCALES, DRUMS, compile, dur, RADIO, PET, mood };
  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.EventsCat = C;
})(this);

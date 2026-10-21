/* sx-dos: MS-DOS programs for the SECRETS pack (lazy, from js/sx.js's DOS.progs stubs).
 *   DECODE   the Great JackNet Hunt's chapter 3 decoder (C:\HUNT\DECODE.EXE)
 *   SL       what you get when you mistype LS (a little steam train crosses the screen)
 *   ELIZA    (or DOCTOR) the 1960s computer therapist, 1999 edition
 *   CAL      a calendar of any month of 1999 (CAL 7 = July). Only 1999. Obviously.
 *   BANNER   prints your words in BIG LETTERS */
(function () {
  'use strict';
  const DOS = window.DOS, A = window.Apps; if (!DOS || !A || window.SxDos) return;
  const secret = id => { try { A.secret(id); } catch (e) {} };
  const sleep = (sh, ms) => (sh.host && sh.host.sleep ? sh.host.sleep(ms) : new Promise(r => setTimeout(r, ms)));
  const rot = s => s.replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); });
  const SxDos = window.SxDos = {};

  // ================================================================ DECODE.EXE (chapter 3)
  SxDos.decode = async (sh, args) => {
    const a = String(args || '').trim(), sw = (/^\/([a-z?])\s*(.*)$/i.exec(a) || [null, '', ''])[1].toUpperCase(), rest = ((/^\/[a-z?]\s*(.*)$/i.exec(a) || [])[1] || '').trim();
    const p = s => sh.println(s);
    if (!a || sw === '?') {
      p('DECODE.EXE  v1.0  (c) 1999 Hunt HQ  -  The Great JackNet Hunt decoder');
      p('');
      p('DECODE [/K] [/R text] [/A text] [/M text] [/?]');
      p('');
      p('  /K        Shows the KEY for chapter 3 (scrambled, in case Dave looks)');
      p('  /R text   Reverses text (writes it back to front)');
      p('  /A text   Turns letters into numbers (A=1 B=2 C=3...) and back again');
      p('  /M text   Turns text into Morse code');
      p('  /?        Shows this help');
      p('');
      p('Example:  DECODE /R OLLEH');
      return;
    }
    if (sw === 'K') {
      secret('sx.h.decode');
      p('Opening the vault...'); await sleep(sh, 400);
      p('Checking for Dave...'); await sleep(sh, 500);
      p('No Dave detected.'); await sleep(sh, 300);
      p('');
      p('  KEY THREE (scrambled for safety):   ' + rot('B O E H G'));
      p('');
      p('Scrambled how? Read it in a mirror. Or ask me: DECODE /R and the letters.');
      p('(Clue: it is the button on the front of every 1999 PC that does nothing at all.)');
      return;
    }
    if (sw === 'R') { if (!rest) return p('DECODE /R needs some text. Example: DECODE /R OLLEH'); p([...rest.toUpperCase()].reverse().join('')); return; }
    if (sw === 'A') {
      if (!rest) return p('DECODE /A needs some text. Example: DECODE /A JACK  or  DECODE /A 10 1 3 11');
      if (/[a-z]/i.test(rest)) p(rest.toUpperCase().replace(/[^A-Z ]/g, '').split('').map(c => (c === ' ' ? '/' : c.charCodeAt(0) - 64)).join(' '));
      else p(rest.split(/[\s,-]+/).map(x => (x === '/' ? ' ' : +x >= 1 && +x <= 26 ? String.fromCharCode(64 + +x) : '?')).join(''));
      return;
    }
    if (sw === 'M') {
      const M = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
      if (!rest) return p('DECODE /M needs some text. Example: DECODE /M SOS');
      p(rest.toUpperCase().split(' ').map(w => [...w].map(c => M[c] || '').filter(Boolean).join(' ')).join(' / '));
      try { let t = 0; for (const c of rest.toUpperCase().slice(0, 12)) { for (const s of (M[c] || '')) { DOS.tone && DOS.tone(700, s === '.' ? 0.08 : 0.24, t); t += s === '.' ? 0.16 : 0.32; } t += 0.24; } } catch (e) {}
      return;
    }
    p('Invalid switch - /' + sw + '   (Type DECODE /? for help)');
  };

  // ================================================================ SL (a train, because you meant LS)
  SxDos.sl = sh => DOS.screenProg(sh, async (host, s) => {
    secret('sx.d.sl');
    host.setMouse(false); s.clear(0); s.cur.on = false;
    const W = s.cols, H = s.rows;
    const ENG = [
      '      ====        ________                ___________ ',
      '  _D _|  |_______/        \\__I_I_____===__|_________| ',
      '   |(_)---  |   H\\________/ |   |        =|___ ___|   ',
      '   /     |  |   H  |  |     |   |         ||_| |_||   ',
      '  |      |  |   H  |__--------------------| [___] |   ',
      '  | ________|___H__/__|_____/[][]~\\_______|       |   ',
      '  |/ |   |-----------I_____I [][] []  D   |=======|__ ',
    ];
    const WHEELS = [
      ['__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ', ' |/-=|___|=    ||    ||    ||    |_____/~\\___/        ', '  \\_/      \\O=====O=====O=====O_/      \\_/            '],
      ['__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ', ' |/-=|___|=O=====O=====O=====O   |_____/~\\___/        ', '  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            '],
    ];
    const SMOKE = ['(  )', '(@@@)', '(   )', '( @ )'];
    const top = Math.max(1, (H - 12) / 2 | 0), len = ENG[0].length;
    for (let x = W; x > -len - 4; x -= 1) {
      s.clear(0);
      const fr = (W - x) % 2, lines = ENG.concat(WHEELS[fr]);
      lines.forEach((ln, i) => { for (let j = 0; j < ln.length; j++) { const cx = x + j; if (cx >= 0 && cx < W && ln[j] !== ' ') s.set(cx, top + 2 + i, ln[j], i < 7 ? 0x0f : 0x07); } });
      for (let k = 0; k < 3; k++) { const sm = SMOKE[(k + fr + (W - x) / 3 | 0) % SMOKE.length], sx = x + 6 + k * 5, sy = top + 1 - k; for (let j = 0; j < sm.length; j++) if (sx + j >= 0 && sx + j < W && sy >= 0) s.set(sx + j, sy, sm[j], 0x08); }
      if (x < W - 20 && x > W - 40) s.print(1, H - 2, 'Choo choo! You typed SL. You meant LS. LS is a Dad-at-work command. This is DOS: try DIR.', 0x0e);
      await sleep(host, 45);
      const k = host.pollKey && host.pollKey(); if (k) break;
    }
  });

  // ================================================================ ELIZA (a very simple therapist, after the 1966 program)
  SxDos.eliza = SxDos.doctor = async sh => {
    secret('sx.d.eliza');
    const K = DOS.core, p = s => sh.println(s);
    p('');
    p('  ELIZA.EXE - the computer therapist (DOS edition, 1999)');
    p('  Based on an idea from 1966. Please tell me what is on your mind.');
    p('  Type BYE to leave.');
    p('');
    const swap = { i: 'you', me: 'you', my: 'your', am: 'are', mine: 'yours', you: 'I', your: 'my', 'i\'m': 'you\'re', myself: 'yourself' };
    const refl = s => s.toLowerCase().replace(/[.!?]+$/, '').split(/\s+/).map(w => swap[w] || w).join(' ');
    const R = [
      [/\b(dave)\b/i, ['Tell me more about Dave.', 'Does Dave borrow your games too?', 'How does Dave make you feel?']],
      [/\b(mom|mum|mother)\b/i, ['Tell me more about your Mom.', 'Does your Mom need the phone again?', 'What would your Mom say about that?']],
      [/\b(homework|school|teacher)\b/i, ['Is the homework done?', 'How long until the holidays?', 'Have you told your teacher how you feel?']],
      [/\b(y2k|millennium|2000)\b/i, ['Do you worry about the Millennium Bug?', 'What do you think will happen at midnight?', 'Everybody is nervous about the year 2000. Go on.']],
      [/\b(game|games|n64|playstation|dreamcast|pokemon)\b/i, ['Do games make you happy?', 'What is your favourite game?', 'Have you completed it yet?']],
      [/\bi feel (.+)/i, ['Why do you feel $1?', 'How long have you felt $1?', 'Do you often feel $1?']],
      [/\bi am (.+)/i, ['Why do you say you are $1?', 'How long have you been $1?', 'Do you enjoy being $1?']],
      [/\bi want (.+)/i, ['Why do you want $1?', 'What would happen if you got $1?', 'Have you asked for $1 for Christmas?']],
      [/\bbecause\b/i, ['Is that the real reason?', 'What else could explain it?']],
      [/\b(yes|yeah|yep)\b/i, ['You seem quite sure.', 'I see.']],
      [/\b(no|nope|nah)\b/i, ['Why not?', 'Are you sure?']],
      [/\b(computer|pc|modem|internet)\b/i, ['Do computers worry you?', 'I am a computer. Does that bother you?', 'Are you talking about me?']],
      [/\?$/, ['Why do you ask?', 'What do you think?', 'Does that question interest you?']],
    ];
    const DEF = ['Please go on.', 'Tell me more.', 'How does that make you feel?', 'I see. And then what?', 'Very interesting. Carry on.', 'Hmm.'];
    let n = 0;
    for (;;) {
      sh.print('> ');
      const line = await K.readLine(sh.host, {});
      if (line == null) continue;
      const t = line.trim();
      if (/^(bye|quit|exit|goodbye)$/i.test(t)) { p('ELIZA: Goodbye. That will be fifty pence, please.'); return; }
      if (!t) { p('ELIZA: You seem quiet today.'); continue; }
      let out = null;
      for (const [re, rs] of R) { const m = re.exec(t); if (m) { out = rs[n++ % rs.length].replace('$1', m[1] ? refl(m[1]) : ''); break; } }
      p('ELIZA: ' + (out || DEF[n++ % DEF.length]));
    }
  };

  // ================================================================ CAL (any month of 1999)
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  SxDos.cal = async (sh, args) => {
    const a = String(args || '').trim().split(/\s+/).filter(Boolean);
    const yr = a.find(x => /^\d{4}$/.test(x));
    if (yr && yr !== '1999') { sh.println(+yr > 1999 ? `CAL: ${yr} is not a real year. Yet. (Ask again after midnight on 31/12/99. Actually, don't.)` : `CAL: ${yr} is history. This PC only does 1999.`); return; }
    secret('sx.d.cal');
    const t = Desk.today99();
    const mArg = a.find(x => /^\d{1,2}$/.test(x)), name = a.find(x => /^[a-z]{3,}$/i.test(x));
    let m = mArg ? +mArg : name ? MON.findIndex(n => n.toLowerCase().startsWith(name.toLowerCase().slice(0, 3))) + 1 : t.m;
    if (!(m >= 1 && m <= 12)) m = t.m;
    const head = `${MON[m - 1]} 1999`, first = new Date(1999, m - 1, 1).getDay(), days = new Date(1999, m, 0).getDate();
    sh.println(' '.repeat(Math.max(0, (20 - head.length) / 2 | 0)) + head);
    sh.println('Su Mo Tu We Th Fr Sa');
    let row = '   '.repeat(first);
    for (let d = 1; d <= days; d++) {
      row += String(d).padStart(2, ' ') + (m === t.m && d === t.d ? '*' : ' ');
      if ((first + d) % 7 === 0) { sh.println(row.replace(/\s+$/, '')); row = ''; }
    }
    if (row) sh.println(row.replace(/\s+$/, ''));
    if (m === t.m) sh.println('\n* = today');
  };

  // ================================================================ BANNER (big letters)
  const F = { // 5 rows per letter, # = ink
    A: ['.##.', '#..#', '####', '#..#', '#..#'], B: ['###.', '#..#', '###.', '#..#', '###.'], C: ['.###', '#...', '#...', '#...', '.###'], D: ['###.', '#..#', '#..#', '#..#', '###.'],
    E: ['####', '#...', '###.', '#...', '####'], F: ['####', '#...', '###.', '#...', '#...'], G: ['.###', '#...', '#.##', '#..#', '.###'], H: ['#..#', '#..#', '####', '#..#', '#..#'],
    I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..##', '...#', '...#', '#..#', '.##.'], K: ['#..#', '#.#.', '##..', '#.#.', '#..#'], L: ['#...', '#...', '#...', '#...', '####'],
    M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.##.', '#..#', '#..#', '#..#', '.##.'], P: ['###.', '#..#', '###.', '#...', '#...'],
    Q: ['.##.', '#..#', '#..#', '#.##', '.###'], R: ['###.', '#..#', '###.', '#.#.', '#..#'], S: ['.###', '#...', '.##.', '...#', '###.'], T: ['#####', '..#..', '..#..', '..#..', '..#..'],
    U: ['#..#', '#..#', '#..#', '#..#', '.##.'], V: ['#...#', '#...#', '#...#', '.#.#.', '..#..'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], X: ['#..#', '#..#', '.##.', '#..#', '#..#'],
    Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'], Z: ['####', '...#', '.##.', '#...', '####'], ' ': ['..', '..', '..', '..', '..'], '!': ['#', '#', '#', '.', '#'], '?': ['###', '..#', '.##', '...', '.#.'],
    0: ['.##.', '#..#', '#..#', '#..#', '.##.'], 1: ['.#', '##', '.#', '.#', '.#'], 2: ['###.', '...#', '.##.', '#...', '####'], 3: ['###.', '...#', '.##.', '...#', '###.'], 4: ['#..#', '#..#', '####', '...#', '...#'],
    5: ['####', '#...', '###.', '...#', '###.'], 6: ['.##.', '#...', '###.', '#..#', '.##.'], 7: ['####', '...#', '..#.', '.#..', '.#..'], 8: ['.##.', '#..#', '.##.', '#..#', '.##.'], 9: ['.##.', '#..#', '.###', '...#', '.##.'],
  };
  SxDos.banner = async (sh, args) => {
    const t = String(args || '').toUpperCase().replace(/[^A-Z0-9 !?]/g, '').trim().slice(0, 30) || 'JACK';
    secret('sx.d.banner');
    const width = (sh.term && sh.term.s && sh.term.s.cols) || 80;
    const chunks = []; let cur = '';
    for (const w of t.split(' ')) { const tryS = cur ? cur + ' ' + w : w; const wd = [...tryS].reduce((n, c) => n + (F[c] || F[' '])[0].length + 1, 0); if (wd > width - 2 && cur) { chunks.push(cur); cur = w; } else cur = tryS; }
    if (cur) chunks.push(cur);
    for (const ch of chunks) { for (let r = 0; r < 5; r++) sh.println([...ch].map(c => (F[c] || F[' '])[r].replace(/#/g, '\u2588').replace(/\./g, ' ')).join(' ')); sh.println(''); }
  };
})();

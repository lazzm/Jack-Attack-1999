/* office-term: HyperTerminal and five (fake) bulletin board systems. An 80-column ANSI terminal that prints at the
 * modem's baud rate, BBS menus written as little coroutines, message boards (one of them shared live between every
 * visitor via Net.kv), file areas with joke downloads, door games (Legend of the Red Dragonfly, Star Trader 99, Guess-O-Tron)
 * and a sysop chat that is quite obviously Gubbinz. Colour codes are BBS-style pipe codes: |00-|15 text, |16-|23 background,
 * |CL clear screen, |BE bell. */
(function () {
  'use strict';
  const K = window.OfficeKit; if (!K) return;
  const { A, esc, h, qs, qsa, on, tap, touchy, msg, toast, today, sfx, store, pad2, pick, rnd } = K;
  const I = K.I;
  const COLS = 80, MAXL = 400, HANGUP = { hangup: true };
  const nick = () => (window.Net && Net.me && Net.me.nick) || 'Guest';

  // ================================================================ block letters for the logos (4-5 wide, 5 high)
  const F = {
    A: [' ## ', '#  #', '####', '#  #', '#  #'], B: ['### ', '#  #', '### ', '#  #', '### '], C: [' ###', '#   ', '#   ', '#   ', ' ###'], D: ['### ', '#  #', '#  #', '#  #', '### '],
    E: ['####', '#   ', '### ', '#   ', '####'], F: ['####', '#   ', '### ', '#   ', '#   '], G: [' ###', '#   ', '# ##', '#  #', ' ###'], H: ['#  #', '#  #', '####', '#  #', '#  #'],
    I: ['###', ' # ', ' # ', ' # ', '###'], J: ['   #', '   #', '   #', '#  #', ' ## '], K: ['#  #', '# # ', '##  ', '# # ', '#  #'], L: ['#   ', '#   ', '#   ', '#   ', '####'],
    M: ['#   #', '## ##', '# # #', '#   #', '#   #'], N: ['#  #', '## #', '# ##', '#  #', '#  #'], O: [' ## ', '#  #', '#  #', '#  #', ' ## '], P: ['### ', '#  #', '### ', '#   ', '#   '],
    Q: [' ## ', '#  #', '#  #', '# ##', ' ###'], R: ['### ', '#  #', '### ', '# # ', '#  #'], S: [' ###', '#   ', ' ## ', '   #', '### '], T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
    U: ['#  #', '#  #', '#  #', '#  #', ' ## '], V: ['#   #', '#   #', ' # # ', ' # # ', '  #  '], W: ['#   #', '#   #', '# # #', '## ##', '#   #'], X: ['#  #', '#  #', ' ## ', '#  #', '#  #'],
    Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '], Z: ['####', '   #', ' ## ', '#   ', '####'], 0: [' ## ', '#  #', '#  #', '#  #', ' ## '], 1: [' # ', '## ', ' # ', ' # ', '###'],
    2: ['### ', '   #', ' ## ', '#   ', '####'], 9: [' ## ', '#  #', ' ###', '   #', ' ## '], ' ': ['  ', '  ', '  ', '  ', '  '], '!': ['#', '#', '#', ' ', '#'], '?': ['### ', '   #', ' ## ', '    ', ' #  '],
  };
  // big('TEXT', fill, [colours per row], indent) -> 5 lines with pipe colour codes
  const big = (t, fill, cols, ind) => [0, 1, 2, 3, 4].map(r => ' '.repeat(ind || 0) + '|' + cols[r % cols.length] + [...t.toUpperCase()].map(ch => (F[ch] || F[' '])[r].replace(/#/g, fill)).join(' ')).join('\r\n') + '|07\r\n';
  const center = (s, w) => { const plain = s.replace(/\|\d\d|\|[A-Z]{2}/g, ''); return ' '.repeat(Math.max(0, Math.floor(((w || 80) - plain.length) / 2))) + s; };
  const rule = (ch, col, n) => '|' + col + ch.repeat(n || 79) + '|07\r\n';
  const wrap = (t, n) => String(t).split('\n').map(l => { const out = []; let cur = ''; l.split(' ').forEach(wd => { if ((cur + ' ' + wd).trim().length > (n || 78)) { out.push(cur); cur = wd; } else cur = (cur ? cur + ' ' : '') + wd; }); out.push(cur); return out.join('\n'); }).join('\n');
  const d99 = md => { const m = Math.floor(md / 100), d = md % 100; return pad2(d) + '/' + pad2(m) + '/99'; };

  // ================================================================ the bulletin boards
  const BBS = {
    grot: { name: 'The Byte Hole', num: '01632 960066', baud: 28800, sysop: 'ByteBoss', col: ['10', '02'], door: 'lors' },
    star: { name: 'Starbase 1999', num: '01632 960197', baud: 33600, sysop: 'Admiral Snackbar', col: ['11', '03'], door: 'trader' },
    pixel: { name: 'Pixel Palace', num: '01632 960321', baud: 2400, sysop: 'PixelKing', col: ['13', '14'], door: 'guess' },
    bunker: { name: 'Y2K Bunker', num: '01632 960200', baud: 14400, sysop: 'Colonel Countdown', col: ['12', '15'], door: 'countdown' },
    dave: { name: 'Dave\'s PC', num: '01632 960123', baud: 0 },
    squig: { name: 'The Pen', num: '01632 960743', baud: 9600, sysop: 'GUBBINZ', col: ['09', '04'], door: 'feed', unlisted: true },
  };
  const byNumber = n => { const c = String(n).replace(/\D/g, ''); return Object.keys(BBS).find(k => BBS[k].num.replace(/\D/g, '') === c || BBS[k].num.replace(/\D/g, '').slice(5) === c); };

  // message boards: [md (appears from), from, to, subject, body]
  const BOARDS = {
    grot: [
      ['General Natter', [[105, 'ByteBoss', 'All', 'WELCOME TO THE BYTE HOLE', 'Rules: 1. No flaming. 2. No asking for warez. 3. Eggberts must be on silent.\nThis BBS runs on a 486 in my shed. If it goes quiet, the shed is cold.'], [212, 'SnotRocket', 'All', 'ULTRA 64 or PlaySpace?', 'ULTRA 64 obviously. Goldenballs. Four players. Anyone who says PlaySpace is banned.'], [213, 'BlueBoy99', 'SnotRocket', 'Re: ULTRA 64 or PlaySpace?', 'playspace has metal gear wobbly and CDs that are shiny'], [213, 'ByteBoss', 'BlueBoy99', 'Re: Re: ULTRA 64 or PlaySpace', 'BANNED. (for one day. play nice.)'], [404, 'Grobnik', 'All', 'glued my fingers', 'Glued my fingers to an AirMix Spitfire again. Typing with my nose. Any tips?'], [404, 'SnotRocket', 'Grobnik', 'Re: glued my fingers', 'warm soapy water and patience. or just keep the Spitfire. looks good.'], [811, 'Grobnik', 'All', 'ECLIPSE', 'It went dark at 11 and the dog thought it was bedtime. Best day ever.']]],
      ['Painting Tips', [[120, 'ByteBoss', 'All', 'thin your paints', 'Two thin coats beat one thick one. Thick paint hides the detail and makes your Space Marines look like they have been dipped in custard.'], [305, 'SnotRocket', 'All', 'drybrushing', 'Wipe most of the paint off the brush on a tissue, then scrub lightly over the edges. Instant metal. Works on AirMix tanks too.'], [602, 'Jack_A', 'All', 'tiny details', 'Cocktail sticks for the tiny bits (eyes, buttons, Ork teef)! Works better than any brush I own.']]],
    ],
    star: [
      ['Episode I Discussion', [[110, 'R2Fan77', 'All', 'THE TRAILER!!!', 'Downloaded the new trailer. Took 3 HOURS on my 28.8. It was the size of a postage stamp. I have watched it 41 times.'], [312, 'Admiral Snackbar', 'All', 'People paying to see the trailer', 'Over in America people are buying cinema tickets for other films just to see the trailer, then leaving. Respect.'], [520, 'ObiWanKenobi_UK', 'All', 'ARE YOU KIDDING', 'It\'s out in America and we have to wait until JULY? 16th July! The Internet is FULL of spoilers. I have stopped going on the Internet. I am typing this with my eyes shut.'], [716, 'R2Fan77', 'All', 'SEEN IT!!!!', 'Just got back. POD RACE. DARK MOLE. THE DOUBLE LIGHTSPATULA. I can\'t feel my legs.'], [716, 'PodRacerPete', 'All', 'Re: SEEN IT', 'Boonta Eve race is the best ten minutes of film ever made. Fight me.'], [717, 'Jarjar_Is_Ace', 'All', 'In defence of Jar Jar Jams', 'He\'s funny! The kids in my cinema loved him! Why is everyone being so mean??'], [717, 'R2Fan77', 'Jarjar_Is_Ace', 'Re: In defence of Jar Jar Jams', 'Mesa no comment.'], [718, 'DarthDave', 'All', 'midi-chlorians', 'So the Force is... tiny things in your blood? I liked it better when it was just magic. My dad says it\'s "like vitamins".'], [720, 'Admiral Snackbar', 'All', 'POLL: best bit?', '1. Pod race  2. Dark Mole fight  3. Space battle  4. Jar Jar Jams\nResults so far: 1: 41 votes, 2: 58 votes, 3: 9 votes, 4: 2 votes (one of them was a mistake)'], [802, 'PodRacerPete', 'All', 'Episode II title guesses', 'Mine: "The Clone War". Dave\'s: "Jar Jar Jams Strikes Back". Dave has been banned.'], [905, 'ObiWanKenobi_UK', 'All', 'Seen it 6 times now', 'Six. The man at the cinema knows my name.']]],
      ['Classic Trilogy', [[115, 'OldSchoolOrd', 'All', 'who shot first', 'In the 1997 Special Edition Greedo shoots first. I will never accept this.'], [116, 'R2Fan77', 'OldSchoolOrd', 'Re: who shot first', 'agreed. Han was a scoundrel. Let him be a scoundrel.'], [301, 'DarthDave', 'All', 'Best ship', 'Millennium Pigeon. Less than twelve parsecs. Yes I know a parsec is a distance. Don\'t @ me. (what does @ mean? my brother says it.)']]],
      ['Star Trader 99 Scores', [[101, 'Admiral Snackbar', 'All', 'HIGH SCORES', '1. Admiral Snackbar - 48,200 credits\n2. R2Fan77 - 31,050 credits\n3. PodRacerPete - 12,400 credits (lost 3 holds of Grub to a Gungan stowaway)']]],
    ],
    pixel: [
      ['Cheats & Tips', [[201, 'PixelKing', 'All', 'Goldenballs Paintball', 'Beat DAM on Secret Agent in under 2:40 and you get Paintball Mode. Tested. Paint everywhere.'], [215, 'N64Nut', 'All', 'Marlo 64 Louie G', 'My cousin says if you get 120 stars Louie G is on the castle roof. CONFIRMED? (No.) (Probably not.) (Has anyone checked?)'], [216, 'PixelKing', 'N64Nut', 'Re: Marlo 64 Louie G', 'UNCONFIRMED PLAYGROUND RUMOUR. Filed under: cousins.'], [610, 'TetrisGod', 'All', 'level 18!!!', 'Got to level 18 on Game Lad Blockology. My thumbs have gone flat.']]],
      ['For Sale / Swaps', [[302, 'N64Nut', 'All', 'SWAP: rumble pak', 'Swap my Rumble Pak for a Controller Pak. Rumble Pak makes my hands tingly.'], [408, 'BargainBob', 'All', 'FOR SALE: 486 PC', '486DX2-66, 8MB RAM, 340MB hard drive. Comes with a modem (14.4). Perfect for JackOS 3.1. £150 ono. Buyer collects. Heavy.']]],
    ],
    bunker: [
      ['Y2K Preparations', [[105, 'Colonel Countdown', 'All', 'THE CLOCK IS TICKING', 'At midnight on 31/12/99 every computer that stores the year as two digits will think it is 1900. Be ready. Beans. Torches. A good book. (Not on a computer.)'], [320, 'NervousNeville', 'All', 'my toaster', 'Is my toaster Y2K compliant? It has a clock in it.'], [321, 'Colonel Countdown', 'NervousNeville', 'Re: my toaster', 'Unplug it on the 31st. Toast is not worth the risk.'], [915, 'Jack_A', 'All', 'video recorder', 'Ours has said 12:00 since 1994. It won\'t notice.'], [1101, 'NervousNeville', 'All', 'BEANS', 'I have 140 tins of beans. Is that enough? My wife says it is too many. I say the wife is not Y2K compliant.']]],
    ],
    squig: [
      ['GUBBINZ DIARY', [[515, 'GUBBINZ', 'All', 'day 1', 'got a website. people feed me. this is the best day of my life.'], [516, 'GUBBINZ', 'All', 'day 2', 'more feeding. ate a biscuit. ate another biscuit. tummy ache. worth it.'], [801, 'GUBBINZ', 'All', 'ECLIPSE', 'the sun went out. i thought i broke it. i did not break it. probably.'], [1014, 'GUBBINZ', 'All', 'the daydream', 'jack wants a daydream. i want a biscuitcast. it is a cast. for biscuits.']]],
    ],
  };
  // file areas: [name, bytes, description, file text]
  const FILES = {
    grot: [['ORKPAINT.ZIP', 23552, 'Ork painting guide (red only)', 'ORK PAINTING GUIDE\n==================\nStep 1: paint it red.\nStep 2: see step 1.\n\n(Red ones go faster. This is science.)'], ['TAMAFAQ.TXT', 6144, 'Frequently Asked Questions about Eggberts', 'EGGBERT FAQ\n==============\nQ: Does it need feeding during school?\nA: Yes.\nQ: What if a teacher takes it off me?\nA: It will die in a drawer. Like a hero.\nQ: Can I keep it alive forever?\nA: Ask Gubbinz. Actually, don\'t.'], ['YESSS.WAV', 41984, 'The loudest sound file on the BBS', 'This was supposed to be YESSS.WAV but the download turned into text on the way.\n\nYESSSSSSSSSSSSSSSSSSSSSSSSSS!\n\n(Imagine it LOUDER.)']],
    star: [['EP1TRLR.TXT', 8192, 'Episode I trailer (text version, because the real one is 25MB)', 'EPISODE I TRAILER (TEXT EDITION)\n================================\n[Spaceships. Whoosh.]\n[A boy in a pod racer. VROOOM.]\n[A red and black face. Two lightsabers in one. VMMMM.]\n[Very dramatic music.]\n[A small green Space Cadet says something wise, backwards.]\n\nCOMING 16 JULY (UK). Start queueing now.'], ['TRADER99.DOC', 5120, 'Star Trader 99 strategy guide', 'STAR TRADER 99 - TIPS\n=====================\n* Buy low, sell high. (That\'s it. That\'s economics.)\n* Gizmos sell best at ports that BUY gizmos. Sounds obvious. Isn\'t at 2am.\n* If a Gungan offers to "help" with your cargo, say no.'], ['LIGHTSBR.TXT', 3072, 'How to make a lightspatula noise with your mouth', 'HOW TO DO A LIGHTSPATULA NOISE\n============================\nHum low. Now hum low while turning your head. VMMMMmmmm. VMMMMMMMmmm.\nFor a double-bladed one, do it twice. You will need two heads.']],
    pixel: [['DOOMCHT.TXT', 4096, 'Gloom cheats (IDDQD and friends)', 'GLOOM CHEATS\n===========\nIDDQD - god mode\nIDKFA - all keys, all weapons, all ammo\n\nType them while playing. No Enter key. Your face goes gold.'], ['SNAKE.EXE', 11264, 'Snake! Classic game! Totally not a virus!', 'SNAKE.EXE\n\nThis download was replaced with this text file by the sysop because it WAS a virus.\n\nNever run EXE files from strangers. Even if they say Snake.\n\n- PixelKing'], ['HISCORES.TXT', 2048, 'Pixel Palace high score table', 'PIXEL PALACE HALL OF FAME\n=========================\nTETRIS (Game Lad): TetrisGod - 151,200\nGUESS-O-TRON: everyone - 7 guesses (it\'s maths)\nSPACE INVADERS: my nan - 9,990 (she won\'t say how)']],
    bunker: [['Y2KFIX.ZIP', 15360, 'The Y2K fix (100% guaranteed*)', 'Y2KFIX\n======\nThe complete fix for the Millennium Bug:\n\n1. On 31/12/1999 at 11:59pm, switch your computer off.\n2. Go to a party.\n3. Switch it back on in the morning.\n\n*not guaranteed'], ['BEANS.TXT', 2048, 'Beans needed per person per day (official*)', 'OFFICIAL Y2K BEAN CALCULATOR\nBeans per person per day: 1 tin\nDays: as many as you are worried\nTins needed: more than you have\n\n*not official']],
    squig: [['HAMSTER.BMP', 9216, 'A picture of a hamster (best viewed with your eyes shut)', 'HAMSTER.BMP (ASCII version)\n\n   ___\n  (o o)\n  ( V )  <- hamster\n  /|||\\\n\n... it ate the rest of the picture.']],
  };
  const BULLETINS = {
    grot: 'Welcome to THE BYTE HOLE, the friendliest BBS on the phone line!\nNew this week: Legend of the Red Dragonfly (door 1). Beat the Great Red Dragonfly and ByteBoss will tell you a SECRET.\nThe shed heater is fixed, so we\'re online 24 hours (except when Mom needs the phone).',
    star: 'Starbase 1999 is fully operational. Episode I discussion is in Message Board 1.\nSTAR TRADER 99 now has a Gungan stowaway event. You have been warned.\nUK RELEASE: 16 JULY 1999. Counting down every single day.',
    pixel: 'PIXEL PALACE - the games BBS! We are 2400 BAUD ONLY because the sysop\'s modem is from 1991 and he refuses to replace it. "It\'s retro," he says. It is not retro. It is slow.',
    bunker: 'ATTENTION. Days remaining until the Year 2000: see the countdown door. Supplies list in File Area. Remain calm. Remain stocked. Remain off the computer on 31/12 at 23:59.',
    squig: 'THIS IS THE PEN. the secret BBS. if you are here, you are clever. or you are a hamster. welcome either way.\nrules: feed the hamster. do not BE the hamster.',
  };

  // ================================================================ HyperTerminal window
  function openHyper(arg) {
    arg = arg || {};
    const b = h('<div class="ht-term" tabindex="0" aria-label="Terminal" role="log"></div><div class="ht-in"><input type="text" placeholder="Type here and press Enter" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" aria-label="Send to host"></div><div class="ht-keys" hidden></div><div class="ht-lcd"><span>MR</span><i class="mr on"></i><span>OH</span><i class="oh"></i><span>CD</span><i class="cd"></i><span>RD</span><i class="rx"></i><span>SD</span><i class="tx"></i><span class="ht-where" style="margin-left:auto"></span></div>', 'ht');
    const outer = h(''); outer.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0';
    const TBI = {
      new: '<svg viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v10h-9z" fill="#fff" stroke="#000"/><path d="M9.5 1.5v3h3" fill="#c0c0c0" stroke="#000"/></svg>', open: '<svg viewBox="0 0 16 16"><path d="M1.5 3.5h5l1.5 1.5h7v9h-13.5z" fill="#f2d16b" stroke="#7a5a00"/></svg>',
      dial: '<svg viewBox="0 0 16 16"><path d="M1 9c0-3 3-4 7-4s7 1 7 4v1h-3V8H4v2H1z" fill="#000" stroke="#000"/><path d="M4 11h8l1.5 3.5h-11z" fill="#e8e0c8" stroke="#000"/></svg>', hang: '<svg viewBox="0 0 16 16"><path d="M1 7c0-3 3-4 7-4s7 1 7 4v1h-3V6H4v2H1z" fill="#e10600" stroke="#000"/><path d="M4 11h8l1.5 3.5h-11z" fill="#e8e0c8" stroke="#000"/></svg>',
      send: '<svg viewBox="0 0 16 16"><path d="M3.5 3.5h6l3 3v8h-9z" fill="#fff" stroke="#000"/><path d="M8 12V6M5 9l3-3 3 3" stroke="#e10600" fill="none" stroke-width="1.5"/></svg>', recv: '<svg viewBox="0 0 16 16"><path d="M3.5 3.5h6l3 3v8h-9z" fill="#fff" stroke="#000"/><path d="M8 6v6M5 9l3 3 3-3" stroke="#008000" fill="none" stroke-width="1.5"/></svg>',
      props: '<svg viewBox="0 0 16 16"><rect x="2.5" y="1.5" width="11" height="13" fill="#fff" stroke="#000"/><rect x="3" y="2" width="10" height="3" fill="#000080"/><path d="M4 8h8M4 10h8M4 12h5" stroke="#808080"/></svg>',
    };
    const tb = K.toolbar([{ t: 'New', i: TBI.new, a: () => dialDlg() }, { t: 'Open', i: TBI.open, a: () => K.fileDlg({ mode: 'open', title: 'Open', types: [['Session files (*.ht)', ['ht']]], dir: 'C:/Program Files/Accessories/HyperTerminal', icon: I.hyper }, n => n.bbs ? dial(n.bbs) : msg('HyperTerminal', 'That isn\'t a session file.', 'warn')) }, '|', { t: 'Call', i: TBI.dial, a: () => conn ? null : dialDlg(), id: 'dial' }, { t: 'Disconnect', i: TBI.hang, a: () => hangup(), id: 'hang' }, '|', { t: 'Send File', i: TBI.send, a: () => msg('Send File', 'Send a file to the BBS? Uploads at this speed would take until the year 2000. (And then the Millennium Bug would eat it.)', 'info') }, { t: 'Receive File', i: TBI.recv, a: () => msg('Receive File', 'Pick a file in the BBS file area and press D to download it. Received files go in:\nC:\\Program Files\\Accessories\\HyperTerminal\\Received', 'info') }, '|', { t: 'Properties', i: TBI.props, a: () => props() }]);
    outer.append(tb, b);
    const w = K.win('HyperTerminal', outer, { w: 700, h: 520, menubar: true, status: true, icon: I.hyper, minW: 280, minH: 240, onClose: () => { hangup(true); clearInterval(clock); RO.disconnect(); } });
    const scr = qs(b, '.ht-term'), inp = qs(b, '.ht-in input'), keysEl = qs(b, '.ht-keys'), where = qs(b, '.ht-where');
    const [stBaud, stEmu, stCap] = K.statusParts(w, ['Auto detect', 'ANSI', 'Capture']);
    // ---- the screen buffer
    let lines = [[]], cy = 0, cx = 0, fg = 7, bg = 0, bold = false, blink = false, dirty = false;
    let queue = [], cps = 2880, outRes = [], typeahead = [], waiter = null, conn = null, scheme = store.get('jhp_office_htscheme', 'ansi');
    const cell = ch => ({ ch, fg, bg, bl: blink });
    function putc(ch) {
      if (ch === '\r') { cx = 0; return; }
      if (ch === '\n') { cy++; if (!lines[cy]) lines[cy] = []; if (lines.length > MAXL) { lines.splice(0, lines.length - MAXL); cy = lines.length - 1; } return; }
      if (ch === '\b') { if (cx > 0) cx--; return; }
      if (ch === '\x07') { sfx('beep'); return; }
      if (cx >= COLS) { putc('\r'); putc('\n'); }
      const L = lines[cy]; while (L.length < cx) L.push(cell(' ')); L[cx++] = cell(ch);
    }
    function writeNow(s) {
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '|' && i + 2 < s.length + 1) {
          const code = s.substr(i + 1, 2);
          if (/^\d\d$/.test(code)) { const n = +code; if (n < 16) fg = n; else if (n < 24) bg = n - 16; i += 2; continue; }
          if (code === 'CL') { lines = [[]]; cy = cx = 0; i += 2; continue; }
          if (code === 'BE') { sfx('beep'); i += 2; continue; }
          if (code === 'BL') { blink = !blink; i += 2; continue; }
        }
        putc(c);
      }
      dirty = true;
    }
    function render() {
      if (!dirty) return; dirty = false;
      const start = Math.max(0, lines.length - 300);
      let out = '';
      for (let y = start; y < lines.length; y++) {
        const L = lines[y]; let run = '', rk = '';
        for (let x = 0; x <= L.length; x++) {
          const c = L[x], k = c ? `a${c.fg}${c.bg ? ' b' + c.bg : ''}${c.bl ? ' bl' : ''}` : '';
          if (x === L.length || k !== rk) { if (run) out += rk === 'a7' ? esc(run) : `<span class="${rk}">${esc(run)}</span>`; run = ''; rk = k; }
          if (c) run += c.ch;
        }
        if (y === cy && conn) { out += ' '.repeat(Math.max(0, cx - L.length)) + '<span class="cur"></span>'; }
        out += '\n';
      }
      scr.innerHTML = out;
      scr.scrollTop = scr.scrollHeight;
    }
    // output at modem speed
    function out(s) { return new Promise((res, rej) => { queue.push(...splitTokens(s)); outRes.push({ res, rej, mark: queue.length }); }); }
    const splitTokens = s => s.match(/\|(?:\d\d|CL|BE|BL)|[\s\S]/g) || [];
    let sent = 0;
    const pump = setInterval(() => {
      if (w.closed) return clearInterval(pump);
      if (queue.length) {
        const n = Math.max(1, Math.round(cps / 60));
        const chunk = queue.splice(0, n); writeNow(chunk.join('')); sent += chunk.length; qs(b, '.ht-lcd .rx').classList.add('on');
        outRes.forEach(o => { o.mark -= chunk.length; }); while (outRes.length && outRes[0].mark <= 0) outRes.shift().res();
      } else { qs(b, '.ht-lcd .rx').classList.remove('on'); while (outRes.length) outRes.shift().res(); }
      render();
    }, 16);
    // ---- input
    function key(ch) {
      qs(b, '.ht-lcd .tx').classList.add('on'); setTimeout(() => qs(b, '.ht-lcd .tx').classList.remove('on'), 80);
      if (!conn) { if (ch === '\r') writeNow('\r\n'); else if (ch !== '\b') writeNow(ch); return; } // local echo (AT commands...)
      if (!waiter || queue.length) { if (typeahead.length < 40) typeahead.push(ch); return; }
      feed(ch);
    }
    function feed(ch) {
      const wt = waiter; if (!wt) return;
      if (wt.mode === 'key') {
        const up = ch === '\r' ? '\r' : ch.toUpperCase();
        if (wt.valid && !wt.valid.includes(up)) return;
        waiter = null; drawKeys(); wt.res(up);
      } else {
        if (ch === '\r') { waiter = null; drawKeys(); writeNow('\r\n'); wt.res(wt.buf); }
        else if (ch === '\b') { if (wt.buf.length) { wt.buf = wt.buf.slice(0, -1); writeNow('\b \b'); } }
        else if (ch >= ' ' && wt.buf.length < wt.max) { wt.buf += ch; writeNow(wt.mask ? '*' : ch); }
      }
    }
    function waitFor(mode, o) { return new Promise((res, rej) => { if (!conn) return rej(HANGUP); waiter = Object.assign({ mode, res, rej, buf: '' }, o); drawKeys(); const flush = () => { while (waiter && typeahead.length) feed(typeahead.shift()); }; Promise.resolve().then(flush); }); }
    function drawKeys() {
      const wt = waiter, show = touchy() && wt && wt.mode === 'key';
      keysEl.hidden = !show; inp.placeholder = wt && wt.mode === 'line' ? 'Type here and press Enter' : 'Press a key, or type one here';
      if (show && !wt.valid) keysEl.innerHTML = '<button class="btn" type="button" data-k="\r">Continue</button>';
      else if (show) keysEl.innerHTML = wt.valid.filter(k => k !== '\r' && k >= ' ').map(k => `<button class="btn" type="button" data-k="${esc(k)}">${esc(k)}</button>`).join('') + (wt.valid.includes('\r') ? '<button class="btn" type="button" data-k="\r">Enter</button>' : '');
    }
    on(keysEl, 'click', ev => { const k = ev.target.closest('[data-k]'); if (k) key(k.dataset.k); });
    on(scr, 'keydown', ev => {
      if (ev.ctrlKey && ev.key.toLowerCase() === 'c' && String(getSelection())) return;
      if (ev.ctrlKey && ev.key.toLowerCase() === 'x') { ev.preventDefault(); key('\x18'); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); key('\r'); } else if (ev.key === 'Backspace') { ev.preventDefault(); key('\b'); } else if (ev.key === 'Escape') { ev.preventDefault(); key('\x1b'); }
      else if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); key(ev.key); }
    });
    on(inp, 'input', () => { if (waiter && waiter.mode === 'key' && inp.value) { const v = inp.value; inp.value = ''; key(v.slice(-1)); } });
    on(inp, 'keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); const v = inp.value; inp.value = ''; [...v].forEach(key); key('\r'); } else if (ev.key === 'Backspace' && !inp.value) key('\b'); else if (ev.key === 'Escape') key('\x1b'); });
    tap(scr, () => { if (!String(getSelection()) && !touchy()) scr.focus(); });
    // ---- layout: 80 columns always fit
    function fitFont() { const wpx = scr.clientWidth - 12; const fs = Math.max(8.5, Math.min(13, wpx / (COLS * 0.602))); scr.style.fontSize = fs.toFixed(2) + 'px'; }
    const RO = new ResizeObserver(fitFont); RO.observe(scr);
    function applyScheme() { scr.classList.toggle('green', scheme === 'green'); scr.classList.toggle('amber', scheme === 'amber'); stEmu.textContent = scheme === 'ansi' ? 'ANSI' : 'VT100'; }
    applyScheme();
    // ---- connection
    let t0 = 0;
    const clock = setInterval(() => { if (w.closed) return; if (conn) { const s = Math.floor((Date.now() - t0) / 1000); w.status.textContent = `Connected ${Math.floor(s / 3600)}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}`; } }, 1000);
    function setLeds(st) { qs(b, '.ht-lcd .oh').classList.toggle('on', st !== 'idle'); qs(b, '.ht-lcd .cd').classList.toggle('on', st === 'on'); tb.btns.dial.disabled = st !== 'idle'; tb.btns.hang.disabled = st === 'idle'; }
    setLeds('idle');
    function dialDlg() {
      const list = Object.entries(BBS).filter(([, v]) => !v.unlisted);
      const d = K.dialog('Connect To', `<div class="ht-dial"><p>Pick a bulletin board from the phone book, or type a number:</p><div class="field of-list" role="listbox">${list.map(([k, v], i) => `<div class="it${i ? '' : ' sel'}" data-k="${k}">${K.sel16(I.ht)} ${esc(v.name)}<small>${v.num}</small></div>`).join('')}</div><div class="of-grid2"><label>Country code:</label><select><option>United Kingdom (44)</option></select><label>Phone number:</label><input type="text" class="hn" inputmode="tel" value="${BBS[list[0][0]].num}"><label>Connect using:</label><select><option>Hayes-ish Accura 56K (well, 33.6K)</option><option>Direct to COM1 (the null modem cable)</option></select></div></div>`,
        [['Dial', bb => { const num = qs(bb, '.hn').value.trim(); const k = byNumber(num); if (k) dial(k); else dial(null, num); }], ['Cancel']], { w: 380, icon: I.hyper });
      on(qs(d.b, '.of-list'), 'click', ev => { const it = ev.target.closest('.it'); if (!it) return; qsa(d.b, '.it').forEach(x => x.classList.toggle('sel', x === it)); qs(d.b, '.hn').value = BBS[it.dataset.k].num; });
      on(qs(d.b, '.of-list'), 'dblclick', ev => { const it = ev.target.closest('.it'); if (it) { d.w.close(); dial(it.dataset.k); } });
    }
    let momTimer = 0;
    async function dial(k, rawNum) {
      if (conn) hangup(true);
      const bbs = k ? BBS[k] : null, num = bbs ? bbs.num : rawNum;
      w.setTitle((bbs ? bbs.name : num) + ' - HyperTerminal');
      const session = conn = { k, bbs, alive: true };
      lines = [[]]; cy = cx = 0; fg = 7; bg = 0; blink = false; dirty = true; queue = []; typeahead = [];
      cps = 2000; setLeds('dial'); w.status.textContent = `Dialling ${num}...`; where.textContent = '';
      writeNow('|07ATZ\r\nOK\r\nATDT' + num.replace(/\s/g, '') + '\r\n');
      sfx('modem');
      await new Promise(r => setTimeout(r, 2600));
      if (conn !== session) return;
      if (!bbs || bbs.baud === 0) {
        writeNow(bbs ? '|07\r\n\r\n' : '|07\r\nNO ANSWER\r\n');
        if (bbs) { writeNow('|07(the phone is ringing... somebody picks up)\r\n|15"HELLO? Who is this? Is that a FAX? DAVID! Is this one of your computer things?"\r\n|07\r\nNO CARRIER\r\n'); msg('HyperTerminal', 'That was Dave\'s Mom. Dave\'s PC is not a BBS. It is a phone.\n\n(Dave\'s brother lied.)', 'info'); }
        conn = null; setLeds('idle'); w.status.textContent = 'Disconnected'; dirty = true; return;
      }
      await new Promise(r => setTimeout(r, 1400));
      if (conn !== session) return;
      cps = bbs.baud / 10;
      writeNow(`|07CONNECT ${bbs.baud}/ARQ/V34/LAPM/V42BIS\r\n`);
      stBaud.textContent = `${bbs.baud} 8-N-1`;
      setLeds('on'); t0 = Date.now(); where.textContent = bbs.name;
      K.secret('bbsconnect');
      const seen = store.get('jhp_office_bbsseen', {}); seen[k] = 1; store.set('jhp_office_bbsseen', seen);
      if (['grot', 'star', 'pixel', 'bunker'].every(x => seen[x])) K.secret('bbsall');
      if (k === 'squig') K.secret('bbssecret');
      clearTimeout(momTimer);
      momTimer = setTimeout(() => { if (conn === session && !w.closed) { conn.mom = true; writeNow('|07\r\n+++ATH0 ~~~~ ~ ~~#@!~~ ~~\r\n'); hangup(); K.secret('bbsmom'); sfx('uhoh'); msg('Somebody picked up the phone!', 'Mom: "Hello? HELLO? What is that NOISE? JACK! Are you on the Internet? I need to ring Nan!"\n\nNO CARRIER', 'warn'); } }, rnd(240, 420) * 1000);
      if (scr && !touchy()) scr.focus();
      try { await host(session); } catch (e) { if (e !== HANGUP) console.error(e); }
      if (conn === session) { await out('|07\r\n\r\nNO CARRIER\r\n').catch(() => {}); hangup(true); }
    }
    function hangup(quiet) {
      clearTimeout(momTimer);
      if (!conn) return;
      conn.alive = false; conn = null; queue = []; typeahead = [];
      outRes.forEach(o => o.rej(HANGUP)); outRes = [];
      if (waiter) { const wt = waiter; waiter = null; wt.rej(HANGUP); }
      drawKeys(); setLeds('idle');
      if (!quiet && !w.closed) writeNow('|07\r\nNO CARRIER\r\n');
      if (!w.closed) { w.status.textContent = 'Disconnected'; where.textContent = ''; }
      dirty = true;
    }
    function props() {
      K.dialog('Properties', `<div class="of-grid2"><label>Emulation:</label><select class="pe"><option value="ansi">ANSI (colour)</option><option value="green">VT100 (green screen)</option><option value="amber">VT100 (amber screen)</option></select><label>Backscroll buffer:</label><span class="of-small">${MAXL} lines</span><label>Modem:</label><span class="of-small">33,600 bps, 8 data bits, no parity, 1 stop bit</span><label>Mom detector:</label><span class="of-small">not installed (she always finds out)</span></div>`, [['OK', bb => { scheme = qs(bb, '.pe').value; store.set('jhp_office_htscheme', scheme); applyScheme(); }], ['Cancel']], { w: 380, icon: I.hyper }).b.querySelector('.pe').value = scheme;
    }
    A.menubar(w, [
      ['File', [{ label: 'New Connection...', act: dialDlg }, { label: 'Open...', act: () => tb.btns.dial && K.fileDlg({ mode: 'open', title: 'Open', types: [['Session files (*.ht)', ['ht']]], dir: 'C:/Program Files/Accessories/HyperTerminal', icon: I.hyper }, n => n.bbs && dial(n.bbs)) }, '-', { label: 'Properties', act: props }, '-', { label: 'Exit', key: 'Alt+F4', act: w.close }]],
      ['Edit', [{ label: 'Copy', key: 'Ctrl+C', act: () => document.execCommand('copy') }, { label: 'Paste to Host', act: () => { const t = inp.value; if (t) { inp.value = ''; [...t].forEach(key); } else toast('HyperTerminal', 'Type in the box at the bottom, then Paste to Host sends it.', 3000); } }, { label: 'Select All', act: () => { const r = document.createRange(); r.selectNodeContents(scr); getSelection().removeAllRanges(); getSelection().addRange(r); } }, { label: 'Clear Screen', act: () => { lines = [[]]; cy = cx = 0; dirty = true; } }]],
      ['View', () => [{ label: 'Toolbar', chk: tb.style.display !== 'none', act: () => { tb.style.display = tb.style.display === 'none' ? '' : 'none'; } }, { label: 'Keypad Bar', chk: !keysEl.hidden, act: () => { keysEl.hidden = !keysEl.hidden; } }, '-', { label: 'ANSI colours', rad: scheme === 'ansi', act: () => { scheme = 'ansi'; store.set('jhp_office_htscheme', scheme); applyScheme(); } }, { label: 'Green screen', rad: scheme === 'green', act: () => { scheme = 'green'; store.set('jhp_office_htscheme', scheme); applyScheme(); } }, { label: 'Amber screen', rad: scheme === 'amber', act: () => { scheme = 'amber'; store.set('jhp_office_htscheme', scheme); applyScheme(); } }]],
      ['Call', () => [{ label: 'Connect', dis: !!conn, act: dialDlg }, { label: 'Disconnect', dis: !conn, act: () => hangup() }]],
      ['Transfer', [{ label: 'Send File...', act: () => tb.btns.dial && msg('Send File', 'Uploading is disabled. The sysop says "no more pictures of your cat".', 'info') }, { label: 'Receive File...', act: () => A.open('explorer', 'C:\\Program Files\\Accessories\\HyperTerminal\\Received') }, { label: 'Capture Text...', act: () => { stCap.textContent = stCap.textContent === 'Capture' ? 'CAPTURE ON' : 'Capture'; toast('Capture Text', 'Capturing to C:\\My Documents\\CAPTURE.TXT. (In your head. Remember everything.)', 3000); } }, { label: 'Send Text File...', act: () => msg('Send Text File', 'Pick a .txt file to send... actually, just type it. It\'s quicker at this speed.', 'info') }]],
      ['Help', [{ label: 'Help Topics', act: () => A.openFile({ name: 'HyperTerminal Help.txt', type: 'txt', text: HT_HELP }) }, '-', { label: 'About HyperTerminal', act: () => msg('About HyperTerminal', 'HyperTerminal\nVersion 4.10.1999\n\nDial up bulletin boards with your modem! Read messages! Play games! Run up the phone bill!\n\nBBS numbers are in C:\\Program Files\\Accessories\\HyperTerminal.', 'info') }]],
    ]);

    // ================================================================ the host programs (BBS software)
    async function host(S) {
      const bb = S.bbs, k = S.k, T = {
        print: s => out(s.replace(/\n/g, '\r\n').replace(/\r\r\n/g, '\r\n')),
        key: (prompt, valid) => (prompt ? T.print(prompt) : Promise.resolve()).then(() => waitFor('key', { valid: valid ? valid.split('').concat(valid.includes('\r') ? [] : []) : null })),
        line: (prompt, max, mask) => (prompt ? T.print(prompt) : Promise.resolve()).then(() => waitFor('line', { max: max || 60, mask })),
        pause: ms => new Promise((res, rej) => setTimeout(() => S.alive ? res() : rej(HANGUP), ms)),
        more: () => T.key('|08[|15Press any key|08]|07 ').then(() => T.print('\r                    \r')),
      };
      const c1 = bb.col[0], c2 = bb.col[1];
      // ---- logo
      await T.print('|CL' + LOGO[k]());
      await T.pause(300);
      // ---- login
      let handle = '';
      while (!handle) { handle = (await T.line(`\n|${c1}Enter your handle |08(or |15NEW|08)|${c1}: |15`, 20)).trim(); if (/^new$/i.test(handle)) handle = (await T.line(`|${c1}Pick a handle: |15`, 20)).trim(); }
      const pw = await T.line(`|${c1}Password: |15`, 16, true);
      if (/^password$/i.test(pw)) await T.print('|12That is NOT a good password. (Logging you in anyway.)\n');
      await T.print(`\n|07Checking... |10OK!\n`);
      let callNo = 1000 + (store.get('jhp_office_bbscalls', 0) + 1); store.set('jhp_office_bbscalls', callNo - 999);
      try { if (window.Net && Net.connected) { Net.kv.inc('office.bbs.calls.' + k); const v = await Net.kv.get(['office.bbs.calls.' + k]); if (typeof v['office.bbs.calls.' + k] === 'number') callNo = 1300 + v['office.bbs.calls.' + k]; } } catch (e) {}
      await T.print(`|${c2}Welcome, |15${handle}|${c2}! You are caller |15#${callNo}|${c2}. Last on: |15never|${c2}. Time left today: |1560 min\n`);
      await T.print(`|08${'-'.repeat(79)}\n|${c1}${wrap(BULLETINS[k])}\n|08${'-'.repeat(79)}\n`);
      await T.more();
      // ---- main menu
      for (;;) {
        await T.print(MENU(k, c1, c2));
        const ch = await T.key(`|${c1}${bb.name} |08[|15${handle}|08] |${c2}Command: |15`, 'MFDCWBGPQ?');
        await T.print(ch + '\n');
        if (ch === 'M') await boards(T, k, c1, c2, handle);
        else if (ch === 'F') await files(T, k, c1, c2);
        else if (ch === 'D') await doors(T, k, c1, c2, handle);
        else if (ch === 'C') await sysopChat(T, k, c1, c2, handle);
        else if (ch === 'W') await whos(T, c1, c2, handle);
        else if (ch === 'B') { await T.print(`\n|${c1}${wrap(BULLETINS[k])}\n`); await T.more(); }
        else if (ch === 'P') await wall(T, c1, c2, true);
        else if (ch === 'G' || ch === 'Q') { await T.print(`\n|${c1}Thanks for calling ${bb.name}, |15${handle}|${c1}! ${GOODBYE[k]}\n|07`); await T.pause(800); return; }
      }
    }
    const MENU = (k, a, b2) => {
      const box = (title) => `\n|${b2}╔${'═'.repeat(47)}╗\n|${b2}║|${a}${center(title, 47).padEnd(47)}|${b2}║\n|${b2}╠${'═'.repeat(47)}╣\n`;
      const row = (key2, label) => `|${b2}║ |08[|15${key2}|08] |${a}${label.padEnd(42)}|${b2}║\n`;
      return box(BBS[k].name.toUpperCase() + ' - MAIN MENU') + row('M', 'Message boards') + row('P', 'The Wall (live, everyone can see it!)') + row('F', 'File library') + row('D', 'Door games') + row('C', `Chat with the sysop (${BBS[k].sysop})`) + row('W', 'Who\'s online') + row('B', 'Bulletins') + row('G', 'Goodbye (log off)') + `|${b2}╚${'═'.repeat(47)}╝|07\n`;
    };
    const GOODBYE = { grot: 'Logging off... Come back soon. (Mind the shed step.)', star: 'May the Force be with you. (Always.)', pixel: 'GAME OVER. Insert coin to continue.', bunker: 'Stay stocked. Stay calm. Stay tuned.', squig: 'bye. feed the hamster on your way out.' };
    const LOGO = {
      grot: () => rule('▒', '02') + big('BYTE HOLE', '█', ['10', '10', '02', '02', '02'], 3) + center('|12~ ~ ~  |14T H E   F R I E N D L I E S T   B B S   O N   T H E   L I N E  |12~ ~ ~') + '\r\n' + `|02    .--------.\r\n|02    | |12o  o|02 |     |10Sysop: |15ByteBoss\r\n|02    |  |15--|02  |     |10Node 1 of 1 |08(the shed)\r\n|02    '--------'     |10Running: |15ByteBoard 2.1\r\n|02     _|____|_\r\n` + rule('▒', '02'),
      star: () => '|08 .   *    .  |15*|08     .    .   |15*|08      .   *   .        |15.|08      *    .    |15*|08   .\r\n' + big('STARBASE', '▓', ['15', '11', '11', '03', '03'], 4) + big(' 1999', '▓', ['14', '14', '06', '06', '06'], 20) + '|08   *   .    |15.|08    *       .   |15*|08    .     *   |15.|08     .   *    .   *  .\r\n' + center('|11A long time ago, on a phone line far, far away...') + '\r\n' + center('|14>>> UK RELEASE: 16 JULY 1999 <<<') + '\r\n',
      pixel: () => '|13' + '░▒'.repeat(39) + '\r\n' + big('PIXEL', '█', ['13', '14', '13', '14', '13'], 14) + big('PALACE', '▄', ['14', '13', '14', '13', '14'], 10) + '|14' + '▒░'.repeat(39) + '\r\n' + center('|15INSERT COIN |08::|11 2400 BAUD ONLY |08::|15 HI-SCORE 151200') + '\r\n',
      bunker: () => '|12' + '▀'.repeat(79) + '\r\n' + big('Y2K BUNKER', '▀', ['15', '12', '15', '12', '15'], 7) + '|12' + '▄'.repeat(79) + '\r\n' + center('|BL|12WARNING|BL|15: THE MILLENNIUM BUG IS COMING. ARE YOU READY?') + '\r\n' + center(`|07Days left: |15${Math.max(0, Math.round((Date.UTC(1999, 11, 31) - Date.UTC(1999, today().m - 1, today().d)) / 864e5))}`) + '\r\n',
      squig: () => '|04' + '~'.repeat(79) + '\r\n' + big('THE PEN', '█', ['09', '09', '04', '04', '09'], 7) + '|09        ___\r\n|09       (|14o o|09)     |15WELCOME TO THE SECRET BBS\r\n|09       ( V )     |07sysop: |15GUBBINZ |07(definitely not a hamster)\r\n|09       /|||\\\r\n|04' + '~'.repeat(79) + '\r\n',
    };
    async function boards(T, k, a, b2) {
      const list = BOARDS[k];
      for (;;) {
        await T.print(`\n|${b2}MESSAGE BOARDS\n` + list.map((bd, i) => `|08[|15${i + 1}|08] |${a}${bd[0]} |08(${bd[1].filter(m => m[0] <= today().md).length} msgs)`).join('\n') + `\n|08[|15W|08] |${a}The Wall |08(live)\n|08[|15Q|08] |${a}Back to main menu\n`);
        const ch = await T.key(`|${b2}Board: |15`, list.map((_, i) => String(i + 1)).join('') + 'WQ\r');
        await T.print(ch + '\n');
        if (ch === 'Q' || ch === '\r') return;
        if (ch === 'W') { await wall(T, a, b2); continue; }
        const msgs = list[+ch - 1][1].filter(m => m[0] <= today().md);
        let i = 0;
        while (i < msgs.length) {
          const m = msgs[i];
          await T.print(`\n|${b2}Msg ${i + 1} of ${msgs.length}  |08Date: |07${d99(m[0])}\n|08From: |15${m[1]}   |08To: |07${m[2]}\n|08Subj: |14${m[3]}\n|08${'-'.repeat(60)}\n|07${wrap(m[4])}\n|08${'-'.repeat(60)}\n`);
          const c = await T.key(`|${b2}[|15N|${b2}]ext, [|15P|${b2}]rev, [|15R|${b2}]eply, [|15Q|${b2}]uit: |15`, 'NPRQ\r');
          await T.print(c + '\n');
          if (c === 'Q') break; if (c === 'P') i = Math.max(0, i - 1); else if (c === 'R') { await T.print(`|12Replies go on The Wall, where everyone can see them.\n`); await wall(T, a, b2, true); } else i++;
        }
        if (i >= msgs.length) await T.print(`|08(end of messages)\n`);
      }
    }
    async function wall(T, a, b2, post) {
      const KEY = 'office.bbs.wall';
      let list = [];
      try { if (window.Net && Net.connected) { const v = await Net.kv.get([KEY]); list = Array.isArray(v[KEY]) ? v[KEY] : []; } } catch (e) {}
      await T.print(`\n|${b2}═══ THE WALL ═══ |08shared by everyone calling any JackOS BBS, right now\n`);
      if (!list.length) await T.print('|08(nothing on the wall yet. be the first!)\n');
      for (const e of list.slice(-12)) { const d = new Date(e.ts || Date.now()); await T.print(`|08${pad2(d.getHours())}:${pad2(d.getMinutes())} |15${String(e.by || '?').slice(0, 16)}|08: |07${String(e.text || '').replace(/\|/g, '/').slice(0, 300)}\n`); }
      if (!post) { const c = await T.key(`|${b2}[|15P|${b2}]ost a message, or any other key to go back: |15`); await T.print('\n'); if (c !== 'P') return; }
      const text = (await T.line(`|${b2}Your message (max 200, Enter to send, blank to cancel):\n|15`, 200)).trim();
      if (!text) return;
      if (window.Net && Net.connected && Net.kv.push(KEY, text)) { K.secret('bbspost'); await T.print(`|10Posted! Everyone on the site can read it now.\n`); }
      else await T.print(`|12Couldn't post. (The BBS is having a cup of tea. Try again in a minute.)\n`);
    }
    async function files(T, k, a, b2) {
      const list = FILES[k] || [];
      const bps = BBS[k].baud, cps2 = Math.round(bps / 10 * 0.96);
      for (;;) {
        await T.print(`\n|${b2}FILE LIBRARY |08(${bps} baud: about ${cps2} bytes a second)\n|08 #  Name          Size     Description\n` + list.map((f, i) => `|15${String(i + 1).padStart(2)}  |14${f[0].padEnd(13)} |07${(Math.round(f[1] / 1024) + 'K').padStart(5)}    |${a}${f[2]}`).join('\n') + '\n');
        const ch = await T.key(`|${b2}[|15D|${b2}]ownload, [|15Q|${b2}]uit: |15`, 'DQ\r');
        await T.print(ch + '\n');
        if (ch !== 'D') return;
        const n = (await T.line(`|${b2}Which file number? |15`, 2)).trim();
        const f = list[+n - 1];
        if (!f) { await T.print('|12No such file.\n'); continue; }
        const secs = Math.ceil(f[1] / cps2);
        await T.print(`|07Protocol: |15Zmodem|07. Estimated time: |15${Math.floor(secs / 60)}:${pad2(secs % 60)}|07. Press |15Ctrl+X|07 (or |15A|07) to abort.\n|10Starting Zmodem transfer...\n`);
        const ok = await transfer(T, f, cps2);
        if (ok) { K.addDownload({ name: f[0].replace(/\.(ZIP|EXE|WAV|BMP|DOC)$/i, '.TXT'), date: d99(today().md), size: Math.round(f[1] / 1024) + ' KB', text: f[3] }); K.secret('bbsdl'); await T.print(`\n|10Transfer complete! |07Saved to |15C:\\Program Files\\Accessories\\HyperTerminal\\Received\n`); }
        else await T.print(`\n|12Transfer aborted.\n`);
      }
    }
    function transfer(T, f, cps2) {
      return new Promise((res, rej) => {
        let got = 0; const t1 = Date.now(), total = f[1];
        const abortKey = waitFor('key', { valid: ['\x18', 'A'] }).then(() => { done(false); }, () => {});
        let fin = false;
        const done = ok => { if (fin) return; fin = true; clearInterval(iv); if (waiter) { const wt = waiter; waiter = null; drawKeys(); wt.res(''); } res(ok); };
        const iv = setInterval(() => {
          if (!conn || w.closed) { clearInterval(iv); fin = true; return rej(HANGUP); }
          got = Math.min(total, Math.round((Date.now() - t1) / 1000 * cps2));
          const pct = got / total, bar = '█'.repeat(Math.round(pct * 30)) + '░'.repeat(30 - Math.round(pct * 30)), left = Math.max(0, Math.ceil((total - got) / cps2));
          writeNow(`\r|07${f[0].padEnd(12)} |10${bar} |15${String(Math.round(pct * 100)).padStart(3)}% |07${String(got).padStart(6)} bytes  ETA ${Math.floor(left / 60)}:${pad2(left % 60)} `);
          if (got >= total) done(true);
        }, 250);
        void abortKey;
      });
    }
    async function whos(T, a, b2, handle) {
      const ppl = (K.online || []).filter(p => !(window.Net && Net.me && p.id === Net.me.id)).slice(0, 8);
      await T.print(`\n|${b2}WHO'S ONLINE\n|08Node  Handle               Doing\n|15  1   ${handle.padEnd(20)} |07Looking at this list\n`);
      const doing = ['Reading messages', 'In a door game', 'Downloading at 2400 baud (send help)', 'Paging the sysop', 'Idle (making toast)', 'On the JackNet web'];
      for (let i = 0; i < ppl.length; i++) await T.print(`|15  ${i + 2}   ${String(ppl[i].nick || 'Guest').slice(0, 20).padEnd(20)} |07${ppl[i].where ? 'On the website: ' + String(ppl[i].where).slice(0, 30) : pick(doing)}\n`);
      if (!ppl.length) await T.print(`|08  (nobody else. it's just you and the sysop. and the sysop is asleep.)\n`);
      await T.more();
    }
    // ---- sysop chat: it's Gubbinz. It's always Gubbinz.
    async function sysopChat(T, k, a, b2, handle) {
      const sys = BBS[k].sysop;
      await T.print(`\n|${b2}Paging the sysop...`);
      for (let i = 0; i < 3; i++) { await T.pause(700); await T.print(' |BE|15*BEEP*'); }
      await T.print(`\n\n|14${sys} has entered chat. |08(type, then Enter. A blank line leaves chat.)\n\n`);
      const persona = k === 'squig' ? 0 : 3;
      const lines = [
        `Hello ${handle}. This is ${sys}, the sysop. How can I help you today.`,
        `Yes. I am a normal human sysop. I have normal human hands. Ten fingers. All of them. Not green.`,
        `Sorry. Typo. I am very tired from doing sysop stuff. Like computers. And having hands.`,
        `...`,
        `ok fine. it's me. GUBBINZ. the real sysop went to make a cup of tea and left the keyboard on.`,
        `it looks like you're chatting to a sysop! would you like help? (don't tell ${sys}. if you tell, i will eat your floppy disks. ALL of them.)`,
        `do you have any biscuits. asking for a friend. the friend is me.`,
        `i have to go, i can hear the kettle. BYE. you saw NOTHING.`,
      ];
      let i = k === 'squig' ? 4 : 0;
      const say = async s => { await T.print(`|${i >= 4 ? '10' : '14'}${i >= 4 ? 'GUBBINZ' : sys}> |${i >= 4 ? '10' : '15'}`); for (const ch of s) { await T.print(ch); if (Math.random() < 0.15) await T.pause(rnd(40, 160)); } await T.print('\n'); };
      await say(lines[i++]);
      void persona;
      for (;;) {
        const t = (await T.line(`|11${handle}> |07`, 70)).trim();
        if (!t) break;
        await T.pause(rnd(500, 1300));
        if (/gubbinz|grot|squig|green|biscuit|hamster/i.test(t) && i < 4) i = 4;
        if (i >= lines.length) { await T.print(`|08${i >= 4 ? 'GUBBINZ' : sys} has left chat. (A kettle can be heard in the distance.)\n`); break; }
        await say(lines[i++]);
        if (i === 5) K.secret('bbssysop');
      }
      await T.print(`|${b2}Chat ended.\n`);
    }
    // ---- door games
    async function doors(T, k, a, b2, handle) {
      const list = { grot: [['1', 'Legend of the Red Dragonfly', 'lors']], star: [['1', 'Star Trader 99', 'trader']], pixel: [['1', 'Guess-O-Tron 2000', 'guess']], bunker: [['1', 'The Countdown Clock', 'countdown']], squig: [['1', 'Feed the Hamster', 'feed'], ['2', 'Legend of the Red Dragonfly', 'lors']] }[k] || [];
      await T.print(`\n|${b2}DOOR GAMES\n` + list.map(d => `|08[|15${d[0]}|08] |${a}${d[1]}`).join('\n') + `\n|08[|15Q|08] |${a}Back\n`);
      const ch = await T.key(`|${b2}Door: |15`, list.map(d => d[0]).join('') + 'Q\r');
      await T.print(ch + '\n');
      const d = list.find(x => x[0] === ch); if (!d) return;
      K.secret('bbsdoor');
      await T.print(`|08Opening door... loading DOOR.SYS... dropping you to ${d[1]}...\n`); await T.pause(600);
      await DOORS[d[2]](T, handle);
      await T.print(`\n|08Returning to ${BBS[k].name}...\n`); await T.pause(400);
    }
    // ---- start: a little welcome, then dial (or show the phone book)
    writeNow('|07JackOS HyperTerminal 4.10\r\n|08Modem: 33.6K on COM2. Ready.\r\n|07\r\n');
    fitFont();
    if (arg.dial && BBS[arg.dial]) setTimeout(() => dial(arg.dial), 100); else setTimeout(dialDlg, 100);
    return w;
  }

  // ================================================================ DOOR: Legend of the Red Dragonfly (a tiny LORD-style RPG; key 'lors' = the old Red Squig)
  const LKEY = 'jhp_office_lors';
  const MON = [ // level -> [name, hp, atk, gold, xp]
    [['Garden Gnome', 5, 2, 8, 3], ['Angry Mushroom', 7, 3, 10, 4], ['Lost Tourist', 6, 1, 25, 2], ['Small Dragonfly', 8, 3, 12, 5]],
    [['Goblin With A Stick', 14, 5, 22, 9], ['Feral Hamster', 18, 6, 30, 12], ['Wandering Imp', 16, 5, 28, 10], ['Very Rude Goose', 15, 7, 15, 11]],
    [['Clockwork Hound', 28, 9, 50, 20], ['Boar (Grumpy)', 32, 10, 45, 22], ['Bog Troll (Small)', 35, 11, 60, 25], ['A Haunted Lunchbox', 26, 12, 70, 24]],
    [['Big Dragonfly', 48, 14, 90, 40], ['Swamp Thing (Medium)', 52, 15, 100, 42], ['Rock Lobster', 45, 17, 110, 45], ['Mutant Turnip', 50, 16, 95, 41]],
    [['Giant Dragonfly', 70, 20, 160, 70], ['Ogre (Off Duty)', 80, 22, 180, 75], ['The Tax Man', 60, 25, 0, 80], ['Midge Swarm', 75, 21, 150, 72]],
  ];
  const MASTERS = ['Squire Sam', 'Goblin Chief Nitbit', 'Sir Spannerz', 'Wizard Bigbeard'];
  const WEAPONS = [['Stick', 0, 0], ['Sharp Stick', 2, 60], ['Sword', 5, 200], ['Big Sword', 9, 600], ['Flaming Sword (red)', 14, 1500]];
  const ARMOUR = [['Vest', 0, 0], ['Tin Hat', 2, 50], ['Leather Jerkin', 4, 180], ['Plate (dented)', 7, 520], ['Dragon Armour (red)', 11, 1400]];
  async function lors(T, handle) {
    const today9 = new Date().toDateString();
    let P = store.get(LKEY, null);
    if (!P) P = { lvl: 1, xp: 0, hp: 20, max: 20, str: 5, gold: 30, wep: 0, arm: 0, day: '', turns: 0, won: 0 };
    if (P.day !== today9) { P.day = today9; P.turns = 15; P.hp = Math.max(P.hp, P.max); }
    const save = () => store.set(LKEY, P);
    const need = () => [0, 20, 60, 150, 320, 600][P.lvl] || 9999;
    await T.print(`|CL|12${'▄'.repeat(79)}\n` + big('DRAGONFLY', '█', ['12', '12', '04', '04', '04'], 8) + `|12${'▀'.repeat(79)}\n` + center('|14L E G E N D   O F   T H E   R E D   D R A G O N F L Y') + '\n' + center('|08an original door game, for one brave hero at a time') + '\n\n');
    await T.print(`|07Somewhere in the swamp, the |12GREAT RED DRAGONFLY|07 is eating everybody's lunches.\nOnly a hero of level |155|07 or more can face it. You are level |15${P.lvl}|07.\n`);
    for (;;) {
      save();
      await T.print(`\n|10═══ |15THE VILLAGE |10═══  |07HP |15${P.hp}/${P.max}  |07Gold |14${P.gold}  |07XP |15${P.xp}/${need()}  |07Fights left |15${P.turns}\n|08[|15F|08]|07orest  |08[|15T|08]|07rain with ${MASTERS[Math.min(P.lvl, 4) - 1]}  |08[|15W|08]|07eapons  |08[|15A|08]|07rmour\n|08[|15H|08]|07ealer  |08[|15V|08]|07iew stats  |08[|15S|08]|07wamp cave  |08[|15Q|08]|07uit\n`);
      const c = await T.key('|10Your choice: |15', 'FTWAHVSQ');
      await T.print(c + '\n');
      if (c === 'Q') { save(); return; }
      if (c === 'V') { await T.print(`|15${handle}|07, level ${P.lvl} hero.\nWeapon: |14${WEAPONS[P.wep][0]}|07  Armour: |14${ARMOUR[P.arm][0]}|07  Strength: |15${P.str}|07\nGreat Red Dragonflies defeated: |12${P.won}\n`); continue; }
      if (c === 'H') { const cost = (P.max - P.hp) * 2; if (!cost) { await T.print('|07The healer looks you up and down. "You\'re fine. Go away."\n'); continue; } if (P.gold < cost) { await T.print(`|07Healing costs ${cost} gold. You have ${P.gold}. The healer gives you a plaster for free.\n`); P.hp = Math.min(P.max, P.hp + 3); continue; } P.gold -= cost; P.hp = P.max; await T.print(`|10You feel brand new! |07(-${cost} gold)\n`); continue; }
      if (c === 'W' || c === 'A') {
        const L = c === 'W' ? WEAPONS : ARMOUR, curI = c === 'W' ? P.wep : P.arm;
        await T.print(L.map((x, i) => `|08[|15${i}|08] |${i === curI ? '10' : '07'}${x[0].padEnd(22)} |14${String(x[2]).padStart(5)} gold  |07+${x[1]}`).join('\n') + '\n');
        const n = await T.key('|07Buy which (or Enter to leave)? |15', '01234\r');
        await T.print('\n');
        const i = +n; if (n === '\r' || i <= curI) continue;
        if (P.gold < L[i][2]) { await T.print('|12"You can\'t afford that," says the shopkeeper, and eats a pie at you.\n'); continue; }
        P.gold -= L[i][2]; if (c === 'W') P.wep = i; else P.arm = i; await T.print(`|10You bought the ${L[i][0]}!\n`); continue;
      }
      if (c === 'T') {
        if (P.lvl >= 5) { await T.print('|07"There\'s nothing more I can teach you," says the master. "Go and find that dragonfly."\n'); continue; }
        if (P.xp < need()) { await T.print(`|07${MASTERS[P.lvl - 1]} says: "Come back when you have ${need()} experience. You have ${P.xp}."\n`); continue; }
        const won = await fight(T, P, [MASTERS[P.lvl - 1], 10 + P.lvl * 12, 3 + P.lvl * 3, 0, 0], true);
        if (won) { P.lvl++; P.max += 12 + P.lvl * 3; P.hp = P.max; P.str += 3; await T.print(`|14*** You beat ${MASTERS[P.lvl - 2]}! You are now level ${P.lvl}! ***\n|07Max HP and strength go up.\n`); sfx('solve'); }
        continue;
      }
      if (c === 'F') {
        if (P.turns <= 0) { await T.print('|07You are too tired to fight any more today. Come back tomorrow. (Real tomorrow.)\n'); continue; }
        if (P.hp <= 0) { await T.print('|07You are dead. Come back tomorrow. (This is how it worked in 1999.)\n'); continue; }
        P.turns--;
        const ev = Math.random();
        if (ev < 0.1) { const g = rnd(5, 20) * P.lvl; P.gold += g; await T.print(`|14You find a bag of ${g} gold under a mushroom. Nobody saw. It's yours now.\n`); continue; }
        if (ev < 0.15) { await T.print('|13A fairy offers to tell you the future. "It\'s 1999," she says, and flies off.\n'); continue; }
        await fight(T, P, pick(MON[Math.min(P.lvl, 5) - 1]).slice());
        continue;
      }
      if (c === 'S') {
        if (P.lvl < 5) { await T.print('|07A sign says: |12"GREAT RED DRAGONFLY. LEVEL 5 AND ABOVE ONLY. NO GOBLINS."|07 You are not ready.\n'); continue; }
        await T.print('|12The cave smells of old sandwiches. Something HUGE and RED wakes up...\n'); await T.pause(800);
        const won = await fight(T, P, ['THE GREAT RED DRAGONFLY', 160, 26, 1000, 500], true);
        if (won) { P.won++; save(); K.secret('bbsdragon'); sfx('waaagh'); await T.print(`\n|14████ YOU HAVE DEFEATED THE GREAT RED DRAGONFLY! ████\n|07Everybody gets their lunches back. The village throws a party.\nByteBoss leans over and whispers a secret: |15"The Pen BBS. 01632 960743. Not in any phone book."\n`); }
        continue;
      }
    }
  }
  async function fight(T, P, m, boss) {
    let [name, hp, atk, gold, xp] = m;
    await T.print(`\n|12${boss ? '!!! ' : ''}You meet ${/^[A-Z]/.test(name) && !/^(A|The) /.test(name) ? 'a ' : ''}${name}!${boss ? ' !!!' : ''}\n`);
    for (;;) {
      await T.print(`|07Your HP: |15${P.hp}  |07${name}'s HP: |15${hp}\n`);
      const c = await T.key(`|08[|15A|08]|07ttack  |08[|15R|08]|07un: |15`, 'AR');
      await T.print(c + '\n');
      if (c === 'R') { if (!boss && Math.random() < 0.6) { await T.print('|07You run away. Bravely.\n'); return false; } await T.print('|12You trip over a root. No escape!\n'); }
      else { const dmg = Math.max(1, rnd(Math.ceil(P.str / 2), P.str) + WEAPONS[P.wep][1] - (boss ? 2 : 0)); hp -= dmg; await T.print(`|10You hit ${name} for ${dmg}!${dmg > P.str + 6 ? ' |14CRITICAL!' : ''}\n`); }
      if (hp <= 0) { P.gold += gold; P.xp += xp; await T.print(`|14You defeated ${name}! |07+${gold} gold, +${xp} XP\n`); return true; }
      const hit = Math.max(0, rnd(Math.ceil(atk / 2), atk) - ARMOUR[P.arm][1]);
      P.hp -= hit; await T.print(hit ? `|12${name} hits you for ${hit}!\n` : `|07${name} misses!\n`);
      if (P.hp <= 0) { P.hp = 0; P.gold = Math.floor(P.gold / 2); await T.print('|12You have been defeated! You lose half your gold and wake up in the village pond.\n|07(Come back tomorrow to fight again.)\n'); return false; }
    }
  }
  // ================================================================ DOOR: Star Trader 99 (a tiny space trading game)
  const SKEY = 'jhp_office_trader';
  const GOODS = ['Ore', 'Grub', 'Gizmos'], BASE = [20, 35, 70];
  const SECTORS = (() => { const s = {}; let seed = 1999; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647; for (let i = 1; i <= 20; i++) s[i] = { links: [], port: R() < 0.75 ? GOODS.map(() => R() < 0.5 ? 'B' : 'S').join('') : null, name: ['Tattyween-ish', 'Wotsit Prime', 'Deep Space Nein', 'Gubbinzia', 'Rock 7', 'Moon of Moons', 'Blobbit Nebula', 'Dave\'s Quadrant', 'The Bit At The Edge', 'Starbase Central', 'Asteroid Junction', 'Pizza Nebula', 'Port Gubbinz', 'Old Station 14', 'Kessel-ish Run', 'Planet Beige', 'The Big Empty', 'Customs Point', 'Comet Corner', 'Outer Ringroad'][i - 1] }; for (let i = 1; i <= 20; i++) { const a = i % 20 + 1, b = ((i + 6) % 20) + 1; [a, b].forEach(j => { if (!s[i].links.includes(j)) s[i].links.push(j); if (!s[j].links.includes(i)) s[j].links.push(i); }); } return s; })();
  async function trader(T) {
    const day = new Date().toDateString();
    let P = store.get(SKEY, null) || { sec: 10, cr: 500, holds: 20, cargo: [0, 0, 0], turns: 0, day: '', best: 500 };
    if (P.day !== day) { P.day = day; P.turns = 60; }
    const save = () => { P.best = Math.max(P.best, P.cr); store.set(SKEY, P); };
    const price = (sec, g) => { const h2 = (sec * 31 + g * 17 + new Date().getHours()) % 13; return Math.round(BASE[g] * (0.7 + h2 / 20)); };
    await T.print('|CL|08 .  * .   |15*|08    .    *   .   |15.|08   *    .    *   .  |15*|08   .   *    .   * .  |15*\n' + big('TRADER 99', '▓', ['11', '11', '03', '03', '03'], 6) + center('|14S T A R   T R A D E R   9 9') + '\n' + center('|08Buy low. Sell high. Avoid Gungans.') + '\n');
    await T.print(`|07Get to |1510,000 credits|07 to become a Legendary Trader. Your best so far: |14${P.best}\n`);
    for (;;) {
      save();
      if (P.cr >= 10000) K.secret('bbstrade');
      const S = SECTORS[P.sec], used = P.cargo.reduce((a, b) => a + b, 0);
      await T.print(`\n|11Sector |15${P.sec}|11: |14${S.name}  |07Credits |15${P.cr}  |07Holds |15${used}/${P.holds}  |07Turns |15${P.turns}\n|07Cargo: ${GOODS.map((g, i) => `${g} |15${P.cargo[i]}|07`).join('  ')}\n|07Warp lanes to: |15${S.links.join(', ')}|07   ${S.port ? `Port here: |10${S.port.split('').map((x, i) => (x === 'B' ? 'buys ' : 'sells ') + GOODS[i]).join(', ')}` : '|08(no port)'}\n|08[|15M|08]|07ove  |08[|15P|08]|07ort  |08[|15H|08]|07olds (buy more)  |08[|15Q|08]|07uit\n`);
      const c = await T.key('|11Command: |15', 'MPHQ');
      await T.print(c + '\n');
      if (c === 'Q') { save(); return; }
      if (c === 'H') { const cost = 400 + P.holds * 20; const y = await T.key(`|07Extra 5 cargo holds cost |15${cost}|07 credits. Buy? (Y/N) |15`, 'YN'); await T.print(y + '\n'); if (y === 'Y') { if (P.cr < cost) await T.print('|12Not enough credits.\n'); else { P.cr -= cost; P.holds += 5; await T.print('|10Holds installed!\n'); } } continue; }
      if (c === 'M') {
        if (P.turns <= 0) { await T.print('|07Out of turns for today. Your engines need a nap. Come back tomorrow.\n'); continue; }
        const to = +(await T.line('|07Warp to sector: |15', 2)).trim();
        if (!S.links.includes(to)) { await T.print('|12No warp lane there. Space is big. Use a lane.\n'); continue; }
        P.sec = to; P.turns--;
        const ev = Math.random();
        if (ev < 0.08 && P.cargo[1] > 0) { const lost = Math.ceil(P.cargo[1] / 2); P.cargo[1] -= lost; await T.print(`|13A Gungan stowaway climbs out of your cargo hold. He has eaten ${lost} Grub. "Sorry!" he says, and leaves through the airlock (he's fine).\n`); }
        else if (ev < 0.13) { const g = rnd(50, 300); P.cr += g; await T.print(`|14You find an abandoned cargo pod worth ${g} credits!\n`); }
        else if (ev < 0.17) { const f = Math.min(P.cr, rnd(30, 150)); P.cr -= f; await T.print(`|12Space police! Your tail light is out. Fine: ${f} credits.\n`); }
        continue;
      }
      if (c === 'P') {
        if (!S.port) { await T.print('|07There is no port here. Just space. Lots of it.\n'); continue; }
        for (let g = 0; g < 3; g++) {
          const p = price(P.sec, g), free = P.holds - P.cargo.reduce((a, b) => a + b, 0);
          if (S.port[g] === 'B' && P.cargo[g] > 0) { const n = Math.min(P.cargo[g], +(await T.line(`|07We buy |14${GOODS[g]}|07 at |15${p}|07 each. Sell how many (you have ${P.cargo[g]})? |15`, 3)).trim() || 0); if (n > 0) { P.cargo[g] -= n; P.cr += n * p; await T.print(`|10Sold ${n} ${GOODS[g]} for ${n * p} credits.\n`); } }
          if (S.port[g] === 'S' && free > 0) { const max = Math.min(free, Math.floor(P.cr / p)); const n = Math.min(max, +(await T.line(`|07We sell |14${GOODS[g]}|07 at |15${p}|07 each. Buy how many (max ${max})? |15`, 3)).trim() || 0); if (n > 0) { P.cargo[g] += n; P.cr -= n * p; await T.print(`|10Bought ${n} ${GOODS[g]}.\n`); } }
        }
      }
    }
  }
  // ================================================================ DOOR: Guess-O-Tron, the Countdown Clock, Feed Da Squig
  async function guess(T) {
    await T.print('|CL' + big('GUESS', '█', ['13', '14', '13', '14', '13'], 20) + center('|15GUESS-O-TRON 2000 |08- I am thinking of a number from 1 to 100') + '\n');
    const n = rnd(1, 100); let tries = 0;
    for (;;) {
      const g = +(await T.line(`\n|14Guess #${tries + 1}: |15`, 3)).trim(); tries++;
      if (!g) { await T.print('|07That isn\'t a number. GUESS-O-TRON is disappointed.\n'); continue; }
      if (g === n) { await T.print(`|10*** CORRECT! *** |07${tries} guess${tries > 1 ? 'es' : ''}. ${tries <= 7 ? 'GUESS-O-TRON salutes you.' : 'Binary search, look it up.'}\n`); await T.key('|08[Press any key]|07'); return; }
      await T.print(g < n ? `|07Higher! ${pick(['', '(Much higher.)', '(Bit higher.)', ''])}\n` : `|07Lower! ${pick(['', '(Lower than that.)', '(Think smaller.)', ''])}\n`);
      if (tries >= 12) { await T.print(`|12Out of guesses! It was ${n}.\n`); await T.key('|08[Press any key]|07'); return; }
    }
  }
  async function countdown(T) {
    const t = today(), left = Math.round((Date.UTC(2000, 0, 1) - Date.UTC(1999, t.m - 1, t.d)) / 864e5);
    await T.print('|CL|12' + '▀'.repeat(79) + '\n' + big(String(left).padStart(3, ' '), '█', ['15', '15', '12', '12', '12'], 28) + center('|15DAYS UNTIL THE YEAR 2000') + '\n|12' + '▄'.repeat(79) + '\n');
    await T.print(`|07That's about |15${left * 24}|07 hours, |15${(left * 1440).toLocaleString('en-GB')}|07 minutes, or |15${Math.ceil(left / 7)}|07 tins of beans at one a week.\n|08(Colonel Countdown recommends one a DAY. To be safe.)\n`);
    await T.key('|08[Press any key]|07');
  }
  async function feed(T) {
    await T.print('|09\n   ___\n  (|14o o|09)   |15FEED THE HAMSTER\n  ( V )   |07He is hungry. He is ALWAYS hungry.\n  /|||\\\n');
    let fed = store.get('jhp_office_squigfed', 0);
    for (;;) {
      const c = await T.key(`|07[|15F|07]eed him, [|15P|07]at him, [|15Q|07]uit: |15`, 'FPQ');
      await T.print(c + '\n');
      if (c === 'Q') return;
      if (c === 'F') { fed++; store.set('jhp_office_squigfed', fed); await T.print(`|10CHOMP. |07He has been fed |15${fed}|07 times. He is still hungry.${fed % 10 === 0 ? ' |14BURP.' : ''}\n`); }
      else await T.print('|12He nibbles you. Hamsters do not like being patted. (He liked it a bit.)\n');
    }
  }
  const DOORS = { lors, trader, guess, countdown, feed };
  const HT_HELP = `HYPERTERMINAL HELP
==================

HyperTerminal lets your modem ring up a BULLETIN BOARD SYSTEM (a BBS): another computer, usually in
someone's bedroom (or shed), where you can read messages, download files and play "door" games.

DIALLING
  Call > Connect (or the phone button). Pick a BBS from the phone book and press Dial.
  The numbers are in C:\\Program Files\\Accessories\\HyperTerminal. One BBS isn't in any phone book.

ONCE YOU'RE ON
  Press the letter in [brackets] to pick something. Type your answers and press Enter.
  No keyboard handy? Use the box at the bottom (and the key buttons).
  M = messages, F = files, D = door games, C = chat to the sysop, G = goodbye.

THE WALL
  Messages on The Wall can be read by EVERYONE calling any JackOS BBS. Be nice.

DOWNLOADS
  At 2400 baud a 10K file takes about 40 seconds. That was normal. We had patience in 1999.
  Ctrl+X (or A) stops a download.

WARNING
  If somebody in your house picks up the phone while you're online, you get thrown off.
  This is not a bug. This is a Mom.
`;
  K.apps.hyper = arg => openHyper(arg);
  K.hyperBBS = BBS;
})();

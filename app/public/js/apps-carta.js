/* JackOS app pack "carta": the multimedia CD-ROM corner of the PC.
 *   JackCarta 99 (encyclopedia + Quiz Keep), JackOS Media Player, CD Player, Gubbinz Teaches Typing, Stamp Studio.
 * This file stays lean: Start menu, desktop icons, Run commands, secrets, files and file openers.
 * The programs themselves (and all the articles) lazy-load from js/carta-*.js the first time they open. */
(function () {
  const A = window.Apps; if (!A) return;
  const esc = A.esc;
  const h = (tag, cls, html) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const store = { get: (k, d) => A.store.get('jhp_carta_' + k, d), set: (k, v) => A.store.set('jhp_carta_' + k, v) };
  const mobile = () => innerWidth < 640;

  // ================================================================ icons (32x32, chunky, hand-drawn)
  const ICON = {
    carta: '<svg viewBox="0 0 32 32"><path d="M3 7l12-3v23L3 30z" fill="#1f3f9f" stroke="#000"/><path d="M15 4l2 1v23l-2-1z" fill="#0b1f5f" stroke="#000"/><path d="M5 27l10-2" stroke="#fff"/><path d="M5 10l8-2M5 13l8-2" stroke="#ffd400"/><circle cx="22" cy="14" r="8.5" fill="#2a7ad8" stroke="#000"/><path d="M17 10c2-1 3 1 5 0s1 3-1 4-1 3-3 2zM24 15c2 0 3 1 2 3s-3 2-3 0z" fill="#3a9a2a" stroke="#1f5e14" stroke-width=".6"/><path d="M13.5 14h17M22 5.5c-4 4-4 13 0 17M22 5.5c4 4 4 13 0 17" stroke="#9fd0ff" stroke-width=".7" fill="none"/><path d="M18 8a7 7 0 0 1 4-1.5" stroke="#fff" stroke-width="1.4" fill="none"/></svg>',
    castle: '<svg viewBox="0 0 32 32"><path d="M4 30V10h3v3h3v-3h3v3h6v-3h3v3h3v-3h3v20z" fill="#b8b8b8" stroke="#000"/><path d="M13 30v-8a3 3 0 0 1 6 0v8z" fill="#4a2a0a" stroke="#000"/><path d="M14 9V2l6 2-6 2" fill="#e10600" stroke="#000" stroke-width=".8"/><rect x="7" y="17" width="3" height="4" fill="#203060"/><rect x="22" y="17" width="3" height="4" fill="#203060"/></svg>',
    mplayer: '<svg viewBox="0 0 32 32"><rect x="2" y="5" width="28" height="22" fill="#404040" stroke="#000"/><rect x="5" y="8" width="22" height="13" fill="#000080" stroke="#808080"/><path d="M13 11v7l6-3.5z" fill="#ffd400" stroke="#000" stroke-width=".6"/><g fill="#c0c0c0"><rect x="3" y="6" width="1.5" height="2"/><rect x="3" y="11" width="1.5" height="2"/><rect x="3" y="16" width="1.5" height="2"/><rect x="27.5" y="6" width="1.5" height="2"/><rect x="27.5" y="11" width="1.5" height="2"/><rect x="27.5" y="16" width="1.5" height="2"/></g><rect x="5" y="23" width="22" height="2" fill="#808080"/><rect x="5" y="23" width="9" height="2" fill="#00e000"/></svg>',
    cdplayer: '<svg viewBox="0 0 32 32"><rect x="2" y="17" width="28" height="12" fill="#c0c0c0" stroke="#000"/><rect x="4" y="20" width="12" height="6" fill="#000" stroke="#808080"/><path d="M6 23h2M9 23h1M11 23h3" stroke="#0f0"/><rect x="19" y="21" width="3" height="3" fill="#808080"/><rect x="24" y="21" width="3" height="3" fill="#808080"/><circle cx="16" cy="10" r="8.5" fill="#e0e0f0" stroke="#000"/><path d="M10 6a8 8 0 0 1 6-3" stroke="#ff8ac0" stroke-width="2" fill="none"/><path d="M22 14a8 8 0 0 1-5 3" stroke="#9fd0ff" stroke-width="2" fill="none"/><circle cx="16" cy="10" r="2.5" fill="#fff" stroke="#000"/></svg>',
    typing: '<svg viewBox="0 0 32 32"><path d="M2 20h28v9H2z" fill="#e8e0c8" stroke="#000"/><g fill="#fff" stroke="#808080" stroke-width=".6"><rect x="4" y="22" width="3" height="2.5"/><rect x="8" y="22" width="3" height="2.5"/><rect x="12" y="22" width="3" height="2.5"/><rect x="16" y="22" width="3" height="2.5"/><rect x="20" y="22" width="3" height="2.5"/><rect x="24" y="22" width="4" height="2.5"/><rect x="9" y="25.5" width="14" height="2"/></g><rect x="9" y="5" width="14" height="12" fill="#3a9a2a" stroke="#000"/><path d="M9 8L4 5v6zM23 8l5-3v6z" fill="#3a9a2a" stroke="#000"/><rect x="11" y="8" width="3" height="3" fill="#fff"/><rect x="18" y="8" width="3" height="3" fill="#fff"/><rect x="12" y="9" width="2" height="2" fill="#e10600"/><rect x="19" y="9" width="2" height="2" fill="#e10600"/><path d="M12 14h8" stroke="#000" stroke-width="2"/><path d="M13 14v1M16 14v1M19 14v1" stroke="#fff"/></svg>',
    stamp: '<svg viewBox="0 0 32 32"><rect x="12" y="2" width="8" height="10" rx="3" fill="#e10600" stroke="#000"/><rect x="14" y="12" width="4" height="5" fill="#7a4a1a" stroke="#000"/><rect x="6" y="17" width="20" height="5" fill="#ffd400" stroke="#000"/><rect x="7" y="22" width="18" height="2" fill="#555" stroke="#000"/><path d="M16 25l1.5 2.5h2.5l-2 1.8.8 2.7-2.8-1.6-2.8 1.6.8-2.7-2-1.8h2.5z" fill="#2a7ad8" stroke="#000" stroke-width=".5"/></svg>',
    avi: '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/><rect x="9" y="12" width="15" height="12" fill="#404040" stroke="#000"/><path d="M14 15v6l5-3z" fill="#ffd400"/><g fill="#fff"><rect x="10" y="13" width="1.5" height="1.5"/><rect x="10" y="17" width="1.5" height="1.5"/><rect x="10" y="21" width="1.5" height="1.5"/><rect x="21.5" y="13" width="1.5" height="1.5"/><rect x="21.5" y="17" width="1.5" height="1.5"/><rect x="21.5" y="21" width="1.5" height="1.5"/></g></svg>',
    mpg: '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/><rect x="9" y="12" width="15" height="12" fill="#5b16c9" stroke="#000"/><path d="M14 15v6l5-3z" fill="#fff"/><path d="M9 26h15" stroke="#5b16c9" stroke-width="2"/></svg>',
    stp: '<svg viewBox="0 0 32 32"><path d="M6 2h15l6 6v22H6z" fill="#fff" stroke="#000"/><path d="M21 2v6h6" fill="#ddd" stroke="#000"/><path d="M16 11l2.2 4.4 4.8.6-3.5 3.4.9 4.8-4.4-2.4-4.4 2.4.9-4.8-3.5-3.4 4.8-.6z" fill="#ffd400" stroke="#000" stroke-width=".7"/></svg>',
    cert: '<svg viewBox="0 0 32 32"><rect x="3" y="6" width="26" height="20" fill="#fff8dc" stroke="#000"/><rect x="5" y="8" width="22" height="16" fill="none" stroke="#b08a00"/><path d="M9 12h14M9 15h10M9 18h12" stroke="#000080"/><circle cx="23" cy="22" r="4" fill="#e10600" stroke="#000"/><path d="M21 25l-1 5 3-2 3 2-1-5" fill="#e10600" stroke="#000" stroke-width=".6"/></svg>',
  };
  // the official JackOS 98 icons (icons.js) where they're the specific match
  if (window.JICON) Object.assign(ICON, { carta: JICON.icon('carta'), mplayer: JICON.icon('media'), cdplayer: JICON.icon('cdplayer'), typing: JICON.icon('typing'), avi: JICON.icon('avi'), mpg: JICON.icon('avi'), stamp: JICON.icon('stamp') });
  const ICO16 = s => s; // the window manager scales 32x32 viewBoxes down to 16x16 itself

  // ================================================================ lazy programs: a window opens at once, the code loads into it
  const mods = {};   // filled by js/carta-*.js: mods.encyc = (w, arg) => {...}
  const api = {};    // live programs publish small APIs here (api.mplayer.play(node), api.cd.insert(id) ...)
  const LOADING_MSG = { encyc: 'Reading JackCarta 99 Disc 1...', mplayer: 'Loading codecs...', cd: 'Spinning up the CD-ROM...', typing: 'Waking up Gubbinz...', stamp: 'Inking the stamps...' };
  function lazy(id, mod, title, icon, opts, cmds) {
    A.register(id, { single: true, cmd: cmds, open(arg) {
      const body = h('div', 'ct-loading', `<span class="ct-spin"></span><span>${esc(LOADING_MSG[mod] || 'Loading...')}</span>`);
      const cleanup = [];
      const w = A.win(title, body, Object.assign({ icon }, opts, { onClose: () => cleanup.splice(0).forEach(f => { try { f(); } catch (e) {} }) }));
      w.cleanup = cleanup;
      if (mobile() && !opts.noMax) { w.el.classList.add('maxwin'); window.dispatchEvent(new Event('resize')); }
      w.body.classList.add('ct-body', 'ct-' + mod + '-body');
      Promise.all([A.load('js/carta-art.js'), A.load('js/carta-' + mod + '.js')]).then(() => {
        if (w.closed) return;
        body.remove();
        if (!mods[mod]) throw new Error('module ' + mod + ' missing');
        mods[mod](w, arg);
      }).catch(err => {
        if (w.closed) return;
        body.innerHTML = `<span>The program could not be loaded from the disc.</span>`;
        Desk.msgbox(title, 'Error reading drive D:.\n\nAbort, Retry, Fail?\n\n(Check your connection and try again.)', 'warn');
        if (window.console) console.warn('[carta]', err);
      });
      return w;
    } });
  }
  // open a program with an argument even if it is already open (Apps.open drops the arg for single apps)
  function openWith(id, mod, arg) {
    if (api[mod] && api[mod].alive && api[mod].alive() && api[mod].take) { api[mod].take(arg); return; }
    A.open(id, arg);
  }

  lazy('carta.encyc', 'encyc', 'JackCarta 99', ICON.carta, { w: 800, h: 560, menubar: true, status: true, minW: 300, minH: 260 }, ['jackcarta', 'jackcarta99', 'carta', 'jcarta99', 'encyclopedia', 'encyclopaedia']);
  lazy('carta.mplayer', 'mplayer', 'JackOS Media Player', ICON.mplayer, { w: 520, h: 470, menubar: true, status: true, minW: 280, minH: 260 }, ['mplayer', 'mplayer2', 'mediaplayer', 'media player', 'movies']);
  lazy('carta.cdplayer', 'cd', 'CD Player', ICON.cdplayer, { w: 380, menubar: true, status: true, noResize: true, noMax: true }, ['cdplayer', 'cd player', 'cdplay', 'audio cd']);
  lazy('carta.typing', 'typing', 'Gubbinz Teaches Typing', ICON.typing, { w: 700, h: 520, menubar: true, status: true, minW: 300, minH: 300 }, ['typing', 'typingtutor', 'typing tutor', 'teachtype', 'gubbinz teaches typing']);
  lazy('carta.stamp', 'stamp', 'Stamp Studio', ICON.stamp, { w: 720, h: 540, menubar: true, status: true, minW: 300, minH: 320 }, ['stampstudio', 'stamp studio', 'stamps', 'stamp']);

  // Start menu
  A.addProgram(['JackCarta 99', 'JackCarta 99'], 'carta.encyc', ICON.carta);
  A.addProgram(['JackCarta 99', 'Quiz Keep'], () => openWith('carta.encyc', 'encyc', 'castle'), ICON.castle);
  A.addProgram(['JackCarta 99', 'Read Me'], () => A.openFile(A.fs.get('C:/Program Files/JackCarta 99/README.TXT')), A.ICON.txt);
  A.addProgram(['Accessories', 'Entertainment', 'CD Player'], 'carta.cdplayer', ICON.cdplayer);
  A.addProgram(['Accessories', 'Entertainment', 'Media Player'], 'carta.mplayer', ICON.mplayer);
  A.addProgram(['Gubbinz Teaches Typing', 'Gubbinz Teaches Typing'], 'carta.typing', ICON.typing);
  A.addProgram(['Gubbinz Teaches Typing', 'Meteor Typer (game)'], () => openWith('carta.typing', 'typing', 'game'), ICON.typing);
  A.addProgram(['Stamp Studio', 'Stamp Studio'], 'carta.stamp', ICON.stamp);
  A.desktopIcon('JackCarta 99', ICON.carta, () => A.open('carta.encyc'), 'ct-dicon-carta');
  A.desktopIcon('Media Player', ICON.mplayer, () => A.open('carta.mplayer'), 'ct-dicon-mplayer');

  // Run commands
  A.cmd(['quizkeep', 'quiz keep', 'quiz', 'quiz castle'], () => openWith('carta.encyc', 'encyc', 'castle'));
  A.cmd(['squigdrop', 'squig drop', 'meteortyper', 'meteor typer'], () => openWith('carta.typing', 'typing', 'game'));
  A.cmd(['insert cd', 'insert disc', 'insert disk d:', 'autorun', 'autorun.exe'], () => openWith('carta.cdplayer', 'cd', 'insert'));
  A.cmd(['clock.avi'], () => openVideo(A.fs.get('C:/JACKOS/clock.avi')));
  A.cmd(['dynamite', 'kaboom'], () => openWith('carta.stamp', 'stamp', 'dynamite'));

  // ================================================================ file types: .avi / .mpg play in the Media Player, .stp opens in Stamp Studio
  const D_VIDEOS = { 'intro.avi': 'jaintro', 'making of.avi': 'makingof' };
  function openVideo(node) {
    if (!node) return;
    if (!node.video) node.video = D_VIDEOS[node.name.toLowerCase()] || 'static';
    openWith('carta.mplayer', 'mplayer', node);
  }
  A.OPENERS.avi = openVideo;
  A.OPENERS.mpg = openVideo;
  A.OPENERS.stp = node => openWith('carta.stamp', 'stamp', node);
  A.OPENERS.cert = node => openWith('carta.typing', 'typing', node);

  // ================================================================ secrets (every one is findable; hints stay vague)
  [
    ['carta.disc2', 'Coaster', 'Some encyclopedias come on more than one disc'],
    ['carta.konami', 'Up, up, down, down...', 'An old code works inside the encyclopedia too'],
    ['carta.squig', 'Cryptozoology', 'Look up a creature the encyclopedia has never heard of'],
    ['carta.dave', 'Self-published', 'Somebody wrote himself into the encyclopedia'],
    ['carta.blank', 'Intentionally left blank', 'Feeling lucky? Keep pressing the dice'],
    ['carta.zzz', 'Zzzzz', 'Read the encyclopedia all the way to the end'],
    ['carta.dinotime', 'Deep time', 'History started a lot earlier than you think'],
    ['carta.bookworm', 'Bookworm', 'Read lots and lots of articles'],
    ['carta.allcats', 'Well rounded', 'Read something from every category'],
    ['carta.castle', 'King of the Keep', 'Climb all the way to the top of the castle'],
    ['carta.dungeon', 'Down the chute', 'Get a few questions wrong in a row'],
    ['carta.jester', 'Poke the jester', 'Annoy the castle staff'],
    ['carta.y2kroll', 'Midnight, 31/12/99', 'Watch the clocks roll over'],
    ['carta.allmedia', 'Multimedia!', 'Watch and listen to every Media clip'],
    ['carta.page', 'Monthly update', 'The encyclopedia has a website too'],
    ['carta.codec', 'Codec installed', 'The cover disc videos DO work, eventually'],
    ['carta.stinger', 'Stay for the credits', 'Some trailers have something after the end'],
    ['carta.blooper', 'Blooper reel', 'Some videos are hiding'],
    ['carta.alarm', 'Wake up!', 'Watch the clock until it is time'],
    ['carta.fullgrot', 'Big screen robot', 'Some dancing deserves the whole screen'],
    ['carta.track0', 'Pregap', 'There is music before the first track'],
    ['carta.datatrack', 'That is not music', 'Play the track that is not a song'],
    ['carta.noautorun', 'Shift happens', 'There is an old trick for stopping AutoRun'],
    ['carta.cert', 'Certified', 'Print something to put on the fridge'],
    ['carta.speedy', 'Speedy fingers', 'Type really, really fast'],
    ['carta.wordboss', 'Meteor typer', 'Get far in the falling words game'],
    ['carta.dynamite', 'Kaboom!', 'Clear the picture the loud way'],
    ['carta.stampall', 'Stamp collector', 'Use every single stamp'],
    ['carta.mixer', 'Wacky mixer', 'Mix up your picture lots of times'],
  ].forEach(([id, name, hint]) => A.defineSecret(id, name, hint));
  const secret = id => A.secret(id.startsWith('carta.') ? id : 'carta.' + id);

  // ================================================================ files on C:
  const add = (dir, node) => A.fs.add(dir, node);
  const dir = (path, date) => { const d = A.fs.dir(path); if (date && !d.date) d.date = date; return d; };
  const PF = 'C:/Program Files';
  // JackCarta 99
  const JC = PF + '/JackCarta 99'; dir(JC, '25/12/98');
  add(JC, { name: 'JCARTA99.EXE', type: 'exe', app: 'carta.encyc', date: '25/12/98', size: '2.3 MB' });
  add(JC, { name: 'QUIZKEEP.EXE', type: 'exe', app: 'carta.encyc', arg: 'castle', date: '25/12/98', size: '880 KB' });
  add(JC, { name: 'README.TXT', type: 'txt', date: '25/12/98', size: '3 KB', text: `JACKCARTA 99
============
The Multimedia Encyclopedia for Curious Minds!
Version 99.0 (2-disc set)

THANK YOU for installing JackCarta 99! Inside you'll find:

  * Over 150 articles about games, computers, space, dinosaurs and more
  * Pixel-perfect illustrations (256 colours!)
  * MEDIA articles with real sound and moving pictures
  * The TIMELINE: from the first computers to the year 1999
  * The QUIZ KEEP: answer questions, climb the castle, become ruler

SYSTEM REQUIREMENTS
  486DX2/66 or faster (Pent-Yum recommended)
  8 MB RAM (16 MB recommended)
  Double-speed CD-ROM drive (quad-speed recommended)
  Sound Bluster or 100% compatible sound card
  SVGA display, 256 colours

TIPS
  * Type in the search box to find any article.
  * Blue underlined words are links. Click them!
  * The dice button takes you to a random article.
  * Press F1 for help. (Help is also on the disc. Disc 2.)

KNOWN ISSUES
  * Disc 2 has a crack in it. That's not a known issue, that's Dave.
  * Some words in the encyclopedia are not real words. Those are the
    ones in the Klingy-on articles. There are no Klingy-on articles. Yet.
` });
  add(JC, { name: 'ARTICLES.DAT', type: 'txt', date: '25/12/98', size: '412 MB', text: `JCDAT\x1a\x00\x01 ¿¿¿¿¿¿ ÿØÿà ¶¶¶¶ ===\n\n[This file is 412 MB of compressed encyclopedia.\n Jotpad tried to open it and had a little lie down.]\n\n\x00\x00\x00 the end of the file says, in plain text: "hello Jack, from the people who made the disc" \x00\x00\n` });
  add(JC, { name: 'UPDATE.TXT', type: 'txt', date: '01/10/99', size: '1 KB', text: `JACKCARTA 99 MONTHLY UPDATE\n===========================\n\nNew articles are available every month from the JackCarta website!\n\nTo download them, open JackNet Explorer and type   jackcarta   into the address bar.\n\nThis month's update: 3 new articles (2.4 MB).\nEstimated download time on a 56K modem: 9 minutes.\nEstimated download time on a 56K modem while Mom is on the phone: never.\n` });
  // Media Player + videos
  const MP = PF + '/JackOS Media Player'; dir(MP, '10/12/98');
  add(MP, { name: 'MPLAYER2.EXE', type: 'exe', app: 'carta.mplayer', date: '10/12/98', size: '1.1 MB' });
  add(MP, { name: 'readme.txt', type: 'txt', date: '10/12/98', size: '2 KB', text: `JACKOS MEDIA PLAYER\n===================\nPlays .AVI and .MPG videos. In a window! With sound!\n\nOPEN A VIDEO: File > Open, or double-click any .avi or .mpg file.\nVIDEOS ON THIS COMPUTER live in My Documents\\My Videos.\nThere's also the famous one in C:\\JACKOS. You know the one.\n\nCODECS INSTALLED:\n  JackOS Video 1 (the good one)\n  Blobbit RLE (bouncy)\n  Indeo-ish 3.2 (blocky)\n\nIf a video is blocky, that's the codec. If it's VERY blocky,\nthat's because it was made in 1999. Enjoy the blocks.\n` });
  const VID = 'C:/My Documents/My Videos'; dir(VID, '01/05/99');
  add(VID, { name: 'Gubbinz Cartoon - Squig Trouble.avi', type: 'avi', video: 'cartoon', date: '15/05/99', size: '6.8 MB' });
  add(VID, { name: 'dancing grot.avi', type: 'avi', video: 'grotdance', date: '22/06/99', size: '2.1 MB' });
  add(VID, { name: 'spinning logo.avi', type: 'avi', video: 'logo3d', date: '03/03/99', size: '3.4 MB' });
  add(VID, { name: 'TRAILER - DIAL TONE.mpg', type: 'mpg', video: 'trailer', date: '19/08/99', size: '9.9 MB' });
  add(VID, { name: 'rocket launch.mpg', type: 'mpg', video: 'rocket', date: '20/07/99', size: '5.2 MB' });
  add(VID, { name: 'DO NOT WATCH (bloopers).avi', type: 'avi', video: 'blooper', date: '30/09/99', size: '4.4 MB', hidden: true, secret: 'carta.blooper' });
  add('C:/JACKOS', { name: 'clock.avi', type: 'avi', video: 'clock', date: '10/12/98', size: '82 KB' });
  add('C:/JACKOS/Help', { name: 'welcome.avi', type: 'avi', video: 'welcome', date: '10/12/98', size: '1.6 MB' });
  add('C:/JACKOS', { name: 'CDPLAYER.EXE', type: 'exe', app: 'carta.cdplayer', date: '10/12/98', size: '106 KB' });
  // Typing tutor + Stamp Studio
  const TT = PF + '/Gubbinz Teaches Typing'; dir(TT, '06/02/99');
  add(TT, { name: 'TYPING.EXE', type: 'exe', app: 'carta.typing', date: '06/02/99', size: '1.7 MB' });
  add(TT, { name: 'SQUIGDRP.EXE', type: 'exe', app: 'carta.typing', arg: 'game', date: '06/02/99', size: '420 KB' });
  add(TT, { name: 'readme.txt', type: 'txt', date: '06/02/99', size: '2 KB', text: `GUBBINZ TEACHES TYPING\n======================\n"It looks like you're typing! Fingers on the HOME ROW!"\n\nLearn to type with all ten fingers, taught by a little green\nhelper who has eight fingers and uses two.\n\nLESSONS: home row, top row, bottom row, numbers, words, sentences.\nGAME: Meteor Typer. Meteors fall. You type them. They explode.\nCERTIFICATES: pass a lesson and print one for the fridge.\n\nPrinter tip: if the certificate comes out pink, you're out of cyan.\nYou are always out of cyan.\n` });
  const SS = PF + '/Stamp Studio'; dir(SS, '25/12/98');
  add(SS, { name: 'STAMPS.EXE', type: 'exe', app: 'carta.stamp', date: '25/12/98', size: '1.3 MB' });
  add(SS, { name: 'readme.txt', type: 'txt', date: '25/12/98', size: '1 KB', text: `STAMP STUDIO\n============\nThe drawing program that makes NOISES.\n\nEvery tool has a sound. The stamps go THUNK. The pencil goes\nscritch. The dynamite goes... well. You'll see.\n\nMom says: "headphones, please".\n` });
  add('C:/My Documents/My Pictures', { name: 'stamp picture.stp', type: 'stp', stamp: 'demo', date: '27/12/98', size: '12 KB' });

  // ================================================================ hidden web page: jacklm.com/jackcarta
  if (window.IE && IE.addPage) IE.addPage('jackcarta', 'JackCarta Online', () => {
    setTimeout(() => secret('page'), 400);
    return `<div class="ct-web"><div class="ct-web-hd"><span class="ct-web-logo">JackCarta<b>99</b></span><span>ONLINE</span></div>
      <p class="ct-web-blink">&#9733; MONTHLY UPDATE: OCTOBER 1999 &#9733;</p>
      <p>Welcome to the official JackCarta 99 update site! Every month we add brand new articles to your encyclopedia, over the Internet.</p>
      <div class="ct-web-box"><b>This month's new articles:</b><ul><li>The Total Eclipse of 11 August 1999 (Cornwall saw it! It was cloudy.)</li><li>The Euro (a new money, launched 1 January 1999, for banks only so far)</li><li>The Mars Climate Orbiter (lost in September 1999 after a mix-up between metric and imperial units. Oops.)</li></ul>
      <p>Download size: <b>2.4 MB</b>. Estimated time on a 56K modem: <b>9 minutes</b>.</p><button class="btn ct-web-dl" type="button">Download Update</button><div class="prog ct-web-prog" style="margin-top:6px"><span style="display:flex;gap:2px"></span></div></div>
      <p class="small">JackCarta 99 is best viewed at 800x600 in 256 colours. You are visitor number 000412.</p></div>`;
  });
  document.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('.ct-web-dl'); if (!b || b.disabled) return;
    b.disabled = true; const bar = b.parentNode.querySelector('.ct-web-prog span'); let n = 0;
    const iv = setInterval(() => { n++; bar.innerHTML = '<i></i>'.repeat(Math.min(n, 3)); if (n >= 3) { clearInterval(iv); Desk.msgbox('JackCarta Update', 'Download interrupted.\n\nSomebody picked up the phone.\n\n(It was Mom. She wants to know why the phone goes "BEEEE-KSSSHHH".)', 'warn'); b.disabled = false; } }, 900);
  });

  window.Carta = { h, esc, store, ICON, mods, api, secret, mobile, openWith, openVideo, ICO16,
    sfxHint(name) { if (!Sound.on) Desk.toast(name || 'Sound is off', 'Sound is switched off. Click the speaker in the corner of the taskbar to hear it.', 4000); },
  };
})();

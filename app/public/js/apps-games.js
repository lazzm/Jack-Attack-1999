/* apps-games: the JackOS 98 Games pack. Start > Programs > Games gets a pile of original single-player games.
 * This always-loaded file only holds the registry, icons, secrets, files and a small shared game-window kit
 * (window.JGames). Each game lives in a lazily loaded js/games-*.js file that is fetched the first time it opens.
 * Everything is drawn live on canvas or with CSS. No images, no libraries, no network (apart from JackNet scores). */
(function () {
  'use strict';
  if (!window.Apps) return;
  const esc = Apps.esc, store = Apps.store;
  const JG = window.JGames = { mods: {}, games: {}, live: {} };
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };
  const secret = id => { try { return Apps.secret(id); } catch (e) { return false; } };
  JG.sfx = sfx; JG.secret = secret;
  JG.note = (f, d, t) => { try { if (window.Sound) Sound.note(f, d, t); } catch (e) {} };
  JG.fmt = n => Math.round(n).toLocaleString('en-GB');
  JG.rng = seed => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  JG.shuffle = (a, r) => { r = r || Math.random; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const styled = {};
  JG.css = (id, text) => { if (styled[id]) return; styled[id] = 1; const s = document.createElement('style'); s.textContent = text; document.head.appendChild(s); };
  // pixel art: rows of characters + a palette { ch: colour } -> an offscreen canvas (cached)
  const spriteCache = new Map();
  JG.sprite = (rows, pal, scale) => {
    scale = scale || 1;
    const key = rows.join('/') + JSON.stringify(pal) + scale;
    let cv = spriteCache.get(key); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = rows[0].length * scale; cv.height = rows.length * scale;
    const c = cv.getContext('2d');
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = pal[r[x]]; if (col) { c.fillStyle = col; c.fillRect(x * scale, y * scale, scale, scale); } } });
    spriteCache.set(key, cv); return cv;
  };

  // ================================================================ icons (32x32, used at 16 too)
  const I = {
    pinball: '<svg viewBox="0 0 32 32"><path d="M9 2.5h14l6.5 27h-27z" fill="#14146a" stroke="#000"/><path d="M11 4.5h10l5 21H6z" fill="#2a2aa0"/><circle cx="16" cy="10" r="3.2" fill="#e10600" stroke="#000"/><circle cx="10.5" cy="15" r="2.2" fill="#ffd400" stroke="#000"/><circle cx="21.5" cy="15" r="2.2" fill="#ffd400" stroke="#000"/><path d="M8.5 25.5l5 1.8M23.5 25.5l-5 1.8" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="19" cy="20.5" r="2" fill="#eee" stroke="#444"/><path d="M14 6l1-2 1 2 1-2 1 2" stroke="#5aac2c" fill="none"/></svg>',
    ski: '<svg viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" fill="#fff" stroke="#9cf"/><path d="M5 9l4-7 4 7zM4 13l5-8 5 8z" fill="#1d7a2a" stroke="#0b4a14"/><rect x="8" y="13" width="2" height="3" fill="#7a4a1a"/><path d="M14 27l12-6M15 29l12-6" stroke="#e10600" stroke-width="1.5"/><rect x="18" y="13" width="6" height="8" fill="#3a9a2a" stroke="#000"/><path d="M18 15l-3-2v3zM24 15l3-2v3z" fill="#3a9a2a" stroke="#000"/><rect x="19.5" y="15" width="1" height="1" fill="#e10600"/><rect x="22" y="15" width="1" height="1" fill="#e10600"/><path d="M17 12h8" stroke="#2349b8" stroke-width="2"/><path d="M18 21l-1 4M24 21l1 3" stroke="#000"/></svg>',
    hearts: '<svg viewBox="0 0 32 32"><g transform="rotate(-14 11 20)"><rect x="3.5" y="8.5" width="14" height="20" rx="2" fill="#fff" stroke="#000"/><path d="M6 12h2M7 11v2" stroke="#000"/></g><rect x="13.5" y="5.5" width="15" height="21" rx="2" fill="#fff" stroke="#000"/><path d="M21 22c-1.2-1.8-6-4-6-7.5 0-2.4 3-3.5 6-.6 3-2.9 6-1.8 6 .6 0 3.5-4.8 5.7-6 7.5z" fill="#d00000" stroke="#600" stroke-width=".5"/><path d="M15.5 8l1.5 3.5L18.5 8" stroke="#d00000" fill="none"/></svg>',
    spider: '<svg viewBox="0 0 32 32"><rect x="2.5" y="2.5" width="13" height="18" rx="2" fill="#fff" stroke="#000"/><rect x="8.5" y="7.5" width="13" height="18" rx="2" fill="#fff" stroke="#000"/><rect x="14.5" y="11.5" width="15" height="19" rx="2" fill="#2349b8" stroke="#000"/><ellipse cx="22" cy="21" rx="3" ry="3.6" fill="#000"/><circle cx="22" cy="16.6" r="2" fill="#000"/><path d="M19 18l-3.5-2M19 21h-4M19 23.5l-3.5 2.5M25 18l3.5-2M25 21h4M25 23.5l3.5 2.5" stroke="#000" stroke-width="1.2"/><circle cx="21.3" cy="16.2" r=".6" fill="#e10600"/><circle cx="22.7" cy="16.2" r=".6" fill="#e10600"/></svg>',
    pipe: '<svg viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" fill="#9a9a9a" stroke="#000"/><path d="M1.5 11h20v20M11 1.5v9" fill="none" stroke="#444" stroke-width="7"/><path d="M1.5 11h20v20M11 1.5v9" fill="none" stroke="#c8c8c8" stroke-width="5"/><path d="M1.5 11h14" stroke="#5aff2a" stroke-width="3"/><path d="M11 1.5v9" stroke="#5aff2a" stroke-width="3"/><circle cx="21.5" cy="11" r="3" fill="#ffd400" stroke="#000"/></svg>',
    mahjong: '<svg viewBox="0 0 32 32"><rect x="9.5" y="2.5" width="16" height="21" rx="1.5" fill="#d9c79a" stroke="#000"/><rect x="7.5" y="4.5" width="16" height="21" rx="1.5" fill="#f6efd8" stroke="#000"/><rect x="4.5" y="8.5" width="16" height="21" rx="1.5" fill="#d9c79a" stroke="#000"/><rect x="2.5" y="10.5" width="16" height="21" rx="1.5" fill="#fffbea" stroke="#000"/><rect x="6" y="15" width="9" height="9" fill="#3a9a2a" stroke="#000"/><path d="M6 17l-2-1.5v3zM15 17l2-1.5v3z" fill="#3a9a2a" stroke="#000" stroke-width=".7"/><rect x="7.5" y="17.5" width="1.5" height="1.5" fill="#e10600"/><rect x="12" y="17.5" width="1.5" height="1.5" fill="#e10600"/><path d="M8 22h5" stroke="#fff"/></svg>',
    slide: '<svg viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" fill="#808080" stroke="#000"/><g fill="#c0c0c0" stroke="#000"><rect x="3" y="3" width="8" height="8"/><rect x="12" y="3" width="8" height="8"/><rect x="21" y="3" width="8" height="8"/><rect x="3" y="12" width="8" height="8"/><rect x="12" y="12" width="8" height="8"/><rect x="21" y="12" width="8" height="8"/><rect x="3" y="21" width="8" height="8"/><rect x="12" y="21" width="8" height="8"/></g><g font-family="Arial" font-weight="bold" font-size="6" fill="#000080" text-anchor="middle"><text x="7" y="9.5">1</text><text x="16" y="9.5">2</text><text x="25" y="9.5">3</text><text x="7" y="18.5">4</text><text x="16" y="18.5">5</text><text x="25" y="18.5">6</text><text x="7" y="27.5">7</text><text x="16" y="27.5">8</text></g></svg>',
    jigsaw: '<svg viewBox="0 0 32 32"><path d="M3 3h10a3 3 0 1 1 6 0h10v10a3 3 0 1 0 0 6v10H19a3 3 0 1 0-6 0H3V19a3 3 0 1 1 0-6z" fill="#7ec8ff" stroke="#000"/><path d="M3 16h26M16 3v26" stroke="#000" stroke-dasharray="2 1"/><circle cx="23" cy="9" r="3" fill="#ffd400"/><path d="M4 28l7-8 5 5 4-4 8 7z" fill="#2a9a2a"/></svg>',
    podracer: '<svg viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" fill="#e8b860" stroke="#a07020"/><path d="M1 22c8-3 22-3 30 0v9H1z" fill="#c8903a"/><path d="M3 9h11l3 2-3 2H3z" fill="#c0c0c0" stroke="#000"/><path d="M3 17h11l3 2-3 2H3z" fill="#c0c0c0" stroke="#000"/><path d="M5 9v-2h4v2M5 21v2h4v-2" stroke="#000" fill="#e10600"/><path d="M15 12l6 2M15 18l6-2" stroke="#4af" stroke-width=".8"/><path d="M21 13h7l2 2-2 2h-7z" fill="#5aac2c" stroke="#000"/><rect x="24" y="14" width="1.2" height="1.2" fill="#e10600"/><path d="M1 11h2M1 19h2" stroke="#ff8a00" stroke-width="2"/></svg>',
    reversi: '<svg viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" fill="#0a7a2a" stroke="#000"/><path d="M11 1.5v29M21 1.5v29M1.5 11h29M1.5 21h29" stroke="#043"/><circle cx="16" cy="16" r="4" fill="#000" stroke="#555"/><circle cx="6" cy="6" r="4" fill="#fff" stroke="#000"/><circle cx="26" cy="16" r="4" fill="#fff" stroke="#000"/><circle cx="16" cy="26" r="4" fill="#000" stroke="#555"/><circle cx="26" cy="26" r="4" fill="#fff" stroke="#000"/></svg>',
    chess: '<svg viewBox="0 0 32 32"><path d="M2 30h28v-3H2z" fill="#808080" stroke="#000"/><path d="M8 27c0-5 3-6 3-10-3 0-4-3-3-5l3-3h-1l1-3h3l1 3c4 1 6 6 5 11l-1 7z" fill="#fff" stroke="#000"/><circle cx="12" cy="11" r=".8"/><path d="M19 27c0-3 2-5 2-8h-1l1-2h-1v-2h2v-1h2v1h2v2h-1l1 2h-1c0 3 2 5 2 8z" fill="#222" stroke="#000"/><path d="M22 12h2M23 11v2" stroke="#000"/></svg>',
    cube: '<svg viewBox="0 0 32 32"><g stroke="#000" stroke-width=".8"><rect x="11" y="1.5" width="10" height="10" fill="#fff"/><rect x="1" y="11.5" width="10" height="10" fill="#e10600"/><rect x="11" y="11.5" width="10" height="10" fill="#1aa31a"/><rect x="21" y="11.5" width="10" height="10" fill="#ff8a00"/><rect x="11" y="21.5" width="10" height="10" fill="#ffd400"/></g><path d="M14.3 1.5v10M17.6 1.5v10M11 4.8h10M11 8.1h10M4.3 11.5v10M7.6 11.5v10M1 14.8h10M1 18.1h10M14.3 11.5v10M17.6 11.5v10M11 14.8h10M11 18.1h10M24.3 11.5v10M27.6 11.5v10M21 14.8h10M21 18.1h10M14.3 21.5v10M17.6 21.5v10M11 24.8h10M11 28.1h10" stroke="#000" stroke-width=".5"/><rect x="21" y="1.5" width="10" height="8" fill="#2349b8" stroke="#000" stroke-width=".8"/></svg>',
    grotlings: '<svg viewBox="0 0 32 32"><rect x="1" y="22" width="30" height="9" fill="#8a5a2a" stroke="#000"/><path d="M1 22h30" stroke="#5aac2c" stroke-width="2"/><g stroke="#000" stroke-width=".7"><rect x="5" y="12" width="6" height="7" fill="#5aac2c"/><path d="M5 14l-3-2v4zM11 14l3-2v4z" fill="#5aac2c"/><rect x="5" y="19" width="6" height="3" fill="#2349b8"/><rect x="19" y="10" width="6" height="7" fill="#5aac2c"/><path d="M19 12l-3-2v4zM25 12l3-2v4z" fill="#5aac2c"/><rect x="19" y="17" width="6" height="5" fill="#2349b8"/></g><rect x="6.5" y="14" width="1" height="1" fill="#e10600"/><rect x="9" y="14" width="1" height="1" fill="#e10600"/><rect x="20.5" y="12" width="1" height="1" fill="#e10600"/><rect x="23" y="12" width="1" height="1" fill="#e10600"/><path d="M17 8h10M17 6h10" stroke="#ffd400" stroke-width="1.5"/></svg>',
    folder: '<svg viewBox="0 0 32 32"><path d="M2 7h11l3 3h14v18H2z" fill="#f2d16b" stroke="#7a5a00"/><path d="M2 12h28" stroke="#7a5a00"/><rect x="11" y="15" width="10" height="8" rx="2" fill="#555" stroke="#000"/><circle cx="14" cy="19" r="1.2" fill="#e10600"/><circle cx="18.5" cy="18" r="1" fill="#2349b8"/><circle cx="19.5" cy="20" r="1" fill="#ffd400"/></svg>',
    sol: '<svg viewBox="0 0 32 32"><rect x="2.5" y="3.5" width="16" height="22" rx="2" fill="#fff" stroke="#000"/><rect x="4.5" y="5.5" width="12" height="18" fill="#2349b8"/><g transform="rotate(14 21 18)"><rect x="12.5" y="7.5" width="16" height="22" rx="2" fill="#fff" stroke="#000"/><path d="M20.5 22c-1-1.5-5-3.5-5-6.5 0-2 2.5-3 5-0.5 2.5-2.5 5-1.5 5 0.5 0 3-4 5-5 6.5z" fill="#d00000"/></g></svg>',
    fc: '<svg viewBox="0 0 32 32"><g transform="rotate(-12 10 20)"><rect x="3.5" y="9.5" width="14" height="19" rx="2" fill="#fff" stroke="#000"/></g><g transform="rotate(10 22 20)"><rect x="14.5" y="9.5" width="14" height="19" rx="2" fill="#fff" stroke="#000"/><path d="M21.5 15l3 4-3 4-3-4z" fill="#d00000"/></g><path d="M9 9l2-6 3 4 2-5 2 5 3-4 2 6z" fill="#f2b600" stroke="#000"/></svg>',
  };
  // the official JackOS 98 icons (icons.js) where they're the specific match
  if (window.JICON) Object.assign(I, { pinball: JICON.icon('pinball'), reversi: JICON.icon('reversi'), chess: JICON.icon('chess'), cube: JICON.icon('cube'), folder: JICON.icon('games'), sol: JICON.icon('cards'), fc: JICON.icon('freecell'), hearts: JICON.icon('hearts'), spider: JICON.icon('spider'), jigsaw: JICON.icon('jigsaw'), pipe: JICON.icon('pipe'), mahjong: JICON.icon('mahjong'), slide: JICON.icon('slider'), ski: JICON.icon('ski'), podracer: JICON.icon('podracer'), grotlings: JICON.icon('grotlings') });
  JG.ICON = I;

  // ================================================================ the game list
  const GAMES = [
    { id: 'pinball', name: 'Space Jack Pinball', exe: 'PINBALL.EXE', size: '700 KB', file: 'pinball', w: 640, h: 560, status: false, cmd: ['pinball', 'spacejack', 'space jack pinball', 'spacegrot', 'space grot pinball', 'pinball.exe'], date: '19/06/99' },
    { id: 'ski', name: 'SkiJack', exe: 'SKIJACK.EXE', size: '118 KB', file: 'ski', w: 600, h: 480, cmd: ['skijack', 'ski', 'skijack.exe', 'skigrot', 'skigrot.exe'], date: '02/02/99' },
    { id: 'podracer', name: 'Pod Jack Racer', exe: 'PODJACK.EXE', size: '486 KB', file: 'podracer', w: 640, h: 500, cmd: ['podracer', 'podjack', 'pod jack racer', 'podgrot', 'pod grot racer', 'podrace'], date: '17/07/99' },
    { id: 'hearts', name: 'Hearts', exe: 'MSHEARTS.EXE', size: '128 KB', file: 'cards', w: 640, h: 520, cmd: ['hearts', 'mshearts'], date: '10/12/98' },
    { id: 'spider', name: 'Spider Solitaire', exe: 'SPIDER.EXE', size: '144 KB', file: 'cards', w: 700, h: 540, cmd: ['spider', 'spider solitaire', 'spider.exe'], date: '14/09/99' },
    { id: 'pipe', name: 'Pipe Jack', exe: 'PIPEJACK.EXE', size: '96 KB', file: 'pipe', w: 600, h: 520, cmd: ['pipejack', 'pipe jack', 'pipegrot', 'pipe grot', 'squigjuice'], date: '21/05/99' },
    { id: 'mahjong', name: 'Jack Jong', exe: 'JACKJONG.EXE', size: '210 KB', file: 'mahjong', w: 680, h: 540, cmd: ['mahjong', 'jackjong', 'grotjong', 'shanghai', 'taipei'], date: '08/08/99' },
    { id: 'slide', name: 'Slider 15', exe: 'SLIDER15.EXE', size: '41 KB', file: 'puzzle', w: 420, h: 500, cmd: ['slider', 'slider15', '15puzzle', 'fifteen', 'puzzle'], date: '30/03/99' },
    { id: 'jigsaw', name: 'Jigsaw 98', exe: 'JIGSAW98.EXE', size: '77 KB', file: 'puzzle', w: 640, h: 520, cmd: ['jigsaw', 'jigsaw98'], date: '30/03/99' },
    { id: 'reversi', name: 'Reversi', exe: 'REVERSI.EXE', size: '38 KB', file: 'reversi', w: 440, h: 520, cmd: ['reversi', 'othello'], date: '10/12/98' },
    { id: 'chess', name: 'Jack Chess', exe: 'JACKCHES.EXE', size: '256 KB', file: 'chess', w: 620, h: 520, cmd: ['chess', 'jackchess', 'deep jack', 'grotchess', 'deep grot'], date: '11/05/99' },
    { id: 'cube', name: 'Cube Net Trainer', exe: 'CUBENET.EXE', size: '64 KB', file: 'cube', w: 600, h: 560, cmd: ['cubenet', 'cubetrainer', 'cube trainer', 'rubiknet'], date: '27/04/99' },
    { id: 'grotlings', name: 'Jacklings', exe: 'JACKLING.EXE', size: '333 KB', file: 'grotlings', w: 660, h: 500, cmd: ['jacklings', 'jackling', 'lemmings', 'grotlings', 'grotling'], date: '31/10/99' },
  ];
  GAMES.forEach(g => { g.icon = I[g.id]; JG.games[g.id] = g; });

  // ================================================================ secrets (registered at startup, found inside the games)
  [['games.pb.million', 'Millionaire', 'Score a million in the space pinball game'],
    ['games.pb.multi', 'Three balls, no waiting', 'Light every lane in the pinball rocket and something multiplies'],
    ['games.pb.warp', 'Hyperspace cadet', 'Finish the pinball missions until space folds in half'],
    ['games.pb.tilt', 'Table thumper', 'Shove the pinball table a bit too hard'],
    ['games.pb.cheat', 'Cheat code typist', 'The space pinball table responds to a word typed at the right moment'],
    ['games.pb.konami', 'Up up down down', 'An old arcade code works on the pinball table'],
    ['games.ski.eaten', 'Monster snack', 'Ski too far down the mountain'],
    ['games.ski.turbo', 'Turbo button', 'Some skis have a faster setting'],
    ['games.ski.combo', 'Big air', 'Pull off four tricks in one jump'],
    ['games.ski.escape', 'The one that got away', 'Outrun the snow monster for a whole kilometre'],
    ['games.pod.win', 'Pod pilot of the year', 'Win the big peapod race in first place'],
    ['games.pod.boost', 'Now this is pod racing', 'Hold the boost until the engines glow white hot'],
    ['games.pod.wreck', 'Bits everywhere', 'Smash your pod to pieces on a rock'],
    ['games.pb.pod', 'Pod lap record', 'Finish the peapod race mission on the pinball table'],
    ['games.hearts.moon', 'Shot the moon', 'Take every point in a hand of Hearts. Every single one.'],
    ['games.hearts.win', 'Lowest score wins', Cast.t('Beat Dave, Cousin {cousin} and Gubbinz')],
    ['games.hearts.dave', 'Dave gets the lady', 'Give a certain lady to a certain boy'],
    ['games.spider.win', 'Spun a web', 'Clear the Spider Solitaire table'],
    ['games.spider.four', 'Arachnophobia', 'Win Spider with all four suits'],
    ['games.pipe.cross', 'Double crossed', 'Send the green slime through the same cross twice'],
    ['games.pipe.level', 'Plumber of the year', 'Reach level 6 of the green slime game'],
    ['games.mj.clear', 'Tile of the century', 'Clear every tile from the Jack Jong dragon'],
    ['games.mj.gubbinz', 'Odd one out', 'Find the tile that should not be in the set'],
    ['games.slide.solve', 'Fifteen in order', 'Put the sliding numbers back where they belong'],
    ['games.slide.loyd', 'The impossible puzzle', "Dave's puzzle can't be done. Or can it?"],
    ['games.jig.done', 'Last piece', 'Finish a jigsaw (the vacuum did not get the last piece)'],
    ['games.rev.win', 'Disc jockey', 'Beat the computer at Reversi on the hardest setting'],
    ['games.rev.wipe', 'Whitewash', 'Win at Reversi so hard there are no enemy discs left'],
    ['games.chess.mate', 'Checkmate, Deep Jack', 'Beat the chess computer'],
    ['games.chess.knight', 'Horse power', 'Promote a pawn to something that is not a queen'],
    ['games.chess.castle', 'King in the castle', 'Do the move where the king and rook swap sides'],
    ['games.cube.solve', 'Cuber', 'Solve the flat cube after a proper scramble'],
    ['games.cube.checker', 'Chequered past', 'Make a draughts board on every face of the cube'],
    ['games.grot.done', 'Jackling shepherd', 'Get the Jacklings home on every level'],
    ['games.grot.nuke', 'Oh no!', 'Press the button Jacklings fear the most'],
    ['games.folder', 'Games master', 'Open the games folder on the desktop and try six different games'],
    ['games.iddqd', 'Not that game', 'Type a famous god-mode cheat into the Run box'],
  ].forEach(s => Apps.defineSecret(...s));

  // which games have been played (for the games-master secret)
  function played(id) {
    const p = store.get('jhp_games_played', {});
    if (!p[id]) { p[id] = Date.now(); store.set('jhp_games_played', p); }
    if (Object.keys(p).length >= 6) secret('games.folder');
  }

  // ================================================================ shared dialogs
  function dialog(title, html, buttons, o) {
    o = o || {};
    const f = document.createElement('form'); f.className = 'jgdlg';
    f.innerHTML = html + '<div class="row jgdbtns"></div>';
    const w = Apps.win(title, f, Object.assign({ w: 330, noResize: true, noMax: true, noMin: true, escClose: true }, o));
    const row = f.querySelector('.jgdbtns');
    (buttons || [['OK']]).forEach(([label, fn], i) => {
      const b = document.createElement('button'); b.className = 'btn'; b.type = i === 0 ? 'submit' : 'button'; b.textContent = label;
      b.addEventListener('click', ev => { ev.preventDefault(); if (fn && fn(f, w) === false) return; w.close(); });
      row.appendChild(b);
      if (i === 0 && !o.noFocus) setTimeout(() => { try { b.focus(); } catch (e) {} }, 40);
    });
    f.addEventListener('submit', ev => ev.preventDefault());
    return { w, f };
  }
  JG.dialog = dialog;
  JG.msg = (title, text, icon, buttons) => Desk.msgbox(title, text, icon || 'info', buttons);

  // About box: big icon, name, version, licence line and a scrolling credits list
  function about(g, o) {
    const credits = (o.credits || []).map(([role, who]) => `<div class="jgcr"><span>${esc(role)}</span><b>${esc(who)}</b></div>`).join('');
    const html = `<div class="jgabout"><div class="jgaico">${g.icon}</div><div class="jgatxt"><b class="jganame">${esc(o.title || g.name)}</b><div>${esc(o.ver || 'Version 1.0')}</div><div>${esc(o.copy || 'Copyright \u00a9 1999 Jack Attack Software')}</div></div></div>
      ${o.blurb ? `<p class="jgablurb">${esc(o.blurb)}</p>` : ''}<div class="jgcredits field"><div class="jgcrin">${credits}</div></div>
      <div class="jgalic">This product is licensed to:<br><b>${esc((window.Net && Net.me && Net.me.nick) || 'Jack')}</b><br>JACK ATTACK! Online</div><hr class="jghr"><div class="jgamem">Physical memory available to JackOS: 32,768 KB<br>System resources: ${60 + (Date.now() / 86400000 | 0) % 30}% free</div>`;
    const d = dialog('About ' + g.name, html, [['OK']], { w: 360 });
    const inner = d.f.querySelector('.jgcrin');
    if (inner && (o.credits || []).length > 5) inner.classList.add('roll');
    return d;
  }
  // Help: a little WinHelp-style topic window
  function help(g, topics) {
    const b = document.createElement('div'); b.className = 'jghelp';
    b.innerHTML = `<div class="jghtabs"></div><div class="field jghbody"></div>`;
    const tabs = b.querySelector('.jghtabs'), body = b.querySelector('.jghbody');
    const show = i => { tabs.querySelectorAll('button').forEach((x, k) => x.classList.toggle('on', k === i)); body.innerHTML = `<h3>${esc(topics[i][0])}</h3>` + topics[i][1].split('\n\n').map(p => /^[-*] /.test(p) ? '<ul>' + p.split('\n').map(l => `<li>${esc(l.replace(/^[-*] /, ''))}</li>`).join('') + '</ul>' : `<p>${esc(p)}</p>`).join(''); body.scrollTop = 0; };
    topics.forEach(([t], i) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn'; x.textContent = t; x.addEventListener('click', () => show(i)); tabs.appendChild(x); });
    show(0);
    return Apps.win(g.name + ' Help', b, { w: 430, h: 400, icon: '<svg viewBox="0 0 32 32"><rect x="5" y="3" width="22" height="26" fill="#ffd400" stroke="#000"/><path d="M5 3l4 4v22" fill="#c9a300" stroke="#000"/><text x="17" y="23" font-family="Times New Roman" font-weight="bold" font-size="17" text-anchor="middle" fill="#000080">?</text></svg>', minW: 280, minH: 220 });
  }

  // ================================================================ high scores (this PC + worldwide over JackNet)
  // local: jhp_games_hs_<id> = [{n, s, d}] (best 10). worldwide: Net.kv map 'games.hs.<id>' with one field per visitor
  // ('p' + part of their client id) = "score|name". Anyone can write, so everything read back is validated.
  const cleanName = s => String(s || '').replace(/[^A-Za-z0-9 _.!'-]/g, '').trim().slice(0, 16);
  const myName = () => cleanName(store.get('jhp_games_name', '') || (window.Net && Net.me && Net.me.nick) || 'Player') || 'Player';
  function Scores(id, o) {
    o = Object.assign({ lower: false, fmt: v => JG.fmt(v), max: 1e9, label: 'Score', world: true, title: 'High Scores' }, o || {});
    const key = 'jhp_games_hs_' + id, wkey = 'games.hs.' + id;
    const better = (a, b) => o.lower ? a < b : a > b;
    const S = {
      o,
      list: () => (store.get(key, null) || (o.seed || []).map(([n, v]) => ({ n, s: v, d: '01/01/99' }))).filter(e => e && typeof e.s === 'number').slice(0, 10),
      best: () => { const l = S.list(); return l.length ? l[0].s : null; },
      qualifies: s => { const l = S.list(); return s > 0 && (l.length < 10 || better(s, l[l.length - 1].s)); },
      add(name, s) {
        const l = S.list(); const e = { n: cleanName(name) || 'Player', s, d: (() => { try { const t = Desk.today99(); return String(t.d).padStart(2, '0') + '/' + String(t.m).padStart(2, '0') + '/99'; } catch (e) { return ''; } })() };
        l.push(e); l.sort((a, b) => o.lower ? a.s - b.s : b.s - a.s); store.set(key, l.slice(0, 10));
        return S.list().indexOf(S.list().find(x => x.s === e.s && x.n === e.n));
      },
      world() {
        if (!o.world || !window.Net || !Net.kv) return Promise.resolve([]);
        return Net.kv.get([wkey]).then(vals => {
          const m = vals && vals[wkey], out = [];
          if (m && typeof m === 'object' && !Array.isArray(m)) for (const f of Object.keys(m).slice(0, 4096)) {
            const v = m[f]; if (typeof v !== 'string') continue;
            const r = /^(\d{1,10})\|(.{1,16})$/.exec(v); if (!r) continue;
            const s = +r[1]; if (!(s > 0 && s <= o.max)) continue;
            out.push({ n: cleanName(r[2]) || 'Anonymous', s, me: window.Net && f === 'p' + String(Net.cid || '').slice(0, 15) });
          }
          out.sort((a, b) => o.lower ? a.s - b.s : b.s - a.s);
          return out.slice(0, 10);
        });
      },
      sendWorld(name, s) {
        if (!o.world || !window.Net || !Net.kv || !(s > 0 && s <= o.max)) return;
        const mine = store.get(key + '_w', null);
        if (mine != null && !better(s, mine)) return;
        store.set(key + '_w', s);
        Net.kv.put(wkey, 'p' + String(Net.cid || 'anon').slice(0, 15), Math.round(s) + '|' + (cleanName(name) || 'Player'));
      },
      // call at game over: asks for a name if it's a top-10 score, then shows the table
      submit(s, after) {
        s = Math.round(s);
        if (!S.qualifies(s)) { S.sendWorld(myName(), s); if (after) after(false); return false; }
        const d = dialog(o.title, `<p style="margin:0 0 8px">${esc(o.newText || 'Congratulations! You have one of the ten best scores on this computer.')}</p><div class="row" style="margin-bottom:4px"><b>${esc(o.label)}:</b>&nbsp;${esc(o.fmt(s))}</div><div class="row" style="flex-wrap:nowrap"><label for="jgname">Please type your name:</label></div><input type="text" id="jgname" class="jgname" maxlength="16" autocomplete="off">`,
          [['OK', f => { const n = cleanName(f.querySelector('input').value) || myName(); store.set('jhp_games_name', n); const i = S.add(n, s); S.sendWorld(n, s); setTimeout(() => S.show(i), 60); if (after) after(true); }]], { w: 320, noFocus: true });
        const inp = d.f.querySelector('input'); inp.value = myName();
        setTimeout(() => { try { inp.focus(); inp.select(); } catch (e) {} }, 50);
        sfx('solve');
        return true;
      },
      show(hi) {
        const row = (e, i, mark) => `<tr class="${mark ? 'hl' : ''}"><td>${i + 1}.</td><td>${esc(e.n)}</td><td class="r">${esc(o.fmt(e.s))}</td><td class="d">${esc(e.d || '')}</td></tr>`;
        const local = S.list();
        const html = `<div class="tabs jgtabs"><span class="on" data-t="0">This Computer</span>${o.world ? '<span data-t="1">Worldwide (JackNet)</span>' : ''}</div><div class="jgtabpage"><table class="jghs"><tbody class="jghs0">${local.length ? local.map((e, i) => row(e, i, i === hi)).join('') : `<tr><td colspan="4" class="jgempty">No scores yet. Go on, have a go!</td></tr>`}</tbody><tbody class="jghs1" hidden><tr><td colspan="4" class="jgempty">Dialling JackNet...</td></tr></tbody></table></div>`;
        const d = dialog(o.title, html, [['OK'], ['Reset Scores', f => { JG.msg(o.title, 'Clear the high scores on this computer? (The worldwide list is safe.)', 'q', [['Yes', () => { store.set(key, []); Desk.toast(o.title, 'High scores cleared. A fresh start!'); }], ['No']]); return true; }]], { w: 360 });
        const tabs = d.f.querySelectorAll('.jgtabs span'), b0 = d.f.querySelector('.jghs0'), b1 = d.f.querySelector('.jghs1');
        let fetched = false;
        tabs.forEach(t => t.addEventListener('click', () => {
          tabs.forEach(x => x.classList.toggle('on', x === t)); const w1 = t.dataset.t === '1'; b0.hidden = w1; b1.hidden = !w1;
          if (w1 && !fetched) { fetched = true; S.world().then(l => { b1.innerHTML = l.length ? l.map((e, i) => row(e, i, e.me)).join('') : `<tr><td colspan="4" class="jgempty">${window.Net && Net.connected ? 'Nobody on JackNet has a score yet. Be the first!' : 'Could not connect to JackNet. Check your modem cable.'}</td></tr>`; }); }
        }));
        return d;
      },
    };
    return S;
  }
  JG.Scores = Scores;

  // ================================================================ the game window kit
  // JG.mod('pinball', (G, arg) => {...}) is called by each lazily loaded games-*.js; G is a small helper bound to one window.
  JG.mod = (id, fn) => { JG.mods[id] = fn; };
  const tops = () => [...document.querySelectorAll('.appwin')].filter(e => e.style.display !== 'none').sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0));
  function makeG(g, w, host) {
    const cleanups = [], timers = new Set();
    let engaged = true, wasActive = true, rafId = 0, loopFn = null, last = 0;
    const G = {
      g, w, host, id: g.id, closed: false,
      store: { get: (k, d) => store.get('jhp_games_' + g.id + '_' + k, d), set: (k, v) => store.set('jhp_games_' + g.id + '_' + k, v) },
      sfx, note: JG.note, secret, fmt: JG.fmt, esc,
      onClose(fn) { cleanups.push(fn); },
      on(t, ev, fn, opt) { t.addEventListener(ev, fn, opt); cleanups.push(() => t.removeEventListener(ev, fn, opt)); },
      timeout(fn, ms) { const id = setTimeout(() => { timers.delete(id); if (!G.closed) fn(); }, ms); timers.add(id); return id; },
      interval(fn, ms) { const id = setInterval(() => { if (!G.closed) fn(); }, ms); timers.add(id); return id; },
      clear(id) { clearTimeout(id); clearInterval(id); timers.delete(id); },
      status(t) { if (w.status) w.status.textContent = t; },
      // the window counts as "active" when it's on screen, focused, and the visitor last clicked inside it
      active() { return !G.closed && w.el.style.display !== 'none' && !w.el.classList.contains('inactive') && engaged && !document.hidden; },
      onActive: null, // fn(isActive) when that changes
      // a managed requestAnimationFrame loop: fn(dt seconds, active) every frame; stops for good when the window closes
      loop(fn) { loopFn = fn; if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(tick); } },
      stopLoop() { loopFn = null; if (rafId) cancelAnimationFrame(rafId); rafId = 0; },
      menu(spec) { Apps.menubar(w, spec.map(([label, list]) => [label, () => (typeof list === 'function' ? list() : list).map(wrapItem)])); },
      about: o => about(g, o), help: topics => help(g, topics),
      scores: o => Scores(g.id, o),
      dialog, msg: JG.msg,
      focus() { try { (G.focusEl || host).focus({ preventScroll: true }); } catch (e) {} },
      keys: null, // { down(ev), up(ev) } routed from the document while this window is on top
      // Layout and input share JackOS logical pixels.
      rect(el) { return window.DesktopSurface ? DesktopSurface.rect(el) : el.getBoundingClientRect(); },
      point(ev) { return window.DesktopSurface ? DesktopSurface.point(ev.clientX, ev.clientY) : { x: ev.clientX, y: ev.clientY }; },
      // Convert absolute logical coordinates to physical client coordinates for debug/test input.
      client(x, y) { return window.DesktopSurface ? DesktopSurface.client(x, y) : { x, y }; },
      // a hi-dpi canvas that fills `parent` and calls onSize(W, H) when the size changes
      canvas(parent, onSize, cls) {
        const cv = document.createElement('canvas'); cv.className = 'jgcv' + (cls ? ' ' + cls : ''); cv.tabIndex = 0;
        parent.appendChild(cv);
        const C = { cv, c: cv.getContext('2d'), W: 0, H: 0, dpr: 1 };
        let ready = false; // the first measurement happens synchronously but onSize waits a tick, so callers can finish setting up
        const fit = () => {
          if (G.closed) return;
          // Reduce backing pixels on an unattended monitor, never logical layout
          // or simulation speed. Direct use restores sharp pixels immediately.
          const resting = window.House?.screenEffort === 'background';
          const r = G.rect(parent), dpr = Math.min(2.5, window.devicePixelRatio || 1) * (resting ? .5 : 1);
          if (r.width < 2 || r.height < 2) return; // minimised / hidden: keep the last size
          const W = Math.max(40, Math.floor(r.width)), H = Math.max(40, Math.floor(r.height));
          if (W === C.W && H === C.H && dpr === C.dpr) return;
          C.W = W; C.H = H; C.dpr = dpr; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
          C.c.setTransform(dpr, 0, 0, dpr, 0, 0);
          if (onSize && ready) onSize(W, H);
        };
        if (window.ResizeObserver) { const ro = new ResizeObserver(fit); ro.observe(parent); cleanups.push(() => ro.disconnect()); }
        G.on(window, 'resize', fit); G.on(document, 'house-screen-effort', fit); fit(); setTimeout(() => { ready = true; if (G.closed) return; const w0 = C.W; fit(); if (onSize && C.W === w0) onSize(C.W, C.H); }, 0);
        C.fit = fit;
        return C;
      },
      // music via Sound.addTune'd tunes: only when sound is on and the game's music option allows it
      music(name) { try { if (window.Sound && Sound.on && name) { if (Sound.music.playing !== name) Sound.music.play(name); G._tune = name; } else G.stopMusic(); } catch (e) {} },
      stopMusic() { try { if (window.Sound && G._tune && Sound.music.playing === G._tune) Sound.music.stop(); } catch (e) {} G._tune = ''; },
      // Legacy game helpers: desktop windows retain their chosen size.
      fit() {},
      phone: () => false,
      // the saved game (js/gamesave.js, key games.<id>): G.saver(getState, {v, live, every}) -> {load, save, now, clear}.
      // It saves when the window closes and when the page goes away, and stops when the window has gone.
      saver(get, o) {
        if (!Apps.gameSaver) return { load: () => null, save() {}, now() {}, clear() {}, stop() {}, flush() {} };
        const s = Apps.gameSaver('games.' + g.id, get, o).watch(w); cleanups.push(() => s.stop()); return s;
      },
    };
    function wrapItem(it) {
      if (!it || it === '-' || typeof it !== 'object') return it;
      const o = Object.assign({}, it);
      if (it.act) o.act = () => { it.act(); setTimeout(() => { if (!G.closed && !document.querySelector('.jgdlg')) G.focus(); }, 0); };
      if (it.sub) o.sub = () => (typeof it.sub === 'function' ? it.sub() : it.sub).map(wrapItem);
      return o;
    }
    function tick(t) {
      rafId = 0; if (G.closed || !loopFn) return;
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000)); last = t;
      checkActive();
      try { loopFn(dt, G.active()); } catch (e) { console.error(e); }
      if (!G.closed && loopFn) rafId = requestAnimationFrame(tick);
    }
    function checkActive() {
      const a = G.active();
      if (a !== wasActive) { wasActive = a; if (a) engaged = true; if (!a) G.stopMusic(); if (G.onActive) try { G.onActive(a); } catch (e) { console.error(e); } }
    }
    G.checkActive = checkActive;
    // engagement: clicking elsewhere (the browser, the desktop, another window) disengages; clicking inside re-engages
    G.on(document, 'pointerdown', ev => {
      const inside = w.el.contains(ev.target);
      if (inside) engaged = true;
      else if (!ev.target.closest('.menu')) engaged = false;
      setTimeout(checkActive, 0);
    }, true);
    G.on(document, 'visibilitychange', () => checkActive());
    const mo = new MutationObserver(() => checkActive()); mo.observe(w.el, { attributes: true, attributeFilter: ['style', 'class'] }); cleanups.push(() => mo.disconnect());
    // keyboard: route keys to this game when it's the top window and nothing else (a text box, a dialog) has focus
    const routed = ev => {
      if (G.closed || !G.keys || w.el.style.display === 'none' || w.el.classList.contains('inactive')) return false;
      const a = document.activeElement;
      if (a && a !== document.body && a !== document.documentElement && !w.el.contains(a)) return false;
      if (a && w.el.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return false;
      if (document.querySelector('.menu')) return false;
      return tops()[0] === w.el;
    };
    // Mouse and keyboard share holds; changing to/from a gamepad cancels them.
    const keys = new Map(), pointers = new Map();
    const cancelInputs = () => {
      for (const ev of keys.values()) G.keys?.up?.(ev);
      keys.clear();
      const active = [...pointers.values()]; pointers.clear();
      for (const point of active) {
        point.target.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: point.id, pointerType: point.type, button: 0, buttons: 0 }));
        try { if (point.target.hasPointerCapture(point.id)) point.target.releasePointerCapture(point.id); } catch (_) {}
      }
    };
    G.on(host, 'pointerdown', ev => {
      if (ev.pointerType === 'mouse') pointers.set(ev.pointerId, { id: ev.pointerId, type: ev.pointerType, target: ev.target });
    }, true);
    const released = ev => pointers.delete(ev.pointerId);
    G.on(document, 'pointerup', released, true); G.on(document, 'pointercancel', released, true);
    G.on(host, 'lostpointercapture', ev => { if (pointers.has(ev.pointerId)) cancelInputs(); }, true);
    G.on(document, 'game-input-change', ev => {
      const { mode, previous } = ev.detail || {};
      if (mode !== previous && (mode === 'gamepad' || previous === 'gamepad')) cancelInputs();
    });
    G.on(window, 'blur', cancelInputs);
    G.on(document, 'visibilitychange', () => { if (document.hidden) cancelInputs(); });
    G.onClose(cancelInputs);
    G.on(document, 'keydown', ev => {
      if (!routed(ev)) return;
      if (ev.ctrlKey && ev.altKey) return;
      if (ev.key === 'F2' && G.newGame) { ev.preventDefault(); G.newGame(); return; }
      if (ev.key === 'F1' && G.helpKey) { ev.preventDefault(); G.helpKey(); return; }
      keys.set(ev.code || ev.key, { key: ev.key, code: ev.code, location: ev.location, repeat: false, preventDefault() {} });
      if (G.keys.down && G.keys.down(ev) === true) ev.preventDefault();
    });
    G.on(document, 'keyup', ev => {
      const held = keys.delete(ev.code || ev.key);
      if ((held || routed(ev)) && G.keys?.up && G.keys.up(ev) === true) ev.preventDefault();
    });
    G._cleanup = () => {
      G.closed = true; G.stopLoop(); G.stopMusic();
      timers.forEach(id => { clearTimeout(id); clearInterval(id); }); timers.clear();
      cleanups.splice(0).forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    };
    return G;
  }

  function launch(g, arg) {
    const host = document.createElement('div'); host.className = 'jghost jg-' + g.id; host.tabIndex = -1;
    host.innerHTML = `<div class="jgload"><div class="jgloadico">${g.icon}</div><div>Loading ${esc(g.exe)}...</div><div class="prog jgloadbar"><span style="display:flex;gap:2px"></span></div></div>`;
    let G = null;
    const w = Apps.win(g.name, host, { w: g.w, h: g.h, icon: g.icon, menubar: true, status: g.status !== false, cls: 'jgwin jgw-' + g.id, minW: g.minW || 280, minH: g.minH || 240, onClose: () => { if (G) G._cleanup(); } });
    const bar = host.querySelector('.jgloadbar span');
    let k = 0; const fill = setInterval(() => { if (k < 14 && bar) { bar.appendChild(document.createElement('i')); k++; } }, 60);
    played(g.id);
    Apps.load('js/games-' + g.file + '.js').then(() => {
      clearInterval(fill);
      if (w.closed) return;
      const mod = JG.mods[g.id];
      if (!mod) throw new Error('missing module ' + g.id);
      host.innerHTML = '';
      G = makeG(g, w, host);
      JG.live[g.id] = G; G.onClose(() => { if (JG.live[g.id] === G) delete JG.live[g.id]; });
      mod(G, arg);
      setTimeout(() => G.focus(), 30);
    }).catch(e => {
      clearInterval(fill); console.error(e);
      if (w.closed) return;
      host.innerHTML = `<div class="jgload"><div class="jgloadico">${g.icon}</div><div>${esc(g.exe)} could not be loaded.</div><div class="small">The CD-ROM may be dirty. Give it a wipe on your jumper and try again.</div></div>`;
    });
    return w;
  }
  JG.launch = launch;

  // ================================================================ registration: programs, Run, files, desktop
  GAMES.forEach(g => {
    Apps.register('games.' + g.id, { single: true, cmd: g.cmd, open: arg => launch(g, arg) });
    Apps.addProgram(['Games', g.name], 'games.' + g.id, g.icon);
  });

  // the Games folder (a desktop icon): big icons for every game, like a Program Group
  Apps.register('games.folder', { single: true, cmd: ['games', 'my games', 'games folder'], open() {
    const all = [...GAMES.map(g => ({ name: g.name, icon: g.icon, app: 'games.' + g.id, go: () => Apps.open('games.' + g.id) })),
      { name: 'Solitaire', icon: I.sol, app: 'sol', go: () => Apps.open('sol') }, { name: 'FreeCellar', icon: I.fc, app: 'freecell', go: () => Apps.open('freecell') },
      { name: 'Games Arcade (Web)', icon: '<svg viewBox="0 0 32 32"><path d="M6 2h20v28H6z" fill="#5b16c9" stroke="#000"/><rect x="9" y="5" width="14" height="11" fill="#000" stroke="#888"/><path d="M12 13l2-4 2 3 2-2 2 3" stroke="#b6ff00" fill="none"/><circle cx="12" cy="22" r="2.5" fill="#e10600" stroke="#000"/><circle cx="20" cy="21" r="1.5" fill="#ffd400" stroke="#000"/><circle cx="23" cy="24" r="1.5" fill="#00e5ff" stroke="#000"/></svg>', go: () => { document.getElementById('browser').classList.remove('min'); IE.go('demos', 'click'); } }]
      .filter(x => !x.app || !window.Setup || Setup.ok(x.app)).sort((a, b) => a.name.localeCompare(b.name));
    const b = document.createElement('div'); b.className = 'jgfolder';
    b.innerHTML = `<div class="jgfgrid">${all.map((x, i) => `<button type="button" class="jgfi" data-i="${i}"><span class="jgfic">${x.icon}</span><span class="jgflb">${esc(x.name)}</span></button>`).join('')}</div>`;
    const w = Apps.win('Games', b, { w: 470, h: 360, icon: I.folder, status: true, minW: 240, minH: 180 });
    w.status.textContent = `${all.length} object(s)`;
    b.querySelectorAll('.jgfi').forEach(el => {
      Apps.bindLaunch(el, () => all[+el.dataset.i].go(), () => {
        b.querySelectorAll('.jgfi.sel').forEach(x => x.classList.remove('sel')); el.classList.add('sel');
        w.status.textContent = all[+el.dataset.i].name;
      });
    });
    return w;
  } });
  Apps.desktopIcon('Games', I.folder, () => Apps.open('games.folder'), 'iconGamesFolder');
  Apps.desktopIcon('Space Jack Pinball', I.pinball, () => Apps.open('games.pinball'), 'iconPinball');

  // Run box extras
  Apps.cmd(['iddqd', 'idkfa'], () => { secret('games.iddqd'); JG.msg('JackOS', 'God mode is not available in JackOS 98.\n\nThis is a computer, not a space station full of demons. Try Start > Programs > Games instead.', 'warn'); });
  Apps.cmd(['xyzzy.games', 'plugh'], () => JG.msg('JackOS', 'A hollow voice says "Fool." (Wrong game, but nice try.)', 'info'));

  // ================================================================ C: drive: game exes, high-score files and Jack's notes
  const PFG = 'C:/Program Files/Games';
  Apps.fs.dir(PFG);
  GAMES.forEach(g => Apps.fs.add(PFG, { name: g.exe, type: 'exe', app: 'games.' + g.id, date: g.date, size: g.size }));
  const T = (path, name, date, text, extra) => Apps.fs.add(path, Object.assign({ name, type: 'txt', date, size: Math.max(1, Math.ceil(text.length / 1024)) + ' KB', text }, extra || {}));
  T(PFG, 'MOREGAMES.TXT', '31/10/99', `MORE GAMES!!!\n=============\nJackOS 98 came with Solitaire and FreeCellar. That is NOT ENOUGH GAMES.\nSo I made some more. Well, I made most of them. Dave "helped".\n\nPINBALL.EXE   - Space Jack Pinball. The best one. Z and / for flippers.\nSKIJACK.EXE   - ski down a mountain. Don't go past 2000m. I MEAN IT.\nPODJACK.EXE   - POD RACING!!! Made it the day after I saw the new\n                space film at the pictures (16th July!!). Two huge\n                engines and a pilot on a string. Best. Thing. Ever.\nMSHEARTS.EXE  - Hearts. Play against Dave, ${Cast.t('Cousin {cousin}')} and Gubbinz.\nSPIDER.EXE    - Spider Solitaire. 104 cards! Dad says it's "very relaxing".\nPIPEJACK.EXE  - lay pipes before the green slime comes out. It's green.\nJACKJONG.EXE  - match the tiles. Took ages to draw all of them.\nSLIDER15.EXE  - the 15 puzzle. Like the plastic one from the cracker.\nJIGSAW98.EXE  - jigsaws with no missing pieces. (Unlike the one in the loft.)\nREVERSI.EXE   - black and white discs. Easy to learn, hard to win.\nJACKCHES.EXE  - chess against Deep Jack. It thinks 3 moves ahead.\nCUBENET.EXE   - a Rubrick's cube flattened out. For practising on the bus.\nJACKLING.EXE  - save the Jacklings! They walk off cliffs. A LOT.\n\nTop tip: F2 starts a new game in all of them.\n`);
  T(PFG, 'PINBALL.HI', '19/06/99', `SPACE JACK PINBALL - TABLE HIGH SCORES\n======================================\n1. JACK      2,914,350\n2. JACK      1,877,000\n3. DAVE        950,210   (he tilted it 6 times)\n4. ${(Cast.first('cousin').toUpperCase().slice(0, 9) + '          ').slice(0, 10)}  641,000\n5. GUBBINZ           0   (ate the ball)\n\nThe real high scores are in Game > High Scores now.\nThis file is just for showing off.\n`);
  T('C:/My Documents', 'pinball cheats.txt', '22/06/99', `PINBALL CHEATS (top secret, do NOT tell Dave)\n=============================================\nYou type them while the ball is moving. No pressing Enter.\n\n- the name of a certain helper = ???  (try it)\n- what Gorks shoot             = more balls!!!\n- big shiny fings             = lots of points (the Gork money)\n- the arcade one from the magazine (up up down down...)\n\nIf you tilt the table the flippers go dead. Don't shove it more than\ntwice. Or do, it's funny.\n`);
  T('C:/My Documents', 'skigrot warning.txt', '03/02/99', `DO NOT SKI PAST 2000 METRES.\n\nI'm serious. Something lives down there. It's big and it's got teeth\nand it LOVES skiers. I've never got away from it. Dave says you can\nif you press a certain letter, but Dave also said his uncle works\nat the moon.\n\nP.S. Jumps: press the arrow keys in the air for tricks. Four tricks\nin one jump = BIG AIR.\n`);
  T('C:/My Documents', 'chess notes.txt', '12/05/99', `HOW TO BEAT DEEP JACK (my notes)\n================================\n1. Get your knights and bishops out early.\n2. Castle! (King two squares towards the rook. The rook jumps over.)\n3. Don't leave pieces where they can be taken for free.\n   Deep Jack ALWAYS takes free stuff. It's greedy. Like Gubbinz.\n4. When it's "Very Hard", just cry.\n\nDave says he beat it on Very Hard. Dave also says a lot of things.\n`);
  T('C:/My Documents', 'hearts rules for gran.txt', '25/12/98', `HEARTS - THE RULES (for Gran, Christmas 1998)\n============================================\n- Four players, 13 cards each.\n- Pass 3 cards before each hand (left, right, across, then keep).\n- Whoever has the 2 of clubs starts.\n- Follow suit if you can.\n- Every heart you win = 1 point. The Queen of Spades = 13 points!\n- LOW score wins. When someone reaches 100, the game ends.\n- If you get ALL the hearts AND the Queen, everyone ELSE gets 26.\n  That's called "shooting the moon". Gran did it by accident twice.\n`);
  T('C:/Program Files/Games', 'JACKLING.PWD', '31/10/99', `JACKLINGS LEVEL CODES\n=====================\nLevel 1: no code (just play it)\n...the rest are written on the back of Jack's hand.\nIt rained. Sorry.\n`);
})();

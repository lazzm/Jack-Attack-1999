/* seasons-disc: the JACK ATTACK! COVER CD of the month (lazy loaded by seasons.js). A new disc every month of 1999:
 * a CSS-drawn label, 4 "demos" of things that are already on the PC, this month's wallpaper (drawn on a canvas and
 * tiled on the desktop, like Display Properties does it) and a README. Back issues live in the shoebox. */
(function () {
  'use strict';
  const SS = window.Seasons; if (!SS || !window.Apps) return;
  const A = Apps, $ = id => document.getElementById(id);
  const { h, esc, sfx, got, today, MONTHS, CD_ICON } = SS;

  SS.css('ssn-disc-css', `
.sd{display:flex;gap:12px;margin:-6px;padding:10px;background:linear-gradient(160deg,var(--b1),var(--b2));color:#fff;font:12px/1.4 Verdana,Tahoma,sans-serif;min-height:300px;flex-wrap:wrap}
.sd-l{flex:none;width:160px;display:flex;flex-direction:column;align-items:center;gap:8px}
.sd-disc{position:relative;width:150px;height:150px;border-radius:50%;border:2px solid #333;box-shadow:3px 3px 0 rgba(0,0,0,.4);background:radial-gradient(circle,#fff 0 12px,#999 12px 14px,#e8e8f0 14px 22px,transparent 23px),conic-gradient(from 20deg,rgba(255,255,255,.35),transparent 12%,rgba(255,255,255,.18) 28%,transparent 40%,rgba(255,255,255,.3) 62%,transparent 75%,rgba(255,255,255,.2) 90%),linear-gradient(135deg,var(--d1),var(--d2));overflow:hidden}
.sd-disc.spin{animation:sdspin .5s linear 3}
@keyframes sdspin{to{transform:rotate(1turn)}}
.sd-disc .a{position:absolute;left:0;right:0;top:20px;text-align:center;font:400 21px/1 var(--comic,Impact);color:var(--d3);-webkit-text-stroke:1px #000;paint-order:stroke fill;letter-spacing:1px;transform:rotate(-4deg)}
.sd-disc .m{position:absolute;left:0;right:0;bottom:36px;text-align:center;font:bold 12px/1.1 Verdana,sans-serif;color:#fff;text-shadow:1px 1px 0 #000;letter-spacing:1px}
.sd-disc .c{position:absolute;left:0;right:0;bottom:18px;text-align:center;font:bold 8px Verdana,sans-serif;color:#fff;opacity:.85;letter-spacing:2px}
.sd-disc .art{position:absolute;left:12px;top:56px;width:34px;height:34px}
.sd-disc .art2{position:absolute;right:12px;top:56px;width:34px;height:34px}
.sd-r{flex:1;min-width:230px;display:flex;flex-direction:column;gap:6px}
.sd-r h2{margin:0;font:400 24px/1 var(--comic,Impact);color:var(--d3);-webkit-text-stroke:1px #000;paint-order:stroke fill;letter-spacing:1px}
.sd-r .tg{font:bold 11px Verdana,sans-serif;color:#cff}
.sd-tabs{display:flex;gap:4px;flex-wrap:wrap}
.sd-tabs button{font:bold 11px Verdana,sans-serif;color:#fff;background:linear-gradient(#3a3aff,#1a0a8a);border:2px outset #88f;padding:4px 10px;cursor:pointer;min-height:26px}
.sd-tabs button.on{background:linear-gradient(#ff3a3a,#8a0a0a);border-style:inset}
.sd-list{background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.4);padding:6px;min-height:170px;max-height:230px;overflow:auto}
.sd-it{display:flex;gap:8px;align-items:center;padding:5px 2px;border-bottom:1px dotted rgba(255,255,255,.3)}
.sd-it:last-child{border:0}
.sd-it .ic{flex:none;width:24px;height:24px}.sd-it .ic svg{width:24px;height:24px}
.sd-it b{color:var(--d3)}.sd-it small{display:block;color:#dde}
.sd-it .btn{margin-left:auto;flex:none;font-size:11px;padding:2px 8px;min-height:24px}
.sd-wp{height:110px;border:2px solid;border-color:#808080 #fff #fff #808080;margin-bottom:6px;image-rendering:pixelated}
.sd-rd{white-space:pre-wrap;font:11px/1.35 "Courier New",monospace;color:#eef;margin:0}
.sd-ft{display:flex;gap:6px;align-items:center;font:11px Verdana,sans-serif;color:#dde;flex-wrap:wrap}
.sd-ft select{font:11px var(--ui)}
@media (prefers-reduced-motion:reduce){.sd-disc.spin{animation:none}}
@media (max-width:640px){.sd{gap:8px;min-height:0}.sd-l{width:100%;flex-direction:row;justify-content:flex-start}.sd-disc{width:104px;height:104px;flex:none}.sd-disc .a{top:14px;font-size:14px}.sd-disc .art,.sd-disc .art2{display:none}.sd-disc .m{bottom:24px;font-size:9px}.sd-disc .c{bottom:12px;font-size:6px}.sd-l .sd-ft:last-child{display:none}.sd-list{min-height:0;max-height:38vh}.sd-r h2{font-size:20px}}
`);

  // ================================================================ the discs
  // demos: [target, name, blurb]. target = app id, 'web:<section>', or 'prog:<Start menu path>'
  const D = [
    { b: ['#0a1a4a', '#2a5ad8'], d: ['#9fd0ff', '#ffffff', '#ffd400'], art: 'snow', tag: 'NEW YEAR, NEW DISC! 650MB OF FROSTY FUN', demos: [['games.ski', 'SkiJack', 'Fresh snow! Dodge the trees, jump the ramps and DON\'T look behind you.'], ['games.pinball', 'Space Jack Pinball', 'The full table! Tilt it and the computer tells you off.'], ['sol', 'Solitaire', 'OK, it was already on your PC. But now it\'s on a DISC.'], ['era.sweeper', 'Bugsweeper 2000', 'Find the Y2K bugs without treading on them. Tense.']], wall: 'snow', readme: 'Happy New Year! This is the first ever JACK ATTACK! cover CD. Ryan\'s CD writer only made a coaster twice.' },
    { b: ['#5a0030', '#e0306a'], d: ['#ff8ac4', '#ffe0f0', '#fff'], art: 'heart', tag: 'THE LOVE-ERLY ISSUE (YUCK)', demos: [['games.hearts', 'Hearts', 'It\'s Valentine\'s month, so: Hearts. Avoid the Queen of Spades like it\'s homework.'], ['games.mahjong', 'Jack Jong', 'Match the tiles. Very calm. Mom likes this one.'], ['games.reversi', 'Reversi', 'Black and white counters. Easy to learn, impossible to beat Dave at.'], ['games.jigsaw', 'Jigsaw 98', 'A jigsaw with no missing pieces. A Christmas miracle in February.']], wall: 'hearts', readme: 'No soppy stuff on this disc, just games. (Except Hearts. That doesn\'t count.)' },
    { b: ['#1a3a0a', '#3a9a2a'], d: ['#e10600', '#ffd400', '#fff'], art: 'nose', tag: 'RED NOSE DAY SPECIAL!', demos: [['games.chess', 'Jack Chess', 'The robots play chess. Badly. Beat them!'], ['games.pipe', 'Pipe Jack', 'Lay the pipes before the slime comes. Panic is normal.'], ['games.slide', 'Slider 15', 'Slide the numbers into order. Harder than a Rubrick\'s cube. (It isn\'t.)'], ['era.revenge', 'Blobbit\'s Revenge', 'A Blobbit. A grudge. A lot of robots.']], wall: 'noses', readme: 'Red Nose Day is on the 12th! Our class is doing a sponsored silence. Dave is not taking part. (Dave cannot.)' },
    { b: ['#3a2a6a', '#8a6ad8'], d: ['#ffd400', '#ff9ad8', '#fff'], art: 'egg', tag: 'EGG-CELLENT EASTER EDITION', demos: [['games.grotlings', 'Jacklings', 'Lead the Jacklings home. Give one an umbrella. Watch him float.'], ['era.grotball', 'Jack Ball', 'Bounce the ball, smash the bricks, catch the power-ups.'], ['games.spider', 'Spider Solitaire', 'Solitaire, but eight times harder and with spiders. (No real spiders.)'], ['games.cube', 'Cube Net Trainer', 'Learn your cube faces. Jack can do this with his eyes shut. (He can\'t.)']], wall: 'eggs', readme: 'Happy Easter! Do not eat this disc. It is not chocolate. (Dave.)' },
    { b: ['#000010', '#2a1a4a'], d: ['#ffd400', '#9ff', '#ffd400'], art: 'ship', tag: 'THE PHANTOM NUISANCE IS OUT (IN AMERICA)!!!', demos: [['games.podracer', 'Pod Jack Racer', 'Episode I is out in America this month! Practise your podracing NOW.'], ['era.bowling', 'Alien Bowling 99', 'Strike! Spare! Splat! A bowling alley in your PC.'], ['web:demos', 'JACKTRIS', 'Jack\'s own falling blocks game. On the web site. Beat his score!'], ['freecell', 'FreeCell', 'Every game can be won. Apparently. (Except the one Dave is on.)']], wall: 'stars', readme: 'Episode I! The UK has to wait until JULY. That is not fair. This disc is our protest.' },
    { b: ['#6a3a00', '#ffa000'], d: ['#fff', '#ffe600', '#e10600'], art: 'sun', tag: 'SUMMER IS COMING. SO ARE EXAMS.', demos: [['prog:Games > Jack Quest', 'Jack Quest', 'A text adventure! Type GO NORTH. Then type it again. Then cry.'], ['era.squigso', 'Dr. Chatso', 'Drop the pills, match the colours, zap the germs. Doctor\'s orders.'], ['games.pinball', 'Space Jack Pinball', 'Back by popular demand (Dave\'s).'], ['prog:Games > DOS Shareware > Turbo Racer', 'Turbo Racer', 'A DOS racing game. In TEXT MODE. Your car is a letter T.']], wall: 'sun', readme: 'Revise for your exams. Then play these. In that order. (Jack did not do it in that order.)' },
    { b: ['#004a6a', '#00a0c0'], d: ['#ffd400', '#fff', '#ff7a00'], art: 'lolly', tag: 'SCHOOL\'S OUT!!! SIX WEEKS OF GAMES', demos: [['era.island', 'Jack Island Screen Saver', 'A desert island on your screen. The nearest you\'ll get to a holiday.'], ['era.bowling', 'Alien Bowling 99', 'Too hot to go outside. Bowl indoors.'], ['era.grotball', 'Jack Ball', 'Brick-smashing! The perfect rainy-day game (it will rain).'], ['web:demos', 'Blobbit Lob', 'Launch a Blobbit. See how far it goes. Science!']], wall: 'lollies', readme: 'Summer holidays! This disc lasts six weeks if you only play one demo a day. (It will not last six weeks.)' },
    { b: ['#0a0a0a', '#3a3a3a'], d: ['#ffd400', '#ff9a00', '#fff'], art: 'eclipse', tag: 'TOTAL ECLIPSE OF THE DISC (11 AUGUST!)', demos: [['prog:Games > DOS Shareware > Jack Crawl', 'Jack Crawl', 'A dungeon crawl in DOS. Bring a torch. (Like for the eclipse.)'], ['prog:Games > DOS Shareware > Flak Attack!', 'Flak Attack!', 'Shoot the parachutes before they land. A DOS shoot-em-up.'], ['games.pipe', 'Pipe Jack', 'Plumbing, but fun.'], ['games.mahjong', 'Jack Jong', 'Very relaxing. Good for after the eclipse panic.']], wall: 'eclipse', readme: 'There\'s a total eclipse on the 11th! DON\'T LOOK AT THE SUN. Look at this disc instead. (Not in the sun.)' },
    { b: ['#2a1a0a', '#8a5a2a'], d: ['#ffd400', '#fff', '#e10600'], art: 'pencil', tag: 'BACK TO SCHOOL (NOOOOO)', demos: [['carta.typing', 'Gubbinz Teaches Typing', 'Learn to type properly. Mrs Hargreaves will be amazed. Or suspicious.'], ['games.cube', 'Cube Net Trainer', 'Brain training for cubers.'], ['games.chess', 'Jack Chess', 'Chess club starts again this month. Practise here first.'], ['era.sweeper', 'Bugsweeper 2000', 'One wrong click and BOOM. Like a maths test.']], wall: 'pencils', readme: 'Back to school. New pencil case. Same old Dave. Also the Daydream is out in America on 9/9/99!' },
    { b: ['#1a001a', '#5a1a5a'], d: ['#ff7a00', '#ffd400', '#3aff6a'], art: 'pumpkin', tag: 'SPOOKY SPECIAL!!! (WOOOOO)', demos: [['prog:Games > Internet Games > Zone Java Arcade', 'Zone Java Arcade', 'Arcade games in your browser! Needs Java. And patience.'], ['era.maze', '3D Jack Maze Screen Saver', 'A spooky 3D maze. Where does it go? Nobody knows. Not even Gubbinz.'], ['games.grotlings', 'Jacklings', 'Save the Jacklings from certain gloom. Spooky gloom.'], ['era.revenge', 'Blobbit\'s Revenge', 'The Blobbit is back. And this time it\'s Halloween.']], wall: 'pumpkins', readme: 'Pocket Critters is out in the UK this month!!! Jack got Blue. JackK is getting Red. TRADING IS ON.' },
    { b: ['#0a0a20', '#3a1a3a'], d: ['#ff4aff', '#ffd400', '#3affff'], art: 'rocket', tag: 'BANG! BONFIRE NIGHT EDITION', demos: [['prog:Games > DOS Shareware > Gem Wars (BBS door)', 'Gem Wars', 'A BBS door game. Trade Rupees across the galaxy. Ork economics!'], ['games.pinball', 'Space Jack Pinball', 'Space! Explosions! Flippers! It\'s basically fireworks.'], ['games.hearts', 'Hearts', 'A card game for cold nights.'], ['prog:Games > DOS Shareware > Alien Hunt', 'Alien Hunt', 'Hunt the alien in 20 caves. It hides in the full stops.']], wall: 'fireworks', readme: 'Remember, remember, the fifth of November! Keep pets indoors. Keep Dave away from the sparklers.' },
    { b: ['#4a0000', '#a01010'], d: ['#ffffff', '#ffd400', '#3aff6a'], art: 'tree', tag: 'THE LAST DISC OF THE 1900s!!!', demos: [['games.ski', 'SkiJack', 'It\'s snowing (on the desktop). Get your skis on.'], ['games.mahjong', 'Jack Jong', 'For Christmas afternoon, when everyone else is asleep.'], ['games.spider', 'Spider Solitaire', 'The Boxing Day classic.'], ['games.podracer', 'Pod Jack Racer', 'One more race before the Millennium!']], wall: 'holly', readme: 'The last disc of the century! If the Millennium Bug eats this CD, it was nice knowing you. Merry Christmas!' },
  ];
  // little pictures for the labels
  const ART = {
    snow: '<svg viewBox="0 0 32 32"><g stroke="#fff" stroke-width="2"><path d="M16 2v28M4 9l24 14M4 23l24-14"/></g></svg>',
    heart: '<svg viewBox="0 0 32 30"><path d="M16 28C6 20 1 15 1 9a7.5 7.5 0 0 1 15-2 7.5 7.5 0 0 1 15 2c0 6-5 11-15 19z" fill="#ff2a6d" stroke="#600030"/></svg>',
    nose: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#e10600" stroke="#600"/><circle cx="12" cy="12" r="3" fill="#fff" opacity=".6"/></svg>',
    egg: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="17" rx="10" ry="13" fill="#ffd400" stroke="#000"/><path d="M6 15l5-3 5 3 5-3 5 3M7 21l5-3 4 3 5-3 4 3" stroke="#e10600" stroke-width="2" fill="none"/></svg>',
    ship: '<svg viewBox="0 0 32 32"><path d="M4 22L16 6l12 16-12-4z" fill="#ccc" stroke="#000"/><circle cx="16" cy="14" r="2" fill="#3affff"/><path d="M10 24l-2 6M22 24l2 6" stroke="#ff7a00" stroke-width="2"/></svg>',
    sun: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="#ffe600" stroke="#a07000"/><g stroke="#ffe600" stroke-width="2.5"><path d="M16 1v5M16 26v5M1 16h5M26 16h5M5 5l4 4M23 23l4 4M27 5l-4 4M9 23l-4 4"/></g></svg>',
    lolly: '<svg viewBox="0 0 32 32"><path d="M9 3h14v18H9z" rx="5" fill="#ff4a8a" stroke="#000"/><path d="M9 9h14M9 15h14" stroke="#ffd400" stroke-width="3"/><rect x="14" y="21" width="4" height="9" fill="#e8c890" stroke="#000"/></svg>',
    eclipse: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#ffd400" opacity=".5"/><circle cx="16" cy="16" r="10" fill="#fff"/><circle cx="16" cy="16" r="9.6" fill="#000"/></svg>',
    pencil: '<svg viewBox="0 0 32 32"><path d="M6 26L24 8l3 3L9 29H6z" fill="#ffd400" stroke="#000"/><path d="M6 26v3h3" fill="#f2c8a0" stroke="#000"/><path d="M24 8l3 3 2-2-3-3z" fill="#ff8ac4" stroke="#000"/></svg>',
    pumpkin: '<svg viewBox="0 0 32 32"><path d="M16 7c-1-3 1-5 3-5" stroke="#3a6a1a" stroke-width="2" fill="none"/><ellipse cx="16" cy="19" rx="13" ry="11" fill="#ff7a00" stroke="#7a3000"/><path d="M9 15l3 2-3 1zM23 15l-3 2 3 1zM9 23l3 2 2-2 2 2 2-2 2 2 3-2" fill="#200" stroke="#200"/></svg>',
    rocket: '<svg viewBox="0 0 32 32"><path d="M16 2c5 5 6 13 4 20h-8c-2-7-1-15 4-20z" fill="#e10600" stroke="#000"/><path d="M12 22l-4 6 6-3M20 22l4 6-6-3" fill="#ffd400" stroke="#000"/><circle cx="16" cy="11" r="2.5" fill="#9ff" stroke="#000"/></svg>',
    tree: '<svg viewBox="0 0 32 32"><path d="M16 2l-7 10h4l-7 9h5l-8 8h26l-8-8h5l-7-9h4z" fill="#1a8a2a" stroke="#063a0c"/><circle cx="13" cy="13" r="1.6" fill="#ff2a2a"/><circle cx="19" cy="19" r="1.6" fill="#ffd400"/><circle cx="12" cy="24" r="1.6" fill="#3affff"/></svg>',
  };

  // ================================================================ wallpapers (drawn on a canvas, then tiled on the desktop)
  const WALL = {
    snow: (g, S) => { g.fillStyle = '#1a3a7a'; g.fillRect(0, 0, S, S); g.strokeStyle = '#fff'; g.lineWidth = 2; [[20, 22, 8], [70, 30, 6], [45, 70, 9], [84, 80, 5], [12, 76, 4]].forEach(([x, y, r]) => { for (let a = 0; a < 3; a++) { const k = a * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(k) * r, y - Math.sin(k) * r); g.lineTo(x + Math.cos(k) * r, y + Math.sin(k) * r); g.stroke(); } }); },
    hearts: (g, S) => { g.fillStyle = '#ffd1e8'; g.fillRect(0, 0, S, S); [[24, 26, 10, '#ff2a6d'], [72, 64, 12, '#e10600'], [70, 18, 6, '#ff8ac4'], [20, 76, 7, '#ff5a9a']].forEach(([x, y, r, c]) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y + r); g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.5); g.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r); g.fill(); }); },
    noses: (g, S) => { g.fillStyle = '#2a7a2a'; g.fillRect(0, 0, S, S); g.fillStyle = '#3a8a3a'; for (let i = 0; i < S; i += 12) g.fillRect(i, 0, 6, S); [[24, 24], [72, 72], [72, 24], [24, 72]].forEach(([x, y], i) => { g.fillStyle = i % 2 ? '#e10600' : '#ff3a3a'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x - 4, y - 4, 3, 0, 7); g.fill(); }); },
    eggs: (g, S) => { g.fillStyle = '#e8e0ff'; g.fillRect(0, 0, S, S); [[24, 30, '#ffd400', '#e10600'], [70, 70, '#3affff', '#5b16c9'], [72, 22, '#ff9ad8', '#3a9a2a'], [22, 76, '#3aff6a', '#ff7a00']].forEach(([x, y, a, b]) => { g.save(); g.translate(x, y); g.fillStyle = a; g.beginPath(); g.ellipse(0, 0, 10, 13, 0, 0, 7); g.fill(); g.strokeStyle = b; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, -2); g.lineTo(-5, -6); g.lineTo(0, -2); g.lineTo(5, -6); g.lineTo(10, -2); g.stroke(); g.restore(); }); },
    stars: (g, S) => { g.fillStyle = '#000010'; g.fillRect(0, 0, S, S); for (let i = 0; i < 40; i++) { g.fillStyle = i % 7 ? '#fff' : '#ffd400'; const x = (i * 37) % S, y = (i * 61) % S; g.fillRect(x, y, i % 9 ? 1 : 2, i % 9 ? 1 : 2); } g.fillStyle = '#bbb'; g.beginPath(); g.moveTo(40, 60); g.lineTo(56, 44); g.lineTo(60, 64); g.closePath(); g.fill(); g.fillStyle = '#ff7a00'; g.fillRect(38, 62, 4, 6); },
    sun: (g, S) => { g.fillStyle = '#ffa000'; g.fillRect(0, 0, S, S); g.fillStyle = '#ffc040'; for (let i = 0; i < S; i += 16) { g.beginPath(); g.moveTo(48, 48); g.lineTo(i, 0); g.lineTo(i + 8, 0); g.fill(); g.beginPath(); g.moveTo(48, 48); g.lineTo(i, S); g.lineTo(i + 8, S); g.fill(); } g.fillStyle = '#ffe600'; g.beginPath(); g.arc(48, 48, 16, 0, 7); g.fill(); },
    lollies: (g, S) => { g.fillStyle = '#9fe8ff'; g.fillRect(0, 0, S, S); [[22, 14, '#ff4a8a'], [66, 50, '#ffd400'], [70, 6, '#3aff6a'], [18, 58, '#ff7a00']].forEach(([x, y, c]) => { g.fillStyle = c; g.fillRect(x, y, 14, 24); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + 2, y + 2, 3, 18); g.fillStyle = '#e8c890'; g.fillRect(x + 5, y + 24, 4, 10); }); },
    eclipse: (g, S) => { g.fillStyle = '#05050f'; g.fillRect(0, 0, S, S); const gr = g.createRadialGradient(48, 48, 14, 48, 48, 34); gr.addColorStop(0, '#fff'); gr.addColorStop(0.2, 'rgba(255,230,150,.7)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); g.fillStyle = '#000'; g.beginPath(); g.arc(48, 48, 15, 0, 7); g.fill(); },
    pencils: (g, S) => { g.fillStyle = '#f4f1e6'; g.fillRect(0, 0, S, S); g.strokeStyle = '#9fc0ff'; for (let y = 8; y < S; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); } g.strokeStyle = '#ff8080'; g.beginPath(); g.moveTo(14, 0); g.lineTo(14, S); g.stroke(); g.save(); g.translate(56, 30); g.rotate(-0.6); g.fillStyle = '#ffd400'; g.fillRect(0, 0, 40, 8); g.fillStyle = '#f2c8a0'; g.beginPath(); g.moveTo(40, 0); g.lineTo(48, 4); g.lineTo(40, 8); g.fill(); g.restore(); },
    pumpkins: (g, S) => { g.fillStyle = '#2a0a3a'; g.fillRect(0, 0, S, S); [[26, 30], [72, 72]].forEach(([x, y]) => { g.fillStyle = '#ff7a00'; g.beginPath(); g.ellipse(x, y, 16, 12, 0, 0, 7); g.fill(); g.fillStyle = '#3a6a1a'; g.fillRect(x - 2, y - 17, 4, 6); g.fillStyle = '#ffd400'; g.beginPath(); g.moveTo(x - 8, y - 3); g.lineTo(x - 4, y - 7); g.lineTo(x - 1, y - 3); g.fill(); g.beginPath(); g.moveTo(x + 8, y - 3); g.lineTo(x + 4, y - 7); g.lineTo(x + 1, y - 3); g.fill(); g.fillRect(x - 8, y + 3, 16, 3); }); g.fillStyle = '#000'; g.beginPath(); g.moveTo(70, 20); g.lineTo(82, 14); g.lineTo(76, 22); g.lineTo(88, 20); g.lineTo(76, 26); g.fill(); },
    fireworks: (g, S) => { g.fillStyle = '#0a0a20'; g.fillRect(0, 0, S, S); [[28, 28, '#ff4aff'], [70, 64, '#ffd400'], [74, 18, '#3affff']].forEach(([x, y, c]) => { g.strokeStyle = c; g.lineWidth = 2; for (let a = 0; a < 12; a++) { const k = a * Math.PI / 6; g.beginPath(); g.moveTo(x + Math.cos(k) * 4, y + Math.sin(k) * 4); g.lineTo(x + Math.cos(k) * 14, y + Math.sin(k) * 14); g.stroke(); } }); },
    holly: (g, S) => { g.fillStyle = '#a01010'; g.fillRect(0, 0, S, S); [[30, 30], [76, 74]].forEach(([x, y]) => { g.fillStyle = '#1a8a2a'; g.beginPath(); g.ellipse(x - 9, y, 11, 5, -0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + 9, y, 11, 5, 0.4, 0, 7); g.fill(); g.fillStyle = '#ff2a2a'; [[0, 4], [-4, 7], [4, 7]].forEach(([dx, dy]) => { g.beginPath(); g.arc(x + dx, y + dy, 3.5, 0, 7); g.fill(); }); }); g.fillStyle = '#fff'; [[70, 20], [16, 70], [50, 54], [88, 44]].forEach(([x, y]) => g.fillRect(x, y, 2, 2)); },
  };
  function wallUrl(i) { const c = document.createElement('canvas'); c.width = c.height = 96; WALL[D[i].wall](c.getContext('2d'), 96); return c.toDataURL('image/png'); }
  function setWall(i) {
    const w = { img: wallUrl(i), col: D[i].b[0], mode: 'Tile' };
    const d = $('desktop'); if (d) d.style.background = `url("${w.img}") 0 0/auto repeat,${w.col}`;
    try { localStorage.setItem('jhp_prog_wall', JSON.stringify(w)); } catch (e) {}
    Desk.toast('Display Properties', `Your wallpaper is now "WALLP${String(i + 1).padStart(2, '0')}.BMP" from the ${MONTHS[i]} cover CD.`, 4000);
    got('disc'); sfx('solve');
  }

  // ================================================================ the disc menu
  function run(target) {
    const br = () => { const b = $('browser'); if (b) b.classList.remove('min'); };
    if (target.startsWith('web:')) { br(); return IE.go(target.slice(4), 'click'); }
    if (target.startsWith('prog:')) {
      const path = target.slice(5).split(' > '), p = A.programs.find(x => x.path.join(' > ') === path.join(' > '));
      if (!p) return Desk.msgbox('JACK ATTACK! Cover CD', 'This demo didn\'t fit on the disc. (It\'s on the web site instead. Probably.)', 'info');
      return typeof p.target === 'function' ? p.target() : A.open(p.target);
    }
    if (!A.apps[target]) return Desk.msgbox('JACK ATTACK! Cover CD', 'Cannot find the demo on drive D:.\n\nTake the disc out, blow on it, and put it back in.', 'warn');
    return A.open(target);
  }
  function open(arg) {
    let mi = (arg != null && D[+arg]) ? +arg : today().m - 1;
    const b = h('div', '');
    const w = A.win('', b, { w: Math.min(560, innerWidth - 8), icon: CD_ICON, noResize: true });
    let tab = 'demos';
    function draw(spin) {
      const m = D[mi], name = MONTHS[mi].toUpperCase();
      w.setTitle(`JACK ATTACK! COVER CD - ${name} 1999`);
      b.className = 'sd'; b.style.cssText = `--b1:${m.b[0]};--b2:${m.b[1]};--d1:${m.b[1]};--d2:${m.b[0]};--d3:${m.d[2]}`;
      const back = MONTHS.slice(0, today().m).map((n, i) => `<option value="${i}"${i === mi ? ' selected' : ''}>${n} 1999</option>`).reverse().join('');
      b.innerHTML = `<div class="sd-l"><div class="sd-disc${spin ? ' spin' : ''}" aria-hidden="true"><div class="a">JACK ATTACK!</div><div class="art">${ART[m.art]}</div><div class="art2">${ART[m.art]}</div><div class="m">${name} 1999</div><div class="c">COVER CD &middot; 650MB</div></div><div class="sd-ft"><label>Back issues: <select aria-label="Back issues">${back}</select></label></div><div class="sd-ft" style="font-size:10px">Keep your discs in a shoebox. Jack does.</div></div>
        <div class="sd-r"><h2>COVER CD &middot; ${esc(MONTHS[mi])}</h2><div class="tg">${esc(m.tag)}</div><div class="sd-tabs"><button type="button" data-t="demos">DEMOS</button><button type="button" data-t="wall">WALLPAPER</button><button type="button" data-t="readme">README.TXT</button></div><div class="sd-list"></div></div>`;
      b.querySelector('select').addEventListener('change', ev => { mi = +ev.target.value; if (mi !== today().m - 1) got('backissue'); sfx('turn'); draw(true); });
      b.querySelectorAll('.sd-tabs button').forEach(x => x.addEventListener('click', () => { tab = x.dataset.t; sfx('click'); show(); }));
      show();
    }
    function show() {
      const m = D[mi], list = b.querySelector('.sd-list');
      b.querySelectorAll('.sd-tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === tab));
      if (tab === 'demos') {
        list.innerHTML = m.demos.map((d, i) => `<div class="sd-it"><span class="ic">${(window.JICON && JICON.get('exe', 24)) || A.ICON.exe}</span><div><b>${esc(d[1])}</b><small>${esc(d[2])}</small></div><button class="btn" type="button" data-i="${i}">PLAY</button></div>`).join('');
        list.querySelectorAll('[data-i]').forEach(x => x.addEventListener('click', () => { sfx('turn'); run(m.demos[+x.dataset.i][0]); }));
      } else if (tab === 'wall') {
        list.innerHTML = `<div class="sd-wp" style="background:url('${wallUrl(mi)}') 0 0/auto repeat"></div><div class="row" style="justify-content:space-between;flex-wrap:wrap"><span>WALLP${String(mi + 1).padStart(2, '0')}.BMP &middot; 96 x 96 &middot; 27 KB</span><button class="btn" type="button">Set as Wallpaper</button></div>`;
        list.querySelector('.btn').addEventListener('click', () => setWall(mi));
      } else {
        list.innerHTML = `<pre class="sd-rd"></pre>`;
        list.firstChild.textContent = `JACK ATTACK! COVER CD - ${MONTHS[mi].toUpperCase()} 1999\n${'='.repeat(30)}\n\n${m.readme}\n\nON THIS DISC:\n${m.demos.map(d => '  - ' + d[1]).join('\n')}\n  - This month's wallpaper (WALLP${String(mi + 1).padStart(2, '0')}.BMP)\n\nIF A DEMO WON'T START: take the disc out, blow on it, put it back in.\n(Blowing doesn't help. Everybody does it anyway.)\n\nNext month's disc: on the desktop on the 1st. Probably.`;
      }
    }
    draw(true); sfx('turn');
    return w;
  }
  window.SeasonsDisc = { open, discs: D, run };
})();

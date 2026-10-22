/* sx-hunt: the Great JackNet Hunt's web sites, the Hunter's Kit and the Hunt's phone lines (lazy, from js/sx.js).
 *   www.greathunt.jnet      Hunt HQ: the board, the Lock, the guestbook, the rules, the Golden Bytes, the Hint Line,
 *                           the Hall of Champions, the Hunter's Kit download, robots.txt (and two pages nobody links to)
 *   www.huntersring.jnet    The Hunters' Ring hub, and its four members: www.floppyfanclub.netz, www.modemmuseum.w3b,
 *                           www.saverhall.zyne, www.shinydisc.kidz (each hides a piece of key 8)
 *   SxHunt.kit()            the Hunter's Kit program (Logbook, Decoder, Notes)
 *   SxHunt.call(what)       the phone lines: 'hint' (0909 879 0486), 'hunters' (4868377), 'bytes' (29837)
 * The answers are never in here: the Lock sends what you typed to the server (mods/sx.js), which says yes or no. */
(function () {
  'use strict';
  const A = window.Apps, X = window.Sx; if (!A || !X || window.SxHunt) return;
  const esc = A.esc, store = A.store;
  const sfx = X.sfx, secret = X.secret;
  const CAT = () => window.SxCat || { CH: [], BYTES: [], BYTE: {}, PAY: {}, HINT: { n: 3, wait: [0, 600, 1800], cost: [0, 10, 25] }, PHONE: {} };
  const HQ = X.HQ, HQU = 'http://' + HQ, RING = X.RING;
  const p2 = n => String(n).padStart(2, '0');
  const d99 = ts => { const d = new Date(ts); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/99'; };
  const isMember = () => !!(window.Net && Net.me && Net.me.member);
  const nth = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
  const RP = n => (window.Econ && Econ.rp ? Econ.rp(n) : `${n} Rupees`);
  const pct = () => Math.min(100, X.nKeys() * 7 + X.nBytes() * 3);
  const live = el => el && el.isConnected;

  // ================================================================ little pictures (original, drawn here)
  const ICO = {
    page: '<svg viewBox="0 0 32 32"><path d="M7 3h13l6 6v20H7z" fill="#fff" stroke="#3a2a10"/><path d="M20 3v6h6" fill="#ddd" stroke="#3a2a10"/><path d="M10 14h4M10 18h12M10 22h9" stroke="#2a5ad8" stroke-width="1.5"/><path d="M15 12l-3 2 3 2M19 12l3 2-3 2" stroke="#e10600" fill="none"/></svg>',
    folder: '<svg viewBox="0 0 32 32"><path d="M3 8h10l3 3h13v16H3z" fill="#f2d16b" stroke="#7a5a00"/><path d="M3 13h26" stroke="#7a5a00"/><circle cx="21" cy="20" r="4" fill="none" stroke="#3a2a10" stroke-width="1.5"/><path d="M24 23l4 4" stroke="#3a2a10" stroke-width="2"/></svg>',
    dos: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="26" height="20" fill="#000" stroke="#555"/><path d="M6 10h3l-1 2M10 12h5" stroke="#c0c0c0" stroke-width="1.5" fill="none"/><rect x="16" y="11" width="4" height="2" fill="#c0c0c0"/><rect x="9" y="26" width="14" height="3" fill="#808080"/></svg>',
    reg: '<svg viewBox="0 0 32 32"><rect x="6" y="3" width="20" height="26" fill="#9a9a9a" stroke="#333"/><rect x="9" y="6" width="14" height="6" fill="#c8c8c8" stroke="#333"/><rect x="9" y="14" width="14" height="6" fill="#c8c8c8" stroke="#333"/><rect x="9" y="22" width="14" height="5" fill="#c8c8c8" stroke="#333"/><rect x="14" y="8" width="4" height="2" fill="#333"/><rect x="14" y="16" width="4" height="2" fill="#333"/></svg>',
    cal: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="22" fill="#fff" stroke="#333"/><rect x="4" y="6" width="24" height="6" fill="#e10600" stroke="#333"/><path d="M10 3v6M22 3v6" stroke="#333" stroke-width="2"/><path d="M9 17h3M15 17h3M21 17h3M9 22h3M15 22h3" stroke="#333" stroke-width="2"/><path d="M20 20l4 4M24 20l-4 4" stroke="#e10600" stroke-width="2"/></svg>',
    room: '<svg viewBox="0 0 32 32"><path d="M3 29V12l13-8 13 8v17z" fill="#d9a441" stroke="#5a3a1a"/><rect x="7" y="15" width="8" height="7" fill="#9fd0ff" stroke="#333"/><path d="M11 15v7M7 18.5h8" stroke="#333"/><rect x="19" y="18" width="6" height="11" fill="#8a5a2a" stroke="#333"/><circle cx="24" cy="24" r=".8" fill="#ffd400"/></svg>',
    mag: '<svg viewBox="0 0 32 32"><path d="M5 4h20v24H5z" fill="#ffd400" stroke="#333"/><rect x="7" y="6" width="16" height="5" fill="#e10600"/><path d="M8 15h14M8 18h10M8 21h12" stroke="#333"/><path d="M25 6l3 2v20l-3 0" fill="#c99a00" stroke="#333"/></svg>',
    web: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#2a7ad8" stroke="#003"/><path d="M5 12c7-3 15-3 22 0M5 20c7 3 15 3 22 0M16 4c-6 7-6 17 0 24M16 4c6 7 6 17 0 24" stroke="#9fd0ff" fill="none"/><circle cx="16" cy="16" r="14.5" fill="none" stroke="#ffd400" stroke-width="1.5" stroke-dasharray="3 3"/></svg>',
    phone: '<svg viewBox="0 0 32 32"><path d="M5 12c0-5 22-5 22 0v3h-6v-3c0-1-10-1-10 0v3H5z" fill="#e10600" stroke="#333"/><path d="M8 17h16l2 10H6z" fill="#e10600" stroke="#333"/><circle cx="16" cy="22" r="3" fill="#fff" stroke="#333"/></svg>',
    disk: '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" fill="#bfefff" stroke="#333"/><rect x="10" y="4" width="12" height="9" fill="#d8d8e0" stroke="#333"/><rect x="18" y="5.5" width="3" height="6" fill="#333"/><rect x="8" y="16" width="16" height="10" fill="#fff" stroke="#333"/><path d="M10 19h12M10 22h8" stroke="#e10600"/></svg>',
    lock: '<svg viewBox="0 0 40 48" class="sxh-lk"><path class="sxh-shackle" d="M10 22V14a10 10 0 0 1 20 0v8" fill="none" stroke="#7a7a7a" stroke-width="5"/><rect x="4" y="21" width="32" height="24" rx="3" fill="#ffd400" stroke="#7a5a00" stroke-width="2"/><circle cx="20" cy="31" r="3.5" fill="#3a2a10"/><path d="M18.5 32h3l1 7h-5z" fill="#3a2a10"/></svg>',
    seal: n => `<svg viewBox="0 0 40 40" class="sxh-seal"><path d="M20 2l4 4 6-1 1 6 5 3-2 6 2 6-5 3-1 6-6-1-4 4-4-4-6 1-1-6-5-3 2-6-2-6 5-3 1-6 6 1z" fill="#b01a10" stroke="#6a0a05"/><circle cx="20" cy="20" r="10" fill="none" stroke="#e86a5a"/><text x="20" y="25.5" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="${n > 9 ? 12 : 15}" fill="#ffe6c0">${n}</text></svg>`,
    byte: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#ffd400" stroke="#a07000"/><path d="M4 5h2v6H4zM7 5h2v6H7zM10 5h2v2h-2zM10 9h2v2h-2z" fill="#a07000"/></svg>',
    nobyte: '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#e8dcc0" stroke="#b8a888" stroke-dasharray="2 1"/><text x="8" y="12" text-anchor="middle" font-size="10" font-family="Arial" fill="#a89878">?</text></svg>',
  };

  // ================================================================ chapter briefings (the clues; never the keys)
  const BRIEF = {
    1: `Every hunt starts somewhere, and this one starts right here, on Hunt HQ. Loads of hunters have signed my guestbook already, and one of them is very special. Read the <a href="${HQU}/guestbook.html">Hunters' Guestbook</a>. Then remember: on the Web, nothing is ever only what's on the screen.`,
    2: 'I keep all my Hunt stuff on my PC, in a folder: <b>My Documents &gt; Hunt Stuff</b> (double-click My Computer on the desktop). But the key in there is SHY, and shy things hide. Good explorers know how to make shy things show themselves.',
    3: 'Some things on this PC will only talk to you in JACK-DOS. There\'s a folder on C: called <b>HUNT</b>. Open the JACK-DOS Prompt (Start &gt; Programs), go in and have a look round. Real hunters type <tt>DIR</tt>. And when a program puzzles you... ask it.',
    4: 'Behind the scenes, every PC has a giant filing cabinet called <b>the Registry</b>. You are NOT supposed to touch it. (Start &gt; Run, then type <tt>regedit</tt>.) Somewhere in my bit of it, under <b>Software</b>, there is a VAULT. Crack it.',
    5: 'My 1999 diary knows the key! (Start &gt; Programs &gt; Accessories &gt; Office Tools &gt; Calendar.) Find what I wrote on these five days, and take the FIRST letter of each one:<ol><li>The night the clocks steal an hour of sleep.</li><li>The day my homework about the Romans was due.</li><li>The day of the EGGS.</li><li>The day school breaks up for the summer.</li><li>The day the Sun went out at eleven o\'clock in the morning.</li></ol>',
    6: 'Key 6 isn\'t on the computer at all. It\'s in my BEDROOM, on the wall. To see my room, shut the PC down (Start &gt; Shut Down) and, while it\'s off, have a proper look around (drag, or use the arrows). My space poster has a note stuck to it.',
    7: 'My magazine, <b>JACK ATTACK!</b>, is the web site this PC always opens on (click Home). The <b>Cheats</b> page has every cheat I know... and a playground rumour about this very hunt. Rumours are sometimes TRUE.',
    8: `Key 8 is out on the World Wide Web. There's a webring for treasure hunters called <b>The Hunters' Ring</b>. Find it (a search engine will help) and visit all four member sites. Every one of them hides a PIECE of the key, in a different way. Put the pieces together in ring order.`,
    9: 'Hunt HQ has its very own phone line! The number spells <b>HUNTERS</b> on a telephone keypad. Ring it with the Phone Dialer (Start &gt; Programs &gt; Accessories &gt; Communications) and listen very carefully. Pilots would understand it straight away.',
    10: 'You\'ve got nine keys, and every key gave you a LUCKY LETTER (they\'re on the board, in the boxes at the top). Read them in order, one to nine. Then the last key is easy: it\'s what every single person on the planet will be doing in the last ten seconds of 31 December 1999.',
  };

  // ================================================================ styles
  if (!document.getElementById('sxHuntCss')) {
    const s = document.createElement('style'); s.id = 'sxHuntCss';
    s.textContent = `
.sxh{min-height:100%;background-color:#0b1a3a;background-image:radial-gradient(circle at 20% 30%,rgba(255,255,255,.7) 0 1px,transparent 1.5px),radial-gradient(circle at 70% 60%,rgba(255,240,180,.8) 0 1px,transparent 1.5px),radial-gradient(circle at 40% 80%,rgba(255,255,255,.5) 0 1px,transparent 1.5px);background-size:97px 89px,131px 113px,61px 71px;color:#3a2a10;padding:14px 10px 30px;font:15px/1.5 Georgia,"Times New Roman",serif}
.sxh-in{max-width:780px;margin:0 auto}
.sxh-top{text-align:center;margin:4px 0 10px}
.sxh-logo{font:44px/0.95 Bangers,Impact,"Arial Black",sans-serif;letter-spacing:2px;color:#ffd400;text-shadow:3px 3px 0 #b01a10,-1px -1px 0 #7a1a0a,0 0 18px rgba(255,212,0,.35);transform:rotate(-2deg)}
.sxh-logo span{font-size:60px;color:#ffe680}
.sxh-sub{color:#cfe0ff;font:italic 14px Georgia,serif;margin-top:8px}
.sxh-nav{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:0 0 12px}
.sxh-nav a{font:bold 12px Arial,sans-serif;color:#fff!important;text-decoration:none;padding:5px 10px;background:linear-gradient(#2a5ad8,#0a2a7a);border:2px outset #6a9aff;min-height:20px;display:inline-flex;align-items:center}
.sxh-nav a.on,.sxh-nav a:hover{background:linear-gradient(#e8a000,#a05a00);border-color:#ffd400}
.sxh-paper{position:relative;background:#f3e2b3;background-image:radial-gradient(ellipse at center,transparent 60%,rgba(140,90,20,.28) 100%),repeating-linear-gradient(0deg,transparent 0 23px,rgba(140,100,40,.06) 23px 24px);border:1px solid #8a6a2a;box-shadow:0 0 0 4px #c8a860,0 0 0 5px #6a4a1a,4px 6px 0 5px rgba(0,0,0,.4);padding:18px 20px 22px;border-radius:2px}
.sxh-paper h1,.sxh-paper h2{font:30px/1.05 Bangers,Impact,sans-serif;letter-spacing:1px;color:#b01a10;margin:4px 0 10px;font-weight:normal}
.sxh-paper h2{font-size:24px;color:#7a1a0a}
.sxh-paper a{color:#0a3aa8}
.sxh-paper tt,.sxh-paper code{font:13px "Courier New",monospace;background:rgba(255,255,255,.55);padding:0 3px}
.sxh-letter{font-style:italic}
.sxh-sig{font:22px "Comic Sans MS","Chalkboard SE",cursive;color:#0a3aa8;transform:rotate(-3deg);display:inline-block}
.sxh-stat{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;background:rgba(255,255,255,.45);border:1px dashed #8a6a2a;padding:8px 10px;margin:10px 0;font:13px Arial,sans-serif}
.sxh-stat b{font-size:15px}
.sxh-bar{flex:1 1 160px;height:14px;border:2px inset #c8a860;background:#fff8e0;position:relative;min-width:120px}
.sxh-bar i{position:absolute;left:0;top:0;bottom:0;background:repeating-linear-gradient(90deg,#e8a000 0 8px,#ffd400 8px 10px)}
.sxh-note{font:12px Arial,sans-serif;color:#6a4a1a;background:#fff3c0;border:1px solid #d8b860;padding:6px 8px;margin:8px 0}
.sxh-slots{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin:12px 0 4px}
.sxh-slots span{width:30px;height:38px;display:flex;align-items:center;justify-content:center;font:bold 24px Georgia,serif;background:#fff8e0;border:2px solid #6a4a1a;box-shadow:2px 2px 0 rgba(0,0,0,.25);color:#b01a10}
.sxh-slots span.no{color:#c8b890;font-size:16px}
.sxh-slots small{display:block;width:100%;text-align:center;font:11px Arial,sans-serif;color:#6a4a1a}
.sxh-board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}
.sxh-card{position:relative;text-align:center;background:#fff8e0;border:1px solid #8a6a2a;box-shadow:2px 3px 0 rgba(0,0,0,.25);padding:20px 4px 6px;font:12px/1.2 Arial,sans-serif;color:#3a2a10;cursor:pointer;min-height:86px;display:flex;flex-direction:column;align-items:center;gap:3px}
.sxh-card .sxh-seal{position:absolute;top:-12px;left:50%;width:34px;height:34px;margin-left:-17px}
.sxh-card b{font:bold 13px Georgia,serif}
.sxh-card .w{color:#7a5a2a;font-size:11px}
.sxh-card.lock{opacity:.55;cursor:not-allowed;background:#e8dcc0}
.sxh-card.lock .sxh-seal{filter:grayscale(1)}
.sxh-card.cur{box-shadow:0 0 0 2px #ffd400,0 0 12px 2px rgba(255,190,0,.8);animation:sxhglow 1.6s ease-in-out infinite}
.sxh-card.sel{outline:2px dashed #b01a10;outline-offset:2px}
.sxh-card.ok{background:#e6f4d0}
.sxh-card .lt{font:bold 18px Georgia,serif;color:#b01a10}
@keyframes sxhglow{50%{box-shadow:0 0 0 2px #ffd400,0 0 2px 0 rgba(255,190,0,.2)}}
.sxh-ch{background:rgba(255,255,255,.5);border:2px solid #6a4a1a;padding:12px 14px;margin:12px 0}
.sxh-ch h2{margin:0 0 4px}
.sxh-ch .sxh-wh{font:12px Arial,sans-serif;color:#7a5a2a;margin:0 0 8px}
.sxh-lock{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px dashed #8a6a2a}
.sxh-lk{width:40px;height:48px;flex:none}
.sxh-lk .sxh-shackle{transition:transform .4s}
.sxh-lock.open .sxh-shackle{transform:translate(0,-6px) rotate(-18deg);transform-origin:30px 22px}
.sxh-lock input{font:bold 18px "Courier New",monospace;text-transform:uppercase;padding:6px 8px;border:2px inset #c8a860;background:#fffdf0;min-width:0;flex:1 1 150px;max-width:260px;letter-spacing:2px}
.sxh-lock button,.sxh-btn{font:bold 13px Arial,sans-serif;padding:7px 14px;background:linear-gradient(#ffe680,#e8a000);border:2px outset #ffd400;color:#3a2a10;cursor:pointer;min-height:34px}
.sxh-lock button:active,.sxh-btn:active{border-style:inset}
.sxh-msg{flex-basis:100%;font:bold 13px Arial,sans-serif;min-height:18px}
.sxh-msg.bad{color:#b01a10}.sxh-msg.good{color:#1a7a1a}
.sxh-lock.shake{animation:sxhshake .08s linear 5}
@keyframes sxhshake{50%{transform:translateX(5px)}}
.sxh-solved{font:bold 15px Arial,sans-serif;color:#1a6a1a;margin-top:10px}
.sxh-solved .k{font:bold 20px "Courier New",monospace;letter-spacing:3px;background:#fff;border:1px solid #1a6a1a;padding:0 6px;color:#000}
.sxh-pad{display:flex;gap:4px;align-items:center;justify-content:center;flex-wrap:wrap;margin:16px 0 0;font:11px Arial,sans-serif;color:#cfe0ff}
.sxh-pad button{width:34px;height:34px;font:bold 14px Arial,sans-serif;background:#333;color:#ffd400;border:2px outset #666;border-radius:50%;cursor:pointer;padding:0}
.sxh-pad button.sq{border-radius:4px;background:#5a1a1a;color:#fff}
.sxh-cheat{text-align:center;background:#000;color:#3f3;font:bold 15px/1.5 "Courier New",monospace;padding:12px;border:3px double #3f3;margin:12px 0;animation:sxhflash .3s steps(2) 6}
@keyframes sxhflash{50%{background:#030;color:#ff0}}
.sxh-foot{color:#9ab4e0;text-align:center;font:11px Arial,sans-serif;margin-top:16px}
.sxh-foot .ctr{display:inline-block;background:#000;color:#3f3;font:bold 13px "Courier New",monospace;padding:1px 6px;border:2px inset #666;letter-spacing:2px}
.sxh-gb{border-top:1px dashed #8a6a2a;padding:8px 0}
.sxh-gb .h{font:bold 12px Arial,sans-serif;color:#7a1a0a}.sxh-gb .h small{color:#8a6a3a;font-weight:normal}
.sxh-gb p{margin:2px 0 0;font-size:14px}
.sxh-gbf{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 12px}
.sxh-gbf textarea{flex:1 1 240px;min-height:44px;font:13px Arial,sans-serif;border:2px inset #c8a860;background:#fffdf0}
.sxh-bytes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}
.sxh-byte{display:flex;gap:8px;align-items:flex-start;background:rgba(255,255,255,.5);border:1px solid #c8a860;padding:8px;font:13px Arial,sans-serif}
.sxh-byte svg{width:28px;height:28px;flex:none}
.sxh-byte.got{background:#fff3b0;border-color:#e8a000}
.sxh-byte .c{font:bold 12px "Courier New",monospace;color:#a07000}
.sxh-ad{border:4px double #b01a10;background:#fff;padding:14px;text-align:center;margin:10px 0;font:14px Arial,sans-serif}
.sxh-ad .num{font:44px/1 Bangers,Impact,sans-serif;color:#b01a10;letter-spacing:2px;margin:6px 0}
.sxh-ad .small{font-size:10px;color:#555}
.sxh-hall{width:100%;border-collapse:collapse;font:13px Arial,sans-serif;background:rgba(255,255,255,.5)}
.sxh-hall th,.sxh-hall td{border:1px solid #c8a860;padding:4px 6px;text-align:left}
.sxh-hall th{background:#6a4a1a;color:#ffe6c0}
.sxh-hall .ch{color:#b01a10;font-weight:bold}
.sxh-pre{font:13px/1.45 "Courier New",monospace;white-space:pre-wrap;background:#fff;color:#000;padding:14px;margin:0;min-height:300px}
.sxh-gold{display:block;margin:20px auto;width:120px;height:120px;border:0;background:radial-gradient(circle,#fff6b0 0,#ffd400 40%,#c99a00 70%,transparent 72%);cursor:pointer;animation:sxhglow 1.4s infinite;border-radius:50%}
.sxh-disk{display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap;margin:14px 0}
.sxh-disk svg{width:160px;height:160px;filter:drop-shadow(4px 6px 0 rgba(0,0,0,.35));animation:sxhspin 6s ease-in-out infinite}
@keyframes sxhspin{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg) translateY(-6px)}}
.sxh-dir{font:13px "Courier New",monospace;background:#000;color:#c0c0c0;padding:10px;min-width:0;flex:1 1 260px;white-space:pre}
.sxh-dir button{font:inherit;background:none;border:0;color:#ff5;cursor:pointer;text-decoration:underline;padding:0}
.sxh-champ{text-align:center;font:34px Bangers,Impact,sans-serif;color:#b01a10;border:6px double #b01a10;transform:rotate(-4deg);padding:4px 10px;margin:10px auto;max-width:360px;letter-spacing:2px;background:rgba(255,255,255,.4)}
@media (max-width:620px){.sxh{padding:8px 4px 20px;font-size:14px}.sxh-logo{font-size:30px}.sxh-logo span{font-size:42px}.sxh-paper{padding:12px 10px 16px}.sxh-board{grid-template-columns:repeat(2,minmax(0,1fr))}.sxh-bytes{grid-template-columns:1fr}.sxh-slots span{width:26px;height:32px;font-size:20px}}
/* the Hunters' Ring */
.sxr{min-height:100%;padding:14px 12px 24px;font:14px/1.5 Arial,sans-serif}
.sxr-in{max-width:720px;margin:0 auto}
.sxr-nav{margin:22px auto 6px;max-width:520px;border:3px ridge #c8a860;background:#3a2a10;color:#ffe6c0;padding:8px;text-align:center;font:bold 12px Arial,sans-serif}
.sxr-nav .r{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-top:6px}
.sxr-nav a{color:#3a2a10!important;background:#ffd400;border:2px outset #ffe680;padding:4px 8px;text-decoration:none;min-height:20px;display:inline-flex;align-items:center}
.sxr-nav .lg{font:20px Bangers,Impact,sans-serif;letter-spacing:1px;color:#ffd400;font-weight:normal}
.sxr-hub{background:#f3e2b3;color:#3a2a10}
.sxr-hub h1{font:40px Bangers,Impact,sans-serif;color:#b01a10;text-align:center;margin:6px 0;font-weight:normal;letter-spacing:2px}
.sxr-list{display:grid;gap:10px;margin:14px 0}
.sxr-mem{display:flex;gap:12px;align-items:center;background:#fff8e0;border:1px solid #8a6a2a;padding:10px;box-shadow:2px 2px 0 rgba(0,0,0,.2)}
.sxr-mem .no{font:32px Bangers,Impact,sans-serif;color:#b01a10;width:34px;text-align:center;flex:none}
.sxr-mem .vis{font-size:11px;color:#1a7a1a;font-weight:bold}
.sxr-ffc{background:#fff;color:#000;font-family:"Times New Roman",serif}
.sxr-ffc h1{font:bold 34px Arial Black,Arial,sans-serif;color:#003080;text-align:center;margin:4px 0;text-shadow:2px 2px 0 #9fd0ff}
.sxr-ffc .fl{display:inline-block;width:60px;height:60px;vertical-align:middle}
.sxr-ffc table{border-collapse:collapse;margin:8px 0;width:100%}.sxr-ffc td,.sxr-ffc th{border:1px solid #003080;padding:4px 6px;font-size:13px}
.sxr-white{color:#fff;background:#fff;user-select:text;font-size:12px}
.sxr-white::selection{color:#fff;background:#003080}
.sxr-mm{background:#001a00;color:#3f3;font:14px/1.5 "Courier New",monospace}
.sxr-mm h1{font:bold 30px "Courier New",monospace;text-align:center;color:#6f6;text-shadow:0 0 6px #3f3;margin:6px 0}
.sxr-mm a{color:#ff3}
.sxr-mm .tl{border-left:3px solid #3f3;margin:10px 0 10px 8px;padding-left:12px}
.sxr-mm .tl p{margin:0 0 8px}
.sxr-mm .ctr{display:inline-block;background:#000;border:2px inset #3f3;padding:2px 6px;font:bold 18px "Courier New",monospace;letter-spacing:4px;color:#f33}
.sxr-mm .sxh-btn{background:#030;color:#3f3;border-color:#3f3}
.sxr-sv{background-color:#000;background-image:radial-gradient(circle at 10% 20%,#fff 0 1px,transparent 1.5px),radial-gradient(circle at 60% 70%,#9fd0ff 0 1px,transparent 1.5px),radial-gradient(circle at 30% 50%,#fff 0 .7px,transparent 1.2px);background-size:53px 47px,89px 61px,31px 37px;color:#dde;font:14px/1.5 Verdana,Arial,sans-serif;position:relative;overflow:hidden}
.sxr-sv h1{font:bold 32px Verdana,Arial,sans-serif;text-align:center;color:#fff;letter-spacing:3px;margin:6px 0;text-shadow:0 0 10px #6af}
.sxr-sv a{color:#9fd0ff}
.sxr-sv .hof{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:12px 0}
.sxr-sv .hof div{border:1px solid #446;background:rgba(20,20,60,.7);padding:8px}
.sxr-sv .hof b{color:#ffd400}
.sxr-sv .tiny{position:absolute;width:5px;height:5px;padding:0;border:0;background:#ffd400;border-radius:50%;box-shadow:0 0 4px 1px #ffd400;cursor:pointer;min-height:0}
.sxr-sv .tiny.sx-got{background:#555;box-shadow:none}
.sxr-sv .sxh-gb{border-color:#446}.sxr-sv .sxh-gb .h{color:#9fd0ff}.sxr-sv .sxh-gb .h small{color:#889}.sxr-sv textarea{background:#112;color:#fff;border-color:#446}
.sxr-cd{background:linear-gradient(135deg,#ffe0f0,#e0f0ff 30%,#e0ffe0 55%,#fff8d0 80%,#ffe0f0);color:#222;font:14px/1.5 "Trebuchet MS",Arial,sans-serif}
.sxr-cd h1{font:bold 36px "Trebuchet MS",Arial,sans-serif;text-align:center;margin:6px 0;background:linear-gradient(90deg,#e10600,#ff8c00,#ffd400,#3c3,#2a7ad8,#a040c0);-webkit-background-clip:text;background-clip:text;color:transparent}
.sxr-cd .disc{display:block;margin:6px auto;width:120px;height:120px;border-radius:50%;background:conic-gradient(#ccc,#fff,#9fd0ff,#ffb0e0,#fff8a0,#b0ffb0,#ccc);border:1px solid #888;position:relative;animation:sxrspin 4s linear infinite}
.sxr-cd .disc::after{content:"";position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px;border-radius:50%;background:#fff;border:1px solid #888}
@keyframes sxrspin{to{transform:rotate(360deg)}}
@media (max-width:620px){.sxr{padding:8px 4px 16px}.sxr-hub h1{font-size:30px}.sxr-ffc h1,.sxr-cd h1,.sxr-sv h1{font-size:24px}.sxr-mm h1{font-size:22px}}
/* the Hunter's Kit + the phone */
.sxk{display:flex;flex-direction:column;height:100%;min-height:0}
.sxk .tabpage{flex:1;overflow:auto;min-height:0}
.sxk-log{font:12px var(--ui,Tahoma,sans-serif)}
.sxk-log table{width:100%;border-collapse:collapse}.sxk-log td{padding:2px 4px;border-bottom:1px solid #ddd;vertical-align:top}
.sxk-log .ok{color:#007000;font-weight:bold}.sxk-log .no{color:#808080}
.sxk-dec textarea,.sxk-notes textarea{width:100%;box-sizing:border-box;font:13px "Courier New",monospace;min-height:70px}
.sxk-dec .btns{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}
.sxk-dec .ref{font:11px "Courier New",monospace;white-space:pre-wrap;background:#fff;border:1px solid #808080;padding:4px;margin-top:6px;max-height:120px;overflow:auto}
.sxc-talk{height:150px;overflow:auto;background:#fff;border:2px inset #fff;padding:6px;font:12px Tahoma,sans-serif}
.sxc-talk p{margin:0 0 5px}.sxc-talk p.me{color:#000080}.sxc-talk p.sys{color:#808080;font-style:italic}
.sxc-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:6px 0}
.sxc-pad button{min-height:32px;font:bold 14px Tahoma,sans-serif}
`;
    document.head.appendChild(s);
  }

  // ================================================================ shared bits
  const NAV = [['/', 'HQ'], ['/guestbook.html', 'Guestbook'], ['/rules.html', 'Rules'], ['/bytes.html', 'Golden Bytes'], ['/hintline.html', 'Hint Line'], ['/hall.html', 'Hall of Champions'], ['/kit.html', 'Hunter\'s Kit']];
  function counter(el, k, sel, fmt) {
    if (!window.Net || !Net.kv) return;
    const show = v => { const c = el.querySelector(sel); if (c && typeof v === 'number') c.textContent = fmt ? fmt(v) : String(v).padStart(6, '0'); };
    try { Net.kv.inc(k); Net.kv.get([k]).then(v => show(v[k])); } catch (e) {}
  }
  function hqShell(cur, body, foot) {
    return `<div class="sxh"><div class="sxh-in"><!-- Hunt HQ. Made in Notepad by Jack. No answers in here, Dave. I checked. -->
<header class="sxh-top"><div class="sxh-logo">THE GREAT<br><span>JACKNET HUNT</span></div><div class="sxh-sub">Ten keys &middot; Ten Golden Bytes &middot; One Millennium Disk</div></header>
<nav class="sxh-nav">${NAV.map(([p, n]) => `<a href="${HQU}${p === '/' ? '/' : p}" class="${p === cur ? 'on' : ''}">${n}</a>`).join('')}</nav>
<main class="sxh-paper">${body}</main>
${foot || ''}
<footer class="sxh-foot">You are hunter number <span class="ctr sxh-ctr">------</span> &middot; Best viewed in JackNet Explorer at 800x600 &middot; Hunt HQ is not responsible for lost sleep, lost homework or lost Daves.<br>Stuck? Ring the Hint Line: <b>0909 879 0486</b> (calls cost 50p a minute: ask the bill payer's permission)</footer></div></div>`;
  }
  function wireShell(el) { counter(el, 'web.hits.sx.hq', '.sxh-ctr'); }

  // ================================================================ HQ: the front page (the board, the slots, the Lock)
  let selCh = 0;
  function home(el) {
    el._sxBusy = 0;
    const st = X.st, C = CAT(), nk = X.nKeys(), nb = X.nBytes();
    const firstOpen = (() => { for (let i = 1; i <= 10; i++) if (!st.ch[i]) return i; return 10; })();
    if (!selCh || !X.avail(selCh)) selCh = firstOpen;
    const done = !!st.ch[10];
    const letter = nk ? '' : `<p class="sxh-letter">Dear hunter,</p><p class="sxh-letter">Somewhere on the JackNet I have hidden <b>THE MILLENNIUM DISK</b>: one 3.5 inch floppy with the very last file of 1999 on it. To dig it up you need TEN KEYS. Every key is a word, and every key is hidden somewhere different: on the Web, on my hard drive, in JACK-DOS, in the Registry, in my diary, in my bedroom, in my magazine, on the phone...</p><p class="sxh-letter">Each chapter tells you where to start. When you find a key, type it into the Lock. Keys open in order, one to ten. Stuck? Ring the Hint Line. There are also ten <a href="${HQU}/bytes.html">Golden Bytes</a> hidden around the place, for proper show-offs.</p><p class="sxh-letter">Good luck. You'll need it. <span class="sxh-sig">Jack</span></p>`;
    const mem = isMember();
    const note = mem ? '' : `<div class="sxh-note"><b>Hunting as a guest:</b> your keys are kept on this PC only, and the prizes (Rupees, a Hunt badge and the Millennium Disk) are for JackNet members. Joining is free: Start &gt; Log Off, then pick a name and a password. Everything you've found comes with you.</div>`;
    const slots = `<div class="sxh-slots" aria-label="Lucky letters">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => st.lt[n] ? `<span title="Key ${n}">${esc(st.lt[n])}</span>` : `<span class="no" title="Key ${n}: not found yet">${n}</span>`).join('')}<small>your lucky letters, keys 1 to 9</small></div>`;
    const board = `<div class="sxh-board">${C.CH.map(c => {
      const ok = !!st.ch[c.n], av = X.avail(c.n), cur = av && !ok;
      return `<button type="button" class="sxh-card${ok ? ' ok' : av ? ' cur' : ' lock'}${c.n === selCh ? ' sel' : ''}" data-ch="${c.n}" aria-label="Chapter ${c.n}: ${esc(c.t)}${ok ? ' (solved)' : av ? '' : ' (locked)'}">${ICO.seal(c.n)}<b>${esc(c.t)}</b><span class="w">${esc(c.w)}</span>${ok ? (st.lt[c.n] ? `<span class="lt">${esc(st.lt[c.n])}</span>` : '<span class="lt">&#10003;</span>') : cur ? '<span class="w"><b>OPEN NOW</b></span>' : '<span class="w">locked</span>'}</button>`;
    }).join('')}</div>`;
    const banner = done ? `<div class="sxh-cheat" style="animation:none">*** YOU FOUND ALL TEN KEYS! *** <a href="${HQU}/disk.html" style="color:#ff0">Open the Millennium Disk &raquo;</a></div>` : '';
    el.innerHTML = hqShell('/', `${letter}${banner}<div class="sxh-stat"><span>Keys: <b>${nk}</b> of 10</span><span>Golden Bytes: <b>${nb}</b> of 10</span><span class="sxh-bar" aria-label="${pct()} per cent complete"><i style="width:${pct()}%"></i></span><b>${pct()}%</b></div>${note}${slots}<h2>The Board</h2>${board}<div class="sxh-chbox"></div>`,
      `<div class="sxh-pad" aria-label="Hunt HQ joypad"><span>HQ JOYPAD (for hunters without a keyboard):</span><button type="button" data-k="ArrowUp" aria-label="Up">&#9650;</button><button type="button" data-k="ArrowDown" aria-label="Down">&#9660;</button><button type="button" data-k="ArrowLeft" aria-label="Left">&#9664;</button><button type="button" data-k="ArrowRight" aria-label="Right">&#9654;</button><button type="button" class="sq" data-k="b">B</button><button type="button" class="sq" data-k="a">A</button></div>`);
    wireShell(el);
    el.querySelectorAll('.sxh-card').forEach(b => b.addEventListener('click', () => {
      const n = +b.dataset.ch;
      if (!X.avail(n)) { sfx('uhoh'); return chBox(el, n, true); }
      selCh = n; el.querySelectorAll('.sxh-card').forEach(x => x.classList.toggle('sel', x === b)); sfx('click'); chBox(el, n);
    }));
    chBox(el, selCh);
    // the most famous cheat in the world (chapter 7)
    const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let pos = 0;
    const press = k => {
      k = k.length === 1 ? k.toLowerCase() : k;
      pos = k === SEQ[pos] ? pos + 1 : (k === SEQ[0] ? (pos >= 2 && SEQ[pos] === 'ArrowDown' ? pos : 1) : 0);
      if (pos === SEQ.length) { pos = 0; cheat(el); }
    };
    if (el._sxKd) document.removeEventListener('keydown', el._sxKd);
    const kd = el._sxKd = ev => { if (!live(el) || el._sxPage !== '/') return document.removeEventListener('keydown', kd); if (ev.target.closest && ev.target.closest('input,textarea,.appwin')) return; if (SEQ.includes(ev.key.length === 1 ? ev.key.toLowerCase() : ev.key)) press(ev.key); };
    document.addEventListener('keydown', kd);
    el.querySelectorAll('.sxh-pad button').forEach(b => b.addEventListener('click', () => { sfx('click'); press(b.dataset.k); }));
  }
  function cheat(el) {
    secret('sx.h.konami'); sfx('solve');
    const box = el.querySelector('.sxh-chbox'); if (!box) return;
    const d = document.createElement('div'); d.className = 'sxh-cheat';
    d.innerHTML = 'CHEAT ACTIVATED!!! +30 LIVES<br>(Hunt HQ doesn\'t have lives. Sorry.)<br><br>HUNTERS ON CHAPTER 7, LISTEN UP:<br>This code first appeared in a game called Gradius,<br>on the NES, in 1986. The Japanese company that made<br>that game is YOUR SEVENTH KEY.';
    box.prepend(d); d.scrollIntoView({ block: 'nearest' });
  }
  function chBox(el, n, locked) {
    const box = el.querySelector('.sxh-chbox'); if (!box) return;
    const C = CAT(), c = C.CH[n - 1], st = X.st; if (!c) return;
    if (locked) { box.innerHTML = `<div class="sxh-ch"><h2>Chapter ${n}: ${esc(c.t)}</h2><p>This chapter is still locked. Find key ${n - 1} first. (Keys open in order. It's the rules. I made the rules.)</p></div>`; return; }
    const ok = !!st.ch[n];
    const word = typeof st.ch[n] === 'string' ? st.ch[n] : '';
    box.innerHTML = `<div class="sxh-ch"><h2>Chapter ${n}: ${esc(c.t)}</h2><p class="sxh-wh">Where: ${esc(c.w)}</p><div>${BRIEF[n]}</div>
      ${ok ? `<p class="sxh-solved">SOLVED! ${word ? `The key was <span class="k">${esc(word)}</span>.` : ''} ${st.lt[n] ? `Lucky letter: <span class="k">${esc(st.lt[n])}</span>` : ''}${n === 10 ? ` <a href="${HQU}/disk.html">Open the Millennium Disk &raquo;</a>` : ''}</p>`
      : `<form class="sxh-lock" autocomplete="off">${ICO.lock}<input type="text" maxlength="30" aria-label="Key ${n}" placeholder="KEY ${n}" spellcheck="false" autocapitalize="characters"><button type="submit">Turn the key</button><div class="sxh-msg" aria-live="polite"></div></form>
      <p style="font:12px Arial,sans-serif;margin:8px 0 0">Stuck? <a href="${HQU}/hintline.html">Ring the Hint Line</a>.</p>`}</div>`;
    const f = box.querySelector('form'); if (!f) return;
    const inp = f.querySelector('input'), msg = f.querySelector('.sxh-msg');
    f.addEventListener('submit', ev => {
      ev.preventDefault();
      const w = inp.value.trim(); if (!w) { inp.focus(); return; }
      msg.className = 'sxh-msg'; msg.textContent = 'Turning the key...';
      el._sxBusy = 1;
      X.tryKey(n, w).then(r => {
        if (!live(el)) return;
        if (!r.ok) el._sxBusy = 0;
        if (r.err) { msg.className = 'sxh-msg bad'; msg.textContent = 'Hunt HQ can\'t reach its server (is the modem connected?). Try again in a minute.'; return; }
        if (r.ok) {
          f.classList.add('open'); sfx('solve');
          msg.className = 'sxh-msg good';
          msg.textContent = `IT FITS! Key ${n} is yours.` + (r.lt ? ` Your lucky letter is ${r.lt} (the ${nth(r.at)} letter).` : '') + (r.mem ? ` +${RP(CAT().PAY.key || 25)}!` : '');
          setTimeout(() => { if (live(el)) { selCh = Math.min(10, n + 1); home(el); if (n === 10) X.go(HQU + '/disk.html'); } }, 2600);
          return;
        }
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); sfx('uhoh');
        msg.className = 'sxh-msg bad';
        msg.textContent = r.slow ? 'Woah, slow down! The lock is getting hot. Wait a few seconds.' : r.locked ? `Find key ${n - 1} first: the locks open in order.` : r.near === 'other' ? 'Ooh! That IS one of the ten keys... but not for THIS lock.' : r.near === 'rev' ? 'So close it hurts. Try it the other way round!' : r.near === 'close' ? 'Nearly! Check your spelling.' : 'That key doesn\'t fit. (Keys are ordinary words. Capitals and spaces don\'t matter.)';
      });
    });
  }
  // the server's view arrived (a log-on, another tab): redraw the front page, unless someone's typing in the Lock
  X.on('me', () => { const el = document.querySelector('.sxh-board'); const root = el && el.closest('.sxh-root'); if (root && live(root) && root._sxPage === '/' && !root.contains(document.activeElement) && !root._sxBusy) home(root); });

  // ================================================================ HQ: the other pages
  const GB_SEED = [
    ['The Hunt Master', '01/01/99', 'Welcome, hunters! Here is my tip for chapter one. Nothing on this page is quite what it seems. If you want a key, you have to look UNDER THE BONNET. (Of this page. Not your Dad\'s car.)', 1],
    ['Callum', '02/01/99', 'Done chapter 1 in about a minute. PC gamers are just better at this. Sorry Luke.'],
    ['Luke', '02/01/99', 'Callum only did it fast because I told him where to look. ULTRA 64 4 LIFE.'],
    ['Dave', '03/01/99', 'Is the answer GUBBINZ? It\'s always Gubbinz.'],
    ['JackK', '04/01/99', 'Not that Jack. The other Jack. Hi other Jack! I mean, hi Jack! Great hunt. Chapter 4 made my brain hurt.'],
    ['Pixelpete', '09/01/99', 'Took me ages to work out the shy files one. Top tip: Explorer can do more than you think.'],
    ['Mrs Higgins (Callum\'s Mom)', '15/01/99', 'Callum, it is a school night. Come and have your tea.'],
  ];
  function guestbook(el) {
    const body = `<h1>The Hunters' Guestbook</h1><p>Sign in, hunter! Say hello, swap moans, but <b>NO SPOILERS</b>, or the Hunt Master will come round and confiscate your mouse ball.</p>
      <form class="sxh-gbf" autocomplete="off"><textarea maxlength="200" aria-label="Your message" placeholder="Write something nice (no spoilers!)"></textarea><button class="sxh-btn" type="submit">Sign it!</button></form><div class="sxh-gbl"></div>
      <!-- Well done, hunter! You looked UNDER THE BONNET. KEY ONE is the name of what you are reading right now: the hidden page that lives underneath every web page, the one you only see with View > Source. Six letters. It starts with S and ends with E. Type it into the Lock on the front page. - The Hunt Master -->`;
    el.innerHTML = hqShell('/guestbook.html', body); wireShell(el);
    liveGb(el, 'web.gb.sx.hq', GB_SEED);
  }
  function liveGb(el, k, seed) {
    const list = el.querySelector('.sxh-gbl'), f = el.querySelector('.sxh-gbf');
    const ent = (by, date, text, special) => `<div class="sxh-gb"><div class="h">${esc(by)}${special ? ' &#9733;' : ''} <small>${esc(date)}</small></div><p>${esc(text)}</p></div>`;
    const seedH = seed.map(s => ent(s[0], s[1], s[2], s[3])).join('');
    const draw = arr => { if (live(el)) list.innerHTML = (Array.isArray(arr) ? arr.slice().reverse().map(e => ent(e.by + (e.member ? ' *' : ''), d99(e.ts), e.text)).join('') : '') + seedH; };
    draw([]);
    if (window.Net && Net.kv) { Net.kv.get([k]).then(v => draw(v[k])); const off = Net.kv.watch(k, () => { if (!live(el)) return off(); Net.kv.get([k]).then(v => draw(v[k])); }); }
    if (f) f.addEventListener('submit', ev => {
      ev.preventDefault(); const t = f.querySelector('textarea'), msg = t.value.trim(); if (!msg) return;
      if (!(window.Net && Net.kv && Net.kv.push(k, msg))) { Desk.toast('Guestbook', 'Not connected to JackNet. Try again in a minute!'); return; }
      t.value = ''; sfx('button'); Desk.toast('Guestbook', 'Signed! Thanks, hunter.');
    });
  }
  function rules(el) {
    el.innerHTML = hqShell('/rules.html', `<h1>The Rules of the Hunt</h1><ol>
      <li><b>There are ten chapters.</b> Each one ends in a KEY. A key is always an ordinary word (capitals and spaces don't matter).</li>
      <li><b>Keys open in order.</b> You can't do chapter 5 until you've found key 4. Every chapter tells you where to start looking.</li>
      <li><b>Every key gives you a lucky letter.</b> You'll need all nine for the last chapter. Don't lose them. (You can't lose them, they're on the board. But still.)</li>
      <li><b>There are ten Golden Bytes too.</b> They're not needed to finish, but you need every single one for 100%, and only 100% gets you the Millennium Disk.</li>
      <li><b>Stuck?</b> Ring the <a href="${HQU}/hintline.html">Hint Line</a>. The first hint for every chapter is free. Later hints open by themselves after a while, or JackNet members can pay a few Rupees to hear one straight away.</li>
      <li><b>No spoilers.</b> Don't put the keys in the guestbook. Don't tell Dave. Don't tell anyone. Especially Dave.</li>
      <li><b>Prizes</b> (for JackNet members): ${RP(CAT().PAY.key || 25)} for every key, ${RP(CAT().PAY.byte || 10)} for every Golden Byte, ${RP(CAT().PAY.done || 250)} and the <b>Great Hunt Finisher</b> badge for all ten keys, and for 100%: ${RP(CAT().PAY.full || 400)}, the <b>Great Hunt Champion</b> badge and <b>THE MILLENNIUM DISK</b> itself (numbered, only 999 will ever exist). Plus your name in the <a href="${HQU}/hall.html">Hall of Champions</a>, for ever.</li>
      <li><b>Everything is checked by Hunt HQ's server.</b> The answers are not in the page source. (Dave has looked. Twice.)</li></ol>
      <h2>Hunter's tips</h2><ul><li>Read everything. Twice.</li><li>Download the <a href="${HQU}/kit.html">Hunter's Kit</a>: it has a decoder for backwards writing, Morse code, phone keypads and the pilots' alphabet.</li><li>Look under things. Look behind things. Look in the source.</li><li>If a program puzzles you, ask it. Most DOS programs explain themselves if you type /? after their name.</li></ul>`);
    wireShell(el);
  }
  function bytes(el) {
    const C = CAT(), st = X.st, n = X.nBytes();
    el.innerHTML = hqShell('/bytes.html', `<h1>The Golden Bytes</h1><p>I made ten little golden bytes and hid them all over the place. You don't need them to finish the Hunt, but you need EVERY one for 100%. Find one and it's added to your logbook straight away. (You have found <b>${n}</b> of 10.)</p>
      <div class="sxh-bytes">${C.BYTES.map((b, i) => { const got = !!st.by[b.id]; return `<div class="sxh-byte${got ? ' got' : ''}">${got ? ICO.byte : ICO.nobyte}<div><b>${i + 1}. ${got ? esc(b.n) : '???'}</b><br>${esc(b.h)}${got ? `<br><span class="c">Found ${d99(st.by[b.id])} &middot; byte code ${esc(X.BCODE[b.id])}</span>` : ''}</div></div>`; }).join('')}</div>
      ${n >= 10 ? '<div class="sxh-champ">ALL TEN BYTES!</div>' : ''}`);
    wireShell(el);
  }
  function hintline(el) {
    const st = X.st, C = CAT(), heard = Object.keys(st.hs).sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b));
    el.innerHTML = hqShell('/hintline.html', `<h1>The Hunt Hint Line</h1>
      <div class="sxh-ad"><b>STUCK ON THE GREAT JACKNET HUNT?</b><br>Ring the official Hunt Hint Line!<div class="num">0909 879 0486</div>Three hints for every chapter. Hint 1 is always free. Hints 2 and 3 open by themselves after a while (10 and 30 minutes after you reach the chapter), or members can hear them straight away for ${RP(C.HINT.cost[1])} and ${RP(C.HINT.cost[2])}.<br><span class="small">Calls cost 50p per minute (more from mobiles). Please ask the permission of the person who pays the phone bill. Hunt HQ, PO Box 1999.</span></div>
      <p>Ring it with the <b>Phone Dialer</b> (Start &gt; Programs &gt; Accessories &gt; Communications), or, if Mom is on the phone, <button type="button" class="sxh-btn sxh-listen">listen in right here</button>.</p>
      <h2>Hints you've heard</h2>${heard.length ? `<ul>${heard.map(k => { const [n, i] = k.split('.').map(Number); return `<li><b>Chapter ${n}, hint ${i + 1}:</b> ${esc(st.hs[k])}</li>`; }).join('')}</ul>` : '<p><i>None yet. Brave!</i></p>'}`);
    wireShell(el);
    el.querySelector('.sxh-listen').addEventListener('click', () => call('hint', '0909 879 0486'));
  }
  function hall(el) {
    el.innerHTML = hqShell('/hall.html', `<h1>The Hall of Champions</h1><p>Every hunter who has found all ten keys, in the order they did it. A <span class="ch">&#9733;</span> means 100%: every key AND every Golden Byte, and the Millennium Disk.</p><div class="sxh-hallbox"><p><i>Asking Hunt HQ's server...</i></p></div>`);
    wireShell(el);
    X.hall().then(m => {
      const box = el.querySelector('.sxh-hallbox'); if (!box) return;
      if (m.err) { box.innerHTML = '<p>The Hall of Champions server is not answering. (Is the modem on?)</p>'; return; }
      if (!m.list.length) { box.innerHTML = '<p><b>Nobody yet!</b> The first name in here could be yours.</p>'; return; }
      const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's'); const dur = ms => { const h = Math.floor(ms / 3600000); return h >= 48 ? pl(Math.round(h / 24), 'day') : h >= 1 ? pl(h, 'hour') : pl(Math.max(1, Math.round(ms / 60000)), 'minute'); };
      box.innerHTML = `<table class="sxh-hall"><tr><th>#</th><th>Hunter</th><th>Finished</th><th>Took</th></tr>${m.list.map(([pos, n, at, d, full]) => `<tr><td>${pos}</td><td>${esc(n)} ${full ? '<span class="ch" title="100%">&#9733;</span>' : ''}</td><td>${d99(at)}</td><td>${dur(d)}</td></tr>`).join('')}</table><p style="font:12px Arial,sans-serif">${m.n} hunter${m.n === 1 ? '' : 's'} finished, ${m.champs} at 100%.</p>`;
    });
  }
  function kitPage(el) {
    const has = window.Setup && Setup.has && Setup.has('sx.kit');
    el.innerHTML = hqShell('/kit.html', `<h1>The Hunter's Kit 1.0</h1><div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap"><div style="flex:1 1 280px"><p>Every treasure hunter needs proper kit. The <b>Hunter's Kit</b> goes on your PC (Start &gt; Programs &gt; The Great JackNet Hunt) and gives you:</p><ul><li><b>The Hunt Logbook</b>: every key, every lucky letter and every Golden Byte you've found.</li><li><b>The Decoder</b>: backwards writing, Morse code, ROT13, A=1 B=2 C=3, phone keypads and the pilots' alphabet. In both directions.</li><li><b>Notes</b>: a notepad for your clues that remembers everything.</li></ul><p>Freeware. 420 KB (about two minutes on a 56K modem, if nobody picks up the phone).</p><p><button type="button" class="sxh-btn sxh-dl">${has ? 'Open the Hunter\'s Kit' : 'Download the Hunter\'s Kit (420 KB)'}</button></p></div><div style="flex:0 0 120px;text-align:center"><svg viewBox="0 0 32 32" width="110" height="110">${'<path d="M4 9h24v18H4z" fill="#8a5a2a" stroke="#000"/><path d="M4 9l3-5h18l3 5" fill="#b07a3a" stroke="#000"/><path d="M11 9V6h10v3" fill="none" stroke="#000"/><circle cx="16" cy="18" r="5" fill="#ffd400" stroke="#000"/><path d="M16 14v4l3 2" stroke="#000" fill="none"/><path d="M4 13h24" stroke="#5a3a1a"/>'}</svg></div></div>`);
    wireShell(el);
    el.querySelector('.sxh-dl').addEventListener('click', () => { if (window.Setup && Setup.has && !Setup.has('sx.kit')) Setup.download('sx.kit'); else A.open('sx.kit'); });
  }
  function robots(el) {
    secret('sx.h.robots');
    el.innerHTML = `<pre class="sxh-pre"># robots.txt for http://www.greathunt.jnet/
# Search engine spiders: please read this before you crawl about.

User-agent: *
Disallow: /goldenbyte.html     # private! robots keep out!
Disallow: /answers.html        # (there isn't one. nice try.)

User-agent: JackgleBot
Disallow: /                    # you know what you did

# Humans are allowed everywhere. Humans are not robots.
# (Dave, you are a human. Probably.)
#                                              - Jack</pre>`;
  }
  function goldenbyte(el) {
    const got = !!X.st.by.robots;
    el.innerHTML = hqShell('', `<h1>Shhh... a robot-proof page</h1><p>No search engine will ever find this page, because the robots.txt file told them not to look. But YOU looked. You're not a robot. (Are you?)</p><button type="button" class="sxh-gold" aria-label="Take the Golden Byte"></button><p style="text-align:center" class="sxh-gbm">${got ? 'You already took this Golden Byte (byte code NOBOT).' : 'Click the shiny thing!'}</p>`);
    wireShell(el);
    el.querySelector('.sxh-gold').addEventListener('click', ev => { ev.currentTarget.style.animation = 'none'; ev.currentTarget.style.opacity = '.4'; X.byte('robots'); el.querySelector('.sxh-gbm').textContent = 'A GOLDEN BYTE! Byte code: NOBOT. It\'s in your logbook.'; });
  }
  function answers(el) { el.innerHTML = hqShell('', '<h1>The Answers</h1><p>Ha! There are no answers here. There never were. The answers live on Hunt HQ\'s server, which is in a cupboard, which is locked, which is guarded by Gubbinz.</p><p>Hi Dave.</p>'); wireShell(el); }
  function disk(el) {
    const st = X.st;
    if (!st.ch[10]) { el.innerHTML = hqShell('', '<h1>Locked</h1><p>This page only opens for hunters who have found all ten keys. Nice try though!</p>'); wireShell(el); return; }
    const full = X.nKeys() >= 10 && X.nBytes() >= 10, champ = full && (!isMember() || st.full);
    el.innerHTML = hqShell('', `<h1>THE MILLENNIUM DISK</h1>${champ ? '<div class="sxh-champ">GREAT HUNT CHAMPION</div>' : ''}<p>Ten keys. Ten locks. And under the very last one, wrapped in a sandwich bag, is a single 3.5 inch floppy disk. The label says <b>MILLENNIUM - DO NOT FORMAT</b> in felt tip.</p>
      <div class="sxh-disk">${ICO.disk.replace('<svg', '<svg aria-hidden="true"')}<div class="sxh-dir"><span class="sxh-dirt"> Volume in drive A is MILLENNIUM
 Directory of A:\\

 <button type="button" class="sxh-open">LASTFILE TXT</button>      1,999  31/12/99  23:59
        1 file(s)          1,999 bytes
                       1,455,857 bytes free</span></div></div>
      <div class="sxh-lastfile"></div>
      ${full ? (isMember() ? (st.full ? `<p><b>100%!</b> The Millennium Disk is in your JackLoot chest (look on www.lootlings.jnet), with the Great Hunt Champion badge. You're in the <a href="${HQU}/hall.html">Hall of Champions</a> with a star.</p>` : '<p><i>Checking your 100% with Hunt HQ...</i></p>') : '<p><b>100%!</b> You found everything! Log on to JackNet (it\'s free) to claim the Millennium Disk and the Champion badge: everything you found comes with you.</p>')
        : `<p>You've found all ten keys${isMember() ? ' (the Great Hunt Finisher badge is in your JackLoot chest)' : ''}. For <b>100%</b> and the Millennium Disk itself, find all ten <a href="${HQU}/bytes.html">Golden Bytes</a> too. You have ${X.nBytes()}.</p>`}`);
    wireShell(el);
    el.querySelector('.sxh-open').addEventListener('click', () => {
      secret('sx.h.disk'); sfx('click');
      el.querySelector('.sxh-lastfile').innerHTML = `<pre class="sxh-pre" style="min-height:0">LASTFILE.TXT
============

Hello, whoever you are.

If you're reading this, you found every key. That means you
looked at web pages, AND under them. You went into DOS. You
opened the Registry (don't tell Mom). You read my diary (don't
tell ME). You rang a phone number that spells a word. You did a
cheat from 1986. You are officially a NERD, like me. Respect.

It's 1999. Everybody says the year 2000 is going to be amazing.
Flying cars. Robot butlers. Holidays on the Moon. Maybe all the
computers will go wrong at midnight and we'll have to live in
Dave's Y2K bunker (it's his shed).

I don't know what the future's like. But I know what now is like:
it's a modem screaming, a Rubrick's cube with one side done, an Ork
with wet paint on it, Mom shouting that tea's ready, and a web
site that I made, on my own, from scratch, in Notepad.

And you came and played on it. Thanks.

See you in the future.

- Jack, 31/12/99, 23:59

PS. Ten... nine... eight...</pre>`;
    });
    if (full && isMember() && !st.full) { const off = X.on('change', () => { if (!live(el)) return off(); if (X.st.full) { off(); disk(el); } }); }
  }

  // ================================================================ the Hunters' Ring
  const MEMBERS = [['www.floppyfanclub.netz', 'The Floppy Fan Club', 'All about the humble 3.5 inch floppy disk. 1.44 MB of joy.'], ['www.modemmuseum.w3b', 'The Modem Museum', 'From 300 baud to 56K, with sound effects.'], ['www.saverhall.zyne', 'The Screen Saver Hall of Fame', 'Starfields, pipes, mazes and flying toasters.'], ['www.shinydisc.kidz', 'The Shiny Disc Club', 'CD-ROMs, cover discs and why the microwave is NOT a CD player.']];
  const ringSeen = () => store.get('jhp_sx_ring', {});
  function ringVisit(host) { const s = ringSeen(); if (!s[host]) { s[host] = Date.now(); store.set('jhp_sx_ring', s); } if ([RING, ...MEMBERS.map(m => m[0])].every(h => s[h])) secret('sx.h.ring'); }
  function ringNav(i) {
    const prev = MEMBERS[(i + 3) % 4][0], next = MEMBERS[(i + 1) % 4][0];
    return `<div class="sxr-nav"><span class="lg">The Hunters' Ring</span><br>This site is member <b>${i + 1}</b> of <b>4</b> of the Hunters' Ring<div class="r"><a href="http://${prev}/">&laquo; Prev</a><a href="http://${RING}/">Ring Hub</a><a href="#" class="sxr-rnd">Random</a><a href="http://${next}/">Next &raquo;</a></div></div>`;
  }
  function wireRing(el, host) {
    ringVisit(host);
    const r = el.querySelector('.sxr-rnd'); if (r) r.addEventListener('click', ev => { ev.preventDefault(); const o = MEMBERS.filter(m => m[0] !== host); IE.navigate('http://' + o[Math.floor(Math.random() * o.length)][0] + '/'); });
  }
  function hub(el) {
    const s = ringSeen();
    el.innerHTML = `<div class="sxr sxr-hub"><div class="sxr-in"><h1>THE HUNTERS' RING</h1><p style="text-align:center"><i>A webring for treasure hunters, puzzle people and anybody who likes finding things.</i></p>
      <p><b>What's a webring?</b> It's a circle of web sites that all link to each other. Every member has the ring's bar at the bottom of the page: click <b>Next</b> and you go to the next site in the ring, then the next, then the next, and eventually you end up back where you started. Like a conga, but with web pages.</p>
      <p><b>Hunters, listen up:</b> every member of the ring hides one PIECE of a secret, each in a different way. Find all four and put them together <b>in ring order</b>, 1 to 4.</p>
      <div class="sxr-list">${MEMBERS.map(([h, n, d], i) => `<div class="sxr-mem"><span class="no">${i + 1}</span><div><a href="http://${h}/"><b>${esc(n)}</b></a> <small>(http://${h}/)</small><br>${esc(d)}${s[h] ? ' <span class="vis">&#10003; VISITED</span>' : ''}</div></div>`).join('')}</div>
      <p style="text-align:center"><a href="http://${RING}/join.html">Join the ring</a> &middot; <a href="${HQU}/">Hunt HQ</a></p></div></div>`;
    wireRing(el, RING);
  }
  function join(el) {
    el.innerHTML = `<div class="sxr sxr-hub"><div class="sxr-in"><h1>JOIN THE RING</h1><p>Want your site in the Hunters' Ring? Fill in the form, paste the ring code at the bottom of your page and wait for the Ring Master to approve you.</p><p><label>Your site's address: <input type="text" value="http://" style="width:60%"></label></p><p><button type="button" class="sxh-btn sxr-j">Apply</button></p><p class="sxr-jm"></p><p style="text-align:center"><a href="http://${RING}/">Back to the Ring Hub</a></p></div></div>`;
    el.querySelector('.sxr-j').addEventListener('click', () => { el.querySelector('.sxr-jm').textContent = 'Sorry! The Hunters\' Ring is FULL (four sites is a lot of sites for one ring). Try The Ring of Fire-and-Glitter. They let anybody in.'; sfx('uhoh'); });
    ringVisit(RING);
  }
  function floppy(el) {
    const fl = '<svg class="fl" viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" fill="#003080" stroke="#000"/><rect x="10" y="4" width="12" height="9" fill="#c8c8d0" stroke="#000"/><rect x="18" y="5.5" width="3" height="6" fill="#003080"/><rect x="8" y="16" width="16" height="10" fill="#fff" stroke="#000"/><path d="M10 19h12M10 22h9" stroke="#e10600"/></svg>';
    el.innerHTML = `<div class="sxr sxr-ffc"><div class="sxr-in"><h1>${fl} THE FLOPPY FAN CLUB ${fl}</h1><p style="text-align:center"><b>Celebrating the 3.5 inch floppy disk since 1997!</b> &middot; <span class="ctr sxr-c" style="font:bold 13px 'Courier New',monospace;background:#000;color:#3f3;padding:1px 5px">------</span> fans so far</p><hr>
      <h2>Why we love the floppy</h2><ul><li>It holds <b>1.44 MB</b>. (Strictly 1,474,560 bytes. The "MB" is a funny sort of megabyte that's 1,000 times 1,024. Nerds argue about it at parties.)</li><li>It has a hard plastic case and a metal shutter, so you can carry it in your pocket. (Not next to your keys. And NEVER next to a magnet.)</li><li>Slide the little <b>write-protect tab</b> and nobody can save over your stuff. Not even Dave.</li><li>It goes <i>clunk-whirr-zzzt</i> when you put it in. Best sound in the world.</li></ul>
      <h2>Floppy facts</h2><table><tr><th>Disk</th><th>Size</th><th>Holds</th></tr><tr><td>Double Density (DD)</td><td>3.5 inch</td><td>720 KB</td></tr><tr><td>High Density (HD)</td><td>3.5 inch</td><td>1.44 MB</td></tr><tr><td>The old floppy one</td><td>5.25 inch</td><td>360 KB or 1.2 MB</td></tr><tr><td>A CD-ROM (show off)</td><td>12 cm</td><td>650 MB</td></tr></table>
      <h2>Members' best disk labels</h2><ol><li>"DO NOT FORMAT" (it got formatted)</li><li>"HOMEWORK" (it was not homework)</li><li>"Gloom - disk 3 of 4" (disk 3 of 4 is always the one that goes wrong)</li><li>"Mom's recipes - DON'T TOUCH"</li><li>"Dave's disk" (Dave lost it in 1997. It's still in Jack's drive.)</li></ol>
      <p style="text-align:center;margin:30px 0 4px">Thanks for visiting! Please sign our guestbook. (We haven't got a guestbook.)</p>
      <p style="text-align:center;margin:0 0 20px">&nbsp;<span class="sxr-white">HUNTERS: PIECE 1 OF 4 IS "WE"</span>&nbsp;</p>${ringNav(0)}</div></div>`;
    wireRing(el, MEMBERS[0][0]); counter(el, 'web.hits.sx.ffc', '.sxr-c');
    const chk = () => { if (!live(el)) return document.removeEventListener('selectionchange', chk); const s = window.getSelection && window.getSelection(); const w = el.querySelector('.sxr-white'); if (s && w && !s.isCollapsed && s.containsNode && s.containsNode(w, true) && String(s).includes('PIECE')) secret('sx.h.white'); };
    document.addEventListener('selectionchange', chk);
  }
  function modem(el) {
    el.innerHTML = `<div class="sxr sxr-mm"><div class="sxr-in"><h1>THE MODEM MUSEUM</h1><p style="text-align:center">EST. 1996 &middot; CONNECT 56000 &middot; <a href="#" class="sxr-hs">[ PLAY THE HANDSHAKE ]</a></p>
      <div class="tl"><p><b>1962</b> - The Bell 103 modem: 300 bits per second. That's about 30 letters a second. You could read faster than it.</p><p><b>1970s</b> - Acoustic couplers: you put the phone handset into two rubber cups. If anyone in the house talked, the computer heard it.</p><p><b>1984</b> - 2,400 bps (V.22bis). Pictures still take all night.</p><p><b>Late 1980s</b> - 9,600 bps (V.32). Bulletin boards everywhere!</p><p><b>1991</b> - 14,400 bps (V.32bis).</p><p><b>1994</b> - 28,800 bps (V.34). The World Wide Web arrives at your house, one picture at a time, from the top down.</p><p><b>1997</b> - 56K! But two kinds that don't talk to each other (X2 and K56flex). Classic.</p><p><b>1998</b> - V.90 sorts it out. One 56K for everyone. Mom still needs the phone.</p></div>
      <p>The noise? That's two modems shaking hands: working out how fast the line is, how noisy it is and how fast they can both go. Then the speaker goes quiet and you're ONLINE.</p>
      <p style="text-align:center">You are visitor number <span class="ctr">00BR17</span><br><small>(Our hit counter has gone funny and shows LETTERS. The man from FreeToolz says it's "a database thing". Hunters: you know what to do with letters.)</small></p>${ringNav(1)}</div></div>`;
    wireRing(el, MEMBERS[1][0]);
    el.querySelector('.sxr-hs').addEventListener('click', ev => {
      ev.preventDefault();
      if (!window.Sound || !Sound.on) { Desk.toast('The Modem Museum', 'Turn the sound on first (the speaker in the corner of the taskbar). Then stand back.'); return; }
      const seq = [[350, .4], [440, .4], [941, .1], [1336, .1], [2100, .9], [1650, .3], [1850, .3], [980, .2], [1180, .2], [2400, .5], [600, .2], [3000, .4], [1200, .6], [2400, .6]];
      let t = 0; seq.forEach(([f, d]) => { setTimeout(() => { try { Sound.note(f, d, f > 2000 ? 'sawtooth' : 'square'); } catch (e) {} }, t * 1000); t += d * 0.8; });
    });
  }
  function saver(el) {
    el.innerHTML = `<div class="sxr sxr-sv"><div class="sxr-in"><h1>THE SCREEN SAVER<br>HALL OF FAME</h1><p style="text-align:center"><i>Because a monitor left on all night gets pictures burnt into it. And because they're BRILLIANT.</i></p>
      <div class="hof"><div><b>Starfield Simulation</b><br>You're flying through space at warp speed. Stare at it long enough and you lean forward.</div><div><b>3D Pipes</b><br>Pipes grow all over the screen, and every now and then a teapot joint turns up. Nobody knows why.</div><div><b>3D Maze</b><br>A brick maze with a smiley face and a rat in it. Find the OpenGL sign and the walls go upside down!</div><div><b>Mystify</b><br>Bouncy coloured lines. Very relaxing. Very 1995.</div><div><b>Flying Toasters</b><br>Toasters. With wings. Flying. With toast. The most famous screen saver of all time.</div><div><b>Scrolling Marquee</b><br>Your own words, sliding across the screen. Dave's says "DAVE IS GREAT". Nobody agrees.</div></div>
      <h2 style="margin-top:20px">Sign the Hall's Guestbook</h2><form class="sxh-gbf" autocomplete="off"><textarea maxlength="200" aria-label="Your message" placeholder="What's your favourite screen saver?"></textarea><button class="sxh-btn" type="submit">Sign it!</button></form><div class="sxh-gbl"></div>${ringNav(2)}</div><button type="button" class="tiny" style="left:83%;top:212px" aria-label="A tiny gold star" title=""></button></div>`;
    wireRing(el, MEMBERS[2][0]);
    liveGb(el, 'web.gb.sx.saver', [['The Hunt Master', '05/01/99', 'Lovely site! Hunters, take note: piece 3 of 4 is "IN". (In what? No: IN.)', 1], ['Toast Fan 98', '07/01/99', 'Flying Toasters forever!!!'], ['Kev', '11/01/99', 'Pipes is the best one. The teapot is a secret. Look it up.']]);
    const t = el.querySelector('.tiny'); if (X.st.by.ring) t.classList.add('sx-got');
    t.addEventListener('click', () => { t.classList.add('sx-got'); if (X.byte('ring')) Desk.toast('The Tiniest Link', 'That wasn\'t a star. It was a GOLDEN BYTE (code TINY1)!', 6000); });
  }
  function shiny(el) {
    el.innerHTML = `<div class="sxr sxr-cd"><div class="sxr-in"><h1>The Shiny Disc Club</h1><span class="disc" aria-hidden="true"></span><p style="text-align:center"><b>CD-ROMs are the FUTURE!!!</b></p>
      <ul><li>One CD-ROM holds <b>650 MB</b>. That's about 450 floppy disks. Imagine putting in 450 floppy disks to install a game. (Some people did.)</li><li>CD-ROM speeds: "1x" means 150 KB a second. Our drive is <b>32x</b>, which is about 4.8 MB a second. WHOOSH.</li><li><b>Cover discs!</b> Every games magazine has a CD stuck to the front with demos on it. The best bit of the magazine. Sometimes the only bit.</li><li>Hold it by the edges. Never write on the shiny side. Never use it as a coaster (Dad).</li><li>Do NOT put a CD in the microwave. We know it makes sparks. We KNOW. Mom found out.</li></ul>
      <p style="text-align:center">Our members have <b>3,207</b> cover discs between them, and they've played about 11 demos all the way through.</p>
      <!-- HUNTERS: piece 4 of 4 is "G". You found it by looking in the source. Respect! Now put the four pieces together, in ring order. -->
      ${ringNav(3)}</div></div>`;
    wireRing(el, MEMBERS[3][0]);
  }

  // ================================================================ render
  const PAGES = {
    [HQ]: { '/': home, '/guestbook.html': guestbook, '/rules.html': rules, '/bytes.html': bytes, '/hintline.html': hintline, '/hall.html': hall, '/kit.html': kitPage, '/robots.txt': robots, '/goldenbyte.html': goldenbyte, '/answers.html': answers, '/disk.html': disk },
    [RING]: { '/': hub, '/join.html': join },
    'www.floppyfanclub.netz': { '/': floppy }, 'www.modemmuseum.w3b': { '/': modem }, 'www.saverhall.zyne': { '/': saver }, 'www.shinydisc.kidz': { '/': shiny },
  };
  function render(host, path, el) {
    const fn = (PAGES[host] || {})[path]; if (!fn) { el.innerHTML = '<p style="padding:20px">404 Not Found</p>'; return; }
    el.className = 'sxh-root'; el._sxPage = host === HQ ? path : '';
    X.cat().then(() => { try { fn(el); } catch (e) { console.error(e); el.innerHTML = '<p style="padding:20px">This page has a problem. (Gubbinz chewed the cable.)</p>'; } });
    if (host === HQ) secret('sx.h.join');
  }

  // ================================================================ the Hunter's Kit (a program)
  const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
  const NATO = { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliet', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu' };
  const KEYPAD = { 2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ' };
  const DEC = {
    back: s => [...s].reverse().join(''),
    rot13: s => s.replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); }),
    a1z26: s => /[a-z]/i.test(s) ? s.toUpperCase().replace(/[^A-Z ]/g, '').split('').map(c => c === ' ' ? '/' : c.charCodeAt(0) - 64).join(' ').replace(/ \/ /g, ' / ') : s.split(/[\s,-]+/).map(x => x === '/' ? ' ' : (+x >= 1 && +x <= 26 ? String.fromCharCode(64 + +x) : '?')).join(''),
    morse: s => /^[\s.\-/]+$/.test(s) ? s.trim().split(/\s*\/\s*|\s{3,}/).map(w => w.split(/\s+/).map(code => (Object.keys(MORSE).find(k => MORSE[k] === code) || '?')).join('')).join(' ') : s.toUpperCase().split(' ').map(w => [...w].map(c => MORSE[c] || '').filter(Boolean).join(' ')).join(' / '),
    keypad: s => s.toUpperCase().split('').map(c => { if (c === ' ') return ' '; for (const k in KEYPAD) if (KEYPAD[k].includes(c)) return k; return /\d/.test(c) ? c : ''; }).join(''),
    nato: s => { const w = s.trim().split(/[\s,.]+/).filter(Boolean); const back = w.length && w.every(x => Object.values(NATO).some(v => v.toLowerCase() === x.toLowerCase())); return back ? w.map(x => Object.keys(NATO).find(k => NATO[k].toLowerCase() === x.toLowerCase())).join('') : s.toUpperCase().replace(/[^A-Z]/g, '').split('').map(c => NATO[c]).join(' '); },
    binary: s => /^[01\s]+$/.test(s) ? s.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('') : [...s].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' '),
  };
  function kit() {
    secret('sx.h.kit');
    const C = CAT(), st = X.st;
    const b = document.createElement('div'); b.className = 'sxk';
    b.innerHTML = `<div class="tabs"><span class="on" data-t="0">Logbook</span><span data-t="1">Decoder</span><span data-t="2">Notes</span></div>
      <div class="tabpage sxk-log" data-p="0"></div>
      <div class="tabpage sxk-dec" data-p="1" style="display:none"><label>Type or paste something:</label><textarea class="sxk-in" spellcheck="false"></textarea><div class="btns">${[['back', 'Backwards'], ['rot13', 'ROT13'], ['a1z26', 'A=1 B=2...'], ['morse', 'Morse'], ['keypad', 'Phone keypad'], ['nato', 'Pilots\' alphabet'], ['binary', 'Binary']].map(([k, n]) => `<button type="button" class="btn" data-d="${k}">${n}</button>`).join('')}</div><label>Answer:</label><textarea class="sxk-out" readonly></textarea><div class="ref">MORSE: ${Object.keys(MORSE).slice(0, 26).map(k => k + ' ' + MORSE[k]).join('   ')}\n\nPILOTS: ${Object.keys(NATO).map(k => NATO[k]).join(' ')}\n\nKEYPAD: 2 ABC  3 DEF  4 GHI  5 JKL  6 MNO  7 PQRS  8 TUV  9 WXYZ</div></div>
      <div class="tabpage sxk-notes" data-p="2" style="display:none"><textarea class="sxk-note" style="height:100%;min-height:220px" placeholder="Clues, ideas, things Dave said..."></textarea></div>`;
    const w = A.win('Hunter\'s Kit', b, { w: 500, h: 430, icon: '<svg viewBox="0 0 32 32"><path d="M4 9h24v18H4z" fill="#8a5a2a" stroke="#000"/><path d="M4 9l3-5h18l3 5" fill="#b07a3a" stroke="#000"/><circle cx="16" cy="18" r="5" fill="#ffd400" stroke="#000"/></svg>', status: true, menubar: true, minW: 280, minH: 260 });
    const log = () => {
      const lp = b.querySelector('.sxk-log');
      lp.innerHTML = `<p style="margin:0 0 6px"><b>${X.nKeys()}</b> of 10 keys &middot; <b>${X.nBytes()}</b> of 10 Golden Bytes &middot; <b>${pct()}%</b> complete</p><table>${C.CH.map(c => `<tr><td>${c.n}.</td><td>${esc(c.t)}<br><small style="color:#808080">${esc(c.w)}</small></td><td class="${st.ch[c.n] ? 'ok' : 'no'}">${st.ch[c.n] ? (typeof st.ch[c.n] === 'string' ? esc(st.ch[c.n]) : 'FOUND') + (st.lt[c.n] ? ' (' + esc(st.lt[c.n]) + ')' : '') : X.avail(c.n) ? 'searching...' : 'locked'}</td></tr>`).join('')}</table><p style="margin:8px 0 2px"><b>Golden Bytes</b></p><table>${C.BYTES.map(bb => `<tr><td class="${st.by[bb.id] ? 'ok' : 'no'}">${st.by[bb.id] ? '&#9733; ' + esc(bb.n) : '? ???'}</td><td>${st.by[bb.id] ? 'code ' + esc(X.BCODE[bb.id]) : '<small>' + esc(bb.h) + '</small>'}</td></tr>`).join('')}</table>`;
      w.status.textContent = `${pct()}% complete`;
    };
    log();
    const off = X.on('change', () => { if (w.closed) return off(); log(); });
    b.querySelectorAll('.tabs span').forEach(t => t.addEventListener('click', () => { b.querySelectorAll('.tabs span').forEach(x => x.classList.toggle('on', x === t)); b.querySelectorAll('.tabpage').forEach(p => { p.style.display = p.dataset.p === t.dataset.t ? '' : 'none'; }); }));
    const inp = b.querySelector('.sxk-in'), out = b.querySelector('.sxk-out');
    b.querySelectorAll('[data-d]').forEach(x => x.addEventListener('click', () => { try { out.value = DEC[x.dataset.d](inp.value); } catch (e) { out.value = '?'; } sfx('click'); }));
    const note = b.querySelector('.sxk-note'); note.value = store.get('jhp_sx_notes', ''); note.addEventListener('input', () => store.set('jhp_sx_notes', note.value.slice(0, 20000)));
    A.menubar(w, [['File', [{ label: 'Open Hunt HQ', act: () => X.go(HQU + '/') }, '-', { label: 'Close', act: () => w.close() }]], ['Help', [{ label: 'About Hunter\'s Kit', act: () => Desk.msgbox('About Hunter\'s Kit', 'Hunter\'s Kit 1.0\nFreeware from Hunt HQ\n\nMade for the Great JackNet Hunt, 1999.\nThe Decoder can do backwards, ROT13, A1Z26, Morse, phone keypads, the pilots\' alphabet and binary, in both directions.', 'info') }]]]);
    return w;
  }

  // ================================================================ the phone lines
  const DT = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], 0: [941, 1336], '*': [941, 1209], '#': [941, 1477] };
  const tone = (d, len) => { const f = DT[d]; if (!f) return; try { Sound.note(f[0], len || 0.12, 'sine'); Sound.note(f[1], len || 0.12, 'sine'); } catch (e) {} };
  const say = text => { try { if (window.Sound && Sound.on && window.speechSynthesis) { const u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.pitch = 0.8; speechSynthesis.cancel(); speechSynthesis.speak(u); } } catch (e) {} };
  let callWin = null;
  function callWindow(who, pad) {
    if (callWin && !callWin.closed) callWin.close();
    const b = document.createElement('div');
    b.innerHTML = `<div class="row" style="flex-wrap:nowrap;gap:8px;align-items:center;margin-bottom:6px">${ICO.phone.replace('<svg', '<svg width="32" height="32"')}<b style="flex:1">Active call: ${esc(who)}</b><span class="sxc-tm">0:00</span></div><div class="sxc-talk" aria-live="polite"></div>${pad ? `<div class="sxc-pad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => `<button type="button" class="btn" data-k="${k}">${k}</button>`).join('')}</div>` : ''}<div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="btn sxc-hang">Hang Up</button></div>`;
    const w = callWin = A.win('Active Call', b, { w: 380, noResize: true, noMax: true, icon: ICO.phone, onClose: () => { clearInterval(iv); try { speechSynthesis.cancel(); } catch (e) {} } });
    let s = 0; const iv = setInterval(() => { s++; const t = b.querySelector('.sxc-tm'); if (t) t.textContent = Math.floor(s / 60) + ':' + p2(s % 60); }, 1000);
    b.querySelector('.sxc-hang').addEventListener('click', () => w.close());
    const talk = b.querySelector('.sxc-talk'); let q = Promise.resolve();
    const line = (text, cls, wait) => { q = q.then(() => new Promise(res => setTimeout(() => { if (w.closed) return res(); const p = document.createElement('p'); if (cls) p.className = cls; p.textContent = text; talk.appendChild(p); talk.scrollTop = 1e9; res(); }, wait == null ? 900 : wait))); return q; };
    return { w, b, line, clear: () => { q = Promise.resolve(); } };
  }
  function ringing(n, then) { for (let i = 0; i < n; i++) [0, 0.6].forEach(o => setTimeout(() => { try { Sound.note(400, 0.4, 'sine'); Sound.note(450, 0.4, 'sine'); } catch (e) {} }, (i * 3 + o) * 1000)); setTimeout(then, n * 3000 - 1200); }
  function dialTones(raw, then) { try { Sound.note(350, 0.5, 'sine'); Sound.note(440, 0.5, 'sine'); } catch (e) {} const d = String(raw).replace(/[^0-9*#]/g, ''); [...d].forEach((c, i) => setTimeout(() => tone(c, 0.09), 600 + i * 130)); setTimeout(then, 600 + d.length * 130 + 300); }
  function call(what, raw, dialWin) {
    const st = dialWin && dialWin.querySelector('.status'); if (st) st.textContent = 'Dialling ' + raw + '...';
    if (what === 'hint') {
      return Desk.msgbox('Hunt Hint Line', 'WARNING: 0909 is a premium rate number. Calls cost 50p per minute (more from mobiles).\n\nDid you ask permission from the person who pays the phone bill?', 'q', [['Yes, I asked', () => dialTones(raw, () => ringing(1, hintLine))], ['No', () => Desk.msgbox('Phone Dialer', 'Good call. (Literally.) There\'s a free first hint for every chapter on the Hint Line page at Hunt HQ, though. Listen in from there!', 'info')]]);
    }
    dialTones(raw, () => ringing(2, () => (what === 'hunters' ? huntersLine : bytesLine)()));
  }
  function huntersLine() {
    const c = callWindow('Hunt HQ (answerphone)');
    if (!X.avail(9)) { c.line('*click* Answerphone: "Hello, hunter! You\'ve found the Hunt HQ phone line. Very clever."', '', 600); c.line('"But you\'re a bit early! Come back when you\'re on chapter 9. Byeee!"'); c.line('*beep*', 'sys'); return; }
    secret('sx.h.hunters');
    const nato = 'Echo. November. Golf. Alpha. Golf. Echo. Delta.';
    c.line('*click* Answerphone: "Hello, hunter! You found the Hunt HQ phone line. Here is the ninth key."', '', 600);
    c.line('"I\'ll spell it the way pilots spell things over the radio. Ready? Got a pencil?"');
    c.line('"' + nato + '"', '', 1400).then(() => say('Echo. November. Golf. Alpha. Golf. Echo. Delta.'));
    c.line('"I\'ll say that again: ' + nato + '"', '', 6000);
    c.line('"Funny, that\'s also the noise you get when you ring home and Mom is on the phone to Nan. Good luck!"', '', 3000);
    c.line('*beep* End of message.', 'sys');
  }
  function bytesLine() {
    const c = callWindow('The Byte Line');
    c.line('*click* A robot voice: "BEEP. BOOP. You have reached the BYTE LINE."', '', 600).then(() => say('Beep. Boop. You have reached the byte line.'));
    c.line('"Here is your Golden Byte. Byte code: R. I. N. G. Five."', '', 1600).then(() => { X.byte('phone'); });
    c.line('"Thank you for calling. This call cost nothing, because bytes are free. BEEP."');
    c.line('*click*', 'sys');
  }
  function hintLine() {
    const c = callWindow('Hunt Hint Line', true), C = CAT();
    secret('sx.h.hint');
    try { Sound.music.play('jamp_gubbinz_lullaby'); } catch (e) {}
    let mode = 'ch', ch = 0, busy = false;
    const menu = () => { mode = 'ch'; c.line('"Press the number of your chapter, 1 to 9. For chapter 10, press 0. Press # to hear this again."', '', 500); };
    c.line('Recorded voice: "Welcome to the Great JackNet Hunt Hint Line! Calls cost 50p per minute."', '', 400);
    c.line('"Hint 1 for every chapter is free. Hints 2 and 3 open by themselves after a while."');
    menu();
    const chMenu = n => { mode = 'hint'; ch = n; const t = (C.CH[n - 1] || {}).t || ''; c.line(`You pressed ${n === 10 ? 0 : n}.`, 'me', 100); c.line(`"Chapter ${n}: ${t}. Press 1, 2 or 3 for a hint. Press * to choose another chapter."`, '', 500); };
    const fmtWait = ms => { const m = Math.ceil(ms / 60000); return m >= 60 ? Math.ceil(m / 60) + ' hour' + (m >= 120 ? 's' : '') : m + ' minute' + (m === 1 ? '' : 's'); };
    const hear = (i, buy) => {
      busy = true; c.line(buy ? 'You pressed # (pay for it).' : `You pressed ${i + 1}.`, 'me', 100);
      X.hint(ch, i, buy).then(r => {
        busy = false; if (c.w.closed) return;
        if (r.err) return c.line('"...kssshhh... The Hint Line is very busy. Please try again later." (No connection to JackNet.)', 'sys', 300);
        if (r.text) { c.line(`"Chapter ${ch}, hint ${i + 1}: ${r.text}"`, '', 400).then(() => say(r.text)); if (r.paid) c.line(`(${RP(r.paid)} added to your phone bill. Well, taken from your bank.)`, 'sys'); return c.line('"Press 1, 2 or 3 for another hint, or * for another chapter."');
        }
        if (r.guest) return c.line('"Hints 2 and 3 are for JackNet members only. Joining is FREE: Start > Log Off, then pick a name and a password. Press 1 for the free hint."', '', 300);
        if (r.order) return c.line(`"Please hear hint ${i} first. Hints go in order, like everything else round here."`, '', 300);
        if (r.poor) return c.line(`"Sorry, you don't have ${RP(r.cost)}. Hints open for free if you wait."`, '', 300);
        const pend = i; c.line(r.wait < 0 ? `"That hint opens a while after you reach chapter ${ch}. You haven't got there yet!"` : `"Hint ${i + 1} opens by itself in ${fmtWait(r.wait)}. To hear it now, press # (costs ${RP(r.cost)} from your bank). Or press * to go back."`, '', 300);
        if (r.wait >= 0) { mode = 'buy'; c.b._pend = pend; }
      });
    };
    c.b.querySelectorAll('.sxc-pad button').forEach(k => k.addEventListener('click', () => {
      const d = k.dataset.k; tone(d); if (busy || c.w.closed) return;
      if (d === '#' && mode === 'buy') { mode = 'hint'; return hear(c.b._pend, true); }
      if (d === '#') return menu();
      if (d === '*') { c.line('You pressed *.', 'me', 100); return menu(); }
      if (mode === 'ch') { const n = d === '0' ? 10 : +d; if (n >= 1 && n <= 10) chMenu(n); return; }
      if (mode === 'hint' || mode === 'buy') { const i = +d - 1; if (i >= 0 && i < 3) { mode = 'hint'; hear(i); } }
    }));
    const offStop = setInterval(() => { if (c.w.closed) { clearInterval(offStop); try { Sound.music.stop(); } catch (e) {} } }, 1000);
  }

  window.SxHunt = { render, kit, call, DEC, home };
})();

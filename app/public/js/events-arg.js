/* events-arg: NO CARRIER, a puzzle trail across the fake web and the PC (hex, ROT13, an acrostic, a DOS program, Morse,
 * a teletext page, a picture's Properties, a BBS log-on, binary, a decoder ring, Start > Run, nerd numbers, A1Z26, an
 * anagram and a hidden site). It ends at the Owl's Nest and the members-only Hall of Puzzlers (the server checks the
 * answers that matter and records who finished, in order, with the time it took). Stuck? www.puzzleboard.cyb has hints.
 * Pages: www.nocarrier.cyb (hidden), www.owlsnest.cyb (hidden), www.puzzleboard.cyb; window: OWLDESK (Start > Run). */
(function () {
  'use strict';
  const Ev = window.Ev, A = window.Apps; if (!Ev || !A || window.EvArg) return;
  const { esc, h, sfx } = Ev, $ = id => document.getElementById(id);
  const css = (id, text) => { if ($(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = text; document.head.appendChild(s); };
  const found = id => !!(A.found && A.found[id]);
  const rot13 = s => s.replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); });
  const shift = (s, k) => s.replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + 26 + k) % 26 + 65));
  const prog = () => Ev.argProgress();
  const setP = (k, v) => { const p = prog(); p[k] = v; Ev.store.set('jhp_events_arg', p); };

  css('evArgCss', `
.nc{background:#000;color:#3f3;font:14px/1.35 "Courier New",Courier,monospace;min-height:100%;padding:14px 12px 24px}
.nc-wrap{max-width:720px;margin:0 auto}
.nc h1{font:bold 44px/1 "Courier New",monospace;color:#3f3;text-align:center;margin:10px 0;letter-spacing:4px;text-shadow:0 0 6px #3f3}
.nc .blink{animation:evblink 1s steps(2) infinite}
.nc pre{white-space:pre-wrap;margin:0;font:inherit}
.nc a{color:#ff3}
.nc-box{border:1px solid #3f3;padding:10px;margin:12px 0;box-shadow:0 0 8px rgba(60,255,60,.25) inset}
.nc-modem{display:block;margin:10px auto;width:180px;height:110px}
.nc-cap{text-align:center;font-size:12px;color:#2a2}
.nc-form{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 10px;align-items:center;max-width:380px;margin:10px auto}
.nc-form input{background:#000;color:#3f3;border:1px solid #3f3;font:15px "Courier New",monospace;padding:6px;min-width:0;text-transform:uppercase}
.nc-form button,.nc-btn{background:#000;color:#ff3;border:1px solid #ff3;font:bold 14px "Courier New",monospace;padding:8px 12px;cursor:pointer;min-height:36px}
.nc-form button:hover,.nc-btn:hover{background:#330}
.nc-menu{display:grid;gap:4px;margin:8px 0}
.nc-menu button{text-align:left;background:none;border:0;color:#3f3;font:15px "Courier New",monospace;padding:6px 4px;cursor:pointer;min-height:34px}
.nc-menu button b{color:#ff3}
.nc-menu button:hover,.nc-menu button:focus{background:#030;color:#fff}
.nc-msg{border-top:1px dashed #2a2;padding:8px 0}
.nc-msg .hd{color:#ff3}
.nc-ring{display:grid;gap:6px;justify-items:center}
.nc-ring .abc{font:bold 15px "Courier New",monospace;letter-spacing:2px;white-space:pre;overflow:hidden;max-width:100%}
.nc-ring .abc.top{color:#ff3}
.nc-ring .ctl{display:flex;gap:8px;align-items:center}
.nc-ring .ctl b{font-size:20px;min-width:40px;text-align:center}
.nc-out{border:1px solid #3f3;padding:8px;min-height:80px;word-break:break-word}
.nc-err{color:#f33}
.on-nest{background:#0a0a14;color:#d8d0b0;font:14px/1.55 Georgia,serif;min-height:100%;padding:16px 12px 24px;background-image:radial-gradient(#334 1px,transparent 1.5px);background-size:22px 22px}
.on-nest .w{max-width:720px;margin:0 auto}
.on-nest h1{text-align:center;font:bold 34px Georgia,serif;color:#ffd400;margin:4px 0}
.on-nest .owl{display:block;margin:6px auto;width:110px;height:110px}
.on-nest form{display:flex;gap:6px;max-width:420px;margin:10px auto;flex-wrap:wrap}
.on-nest input{flex:1;min-width:0;font:16px Georgia,serif;padding:6px;min-height:34px}
.on-nest .btn{min-height:36px;font-weight:bold}
.on-hall{width:100%;border-collapse:collapse;font:13px Verdana,Arial,sans-serif;background:#141420;margin-top:8px}
.on-hall th{background:#ffd400;color:#000;text-align:left;padding:4px 6px}
.on-hall td{padding:4px 6px;border-bottom:1px solid #334}
.on-hall tr.me td{background:#3a3010;color:#fff;font-weight:bold}
.on-cert{background:#fffbe0;color:#2a2010;border:6px double #8a6000;padding:14px;text-align:center;margin:14px auto;max-width:520px;font:15px Georgia,serif}
.on-cert b{font:bold 22px Georgia,serif;display:block;margin:4px 0}
.pz{background:#e8e8f4;color:#000;font:13px/1.45 Verdana,Arial,sans-serif;min-height:100%;padding:0 0 20px}
.pz-top{background:#30306a;color:#fff;padding:10px 14px;border-bottom:4px solid #ffd400}
.pz-top h1{margin:0;font:bold 26px Georgia,serif}
.pz-top h1 span{color:#ffd400}
.pz-wrap{max-width:860px;margin:0 auto;padding:10px 12px}
.pz-t{border:1px solid #6a6a9a;background:#fff;margin:10px 0}
.pz-t > b{display:block;background:#c8c8e8;padding:5px 8px;border-bottom:1px solid #6a6a9a}
.pz-p{display:grid;grid-template-columns:110px minmax(0,1fr);border-top:1px solid #ccd}
.pz-p .u{background:#f0f0fa;padding:6px;font-size:11px;border-right:1px solid #ccd}
.pz-p .u b{display:block;color:#30306a;font-size:12px}
.pz-p .x{padding:6px 8px}
.pz-steps{display:grid;gap:6px}
.pz-step{border:1px solid #aab;background:#f8f8ff;padding:6px 8px}
.pz-step.now{border:2px solid #e10600;background:#fff8e0}
.pz-step.done{opacity:.7}
.pz-step .hn{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.pz-step .hn .btn{min-height:28px}
.pz-hint{background:#ffffe1;border:1px solid #c0a000;padding:4px 6px;margin-top:4px}
.pz-spoil{background:#000;color:#000;padding:0 4px;cursor:pointer}
.pz-spoil.on{color:#fff}
@media (max-width:560px){.pz-p{grid-template-columns:minmax(0,1fr)}.pz-p .u{border-right:0;border-bottom:1px solid #ccd}.nc h1{font-size:30px}}
.od{margin:-6px;background:#5a3a1a;padding:8px;font:12px Tahoma,Arial;color:#000;display:grid;gap:8px}
.od-top{background:#8a5a2a;border:3px solid #3a200a;border-radius:4px;padding:8px;display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px}
.od-note{background:#ffff88;padding:8px;box-shadow:2px 2px 0 rgba(0,0,0,.4);font:13px "Comic Sans MS","Comic Neue",cursive;transform:rotate(var(--r));min-height:70px}
.od-thing{background:rgba(0,0,0,.15);border:1px dashed #3a200a;padding:6px;font:11px Tahoma;color:#fff;text-align:center}
.od-drawer{background:#7a4a1a;border:3px solid #3a200a;border-radius:4px;padding:10px;color:#fff;text-align:center}
.od-lock{display:flex;gap:10px;justify-content:center;margin:8px 0}
.od-dial{display:flex;flex-direction:column;align-items:center;gap:2px}
.od-dial b{background:#000;color:#ff3;font:bold 26px "Courier New",monospace;width:40px;text-align:center;border:2px inset #888}
.od-dial .btn{min-width:40px;min-height:30px;padding:0}
.od-in{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:8px}
.od-floppy{background:#202028;color:#fff;border:2px solid #000;padding:8px;font:12px "Courier New",monospace;position:relative}
.od-floppy{padding-top:24px !important}
.od-floppy .lb{background:#fff;color:#000;padding:6px;font:bold 13px "Comic Sans MS","Comic Neue",cursive;margin-top:6px}
.od-floppy::before{content:"";position:absolute;left:30%;right:30%;top:0;height:16px;background:#a0a0a8}
.od-card{background:#fffbe0;color:#000;padding:8px;font:13px Georgia,serif;border:1px solid #888;box-shadow:2px 2px 0 rgba(0,0,0,.4);transform:rotate(1.5deg)}
`);

  // ================================================================ www.nocarrier.cyb
  const MODEM = `<svg class="nc-modem" viewBox="0 0 180 110" aria-label="pw_handshake" shape-rendering="crispEdges"><rect x="10" y="40" width="160" height="50" fill="#d8d0c0" stroke="#3f3" stroke-width="2"/><rect x="10" y="40" width="160" height="10" fill="#b0a890"/><rect x="20" y="62" width="140" height="6" fill="#222"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${26 + i * 17}" y="74" width="8" height="5" fill="${i === 2 || i === 5 ? '#f33' : '#3f3'}"/>`).join('')}<path d="M40 40V18h20" stroke="#3f3" stroke-width="2" fill="none"/><text x="96" y="100" fill="#3f3" font-family="Courier New,monospace" font-size="10" text-anchor="middle">14.4K</text></svg>`;
  const ROT = rot13('MY LOGS ARE ON YOUR PC NOW. LOOK IN C:\\JACKOS\\TEMP\\NOCARRIR.LOG');
  Ev.addSource('nocarrier.cyb/', () => ({ name: 'index[1].htm', text: Ev.wrap99('NO CARRIER', [
    '<CENTER>',
    '<FONT FACE="Courier New" COLOR="#33FF33" SIZE=7><BLINK>NO CARRIER</BLINK></FONT><BR>',
    '<FONT FACE="Courier New" COLOR="#33FF33">THE NO CARRIER BBS  *  1993 - 1996  *  NODE 1 OF 1  *  14,400 BAUD</FONT>',
    '<P><IMG SRC="cgi-bin/modem.cgi?frame=1" WIDTH=180 HEIGHT=110 BORDER=0></P>',
    '<FONT FACE="Courier New" COLOR="#33AA33" SIZE=2>my trusty modem. she screams beautifully.</FONT>',
    '</CENTER>',
    '<!-- ====================================================== -->',
    '<!-- notes to self (scrambled the usual usenet way: 13 along) -->',
    `<!-- ${ROT} -->`,
    '<!-- ====================================================== -->',
    '<FORM ACTION="/cgi-bin/logon.pl" METHOD="POST">',
    '<TABLE BORDER=0 ALIGN=CENTER>',
    '<TR><TD><FONT FACE="Courier New" COLOR="#33FF33">USER:</FONT></TD><TD><INPUT TYPE="text" NAME="user" SIZE=16></TD></TR>',
    '<TR><TD><FONT FACE="Courier New" COLOR="#33FF33">PASSWORD:</FONT></TD><TD><INPUT TYPE="password" NAME="pass" SIZE=16></TD></TR>',
    '<TR><TD COLSPAN=2 ALIGN=CENTER><INPUT TYPE="submit" VALUE="LOG ON"></TD></TR>',
    '</TABLE>',
    '</FORM>',
    '<P ALIGN=CENTER><FONT FACE="Courier New" COLOR="#33FF33" SIZE=2>Thanks for calling. The board is closed. The line stays open.</FONT></P>',
  ].join('\n'), { bg: '#000000', fg: '#33FF33', counter: false, kw: 'bbs, modem, sysop, doors, ansi, warez (no)' }) }));

  const MSGS = [
    ['1', 'BYTEBANDIT', 'ALL', 'Anyone got the patch for Space Traderz?', 'Mine crashes when I land on Planet 9. Every time. Is it my 486?'],
    ['2', 'KEV', 'BYTEBANDIT', 'Re: patch', 'It is not your 486. It is Planet 9. Nobody lands on Planet 9.'],
    ['3', 'GRANNYGAMER', 'ALL', 'Hello is this the internet', 'My grandson set this up. I have typed HELLO. What happens now. Is anyone there'],
    ['4', 'MODEM_MIKE', 'SYSOP', 'Board closing??', 'Say it isn\'t so! Where will I post my high scores?'],
    ['5', 'NIGHTOWL', 'MODEM_MIKE', 'Re: Board closing??', 'NIGHTOWL here. Sorry Mike. The phone bill was bigger than my pocket money. By about four hundred times.'],
    ['6', 'NIGHTOWL', 'WHOEVER GETS THIS FAR', 'for you', 'NIGHTOWL here. Well done. You got in. Not many will.\n\nI left one more door open, but it is not on the menu. Knock on it. Its number is in my signature, the way computers write it.\n\n-- \n01000100 01001111 01001111 01010010 00100000 00110111'],
  ];
  const DOORS = [['SPACE TRADERZ 2000', 'Trade spice between 400 planets. Do not land on Planet 9.'], ['DRAGON-O-RAMA', 'Fight the Green Dragon. Flirt with the barmaid. (Only 3 turns a day.)'], ['NET-GOLF 4U', 'Eighteen holes of text-mode golf. The wind is always strong.'], ['e-FISHING DERBY', 'Catch the big one. Lie about the big one.'], ['CYBER-PIRATES', 'Arr. In ANSI colour.'], ['TRIVIA-TRON 3000', 'Ten questions. The answers are all "1996".']];
  const CIPHER = 'YTRSEZHW SPCP. TQ JZF NLY CPLO ESTD, JZF LCP NWPGPCPC ESLY XJ XLESD EPLNSPC. XJ ZWO OPDV TD DETWW ZY ESTD AN. NWTNV DELCE, ESPY CFY, LYO EJAP ZHWOPDV. ESP OCLHPC TD WZNVPO. JZF VYZH JZFC YPCO YFXMPCD.';

  function bbs(el) {
    el.className = 'nc';
    A.secret('arg.hex'); Ev.argStep(2);
    let screen = prog().bbs ? 'menu' : 'front', ring = 0;
    const go = s => { screen = s; draw(); sfx('click'); el.scrollIntoView && el.scrollIntoView({ block: 'start' }); };
    function draw() {
      if (screen === 'front') {
        el.innerHTML = `<div class="nc-wrap"><h1 class="blink">NO CARRIER</h1><pre style="text-align:center">THE NO CARRIER BBS  *  1993 - 1996  *  NODE 1 OF 1  *  14,400 BAUD</pre>
          ${MODEM}<p class="nc-cap">my trusty modem. she screams beautifully.</p>
          <div class="nc-box"><pre>This board has closed. Thanks to everyone who called.
3 years. 41,207 calls. 1 sysop. 0 viruses (honest).

The line stays open, for anyone who knows the way in.</pre></div>
          <form class="nc-form" autocomplete="off"><label for="ncU">USER:</label><input id="ncU" maxlength="16" spellcheck="false"><label for="ncP">PASSWORD:</label><input id="ncP" type="password" maxlength="20"><span></span><button type="submit">LOG ON</button></form><p class="nc-err" style="text-align:center"></p>
          <p class="nc-cap">Best viewed at 80 columns.</p></div>`;
        el.querySelector('form').addEventListener('submit', ev => {
          ev.preventDefault(); const u = el.querySelector('#ncU').value, p = el.querySelector('#ncP').value, e = el.querySelector('.nc-err');
          if (!u || !p) { e.textContent = 'USER AND PASSWORD, PLEASE.'; return; }
          e.textContent = 'CHECKING...';
          if (!Ev.send({ t: 'argTry', k: 'bbs', u, a: p })) e.textContent = 'NO CARRIER (you are not connected to the JackNet).';
        });
      } else if (screen === 'menu') {
        el.innerHTML = `<div class="nc-wrap"><pre>NO CARRIER BBS  -  MAIN MENU            Logged on: NIGHTOWL (SysOp)
Time left today: 59 min                  Node 1   14400 baud
-----------------------------------------------------------------</pre>
          <div class="nc-menu"><button data-g="msgs"><b>[M]</b> Message Base (6 messages)</button><button data-g="doors"><b>[D]</b> Door Games</button><button data-g="files"><b>[F]</b> File Area</button><button data-g="bull"><b>[B]</b> Bulletins</button><button data-g="bye"><b>[G]</b> Goodbye (log off)</button></div>
          <pre>Select: _</pre></div>`;
      } else if (screen === 'msgs') {
        el.innerHTML = `<div class="nc-wrap"><pre>MESSAGE BASE: GENERAL                              [Q]uit to menu
-----------------------------------------------------------------</pre>${MSGS.map(m => `<div class="nc-msg"><div class="hd">#${m[0]} FROM: ${esc(m[1])}  TO: ${esc(m[2])}\nSUBJ: ${esc(m[3])}</div><pre>${esc(m[4])}</pre></div>`).join('')}<div class="nc-menu"><button data-g="menu"><b>[Q]</b> Quit to main menu</button></div></div>`;
      } else if (screen === 'doors') {
        el.innerHTML = `<div class="nc-wrap"><pre>DOOR GAMES                                         [Q]uit to menu
-----------------------------------------------------------------</pre><div class="nc-menu">${DOORS.map((d, i) => `<button data-door="${i + 1}"><b>[${i + 1}]</b> ${esc(d[0])} - ${esc(d[1])}</button>`).join('')}<button data-g="menu"><b>[Q]</b> Quit to main menu</button></div>
          <form class="nc-form"><label for="ncD">DOOR #:</label><input id="ncD" maxlength="2" inputmode="numeric"><span></span><button type="submit">KNOCK</button></form><p class="nc-err" style="text-align:center"></p></div>`;
        el.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); door(+el.querySelector('#ncD').value); });
        el.querySelectorAll('[data-door]').forEach(b => b.addEventListener('click', () => door(+b.dataset.door)));
      } else if (screen === 'ring') {
        const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        el.innerHTML = `<div class="nc-wrap"><pre>DOOR 7: THE DECODER RING                           [Q]uit to menu
-----------------------------------------------------------------
You found my last door. Here is my last message, locked with my
decoder ring. Turn the ring until it makes sense.</pre>
          <div class="nc-box"><pre class="nc-c">${CIPHER}</pre></div>
          <div class="nc-ring"><div class="abc top"></div><div class="abc bot"></div><div class="ctl"><button class="nc-btn" type="button" data-r="-1">&lt; TURN</button><b class="nc-k">0</b><button class="nc-btn" type="button" data-r="1">TURN &gt;</button></div></div>
          <p>DECODED:</p><div class="nc-out"></div><div class="nc-menu"><button data-g="menu"><b>[Q]</b> Quit to main menu</button></div></div>`;
        const upd = () => {
          el.querySelector('.abc.top').textContent = abc;
          el.querySelector('.abc.bot').textContent = shift(abc, -ring);
          el.querySelector('.nc-k').textContent = ring;
          const out = shift(CIPHER, -ring); el.querySelector('.nc-out').textContent = out;
          if (/^NIGHTOWL HERE/.test(out)) { A.secret('arg.ring'); Ev.argStep(10); }
        };
        el.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => { ring = (ring + +b.dataset.r + 26) % 26; upd(); sfx('click'); }));
        upd();
      } else if (screen === 'files') {
        el.innerHTML = `<div class="nc-wrap"><pre>FILE AREA 1: GENERAL                               [Q]uit to menu
-----------------------------------------------------------------
NAME          SIZE    DESCRIPTION
ANSIDRAW.ZIP   88K    Draw in ANSI. Make your own BBS menus!
TETRISX.ZIP   140K    Falling blocks. 7 pieces. Yes, I counted.
CUBESOLV.ZIP   12K    Solves a 3x3x3. Faces: 6. Stickers: 54.
BITBYTE.TXT     1K    A byte is 8 bits. A nibble is 4. Eat both.
NOCARRIR.LOG    3K    (moved to callers' own PCs, see C:\\JACKOS\\TEMP)
OWLDESK.EXE    44K    [SYSOP ONLY] my desk. it is on your PC now.
-----------------------------------------------------------------
Downloads are closed. The file area is read-only.</pre><div class="nc-menu"><button data-g="menu"><b>[Q]</b> Quit to main menu</button></div></div>`;
      } else if (screen === 'bull') {
        el.innerHTML = `<div class="nc-wrap"><pre>BULLETINS                                          [Q]uit to menu
-----------------------------------------------------------------
1. RULES: Be nice. No warez. No shouting (except in CAPS, which
   is just how BBSes look).
2. SYSOP'S HABIT: every message I write starts with my name.
   Every single one. Mom says it's like signing a letter at the
   top. I say it's my trademark.
3. The board closes on 31/12/96 at midnight. NO CARRIER.</pre><div class="nc-menu"><button data-g="menu"><b>[Q]</b> Quit to main menu</button></div></div>`;
      } else if (screen === 'bye') {
        el.innerHTML = `<div class="nc-wrap"><pre>Thanks for calling NO CARRIER BBS!

+++
ATH0</pre><h1 class="blink">NO CARRIER</h1><div class="nc-menu"><button data-g="menu"><b>[R]</b> Redial</button></div></div>`;
      }
      el.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => go(b.dataset.g)));
    }
    function door(n) {
      const e = el.querySelector('.nc-err');
      if (n === 7) { A.secret('arg.door'); Ev.argStep(9); go('ring'); return; }
      if (n >= 1 && n <= 6) { e.textContent = `${DOORS[n - 1][0]}: THIS DOOR IS CLOSED. THE SYSOP TOOK THE FLOPPY HOME.`; sfx('uhoh'); return; }
      e.textContent = 'NO SUCH DOOR ON THE MENU.'; sfx('uhoh');
    }
    const off = Ev.on('argRes', m => {
      if (!el.isConnected) return off();
      if (m.k !== 'bbs') return;
      const e = el.querySelector('.nc-err');
      if (m.slow) { if (e) e.textContent = 'TOO MANY TRIES. WAIT A FEW SECONDS.'; return; }
      if (m.ok) { setP('bbs', 1); A.secret('arg.bbs'); Ev.argStep(8); sfx('modem'); go('menu'); }
      else if (e) { e.textContent = 'ACCESS DENIED. NO CARRIER.'; sfx('uhoh'); }
    });
    draw();
  }

  // ================================================================ www.owlsnest.cyb
  const OWL = '<svg class="owl" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-label="owl"><path d="M8 6l4 4h8l4-4v18l-8 6-8-6z" fill="#8a6a3a" stroke="#000"/><circle cx="12.5" cy="14" r="3.5" fill="#ffd400" stroke="#000"/><circle cx="19.5" cy="14" r="3.5" fill="#ffd400" stroke="#000"/><rect x="12" y="13" width="2" height="2" fill="#000"/><rect x="19" y="13" width="2" height="2" fill="#000"/><path d="M15 18h2l-1 2z" fill="#ff8000"/><path d="M11 22h10M12 25h8" stroke="#5a3a1a"/><rect x="6" y="30" width="20" height="2" fill="#5a3a1a"/></svg>';
  const fmtDur = ms => { const m = Math.round(ms / 60000); return m < 60 ? m + ' min' : m < 1440 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : Math.floor(m / 1440) + 'd ' + Math.floor((m % 1440) / 60) + 'h'; };
  const fmtWhen = ts => { const d = new Date(ts); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/99 ' + Ev.ukTime(ts); };
  function hallTable(list, meName) {
    return `<table class="on-hall"><tr><th>#</th><th>Puzzler</th><th>Solved</th><th>Time taken</th></tr>${list.length ? list.map(r => `<tr${r[1] === meName ? ' class="me"' : ''}><td>${r[0]}</td><td>${esc(r[1])}</td><td>${fmtWhen(r[2])}</td><td>${fmtDur(r[3])}</td></tr>`).join('') : '<tr><td colspan="4"><i>Nobody yet. Be the first!</i></td></tr>'}</table>`;
  }
  function nest(el) {
    el.className = 'on-nest';
    A.secret('arg.nest'); Ev.argStep(13);
    const me = () => (window.Net && Net.me && Net.me.nick) || '';
    const solvedView = (m) => {
      A.secret('arg.solved'); setP('solved', 1);
      const pos = m && m.pos, member = m ? m.member : Ev.member();
      el.innerHTML = `<div class="w">${OWL}<h1>CARRIER DETECTED</h1>
        <p>Well. You actually did it.</p>
        <p>I ran NO CARRIER from my bedroom for three years. I was twelve when I started. Every night at 11 the house went quiet, the modem screamed, and people from all over the county dialled in to swap messages and play door games and argue about whether Planet 9 existed. (It didn't. I never finished it.)</p>
        <p>When the board closed I didn't want it to just... stop. So I hid the bits of it all over this computer and the JackNet, and waited to see who would put it back together. You did. That makes you a proper nerd, and I mean that as the highest compliment there is.</p>
        <p>The three words were my rule for the board. Some nights it was the only thing that kept it running: <b>never hang up</b>. Keep the line open. Somebody might be calling.</p>
        <p style="text-align:right">~NIGHTOWL~</p>
        ${member ? `<div class="on-cert">This is to certify that<b>${esc(me())}</b>cracked the NO CARRIER puzzle trail${pos ? ` and is <b style="display:inline;font-size:18px">Puzzler #${pos}</b>` : ''}.<br><small>Signed, NIGHTOWL (SysOp) &middot; ${fmtWhen(Ev.now())}</small></div>` : `<div class="on-cert">You solved it! <b>Log on to JackNet</b>(it's FREE) and type the three words again to sign the Hall of Puzzlers and claim your prize.</div>`}
        <h2 style="color:#ffd400;font:bold 20px Georgia">The Hall of Puzzlers</h2><div class="on-hl">${hallTable((m && m.hall) || [], me())}</div>
        <p class="small" style="text-align:center;margin-top:14px">Members only. In order of finishing. Time taken is from your first visit to NO CARRIER.<br><a href="http://www.puzzleboard.cyb/" style="color:#ffd400">The Puzzle Board</a></p></div>`;
      if (!m) Ev.send({ t: 'argHall' });
    };
    const ask = () => {
      el.innerHTML = `<div class="w">${OWL}<h1>The Owl's Nest</h1><p style="text-align:center">You found my nest. One last thing.<br>Three words. You picked them up on the way. In order, please.</p>
        <form autocomplete="off"><input class="on-a" maxlength="40" placeholder="word one, word two, word three" aria-label="The three words"><button class="btn" type="submit">SAY THEM</button></form><p class="on-e" style="text-align:center;color:#ff8080"></p>
        <p class="small" style="text-align:center;color:#887">Hoo. Hoo.</p></div>`;
      el.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); const a = el.querySelector('.on-a').value; if (!a.trim()) return; el.querySelector('.on-e').textContent = 'The owl is thinking...'; if (!Ev.send({ t: 'argTry', k: 'nest', a })) el.querySelector('.on-e').textContent = 'You are not connected to the JackNet.'; });
    };
    const off = Ev.on('argRes', m => {
      if (!el.isConnected) return off();
      if (m.k !== 'nest') return;
      if (m.slow) { const e = el.querySelector('.on-e'); if (e) e.textContent = 'Slow down! Owls are not quick.'; return; }
      if (m.ok) { sfx('solve'); solvedView(m); if (m.fresh) Desk.toast('HALL OF PUZZLERS', `You are Puzzler #${m.pos}! Your prize is in your Rupee wallet.`, 9000); }
      else { const e = el.querySelector('.on-e'); if (e) e.textContent = 'The owl blinks slowly. That is not it. (Three words, in the order you found them.)'; sfx('uhoh'); }
    });
    const off2 = Ev.on('argHall', m => { if (!el.isConnected) return off2(); const box = el.querySelector('.on-hl'); if (box) box.innerHTML = hallTable(m.list || [], me()); });
    if (prog().solved) solvedView(null); else ask();
  }

  // ================================================================ www.puzzleboard.cyb (and the hints)
  const STEPS = [
    ['A note in the page source', () => found('arg.hex'), ['Start at the very start: the JACK ATTACK! home page. In JackNet Explorer, use View > Source.', 'Look for a comment between &lt;!-- and --&gt;. Those pairs of digits and letters are hexadecimal: each pair is one letter.', 'Hex 77 is "w" and 2E is ".". It spells a web address. Type it into the address bar.']],
    ['The closed board', () => found('arg.log'), ['That old board\'s front page has a source too. View > Source again.', 'The comment is scrambled the old Usenet way: ROT13. Every letter moves 13 places (A&harr;N, B&harr;O, and so on).', 'It says where on YOUR computer the log went. Find it with My Computer, or type the file name into Start > Run.']],
    ['The log', () => found('arg.signal'), ['Read the sysop\'s notes in the log, line by line.', 'Look down the left-hand side of the notes. Just the first letters.', 'It spells a program. It only runs at the JACK-DOS Prompt (Start > Programs). Type its name there. And keep WORD ONE safe!']],
    ['The signal', () => (prog().s | 0) >= 5, ['The program talks in Morse code: dots and dashes.', 'In Morse, numbers are five symbols long. 1 is .---- and 2 is ..--- ... 6 is -.... and 0 is -----. Spot the pattern?', 'The three digits are a page number on CYBERTEXT, the text service at www.whatson.jnet. Type them in.']],
    ['The page that is not in the index', () => found('arg.ttx'), ['Telly-Text pages can hide things.', 'Look at the buttons under the screen.', 'Press REVEAL. (And keep WORD TWO!)']],
    ['The modem', () => found('arg.bbs'), ['Go back to the closed board. There is a picture of a modem.', 'Right-click the picture (or hold your finger on it) and pick Properties.', 'Read the picture\'s file name. "pw" means password.']],
    ['Logging on', () => found('arg.bbs'), ['You need a user name AND a password.', 'The user name is in the log on your C: drive. Who logged in at 23:41:16?', 'Log on to the board with that name and the password from the picture.']],
    ['The message base', () => found('arg.door'), ['Read the messages. The last one is from the sysop.', 'Those 1s and 0s are binary, eight at a time. Each group of eight is one letter (ASCII). 01000001 is A.', 'It tells you which door to knock on. Go to Door Games and type the number.']],
    ['The decoder ring', () => found('arg.ring'), ['The ring shifts every letter along the alphabet. Turn it.', 'One of the bulletins says how every message he writes begins.', 'Turn the ring until the first word reads NIGHTOWL. Then read the rest.']],
    ['Somebody else\'s desk', () => found('arg.desk'), ['The decoded message says what to do: Start, then Run.', 'Type the name it gives you, exactly as written.', 'OWLDESK']],
    ['The locked drawer', () => found('arg.drawer'), ['Read the sticky notes on the desk.', 'Count the different shapes that fall in a falling-blocks game. How many faces on a cube? How many bits in a byte?', 'The numbers go in the order the notes say: first, second, third.']],
    ['The drawer', () => found('arg.nest'), ['The postcard is in a simple number code.', 'A=1, B=2, C=3... It gives you WORD THREE.', 'The floppy\'s label is jumbled. Unscramble it into two words: where an owl lives. Then it is an address.']],
    ['The nest', () => found('arg.solved'), ['The nest wants three words, in order.', 'Word one was in the log. Word two was on the telly-text. Word three was on the postcard.', 'Type all three, in order, with spaces between them.']],
  ];
  function board(el) {
    el.className = 'pz';
    const shown = Ev.store.get('jhp_events_hints', {});
    let hall = null;
    const draw = () => {
      if (!el.isConnected) return;
      const on = STEPS.findIndex(s => !s[1]()); const cur = on < 0 ? STEPS.length : on;
      const started = (prog().s | 0) >= 1 || found('arg.hex');
      el.innerHTML = `<div class="pz-top"><h1>The <span>Puzzle</span> Board</h1><div class="small">Brain teasers, riddles and "I'm stuck!" threads since 1997. 4,182 members. Be nice. No spoilers in thread titles.</div></div>
        <div class="pz-wrap">
        <div class="pz-t"><b>THREAD: Weird comments in the JACK ATTACK! home page source?? (47 replies)</b>
          <div class="pz-p"><div class="u"><b>CubeKid99</b>Posts: 212</div><div class="x">OK so I was looking at the source of the JACK ATTACK! home page (View &gt; Source, you know) and there's a comment in there signed <b>~NIGHTOWL~</b> with a load of numbers and letters. Is this an ARG thing?? Has anyone got anywhere with it?</div></div>
          <div class="pz-p"><div class="u"><b>Ms_Byte</b>Posts: 1,034</div><div class="x">It's a trail! I've done about half. It goes all over the place: the web, your own PC, DOS, the lot. No spoilers, but you won't need anything except what's on the computer and some proper nerd knowledge. If you finish you get in the <b>Hall of Puzzlers</b>.</div></div>
          <div class="pz-p"><div class="u"><b>Moderator</b>Posts: 9,999</div><div class="x">Hints are below, step by step. Each one gets a bit more helpful. Please only open what you need! ${hall ? `<br><br><b>Hall of Puzzlers:</b> ${hall.n} solved so far.${hall.list[0] ? ` First ever: <b>${esc(hall.list[0][1])}</b>.` : ' Nobody has solved it yet!'}` : ''}</div></div>
        </div>
        <div class="pz-t"><b>STUCK? Progressive hints, step by step ${started ? `(you are on step ${Math.min(cur + 1, STEPS.length)} of ${STEPS.length})` : ''}</b><div class="pz-steps" style="padding:8px">${STEPS.map((s, i) => {
          const done = i < cur, now = i === cur, n = shown[i] | 0;
          return `<div class="pz-step${done ? ' done' : ''}${now && started ? ' now' : ''}"><b>Step ${i + 1}: ${done || now || i < 2 ? esc(s[0]) : '???'}</b>${done ? ' &#10004;' : ''}${s[2].slice(0, n).map((x, k) => `<div class="pz-hint">Hint ${k + 1}: ${x}</div>`).join('')}${n < 3 && (done || now || i === 0) ? `<div class="hn"><button class="btn" type="button" data-h="${i}">${n ? 'Another hint' : 'Show a hint'}${n === 2 ? ' (nearly the answer!)' : ''}</button></div>` : ''}</div>`;
        }).join('')}${cur >= STEPS.length ? '<p><b>You did it! Your name is in the Hall of Puzzlers at the Owl\'s Nest.</b></p>' : ''}</div></div>
        <div class="pz-t"><b>THREAD: Riddle of the week</b><div class="pz-p"><div class="u"><b>RiddleMeThis</b>Posts: 588</div><div class="x">The more you take, the more you leave behind. What am I? <span class="pz-spoil" tabindex="0">Footsteps!</span> (click the black box for the answer)</div></div></div>
        <div class="pz-t"><b>THREAD: How many ways can a Rubrick's Cube be mixed up?</b><div class="pz-p"><div class="u"><b>CubeKid99</b>Posts: 212</div><div class="x">My dad says it's "loads". It's actually 43,252,003,274,489,856,000. That's 43 quintillion. If you turned it once a second you'd still be going when the Sun burns out. I've done 11.</div></div></div>
        <div class="pz-t"><b>THREAD: The three light switches</b><div class="pz-p"><div class="u"><b>LogicLad</b>Posts: 77</div><div class="x">Three switches downstairs, one bulb upstairs. You can only go up once. How do you know which switch it is? <span class="pz-spoil" tabindex="0">Turn on switch 1 for ten minutes, turn it off, turn on switch 2, go up. On = 2. Off but warm = 1. Off and cold = 3.</span></div></div></div>
        <p class="small" style="text-align:center">The Puzzle Board runs on a 486 in a cupboard. Posting is closed while we move to a bigger cupboard. &middot; <a href="http://www.whatson.jnet/">What's On?</a></p></div>`;
      el.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.h; shown[i] = Math.min(3, (shown[i] | 0) + 1); Ev.store.set('jhp_events_hints', shown); A.secret('arg.board'); draw(); }));
      el.querySelectorAll('.pz-spoil').forEach(s => s.addEventListener('click', () => s.classList.toggle('on')));
    };
    const off = Ev.on('argHall', m => { if (!el.isConnected) return off(); hall = m; draw(); });
    Ev.send({ t: 'argHall' });
    draw();
  }

  // ================================================================ OWLDESK.EXE (Start > Run > owldesk)
  function desk() {
    A.secret('arg.desk'); Ev.argStep(11);
    const b = h('div', 'od'); const dial = [0, 0, 0];
    b.innerHTML = `<div class="od-top">
        <div class="od-note" style="--r:-3deg"><b>FIRST:</b> how many different pieces fall in a falling-blocks game? (count the shapes, not the blocks)</div>
        <div class="od-note" style="--r:2deg"><b>SECOND:</b> how many faces on a cube? (any cube. even a Rubrick's)</div>
        <div class="od-note" style="--r:-1deg"><b>THIRD:</b> how many bits in one byte?</div>
        <div class="od-thing">&#9749; A mug: WORLD'S OKAYEST SYSOP</div>
        <div class="od-thing">&#128190; A box of 44 floppy disks, all labelled "BACKUP (DO NOT FORMAT)"</div>
        <div class="od-thing">&#128268; A modem cable going nowhere</div>
      </div>
      <div class="od-drawer"><b>The drawer is locked.</b><div class="od-lock">${[0, 1, 2].map(i => `<div class="od-dial"><button class="btn" type="button" data-u="${i}" aria-label="Up">&#9650;</button><b>0</b><button class="btn" type="button" data-d="${i}" aria-label="Down">&#9660;</button></div>`).join('')}</div><button class="btn od-try" type="button" style="min-height:32px;font-weight:bold">Pull the drawer</button><div class="od-res" style="margin-top:6px"></div><div class="od-in"></div></div>`;
    const w = A.win("NIGHTOWL's Desk", b, { w: 440, icon: Ev.ICO.owl, minW: 280 });
    const show = () => b.querySelectorAll('.od-dial b').forEach((x, i) => { x.textContent = dial[i]; });
    b.querySelectorAll('[data-u]').forEach(x => x.addEventListener('click', () => { dial[+x.dataset.u] = (dial[+x.dataset.u] + 1) % 10; show(); sfx('click'); }));
    b.querySelectorAll('[data-d]').forEach(x => x.addEventListener('click', () => { dial[+x.dataset.d] = (dial[+x.dataset.d] + 9) % 10; show(); sfx('click'); }));
    const open = () => {
      b.querySelector('.od-res').innerHTML = '<b>*CLICK* The drawer slides open!</b>'; b.querySelector('.od-drawer > b').textContent = 'The drawer is open.';
      b.querySelector('.od-in').innerHTML = `<div class="od-floppy">3&frac12;" 1.44 MB<div class="lb">LAST FLOPPY<br>my nest is at:<br>www. T S E N S L W O .cyb<br><small>(I jumbled it. obviously.)</small></div></div>
        <div class="od-card"><b>Postcard</b> (no stamp)<br><br>23 15 18 4 &nbsp;/&nbsp; 20 8 18 5 5 &nbsp;/&nbsp; 9 19 &nbsp;/&nbsp; 21 16<br><br><small>A is 1. You know the rest. ~N</small></div>`;
      b.querySelector('.od-try').disabled = true;
    };
    b.querySelector('.od-try').addEventListener('click', () => {
      if (dial.join('') === '768') { A.secret('arg.drawer'); Ev.argStep(12); setP('drawer', 1); sfx('solve'); open(); }
      else { b.querySelector('.od-res').textContent = 'It rattles. Still locked.'; sfx('thud'); }
    });
    if (prog().drawer) { dial.splice(0, 3, 7, 6, 8); show(); open(); }
    return w;
  }

  window.EvArg = { bbs, nest, board, desk, STEPS };
})();

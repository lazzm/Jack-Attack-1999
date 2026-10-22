/* JSN - the JackNet Network (http://www.jsn.jnet/): the big busy 1999 start page. Channel tabs, search, JackMail,
 * horoscopes, chat rooms and the JSN Messenger Service download page (a teaser until 22/07/99). Loaded by js/jsn.js. */
(function () {
  'use strict';
  if (window.JSNPortal || !window.JSN) return;
  const A = Apps, J = JSN, esc = A.esc, store = A.store;
  const $ = id => document.getElementById(id);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const qs = (el, s) => el.querySelector(s), qsa = (el, s) => [...el.querySelectorAll(s)];
  const H = 'http://' + J.HOST;
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = () => { const t = Desk.today99(); return `${DAYS[t.date.getDay()]}, ${t.d} ${MONTHS[t.m - 1]} 1999`; };
  const hash = s => { let x = 2166136261; for (const c of String(s)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };
  const dayKey = () => { const t = Desk.today99(); return t.m * 100 + t.d; };
  const pickD = (arr, salt) => arr[hash(salt + ':' + dayKey()) % arr.length];
  const exists = url => !window.WebDir || !WebDir.byUrl || !!WebDir.byUrl(url);
  const has = id => !window.Setup || !Setup.has || Setup.has(id);

  // ================================================================ CSS (the portal look: white, busy, coloured tabs)
  if (!$('jsn-p-css')) {
    const st = h('style'); st.id = 'jsn-p-css';
    st.textContent = `
.jp{background:#fff;color:#000;font:12px Verdana,Arial,sans-serif;min-height:520px;padding:0 0 10px}
.jp a{color:#0033aa}
.jp-top{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;padding:8px 10px 4px;border-bottom:1px solid #c8d4ec}
.jp-top .jsn-logo{font-size:38px}
.jp-top .jp-tag{font:bold 12px Verdana,sans-serif;color:#1a3a8a;padding-bottom:4px}
.jp-top .jp-date{font-size:11px;color:#555;padding-bottom:4px}
.jp-toplinks{margin-left:auto;display:flex;flex-wrap:wrap;gap:2px 10px;font-size:11px;padding-bottom:4px}
.jp-search{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 10px;background:linear-gradient(#1a4ea8,#2f66c4);color:#fff;font:bold 11px Verdana,sans-serif}
.jp-search input{flex:1;min-width:120px;max-width:300px;font:12px Arial,sans-serif;padding:2px}
.jp-search button{font:bold 11px Verdana,sans-serif;padding:2px 8px}
.jp-search small{font-weight:normal;color:#d8e4ff}
.jp-search small a{color:#fff}
.jp-tabs{display:flex;flex-wrap:wrap;gap:2px;padding:5px 8px 0;background:#e8eef8;border-bottom:3px solid var(--tc,#1a4ea8)}
.jp-tabs button{font:bold 11px Verdana,sans-serif;color:#fff;border:0;border-radius:6px 6px 0 0;padding:4px 9px 3px;cursor:pointer;opacity:.82}
.jp-tabs button.on{opacity:1;padding-bottom:6px;margin-top:-2px;text-decoration:underline}
.jp-grid{display:grid;grid-template-columns:190px minmax(0,1fr) 200px;gap:10px;padding:10px}
@media (max-width:820px){.jp-grid{grid-template-columns:minmax(0,1fr) 190px}.jp-grid .jp-l{order:2}.jp-grid .jp-m{grid-column:1/-1;order:1}.jp-grid .jp-r{order:3}}
@media (max-width:520px){.jp-grid{grid-template-columns:minmax(0,1fr);padding:6px}.jp-top .jsn-logo{font-size:30px}.jp-toplinks{margin-left:0}}
.jp-box{border:1px solid #9ab0d8;margin:0 0 10px;background:#fff}
.jp-box > h3{margin:0;padding:3px 7px;font:bold 12px Verdana,sans-serif;color:#fff;background:var(--bc,#1a4ea8);border-radius:6px 6px 0 0;display:flex;align-items:center;gap:5px}
.jp-box > div{padding:6px 7px}
.jp-box ul{margin:0;padding:0 0 0 14px}
.jp-box li{margin:0 0 4px}
.jp-box label{display:block;font-size:11px;margin:3px 0 1px}
.jp-box input[type=text]{width:100%;box-sizing:border-box;font:12px Arial,sans-serif}
.jp-small{font-size:10px;color:#555}
.jp-new{display:inline-block;background:#e10600;color:#ff0;font:bold 10px Verdana,sans-serif;padding:0 4px;margin-right:3px;vertical-align:1px}
.jp-hero{display:flex;gap:12px;align-items:center;padding:10px;margin:0 0 10px;border:2px solid #f2b400;background:linear-gradient(#fffbe0,#fff1a8);flex-wrap:wrap}
.jp-hero .pp{flex:none}
.jp-hero h2{margin:0 0 4px;font:bold 18px Verdana,sans-serif;color:#1a3a8a}
.jp-hero p{margin:0 0 6px}
.jp-hero.soon{border-color:#9ab0d8;background:linear-gradient(#f2f6ff,#dfe8fa)}
.jp-hero.soon h2{color:#555}
.jp-dl{display:inline-block;background:linear-gradient(#ffd23a,#f29a00);border:2px solid;border-color:#ffe890 #a05a00 #a05a00 #ffe890;color:#000!important;font:bold 13px Verdana,sans-serif;padding:5px 12px;text-decoration:none!important;cursor:pointer}
.jp-dl.got{background:linear-gradient(#bfe8b0,#6cc050);border-color:#e0ffd0 #2a6a1a #2a6a1a #e0ffd0}
.jp-chan{border:1px solid var(--tc,#1a4ea8);margin:0 0 10px}
.jp-chan h2{margin:0;padding:4px 8px;font:bold 15px Verdana,sans-serif;color:#fff;background:var(--tc,#1a4ea8)}
.jp-chan .jp-cb{padding:8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px 14px}
.jp-chan .jp-cb div b a{font-size:12px}
.jp-chan .jp-cb div span{display:block;font-size:11px;color:#333;margin-top:1px}
.jp-heads li{margin-bottom:5px}
.jp-heads small{color:#808080}
.jp-sign{width:100%;font:12px Verdana,sans-serif}
.jp-read{margin-top:5px;font-size:11px;line-height:1.45;min-height:48px}
.jp-foot{text-align:center;font-size:10px;color:#555;border-top:1px solid #c8d4ec;padding:8px 10px 0;margin:0 10px}
.jp-foot a{margin:0 4px}
.jp-page{padding:10px 14px;max-width:760px}
.jp-page h1{font:bold 22px Verdana,sans-serif;color:#1a3a8a;margin:4px 0 8px}
.jp-page h2{font:bold 14px Verdana,sans-serif;color:#1a3a8a;margin:14px 0 4px}
.jp-feat{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px;margin:8px 0}
.jp-feat div{border:1px solid #c8d4ec;background:#f4f7fd;padding:7px;font-size:11px}
.jp-feat b{display:block;color:#1a3a8a;font-size:12px;margin-bottom:2px}
.jp-shot{display:inline-block;border:2px solid;border-color:#fff #404040 #404040 #fff;background:#c0c0c0;padding:2px;vertical-align:top;margin:4px 12px 8px 0;font:11px Tahoma,sans-serif}
.jp-shot .t{background:linear-gradient(90deg,#000080,#1084d0);color:#fff;font-weight:bold;padding:2px 4px}
.jp-shot .b{background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;margin-top:2px;padding:4px 6px;width:150px;line-height:1.55}
.jp-shot .b .g{color:#1a3a8a;font-weight:bold}
.jp-rooms{width:100%;border-collapse:collapse;font-size:12px}
.jp-rooms th{background:#1a4ea8;color:#fff;text-align:left;padding:3px 6px}
.jp-rooms td{border-bottom:1px solid #dde4f2;padding:5px 6px;vertical-align:top}
.jp-rooms td a{font-weight:bold;cursor:pointer}
.jp-stars{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}
.jp-stars button{text-align:left;font:12px Verdana,sans-serif;background:#f4f7fd;border:1px solid #9ab0d8;padding:7px;cursor:pointer;color:#000}
.jp-stars button b{color:#5a1a9a;display:block}
.jp-stars button span{display:block;margin-top:4px;font-size:11px;line-height:1.45}
.jp-stars button.on{background:#fffbe0;border-color:#f2b400}
.jp-safe{border:2px dashed #e10600;background:#fff6f0;padding:6px 10px;margin:10px 0;font-size:11px}
`;
    document.head.appendChild(st);
  }

  // ================================================================ the channels (all link to sites that exist on the JackNet)
  const CH = [
    ['news', 'News', '#c02020', [['http://www.jackattack.jnet/news', 'JackNet News', 'The headlines, every day, from the JackNet newsroom.'], ['http://www.jackdot.jnet/', 'Jackdot', 'News for nerds. Chips, space, games and Y2K.'], ['http://www.jackfax.jnet/', 'JackFax', 'Teletext on your computer. Try page 100.'], ['http://www.bytesize.zyne/', 'BYTESIZE', 'The e-zine for kids with modems.']]],
    ['sport', 'Sport', '#1a8a2a', [['http://roversjuniors.jnet/', 'Rovers Juniors FC', 'Results, fixtures and the man of the match.'], ['http://www.jackfax.jnet/', 'JackFax Sport', 'Football scores on page 302.'], ['http://www.yoyozone.kidz/', 'Yo-Yo Trick Zone', Cast.t('Is it a sport? {club3} says yes.')]]],
    ['weather', 'Weather', '#1a8ad8', [['http://www.jackattack.jnet/weather', 'JackNet Weather', "Today's forecast, and whether to bring a coat. (Bring a coat.)"]]],
    ['ent', 'Entertainment', '#9a1aa8', [['http://www.trailerpark.flick/', 'The Trailer Park', 'Movie trailers online! Bring a packed lunch while they load.'], ['http://www.aintitkoolnews.infobahn/', "Ain't It Kool News", 'Film rumours and spy reports.'], ['http://www.jacktoonz.toonz/', 'JackToonz', 'Cartoons on the Web.'], ['http://www.radiojack.wubwub/', 'Radio Jack 99.9', 'Radio on the Internet!'], ['http://www.midiheaven.wubwub/', 'MIDI Heaven', 'Tunes for your home page.'], ['http://jokeoftheday.wubwub/', 'Joke of the Day', 'Groan.']]],
    ['money', 'Money', '#a07800', [['http://www.jacknetbank.webcom/', 'JackNet Bank Online', 'Banking from your bedroom.'], ['http://www.jackexchange.grot/', 'Jack Stock Exchange', 'Buy low. Sell high. Feed the Eggbert.'], ['http://www.jacklotto.grot/', 'JackLotto', 'It could be YOU. (It will not be you.)']]],
    ['shop', 'Shopping', '#d8641a', [['http://www.jackbay.webcom/', 'JackBay', 'Online auctions. Bid on anything!'], ['http://www.rupeeshop.jnet/', 'The Rupee Emporium', 'Da shop for everyfing.'], ['http://www.gemexchange.grot/', 'Gem Exchange', 'Online shop.'], ['http://www.ecardz.kidz/', 'eCardz', 'Send an e-card to a mate.']]],
    ['games', 'Games', '#2a3ab8', [['http://www.jacknetzone.jnet/', 'JackNet Gaming Zone', 'Play cards and board games online with real people.'], ['http://www.jackattack.jnet/', 'JACK ATTACK! Online', 'The games mag wot Jack made.'], ['http://www.jackfaqs.w3b/', 'JackFAQs', 'Walkthroughs for every game.'], ['http://www.cheatz.w3b/', 'Top 100 Cheats', 'Well, 40.']]],
    ['comp', 'Computing', '#4a4a6a', [['http://www.sharewareshack.netz/', 'The Shareware Shack', 'Free downloads, including JSN Messenger.'], ['http://megahertzmike.cyb/', "Megahertz Mike's Upgrade Diary", 'More RAM! More MHz!'], ['http://www.hoaxwatch.netz/', 'HoaxWatch', 'Is that virus warning real? (No.)'], ['http://www.desktopdazzle.webcom/', 'Desktop Dazzle', 'Wallpapers, cursors and themes.']]],
    ['kids', 'Kids', '#e0309a', [['http://www.webtoyz.kidz/', 'Web Toyz', 'Bubble wrap. On the Internet.'], ['http://www.hamstercam.webcom/', 'Hamster Cam', 'Live hamster. Mostly asleep.'], ['http://www.adoptapixel.kidz/', 'Adopt-a-Pixel', 'Give a pixel a home.'], ['http://www.pokefacts.kidz/', Cast.t("{kidPoke}'s Pocket Critters Facts"), 'All 151. Allegedly.']]],
    ['chat', 'Chat', '#1a9a9a', null],
    ['msgr', 'Messenger', '#2fae3a', null],
  ];
  const chanLinks = c => c[3].filter(l => exists(l[0]));

  // ================================================================ bits
  const msgBox = () => J.released()
    ? (has('jsn') ? `<b>JSN Messenger Service</b> is installed! <a data-x="open">Open it</a> and sign in with your JackNet Passport.` : `<span class="jp-new">NEW!</span><b>JSN Messenger Service</b>: see when your friends are online and send instant messages. <a href="${H}/messenger.html">Download it FREE!</a>`)
    : `<b>Coming this summer:</b> the JSN Messenger Service. Find out when your friends are online. Talk to them instantly. <a href="${H}/messenger.html">Find out more</a>`;
  const SIGNS = [['Aries', '21 Mar - 19 Apr'], ['Taurus', '20 Apr - 20 May'], ['Gemini', '21 May - 20 Jun'], ['Cancer', '21 Jun - 22 Jul'], ['Leo', '23 Jul - 22 Aug'], ['Virgo', '23 Aug - 22 Sep'], ['Libra', '23 Sep - 22 Oct'], ['Scorpio', '23 Oct - 21 Nov'], ['Sagittarius', '22 Nov - 21 Dec'], ['Capricorn', '22 Dec - 19 Jan'], ['Aquarius', '20 Jan - 18 Feb'], ['Pisces', '19 Feb - 20 Mar']];
  const HA = ['The stars say today is a good day to tidy your room.', 'Somebody you know is about to lend you a game.', 'A surprise is coming your way. It might be chips.', 'Today the planets line up behind your computer.', 'A friend is thinking about you. Possibly about the money you owe them.', 'Mars is in your house. Tell Mom to hoover.', 'This is a lucky day for high scores.', 'Your homework will not do itself, says Saturn.', 'An old friend will get back in touch. Check your e-mail.', 'Today is a day for big ideas and small snacks.'];
  const HB = ['Do not trust anyone who says the Internet is a fad.', 'Be patient: good downloads come to those who wait.', 'Keep your password to yourself.', 'Save your game before trying anything brave.', 'Be kind to your modem. It is doing its best.', 'Share your sweets, but not your Pocket Critters cards.', 'Try something new for tea.', 'Remember to back up your floppies.', 'Go outside for ten minutes. It is still there.', 'Ask a grown-up before you buy anything online.'];
  const HC = ['Lucky number:', 'Lucky colour:', 'Lucky snack:', 'Lucky game:'];
  const HV = [['7', '42', '3', '64', '1999', '12'], ['purple', 'beige (like your PC)', 'lime green', 'electric blue', 'orange'], ['crisps', 'a Wagon Wheel', 'toast', 'a jam tart'], ['Blockology', 'Snake', 'Solitaire', 'Minesweeper... we mean Bugsweeper 2000']];
  const reading = i => { const c = hash('hc' + i + dayKey()) % HC.length; return `${pickD(HA, 'ha' + i)} ${pickD(HB, 'hb' + i)} <i>${HC[c]} ${pickD(HV[c], 'hv' + i)}.</i>`; };
  const top = sub => `<div class="jp-top">${J.LOGO_TXT}<span class="jp-tag">the JackNet Network${sub ? ' &gt; ' + sub : ''}</span><span class="jp-date">${today()}</span><span class="jp-toplinks"><a href="${H}/">JSN Home</a><a href="http://www.jackmail.webcom/">JackMail</a><a href="${H}/messenger.html">Messenger</a><a href="${H}/chat.html">Chat</a><a href="${H}/horoscopes.html">Horoscopes</a><a href="http://members.homepagez.webcom/">Home Pages</a><a href="${H}/help.html">Help</a></span></div>`;
  const searchBar = () => `<form class="jp-search" data-search><span>Search the Web for:</span><input type="text" maxlength="80" aria-label="Search the Web"><button class="btn" type="submit">Search</button><small>powered by JackSearch &middot; also try <a data-eng="waaaghooo">WAAAGHooo!</a> <a data-eng="askgubbinz">Ask Gubbinz</a></small></form>`;
  const foot = () => `<div class="jp-foot"><a href="${H}/">JSN Home</a>|<a href="${H}/channels.html">All Channels</a>|<a href="${H}/messenger.html">JSN Messenger</a>|<a href="${H}/chat.html">Chat</a>|<a href="${H}/about.html">About JSN</a>|<a href="${H}/help.html">Help</a>${window.Bridge && Bridge.askHome ? `|<a data-x="home">Make JSN your home page</a>` : ''}<br><br>&copy; 1999 JSN - the JackNet Network. All rights reserved. Terms of Use. Best viewed in JackNet Explorer 5 at 800x600.</div>`;

  // ================================================================ pages
  function home() {
    const n = J.onlineCount();
    const hero = J.released()
      ? `<div class="jp-hero"><span class="pp">${J.people('on', 56)}</span><div style="flex:1;min-width:180px"><h2><span class="jp-new">NEW!</span>JSN Messenger Service</h2><p>See which of your friends are online, and send them instant messages that pop up straight away. Free with your JackNet Passport!</p>${has('jsn') ? '<a class="jp-dl got" data-x="open">You\'ve got it! Open JSN Messenger</a>' : `<a class="jp-dl" href="${H}/messenger.html">Download it FREE!</a> <span class="jp-small">790 KB &middot; about 3 minutes on a 56K modem</span>`}</div></div>`
      : `<div class="jp-hero soon"><span class="pp">${J.people('off', 56)}</span><div style="flex:1;min-width:180px"><h2>Coming this summer...</h2><p>Something new from JSN. Find out when your friends are online. Talk to them instantly. No more "did you get my e-mail?"</p><a href="${H}/messenger.html">Find out more &gt;&gt;</a></div></div>`;
    const heads = [
      ['news', 'http://www.jackattack.jnet/news', 'Today\'s headlines from the JackNet newsroom'],
      ['ent', 'http://www.trailerpark.flick/', 'The newest film trailers are online (get the kettle on while they load)'],
      ['comp', 'http://www.hoaxwatch.netz/', 'Got an e-mail saying a virus will melt your monitor? Check it here first'],
      ['games', 'http://www.jacknetzone.jnet/', 'Play cards and board games against real people at the Gaming Zone'],
      ['shop', 'http://www.jackbay.webcom/', 'Bidding is hot on JackBay today'],
      ['money', 'http://www.jackexchange.grot/', 'Pixel pet shares: up, down, or eaten?'],
      ['kids', 'http://www.hamstercam.webcom/', 'Hamster Cam: the hamster is (probably) awake'],
      ['comp', 'http://www.sharewareshack.netz/', 'New downloads at the Shareware Shack'],
    ].filter(x => exists(x[1]));
    return `<div class="jp">${top()}${searchBar()}
<div class="jp-tabs" data-tabs>${CH.map((c, i) => `<button type="button" data-tab="${c[0]}" style="background:${c[2]}"${i ? '' : ' class="on"'}>${c[1]}</button>`).join('')}</div>
<div class="jp-grid">
 <div class="jp-l">
  <div class="jp-box" style="--bc:#d8641a"><h3>${'<svg viewBox="0 0 16 16" width="14" height="14"><rect x="1" y="3.5" width="14" height="9.5" fill="#fff" stroke="#000"/><path d="M1 3.5l7 5.5 7-5.5" fill="#ffe680" stroke="#000"/></svg>'}JackMail</h3><div><form data-mail><label>Sign-in name</label><input type="text" maxlength="30" value="${Net.me && Net.me.member ? esc(Net.me.nick) : ''}" aria-label="JackMail sign-in name"><div style="margin-top:5px;display:flex;gap:5px;align-items:center"><button class="btn" type="submit">Sign In</button><span class="jp-small">@jackmail.webcom</span></div></form><p class="jp-small" style="margin:6px 0 0">New to JackMail? <a href="http://www.jackmail.webcom/">Sign up FREE!</a><br>Free e-mail you can read from any computer.</p></div></div>
  <div class="jp-box" style="--bc:#2fae3a"><h3>${J.people('on', 14)}Messenger</h3><div>${msgBox()}</div></div>
  <div class="jp-box" style="--bc:#1a9a9a"><h3>Chat</h3><div><b>${n}</b> ${n === 1 ? 'person is' : 'people are'} on the JackNet right now. <a href="${H}/chat.html">Go to JSN Chat</a><ul style="margin-top:5px"><li><a data-x="chat">JACK ATTACK! Chat Room</a></li><li><a href="http://www.chatterbox.netz/">ChatterBox</a></li></ul></div></div>
  <div class="jp-box" style="--bc:#4a4a6a"><h3>Free Home Pages</h3><div>Build your own Web site in minutes. <a href="http://members.homepagez.webcom/">Homepagez</a> gives you free space!</div></div>
 </div>
 <div class="jp-m">
  ${hero}
  <div class="jp-chan" data-chan></div>
  <div class="jp-box"><h3>Today on JSN</h3><div><ul class="jp-heads">${heads.map(x => { const c = CH.find(y => y[0] === x[0]); return `<li><b style="color:${c[2]}">${c[1]}:</b> <a href="${x[1]}">${esc(x[2])}</a></li>`; }).join('')}</ul></div></div>
 </div>
 <div class="jp-r">
  <div class="jp-box" style="--bc:#5a1a9a"><h3>&#9733; Horoscopes</h3><div><select class="jp-sign" data-sign aria-label="Your star sign"><option value="">Pick your sign...</option>${SIGNS.map((s, i) => `<option value="${i}">${s[0]} (${s[1]})</option>`).join('')}</select><div class="jp-read" data-read><span class="jp-small">Choose your star sign to read today's stars.</span></div><a href="${H}/horoscopes.html">All the signs &gt;&gt;</a></div></div>
  <div class="jp-box" style="--bc:#1a8ad8"><h3>Weather</h3><div style="display:flex;gap:8px;align-items:center"><svg viewBox="0 0 32 24" width="44" height="33" aria-hidden="true"><circle cx="11" cy="9" r="6" fill="#ffd400" stroke="#c08000"/><path d="M8 22h18a5 5 0 0 0-1-10 7 7 0 0 0-13 1 4.5 4.5 0 0 0-4 9z" fill="#fff" stroke="#6080a0"/></svg><span>Will it rain on your bike ride? <a href="http://www.jackattack.jnet/weather">Get the forecast</a></span></div></div>
  <div class="jp-box" style="--bc:#a07800"><h3>Money</h3><div><ul><li><a href="http://www.jackexchange.grot/">Jack Stock Exchange</a></li><li><a href="http://www.jacknetbank.webcom/">JackNet Bank Online</a></li></ul></div></div>
  <div class="jp-box" style="--bc:#d8641a"><h3>Shopping</h3><div><ul><li><a href="http://www.jackbay.webcom/">JackBay auctions</a></li><li><a href="http://www.rupeeshop.jnet/">The Rupee Emporium</a></li><li><a href="http://www.ecardz.kidz/">Send an e-card</a></li></ul></div></div>
 </div>
</div>${foot()}</div>`;
  }
  function chanHtml(id) {
    const c = CH.find(x => x[0] === id) || CH[0];
    if (id === 'chat') return `<h2>Chat</h2><div class="jp-cb"><div><b><a data-x="chat">JACK ATTACK! Chat Room</a></b><span>The main room. Busy after school.</span></div><div><b><a href="http://www.chatterbox.netz/">ChatterBox</a></b><span>Live chat rooms for everyone.</span></div><div><b><a href="${H}/chat.html">All JSN Chat rooms</a></b><span>Rooms, programs and the chat rules.</span></div></div>`;
    if (id === 'msgr') return `<h2>Messenger</h2><div class="jp-cb"><div>${msgBox()}</div><div><b><a href="${H}/messenger.html">About JSN Messenger Service</a></b><span>What it does, what you need, and how to add your friends.</span></div></div>`;
    const ls = chanLinks(c);
    return `<h2>${c[1]}</h2><div class="jp-cb">${ls.map(l => `<div><b><a href="${l[0]}">${esc(l[1])}</a></b><span>${esc(l[2])}</span></div>`).join('') || '<div>Nothing here today. Try another channel!</div>'}</div>`;
  }
  function messenger() {
    const rel = J.released(), got = rel && has('jsn');
    if (!rel) A.secret('jsn.early');
    const body = rel ? `<h1><span class="jp-new">NEW!</span>JSN Messenger Service</h1>
<div class="jp-shot"><div class="t">JSN Messenger Service</div><div class="b"><span class="g">Online (2)</span><br>&nbsp; ${J.people('on', 12)} Your best mate<br>&nbsp; ${J.people('busy', 12)} Your cousin (Busy)<br><span class="g">Not Online (1)</span><br>&nbsp; ${J.people('off', 12)} Your mate who's at tea</div></div>
<p><b>Who's online? Now you'll know.</b> JSN Messenger Service sits next to the clock and tells you the moment your friends sign in. Then you can send them a message that pops up on their screen straight away. No more waiting for e-mails!</p>
<p>${got ? `<a class="jp-dl got" data-x="open">You've already got it! Open JSN Messenger</a>` : `<a class="jp-dl" data-x="dl">Download it FREE!</a> <span class="jp-small">jsnmsgr10.exe &middot; 790 KB &middot; about 3 minutes on a 56K modem</span>`}</p>
<div class="jp-feat"><div><b>See who's online</b>Your friends are sorted into Online and Not Online, and a little window pops up when one signs in.</div><div><b>Instant messages</b>Type, press Enter, and it's on their screen. "Callum says: are you coming round?"</div><div><b>Set your status</b>Busy, Be Right Back, Away, On The Phone, Out To Lunch... or Appear Offline.</div><div><b>New mail alert</b>It tells you how many new e-mail messages you've got waiting.</div><div><b>Private</b>Only people you allow can see you. Block anyone, any time.</div><div><b>Free!</b>Sign in with your JackNet Passport. That's it. No catch.</div></div>
<h2>How do I add my friends?</h2><p>Click <b>Add</b> and type their JackNet member name or member number (or their JackMail address). They'll be asked if they want to let you see them. Once they say yes, they'll show up in your list.</p>
<h2>What do I need?</h2><p>JackOS 95 or JackOS 98, a 486 or better, 8 MB of RAM, a modem (28.8K or faster) and a JackNet Passport. (You get a Passport when you join JackNet. It's free.)</p>
<div class="jp-safe"><b>Be safe online!</b> Only add people you really know. Never give out your password, your address, your phone number or the name of your school. If somebody is horrible to you, Block them and tell a grown-up.</div>
<p class="jp-small">Also available from <a href="http://www.sharewareshack.netz/soft/jsn.html">The Shareware Shack</a>. Released ${J.REL}.</p>`
      : `<h1>Coming this summer...</h1>
<div class="jp-hero soon"><span class="pp">${J.people('off', 56)}</span><div style="flex:1;min-width:180px"><h2>JSN Messenger Service</h2><p>Find out when your friends are online. Talk to them instantly. No more "did you get my e-mail?"</p><p><b>Not out yet!</b> We're putting the finishing touches to it right now. Keep checking JSN this summer.</p><a class="jp-dl" style="filter:grayscale(1);cursor:default" aria-disabled="true">Download: coming soon</a></div></div>
<p>While you wait, you can always try the chat rooms. <a href="${H}/chat.html">Go to JSN Chat</a></p>`;
    return `<div class="jp">${top('Messenger')}<div class="jp-page">${body}</div>${foot()}</div>`;
  }
  function chat() {
    const n = J.onlineCount(), ircOk = has('irc'), uhOk = has('uhoh');
    const rows = [
      ['chat', 'JACK ATTACK! Chat Room', 'The main room on JACK ATTACK! Online. Games, films, Pocket Critters, Intergalactic Battles. Busy after school.', n + ' on the site'],
      ['url:http://www.jackattack.jnet/chatroom', 'The Back Room', 'The quieter room at the back. Mind the beanbags.', ''],
      ['url:http://www.chatterbox.netz/', 'ChatterBox', 'Live chat rooms for everyone.', ''],
      ['irc', 'JackIRC', ircOk ? 'Proper nerd chat with channels and /commands. (A program on your computer.)' : 'Not installed on this computer. Get it from the Shareware Shack.', ''],
      ['uhoh', 'Uh-Oh! Messenger', uhOk ? 'The other messenger, with the flower. (A program on your computer.)' : 'Not installed on this computer.', ''],
      ['jsn', 'JSN Messenger Service', J.released() ? (has('jsn') ? 'Talk to your friends one at a time. Installed!' : 'NEW! Talk to your friends one at a time. Download it free.') : 'Coming this summer!', ''],
    ].filter(r => !r[0].startsWith('url:') || exists(r[0].slice(4)));
    return `<div class="jp">${top('Chat')}<div class="jp-page"><h1>JSN Chat</h1><p>Pick a room and say hello! There ${n === 1 ? 'is' : 'are'} <b>${n}</b> ${n === 1 ? 'person' : 'people'} on the JackNet right now.</p>
<table class="jp-rooms"><tr><th>Room</th><th>What's it like?</th></tr>${rows.map(r => `<tr><td><a data-room="${esc(r[0])}">${esc(r[1])}</a>${r[3] ? `<br><span class="jp-small">${esc(r[3])}</span>` : ''}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
<div class="jp-safe"><b>JSN Chat rules:</b> Be nice. No swearing. Never give out your real name, address, phone number, password or school. People in chat rooms are not always who they say they are. If something upsets you, leave the room and tell a grown-up.</div></div>${foot()}</div>`;
  }
  function horoscopes() {
    return `<div class="jp">${top('Horoscopes')}<div class="jp-page"><h1>&#9733; Your Stars for ${today()}</h1><p>Click your sign to read today's horoscope from the JSN stargazer. (For fun only! The stars do not know about your homework.)</p>
<div class="jp-stars">${SIGNS.map((s, i) => `<button type="button" data-star="${i}"><b>${s[0]}</b><span class="jp-small">${s[1]}</span><span data-txt hidden>${reading(i)}</span></button>`).join('')}</div></div>${foot()}</div>`;
  }
  function channels() {
    return `<div class="jp">${top('All Channels')}${searchBar()}<div class="jp-page">${CH.filter(c => c[3]).map(c => `<div class="jp-chan" style="--tc:${c[2]}">${chanHtml(c[0])}</div>`).join('')}</div>${foot()}</div>`;
  }
  function help() {
    return `<div class="jp">${top('Help')}<div class="jp-page"><h1>JSN Help</h1>
<h2>What is JSN?</h2><p>JSN is the JackNet Network: one page with everything on it. News, sport, weather, free e-mail, chat, shopping, horoscopes and the brand-new JSN Messenger Service. Lots of people make it their home page, so it's the first thing they see when they go online.</p>
<h2>How do I make JSN my home page?</h2><p>${window.Bridge && Bridge.askHome ? 'Click <a data-x="home">Make JSN your home page</a> and say Yes.' : 'In JackNet Explorer, go to Tools &gt; Internet Options and type http://www.jsn.jnet/ as your home page.'}</p>
<h2>What's a JackNet Passport?</h2><p>It's your JackNet member name and password. You get one free when you join JackNet. You need it to sign in to JSN Messenger Service.</p>
<h2>Searching</h2><p>Type what you want into the box at the top of the JSN home page and click Search. Short searches work best: "pocket critters cheats", not "please could you find me some pocket critters cheats thank you".</p></div>${foot()}</div>`;
  }
  function about() {
    return `<div class="jp">${top('About JSN')}<div class="jp-page"><h1>About JSN</h1><p>JSN - the JackNet Network - is a start page for everyone on the JackNet. We put the best of the JackNet in one place, so you don't have to remember a hundred addresses. (Write them on a Post-it anyway.)</p><p>JSN is free. It's paid for by the adverts. You may have noticed the adverts.</p><h2>Contact us</h2><p>Please don't phone. Our phone line is also our modem line.</p></div>${foot()}</div>`;
  }

  // ================================================================ wiring
  const PAGES = { '/': home, '/messenger.html': messenger, '/chat.html': chat, '/horoscopes.html': horoscopes, '/channels.html': channels, '/help.html': help, '/about.html': about };
  const showBrowser = () => { const b = $('browser'); if (b) b.classList.remove('min'); };
  function act(x) {
    if (x === 'open') return A.open('jsn.msgr');
    if (x === 'dl') { if (!J.released()) return; if (has('jsn')) return A.open('jsn.msgr'); if (window.Setup && Setup.download) return Setup.download('jsn'); return; }
    if (x === 'chat') { showBrowser(); return IE.go('chat', 'click'); }
    if (x === 'home' && window.Bridge && Bridge.askHome) {
      Bridge.askHome(J.HOST ? 'http://' + J.HOST + '/' : H + '/');
      let n = 0; const iv = setInterval(() => { n++; const u = String(store.get('jhp_homeurl', '') || ''); if (/jsn\.jnet/.test(u)) { clearInterval(iv); A.secret('jsn.home'); } if (n > 60) clearInterval(iv); }, 500);
    }
  }
  function room(r) {
    if (r === 'chat') return act('chat');
    if (r.startsWith('url:')) return IE.navigate(r.slice(4));
    if (r === 'irc') return has('irc') ? A.open('social.irc') : IE.navigate('http://www.sharewareshack.netz/');
    if (r === 'uhoh') return has('uhoh') ? A.open('social.uhoh') : Desk.msgbox('Uh-Oh! Messenger', 'Uh-Oh! Messenger is not installed on this computer.', 'info');
    if (r === 'jsn') return J.released() ? act('dl') : IE.navigate(H + '/messenger.html');
  }
  function wire(root, path) {
    root.addEventListener('click', ev => {
      const t = ev.target;
      const x = t.closest('[data-x]'); if (x) { ev.preventDefault(); return act(x.dataset.x); }
      const rm = t.closest('[data-room]'); if (rm) { ev.preventDefault(); return room(rm.dataset.room); }
      const en = t.closest('[data-eng]'); if (en) { ev.preventDefault(); const q = (qs(root, '[data-search] input') || {}).value || ''; if (window.WebDir && WebDir.goSearch) WebDir.goSearch(en.dataset.eng, q); return; }
      const tab = t.closest('[data-tab]');
      if (tab) {
        qsa(root, '[data-tab]').forEach(b => b.classList.toggle('on', b === tab));
        const c = CH.find(y => y[0] === tab.dataset.tab);
        const box = qs(root, '[data-chan]'); if (box) { box.style.setProperty('--tc', c[2]); box.innerHTML = chanHtml(c[0]); }
        qs(root, '[data-tabs]').style.setProperty('--tc', c[2]);
        return;
      }
      const star = t.closest('[data-star]');
      if (star) {
        star.classList.add('on'); qs(star, '[data-txt]').hidden = false;
        const seen = new Set(store.get('jhp_jsn_stars', [])); seen.add(+star.dataset.star); store.set('jhp_jsn_stars', [...seen]);
        if (seen.size >= 12) A.secret('jsn.stars');
      }
    });
    const sf = qs(root, '[data-search]');
    if (sf) sf.addEventListener('submit', ev => { ev.preventDefault(); const q = qs(sf, 'input').value.trim(); if (!q) return; if (window.WebDir && WebDir.goSearch) WebDir.goSearch('grot', q); else IE.navigate('http://www.jacksearch.find/'); });
    const mf = qs(root, '[data-mail]');
    if (mf) mf.addEventListener('submit', ev => { ev.preventDefault(); IE.navigate('http://www.jackmail.webcom/'); });
    const sg = qs(root, '[data-sign]');
    if (sg) sg.addEventListener('change', () => {
      const i = sg.value, out = qs(root, '[data-read]');
      if (i === '') { out.innerHTML = '<span class="jp-small">Choose your star sign to read today\'s stars.</span>'; return; }
      out.innerHTML = `<b>${SIGNS[+i][0]}:</b> ${reading(+i)}`;
      const seen = new Set(store.get('jhp_jsn_stars', [])); seen.add(+i); store.set('jhp_jsn_stars', [...seen]); if (seen.size >= 12) A.secret('jsn.stars');
    });
    const ch = qs(root, '[data-chan]');
    if (ch) { ch.style.setProperty('--tc', CH[0][2]); ch.innerHTML = chanHtml(CH[0][0]); qs(root, '[data-tabs]').style.setProperty('--tc', CH[0][2]); }
    void path;
  }
  function render(path, el) {
    const f = PAGES[path] || home;
    el.innerHTML = f();
    const root = el.firstElementChild || el;
    wire(root, path);
  }
  // keep the messenger buttons right after installing or removing it
  document.addEventListener('setup', ev => {
    if (!ev.detail || ev.detail.id !== 'jsn') return;
    const a = qs(document, '#s-secret .jp'); if (!a || !window.IE || IE.current !== 'secret') return;
    const url = ($('addrBar') || {}).value || '';
    const m = /jsn\.jnet(\/[^?#]*)?/.exec(url); if (!m) return;
    const p = (m[1] || '/').replace(/\/(index\.html?)?$/, '/');
    if (PAGES[p]) render(p, a.parentNode);
  });
  window.JSNPortal = { render };
})();

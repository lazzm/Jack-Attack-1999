/* jw-web: www.jackworld.jnet, JackWorld's web site (pages are built by js/jw.js's IE.addSite, filled in here).
 * Live bits (people online, this week's rare and how many are left, top rooms, the Room of the Week) come from the
 * server (jwInfo); the "screenshots" are real rooms drawn by js/jw-art.js. */
(function () {
  'use strict';
  if (window.JWWeb) return;
  const A = window.Apps, C = window.JWCat, ART = window.JWArt, JW = window.JW; if (!A || !C || !ART || !JW) return;
  const esc = A.esc, H = 'http://www.jackworld.jnet';
  const rp = n => JW.rp(n);
  const t99 = () => Desk.today99();
  const mdNow = () => t99().md;
  const dayStr = md => `${md % 100} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Math.floor(md / 100) - 1]} 1999`;
  const weekNow = () => { const d = t99(); return C.week(`1999-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`); };
  const fmtD = t => { const d = new Date(t); return `${d.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]}`; };
  const live = (el, t, fn) => { const off = JW.on(t, m => { if (!el.isConnected) return off(); fn(m); }); };
  const PID = 'jw.client', has = () => !!(window.Setup && Setup.has && Setup.has(PID));

  // a real room, drawn the same way the program draws it (no people except the regulars)
  function scene(id, scale) {
    const R = C.PUB[id], rm = ART.room({ map: R.map, floor: R.floor, wall: R.wall, in: R.in, sky: R.sky });
    const c = document.createElement('canvas'); c.width = rm.lw; c.height = rm.lh; const g = c.getContext('2d'); g.drawImage(rm.c, 0, 0);
    const L = [];
    for (const f of R.fix) {
      const F = C.FURNI['furni.' + f[0]]; if (!F) continue;
      if (typeof f[1] === 'string') { const s = ART.wallItem(F, f[1], 1, 0), o = f[1] === 'R' ? rm.P(f[2], 0, f[3]) : rm.P(0, f[2], f[3]); g.drawImage(s.c, Math.round(o[0] - s.ox), Math.round(o[1] - s.oy)); continue; }
      const w = f[3] ? F.d : F.w, d = f[3] ? F.w : F.d;
      L.push({ k: F.k === 'r' ? -99 + f[1] + f[2] : f[1] + f[2] + (w + d) / 2, f() { const s = ART.furni(F, f[3], F.use === 'lamp' || F.use === 'tv' ? 1 : 0, 2), o = rm.P(f[1], f[2], 0); g.drawImage(s.c, Math.round(o[0] - s.ox), Math.round(o[1] - s.oy)); } });
    }
    for (const n of R.npcs) L.push({ k: n[1] + n[2] + 1, f() { const { s, mirror } = ART.avatar(C.NPC_AV[n[3]] || C.avOf(n[0]), 'stand', 1, 0), o = rm.P(n[1] + 0.5, n[2] + 0.5, 0); g.save(); g.translate(Math.round(o[0]), Math.round(o[1]) + 4); if (mirror) g.scale(-1, 1); g.drawImage(s.c, -s.ox, -s.oy); g.restore(); } });
    for (let y = 0; y < R.map.length; y++) for (let x = 0; x < R.map[0].length; x++) if (R.map[y][x] === 'w') L.push({ k: -200, f() { const s = ART.water((x + y) % 8, ART.isNight()), o = rm.P(x, y); g.drawImage(s.c, Math.round(o[0] - s.ox), Math.round(o[1] - s.oy)); } });
    L.sort((a, b) => a.k - b.k).forEach(o => o.f());
    // crop to the room itself
    const x0 = rm.ox - R.map.length * 16 - 8, x1 = rm.ox + R.map[0].length * 16 + 8, y0 = rm.oy - (R.in ? ART.WALLH + 12 : 80), y1 = rm.oy + (R.map.length + R.map[0].length) * 8 + 14;
    const out = document.createElement('canvas'); out.width = (x1 - x0) * (scale || 1); out.height = (y1 - y0) * (scale || 1);
    const o = out.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(c, x0, y0, x1 - x0, y1 - y0, 0, 0, out.width, out.height);
    out.className = 'jw-shot'; return out;
  }
  function logoArt() { // two little people saying hello on a tile of grass
    const c = document.createElement('canvas'); c.width = 132; c.height = 96; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const B = new ART.Buf(66, 48); B.poly([[33, 26], [64, 40], [33, 48], [2, 40]].map(([x, y]) => [x, y - 6]), '#7ad06a'); B.poly([[2, 34], [33, 42], [33, 46], [2, 38]], '#2f8a3a'); B.poly([[33, 42], [64, 34], [64, 38], [33, 46]], '#1e6e2a'); B.outline(); g.drawImage(B.canvas(), 0, 0, 132, 96);
    const a = ART.avatar([0, 1, 2, 3, 6, 0, 0, 1, 1], 'wave', 0, 2, null), b2 = ART.avatar([0, 3, 4, 1, 1, 9, 3, 4, 3], 'wave', 1, 2, null);
    g.drawImage(a.s.c, 0, 0, a.s.w, a.s.h, -2, -48, a.s.w * 2, a.s.h * 2);
    g.save(); g.translate(134, -48); g.scale(-1, 1); g.drawImage(b2.s.c, 0, 0, b2.s.w, b2.s.h, 0, 0, b2.s.w * 2, b2.s.h * 2); g.restore();
    return c;
  }
  function frame(el, cur, inner) {
    el.innerHTML = `<div class="jw-wrap"><div class="jw-head"><div style="display:flex;align-items:center;gap:10px"><span class="jw-lart"></span><div><div class="jw-logo">JACK<b>WORLD</b><small>99</small></div><div class="jw-tagline">The chat world where YOU live!</div></div></div><div style="text-align:right;color:#fff;font-weight:bold;text-shadow:1px 1px 0 #000"><span class="jw-online">...</span> in JackWorld right now<br><small>Week ${weekNow().no} of 1999</small></div></div>
      <div class="jw-nav">${[['/', 'Home'], ['/download.html', 'Download'], ['/catalogue.html', 'Catalogue'], ['/rares.html', 'Rares'], ['/rooms.html', 'Top Rooms'], ['/news.html', 'News'], ['/help.html', 'Help'], ['/safety.html', 'Stay Safe']].map(([p, l]) => `<a href="${H}${p}" class="${p === cur ? 'on' : ''}">${l}</a>`).join('')}</div>
      ${inner}<div class="jw-foot">JackWorld is a JackNet member service. &copy; 1999 JackWorld Ltd. Best viewed in JackNet Explorer at 800x600. <a href="${H}/safety.html">The JackWorld Way</a> &middot; <a href="${H}/fansites.html">Fan sites</a><br>No part of JackWorld may be copied. Not even the crates.</div></div>`;
    el.querySelector('.jw-lart').appendChild(logoArt());
    const on = el.querySelector('.jw-online'); const upd = m => { if (on.isConnected) on.textContent = m.online === 1 ? '1 person' : `${m.online} people`; }; live(on, 'jwInfo', upd); JW.send({ t: 'jwInfo' }); if (JW.info) upd(JW.info);
    el.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); play(); }));
  }
  function play() { if (has()) A.open('jw.world'); else if (window.Setup && Setup.download) Setup.download(PID); }
  const playBtn = () => `<a href="#" class="jw-dlbtn" data-play>${JW.ICO.world}${has() ? 'PLAY JACKWORLD NOW' : 'DOWNLOAD JACKWORLD (FREE!)'}</a>`;

  // ================================================================ news (only what has happened by the 1999 "today")
  const NEWS = [
    [104, 'JackWorld is OPEN!', 'After months of testing on a 486 in a spare bedroom, JackWorld is finally live! Make your person, walk round the Lobby, chat in bubbles and get your very own room. Members get a room for FREE. Tell your mates!'],
    [111, 'The Snowy Peak is open', 'It snowed in the server room (somebody left the window open), so we built a mountain. Head up the ski lift from Jacktown Square for Snowball Fights!'],
    [208, 'Rares: what\'s the deal?', 'Every Monday a new rare goes into the Catalogue. It\'s only there for that week, and only so many will ever exist. Each one has its own number. Once they\'re gone, they\'re GONE (unless somebody sells theirs on JackBay...).'],
    [315, 'The Quiz Booth opens in the Pixel Arcade', 'Quizmaster Quentin has a new booth! Stand on A, B, C or D to answer. Get 3 right for Rupees, top the scores to win more.'],
    [512, 'Paradise Beach is finally warm enough', 'It isn\'t. But the ice cream hut is open anyway. Mind the message in a bottle.'],
    [601, 'Half term = hundreds of you!', 'Wow. 400 people in the Lobby at once on Tuesday. The server made a noise like a kettle. Thanks for being patient, and remember: be nice to new people!'],
    [720, 'Space Station JW-1 has docked', 'Thirty years ago today, people walked on the Moon. To celebrate, the Space Lift in the Lobby now goes all the way to our own space station. Commander Nova says the airlock is "authorised personnel only". Hmm.'],
    [811, 'ECLIPSE DAY!', 'Did you see it? Half of JackWorld logged off to go outside and look at the sky through a cereal box. NEVER look at the Sun directly! The Eclipse Viewer is in the Catalogue for a few days.'],
    [903, 'Back to school (boo)', 'The after-school rush is back: everybody in the Lobby at 4 o\'clock talking about homework they haven\'t done. Revision tip from the JackWorld Crew: do it BEFORE you log on.'],
    [910, 'Friday Night Disco on the Rooftop', 'Every Friday from 6pm, DJ Spinz takes over the Rooftop Disco. The floor lights up, the regulars dance, and there\'s Musical Chairs all night. Wear your best hat!'],
    [1014, 'The Daydream is out!', 'Segue\'s new console is in the shops today. Half the Crew have gone to queue outside the games shop. The other half are pretending they don\'t care. JackWorld stays open as normal!'],
    [1025, 'Spooky week', 'Jack-o\'-Lanterns are in the Seasonal page of the Catalogue until 2 November. Light them up in your room!'],
    [1105, 'Remember, remember...', 'Fireworks boxes in the Catalogue (look, don\'t light: your dad does the lighting). Bonfire safety: keep your pets indoors tonight.'],
    [1201, 'Christmas comes to JackWorld', 'Christmas trees are in the Seasonal page. The Snowy Peak is extra snowy. Room of the Week judges will be looking for the most festive rooms!'],
    [1227, 'Y2K: will JackWorld survive?', 'This week\'s rare is the Millennium Countdown Clock. Our server is "Y2K compliant" (we checked the sticker). See you on the other side!'],
  ];
  const newsNow = () => NEWS.filter(n => n[0] <= mdNow()).reverse();

  // ================================================================ pages
  const W = window.JWWeb = {};
  W.home = el => {
    const wk = weekNow(), F = C.rareOfWeek(wk.no), news = newsNow().slice(0, 3);
    frame(el, '/', `<div class="jw-cols"><div>
      <div class="jw-box"><h2>WELCOME TO JACKWORLD!</h2><div class="jw-shotbox"></div><p><b>JackWorld is a chat world you walk around in.</b> Make your own little pixel person, chat in speech bubbles, play games with people from all over the JackNet, and get your <b>very own room</b> to decorate. It's free!</p><p style="text-align:center">${playBtn()}</p></div>
      <div class="jw-box"><h2 class="b">WHAT CAN YOU DO?</h2><ul><li><b>Hang out</b> in the Lobby, Jacktown Square, the Pixel Arcade, the Rooftop Disco, Paradise Beach, the Snowy Peak and Space Station JW-1.</li><li><b>Play</b> the Quiz Booth, Musical Chairs and Snowball Fights. Members win Rupees!</li><li><b>Decorate your room</b> with over 150 bits of furni, from crates to Fish Tanks to Tele-Booths.</li><li><b>Collect rares</b>: one new limited rare every Monday. Swap them on the Trading Post or sell them on JackBay.</li><li><b>Room of the Week</b>: the best room wins a gold cup and 250 Rupees.</li></ul></div>
      <div class="jw-box"><h2 class="g">LATEST NEWS</h2>${news.map(n => `<div class="jw-news"><small>${dayStr(n[0])}</small><br><b>${esc(n[1])}</b><p>${esc(n[2])}</p></div>`).join('')}<p><a href="${H}/news.html">All the news &raquo;</a></p></div>
      </div><div>
      <div class="jw-box jw-wrare"><h2 class="p">RARE OF THE WEEK</h2><img src="${ART.thumb(F.id, 128)}" alt=""><p><b>${esc(F.n)}</b></p><p>${esc(F.ds)}</p><p><b>${rp(F.p)}</b> &middot; <span class="jw-left">?</span> of ${F.lim} left</p><p><small>Gone on ${fmtD(wk.sun)}. One each!</small></p></div>
      <div class="jw-box"><h2 class="y">ROOM OF THE WEEK</h2><div class="jw-rotw"><p>Loading...</p></div></div>
      <div class="jw-box"><h2 class="b">BUSY RIGHT NOW</h2><ul class="jw-wlist jw-hot"><li>Loading...</li></ul></div>
      <div class="jw-box" style="text-align:center"><small>Visitors since 04/01/99:</small><br><span class="jw-counter">${String(48213 + Math.floor((Date.now() / 864e5) % 1000) * 37).padStart(7, '0')}</span></div>
      </div></div>`);
    el.querySelector('.jw-shotbox').appendChild(scene('lobby', 1));
    const fill = m => {
      if (!el.isConnected) return;
      const l = el.querySelector('.jw-left'); if (l && m.rare && m.rare.id === F.id) l.textContent = m.rare.left;
      const r = el.querySelector('.jw-rotw'), w = m.rotw && m.rotw[0];
      r.innerHTML = w ? `<p><b>"${esc(w.n)}"</b><br>by ${esc(w.on)} (week ${w.w})</p><p><small>Likes count three times, different visitors once. Make your room amazing!</small></p>` : '<p>No winner yet! Make your room amazing and it could be YOU. Likes and visitors decide.</p>';
      const hl = el.querySelector('.jw-hot'); hl.innerHTML = (m.hot || []).map(x => `<li><span>${esc(x.n)}</span><b>${x.u}</b></li>`).join('') || '<li>Quiet at the moment. Go and liven it up!</li>';
    };
    live(el, 'jwInfo', fill); if (JW.info) fill(JW.info);
  };
  W.download = el => {
    frame(el, '/download.html', `<div class="jw-box"><h2>DOWNLOAD JACKWORLD 99</h2><p>JackWorld 99 is <b>FREE</b>. It's a 3.4 MB download (about 14 minutes on a 33.6K modem, so go and make a cup of tea).</p><p style="text-align:center">${playBtn()}</p>
      <h3>You will need</h3><ul><li>JackOS 98 (or JackOS 95/98)</li><li>A Pent-Yum 133 or better (it works on a 486 DX4-100, but the snowballs are slow)</li><li>16 MB of RAM (32 MB recommended)</li><li>A 640x480 screen in 256 colours or more</li><li>A modem: 28.8K works, 56K is better</li><li>A JackNet account to have your own room (free!). Guests can visit the public rooms.</li></ul>
      <h3>What's new in version 1.0</h3><ul><li>Seven public rooms (and maybe a secret one)</li><li>The Catalogue with over 150 pieces of furni</li><li>Room sizes, floors and wallpaper</li><li>Quiz Booth, Musical Chairs, Snowball Fights</li><li>Doorbells, locks and spare keys for your room</li><li>A Report button: if anybody is horrible, tell us</li></ul></div>`);
  };
  W.cat = el => {
    const md = mdNow(), wk = weekNow().no;
    const pages = C.PAGES.filter(p => !['new', 'rares', 'styles', 'rooms'].includes(p[0]));
    frame(el, '/catalogue.html', `<div class="jw-box"><h2>THE JACKWORLD CATALOGUE</h2><p>Everything you can buy for your room. Prices in Rupees. To buy, open JackWorld 99 and press <b>Catalogue</b>. The rare of the week is on the <a href="${H}/rares.html">Rares</a> page.</p></div>
      ${pages.map(([id, n, d]) => `<div class="jw-box"><h2 class="b">${esc(n.toUpperCase())}</h2><p>${esc(d)}</p><div class="jw-cgrid">${C.F.filter(f => f.pg === id && !f.pub).map(f => `<div class="${C.inSea(f, md) ? '' : 'q'}"><img src="${ART.thumb(f.id, 72)}" alt=""><br>${esc(f.n)}<b>${C.inSea(f, md) ? rp(f.p) : 'Out of season'}</b></div>`).join('')}</div></div>`).join('')}
      <div class="jw-box"><h2 class="g">ROOM SIZES</h2><ul>${C.MODELS.map(m => `<li><b>${esc(m[1])}</b>: ${m[4][0].length} x ${m[4].length} tiles, up to ${m[3]} furni. ${m[2] ? rp(m[2]) : 'FREE for every member'}</li>`).join('')}</ul></div>`);
  };
  W.rares = el => {
    const wk = weekNow().no, list = C.RARES.filter(f => f.wk <= wk).reverse();
    frame(el, '/rares.html', `<div class="jw-box"><h2 class="p">RARES ARCHIVE</h2><p>One new rare every Monday, on sale that week only. Each one is numbered ("#3 of 40"), so you can tell who got there first. Missed one? Look on <a href="http://www.jackbay.webcom/rupees.html">JackBay Rupee Auctions</a> or ask about on the Trading Post.</p><p><b>This week's rare: ${esc(C.rareOfWeek(wk).n)}!</b> Next Monday: <i>top secret</i>.</p>
      <div class="jw-cgrid">${list.map(f => `<div><img src="${ART.thumb(f.id, 72)}" alt=""><br><small>Week ${f.wk}</small><br>${esc(f.n)}<b>${rp(f.p)}</b><small data-sold="${f.id}">? of ${f.lim} sold</small></div>`).join('')}</div></div>`);
    const fill = m => { if (!el.isConnected || !m.sold) return; el.querySelectorAll('[data-sold]').forEach(s => { const F = C.FURNI[s.dataset.sold]; s.textContent = `${m.sold[F.id] | 0} of ${F.lim} sold${(m.sold[F.id] | 0) >= F.lim ? ' (SOLD OUT)' : ''}`; }); };
    live(el, 'jwInfo', fill); if (JW.info) fill(JW.info);
  };
  W.rooms = el => {
    frame(el, '/rooms.html', `<div class="jw-cols"><div><div class="jw-box"><h2 class="y">TOP ROOMS</h2><ul class="jw-wlist jw-top"><li>Loading...</li></ul><p><small>The most liked members' rooms. To like a room, go in and press the heart.</small></p></div>
      <div class="jw-box"><h2 class="g">ROOM OF THE WEEK: HALL OF FAME</h2><ul class="jw-wlist jw-hof"><li>Loading...</li></ul></div></div>
      <div><div class="jw-box"><h2 class="b">HOW TO WIN ROOM OF THE WEEK</h2><p>Every Monday the JackWorld computer adds up last week's likes (worth 3 points each) and different visitors (1 point each). The winner gets the gold <b>Room of the Week Cup</b> and <b>250 Rupees</b>!</p><p>Tips: give your room a good name, put a description on it, keep it open, and make it look AMAZING.</p></div></div></div>`);
    const fill = m => { if (!el.isConnected) return; el.querySelector('.jw-top').innerHTML = (m.top || []).map(r => `<li><span><b>${esc(r.n)}</b><br><small>by ${esc(r.on)}</small></span>&hearts; ${r.lk}</li>`).join('') || '<li>No rooms yet. Be the first!</li>'; el.querySelector('.jw-hof').innerHTML = (m.rotw || []).map(r => `<li><span><b>${esc(r.n)}</b> by ${esc(r.on)}</span><small>week ${r.w}</small></li>`).join('') || '<li>No winners yet.</li>'; };
    live(el, 'jwInfo', fill); JW.send({ t: 'jwInfo' }); if (JW.info) fill(JW.info);
  };
  W.news = el => frame(el, '/news.html', `<div class="jw-box"><h2 class="g">ALL THE NEWS</h2>${newsNow().map(n => `<div class="jw-news"><small>${dayStr(n[0])}</small><br><b>${esc(n[1])}</b><p>${esc(n[2])}</p></div>`).join('')}</div>`);
  W.safety = el => frame(el, '/safety.html', `<div class="jw-box"><h2>THE JACKWORLD WAY</h2><p>JackWorld is for everybody. Keep it fun by following the JackWorld Way:</p><ol>
      <li><b>Keep your secrets secret.</b> Never tell anybody your real full name, address, phone number, school or e-mail. (JackWorld hides numbers and addresses anyway, but don't try!)</li>
      <li><b>Be nice.</b> No swearing, no bullying, no being horrible about anybody. The word filter is watching. So are we.</li>
      <li><b>Don't meet up.</b> People you meet online might not be who they say they are. If somebody asks to meet you, tell a grown-up.</li>
      <li><b>Report it.</b> Click on somebody and press <b>Report</b>. A Moderator sees what was said and can mute them or clear the room.</li>
      <li><b>Don't scam.</b> No "give me your rares and I'll give them back". Use the Trading Post: it holds both sides until you both press OK.</li>
      <li><b>Take breaks.</b> Your eyes need a rest. So does the phone line (somebody might need to ring your mom).</li></ol>
      <p><small>JackWorld Moderators wear a star next to their name. <a href="${H}/staff.html" style="color:#999">Moderator log-in</a></small></p></div>`);
  W.help = el => frame(el, '/help.html', `<div class="jw-box"><h2 class="b">HELP &amp; FAQ</h2><dl class="jw-faq">
      <dt>How do I walk?</dt><dd>Click on the floor. Click a chair or sofa to sit on it. Walk through a door to go to the next room.</dd>
      <dt>How do I talk?</dt><dd>Type in the box at the bottom and press Enter. <code>/shout</code> shouts, <code>/w Name message</code> whispers. Type <b>brb</b> if you have to go and have your tea!</dd>
      <dt>How do I dance?</dt><dd>Press the smiley next to the chat box, or type <code>/dance</code>. Also: <code>/wave /sit /jump /laugh /cool /think /love /cry /sleep /waaagh /stand</code>.</dd>
      <dt>How do I get a room?</dt><dd>You need a free JackNet account. Press <b>My Room</b> in JackWorld and give it a name.</dd>
      <dt>How do I get furni?</dt><dd>Buy it in the Catalogue with Rupees. Earn Rupees all over the PC: games, the forums, odd jobs, secrets... and the JackWorld games!</dd>
      <dt>Where is my furni?</dt><dd>In <b>My Stuff</b> (it lives in your Treasure Chest). Go to your room and click it to put it out. Click it again in the room to move, turn or pick it up.</dd>
      <dt>Can I sell my furni?</dt><dd>Yes! Pick it up first, then use the Trading Post (Treasure Chest) or JackBay Rupee Auctions.</dd>
      <dt>Somebody locked their room!</dt><dd>Room owners can lock their room or put a doorbell on it. Ring the bell and wait for them to let you in.</dd>
      <dt>Why can't I like rooms?</dt><dd>You need to have earned 50 Rupees on JackNet first. It stops people making pretend members to like their own room.</dd>
      <dt>The snowballs keep missing!</dt><dd>Snowballs go where your target WAS. Throw at people who are standing still. Or chasing you.</dd>
      <dt>Is there a secret room?</dt><dd>We couldn't possibly comment. (Commander Nova might.)</dd></dl></div>`);
  W.fans = el => frame(el, '/fansites.html', `<div class="jw-box"><h2 class="y">JACKWORLD FAN SITES</h2><p>Made by JackWorld players! (We don't run these sites, so be careful out there.)</p><ul>
      <li><b>Kirsty's Rare Guide</b>: every rare with its week, how many exist and what she'd swap for it. Updated "every Monday, if my brother lets me on the computer".</li>
      <li><b>THE BEAN BAG APPRECIATION SOCIETY</b>: members-only room, ring the doorbell, bring your own bean bag.</li>
      <li><b>Darren's Musical Chairs Tactics</b>: "Stand NEXT to a chair, not on it. Also, be faster than everyone."</li>
      <li><b>Pixel Interiors Monthly</b>: room makeovers, before-and-after pictures, and a strongly worded article about crates.</li>
      <li><b>Snowball Fight League</b>: weekly tables, rules and an argument about whether the lifeguard counts as a player.</li></ul></div>`);
  W.staff = el => {
    A.secret('jw.staff');
    el.innerHTML = `<div class="jw-wrap" style="padding-top:20px"><div class="jw-staffpg">JACKWORLD STAFF AREA<br>==================<br><br>&gt; AUTHORISED MODERATORS ONLY<br><br>Moderators: log in to JackWorld 99 and type <b>/staff</b> followed by the moderator password in the chat box.<br><br>Moderator duties:<br>- Read the Report queue every shift<br>- Mute people who swear or bully (10 mins, 1 hour, 1 day)<br>- Clear a room if it gets out of hand<br>- NEVER ask a player for their password<br>- Do not eat the Lobby fountain pennies<br><br>Server status: OK (load average 0.7, Y2K sticker: present)<br><br>&gt; <a href="${H}/" style="color:#ff0">Back to JackWorld</a></div></div>`;
  };
})();

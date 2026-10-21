/* loot-web: LOOTLINGS! (www.lootlings.jnet), the collect-and-trade web site of 1999. Little critters called Lootlings dig
 * up loot; shopkeepers sell exactly what's on the shelf; members trade and sell to each other. Lazy-loaded by js/loot.js.
 * Inspired by the virtual-pet and collecting sites of 1999 (one famous one opened on 15 November 1999): this is our own
 * made-up version, with our own critters. It's "PUBLIC BETA" until our Grand Opening on 15 November 1999. */
(function () {
  'use strict';
  if (window.LootWeb) return;
  const A = window.Apps, L = window.Loot, C = L.cat, ART = L.art, esc = A.esc, fmt = L.fmt;
  const H = 'http://www.lootlings.jnet';
  const sfx = n => { try { Sound.play(n); } catch (e) {} };
  const member = () => !!(Net.me && Net.me.member);
  const md = () => L.md();
  const rpw = n => (Math.floor(+n || 0) === 1 ? 'Rupee' : 'Rupees');
  const rp = n => (window.Econ && Econ.rp ? Econ.rp(n) : `${fmt(n)} ${rpw(n)}`); // plain text money
  // money as HTML (a gem that fits the amount); w: add the word "Rupee(s)"
  const teef = (n, w) => (window.Econ && Econ.rupees ? Econ.rupees(n, w) : `<span class="ec-tf">${window.Econ ? Econ.TOOF : ''}<b>${fmt(n)}</b></span>${w ? ' ' + rpw(n) : ''}`);
  const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mdTxt = x => `${x % 100} ${M[Math.floor(x / 100) - 1]} 1999`;
  const crit = (id, sz) => `<svg viewBox="0 0 32 32" width="${sz || 64}" height="${sz || 64}" aria-hidden="true">${ART.lootling(C.ITEM[id].art)}</svg>`;
  const rw = r => `<span class="lx-rw lx-rw${r}">${C.RAR[r].n}</span>`;
  const iurl = id => `${H}/item/${id}.html`;
  const ROUTES = {};
  const route = (p, fn) => { ROUTES[p] = fn; };

  function render(path, el, live) {
    let fn = ROUTES[path], arg = '';
    if (!fn && path.startsWith('/item/')) { fn = ROUTES['/item/']; arg = path.slice(6, -5); }
    else if (!fn && path.startsWith('/items/')) { fn = ROUTES['/items.html']; arg = path.slice(7, -5); }
    else if (!fn && path.startsWith('/shop/')) { fn = ROUTES['/shop/']; arg = path.slice(6, -5); }
    if (!fn) { el.className = 'lxw lxw-err'; el.innerHTML = '<h2>404 Not Found</h2><p>A Snorb ate this page.</p>'; return; }
    el.className = 'lxw';
    const P = {
      el, live, path, arg,
      on(t, f) { live.offs.push(L.on(t, f)); },
      q: s => el.querySelector(s), qa: s => [...el.querySelectorAll(s)],
      say(sel, html, ok) { const b = el.querySelector(sel); if (b) { b.innerHTML = html; b.hidden = false; b.className = 'lx-msg' + (ok ? ' ok' : ''); } },
    };
    try { fn(P); } catch (e) { console.error(e); el.innerHTML = '<p>This page has a bug in it. A small one. Pibble is painting over it.</p>'; }
  }

  // ================================================================ the frame: header, nav, side boxes, footer
  const NAV = [['/', 'Home'], ['/news.html', 'News'], ['/items.html', 'Item Database'], ['/shops.html', 'Shops'], ['/bazaar.html', 'Bazaar'], ['/trading.html', 'Trading Post'], ['/collections.html', 'Collections'], ['/museum.html', 'Museum'], ['/top.html', 'Top Collectors'], ['/missions.html', 'Missions'], ['/creatures.html', 'Meet the Lootlings'], ['/help.html', 'Help']];
  function phase() { const d = md(); return d < C.RULES.openDay ? 'beta' : d <= C.RULES.openDay + 6 ? 'opening' : 'open'; }
  function head(on) {
    const me = L.me, ph = phase();
    return `<div class="lx-head"><a class="lx-logo" href="${H}/">${crit('pet.snorb', 46)}<span><b>LOOTLINGS!</b><i>Collect it. Trade it. Show it off.</i></span></a>${ph === 'beta' ? '<span class="lx-beta">PUBLIC BETA!</span>' : ph === 'opening' ? '<span class="lx-beta">GRAND OPENING!!!</span>' : ''}
      <div class="lx-hme">${member() ? `Hiya <b>${esc(Net.me.nick)}</b>! ${teef(window.Econ ? Econ.bal : 0, true)}${me ? ` &middot; ${fmt(me.it.length)} thing${me.it.length === 1 ? '' : 's'}${me.par ? ` &middot; <a href="#" data-chest="parcels">${me.par} parcel${me.par > 1 ? 's' : ''} to open!</a>` : ''}` : ''}<br><a href="#" data-chest="stuff">Open my Treasure Chest</a>` : 'Hello, Guest! <a href="#" data-join="1">Join JackNet FREE</a> to collect!'}</div></div>
      <div class="lx-nav">${NAV.map(([u, l]) => `<a href="${H}${u}" class="${on === u ? 'on' : ''}">${l}</a>`).join('')}</div>`;
  }
  function side() {
    const me = L.me;
    const mine = member() && me ? `<div class="lx-box y"><h3>Your Stuff</h3><p style="margin:0 0 4px">${fmt(me.it.length)} thing${me.it.length === 1 ? '' : 's'}, ${fmt(new Set(me.it.map(x => x.id)).size)} different. Collection score: <b>${fmt(me.score)}</b>.</p>${me.mis ? `<p style="margin:0 0 4px">Missions today: <b>${me.mis.l.filter(x => x.done).length} of 3</b>. <a href="${H}/missions.html">See them</a></p>` : ''}<button type="button" data-chest="${me.par ? 'parcels' : 'stuff'}">${me.par ? 'Open my parcel!' : 'Treasure Chest'}</button></div>`
      : `<div class="lx-box y"><h3>Join the fun!</h3><p style="margin:0 0 6px">Lootlings is FREE for every JackNet member. Guests can look around, but you need to be a member to collect, trade and get a Daily Parcel.</p><button type="button" data-join="1">Join / Log On</button></div>`;
    return `<div class="lx-side">${mine}<div class="lx-box b"><h3>Just found!</h3><div class="lx-feed" data-feed>Asking the Snorbs...</div></div>
      <div class="lx-box g"><h3>Rarity guide</h3>${C.RAR.map((r, i) => `<div>${rw(i)}</div>`).join('')}<p style="margin:4px 0 0;font-size:11px">The rarer it is, the more it shines!</p></div>
      <div class="lx-box"><h3>Dropping now</h3><div style="font-size:11px">${inSeasonNow().slice(0, 6).map(it => `<div><a href="${iurl(it.id)}">${esc(it.name)}</a> ${rw(it.r)}</div>`).join('') || 'No seasonal things right now. Something spooky is coming in late October...'}</div></div></div>`;
  }
  const inSeasonNow = () => C.ITEMS.filter(it => it.sea && C.inSeason(it, md())).sort((a, b) => b.r - a.r);
  function foot() {
    return `<div class="lx-foot"><div class="lx-88s">${['btn.loot', 'btn.love99', 'btn.56k', 'btn.800', 'btn.y2k'].map(id => ART.btn(id)).join('')}</div>Lootlings is a JackNet site. &copy; 1999 Lootlings Ltd. (a Snorb, a Pibble and a shoebox). <a href="${H}/parents.html">For Moms and Dads</a> &middot; <a href="${H}/help.html">Help</a><br>No real money. No mystery boxes. No nonsense. Best viewed with JackNet Explorer 5 at 800 x 600.</div>`;
  }
  function page(P, on, main, noSide) {
    P.el.innerHTML = `${head(on)}<div class="lx-wrap"><div class="lx-main">${main}</div>${noSide ? '' : side()}</div>${foot()}`;
    wireCommon(P);
  }
  function feedHtml(list) { return list.length ? list.slice(0, 8).map(e => { const it = C.ITEM[e.id]; return it ? `<div>${L.pic(e.id)}<span><b>${esc(e.n)}</b> found <a href="${iurl(e.id)}">${esc(it.name)}</a>${e.s ? ` #${e.s}` : ''}</span></div>` : ''; }).join('') : 'Nothing shiny yet today. Go and find something!'; }
  let feedCache = [];
  function wireCommon(P) {
    P.qa('[data-chest]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); sfx('click'); L.open(b.dataset.chest); }));
    P.qa('[data-join]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); if (window.JackNetWeb) JackNetWeb.logon(); else if (window.Guest) Guest.need('Collecting things on Lootlings'); }));
    const f = P.q('[data-feed]');
    if (f) { if (feedCache.length) f.innerHTML = feedHtml(feedCache); Net.send({ t: 'lootHof' }); }
  }
  // live feed for every page
  L.on('lootHof', m => { feedCache = m.feed || []; const live = L.page(); const f = live && live.el.querySelector('[data-feed]'); if (f) f.innerHTML = feedHtml(feedCache); });
  L.on('feed', e => { feedCache.unshift(e); feedCache = feedCache.slice(0, 20); const live = L.page(); const f = live && live.el.querySelector('[data-feed]'); if (f) f.innerHTML = feedHtml(feedCache); });

  // ================================================================ HOME
  const SAYS = ["Hello! I'm Snorb. I sniff out LOOT. There's loot all over this computer, you know.", 'Psst! Things drop when you play games, post, chat, surf and find secrets. Even feeding Gubbinz!', 'Every day the postman brings you a FREE parcel. What will be inside? Not even I know!', "No mystery boxes here! Rupees only buy the thing you pick. Random things come from PLAYING.", 'Rarest of all is JACKPOT. It shines every colour. Only ten of each will ever exist!', 'Collect a whole set and you get a big prize. I like prizes. I like snacks more.', "My favourite game is the one with the falling blocks. I always wait for the long thin one. It never comes.", "Dave's cousin says you can swap Lootlings over a link cable. You can't! Use the Trading Post."];
  route('/', P => {
    const ph = phase(), d = md();
    const todays = C.ITEMS.filter(i => !i.ex && i.r <= 3)[C.hash('iotd' + d) % C.ITEMS.filter(i => !i.ex && i.r <= 3).length];
    const news = NEWS.filter(n => n[0] <= d).slice(-3).reverse();
    page(P, '/', `<div class="lx-mascot"><button type="button" class="lx-crit" data-tickle="1" aria-label="Snorb the Lootling">${crit('pet.snorb', 96)}</button><div class="lx-say" data-say>${SAYS[0]}</div></div>
      ${ph === 'beta' ? `<div class="lx-msg"><b>Lootlings is in PUBLIC BETA!</b> Everything works, but the paint is still wet. Our <b>GRAND OPENING</b> is on <b>15 November 1999</b>: log on that week for a special Grand Opening Badge. Play before then and you get a Beta Tester badge to prove you were here first!</div>` : ph === 'opening' ? '<div class="lx-msg ok"><b>WE ARE OPEN!!!</b> Lootlings had its Grand Opening on 15 November 1999. Log on this week for the Grand Opening Badge!</div>' : ''}
      <h1>Welcome to Lootlings!</h1>
      <p>Lootlings are little critters who LOVE digging up treasure. On JackNet they dig it up for <b>you</b>: hats, desktop pets, mouse pointers, wallpapers, window colours, JackAmp skins, shiny chat names, 88x31 buttons and <b>JackCards</b>, the trading cards of 1999.</p>
      <h2>How it works</h2><ol><li><b>Play!</b> Almost anything you do on JackNet has a small chance of dropping an item: games, high scores, forum posts, Quiz Night, JackReal Tournament, finding secrets, surfing new sites...</li><li><b>Open your Daily Parcel.</b> The postman brings one free parcel the first time you log on each day.</li><li><b>Wear it!</b> Open your Treasure Chest and put things on: your PC, your Hangout avatar, your profile and your homepage all show them off.</li><li><b>Swap and shop.</b> Trade with friends at the <a href="${H}/trading.html">Trading Post</a>, buy and sell on the <a href="${H}/bazaar.html">Bazaar</a>, or visit the <a href="${H}/shops.html">shopkeepers</a>.</li><li><b>Collect the sets</b> for big prizes, and get into the <a href="${H}/museum.html">Museum</a>!</li></ol>
      <h2>Item of the Day</h2><div class="lx-itemhead">${L.pic(todays.id, { big: true })}<div class="lx-ih"><b style="font-size:16px"><a href="${iurl(todays.id)}">${esc(todays.name)}</a></b><br>${rw(todays.r)} &middot; ${esc(C.TYPES[todays.type][0])}<p>${esc(todays.d)}</p></div></div>
      <h2>Latest news</h2><div class="lx-news">${news.map(newsItem).join('')}</div><p><a href="${H}/news.html">All the news &raquo;</a></p>`);
    let n = 0;
    P.q('[data-tickle]').addEventListener('click', () => { n++; sfx('boing'); P.q('[data-say]').textContent = n >= 5 ? 'HEE HEE HEE! Stop it! I\'m ticklish! OK OK, here\'s a secret: type "snorb" in Start > Run.' : SAYS[n % SAYS.length]; if (n === 5) A.secret('loot.mascot'); });
  });

  // ================================================================ NEWS (through the 1999 calendar; only what has happened so far)
  const NEWS = [
    [101, 'Happy New Year 1999!', 'The Euro launched today (for banks: the coins and notes come later). At Lootlings HQ (a shoebox under Pibble\'s bed) we are building something. Something SHINY.'],
    [207, 'Valentine Heart Boxes!', 'Until 16 February, Valentine Heart Boxes can drop from anything you do. They are full of chocolates. Well, they were. Grumplet got there first.'],
    [216, 'Pancake Day!', 'It is Shrove Tuesday! Golden Frying Pans drop until 18 February. Toss responsibly.'],
    [329, 'Golden Eggs hidden!', 'Easter Sunday is 4 April this year. Until 11 April, Golden Eggs are hidden all over JackNet. Only 150 will ever exist!'],
    [517, 'New JackCard: Screensaver Searching Space', 'From today your PC can help listen for aliens with a special screensaver while you are at school. We made it a JackCard. It is quite rare.'],
    [601, 'LOOTLINGS PUBLIC BETA IS OPEN!', 'You can now find, wear, trade and sell things! It is a beta, so the paint is still wet. Play during the beta and you get a Beta Tester badge.', 1],
    [716, 'Episode I is out!', 'The Phantom Menace is out in UK cinemas today! Until 31 July the "Episode I Queue" JackCard can drop. Dave queued for six hours. Dave says it was worth it. Dave has seen it four times.'],
    [804, 'ECLIPSE WEEK!', 'On 11 August there is a total eclipse of the Sun, and Cornwall is right in the path! Eclipse things are dropping now until 18 August: Eclipse Viewers, the Eclipse Badge, the Total Eclipse wallpaper, the Corona window theme and a JackCard. Remember: NEVER look at the Sun without proper eclipse glasses.', 1],
    [811, 'TODAY IS ECLIPSE DAY!', 'At about 11 minutes past 11 this morning the Moon covered the Sun and Cornwall went dark for two minutes. The birds stopped singing. Fizzwick screamed. Snorb slept through it. Eclipse things drop until 18 August.', 1],
    [915, 'Conker season!', 'Conkers are falling! Champion Conkers and the Conker Season wallpaper drop until the end of October. No baking them in the oven (that is cheating).'],
    [1005, 'Pokemon fever!', 'Pokemon Red and Blue are out in the UK today! Everyone at school has a link cable. Our "Pokemon Fever" JackCard drops until 19 October.'],
    [1014, 'A games console with a MODEM!', 'A brand new console came out in the UK today, and it has a modem built in. Online games on the telly! The "Console With a Modem" JackCard drops until 28 October.'],
    [1016, 'The Bazaar is open!', 'You can now sell your spare things to other members on the Bazaar, for whatever price you like. The Bazaar keeps a tiny 5% fee, which vanishes in a puff of Snorb. And the Trading Post lets you swap safely: nothing moves until you both tick OK.'],
    [1020, 'Lootlings Games Night!', 'Fizzwick wired four computers together with a VERY long cable for a games night. Snorb won at falling blocks, Crumbit won at kart racing and Moggle beat everyone at chess. Grumplet lost at everything and says he let everyone win. Remember: Arcade high scores can dig up loot too!'],
    [1024, 'SPOOKY SEASON!', 'Witch\'s Hats, Pumpkin Heads, Ghost Snorbs, masks, bats and more drop until 2 November. Collect the whole Spooky Season set for a big prize!', 1],
    [1031, 'Happy Halloween!', 'Trick or treat! Ghost Snorb says "wooo". It is not scary. It is just a bit see-through.'],
    [1101, 'Remember, remember...', 'Bonfire Night things drop until 7 November: the Bonfire Bobble, Firework Badge, Fireworks wallpaper, a JackCard and Sparklers. Hold your sparkler at arm\'s length and wear gloves!'],
    [1105, 'Bonfire Night!', 'Ooh! Aah! The whole of Jacktown is down the field watching the fireworks. Grumplet brought a flask of soup. He says he is not enjoying it. He is.'],
    [1115, 'THE GRAND OPENING!!!', 'Lootlings is OFFICIALLY OPEN! Thank you to every beta tester. Log on this week (until 21 November) for the special Grand Opening Badge. Pibble has made a cake. It is mostly paint.', 1],
    [1201, 'Christmas is coming!', 'All through December: Santa Hats, Reindeer Antlers, beards, Snow Pibbles, candy cane pointers, snow wallpaper and the Christmas Stocking set. Snow Pibbles are limited to 150, so keep playing!', 1],
    [1210, 'Dear Father Christmas...', 'Every Lootling has written a Christmas list. Snorb wants a games console, a virtual pet, a yo-yo, a LEGO spaceship and "snacks". Fizzwick wants more RAM. Pibble wants paint. Grumplet says he wants nothing. (He wants a Rubik\'s Cube.)'],
    [1225, 'Merry Christmas!', 'Merry Christmas from all the Lootlings! Snorb ate all the mince pies. Snorb is now asleep under the tree.'],
    [1227, 'The Millennium is nearly here!', 'Millennium Party Hats, the Y2K Survivor Badge, the Millennium Countdown Clock and the Millennium Eve JackCard drop until the 31st. Is your computer Y2K ready? Robo-Snorb 2000 is (probably).', 1],
    [1231, 'MILLENNIUM EVE!', 'The last day of 1999. Tonight is the biggest New Year\'s Eve of all time! Whatever happens at midnight, your Lootlings stuff is safe in your Treasure Chest. (We checked. Twice.)', 1],
  ];
  const newsItem = n => `<div class="lx-nitem${n[3] ? ' big' : ''}"><div class="lx-nd">${mdTxt(n[0])}</div><b>${esc(n[1])}</b><br>${esc(n[2])}</div>`;
  route('/news.html', P => {
    const d = md(), past = NEWS.filter(n => n[0] <= d).reverse();
    const next = [[716, 'Episode I'], [804, 'Eclipse week'], [915, 'Conker season'], [1005, 'Pokemon fever'], [1024, 'Spooky season'], [1101, 'Bonfire Night'], [1115, 'THE GRAND OPENING'], [1201, 'Christmas'], [1227, 'The Millennium']].filter(x => x[0] > d).slice(0, 3);
    page(P, '/news.html', `<h1>Lootlings News</h1><p>Everything that's happened on Lootlings in 1999 so far. Seasonal things only drop at the right time of year, so keep checking!</p>${next.length ? `<div class="lx-msg"><b>Coming up:</b> ${next.map(x => `${esc(x[1])} (${mdTxt(x[0])})`).join(' &middot; ')}</div>` : ''}<div class="lx-news">${past.map(newsItem).join('')}</div>`);
    if (d >= 811) A.secret('loot.eclipse');
  });

  // ================================================================ ITEM DATABASE
  let DB = null;
  L.on('lootDb', m => { DB = m; const live = L.page(); if (live && live.el.querySelector('[data-db]')) live.el.querySelectorAll('[data-db]').forEach(e => { const id = e.dataset.db, it = C.ITEM[id], n = (m.ct[id] | 0); e.textContent = it.lim ? `${fmt(m.ser[id] | 0)} of ${fmt(it.lim)} found` : `${fmt(n)} found`; }); });
  const found = id => { if (!DB) return '...'; const it = C.ITEM[id]; return it.lim ? `${fmt(DB.ser[id] | 0)} of ${fmt(it.lim)} found` : `${fmt(DB.ct[id] | 0)} found`; };
  route('/items.html', P => {
    const t = C.TYPES[P.arg] ? P.arg : '', R = [];
    const list = C.ITEMS.filter(i => !t || i.type === t).sort((a, b) => a.r - b.r || a.name.localeCompare(b.name));
    page(P, '/items.html', `<h1>The Item Database</h1><p>Every single thing a Lootling can dig up: ${fmt(C.ITEMS.length)} of them. ${member() ? 'Things you own have a gold star.' : ''}</p>
      <div class="lx-filters"><a href="${H}/items.html" class="${t ? '' : 'on'}">Everything</a>${C.TYPE_ORDER.map(k => `<a href="${H}/items/${k}.html" class="${t === k ? 'on' : ''}">${esc(C.TYPES[k][0])}</a>`).join('')}</div>
      ${t ? `<p><i>${esc(C.TYPES[t][2])}</i></p>` : ''}
      <div class="lx-items">${list.map(it => `<a class="lx-icard" href="${iurl(it.id)}">${L.pic(it.id)}<b>${L.have(it.id) ? '&#9733; ' : ''}${esc(it.name)}</b>${rw(it.r)}<small data-db="${esc(it.id)}">${found(it.id)}</small>${it.sea ? `<small>Seasonal${C.inSeason(it, md()) ? ': <b>dropping now!</b>' : ''}</small>` : it.ex ? '<small>Prize only</small>' : ''}</a>`).join('')}</div>`, true);
    Net.send({ t: 'lootDb' }); void R;
  });
  route('/item/', P => {
    const it = C.ITEM[P.arg]; if (!it) { page(P, '/items.html', '<h1>Item not found</h1><p>That item does not exist. Yet.</p>'); return; }
    const sets = C.SETS.filter(s => s.items && s.items.includes(it.id)), achs = C.ACH.filter(a => a.give === it.id), setG = C.SETS.filter(s => s.give === it.id);
    const how = [];
    if (it.ex) how.push(`A prize only: ${[...setG.map(s => `complete the <b>${esc(s.n)}</b> set`), ...achs.map(a => `the <b>${esc(a.n)}</b> achievement (${esc(a.d)})`)].join(' or ')}.`);
    else how.push(it.sea ? `Drops from playing, but ONLY from ${C.md2txt(it.sea[0])} to ${C.md2txt(it.sea[1])}.${C.inSeason(it, md()) ? ' <b>It is dropping right now!</b>' : ''}` : 'Drops from playing almost anything on JackNet, and from Daily Parcels and Missions.');
    if (it.shop) how.push(`Sometimes on the shelf at <a href="${H}/shop/${it.shop}.html">${esc(C.SHOPS[it.shop].n)}</a> for <b>${teef(it.price || C.PRICE[it.r], true)}</b> (stock changes every day).`);
    if (!it.ex && it.r >= 1) how.push(`Or make it in the Combinator from five ${C.RAR[it.r - 1].n} things.`);
    page(P, '/items.html', `<div class="lx-crumb"><a href="${H}/items.html">Item Database</a> &gt; <a href="${H}/items/${it.type}.html">${esc(C.TYPES[it.type][0])}</a> &gt; <b>${esc(it.name)}</b></div>
      <div class="lx-itemhead">${L.pic(it.id, { big: true })}<div class="lx-ih"><h1 style="margin:0">${esc(it.name)}</h1>${rw(it.r)} &middot; ${esc(C.TYPES[it.type][0])}<p>${esc(it.d)}</p><p style="font-size:12px">${esc(C.TYPES[it.type][2])}</p></div></div>
      ${it.type === 'card' ? `<p>${ART.card(it.id).replace('<svg ', '<svg width="180" height="252" ')}</p>` : it.type === 'btn' ? `<p>${ART.btn(it.id)}</p>` : ''}
      <h2>How to get one</h2><ul>${how.map(x => `<li>${x}</li>`).join('')}</ul>
      <h2>Facts</h2><table class="lx-tbl"><tr><td>Rarity</td><td>${rw(it.r)} (worth ${C.RAR[it.r].pts} collection points; recycles for ${teef(C.RAR[it.r].rec, true)})</td></tr><tr><td>How many</td><td data-db="${esc(it.id)}">${found(it.id)}</td></tr>${it.lim ? `<tr><td>Limited edition</td><td>Only ${fmt(it.lim)} will EVER exist. Each one has a serial number.</td></tr>` : ''}${sets.length ? `<tr><td>Part of</td><td>${sets.map(s => `<a href="${H}/collections.html">${esc(s.n)}</a>`).join(', ')}</td></tr>` : ''}${L.have(it.id) ? `<tr><td>You</td><td><b>&#9733; You have ${L.count(it.id)}!</b> <a href="#" data-chest="stuff">Open Treasure Chest</a></td></tr>` : ''}</table>
      <h2>On the Bazaar</h2><div data-mkt>Checking the Bazaar...</div>`);
    P.on('lootMkt', m => { const box = P.q('[data-mkt]'); if (!box) return; const l = m.list.filter(x => x.it.id === it.id); box.innerHTML = l.length ? `<table class="lx-tbl">${l.map(x => `<tr><td>${esc(x.n)}</td><td>${x.it.s ? '#' + x.it.s : ''}</td><td>${teef(x.p)}</td></tr>`).join('')}</table><p><a href="${H}/bazaar.html">Go to the Bazaar &raquo;</a></p>` : 'Nobody is selling one right now.'; });
    Net.send({ t: 'lootDb' }); Net.send({ t: 'lootMkt', type: it.type });
  });

  // ================================================================ SHOPS (specific things for Rupees, never a random box)
  route('/shops.html', P => {
    page(P, '/shops.html', `<h1>The Shopkeepers</h1><p>Four Lootlings run little shops. Each one puts a few things on the shelf every morning (Common, Uncommon or Rare). You see exactly what you're buying and pay the price on the label. <b>There are no mystery boxes anywhere on Lootlings.</b></p>
      <div class="lx-shopk">${Object.entries(C.SHOPS).map(([k, s]) => `<a class="lx-shopc" href="${H}/shop/${k}.html">${crit({ pibble: 'pet.pibble', grumplet: 'pet.grumplet', fizzwick: 'pet.fizzwick', snorb: 'pet.snorb' }[k], 56)}<span><b>${esc(s.n)}</b><br><small>${s.types.map(t => esc(C.TYPES[t][0])).join(', ')}</small></span></a>`).join('')}</div>
      <p>Prices: Common ${fmt(C.PRICE[0])}, Uncommon ${fmt(C.PRICE[1])}, Rare ${fmt(C.PRICE[2])} Rupees. Epic, Legendary and Jackpot things are never sold in shops: you have to find them (or trade for them)!</p>`);
  });
  route('/shop/', P => {
    const k = P.arg, S = C.SHOPS[k]; if (!S) { page(P, '/shops.html', '<h1>Closed</h1><p>That shop has shut. A Grumplet sat on it.</p>'); return; }
    const who = { pibble: 'pet.pibble', grumplet: 'pet.grumplet', fizzwick: 'pet.fizzwick', snorb: 'pet.snorb' }[k];
    page(P, '/shops.html', `<div class="lx-mascot"><button type="button" class="lx-crit" data-crit="1" aria-label="${esc(S.who)}">${crit(who, 96)}</button><div class="lx-say" data-say><b>${esc(S.who)}:</b> ${esc(S.hello)}</div></div><h1>${esc(S.n)}</h1><p>On the shelf today (new stock every morning):</p><div class="lx-stock" data-stock>Unlocking the shop...</div><div data-msg hidden></div>`);
    let sm = 0;
    P.q('[data-crit]').addEventListener('click', () => { sm++; sfx('pet'); if (k === 'grumplet' && sm >= 3) { P.q('[data-say]').innerHTML = '<b>Grumplet:</b> ...fine. FINE. *smiles a tiny bit* Don\'t tell anyone.'; A.secret('loot.grumpy'); } else P.q('[data-say]').innerHTML = `<b>${esc(S.who)}:</b> ${esc(['Can I help you?', 'Lovely day for shopping!', 'Everything is the price on the label. No haggling. No mystery boxes.', S.hello][sm % 4])}`; });
    P.on('lootShop', m => {
      if (m.k !== k) return; const box = P.q('[data-stock]'); if (!box) return;
      box.innerHTML = m.stock.length ? m.stock.map(([id, price]) => { const it = C.ITEM[id]; return `<div class="lx-icard">${L.pic(id)}<b><a href="${iurl(id)}">${esc(it.name)}</a></b>${rw(it.r)}<span class="lx-pr">${teef(price, true)}</span>${L.have(id) ? `<small>&#9733; you have ${L.count(id)}</small>` : ''}<button type="button" data-buy="${esc(id)}" data-price="${price}">Buy it</button></div>`; }).join('') : '<p>The shelves are empty today. Come back tomorrow!</p>';
      P.qa('[data-buy]').forEach(b => b.addEventListener('click', () => {
        if (window.Guest && !Guest.need('Shopping on Lootlings')) return;
        const id = b.dataset.buy, it = C.ITEM[id];
        Desk.msgbox(S.n, `Buy the ${it.name} for ${rp(+b.dataset.price)}?`, 'q', [['Buy', () => { b.disabled = true; Net.send({ t: 'lootShopBuy', k, id }); }], ['No thanks']]);
      }));
    });
    P.on('got', m => { if (m.src !== 'shop') return; const it = C.ITEM[m.its[0].id]; P.say('[data-msg]', `<b>${esc(S.who)}:</b> "Thank you! Here's your ${esc(it.name)}." It's in your Treasure Chest. <a href="#" data-chest2="1">Open it</a>`, true); const a = P.q('[data-chest2]'); if (a) a.addEventListener('click', ev => { ev.preventDefault(); L.open('stuff'); }); A.secret('loot.shop'); sfx('solve'); Net.send({ t: 'lootShop', k }); });
    P.on('err', msg => { P.say('[data-msg]', `<b>${esc(S.who)}:</b> ${esc(msg)}`); P.qa('[data-buy]').forEach(b => { b.disabled = false; }); });
    Net.send({ t: 'lootShop', k });
  });

  // ================================================================ THE BAZAAR (fixed prices, set by members)
  route('/bazaar.html', P => {
    const st = { type: '', r: '' };
    page(P, '/bazaar.html', `<h1>The Bazaar</h1><p>Members sell their spare things here for a price they choose. See something you like? Buy it with Rupees and it goes straight into your Treasure Chest. Sellers get the Rupees straight away, minus a tiny ${C.RULES.feePct}% Bazaar fee (it vanishes, which keeps Rupees special).</p>
      <p><a href="${H}/sell.html"><b>Sell something &raquo;</b></a></p><div class="lx-filters" data-fl></div><div data-msg hidden></div><div data-list>Asking the stallholders...</div><h2>Just sold</h2><div data-sold></div>`);
    const fl = () => { P.q('[data-fl]').innerHTML = `<a href="#" data-t="" class="${st.type ? '' : 'on'}">Everything</a>${C.TYPE_ORDER.map(k => `<a href="#" data-t="${k}" class="${st.type === k ? 'on' : ''}">${esc(C.TYPES[k][0])}</a>`).join('')}`; P.qa('[data-t]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); st.type = a.dataset.t; fl(); ask(); })); };
    const ask = () => Net.send({ t: 'lootMkt', type: st.type || undefined });
    P.on('lootMkt', m => {
      const box = P.q('[data-list]'); if (!box) return;
      const mine = member() ? m.list.filter(x => x.n === Net.me.nick) : [];
      box.innerHTML = m.list.length ? `<div class="lx-stock">${m.list.map(x => { const it = C.ITEM[x.it.id]; const own = member() && x.n === Net.me.nick; return `<div class="lx-icard">${L.pic(x.it.id, { serial: x.it.s })}<b><a href="${iurl(x.it.id)}">${esc(it.name)}</a></b>${rw(it.r)}<span class="lx-pr">${teef(x.p, true)}</span><small>from ${esc(x.n)}</small>${own ? `<button type="button" data-down="${x.id}">Take it down</button>` : `<button type="button" data-bz="${x.id}" data-p="${x.p}" data-n="${esc(it.name)}">Buy it</button>`}</div>`; }).join('')}</div><p>${fmt(m.n)} things for sale.${mine.length ? ` You are selling ${mine.length}.` : ''}</p>` : '<p>Nothing for sale right now. Be the first! <a href="' + H + '/sell.html">Sell something</a></p>';
      const sold = P.q('[data-sold]'); if (sold) sold.innerHTML = m.sold.length ? `<table class="lx-tbl">${m.sold.map(s => `<tr><td>${esc(s.from)} sold <a href="${iurl(s.id)}">${esc(s.n)}</a>${s.s ? ' #' + s.s : ''} to ${esc(s.by)}</td><td>${teef(s.p)}</td></tr>`).join('')}</table>` : '<p>Nothing sold yet.</p>';
      P.qa('[data-bz]').forEach(b => b.addEventListener('click', () => {
        if (window.Guest && !Guest.need('Buying on the Bazaar')) return;
        Desk.msgbox('The Bazaar', `Buy the ${b.dataset.n} for ${rp(+b.dataset.p)}?`, 'q', [['Buy it', () => { b.disabled = true; Net.send({ t: 'lootBuy', id: +b.dataset.bz }); }], ['No thanks']]);
      }));
      P.qa('[data-down]').forEach(b => b.addEventListener('click', () => Net.send({ t: 'lootUnsell', id: +b.dataset.down })));
    });
    P.on('lootDone', m => { if (m.what === 'buy') { const it = C.ITEM[m.it.id]; P.say('[data-msg]', `<b>You bought the ${esc(it.name)}!</b> It's in your Treasure Chest.`, true); A.secret('loot.bazaar'); sfx('solve'); } });
    P.on('lootMktCh', ask);
    P.on('err', msg => { P.say('[data-msg]', esc(msg)); ask(); });
    fl(); ask();
  });
  route('/sell.html', P => {
    const draw = () => {
      const me = L.me;
      if (!member() || !me) { page(P, '/bazaar.html', `<h1>Sell on the Bazaar</h1><div class="lx-guest">Selling on the Bazaar is for JackNet members. <a href="#" data-join="1">Join / Log On</a></div>`); return; }
      const free = me.it.filter(x => !x.lk);
      page(P, '/bazaar.html', `<div class="lx-crumb"><a href="${H}/bazaar.html">The Bazaar</a> &gt; <b>Sell something</b></div><h1>Sell something</h1><p>Click a thing to put it up for sale. You choose the price. You can have up to ${C.RULES.listMax} things for sale at once, and you can take them down any time. While it's for sale you can't wear or trade it.</p><div data-msg hidden></div>
        <div class="lx-items">${free.length ? free.map(x => { const it = C.ITEM[x.id]; return `<button type="button" class="lx-icard" data-sellu="${x.u}">${L.pic(x.id, { serial: x.s })}<b>${esc(it.name)}</b>${rw(it.r)}</button>`; }).join('') : '<p>You have nothing to sell yet. Go and find something!</p>'}</div>`);
      P.qa('[data-sellu]').forEach(b => b.addEventListener('click', () => {
        const x = me.it.find(y => y.u === +b.dataset.sellu), it = C.ITEM[x.id];
        Desk.ask('Sell on the Bazaar', `Price for your ${it.name}, in Rupees? (Things like this usually go for about ${fmt([30, 90, 250, 700, 2000, 8000][it.r])}.)`, String([30, 90, 250, 700, 2000, 8000][it.r]), 7, v => { const p = Math.floor(+v); if (p >= 1) Net.send({ t: 'lootSell', u: x.u, price: p }); });
      }));
    };
    P.on('me', draw);
    P.on('lootDone', m => { if (m.what === 'sell') { A.secret('loot.sell'); draw(); P.say('[data-msg]', `<b>It's on the Bazaar!</b> <a href="${H}/bazaar.html">See it there</a>.`, true); } });
    P.on('err', msg => P.say('[data-msg]', esc(msg)));
    draw(); Net.send({ t: 'lootMe' });
  });

  // ================================================================ TRADING POST
  route('/trading.html', P => {
    page(P, '/trading.html', `<h1>The Trading Post</h1><div class="lx-mascot">${crit('pet.moggle', 72)}<div class="lx-say"><b>Moggle:</b> Purrr. Swapping is safe here! Both of you put things in (and Rupees if you like), then you BOTH tick OK. If anybody changes anything, the ticks come off again. Nothing moves until you both agree.</div></div>
      <h2>How to trade</h2><ol><li>Open your <a href="#" data-chest="trade">Treasure Chest &gt; Trading Post</a>.</li><li>Type your friend's JackNet name and press <b>Start trade</b>.</li><li>Both of you pick what to give. Look carefully at what you get!</li><li>Both tick <b>OK</b>. Done! It all swaps at the same moment.</li></ol>
      <p>Limits (to keep it fair): up to ${C.RULES.tradeItems} things each side, ${C.RULES.tradeMax} trades open at once, and Rupees in trades count towards the ${C.RULES.payDayMax} Rupees a day you can send. Want to just send Rupees? Use <a href="#" data-url="http://www.jacknetbank.webcom/pay.html">JackNet Bank: Pay Someone</a>.</p>
      <h2>Your trades</h2><div data-trades>${member() ? 'Looking...' : '<div class="lx-guest">Trading is for JackNet members. <a href="#" data-join="1">Join / Log On</a></div>'}</div>`);
    P.qa('[data-url]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); if (window.Econ) Econ.go(a.dataset.url); }));
    P.on('lootTrades', m => { const b = P.q('[data-trades]'); if (b) b.innerHTML = m.list.length ? `<table class="lx-tbl"><tr><th>#</th><th>With</th><th>You give</th><th>You get</th><th></th></tr>${m.list.map(t => `<tr><td>${t.id}</td><td>${esc(t.theirs.name)}</td><td>${t.mine.items.map(x => esc(C.ITEM[x.id].name)).join(', ') || '-'}${t.mine.teef ? ` + ${teef(t.mine.teef, true)}` : ''}</td><td>${t.theirs.items.map(x => esc(C.ITEM[x.id].name)).join(', ') || '-'}${t.theirs.teef ? ` + ${teef(t.theirs.teef, true)}` : ''}</td><td>${t.st === 'open' ? '<a href="#" data-chest="trade">open</a>' : t.st === 'done' ? '<b>done</b>' : 'cancelled'}</td></tr>`).join('')}</table>` : '<p>No trades yet.</p>'; wireCommon(P); });
    if (member()) Net.send({ t: 'lootTList' });
  });

  // ================================================================ COLLECTIONS, MUSEUM, TOP COLLECTORS, MISSIONS
  route('/collections.html', P => {
    const draw = () => {
      const me = L.me, have = new Set(me ? me.it.map(x => x.id) : []), rs = new Set(me ? me.it.map(x => C.ITEM[x.id].r) : []);
      page(P, '/collections.html', `<h1>Collections</h1><p>Own one of everything in a set and you win the prize straight away. You keep the prize even if you trade something away later.</p><div class="lx-sets">${C.SETS.map(s => { const done = me && me.sets[s.id]; return `<div class="lx-set${done ? ' done' : ''}"><b>${done ? '&#9733; ' : ''}${esc(s.n)}</b> &middot; Prize: ${teef(s.teef, true)}${s.give ? ` + <a href="${iurl(s.give)}">${esc(C.ITEM[s.give].name)}</a>` : ''}<br><small>${esc(s.d)}</small><div class="lx-setitems">${s.rar ? C.RAR.map((r, i) => `<span class="lx-tile lx-r${i}${rs.has(i) ? '' : ' miss'}" title="${r.n}"><b style="font-size:9px">${r.n}</b></span>`).join('') : s.items.map(id => `<a href="${iurl(id)}">${L.pic(id, { cls: have.has(id) ? '' : 'miss' })}</a>`).join('')}</div></div>`; }).join('')}</div>`);
    };
    P.on('me', draw); draw();
  });
  route('/museum.html', P => {
    page(P, '/museum.html', `<h1>The Museum of Rare Things</h1><p>The rarest things anyone on JackNet owns, on little velvet cushions. Epic and better only. (No touching. Grumplet is the security guard.)</p><div class="lx-museum" data-mus>Unlocking the display cases...</div>`);
    A.secret('loot.museum');
    P.on('lootHof', m => { const b = P.q('[data-mus]'); if (!b) return; b.innerHTML = m.rare.length ? m.rare.map(x => { const it = C.ITEM[x.it.id]; return `<div class="lx-plinth">${L.pic(x.it.id, { big: true, serial: x.it.s })}<b><a href="${iurl(x.it.id)}">${esc(it.name)}</a></b>${rw(it.r)}${x.it.s ? `<span>#${x.it.s} of ${it.lim}</span>` : ''}<span>owned by <b>${esc(x.n)}</b></span></div>`; }).join('') : '<p>The cases are empty! Nobody has found anything Epic yet. Will it be you?</p>'; });
    Net.send({ t: 'lootHof' });
  });
  route('/top.html', P => {
    page(P, '/top.html', `<h1>Top Collectors</h1><p>Collection score: every DIFFERENT thing you own scores points (Common 1, Uncommon 3, Rare 10, Epic 30, Legendary 100, Jackpot 500), plus 50 for every set you've completed.</p><div data-top>Counting...</div><h2>Most sets completed</h2><div data-sets></div>`);
    P.on('lootHof', m => {
      const me = member() ? Net.me.nick : '';
      const t = P.q('[data-top]'); if (t) t.innerHTML = m.top.length ? `<table class="lx-tbl"><tr><th>#</th><th>Collector</th><th>Score</th><th>Different things</th><th>Sets</th><th>Found</th></tr>${m.top.map((x, i) => `<tr class="${x.n === me ? 'me' : ''}"><td>${i + 1}</td><td><a href="#" data-prof="${esc(x.n)}">${esc(x.n)}</a></td><td><b>${fmt(x.sc)}</b></td><td>${fmt(x.u)}</td><td>${x.sets}</td><td>${fmt(x.found)}</td></tr>`).join('')}</table><p>${fmt(m.players)} collectors so far.</p>` : '<p>Nobody yet!</p>';
      const s = P.q('[data-sets]'); if (s) s.innerHTML = `<table class="lx-tbl">${m.sets.filter(x => x.sets).map(x => `<tr><td>${esc(x.n)}</td><td>${x.sets} set${x.sets > 1 ? 's' : ''}</td></tr>`).join('') || '<tr><td>No sets completed yet.</td></tr>'}</table>`;
      P.qa('[data-prof]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); if (window.Community && Community.openProfile) Community.openProfile(a.dataset.prof); }));
    });
    Net.send({ t: 'lootHof' });
  });
  route('/missions.html', P => {
    const draw = () => {
      const me = L.me;
      page(P, '/missions.html', `<h1>Daily Missions</h1><p>Three missions every day, different for everyone. Finish one for Rupees (and maybe an item); finish all three for a bonus ${teef(C.MISSION_BONUS, true)} and a bonus item. <b>Missed a day? That's fine!</b> Nothing is ever taken away, and tomorrow brings three new ones.</p>
        ${member() && me && me.mis ? me.mis.l.map(x => { const d = C.MISS[x.id] || { n: x.id, need: 1 }; return `<div class="lx-mis${x.done ? ' done' : ''}"><span class="lx-tick">${x.done ? '&#10003;' : ''}</span><div><div class="lx-mn">${esc(d.n)}</div><span class="lx-prog"><i style="width:${Math.round(x.n / d.need * 100)}%"></i></span></div><b>+${teef(x.teef, true)}</b></div>`; }).join('') + (me.mis.bonus ? '<p><b>ALL THREE DONE TODAY! You are a superstar.</b></p>' : '') : '<div class="lx-guest">Missions are for JackNet members. <a href="#" data-join="1">Join / Log On</a></div>'}
        <h2>Achievements</h2><div class="lx-achs">${C.ACH.map(a => `<div class="lx-ach${me && me.ach[a.id] ? ' got' : ''}"><span class="lx-am">${me && me.ach[a.id] ? '&#9733;' : '&#9734;'}</span><div><b>${esc(a.n)}</b><br>${esc(a.d)}${a.teef ? ` (+${teef(a.teef, true)})` : ''}${a.give ? ` + ${esc(C.ITEM[a.give].name)}` : ''}</div></div>`).join('')}</div>`);
      if (me && me.mis && me.mis.bonus) A.secret('loot.missions');
    };
    P.on('me', draw); P.on('mis', draw); draw(); if (member()) Net.send({ t: 'lootMe' });
  });

  // ================================================================ MEET THE LOOTLINGS, HELP, PARENTS
  route('/creatures.html', P => {
    const BIO = { snorb: 'Round, blue and always sniffing. Snorbs can smell loot through three floors and a carpet. They are also always hungry.', crumbit: 'Made mostly of biscuit. Very brave, except near cups of tea.', pibble: 'A pink painter with floppy ears. Runs Pibble\'s Paint Pots. Everything she owns has paint on it.', grumplet: 'Green and grumpy. Says "hmph" a lot. Runs the Junk Shed. Secretly the nicest one.', fizzwick: 'A yellow inventor who crackles. Built the Combinator. Has exploded 41 times (on purpose, mostly).', moggle: 'Half cat, half cloud. Purrs in 56K. Looks after the Trading Post.' };
    page(P, '/creatures.html', `<h1>Meet the Lootlings!</h1><p>These are the six Lootlings. You can find all of them as desktop pets (they run about on your taskbar!). Collect all six for the Lootlings Gang set.</p>
      <div class="lx-crits">${Object.keys(BIO).map(k => `<div class="lx-critc"><button type="button" class="lx-crit" style="background:none;border:0;padding:0;min-height:0" data-c="${k}">${crit('pet.' + k, 64)}</button><div><b><a href="${iurl('pet.' + k)}">${esc(C.ITEM['pet.' + k].name)}</a></b> ${rw(C.ITEM['pet.' + k].r)}<br><small>${esc(BIO[k])}</small></div></div>`).join('')}</div>
      <h2>Very special Lootlings</h2><div class="lx-items">${['pet.ghost', 'pet.snowpib', 'pet.robo', 'pet.gold', 'pet.rainbow'].map(id => `<a class="lx-icard" href="${iurl(id)}">${L.pic(id)}<b>${esc(C.ITEM[id].name)}</b>${rw(C.ITEM[id].r)}</a>`).join('')}</div>`);
    let g = 0;
    P.qa('[data-c]').forEach(b => b.addEventListener('click', () => { sfx('pet'); if (b.dataset.c === 'grumplet' && ++g >= 3) { A.secret('loot.grumpy'); Desk.toast('Grumplet', '...fine. *smiles a tiny bit* Don\'t tell anyone.', 4000); } }));
  });
  route('/help.html', P => {
    page(P, '/help.html', `<h1>Help!</h1><dl class="sh-faq">
      <dt>What is Lootlings?</dt><dd>A free collecting game for JackNet members. Little critters (Lootlings) find things for you while you play on JackNet. Wear them, collect them, swap them and show them off.</dd>
      <dt>How do I find things?</dt><dd>Just play! Almost everything has a small chance of dropping something: arcade high scores, forum posts, the chat room, finding secrets, Quiz Night, JackReal Tournament, solving the shared cube, looking after Gubbinz, surfing to new web sites, trying new programs, installing software, Solitaire, the Games Cupboard... You can find up to ${C.RULES.dropsPerDay} things a day like this. On top of that you get a <b>Daily Parcel</b>, and Daily Missions can give you things too.</dd>
      <dt>What do the colours mean?</dt><dd>Rarity! ${C.RAR.map((r, i) => rw(i)).join(', ')}. Rarer things shine more: Epic things sparkle, Legendary things glow gold and Jackpot things shimmer in every colour.</dd>
      <dt>What's the number on some things?</dt><dd>A serial number. Some things are <b>limited</b>: only 10, 50, 100... will ever exist, and each one is numbered, like "#3 of 50". Once they're all found, that's it forever!</dd>
      <dt>Can I buy mystery boxes?</dt><dd><b>NO.</b> Never. Rupees only buy exactly the thing you choose, from a shopkeeper or from another member on the Bazaar. Random things only come from playing.</dd>
      <dt>What if I miss a day?</dt><dd>Nothing happens! You never lose anything. Your log-on streak just pauses, and unopened parcels wait for you (up to ${C.RULES.parcelsMax}).</dd>
      <dt>What's the Combinator?</dt><dd>Put in five things of the same rarity and get ONE thing of the next rarity up. You choose what comes out.</dd>
      <dt>And recycling?</dt><dd>Don't want something? Recycle it for a few Rupees: ${C.RAR.map((r, i) => `${r.n} ${r.rec}`).join(', ')}.</dd>
      <dt>Is trading safe?</dt><dd>Yes. At the Trading Post nothing moves until both of you tick OK, and changing anything takes the ticks off. On the Bazaar you see exactly what you are buying and the price.</dd>
      <dt>Where do my things show up?</dt><dd>On your PC (wallpaper, pointer, window colours, taskbar pet, JackAmp, Uh-Oh!), in the Hangout (hats, faces, badges), in the Chat Room (name colours), on your JackNet profile and at the bottom of your Homepagez page.</dd></dl>`);
  });
  route('/parents.html', P => {
    page(P, '/parents.html', `<h1>For Moms and Dads</h1><p>Lootlings is a pretend collecting game inside a pretend 1999 computer. Here's what we promise:</p><ul>
      <li><b>No real money. Ever.</b> Rupees are pretend money that you earn by playing. They cannot be bought.</li>
      <li><b>No mystery boxes or gambling for items.</b> You can never pay for a random item. Random things only come from playing, a little at a time.</li>
      <li><b>No pressure.</b> No countdowns, no "only 5 minutes left!", and nothing is ever taken away for not logging on.</li>
      <li><b>Daily limits.</b> Every way of earning has a small daily limit, so there's no point playing for hours to "grind".</li>
      <li><b>Safe swapping.</b> Trades only happen when both people agree. Payments between members have small daily limits.</li>
      <li><b>Kind and silly.</b> It's about collecting daft hats and showing your mates. That's it.</li></ul>
      <p>Pibble's Mom approves. (She checked everything twice.)</p>`, true);
  });

  window.LootWeb = { render, NEWS };
})();

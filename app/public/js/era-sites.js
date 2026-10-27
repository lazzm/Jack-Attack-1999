/* era-sites: famous-1999-website parodies for JackNet Explorer (all original names, art and code).
 * This always-loaded part only registers the sites (IE.addSite), their secrets and a few Run commands.
 * Page bodies live in js/era-sites-*.js and load the first time a page is visited (kit first, then the site's file).
 *   www.jackdot.jnet       Jackdot: news for nerds, stuff dat matters (nerd news + comments + moderation)
 *   www.jackbay.webcom     JackBay: live shared auctions (pretend money)
 *   www.squigwitch.cyb     The Squig Witch Project (mysterious "found footage" site)
 *   www.jackbo.netz        Welcome to Jackbo (you can do anyfing)
 *   www.jackfaqs.w3b       JackFAQs: plain-text game FAQs and walkthroughs
 *   www.aintitkoolnews.infobahn  Ain't It Kool News (film rumours)     www.newjacks.wubwub  cartoon portal
 *   www.webtoyz.kidz       web toys                www.holohut.kidz  card price guide     www.houserobots.cyb  robot fight fan site
 *   www.year3000.cyb       a Futurama fan page     www.jackfax.jnet  teletext */
(function () {
  'use strict';
  const A = window.Apps;
  if (!A || !window.IE || !IE.addSite) return;
  const SITES = window.EraSiteList = [
    // host, file, title, cat, desc, { path: page title }, dynamic path regex (pages made on demand)
    ['www.jackdot.jnet', 'grotdot', 'Jackdot: News for nerds. Stuff that matters.', 'sci', 'The nerd news site. Linucks, chips, space, games and Y2K, with hundreds of comments (scored from -1 to 5).',
      { '/': 0, '/ask.html': 'Ask Jackdot', '/older.html': 'Older Stuff', '/about.html': 'About Jackdot', '/submit.html': 'Submit Story', '/polls.html': 'Past Polls', '/melted.html': 'Server Melted' }, /^\/articles\/[a-z0-9-]+\.html$/],
    ['www.jackbay.webcom', 'bay', 'JackBay - The World\'s Online Marketplace', 'news', 'Online auctions! Bid on an Eggbert (slightly used), Dave\'s pog collection and more. Live, with everyone online. Pretend money only.',
      { '/': 0, '/feedback.html': 'Feedback Forum', '/mybay.html': 'My JackBay', '/help.html': 'Help & Safety', '/sell.html': 'Sell Your Item' }, /^\/item\/[a-z0-9-]+\.html$/],
    ['www.squigwitch.cyb', 'witch', 'The Jack Witch Project', 'weird', 'In October 1998 three film students walked into the Hollow Hill Woods. A year later their footage was found.',
      { '/': 0, '/legend.html': 'The Legend', '/missing.html': 'The Missing', '/footage.html': 'The Footage', '/diary.html': 'The Diary', '/map.html': 'The Map', '/dossier.html': 'Case File', '/truth.html': 'What Really Happened' }],
    ['www.jackbo.netz', 'witch', 'WELCOME TO JACKBO', 'weird', 'This is Jackbo. You can do anything at Jackbo. Anything at all. (Requires plug-in.)', { '/': 0 }],
    ['www.jackfaqs.w3b', 'faq', 'JackFAQs - Video Game FAQs, Walkthroughs and Cheats', 'games', 'Plain text walkthroughs, written by fans, for the games on your PC and the big games of 1999. No pictures. No mercy.',
      { '/': 0, '/submit.html': 'Submit a FAQ', '/board.html': 'Message Board' }, /^\/faq\/[a-z0-9-]+\.txt$/],
    ['www.aintitkoolnews.infobahn', 'fan', "Ain't It Kool News", 'fans', 'Film rumours, spy reports from secret test screenings and scoops nobody asked for. 100% maybe true.',
      { '/': 0, '/scoopers.html': 'Send a Scoop', '/archive.html': 'Archive' }],
    ['www.newjacks.wubwub', 'fan', 'NEWJACKS - Everything, by Everyone (mostly Dave)', 'fun', 'The cartoon portal! Animated cartoons by visitors. Loading... [skip intro]',
      { '/': 0, '/upload.html': 'Submit a Toon' }, /^\/toon\/[a-z0-9-]+\.html$/],
    ['www.webtoyz.kidz', 'fan', 'WEB TOYZ - Fun Stuff For Your Browser', 'fun', 'Dancing robots, a talking robot, virtual bubble wrap and Dress-a-Blobbit. Pointless and brilliant.',
      { '/': 0, '/dance.html': 'The Robot Dance', '/talk.html': 'The Talking Robot', '/bubble.html': 'Virtual Bubble Wrap', '/dress.html': 'Dress-a-Blobbit' }],
    ['www.holohut.kidz', 'fan2', 'THE HOLO HUT - Pocket Monster Card Swap Guide', 'fans', 'Swap values for every holo in Base Set and Jungle, a live swap board and how to spot a fake.',
      { '/': 0, '/base.html': 'Base Set Holos', '/jungle.html': 'Jungle Holos', '/fossil.html': 'Fossil Holos', '/fakes.html': 'Spot a Fake', '/swap.html': 'Swap Board' }],
    ['www.houserobots.cyb', 'fan2', 'HOUSE ROBOT HQ - The Unofficial Robo Rumble Fan Site', 'fans', 'Robo Rumble fan site: the house robots, the arena, the champions and a build-your-own robot fight.',
      { '/': 0, '/house.html': 'The House Robots', '/arena.html': 'The Arena', '/champs.html': 'Champions', '/build.html': 'Build a Robot' }],
    ['www.year3000.cyb', 'fan2', 'GOOD NEWS EVERYONE! The Year 3000 Cartoon Page', 'fans', 'A fan page for Futurarma, the new cartoon from America about a delivery boy frozen on New Year\'s Eve 1999.',
      { '/': 0, '/crew.html': 'The Crew', '/episodes.html': 'Episodes' }],
    ['www.jackfax.jnet', 'fan2', 'JACKFAX - The Text Service on Your Telly', 'news', 'Telly-Text on the Internet! P100 index, P302 football, P470 games and more. Type a page number.',
      { '/': 0 }],
    // ---- the dodgy corner of the 1999 web (all members of The Ring of Fire-and-Glitter; pages in era-sites-dodgy.js)
    ['www.downloadmoreram.w3b', 'dodgy', 'DOWNLOAD MORE RAM!!! FREE!!!', 'weird', 'Computer slow? DOWNLOAD MORE RAM! 16MB, 32MB, 64MB, even 1 GIGABYTE! Totally free! Totally works! (It does not.)', { '/': 0 }, null, 'fg'],
    ['www.y2kscan.netz', 'dodgy', 'Y2K VIRUS SCAN - Is Your PC Infected? FREE ONLINE CHECK', 'weird', 'Is your computer infected with the Millennium Bug? Find out NOW with our FREE online scan!!!', { '/': 0, '/fix.html': 'Fix Now' }, null, 'fg'],
    ['www.backwardscounter.netz', 'dodgy', 'The Hit Counter That Counts BACKWARDS', 'weird', 'Every visit takes one off. When it hits zero... something will happen. Probably.', { '/': 0 }, null, 'fg'],
    ['www.free100mb.webcom', 'dodgy', 'FREE WEB SPACE!!! 100 MB!!! (12 KB)', 'comm', '100 MB of free web space* for your homepage! (*12 KB) No adverts!** (**some adverts)', { '/': 0, '/terms.html': 'Terms', '/mypage.html': 'My Free Page' }, null, 'fg'],
    ['www.ultimatecheatz.w3b', 'dodgy', 'ULTIMATE CHEAT CODES FOR EVERY GAME!!! (ALL REAL!!!)', 'games', 'Every cheat for every game! Unlock everything! 100% real! (0% real.)', { '/': 0 }, null, 'fg'],
    ['www.pokesecretz.kidz', 'dodgy', 'POCKET CRITTERS SECRETZ!!! MewOne Under The Truck And More', 'fans', 'Every playground rumour about Pocket Critters Moss and Puddle, tested by a professional (me). MewOne! Zapablu! The truck!', { '/': 0 }, null, 'fg'],
    ['www.forwardthis.w3b', 'dodgy', 'FORWARD THIS TO 10 PEOPLE OR ELSE!!!', 'weird', 'A chain letter. Read it to the end. Then forward it. Or ELSE. (Or else what? Read it.)', { '/': 0 }, null, 'fg'],
    ['www.framemania.homepagez', 'dodgy', 'FRAME MANIA - Frames Are The Future!!!', 'weird', 'A site built with the amazing new FRAMES technology. Click the menu. Then click it again. Uh oh.', { '/': 0 }, null, 'fg'],
    ['www.nutscapeonly.netz', 'dodgy', 'Best Viewed in Nutscape Navigator', 'weird', 'This site is designed for Nutscape Navigator 4. JackNet Explorer users: you have been warned.', { '/': 0, '/enter.html': 'Enter Anyway' }, null, 'fg'],
    ['www.jackflash-required.cyb', 'dodgy', 'This Site Requires JackFlash', 'weird', 'An amazing multimedia experience! Requires JackFlash 4. And JackWave 7. And JackPlayer G2. And...', { '/': 0 }, null, 'fg'],
    ['www.popupmania.w3b', 'dodgy', 'POP-UP MANIA!!! FREE STUFF!!!', 'weird', 'Free stuff! Prizes! JackOS! So many jackos! (Pop-ups: close them with the X.)', { '/': 0 }, null, 'fg'],
    ['www.fireandglitter.homepagez', 'dodgy', 'The Ring of Fire-and-Glitter', 'comm', 'The webring for the worst sites on JackNet. Flames! Glitter! Pop-ups! Join today!', { '/': 0, '/list.html': 'Member Sites' }, null, 'fg'],
  ];
  const HOST = {}; // host -> its row
  const mk = (host, file, path) => () => {
    const el = document.createElement('div');
    el.className = 'es-wait';
    el.innerHTML = `<p style="font:13px 'Courier New',monospace;padding:18px;margin:0;background:#fff;color:#000;min-height:420px">Contacting host: <b>${host}</b>...<br>Host contacted. Waiting for reply...<br>Transferring data at 4.8 KB/sec...</p>`;
    const t0 = Date.now();
    A.load('js/era-sites-kit.js').then(() => A.load('js/era-sites-' + file + '.js'))
      .then(() => setTimeout(() => { if (el.isConnected || el.parentNode) window.EraSites.render(host, path, el); }, Math.max(0, 250 - (Date.now() - t0))))
      .catch(() => { el.innerHTML = `<div style="padding:18px;font:13px Arial,sans-serif;background:#fff;color:#000;min-height:300px"><h2>The page cannot be displayed</h2><p>The server at <b>${host}</b> took too long to answer. Click <b>Refresh</b>, or try again later. (Mom might be on the phone.)</p></div>`; });
    return el;
  };
  for (const row of SITES) {
    const [host, file, title, cat, desc, paths, dyn] = row;
    HOST[host] = row;
    const pages = {};
    for (const p in paths) pages[p] = { title: paths[p] ? title.replace(/ [-:].*$/, '') + ' - ' + paths[p] : title, html: mk(host, file, p) };
    // dynamic pages (one per story / auction / FAQ): answered on demand, so the list of them can live in the lazy file
    const pg = !dyn ? pages : new Proxy(pages, { get(t, p) { if (typeof p === 'string' && !(p in t) && dyn.test(p)) return { title, html: mk(host, file, p) }; return t[p]; } });
    IE.addSite(host, { title, desc, cat, pages: pg });
  }

  // ---------------------------------------------------------------- secrets
  [['eras.firstpost', 'FIRST POST!!!', 'Be first. Somewhere with comments.'],
    ['eras.mod', 'Moderator', 'Spend a point. Insightful? Troll?'],
    ['eras.melted', 'Jackdotted', 'Some links send so many readers that the server melts'],
    ['eras.bid', 'Going once...', 'Place a bid on a slightly used Eggbert (or anything)'],
    ['eras.snipe', 'Sniper', 'Bid in the very last seconds of an auction'],
    ['eras.baywin', 'Winning bidder', 'Win an auction outright'],
    ['eras.witch', 'What really happened', 'The students left something in the footage. Look closely.'],
    ['eras.grotbo', 'Anything at all', 'At Jackbo you can do anything. Even wait.'],
    ['eras.faq', 'RTFAQ', 'Read the whole walkthrough. Right to the legal bit at the bottom.'],
    ['eras.toon', 'Skip intro', 'Some intros can be skipped'],
    ['eras.moose', 'Robot talk', 'Get the talking robot to say a lot'],
    ['eras.bubble', 'Pop pop pop', 'Pop a whole sheet'],
    ['eras.robot', 'Cease!', 'Build a robot that survives the arena'],
    ['eras.ttx', 'Hidden page', 'Telly-Text has pages that are not in the index'],
    ['eras.ring', 'Round the 1999 Ring', 'Follow the webring all the way back to the start'],
    ['eras.holo', 'Shiny!', 'Find the holo everybody wants'],
    ['eras.ram', 'Downloaded RAM', 'Download some memory. It is free!'],
    ['eras.scam', 'Not falling for it', 'A free online scan offers to fix everything...'],
    ['eras.quota', 'Quota exceeded', 'Use more than all of your free web space'],
    ['eras.frames', 'Frame inside a frame inside a', 'Some sites go very deep'],
    ['eras.nutscape', 'Wrong browser', 'Go in anyway, even though it is best viewed in something else'],
    ['eras.plugins', 'Plug-in collector', 'Install every plug-in a site asks for'],
    ['eras.popups', 'Pop-up blocker (human)', 'Close every pop-up'],
    ['eras.chain', 'Chain breaker', 'Read a chain letter all the way to the end'],
    ['eras.mew', 'Under the truck', 'Push the truck. Everyone says so.'],
    ['eras.zero', 'Counting down', 'Visit the counter that goes the wrong way'],
  ].forEach(s => A.defineSecret(s[0], s[1], s[2]));

  // ---------------------------------------------------------------- Run commands that open a site
  const open = url => { const b = document.getElementById('browser'); if (b) b.classList.remove('min'); const tb = document.getElementById('taskBrowser'); if (tb) tb.hidden = false; IE.navigate(url); };
  [['jackdot', 'www.jackdot.jnet'], ['grotdot', 'www.jackdot.jnet'], ['jackbay', 'www.jackbay.webcom'], ['grotbay', 'www.jackbay.webcom'], ['squigwitch', 'www.squigwitch.cyb'], ['jackbo', 'www.jackbo.netz'], ['grotbo', 'www.jackbo.netz'], ['jackfaqs', 'www.jackfaqs.w3b'], ['grotfaqs', 'www.jackfaqs.w3b'],
    ['newjacks', 'www.newjacks.wubwub'], ['newgrots', 'www.newjacks.wubwub'], ['aintitkoolnews', 'www.aintitkoolnews.infobahn'], ['webtoyz', 'www.webtoyz.kidz'], ['jackfax', 'www.jackfax.jnet'], ['grotfax', 'www.jackfax.jnet'], ['teletext', 'www.jackfax.jnet'], ['ceefax', 'www.jackfax.jnet']]
    .forEach(([c, h]) => A.cmd([c], () => { open('http://' + h + '/'); return true; }));
  window.EraSitesOpen = open;

  // ---------------------------------------------------------------- SQUIGTALK.EXE: the Talking Squig desktop toy (download-only)
  A.register('eras.squigtalk', { single: true, cmd: ['squigtalk', 'squigtalk.exe', 'robotalk', 'robotalk.exe'], open: () => A.load('js/era-sites-kit.js').then(() => A.load('js/era-sites-fan.js')).then(() => window.EraTalk()) });
  A.addProgram(['Accessories', 'Entertainment', 'RoboTalk'], 'eras.squigtalk', '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="7" y="0" width="2" height="2" fill="#ff3020"/><rect x="7" y="2" width="2" height="1" fill="#1a1e2a"/><rect x="0" y="7" width="2" height="4" fill="#1a1e2a"/><rect x="14" y="7" width="2" height="4" fill="#1a1e2a"/><rect x="2" y="3" width="12" height="12" fill="#1a1e2a"/><rect x="3" y="4" width="10" height="10" fill="#c8d0dc"/><rect x="3" y="4" width="10" height="1" fill="#fff"/><rect x="3" y="4" width="1" height="10" fill="#fff"/><rect x="3" y="13" width="10" height="1" fill="#6a7282"/><rect x="12" y="5" width="1" height="9" fill="#6a7282"/><rect x="4" y="6" width="8" height="3" fill="#10141c"/><rect x="5" y="7" width="2" height="1" fill="#30d8ff"/><rect x="9" y="7" width="2" height="1" fill="#30d8ff"/><rect x="5" y="10" width="6" height="2" fill="#10141c"/><rect x="6" y="10" width="1" height="2" fill="#9aa2b2"/><rect x="8" y="10" width="1" height="2" fill="#9aa2b2"/></svg>');
  try { if (window.Setup && Setup.product) Setup.product('squigtalk', { n: 'RoboTalk', v: '1.0', kb: 112, lic: 'Freeware', by: 'Web Toyz', cat: 'fun', sq: 4, rel: '12/06/99',
    d: 'The Talking Robot from Web Toyz, now on your desktop! It pops up every minute with a joke. You cannot turn it off. (You can. There is a tick box.)', note: 'Do not feed the robot. It runs on AA batteries.',
    home: 'http://www.webtoyz.kidz/talk.html', apps: ['eras.squigtalk'], paths: ['Accessories > Entertainment > RoboTalk'], def: false, launch: 'eras.squigtalk', exe: 'SQUIGTLK.EXE', dir: 'SquigTalk' }); } catch (e) { console.error(e); }
})();

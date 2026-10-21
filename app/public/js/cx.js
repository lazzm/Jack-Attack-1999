/* cx: CONTENT pack. Always loaded, small: it only registers things; the words and pages load when they're first needed.
 *  1. JACK ATTACK! BACK ISSUES: twelve monthly issues of 1999 at www.jackattack.jnet/backissues (pages in js/cx-mag*.js).
 *     Each issue is on sale from the 1st of its month; its reviews go up on their games' UK release dates. Every issue
 *     has a competition the server marks (mods/cx.js, 40 Rupees, three prizes a day, Super Reader badge for all twelve).
 *  2. THE CLASS OF '99: new fan sites about real things that happened in 1999, each one appearing on the right date and
 *     changing as the year goes on (pages in js/cx-web*.js; counters, guestbooks and routing come from era-sites-kit.js).
 *     They're all in one webring, THE CLASS OF '99 RING, and the search engines find them (IE.addSite with desc + cat). */
(function () {
  'use strict';
  const A = window.Apps;
  if (!A || !window.IE || !IE.addPage || window.CX) return;
  const esc = A.esc, $ = id => document.getElementById(id);
  const t99 = () => (window.Desk && Desk.today99 ? Desk.today99() : { m: 1, d: 1, md: 101 });
  const mdOf = k => { const [m, d] = String(k).split('-').map(Number); return m * 100 + d; };
  const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const PARTS = ['editorial', 'reviews', 'previews', 'letters', 'cheats', 'poster', 'compo'];
  const PART_NAMES = { editorial: 'Editorial', reviews: 'Reviews', previews: 'Previews', letters: 'Letters', cheats: 'Cheats Corner', poster: 'Poster', compo: 'Competition' };
  const showBrowser = () => { const b = $('browser'); if (b) b.classList.remove('min'); const tb = $('taskBrowser'); if (tb) tb.hidden = false; };
  const open = url => { showBrowser(); IE.navigate(url); };
  const CX = window.CX = { wins: null, open };

  // ================================================================ secrets (ids are stored per user: never rename them)
  [['cx.read', 'Back issue', 'Read an old issue of the magazine'],
    ['cx.collector', 'Collector\'s edition', 'Read six different back issues'],
    ['cx.early', 'Time traveller', 'Try to read an issue before it is in the shops'],
    ['cx.poster', 'Pin-up', 'Put a pull-out poster on your desktop'],
    ['cx.barcode', 'Scanned', 'Barcodes hide things. Check a few.'],
    ['cx.compo', 'And the winner is...', 'Win a magazine competition'],
    ['cx.superreader', 'Super Reader', 'Win every competition of 1999'],
    ['cx.ring', 'Class of \'99', 'Go all the way round a webring about 1999'],
    ['cx.chess', 'Checkmate', 'Find the winning move on a chess page'],
    ['cx.units', 'Metric hero', 'Get the units right where NASA got them wrong'],
    ['cx.eagle', 'The Eagle has landed', 'Land gently on the Moon'],
    ['cx.swirl', 'Spiral power', 'The swirl hides a secret'],
    ['cx.rumour', 'Insider', 'Believe every rumour (then find out which were true)'],
    ['cx.bugsafe', 'Virus-proof', 'Get every answer right in a safety quiz'],
    ['cx.melt', 'Overclocked', 'Push a chip too far'],
    ['cx.douze', 'Douze points', 'Fill in a whole score card'],
    ['cx.sorted', 'Sorted!', 'Take the quiz on a fan page about a school for wizards'],
    ['cx.wonkey', 'Phone-in winner', 'Win a Saturday morning phone-in'],
    ['cx.meteors', 'Shooting star', 'Count fifty meteors'],
    ['cx.lo', 'L... O...', 'Send the very first message'],
    ['cx.wheel', 'Round and round', 'Turn a big wheel all the way round'],
    ['cx.toys', 'To infinity', 'Find every toy hidden on a toy page'],
    ['cx.ace', 'Ace!', 'Win a point at a tennis fan page'],
    ['cx.pitstop', 'Pit stop', 'Change four tyres in record time'],
  ].forEach(s => A.defineSecret(s[0], s[1], s[2]));

  // ================================================================ 1. the back issues (lazy pages)
  const MAGFILE = m => m <= 6 ? 'js/cx-mag-a.js' : 'js/cx-mag-b.js';
  function magPage(word, m, part) {
    return () => {
      const el = document.createElement('div');
      el.innerHTML = `<p style="font:13px 'Courier New',monospace;padding:18px;margin:0;background:#fffbe8;color:#000;min-height:420px">Fetching ${m ? MONTHS[m - 1] + ' 1999' : 'the back issues'} from the archive...<br>Blowing the dust off...</p>`;
      let p = A.load('js/cx-mag.js');
      if (m) p = p.then(() => A.load(MAGFILE(m)));
      p.then(() => {
        if (!el.isConnected && !el.parentNode) return;
        el.innerHTML = m ? CXMag.issue(m, part) : CXMag.archive();
        if (window.Net && Net.send && !CX.asked) { CX.asked = 1; Net.send({ t: 'cxWins' }); }
      }).catch(() => { el.innerHTML = '<div style="padding:18px;background:#fff;color:#000;min-height:300px"><h2>The page cannot be displayed</h2><p>The archive took too long to answer. Click <b>Refresh</b>. (Mom might be on the phone.)</p></div>'; });
      return el;
    };
  }
  IE.addPage('backissues', 'JACK ATTACK! - Back Issues', magPage('backissues', 0));
  IE.addPage('back-issues', 'JACK ATTACK! - Back Issues', magPage('backissues', 0));
  MON.forEach((k, i) => {
    IE.addPage('backissues/' + k, `JACK ATTACK! - ${MONTHS[i]} 1999`, magPage('backissues/' + k, i + 1));
    PARTS.forEach(p => IE.addPage('backissues/' + k + '/' + p, `JACK ATTACK! ${MONTHS[i]} 1999 - ${PART_NAMES[p]}`, magPage('backissues/' + k + '/' + p, i + 1, p)));
  });
  const openArchive = m => open('http://www.jackattack.jnet/backissues' + (m ? '/' + MON[m - 1] : ''));
  CX.openArchive = openArchive;
  A.cmd(['backissues', 'back issues', 'backissue', 'jackattack back issues'], () => { openArchive(); return true; });
  const MAG_ICO = '<svg viewBox="0 0 16 16"><rect x="2" y="1" width="11" height="14" fill="#e10600" stroke="#000"/><rect x="3" y="2.5" width="9" height="3" fill="#ffd400"/><rect x="4" y="7" width="7" height="6" fill="#2a7ad8"/><path d="M13 3h1.5v12H4v-1" fill="none" stroke="#000"/></svg>';
  A.addProgram(['JACK ATTACK!', 'Back Issues'], () => openArchive(), MAG_ICO);

  // a "BACK ISSUES" box on the magazine's own Reviews page (plus one line on the Cheats page)
  function magBox() {
    const rev = document.querySelector('#s-reviews'), ch = document.querySelector('#s-cheats');
    if (rev && !rev.querySelector('.cx-magbox')) {
      const t = t99(), b = document.createElement('div'); b.className = 'win applet cx-magbox';
      const cur = MONTHS[t.m - 1];
      b.innerHTML = `<div class="tb"><span class="t">BACK ISSUES <small>archive.htm</small></span></div><div class="body"><div class="cx-mb"><div class="cx-mb-st" aria-hidden="true">${MON.slice(0, t.m).slice(-4).map((k, i, a) => `<span style="--i:${i};--n:${a.length}"><b>JA!</b><i>${k.toUpperCase()}</i></span>`).join('')}</div><div><b>Missed an issue?</b> Every JACK ATTACK! of 1999 is in the archive: reviews, previews, letters, cheats, a poster and a <b>competition</b> in every one (win Rupees!). The <b>${cur}</b> issue is out now.<div class="row" style="margin-top:6px;gap:6px;flex-wrap:wrap"><a class="btn" href="http://www.jackattack.jnet/backissues/${MON[t.m - 1]}" data-cxopen="${t.m}">Read the ${esc(cur)} issue</a><a class="btn" href="http://www.jackattack.jnet/backissues" data-cxopen="0">All back issues</a></div></div></div></div>`;
      const poll = rev.querySelector('#pollBox'); const anchor = poll ? poll.closest('.win') : null;
      if (anchor) rev.insertBefore(b, anchor); else rev.appendChild(b);
    }
    if (ch && !ch.querySelector('.cx-cheatline')) {
      const p = document.createElement('p'); p.className = 'cx-cheatline';
      p.innerHTML = `<b>MORE CHEATS:</b> every back issue has its own Cheats Corner. <a href="http://www.jackattack.jnet/backissues" data-cxopen="0">Dig through the back issues &raquo;</a>`;
      const k = ch.querySelector('.kicker'); if (k && k.nextSibling) ch.insertBefore(p, k.nextSibling); else ch.appendChild(p);
    }
  }
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('[data-cxopen]'); if (!a) return;
    ev.preventDefault(); try { Sound.play('click'); } catch (e) {} openArchive(+a.dataset.cxopen || 0);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', magBox); else magBox();
  document.addEventListener('section', ev => { if (ev.detail === 'reviews' || ev.detail === 'cheats') magBox(); });

  // What's New on the magazine's home page: a post on the 1st of every month when the new issue comes out, and one when
  // a Class of '99 site turns up (shown from its date; the links open in JackNet Explorer)
  try {
    const CAL = window.CAL = window.CAL || { posts: [], hype: [] };
    const ISSUE_POST = ['Happy New Year! The <b>January</b> issue is out: Rogue Squadron, Worms and a free Solar System poster.', 'The <b>February</b> issue is out! Metal Gear Solid is coming. I am ready. I have a cardboard box.', 'The <b>March</b> issue is out! Mario Party, blisters, and Red Nose Day.', 'The <b>April</b> issue is out! SIX reviews. Easter eggs (the game kind).',
      'The <b>May</b> issue is out! A no-spoiler zone for Star Wars, and a balloon poster.', 'The <b>June</b> issue is out! Podracing, Driver and the car park of DOOM.', 'The <b>July</b> issue is out! Star Wars, the Moon, and the summer holidays.', 'The <b>August</b> issue is out! Eclipse safety poster inside. DON\'T LOOK AT THE SUN.',
      'The <b>September</b> issue is out! Mario Golf, WipEout 3, and how I solve the cube.', 'The <b>October</b> issue is out! The biggest month in games EVER: Pokemon AND a new console.', 'The <b>November</b> issue is out! Smash Bros., Spyro 2 and the Firework Code.', 'The <b>December</b> issue is out! The last issue of the 1900s. Sniff.'];
    ISSUE_POST.forEach((t, i) => CAL.posts.push([String(i + 1).padStart(2, '0') + '-01', 'SITE', `${t} Every back issue has a competition with a Rupee prize. <a href="#" data-cxopen="${i + 1}">Read it here</a>.`]));
    [['01-03', 'Found a brilliant Mars site: two NASA probes are flying there this year! <a href="#" data-cxsite="www.redplanet99.cyb">RED PLANET 99</a>'],
      ['03-02', 'Sony showed off the next PlayStation today! A site with all the rumours: <a href="#" data-cxsite="www.nextgenwatch.netz">NEXT GEN WATCH</a>'],
      ['03-26', 'There\'s a virus called Melissa going round in e-mails. This site explains it properly: <a href="#" data-cxsite="www.bugalert.netz">BUG ALERT!</a>'],
      ['06-21', 'The world chess champion is playing EVERYONE on the Internet at once! <a href="#" data-cxsite="www.worldsmove.cyb">THE WORLD\'S MOVE</a> (there\'s a checkmate puzzle)'],
      ['07-16', '30 years ago today Apollo 11 took off for the Moon. Try to land the Eagle yourself on <a href="#" data-cxsite="www.onesmallstep.infobahn">ONE SMALL STEP</a>. It is HARD.'],
      ['10-01', 'Meteor storm in November? This site says when to look: <a href="#" data-cxsite="www.shootingstars.infobahn">SHOOTING STAR WATCH</a>'],
    ].forEach(([k, t]) => CAL.posts.push([k, 'NET', t]));
  } catch (e) { console.error(e); }
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('[data-cxsite]'); if (!a) return;
    ev.preventDefault(); try { Sound.play('click'); } catch (e) {} open('http://' + a.dataset.cxsite + '/');
  });

  // ================================================================ talking to the server (mods/cx.js)
  if (window.Net && Net.on) {
    Net.on('cxWins', m => { CX.wins = m; document.dispatchEvent(new CustomEvent('cx-wins', { detail: m })); });
    Net.on('cxCompo', m => {
      if (window.CXMag) CXMag.compoResult(m);
      if (m.won && !m.again) setTimeout(() => Net.send({ t: 'cxWins' }), 800);
    });
    Net.on('welcome', () => { CX.asked = 0; });
    Net.on('loginOk', () => setTimeout(() => Net.send({ t: 'cxWins' }), 900));
  }
  // the Super Reader badge (an exclusive JackLoot item; the server hands it out) goes into the loot catalogue in the browser too
  A.load('js/loot-cat.js').then(() => {
    const L = window.LootCat; if (!L || L.ITEM['badge.cx_superreader']) return;
    const it = { id: 'badge.cx_superreader', name: 'Super Reader Badge', r: 3, type: 'badge', art: ['#e10600', '#ffd400', 'JA!'], d: 'Won all twelve JACK ATTACK! competitions of 1999. You read every page. Even the small print.', ex: 1 };
    L.ITEMS.push(it); L.ITEM[it.id] = it;
  }).catch(() => {});

  // ================================================================ 2. THE CLASS OF '99 (new sites, each from its date)
  // host, file, title, cat, desc, { path: page title }, first day it exists (MM-DD)
  const SITES = window.CXSiteList = [
    ['www.classof99ring.homepagez', 'a', 'THE CLASS OF \'99 RING', 'comm', 'A webring of fan sites about the things everyone is talking about in 1999: space, consoles, chips, chess, telly, books and more. Join the ring!', { '/': 0 }, '01-01'],
    ['www.onesmallstep.infobahn', 'a', 'ONE SMALL STEP - Apollo 11 at 30', 'sci', 'It\'s 30 years since people first walked on the Moon (20 July 1969). The story, a countdown to the anniversary, Moon news, and a game: can YOU land the Eagle?', { '/': 0, '/story.html': 'The Story', '/land.html': 'Land the Eagle', '/news.html': 'Moon News' }, '01-01'],
    ['www.redplanet99.cyb', 'a', 'RED PLANET 99 - Mars Mission Watch', 'sci', 'Two NASA probes are on their way to Mars this year: an orbiter and a lander for the south pole. Follow them here, and play Units Patrol.', { '/': 0, '/probes.html': 'The Probes', '/units.html': 'Units Patrol' }, '01-03'],
    ['www.spiralzone.zyne', 'a', 'THE SPIRAL ZONE - UK Dreamcast Fans', 'games', 'Fan news about Sega\'s new 128-bit Dreamcast: out in Japan, coming to Europe. Specs, games, the memory card with a screen, and a countdown.', { '/': 0, '/specs.html': 'Specs', '/games.html': 'Games' }, '01-01'],
    ['www.owlpostfans.kidz', 'a', 'THE OWL POST - A Harry Potter Book Club', 'fans', 'A fan club for the Harry Potter books. Book news, a no-spoilers reading club, the house quiz and a countdown to book three.', { '/': 0, '/books.html': 'The Books', '/quiz.html': 'The House Quiz' }, '01-01'],
    ['www.saturdaytelly.toonz', 'a', 'SATURDAY MORNING TELLY - The Guide', 'fans', 'Everything about Saturday morning telly: SM:TV Live, Live & Kicking, CD:UK, cartoons, the vote for the best show, and a phone-in you can actually win.', { '/': 0, '/phonein.html': 'The Phone-In' }, '01-01'],
    ['www.mhzwars.cyb', 'a', 'MEGAHERTZ WARS - The Chip Race 1999', 'sci', 'Pentium III vs Athlon: the fastest chips you can buy, by date. Plus the Overclock-o-Matic (do not try this at home).', { '/': 0, '/oc.html': 'Overclock-o-Matic' }, '02-26'],
    ['www.nextgenwatch.netz', 'a', 'NEXT GEN WATCH - Console Rumour Mill', 'games', 'Sony\'s next PlayStation, Nintendo\'s "Dolphin", and every rumour going about the consoles of the year 2000. Rated true or false.', { '/': 0, '/rumours.html': 'Rumour Mill' }, '03-02'],
    ['www.pitlane99.cyb', 'b', 'PIT LANE 99 - A Formula One Fan Page', 'news', 'Formula One 1999 from a fan\'s sofa: the title fight, every race, and the Pit Stop Challenge.', { '/': 0, '/pitstop.html': 'Pit Stop Challenge' }, '03-07'],
    ['www.webturns10.jnet', 'b', 'THE WEB TURNS 10 - A History of the Internet for Kids', 'sci', 'In March 1989 a man at CERN wrote a proposal that became the World Wide Web. Ten years on: how the Internet works, where it came from, and the first message ever sent.', { '/': 0, '/history.html': 'History', '/lo.html': 'The First Message' }, '03-12'],
    ['www.bugalert.netz', 'b', 'BUG ALERT! Real Virus News for Kids', 'help', 'Computer viruses are in the news. What they are, the ones going round in 1999, and how to keep your family PC safe. With the Safe or Not? quiz.', { '/': 0, '/quiz.html': 'Safe or Not?' }, '03-26'],
    ['www.nulpoints.wubwub', 'b', 'NUL POINTS! The Eurovision Party Pack 1999', 'fans', 'Everything for your Eurovision party: the score card, how the voting works, and the results.', { '/': 0, '/scores.html': 'Score Card' }, '05-01'],
    ['www.bigwheelwatch.jnet', 'b', 'BIG WHEEL WATCH - The Millennium Wheel', 'news', 'They\'re building a giant wheel by the Thames for the year 2000. Follow it going up.', { '/': 0 }, '06-01'],
    ['www.comeontim.kidz', 'b', 'COME ON TIM! A Wimbledon Fan Page', 'news', 'Strawberries, rain delays and one British hope. A Wimbledon 1999 fan page, with a tennis game.', { '/': 0, '/play.html': 'Play Tennis' }, '06-01'],
    ['www.worldsmove.cyb', 'b', 'THE WORLD\'S MOVE - Kasparov vs The World', 'hobby', 'The world chess champion is playing against EVERYONE on the Internet at once, one move a day by vote. Follow the game and try our checkmate puzzle.', { '/': 0, '/puzzle.html': 'Checkmate Puzzle' }, '06-21'],
    ['www.toystory2watch.flick', 'b', 'TOY STORY 2 WATCH - The Toys Are Back', 'fans', 'The sequel to the first ever all-computer film is coming. Release dates, how computer animation works, and a hunt for hidden toys.', { '/': 0, '/hunt.html': 'Toy Hunt' }, '10-01'],
    ['www.shootingstars.infobahn', 'b', 'SHOOTING STAR WATCH - The Leonids 1999', 'sci', 'In November the Earth goes through a trail of comet dust and there could be a meteor STORM. When to look, where, and a meteor counter.', { '/': 0, '/count.html': 'Meteor Counter' }, '10-01'],
  ];
  const live = () => SITES.filter(r => mdOf(r[6]) <= t99().md);
  CX.liveSites = live; CX.mdOf = mdOf;
  const mk = (host, file, path) => () => {
    const el = document.createElement('div');
    el.innerHTML = `<p style="font:13px 'Courier New',monospace;padding:18px;margin:0;background:#fff;color:#000;min-height:420px">Contacting host: <b>${esc(host)}</b>...<br>Host contacted. Waiting for reply...<br>Transferring data at 3.6 KB/sec...</p>`;
    const t0 = Date.now();
    A.load('js/era-sites-kit.js').then(() => A.load('js/cx-web.js')).then(() => A.load('js/cx-web-' + file + '.js'))
      .then(() => setTimeout(() => { if (el.isConnected || el.parentNode) window.EraSites.render(host, path, el); }, Math.max(0, 250 - (Date.now() - t0))))
      .catch(() => { el.innerHTML = `<div style="padding:18px;font:13px Arial,sans-serif;background:#fff;color:#000;min-height:300px"><h2>The page cannot be displayed</h2><p>The server at <b>${esc(host)}</b> took too long to answer. Click <b>Refresh</b>, or try again later.</p></div>`; });
    return el;
  };
  for (const row of live()) {
    const [host, file, title, cat, desc, paths] = row, pages = {};
    for (const p in paths) pages[p] = { title: paths[p] ? title.replace(/ [-:].*$/, '') + ' - ' + paths[p] : title, html: mk(host, file, p) };
    IE.addSite(host, { title, desc, cat, pages });
  }
  [['classof99', 'www.classof99ring.homepagez'], ['apollo11', 'www.onesmallstep.infobahn'], ['mars99', 'www.redplanet99.cyb'], ['spiralzone', 'www.spiralzone.zyne'], ['owlpost', 'www.owlpostfans.kidz'],
    ['telly', 'www.saturdaytelly.toonz'], ['mhzwars', 'www.mhzwars.cyb'], ['nextgen', 'www.nextgenwatch.netz'], ['pitlane', 'www.pitlane99.cyb'], ['webturns10', 'www.webturns10.jnet'],
    ['bugalert', 'www.bugalert.netz'], ['nulpoints', 'www.nulpoints.wubwub'], ['bigwheel', 'www.bigwheelwatch.jnet'], ['comeontim', 'www.comeontim.kidz'], ['worldsmove', 'www.worldsmove.cyb'],
    ['toystory2', 'www.toystory2watch.flick'], ['leonids', 'www.shootingstars.infobahn']]
    .forEach(([c, h]) => A.cmd([c], () => { open('http://' + h + '/'); return true; }));
})();

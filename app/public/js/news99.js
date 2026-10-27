/* news99: WHAT EVERYONE WAS TALKING ABOUT IN 1999. Little topical fan sites for the stuff the whole country went on
 * about (the eclipse, the euro, the Dome, the charts, the playground crazes, the big quiz show, space, sport, films),
 * each one changing with the date (before / during / after), plus Jack's own posts about them on the right days and a
 * "1999 links" box on the magazine's Cool Links page. Facts are UK dates and were all checked. Positive stuff only.
 * This always-loaded part registers the sites, the secrets, the What's New posts and the links box; the page bodies
 * live in js/news99-a.js (eclipse, euro, dome, crazes) and js/news99-b.js (pop, quiz, space, sport, films).
 *   www.totality99.cyb      TOTALITY! the eclipse countdown + pinhole viewer how-to
 *   www.eurowatch.kidz      EURO WATCH: money news for kids + a lira/franc/mark converter
 *   www.domewatch.jnet      DOME WATCH: the Greenwich building diary with a Dome-o-meter
 *   www.popgossip.kidz      POP GOSSIP!: the number one this week and the Gossip Ten
 *   www.crazewatch.kidz     CRAZE WATCH: what's hot and what's not in the playground (follows the date)
 *   www.jackmillionaire.kidz  JACK WANTS TO BE A MILLIONAIRE: a quiz show fan page with its own playable quiz
 *   www.jackspacenews.cyb   JACK'S LAUNCH PAD: space news, launches on their dates
 *   www.sportsdesk.netz     THE SPORTS DESK: results in plain text
 *   www.popcorn99.cyb       THE POPCORN COUNTDOWN: UK cinema release dates and the buzz */
(function () {
  'use strict';
  const A = window.Apps;
  if (!A || !window.IE || !IE.addSite || window.N99) return;
  const esc = A.esc, store = A.store;
  const pad = n => String(n).padStart(2, '0');
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const t99 = () => (window.Desk && Desk.today99 ? Desk.today99() : (() => { const n = new Date(); let m = n.getMonth() + 1, d = n.getDate(); if (m === 2 && d === 29) d = 28; return { m, d, md: m * 100 + d, date: new Date(1999, m - 1, d) }; })());
  const mdOf = k => { const [m, d] = String(k).split('-').map(Number); return m * 100 + d; };
  const dayNo = k => { const [m, d] = String(k).split('-').map(Number); return Math.round((new Date(1999, m - 1, d) - new Date(1999, 0, 1)) / 864e5); };
  const keyOf = n => { const dt = new Date(1999, 0, 1 + n); return pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); };
  const nice = k => { const [m, d] = String(k).split('-').map(Number); return d + ' ' + MONTHS[m - 1]; };
  const short = k => { const [m, d] = String(k).split('-').map(Number); return pad(d) + '/' + pad(m) + '/99'; };
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const secret = id => { try { A.secret(id); } catch (e) {} };
  const sfx = n => { try { if (window.Sound) Sound.play(n); } catch (e) {} };
  const CSSDONE = {};
  function css(id, text) { if (CSSDONE[id]) return; CSSDONE[id] = 1; const s = document.createElement('style'); s.id = 'n99-css-' + id; s.textContent = text; document.head.appendChild(s); }
  const open = url => { const b = document.getElementById('browser'); if (b) b.classList.remove('min'); const tb = document.getElementById('taskBrowser'); if (tb) tb.hidden = false; IE.navigate(url); };

  // ================================================================ the mates (they leave comments all over these sites)
  const MATES = { 'Jack': '#c00000', 'JackK': '#0050c0', 'Callum': '#007a3a', 'Luke': '#8a3ab0', 'Dave': '#b05a00' };

  // ================================================================ routing + the shared bits the page files use
  const R = {}; // host -> { path: fn(c) -> html }
  const N = window.N99 = {
    R, css, esc, store, pad, mdOf, dayNo, keyOf, nice, short, hash, secret, sfx, open, MATES, MONTHS, DAYS, t99,
    def(host, path, fn) { (R[host] = R[host] || {})[path] = fn; },
    // a context for one page view: today, countdowns, after-render hooks
    ctx(host, path, el) {
      const t = t99(), key = pad(t.m) + '-' + pad(t.d), n = dayNo(key);
      const c = {
        t, key, n, md: t.md, host, path, el, after: [],
        url: p => 'http://' + host + (p || '/'),
        until: k => dayNo(k) - n, // days until k (negative = it's been)
        past: k => mdOf(k) <= t.md, // k is today or before
        between: (a, b) => mdOf(a) <= t.md && t.md <= mdOf(b),
        q: s => el.querySelector(s), qa: s => Array.from(el.querySelectorAll(s)),
        long: `${DAYS[t.date.getDay()]} ${t.d} ${MONTHS[t.m - 1]} 1999`,
      };
      return c;
    },
    // "Days to go" phrasing: before / on the day / after
    countdown(c, k, name, after) {
      const u = c.until(k);
      if (u > 1) return `<b class="n99-cd">${u}</b> days to go until ${name}!`;
      if (u === 1) return `<b class="n99-cd">TOMORROW!!!</b> ${name} is tomorrow!`;
      if (u === 0) return `<b class="n99-cd n99-blink">TODAY!!!</b> ${name} is TODAY!`;
      return after || `${name} was on ${nice(k)}. It's been ${-u} day${u === -1 ? '' : 's'}.`;
    },
    // what Jack and his mates said, newest first (only the ones that have happened by "today")
    mates(c, rows, title, max) {
      const list = rows.filter(r => mdOf(r[0]) <= c.md).sort((a, b) => mdOf(b[0]) - mdOf(a[0])).slice(0, max || 5);
      if (!list.length) return '';
      return `<div class="n99-mates"><b class="n99-mh">${esc(title || 'SHOUTBOX')}</b>${list.map(([k, who, txt]) => `<div class="n99-me"><small>${short(k)}</small> <b style="color:${MATES[who] || '#333'}">${esc(who)}:</b> ${txt}</div>`).join('')}</div>`;
    },
    counter(c, base, perDay) { const v = base + Math.max(0, c.n) * (perDay || 7) + (hash(c.host + c.key) % 9); return `<span class="n99-ctr">${String(v).padStart(6, '0').split('').map(x => `<i>${x}</i>`).join('')}</span>`; },
    foot(c, by, extra) { return `<div class="n99-foot">${extra || ''}<p>You are visitor number ${N.counter(c, 1200 + hash(c.host) % 4000, 3 + hash(c.host) % 9)}</p><p>${esc(by)} &middot; Last updated ${short(c.key)} &middot; Best viewed at 800x600</p></div>`; },
  };

  css('kit', `
.n99{margin:0;min-height:max(560px,calc(100vh - 200px));position:relative;overflow:hidden;overflow-wrap:anywhere;color:#000;background:#fff;font:13px/1.45 Arial,Helvetica,sans-serif;box-sizing:border-box}
.n99 *{box-sizing:border-box}
.n99 a{cursor:pointer}
.n99 svg,.n99 canvas{max-width:100%}
.n99-wait{font:13px "Courier New",monospace;padding:18px;margin:0;background:#fff;color:#000;min-height:420px}
.n99-cd{font-size:1.25em}
.n99-blink{animation:n99blink 1s steps(2) infinite}
@keyframes n99blink{50%{visibility:hidden}}
.n99-mates{max-width:560px;margin:14px auto;background:#fffff0;border:2px solid #000;box-shadow:3px 3px 0 rgba(0,0,0,.4);padding:6px 8px;text-align:left;color:#000;font:12px/1.4 Verdana,Arial,sans-serif}
.n99-mh{display:block;font:bold 12px Verdana,sans-serif;border-bottom:1px solid #000;margin:0 0 4px;padding-bottom:2px}
.n99-me{padding:3px 0;border-bottom:1px dotted #999}.n99-me:last-child{border-bottom:0}
.n99-me small{color:#666}
.n99-ctr{display:inline-flex;gap:1px;padding:2px;background:#000;border:2px inset #888;vertical-align:middle}
.n99-ctr i{font:bold 13px/1 "Courier New",monospace;color:#3f3;background:#031;padding:2px 3px;font-style:normal}
.n99-foot{text-align:center;font:11px Arial,sans-serif;margin:16px 0 4px;padding:0 8px 8px}
.n99-foot p{margin:5px 0}
.n99-btn{font:12px Tahoma,Arial,sans-serif;min-height:28px;padding:2px 12px;background:#c0c0c0;color:#000;border:2px outset #fff;cursor:pointer}
.n99-btn:active{border-style:inset}
.n99-btn:disabled{color:#808080}
.n99-new{display:inline-block;font:bold 10px Arial,sans-serif;color:#fff;background:#e10600;padding:0 4px;transform:rotate(-6deg);animation:n99blink .8s steps(2) infinite}
.tag-SPORT{background:#0a7a2a;color:#fff}
.n99-lbox{margin:0 0 16px}
.n99-lbox h3{margin:0 0 6px}
.n99-lbox ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px 14px}
.n99-lbox li{padding:4px 0 4px 20px;position:relative;border-bottom:1px dotted #999}
.n99-lbox li::before{content:"";position:absolute;left:2px;top:7px;width:12px;height:12px;background:radial-gradient(circle at 35% 35%,#fff7a0,#f0a000 60%,#a04000);border-radius:50%}
.n99-lbox a{font-weight:bold;color:#0000ee}
.n99-lbox small{display:block;font-size:12px;color:#444}
@media (max-width:600px){.n99{font-size:13px}}
`);

  // ================================================================ the sites
  // host, file, title, cat, desc, { path: page title }
  const SITES = N.SITES = [
    ['www.totality99.cyb', 'a', 'TOTALITY! The 1999 Eclipse Countdown', 'sci', 'A fan-made countdown to the total eclipse of the Sun on 11 August 1999. Where to see it, how to make a pinhole viewer, and DON\'T LOOK AT THE SUN.',
      { '/': 0, '/pinhole.html': 'Make a Pinhole Viewer', '/where.html': 'Where To See It', '/faq.html': 'Eclipse FAQ' }],
    ['www.eurowatch.kidz', 'a', 'EURO WATCH - Money News for Kids', 'news', 'The euro started on 1 January 1999 in eleven countries! What is it, who has it, and how many lira is your pocket money? With a converter.',
      { '/': 0, '/countries.html': 'The Euro Eleven', '/convert.html': 'Pocket Money Converter' }],
    ['www.domewatch.jnet', 'a', 'DOME WATCH - The Greenwich Building Diary', 'news', 'The giant Millennium Dome is being finished by the river in Greenwich. A building diary, a Dome-o-meter and the facts (365 metres! 12 masts!).',
      { '/': 0, '/diary.html': 'The Diary', '/facts.html': 'Dome Facts' }],
    ['www.popgossip.kidz', 'b', 'POP GOSSIP! The Weekly Chart Chat', 'fans', 'Who is number one this week, the Gossip Ten, every number one of 1999 so far and a vote for YOUR number one. Stools, key changes and four exclamation marks.',
      { '/': 0, '/no1s.html': 'Number Ones of 1999', '/vote.html': 'Your Number One' }],
    ['www.crazewatch.kidz', 'a', 'CRAZE WATCH - What\'s Hot In The Playground', 'fun', 'Yo-yos? Furbos? Pocket Critters cards? Beanies? The playground hot-or-not list, updated every week by kids who know. Vote on the crazes!',
      { '/': 0, '/history.html': 'Craze History', '/vote.html': 'Hot or Not?' }],
    ['www.jackmillionaire.kidz', 'b', 'JACK WANTS TO BE A MILLIONAIRE (a fan page)', 'fun', 'A fan page for the quiz show the whole country is watching. Play our own 15-question quiz with three lifelines. Final answer?',
      { '/': 0, '/play.html': 'Play the Quiz', '/facts.html': 'Show Facts' }],
    ['www.jackspacenews.cyb', 'b', 'JACK\'S LAUNCH PAD - Space News 1999', 'sci', 'Space news from 1999: shuttle launches, the space station, comet catchers, meteor storms and a balloon that went all the way round the world.',
      { '/': 0, '/launches.html': 'Launch Log 1999', '/sky.html': 'Sky Watch' }],
    ['www.sportsdesk.netz', 'b', 'THE SPORTS DESK - Results in Plain Text', 'news', 'Sport results in plain text, the old-fashioned way. Football, cricket, rugby, tennis, Formula One. Fast to load on a 28.8 modem.',
      { '/': 0, '/treble.html': 'The Treble', '/calendar.html': 'Sport Calendar 1999' }],
    ['www.popcorn99.cyb', 'b', 'THE POPCORN COUNTDOWN - Films Coming Soon (UK)', 'fans', 'Every big film of 1999 with its UK cinema date, a countdown and the buzz from the playground. Is it out yet? Is it any good? (Ask Luke.)',
      { '/': 0, '/dates.html': 'UK Release Dates', '/ticket.html': 'Ticket Stub' }],
  ];
  const mk = (host, file, path) => () => {
    const el = document.createElement('div');
    el.className = 'n99';
    el.innerHTML = `<p class="n99-wait">Contacting host: <b>${host}</b>...<br>Host contacted. Waiting for reply...<br>Transferring data at 3.6 KB/sec...</p>`;
    const t0 = Date.now();
    A.load('js/news99-' + file + '.js')
      .then(() => setTimeout(() => N.render(host, path, el), Math.max(0, 220 - (Date.now() - t0))))
      .catch(() => { el.innerHTML = `<div style="padding:18px;font:13px Arial,sans-serif;background:#fff;color:#000;min-height:300px"><h2>The page cannot be displayed</h2><p>The server at <b>${host}</b> is not answering. Click <b>Refresh</b>, or try again later. (Mom might be on the phone.)</p></div>`; });
    return el;
  };
  N.render = (host, path, el) => {
    const fn = R[host] && R[host][path];
    if (!fn) { el.innerHTML = '<p class="n99-wait">404 Not Found. The page has gone for a walk.</p>'; return; }
    const c = N.ctx(host, path, el);
    try { el.innerHTML = fn(c); c.after.forEach(f => f()); }
    catch (e) { console.error(e); el.innerHTML = '<p class="n99-wait">This page has a bug in it. (Not the Millennium Bug. A normal one.)</p>'; }
    N.visited(host);
  };
  for (const [host, file, title, cat, desc, paths] of SITES) {
    const pages = {};
    for (const p in paths) pages[p] = { title: paths[p] ? title.replace(/ [-:!].*$/, '') + ' - ' + paths[p] : title, html: mk(host, file, p) };
    IE.addSite(host, { title, desc, cat, pages });
  }
  N.visited = host => { const v = store.get('jhp_n99_seen', []); if (!v.includes(host)) { v.push(host); store.set('jhp_n99_seen', v); } if (SITES.every(s => v.includes(s[0]))) secret('n99.reader'); };

  // ================================================================ secrets
  [['n99.pinhole', 'Pinhole pro', 'Make a safe Sun viewer out of a cereal box'],
    ['n99.sun', 'Safety first!', 'Try to look straight at the Sun. (Go on. Somebody will stop you.)'],
    ['n99.euro', 'Bureau de change', 'Turn your pocket money into a foreign currency (and back)'],
    ['n99.dome', 'Twelve masts', 'Count every mast on the big tent by the river'],
    ['n99.craze', 'Trendsetter', 'Say what is hot and what is not, for every craze'],
    ['n99.no1', 'Chart topper', 'Pick your own number one'],
    ['n99.million', 'MILLIONAIRE!', 'Answer all fifteen. Final answer.'],
    ['n99.friend', 'Ring a Mate', 'Ring one of Jack\'s mates for help (he will not know the answer)'],
    ['n99.liftoff', 'We have liftoff!', 'Press the big red button at the launch pad'],
    ['n99.treble', 'The Treble', 'Read about the three trophies, after the third one is won'],
    ['n99.ticket', 'Admit one', 'Tear off a cinema ticket stub'],
    ['n99.reader', 'Read all about it', 'Visit every site in the 1999 links box on Cool Links'],
  ].forEach(s => A.defineSecret(s[0], s[1], s[2]));

  // ================================================================ Run commands
  [['eclipse', 'www.totality99.cyb'], ['totality', 'www.totality99.cyb'], ['euro', 'www.eurowatch.kidz'], ['dome', 'www.domewatch.jnet'], ['domewatch', 'www.domewatch.jnet'],
    ['popgossip', 'www.popgossip.kidz'], ['crazewatch', 'www.crazewatch.kidz'], ['millionaire', 'www.jackmillionaire.kidz'], ['launchpad', 'www.jackspacenews.cyb'],
    ['sportsdesk', 'www.sportsdesk.netz'], ['popcorn', 'www.popcorn99.cyb']]
    .forEach(([c, h]) => A.cmd([c], () => { open('http://' + h + '/'); return true; }));

  // ================================================================ links that open a fake site from anywhere (What's New, the links box)
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('a[data-n99]'); if (!a) return;
    ev.preventDefault(); open(a.getAttribute('data-n99'));
  });
  const L = (host, text) => `<a href="#" data-n99="http://${host}/">${text}</a>`;
  N.L = L;
  // ================================================================ What's New posts + countdowns (merged into window.CAL like timeline.js does)
  N.addPosts = (posts, hype) => {
    const CAL = window.CAL = window.CAL || { posts: [], hype: [] };
    const plain = h => String(h).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const have = new Set(CAL.posts.map(p => p[0] + plain(p[2])));
    (posts || []).forEach(p => { if (!have.has(p[0] + plain(p[2]))) CAL.posts.push(p); });
    const hk = new Set(CAL.hype.map(h => h[0] + plain(h[1])));
    (hype || []).forEach(h => { if (!hk.has(h[0] + plain(h[1]))) CAL.hype.push(h); });
    try { if (document.readyState === 'complete' && window.Desk && Desk.refreshNews && document.getElementById('news')) Desk.refreshNews(); /* only when loaded late: otherwise the page renders after us */ } catch (e) {}
  };
  N.POSTS = [
    ['01-04', 'NET', `The euro had its first day of trading: one euro = about <b>71p</b>. Found a site that explains it all for kids: ${L('www.eurowatch.kidz', 'EURO WATCH')}. How many lira is a Mars bar? LOTS.`],
    ['01-12', 'TV', `Mom shouted "FINAL ANSWER" at the telly so loudly the dog left the room. <b>Who Wants to Be a Squillionaire?</b> is the only programme she won't let anyone talk during. My mate Jack (JackK on JackNet) has made a whole ${L('www.jackmillionaire.kidz', 'fan page with a quiz')}.`],
    ['01-20', 'SPACE', `Started a countdown for the <b>total eclipse</b> on 11 August. ${L('www.totality99.cyb', 'TOTALITY!')} is the best eclipse site on the whole Internet. It has a picture of the Moon creeping across the Sun that moves every day.`],
    ['01-25', 'NET', `Found ${L('www.domewatch.jnet', 'DOME WATCH')}: a man who goes past the Millennium Dome on the bus every day and writes about it. It's 365 metres across. One metre for every day of the year!`],
    ['02-10', 'TOYS', `New favourite site: ${L('www.crazewatch.kidz', 'CRAZE WATCH')}. It tells you what's hot in the playground. Yo-yos: going cold. Furbos: cooling. Eggberts: dead. Literally.`],
    ['03-01', 'SPACE', `Two men set off in a giant balloon today to fly all the way round the world without stopping. Nobody's ever done it. Following it on my space page, ${L('www.jackspacenews.cyb', "JACK'S LAUNCH PAD")}!`],
    ['03-09', 'TV', "Over <b>19 million</b> people watched <b>Who Wants to Be a Squillionaire?</b> on Sunday. Mom says that's a third of the country. Dad says he only watched it for the questions. Dad watched it for the dramatic music."],
    ['03-21', 'SPACE', `<b>THE BALLOON MADE IT!!!</b> Breitlung Orbiter 3 went all the way round the world non-stop and landed in Egypt after nearly 20 days. Bertram Piccaro and Brian Jonas are heroes. ${L('www.jackspacenews.cyb', 'Full story on my Launch Pad')}.`],
    ['04-08', 'TV', "<b>Z Club 7</b> have got their own show on CBBC: <i>Mallorca 7</i>. They haven't even released a song yet. They just live in Miami and sing. Our holiday was a caravan."],
    ['04-12', 'TV', "My little cousin is OBSESSED with <b>Rob the Builder</b>, which started on the BBQ today. 'Can we fix it?' 'Yes we can!' He tried to fix our video recorder. It is now a different shape."],
    ['05-14', 'NET', `A new tube station opened right next to the Millennium Dome: North Greenwich. ${L('www.domewatch.jnet', 'DOME WATCH')} has gone mad about it. Also the <b>Cricket World Cup</b> started today in England. Dad has cleared his diary.`],
    ['05-16', 'SPORT', `Mancake United won the league on the last day! Dave's dad says the Treble is on. FA Cup final on Saturday, European Cup final on Wednesday. Results: ${L('www.sportsdesk.netz', 'THE SPORTS DESK')} (plain text, loads in two seconds, Dad loves it).`],
    ['05-22', 'SPORT', "FA Cup final: Mancake United 2, Newcastel 0. That's the Double. One more on Wednesday for the Treble. Dave's dad is not sleeping."],
    ['06-01', 'FILMS', `Countdown to The Modemtrix: 10 days. Countdown to Episode I: 45 days. Countdown to Toy Storey 2: don't ask. ${L('www.popcorn99.cyb', 'THE POPCORN COUNTDOWN')} has every UK date, because America gets everything first.`],
    ['06-14', 'MUSIC', `<b>Z Club 7</b>'s first single went straight to number one. ${L('www.popgossip.kidz', 'POP GOSSIP!')} called it back in April. Mom reads Pop Gossip more than I do now. That's my modem time, Mom.`],
    ['07-01', 'NET', "The Queen opened the new <b>Scottish Parliament</b> in Edinburgh today. The Welsh Assembly opened in May. Dad says it's history happening. I said so is Pocket Critters coming out in October. He did not agree."],
    ['07-04', 'SPORT', "Wimbledon final: <b>Pete Samprass</b> beat Andre Agassy for his SIXTH Wimbledon. Tim Hen-man got to the semis again. Mom says next year. Mom says that every year."],
    ['07-11', 'SPORT', "<b>David Coalhard</b> won the British Grand Prix at Silverstone! Played the F1 game on the PlaySpace afterwards. Came last. The car was fine, it was the driver."],
    ['07-20', 'SPACE', "Columbia's launch was stopped at <b>T-minus 7 seconds</b> today because the computers spotted too much hydrogen. SEVEN SECONDS. I'd have been so annoyed. Eileen Collinz is going to be the first woman to command a Space Shuttle."],
    ['07-26', 'SPACE', `Made my pinhole eclipse viewer from the instructions on ${L('www.totality99.cyb', 'TOTALITY!')}. You need a cereal box. We had to eat a whole box of cornflakes first. It's science.`],
    ['08-02', 'TOYS', `${L('www.crazewatch.kidz', 'CRAZE WATCH')} says eclipse glasses are now officially a CRAZE. Everybody has a pair. Dave wears his to look cool. He can't see anything. He walked into a bin.`],
    ['09-02', 'TOYS', "Craze report: since the Beany Bobbles news, my cousin's Beany Bobbles collection has its own shelf AND a 'do not touch' sign. Eleven new ones in one weekend."],
    ['10-01', 'SPORT', "The <b>Rugby World Cup</b> starts today in Wales, at the brand new Millennium Stadium in Cardiff. It has a roof that closes! Imagine if our school had a roof that closed. It does. It's just a normal roof."],
    ['10-25', 'MUSIC', "Stairs have a new album out today, <i>Stairtacular</i>. Mom bought it at lunchtime. Mom has done the Tragedy hands at the dinner table. Again."],
    ['10-31', 'SPORT', "Mika Hackinen won in Japan and he's the Formula One World Champion again! Two years running. Callum says he's the Flying Finn. Callum read that somewhere."],
    ['11-06', 'SPORT', "Rugby World Cup final in Cardiff: <b>Australia 35, France 12</b>. Australia have now won the cricket AND the rugby world cups this year. Leave some for everyone else!"],
    ['11-12', 'FILMS', `<i>The Sixth Scents</i> is out here. Luke went. Luke knows the ending and WON'T TELL. Luke is the most trustworthy person I know. ${L('www.popcorn99.cyb', 'Popcorn Countdown')} says the same.`],
    ['12-07', 'TECH', "Mom has been buying the <b>Millennium stamps</b> all year: four new ones every month, 48 in all, and today's are the last set. They're in an album. I'm not allowed to post a letter with any of them. What are STAMPS for, Mom?"],
    ['12-11', 'TV', "The last ever series of <b>Gladiolas</b> started tonight. Dad says he could do the Travelator. Dad gets out of breath on the stairs."],
    ['12-22', 'NET', `The whole new Jubilee line is finished, all the way to the Dome! ${L('www.domewatch.jnet', 'DOME WATCH')}'s Dome-o-meter says 98%. Nine days left!!!`],
    ['12-31', 'NET', "The Millennium Dome opens TONIGHT, with the Queen there and fireworks on the river. We're watching it on the telly at Dave's before the big countdown. Everyone else gets in from tomorrow."],
  ];
  N.HYPE = [
    ['05-16', 'the last day of the football season', 5],
    ['05-26', 'the <b>European Cup final</b> (THE TREBLE?)', 4],
    ['10-01', 'the <b>Rugby World Cup</b> in Wales', 7],
    ['11-12', '<b>The Sixth Scents</b> (Luke is going)', 5],
    ['12-31', 'the <b>Millennium Dome</b> opening night', 20],
  ];
  N.addPosts(N.POSTS, N.HYPE);

  // ================================================================ "1999 links" box on the magazine's Cool Links page
  const LINKS = [
    ['www.totality99.cyb', 'TOTALITY! Eclipse Countdown', 'Everything about the eclipse. Made a pinhole viewer from it. It works!'],
    ['www.eurowatch.kidz', 'EURO WATCH', 'The new money. How many lira is a Mars bar?'],
    ['www.domewatch.jnet', 'DOME WATCH', 'The giant tent in Greenwich. Is it finished yet? (No.)'],
    ['www.popgossip.kidz', 'POP GOSSIP!', 'Who\'s number one. Mom checks it more than I do.'],
    ['www.crazewatch.kidz', 'CRAZE WATCH', 'What\'s hot in the playground this week. Vote!'],
    ['www.jackmillionaire.kidz', 'Jack Wants To Be A Millionaire', 'JackK\'s quiz fan page. I got to 32,000. Phoned Dave. Mistake.'],
    ['www.jackspacenews.cyb', 'JACK\'S LAUNCH PAD', 'MY space news page! Launches, balloons, meteor storms. 3, 2, 1...'],
    ['www.sportsdesk.netz', 'THE SPORTS DESK', 'Results in plain text, for Dad. Loads in 2 seconds.'],
    ['www.popcorn99.cyb', 'THE POPCORN COUNTDOWN', 'When films come out HERE, not in America.'],
  ];
  function linksBox() {
    const b = document.getElementById('linksBody');
    if (!b || b.querySelector('.n99-lbox') || b.querySelector('.sitewait')) return false;
    const box = document.createElement('div');
    box.className = 'sbox y n99-lbox';
    const seen = store.get('jhp_n99_seen', []);
    box.innerHTML = `<h3>1999 LINKS: WHAT EVERYONE'S TALKING ABOUT</h3><p class="note99" style="margin:0 0 8px">The stuff Mom, Dad, the telly AND the playground keep going on about. Read the lot and you'll know everything. (Tick = you've been.)</p>
      <ul>${LINKS.map(([h, t, d]) => `<li><a href="#" data-n99="http://${h}/">${esc(t)}</a>${seen.includes(h) ? ' &#10003;' : ''}<small>${esc(d)}</small><small style="color:#888">http://${h}/</small></li>`).join('')}</ul>`;
    const after = b.querySelector('.teefbanner');
    if (after && after.nextSibling) b.insertBefore(box, after.nextSibling); else b.insertBefore(box, b.firstChild);
    return true;
  }
  let lbTimer = 0;
  document.addEventListener('section', ev => {
    if (String(ev.detail) !== 'links') return;
    clearInterval(lbTimer); let tries = 0;
    lbTimer = setInterval(() => { if (linksBox() || ++tries > 40) clearInterval(lbTimer); }, 150);
  });
})();
